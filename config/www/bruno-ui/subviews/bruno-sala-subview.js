const BRUNO_SALA_SUBVIEW_TAG = 'bruno-sala-subview';

class BrunoSalaSubview extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  getCardSize() {
    return 12;
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          min-height: 100vh;
        }

        * {
          box-sizing: border-box;
        }

        ha-card {
          height: 100vh;
          margin: 0;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          overflow: auto;
          --ha-card-background: transparent;
          --ha-card-border-width: 0;
          --ha-card-box-shadow: none;
        }

        .sala-subview {
          min-height: 100%;
          padding: 75px 12px 12px 12px;
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(12, minmax(0, 1fr));
          grid-template-rows: minmax(auto, 42vh) minmax(430px, 44vh);
          align-content: center;
          grid-template-areas:
            "hero hero hero hero hero lights lights lights lights ac ac ac"
            "cams cams cams cams media media media media media spot spot spot";
        }

        .sala-area {
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--bruno-liquid-card-radius, 18px);
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.15));
          background: var(--bruno-liquid-surface-off-background, rgba(20, 24, 34, 0.5));
          box-shadow: var(--bruno-liquid-surface-off-shadow, 0 12px 24px rgba(0, 0, 0, 0.28));
          color: var(--primary-text-color, #ffffff);
          font-size: 13px;
          font-weight: 600;
          letter-spacing: 0.02em;
          text-transform: uppercase;
        }

        .sala-area--hero { grid-area: hero; }
        .sala-area--lights { grid-area: lights; }
        .sala-area--ac { grid-area: ac; }
        .sala-area--cams { grid-area: cams; }
        .sala-area--media { grid-area: media; }
        .sala-area--spot { grid-area: spot; }

        @media (max-width: 800px) {
          .sala-subview {
            padding: 40px 8px 8px 8px;
            gap: 8px;
            grid-template-columns: 1fr;
            grid-template-rows: repeat(6, min-content);
            grid-template-areas:
              "hero"
              "lights"
              "ac"
              "cams"
              "media"
              "spot";
          }

          .sala-area {
            min-height: 110px;
          }
        }

        @media (min-width: 801px) and (max-width: 1440px) and (orientation: portrait) {
          .sala-subview {
            padding: 50px 12px 12px 12px;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: repeat(3, min-content);
            grid-template-areas:
              "hero lights"
              "ac cams"
              "media spot";
          }

          .sala-area {
            min-height: 180px;
          }
        }
      </style>

      <ha-card>
        <section class="sala-subview">
          <div class="sala-area sala-area--hero">hero</div>
          <div class="sala-area sala-area--lights">lights</div>
          <div class="sala-area sala-area--ac">ac</div>
          <div class="sala-area sala-area--cams">cams</div>
          <div class="sala-area sala-area--media">media</div>
          <div class="sala-area sala-area--spot">spot</div>
        </section>
      </ha-card>
    `;
  }
}

if (!customElements.get(BRUNO_SALA_SUBVIEW_TAG)) {
  customElements.define(BRUNO_SALA_SUBVIEW_TAG, BrunoSalaSubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_SALA_SUBVIEW_TAG,
  name: 'Bruno Sala Subview',
  preview: true,
  description: 'Sala subview grid skeleton powered by Bruno JS architecture.',
});
