const BRUNO_HERO_STAGE_CARD_TAG = 'bruno-hero-stage-card';

class BrunoHeroStageCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      background: '/local/images/home_color.jpg',
      fallback_background: '/local/images/home.jpg',
      ...config,
    };
    this._render();
  }

  getCardSize() {
    return 1;
  }

  getGridOptions() {
    return {
      columns: 12,
      rows: 8,
      min_columns: 12,
      min_rows: 8,
    };
  }

  connectedCallback() {
    if (this._config) this._render();
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const background = BrunoHeroStageCard._cssUrl(this._config.background);
    const fallbackBackground = BrunoHeroStageCard._cssUrl(this._config.fallback_background || this._config.background);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          margin: 0;
          padding: 0;
          position: relative;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          contain: layout paint style;
        }

        * {
          box-sizing: border-box;
        }

        .stage {
          position: relative;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          isolation: isolate;
        }

        .hero-bg {
          position: absolute;
          pointer-events: none;
          z-index: 0;
          top: -18px;
          bottom: -20px;
          left: -16px;
          right: -86px;
          background:
            linear-gradient(90deg,
              rgba(4,10,18,0.82) 0%,
              rgba(5,10,18,0.66) 12%,
              rgba(6,12,20,0.42) 24%,
              rgba(7,13,22,0.22) 38%,
              rgba(7,13,22,0.10) 50%,
              rgba(7,13,22,0.14) 60%,
              rgba(7,13,22,0.30) 70%,
              rgba(7,13,22,0.54) 82%,
              rgba(7,13,22,0.80) 92%,
              rgba(7,13,22,0.94) 100%
            ),
            linear-gradient(180deg,
              rgba(4,8,14,0.78) 0%,
              rgba(4,8,14,0.46) 10%,
              rgba(4,8,14,0.18) 22%,
              rgba(4,8,14,0.04) 34%,
              rgba(4,8,14,0.00) 46%,
              rgba(4,8,14,0.00) 58%,
              rgba(4,8,14,0.10) 72%,
              rgba(4,8,14,0.28) 84%,
              rgba(4,8,14,0.56) 94%,
              rgba(4,8,14,0.78) 100%
            ),
            radial-gradient(680px 220px at 12% 4%, rgba(255,255,255,0.07), transparent 56%),
            radial-gradient(900px 320px at 74% 52%, rgba(255,255,255,0.03), transparent 66%),
            url("${background}") left center / auto 100% no-repeat,
            url("${fallbackBackground}") left center / auto 100% no-repeat,
            #020406;
          opacity: 1;
          filter: saturate(1.01) brightness(0.90);
          mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.84) 4%,
              rgba(0,0,0,1) 10%,
              rgba(0,0,0,1) 78%,
              rgba(0,0,0,0.84) 88%,
              rgba(0,0,0,0.46) 94%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.84) 6%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 80%,
              rgba(0,0,0,0.82) 89%,
              rgba(0,0,0,0.42) 95%,
              transparent 100%
            );
          -webkit-mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.84) 4%,
              rgba(0,0,0,1) 10%,
              rgba(0,0,0,1) 78%,
              rgba(0,0,0,0.84) 88%,
              rgba(0,0,0,0.46) 94%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.84) 6%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 80%,
              rgba(0,0,0,0.82) 89%,
              rgba(0,0,0,0.42) 95%,
              transparent 100%
            );
          mask-composite: intersect;
          -webkit-mask-composite: source-in;
        }

        .hero-bg::before,
        .hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .hero-bg::before {
          background:
            linear-gradient(90deg,
              rgba(4,10,18,0.72) 0%,
              rgba(4,10,18,0.56) 12%,
              rgba(5,10,18,0.34) 24%,
              rgba(5,10,18,0.14) 38%,
              rgba(5,10,18,0.02) 50%,
              rgba(5,10,18,0.08) 60%,
              rgba(5,10,18,0.22) 72%,
              rgba(5,10,18,0.46) 84%,
              rgba(5,10,18,0.74) 100%
            ),
            linear-gradient(180deg,
              rgba(3,8,14,0.62) 0%,
              rgba(3,8,14,0.34) 12%,
              rgba(3,8,14,0.08) 26%,
              rgba(3,8,14,0.00) 40%,
              rgba(3,8,14,0.00) 62%,
              rgba(3,8,14,0.10) 76%,
              rgba(3,8,14,0.30) 90%,
              rgba(3,8,14,0.60) 100%
            );
        }

        .hero-bg::after {
          background:
            radial-gradient(720px 220px at 8% 2%, rgba(255,255,255,0.08), transparent 58%),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%),
            linear-gradient(0deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00) 34%);
          opacity: 0.58;
        }
      </style>

      <div class="stage" aria-hidden="true">
        <div class="hero-bg"></div>
      </div>
    `;
  }

  static _cssUrl(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\)/g, '\\)');
  }
}

if (!customElements.get(BRUNO_HERO_STAGE_CARD_TAG)) {
  customElements.define(BRUNO_HERO_STAGE_CARD_TAG, BrunoHeroStageCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_HERO_STAGE_CARD_TAG,
  name: 'Bruno Hero Stage Card',
  preview: false,
  description: 'Non-interactive atmospheric background stage for the Bento dashboard.',
});
