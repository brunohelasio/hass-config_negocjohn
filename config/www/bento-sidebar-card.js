const BENTO_SIDEBAR_CARD_TAG = 'bento-sidebar-rail-card';

class BentoSidebarCard extends HTMLElement {
  static getStubConfig() {
    return {
      top_items: BentoSidebarCard.defaultTopItems,
      bottom_items: BentoSidebarCard.defaultBottomItems,
    };
  }

  setConfig(config) {
    this._config = {
      top_items: BentoSidebarCard.defaultTopItems,
      bottom_items: BentoSidebarCard.defaultBottomItems,
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

  _items(section) {
    const items = this._config?.[section];
    return Array.isArray(items) ? items : [];
  }

  _handleAction(item) {
    const action = item?.tap_action || item?.action || { action: 'none' };

    switch (action.action) {
      case undefined:
      case 'none':
        return;

      case 'navigate':
        this._navigate(action.navigation_path || action.path);
        return;

      case 'url':
        this._openUrl(action.url_path || action.url);
        return;

      case 'call-service':
        this._callService(action);
        return;

      case 'more-info':
        this._moreInfo(action.entity || item.entity);
        return;

      case 'fire-dom-event':
        this._fireDomEvent(action);
        return;

      default:
        console.warn('bento-sidebar-card: unsupported action', action);
    }
  }

  _navigate(path) {
    if (!path) return;
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path },
      bubbles: true,
      composed: true,
    }));
  }

  _openUrl(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  _callService(action) {
    if (!this._hass || !action.service) return;
    const [domain, service] = action.service.split('.');
    if (!domain || !service) return;

    this._hass.callService(
      domain,
      service,
      action.service_data || action.data || {},
      action.target || {},
    );
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _fireDomEvent(action) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: action,
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
          min-height: 0;
          display: block;
          margin: 0;
          padding: 0;
          contain: layout style;
        }

        .rail {
          width: 65px;
          height: 100%;
          min-height: 100%;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 12px 0 10px;
          background: linear-gradient(160deg, rgba(15,20,35,0.46), rgba(20,24,33,0.30));
          backdrop-filter: blur(18px) saturate(1.2);
          -webkit-backdrop-filter: blur(18px) saturate(1.2);
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 16px;
          box-shadow: none;
          overflow: hidden;
        }

        .group {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 6px;
          flex: 0 0 auto;
        }

        .spacer {
          width: 100%;
          min-height: 18px;
          flex: 1 1 auto;
        }

        .nav-button {
          width: 42px;
          height: 42px;
          min-width: 42px;
          min-height: 42px;
          max-width: 42px;
          max-height: 42px;
          box-sizing: border-box;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          color: rgba(255,255,255,0.78);
          background: transparent;
          border: 1px solid transparent;
          border-radius: 12px;
          box-shadow: none;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          line-height: 0;
          transition:
            background 0.12s ease,
            border-color 0.12s ease,
            color 0.12s ease,
            transform 0.12s ease;
        }

        .nav-button:hover {
          background: rgba(255,255,255,0.08);
        }

        .nav-button:active {
          background: rgba(255,255,255,0.14);
          transform: translateY(1px);
        }

        .nav-button:focus-visible {
          border-color: rgba(255,255,255,0.34);
        }

        .nav-button[aria-disabled="true"] {
          cursor: default;
        }

        .nav-button[aria-disabled="true"]:active {
          transform: none;
        }

        .nav-button.selected {
          color: rgba(255,255,255,0.88);
          background: rgba(255,255,255,0.12);
          backdrop-filter: blur(12px) saturate(1.15);
          -webkit-backdrop-filter: blur(12px) saturate(1.15);
          border-color: rgba(255,255,255,0.18);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 4px 10px rgba(0,0,0,0.20);
        }

        .nav-button.selected:hover {
          background: rgba(255,255,255,0.12);
        }

        .nav-button svg {
          width: 20px;
          height: 20px;
          display: block;
          flex: 0 0 20px;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.5;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
        }
      </style>
      <div class="rail" role="navigation" aria-label="Bento sidebar">
        <div class="group top">
          ${this._items('top_items').map((item, index) => this._button(item, 'top', index)).join('')}
        </div>
        <div class="spacer" aria-hidden="true"></div>
        <div class="group bottom">
          ${this._items('bottom_items').map((item, index) => this._button(item, 'bottom', index)).join('')}
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('.nav-button').forEach((button) => {
      button.addEventListener('click', () => {
        const section = button.dataset.section;
        const index = Number(button.dataset.index);
        const item = this._items(section)[index];
        this._handleAction(item);
      });
    });
  }

  _button(item, section, index) {
    const selected = item?.selected ? ' selected' : '';
    const label = BentoSidebarCard._escape(item?.label || item?.key || item?.icon || 'Item');
    const icon = BentoSidebarCard.icons[item?.icon] || BentoSidebarCard.icons.circle;
    const action = item?.tap_action || item?.action || {};
    const disabled = action.action === 'none';
    const ariaDisabled = disabled ? ' aria-disabled="true" tabindex="-1"' : '';

    return `
      <button
        class="nav-button${selected}"
        type="button"
        title="${label}"
        aria-label="${label}"
        data-section="${section}_items"
        data-index="${index}"
        ${ariaDisabled}
      >
        ${icon}
      </button>
    `;
  }

  static _escape(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

BentoSidebarCard.defaultTopItems = [
  { key: 'home', icon: 'home', label: 'Home', selected: true, tap_action: { action: 'none' } },
  { key: 'music', icon: 'music', label: 'Musica', tap_action: { action: 'navigate', navigation_path: '/lovelace/mass-media' } },
];

BentoSidebarCard.defaultBottomItems = [
  { key: 'monitor', icon: 'monitor', label: 'Monitor', tap_action: { action: 'none' } },
  { key: 'power', icon: 'power', label: 'Power', tap_action: { action: 'navigate', navigation_path: '/' } },
];

BentoSidebarCard.icons = {
  home: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  music: '<svg viewBox="0 0 24 24"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  cameras: '<svg viewBox="0 0 24 24"><path d="M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2z"/><circle cx="12" cy="13" r="3.5"/><path d="M17.5 10.5h.01"/></svg>',
  system: '<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6" rx="1"/><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3"/></svg>',
  vacuum: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2"/><line x1="12" y1="3" x2="12" y2="5"/></svg>',
  network: '<svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  refresh: '<svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  updates: '<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  floorplan: '<svg viewBox="0 0 24 24"><path d="M3 21V3h18v18H3z"/><path d="M3 9h7V3M10 9v12M10 15h11M16 15V9h5"/></svg>',
  monitor: '<svg viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>',
  power: '<svg viewBox="0 0 24 24"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>',
  circle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',
};

if (!customElements.get(BENTO_SIDEBAR_CARD_TAG)) {
  customElements.define(BENTO_SIDEBAR_CARD_TAG, BentoSidebarCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BENTO_SIDEBAR_CARD_TAG,
  name: 'Bento Sidebar Card',
  preview: false,
  description: 'Isolated Bento sidebar rail with fixed Home highlight and anchored bottom actions.',
});
