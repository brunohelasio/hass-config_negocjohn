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
  {
    key: 'refresh',
    icon: 'mdi:refresh',
    label: 'Atualizar',
    group: 'actions',
    tap_action: {
      action: 'fire-dom-event',
      bruno_action: 'refresh',
    },
  },
];

const BRUNO_QUICK_ACTIONS_INLINE_ICONS = new Proxy({}, {
  get(_target, key) {
    return globalThis.BrunoIcons?.render(String(key || 'circle'))
      || globalThis.BrunoIcons?.render('circle')
      || '';
  },
});

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
          /* PADRONIZAÇÃO: dock = 54px, igual à linha da faixa inferior da régua da
             shell (topo 48 / base 54) e à faixa inferior das subviews. ANTERIOR:
             56px (estourava 2px a linha de 54px e desalinhava o filete). */
          --rail-size: 54px;
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

        /* ORIGINAL (rollback — dock em PÍLULA flutuante):
        .quick-dock {
          width: max-content;  border-radius: 999px;
          border: var(--bruno-liquid-rail-border, ...);
          background: var(--bruno-liquid-rail-background, ...glass...);
          box-shadow: var(--bruno-liquid-rail-shadow, ...);
          backdrop-filter: var(--bruno-liquid-rail-filter, ...);
          overflow: hidden;
        }
        (valores completos preservados no histórico git; rollback: restaurar este bloco
         e reverter ::before/::after abaixo) */
        /* NOVO (Caminho 2): dock RENTE — faixa cheia, sem pílula, integrada ao
           painel, com filete superior (mais forte no centro). */
        .quick-dock {
          position: relative;
          isolation: isolate;
          width: 100%;
          max-width: 100%;
          height: var(--rail-size);
          min-height: var(--rail-size);
          display: inline-flex;
          /* NOVO: conteúdo ancorado na BASE (era center) p/ alinhar com o botão
             Power, que fica no fundo do rail. ANTERIOR (rollback): align-items: center; */
          align-items: flex-end;
          justify-content: center;
          gap: 8px;
          padding: 0 8px 3px;
          color: rgba(255,255,255,0.86);
          border: none;
          /* TRANSPARENTE: dock funde com a imagem; legibilidade pela BORDA
             ATMOSFÉRICA escurecida do backdrop (vinheta inferior). */
          border-radius: 0;
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: none;
          overflow: visible;
        }

        .quick-dock::before,
        .quick-dock::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
        }

        /* NOVO (Caminho 2): em vez do sheen da pílula, o ::before vira o filete
           superior do dock (mais forte no centro). ROLLBACK: restaurar o sheen. */
        .quick-dock::before {
          inset: auto;
          left: 0;
          right: 0;
          top: 0;
          height: 1px;
          z-index: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent);
          opacity: 1;
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
          /* NOVO (Caminho 2): sem edge-glow de pílula. ROLLBACK: voltar a 0.64. */
          opacity: 0;
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

        .quick-section-label {
          position: relative;
          z-index: 2;
          flex: 0 0 auto;
          height: var(--button-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px 0 6px;
          color: rgba(248,251,255,0.56);
          font-size: 10px;
          line-height: 1;
          font-weight: 820;
          text-transform: uppercase;
          white-space: nowrap;
          text-shadow: 0 2px 10px rgba(0,0,0,0.24);
        }

        .quick-separator {
          position: relative;
          z-index: 2;
          width: 1px;
          height: 28px;
          margin: 0 3px;
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
            gap: 6px;
          }

          .quick-section-label {
            font-size: 9px;
            padding: 0 2px 0 4px;
          }
        }

        /* ============================================================
           NOVO — PADRONIZAÇÃO COM O RAIL (bloco ADITIVO, regra de ouro).
           ROLLBACK: remover este bloco => volta aos botões em pílula.
           - ícones com a MESMA cor/peso/tratamento do rail (sóbrio 0.60, flat);
           - estrutura ÍCONE em cima + RÓTULO curto embaixo (labels já curtos);
           - dock ocupa a faixa INTEIRA e CENTRALIZA o conteúdo no eixo vertical
             (corrige o viés p/ cima: antes o dock de 56px ficava centrado nos
             74px e a divisória no topo dele -> sobrava mais espaço embaixo);
           - títulos de seção pequenos mantidos + separador discreto mantido.
           ============================================================ */
        .quick-dock {
          height: 100%;          /* ocupa os 74px da faixa */
          min-height: 0;
          align-items: center;   /* centraliza o conteúdo verticalmente */
          gap: 14px;             /* respiro entre seções/separador */
        }
        .quick-group { gap: 12px; }   /* respiro lateral entre botões (corrige "Notebook" cortado) */
        .quick-button {
          width: auto;
          min-width: var(--button-size);
          max-width: none;
          height: auto;
          max-height: none;
          flex-direction: column;     /* ícone em cima, rótulo embaixo */
          gap: 4px;
          padding: 7px 10px 6px;
          min-width: 54px;            /* garante espaço p/ o rótulo (ex.: Notebook) */
          border-radius: 13px;        /* = rail (flat, sem pílula) */
          color: rgba(255,255,255,0.60);  /* = --icon-neutral do rail */
          -webkit-tap-highlight-color: transparent;
        }
        .quick-button::before,
        .quick-button::after { display: none; }   /* sem sheen/sublinhado (= rail) */
        .quick-button:hover,
        .quick-button:focus,
        .quick-button:focus-visible {
          background: rgba(255,255,255,0.05);
          border-color: transparent;
          box-shadow: none;
          color: rgba(255,255,255,0.92);
          outline: none;
        }
        .quick-button svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));  /* = rail */
        }
        .quick-button .quick-label {
          display: block;
          position: static;
          align-self: center;
          grid-area: auto;
          margin: 0;
          max-width: 88px;
          font-size: 9.5px;
          line-height: 1.05;
          font-weight: 600;
          color: inherit;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .quick-button .quick-kind { display: none; }   /* só um rótulo curto */
        /* título de seção pequeno, alinhado ao centro vertical do conteúdo */
        .quick-section-label {
          height: auto;
          align-self: center;
          color: rgba(248,251,255,0.46);
        }
        .quick-separator { align-self: center; }  /* separador discreto mantido */
        /* NOVO (2026-07-24) — feedback Home V2: dock SEM linhas divisórias
           (filete superior + separador vertical entre grupos removidos).
           ROLLBACK: remover estas duas regras. */
        .quick-dock::before { display: none; }
        .quick-separator { display: none; }
      </style>

      <div class="quick-card">
        <div class="quick-dock" aria-label="Acoes rapidas">
          ${groups.map((group, groupIndex) => `
            ${groupIndex > 0 ? '<span class="quick-separator" aria-hidden="true"></span>' : ''}
            <span class="quick-section-label">${BrunoQuickActionsCard._escape(this._groupTitle(group.key))}</span>
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

  _groupTitle(key) {
    // ANTERIOR (rollback): return key === 'scenes' ? 'Cenas' : 'A\u00e7\u00f5es r\u00e1pidas';
    // NOVO (2026-07-24) \u2014 HOME V2: grupo 'sala' rotulado "Sala" (controles
    // rapidos Corredor/TV/A-C migrados do card especial da Sala para o dock).
    if (key === 'scenes') return 'Cenas';
    if (key === 'sala') return 'Sala';
    return 'A\u00e7\u00f5es r\u00e1pidas';
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
