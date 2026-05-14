class BentoSidebarCard extends HTMLElement {
  static getStubConfig() {
    return {
      music_path: '/lovelace/mass-media',
      power_path: '/',
    };
  }

  setConfig(config) {
    this._config = {
      music_path: '/lovelace/mass-media',
      power_path: '/',
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
  }

  getCardSize() {
    return 4;
  }

  _navigate(path) {
    if (!path) return;
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path },
      bubbles: true,
      composed: true,
    }));
  }

  _render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: 'open' });
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          width: 65px;
          height: 100%;
          display: block;
        }

        .sidebar {
          box-sizing: border-box;
          width: 65px;
          height: 100%;
          min-height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 12px 0 8px;
          background: linear-gradient(160deg, rgba(15,20,35,0.46), rgba(20,24,33,0.30));
          backdrop-filter: blur(18px) saturate(1.2);
          -webkit-backdrop-filter: blur(18px) saturate(1.2);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: none;
        }

        .nav-button {
          width: 42px;
          height: 42px;
          margin: 3px 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.78);
          background: transparent;
          border: 0;
          border-radius: 12px;
          box-shadow: none;
          cursor: pointer;
          transition: background 0.12s ease;
          appearance: none;
          -webkit-appearance: none;
        }

        .nav-button:active {
          background: rgba(255,255,255,0.14);
        }

        .nav-button.home {
          cursor: default;
          pointer-events: none;
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px) saturate(1.15);
          -webkit-backdrop-filter: blur(12px) saturate(1.15);
          border: 1px solid rgba(255,255,255,0.18);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 10px rgba(0,0,0,0.20);
        }

        .nav-button svg {
          width: 20px;
          height: 20px;
          display: block;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        .nav-button.monitor {
          cursor: default;
        }

        .spacer {
          flex: 1 1 auto;
          min-height: 8px;
        }
      </style>
      <div class="sidebar" role="navigation" aria-label="Bento sidebar prototype">
        <button class="nav-button home" type="button" aria-label="Home selecionado" tabindex="-1">
          ${BentoSidebarCard._icons.home}
        </button>

        <button class="nav-button music" type="button" aria-label="Música" data-action="music">
          ${BentoSidebarCard._icons.music}
        </button>

        <div class="spacer" aria-hidden="true"></div>

        <button class="nav-button monitor" type="button" aria-label="Monitor">
          ${BentoSidebarCard._icons.monitor}
        </button>

        <button class="nav-button power" type="button" aria-label="Power" data-action="power">
          ${BentoSidebarCard._icons.power}
        </button>
      </div>
    `;

    this.shadowRoot.querySelector('[data-action="music"]')
      ?.addEventListener('click', () => this._navigate(this._config.music_path));
    this.shadowRoot.querySelector('[data-action="power"]')
      ?.addEventListener('click', () => this._navigate(this._config.power_path));
  }
}

BentoSidebarCard._icons = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  music: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  monitor: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  power: '<svg viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
};

if (!customElements.get('bento-sidebar-card')) {
  customElements.define('bento-sidebar-card', BentoSidebarCard);
}
