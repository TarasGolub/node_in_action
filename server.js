const http = require('http');
const fs = require('fs');
const path = require('path');
const mime = require('mime');

const {send404, sendFile, serveStatic} = require('./utils/resHelper');

const cache = {};

const server = http.createServer((req, res) => {
    var filePath = null;

    if (req.url == '/') {
        filePath = path.join(__dirname, 'public', 'index.html');
    } else {
        filePath = path.join(__dirname, 'public', req.url);
    }

    serveStatic(res, cache, filePath);
});


server.listen(3000, () => {
    console.log('Server listening on port 3000');
});

const chatServer = require('./lib/chat_server');
chatServer.listen(server, () => {
    console.log('Chat server listening on port 3000');
});
