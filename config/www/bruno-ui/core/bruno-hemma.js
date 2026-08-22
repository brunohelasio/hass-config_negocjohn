// ============================================================================
// bruno-hemma.js — adaptação do tema Hemma para o runtime Bruno.
//
// O YAML original mistura tokens escalares do Home Assistant com card-mod/UIX,
// Jinja e wallpapers específicos. Este módulo porta apenas a linguagem visual
// reutilizável para o contrato de tokens do dashboard; não injeta card-mod,
// UIX nem caminhos /local/hemma.
// ============================================================================

const BRUNO_HEMMA_VERSION = '20260822-hemma-1';
const BRUNO_HEMMA_STYLE_ID = 'bruno-liquid-glass-tokens';
const BRUNO_HEMMA_BASE = globalThis.BrunoLiquidGlassOriginal
  || (globalThis.BrunoLiquidGlass?.__brunoThemeProxy ? null : globalThis.BrunoLiquidGlass);

const BRUNO_HEMMA_SHARED = {
  'primary-font-family': '"Hanken Grotesk", -apple-system, BlinkMacSystemFont, "SF Pro Display", sans-serif',
  'primary-color': '#00c0e8',
  'accent-color': '#00C3D0',
  // ANTERIOR (rollback raio unico 2026-08-22): 28px
  'ha-card-border-radius': '20px',
  // ANTERIOR (rollback raio unico 2026-08-22): 28px
  'bruno-liquid-card-radius': '20px',
  // ANTERIOR (rollback raio unico 2026-08-22): 24px
  'bruno-liquid-card-radius-compact': '16px',
  // ANTERIOR (rollback raio unico 2026-08-22): 28px
  'bruno-liquid-room-radius': '20px',
  // ANTERIOR (rollback raio unico 2026-08-22): 24px
  'bruno-liquid-cell-radius': '16px',
  // ANTERIOR (rollback raio unico 2026-08-22): 24px
  'bruno-liquid-control-radius': '16px',
  // ANTERIOR (rollback raio unico 2026-08-22): 18px
  'bruno-liquid-control-radius-compact': '12px',
  'bruno-liquid-panel-radius': '28px',
  'bruno-liquid-dock-radius': '9999px',
  'bruno-liquid-rail-radius': '9999px',
  'bruno-liquid-motion-fast': '150ms ease',
  'bruno-liquid-motion-medium': '220ms ease',

  // Paleta semântica Hemma.
  'hemma-color-blue': '#0088FF',
  'hemma-color-teal': '#00C3D0',
  'hemma-color-mint': '#00C8B3',
  'hemma-color-yellow': '#FFCC00',
  'hemma-color-green': '#30D158',
  'hemma-color-orange': '#FF9230',
  'hemma-color-red': '#FF4245',

  // Material de vidro central do YAML Hemma.
  'hemma-glass-background': 'rgba(255,255,255,0.10)',
  'hemma-glass-backdrop': 'blur(24px) saturate(180%)',
  'bruno-liquid-card-filter': 'blur(22px) saturate(1.20)',
  'ha-card-backdrop-filter': 'blur(22px) saturate(1.20)',
  'bruno-liquid-card-sheen': `
    linear-gradient(180deg, rgba(255,255,255,0.16), transparent 34%),
    linear-gradient(90deg, rgba(255,255,255,0.07), transparent 48%)
  `,
  'bruno-liquid-card-sheen-opacity': '0.82',
  'bruno-liquid-card-edge-glow': 'linear-gradient(125deg, rgba(255,255,255,0.20), rgba(255,255,255,0.045) 42%, rgba(255,255,255,0.012))',
  'bruno-liquid-surface-edge-glow': 'var(--bruno-liquid-card-edge-glow)',
  'bruno-liquid-surface-bottom-line': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent)',

  // Não impor o wallpaper do demo Hemma sobre o wallpaper do dashboard Bruno.
  'bruno-theme-backdrop-blur': '0px',
  'bruno-theme-backdrop-scale': '1',
  'bruno-theme-backdrop-saturate': '1',
  'bruno-theme-backdrop-brightness': '1',
};

const BRUNO_HEMMA_LIGHT = {
  ...BRUNO_HEMMA_SHARED,
  'primary-background-color': 'rgb(50,50,50)',
  'secondary-background-color': 'rgb(40,40,40)',
  'ha-card-background': 'rgba(0,0,0,0.20)',
  'ha-card-box-shadow': 'none',
  'bruno-liquid-card-background': 'rgba(0,0,0,0.20)',
  'bruno-liquid-card-border': '1px solid rgba(255,255,255,0.10)',
  'bruno-liquid-card-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.55),
    inset 0 -1px 0 rgba(255,255,255,0.48),
    inset 1px 0 0 rgba(255,255,255,0.12),
    inset -1px 0 0 rgba(255,255,255,0.08),
    0 2px 8px rgba(0,0,0,0.18)
  `,
  'bruno-liquid-surface-off-background': `
    radial-gradient(150px 112px at 16% -8%, rgba(255,255,255,0.10), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)),
    rgba(0,0,0,0.40)
  `,
  'bruno-liquid-surface-off-filter': 'blur(22px) saturate(1.20)',
  'bruno-liquid-surface-off-border': '1px solid rgba(255,255,255,0.10)',
  'bruno-liquid-surface-off-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.18),
    inset 0 -1px 0 rgba(255,255,255,0.08),
    0 2px 8px rgba(0,0,0,0.10)
  `,
  'bruno-liquid-surface-off-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.11), transparent 36%)',
  'bruno-liquid-surface-off-sheen-opacity': '0.86',
  'bruno-liquid-surface-on-background': `
    radial-gradient(170px 130px at 16% -8%, rgba(255,255,255,0.30), transparent 70%),
    linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.08) 48%, rgba(255,255,255,0.04)),
    rgba(42,42,42,0.56)
  `,
  'bruno-liquid-surface-on-filter': 'blur(22px) saturate(1.20) brightness(1.04)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,255,255,0.28)',
  'bruno-liquid-surface-on-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.42),
    inset 0 -1px 0 rgba(255,255,255,0.18),
    0 2px 10px rgba(0,0,0,0.16)
  `,
  'bruno-liquid-surface-on-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.24), transparent 39%)',
  'bruno-liquid-surface-on-sheen-opacity': '0.92',
  'bruno-liquid-popup-background': 'rgba(10,10,10,0.35)',
  'bruno-liquid-popup-filter': 'blur(22px) saturate(1.20)',
  'bruno-liquid-popup-border': '1px solid rgba(255,255,255,0.10)',
  'bruno-liquid-dock-background': 'rgba(20,20,20,0.30)',
  'bruno-liquid-dock-filter': 'blur(24px) saturate(1.20)',
};

const BRUNO_HEMMA_DARK = {
  ...BRUNO_HEMMA_SHARED,
  'primary-background-color': 'rgb(40,40,40)',
  'secondary-background-color': 'rgb(20,20,20)',
  'ha-card-background': 'rgba(0,0,0,0.40)',
  'ha-card-box-shadow': 'none',
  'bruno-liquid-card-background': 'rgba(0,0,0,0.40)',
  'bruno-liquid-card-border': '1px solid rgba(255,255,255,0.10)',
  'bruno-liquid-card-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.28),
    inset 0 -1px 0 rgba(255,255,255,0.14),
    inset 1px 0 0 rgba(255,255,255,0.08),
    inset -1px 0 0 rgba(255,255,255,0.05),
    0 2px 8px rgba(0,0,0,0.18)
  `,
  'bruno-liquid-surface-off-background': `
    radial-gradient(150px 112px at 16% -8%, rgba(255,255,255,0.085), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.014) 48%, rgba(0,0,0,0.05)),
    rgba(0,0,0,0.40)
  `,
  'bruno-liquid-surface-off-filter': 'blur(22px) saturate(1.20)',
  'bruno-liquid-surface-off-border': '1px solid rgba(255,255,255,0.09)',
  'bruno-liquid-surface-off-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.14),
    inset 0 -1px 0 rgba(255,255,255,0.06),
    0 2px 12px rgba(0,0,0,0.24)
  `,
  'bruno-liquid-surface-off-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.09), transparent 36%)',
  'bruno-liquid-surface-off-sheen-opacity': '0.82',
  'bruno-liquid-surface-on-background': `
    radial-gradient(170px 130px at 16% -8%, rgba(255,255,255,0.25), transparent 70%),
    linear-gradient(180deg, rgba(255,255,255,0.15), rgba(255,255,255,0.055) 48%, rgba(255,255,255,0.025)),
    rgba(30,30,30,0.55)
  `,
  'bruno-liquid-surface-on-filter': 'blur(22px) saturate(1.20) brightness(1.04)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,255,255,0.22)',
  'bruno-liquid-surface-on-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.34),
    inset 0 -1px 0 rgba(255,255,255,0.13),
    0 2px 12px rgba(0,0,0,0.28)
  `,
  'bruno-liquid-surface-on-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.20), transparent 39%)',
  'bruno-liquid-surface-on-sheen-opacity': '0.90',
  'bruno-liquid-popup-background': 'rgba(0,0,0,0.60)',
  'bruno-liquid-popup-filter': 'blur(22px) saturate(1.20)',
  'bruno-liquid-popup-border': '1px solid rgba(255,255,255,0.08)',
  'bruno-liquid-dock-background': 'rgba(0,0,0,0.30)',
  'bruno-liquid-dock-filter': 'blur(24px) saturate(1.20)',
};

function brunoHemmaDarkMode() {
  return Boolean(globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches);
}

function brunoHemmaTokens() {
  const mode = brunoHemmaDarkMode() ? BRUNO_HEMMA_DARK : BRUNO_HEMMA_LIGHT;
  return Object.assign({}, BRUNO_HEMMA_BASE?.tokens || {}, mode);
}

function brunoHemmaSerialize(tokens) {
  return Object.entries(tokens)
    .map(([name, value]) => `  --${name}: ${String(value).trim().replace(/\s+/g, ' ')};`)
    .join('\n');
}

function brunoHemmaApply(root = globalThis.document) {
  if (!root?.head) return null;
  let style = root.getElementById(BRUNO_HEMMA_STYLE_ID);
  if (!style) {
    style = root.createElement('style');
    style.id = BRUNO_HEMMA_STYLE_ID;
    root.head.appendChild(style);
  }
  style.textContent = `:root {\n${brunoHemmaSerialize(brunoHemmaTokens())}\n}`;
  return style;
}

const hemmaMedia = globalThis.matchMedia?.('(prefers-color-scheme: dark)');
hemmaMedia?.addEventListener?.('change', () => {
  if (globalThis.BrunoThemeManager?.current?.() === 'hemma') brunoHemmaApply();
});

globalThis.BrunoHemma = {
  version: BRUNO_HEMMA_VERSION,
  // Mantém o mesmo formato dos temas clássicos: objeto de tokens + apply().
  tokens: BRUNO_HEMMA_LIGHT,
  surfaces: BRUNO_HEMMA_BASE?.surfaces || {},
  states: BRUNO_HEMMA_BASE?.states || {},
  apply: brunoHemmaApply,
  feedback: (...args) => BRUNO_HEMMA_BASE?.feedback?.(...args) || false,
  routeTransition: (...args) => BRUNO_HEMMA_BASE?.routeTransition?.(...args),
};
