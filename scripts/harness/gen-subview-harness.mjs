// Gera a página de medição das subviews.
//
// Ordem deliberada: a página nasce ANTES do componente. Ela primeiro mede as
// SEIS SUBVIEWS ATUAIS e grava a geometria de referência; quando o componente
// existir, entra na mesma célula e o diff é imediato. Foi assim que a faixa
// atravessou as fases 5a e 5b sem rodada de tentativa e erro.
//
// O estado sintético do hass sai da configuração real, extraída dos próprios
// arquivos — não de uma lista escrita à mão, que envelhece.
//
//   node scripts/harness/gen-subview-harness.mjs
import { writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SAIDA = 'scripts/harness/subview-parity.html';

const cfgs = JSON.parse(
  execFileSync('node', ['scripts/validation/extract-subview-config.mjs', '--json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }),
);

// Colhe todo id de entidade que aparece na configuração dos seis.
const ids = new Set();
const colher = (v) => {
  if (typeof v === 'string') {
    if (/^[a-z_]+\.[a-z0-9_]+$/.test(v)) ids.add(v);
    return;
  }
  if (Array.isArray(v)) return v.forEach(colher);
  if (v && typeof v === 'object') return Object.values(v).forEach(colher);
};
colher(cfgs);

const COMODOS = [
  ['sala', 'bruno-sala-subview'],
  ['office', 'bruno-office-subview'],
  ['cozinha', 'bruno-cozinha-subview'],
  ['quarto-casal', 'bruno-quarto-casal-subview'],
  ['quarto-marina', 'bruno-quarto-marina-subview'],
  ['quarto-miguel', 'bruno-quarto-miguel-subview'],
];

const scripts = [
  '/local/dashboard/bruno-dashboard.Cday0Vla.js',
  '/local/bruno-ui/core/bruno-icons.js',
  '/local/bruno-ui/core/bruno-liquid-glass.js',
  '/local/bruno-ui/core/bruno-surface-material.js',
  '/local/bruno-ui/core/bruno-theme-manager.js',
  '/local/bruno-ui/core/bruno-josh.js',
  '/local/bruno-ui/core/bruno-visionos.js',
  '/local/bento-sidebar-card.js',
  ...COMODOS.map(([c]) => `/local/bruno-ui/subviews/bruno-${c}-subview.js`),
];

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Paridade das subviews</title>
<style>
  html, body { margin: 0; padding: 0; background: #0d0f14; color: #eee;
               font: 12px/1.4 system-ui, -apple-system, sans-serif; }
  /* Reproduz a área útil da shell: coluna de 86px do rail + content-slot com
     padding de 12px. A subview mede a si mesma contra isso. */
  .palco { display: grid; grid-template-columns: 86px minmax(0, 1fr); height: 100vh; }
  .rail-vazio { grid-column: 1; }
  .conteudo { grid-column: 2; padding: 12px; overflow: hidden; }
  .conteudo > * { display: block; height: 100%; }
  .rotulo { position: fixed; top: 4px; right: 8px; z-index: 99; opacity: .6; font-size: 11px; }
</style>
</head>
<body>
<div class="rotulo" id="rotulo">carregando…</div>
<div class="palco"><div class="rail-vazio"></div><div class="conteudo" id="palco"></div></div>

${scripts
  .map((s) =>
    // O bundle novo e um modulo ES (vite, formats: ['es']); os arquivos antigos
    // sao scripts classicos. Carregar o modulo sem type=module o deixa em
    // silencio, e o componente nunca registra.
    s.includes('/dashboard/')
      ? `<script type="module" src="${s}"></script>`
      : `<script src="${s}"></script>`,
  )
  .join('\n')}

<script>
const CONFIGS = ${JSON.stringify(cfgs)};
const COMODOS = ${JSON.stringify(COMODOS)};
const IDS = ${JSON.stringify([...ids])};

// Estado sintético de "pior caso": tudo ligado, para que todo módulo renderize.
const agora = new Date();
const ha3min = new Date(agora.getTime() - 3 * 60000).toISOString();
function estadoDe(id) {
  const [dominio, obj] = id.split('.');
  const attributes = {};
  let state = 'on';
  if (dominio === 'climate') { state = 'cool'; attributes.temperature = 23; attributes.current_temperature = 24; attributes.hvac_modes = ['off','cool','heat','fan_only','dry']; }
  else if (dominio === 'media_player') { state = 'playing'; attributes.media_title = 'Faixa'; attributes.media_artist = 'Artista'; attributes.volume_level = 0.4; }
  else if (dominio === 'cover') { state = 'open'; attributes.current_position = 60; }
  else if (dominio === 'number') { state = '60'; }
  else if (dominio === 'input_select') { state = 'sala'; attributes.options = ['sala','office','cozinha']; }
  else if (dominio === 'camera') { state = 'idle'; attributes.entity_picture = ''; }
  else if (dominio === 'sensor') {
    if (/temperature|temperatura/.test(obj)) state = '24.6';
    else if (/humidity|umidade/.test(obj)) state = '58';
    else if (/illuminance|iluminancia|lux/.test(obj)) state = '120';
    else if (/semantic/.test(obj)) { state = 'occupied'; attributes.display = 'Ocupado'; }
    else if (/operation_state/.test(obj)) state = 'run';
    else state = 'on';
  }
  return { entity_id: id, state, attributes, last_changed: ha3min, last_updated: ha3min };
}

const hass = {
  states: {},
  themes: {},
  language: 'pt',
  locale: { language: 'pt' },
  callService: (d, s, dados, alvo) => { (window.__chamadas ||= []).push({ d, s, dados, alvo }); return Promise.resolve(); },
  callWS: () => Promise.resolve([]),
  connection: { subscribeEvents: () => Promise.resolve(() => {}), subscribeMessage: () => Promise.resolve(() => {}) },
};
for (const id of IDS) hass.states[id] = estadoDe(id);
for (const id of Object.keys(hass.states)) {
  if (!/^light\\.(grupo|group)/.test(id)) continue;
  hass.states[id].attributes.entity_id = Object.keys(hass.states)
    .filter((m) => m.startsWith('light.') && m !== id).slice(0, 3);
}

// Mede os módulos de uma subview: retângulo de cada bloco vivo, relativo ao
// canto da própria subview.
const ALVOS = {
  raiz: '[class$="-subview"]',
  topband: '.subview-topband',
  badges: '.topband-badges',
  relogio: '.topband-clock',
  colunaEsq: '.content-left',
  hero: '.hero-panel',
  camsHub: '.cams-media-row',
  colunaDir: '.right-column',
  luzes: '.lights-card',
  ac: '.ac-card',
};

window.medir = function medir(tag) {
  const host = document.querySelector(tag);
  const raiz = host && host.shadowRoot;
  if (!raiz) return { erro: 'sem shadowRoot: ' + tag };
  const base = (raiz.querySelector(ALVOS.raiz) || host).getBoundingClientRect();
  const saida = { _viewport: [innerWidth, innerHeight], _raiz: { w: +base.width.toFixed(2), h: +base.height.toFixed(2) } };
  for (const [nome, sel] of Object.entries(ALVOS)) {
    if (nome === 'raiz') continue;
    const el = raiz.querySelector(sel);
    if (!el) { saida[nome] = null; continue; }
    const r = el.getBoundingClientRect();
    saida[nome] = { x: +(r.left - base.left).toFixed(2), y: +(r.top - base.top).toFixed(2),
                    w: +r.width.toFixed(2), h: +r.height.toFixed(2) };
  }
  return saida;
};

// Mesma célula, componente NOVO. O id do cômodo difere entre a configuração
// antiga (quarto-casal) e a nova (casal), então a ponte é explícita.
const ID_NOVO = { 'quarto-casal': 'casal', 'quarto-marina': 'marina', 'quarto-miguel': 'miguel' };
window.montarNovo = function montarNovo(indice) {
  const [comodo] = COMODOS[indice];
  const palco = document.getElementById('palco');
  palco.innerHTML = '';
  const el = document.createElement('bruno-room-subview');
  palco.appendChild(el);
  el.setConfig({ room: ID_NOVO[comodo] || comodo });
  el.hass = hass;
  document.getElementById('rotulo').textContent = comodo + '  ·  bruno-room-subview (NOVO)';
  return 'bruno-room-subview';
};

// Percorre os seis com o componente novo e devolve a mesma tabela da referência.
window.medicaoNova = async function medicaoNova() {
  const saida = {};
  for (let i = 0; i < COMODOS.length; i++) {
    window.montarNovo(i);
    await new Promise((ok) => setTimeout(ok, 300));
    saida[COMODOS[i][0]] = window.medir('bruno-room-subview');
  }
  return saida;
};

// Monta um cômodo por vez: a subview ocupa a tela inteira.
window.montar = function montar(indice) {
  const [comodo, tag] = COMODOS[indice];
  const palco = document.getElementById('palco');
  palco.innerHTML = '';
  const el = document.createElement(tag);
  palco.appendChild(el);
  el.setConfig(CONFIGS[comodo] || {});
  el.hass = hass;
  document.getElementById('rotulo').textContent = comodo + '  ·  ' + tag;
  window.__atual = tag;
  return tag;
};

// Referência dos seis: percorre todos e devolve a geometria de cada um.
window.referencia = async function referencia() {
  const saida = {};
  for (let i = 0; i < COMODOS.length; i++) {
    const tag = window.montar(i);
    await new Promise((ok) => setTimeout(ok, 420));
    saida[COMODOS[i][0]] = window.medir(tag);
  }
  return saida;
};

window.__pronto = true;
document.getElementById('rotulo').textContent = 'pronto — chame montar(0..5) ou referencia()';
</script>
</body>
</html>
`;

writeFileSync(SAIDA, html, 'utf8');
console.log(`\n  gerado: ${SAIDA}`);
console.log(`  cômodos: ${COMODOS.length}`);
console.log(`  entidades no estado sintético: ${ids.size}\n`);
