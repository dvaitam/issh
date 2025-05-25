const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const https = require('https');

// serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

function fetchOpenAIModels(apiKey) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.openai.com',
      port: 443,
      path: '/v1/models',
      method: 'GET',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    };
    const req = https.request(options, res => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const json = JSON.parse(data);
            const models = json.data.map(m => m.id);
            resolve(models);
          } catch (e) { reject(e); }
        } else { reject(new Error(`OpenAI API returned status ${res.statusCode}: ${data}`)); }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

app.post('/models', async (req, res) => {
  const { provider, apiKey } = req.body;
  if (!provider || !apiKey) {
    return res.status(400).json({ error: 'provider and apiKey required' });
  }
  try {
    let models;
    if (provider === 'openai') {
      models = await fetchOpenAIModels(apiKey);
    } else {
      return res.status(501).json({ error: 'provider not supported' });
    }
    res.json({ models });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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
