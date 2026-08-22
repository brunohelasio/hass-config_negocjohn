const BRUNO_LIQUID_GLASS_VERSION = '20260723-liquid-performance-1';
const BRUNO_LIQUID_GLASS_STYLE_ID = 'bruno-liquid-glass-tokens';

const BRUNO_LIQUID_GLASS_TOKENS = {
  'bruno-liquid-accent': '255, 159, 10',
  'bruno-liquid-warm-accent': '255, 214, 10',
  'bruno-liquid-green-accent': '50, 215, 75',

  // Home Assistant theme values mirrored from Liquid Glass.yaml.
  'background-image': "center / cover no-repeat fixed url('https://raw.githubusercontent.com/Nezz/homeassistant-visionos-theme/refs/heads/static/macOS_26_Dark.webp')",
  'primary-background-color': 'rgb(18, 11, 25)',
  'secondary-background-color': 'rgb(18, 11, 25)',
  'app-header-background-color': 'rgba(18, 11, 25, 0.3)',
  'ha-card-background': 'rgba(0, 0, 0, 0.38)',
  'app-theme-color': 'rgb(0, 0, 0)',
  'primary-text-color': 'rgba(255, 255, 255, 0.96)',
  'secondary-text-color': 'rgba(222, 222, 222, 0.96)',
  'divider-color': 'rgba(152, 152, 157, 0.3)',
  // ANTERIOR (rollback raio unico 2026-08-22): 34px
  'ha-card-border-radius': '20px',
  'ha-card-features-border-radius': 'var(--ha-card-border-radius)',
  'ha-card-border-width': '0',
  'ha-card-backdrop-filter': 'blur(5px)',
  'ha-card-box-shadow': `
    3px 3px 0.5px -3.5px rgba(255,255,255,0.30) inset,
    -2px -2px 0.5px -2px rgba(255,255,255,0.30) inset,
    0 0 8px 1px rgba(255,255,255,0.10) inset,
    0 0 2px 0 rgba(0,0,0,0.10)
  `,
  'red-color': '#FF453A',
  'pink-color': '#FF375F',
  'purple-color': '#BF5AF2',
  'indigo-color': '#5E5CE6',
  'blue-color': '#0A84FF',
  'cyan-color': '#5AC8F5',
  'green-color': '#32D74B',
  'yellow-color': '#FFD60A',
  'orange-color': '#FF9F0A',
  'brown-color': '#AC8E68',
  'primary-color': 'var(--orange-color)',


  // ANTERIOR (rollback raio unico 2026-08-22): 34px
  'bruno-liquid-card-radius': '20px',
  // ANTERIOR (rollback raio unico 2026-08-22): 24px
  'bruno-liquid-card-radius-compact': '16px',
  // ANTERIOR (rollback raio unico 2026-08-22): 24px
  'bruno-liquid-room-radius': '20px',
  // ANTERIOR (rollback raio unico 2026-08-22): 18px
  'bruno-liquid-cell-radius': '16px',
  // ANTERIOR (rollback raio unico 2026-08-22): 18px
  'bruno-liquid-control-radius': '16px',
  // ANTERIOR (rollback raio unico 2026-08-22): 14px
  'bruno-liquid-control-radius-compact': '12px',
  'bruno-liquid-dock-radius': '999px',
  'bruno-liquid-rail-radius': '999px',

  'bruno-liquid-motion-fast': '160ms ease',
  'bruno-liquid-motion-medium': '220ms cubic-bezier(0.2, 0.8, 0.2, 1)',

  'bruno-liquid-icon-title': '16px',
  'bruno-liquid-icon-section': '20px',
  'bruno-liquid-icon-control': '23px',
  'bruno-liquid-icon-status': '15px',
  'bruno-liquid-icon-overflow': '19px',

  // Shared premium block skin: neutral real glass, thin borders and low-fill
  // surfaces so the photo reads through without turning the cards brown.
  'bruno-liquid-card-background': `
    linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012) 48%, rgba(0,0,0,0.045)),
    var(--ha-card-background, rgba(0,0,0,0.380))
  `,
  'bruno-liquid-card-filter': 'var(--ha-card-backdrop-filter, blur(5px)) saturate(1.06) brightness(1.02)',
  'bruno-liquid-card-border-color': 'rgba(255,255,255,0.120)',
  'bruno-liquid-card-border': '1px solid var(--bruno-liquid-card-border-color)',
  'bruno-liquid-card-shadow': 'var(--ha-card-box-shadow)',
  'bruno-liquid-card-sheen': `
    linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 38%)
  `,
  'bruno-liquid-card-sheen-opacity': '0.08',
  'bruno-liquid-card-edge-glow': 'none',
  'bruno-liquid-dock-background': `
    radial-gradient(86px 70px at 18% 0%, rgba(255,255,255,0.19), transparent 72%),
    radial-gradient(98px 82px at 92% 100%, rgba(var(--accent, var(--bruno-liquid-accent)),0.08), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.106), rgba(255,255,255,0.030) 42%, rgba(255,255,255,0.048)),
    linear-gradient(155deg, rgba(18,24,36,0.70), rgba(10,13,20,0.60) 52%, rgba(18,16,17,0.42))
  `,
  'bruno-liquid-dock-filter': 'blur(28px) saturate(1.56) contrast(1.05)',
  'bruno-liquid-dock-border': '1px solid rgba(255,255,255,0.17)',
  'bruno-liquid-dock-shadow': `
    inset 0 0 0 1px rgba(255,255,255,0.060),
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 1px 0 0 rgba(255,255,255,0.10),
    inset 0 -1px 0 rgba(255,255,255,0.045),
    0 14px 34px rgba(0,0,0,0.30),
    0 0 22px rgba(110,150,210,0.060)
  `,
  'bruno-liquid-dock-sheen': `
    radial-gradient(58px 42px at 18% 2%, rgba(255,255,255,0.20), transparent 72%),
    radial-gradient(64px 72px at 92% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.10), transparent 74%),
    linear-gradient(180deg, rgba(255,255,255,0.115), rgba(255,255,255,0.00) 38%)
  `,
  'bruno-liquid-dock-sheen-opacity': '0.70',
  'bruno-liquid-dock-edge-glow': `
    linear-gradient(125deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08) 34%, rgba(255,255,255,0.026) 62%, rgba(255,190,120,0.17) 100%)
  `,

  'bruno-liquid-rail-background': `
    radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
    radial-gradient(38px 110px at 92% 86%, rgba(var(--accent, var(--bruno-liquid-accent)),0.10), transparent 68%),
    linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
    linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
  `,
  'bruno-liquid-rail-filter': 'blur(30px) saturate(1.58) contrast(1.05)',
  'bruno-liquid-rail-border': '1px solid rgba(255,255,255,0.16)',
  'bruno-liquid-rail-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.23),
    inset 1px 0 0 rgba(255,255,255,0.11),
    inset -1px -1px 0 rgba(255,255,255,0.026),
    0 18px 44px rgba(0,0,0,0.31),
    0 0 24px rgba(110,150,210,0.075)
  `,
  'bruno-liquid-rail-sheen': `
    radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
    radial-gradient(42px 70px at 94% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.16), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
    linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
  `,
  'bruno-liquid-rail-sheen-opacity': '0.78',

  'bruno-liquid-cell-background': `
    linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006)),
    rgba(9,11,15,0.030)
  `,
  'bruno-liquid-cell-border-color': 'rgba(255,255,255,0.050)',
  'bruno-liquid-cell-border': '1px solid var(--bruno-liquid-cell-border-color)',
  'bruno-liquid-cell-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.040)
  `,
  'bruno-liquid-cell-active-warm-background': `
    linear-gradient(180deg, rgba(255,255,255,0.042), rgba(255,255,255,0.012)),
    rgba(var(--bruno-liquid-warm-accent),0.030)
  `,
  'bruno-liquid-cell-active-warm-border': 'rgba(var(--bruno-liquid-warm-accent),0.180)',
  'bruno-liquid-cell-active-warm-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.060),
    0 0 12px rgba(var(--bruno-liquid-warm-accent),0.060)
  `,

  'bruno-liquid-chip-background': `
    linear-gradient(180deg, rgba(255,255,255,0.036), rgba(255,255,255,0.012)),
    rgba(9,11,15,0.060)
  `,
  'bruno-liquid-chip-border': '1px solid rgba(255,255,255,0.070)',
  'bruno-liquid-chip-shadow': 'inset 0 1px 0 rgba(255,255,255,0.060)',
  'bruno-liquid-chip-filter': 'blur(12px) saturate(0.96) brightness(1.04)',

  'bruno-liquid-control-background': `
    linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)),
    rgba(255,255,255,0.030)
  `,
  'bruno-liquid-control-border-color': 'rgba(255,255,255,0.070)',
  'bruno-liquid-control-border': '1px solid var(--bruno-liquid-control-border-color)',
  'bruno-liquid-control-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.060)
  `,
  'bruno-liquid-control-filter': 'blur(12px) saturate(0.96) brightness(1.04)',
  'bruno-liquid-control-warm-background': 'rgba(var(--bruno-liquid-warm-accent),0.038)',
  'bruno-liquid-control-warm-border': '1px solid rgba(var(--bruno-liquid-warm-accent),0.180)',
  'bruno-liquid-control-warm-shadow': 'inset 0 1px 0 rgba(255,255,255,0.060)',
  'bruno-liquid-control-blue-background': `
    linear-gradient(180deg, rgba(96,165,250,0.42), rgba(38,92,138,0.24)),
    rgba(255,255,255,0.030)
  `,
  'bruno-liquid-control-blue-border': 'rgba(10,132,255,0.320)',
  'bruno-liquid-control-blue-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.100),
    0 0 14px rgba(10,132,255,0.120)
  `,
  'bruno-liquid-control-green-background': `
    linear-gradient(180deg, rgba(46,231,122,0.160), rgba(19,76,54,0.080)),
    rgba(255,255,255,0.030)
  `,
  'bruno-liquid-control-green-border': 'rgba(46,231,122,0.220)',
  'bruno-liquid-control-green-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.080),
    0 0 12px rgba(46,231,122,0.080)
  `,

  'bruno-liquid-selected-blue-background': `
    linear-gradient(180deg, rgba(105,150,230,0.440), rgba(59,92,178,0.300)),
    rgba(255,255,255,0.028)
  `,
  'bruno-liquid-selected-blue-border': 'rgba(210,228,255,0.300)',
  'bruno-liquid-selected-blue-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.110),
    0 0 14px rgba(10,132,255,0.140)
  `,

  // Dedicated transient surface: used by compact selectors/popovers that need
  // markedly stronger contrast than the shared translucent card skin.
  'bruno-liquid-popup-background': `
    linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
  `,
  'bruno-liquid-popup-border': '1px solid rgba(255,255,255,0.115)',
  'bruno-liquid-popup-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.100),
    0 18px 36px rgba(0,0,0,0.300)
  `,
  'bruno-liquid-popup-filter': 'blur(20px) saturate(1.16) brightness(0.94)',
  'bruno-liquid-popup-option-background': 'rgba(255,255,255,0.045)',
  'bruno-liquid-popup-option-hover-background': 'rgba(var(--bruno-liquid-warm-accent),0.115)',

  'bruno-liquid-surface-bottom-line': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
  'bruno-liquid-surface-bottom-line-opacity': '0',

  /* NOVO (2026-07-23): estado "aceso" deixou de ser quase igual ao "apagado"
     (ambos eram preto translucido, diferenca imperceptivel). Por pedido do
     usuario, o aceso agora usa o MESMO tratamento do estado apagado do tema
     "Liquid Glass - iOS" (vidro claro/frosted) — o apagado deste tema
     continua intocado, so o aceso foi trocado. Fonte: bruno-liquid-glass-ios.js,
     bloco 'bruno-liquid-surface-off-*'. */
  /* ANTERIOR (rollback):
  'bruno-liquid-surface-on-background': `
    linear-gradient(180deg, rgba(255,255,255,0.048), rgba(255,255,255,0.014) 54%, rgba(255,255,255,0.020)),
    rgba(9,11,15,0.260)
  `,
  'bruno-liquid-surface-on-filter': 'blur(6px) saturate(1.02) brightness(1.03) contrast(1.01)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,255,255,0.092)',
  'bruno-liquid-surface-on-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.066),
    0 6px 16px rgba(0,0,0,0.105)
  `,
  'bruno-liquid-surface-on-sheen': `
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.00) 38%)
  `,
  'bruno-liquid-surface-on-sheen-opacity': '0.08',
  --- FIM ANTERIOR --- */
  'bruno-liquid-surface-on-background': `
    radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.30), rgba(255,255,255,0.06) 46%, transparent 73%),
    linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07)),
    linear-gradient(155deg, rgba(255,255,255,0.11), rgba(255,255,255,0.055))
  `,
  'bruno-liquid-surface-on-filter': 'blur(14px) saturate(1.28) brightness(1.04)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,255,255,0.16)',
  'bruno-liquid-surface-on-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.36),
    inset 1px 0 0 rgba(255,255,255,0.12),
    inset -1px 0 0 rgba(255,255,255,0.07),
    inset 0 -1px 0 rgba(255,255,255,0.04),
    0 8px 24px rgba(0,0,0,0.32)
  `,
  'bruno-liquid-surface-on-sheen': `
    radial-gradient(112px 72px at 16% 0%, rgba(255,255,255,0.40), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.00) 38%),
    linear-gradient(90deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 48%)
  `,
  'bruno-liquid-surface-on-sheen-opacity': '0.85',
  'bruno-liquid-band-background': 'rgba(255,255,255,0.010)',
  'bruno-liquid-band-border-color': 'rgba(255,255,255,0.035)',
  'bruno-liquid-band-border': '1px solid var(--bruno-liquid-band-border-color)',
  'bruno-liquid-band-shadow': 'none',
  /* ANTERIOR (rollback): band-open apontava para --bruno-liquid-surface-on-*,
     que agora e o vidro claro emprestado do tema iOS (luz acesa). Como
     "band-open" e sobre secao/aba EXPANDIDA (sem relacao com luz), isso
     fazia o acordeao das subviews herdar o vidro claro por engano.
     Desacoplado com valor proprio — o mesmo visual escuro sutil que
     --bruno-liquid-surface-on-* tinha antes desta sessao.
  'bruno-liquid-band-open-background': 'var(--bruno-liquid-surface-on-background)',
  'bruno-liquid-band-open-border-color': 'var(--bruno-liquid-surface-on-border-color)',
  'bruno-liquid-band-open-shadow': 'var(--bruno-liquid-surface-on-shadow)',
  --- FIM ANTERIOR --- */
  'bruno-liquid-band-open-background': `
    linear-gradient(180deg, rgba(255,255,255,0.048), rgba(255,255,255,0.014) 54%, rgba(255,255,255,0.020)),
    rgba(9,11,15,0.260)
  `,
  'bruno-liquid-band-open-border-color': 'rgba(255,255,255,0.092)',
  'bruno-liquid-band-open-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.066),
    0 6px 16px rgba(0,0,0,0.105)
  `,
};

Object.assign(BRUNO_LIQUID_GLASS_TOKENS, {
  // Compatibility aliases used by already migrated components.
  'bruno-liquid-surface-off-background': 'var(--bruno-liquid-card-background)',
  'bruno-liquid-surface-off-filter': 'var(--bruno-liquid-card-filter)',
  'bruno-liquid-surface-off-border': 'var(--bruno-liquid-card-border)',
  'bruno-liquid-surface-off-shadow': 'var(--bruno-liquid-card-shadow)',
  'bruno-liquid-surface-off-sheen': 'var(--bruno-liquid-card-sheen)',
  'bruno-liquid-surface-off-sheen-opacity': 'var(--bruno-liquid-card-sheen-opacity)',
  'bruno-liquid-surface-edge-glow': 'var(--bruno-liquid-card-edge-glow)',
  'bruno-liquid-active-warm-background': 'var(--bruno-liquid-surface-on-background)',
  'bruno-liquid-active-warm-border-color': 'var(--bruno-liquid-surface-on-border-color)',
  'bruno-liquid-active-warm-shadow': 'var(--bruno-liquid-surface-on-shadow)',
  'bruno-liquid-active-warm-sheen': 'var(--bruno-liquid-surface-on-sheen)',
});

const BRUNO_LIQUID_GLASS_SURFACES = {
  card: {
    background: 'var(--bruno-liquid-card-background)',
    filter: 'var(--bruno-liquid-card-filter)',
    border: 'var(--bruno-liquid-card-border)',
    shadow: 'var(--bruno-liquid-card-shadow)',
    sheen: 'var(--bruno-liquid-card-sheen)',
    edgeGlow: 'var(--bruno-liquid-card-edge-glow)',
  },
  dock: {
    background: 'var(--bruno-liquid-dock-background)',
    filter: 'var(--bruno-liquid-dock-filter)',
    border: 'var(--bruno-liquid-dock-border)',
    shadow: 'var(--bruno-liquid-dock-shadow)',
    sheen: 'var(--bruno-liquid-dock-sheen)',
    edgeGlow: 'var(--bruno-liquid-dock-edge-glow)',
  },
  rail: {
    background: 'var(--bruno-liquid-rail-background)',
    filter: 'var(--bruno-liquid-rail-filter)',
    border: 'var(--bruno-liquid-rail-border)',
    shadow: 'var(--bruno-liquid-rail-shadow)',
    sheen: 'var(--bruno-liquid-rail-sheen)',
  },
  cell: {
    background: 'var(--bruno-liquid-cell-background)',
    border: 'var(--bruno-liquid-cell-border)',
    shadow: 'var(--bruno-liquid-cell-shadow)',
  },
  control: {
    background: 'var(--bruno-liquid-control-background)',
    border: 'var(--bruno-liquid-control-border)',
    shadow: 'var(--bruno-liquid-control-shadow)',
    filter: 'var(--bruno-liquid-control-filter)',
  },
  chip: {
    background: 'var(--bruno-liquid-chip-background)',
    border: 'var(--bruno-liquid-chip-border)',
    shadow: 'var(--bruno-liquid-chip-shadow)',
    filter: 'var(--bruno-liquid-chip-filter)',
  },
};

const BRUNO_LIQUID_GLASS_STATES = {
  activeWarm: {
    background: 'var(--bruno-liquid-active-warm-background)',
    borderColor: 'var(--bruno-liquid-active-warm-border-color)',
    shadow: 'var(--bruno-liquid-active-warm-shadow)',
    sheen: 'var(--bruno-liquid-active-warm-sheen)',
  },
  selectedBlue: {
    background: 'var(--bruno-liquid-selected-blue-background)',
    borderColor: 'var(--bruno-liquid-selected-blue-border)',
    shadow: 'var(--bruno-liquid-selected-blue-shadow)',
  },
};

const BRUNO_LIQUID_GLASS_GLOBAL_CSS = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background:
    radial-gradient(420px 300px at 50% 36%, rgba(255,255,255,0.055), transparent 68%),
    rgba(4,7,12,0.10);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}

@keyframes bruno-liquid-route-fade {
  0% {
    opacity: 0;
  }
  36% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes bruno-liquid-route-fade-reduced {
  0% {
    opacity: 0.16;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    animation: bruno-liquid-route-fade-reduced 180ms ease-out both;
  }
}
`;

function brunoLiquidGlassSerialize(tokens) {
  return Object.entries(tokens)
    .map(([name, value]) => `  --${name}: ${String(value).trim().replace(/\s+/g, ' ')};`)
    .join('\n');
}

function brunoLiquidGlassApply(root = globalThis.document) {
  if (!root?.head) return null;

  let style = root.getElementById(BRUNO_LIQUID_GLASS_STYLE_ID);
  if (!style) {
    style = root.createElement('style');
    style.id = BRUNO_LIQUID_GLASS_STYLE_ID;
    root.head.appendChild(style);
  }

  style.textContent = `:root {\n${brunoLiquidGlassSerialize(BRUNO_LIQUID_GLASS_TOKENS)}\n}\n${BRUNO_LIQUID_GLASS_GLOBAL_CSS}`;
  return style;
}

function brunoLiquidGlassFeedback(kind = 'tap') {
  const vibrate = globalThis.navigator?.vibrate;
  if (typeof vibrate !== 'function') return false;

  const pattern = kind === 'hold' ? [12, 24, 12] : 10;
  try {
    vibrate.call(globalThis.navigator, pattern);
    return true;
  } catch (_error) {
    return false;
  }
}

function brunoLiquidGlassRouteTransition(duration = 280) {
  const root = globalThis.document?.documentElement;
  if (!root) return;

  root.classList.remove('bruno-liquid-route-transition');
  // Force a new animation frame when navigating rapidly between views.
  void root.offsetWidth;
  root.classList.add('bruno-liquid-route-transition');
  globalThis.setTimeout?.(() => {
    root.classList.remove('bruno-liquid-route-transition');
  }, duration);
}

const BRUNO_LIQUID_GLASS_API = {
  version: BRUNO_LIQUID_GLASS_VERSION,
  tokens: BRUNO_LIQUID_GLASS_TOKENS,
  surfaces: BRUNO_LIQUID_GLASS_SURFACES,
  states: BRUNO_LIQUID_GLASS_STATES,
  apply: brunoLiquidGlassApply,
  feedback: brunoLiquidGlassFeedback,
  routeTransition: brunoLiquidGlassRouteTransition,
};

// Depois da inicialização, apenas o theme manager pode escrever no style
// compartilhado. Se este módulo terminar de carregar tardiamente, registre a
// API original sem substituir o proxy nem reaplicar Liquid Glass sobre o tema
// selecionado (Josh/VisionOS inclusive).
if (globalThis.BrunoThemeManager) {
  globalThis.BrunoLiquidGlassOriginal = BRUNO_LIQUID_GLASS_API;
} else {
  globalThis.BrunoLiquidGlass = BRUNO_LIQUID_GLASS_API;
  brunoLiquidGlassApply();
}
