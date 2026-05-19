const BRUNO_LIQUID_GLASS_VERSION = '20260518-3';
const BRUNO_LIQUID_GLASS_STYLE_ID = 'bruno-liquid-glass-tokens';

const BRUNO_LIQUID_GLASS_TOKENS = {
  'bruno-liquid-accent': '150, 190, 255',
  'bruno-liquid-card-radius': '18px',
  'bruno-liquid-card-radius-compact': '16px',
  'bruno-liquid-room-radius': '16px',

  // Validated on the Sala Bento card. Keep these values stable unless the
  // whole shared glass skin is intentionally revised.
  'bruno-liquid-surface-off-background': `
    radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
    radial-gradient(150px 150px at 96% 92%, rgba(var(--accent, var(--bruno-liquid-accent)),0.09), transparent 69%),
    linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
    linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
  `,
  'bruno-liquid-surface-off-filter': 'blur(32px) saturate(1.68) contrast(1.06)',
  'bruno-liquid-surface-off-border': '1px solid rgba(255,255,255,0.18)',
  'bruno-liquid-surface-off-shadow': `
    inset 0 0 0 1px rgba(255,255,255,0.075),
    inset 0 1px 0 rgba(255,255,255,0.30),
    inset 1px 0 0 rgba(255,255,255,0.13),
    inset 0 -1px 0 rgba(255,255,255,0.055),
    0 18px 46px rgba(0,0,0,0.31),
    0 0 30px rgba(110,150,210,0.075)
  `,
  'bruno-liquid-surface-off-sheen': `
    radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
    radial-gradient(82px 92px at 94% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.12), transparent 74%),
    linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
    linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
  `,
  'bruno-liquid-surface-off-sheen-opacity': '0.82',
  'bruno-liquid-surface-edge-glow': `
    linear-gradient(125deg, rgba(255,255,255,0.42), rgba(255,255,255,0.10) 30%, rgba(255,255,255,0.028) 58%, rgba(255,190,120,0.24) 100%)
  `,

  'bruno-liquid-surface-bottom-line': 'linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)',
  'bruno-liquid-surface-bottom-line-opacity': '0',

  'bruno-liquid-surface-on-background': `
    radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.38), rgba(255,255,255,0.105) 52%, transparent 75%),
    radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.24), transparent 68%),
    radial-gradient(122px 96px at 27% 18%, rgba(255,232,126,0.105), transparent 71%),
    linear-gradient(180deg, rgba(255,255,255,0.225), rgba(255,255,255,0.073) 43%, rgba(255,255,255,0.108)),
    linear-gradient(155deg, rgba(42,51,65,0.72), rgba(23,28,38,0.58) 52%, rgba(13,16,24,0.44))
  `,
  'bruno-liquid-surface-on-filter': 'blur(34px) saturate(1.72) contrast(1.05)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,255,255,0.32)',
  'bruno-liquid-surface-on-shadow': `
    inset 0 0 0 1px rgba(255,255,255,0.11),
    inset 0 1px 0 rgba(255,255,255,0.40),
    inset 1px 0 0 rgba(255,255,255,0.16),
    inset 0 -1px 0 rgba(0,0,0,0.16),
    0 0 22px rgba(255,255,255,0.09),
    0 0 38px rgba(120,170,235,0.12),
    0 18px 46px rgba(0,0,0,0.30)
  `,
  'bruno-liquid-surface-on-sheen': `
    radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%),
    radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%),
    radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%),
    linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%)
  `,
  'bruno-liquid-surface-on-sheen-opacity': '0.78',
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
  apply: brunoLiquidGlassApply,
};

brunoLiquidGlassApply();
