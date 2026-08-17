// Gera a pagina de medicao das subviews EM MODO TELEFONE.
//
// Por que existe: o banco de paridade (gen-subview-harness.mjs) monta a subview
// na celula do TABLET — 86px de rail + content-slot de 12px. O telefone e outra
// caixa: a rail vira dock na base, o content-slot tem padding 10/10/6 e rola.
// Medir a 1280 ou a 1920 nao diz nada sobre o que acontece a 390.
//
// O que ele responde, com numero:
//   1. a ORDEM VISUAL dos modulos no telefone, comodo a comodo;
//   2. a ALTURA de cada modulo;
//   3. o que fica ACIMA DA DOBRA (viewport util = tela menos o dock).
//
// Uso:
//   node scripts/harness/gen-phone-harness.mjs
//   node scripts/harness/serve-harness.mjs scripts/harness/phone-layout.html 8199
import { writeFileSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SAIDA = 'scripts/harness/phone-layout.html';

const cfgs = JSON.parse(
  execFileSync('node', ['scripts/validation/extract-subview-config.mjs', '--json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }),
);

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

// Ids do componente NOVO (a config antiga usa quarto-casal; o novo usa casal).
const COMODOS = ['sala', 'office', 'cozinha', 'casal', 'marina', 'miguel'];

const bundle = readdirSync('config/www/dashboard')
  .filter((f) => /^bruno-dashboard\..*\.js$/.test(f))
  .sort(
    (a, b) =>
      statSync(`config/www/dashboard/${b}`).mtimeMs - statSync(`config/www/dashboard/${a}`).mtimeMs,
  )[0];
if (!bundle) throw new Error('bundle nao encontrado em config/www/dashboard');

const scripts = [
  `/local/dashboard/${bundle}`,
  '/local/bruno-ui/core/bruno-icons.js',
  '/local/bruno-ui/core/bruno-liquid-glass.js',
  '/local/bruno-ui/core/bruno-surface-material.js',
  '/local/bruno-ui/core/bruno-theme-manager.js',
  '/local/bruno-ui/core/bruno-josh.js',
  '/local/bruno-ui/core/bruno-visionos.js',
  '/local/bruno-ui/cards/bruno-activity-column.js',
  '/local/bruno-ui/cards/bruno-hero-card.js',
  '/local/bruno-ui/cards/bruno-top-badges-card.js',
];

// Inline no banco local: alguns navegadores de automacao bloqueiam recursos
// JavaScript servidos por 127.0.0.1, embora permitam a propria pagina HTML.
// O produto continua carregando os mesmos arquivos por extra_module_url; isto
// altera apenas o harness e elimina um falso negativo da infraestrutura.
const inlineScripts = scripts.map((url) => {
  const file = `config/www/${url.replace(/^\/local\//, '')}`;
  const source = readFileSync(file, 'utf8').replace(/<\/script/gi, '<\\/script');
  const type = url.includes('/dashboard/') ? ' type="module"' : '';
  return `<script${type}>\n${source}\n</script>`;
});

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<!-- OBRIGATORIO. Sem esta linha o navegador em emulacao movel adota o viewport
     de layout padrao de 980px e TODA media query de telefone deixa de casar —
     a pagina mede como tablet e o defeito passa despercebido. Custou uma
     rodada inteira de medicao errada. -->
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Layout das subviews no telefone</title>
<style>
  html, body { margin: 0; padding: 0; background: #0d0f14; color: #eee;
               font: 12px/1.4 system-ui, -apple-system, sans-serif; }
  /* Reproduz o content-slot da shell em modo telefone:
     grid 1 coluna x 2 linhas, conteudo rolavel em cima, dock na base.
     Ver o bloco @media (max-width: 800px) de core/bruno-shell.js. */
  .shell { display: grid; grid-template-columns: minmax(0, 1fr);
           grid-template-rows: minmax(0, 1fr) auto; height: 100vh; }
  .content-slot { grid-row: 1; overflow-y: auto; padding: 10px 10px 6px; }
  .content-slot > * { height: auto; min-height: 100%; display: block; }
  .dock { grid-row: 2; height: var(--dock-h, 64px); background: rgba(12,14,20,0.9);
          border-top: 1px solid rgba(255,255,255,0.18); }
  .rotulo { position: fixed; top: 2px; right: 6px; z-index: 99; opacity: .55; font-size: 10px; }
</style>
</head>
<body>
<div class="rotulo" id="rotulo">carregando…</div>
<div class="shell">
  <div class="content-slot" id="palco"></div>
  <div class="dock"></div>
</div>

${inlineScripts.join('\n')}

<script>
const COMODOS = ${JSON.stringify(COMODOS)};
const IDS = ${JSON.stringify([...ids])};

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

// Os modulos de primeiro nivel de uma subview. A medicao le o DOM RENDERIZADO
// e ordena por posicao VERTICAL — que e o que o dedo encontra, e nao a ordem
// do DOM (no telefone os modulos sao reordenados por 'order').
const MODULOS = [
  ['topband',   '.subview-topband'],
  ['hero',      '.hero-panel'],
  ['cortina',   '.curtain-dock'],
  ['luzes',     '.lights-card'],
  ['cameras',   '.cameras-card'],
  ['hub',       '.media-hub-card'],
  ['ac',        '.ac-card'],
  ['eletro',    '.appliances-card'],
  ['rodape',    '.subview-footer'],
];

window.montar = function montar(comodo) {
  const palco = document.getElementById('palco');
  palco.innerHTML = '';
  const el = document.createElement('bruno-room-subview');
  palco.appendChild(el);
  el.setConfig({ room: comodo });
  el.hass = hass;
  document.getElementById('rotulo').textContent = comodo + ' · ' + innerWidth + 'x' + innerHeight;
  return el;
};

// Mede um comodo: ordem visual, altura e o que cabe acima da dobra.
window.medirComodo = function medirComodo() {
  const host = document.querySelector('bruno-room-subview');
  const raiz = host && host.shadowRoot;
  if (!raiz) return { erro: 'sem shadowRoot' };
  const slot = document.getElementById('palco');
  const base = slot.getBoundingClientRect();
  const dobra = slot.clientHeight;      // altura util do content-slot

  const itens = [];
  for (const [nome, sel] of MODULOS) {
    const el = raiz.querySelector(sel);
    if (!el) continue;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.height < 2) continue;
    itens.push({
      modulo: nome,
      y: +(r.top - base.top + slot.scrollTop).toFixed(0),
      h: +r.height.toFixed(0),
      w: +r.width.toFixed(0),
      order: cs.order,
    });
  }
  itens.sort((a, b) => a.y - b.y || a.h - b.h);

  const alturaTotal = raiz.querySelector('.room-subview')?.getBoundingClientRect().height ?? 0;
  return {
    viewport: [innerWidth, innerHeight],
    dobra,
    alturaTotal: +alturaTotal.toFixed(0),
    rolagem: +(alturaTotal - dobra).toFixed(0),
    ordem: itens.map((i) => i.modulo).join(' > '),
    acimaDaDobra: itens.filter((i) => i.y < dobra).map((i) => i.modulo).join(', '),
    itens,
  };
};

// Percorre os seis comodos.
window.medirTelefone = async function medirTelefone() {
  const saida = {};
  for (const c of COMODOS) {
    window.montar(c);
    await new Promise((ok) => setTimeout(ok, 420));
    saida[c] = window.medirComodo();
  }
  return saida;
};

// Resumo curto, para leitura direta.
window.resumo = async function resumo() {
  const dados = await window.medirTelefone();
  const linhas = [];
  for (const [c, d] of Object.entries(dados)) {
    if (d.erro) { linhas.push(c + ': ' + d.erro); continue; }
    linhas.push(
      c.padEnd(8) + ' | rolagem ' + String(d.rolagem).padStart(5) + 'px | ' +
      'acima da dobra: ' + (d.acimaDaDobra || '—'),
    );
    linhas.push('         | ordem: ' + d.ordem);
    linhas.push('         | alturas: ' + d.itens.map((i) => i.modulo + ' ' + i.h).join(' · '));
  }
  return linhas.join('\\n');
};

// Mede a altura INTRINSECA do hero no telefone. Ele nao entra no grid da
// Home aqui: o que importa e quanto ele PEDE, que e o numero do orcamento.
window.medirHero = async function medirHero() {
  const caixa = document.createElement("div");
  caixa.style.cssText = "width:" + (innerWidth - 20) + "px;position:absolute;left:0;top:0;visibility:hidden";
  document.body.appendChild(caixa);
  const el = document.createElement("bruno-hero-card");
  caixa.appendChild(el);
  el.setConfig({ hero_layout: "v2", background: "/local/images/home_savant.jpg",
    entities: { time: "sensor.time", weather: "weather.forecast_casa", sun: "sun.sun", insights: "sensor.home_insights" },
    calendar: { compact_events_to_show: 3, calendars: [] }, cameras: { show: false } });
  const agora2 = new Date();
  el.hass = { states: {
    "sensor.time": { state: "14:32", attributes: {} },
    "weather.forecast_casa": { state: "sunny", attributes: { temperature: 27, humidity: 58, forecast: [] } },
    "sun.sun": { state: "above_horizon", attributes: { next_setting: new Date(agora2.getTime()+3e6).toISOString(), next_rising: new Date(agora2.getTime()+6e7).toISOString() } },
    "sensor.home_insights": { state: "2", attributes: { items: [
      { text: "Lava-loucas terminou", detail: "ha 12 min", tone: "amber" },
      { text: "Cortina da varanda aberta", detail: "60%", tone: "blue" } ] } },
  }, themes: {}, locale: { language: "pt" }, callService: () => Promise.resolve(), callWS: () => Promise.resolve([]),
    connection: { subscribeEvents: () => Promise.resolve(() => {}), subscribeMessage: () => Promise.resolve(() => {}) } };
  await new Promise((ok) => setTimeout(ok, 700));
  const sr = el.shadowRoot;
  const alt = (sel) => { const n = sr.querySelector(sel); return n ? +n.getBoundingClientRect().height.toFixed(0) : null; };
  const visiveis = [...sr.querySelectorAll(".event-line")].filter((n) => getComputedStyle(n).display !== "none");
  const r = { hero: +el.getBoundingClientRect().height.toFixed(0), largura: +el.getBoundingClientRect().width.toFixed(0),
    relogio: alt(".clock"), saudacao: alt(".greeting"), faixasNoDom: sr.querySelectorAll(".event-line").length,
    faixasVisiveis: visiveis.length, primeira: visiveis[0] ? visiveis[0].textContent.replace(/s+/g, " ").trim().slice(0, 60) : null };
  caixa.remove();
  return r;
};

// Mede o indicador semantico autorizado para a Home mobile nos tres estados:
// continuidade neutra, um quarto ativo e dois quartos ativos. Ele e anexado
// diretamente porque nao depende da matriz para calcular texto ou geometria.
window.medirIndicadorHome = async function medirIndicadorHome() {
  const el = document.createElement('bruno-home-overflow-indicator');
  el.style.width = (innerWidth - 20) + 'px';
  document.body.appendChild(el);
  el.setConfig({
    rooms: [
      { name: 'Q. Marina', entities: ['light.grupo_luzes_quarto_marina', 'climate.ac_quarto_marina'] },
      { name: 'Q. Miguel', entities: ['light.grupo_luzes_quarto_miguel', 'climate.ac_quarto_miguel'] },
    ],
    dynamic_entities: ['binary_sensor.home_activity_media'],
  });
  const medir = () => {
    const indicador = el.shadowRoot.querySelector('.indicator');
    return {
      host: +el.getBoundingClientRect().height.toFixed(0),
      linha: +indicador.getBoundingClientRect().height.toFixed(0),
      texto: indicador.textContent.replace(/\\s+/g, ' ').trim(),
      ativo: indicador.classList.contains('is-active'),
      fundo: getComputedStyle(indicador).backgroundColor,
      pointerEvents: getComputedStyle(el).pointerEvents,
    };
  };
  const estado = (state) => ({ state, attributes: {} });
  const hass = { states: {
    'light.grupo_luzes_quarto_marina': estado('off'),
    'climate.ac_quarto_marina': estado('off'),
    'light.grupo_luzes_quarto_miguel': estado('off'),
    'climate.ac_quarto_miguel': estado('off'),
    'binary_sensor.home_activity_media': estado('off'),
  } };
  el.hass = hass;
  const neutro = medir();
  hass.states['light.grupo_luzes_quarto_marina'] = estado('on');
  el.hass = hass;
  const um = medir();
  hass.states['climate.ac_quarto_miguel'] = estado('cool');
  el.hass = hass;
  const dois = medir();
  el.remove();
  return { neutro, um, dois };
};

window.medirPrioridadeStatus = function medirPrioridadeStatus() {
  const el = document.createElement('bruno-top-badges-card');
  el.setConfig({ entities: {
    locks: ['lock.teste'], door: 'binary_sensor.porta', motion: 'binary_sensor.movimento',
    lights_group: 'light.grupo_teste', lights: ['light.teste'],
    media: ['media_player.teste'], climate: ['climate.teste'], curtains: [],
    energy_status: 'sensor.inexistente', expanded: 'input_select.inexistente',
  } });
  el.hass = { states: {
    'lock.teste': { state: 'locked', attributes: {} },
    'binary_sensor.porta': { state: 'off', attributes: {} },
    'binary_sensor.movimento': { state: 'off', attributes: {} },
    'light.grupo_teste': { state: 'on', attributes: { entity_id: ['light.teste'] } },
    'light.teste': { state: 'on', attributes: {} },
    'media_player.teste': { state: 'playing', attributes: {} },
    'climate.teste': { state: 'off', attributes: {} },
  }, callService: () => Promise.resolve() };
  const ordem = el._models().map((model) => model.key);
  return { largura: innerWidth, ordem };
};

window.__pronto = true;
Promise.resolve().then(async () => {
  const resultado = {
    hero: await window.medirHero(),
    indicador: await window.medirIndicadorHome(),
    status: window.medirPrioridadeStatus(),
  };
  document.getElementById('rotulo').textContent = JSON.stringify(resultado);
});
</script>
</body>
</html>
`;

writeFileSync(SAIDA, html, 'utf8');
console.log('gerado: ' + SAIDA + '  (bundle: ' + bundle + ')');
