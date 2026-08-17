// Banco de medicao da FAIXA DE STATUS da Home, em modo telefone.
//
// Existe porque o ajuste pedido e dimensional: as tiles precisam ter largura
// IGUAL e quatro precisam caber inteiras. Escolher o numero sem medir a largura
// natural de cada uma seria chutar — e "Temperatura" e "Energia" tem rotulos
// bem mais longos que "Luzes".
//
//   node scripts/harness/gen-badges-harness.mjs
//   node scripts/harness/serve-harness.mjs scripts/harness/badges-phone.html 8202
import { writeFileSync } from 'node:fs';

const SAIDA = 'scripts/harness/badges-phone.html';

const scripts = [
  '/local/bruno-ui/core/bruno-icons.js',
  '/local/bruno-ui/core/bruno-liquid-glass.js',
  '/local/bruno-ui/core/bruno-theme-manager.js',
  '/local/bruno-ui/core/bruno-josh.js',
  '/local/bruno-ui/core/bruno-visionos.js',
  '/local/bruno-ui/cards/bruno-top-badges-card.js',
];

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Faixa de status no telefone</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0d0f14; color: #eee;
               font: 12px/1.4 system-ui, sans-serif; }
  /* Reproduz o content-slot da shell no telefone: padding 10/10/6. */
  .slot { padding: 10px 10px 6px; }
</style>
</head>
<body>
<div class="slot" id="palco"></div>
${scripts.map((s) => `<script src="${s}"></script>`).join('\n')}
<script>
const ha3min = new Date(Date.now() - 3 * 60000).toISOString();
function e(id, state, attributes = {}) {
  return { entity_id: id, state, attributes, last_changed: ha3min, last_updated: ha3min };
}

// Estado sintetico: alguns grupos ACESOS, para a logica de prioridade agir.
const states = {};
const ligar = (ids) => ids.forEach((id) => { states[id] = e(id, 'on'); });
const desligar = (ids) => ids.forEach((id) => { states[id] = e(id, 'off'); });

window.montarBadges = async function montarBadges(config = {}) {
  const palco = document.getElementById('palco');
  palco.innerHTML = '';
  const el = document.createElement('bruno-top-badges-card');
  palco.appendChild(el);
  if (typeof el.setConfig === 'function') el.setConfig(config);
  el.hass = {
    states, themes: {}, locale: { language: 'pt' },
    callService: () => Promise.resolve(),
    callWS: () => Promise.resolve([]),
    connection: { subscribeEvents: () => Promise.resolve(() => {}), subscribeMessage: () => Promise.resolve(() => {}) },
  };
  await new Promise((ok) => setTimeout(ok, 500));
  return el;
};

// Largura de cada tile, o que a faixa comporta e o que transborda.
window.medirBadges = function medirBadges() {
  const el = document.querySelector('bruno-top-badges-card');
  const raiz = el && el.shadowRoot;
  if (!raiz) return { erro: 'sem shadowRoot' };
  const trilho = raiz.querySelector('.left');
  const badges = [...raiz.querySelectorAll('.badge')];
  const caixaTrilho = trilho.getBoundingClientRect();

  const itens = badges.map((b) => {
    const r = b.getBoundingClientRect();
    const titulo = b.querySelector('.badge-title')?.textContent?.trim() ?? '';
    const sub = b.querySelector('.badge-sub')?.textContent?.trim() ?? '';
    return {
      titulo,
      sub,
      largura: +r.width.toFixed(1),
      inicio: +(r.left - caixaTrilho.left).toFixed(1),
      fim: +(r.right - caixaTrilho.left).toFixed(1),
      aceso: b.classList.contains('is-active'),
    };
  });

  const visivel = +caixaTrilho.width.toFixed(1);
  return {
    viewport: [innerWidth, innerHeight],
    trilhoVisivel: visivel,
    trilhoTotal: +trilho.scrollWidth.toFixed(1),
    larguras: itens.map((i) => i.largura),
    todasIguais: new Set(itens.map((i) => Math.round(i.largura))).size === 1,
    quantasCabemInteiras: itens.filter((i) => i.fim <= visivel + 0.5).length,
    primeiraCortada: itens.find((i) => i.inicio < visivel && i.fim > visivel + 0.5)?.titulo ?? null,
    itens,
  };
};

window.__pronto = true;
void ligar; void desligar;
</script>
</body>
</html>
`;

writeFileSync(SAIDA, html, 'utf8');
console.log('gerado: ' + SAIDA);
