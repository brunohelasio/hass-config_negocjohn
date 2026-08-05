// Compara o CORPO de um método entre vários arquivos, pelo caminho VIVO.
//
// Existe porque contar nomes de método levou a duas descrições erradas da
// estrutura das subviews (ver docs/04, "Anatomia de uma subview de cômodo").
// Aqui o método é localizado, o corpo é extraído por balanceamento de chaves, e
// a comparação é entre os corpos — não entre as assinaturas.
//
//   node scripts/validation/compare-method.mjs _renderMediaHub sala office ...
import { readFileSync } from 'node:fs';

const DIR = 'config/www/bruno-ui/subviews';
const [metodo, ...comodos] = process.argv.slice(2);
if (!metodo || comodos.length === 0) {
  console.error('uso: compare-method.mjs <_metodo> <comodo> [comodo...]');
  process.exit(1);
}

function corpo(arquivo, nome) {
  const linhas = readFileSync(arquivo, 'utf8').split(/\r?\n/);
  const alvo = new RegExp('^\\s+' + nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*\\(');
  const inicio = linhas.findIndex((l) => alvo.test(l));
  if (inicio < 0) return null;

  let nivel = 0;
  let fim = inicio;
  for (let k = inicio; k < linhas.length; k++) {
    for (const ch of linhas[k]) {
      if (ch === '{') nivel++;
      else if (ch === '}') nivel--;
    }
    if (nivel === 0 && k > inicio) {
      fim = k;
      break;
    }
  }
  return { linhas: fim - inicio + 1, texto: linhas.slice(inicio, fim + 1).join('\n') };
}

const util = (t) =>
  t
    .split('\n')
    .map((s) => s.trim())
    .filter((s) => s.length > 3);

const corpos = {};
console.log(`\n  ${metodo} — tamanho por cômodo:`);
for (const c of comodos) {
  const r = corpo(`${DIR}/bruno-${c}-subview.js`, metodo);
  corpos[c] = r;
  console.log(`    ${c.padEnd(16)}${r ? `${r.linhas} linhas` : 'AUSENTE'}`);
}

const base = comodos[0];
if (corpos[base]) {
  const conjunto = new Set(util(corpos[base].texto));
  console.log(`\n  duplicação literal contra o ${base}:`);
  for (const c of comodos.slice(1)) {
    if (!corpos[c]) continue;
    const ls = util(corpos[c].texto);
    const dentro = ls.filter((s) => conjunto.has(s)).length;
    console.log(
      `    ${c.padEnd(16)}${((100 * dentro) / ls.length).toFixed(1)}%  (${ls.length - dentro} linhas próprias)`,
    );
  }
}

// Linhas presentes em TODOS — o núcleo que vira componente.
const todos = comodos.filter((c) => corpos[c]);
if (todos.length > 1) {
  const conta = new Map();
  for (const c of todos) for (const l of new Set(util(corpos[c].texto))) conta.set(l, (conta.get(l) ?? 0) + 1);
  let nucleo = 0;
  for (const [, n] of conta) if (n === todos.length) nucleo++;
  console.log(`\n  linhas distintas somadas : ${conta.size}`);
  console.log(`  presentes em TODOS       : ${nucleo}  (${((100 * nucleo) / conta.size).toFixed(1)}%)`);
}
console.log('');
