const BRUNO_IOS_LIGHT_VERSION = '20260716-ios-light-1';
const BRUNO_IOS_LIGHT_STYLE_ID = 'bruno-liquid-glass-tokens';
const BRUNO_IOS_LIGHT_BASE = globalThis.BrunoVisionOS || globalThis.BrunoLiquidGlass;

const BRUNO_IOS_LIGHT_TOKENS = Object.assign({}, BRUNO_IOS_LIGHT_BASE?.tokens || {}, {
  // Palette extracted from ios-themes.yaml. Background artwork remains owned
  // by the Bruno shell and is deliberately not replaced by the theme.
  'background-image': 'none',
  'primary-background-color': '#e5e5ea',
  'secondary-background-color': 'rgba(255,255,255,0.90)',
  'app-header-background-color': 'rgba(245,245,247,0.72)',
  'ha-card-background': 'rgba(245,245,245,0.40)',
  'app-theme-color': '#f2f2f7',
  'primary-text-color': '#464a47',
  'secondary-text-color': 'rgba(0,0,0,0.66)',
  'divider-color': 'rgba(142,142,147,0.30)',
  'accent-color': 'rgba(255,159,9,1)',
  'primary-color': '#ff9f09',
  'blue-color': '#007aff',
  'green-color': '#34c759',
  'yellow-color': '#ffd60a',
  'orange-color': '#ff9f09',
  'red-color': '#ff3b30',
  'state-icon-active-color': '#007aff',
  'slider-color': '#007aff',
  'slider-secondary-color': 'rgba(120,120,128,0.24)',

  'bruno-liquid-accent': '255, 159, 9',
  'bruno-liquid-warm-accent': '255, 159, 9',
  'bruno-liquid-green-accent': '52, 199, 89',
  'bruno-liquid-text-primary': '#464a47',
  'bruno-liquid-text-secondary': 'rgba(0,0,0,0.66)',
  'bruno-liquid-text-muted': 'rgba(60,60,67,0.54)',
  'bruno-liquid-text-inverse': 'rgba(255,255,255,0.96)',
  'bruno-liquid-divider': 'rgba(142,142,147,0.30)',

  'bruno-liquid-card-background': `
    radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.62), transparent 64%),
    linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.16) 52%, rgba(229,229,234,0.18)),
    rgba(245,245,245,0.40)
  `,
  'bruno-liquid-card-filter': 'blur(22px) saturate(1.15) brightness(1.04)',
  'bruno-liquid-card-border-color': 'rgba(255,255,255,0.52)',
  'bruno-liquid-card-border': '1px solid var(--bruno-liquid-card-border-color)',
  'bruno-liquid-card-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.66),
    inset 0 -1px 0 rgba(142,142,147,0.16),
    0 10px 28px rgba(44,44,46,0.13)
  `,
  'bruno-liquid-card-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,255,255,0.00) 44%)',
  'bruno-liquid-card-sheen-opacity': '0.34',
  'bruno-liquid-card-edge-glow': 'linear-gradient(125deg, rgba(255,255,255,0.68), rgba(255,255,255,0.16) 46%, rgba(0,122,255,0.06))',

  'bruno-liquid-dock-background': `
    radial-gradient(90px 72px at 18% 0%, rgba(255,255,255,0.72), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.54), rgba(242,242,247,0.42)),
    rgba(229,229,234,0.46)
  `,
  'bruno-liquid-dock-filter': 'blur(28px) saturate(1.30) brightness(1.04)',
  'bruno-liquid-dock-border': '1px solid rgba(255,255,255,0.58)',
  'bruno-liquid-dock-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.72),
    inset 0 -1px 0 rgba(142,142,147,0.18),
    0 14px 32px rgba(44,44,46,0.16)
  `,
  'bruno-liquid-dock-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.00) 42%)',
  'bruno-liquid-dock-sheen-opacity': '0.58',
  'bruno-liquid-dock-edge-glow': 'linear-gradient(125deg, rgba(255,255,255,0.74), rgba(255,255,255,0.18) 52%, rgba(0,122,255,0.08))',

  'bruno-liquid-rail-background': `
    radial-gradient(46px 98px at 24% 0%, rgba(255,255,255,0.74), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.56), rgba(242,242,247,0.40)),
    rgba(229,229,234,0.48)
  `,
  'bruno-liquid-rail-filter': 'blur(30px) saturate(1.30) brightness(1.04)',
  'bruno-liquid-rail-border': '1px solid rgba(255,255,255,0.58)',
  'bruno-liquid-rail-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.74),
    inset -1px 0 0 rgba(142,142,147,0.14),
    0 18px 40px rgba(44,44,46,0.16)
  `,
  'bruno-liquid-rail-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.66), rgba(255,255,255,0.00) 38%)',
  'bruno-liquid-rail-sheen-opacity': '0.62',

  'bruno-liquid-cell-background': 'linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.14)), rgba(242,242,247,0.22)',
  'bruno-liquid-cell-border-color': 'rgba(142,142,147,0.20)',
  'bruno-liquid-cell-border': '1px solid var(--bruno-liquid-cell-border-color)',
  'bruno-liquid-cell-shadow': 'inset 0 1px 0 rgba(255,255,255,0.48)',
  'bruno-liquid-chip-background': 'linear-gradient(180deg, rgba(255,255,255,0.38), rgba(242,242,247,0.20)), rgba(255,255,255,0.16)',
  'bruno-liquid-chip-border': '1px solid rgba(142,142,147,0.22)',
  'bruno-liquid-chip-shadow': 'inset 0 1px 0 rgba(255,255,255,0.50)',
  'bruno-liquid-chip-filter': 'blur(14px) saturate(1.08) brightness(1.03)',
  'bruno-liquid-control-background': 'linear-gradient(180deg, rgba(255,255,255,0.44), rgba(242,242,247,0.24)), rgba(255,255,255,0.18)',
  'bruno-liquid-control-border-color': 'rgba(142,142,147,0.24)',
  'bruno-liquid-control-border': '1px solid var(--bruno-liquid-control-border-color)',
  'bruno-liquid-control-shadow': 'inset 0 1px 0 rgba(255,255,255,0.54)',
  'bruno-liquid-control-filter': 'blur(14px) saturate(1.08) brightness(1.03)',
  'bruno-liquid-control-warm-background': 'rgba(255,159,9,0.12)',
  'bruno-liquid-control-warm-border': '1px solid rgba(255,159,9,0.28)',
  'bruno-liquid-control-warm-shadow': 'inset 0 1px 0 rgba(255,255,255,0.48)',
  'bruno-liquid-control-blue-background': 'linear-gradient(180deg, rgba(0,122,255,0.28), rgba(0,122,255,0.14)), rgba(255,255,255,0.18)',
  'bruno-liquid-control-blue-border': 'rgba(0,122,255,0.34)',
  'bruno-liquid-control-blue-shadow': 'inset 0 1px 0 rgba(255,255,255,0.42), 0 0 12px rgba(0,122,255,0.10)',
  'bruno-liquid-control-green-background': 'linear-gradient(180deg, rgba(52,199,89,0.22), rgba(52,199,89,0.10)), rgba(255,255,255,0.18)',
  'bruno-liquid-control-green-border': 'rgba(52,199,89,0.30)',
  'bruno-liquid-control-green-shadow': 'inset 0 1px 0 rgba(255,255,255,0.42), 0 0 12px rgba(52,199,89,0.08)',
  'bruno-liquid-selected-blue-background': 'linear-gradient(180deg, rgba(0,122,255,0.28), rgba(0,122,255,0.16)), rgba(255,255,255,0.20)',
  'bruno-liquid-selected-blue-border': 'rgba(0,122,255,0.36)',
  'bruno-liquid-selected-blue-shadow': 'inset 0 1px 0 rgba(255,255,255,0.44), 0 0 14px rgba(0,122,255,0.12)',

  'bruno-liquid-popup-background': 'linear-gradient(180deg, rgba(248,248,250,0.92), rgba(229,229,234,0.88))',
  'bruno-liquid-popup-border': '1px solid rgba(255,255,255,0.62)',
  'bruno-liquid-popup-shadow': 'inset 0 1px 0 rgba(255,255,255,0.74), 0 18px 38px rgba(44,44,46,0.20)',
  'bruno-liquid-popup-filter': 'blur(24px) saturate(1.18) brightness(1.02)',
  'bruno-liquid-popup-option-background': 'rgba(255,255,255,0.34)',
  'bruno-liquid-popup-option-hover-background': 'rgba(0,122,255,0.14)',

  'bruno-liquid-surface-on-background': 'linear-gradient(180deg, rgba(255,255,255,0.46), rgba(242,242,247,0.24)), rgba(255,255,255,0.20)',
  'bruno-liquid-surface-on-filter': 'blur(20px) saturate(1.12) brightness(1.05)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,255,255,0.58)',
  'bruno-liquid-surface-on-shadow': 'inset 0 1px 0 rgba(255,255,255,0.64), 0 8px 20px rgba(44,44,46,0.12)',
  'bruno-liquid-surface-on-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,255,255,0.00) 42%)',
  'bruno-liquid-surface-on-sheen-opacity': '0.30',
  'bruno-liquid-band-background': 'rgba(255,255,255,0.12)',
  'bruno-liquid-band-border-color': 'rgba(142,142,147,0.18)',
  'bruno-liquid-band-border': '1px solid var(--bruno-liquid-band-border-color)',
});

Object.assign(BRUNO_IOS_LIGHT_TOKENS, {
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

const BRUNO_IOS_LIGHT_GLOBAL_CSS = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: rgba(242,242,247,0.10);
  -webkit-backdrop-filter: blur(7px) saturate(1.08);
  backdrop-filter: blur(7px) saturate(1.08);
  animation: bruno-liquid-route-fade 260ms ease both;
}
@keyframes bruno-liquid-route-fade { 0% { opacity: 0; } 36% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after { -webkit-backdrop-filter: none; backdrop-filter: none; animation-duration: 180ms; }
}
`;

function brunoIOSLightSerialize(tokens) {
  return Object.entries(tokens)
    .map(([name, value]) => `  --${name}: ${String(value).trim().replace(/\s+/g, ' ')};`)
    .join('\n');
}

function brunoIOSLightApply(root = globalThis.document) {
  if (!root?.head) return null;
  let style = root.getElementById(BRUNO_IOS_LIGHT_STYLE_ID);
  if (!style) {
    style = root.createElement('style');
    style.id = BRUNO_IOS_LIGHT_STYLE_ID;
    root.head.appendChild(style);
  }
  style.textContent = `:root {\n${brunoIOSLightSerialize(BRUNO_IOS_LIGHT_TOKENS)}\n}\n${BRUNO_IOS_LIGHT_GLOBAL_CSS}`;
  return style;
}

globalThis.BrunoIOSLight = {
  version: BRUNO_IOS_LIGHT_VERSION,
  tokens: BRUNO_IOS_LIGHT_TOKENS,
  surfaces: BRUNO_IOS_LIGHT_BASE?.surfaces || {},
  states: BRUNO_IOS_LIGHT_BASE?.states || {},
  apply: brunoIOSLightApply,
  feedback: (...args) => BRUNO_IOS_LIGHT_BASE?.feedback?.(...args) || false,
  routeTransition: (...args) => BRUNO_IOS_LIGHT_BASE?.routeTransition?.(...args),
};
