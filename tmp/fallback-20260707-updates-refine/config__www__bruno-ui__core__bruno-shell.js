// bruno-shell.js — App-shell em JavaScript (Etapa 1).
//
// Objetivo: uma barra lateral FIXA (rail) que nunca re-monta + uma regiao de
// conteudo que troca de SECAO no lugar (sem trocar de view do HA). A view do HA
// e unica (type: panel) e seu unico card e <bruno-shell>; por isso a rail nunca
// re-monta e nao ha "degrau" ao alternar.
//
// Principios (ver docs/bruno-shell-spec.md):
//  - REUSA os cards/subviews existentes via window.loadCardHelpers() — NAO edita
//    nenhum conteudo. A shell so instancia e posiciona.
//  - Roteamento por hash (#home, #cameras, ...). Mudar o hash NAO troca a view.
//  - Itens de SECAO na rail usam action: fire-dom-event com `bruno_section: <key>`;
//    a shell intercepta o evento `ll-custom`, troca a secao e atualiza a selecao
//    da rail (sem reconstruir a rail).
//  - Itens de POPUP/navegacao da rail seguem inalterados (overlays/navegacao).

const BRUNO_SHELL_TAG = 'bruno-shell';

class BrunoShell extends HTMLElement {
  constructor() {
    super();
    this._activeKey = null;
    this._railEl = null;
    this._sectionEl = null;
    this._helpers = null;
    this._built = false;
    this._onHashChange = () => this._syncFromHash();
    this._onConfigClick = (event) => this._handleConfigClick(event);
    this._onThemeChanged = () => {
      if (this._configOverlayEl?.dataset.panel === 'config') this._renderConfigPanel();
    };
    this._onLlCustom = (event) => {
      const detail = (event && event.detail) || {};
      if (detail.bruno_config === 'open' || detail.bruno_action === 'config') {
        event.stopPropagation();
        this._openConfigPanel();
        return;
      }
      if (detail.bruno_updates === 'open' || detail.bruno_action === 'updates') {
        event.stopPropagation();
        this._openUpdatesPanel();
        return;
      }
      const key = detail.bruno_section;
      if (key) {
        event.stopPropagation();
        this._goToSection(key);
      }
    };
  }

  // --- Lovelace card API -----------------------------------------------------

  setConfig(config) {
    if (!config) throw new Error('bruno-shell: config ausente');
    this._config = config;
    this._sections = config.sections || {};
    this._defaultSection = config.default_section || Object.keys(this._sections)[0] || 'home';
    // NOVO (Etapa A): rail por SEÇÃO (mantém retrocompat com `rail` único).
    //  - `rails`: mapa de configs de rail (ex.: { default: <app-nav>, rooms: <Home+cômodos> });
    //  - `section_rails`: { <secao>: <nome-do-rail> };
    //  - `default_rail`: nome do rail padrão.
    // Sem `rails` no config => mecanismo DORMENTE (rail único de hoje, inalterado).
    this._rails = config.rails || null;
    this._sectionRails = config.section_rails || {};
    this._defaultRailName = config.default_rail || 'default';
    // NOVO (full-bleed): imagem de fundo da SHELL inteira por seção. A imagem
    // sangra por baixo do rail + faixas + blocos. Sem `backdrops` no config =>
    // camada fica transparente (comportamento de hoje, inalterado).
    //   backdrops: { home: <url>, sala: <url>, ... , default: <url opcional> }
    this._backdrops = config.backdrops || null;
    this._backdropEffects = config.backdrop_effects || null;
    this._preloadBackdrops();
    this._railConfig = config.rail
      || (this._rails ? this._rails[this._defaultRailName] : null);
    this._currentRailName = null;
    this._built = false;
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._railEl) this._railEl.hass = hass;
    if (this._sectionEl) this._sectionEl.hass = hass;
    if (this._configOverlayEl?.dataset.panel === 'updates' && !this._configOverlayEl.hidden) {
      this._renderUpdatesPanel();
    }
  }

  getCardSize() {
    return 100;
  }

  // --- Ciclo de vida ---------------------------------------------------------

  connectedCallback() {
    globalThis.BrunoLiquidGlass && globalThis.BrunoLiquidGlass.apply && globalThis.BrunoLiquidGlass.apply();
    globalThis.addEventListener('hashchange', this._onHashChange);
    globalThis.addEventListener('location-changed', this._onHashChange);
    globalThis.addEventListener('bruno-theme-changed', this._onThemeChanged);
    this.addEventListener('ll-custom', this._onLlCustom);
    if (this._built) this._syncFromHash();
  }

  disconnectedCallback() {
    globalThis.removeEventListener('hashchange', this._onHashChange);
    globalThis.removeEventListener('location-changed', this._onHashChange);
    globalThis.removeEventListener('bruno-theme-changed', this._onThemeChanged);
    this.removeEventListener('ll-custom', this._onLlCustom);
  }

  // --- Helpers ---------------------------------------------------------------

  async _ensureHelpers() {
    if (!this._helpers && globalThis.loadCardHelpers) {
      this._helpers = await globalThis.loadCardHelpers();
    }
    return this._helpers;
  }

  async _createCard(config) {
    const helpers = await this._ensureHelpers();
    if (!helpers) throw new Error('loadCardHelpers indisponivel');
    const el = helpers.createCardElement(config);
    if (this._hass) el.hass = this._hass;
    // Re-propaga hass quando o elemento sinalizar que precisa (cards lazy).
    el.addEventListener('ll-rebuild', () => {
      if (this._hass) el.hass = this._hass;
    });
    return el;
  }

  // --- Construcao da moldura -------------------------------------------------

  async _build() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${BrunoShell._styles()}</style>
      <div class="shell">
        <div class="backdrop" id="backdrop">
          <div class="backdrop-layer" data-layer="0"></div>
          <div class="backdrop-layer" data-layer="1"></div>
        </div>
        <div class="rail-slot" id="rail"></div>
        <div class="content-slot" id="content"></div>
        <div class="config-overlay" id="configOverlay" hidden></div>
      </div>
    `;
    this._backdropEl = this.shadowRoot.getElementById('backdrop');
    this._configOverlayEl = this.shadowRoot.getElementById('configOverlay');
    this._configOverlayEl?.removeEventListener('click', this._onConfigClick);
    this._configOverlayEl?.addEventListener('click', this._onConfigClick);
    this._bdLayers = Array.from(this.shadowRoot.querySelectorAll('.backdrop-layer'));
    this._bdActive = -1; // nenhuma camada ativa ainda

    // Rail: criada UMA vez e mantida viva (nunca recriada).
    try {
      if (this._railConfig) {
        this._railEl = await this._createCard(this._railConfig);
        this._currentRailName = this._rails ? this._defaultRailName : null;
        const railSlot = this.shadowRoot.getElementById('rail');
        if (railSlot) railSlot.replaceChildren(this._railEl);
      }
    } catch (error) {
      this._renderRailError(error);
    }

    this._built = true;
    this._syncFromHash();
  }

  // --- Secoes ----------------------------------------------------------------

  _currentHashKey() {
    const raw = (globalThis.location && globalThis.location.hash) || '';
    const key = raw.replace(/^#/, '');
    return this._sections && this._sections[key] ? key : this._defaultSection;
  }

  _syncFromHash() {
    if (!this._built) return;
    const key = this._currentHashKey();
    if (key === this._activeKey) {
      this._updateRailSelection(key);
      return;
    }
    this._setSection(key);
  }

  _goToSection(key) {
    if (!this._sections || !this._sections[key]) return;
    const current = ((globalThis.location && globalThis.location.hash) || '').replace(/^#/, '');
    if (current !== key) {
      // Muda o hash → dispara hashchange → _syncFromHash (sem trocar a view).
      globalThis.location.hash = key;
    } else {
      this._setSection(key);
    }
  }

  async _setSection(key) {
    const config = this._sections && this._sections[key];
    if (!config) return;
    this._activeKey = key;

    const content = this.shadowRoot && this.shadowRoot.getElementById('content');
    if (!content) return;
    // Fundo da regiao de conteudo e CENTRAL (na shell), por secao: a Home fica
    // transparente (usa o grafite/hero proprio); as demais secoes recebem o
    // fundo ambiente do token --bruno-section-backdrop (ver _styles).
    content.dataset.section = key;

    // NOVO (full-bleed): troca a imagem de fundo da shell conforme a seção.
    this._applyBackdrop(key);

    // NOVO (Etapa A): troca os ITENS do rail conforme a seção (sem recriar o
    // elemento) ANTES de montar o conteúdo, para a moldura não "saltar".
    this._applyRailForSection(key);

    try {
      const el = await this._createCard(config);
      // Se a secao mudou de novo enquanto criava, aborta.
      if (this._activeKey !== key) return;
      this._sectionEl = el;
      content.replaceChildren(el); // remove a secao anterior → dispara seu disconnectedCallback
    } catch (error) {
      this._renderSectionError(content, error);
    }

    this._updateRailSelection(key);
  }

  // NOVO (full-bleed): PRÉ-CARREGA todas as imagens de backdrop no setConfig para
  // a troca de seção ser instantânea (sem o atraso de buscar a imagem na hora).
  _preloadBackdrops() {
    if (!this._backdrops) return;
    this._backdropCache = this._backdropCache || {};
    for (const k of Object.keys(this._backdrops)) {
      const url = this._backdrops[k];
      if (url && !this._backdropCache[url]) {
        const img = new Image();
        img.src = url;
        this._backdropCache[url] = img;
      }
    }
  }

  // NOVO (full-bleed): aplica a imagem da seção com CROSSFADE real entre duas
  // camadas (opacity é animável; background-image não é). Sem `backdrops` =>
  // ambas as camadas transparentes (grafite do :host aparece).
  _applyBackdropEffect(key) {
    if (!this._backdropEl) return;
    const effect = (this._backdropEffects && (this._backdropEffects[key] || this._backdropEffects.default)) || {};
    const setVar = (name, value, fallback) => {
      const next = value === undefined || value === null || value === '' ? fallback : String(value);
      this._backdropEl.style.setProperty(name, next);
    };
    setVar('--bruno-backdrop-blur', effect.blur, '0px');
    setVar('--bruno-backdrop-scale', effect.scale, '1');
    setVar('--bruno-backdrop-saturate', effect.saturate, '1');
    setVar('--bruno-backdrop-brightness', effect.brightness, '1');
    setVar('--bruno-backdrop-dim', effect.dim, '0.10');
  }

  _applyBackdrop(key) {
    if (!this._backdropEl || !this._bdLayers || this._bdLayers.length < 2) return;
    this._applyBackdropEffect(key);
    const url = this._backdrops && (this._backdrops[key] || this._backdrops.default);

    if (!url) {
      // some sem imagem: apaga as duas camadas + desliga a vinheta.
      this._bdLayers.forEach((l) => { l.style.opacity = '0'; });
      delete this._backdropEl.dataset.active;
      this._bdActive = -1;
      return;
    }

    const next = this._bdActive === 0 ? 1 : 0;   // camada que vai receber a nova imagem
    const nextLayer = this._bdLayers[next];
    const curLayer = this._bdActive >= 0 ? this._bdLayers[this._bdActive] : null;
    // Se já é a mesma imagem na camada ativa, não faz nada.
    if (curLayer && curLayer.dataset.url === url) { this._backdropEl.dataset.active = '1'; return; }

    nextLayer.dataset.url = url;
    nextLayer.style.backgroundImage = `url("${url}")`;
    // força reflow para garantir a transição de opacidade
    void nextLayer.offsetWidth;
    nextLayer.style.opacity = '1';
    if (curLayer) curLayer.style.opacity = '0';
    this._backdropEl.dataset.active = '1';
    this._bdActive = next;
  }

  // NOVO (Etapa A): troca os ITENS do rail conforme a seção, SEM recriar o
  // elemento — a moldura/posição não se move; só os botões internos mudam
  // (ex.: app-nav nas seções gerais; Home + cômodos nas seções de cômodo).
  // O Home permanece ancorado no topo (item 0 das duas listas).
  _applyRailForSection(key) {
    if (!this._rails || !this._railEl) return;        // dormente -> rail único fixo
    const railName = this._sectionRails[key] || this._defaultRailName;
    if (railName === this._currentRailName) return;   // já está nesse rail
    const cfg = this._rails[railName] || this._rails[this._defaultRailName];
    if (!cfg) return;
    this._currentRailName = railName;
    try {
      this._railEl.setConfig(cfg);
      if (this._hass) this._railEl.hass = this._hass;
    } catch (error) {
      // não derruba a shell por erro de rail
      // eslint-disable-next-line no-console
      console.warn('bruno-shell: falha ao trocar rail da secao', key, error);
    }
  }

  // Atualiza o item ativo da rail SEM reconstrui-la (so alterna a classe .selected
  // pelos data-key dos botoes — aditivo no bento-sidebar-card.js).
  _updateRailSelection(key) {
    const root = this._railEl && this._railEl.shadowRoot;
    if (!root) return;
    const buttons = root.querySelectorAll('.nav-button[data-key]');
    if (!buttons.length) {
      // Rail ainda nao renderizou; tenta de novo no proximo frame.
      globalThis.requestAnimationFrame && globalThis.requestAnimationFrame(() => {
        const r = this._railEl && this._railEl.shadowRoot;
        if (!r) return;
        r.querySelectorAll('.nav-button[data-key]').forEach((btn) => {
          btn.classList.toggle('selected', btn.dataset.key === key);
        });
      });
      return;
    }
    buttons.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.key === key);
    });
  }

  // --- Erros (nao derrubam a shell) ------------------------------------------

  _renderRailError(error) {
    const railSlot = this.shadowRoot && this.shadowRoot.getElementById('rail');
    if (railSlot) railSlot.innerHTML = `<div class="err">rail: ${BrunoShell._escape(error && error.message)}</div>`;
  }

  _renderSectionError(content, error) {
    content.innerHTML = `<div class="err">secao: ${BrunoShell._escape(error && error.message || error)}</div>`;
  }

  // --- Configuracoes ---------------------------------------------------------

  _openConfigPanel() {
    if (!this._configOverlayEl) return;
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'config';
    this._renderConfigPanel();
  }

  _closeConfigPanel() {
    if (!this._configOverlayEl) return;
    delete this._configOverlayEl.dataset.open;
    delete this._configOverlayEl.dataset.panel;
    this._configOverlayEl.hidden = true;
    this._configOverlayEl.replaceChildren();
  }

  _renderConfigPanel() {
    if (!this._configOverlayEl || this._configOverlayEl.hidden) return;
    const manager = globalThis.BrunoThemeManager;
    const themes = manager?.list?.() || [
      { key: 'liquid-glass', label: 'Liquid Glass', available: Boolean(globalThis.BrunoLiquidGlass) },
      { key: 'visionos', label: 'VisionOS', available: Boolean(globalThis.BrunoVisionOS) },
    ];
    const current = manager?.current?.() || 'liquid-glass';

    this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-config-action="close"></div>
      <section class="config-panel" role="dialog" aria-modal="true" aria-label="Configuracoes">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M12 15.5A3.5 3.5 0 1 0 12 8a3.5 3.5 0 0 0 0 7.5Z"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.37a1.7 1.7 0 0 0-1 .56 1.7 1.7 0 0 0-.5 1.2V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-.5-1.2 1.7 1.7 0 0 0-1-.56 1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.63 15a1.7 1.7 0 0 0-.56-1 1.7 1.7 0 0 0-1.2-.5H3a2 2 0 1 1 0-4h.09a1.7 1.7 0 0 0 1.2-.5 1.7 1.7 0 0 0 .56-1 1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.63a1.7 1.7 0 0 0 1-.56 1.7 1.7 0 0 0 .5-1.2V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 .5 1.2 1.7 1.7 0 0 0 1 .56 1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.37 9c.13.36.33.7.56 1 .32.32.75.5 1.2.5H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.2.5c-.23.3-.43.64-.56 1Z"/></svg>
          </span>
          <div class="config-title">
            <strong>Config</strong>
            <span>Preferencias do painel</span>
          </div>
          <button class="config-close" type="button" data-config-action="close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section">
          <div class="config-section-title">
            <span>Tema</span>
            <small>${BrunoShell._escape(manager?.activeLabel?.() || current)}</small>
          </div>
          <div class="theme-list">
            ${themes.map((theme) => `
              <button
                class="theme-option${theme.key === current ? ' is-selected' : ''}"
                type="button"
                data-config-action="theme"
                data-theme="${BrunoShell._escapeAttr(theme.key)}"
                ${theme.available ? '' : 'disabled'}
              >
                <span>${BrunoShell._escape(theme.label)}</span>
                <small>${theme.key === current ? 'Atual' : (theme.available ? 'Disponivel' : 'Indisponivel')}</small>
              </button>
            `).join('')}
          </div>
        </div>
        <footer class="config-footer">
          <button class="config-refresh" type="button" data-config-action="reload">Atualizar</button>
        </footer>
      </section>
    `;
  }

  _openUpdatesPanel() {
    if (!this._configOverlayEl) return;
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'updates';
    this._renderUpdatesPanel();
  }

  _renderUpdatesPanel() {
    if (!this._configOverlayEl || this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== 'updates') return;
    if (!globalThis.BrunoUpdatesPanel?.render) {
      this._configOverlayEl.innerHTML = `
        <div class="config-scrim" data-updates-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Updates">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title">
              <strong>Updates</strong>
              <span>Modulo de updates indisponivel</span>
            </div>
            <button class="config-close" type="button" data-updates-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
      return;
    }
    this._configOverlayEl.innerHTML = globalThis.BrunoUpdatesPanel.render({ hass: this._hass });
  }

  _handleConfigClick(event) {
    const updatesTarget = event.target?.closest?.('[data-updates-action]');
    if (updatesTarget) {
      event.preventDefault();
      event.stopPropagation();
      if (updatesTarget.dataset.updatesAction === 'close') {
        this._closeConfigPanel();
        return;
      }
      globalThis.BrunoUpdatesPanel?.handleAction?.({
        target: updatesTarget,
        hass: this._hass,
        host: this,
      });
      return;
    }

    const target = event.target?.closest?.('[data-config-action]');
    if (!target) return;
    const action = target.dataset.configAction;
    if (action === 'close') {
      this._closeConfigPanel();
      return;
    }
    if (action === 'theme') {
      const theme = target.dataset.theme;
      globalThis.BrunoThemeManager?.apply?.(theme);
      this._renderConfigPanel();
      return;
    }
    if (action === 'reload') {
      globalThis.location?.reload?.();
    }
  }

  // --- Estilo da moldura -----------------------------------------------------

  static _styles() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        /* ORIGINAL (rollback): gradiente 140deg deixava a BORDA ESQUERDA (onde
           fica o rail) mais escura que o miolo -> rail parecia uma faixa marcada.
           background: linear-gradient(140deg, #07090d 0%, #111722 55%, #07090d 100%); */
        /* NOVO: gradiente VERTICAL (uniforme no eixo X) -> a coluna do rail tem o
           MESMO tom do fundo ao lado, ajudando o rail a fundir com o painel. */
        background: linear-gradient(180deg, #0a0e15 0%, #11161f 100%);
        color: rgba(246,250,255,0.94);
        font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      }

      * { box-sizing: border-box; }

      /* ORIGINAL (rollback): rail flutuante 64px, gap 10px, padding 12px na shell.
        .shell { grid-template-columns: 64px minmax(0,1fr); gap:10px; padding:12px; }
        .rail-slot { grid-column:1; }
        .content-slot { grid-column:2; }
      */
      /* NOVO (Caminho 2): rail RENTE — coluna 86px colada na borda (gap 0, sem
         padding na shell). O respiro migra para o .content-slot (padding 12px).
         Uma fina divisoria vertical (mais forte no centro) separa rail/conteudo. */
      .shell {
        height: 100%;
        display: grid;
        grid-template-columns: 86px minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        gap: 0;
        padding: 0;
        position: relative;
      }

      /* NOVO (full-bleed): imagem da seção sangrando por TODA a shell (sob rail,
         faixas e blocos). z-index 0 -> tudo o resto fica acima (z-index 1).
         O ::after dá um leve escurecimento global para legibilidade — o blur
         "pesado" fica nas faixas fixas (top/dock), não aqui. */
      .backdrop {
        --bruno-backdrop-blur: 0px;
        --bruno-backdrop-scale: 1;
        --bruno-backdrop-saturate: 1;
        --bruno-backdrop-brightness: 1;
        --bruno-backdrop-dim: 0.10;
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
      }
      /* Duas camadas para CROSSFADE por opacidade (background-image não anima). */
      .backdrop-layer {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0;
        transform: scale(var(--bruno-backdrop-scale, 1));
        filter: blur(var(--bruno-backdrop-blur, 0px)) saturate(var(--bruno-backdrop-saturate, 1)) brightness(var(--bruno-backdrop-brightness, 1));
        transition: opacity 0.45s ease, filter 0.45s ease, transform 0.45s ease;
        will-change: opacity, filter, transform;
      }
      /* NOVO: BORDA ATMOSFÉRICA escurecida no PERÍMETRO da imagem. É ela que dá
         legibilidade às regiões fixas (rail à esquerda, status no topo, dock na
         base) — por isso essas regiões voltam a ser transparentes. As bordas
         esquerda/topo/base são mais fortes (onde ficam as faixas fixas); a
         direita é mais suave. Um leve escurecimento geral fecha o contraste. */
      .backdrop::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        /* As 4 bordas com a MESMA intensidade (peak 0.70) e a MESMA proporção
           (mesmos stops 0% / 6% / 14%). Esquerda, direita, topo e base idênticas.
           Um véu uniforme leve (flat, não-direcional) fecha o contraste sem
           privilegiar nenhuma borda. */
        background:
          linear-gradient(90deg,  rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          linear-gradient(270deg, rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          linear-gradient(180deg, rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          linear-gradient(0deg,   rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          rgba(6,9,14,var(--bruno-backdrop-dim, 0.10));
      }
      /* Sem imagem (seção sem backdrop): camada some e o :host (grafite) aparece. */
      .backdrop:not([data-active])::after { background: none; }

      .rail-slot {
        grid-column: 1;
        position: relative;
        z-index: 1;
        min-width: 0;
        min-height: 0;
      }

      /* Filete divisor do rail (vertical, mais claro no centro, sumindo nas pontas)
         — mesma linguagem do filete acima do dock. Reforçado (0.16 -> 0.30) porque
         o rail agora é transparente sobre a foto e a linha sumia. */
      .rail-slot::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        pointer-events: none;
        background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%);
      }

      .content-slot {
        grid-column: 2;
        position: relative;
        z-index: 1;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        padding: 12px;
        /* Fundo CENTRAL das secoes (padrao unico, nao por arquivo): por padrao
           TRANSPARENTE -> mostra o grafite do :host (o "escuro atras do hero").
           Para trocar o fundo de TODAS as secoes de uma vez, basta definir
           --bruno-section-backdrop no core (bruno-liquid-glass.js). */
        background: var(--bruno-section-backdrop, transparent);
      }

      /* A secao ativa preenche a regiao de conteudo. */
      .content-slot > * {
        display: block;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }

      .config-overlay[hidden] {
        display: none;
      }

      .config-overlay {
        position: fixed;
        inset: 0;
        z-index: 40;
        pointer-events: auto;
      }

      .config-scrim {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.08);
        -webkit-backdrop-filter: blur(2px);
        backdrop-filter: blur(2px);
      }

      .config-panel {
        position: absolute;
        left: 94px;
        bottom: 74px;
        width: min(360px, calc(100vw - 124px));
        border-radius: var(--bruno-liquid-card-radius-compact, 24px);
        border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
        background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660)));
        box-shadow: var(--bruno-liquid-popup-shadow, 0 18px 36px rgba(0,0,0,0.30));
        -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
        backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
        color: rgba(255,255,255,0.92);
        overflow: hidden;
      }

      .config-header {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) 32px;
        align-items: center;
        gap: 10px;
        padding: 14px 14px 12px;
      }

      .config-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        border: 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.30);
        background: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.08);
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.92);
      }

      .config-icon svg,
      .config-close svg {
        width: 18px;
        height: 18px;
      }

      .config-icon svg {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .config-title {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .config-title strong {
        font-size: 13px;
        line-height: 1.1;
        font-weight: 800;
      }

      .config-title span,
      .config-section-title small,
      .theme-option small {
        font-size: 10px;
        line-height: 1.1;
        color: rgba(255,255,255,0.58);
      }

      .config-close {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.045);
        color: rgba(255,255,255,0.66);
        font-size: 21px;
        line-height: 1;
        cursor: pointer;
      }

      .config-section {
        padding: 0 14px 14px;
      }

      .config-section-title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        padding: 0 2px 8px;
      }

      .config-section-title span {
        font-size: 11px;
        font-weight: 800;
        color: rgba(255,255,255,0.82);
      }

      .theme-list {
        display: grid;
        gap: 8px;
      }

      .theme-option {
        min-height: 46px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
        color: rgba(255,255,255,0.86);
        padding: 9px 11px;
        text-align: left;
        cursor: pointer;
      }

      .theme-option span {
        font-size: 12px;
        font-weight: 800;
      }

      .theme-option.is-selected {
        background: var(--bruno-liquid-selected-blue-background, rgba(96,165,250,0.34));
        border-color: var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.30));
        box-shadow: var(--bruno-liquid-selected-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.10));
      }

      .theme-option:disabled {
        opacity: 0.44;
        cursor: default;
      }

      .config-footer {
        display: flex;
        justify-content: flex-end;
        padding: 0 14px 14px;
      }

      .config-refresh {
        min-height: 34px;
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.18));
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: var(--bruno-liquid-control-warm-background, rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.038));
        box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
        color: rgba(255,255,255,0.86);
        padding: 0 14px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      }

      .err {
        padding: 16px;
        color: #ffd9df;
        font: 600 13px/1.4 var(--primary-font-family, inherit);
      }
    `;
  }

  static _escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoShell._escape(value).replace(/"/g, '&quot;');
  }
}

if (!customElements.get(BRUNO_SHELL_TAG)) {
  customElements.define(BRUNO_SHELL_TAG, BrunoShell);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_SHELL_TAG,
  name: 'Bruno Shell',
  description: 'App-shell com barra fixa e conteudo que troca por secao.',
});
