// Extrai a DEFAULT_CONFIG das seis subviews e mostra o que varia entre elas.
//
// A config é um objeto literal com comentários — não dá para JSON.parse. Ela é
// avaliada como expressão (arquivo do próprio projeto, sem dependências).
//
//   node scripts/validation/extract-subview-config.mjs           # o que varia
//   node scripts/validation/extract-subview-config.mjs --json    # tudo, em JSON
import { readFileSync } from 'node:fs';

const DIR = 'config/www/bruno-ui/subviews';
const COMODOS = ['sala', 'office', 'cozinha', 'quarto-casal', 'quarto-marina', 'quarto-miguel'];

function extrair(comodo) {
  const texto = readFileSync(`${DIR}/bruno-${comodo}-subview.js`, 'utf8');
  const inicio = texto.search(/^const BRUNO_[A-Z0-9_]*SUBVIEW_DEFAULT_CONFIG\s*=\s*\{/m);
  if (inicio < 0) return null;
  const abre = texto.indexOf('{', inicio);

  let nivel = 0;
  let fim = abre;
  let emString = null;
  let emComentario = null;
  for (let i = abre; i < texto.length; i++) {
    const c = texto[i];
    const prox = texto[i + 1];
    if (emComentario) {
      if (emComentario === '//' && c === '\n') emComentario = null;
      else if (emComentario === '/*' && c === '*' && prox === '/') { emComentario = null; i++; }
      continue;
    }
    if (emString) {
      if (c === '\\') i++;
      else if (c === emString) emString = null;
      continue;
    }
    if (c === '/' && prox === '/') { emComentario = '//'; i++; continue; }
    if (c === '/' && prox === '*') { emComentario = '/*'; i++; continue; }
    if (c === "'" || c === '"' || c === '`') { emString = c; continue; }
    if (c === '{') nivel++;
    else if (c === '}') { nivel--; if (nivel === 0) { fim = i; break; } }
  }

  const corpo = texto.slice(abre, fim + 1);
  // eslint-disable-next-line no-new-func
  return new Function(`return (${corpo});`)();
}

const cfgs = {};
for (const c of COMODOS) {
  try {
    cfgs[c] = extrair(c);
  } catch (erro) {
    console.error(`  ${c}: falhou — ${erro.message}`);
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify(cfgs, null, 1));
  process.exit(0);
}

// Achata em caminho -> valor, para comparar chave a chave.
function achatar(obj, prefixo = '', saida = {}) {
  for (const [k, v] of Object.entries(obj ?? {})) {
    const caminho = prefixo ? `${prefixo}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) achatar(v, caminho, saida);
    else saida[caminho] = Array.isArray(v) ? `[${v.length} itens]` : String(v);
  }
  return saida;
}

const planos = Object.fromEntries(Object.entries(cfgs).map(([c, v]) => [c, achatar(v)]));
const chaves = [...new Set(Object.values(planos).flatMap((p) => Object.keys(p)))].sort();

const iguais = [];
const variam = [];
for (const k of chaves) {
  const vals = COMODOS.map((c) => planos[c]?.[k]);
  (new Set(vals).size === 1 ? iguais : variam).push(k);
}

console.log(`\n  chaves de configuração: ${chaves.length}`);
console.log(`    idênticas nos seis : ${iguais.length}`);
console.log(`    variam por cômodo  : ${variam.length}\n`);
console.log('  VARIAM (o que precisa entrar em rooms.config.ts):');
for (const k of variam) {
  const amostra = COMODOS.map((c) => `${c.split('-').pop()}=${planos[c]?.[k] ?? '—'}`).join('  ');
  console.log(`    ${k}`);
  if (process.argv.includes('-v')) console.log(`        ${amostra}`);
}
console.log('\n  IDÊNTICAS (viram padrão do componente):');
console.log('    ' + iguais.join(', ') + '\n');
