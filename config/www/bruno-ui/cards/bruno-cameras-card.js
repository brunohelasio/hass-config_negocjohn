const BRUNO_CAMERAS_CARD_TAG = 'bruno-cameras-card';

const BRUNO_CAMERAS_DEFAULT_CONFIG = {
  name: 'Cameras',
  active_entity: 'input_select.bento_active_camera',
  cameras: [
    { entity: 'camera.sl_camera_2', name: 'Sala', short_name: 'Sala' },
    { entity: 'camera.vr_camera_2', name: 'Varanda', short_name: 'Varanda' },
    { entity: 'camera.cz_camera_2', name: 'Cozinha', short_name: 'Cozinha' },
    { entity: 'camera.as_camera_2', name: 'Area de Servico', short_name: 'Area' },
    { entity: 'camera.of_camera_2', name: 'Office', short_name: 'Office' },
    { entity: 'camera.camera_quarto_casal_2', name: 'Quarto Casal', short_name: 'QCasal' },
    { entity: 'camera.qmi_camera_2', name: 'Quarto Miguel', short_name: 'QMiguel' },
    { entity: 'camera.qma_camera_2', name: 'Quarto Marina', short_name: 'QMarina' },
  ],
};

const BRUNO_CAMERA_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];
const BRUNO_CAMERA_UNAVAILABLE_STATES = ['unavailable', 'unknown', ''];
const BRUNO_CAMERA_REFRESH_MS = 6500;

class BrunoCamerasCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = this._normalizeConfig(config);
    this._refreshSeed = this._refreshSeed || Date.now();
    this._safeRender();
    this._startRefreshTimer();
  }

  set hass(hass) {
    this._hass = hass;
    const activeState = this._state(this._config?.active_entity)?.state;
    if (this._localActiveCamera && activeState === this._localActiveCamera) {
      this._localActiveCamera = null;
    }

    if (this.shadowRoot?.querySelector('.cameras-card') && this._renderedWithHass) {
      this._updateStateOnly();
    } else {
      this._safeRender();
    }
    this._startRefreshTimer();
  }

  connectedCallback() {
    this._startRefreshTimer();
  }

  disconnectedCallback() {
    this._stopRefreshTimer();
  }

  getCardSize() {
    return 6;
  }

  _normalizeConfig(config) {
    return {
      ...BRUNO_CAMERAS_DEFAULT_CONFIG,
      ...(config || {}),
      refresh_interval: Number(config?.refresh_interval) > 0
        ? Number(config.refresh_interval)
        : BRUNO_CAMERA_REFRESH_MS,
      cameras: Array.isArray(config?.cameras) && config.cameras.length
        ? config.cameras
        : BRUNO_CAMERAS_DEFAULT_CONFIG.cameras,
    };
  }

  _safeRender() {
    try {
      this._render();
    } catch (error) {
      this._renderError(error);
    }
  }

  _updateStateOnly() {
    try {
      const model = this._model();
      if (model.activeId !== this._lastActiveId) {
        this._safeRender();
        return;
      }

      const active = model.activeCamera;
      const liveCount = this.shadowRoot.querySelector('.live-count');
      if (liveCount) {
        liveCount.innerHTML = `
          <span class="live-dot${model.onlineCount ? ' is-online' : ''}"></span>
          ${model.onlineCount}/${model.totalCount} online
        `;
      }

      const titleSub = this.shadowRoot.querySelector('.title-sub');
      if (titleSub) titleSub.textContent = active?.name || '';

      const activeName = this.shadowRoot.querySelector('.active-name');
      if (activeName) activeName.textContent = active?.name || 'Camera';

      const activeStatus = this.shadowRoot.querySelector('.active-status');
      if (activeStatus) {
        activeStatus.innerHTML = `
          <span class="status-dot${active?.online ? ' is-online' : ''}" data-camera-status="${BrunoCamerasCard._escapeAttr(active?.entity || '')}"></span>
          ${BrunoCamerasCard._escape(active?.status || 'Indisponivel')}
        `;
      }

      model.cameras.forEach((camera) => {
        const activeClass = camera.entity === model.activeId;
        this.shadowRoot
          .querySelectorAll(`.thumb-button[data-camera-id="${BrunoCamerasCard._escapeAttr(camera.entity)}"]`)
          .forEach((button) => button.classList.toggle('is-active', activeClass));

        this.shadowRoot
          .querySelectorAll(`img[data-camera-entity="${BrunoCamerasCard._escapeAttr(camera.entity)}"]`)
          .forEach((image) => {
            if (camera.image) image.dataset.cameraSrcBase = camera.image;
          });

        this.shadowRoot
          .querySelectorAll(`.status-dot[data-camera-status="${BrunoCamerasCard._escapeAttr(camera.entity)}"]`)
          .forEach((dot) => dot.classList.toggle('is-online', camera.online));
      });
    } catch (error) {
      this._renderError(error);
    }
  }

  _startRefreshTimer() {
    if (this._refreshTimer || !this._config || !this.isConnected) return;
    const refreshInterval = Math.max(4000, Number(this._config.refresh_interval) || BRUNO_CAMERA_REFRESH_MS);
    this._refreshTimer = globalThis.setInterval(() => this._refreshCameraImages(), refreshInterval);
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

      const nextSrc = BrunoCamerasCard._withCacheBust(baseSrc, stamp);
      const loader = new globalThis.Image();
      loader.onload = () => {
        image.src = nextSrc;
        image.dataset.hasLoaded = 'true';
        image.classList.remove('is-hidden');
      };
      loader.src = nextSrc;
    });
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _cameraState(camera) {
    const entity = this._state(camera.entity);
    const state = entity?.state || '';
    const unavailable = !entity || BRUNO_CAMERA_UNAVAILABLE_STATES.includes(state);
    const online = !unavailable && BRUNO_CAMERA_ONLINE_STATES.includes(state);
    this._lastCameraImages = this._lastCameraImages || {};
    const liveImage = entity?.attributes?.entity_picture || '';
    if (liveImage) this._lastCameraImages[camera.entity] = liveImage;
    const image = liveImage || this._lastCameraImages[camera.entity] || '';

    return {
      ...camera,
      entityObj: entity,
      state,
      image,
      imageUrl: BrunoCamerasCard._withCacheBust(image, this._refreshSeed || Date.now()),
      unavailable,
      online,
      status: BrunoCamerasCard._statusLabel(state, unavailable),
    };
  }

  _model() {
    const cameras = this._config.cameras.map((camera) => this._cameraState(camera));
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

  _selectCamera(entityId) {
    if (!entityId || entityId === this._model().activeId) return;
    this._localActiveCamera = entityId;
    this._refreshSeed = Date.now();
    this._safeRender();
    this._callService('input_select', 'select_option', {
      entity_id: this._config.active_entity,
      option: entityId,
    });
  }

  _openMoreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _callService(domain, service, data = {}) {
    if (!this._hass || !domain || !service) return;
    this._hass.callService(domain, service, data);
  }

  _wireActions(activeId) {
    const root = this.shadowRoot;
    const preview = root.querySelector('.preview-action');
    preview?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._openMoreInfo(activeId);
    });
    preview?.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._openMoreInfo(activeId);
    });
    preview?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._openMoreInfo(activeId);
    });

    root.querySelectorAll('.thumb-button').forEach((button) => {
      const entityId = button.dataset.cameraId;
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._selectCamera(entityId);
      });
      button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        this._selectCamera(entityId);
      });
    });

    root.querySelectorAll('img').forEach((image) => {
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
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const active = model.activeCamera;
    this._lastActiveId = model.activeId;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 96, 165, 250;
          --accent-live: 34, 197, 94;
          --accent-idle: 148, 163, 184;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.64);
          --text-muted: rgba(226,232,240,0.44);
          display: block;
          height: 100%;
          min-height: 0;
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

        .cameras-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) minmax(74px, 0.32fr);
          gap: 8px;
          padding: 12px;
          color: var(--text-main);
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
            radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%),
            linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
            linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.27),
            0 0 24px rgba(110,150,210,0.055)
          );
          overflow: hidden;
        }

        .cameras-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .card-header,
        .preview-action,
        .thumb-shell {
          position: relative;
          z-index: 1;
        }

        .card-header {
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 2px;
        }

        .header-copy {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 24px;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: rgba(191,219,254,0.86);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .header-icon ha-icon {
          --mdc-icon-size: 14px;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .title-main {
          font-size: 12px;
          line-height: 1;
          font-weight: 780;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
        }

        .title-sub {
          font-size: 10px;
          line-height: 1;
          font-weight: 620;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .live-count {
          flex: 0 0 auto;
          height: 24px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border-radius: 999px;
          color: rgba(220,252,231,0.94);
          background: rgba(var(--accent-live),0.11);
          border: 1px solid rgba(var(--accent-live),0.22);
          box-shadow: 0 0 18px rgba(var(--accent-live),0.08), inset 0 1px 0 rgba(255,255,255,0.08);
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
        }

        .live-dot,
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(var(--accent-idle),0.85);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
        }

        .live-dot.is-online,
        .status-dot.is-online {
          background: rgb(var(--accent-live));
          box-shadow: 0 0 10px rgba(var(--accent-live),0.58);
        }

        .preview-action {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          height: 100%;
          min-height: 0;
          padding: 0;
          border: 0;
          outline: none;
          border-radius: 15px;
          overflow: hidden;
          background: transparent;
          text-align: left;
        }

        .media-frame {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 15px;
          background:
            radial-gradient(140px 120px at 20% 12%, rgba(255,255,255,0.09), transparent 70%),
            linear-gradient(145deg, rgba(15,23,42,0.88), rgba(2,6,23,0.78));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.13),
            inset 0 -1px 0 rgba(0,0,0,0.26),
            0 12px 26px rgba(0,0,0,0.18);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }

        .preview-action:hover .media-frame,
        .preview-action:focus-visible .media-frame {
          border-color: rgba(var(--accent),0.40);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.25),
            0 14px 30px rgba(0,0,0,0.22),
            0 0 24px rgba(var(--accent),0.13);
        }

        .preview-action:active .media-frame {
          transform: translateY(1px) scale(0.996);
        }

        .camera-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.03) contrast(1.02);
          transform: scale(1.002);
        }

        .media-frame.is-image-error .camera-image,
        .camera-image.is-hidden,
        .media-frame:not(.has-image) .camera-image {
          display: none;
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(226,232,240,0.28);
        }

        .camera-placeholder ha-icon {
          --mdc-icon-size: 42px;
          filter: drop-shadow(0 12px 18px rgba(0,0,0,0.35));
        }

        .preview-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(2,6,23,0.10), transparent 38%),
            linear-gradient(0deg, rgba(2,6,23,0.82), rgba(2,6,23,0.28) 36%, transparent 68%);
        }

        .preview-meta {
          position: absolute;
          left: 11px;
          right: 11px;
          bottom: 10px;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          pointer-events: none;
        }

        .active-name {
          display: block;
          font-size: 17px;
          line-height: 1;
          font-weight: 780;
          color: rgba(255,255,255,0.96);
          text-shadow: 0 2px 12px rgba(0,0,0,0.54);
        }

        .active-status {
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          line-height: 1;
          font-weight: 640;
          color: rgba(226,232,240,0.74);
          text-shadow: 0 2px 10px rgba(0,0,0,0.55);
        }

        .preview-badge {
          flex: 0 0 auto;
          min-width: 0;
          height: 27px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 10px;
          border-radius: 999px;
          color: rgba(239,246,255,0.9);
          background: rgba(15,23,42,0.48);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 16px rgba(0,0,0,0.20);
          backdrop-filter: blur(14px) saturate(1.25);
          -webkit-backdrop-filter: blur(14px) saturate(1.25);
          font-size: 10px;
          line-height: 1;
          font-weight: 720;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .preview-badge ha-icon {
          --mdc-icon-size: 13px;
        }

        .thumb-shell {
          min-height: 0;
          border-radius: 14px;
          padding: 5px;
          background:
            radial-gradient(86px 58px at 14% 8%, rgba(255,255,255,0.10), transparent 72%),
            linear-gradient(170deg, rgba(255,255,255,0.08), rgba(255,255,255,0.034));
          border: 1px solid rgba(255,255,255,0.105);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.11), 0 9px 18px rgba(2,6,23,0.18);
          overflow: hidden;
        }

        .thumb-strip {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: calc((100% - 18px) / 4);
          gap: 6px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
        }

        .thumb-strip::-webkit-scrollbar {
          display: none;
        }

        .thumb-button {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          display: block;
          min-width: 0;
          height: 100%;
          padding: 0;
          border: 0;
          outline: none;
          background: transparent;
          scroll-snap-align: start;
        }

        .thumb-media {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 10px;
          background:
            radial-gradient(54px 40px at 20% 10%, rgba(255,255,255,0.08), transparent 76%),
            rgba(16,22,32,0.78);
          border: 1px solid rgba(148,163,184,0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, filter 160ms ease;
        }

        .thumb-button:hover .thumb-media,
        .thumb-button:focus-visible .thumb-media {
          filter: brightness(1.06);
        }

        .thumb-button:active .thumb-media {
          transform: translateY(1px) scale(0.985);
        }

        .thumb-button.is-active .thumb-media {
          border-color: rgba(var(--accent),0.94);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.15),
            0 0 0 1px rgba(var(--accent),0.35),
            0 0 14px rgba(var(--accent),0.25);
        }

        .thumb-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(0.98) contrast(1.02);
        }

        .thumb-media.is-image-error img,
        .thumb-media img.is-hidden,
        .thumb-media:not(.has-image) img {
          display: none;
        }

        .thumb-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(226,232,240,0.25);
        }

        .thumb-placeholder ha-icon {
          --mdc-icon-size: 22px;
        }

        .thumb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(2,6,23,0.78), rgba(2,6,23,0.16) 58%, transparent 100%);
          pointer-events: none;
        }

        .thumb-label {
          position: absolute;
          left: 5px;
          right: 5px;
          bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-width: 0;
          pointer-events: none;
        }

        .thumb-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 720;
          color: rgba(255,255,255,0.92);
          text-shadow: 0 2px 8px rgba(0,0,0,0.58);
        }

        .thumb-label .status-dot {
          width: 6px;
          height: 6px;
          flex: 0 0 auto;
        }

        @media (max-height: 760px) {
          .cameras-card {
            gap: 7px;
            padding: 10px;
            grid-template-rows: auto minmax(0, 1fr) minmax(68px, 0.30fr);
          }

          .active-name {
            font-size: 15px;
          }
        }

        @media (max-width: 800px) {
          :host {
            min-height: 320px;
          }

          .cameras-card {
            min-height: 320px;
            grid-template-rows: auto minmax(0, 1fr) 82px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .media-frame,
          .thumb-media {
            transition: none !important;
          }
        }
      </style>

      <div class="cameras-card">
        <div class="card-header">
          <div class="header-copy">
            <span class="header-icon" aria-hidden="true"><ha-icon icon="mdi:cctv"></ha-icon></span>
            <span class="title">
              <span class="title-main">${BrunoCamerasCard._escape(this._config.name)}</span>
              <span class="title-sub">${BrunoCamerasCard._escape(active?.name || '')}</span>
            </span>
          </div>
          <span class="live-count" title="${model.onlineCount} cameras online">
            <span class="live-dot${model.onlineCount ? ' is-online' : ''}"></span>
            ${model.onlineCount}/${model.totalCount} online
          </span>
        </div>

        <button class="preview-action" type="button" aria-label="${BrunoCamerasCard._escape(active?.name || 'Camera')}" tabindex="0">
          ${BrunoCamerasCard._preview(active)}
        </button>

        <div class="thumb-shell" aria-label="Selecionar camera">
          <div class="thumb-strip">
            ${model.cameras.map((camera) => BrunoCamerasCard._thumbnail(camera, camera.entity === model.activeId)).join('')}
          </div>
        </div>
      </div>
    `;

    this._wireActions(model.activeId);
    this._renderedWithHass = Boolean(this._hass);
  }

  _renderError(error) {
    // Keep Lovelace from replacing the card with hui-error-card; show the
    // failure inside our surface so debugging remains local and reversible.
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    // eslint-disable-next-line no-console
    console.error('[bruno-cameras-card]', error);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          min-height: 0;
        }
        .error-card {
          height: 100%;
          min-height: 0;
          padding: 14px;
          border-radius: 18px;
          color: rgba(255,255,255,0.92);
          background: linear-gradient(160deg, rgba(60,20,28,0.70), rgba(20,20,30,0.58));
          border: 1px solid rgba(255,120,145,0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 44px rgba(0,0,0,0.24);
          overflow: hidden;
        }
        .error-title {
          display: block;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 760;
        }
        .error-detail {
          display: block;
          margin-top: 8px;
          font-size: 11px;
          line-height: 1.35;
          color: rgba(255,255,255,0.62);
          word-break: break-word;
        }
      </style>
      <div class="error-card">
        <span class="error-title">Bruno Cameras Card</span>
        <span class="error-detail">${BrunoCamerasCard._escape(error?.message || error || 'Render error')}</span>
      </div>
    `;
  }

  static _preview(camera) {
    const hasImage = Boolean(camera?.image);
    const onlineClass = camera?.online ? ' is-online' : '';
    return `
      <div class="media-frame${hasImage ? ' has-image' : ''}">
        ${hasImage ? `<img class="camera-image" src="${BrunoCamerasCard._escapeAttr(camera.imageUrl || camera.image)}" data-camera-src-base="${BrunoCamerasCard._escapeAttr(camera.image)}" data-camera-entity="${BrunoCamerasCard._escapeAttr(camera.entity)}" alt="">` : ''}
        <div class="camera-placeholder" aria-hidden="true"><ha-icon icon="mdi:video-outline"></ha-icon></div>
        <div class="preview-scrim"></div>
        <div class="preview-meta">
          <span>
            <span class="active-name">${BrunoCamerasCard._escape(camera?.name || 'Camera')}</span>
            <span class="active-status">
              <span class="status-dot${onlineClass}" data-camera-status="${BrunoCamerasCard._escapeAttr(camera?.entity || '')}"></span>
              ${BrunoCamerasCard._escape(camera?.status || 'Indisponivel')}
            </span>
          </span>
          <span class="preview-badge"><ha-icon icon="mdi:eye-outline"></ha-icon> abrir</span>
        </div>
      </div>
    `;
  }

  static _thumbnail(camera, active) {
    const hasImage = Boolean(camera.image);
    const activeClass = active ? ' is-active' : '';
    const onlineClass = camera.online ? ' is-online' : '';
    return `
      <button class="thumb-button${activeClass}" type="button" data-camera-id="${BrunoCamerasCard._escapeAttr(camera.entity)}" aria-label="${BrunoCamerasCard._escapeAttr(camera.name)}">
        <span class="thumb-media${hasImage ? ' has-image' : ''}">
          ${hasImage ? `<img src="${BrunoCamerasCard._escapeAttr(camera.imageUrl || camera.image)}" data-camera-src-base="${BrunoCamerasCard._escapeAttr(camera.image)}" data-camera-entity="${BrunoCamerasCard._escapeAttr(camera.entity)}" alt="">` : ''}
          <span class="thumb-placeholder" aria-hidden="true"><ha-icon icon="mdi:video-outline"></ha-icon></span>
          <span class="thumb-overlay"></span>
          <span class="thumb-label">
            <span class="status-dot${onlineClass}" data-camera-status="${BrunoCamerasCard._escapeAttr(camera.entity)}"></span>
            <span class="thumb-name">${BrunoCamerasCard._escape(camera.short_name || camera.name)}</span>
          </span>
        </span>
      </button>
    `;
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
    return BrunoCamerasCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_CAMERAS_CARD_TAG)) {
  customElements.define(BRUNO_CAMERAS_CARD_TAG, BrunoCamerasCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_CAMERAS_CARD_TAG,
  name: 'Bruno Cameras Card',
  preview: false,
  description: 'Isolated Bento cameras card with Home Assistant camera snapshots and Bruno liquid glass visuals.',
});
