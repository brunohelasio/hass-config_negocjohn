/**
 * Josh — ajuste visual EXCLUSIVO do estado ON dos room tiles.
 *
 * Existem duas linguagens diferentes por breakpoint e elas nao devem ser
 * misturadas:
 *
 * 1) TABLET/DESKTOP (> 800px): o comodo continua sendo TILE, sem cartela.
 *    O ON recebe apenas um wash leitoso que morre antes das extremidades e um
 *    filete inferior mais legivel. Nenhuma borda/raio de card e criada.
 *
 * 2) PHONE (<= 800px): o comodo continua sendo CARD. O ON replica a receita
 *    visual de `bruno-liquid-surface-on-*` do tema Liquid Glass, preservando o
 *    raio/estrutura do Josh e sem alterar estado, gesto, layout ou OFF.
 *
 * A superficie vive no Shadow DOM de <bruno-room-tile>; este bridge injeta uma
 * folha pequena no shadowRoot e nao toca na logica do componente.
 */

const JOSH_PHONE_ON_STYLE_ID = 'bruno-josh-on-material';

const JOSH_PHONE_ON_CSS = `
/* TABLET / DESKTOP — continua TILE, sem cartela. */
@media (min-width: 801px) {
  .room-card.is-tile.is-room-on::before {
    inset: 0 !important;
    border-radius: 0 !important;
    background:
      radial-gradient(
        ellipse 74% 70% at 50% 66%,
        rgba(255,255,255,0.12) 0%,
        rgba(255,255,255,0.065) 38%,
        rgba(255,255,255,0.024) 58%,
        transparent 78%
      ),
      radial-gradient(
        ellipse 54% 42% at 50% 18%,
        rgba(255,255,255,0.055) 0%,
        transparent 74%
      ) !important;
    opacity: 1 !important;
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

/* PHONE — receita ON do Liquid Glass, sem alterar o raio Josh. */
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

  .room-card.is-josh-phone-card.is-room-on::after {
    opacity: 0 !important;
    box-shadow: none !important;
  }

  .room-card.is-josh-phone-card.is-room-on .room-asset-on {
    filter: none !important;
  }
}
`;

type JoshLifecycleElement = HTMLElement & {
  __brunoJoshPhoneOnPatched?: boolean;
  connectedCallback?: () => void;
};

type TileCtor = CustomElementConstructor & {
  prototype: JoshLifecycleElement;
};

function installStyle(tile: Element): void {
  const root = tile.shadowRoot;
  if (!root || root.getElementById(JOSH_PHONE_ON_STYLE_ID)) return;
  const style = document.createElement('style');
  style.id = JOSH_PHONE_ON_STYLE_ID;
  style.textContent = JOSH_PHONE_ON_CSS;
  root.appendChild(style);
}

function walkOpenRoots(root: Document | ShadowRoot): void {
  root.querySelectorAll('bruno-room-tile').forEach(installStyle);
  root.querySelectorAll('*').forEach((node) => {
    if (node.shadowRoot) walkOpenRoots(node.shadowRoot);
  });
}

void customElements.whenDefined('bruno-room-tile').then(() => {
  const ctor = customElements.get('bruno-room-tile') as TileCtor | undefined;
  if (!ctor) return;

  const proto = ctor.prototype;
  if (!proto.__brunoJoshPhoneOnPatched) {
    const originalConnected = proto.connectedCallback;
    proto.connectedCallback = function connectedCallbackWithJoshPhoneOn(this: JoshLifecycleElement) {
      originalConnected?.call(this);
      queueMicrotask(() => installStyle(this));
    };
    proto.__brunoJoshPhoneOnPatched = true;
  }

  // customElements.define() pode ter promovido nos ja conectados antes da
  // microtask de whenDefined; cobre essas instancias sem observer permanente.
  walkOpenRoots(document);
});
