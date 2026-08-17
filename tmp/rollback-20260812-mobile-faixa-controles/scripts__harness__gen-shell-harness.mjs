// Banco de medicao da SHELL REAL em modo telefone.
//
// POR QUE ELE EXISTE, e o que o anterior errou:
//
// `gen-phone-harness.mjs` anexa `bruno-room-subview` DIRETO num content-slot
// que eu escrevi a mao. Em producao a subview e criada por
// `helpers.createCardElement` e vive dentro do `bruno-shell` de verdade, com o
// CSS dele, os irmaos ocultos das outras secoes, o backdrop e o dock.
//
// Medi 428x926 no banco antigo e disse que estava certo. No aparelho havia
// ~340px de vazio no topo. A diferenca nao estava no componente: estava no
// que eu NAO reproduzi. Este banco monta a shell inteira.
//
//   node scripts/harness/gen-shell-harness.mjs
//   node scripts/harness/serve-harness.mjs scripts/harness/shell-phone.html 8201
import { writeFileSync, readdirSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SAIDA = 'scripts/harness/shell-phone.html';

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

const bundle = readdirSync('config/www/dashboard')
  .filter((f) => /^bruno-dashboard\..*\.js$/.test(f))
  .sort(
    (a, b) =>
      statSync(`config/www/dashboard/${b}`).mtimeMs - statSync(`config/www/dashboard/${a}`).mtimeMs,
  )[0];

const scripts = [
  `/local/dashboard/${bundle}`,
  '/local/bruno-ui/core/bruno-icons.js',
  '/local/bruno-ui/core/bruno-liquid-glass.js',
  '/local/bruno-ui/core/bruno-surface-material.js',
  '/local/bruno-ui/core/bruno-theme-manager.js',
  '/local/bruno-ui/core/bruno-josh.js',
  '/local/bruno-ui/core/bruno-visionos.js',
  '/local/bento-sidebar-card.js',
  '/local/bruno-ui/core/bruno-shell.js',
];

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shell no telefone</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0d0f14; color: #eee;
               font: 12px/1.4 system-ui, -apple-system, sans-serif; }
  bruno-shell { display: block; height: 100%; }
</style>
</head>
<body>
${scripts
  .map((s) =>
    s.includes('/dashboard/')
      ? `<script type="module" src="${s}"></script>`
      : `<script src="${s}"></script>`,
  )
  .join('\n')}

<script>
const IDS = ${JSON.stringify([...ids])};
const ha3min = new Date(Date.now() - 3 * 60000).toISOString();
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
    else if (/semantic/.test(obj)) { state = 'occupied'; attributes.display = 'Ocupado'; }
    else if (/operation_state/.test(obj)) state = 'run';
    else state = 'on';
  }
  return { entity_id: id, state, attributes, last_changed: ha3min, last_updated: ha3min };
}
const hass = {
  states: {}, themes: {}, language: 'pt', locale: { language: 'pt' },
  callService: () => Promise.resolve(), callWS: () => Promise.resolve([]),
  connection: { subscribeEvents: () => Promise.resolve(() => {}), subscribeMessage: () => Promise.resolve(() => {}) },
};
for (const id of IDS) hass.states[id] = estadoDe(id);

// A shell usa loadCardHelpers do HA. O stub cria o elemento customizado
// direto — que e o que createCardElement faz para custom cards.
globalThis.loadCardHelpers = async () => ({
  createCardElement: (config) => {
    const tag = String(config.type || '').replace('custom:', '');
    const el = document.createElement(tag);
    if (typeof el.setConfig === 'function') el.setConfig(config);
    return el;
  },
});

const COMODOS = ['sala', 'office', 'cozinha', 'casal', 'marina', 'miguel'];
const secoes = {};
for (const c of COMODOS) secoes[c] = { type: 'custom:bruno-room-subview', room: c };

window.montarShell = async function montarShell(secao) {
  document.querySelectorAll('bruno-shell').forEach((n) => n.remove());
  location.hash = secao;
  const el = document.createElement('bruno-shell');
  el.setConfig({
    default_section: secao,
    // A rail e a REAL de rail_rooms.yaml, nao um resumo de tres itens: e ela
    // que carrega hide_on_phone e phone_more, e sem isso o dock medido aqui
    // nao seria o dock do aparelho.
    rails: { rooms: { type: 'custom:bento-sidebar-liquid-card',
      phone_more: { label: 'Quartos', icon: 'casal', keys: ['casal', 'marina', 'miguel'] },
      top_items: [
        { key: 'home', icon: 'home', label: 'Home' },
        { key: 'sala', icon: 'sala', label: 'Sala' },
        { key: 'cozinha', icon: 'cozinha', label: 'Cozinha' },
        { key: 'office', icon: 'office', label: 'Office' },
        { key: 'casal', icon: 'casal', label: 'Q. Casal', hide_on_phone: true },
        { key: 'marina', icon: 'marina', label: 'Q. Marina', hide_on_phone: true },
        { key: 'miguel', icon: 'miguel', label: 'Q. Miguel', hide_on_phone: true },
      ],
      bottom_items: [{ key: 'power', icon: 'power', label: 'Power', hide_on_phone: true }],
    } },
    default_rail: 'rooms',
    section_rails: Object.fromEntries(COMODOS.map((c) => [c, 'rooms'])),
    sections: secoes,
  });
  document.body.appendChild(el);
  el.hass = hass;
  await new Promise((ok) => setTimeout(ok, 900));

  // OBRIGATORIO: o tablet do usuario roda o tema JOSH, e o material dele
  // desenha a faixa inferior como main::before. Sem forcar, o banco mede com
  // o tema default, onde esse pseudo-elemento e content:none — e um defeito de
  // 320px passa despercebido. Foi o que aconteceu em 2026-08-10.
  for (const sub of el.shadowRoot.querySelectorAll('bruno-room-subview')) {
    sub.setAttribute('data-bruno-subview-surface-theme', 'josh');
    // OBRIGATORIO: este banco roda com a aba OCULTA, e com a aba oculta as
    // animacoes e transicoes CSS NAO progridem. Uma animacao de entrada com
    // fill-mode deixa o estado INICIAL congelado, e a medicao le a posicao de
    // partida como se fosse a final. Aconteceu: a folha aparecia 14px abaixo
    // da base da tela (o translateY(14px) do primeiro quadro) e eu quase
    // reportei isso como defeito do produto.
    // A correcao e NEUTRALIZAR, nunca "esperar mais tempo" — esperar nao
    // adianta, porque o relogio da animacao nem comeca.
    const anular = document.createElement('style');
    anular.dataset.banco = 'sem-animacao';
    anular.textContent = '*{animation:none !important;transition:none !important}';
    sub.shadowRoot && sub.shadowRoot.appendChild(anular);
  }
  await new Promise((ok) => setTimeout(ok, 120));
  return el;
};

// O que ocupa a tela, de cima para baixo, dentro do content-slot.
window.raioX = function raioX() {
  const shell = document.querySelector('bruno-shell');
  const sr = shell && shell.shadowRoot;
  if (!sr) return { erro: 'shell sem shadowRoot' };
  const slot = sr.querySelector('.content-slot');
  const rail = sr.querySelector('.rail-slot');
  const sub = [...slot.children].find((n) => n.tagName === 'BRUNO-ROOM-SUBVIEW' && !n.hasAttribute('hidden'));
  const cx = (e) => { const c = getComputedStyle(e); return { display: c.display, height: c.height, minHeight: c.minHeight, padding: c.padding, position: c.position }; };
  const cai = (e) => { const b = e.getBoundingClientRect(); return [+b.top.toFixed(0), +b.height.toFixed(0)]; };

  const filhos = [...slot.children].map((n) => ({
    tag: n.tagName.toLowerCase(),
    oculto: n.hasAttribute('hidden'),
    caixa: cai(n),
    display: getComputedStyle(n).display,
  }));

  const saida = {
    viewport: [innerWidth, innerHeight],
    slot: { caixa: cai(slot), ...cx(slot) },
    rail: rail ? { caixa: cai(rail), z: getComputedStyle(rail).zIndex } : null,
    filhosDoSlot: filhos,
  };

  if (sub && sub.shadowRoot) {
    const raiz = sub.shadowRoot;
    saida.subview = { caixa: cai(sub), ...cx(sub) };
    const main = raiz.querySelector('.room-subview');
    if (main) saida.main = { caixa: cai(main), ...cx(main) };
    const alvos = ['.subview-topband', '.hero-panel', '.hero-stage', '.hero-content', '.content-left', '.cams-media-row', '.right-column', '.curtain-dock', '.cameras-card', '.resumo-telefone', '.lights-card'];
    saida.modulos = alvos.map((s) => {
      const e = raiz.querySelector(s);
      if (!e) return { sel: s, ausente: true };
      const c = getComputedStyle(e);
      return { sel: s, caixa: cai(e), display: c.display, order: c.order };
    });
    // Quem, entre os itens de flex do main, esta acima do topband?
    if (main) {
      const band = raiz.querySelector('.subview-topband');
      const yBand = band ? band.getBoundingClientRect().top : 0;
      saida.acimaDaBarra = [...main.children]
        .map((n) => ({ cls: n.className || n.tagName.toLowerCase(), caixa: cai(n), display: getComputedStyle(n).display, order: getComputedStyle(n).order }))
        .filter((n) => n.caixa[0] < yBand - 1 || n.caixa[1] > 0);
    }
  }
  return saida;
};

// ── rev. faixa-de-tiles ───────────────────────────────────────────────────
// O raioX acima mede CAIXAS. Esta rodada precisa responder outra pergunta: os
// modulos formam UM PLANO ou continuam quatro cards? Caixa nao responde isso —
// dois cards encostados medem igual a um plano. Entao aqui se olha o que
// DESENHA a moldura: raio, borda, sombra e a distancia entre um modulo e o
// seguinte.
function _sub() {
  const shell = document.querySelector('bruno-shell');
  const slot = shell && shell.shadowRoot && shell.shadowRoot.querySelector('.content-slot');
  if (!slot) return null;
  return [...slot.children].find((n) => n.tagName === 'BRUNO-ROOM-SUBVIEW' && !n.hasAttribute('hidden')) || null;
}

window.faixa = function faixa() {
  const sub = _sub();
  if (!sub || !sub.shadowRoot) return { erro: 'sem subview' };
  const raiz = sub.shadowRoot;
  const linhas = [...raiz.querySelectorAll('.resumo-linha')];
  const cortina = raiz.querySelector('.curtina, .curtain-dock');
  const pecas = [cortina, ...linhas].filter(Boolean).map((e) => {
    const c = getComputedStyle(e);
    const b = e.getBoundingClientRect();
    return {
      cls: (e.className || '').split(' ')[0],
      topo: +b.top.toFixed(1),
      base: +b.bottom.toFixed(1),
      altura: +b.height.toFixed(1),
      raio: c.borderRadius,
      // O que delata "card": borda completa, sombra ou fundo proprio.
      bordas: [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth].join('/'),
      sombra: c.boxShadow === 'none' ? 'none' : 'SIM',
      fundo: c.backgroundColor,
    };
  });
  // Emenda entre pecas consecutivas: qualquer valor > 0 quebra o plano.
  const emendas = [];
  for (let i = 1; i < pecas.length; i++) emendas.push(+(pecas[i].topo - pecas[i - 1].base).toFixed(1));
  const cam = raiz.querySelector('.cameras-card');
  return {
    viewport: [innerWidth, innerHeight],
    camera: cam ? { topo: +cam.getBoundingClientRect().top.toFixed(1), altura: +cam.getBoundingClientRect().height.toFixed(1) } : null,
    pecas,
    emendas,
    planoContinuo: emendas.every((e) => Math.abs(e) < 0.6),
  };
};

// Altura REAL de cada folha, aberta uma a uma. O item 10 do roteiro proibe
// equalizacao artificial: se as tres derem o mesmo numero, o piso voltou.
window.folhas = async function folhas() {
  const sub = _sub();
  if (!sub || !sub.shadowRoot) return { erro: 'sem subview' };
  const raiz = sub.shadowRoot;
  const mapa = { luzes: '.glass-card.lights-card', ac: '.glass-card.ac-card', midia: '.glass-card.media-hub-card', eletro: '.glass-card.appliances-card' };
  const saida = {};
  for (const linha of [...raiz.querySelectorAll('.resumo-linha')]) {
    linha.click();
    await new Promise((ok) => setTimeout(ok, 320));
    const chave = sub.getAttribute('data-folha');
    const el = chave ? raiz.querySelector(mapa[chave]) : null;
    if (el) {
      const b = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      const scrim = raiz.querySelector('.folha-scrim');
      const cam = raiz.querySelector('.cameras-card');
      // "cortado" tem de significar CONTEUDO INALCANCAVEL, nao "conteudo fora
      // da area visivel". Uma lista que rola sempre tem itens fora da caixa —
      // e isso e o comportamento correto, nao defeito. A primeira versao desta
      // metrica confundiu os dois e acusou a folha de luzes da Sala e do
      // Q. Miguel; a lista rolava normalmente (352 de conteudo em 321 de
      // caixa). Agora so acusa quando NADA no caminho rola.
      const conteudo = [...el.querySelectorAll('.light-cell, .mh-source, .ac-control-wrap, .appliance-cell')];
      const ultimo = conteudo.length ? conteudo[conteudo.length - 1].getBoundingClientRect() : null;
      const algoRola = [el, ...el.querySelectorAll('*')].some((n) => {
        const ov = getComputedStyle(n).overflowY;
        return (ov === 'auto' || ov === 'scroll') && n.scrollHeight > n.clientHeight + 1;
      });
      saida[chave] = {
        topo: +b.top.toFixed(1),
        base: +b.bottom.toFixed(1),
        altura: +b.height.toFixed(1),
        raio: c.borderRadius,
        posicao: c.position,
        rolando: algoRola,
        cortado: ultimo ? ultimo.bottom > b.bottom + 0.5 && !algoRola : false,
        // A camera tem de continuar visivel acima da folha.
        cameraVisivel: cam ? +(b.top - cam.getBoundingClientRect().top).toFixed(1) : null,
        scrim: scrim ? getComputedStyle(scrim).backgroundColor : null,
        temConcluir: getComputedStyle(raiz.querySelector('.folha-fechar')).display !== 'none',
        temX: !!raiz.querySelector('.folha-x') && getComputedStyle(raiz.querySelector('.folha-x')).display !== 'none',
      };
      sub.shadowRoot.querySelector('.folha-scrim').click();
      await new Promise((ok) => setTimeout(ok, 120));
    }
  }
  const alturas = Object.values(saida).map((s) => s.altura);
  saida.__equalizadas = alturas.length > 1 && new Set(alturas).size === 1;
  return saida;
};

// O dock: quais itens aparecem e como o ativo e marcado (item 17).
window.dock = function dock() {
  const shell = document.querySelector('bruno-shell');
  const rail = shell && shell.shadowRoot && shell.shadowRoot.querySelector('.rail-slot');
  const card = rail && rail.firstElementChild;
  if (!card || !card.shadowRoot) return { erro: 'sem rail' };
  const r = card.shadowRoot;
  const trilho = r.querySelector('.rail');
  const ct = getComputedStyle(trilho);
  const itens = [...r.querySelectorAll('.nav-button')]
    .filter((b) => getComputedStyle(b).display !== 'none')
    .map((b) => {
      const c = getComputedStyle(b);
      return {
        rotulo: (b.querySelector('.nav-label') || {}).textContent,
        chave: b.dataset.key || (b.dataset.groupKeys ? 'grupo:' + b.dataset.groupKeys : ''),
        ativo: b.classList.contains('selected'),
        fundo: c.backgroundColor,
      };
    });
  return {
    // Se qualquer um destes nao for "neutro", a rail virou card.
    moldura: { raio: ct.borderRadius, borda: ct.borderTopWidth, fundo: ct.backgroundColor, sombra: ct.boxShadow === 'none' ? 'none' : 'SIM' },
    itens,
  };
};

window.__pronto = true;
</script>
</body>
</html>
`;

writeFileSync(SAIDA, html, 'utf8');
console.log('gerado: ' + SAIDA + '  (bundle: ' + bundle + ')');
