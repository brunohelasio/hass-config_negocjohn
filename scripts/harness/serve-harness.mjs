// Servidor estatico minimo para medir o tile fora do Home Assistant.
//   /local/*  -> config/www/*   (mesma raiz que o HA usa)
//   /         -> harness.html
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';

const REPO = 'C:/GitHub/hass-config_negocjohn/hass-config_negocjohn';
const WWW = join(REPO, 'config/www');
const HARNESS = process.argv[2];
const PORT = Number(process.argv[3] || 8123);

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.map': 'application/json',
};

createServer(async (req, res) => {
  const url = decodeURIComponent((req.url || '/').split('?')[0]);
  let arquivo;
  if (url === '/' || url === '/index.html') arquivo = HARNESS;
  else if (url.startsWith('/local/')) arquivo = normalize(join(WWW, url.slice('/local/'.length)));
  else arquivo = normalize(join(WWW, url.replace(/^\//, '')));

  try {
    const dados = await readFile(arquivo);
    res.writeHead(200, {
      'Content-Type': TIPOS[extname(arquivo).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(dados);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end(`nao encontrado: ${url}`);
  }
}).listen(PORT, () => console.log(`harness em http://127.0.0.1:${PORT}/  (arquivo: ${HARNESS})`));
