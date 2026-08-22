/**
 * Josh — material ON por breakpoint, sem alterar semantica, geometria ou gestos.
 *
 * Round2 (2026-08-22): a primeira versao tentava substituir connectedCallback
 * depois de customElements.define(). Isso nao e um gancho confiavel: o lifecycle
 * do custom element ja foi capturado no registro e a folha podia nunca chegar
 * as instancias criadas depois. Esta versao observa os nos reais e instala a
 * folha diretamente em cada shadowRoot.
 *
 * TABLET/DESKTOP (>800px): continua TILE. O wash/veil ON foi rejeitado na
 * validacao fisica e e removido integralmente. Permanecem PNG ON, texto, filete
 * quente e glow inferior ja existentes.
 *
 * PHONE (<=800px): continua CARD Josh. Somente o material visual ON replica,
 * literalmente, os tokens canonicos bruno-liquid-surface-on-* do Liquid Glass:
 * background, blur/filter, border-color, shadow, sheen e sheen-opacity.
 * Nenhum border-radius, estado, gesto, asset ou layout e alterado aqui.
 */

const JOSH_ON_STYLE_ID = 'bruno-josh-on-material-round2';

const JOSH_ON_CSS = `
/* TABLET / DESKTOP — sem veil/cartela. */
@media (min-width: 801px) {
  .room-card.is-tile.is-room-on::before {
    inset: 0 !important;
    border-radius: 0 !important;
    background: none !important;
    opacity: 0 !important;
  }

  .room-card.is-tile.is-room-on::after {
    opacity: 1 !important;
    background: linear-gradient(
      90deg,
      rgba(255,194,104,0) 0%,
      rgba(255,202,122,0.92) 50%,
      rgba(255,194,104,0) 100%
    ) !important;
    box-shadow: 0 -2px 14px rgba(255,194,102,0.24) !important;
  }
}

/* PHONE — valores literais do estado ON vigente em bruno-liquid-glass.js. */
@media (max-width: 800px) {
  .room-card.is-josh-phone-card.is-room-on {
    --text-main: rgba(248, 251, 255, 0.96);
    --text-soft: rgba(255, 255, 255, 0.52);
    --text-muted: rgba(255, 255, 255, 0.62);
    background:
      radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.30), rgba(255,255,255,0.06) 46%, transparent 73%),
      linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07)),
      linear-gradient(155deg, rgba(255,255,255,0.11), rgba(255,255,255,0.055)) !important;
    border-color: rgba(255,255,255,0.16) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.36),
      inset 1px 0 0 rgba(255,255,255,0.12),
      inset -1px 0 0 rgba(255,255,255,0.07),
      inset 0 -1px 0 rgba(255,255,255,0.04),
      0 8px 24px rgba(0,0,0,0.32) !important;
    backdrop-filter: blur(14px) saturate(1.28) brightness(1.04) !important;
    -webkit-backdrop-filter: blur(14px) saturate(1.28) brightness(1.04) !important;
  }

  .room-card.is-josh-phone-card.is-room-on::before {
    background:
      radial-gradient(112px 72px at 16% 0%, rgba(255,255,255,0.40), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.00) 38%),
      linear-gradient(90deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 48%) !important;
    opacity: 0.85 !important;
  }
}
`;

const observedRoots = new WeakSet<Document | ShadowRoot>();

function installStyle(tile: Element): void {
  const root = tile.shadowRoot;
  if (!root || root.getElementById(JOSH_ON_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = JOSH_ON_STYLE_ID;
  style.textContent = JOSH_ON_CSS;
  root.appendChild(style);
}

function inspectElement(element: Element): void {
  if (element.matches('bruno-room-tile')) installStyle(element);
  element.querySelectorAll('bruno-room-tile').forEach(installStyle);

  if (element.shadowRoot) observeRoot(element.shadowRoot);
  element.querySelectorAll('*').forEach((node) => {
    if (node.shadowRoot) observeRoot(node.shadowRoot);
  });
}

function inspectAddedNode(node: Node): void {
  if (!(node instanceof Element)) return;
  inspectElement(node);
  // Lit costuma criar o shadowRoot no primeiro update depois da conexao.
  // Reinspecionar nos dois frames seguintes cobre esse intervalo sem polling.
  requestAnimationFrame(() => {
    inspectElement(node);
    requestAnimationFrame(() => inspectElement(node));
  });
}

function observeRoot(root: Document | ShadowRoot): void {
  if (observedRoots.has(root)) return;
  observedRoots.add(root);

  root.querySelectorAll('bruno-room-tile').forEach(installStyle);
  root.querySelectorAll('*').forEach((node) => {
    if (node.shadowRoot) observeRoot(node.shadowRoot);
  });

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      mutation.addedNodes.forEach(inspectAddedNode);
    }
  });
  observer.observe(root, { childList: true, subtree: true });
}

void customElements.whenDefined('bruno-room-tile').then(() => {
  observeRoot(document);
  // Cobre instancias que foram promovidas/renderizadas antes da microtask.
  document.querySelectorAll('bruno-room-tile').forEach(installStyle);
});

globalThis.addEventListener?.('bruno-theme-changed', () => {
  document.querySelectorAll('bruno-room-tile').forEach(installStyle);
});
