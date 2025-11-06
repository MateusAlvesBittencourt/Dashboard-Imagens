const http = require('http');

const server = http.createServer((req, res) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  if (req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Server listening on http://127.0.0.1:3000');
  // Keep alive
  setInterval(() => {}, 1000);
});

server.on('error', (err) => {
  console.error('[Server Error]', err);
});

console.log('[Init] Starting simple test server...');
