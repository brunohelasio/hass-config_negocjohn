/**
 * Josh phone — somente o estado ON dos room tiles.
 *
 * A superfície do tile vive dentro do Shadow DOM de <bruno-room-tile>; por isso
 * um CSS global do tema não a alcança. Este bridge instala uma folha pequena no
 * shadowRoot sem tocar em estado, gestos, layout ou no estado OFF.
 *
 * O seletor exige as três classes simultaneamente:
 *   is-josh-phone-card + is-room-on + breakpoint <= 800px.
 * Tablet/desktop e qualquer outro tema ficam fora por construção.
 */

const JOSH_PHONE_ON_STYLE_ID = 'bruno-josh-phone-on-material';

const JOSH_PHONE_ON_CSS = `
@media (max-width: 800px) {
  .room-card.is-josh-phone-card.is-room-on {
    --text-main: rgba(255, 255, 255, 0.99);
    --text-soft: rgba(255, 255, 255, 0.76);
    --text-muted: rgba(255, 255, 255, 0.78);
    background:
      radial-gradient(172px 132px at 15% -8%, rgba(255,255,255,0.40), rgba(255,255,255,0.10) 48%, transparent 73%),
      radial-gradient(150px 118px at 96% 96%, rgba(255,214,128,0.11), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.065) 42%, rgba(255,255,255,0.095)),
      linear-gradient(155deg, rgba(31,35,42,0.68), rgba(20,23,29,0.56) 52%, rgba(13,15,20,0.48)) !important;
    border-color: rgba(255,255,255,0.24) !important;
    box-shadow:
      inset 0 1px 0 rgba(255,255,255,0.42),
      inset 1px 0 0 rgba(255,255,255,0.15),
      inset -1px 0 0 rgba(255,255,255,0.09),
      inset 0 -1px 0 rgba(255,255,255,0.07),
      0 10px 26px rgba(0,0,0,0.28) !important;
    backdrop-filter: blur(8px) saturate(1.28) brightness(1.15) !important;
    -webkit-backdrop-filter: blur(8px) saturate(1.28) brightness(1.15) !important;
  }

  .room-card.is-josh-phone-card.is-room-on::before {
    background:
      radial-gradient(118px 76px at 16% 0%, rgba(255,255,255,0.40), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.22), transparent 38%),
      linear-gradient(90deg, rgba(255,255,255,0.10), transparent 48%) !important;
    opacity: 0.88 !important;
  }

  .room-card.is-josh-phone-card.is-room-on::after {
    inset: auto 18px 7px 18px !important;
    height: 1px !important;
    opacity: 1 !important;
    background: linear-gradient(90deg, transparent, #FFD60A 50%, transparent) !important;
    box-shadow: 0 -1px 9px rgba(255,214,10,0.30) !important;
  }

  .room-card.is-josh-phone-card.is-room-on .room-asset-on {
    filter: brightness(1.15) saturate(1.03);
  }
}
`;

type TileCtor = CustomElementConstructor & {
  prototype: HTMLElement & { __brunoJoshPhoneOnPatched?: boolean };
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
    proto.connectedCallback = function connectedCallbackWithJoshPhoneOn(this: HTMLElement) {
      originalConnected?.call(this);
      queueMicrotask(() => installStyle(this));
    };
    proto.__brunoJoshPhoneOnPatched = true;
  }

  // customElements.define() pode ter promovido nós já conectados antes da
  // microtask de whenDefined; cobre essas instâncias sem observer permanente.
  walkOpenRoots(document);
});
