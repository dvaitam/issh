const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const path = require('path');
const fs = require('fs');
const jobsFile = path.join(__dirname, 'jobs.json');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const https = require('https');

// serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Proxy to fetch models from chat.manchik.co.uk for any provider
function fetchModelsProxy(provider, apiKey) {
  return new Promise((resolve, reject) => {
    // Map local provider to upstream proxy key (e.g., xai -> grok)
    const upstreamProvider = (provider === 'xai' ? 'grok' : provider);
    const options = {
      hostname: 'chat.manchik.co.uk',
      port: 443,
      path: '/api/models',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-Provider': upstreamProvider
      }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (e) {
            reject(e);
          }
        } else {
          reject(new Error(`Proxy API returned status ${res.statusCode}: ${data}`));
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

// Endpoint to fetch models via proxy to chat.manchik.co.uk
app.get('/api/models', async (req, res) => {
  const authHeader = req.header('Authorization') || req.header('authorization');
  if (!authHeader) {
    return res.status(400).json({ error: 'Missing Authorization header' });
  }
  const apiKey = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
  const provider = (req.header('X-Provider') || req.header('x-provider') || '').toLowerCase();
  if (!provider) {
    return res.status(400).json({ error: 'Missing X-Provider header' });
  }
  try {
    const upstreamJson = await fetchModelsProxy(provider, apiKey);
    res.json(upstreamJson);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Job management endpoints
app.get('/api/jobs', (req, res) => {
  fs.readFile(jobsFile, 'utf8', (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        return res.json([]);
      } else {
        return res.status(500).json({ error: err.message });
      }
    }
    try {
      const jobs = JSON.parse(data);
      return res.json(jobs);
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  });
});

app.post('/api/jobs', (req, res) => {
  const { jobId } = req.body;
  if (!jobId) {
    return res.status(400).json({ error: 'Missing jobId' });
  }
  fs.readFile(jobsFile, 'utf8', (err, data) => {
    let jobs = [];
    if (!err) {
      try {
        jobs = JSON.parse(data);
        if (!Array.isArray(jobs)) jobs = [];
      } catch (_) {
        jobs = [];
      }
    } else if (err.code !== 'ENOENT') {
      return res.status(500).json({ error: err.message });
    }
    jobs.push({ jobId, createdAt: new Date().toISOString() });
    fs.writeFile(jobsFile, JSON.stringify(jobs, null, 2), err2 => {
      if (err2) {
        return res.status(500).json({ error: err2.message });
      }
      res.status(201).json({ success: true });
    });
  });
});

io.on('connection', socket => {
  let sshClient;
  let sshStream;

  socket.on('ssh_connect', config => {
    sshClient = new Client();
    const { host, port, username, password, privateKey, passphrase } = config;
    sshClient.on('ready', () => {
      socket.emit('ssh_ready');
      sshClient.shell((err, stream) => {
        if (err) {
          socket.emit('ssh_error', 'SSH shell error: ' + err.message);
          sshClient.end();
          return;
        }
        sshStream = stream;
        stream.on('data', data => socket.emit('ssh_data', data.toString()))
              .on('close', () => {
                socket.emit('ssh_close');
                sshClient.end();
              });
        socket.on('ssh_input', data => stream.write(data));
        socket.on('ssh_resize', ({ cols, rows }) => stream.setWindow(rows, cols, rows, cols));
      });
    }).on('error', err => {
      socket.emit('ssh_error', 'SSH connection error: ' + err.message);
    }).connect({
      host,
      port: port || 22,
      username,
      password: password || undefined,
      privateKey: privateKey ? Buffer.from(privateKey) : undefined,
      passphrase: passphrase || undefined
    });
  });

  socket.on('disconnect', () => {
    if (sshClient) sshClient.end();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
