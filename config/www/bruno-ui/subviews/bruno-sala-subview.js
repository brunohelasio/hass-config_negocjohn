const BRUNO_SALA_SUBVIEW_TAG = 'bruno-sala-subview';

const BRUNO_SALA_SUBVIEW_DEFAULT_CONFIG = {
  title: 'Sala',
  subtitle: 'Visao geral',
  greeting_name: 'Bruno',
  navigation_path: 'bento-lab',
  background: '/local/images/sala_estar.jpg',
  fallback_background: '/local/images/sala_estar.jpg',
  refresh_interval: 6500,
  spotify_device_name: 'Echo Show',
  room_nav: [
    { key: 'sala', name: 'Sala', icon: 'mdi:sofa', path: 'subview-sala', active: true },
    { key: 'office', name: 'Office', icon: 'mdi:desk', path: 'subview-office' },
    { key: 'cozinha', name: 'Cozinha', icon: 'mdi:countertop', path: 'subview-cozinha' },
    { key: 'lavabo', name: 'Lavabo', icon: 'mdi:toilet', path: 'subview-lavabo', divider_after: true },
    { key: 'casal', name: 'Q. Casal', icon: 'mdi:bed-king', path: 'subview-quarto-casal' },
    { key: 'marina', name: 'Q. Marina', icon: 'mdi:bed-single', path: 'subview-quarto-marina' },
    { key: 'miguel', name: 'Q. Miguel', icon: 'mdi:crib-outline', path: 'subview-quarto-miguel' },
  ],
  entities: {
    curtain: 'cover.cortina_sala',
    active_sensor: 'sensor.living_room_active',
    temperature: ['sensor.sl_sensor_temp_humid_temperatura', 'sensor.sensor_4_in_1_sala_temperature'],
    humidity: ['sensor.sl_sensor_temp_humid_umidade', 'sensor.sensor_4_in_1_sala_humidity'],
    room_group: 'light.grupo_luzes_sala',
    camera_main: 'camera.sl_camera_2',
    camera_secondary: 'camera.vr_camera_2',
    active_camera_select: 'input_select.bento_active_camera',
    tv: 'media_player.android_tv_192_168_3_17',
    tv_remote_player: 'media_player.atv',
    tv_remote: 'remote.atv',
    spotify: 'media_player.spotifyplus_bruno_helasio',
    speaker: 'media_player.echo_show',
    climate: 'climate.sl_ar_condicionado',
    router: '',
    zigbee_hub: '',
    ps5: 'switch.ps5_power',
    ps5_image: '/local/images/ps5.png',
    lights: [
      // FALLBACK - agrupamento antigo da subview:
      // light.sala_switch_2 / light.sl_leds_direito_e_esquerdo /
      // light.sala_2_switch_2 / light.sala_2_switch_3 /
      // light.varanda_switch_1 / light.varanda_switch_2 /
      // LED Fita TV / Luz Auxiliar.
      { entity: 'light.sala_switch_2', name: 'SL Luz Principal', icon_type: 'light_flush', zone: 'sala' },
      { entity: 'light.sala_switch_1', name: 'SL LED Esquerdo', icon_type: 'ledstrip', zone: 'sala' },
      { entity: 'light.sala_switch_3', name: 'SL LED Direito', icon_type: 'ledstrip', zone: 'sala' },
      { entity: '', name: 'LED Fita TV', icon_type: 'ledstrip', placeholder: true, zone: 'sala' },
      { entity: 'light.sala_2_switch_2', name: 'VR Luz Principal', icon_type: 'light_flush', zone: 'varanda' },
      { entity: 'light.varanda_switch_2', name: 'Varanda Pendente', icon_type: 'pendant', zone: 'varanda' },
      { entity: 'light.varanda_switch_1', name: 'Varanda Area Gourmet', icon_type: 'ledstrip', zone: 'varanda' },
      { entity: 'light.sala_2_switch_3', name: 'Varanda Cristaleira', icon_type: 'ledstrip', zone: 'varanda' },
    ],
    cameras: [
      { entity: 'camera.sl_camera_2', name: 'Sala Principal', short_name: 'Sala' },
      { entity: 'camera.vr_camera_2', name: 'Sala Lateral', short_name: 'Varanda' },
    ],
  },
};

const BRUNO_SALA_SUBVIEW_CLIMATE_ON_STATES = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const BRUNO_SALA_SUBVIEW_CLIMATE_ACTIVE_ACTIONS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const BRUNO_SALA_SUBVIEW_CLIMATE_INACTIVE_ACTIONS = ['off', 'idle'];
const BRUNO_SALA_SUBVIEW_TV_ON_STATES = ['on', 'playing', 'paused', 'idle'];
const BRUNO_SALA_SUBVIEW_MEDIA_ON_STATES = ['playing', 'paused', 'on', 'idle'];
const BRUNO_SALA_SUBVIEW_CAMERA_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];
const BRUNO_SALA_SUBVIEW_UNAVAILABLE_STATES = ['unavailable', 'unknown', '', 'none', 'null'];

class BrunoSalaSubview extends HTMLElement {
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
    this._lastMinute = '';
    this._lastActionAt = {};
    this._spotifyToolsOpen = false;
    this._boundActionHandler = (event) => this._handleAction(event);
    this._boundInputHandler = (event) => this._handleInput(event);
  }

  setConfig(config) {
    this._config = this._normalizeConfig(config || {});
    this._safeRender();
    this._startRefreshTimer();
  }

  set hass(hass) {
    this._hass = hass;
    this._safeRender();
    this._startRefreshTimer();
  }

  connectedCallback() {
    globalThis.BrunoLiquidGlass?.apply?.();
    this._startRefreshTimer();
    this._startClockTimer();
  }

  disconnectedCallback() {
    this._stopRefreshTimer();
    this._stopClockTimer();
  }

  getCardSize() {
    return 12;
  }

  _normalizeConfig(config) {
    const entities = {
      ...BRUNO_SALA_SUBVIEW_DEFAULT_CONFIG.entities,
      ...(config.entities || {}),
    };

    if (Array.isArray(config.entities?.lights)) entities.lights = config.entities.lights;
    if (Array.isArray(config.entities?.cameras)) entities.cameras = config.entities.cameras;

    return {
      ...BRUNO_SALA_SUBVIEW_DEFAULT_CONFIG,
      ...config,
      refresh_interval: Math.max(4000, Number(config.refresh_interval) || BRUNO_SALA_SUBVIEW_DEFAULT_CONFIG.refresh_interval),
      room_nav: Array.isArray(config.room_nav) ? config.room_nav : BRUNO_SALA_SUBVIEW_DEFAULT_CONFIG.room_nav,
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
      <div class="error">Erro na subview Sala: ${BrunoSalaSubview._escape(error?.message || error)}</div>
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

      const nextSrc = BrunoSalaSubview._withCacheBust(baseSrc, stamp);
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
    return !entity || BRUNO_SALA_SUBVIEW_UNAVAILABLE_STATES.includes(String(entity.state || '').toLowerCase());
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

  _temperatureLabel() {
    const value = this._numberState(this._config.entities.temperature, null);
    return value == null ? '--' : `${this._formatNumber(value, 1)}\u00b0`;
  }

  _humidityLabel() {
    const value = this._numberState(this._config.entities.humidity, null);
    return value == null ? '--' : `${this._formatNumber(value, 0)}%`;
  }

  _curtainPosition() {
    const value = this._state(this._config.entities.curtain)?.attributes?.current_position;
    const number = Number(value);
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(100, Math.round(number)));
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
    const online = !unavailable && BRUNO_SALA_SUBVIEW_CAMERA_ONLINE_STATES.includes(state);
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
      imageUrl: this._loadedCameraUrls[camera.entity] || BrunoSalaSubview._withCacheBust(image, this._refreshSeed),
      status: online ? 'Ao vivo' : (unavailable ? 'Indisponivel' : 'Online'),
    };
  }

  _camerasModel() {
    const cameras = (this._config.entities.cameras || []).map((camera) => this._cameraState(camera));
    const activeId = this._state(this._config.entities.active_camera_select)?.state;
    const activeCamera = cameras.find((camera) => camera.entity === activeId) || cameras[0];
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
    const active = BRUNO_SALA_SUBVIEW_TV_ON_STATES.includes(state);
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

  _spotifyModel() {
    const entity = this._state(this._config.entities.spotify);
    const attrs = entity?.attributes || {};
    const state = entity?.state || 'off';
    const active = BRUNO_SALA_SUBVIEW_MEDIA_ON_STATES.includes(state);
    return {
      entity,
      state,
      active,
      playing: state === 'playing',
      title: attrs.media_title || 'No Media Playing',
      subtitle: attrs.media_artist || attrs.media_album_name || '',
      artwork: attrs.entity_picture || attrs.media_image_url || '',
      source: attrs.source || this._config.spotify_device_name || 'Echo Show',
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
      image: this._config.entities.ps5_image || '/local/images/ps5.png',
    };
  }

  _climateAction(entity) {
    return String(entity?.attributes?.hvac_action || '').toLowerCase();
  }

  _climateIsActive(entity) {
    if (this._isUnavailable(entity) || entity.state === 'off') return false;
    const hvacAction = this._climateAction(entity);
    if (BRUNO_SALA_SUBVIEW_CLIMATE_ACTIVE_ACTIONS.includes(hvacAction)) return true;
    if (BRUNO_SALA_SUBVIEW_CLIMATE_INACTIVE_ACTIONS.includes(hvacAction)) return false;
    return BRUNO_SALA_SUBVIEW_CLIMATE_ON_STATES.includes(entity.state || '');
  }

  _climateModel() {
    const entity = this._state(this._config.entities.climate);
    const attrs = entity?.attributes || {};
    const target = Number(attrs.temperature);
    const current = Number(attrs.current_temperature);
    const hvacAction = this._climateAction(entity);
    const active = this._climateIsActive(entity);
    return {
      entity,
      active,
      target: Number.isFinite(target) ? target : null,
      current: Number.isFinite(current) ? current : null,
      hvacMode: entity?.state || 'off',
      fan: attrs.fan_mode || 'auto',
      swing: attrs.swing_mode || 'Ativada',
      action: hvacAction === 'idle' ? 'em espera' : (active ? (hvacAction || 'ligado') : 'off'),
    };
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

  _fireDomEvent(action) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: action,
      bubbles: true,
      composed: true,
    }));
  }

  _openTvRemotePopup() {
    this._fireDomEvent({
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Apple TV',
          tag: 'sala_tv_remote',
          style: '--popup-max-width: min(760px, 92vw); --popup-border-width: 0;',
          content: {
            type: 'custom:apple-tv-card',
            full_screen: true,
            entity: this._config.entities.tv_remote_player || 'media_player.atv',
            remote: this._config.entities.tv_remote || 'remote.atv',
            sources: [
              { source_name: 'Infuse' },
              { source_name: 'Disney+' },
              { source_name: 'Netflix' },
              { source_name: 'Prime Video' },
              { image: '/local/dashboard-resources/Apple-Tv-Card/logo/youtube.png', source_name: 'YouTube' },
              { image: '/local/dashboard-resources/Apple-Tv-Card/logo/dazn.png', source_name: 'DAZN' },
            ],
          },
        },
      },
    });
  }

  _openSpotifyPlusPopup(mode = 'full') {
    const sections = mode === 'devices'
      ? ['devices']
      : mode === 'library'
        ? ['userpresets']
        : ['player', 'devices', 'userpresets'];

    this._fireDomEvent({
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Spotify',
          tag: `spotify_sala_${mode}`,
          style: '--popup-max-width: min(560px, 92vw); --popup-border-width: 0;',
          content: {
            type: 'custom:spotifyplus-card',
            entity: this._config.entities.spotify,
            deviceDefaultId: this._config.spotify_device_name,
            deviceControlByName: true,
            playerBackgroundImageSize: 'cover',
            sections,
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

  _navigate(path) {
    if (!path) return;
    const resolvedPath = this._resolveNavigationPath(path);
    const eventPath = path.startsWith('/') ? resolvedPath : path;
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: eventPath },
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

    if (action === 'navigate') this._navigate(target.dataset.path || this._config.navigation_path);
    if (action === 'more-info') this._moreInfo(entityId);
    if (action === 'cover-open') this._callService('cover.open_cover', { entity_id: this._config.entities.curtain });
    if (action === 'cover-close') this._callService('cover.close_cover', { entity_id: this._config.entities.curtain });
    if (action === 'cover-stop') this._callService('cover.stop_cover', { entity_id: this._config.entities.curtain });
    if (action === 'cover-position') {
      const position = Number(target.dataset.position);
      if (Number.isFinite(position)) {
        this._callService('cover.set_cover_position', {
          entity_id: this._config.entities.curtain,
          position,
        });
      }
    }
    if (action === 'lights-on') this._callService('light.turn_on', { entity_id: this._config.entities.room_group });
    if (action === 'lights-off') this._callService('light.turn_off', { entity_id: this._config.entities.room_group });
    if (action === 'toggle-light') this._callService('homeassistant.toggle', { entity_id: entityId });
    if (action === 'select-camera') {
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
    if (action === 'spotify-more') {
      this._spotifyToolsOpen = !this._spotifyToolsOpen;
      this._safeRender();
      return;
    }
    if (action === 'spotify-devices') {
      this._openSpotifyPlusPopup('devices');
      return;
    }
    if (action === 'spotify-library') {
      this._openSpotifyPlusPopup('library');
      return;
    }
    if (action === 'spotify-plus') {
      this._openSpotifyPlusPopup('full');
      return;
    }
    if (action === 'spotify-prev') this._callService('media_player.media_previous_track', { entity_id: this._config.entities.spotify });
    if (action === 'spotify-next') this._callService('media_player.media_next_track', { entity_id: this._config.entities.spotify });
    if (action === 'spotify-play-pause') {
      const spotify = this._spotifyModel();
      if (spotify.playing) {
        this._callService('media_player.media_pause', { entity_id: this._config.entities.spotify });
      } else {
        this._callService('spotifyplus.player_transfer_playback', {
          entity_id: this._config.entities.spotify,
          device_name: this._config.spotify_device_name,
          play: true,
          force_activate_device: true,
        });
      }
    }
    if (action === 'spotify-play') {
      this._callService('spotifyplus.player_transfer_playback', {
        entity_id: this._config.entities.spotify,
        device_name: this._config.spotify_device_name,
        play: true,
        force_activate_device: true,
      });
    }
    if (action === 'spotify-pause') this._callService('media_player.media_pause', { entity_id: this._config.entities.spotify });
    if (action === 'toggle-ps5' && this._config.entities.ps5) this._callService('homeassistant.toggle', { entity_id: this._config.entities.ps5 });
    if (action === 'toggle-climate' && !this._cooldown('climate', 1800)) {
      const model = this._climateModel();
      this._callService(model.active ? 'climate.turn_off' : 'climate.turn_on', { entity_id: this._config.entities.climate });
    }
    if (action === 'temp-down' || action === 'temp-up') {
      const model = this._climateModel();
      const current = Number(model.target);
      if (Number.isFinite(current)) {
        this._callService('climate.set_temperature', {
          entity_id: this._config.entities.climate,
          temperature: action === 'temp-up' ? current + 1 : current - 1,
        });
      }
    }
  }

  _handleInput(event) {
    const target = event.target;
    if (!target?.matches?.('[data-action]')) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    if (target.dataset.action === 'spotify-volume') {
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
    if (target.dataset.action !== 'brightness') return;
    this._callService('light.turn_on', {
      entity_id: this._config.entities.room_group,
      brightness_pct: Math.max(1, Math.min(100, Math.round(value))),
    });
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    globalThis.BrunoLiquidGlass?.apply?.();

    const model = {
      lights: this._activeLightsCount(),
      curtainPosition: this._curtainPosition(),
      cameras: this._camerasModel(),
      tv: this._tvModel(),
      spotify: this._spotifyModel(),
      ps5: this._ps5Model(),
      climate: this._climateModel(),
    };
    this._lastMinute = this._clock();

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main class="sala-subview">
        ${this._renderRoomSidebar()}

        <section class="hero-panel">
          ${this._renderHero(model)}
        </section>

        <section class="side-panel">
          ${this._renderStatusRail(model)}
          ${this._renderLights(model)}
        </section>

        ${this._renderCameras(model)}
        ${this._renderTV(model)}
        ${this._renderPS5(model)}
        ${this._renderSpotify(model)}
        ${this._renderAC(model)}
      </main>
    `;

    this.shadowRoot.removeEventListener('click', this._boundActionHandler);
    this.shadowRoot.removeEventListener('change', this._boundInputHandler);
    this.shadowRoot.addEventListener('click', this._boundActionHandler);
    this.shadowRoot.addEventListener('change', this._boundInputHandler);
  }

  _renderHero(model) {
    const title = BrunoSalaSubview._escape(this._config.title);
    const subtitle = BrunoSalaSubview._escape(this._config.subtitle);
    const background = BrunoSalaSubview._escapeAttr(this._config.background);
    const fallbackBackground = BrunoSalaSubview._escapeAttr(this._config.fallback_background || this._config.background);

    return `
      <div class="hero-stage">
        <div class="hero-bg" style="--hero-image: url('${background}'); --hero-fallback-image: url('${fallbackBackground}');" aria-hidden="true"></div>
        <div class="hero-content">
          <div class="hero-top">
            <button class="back-button" type="button" data-action="navigate" data-path="${BrunoSalaSubview._escapeAttr(this._config.navigation_path)}" aria-label="Voltar">
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </button>
            <div>
              <div class="hero-title">${title}</div>
              <div class="hero-subtitle">${subtitle}</div>
            </div>
          </div>

          <div class="hero-headline">
            <p class="hero-date-line">${BrunoSalaSubview._escape(this._dateLine())}</p>
            <div class="hero-clock" data-clock>${this._lastMinute}</div>
          </div>

          <div class="curtain-dock">
            <div class="curtain-copy">
              <span class="module-icon"><ha-icon icon="mdi:curtains"></ha-icon></span>
              <div>
                <div class="module-title">Cortinas</div>
                <div class="module-subtitle">Controle</div>
              </div>
            </div>
            <div class="curtain-actions">
              <button type="button" class="preset-button" data-action="cover-open">
                <ha-icon icon="mdi:curtains"></ha-icon><span>Aberta</span>
              </button>
              <button type="button" class="preset-button" data-action="cover-position" data-position="50">
                <ha-icon icon="mdi:curtains"></ha-icon><span>Semiaberta</span>
              </button>
              <button type="button" class="preset-button" data-action="cover-close">
                <ha-icon icon="mdi:curtains-closed"></ha-icon><span>Fechada</span>
              </button>
              <button type="button" class="preset-button is-primary" data-action="cover-stop">
                <ha-icon icon="mdi:home-automation"></ha-icon><span>Automatica</span>
              </button>
              <span class="curtain-pill">Automatica - ${model.curtainPosition}%</span>
            </div>
            <div class="curtain-progress">
              <span style="width:${model.curtainPosition}%"></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderRoomSidebar() {
    const items = this._config.room_nav || [];

    return `
      <nav class="room-sidebar" aria-label="Navegacao de comodos">
        ${items.map((item) => `
          <button
            type="button"
            class="room-nav-button${item.active ? ' is-active' : ''}${item.divider_after ? ' has-divider' : ''}"
            data-action="navigate"
            data-path="${BrunoSalaSubview._escapeAttr(item.path || this._config.navigation_path)}"
            title="${BrunoSalaSubview._escapeAttr(item.name)}"
            aria-label="${BrunoSalaSubview._escapeAttr(item.name)}"
          >
            <ha-icon icon="${BrunoSalaSubview._escapeAttr(item.icon || 'mdi:square-rounded-outline')}"></ha-icon>
          </button>
        `).join('')}
      </nav>
    `;
  }

  _renderStatusRail(model) {
    const status = [
      { icon: 'mdi:lightbulb-on', value: `${model.lights} ${model.lights === 1 ? 'luz' : 'luzes'}`, label: 'Acesas', tone: 'amber' },
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
              <strong>${BrunoSalaSubview._escape(item.value)}</strong>
              <span>${BrunoSalaSubview._escape(item.label)}</span>
            </div>
            <ha-icon class="status-chevron" icon="mdi:chevron-right"></ha-icon>
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

  _renderLightTile(light) {
    const state = this._state(light.entity);
    const active = state?.state === 'on';
    const disabled = !light.entity || light.placeholder;

    return `
      <button type="button" class="light-tile${active ? ' is-on' : ''}${disabled ? ' is-placeholder' : ''}" ${disabled ? 'disabled' : `data-action="toggle-light" data-entity="${BrunoSalaSubview._escapeAttr(light.entity)}"`}>
        <span class="light-icon">${BrunoSalaSubview._tplLightIcon(light.icon_type || light.icon, active)}</span>
        <span class="switch-knob${active ? ' is-on' : ''}"></span>
        <strong>${BrunoSalaSubview._escape(light.name)}</strong>
        <small>${disabled ? 'Placeholder' : (active ? 'Ligada' : 'Desligada')}</small>
      </button>
    `;
  }

  _renderLights(model) {
    const lights = this._config.entities.lights || [];
    const salaLights = lights.filter((light) => (light.zone || 'sala') === 'sala');
    const varandaLights = lights.filter((light) => light.zone === 'varanda');

    return `
      <div class="glass-card lights-card">
        <div class="module-head">
          <div>
            <div class="module-title">Luzes</div>
            <div class="module-subtitle">${this._lightsSubtitle(lights.length, model.lights)}</div>
          </div>
          <div class="head-actions">
            <button type="button" class="chip-button is-active" data-action="lights-on">Todas acesas</button>
            <button type="button" class="chip-button" data-action="lights-off">Apagar todas</button>
          </div>
        </div>

        <div class="lights-groups">
          <section class="light-group">
            <span class="light-group-label">Sala</span>
            <div class="light-group-grid">
              ${salaLights.map((light) => this._renderLightTile(light)).join('')}
            </div>
          </section>
          <span class="lights-divider" aria-hidden="true"></span>
          <section class="light-group">
            <span class="light-group-label">Varanda</span>
            <div class="light-group-grid">
              ${varandaLights.map((light) => this._renderLightTile(light)).join('')}
            </div>
          </section>
        </div>
      </div>
    `;
  }

  _renderCameras(model) {
    const active = model.cameras.activeCamera || model.cameras.cameras[0];
    const secondary = model.cameras.cameras.find((camera) => camera.entity !== active?.entity) || model.cameras.cameras[1];

    return `
      <section class="glass-card cameras-card">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:cctv"></ha-icon></span>
            <div>
              <div class="module-title">Cameras</div>
            </div>
          </div>
          <div class="online-chip"><span></span>${model.cameras.onlineCount}/${model.cameras.cameras.length} online</div>
        </div>

        <div class="camera-stage">
          <button type="button" class="camera-main" data-action="more-info" data-entity="${BrunoSalaSubview._escapeAttr(active?.entity || '')}">
            ${this._cameraFrame(active)}
            <div class="camera-row-copy">
              <strong>${BrunoSalaSubview._escape(active?.name || 'Camera')}</strong>
              <span><span class="live-dot"></span>${BrunoSalaSubview._escape(active?.status || 'Online')}</span>
            </div>
            <ha-icon class="camera-chevron" icon="mdi:chevron-right"></ha-icon>
          </button>

          ${secondary ? `
            <button type="button" class="camera-thumb-overlay" data-action="select-camera" data-entity="${BrunoSalaSubview._escapeAttr(secondary.entity)}" aria-label="Expandir ${BrunoSalaSubview._escapeAttr(secondary.name)}">
              ${this._cameraFrame(secondary)}
              <span>${BrunoSalaSubview._escape(secondary.short_name || secondary.name)}</span>
            </button>
          ` : ''}
        </div>
      </section>
    `;
  }

  _cameraFrame(camera) {
    if (!camera) {
      return `
        <div class="camera-row-image">
          <div class="camera-placeholder"><ha-icon icon="mdi:video-outline"></ha-icon></div>
        </div>
      `;
    }
    const image = camera?.imageUrl || '';
    const base = camera?.image || '';
    return `
      <div class="camera-row-image">
        ${image ? `<img src="${BrunoSalaSubview._escapeAttr(image)}" data-camera-src-base="${BrunoSalaSubview._escapeAttr(base)}" data-camera-entity="${BrunoSalaSubview._escapeAttr(camera.entity)}" alt="">` : ''}
        <div class="camera-placeholder"><ha-icon icon="mdi:video-outline"></ha-icon></div>
      </div>
    `;
  }

  _renderTV(model) {
    const tv = model.tv;
    const poster = tv.poster ? BrunoSalaSubview._resolvePicture(tv.poster) : '';
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
            <div class="media-source">${BrunoSalaSubview._escape(tv.source)}</div>
            ${tv.subtitle ? `<div class="media-subtitle">${BrunoSalaSubview._escape(tv.subtitle)}</div>` : ''}
            <div class="control-row">
              <button type="button" class="control-button" data-action="toggle-tv"><ha-icon icon="mdi:power"></ha-icon></button>
              <button type="button" class="control-button" data-action="tv-remote"><ha-icon icon="mdi:remote-tv"></ha-icon></button>
              <button type="button" class="control-button" data-action="tv-play-pause"><ha-icon icon="mdi:play-pause"></ha-icon></button>
            </div>
            <div class="volume-row">
              <ha-icon icon="mdi:volume-medium"></ha-icon>
              <strong>${volume}%</strong>
              <input type="range" min="0" max="100" value="${volume}" data-action="tv-volume" aria-label="Volume da TV">
              <ha-icon icon="mdi:volume-high"></ha-icon>
            </div>
          </div>
          <div class="poster-card${poster ? ' has-poster' : ''}">
            ${poster ? `<img src="${BrunoSalaSubview._escapeAttr(poster)}" alt="">` : '<span>Poster</span>'}
          </div>
        </div>
      </section>
    `;
  }

  _renderPS5(model) {
    const ps5 = model.ps5;
    const image = ps5.image ? BrunoSalaSubview._escapeAttr(ps5.image) : '';

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
              <button type="button" class="control-button" data-action="more-info" data-entity="${BrunoSalaSubview._escapeAttr(ps5.entityId || '')}" ${ps5.configured ? '' : 'disabled'}><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderSpotify(model) {
    const spotify = model.spotify;
    const artwork = spotify.artwork ? BrunoSalaSubview._resolvePicture(spotify.artwork) : '';
    const volume = spotify.volume == null ? 66 : spotify.volume;
    const subtitle = spotify.subtitle ? `<div class="media-subtitle">${BrunoSalaSubview._escape(spotify.subtitle)}</div>` : '';
    const controls = this._spotifyToolsOpen
      ? `
        <button type="button" class="control-button" data-action="spotify-more" title="Voltar"><ha-icon icon="mdi:chevron-left"></ha-icon></button>
        <button type="button" class="control-button is-tool" data-action="spotify-devices" title="Dispositivos"><ha-icon icon="mdi:speaker-wireless"></ha-icon></button>
        <button type="button" class="control-button is-tool" data-action="spotify-library" title="Playlists e fila"><ha-icon icon="mdi:playlist-music"></ha-icon></button>
        <button type="button" class="control-button is-tool" data-action="spotify-plus" title="Mais opcoes"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>
      `
      : `
        <button type="button" class="control-button" data-action="spotify-prev"><ha-icon icon="mdi:skip-previous"></ha-icon></button>
        <button type="button" class="control-button is-main" data-action="spotify-play-pause"><ha-icon icon="${spotify.playing ? 'mdi:pause' : 'mdi:play'}"></ha-icon></button>
        <button type="button" class="control-button" data-action="spotify-next"><ha-icon icon="mdi:skip-next"></ha-icon></button>
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
          <span class="state-chip"><span></span>${spotify.playing ? 'Tocando no Spotify' : BrunoSalaSubview._escape(spotify.state)}</span>
        </div>

        <div class="spotify-body">
          <div class="spotify-art${artwork ? ' has-art' : ''}">
            ${artwork ? `<img src="${BrunoSalaSubview._escapeAttr(artwork)}" alt="">` : '<ha-icon icon="mdi:music-note"></ha-icon>'}
          </div>
          <div class="spotify-copy">
            <div class="media-title">${BrunoSalaSubview._escape(spotify.title)}</div>
            ${subtitle}
            <div class="spotify-controls">
              ${controls}
            </div>
            <div class="volume-row spotify-volume">
              <ha-icon icon="mdi:volume-medium"></ha-icon>
              <input type="range" min="0" max="100" value="${volume}" data-action="spotify-volume" aria-label="Volume do Spotify">
              <strong>${volume}%</strong>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderAC(model) {
    const climate = model.climate;
    const target = climate.target == null ? '--' : this._formatNumber(climate.target, 0);
    const climateEntity = BrunoSalaSubview._escapeAttr(this._config.entities.climate);
    const activeMode = climate.hvacMode || 'off';
    const fan = String(climate.fan || 'auto').toLowerCase();
    const swingActive = String(climate.swing || '').toLowerCase().includes('ativ');
    const modeButtons = [
      { key: 'heat', icon: 'mdi:fire', label: 'Heat' },
      { key: 'cool', icon: 'mdi:snowflake', label: 'Cool' },
      { key: 'fan_only', icon: 'mdi:fan', label: 'Fan' },
      { key: 'off', icon: 'mdi:power', label: 'Power', action: 'toggle-climate' },
    ];
    const fanButtons = [
      { key: 'low', label: 'Low', active: fan.includes('low') || fan.includes('baixo') },
      { key: 'medium', label: 'Med', active: fan.includes('med') },
      { key: 'high', label: 'High', active: fan.includes('high') || fan.includes('alto') },
      { key: 'swing', label: 'Swing', active: swingActive },
    ];

    return `
      <section class="glass-card ac-card${climate.active ? ' is-active' : ''}">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:snowflake"></ha-icon></span>
            <div>
              <div class="module-title">Ar Condicionado</div>
            </div>
          </div>
        </div>
        <div class="ac-body">
          <div class="ac-summary">
            <span class="ac-summary-icon"><ha-icon icon="mdi:fire"></ha-icon></span>
            <div>
              <strong>Aircondition</strong>
              <small>${BrunoSalaSubview._escape(this._climateSummary(climate, target))}</small>
            </div>
          </div>
          <div class="climate-mode-row" aria-label="Modo do ar condicionado">
            ${modeButtons.map((button) => `
              <button
                type="button"
                class="climate-mode${activeMode === button.key ? ' is-active' : ''}"
                data-action="${button.action || 'more-info'}"
                ${button.action ? '' : `data-entity="${climateEntity}"`}
                title="${BrunoSalaSubview._escapeAttr(button.label)}"
              >
                <ha-icon icon="${button.icon}"></ha-icon>
              </button>
            `).join('')}
          </div>
          <div class="climate-stepper">
            <button type="button" data-action="temp-down">-</button>
            <span>${target}</span>
            <button type="button" data-action="temp-up">+</button>
          </div>
          <div class="fan-label">Fan mode</div>
          <div class="fan-mode-row">
            ${fanButtons.map((button) => `
              <button
                type="button"
                class="fan-mode${button.active ? ' is-active' : ''}"
                data-action="more-info"
                data-entity="${climateEntity}"
              >${BrunoSalaSubview._escape(button.label)}</button>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  _styles() {
    return `
      :host {
        --sala-gap: 10px;
        --sala-radius: var(--bruno-liquid-card-radius, 18px);
        --sala-radius-small: var(--bruno-liquid-card-radius-compact, 16px);
        --sala-cell-radius: 12px;
        --accent: var(--bruno-liquid-accent, 150, 190, 255);
        --accent-blue: 96, 165, 250;
        --accent-cyan: 79, 172, 254;
        --accent-amber: 255, 183, 77;
        --text-main: rgba(245,250,255,0.96);
        --text-soft: rgba(255,255,255,0.62);
        --text-dim: rgba(255,255,255,0.42);
        display: block;
        width: 100%;
        height: 100vh;
        min-height: 100vh;
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

      .sala-subview {
        width: 100%;
        min-height: 100vh;
        height: 100vh;
        display: grid;
        grid-template-columns: 64px repeat(3, minmax(0, 1.15fr)) repeat(6, minmax(0, 1fr)) repeat(3, minmax(0, 1.10fr));
        grid-template-rows: 42px minmax(0, 45fr) minmax(0, 15fr) minmax(0, 24fr) 62px;
        grid-template-areas:
          "frame-left frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top frame-top"
          "frame-left hero hero hero hero hero side side side side side side side"
          "frame-left cams cams cams tv tv ps5 ps5 spotify spotify ac ac ac"
          "frame-left cams cams cams tv tv ps5 ps5 spotify spotify ac ac ac"
          "frame-left frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom frame-bottom";
        gap: var(--sala-gap);
        padding: 12px;
        background:
          radial-gradient(760px 420px at 16% 2%, rgba(110,150,210,0.12), transparent 72%),
          radial-gradient(680px 420px at 96% 70%, rgba(255,190,120,0.08), transparent 74%),
          #020406;
        overflow: hidden;
      }

      .hero-panel { grid-area: hero; min-width: 0; min-height: 0; }
      .side-panel { grid-area: side; min-width: 0; min-height: 0; display: grid; grid-template-rows: 72px minmax(0, 1fr); gap: var(--sala-gap); }
      .room-sidebar { grid-area: frame-left; }
      .cameras-card { grid-area: cams; }
      .tv-card { grid-area: tv; }
      .ps5-card { grid-area: ps5; }
      .spotify-card { grid-area: spotify; }
      .ac-card { grid-area: ac; }

      .room-sidebar {
        position: relative;
        z-index: 3;
        isolation: isolate;
        align-self: center;
        justify-self: center;
        width: 56px;
        display: grid;
        grid-auto-rows: 39px;
        gap: 8px;
        padding: 13px 8px 14px;
        border-radius: 999px;
        background: var(--bruno-liquid-surface-off-background,
          radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
          radial-gradient(38px 110px at 92% 86%, rgba(var(--accent),0.10), transparent 68%),
          linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
          linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
        );
        border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.11));
        box-shadow: var(--bruno-liquid-surface-off-shadow,
          inset 0 1px 0 rgba(255,255,255,0.18),
          inset 0 -1px 0 rgba(255,255,255,0.045),
          0 18px 40px rgba(0,0,0,0.36)
        );
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(30px) saturate(1.58) contrast(1.05));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(30px) saturate(1.58) contrast(1.05));
        overflow: hidden;
      }

      .room-sidebar::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        pointer-events: none;
        border-radius: calc(999px - 1px);
        background:
          radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
          radial-gradient(42px 70px at 94% 18%, rgba(var(--accent),0.16), transparent 72%),
          linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
          linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%);
        opacity: 0.78;
      }

      .room-nav-button {
        position: relative;
        z-index: 1;
        width: 39px;
        height: 39px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: rgba(255,255,255,0.62);
        background: transparent;
        transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
      }

      .room-nav-button::after {
        content: "";
        position: absolute;
        left: 7px;
        right: 7px;
        bottom: -5px;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.13), transparent);
        opacity: 0;
      }

      .room-nav-button.has-divider::after {
        opacity: 1;
      }

      .room-nav-button:hover {
        color: rgba(255,255,255,0.88);
        background: rgba(255,255,255,0.075);
      }

      .room-nav-button.is-active {
        color: white;
        background:
          radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 62%),
          linear-gradient(180deg, rgba(105,150,230,0.68), rgba(59,92,178,0.54));
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.32),
          0 0 20px rgba(96,165,250,0.32);
      }

      .room-nav-button ha-icon {
        --mdc-icon-size: 19px;
      }

      .glass-card {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 0;
        border-radius: var(--sala-radius);
        overflow: hidden;
        background: var(--bruno-liquid-surface-off-background);
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
        border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.18));
        box-shadow: var(--bruno-liquid-surface-off-shadow);
      }

      .glass-card::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: -1;
        pointer-events: none;
        border-radius: calc(var(--sala-radius) - 1px);
        background: var(--bruno-liquid-surface-off-sheen);
        opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.82);
      }

      .glass-card::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
        border-radius: inherit;
        padding: 1px;
        background: var(--bruno-liquid-surface-edge-glow);
        -webkit-mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask:
          linear-gradient(#000 0 0) content-box,
          linear-gradient(#000 0 0);
        mask-composite: exclude;
        opacity: 0.9;
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
        border-radius: 14px;
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
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
        grid-row: 3;
        grid-column: 1 / -1;
        align-self: end;
        display: grid;
        grid-template-columns: 1fr;
        grid-template-rows: auto auto;
        gap: 8px;
        width: min(500px, 100%);
        padding: 0;
        border-radius: 0;
        background: transparent;
        border: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .curtain-copy,
      .title-with-chip {
        display: flex;
        align-items: center;
        gap: 9px;
        min-width: 0;
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
        --mdc-icon-size: 15px;
      }

      .curtain-pill {
        align-self: center;
        justify-self: stretch;
        min-height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0 11px;
        border-radius: 999px;
        color: rgb(255,208,92);
        font-size: 11px;
        font-weight: 800;
        background: rgba(255,183,77,0.12);
        border: 1px solid rgba(255,183,77,0.25);
      }

      .curtain-actions {
        grid-column: 1 / -1;
        justify-self: stretch;
        display: grid;
        grid-template-columns: repeat(4, minmax(68px, 1fr)) minmax(118px, auto);
        align-items: center;
        gap: 8px;
      }

      .preset-button {
        min-height: 48px;
        display: grid;
        place-items: center;
        gap: 4px;
        padding: 6px 6px;
        border-radius: 14px;
        background:
          radial-gradient(74px 44px at 50% 0%, rgba(255,255,255,0.13), transparent 72%),
          rgba(255,255,255,0.058);
        border: 1px solid rgba(255,255,255,0.12);
        color: rgba(255,255,255,0.72);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      }

      .preset-button.is-primary {
        color: rgba(136,122,255,0.98);
        background:
          radial-gradient(64px 46px at 50% 0%, rgba(136,122,255,0.32), transparent 72%),
          rgba(88,72,185,0.22);
        border-color: rgba(136,122,255,0.44);
      }

      .preset-button ha-icon {
        --mdc-icon-size: 19px;
      }

      .preset-button span {
        font-size: 10px;
        font-weight: 700;
      }

      .soft-button,
      .primary-button {
        min-height: 36px;
        padding: 0 14px;
        border-radius: 12px;
        background: rgba(255,255,255,0.075);
        border: 1px solid rgba(255,255,255,0.14);
        color: rgba(255,255,255,0.88);
        font-size: 12px;
        font-weight: 800;
      }

      .soft-button.is-primary,
      .primary-button {
        background: rgba(24,134,190,0.42);
        border-color: rgba(96,190,255,0.50);
      }

      .curtain-progress {
        display: none;
        grid-column: 1 / -1;
        height: 7px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.16);
      }

      .curtain-progress span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, rgba(255,255,255,0.94), rgba(126,204,255,0.78));
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
        grid-template-columns: 1fr auto;
        grid-template-rows: auto 1fr auto;
        align-items: start;
        padding: 11px 12px;
        text-align: left;
        border-radius: var(--sala-radius-small);
        color: rgba(255,255,255,0.86);
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.11);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
      }

      .light-tile.is-on {
        color: rgba(255,255,255,0.98);
        background:
          radial-gradient(76px 48px at 18% 12%, rgba(255,255,255,0.28), transparent 72%),
          radial-gradient(96px 58px at 94% 82%, rgba(255,183,77,0.24), transparent 72%),
          linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.074)),
          linear-gradient(180deg, rgba(255,183,77,0.10), rgba(255,183,77,0.03));
        border-color: rgba(255,205,95,0.44);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.22),
          inset 1px 0 0 rgba(255,255,255,0.08),
          inset 0 -1px 0 rgba(0,0,0,0.08),
          0 0 20px rgba(255,183,77,0.17);
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
        position: relative;
        width: 30px;
        height: 30px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: rgba(255,255,255,0.74);
      }

      .light-tile.is-on .light-icon {
        color: rgb(255,210,86);
        filter: drop-shadow(0 0 10px rgba(255,183,77,0.34));
      }

      .tpl-light-icon {
        position: relative;
        width: 100%;
        height: 100%;
        display: block;
      }

      .tpl-light-icon svg {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        display: block;
        overflow: visible;
      }

      .tpl-light-glow {
        position: absolute;
        inset: 3px;
        border-radius: 999px;
        background: radial-gradient(circle, rgba(255,214,99,0.45), transparent 68%);
        filter: blur(7px);
        opacity: 0.95;
      }

      .switch-knob {
        grid-column: 2;
        width: 34px;
        height: 20px;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
        border: 1px solid rgba(255,255,255,0.13);
      }

      .switch-knob::before {
        content: "";
        display: block;
        width: 14px;
        height: 14px;
        margin: 2px;
        border-radius: 50%;
        background: rgba(255,255,255,0.76);
        transition: transform 160ms ease, background 160ms ease;
      }

      .switch-knob.is-on {
        background: rgba(255,183,77,0.88);
      }

      .switch-knob.is-on::before {
        transform: translateX(14px);
        background: #fff;
      }

      .light-tile strong {
        grid-column: 1 / -1;
        align-self: end;
        font-size: 13px;
        line-height: 1.1;
      }

      .light-tile small {
        grid-column: 1 / -1;
        color: rgba(255,205,95,0.92);
        font-size: 11px;
        font-weight: 700;
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
        border-radius: var(--sala-radius-small);
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.11);
        text-align: left;
      }

      .camera-row-image {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: var(--sala-radius-small);
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
        filter: brightness(0.66) saturate(0.82);
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
        --mdc-icon-size: 36px;
      }

      .camera-main::after,
      .camera-thumb-overlay::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 1;
        pointer-events: none;
        background: linear-gradient(90deg, rgba(4,8,16,0.78), rgba(4,8,16,0.18) 68%, rgba(4,8,16,0.62));
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
        margin-top: 18px;
      }

      .control-button.is-main {
        background:
          radial-gradient(circle at 50% 18%, rgba(142,126,255,0.50), transparent 72%),
          linear-gradient(180deg, rgba(108,88,214,0.74), rgba(60,48,128,0.58));
        border-color: rgba(160,145,255,0.48);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.22),
          0 0 22px rgba(112,88,255,0.26);
      }

      .control-button.is-tool {
        color: rgba(210,245,230,0.96);
        background:
          radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%),
          rgba(255,255,255,0.075);
        border-color: rgba(46,231,122,0.22);
      }

      .volume-row {
        display: grid;
        grid-template-columns: auto auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 9px;
        margin-top: 16px;
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
        accent-color: rgb(116,92,255);
      }

      .spotify-volume {
        grid-template-columns: auto minmax(0, 1fr) auto;
      }

      .spotify-volume input {
        accent-color: rgb(28,214,104);
      }

      .poster-card {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--sala-radius-small);
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.12);
        color: var(--text-dim);
        overflow: hidden;
        font-size: 12px;
        font-weight: 800;
      }

      .tv-card .tv-body {
        grid-template-rows: minmax(132px, 1fr) auto;
      }

      .tv-card .poster-card {
        grid-row: 1;
        min-height: 0;
      }

      .tv-card .tv-main {
        grid-row: 2;
      }

      .tv-card .control-row {
        margin-top: 14px;
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
        grid-template-rows: minmax(132px, 1fr) auto;
        align-items: stretch;
        gap: 8px;
      }

      .spotify-art {
        position: relative;
        inset: auto;
        width: 100%;
        height: 100%;
        min-height: 0;
        justify-self: center;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--sala-radius-small);
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
        grid-template-rows: auto auto auto auto minmax(0, 1fr);
        gap: 10px;
        align-content: start;
      }

      .ac-summary {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr);
        align-items: center;
        gap: 10px;
      }

      .ac-summary-icon {
        width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: rgb(255,116,63);
        background: rgba(255,92,50,0.16);
      }

      .ac-summary-icon ha-icon {
        --mdc-icon-size: 17px;
      }

      .ac-summary strong,
      .fan-label {
        display: block;
        color: rgba(255,255,255,0.90);
        font-size: 13px;
        font-weight: 800;
      }

      .ac-summary small {
        display: block;
        margin-top: 3px;
        color: rgba(255,255,255,0.58);
        font-size: 11px;
        font-weight: 700;
      }

      .climate-mode-row,
      .fan-mode-row {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 8px;
      }

      .climate-mode,
      .fan-mode,
      .climate-stepper {
        min-height: 34px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.09);
        background: rgba(255,255,255,0.050);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.06);
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
        background:
          radial-gradient(circle at 50% 14%, rgba(255,116,63,0.30), transparent 72%),
          rgba(128,61,42,0.42);
        border-color: rgba(255,116,63,0.28);
      }

      .climate-stepper {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 42px;
        align-items: center;
        overflow: hidden;
      }

      .climate-stepper button {
        height: 34px;
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
      }

      .fan-mode.is-active {
        color: rgba(255,255,255,0.94);
        background: rgba(255,255,255,0.11);
        border-color: rgba(255,255,255,0.16);
      }

      .spotify-volume {
        margin-top: 0;
      }

      @media (max-width: 1180px) {
        .room-sidebar {
          display: none;
        }

        .sala-subview {
          height: auto;
          overflow: auto;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: minmax(330px, 46vh) minmax(360px, auto) repeat(2, minmax(300px, auto));
          grid-template-areas:
            "hero side"
            "cams cams"
            "tv ps5"
            "spotify ac";
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

        .sala-subview {
          grid-template-columns: 1fr;
          grid-template-rows: auto;
          grid-template-areas:
            "hero"
            "side"
            "cams"
            "tv"
            "ps5"
            "spotify"
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

        .curtain-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .curtain-pill {
          grid-column: 1 / -1;
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
    `;
  }

  static _tplLightIcon(type, active = false) {
    const name = String(type || '').replace(/^mdi:/, '').replace(/[^a-z0-9_-]/gi, '') || 'light_flush';
    const glow = active
      ? '<span class="tpl-light-glow" aria-hidden="true"></span>'
      : '';
    const icons = {
      ledstrip: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path fill="currentColor" d="M8.4395,16.668 C8.9795,16.552 9.5115,16.895 9.6285,17.435 C9.7455,17.974 9.4025,18.506 8.8625,18.623 C8.3225,18.74 7.7905,18.397 7.6735,17.857 C7.5565,17.317 7.9005,16.785 8.4395,16.668 M13.3275,15.611 C13.8665,15.495 14.3985,15.838 14.5155,16.377 C14.6325,16.917 14.2895,17.449 13.7505,17.566 C13.2105,17.683 12.6775,17.34 12.5605,16.8 C12.4445,16.261 12.7875,15.729 13.3275,15.611 M18.2135,14.555 C18.7535,14.438 19.2865,14.781 19.4025,15.32 C19.5195,15.86 19.1765,16.393 18.6365,16.51 C18.0965,16.626 17.5645,16.283 17.4485,15.743 C17.3315,15.203 17.6735,14.671 18.2135,14.555 M23.1005,13.498 C23.6405,13.381 24.1725,13.724 24.2905,14.264 C24.4065,14.804 24.0635,15.336 23.5235,15.453 C22.9835,15.569 22.4515,15.227 22.3355,14.687 C22.2175,14.147 22.5615,13.614 23.1005,13.498 M10.6695,20.639 L25.4735,17.444 C26.5535,17.211 27.2405,16.147 27.0065,15.067 C26.4495,12.484 23.9035,10.842 21.3205,11.399 L6.5165,14.594 C5.4365,14.827 4.7505,15.891 4.9835,16.971 C5.5415,19.554 8.0865,21.196 10.6695,20.639 M25,26 C24.447,26 24,25.553 24,25 C24,24.447 24.447,24 25,24 C25.553,24 26,24.447 26,25 C26,25.553 25.553,26 25,26 M20,26 C19.447,26 19,25.553 19,25 C19,24.447 19.447,24 20,24 C20.553,24 21,24.447 21,25 C21,25.553 20.553,26 20,26 M15,26 C14.447,26 14,25.553 14,25 C14,24.447 14.447,24 15,24 C15.553,24 16,24.447 16,25 C16,25.553 15.553,26 15,26 M10,26 C9.447,26 9,25.553 9,25 C9,24.447 9.447,24 10,24 C10.553,24 11,24.447 11,25 C11,25.553 10.553,26 10,26 M27,22 L9,22 C5,22 4,19 4,18 L4,23 C4,25.762 6.238,28 9,28 L27,28 C27.553,28 28,27.553 28,27 L28,23 C28,22.447 27.553,22 27,22 M22,8 C21.447,8 21,7.553 21,7 C21,6.447 21.447,6 22,6 C22.553,6 23,6.447 23,7 C23,7.553 22.553,8 22,8 M17,8 C16.447,8 16,7.553 16,7 C16,6.447 16.447,6 17,6 C17.553,6 18,6.447 18,7 C18,7.553 17.553,8 17,8 M12,8 C11.447,8 11,7.553 11,7 C11,6.447 11.447,6 12,6 C12.553,6 13,6.447 13,7 C13,7.553 12.553,8 12,8 M7,8 C6.447,8 6,7.553 6,7 C6,6.447 6.447,6 7,6 C7.553,6 8,6.447 8,7 C8,7.553 7.553,8 7,8 M23,4 L5,4 C4.447,4 4,4.447 4,5 L4,9 C4,9.553 4.447,10 5,10 L23,10 C27,10 28,13 28,14 L28,9 C28,6.238 25.762,4 23,4"/>
        </svg>
      `,
      pendant: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <path fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" d="M25 4v17"/>
          <path fill="currentColor" opacity="0.82" d="M22.7 18.2h4.8c1.2 0 2.1 1 2.1 2.2v5.8c0 1.2-.9 2.2-2.1 2.2h-4.8c-1.2 0-2.1-1-2.1-2.2v-5.8c0-1.2.9-2.2 2.1-2.2z"/>
          <path fill="currentColor" d="M9.1 34.4c-.2-7.3 7.2-14.1 15.9-14.1s16.1 6.8 15.9 14.1c-.1 4.9-2.5 5.5-8.8 5.7-4 .1-10.6.1-14.8 0-5.8-.1-8-.9-8.2-5.7z"/>
          ${active ? '<path fill="rgba(255,220,86,0.88)" d="M21 42.4c.5-2.7 1.7-3.3 4.2-3.3s3.7.6 4.1 3.1c.4 2.6-1.6 5-4.1 5s-4.7-2.1-4.2-4.8z"/>' : ''}
        </svg>
      `,
      light_flush: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <g>
            <path fill="currentColor" opacity="0.78" d="M18.847 21.388C16.243 22.079 14.512 23.149 13.885 24.375C13.793 24.556 13.583 25.038 13.549 25.299C13.435 26.19 14.126 27.242 15.273 28.108C17.273 29.617 20.416 30.441 24.42 30.631L27.42 30.588C32.361 30.176 35.876 28.468 36.452 26.2C36.569 25.739 36.524 25.408 36.27 24.878C36.009 24.33 35.623 23.865 35.053 23.405C33.617 22.248 31.402 21.45 28.355 20.843C25.612 20.19 21.712 20.642 18.847 21.388Z"/>
            <path fill="currentColor" d="M25.243 17.913C15.653 17.809 8.131 21.052 7.733 25C7.315 29.148 16.07 32.922 25.452 32.922C34.834 32.922 43.112 28.716 42.336 25.07C41.622 21.715 34.903 18.087 25.243 17.913ZM25.417 30.866C16.78 30.771 12.541 27.226 13.405 24.828C13.791 23.847 15.401 21.415 22.459 20.58C26.249 20.248 27.413 20.489 29.761 21.022C36.964 22.661 36.752 25.989 36.752 25.989C36.301 29.257 30.348 30.939 25.418 30.867Z"/>
            <path fill="currentColor" opacity="0.58" d="M42.316 25.012C41.603 23.019 40.277 22.207 40.277 22.207C36.714 19.347 31.883 18.661 28.947 18.224C25.505 17.712 21.478 18.057 21.478 18.057C15.227 18.68 12.928 19.952 10.795 21.096C10.795 21.096 8.371 23.11 7.808 24.606C7.808 24.606 8.205 22.474 8.531 21.871C9.048 20.912 10.53 19.862 11.002 19.572C16.034 17.047 19.435 16.678 23.652 16.585C24.911 16.557 26.971 16.634 26.971 16.634C31.712 16.954 33.768 17.631 36.597 18.675C36.597 18.675 39.671 20.146 40.678 21.183C41.125 21.643 41.752 22.321 41.956 22.929C42.111 23.459 42.266 24.473 42.316 25.012Z"/>
            ${active ? '<path opacity="0.88" fill="rgba(255,245,195,0.84)" d="M22.413 22.141C22.413 22.141 16.999 22.946 16.242 25.456C16.242 25.456 15.874 27.586 19.976 28.969C19.976 28.969 22.927 29.685 25.213 29.654C28.288 29.613 30.582 28.904 30.582 28.904C33.865 28.036 33.963 26.03 33.963 26.03C33.882 23.684 30.008 22.583 30.008 22.583C26.164 21.611 24.51 21.844 22.413 22.141Z"/>' : ''}
          </g>
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
    return BrunoSalaSubview._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_SALA_SUBVIEW_TAG)) {
  customElements.define(BRUNO_SALA_SUBVIEW_TAG, BrunoSalaSubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_SALA_SUBVIEW_TAG,
  name: 'Bruno Sala Subview',
  preview: false,
  description: 'Sala subview rebuilt as an isolated Bruno Liquid Glass Web Component.',
});
