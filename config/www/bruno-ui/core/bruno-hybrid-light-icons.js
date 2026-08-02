(() => {
  'use strict';

  const ASSET_VERSION = '20260719-hybrid-light-icons-1';
  const LED_BASE = '/local/bruno-ui/assets/hybrid-icons/led-strip';
  const PENDANT_BASE = '/local/bruno-ui/assets/hybrid-icons/pendant/v7';
  const LED_PATH_A = 'M175 113 H74 C47 113 29 101 29 82 C29 63 45 47 74 47 H306';
  const LED_PATH_B = 'M175 113 H280 C303 113 317 130 317 151 C317 170 303 184 280 184 H29';

  const asset = (base, name) => `${base}/${name}?v=${ASSET_VERSION}`;

  const ledPath = (className, path) =>
    `<path class="${className}" pathLength="1" d="${path}"></path>`;

  function renderLedStrip({ active = false } = {}) {
    return `
      <span class="tpl-light-icon brunoHybridLight brunoHybridLed ${active ? 'is-on' : 'is-off'}" aria-hidden="true">
        <span class="brunoHybridLed__canvas">
          <img class="brunoHybridLed__layer brunoHybridLed__glow" src="${asset(LED_BASE, 'led-strip-glow.png')}" alt="">
          <img class="brunoHybridLed__layer brunoHybridLed__frameOff" src="${asset(LED_BASE, 'led-strip-frame-off.png')}" alt="">
          <img class="brunoHybridLed__layer brunoHybridLed__frameOn" src="${asset(LED_BASE, 'led-strip-frame-on.png')}" alt="">
          <svg class="brunoHybridLed__rail" viewBox="0 0 360 210">
            ${ledPath('brunoHybridLed__railBase', LED_PATH_A)}
            ${ledPath('brunoHybridLed__railBase', LED_PATH_B)}
            ${ledPath('brunoHybridLed__railRim', LED_PATH_A)}
            ${ledPath('brunoHybridLed__railRim', LED_PATH_B)}
            ${ledPath('brunoHybridLed__railDiffuser', LED_PATH_A)}
            ${ledPath('brunoHybridLed__railDiffuser', LED_PATH_B)}
          </svg>
          <svg class="brunoHybridLed__trace" viewBox="0 0 360 210">
            ${ledPath('brunoHybridLed__tracePath', LED_PATH_A)}
            ${ledPath('brunoHybridLed__tracePath', LED_PATH_B)}
          </svg>
        </span>
      </span>
    `;
  }

  function renderPendant({ active = false } = {}) {
    return `
      <span class="tpl-light-icon brunoHybridLight brunoHybridPendant ${active ? 'is-on' : 'is-off'}" aria-hidden="true">
        <span class="brunoHybridPendant__canvas">
          <img class="brunoHybridPendant__layer brunoHybridPendant__off" src="${asset(PENDANT_BASE, 'pendant-off.png')}" alt="">
          <img class="brunoHybridPendant__layer brunoHybridPendant__on" src="${asset(PENDANT_BASE, 'pendant-on.png')}" alt="">
        </span>
      </span>
    `;
  }

  function styles() {
    return `
      .brunoHybridLight {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        filter: none !important;
      }

      .light-tile.is-on .light-icon:has(.brunoHybridLight),
      .light-row.is-on .light-row-icon:has(.brunoHybridLight),
      .zl-tile.is-on .zl-icon:has(.brunoHybridLight) {
        filter: none;
      }

      .brunoHybridLed__canvas,
      .brunoHybridPendant__canvas {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(var(--bruno-hybrid-light-scale));
        transform-origin: center;
        pointer-events: none;
      }

      .brunoHybridLed {
        --bruno-hybrid-light-scale: 0.105;
      }

      .light-icon .brunoHybridLed {
        --bruno-hybrid-light-scale: 0.16;
      }

      .light-row-icon .brunoHybridLed {
        --bruno-hybrid-light-scale: 0.095;
      }

      .brunoHybridLed__canvas {
        width: 280px;
        aspect-ratio: 360 / 210;
        isolation: isolate;
      }

      .brunoHybridLed__layer,
      .brunoHybridLed__rail,
      .brunoHybridLed__trace {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .brunoHybridLed__layer {
        object-fit: contain;
      }

      .brunoHybridLed__frameOff { z-index: 2; opacity: 1; }
      .brunoHybridLed__frameOn { z-index: 3; opacity: 0; }
      .brunoHybridLed__glow { z-index: 1; opacity: 0; }
      .brunoHybridLed__rail { z-index: 4; overflow: visible; }
      .brunoHybridLed__trace { z-index: 5; overflow: visible; opacity: 0; }

      .brunoHybridLed__rail path,
      .brunoHybridLed__trace path {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .brunoHybridLed__railBase {
        stroke: rgba(45,49,52,0.99);
        stroke-width: 18;
        filter:
          drop-shadow(0 5px 7px rgba(0,0,0,0.66))
          drop-shadow(0 0 1px rgba(255,245,226,0.34));
      }

      .brunoHybridLed__railRim {
        stroke: rgba(226,218,203,0.94);
        stroke-width: 13.2;
        filter:
          drop-shadow(0 1px 1px rgba(0,0,0,0.94))
          drop-shadow(0 0 1px rgba(255,246,229,0.66));
      }

      .brunoHybridLed__railDiffuser {
        stroke: rgba(184,175,160,0.96);
        stroke-width: 7.4;
        stroke-dasharray: 0.10 0.065;
        opacity: 0.96;
        filter:
          drop-shadow(0 1px 1px rgba(0,0,0,0.82))
          drop-shadow(0 0 1px rgba(245,230,205,0.38));
      }

      .brunoHybridLed.is-on .brunoHybridLed__frameOff { opacity: 0; }
      .brunoHybridLed.is-on .brunoHybridLed__frameOn { opacity: 1; }
      .brunoHybridLed.is-on .brunoHybridLed__glow { opacity: 0.76; }
      .brunoHybridLed.is-on .brunoHybridLed__trace { opacity: 1; }

      .brunoHybridLed.is-on .brunoHybridLed__railBase {
        stroke: rgba(67,53,36,0.96);
      }

      .brunoHybridLed.is-on .brunoHybridLed__railRim {
        stroke: rgba(235,218,190,0.72);
        filter:
          drop-shadow(0 1px 1px rgba(0,0,0,0.82))
          drop-shadow(0 0 2px rgba(255,219,158,0.44));
      }

      .brunoHybridLed.is-on .brunoHybridLed__railDiffuser {
        stroke: rgba(255,205,122,0.52);
        opacity: 0.72;
        filter: drop-shadow(0 0 2px rgba(255,199,105,0.64));
      }

      .brunoHybridLed__tracePath {
        stroke: #fff0c3;
        stroke-width: 5.2;
        filter:
          drop-shadow(0 0 3px rgba(255,240,195,0.98))
          drop-shadow(0 0 9px rgba(255,210,125,0.82))
          drop-shadow(0 0 16px rgba(255,208,116,0.32));
      }

      .brunoHybridPendant {
        --bruno-hybrid-light-scale: 0.12;
      }

      .light-icon .brunoHybridPendant {
        --bruno-hybrid-light-scale: 0.185;
      }

      .light-row-icon .brunoHybridPendant {
        --bruno-hybrid-light-scale: 0.105;
      }

      .brunoHybridPendant__canvas {
        width: 170px;
        height: 260px;
        overflow: hidden;
      }

      .brunoHybridPendant__layer {
        position: absolute;
        left: 0;
        top: 0;
        width: 230px;
        height: 260px;
        max-width: none;
        object-fit: fill;
        mix-blend-mode: screen;
        pointer-events: none;
        user-select: none;
        transition: opacity 320ms ease, filter 320ms ease;
      }

      .brunoHybridPendant__off { opacity: 0.9; }
      .brunoHybridPendant__on { opacity: 0; filter: brightness(0.96); }

      .brunoHybridPendant.is-on .brunoHybridPendant__off { opacity: 0.28; }
      .brunoHybridPendant.is-on .brunoHybridPendant__on {
        opacity: 1;
        filter: brightness(1);
      }
    `;
  }

  globalThis.BrunoHybridLightIcons = Object.freeze({
    renderLedStrip,
    renderPendant,
    styles,
  });
})();
