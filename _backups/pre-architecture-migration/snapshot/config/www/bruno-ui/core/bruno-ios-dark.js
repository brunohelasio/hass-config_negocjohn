const BRUNO_IOS_DARK_VERSION = '20260716-ios-dark-1';
const BRUNO_IOS_DARK_STYLE_ID = 'bruno-liquid-glass-tokens';
const BRUNO_IOS_DARK_BASE = globalThis.BrunoVisionOS || globalThis.BrunoLiquidGlass;

const BRUNO_IOS_DARK_TOKENS = Object.assign({}, BRUNO_IOS_DARK_BASE?.tokens || {}, {
  // Dark palette from ios-themes.yaml. Shell backdrops remain untouched.
  'background-image': 'none',
  'primary-background-color': '#2c2c2e',
  'secondary-background-color': 'rgba(25,25,25,0.90)',
  'app-header-background-color': 'rgba(25,25,25,0.72)',
  'ha-card-background': 'rgba(10,10,10,0.40)',
  'app-theme-color': '#000000',
  'primary-text-color': 'rgba(255,255,255,0.96)',
  'secondary-text-color': '#d3d3d3',
  'divider-color': 'rgba(152,152,157,0.30)',
  'accent-color': 'rgba(255,159,9,1)',
  'primary-color': '#ff9f09',
  'blue-color': '#0984ff',
  'green-color': '#30d158',
  'yellow-color': '#ffd60a',
  'orange-color': '#ff9f09',
  'red-color': '#ff453a',
  'state-icon-active-color': '#0984ff',
  'slider-color': '#0984ff',
  'slider-secondary-color': 'rgba(120,120,128,0.36)',

  'bruno-liquid-accent': '255, 159, 9',
  'bruno-liquid-warm-accent': '255, 214, 10',
  'bruno-liquid-green-accent': '48, 209, 88',
  'bruno-liquid-text-primary': 'rgba(255,255,255,0.96)',
  'bruno-liquid-text-secondary': '#d3d3d3',
  'bruno-liquid-text-muted': 'rgba(235,235,245,0.54)',
  'bruno-liquid-text-inverse': '#1c1c1e',
  'bruno-liquid-divider': 'rgba(152,152,157,0.30)',

  'bruno-liquid-card-background': `
    radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.10), transparent 64%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.050)),
    rgba(10,10,10,0.40)
  `,
  'bruno-liquid-card-filter': 'blur(22px) saturate(1.18) brightness(1.02)',
  'bruno-liquid-card-border-color': 'rgba(255,255,255,0.105)',
  'bruno-liquid-card-border': '1px solid var(--bruno-liquid-card-border-color)',
  'bruno-liquid-card-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.11),
    inset 0 -1px 0 rgba(255,255,255,0.025),
    0 12px 30px rgba(0,0,0,0.30)
  `,
  'bruno-liquid-card-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 42%)',
  'bruno-liquid-card-sheen-opacity': '0.13',
  'bruno-liquid-card-edge-glow': 'linear-gradient(125deg, rgba(255,255,255,0.16), rgba(255,255,255,0.048) 40%, rgba(9,132,255,0.05))',

  'bruno-liquid-dock-background': `
    radial-gradient(88px 70px at 18% 0%, rgba(255,255,255,0.18), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 46%, rgba(255,255,255,0.045)),
    rgba(10,10,10,0.58)
  `,
  'bruno-liquid-dock-filter': 'blur(28px) saturate(1.48) contrast(1.04)',
  'bruno-liquid-dock-border': '1px solid rgba(255,255,255,0.16)',
  'bruno-liquid-dock-shadow': 'inset 0 1px 0 rgba(255,255,255,0.22), 0 14px 34px rgba(0,0,0,0.32)',
  'bruno-liquid-dock-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 40%)',
  'bruno-liquid-dock-sheen-opacity': '0.66',
  'bruno-liquid-dock-edge-glow': 'linear-gradient(125deg, rgba(255,255,255,0.32), rgba(255,255,255,0.07) 44%, rgba(9,132,255,0.08))',

  'bruno-liquid-rail-background': `
    radial-gradient(40px 96px at 26% 0%, rgba(255,255,255,0.20), transparent 70%),
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.038) 36%, rgba(255,255,255,0.06)),
    rgba(10,10,10,0.66)
  `,
  'bruno-liquid-rail-filter': 'blur(30px) saturate(1.50) contrast(1.04)',
  'bruno-liquid-rail-border': '1px solid rgba(255,255,255,0.16)',
  'bruno-liquid-rail-shadow': 'inset 0 1px 0 rgba(255,255,255,0.22), 0 18px 42px rgba(0,0,0,0.34)',
  'bruno-liquid-rail-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 36%)',
  'bruno-liquid-rail-sheen-opacity': '0.74',

  'bruno-liquid-cell-background': 'linear-gradient(180deg, rgba(255,255,255,0.026), rgba(255,255,255,0.008)), rgba(10,10,10,0.08)',
  'bruno-liquid-cell-border-color': 'rgba(255,255,255,0.055)',
  'bruno-liquid-cell-border': '1px solid var(--bruno-liquid-cell-border-color)',
  'bruno-liquid-cell-shadow': 'inset 0 1px 0 rgba(255,255,255,0.045)',
  'bruno-liquid-chip-background': 'linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.012)), rgba(10,10,10,0.10)',
  'bruno-liquid-chip-border': '1px solid rgba(255,255,255,0.075)',
  'bruno-liquid-chip-shadow': 'inset 0 1px 0 rgba(255,255,255,0.065)',
  'bruno-liquid-chip-filter': 'blur(14px) saturate(1.02) brightness(1.03)',
  'bruno-liquid-control-background': 'linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.018)), rgba(255,255,255,0.030)',
  'bruno-liquid-control-border-color': 'rgba(255,255,255,0.075)',
  'bruno-liquid-control-border': '1px solid var(--bruno-liquid-control-border-color)',
  'bruno-liquid-control-shadow': 'inset 0 1px 0 rgba(255,255,255,0.065)',
  'bruno-liquid-control-filter': 'blur(14px) saturate(1.02) brightness(1.03)',
  'bruno-liquid-control-blue-background': 'linear-gradient(180deg, rgba(9,132,255,0.40), rgba(9,82,150,0.24)), rgba(255,255,255,0.03)',
  'bruno-liquid-control-blue-border': 'rgba(9,132,255,0.34)',
  'bruno-liquid-control-blue-shadow': 'inset 0 1px 0 rgba(255,255,255,0.10), 0 0 14px rgba(9,132,255,0.12)',
  'bruno-liquid-control-green-background': 'linear-gradient(180deg, rgba(48,209,88,0.18), rgba(20,78,48,0.08)), rgba(255,255,255,0.03)',
  'bruno-liquid-control-green-border': 'rgba(48,209,88,0.24)',
  'bruno-liquid-control-green-shadow': 'inset 0 1px 0 rgba(255,255,255,0.08), 0 0 12px rgba(48,209,88,0.08)',
  'bruno-liquid-selected-blue-background': 'linear-gradient(180deg, rgba(9,132,255,0.40), rgba(58,92,178,0.28)), rgba(255,255,255,0.03)',
  'bruno-liquid-selected-blue-border': 'rgba(174,214,255,0.30)',
  'bruno-liquid-selected-blue-shadow': 'inset 0 1px 0 rgba(255,255,255,0.11), 0 0 14px rgba(9,132,255,0.14)',

  'bruno-liquid-popup-background': 'linear-gradient(180deg, rgba(44,44,46,0.90), rgba(18,18,20,0.88))',
  'bruno-liquid-popup-border': '1px solid rgba(255,255,255,0.12)',
  'bruno-liquid-popup-shadow': 'inset 0 1px 0 rgba(255,255,255,0.10), 0 18px 38px rgba(0,0,0,0.34)',
  'bruno-liquid-popup-filter': 'blur(24px) saturate(1.18) brightness(0.96)',
  'bruno-liquid-popup-option-background': 'rgba(255,255,255,0.05)',
  'bruno-liquid-popup-option-hover-background': 'rgba(9,132,255,0.15)',
});

Object.assign(BRUNO_IOS_DARK_TOKENS, {
  'bruno-liquid-surface-off-background': 'var(--bruno-liquid-card-background)',
  'bruno-liquid-surface-off-filter': 'var(--bruno-liquid-card-filter)',
  'bruno-liquid-surface-off-border': 'var(--bruno-liquid-card-border)',
  'bruno-liquid-surface-off-shadow': 'var(--bruno-liquid-card-shadow)',
  'bruno-liquid-surface-off-sheen': 'var(--bruno-liquid-card-sheen)',
  'bruno-liquid-surface-off-sheen-opacity': 'var(--bruno-liquid-card-sheen-opacity)',
  'bruno-liquid-surface-edge-glow': 'var(--bruno-liquid-card-edge-glow)',
});

const BRUNO_IOS_DARK_GLOBAL_CSS = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: rgba(0,0,0,0.12);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}
@keyframes bruno-liquid-route-fade { 0% { opacity: 0; } 36% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after { -webkit-backdrop-filter: none; backdrop-filter: none; animation-duration: 180ms; }
}
`;

function brunoIOSDarkSerialize(tokens) {
  return Object.entries(tokens)
    .map(([name, value]) => `  --${name}: ${String(value).trim().replace(/\s+/g, ' ')};`)
    .join('\n');
}

function brunoIOSDarkApply(root = globalThis.document) {
  if (!root?.head) return null;
  let style = root.getElementById(BRUNO_IOS_DARK_STYLE_ID);
  if (!style) {
    style = root.createElement('style');
    style.id = BRUNO_IOS_DARK_STYLE_ID;
    root.head.appendChild(style);
  }
  style.textContent = `:root {\n${brunoIOSDarkSerialize(BRUNO_IOS_DARK_TOKENS)}\n}\n${BRUNO_IOS_DARK_GLOBAL_CSS}`;
  return style;
}

globalThis.BrunoIOSDark = {
  version: BRUNO_IOS_DARK_VERSION,
  tokens: BRUNO_IOS_DARK_TOKENS,
  surfaces: BRUNO_IOS_DARK_BASE?.surfaces || {},
  states: BRUNO_IOS_DARK_BASE?.states || {},
  apply: brunoIOSDarkApply,
  feedback: (...args) => BRUNO_IOS_DARK_BASE?.feedback?.(...args) || false,
  routeTransition: (...args) => BRUNO_IOS_DARK_BASE?.routeTransition?.(...args),
};
