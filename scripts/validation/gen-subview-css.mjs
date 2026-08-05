// Gera o CSS do componente de subview a partir dos seis arquivos atuais.
//
// GERADO, não retipado. São 652 regras de base mais quatro blocos condicionais;
// retipar isso à mão é a forma mais barata de introduzir deriva num lugar onde
// a medição já provou que não existe.
//
// Saída: dashboard-src/src/components/rooms/subview-styles.generated.ts
//
//   node scripts/validation/gen-subview-css.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'config/www/bruno-ui/subviews';
const SAIDA = 'dashboard-src/src/components/rooms/subview-styles.generated.ts';
const COMODOS = ['sala', 'office', 'cozinha', 'quarto-casal', 'quarto-marina', 'quarto-miguel'];

const PREFIXOS = /--(sala|office|cozinha|qcasal|qmarina|qmiguel|quarto-casal|quarto-marina|quarto-miguel)-/g;

function cssDe(comodo) {
  const texto = readFileSync(`${DIR}/bruno-${comodo}-subview.js`, 'utf8');
  const inicio = texto.search(/^\s+_styles\(\)\s*\{/m);
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
  const corpo = texto.slice(inicio, fim + 1);
  const abre = corpo.indexOf('`');
  const fecha = corpo.lastIndexOf('`');
  return (
    corpo
      .slice(abre + 1, fecha)
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(PREFIXOS, '--room-')
      // A classe raiz também é por cômodo: .sala-subview, .office-subview…
      // Sem unificar, a raiz de cada um vira "exclusiva de um cômodo" e a
      // classificação a joga dentro de um bloco de RECURSO — o grid da Sala
      // acabava rotulado como CSS do PS5. Uma raiz só, e a diferença real da
      // Cozinha aparece como sobreposição, que é o que ela é.
      .replace(/\.(sala|office|cozinha|quarto-casal|quarto-marina|quarto-miguel)-subview\b/g, '.room-subview')
  );
}

// Percorre e devolve blocos NA ORDEM, com o contexto de media query.
// A ordem importa: em CSS a cascata depende dela.
function blocos(css) {
  const saida = [];
  const pilha = [];
  let i = 0;
  let buffer = '';
  while (i < css.length) {
    const c = css[i];
    if (c === '{') {
      const cabecalho = buffer.trim().replace(/\s+/g, ' ');
      buffer = '';
      if (cabecalho.startsWith('@')) {
        pilha.push(cabecalho);
        i++;
        continue;
      }
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
        .filter(Boolean);
      saida.push({ media: [...pilha], seletor: cabecalho, decls });
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

const porComodo = Object.fromEntries(COMODOS.map((c) => [c, blocos(cssDe(c))]));
const chave = (b) => (b.media.length ? b.media.join(' >> ') + ' >> ' : '') + b.seletor;
const valor = (b) => [...b.decls].sort().join('; ');

/**
 * Declarações FUNDIDAS de cada chave, por cômodo.
 *
 * O arquivo da Sala define `.room-subview` SETE vezes, empilhadas, e
 * `.lights-card` mais de uma. A cascata do CSS não troca a regra inteira: ela
 * funde propriedade a propriedade, e a definição posterior sobrescreve apenas o
 * que ela própria declara. O que só existe na definição anterior SOBREVIVE.
 *
 * Emitir só a primeira entregava o grid LEGADO (a raiz media 12px de largura).
 * Emitir só a última perdia o que a primeira declarava e a última não — foi
 * assim que `.lights-card` perdeu o `display: flex` e o dock ficou 29px mais
 * alto. Fundir é o único comportamento que reproduz a cascata.
 */
function fundir(blocosDaChave) {
  const props = new Map(); // propriedade -> declaração completa, na ordem
  for (const b of blocosDaChave) {
    for (const d of b.decls) {
      const prop = d.slice(0, d.indexOf(':')).trim();
      props.delete(prop); // reinsere no fim: a última posição vence
      props.set(prop, d);
    }
  }
  const ultimo = blocosDaChave[blocosDaChave.length - 1];
  return { media: ultimo.media, seletor: ultimo.seletor, decls: [...props.values()] };
}

const fundidoDe = {};
for (const c of COMODOS) {
  const porChave = new Map();
  for (const b of porComodo[c]) {
    if (!porChave.has(chave(b))) porChave.set(chave(b), []);
    porChave.get(chave(b)).push(b);
  }
  const m = new Map();
  for (const [k, lista] of porChave) m.set(k, fundir(lista));
  fundidoDe[c] = m;
}

// Índice: chave -> { comodo -> valor }.  Última definição vence, como a cascata.
const indice = new Map();
for (const c of COMODOS) {
  for (const [k, b] of fundidoDe[c]) {
    if (!indice.has(k)) indice.set(k, {});
    indice.get(k)[c] = valor(b);
  }
}

const donos = new Map(); // chave -> lista de cômodos que a possuem
for (const [k, v] of indice) donos.set(k, COMODOS.filter((c) => v[c] !== undefined));

const ehBase = (k) => donos.get(k).length === COMODOS.length && new Set(Object.values(indice.get(k))).size === 1;

// A classe raiz nunca entra num bloco de RECURSO: ela é o grid do cômodo, não um
// aparelho. Sem esta guarda, o grid da Cozinha ficava dentro do bloco de
// eletrodomésticos — funcionaria hoje, por coincidência de dono, e quebraria no
// dia em que outro cômodo ganhasse eletrodomésticos. Raiz vai para base (quando
// idêntica) ou para a sobreposição do cômodo.
const ehRaiz = (k) => /(^|>> )\.room-subview\b/.test(k);

// Quatro blocos condicionais, definidos pelo dono medido.
const CONDICIONAIS = [
  { nome: 'appliances', dono: (d, k) => !ehRaiz(k) && d.length === 1 && d[0] === 'cozinha' },
  { nome: 'tvHub', dono: (d, k) => !ehRaiz(k) && d.length === 5 && !d.includes('cozinha') },
  { nome: 'ps5', dono: (d, k) => !ehRaiz(k) && d.length === 1 && d[0] === 'sala' },
  { nome: 'pc', dono: (d, k) => !ehRaiz(k) && d.length === 1 && d[0] === 'office' },
];

// Os blocos e as sobreposições vivem na MESMA folha do componente, então
// precisam de escopo — senão o grid da Cozinha valeria para todos. O escopo é um
// atributo no host, que o componente define a partir da configuração.
function escopar(seletor, prefixo, dentroDeKeyframes) {
  // Dentro de @keyframes o "seletor" é uma porcentagem — 0%, 18%, from, to.
  // Prefixar produz ":host([data-room='sala']) 0%", que é inválido, e UMA regra
  // inválida derruba a folha inteira: foi o que deixou dez das onze folhas do
  // componente com zero regras.
  if (!prefixo || dentroDeKeyframes) return seletor;
  return seletor
    .split(',')
    .map((s) => `${prefixo} ${s.trim()}`)
    .join(', ');
}

function serializar(bs, prefixo = '') {
  const linhas = [];
  let mediaAtual = '';
  for (const b of bs) {
    const media = b.media.join(' >> ');
    if (media !== mediaAtual) {
      if (mediaAtual) linhas.push('}'.repeat(mediaAtual.split(' >> ').length));
      if (media) for (const m of b.media) linhas.push(`${m} {`);
      mediaAtual = media;
    }
    const emKeyframes = b.media.some((m) => m.startsWith("@keyframes"));
    linhas.push(escopar(b.seletor, prefixo, emKeyframes) + " {");
    for (const d of b.decls) linhas.push(`  ${d};`);
    linhas.push('}');
  }
  if (mediaAtual) linhas.push('}'.repeat(mediaAtual.split(' >> ').length));
  return linhas.join('\n');
}

// A base sai na ORDEM DA SALA (o arquivo mais completo), sem repetir chave.
const vistas = new Set();
const base = [];
for (const b of porComodo['sala']) {
  const k = chave(b);
  if (vistas.has(k) || !ehBase(k)) continue;
  vistas.add(k);
  base.push(fundidoDe['sala'].get(k));
}

const condicionais = {};
for (const { nome, dono } of CONDICIONAIS) {
  const vistasC = new Set();
  const lista = [];
  for (const c of COMODOS) {
    for (const b of porComodo[c]) {
      const k = chave(b);
      if (vistasC.has(k) || !dono(donos.get(k), k)) continue;
      vistasC.add(k);
      lista.push(fundidoDe[c].get(k));
    }
  }
  condicionais[nome] = lista;
}

// O que sobra: regras que existem em vários cômodos com VALORES diferentes (o
// dock de iluminação, o marquee do Spotify) e regras de um cômodo só que não
// pertencem a nenhum dos quatro blocos. Viram sobreposição por cômodo — nada se
// perde, e a divergência fica visível em vez de embutida na base.
const jaEmitidas = new Set([...base, ...Object.values(condicionais).flat()].map(chave));
const sobreposicoes = {};
for (const c of COMODOS) {
  const vistasS = new Set();
  const lista = [];
  for (const b of porComodo[c]) {
    const k = chave(b);
    if (vistasS.has(k) || jaEmitidas.has(k)) continue;
    vistasS.add(k);
    lista.push(fundidoDe[c].get(k));
  }
  if (lista.length) sobreposicoes[c] = lista;
}

const cabecalho = `/**
 * CSS da subview de cômodo — ARQUIVO GERADO, não editado à mão.
 *
 * Origem: os seis arquivos em config/www/bruno-ui/subviews/, medidos regra a
 * regra (ver docs/12, secao "O CSS das seis, medido regra a regra"). Sao 652
 * regras identicas nos seis, mais quatro blocos que pertencem a comodos
 * especificos.
 *
 * Os tokens tinham prefixo por comodo — sala, office, qcasal, qmarina, qmiguel,
 * com a Cozinha reaproveitando os do Office. Aqui todos usam o prefixo unico
 * --room-, e foi isso que colapsou 14 das 22 divergencias aparentes.
 *
 * Regenerar:  node scripts/validation/gen-subview-css.mjs
 *
 * NAO usar crase em comentario dentro dos templates abaixo: e a armadilha que
 * ja quebrou o dashboard cinco vezes. Conferir com
 * scripts/validation/check-backtick.mjs
 */
import { css, unsafeCSS } from 'lit';

`;

const partes = [
  `/** Base compartilhada pelos seis comodos: ${base.length} regras. */\nexport const SUBVIEW_BASE_CSS = css\`\n${serializar(base)}\n\`;\n`,
];
for (const { nome } of CONDICIONAIS) {
  const lista = condicionais[nome];
  partes.push(
    `/** Bloco condicional "${nome}": ${lista.length} regras, escopadas por atributo. */\nexport const SUBVIEW_${nome.toUpperCase()}_CSS = css\`\n${serializar(lista, `:host([data-${nome.toLowerCase()}])`)}\n\`;\n`,
  );
}
const CHAVE_TS = { sala: 'sala', office: 'office', cozinha: 'cozinha', 'quarto-casal': 'casal', 'quarto-marina': 'marina', 'quarto-miguel': 'miguel' };
for (const [comodo, lista] of Object.entries(sobreposicoes)) {
  partes.push(
    `/** Sobreposicao do comodo ${CHAVE_TS[comodo]}: ${lista.length} regras que divergem da base. */\nconst SOBREPOSICAO_${CHAVE_TS[comodo].toUpperCase()} = css\`\n${serializar(lista, `:host([data-room='${CHAVE_TS[comodo]}'])`)}\n\`;\n`,
  );
}

partes.push(
  `/** Todos os blocos, para o componente escolher pelo config. */\nexport const SUBVIEW_BLOCOS = {\n${CONDICIONAIS.map(({ nome }) => `  ${nome}: SUBVIEW_${nome.toUpperCase()}_CSS,`).join('\n')}\n} as const;\n\n/** Sobreposicoes por comodo. Aplicar DEPOIS da base e dos blocos. */\nexport const SUBVIEW_SOBREPOSICOES = {\n${Object.keys(sobreposicoes).map((c) => `  ${CHAVE_TS[c]}: SOBREPOSICAO_${CHAVE_TS[c].toUpperCase()},`).join('\n')}\n} as const;\n\nvoid unsafeCSS;\n`,
);

writeFileSync(SAIDA, cabecalho + partes.join('\n'), 'utf8');

console.log(`\n  gerado: ${SAIDA}`);
console.log(`    base                ${base.length} regras`);
for (const { nome } of CONDICIONAIS) console.log(`    ${nome.padEnd(20)}${condicionais[nome].length} regras`);
console.log(`    total no arquivo    ${readFileSync(SAIDA, 'utf8').split('\n').length} linhas\n`);

// ── Conferência de cobertura ────────────────────────────────────────────────
// A base sai na ordem da Sala e agrupa seletores múltiplos numa chave só. Se um
// arquivo escrever ".a, .b" e outro ".b, .a", a chave difere e a regra pode
// escapar. Aqui cada cômodo é reconstruído a partir de base + blocos e o que
// sobrar é listado — regra não coberta é regra que sumiria da tela.
const emitidas = new Set([...base, ...Object.values(condicionais).flat(), ...Object.values(sobreposicoes).flat()].map(chave));
let faltando = 0;
console.log('  cobertura por cômodo (regras do arquivo que a geração NÃO cobre):');
for (const c of COMODOS) {
  const vistasR = new Set();
  const fora = [];
  for (const b of porComodo[c]) {
    const k = chave(b);
    if (vistasR.has(k)) continue;
    vistasR.add(k);
    if (!emitidas.has(k)) fora.push(k);
  }
  faltando += fora.length;
  console.log(`    ${c.padEnd(16)}${String(fora.length).padStart(3)} de ${vistasR.size}`);
  if (fora.length && process.argv.includes('-v')) for (const k of fora.slice(0, 12)) console.log(`        ${k}`);
}
console.log(`\n  total não coberto: ${faltando}\n`);
