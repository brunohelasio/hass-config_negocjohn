/**
 * CSS da subview de cômodo — ARQUIVO GERADO, não editado à mão.
 *
 * Origem: os seis arquivos em config/www/bruno-ui/subviews/, medidos regra a
 * regra (ver docs/12, secao "O CSS das seis, medido regra a regra"). Sao 652
 * regras identicas nos seis, mais quatro blocos que pertencem a comodos
 * especificos.
 *
 * Os tokens tinham prefixo por comodo — sala, office, qcasal, qmarina, qmiguel,
 * com a Cozinha reaproveitando os do Office. Aqui todos usam o prefixo unico
 * --room-, e foi isso que colapsou 14 das 22 divergencias aparentes.
 *
 * Regenerar:  node scripts/validation/gen-subview-css.mjs
 *
 * NAO usar crase em comentario dentro dos templates abaixo: e a armadilha que
 * ja quebrou o dashboard cinco vezes. Conferir com
 * scripts/validation/check-backtick.mjs
 */
import { css, unsafeCSS } from 'lit';

/** Base compartilhada pelos seis comodos: 620 regras. */
export const SUBVIEW_BASE_CSS = css`
:host {
  --room-gap: 10px;
  --room-radius: var(--bruno-liquid-card-radius, 18px);
  --room-radius-small: var(--bruno-liquid-card-radius-compact, 16px);
  --room-cell-radius: var(--bruno-liquid-cell-radius, 16px);
  --accent: var(--bruno-liquid-accent, 150, 190, 255);
  --accent-blue: 96, 165, 250;
  --accent-cyan: 79, 172, 254;
  --accent-amber: 255, 183, 77;
  --media-screen-height: 150px;
  --ac-h: 320px;
  --text-main: rgba(245,250,255,0.96);
  --text-soft: rgba(255,255,255,0.62);
  --text-dim: rgba(255,255,255,0.42);
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-main);
  font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  overflow: hidden;
}
* {
  box-sizing: border-box;
  letter-spacing: 0;
}
button {
  font: inherit;
  color: inherit;
  border: 0;
  outline: 0;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.hero-panel {
}
.side-panel {
  grid-area: side;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: clamp(56.16px, 3.96cqi, 93.6px) minmax(0, 1fr);
  gap: var(--room-gap);
}
.tv-card {
  grid-area: tv;
}
.ps5-card {
  grid-area: ps5;
}
.room-rail-mount {
  grid-area: frame-left;
  min-width: 0;
  min-height: 0;
  position: relative;
  z-index: 3;
}
.room-rail-mount > * {
  height: 100%;
}
.subview-topbar {
  grid-area: frame-top;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
}
.subview-room {
  grid-column: 2;
  text-align: center;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(226,232,240,0.82);
  white-space: nowrap;
}
.subview-clock {
  grid-column: 3;
  justify-self: end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.86);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  line-height: 1;
}
.subview-clock small {
  color: rgba(226,232,240,0.55);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
}
.room-sidebar::before {
  display: none;
}
.room-nav-button::after {
  display: none;
}
.room-nav-button:hover, .room-nav-button:focus, .room-nav-button:focus-visible {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.05);
  outline: none;
}
.room-nav-button.is-active {
  color: #fff;
  background: rgba(255,255,255,0.085);
  border: none;
  box-shadow: none;
}
.room-nav-button.is-active svg {
  stroke: rgb(var(--accent));
}
.room-nav-home {
  margin-bottom: clamp(6.24px, 0.44cqi, 10.4px);
}
.room-nav-label {
  display: block;
  font-size: clamp(7.41px, 0.52cqi, 12.35px);
  line-height: 1.05;
  font-weight: 600;
  color: inherit;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.room-nav-button svg {
  width: clamp(14.82px, 1.04cqi, 24.7px);
  height: clamp(14.82px, 1.04cqi, 24.7px);
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
  pointer-events: none;
}
.glass-card {
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 0;
  border-radius: var(--room-radius);
  overflow: hidden;
  color: var(--text-main);
  background: var(--bruno-liquid-surface-off-background, radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%), radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%), linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)), linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32)) );
  backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
  border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
  box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.18), inset 1px 0 0 rgba(255,255,255,0.10), inset -1px -1px 0 rgba(255,255,255,0.026), 0 18px 44px rgba(0,0,0,0.27), 0 0 24px rgba(110,150,210,0.055) );
  transition: background var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1)), border-color var(--bruno-liquid-motion-fast, 160ms ease), box-shadow var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1));
}
.glass-card::before {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: 0;
  pointer-events: none;
  border-radius: calc(var(--room-radius) - 1px);
  background: var(--bruno-liquid-surface-off-sheen, radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%), radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%), linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%), linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%) );
  opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
}
.glass-card::after {
  content: "";
  position: absolute;
  inset: var(--bruno-subview-card-edge-inset, auto 16px 8px 16px);
  z-index: var(--bruno-subview-card-edge-z, 0);
  height: var(--bruno-subview-card-edge-height, 1px);
  padding: var(--bruno-subview-card-edge-padding, 0);
  box-sizing: border-box;
  pointer-events: none;
  border-radius: var(--bruno-subview-card-edge-radius, 999px);
  background: var(--bruno-subview-card-edge-background, var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)));
  -webkit-mask: var(--bruno-subview-card-edge-mask, none);
  -webkit-mask-composite: var(--bruno-subview-card-edge-webkit-composite, source-over);
  mask: var(--bruno-subview-card-edge-mask, none);
  mask-composite: var(--bruno-subview-card-edge-composite, add);
  opacity: var(--bruno-subview-card-edge-opacity, var(--bruno-liquid-surface-bottom-line-opacity, 0));
}
.glass-card > * {
  position: relative;
  z-index: 1;
}
.glass-card.is-active {
  --text-main: rgba(248,251,255,0.96);
  --text-soft: rgba(255,255,255,0.52);
  background: var(--bruno-liquid-surface-on-background, radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.38), rgba(255,255,255,0.105) 52%, transparent 75%), radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.24), transparent 68%), radial-gradient(122px 96px at 27% 18%, rgba(255,232,126,0.105), transparent 71%), linear-gradient(180deg, rgba(255,255,255,0.225), rgba(255,255,255,0.073) 43%, rgba(255,255,255,0.108)), linear-gradient(155deg, rgba(42,51,65,0.72), rgba(23,28,38,0.58) 52%, rgba(13,16,24,0.44)) );
  backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
  border-color: var(--bruno-liquid-surface-on-border-color, rgba(255,255,255,0.24));
  box-shadow: var(--bruno-liquid-surface-on-shadow, inset 0 1px 0 rgba(255,255,255,0.32), inset 1px 0 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.18), 0 0 22px rgba(255,255,255,0.09), 0 0 34px rgba(120,170,235,0.10), 0 18px 42px rgba(0,0,0,0.28) );
}
.glass-card.is-active::before {
  background: var(--bruno-liquid-surface-on-sheen, radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%), radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%), radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%), linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%) );
  opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
}
.hero-bg {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  top: clamp(-23.4px, -0.99cqi, -14.04px);
  bottom: clamp(-26px, -1.1cqi, -15.6px);
  left: clamp(-20.8px, -0.88cqi, -12.48px);
  right: clamp(-111.8px, -4.73cqi, -67.08px);
  background: linear-gradient(90deg, rgba(4,10,18,0.82) 0%, rgba(5,10,18,0.66) 12%, rgba(6,12,20,0.42) 24%, rgba(7,13,22,0.22) 38%, rgba(7,13,22,0.10) 50%, rgba(7,13,22,0.14) 60%, rgba(7,13,22,0.30) 70%, rgba(7,13,22,0.54) 82%, rgba(7,13,22,0.80) 92%, rgba(7,13,22,0.94) 100% ), linear-gradient(180deg, rgba(4,8,14,0.78) 0%, rgba(4,8,14,0.46) 10%, rgba(4,8,14,0.18) 22%, rgba(4,8,14,0.04) 34%, rgba(4,8,14,0.00) 46%, rgba(4,8,14,0.00) 58%, rgba(4,8,14,0.10) 72%, rgba(4,8,14,0.28) 84%, rgba(4,8,14,0.56) 94%, rgba(4,8,14,0.78) 100% ), radial-gradient(680px 220px at 12% 4%, rgba(255,255,255,0.07), transparent 56%), radial-gradient(900px 320px at 74% 52%, rgba(255,255,255,0.03), transparent 66%), var(--hero-image) left center / auto 100% no-repeat, var(--hero-fallback-image) left center / auto 100% no-repeat;
  opacity: 1;
  filter: saturate(1.01) brightness(0.90);
  mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
.hero-bg::before, .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero-bg::before {
  background: linear-gradient(90deg, rgba(4,10,18,0.72) 0%, rgba(4,10,18,0.56) 12%, rgba(5,10,18,0.34) 24%, rgba(5,10,18,0.14) 38%, rgba(5,10,18,0.02) 50%, rgba(5,10,18,0.08) 60%, rgba(5,10,18,0.22) 72%, rgba(5,10,18,0.46) 84%, rgba(5,10,18,0.74) 100% ), linear-gradient(180deg, rgba(3,8,14,0.62) 0%, rgba(3,8,14,0.34) 12%, rgba(3,8,14,0.08) 26%, rgba(3,8,14,0.00) 40%, rgba(3,8,14,0.00) 62%, rgba(3,8,14,0.10) 76%, rgba(3,8,14,0.30) 90%, rgba(3,8,14,0.60) 100% );
}
.hero-bg::after {
  background: radial-gradient(720px 220px at 8% 2%, rgba(255,255,255,0.08), transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%), linear-gradient(0deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00) 34%);
  opacity: 0.58;
}
.hero-top {
  display: flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.back-button, .control-button {
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.back-button bruno-icon, .control-button bruno-icon {
  --mdc-icon-size: 18px;
}
.hero-title, .module-title {
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
}
.hero-subtitle, .module-subtitle {
  margin-top: clamp(3.12px, 0.22cqi, 5.2px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 600;
  color: var(--text-soft);
}
.chip-button, .online-chip, .state-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  min-height: clamp(23.4px, 1.65cqi, 39px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  color: rgba(255,255,255,0.86);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  white-space: nowrap;
}
.chip-button.is-active, .online-chip {
  background: rgba(24,134,190,0.36);
  border-color: rgba(96,190,255,0.46);
}
.curtain-control-row {
  display: grid;
  grid-template-columns: minmax(clamp(73.32px, 5.16cqi, 122.2px), auto) minmax(clamp(74.88px, 5.27cqi, 124.8px), 1fr) auto;
  align-items: center;
  gap: clamp(14.04px, 0.99cqi, 23.4px);
  min-width: 0;
}
.curtain-identity, .title-with-chip {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  min-width: 0;
}
.curtain-icon-shell {
  width: clamp(21.84px, 1.54cqi, 36.4px);
  height: clamp(21.84px, 1.54cqi, 36.4px);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.17), rgba(255,255,255,0.04) 56%, rgba(0,0,0,0.18)), rgba(18,20,21,0.52);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(12px) saturate(1.18);
  -webkit-backdrop-filter: blur(12px) saturate(1.18);
}
.curtain-title {
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: 0;
  color: rgba(255,255,255,0.96);
  white-space: nowrap;
}
.curtain-status {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: clamp(3.9px, 0.27cqi, 6.5px);
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  white-space: nowrap;
}
.curtain-status-text {
  color: var(--curtain-gold);
}
.curtain-status-percent {
  color: rgba(255,255,255,0.78);
  font-weight: 800;
}
.curtain-main-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  min-width: 0;
}
.curtain-action-button.is-muted {
  color: rgba(255,255,255,0.88);
}
.curtain-action-button.is-active {
  color: var(--curtain-gold);
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
  background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
  box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
}
.curtain-action-button:active {
  transform: translateY(1px);
  color: var(--curtain-gold);
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
  background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
}
.curtain-action-button:disabled, .curtain-mark:disabled, .curtain-range:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}
.curtain-svg {
  display: block;
  fill: rgba(255,255,255,0.70);
  stroke: rgba(255,255,255,0.58);
  stroke-width: 1.78;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}
.curtain-svg.is-main {
  fill: rgba(255,255,255,0.78);
  stroke: rgba(255,255,255,0.54);
}
.curtain-svg.is-stop {
  fill: rgba(255,255,255,0.64);
  stroke: rgba(255,255,255,0.54);
}
.curtain-slider-zone {
  position: relative;
  display: grid;
  gap: 0;
  min-width: 0;
}
.curtain-slider-glow {
  position: absolute;
  left: 0;
  top: -3px;
  width: var(--curtain-position);
  height: clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.11), rgba(var(--curtain-gold-rgb),0.020));
  filter: blur(8px);
  pointer-events: none;
}
.curtain-range {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 3px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.055);
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62) 0 var(--curtain-position), rgba(var(--curtain-gold-rgb),0.24) var(--curtain-position), rgba(255,255,255,0.11) var(--curtain-position) 100%);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.24);
  cursor: pointer;
  accent-color: var(--curtain-gold);
}
.curtain-range::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 999px;
  background: transparent;
}
.curtain-range::-webkit-slider-thumb {
  width: clamp(9.36px, 0.66cqi, 15.6px);
  height: clamp(9.36px, 0.66cqi, 15.6px);
  margin-top: clamp(-5.85px, -0.25cqi, -3.51px);
  -webkit-appearance: none;
  appearance: none;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.30);
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
  box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
}
.curtain-range::-moz-range-track {
  height: 3px;
  border-radius: 999px;
  background: transparent;
}
.curtain-range::-moz-range-progress {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62), rgba(var(--curtain-gold-rgb),0.24));
}
.curtain-range::-moz-range-thumb {
  width: clamp(9.36px, 0.66cqi, 15.6px);
  height: clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.30);
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
  box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
}
.curtain-marks {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: clamp(5.46px, 0.38cqi, 9.1px);
}
.curtain-mark {
  position: relative;
  min-width: 0;
  height: clamp(17.16px, 1.21cqi, 28.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) 0 0;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.42);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 700;
  letter-spacing: 0;
  cursor: pointer;
}
.curtain-mark::before {
  content: "";
  position: absolute;
  top: 1px;
  left: 50%;
  width: 1px;
  height: clamp(3.12px, 0.22cqi, 5.2px);
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(255,255,255,0.28);
}
.curtain-mark.is-active {
  color: var(--curtain-gold);
}
.curtain-mark.is-active::before {
  background: rgba(var(--curtain-gold-rgb),0.72);
}
.module-icon, .micro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: clamp(21.84px, 1.54cqi, 36.4px);
  height: clamp(21.84px, 1.54cqi, 36.4px);
  border-radius: 50%;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.13);
  color: rgba(210,225,240,0.82);
}
.module-icon bruno-icon, .micro-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
}
.soft-button, .primary-button {
  min-height: clamp(28.08px, 1.98cqi, 46.8px);
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: var(--bruno-liquid-control-radius, 14px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  color: rgba(255,255,255,0.88);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
}
.soft-button.is-primary, .primary-button {
  background: var(--bruno-liquid-control-blue-background, rgba(24,134,190,0.42));
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,190,255,0.50));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.18));
}
.status-item:last-child {
  border-right: 0;
}
.status-item strong {
  display: block;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-item span:not(.micro-icon) {
  display: block;
  margin-top: clamp(3.12px, 0.22cqi, 5.2px);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  color: var(--text-soft);
}
.micro-icon.tone-amber {
  color: rgb(255,183,77);
  background: rgba(255,183,77,0.10);
  border-color: rgba(255,183,77,0.22);
}
.micro-icon.tone-blue {
  color: rgb(180,215,255);
  background: rgba(96,165,250,0.10);
  border-color: rgba(96,165,250,0.20);
}
.micro-icon.tone-cyan {
  color: rgb(111,224,241);
  background: rgba(111,224,241,0.10);
  border-color: rgba(111,224,241,0.20);
}
.micro-icon.tone-green {
  color: rgb(134,224,152);
  background: rgba(134,224,152,0.10);
  border-color: rgba(134,224,152,0.20);
}
.lights-card, .cameras-card, .tv-card, .ps5-card, .spotify-card, .ac-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
}
.module-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  margin-bottom: clamp(6.24px, 0.44cqi, 10.4px);
}
.head-actions {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.all-label {
  color: rgb(255,154,18);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 900;
}
.chip-button {
  min-width: clamp(40.56px, 2.86cqi, 67.6px);
}
.lights-groups {
  position: relative;
  z-index: 1;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  align-items: stretch;
  min-height: 0;
  height: 100%;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.light-group {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.light-group-label {
  color: rgba(255,255,255,0.54);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 900;
  text-transform: uppercase;
}
.lights-divider {
  align-self: stretch;
  width: 1px;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.16), rgba(255,183,77,0.26), rgba(255,255,255,0.12), transparent);
  box-shadow: 0 0 14px rgba(255,183,77,0.10);
}
.light-group-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.light-tile.is-on {
  color: rgba(255,255,255,0.98);
  background: var(--bruno-liquid-cell-active-warm-background, radial-gradient(76px 48px at 18% 12%, rgba(255,255,255,0.28), transparent 72%), radial-gradient(96px 58px at 94% 82%, rgba(255,183,77,0.24), transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.074)), linear-gradient(180deg, rgba(255,183,77,0.10), rgba(255,183,77,0.03)) );
  border-color: var(--bruno-liquid-cell-active-warm-border, rgba(255,205,95,0.44));
  box-shadow: var(--bruno-liquid-cell-active-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.22), inset 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.08), 0 0 20px rgba(255,183,77,0.17) );
}
.lights-zone-rail::before {
  content: "";
  position: absolute;
  inset: 1px;
  pointer-events: none;
  border-radius: calc(var(--room-cell-radius) - 1px);
  background: radial-gradient(52px 78px at 50% 20%, rgba(255,191,74,0.10), transparent 66%), linear-gradient(135deg, rgba(255,255,255,0.11), transparent 34%, transparent 70%, rgba(255,188,65,0.05));
  opacity: 0.88;
}
.rail-zone, .rail-state, .rail-track {
  position: relative;
  z-index: 1;
}
.rail-zone {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 900;
  color: rgba(255,231,176,0.68);
  text-shadow: 0 1px 2px rgba(0,0,0,0.34);
}
.rail-state {
  min-width: clamp(28.08px, 1.98cqi, 46.8px);
  min-height: clamp(16.38px, 1.15cqi, 27.3px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: rgba(255,205,95,0.95);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 900;
  background: rgba(255,183,77,0.10);
  border: 1px solid rgba(255,183,77,0.20);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 calc(14px * var(--rail-glow, 0)) rgba(255,183,77,0.18);
}
.rail-state strong {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  color: rgba(255,235,177,0.98);
}
.rail-track {
  position: relative;
  width: clamp(32.76px, 2.31cqi, 54.6px);
  height: 100%;
  min-height: clamp(96.72px, 6.81cqi, 161.2px);
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,245,210,0.10), rgba(255,196,83,0.035)), radial-gradient(circle at 50% 8%, rgba(255,255,255,0.16), transparent 30%), rgba(8,15,28,0.72);
  border: 1px solid rgba(255,222,152,0.30);
  box-shadow: inset 0 0 16px rgba(255,228,170,0.10), inset 6px 0 14px rgba(255,255,255,0.035), inset -8px 0 16px rgba(0,0,0,0.28), 0 0 calc(18px * var(--rail-glow, 0)) rgba(255,187,67,0.18), 0 0 calc(42px * var(--rail-glow, 0)) rgba(255,158,35,0.12);
}
.rail-track::before {
  content: "";
  position: absolute;
  inset: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,0.08);
  pointer-events: none;
  z-index: 4;
}
.rail-track::after {
  content: "";
  position: absolute;
  top: clamp(8.58px, 0.6cqi, 14.3px);
  left: clamp(7.8px, 0.55cqi, 13px);
  width: clamp(10.14px, 0.71cqi, 16.9px);
  height: 72%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.034), transparent);
  opacity: 0.42;
  pointer-events: none;
  z-index: 5;
  filter: blur(0.2px);
}
.rail-fill {
  position: absolute;
  left: clamp(3.9px, 0.27cqi, 6.5px);
  right: clamp(3.9px, 0.27cqi, 6.5px);
  bottom: clamp(3.9px, 0.27cqi, 6.5px);
  height: calc((100% - 10px) * var(--rail-fill-ratio, 0));
  min-height: calc(24px * var(--rail-glow, 0));
  border-radius: 999px;
  background: radial-gradient(circle at 40% 12%, rgba(255,255,255,0.95), transparent 20%), linear-gradient(180deg, #fff6c9 0%, #ffe18a 24%, #ffc247 58%, #ff9f1f 100%);
  box-shadow: 0 0 calc(16px * var(--rail-glow, 0)) rgba(255,226,138,0.70), 0 0 calc(34px * var(--rail-glow, 0)) rgba(255,184,61,0.44), 0 0 calc(64px * var(--rail-glow, 0)) rgba(255,145,31,0.25);
  opacity: var(--rail-glow, 0);
  transition: height 550ms cubic-bezier(.22,.9,.32,1), min-height 350ms ease, opacity 350ms ease, box-shadow 450ms ease;
}
.rail-fill::before {
  content: "";
  position: absolute;
  top: 0;
  left: clamp(4.68px, 0.33cqi, 7.8px);
  right: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.82);
  filter: blur(3px);
  opacity: 0.90;
}
.rail-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(255,255,255,0.25), transparent 38%, rgba(255,255,255,0.18));
  opacity: 0.70;
  mix-blend-mode: screen;
}
.rail-ambient-glow {
  position: absolute;
  left: 50%;
  bottom: clamp(15.6px, 1.1cqi, 26px);
  width: clamp(67.08px, 4.73cqi, 111.8px);
  height: var(--rail-ambient-height, 22px);
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(255,183,55,0.30), rgba(255,139,22,0.12), transparent 72%);
  filter: blur(16px);
  opacity: var(--rail-glow, 0);
  pointer-events: none;
  transition: height 550ms cubic-bezier(.22,.9,.32,1), opacity 350ms ease;
}
.rail-dimmer-ghost {
  position: absolute;
  inset: clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: inherit;
  border: 1px dashed rgba(255,255,255,0.12);
  opacity: 0;
  pointer-events: none;
}
.light-tile.is-placeholder {
  opacity: 0.55;
}
.light-tile:hover, .camera-thumb-overlay:hover, .soft-button:hover, .control-button:hover {
  transform: translateY(-1px);
}
.light-tile.is-on .light-icon {
  --light-color: var(--state-icon-active-color, #f0c040);
  color: rgb(255,210,86);
  filter: drop-shadow(0 0 10px rgba(255,183,77,0.34));
}
.tpl-light-icon {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  color: var(--light-color);
}
.tpl-light-icon svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
.tpl-light-icon .light-color {
  fill: var(--light-color);
}
.tpl-light-icon .flush-beam {
  transform-origin: -100% 46%;
  animation: bruno-light-flush-on 2s ease forwards;
}
.tpl-light-icon .pendant-swing {
  transform-box: fill-box;
  transform-origin: top center;
  animation: bruno-light-pendant-on 1.7s ease-in-out;
}
.tpl-light-glow {
  position: absolute;
  inset: 3px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,214,99,0.45), transparent 68%);
  filter: blur(7px);
  opacity: 0.95;
}
@keyframes bruno-light-flush-on {
from {
  transform: scaleY(0);
}
to {
  transform: scaleY(1);
}
}
@keyframes bruno-light-pendant-on {
0% {
  transform: rotateZ(0deg);
}
23% {
  transform: rotateZ(-10deg);
}
56% {
  transform: rotateZ(10deg);
}
70% {
  transform: rotateZ(-2deg);
}
85% {
  transform: rotateZ(2deg);
}
100% {
  transform: rotateZ(0deg);
}
}
.light-tile small {
  grid-area: status;
  min-width: 0;
  color: rgba(255,205,95,0.92);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cameras-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.online-chip span, .state-chip span, .live-dot {
  width: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: 50%;
  background: #2ee77a;
  box-shadow: 0 0 10px rgba(46,231,122,0.5);
}
.camera-stage {
  position: relative;
  z-index: 1;
  min-height: 0;
  height: 100%;
}
.camera-main {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.11);
  text-align: left;
}
.camera-row-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.018);
}
.camera-row-image img, .poster-card img, .spotify-art img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-row-image img {
  z-index: 1;
  opacity: 0;
  filter: brightness(0.86) saturate(0.94);
}
.camera-row-image img.is-loaded {
  opacity: 1;
}
.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.18);
}
.camera-placeholder bruno-icon {
  display: none;
  --mdc-icon-size: 36px;
}
.camera-main::after, .camera-thumb-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: transparent;
}
.camera-main.has-loaded-image::after, .camera-thumb-overlay.has-loaded-image::after {
  background: linear-gradient(90deg, rgba(4,8,16,0.52), rgba(4,8,16,0.10) 68%, rgba(4,8,16,0.42));
}
.camera-row-copy, .camera-chevron {
  position: absolute;
  z-index: 2;
}
.camera-row-copy span, .camera-thumb-name {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
}
.camera-chevron {
  right: clamp(10.92px, 0.77cqi, 18.2px);
  top: clamp(10.92px, 0.77cqi, 18.2px);
  --mdc-icon-size: 19px;
  color: rgba(255,255,255,0.82);
}
.camera-thumb-overlay {
  position: absolute;
  z-index: 3;
  right: clamp(9.36px, 0.66cqi, 15.6px);
  bottom: clamp(9.36px, 0.66cqi, 15.6px);
  width: min(44%, clamp(123.24px, 8.68cqi, 205.4px));
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 26px rgba(0,0,0,0.36);
  text-align: left;
}
.camera-thumb-overlay .camera-row-image {
  border-radius: 14px;
}
.camera-thumb-overlay::after {
  background: linear-gradient(180deg, rgba(3,8,15,0.06), rgba(3,8,15,0.74));
}
.camera-thumb-overlay span {
  position: absolute;
  z-index: 4;
  left: clamp(7.8px, 0.55cqi, 13px);
  bottom: clamp(5.46px, 0.38cqi, 9.1px);
  max-width: calc(100% - clamp(15.6px, 1.1cqi, 26px));
  color: rgba(255,255,255,0.92);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tv-card, .ps5-card, .spotify-card, .ac-card {
  min-height: 0;
}
.tv-body, .ac-body {
  position: relative;
  z-index: 1;
  height: calc(100% - clamp(35.88px, 2.53cqi, 59.8px));
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(10.92px, 0.77cqi, 18.2px);
  align-items: stretch;
}
.tv-main, .spotify-copy, .ac-main, .ps5-copy {
  min-width: 0;
}
.media-title {
  margin-top: clamp(6.24px, 0.44cqi, 10.4px);
  color: white;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  line-height: 1.1;
  font-weight: 800;
}
.media-subtitle {
  margin-top: clamp(3.9px, 0.27cqi, 6.5px);
  color: var(--text-soft);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 600;
}
.control-row {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  margin-top: 0;
}
.control-button.is-main {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%), linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58)) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.22), 0 0 22px rgba(96,165,250,0.24) );
}
.control-button.is-tool {
  color: rgba(210,245,230,0.96);
  background: var(--bruno-liquid-control-green-background, radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%), rgba(255,255,255,0.075) );
  border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
  box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.volume-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) clamp(29.64px, 2.09cqi, 49.4px);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  margin-top: 0;
  color: rgba(255,255,255,0.66);
}
.volume-row bruno-icon {
  --mdc-icon-size: 15px;
}
.volume-row strong {
  color: rgba(255,255,255,0.88);
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 800;
}
.volume-row input {
  width: 100%;
  min-width: 0;
  accent-color: rgb(28,214,104);
}
.poster-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text-dim);
  overflow: hidden;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
}
.tv-card .poster-card, .spotify-art {
  aspect-ratio: 1 / 1;
  height: var(--media-screen-height, 150px);
  min-height: var(--media-screen-height, 150px);
  max-height: var(--media-screen-height, 150px);
  width: auto;
  max-width: 100%;
  justify-self: center;
}
.tv-card .tv-body {
  grid-template-rows: var(--media-screen-height, 154px) auto;
}
.tv-card .poster-card {
  grid-row: 1;
  min-height: 0;
}
.tv-card .tv-main {
  grid-row: 2;
}
.tv-card .control-row {
}
.ps5-body {
  position: relative;
  z-index: 1;
  height: calc(100% - clamp(35.88px, 2.53cqi, 59.8px));
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(clamp(90.48px, 6.37cqi, 150.8px), 1fr) auto;
  gap: clamp(7.8px, 0.55cqi, 13px);
  align-items: stretch;
}
.ps5-minimal {
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-copy {
  grid-row: 2;
  display: grid;
  align-content: end;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  height: 100%;
}
.ps5-copy > strong {
  align-self: end;
  color: rgb(45,225,118);
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 800;
}
.ps5-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-image {
  grid-row: 1;
  justify-self: center;
  align-self: center;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform: scale(1.08);
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
}
.ps5-footer {
  min-height: 0;
  display: grid;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.device-state {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  width: fit-content;
  color: rgba(255,255,255,0.82);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
}
.ps5-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(31.2px, 2.2cqi, 52px);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-meta span, .ac-meta span {
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  min-width: 0;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 12px;
  color: var(--text-soft);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  background: rgba(255,255,255,0.052);
  border: 1px solid rgba(255,255,255,0.10);
}
.ps5-meta strong, .ac-meta strong {
  color: white;
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spotify-card {
  grid-area: spotify;
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  min-height: 0;
}
.spotify-body {
  position: relative;
  z-index: 1;
  display: grid;
}
.spotify-art {
  position: relative;
  inset: auto;
  aspect-ratio: 1 / 1;
  height: var(--media-screen-height, 168px);
  min-height: var(--media-screen-height, 168px);
  max-height: var(--media-screen-height, 168px);
  width: auto;
  max-width: 100%;
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--room-radius-small);
  background: radial-gradient(circle at 50% 45%, rgba(96,165,250,0.14), transparent 42%), rgba(5,10,20,0.72);
  overflow: hidden;
  color: rgba(255,255,255,0.22);
}
.spotify-art.has-art::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 64%, rgba(2,8,18,0.46));
}
.spotify-art bruno-icon {
  --mdc-icon-size: 70px;
}
.spotify-copy {
}
.spotify-card .media-title {
  margin-top: 0;
}
.spotify-controls {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.tv-card .control-button, .spotify-controls .control-button {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  border-radius: 13px;
}
.temperature-pill {
  align-self: start;
  min-width: clamp(45.24px, 3.19cqi, 75.4px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: clamp(5.46px, 0.38cqi, 9.1px) clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.92);
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  line-height: 1;
  font-weight: 800;
  background: rgba(255,255,255,0.070);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
}
.temperature-slider input {
  width: 100%;
  min-width: 0;
  accent-color: rgb(96,165,250);
}
.climate-mode-row, .fan-mode-row {
  display: grid;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.climate-mode, .fan-mode, .climate-stepper {
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  border-radius: var(--bruno-liquid-control-radius, 14px);
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.09));
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.050));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.06));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.climate-mode:disabled, .fan-mode:disabled {
  opacity: 0.42;
  cursor: default;
}
.climate-mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.66);
}
.climate-mode bruno-icon {
  --mdc-icon-size: 17px;
}
.climate-mode.is-active {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,183,255,0.34), transparent 72%), rgba(38,92,154,0.42) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.34));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14), 0 0 14px rgba(96,165,250,0.16) );
}
.climate-mode.is-power-on {
  color: rgba(255,255,255,0.96);
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%), rgba(38,92,138,0.38) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.12), 0 0 14px rgba(96,165,250,0.16) );
}
.climate-stepper button {
  height: clamp(29.64px, 2.09cqi, 49.4px);
  background: transparent;
  color: rgba(255,255,255,0.82);
  font-size: clamp(13.26px, 0.93cqi, 22.1px);
}
.climate-stepper span {
  text-align: center;
  color: rgba(255,255,255,0.88);
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 800;
}
.fan-label {
  display: block;
  color: rgba(255,255,255,0.90);
  font-weight: 800;
  margin-top: 3px;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
}
.fan-mode.is-active {
  color: rgba(255,255,255,0.94);
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,183,255,0.24), transparent 72%), rgba(38,92,154,0.32) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.28));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14));
}
.climate-mode:active, .fan-mode:active, .climate-stepper button:active {
  transform: translateY(1px);
  border-color: rgba(96,183,255,0.42);
}
.climate-trend {
  min-height: 0;
  height: clamp(81.12px, 5.71cqi, 135.2px);
  margin: clamp(-10.4px, -0.44cqi, -6.24px) clamp(-18.2px, -0.77cqi, -10.92px) clamp(-18.2px, -0.77cqi, -10.92px);
  border-radius: 0 0 calc(var(--room-radius) - 1px) calc(var(--room-radius) - 1px);
  overflow: hidden;
  background: transparent;
}
.climate-trend svg {
  display: block;
  width: 100%;
  height: 100%;
}
.trend-area {
  fill: rgba(96,165,250,0.16);
}
.trend-line {
  fill: none;
  stroke: rgba(96,165,250,0.76);
  stroke-width: 2.35;
  stroke-linecap: round;
  filter: drop-shadow(0 0 8px rgba(96,165,250,0.32));
}
.spotify-volume {
}
.tv-card, .spotify-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  overflow: hidden;
}
.tv-body, .spotify-body {
  height: auto;
  min-height: 0;
  grid-template-columns: 1fr;
  grid-template-rows: var(--media-screen-height, 154px) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  align-items: stretch;
}
.tv-main, .spotify-copy {
  display: grid;
  grid-template-rows: clamp(28.08px, 1.98cqi, 46.8px) clamp(18.72px, 1.32cqi, 31.2px);
  align-content: start;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding-top: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
  overflow: hidden;
}
.tv-card .control-row, .spotify-controls {
  margin-top: 2px;
}
.tv-card .volume-row, .spotify-volume {
  margin-top: 2px;
}
.media-source {
  margin-top: 2px;
  color: white;
  font-weight: 800;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
}
.spotify-card .media-title, .spotify-title {
  max-width: 100%;
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  white-space: nowrap;
  overflow: hidden;
}
.spotify-title span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}
.spotify-card .media-subtitle {
  margin-top: -2px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.state-chip {
  align-self: start;
  min-height: clamp(21.84px, 1.54cqi, 36.4px);
  max-width: clamp(59.28px, 4.18cqi, 98.8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 1180px) {
.side-panel {
  grid-template-rows: auto minmax(0, 1fr);
}
.status-item {
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
}
}
@media (max-width: 760px) {
:host {
  height: auto;
  overflow: visible;
}
.hero-stage {
  min-height: clamp(335.4px, 23.63cqi, 559px);
}
.hero-content {
  grid-template-columns: 1fr;
}
.hero-clock {
  font-size: clamp(54.6px, 3.85cqi, 91px);
}
.status-item:nth-child(even) {
  border-right: 0;
}
.curtain-dock {
  grid-template-columns: 1fr;
}
.side-panel {
  grid-template-rows: auto;
}
.lights-groups {
  height: auto;
  grid-template-columns: 1fr;
}
.lights-divider {
  display: none;
}
.light-group-grid {
  grid-template-rows: none;
  grid-auto-rows: minmax(clamp(73.32px, 5.16cqi, 122.2px), auto);
}
.cameras-card {
  min-height: clamp(304.2px, 21.43cqi, 507px);
}
.tv-card, .ps5-card, .spotify-card, .ac-card {
  min-height: clamp(202.8px, 14.29cqi, 338px);
}
.spotify-card {
  min-height: clamp(280.8px, 19.78cqi, 468px);
}
.tv-body, .ac-body {
  grid-template-columns: 1fr;
}
}
.content-left, .right-column {
  min-width: 0;
  min-height: 0;
  height: 100%;
}
.content-left {
  grid-area: content;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) var(--ac-h, 320px);
  gap: var(--room-gap);
}
.cams-media-row {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--room-gap);
}
.right-control-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(clamp(227.76px, 16.04cqi, 379.6px), 0.55fr);
  grid-template-rows: minmax(clamp(205.92px, 14.51cqi, 343.2px), 1fr) minmax(clamp(227.76px, 16.04cqi, 379.6px), 1fr);
  grid-template-areas: "lights ac" "media ac";
  gap: var(--room-gap);
}
.hero-panel, .cameras-card, .lights-card, .media-hub-card, .ac-card {
  min-width: 0;
  min-height: 0;
}
.hero-panel, .cameras-card, .lights-card, .media-hub-card, .ac-card, .curtain-card {
  grid-area: auto;
}
.subview-topband {
  grid-area: topband;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.topband-badges {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
}
.tb-badge {
  --tone: 154,160,166;
  height: clamp(35.88px, 2.53cqi, 59.8px);
  display: grid;
  grid-template-columns: clamp(17.16px, 1.21cqi, 28.6px) auto;
  align-items: center;
  column-gap: clamp(7.02px, 0.49cqi, 11.7px);
  padding: 0 clamp(12.48px, 0.88cqi, 20.8px);
  color: rgba(255,255,255,0.92);
}
.tb-badge + .tb-badge {
  border-left: 1px solid rgba(255,255,255,0.10);
}
.tb-badge-icon {
  width: clamp(17.16px, 1.21cqi, 28.6px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.44);
}
.tb-badge-icon bruno-icon {
  --mdc-icon-size: 18px;
}
.tb-badge-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.02;
}
.tb-badge-title {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.60);
}
.tb-badge-sub {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.42);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: clamp(132.6px, 9.34cqi, 221px);
}
.tb-badge.is-active .tb-badge-icon {
  color: rgb(var(--tone));
  filter: drop-shadow(0 0 8px rgba(var(--tone),0.45));
}
.tb-badge.is-active .tb-badge-title {
  color: rgba(255,255,255,0.94);
}
.tb-badge.is-active .tb-badge-sub {
  color: rgb(var(--tone));
}
.topband-clock {
  text-align: right;
  line-height: 1.05;
  white-space: nowrap;
}
.topband-clock span[data-clock] {
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
  color: rgba(248,251,255,0.96);
}
.topband-clock small {
  display: block;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-soft);
}
.hero-atmosphere {
  height: 100%;
}
.hero-atmosphere .hero-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0;
}
.curtain-overlay {
  align-self: stretch;
  width: 100% !important;
  max-width: 100% !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  padding: 0;
}
.subview-footer {
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  grid-area: bottomband;
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
}
.subview-footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: clamp(6.24px, 0.44cqi, 10.4px);
  right: clamp(6.24px, 0.44cqi, 10.4px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent);
}
.subview-presence {
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 600;
  color: rgba(255,255,255,0.52);
}
.subview-presence bruno-icon {
  flex: 0 0 auto;
  --mdc-icon-size: 16px;
  color: rgba(255,255,255,0.42);
}
.lights-head {
  flex: 0 0 auto;
}
.lights-zones::-webkit-scrollbar {
  width: 0;
}
.light-zone {
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
}
.light-zone.is-expanded {
  background: rgba(255,255,255,0.055);
}
.zone-header {
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: clamp(8.58px, 0.6cqi, 14.3px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(10.92px, 0.77cqi, 18.2px);
  cursor: pointer;
}
.zone-icon {
  width: clamp(26.52px, 1.87cqi, 44.2px);
  height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(255,196,90,0.30);
  background: rgba(255,196,90,0.08);
  color: rgba(255,196,90,0.92);
}
.zone-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
}
.zone-id {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.zone-id strong {
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 700;
  color: var(--text-main);
}
.zone-id small {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 600;
  color: var(--text-soft);
}
.zone-off {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 700;
  color: rgba(255,196,90,0.92);
  white-space: nowrap;
  cursor: pointer;
}
.zone-chevron {
  --mdc-icon-size: 20px;
  color: var(--text-soft);
}
.zone-preview {
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px) clamp(9.36px, 0.66cqi, 15.6px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 600;
  color: var(--text-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zl-tile {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: "icon sw" ". ." "name name";
  align-items: center;
  text-align: left;
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 16px;
  color: var(--text-main);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.zl-tile:hover {
  background: rgba(255,255,255,0.06);
}
.zl-tile.is-on {
  background: rgba(255,183,77,0.10);
  border-color: rgba(255,205,95,0.42);
}
.zl-tile.is-wide {
  grid-column: 1 / -1;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto;
  grid-template-areas: "icon name sw";
  align-items: center;
  align-content: center;
  column-gap: clamp(7.8px, 0.55cqi, 13px);
}
.zl-tile.is-wide .zl-icon {
  width: clamp(21.84px, 1.54cqi, 36.4px);
}
.zl-icon {
  grid-area: icon;
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: grid;
  place-items: center start;
  --light-color: #9da0a2;
  color: var(--light-color);
}
.zl-tile.is-on .zl-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.zl-icon .tpl-light-icon {
  width: clamp(21.06px, 1.48cqi, 35.1px);
  height: clamp(21.06px, 1.48cqi, 35.1px);
}
.zl-icon svg {
  width: 100%;
  height: 100%;
}
.zl-icon .tpl-light-icon svg g, .zl-icon .tpl-light-icon svg path {
  stroke-width: 1.09;
}
.zl-icon .tpl-light-icon.icon-ledstrip svg path {
  stroke-width: 1.45;
}
.zl-name {
  grid-area: name;
  min-width: 0;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zl-switch {
  grid-area: sw;
  position: relative;
  width: clamp(29.64px, 2.09cqi, 49.4px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.14);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.zl-tile.is-on .zl-switch {
  background: linear-gradient(90deg, rgba(255,176,54,0.95), rgba(255,206,120,0.95));
  border-color: rgba(255,196,90,0.55);
}
.zl-knob {
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: clamp(12.48px, 0.88cqi, 20.8px);
  height: clamp(12.48px, 0.88cqi, 20.8px);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  transition: left 0.2s ease;
}
.zl-tile.is-on .zl-knob {
  left: calc(100% - clamp(14.04px, 0.99cqi, 23.4px));
}
.light-row:hover {
  background: rgba(255,255,255,0.04);
}
.light-row.is-on .light-row-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.light-row-icon .tpl-light-icon {
  width: var(--bruno-liquid-icon-control, 23px);
  height: var(--bruno-liquid-icon-control, 23px);
}
.light-row-icon svg {
  width: 100%;
  height: 100%;
}
.light-row.is-on .light-bar {
  background: linear-gradient(90deg, rgba(255,176,54,0.96), rgba(255,206,120,0.96));
  border-color: rgba(255,196,90,0.55);
  box-shadow: 0 0 12px rgba(255,176,54,0.55), 0 0 4px rgba(255,176,54,0.6), inset 0 1px 0 rgba(255,255,255,0.45);
}
.ac-card.ac-card-lean {
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr) clamp(49.92px, 3.52cqi, 83.2px);
  gap: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.ac-lean-head {
  position: relative;
  z-index: 3;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.ac-head-title {
  display: inline-flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-width: 0;
}
.ac-top-stack {
  position: absolute;
  top: clamp(3.9px, 0.27cqi, 6.5px);
  right: clamp(7.8px, 0.55cqi, 13px);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(11.7px, 0.82cqi, 19.5px);
}
.ac-more-button {
  flex: 0 0 auto;
}
.ac-power-floating {
  width: clamp(35.88px, 2.53cqi, 59.8px);
  height: clamp(35.88px, 2.53cqi, 59.8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.66);
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.ac-power-floating bruno-icon {
  --mdc-icon-size: 34px;
}
.ac-power-floating:hover, .ac-power-floating:focus-visible {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.045);
}
.ac-power-floating.is-active {
  color: rgba(150,205,255,0.98);
  background: rgba(96,165,250,0.075);
  box-shadow: 0 0 18px rgba(44,175,255,0.22);
}
.ac-power-floating:active {
  transform: translateY(1px);
}
.ac-power-floating:disabled {
  opacity: 0.42;
  cursor: default;
}
.ac-lean-mid {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) 2px;
}
.ac-ring {
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.ac-ring .icg-shell {
  width: min(94%, clamp(260.52px, 18.35cqi, 434.2px));
  /* ANTERIOR (rollback): translateY(3px) scale(1.06) deslocava a caixa toda,
     inclusive margens e controles vizinhos. O diâmetro cresce no SVG. */
  transform: translateY(3px);
}
.ac-lean-foot {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
  align-items: end;
}
.ac-control-wrap {
  position: relative;
  min-width: 0;
}
.ac-action {
  width: 100%;
  min-width: 0;
  min-height: clamp(39px, 2.75cqi, 65px);
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  padding: clamp(5.46px, 0.38cqi, 9.1px) clamp(7.8px, 0.55cqi, 13px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
.ac-action:hover, .ac-action.is-open {
  background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
}
.ac-action:disabled {
  opacity: 0.42;
  cursor: default;
}
.ac-action-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.82);
  flex: 0 0 auto;
}
.ac-action:hover .ac-action-icon, .ac-action.is-open .ac-action-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
}
.ac-action-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-control, 23px);
}
.ac-action-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ac-action-text small {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 650;
  color: rgba(255,255,255,0.58);
}
.ac-action-text strong {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ac-popover {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + clamp(6.24px, 0.44cqi, 10.4px));
  z-index: 12;
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660)) );
  border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
  box-shadow: var(--bruno-liquid-popup-shadow, inset 0 1px 0 rgba(255,255,255,0.100), 0 18px 36px rgba(0,0,0,0.300) );
  backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
  -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
}
.ac-popover-option {
  min-width: 0;
  min-height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  grid-template-columns: clamp(14.04px, 0.99cqi, 23.4px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 9px;
  border: 0;
  background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
  color: rgba(255,255,255,0.82);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 750;
  text-align: left;
  cursor: pointer;
}
.ac-popover-option bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
  color: rgba(255,255,255,0.72);
}
.ac-popover-option span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-popover-option:hover, .ac-popover-option.is-active {
  color: rgba(255,255,255,0.98);
  background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
}
.ac-popover-option:hover bruno-icon, .ac-popover-option.is-active bruno-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
}
.ac-popover-option:disabled {
  opacity: 0.48;
  cursor: default;
}
.room-sidebar {
  grid-area: frame-left;
  position: relative;
  z-index: 3;
  isolation: isolate;
  align-self: center;
  justify-self: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  overflow: visible;
  width: clamp(45.24px, 3.19cqi, 75.4px);
  height: auto;
  max-height: calc(100% - clamp(4.68px, 0.33cqi, 7.8px));
  grid-auto-rows: clamp(31.2px, 2.2cqi, 52px);
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(6.24px, 0.44cqi, 10.4px);
}
.room-nav-button {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) 2px clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: 13px;
  color: rgba(255,255,255,0.60);
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  transition: background 160ms ease, color 160ms ease;
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  min-width: clamp(31.2px, 2.2cqi, 52px);
  min-height: clamp(31.2px, 2.2cqi, 52px);
  max-width: clamp(31.2px, 2.2cqi, 52px);
  max-height: clamp(31.2px, 2.2cqi, 52px);
}
.hero-stage {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-main);
  border-radius: 0;
  overflow: visible;
}
.hero-content {
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: clamp(11.7px, 0.82cqi, 19.5px) clamp(14.04px, 0.99cqi, 23.4px) clamp(10.92px, 0.77cqi, 18.2px);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.hero-headline {
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  justify-self: start;
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
}
.hero-date-line {
  margin: 0 0 clamp(8.58px, 0.6cqi, 14.3px);
  color: rgba(255,255,255,0.54);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: clamp(4.68px, 0.33cqi, 7.8px);
}
.hero-clock {
  line-height: 0.96;
  font-weight: 220;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 10px 32px rgba(0,0,0,0.28);
  margin-top: clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(clamp(42.12px, 2.97cqi, 70.2px), 7.1vh, clamp(57.72px, 4.07cqi, 96.2px));
}
.scene-pill {
  width: fit-content;
  max-width: min(clamp(195px, 13.74cqi, 325px), 100%);
  min-height: clamp(23.4px, 1.65cqi, 39px);
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
  display: inline-flex;
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 24px rgba(0,0,0,0.20);
}
.scene-pill bruno-icon {
  --mdc-icon-size: 15px;
  color: rgb(255,205,95);
}
.curtain-dock {
  --curtain-gold-rgb: var(--bruno-liquid-warm-accent, 242,194,102);
  --curtain-gold: rgb(var(--curtain-gold-rgb));
  grid-row: 3;
  grid-column: 1 / -1;
  align-self: end;
  display: grid;
  grid-template-columns: 1fr;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  width: min(clamp(405.6px, 28.57cqi, 676px), 100%);
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.curtain-action-button {
  width: clamp(59.28px, 4.18cqi, 98.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(3.9px, 0.27cqi, 6.5px);
  padding: 0 clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.15));
  background: var(--bruno-liquid-control-background, linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)), rgba(255,255,255,0.030) );
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
  min-width: clamp(60.84px, 4.29cqi, 101.4px);
}
.status-rail {
  display: grid;
  gap: 0;
  padding: 0;
  min-height: clamp(49.92px, 3.52cqi, 83.2px);
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.status-item {
  display: grid;
  align-items: center;
  min-width: 0;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  border-right: 1px solid rgba(255,255,255,0.08);
  grid-template-columns: auto minmax(0, 1fr);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
}
.status-chevron {
  --mdc-icon-size: 17px;
  color: rgba(255,255,255,0.58);
  display: none;
}
.lights-card .module-head {
  margin-bottom: 0;
  align-items: start;
  min-height: clamp(31.2px, 2.2cqi, 52px);
}
.lights-title-row {
  display: flex;
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
}
.zone-toggle, .media-tabs {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px;
  background: rgba(255,255,255,0.065);
  border: 1px solid rgba(255,255,255,0.11);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}
.zone-toggle button {
  min-height: clamp(23.4px, 1.65cqi, 39px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.62);
  background: transparent;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 900;
}
.head-actions .chip-button {
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.chip-button-icon {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.chip-button-icon bruno-icon {
  --mdc-icon-size: 15px;
}
.zone-toggle button.is-active {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.12);
}
.lights-single-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(10.92px, 0.77cqi, 18.2px) clamp(7.8px, 0.55cqi, 13px);
}
.lights-zone-rail {
  position: relative;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  justify-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: clamp(7.02px, 0.49cqi, 11.7px) clamp(5.46px, 0.38cqi, 9.1px);
  overflow: hidden;
  border-radius: var(--room-cell-radius);
  color: rgba(255,255,255,0.74);
  background: linear-gradient(145deg, rgba(255,255,255,0.072), rgba(255,255,255,0.026)), rgba(8,14,26,0.50);
  border: 1px solid rgba(255,224,160,0.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(255,200,100,0.045), 0 12px 26px rgba(0,0,0,0.20);
  backdrop-filter: blur(22px) saturate(1.34);
  -webkit-backdrop-filter: blur(22px) saturate(1.34);
  display: grid;
}
.lights-groups, .lights-divider, .light-group-label {
  display: none;
}
.light-tile {
  position: relative;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-areas: "icon title" "icon status";
  align-items: center;
  align-content: center;
  text-align: left;
  border-radius: var(--room-cell-radius);
  color: rgba(255,255,255,0.86);
  background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.055));
  border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.11));
  box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.08));
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  min-height: 0;
  grid-template-columns: clamp(46.8px, 3.3cqi, 78px) minmax(0, 1fr);
  column-gap: clamp(8.58px, 0.6cqi, 14.3px);
  padding: clamp(8.58px, 0.6cqi, 14.3px) clamp(9.36px, 0.66cqi, 15.6px);
}
.light-icon {
  grid-area: icon;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  --light-color: var(--state-icon-color, #9da0a2);
  color: rgba(255,255,255,0.74);
  width: clamp(46.8px, 3.3cqi, 78px);
  height: clamp(46.8px, 3.3cqi, 78px);
}
.light-tile strong {
  grid-area: title;
  min-width: 0;
  align-self: end;
  line-height: 1.12;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(11.54px, 0.81cqi, 19.24px);
}
.cameras-card.cameras-card-controls {
  padding: 0;
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
}
.cameras-head {
  flex: 0 0 auto;
}
.camera-settings-button.is-active {
  color: rgba(255,255,255,0.86);
  background: rgba(255,255,255,0.055);
}
.camera-pip-stage {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  min-height: 0;
  height: 100%;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.camera-feed {
  height: 100%;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}
.camera-primary-feed {
  width: 100%;
}
.camera-pip-feed {
  position: absolute;
  z-index: 5;
  right: clamp(15.6px, 1.1cqi, 26px);
  bottom: clamp(17.16px, 1.21cqi, 28.6px);
  width: min(36%, clamp(117px, 8.24cqi, 195px));
  height: clamp(67.08px, 4.73cqi, 111.8px);
  border-radius: 13px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.10);
}
.camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(59.28px, 4.18cqi, 98.8px);
}
.camera-pip-feed .camera-row-copy {
  left: clamp(7.02px, 0.49cqi, 11.7px);
  right: clamp(7.02px, 0.49cqi, 11.7px);
  bottom: clamp(6.24px, 0.44cqi, 10.4px);
  gap: 0;
}
.camera-pip-feed .camera-row-copy strong {
  max-width: 100%;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.camera-pip-feed .camera-row-copy span {
  display: none;
}
.camera-pip-feed::after {
  background: linear-gradient(180deg, rgba(4,8,16,0.04), rgba(4,8,16,0.52));
}
.camera-state-surface {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  align-content: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(12.48px, 0.88cqi, 20.8px);
  color: rgba(255,255,255,0.78);
  text-align: center;
  background: radial-gradient(circle at 50% 42%, rgba(96,165,250,0.12), transparent 58%), rgba(5,8,14,0.76);
  backdrop-filter: blur(8px) saturate(0.9);
  -webkit-backdrop-filter: blur(8px) saturate(0.9);
}
.camera-state-surface bruno-icon {
  display: none;
  --mdc-icon-size: 32px;
  color: rgba(255,255,255,0.64);
}
.camera-state-surface span {
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 760;
  line-height: 1.1;
}
.camera-pip-feed .camera-state-surface {
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(6.24px, 0.44cqi, 10.4px);
}
.camera-pip-feed .camera-state-surface bruno-icon {
  --mdc-icon-size: 22px;
}
.camera-pip-feed .camera-state-surface span {
  font-size: clamp(7.02px, 0.49cqi, 11.7px);
}
.camera-feed.is-private .camera-row-image img, .camera-feed.is-unavailable .camera-row-image img {
  opacity: 0;
}
.live-dot.is-muted {
  background: rgba(255,255,255,0.34);
  box-shadow: none;
}
.camera-control-strip {
  position: absolute;
  left: clamp(7.8px, 0.55cqi, 13px);
  right: clamp(7.8px, 0.55cqi, 13px);
  bottom: clamp(7.8px, 0.55cqi, 13px);
  z-index: 7;
  min-height: clamp(45.24px, 3.19cqi, 75.4px);
  display: grid;
  align-items: stretch;
  padding: clamp(3.12px, 0.22cqi, 5.2px) 0;
  border: 0;
  border-radius: 0;
  background: linear-gradient(180deg, rgba(3,7,13,0.08), rgba(3,7,13,0.40)), rgba(6,8,12,0.18);
  backdrop-filter: blur(10px) saturate(0.95);
  -webkit-backdrop-filter: blur(10px) saturate(0.95);
}
.camera-controls {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}
.camera-control {
  position: relative;
  min-width: 0;
  min-height: clamp(39px, 2.75cqi, 65px);
  display: grid;
  grid-template-columns: clamp(14.04px, 0.99cqi, 23.4px) auto clamp(21.84px, 1.54cqi, 36.4px);
  align-items: center;
  justify-content: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255,255,255,0.62);
  cursor: pointer;
  text-align: left;
  transition: color 160ms ease, background 160ms ease, opacity 160ms ease;
}
.camera-control + .camera-control::before {
  content: "";
  position: absolute;
  left: 0;
  top: clamp(8.58px, 0.6cqi, 14.3px);
  bottom: clamp(8.58px, 0.6cqi, 14.3px);
  width: 1px;
  background: rgba(255,255,255,0.105);
}
.camera-control:hover, .camera-control:focus-visible {
  color: rgba(255,255,255,0.90);
  background: rgba(255,255,255,0.036);
  outline: none;
}
.camera-control:focus-visible {
  box-shadow: inset 0 0 0 1px rgba(138,196,255,0.42);
}
.camera-control bruno-icon {
  --mdc-icon-size: 17px;
}
.camera-control-label {
  min-width: 0;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 760;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.camera-control-switch {
  position: relative;
  justify-self: start;
  width: clamp(20.28px, 1.43cqi, 33.8px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.30);
  transition: background 160ms ease, box-shadow 160ms ease;
}
.camera-control-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: clamp(6.24px, 0.44cqi, 10.4px);
  height: clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 50%;
  background: rgba(255,255,255,0.74);
  box-shadow: 0 1px 3px rgba(0,0,0,0.30);
  transition: transform 160ms ease, background 160ms ease;
}
.camera-control.is-on {
  color: rgba(218,248,230,0.94);
}
.camera-control.is-on .camera-control-switch {
  background: rgba(46,231,122,0.58);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.18), 0 0 8px rgba(46,231,122,0.18);
}
.camera-control.is-on .camera-control-switch::after {
  transform: translateX(12px);
  background: rgba(255,255,255,0.96);
}
.camera-control.is-unavailable, .camera-control:disabled {
  opacity: 0.34;
  cursor: not-allowed;
}
.camera-row-copy {
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  left: clamp(10.92px, 0.77cqi, 18.2px);
  right: clamp(10.92px, 0.77cqi, 18.2px);
  bottom: clamp(10.92px, 0.77cqi, 18.2px);
  transition: bottom 220ms ease;
}
.camera-pip-stage.is-controls-open .camera-primary-feed .camera-row-copy {
  bottom: clamp(59.28px, 4.18cqi, 98.8px);
}
.camera-row-copy strong {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  line-height: 1.08;
}
.media-hub-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.media-hub-head {
  align-items: start;
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  margin-bottom: 0;
}
.media-tabs {
  gap: 2px;
  max-width: 62%;
}
.media-tabs button {
  min-width: 0;
  min-height: clamp(23.4px, 1.65cqi, 39px);
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: clamp(3.9px, 0.27cqi, 6.5px);
  padding: 3px clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  color: rgba(255,255,255,0.58);
  background: transparent;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 900;
}
.media-tabs button.is-selected {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.12);
}
.media-tabs small {
  grid-column: 2;
  max-width: clamp(51.48px, 3.63cqi, 85.8px);
  color: rgba(255,255,255,0.46);
  font-size: clamp(6.24px, 0.44cqi, 10.4px);
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.source-dot {
  grid-row: 1 / 3;
  width: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: 50%;
  background: rgba(255,255,255,0.24);
}
.media-tabs button.is-source-active .source-dot {
  background: #2ee77a;
  box-shadow: 0 0 10px rgba(46,231,122,0.52);
}
.media-hub-body {
  min-height: 0;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(clamp(145.08px, 10.22cqi, 241.8px), 0.86fr) minmax(0, 1fr);
  grid-template-rows: minmax(clamp(160.68px, 11.32cqi, 267.8px), 1fr);
  grid-template-areas: "visual content";
  align-items: stretch;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.media-visual {
  grid-area: visual;
  position: relative;
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  color: rgba(255,255,255,0.22);
  background: radial-gradient(circle at 52% 34%, rgba(96,165,250,0.15), transparent 54%), rgba(5,10,20,0.74);
  border: 1px solid rgba(255,255,255,0.10);
}
.media-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-standby-image {
  position: static !important;
  inset: auto !important;
  width: 92% !important;
  height: 92% !important;
  object-fit: contain !important;
  opacity: 0.96;
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
}
.media-tv-standby {
  width: 96% !important;
  height: 86% !important;
}
.media-spotify-standby {
  width: 72% !important;
  height: 78% !important;
}
.media-visual bruno-icon {
  --mdc-icon-size: 64px;
}
.media-hub-content {
  grid-area: content;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: clamp(31.2px, 2.2cqi, 52px) minmax(clamp(95.16px, 6.7cqi, 158.6px), 1fr) auto;
  align-content: stretch;
  gap: clamp(8.58px, 0.6cqi, 14.3px);
}
.media-ps5-image {
  position: static !important;
  width: 108% !important;
  height: 100% !important;
  object-fit: contain !important;
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.42));
}
.media-details {
  grid-area: auto;
  min-width: 0;
  min-height: clamp(31.2px, 2.2cqi, 52px);
  display: grid;
  grid-template-rows: clamp(15.6px, 1.1cqi, 26px) clamp(12.48px, 0.88cqi, 20.8px);
  align-content: start;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding-top: 1px;
}
.media-details strong {
  min-width: 0;
  color: white;
  font-size: clamp(13.26px, 0.93cqi, 22.1px);
  line-height: 1.08;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details small, .media-details em {
  min-width: 0;
  color: var(--text-soft);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  line-height: 1.25;
  font-style: normal;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details em {
  color: rgba(255,255,255,0.48);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
}
.media-action-stack {
  grid-area: auto;
  --media-action-size: 55px;
  display: grid;
  align-content: center;
  align-self: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
}
.media-primary-actions, .media-secondary-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, var(--media-action-size));
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}
.media-primary-actions.is-wide {
  grid-template-columns: minmax(0, 1fr) var(--media-action-size);
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.media-primary-actions.is-wide .primary-button {
  min-height: var(--media-action-size);
  border-radius: var(--bruno-liquid-control-radius, 14px);
}
.media-action-button, .media-action-spacer, .media-identity-cell {
  width: var(--media-action-size);
  height: var(--media-action-size);
}
.media-action-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  color: rgba(255,255,255,0.82);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.media-action-button bruno-icon {
  --mdc-icon-size: 20px;
}
.media-action-button.is-main {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%), linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58)) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.22), 0 0 22px rgba(96,165,250,0.24) );
}
.media-action-button.is-tool {
  color: rgba(210,245,230,0.96);
  background: var(--bruno-liquid-control-green-background, radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%), rgba(255,255,255,0.075) );
  border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
  box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.media-action-button:disabled {
  opacity: 0.42;
  cursor: default;
}
.media-action-spacer {
  display: block;
  pointer-events: none;
  visibility: hidden;
}
.media-identity-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: rgba(210,222,236,0.58);
}
.media-identity-cell.is-active {
  color: rgba(255,255,255,0.96);
}
.tpl-media-icon {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: block;
  filter: drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.media-identity-cell.is-active .tpl-media-icon {
  filter: drop-shadow(0 0 12px rgba(96,190,255,0.34)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.tpl-media-icon svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
.tpl-media-icon svg g, .tpl-media-icon svg path {
  stroke-width: 0.67;
}
.tpl-media-icon.icon-spotify.is-active {
  color: #1ed760;
  filter: drop-shadow(0 0 12px rgba(46,231,122,0.36)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.media-image-button {
  background: rgba(255,255,255,0.07);
}
.media-button-art {
  position: absolute;
  inset: 0;
  background-image: var(--media-app-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.media-image-button::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
}
.media-hub-extra {
  grid-area: auto;
  min-width: 0;
  align-self: end;
}
.media-extra-info {
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 12px;
  color: var(--text-soft);
  background: rgba(255,255,255,0.052);
  border: 1px solid rgba(255,255,255,0.10);
}
.media-extra-info strong {
  color: rgba(255,255,255,0.88);
  text-align: right;
}
.media-hub-card.mh-accordion {
  position: relative;
  padding: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
  border-radius: var(--bruno-liquid-card-radius, 18px);
  background: var(--bruno-liquid-surface-off-background, linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)), rgba(9,11,15,0.105) );
  border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145));
  backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
}
.media-hub-card.mh-accordion::before {
  opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10);
}
.media-hub-card.mh-accordion::after {
  display: var(--bruno-subview-card-edge-display, none);
}
.mh-head {
  position: relative;
  z-index: 1;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.mh-head-title {
  display: inline-flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-width: 0;
}
.mh-menu {
  width: clamp(23.4px, 1.65cqi, 39px);
  height: clamp(23.4px, 1.65cqi, 39px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: rgba(255,255,255,0.52);
  background: transparent;
}
.mh-menu bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
}
.media-hub-card .mh-menu.is-active {
  color: rgba(255,255,255,0.82);
  background: rgba(255,255,255,0.072);
}
.mh-menu:active {
  background: rgba(255,255,255,0.08);
}
.mh-overflow-panel {
  position: absolute;
  z-index: 5;
  top: clamp(32.76px, 2.31cqi, 54.6px);
  right: clamp(7.8px, 0.55cqi, 13px);
  width: min(clamp(218.4px, 15.38cqi, 364px), calc(100% - clamp(15.6px, 1.1cqi, 26px)));
  padding: clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: linear-gradient(180deg, rgba(34,31,30,0.72), rgba(12,13,16,0.66));
  border: 1px solid rgba(255,255,255,0.115);
  box-shadow: 0 18px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
  -webkit-backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
}
.mh-overflow-item {
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) clamp(26.52px, 1.87cqi, 44.2px) clamp(26.52px, 1.87cqi, 44.2px);
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(3.12px, 0.22cqi, 5.2px) clamp(3.9px, 0.27cqi, 6.5px);
}
.mh-overflow-icon {
  width: clamp(23.4px, 1.65cqi, 39px);
  height: clamp(23.4px, 1.65cqi, 39px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.86);
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.075);
}
.mh-overflow-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
}
.mh-overflow-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mh-overflow-copy strong {
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.92);
}
.mh-overflow-copy small {
  min-width: 0;
  font-size: clamp(8.19px, 0.58cqi, 13.65px);
  line-height: 1.1;
  font-weight: 650;
  color: rgba(255,255,255,0.54);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-overflow-action {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: rgba(255,255,255,0.72);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.075);
}
.mh-overflow-action bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
}
.mh-overflow-action.is-active {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
  border-color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.24);
  background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.075);
}
.mh-overflow-action:disabled {
  opacity: 0.42;
  cursor: default;
}
.mh-sources {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.mh-source {
  position: relative;
  flex: 0 0 42px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: var(--bruno-liquid-band-background, rgba(255,255,255,0.010));
  border: var(--bruno-liquid-band-border, 1px solid rgba(255,255,255,0.035));
  box-shadow: var(--bruno-liquid-band-shadow, none);
  transition: flex-basis 260ms cubic-bezier(0.2, 0.8, 0.2, 1), flex-grow 260ms cubic-bezier(0.2, 0.8, 0.2, 1), background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
  will-change: flex-basis, flex-grow, background, border-color;
}
.mh-source.is-open {
  flex: 1 1 0;
  background: var(--bruno-liquid-band-open-background, linear-gradient(180deg, rgba(255,255,255,0.044), rgba(255,255,255,0.012) 54%, rgba(255,255,255,0.018)), rgba(9,11,15,0.052) );
  border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
  box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
}
.mh-source.is-switching {
  animation: mh-source-open 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.mh-source-head {
  --mh-indent: 26px;
  flex: 0 0 42px;
  height: clamp(32.76px, 2.31cqi, 54.6px);
  display: grid;
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, auto) minmax(0, 1fr) clamp(12.48px, 0.88cqi, 20.8px);
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px) 0 clamp(10.92px, 0.77cqi, 18.2px);
  background: transparent;
  text-align: left;
  transition: flex-basis 220ms ease, height 220ms ease;
}
.mh-source.is-open .mh-source-head {
  flex: 0 0 48px;
  height: clamp(37.44px, 2.64cqi, 62.4px);
  align-items: center;
}
.mh-src-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
  color: rgba(255,255,255,0.6);
  background: transparent;
  border: 0;
}
.mh-icon-spotify {
  color: rgba(255,255,255,0.66);
}
.mh-source.is-active .mh-src-icon, .mh-source.is-active .mh-icon-spotify {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-src-name {
  min-width: 0;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 800;
  line-height: 1;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-source.is-open .mh-src-name {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
}
.mh-src-summary {
  min-width: 0;
  justify-self: end;
  max-width: 100%;
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 650;
  color: rgba(255,255,255,0.50);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-source.is-open .mh-src-summary {
  display: none;
}
.mh-src-chevron {
  --mdc-icon-size: 18px;
  color: rgba(255,255,255,0.4);
}
.mh-source.is-open .mh-src-chevron {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-source-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(clamp(131.04px, 9.23cqi, 218.4px), 40%, clamp(202.8px, 14.29cqi, 338px));
  gap: clamp(10.92px, 0.77cqi, 18.2px);
  padding: 2px clamp(12.48px, 0.88cqi, 20.8px) clamp(10.92px, 0.77cqi, 18.2px);
}
.mh-source.is-switching .mh-source-body {
  opacity: 0;
  transform: translateY(5px);
  animation: mh-source-body-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 55ms both;
}
.mh-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.mh-source.is-switching .mh-left {
  animation: mh-source-content-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 75ms both;
}
.mh-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: clamp(20.28px, 1.43cqi, 33.8px);
}
.mh-info small {
  display: block;
  font-size: clamp(10.53px, 0.74cqi, 17.55px);
  font-weight: 750;
  line-height: 1.15;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-info em {
  display: block;
  font-style: normal;
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-progress-wrap {
  width: min(100%, 94%);
  margin-top: clamp(3.9px, 0.27cqi, 6.5px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
}
.mh-progress-time {
  font-size: clamp(7.41px, 0.52cqi, 12.35px);
  line-height: 1;
  font-weight: 700;
  color: rgba(255,255,255,0.48);
  font-variant-numeric: tabular-nums;
}
.mh-progress {
  height: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.14);
  overflow: hidden;
}
.mh-progress span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(var(--bruno-liquid-warm-accent, 242,194,102)), rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.88));
}
.mh-controls {
  min-width: 0;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.mh-vol {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  min-height: clamp(24.96px, 1.76cqi, 41.6px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  color: var(--text-soft);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, none);
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
}
.mh-vol bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-status, 15px);
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol-label {
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  white-space: nowrap;
  color: rgba(255,255,255,0.7);
}
.mh-vol input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  accent-color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
  box-shadow: 0 0 8px rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.5);
  cursor: pointer;
}
.mh-vol input[type="range"]::-moz-range-thumb {
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border: 0;
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol.is-disabled {
  opacity: 0.4;
}
.mh-btn-row {
  display: grid;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.mh-btn-row-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.mh-btn-row-4 {
  grid-template-columns: repeat(3, minmax(0, 1fr)) clamp(32.76px, 2.31cqi, 54.6px);
}
.mh-btn {
  min-height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, none);
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  white-space: nowrap;
  overflow: hidden;
}
.mh-btn.is-icon {
  padding: 0;
  gap: 0;
}
.mh-btn bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-control, 23px);
  flex: 0 0 auto;
  color: rgba(255,255,255,0.9);
}
.mh-btn:hover {
  background: rgba(255,255,255,0.052);
}
.mh-btn span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-btn:active {
  transform: translateY(1px);
}
.mh-btn:disabled {
  opacity: 0.42;
  cursor: default;
}
.mh-controls > .mh-btn.is-main {
  align-self: flex-start;
  width: 50%;
  min-width: clamp(109.2px, 7.69cqi, 182px);
  min-height: clamp(31.2px, 2.2cqi, 52px);
}
.mh-btn.is-main {
  color: rgba(255,255,255,0.94);
  background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
}
.mh-btn.is-main bruno-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.82);
}
.mh-btn.is-plus {
  padding: 0;
  color: rgba(255,255,255,0.72);
}
.mh-art {
  position: relative;
  min-width: 0;
  align-self: stretch;
  height: 100%;
  overflow: hidden;
  background: transparent;
  border: 0;
}
.mh-source.is-switching .mh-art {
  animation: mh-source-art-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) 85ms both;
}
.mh-art img {
  position: absolute;
  inset: clamp(4.68px, 0.33cqi, 7.8px) 0;
  width: 100%;
  height: calc(100% - clamp(9.36px, 0.66cqi, 15.6px));
  object-fit: contain;
}
.mh-art bruno-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  --mdc-icon-size: 56px;
  color: rgba(255,255,255,0.22);
}
.mh-art.is-standby img {
  filter: none;
}
.mh-art.is-cover img {
  object-fit: cover;
}
.mh-art-square.is-cover img {
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: auto;
  height: calc(100% - clamp(7.8px, 0.55cqi, 13px));
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: none;
}
.mh-art-wide.is-cover img {
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 11px;
  box-shadow: none;
}
@keyframes mh-source-open {
from {
  flex-grow: 0;
  flex-basis: clamp(32.76px, 2.31cqi, 54.6px);
  border-color: var(--bruno-liquid-band-border-color, rgba(255,255,255,0.040));
  box-shadow: var(--bruno-liquid-band-shadow, none);
}
to {
  flex-grow: 1;
  flex-basis: 0;
  border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
  box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
}
}
@keyframes mh-source-body-in {
from {
  opacity: 0;
  transform: translateY(5px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
}
@keyframes mh-source-content-in {
from {
  opacity: 0;
  transform: translateY(4px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
}
@keyframes mh-source-art-in {
from {
  opacity: 0;
  transform: translateY(4px) scale(0.985);
}
to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
}
@media (prefers-reduced-motion: reduce) {
.mh-source, .mh-source-head, .mh-source-body, .mh-left, .mh-art, .mh-btn {
  transition: none !important;
  animation: none !important;
}
.mh-source-body {
  opacity: 1;
  transform: none;
}
}
.ac-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ac-head {
  margin-bottom: 0;
}
.power-button {
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  color: rgba(255,255,255,0.74);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.13));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.09));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.power-button.is-active {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%), rgba(38,92,138,0.38) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.power-button bruno-icon {
  --mdc-icon-size: 18px;
}
.ac-body {
  height: 100%;
  min-height: 0;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto auto auto auto;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  align-content: space-between;
}
.temperature-slider {
  min-width: 0;
  width: 100%;
  display: block;
  align-items: center;
  padding: 0;
  background: transparent;
  border: 0;
  margin-bottom: 3px;
}
.climate-stepper {
  display: grid;
  grid-template-columns: clamp(32.76px, 2.31cqi, 54.6px) minmax(0, 1fr) clamp(32.76px, 2.31cqi, 54.6px);
  align-items: center;
  overflow: hidden;
  margin-bottom: clamp(3.12px, 0.22cqi, 5.2px);
}
.ac-visual {
  position: relative;
  min-height: clamp(234px, 16.48cqi, 390px);
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  gap: clamp(12.48px, 0.88cqi, 20.8px);
  padding: 0 0 2px;
}
.ac-image-shell {
  position: relative;
  width: 100%;
  height: clamp(90.48px, 6.37cqi, 150.8px);
  margin: -2px 0 0;
  display: grid;
  place-items: start center;
  overflow: visible;
}
.ac-unit-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center top;
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.38));
  opacity: 1;
  transform: translateY(0);
  transition: opacity 260ms ease, transform 320ms ease, filter 260ms ease;
}
.ac-unit-image-on {
  opacity: 0;
  transform: translateY(2px);
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.38)) drop-shadow(0 0 18px rgba(110,200,255,0.12));
}
.ac-image-shell.is-on .ac-unit-image-off {
  opacity: 0;
  transform: translateY(-1px);
}
.ac-image-shell.is-on .ac-unit-image-on {
  opacity: 1;
  transform: translateY(0);
}
.ac-image-fallback {
  display: none;
  --mdc-icon-size: 84px;
  place-self: center;
  color: rgba(226,232,240,0.46);
  filter: drop-shadow(0 14px 22px rgba(0,0,0,0.32));
}
.ac-image-shell.is-fallback .ac-unit-image {
  display: none;
}
.ac-image-shell.is-fallback .ac-image-fallback {
  display: block;
}
.icg-root {
  width: 100%;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
}
.icg-shell {
  width: min(100%, clamp(639.6px, 45.05cqi, 1066px));
  aspect-ratio: 16 / 10;
  position: relative;
  background: transparent;
}
.icg-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  display: block;
  background: transparent;
}
.icg-track-shadow {
  fill: none;
  stroke: rgba(0, 0, 0, 0.34);
  stroke-width: 16;
  stroke-linecap: round;
}
.icg-track-muted {
  fill: none;
  stroke: rgba(112, 136, 164, 0.38);
  stroke-width: 8;
  stroke-linecap: round;
}
.icg-active-glow {
  fill: none;
  stroke: url(#icgActiveBlue);
  stroke-width: 18;
  stroke-linecap: round;
  opacity: 0.74;
  filter: url(#icgBlueGlow);
}
.icg-active-arc {
  fill: none;
  stroke: url(#icgActiveBlue);
  stroke-width: 8;
  stroke-linecap: round;
}
.icg-tick {
  stroke-linecap: round;
}
.icg-tick.minor {
  stroke: rgba(145, 176, 214, 0.34);
  stroke-width: 1.2;
}
.icg-tick.medium {
  stroke: rgba(190, 214, 240, 0.50);
  stroke-width: 1.6;
}
.icg-tick.major {
  stroke: rgba(238, 247, 255, 0.88);
  stroke-width: 2.5;
}
.icg-inner-tick {
  stroke: rgba(40, 145, 255, 0.24);
  stroke-width: 1;
  stroke-linecap: round;
}
.icg-label {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(14.04px, 0.99cqi, 23.4px);
  font-weight: 500;
  letter-spacing: 1.4px;
  fill: rgba(224, 235, 248, 0.74);
}
.icg-label.edge {
  font-size: clamp(17.16px, 1.21cqi, 28.6px);
  fill: rgba(230, 240, 252, 0.82);
}
.icg-label.top {
  font-size: clamp(14.82px, 1.04cqi, 24.7px);
  fill: rgba(235, 245, 255, 0.90);
}
.icg-marker-glow {
  fill: rgba(40, 175, 255, 0.28);
  filter: url(#icgBlueGlow);
}
.icg-marker-ring {
  fill: rgba(5, 10, 18, 0.94);
  stroke: rgba(92, 210, 255, 0.98);
  stroke-width: 4;
  filter: url(#icgBlueGlow);
}
.icg-marker-highlight {
  fill: rgba(255, 255, 255, 0.62);
  opacity: 0.62;
}
.icg-center-mode {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 500;
  letter-spacing: 9px;
  fill: rgba(38, 190, 255, 0.96);
  text-transform: uppercase;
}
.icg-center-temp {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(74.88px, 5.27cqi, 124.8px);
  font-weight: 300;
  letter-spacing: -8px;
  fill: rgba(246, 250, 255, 0.98);
  filter: url(#icgTextGlow);
}
.icg-center-sub {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 500;
  letter-spacing: 9px;
  fill: rgba(190, 204, 220, 0.72);
  text-transform: uppercase;
}
.icg-center-line {
  stroke: rgba(36, 195, 255, 0.95);
  stroke-width: 2;
  stroke-linecap: round;
  filter: url(#icgBlueGlow);
}
.icg-ambient {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 500;
  letter-spacing: 1.8px;
  fill: rgba(176, 196, 220, 0.60);
}
.climate-mode-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.fan-mode-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
}
.fan-mode {
  color: rgba(255,255,255,0.74);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  aspect-ratio: 1;
  min-height: 0;
  height: auto;
  padding: 0 clamp(3.12px, 0.22cqi, 5.2px);
}
@media (min-width: 761px) {
.lights-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--lights-dock-bottom, calc(var(--ac-h, 320px) + 7px));
  z-index: 6;
  max-height: calc(100% - var(--lights-dock-bottom, calc(var(--ac-h, 320px) + 7px)));
}
.right-column > .ac-card {
  grid-row: 2;
}
}
.lights-dock-actions {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.lights-card.is-open .lights-dock-chevron {
  transform: rotate(180deg);
}
.lights-card.is-open .lights-body {
  grid-template-rows: 1fr;
}
.lights-body-clip {
  min-height: 0;
  overflow: hidden;
}
.lights-scroll::-webkit-scrollbar {
  width: 0;
}
.light-section + .light-section {
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
  padding-top: clamp(9.36px, 0.66cqi, 15.6px);
  border-top: 1px solid rgba(255,255,255,0.10);
}
.section-head .zone-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.section-head .zone-id strong {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 700;
  line-height: 1.1;
}
.section-head .zone-id small {
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  color: rgba(255,255,255,0.46);
}
.section-head .zone-off {
  padding: 0 2px;
  border: 0;
  background: none;
  font: inherit;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 700;
  color: rgba(255,196,90,0.92);
  cursor: pointer;
}
.lights-substatus {
  padding: 0 2px clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  color: rgba(255,255,255,0.46);
}
.light-cell.is-wide {
  grid-column: 1 / -1;
}
.light-cell.is-on .lc-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.light-cell.is-on .lc-switch {
  background: rgba(255,196,90,0.55);
  border-color: rgba(255,196,90,0.65);
}
@media (prefers-reduced-motion: reduce) {
.lights-body, .lights-dock-chevron, .lc-switch, .lc-knob {
  transition: none;
}
}
.lights-dock-id {
  display: flex;
  align-items: center;
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.lights-dock-chevron {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: clamp(17.16px, 1.21cqi, 28.6px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  color: rgba(255,255,255,0.55);
}
.lights-dock-chevron bruno-icon {
  --mdc-icon-size: 20px;
}
.lights-dock {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
}
.lights-scroll {
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.section-head {
  display: grid;
  align-items: center;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(6.24px, 0.44cqi, 10.4px);
}
.lights-card.is-open .lights-dock {
  border-bottom: 1px solid rgba(255,255,255,0.10);
}
.light-cell {
  display: grid;
  align-items: center;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr) auto;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  min-height: clamp(46.8px, 3.3cqi, 78px);
  border: 1px solid var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
  border-radius: 0;
}
.lc-icon {
  display: grid;
  place-items: center start;
  --light-color: #9da0a2;
  color: var(--light-color);
  width: clamp(15.6px, 1.1cqi, 26px);
}
.lc-name {
  min-width: 0;
  font-weight: 600;
  color: rgba(255,255,255,0.90);
  text-overflow: ellipsis;
  font-size: clamp(10.53px, 0.74cqi, 17.55px);
  line-height: 1.15;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.lc-switch {
  box-sizing: border-box;
  padding: 0 2px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.13);
  display: grid;
  align-items: center;
  transition: background 180ms ease, border-color 180ms ease;
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(14.82px, 1.04cqi, 24.7px);
}
.lc-knob {
  border-radius: 50%;
  background: rgba(255,255,255,0.92);
  transform: translateX(0);
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
}
.light-cell.is-on .lc-knob {
  transform: translateX(12px);
}
.lights-card {
  grid-template-rows: auto minmax(0, 1fr);
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}
.lights-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: 0fr;
  gap: 0;
  transition: grid-template-rows 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  justify-items: stretch;
}
.lights-body-clip, .lights-scroll, .light-section, .light-grid {
  width: 100%;
  box-sizing: border-box;
}
.light-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: calc(100% - clamp(15.6px, 1.1cqi, 26px));
  margin-inline: 10px;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
}
.light-cell.has-rule-top {
  border-top: 1px solid rgba(255,255,255,0.075);
  border-top-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
}
.light-cell.has-rule-left {
  border-left: 1px solid rgba(255,255,255,0.075);
  border-left-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
}
@media (max-width: 1180px) {
:host {
  height: auto;
  min-height: 100vh;
  overflow: visible;
}
.room-subview {
  height: auto;
  min-height: 100vh;
  overflow: auto;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  grid-template-areas: "left" "right";
  padding: clamp(7.8px, 0.55cqi, 13px);
}
.room-sidebar {
  display: none;
}
.subview-topbar, .subview-footer {
  display: none;
}
.left-column {
  height: auto;
  grid-template-rows: minmax(clamp(265.2px, 18.68cqi, 442px), 42vh) minmax(clamp(210.6px, 14.84cqi, 351px), 34vh);
}
.right-column {
  height: auto;
  grid-template-rows: auto auto;
}
.right-control-grid {
  grid-template-columns: minmax(0, 1fr) minmax(clamp(218.4px, 15.38cqi, 364px), 0.72fr);
  grid-template-rows: minmax(clamp(184.08px, 12.97cqi, 306.8px), auto) minmax(clamp(234px, 16.48cqi, 390px), auto);
  grid-template-areas: "lights ac" "media ac";
}
.lights-body {
  grid-template-columns: minmax(0, 1fr);
}
.lights-zone-rail {
  display: none;
}
.status-rail {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: clamp(53.04px, 3.74cqi, 88.4px);
}
}
@media (max-width: 760px) {
.room-subview {
  grid-template-rows: auto;
  grid-template-columns: 1fr;
  grid-template-areas: "left" "right";
  padding: clamp(6.24px, 0.44cqi, 10.4px);
}
.left-column {
  grid-template-rows: minmax(clamp(335.4px, 23.63cqi, 559px), auto) minmax(clamp(304.2px, 21.43cqi, 507px), auto);
}
.right-control-grid {
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  grid-template-areas: "lights" "media" "ac";
}
.status-rail {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: auto;
}
.status-item {
  min-height: clamp(45.24px, 3.19cqi, 75.4px);
}
.media-tabs {
  max-width: 100%;
  width: 100%;
  justify-content: space-between;
}
.media-hub-head {
  display: grid;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.media-hub-body {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(clamp(137.28px, 9.67cqi, 228.8px), auto) auto;
  grid-template-areas: "visual" "content";
}
.media-hub-content {
  grid-template-rows: auto auto auto;
}
.camera-list {
  grid-template-columns: 1fr;
}
.lights-title-row, .module-head {
  flex-wrap: wrap;
}
.head-actions {
  width: 100%;
}
.head-actions .chip-button {
  flex: 1 1 0;
}
.curtain-control-row {
  align-items: stretch;
  grid-template-columns: 1fr;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.curtain-status {
  justify-self: start;
}
.curtain-main-actions {
  justify-content: stretch;
}
.curtain-action-button {
  flex: 1 1 0;
  min-width: 0;
}
.ac-visual {
  min-height: clamp(185.64px, 13.08cqi, 309.4px);
}
}
@media (max-width: 800px) {
:host {
  height: auto;
  min-height: 0;
  overflow: visible;
}
}
$ {
  globalThis.BrunoSurfaceMaterial?.subviewStyles?.() || '';
}
`;

/** Bloco condicional "appliances": 18 regras, escopadas por atributo. */
export const SUBVIEW_APPLIANCES_CSS = css`
:host([data-appliances]) .appliances-card {
  grid-area: appliances;
  min-width: 0;
  min-height: 0;
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
  overflow: hidden;
}
:host([data-appliances]) .appliances-head {
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  margin-bottom: 0;
}
:host([data-appliances]) .appliances-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-appliances]) .appliance-tile {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.085);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.055);
  overflow: hidden;
}
:host([data-appliances]) .appliance-tile.is-on {
  border-color: rgba(255,196,90,0.30);
  background: linear-gradient(180deg, rgba(255,196,90,0.10), rgba(255,255,255,0.040));
}
:host([data-appliances]) .appliance-tile.is-muted {
  color: rgba(255,255,255,0.74);
}
:host([data-appliances]) .appliance-more {
  position: absolute;
  top: clamp(5.46px, 0.38cqi, 9.1px);
  right: clamp(5.46px, 0.38cqi, 9.1px);
  z-index: 3;
}
:host([data-appliances]) .appliance-more:disabled {
  opacity: 0.28;
  cursor: default;
}
:host([data-appliances]) .appliance-visual {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px) 2px;
}
:host([data-appliances]) .appliance-visual img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 22px rgba(0,0,0,0.42));
}
:host([data-appliances]) .appliance-visual bruno-icon {
  --mdc-icon-size: 44px;
  color: rgba(255,255,255,0.24);
}
:host([data-appliances]) .appliance-visual img + bruno-icon {
  display: none;
}
:host([data-appliances]) .appliance-visual.is-image-missing img {
  display: none;
}
:host([data-appliances]) .appliance-visual.is-image-missing bruno-icon {
  display: block;
}
:host([data-appliances]) .appliance-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
:host([data-appliances]) .appliance-copy strong {
  min-width: 0;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-appliances]) .appliance-copy small {
  min-width: 0;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1.05;
  font-weight: 700;
  color: rgba(255,255,255,0.52);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-appliances]) .appliance-tile.is-on .appliance-copy small {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
`;

/** Bloco condicional "tvHub": 35 regras, escopadas por atributo. */
export const SUBVIEW_TVHUB_CSS = css`
@media (max-width: 800px) {
:host([data-tvhub]) .content-left, :host([data-tvhub]) .right-column, :host([data-tvhub]) .cams-media-row {
  display: contents;
}
:host([data-tvhub]) .subview-topband {
  order: 0;
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
}
:host([data-tvhub]) .topband-badges {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: visible;
}
:host([data-tvhub]) .topband-badges .tb-badge[data-phone-hide], :host([data-tvhub]) .topband-clock {
  display: none;
}
:host([data-tvhub]) .tb-badge {
  min-width: 0;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr);
  column-gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
}
:host([data-tvhub]) .tb-badge-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
}
:host([data-tvhub]) .tb-badge-sub {
  max-width: 100%;
}
:host([data-tvhub]) .hero-panel {
  order: 10;
  height: auto;
  min-height: 0;
}
:host([data-tvhub]) .hero-panel.is-unconfigured {
  display: none;
}
:host([data-tvhub]) .hero-atmosphere, :host([data-tvhub]) .hero-atmosphere .hero-content {
  height: auto;
  min-height: 0;
}
:host([data-tvhub]) .curtain-control-row {
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-tvhub]) .curtain-status {
  justify-self: start;
}
:host([data-tvhub]) .curtain-main-actions {
  width: 100%;
  justify-content: stretch;
}
:host([data-tvhub]) .curtain-action-button {
  flex: 1 1 0;
  min-width: 0;
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .lights-card {
  order: 20;
  height: auto;
  min-height: 0;
  overflow: visible;
}
:host([data-tvhub]) .lights-card .module-head {
  min-height: 0;
  flex-wrap: wrap;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-tvhub]) .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-tvhub]) .head-actions .chip-button, :host([data-tvhub]) .zone-header {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .lights-zones, :host([data-tvhub]) .zone-lights, :host([data-tvhub]) .office-light-list {
  flex: 0 0 auto;
  max-height: none !important;
  overflow-y: visible !important;
  overscroll-behavior: auto;
}
:host([data-tvhub]) .ac-card.ac-card-lean {
  order: 30;
  height: auto;
  min-height: clamp(280.8px, 19.78cqi, 468px);
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(clamp(171.6px, 12.09cqi, 286px), auto) auto;
  overflow: visible;
}
:host([data-tvhub]) .ac-lean-foot {
  align-items: stretch;
}
:host([data-tvhub]) .ac-action {
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
}
:host([data-tvhub]) .media-hub-card.mh-accordion {
  order: 40;
  height: auto;
  min-height: clamp(257.4px, 18.13cqi, 429px);
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(clamp(216.84px, 15.27cqi, 361.4px), 1fr);
}
:host([data-tvhub]) .media-hub-card.is-unconfigured {
  display: none;
}
:host([data-tvhub]) .mh-source {
  flex-basis: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-source-head {
  flex-basis: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-source-body {
  grid-template-columns: minmax(0, 1fr) clamp(clamp(81.12px, 5.71cqi, 135.2px), 30vw, clamp(115.44px, 8.13cqi, 192.4px));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding-inline: 12px;
}
:host([data-tvhub]) .mh-info {
  padding-left: 0;
}
:host([data-tvhub]) .mh-controls > .mh-btn.is-main {
  width: 100%;
  min-width: 0;
}
:host([data-tvhub]) .mh-menu, :host([data-tvhub]) .mh-btn {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-menu {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .cameras-card.cameras-card-controls {
  order: 50;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px));
}
:host([data-tvhub]) .camera-pip-stage, :host([data-tvhub]) .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-tvhub]) .camera-control {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .subview-footer {
  display: none;
}
}
`;

/** Bloco condicional "ps5": 2 regras, escopadas por atributo. */
export const SUBVIEW_PS5_CSS = css`
@media (max-width: 800px) {
:host([data-ps5]) .camera-pip-feed {
  right: clamp(12.48px, 0.88cqi, 20.8px);
  bottom: clamp(12.48px, 0.88cqi, 20.8px);
  width: clamp(clamp(68.64px, 4.84cqi, 114.4px), 25%, clamp(87.36px, 6.15cqi, 145.6px));
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-ps5]) .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(54.6px, 3.85cqi, 91px);
}
}
`;

/** Bloco condicional "pc": 0 regras, escopadas por atributo. */
export const SUBVIEW_PC_CSS = css`

`;

/** Sobreposicao do comodo sala: 13 regras que divergem da base. */
const SOBREPOSICAO_SALA = css`
:host([data-room='sala']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='sala']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='sala']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='sala']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='sala']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='sala']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='sala']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='sala']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='sala']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='sala']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='sala']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`;

/** Sobreposicao do comodo office: 16 regras que divergem da base. */
const SOBREPOSICAO_OFFICE = css`
:host([data-room='office']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='office']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='office']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='office']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='office']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='office']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='office']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='office']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='office']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
:host([data-room='office']) .mh-btn-row-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
:host([data-room='office']) .office-light-list {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  min-height: 0;
  padding: 0 2px 0 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='office']) .office-light-list::-webkit-scrollbar {
  width: 0;
}
:host([data-room='office']) .office-pc-actions .mh-btn {
  min-width: 0;
}
@media (max-width: 800px) {
:host([data-room='office']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`;

/** Sobreposicao do comodo cozinha: 56 regras que divergem da base. */
const SOBREPOSICAO_COZINHA = css`
:host([data-room='cozinha']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='cozinha']) .room-subview .content-left {
  grid-template-rows: minmax(0, 1fr);
}
:host([data-room='cozinha']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(7px - var(--room-gap, 10px));
}
:host([data-room='cozinha']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='cozinha']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='cozinha']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='cozinha']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='cozinha']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='cozinha']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
:host([data-room='cozinha']) .mh-btn-row-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
:host([data-room='cozinha']) .office-light-list {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  min-height: 0;
  padding: 0 2px 0 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='cozinha']) .office-light-list::-webkit-scrollbar {
  width: 0;
}
:host([data-room='cozinha']) .office-pc-actions .mh-btn {
  min-width: 0;
}
:host([data-room='cozinha']) .room-subview {
  width: 100%;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 0.81fr) minmax(0, 0.81fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr) var(--ac-h, 320px);
  grid-template-areas: "topband topband topband" "hero hero right" "cams appliances appliances";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
  overflow: hidden;
}
:host([data-room='cozinha']) .room-subview .subview-topband {
  grid-area: topband;
}
:host([data-room='cozinha']) .room-subview .hero-panel {
  grid-area: hero;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .right-column {
  grid-area: right;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: max-content;
  align-content: start;
}
:host([data-room='cozinha']) .room-subview .lights-card {
  width: 100%;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .cameras-card {
  grid-area: cams;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .appliances-card {
  grid-area: appliances;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .subview-footer {
  grid-area: bottomband;
}
:host([data-room='cozinha']) .room-subview .hero-atmosphere, :host([data-room='cozinha']) .room-subview .hero-atmosphere .hero-content {
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .hero-atmosphere .hero-content {
  display: block;
  padding: 0;
}
:host([data-room='cozinha']) .room-subview .curtain-dock {
  display: none !important;
}
:host([data-room='cozinha']) .room-subview .appliance-tile {
  display: block;
}
:host([data-room='cozinha']) .room-subview .appliance-main {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
:host([data-room='cozinha']) .room-subview .appliance-main:disabled {
  cursor: default;
}
:host([data-room='cozinha']) .room-subview .appliance-main:focus-visible {
  outline: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.58);
  outline-offset: -4px;
  border-radius: calc(var(--room-radius-small) - 3px);
}
:host([data-room='cozinha']) .room-subview .appliance-tile.is-airfryer .appliance-visual img {
  transform: scale(0.92);
}
@media (max-width: 800px) {
:host([data-room='cozinha']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .right-column {
  display: contents;
}
:host([data-room='cozinha']) .room-subview .subview-topband {
  order: 0;
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
}
:host([data-room='cozinha']) .room-subview .topband-badges {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .topband-badges .tb-badge[data-phone-hide], :host([data-room='cozinha']) .room-subview .topband-clock {
  display: none;
}
:host([data-room='cozinha']) .room-subview .tb-badge {
  min-width: 0;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr);
  column-gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
}
:host([data-room='cozinha']) .room-subview .tb-badge-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
}
:host([data-room='cozinha']) .room-subview .tb-badge-sub {
  max-width: 100%;
}
:host([data-room='cozinha']) .room-subview .hero-panel.is-unconfigured {
  display: none;
}
:host([data-room='cozinha']) .room-subview .lights-card {
  order: 20;
  width: 100%;
  height: auto;
  min-height: 0;
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .lights-card .module-head {
  min-height: 0;
  flex-wrap: wrap;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-room='cozinha']) .room-subview .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-room='cozinha']) .room-subview .head-actions .chip-button, :host([data-room='cozinha']) .room-subview .zone-header {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .lights-zones, :host([data-room='cozinha']) .room-subview .zone-lights, :host([data-room='cozinha']) .room-subview .office-light-list {
  flex: 0 0 auto;
  max-height: none !important;
  overflow-y: visible !important;
  overscroll-behavior: auto;
}
:host([data-room='cozinha']) .room-subview .appliances-card {
  order: 30;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: auto auto;
  overflow: hidden;
}
:host([data-room='cozinha']) .room-subview .appliances-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(clamp(120.12px, 8.46cqi, 200.2px), auto);
  align-items: stretch;
}
:host([data-room='cozinha']) .room-subview .appliance-tile:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}
:host([data-room='cozinha']) .room-subview .appliance-main {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .mh-menu {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .cameras-card.cameras-card-controls {
  order: 40;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px));
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage, :host([data-room='cozinha']) .room-subview .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .camera-pip-feed {
  right: clamp(12.48px, 0.88cqi, 20.8px);
  bottom: clamp(12.48px, 0.88cqi, 20.8px);
  width: clamp(clamp(68.64px, 4.84cqi, 114.4px), 25%, clamp(87.36px, 6.15cqi, 145.6px));
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(54.6px, 3.85cqi, 91px);
}
:host([data-room='cozinha']) .room-subview .camera-control {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .subview-footer {
  display: none;
}
}
`;

/** Sobreposicao do comodo casal: 13 regras que divergem da base. */
const SOBREPOSICAO_CASAL = css`
:host([data-room='casal']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qcasal-marquee 10s linear infinite;
}
@keyframes bruno-qcasal-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='casal']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='casal']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='casal']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 2px 0 0;
}
:host([data-room='casal']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='casal']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='casal']) .light-row {
  display: grid;
  grid-template-columns: clamp(24.96px, 1.76cqi, 41.6px) clamp(87.36px, 6.15cqi, 145.6px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: clamp(3.9px, 0.27cqi, 6.5px) clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='casal']) .light-row-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='casal']) .light-row-name {
  min-width: 0;
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='casal']) .light-bar {
  height: clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='casal']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`;

/** Sobreposicao do comodo marina: 13 regras que divergem da base. */
const SOBREPOSICAO_MARINA = css`
:host([data-room='marina']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qmarina-marquee 10s linear infinite;
}
@keyframes bruno-qmarina-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='marina']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='marina']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='marina']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='marina']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='marina']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='marina']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='marina']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='marina']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='marina']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='marina']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`;

/** Sobreposicao do comodo miguel: 13 regras que divergem da base. */
const SOBREPOSICAO_MIGUEL = css`
:host([data-room='miguel']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qmiguel-marquee 10s linear infinite;
}
@keyframes bruno-qmiguel-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='miguel']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='miguel']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='miguel']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 2px 0 0;
}
:host([data-room='miguel']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='miguel']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='miguel']) .light-row {
  display: grid;
  grid-template-columns: clamp(24.96px, 1.76cqi, 41.6px) clamp(87.36px, 6.15cqi, 145.6px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: clamp(3.9px, 0.27cqi, 6.5px) clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='miguel']) .light-row-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='miguel']) .light-row-name {
  min-width: 0;
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='miguel']) .light-bar {
  height: clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='miguel']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`;

/** Todos os blocos, para o componente escolher pelo config. */
export const SUBVIEW_BLOCOS = {
  appliances: SUBVIEW_APPLIANCES_CSS,
  tvHub: SUBVIEW_TVHUB_CSS,
  ps5: SUBVIEW_PS5_CSS,
  pc: SUBVIEW_PC_CSS,
} as const;

/** Sobreposicoes por comodo. Aplicar DEPOIS da base e dos blocos. */
export const SUBVIEW_SOBREPOSICOES = {
  sala: SOBREPOSICAO_SALA,
  office: SOBREPOSICAO_OFFICE,
  cozinha: SOBREPOSICAO_COZINHA,
  casal: SOBREPOSICAO_CASAL,
  marina: SOBREPOSICAO_MARINA,
  miguel: SOBREPOSICAO_MIGUEL,
} as const;

void unsafeCSS;
