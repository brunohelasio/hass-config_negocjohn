const BRUNO_SIDEBAR_SUBVIEWS_VERSION = '20260622-sidebar-subviews-2';

const BRUNO_SIDEBAR_INVALID_STATES = ['unknown', 'unavailable', 'none', 'null', ''];
const BRUNO_SIDEBAR_CAMERA_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];

const BRUNO_SIDEBAR_CAMERAS = [
  { entity: 'camera.sl_camera_2', name: 'SL - Sala', short_name: 'Sala' },
  { entity: 'camera.vr_camera_2', name: 'VR - Varanda', short_name: 'Varanda' },
  { entity: 'camera.cz_camera_2', name: 'CZ - Cozinha', short_name: 'Cozinha' },
  { entity: 'camera.as_camera_2', name: 'AS - Area Servico', short_name: 'Area' },
  { entity: 'camera.of_camera_2', name: 'OF - Office', short_name: 'Office' },
  { entity: 'camera.camera_quarto_casal_2', name: 'QC - Quarto Casal', short_name: 'Q. Casal' },
  { entity: 'camera.qmi_camera_2', name: 'QMI - Quarto Miguel', short_name: 'Q. Miguel' },
  { entity: 'camera.qma_camera_2', name: 'QMA - Quarto Marina', short_name: 'Q. Marina' },
];

const BRUNO_ROBOROCK_DEFAULT_ENTITIES = {
  vacuum: 'vacuum.roborock_s7',
  map: 'image.roborock_s7_map_0_custom',
  room: 'sensor.roborock_s7_comodo_atual',
  error: 'sensor.roborock_s7_vacuum_error',
  mop_attached: 'binary_sensor.roborock_s7_mop_attached',
  battery: ['sensor.roborock_s7_bateria', 'sensor.roborock_s7_battery'],
  fan_speed: ['sensor.roborock_s7_fan_speed', 'select.roborock_s7_fan_speed'],
  mop_intensity: 'select.roborock_s7_intensidade_do_mop',
  mop_mode: 'select.roborock_s7_modo_mop',
  volume: 'number.roborock_s7_volume',
  dnd: 'switch.roborock_s7_nao_perturbe',
  child_lock: 'switch.roborock_s7_bloqueio_infantil',
  indicator_light: 'switch.roborock_s7_luz_indicadora',
  area_last: 'sensor.roborock_s7_area_ultima_limpeza',
  time_last: 'sensor.roborock_s7_tempo_ultima_limpeza',
  area_total: 'sensor.roborock_s7_area_total',
  time_total: 'sensor.roborock_s7_tempo_total',
  clean_count: 'sensor.roborock_s7_numero_de_limpezas',
};

class BrunoSidebarBaseSubview extends HTMLElement {
  constructor() {
    super();
    this._hass = null;
    this._config = {};
    this._refreshSeed = Date.now();
  }

  setConfig(config) {
    this._config = { ...(this.defaultConfig || {}), ...(config || {}) };
    this._safeRender();
  }

  set hass(hass) {
    this._hass = hass;
    this._safeRender();
  }

  connectedCallback() {
    globalThis.BrunoLiquidGlass?.apply?.();
  }

  getCardSize() {
    return 12;
  }

  _safeRender() {
    try {
      this._render();
    } catch (error) {
      this._renderError(error);
    }
  }

  _renderError(error) {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${BrunoSidebarBaseSubview.baseStyles()}</style>
      <main class="bruno-sidebar-page">
        <section class="glass-card error-card">
          <strong>Erro na subview</strong>
          <span>${BrunoSidebarBaseSubview.escape(error?.message || error)}</span>
        </section>
      </main>
    `;
  }

  _state(entityId) {
    if (Array.isArray(entityId)) {
      const states = entityId.map((id) => this._state(id)).filter(Boolean);
      return states.find((entity) => !this._isInvalid(entity?.state)) || states[0];
    }
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isInvalid(value) {
    return value == null || BRUNO_SIDEBAR_INVALID_STATES.includes(String(value).toLowerCase());
  }

  _display(entityId, fallback = '--') {
    const entity = this._state(entityId);
    if (!entity || this._isInvalid(entity.state)) return fallback;
    const unit = entity.attributes?.unit_of_measurement || '';
    return `${entity.state}${unit ? ` ${unit}` : ''}`;
  }

  _number(entityId, fallback = null) {
    const raw = this._state(entityId)?.state;
    const value = Number.parseFloat(String(raw).replace(',', '.'));
    return Number.isFinite(value) ? value : fallback;
  }

  _callService(serviceName, data = {}, target = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;

    const payload = { ...data };
    if (target?.entity_id && payload.entity_id == null) payload.entity_id = target.entity_id;
    this._hass.callService(domain, service, payload, target);
  }

  _navigate(path = '/ngocjohn-main/bento-lab') {
    globalThis.BrunoLiquidGlass?.routeTransition?.();
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path },
      bubbles: true,
      composed: true,
    }));
  }

  _homePath() {
    const current = window.location.pathname || '';
    if (current.startsWith('/ngocjohn-main')) return '/ngocjohn-main/bento-lab';
    if (current.startsWith('/lovelace')) return '/lovelace/bento-lab';
    return '/ngocjohn-main/bento-lab';
  }

  _wireShellActions() {
    this.shadowRoot.querySelectorAll('[data-nav]').forEach((button) => {
      button.addEventListener('click', () => this._navigate(button.dataset.nav));
    });
  }

  _header(title, subtitle, icon = 'mdi:view-dashboard-outline') {
    return `
      <header class="page-header">
        <button class="back-button" type="button" data-nav="${BrunoSidebarBaseSubview.escapeAttr(this._homePath())}" aria-label="Voltar para home">
          <ha-icon icon="mdi:close"></ha-icon>
        </button>
        <span class="header-icon" aria-hidden="true"><ha-icon icon="${BrunoSidebarBaseSubview.escapeAttr(icon)}"></ha-icon></span>
        <span class="header-copy">
          <strong>${BrunoSidebarBaseSubview.escape(title)}</strong>
          <small>${BrunoSidebarBaseSubview.escape(subtitle)}</small>
        </span>
      </header>
    `;
  }

  static baseStyles() {
    return `
      :host {
        --accent: 150, 190, 255;
        display: block;
        height: 100vh;
        min-height: 0;
        color: rgba(246,250,255,0.95);
        font-family: var(--primary-font-family, system-ui, sans-serif);
        contain: layout style;
      }

      * {
        box-sizing: border-box;
        letter-spacing: 0;
      }

      button,
      select,
      input {
        font: inherit;
        color: inherit;
      }

      button {
        cursor: pointer;
        touch-action: manipulation;
        user-select: none;
        -webkit-user-select: none;
      }

      .bruno-sidebar-page {
        width: 100%;
        height: 100vh;
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 12px;
        padding: 14px;
        overflow: hidden;
        background:
          radial-gradient(520px 320px at 22% 0%, rgba(255,255,255,0.075), transparent 68%),
          radial-gradient(460px 340px at 86% 96%, rgba(var(--accent),0.115), transparent 72%),
          linear-gradient(140deg, #07090d 0%, #111722 55%, #07090d 100%);
      }

      .page-header {
        min-height: 48px;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 0 4px;
        min-width: 0;
      }

      .back-button,
      .icon-button,
      .action-button {
        appearance: none;
        -webkit-appearance: none;
        display: inline-grid;
        place-items: center;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.18));
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.06));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.16));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(22px) saturate(1.42));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(22px) saturate(1.42));
        color: rgba(255,255,255,0.86);
        outline: none;
        transition: transform 160ms ease, filter 160ms ease, border-color 160ms ease;
      }

      .back-button,
      .icon-button {
        width: 42px;
        height: 42px;
        border-radius: 999px;
      }

      .back-button:hover,
      .icon-button:hover,
      .action-button:hover {
        filter: brightness(1.08);
        border-color: rgba(var(--accent),0.36);
      }

      .back-button:active,
      .icon-button:active,
      .action-button:active {
        transform: translateY(1px) scale(0.985);
      }

      .header-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        color: rgba(191,219,254,0.94);
        background: rgba(255,255,255,0.075);
        border: 1px solid rgba(255,255,255,0.12);
      }

      .header-copy {
        min-width: 0;
        display: grid;
        gap: 3px;
      }

      .header-copy strong {
        font-size: 20px;
        line-height: 1;
        font-weight: 800;
      }

      .header-copy small {
        font-size: 12px;
        line-height: 1;
        color: rgba(226,232,240,0.62);
        font-weight: 680;
      }

      .glass-card {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 0;
        color: rgba(246,250,255,0.95);
        background: var(--bruno-liquid-surface-off-background, rgba(15,20,30,0.58));
        border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.16));
        border-radius: var(--bruno-liquid-card-radius, 24px);
        box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 44px rgba(0,0,0,0.30));
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.62));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.62));
        overflow: hidden;
      }

      .glass-card::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        pointer-events: none;
        border-radius: inherit;
        background: var(--bruno-liquid-surface-off-sheen, linear-gradient(180deg, rgba(255,255,255,0.14), transparent 40%));
        opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.72);
      }

      .glass-card > * {
        position: relative;
        z-index: 1;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .metric {
        min-height: 68px;
        display: grid;
        align-content: center;
        gap: 6px;
        padding: 12px;
        border-radius: var(--bruno-liquid-cell-radius, 18px);
        background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.06));
        border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.13));
        box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
      }

      .metric small {
        font-size: 10px;
        line-height: 1;
        color: rgba(226,232,240,0.56);
        font-weight: 760;
        text-transform: uppercase;
      }

      .metric strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 19px;
        line-height: 1;
      }

      .action-button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 14px;
        border-radius: var(--bruno-liquid-control-radius, 18px);
      }

      .action-button.primary {
        background: var(--bruno-liquid-control-blue-background, rgba(59,130,246,0.52));
        border-color: var(--bruno-liquid-control-blue-border, rgba(175,214,255,0.48));
        box-shadow: var(--bruno-liquid-control-blue-shadow, 0 0 22px rgba(96,165,250,0.30));
      }

      .error-card {
        min-height: 260px;
        display: grid;
        place-items: center;
        gap: 8px;
        padding: 24px;
        color: rgba(255,230,235,0.92);
      }

      @media (max-width: 900px) {
        .bruno-sidebar-page {
          height: auto;
          min-height: 100vh;
          overflow: auto;
        }
      }
    `;
  }

  static escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static escapeAttr(value) {
    return BrunoSidebarBaseSubview.escape(value).replace(/'/g, '&#39;');
  }

  static withCacheBust(src, stamp) {
    if (!src) return '';
    return `${src}${src.includes('?') ? '&' : '?'}bruno_t=${encodeURIComponent(stamp || Date.now())}`;
  }
}

class BrunoMusicSubview extends BrunoSidebarBaseSubview {
  get defaultConfig() {
    return {
      title: 'Musica',
      subtitle: 'Music Assistant e players da casa',
      ingress_url: '/api/hassio_ingress/DxjwvCHHhrKMJQKVZKPsf-69nPQW-hrXk4iJ09PqKgQ/',
      focus_sensor: 'sensor.media_focus_visuals',
      focus_select: 'input_select.media_focus_player',
    };
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        ${BrunoSidebarBaseSubview.baseStyles()}
        .music-layout {
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(280px, 360px) minmax(0, 1fr);
          gap: 12px;
        }

        .media-panel {
          display: grid;
          grid-template-rows: minmax(280px, 360px) auto minmax(0, 1fr);
          gap: 10px;
          padding: 12px;
        }

        .media-mount {
          min-height: 0;
        }

        .media-mount bruno-media-card {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 280px;
        }

        .quick-actions {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .now-playing {
          display: grid;
          align-content: start;
          gap: 10px;
          padding: 12px;
          border-radius: var(--bruno-liquid-cell-radius, 18px);
          background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.06));
          border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.13));
        }

        .now-playing strong,
        .now-playing span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .now-playing span {
          color: rgba(226,232,240,0.62);
          font-size: 12px;
          font-weight: 680;
        }

        .iframe-card {
          display: grid;
          padding: 0;
        }

        iframe {
          width: 100%;
          height: 100%;
          min-height: 0;
          border: 0;
          background: rgba(8,12,18,0.78);
        }

        @media (max-width: 980px) {
          .music-layout {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(620px, 70vh);
          }
        }
      </style>
      <main class="bruno-sidebar-page">
        ${this._header(this._config.title, this._config.subtitle, 'mdi:music')}
        <section class="music-layout">
          <aside class="glass-card media-panel">
            <div class="media-mount"><bruno-media-card></bruno-media-card></div>
            <div class="quick-actions">
              <button class="action-button primary" type="button" data-service="script.media_focus_play_pause">
                <ha-icon icon="mdi:play-pause"></ha-icon><span>Play/Pause</span>
              </button>
              <button class="action-button" type="button" data-service="script.media_focus_volume_mute">
                <ha-icon icon="mdi:volume-mute"></ha-icon><span>Mute</span>
              </button>
            </div>
            ${this._nowPlaying()}
          </aside>
          <section class="glass-card iframe-card">
            <iframe title="Music Assistant" src="${BrunoSidebarBaseSubview.escapeAttr(this._config.ingress_url)}"></iframe>
          </section>
        </section>
      </main>
    `;
    this._wireShellActions();
    this._mountMediaCard();
    this.shadowRoot.querySelectorAll('[data-service]').forEach((button) => {
      button.addEventListener('click', () => this._callService(button.dataset.service));
    });
  }

  _mountMediaCard() {
    const card = this.shadowRoot?.querySelector('bruno-media-card');
    if (!card) return;
    if (typeof card.setConfig !== 'function') {
      window.setTimeout(() => this._mountMediaCard(), 250);
      return;
    }
    card.setConfig({
      focus_sensor: this._config.focus_sensor,
      focus_select: this._config.focus_select,
    });
    card.hass = this._hass;
  }

  _nowPlaying() {
    const visual = this._state(this._config.focus_sensor);
    const playerId = this._state(this._config.focus_select)?.state;
    const player = this._state(playerId);
    const title = visual?.attributes?.media_title || player?.attributes?.media_title || 'Nenhuma midia ativa';
    const artist = visual?.attributes?.media_artist || player?.attributes?.media_artist || this._display(this._config.focus_select, 'Selecione um player');
    return `
      <div class="now-playing">
        <small>Agora</small>
        <strong>${BrunoSidebarBaseSubview.escape(title)}</strong>
        <span>${BrunoSidebarBaseSubview.escape(artist)}</span>
      </div>
    `;
  }
}

class BrunoCamerasSubview extends BrunoSidebarBaseSubview {
  constructor() {
    super();
    this._localActiveCamera = '';
    this._lastCameraImages = {};
  }

  get defaultConfig() {
    return {
      title: 'Cameras',
      subtitle: 'Visualizacao rapida sem abrir mais-info',
      active_entity: 'input_select.bento_active_camera',
      refresh_interval: 6500,
      cameras: BRUNO_SIDEBAR_CAMERAS,
    };
  }

  connectedCallback() {
    super.connectedCallback();
    this._startRefreshTimer();
  }

  disconnectedCallback() {
    this._stopRefreshTimer();
  }

  _startRefreshTimer() {
    if (this._refreshTimer) return;
    this._refreshTimer = window.setInterval(() => {
      this._refreshSeed = Date.now();
      this._safeRender();
    }, Math.max(4000, Number(this._config.refresh_interval) || 6500));
  }

  _stopRefreshTimer() {
    if (!this._refreshTimer) return;
    window.clearInterval(this._refreshTimer);
    this._refreshTimer = null;
  }

  _camera(camera) {
    const entity = this._state(camera.entity);
    const state = entity?.state || '';
    const unavailable = !entity || this._isInvalid(state);
    const online = !unavailable && BRUNO_SIDEBAR_CAMERA_ONLINE_STATES.includes(state);
    const liveImage = entity?.attributes?.entity_picture || '';
    if (liveImage) this._lastCameraImages[camera.entity] = liveImage;
    const image = liveImage || this._lastCameraImages[camera.entity] || `/api/camera_proxy/${camera.entity}`;
    return {
      ...camera,
      image,
      imageUrl: BrunoSidebarBaseSubview.withCacheBust(image, this._refreshSeed),
      state,
      online,
      status: online ? 'Online' : unavailable ? 'Indisponivel' : state,
    };
  }

  _model() {
    const cameras = (this._config.cameras || BRUNO_SIDEBAR_CAMERAS).map((camera) => this._camera(camera));
    const configured = this._state(this._config.active_entity)?.state;
    const activeId = this._localActiveCamera
      || (cameras.some((camera) => camera.entity === configured) ? configured : cameras[0]?.entity);
    return {
      cameras,
      activeId,
      active: cameras.find((camera) => camera.entity === activeId) || cameras[0],
      online: cameras.filter((camera) => camera.online).length,
    };
  }

  _selectCamera(entityId) {
    if (!entityId) return;
    this._localActiveCamera = entityId;
    this._refreshSeed = Date.now();
    this._callService('input_select.select_option', {
      entity_id: this._config.active_entity,
      option: entityId,
    });
    this._safeRender();
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const model = this._model();
    const active = model.active;
    this.shadowRoot.innerHTML = `
      <style>
        ${BrunoSidebarBaseSubview.baseStyles()}
        .cameras-layout {
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(270px, 330px);
          gap: 12px;
        }

        .camera-main {
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          padding: 12px;
          gap: 10px;
        }

        .camera-frame,
        .thumb-frame {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          background: linear-gradient(145deg, rgba(15,23,42,0.88), rgba(2,6,23,0.78));
          border: 1px solid rgba(255,255,255,0.11);
        }

        .camera-frame img,
        .thumb-frame img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-frame {
          min-height: 0;
        }

        .camera-meta {
          min-height: 72px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
          padding: 0 4px;
        }

        .camera-title {
          min-width: 0;
          display: grid;
          gap: 6px;
        }

        .camera-title strong {
          font-size: 24px;
          line-height: 1;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .camera-status {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          color: rgba(226,232,240,0.66);
          font-size: 12px;
          font-weight: 720;
        }

        .status-dot {
          width: 8px;
          height: 8px;
          border-radius: 999px;
          background: rgba(148,163,184,0.72);
        }

        .status-dot.is-online {
          background: rgb(52,211,153);
          box-shadow: 0 0 12px rgba(52,211,153,0.58);
        }

        .thumbs {
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px;
          padding: 12px;
        }

        .thumbs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: rgba(226,232,240,0.66);
          font-size: 12px;
          font-weight: 760;
        }

        .thumb-grid {
          min-height: 0;
          display: grid;
          grid-template-columns: 1fr;
          grid-auto-rows: minmax(96px, 1fr);
          gap: 8px;
          overflow: auto;
          padding-right: 2px;
          scrollbar-width: none;
        }

        .thumb-grid::-webkit-scrollbar {
          display: none;
        }

        .thumb-button {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          padding: 0;
          border: 0;
          background: transparent;
          outline: none;
          min-height: 96px;
        }

        .thumb-button.is-active .thumb-frame {
          border-color: rgba(var(--accent),0.86);
          box-shadow: 0 0 0 1px rgba(var(--accent),0.24), 0 0 18px rgba(var(--accent),0.18);
        }

        .thumb-frame {
          height: 100%;
          min-height: 96px;
        }

        .thumb-label {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 7px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 8px;
          color: white;
          text-shadow: 0 2px 10px rgba(0,0,0,0.62);
          font-size: 12px;
          font-weight: 780;
          pointer-events: none;
        }

        .scrim {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(2,6,23,0.76), transparent 54%);
          pointer-events: none;
        }

        @media (max-width: 980px) {
          .cameras-layout {
            grid-template-columns: 1fr;
            grid-template-rows: minmax(420px, 62vh) auto;
          }

          .thumb-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-auto-rows: 120px;
            overflow: visible;
          }
        }
      </style>
      <main class="bruno-sidebar-page">
        ${this._header(this._config.title, `${model.online}/${model.cameras.length} cameras online`, 'mdi:cctv')}
        <section class="cameras-layout">
          <section class="glass-card camera-main">
            <div class="camera-frame">
              <img src="${BrunoSidebarBaseSubview.escapeAttr(active?.imageUrl || '')}" alt="">
              <span class="scrim"></span>
            </div>
            <div class="camera-meta">
              <span class="camera-title">
                <strong>${BrunoSidebarBaseSubview.escape(active?.name || 'Camera')}</strong>
                <span class="camera-status">
                  <span class="status-dot${active?.online ? ' is-online' : ''}"></span>
                  ${BrunoSidebarBaseSubview.escape(active?.status || 'Indisponivel')}
                </span>
              </span>
              <button class="action-button" type="button" data-refresh>
                <ha-icon icon="mdi:refresh"></ha-icon><span>Atualizar</span>
              </button>
            </div>
          </section>
          <aside class="glass-card thumbs">
            <div class="thumbs-header">
              <span>Mosaico</span>
              <span>${model.cameras.length} pontos</span>
            </div>
            <div class="thumb-grid">
              ${model.cameras.map((camera) => this._thumb(camera, camera.entity === model.activeId)).join('')}
            </div>
          </aside>
        </section>
      </main>
    `;
    this._wireShellActions();
    this.shadowRoot.querySelector('[data-refresh]')?.addEventListener('click', () => {
      this._refreshSeed = Date.now();
      this._safeRender();
    });
    this.shadowRoot.querySelectorAll('[data-camera]').forEach((button) => {
      button.addEventListener('click', () => this._selectCamera(button.dataset.camera));
    });
  }

  _thumb(camera, active) {
    return `
      <button class="thumb-button${active ? ' is-active' : ''}" type="button" data-camera="${BrunoSidebarBaseSubview.escapeAttr(camera.entity)}" aria-label="${BrunoSidebarBaseSubview.escapeAttr(camera.name)}">
        <span class="thumb-frame">
          <img src="${BrunoSidebarBaseSubview.escapeAttr(camera.imageUrl)}" alt="">
          <span class="scrim"></span>
          <span class="thumb-label">
            <span>${BrunoSidebarBaseSubview.escape(camera.short_name || camera.name)}</span>
            <span class="status-dot${camera.online ? ' is-online' : ''}"></span>
          </span>
        </span>
      </button>
    `;
  }
}

class BrunoRoborockSubview extends BrunoSidebarBaseSubview {
  get defaultConfig() {
    return {
      title: 'Roborock S7',
      subtitle: 'Mapa, resumo e ajustes principais',
      entities: BRUNO_ROBOROCK_DEFAULT_ENTITIES,
    };
  }

  setConfig(config) {
    const incoming = config || {};
    this._config = {
      ...this.defaultConfig,
      ...incoming,
      entities: {
        ...BRUNO_ROBOROCK_DEFAULT_ENTITIES,
        ...(incoming.entities || {}),
      },
    };
    this._safeRender();
  }

  _vacuumModel() {
    const entities = this._config.entities;
    const vacuum = this._state(entities.vacuum);
    const state = vacuum?.state || 'unknown';
    const labels = {
      cleaning: 'Limpando',
      returning: 'Voltando',
      docked: 'Na base',
      idle: 'Parado',
      paused: 'Pausado',
      moving: 'Movendo',
      segment_cleaning: 'Limpando zona',
    };
    const battery = vacuum?.attributes?.battery_level ?? this._state(entities.battery)?.state;
    const map = this._state(entities.map);
    const mapImage = map?.attributes?.entity_picture || `/api/image_proxy/${entities.map}`;

    return {
      state,
      status: labels[state] || state || 'Indisponivel',
      battery: this._isInvalid(battery) ? '--' : `${Math.round(Number(battery))}%`,
      room: this._display(entities.room, '--'),
      error: this._display(entities.error, 'Nenhum'),
      mapImage: BrunoSidebarBaseSubview.withCacheBust(mapImage, Date.now()),
    };
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const entities = this._config.entities;
    const model = this._vacuumModel();
    this.shadowRoot.innerHTML = `
      <style>
        ${BrunoSidebarBaseSubview.baseStyles()}
        .vacuum-layout {
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(260px, 320px) minmax(0, 1fr) minmax(260px, 320px);
          gap: 12px;
        }

        .summary,
        .settings {
          display: grid;
          align-content: start;
          gap: 10px;
          padding: 12px;
          overflow: hidden;
        }

        .map-card {
          display: grid;
          place-items: center;
          padding: 12px;
          background:
            radial-gradient(460px 320px at 50% 45%, rgba(96,165,250,0.08), transparent 66%),
            var(--bruno-liquid-surface-off-background, rgba(15,20,30,0.58));
        }

        .map-frame {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 20px;
          background: rgba(2,6,23,0.42);
          border: 1px solid rgba(255,255,255,0.11);
        }

        .map-frame img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }

        .robot-status {
          min-height: 180px;
          display: grid;
          align-content: center;
          justify-items: center;
          text-align: center;
          gap: 10px;
          padding: 16px;
          border-radius: 22px;
          background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.06));
          border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.13));
        }

        .robot-status ha-icon {
          --mdc-icon-size: 70px;
          color: rgba(191,219,254,0.92);
          filter: drop-shadow(0 0 22px rgba(96,165,250,0.22));
        }

        .robot-status strong {
          font-size: 22px;
          line-height: 1;
        }

        .robot-status span {
          color: rgba(226,232,240,0.62);
          font-size: 12px;
          font-weight: 720;
        }

        .action-row {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .control-row {
          display: grid;
          gap: 6px;
        }

        .control-row label {
          font-size: 11px;
          color: rgba(226,232,240,0.58);
          font-weight: 780;
          text-transform: uppercase;
        }

        select,
        input[type="range"] {
          width: 100%;
          min-height: 42px;
          border-radius: 14px;
          border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.18));
          background: rgba(15,20,30,0.62);
          color: rgba(255,255,255,0.92);
          padding: 0 12px;
          outline: none;
        }

        .toggle-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          min-height: 54px;
          padding: 0 12px;
          border-radius: 16px;
          background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.06));
          border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.13));
        }

        .toggle-row strong {
          font-size: 13px;
        }

        .toggle-row small {
          color: rgba(226,232,240,0.56);
          font-size: 11px;
          font-weight: 700;
        }

        @media (max-width: 1120px) {
          .vacuum-layout {
            grid-template-columns: 1fr;
            grid-template-rows: auto minmax(520px, 66vh) auto;
          }
        }
      </style>
      <main class="bruno-sidebar-page">
        ${this._header(this._config.title, this._config.subtitle, 'mdi:robot-vacuum')}
        <section class="vacuum-layout">
          <aside class="glass-card summary">
            <div class="robot-status">
              <ha-icon icon="mdi:robot-vacuum"></ha-icon>
              <strong>${BrunoSidebarBaseSubview.escape(model.status)}</strong>
              <span>${BrunoSidebarBaseSubview.escape(model.room)} - bateria ${BrunoSidebarBaseSubview.escape(model.battery)}</span>
            </div>
            <div class="metric-grid">
              ${this._metric('Erro', model.error)}
              ${this._metric('Mop', this._display(entities.mop_attached, '--'))}
              ${this._metric('Area ult.', this._display(entities.area_last, '--'))}
              ${this._metric('Tempo ult.', this._display(entities.time_last, '--'))}
            </div>
            <div class="action-row">
              ${this._action('vacuum.start', 'mdi:play', 'Iniciar', true)}
              ${this._action('vacuum.pause', 'mdi:pause', 'Pausar')}
              ${this._action('vacuum.return_to_base', 'mdi:home-map-marker', 'Base')}
            </div>
          </aside>
          <section class="glass-card map-card">
            <div class="map-frame">
              <img src="${BrunoSidebarBaseSubview.escapeAttr(model.mapImage)}" alt="">
            </div>
          </section>
          <aside class="glass-card settings">
            <div class="metric-grid">
              ${this._metric('Area total', this._display(entities.area_total, '--'))}
              ${this._metric('Tempo total', this._display(entities.time_total, '--'))}
              ${this._metric('Limpezas', this._display(entities.clean_count, '--'))}
              ${this._metric('Fan', this._display(entities.fan_speed, '--'))}
            </div>
            ${this._selectControl('Intensidade do Mop', entities.mop_intensity)}
            ${this._selectControl('Modo do Mop', entities.mop_mode)}
            ${this._rangeControl('Volume', entities.volume)}
            ${this._toggle('Nao perturbe', entities.dnd)}
            ${this._toggle('Luz indicadora', entities.indicator_light)}
            ${this._toggle('Bloqueio infantil', entities.child_lock)}
          </aside>
        </section>
      </main>
    `;
    this._wireShellActions();
    this.shadowRoot.querySelectorAll('[data-vacuum-service]').forEach((button) => {
      button.addEventListener('click', () => this._callService(button.dataset.vacuumService, {}, { entity_id: entities.vacuum }));
    });
    this.shadowRoot.querySelectorAll('[data-select-entity]').forEach((select) => {
      select.addEventListener('change', () => this._callService('select.select_option', {
        entity_id: select.dataset.selectEntity,
        option: select.value,
      }));
    });
    this.shadowRoot.querySelectorAll('[data-number-entity]').forEach((input) => {
      input.addEventListener('change', () => this._callService('number.set_value', {
        entity_id: input.dataset.numberEntity,
        value: Number(input.value),
      }));
    });
    this.shadowRoot.querySelectorAll('[data-switch-entity]').forEach((button) => {
      button.addEventListener('click', () => this._callService('switch.toggle', {}, { entity_id: button.dataset.switchEntity }));
    });
  }

  _metric(label, value) {
    return `<span class="metric"><small>${BrunoSidebarBaseSubview.escape(label)}</small><strong>${BrunoSidebarBaseSubview.escape(value)}</strong></span>`;
  }

  _action(service, icon, label, primary = false) {
    return `
      <button class="action-button${primary ? ' primary' : ''}" type="button" data-vacuum-service="${service}" aria-label="${BrunoSidebarBaseSubview.escapeAttr(label)}">
        <ha-icon icon="${icon}"></ha-icon>
      </button>
    `;
  }

  _selectControl(label, entityId) {
    const entity = this._state(entityId);
    const options = Array.isArray(entity?.attributes?.options) ? entity.attributes.options : [];
    if (!entity || !options.length) return '';
    return `
      <div class="control-row">
        <label>${BrunoSidebarBaseSubview.escape(label)}</label>
        <select data-select-entity="${BrunoSidebarBaseSubview.escapeAttr(entityId)}">
          ${options.map((option) => `<option value="${BrunoSidebarBaseSubview.escapeAttr(option)}"${option === entity.state ? ' selected' : ''}>${BrunoSidebarBaseSubview.escape(option)}</option>`).join('')}
        </select>
      </div>
    `;
  }

  _rangeControl(label, entityId) {
    const entity = this._state(entityId);
    if (!entity || this._isInvalid(entity.state)) return '';
    const min = Number(entity.attributes?.min ?? 0);
    const max = Number(entity.attributes?.max ?? 100);
    const step = Number(entity.attributes?.step ?? 1);
    return `
      <div class="control-row">
        <label>${BrunoSidebarBaseSubview.escape(label)} - ${BrunoSidebarBaseSubview.escape(entity.state)}</label>
        <input type="range" min="${min}" max="${max}" step="${step}" value="${BrunoSidebarBaseSubview.escapeAttr(entity.state)}" data-number-entity="${BrunoSidebarBaseSubview.escapeAttr(entityId)}">
      </div>
    `;
  }

  _toggle(label, entityId) {
    const entity = this._state(entityId);
    if (!entity) return '';
    const enabled = entity.state === 'on';
    return `
      <button class="toggle-row" type="button" data-switch-entity="${BrunoSidebarBaseSubview.escapeAttr(entityId)}">
        <span><strong>${BrunoSidebarBaseSubview.escape(label)}</strong><br><small>${enabled ? 'Ativo' : 'Inativo'}</small></span>
        <ha-icon icon="${enabled ? 'mdi:toggle-switch' : 'mdi:toggle-switch-off-outline'}"></ha-icon>
      </button>
    `;
  }
}

class BrunoFloorplanSubview extends BrunoSidebarBaseSubview {
  get defaultConfig() {
    return {
      title: 'Planta 3D',
      subtitle: 'Apartamento em tela cheia',
      image: '/local/images/planta_apartamento_home_assistant.png',
    };
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>
        ${BrunoSidebarBaseSubview.baseStyles()}
        .floorplan-card {
          display: grid;
          place-items: center;
          padding: 10px;
        }

        .floorplan-stage {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          place-items: center;
          border-radius: 22px;
          overflow: hidden;
          background: rgba(2,6,23,0.34);
          border: 1px solid rgba(255,255,255,0.10);
        }

        .floorplan-stage img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          display: block;
        }
      </style>
      <main class="bruno-sidebar-page">
        ${this._header(this._config.title, this._config.subtitle, 'mdi:floor-plan')}
        <section class="glass-card floorplan-card">
          <div class="floorplan-stage">
            <img src="${BrunoSidebarBaseSubview.escapeAttr(this._config.image)}" alt="">
          </div>
        </section>
      </main>
    `;
    this._wireShellActions();
  }
}

[
  ['bruno-music-subview', BrunoMusicSubview, 'Bruno Music Subview'],
  ['bruno-cameras-subview', BrunoCamerasSubview, 'Bruno Cameras Subview'],
  ['bruno-roborock-subview', BrunoRoborockSubview, 'Bruno Roborock Subview'],
  ['bruno-floorplan-subview', BrunoFloorplanSubview, 'Bruno Floorplan Subview'],
].forEach(([tag, klass, name]) => {
  if (!customElements.get(tag)) customElements.define(tag, klass);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: tag,
    name,
    preview: false,
    description: `Sidebar view bundle ${BRUNO_SIDEBAR_SUBVIEWS_VERSION}`,
  });
});
