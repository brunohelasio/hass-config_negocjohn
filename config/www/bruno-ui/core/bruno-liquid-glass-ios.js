const BRUNO_LIQUID_GLASS_IOS_VERSION = '20260723-liquid-glass-ios-3';
const BRUNO_LIQUID_GLASS_IOS_STYLE_ID = 'bruno-liquid-glass-tokens';
const BRUNO_LIQUID_GLASS_IOS_BASE = globalThis.BrunoLiquidGlass;

const BRUNO_LIQUID_GLASS_IOS_TOKENS = Object.assign(
  {},
  BRUNO_LIQUID_GLASS_IOS_BASE?.tokens || {},
  {
    // Additive glass for dark, warm wallpapers.
    'ha-card-background': 'rgba(255,255,255,0.12)',
    'ha-card-backdrop-filter': 'blur(16px) saturate(1.30) brightness(1.08)',
    'ha-card-box-shadow': `
      inset 0 1px 0 rgba(255,255,255,0.40),
      inset 1px 0 0 rgba(255,255,255,0.14),
      inset -1px 0 0 rgba(255,255,255,0.07),
      inset 0 -1px 0 rgba(255,255,255,0.05),
      0 8px 24px rgba(0,0,0,0.35)
    `,

    // Preserve the standard Liquid Glass wallpaper treatment.
    'bruno-theme-backdrop-blur': '0px',
    'bruno-theme-backdrop-scale': '1',
    'bruno-theme-backdrop-saturate': '1',
    'bruno-theme-backdrop-brightness': '1',
    'bruno-theme-backdrop-dim': '0.10',

    'bruno-liquid-card-background': 'rgba(255,255,255,0.12)',
    'bruno-liquid-card-filter': 'blur(16px) saturate(1.30) brightness(1.08)',
    'bruno-liquid-card-border-color': 'rgba(255,255,255,0.20)',
    'bruno-liquid-card-border': '1px solid var(--bruno-liquid-card-border-color)',
    'bruno-liquid-card-shadow': `
      inset 0 1px 0 rgba(255,255,255,0.40),
      inset 1px 0 0 rgba(255,255,255,0.14),
      inset -1px 0 0 rgba(255,255,255,0.09),
      inset 0 -1px 0 rgba(255,255,255,0.05),
      0 8px 24px rgba(0,0,0,0.35)
    `,
    'bruno-liquid-card-sheen': `
      radial-gradient(120px 78px at 16% 0%, rgba(255,255,255,0.44), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.00) 38%),
      linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
    `,
    'bruno-liquid-card-sheen-opacity': '0.85',
    'bruno-liquid-card-edge-glow': `
      linear-gradient(125deg, rgba(255,255,255,0.22), rgba(255,255,255,0.055) 38%, rgba(255,255,255,0.012) 100%)
    `,

    /* NOVO (2026-07-23): o branco do "desligado" estava forte demais. Por
       pedido do usuario, o valor forte que ANTES era do "desligado" virou o
       do "ligado" (mesmo espirito do ajuste ja feito no tema Liquid Glass
       principal), e o "desligado" ganhou uma versao com a opacidade do
       branco reduzida (~35-40%) — blur/saturate/posicoes dos gradientes
       inalterados, so a intensidade do branco caiu. */
    // Off: mesma estrutura do bloco anterior, branco reduzido.
    'bruno-liquid-surface-off-background': `
      radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 46%, transparent 73%),
      linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.025) 40%, rgba(255,255,255,0.045)),
      linear-gradient(155deg, rgba(255,255,255,0.065), rgba(255,255,255,0.035))
    `,
    'bruno-liquid-surface-off-filter': 'blur(14px) saturate(1.28) brightness(1.04)',
    'bruno-liquid-surface-off-border': '1px solid rgba(255,255,255,0.10)',
    'bruno-liquid-surface-off-shadow': `
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 1px 0 0 rgba(255,255,255,0.07),
      inset -1px 0 0 rgba(255,255,255,0.045),
      inset 0 -1px 0 rgba(255,255,255,0.025),
      0 8px 24px rgba(0,0,0,0.32)
    `,
    'bruno-liquid-surface-off-sheen': `
      radial-gradient(112px 72px at 16% 0%, rgba(255,255,255,0.24), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 38%),
      linear-gradient(90deg, rgba(255,255,255,0.065), rgba(255,255,255,0.00) 48%)
    `,
    'bruno-liquid-surface-off-sheen-opacity': '0.85',
    'bruno-liquid-surface-edge-glow': 'var(--bruno-liquid-card-edge-glow)',

    // On/focus: o branco "forte" que antes era do desligado (pedido do usuario).
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
    'bruno-liquid-active-warm-background': 'var(--bruno-liquid-surface-on-background)',
    'bruno-liquid-active-warm-border-color': 'var(--bruno-liquid-surface-on-border-color)',
    'bruno-liquid-active-warm-shadow': 'var(--bruno-liquid-surface-on-shadow)',
    'bruno-liquid-active-warm-sheen': 'var(--bruno-liquid-surface-on-sheen)',

    /* ANTERIOR (rollback): band-open apontava para --bruno-liquid-surface-on-*.
       Desacoplado pelo mesmo motivo do tema Liquid Glass principal — "band-open"
       e sobre secao/aba expandida, sem relacao com luz acesa. Mesmo valor do
       tema principal, para o acordeao ficar identico entre os 2 temas.
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

    // NOVO: raio das bordas explicitamente igual ao tema Liquid Glass principal
    // (evita depender so da heranca implicita de BRUNO_LIQUID_GLASS_IOS_BASE).
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
    // ANTERIOR (rollback raio unico 2026-08-22): 34px
    'ha-card-border-radius': '20px',
  },
);

const BRUNO_LIQUID_GLASS_IOS_GLOBAL_CSS = `
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
  0% { opacity: 0; }
  36% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes bruno-liquid-route-fade-reduced {
  0% { opacity: 0.16; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    animation: bruno-liquid-route-fade-reduced 180ms ease-out both;
  }
}
`;

function brunoLiquidGlassIOSSerialize(tokens) {
  return Object.entries(tokens)
    .map(([name, value]) => `  --${name}: ${String(value).trim().replace(/\s+/g, ' ')};`)
    .join('\n');
}

function brunoLiquidGlassIOSApply(root = globalThis.document) {
  if (!root?.head) return null;

  let style = root.getElementById(BRUNO_LIQUID_GLASS_IOS_STYLE_ID);
  if (!style) {
    style = root.createElement('style');
    style.id = BRUNO_LIQUID_GLASS_IOS_STYLE_ID;
    root.head.appendChild(style);
  }

  style.textContent = `:root {\n${brunoLiquidGlassIOSSerialize(BRUNO_LIQUID_GLASS_IOS_TOKENS)}\n}\n${BRUNO_LIQUID_GLASS_IOS_GLOBAL_CSS}`;
  return style;
}

globalThis.BrunoLiquidGlassIOS = {
  version: BRUNO_LIQUID_GLASS_IOS_VERSION,
  tokens: BRUNO_LIQUID_GLASS_IOS_TOKENS,
  surfaces: BRUNO_LIQUID_GLASS_IOS_BASE?.surfaces || {},
  states: BRUNO_LIQUID_GLASS_IOS_BASE?.states || {},
  apply: brunoLiquidGlassIOSApply,
  feedback: (...args) => BRUNO_LIQUID_GLASS_IOS_BASE?.feedback?.(...args) || false,
  routeTransition: (...args) => BRUNO_LIQUID_GLASS_IOS_BASE?.routeTransition?.(...args),
};
