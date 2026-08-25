// Confere que TODO import dinamico do bundle publicado existe no destino.
//
// Por que existe: em 2026-08-25 eu publiquei tres rodadas copiando so o
// "main". O hash do chunk das subviews havia mudado, o arquivo novo nunca foi
// para o Everex, e o import dinamico passou a dar 404 — "importing a module
// script failed" ao entrar em qualquer subview. O erro nao aparece em nenhum
// gate: so na navegacao, no aparelho.
//
//   node scripts/validation/check-deploy-chunks.mjs //192.168.3.154/config
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const destino = process.argv[2];
if (!destino) {
  console.error('uso: check-deploy-chunks.mjs <raiz do /config de destino>');
  process.exit(1);
}

const chunks = join(destino, 'www/dashboard/chunks');
if (!existsSync(chunks)) {
  console.error('destino sem www/dashboard/chunks: ' + chunks);
  process.exit(1);
}

// O main ATIVO e o declarado em configuration.yaml.
const cfg = readFileSync(join(destino, 'configuration.yaml'), 'utf8');
const linha = cfg.split(/\r?\n/).find((l) => /^\s*-\s*\/local\/dashboard\/bruno-dashboard\./.test(l));
if (!linha) {
  console.error('configuration.yaml sem linha ativa de bundle');
  process.exit(1);
}
const entrada = linha.trim().replace(/^-\s*\/local\/dashboard\//, '');
const caminhoEntrada = join(destino, 'www/dashboard', entrada);
if (!existsSync(caminhoEntrada)) {
  console.error('ENTRADA AUSENTE no destino: ' + entrada);
  process.exit(1);
}

const vistos = new Set();
const faltando = [];
const fila = [caminhoEntrada];
while (fila.length) {
  const arq = fila.pop();
  if (vistos.has(arq)) continue;
  vistos.add(arq);
  const texto = readFileSync(arq, 'utf8');
  const refs = texto.match(/["'.]\.?\/?(chunks\/)?[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{8}\.js/g) || [];
  for (const cru of refs) {
    const nome = cru.replace(/^["'.]+/, '').replace(/^\/?(chunks\/)?/, '');
    const alvo = join(chunks, nome);
    if (existsSync(alvo)) { fila.push(alvo); continue; }
    const irmao = join(destino, 'www/dashboard', nome);
    if (existsSync(irmao)) { fila.push(irmao); continue; }
    faltando.push(nome);
  }
}

if (faltando.length) {
  console.error('AUSENTES no destino (' + faltando.length + '):');
  for (const f of new Set(faltando)) console.error('  ' + f);
  process.exit(1);
}
console.log('OK — ' + vistos.size + ' modulo(s) alcancavel(is) a partir de ' + entrada + '; nenhum ausente.');
