const BENTO_SIDEBAR_CARD_TAG = 'bento-sidebar-liquid-card';

class BentoSidebarCard extends HTMLElement {
  // Estados que NAO contam como atividade, para o microindicador da rail.
  static estadosInativos = new Set([
    '', 'off', 'idle', 'standby', 'closed', 'not_home', 'unknown', 'unavailable', 'none',
  ]);

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
    this._syncIndicators();
    this._syncOverflowHint();
  }

  // ── MICROINDICADOR DE ATIVIDADE ABAIXO DA DOBRA (2026-08-16) ─────────────
  //
  // Substitui a linha textual que ocupava uma faixa do grid de comodos. Ali ela
  // somava 30px de vao entre a 2a e a 3a faixa contra 8px das demais, e o vao
  // permanecia durante a rolagem, quando o indicador ja estava oculto.
  //
  // Aqui ele e ABSOLUTO sobre a rail: aparecer e sumir nao altera dimensao,
  // gap ou posicao de nada — nem do grid, nem dos botoes.
  //
  // O contador e de AMBIENTES com atividade, nao de eventos.
  //
  // ROLLBACK: remover este metodo, _contarAmbientesAtivos, _entidadeRelevante,
  // _ligarRolagemDaHome, _acharContainerDeRolagem, o markup .overflow-hint e o
  // bloco de CSS correspondente.

  _entidadeRelevante(entityId) {
    const estado = entityId ? this._hass?.states?.[entityId] : undefined;
    if (!estado) return false;
    const valor = String(estado.state || '').toLowerCase();
    const dominio = String(entityId).split('.')[0];
    if (['binary_sensor', 'light', 'switch'].includes(dominio)) return valor === 'on';
    if (dominio === 'media_player') return ['playing', 'paused', 'buffering', 'on'].includes(valor);
    return !BentoSidebarCard.estadosInativos.has(valor);
  }

  _contarAmbientesAtivos() {
    const salas = this._config?.overflow_hint?.rooms;
    if (!Array.isArray(salas)) return 0;
    return salas.filter((sala) => {
      const ents = Array.isArray(sala?.entities) ? sala.entities : [];
      return ents.some((id) => this._entidadeRelevante(id));
    }).length;
  }

  _syncOverflowHint() {
    // Sem o bloco na config (o caso da rail de comodos), nem o ouvinte de
    // rolagem chega a ser criado.
    if (!Array.isArray(this._config?.overflow_hint?.rooms)) return;
    const caixa = this.shadowRoot?.querySelector('.overflow-hint');
    if (!caixa) return;
    const n = this._contarAmbientesAtivos();
    caixa.hidden = n === 0;
    const numero = caixa.querySelector('.overflow-hint-count');
    if (numero && numero.textContent !== String(n)) numero.textContent = String(n);
    this._ligarRolagemDaHome();
  }

  /**
   * Some ao rolar, volta no topo.
   *
   * A rail vive no rail-slot da shell; quem rola e o content-slot, que e irmao
   * dela. Subir por parentNode para no primeiro shadow root, dai o salto pelo
   * host. Sem requestAnimationFrame: com a aba em segundo plano ele nao dispara
   * e o vinculo nunca seria feito.
   */
  _acharContainerDeRolagem() {
    let no = this.parentNode;
    while (no) {
      if (no instanceof ShadowRoot) {
        // Chegando na raiz da shell, o alvo e o irmao que rola.
        const slot = no.querySelector?.('.content-slot');
        if (slot) return slot;
        no = no.host;
        continue;
      }
      if (no instanceof HTMLElement) {
        no = no.parentNode;
        continue;
      }
      break;
    }
    return null;
  }

  _ligarRolagemDaHome() {
    if (this._alvoDeRolagem) return;
    if (!this._aoRolarHome) {
      this._aoRolarHome = () => {
        const rolou = (this._alvoDeRolagem?.scrollTop ?? 0) > 6;
        if (rolou === this._rolouHome) return;
        this._rolouHome = rolou;
        const caixa = this.shadowRoot?.querySelector('.overflow-hint');
        if (caixa) caixa.classList.toggle('is-scrolled', rolou);
      };
    }
    const alvo = this._acharContainerDeRolagem();
    if (!alvo) return;
    this._alvoDeRolagem = alvo;
    alvo.addEventListener('scroll', this._aoRolarHome, { passive: true });
    this._aoRolarHome();
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

    // NOVO (2026-07-09) — Fase 2 mobile: itens hide_on_phone alimentam o menu
    // "Mais" do dock (so visivel <=800px). Rail de comodos nao tem itens
    // ocultos => botao/menu nem renderizam.
    const ocultosNoPhone = [
      ...this._items('top_items').map((item, index) => ({ item, section: 'top', index })),
      ...this._items('bottom_items').map((item, index) => ({ item, section: 'bottom', index })),
    ].filter((entry) => entry.item?.hide_on_phone);

    // NOVO (rev. faixa-de-tiles) — o menu pode ser um GRUPO com lista explicita.
    // Sem "keys", ele continua sendo o "Mais" de 2026-07-09: tudo que esta
    // hide_on_phone entra nele (e o caso de rail.yaml).
    // Com "keys", entram SO os itens listados; os demais hide_on_phone apenas
    // somem do dock. Foi o que o banco de medicao pegou: com a regra antiga o
    // Power caia dentro de "Quartos", junto dos tres quartos.
    const maisCfg = this._config?.phone_more || {};
    const chavesDoGrupo = Array.isArray(maisCfg.keys) ? maisCfg.keys.map(String) : null;
    const phoneHiddenItems = chavesDoGrupo
      ? ocultosNoPhone.filter((e) => chavesDoGrupo.indexOf(String(e.item?.key)) !== -1)
      : ocultosNoPhone;

    // O rotulo e o icone do botao do menu. Na rail dos comodos ele vira
    // "Quartos" (item 16 do roteiro); em rail.yaml segue "Mais".
    // ANTERIOR (rollback): rotulo 'Mais' e icone 'more' fixos no markup.
    const maisLabel = BentoSidebarCard._escape(maisCfg.label || 'Mais');
    const maisIcone = BentoSidebarCard.icons[maisCfg.icon || 'more'] || BentoSidebarCard.icons.more;
    // As chaves agrupadas: a shell acende o botao do grupo quando a secao ativa
    // e uma delas. Sem isto, entrar num quarto apagava a rail inteira, porque o
    // botao daquele quarto esta com display:none no telefone.
    const maisKeys = BentoSidebarCard._escape(
      phoneHiddenItems.map((e) => e.item?.key).filter(Boolean).join(' '),
    );

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
          /* NOVO (2026-08-04) — feedback do usuario: os icones ficam pequenos no
             tablet. O ALVO DE TOQUE nunca foi o problema (medido: 70x51px, acima
             dos 48dp do Android e dos 44pt do iOS) — pequeno era o GLIFO.
             19 -> 24px cresce o botao para 70x56 e a rail passa a precisar de
             666px numa coluna de 720: folga de 54px, sem transbordar.
             NAO mexe na largura da coluna (86px), entao a area de conteudo e as
             seis subviews ficam intocadas.
             Abaixo de 690px de altura a media query no fim deste arquivo reduz
             para 18px, e isso continua valendo.
             ANTERIOR (rollback): esta linha nao existia — herdava os 19px do
             bloco base. Medicao: scripts/harness/rail-size.src.html */
          --icon-size: 24px;
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

        .nav-indicator {
          position: absolute;
          top: 5px;
          right: 7px;
          z-index: 3;
          display: grid;
          place-items: center;
          pointer-events: none;
          color: rgba(255,255,255,0.96);
          background: rgba(var(--accent),0.92);
          box-shadow: 0 0 9px rgba(var(--accent),0.36);
        }

        .nav-indicator[hidden] {
          display: none;
        }

        .nav-indicator[data-kind="dot"] {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .nav-indicator[data-kind="count"] {
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          font-size: 8px;
          line-height: 1;
          font-weight: 900;
        }
        /* UNIFORMIDADE GLOBAL DOS STATUS (2026-08-15).
           Mantem as dimensoes aprovadas dos botoes da rail. Somente o inicio
           do grupo superior sobe 6px para que o centro do Home coincida com o
           centro da primeira tile de 46px da Home e das subviews. */
        @media (min-width: 801px) {
          .rail { padding-top: 8px; }
        }
        /* sobrepõe a media query que estreitava o rail (50px) p/ manter rótulo */
        @media (max-height: 690px), (max-width: 900px) {
          :host { --rail-width: 86px; --button-size: 36px; --icon-size: 18px; }
        }

        /* ============================================================
           NOVO (2026-07-09) — MODO DOCK (phone <=800px, Opcao A mobile).
           A MESMA rail "deita" na horizontal e vira o dock inferior da
           bruno-shell (que no phone move o .rail-slot para a base).
           Bloco ADITIVO (regra de ouro): nada acima foi alterado; este
           @media apenas sobrepoe o layout vertical em telas estreitas.
           Itens com hide_on_phone: true no YAML somem do dock (ficam
           acessiveis so no tablet/desktop).
           ROLLBACK: remover este bloco @media (e, se desejar, os
           hide_on_phone do rail.yaml) => rail volta a ser vertical
           em qualquer largura.
           ============================================================ */
        /* Botao/menu "Mais" sao um recurso EXCLUSIVO do dock phone:
           fora do breakpoint ficam ocultos (a rail vertical mostra tudo). */
        .more-button,
        .more-sheet {
          display: none;
        }

        /* Fora do telefone o microindicador nao existe: a nocao de ambientes
           ocultos abaixo da dobra e exclusiva do dock. */
        .overflow-hint { display: none; }

        @media (max-width: 800px) {
          :host {
            --button-radius: 12px;
            /* NOVO (2026-08-13): +2px no icone sem alterar a altura da rail.
               ROLLBACK: remover esta linha restaura os 18px herdados da media
               query anterior. O padding do botao abaixo compensa exatamente
               esses 2px e preserva o filete e a geometria do dock. */
            --icon-size: 20px;
            position: relative;
          }
          /* ── MICROINDICADOR DE ATIVIDADE (2026-08-16) ─────────────────
             Absoluto sobre a rail: aparecer e sumir nao muda dimensao, gap
             nem posicao de nada. Fica ACIMA e a direita do botao Mais, com
             folga suficiente para nao ler como badge dele.
             So no telefone: fora deste media query o elemento nem existe. */
          /* Ancorado no canto superior direito da rail e projetado para CIMA:
             bottom: 100% poe a base do conjunto exatamente sobre o filete, e a
             margem abre a folga pedida. Fica acima e a direita do botao Mais,
             em diagonal — nao encosta nele e nao le como badge dele.

             Nada aqui participa do fluxo: aparecer e sumir nao desloca botao,
             nao muda a altura da rail e nao toca no filete nem na safe area. */
          .overflow-hint {
            position: absolute;
            bottom: 100%;
            margin-bottom: 3px;
            right: 10px;
            z-index: 3;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
            pointer-events: none;
            transition: opacity 140ms ease;
          }
          /* Some ao rolar por OPACIDADE: com display/visibility haveria troca
             de caixa, e o pedido e sumir sem reflow. */
          .overflow-hint[hidden] { display: none; }
          .overflow-hint.is-scrolled { opacity: 0; }

          .overflow-hint-dot {
            width: 17px;
            height: 17px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: var(--bruno-accent-amber, #f7c600);
            box-shadow: 0 0 9px rgba(247, 198, 0, 0.42);
          }

          .overflow-hint-count {
            font: 700 11px/1 system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            color: rgba(12, 14, 20, 0.92);
          }

          .overflow-hint-chevron {
            width: 11px;
            height: 11px;
            color: rgba(247, 198, 0, 0.8);
          }

          .rail {
            flex-direction: row;
            align-items: center;
            /* flex-start (nao space-evenly): com overflow horizontal,
               distribuicoes centradas deixam os itens da ESQUERDA fora do
               alcance do scroll. A distribuicao uniforme fica no .group.top. */
            justify-content: flex-start;
            width: 100%;
            height: auto;
            max-height: none;
            padding: 6px 8px calc(7px + env(safe-area-inset-bottom, 0px));
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .rail::-webkit-scrollbar { display: none; }

          /* ============================================================
             NOVO (2026-08-12) — RAIL PHONE SEM CONTAINER EXTERNO.
             O bloco "Caminho 2" acima ja deixa a superficie transparente,
             mas aqui a regra fica explicita e confinada ao breakpoint phone:
             nem variaveis de tema nem o estado de bottom sheet podem
             reintroduzir fundo, blur, borda, sombra ou raio de capsula.
             ANTERIOR (rollback): o dock herdava somente o visual de .rail do
             bloco "Caminho 2"; remover este trecho restaura essa heranca.
             ============================================================ */
          :host,
          .rail {
            background: transparent;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }
          .rail::before {
            display: none;
          }

          .group {
            width: auto;
            flex-direction: row;
            align-items: center;
            gap: 2px;
          }
          /* grupo superior espalha os itens pela largura toda quando cabem;
             grupo inferior (Power, oculto no phone) nao rouba espaco. */
          .group.top {
            flex: 1 1 auto;
            justify-content: space-evenly;
          }
          .group.bottom { flex: 0 0 auto; }
          .spacer { display: none; }
          .divider { width: 1px; height: 24px; margin: 0 6px; }
          .nav-button {
            width: auto;
            min-width: 50px;
            flex: 0 0 auto;
            /* ANTERIOR (rollback): padding: 6px 6px 5px. A soma vertical
               permanece identica; o conjunto icone+rotulo desce 2px. */
            padding: 8px 6px 1px;
          }
          .nav-button[data-hide-phone] { display: none; }
          .nav-label { font-size: 9px; }

          .more-button {
            display: inline-flex;
          }

          /* ============================================================
             NOVO (rev. faixa-de-tiles) — ITEM ATIVO SEM MOLDURA (item 17).
             O roteiro e explicito: a rail nao pode parecer pill/dock/card, e
             o item ativo nao pode virar um card em torno de si. No dock o
             fundo de .selected era justamente esse retangulo. Ele sai e o
             ativo passa a ser marcado por COR DE ACENTO + um indicador
             pequeno acima do icone.
             So no telefone: a rail vertical do tablet mantem o fundo.
             ROLLBACK: remover este trecho ate o fim do comentario de fecho.
             ============================================================ */
          .nav-button.selected,
          .nav-button.selected:hover,
          .nav-button.selected:focus,
          .nav-button.selected:focus-visible,
          .nav-button.more-button.is-open {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
          }
          .nav-button.selected .nav-label {
            color: rgb(var(--accent));
          }
          .nav-button.selected::after {
            content: "";
            display: block;
            position: absolute;
            top: 1px;
            left: 50%;
            width: 14px;
            height: 2px;
            border-radius: 999px;
            transform: translateX(-50%);
            background: rgb(var(--accent));
            box-shadow: 0 0 8px rgba(var(--accent), 0.55);
          }
          /* O menu aberto e ESTADO, nao selecao: acende so o glifo. */
          .nav-button.more-button.is-open svg {
            stroke: rgb(var(--accent));
          }
          /* ===== fim do trecho "item ativo sem moldura" ===== */

          /* Menu suspenso acima do dock com os itens hide_on_phone.
             :not([hidden]) preserva o toggle via atributo hidden. */
          .more-sheet:not([hidden]) {
            display: flex;
          }

          .more-sheet {
            position: absolute;
            right: 10px;
            bottom: calc(100% + 10px);
            z-index: 30;
            min-width: 216px;
            flex-direction: column;
            gap: 2px;
            padding: 8px;
            border-radius: 18px;
            border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
            background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.86), rgba(12,13,16,0.82)));
            box-shadow: var(--bruno-liquid-popup-shadow, 0 18px 36px rgba(0,0,0,0.38));
            -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
            backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
          }

          .more-item {
            appearance: none;
            -webkit-appearance: none;
            display: grid;
            grid-template-columns: 22px minmax(0, 1fr) auto;
            align-items: center;
            column-gap: 10px;
            padding: 10px 10px;
            margin: 0;
            text-align: left;
            color: rgba(255,255,255,0.86);
            font-size: 12.5px;
            font-weight: 600;
            background: transparent;
            border: 0;
            border-radius: 12px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }

          .more-item:active {
            background: rgba(255,255,255,0.08);
          }

          .more-item svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.55;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .more-item .nav-indicator {
            position: static;
          }
        }
      </style>
      <div class="rail" role="navigation" aria-label="Bento sidebar">
        <div class="group top">
          ${this._items('top_items').map((item, index) => this._button(item, 'top', index)).join('')}
          ${phoneHiddenItems.length ? `
            <button class="nav-button more-button" type="button" title="${maisLabel}" aria-label="${maisLabel}" data-more-toggle data-group-keys="${maisKeys}">
              ${maisIcone}
              <span class="nav-label">${maisLabel}</span>
            </button>
          ` : ''}
        </div>
        <div class="spacer" aria-hidden="true"></div>
        <div class="group bottom">
          ${this._items('bottom_items').map((item, index) => this._button(item, 'bottom', index)).join('')}
        </div>
      </div>
      <!-- Microindicador: irmao da .rail, nao filho — a .rail tem
           overflow-x: auto e recortaria um filho absoluto. -->
      <div class="overflow-hint" role="status" aria-label="Ambientes com atividade abaixo" hidden>
        <span class="overflow-hint-dot"><span class="overflow-hint-count">0</span></span>
        <svg class="overflow-hint-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      ${phoneHiddenItems.length ? `
        <div class="more-sheet" id="moreSheet" hidden>
          ${phoneHiddenItems.map(({ item, section, index }) => `
            <button class="more-item" type="button" data-section="${section}_items" data-index="${index}">
              ${BentoSidebarCard.icons[item?.icon] || BentoSidebarCard.icons.circle}
              <span>${BentoSidebarCard._escape(item?.label || item?.key || 'Item')}</span>
              ${this._indicatorMarkup(item)}
            </button>
          `).join('')}
        </div>
      ` : ''}
    `;

    this.shadowRoot.querySelectorAll('.nav-button').forEach((button) => {
      button.addEventListener('click', () => {
        button.classList.add('is-pressed');
        window.setTimeout(() => button.classList.remove('is-pressed'), 180);
        // NOVO (2026-07-09): navegar por outro item fecha o menu "Mais".
        if (!button.hasAttribute('data-more-toggle')) this._closeMoreSheet();
        const section = button.dataset.section;
        const index = Number(button.dataset.index);
        const item = this._items(section)[index];
        this._handleAction(item);
      });
    });

    // NOVO (2026-07-09) — Fase 2 mobile: toggle + itens do menu "Mais".
    this._moreSheetEl = this.shadowRoot.getElementById('moreSheet');
    this._moreToggleEl = this.shadowRoot.querySelector('[data-more-toggle]');
    if (this._moreToggleEl && this._moreSheetEl) {
      this._moreToggleEl.addEventListener('click', () => {
        const open = this._moreSheetEl.hidden;
        this._moreSheetEl.hidden = !open;
        // ANTERIOR (rollback rev. faixa-de-tiles): classList.toggle('selected', open)
        // O estado ABERTO usava a mesma classe do item ATIVO. Com o grupo
        // "Quartos", que a shell acende quando um quarto e a secao atual,
        // fechar o menu apagava a selecao. Classe propria resolve.
        this._moreToggleEl.classList.toggle('is-open', open);
      });
      this._moreSheetEl.querySelectorAll('.more-item').forEach((button) => {
        button.addEventListener('click', () => {
          const item = this._items(button.dataset.section)[Number(button.dataset.index)];
          this._closeMoreSheet();
          this._handleAction(item);
        });
      });
    }
    this._syncIndicators();
  }

  // NOVO (2026-07-09) — Fase 2 mobile: fecha o menu "Mais" do dock.
  _closeMoreSheet() {
    if (this._moreSheetEl && !this._moreSheetEl.hidden) this._moreSheetEl.hidden = true;
    // ANTERIOR (rollback rev. faixa-de-tiles): remove('selected') — ver a nota
    // no toggle acima. So o estado de abertura sai daqui; a selecao e da shell.
    this._moreToggleEl?.classList.remove('is-open');
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
        ${item?.hide_on_phone ? 'data-hide-phone=""' : ''}
        ${ariaDisabled}
      >
        ${icon}
        <!-- NOVO (Caminho 2): rótulo sob o ícone. Rollback: remover este span
             e o bloco de estilo "Caminho 2" no <style>. -->
        <span class="nav-label">${label}</span>
        ${this._indicatorMarkup(item)}
      </button>
      ${item?.divider_after ? '<span class="divider" aria-hidden="true"></span>' : ''}
    `;
  }

  _indicatorMarkup(item) {
    if (!item?.indicator) return '';
    const model = this._indicatorModel(item);
    return `<span class="nav-indicator" data-kind="${model.kind}" ${model.active ? '' : 'hidden'}>${model.text}</span>`;
  }

  _indicatorModel(item) {
    const config = item?.indicator || {};
    if (config.type === 'updates') {
      const states = this._hass?.states || {};
      const entityCount = Object.entries(states)
        .filter(([entityId, state]) => entityId.startsWith('update.') && state?.state === 'on')
        .length;
      const aggregate = Number(states['sensor.hassio_updates_available']?.state) || 0;
      const count = Math.max(entityCount, aggregate);
      return {
        active: count > 0,
        kind: 'count',
        text: count > 99 ? '99+' : String(count),
      };
    }
    const stateObj = this._hass?.states?.[config.entity];
    const raw = config.attribute ? stateObj?.attributes?.[config.attribute] : stateObj?.state;
    if (config.type === 'count') {
      const count = Math.max(0, Number.parseInt(raw, 10) || 0);
      return {
        active: count > 0,
        kind: 'count',
        text: count > 99 ? '99+' : String(count),
      };
    }
    const activeStates = Array.isArray(config.active_states) ? config.active_states : ['on'];
    const active = activeStates.includes(String(raw ?? '').toLowerCase());
    return { active, kind: 'dot', text: '' };
  }

  _syncIndicators() {
    const root = this.shadowRoot;
    if (!root) return;
    root.querySelectorAll('[data-section][data-index]').forEach((button) => {
      const item = this._items(button.dataset.section)[Number(button.dataset.index)];
      if (!item?.indicator) return;
      const indicator = button.querySelector('.nav-indicator');
      if (!indicator) return;
      const model = this._indicatorModel(item);
      indicator.dataset.kind = model.kind;
      indicator.textContent = model.text;
      indicator.hidden = !model.active;
    });
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

BentoSidebarCard.icons = new Proxy({}, {
  get(_target, key) {
    return globalThis.BrunoIcons?.render(String(key || 'circle'))
      || globalThis.BrunoIcons?.render('circle')
      || '';
  },
});

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
