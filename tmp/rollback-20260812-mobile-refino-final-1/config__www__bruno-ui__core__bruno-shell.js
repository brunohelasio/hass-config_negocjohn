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
    this._onFolha = this._onFolha.bind(this);
    this._sectionEl = null;
    this._helpers = null;
    this._built = false;
    // Navegacao persistente: `_activeKey` e a secao VISIVEL; `_requestedKey`
    // e apenas o destino em carregamento. A troca visual so ocorre quando o
    // card de destino estiver pronto, evitando o estado intermediario escuro.
    this._requestedKey = null;
    this._sectionCache = new Map();
    this._sectionPromises = new Map();
    this._sectionScroll = new Map();
    this._sectionGeneration = 0;
    this._sectionRequestId = 0;
    this._buildRequestId = 0;
    this._configSignature = null;
    this._sectionErrorEl = null;
    this._configSection = '';
    this._wallpaperSection = 'home';
    this._wallpaperMessage = '';
    this._onHashChange = () => this._syncFromHash();
    this._onSectionNavigationClick = (event) => this._handleSectionNavigationClick(event);
    this._onHassNavigate = (event) => this._handleHassNavigate(event);
    this._onConfigClick = (event) => this._handleConfigClick(event);
    this._onConfigChange = (event) => this._handleConfigChange(event);
    this._onThemeChanged = (event) => {
      this._syncConfigOverlayTheme(event?.detail?.key);
      if (this._configOverlayEl?.dataset.panel === 'config') this._renderConfigPanel();
    };
    this._onWallpaperChanged = (event) => {
      const key = event?.detail?.key;
      if (!key || key === this._activeKey) this._applyBackdrop(this._activeKey);
      if (this._configOverlayEl?.dataset.panel === 'config' && this._configSection === 'wallpaper') {
        this._renderConfigPanel();
      }
    };
    this._onLlCustom = (event) => {
      const detail = (event && event.detail) || {};
      if (detail.bruno_config === 'open' || detail.bruno_action === 'config') {
        event.stopPropagation();
        this._openConfigPanel();
        return;
      }
      if (detail.bruno_action === 'refresh') {
        event.stopPropagation();
        globalThis.location?.reload?.();
        return;
      }
      if (detail.bruno_action === 'scenes') {
        event.stopPropagation();
        this._openScenesPanel();
        return;
      }
      // NOVO (Fase 5e.6): o painel Sistema renderizava "Modulo indisponivel" e
      // foi substituido pelo painel Dispositivos. As duas chaves apontam para o
      // mesmo lugar para que a rail antiga (bruno_action: system) continue
      // funcionando ate o YAML ser atualizado.
      // ROLLBACK: trocar _openDevicesPanel() por _openSystemPanel() aqui.
      if (detail.bruno_action === 'devices' || detail.bruno_action === 'system') {
        event.stopPropagation();
        this._openDevicesPanel();
        return;
      }
      if (detail.bruno_action === 'network') {
        event.stopPropagation();
        this._openNetworkPanel();
        return;
      }
      if (detail.bruno_updates === 'open' || detail.bruno_action === 'updates') {
        event.stopPropagation();
        this._openUpdatesPanel();
        return;
      }
      if (detail.bruno_action === 'spotify') {
        event.stopPropagation();
        this._openSpotifyPanel(detail.bruno_spotify_config || {});
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
    const signature = this._configFingerprint(config);
    const sameConfig = signature === this._configSignature;
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
    // ORIGINAL (rollback): todo setConfig reconstruia shadow DOM, rail e Home.
    // this._currentRailName = null;
    // this._built = false;
    // this._build();

    // O HA pode repetir setConfig com um objeto novo, mas semanticamente igual.
    // Nessa situacao a instancia montada e os caches permanecem intactos.
    if (sameConfig) {
      if (this._built) this._syncFromHash();
      return;
    }

    this._configSignature = signature;
    this._sectionGeneration += 1;
    this._sectionRequestId += 1;
    this._sectionCache.clear();
    this._sectionPromises.clear();
    this._sectionScroll.clear();
    this._activeKey = null;
    this._requestedKey = null;
    this._sectionEl = null;
    this._sectionErrorEl = null;
    this._currentRailName = null;
    this._built = false;
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    globalThis.BrunoWallpaperManager?.sections?.forEach?.((section) => {
      globalThis.BrunoWallpaperManager.clearPending?.(hass, section.key);
    });
    this._preloadResolvedBackdrops();
    if (this._railEl) this._railEl.hass = hass;
    // ORIGINAL (rollback): apenas a secao visivel recebia hass.
    // if (this._sectionEl) this._sectionEl.hass = hass;
    if (this._sectionEl) this._sectionEl.hass = hass;
    const homeEl = this._sectionCache.get(this._homeSectionKey());
    if (homeEl && homeEl !== this._sectionEl) homeEl.hass = hass;
    if (this._activeKey) this._applyBackdrop(this._activeKey);
    if (this._configOverlayEl?.dataset.panel === 'config'
      && this._configSection === 'updates'
      && !this._configOverlayEl.hidden) {
      this._renderConfigPanel({ preserveScroll: true });
    }
    if (this._configOverlayEl?.dataset.panel === 'updates' && !this._configOverlayEl.hidden) {
      this._renderUpdatesPanel({ preserveScroll: true });
    }
    if (this._configOverlayEl?.dataset.panel === 'system' && !this._configOverlayEl.hidden) {
      this._renderSystemPanel({ preserveScroll: true });
    }
    // NOVO (5e.6): o painel Dispositivos recebe o hass por propriedade, e nao
    // por innerHTML — o proprio componente reconcilia (Lit).
    if (this._configOverlayEl?.dataset.panel === 'devices' && this._devicesPanelEl) {
      this._devicesPanelEl.hass = hass;
    }
    if (this._configOverlayEl?.dataset.panel === 'network' && !this._configOverlayEl.hidden) {
      this._renderNetworkPanel({ preserveScroll: true });
    }
    if (this._configOverlayEl?.dataset.panel === 'spotify' && this._spotifyPanelCard) {
      this._spotifyPanelCard.hass = hass;
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
    globalThis.addEventListener('bruno-wallpaper-changed', this._onWallpaperChanged);
    this.addEventListener('ll-custom', this._onLlCustom);
    // Captura antes das subviews: impede que fallbacks locais troquem a view do HA.
    this.addEventListener('click', this._onSectionNavigationClick, true);
    this.addEventListener('hass-navigate', this._onHassNavigate, true);
    // Folha aberta numa subview: marca o estado para manter a rail a frente.
    this.addEventListener('bruno-folha', this._onFolha);
    if (this._built) this._syncFromHash();
    this._observarDock();
  }

  /**
   * Publica a altura REAL do dock em --bruno-dock-h.
   *
   * Quem esta DENTRO do content-slot precisa desse numero e nao tem como
   * medi-lo: a bottom sheet das subviews tem de parar acima do dock, porque o
   * rail-slot tem z-index 2 e o content-slot 1 — nenhum z-index de dentro do
   * conteudo pinta sobre ele.
   *
   * Medido, nao estimado: a primeira versao usava 58px + safe-area, valor que
   * saiu do meu banco em Chromium. No iPhone o dock e mais alto e a folha
   * continuou passando por baixo. Propriedade customizada atravessa shadow DOM
   * por heranca, entao a subview le isto sem conhecer a shell.
   */
  /**
   * Marca na shell quando ha bottom sheet aberta no telefone.
   *
   * ANTERIOR (rollback rev. faixa-de-tiles): a classe elevava o content-slot
   * acima da rail. Agora a mesma classe eleva a rail, mantendo-a fixa, visivel
   * e clicavel enquanto a folha sobe da borda inferior.
   *
   * So o telefone e afetado: no tablet a regra que le a classe vive dentro de
   * @media (max-width: 800px).
   */
  _onFolha(event) {
    const shell = this.shadowRoot && this.shadowRoot.querySelector('.shell');
    if (!shell) return;
    shell.classList.toggle('tem-folha', Boolean(event && event.detail && event.detail.aberta));
  }

  _observarDock() {
    const slot = this.shadowRoot && this.shadowRoot.querySelector('.rail-slot');
    if (!slot) return;
    const publicar = () => {
      const h = Math.round(slot.getBoundingClientRect().height);
      if (h > 0) this.style.setProperty('--bruno-dock-h', h + 'px');
    };
    publicar();
    if (this._dockObserver) this._dockObserver.disconnect();
    if (typeof ResizeObserver === 'function') {
      this._dockObserver = new ResizeObserver(publicar);
      this._dockObserver.observe(slot);
    }
  }

  disconnectedCallback() {
    globalThis.removeEventListener('hashchange', this._onHashChange);
    globalThis.removeEventListener('location-changed', this._onHashChange);
    globalThis.removeEventListener('bruno-theme-changed', this._onThemeChanged);
    globalThis.removeEventListener('bruno-wallpaper-changed', this._onWallpaperChanged);
    this.removeEventListener('ll-custom', this._onLlCustom);
    this.removeEventListener('click', this._onSectionNavigationClick, true);
    this.removeEventListener('hass-navigate', this._onHassNavigate, true);
    this.removeEventListener('bruno-folha', this._onFolha);
    if (this._dockObserver) {
      this._dockObserver.disconnect();
      this._dockObserver = null;
    }
  }

  // --- Helpers ---------------------------------------------------------------

  _configFingerprint(config) {
    try {
      return JSON.stringify(config);
    } catch (_error) {
      // Configs Lovelace normais sao serializaveis. Este fallback conserva a
      // seguranca caso algum integrador injete um valor nao serializavel.
      return config;
    }
  }

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
    const buildRequestId = ++this._buildRequestId;
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
    this._syncConfigOverlayTheme();
    this._configOverlayEl?.removeEventListener('click', this._onConfigClick);
    this._configOverlayEl?.addEventListener('click', this._onConfigClick);
    this._configOverlayEl?.removeEventListener('change', this._onConfigChange);
    this._configOverlayEl?.addEventListener('change', this._onConfigChange);
    this._bdLayers = Array.from(this.shadowRoot.querySelectorAll('.backdrop-layer'));
    this._bdActive = -1; // nenhuma camada ativa ainda

    // Rail: criada UMA vez e mantida viva (nunca recriada).
    try {
      if (this._railConfig) {
        // ORIGINAL (rollback): this._railEl = await this._createCard(this._railConfig);
        const railEl = await this._createCard(this._railConfig);
        if (buildRequestId !== this._buildRequestId) return;
        this._railEl = railEl;
        this._currentRailName = this._rails ? this._defaultRailName : null;
        // O dock so existe depois daqui: e agora que da para medi-lo.
        queueMicrotask(() => this._observarDock());
        const railSlot = this.shadowRoot.getElementById('rail');
        if (railSlot) railSlot.replaceChildren(this._railEl);
      }
    } catch (error) {
      if (buildRequestId !== this._buildRequestId) return;
      this._renderRailError(error);
    }

    if (buildRequestId !== this._buildRequestId) return;
    this._built = true;
    this._syncFromHash();
  }

  // --- Secoes ----------------------------------------------------------------

  _currentHashKey() {
    const raw = (globalThis.location && globalThis.location.hash) || '';
    const key = raw.replace(/^#/, '');
    return this._sections && this._sections[key] ? key : this._defaultSection;
  }

  _homeSectionKey() {
    return this._sections?.home ? 'home' : this._defaultSection;
  }

  _navigationSectionKey(path) {
    if (typeof path !== 'string' || !path.trim() || !this._sections) return null;
    const raw = path.trim();
    if (raw.startsWith('#')) {
      const hashKey = raw.replace(/^#/, '').split(/[?&]/, 1)[0];
      return this._sections[hashKey] ? hashKey : null;
    }

    const pathOnly = raw.split(/[?#]/, 1)[0].replace(/\/+$/, '');
    const parts = pathOnly.split('/').filter(Boolean);
    if (!parts.length) return null;

    // Nao captura rotas absolutas de outro dashboard/integracao.
    const currentParts = (globalThis.location?.pathname || '').split('/').filter(Boolean);
    if (parts.length > 1 && currentParts.length && parts[0] !== currentParts[0]) return null;

    let slug = parts[parts.length - 1];
    try { slug = decodeURIComponent(slug); } catch (_error) { /* mantem o slug bruto */ }
    const aliases = {
      'bento-lab': this._homeSectionKey(),
      'subview-sala': 'sala',
      'subview-office': 'office',
      'subview-cozinha': 'cozinha',
      'subview-quarto-casal': 'casal',
      'subview-quarto-marina': 'marina',
      'subview-quarto-miguel': 'miguel',
      'cameras-security': 'cameras',
      'floor-plan': 'floorplan',
    };
    const key = aliases[slug] || (this._sections[slug] ? slug : null);
    return key && this._sections[key] ? key : null;
  }

  _handleSectionNavigationClick(event) {
    const path = typeof event.composedPath === 'function' ? event.composedPath() : [];
    let key = null;

    for (const node of path) {
      if (!node || !node.dataset) continue;
      if (node.dataset.action === 'navigate-home') {
        key = this._homeSectionKey();
        break;
      }
      if (node.dataset.action === 'navigate' && node.dataset.path) {
        key = this._navigationSectionKey(node.dataset.path);
        if (key) break;
      }
      if (node.classList?.contains('nav-button') && node.dataset.key && this._sections?.[node.dataset.key]) {
        key = node.dataset.key;
        break;
      }
    }

    if (!key) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    this._goToSection(key);
  }

  _handleHassNavigate(event) {
    const detail = event?.detail || {};
    const key = this._navigationSectionKey(detail.path || detail.navigate || detail.navigation_path);
    if (!key) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation?.();
    this._goToSection(key);
  }

  _syncFromHash() {
    if (!this._built) return;
    const key = this._currentHashKey();
    // ORIGINAL (rollback): comparava apenas com a chave marcada ativa antes do
    // await, misturando destino solicitado com secao realmente visivel.
    // if (key === this._activeKey) {
    //   this._updateRailSelection(key);
    //   return;
    // }
    // this._setSection(key);
    if (key === this._activeKey && !this._requestedKey) {
      this._updateRailSelection(key);
      return;
    }
    if (key === this._requestedKey) return;
    this._setSection(key);
  }

  _goToSection(key) {
    if (!this._sections || !this._sections[key]) return;
    // No telefone a navegacao pertence integralmente a esta shell. Alterar
    // `location.hash` dispara `hashchange` no WebView do HA e, em alguns
    // clientes, o roteador externo remonta o Lovelace inteiro (tela preta
    // "Loading data"). `replaceState` atualiza o deep-link sem emitir esse
    // evento; a secao cacheada e ativada diretamente logo abaixo.
    const phone = typeof globalThis.matchMedia === 'function'
      && globalThis.matchMedia('(max-width: 800px)').matches;
    if (phone) {
      if (key === this._activeKey && !this._requestedKey) {
        this._updateRailSelection(key);
        return;
      }
      if (key === this._requestedKey) return;

      const location = globalThis.location;
      const history = globalThis.history;
      if (location && history?.replaceState) {
        const next = `${location.pathname}${location.search}#${encodeURIComponent(key)}`;
        history.replaceState(history.state, '', next);
      }
      this._setSection(key);
      return;
    }

    const current = ((globalThis.location && globalThis.location.hash) || '').replace(/^#/, '');
    if (current !== key) {
      // Muda o hash → dispara hashchange → _syncFromHash (sem trocar a view).
      globalThis.location.hash = key;
    } else {
      this._setSection(key);
    }
  }

  // ORIGINAL (rollback): recriava o card e removia a Home com replaceChildren.
  async _setSectionOriginalRollback(key) {
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
  _sectionElement(key, config, generation) {
    const cached = this._sectionCache.get(key);
    if (cached) return Promise.resolve(cached);
    const pending = this._sectionPromises.get(key);
    if (pending) return pending;

    const promise = this._createCard(config).then((el) => {
      if (generation === this._sectionGeneration) {
        el.dataset.brunoSection = key;
        this._sectionCache.set(key, el);
      }
      return el;
    }).finally(() => {
      if (this._sectionPromises.get(key) === promise) this._sectionPromises.delete(key);
    });
    this._sectionPromises.set(key, promise);
    return promise;
  }

  _setSectionVisibility(el, visible) {
    if (!el) return;
    el.hidden = !visible;
    if (visible) {
      el.removeAttribute('aria-hidden');
      el.removeAttribute('inert');
      if ('inert' in el) el.inert = false;
    } else {
      el.setAttribute('aria-hidden', 'true');
      if ('inert' in el) el.inert = true;
      else el.setAttribute('inert', '');
    }
  }

  _activateSection({ key, el, homeKey, homeEl, content, requestId }) {
    if (this._activeKey) this._sectionScroll.set(this._activeKey, content.scrollTop || 0);
    this._clearSectionError();

    const previousEl = this._sectionEl;
    if (previousEl && previousEl !== homeEl && previousEl !== el && previousEl.parentNode === content) {
      this._setSectionVisibility(previousEl, false);
      content.removeChild(previousEl);
    }

    // A Home permanece conectada durante toda a vida da Shell. Fora dela fica
    // hidden + inert; as demais secoes sao cacheadas e desconectadas ao sair.
    if (homeEl.parentNode !== content) content.appendChild(homeEl);
    this._setSectionVisibility(homeEl, key === homeKey);
    if (el !== homeEl) {
      if (el.parentNode !== content) content.appendChild(el);
      this._setSectionVisibility(el, true);
    }

    this._activeKey = key;
    this._requestedKey = null;
    this._sectionEl = el;
    content.dataset.section = key;
    if (this._hass) el.hass = this._hass;

    // Backdrop, rail e conteudo mudam juntos, depois do destino estar pronto.
    this._applyBackdrop(key);
    this._applyRailForSection(key);
    this._updateRailSelection(key);

    const scrollTop = this._sectionScroll.get(key) || 0;
    content.scrollTop = scrollTop;
    globalThis.requestAnimationFrame?.(() => {
      if (requestId === this._sectionRequestId && this._activeKey === key) content.scrollTop = scrollTop;
    });
  }

  async _setSection(key) {
    const config = this._sections && this._sections[key];
    if (!config) return;
    const content = this.shadowRoot && this.shadowRoot.getElementById('content');
    if (!content) return;

    const requestId = ++this._sectionRequestId;
    const generation = this._sectionGeneration;
    this._requestedKey = key;
    const homeKey = this._homeSectionKey();
    const homeConfig = this._sections[homeKey];

    try {
      // Home e criada no primeiro acesso a Shell mesmo em deep-link; depois
      // permanece montada. Destinos adicionais entram no cache sob demanda.
      const homePromise = this._sectionElement(homeKey, homeConfig, generation);
      const sectionPromise = key === homeKey
        ? homePromise
        : this._sectionElement(key, config, generation);
      const [homeEl, el] = await Promise.all([homePromise, sectionPromise]);
      if (requestId !== this._sectionRequestId
        || generation !== this._sectionGeneration
        || this._requestedKey !== key) return;
      this._activateSection({ key, el, homeKey, homeEl, content, requestId });
    } catch (error) {
      if (requestId !== this._sectionRequestId || generation !== this._sectionGeneration) return;
      this._requestedKey = null;
      this._renderSectionError(content, error);
      this._updateRailSelection(this._activeKey || key);
    }
  }

  _preloadBackdrops() {
    if (!this._backdrops) return;
    for (const k of Object.keys(this._backdrops)) {
      const url = this._backdrops[k];
      if (url) this._loadBackdrop(url);
    }
  }

  _preloadResolvedBackdrops() {
    if (!this._hass || !this._backdrops) return;
    for (const key of Object.keys(this._backdrops)) {
      const fallback = this._backdrops[key] || this._backdrops.default;
      const url = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, key, fallback) || fallback;
      if (url) this._loadBackdrop(url);
    }
  }

  _loadBackdrop(url) {
    if (!url) return Promise.resolve(null);
    if (!(this._backdropCache instanceof Map)) this._backdropCache = new Map();
    const cached = this._backdropCache.get(url);
    if (cached) return cached.promise;

    const image = new Image();
    image.decoding = 'async';
    const promise = new Promise((resolve) => {
      let settled = false;
      const finish = async (loaded) => {
        if (settled) return;
        settled = true;
        if (loaded && typeof image.decode === 'function') {
          try { await image.decode(); } catch (_error) { /* load concluido; decode e apenas uma otimizacao */ }
        }
        resolve(loaded ? url : null);
      };
      image.addEventListener('load', () => finish(true), { once: true });
      image.addEventListener('error', () => finish(false), { once: true });
      image.src = url;
      if (image.complete) finish(image.naturalWidth > 0);
    });
    this._backdropCache.set(url, { image, promise });
    return promise;
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
    setVar('--bruno-backdrop-blur', effect.blur, 'var(--bruno-theme-backdrop-blur, 0px)');
    setVar('--bruno-backdrop-scale', effect.scale, 'var(--bruno-theme-backdrop-scale, 1)');
    setVar('--bruno-backdrop-saturate', effect.saturate, 'var(--bruno-theme-backdrop-saturate, 1)');
    setVar('--bruno-backdrop-brightness', effect.brightness, 'var(--bruno-theme-backdrop-brightness, 1)');
    setVar('--bruno-backdrop-dim', effect.dim, 'var(--bruno-theme-backdrop-dim, 0.10)');
  }

  _applyBackdrop(key) {
    if (!this._backdropEl || !this._bdLayers || this._bdLayers.length < 2) return;
    this._applyBackdropEffect(key);
    const fallback = this._backdrops && (this._backdrops[key] || this._backdrops.default);
    const url = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, key, fallback) || fallback;

    if (!url) {
      this._backdropRequestId = (this._backdropRequestId || 0) + 1;
      this._backdropTargetUrl = '';
      // some sem imagem: apaga as duas camadas + desliga a vinheta.
      this._bdLayers.forEach((l) => { l.style.opacity = '0'; });
      delete this._backdropEl.dataset.active;
      this._bdActive = -1;
      return;
    }

    const curLayer = this._bdActive >= 0 ? this._bdLayers[this._bdActive] : null;
    if (curLayer && curLayer.dataset.url === url) {
      this._backdropTargetUrl = '';
      this._backdropEl.dataset.active = '1';
      return;
    }
    if (this._backdropTargetUrl === url) return;

    const requestId = (this._backdropRequestId || 0) + 1;
    this._backdropRequestId = requestId;
    this._backdropTargetUrl = url;
    this._loadBackdrop(url).then((loadedUrl) => {
      if (!loadedUrl
        || requestId !== this._backdropRequestId
        || this._activeKey !== key
        || this._backdropTargetUrl !== url) return;

      const current = this._bdActive >= 0 ? this._bdLayers[this._bdActive] : null;
      const next = this._bdActive === 0 ? 1 : 0;
      const nextLayer = this._bdLayers[next];
      nextLayer.style.opacity = '0';
      nextLayer.dataset.url = url;
      nextLayer.style.backgroundImage = `url("${url}")`;

      globalThis.requestAnimationFrame?.(() => {
        if (requestId !== this._backdropRequestId || this._activeKey !== key) return;
        nextLayer.style.opacity = '1';
        if (current && current !== nextLayer) current.style.opacity = '0';
        this._backdropEl.dataset.active = '1';
        this._bdActive = next;
        this._backdropTargetUrl = '';
      });
    });
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
    // NOVO (rev. faixa-de-tiles) — um botao pode representar um GRUPO.
    // No telefone os tres quartos saem do dock e viram o menu "Quartos"
    // (rail_rooms.yaml + bento-sidebar-card.js). O botao do grupo carrega
    // data-group-keys="casal marina miguel"; sem esta leitura, entrar num
    // quarto nao acendia nada na rail, porque o botao daquele quarto esta com
    // display:none. ANTERIOR (rollback): so a comparacao com dataset.key.
    const marcar = (btn) => {
      const grupo = btn.dataset.groupKeys;
      const ativo = grupo
        ? grupo.split(' ').filter(Boolean).indexOf(key) !== -1
        : btn.dataset.key === key;
      btn.classList.toggle('selected', ativo);
    };
    const seletor = '.nav-button[data-key], .nav-button[data-group-keys]';
    const buttons = root.querySelectorAll(seletor);
    if (!buttons.length) {
      // Rail ainda nao renderizou; tenta de novo no proximo frame.
      globalThis.requestAnimationFrame && globalThis.requestAnimationFrame(() => {
        const r = this._railEl && this._railEl.shadowRoot;
        if (!r) return;
        r.querySelectorAll(seletor).forEach(marcar);
      });
      return;
    }
    buttons.forEach(marcar);
  }

  // --- Erros (nao derrubam a shell) ------------------------------------------

  _renderRailError(error) {
    const railSlot = this.shadowRoot && this.shadowRoot.getElementById('rail');
    if (railSlot) railSlot.innerHTML = `<div class="err">rail: ${BrunoShell._escape(error && error.message)}</div>`;
  }

  _renderSectionError(content, error) {
    // ORIGINAL (rollback): apagava Home e qualquer secao montada.
    // content.innerHTML = `<div class="err">secao: ${BrunoShell._escape(error && error.message || error)}</div>`;
    this._clearSectionError();
    const errorEl = document.createElement('div');
    errorEl.className = 'err section-error';
    errorEl.textContent = `secao: ${error && error.message || error}`;
    content.appendChild(errorEl);
    this._sectionErrorEl = errorEl;
  }

  _clearSectionError() {
    if (this._sectionErrorEl?.parentNode) this._sectionErrorEl.parentNode.removeChild(this._sectionErrorEl);
    this._sectionErrorEl = null;
  }

  // --- Configuracoes ---------------------------------------------------------

  _syncConfigOverlayTheme(themeKey = '') {
    if (!this._configOverlayEl) return;
    const key = themeKey || globalThis.BrunoThemeManager?.current?.() || '';
    this._configOverlayEl.dataset.brunoPopupTheme = key === 'josh' ? 'josh' : 'default';
  }

  _openConfigPanel() {
    if (!this._configOverlayEl) return;
    this._syncConfigOverlayTheme();
    this._configSection = '';
    this._wallpaperMessage = '';
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'config';
    this._renderConfigPanel();
  }

  _closeConfigPanel() {
    if (!this._configOverlayEl) return;
    this._spotifyPanelCard = null;
    this._spotifyPanelConfig = null;
    this._configSection = '';
    this._wallpaperMessage = '';
    delete this._configOverlayEl.dataset.open;
    delete this._configOverlayEl.dataset.panel;
    this._configOverlayEl.hidden = true;
    this._configOverlayEl.replaceChildren();
  }

  _renderConfigPanel({ preserveScroll = false } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden) return;
    const previousScrollTop = preserveScroll
      ? this._configOverlayEl.querySelector('.updates-scroll')?.scrollTop || 0
      : 0;
    const manager = globalThis.BrunoThemeManager;
    const wallpaperManager = globalThis.BrunoWallpaperManager;
    const updateCount = this._pendingUpdatesCount();
    const child = this._renderConfigChild();

    this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-config-action="close"></div>
      <section class="config-panel config-root-panel${child ? ' has-child' : ''}" role="dialog" aria-modal="true" aria-label="Configuracoes">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render('settings') || ''}
          </span>
          <div class="config-title">
            <strong>Config</strong>
            <span>Preferencias do painel</span>
          </div>
          <button class="config-close" type="button" data-config-action="close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section config-menu-section">
          <div class="config-menu-list">
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="themes">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render('palette') || ''}
              </span>
              <span class="config-menu-copy"><strong>Themes</strong><small>${BrunoShell._escape(manager?.activeLabel?.() || 'VisionOS')}</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="wallpaper">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render('wallpaper') || ''}
              </span>
              <span class="config-menu-copy"><strong>Wallpaper</strong><small>${wallpaperManager ? 'Shell e subviews' : 'Modulo indisponivel'}</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="updates">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render('updates') || ''}
              </span>
              <span class="config-menu-copy"><strong>Updates</strong><small>${updateCount ? `${updateCount} ${updateCount === 1 ? 'pendente' : 'pendentes'}` : 'Abrir central'}</small></span>
              ${updateCount ? `<span class="config-menu-count">${updateCount > 99 ? '99+' : updateCount}</span>` : '<span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>'}
            </button>
            <!-- NOVO (Fase 6.0) — DIAGNOSTICO.
                 Ate aqui o painel <bruno-diagnostics> existia no bundle e nao
                 estava em view nenhuma: nao havia como chegar nele. E a unica
                 superficie que le a baseline de runtime NO TABLET, onde nao ha
                 console. Sem esta entrada, a Fase 6.0 nao teria como ser colhida. -->
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="diagnostico">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render('system') || ''}
              </span>
              <span class="config-menu-copy"><strong>Diagnostico</strong><small>Runtime, entidades e cameras</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
            <!-- NOVO (Fase 5e.5) — ATUALIZAR vem da faixa de acoes rapidas.
                 Recarrega a pagina; era o unico efeito util do botao antigo
                 (o shell_command do repositorio de origem nao existe aqui).
                 ROLLBACK: remover este botao e descomentar o item "refresh"
                 em views/main-grid/v2/bento_bottom_block.yaml. -->
            <button class="config-menu-item" type="button" data-config-action="refresh">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render('refresh') || ''}
              </span>
              <span class="config-menu-copy"><strong>Atualizar</strong><small>Recarregar o painel</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
          </div>
        </div>
      </section>
      ${child}
    `;
    // Fase 6.0: o painel de diagnostico e um ELEMENTO, nao texto — encaixa
    // depois que o innerHTML acima ja existe.
    if (this._configSection === 'diagnostico') {
      const host = this._configOverlayEl.querySelector('#diagnosticoHost');
      const el = this._montarDiagnostico();
      if (host && el) host.replaceChildren(el);
      else if (host) host.textContent = 'Bundle nao carregado.';
    }
    if (preserveScroll && previousScrollTop) {
      const scrollEl = this._configOverlayEl.querySelector('.updates-scroll');
      if (scrollEl) scrollEl.scrollTop = previousScrollTop;
    }
  }

  /**
   * Fase 6.0 — o painel de diagnostico dentro de Configuracoes.
   *
   * <bruno-diagnostics> e um componente Lit do bundle novo: recebe `hass` por
   * PROPRIEDADE, entao nao da para monta-lo por innerHTML como os demais
   * paineis desta shell. O elemento e criado uma vez e reaproveitado — recria-lo
   * zeraria a rolagem e a mensagem de "baseline copiada".
   */
  _montarDiagnostico() {
    if (!this._diagnosticoEl) {
      if (!customElements.get('bruno-diagnostics')) return null;
      this._diagnosticoEl = document.createElement('bruno-diagnostics');
      this._diagnosticoEl.setConfig?.({});
    }
    if (this._hass) this._diagnosticoEl.hass = this._hass;
    return this._diagnosticoEl;
  }

  _renderDiagnosticoChild() {
    // O conteudo real e inserido depois, em _renderConfigPanel, porque aqui a
    // shell trabalha com texto e o painel e um ELEMENTO.
    return `
      <section class="config-panel config-child-panel" role="dialog" aria-modal="true" aria-label="Diagnostico">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">${globalThis.BrunoIcons?.render('system') || ''}</span>
          <div class="config-title"><strong>Diagnostico</strong><span>Runtime, entidades e cameras</span></div>
          <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section" id="diagnosticoHost"></div>
      </section>
    `;
  }

  _renderConfigChild() {
    if (!this._configSection) return '';
    if (this._configSection === 'themes') return this._renderThemesChild();
    if (this._configSection === 'wallpaper') return this._renderWallpaperChild();
    if (this._configSection === 'diagnostico') return this._renderDiagnosticoChild();
    if (this._configSection === 'updates') {
      if (globalThis.BrunoUpdatesPanel?.render) {
        return globalThis.BrunoUpdatesPanel.render({ hass: this._hass, embedded: true });
      }
      return `
        <section class="config-panel config-child-panel" role="dialog" aria-modal="true" aria-label="Updates">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Updates</strong><span>Modulo indisponivel</span></div>
            <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
    }
    return '';
  }

  _renderThemesChild() {
    const manager = globalThis.BrunoThemeManager;
    const themes = manager?.list?.() || [];
    const current = manager?.current?.() || 'visionos';
    return `
      <section class="config-panel config-child-panel" role="dialog" aria-modal="true" aria-label="Themes">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render('palette') || ''}
          </span>
          <div class="config-title"><strong>Themes</strong><span>${BrunoShell._escape(manager?.activeLabel?.() || current)}</span></div>
          <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section">
          <div class="theme-list">
            ${themes.map((theme) => `
              <button class="theme-option${theme.key === current ? ' is-selected' : ''}" type="button"
                data-config-action="theme" data-theme="${BrunoShell._escapeAttr(theme.key)}" ${theme.available ? '' : 'disabled'}>
                <span>${BrunoShell._escape(theme.label)}</span>
                <small>${theme.key === current ? 'Atual' : (theme.available ? 'Disponivel' : 'Indisponivel')}</small>
              </button>
            `).join('')}
          </div>
        </div>
        <footer class="config-footer"><button class="config-refresh" type="button" data-config-action="reload">Atualizar</button></footer>
      </section>
    `;
  }

  _renderWallpaperChild() {
    const manager = globalThis.BrunoWallpaperManager;
    const sections = manager?.sections || [];
    const selected = manager?.section?.(this._wallpaperSection) || sections[0] || { key: 'home', label: 'Painel principal' };
    this._wallpaperSection = selected.key;
    const value = manager?.value?.(this._hass, selected.key) || '';
    const fallback = (this._backdrops && (this._backdrops[selected.key] || this._backdrops.default)) || '';
    const preview = manager?.resolve?.(this._hass, selected.key, fallback) || fallback;
    const helperAvailable = Boolean(this._hass?.states?.[selected.entity]);
    return `
      <section class="config-panel config-child-panel wallpaper-panel" role="dialog" aria-modal="true" aria-label="Wallpaper">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render('wallpaper') || ''}
          </span>
          <div class="config-title"><strong>Wallpaper</strong><span>Shell e subviews</span></div>
          <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section wallpaper-content">
          <div class="wallpaper-field">
            <span>Area</span>
            <div class="wallpaper-area-list" role="listbox" aria-label="Area do wallpaper">
              ${sections.map((section) => `
                <button class="wallpaper-area-option${section.key === selected.key ? ' is-selected' : ''}" type="button"
                  data-config-action="wallpaper-area" data-wallpaper-key="${BrunoShell._escapeAttr(section.key)}"
                  role="option" aria-selected="${section.key === selected.key ? 'true' : 'false'}">
                  ${BrunoShell._escape(section.label)}
                </button>
              `).join('')}
            </div>
          </div>
          <div class="wallpaper-preview${preview ? ' has-image' : ''}" style="${preview ? `--wallpaper-preview:url('${BrunoShell._escapeAttr(BrunoShell._cssUrl(preview))}')` : ''}" aria-hidden="true"></div>
          <input id="wallpaperFile" class="wallpaper-file-input" type="file" accept="image/jpeg,image/png,image/gif" data-config-action="wallpaper-file">
          <button class="wallpaper-file-button" type="button" data-config-action="wallpaper-pick">Selecionar imagem</button>
          <label class="wallpaper-field">
            <span>URL opcional</span>
            <input id="wallpaperUrl" type="text" spellcheck="false" value="${BrunoShell._escapeAttr(value)}" placeholder="${BrunoShell._escapeAttr(fallback)}">
          </label>
          <small class="wallpaper-help">A imagem selecionada e armazenada pelo Home Assistant e aplicada sem editar codigo nem fazer cache buster.</small>
          ${helperAvailable ? '' : '<small class="wallpaper-message is-warning">Helpers serao ativados apos reiniciar o Home Assistant.</small>'}
          ${this._wallpaperMessage ? `<small class="wallpaper-message">${BrunoShell._escape(this._wallpaperMessage)}</small>` : ''}
        </div>
        <footer class="config-footer wallpaper-footer">
          <button class="config-secondary" type="button" data-config-action="wallpaper-default">Usar padrao</button>
          <button class="config-refresh" type="button" data-config-action="wallpaper-save">Aplicar</button>
        </footer>
      </section>
    `;
  }

  _pendingUpdatesCount() {
    const states = this._hass?.states || {};
    const entityCount = Object.entries(states)
      .filter(([entityId, state]) => entityId.startsWith('update.') && state?.state === 'on')
      .length;
    const aggregate = Number(states['sensor.hassio_updates_available']?.state) || 0;
    return Math.max(entityCount, aggregate);
  }

  _refreshUpdatesPanel({ preserveScroll = true } = {}) {
    if (this._configOverlayEl?.dataset.panel === 'config' && this._configSection === 'updates') {
      this._renderConfigPanel({ preserveScroll });
      return;
    }
    this._renderUpdatesPanel({ preserveScroll });
  }

  _openUpdatesPanel() {
    if (!this._configOverlayEl) return;
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'updates';
    this._renderUpdatesPanel();
  }

  _renderUpdatesPanel({ preserveScroll = false } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== 'updates') return;
    const previousScrollTop = preserveScroll
      ? this._configOverlayEl.querySelector('.updates-scroll')?.scrollTop || 0
      : 0;
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
    if (preserveScroll && previousScrollTop) {
      const scrollEl = this._configOverlayEl.querySelector('.updates-scroll');
      if (scrollEl) scrollEl.scrollTop = previousScrollTop;
    }
  }

  _openSystemPanel() {
    if (!this._configOverlayEl) return;
    this._syncConfigOverlayTheme();
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'system';
    this._renderSystemPanel();
  }

  /**
   * NOVO (Fase 5e.6) — painel Dispositivos.
   *
   * Diferente dos demais paineis desta shell, o conteudo NAO vem de innerHTML:
   * <bruno-devices-panel> e um componente Lit do bundle novo, e precisa receber
   * `hass` por PROPRIEDADE. Por isso o elemento e criado e reaproveitado — cada
   * recriacao perderia o dispositivo selecionado e o estado dos controles.
   *
   * O componente nao sabe o que e uma TV: a lista sai de devices.config.ts e
   * cada controle vem do registry (application/device-registry.ts).
   */
  _openDevicesPanel() {
    if (!this._configOverlayEl) return;
    this._syncConfigOverlayTheme();
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'devices';
    this._renderDevicesPanel();
  }

  _renderDevicesPanel() {
    const overlay = this._configOverlayEl;
    if (!overlay || overlay.hidden || overlay.dataset.panel !== 'devices') return;

    if (!customElements.get('bruno-devices-panel')) {
      overlay.innerHTML = `
        <div class="config-scrim" data-system-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Dispositivos">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Dispositivos</strong><span>Bundle nao carregado</span></div>
            <button class="config-close" type="button" data-system-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
      return;
    }

    if (!this._devicesPanelEl) {
      this._devicesPanelEl = document.createElement('bruno-devices-panel');
      this._devicesPanelEl.addEventListener('fechar', () => this._closeConfigPanel());
    }
    this._devicesPanelEl.hass = this._hass;

    // O scrim e do overlay, nao do componente: fechar clicando fora ja e
    // tratado pelo mesmo handler dos demais paineis.
    if (this._devicesPanelEl.parentNode !== overlay) {
      overlay.innerHTML = '<div class="config-scrim" data-system-action="close"></div>';
      overlay.appendChild(this._devicesPanelEl);
    }
  }

  _renderSystemPanel({ preserveScroll = false } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== 'system') return;
    const previousScrollTop = preserveScroll
      ? this._configOverlayEl.querySelector('.system-scroll')?.scrollTop || 0
      : 0;
    if (!globalThis.BrunoSystemPanel?.render) {
      this._configOverlayEl.innerHTML = `
        <div class="config-scrim" data-system-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Sistema">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Sistema</strong><span>Modulo indisponivel</span></div>
            <button class="config-close" type="button" data-system-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
      return;
    }
    this._configOverlayEl.innerHTML = globalThis.BrunoSystemPanel.render({ hass: this._hass });
    if (preserveScroll && previousScrollTop) {
      const scrollEl = this._configOverlayEl.querySelector('.system-scroll');
      if (scrollEl) scrollEl.scrollTop = previousScrollTop;
    }
  }

  _openNetworkPanel() {
    if (!this._configOverlayEl) return;
    this._syncConfigOverlayTheme();
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'network';
    // 5e.4: toda abertura comeca pelo QR de visitantes.
    this._networkStep = 'qr';
    this._renderNetworkPanel();
  }

  _openScenesPanel() {
    if (!this._configOverlayEl) return;
    this._syncConfigOverlayTheme();
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'scenes';
    if (globalThis.BrunoScenesPanel?.render) {
      this._configOverlayEl.innerHTML = globalThis.BrunoScenesPanel.render({ hass: this._hass });
      return;
    }
    this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-scenes-action="close"></div>
      <section class="config-panel" role="dialog" aria-modal="true" aria-label="Cenas">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">!</span>
          <div class="config-title"><strong>Cenas</strong><span>Modulo indisponivel</span></div>
          <button class="config-close" type="button" data-scenes-action="close" aria-label="Fechar">&times;</button>
        </header>
      </section>
    `;
  }

  async _openSpotifyPanel(config = {}) {
    if (!this._configOverlayEl) return;
    this._spotifyPanelConfig = {
      entity: config.entity || 'media_player.spotifyplus_bruno_helasio',
      deviceDefaultId: config.deviceDefaultId || 'Echo Show',
    };
    this._configOverlayEl.hidden = false;
    this._configOverlayEl.dataset.open = '1';
    this._configOverlayEl.dataset.panel = 'spotify';
    this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-spotify-action="close"></div>
      <section class="config-panel spotify-panel" role="dialog" aria-modal="true" aria-label="Escolher midia">
        <header class="config-header">
          <span class="config-icon spotify-panel-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render('spotify') || ''}
          </span>
          <div class="config-title">
            <strong>Spotify</strong>
            <span>Escolher midia</span>
          </div>
          <button class="config-close" type="button" data-spotify-action="close" aria-label="Fechar">&times;</button>
        </header>
        <div class="spotify-panel-body">
          <div class="spotify-card-host" id="spotifyCardHost">
            <span class="spotify-panel-loading">Carregando biblioteca...</span>
          </div>
        </div>
      </section>
    `;

    try {
      const card = await this._createCard({
        type: 'custom:spotifyplus-card',
        cardUniqueId: 'bruno-shell-spotify-panel',
        entity: this._spotifyPanelConfig.entity,
        deviceDefaultId: this._spotifyPanelConfig.deviceDefaultId,
        deviceControlByName: true,
        width: 'fill',
        playerBackgroundImageSize: 'cover',
        sections: ['player', 'devices', 'userpresets', 'playlistfavorites', 'searchmedia'],
        sectionDefault: 'player',
      });
      if (this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== 'spotify') return;
      this._spotifyPanelCard = card;
      if (this._hass) card.hass = this._hass;
      this._configOverlayEl.querySelector('#spotifyCardHost')?.replaceChildren(card);
    } catch (error) {
      const host = this._configOverlayEl.querySelector('#spotifyCardHost');
      if (host) host.innerHTML = `<span class="spotify-panel-loading">${BrunoShell._escape(error?.message || 'Spotify indisponivel')}</span>`;
    }
  }

  /**
   * NOVO (Fase 5e.4) — WI-FI ABSORVIDO PELO BOTAO REDE, EM CADEIA.
   *
   * O Wi-Fi era um botao da faixa de acoes rapidas que abria um browser_mod
   * popup com o QR da rede de visitantes. Com a faixa removida, a funcao passa
   * para o botao Rede da rail, como PRIMEIRO passo: o simples primeiro, o
   * avancado a um toque. E a mesma navegacao em cadeia que o dashboard ja usa.
   *
   * `_networkStep` guarda em que passo a cadeia esta:
   *   'qr'       -> QR de visitantes (padrao ao abrir)
   *   'avancado' -> painel de rede que ja existia (BrunoNetworkPanel)
   *
   * ROLLBACK: apagar este metodo e o campo `_networkStep`, e voltar
   * `_openNetworkPanel` a chamar `_renderNetworkPanel` direto.
   */
  _renderNetworkQrStep() {
    const imagem = this._config?.wifi_qr_image || '/local/images/wifi_main_scanme.png';
    this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-network-action="close"></div>
      <section class="config-panel" role="dialog" aria-modal="true" aria-label="Rede">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">${globalThis.BrunoIcons?.render('network') || ''}</span>
          <div class="config-title"><strong>Wi-Fi</strong><span>Rede de visitantes</span></div>
          <button class="config-close" type="button" data-network-action="close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section">
          <img class="network-qr" src="${BrunoShell._escape(imagem)}" alt="QR Code da rede de visitantes">
          <p class="network-qr-dica">Aponte a camera para conectar.</p>
          <div class="config-menu-list">
            <button class="config-menu-item" type="button" data-network-action="avancado">
              <span class="config-menu-icon" aria-hidden="true">${globalThis.BrunoIcons?.render('system') || ''}</span>
              <span class="config-menu-copy"><strong>Configuracoes de rede</strong><small>Detalhes e diagnostico</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
          </div>
        </div>
      </section>
    `;
  }

  _renderNetworkPanel({ preserveScroll = false } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== 'network') return;
    // Primeiro passo da cadeia: QR de visitantes.
    if (this._networkStep !== 'avancado') {
      this._renderNetworkQrStep();
      return;
    }
    const previousScrollTop = preserveScroll
      ? this._configOverlayEl.querySelector('.network-scroll')?.scrollTop || 0
      : 0;
    if (!globalThis.BrunoNetworkPanel?.render) {
      this._configOverlayEl.innerHTML = `
        <div class="config-scrim" data-network-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Rede">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Rede</strong><span>Modulo indisponivel</span></div>
            <button class="config-close" type="button" data-network-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
      return;
    }
    this._configOverlayEl.innerHTML = globalThis.BrunoNetworkPanel.render({ hass: this._hass });
    if (preserveScroll && previousScrollTop) {
      const scrollEl = this._configOverlayEl.querySelector('.network-scroll');
      if (scrollEl) scrollEl.scrollTop = previousScrollTop;
    }
  }

  _handleConfigClick(event) {
    const scenesTarget = event.target?.closest?.('[data-scenes-action]');
    if (scenesTarget) {
      event.preventDefault();
      event.stopPropagation();
      globalThis.BrunoScenesPanel?.handleAction?.({
        target: scenesTarget,
        hass: this._hass,
        host: this,
      });
      if (scenesTarget.dataset.scenesAction === 'close' && !globalThis.BrunoScenesPanel?.handleAction) {
        this._closeConfigPanel();
      }
      return;
    }

    const spotifyTarget = event.target?.closest?.('[data-spotify-action]');
    if (spotifyTarget) {
      event.preventDefault();
      event.stopPropagation();
      const action = spotifyTarget.dataset.spotifyAction;
      if (action === 'close') {
        this._closeConfigPanel();
        return;
      }
      return;
    }

    const systemTarget = event.target?.closest?.('[data-system-action]');
    if (systemTarget) {
      event.preventDefault();
      event.stopPropagation();
      if (systemTarget.dataset.systemAction === 'close') {
        this._closeConfigPanel();
        return;
      }
      globalThis.BrunoSystemPanel?.handleAction?.({ target: systemTarget, hass: this._hass, host: this });
      return;
    }

    const networkTarget = event.target?.closest?.('[data-network-action]');
    if (networkTarget) {
      event.preventDefault();
      event.stopPropagation();
      if (networkTarget.dataset.networkAction === 'close') {
        this._closeConfigPanel();
        return;
      }
      // NOVO (5e.4): segundo passo da cadeia — o painel avancado que ja existia.
      if (networkTarget.dataset.networkAction === 'avancado') {
        this._networkStep = 'avancado';
        this._renderNetworkPanel();
        return;
      }
      globalThis.BrunoNetworkPanel?.handleAction?.({ target: networkTarget, hass: this._hass, host: this });
      return;
    }

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
    if (action === 'open-section') {
      this._configSection = target.dataset.section || '';
      this._wallpaperMessage = '';
      this._renderConfigPanel();
      return;
    }
    if (action === 'child-close') {
      this._configSection = '';
      this._wallpaperMessage = '';
      this._renderConfigPanel();
      return;
    }
    // NOVO (Fase 5e.5): Atualizar, vindo da faixa de acoes rapidas.
    if (action === 'refresh') {
      this._closeConfigPanel();
      globalThis.location?.reload?.();
      return;
    }
    if (action === 'theme') {
      const theme = target.dataset.theme;
      globalThis.BrunoThemeManager?.apply?.(theme);
      this._renderConfigPanel();
      return;
    }
    if (action === 'wallpaper-save') {
      this._saveWallpaper();
      return;
    }
    if (action === 'wallpaper-area') {
      this._wallpaperSection = target.dataset.wallpaperKey || 'home';
      this._wallpaperMessage = '';
      this._renderConfigPanel();
      return;
    }
    if (action === 'wallpaper-pick') {
      this._configOverlayEl?.querySelector('#wallpaperFile')?.click?.();
      return;
    }
    if (action === 'wallpaper-default') {
      this._saveWallpaper('');
      return;
    }
    if (action === 'reload') {
      globalThis.location?.reload?.();
    }
  }

  _handleConfigChange(event) {
    const target = event.target?.closest?.('[data-config-action]');
    if (!target) return;
    if (target.dataset.configAction === 'wallpaper-file') {
      const file = target.files?.[0];
      target.value = '';
      if (file) this._uploadWallpaper(file);
    }
  }

  async _uploadWallpaper(file) {
    const manager = globalThis.BrunoWallpaperManager;
    if (!manager?.upload) return;
    this._wallpaperMessage = 'Enviando imagem...';
    this._renderConfigPanel();
    try {
      await manager.upload({ hass: this._hass, key: this._wallpaperSection, file });
      this._wallpaperMessage = 'Wallpaper aplicado.';
    } catch (error) {
      this._wallpaperMessage = error?.message || 'Nao foi possivel enviar a imagem.';
    }
    this._renderConfigPanel();
  }

  async _saveWallpaper(forcedValue) {
    const manager = globalThis.BrunoWallpaperManager;
    if (!manager?.save) return;
    const input = this._configOverlayEl?.querySelector('#wallpaperUrl');
    const value = forcedValue === undefined ? input?.value || '' : forcedValue;
    this._wallpaperMessage = 'Salvando...';
    this._renderConfigPanel();
    try {
      await manager.save({ hass: this._hass, key: this._wallpaperSection, url: value });
      this._wallpaperMessage = value ? 'Wallpaper aplicado.' : 'Wallpaper padrao restaurado.';
    } catch (error) {
      this._wallpaperMessage = error?.message || 'Nao foi possivel salvar o wallpaper.';
    }
    this._renderConfigPanel();
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
        transition: opacity 0.28s ease-out, filter 0.22s ease-out, transform 0.22s ease-out;
        will-change: opacity;
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
        /* NOVO (2026-07-24) — feedback Home V2: rail SEM filete divisor.
           ROLLBACK: remover a linha abaixo (o gradiente acima volta a valer). */
        display: none;
      }

      .content-slot {
        grid-column: 2;
        position: relative;
        z-index: 1;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        /* ANTERIOR (rollback 2026-08-05): padding: 12px;
           O respiro da shell inteira vive aqui — a coluna da rail é colada na
           borda (gap 0, padding 0 no .shell). Os 12px da ESQUERDA eram a
           distancia entre a rail e o conteudo, e o usuario pediu para reduzi-la.
           Os outros tres lados ficam em 12px: eles sustentam o alinhamento
           atual do topo, da direita e da base. O ganho de 6px se distribui
           pelas colunas da secao — na Home a faixa de tiles e fracionaria; nas
           subviews as duas colunas sao fracionarias na resolucao do tablet. */
        /* ANTERIOR (rollback 2026-08-06): padding: 12px 12px 12px 6px;
           2a reducao a pedido do usuario — o respiro da rail continuava
           incomodando. De 12 -> 6 -> 2px. Abaixo de 2px a coluna da rail
           encosta no primeiro cartao e a divisoria some. */
        padding: 12px 12px 12px 2px;
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

      /* display:block acima tem a mesma origem autoral do atributo hidden e
         pode vence-lo no cascade. Esta regra garante que a Home persistente
         fique realmente invisivel e sem ocupar layout fora da secao Home. */
      .content-slot > [hidden] {
        display: none !important;
      }

      .content-slot > .section-error {
        position: absolute;
        inset: 12px;
        z-index: 3;
        height: auto;
        pointer-events: none;
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

      /* ANTERIOR (rollback 2026-08-06): background rgba(0,0,0,0.08) + blur(2px).
         O tema Josh deixa os popups TRANSLUCIDOS de proposito — a foto de fundo
         atravessa. Com um scrim de 8% e blur de 2px o conteudo do painel
         competia com o cenario e ficava dificil de ler. O scrim e o blur sobem;
         a translucidez do painel fica intacta, so o que esta ATRAS e que recua. */
      .config-scrim {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.42);
        -webkit-backdrop-filter: blur(14px) saturate(0.92) brightness(0.82);
        backdrop-filter: blur(14px) saturate(0.92) brightness(0.82);
      }

      /* NOVO (5e.4) — passo do QR de visitantes no painel Rede. */
      .network-qr {
        display: block;
        width: min(260px, 100%);
        margin: 4px auto 10px;
        border-radius: 14px;
        background: #fff;
        padding: 8px;
        box-sizing: border-box;
      }
      .network-qr-dica {
        margin: 0 0 12px;
        text-align: center;
        font-size: 12px;
        color: rgba(255,255,255,0.62);
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

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel {
        --bruno-popup-inner-background: var(--bruno-liquid-control-background);
        --bruno-popup-inner-filter: var(--bruno-liquid-control-filter);
        --bruno-popup-inner-border: var(--bruno-liquid-control-border);
        --bruno-popup-inner-shadow: var(--bruno-liquid-control-shadow);
        --bruno-popup-inner-radius: var(--bruno-liquid-control-radius-compact, 12px);
        --bruno-popup-inner-warm-background: var(--bruno-liquid-control-warm-background, var(--bruno-liquid-control-background));
        --bruno-popup-inner-warm-border: var(--bruno-liquid-control-warm-border, var(--bruno-liquid-control-border));
        --bruno-popup-inner-warm-shadow: var(--bruno-liquid-control-warm-shadow, var(--bruno-liquid-control-shadow));
        --bruno-popup-action-radius: var(--bruno-liquid-control-radius-compact, 12px);
        --bruno-popup-banner-border: var(--bruno-liquid-control-border);
        --bruno-popup-banner-radius: var(--bruno-liquid-control-radius-compact, 12px);
        --bruno-popup-banner-shadow: var(--bruno-liquid-control-shadow);
        border: var(--bruno-josh-popup-border, var(--bruno-liquid-popup-border));
        background: var(--bruno-josh-popup-background, var(--bruno-liquid-popup-background));
        box-shadow: var(--bruno-josh-popup-shadow, var(--bruno-liquid-popup-shadow));
        -webkit-backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
        backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
        isolation: isolate;
      }

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel::before,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel::before,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel::before,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        border-radius: inherit;
        background: var(--bruno-josh-popup-sheen, none);
        opacity: var(--bruno-josh-popup-sheen-opacity, 0.13);
        pointer-events: none;
      }

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel::after,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel::after,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel::after,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        padding: 1px;
        border-radius: inherit;
        background: var(--bruno-josh-popup-edge-glow, none);
        opacity: var(--bruno-josh-popup-edge-opacity, 0.70);
        pointer-events: none;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
      }

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel > *,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel > *,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel > *,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel > * {
        position: relative;
        z-index: 1;
      }

      .config-child-panel {
        left: 466px;
        width: min(430px, calc(100vw - 496px));
      }

      .config-child-panel.updates-panel {
        width: min(520px, calc(100vw - 496px));
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

      .config-menu-section {
        padding-top: 2px;
      }

      .config-menu-list {
        display: grid;
      }

      .config-menu-item {
        min-height: 54px;
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 8px 3px;
        border: 0;
        border-top: 1px solid rgba(255,255,255,0.060);
        background: transparent;
        color: rgba(255,255,255,0.88);
        text-align: left;
        cursor: pointer;
      }

      .config-menu-item:first-child {
        border-top: 0;
      }

      .config-menu-item:hover,
      .config-menu-item:focus-visible {
        background: rgba(255,255,255,0.035);
      }

      .config-menu-icon {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.88);
      }

      .config-menu-icon svg {
        width: 19px;
        height: 19px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.65;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .config-menu-copy {
        min-width: 0;
        display: grid;
        gap: 3px;
      }

      .config-menu-copy strong {
        font-size: 12px;
        line-height: 1.1;
        font-weight: 800;
      }

      .config-menu-copy small {
        min-width: 0;
        font-size: 9px;
        line-height: 1.1;
        color: rgba(255,255,255,0.54);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .config-menu-chevron {
        color: rgba(255,255,255,0.44);
        font-size: 22px;
        line-height: 1;
      }

      .config-menu-count {
        min-width: 21px;
        height: 21px;
        display: grid;
        place-items: center;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.16);
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.96);
        font-size: 9px;
        font-weight: 900;
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

      .config-secondary {
        min-height: 34px;
        border: 1px solid rgba(255,255,255,0.070);
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: rgba(255,255,255,0.026);
        color: rgba(255,255,255,0.64);
        padding: 0 12px;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .wallpaper-content {
        display: grid;
        gap: 12px;
      }

      .wallpaper-field {
        display: grid;
        gap: 6px;
      }

      .wallpaper-field > span {
        font-size: 10px;
        font-weight: 800;
        color: rgba(255,255,255,0.72);
      }

      .wallpaper-field select,
      .wallpaper-field input {
        width: 100%;
        min-height: 40px;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: rgba(10,12,16,0.22);
        color: rgba(255,255,255,0.86);
        padding: 0 11px;
        font: inherit;
        font-size: 11px;
        outline: none;
      }

      .wallpaper-area-list {
        max-height: 162px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px;
        overflow-y: auto;
        padding-right: 2px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.20) transparent;
      }

      .wallpaper-area-option,
      .wallpaper-file-button {
        min-height: 34px;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        border-radius: var(--bruno-liquid-control-radius-compact, 12px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        color: rgba(255,255,255,0.76);
        padding: 0 9px;
        font: inherit;
        font-size: 10px;
        font-weight: 760;
        text-align: left;
        cursor: pointer;
      }

      .wallpaper-area-option.is-selected {
        color: rgba(255,255,255,0.96);
        border-color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.28);
        background: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.08);
      }

      .wallpaper-preview {
        height: 92px;
        border-radius: var(--bruno-liquid-cell-radius, 13px);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        background: rgba(255,255,255,0.025);
        overflow: hidden;
      }

      .wallpaper-preview.has-image {
        background: var(--wallpaper-preview) center / cover no-repeat;
      }

      .wallpaper-file-input {
        display: none;
      }

      .wallpaper-file-button {
        width: 100%;
        min-height: 38px;
        color: rgba(255,255,255,0.88);
        text-align: center;
      }

      .wallpaper-field input:focus,
      .wallpaper-field select:focus {
        border-color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.32);
      }

      .wallpaper-help,
      .wallpaper-message {
        font-size: 9px;
        line-height: 1.35;
        color: rgba(255,255,255,0.50);
      }

      .wallpaper-message {
        color: rgba(124,236,169,0.82);
      }

      .wallpaper-message.is-warning {
        color: rgba(255,210,122,0.78);
      }

      .wallpaper-footer {
        justify-content: space-between;
        gap: 10px;
      }

      .config-panel.spotify-panel {
        left: 50%;
        top: 50%;
        bottom: auto;
        width: min(590px, calc(100vw - 132px));
        max-height: min(680px, calc(100vh - 64px));
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        transform: translate(-50%, -50%);
      }

      .spotify-panel-icon {
        color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.94);
      }

      .spotify-panel-body {
        min-height: 0;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.24) transparent;
        -webkit-overflow-scrolling: touch;
        padding: 0 12px 14px;
      }

      .spotify-panel-body::-webkit-scrollbar {
        width: 5px;
      }

      .spotify-panel-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .spotify-panel-body::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(255,255,255,0.24);
      }

      .spotify-card-host {
        min-height: 260px;
        overflow: hidden;
        border-radius: var(--bruno-liquid-cell-radius, 14px);
        background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.025));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        --ha-card-background: transparent;
        --card-background-color: transparent;
        --ha-card-border-width: 0;
        --ha-card-border-color: transparent;
        --ha-card-box-shadow: none;
        --ha-card-border-radius: 0;
        --primary-background-color: transparent;
        --secondary-background-color: transparent;
      }

      .spotify-card-host > * {
        display: block;
        width: 100%;
      }

      .spotify-panel-loading {
        min-height: 260px;
        display: grid;
        place-items: center;
        padding: 20px;
        color: rgba(255,255,255,0.58);
        font-size: 11px;
        font-weight: 700;
      }

      .err {
        padding: 16px;
        color: #ffd9df;
        font: 600 13px/1.4 var(--primary-font-family, inherit);
      }

      /* ============================================================
         NOVO (2026-07-09) — MODO PHONE (<=800px, Opcao A mobile).
         A MESMA shell se reorganiza em telas estreitas:
           - grid vira 1 COLUNA com 2 linhas: conteudo em cima + rail
             embaixo (o bento-sidebar-card "deita" e vira dock via
             media query propria — ver bento-sidebar-card.js);
           - .content-slot passa a ROLAR verticalmente (no tablet ele
             e fixo, overflow hidden);
           - as secoes deixam de ser esticadas a 100% da altura
             (height auto + min-height 100%) para empilhar em coluna;
           - o painel de Config ancora acima do dock (no tablet ele
             ancora ao lado da rail esquerda).
         Bloco ADITIVO (regra de ouro): nada acima foi alterado.
         ROLLBACK: remover este bloco @media => shell volta a ser
         tablet-only (rail lateral em qualquer largura).
         ============================================================ */
      @media (max-width: 800px) {
        :host {
          height: 100vh;
          height: 100dvh;

          /* NOVO (2026-08-10) — ALTURA DO DOCK, publicada para quem esta DENTRO
             do content-slot. Propriedade customizada atravessa shadow DOM por
             heranca, entao a subview le este valor sem conhecer a shell.
             Serve para a bottom sheet do telefone parar ACIMA do dock: o
             rail-slot tem z-index 2 e o content-slot 1, logo nada de dentro do
             conteudo consegue ser pintado sobre o dock.
             Se a altura do dock mudar em bento-sidebar-card.js, mudar AQUI. */
          /* Rede de seguranca. O valor bom vem de _observarDock(), que MEDE. */
          --bruno-dock-h: calc(74px + env(safe-area-inset-bottom, 0px));
          /* Material VisionOS compartilhado pela folha e pela rail quando a
             folha esta aberta. Escopo exclusivo do telefone. */
          --bruno-mobile-sheet-background:
            radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%),
            linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)),
            rgba(0,0,0,0.300);
          --bruno-mobile-sheet-filter: blur(20px) saturate(1.18) brightness(1.03);
        }
        .shell {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr) auto;
        }
        .rail-slot {
          grid-column: 1;
          grid-row: 2;
          /* Fase 2: acima do content-slot (z 1) para o menu "Mais" do dock
             abrir SOBRE o conteudo, nao por baixo. */
          z-index: 2;
        }
        .rail-slot::after {
          display: block;
          top: 0;
          left: 0;
          right: auto;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%);
        }
        /* ANTERIOR (rollback rev. faixa-de-tiles): a folha elevava o
           content-slot acima do dock. Isso fazia a bottom sheet cobrir a rail:
           .shell.tem-folha .content-slot { z-index: 3; }

           NOVO (2026-08-12): a rail permanece fixa e a frente da folha. A
           classe tem-folha continua sendo publicada por _onFolha(), mas agora
           eleva apenas o rail-slot. As regras vivem exclusivamente no phone;
           a rail vertical do tablet conserva a pilha original. */
        .shell.tem-folha .content-slot {
          z-index: 1;
        }
        .shell.tem-folha .rail-slot {
          z-index: 4;
          /* A rail transparente recebe a mesma superficie da folha. Assim os
             dois planos se encostam sem degrau; o pseudo-elemento acima fica
             como o unico filete de separacao e continua visivel fechada. */
          background: var(--bruno-mobile-sheet-background);
          backdrop-filter: var(--bruno-mobile-sheet-filter);
          -webkit-backdrop-filter: var(--bruno-mobile-sheet-filter);
        }

        .content-slot {
          grid-column: 1;
          grid-row: 1;
          overflow-y: auto;
          -webkit-overflow-scrolling: touch;
          padding: 10px 10px 6px;
        }
        .content-slot > * {
          height: auto;
          min-height: 100%;
        }
        .config-panel {
          left: 12px;
          right: 12px;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          width: auto;
        }

        .config-root-panel.has-child {
          display: none;
        }

        .config-child-panel,
        .config-child-panel.updates-panel {
          left: 12px;
          right: 12px;
          width: auto;
        }

        .config-panel.spotify-panel {
          left: 12px;
          right: 12px;
          top: 12px;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          width: auto;
          height: auto;
          max-height: none;
          transform: none;
        }
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

  static _cssUrl(value) {
    return String(value == null ? '' : value)
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'");
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
