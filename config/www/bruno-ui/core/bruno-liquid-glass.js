const BRUNO_LIQUID_GLASS_VERSION = '20260520-1';
const BRUNO_LIQUID_GLASS_STYLE_ID = 'bruno-liquid-glass-tokens';

const BRUNO_LIQUID_GLASS_TOKENS = {
  'bruno-liquid-accent': '150, 190, 255',
  'bruno-liquid-warm-accent': '255, 183, 77',
  'bruno-liquid-green-accent': '46, 231, 122',

  'bruno-liquid-card-radius': '18px',
  'bruno-liquid-card-radius-compact': '16px',
  'bruno-liquid-room-radius': '16px',
  'bruno-liquid-cell-radius': '12px',
  'bruno-liquid-control-radius': '14px',
  'bruno-liquid-dock-radius': '999px',
  'bruno-liquid-rail-radius': '999px',

  'bruno-liquid-motion-fast': '160ms ease',
  'bruno-liquid-motion-medium': '220ms cubic-bezier(0.2, 0.8, 0.2, 1)',

  // Validated on the Sala Bento card. Keep these values stable unless the
  // whole shared glass skin is intentionally revised.
  'bruno-liquid-card-background': `
    radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
    radial-gradient(150px 150px at 96% 92%, rgba(var(--accent, var(--bruno-liquid-accent)),0.09), transparent 69%),
    linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
    linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
  `,
  'bruno-liquid-card-filter': 'blur(32px) saturate(1.68) contrast(1.06)',
  'bruno-liquid-card-border': '1px solid rgba(255,255,255,0.18)',
  'bruno-liquid-card-shadow': `
    inset 0 0 0 1px rgba(255,255,255,0.075),
    inset 0 1px 0 rgba(255,255,255,0.30),
    inset 1px 0 0 rgba(255,255,255,0.13),
    inset 0 -1px 0 rgba(255,255,255,0.055),
    0 18px 46px rgba(0,0,0,0.31),
    0 0 30px rgba(110,150,210,0.075)
  `,
  'bruno-liquid-card-sheen': `
    radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
    radial-gradient(82px 92px at 94% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.12), transparent 74%),
    linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
    linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
  `,
  'bruno-liquid-card-sheen-opacity': '0.82',
  'bruno-liquid-card-edge-glow': `
    linear-gradient(125deg, rgba(255,255,255,0.42), rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.028) 58%, rgba(255,190,120,0.24) 100%)
  `,

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
    linear-gradient(180deg, rgba(255,255,255,0.095), rgba(255,255,255,0.040)),
    linear-gradient(155deg, rgba(26,32,42,0.46), rgba(12,15,22,0.30))
  `,
  'bruno-liquid-cell-border': '1px solid rgba(255,255,255,0.13)',
  'bruno-liquid-cell-shadow': 'inset 0 1px 0 rgba(255,255,255,0.08)',
  'bruno-liquid-cell-active-warm-background': `
    radial-gradient(76px 48px at 18% 12%, rgba(255,255,255,0.28), transparent 72%),
    radial-gradient(96px 58px at 94% 82%, rgba(var(--bruno-liquid-warm-accent),0.24), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.074)),
    linear-gradient(180deg, rgba(var(--bruno-liquid-warm-accent),0.10), rgba(var(--bruno-liquid-warm-accent),0.03))
  `,
  'bruno-liquid-cell-active-warm-border': 'rgba(255,205,95,0.44)',
  'bruno-liquid-cell-active-warm-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.22),
    inset 1px 0 0 rgba(255,255,255,0.08),
    inset 0 -1px 0 rgba(0,0,0,0.08),
    0 0 20px rgba(var(--bruno-liquid-warm-accent),0.17)
  `,

  'bruno-liquid-chip-background': `
    linear-gradient(180deg, rgba(255,255,255,0.105), rgba(255,255,255,0.040)),
    rgba(16,18,24,0.46)
  `,
  'bruno-liquid-chip-border': '1px solid rgba(255,255,255,0.14)',
  'bruno-liquid-chip-shadow': 'inset 0 1px 0 rgba(255,255,255,0.13), 0 8px 20px rgba(0,0,0,0.14)',
  'bruno-liquid-chip-filter': 'blur(18px) saturate(1.28)',

  'bruno-liquid-selected-blue-background': `
    radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 62%),
    linear-gradient(180deg, rgba(105,150,230,0.68), rgba(59,92,178,0.54))
  `,
  'bruno-liquid-selected-blue-border': 'rgba(210,228,255,0.38)',
  'bruno-liquid-selected-blue-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.32),
    0 0 20px rgba(96,165,250,0.32)
  `,

  'bruno-liquid-surface-bottom-line': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
  'bruno-liquid-surface-bottom-line-opacity': '0',

  'bruno-liquid-surface-on-background': `
    radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.38), rgba(255,255,255,0.105) 52%, transparent 75%),
    radial-gradient(165px 148px at 98% 94%, rgba(var(--bruno-liquid-warm-accent),0.22), transparent 68%),
    radial-gradient(122px 96px at 27% 18%, rgba(255,232,126,0.105), transparent 71%),
    linear-gradient(180deg, rgba(255,255,255,0.225), rgba(255,255,255,0.073) 43%, rgba(255,255,255,0.108)),
    linear-gradient(155deg, rgba(42,51,65,0.72), rgba(23,28,38,0.58) 52%, rgba(13,16,24,0.44))
  `,
  'bruno-liquid-surface-on-filter': 'blur(34px) saturate(1.72) contrast(1.05)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,205,95,0.34)',
  'bruno-liquid-surface-on-shadow': `
    inset 0 0 0 1px rgba(255,255,255,0.11),
    inset 0 1px 0 rgba(255,255,255,0.40),
    inset 1px 0 0 rgba(255,255,255,0.16),
    inset 0 -1px 0 rgba(0,0,0,0.16),
    0 0 22px rgba(255,255,255,0.09),
    0 0 38px rgba(var(--bruno-liquid-warm-accent),0.13),
    0 18px 46px rgba(0,0,0,0.30)
  `,
  'bruno-liquid-surface-on-sheen': `
    radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%),
    radial-gradient(118px 110px at 96% 96%, rgba(var(--bruno-liquid-warm-accent),0.21), transparent 74%),
    radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%),
    linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%)
  `,
  'bruno-liquid-surface-on-sheen-opacity': '0.78',
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

  style.textContent = `:root {\n${brunoLiquidGlassSerialize(BRUNO_LIQUID_GLASS_TOKENS)}\n}`;
  return style;
}

globalThis.BrunoLiquidGlass = {
  version: BRUNO_LIQUID_GLASS_VERSION,
  tokens: BRUNO_LIQUID_GLASS_TOKENS,
  surfaces: BRUNO_LIQUID_GLASS_SURFACES,
  states: BRUNO_LIQUID_GLASS_STATES,
  apply: brunoLiquidGlassApply,
};

brunoLiquidGlassApply();
