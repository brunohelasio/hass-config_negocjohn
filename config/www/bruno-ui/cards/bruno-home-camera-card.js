const BRUNO_HOME_CAMERA_CARD_TAG = 'bruno-home-camera-card';

const BRUNO_HOME_CAMERA_DEFAULT_CONFIG = {
  name: 'Monitoramento',
  active_entity: 'input_select.bento_active_camera',
  refresh_interval: 6500,
  // ANTERIOR (rollback ONVIF geral): cameras usavam os oito IDs Tuya *_2.
  // O inventario completo permanece no rollback desta rodada.
  cameras: [
    { entity: 'camera.sl_camera_profile_1', name: 'Sala', short_name: 'Sala' },
    { entity: 'camera.vr_camera_profile_1', name: 'Varanda', short_name: 'Varanda' },
    { entity: 'camera.cz_camera_profile_1', name: 'Cozinha', short_name: 'Cozinha' },
    { entity: 'camera.as_camera_profile_1', name: 'Area de Servico', short_name: 'Area' },
    { entity: 'camera.of_camera_profile_1', name: 'Office', short_name: 'Office' },
    { entity: 'camera.qc_camera_profile_1', name: 'Quarto Casal', short_name: 'Q. Casal' },
    { entity: 'camera.qmi_camera_profile_1', name: 'Quarto Miguel', short_name: 'Q. Miguel' },
    { entity: 'camera.qma_camera_profile_1', name: 'Quarto Marina', short_name: 'Q. Marina' },
  ],
};

const BRUNO_HOME_CAMERA_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];
const BRUNO_HOME_CAMERA_UNAVAILABLE_STATES = ['unavailable', 'unknown', ''];
// ANTERIOR (rollback expansao ONVIF): 10000. O more-info prova que a negociacao
// pode atravessar uma pausa maior antes de estabilizar em tempo real.
const BRUNO_HOME_CAMERA_LIVE_TIMEOUT_MS = 30000;

class BrunoHomeCameraCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      ...BRUNO_HOME_CAMERA_DEFAULT_CONFIG,
      ...(config || {}),
      cameras: Array.isArray(config?.cameras) && config.cameras.length
        ? config.cameras
        : BRUNO_HOME_CAMERA_DEFAULT_CONFIG.cameras,
      refresh_interval: Number(config?.refresh_interval) > 0
        ? Number(config.refresh_interval)
        : BRUNO_HOME_CAMERA_DEFAULT_CONFIG.refresh_interval,
    };
    this._refreshSeed = this._refreshSeed || Date.now();
    this._lastCameraImages = this._lastCameraImages || {};
    this._cameraBaseUrls = this._cameraBaseUrls || {};
    this._loadedCameraUrls = this._loadedCameraUrls || {};
    this._cameraLoads = this._cameraLoads || {};
    // ANTERIOR (rollback 2026-08-10): _liveSuspendedEntities mantinha a camera
    // suspensa ate o card ser desconectado. O estado agora distingue lazy-load,
    // negociacao, handoff ao More Info, retomada e fallback.
    this._liveState = this._liveState || 'idle';
    this._liveBlockedEntity = this._liveBlockedEntity || '';
    this._liveLoadToken = this._liveLoadToken || 0;
    this._boundDialogClosed = this._boundDialogClosed || ((event) => this._handleDialogClosed(event));
    this._menuOpen = false;
    this._render();
    this._startRefreshTimer();
  }

  set hass(hass) {
    this._hass = hass;
    const activeState = this._state(this._config?.active_entity)?.state;
    if (this._localActiveCamera && activeState === this._localActiveCamera) {
      this._localActiveCamera = '';
    }
    const model = this._model();
    const renderSignature = this._renderSignature(model);
    if (!this.shadowRoot || this._lastRenderSignature !== renderSignature) {
      this._render();
    } else {
      this._syncDynamic(model);
    }
    this._startRefreshTimer();
  }

  connectedCallback() {
    this._liveState = 'idle';
    this._liveBlockedEntity = '';
    if (!this._listeningDialogClosed) {
      globalThis.addEventListener?.('dialog-closed', this._boundDialogClosed, true);
      this._listeningDialogClosed = true;
    }
    this._startRefreshTimer();
    this._mountLiveFeed(this._model().activeCamera);
  }

  disconnectedCallback() {
    this._liveLoadToken++;
    this._stopRefreshTimer();
    this._stopLiveFeed();
    if (this._listeningDialogClosed) {
      globalThis.removeEventListener?.('dialog-closed', this._boundDialogClosed, true);
      this._listeningDialogClosed = false;
    }
    if (this._liveResumeTimer) globalThis.clearTimeout(this._liveResumeTimer);
    this._liveResumeTimer = null;
  }

  getCardSize() {
    return 3;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isUnavailable(entity) {
    return !entity || BRUNO_HOME_CAMERA_UNAVAILABLE_STATES.includes(String(entity.state || '').toLowerCase());
  }

  _cameraState(camera) {
    const entity = this._state(camera.entity);
    const state = String(entity?.state || '').toLowerCase();
    const unavailable = this._isUnavailable(entity);
    const online = !unavailable && BRUNO_HOME_CAMERA_ONLINE_STATES.includes(state);
    const liveImage = entity?.attributes?.entity_picture || '';
    if (liveImage) this._lastCameraImages[camera.entity] = liveImage;

    const image = liveImage || this._lastCameraImages[camera.entity] || `/api/camera_proxy/${camera.entity}`;
    if (this._cameraBaseUrls[camera.entity] !== image) {
      this._cameraBaseUrls[camera.entity] = image;
      delete this._loadedCameraUrls[camera.entity];
    }

    return {
      ...camera,
      entityObj: entity,
      state,
      unavailable,
      online,
      image,
      imageUrl: this._loadedCameraUrls[camera.entity] || BrunoHomeCameraCard._withCacheBust(image, this._refreshSeed || Date.now()),
      status: online ? 'Ao vivo' : (unavailable ? 'Indisponivel' : 'Online'),
    };
  }

  _model() {
    const cameras = (this._config.cameras || []).map((camera) => this._cameraState(camera));
    const configuredActive = this._state(this._config.active_entity)?.state;
    const fallback = cameras[0]?.entity || '';
    const activeId = this._localActiveCamera
      || (cameras.some((camera) => camera.entity === configuredActive) ? configuredActive : fallback);
    const activeCamera = cameras.find((camera) => camera.entity === activeId) || cameras[0];
    const onlineCount = cameras.filter((camera) => camera.online).length;
    return {
      cameras,
      activeCamera,
      activeId,
      onlineCount,
      totalCount: cameras.length,
    };
  }

  _renderSignature(model) {
    const availability = (model?.cameras || [])
      .map((camera) => `${camera.unavailable ? 'u' : 'a'}${camera.online ? '1' : '0'}`)
      .join('');
    return `${model?.activeId || ''}|${availability}`;
  }

  _selectCamera(entityId) {
    if (!entityId) return;
    this._liveLoadToken++;
    this._liveState = 'idle';
    this._liveBlockedEntity = '';
    this._localActiveCamera = entityId;
    this._menuOpen = false;
    this._refreshSeed = Date.now();
    this._render();
    if (this._config.active_entity) {
      this._hass?.callService('input_select', 'select_option', {
        entity_id: this._config.active_entity,
        option: entityId,
      });
    }
  }

  _openMoreInfo(entityId) {
    if (!entityId) return;
    // ANTERIOR (rollback 2026-08-10): a entidade entrava num Set permanente e
    // so voltava ao vivo ao desmontar o card. Agora o evento dialog-closed
    // reabre uma unica sessao depois que o More Info libera a anterior.
    this._liveLoadToken++;
    this._liveState = 'handed-off';
    globalThis.BrunoCameraLive?.marcar?.(entityId, 'entregue ao more-info');
    this._stopLiveFeed();
    this._refreshCameraImages();
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _handleDialogClosed(event) {
    if (event?.detail?.dialog !== 'ha-more-info-dialog' || this._liveState !== 'handed-off') return;
    const entityId = this._model()?.activeCamera?.entity || '';
    this._liveState = 'resuming';
    globalThis.BrunoCameraLive?.marcar?.(entityId, 'more-info fechado; retomando');
    if (this._liveResumeTimer) globalThis.clearTimeout(this._liveResumeTimer);
    this._liveResumeTimer = globalThis.setTimeout(() => {
      this._liveResumeTimer = null;
      if (!this.isConnected || this._liveState !== 'resuming') return;
      this._liveState = 'idle';
      this._liveBlockedEntity = '';
      this._mountLiveFeed(this._model().activeCamera);
    }, 700);
  }

  /**
   * Monta o player WebRTC final do HA sem passar pelo seletor hui-image.
   * A ordem e deliberada: conecta ao DOM, espera o primeiro update Lit consumir
   * os contextos do HA e so depois atribui entityid.
   */
  _mountLiveFeed(camera) {
    const entityId = camera?.entity || '';
    const mount = entityId
      ? this.shadowRoot?.querySelector(`[data-camera-live="${entityId}"]`)
      : null;
    if (this._liveState === 'fallback' && this._liveBlockedEntity !== entityId) {
      this._liveState = 'idle';
      this._liveBlockedEntity = '';
    }
    if (
      !this.isConnected || !mount || camera?.unavailable ||
      ['loading-player', 'handed-off', 'resuming', 'fallback'].includes(this._liveState)
    ) {
      this._stopLiveFeed();
      return;
    }

    if (!this._liveEl || this._liveEntity !== entityId) {
      this._stopLiveFeed();
      if (!globalThis.customElements?.get('ha-web-rtc-player')) {
        this._liveState = 'loading-player';
        const token = ++this._liveLoadToken;
        const garantir = globalThis.BrunoCameraLive?.garantirPlayer;
        if (typeof garantir !== 'function') {
          this._liveState = 'fallback';
          this._liveBlockedEntity = entityId;
          return;
        }
        Promise.resolve(garantir(entityId, this._hass)).then((ok) => {
          if (!this.isConnected || token !== this._liveLoadToken) return;
          this._liveState = ok ? 'idle' : 'fallback';
          this._liveBlockedEntity = ok ? '' : entityId;
          this._mountLiveFeed(this._model().activeCamera);
        });
        return;
      }
      const el = globalThis.BrunoCameraLive?.criarPlayer?.()
        || document.createElement('ha-web-rtc-player');
      this._liveState = 'negotiating';
      el.classList.add('camera-live-el');
      el.setAttribute('muted', '');
      el.setAttribute('playsinline', '');
      el.setAttribute('autoplay', '');
      try { el.fitMode = 'cover'; } catch (error) { /* CSS cobre versoes sem fitMode. */ }
      this._liveLoadHandler = () => this._markLiveReady();
      this._liveStreamsHandler = (event) => {
        if (event?.detail?.hasVideo === false) this._failLiveFeed(entityId, 'sem video');
      };
      el.addEventListener('load', this._liveLoadHandler);
      el.addEventListener('streams', this._liveStreamsHandler);
      this._liveEl = el;
      this._liveEntity = entityId;
      mount.appendChild(el);
      // ANTERIOR (rollback contexto Lit): atribuicao imediata de entityid e
      // armacao do prazo de 30 s neste ponto.
      this._startLivePlayerAfterContext(el, entityId);
      return;
    }

    if (this._liveEl.parentElement !== mount) mount.appendChild(this._liveEl);
    if (this._liveEl.entityid !== entityId) this._liveEl.entityid = entityId;
  }

  _startLivePlayerAfterContext(el, entityId) {
    Promise.resolve(el.updateComplete).then(() => {
      if (this._liveEl !== el || this._liveEntity !== entityId || !el.isConnected) return;
      this._liveStartedAt = globalThis.performance?.now?.() || Date.now();
      el.entityid = entityId;
      globalThis.BrunoCameraLive?.marcar?.(entityId, 'entityid atribuido');
      this._liveTimer = globalThis.setTimeout(() => {
        if (this._liveEl === el && this._liveEntity === entityId && this._liveReady !== entityId) {
          this._failLiveFeed(entityId, 'prazo');
        }
      }, BRUNO_HOME_CAMERA_LIVE_TIMEOUT_MS);
    }).catch(() => {
      if (this._liveEl === el && this._liveEntity === entityId) this._failLiveFeed(entityId, 'contexto');
    });
  }

  _markLiveReady() {
    const el = this._liveEl;
    const entityId = this._liveEntity;
    const video = el?.shadowRoot?.querySelector('video');
    if (!el || !entityId || !video || video.readyState < 2 || this._liveReady === entityId) return;
    if (globalThis.BrunoCameraLive?.pareceQuadroVerde?.(video)) {
      if (this._liveGreenMarked !== entityId) {
        this._liveGreenMarked = entityId;
        const now = globalThis.performance?.now?.() || Date.now();
        globalThis.BrunoCameraLive?.marcar?.(
          entityId,
          'quadro verde rejeitado',
          now - (this._liveStartedAt || now),
          false,
        );
      }
      if (this._liveGreenTimer) globalThis.clearTimeout(this._liveGreenTimer);
      this._liveGreenTimer = globalThis.setTimeout(() => {
        this._liveGreenTimer = null;
        this._markLiveReady();
      }, 700);
      return;
    }
    this._liveReady = entityId;
    this._liveState = 'live';
    if (this._liveGreenTimer) globalThis.clearTimeout(this._liveGreenTimer);
    this._liveGreenTimer = null;
    el.classList.add('is-ready');
    if (this._liveTimer) globalThis.clearTimeout(this._liveTimer);
    this._liveTimer = null;
  }

  _failLiveFeed(entityId, reason = 'falha') {
    if (!entityId || entityId !== this._liveEntity) return;
    const now = globalThis.performance?.now?.() || Date.now();
    globalThis.BrunoCameraLive?.marcar?.(
      entityId,
      reason,
      now - (this._liveStartedAt || now),
      false,
    );
    this._liveState = 'fallback';
    this._liveBlockedEntity = entityId;
    this._stopLiveFeed();
    this._refreshCameraImages();
  }

  _stopLiveFeed() {
    if (this._liveTimer) globalThis.clearTimeout(this._liveTimer);
    this._liveTimer = null;
    if (this._liveGreenTimer) globalThis.clearTimeout(this._liveGreenTimer);
    this._liveGreenTimer = null;
    const el = this._liveEl;
    if (el) {
      if (this._liveLoadHandler) el.removeEventListener('load', this._liveLoadHandler);
      if (this._liveStreamsHandler) el.removeEventListener('streams', this._liveStreamsHandler);
      el.remove();
    }
    this._liveEl = null;
    this._liveEntity = '';
    this._liveReady = '';
    this._liveGreenMarked = '';
    this._liveLoadHandler = null;
    this._liveStreamsHandler = null;
  }

  _startRefreshTimer() {
    if (this._refreshTimer || !this._config || !this.isConnected) return;
    const interval = Math.max(4000, Number(this._config.refresh_interval) || 6500);
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
      const entityId = image.dataset.cameraEntity;
      if (!baseSrc || !entityId) return;
      // A foto so cede depois do primeiro quadro real. Enquanto o WebRTC negocia,
      // o motor continua atualizando a rede de seguranca por baixo.
      if (this._liveReady === entityId) return;
      if (this._cameraLoads[entityId]) return;
      const nextSrc = BrunoHomeCameraCard._withCacheBust(baseSrc, stamp);
      const loader = new globalThis.Image();
      this._cameraLoads[entityId] = loader;
      loader.onload = () => {
        delete this._cameraLoads[entityId];
        if (globalThis.BrunoCameraLive?.pareceQuadroVerde?.(loader)) {
          globalThis.BrunoCameraLive?.marcar?.(entityId, 'snapshot verde rejeitado', 0, false);
          return;
        }
        this._loadedCameraUrls[entityId] = nextSrc;
        if (!image.isConnected || image.dataset.cameraEntity !== entityId) return;
        image.src = nextSrc;
        image.dataset.hasLoaded = 'true';
        image.classList.remove('is-hidden');
      };
      loader.onerror = () => {
        delete this._cameraLoads[entityId];
      };
      loader.src = nextSrc;
    });
  }

  _syncDynamic(model = this._model()) {
    if (!this.shadowRoot || !model?.activeCamera) return;
    const online = this.shadowRoot.querySelector('.online-chip');
    if (online) {
      online.classList.toggle('is-online', model.onlineCount > 0);
      const text = online.querySelector('.online-count');
      if (text) text.textContent = `${model.onlineCount}/${model.totalCount || 0} online`;
    }
    const status = this.shadowRoot.querySelector('.camera-row-copy span');
    if (status) {
      status.lastChild.textContent = model.activeCamera.status || 'Online';
      status.querySelector('.live-dot')?.classList.toggle('is-muted', !model.activeCamera.online);
    }
    const image = this.shadowRoot.querySelector('img[data-camera-entity]');
    if (image && model.activeCamera.image && image.dataset.cameraSrcBase !== model.activeCamera.image) {
      image.dataset.cameraSrcBase = model.activeCamera.image;
      this._refreshCameraImages();
    }
    this._mountLiveFeed(model.activeCamera);
  }

  _wireActions(activeId) {
    const root = this.shadowRoot;
    root.querySelector('.camera-main')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._openMoreInfo(activeId);
    });
    root.querySelector('[data-action="camera-menu"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._menuOpen = !this._menuOpen;
      this._render();
    });
    root.querySelectorAll('[data-camera-id]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._selectCamera(button.dataset.cameraId);
      });
    });
    root.querySelectorAll('img[data-camera-src-base]').forEach((image) => {
      image.addEventListener('load', () => {
        image.dataset.hasLoaded = 'true';
        image.classList.remove('is-hidden');
      });
      image.addEventListener('error', () => {
        if (image.dataset.hasLoaded !== 'true') image.classList.add('is-hidden');
      });
    });
  }

  _cameraFrame(camera) {
    if (!camera) {
      return `
        <div class="camera-row-image">
          <div class="camera-placeholder" aria-hidden="true"></div>
        </div>
      `;
    }
    const image = camera?.imageUrl || '';
    const base = camera?.image || '';
    return `
      <div class="camera-row-image">
        <div class="camera-live-slot" data-camera-live="${BrunoHomeCameraCard._escapeAttr(camera.entity)}" aria-hidden="true"></div>
        ${image ? `<img src="${BrunoHomeCameraCard._escapeAttr(image)}" data-camera-src-base="${BrunoHomeCameraCard._escapeAttr(base)}" data-camera-entity="${BrunoHomeCameraCard._escapeAttr(camera.entity)}" alt="" draggable="false" style="-webkit-touch-callout:none;-webkit-user-drag:none;-webkit-user-select:none;user-select:none">` : ''}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
    `;
  }

  _renderCameraFeed(camera) {
    const cameraName = camera?.short_name || camera?.name || 'Camera';
    const unavailable = !camera || camera.unavailable;
    const onlineClass = camera?.online ? '' : ' is-muted';
    const cameraStatus = camera?.status || 'Online';
    const classes = [
      'camera-main',
      'camera-feed',
      unavailable ? 'is-unavailable' : '',
    ].filter(Boolean).join(' ');

    return `
      <button class="${classes}" type="button" aria-label="Abrir camera ${BrunoHomeCameraCard._escapeAttr(cameraName)}">
        ${unavailable ? `
          <div class="camera-state-surface">
            <bruno-icon icon="mdi:video-off-outline"></bruno-icon>
            <span>Imagem indisponivel</span>
          </div>
        ` : ''}
        ${this._cameraFrame(camera)}
        <div class="camera-row-copy">
          <strong>${BrunoHomeCameraCard._escape(cameraName)}</strong>
          <span><i class="live-dot${onlineClass}" aria-hidden="true"></i>${BrunoHomeCameraCard._escape(cameraStatus)}</span>
        </div>

      </button>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    this._lastRenderedActiveId = model.activeId;
    this._lastRenderSignature = this._renderSignature(model);
    const camera = model.activeCamera || {};
    const onlineText = `${model.onlineCount}/${model.totalCount || 0} online`;
    const onlineClass = model.onlineCount > 0 ? ' is-online' : '';
    const menu = this._menuOpen ? `
      <div class="mh-overflow-panel" role="menu" aria-label="Selecionar camera">
        ${model.cameras.map((item) => BrunoHomeCameraCard._menuOption(item, item.entity === model.activeId)).join('')}
      </div>
    ` : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 18px);
          /* ANTERIOR: --accent: var(--bruno-liquid-warm-accent, 242,194,102); (ambar — cameras deve ser azul, padronizacao) */
          --accent: 180, 215, 255;
          --accent-live: var(--bruno-liquid-green-accent, 46,231,122);
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        button {
          appearance: none;
          -webkit-appearance: none;
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .glass-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: 44px minmax(0, 1fr);
          gap: 0;
          padding: 0;
          color: rgba(255,255,255,0.92);
          overflow: hidden;
          border-radius: var(--card-radius);
          background: var(--bruno-liquid-surface-off-background,
            linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)),
            rgba(9,11,15,0.105)
          );
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
          box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145));
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
        }

        .glass-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 42%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10);
        }

        .mh-head,
        .camera-stage,
        .mh-overflow-panel {
          position: relative;
          z-index: 1;
        }

        .mh-head {
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 10px 0 14px;
        }

        .mh-head-title {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .micro-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(var(--accent),0.92);
          background: rgba(var(--accent),0.10);
          border: 1px solid rgba(var(--accent),0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .micro-icon bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
        }

        .module-title {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,0.93);
          font-size: 13px;
          line-height: 1.05;
          font-weight: 800;
          text-shadow: 0 1px 2px rgba(0,0,0,0.34);
        }

        .head-right {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .online-chip {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.62);
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          white-space: nowrap;
        }

        .online-chip.is-online {
          color: rgba(201,255,221,0.92);
        }

        .live-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 999px;
          background: rgb(var(--accent-live));
          box-shadow: 0 0 9px rgba(var(--accent-live),0.64);
        }

        .live-dot.is-muted {
          background: rgba(255,255,255,0.34);
          box-shadow: none;
        }

        .mh-menu {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 9px;
          color: rgba(255,255,255,0.52);
          background: transparent;
        }

        .mh-menu bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
        }

        .mh-menu:hover,
        .mh-menu.is-active {
          color: rgba(255,255,255,0.86);
          background: rgba(255,255,255,0.072);
        }

        .camera-stage {
          min-height: 0;
          height: 100%;
          padding: 0 10px 10px;
        }

        .camera-feed {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: block;
          padding: 0;
          border: 0;
          border-radius: calc(var(--card-radius) - 7px);
          background: transparent;
          color: inherit;
          overflow: hidden;
          outline: none;
        }

        .camera-feed:focus-visible {
          box-shadow: inset 0 0 0 1px rgba(138,196,255,0.42);
        }

        .camera-row-image {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
          background:
            radial-gradient(160px 120px at 18% 12%, rgba(255,255,255,0.045), transparent 70%),
            rgba(255,255,255,0.018);
        }

        .camera-live-slot {
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
          pointer-events: none;
        }

        .camera-live-slot:empty { display: none; }

        .camera-live-slot > *,
        .camera-live-el {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }

        .camera-live-el {
          opacity: 0;
          transition: opacity 160ms ease;
        }

        .camera-live-el.is-ready { opacity: 1; }

        .camera-row-image img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          filter: saturate(1.02) contrast(1.02);
          transform: scale(1.002);
          z-index: 1;
        }

        .camera-row-image img.is-hidden,
        .camera-feed.is-unavailable .camera-row-image img {
          opacity: 0;
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: rgba(226,232,240,0.30);
        }

        .camera-placeholder bruno-icon {
          --mdc-icon-size: 42px;
        }

        .camera-feed::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(4,8,16,0.06), transparent 35%),
            linear-gradient(0deg, rgba(4,8,16,0.58), transparent 46%);
        }

        .camera-row-copy {
          position: absolute;
          z-index: 3;
          left: 14px;
          right: 14px;
          bottom: 13px;
          min-width: 0;
          display: grid;
          gap: 3px;
          color: rgba(255,255,255,0.92);
          text-align: left;
        }

        .camera-row-copy strong,
        .camera-row-copy span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.58);
        }

        .camera-row-copy strong {
          font-size: 15px;
          line-height: 1.08;
          font-weight: 800;
        }

        .camera-row-copy span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          color: rgba(255,255,255,0.74);
        }


        .camera-state-surface {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          padding: 16px;
          color: rgba(255,255,255,0.78);
          text-align: center;
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(8px) saturate(0.9);
          -webkit-backdrop-filter: blur(8px) saturate(0.9);
        }

        .camera-state-surface bruno-icon {
          --mdc-icon-size: 32px;
          color: rgba(255,255,255,0.64);
        }

        .camera-state-surface span {
          font-size: 12px;
          font-weight: 760;
          line-height: 1.1;
        }

        .mh-overflow-panel {
          position: absolute;
          top: 42px;
          right: 10px;
          width: min(250px, calc(100% - 20px));
          max-height: calc(100% - 52px);
          display: grid;
          gap: 4px;
          padding: 7px;
          overflow: auto;
          border-radius: var(--bruno-liquid-cell-radius, 13px);
          background: var(--bruno-liquid-popup-background,
            linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
          );
          border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
          box-shadow: var(--bruno-liquid-popup-shadow,
            inset 0 1px 0 rgba(255,255,255,0.100),
            0 18px 36px rgba(0,0,0,0.300)
          );
          backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
          -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
        }

        .camera-option {
          min-width: 0;
          min-height: 34px;
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          padding: 0 9px;
          border: 0;
          border-radius: 9px;
          background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
          color: rgba(255,255,255,0.82);
          text-align: left;
        }

        .camera-option:hover,
        .camera-option.is-active {
          color: rgba(255,255,255,0.98);
          background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
        }

        .camera-option bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-status, 15px);
        }

        .camera-option span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          line-height: 1;
          font-weight: 760;
        }

        @media (max-height: 760px) {
          .module-title {
            font-size: 13px;
          }

          .camera-row-copy strong {
            font-size: 13px;
          }

          .online-chip {
            font-size: 9px;
          }
        }
      </style>

      <section class="glass-card cameras-card">
        <div class="mh-head cameras-head">
          <div class="mh-head-title">
            <span class="micro-icon"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
            <div class="module-title">${BrunoHomeCameraCard._escape(this._config.name || 'Monitoramento')}</div>
          </div>
          <div class="head-right">
            <span class="online-chip${onlineClass}"><span class="online-count">${BrunoHomeCameraCard._escape(onlineText)}</span><i class="live-dot${onlineClass ? '' : ' is-muted'}" aria-hidden="true"></i></span>
            <button
              type="button"
              class="mh-menu${this._menuOpen ? ' is-active' : ''}"
              data-action="camera-menu"
              title="Selecionar camera"
              aria-label="Selecionar camera"
              aria-expanded="${this._menuOpen ? 'true' : 'false'}"
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </div>
        </div>

        <div class="camera-stage">
          ${this._renderCameraFeed(camera)}
        </div>
        ${menu}
      </section>
    `;

    this._wireActions(model.activeId);
    this._mountLiveFeed(model.activeCamera);
  }

  static _menuOption(camera, active) {
    const activeClass = active ? ' is-active' : '';
    const onlineClass = camera.online ? '' : ' is-muted';
    return `
      <button class="camera-option${activeClass}" type="button" role="menuitem" data-camera-id="${BrunoHomeCameraCard._escapeAttr(camera.entity)}">
        <bruno-icon icon="mdi:cctv"></bruno-icon>
        <span>${BrunoHomeCameraCard._escape(camera.name || camera.short_name || 'Camera')}</span>
        <i class="live-dot${onlineClass}" aria-hidden="true"></i>
      </button>
    `;
  }

  static _withCacheBust(url, stamp) {
    if (!url) return '';
    const separator = String(url).includes('?') ? '&' : '?';
    return `${url}${separator}bruno_refresh=${encodeURIComponent(stamp)}`;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoHomeCameraCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_HOME_CAMERA_CARD_TAG)) {
  customElements.define(BRUNO_HOME_CAMERA_CARD_TAG, BrunoHomeCameraCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_HOME_CAMERA_CARD_TAG,
  name: 'Bruno Home Camera Card',
  preview: false,
  description: 'Single camera card for the Bruno home bento grid.',
});
