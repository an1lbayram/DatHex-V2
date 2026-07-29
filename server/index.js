const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { spawn, exec } = require('child_process');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const notifier = require('node-notifier');
const cron = require('node-cron');
const fs = require('fs');

const app = express();
const server = http.createServer(app);

// Whitelist of allowed origins. The production client URL can be supplied via
// the ALLOWED_ORIGIN env var (comma-separated list supported).
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS;

function isOriginAllowed(origin) {
  // Requests with no origin (e.g. same-origin, curl, server-to-server) are allowed.
  if (!origin) return true;
  return ALLOWED_ORIGINS.includes(origin);
}

const io = new Server(server, {
  cors: {
    origin: (origin, callback) => {
      if (isOriginAllowed(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST']
  }
});

app.use(cors({
  origin: (origin, callback) => {
    if (isOriginAllowed(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }
}));
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for local web app to allow inline styles/scripts and external fonts
}));
app.use(express.json());

// --- Simple in-memory rate limiter (per IP/socket, N requests per minute) ---
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60; // per IP for HTTP /api/*
const SOCKET_RATE_LIMIT_MAX_EVENTS = 20; // per socket per window for socket events

function createRateLimiter(maxRequests, windowMs) {
  const hits = new Map(); // key -> { count, resetAt }
  // Periodically clean up stale entries so the map doesn't grow forever.
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) {
      if (now > entry.resetAt) hits.delete(key);
    }
  }, windowMs).unref();

  return function isAllowed(key) {
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    return entry.count <= maxRequests;
  };
}

const isHttpRequestAllowed = createRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);
const isSocketEventAllowed = createRateLimiter(SOCKET_RATE_LIMIT_MAX_EVENTS, RATE_LIMIT_WINDOW_MS);

app.use('/api', (req, res, next) => {
  if (!isHttpRequestAllowed(req.ip)) {
    return res.status(429).json({ error: 'Too many requests, please slow down.' });
  }
  next();
});

// Whitelist for winget package IDs: letters, digits, dot, dash, underscore.
const WINGET_ID_REGEX = /^[\w.\-]+$/;
function isValidWingetId(id) {
  return typeof id === 'string' && id.length > 0 && id.length <= 200 && WINGET_ID_REGEX.test(id);
}

// Whitelist for search queries: letters (incl. accented), digits, spaces, dash, dot, underscore.
const SEARCH_QUERY_REGEX = /^[\p{L}\p{N} .\-_]+$/u;
function isValidSearchQuery(query) {
  return typeof query === 'string' && query.length > 0 && query.length <= 200 && SEARCH_QUERY_REGEX.test(query);
}

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../client/dist')));

const PORT = 3001;

const cache = {
  check: { data: null, timestamp: 0 },
  list: { data: null, timestamp: 0 }
};
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Helper to parse winget upgrade output
function parseWingetOutput(output) {
  if (!output) return { apps: [], raw: '' };
  const lines = output.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  // Find the separator line "-----------------------------"
  const separatorIndex = lines.findIndex(line => line.match(/^-{20,}$/));
  
  if (separatorIndex === -1) {
    return { apps: [], raw: output };
  }

  let startIndex = separatorIndex + 1;
  const apps = [];
  
  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i];
    // Stop if we hit empty lines or summaries or upgrades available text
    if (line.includes('upgrades available') || line.match(/^[0-9]+ upgrades available/i) || line.includes('yükseltme var')) {
        continue;
    }
    
    // Split by spaces, and reconstruct from the end because Name can have many spaces
    const parts = line.split(/\s+/);
    if (parts.length >= 4) {
      // Check if last part is a source like 'winget' or 'msstore'. Usually, Id doesn't end in these.
      // Alternatively, we can just assume the last 4 parts are id, version, available, source.
      // But let's handle if source is somehow missing
      let source = parts[parts.length - 1];
      let available, version, id;

      if (source === 'winget' || source === 'msstore' || source.toLowerCase() === 'kullanılabilir' || !source.match(/[0-9]/)) {
         source = parts.pop();
         available = parts.pop();
         version = parts.pop();
         id = parts.pop();
      } else {
         source = '';
         available = parts.pop();
         version = parts.pop();
         id = parts.pop();
      }
      
      const name = parts.join(' ');

      apps.push({
        name: name,
        id: id,
        version: version,
        available: available,
        source: source
      });
    }
  }

  return { apps, raw: output };
}

// Helper to parse winget list output
function parseWingetListOutput(output) {
  if (!output) return { apps: [], raw: '' };
  const lines = output.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const separatorIndex = lines.findIndex(line => line.match(/^-{20,}$/));
  if (separatorIndex === -1) return { apps: [], raw: output };

  const apps = [];
  for (let i = separatorIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\s+/);
    if (parts.length >= 3) {
      // winget list outputs: Name, Id, Version, [Available], Source
      // It's tricky to parse. Let's extract Id and Version from the right.
      let source = parts[parts.length - 1];
      let version, id;
      
      if (source === 'winget' || source === 'msstore') {
         source = parts.pop();
         // If there's an available version, it's before source
         if (parts[parts.length-1].match(/^[0-9]/) && parts[parts.length-2].match(/^[0-9]/)) {
            parts.pop(); // available version
         }
         version = parts.pop();
         id = parts.pop();
      } else {
         source = '';
         version = parts.pop();
         id = parts.pop();
      }
      
      const name = parts.join(' ');
      apps.push({ name, id, version, source });
    }
  }
  return { apps, raw: output };
}

// Helper to parse winget search output
function parseWingetSearchOutput(output) {
  if (!output) return { apps: [], raw: '' };
  const lines = output.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const separatorIndex = lines.findIndex(line => line.match(/^-{20,}$/));
  if (separatorIndex === -1) return { apps: [], raw: output };

  const apps = [];
  for (let i = separatorIndex + 1; i < lines.length; i++) {
    const line = lines[i];
    const parts = line.split(/\s+/);
    if (parts.length >= 4) {
      let source = parts.pop();
      let match = parts.pop();
      let version = parts.pop();
      let id = parts.pop();
      const name = parts.join(' ');
      apps.push({ name, id, version, match, source });
    }
  }
  return { apps, raw: output };
}

// Endpoint to check for upgrades
app.get('/api/check', (req, res) => {
  const force = req.query.force === 'true';
  if (!force && cache.check.data && (Date.now() - cache.check.timestamp < CACHE_TTL)) {
    return res.json(cache.check.data);
  }

  // Use a timeout of 120 seconds because winget can be slow to sync repositories
  exec('powershell -NoProfile -Command "winget upgrade --accept-source-agreements --disable-interactivity"', { encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
    // If it errored
    if (error) {
      console.error("Winget check error:", error.message);
      // Winget might still return output even with an error code
      if (!stdout) {
         return res.json({ apps: [], raw: stderr || error.message });
      }
    }
    
    const out = stdout || '';
    if (out.includes('No installed package found') || out.includes('No upgrades available') || out.includes('Bulunamadı') || out.includes('yükseltme yok')) {
       const parsed = { apps: [], raw: out };
       cache.check.data = parsed;
       cache.check.timestamp = Date.now();
       return res.json(parsed);
    }
    
    const parsed = parseWingetOutput(out);
    cache.check.data = parsed;
    cache.check.timestamp = Date.now();
    res.json(parsed);
  });
});

// Endpoint to list installed apps
app.get('/api/list', (req, res) => {
  const force = req.query.force === 'true';
  if (!force && cache.list.data && (Date.now() - cache.list.timestamp < CACHE_TTL)) {
    return res.json(cache.list.data);
  }

  exec('powershell -NoProfile -Command "winget list --accept-source-agreements --disable-interactivity"', { encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
    if (error && !stdout) return res.json({ apps: [], raw: stderr || error.message });
    const out = stdout || '';
    const parsed = parseWingetListOutput(out);
    cache.list.data = parsed;
    cache.list.timestamp = Date.now();
    res.json(parsed);
  });
});

// Endpoint to search apps
app.get('/api/search', (req, res) => {
  const query = req.query.q;
  if (!query) return res.json({ apps: [], raw: '' });
  if (!isValidSearchQuery(query)) {
    return res.status(400).json({ error: 'Invalid search query. Only letters, numbers, spaces, dashes, dots and underscores are allowed.' });
  }

  // Use array-args spawn instead of a PowerShell string wrapper to avoid injection.
  const proc = spawn('winget', ['search', query, '--accept-source-agreements', '--disable-interactivity'], { windowsHide: true });

  let stdout = '';
  let stderr = '';
  proc.stdout.on('data', (data) => { stdout += data.toString(); });
  proc.stderr.on('data', (data) => { stderr += data.toString(); });

  const timeout = setTimeout(() => {
    proc.kill();
  }, 60000);

  proc.on('close', () => {
    clearTimeout(timeout);
    if (!stdout) return res.json({ apps: [], raw: stderr });
    const out = stdout || '';
    if (out.includes('No package found') || out.includes('Bulunamadı')) {
       return res.json({ apps: [], raw: out });
    }
    res.json(parseWingetSearchOutput(out));
  });

  proc.on('error', (error) => {
    clearTimeout(timeout);
    res.json({ apps: [], raw: error.message });
  });
});

// Endpoint to export apps
app.get('/api/export', (req, res) => {
  const exportPath = path.join(__dirname, 'dathex-export.json');
  exec(`powershell -NoProfile -Command "winget export -o '${exportPath}' --accept-source-agreements"`, { encoding: 'utf8', timeout: 120000 }, (error, stdout, stderr) => {
    if (error) return res.status(500).json({ error: error.message });
    if (fs.existsSync(exportPath)) {
      res.download(exportPath, 'dathex-apps.json', () => {
        // Clean up file after download
        fs.unlinkSync(exportPath);
      });
    } else {
      res.status(500).json({ error: 'Export failed' });
    }
  });
});

// Real-time upgrade mechanism
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  let currentProcess = null;

  socket.on('start-upgrade', (data) => {
    if (!isSocketEventAllowed(socket.id)) {
      socket.emit('log', { text: '[ERROR] Too many requests. Please slow down.\n', error: true });
      return;
    }

    const { type, ids } = data || {}; // type: 'all' or 'select'

    let args = ['upgrade', '--accept-package-agreements', '--accept-source-agreements', '--silent'];

    if (type === 'select' && ids && ids.length > 0) {
       if (!ids.every(isValidWingetId)) {
          socket.emit('log', { text: '[ERROR] One or more package IDs are invalid.\n', error: true });
          return;
       }
       // We will process them one by one or create a bat script.
       // Actually, winget upgrade doesn't take multiple IDs. We need to run it multiple times.
       // We will handle it by spawning sequentially.
       runSequentialUpgrades(ids, socket);
       return;
    } else if (type === 'all') {
       args.push('--all');
    } else {
       socket.emit('log', { text: '[ERROR] Invalid upgrade type or missing IDs.\n' });
       return;
    }

    socket.emit('log', { text: `[~] Starting upgrade: winget ${args.join(' ')}\n` });

    currentProcess = spawn('winget', args, { windowsHide: true });

    currentProcess.stdout.on('data', (data) => {
      socket.emit('log', { text: data.toString() });
    });

    currentProcess.stderr.on('data', (data) => {
      socket.emit('log', { text: data.toString(), error: true });
    });

    currentProcess.on('close', (code) => {
      socket.emit('log', { text: `\n[✓] Upgrade process exited with code ${code}\n` });
      cache.check.data = null; // Invalidate cache after upgrade
      socket.emit('upgrade-finished', { code });
    });
  });

  socket.on('cancel-upgrade', () => {
    if (currentProcess) {
      currentProcess.kill();
      socket.emit('log', { text: '\n[X] Process cancelled by user.\n' });
    }
  });

  socket.on('start-install', (data) => {
    if (!isSocketEventAllowed(socket.id)) {
      socket.emit('log', { text: '[ERROR] Too many requests. Please slow down.\n', error: true });
      return;
    }

    const { id } = data || {};
    if (!id) return;
    if (!isValidWingetId(id)) {
      socket.emit('log', { text: `[ERROR] Invalid package ID: ${id}\n`, error: true });
      return;
    }

    const args = ['install', '--id', id, '--accept-package-agreements', '--accept-source-agreements', '--silent'];
    socket.emit('log', { text: `[~] Starting install: winget ${args.join(' ')}\n` });

    currentProcess = spawn('winget', args, { windowsHide: true });

    currentProcess.stdout.on('data', (data) => socket.emit('log', { text: data.toString() }));
    currentProcess.stderr.on('data', (data) => socket.emit('log', { text: data.toString(), error: true }));

    currentProcess.on('close', (code) => {
      socket.emit('log', { text: `\n[✓] Install process exited with code ${code}\n` });
      cache.list.data = null; // Invalidate cache
      cache.check.data = null;
      socket.emit('upgrade-finished', { code }); // reusing the same event to trigger refresh
    });
  });

  socket.on('start-uninstall', (data) => {
    if (!isSocketEventAllowed(socket.id)) {
      socket.emit('log', { text: '[ERROR] Too many requests. Please slow down.\n', error: true });
      return;
    }

    const { id } = data || {};
    if (!id) return;
    if (!isValidWingetId(id)) {
      socket.emit('log', { text: `[ERROR] Invalid package ID: ${id}\n`, error: true });
      return;
    }

    const args = ['uninstall', '--id', id, '--accept-source-agreements', '--silent'];
    socket.emit('log', { text: `[~] Starting uninstall: winget ${args.join(' ')}\n` });

    currentProcess = spawn('winget', args, { windowsHide: true });

    currentProcess.stdout.on('data', (data) => socket.emit('log', { text: data.toString() }));
    currentProcess.stderr.on('data', (data) => socket.emit('log', { text: data.toString(), error: true }));

    currentProcess.on('close', (code) => {
      socket.emit('log', { text: `\n[✓] Uninstall process exited with code ${code}\n` });
      cache.list.data = null; // Invalidate cache
      cache.check.data = null;
      socket.emit('upgrade-finished', { code }); // reusing the same event to trigger refresh
    });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

function runSequentialUpgrades(ids, socket) {
  let index = 0;

  function next() {
    if (index >= ids.length) {
       socket.emit('log', { text: `\n[✓] All selected upgrades finished.\n` });
       socket.emit('upgrade-finished', { code: 0 });
       return;
    }

    const id = ids[index];

    if (!isValidWingetId(id)) {
       socket.emit('log', { text: `[ERROR] Invalid package ID skipped: ${id}\n`, error: true });
       index++;
       next();
       return;
    }

    const args = ['upgrade', '--id', id, '--accept-package-agreements', '--accept-source-agreements', '--silent'];

    socket.emit('log', { text: `\n[~] Upgrading: ${id}...\n` });

    const proc = spawn('winget', args, { windowsHide: true });
    
    proc.stdout.on('data', (data) => {
      socket.emit('log', { text: data.toString() });
    });

    proc.stderr.on('data', (data) => {
      socket.emit('log', { text: data.toString(), error: true });
    });

    proc.on('close', (code) => {
      socket.emit('log', { text: `[i] Completed ${id} with code ${code}\n` });
      index++;
      next();
    });
  }

  next();
}

// Anything that doesn't match the above, send back index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`DatHex Server running on http://localhost:${PORT}`);
});

// Auto-Updater Cron Job (Runs every 6 hours)
cron.schedule('0 */6 * * *', () => {
  console.log('[Auto-Updater] Checking for winget upgrades in the background...');
  exec('powershell -NoProfile -Command "winget upgrade --accept-source-agreements"', { encoding: 'utf8', timeout: 120000 }, (error, stdout) => {
    if (error || !stdout) return;
    
    const out = stdout || '';
    if (out.includes('No installed package found') || out.includes('No upgrades available') || out.includes('Bulunamadı') || out.includes('yükseltme yok')) {
       return;
    }
    
    const parsed = parseWingetOutput(out);
    if (parsed.apps && parsed.apps.length > 0) {
      notifier.notify({
        title: 'DatHex V2 - Güncelleme Mevcut',
        message: `${parsed.apps.length} adet uygulama için güncelleme bulundu. DatHex'i açarak tek tıkla güncelleyebilirsiniz.`,
        icon: path.join(__dirname, '../client/public/favicon.svg'),
        appID: 'DatHex V2'
      });
    }
  });
});
