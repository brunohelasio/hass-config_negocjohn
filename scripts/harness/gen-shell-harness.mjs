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
  // Usa o mesmo runtime que iniciou o gerador. No ambiente Codex/Windows o
  // Node e fornecido por caminho absoluto e pode nao existir no PATH.
  execFileSync(process.execPath, ['scripts/validation/extract-subview-config.mjs', '--json'], {
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
  '/local/bruno-ui/cards/bruno-activity-column.js',
];

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Shell responsiva — banco de validação</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0d0f14; color: #eee;
               font: 12px/1.4 system-ui, -apple-system, sans-serif; }
  bruno-shell { display: block; height: 100%; }
  #harness-report {
    position: fixed; top: 8px; right: 8px; z-index: 2147483647;
    max-width: min(520px, calc(100vw - 16px)); max-height: calc(100vh - 16px);
    overflow: auto; color: #eaf2ff; background: rgba(8, 12, 20, 0.88);
    border: 1px solid rgba(255,255,255,0.22); border-radius: 10px;
    box-shadow: 0 8px 30px rgba(0,0,0,0.38); backdrop-filter: blur(12px);
    font: 11px/1.35 ui-monospace, SFMono-Regular, Consolas, monospace;
  }
  #harness-report summary { padding: 7px 9px; cursor: pointer; user-select: none; }
  #harness-report pre { margin: 0; padding: 0 9px 9px; white-space: pre-wrap; }
</style>
</head>
<body>
<details id="harness-report"><summary>Harness: iniciando…</summary><pre></pre></details>
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
const MIDIA_DESLIGADA = new URLSearchParams(location.search).get('media') === 'off';
function estadoDe(id) {
  const [dominio, obj] = id.split('.');
  const attributes = {};
  let state = 'on';
  if (dominio === 'climate') { state = 'cool'; attributes.temperature = 23; attributes.current_temperature = 24; attributes.hvac_modes = ['off','cool','heat','fan_only','dry']; }
  else if (dominio === 'media_player') {
    state = MIDIA_DESLIGADA ? 'off' : 'playing';
    attributes.media_title = 'Faixa';
    attributes.media_artist = 'Artista';
    attributes.media_duration = 169;
    attributes.media_position = 5;
    attributes.volume_level = 0.4;
    attributes.entity_picture = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"%3E%3Cdefs%3E%3ClinearGradient id="g" x2="1" y2="1"%3E%3Cstop stop-color="%23e55871"/%3E%3Cstop offset="1" stop-color="%23372572"/%3E%3C/linearGradient%3E%3C/defs%3E%3Crect width="200" height="200" fill="url(%23g)"/%3E%3Ccircle cx="142" cy="62" r="42" fill="%23f7c66b" fill-opacity=".62"/%3E%3Cpath d="M18 158Q84 78 182 146V200H18Z" fill="%23101628"/%3E%3C/svg%3E';
  }
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
const chamadasServico = [];
window.chamadasServico = chamadasServico;
window.limparChamadasServico = () => { chamadasServico.splice(0); };

const hass = {
  states: {}, themes: {}, language: 'pt', locale: { language: 'pt' },
  callService: (dominio, servico, dados, alvo) => {
    chamadasServico.push({
      dominio: String(dominio || ''),
      servico: String(servico || ''),
      dados: dados ? JSON.parse(JSON.stringify(dados)) : {},
      alvo: alvo ? JSON.parse(JSON.stringify(alvo)) : {},
    });
    return Promise.resolve();
  },
  callWS: () => Promise.resolve([]),
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

class BrunoHarnessActivityCard extends HTMLElement {
  setConfig(config) { this._config = config; }
  set hass(value) { this._hass = value; }
}
if (!customElements.get('bruno-harness-activity-card')) {
  customElements.define('bruno-harness-activity-card', BrunoHarnessActivityCard);
}

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

function _esperar(ms) {
  return new Promise((ok) => setTimeout(ok, ms));
}

function _caixa(e) {
  if (!e) return null;
  const b = e.getBoundingClientRect();
  return {
    esquerda: +b.left.toFixed(1),
    topo: +b.top.toFixed(1),
    direita: +b.right.toFixed(1),
    base: +b.bottom.toFixed(1),
    largura: +b.width.toFixed(1),
    altura: +b.height.toFixed(1),
  };
}

function _visivel(e) {
  if (!e) return false;
  const c = getComputedStyle(e);
  const b = e.getBoundingClientRect();
  return c.display !== 'none' && c.visibility !== 'hidden' && +c.opacity > 0 && b.width > 0.5 && b.height > 0.5;
}

function _corTransparente(cor) {
  const v = String(cor || '').replace(/\\s/g, '').toLowerCase();
  return v === 'transparent' || v === 'rgba(0,0,0,0)' || v.endsWith(',0)');
}

function _semLargura(valor) {
  return Math.abs(Number.parseFloat(valor) || 0) < 0.01;
}

function _contextoRail() {
  const shell = document.querySelector('bruno-shell');
  const shellRoot = shell && shell.shadowRoot;
  const slot = shellRoot && shellRoot.querySelector('.rail-slot');
  const card = slot && slot.firstElementChild;
  const raiz = card && card.shadowRoot;
  const trilho = raiz && raiz.querySelector('.rail');
  return { shell, shellRoot, slot, card, raiz, trilho };
}

function _superficie(e) {
  if (!e) return null;
  const c = getComputedStyle(e);
  const antes = getComputedStyle(e, '::before');
  const bordas = [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth];
  const semFundo = _corTransparente(c.backgroundColor) && c.backgroundImage === 'none';
  const semBorda = bordas.every(_semLargura);
  const semSombra = c.boxShadow === 'none';
  const semFiltro = (c.backdropFilter === 'none' || !c.backdropFilter)
    && (c.webkitBackdropFilter === 'none' || !c.webkitBackdropFilter);
  const semPseudo = antes.display === 'none' || antes.content === 'none'
    || (_corTransparente(antes.backgroundColor) && antes.backgroundImage === 'none' && antes.boxShadow === 'none');
  return {
    raio: c.borderRadius,
    bordas,
    fundo: c.backgroundColor,
    imagemDeFundo: c.backgroundImage,
    sombra: c.boxShadow,
    filtro: c.backdropFilter || c.webkitBackdropFilter || 'none',
    pseudoAntes: {
      display: antes.display,
      conteudo: antes.content,
      fundo: antes.backgroundColor,
      imagemDeFundo: antes.backgroundImage,
      sombra: antes.boxShadow,
    },
    semMoldura: semFundo && semBorda && semSombra && semFiltro && semPseudo,
  };
}

window.faixa = function faixa() {
  const sub = _sub();
  if (!sub || !sub.shadowRoot) return { erro: 'sem subview' };
  const raiz = sub.shadowRoot;
  const linhas = [...raiz.querySelectorAll('.resumo-linha')].filter(_visivel);
  const cortina = [...raiz.querySelectorAll('.curtina, .curtain-dock')].find(_visivel) || null;
  const pecas = [cortina, ...linhas].filter(Boolean).map((e) => {
    const c = getComputedStyle(e);
    const b = e.getBoundingClientRect();
    const bordas = [c.borderTopWidth, c.borderRightWidth, c.borderBottomWidth, c.borderLeftWidth];
    const larguras = bordas.map((valor) => Math.abs(Number.parseFloat(valor) || 0));
    // Filetes horizontais sao parte da linguagem pedida e nao constituem uma
    // moldura de card. O que reprova aqui e raio, sombra, laterais ou uma borda
    // completa em torno do modulo.
    const apenasFiletesHorizontais = larguras[1] < 0.01
      && larguras[3] < 0.01
      && larguras[0] <= 1.1
      && larguras[2] <= 1.1;
    return {
      cls: (e.className || '').split(' ')[0],
      topo: +b.top.toFixed(1),
      base: +b.bottom.toFixed(1),
      altura: +b.height.toFixed(1),
      raio: c.borderRadius,
      // O que delata "card": borda completa, sombra ou fundo proprio.
      bordas: bordas.join('/'),
      sombra: c.boxShadow === 'none' ? 'none' : 'SIM',
      fundo: c.backgroundColor,
      imagemDeFundo: c.backgroundImage,
      semCardIndividual: c.borderRadius === '0px'
        && apenasFiletesHorizontais
        && c.boxShadow === 'none',
    };
  });
  // Emenda entre pecas consecutivas: qualquer valor > 0 quebra o plano.
  const emendas = [];
  for (let i = 1; i < pecas.length; i++) emendas.push(+(pecas[i].topo - pecas[i - 1].base).toFixed(1));
  const cam = raiz.querySelector('.cameras-card');
  const status = raiz.querySelector('.subview-topband');
  const caixaStatus = _caixa(status);
  const caixaCamera = _caixa(cam);
  const primeiraPeca = pecas[0] || null;
  const gapStatusCamera = caixaStatus && caixaCamera
    ? +(caixaCamera.topo - caixaStatus.base).toFixed(1)
    : null;
  const gapCameraFaixa = caixaCamera && primeiraPeca
    ? +(primeiraPeca.topo - caixaCamera.base).toFixed(1)
    : null;
  return {
    viewport: [innerWidth, innerHeight],
    breakpointTelefone: innerWidth <= 800,
    status: caixaStatus,
    camera: caixaCamera,
    gapStatusCamera,
    gapCameraFaixa,
    cameraAncoradaAbaixoStatus: gapStatusCamera != null && gapStatusCamera >= -1 && gapStatusCamera <= 24,
    faixaLogoAbaixoCamera: gapCameraFaixa != null && gapCameraFaixa >= -1 && gapCameraFaixa <= 24,
    pecas,
    emendas,
    planoContinuo: pecas.length > 1 && emendas.every((e) => Math.abs(e) < 0.6),
    semCardsIndividuais: pecas.length > 0 && pecas.every((p) => p.semCardIndividual),
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
  for (const linha of [...raiz.querySelectorAll('.resumo-linha')].filter(_visivel)) {
    const cameraAntes = _caixa(raiz.querySelector('.cameras-card'));
    linha.click();
    await _esperar(320);
    const chave = sub.getAttribute('data-folha');
    const el = chave ? raiz.querySelector(mapa[chave]) : null;
    if (el) {
      const b = el.getBoundingClientRect();
      const c = getComputedStyle(el);
      const scrim = raiz.querySelector('.folha-scrim');
      const cam = raiz.querySelector('.cameras-card');
      const caixaCam = _caixa(cam);
      const caixaScrim = _caixa(scrim);
      const railCtx = _contextoRail();
      const caixaRail = _caixa(railCtx.trilho);
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
      const limiteCamera = Math.min(b.top, caixaRail ? caixaRail.topo : innerHeight);
      const pixelsCamera = caixaCam
        ? Math.max(0, Math.min(caixaCam.base, limiteCamera) - Math.max(caixaCam.topo, 0))
        : 0;
      const folhaX = el.querySelector('.folha-x');
      const recolher = chave === 'luzes'
        ? el.querySelector('.lights-dock-id')
        : el.querySelector('.folha-recolher');
      const concluir = raiz.querySelector('.folha-fechar');
      const cScrim = scrim ? getComputedStyle(scrim) : null;
      const corpoHubAtivo = chave === 'midia'
        ? [...el.querySelectorAll('.mh-source-body')].find(_visivel)
        : null;
      const sobrepoeRail = caixaRail
        ? b.bottom > caixaRail.topo + 0.5 && b.top < caixaRail.base - 0.5
        : null;
      const paddingInferior = Number.parseFloat(c.paddingBottom) || 0;
      const reservaRail = caixaRail ? caixaRail.altura : 0;
      const controlesForaDaRail = caixaRail
        ? paddingInferior >= reservaRail - 2
        : null;
      saida[chave] = {
        topo: +b.top.toFixed(1),
        base: +b.bottom.toFixed(1),
        altura: +b.height.toFixed(1),
        proporcaoViewport: +(b.height / innerHeight).toFixed(3),
        raio: c.borderRadius,
        posicao: c.position,
        bottomCss: c.bottom,
        maxHeightCss: c.maxHeight,
        alturaRolavel: el.scrollHeight,
        rolando: algoRola,
        cortado: ultimo ? ultimo.bottom > b.bottom + 0.5 && !algoRola : false,
        // A camera tem de continuar reconhecivel acima da folha.
        camera: caixaCam,
        cameraTopoAntes: cameraAntes?.topo ?? null,
        deltaCameraAbrir: cameraAntes && caixaCam
          ? +(caixaCam.topo - cameraAntes.topo).toFixed(2)
          : null,
        alturaCorpoHubAtivo: corpoHubAtivo
          ? +corpoHubAtivo.getBoundingClientRect().height.toFixed(1)
          : null,
        cameraVisivelPx: +pixelsCamera.toFixed(1),
        cameraReconhecivel: pixelsCamera >= Math.min(72, (caixaCam?.altura || 0) * 0.25),
        overlay: cScrim ? {
          caixa: caixaScrim,
          display: cScrim.display,
          fundo: cScrim.backgroundColor,
          opacidade: cScrim.opacity,
          filtro: cScrim.backdropFilter || cScrim.webkitBackdropFilter || 'none',
          z: cScrim.zIndex,
        } : null,
        cameraZ: cam ? getComputedStyle(cam).zIndex : null,
        rail: caixaRail,
        railVisivel: _visivel(railCtx.trilho),
        sobrepoeRail,
        continuaSobRail: caixaRail ? sobrepoeRail && Math.abs(b.bottom - innerHeight) <= 2 : null,
        paddingInferior: +paddingInferior.toFixed(1),
        controlesForaDaRail,
        dentroDoViewport: b.top >= -0.5 && b.bottom <= innerHeight + 0.5,
        temConcluir: _visivel(concluir),
        temX: _visivel(folhaX),
        temChevronRecolher: _visivel(recolher),
      };
      if (scrim) scrim.click();
      // ANTERIOR (rollback pos-device): 220ms. O produto conserva a folha por
      // 280ms para percorrer a altura inteira; o banco aguarda uma margem.
      await _esperar(340);
      const cameraDepoisFechar = _caixa(raiz.querySelector('.cameras-card'));
      saida[chave].deltaCameraFechar = cameraAntes && cameraDepoisFechar
        ? +(cameraDepoisFechar.topo - cameraAntes.topo).toFixed(2)
        : null;
    }
  }
  // Congela a lista de folhas antes de acrescentar os campos-resumo. A versao
  // anterior chamava Object.values(saida) depois de inserir dois booleanos;
  // esses booleanos nao tinham railVisivel/cameraReconhecivel e reprovavam os
  // agregados apesar de cada folha individual estar correta.
  const folhasMedidas = Object.values(saida);
  const alturas = folhasMedidas.map((s) => s.altura);
  saida.__equalizadas = alturas.length > 1 && new Set(alturas).size === 1;
  saida.__alturasPorConteudo = alturas.length > 0 && !saida.__equalizadas;
  saida.__railSempreVisivel = folhasMedidas.every((s) =>
    s.railVisivel && s.continuaSobRail === true && s.controlesForaDaRail === true);
  saida.__cameraSempreReconhecivel = folhasMedidas.every((s) => s.cameraReconhecivel);
  saida.__semCorteInalcancavel = folhasMedidas.every((s) => !s.cortado);
  return saida;
};

// O dock: quais itens aparecem e como o ativo e marcado (item 17).
window.dock = function dock() {
  const ctx = _contextoRail();
  const { card, raiz: r, trilho } = ctx;
  if (!card || !r || !trilho) return { erro: 'sem rail' };
  const ct = getComputedStyle(trilho);
  const itens = [...r.querySelectorAll('.nav-button')]
    .filter(_visivel)
    .map((b) => {
      const c = getComputedStyle(b);
      return {
        rotulo: ((b.querySelector('.nav-label') || {}).textContent || '').trim(),
        chave: b.dataset.key || (b.dataset.groupKeys ? 'grupo:' + b.dataset.groupKeys : ''),
        ativo: b.classList.contains('selected'),
        fundo: c.backgroundColor,
      };
    });
  const grupoQuartos = r.querySelector('.nav-button[data-group-keys]');
  const chavesQuartos = grupoQuartos
    ? String(grupoQuartos.dataset.groupKeys || '').split(/[\\s,]+/).map((v) => v.trim()).filter(Boolean)
    : [];
  return {
    viewport: [innerWidth, innerHeight],
    breakpointTelefone: innerWidth <= 800,
    caixa: _caixa(trilho),
    direcao: ct.flexDirection,
    moldura: _superficie(trilho),
    itens,
    quantidade: itens.length,
    rotulos: itens.map((i) => i.rotulo),
    grupoQuartos: grupoQuartos ? {
      visivel: _visivel(grupoQuartos),
      rotulo: ((grupoQuartos.querySelector('.nav-label') || {}).textContent || '').trim(),
      chaves: chavesQuartos,
    } : null,
  };
};

// Abre somente o seletor "Quartos" e prova que as tres rotas existem. Nao
// navega para nenhum quarto, portanto a medicao nao desmonta a subview ativa.
window.validarRail = async function validarRail() {
  const antes = window.dock();
  const ctx = _contextoRail();
  if (!ctx.raiz) return { erro: 'sem rail' };
  const botao = ctx.raiz.querySelector('.nav-button[data-group-keys]');
  const sheet = ctx.raiz.querySelector('.more-sheet');
  let menu = null;
  if (botao && _visivel(botao)) {
    botao.click();
    await _esperar(40);
    const itensMenu = [...ctx.raiz.querySelectorAll('.more-item')]
      .filter(_visivel)
      .map((item) => {
        const secao = item.dataset.section;
        const indice = Number(item.dataset.index);
        const cfg = Number.isInteger(indice) && ctx.card?._config?.[secao]
          ? ctx.card._config[secao][indice]
          : null;
        return {
          rotulo: (item.textContent || '').trim(),
          chave: cfg?.key || null,
        };
      });
    menu = {
      visivel: _visivel(sheet),
      caixa: _caixa(sheet),
      itens: itensMenu,
      quantidade: itensMenu.length,
      tresQuartos: ['casal', 'marina', 'miguel'].every((k) => itensMenu.some((i) => i.chave === k)),
    };
    botao.click();
    await _esperar(20);
  }
  const phone = innerWidth <= 800;
  const esperadosTelefone = ['Home', 'Sala', 'Cozinha', 'Office', 'Quartos'];
  const esperadosTablet = ['Home', 'Sala', 'Cozinha', 'Office', 'Q. Casal', 'Q. Marina', 'Q. Miguel', 'Power'];
  const esperado = phone ? esperadosTelefone : esperadosTablet;
  return {
    ...antes,
    menu,
    esperado,
    itensEsperados: antes.rotulos?.length === esperado.length
      && esperado.every((rotulo, i) => antes.rotulos[i] === rotulo),
    cincoItensNoTelefone: phone ? antes.quantidade === 5 : null,
    oitoItensNoTablet: phone ? null : antes.quantidade === 8,
    quartosComTresOpcoes: phone ? Boolean(menu?.tresQuartos) : null,
  };
};

// Exercita os controles DIRETOS da Cortina pela interface. O stub do hass
// registra dominio, servico, dados e alvo; assim a prova nao depende apenas de
// o botao existir ou de uma funcao privada ter o nome esperado.
window.validarCortina = async function validarCortina() {
  const sub = _sub();
  if (!sub || !sub.shadowRoot) return { erro: 'sem subview' };
  const raiz = sub.shadowRoot;
  const entidade = sub._sub?.entities?.curtain || null;
  window.limparChamadasServico();
  const esperadoPorAcao = {
    'cover-open': 'open_cover',
    'cover-stop': 'stop_cover',
    'cover-close': 'close_cover',
  };
  const botoes = {};
  for (const [acao, servico] of Object.entries(esperadoPorAcao)) {
    const botao = raiz.querySelector('.curtain-action-button[data-action="' + acao + '"]');
    const inicio = chamadasServico.length;
    if (botao) botao.click();
    await _esperar(10);
    const chamadas = chamadasServico.slice(inicio);
    botoes[acao] = {
      existe: Boolean(botao),
      visivel: _visivel(botao),
      habilitado: botao ? !botao.disabled : false,
      chamadas,
      correto: chamadas.some((c) => c.dominio === 'cover'
        && c.servico === servico
        && c.dados?.entity_id === entidade),
    };
  }

  const slider = raiz.querySelector('.curtain-range');
  const inicioSlider = chamadasServico.length;
  if (slider) {
    slider.value = '37';
    slider.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    slider.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
  }
  await _esperar(10);
  const chamadasSlider = chamadasServico.slice(inicioSlider);
  // ANTERIOR (rollback 2026-08-15): o banco esperava position === 37. O range
  // agora representa percentual visual FECHADO e preserva a calibracao fisica
  // historica; 37% fechado corresponde a 59% aberto enviado ao cover.
  const esperadoSlider = (() => {
    const aberturaVisual = 100 - 37;
    const pontos = [
      { visual: 0, position: 0 },
      { visual: 25, position: 33 },
      { visual: 50, position: 47 },
      { visual: 75, position: 70 },
      { visual: 100, position: 100 },
    ];
    for (let i = 1; i < pontos.length; i += 1) {
      const anterior = pontos[i - 1];
      const atual = pontos[i];
      if (aberturaVisual <= atual.visual) {
        const razao = (aberturaVisual - anterior.visual) / (atual.visual - anterior.visual);
        return Math.round(anterior.position + ((atual.position - anterior.position) * razao));
      }
    }
    return 100;
  })();
  const sliderCorreto = chamadasSlider.some((c) => c.dominio === 'cover'
    && c.servico === 'set_cover_position'
    && c.dados?.entity_id === entidade
    && Number(c.dados?.position) === esperadoSlider);
  return {
    viewport: [innerWidth, innerHeight],
    entidade,
    botoes,
    slider: {
      existe: Boolean(slider),
      visivel: _visivel(slider),
      valorTestado: 37,
      posicaoEsperada: esperadoSlider,
      chamadas: chamadasSlider,
      correto: sliderCorreto,
    },
    todasChamadas: [...chamadasServico],
    todosCorretos: Boolean(entidade)
      && Object.values(botoes).every((b) => b.correto)
      && sliderCorreto,
  };
};

// Confirma os tres caminhos de fechamento exigidos para a folha: toque fora,
// chevron junto ao titulo e arrasto para baixo. Cada rodada parte da mesma
// primeira linha.
window.validarFechamentos = async function validarFechamentos() {
  const sub = _sub();
  if (!sub || !sub.shadowRoot) return { erro: 'sem subview' };
  const raiz = sub.shadowRoot;
  const primeira = [...raiz.querySelectorAll('.resumo-linha')].find(_visivel);
  if (!primeira) return { erro: 'sem linha de abertura visivel' };
  const abrir = async () => {
    if (sub.hasAttribute('data-folha')) {
      const scrimAtual = raiz.querySelector('.folha-scrim');
      if (scrimAtual) scrimAtual.click();
      await _esperar(340);
    }
    primeira.click();
    await _esperar(40);
    const chave = sub.getAttribute('data-folha');
    const mapa = { luzes: '.glass-card.lights-card', ac: '.glass-card.ac-card', midia: '.glass-card.media-hub-card', eletro: '.glass-card.appliances-card' };
    return chave ? raiz.querySelector(mapa[chave]) : null;
  };

  await abrir();
  const scrim = raiz.querySelector('.folha-scrim');
  if (scrim) scrim.click();
  await _esperar(340);
  const toqueFora = !sub.hasAttribute('data-folha');

  const folhaChevron = await abrir();
  const chaveChevron = sub.getAttribute('data-folha');
  const chevron = folhaChevron && (chaveChevron === 'luzes'
    ? folhaChevron.querySelector('.lights-dock-id')
    : folhaChevron.querySelector('.folha-recolher'));
  if (chevron) chevron.click();
  await _esperar(340);
  const botaoChevron = !sub.hasAttribute('data-folha');

  const folhaArrasto = await abrir();
  let arrasto = false;
  if (folhaArrasto) {
    folhaArrasto.scrollTop = 0;
    const y = folhaArrasto.getBoundingClientRect().top + 12;
    folhaArrasto.dispatchEvent(new PointerEvent('pointerdown', {
      bubbles: true, composed: true, pointerId: 7, pointerType: 'touch', button: 0, clientY: y,
    }));
    globalThis.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, composed: true, pointerId: 7, pointerType: 'touch', buttons: 1, clientY: y + 122,
    }));
    globalThis.dispatchEvent(new PointerEvent('pointerup', {
      bubbles: true, composed: true, pointerId: 7, pointerType: 'touch', button: 0, clientY: y + 122,
    }));
    await _esperar(340);
    arrasto = !sub.hasAttribute('data-folha');
  }
  return {
    toqueFora,
    botaoChevron,
    arrasto,
    todosCorretos: toqueFora && botaoChevron && arrasto,
  };
};

window.validarTablet = async function validarTablet() {
  const sub = _sub();
  if (!sub || !sub.shadowRoot) return { erro: 'sem subview' };
  const raiz = sub.shadowRoot;
  const rail = await window.validarRail();
  const seletoresMoveis = [
    '.resumo-telefone',
    '.resumo-linha',
    '.folha-scrim',
    '.folha-fechar',
    '.folha-x',
    '.folha-recolher',
  ];
  const domMovel = Object.fromEntries(seletoresMoveis.map((seletor) => {
    const elementos = [...raiz.querySelectorAll(seletor)];
    return [seletor, {
      existentes: elementos.length,
      visiveis: elementos.filter(_visivel).length,
      displays: [...new Set(elementos.map((e) => getComputedStyle(e).display))],
    }];
  }));
  const esquerda = raiz.querySelector('.content-left');
  const direita = raiz.querySelector('.right-column');
  const cEsquerda = _caixa(esquerda);
  const cDireita = _caixa(direita);
  const nenhumDomMovelVisivel = Object.values(domMovel).every((m) => m.visiveis === 0);
  return {
    viewport: [innerWidth, innerHeight],
    viewportEsperado: innerWidth === 1920 && innerHeight === 1200,
    breakpointTablet: innerWidth > 800,
    rail,
    oitoItensNaRail: rail.oitoItensNoTablet === true,
    domMovel,
    nenhumDomMovelVisivel,
    folhaInativa: !sub.hasAttribute('data-folha'),
    layout: {
      main: _caixa(raiz.querySelector('.room-subview')),
      contentLeft: cEsquerda,
      rightColumn: cDireita,
      colunasLadoALado: cEsquerda && cDireita
        ? cDireita.esquerda >= cEsquerda.direita - 2
        : null,
      camera: _caixa(raiz.querySelector('.cameras-card')),
      cortina: _caixa(raiz.querySelector('.curtain-dock')),
      luzes: _caixa(raiz.querySelector('.lights-card')),
    },
    aprovado: innerWidth > 800
      && rail.oitoItensNoTablet === true
      && nenhumDomMovelVisivel
      && !sub.hasAttribute('data-folha'),
  };
};

// Prova o contrato de navegacao interna do telefone. O hash pode mudar para
// manter o deep-link, mas sem emitir hashchange: esse evento e o que o WebView
// externo do HA pode interpretar como troca de rota e remontar o Lovelace.
// Tambem confirma que a mesma shell permanece montada e que a instancia Sala
// sai e volta do cache, em vez de ser recriada a cada toque na rail.
window.validarNavegacaoTelefone = async function validarNavegacaoTelefone() {
  const ctx = _contextoRail();
  const shell = ctx.shell;
  const content = ctx.shellRoot?.querySelector('.content-slot');
  const salaInicial = shell?._sectionCache?.get('sala') || _sub();
  if (!shell || !content || !ctx.raiz || !salaInicial) return { erro: 'shell incompleta' };

  let eventosHash = 0;
  let menorQuantidadeVisivel = [...content.children].filter((e) => !e.hidden).length;
  const aoHash = () => { eventosHash++; };
  const observar = new MutationObserver(() => {
    const quantidade = [...content.children].filter((e) => !e.hidden).length;
    menorQuantidadeVisivel = Math.min(menorQuantidadeVisivel, quantidade);
  });
  globalThis.addEventListener('hashchange', aoHash);
  observar.observe(content, { childList: true, subtree: false, attributes: true, attributeFilter: ['hidden'] });

  const visitadas = [];
  for (const chave of ['office', 'cozinha', 'sala']) {
    const botao = ctx.raiz.querySelector('.nav-button[data-key="' + chave + '"]');
    if (!botao) continue;
    botao.click();
    await _esperar(90);
    visitadas.push(content.dataset.section || null);
  }

  observar.disconnect();
  globalThis.removeEventListener('hashchange', aoHash);
  const salaFinal = shell?._sectionCache?.get('sala') || _sub();
  const shellPreservada = document.querySelector('bruno-shell') === shell && shell.isConnected;
  const salaReutilizada = salaFinal === salaInicial;
  const semTelaVazia = menorQuantidadeVisivel >= 1;
  const semHashchange = eventosHash === 0;
  const sequenciaCorreta = visitadas.join(',') === 'office,cozinha,sala';
  return {
    visitadas,
    hashFinal: location.hash,
    eventosHash,
    menorQuantidadeVisivel,
    shellPreservada,
    salaReutilizada,
    semTelaVazia,
    semHashchange,
    sequenciaCorreta,
    aprovado: shellPreservada && salaReutilizada && semTelaVazia && semHashchange && sequenciaCorreta,
  };
};

// Reproduz a partida fria real do bloco dinamico: inativo => host com 0px;
// Spotify liga => o primeiro plano precisa nascer sem depender de uma medida
// positiva anterior. O card de teste e neutro e nunca toca nas subviews reais.
window.validarAtividadeDinamica = async function validarAtividadeDinamica() {
  const host = document.createElement('bruno-activity-column');
  host.style.cssText = 'position:fixed;inset:0 auto auto 0;width:390px;z-index:-1';
  host.setConfig({
    available_height: '300px',
    max_per_column: 1,
    second_column_min_width: 4000,
    slots: [{
      key: 'media',
      entity: 'binary_sensor.home_activity_media',
      height: 248,
      card: { type: 'custom:bruno-harness-activity-card' },
    }],
  });
  document.body.appendChild(host);
  host.hass = { states: { 'binary_sensor.home_activity_media': { state: 'off' } } };
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const antes = {
    vazio: host.classList.contains('is-empty'),
    altura: getComputedStyle(host).height,
  };
  host.hass = { states: { 'binary_sensor.home_activity_media': { state: 'on' } } };
  await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
  const slot = host.shadowRoot?.querySelector('[data-slot-key="media"]');
  const depois = {
    vazio: host.classList.contains('is-empty'),
    altura: getComputedStyle(host).height,
    slotVisivel: Boolean(slot && !slot.classList.contains('is-hidden')),
    alturaSlot: slot ? getComputedStyle(slot).height : null,
  };
  host.remove();
  return {
    antes,
    depois,
    aprovado: antes.vazio === true
      && antes.altura === '0px'
      && depois.vazio === false
      && depois.slotVisivel === true
      && depois.alturaSlot === '248px',
  };
};

window.validarTelefone = async function validarTelefone() {
  const faixaAtual = window.faixa();
  const rail = await window.validarRail();
  const folhasAtuais = await window.folhas();
  const cortina = await window.validarCortina();
  const fechamentos = await window.validarFechamentos();
  const navegacao = await window.validarNavegacaoTelefone();
  const atividadeDinamica = await window.validarAtividadeDinamica();
  const aprovado = innerWidth === 428
    && innerHeight === 926
    && faixaAtual.planoContinuo === true
    && faixaAtual.semCardsIndividuais === true
    && rail.moldura?.semMoldura === true
    && rail.itensEsperados === true
    && rail.quartosComTresOpcoes === true
    && folhasAtuais.__railSempreVisivel === true
    && folhasAtuais.__cameraSempreReconhecivel === true
    && folhasAtuais.__semCorteInalcancavel === true
    && cortina.todosCorretos === true
    && fechamentos.todosCorretos === true
    && navegacao.aprovado === true
    && atividadeDinamica.aprovado === true;
  return {
    viewport: [innerWidth, innerHeight],
    viewportEsperado: innerWidth === 428 && innerHeight === 926,
    faixa: faixaAtual,
    rail,
    folhas: folhasAtuais,
    cortina,
    fechamentos,
    navegacao,
    atividadeDinamica,
    aprovado,
  };
};

// Percorre as seis configuracoes sem alterar produto. E deliberadamente uma
// funcao separada: leva alguns segundos e nao deve atrasar a abertura visual.
window.validarTodosOsComodos = async function validarTodosOsComodos() {
  const inicial = (_sub()?.getAttribute('data-room')) || 'sala';
  const saida = {};
  for (const comodo of COMODOS) {
    await window.montarShell(comodo);
    saida[comodo] = {
      faixa: window.faixa(),
      folhas: await window.folhas(),
      rail: window.dock(),
    };
  }
  await window.montarShell(inicial);
  return saida;
};

function _mostrarRelatorio(resultado, titulo) {
  const painel = document.getElementById('harness-report');
  if (!painel) return;
  const resumo = painel.querySelector('summary');
  const pre = painel.querySelector('pre');
  if (resumo) resumo.textContent = titulo;
  if (pre) pre.textContent = JSON.stringify(resultado, null, 2);
}

// A pagina se monta sozinha. Parametros uteis:
//   ?room=sala&mode=phone              abre a Sala e mede o resumo mobile
//   ?room=sala&mode=phone&suite=1      roda a bateria mobile completa
//   ?room=sala&mode=tablet&suite=1     roda rail e isolamento do tablet
//   ?mode=phone&suite=rooms            percorre os seis comodos
//   ?room=sala&mode=phone&sheet=luzes  deixa uma folha aberta para inspecao
//   ?room=sala&mode=phone&sheet=midia&source=spotify  escolhe uma fonte do acordeao
//   ?report=1                          deixa o painel JSON expandido
//   ?auto=0                            mantem apenas as funcoes manuais
window.__funcoesProntas = true;
window.__pronto = false;
window.__resultadoHarness = null;

async function _iniciarAutomaticamente() {
  const params = new URLSearchParams(location.search);
  const painel = document.getElementById('harness-report');
  if (params.get('report') === '1' && painel) painel.open = true;
  if (params.get('auto') === '0') {
    window.__pronto = true;
    _mostrarRelatorio({ manual: true, funcoes: true }, 'Harness manual pronto');
    return;
  }

  const comodoPedido = String(params.get('room') || 'sala').toLowerCase();
  const comodo = COMODOS.includes(comodoPedido) ? comodoPedido : 'sala';
  const modoPedido = String(params.get('mode') || 'auto').toLowerCase();
  const modo = modoPedido === 'tablet' || modoPedido === 'phone'
    ? modoPedido
    : (innerWidth <= 800 ? 'phone' : 'tablet');
  const suite = String(params.get('suite') || '0').toLowerCase();

  try {
    await Promise.all([
      customElements.whenDefined('bruno-shell'),
      customElements.whenDefined('bruno-room-subview'),
    ]);
    await window.montarShell(comodo);
    const folhaPedida = String(params.get('sheet') || '').toLowerCase();
    if (modo === 'phone' && ['luzes', 'midia', 'ac', 'eletro'].includes(folhaPedida)) {
      const sub = _sub();
      const raiz = sub?.shadowRoot;
      const titulos = { luzes: 'Iluminacao', midia: 'Hub de Midia', ac: 'Ar-condicionado', eletro: 'Eletrodomesticos' };
      const normalizar = (valor) => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const linha = [...(raiz?.querySelectorAll('.resumo-linha') || [])]
        .filter(_visivel)
        .find((el) => {
          const texto = normalizar(el.textContent);
          if (folhaPedida === 'midia') return texto.includes('Hub de Midia') || texto.includes('Estacao de trabalho');
          return texto.includes(titulos[folhaPedida]);
        });
      if (linha) {
        linha.click();
        await _esperar(340);
      }
      const fontePedida = String(params.get('source') || '').toLowerCase();
      if (folhaPedida === 'midia' && ['tv', 'pc', 'spotify'].includes(fontePedida)) {
        const rotulos = { tv: 'TV', pc: 'PC', spotify: 'Spotify' };
        const fonte = [...(raiz?.querySelectorAll('.mh-source-head') || [])]
          .find((el) => normalizar(el.textContent).trim().startsWith(rotulos[fontePedida]));
        if (fonte) {
          fonte.click();
          await _esperar(160);
        }
      }
    }
    let resultado;
    if (folhaPedida) resultado = {
      viewport: [innerWidth, innerHeight],
      folhaPedida,
      folhaAberta: _sub()?.getAttribute('data-folha') || null,
      faixa: window.faixa(),
      rail: window.dock(),
    };
    else if (suite === 'rooms') resultado = await window.validarTodosOsComodos();
    else if (suite === '1' && modo === 'phone') resultado = await window.validarTelefone();
    else if (suite === '1' && modo === 'tablet') resultado = await window.validarTablet();
    else if (modo === 'phone') {
      resultado = {
        viewport: [innerWidth, innerHeight],
        viewportEsperado: innerWidth === 428 && innerHeight === 926,
        faixa: window.faixa(),
        rail: await window.validarRail(),
      };
    } else resultado = await window.validarTablet();
    window.__resultadoHarness = resultado;
    _mostrarRelatorio(resultado, 'Harness ' + modo + ' · ' + comodo + ' · pronto');
  } catch (erro) {
    window.__resultadoHarness = { erro: String(erro?.stack || erro) };
    _mostrarRelatorio(window.__resultadoHarness, 'Harness · ERRO');
  } finally {
    window.__pronto = true;
  }
}

window.__autoPromise = _iniciarAutomaticamente();
</script>
</body>
</html>
`;

writeFileSync(SAIDA, html, 'utf8');
console.log('gerado: ' + SAIDA + '  (bundle: ' + bundle + ')');
