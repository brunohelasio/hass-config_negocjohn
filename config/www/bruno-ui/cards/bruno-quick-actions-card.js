const BRUNO_QUICK_ACTIONS_CARD_TAG = 'bruno-quick-actions-card';

const BRUNO_QUICK_ACTIONS_DEFAULT_ITEMS = [
  {
    key: 'lights_off',
    icon: 'mdi:lightbulb-off-outline',
    label: 'Luzes',
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

const BRUNO_QUICK_ACTIONS_INLINE_ICONS = {
  lights_off: '<svg viewBox="0 0 24 24"><path d="M9 18h6"/><path d="M10 22h4"/><path d="M2 2l20 20"/><path d="M8.3 5.7A6 6 0 0 1 18 10c0 2.2-1.2 3.2-2.2 4.2-.5.5-.8 1.1-.8 1.8"/><path d="M10.2 14.2c-.9-.9-2.2-1.9-2.2-4.2 0-.8.2-1.5.5-2.2"/></svg>',
  wifi: '<svg viewBox="0 0 24 24"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>',
  movies: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M4 8h16M4 16h16M8 4v16M16 4v16"/></svg>',
  laptop: '<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="10" rx="1.6"/><path d="M3 18h18"/><path d="M7 18l1.2-4h7.6L17 18"/></svg>',
  sofa: '<svg viewBox="0 0 24 24"><path d="M6 11V8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3"/><path d="M4 12a2 2 0 0 0-2 2v5h20v-5a2 2 0 0 0-2-2"/><path d="M7 19v2M17 19v2"/></svg>',
  circle: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/></svg>',
};

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
      let pointerHandledAt = 0;
      const run = () => {
        if (button.getAttribute('aria-disabled') === 'true') return;
        const item = this._items()[Number(button.dataset.actionIndex)];
        globalThis.BrunoLiquidGlass?.feedback?.('tap');
        this._runAction(item?.tap_action || item?.action);
      };
      const stopOnly = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };

      button.addEventListener('pointerdown', (event) => {
        stopOnly(event);
        if (button.getAttribute('aria-disabled') === 'true') return;
        button.classList.add('is-pressed');
        button.setPointerCapture?.(event.pointerId);
      });

      button.addEventListener('pointerup', (event) => {
        stopOnly(event);
        if (button.getAttribute('aria-disabled') === 'true') return;
        button.classList.remove('is-pressed');
        button.releasePointerCapture?.(event.pointerId);
        pointerHandledAt = Date.now();
        run();
      });

      button.addEventListener('pointercancel', () => {
        button.classList.remove('is-pressed');
      });

      button.addEventListener('pointerleave', () => {
        button.classList.remove('is-pressed');
      });

      button.addEventListener('click', (event) => {
        stopOnly(event);
        if (Date.now() - pointerHandledAt < 420) return;
        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 180);
        run();
      });

      button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        stopOnly(event);
        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 180);
        run();
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
          --rail-size: 56px;
          --button-size: 39px;
          --button-radius: 999px;
          --icon-size: 19px;
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
          height: var(--rail-size);
          min-height: var(--rail-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 0 8px;
          color: rgba(255,255,255,0.86);
          border: var(--bruno-liquid-rail-border, 1px solid rgba(255,255,255,0.16));
          border-radius: 999px;
          background: var(--bruno-liquid-rail-background,
            radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
            radial-gradient(38px 110px at 92% 86%, rgba(var(--accent),0.10), transparent 68%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
            linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
          );
          box-shadow: var(--bruno-liquid-rail-shadow,
            inset 0 1px 0 rgba(255,255,255,0.23),
            inset 1px 0 0 rgba(255,255,255,0.11),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.31),
            0 0 24px rgba(110,150,210,0.075)
          );
          backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
          -webkit-backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
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
          background: var(--bruno-liquid-rail-sheen,
            radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
            radial-gradient(42px 70px at 94% 18%, rgba(var(--accent),0.16), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
            linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-rail-sheen-opacity, 0.78);
        }

        .quick-dock::after {
          inset: 0;
          padding: 1px;
          z-index: 1;
          background: var(--bruno-liquid-dock-edge-glow,
            linear-gradient(125deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08) 34%, rgba(255,255,255,0.026) 62%, rgba(255,190,120,0.17) 100%)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: 0.64;
        }

        .quick-group {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          flex: 0 0 auto;
        }

        .quick-separator {
          position: relative;
          z-index: 2;
          width: 1px;
          height: 28px;
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
          flex: 0 0 var(--button-size);
          width: var(--button-size);
          height: var(--button-size);
          min-width: var(--button-size);
          min-height: var(--button-size);
          max-width: var(--button-size);
          max-height: var(--button-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          color: rgba(255,255,255,0.86);
          border: 1px solid transparent;
          border-radius: var(--button-radius);
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
          transform: scale(0.96);
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

        .quick-button svg {
          width: var(--icon-size);
          height: var(--icon-size);
          flex: 0 0 var(--icon-size);
          display: block;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.55;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.24));
        }

        .quick-label,
        .quick-kind {
          display: none;
          position: relative;
          z-index: 2;
          min-width: 0;
          text-align: left;
        }

        .quick-label {
          grid-area: label;
          align-self: end;
          font-size: 9.6px;
          line-height: 1.06;
          font-weight: 800;
          color: rgba(255,255,255,0.92);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .quick-kind {
          grid-area: meta;
          align-self: start;
          margin-top: 1px;
          font-size: 8.6px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.48);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 800px) {
          .quick-card {
            justify-content: center;
            padding: 0 8px;
          }

          .quick-dock {
            --rail-size: 50px;
            --button-size: 35px;
            --icon-size: 17px;
            padding: 0 6px;
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
        ${BrunoQuickActionsCard._icon(item)}
        <span class="quick-label">${BrunoQuickActionsCard._escape(item?.label || item?.key || 'Acao')}</span>
        <span class="quick-kind">${BrunoQuickActionsCard._escape(this._kindLabel(item))}</span>
      </button>
    `;
  }

  _kindLabel(item) {
    if (item?.kind_label) return item.kind_label;
    return item?.group === 'scenes' ? 'Cena' : 'A\u00e7\u00e3o';
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

  static _icon(item) {
    const key = item?.icon_key || item?.key || String(item?.icon || '').replace(/^mdi:/, '');
    return BRUNO_QUICK_ACTIONS_INLINE_ICONS[key] || BRUNO_QUICK_ACTIONS_INLINE_ICONS.circle;
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
