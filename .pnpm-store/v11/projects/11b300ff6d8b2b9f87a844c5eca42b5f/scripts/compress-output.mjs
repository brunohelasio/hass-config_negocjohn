import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const root = resolve(import.meta.dirname, '..', '..', 'config', 'www', 'dashboard');
const extensions = new Set(['.js', '.css', '.json', '.svg']);
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (extensions.has(extname(path)) && statSync(path).size >= 1024) files.push(path);
  }
}

walk(root);
for (const path of files) {
  const raw = readFileSync(path);
  writeFileSync(path + '.br', brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
  writeFileSync(path + '.gz', gzipSync(raw, { level: 9 }));
}
console.log(`compressed ${files.length} dashboard assets`);
