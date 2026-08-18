import fs from 'node:fs';

const manifestPath = 'config/www/dashboard/manifest.json';
const configPath = 'config/configuration.yaml';

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
const bundle = String(manifest.bundle ?? '');
if (!/^bruno-dashboard\.[A-Za-z0-9_-]+\.js$/.test(bundle)) {
  throw new Error(`bundle invalido no manifesto: ${bundle}`);
}

let config = fs.readFileSync(configPath, 'utf8');
const activeRe = /^    - \/local\/dashboard\/bruno-dashboard\.[A-Za-z0-9_-]+\.js$/m;
const active = config.match(activeRe)?.[0];
if (!active) throw new Error('referencia ativa do dashboard nao encontrada');

const next = `    - /local/dashboard/${bundle}`;
if (active === next) {
  console.log(`configuration.yaml ja aponta para ${bundle}`);
  process.exit(0);
}

const previous = active.trim();
const replacement = `    # ANTERIOR (rollback TV/Office state semantics): ${previous}\n${next}`;
config = config.replace(activeRe, replacement);
fs.writeFileSync(configPath, config);
console.log(`${previous} -> ${next.trim()}`);
