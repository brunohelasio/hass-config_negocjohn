const BRUNO_CAMERAS_SECURITY_SUBVIEW_TAG = 'bruno-cameras-security-subview';

const BRUNO_CAMERAS_SECURITY_DEFAULT_CONFIG = {
  title: 'Residence Security',
  section: 'Cameras',
  active_entity: 'input_select.bento_active_camera',
  navigation_path: 'bento-lab',
  refresh_interval: 6500,
  cameras: [
    { entity: 'camera.sl_camera_2', name: 'PRINCIPAL: SALA', short_name: 'SL - Sala' },
    { entity: 'camera.vr_camera_2', name: 'VR - Varanda', short_name: 'VR - Varanda' },
    { entity: 'camera.cz_camera_2', name: 'CZ - Cozinha', short_name: 'CZ - Cozinha' },
    { entity: 'camera.as_camera_2', name: 'AS - Area Servico', short_name: 'AS - Area Servico' },
    { entity: 'camera.of_camera_2', name: 'OF - Office', short_name: 'OF - Office' },
    { entity: 'camera.camera_quarto_casal_2', name: 'QC - Quarto Casal', short_name: 'QC - Quarto Casal' },
    { entity: 'camera.qmi_camera_2', name: 'QMI - Quarto Miguel', short_name: 'QMI - Quarto Miguel' },
    { entity: 'camera.qma_camera_2', name: 'QMA - Quarto Marina', short_name: 'QMA - Quarto Marina' },
  ],
};

const BRUNO_CAMERAS_SECURITY_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];
const BRUNO_CAMERAS_SECURITY_UNAVAILABLE_STATES = ['unavailable', 'unknown', ''];

class BrunoCamerasSecuritySubview extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    this._refreshSeed = Date.now();
    this._lastCameraImages = {};
    this._lastClock = BrunoCamerasSecuritySubview._clock();
    this._boundClick = (event) => this._handleClick(event);
    this._boundKeydown = (event) => this._handleKeydown(event);
    this._boundClock = () => this._updateClock();
  }

  connectedCallback() {
    globalThis.BrunoLiquidGlass?.apply?.();
    this._startRefreshTimer();
    this._startClockTimer();
    this._render();
  }

  disconnectedCallback() {
    this._stopRefreshTimer();
    this._stopClockTimer();
  }

  setConfig(config) {
    this._config = this._normalizeConfig(config);
    this._render();
  }

  // --- ORIGINAL (rollback): re-render total a cada update de hass ---
  // set hass(hass) {
  //   this._hass = hass;
  //   this._render();
  //   this._startRefreshTimer();
  // }
  // --- FIM ORIGINAL ---
  // NOVO (anti-flicker): so reconstroi o shadow DOM quando algo ESTRUTURAL muda
  // (camera ativa, disponibilidade, online/status). O HA chama set hass com alta
  // frequencia; reconstruir os <img> a cada chamada fazia as cameras piscarem.
  // Updates triviais (ex.: token rotativo de entity_picture) NAO re-renderizam:
  // a imagem ao vivo e atualizada por _refreshCameraImages() (preload + swap, sem
  // piscar) e o relogio pelo clock timer.
  set hass(hass) {
    this._hass = hass;
    const signature = this._renderSignature();
    if (this.shadowRoot && this._renderedSignature === signature) {
      this._startRefreshTimer();
      return;
    }
    this._render();
    this._startRefreshTimer();
  }

  _renderSignature() {
    if (!this._hass || !this._config) return 'pending';
    return BrunoCamerasSecuritySubview._signatureFromModel(this._model());
  }

  static _signatureFromModel(model) {
    if (!model) return 'pending';
    const cams = (model.cameras || [])
      .map((c) => `${c.entity}:${c.online ? 1 : 0}:${c.unavailable ? 1 : 0}:${c.image ? 1 : 0}:${c.status}`)
      .join('|');
    return `${model.activeId}#${cams}`;
  }

  _normalizeConfig(config = {}) {
    return {
      ...BRUNO_CAMERAS_SECURITY_DEFAULT_CONFIG,
      ...config,
      refresh_interval: Number(config.refresh_interval) > 0
        ? Number(config.refresh_interval)
        : BRUNO_CAMERAS_SECURITY_DEFAULT_CONFIG.refresh_interval,
      cameras: Array.isArray(config.cameras) && config.cameras.length
        ? config.cameras
        : BRUNO_CAMERAS_SECURITY_DEFAULT_CONFIG.cameras,
    };
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _cameraState(camera) {
    const entityObj = this._state(camera.entity);
    const state = entityObj?.state || '';
    const unavailable = !entityObj || BRUNO_CAMERAS_SECURITY_UNAVAILABLE_STATES.includes(state);
    const online = !unavailable && BRUNO_CAMERAS_SECURITY_ONLINE_STATES.includes(state);
    const liveImage = entityObj?.attributes?.entity_picture || '';
    if (liveImage) this._lastCameraImages[camera.entity] = liveImage;
    const image = liveImage || this._lastCameraImages[camera.entity] || '';

    return {
      ...camera,
      entityObj,
      state,
      image,
      imageUrl: BrunoCamerasSecuritySubview._withCacheBust(image, this._refreshSeed),
      unavailable,
      online,
      status: BrunoCamerasSecuritySubview._statusLabel(state, unavailable),
    };
  }

  _model() {
    const config = this._config || BRUNO_CAMERAS_SECURITY_DEFAULT_CONFIG;
    const cameras = config.cameras.map((camera) => this._cameraState(camera));
    const configuredActive = this._state(config.active_entity)?.state;
    const fallback = cameras[0]?.entity || '';
    const activeId = this._localActiveCamera
      || (cameras.some((camera) => camera.entity === configuredActive) ? configuredActive : fallback);
    const activeCamera = cameras.find((camera) => camera.entity === activeId) || cameras[0];
    const thumbnails = cameras.filter((camera) => camera.entity !== activeCamera?.entity);

    return {
      activeCamera,
      activeId,
      sideCameras: thumbnails.slice(0, 3),
      bottomCameras: thumbnails.slice(3),
      cameras,
      onlineCount: cameras.filter((camera) => camera.online).length,
      totalCount: cameras.length,
    };
  }

  _selectCamera(entityId) {
    if (!entityId) return;
    const model = this._model();
    if (entityId === model.activeId) return;

    this._localActiveCamera = entityId;
    this._refreshSeed = Date.now();
    globalThis.BrunoLiquidGlass?.feedback?.('tap');
    this._render();

    const activeEntity = this._config?.active_entity;
    if (activeEntity && this._hass?.states?.[activeEntity]) {
      this._callService('input_select', 'select_option', {
        entity_id: activeEntity,
        option: entityId,
      });
    }
  }

  _openMoreInfo(entityId) {
    if (!entityId) return;
    globalThis.BrunoLiquidGlass?.feedback?.('tap');
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _navigateHome() {
    const path = this._config?.navigation_path;
    if (!path) return;
    const resolvedPath = this._resolveNavigationPath(path);
    globalThis.BrunoLiquidGlass?.routeTransition?.();
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

    const current = globalThis.location?.pathname || '/lovelace/0';
    const segments = current.split('/').filter(Boolean);
    const dashboard = segments.length ? segments[0] : 'lovelace';
    return `/${dashboard}/${path}`;
  }

  _callService(domain, service, data = {}) {
    if (!this._hass || !domain || !service) return;
    this._hass.callService(domain, service, data);
  }

  _startClockTimer() {
    if (this._clockTimer) return;
    this._clockTimer = globalThis.setInterval(this._boundClock, 1000);
  }

  _stopClockTimer() {
    if (!this._clockTimer) return;
    globalThis.clearInterval(this._clockTimer);
    this._clockTimer = null;
  }

  _updateClock() {
    const nextClock = BrunoCamerasSecuritySubview._clock();
    if (nextClock === this._lastClock) return;
    this._lastClock = nextClock;
    this.shadowRoot?.querySelector('[data-clock]')?.replaceChildren(document.createTextNode(nextClock));
    this.shadowRoot?.querySelector('[data-date]')?.replaceChildren(document.createTextNode(BrunoCamerasSecuritySubview._date()));
  }

  _startRefreshTimer() {
    if (this._refreshTimer || !this.isConnected) return;
    const interval = Math.max(4000, Number(this._config?.refresh_interval) || BRUNO_CAMERAS_SECURITY_DEFAULT_CONFIG.refresh_interval);
    this._refreshTimer = globalThis.setInterval(() => this._refreshCameraImages(), interval);
  }

  _stopRefreshTimer() {
    if (!this._refreshTimer) return;
    globalThis.clearInterval(this._refreshTimer);
    this._refreshTimer = null;
  }

  _refreshCameraImages() {
    if (!this.shadowRoot || !this._hass || !globalThis.Image) return;
    const stamp = Date.now();
    this._refreshSeed = stamp;

    this.shadowRoot.querySelectorAll('img[data-camera-src-base]').forEach((image) => {
      const baseSrc = image.dataset.cameraSrcBase;
      if (!baseSrc) return;

      const nextSrc = BrunoCamerasSecuritySubview._withCacheBust(baseSrc, stamp);
      const loader = new globalThis.Image();
      loader.onload = () => {
        image.src = nextSrc;
        image.dataset.hasLoaded = 'true';
        image.classList.remove('is-hidden');
      };
      loader.src = nextSrc;
    });
  }

  _handleClick(event) {
    const target = event.target?.closest?.('[data-action]');
    if (!target) return;
    const action = target.dataset.action;
    const entityId = target.dataset.cameraId;

    if (action === 'select-camera') {
      event.preventDefault();
      this._selectCamera(entityId);
      return;
    }

    if (action === 'more-info') {
      event.preventDefault();
      this._openMoreInfo(entityId || this._model().activeId);
      return;
    }

    if (action === 'refresh') {
      event.preventDefault();
      globalThis.BrunoLiquidGlass?.feedback?.('tap');
      this._refreshSeed = Date.now();
      this._render();
      return;
    }

    if (action === 'navigate-home') {
      event.preventDefault();
      this._navigateHome();
    }
  }

  _handleKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const target = event.target?.closest?.('[data-action]');
    if (!target) return;
    event.preventDefault();
    target.click();
  }

  _bindImages() {
    this.shadowRoot?.querySelectorAll('img[data-camera-src-base]').forEach((image) => {
      image.addEventListener('load', () => {
        image.dataset.hasLoaded = 'true';
        image.classList.remove('is-hidden');
      });
      image.addEventListener('error', () => {
        if (image.dataset.hasLoaded !== 'true') image.classList.add('is-hidden');
      });
    });
  }

  _render() {
    if (!this._config) this._config = this._normalizeConfig();
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    globalThis.BrunoLiquidGlass?.apply?.();

    try {
      const model = this._model();
      const active = model.activeCamera;
      this._lastClock = BrunoCamerasSecuritySubview._clock();

      this.shadowRoot.innerHTML = `
        <style>${this._styles()}</style>
        <main class="security-subview">
          <header class="security-topbar">
            <button class="icon-button" type="button" data-action="navigate-home" aria-label="Voltar para o painel principal">
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </button>

            <div class="brand">
              <span class="brand-main">Residência</span>
              <span class="brand-sep" aria-hidden="true">·</span>
              <strong class="brand-strong">Segurança</strong>
            </div>

            <div class="clock-block" aria-label="Horario atual">
              <span data-clock>${BrunoCamerasSecuritySubview._escape(this._lastClock)}</span>
              <small data-date>${BrunoCamerasSecuritySubview._escape(BrunoCamerasSecuritySubview._date())}</small>
            </div>
          </header>

          <section class="security-grid">
            <section class="main-feed">
              ${BrunoCamerasSecuritySubview._mainFeed(active, model)}
            </section>

            <aside class="side-rail" aria-label="Cameras principais">
              ${model.sideCameras.map((camera) => BrunoCamerasSecuritySubview._tile(camera, 'side')).join('')}
            </aside>

            <section class="bottom-strip" aria-label="Outras cameras">
              ${model.bottomCameras.map((camera) => BrunoCamerasSecuritySubview._tile(camera, 'bottom')).join('')}
            </section>
          </section>

          <footer class="security-footer">
            <span class="enc-note">
              <ha-icon icon="mdi:shield-lock-outline" aria-hidden="true"></ha-icon>
              Todas as câmeras estão protegidas com criptografia de ponta a ponta
            </span>
          </footer>
        </main>
      `;

      this.shadowRoot.removeEventListener('click', this._boundClick);
      this.shadowRoot.removeEventListener('keydown', this._boundKeydown);
      this.shadowRoot.addEventListener('click', this._boundClick);
      this.shadowRoot.addEventListener('keydown', this._boundKeydown);
      this._bindImages();
      // NOVO (anti-flicker): registra a assinatura estrutural ja renderizada,
      // para que set hass evite reconstruir o DOM quando nada estrutural muda.
      this._renderedSignature = BrunoCamerasSecuritySubview._signatureFromModel(model);
    } catch (error) {
      this._renderError(error);
    }
  }

  _renderError(error) {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    // eslint-disable-next-line no-console
    console.error('[bruno-cameras-security-subview]', error);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 520px;
        }
        .error-card {
          min-height: 520px;
          display: grid;
          place-items: center;
          padding: 24px;
          border-radius: 24px;
          color: rgba(255,255,255,0.92);
          background: linear-gradient(160deg, rgba(60,20,28,0.70), rgba(20,20,30,0.58));
          border: 1px solid rgba(255,120,145,0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 44px rgba(0,0,0,0.24);
        }
        .error-content {
          max-width: 520px;
        }
        .error-title {
          display: block;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 760;
        }
        .error-detail {
          display: block;
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.45;
          color: rgba(255,255,255,0.66);
          word-break: break-word;
        }
      </style>
      <div class="error-card">
        <span class="error-content">
          <span class="error-title">Bruno Cameras Security Subview</span>
          <span class="error-detail">${BrunoCamerasSecuritySubview._escape(error?.message || error || 'Render error')}</span>
        </span>
      </div>
    `;
  }

  _styles() {
    return `
      :host {
        /* ORIGINAL (rollback):
        --security-accent: 96, 165, 250;
        --security-live: 34, 197, 94;
        --security-warn: 251, 191, 36;
        */
        /* NOVO: acentos ligados aos tokens do bruno-liquid-glass.js (padrao das
           demais subviews). Mantem o formato "R, G, B" usado em rgba(var(...)). */
        --security-accent: var(--bruno-liquid-accent, 150, 190, 255);
        --security-live: var(--bruno-liquid-green-accent, 46, 231, 122);
        --security-warn: var(--bruno-liquid-warm-accent, 255, 183, 77);
        /* ORIGINAL (rollback): --security-panel: rgba(10, 15, 22, 0.68); (slate/azul) */
        --security-panel: rgba(7, 9, 12, 0.66);
        --security-border: rgba(255,255,255,0.14);
        display: block;
        width: 100%;
        /* ORIGINAL (rollback): height: 100% / min-height:100vh.
           O 1fr dependia da altura do container; em subview o container nao
           recebia altura de viewport e a linha colapsava (conteudo achatado no
           topo, rail sem espaco para centralizar). */
        /* NOVO (feedback): altura DEFINIDA de viewport (desconta o padding de
           12px da shell, topo+base = 24px). Isso forca a linha a crescer => a
           celula da rail fica cheia e a rail centraliza sozinha, e o miolo
           ocupa quase todo o painel. Uso vh (nao dvh) por compat. com o tablet. */
        height: calc(100vh - 24px);
        min-height: 0;
        /* transparente — a shell da view fornece o grafite da Home */
        background: transparent;
        color: rgba(246,250,255,0.94);
        font-family: var(--paper-font-body1_-_font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        contain: layout style;
      }

      * {
        box-sizing: border-box;
        letter-spacing: 0;
      }

      button {
        font: inherit;
        color: inherit;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
      }

      /* ORIGINAL (rollback): shell com topbar 44px + grade, fundo proprio (foto/veu).
         grid-template-rows: 44px minmax(0,1fr); padding: 8px; background: <foto+veu>. */
      .security-subview {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        /* NOVO (feedback): faixa superior na altura da barra de badges (64px),
           miolo que cresce (1fr) e faixa inferior na altura da barra de cenas/
           acoes da Home (74px). */
        grid-template-rows: 64px minmax(0, 1fr) 74px;
        gap: 10px;
        padding: 0;
        overflow: hidden;
        /* NOVO: transparente — a shell da view (cameras-security.yaml) fornece o
           grafite quente da Home atras do rail + console. */
        background: transparent;
      }

      /* ORIGINAL (rollback): topbar com skin glass (caixa/janela translucida). */
      /* NOVO (feedback): faixa superior 100% TRANSPARENTE — sem caixa, sem
         janela, sem blur. Apenas seta (esq.) + titulo centralizado + relogio
         (dir.), igual ao "topo sem conteudo" das demais subviews. */
      .security-topbar {
        min-width: 0;
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 0 6px;
        background: transparent;
        border: none;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      /* NOVO (feedback): botao de voltar "fantasma" — sem caixa, so o icone.
         Ganha um leve realce (azul = interacao) em hover/foco. */
      .icon-button {
        appearance: none;
        -webkit-appearance: none;
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        padding: 0;
        border-radius: 999px;
        border: none;
        background: transparent;
        box-shadow: none;
        color: rgba(226,232,240,0.82);
        transition: background 160ms ease, color 160ms ease;
      }

      .icon-button:hover,
      .icon-button:focus-visible {
        background: rgba(var(--security-accent),0.16);
        color: rgba(245,250,255,0.96);
        outline: none;
      }

      .icon-button ha-icon {
        --mdc-icon-size: 18px;
      }

      .brand {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: rgba(226,232,240,0.72);
        font-size: 14px;
        line-height: 1;
        letter-spacing: 0.04em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ORIGINAL (rollback): .brand strong / .divider (titulo TITLE | SECTION) */
      .brand-main {
        color: rgba(226,232,240,0.74);
        font-weight: 600;
      }

      .brand-strong {
        color: rgba(255,255,255,0.92);
        font-weight: 760;
      }

      .brand-sep {
        color: rgba(255,255,255,0.32);
        font-weight: 600;
      }

      .clock-block {
        min-width: 72px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        font-variant-numeric: tabular-nums;
        color: rgba(255,255,255,0.86);
        font-size: 12px;
        line-height: 1;
      }

      .clock-block small {
        color: rgba(226,232,240,0.58);
        font-size: 10px;
        line-height: 1;
      }

      /* --- ORIGINAL (rollback): side-rail e bottom-strip dimensionados por
         mecanismos diferentes (1fr esticado vs clamp), gerando tiles laterais
         quase quadrados e inferiores retangulares. ---
      .security-grid {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(188px, 22vw, 270px);
        grid-template-rows: minmax(0, 1fr) clamp(108px, 19vh, 158px);
        grid-template-areas:
          "main side"
          "strip strip";
        gap: 10px;
      }
      --- FIM ORIGINAL --- */
      /* NOVO: grade uniforme 4 colunas x 4 linhas. O feed principal ocupa o
         bloco 3x3 (main) e cada thumbnail (lateral ou inferior) ocupa exatamente
         1 coluna (1fr) x 1 linha (1fr) => TODOS os mini-tiles tem a MESMA
         dimensao. Os gaps internos das trilhas (10px) batem com o gap externo,
         garantindo a equalizacao. */
      .security-grid {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-template-rows: repeat(4, minmax(0, 1fr));
        grid-template-areas:
          "main main main side"
          "main main main side"
          "main main main side"
          "strip strip strip strip";
        gap: 10px;
      }

      .main-feed {
        grid-area: main;
        min-width: 0;
        min-height: 0;
      }

      .side-rail {
        grid-area: side;
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .bottom-strip {
        grid-area: strip;
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }

      /* ORIGINAL (rollback): skin bespoke com gradientes/borda/sombra fixos.
      .feed-card,
      .camera-tile {
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        border-radius: 18px;
        background:
          radial-gradient(180px 110px at 16% 8%, rgba(255,255,255,0.10), transparent 72%),
          linear-gradient(155deg, rgba(255,255,255,0.10), rgba(255,255,255,0.034)),
          var(--security-panel);
        border: 1px solid var(--security-border);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.13),
          inset 0 -1px 0 rgba(0,0,0,0.26),
          0 18px 38px rgba(0,0,0,0.26);
        backdrop-filter: var(--bruno-liquid-card-filter, blur(28px) saturate(1.52));
        -webkit-backdrop-filter: var(--bruno-liquid-card-filter, blur(28px) saturate(1.52));
      }

      .feed-card {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        border-radius: 22px;
      }
      --- FIM ORIGINAL --- */
      /* NOVO: superficie glass compartilhada (mesma assinatura .glass-card das
         demais subviews) lendo os tokens --bruno-liquid-surface-off-* e os raios
         de --bruno-liquid-cell-radius / --bruno-liquid-card-radius-compact. */
      .feed-card,
      .camera-tile {
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        border-radius: var(--bruno-liquid-cell-radius, 18px);
        background: var(--bruno-liquid-surface-off-background,
          radial-gradient(180px 110px at 16% 8%, rgba(255,255,255,0.10), transparent 72%),
          linear-gradient(155deg, rgba(255,255,255,0.10), rgba(255,255,255,0.034)),
          var(--security-panel));
        border: var(--bruno-liquid-surface-off-border, 1px solid var(--security-border));
        box-shadow: var(--bruno-liquid-surface-off-shadow,
          inset 0 1px 0 rgba(255,255,255,0.13),
          inset 0 -1px 0 rgba(0,0,0,0.26),
          0 18px 38px rgba(0,0,0,0.26));
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(28px) saturate(1.52));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(28px) saturate(1.52));
      }

      /* ORIGINAL (rollback): .feed-card em grid (imagem 1fr + rodape preto). */
      /* NOVO (redesign): hero ocupa tudo, cantos amplos da Home, sem rodape. */
      .feed-card {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: var(--bruno-liquid-card-radius, 24px);
      }

      .image-stage {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        /* ORIGINAL (rollback): linear-gradient(145deg, rgba(15,23,42,0.92), rgba(2,6,23,0.82)) (slate/azul) */
        background:
          radial-gradient(260px 160px at 22% 12%, rgba(255,255,255,0.07), transparent 72%),
          linear-gradient(145deg, rgba(12,13,16,0.92), rgba(4,6,9,0.82));
      }

      .camera-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: saturate(1.02) contrast(1.02);
      }

      .camera-image.is-hidden,
      .image-stage:not(.has-image) .camera-image {
        display: none;
      }

      .camera-placeholder {
        position: absolute;
        inset: 0;
        display: grid;
        place-items: center;
        color: rgba(226,232,240,0.24);
      }

      .camera-placeholder ha-icon {
        --mdc-icon-size: 58px;
        filter: drop-shadow(0 14px 22px rgba(0,0,0,0.38));
      }

      /* ORIGINAL (rollback): .feed-scrim/.tile-scrim (scrim preto pesado). */
      /* NOVO (redesign): vinheta MUITO discreta nas extremidades — preserva a
         leitura do video; sem aplicar tom por cima da imagem. */
      .feed-vignette,
      .tile-vignette {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(120% 120% at 50% 42%, transparent 60%, rgba(0,0,0,0.26) 100%),
          linear-gradient(0deg, rgba(0,0,0,0.34), rgba(0,0,0,0.05) 24%, transparent 44%);
      }

      /* ORIGINAL (rollback): .feed-title (pilula unica topo-esquerda). */
      /* NOVO (redesign): faixa de overlay no topo do hero (nome a esq., REC a dir.). */
      .feed-overlay-top {
        position: absolute;
        left: 16px;
        right: 16px;
        top: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        pointer-events: none;
      }

      .cam-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        max-width: calc(100% - 130px);
        padding: 7px 12px;
        border-radius: 999px;
        color: rgba(255,255,255,0.95);
        background: rgba(6,8,11,0.42);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 22px rgba(0,0,0,0.26);
        backdrop-filter: blur(14px) saturate(1.22);
        -webkit-backdrop-filter: blur(14px) saturate(1.22);
        font-size: 12.5px;
        line-height: 1;
        font-weight: 720;
      }

      .cam-pill-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rec-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 11px;
        border-radius: 999px;
        color: rgba(255,236,236,0.96);
        background: rgba(220,38,38,0.22);
        border: 1px solid rgba(248,113,113,0.46);
        box-shadow: 0 0 16px rgba(239,68,68,0.26);
        font-size: 11px;
        line-height: 1;
        font-weight: 760;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .rec-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: rgb(239,68,68);
        box-shadow: 0 0 10px rgba(239,68,68,0.8);
        animation: rec-blink 1.4s ease-in-out infinite;
      }

      @keyframes rec-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }

      .status-dot {
        flex: 0 0 auto;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: rgba(148,163,184,0.85);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.12);
      }

      .status-dot.is-online {
        background: rgb(var(--security-live));
        box-shadow: 0 0 12px rgba(var(--security-live),0.62);
      }

      /* NOVO (disciplina de cor): vermelho SO em gravacao/alerta real. */
      .status-dot.is-recording {
        background: rgb(239,68,68);
        box-shadow: 0 0 12px rgba(239,68,68,0.7);
      }

      /* ORIGINAL (rollback): .feed-actions/.action-pill fixos sempre visiveis. */
      /* NOVO (redesign): controles flutuantes minimizados no canto do hero,
         faintes por padrao (acessiveis ao toque) e plenos em hover/foco. */
      .feed-controls {
        position: absolute;
        right: 14px;
        bottom: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0.4;
        transition: opacity 180ms ease;
      }

      .feed-card:hover .feed-controls,
      .feed-card:focus-within .feed-controls {
        opacity: 1;
      }

      .hc-btn {
        appearance: none;
        -webkit-appearance: none;
        width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: 999px;
        color: rgba(255,255,255,0.92);
        background: rgba(6,8,11,0.5);
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 20px rgba(0,0,0,0.28);
        backdrop-filter: blur(14px) saturate(1.22);
        -webkit-backdrop-filter: blur(14px) saturate(1.22);
      }

      .hc-btn span {
        display: none;
      }

      .hc-btn:hover,
      .hc-btn:focus-visible {
        border-color: rgba(var(--security-accent),0.5);
        background: rgba(var(--security-accent),0.2);
        outline: none;
      }

      .hc-btn ha-icon {
        --mdc-icon-size: 16px;
      }

      /* ORIGINAL (rollback): .feed-footer / .active-name / .active-sub /
         .system-summary (rodape preto grande do hero). Substituidos por
         .feed-status (contagem online discreta sobreposta ao video). */
      .feed-status {
        position: absolute;
        left: 16px;
        bottom: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 11px;
        border-radius: 999px;
        color: rgba(220,252,231,0.92);
        background: rgba(6,8,11,0.4);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        backdrop-filter: blur(12px) saturate(1.2);
        -webkit-backdrop-filter: blur(12px) saturate(1.2);
        font-size: 11px;
        line-height: 1;
        font-weight: 720;
        font-variant-numeric: tabular-nums;
      }

      .camera-tile {
        appearance: none;
        -webkit-appearance: none;
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        outline: none;
        text-align: left;
        transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, filter 160ms ease;
      }

      .camera-tile:hover,
      .camera-tile:focus-visible {
        border-color: rgba(var(--security-accent),0.48);
        filter: brightness(1.06);
        outline: none;
      }

      .camera-tile:active {
        transform: translateY(1px) scale(0.992);
      }

      /* ORIGINAL (rollback): .tile-label (barra inferior larga, centralizada). */
      /* NOVO (redesign): pilula compacta integrada, ancorada a esquerda. */
      .tile-pill {
        position: absolute;
        left: 7px;
        bottom: 7px;
        max-width: calc(100% - 14px);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        padding: 4px 9px;
        border-radius: 999px;
        color: rgba(255,255,255,0.92);
        background: rgba(6,8,11,0.42);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        backdrop-filter: blur(12px) saturate(1.2);
        -webkit-backdrop-filter: blur(12px) saturate(1.2);
      }

      .tile-rec {
        flex: 0 0 auto;
        padding: 1px 5px;
        border-radius: 999px;
        font-size: 8.5px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: rgba(255,236,236,0.96);
        background: rgba(220,38,38,0.30);
        border: 1px solid rgba(248,113,113,0.5);
      }

      .tile-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
        line-height: 1;
        font-weight: 720;
        text-shadow: 0 2px 8px rgba(0,0,0,0.58);
      }

      .side .tile-name {
        font-size: 10px;
      }

      /* NOVO (redesign): rodape transparente na altura do footer da Home, com
         frase translucida centralizada + cadeado (preenche o espaco, sem peso). */
      .security-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 12px;
      }

      .enc-note {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: rgba(226,232,240,0.46);
        font-size: 12px;
        line-height: 1;
        font-weight: 560;
        letter-spacing: 0.02em;
        text-align: center;
      }

      .enc-note ha-icon {
        --mdc-icon-size: 16px;
        color: rgba(226,232,240,0.5);
        flex: 0 0 auto;
      }

      @media (max-width: 980px) {
        .security-subview {
          height: auto;
          min-height: 100vh;
          overflow: visible;
        }

        .security-grid {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(340px, 55vh) auto auto;
          grid-template-areas:
            "main"
            "side"
            "strip";
        }

        .side-rail,
        .bottom-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(118px, 1fr));
        }

        .side-rail {
          display: grid;
        }

        .bottom-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        :host {
          min-height: 100vh;
        }

        .security-subview {
          padding: 0;
          gap: 8px;
          grid-template-rows: clamp(46px, 8vh, 54px) minmax(0, 1fr) clamp(34px, 5vh, 44px);
        }

        .security-topbar {
          grid-template-columns: 36px minmax(0, 1fr) auto;
          gap: 8px;
          padding: 0 6px;
          border-radius: 17px;
        }

        .brand {
          justify-content: center;
          font-size: 12px;
          gap: 7px;
        }

        /* ORIGINAL (rollback): .brand span:first-child { display: none; }
           — escondia a primeira palavra; agora "Residência · Segurança" e curto. */
        .brand-sep {
          margin: 0 -1px;
        }

        .clock-block {
          min-width: 58px;
          font-size: 11px;
        }

        .clock-block small {
          font-size: 9px;
        }

        .security-grid {
          gap: 8px;
          grid-template-rows: minmax(310px, 48vh) auto auto;
        }

        .side-rail,
        .bottom-strip {
          gap: 8px;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: none;
        }

        .camera-tile {
          min-height: 132px;
        }

        .feed-actions {
          right: 10px;
          bottom: 10px;
        }

        .action-pill span {
          display: none;
        }

        .feed-footer {
          grid-template-columns: minmax(0, 1fr);
          min-height: 64px;
        }

        .system-summary {
          width: max-content;
        }
      }

      @media (max-height: 720px) and (min-width: 981px) {
        .security-subview {
          min-height: 560px;
        }

        /* ORIGINAL (rollback): grid-template-rows: minmax(0, 1fr) clamp(94px, 18vh, 130px); */
        /* NOVO: mantem a grade uniforme 4x4 tambem em telas baixas. */
        .security-grid {
          grid-template-rows: repeat(4, minmax(0, 1fr));
        }

        .feed-footer {
          min-height: 58px;
          padding: 10px 14px;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .camera-tile,
        .action-pill {
          transition: none !important;
        }
      }
    `;
  }

  // NOVO (redesign Opcao A): hero de seguranca — sem rodape preto. Nome/status
  // sobrepostos ao video (topo), pilula de gravacao (vermelha) so quando
  // gravando, contagem "N/N online" discreta no rodape do video e controles
  // flutuantes (Detalhes/Atualizar) que aparecem em hover/foco.
  // ORIGINAL (rollback) preservado em _mainFeedLegacy() abaixo.
  static _mainFeed(camera, model) {
    const hasImage = Boolean(camera?.image);
    const onlineClass = camera?.online ? ' is-online' : '';
    const recording = camera?.state === 'recording';
    return `
      <article class="feed-card">
        <div class="image-stage${hasImage ? ' has-image' : ''}">
          ${hasImage ? BrunoCamerasSecuritySubview._image(camera, 'camera-image') : ''}
          <div class="camera-placeholder" aria-hidden="true"><ha-icon icon="mdi:cctv"></ha-icon></div>
          <div class="feed-vignette" aria-hidden="true"></div>
          <div class="feed-overlay-top">
            <span class="cam-pill">
              <span class="status-dot${onlineClass}"></span>
              <span class="cam-pill-name">${BrunoCamerasSecuritySubview._escape(camera?.name || 'Camera')}</span>
            </span>
            ${recording ? '<span class="rec-pill"><span class="rec-dot"></span>Gravando</span>' : ''}
          </div>
          <div class="feed-controls">
            <button class="hc-btn" type="button" data-action="more-info" data-camera-id="${BrunoCamerasSecuritySubview._escapeAttr(camera?.entity || '')}" aria-label="Abrir detalhes da camera">
              <ha-icon icon="mdi:magnify-plus-outline"></ha-icon>
              <span>Detalhes</span>
            </button>
            <button class="hc-btn" type="button" data-action="refresh" aria-label="Atualizar cameras">
              <ha-icon icon="mdi:refresh"></ha-icon>
              <span>Atualizar</span>
            </button>
          </div>
          <div class="feed-status">
            <span class="status-dot${model.onlineCount ? ' is-online' : ''}"></span>
            <span>${model.onlineCount}/${model.totalCount} online</span>
          </div>
        </div>
      </article>
    `;
  }

  /* ORIGINAL (rollback): hero com rodape preto grande.
  static _mainFeedLegacy(camera, model) {
    const hasImage = Boolean(camera?.image);
    const onlineClass = camera?.online ? ' is-online' : '';
    return `
      <article class="feed-card">
        <div class="image-stage${hasImage ? ' has-image' : ''}">
          ${hasImage ? BrunoCamerasSecuritySubview._image(camera, 'camera-image') : ''}
          <div class="camera-placeholder" aria-hidden="true"><ha-icon icon="mdi:cctv"></ha-icon></div>
          <div class="feed-scrim"></div>
          <div class="feed-title">...</div>
          <div class="feed-actions">...Detalhes/Atualizar...</div>
        </div>
        <footer class="feed-footer">...active-name / active-sub / system-summary...</footer>
      </article>
    `;
  }
  */

  // NOVO (redesign Opcao A): secundaria sem barra pesada — apenas uma pilula
  // inferior compacta integrada (ponto de status + nome + "REC" se gravando).
  static _tile(camera, position) {
    const hasImage = Boolean(camera?.image);
    const onlineClass = camera?.online ? ' is-online' : '';
    const recording = camera?.state === 'recording';
    return `
      <button class="camera-tile ${BrunoCamerasSecuritySubview._escapeAttr(position)}" type="button" data-action="select-camera" data-camera-id="${BrunoCamerasSecuritySubview._escapeAttr(camera.entity)}" aria-label="${BrunoCamerasSecuritySubview._escapeAttr(camera.name)}">
        <span class="image-stage${hasImage ? ' has-image' : ''}">
          ${hasImage ? BrunoCamerasSecuritySubview._image(camera, 'camera-image') : ''}
          <span class="camera-placeholder" aria-hidden="true"><ha-icon icon="mdi:video-outline"></ha-icon></span>
          <span class="tile-vignette" aria-hidden="true"></span>
          <span class="tile-pill">
            <span class="status-dot${onlineClass}${recording ? ' is-recording' : ''}"></span>
            <span class="tile-name">${BrunoCamerasSecuritySubview._escape(camera.short_name || camera.name)}</span>
            ${recording ? '<span class="tile-rec">REC</span>' : ''}
          </span>
        </span>
      </button>
    `;
  }

  static _image(camera, className) {
    return `<img class="${className}" src="${BrunoCamerasSecuritySubview._escapeAttr(camera.imageUrl || camera.image)}" data-camera-src-base="${BrunoCamerasSecuritySubview._escapeAttr(camera.image)}" data-camera-entity="${BrunoCamerasSecuritySubview._escapeAttr(camera.entity)}" alt="">`;
  }

  static _statusLabel(state, unavailable) {
    if (unavailable) return 'Indisponivel';
    if (state === 'streaming') return 'Ao vivo';
    if (state === 'recording') return 'Gravando';
    if (state === 'idle' || state === 'on') return 'Online';
    if (state === 'off' || state === 'standby') return 'Em espera';
    return state || 'Online';
  }

  static _withCacheBust(url, stamp) {
    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}bruno_refresh=${encodeURIComponent(stamp || Date.now())}`;
  }

  static _clock() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
  }

  static _date() {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}/${String(now.getMonth() + 1).padStart(2, '0')}/${now.getFullYear()}`;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoCamerasSecuritySubview._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_CAMERAS_SECURITY_SUBVIEW_TAG)) {
  customElements.define(BRUNO_CAMERAS_SECURITY_SUBVIEW_TAG, BrunoCamerasSecuritySubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_CAMERAS_SECURITY_SUBVIEW_TAG,
  name: 'Bruno Cameras Security Subview',
  description: 'Full-screen Bruno UI security camera console.',
});
