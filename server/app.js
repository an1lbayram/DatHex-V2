const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { spawn: realSpawn, exec: realExec } = require('child_process');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const fs = require('fs');

const { parseWingetOutput, parseWingetListOutput, parseWingetSearchOutput } = require('./lib/winget-parser');
const { isValidWingetId, isValidSearchQuery, isOriginAllowed } = require('./lib/validators');
const { createRateLimiter } = require('./lib/rate-limiter');

// Whitelist of allowed origins. The production client URL can be supplied via
// the ALLOWED_ORIGIN env var (comma-separated list supported).
const DEFAULT_ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:3000'];
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : DEFAULT_ALLOWED_ORIGINS;

function buildApp({ exec = realExec, spawn = realSpawn } = {}) {
  const app = express();
  const server = http.createServer(app);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (isOriginAllowed(origin, ALLOWED_ORIGINS)) {
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
      if (isOriginAllowed(origin, ALLOWED_ORIGINS)) {
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

  const isHttpRequestAllowed = createRateLimiter(RATE_LIMIT_MAX_REQUESTS, RATE_LIMIT_WINDOW_MS);
  const isSocketEventAllowed = createRateLimiter(SOCKET_RATE_LIMIT_MAX_EVENTS, RATE_LIMIT_WINDOW_MS);

  app.use('/api', (req, res, next) => {
    if (!isHttpRequestAllowed(req.ip)) {
      return res.status(429).json({ error: 'Too many requests, please slow down.' });
    }
    next();
  });

  // Serve static files from the React frontend app
  app.use(express.static(path.join(__dirname, '../client/dist')));

  const cache = {
    check: { data: null, timestamp: 0 },
    list: { data: null, timestamp: 0 }
  };
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  // Endpoint to check for upgrades
  app.get('/api/check', (req, res) => {
    const force = req.query.force === 'true';
    if (!force && cache.check.data && (Date.now() - cache.check.timestamp < CACHE_TTL)) {
      return res.json(cache.check.data);
    }

    exec('powershell -NoProfile -Command "winget upgrade --accept-source-agreements --disable-interactivity"', { encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Winget check error:', error.message);
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
    exec(`powershell -NoProfile -Command "winget export -o '${exportPath}' --accept-source-agreements"`, { encoding: 'utf8', timeout: 120000 }, (error) => {
      if (error) return res.status(500).json({ error: error.message });
      if (fs.existsSync(exportPath)) {
        res.download(exportPath, 'dathex-apps.json', () => {
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

      const args = ['upgrade', '--accept-package-agreements', '--accept-source-agreements', '--silent'];

      if (type === 'select' && ids && ids.length > 0) {
        if (!ids.every(isValidWingetId)) {
          socket.emit('log', { text: '[ERROR] One or more package IDs are invalid.\n', error: true });
          return;
        }
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
        cache.list.data = null;
        cache.check.data = null;
        socket.emit('upgrade-finished', { code });
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
        cache.list.data = null;
        cache.check.data = null;
        socket.emit('upgrade-finished', { code });
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
        socket.emit('log', { text: '\n[✓] All selected upgrades finished.\n' });
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

  return { app, server, io, cache, isHttpRequestAllowed, isSocketEventAllowed };
}

module.exports = { buildApp, ALLOWED_ORIGINS };
