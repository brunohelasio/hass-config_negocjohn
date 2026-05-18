const BRUNO_MOBILE_CARD_FRAME_TAG = 'bruno-mobile-card-frame';

class BrunoMobileCardFrame extends HTMLElement {
  static getStubConfig() {
    return { card: { type: 'custom:bruno-media-card' }, aspect_ratio: '1 / 1' };
  }

  setConfig(config) {
    this._config = {
      height: 'auto',
      min_height: '',
      max_height: '',
      aspect_ratio: '',
      ...(config || {}),
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._child) this._child.hass = hass;
  }

  getCardSize() {
    return 3;
  }

  _childTag() {
    const type = this._config?.card?.type || '';
    return type.startsWith('custom:') ? type.slice(7) : type;
  }

  _childConfig() {
    const { type, ...childConfig } = this._config?.card || {};
    return childConfig;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const height = this._config.height || 'auto';
    const minHeight = this._config.min_height || (height === 'auto' ? '0' : height);
    const maxHeight = this._config.max_height || 'none';
    const aspect = this._config.aspect_ratio || 'auto';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: ${BrunoMobileCardFrame._escapeCss(height)};
          min-height: ${BrunoMobileCardFrame._escapeCss(minHeight)};
          max-height: ${BrunoMobileCardFrame._escapeCss(maxHeight)};
          aspect-ratio: ${BrunoMobileCardFrame._escapeCss(aspect)};
          min-width: 0;
          contain: layout style;
        }

        .frame {
          width: 100%;
          height: 100%;
          min-height: inherit;
          min-width: 0;
          display: block;
        }

        .frame > * {
          display: block;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
        }
      </style>
      <div class="frame"></div>
    `;

    this._mountChild();
  }

  _mountChild() {
    const tag = this._childTag();
    const frame = this.shadowRoot?.querySelector('.frame');
    if (!tag || !frame) return;

    frame.textContent = '';
    const child = document.createElement(tag);
    if (typeof child.setConfig === 'function') child.setConfig(this._childConfig());
    if (this._hass) child.hass = this._hass;
    frame.appendChild(child);
    this._child = child;
  }

  static _escapeCss(value) {
    return String(value || '').replace(/[<>{};]/g, '');
  }
}

if (!customElements.get(BRUNO_MOBILE_CARD_FRAME_TAG)) {
  customElements.define(BRUNO_MOBILE_CARD_FRAME_TAG, BrunoMobileCardFrame);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_MOBILE_CARD_FRAME_TAG,
  name: 'Bruno Mobile Card Frame',
  preview: false,
  description: 'Mobile JS frame for sizing existing Bruno custom cards without Lovelace wrapper cards.',
});
