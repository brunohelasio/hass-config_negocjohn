// Compara o CSS das seis subviews regra a regra.
//
// O CSS é a maior parte dos ~8.900 linhas de cada arquivo, e é onde a Fase 5c
// vive ou morre: 655 seletores por arquivo, sete definições empilhadas da classe
// raiz e a maioria das media queries do projeto. Antes de escrever o componente,
// é preciso saber exatamente quais regras são idênticas nos seis (viram base) e
// quais divergem (viram parâmetro).
//
// Compara CHAVE = contexto de media query + seletor, e VALOR = declarações
// normalizadas. Só a última definição de cada chave conta, que é o que a cascata
// faz — foi ler a PRIMEIRA que produziu a descrição errada do grid em docs/04.
//
//   node scripts/validation/diff-subview-css.mjs
//   node scripts/validation/diff-subview-css.mjs --divergentes
import { readFileSync } from 'node:fs';

const DIR = 'config/www/bruno-ui/subviews';
const COMODOS = ['sala', 'office', 'cozinha', 'quarto-casal', 'quarto-marina', 'quarto-miguel'];

// Remove comentários de bloco para não comparar prosa.
function semComentarios(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

// Cada cômodo prefixa seus tokens com o próprio nome — --sala-gap, --office-gap,
// --qcasal-gap… (a Cozinha reaproveita os do Office). A regra é a MESMA; só o
// nome do token muda. Com --normalizar, os prefixos viram `--room-`, e o que
// sobra divergente é divergência de verdade.
const PREFIXOS = /--(sala|office|cozinha|qcasal|qmarina|qmiguel|quarto-casal|quarto-marina|quarto-miguel)-/g;
const normalizarTokens = (s) => s.replace(PREFIXOS, '--room-');

// O CSS vive SÓ dentro do método _styles(). Varrer todos os template literais
// do arquivo trazia junto o HTML dos templates, e as "regras" resultantes eram
// fragmentos de atributo — os números saíam contaminados.
function cssBruto(arquivo) {
  const texto = readFileSync(arquivo, 'utf8');
  const inicio = texto.search(/^\s+_styles\(\)\s*\{/m);
  if (inicio < 0) throw new Error(`_styles() não encontrado em ${arquivo}`);

  let nivel = 0;
  let fim = inicio;
  for (let i = inicio; i < texto.length; i++) {
    if (texto[i] === '{') nivel++;
    else if (texto[i] === '}') {
      nivel--;
      if (nivel === 0) {
        fim = i;
        break;
      }
    }
  }
  // Dentro do método, o CSS é o conteúdo do template literal do return.
  const corpo = texto.slice(inicio, fim + 1);
  const abre = corpo.indexOf('`');
  const fecha = corpo.lastIndexOf('`');
  if (abre < 0 || fecha <= abre) throw new Error(`template de CSS não encontrado em ${arquivo}`);
  return semComentarios(corpo.slice(abre + 1, fecha));
}

// Percorre o CSS mantendo a pilha de @media, e devolve chave -> declarações.
function regras(css) {
  const saida = new Map();
  const pilha = [];
  let i = 0;
  let buffer = '';

  while (i < css.length) {
    const c = css[i];
    if (c === '{') {
      const cabecalho = buffer.trim();
      buffer = '';
      if (cabecalho.startsWith('@')) {
        pilha.push(cabecalho.replace(/\s+/g, ' '));
        i++;
        continue;
      }
      // Bloco de declarações: consome até o fecha correspondente.
      let nivel = 1;
      let corpo = '';
      i++;
      while (i < css.length && nivel > 0) {
        if (css[i] === '{') nivel++;
        else if (css[i] === '}') {
          nivel--;
          if (nivel === 0) break;
        }
        corpo += css[i];
        i++;
      }
      i++;
      const decls = corpo
        .split(';')
        .map((d) => d.trim().replace(/\s+/g, ' '))
        .filter(Boolean)
        .sort()
        .join('; ');
      for (const sel of cabecalho.split(',')) {
        const limpo = sel.trim().replace(/\s+/g, ' ');
        if (!limpo) continue;
        const chave = (pilha.length ? pilha.join(' >> ') + ' >> ' : '') + limpo;
        saida.set(chave, decls); // última definição vence, como na cascata
      }
      continue;
    }
    if (c === '}') {
      pilha.pop();
      buffer = '';
      i++;
      continue;
    }
    buffer += c;
    i++;
  }
  return saida;
}

const normalizar = process.argv.includes('--normalizar');
const mapas = {};
for (const c of COMODOS) {
  const bruto = cssBruto(DIR + '/bruno-' + c + '-subview.js');
  mapas[c] = regras(normalizar ? normalizarTokens(bruto) : bruto);
}

const chaves = [...new Set(Object.values(mapas).flatMap((m) => [...m.keys()]))].sort();

const identicas = [];
const divergentes = [];
const parciais = [];

for (const k of chaves) {
  const presentes = COMODOS.filter((c) => mapas[c].has(k));
  if (presentes.length < COMODOS.length) {
    parciais.push({ chave: k, presentes });
    continue;
  }
  const vals = new Set(presentes.map((c) => mapas[c].get(k)));
  (vals.size === 1 ? identicas : divergentes).push(k);
}

console.log('');
for (const c of COMODOS) console.log(`  ${c.padEnd(16)}${mapas[c].size} regras`);
console.log('');
console.log(`  chaves distintas (media query + seletor) : ${chaves.length}`);
console.log(`    idênticas nos seis                     : ${identicas.length}`);
console.log(`    presentes nos seis, com valor diferente: ${divergentes.length}`);
console.log(`    ausentes em algum cômodo               : ${parciais.length}`);
const base = identicas.length;
console.log(`\n  CSS que vira base do componente: ${((100 * base) / chaves.length).toFixed(1)}%\n`);

if (process.argv.includes('--divergentes')) {
  console.log('  DIVERGENTES (precisam virar token ou parâmetro):');
  for (const k of divergentes.slice(0, 60)) {
    console.log(`    ${k}`);
    for (const c of COMODOS) console.log(`        ${c.padEnd(15)}${(mapas[c].get(k) ?? '').slice(0, 110)}`);
  }
  if (divergentes.length > 60) console.log(`    … e mais ${divergentes.length - 60}`);
  console.log('');
  console.log('  AUSENTES EM ALGUM CÔMODO:');
  for (const p of parciais) console.log(`    ${p.chave}  →  só em ${p.presentes.join(', ')}`);
    console.log('');
}
