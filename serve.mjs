import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8080);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.webmanifest': 'application/manifest+json; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
};

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    res.writeHead(400).end('bad request');
    return;
  }

  let filePath = path.join(root, pathname);
  if (!filePath.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      const name = path.basename(filePath);
      const headers = {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': (name === 'sw.js' || name === 'index.html' || ext === '.webmanifest')
          ? 'no-store'
          : 'public, max-age=3600',
      };
      if (name === 'sw.js') headers['Service-Worker-Allowed'] = '/';
      res.writeHead(200, headers).end(data);
    });
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const nets = os.networkInterfaces();
  console.log('Силовые дома (PWA) — локальный сервер');
  console.log('  на этом компьютере:  http://localhost:' + PORT);
  for (const list of Object.values(nets)) {
    for (const net of list || []) {
      if (net.family === 'IPv4' && !net.internal) {
        console.log('  в локальной сети:    http://' + net.address + ':' + PORT + '   (сервис-воркер там не включится: нужен HTTPS)');
      }
    }
  }
  console.log('Остановить: Ctrl+C');
});
