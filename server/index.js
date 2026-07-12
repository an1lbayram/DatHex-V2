const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { spawn, exec } = require('child_process');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for local web app to allow inline styles/scripts and external fonts
}));
app.use(express.json());

// Serve static files from the React frontend app
app.use(express.static(path.join(__dirname, '../client/dist')));

const PORT = 3001;

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

// Endpoint to check for upgrades
app.get('/api/check', (req, res) => {
  // Use a timeout of 120 seconds because winget can be slow to sync repositories
  exec('powershell -NoProfile -Command "winget upgrade --accept-source-agreements"', { encoding: 'utf8', timeout: 120000, maxBuffer: 1024 * 1024 * 5 }, (error, stdout, stderr) => {
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
       return res.json({ apps: [], raw: out });
    }
    
    const parsed = parseWingetOutput(out);
    res.json(parsed);
  });
});

// Real-time upgrade mechanism
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  let currentProcess = null;

  socket.on('start-upgrade', (data) => {
    const { type, ids } = data; // type: 'all' or 'select'
    
    let args = ['upgrade', '--accept-package-agreements', '--accept-source-agreements', '--silent'];
    
    if (type === 'select' && ids && ids.length > 0) {
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
    
    currentProcess = spawn('powershell.exe', ['-NoProfile', '-Command', `winget ${args.join(' ')}`]);

    currentProcess.stdout.on('data', (data) => {
      socket.emit('log', { text: data.toString() });
    });

    currentProcess.stderr.on('data', (data) => {
      socket.emit('log', { text: data.toString(), error: true });
    });

    currentProcess.on('close', (code) => {
      socket.emit('log', { text: `\n[✓] Upgrade process exited with code ${code}\n` });
      socket.emit('upgrade-finished', { code });
    });
  });

  socket.on('cancel-upgrade', () => {
    if (currentProcess) {
      currentProcess.kill();
      socket.emit('log', { text: '\n[X] Upgrade process cancelled by user.\n' });
    }
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
    const args = ['upgrade', '--id', `"${id}"`, '--accept-package-agreements', '--accept-source-agreements', '--silent'];
    
    socket.emit('log', { text: `\n[~] Upgrading: ${id}...\n` });
    
    const proc = spawn('powershell.exe', ['-NoProfile', '-Command', `winget ${args.join(' ')}`]);
    
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

server.listen(PORT, () => {
  console.log(`DatHex Server running on http://localhost:${PORT}`);
});
