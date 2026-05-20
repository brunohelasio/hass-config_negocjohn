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
  entities: {
    curtain: 'cover.cortina_sala',
    active_sensor: 'sensor.living_room_active',
    temperature: 'sensor.sl_sensor_temp_humid_temperatura',
    humidity: 'sensor.sl_sensor_temp_humid_umidade',
    room_group: 'light.grupo_luzes_sala',
    camera_main: 'camera.sl_camera_2',
    camera_secondary: 'camera.vr_camera_2',
    active_camera_select: 'input_select.bento_active_camera',
    tv: 'media_player.android_tv_192_168_3_17',
    spotify: 'media_player.spotifyplus_bruno_helasio',
    speaker: 'media_player.echo_show',
    climate: 'climate.sl_ar_condicionado',
    router: '',
    zigbee_hub: '',
    ps5: 'switch.ps5_power',
    lights: [
      { entity: 'light.sala_switch_2', name: 'Luz Principal', short: 'Spot TV', icon: 'mdi:lightbulb-outline' },
      { entity: 'light.sl_leds_direito_e_esquerdo', name: 'LEDs Sala', short: 'Fita LED', icon: 'mdi:led-strip-variant' },
      { entity: 'light.sala_2_switch_2', name: 'VR Principal', short: 'Luz Cortina', icon: 'mdi:light-recessed' },
      { entity: 'light.sala_2_switch_3', name: 'VR Cristaleira', short: 'Luz Estante', icon: 'mdi:led-strip-variant' },
      { entity: 'light.varanda_switch_1', name: 'VR Gourmet', short: 'Luz Teto', icon: 'mdi:light-recessed' },
      { entity: 'light.varanda_switch_2', name: 'VR Pendente', short: 'Luz Vaso', icon: 'mdi:ceiling-light' },
      { entity: '', name: 'Luz Ambiente', short: 'Luz Ambiente', icon: 'mdi:lightbulb-outline', placeholder: true },
      { entity: '', name: 'Luz Painel', short: 'Luz Painel', icon: 'mdi:lightbulb-outline', placeholder: true },
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
    this._lastMinute = '';
    this._lastActionAt = {};
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
        image.src = nextSrc;
        image.classList.remove('is-hidden');
      };
      loader.src = nextSrc;
    });
  }

  _state(entityId) {
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
    return {
      ...camera,
      state,
      online,
      image,
      imageUrl: BrunoSalaSubview._withCacheBust(image, this._refreshSeed),
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
      subtitle: attrs.media_artist || attrs.source || 'Sala',
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
      title: attrs.media_title || attrs.friendly_name || 'No Media Playing',
      subtitle: attrs.media_artist || attrs.media_album_name || 'Spotify',
      artwork: attrs.entity_picture || attrs.media_image_url || '',
      source: attrs.source || this._config.spotify_device_name || 'Echo Show',
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

  _callService(serviceName, data = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;
    this._hass.callService(domain, service, data);
  }

  _navigate(path) {
    const resolvedPath = this._resolveNavigationPath(path);
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: resolvedPath },
      bubbles: true,
      composed: true,
    }));
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
    if (!target?.matches?.('[data-action="brightness"]')) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
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
        <section class="hero-panel">
          ${this._renderHero(model)}
        </section>

        <section class="side-panel">
          ${this._renderStatusRail(model)}
          ${this._renderLights(model)}
        </section>

        ${this._renderCameras(model)}

        <section class="media-stack">
          ${this._renderSpotify(model)}
          ${this._renderPS5(model)}
        </section>

        <section class="comfort-stack">
          ${this._renderTV(model)}
          ${this._renderAC(model)}
        </section>
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
    const greeting = `${this._greeting()}, ${this._config.greeting_name}`;
    const background = BrunoSalaSubview._escapeAttr(this._config.background);
    const lightsLabel = `${model.lights} ${model.lights === 1 ? 'luz' : 'luzes'}`;

    return `
      <div class="hero-stage">
        <div class="hero-clip" style="--hero-image: url('${background}');" aria-hidden="true"></div>
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

          <div class="hero-clock" data-clock>${this._lastMinute}</div>

          <div class="hero-greeting">
            <strong>${BrunoSalaSubview._escape(greeting)}</strong>
            <span>Ambiente confortavel</span>
            <small>Tudo funcionando perfeitamente.</small>
          </div>

          <div class="hero-chips">
            <span class="hero-chip is-active">${BrunoSalaSubview._escape(lightsLabel)}</span>
            <span class="hero-chip">${this._temperatureLabel()}</span>
          </div>

          <div class="curtain-dock">
            <div class="curtain-copy">
              <span class="module-icon"><ha-icon icon="mdi:curtains"></ha-icon></span>
              <div>
                <div class="module-title">Cortinas</div>
                <div class="module-subtitle">Controle</div>
              </div>
            </div>
            <div class="curtain-pill">Automatica - ${model.curtainPosition}%</div>
            <div class="curtain-main">
              <span class="curtain-value">${model.curtainPosition}%</span>
              <span class="curtain-label">abertura</span>
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
            </div>
            <div class="curtain-progress">
              <span style="width:${model.curtainPosition}%"></span>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  _renderStatusRail(model) {
    const status = [
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

  _renderLights(model) {
    const lights = this._config.entities.lights || [];

    return `
      <div class="glass-card lights-card">
        <div class="module-head">
          <div>
            <div class="module-title">Luzes da Sala</div>
            <div class="module-subtitle">${lights.length} luzes - ${model.lights} acesas</div>
          </div>
          <div class="head-actions">
            <span class="all-label">Todas</span>
            <button type="button" class="chip-button is-active" data-action="lights-on">ON</button>
          </div>
        </div>

        <div class="lights-grid">
          ${lights.map((light) => {
            const state = this._state(light.entity);
            const active = state?.state === 'on';
            const disabled = !light.entity || light.placeholder;
            const brightness = this._brightnessPercent(state);
            return `
              <button type="button" class="light-tile${active ? ' is-on' : ''}${disabled ? ' is-placeholder' : ''}" ${disabled ? 'disabled' : `data-action="toggle-light" data-entity="${BrunoSalaSubview._escapeAttr(light.entity)}"`}>
                <span class="light-icon"><ha-icon icon="${BrunoSalaSubview._escapeAttr(light.icon || 'mdi:lightbulb-outline')}"></ha-icon></span>
                <span class="switch-knob${active ? ' is-on' : ''}"></span>
                <strong>${BrunoSalaSubview._escape(light.short || light.name)}</strong>
                <small>${disabled ? 'Placeholder' : `${brightness || 0}%`}</small>
              </button>
            `;
          }).join('')}
        </div>

        <div class="brightness-strip">
          <ha-icon icon="mdi:white-balance-sunny"></ha-icon>
          <input type="range" min="1" max="100" value="${this._roomBrightness() || 80}" data-action="brightness" aria-label="Brilho das luzes da sala">
          <ha-icon icon="mdi:brightness-7"></ha-icon>
        </div>
      </div>
    `;
  }

  _renderCameras(model) {
    return `
      <section class="glass-card cameras-card">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:cctv"></ha-icon></span>
            <div>
              <div class="module-title">Cameras</div>
              <div class="module-subtitle">${model.cameras.cameras.length} cameras</div>
            </div>
          </div>
          <div class="online-chip"><span></span>${model.cameras.onlineCount}/${model.cameras.cameras.length} online</div>
        </div>

        <div class="camera-list">
          ${model.cameras.cameras.map((camera) => `
            <button type="button" class="camera-row" data-action="more-info" data-entity="${BrunoSalaSubview._escapeAttr(camera.entity)}">
              ${this._cameraFrame(camera)}
              <div class="camera-row-copy">
                <strong>${BrunoSalaSubview._escape(camera.name)}</strong>
                <span><span class="live-dot"></span>${BrunoSalaSubview._escape(camera.status)}</span>
              </div>
              <ha-icon class="camera-chevron" icon="mdi:chevron-right"></ha-icon>
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  _cameraFrame(camera) {
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

    return `
      <section class="glass-card tv-card${tv.active ? ' is-active' : ''}">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:television-classic"></ha-icon></span>
            <div>
              <div class="module-title">Televisao</div>
              <div class="module-subtitle">Sala</div>
            </div>
          </div>
        </div>

        <div class="tv-body">
          <div>
            <div class="media-source">${BrunoSalaSubview._escape(tv.source)}</div>
            <div class="media-title">${BrunoSalaSubview._escape(tv.title)}</div>
            <div class="media-subtitle">${BrunoSalaSubview._escape(tv.subtitle)}</div>
            <div class="control-row">
              <button type="button" class="control-button" data-action="toggle-tv"><ha-icon icon="mdi:power"></ha-icon></button>
              <button type="button" class="control-button" data-action="more-info" data-entity="${BrunoSalaSubview._escapeAttr(this._config.entities.tv)}"><ha-icon icon="mdi:remote-tv"></ha-icon></button>
              <button type="button" class="control-button" data-action="tv-play-pause"><ha-icon icon="mdi:play-pause"></ha-icon></button>
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

    return `
      <section class="glass-card ps5-card${ps5.active ? ' is-active' : ''}${ps5.configured ? '' : ' is-placeholder'}">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:sony-playstation"></ha-icon></span>
            <div>
              <div class="module-title">PlayStation 5</div>
              <div class="module-subtitle">Sala</div>
            </div>
          </div>
          <div class="online-chip is-soft">${BrunoSalaSubview._escape(ps5.chip)}</div>
        </div>
        <div class="ps5-body">
          <strong>${BrunoSalaSubview._escape(ps5.title)}</strong>
          <button type="button" class="primary-button" data-action="toggle-ps5" ${ps5.configured ? '' : 'disabled'}>Ligar Console</button>
          <div class="ps5-meta">
            <span>Status <strong>${BrunoSalaSubview._escape(ps5.state)}</strong></span>
            <span>Modo <strong>--</strong></span>
          </div>
        </div>
      </section>
    `;
  }

  _renderSpotify(model) {
    const spotify = model.spotify;
    const artwork = spotify.artwork ? BrunoSalaSubview._resolvePicture(spotify.artwork) : '';

    return `
      <section class="glass-card spotify-card${spotify.active ? ' is-active' : ''}">
        <div class="spotify-art${artwork ? ' has-art' : ''}">
          ${artwork ? `<img src="${BrunoSalaSubview._escapeAttr(artwork)}" alt="">` : '<ha-icon icon="mdi:music-note"></ha-icon>'}
        </div>
        <div class="spotify-overlay">
          <div>
            <div class="module-title">Midia</div>
            <div class="media-title">${BrunoSalaSubview._escape(spotify.title)}</div>
            <div class="media-subtitle">${BrunoSalaSubview._escape(spotify.subtitle)}</div>
          </div>
          <div class="spotify-controls">
            <button type="button" class="control-button" data-action="spotify-play"><ha-icon icon="mdi:play"></ha-icon></button>
            <button type="button" class="control-button" data-action="spotify-pause"><ha-icon icon="mdi:pause"></ha-icon></button>
            <button type="button" class="control-button" data-action="more-info" data-entity="${BrunoSalaSubview._escapeAttr(this._config.entities.spotify)}"><ha-icon icon="mdi:dots-horizontal"></ha-icon></button>
          </div>
          <span class="state-chip"><span></span>${spotify.playing ? 'Playing' : BrunoSalaSubview._escape(spotify.state)}</span>
        </div>
      </section>
    `;
  }

  _renderAC(model) {
    const climate = model.climate;
    const target = climate.target == null ? '--' : this._formatNumber(climate.target, 0);
    const current = climate.current == null ? '--' : this._formatNumber(climate.current, 1);

    return `
      <section class="glass-card ac-card${climate.active ? ' is-active' : ''}">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:snowflake"></ha-icon></span>
            <div>
              <div class="module-title">Ar Condicionado</div>
              <div class="module-subtitle">Sala</div>
            </div>
          </div>
        </div>
        <div class="ac-body">
          <div class="ac-main">
            <div class="ac-temp">${target}\u00b0</div>
            <span class="ac-state">${BrunoSalaSubview._escape(climate.action)}</span>
            <div class="ac-controls">
              <button type="button" class="primary-button" data-action="toggle-climate">${climate.active ? 'Desligar' : 'Ligar'}</button>
              <div class="stepper">
                <button type="button" data-action="temp-down">-</button>
                <span>${target}\u00b0</span>
                <button type="button" data-action="temp-up">+</button>
              </div>
            </div>
          </div>
          <div class="ac-meta">
            <span>Atual <strong>${current}\u00b0</strong></span>
            <span>Modo <strong>${BrunoSalaSubview._escape(climate.hvacMode)}</strong></span>
            <span>Ventilacao <strong>${BrunoSalaSubview._escape(climate.fan)}</strong></span>
            <span>Oscilacao <strong>${BrunoSalaSubview._escape(climate.swing)}</strong></span>
            <button type="button" class="soft-button" data-action="more-info" data-entity="${BrunoSalaSubview._escapeAttr(this._config.entities.climate)}">Mais opcoes</button>
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
        grid-template-columns: repeat(12, minmax(0, 1fr));
        grid-template-rows: minmax(420px, 52vh) minmax(360px, 1fr);
        grid-template-areas:
          "hero hero hero hero hero hero hero side side side side side"
          "cams cams cams cams media media media media comfort comfort comfort comfort";
        gap: var(--sala-gap);
        padding: 10px;
        background:
          radial-gradient(760px 420px at 16% 2%, rgba(110,150,210,0.12), transparent 72%),
          radial-gradient(680px 420px at 96% 70%, rgba(255,190,120,0.08), transparent 74%),
          #020406;
        overflow: auto;
      }

      .hero-panel { grid-area: hero; min-width: 0; min-height: 0; }
      .side-panel { grid-area: side; min-width: 0; min-height: 0; display: grid; grid-template-rows: 72px minmax(0, 1fr); gap: var(--sala-gap); }
      .cameras-card { grid-area: cams; }
      .media-stack { grid-area: media; min-width: 0; min-height: 0; display: grid; grid-template-rows: 1.15fr 0.85fr; gap: var(--sala-gap); }
      .comfort-stack { grid-area: comfort; min-width: 0; min-height: 0; display: grid; grid-template-rows: 1.15fr 0.85fr; gap: var(--sala-gap); }

      .glass-card,
      .hero-stage {
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

      .glass-card::before,
      .hero-stage::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: -1;
        pointer-events: none;
        border-radius: calc(var(--sala-radius) - 1px);
        background: var(--bruno-liquid-surface-off-sheen);
        opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.82);
      }

      .glass-card::after,
      .hero-stage::after {
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
        width: 100%;
        height: 100%;
        contain: paint;
      }

      .hero-clip {
        position: absolute;
        inset: 0;
        z-index: 0;
        border-radius: inherit;
        overflow: hidden;
        clip-path: inset(0 round var(--sala-radius));
        background:
          linear-gradient(90deg, rgba(5,11,20,0.90) 0%, rgba(7,13,22,0.60) 35%, rgba(7,13,22,0.20) 63%, rgba(7,13,22,0.02) 100%),
          linear-gradient(180deg, rgba(0,0,0,0.10), rgba(0,0,0,0.30)),
          var(--hero-image) center center / cover no-repeat;
        filter: saturate(0.98) contrast(1.02);
      }

      .hero-clip::before {
        content: "";
        position: absolute;
        inset: 0;
        background:
          radial-gradient(520px 200px at 12% -6%, rgba(255,255,255,0.20), transparent 70%),
          radial-gradient(420px 240px at 94% 20%, rgba(255,210,155,0.16), transparent 72%),
          linear-gradient(0deg, rgba(0,0,0,0.32), transparent 44%);
      }

      .hero-content {
        position: relative;
        z-index: 1;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto minmax(0, 1fr) auto;
        padding: 18px 20px;
        gap: 12px;
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
      }

      .hero-subtitle,
      .module-subtitle {
        margin-top: 4px;
        font-size: 11px;
        line-height: 1;
        font-weight: 600;
        color: var(--text-soft);
      }

      .hero-clock {
        grid-column: 1;
        grid-row: 2;
        align-self: start;
        justify-self: start;
        margin-top: 38px;
        font-size: clamp(64px, 7.4vw, 106px);
        line-height: 0.94;
        font-weight: 200;
        color: rgba(255,255,255,0.92);
        text-shadow: 0 14px 36px rgba(0,0,0,0.28);
      }

      .hero-greeting {
        grid-column: 1;
        grid-row: 3;
        align-self: start;
        display: grid;
        gap: 7px;
        margin-top: 4px;
        max-width: 360px;
      }

      .hero-greeting strong {
        font-size: 24px;
        line-height: 1.08;
        color: rgba(255,255,255,0.96);
      }

      .hero-greeting span {
        margin-top: 8px;
        font-size: 13px;
        font-weight: 800;
        color: rgba(255,255,255,0.90);
      }

      .hero-greeting small {
        font-size: 12px;
        font-weight: 600;
        color: rgba(255,255,255,0.66);
      }

      .hero-chips {
        grid-column: 2;
        grid-row: 1;
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .hero-chip,
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

      .hero-chip.is-active,
      .chip-button.is-active,
      .online-chip {
        background: rgba(24,134,190,0.36);
        border-color: rgba(96,190,255,0.46);
      }

      .curtain-dock {
        grid-row: 4;
        grid-column: 1 / -1;
        align-self: end;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto auto;
        gap: 10px 14px;
        width: min(520px, 100%);
        padding: 14px 16px;
        border-radius: 22px;
        background: rgba(7,12,22,0.34);
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.10),
          0 14px 34px rgba(0,0,0,0.24);
        backdrop-filter: blur(18px) saturate(1.35);
        -webkit-backdrop-filter: blur(18px) saturate(1.35);
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
        padding: 8px 11px;
        border-radius: 999px;
        color: rgb(255,208,92);
        font-size: 11px;
        font-weight: 800;
        background: rgba(255,183,77,0.12);
        border: 1px solid rgba(255,183,77,0.25);
      }

      .curtain-main {
        display: none;
      }

      .curtain-main {
        display: none;
      }

      .curtain-value {
        font-size: 34px;
        line-height: 1;
        font-weight: 800;
      }

      .curtain-label {
        color: var(--text-soft);
        font-size: 14px;
        padding-bottom: 4px;
      }

      .curtain-actions {
        grid-column: 1 / -1;
        justify-self: stretch;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        align-items: center;
        gap: 10px;
      }

      .preset-button {
        min-height: 66px;
        display: grid;
        place-items: center;
        gap: 6px;
        padding: 9px 6px;
        border-radius: 14px;
        background: rgba(255,255,255,0.065);
        border: 1px solid rgba(255,255,255,0.11);
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
        --mdc-icon-size: 22px;
      }

      .preset-button span {
        font-size: 11px;
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
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 0;
        padding: 0;
      }

      .status-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        min-width: 0;
        gap: 9px;
        padding: 0 16px;
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
        grid-template-rows: auto minmax(0, 1fr) 42px;
        gap: 10px;
      }

      .module-head {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        min-height: 34px;
        margin-bottom: 12px;
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

      .lights-grid {
        position: relative;
        z-index: 1;
        height: auto;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-auto-rows: minmax(84px, 1fr);
        gap: 10px;
      }

      .light-tile {
        position: relative;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto 1fr auto;
        align-items: start;
        padding: 12px;
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
          radial-gradient(80px 48px at 88% 18%, rgba(255,195,72,0.23), transparent 70%),
          rgba(255,255,255,0.078);
        border-color: rgba(255,195,72,0.34);
      }

      .light-tile.is-placeholder {
        opacity: 0.55;
      }

      .light-tile:hover,
      .camera-thumb:hover,
      .soft-button:hover,
      .control-button:hover {
        transform: translateY(-1px);
      }

      .light-icon {
        width: 26px;
        height: 26px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: rgba(255,255,255,0.74);
      }

      .light-icon ha-icon {
        --mdc-icon-size: 17px;
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

      .brightness-strip {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        min-height: 42px;
        padding: 0 4px;
        color: rgb(255,154,18);
      }

      .brightness-strip ha-icon {
        --mdc-icon-size: 18px;
      }

      .brightness-strip input {
        width: 100%;
        accent-color: rgb(255,154,18);
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

      .camera-list {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 10px;
        min-height: 0;
      }

      .camera-row {
        position: relative;
        min-width: 0;
        min-height: 0;
        display: block;
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

      .camera-row::after {
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
        grid-template-columns: minmax(0, 1fr) minmax(112px, 28%);
        gap: 12px;
        align-items: stretch;
      }

      .media-source {
        margin-top: 4px;
        color: white;
        font-size: 22px;
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
        margin-top: 22px;
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

      .ps5-body {
        position: relative;
        z-index: 1;
        height: calc(100% - 46px);
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: 1fr auto;
        gap: 12px;
        align-items: end;
      }

      .ps5-body > strong {
        align-self: center;
        font-size: 21px;
      }

      .ps5-meta {
        grid-column: 1 / -1;
        display: flex;
        gap: 10px;
      }

      .ps5-meta span,
      .ac-meta span {
        display: grid;
        gap: 4px;
        min-width: 88px;
        padding: 10px;
        border-radius: 12px;
        color: var(--text-soft);
        font-size: 11px;
        background: rgba(255,255,255,0.052);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .ps5-meta strong,
      .ac-meta strong {
        color: white;
        font-size: 13px;
      }

      .spotify-card {
        padding: 22px;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(110px, 150px) minmax(0, 1fr);
        align-items: center;
        gap: 24px;
      }

      .spotify-art {
        position: relative;
        inset: auto;
        width: 100%;
        aspect-ratio: 1 / 1;
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
        background: linear-gradient(180deg, transparent 45%, rgba(2,8,18,0.86));
      }

      .spotify-art ha-icon {
        --mdc-icon-size: 70px;
      }

      .spotify-overlay {
        position: relative;
        inset: auto;
        z-index: 2;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr auto;
        gap: 16px;
        align-items: center;
        padding: 0;
        border-radius: 0;
        background: transparent;
        border: 0;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .spotify-controls {
        display: flex;
        align-items: center;
        gap: 12px;
        grid-column: 1 / -1;
        margin-top: 18px;
      }

      .state-chip {
        grid-column: 2;
        align-self: start;
        min-height: 28px;
      }

      .ac-body {
        grid-template-columns: minmax(0, 1fr) minmax(150px, 42%);
      }

      .ac-temp {
        font-size: clamp(48px, 5vw, 72px);
        line-height: 0.92;
        font-weight: 200;
      }

      .ac-state {
        display: inline-block;
        margin-top: 8px;
        color: rgb(96,190,255);
        font-size: 14px;
        font-weight: 800;
      }

      .ac-controls {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-top: 24px;
      }

      .stepper {
        display: inline-flex;
        align-items: center;
        overflow: hidden;
        min-height: 36px;
        border-radius: 12px;
        border: 1px solid rgba(255,255,255,0.11);
        background: rgba(255,255,255,0.052);
      }

      .stepper button {
        width: 36px;
        height: 36px;
        background: transparent;
      }

      .stepper span {
        min-width: 46px;
        text-align: center;
        color: var(--text-soft);
        font-size: 12px;
        font-weight: 800;
      }

      .ac-meta {
        display: grid;
        align-content: start;
        gap: 8px;
      }

      .ac-meta span {
        min-width: 0;
      }

      @media (max-width: 1180px) {
        .sala-subview {
          height: auto;
          overflow: auto;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: minmax(330px, 46vh) minmax(360px, auto) minmax(320px, auto) minmax(320px, auto);
          grid-template-areas:
            "hero side"
            "cams cams"
            "media comfort";
        }

        .side-panel {
          grid-template-rows: auto minmax(0, 1fr);
        }

        .status-rail {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .status-item:nth-child(2) {
          border-right: 0;
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
            "media"
            "comfort";
          padding: 8px;
        }

        .hero-stage {
          min-height: 430px;
        }

        .hero-content {
          grid-template-columns: 1fr;
        }

        .hero-chips {
          grid-column: 1;
          grid-row: auto;
          justify-self: start;
        }

        .hero-clock {
          font-size: 70px;
        }

        .curtain-dock {
          grid-template-columns: 1fr;
        }

        .curtain-actions {
          justify-self: start;
          flex-wrap: wrap;
        }

        .side-panel,
        .media-stack,
        .comfort-stack {
          grid-template-rows: auto;
        }

        .lights-grid {
          height: auto;
          grid-template-columns: repeat(2, minmax(0, 1fr));
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
