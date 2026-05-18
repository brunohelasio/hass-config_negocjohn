const BRUNO_QUICK_ACTIONS_CARD_TAG = 'bruno-quick-actions-card';

const BRUNO_QUICK_ACTIONS_DEFAULT_ITEMS = [
  {
    key: 'lights_off',
    icon: 'mdi:lightbulb-off-outline',
    label: 'Desligar luzes',
    group: 'actions',
    tap_action: {
      action: 'call-service',
      service: 'homeassistant.turn_off',
      data: { entity_id: 'light.todas_as_luzes' },
    },
  },
  {
    key: 'wifi',
    icon: 'mdi:wifi',
    label: 'Wi-Fi',
    group: 'actions',
    tap_action: {
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Wi-Fi',
          tag: 'wifi_qr',
          style: `
            --popup-width: 450px;
            --popup-max-width: min(450px, calc(100vw - 32px));
            --popup-background-color: rgba(15, 20, 35, 0.75);
            --mdc-theme-surface: rgba(20, 24, 33, 0.88);
            --mdc-dialog-scrim-color: rgba(0, 0, 0, 0.56);
          `,
          content: {
            type: 'picture',
            image: '/local/images/wifi_main_scanme.png',
          },
        },
      },
    },
  },
  { key: 'movies', icon: 'mdi:movie-roll', label: 'Filmes', group: 'scenes', tap_action: { action: 'none' } },
  { key: 'laptop', icon: 'mdi:laptop', label: 'Notebook', group: 'scenes', tap_action: { action: 'none' } },
  { key: 'sofa', icon: 'mdi:sofa-outline', label: 'Sala', group: 'scenes', tap_action: { action: 'none' } },
];

class BrunoQuickActionsCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      items: BRUNO_QUICK_ACTIONS_DEFAULT_ITEMS,
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

  _items() {
    return Array.isArray(this._config?.items) ? this._config.items : BRUNO_QUICK_ACTIONS_DEFAULT_ITEMS;
  }

  _groupForItem(item) {
    if (item?.group) return item.group;
    if (['movies', 'laptop', 'sofa', 'scene', 'scenes'].includes(item?.key)) return 'scenes';
    return 'actions';
  }

  _groups() {
    return this._items().reduce((groups, item, index) => {
      const key = this._groupForItem(item);
      let group = groups[groups.length - 1];
      if (!group || group.key !== key) {
        group = { key, items: [] };
        groups.push(group);
      }
      group.items.push({ item, index });
      return groups;
    }, []);
  }

  _runAction(action = {}) {
    if (!action || action.action === 'none') return;
    if (action.action === 'call-service') {
      const [domain, service] = String(action.service || '').split('.');
      if (!domain || !service || !this._hass) return;
      this._hass.callService(domain, service, action.data || action.service_data || {}, action.target || {});
      return;
    }
    if (action.action === 'fire-dom-event') {
      this.dispatchEvent(new CustomEvent('ll-custom', {
        detail: action,
        bubbles: true,
        composed: true,
      }));
      return;
    }
    if (action.action === 'navigate') {
      this.dispatchEvent(new CustomEvent('hass-navigate', {
        detail: { path: action.navigation_path || action.path },
        bubbles: true,
        composed: true,
      }));
    }
  }

  _wireActions() {
    this.shadowRoot.querySelectorAll('[data-action-index]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const item = this._items()[Number(button.dataset.actionIndex)];
        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 180);
        this._runAction(item?.tap_action || item?.action);
      });
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const groups = this._groups();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        .quick-card {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .quick-card::-webkit-scrollbar { display: none; }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .quick-dock {
          position: relative;
          isolation: isolate;
          width: max-content;
          max-width: 100%;
          min-height: 58px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 6px;
          color: rgba(255,255,255,0.86);
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.18));
          border-radius: 999px;
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(52px 40px at 18% 4%, rgba(255,255,255,0.22), transparent 70%),
            linear-gradient(160deg, rgba(15,20,35,0.50), rgba(20,24,33,0.34))
          );
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.22),
            0 10px 28px rgba(0,0,0,0.24)
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(24px) saturate(1.42));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(24px) saturate(1.42));
          overflow: hidden;
        }

        .quick-dock::before,
        .quick-dock::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
        }

        .quick-dock::before {
          inset: 1px;
          z-index: 0;
          background: var(--bruno-liquid-surface-off-sheen,
            linear-gradient(180deg, rgba(255,255,255,0.18), transparent 42%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.82);
        }

        .quick-dock::after {
          inset: 0;
          padding: 1px;
          z-index: 1;
          background: var(--bruno-liquid-surface-edge-glow,
            linear-gradient(125deg, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 36%, rgba(255,190,120,0.20) 100%)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: 0.75;
        }

        .quick-group {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          flex: 0 0 auto;
        }

        .quick-separator {
          position: relative;
          z-index: 2;
          width: 1px;
          height: 30px;
          margin: 0 2px;
          flex: 0 0 1px;
          border-radius: 999px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.22), transparent);
          box-shadow: 1px 0 0 rgba(0,0,0,0.18);
          opacity: 0.76;
        }

        .quick-button {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          flex: 0 0 44px;
          width: 44px;
          height: 44px;
          display: grid;
          place-items: center;
          margin: 0;
          padding: 0;
          color: rgba(255,255,255,0.86);
          border: 1px solid transparent;
          border-radius: 999px;
          background: transparent;
          box-shadow: none;
          overflow: hidden;
          outline: none;
          transition:
            transform 160ms ease,
            background 160ms ease,
            color 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .quick-button::before,
        .quick-button::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
        }

        .quick-button::before {
          inset: 1px;
          z-index: 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 58%),
            linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00));
          opacity: 0;
          transform: translateY(-3px);
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .quick-button::after {
          left: 50%;
          bottom: 5px;
          width: 11px;
          height: 2px;
          border-radius: 999px;
          background: rgba(var(--accent),0.92);
          box-shadow: 0 0 12px rgba(var(--accent),0.70);
          opacity: 0;
          transform: translateX(-50%) scaleX(0.62);
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .quick-button:hover {
          color: rgba(255,255,255,0.94);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.04));
          border-color: rgba(255,255,255,0.13);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.11),
            0 6px 14px rgba(0,0,0,0.16);
        }

        .quick-button:hover::before {
          opacity: 0.72;
          transform: translateY(0);
        }

        .quick-button.is-pressed,
        .quick-button:active {
          transform: translateY(1px) scale(0.98);
        }

        .quick-button[aria-disabled="true"] {
          cursor: default;
        }

        .quick-button[aria-disabled="true"]:active {
          transform: none;
        }

        .quick-button[aria-disabled="true"]:hover::after {
          opacity: 0;
        }

        .quick-button ha-icon {
          --mdc-icon-size: 21px;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.24));
        }

        @media (max-width: 800px) {
          .quick-card {
            justify-content: flex-start;
            padding: 0 8px;
          }

          .quick-dock {
            min-height: 54px;
            padding: 5px;
          }

          .quick-button {
            width: 41px;
            height: 41px;
            flex-basis: 41px;
          }
        }
      </style>

      <div class="quick-card">
        <div class="quick-dock" aria-label="Acoes rapidas">
          ${groups.map((group, groupIndex) => `
            ${groupIndex > 0 ? '<span class="quick-separator" aria-hidden="true"></span>' : ''}
            <span class="quick-group group-${BrunoQuickActionsCard._escapeAttr(group.key)}">
              ${group.items.map(({ item, index }) => this._button(item, index)).join('')}
            </span>
          `).join('')}
        </div>
      </div>
    `;

    this._wireActions();
  }

  _button(item, index) {
    const disabled = !item?.tap_action || item.tap_action.action === 'none';
    return `
      <button
        class="quick-button"
        type="button"
        title="${BrunoQuickActionsCard._escapeAttr(item?.label || item?.key || 'Acao')}"
        aria-label="${BrunoQuickActionsCard._escapeAttr(item?.label || item?.key || 'Acao')}"
        ${disabled ? 'aria-disabled="true"' : ''}
        data-action-index="${index}"
      >
        <ha-icon icon="${BrunoQuickActionsCard._escapeAttr(item?.icon || 'mdi:circle-outline')}"></ha-icon>
      </button>
    `;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoQuickActionsCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_QUICK_ACTIONS_CARD_TAG)) {
  customElements.define(BRUNO_QUICK_ACTIONS_CARD_TAG, BrunoQuickActionsCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_QUICK_ACTIONS_CARD_TAG,
  name: 'Bruno Quick Actions Card',
  preview: false,
  description: 'Isolated Bento quick actions card with preserved service and Wi-Fi popup behavior.',
});
