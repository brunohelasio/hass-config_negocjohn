const BRUNO_MOBILE_NAV_CARD_TAG = 'bruno-mobile-nav-card';

const BRUNO_MOBILE_NAV_ITEMS = [
  { path: 'mobile-casa', icon: 'mdi:home-variant', label: 'Casa' },
  { path: 'mobile-comodos', icon: 'mdi:sofa', label: 'Comodos' },
  { path: 'mobile-midia', icon: 'mdi:music', label: 'Midia' },
  { path: 'mobile-cameras', icon: 'mdi:cctv', label: 'Cameras' },
  { path: 'mobile-mais', icon: 'mdi:dots-horizontal-circle', label: 'Mais' },
];

class BrunoMobileNavCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      items: BRUNO_MOBILE_NAV_ITEMS,
      ...(config || {}),
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  getCardSize() {
    return 1;
  }

  _dashboardSlug() {
    const parts = (window.location?.pathname || '').split('/').filter(Boolean);
    return parts[0] || 'ngocjohn-main';
  }

  _currentPath() {
    const parts = (window.location?.pathname || '').split('/').filter(Boolean);
    return parts[parts.length - 1] || 'mobile-casa';
  }

  _navigate(path) {
    const fullPath = `/${this._dashboardSlug()}/${path}`;
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: fullPath },
      bubbles: true,
      composed: true,
    }));

    window.setTimeout(() => {
      if (window.location?.pathname === fullPath) return;
      window.history?.pushState?.(null, '', fullPath);
      window.dispatchEvent?.(new CustomEvent('location-changed', { detail: { replace: false } }));
    }, 50);
  }

  _wireActions() {
    this.shadowRoot.querySelectorAll('[data-mobile-path]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._navigate(button.dataset.mobilePath);
      });
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const current = this._currentPath();
    const items = Array.isArray(this._config.items) ? this._config.items : BRUNO_MOBILE_NAV_ITEMS;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          position: fixed !important;
          left: 50%;
          bottom: 18px;
          z-index: 2147483647;
          width: min(424px, calc(100vw - 24px));
          height: calc(76px + env(safe-area-inset-bottom, 0px));
          display: block;
          transform: translateX(-50%);
          pointer-events: auto;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        .nav-shell {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 8px 10px calc(8px + env(safe-area-inset-bottom, 0px));
          border-radius: 999px;
          color: rgba(255,255,255,0.78);
          background:
            radial-gradient(72px 46px at 20% 4%, rgba(255,255,255,0.20), transparent 72%),
            linear-gradient(160deg, rgba(16,21,31,0.70), rgba(8,10,16,0.58));
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.20),
            inset 0 -1px 0 rgba(0,0,0,0.20),
            0 16px 42px rgba(0,0,0,0.42);
          backdrop-filter: blur(28px) saturate(1.58) contrast(1.04);
          -webkit-backdrop-filter: blur(28px) saturate(1.58) contrast(1.04);
          overflow: hidden;
        }

        .nav-shell::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          padding: 1px;
          border-radius: inherit;
          background: linear-gradient(125deg, rgba(255,255,255,0.46), rgba(255,255,255,0.08) 38%, rgba(160,190,255,0.18));
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
          pointer-events: none;
        }

        .nav-list {
          position: relative;
          z-index: 1;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(${items.length}, minmax(0, 1fr));
          align-items: center;
          gap: 4px;
        }

        button {
          appearance: none;
          -webkit-appearance: none;
          min-width: 0;
          height: 58px;
          display: grid;
          grid-template-rows: 24px auto;
          place-items: center;
          gap: 4px;
          padding: 7px 4px 6px;
          border: 0;
          border-radius: 999px;
          color: rgba(255,255,255,0.56);
          background: transparent;
          font: inherit;
          cursor: pointer;
          outline: none;
          transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
        }

        button.is-active {
          color: rgba(255,255,255,0.98);
          background:
            radial-gradient(28px 26px at 50% 20%, rgba(255,255,255,0.22), transparent 70%),
            linear-gradient(180deg, rgba(134,112,255,0.92), rgba(93,77,220,0.72));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.26),
            0 0 18px rgba(122,101,255,0.36);
        }

        button:active {
          transform: translateY(1px) scale(0.98);
        }

        ha-icon {
          --mdc-icon-size: 22px;
          filter: drop-shadow(0 3px 6px rgba(0,0,0,0.26));
        }

        .label {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 720;
        }
      </style>

      <nav class="nav-shell" aria-label="Navegacao mobile">
        <div class="nav-list">
          ${items.map((item) => `
            <button class="${current === item.path ? 'is-active' : ''}" type="button" data-mobile-path="${BrunoMobileNavCard._escapeAttr(item.path)}" aria-label="${BrunoMobileNavCard._escapeAttr(item.label)}">
              <ha-icon icon="${BrunoMobileNavCard._escapeAttr(item.icon)}"></ha-icon>
              <span class="label">${BrunoMobileNavCard._escape(item.label)}</span>
            </button>
          `).join('')}
        </div>
      </nav>
    `;

    this._wireActions();
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoMobileNavCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_MOBILE_NAV_CARD_TAG)) {
  customElements.define(BRUNO_MOBILE_NAV_CARD_TAG, BrunoMobileNavCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_MOBILE_NAV_CARD_TAG,
  name: 'Bruno Mobile Nav Card',
  preview: false,
  description: 'iOS-like fixed mobile pill navigation for Bruno dashboard.',
});
