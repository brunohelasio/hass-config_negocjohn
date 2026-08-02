const BRUNO_QUARTO_MIGUEL_SUBVIEW_TAG = 'bruno-quarto-miguel-subview';
const BRUNO_QUARTO_MIGUEL_CURTAIN_CALIBRATION = [
  { visual: 0, position: 0 },
  { visual: 25, position: 33 },
  { visual: 50, position: 47 },
  { visual: 75, position: 70 },
  { visual: 100, position: 100 },
];
const BRUNO_QUARTO_MIGUEL_CURTAIN_PRESETS = [
  { label: 0, closed: 0, position: 100 },
  { label: 25, closed: 25, position: 70 },
  { label: 50, closed: 50, position: 47 },
  { label: 75, closed: 75, position: 33 },
  { label: 100, closed: 100, position: 0 },
];
const BRUNO_QUARTO_MIGUEL_CURTAIN_TRAVEL_MS = 30000;
const BRUNO_QUARTO_MIGUEL_CURTAIN_MIN_MOTION_MS = 1200;
const BRUNO_QUARTO_MIGUEL_CURTAIN_MOTION_TICK_MS = 350;
const BRUNO_QUARTO_MIGUEL_CURTAIN_TARGET_TOLERANCE = 2;

const BRUNO_QUARTO_MIGUEL_SUBVIEW_DEFAULT_CONFIG = {
  title: 'Q. Miguel',
  subtitle: 'Visao geral',
  greeting_name: 'Bruno',
  navigation_path: 'bento-lab',
  background: '/local/images/quarto_miguel.jpg?v=20260702-all-images-1',
  fallback_background: '/local/images/quarto_miguel.jpg?v=20260702-all-images-1',
  refresh_interval: 6500,
  spotify_device_name: '',
  climate_device_name: 'Gree',
  climate_image: '/local/images/ar-condicionado-gree-tight.png?v=20260702-all-images-1',
  climate_active_image: '/local/images/ar-condicionado-gree-on-tight.png?v=20260702-all-images-1',
  tv_standby_image: '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260702-all-images-1',
  spotify_standby_image: '/local/images/echo_pop.png?v=20260702-all-images-1',
  tv_apps: [
    { key: 'netflix', label: 'Netflix', image: '/local/images/netflix_bg.jpg?v=20260702-all-images-1', script: '' },
    { key: 'prime', label: 'Prime Video', image: '/local/images/prime_video_tile.png?v=20260702-all-images-1', script: '' },
    { key: 'disney', label: 'Disney+', image: '/local/images/dp_bg.jpg?v=20260702-all-images-1', script: '' },
    { key: 'max', label: 'Max', image: '/local/images/HBOMax_bg.jpg?v=20260702-all-images-1', script: '' },
  ],
  light_zone_labels: { sala: 'Quarto', varanda: 'Suíte' },
  room_nav: [
    { key: 'sala', name: 'Sala', icon: 'mdi:sofa', path: 'subview-sala' },
    { key: 'office', name: 'Office', icon: 'mdi:desk', path: 'subview-office' },
    { key: 'cozinha', name: 'Cozinha', icon: 'mdi:countertop', path: 'subview-cozinha' },
    { key: 'casal', name: 'Q. Casal', icon: 'mdi:bed-king', path: 'subview-quarto-casal' },
    { key: 'marina', name: 'Q. Marina', icon: 'mdi:bed-single', path: 'subview-quarto-marina' },
    { key: 'miguel', name: 'Q. Miguel', icon: 'mdi:bed-single-outline', path: 'subview-quarto-miguel', active: true },
  ],
  entities: {
    curtain: '',
    curtain_percent_control: '',
    active_sensor: 'sensor.quarto_miguel_active',
    semantic_sensor: 'sensor.q_miguel_semantic_state_supervised',
    motion_recent: 'binary_sensor.q_miguel_motion_recent',
    occupancy: 'binary_sensor.q_miguel_occupancy',
    presence: 'binary_sensor.sensor_4_in_1_q_miguel_presence',
    illuminance: 'sensor.sensor_4_in_1_q_miguel_illuminance',
    temperature: ['sensor.sensor_4_in_1_q_miguel_temperature', 'sensor.temperatura_quarto_miguel', 'sensor.qmi_temperatura'],
    humidity: ['sensor.sensor_4_in_1_q_miguel_humidity', 'sensor.umidade_quarto_miguel', 'sensor.qmi_umidade'],
    room_group: 'light.grupo_luzes_quarto_miguel',
    camera_main: 'camera.qmi_camera_2',
    camera_secondary: '',
    active_camera_select: '',
    tv: '',
    tv_remote_player: '',
    tv_remote: '',
    spotify: '',
    speaker: '',
    climate: 'climate.ac_quarto_miguel',
    router: '',
    zigbee_hub: '',
    ps5: '',
    ps5_image: '',
    lights: [
      { entity: 'light.quarto_miguel_switch_2', name: 'Luz principal', icon_type: 'ledstrip', zone: 'sala' },
      { entity: 'light.quarto_miguel_2_switch_1', name: 'Luzes armario', icon_type: 'light_flush', zone: 'sala' },
      { entity: 'light.quarto_miguel_2_switch_2', name: 'Arandela poltrona', icon_type: 'pendant', zone: 'sala' },
      { entity: 'light.quarto_miguel_2_switch_3', name: 'Arandela berco', icon_type: 'pendant', zone: 'sala' },
      { entity: 'light.quarto_miguel_switch_1', name: 'Luz prateleiras', icon_type: 'ledstrip', zone: 'sala' },
      { entity: 'light.quarto_miguel_switch_3', name: 'Luz cortineiro', icon_type: 'ledstrip', zone: 'sala' },
      { entity: 'light.suite_miguel_switch_1', name: 'Luz suite', icon_type: 'ledstrip', zone: 'varanda' },
      { entity: 'light.suite_miguel_switch_2', name: 'Luz azul suite', icon_type: 'light_flush', zone: 'varanda' },
    ],
    cameras: [
      {
        entity: 'camera.qmi_camera_2',
        name: 'Quarto Miguel',
        short_name: 'Miguel',
        controls: [],
      },
    ],
  },
};

const BRUNO_QUARTO_MIGUEL_SUBVIEW_CLIMATE_ON_STATES = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const BRUNO_QUARTO_MIGUEL_SUBVIEW_CLIMATE_ACTIVE_ACTIONS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const BRUNO_QUARTO_MIGUEL_SUBVIEW_CLIMATE_INACTIVE_ACTIONS = ['off', 'idle'];
const BRUNO_QUARTO_MIGUEL_SUBVIEW_TV_ON_STATES = ['on', 'playing', 'paused', 'idle'];
const BRUNO_QUARTO_MIGUEL_SUBVIEW_MEDIA_ON_STATES = ['playing', 'paused', 'on', 'idle'];
const BRUNO_QUARTO_MIGUEL_SUBVIEW_CAMERA_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];
const BRUNO_QUARTO_MIGUEL_SUBVIEW_UNAVAILABLE_STATES = ['unavailable', 'unknown', '', 'none', 'null'];
const BRUNO_QUARTO_MIGUEL_SUBVIEW_TV_ICON_ANIMATION_MS = 1000;

class BrunoQuartoMiguelSubview extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    this._config = this._normalizeConfig({});
    this._hass = null;
    this._refreshSeed = Date.now();
    this._lastCameraImages = {};
    this._loadedCameraUrls = {};
    this._cameraBaseUrls = {};
    this._liveCameraEls = new Map();
    this._lastMinute = '';
    this._lastActionAt = {};
    this._spotifyToolsOpen = false;
    this._mediaMenuOpen = false;
    this._selectedLightZone = 'sala';
    this._selectedMediaSource = '';
    this._lastMediaTvOn = undefined;
    this._mediaTvAnimationUntil = 0;
    this._mediaTvAnimationState = undefined;
    this._curtainMotion = null;
    this._curtainMotionTimer = null;
    this._selectedClimatePanel = '';
    this._activeCameraEntity = '';
    this._cameraControlsOpen = false;
    this._expandedZone = null;
    this._boundActionHandler = (event) => this._handleAction(event);
    this._boundInputHandler = (event) => this._handleInput(event);
    this._boundLiveInputHandler = (event) => this._handleLiveInput(event);
  }

  setConfig(config) {
    this._config = this._normalizeConfig(config || {});
    this._safeRender();
    this._startRefreshTimer();
  }

  set hass(hass) {
    this._hass = hass;
    this._syncLiveCameraHass();
    this._safeRender();
    this._startRefreshTimer();
  }

  connectedCallback() {
    globalThis.BrunoLiquidGlass?.apply?.();
    this._startRefreshTimer();
    this._startClockTimer();
  }

  disconnectedCallback() {
    this.shadowRoot?.removeEventListener('input', this._boundLiveInputHandler);
    this.shadowRoot?.removeEventListener('change', this._boundInputHandler);
    this.shadowRoot?.removeEventListener('click', this._boundActionHandler);
    this._stopRefreshTimer();
    this._stopClockTimer();
    this._stopCurtainMotionTimer();
    this._liveCameraEls?.clear();
  }

  getCardSize() {
    return 12;
  }

  _normalizeConfig(config) {
    const entities = {
      ...BRUNO_QUARTO_MIGUEL_SUBVIEW_DEFAULT_CONFIG.entities,
      ...(config.entities || {}),
    };

    if (Array.isArray(config.entities?.lights)) entities.lights = config.entities.lights;
    if (Array.isArray(config.entities?.cameras)) entities.cameras = config.entities.cameras;

    return {
      ...BRUNO_QUARTO_MIGUEL_SUBVIEW_DEFAULT_CONFIG,
      ...config,
      refresh_interval: Math.max(4000, Number(config.refresh_interval) || BRUNO_QUARTO_MIGUEL_SUBVIEW_DEFAULT_CONFIG.refresh_interval),
      room_nav: Array.isArray(config.room_nav) ? config.room_nav : BRUNO_QUARTO_MIGUEL_SUBVIEW_DEFAULT_CONFIG.room_nav,
      tv_apps: Array.isArray(config.tv_apps) ? config.tv_apps : BRUNO_QUARTO_MIGUEL_SUBVIEW_DEFAULT_CONFIG.tv_apps,
      entities,
    };
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
      <style>
        :host { display:block; height:100%; }
        .error {
          min-height: 240px;
          padding: 18px;
          color: #ffd9df;
          border-radius: 18px;
          border: 1px solid rgba(255,100,120,0.28);
          background: rgba(80,20,28,0.38);
          font: 600 13px/1.45 var(--primary-font-family, inherit);
        }
      </style>
      <div class="error">Erro na subview Q. Miguel: ${BrunoQuartoMiguelSubview._escape(error?.message || error)}</div>
    `;
  }

  _startClockTimer() {
    if (this._clockTimer) return;
    this._clockTimer = globalThis.setInterval(() => {
      const minute = this._clock();
      if (minute === this._lastMinute) return;
      this._lastMinute = minute;
      this.shadowRoot?.querySelectorAll('[data-clock]').forEach((node) => {
        node.textContent = minute;
      });
    }, 15000);
  }

  _stopClockTimer() {
    if (!this._clockTimer) return;
    globalThis.clearInterval(this._clockTimer);
    this._clockTimer = null;
  }

  _startRefreshTimer() {
    if (this._refreshTimer || !this._config || !this.isConnected) return;
    this._refreshTimer = globalThis.setInterval(() => this._refreshCameraImages(), this._config.refresh_interval);
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

      const nextSrc = BrunoQuartoMiguelSubview._withCacheBust(baseSrc, stamp);
      const loader = new globalThis.Image();
      loader.onload = () => {
        const entityId = image.dataset.cameraEntity;
        if (entityId) this._loadedCameraUrls[entityId] = nextSrc;
        image.src = nextSrc;
        image.classList.remove('is-hidden');
      };
      loader.src = nextSrc;
    });
  }

  _state(entityId) {
    if (Array.isArray(entityId)) {
      const states = entityId
        .filter(Boolean)
        .map((id) => this._hass?.states?.[id])
        .filter(Boolean);
      return states.find((entity) => !this._isUnavailable(entity)) || states[0];
    }
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isUnavailable(entity) {
    return !entity || BRUNO_QUARTO_MIGUEL_SUBVIEW_UNAVAILABLE_STATES.includes(String(entity.state || '').toLowerCase());
  }

  _toCurtainPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  _curtainOpenPositionFromState(entity, percentEntity, state) {
    const percentControl = this._isUnavailable(percentEntity) ? null : this._toCurtainPercent(percentEntity?.state);
    if (percentControl != null) return 100 - percentControl;

    const coverPosition = this._toCurtainPercent(entity?.attributes?.current_position);
    if (coverPosition != null) {
      if (state === 'open' && coverPosition <= 1) return 100;
      if (state === 'closed' && coverPosition >= 99) return 0;
      return coverPosition;
    }

    if (state === 'open') return 100;
    if (state === 'closed') return 0;

    return 0;
  }

  _interpolateCurtainPercent(value, fromKey, toKey) {
    const percent = this._toCurtainPercent(value) ?? 0;
    const points = BRUNO_QUARTO_MIGUEL_CURTAIN_CALIBRATION;

    if (percent <= points[0][fromKey]) return points[0][toKey];
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const next = points[index];
      if (percent <= next[fromKey]) {
        const span = next[fromKey] - previous[fromKey];
        if (span === 0) return next[toKey];
        const ratio = (percent - previous[fromKey]) / span;
        return this._toCurtainPercent(previous[toKey] + ((next[toKey] - previous[toKey]) * ratio)) ?? next[toKey];
      }
    }

    return points[points.length - 1][toKey];
  }

  _curtainDisplayOpenPosition(openPosition) {
    return this._interpolateCurtainPercent(openPosition, 'position', 'visual');
  }

  _curtainCommandOpenPosition(displayPosition) {
    return this._interpolateCurtainPercent(displayPosition, 'visual', 'position');
  }

  _curtainClosedVisualPosition(openPosition) {
    return 100 - this._curtainDisplayOpenPosition(openPosition);
  }

  _curtainMotionDuration(startClosed, targetClosed) {
    const start = this._toCurtainPercent(startClosed) ?? 0;
    const target = this._toCurtainPercent(targetClosed) ?? start;
    const distance = Math.abs(target - start);
    return Math.max(BRUNO_QUARTO_MIGUEL_CURTAIN_MIN_MOTION_MS, BRUNO_QUARTO_MIGUEL_CURTAIN_TRAVEL_MS * (distance / 100));
  }

  _curtainMotionClosedPosition(motion = this._curtainMotion, now = Date.now()) {
    if (!motion) return null;
    if (motion.hold) return this._toCurtainPercent(motion.closed);

    const duration = Math.max(1, Number(motion.duration) || BRUNO_QUARTO_MIGUEL_CURTAIN_MIN_MOTION_MS);
    const elapsed = Math.max(0, now - motion.startedAt);
    const progress = Math.min(1, elapsed / duration);
    const value = motion.startClosed + ((motion.targetClosed - motion.startClosed) * progress);
    return this._toCurtainPercent(value);
  }

  _curtainMotionDisplayPosition(entityId, state, reportedClosed) {
    const motion = this._curtainMotion;
    if (!motion || motion.entityId !== entityId) return null;

    const now = Date.now();
    if (motion.hold) return this._toCurtainPercent(motion.closed);

    const estimatedClosed = this._curtainMotionClosedPosition(motion, now);
    const reported = this._toCurtainPercent(reportedClosed);
    const elapsed = now - motion.startedAt;
    const progress = Math.min(1, Math.max(0, elapsed / Math.max(1, motion.duration)));
    const moving = state === 'opening' || state === 'closing';
    const reportedAtTarget = reported != null && Math.abs(reported - motion.targetClosed) <= BRUNO_QUARTO_MIGUEL_CURTAIN_TARGET_TOLERANCE;

    if (moving && reported != null && !reportedAtTarget) {
      motion.lastClosed = reported;
      return reported;
    }

    if (progress >= 1) {
      this._curtainMotion = null;
      this._stopCurtainMotionTimer();
      return motion.targetClosed;
    }

    return estimatedClosed;
  }

  _startCurtainMotionTimer() {
    if (this._curtainMotionTimer || !this.isConnected) return;
    this._curtainMotionTimer = globalThis.setInterval(() => {
      if (!this._curtainMotion || this._curtainMotion.hold) {
        this._stopCurtainMotionTimer();
        return;
      }
      this._safeRender();
    }, BRUNO_QUARTO_MIGUEL_CURTAIN_MOTION_TICK_MS);
  }

  _stopCurtainMotionTimer() {
    if (!this._curtainMotionTimer) return;
    globalThis.clearInterval(this._curtainMotionTimer);
    this._curtainMotionTimer = null;
  }

  _beginCurtainMotion(targetClosed, direction = 'position') {
    const entityId = this._config.entities.curtain;
    if (!entityId) return;

    const activeClosed = this._curtainMotionClosedPosition();
    const modelClosed = this._curtainModel({ ignoreMotion: true }).visualPosition;
    const startClosed = this._toCurtainPercent(activeClosed ?? modelClosed) ?? 0;
    const target = this._toCurtainPercent(targetClosed);
    if (target == null) return;

    this._curtainMotion = {
      entityId,
      direction,
      startClosed,
      targetClosed: target,
      startedAt: Date.now(),
      duration: this._curtainMotionDuration(startClosed, target),
      hold: false,
    };
    this._startCurtainMotionTimer();
    this._safeRender();
  }

  _holdCurtainMotion() {
    const entityId = this._config.entities.curtain;
    if (!entityId) return;

    const activeClosed = this._curtainMotionClosedPosition();
    const modelClosed = this._curtainModel({ ignoreMotion: true }).visualPosition;
    const closed = this._toCurtainPercent(activeClosed ?? modelClosed) ?? 0;
    this._curtainMotion = {
      entityId,
      closed,
      updatedAt: Date.now(),
      hold: true,
    };
    this._stopCurtainMotionTimer();
    this._safeRender();
  }

  _safeState(entityId, fallback = '--') {
    const entity = this._state(entityId);
    if (this._isUnavailable(entity)) return fallback;
    return entity.state;
  }

  _numberState(entityId, fallback = null) {
    const value = Number.parseFloat(this._state(entityId)?.state);
    return Number.isFinite(value) ? value : fallback;
  }

  _clock() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  _dateLine() {
    const days = [
      'DOMINGO',
      'SEGUNDA-FEIRA',
      'TER\u00c7A-FEIRA',
      'QUARTA-FEIRA',
      'QUINTA-FEIRA',
      'SEXTA-FEIRA',
      'S\u00c1BADO',
    ];
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  }

  _greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }

  _formatNumber(value, digits = 0) {
    if (!Number.isFinite(Number(value))) return '--';
    return Number(value).toFixed(digits).replace(/\.0+$/, '');
  }

  _formatMediaTime(seconds) {
    const safe = Math.max(0, Math.floor(Number(seconds) || 0));
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const secs = safe % 60;
    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
  }

  _temperatureLabel() {
    const value = this._numberState(this._config.entities.temperature, null);
    return value == null ? '--' : `${this._formatNumber(value, 1)}\u00b0`;
  }

  _humidityLabel() {
    const value = this._numberState(this._config.entities.humidity, null);
    return value == null ? '--' : `${this._formatNumber(value, 0)}%`;
  }

  _curtainPosition() {
    const value = this._curtainModel().position;
    return this._toCurtainPercent(value) ?? 0;
  }

  _curtainModel(options = {}) {
    const entityId = this._config.entities.curtain;
    const entity = this._state(entityId);
    const percentEntityId = this._config.entities.curtain_percent_control;
    const percentEntity = this._state(percentEntityId);
    const configured = Boolean(entityId);
    const unavailable = configured && Boolean(this._hass) && this._isUnavailable(entity);
    const state = String(entity?.state || (configured ? 'unknown' : 'unavailable')).toLowerCase();
    const safePosition = this._curtainOpenPositionFromState(entity, percentEntity, state);
    const openDisplayPosition = this._curtainDisplayOpenPosition(safePosition);
    let displayPosition = 100 - openDisplayPosition;
    let visualPosition = displayPosition;
    const motionPosition = options.ignoreMotion ? null : this._curtainMotionDisplayPosition(entityId, state, displayPosition);
    if (motionPosition != null) {
      displayPosition = motionPosition;
      visualPosition = motionPosition;
    }
    const localMoving = Boolean(this._curtainMotion && this._curtainMotion.entityId === entityId && !this._curtainMotion.hold);
    let status = 'Fechada';
    if (!configured || unavailable) status = 'Indisponivel';
    else if (state === 'opening' || (localMoving && this._curtainMotion?.targetClosed < this._curtainMotion?.startClosed)) status = 'Abrindo';
    else if (state === 'closing' || (localMoving && this._curtainMotion?.targetClosed > this._curtainMotion?.startClosed)) status = 'Fechando';

    return {
      entity,
      entityId,
      state,
      configured,
      available: configured && !unavailable,
      moving: state === 'opening' || state === 'closing' || localMoving,
      position: safePosition,
      openDisplayPosition,
      displayPosition,
      visualPosition,
      status,
    };
  }

  _activeLightsCount() {
    const active = this._state(this._config.entities.active_sensor)?.attributes;
    if (active?.lights_on_count != null && active.lights_on_count !== '') {
      const count = Number(active.lights_on_count);
      if (Number.isFinite(count)) return count;
    }

    return (this._config.entities.lights || [])
      .map((item) => item.entity)
      .filter(Boolean)
      .filter((entityId) => this._state(entityId)?.state === 'on').length;
  }

  _activeLightsInZone(zone) {
    return (this._config.entities.lights || [])
      .filter((light) => (light.zone || 'sala') === zone)
      .map((light) => light.entity)
      .filter(Boolean)
      .filter((entityId) => this._state(entityId)?.state === 'on').length;
  }

  _activeLightsByZone() {
    return {
      sala: this._activeLightsInZone('sala'),
      varanda: this._activeLightsInZone('varanda'),
    };
  }

  _brightnessPercent(entity) {
    if (entity?.attributes?.brightness != null) {
      const value = Math.round(Number(entity.attributes.brightness) / 2.55);
      if (Number.isFinite(value)) return Math.max(1, Math.min(100, value));
    }
    return entity?.state === 'on' ? 100 : 0;
  }

  _roomBrightness() {
    const lights = (this._config.entities.lights || [])
      .map((light) => this._state(light.entity))
      .filter((entity) => entity?.state === 'on');
    if (!lights.length) return 0;
    const values = lights.map((entity) => this._brightnessPercent(entity)).filter((value) => value > 0);
    if (!values.length) return 100;
    return Math.round(values.reduce((total, value) => total + value, 0) / values.length);
  }

  _networkLabel(entityId) {
    if (!entityId) return 'Online';
    const state = this._safeState(entityId, 'Online');
    return ['on', 'home', 'connected', 'online'].includes(String(state).toLowerCase()) ? 'Online' : state;
  }

  _cameraState(camera) {
    const entity = this._state(camera.entity);
    const state = entity?.state || '';
    const unavailable = this._isUnavailable(entity);
    const online = !unavailable && BRUNO_QUARTO_MIGUEL_SUBVIEW_CAMERA_ONLINE_STATES.includes(state);
    const liveImage = entity?.attributes?.entity_picture || '';
    if (liveImage) this._lastCameraImages[camera.entity] = liveImage;

    const image = liveImage || this._lastCameraImages[camera.entity] || `/api/camera_proxy/${camera.entity}`;
    if (this._cameraBaseUrls[camera.entity] !== image) {
      this._cameraBaseUrls[camera.entity] = image;
      delete this._loadedCameraUrls[camera.entity];
    }

    return {
      ...camera,
      state,
      online,
      image,
      imageUrl: this._loadedCameraUrls[camera.entity] || BrunoQuartoMiguelSubview._withCacheBust(image, this._refreshSeed),
      status: online ? 'Ao vivo' : (unavailable ? 'Indisponivel' : 'Online'),
    };
  }

  _camerasModel() {
    const cameras = (this._config.entities.cameras || []).map((camera) => this._cameraState(camera));
    const activeId = this._state(this._config.entities.active_camera_select)?.state;
    const localActiveId = cameras.some((camera) => camera.entity === this._activeCameraEntity) ? this._activeCameraEntity : '';
    const activeCamera = cameras.find((camera) => camera.entity === (localActiveId || activeId)) || cameras[0];
    return {
      cameras,
      activeCamera,
      onlineCount: cameras.filter((camera) => camera.online).length,
    };
  }

  _tvModel() {
    const entity = this._state(this._config.entities.tv);
    const attrs = entity?.attributes || {};
    const state = entity?.state || 'off';
    const active = BRUNO_QUARTO_MIGUEL_SUBVIEW_TV_ON_STATES.includes(state);
    return {
      entity,
      state,
      active,
      source: attrs.source || attrs.app_name || 'HDMI 1',
      title: attrs.media_title || attrs.media_series_title || attrs.app_name || (active ? 'TV ligada' : 'TV desligada'),
      subtitle: attrs.media_artist || '',
      poster: attrs.entity_picture || attrs.media_image_url || '',
      volume: attrs.volume_level != null ? Math.round(Number(attrs.volume_level) * 100) : null,
    };
  }

  _normalizeMediaDevice(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  _spotifySourceMatchesRoom(attrs = {}) {
    const expected = this._normalizeMediaDevice(this._config.spotify_device_name);
    if (!expected) return true;
    return [
      attrs.source,
      attrs.source_name,
      attrs.device_name,
      attrs.active_device_name,
      attrs.spotify_device_name,
      attrs.media_player,
      attrs.media_player_name,
    ].some((value) => {
      const normalized = this._normalizeMediaDevice(value);
      return normalized && (
        normalized === expected
        || normalized.includes(expected)
        || (normalized.length >= 10 && expected.includes(normalized))
      );
    });
  }

  _spotifySpeakerMatchesRoom(spotifyAttrs = {}) {
    const speaker = this._state(this._config.entities.speaker);
    const speakerState = String(speaker?.state || '').toLowerCase();
    if (!['playing', 'paused'].includes(speakerState)) return false;
    const attrs = speaker.attributes || {};
    const speakerApp = this._normalizeMediaDevice([
      attrs.app_name,
      attrs.source,
      attrs.media_content_type,
      attrs.media_channel,
    ].join(' '));
    if (speakerApp.includes('spotify')) return true;
    const speakerTitle = this._normalizeMediaDevice(attrs.media_title);
    const spotifyTitle = this._normalizeMediaDevice(spotifyAttrs.media_title);
    if (speakerTitle && spotifyTitle && speakerTitle === spotifyTitle) return true;
    const speakerArtist = this._normalizeMediaDevice(attrs.media_artist);
    const spotifyArtist = this._normalizeMediaDevice(spotifyAttrs.media_artist);
    return Boolean(speakerTitle && spotifyTitle && speakerTitle.includes(spotifyTitle) && speakerArtist && spotifyArtist && speakerArtist === spotifyArtist);
  }

  _spotifyModel() {
    const entity = this._state(this._config.entities.spotify);
    const attrs = entity?.attributes || {};
    const state = entity?.state || 'off';
    const globalActive = BRUNO_QUARTO_MIGUEL_SUBVIEW_MEDIA_ON_STATES.includes(state);
    const active = globalActive && (this._spotifySourceMatchesRoom(attrs) || this._spotifySpeakerMatchesRoom(attrs));
    const roomSource = this._config.spotify_device_name || attrs.source || 'Echo Show';
    const rawTitle = attrs.media_title || 'SpotifyPlus';
    const title = /^SpotifyPlus\s+Bruno/i.test(rawTitle) ? 'SpotifyPlus' : rawTitle;
    return {
      entity,
      state: active ? state : 'off',
      globalState: state,
      globalActive,
      active,
      playing: active && state === 'playing',
      title: active ? title : 'SpotifyPlus',
      subtitle: active ? (attrs.media_artist || attrs.media_album_name || '') : '',
      artwork: active ? (attrs.entity_picture || attrs.media_image_url || '') : '',
      source: active ? (attrs.source || roomSource) : roomSource,
      volume: attrs.volume_level != null ? Math.round(Number(attrs.volume_level) * 100) : null,
    };
  }

  _ps5Model() {
    const entityId = this._config.entities.ps5;
    const entity = this._state(entityId);
    const configured = Boolean(entityId);
    const state = entity?.state || (configured ? 'unknown' : 'placeholder');
    const active = state === 'on';
    return {
      entityId,
      configured,
      state,
      active,
      title: configured ? (active ? 'Console ligado' : 'Console desligado') : 'Entidade a confirmar',
      chip: configured ? (active ? 'Ligado' : 'Desligado') : 'Placeholder',
      image: this._config.entities.ps5_image || '/local/images/ps5.png?v=20260702-all-images-1',
    };
  }

  _mediaSourceFromAction(action) {
    if (action === 'toggle-tv' || action === 'tv-play-pause' || action === 'tv-remote' || action === 'tv-app') return 'tv';
    if (String(action || '').startsWith('spotify-')) return 'spotify';
    return '';
  }

  // ANTERIOR (rollback) — prioridade antiga (Spotify > TV > PS5) sem "retomada
  // por nova ativação". Substituída pela lógica de acordeão (2026-06-28).
  // _selectedMedia(model) {
  //   const valid = ['tv', 'spotify', 'ps5'];
  //   if (valid.includes(this._selectedMediaSource)) return this._selectedMediaSource;
  //   if (model.spotify?.active) return 'spotify';
  //   if (model.tv?.active) return 'tv';
  //   if (model.ps5?.active) return 'ps5';
  //   return 'tv';
  // }
  // NOVO (2026-06-28): acordeão — ordem fixa TV → Spotify → PS5.
  // - Seleção manual (clique no cabeçalho) persiste em this._selectedMediaSource.
  // - Quando uma fonte SE TORNA ativa (nova ativação real), reseta a seleção
  //   manual para retomar a prioridade automática.
  // - Sem seleção válida: primeira fonte ativa pela ordem; nenhuma ativa → 'tv'.
  _selectedMedia(model) {
    const order = ['tv', 'spotify'];
    const activeKeys = order.filter((k) => model[k]?.active);
    const prev = this._lastActiveMediaKeys || [];
    const gainedActivation = activeKeys.some((k) => !prev.includes(k));
    this._lastActiveMediaKeys = activeKeys;
    if (gainedActivation) this._selectedMediaSource = '';
    if (order.includes(this._selectedMediaSource)) return this._selectedMediaSource;
    return activeKeys[0] || 'tv';
  }

  _mediaStateLabel(state, fallback = 'Desligada') {
    const labels = {
      off: 'Desligada',
      on: 'Ligada',
      playing: 'Tocando',
      paused: 'Pausado',
      idle: 'Em espera',
      unavailable: 'Indisponivel',
      unknown: 'Indisponivel',
      placeholder: 'Placeholder',
    };
    return labels[String(state || '').toLowerCase()] || fallback || state || '--';
  }

  _climateAction(entity) {
    return String(entity?.attributes?.hvac_action || '').toLowerCase();
  }

  _climateIsActive(entity) {
    if (this._isUnavailable(entity) || entity.state === 'off') return false;
    const hvacAction = this._climateAction(entity);
    if (BRUNO_QUARTO_MIGUEL_SUBVIEW_CLIMATE_ACTIVE_ACTIONS.includes(hvacAction)) return true;
    if (BRUNO_QUARTO_MIGUEL_SUBVIEW_CLIMATE_INACTIVE_ACTIONS.includes(hvacAction)) return false;
    return BRUNO_QUARTO_MIGUEL_SUBVIEW_CLIMATE_ON_STATES.includes(entity.state || '');
  }

  _climateModel() {
    const entity = this._state(this._config.entities.climate);
    const attrs = entity?.attributes || {};
    const target = Number(attrs.temperature);
    const current = Number(attrs.current_temperature);
    const minTemp = Number(attrs.min_temp);
    const maxTemp = Number(attrs.max_temp);
    const targetStep = Number(attrs.target_temp_step);
    const hvacAction = this._climateAction(entity);
    const active = this._climateIsActive(entity);
    return {
      entity,
      active,
      target: Number.isFinite(target) ? target : null,
      current: Number.isFinite(current) ? current : null,
      minTemp: Number.isFinite(minTemp) ? minTemp : 16,
      maxTemp: Number.isFinite(maxTemp) ? maxTemp : 30,
      targetStep: Number.isFinite(targetStep) && targetStep > 0 ? targetStep : 1,
      hvacMode: entity?.state || 'off',
      fan: attrs.fan_mode || 'auto',
      swing: attrs.swing_mode || '',
      hvacModes: Array.isArray(attrs.hvac_modes) ? attrs.hvac_modes : [],
      fanModes: Array.isArray(attrs.fan_modes) ? attrs.fan_modes : [],
      swingModes: Array.isArray(attrs.swing_modes) ? attrs.swing_modes : [],
      action: hvacAction === 'idle' ? 'em espera' : (active ? (hvacAction || 'ligado') : 'off'),
    };
  }

  _climateOption(options, candidates, fallback = '') {
    const available = Array.isArray(options) ? options.filter(Boolean) : [];
    if (!available.length) return fallback;
    const wanted = candidates.map((item) => String(item || '').toLowerCase());
    return available.find((option) => wanted.includes(String(option || '').toLowerCase())) || '';
  }

  _setClimateTarget(temperature) {
    const model = this._climateModel();
    const value = Number(temperature);
    if (!Number.isFinite(value)) return;
    const min = Number.isFinite(model.minTemp) ? model.minTemp : 16;
    const max = Number.isFinite(model.maxTemp) ? model.maxTemp : 30;
    this._callService('climate.set_temperature', {
      entity_id: this._config.entities.climate,
      temperature: Math.max(min, Math.min(max, value)),
    });
  }

  _setCurtainPosition(position) {
    if (!this._config.entities.curtain) return;
    const value = this._toCurtainPercent(position);
    if (value == null) return;
    this._callService('cover.set_cover_position', {
      entity_id: this._config.entities.curtain,
      position: value,
    });
  }

  _climateModeLabel(mode) {
    const labels = {
      off: 'Off',
      cool: 'Frio',
      heat: 'Heat',
      fan_only: 'Fan',
      dry: 'Dry',
      heat_cool: 'Auto',
      auto: 'Auto',
    };
    return labels[mode] || mode || '--';
  }

  _climateSummary(climate, target) {
    if (!climate.active) return `Off - ${target}\u00b0C`;
    const action = climate.hvacMode === 'heat' ? 'Heat' : this._climateModeLabel(climate.hvacMode);
    return `${action} - ${target}\u00b0C`;
  }

  _sceneContextLabel(model) {
    const active = this._state(this._config.entities.active_sensor);
    const attrs = active?.attributes || {};
    const configuredLabel = attrs.scene || attrs.active_scene || attrs.mode || attrs.display || attrs.context || attrs.label;
    if (configuredLabel && !Array.isArray(configuredLabel)) return String(configuredLabel);
    if (model.spotify?.active) return model.spotify.playing ? 'Spotify tocando' : 'Spotify ativo';
    if (model.tv?.active) return 'TV ligada';
    if (model.ps5?.active) return 'PS5 ligado';
    if (model.climate?.active) return `Clima ${this._climateModeLabel(model.climate.hvacMode)}`;
    if (model.lights > 0) return 'Sala iluminada';
    return active?.state === 'yes' ? 'Sala ativa' : 'Sala em repouso';
  }

  _fireDomEvent(action) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: action,
      bubbles: true,
      composed: true,
    }));
  }

  _openTvRemotePopup() {
    const remoteCard = this._config.tv_remote_card || this._universalTvRemoteCard();

    this._fireDomEvent({
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Smart TV Remote',
          tag: 'tv_remote',
          style: '--popup-background-color: rgba(21,25,35,0.92); --popup-min-width: min(380px, 95vw); --popup-max-width: min(430px, 95vw); --popup-border-width: 0;',
          content: remoteCard,
        },
      },
    });
  }

  _universalTvRemoteCard() {
    return {
      type: 'custom:universal-remote-card',
      remote_id: this._config.entities.tv_remote,
      media_player_id: this._config.entities.tv,
      rows: [
        ['power', 'input', 'menu'],
        ['navigation'],
        ['back', 'home', 'mute'],
        ['volume_down', 'volume_up', 'channel_down', 'channel_up'],
      ],
      custom_actions: [
        this._universalRemoteButton('power', 'mdi:power', 'button.tv_sala_power'),
        this._universalRemoteButton('input', 'mdi:import', 'button.tv_sala_input'),
        this._universalRemoteButton('menu', 'mdi:menu', 'button.tv_sala_menu'),
        {
          type: 'circlepad',
          name: 'navigation',
          icon: 'mdi:checkbox-blank-circle',
          tap_action: this._buttonPressAction('button.tv_sala_ok'),
          up: { icon: 'mdi:chevron-up', tap_action: this._buttonPressAction('button.tv_sala_navigate_up'), hold_action: { action: 'repeat' } },
          down: { icon: 'mdi:chevron-down', tap_action: this._buttonPressAction('button.tv_sala_navigate_down'), hold_action: { action: 'repeat' } },
          left: { icon: 'mdi:chevron-left', tap_action: this._buttonPressAction('button.tv_sala_navigate_left'), hold_action: { action: 'repeat' } },
          right: { icon: 'mdi:chevron-right', tap_action: this._buttonPressAction('button.tv_sala_navigate_right'), hold_action: { action: 'repeat' } },
          styles: `
            :host {
              width: min(210px, 72vw);
              margin: 4px auto;
              --size: 48px;
              --center-button-relative-size: 42%;
            }
            .circlepad {
              border: 1px solid rgba(255,255,255,0.12);
              background: radial-gradient(circle at top left, rgba(255,255,255,0.16), rgba(255,255,255,0.045) 58%, rgba(255,255,255,0.025));
              box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 12px 24px rgba(0,0,0,0.24);
            }
          `,
        },
        this._universalRemoteButton('back', 'mdi:keyboard-backspace', 'button.tv_sala_back'),
        this._universalRemoteButton('home', 'mdi:home', 'button.tv_sala_homepage'),
        this._universalRemoteButton('mute', 'mdi:volume-mute', 'button.tv_sala_mute'),
        this._universalRemoteButton('volume_down', 'mdi:volume-minus', 'button.tv_sala_volume_down'),
        this._universalRemoteButton('volume_up', 'mdi:volume-plus', 'button.tv_sala_volume_up'),
        this._universalRemoteButton('channel_down', 'mdi:chevron-down', 'button.tv_sala_channel_down'),
        this._universalRemoteButton('channel_up', 'mdi:chevron-up', 'button.tv_sala_channel_up'),
      ],
      card_mod: {
        style: `
          ha-card {
            background: transparent !important;
            border: 0 !important;
            box-shadow: none !important;
          }
        `,
      },
    };
  }

  _universalRemoteButton(name, icon, entityId) {
    return {
      type: 'button',
      name,
      icon,
      tap_action: this._buttonPressAction(entityId),
    };
  }

  _buttonPressAction(entityId) {
    return {
      action: 'perform-action',
      perform_action: 'button.press',
      target: { entity_id: entityId },
    };
  }

  _remoteGrid(items, columns = 3) {
    return {
      type: 'grid',
      columns,
      square: false,
      cards: items.map((item) => {
        if (!item) return { type: 'custom:button-card', color_type: 'blank-card' };
        return {
          type: 'custom:button-card',
          icon: item[0],
          tap_action: {
            action: 'call-service',
            service: 'button.press',
            service_data: { entity_id: item[1] },
          },
          template: item[0]?.includes('arrow') || item[0] === 'mdi:radiobox-marked'
            ? 'remote_icon_arrow'
            : 'remote_icon_only',
        };
      }),
    };
  }

  _openSpotifyPlusPopup(mode = 'full') {
    const sectionSets = {
      devices: ['devices'],
      presets: ['userpresets'],
      library: ['userpresets'],
      favorites: ['playlistfavorites'],
      queue: ['player'],
      full: ['player', 'devices', 'userpresets', 'playlistfavorites', 'searchmedia'],
    };
    const sectionDefaults = {
      devices: 'devices',
      presets: 'userpresets',
      library: 'userpresets',
      favorites: 'playlistfavorites',
      queue: 'player',
      full: 'player',
    };
    const sections = sectionSets[mode] || sectionSets.full;
    const sectionDefault = sectionDefaults[mode] || sectionDefaults.full;

    this._fireDomEvent({
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Spotify',
          tag: `spotify_quarto_miguel_${mode}`,
          style: '--popup-max-width: min(560px, 92vw); --popup-border-width: 0;',
          content: {
            type: 'custom:spotifyplus-card',
            entity: this._config.entities.spotify,
            deviceDefaultId: this._config.spotify_device_name,
            deviceControlByName: true,
            playerBackgroundImageSize: 'cover',
            sections,
            sectionDefault,
          },
        },
      },
    });
  }

  _callService(serviceName, data = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;
    this._hass.callService(domain, service, data);
  }

  _playSpotify() {
    const entityId = this._config.entities.spotify;
    if (!entityId) return;

    const spotify = this._spotifyModel();
    const preferredSource = this._config.spotify_device_name || spotify.source;
    if (preferredSource) {
      this._callService('media_player.select_source', {
        entity_id: entityId,
        source: preferredSource,
      });
    }

    globalThis.setTimeout?.(() => {
      this._callService('media_player.media_play', { entity_id: entityId });
    }, preferredSource ? 260 : 0);
  }

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

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _cooldown(key, duration = 900) {
    const now = Date.now();
    const previous = this._lastActionAt[key] || 0;
    if (now - previous < duration) return true;
    this._lastActionAt[key] = now;
    return false;
  }

  _handleAction(event) {
    const target = event.target.closest?.('[data-action]');
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.action;
    const entityId = target.dataset.entity;

    if (action === 'select-light-zone') {
      this._selectedLightZone = target.dataset.zone === 'varanda' ? 'varanda' : 'sala';
      this._safeRender();
      return;
    }
    // NOVO (Passada 2): acordeão SINGLE-OPEN — só uma zona aberta por vez.
    // Expandir uma colapsa a outra; clicar na aberta colapsa.
    if (action === 'toggle-zone') {
      const zk = target.dataset.zone;
      this._expandedZone = this._expandedZone === zk ? null : zk;
      this._safeRender();
      return;
    }
    // NOVO (Passada 2): apagar todas as luzes (reais) de uma zona.
    if (action === 'zone-off') {
      const ids = (this._config.entities.lights || [])
        .filter((l) => (l.zone || 'sala') === target.dataset.zone && l.entity && !l.placeholder)
        .map((l) => l.entity);
      if (ids.length) this._callService('light.turn_off', { entity_id: ids });
      return;
    }
    if (action === 'select-media-source') {
      const source = target.dataset.source;
      if (['tv', 'spotify'].includes(source)) {
        this._selectedMediaSource = source;
        this._mediaTransitionSource = source;
        this._mediaMenuOpen = false;
      }
      this._safeRender();
      this._mediaTransitionSource = '';
      return;
    }
    if (action === 'media-menu') {
      this._mediaMenuOpen = !this._mediaMenuOpen;
      this._safeRender();
      return;
    }

    const interactedMedia = this._mediaSourceFromAction(action);
    if (interactedMedia) this._selectedMediaSource = interactedMedia;

    if (action === 'navigate') this._navigate(target.dataset.path || this._config.navigation_path);
    if (action === 'more-info') {
      this._mediaMenuOpen = false;
      this._selectedClimatePanel = '';
      this._moreInfo(entityId);
      return;
    }
    if (action === 'toggle-climate-panel') {
      const panel = target.dataset.panel;
      this._selectedClimatePanel = this._selectedClimatePanel === panel ? '' : panel;
      this._safeRender();
      return;
    }
    if (action === 'cover-open') {
      this._beginCurtainMotion(0, 'opening');
      this._callService('cover.open_cover', { entity_id: this._config.entities.curtain });
    }
    if (action === 'cover-close') {
      this._beginCurtainMotion(100, 'closing');
      this._callService('cover.close_cover', { entity_id: this._config.entities.curtain });
    }
    if (action === 'cover-stop') {
      this._holdCurtainMotion();
      this._callService('cover.stop_cover', { entity_id: this._config.entities.curtain });
    }
    if (action === 'cover-position') {
      const position = Number(target.dataset.position);
      const closed = Number(target.dataset.closed);
      if (Number.isFinite(position)) {
        if (Number.isFinite(closed)) this._beginCurtainMotion(closed, 'position');
        this._setCurtainPosition(position);
      }
    }
    if (action === 'lights-on') this._callService('light.turn_on', { entity_id: this._config.entities.room_group });
    if (action === 'lights-off') this._callService('light.turn_off', { entity_id: this._config.entities.room_group });
    if (action === 'toggle-light') this._callService('homeassistant.toggle', { entity_id: entityId });
    if (action === 'toggle-camera-control') {
      if (entityId && !this._cooldown(`camera-control-${entityId}`, 600)) {
        this._callService('homeassistant.toggle', { entity_id: entityId });
      }
      return;
    }
    if (action === 'toggle-camera-controls') {
      this._cameraControlsOpen = !this._cameraControlsOpen;
      this._safeRender();
      return;
    }
    if (action === 'select-camera') {
      if (entityId) {
        this._activeCameraEntity = entityId;
        this._safeRender();
      }
      if (this._config.entities.active_camera_select && entityId) {
        this._callService('input_select.select_option', {
          entity_id: this._config.entities.active_camera_select,
          option: entityId,
        });
      }
      return;
    }
    if (action === 'toggle-tv' && !this._cooldown('tv')) this._callService('homeassistant.toggle', { entity_id: this._config.entities.tv });
    if (action === 'tv-play-pause') this._callService('media_player.media_play_pause', { entity_id: this._config.entities.tv });
    if (action === 'tv-remote') {
      this._openTvRemotePopup();
      return;
    }
    if (action === 'tv-app') {
      const script = target.dataset.script;
      if (script && !this._cooldown(`tv-app-${script}`, 1200)) {
        this._callService('script.turn_on', { entity_id: script });
      }
      return;
    }
    if (action === 'spotify-more') {
      this._spotifyToolsOpen = !this._spotifyToolsOpen;
      this._safeRender();
      return;
    }
    if (action === 'spotify-devices') {
      this._openSpotifyPlusPopup('devices');
      return;
    }
    if (action === 'spotify-presets') {
      this._openSpotifyPlusPopup('presets');
      return;
    }
    if (action === 'spotify-queue') {
      this._openSpotifyPlusPopup('queue');
      return;
    }
    if (action === 'spotify-favorites') {
      this._openSpotifyPlusPopup('favorites');
      return;
    }
    if (action === 'spotify-library') {
      this._openSpotifyPlusPopup('presets');
      return;
    }
    if (action === 'spotify-plus') {
      this._openSpotifyPlusPopup('full');
      return;
    }
    if (['spotify-prev', 'spotify-next', 'spotify-play-pause', 'spotify-pause'].includes(action) && !this._spotifyModel().active) return;
    if (action === 'spotify-prev') this._callService('media_player.media_previous_track', { entity_id: this._config.entities.spotify });
    if (action === 'spotify-next') this._callService('media_player.media_next_track', { entity_id: this._config.entities.spotify });
    if (action === 'spotify-play-pause') {
      const spotify = this._spotifyModel();
      if (spotify.playing) {
        this._callService('media_player.media_pause', { entity_id: this._config.entities.spotify });
      } else {
        // FALLBACK - antes usava spotifyplus.player_transfer_playback com
        // device_name, mas o servico rejeita essa chave neste ambiente.
        this._playSpotify();
      }
    }
    if (action === 'spotify-play') {
      this._playSpotify();
    }
    if (action === 'spotify-pause') this._callService('media_player.media_pause', { entity_id: this._config.entities.spotify });
    if (action === 'toggle-ps5' && this._config.entities.ps5) this._callService('homeassistant.toggle', { entity_id: this._config.entities.ps5 });
    if (action === 'toggle-climate' && !this._cooldown('climate', 1800)) {
      const model = this._climateModel();
      this._selectedClimatePanel = '';
      this._callService(model.active ? 'climate.turn_off' : 'climate.turn_on', { entity_id: this._config.entities.climate });
    }
    if (action === 'climate-mode') {
      const hvacMode = target.dataset.mode;
      if (hvacMode) {
        this._selectedClimatePanel = '';
        this._callService('climate.set_hvac_mode', {
          entity_id: this._config.entities.climate,
          hvac_mode: hvacMode,
        });
        this._safeRender();
      }
      return;
    }
    if (action === 'fan-mode') {
      const fanMode = target.dataset.mode;
      if (fanMode) {
        this._selectedClimatePanel = '';
        this._callService('climate.set_fan_mode', {
          entity_id: this._config.entities.climate,
          fan_mode: fanMode,
        });
        this._safeRender();
      }
      return;
    }
    if (action === 'swing-mode') {
      const swingMode = target.dataset.mode;
      if (swingMode) {
        this._selectedClimatePanel = '';
        this._callService('climate.set_swing_mode', {
          entity_id: this._config.entities.climate,
          swing_mode: swingMode,
        });
        this._safeRender();
      }
      return;
    }
    if (action === 'temp-down' || action === 'temp-up') {
      const model = this._climateModel();
      const current = Number.isFinite(Number(model.target)) ? Number(model.target) : 22;
      const step = Number.isFinite(Number(model.targetStep)) ? Number(model.targetStep) : 1;
      this._setClimateTarget(action === 'temp-up' ? current + step : current - step);
      return;
    }
  }

  _handleInput(event) {
    const target = event.target;
    if (!target?.matches?.('[data-action]')) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    if (target.dataset.action === 'curtain-target') {
      const closed = this._toCurtainPercent(value);
      const visualOpen = 100 - (this._toCurtainPercent(value) ?? 0);
      if (closed != null) this._beginCurtainMotion(closed, 'position');
      this._setCurtainPosition(this._curtainCommandOpenPosition(visualOpen));
      return;
    }
    if (target.dataset.action === 'spotify-volume') {
      if (!this._spotifyModel().active) return;
      this._callService('media_player.volume_set', {
        entity_id: this._config.entities.spotify,
        volume_level: Math.max(0, Math.min(1, value / 100)),
      });
      return;
    }
    if (target.dataset.action === 'tv-volume') {
      this._callService('media_player.volume_set', {
        entity_id: this._config.entities.tv,
        volume_level: Math.max(0, Math.min(1, value / 100)),
      });
      return;
    }
    if (target.dataset.action === 'climate-target') {
      this._setClimateTarget(Math.round(value));
      return;
    }
    if (target.dataset.action !== 'brightness') return;
    this._callService('light.turn_on', {
      entity_id: this._config.entities.room_group,
      brightness_pct: Math.max(1, Math.min(100, Math.round(value))),
    });
  }

  _handleLiveInput(event) {
    const target = event.target;
    if (!target?.matches?.('[data-action="curtain-target"]')) return;
    const value = this._toCurtainPercent(target.value);
    if (value == null) return;
    const displayOpen = 100 - value;
    const commandOpen = this._curtainCommandOpenPosition(displayOpen);
    const root = target.closest('.curtain-dock');
    root?.style.setProperty('--curtain-position', `${value}%`);
    root?.querySelector('.curtain-status-percent')?.replaceChildren(document.createTextNode(`- ${value}%`));
    const status = 'Fechada';
    root?.querySelector('.curtain-status-text')?.replaceChildren(document.createTextNode(status));
    root?.querySelectorAll('.curtain-mark').forEach((mark) => {
      mark.classList.toggle('is-active', Math.abs(Number(mark.dataset.closed) - value) <= 1 || Math.abs(Number(mark.dataset.position) - commandOpen) <= 1);
    });
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    globalThis.BrunoLiquidGlass?.apply?.();

    const model = {
      lights: this._activeLightsCount(),
      lightZones: this._activeLightsByZone(),
      curtain: this._curtainModel(),
      cameras: this._camerasModel(),
      tv: this._tvModel(),
      spotify: this._spotifyModel(),
      ps5: this._ps5Model(),
      climate: this._climateModel(),
    };
    this._lastMinute = this._clock();

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main class="quarto-miguel-subview">
        <!-- NOVO (Etapa B): a Sala é SEÇÃO da shell -> o RAIL é fornecido pela
             shell (à esquerda). A subview NÃO desenha rail próprio; renderiza só
             a moldura interna (faixas topo/rodapé) + o conteúdo. ROLLBACK:
             restaurar <div data-rail-mount> + _mountRoomRail() + coluna frame-left. -->
        <!-- NOVO (full-bleed subview, Passada 1) — nova estrutura:
             topband (status chips + relógio) | content-left (hero atmosfera +
             cortina full-width + [câmeras|mídia]) | right (Iluminação alta + AC).
             ANTERIOR (rollback): frame-top/frame-bottom + left-column(hero+cams) +
             right-column(status-rail + right-control-grid lights/media/ac). -->
        ${this._renderTopBand(model)}

        <section class="content-left">
          <section class="hero-panel">
            ${this._renderHero(model)}
          </section>
          <div class="cams-media-row">
            ${this._renderCameras(model)}
            ${this._renderMediaHub(model)}
          </div>
        </section>

        <section class="right-column">
          ${this._renderLights(model)}
          ${this._renderAC(model)}
        </section>

        ${this._renderFrameBottom()}
      </main>
    `;

    this.shadowRoot.removeEventListener('click', this._boundActionHandler);
    this.shadowRoot.removeEventListener('change', this._boundInputHandler);
    this.shadowRoot.removeEventListener('input', this._boundLiveInputHandler);
    this.shadowRoot.addEventListener('click', this._boundActionHandler);
    this.shadowRoot.addEventListener('change', this._boundInputHandler);
    this.shadowRoot.addEventListener('input', this._boundLiveInputHandler);
    this._bindImageFallbacks();
    this._mountLiveCameraFeeds();
    this._clampExpandedLights();
    // NOVO (Etapa B): rail é da shell -> não montamos rail próprio aqui.
    // (_mountRoomRail/_roomRailConfig mantidos no arquivo para rollback.)
  }

  // NOVO (réplica): monta o componente REAL do rail (bento-sidebar-liquid-card)
  // na faixa frame-left, com os itens [Home + cômodos]. É o MESMO componente do
  // painel principal -> ícones/tamanho/cor/seleção/texto idênticos por construção.
  _roomRailConfig() {
    const rooms = (this._config.room_nav || []).map((r) => ({
      key: r.key,
      icon: r.key,                 // casa com o icon-set do componente
      label: r.name,
      selected: !!r.active,        // cômodo atual destacado
      tap_action: { action: 'navigate', navigation_path: r.path || this._config.navigation_path },
    }));
    return {
      top_items: [
        { key: 'home', icon: 'home', label: 'Home',
          tap_action: { action: 'navigate', navigation_path: this._config.navigation_path } },
        ...rooms,
      ],
      bottom_items: [],            // top-anchored (réplica do principal)
    };
  }

  _mountRoomRail() {
    const mount = this.shadowRoot?.querySelector('[data-rail-mount]');
    if (!mount) return;
    if (!globalThis.customElements || !customElements.get('bento-sidebar-liquid-card')) return;
    if (!this._railEl) {
      this._railEl = document.createElement('bento-sidebar-liquid-card');
      this._railEl.setConfig(this._roomRailConfig());
    }
    if (this._hass) this._railEl.hass = this._hass;
    if (this._railEl.parentNode !== mount) mount.appendChild(this._railEl);
  }

  // NOVO (2ª passada): rótulo "ligado há" — pega a luz ACESA mais antiga da seção
  // (last_changed) e formata compacto (Xm/Xh/Xd), igual ao painel principal.
  _zoneOnLabel(zoneLights) {
    const times = (zoneLights || [])
      .map((l) => this._state(l.entity))
      .filter((s) => s && s.state === 'on')
      .map((s) => Date.parse(s.last_changed || s.last_updated))
      .filter((t) => Number.isFinite(t));
    if (!times.length) return '';
    return this._fmtElapsed(Date.now() - Math.min(...times));
  }

  _fmtElapsed(ms) {
    const totalMin = Math.floor(Math.max(0, ms) / 60000);
    if (totalMin < 1) return 'agora';
    if (totalMin < 60) return `${totalMin}m`;
    const h = Math.floor(totalMin / 60);
    if (h < 24) return `${h}h`;
    return `${Math.floor(h / 24)}d`;
  }

  // NOVO (grade 2-col — opção B): garante que a seção EXPANDIDA só exiba FAIXAS
  // INTEIRAS. Layout-agnóstico: mede o limite inferior da COLUNA (parent do card),
  // descontando os blocos que vêm depois do card (ex.: A/C) + um respiro mínimo,
  // e o que já é ocupado dentro do card (cabeçalhos + zonas fechadas abaixo). Se
  // as linhas da grade não couberem, trava num múltiplo exato de faixa + scroll —
  // nunca meia faixa cortada. Funciona tanto no acordeão (.zone-lights) quanto na
  // lista única (.office-light-list). 92px/12px em sincronia com o CSS.
  _clampExpandedLights() {
    const root = this.shadowRoot;
    if (!root || !globalThis.requestAnimationFrame) return;
    requestAnimationFrame(() => {
      const card = root.querySelector('.lights-card');
      if (!card) return;
      const expandedZone = card.querySelector('.light-zone.is-expanded');
      const grid = (expandedZone && expandedZone.querySelector('.zone-lights'))
        || card.querySelector('.office-light-list')
        || card.querySelector('.zone-lights');
      if (!grid) return;

      const TILE_H = 92;    // == CSS --zl-tile-h
      const GAP = 12;       // == CSS --zl-gap
      const MIN_GAP = 12;   // respiro mínimo entre o card e o bloco de baixo (A/C)
      const num = (v) => parseFloat(v) || 0;

      grid.style.maxHeight = '';
      grid.style.overflowY = '';

      const parent = card.parentElement;
      if (!parent) return;
      const parentStyle = getComputedStyle(parent);
      const parentGap = num(parentStyle.rowGap) || num(parentStyle.gap);
      const parentRect = parent.getBoundingClientRect();
      const parentPadBottom = num(parentStyle.paddingBottom);

      let afterCard = 0;
      for (let sib = card.nextElementSibling; sib; sib = sib.nextElementSibling) {
        const r = sib.getBoundingClientRect();
        if (r.height > 0) afterCard += r.height + parentGap;
      }

      const cardPadBottom = num(getComputedStyle(card).paddingBottom);
      const allowedCardBottom = parentRect.bottom - parentPadBottom - afterCard - MIN_GAP;

      let belowInCard = 0;
      if (expandedZone) {
        const zones = card.querySelector('.lights-zones');
        if (zones) {
          const zs = getComputedStyle(zones);
          const zonesGap = num(zs.rowGap) || num(zs.gap);
          for (let sib = expandedZone.nextElementSibling; sib; sib = sib.nextElementSibling) {
            belowInCard += sib.getBoundingClientRect().height + zonesGap;
          }
          belowInCard += num(zs.paddingBottom);
        }
      }

      const gridStyle = getComputedStyle(grid);
      const gridPadTop = num(gridStyle.paddingTop);
      const gridPadBottom = num(gridStyle.paddingBottom);
      const gridRect = grid.getBoundingClientRect();

      const available = allowedCardBottom - cardPadBottom - gridRect.top
        - belowInCard - gridPadTop - gridPadBottom;

      const rowUnit = TILE_H + GAP;
      let rowsThatFit = Math.floor((available + GAP) / rowUnit);
      if (!isFinite(rowsThatFit) || rowsThatFit < 1) rowsThatFit = 1;

      const tiles = grid.querySelectorAll('.zl-tile').length;
      const isOdd = tiles % 2 === 1;
      const totalRows = isOdd ? (1 + Math.ceil((tiles - 1) / 2)) : (tiles / 2);

      if (rowsThatFit < totalRows) {
        const visRows = Math.max(2, rowsThatFit);
        const clampH = visRows * TILE_H + (visRows - 1) * GAP + gridPadTop + gridPadBottom;
        grid.style.maxHeight = `${clampH}px`;
        grid.style.overflowY = 'auto';
      }
    });
  }

  _bindImageFallbacks() {
    this.shadowRoot?.querySelectorAll('img[data-fallback-class]').forEach((image) => {
      const fallbackClass = image.dataset.fallbackClass;
      const wrapper = image.closest('[data-image-wrapper]');
      const markFallback = () => {
        if (fallbackClass) wrapper?.classList.add(fallbackClass);
        image.setAttribute('hidden', '');
      };

      image.addEventListener('error', markFallback, { once: true });
      globalThis.setTimeout?.(() => {
        if (image.complete && image.naturalWidth === 0) markFallback();
      }, 80);
    });
  }

  // NOVO (full-bleed subview): HERO = ATMOSFERA transparente (sem .hero-bg; o
  // backdrop da shell aparece). Os CONTROLES DE CORTINA voltam SOBREPOSTOS ao
  // hero (transparente, sem caixa), ancorados embaixo — como era antes.
  // ROLLBACK: restaurar o _renderHero anterior (com .hero-bg).
  _renderHero(model) {
    return `
      <div class="hero-stage hero-atmosphere">
        <div class="hero-content">
          ${this._renderCurtain(model)}
        </div>
      </div>
    `;
  }

  // Controles de cortina (SEM caixa/card). Renderizados sobrepostos ao hero.
  _renderCurtain(model) {
    const curtain = model.curtain || this._curtainModel();
    const curtainPosition = Number.isFinite(Number(curtain.position)) ? Number(curtain.position) : 0;
    const curtainDisplayPosition = Number.isFinite(Number(curtain.displayPosition)) ? Number(curtain.displayPosition) : curtainPosition;
    const curtainVisualPosition = Number.isFinite(Number(curtain.visualPosition)) ? Number(curtain.visualPosition) : this._curtainClosedVisualPosition(curtainPosition);
    const curtainDisabled = curtain.available ? '' : 'disabled';
    const curtainMarks = BRUNO_QUARTO_MIGUEL_CURTAIN_PRESETS.map((preset) => `
      <button
        type="button"
        class="curtain-mark${Math.abs(curtainVisualPosition - preset.closed) <= 1 ? ' is-active' : ''}"
        data-action="cover-position"
        data-position="${preset.position}"
        data-closed="${preset.closed}"
        aria-label="${preset.label}% fechada"
        ${curtainDisabled}
      >${preset.label}%</button>
    `).join('');

    return `
      <div class="curtain-dock curtain-overlay${curtain.available ? '' : ' is-disabled'}" style="--curtain-position: ${curtainVisualPosition}%;">
          <div class="curtain-control-row">
            <div class="curtain-identity">
              <span class="curtain-icon-shell">${BrunoQuartoMiguelSubview._curtainSvg('main')}</span>
              <span class="curtain-title">Cortina</span>
            </div>
            <div class="curtain-status" aria-live="polite">
              <span class="curtain-status-text">${BrunoQuartoMiguelSubview._escape(curtain.status)}</span>
              <span class="curtain-status-percent">- ${curtainDisplayPosition}%</span>
            </div>
            <div class="curtain-main-actions">
              <button type="button" class="curtain-action-button" data-action="cover-open" ${curtainDisabled}>
                ${BrunoQuartoMiguelSubview._curtainSvg('open')}<span>Abrir</span>
              </button>
              <button type="button" class="curtain-action-button is-muted${curtain.moving ? ' is-active' : ''}" data-action="cover-stop" ${curtainDisabled}>
                ${BrunoQuartoMiguelSubview._curtainSvg('stop')}<span>Parar</span>
              </button>
              <button type="button" class="curtain-action-button" data-action="cover-close" ${curtainDisabled}>
                ${BrunoQuartoMiguelSubview._curtainSvg('close')}<span>Fechar</span>
              </button>
            </div>
          </div>
          <div class="curtain-slider-zone">
            <div class="curtain-slider-glow" aria-hidden="true"></div>
            <input
              class="curtain-range"
              type="range"
              min="0"
              max="100"
              step="1"
              value="${curtainVisualPosition}"
              data-action="curtain-target"
              aria-label="Fechamento da cortina"
              ${curtainDisabled}
            >
            <div class="curtain-marks">
              ${curtainMarks}
            </div>
          </div>
      </div>
    `;
  }

  // NOVO (full-bleed subview): FAIXA SUPERIOR fixa — chips de status (luzes da
  // sala/varanda, temp, umidade, rede) à esquerda + relógio/data à direita.
  // Mesma linguagem da status bar do painel principal; transparente (legibilidade
  // pela borda atmosférica do backdrop). Substitui o antigo _renderStatusRail
  // (que ficava na coluna direita) e o _renderFrameTop.
  _renderTopBand(model) {
    const zones = model.lightZones || { sala: 0, varanda: 0 };
    // MESMA IDENTIDADE das badges do painel principal (bruno-top-badges-card):
    // título (categoria) + sub (estado), ícone colorido por --tone, pill glass.
    const badges = [
      { icon: 'mdi:lightbulb', title: 'Luzes', sub: `Sala ${zones.sala} · Varanda ${zones.varanda}`, tone: '247,198,0', active: (model.lights || 0) > 0 },
      { icon: 'mdi:thermometer', title: 'Temperatura', sub: this._temperatureLabel(), tone: '247,170,90' },
      { icon: 'mdi:water-percent', title: 'Umidade', sub: this._humidityLabel(), tone: '127,200,233' },
      { icon: 'mdi:router-wireless', title: 'Roteador', sub: this._networkLabel(this._config.entities.router), tone: '154,160,166' },
      { icon: 'mdi:zigbee', title: 'Hub Zigbee', sub: this._networkLabel(this._config.entities.zigbee_hub), tone: '154,160,166' },
    ];
    return `
      <header class="subview-topband">
        <div class="topband-badges">
          ${badges.map((b) => `
            <div class="tb-badge${b.active ? ' is-active' : ''}" style="--tone: ${b.tone};">
              <span class="tb-badge-icon"><ha-icon icon="${b.icon}"></ha-icon></span>
              <span class="tb-badge-text">
                <span class="tb-badge-title">${BrunoQuartoMiguelSubview._escape(b.title)}</span>
                <span class="tb-badge-sub">${BrunoQuartoMiguelSubview._escape(b.sub)}</span>
              </span>
            </div>
          `).join('')}
        </div>
        <div class="topband-clock" aria-label="Data e hora">
          <span data-clock>${this._lastMinute}</span>
          <small>${BrunoQuartoMiguelSubview._escape(this._dateLine())}</small>
        </div>
      </header>
    `;
  }

  static _curtainSvg(type = 'main') {
    const pathSets = {
      main: `
        <path d="M9 7h30"></path>
        <path d="M14 10v27c4.5-2.8 6.8-7.3 6.8-13.5S18.5 12.8 14 10Z"></path>
        <path d="M34 10v27c-4.5-2.8-6.8-7.3-6.8-13.5S29.5 12.8 34 10Z"></path>
        <path d="M24 10v29"></path>
      `,
      open: `
        <path d="M8 8h32"></path>
        <path d="M14 11v26c5-3 7.5-7.4 7.5-13.2S19 14 14 11Z"></path>
        <path d="M34 11v26c-5-3-7.5-7.4-7.5-13.2S29 14 34 11Z"></path>
        <path d="M24 13v23"></path>
      `,
      close: `
        <path d="M8 8h32"></path>
        <path d="M19 11v26c-4.2-2.5-6.4-6.8-6.4-13S14.8 13.6 19 11Z"></path>
        <path d="M29 11v26c4.2-2.5 6.4-6.8 6.4-13S33.2 13.6 29 11Z"></path>
        <path d="M23.7 11v27M24.3 11v27"></path>
      `,
      stop: `
        <rect x="14" y="13" width="8" height="22" rx="1.5"></rect>
        <rect x="26" y="13" width="8" height="22" rx="1.5"></rect>
      `,
    };
    const size = type === 'main' ? 17 : 16;
    return `
      <svg class="curtain-svg is-${BrunoQuartoMiguelSubview._escapeAttr(type)}" viewBox="0 0 48 48" width="${size}" height="${size}" aria-hidden="true">
        ${pathSets[type] || pathSets.main}
      </svg>
    `;
  }

  static _roomNavIcon(key) {
    const icons = {
      home: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 11l9-7 9 7"/><path d="M5 10v10h14V10"/></svg>',
      sala: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11V9.5A3.5 3.5 0 0 1 8.5 6h7A3.5 3.5 0 0 1 19 9.5V11"/><path d="M4 12.5A2.5 2.5 0 0 1 6.5 10H7a2 2 0 0 1 2 2v1h6v-1a2 2 0 0 1 2-2h.5A2.5 2.5 0 0 1 20 12.5V18H4v-5.5z"/><path d="M6 18v2M18 18v2"/></svg>',
      office: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v10H4z"/><path d="M9 19h6M12 15v4"/><path d="M7 21h10"/></svg>',
      cozinha: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5h14v15H5z"/><path d="M5 10h14"/><path d="M9 7h.01M15 7h.01"/><path d="M8 14h8v4H8z"/></svg>',
      lavabo: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4h8v7a4 4 0 0 1-8 0V4z"/><path d="M7 11h10"/><path d="M12 15v5"/><path d="M9 20h6"/></svg>',
      casal: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 11V5h16v6"/><path d="M4 11h16a2 2 0 0 1 2 2v5H2v-5a2 2 0 0 1 2-2z"/><path d="M7 9h3M14 9h3"/><path d="M3 18v2M21 18v2"/></svg>',
      marina: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11V6h9a4 4 0 0 1 4 4v1"/><path d="M5 11h14a2 2 0 0 1 2 2v5H3v-5a2 2 0 0 1 2-2z"/><path d="M7 9h4"/><path d="M4 18v2M20 18v2"/></svg>',
      miguel: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 11V6h9a4 4 0 0 1 4 4v1"/><path d="M5 11h14a2 2 0 0 1 2 2v5H3v-5a2 2 0 0 1 2-2z"/><path d="M7 9h4"/><path d="M4 18v2M20 18v2"/></svg>',
      fallback: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8"/></svg>',
    };
    return icons[key] || icons.fallback;
  }

  // NOVO: faixa SUPERIOR da shell (frame-top) — nome do cômodo centralizado +
  // data/hora à direita, no padrão visual de Câmeras/Roborock (transparente, leve).
  _renderFrameTop() {
    return `
      <header class="subview-topbar">
        <span class="subview-room">${BrunoQuartoMiguelSubview._escape(this._config.title)}</span>
        <div class="subview-clock" aria-label="Data e hora">
          <span data-clock>${this._lastMinute}</span>
          <small>${BrunoQuartoMiguelSubview._escape(this._dateLine())}</small>
        </div>
      </header>
    `;
  }

  // NOVO: faixa INFERIOR da shell (frame-bottom) — presença / última atividade,
  // no mesmo padrão discreto de Câmeras/Roborock.
  _renderFrameBottom() {
    return `
      <footer class="subview-footer">
        <span class="subview-presence">
          <ha-icon icon="mdi:motion-sensor" aria-hidden="true"></ha-icon>
          ${BrunoQuartoMiguelSubview._escape(this._presenceLine())}
        </span>
      </footer>
    `;
  }

  // ANTERIOR (rollback): o rodape usava luzes/active_sensor como atividade.
  // NOVO (2026-07-12): estado semantico e tempo da presenca supervisionada.
  _presenceLine() {
    // NOVO (2026-07-12): presenca vem apenas do contrato supervisionado.
    const semantic = this._hass?.states?.[this._config.entities.semantic_sensor];
    const semanticState = String(semantic?.state || '').toLowerCase();
    const display = String(semantic?.attributes?.display || '').trim();
    if (display && !['none', 'unknown', 'unavailable'].includes(semanticState)) return display;
    if (!semantic || ['unknown', 'unavailable'].includes(semanticState)) return 'Sensor indisponível';

    const motion = this._hass?.states?.[this._config.entities.motion_recent];
    if (!motion || ['unknown', 'unavailable'].includes(String(motion.state || '').toLowerCase())) {
      return 'Sensor indisponível';
    }
    const ts = motion.last_changed || motion.last_updated;
    if (!ts) return 'Sem presença recente';
    const mins = Math.max(0, Math.round((Date.now() - Date.parse(ts)) / 60000));
    const rel = mins < 1 ? 'agora mesmo' : mins < 60 ? `há ${mins} min` : `há ${Math.round(mins / 60)} h`;
    return `Última presença ${rel}`;

    /* ANTERIOR (rollback): usava luzes/active_sensor como "atividade".
    const ids = [this._config.entities.active_sensor, this._config.entities.room_group].filter(Boolean);
    for (const id of ids) {
      const st = this._hass?.states?.[id];
      const ts = st?.last_changed || st?.last_updated;
      if (!ts) continue;
      const mins = Math.max(0, Math.round((Date.now() - Date.parse(ts)) / 60000));
      const rel = mins < 1 ? 'agora mesmo' : mins < 60 ? `há ${mins} min` : `há ${Math.round(mins / 60)} h`;
      return `Última atividade ${rel}`;
    }
    return 'Sem atividade recente';
    */
  }

  _renderRoomSidebar() {
    const items = this._config.room_nav || [];

    // NOVO (Caminho 2): botão Home no TOPO do cluster (volta ao painel principal),
    // com respiro p/ os cômodos; cada botão ganha rótulo curto sob o ícone.
    const homeButton = `
      <button
        type="button"
        class="room-nav-button room-nav-home"
        data-action="navigate"
        data-path="${BrunoQuartoMiguelSubview._escapeAttr(this._config.navigation_path)}"
        title="Home"
        aria-label="Home"
      >
        ${BrunoQuartoMiguelSubview._roomNavIcon('home')}
        <span class="room-nav-label">Home</span>
      </button>
    `;

    return `
      <nav class="room-sidebar" aria-label="Navegacao de comodos">
        ${homeButton}
        ${items.map((item) => `
          <button
            type="button"
            class="room-nav-button${item.active ? ' is-active' : ''}"
            data-action="navigate"
            data-path="${BrunoQuartoMiguelSubview._escapeAttr(item.path || this._config.navigation_path)}"
            title="${BrunoQuartoMiguelSubview._escapeAttr(item.name)}"
            aria-label="${BrunoQuartoMiguelSubview._escapeAttr(item.name)}"
          >
            ${BrunoQuartoMiguelSubview._roomNavIcon(item.key || item.icon)}
            <span class="room-nav-label">${BrunoQuartoMiguelSubview._escape(item.name)}</span>
          </button>
        `).join('')}
      </nav>
    `;
  }

  _renderStatusRail(model) {
    const zones = model.lightZones || { sala: 0, varanda: 0 };
    const status = [
      { icon: 'mdi:lightbulb-on', value: `${model.lights} ${model.lights === 1 ? 'luz' : 'luzes'}`, label: `Sala ${zones.sala} - Varanda ${zones.varanda}`, tone: 'amber' },
      { icon: 'mdi:thermometer', value: this._temperatureLabel(), label: 'Temperatura', tone: 'amber' },
      { icon: 'mdi:water-percent', value: this._humidityLabel(), label: 'Umidade', tone: 'blue' },
      { icon: 'mdi:router-wireless', value: 'Roteador', label: this._networkLabel(this._config.entities.router), tone: 'neutral' },
      { icon: 'mdi:zigbee', value: 'Hub Zigbee', label: this._networkLabel(this._config.entities.zigbee_hub), tone: 'neutral' },
    ];

    return `
      <div class="glass-card status-rail">
        ${status.map((item) => `
          <div class="status-item">
            <span class="micro-icon tone-${item.tone}"><ha-icon icon="${item.icon}"></ha-icon></span>
            <div>
              <strong>${BrunoQuartoMiguelSubview._escape(item.value)}</strong>
              <span>${BrunoQuartoMiguelSubview._escape(item.label)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _lightsSubtitle(total, active) {
    const lightLabel = total === 1 ? '1 luz' : `${total} luzes`;
    const activeLabel = active === 1 ? '1 acesa' : `${active} acesas`;
    return `${lightLabel} - ${activeLabel}`;
  }

  _lightLevel(light) {
    const state = this._state(light?.entity);
    if (!light?.entity || light.placeholder || state?.state !== 'on') return 0;

    const brightness = Number(state?.attributes?.brightness);
    if (Number.isFinite(brightness)) {
      return Math.max(1, Math.min(100, Math.round((brightness / 255) * 100)));
    }

    return 100;
  }

  _renderLightZoneRail(lights, selectedZone) {
    const label = selectedZone === 'varanda' ? 'Varanda' : 'Sala';
    const levels = lights.slice(0, 4).map((light) => ({
      name: light?.name || 'Luz',
      entity: light?.entity || '',
      level: this._lightLevel(light),
      disabled: !light?.entity || light.placeholder,
      dimmable: Boolean(this._state(light?.entity)?.attributes?.brightness != null),
    }));
    const activeCount = levels.filter((item) => item.level > 0).length;
    const total = levels.length || 0;
    const fillPercent = total
      ? Math.round(levels.reduce((sum, item) => sum + item.level, 0) / total)
      : 0;
    const isOff = fillPercent <= 0;
    const isFull = fillPercent >= 100;
    const dimmerTarget = levels.find((item) => item.dimmable && !item.disabled) || levels.find((item) => !item.disabled);
    const ariaLabel = `${label}: ${activeCount} de ${total} luzes acesas. Segurar para futuro dimmer da zona.`;

    return `
      <aside
        class="lights-zone-rail${isOff ? ' is-off' : ''}${isFull ? ' is-full' : ''}"
        aria-label="${BrunoQuartoMiguelSubview._escapeAttr(ariaLabel)}"
        title="${BrunoQuartoMiguelSubview._escapeAttr(ariaLabel)}"
        data-zone="${BrunoQuartoMiguelSubview._escapeAttr(selectedZone)}"
        data-dimmer-entity="${BrunoQuartoMiguelSubview._escapeAttr(dimmerTarget?.entity || '')}"
        data-dimmer-level="${BrunoQuartoMiguelSubview._escapeAttr(String(fillPercent))}"
        style="--rail-fill:${fillPercent}%; --rail-fill-ratio:${(fillPercent / 100).toFixed(3)}; --rail-glow:${isOff ? '0' : '1'}; --rail-ambient-height:${Math.max(22, fillPercent * 1.9)}px;"
      >
        <span class="rail-zone">${BrunoQuartoMiguelSubview._escape(label)}</span>
        <div class="rail-track" aria-hidden="true">
          <span class="rail-ambient-glow"></span>
          <span class="rail-fill"></span>
          <span class="rail-dimmer-ghost"></span>
        </div>
        <span class="rail-state"><strong>${activeCount}</strong><span>/${total}</span></span>
      </aside>
    `;
  }

  _renderLightTile(light) {
    const state = this._state(light.entity);
    const active = state?.state === 'on';
    const disabled = !light.entity || light.placeholder;

    return `
      <button type="button" class="light-tile${active ? ' is-on' : ''}${disabled ? ' is-placeholder' : ''}" ${disabled ? 'disabled' : `data-action="toggle-light" data-entity="${BrunoQuartoMiguelSubview._escapeAttr(light.entity)}"`}>
        <span class="light-icon">${BrunoQuartoMiguelSubview._tplLightIcon(light.icon_type || light.icon, active)}</span>
        <strong>${BrunoQuartoMiguelSubview._escape(light.name)}</strong>
        <small>${disabled ? 'Placeholder' : (active ? 'Ligada' : 'Desligada')}</small>
      </button>
    `;
  }

  // ANTERIOR (rollback) — abas Sala/Varanda + tiles 2x2 + coluna vertical N/4.
  // Métodos _renderLightTile/_renderLightZoneRail mantidos acima para rollback.
  // NOVO (Passada 2): acordeão de ZONAS. Cada zona com luzes REAIS (sem
  // placeholders falsos): cabeçalho (nome + N/M acesas + apagar zona + chevron)
  // e, quando expandida, linhas individuais com toggle. 1 zona => sempre expandida.
  _renderLights(model) {
    const lights = this._config.entities.lights || [];
    const zoneLabels = { sala: 'Sala', varanda: 'Varanda', ...(this._config.light_zone_labels || {}) };
    const zoneIcons = { sala: 'mdi:sofa-outline', varanda: 'mdi:string-lights' };

    const zoneOrder = [];
    for (const l of lights) {
      const zk = l.zone || 'sala';
      if (!zoneOrder.includes(zk)) zoneOrder.push(zk);
    }
    const zones = zoneOrder
      .map((zk) => {
        const zl = lights.filter((l) => (l.zone || 'sala') === zk && l.entity && !l.placeholder);
        const onCount = zl.filter((l) => this._state(l.entity)?.state === 'on').length;
        return { key: zk, name: zoneLabels[zk] || zk, icon: zoneIcons[zk] || 'mdi:lightbulb-group', lights: zl, onCount, total: zl.length };
      })
      .filter((z) => z.total > 0);

    // Single-open: 1 zona aberta por vez. Default = zonas fechadas.
    if (this._expandedZone === undefined) {
      this._expandedZone = null;
    }
    const onlyOne = zones.length === 1;
    const isExpanded = (zk) => onlyOne || this._expandedZone === zk;

    return `
      <div class="glass-card lights-card">
        <div class="module-head lights-head">
          <div class="title-with-chip">
            <span class="micro-icon tone-amber"><ha-icon icon="mdi:lightbulb-group"></ha-icon></span>
            <div class="module-title">Iluminação</div>
          </div>
          <div class="head-actions">
            <button type="button" class="chip-button is-active" data-action="lights-on">Todas acesas</button>
            <button type="button" class="chip-button" data-action="lights-off">Apagar todas</button>
          </div>
        </div>
        <div class="lights-zones">
          ${zones.map((z) => this._renderLightZone(z, isExpanded(z.key), onlyOne)).join('')}
        </div>
      </div>
    `;
  }

  _renderLightZone(zone, expanded, onlyOne) {
    const zoneKey = BrunoQuartoMiguelSubview._escapeAttr(zone.key);
    // NOVO (grade 2-col): ímpar => 1ª luz (principal) ocupa a linha inteira.
    const isOdd = zone.lights.length % 2 === 1;
    // NOVO (2ª passada): tempo da luz acesa mais antiga da zona (ex.: "· 2h").
    const onLabel = this._zoneOnLabel(zone.lights);
    return `
      <section class="light-zone${expanded ? ' is-expanded' : ''}">
        <div class="zone-header" ${onlyOne ? '' : `role="button" data-action="toggle-zone" data-zone="${zoneKey}"`}>
          <span class="zone-icon"><ha-icon icon="${zone.icon}"></ha-icon></span>
          <span class="zone-id">
            <strong>${BrunoQuartoMiguelSubview._escape(zone.name)}</strong>
            <small>${zone.onCount}/${zone.total} acesas${onLabel ? ` · ${onLabel}` : ''}</small>
          </span>
          ${expanded ? `<span class="zone-off" role="button" data-action="zone-off" data-zone="${zoneKey}">Apagar ${BrunoQuartoMiguelSubview._escape(zone.name.toLowerCase())}</span>` : ''}
          ${onlyOne ? '' : `<ha-icon class="zone-chevron" icon="${expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'}"></ha-icon>`}
        </div>
        ${expanded
          ? `<div class="zone-lights">${zone.lights.map((l, i) => this._renderZoneTile(l, isOdd && i === 0)).join('')}</div>`
          : ''}
      </section>
    `;
  }

  // NOVO (grade 2-col): tile compacto (ícone + toggle em cima; nome + status
  // embaixo). Quando `wide`, vira faixa horizontal ocupando as 2 colunas.
  _renderZoneTile(light, wide) {
    const active = this._state(light.entity)?.state === 'on';
    return `
      <button type="button"
        class="zl-tile${active ? ' is-on' : ''}${wide ? ' is-wide' : ''}"
        data-action="toggle-light"
        data-entity="${BrunoQuartoMiguelSubview._escapeAttr(light.entity)}"
        role="switch" aria-checked="${active ? 'true' : 'false'}"
        aria-label="${BrunoQuartoMiguelSubview._escapeAttr(light.name)}">
        <span class="zl-icon">${BrunoQuartoMiguelSubview._tplLightIcon(light.icon_type || light.icon, active)}</span>
        <span class="zl-switch" aria-hidden="true"><span class="zl-knob"></span></span>
        <span class="zl-name">${BrunoQuartoMiguelSubview._escape(light.name)}</span>
      </button>
    `;
    // ANTERIOR (rollback): antes de </button> havia
    // <span class="zl-status">${active ? 'Ligada' : 'Desligada'}</span>.
    // Removido — estado on/off já vem do toggle + realce; tempo ligado no cabeçalho.
  }

  // ANTERIOR (rollback) — linha vertical: ícone | nome | barra luminosa read-only.
  // _renderLightRow(light) {
  //   const active = this._state(light.entity)?.state === 'on';
  //   return `
  //     <button type="button" class="light-row${active ? ' is-on' : ''}" data-action="toggle-light" data-entity="${BrunoQuartoMiguelSubview._escapeAttr(light.entity)}">
  //       <span class="light-row-icon">${BrunoQuartoMiguelSubview._tplLightIcon(light.icon_type || light.icon, active)}</span>
  //       <span class="light-row-name">${BrunoQuartoMiguelSubview._escape(light.name)}</span>
  //       <span class="light-bar" aria-hidden="true"></span>
  //     </button>
  //   `;
  // }

  _cameraControlState(camera, key) {
    const controls = Array.isArray(camera?.controls) ? camera.controls.filter((control) => control?.entity) : [];
    const normalizedKey = String(key || '').toLowerCase();
    const control = controls.find((item) => String(item.key || '').toLowerCase() === normalizedKey);
    if (!control) return null;

    const entity = this._state(control.entity);
    const unavailable = this._isUnavailable(entity);
    const active = !unavailable && String(entity?.state || '').toLowerCase() === 'on';
    const labels = {
      sound: 'Som',
      motion: 'Movimento',
      privacy: 'Privacidade',
    };

    return {
      ...control,
      active,
      unavailable,
      label: labels[normalizedKey] || control.label || control.description || 'Controle',
    };
  }

  _syncLiveCameraHass() {
    this._liveCameraEls?.forEach((element) => {
      element.hass = this._hass;
    });
  }

  _ensureLiveCameraElement(entityId) {
    if (!entityId || !globalThis.customElements || !customElements.get('hui-image')) return null;
    if (!this._liveCameraEls) this._liveCameraEls = new Map();
    let element = this._liveCameraEls.get(entityId);
    if (!element) {
      element = document.createElement('hui-image');
      element.classList.add('camera-live-el');
      element.cameraView = 'live';
      try { element.fitMode = 'cover'; } catch (error) { /* ignore older HA builds */ }
      this._liveCameraEls.set(entityId, element);
    }
    element.hass = this._hass;
    if (element.cameraImage !== entityId) element.cameraImage = entityId;
    return element;
  }

  _mountLiveCameraFeeds() {
    if (!this.shadowRoot || !this._hass) return;
    this.shadowRoot.querySelectorAll('[data-camera-live-mount]').forEach((mount) => {
      const entityId = mount.dataset.cameraLiveMount;
      const element = this._ensureLiveCameraElement(entityId);
      if (!element) return;
      if (element.parentNode !== mount) mount.replaceChildren(element);
    });
  }
  _cameraStatusLine(camera) {
    if (!camera) return 'Indisponível';

    const unavailable = this._isUnavailable(this._state(camera.entity));
    const privacy = this._cameraControlState(camera, 'privacy');
    if (privacy?.active) return 'Modo privacidade ativo';

    return camera.online ? 'Ao vivo' : (unavailable ? 'Indisponível' : (camera.status || 'Online'));
  }

  _renderCameraFeed(camera, options = {}) {
    const pip = Boolean(options.pip);
    const cameraName = camera?.short_name || camera?.name || 'Câmera';
    const unavailable = !camera || this._isUnavailable(this._state(camera.entity));
    const privacy = this._cameraControlState(camera, 'privacy');
    const privateMode = Boolean(privacy?.active);
    const classes = [
      'camera-main',
      'camera-feed',
      pip ? 'camera-pip-feed' : 'camera-primary-feed',
      privateMode ? 'is-private' : '',
      unavailable ? 'is-unavailable' : '',
    ].filter(Boolean).join(' ');
    const overlay = unavailable
      ? `
        <div class="camera-state-surface">
          <ha-icon icon="mdi:video-off-outline"></ha-icon>
          <span>Indisponível</span>
        </div>
      `
      : privateMode
        ? `
          <div class="camera-state-surface">
            <ha-icon icon="mdi:eye-off-outline"></ha-icon>
            <span>Modo privacidade ativo</span>
          </div>
        `
        : '';
    const content = `
      ${this._cameraFrame(camera)}
      ${overlay}
      <div class="camera-row-copy">
        <strong>${BrunoQuartoMiguelSubview._escape(cameraName)}</strong>
      </div>
    `;

    if (pip && camera?.entity) {
      return `
        <button
          type="button"
          class="${classes}"
          data-action="select-camera"
          data-entity="${BrunoQuartoMiguelSubview._escapeAttr(camera.entity)}"
          aria-label="Mostrar câmera ${BrunoQuartoMiguelSubview._escapeAttr(cameraName)}"
        >
          ${content}
        </button>
      `;
    }

    return `<div class="${classes}" aria-label="Câmera ${BrunoQuartoMiguelSubview._escapeAttr(cameraName)}">${content}</div>`;
  }

  _renderCameras(model) {
    const cameras = model.cameras.cameras || [];
    if (!cameras.length) {
      return `
        <section class="glass-card cameras-card cameras-card-controls">
          <div class="mh-head cameras-head">
            <div class="mh-head-title">
              <span class="micro-icon"><ha-icon icon="mdi:cctv"></ha-icon></span>
              <div class="module-title">Câmeras</div>
            </div>
          </div>
          <div class="camera-stage camera-pip-stage">
            ${this._renderCameraFeed(null)}
          </div>
        </section>
      `;
    }

    const selected = model.cameras.activeCamera || cameras[0];
    const onlineFallback = cameras.find((camera) => camera.online);
    const active = selected?.online || !onlineFallback ? selected : onlineFallback;
    const pip = cameras.find((camera) => camera.entity !== active?.entity) || null;
    const controlsOpen = Boolean(this._cameraControlsOpen);

    return `
      <section class="glass-card cameras-card cameras-card-controls">
        <!-- Mesmo cabeçalho de 44px do Hub de Mídia e do ar-condicionado. -->
        <div class="mh-head cameras-head">
          <div class="mh-head-title">
            <span class="micro-icon"><ha-icon icon="mdi:cctv"></ha-icon></span>
            <div class="module-title">Câmeras</div>
          </div>
          <button
            type="button"
            class="mh-menu camera-settings-button${controlsOpen ? ' is-active' : ''}"
            data-action="toggle-camera-controls"
            title="Controles"
            aria-label="${controlsOpen ? 'Fechar controles das câmeras' : 'Abrir controles das câmeras'}"
            aria-expanded="${controlsOpen ? 'true' : 'false'}"
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>

        <div class="camera-stage camera-pip-stage${controlsOpen ? ' is-controls-open' : ''}">
          ${this._renderCameraFeed(active)}
          ${pip ? this._renderCameraFeed(pip, { pip: true }) : ''}
          ${controlsOpen ? this._renderCameraControls(active) : ''}
        </div>
      </section>
    `;
  }

  _renderCameraControls(camera) {
    const controls = ['sound', 'motion', 'privacy']
      .map((key) => this._cameraControlState(camera, key))
      .filter((control) => control?.entity);
    if (!controls.length) return '';

    const cameraName = camera?.short_name || camera?.name || 'Câmera';
    const controlMarkup = controls.map((control) => {
      const description = control.description || control.label || 'Controle';
      const ariaLabel = `${description} — câmera ${cameraName}`;
      return `
        <button
          type="button"
          class="camera-control${control.active ? ' is-on' : ''}${control.unavailable ? ' is-unavailable' : ''}"
          ${control.unavailable ? 'disabled' : `data-action="toggle-camera-control" data-entity="${BrunoQuartoMiguelSubview._escapeAttr(control.entity)}"`}
          aria-pressed="${control.active ? 'true' : 'false'}"
          aria-label="${BrunoQuartoMiguelSubview._escapeAttr(ariaLabel)}"
          title="${BrunoQuartoMiguelSubview._escapeAttr(ariaLabel)}"
        >
          <ha-icon icon="${BrunoQuartoMiguelSubview._escapeAttr(control.icon || 'mdi:toggle-switch-outline')}"></ha-icon>
          <span class="camera-control-label">${BrunoQuartoMiguelSubview._escape(control.label || description)}</span>
          <span class="camera-control-switch" aria-hidden="true"></span>
        </button>
      `;
    }).join('');

    return `
      <div class="camera-control-strip" aria-label="Controles da câmera ${BrunoQuartoMiguelSubview._escapeAttr(cameraName)}">
        <div class="camera-controls">${controlMarkup}</div>
      </div>
    `;
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
        ${image ? `<img src="${BrunoQuartoMiguelSubview._escapeAttr(image)}" data-camera-src-base="${BrunoQuartoMiguelSubview._escapeAttr(base)}" data-camera-entity="${BrunoQuartoMiguelSubview._escapeAttr(camera.entity)}" alt="">` : ''}
        ${camera?.entity ? `<div class="camera-live" data-camera-live-mount="${BrunoQuartoMiguelSubview._escapeAttr(camera.entity)}"></div>` : ''}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
    `;
  }
  // NOVO (2026-06-28): Hub de Mídia refatorado como ACORDEÃO verdadeiro
  // (ordem fixa TV → Spotify → PS5). Spec: hemmahubmidiaprompt.md.
  // Restrições: 320px fixos (--ac-h), sem overflow; só o Hub muda — nenhum
  // outro bloco/shell/rail/topband/backdrop é tocado. Cores: accent/volume
  // dourado #f2c266; ícone Spotify monocromático (sem verde). Apenas UMA fonte
  // expandida por vez, no próprio lugar (nunca promovida ao topo).
  _renderMediaHub(model) {
    const selected = this._selectedMedia(model);
    const tv = model.tv;
    const spotify = model.spotify;
    const ps5 = model.ps5;
    const esc = (v) => BrunoQuartoMiguelSubview._escape(v);
    const escA = (v) => BrunoQuartoMiguelSubview._escapeAttr(v);

    const tvPoster = tv.poster ? BrunoQuartoMiguelSubview._resolvePicture(tv.poster) : '';
    const spotifyArtwork = spotify.artwork ? BrunoQuartoMiguelSubview._resolvePicture(spotify.artwork) : '';
    const tvStandbyImage = this._config.tv_standby_image || '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260702-all-images-1';
    const spotifyStandbyImage = this._config.spotify_standby_image || '/local/images/echo_pop.png?v=20260702-all-images-1';
    const tvVolume = tv.volume == null ? 60 : tv.volume;
    const spotifyVolume = spotify.volume == null ? 66 : spotify.volume;
    const tvSource = tv.source || 'HDMI 1';
    const tvPlaying = tv.state === 'playing';
    // TV ligada (item 5): 2ª linha = app/fonte (Google TV, Netflix, HDMI 1...),
    // preferindo um programa real quando houver.
    const tvGeneric = !tv.title
      || /^TV (ligada|desligada)$/i.test(tv.title)
      || tv.title === tvSource;
    const tvProgram = (!tvGeneric && tvPlaying) ? tv.title : '';
    const tvSubLine = tvProgram || tvSource;
    // Barra de progresso do Spotify (posição/duração nativas do media_player).
    const spotifyAttrs = spotify.entity?.attributes || {};
    const spotifyDuration = Number(spotifyAttrs.media_duration) || 0;
    const spotifyPosition = Number(spotifyAttrs.media_position) || 0;
    const spotifyUpdatedAt = Date.parse(spotifyAttrs.media_position_updated_at || '');
    const spotifyLivePosition = spotify.playing && Number.isFinite(spotifyUpdatedAt)
      ? spotifyPosition + ((Date.now() - spotifyUpdatedAt) / 1000)
      : spotifyPosition;
    const spotifyDisplayPosition = spotifyDuration > 0
      ? Math.max(0, Math.min(spotifyDuration, spotifyLivePosition))
      : Math.max(0, spotifyLivePosition);
    const spotifyProgress = spotifyDuration > 0
      ? Math.max(0, Math.min(100, (spotifyDisplayPosition / spotifyDuration) * 100))
      : 0;
    const spotifyElapsedLabel = this._formatMediaTime(spotifyDisplayPosition);
    const spotifyDurationLabel = spotifyDuration > 0 ? this._formatMediaTime(spotifyDuration) : '--:--';
    // Spotify desligado (item 5): 2ª linha = dispositivo/integração (à la Sala).
    const spotifyDeviceLabel = this._config.spotify_device_name || spotify.source || 'SpotifyPlus';
    // PS5 ativo — jogo em execução (quando a entidade expõe), para a 2ª linha.
    const ps5Attrs = this._state(ps5.entityId)?.attributes || {};
    const ps5Game = ps5Attrs.media_title || ps5Attrs.app_name || '';
    const ps5Status = ps5.configured ? (ps5.active ? 'Online' : 'Offline') : 'Não configurado';
    const ps5Detail = ps5Game || ps5Status;

    const volRow = (action, vol, disabled = false) => `
      <div class="mh-vol${disabled ? ' is-disabled' : ''}">
        <ha-icon icon="mdi:volume-medium"></ha-icon>
        <span class="mh-vol-label">Volume ${vol}%</span>
        <input type="range" min="0" max="100" value="${vol}" data-action="${escA(action)}" aria-label="Volume" ${disabled ? 'disabled' : ''}>
      </div>
    `;

    // iconOnly (ou plus) => só ícone (resolve truncamento; title/aria mantêm a11y).
    const btn = (action, label, opts = {}) => {
      const iconOnly = Boolean(opts.iconOnly || opts.plus);
      return `
      <button
        type="button"
        class="mh-btn${opts.main ? ' is-main' : ''}${opts.plus ? ' is-plus' : ''}${iconOnly ? ' is-icon' : ''}"
        data-action="${escA(action)}"
        ${opts.entity ? `data-entity="${escA(opts.entity)}"` : ''}
        title="${escA(label)}"
        aria-label="${escA(label)}"
        ${opts.disabled ? 'disabled' : ''}
      >
        ${opts.icon ? `<ha-icon icon="${escA(opts.icon)}"></ha-icon>` : ''}
        ${iconOnly ? '' : `<span>${esc(label)}</span>`}
      </button>
    `;
    };

    // Imagem contextual à direita: APENAS o PNG transparente, sobreposto ao
    // bloco — sem glow, sem fundo, sem moldura. A imagem é posicionada de forma
    // ABSOLUTA (no CSS) para NUNCA ditar a altura da linha (evita empurrar o
    // botão para fora). shape: 'wide' (16:9) ou 'square'. cover=true => thumb/arte.
    const art = (src, shape, fallbackIcon, cover = false) => `
      <div class="mh-art mh-art-${shape}${cover ? ' is-cover' : ' is-standby'}">
        ${src
          ? `<img src="${escA(src)}" alt="" loading="lazy">`
          : `<ha-icon icon="${escA(fallbackIcon)}"></ha-icon>`}
      </div>
    `;

    // ----- Corpo expandido: TV ----- (sem título repetido — o nome já está no
    // cabeçalho da faixa; o corpo começa direto no estado).
    const tvBody = tv.active
      ? `
        <div class="mh-left">
          <div class="mh-info">
            <small>Ligada</small>
            ${tvSubLine ? `<em>${esc(tvSubLine)}</em>` : ''}
          </div>
          <div class="mh-controls">
            ${volRow('tv-volume', tvVolume)}
            <div class="mh-btn-row mh-btn-row-3">
              ${btn('tv-play-pause', 'Pausar', { icon: 'mdi:pause', iconOnly: true })}
              ${btn('tv-remote', 'Controle remoto', { icon: 'mdi:remote-tv', iconOnly: true })}
              ${btn('tv-apps', 'Apps', { icon: 'mdi:apps', iconOnly: true })}
            </div>
          </div>
        </div>
        ${art(tvPoster || tvStandbyImage, 'wide', 'mdi:television-classic', Boolean(tvPoster))}
      `
      : `
        <div class="mh-left">
          <div class="mh-info">
            <small>Desligada</small>
            <em>HDMI 1 disponível</em>
          </div>
          <div class="mh-controls">
            ${btn('toggle-tv', 'Ligar TV', { icon: 'mdi:power', main: true })}
          </div>
        </div>
        ${art(tvStandbyImage, 'wide', 'mdi:television-classic', false)}
      `;

    // ----- Corpo expandido: Spotify -----
    const spotifyArtist = spotify.subtitle || '';
    const spotifyButtons = this._spotifyToolsOpen
      ? `
        <div class="mh-btn-row mh-btn-row-4">
          ${btn('spotify-devices', 'Dispositivos', { icon: 'mdi:speaker-wireless', iconOnly: true })}
          ${btn('spotify-presets', 'Presets', { icon: 'mdi:bookmark-music-outline', iconOnly: true })}
          ${btn('spotify-queue', 'Fila', { icon: 'mdi:playlist-play', iconOnly: true })}
          ${btn('spotify-more', 'Voltar', { icon: 'mdi:chevron-left', plus: true })}
        </div>
      `
      : `
        <div class="mh-btn-row mh-btn-row-4">
          ${btn('spotify-prev', 'Anterior', { icon: 'mdi:skip-previous', iconOnly: true })}
          ${btn('spotify-play-pause', spotify.playing ? 'Pausar' : 'Tocar', { icon: spotify.playing ? 'mdi:pause' : 'mdi:play', iconOnly: true })}
          ${btn('spotify-next', 'Próxima', { icon: 'mdi:skip-next', iconOnly: true })}
          ${btn('spotify-more', 'Mais', { icon: 'mdi:plus', plus: true })}
        </div>
      `;
    // (sem título repetido — "Spotify" já está no cabeçalho. No estado ativo o
    // corpo mostra FAIXA + ARTISTA em duas linhas + barra de progresso.)
    const spotifyBody = spotify.active
      ? `
        <div class="mh-left">
          <div class="mh-info">
            <small>${esc(spotify.title || 'Tocando')}</small>
            ${spotifyArtist ? `<em>${esc(spotifyArtist)}</em>` : ''}
            <div class="mh-progress-wrap" aria-label="Progresso da faixa">
              <span class="mh-progress-time">${spotifyElapsedLabel}</span>
              <div class="mh-progress" aria-hidden="true"><span style="width:${spotifyProgress}%"></span></div>
              <span class="mh-progress-time">${spotifyDurationLabel}</span>
            </div>
          </div>
          <div class="mh-controls">
            ${volRow('spotify-volume', spotifyVolume)}
            ${spotifyButtons}
          </div>
        </div>
        ${art(spotifyArtwork || spotifyStandbyImage, 'square', 'mdi:music-note', Boolean(spotifyArtwork))}
      `
      : `
        <div class="mh-left">
          <div class="mh-info">
            <small>Desligada</small>
            <em>${esc(spotifyDeviceLabel)}</em>
          </div>
          <div class="mh-controls">
            ${btn('spotify-devices', 'Dispositivos', { icon: 'mdi:speaker-wireless', main: true })}
          </div>
        </div>
        ${art(spotifyStandbyImage, 'square', 'mdi:music-note', false)}
      `;

    const mediaMenu = this._mediaMenuOpen
      ? `
        <div class="mh-overflow-panel" role="menu" aria-label="Opções de mídia">
          <div class="mh-overflow-item">
            <span class="mh-overflow-icon"><ha-icon icon="mdi:sony-playstation"></ha-icon></span>
            <span class="mh-overflow-copy">
              <strong>PS5</strong>
              <small>${esc(ps5Detail)}</small>
            </span>
            <button
              type="button"
              class="mh-overflow-action${ps5.active ? ' is-active' : ''}"
              data-action="toggle-ps5"
              title="${ps5.active ? 'Desligar PS5' : 'Ligar PS5'}"
              aria-label="${ps5.active ? 'Desligar PS5' : 'Ligar PS5'}"
              ${ps5.configured ? '' : 'disabled'}
            >
              <ha-icon icon="mdi:power"></ha-icon>
            </button>
            <button
              type="button"
              class="mh-overflow-action"
              data-action="more-info"
              data-entity="${escA(ps5.entityId || '')}"
              title="Detalhes"
              aria-label="Detalhes do PS5"
              ${ps5.configured ? '' : 'disabled'}
            >
              <ha-icon icon="mdi:dots-horizontal"></ha-icon>
            </button>
          </div>
        </div>
      `
      : '';

    const sourceMeta = {
      tv: {
        label: 'TV da sala',
        icon: 'mdi:television-classic',
        summary: tv.active ? `Ligada · ${tvSource}` : 'Desligada',
        active: tv.active,
        body: tvBody,
      },
      spotify: {
        label: 'Spotify',
        icon: 'mdi:spotify',
        summary: spotify.active ? (spotify.title || 'Tocando') : 'Nenhuma faixa',
        active: spotify.active,
        body: spotifyBody,
      },
    };
    const order = ['tv', 'spotify'];

    const renderSource = (key) => {
      const s = sourceMeta[key];
      const isOpen = key === selected;
      const isSwitching = isOpen && key === this._mediaTransitionSource;
      // Ícone do Spotify monocromático (sem verde): ha-icon herda a cor do CSS.
      const iconHtml = key === 'spotify'
        ? '<ha-icon class="mh-src-icon mh-icon-spotify" icon="mdi:spotify"></ha-icon>'
        : `<ha-icon class="mh-src-icon" icon="${escA(s.icon)}"></ha-icon>`;
      return `
        <div class="mh-source${isOpen ? ' is-open' : ''}${s.active ? ' is-active' : ''}${isSwitching ? ' is-switching' : ''}">
          <button
            type="button"
            class="mh-source-head"
            data-action="select-media-source"
            data-source="${key}"
            aria-expanded="${isOpen ? 'true' : 'false'}"
          >
            ${iconHtml}
            <span class="mh-src-name">${esc(s.label)}</span>
            <span class="mh-src-summary">${esc(s.summary)}</span>
            ${isOpen ? '' : '<ha-icon class="mh-src-chevron" icon="mdi:chevron-right"></ha-icon>'}
          </button>
          ${isOpen ? `<div class="mh-source-body">${s.body}</div>` : ''}
        </div>
      `;
    };

    return `
      <section class="glass-card media-hub-card mh-accordion${sourceMeta[selected]?.active ? ' is-playing' : ''}${this._mediaMenuOpen ? ' is-menu-open' : ''}">
        <div class="mh-head">
          <div class="mh-head-title">
            <span class="micro-icon"><ha-icon icon="mdi:multimedia"></ha-icon></span>
            <div class="module-title">Hub de Mídia</div>
          </div>
          <button
            type="button"
            class="mh-menu${this._mediaMenuOpen ? ' is-active' : ''}"
            data-action="media-menu"
            title="Opções"
            aria-label="Opções"
            aria-expanded="${this._mediaMenuOpen ? 'true' : 'false'}"
          >
            <ha-icon icon="mdi:dots-vertical"></ha-icon>
          </button>
        </div>
        ${mediaMenu}
        <div class="mh-sources">
          ${order.map(renderSource).join('')}
        </div>
      </section>
    `;
  }

  // LEGADO (rollback): versão anterior do Hub baseada em ABAS (tabs).
  // Preservada intacta; NÃO é referenciada por nenhum call site.
  _renderMediaHubLegacy(model) {
    const selected = this._selectedMedia(model);
    const tv = model.tv;
    const spotify = model.spotify;
    const ps5 = model.ps5;
    const spotifyTransportDisabled = !spotify.active;
    const now = Date.now();
    const tvStateChanged = Boolean(this._hass && this._lastMediaTvOn !== undefined && this._lastMediaTvOn !== tv.active);
    if (tvStateChanged) {
      this._mediaTvAnimationUntil = now + BRUNO_QUARTO_MIGUEL_SUBVIEW_TV_ICON_ANIMATION_MS;
      this._mediaTvAnimationState = tv.active;
    }
    const animateTvIcon = Boolean(
      this._hass
      && this._mediaTvAnimationState === tv.active
      && this._mediaTvAnimationUntil
      && now < this._mediaTvAnimationUntil,
    );
    if (this._hass) this._lastMediaTvOn = tv.active;
    const tvPoster = tv.poster ? BrunoQuartoMiguelSubview._resolvePicture(tv.poster) : '';
    const spotifyArtwork = spotify.artwork ? BrunoQuartoMiguelSubview._resolvePicture(spotify.artwork) : '';
    const tvStandbyImage = this._config.tv_standby_image || '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260702-all-images-1';
    const spotifyStandbyImage = this._config.spotify_standby_image || '/local/images/echo_pop.png?v=20260702-all-images-1';
    const tvVolume = tv.volume == null ? 60 : tv.volume;
    const spotifyVolume = spotify.volume == null ? 66 : spotify.volume;
    const compactMeta = (...values) => {
      const seen = new Set();
      return values
        .map((value) => String(value || '').trim())
        .filter((value) => {
          if (!value) return false;
          const key = value.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    };
    const metaLine = (...values) => compactMeta(...values).join(' - ');
    const renderMeta = (value) => (
      value
        ? `<small>${BrunoQuartoMiguelSubview._escape(value)}</small>`
        : '<small aria-hidden="true">&nbsp;</small>'
    );
    const tvSource = tv.source || 'HDMI 1';
    const tvMeta = metaLine(
      tv.active ? tvSource : 'Controle remoto disponivel',
      tv.active && tv.subtitle && tv.subtitle !== tvSource ? tv.subtitle : '',
    );
    const spotifyMeta = metaLine(
      spotify.subtitle,
      spotify.source || this._config.spotify_device_name || 'Echo Show',
    );
    const ps5Meta = metaLine(
      ps5.active ? 'Console ligado' : 'Pronto para ligar',
      'HDMI 1',
    );
    const mediaActionButton = ({
      action,
      icon,
      label,
      className = '',
      attrs = '',
      disabled = false,
    }) => `
      <button
        type="button"
        class="media-action-button${className ? ` ${className}` : ''}"
        data-action="${BrunoQuartoMiguelSubview._escapeAttr(action)}"
        title="${BrunoQuartoMiguelSubview._escapeAttr(label)}"
        aria-label="${BrunoQuartoMiguelSubview._escapeAttr(label)}"
        ${attrs}
        ${disabled ? 'disabled' : ''}
      >
        <ha-icon icon="${BrunoQuartoMiguelSubview._escapeAttr(icon)}"></ha-icon>
      </button>
    `;
    const mediaIdentityCell = (type, active = false, options = {}) => `
      <span class="media-identity-cell is-${BrunoQuartoMiguelSubview._escapeAttr(type)}${active ? ' is-active' : ''}" aria-hidden="true">
        ${BrunoQuartoMiguelSubview._tplMediaIcon(type, { active, animate: Boolean(options.animate) })}
      </span>
    `;
    const standbyImage = (src, className, fallbackIcon) => (
      src
        ? `<img class="media-standby-image ${className}" src="${BrunoQuartoMiguelSubview._escapeAttr(src)}" alt="">`
        : `<ha-icon icon="${BrunoQuartoMiguelSubview._escapeAttr(fallbackIcon)}"></ha-icon>`
    );
    const tvAppButtons = (this._config.tv_apps || []).slice(0, 4).map((app) => {
      const label = app.label || 'App';
      const image = app.image ? BrunoQuartoMiguelSubview._escapeAttr(app.image) : '';
      const keyClass = app.key ? ` app-${BrunoQuartoMiguelSubview._escapeAttr(app.key)}` : '';
      return `
        <button
          type="button"
          class="media-action-button media-image-button${keyClass}"
          data-action="tv-app"
          data-script="${BrunoQuartoMiguelSubview._escapeAttr(app.script || '')}"
          title="${BrunoQuartoMiguelSubview._escapeAttr(label)}"
          aria-label="${BrunoQuartoMiguelSubview._escapeAttr(label)}"
          ${image ? `style="--media-app-image: url('${image}');"` : ''}
          ${app.script ? '' : 'disabled'}
        >
          ${image
            ? '<span class="media-button-art" aria-hidden="true"></span>'
            : `<ha-icon icon="${BrunoQuartoMiguelSubview._escapeAttr(app.icon || 'mdi:apps')}"></ha-icon>`}
        </button>
      `;
    }).join('');
    const tvPrimaryActions = `
      ${mediaIdentityCell('tv', tv.active, { animate: animateTvIcon })}
      ${mediaActionButton({ action: 'toggle-tv', icon: 'mdi:power', label: tv.active ? 'Desligar TV' : 'Ligar TV' })}
      ${mediaActionButton({ action: 'tv-remote', icon: 'mdi:remote-tv', label: 'Controle remoto' })}
      ${mediaActionButton({ action: 'tv-play-pause', icon: 'mdi:play-pause', label: 'Play pause', className: 'is-main' })}
    `;
    const spotifyPrimaryActions = `
      ${mediaIdentityCell('spotify', spotify.active || spotify.playing)}
      ${mediaActionButton({ action: 'spotify-prev', icon: 'mdi:skip-previous', label: 'Faixa anterior', disabled: spotifyTransportDisabled })}
      ${mediaActionButton({ action: 'spotify-play-pause', icon: spotify.playing ? 'mdi:pause' : 'mdi:play', label: spotify.playing ? 'Pausar' : 'Tocar', className: 'is-main', disabled: spotifyTransportDisabled })}
      ${mediaActionButton({ action: 'spotify-next', icon: 'mdi:skip-next', label: 'Proxima faixa', disabled: spotifyTransportDisabled })}
    `;
    const spotifySecondaryActions = `
      ${mediaActionButton({ action: 'spotify-devices', icon: 'mdi:speaker-wireless', label: 'Dispositivos', className: 'is-tool' })}
      ${mediaActionButton({ action: 'spotify-presets', icon: 'mdi:bookmark-music-outline', label: 'Presets', className: 'is-tool' })}
      ${mediaActionButton({ action: 'spotify-queue', icon: 'mdi:playlist-play', label: 'Fila', className: 'is-tool' })}
      ${mediaActionButton({ action: 'spotify-favorites', icon: 'mdi:heart-outline', label: 'Favoritos', className: 'is-tool' })}
    `;
    const sources = {
      tv: {
        key: 'tv',
        label: 'TV',
        icon: 'mdi:television-classic',
        active: tv.active,
        state: this._mediaStateLabel(tv.state),
        title: tv.title || (tv.active ? 'TV ligada' : 'TV desligada'),
        meta: renderMeta(tvMeta),
        visual: tvPoster
          ? `<img src="${BrunoQuartoMiguelSubview._escapeAttr(tvPoster)}" alt="">`
          : standbyImage(tvStandbyImage, 'media-tv-standby', 'mdi:television-classic'),
        primaryActions: tvPrimaryActions,
        secondaryActions: tvAppButtons,
        extra: `
          <div class="volume-row">
            <ha-icon icon="mdi:volume-medium"></ha-icon>
            <input type="range" min="0" max="100" value="${tvVolume}" data-action="tv-volume" aria-label="Volume da TV">
            <strong>${tvVolume}%</strong>
          </div>
        `,
      },
      spotify: {
        key: 'spotify',
        label: 'Spotify',
        icon: 'mdi:spotify',
        active: spotify.active,
        state: spotify.playing ? 'Tocando' : this._mediaStateLabel(spotify.state),
        title: spotify.title || 'SpotifyPlus',
        meta: renderMeta(spotifyMeta),
        visual: spotifyArtwork
          ? `<img src="${BrunoQuartoMiguelSubview._escapeAttr(spotifyArtwork)}" alt="">`
          : standbyImage(spotifyStandbyImage, 'media-spotify-standby', 'mdi:music-note'),
        primaryActions: spotifyPrimaryActions,
        secondaryActions: spotifySecondaryActions,
        extra: `
          <div class="volume-row spotify-volume">
            <ha-icon icon="mdi:volume-medium"></ha-icon>
            <input type="range" min="0" max="100" value="${spotifyVolume}" data-action="spotify-volume" aria-label="Volume do Spotify" ${spotify.active ? '' : 'disabled'}>
            <strong>${spotifyVolume}%</strong>
          </div>
        `,
      },
      ps5: {
        key: 'ps5',
        label: 'PS5',
        icon: 'mdi:sony-playstation',
        active: ps5.active,
        state: ps5.active ? 'Online' : (ps5.configured ? 'Offline' : 'Placeholder'),
        title: ps5.title,
        meta: renderMeta(ps5Meta),
        visual: ps5.image
          ? `<img class="media-standby-image media-ps5-image" src="${BrunoQuartoMiguelSubview._escapeAttr(ps5.image)}" alt="">`
          : '<ha-icon icon="mdi:sony-playstation"></ha-icon>',
        primaryClass: 'is-wide',
        primaryActions: `
          <button type="button" class="primary-button" data-action="toggle-ps5" ${ps5.configured ? '' : 'disabled'}>${ps5.active ? 'Desligar' : 'Ligar'}</button>
          ${mediaActionButton({
            action: 'more-info',
            icon: 'mdi:dots-horizontal',
            label: 'Mais detalhes',
            attrs: `data-entity="${BrunoQuartoMiguelSubview._escapeAttr(ps5.entityId || '')}"`,
            disabled: !ps5.configured,
          })}
        `,
        secondaryActions: '',
        extra: '',
      },
    };
    const current = sources[selected] || sources.tv;
    const tabs = Object.values(sources);

    return `
      <section class="glass-card media-hub-card is-${BrunoQuartoMiguelSubview._escapeAttr(current.key)}">
        <div class="module-head media-hub-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:multimedia"></ha-icon></span>
            <div>
              <div class="module-title">Hub de midia</div>
            </div>
          </div>
          <div class="media-tabs" role="tablist" aria-label="Fonte de midia">
            ${tabs.map((source) => `
              <button
                type="button"
                class="${source.key === current.key ? 'is-selected' : ''}${source.active ? ' is-source-active' : ''}"
                data-action="select-media-source"
                data-source="${source.key}"
              >
                <span class="source-dot"></span>
                <span>${BrunoQuartoMiguelSubview._escape(source.label)}</span>
                <small>${BrunoQuartoMiguelSubview._escape(source.state)}</small>
              </button>
            `).join('')}
          </div>
        </div>

        <div class="media-hub-body">
          <div class="media-visual${current.active ? ' is-active' : ''}">
            ${current.visual}
          </div>
          <div class="media-hub-content">
            <div class="media-details">
              <strong>${BrunoQuartoMiguelSubview._escape(current.title)}</strong>
              ${current.meta}
            </div>
            <div class="media-action-stack${current.secondaryActions ? ' has-secondary' : ''}">
              <div class="media-primary-actions${current.primaryClass ? ` ${current.primaryClass}` : ''}">
                ${current.primaryActions}
              </div>
              ${current.secondaryActions ? `
                <div class="media-secondary-actions">
                  ${current.secondaryActions}
                </div>
              ` : ''}
            </div>
            ${current.extra ? `
              <div class="media-hub-extra">
                ${current.extra}
              </div>
            ` : ''}
          </div>
        </div>
      </section>
    `;
  }

  _renderTV(model) {
    const tv = model.tv;
    const poster = tv.poster ? BrunoQuartoMiguelSubview._resolvePicture(tv.poster) : '';
    const volume = tv.volume == null ? 60 : tv.volume;

    return `
      <section class="glass-card tv-card${tv.active ? ' is-active' : ''}">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:television-classic"></ha-icon></span>
            <div>
              <div class="module-title">Televisao</div>
            </div>
          </div>
        </div>

        <div class="tv-body">
          <div class="tv-main">
            <div class="control-row">
              <button type="button" class="control-button" data-action="toggle-tv"><ha-icon icon="mdi:power"></ha-icon></button>
              <button type="button" class="control-button" data-action="tv-remote"><ha-icon icon="mdi:remote-tv"></ha-icon></button>
              <button type="button" class="control-button" data-action="tv-play-pause"><ha-icon icon="mdi:play-pause"></ha-icon></button>
            </div>
            <div class="volume-row">
              <ha-icon icon="mdi:volume-medium"></ha-icon>
              <input type="range" min="0" max="100" value="${volume}" data-action="tv-volume" aria-label="Volume da TV">
              <strong>${volume}%</strong>
            </div>
          </div>
          <div class="poster-card${poster ? ' has-poster' : ''}">
            ${poster ? `<img src="${BrunoQuartoMiguelSubview._escapeAttr(poster)}" alt="">` : '<span>Poster</span>'}
          </div>
        </div>
      </section>
    `;
  }

  _renderPS5(model) {
    const ps5 = model.ps5;
    const image = ps5.image ? BrunoQuartoMiguelSubview._escapeAttr(ps5.image) : '';

    return `
      <section class="glass-card ps5-card${ps5.active ? ' is-active' : ''}${ps5.configured ? '' : ' is-placeholder'}">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:sony-playstation"></ha-icon></span>
            <div>
              <div class="module-title">PlayStation 5</div>
            </div>
          </div>
        </div>
        <!-- FALLBACK - PS5 anterior tinha texto "Console desligado" e caixas Status/Modo. -->
        <div class="ps5-body ps5-minimal">
          ${image ? `<img class="ps5-image" src="${image}" alt="">` : ''}
          <div class="ps5-footer">
            <span class="device-state"><span class="live-dot"></span>${ps5.active ? 'Online' : 'Offline'}</span>
            <div class="ps5-actions">
              <button type="button" class="primary-button" data-action="toggle-ps5" ${ps5.configured ? '' : 'disabled'}>${ps5.active ? 'Desligar' : 'Ligar'}</button>
              <button type="button" class="control-button" data-action="more-info" data-entity="${BrunoQuartoMiguelSubview._escapeAttr(ps5.entityId || '')}" ${ps5.configured ? '' : 'disabled'}><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderSpotify(model) {
    const spotify = model.spotify;
    const artwork = spotify.artwork ? BrunoQuartoMiguelSubview._resolvePicture(spotify.artwork) : '';
    const volume = spotify.volume == null ? 66 : spotify.volume;
    const transportDisabled = spotify.active ? '' : ' disabled';
    const controls = this._spotifyToolsOpen
      ? `
        <button type="button" class="control-button" data-action="spotify-more" title="Voltar"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
        <button type="button" class="control-button is-tool" data-action="spotify-devices" title="Dispositivos"><ha-icon icon="mdi:speaker-wireless"></ha-icon></button>
        <button type="button" class="control-button is-tool" data-action="spotify-library" title="Playlists e fila"><ha-icon icon="mdi:playlist-music"></ha-icon></button>
        <button type="button" class="control-button is-tool" data-action="spotify-plus" title="Mais opcoes"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>
      `
      : `
        <button type="button" class="control-button" data-action="spotify-prev"${transportDisabled}><ha-icon icon="mdi:skip-previous"></ha-icon></button>
        <button type="button" class="control-button is-main" data-action="spotify-play-pause"${transportDisabled}><ha-icon icon="${spotify.playing ? 'mdi:pause' : 'mdi:play'}"></ha-icon></button>
        <button type="button" class="control-button" data-action="spotify-next"${transportDisabled}><ha-icon icon="mdi:skip-next"></ha-icon></button>
        <button type="button" class="control-button" data-action="spotify-more" title="Mais opcoes"><ha-icon icon="mdi:plus"></ha-icon></button>
      `;

    return `
      <section class="glass-card spotify-card${spotify.active ? ' is-active' : ''}">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon tone-green"><ha-icon icon="mdi:spotify"></ha-icon></span>
            <div>
              <div class="module-title">Spotify</div>
            </div>
          </div>
          <span class="state-chip"><span></span>${spotify.playing ? 'Playing' : BrunoQuartoMiguelSubview._escape(spotify.state)}</span>
        </div>

        <div class="spotify-body">
          <div class="spotify-art${artwork ? ' has-art' : ''}">
            ${artwork ? `<img src="${BrunoQuartoMiguelSubview._escapeAttr(artwork)}" alt="">` : '<ha-icon icon="mdi:music-note"></ha-icon>'}
          </div>
          <div class="spotify-copy">
            <div class="spotify-controls">
              ${controls}
            </div>
            <div class="volume-row spotify-volume">
              <ha-icon icon="mdi:volume-medium"></ha-icon>
              <input type="range" min="0" max="100" value="${volume}" data-action="spotify-volume" aria-label="Volume do Spotify" ${spotify.active ? '' : 'disabled'}>
              <strong>${volume}%</strong>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderClimateRing(climate, target, current, minTarget, maxTarget, dialMode) {
    // --- ORIGINAL anel circular (comentado para rollback) ---
    // const cxOld = 200;
    // const cyOld = 200;
    // const startAngleOld = 225;
    // const endAngleOld = 495;
    // const sweepOld = endAngleOld - startAngleOld;
    // const trackRadius = 136;
    // const tickOuterRadius = 160;
    // ...
    // (corpo completo do anel original preservado neste comentario-bloco para rollback;
    //  ver historico Git anterior a substituicao pelo gauge semicircular)
    // --- FIM ORIGINAL ---

    // --- NOVO: gauge semicircular integrado (sem container/background proprio) ---
    const cx = 360;
    const cy = 410;
    const radius = 285;
    const startAngle = -180;
    const endAngle = 0;
    const sweep = endAngle - startAngle;

    const targetValue = Number(climate.target);
    const safeMin = Number.isFinite(Number(minTarget)) ? Number(minTarget) : 12;
    const safeMax = Number.isFinite(Number(maxTarget)) ? Number(maxTarget) : 30;
    const safeTarget = Number.isFinite(targetValue)
      ? Math.max(safeMin, Math.min(safeMax, targetValue))
      : safeMin + ((safeMax - safeMin) / 2);
    const range = Math.max(1, safeMax - safeMin);
    const progress = Math.max(0, Math.min(1, (safeTarget - safeMin) / range));
    const currentAngle = startAngle + (sweep * progress);

    const targetLabel = climate.target == null ? '--' : `${target}`;
    const ambientLabel = climate.current == null ? '--' : `${current}`;
    const modeLabel = String(dialMode || '').toUpperCase();

    const polarToCartesian = (r, angleDeg) => {
      const rad = (angleDeg * Math.PI) / 180;
      return {
        x: cx + (r * Math.cos(rad)),
        y: cy + (r * Math.sin(rad)),
      };
    };
    const describeArc = (r, start, end) => {
      const s = polarToCartesian(r, start);
      const e = polarToCartesian(r, end);
      const large = Math.abs(end - start) <= 180 ? '0' : '1';
      return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${large} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
    };

    const activeArc = describeArc(radius, startAngle, currentAngle);
    const inactiveArc = describeArc(radius, currentAngle, endAngle);
    const fullArc = describeArc(radius, startAngle, endAngle);
    const marker = polarToCartesian(radius, currentAngle);

    const outerTicks = (() => {
      const total = 90;
      const parts = [];
      for (let i = 0; i <= total; i++) {
        const tp = i / total;
        const angle = startAngle + (sweep * tp);
        const isMajor = i % 15 === 0;
        const isMedium = i % 5 === 0;
        const outer = radius + 34;
        const inner = isMajor ? radius + 8 : isMedium ? radius + 14 : radius + 21;
        const p1 = polarToCartesian(outer, angle);
        const p2 = polarToCartesian(inner, angle);
        const cls = isMajor ? 'icg-tick major' : isMedium ? 'icg-tick medium' : 'icg-tick minor';
        parts.push(`<line x1="${p1.x.toFixed(3)}" y1="${p1.y.toFixed(3)}" x2="${p2.x.toFixed(3)}" y2="${p2.y.toFixed(3)}" class="${cls}"></line>`);
      }
      return parts.join('');
    })();

    const innerTicks = (() => {
      const total = 72;
      const parts = [];
      for (let i = 0; i <= total; i++) {
        const tp = i / total;
        const angle = startAngle + (sweep * tp);
        const outer = radius - 18;
        const inner = radius - 34;
        const p1 = polarToCartesian(outer, angle);
        const p2 = polarToCartesian(inner, angle);
        parts.push(`<line x1="${p1.x.toFixed(3)}" y1="${p1.y.toFixed(3)}" x2="${p2.x.toFixed(3)}" y2="${p2.y.toFixed(3)}" class="icg-inner-tick"></line>`);
      }
      return parts.join('');
    })();

    const labels = [
      { text: `${this._formatNumber(safeMin, 0)}°`, angle: -180, r: radius + 52, cls: 'edge' },
      { text: '10', angle: -148, r: radius + 58, cls: '' },
      { text: '20', angle: -90, r: radius + 52, cls: 'top' },
      { text: '25', angle: -32, r: radius + 58, cls: '' },
      { text: `${this._formatNumber(safeMax, 0)}°`, angle: 0, r: radius + 52, cls: 'edge' },
    ];
    const labelMarkup = labels.map((label) => {
      const p = polarToCartesian(label.r, label.angle);
      return `<text x="${p.x.toFixed(3)}" y="${p.y.toFixed(3)}" text-anchor="middle" dominant-baseline="middle" class="icg-label ${label.cls}">${BrunoQuartoMiguelSubview._escape(label.text)}</text>`;
    }).join('');

    return `
      <div class="icg-root">
        <div class="icg-shell">
          <svg class="icg-svg" viewBox="0 0 720 460" role="img" aria-label="${BrunoQuartoMiguelSubview._escapeAttr(`Temperatura alvo ${targetLabel}°. Ambiente ${ambientLabel}°.`)}">
            <defs>
              <linearGradient id="icgActiveBlue" x1="90" y1="340" x2="560" y2="90">
                <stop offset="0%" stop-color="#0078ff"></stop>
                <stop offset="38%" stop-color="#1fb7ff"></stop>
                <stop offset="72%" stop-color="#3ed6ff"></stop>
                <stop offset="100%" stop-color="#96f0ff"></stop>
              </linearGradient>
              <filter id="icgBlueGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur>
                <feColorMatrix in="blur" type="matrix" values="0 0 0 0 0.02  0 0 0 0 0.42  0 0 0 0 1  0 0 0 0.95 0"></feColorMatrix>
                <feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
              <filter id="icgTextGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#dcecff" flood-opacity="0.24"></feDropShadow>
              </filter>
            </defs>
            <g>${outerTicks}</g>
            <g>${innerTicks}</g>
            <path d="${fullArc}" class="icg-track-shadow"></path>
            <path d="${inactiveArc}" class="icg-track-muted"></path>
            <path d="${activeArc}" class="icg-active-glow"></path>
            <path d="${activeArc}" class="icg-active-arc"></path>
            ${labelMarkup}
            <circle cx="${marker.x.toFixed(3)}" cy="${marker.y.toFixed(3)}" r="21" class="icg-marker-glow"></circle>
            <circle cx="${marker.x.toFixed(3)}" cy="${marker.y.toFixed(3)}" r="13" class="icg-marker-ring"></circle>
            <circle cx="${(marker.x - 4).toFixed(3)}" cy="${(marker.y - 5).toFixed(3)}" r="4" class="icg-marker-highlight"></circle>
            <text x="${cx}" y="260" text-anchor="middle" dominant-baseline="middle" class="icg-center-mode">${BrunoQuartoMiguelSubview._escape(modeLabel)}</text>
            <text x="${cx}" y="328" text-anchor="middle" dominant-baseline="middle" class="icg-center-temp">${BrunoQuartoMiguelSubview._escape(targetLabel)}°</text>
            <text x="${cx}" y="382" text-anchor="middle" dominant-baseline="middle" class="icg-center-sub">SET TEMPERATURE</text>
            <line x1="${cx - 28}" y1="408" x2="${cx + 28}" y2="408" class="icg-center-line"></line>
            <text x="${cx}" y="432" text-anchor="middle" dominant-baseline="middle" class="icg-ambient">Ambient ${BrunoQuartoMiguelSubview._escape(ambientLabel)}°</text>
          </svg>
        </div>
      </div>
    `;
  }

  _renderAC(model) {
    const climate = model.climate;
    const target = climate.target == null ? '--' : this._formatNumber(climate.target, 0);
    const current = climate.current == null ? '--' : this._formatNumber(climate.current, 1);
    const minTarget = Number.isFinite(Number(climate.minTemp)) ? Number(climate.minTemp) : 16;
    const maxTarget = Number.isFinite(Number(climate.maxTemp)) ? Number(climate.maxTemp) : 30;
    const activeMode = climate.hvacMode || 'off';
    const fan = String(climate.fan || 'auto').toLowerCase();
    const swing = String(climate.swing || '').toLowerCase();
    const swingActive = ['on', 'ativo', 'ativada', 'enabled'].includes(swing)
      || (swing.includes('ativ') && !swing.includes('desativ'));
    const dialMode = activeMode === 'cool'
      ? 'Resfriamento'
      : activeMode === 'heat'
        ? 'Aquecimento'
        : activeMode === 'fan_only'
          ? 'Ventilacao'
          : 'Temperatura';

    // NOVO (Passada 2): AC ENXUTO (proposta imagem 5) — cabeçalho (estado/modo) +
    // power; leitura Ambiente/Umidade; semi-anel (Desejada); 3 botões (Modo /
    // Ventilação / Swing) que abrem o controle detalhado (more-info do climate).
    // ANTERIOR (rollback): imagem grande do aparelho + slider + modos + stepper +
    // fan-row (bloco alto). Preservado no histórico git.
    const cap = (s) => {
      const t = String(s || '').replace(/_/g, ' ').trim();
      return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—';
    };
    const normalize = (value) => String(value || '').toLowerCase();
    const unique = (items) => [...new Set((items || []).filter(Boolean))];
    const hvacOptions = unique(climate.hvacModes);
    const fanOptions = unique(climate.fanModes);
    const swingOptions = unique(climate.swingModes);
    const modeIcon = (mode) => {
      const value = normalize(mode);
      return ({
        off: 'mdi:power',
        cool: 'mdi:snowflake',
        heat: 'mdi:fire',
        fan_only: 'mdi:fan',
        dry: 'mdi:water-percent',
        auto: 'mdi:autorenew',
        heat_cool: 'mdi:autorenew',
      }[value] || 'mdi:thermostat');
    };
    const fanIcon = (mode) => {
      const value = normalize(mode);
      if (value.includes('auto')) return 'mdi:fan-auto';
      if (value.includes('low') || value.includes('baixo')) return 'mdi:fan-speed-1';
      if (value.includes('med')) return 'mdi:fan-speed-2';
      if (value.includes('high') || value.includes('alto') || value.includes('fort')) return 'mdi:fan-speed-3';
      return 'mdi:fan';
    };
    const modeLabelFor = (mode) => {
      const value = normalize(mode);
      return ({
        off: 'Desligado',
        cool: 'Frio',
        heat: 'Aquecimento',
        fan_only: 'Ventilar',
        dry: 'Secar',
        heat_cool: 'Auto',
        auto: 'Auto',
      }[value] || cap(mode));
    };
    const fanLabelFor = (mode) => {
      const value = normalize(mode);
      if (value === 'auto') return 'Auto';
      if (value.includes('low') || value.includes('baixo')) return 'Baixa';
      if (value.includes('med')) return 'Média';
      if (value.includes('high') || value.includes('alto')) return 'Alta';
      if (value.includes('fort')) return 'Forte';
      return cap(mode);
    };
    const swingLabelFor = (mode) => {
      const value = normalize(mode);
      if (!value) return 'Indisponível';
      if (['off', 'desativado', 'desativada', 'disabled'].includes(value)) return 'Desligado';
      if (['on', 'ativo', 'ativada', 'enabled'].includes(value)) return 'Ativo';
      return cap(mode);
    };
    const modeLabel = !climate.active || activeMode === 'off'
      ? 'Desligado'
      : modeLabelFor(activeMode);
    const fanLabel = fanLabelFor(fan);
    const swingLabel = swing ? swingLabelFor(swing) : (swingActive ? 'Ativo' : 'Desligado');
    const climateEntity = BrunoQuartoMiguelSubview._escapeAttr(this._config.entities.climate || '');
    const climateDisabled = this._isUnavailable(climate.entity) ? ' disabled' : '';
    const selectedPanel = this._selectedClimatePanel;
    const renderOption = ({ action, mode, label, icon, active }) => `
      <button
        type="button"
        class="ac-popover-option${active ? ' is-active' : ''}"
        data-action="${action}"
        data-mode="${BrunoQuartoMiguelSubview._escapeAttr(mode)}"
        role="menuitem"
      >
        <ha-icon icon="${BrunoQuartoMiguelSubview._escapeAttr(icon)}"></ha-icon>
        <span>${BrunoQuartoMiguelSubview._escape(label)}</span>
      </button>
    `;
    const renderPopover = (panel, options) => {
      if (selectedPanel !== panel) return '';
      if (!options.length) {
        return `
          <div class="ac-popover" role="menu">
            <button type="button" class="ac-popover-option" disabled>
              <ha-icon icon="mdi:alert-circle-outline"></ha-icon>
              <span>Indisponível</span>
            </button>
          </div>
        `;
      }
      return `<div class="ac-popover" role="menu">${options.map(renderOption).join('')}</div>`;
    };
    const modeOptions = hvacOptions.map((mode) => ({
      action: 'climate-mode',
      mode,
      label: modeLabelFor(mode),
      icon: modeIcon(mode),
      active: normalize(mode) === normalize(activeMode),
    }));
    const fanControlOptions = fanOptions.map((mode) => ({
      action: 'fan-mode',
      mode,
      label: fanLabelFor(mode),
      icon: fanIcon(mode),
      active: normalize(mode) === fan,
    }));
    const swingControlOptions = swingOptions.map((mode) => ({
      action: 'swing-mode',
      mode,
      label: swingLabelFor(mode),
      icon: normalize(mode) === 'off' ? 'mdi:air-conditioner' : 'mdi:swap-vertical',
      active: normalize(mode) === swing,
    }));
    const controlButton = ({ panel, icon, title, value, options }) => `
      <div class="ac-control-wrap">
        <button
          type="button"
          class="ac-action${selectedPanel === panel ? ' is-open' : ''}"
          data-action="toggle-climate-panel"
          data-panel="${panel}"
          aria-expanded="${selectedPanel === panel ? 'true' : 'false'}"
          ${climateDisabled}
        >
          <span class="ac-action-icon"><ha-icon icon="${icon}"></ha-icon></span>
          <span class="ac-action-text"><small>${title}</small><strong>${BrunoQuartoMiguelSubview._escape(value)}</strong></span>
        </button>
        ${renderPopover(panel, options)}
      </div>
    `;

    return `
      <section class="glass-card ac-card ac-card-lean">
        <div class="ac-lean-head">
          <div class="mh-head-title ac-head-title">
            <span class="micro-icon tone-blue"><ha-icon icon="mdi:air-conditioner"></ha-icon></span>
            <div class="module-title">Ar-condicionado</div>
          </div>
          <div class="ac-top-stack">
            <button type="button" class="mh-menu ac-more-button" data-action="more-info" data-entity="${climateEntity}" title="Mais detalhes" aria-label="Mais detalhes">
              <ha-icon icon="mdi:dots-vertical"></ha-icon>
            </button>
            <button type="button" class="ac-power-floating${climate.active ? ' is-active' : ''}" data-action="toggle-climate" aria-label="Ligar ar condicionado" ${climateDisabled}>
              <ha-icon icon="mdi:power"></ha-icon>
            </button>
          </div>
        </div>
        <div class="ac-lean-mid">
          <div class="ac-ring">
            ${this._renderClimateRing(climate, target, current, minTarget, maxTarget, dialMode)}
          </div>
        </div>
        <div class="ac-lean-foot">
          ${controlButton({ panel: 'mode', icon: 'mdi:thermostat-auto', title: 'Modo', value: modeLabel, options: modeOptions })}
          ${controlButton({ panel: 'fan', icon: 'mdi:fan', title: 'Ventilação', value: fanLabel, options: fanControlOptions })}
          ${controlButton({ panel: 'swing', icon: 'mdi:air-conditioner', title: 'Swing', value: swingLabel, options: swingControlOptions })}
        </div>
      </section>
    `;
  }

  _styles() {
    return `
      :host {
        --qmiguel-gap: 10px;
        --qmiguel-radius: var(--bruno-liquid-card-radius, 18px);
        --qmiguel-radius-small: var(--bruno-liquid-card-radius-compact, 16px);
        --qmiguel-cell-radius: var(--bruno-liquid-cell-radius, 16px);
        --accent: var(--bruno-liquid-accent, 150, 190, 255);
        --accent-blue: 96, 165, 250;
        --accent-cyan: 79, 172, 254;
        --accent-amber: 255, 183, 77;
        /* Tamanho FIXO do quadrado da arte (padrão). ANTERIOR: 168px (cortava
           arte/volume com a faixa mais baixa). */
        --media-screen-height: 150px;
        /* Altura FIXA do bloco de A/C (ancorado na base) — câmeras/mídia seguem o
           MESMO valor. Subir/baixar aqui reduz/aumenta o vão luzes↔A/C.
           As luzes acima continuam dinâmicas (auto) — NÃO mexer nelas. */
        --ac-h: 320px;
        --text-main: rgba(245,250,255,0.96);
        --text-soft: rgba(255,255,255,0.62);
        --text-dim: rgba(255,255,255,0.42);
        display: block;
        width: 100%;
        /* NOVO (Etapa B): como SEÇÃO da shell, preenche o content-slot (100%),
           não a viewport (100vh). ORIGINAL: height/min-height 100vh. */
        height: 100%;
        min-height: 0;
        color: var(--text-main);
        font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
        overflow: hidden;
      }

      * {
        box-sizing: border-box;
        letter-spacing: 0;
      }

      button {
        font: inherit;
        color: inherit;
        border: 0;
        outline: 0;
        cursor: pointer;
        user-select: none;
        -webkit-user-select: none;
        touch-action: manipulation;
      }

      .quarto-miguel-subview {
        width: 100%;
        min-height: 100vh;
        height: 100vh;
        display: grid;
        /* NOVO (Caminho 2): coluna do rail 64px -> 88px (acomoda rótulos). */
        grid-template-columns: 88px repeat(3, minmax(0, 1.15fr)) repeat(6, minmax(0, 1fr)) repeat(3, minmax(0, 1.10fr));
        grid-template-rows: 42px minmax(0, 45fr) minmax(0, 15fr) minmax(0, 24fr) 62px;
        grid-template-areas:
          "frame-left frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top"
          "frame-left hero hero hero hero hero side side side side side side side"
          "frame-left cams cams cams tv tv spotify spotify ps5 ps5 ac ac ac"
          "frame-left cams cams cams tv tv spotify spotify ps5 ps5 ac ac ac"
          "frame-left frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom";
        gap: var(--qmiguel-gap);
        padding: 12px;
        background:
          radial-gradient(760px 420px at 16% 2%, rgba(110,150,210,0.12), transparent 72%),
          radial-gradient(680px 420px at 96% 70%, rgba(255,190,120,0.08), transparent 74%),
          #020406;
        overflow: hidden;
      }

      .hero-panel { grid-area: hero; min-width: 0; min-height: 0; }
      .side-panel { grid-area: side; min-width: 0; min-height: 0; display: grid; grid-template-rows: 72px minmax(0, 1fr); gap: var(--qmiguel-gap); }
      .room-sidebar { grid-area: frame-left; }
      .cameras-card { grid-area: cams; }
      .tv-card { grid-area: tv; }
      .ps5-card { grid-area: ps5; }
      .spotify-card { grid-area: spotify; }
      .ac-card { grid-area: ac; }

      /* NOVO (réplica): ponto de montagem do componente REAL do rail. Ocupa a
         coluna frame-left inteira; o próprio componente renderiza o rail. */
      .room-rail-mount {
        grid-area: frame-left;
        min-width: 0;
        min-height: 0;
        position: relative;
        z-index: 3;
      }
      .room-rail-mount > * { height: 100%; }

      /* NOVO: faixas TOPO/RODAPÉ da shell (padrão Câmeras/Roborock: transparente,
         leve). Topo = nome do cômodo centralizado + data/hora à direita.
         Rodapé = presença/última atividade, discreto e centralizado. */
      .subview-topbar {
        grid-area: frame-top;
        display: grid;
        grid-template-columns: 1fr auto 1fr;
        align-items: center;
        gap: 10px;
        padding: 0 10px;
        background: transparent;
      }
      .subview-room {
        grid-column: 2;
        text-align: center;
        font-size: 14px;
        font-weight: 600;
        letter-spacing: 0.04em;
        color: rgba(226,232,240,0.82);
        white-space: nowrap;
      }
      .subview-clock {
        grid-column: 3;
        justify-self: end;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        font-variant-numeric: tabular-nums;
        color: rgba(255,255,255,0.86);
        font-size: 12px;
        line-height: 1;
      }
      .subview-clock small {
        color: rgba(226,232,240,0.55);
        font-size: 10px;
        line-height: 1;
      }
      .subview-footer {
        grid-area: frame-bottom;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 12px;
        background: transparent;
      }
      .subview-presence {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: rgba(226,232,240,0.46);
        font-size: 12px;
        font-weight: 560;
        letter-spacing: 0.02em;
      }
      .subview-presence ha-icon {
        --mdc-icon-size: 16px;
        color: rgba(226,232,240,0.5);
        flex: 0 0 auto;
      }
      /* hero LIMPO: cortina ancorada embaixo */
      .hero-content {
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
      }

      /* NOVO (Caminho 2): cluster CENTRALIZADO, FLAT/integrado (sem pílula/blur),
         com rótulos. Mesma linguagem do rail do painel principal.
         ORIGINAL (pílula glass) preservado no histórico git. */
      .room-sidebar {
        position: relative;
        z-index: 3;
        isolation: isolate;
        align-self: center;
        justify-self: center;
        width: 84px;
        /* CORRECAO: flex em coluna estica os botões à largura total (antes era
           grid sem coluna -> encolhia ao ícone e cortava o rótulo). */
        display: flex;
        flex-direction: column;
        align-items: stretch;
        gap: 10px;
        padding: 8px 1px;
        background: transparent;
        border: none;
        border-radius: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        overflow: visible;
      }

      .room-sidebar::before { display: none; }

      /* NOVO (Caminho 2): botão FLAT — ícone em cima + rótulo embaixo, cor sóbria,
         seleção DISCRETA (sem o azul antigo). */
      .room-nav-button {
        position: relative;
        z-index: 1;
        width: 100%;
        height: auto;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 4px;
        padding: 8px 2px 7px;
        border-radius: 13px;
        color: rgba(255,255,255,0.60);
        background: transparent;
        -webkit-tap-highlight-color: transparent;
        transition: background 160ms ease, color 160ms ease;
      }

      .room-nav-button::after { display: none; }

      .room-nav-button:hover,
      .room-nav-button:focus,
      .room-nav-button:focus-visible {
        color: rgba(255,255,255,0.92);
        background: rgba(255,255,255,0.05);
        outline: none;
      }

      .room-nav-button.is-active {
        color: #fff;
        background: rgba(255,255,255,0.085);
        border: none;
        box-shadow: none;
      }

      .room-nav-button.is-active svg { stroke: rgb(var(--accent)); }

      /* respiro separando o Home dos cômodos */
      .room-nav-home { margin-bottom: 8px; }

      .room-nav-label {
        display: block;
        font-size: 9.5px;
        line-height: 1.05;
        font-weight: 600;
        color: inherit;
        text-align: center;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .room-nav-button svg {
        width: 19px;
        height: 19px;
        display: block;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.55;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
        pointer-events: none;
      }

      .glass-card {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 0;
        border-radius: var(--qmiguel-radius);
        overflow: hidden;
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
        box-shadow: var(--bruno-liquid-surface-off-shadow,
          inset 0 1px 0 rgba(255,255,255,0.18),
          inset 1px 0 0 rgba(255,255,255,0.10),
          inset -1px -1px 0 rgba(255,255,255,0.026),
          0 18px 44px rgba(0,0,0,0.27),
          0 0 24px rgba(110,150,210,0.055)
        );
        transition: background var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1)),
          border-color var(--bruno-liquid-motion-fast, 160ms ease),
          box-shadow var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1));
      }

      .glass-card::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        pointer-events: none;
        border-radius: calc(var(--qmiguel-radius) - 1px);
        background: var(--bruno-liquid-surface-off-sheen,
          radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
          radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
          linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
          linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
        );
        opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
      }

      .glass-card::after {
        content: "";
        position: absolute;
        inset: auto 16px 8px 16px;
        z-index: 0;
        height: 1px;
        pointer-events: none;
        border-radius: 999px;
        background: var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent));
        opacity: var(--bruno-liquid-surface-bottom-line-opacity, 0);
      }

      .glass-card > * {
        position: relative;
        z-index: 1;
      }

      .glass-card.is-active {
        --text-main: rgba(248,251,255,0.96);
        --text-soft: rgba(255,255,255,0.52);
        background: var(--bruno-liquid-surface-on-background,
          radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.38), rgba(255,255,255,0.105) 52%, transparent 75%),
          radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.24), transparent 68%),
          radial-gradient(122px 96px at 27% 18%, rgba(255,232,126,0.105), transparent 71%),
          linear-gradient(180deg, rgba(255,255,255,0.225), rgba(255,255,255,0.073) 43%, rgba(255,255,255,0.108)),
          linear-gradient(155deg, rgba(42,51,65,0.72), rgba(23,28,38,0.58) 52%, rgba(13,16,24,0.44))
        );
        backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
        border-color: var(--bruno-liquid-surface-on-border-color, rgba(255,255,255,0.24));
        box-shadow: var(--bruno-liquid-surface-on-shadow,
          inset 0 1px 0 rgba(255,255,255,0.32),
          inset 1px 0 0 rgba(255,255,255,0.13),
          inset 0 -1px 0 rgba(0,0,0,0.18),
          0 0 22px rgba(255,255,255,0.09),
          0 0 34px rgba(120,170,235,0.10),
          0 18px 42px rgba(0,0,0,0.28)
        );
      }

      .glass-card.is-active::before {
        background: var(--bruno-liquid-surface-on-sheen,
          radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%),
          radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%),
          radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%),
          linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%),
          linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%)
        );
        opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
      }

      .hero-stage {
        position: relative;
        isolation: isolate;
        overflow: visible;
        width: 100%;
        height: 100%;
        min-height: 0;
        color: var(--text-main);
        border-radius: 0;
      }

      .hero-bg {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        top: -18px;
        bottom: -20px;
        left: -16px;
        right: -86px;
        background:
          linear-gradient(90deg,
            rgba(4,10,18,0.82) 0%,
            rgba(5,10,18,0.66) 12%,
            rgba(6,12,20,0.42) 24%,
            rgba(7,13,22,0.22) 38%,
            rgba(7,13,22,0.10) 50%,
            rgba(7,13,22,0.14) 60%,
            rgba(7,13,22,0.30) 70%,
            rgba(7,13,22,0.54) 82%,
            rgba(7,13,22,0.80) 92%,
            rgba(7,13,22,0.94) 100%
          ),
          linear-gradient(180deg,
            rgba(4,8,14,0.78) 0%,
            rgba(4,8,14,0.46) 10%,
            rgba(4,8,14,0.18) 22%,
            rgba(4,8,14,0.04) 34%,
            rgba(4,8,14,0.00) 46%,
            rgba(4,8,14,0.00) 58%,
            rgba(4,8,14,0.10) 72%,
            rgba(4,8,14,0.28) 84%,
            rgba(4,8,14,0.56) 94%,
            rgba(4,8,14,0.78) 100%
          ),
          radial-gradient(680px 220px at 12% 4%, rgba(255,255,255,0.07), transparent 56%),
          radial-gradient(900px 320px at 74% 52%, rgba(255,255,255,0.03), transparent 66%),
          var(--hero-image) left center / auto 100% no-repeat,
          var(--hero-fallback-image) left center / auto 100% no-repeat;
        opacity: 1;
        filter: saturate(1.01) brightness(0.90);
        mask-image:
          linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%),
          linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
        -webkit-mask-image:
          linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%),
          linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
        mask-composite: intersect;
        -webkit-mask-composite: source-in;
      }

      .hero-bg::before,
      .hero-bg::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
      }

      .hero-bg::before {
        background:
          linear-gradient(90deg,
            rgba(4,10,18,0.72) 0%,
            rgba(4,10,18,0.56) 12%,
            rgba(5,10,18,0.34) 24%,
            rgba(5,10,18,0.14) 38%,
            rgba(5,10,18,0.02) 50%,
            rgba(5,10,18,0.08) 60%,
            rgba(5,10,18,0.22) 72%,
            rgba(5,10,18,0.46) 84%,
            rgba(5,10,18,0.74) 100%
          ),
          linear-gradient(180deg,
            rgba(3,8,14,0.62) 0%,
            rgba(3,8,14,0.34) 12%,
            rgba(3,8,14,0.08) 26%,
            rgba(3,8,14,0.00) 40%,
            rgba(3,8,14,0.00) 62%,
            rgba(3,8,14,0.10) 76%,
            rgba(3,8,14,0.30) 90%,
            rgba(3,8,14,0.60) 100%
          );
      }

      .hero-bg::after {
        background:
          radial-gradient(720px 220px at 8% 2%, rgba(255,255,255,0.08), transparent 58%),
          linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%),
          linear-gradient(0deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00) 34%);
        opacity: 0.58;
      }

      .hero-content {
        position: relative;
        z-index: 1;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto minmax(0, 1fr) auto;
        padding: 16px 18px 14px;
        gap: 10px;
      }

      .hero-top {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .back-button,
      .control-button {
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
      }

      .back-button ha-icon,
      .control-button ha-icon {
        --mdc-icon-size: 18px;
      }

      .hero-title,
      .module-title {
        font-size: 13px;
        line-height: 1.05;
        font-weight: 800;
        color: var(--text-main);
        white-space: nowrap;
      }

      .hero-subtitle,
      .module-subtitle {
        margin-top: 4px;
        font-size: 11px;
        line-height: 1;
        font-weight: 600;
        color: var(--text-soft);
      }

      .hero-headline {
        grid-column: 1;
        grid-row: 2;
        align-self: start;
        justify-self: start;
        margin-top: 20px;
      }

      .hero-date-line {
        margin: 0 0 11px;
        color: rgba(255,255,255,0.54);
        font-size: 11px;
        line-height: 1;
        font-weight: 700;
        text-transform: uppercase;
      }

      .hero-clock {
        margin-top: 14px;
        font-size: clamp(56px, 7.4vh, 78px);
        line-height: 0.96;
        font-weight: 220;
        font-variant-numeric: tabular-nums;
        color: rgba(255,255,255,0.95);
        text-shadow: 0 10px 32px rgba(0,0,0,0.28);
      }

      .chip-button,
      .online-chip,
      .state-chip {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        color: rgba(255,255,255,0.86);
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        white-space: nowrap;
      }

      .chip-button.is-active,
      .online-chip {
        background: rgba(24,134,190,0.36);
        border-color: rgba(96,190,255,0.46);
      }

      .curtain-dock {
        --curtain-gold-rgb: var(--bruno-liquid-warm-accent, 242,194,102);
        --curtain-gold: rgb(var(--curtain-gold-rgb));
        grid-row: 3;
        grid-column: 1 / -1;
        align-self: end;
        display: grid;
        grid-template-columns: 1fr;
        gap: 11px;
        width: min(540px, 100%);
        padding: 0;
        border-radius: 0;
        background: transparent;
        border: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .curtain-control-row {
        display: grid;
        grid-template-columns: minmax(94px, auto) minmax(96px, 1fr) auto;
        align-items: center;
        gap: 18px;
        min-width: 0;
      }

      .curtain-identity,
      .title-with-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .curtain-icon-shell {
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border-radius: 50%;
        background:
          radial-gradient(circle at 50% 0%, rgba(255,255,255,0.17), rgba(255,255,255,0.04) 56%, rgba(0,0,0,0.18)),
          rgba(18,20,21,0.52);
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        backdrop-filter: blur(12px) saturate(1.18);
        -webkit-backdrop-filter: blur(12px) saturate(1.18);
      }

      .curtain-title {
        font-size: 13px;
        line-height: 1.05;
        font-weight: 800;
        letter-spacing: 0;
        color: rgba(255,255,255,0.96);
        white-space: nowrap;
      }

      .curtain-status {
        justify-self: center;
        display: flex;
        align-items: center;
        gap: 5px;
        min-width: 0;
        font-size: 13px;
        line-height: 1.05;
        font-weight: 800;
        white-space: nowrap;
      }

      .curtain-status-text {
        color: var(--curtain-gold);
      }

      .curtain-status-percent {
        color: rgba(255,255,255,0.78);
        font-weight: 800;
      }

      .curtain-main-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 7px;
        min-width: 0;
      }

      .curtain-action-button {
        width: 76px;
        height: 36px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 0 9px;
        border-radius: var(--bruno-liquid-control-radius-compact, 9px);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.15));
        background: var(--bruno-liquid-control-background,
          linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)),
          rgba(255,255,255,0.030)
        );
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
        color: rgba(255,255,255,0.88);
        font-size: 11.5px;
        font-weight: 700;
        letter-spacing: 0;
        white-space: nowrap;
      }

      .curtain-action-button.is-muted {
        color: rgba(255,255,255,0.88);
      }

      .curtain-action-button.is-active {
        color: var(--curtain-gold);
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
        background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
        box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
      }

      .curtain-action-button:active {
        transform: translateY(1px);
        color: var(--curtain-gold);
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
        background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
      }

      .curtain-action-button:disabled,
      .curtain-mark:disabled,
      .curtain-range:disabled {
        opacity: 0.46;
        cursor: not-allowed;
      }

      .curtain-svg {
        display: block;
        fill: rgba(255,255,255,0.70);
        stroke: rgba(255,255,255,0.58);
        stroke-width: 2.1;
        stroke-linecap: round;
        stroke-linejoin: round;
        flex: 0 0 auto;
      }

      .curtain-svg.is-main {
        fill: rgba(255,255,255,0.78);
        stroke: rgba(255,255,255,0.54);
      }

      .curtain-svg.is-stop {
        fill: rgba(255,255,255,0.64);
        stroke: rgba(255,255,255,0.54);
      }

      .curtain-slider-zone {
        position: relative;
        display: grid;
        gap: 0;
        min-width: 0;
      }

      .curtain-slider-glow {
        position: absolute;
        left: 0;
        top: -3px;
        width: var(--curtain-position);
        height: 8px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.11), rgba(var(--curtain-gold-rgb),0.020));
        filter: blur(8px);
        pointer-events: none;
      }

      .curtain-range {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 3px;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.055);
        background:
          linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62) 0 var(--curtain-position), rgba(var(--curtain-gold-rgb),0.24) var(--curtain-position), rgba(255,255,255,0.11) var(--curtain-position) 100%);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.24);
        cursor: pointer;
        accent-color: var(--curtain-gold);
      }

      .curtain-range::-webkit-slider-runnable-track {
        height: 3px;
        border-radius: 999px;
        background: transparent;
      }

      .curtain-range::-webkit-slider-thumb {
        width: 12px;
        height: 12px;
        margin-top: -4.5px;
        -webkit-appearance: none;
        appearance: none;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.30);
        background:
          radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
        box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
      }

      .curtain-range::-moz-range-track {
        height: 3px;
        border-radius: 999px;
        background: transparent;
      }

      .curtain-range::-moz-range-progress {
        height: 3px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62), rgba(var(--curtain-gold-rgb),0.24));
      }

      .curtain-range::-moz-range-thumb {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.30);
        background:
          radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
        box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
      }

      .curtain-marks {
        position: relative;
        z-index: 2;
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        margin-top: 7px;
      }

      .curtain-mark {
        position: relative;
        min-width: 0;
        height: 22px;
        padding: 8px 0 0;
        border: 0;
        background: transparent;
        color: rgba(255,255,255,0.42);
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0;
        cursor: pointer;
      }

      .curtain-mark::before {
        content: "";
        position: absolute;
        top: 1px;
        left: 50%;
        width: 1px;
        height: 4px;
        transform: translateX(-50%);
        border-radius: 999px;
        background: rgba(255,255,255,0.28);
      }

      .curtain-mark.is-active {
        color: var(--curtain-gold);
      }

      .curtain-mark.is-active::before {
        background: rgba(var(--curtain-gold-rgb),0.72);
      }

      .module-icon,
      .micro-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.09);
        border: 1px solid rgba(255,255,255,0.13);
        color: rgba(210,225,240,0.82);
      }

      .module-icon ha-icon,
      .micro-icon ha-icon {
        --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
      }

      .soft-button,
      .primary-button {
        min-height: 36px;
        padding: 0 14px;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
        color: rgba(255,255,255,0.88);
        font-size: 12px;
        font-weight: 800;
      }

      .soft-button.is-primary,
      .primary-button {
        background: var(--bruno-liquid-control-blue-background, rgba(24,134,190,0.42));
        border-color: var(--bruno-liquid-control-blue-border, rgba(96,190,255,0.50));
        box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.18));
      }

      .status-rail {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 0;
        padding: 0;
      }

      .status-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        min-width: 0;
        gap: 8px;
        padding: 0 13px;
        border-right: 1px solid rgba(255,255,255,0.08);
      }

      .status-item:last-child {
        border-right: 0;
      }

      .status-item strong {
        display: block;
        font-size: 13px;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .status-item span:not(.micro-icon) {
        display: block;
        margin-top: 4px;
        font-size: 10px;
        line-height: 1;
        color: var(--text-soft);
      }

      .status-chevron {
        --mdc-icon-size: 17px;
        color: rgba(255,255,255,0.58);
      }

      .micro-icon.tone-amber {
        color: rgb(255,183,77);
        background: rgba(255,183,77,0.10);
        border-color: rgba(255,183,77,0.22);
      }

      .micro-icon.tone-blue {
        color: rgb(180,215,255);
        background: rgba(96,165,250,0.10);
        border-color: rgba(96,165,250,0.20);
      }

      .lights-card,
      .cameras-card,
      .tv-card,
      .ps5-card,
      .spotify-card,
      .ac-card {
        padding: 14px;
      }

      .lights-card {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 7px;
      }

      .module-head {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 34px;
        margin-bottom: 8px;
      }

      .lights-card .module-head {
        min-height: 30px;
        margin-bottom: 0;
      }

      .head-actions {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .all-label {
        color: rgb(255,154,18);
        font-size: 11px;
        font-weight: 900;
      }

      .chip-button {
        min-width: 52px;
      }

      .lights-groups {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
        align-items: stretch;
        min-height: 0;
        height: 100%;
        gap: 12px;
      }

      .light-group {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 6px;
      }

      .light-group-label {
        color: rgba(255,255,255,0.54);
        font-size: 10px;
        line-height: 1;
        font-weight: 900;
        text-transform: uppercase;
      }

      .lights-divider {
        align-self: stretch;
        width: 1px;
        border-radius: 999px;
        background: linear-gradient(180deg, transparent, rgba(255,255,255,0.16), rgba(255,183,77,0.26), rgba(255,255,255,0.12), transparent);
        box-shadow: 0 0 14px rgba(255,183,77,0.10);
      }

      .light-group-grid {
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .light-tile {
        position: relative;
        display: grid;
        grid-template-columns: 66px minmax(0, 1fr);
        grid-template-rows: auto auto;
        grid-template-areas:
          "icon title"
          "icon status";
        align-items: center;
        align-content: center;
        column-gap: 15px;
        padding: 13px 16px;
        text-align: left;
        border-radius: var(--qmiguel-cell-radius);
        color: rgba(255,255,255,0.86);
        background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.055));
        border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.11));
        box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.08));
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .light-tile.is-on {
        color: rgba(255,255,255,0.98);
        background: var(--bruno-liquid-cell-active-warm-background,
          radial-gradient(76px 48px at 18% 12%, rgba(255,255,255,0.28), transparent 72%),
          radial-gradient(96px 58px at 94% 82%, rgba(255,183,77,0.24), transparent 72%),
          linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.074)),
          linear-gradient(180deg, rgba(255,183,77,0.10), rgba(255,183,77,0.03))
        );
        border-color: var(--bruno-liquid-cell-active-warm-border, rgba(255,205,95,0.44));
        box-shadow: var(--bruno-liquid-cell-active-warm-shadow,
          inset 0 1px 0 rgba(255,255,255,0.22),
          inset 1px 0 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.08),
          0 0 20px rgba(255,183,77,0.17)
        );
      }

      .lights-body {
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 10px;
      }

      .lights-zone-rail {
        position: relative;
        min-height: 0;
        display: none;
        grid-template-rows: auto minmax(0, 1fr) auto;
        justify-items: center;
        gap: 10px;
        padding: 9px 7px;
        overflow: hidden;
        border-radius: var(--qmiguel-cell-radius);
        color: rgba(255,255,255,0.74);
        background:
          linear-gradient(145deg, rgba(255,255,255,0.072), rgba(255,255,255,0.026)),
          rgba(8,14,26,0.50);
        border: 1px solid rgba(255,224,160,0.13);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.13),
          inset 0 -1px 0 rgba(255,200,100,0.045),
          0 12px 26px rgba(0,0,0,0.20);
        backdrop-filter: blur(22px) saturate(1.34);
        -webkit-backdrop-filter: blur(22px) saturate(1.34);
      }

      .lights-zone-rail::before {
        content: "";
        position: absolute;
        inset: 1px;
        pointer-events: none;
        border-radius: calc(var(--qmiguel-cell-radius) - 1px);
        background:
          radial-gradient(52px 78px at 50% 20%, rgba(255,191,74,0.10), transparent 66%),
          linear-gradient(135deg, rgba(255,255,255,0.11), transparent 34%, transparent 70%, rgba(255,188,65,0.05));
        opacity: 0.88;
      }

      .rail-zone,
      .rail-state,
      .rail-track {
        position: relative;
        z-index: 1;
      }

      .rail-zone {
        font-size: 10px;
        line-height: 1;
        font-weight: 900;
        color: rgba(255,231,176,0.68);
        text-shadow: 0 1px 2px rgba(0,0,0,0.34);
      }

      .rail-state {
        min-width: 36px;
        min-height: 21px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 999px;
        color: rgba(255,205,95,0.95);
        font-size: 11px;
        font-weight: 900;
        background: rgba(255,183,77,0.10);
        border: 1px solid rgba(255,183,77,0.20);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.12),
          0 0 calc(14px * var(--rail-glow, 0)) rgba(255,183,77,0.18);
      }

      .rail-state strong {
        font-size: 11px;
        color: rgba(255,235,177,0.98);
      }

      .rail-track {
        position: relative;
        width: 42px;
        height: 100%;
        min-height: 124px;
        overflow: hidden;
        border-radius: 999px;
        background:
          linear-gradient(180deg, rgba(255,245,210,0.10), rgba(255,196,83,0.035)),
          radial-gradient(circle at 50% 8%, rgba(255,255,255,0.16), transparent 30%),
          rgba(8,15,28,0.72);
        border: 1px solid rgba(255,222,152,0.30);
        box-shadow:
          inset 0 0 16px rgba(255,228,170,0.10),
          inset 6px 0 14px rgba(255,255,255,0.035),
          inset -8px 0 16px rgba(0,0,0,0.28),
          0 0 calc(18px * var(--rail-glow, 0)) rgba(255,187,67,0.18),
          0 0 calc(42px * var(--rail-glow, 0)) rgba(255,158,35,0.12);
      }

      .rail-track::before {
        content: "";
        position: absolute;
        inset: 4px;
        border-radius: inherit;
        border: 1px solid rgba(255,255,255,0.08);
        pointer-events: none;
        z-index: 4;
      }

      .rail-track::after {
        content: "";
        position: absolute;
        top: 11px;
        left: 10px;
        width: 13px;
        height: 72%;
        border-radius: 999px;
        background: linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.034), transparent);
        opacity: 0.42;
        pointer-events: none;
        z-index: 5;
        filter: blur(0.2px);
      }

      .rail-fill {
        position: absolute;
        left: 5px;
        right: 5px;
        bottom: 5px;
        height: calc((100% - 10px) * var(--rail-fill-ratio, 0));
        min-height: calc(24px * var(--rail-glow, 0));
        border-radius: 999px;
        background:
          radial-gradient(circle at 40% 12%, rgba(255,255,255,0.95), transparent 20%),
          linear-gradient(180deg, #fff6c9 0%, #ffe18a 24%, #ffc247 58%, #ff9f1f 100%);
        box-shadow:
          0 0 calc(16px * var(--rail-glow, 0)) rgba(255,226,138,0.70),
          0 0 calc(34px * var(--rail-glow, 0)) rgba(255,184,61,0.44),
          0 0 calc(64px * var(--rail-glow, 0)) rgba(255,145,31,0.25);
        opacity: var(--rail-glow, 0);
        transition:
          height 550ms cubic-bezier(.22,.9,.32,1),
          min-height 350ms ease,
          opacity 350ms ease,
          box-shadow 450ms ease;
      }

      .rail-fill::before {
        content: "";
        position: absolute;
        top: 0;
        left: 6px;
        right: 6px;
        height: 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.82);
        filter: blur(3px);
        opacity: 0.90;
      }

      .rail-fill::after {
        content: "";
        position: absolute;
        inset: 0;
        border-radius: inherit;
        background: linear-gradient(90deg, rgba(255,255,255,0.25), transparent 38%, rgba(255,255,255,0.18));
        opacity: 0.70;
        mix-blend-mode: screen;
      }

      .rail-ambient-glow {
        position: absolute;
        left: 50%;
        bottom: 20px;
        width: 86px;
        height: var(--rail-ambient-height, 22px);
        transform: translateX(-50%);
        border-radius: 999px;
        background: radial-gradient(ellipse at center, rgba(255,183,55,0.30), rgba(255,139,22,0.12), transparent 72%);
        filter: blur(16px);
        opacity: var(--rail-glow, 0);
        pointer-events: none;
        transition:
          height 550ms cubic-bezier(.22,.9,.32,1),
          opacity 350ms ease;
      }

      .rail-dimmer-ghost {
        position: absolute;
        inset: 7px;
        border-radius: inherit;
        border: 1px dashed rgba(255,255,255,0.12);
        opacity: 0;
        pointer-events: none;
      }

      .light-tile.is-placeholder {
        opacity: 0.55;
      }

      .light-tile:hover,
      .camera-thumb-overlay:hover,
      .soft-button:hover,
      .control-button:hover {
        transform: translateY(-1px);
      }

      .light-icon {
        grid-area: icon;
        position: relative;
        width: 62px;
        height: 62px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        --light-color: var(--state-icon-color, #9da0a2);
        color: rgba(255,255,255,0.74);
      }

      .light-tile.is-on .light-icon {
        --light-color: var(--state-icon-active-color, #f0c040);
        color: rgb(255,210,86);
        filter: drop-shadow(0 0 10px rgba(255,183,77,0.34));
      }

      .tpl-light-icon {
        position: relative;
        width: 100%;
        height: 100%;
        display: block;
        color: var(--light-color);
      }

      .tpl-light-icon svg {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
      }

      .tpl-light-icon .light-color {
        fill: var(--light-color);
      }

      .tpl-light-icon .flush-beam {
        transform-origin: -100% 46%;
        animation: bruno-light-flush-on 2s ease forwards;
      }

      .tpl-light-icon .pendant-swing {
        transform-box: fill-box;
        transform-origin: top center;
        animation: bruno-light-pendant-on 1.7s ease-in-out;
      }

      .tpl-light-glow {
        position: absolute;
        inset: 3px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(255,214,99,0.45), transparent 68%);
        filter: blur(7px);
        opacity: 0.95;
      }

      @keyframes bruno-light-flush-on {
        from { transform: scaleY(0); }
        to { transform: scaleY(1); }
      }

      @keyframes bruno-light-pendant-on {
        0% { transform: rotateZ(0deg); }
        23% { transform: rotateZ(-10deg); }
        56% { transform: rotateZ(10deg); }
        70% { transform: rotateZ(-2deg); }
        85% { transform: rotateZ(2deg); }
        100% { transform: rotateZ(0deg); }
      }

      .light-tile strong {
        grid-area: title;
        min-width: 0;
        align-self: end;
        font-size: 14.5px;
        line-height: 1.12;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .light-tile small {
        grid-area: status;
        min-width: 0;
        color: rgba(255,205,95,0.92);
        font-size: 12px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .cameras-card {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 10px;
      }

      .online-chip span,
      .state-chip span,
      .live-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: #2ee77a;
        box-shadow: 0 0 10px rgba(46,231,122,0.5);
      }

      .camera-stage {
        position: relative;
        z-index: 1;
        min-height: 0;
        height: 100%;
      }

      .camera-main {
        position: relative;
        min-width: 0;
        min-height: 0;
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        overflow: hidden;
        border-radius: var(--qmiguel-radius-small);
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.11);
        text-align: left;
      }

      .camera-row-image {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: var(--qmiguel-radius-small);
        background: radial-gradient(circle at 50% 45%, rgba(70,86,116,0.20), rgba(5,9,20,0.84));
      }

      .camera-row-image img,
      .poster-card img,
      .spotify-art img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .camera-row-image img {
        z-index: 1;
        filter: brightness(0.86) saturate(0.94);
      }

      .camera-live {
        position: absolute;
        inset: 0;
        z-index: 1;
        overflow: hidden;
        background: transparent;
      }

      .camera-live > *,
      .camera-live hui-image,
      .camera-live-el {
        display: block;
        width: 100% !important;
        height: 100% !important;
      }

      .camera-live video,
      .camera-live img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      .camera-placeholder {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255,255,255,0.18);
      }

      .camera-placeholder ha-icon {
        display: none;
        --mdc-icon-size: 36px;
      }

      .camera-main::after,
      .camera-thumb-overlay::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: linear-gradient(90deg, rgba(4,8,16,0.52), rgba(4,8,16,0.10) 68%, rgba(4,8,16,0.42));
      }

      .camera-row-copy,
      .camera-chevron {
        position: absolute;
        z-index: 2;
      }

      .camera-row-copy {
        left: 14px;
        bottom: 14px;
        display: grid;
        gap: 4px;
      }

      .camera-row-copy strong {
        font-size: 17px;
      }

      .camera-row-copy span,
      .camera-thumb-name {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        font-size: 11px;
        font-weight: 800;
      }

      .camera-chevron {
        right: 14px;
        top: 14px;
        --mdc-icon-size: 19px;
        color: rgba(255,255,255,0.82);
      }

      .camera-thumb-overlay {
        position: absolute;
        z-index: 3;
        right: 12px;
        bottom: 12px;
        width: min(44%, 158px);
        aspect-ratio: 16 / 10;
        overflow: hidden;
        border-radius: 14px;
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.10),
          0 10px 26px rgba(0,0,0,0.36);
        text-align: left;
      }

      .camera-thumb-overlay .camera-row-image {
        border-radius: 14px;
      }

      .camera-thumb-overlay::after {
        background: linear-gradient(180deg, rgba(3,8,15,0.06), rgba(3,8,15,0.74));
      }

      .camera-thumb-overlay span {
        position: absolute;
        z-index: 4;
        left: 10px;
        bottom: 7px;
        max-width: calc(100% - 20px);
        color: rgba(255,255,255,0.92);
        font-size: 10px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .tv-card,
      .ps5-card,
      .spotify-card,
      .ac-card {
        min-height: 0;
      }

      .tv-body,
      .ac-body {
        position: relative;
        z-index: 1;
        height: calc(100% - 46px);
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
        align-items: stretch;
      }

      .tv-main,
      .spotify-copy,
      .ac-main,
      .ps5-copy {
        min-width: 0;
      }

      .media-source {
        margin-top: 2px;
        color: white;
        font-size: 16px;
        font-weight: 800;
      }

      .media-title {
        margin-top: 8px;
        color: white;
        font-size: 15px;
        line-height: 1.1;
        font-weight: 800;
      }

      .media-subtitle {
        margin-top: 5px;
        color: var(--text-soft);
        font-size: 12px;
        font-weight: 600;
      }

      .control-row {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 0;
      }

      .control-button.is-main {
        color: white;
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%),
          linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58))
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
        box-shadow: var(--bruno-liquid-control-blue-shadow,
          inset 0 1px 0 rgba(255,255,255,0.22),
          0 0 22px rgba(96,165,250,0.24)
        );
      }

      .control-button.is-tool {
        color: rgba(210,245,230,0.96);
        background: var(--bruno-liquid-control-green-background,
          radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%),
          rgba(255,255,255,0.075)
        );
        border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
        box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
      }

      .volume-row {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) 38px;
        align-items: center;
        gap: 9px;
        margin-top: 0;
        color: rgba(255,255,255,0.66);
      }

      .volume-row ha-icon {
        --mdc-icon-size: 15px;
      }

      .volume-row strong {
        color: rgba(255,255,255,0.88);
        font-size: 13px;
        font-weight: 800;
      }

      .volume-row input {
        width: 100%;
        min-width: 0;
        accent-color: rgb(28,214,104);
      }

      .poster-card {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--qmiguel-radius-small);
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.12);
        color: var(--text-dim);
        overflow: hidden;
        font-size: 12px;
        font-weight: 800;
      }

      .tv-card .poster-card,
      .spotify-art {
        /* PADRÃO QUADRADO FIXO da arte (TV e Spotify): largura segue a altura. */
        aspect-ratio: 1 / 1;
        height: var(--media-screen-height, 150px);
        min-height: var(--media-screen-height, 150px);
        max-height: var(--media-screen-height, 150px);
        width: auto;
        max-width: 100%;
        justify-self: center;
      }

      .tv-card .tv-body {
        grid-template-rows: var(--media-screen-height, 154px) auto;
      }

      .tv-card .poster-card {
        grid-row: 1;
        min-height: 0;
      }

      .tv-card .tv-main {
        grid-row: 2;
      }

      .tv-card .control-row {
        margin-top: 0;
      }

      .ps5-body {
        position: relative;
        z-index: 1;
        height: calc(100% - 46px);
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: minmax(116px, 1fr) auto;
        gap: 10px;
        align-items: stretch;
      }

      .ps5-minimal {
        gap: 8px;
      }

      .ps5-copy {
        grid-row: 2;
        display: grid;
        align-content: end;
        gap: 9px;
        height: 100%;
      }

      .ps5-copy > strong {
        align-self: end;
        color: rgb(45,225,118);
        font-size: 15px;
        font-weight: 800;
      }

      .ps5-meta {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .ps5-image {
        grid-row: 1;
        justify-self: center;
        align-self: center;
        width: 100%;
        max-height: 100%;
        object-fit: contain;
        transform: scale(1.08);
        filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
      }

      .ps5-footer {
        min-height: 0;
        display: grid;
        gap: 9px;
      }

      .device-state {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        width: fit-content;
        color: rgba(255,255,255,0.82);
        font-size: 11px;
        font-weight: 800;
      }

      .ps5-actions {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 40px;
        gap: 8px;
      }

      .ps5-meta span,
      .ac-meta span {
        display: grid;
        gap: 4px;
        min-width: 0;
        padding: 10px 11px;
        border-radius: 12px;
        color: var(--text-soft);
        font-size: 11px;
        background: rgba(255,255,255,0.052);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .ps5-meta strong,
      .ac-meta strong {
        color: white;
        min-width: 0;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .spotify-card {
        padding: 14px;
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 10px;
      }

      .spotify-body {
        position: relative;
        z-index: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr;
        /* ANTERIOR (rollback): grid-template-rows: var(--media-screen-height, 154px) auto; */
        /* NOVO — 1a faixa acompanha a arte quadrada (auto) em vez de altura fixa. */
        grid-template-rows: auto auto;
        align-items: stretch;
        gap: 8px;
      }

      /* ANTERIOR (rollback) — arte com altura fixa (154px) desacoplada da largura:
         virava retângulo quando a geometria do cartão mudou (E1).
      .spotify-art {
        position: relative;
        inset: auto;
        width: 100%;
        height: var(--media-screen-height, 154px);
        min-height: var(--media-screen-height, 154px);
        max-height: var(--media-screen-height, 154px);
        justify-self: center;
        display: flex;
        align-items: center;
        justify-content: center;
        ...
      }
      */
      /* NOVO — caixa da arte é QUADRADA (aspect-ratio 1/1), dimensionada pela
         altura disponível e centrada na coluna; largura segue a altura. */
      .spotify-art {
        position: relative;
        inset: auto;
        aspect-ratio: 1 / 1;
        height: var(--media-screen-height, 168px);
        min-height: var(--media-screen-height, 168px);
        max-height: var(--media-screen-height, 168px);
        width: auto;
        max-width: 100%;
        justify-self: center;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--qmiguel-radius-small);
        background:
          radial-gradient(circle at 50% 45%, rgba(96,165,250,0.14), transparent 42%),
          rgba(5,10,20,0.72);
        overflow: hidden;
        color: rgba(255,255,255,0.22);
      }

      .spotify-art.has-art::after {
        content: "";
        position: absolute;
        inset: 0;
        background: linear-gradient(180deg, transparent 64%, rgba(2,8,18,0.46));
      }

      .spotify-art ha-icon {
        --mdc-icon-size: 70px;
      }

      .spotify-copy {
        display: grid;
        align-content: start;
        gap: 8px;
      }

      .spotify-card .media-title {
        margin-top: 0;
      }

      .spotify-card .media-subtitle {
        margin-top: -4px;
      }

      .spotify-controls {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 0;
      }

      .tv-card .control-button,
      .spotify-controls .control-button {
        width: 36px;
        height: 36px;
        border-radius: 13px;
      }

      .state-chip {
        align-self: start;
        min-height: 28px;
      }

      .ac-body {
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto auto minmax(64px, 1fr);
        gap: 8px;
        align-content: start;
      }

      .temperature-pill {
        align-self: start;
        min-width: 58px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 7px 12px;
        border-radius: 999px;
        color: rgba(255,255,255,0.92);
        font-size: 14px;
        line-height: 1;
        font-weight: 800;
        background: rgba(255,255,255,0.070);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
      }

      .temperature-slider {
        min-width: 0;
        width: 100%;
        display: block;
        align-items: center;
        padding: 0;
        background: transparent;
        border: 0;
      }

      .temperature-slider input {
        width: 100%;
        min-width: 0;
        accent-color: rgb(96,165,250);
      }

      .fan-label {
        display: block;
        color: rgba(255,255,255,0.90);
        font-size: 13px;
        font-weight: 800;
      }

      .climate-mode-row,
      .fan-mode-row {
        display: grid;
        gap: 8px;
      }

      .climate-mode-row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .fan-mode-row {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }

      .climate-mode,
      .fan-mode,
      .climate-stepper {
        /* ANTERIOR (rollback): min-height: 34px; */
        min-height: 38px;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.09));
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.050));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.06));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
      }

      .climate-mode:disabled,
      .fan-mode:disabled {
        opacity: 0.42;
        cursor: default;
      }

      .climate-mode {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: rgba(255,255,255,0.66);
      }

      .climate-mode ha-icon {
        --mdc-icon-size: 17px;
      }

      .climate-mode.is-active {
        color: white;
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 14%, rgba(96,183,255,0.34), transparent 72%),
          rgba(38,92,154,0.42)
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.34));
        box-shadow: var(--bruno-liquid-control-blue-shadow,
          inset 0 1px 0 rgba(255,255,255,0.14),
          0 0 14px rgba(96,165,250,0.16)
        );
      }

      .climate-mode.is-power-on {
        color: rgba(255,255,255,0.96);
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%),
          rgba(38,92,138,0.38)
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
        box-shadow: var(--bruno-liquid-control-blue-shadow,
          inset 0 1px 0 rgba(255,255,255,0.12),
          0 0 14px rgba(96,165,250,0.16)
        );
      }

      .climate-stepper {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 42px;
        align-items: center;
        overflow: hidden;
      }

      .climate-stepper button {
        /* ANTERIOR (rollback): height: 34px; */
        height: 38px;
        background: transparent;
        color: rgba(255,255,255,0.82);
        font-size: 17px;
      }

      .climate-stepper span {
        text-align: center;
        color: rgba(255,255,255,0.88);
        font-size: 13px;
        font-weight: 800;
      }

      .fan-label {
        margin-top: 3px;
        font-size: 12px;
      }

      .fan-mode {
        color: rgba(255,255,255,0.74);
        font-size: 11px;
        font-weight: 800;
        min-height: 30px;
      }

      .fan-mode.is-active {
        color: rgba(255,255,255,0.94);
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 14%, rgba(96,183,255,0.24), transparent 72%),
          rgba(38,92,154,0.32)
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.28));
        box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14));
      }

      .climate-mode:active,
      .fan-mode:active,
      .climate-stepper button:active {
        transform: translateY(1px);
        border-color: rgba(96,183,255,0.42);
      }

      .climate-trend {
        min-height: 0;
        height: 104px;
        margin: -8px -14px -14px;
        border-radius: 0 0 calc(var(--qmiguel-radius) - 1px) calc(var(--qmiguel-radius) - 1px);
        overflow: hidden;
        background: transparent;
      }

      .climate-trend svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      .trend-area {
        fill: rgba(96,165,250,0.16);
      }

      .trend-line {
        fill: none;
        stroke: rgba(96,165,250,0.76);
        stroke-width: 2.35;
        stroke-linecap: round;
        filter: drop-shadow(0 0 8px rgba(96,165,250,0.32));
      }

      .spotify-volume {
        margin-top: 0;
      }

      .tv-card,
      .spotify-card {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        overflow: hidden;
      }

      .tv-body,
      .spotify-body {
        height: auto;
        min-height: 0;
        grid-template-columns: 1fr;
        grid-template-rows: var(--media-screen-height, 154px) auto;
        gap: 8px;
        align-items: stretch;
      }

      .tv-main,
      .spotify-copy {
        display: grid;
        grid-template-rows: 36px 24px;
        align-content: start;
        gap: 8px;
        padding-top: 12px;
        min-width: 0;
        overflow: hidden;
      }

      .tv-card .control-row,
      .spotify-controls {
        margin-top: 2px;
      }

      .tv-card .volume-row,
      .spotify-volume {
        margin-top: 2px;
      }

      .media-source {
        font-size: 14px;
      }

      .spotify-card .media-title,
      .spotify-title {
        max-width: 100%;
        min-width: 0;
        font-size: 13px;
        line-height: 1.05;
        white-space: nowrap;
        overflow: hidden;
      }

      .spotify-title span {
        display: inline-block;
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: top;
      }

      .spotify-title.is-marquee span {
        max-width: none;
        min-width: 100%;
        padding-right: 34px;
        animation: bruno-qmiguel-marquee 10s linear infinite;
      }

      .spotify-card .media-subtitle {
        margin-top: -2px;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .state-chip {
        max-width: 76px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      @keyframes bruno-qmiguel-marquee {
        0%, 18% { transform: translateX(0); }
        82%, 100% { transform: translateX(calc(-100% + 100px)); }
      }

      @media (max-width: 1180px) {
        .room-sidebar {
          display: none;
        }

        .quarto-miguel-subview {
          height: auto;
          overflow: auto;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: minmax(330px, 46vh) minmax(360px, auto) repeat(2, minmax(300px, auto));
          grid-template-areas:
            "hero side"
            "cams cams"
            "tv spotify"
            "ps5 ac";
        }

        .side-panel {
          grid-template-rows: auto minmax(0, 1fr);
        }

        .status-rail {
          grid-template-columns: repeat(5, minmax(0, 1fr));
        }

        .status-item {
          padding: 0 10px;
        }
      }

      @media (max-width: 760px) {
        :host {
          height: auto;
          overflow: visible;
        }

        .quarto-miguel-subview {
          grid-template-columns: 1fr;
          grid-template-rows: auto;
          grid-template-areas:
            "hero"
            "side"
            "cams"
            "tv"
            "spotify"
            "ps5"
            "ac";
          padding: 8px;
        }

        .hero-stage {
          min-height: 430px;
        }

        .hero-content {
          grid-template-columns: 1fr;
        }

        .hero-clock {
          font-size: 70px;
        }

        .status-rail {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .status-item:nth-child(even) {
          border-right: 0;
        }

        .curtain-dock {
          grid-template-columns: 1fr;
        }

        .curtain-control-row {
          grid-template-columns: 1fr;
          align-items: stretch;
          gap: 10px;
        }

        .curtain-status {
          justify-self: start;
        }

        .curtain-main-actions {
          justify-content: stretch;
        }

        .curtain-action-button {
          flex: 1 1 0;
          min-width: 0;
        }

        .side-panel {
          grid-template-rows: auto;
        }

        .lights-groups {
          height: auto;
          grid-template-columns: 1fr;
        }

        .lights-divider {
          display: none;
        }

        .light-group-grid {
          grid-template-rows: none;
          grid-auto-rows: minmax(94px, auto);
        }

        .cameras-card {
          min-height: 390px;
        }

        .tv-card,
        .ps5-card,
        .spotify-card,
        .ac-card {
          min-height: 260px;
        }

        .spotify-card {
          min-height: 360px;
        }

        .tv-body,
        .ac-body {
          grid-template-columns: 1fr;
        }
      }

      /* GRID ATIVO. NOVO (Caminho 2): rail 56px -> 88px (acomoda rótulos) e
         adicionadas as faixas TOPO/RODAPÉ da shell (frame-top/frame-bottom),
         com o rail (frame-left) atravessando as 3 linhas (cluster centralizado).
         ORIGINAL: rail 56px, linha única "frame-left left right", shell-height
         min(734px, 100vh-34px). */
      /* NOVO (Etapa B): SEÇÃO da shell (conteúdo-only). SEM coluna frame-left (o
         rail é da shell). Preenche o content-slot (height 100%). Régua das faixas
         = a do painel principal: superior 48px, inferior 74px. Padding 0 (o
         content-slot da shell já dá 12px de respiro). */
      /* NOVO (full-bleed subview, Passada 1): topband full-width + conteúdo
         (hero/cortina/[câmeras|mídia]) à esquerda + direita (Iluminação/AC).
         ANTERIOR (rollback): grid "frame-top / left right / frame-bottom",
         colunas minmax(420,540)+minmax(630,1fr), linhas 48/1fr/54. */
      .quarto-miguel-subview {
        /* Igual ao painel principal (section_home grid-gap: 10px) — padronização
           da régua. ANTERIOR: 12px. */
        --qmiguel-gap: 10px;
        display: grid;
        height: 100%;
        min-height: 0;
        grid-template-columns: minmax(0, 1.62fr) minmax(360px, 0.66fr);
        /* Régua da shell (igual ao painel principal): topo 48px, base 54px. */
        grid-template-rows: 48px minmax(0, 1fr) 54px;
        grid-template-areas:
          "topband    topband"
          "content    right"
          "bottomband bottomband";
        align-items: stretch;
        gap: var(--qmiguel-gap);
        padding: 0;
        background: transparent;
      }

      .content-left,
      .right-column {
        min-width: 0;
        min-height: 0;
        height: 100%;
      }

      /* Conteúdo-esquerda: hero (alto, com a cortina sobreposta) -> [câmeras | mídia]. */
      .content-left {
        grid-area: content;
        display: grid;
        grid-template-columns: 1fr;
        /* Câmeras/mídia ACOMPANHAM a altura do A/C (mesmo --ac-h) -> faixa inferior
           alinhada. Hero absorve o resto. */
        grid-template-rows: minmax(0, 1fr) var(--ac-h, 320px);
        gap: var(--qmiguel-gap);
      }

      .cams-media-row {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: var(--qmiguel-gap);
      }

      /* Direita: Iluminação (luzes) em cima + AC embaixo. AMBOS visíveis (sem
         colapso). Luzes um pouco maior; absorve a maior parte da redução da faixa
         inferior. ANTERIOR (bug): "minmax(0,1fr) auto" -> AC pegava o natural
         (alto) e a Iluminação colapsava/sumia. */
      /* ÚNICO ajuste: luzes seguem ABRAÇANDO o conteúdo (auto, como já funcionava)
         no topo; o A/C ganha ALTURA FIXA (--ac-h) e fica ANCORADO na base
         (align-content: space-between). O respiro variável fica entre os dois.
         Câmeras/mídia e luzes NÃO foram alterados. */
      .right-column {
        grid-area: right;
        display: grid;
        grid-template-rows: auto var(--ac-h, 290px);
        align-content: space-between;
      }

      .right-control-grid {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(292px, 0.55fr);
        grid-template-rows: minmax(264px, 1fr) minmax(292px, 1fr);
        grid-template-areas:
          "lights ac"
          "media ac";
        gap: var(--qmiguel-gap);
      }

      .hero-panel,
      .cameras-card,
      .lights-card,
      .media-hub-card,
      .ac-card {
        min-width: 0;
        min-height: 0;
      }

      /* NOVO (Passada 1): blocos auto-posicionados pela ordem do DOM dentro de
         .content-left (hero, cortina, [câmeras|mídia]) e .right-column (lights, ac).
         ANTERIOR (rollback): lights->lights, media->media, ac->ac. */
      .hero-panel,
      .cameras-card,
      .lights-card,
      .media-hub-card,
      .ac-card,
      .curtain-card {
        grid-area: auto;
      }

      /* ===== Topband — FAIXA de status (re-skin savant, IGUAL ao painel principal):
         badges FLAT (sem pílula/caixa), separadas por filete; apagado = cinza
         sóbrio; aceso = acende na cor do grupo (--tone), sem pill branco. ===== */
      .subview-topband {
        grid-area: topband;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .topband-badges {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 0;
        overflow: hidden;
      }
      .tb-badge {
        --tone: 154,160,166;
        height: 46px;
        display: grid;
        grid-template-columns: 22px auto;
        align-items: center;
        column-gap: 9px;
        padding: 0 16px;
        color: rgba(255,255,255,0.92);
      }
      .tb-badge + .tb-badge { border-left: 1px solid rgba(255,255,255,0.10); }
      .tb-badge-icon { width: 22px; height: 22px; display: grid; place-items: center; color: rgba(255,255,255,0.44); }
      .tb-badge-icon ha-icon { --mdc-icon-size: 18px; }
      .tb-badge-text { min-width: 0; display: flex; flex-direction: column; align-items: flex-start; gap: 2px; line-height: 1.02; }
      .tb-badge-title { font-size: 10px; line-height: 1; font-weight: 600; color: rgba(255,255,255,0.60); }
      .tb-badge-sub { font-size: 11px; line-height: 1; font-weight: 600; color: rgba(255,255,255,0.42); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
      .tb-badge.is-active .tb-badge-icon { color: rgb(var(--tone)); filter: drop-shadow(0 0 8px rgba(var(--tone),0.45)); }
      .tb-badge.is-active .tb-badge-title { color: rgba(255,255,255,0.94); }
      .tb-badge.is-active .tb-badge-sub { color: rgb(var(--tone)); }
      .topband-clock { text-align: right; line-height: 1.05; white-space: nowrap; }
      .topband-clock span[data-clock] { font-size: 12px; font-weight: 800; color: rgba(248,251,255,0.96); }
      .topband-clock small { display: block; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--text-soft); }

      /* ===== Hero atmosfera (transparente) — cortina sobreposta, ancorada embaixo À ESQUERDA ===== */
      .hero-atmosphere { height: 100%; }
      .hero-atmosphere .hero-content {
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        align-items: flex-start;
        padding: 0;
      }
      /* Cortina SOBREPOSTA ao hero, SEM caixa (transparente) e ALINHADA À ESQUERDA.
         (Bug: align-self:end do dock antigo, em flex-column, jogava p/ a direita.) */
      .curtain-overlay {
        align-self: stretch;
        /* Ocupa TODA a largura do hero (= largura de câmeras+mídia). ANTERIOR do
           .curtain-dock: width: min(540px,100%). */
        width: 100% !important;
        max-width: 100% !important;
        background: transparent !important;
        border: none !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
        padding: 0;
      }

      /* ===== Faixa inferior (54px) — presença/última atividade, translúcida, com
         o MESMO filete divisor do dock do painel principal (mais claro no centro). ===== */
      .subview-footer {
        grid-area: bottomband;
        position: relative;
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        background: transparent;
      }
      .subview-footer::before {
        content: "";
        position: absolute;
        top: 0;
        left: 8px;
        right: 8px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent);
      }
      .subview-presence {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 600;
        color: rgba(255,255,255,0.52);
      }
      .subview-presence ha-icon { --mdc-icon-size: 16px; color: rgba(255,255,255,0.42); }

      /* ===== NOVO (Passada 2): Iluminação — acordeão de zonas ===== */
      .lights-card { display: flex; flex-direction: column; min-height: 0; }
      .lights-head { flex: 0 0 auto; }
      /* NOVO (2ª passada): gap 7px -> 10px, padronizado com Sala/Marina (fim do "efeito escada"). */
      .lights-zones { flex: 1 1 auto; display: flex; flex-direction: column; gap: 10px; min-height: 0; overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 0 2px 0 0; }
      .lights-zones::-webkit-scrollbar { width: 0; }
      .light-zone {
        border-radius: 16px;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        overflow: hidden;
      }
      .light-zone.is-expanded { background: rgba(255,255,255,0.055); }
      .zone-header {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 11px;
        padding: 12px 14px;
        cursor: pointer;
      }
      .zone-icon { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 50%; border: 1px solid rgba(255,196,90,0.30); background: rgba(255,196,90,0.08); color: rgba(255,196,90,0.92); }
      .zone-icon ha-icon { --mdc-icon-size: var(--bruno-liquid-icon-section, 20px); }
      .zone-id { min-width: 0; display: flex; flex-direction: column; gap: 2px; }
      .zone-id strong { font-size: 14px; font-weight: 700; color: var(--text-main); }
      .zone-id small { font-size: 11px; font-weight: 600; color: var(--text-soft); }
      .zone-off { font-size: 11px; font-weight: 700; color: rgba(255,196,90,0.92); white-space: nowrap; cursor: pointer; }
      .zone-chevron { --mdc-icon-size: 20px; color: var(--text-soft); }
      .zone-preview { padding: 0 14px 12px; font-size: 11px; font-weight: 600; color: var(--text-soft); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* ANTERIOR (rollback): .zone-lights { display: flex; flex-direction: column; max-height: calc(44px * 5 + 2px); overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 0 5px 5px; } */
      /* NOVO (grade 2-col): 2 colunas fixas, faixas de 92px. 1º tile (principal)
         ocupa a linha inteira quando a contagem é ímpar (.zl-tile.is-wide).
         A altura é controlada pelo _clampExpandedLights (faixas inteiras + scroll). */
      .zone-lights {
        --zl-tile-h: 92px;
        --zl-gap: 12px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: var(--zl-tile-h);
        gap: var(--zl-gap);
        padding: 0 6px 6px;
        overscroll-behavior: contain;
        -webkit-overflow-scrolling: touch;
      }
      /* NOVO (2ª passada): sem status "Ligada/Desligada". Compacto = ícone +
         toggle em cima, nome embaixo (mais respiro ícone↔nome, ícone maior,
         alinhado à esquerda). Largo = LINHA ÚNICA ícone | nome | toggle.
         ANTERIOR: rows "auto 1fr auto auto" + area "status status"; wide 2 linhas
         com "status"; ícone 36px/glifo 23px centrado; regras .zl-status. */
      .zl-tile {
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto 1fr auto;
        grid-template-areas:
          "icon sw"
          ".    ."
          "name name";
        align-items: center;
        text-align: left;
        padding: 12px 14px;
        border-radius: 16px;
        color: var(--text-main);
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.08);
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .zl-tile:hover { background: rgba(255,255,255,0.06); }
      .zl-tile.is-on {
        background: rgba(255,183,77,0.10);
        border-color: rgba(255,205,95,0.42);
      }
      /* Tile WIDE (faixa cheia): LINHA ÚNICA — ícone | nome | toggle. */
      .zl-tile.is-wide {
        grid-column: 1 / -1;
        grid-template-columns: auto 1fr auto;
        grid-template-rows: auto;
        grid-template-areas: "icon name sw";
        align-items: center;
        align-content: center;
        column-gap: 10px;
      }
      /* NOVO: no tile largo o ícone abraça o glifo (sem os ~13px de sobra da caixa
         de 40px) para aproximar ícone↔título. */
      .zl-tile.is-wide .zl-icon { width: 28px; }
      .zl-icon {
        grid-area: icon;
        width: 40px; height: 40px;
        display: grid; place-items: center start;
        --light-color: #9da0a2;
        color: var(--light-color);
      }
      .zl-tile.is-on .zl-icon {
        --light-color: #f0c040;
        color: var(--light-color);
        filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
      }
      .zl-icon .tpl-light-icon {
        width: 27px;
        height: 27px;
      }
      .zl-icon svg { width: 100%; height: 100%; }
      .zl-name {
        grid-area: name;
        min-width: 0;
        font-size: 15px; font-weight: 700;
        color: var(--text-main);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      .zl-switch {
        grid-area: sw;
        position: relative;
        width: 38px; height: 22px;
        border-radius: 999px;
        background: rgba(255,255,255,0.18);
        border: 1px solid rgba(255,255,255,0.14);
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      .zl-tile.is-on .zl-switch {
        background: linear-gradient(90deg, rgba(255,176,54,0.95), rgba(255,206,120,0.95));
        border-color: rgba(255,196,90,0.55);
      }
      .zl-knob {
        position: absolute; top: 50%; left: 2px;
        transform: translateY(-50%);
        width: 16px; height: 16px; border-radius: 50%;
        background: #fff;
        box-shadow: 0 1px 3px rgba(0,0,0,0.35);
        transition: left 0.2s ease;
      }
      .zl-tile.is-on .zl-knob { left: calc(100% - 18px); }
      .zone-lights::-webkit-scrollbar { width: 0; }
      .zone-lights::-webkit-scrollbar { width: 0; }
      /* NOVO: linha = ícone (em círculo) | nome | BARRA LUMINOSA read-only.
         ANTERIOR: ícone | nome | estado | toggle. */
      .light-row {
        display: grid;
        /* nome com largura FIXA p/ todas as barras alinharem (cada linha é um
           grid próprio; 'auto' desalinharia conforme o tamanho do nome). */
        grid-template-columns: 32px 112px minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        min-height: 44px;
        padding: 5px 8px;
        background: transparent;
        border: none;
        border-radius: 12px;
        cursor: pointer;
        color: var(--text-main);
        text-align: left;
      }
      .light-row:hover { background: rgba(255,255,255,0.04); }
      /* PADRONIZAÇÃO do ícone animado (_tplLightIcon): pinta com fill:
         var(--light-color). Wrapper agora é CIRCULAR (extra premium, imagem 3). */
      .light-row-icon {
        width: 32px; height: 32px;
        display: grid; place-items: center;
        --light-color: #9da0a2;
        color: var(--light-color);
      }
      .light-row.is-on .light-row-icon {
        --light-color: #f0c040;
        color: var(--light-color);
        filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
      }
      /* CENTRALIZAÇÃO: o wrapper do ícone animado ocupava 100% do círculo em
         display:block, jogando o svg p/ o canto. Constrange a 22px e o
         place-items:center do círculo centraliza. */
      .light-row-icon .tpl-light-icon {
        width: var(--bruno-liquid-icon-control, 23px);
        height: var(--bruno-liquid-icon-control, 23px);
      }
      .light-row-icon svg { width: 100%; height: 100%; }
      .light-row-name { min-width: 0; font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      /* BARRA LUMINOSA read-only (não é slider): apagada = pílula escura;
         acesa = gradiente âmbar com glow. O toque é da LINHA (toggle-light). */
      .light-bar {
        height: 9px;
        border-radius: 999px;
        background: rgba(255,255,255,0.06);
        border: 1px solid rgba(255,255,255,0.09);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
        pointer-events: none;
        transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
      }
      .light-row.is-on .light-bar {
        background: linear-gradient(90deg, rgba(255,176,54,0.96), rgba(255,206,120,0.96));
        border-color: rgba(255,196,90,0.55);
        box-shadow: 0 0 12px rgba(255,176,54,0.55), 0 0 4px rgba(255,176,54,0.6), inset 0 1px 0 rgba(255,255,255,0.45);
      }

      /* ===== A/C premium: cabecalho e controles alinhados ao Hub de Midia ===== */
      .ac-card.ac-card-lean {
        display: grid;
        grid-template-rows: 44px minmax(0, 1fr) 64px;
        gap: 0;
        min-height: 0;
        padding: 0;
        overflow: hidden;
      }

      .ac-lean-head {
        position: relative;
        z-index: 3;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px 0 14px;
      }

      .ac-head-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .ac-top-stack {
        position: absolute;
        top: 5px;
        right: 10px;
        z-index: 4;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;
      }

      .ac-more-button {
        flex: 0 0 auto;
      }

      .ac-power-floating {
        width: 46px;
        height: 46px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        border: 0;
        background: transparent;
        color: rgba(255,255,255,0.66);
        cursor: pointer;
        transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
      }

      .ac-power-floating ha-icon {
        --mdc-icon-size: 34px;
      }

      .ac-power-floating:hover,
      .ac-power-floating:focus-visible {
        color: rgba(255,255,255,0.92);
        background: rgba(255,255,255,0.045);
      }

      .ac-power-floating.is-active {
        color: rgba(150,205,255,0.98);
        background: rgba(96,165,250,0.075);
        box-shadow: 0 0 18px rgba(44,175,255,0.22);
      }

      .ac-power-floating:active {
        transform: translateY(1px);
      }

      .ac-power-floating:disabled {
        opacity: 0.42;
        cursor: default;
      }

      .ac-lean-mid {
        position: relative;
        z-index: 1;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 6px 2px;
      }

      .ac-ring {
        width: 100%;
        min-width: 0;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: visible;
      }

      .ac-ring .icg-shell {
        width: min(94%, 334px);
        transform: translateY(3px);
      }

      .ac-lean-foot {
        position: relative;
        z-index: 5;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
        padding: 0 10px 10px;
        align-items: end;
      }

      .ac-control-wrap {
        position: relative;
        min-width: 0;
      }

      .ac-action {
        width: 100%;
        min-width: 0;
        min-height: 50px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        padding: 7px 10px;
        border-radius: var(--bruno-liquid-control-radius-compact, 9px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
        cursor: pointer;
        color: var(--text-main);
        text-align: left;
      }

      .ac-action:hover,
      .ac-action.is-open {
        background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
      }

      .ac-action:disabled {
        opacity: 0.42;
        cursor: default;
      }

      .ac-action-icon {
        width: 32px;
        height: 34px;
        display: grid;
        place-items: center;
        color: rgba(255,255,255,0.82);
        flex: 0 0 auto;
      }

      .ac-action:hover .ac-action-icon,
      .ac-action.is-open .ac-action-icon {
        color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
      }

      .ac-action-icon ha-icon {
        --mdc-icon-size: var(--bruno-liquid-icon-control, 23px);
      }

      .ac-action-text {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .ac-action-text small {
        font-size: 10px;
        line-height: 1;
        font-weight: 650;
        color: rgba(255,255,255,0.58);
      }

      .ac-action-text strong {
        min-width: 0;
        font-size: 13px;
        line-height: 1.05;
        font-weight: 800;
        color: rgba(255,255,255,0.94);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .ac-popover {
        position: absolute;
        left: 0;
        right: 0;
        bottom: calc(100% + 8px);
        z-index: 12;
        display: grid;
        gap: 4px;
        padding: 6px;
        border-radius: var(--bruno-liquid-cell-radius, 13px);
        /* Não reutilizar o fundo do card: esta é uma superfície de escolha
           temporária e precisa sobrepor o gauge com leitura inequívoca. */
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

      .ac-popover-option {
        min-width: 0;
        min-height: 32px;
        display: grid;
        grid-template-columns: 18px minmax(0, 1fr);
        align-items: center;
        gap: 7px;
        padding: 0 8px;
        border-radius: 9px;
        border: 0;
        background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
        color: rgba(255,255,255,0.82);
        font-size: 11px;
        font-weight: 750;
        text-align: left;
        cursor: pointer;
      }

      .ac-popover-option ha-icon {
        --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
        color: rgba(255,255,255,0.72);
      }

      .ac-popover-option span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .ac-popover-option:hover,
      .ac-popover-option.is-active {
        color: rgba(255,255,255,0.98);
        background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
      }

      .ac-popover-option:hover ha-icon,
      .ac-popover-option.is-active ha-icon {
        color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
      }

      .ac-popover-option:disabled {
        opacity: 0.48;
        cursor: default;
      }

      .room-sidebar {
        width: 58px;
        height: auto;
        max-height: calc(100% - 6px);
        grid-auto-rows: 40px;
        gap: 7px;
        padding: 12px 8px;
      }

      .room-nav-button {
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        max-width: 40px;
        max-height: 40px;
      }

      .hero-stage {
        overflow: visible;
      }

      .hero-content {
        padding: 15px 18px 14px;
        gap: 8px;
      }

      .hero-headline {
        margin-top: 12px;
      }

      .hero-date-line {
        margin-bottom: 6px;
      }

      .hero-clock {
        margin-top: 8px;
        font-size: clamp(54px, 7.1vh, 74px);
      }

      .scene-pill {
        width: fit-content;
        max-width: min(250px, 100%);
        min-height: 30px;
        margin-top: 12px;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 0 12px;
        border-radius: 999px;
        color: rgba(255,255,255,0.88);
        font-size: 11px;
        font-weight: 800;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 24px rgba(0,0,0,0.20);
      }

      .scene-pill ha-icon {
        --mdc-icon-size: 15px;
        color: rgb(255,205,95);
      }

      .curtain-dock {
        width: min(520px, 100%);
        gap: 12px;
      }

      .curtain-action-button {
        min-width: 78px;
      }

      .status-rail {
        min-height: 64px;
        grid-template-columns: repeat(5, minmax(0, 1fr));
      }

      .status-item {
        grid-template-columns: auto minmax(0, 1fr);
        padding: 0 12px;
      }

      .status-chevron {
        display: none;
      }

      .lights-card {
        gap: 10px;
      }

      .lights-card .module-head {
        align-items: start;
        min-height: 40px;
      }

      .lights-title-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-width: 0;
      }

      .zone-toggle,
      .media-tabs {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 3px;
        background: rgba(255,255,255,0.065);
        border: 1px solid rgba(255,255,255,0.11);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      }

      .zone-toggle button {
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        color: rgba(255,255,255,0.62);
        background: transparent;
        font-size: 10px;
        font-weight: 900;
      }

      .head-actions .chip-button {
        min-height: 34px;
        padding: 0 14px;
      }
      /* NOVO (extra premium): chips com ícone sol/lua. */
      .chip-button-icon {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }
      .chip-button-icon ha-icon { --mdc-icon-size: 15px; }

      .zone-toggle button.is-active {
        color: rgba(255,255,255,0.96);
        background: rgba(255,255,255,0.12);
      }

      .lights-single-grid {
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 14px 10px;
      }

      .lights-body {
        grid-template-columns: minmax(0, 1fr) 60px;
        gap: 10px;
      }

      .lights-zone-rail {
        display: grid;
      }

      .lights-groups,
      .lights-divider,
      .light-group-label {
        display: none;
      }

      .light-tile {
        min-height: 0;
        grid-template-columns: 60px minmax(0, 1fr);
        column-gap: 11px;
        padding: 11px 12px;
      }

      .light-icon {
        width: 60px;
        height: 60px;
      }

      .light-tile strong {
        font-size: 14.8px;
      }

      /* ===== Câmeras — feed principal + PiP + controles contextuais ===== */
      .cameras-card.cameras-card-controls {
        padding: 0;
        display: grid;
        grid-template-rows: 44px minmax(0, 1fr);
        gap: 0;
        overflow: hidden;
      }

      .cameras-head {
        flex: 0 0 auto;
      }

      .camera-settings-button.is-active {
        color: rgba(255,255,255,0.86);
        background: rgba(255,255,255,0.055);
      }

      .camera-pip-stage {
        box-sizing: border-box;
        position: relative;
        z-index: 1;
        min-height: 0;
        height: 100%;
        padding: 0 10px 10px;
      }

      .camera-feed {
        height: 100%;
        transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
      }

      .camera-primary-feed {
        width: 100%;
      }

      .camera-pip-feed {
        position: absolute;
        z-index: 5;
        right: 20px;
        bottom: 22px;
        width: min(36%, 150px);
        height: 86px;
        border-radius: 13px;
        box-shadow: 0 12px 30px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.10);
      }

      .camera-pip-stage.is-controls-open .camera-pip-feed {
        bottom: 76px;
      }

      .camera-pip-feed .camera-row-copy {
        left: 9px;
        right: 9px;
        bottom: 8px;
        gap: 0;
      }

      .camera-pip-feed .camera-row-copy strong {
        max-width: 100%;
        font-size: 11px;
        line-height: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .camera-pip-feed .camera-row-copy span {
        display: none;
      }

      .camera-pip-feed::after {
        background: linear-gradient(180deg, rgba(4,8,16,0.04), rgba(4,8,16,0.52));
      }

      .camera-state-surface {
        position: absolute;
        inset: 0;
        z-index: 2;
        display: grid;
        place-items: center;
        align-content: center;
        gap: 8px;
        padding: 16px;
        color: rgba(255,255,255,0.78);
        text-align: center;
        background:
          radial-gradient(circle at 50% 42%, rgba(96,165,250,0.12), transparent 58%),
          rgba(5,8,14,0.76);
        backdrop-filter: blur(8px) saturate(0.9);
        -webkit-backdrop-filter: blur(8px) saturate(0.9);
      }

      .camera-state-surface ha-icon {
        display: none;
        --mdc-icon-size: 32px;
        color: rgba(255,255,255,0.64);
      }

      .camera-state-surface span {
        font-size: 12px;
        font-weight: 760;
        line-height: 1.1;
      }

      .camera-pip-feed .camera-state-surface {
        gap: 4px;
        padding: 8px;
      }

      .camera-pip-feed .camera-state-surface ha-icon {
        --mdc-icon-size: 22px;
      }

      .camera-pip-feed .camera-state-surface span {
        font-size: 9px;
      }

      .camera-feed.is-private .camera-row-image img,
      .camera-feed.is-unavailable .camera-row-image img {
        opacity: 0;
      }

      .live-dot.is-muted {
        background: rgba(255,255,255,0.34);
        box-shadow: none;
      }

      .camera-control-strip {
        position: absolute;
        left: 10px;
        right: 10px;
        bottom: 10px;
        z-index: 7;
        min-height: 58px;
        display: grid;
        align-items: stretch;
        padding: 4px 0;
        border: 0;
        border-radius: 0;
        background:
          linear-gradient(180deg, rgba(3,7,13,0.08), rgba(3,7,13,0.40)),
          rgba(6,8,12,0.18);
        backdrop-filter: blur(10px) saturate(0.95);
        -webkit-backdrop-filter: blur(10px) saturate(0.95);
      }

      .camera-controls {
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        align-items: stretch;
      }

      .camera-control {
        position: relative;
        min-width: 0;
        min-height: 50px;
        display: grid;
        grid-template-columns: 18px auto 28px;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 0 8px;
        border: 0;
        border-radius: 0;
        background: transparent;
        color: rgba(255,255,255,0.62);
        cursor: pointer;
        text-align: left;
        transition: color 160ms ease, background 160ms ease, opacity 160ms ease;
      }

      .camera-control + .camera-control::before {
        content: "";
        position: absolute;
        left: 0;
        top: 11px;
        bottom: 11px;
        width: 1px;
        background: rgba(255,255,255,0.105);
      }

      .camera-control:hover,
      .camera-control:focus-visible {
        color: rgba(255,255,255,0.90);
        background: rgba(255,255,255,0.036);
        outline: none;
      }

      .camera-control:focus-visible {
        box-shadow: inset 0 0 0 1px rgba(138,196,255,0.42);
      }

      .camera-control ha-icon {
        --mdc-icon-size: 17px;
      }

      .camera-control-label {
        min-width: 0;
        font-size: 11px;
        font-weight: 760;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .camera-control-switch {
        position: relative;
        justify-self: start;
        width: 26px;
        height: 14px;
        border-radius: 999px;
        background: rgba(255,255,255,0.16);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.30);
        transition: background 160ms ease, box-shadow 160ms ease;
      }

      .camera-control-switch::after {
        content: "";
        position: absolute;
        top: 3px;
        left: 3px;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(255,255,255,0.74);
        box-shadow: 0 1px 3px rgba(0,0,0,0.30);
        transition: transform 160ms ease, background 160ms ease;
      }

      .camera-control.is-on {
        color: rgba(218,248,230,0.94);
      }

      .camera-control.is-on .camera-control-switch {
        background: rgba(46,231,122,0.58);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.18), 0 0 8px rgba(46,231,122,0.18);
      }

      .camera-control.is-on .camera-control-switch::after {
        transform: translateX(12px);
        background: rgba(255,255,255,0.96);
      }

      .camera-control.is-unavailable,
      .camera-control:disabled {
        opacity: 0.34;
        cursor: not-allowed;
      }

      .camera-row-copy {
        left: 14px;
        right: 14px;
        bottom: 14px;
        transition: bottom 220ms ease;
      }

      .camera-pip-stage.is-controls-open .camera-primary-feed .camera-row-copy {
        bottom: 76px;
      }

      .camera-row-copy strong {
        font-size: 15px;
        line-height: 1.08;
      }

      .media-hub-card {
        padding: 14px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 10px;
      }

      .media-hub-head {
        align-items: start;
        min-height: 38px;
        margin-bottom: 0;
      }

      .media-tabs {
        gap: 2px;
        max-width: 62%;
      }

      .media-tabs button {
        min-width: 0;
        min-height: 30px;
        display: grid;
        grid-template-columns: auto auto;
        grid-template-rows: auto auto;
        align-items: center;
        column-gap: 5px;
        padding: 3px 9px;
        border-radius: 999px;
        color: rgba(255,255,255,0.58);
        background: transparent;
        font-size: 10px;
        font-weight: 900;
      }

      .media-tabs button.is-selected {
        color: rgba(255,255,255,0.96);
        background: rgba(255,255,255,0.12);
      }

      .media-tabs small {
        grid-column: 2;
        max-width: 66px;
        color: rgba(255,255,255,0.46);
        font-size: 8px;
        line-height: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .source-dot {
        grid-row: 1 / 3;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgba(255,255,255,0.24);
      }

      .media-tabs button.is-source-active .source-dot {
        background: #2ee77a;
        box-shadow: 0 0 10px rgba(46,231,122,0.52);
      }

      .media-hub-body {
        min-height: 0;
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: minmax(186px, 0.86fr) minmax(0, 1fr);
        grid-template-rows: minmax(206px, 1fr);
        grid-template-areas:
          "visual content";
        align-items: stretch;
        gap: 12px;
      }

      .media-visual {
        grid-area: visual;
        position: relative;
        min-height: 0;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        border-radius: var(--qmiguel-radius-small);
        color: rgba(255,255,255,0.22);
        background:
          radial-gradient(circle at 52% 34%, rgba(96,165,250,0.15), transparent 54%),
          rgba(5,10,20,0.74);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .media-visual img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .media-standby-image {
        position: static !important;
        inset: auto !important;
        width: 92% !important;
        height: 92% !important;
        object-fit: contain !important;
        opacity: 0.96;
        filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
      }

      .media-tv-standby {
        width: 96% !important;
        height: 86% !important;
      }

      .media-spotify-standby {
        width: 72% !important;
        height: 78% !important;
      }

      .media-visual ha-icon {
        --mdc-icon-size: 64px;
      }

      .media-hub-content {
        grid-area: content;
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: 40px minmax(122px, 1fr) auto;
        align-content: stretch;
        gap: 11px;
      }

      .media-ps5-image {
        position: static !important;
        width: 108% !important;
        height: 100% !important;
        object-fit: contain !important;
        filter: drop-shadow(0 18px 26px rgba(0,0,0,0.42));
      }

      .media-details {
        grid-area: auto;
        min-width: 0;
        min-height: 40px;
        display: grid;
        grid-template-rows: 20px 16px;
        align-content: start;
        gap: 4px;
        padding-top: 1px;
      }

      .media-details strong {
        min-width: 0;
        color: white;
        font-size: 17px;
        line-height: 1.08;
        font-weight: 850;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .media-details small,
      .media-details em {
        min-width: 0;
        color: var(--text-soft);
        font-size: 12px;
        line-height: 1.25;
        font-style: normal;
        font-weight: 650;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .media-details em {
        color: rgba(255,255,255,0.48);
        font-size: 11px;
      }

      .media-action-stack {
        grid-area: auto;
        --media-action-size: 55px;
        display: grid;
        align-content: center;
        align-self: center;
        gap: 12px;
        min-width: 0;
      }

      .media-primary-actions,
      .media-secondary-actions {
        width: 100%;
        display: grid;
        grid-template-columns: repeat(4, var(--media-action-size));
        align-items: center;
        justify-content: space-between;
        min-width: 0;
      }

      .media-primary-actions.is-wide {
        grid-template-columns: minmax(0, 1fr) var(--media-action-size);
        gap: 9px;
      }

      .media-primary-actions.is-wide .primary-button {
        min-height: var(--media-action-size);
        border-radius: var(--bruno-liquid-control-radius, 14px);
      }

      .media-action-button,
      .media-action-spacer,
      .media-identity-cell {
        width: var(--media-action-size);
        height: var(--media-action-size);
      }

      .media-action-button {
        position: relative;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        overflow: hidden;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        color: rgba(255,255,255,0.82);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
      }

      .media-action-button ha-icon {
        --mdc-icon-size: 20px;
      }

      .media-action-button.is-main {
        color: white;
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%),
          linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58))
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
        box-shadow: var(--bruno-liquid-control-blue-shadow,
          inset 0 1px 0 rgba(255,255,255,0.22),
          0 0 22px rgba(96,165,250,0.24)
        );
      }

      .media-action-button.is-tool {
        color: rgba(210,245,230,0.96);
        background: var(--bruno-liquid-control-green-background,
          radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%),
          rgba(255,255,255,0.075)
        );
        border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
        box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
      }

      .media-action-button:disabled {
        opacity: 0.42;
        cursor: default;
      }

      .media-action-spacer {
        display: block;
        pointer-events: none;
        visibility: hidden;
      }

      .media-identity-cell {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        pointer-events: none;
        color: rgba(210,222,236,0.58);
      }

      .media-identity-cell.is-active {
        color: rgba(255,255,255,0.96);
      }

      .tpl-media-icon {
        width: 44px;
        height: 44px;
        display: block;
        filter: drop-shadow(0 8px 14px rgba(0,0,0,0.30));
      }

      .media-identity-cell.is-active .tpl-media-icon {
        filter: drop-shadow(0 0 12px rgba(96,190,255,0.34)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
      }

      .tpl-media-icon svg {
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
      }

      .tpl-media-icon.icon-spotify.is-active {
        color: #1ed760;
        filter: drop-shadow(0 0 12px rgba(46,231,122,0.36)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
      }

      .media-image-button {
        background: rgba(255,255,255,0.07);
      }

      .media-button-art {
        position: absolute;
        inset: 0;
        background-image: var(--media-app-image);
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }

      .media-image-button::after {
        content: '';
        position: absolute;
        inset: 0;
        pointer-events: none;
        border-radius: inherit;
        background: linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
      }

      .media-hub-extra {
        grid-area: auto;
        min-width: 0;
        align-self: end;
      }

      .media-extra-info {
        min-height: 34px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        gap: 10px;
        padding: 0 12px;
        border-radius: 12px;
        color: var(--text-soft);
        background: rgba(255,255,255,0.052);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .media-extra-info strong {
        color: rgba(255,255,255,0.88);
        text-align: right;
      }

      /* ============================================================
         Hub de Mídia — ACORDEÃO (NOVO 2026-06-28 · re-skin conceito)
         320px fixos (herda --ac-h via .cams-media-row). Sem overflow.
         44px cabeçalho + fontes (276px): 2 recolhidas (pills 38px) +
         1 expandida (card-in-card). Sem título repetido (o nome vive no
         cabeçalho da faixa). Accent/volume/progresso dourado #f2c266;
         ícone Spotify monocromático. Imagem em "bolsão de luz quente".
         ============================================================ */
      /* 1.1 — Override específico do Hub (Savant Light): mais translúcido,
         neutro (sem dominante quente/amarronzado), bordas finas, premium.
         Atenua o sheen quente do glass-card base só neste bloco. */
      /* Item 8 — Savant-like: bem mais translúcido (a foto atrás aparece), mas
         NÃO totalmente vazado — a base escura leve (0.20) + blur menor (16px)
         preservam a legibilidade das informações. */
      .media-hub-card.mh-accordion {
        position: relative;
        padding: 0;
        grid-template-rows: 44px minmax(0, 1fr);
        gap: 0;
        overflow: hidden;
        border-radius: var(--bruno-liquid-card-radius, 18px);
        background: var(--bruno-liquid-surface-off-background,
          linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)),
          rgba(9,11,15,0.105)
        );
        border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
        box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145));
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
      }
      .media-hub-card.mh-accordion::before { opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10); }
      .media-hub-card.mh-accordion::after { display: none; }

      .mh-head {
        position: relative;
        z-index: 1;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 0 10px 0 14px;
      }

      /* Cabeçalho padronizado: micro-icon (círculo) + module-title, idêntico aos
         demais blocos (Iluminação/Câmeras/A-C). */
      .mh-head-title {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .mh-menu {
        width: 30px;
        height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 9px;
        color: rgba(255,255,255,0.52);
        background: transparent;
      }
      .mh-menu ha-icon { --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px); }
      .media-hub-card .mh-menu.is-active {
        color: rgba(255,255,255,0.82);
        background: rgba(255,255,255,0.072);
      }
      .mh-menu:active { background: rgba(255,255,255,0.08); }

      .mh-overflow-panel {
        position: absolute;
        z-index: 5;
        top: 42px;
        right: 10px;
        width: min(280px, calc(100% - 20px));
        padding: 7px;
        border-radius: var(--bruno-liquid-cell-radius, 13px);
        background: linear-gradient(180deg, rgba(34,31,30,0.72), rgba(12,13,16,0.66));
        border: 1px solid rgba(255,255,255,0.115);
        box-shadow: 0 18px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10);
        backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
        -webkit-backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
      }

      .mh-overflow-item {
        min-height: 52px;
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) 34px 34px;
        align-items: center;
        gap: 8px;
        padding: 4px 5px;
      }

      .mh-overflow-icon {
        width: 30px;
        height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.86);
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.075);
      }
      .mh-overflow-icon ha-icon { --mdc-icon-size: var(--bruno-liquid-icon-section, 20px); }

      .mh-overflow-copy {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }
      .mh-overflow-copy strong {
        font-size: 12.5px;
        line-height: 1.05;
        font-weight: 800;
        color: rgba(255,255,255,0.92);
      }
      .mh-overflow-copy small {
        min-width: 0;
        font-size: 10.5px;
        line-height: 1.1;
        font-weight: 650;
        color: rgba(255,255,255,0.54);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mh-overflow-action {
        width: 32px;
        height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 10px;
        color: rgba(255,255,255,0.72);
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.075);
      }
      .mh-overflow-action ha-icon { --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px); }
      .mh-overflow-action.is-active {
        color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
        border-color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.24);
        background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.075);
      }
      .mh-overflow-action:disabled {
        opacity: 0.42;
        cursor: default;
      }

      /* Faixas inset 10px; pills com respiro de 6px entre si. */
      .mh-sources {
        position: relative;
        z-index: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 0 10px 10px;
      }

      /* 1.2 — Recolhidas: faixas MUITO sutis (quase etéreas), baixo contraste
         e baixo peso. Só a expandida ganha presença marcante. */
      .mh-source {
        position: relative;
        flex: 0 0 42px;
        min-height: 0;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        border-radius: var(--bruno-liquid-cell-radius, 13px);
        background: var(--bruno-liquid-band-background, rgba(255,255,255,0.010));
        border: var(--bruno-liquid-band-border, 1px solid rgba(255,255,255,0.035));
        box-shadow: var(--bruno-liquid-band-shadow, none);
        transition:
          flex-basis 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
          flex-grow 260ms cubic-bezier(0.2, 0.8, 0.2, 1),
          background 220ms ease,
          border-color 220ms ease,
          box-shadow 220ms ease;
        will-change: flex-basis, flex-grow, background, border-color;
      }
      .mh-source.is-open {
        flex: 1 1 0;
        background: var(--bruno-liquid-band-open-background,
          linear-gradient(180deg, rgba(255,255,255,0.044), rgba(255,255,255,0.012) 54%, rgba(255,255,255,0.018)),
          rgba(9,11,15,0.052)
        );
        border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
        box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
      }
      .mh-source.is-switching {
        animation: mh-source-open 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
      }

      /* 2.1 — Faixas individuais: SÓ o ícone (sem bolha/círculo) + texto colado.
         Apenas o cabeçalho geral do Hub mantém ícone em bolha (micro-icon).
         --mh-indent = recuo p/ alinhar info ao INÍCIO do texto do título. */
      .mh-source-head {
        --mh-indent: 26px;
        flex: 0 0 42px;
        height: 42px;
        display: grid;
        grid-template-columns: 20px minmax(0, auto) minmax(0, 1fr) 16px;
        align-items: center;
        gap: 6px;
        padding: 0 12px 0 14px;
        background: transparent;
        text-align: left;
        transition: flex-basis 220ms ease, height 220ms ease;
      }
      /* Aberta (item 1): ícone e título alinhados pelo EIXO CENTRAL (align-items
         center). Altura 46px → espaçamento superior do ícone ≈ 13px, próximo do
         lateral (14px), sem ficar colado no topo. Idêntico em todas as faixas. */
      .mh-source.is-open .mh-source-head {
        flex: 0 0 48px;
        height: 48px;
        align-items: center;
      }

      .mh-src-icon {
        width: 20px;
        height: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
        color: rgba(255,255,255,0.6);
        background: transparent;
        border: 0;
      }
      .mh-icon-spotify { color: rgba(255,255,255,0.66); }
      .mh-source.is-active .mh-src-icon,
      .mh-source.is-active .mh-icon-spotify { color: rgb(var(--bruno-liquid-warm-accent, 242,194,102)); }

      .mh-src-name {
        min-width: 0;
        font-size: 14px;
        font-weight: 800;
        line-height: 1;
        color: rgba(255,255,255,0.92);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mh-source.is-open .mh-src-name { font-size: 15px; }

      .mh-src-summary {
        min-width: 0;
        justify-self: end;
        max-width: 100%;
        font-size: 11.5px;
        font-weight: 650;
        color: rgba(255,255,255,0.50);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mh-source.is-open .mh-src-summary { display: none; }

      .mh-src-chevron {
        --mdc-icon-size: 18px;
        color: rgba(255,255,255,0.4);
      }
      .mh-source.is-open .mh-src-chevron { color: rgb(var(--bruno-liquid-warm-accent, 242,194,102)); }

      .mh-source-body {
        flex: 1 1 auto;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(168px, 40%, 260px);
        gap: 14px;
        padding: 2px 16px 14px;
      }
      .mh-source.is-switching .mh-source-body {
        opacity: 0;
        transform: translateY(5px);
        animation: mh-source-body-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 55ms both;
      }

      /* 2.2 — Conteúdo no TOPO: título (no head) → música → artista → progresso
         logo abaixo; volume/botões seguem. */
      .mh-left {
        min-width: 0;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        gap: 10px;
      }
      .mh-source.is-switching .mh-left {
        animation: mh-source-content-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 75ms both;
      }

      /* Info (música/artista/progresso/estado) recuada para alinhar com o
         INÍCIO do texto do título; volume/botões mantêm o alinhamento atual. */
      .mh-info {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
        padding-left: 26px;
      }

      /* Item 7 — escala ÚNICA p/ todas as faixas (sem bolinha de status):
         Info primária (música/estado) e secundária (artista/app/dispositivo)
         distinguem-se por cor e tamanho, idênticas em TV/Spotify/PS5. */
      .mh-info small {
        display: block;
        font-size: 13.5px;
        font-weight: 750;
        line-height: 1.15;
        color: rgba(255,255,255,0.92);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mh-info em {
        display: block;
        font-style: normal;
        font-size: 11.5px;
        font-weight: 600;
        line-height: 1.2;
        color: rgba(255,255,255,0.5);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .mh-progress-wrap {
        width: min(100%, 94%);
        margin-top: 5px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 7px;
      }

      .mh-progress-time {
        font-size: 9.5px;
        line-height: 1;
        font-weight: 700;
        color: rgba(255,255,255,0.48);
        font-variant-numeric: tabular-nums;
      }

      .mh-progress {
        height: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,0.14);
        overflow: hidden;
      }
      .mh-progress span {
        display: block;
        height: 100%;
        border-radius: 999px;
        background: linear-gradient(90deg, rgb(var(--bruno-liquid-warm-accent, 242,194,102)), rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.88));
      }

      /* Item 3/5 — controles SEMPRE ancorados na base (margin-top:auto): info no
         topo, volume+botões fixos embaixo. Aparecendo ou não todas as linhas de
         info, os controles NÃO se deslocam. Posição idêntica em TV e Spotify. */
      .mh-controls {
        min-width: 0;
        margin-top: auto;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }

      /* Volume dentro de caixa arredondada (conceito). */
      .mh-vol {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        min-height: 32px;
        padding: 0 12px;
        border-radius: var(--bruno-liquid-control-radius-compact, 9px);
        color: var(--text-soft);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        box-shadow: var(--bruno-liquid-control-shadow, none);
        backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
      }
      .mh-vol ha-icon { --mdc-icon-size: var(--bruno-liquid-icon-status, 15px); color: rgb(var(--bruno-liquid-warm-accent, 242,194,102)); }
      .mh-vol-label { font-size: 11.5px; font-weight: 700; white-space: nowrap; color: rgba(255,255,255,0.7); }
      .mh-vol input[type="range"] {
        -webkit-appearance: none;
        appearance: none;
        width: 100%;
        height: 4px;
        border-radius: 999px;
        background: rgba(255,255,255,0.18);
        accent-color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
      }
      .mh-vol input[type="range"]::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
        box-shadow: 0 0 8px rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.5);
        cursor: pointer;
      }
      .mh-vol input[type="range"]::-moz-range-thumb {
        width: 14px;
        height: 14px;
        border: 0;
        border-radius: 50%;
        background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
      }
      .mh-vol.is-disabled { opacity: 0.4; }

      .mh-btn-row {
        display: grid;
        gap: 8px;
      }
      .mh-btn-row-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
      .mh-btn-row-4 { grid-template-columns: repeat(3, minmax(0, 1fr)) 42px; }

      /* 2.3 — Botões com o MESMO tratamento translúcido do container de volume:
         fundo suave, glass discreto, baixa opacidade, arredondamento menor. */
      .mh-btn {
        min-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        padding: 0 8px;
        border-radius: var(--bruno-liquid-control-radius-compact, 9px);
        color: rgba(255,255,255,0.88);
        font-size: 11.5px;
        font-weight: 700;
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        box-shadow: var(--bruno-liquid-control-shadow, none);
        backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
        white-space: nowrap;
        overflow: hidden;
      }
      /* Icon-only: quadrado compacto e centrado. */
      .mh-btn.is-icon { padding: 0; gap: 0; }
      .mh-btn ha-icon { --mdc-icon-size: var(--bruno-liquid-icon-control, 23px); flex: 0 0 auto; color: rgba(255,255,255,0.9); }
      .mh-btn:hover { background: rgba(255,255,255,0.052); }
      .mh-btn span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .mh-btn:active { transform: translateY(1px); }
      .mh-btn:disabled { opacity: 0.42; cursor: default; }

      /* 3.3 — CTA principal (Ligar TV/PS5 / Dispositivos): elegante, minimalista,
         ~50% da largura, mais fino, dourado discreto (menos saturado, Savant). */
      .mh-controls > .mh-btn.is-main {
        align-self: flex-start;
        width: 50%;
        min-width: 140px;
        min-height: 40px;
      }
      .mh-btn.is-main {
        color: rgba(255,255,255,0.94);
        background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
        border-radius: var(--bruno-liquid-control-radius-compact, 9px);
        box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
      }
      .mh-btn.is-main ha-icon { color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.82); }

      .mh-btn.is-plus {
        padding: 0;
        color: rgba(255,255,255,0.72);
      }

      /* Imagem contextual: APENAS o PNG/arte, sobreposto ao bloco — SEM glow,
         SEM fundo, SEM moldura. A imagem é ABSOLUTA dentro da célula, então
         NUNCA infla a altura da linha (não empurra o botão para fora). */
      .mh-art {
        position: relative;
        min-width: 0;
        align-self: stretch;
        height: 100%;
        overflow: hidden;
        background: transparent;
        border: 0;
      }
      .mh-source.is-switching .mh-art {
        animation: mh-source-art-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) 85ms both;
      }
      .mh-art img {
        position: absolute;
        inset: 6px 0;
        width: 100%;
        height: calc(100% - 12px);
        object-fit: contain;
      }
      .mh-art ha-icon {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        --mdc-icon-size: 56px;
        color: rgba(255,255,255,0.22);
      }
      /* Item 4 — Standby: PNG 100% transparente, SEM sombra/halo (sem filtro). */
      .mh-art.is-standby img { filter: none; }
      .mh-art.is-cover img { object-fit: cover; }
      /* 2.4 — Arte QUADRADA de verdade (aspect-ratio 1/1, dirigida pela altura),
         centralizada na vertical. Item 6: SEM box-shadow (sombra quadrada). */
      .mh-art-square.is-cover img {
        inset: auto;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: auto;
        height: calc(100% - 10px);
        aspect-ratio: 1 / 1;
        object-fit: cover;
        border-radius: 12px;
        box-shadow: none;
      }
      /* Item 6 — Thumb da TV em 16:9 real (dirigido pela largura), centralizado,
         SEM box-shadow. */
      .mh-art-wide.is-cover img {
        inset: auto;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 100%;
        height: auto;
        aspect-ratio: 16 / 9;
        object-fit: cover;
        border-radius: 11px;
        box-shadow: none;
      }

      @keyframes mh-source-open {
        from {
          flex-grow: 0;
          flex-basis: 42px;
          border-color: var(--bruno-liquid-band-border-color, rgba(255,255,255,0.040));
          box-shadow: var(--bruno-liquid-band-shadow, none);
        }
        to {
          flex-grow: 1;
          flex-basis: 0;
          border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
          box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
        }
      }

      @keyframes mh-source-body-in {
        from { opacity: 0; transform: translateY(5px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes mh-source-content-in {
        from { opacity: 0; transform: translateY(4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      @keyframes mh-source-art-in {
        from { opacity: 0; transform: translateY(4px) scale(0.985); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      @media (prefers-reduced-motion: reduce) {
        .mh-source,
        .mh-source-head,
        .mh-source-body,
        .mh-left,
        .mh-art,
        .mh-btn {
          transition: none !important;
          animation: none !important;
        }
        .mh-source-body {
          opacity: 1;
          transform: none;
        }
      }

      .ac-card {
        padding: 14px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        /* ANTERIOR (rollback): gap: 6px; */
        gap: 8px;
      }

      .ac-head {
        margin-bottom: 0;
      }

      .power-button {
        width: 40px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        color: rgba(255,255,255,0.74);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.13));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.09));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
      }

      .power-button.is-active {
        color: white;
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%),
          rgba(38,92,138,0.38)
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
        box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
      }

      .power-button ha-icon {
        --mdc-icon-size: 18px;
      }

      /* ANTERIOR (rollback) — sobra de altura empoçava no 1fr da .ac-visual,
         criando vácuo entre o gauge e o slider:
      .ac-body {
        height: auto;
        min-height: 0;
        grid-template-columns: 1fr;
        grid-template-rows: minmax(320px, 1fr) auto auto auto auto auto;
        gap: 10px;
        align-content: start;
      }
      */
      /* NOVO — corpo preenche o cartão (height:100%) e distribui a folga do E1
         igualmente entre TODAS as linhas (space-between), em vez de jogar tudo
         num único vão. Linhas em auto: nenhuma faixa engole sozinha o excedente. */
      .ac-body {
        height: 100%;
        min-height: 0;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto auto auto auto auto;
        gap: 12px;
        align-content: space-between;
      }

      .temperature-slider {
        margin-bottom: 3px;
      }

      .climate-stepper {
        margin-bottom: 4px;
      }

      /* ANTERIOR (rollback): min-height 320px + align-content:start empurrava
         imagem+gauge pro topo e deixava o resto vazio embaixo.
      .ac-visual {
        position: relative;
        min-height: 320px;
        display: grid;
        grid-template-rows: auto auto;
        align-content: start;
        justify-items: center;
        gap: 14px;
        padding: 0 0 2px;
      }
      */
      /* NOVO — centraliza imagem+gauge no espaço da faixa, sem vão interno. */
      .ac-visual {
        position: relative;
        min-height: 300px;
        display: grid;
        grid-template-rows: auto auto;
        align-content: center;
        justify-items: center;
        gap: 16px;
        padding: 0 0 2px;
      }

      .ac-image-shell {
        position: relative;
        width: 100%;
        height: 116px;
        margin: -2px 0 0;
        display: grid;
        place-items: start center;
        overflow: visible;
      }

      .ac-unit-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
        object-position: center top;
        filter: drop-shadow(0 18px 26px rgba(0,0,0,0.38));
        opacity: 1;
        transform: translateY(0);
        transition: opacity 260ms ease, transform 320ms ease, filter 260ms ease;
      }

      .ac-unit-image-on {
        opacity: 0;
        transform: translateY(2px);
        filter:
          drop-shadow(0 18px 26px rgba(0,0,0,0.38))
          drop-shadow(0 0 18px rgba(110,200,255,0.12));
      }

      .ac-image-shell.is-on .ac-unit-image-off {
        opacity: 0;
        transform: translateY(-1px);
      }

      .ac-image-shell.is-on .ac-unit-image-on {
        opacity: 1;
        transform: translateY(0);
      }

      .ac-image-fallback {
        display: none;
        --mdc-icon-size: 84px;
        place-self: center;
        color: rgba(226,232,240,0.46);
        filter: drop-shadow(0 14px 22px rgba(0,0,0,0.32));
      }

      .ac-image-shell.is-fallback .ac-unit-image {
        display: none;
      }

      .ac-image-shell.is-fallback .ac-image-fallback {
        display: block;
      }

      /* --- ORIGINAL CSS anel circular (comentado para rollback) ---
      .climate-ring {
        position: relative;
        width: min(210px, 82%);
        aspect-ratio: 1;
        display: block;
        filter: drop-shadow(0 20px 34px rgba(0,0,0,0.36));
      }

      .climate-ring-svg {
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
      }

      .climate-ring-scale {
        font-family: "SF Mono", "Cascadia Mono", "Segoe UI", monospace;
        font-size: 10px;
        font-weight: 500;
        fill: rgba(130,185,225,0.42);
      }

      .climate-ring-temp {
        font-family: "SF Pro Display", "Inter", "Segoe UI", sans-serif;
        font-size: 86px;
        font-weight: 300;
        letter-spacing: 0;
        fill: rgba(240,248,255,0.98);
      }

      .climate-ring-mode {
        font-family: "SF Mono", "Cascadia Mono", "Segoe UI", monospace;
        font-size: 13px;
        font-weight: 600;
        letter-spacing: 0;
        fill: rgba(95,210,255,0.93);
      }

      .climate-ring-meta {
        font-family: "SF Mono", "Cascadia Mono", "Segoe UI", monospace;
        font-size: 11px;
        font-weight: 500;
        letter-spacing: 0;
        fill: rgba(175,205,230,0.45);
      }

      .climate-ring-knob-aura {
        animation: climate-ring-pulse 2.8s ease-in-out infinite;
      }

      @keyframes climate-ring-pulse {
        0%, 100% { opacity: 0.5; }
        50% { opacity: 0.2; }
      }
      --- FIM ORIGINAL --- */

      /* --- NOVO: gauge semicircular integrado (icg-*) --- */
      .icg-root {
        width: 100%;
        background: transparent;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: visible;
      }

      .icg-shell {
        width: min(100%, 820px);
        /* ANTERIOR (rollback): aspect-ratio: 16 / 9; */
        /* NOVO — proporção mais alta = semicírculo um pouco maior p/ mesma largura. */
        aspect-ratio: 16 / 10;
        position: relative;
        background: transparent;
      }

      .icg-svg {
        width: 100%;
        height: 100%;
        overflow: visible;
        display: block;
        background: transparent;
      }

      .icg-track-shadow {
        fill: none;
        stroke: rgba(0, 0, 0, 0.34);
        stroke-width: 16;
        stroke-linecap: round;
      }

      .icg-track-muted {
        fill: none;
        stroke: rgba(112, 136, 164, 0.38);
        stroke-width: 8;
        stroke-linecap: round;
      }

      .icg-active-glow {
        fill: none;
        stroke: url(#icgActiveBlue);
        stroke-width: 18;
        stroke-linecap: round;
        opacity: 0.74;
        filter: url(#icgBlueGlow);
      }

      .icg-active-arc {
        fill: none;
        stroke: url(#icgActiveBlue);
        stroke-width: 8;
        stroke-linecap: round;
      }

      .icg-tick {
        stroke-linecap: round;
      }

      .icg-tick.minor {
        stroke: rgba(145, 176, 214, 0.34);
        stroke-width: 1.2;
      }

      .icg-tick.medium {
        stroke: rgba(190, 214, 240, 0.50);
        stroke-width: 1.6;
      }

      .icg-tick.major {
        stroke: rgba(238, 247, 255, 0.88);
        stroke-width: 2.5;
      }

      .icg-inner-tick {
        stroke: rgba(40, 145, 255, 0.24);
        stroke-width: 1;
        stroke-linecap: round;
      }

      .icg-label {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 18px;
        font-weight: 500;
        letter-spacing: 1.4px;
        fill: rgba(224, 235, 248, 0.74);
      }

      .icg-label.edge {
        font-size: 22px;
        fill: rgba(230, 240, 252, 0.82);
      }

      .icg-label.top {
        font-size: 19px;
        fill: rgba(235, 245, 255, 0.90);
      }

      .icg-marker-glow {
        fill: rgba(40, 175, 255, 0.28);
        filter: url(#icgBlueGlow);
      }

      .icg-marker-ring {
        fill: rgba(5, 10, 18, 0.94);
        stroke: rgba(92, 210, 255, 0.98);
        stroke-width: 4;
        filter: url(#icgBlueGlow);
      }

      .icg-marker-highlight {
        fill: rgba(255, 255, 255, 0.62);
        opacity: 0.62;
      }

      .icg-center-mode {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 15px;
        font-weight: 500;
        letter-spacing: 9px;
        fill: rgba(38, 190, 255, 0.96);
        text-transform: uppercase;
      }

      .icg-center-temp {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 96px;
        font-weight: 300;
        letter-spacing: -8px;
        fill: rgba(246, 250, 255, 0.98);
        filter: url(#icgTextGlow);
      }

      .icg-center-sub {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 15px;
        font-weight: 500;
        letter-spacing: 9px;
        fill: rgba(190, 204, 220, 0.72);
        text-transform: uppercase;
      }

      .icg-center-line {
        stroke: rgba(36, 195, 255, 0.95);
        stroke-width: 2;
        stroke-linecap: round;
        filter: url(#icgBlueGlow);
      }

      .icg-ambient {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        letter-spacing: 1.8px;
        fill: rgba(176, 196, 220, 0.60);
      }

      .climate-mode-row {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }

      .fan-mode-row {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        align-items: start;
      }

      .fan-mode {
        aspect-ratio: 1;
        min-height: 0;
        height: auto;
        padding: 0 4px;
      }

      @media (max-width: 1180px) {
        :host {
          height: auto;
          min-height: 100vh;
          overflow: visible;
        }

        .quarto-miguel-subview {
          height: auto;
          min-height: 100vh;
          overflow: auto;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
          grid-template-areas:
            "left"
            "right";
          padding: 10px;
        }

        .room-sidebar {
          display: none;
        }

        /* NOVO: no mobile (rail oculto) as faixas topo/rodapé da shell saem. */
        .subview-topbar,
        .subview-footer {
          display: none;
        }

        .left-column {
          height: auto;
          grid-template-rows: minmax(340px, 42vh) minmax(270px, 34vh);
        }

        .right-column {
          height: auto;
          grid-template-rows: auto auto;
        }

        .right-control-grid {
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
          grid-template-rows: minmax(236px, auto) minmax(300px, auto);
          grid-template-areas:
            "lights ac"
            "media ac";
        }

        .lights-body {
          grid-template-columns: minmax(0, 1fr);
        }

        .lights-zone-rail {
          display: none;
        }

        .status-rail {
          min-height: 68px;
        }
      }

      @media (max-width: 760px) {
        .quarto-miguel-subview {
          grid-template-columns: 1fr;
          grid-template-areas:
            "left"
            "right";
          padding: 8px;
        }

        .left-column {
          grid-template-rows: minmax(430px, auto) minmax(390px, auto);
        }

        .right-control-grid {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto auto;
          grid-template-areas:
            "lights"
            "media"
            "ac";
        }

        .status-rail {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          min-height: auto;
        }

        .status-item {
          min-height: 58px;
        }

        .media-tabs {
          max-width: 100%;
          width: 100%;
          justify-content: space-between;
        }

        .media-hub-head {
          display: grid;
          gap: 10px;
        }

        .media-hub-body {
          grid-template-columns: 1fr;
          grid-template-rows: minmax(176px, auto) auto;
          grid-template-areas:
            "visual"
            "content";
        }

        .media-hub-content {
          grid-template-rows: auto auto auto;
        }

        .camera-list {
          grid-template-columns: 1fr;
        }

        .lights-title-row,
        .module-head {
          flex-wrap: wrap;
        }

        .head-actions {
          width: 100%;
        }

        .head-actions .chip-button {
          flex: 1 1 0;
        }

        .curtain-control-row {
          grid-template-columns: 1fr;
          gap: 10px;
        }

        .curtain-status {
          justify-self: start;
        }

        .curtain-main-actions {
          justify-content: stretch;
        }

        .curtain-action-button {
          flex: 1 1 0;
          min-width: 0;
        }

        .ac-visual {
          min-height: 238px;
        }
      }
    `;
  }

  static _tplMediaIcon(type, options = {}) {
    const name = String(type || '').replace(/[^a-z0-9_-]/gi, '') || 'tv';
    const active = typeof options === 'boolean' ? options : Boolean(options.active);
    const animate = typeof options === 'object' && Boolean(options.animate);
    const tvScreen = active
      ? `<path${animate ? ' class="media-tv-screen-on"' : ''} d="M2.9,8h44.3v29.9H2.9V8z" fill="url(#bruno-qmiguel-media-tv-screen)"/>`
      : animate
        ? '<path class="media-tv-screen-off" d="M2.9,8h44.3v29.9H2.9V8z" fill="url(#bruno-qmiguel-media-tv-screen)"/>'
        : '';
    const icons = {
      tv: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <style>
            @keyframes bruno-qmiguel-media-tv-on {
              from { transform: scaleY(0); }
              to { transform: scaleY(1); }
            }
            @keyframes bruno-qmiguel-media-tv-off {
              from { transform: scaleY(1); }
              to { transform: scaleY(0); }
            }
            .media-tv-screen-on {
              animation: bruno-qmiguel-media-tv-on 900ms cubic-bezier(0.25,0.46,0.45,0.94) forwards;
              transform-origin: -100% 46%;
            }
            .media-tv-screen-off {
              animation: bruno-qmiguel-media-tv-off 650ms cubic-bezier(0.25,0.46,0.45,0.94) both;
              transform-origin: -100% 46%;
            }
          </style>
          <linearGradient id="bruno-qmiguel-media-tv-screen" gradientUnits="userSpaceOnUse" x1="5.401" y1="34.714" x2="43.817" y2="11.74">
            <stop offset="0" stop-color="#64acb7"/>
            <stop offset="1" stop-color="#7fdbe9"/>
          </linearGradient>
          <path d="M2.9,8h44.3v29.9H2.9V8z" fill="#20262890"/>
          ${tvScreen}
          <path fill="currentColor" d="M46 9.2v27.5H4.1V9.2H46m2.4-2.4H1.6v32.3h46.7c.1 0 .1-32.3.1-32.3zM11.9 43.2h26.3c.6 0 1.1-.4 1.1-1v-.3c0-.6-.4-1.1-1-1.1H11.9c-.6 0-1.1.4-1.1 1v.3a1.11 1.11 0 0 0 1.1 1.1z"/>
        </svg>
      `,
      spotify: active
        ? `
          <svg viewBox="0 0 42.55 42.55" aria-hidden="true">
            <style>
              @keyframes bruno-qmiguel-spotify-bounce {
                10% { transform: scaleY(0.3); }
                30% { transform: scaleY(1); opacity: .35; }
                60% { transform: scaleY(0.5); }
                80% { transform: scaleY(0.75); opacity: .75; }
                100% { transform: scaleY(0.6); }
              }
              .media-spotify-bars {
                fill: #ffffff;
                stroke: #ffffff;
                stroke-linecap: round;
                stroke-width: 5px;
              }
              .media-spotify-bar {
                animation: bruno-qmiguel-spotify-bounce 2.2s ease infinite alternate;
                transform-origin: center;
              }
              .media-spotify-bar:nth-child(2) { animation-delay: -2.2s; }
              .media-spotify-bar:nth-child(3) { animation-delay: -3.2s; }
              .media-spotify-bar:nth-child(4) { animation-delay: -1.2s; }
              .media-spotify-bar:nth-child(5) { animation-delay: -2.1s; }
            </style>
            <g class="media-spotify-bars">
              <path class="media-spotify-bar" d="M2.5,18.24v7.87"/>
              <path class="media-spotify-bar" d="M32.54,18.24v7.87"/>
              <path class="media-spotify-bar" d="M10.01,10.37v23.61"/>
              <path class="media-spotify-bar" d="M25.03,10.37v23.61"/>
              <path class="media-spotify-bar" d="M17.52,2.5V41.85"/>
            </g>
          </svg>
        `
        : `
          <svg viewBox="0 0 49.17 49.17" aria-hidden="true">
            <path fill="currentColor" d="M39.09 21.88c-7.87-4.67-21.02-5.16-28.52-2.83-1.23.37-2.46-.37-2.83-1.47-.37-1.23.37-2.46 1.47-2.83 8.73-2.58 23.11-2.09 32.2 3.32 1.11.61 1.47 2.09.86 3.2-.61.86-2.09 1.23-3.2.61m-.25 6.88c-.61.86-1.72 1.23-2.58.61-6.64-4.06-16.72-5.29-24.46-2.83-.98.25-2.09-.25-2.34-1.23s.25-2.09 1.23-2.34c8.97-2.7 20.04-1.35 27.66 3.32.74.37 1.11 1.6.49 2.46m-2.95 6.76c-.49.74-1.35.98-2.09.49-5.78-3.56-13.03-4.3-21.63-2.34-.86.25-1.6-.37-1.84-1.11-.25-.86.37-1.6 1.11-1.84 9.34-2.09 17.45-1.23 23.85 2.7.86.37.98 1.35.61 2.09M24.58 0C11.06 0 0 11.06 0 24.58s11.06 24.58 24.58 24.58S49.16 38.1 49.16 24.58 38.23 0 24.58 0"/>
          </svg>
        `,
    };

    return `<span class="tpl-media-icon icon-${name}${active ? ' is-active' : ''}">${icons[name] || icons.tv}</span>`;
  }

  static _tplLightIcon(type, active = false) {
    const name = String(type || '').replace(/^mdi:/, '').replace(/[^a-z0-9_-]/gi, '') || 'light_flush';
    const glow = active
      ? '<span class="tpl-light-glow" aria-hidden="true"></span>'
      : '';
    const pendantClass = active ? ' class="pendant-swing"' : '';
    const flushBeam = active
      ? `
        <defs>
          <radialGradient id="bruno-subview-flush-source" cx="25.165" cy="13.615" fx="25.165" fy="13.615" r="7.941" gradientTransform="matrix(-0.00353534,0.70731769,-1.7278701,-0.00863629,48.77824,1.4653142)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#FFF9C3"/>
            <stop offset="1" stop-color="#FFF9C3" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="bruno-subview-flush-center" cx="24.933" cy="10.064" fx="24.933" fy="10.064" r="13.627" gradientTransform="matrix(-1.3891264,0.01690265,-0.01282326,-1.0538672,59.802527,28.064254)" gradientUnits="userSpaceOnUse">
            <stop offset="0" stop-color="#FFF9C3"/>
            <stop offset="1" stop-color="#FFF9C3" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <path class="flush-beam" opacity="0.875" d="M22.413 22.141C22.413 22.141 16.999 22.946 16.242 25.456C16.242 25.456 15.874 27.586 19.976 28.969C19.976 28.969 22.927 29.685 25.213 29.654C28.288 29.613 30.582 28.904 30.582 28.904C33.865 28.036 33.963 26.03 33.963 26.03C33.882 23.684 30.008 22.583 30.008 22.583C26.164 21.611 24.51 21.844 22.413 22.141Z" fill="url(#bruno-subview-flush-source)"/>
        <path class="flush-beam" d="M25.351 24.016C26.2104 24.016 26.907 23.5719 26.907 23.024C26.907 22.4761 26.2104 22.032 25.351 22.032C24.4916 22.032 23.795 22.4761 23.795 23.024C23.795 23.5719 24.4916 24.016 25.351 24.016Z" fill="url(#bruno-subview-flush-center)"/>
      `
      : '';
    const icons = {
      ledstrip: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path class="light-color" d="M8.4395,16.668 C8.9795,16.552 9.5115,16.895 9.6285,17.435 C9.7455,17.974 9.4025,18.506 8.8625,18.623 C8.3225,18.74 7.7905,18.397 7.6735,17.857 C7.5565,17.317 7.9005,16.785 8.4395,16.668 M13.3275,15.611 C13.8665,15.495 14.3985,15.838 14.5155,16.377 C14.6325,16.917 14.2895,17.449 13.7505,17.566 C13.2105,17.683 12.6775,17.34 12.5605,16.8 C12.4445,16.261 12.7875,15.729 13.3275,15.611 M18.2135,14.555 C18.7535,14.438 19.2865,14.781 19.4025,15.32 C19.5195,15.86 19.1765,16.393 18.6365,16.51 C18.0965,16.626 17.5645,16.283 17.4485,15.743 C17.3315,15.203 17.6735,14.671 18.2135,14.555 M23.1005,13.498 C23.6405,13.381 24.1725,13.724 24.2905,14.264 C24.4065,14.804 24.0635,15.336 23.5235,15.453 C22.9835,15.569 22.4515,15.227 22.3355,14.687 C22.2175,14.147 22.5615,13.614 23.1005,13.498 M10.6695,20.639 L25.4735,17.444 C26.5535,17.211 27.2405,16.147 27.0065,15.067 C26.4495,12.484 23.9035,10.842 21.3205,11.399 L6.5165,14.594 C5.4365,14.827 4.7505,15.891 4.9835,16.971 C5.5415,19.554 8.0865,21.196 10.6695,20.639 M25,26 C24.447,26 24,25.553 24,25 C24,24.447 24.447,24 25,24 C25.553,24 26,24.447 26,25 C26,25.553 25.553,26 25,26 M20,26 C19.447,26 19,25.553 19,25 C19,24.447 19.447,24 20,24 C20.553,24 21,24.447 21,25 C21,25.553 20.553,26 20,26 M15,26 C14.447,26 14,25.553 14,25 C14,24.447 14.447,24 15,24 C15.553,24 16,24.447 16,25 C16,25.553 15.553,26 15,26 M10,26 C9.447,26 9,25.553 9,25 C9,24.447 9.447,24 10,24 C10.553,24 11,24.447 11,25 C11,25.553 10.553,26 10,26 M27,22 L9,22 C5,22 4,19 4,18 L4,23 C4,25.762 6.238,28 9,28 L27,28 C27.553,28 28,27.553 28,27 L28,23 C28,22.447 27.553,22 27,22 M22,8 C21.447,8 21,7.553 21,7 C21,6.447 21.447,6 22,6 C22.553,6 23,6.447 23,7 C23,7.553 22.553,8 22,8 M17,8 C16.447,8 16,7.553 16,7 C16,6.447 16.447,6 17,6 C17.553,6 18,6.447 18,7 C18,7.553 17.553,8 17,8 M12,8 C11.447,8 11,7.553 11,7 C11,6.447 11.447,6 12,6 C12.553,6 13,6.447 13,7 C13,7.553 12.553,8 12,8 M7,8 C6.447,8 6,7.553 6,7 C6,6.447 6.447,6 7,6 C7.553,6 8,6.447 8,7 C8,7.553 7.553,8 7,8 M23,4 L5,4 C4.447,4 4,4.447 4,5 L4,9 C4,9.553 4.447,10 5,10 L23,10 C27,10 28,13 28,14 L28,9 C28,6.238 25.762,4 23,4"/>
        </svg>
      `,
      pendant: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <g${pendantClass}>
            <path fill="none" stroke="#a0a0a0" stroke-width="2.8" stroke-linecap="round" d="M25 4v17"/>
            <path fill="#9da0a2" opacity="0.86" d="M22.7 18.2h4.8c1.2 0 2.1 1 2.1 2.2v5.8c0 1.2-.9 2.2-2.1 2.2h-4.8c-1.2 0-2.1-1-2.1-2.2v-5.8c0-1.2.9-2.2 2.1-2.2z"/>
            <path fill="#9da0a2" d="M9.1 34.4c-.2-7.3 7.2-14.1 15.9-14.1s16.1 6.8 15.9 14.1c-.1 4.9-2.5 5.5-8.8 5.7-4 .1-10.6.1-14.8 0-5.8-.1-8-.9-8.2-5.7z"/>
            ${active ? '<path class="light-color" d="M21 42.4c.5-2.7 1.7-3.3 4.2-3.3s3.7.6 4.1 3.1c.4 2.6-1.6 5-4.1 5s-4.7-2.1-4.2-4.8z"/>' : ''}
          </g>
        </svg>
      `,
      light_flush: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <g id="body">
            <path fill="#9da0a2" opacity="0.8" d="M18.847 21.388C16.243 22.079 14.512 23.149 13.885 24.375C13.793 24.556 13.583 25.038 13.549 25.299C13.435 26.19 14.126 27.242 15.273 28.108C17.273 29.617 20.416 30.441 24.42 30.631L27.42 30.588C32.361 30.176 35.876 28.468 36.452 26.2C36.569 25.739 36.524 25.408 36.27 24.878C36.009 24.33 35.623 23.865 35.053 23.405C33.617 22.248 31.402 21.45 28.355 20.843C25.612 20.19 21.712 20.642 18.847 21.388ZM25.183 21.886C25.183 21.886 28.625 21.868 30.593 23.093C31.524 23.672 32.515 24.307 32.437 25.249C32.34 26.42 30.406 27.343 30.406 27.343C28.229 28.29 25.312 28.281 25.312 28.281C22.792 28.344 20.794 27.535 20.794 27.535C18.24 26.593 18.062 25.281 18.062 25.281C18.134 24.175 19.037 23.562 19.843 23.062C21.391 22.101 25.183 21.886 25.183 21.886Z"/>
            <path fill="#9da0a2" d="M25.243 17.913C15.653 17.809 8.131 21.052 7.733 25C7.315 29.148 16.07 32.922 25.452 32.922C34.834 32.922 43.112 28.716 42.336 25.07C41.622 21.715 34.903 18.087 25.243 17.913ZM25.417 30.866C16.78 30.771 12.541 27.226 13.405 24.828C13.791 23.847 15.401 21.415 22.459 20.58C26.249 20.248 27.413 20.489 29.761 21.022C36.964 22.661 36.752 25.989 36.752 25.989C36.301 29.257 30.348 30.939 25.418 30.867Z"/>
          </g>
          <path fill="#707070" d="M42.316 25.012C41.603 23.019 40.277 22.207 40.277 22.207C36.714 19.347 31.883 18.661 28.947 18.224C25.505 17.712 21.478 18.057 21.478 18.057C15.227 18.68 12.928 19.952 10.795 21.096C10.795 21.096 8.371 23.11 7.808 24.606C7.808 24.606 8.205 22.474 8.531 21.871C9.048 20.912 10.53 19.862 11.002 19.572C16.034 17.047 19.435 16.678 23.652 16.585C24.911 16.557 26.971 16.634 26.971 16.634C31.712 16.954 33.768 17.631 36.597 18.675C36.597 18.675 39.671 20.146 40.678 21.183C41.125 21.643 41.752 22.321 41.956 22.929C42.111 23.459 42.266 24.473 42.316 25.012Z"/>
          ${flushBeam}
        </svg>
      `,
    };

    return `<span class="tpl-light-icon icon-${name}${active ? ' is-on' : ''}">${glow}${icons[name] || icons.light_flush}</span>`;
  }

  static _resolvePicture(src) {
    if (!src) return '';
    if (src.startsWith('http') || src.startsWith('/')) return src;
    return `/api/media_player_proxy/${src}`;
  }

  static _withCacheBust(src, stamp) {
    if (!src) return '';
    const joiner = src.includes('?') ? '&' : '?';
    return `${src}${joiner}bruno_t=${stamp || Date.now()}`;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoQuartoMiguelSubview._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_QUARTO_MIGUEL_SUBVIEW_TAG)) {
  customElements.define(BRUNO_QUARTO_MIGUEL_SUBVIEW_TAG, BrunoQuartoMiguelSubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_QUARTO_MIGUEL_SUBVIEW_TAG,
  name: 'Bruno Q. Miguel Subview',
  preview: false,
  description: 'Q. Miguel subview rebuilt as an isolated Bruno Liquid Glass Web Component.',
});
