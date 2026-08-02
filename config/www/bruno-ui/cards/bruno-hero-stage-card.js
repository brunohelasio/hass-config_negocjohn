const BRUNO_HERO_STAGE_CARD_TAG = 'bruno-hero-stage-card';

class BrunoHeroStageCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      background: '/local/images/home_color.jpg?v=20260702-all-images-1',
      fallback_background: '/local/images/home.jpg?v=20260702-all-images-1',
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
            url("${background}") left center / auto 100% no-repeat,
            url("${fallbackBackground}") left center / auto 100% no-repeat,
            #020406;
          opacity: 1;
          filter: saturate(1.12) brightness(1.02) contrast(1.04);
          mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.42) 3%,
              rgba(0,0,0,0.84) 8%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 82%,
              rgba(0,0,0,0.78) 91%,
              rgba(0,0,0,0.34) 96%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.38) 4%,
              rgba(0,0,0,0.84) 10%,
              rgba(0,0,0,1) 17%,
              rgba(0,0,0,1) 76%,
              rgba(0,0,0,0.76) 87%,
              rgba(0,0,0,0.28) 95%,
              transparent 100%
            );
          -webkit-mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.42) 3%,
              rgba(0,0,0,0.84) 8%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 82%,
              rgba(0,0,0,0.78) 91%,
              rgba(0,0,0,0.34) 96%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.38) 4%,
              rgba(0,0,0,0.84) 10%,
              rgba(0,0,0,1) 17%,
              rgba(0,0,0,1) 76%,
              rgba(0,0,0,0.76) 87%,
              rgba(0,0,0,0.28) 95%,
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
              rgba(2,6,11,0.96) 0,
              rgba(2,6,11,0.90) 82px,
              rgba(3,8,14,0.74) 160px,
              rgba(4,9,15,0.46) 250px,
              rgba(5,10,18,0.18) 340px,
              rgba(5,10,18,0.04) 410px,
              rgba(5,10,18,0.00) 470px
            );
        }

        .hero-bg::after {
          background:
            linear-gradient(90deg,
              rgba(2,6,11,0.28) 0,
              rgba(2,6,11,0.08) 92px,
              rgba(2,6,11,0.00) 210px,
              rgba(2,6,11,0.00) 78%,
              rgba(2,6,11,0.22) 90%,
              rgba(2,6,11,0.72) 100%
            ),
            linear-gradient(180deg,
              rgba(2,6,11,0.84) 0%,
              rgba(2,6,11,0.50) 7%,
              rgba(2,6,11,0.18) 16%,
              rgba(2,6,11,0.00) 28%,
              rgba(2,6,11,0.00) 66%,
              rgba(2,6,11,0.20) 79%,
              rgba(2,6,11,0.58) 91%,
              rgba(2,6,11,0.90) 100%
            );
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
