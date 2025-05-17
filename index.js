const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { Client } = require('ssh2');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// serve static frontend
app.use(express.static(path.join(__dirname, 'public')));

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

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
