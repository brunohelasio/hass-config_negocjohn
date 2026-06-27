const BENTO_SIDEBAR_CARD_TAG = 'bento-sidebar-liquid-card';

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

  // --- CÓDIGO ORIGINAL COMENTADO (so disparava hass-navigate; nao roteava no HA) ---
  // _navigate(path) {
  //   if (!path) return;
  //   this.dispatchEvent(new CustomEvent('hass-navigate', {
  //     detail: { path },
  //     bubbles: true,
  //     composed: true,
  //   }));
  // }
  // --- FIM CÓDIGO ORIGINAL ---

  // NOVO: mesmo mecanismo das subviews (bruno-*-subview.js). Alem do evento
  // hass-navigate, faz history.pushState + location-changed (que o roteador do
  // HA realmente reconhece) e resolve paths relativos contra o dashboard atual.
  _navigate(path) {
    if (!path) return;
    const resolvedPath = this._resolveNavigationPath(path);
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: resolvedPath },
      bubbles: true,
      composed: true,
    }));

    globalThis.setTimeout?.(() => {
      if (!resolvedPath || globalThis.location?.pathname === resolvedPath) return;
      globalThis.history?.pushState?.(null, '', resolvedPath);
      globalThis.dispatchEvent?.(new CustomEvent('location-changed', { detail: { replace: false } }));
    }, 80);
  }

  _resolveNavigationPath(path) {
    if (!path) return '/';
    if (path.startsWith('/')) return path;

    const current = globalThis.location?.pathname || '';
    const first = current.split('/').filter(Boolean)[0];
    return `/${first || 'ngocjohn-main'}/${path}`;
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
          --rail-width: 56px;
          --rail-radius: 999px;
          --rail-padding-top: 13px;
          --rail-padding-bottom: 14px;
          --button-size: 39px;
          --button-radius: 999px;
          --icon-size: 19px;
          --group-gap: 8px;
          --glass-line: rgba(255,255,255,0.14);
          --glass-line-soft: rgba(255,255,255,0.07);
          --icon-neutral: rgba(255,255,255,0.74);
          --icon-active: rgba(245,250,255,0.96);
          --accent: 150, 190, 255;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin: 0;
          padding: 0;
          contain: layout style;
        }

        .rail {
          width: var(--rail-width);
          height: auto;
          min-height: 0;
          max-height: calc(100% - 6px);
          box-sizing: border-box;
          position: relative;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--rail-padding-top) 0 var(--rail-padding-bottom);
          background: var(--bruno-liquid-rail-background,
            radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
            radial-gradient(38px 110px at 92% 86%, rgba(var(--accent),0.10), transparent 68%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
            linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
          );
          backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
          -webkit-backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
          border: var(--bruno-liquid-rail-border, 1px solid rgba(255,255,255,0.11));
          border-radius: var(--rail-radius);
          box-shadow: var(--bruno-liquid-rail-shadow,
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 1px 0 0 rgba(255,255,255,0.12),
            inset -1px -1px 0 rgba(255,255,255,0.030),
            0 18px 44px rgba(0,0,0,0.24),
            0 0 24px rgba(110,150,210,0.08)
          );
          overflow: hidden;
        }

        .rail::before {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .rail::before {
          inset: 1px;
          border-radius: calc(var(--rail-radius) - 1px);
          background: var(--bruno-liquid-rail-sheen,
            radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
            radial-gradient(42px 70px at 94% 18%, rgba(var(--accent),0.16), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
            linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-rail-sheen-opacity, 0.78);
        }

        .group {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: var(--group-gap);
          flex: 0 0 auto;
          position: relative;
          z-index: 1;
        }

        .spacer {
          display: none;
        }

        .divider {
          position: relative;
          z-index: 1;
          width: 30px;
          height: 1px;
          margin: 8px 0;
          flex: 0 0 auto;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
          box-shadow: 0 1px 0 rgba(0,0,0,0.18);
          opacity: 0.72;
        }

        .nav-button {
          width: var(--button-size);
          height: var(--button-size);
          min-width: var(--button-size);
          min-height: var(--button-size);
          max-width: var(--button-size);
          max-height: var(--button-size);
          box-sizing: border-box;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          color: var(--icon-neutral);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--button-radius);
          box-shadow: none;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          line-height: 0;
          overflow: hidden;
          transition:
            background 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        .nav-button::before,
        .nav-button::after {
          content: "";
          position: absolute;
          pointer-events: none;
          opacity: 0;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .nav-button::before {
          inset: 1px;
          border-radius: calc(var(--button-radius) - 1px);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 58%),
            linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00));
          transform: translateY(-3px);
        }

        .nav-button::after {
          left: 50%;
          bottom: 4px;
          width: 12px;
          height: 2px;
          border-radius: 999px;
          background: rgba(var(--accent), 0.92);
          box-shadow: 0 0 12px rgba(var(--accent), 0.70);
          transform: translateX(-50%) scaleX(0.62);
        }

        .nav-button:hover {
          color: rgba(255,255,255,0.90);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.040));
          border-color: rgba(255,255,255,0.13);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.11),
            0 6px 14px rgba(0,0,0,0.16);
        }

        .nav-button:hover::before {
          opacity: 0.72;
          transform: translateY(0);
        }

        .nav-button:active {
          transform: translateY(1px) scale(0.98);
        }

        .nav-button.is-pressed {
          transform: scale(0.96);
        }

        .nav-button:focus-visible {
          border-color: rgba(var(--accent), 0.52);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 0 0 3px rgba(var(--accent), 0.16);
        }

        .nav-button[aria-disabled="true"] {
          cursor: default;
        }

        .nav-button[aria-disabled="true"]:active {
          transform: none;
        }

        .nav-button.selected {
          color: white;
          background: var(--bruno-liquid-selected-blue-background,
            radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 62%),
            linear-gradient(180deg, rgba(105,150,230,0.68), rgba(59,92,178,0.54))
          );
          border-color: var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.38));
          box-shadow: var(--bruno-liquid-selected-blue-shadow,
            inset 0 1px 0 rgba(255,255,255,0.32),
            0 0 20px rgba(96,165,250,0.32)
          );
          animation: selected-breathe 4.8s ease-in-out infinite;
        }

        .nav-button.selected::before {
          opacity: 0;
        }

        .nav-button.selected::after {
          opacity: 0;
        }

        .nav-button.selected:hover {
          background:
            radial-gradient(circle at 50% 18%, rgba(168,202,255,0.58), transparent 62%),
            linear-gradient(180deg, rgba(118,164,242,0.72), rgba(66,100,190,0.58));
        }

        .nav-button svg {
          width: var(--icon-size);
          height: var(--icon-size);
          display: block;
          flex: 0 0 var(--icon-size);
          fill: none;
          stroke: currentColor;
          stroke-width: 1.55;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
        }

        @keyframes selected-breathe {
          0%, 100% {
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.22),
              inset 0 -1px 0 rgba(255,255,255,0.06),
              0 8px 18px rgba(0,0,0,0.24),
              0 0 18px rgba(var(--accent),0.16);
          }
          50% {
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.25),
              inset 0 -1px 0 rgba(255,255,255,0.08),
              0 10px 22px rgba(0,0,0,0.26),
              0 0 28px rgba(var(--accent),0.28);
          }
        }

        @media (max-height: 760px) {
          :host {
          --rail-padding-top: 8px;
          --rail-padding-bottom: 9px;
          --group-gap: 5px;
          }
        }

        @media (max-height: 690px), (max-width: 900px) {
          :host {
            --rail-width: 50px;
            --button-size: 35px;
            --icon-size: 17px;
            --group-gap: 6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-button,
          .nav-button::before,
          .nav-button::after,
          .nav-button.selected {
            animation: none !important;
            transition: none !important;
          }
        }

        /* ============================================================
           NOVO — CAMINHO 2 (rail rente, integrado, com rótulos e
           seleção discreta). Bloco ADITIVO (regra de ouro): fica ABAIXO
           e sobrepõe o visual de pílula flutuante definido acima, sem
           apagar nada. ROLLBACK: remover este bloco + o <span class="nav-label">
           em _button() => volta à pílula só-ícone original.
           ============================================================ */
        :host {
          --rail-width: 86px;
          --button-radius: 13px;
          --icon-neutral: rgba(255,255,255,0.60);
          /* NOVO: espaçamento uniforme um pouco maior (era 8px) agora que os
             separadores foram removidos. */
          --group-gap: 10px;
          align-items: stretch;
          justify-content: stretch;
        }
        .rail {
          width: 100%;
          height: 100%;
          max-height: none;
          justify-content: flex-start;
          padding: 14px 8px 12px;
          /* TRANSPARENTE: a legibilidade do rail sobre a foto é garantida pela
             BORDA ATMOSFÉRICA escurecida do backdrop (vinheta na shell), não por
             faixa/blur aqui. Rail funde com a imagem. */
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          border: none;
          border-radius: 0;               /* sem pílula */
          box-shadow: none;
        }
        .rail::before { display: none; }  /* remove o brilho/sheen da cápsula */
        .group { align-items: stretch; }
        .spacer { display: block; flex: 1 1 auto; }  /* empurra o grupo inferior p/ baixo */
        .divider { width: 64%; margin: 8px auto; }
        .nav-button {
          width: 100%;
          height: auto;
          min-width: 0; min-height: 0; max-width: none; max-height: none;
          flex-direction: column;
          gap: 4px;
          padding: 8px 2px 7px;
          border-radius: var(--button-radius);
          line-height: 0;
          -webkit-tap-highlight-color: transparent;  /* sem flash de toque no tablet */
        }
        .nav-button::before,
        .nav-button::after { display: none; }   /* sem brilho/sublinhado */
        /* hover/foco/toque DISCRETOS e IGUAIS em PC e tablet. */
        .nav-button:hover,
        .nav-button:focus,
        .nav-button:focus-visible {
          background: rgba(255,255,255,0.05);
          border-color: transparent;
          box-shadow: none;
          outline: none;
        }
        /* seleção DISCRETA. IMPORTANTE incluir :hover/:focus do selecionado —
           no tablet o toque dispara :hover "grudado" (sticky hover) e sem isto o
           azul ANTIGO de .selected:hover reaparecia (so no toque). */
        .nav-button.selected,
        .nav-button.selected:hover,
        .nav-button.selected:focus,
        .nav-button.selected:focus-visible {
          background: rgba(255,255,255,0.085);
          border-color: transparent;
          box-shadow: none;
          animation: none;
        }
        .nav-button.selected svg,
        .nav-button.selected:hover svg { stroke: rgb(var(--accent)); }
        .nav-label {
          display: block;
          margin-top: 1px;
          font-size: 9.5px;
          line-height: 1.05;
          font-weight: 600;
          color: inherit;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }
        /* sobrepõe a media query que estreitava o rail (50px) p/ manter rótulo */
        @media (max-height: 690px), (max-width: 900px) {
          :host { --rail-width: 86px; --button-size: 36px; --icon-size: 18px; }
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
        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 180);
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
        data-key="${BentoSidebarCard._escape(item?.key || '')}"
        ${ariaDisabled}
      >
        ${icon}
        <!-- NOVO (Caminho 2): rótulo sob o ícone. Rollback: remover este span
             e o bloco de estilo "Caminho 2" no <style>. -->
        <span class="nav-label">${label}</span>
      </button>
      ${item?.divider_after ? '<span class="divider" aria-hidden="true"></span>' : ''}
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
  // NOVO: ícones de CÔMODO (para reusar este componente como rail das subviews).
  // Mesmo estilo SVG (stroke) dos demais -> réplica perfeita do rail principal.
  sala: '<svg viewBox="0 0 24 24"><path d="M5 11V9.5A3.5 3.5 0 0 1 8.5 6h7A3.5 3.5 0 0 1 19 9.5V11"/><path d="M4 12.5A2.5 2.5 0 0 1 6.5 10H7a2 2 0 0 1 2 2v1h6v-1a2 2 0 0 1 2-2h.5A2.5 2.5 0 0 1 20 12.5V18H4v-5.5z"/><path d="M6 18v2M18 18v2"/></svg>',
  office: '<svg viewBox="0 0 24 24"><path d="M4 5h16v10H4z"/><path d="M9 19h6M12 15v4"/><path d="M7 21h10"/></svg>',
  cozinha: '<svg viewBox="0 0 24 24"><path d="M5 5h14v15H5z"/><path d="M5 10h14"/><path d="M9 7h.01M15 7h.01"/><path d="M8 14h8v4H8z"/></svg>',
  casal: '<svg viewBox="0 0 24 24"><path d="M4 11V5h16v6"/><path d="M4 11h16a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2z"/><path d="M7 9h3M14 9h3"/><path d="M3 18v2M21 18v2"/></svg>',
  marina: '<svg viewBox="0 0 24 24"><path d="M5 11V6h9a4 4 0 0 1 4 4v1"/><path d="M5 11h14a2 2 0 0 1 2 2v5H3v-5a2 2 0 0 1 2-2z"/><path d="M7 9h4"/><path d="M4 18v2M20 18v2"/></svg>',
  miguel: '<svg viewBox="0 0 24 24"><path d="M5 11V6h9a4 4 0 0 1 4 4v1"/><path d="M5 11h14a2 2 0 0 1 2 2v5H3v-5a2 2 0 0 1 2-2z"/><path d="M7 9h4"/><path d="M4 18v2M20 18v2"/></svg>',
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