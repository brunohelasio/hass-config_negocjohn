const BRUNO_OFFICE_SUBVIEW_TAG = 'bruno-office-subview';

const BRUNO_OFFICE_SUBVIEW_DEFAULT_CONFIG = {
  title: 'Office',
  subtitle: 'Visao geral',
  greeting_name: 'Bruno',
  navigation_path: 'bento-lab',
  background: '/local/images/office.jpg',
  fallback_background: '/local/images/office.jpg',
  pc_image: '/local/images/office_pc.png',
  refresh_interval: 6500,
  spotify_device_name: 'Echo Pop Office',
  spotify_standby_image: '/local/images/echo_pop.png',
  climate_device_name: 'Gree',
  climate_image: '/local/images/ar-condicionado-gree-tight.png',
  climate_active_image: '/local/images/ar-condicionado-gree-on-tight.png?v=20260606-on-1',
  // NOVO (Foco & Produtividade): calendarios usados no mini calendario do bloco Foco.
  // Mesmas entidades/cores do bruno-agenda-card.
  calendars: [
    { entity: 'calendar.brunohelasio_gmail_com', name: 'Bruno', color: '#7fdbe9' },
    { entity: 'calendar.familia', name: 'Familia', color: '#fdd835' },
  ],
  room_nav: [
    { key: 'sala', name: 'Sala', icon: 'mdi:sofa', path: 'subview-sala' },
    { key: 'office', name: 'Office', icon: 'mdi:desk', path: 'subview-office', active: true },
    { key: 'cozinha', name: 'Cozinha', icon: 'mdi:countertop', path: 'subview-cozinha' },
    { key: 'lavabo', name: 'Lavabo', icon: 'mdi:toilet', path: 'subview-lavabo', divider_after: true },
    { key: 'casal', name: 'Q. Casal', icon: 'mdi:bed-king', path: 'subview-quarto-casal' },
    { key: 'marina', name: 'Q. Marina', icon: 'mdi:bed-single', path: 'subview-quarto-marina' },
    { key: 'miguel', name: 'Q. Miguel', icon: 'mdi:crib-outline', path: 'subview-quarto-miguel' },
  ],
  entities: {
    // FALLBACK - Office nao tem cortina dedicada mapeada no repositorio.
    // Mantem a estrutura visual da Sala sem disparar comandos se a entidade estiver vazia.
    curtain: '',
    active_sensor: 'sensor.office_active',
    semantic_sensor: 'sensor.office_semantic_state',
    occupancy: 'binary_sensor.office_occupancy',
    meeting: 'binary_sensor.office_meeting_active',
    working: 'binary_sensor.office_working_active',
    temperature: [
      'sensor.office_temp_humid_temperature',
      'sensor.of_sensor_temp_humid_temperatura',
      'sensor.temperatura_office',
      'sensor.office_temperatura',
      'sensor.of_temperatura',
    ],
    humidity: [
      'sensor.office_temp_humid_humidity',
      'sensor.of_sensor_temp_humid_umidade',
      'sensor.umidade_office',
      'sensor.office_umidade',
      'sensor.of_umidade',
    ],
    room_group: 'light.grupo_luzes_office',
    active_camera_select: '',
    spotify: 'media_player.spotifyplus_bruno_helasio',
    speaker: 'media_player.echo_pop_office',
    climate: 'climate.ac_office',
    router: '',
    zigbee_hub: '',
    pc_active: 'binary_sensor.office_pc_active',
    pc_power: 'button.desktop_melg9vv_pc_office_switch',
    pc_shutdown: 'button.desktop_melg9vv_pc_office_desliga',
    pc_sleep: 'button.desktop_melg9vv_pc_office_sleep',
    pc_restart: 'button.desktop_melg9vv_pc_office_reiniciar',
    pc_lock: 'button.desktop_melg9vv_pc_office_bloquear',
    pc_session: 'sensor.desktop_melg9vv_office_pc_session_state',
    pc_idle: 'sensor.desktop_melg9vv_office_pc_idle_time',
    pc_window: 'sensor.desktop_melg9vv_office_pc_active_window',
    pc_cpu: '',
    pc_gpu: '',
    pc_ram: '',
    pc_temperature: '',
    pc_network: '',
    pc_volume: '',
    pc_brightness: '',
    pc_webcam: '',
    lights: [
      { entity: 'light.office_switch_3', name: 'Luz central', icon_type: 'light_flush', zone: 'office' },
      { entity: 'light.office_switch_2', name: 'Luz ambiente', icon_type: 'ledstrip', zone: 'office' },
      { entity: 'light.office_switch_1', name: 'Luz estante', icon_type: 'ledstrip', zone: 'office' },
      // NOVO (paridade Sala): 4o tile placeholder para fechar o grid 2x2,
      // mesmo padrao do "LED Fita TV" na Sala.
      { entity: '', name: 'Luz auxiliar', icon_type: 'ledstrip', placeholder: true, zone: 'office' },
    ],
    cameras: [
      { entity: 'camera.of_camera_2', name: 'Office', short_name: 'Office' },
    ],
  },
};

const BRUNO_OFFICE_SUBVIEW_CLIMATE_ON_STATES = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const BRUNO_OFFICE_SUBVIEW_CLIMATE_ACTIVE_ACTIONS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const BRUNO_OFFICE_SUBVIEW_CLIMATE_INACTIVE_ACTIONS = ['off', 'idle'];
const BRUNO_OFFICE_SUBVIEW_MEDIA_ON_STATES = ['playing', 'paused', 'on', 'idle'];
const BRUNO_OFFICE_SUBVIEW_CAMERA_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];
const BRUNO_OFFICE_SUBVIEW_UNAVAILABLE_STATES = ['unavailable', 'unknown', '', 'none', 'null'];

class BrunoOfficeSubview extends HTMLElement {
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
    this._selectedWorkspaceSource = '';
    this._focusDuration = 25 * 60;
    this._focusStartedAt = null;
    this._focusRemaining = this._focusDuration;
    this._focusRunning = false;
    this._focusSessions = 0;
    // NOVO (Foco & Produtividade): cache de eventos do calendario.
    this._calendarEvents = [];
    this._calendarLoadedAt = 0;
    this._calendarLoading = false;
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
    this._maybeLoadCalendarEvents();
  }

  connectedCallback() {
    globalThis.BrunoLiquidGlass?.apply?.();
    this._startRefreshTimer();
    this._startClockTimer();
    this._startCalendarTimer();
  }

  disconnectedCallback() {
    this._stopRefreshTimer();
    this._stopClockTimer();
    this._stopFocusTimer();
    this._stopCalendarTimer();
  }

  getCardSize() {
    return 12;
  }

  _normalizeConfig(config) {
    const entities = {
      ...BRUNO_OFFICE_SUBVIEW_DEFAULT_CONFIG.entities,
      ...(config.entities || {}),
    };

    if (Array.isArray(config.entities?.lights)) entities.lights = config.entities.lights;
    if (Array.isArray(config.entities?.cameras)) entities.cameras = config.entities.cameras;

    return {
      ...BRUNO_OFFICE_SUBVIEW_DEFAULT_CONFIG,
      ...config,
      refresh_interval: Math.max(4000, Number(config.refresh_interval) || BRUNO_OFFICE_SUBVIEW_DEFAULT_CONFIG.refresh_interval),
      room_nav: Array.isArray(config.room_nav) ? config.room_nav : BRUNO_OFFICE_SUBVIEW_DEFAULT_CONFIG.room_nav,
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
      <div class="error">Erro na subview Office: ${BrunoOfficeSubview._escape(error?.message || error)}</div>
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

  _startFocusTimer() {
    if (this._focusTimer) return;
    this._focusTimer = globalThis.setInterval(() => {
      if (!this._focusRunning || !this._focusStartedAt) return;
      const elapsed = Math.floor((Date.now() - this._focusStartedAt) / 1000);
      this._focusRemaining = Math.max(0, this._focusDuration - elapsed);
      if (this._focusRemaining === 0) {
        this._focusRunning = false;
        this._focusSessions += 1;
      }
      this._safeRender();
    }, 1000);
  }

  _stopFocusTimer() {
    if (!this._focusTimer) return;
    globalThis.clearInterval(this._focusTimer);
    this._focusTimer = null;
  }

  // NOVO (Foco & Produtividade): carga periodica de eventos de calendario.
  // Mesmo mecanismo do bruno-agenda-card (WS calendar/list_events + fallback REST).
  _startCalendarTimer() {
    if (this._calendarTimer) return;
    this._calendarTimer = globalThis.setInterval(() => this._maybeLoadCalendarEvents(true), 5 * 60 * 1000);
  }

  _stopCalendarTimer() {
    if (!this._calendarTimer) return;
    globalThis.clearInterval(this._calendarTimer);
    this._calendarTimer = null;
  }

  _maybeLoadCalendarEvents(force = false) {
    if (!this._hass || this._calendarLoading) return;
    const stale = (Date.now() - this._calendarLoadedAt) > 5 * 60 * 1000;
    if (!force && !stale) return;
    this._loadCalendarEvents();
  }

  async _loadCalendarEvents() {
    const calendars = Array.isArray(this._config.calendars) ? this._config.calendars : [];
    if (!this._hass || !calendars.length) return;
    this._calendarLoading = true;
    try {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const weekday = (start.getDay() + 6) % 7; // 0 = segunda
      start.setDate(start.getDate() - weekday);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);

      const eventsByCalendar = await Promise.all(
        calendars.map((calendar) => this._fetchCalendarEvents(calendar, start, end)),
      );
      this._calendarEvents = eventsByCalendar
        .flat()
        .filter((event) => event && event.start)
        .sort((a, b) => a.start - b.start);
      this._calendarLoadedAt = Date.now();
      this._safeRender();
    } catch (error) {
      // Falha silenciosa: o bloco Foco renderiza "Agenda livre" sem eventos.
    } finally {
      this._calendarLoading = false;
    }
  }

  async _fetchCalendarEvents(calendar, start, end) {
    const entityId = calendar?.entity;
    if (!entityId || !this._state(entityId)) return [];

    let rows = [];
    try {
      const response = await this._hass.callWS({
        type: 'calendar/list_events',
        entity_id: entityId,
        start: start.toISOString(),
        end: end.toISOString(),
      });
      rows = Array.isArray(response?.events) ? response.events : [];
    } catch (error) {
      try {
        const path = `calendars/${encodeURIComponent(entityId)}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
        const response = await this._hass.callApi('GET', path);
        rows = Array.isArray(response) ? response : [];
      } catch (innerError) {
        rows = [];
      }
    }

    return rows.map((row) => {
      const startRaw = row?.start?.dateTime || row?.start?.date || row?.start;
      const endRaw = row?.end?.dateTime || row?.end?.date || row?.end;
      const allDay = Boolean(row?.start?.date && !row?.start?.dateTime);
      const startDate = startRaw ? new Date(startRaw) : null;
      return {
        title: String(row?.summary || row?.title || 'Evento'),
        start: startDate && !Number.isNaN(startDate.getTime()) ? startDate : null,
        end: endRaw ? new Date(endRaw) : null,
        allDay,
        calendar: calendar.name || entityId,
        color: calendar.color || '#7fdbe9',
      };
    }).filter((event) => event.start);
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

      const nextSrc = BrunoOfficeSubview._withCacheBust(baseSrc, stamp);
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
    return !entity || BRUNO_OFFICE_SUBVIEW_UNAVAILABLE_STATES.includes(String(entity.state || '').toLowerCase());
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
    const online = !unavailable && BRUNO_OFFICE_SUBVIEW_CAMERA_ONLINE_STATES.includes(state);
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
      imageUrl: this._loadedCameraUrls[camera.entity] || BrunoOfficeSubview._withCacheBust(image, this._refreshSeed),
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
    const globalActive = BRUNO_OFFICE_SUBVIEW_MEDIA_ON_STATES.includes(state);
    const active = globalActive && (this._spotifySourceMatchesRoom(attrs) || this._spotifySpeakerMatchesRoom(attrs));
    const roomSource = this._config.spotify_device_name || attrs.source || 'Echo Pop Office';
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

  _semanticLine() {
    const semantic = this._state(this._config.entities.semantic_sensor);
    const semanticState = String(semantic?.state || '').toLowerCase();
    const display = semantic?.attributes?.display;
    if (!display || ['none', 'unknown', 'unavailable'].includes(semanticState)) return '';
    return String(display);
  }

  _focusModel() {
    const remaining = Math.max(0, this._focusRemaining);
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    const progress = 1 - (remaining / this._focusDuration);
    const elapsed = Math.max(0, this._focusDuration - remaining);
    const elapsedMinutes = Math.floor(elapsed / 60);
    return {
      running: this._focusRunning,
      label: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
      progress: Math.max(0, Math.min(1, progress)),
      sessions: this._focusSessions,
      focusedLabel: elapsedMinutes > 0 ? `${elapsedMinutes}m` : '0m',
      semantic: this._semanticLine() || 'Disponivel',
    };
  }

  // NOVO (Foco & Produtividade): semana atual + proximo evento para o mini calendario.
  _calendarModel() {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - ((startOfWeek.getDay() + 6) % 7));
    const labels = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
    const events = Array.isArray(this._calendarEvents) ? this._calendarEvents : [];

    const days = labels.map((label, index) => {
      const date = new Date(startOfWeek);
      date.setDate(startOfWeek.getDate() + index);
      const nextDate = new Date(date);
      nextDate.setDate(date.getDate() + 1);
      const dayEvents = events.filter((event) => event.start >= date && event.start < nextDate);
      const dots = [];
      dayEvents.forEach((event) => {
        if (dots.length < 2 && !dots.includes(event.color)) dots.push(event.color);
      });
      return {
        label,
        day: date.getDate(),
        isToday: date.toDateString() === now.toDateString(),
        dots,
      };
    });

    const upcoming = events.find((event) => !event.allDay && event.end && event.end > now && event.start.getTime() - now.getTime() < 7 * 24 * 3600 * 1000)
      || events.find((event) => event.start > now);
    let nextEvent = null;
    if (upcoming) {
      const sameDay = upcoming.start.toDateString() === now.toDateString();
      const dayLabel = sameDay
        ? ''
        : upcoming.start.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');
      const timeLabel = upcoming.allDay
        ? 'Dia todo'
        : upcoming.start.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      nextEvent = {
        title: upcoming.title,
        time: dayLabel ? `${dayLabel} ${timeLabel}` : timeLabel,
        calendar: upcoming.calendar,
        color: upcoming.color,
        ongoing: upcoming.start <= now && upcoming.end && upcoming.end > now,
      };
    }

    return { days, nextEvent, loaded: this._calendarLoadedAt > 0 };
  }

  _pcModel() {
    const entities = this._config.entities;
    const active = this._state(entities.pc_active)?.state === 'on';
    const session = this._safeState(entities.pc_session, active ? 'Ativo' : 'Offline');
    const activeWindow = this._safeState(entities.pc_window, '--');
    const idle = this._safeState(entities.pc_idle, '--');
    const configuredState = (entityId, fallback = '--') => (entityId ? this._safeState(entityId, fallback) : '');
    const metrics = [
      { key: 'cpu', label: 'CPU Usage', entity: entities.pc_cpu, value: configuredState(entities.pc_cpu) },
      { key: 'ram', label: 'RAM Usage', entity: entities.pc_ram, value: configuredState(entities.pc_ram) },
      {
        key: 'gpu_temp',
        label: 'GPU Temp',
        entity: entities.pc_temperature || entities.pc_gpu,
        value: entities.pc_temperature
          ? this._safeState(entities.pc_temperature, '--')
          : configuredState(entities.pc_gpu),
      },
      { key: 'network', label: 'Network', entity: entities.pc_network, value: configuredState(entities.pc_network) },
    ];
    const webcamState = String(this._state(entities.pc_webcam)?.state || '').toLowerCase();

    return {
      active,
      session,
      activeWindow,
      idle,
      metrics,
      volume: configuredState(entities.pc_volume),
      brightness: configuredState(entities.pc_brightness),
      webcamConfigured: Boolean(entities.pc_webcam),
      webcamActive: Boolean(entities.pc_webcam) && webcamState === 'on',
    };
  }

  _climateAction(entity) {
    return String(entity?.attributes?.hvac_action || '').toLowerCase();
  }

  _climateIsActive(entity) {
    if (this._isUnavailable(entity) || entity.state === 'off') return false;
    const hvacAction = this._climateAction(entity);
    if (BRUNO_OFFICE_SUBVIEW_CLIMATE_ACTIVE_ACTIONS.includes(hvacAction)) return true;
    if (BRUNO_OFFICE_SUBVIEW_CLIMATE_INACTIVE_ACTIONS.includes(hvacAction)) return false;
    return BRUNO_OFFICE_SUBVIEW_CLIMATE_ON_STATES.includes(entity.state || '');
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

  _workspaceSourceFromAction(action) {
    const value = String(action || '');
    if (value.startsWith('spotify-')) return 'spotify';
    if (value.startsWith('pc-')) return 'pc';
    return '';
  }

  _selectedWorkspace(model) {
    const valid = ['pc', 'spotify'];
    if (valid.includes(this._selectedWorkspaceSource)) return this._selectedWorkspaceSource;
    if (model.spotify?.active) return 'spotify';
    if (model.pc?.active) return 'pc';
    return 'pc';
  }

  _mediaStateLabel(state, fallback = 'Desligado') {
    const value = String(state || '').toLowerCase();
    if (!value || BRUNO_OFFICE_SUBVIEW_UNAVAILABLE_STATES.includes(value)) return fallback;
    if (value === 'playing') return 'Tocando';
    if (value === 'paused') return 'Pausado';
    if (value === 'on' || value === 'idle') return 'Ativo';
    if (value === 'off') return fallback;
    return state;
  }

  _sceneContextLabel(model) {
    const active = this._state(this._config.entities.active_sensor);
    const attrs = active?.attributes || {};
    const configuredLabel = attrs.scene || attrs.active_scene || attrs.mode || attrs.display || attrs.context || attrs.label;
    if (configuredLabel && !Array.isArray(configuredLabel)) return String(configuredLabel);
    const semantic = String(model.focus?.semantic || '');
    if (semantic && semantic !== 'Disponivel') return semantic;
    if (model.pc?.active) return 'Trabalhando';
    if (model.spotify?.active) return model.spotify.playing ? 'Spotify tocando' : 'Spotify ativo';
    if (model.climate?.active) return `Clima ${this._climateModeLabel(model.climate.hvacMode)}`;
    if (model.lights > 0) return 'Office iluminado';
    if (semantic) return semantic;
    return active?.state === 'yes' ? 'Office ativo' : 'Disponivel';
  }

  _fireDomEvent(action) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: action,
      bubbles: true,
      composed: true,
    }));
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
          tag: `spotify_office_${mode}`,
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

    if (action === 'navigate') this._navigate(target.dataset.path || this._config.navigation_path);
    if (action === 'more-info') this._moreInfo(entityId);
    if (action === 'cover-open' && this._config.entities.curtain) this._callService('cover.open_cover', { entity_id: this._config.entities.curtain });
    if (action === 'cover-close' && this._config.entities.curtain) this._callService('cover.close_cover', { entity_id: this._config.entities.curtain });
    if (action === 'cover-stop' && this._config.entities.curtain) this._callService('cover.stop_cover', { entity_id: this._config.entities.curtain });
    if (action === 'cover-position') {
      const position = Number(target.dataset.position);
      if (Number.isFinite(position) && this._config.entities.curtain) {
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
    if (action === 'select-workspace-source') {
      const source = target.dataset.source;
      if (['pc', 'spotify'].includes(source)) this._selectedWorkspaceSource = source;
      this._safeRender();
      return;
    }
    const interactedWorkspace = this._workspaceSourceFromAction(action);
    if (interactedWorkspace) this._selectedWorkspaceSource = interactedWorkspace;
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
    if (action === 'focus-start') {
      if (!this._focusRunning) {
        if (this._focusRemaining <= 0) this._focusRemaining = this._focusDuration;
        this._focusStartedAt = Date.now() - ((this._focusDuration - this._focusRemaining) * 1000);
        this._focusRunning = true;
        this._startFocusTimer();
        this._safeRender();
      }
    }
    if (action === 'focus-pause') {
      if (this._focusRunning && this._focusStartedAt) {
        const elapsed = Math.floor((Date.now() - this._focusStartedAt) / 1000);
        this._focusRemaining = Math.max(0, this._focusDuration - elapsed);
      }
      this._focusRunning = false;
      this._safeRender();
    }
    // NOVO (Foco & Produtividade): reset do timer pomodoro.
    if (action === 'focus-reset') {
      this._focusRunning = false;
      this._focusStartedAt = null;
      this._focusRemaining = this._focusDuration;
      this._safeRender();
    }
    if (action === 'pc-power') this._callService('button.press', { entity_id: this._config.entities.pc_power });
    if (action === 'pc-sleep') this._callService('button.press', { entity_id: this._config.entities.pc_sleep });
    if (action === 'pc-restart') this._callService('button.press', { entity_id: this._config.entities.pc_restart });
    if (action === 'pc-shutdown') this._callService('button.press', { entity_id: this._config.entities.pc_shutdown });
    if (action === 'pc-lock') this._callService('button.press', { entity_id: this._config.entities.pc_lock });
    if (action === 'toggle-climate' && !this._cooldown('climate', 1800)) {
      const model = this._climateModel();
      this._callService(model.active ? 'climate.turn_off' : 'climate.turn_on', { entity_id: this._config.entities.climate });
    }
    if (action === 'climate-mode') {
      const hvacMode = target.dataset.mode;
      if (hvacMode) {
        this._callService('climate.set_hvac_mode', {
          entity_id: this._config.entities.climate,
          hvac_mode: hvacMode,
        });
      }
      return;
    }
    if (action === 'fan-mode') {
      const fanMode = target.dataset.mode;
      if (fanMode) {
        this._callService('climate.set_fan_mode', {
          entity_id: this._config.entities.climate,
          fan_mode: fanMode,
        });
      }
      return;
    }
    if (action === 'swing-mode') {
      const swingMode = target.dataset.mode;
      if (swingMode) {
        this._callService('climate.set_swing_mode', {
          entity_id: this._config.entities.climate,
          swing_mode: swingMode,
        });
      }
      return;
    }
    if (action === 'temp-down' || action === 'temp-up') {
      const model = this._climateModel();
      const current = Number(model.target);
      if (Number.isFinite(current)) {
        this._setClimateTarget(action === 'temp-up' ? current + model.targetStep : current - model.targetStep);
      }
    }
  }

  _handleInput(event) {
    const target = event.target;
    if (!target?.matches?.('[data-action]')) return;
    const value = Number(target.value);
    if (!Number.isFinite(value)) return;
    if (target.dataset.action === 'curtain-target') {
      if (!this._config.entities.curtain) return;
      this._callService('cover.set_cover_position', {
        entity_id: this._config.entities.curtain,
        position: Math.max(0, Math.min(100, Math.round(100 - value))),
      });
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
    if (target.dataset.action === 'climate-target') {
      this._setClimateTarget(value);
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
      spotify: this._spotifyModel(),
      focus: this._focusModel(),
      pc: this._pcModel(),
      climate: this._climateModel(),
    };
    this._lastMinute = this._clock();

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main class="office-subview">
        ${this._renderRoomSidebar()}

        <section class="left-column">
          <section class="hero-panel">
            ${this._renderHero(model)}
          </section>
          <section class="lower-left-grid">
            ${this._renderCameras(model)}
            ${this._renderFocus(model)}
          </section>
        </section>

        <section class="right-column">
          ${this._renderStatusRail(model)}
          <section class="right-control-grid">
            ${this._renderLights(model)}
            ${this._renderWorkspaceHub(model)}
            ${this._renderAC(model)}
          </section>
        </section>
      </main>
    `;

    this.shadowRoot.removeEventListener('click', this._boundActionHandler);
    this.shadowRoot.removeEventListener('change', this._boundInputHandler);
    this.shadowRoot.addEventListener('click', this._boundActionHandler);
    this.shadowRoot.addEventListener('change', this._boundInputHandler);
    this._bindImageFallbacks();
  }

  // NOVO (paridade Sala): fallback gracioso para imagens 404
  // (transportado de bruno-sala-subview.js).
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

  _renderHero(model) {
    const title = BrunoOfficeSubview._escape(this._config.title);
    const subtitle = BrunoOfficeSubview._escape(this._config.subtitle);
    const background = BrunoOfficeSubview._escapeAttr(this._config.background);
    const fallbackBackground = BrunoOfficeSubview._escapeAttr(this._config.fallback_background || this._config.background);
    const curtainConfigured = Boolean(this._config.entities.curtain);
    const curtainPosition = Math.max(0, Math.min(100, Number(model.curtainPosition) || 0));
    const curtainVisualPosition = curtainConfigured ? 100 - curtainPosition : 0;
    const curtainDisabled = curtainConfigured ? '' : 'disabled';
    const curtainStatus = curtainConfigured ? (curtainPosition <= 3 ? 'Fechada' : 'Aberta') : 'Sem cortina';
    const curtainPercent = curtainConfigured ? `- ${curtainPosition}%` : '- --';

    return `
      <div class="hero-stage">
        <div class="hero-bg" style="--hero-image: url('${background}'); --hero-fallback-image: url('${fallbackBackground}');" aria-hidden="true"></div>
        <div class="hero-content">
          <div class="hero-top">
            <button class="back-button" type="button" data-action="navigate" data-path="${BrunoOfficeSubview._escapeAttr(this._config.navigation_path)}" aria-label="Voltar">
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </button>
            <div>
              <div class="hero-title">${title}</div>
              <div class="hero-subtitle">${subtitle}</div>
            </div>
          </div>

          <div class="hero-headline">
            <p class="hero-date-line">${BrunoOfficeSubview._escape(this._dateLine())}</p>
            <div class="hero-clock" data-clock>${this._lastMinute}</div>
            <button type="button" class="scene-pill" data-action="more-info" data-entity="${BrunoOfficeSubview._escapeAttr(this._config.entities.active_sensor)}">
              <ha-icon icon="mdi:briefcase-clock"></ha-icon>
              <span>${BrunoOfficeSubview._escape(this._sceneContextLabel(model))}</span>
            </button>
          </div>

          <!-- Curtain dock identico ao da Sala. Office nao tem entidade de cortina
               (entities.curtain: '') — o bloco fica visualmente identico porem inerte
               ate uma cortina ser mapeada. Decisao do usuario em 2026-06-12.
               ANTERIOR (rollback): 4o botao "Automatica" (is-primary, mdi:home-automation)
               e pill "Automatica - X%". -->
          <div class="curtain-dock${curtainConfigured ? '' : ' is-disabled'}" style="--curtain-position: ${curtainVisualPosition}%;">
            <div class="curtain-control-row">
              <div class="curtain-identity">
                <span class="curtain-icon-shell">${BrunoOfficeSubview._curtainSvg('main')}</span>
                <span class="curtain-title">Cortina</span>
              </div>
              <div class="curtain-status" aria-live="polite">
                <span class="curtain-status-text">${BrunoOfficeSubview._escape(curtainStatus)}</span>
                <span class="curtain-status-percent">${BrunoOfficeSubview._escape(curtainPercent)}</span>
              </div>
              <div class="curtain-main-actions">
                <button type="button" class="curtain-action-button" data-action="cover-open" ${curtainDisabled}>
                  ${BrunoOfficeSubview._curtainSvg('open')}<span>Abrir</span>
                </button>
                <button type="button" class="curtain-action-button is-muted" data-action="cover-stop" ${curtainDisabled}>
                  ${BrunoOfficeSubview._curtainSvg('stop')}<span>Parar</span>
                </button>
                <button type="button" class="curtain-action-button" data-action="cover-close" ${curtainDisabled}>
                  ${BrunoOfficeSubview._curtainSvg('close')}<span>Fechar</span>
                </button>
              </div>
            </div>
            <div class="curtain-slider-zone">
              <div class="curtain-slider-glow" aria-hidden="true"></div>
              <input class="curtain-range" type="range" min="0" max="100" step="1" value="${curtainVisualPosition}" data-action="curtain-target" aria-label="Fechamento da cortina" ${curtainDisabled}>
              <div class="curtain-chips">
                <button type="button" class="curtain-chip" data-action="cover-position" data-position="25" ${curtainDisabled}>25%</button>
                <button type="button" class="curtain-chip" data-action="cover-position" data-position="50" ${curtainDisabled}>50%</button>
                <button type="button" class="curtain-chip" data-action="cover-position" data-position="75" ${curtainDisabled}>75%</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // NOVO (paridade Sala): icones SVG custom da barra de navegacao,
  // transportados de bruno-sala-subview.js.
  static _roomNavIcon(key) {
    const icons = {
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

  _renderRoomSidebar() {
    const items = this._config.room_nav || [];

    return `
      <nav class="room-sidebar" aria-label="Navegacao de comodos">
        ${items.map((item) => `
          <button
            type="button"
            class="room-nav-button${item.active ? ' is-active' : ''}${item.divider_after ? ' has-divider' : ''}"
            data-action="navigate"
            data-path="${BrunoOfficeSubview._escapeAttr(item.path || this._config.navigation_path)}"
            title="${BrunoOfficeSubview._escapeAttr(item.name)}"
            aria-label="${BrunoOfficeSubview._escapeAttr(item.name)}"
          >
            ${BrunoOfficeSubview._roomNavIcon(item.key || item.icon)}
          </button>
        `).join('')}
      </nav>
    `;
    // ANTERIOR (rollback): icone generico ha-icon no lugar do SVG custom:
    // <ha-icon icon="${BrunoOfficeSubview._escapeAttr(item.icon || 'mdi:square-rounded-outline')}"></ha-icon>
  }

  _renderStatusRail(model) {
    // NOVO (paridade Sala): 5 itens, mesma composicao da Sala.
    // ANTERIOR (rollback): havia um 6o item "Clima" entre Umidade e Roteador:
    // { icon: 'mdi:snowflake', value: 'Clima', label: this._climateModeLabel(model.climate.hvacMode), tone: 'blue' },
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
              <strong>${BrunoOfficeSubview._escape(item.value)}</strong>
              <span>${BrunoOfficeSubview._escape(item.label)}</span>
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
    return this._brightnessPercent(state);
  }

  _renderLightZoneRail(lights) {
    const label = 'Office';
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
        aria-label="${BrunoOfficeSubview._escapeAttr(ariaLabel)}"
        title="${BrunoOfficeSubview._escapeAttr(ariaLabel)}"
        data-zone="office"
        data-dimmer-entity="${BrunoOfficeSubview._escapeAttr(dimmerTarget?.entity || '')}"
        data-dimmer-level="${BrunoOfficeSubview._escapeAttr(String(fillPercent))}"
        style="--rail-fill:${fillPercent}%; --rail-fill-ratio:${(fillPercent / 100).toFixed(3)}; --rail-glow:${isOff ? '0' : '1'}; --rail-ambient-height:${Math.max(22, fillPercent * 1.9)}px;"
      >
        <span class="rail-zone">${BrunoOfficeSubview._escape(label)}</span>
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
      <button type="button" class="light-tile${active ? ' is-on' : ''}${disabled ? ' is-placeholder' : ''}" ${disabled ? 'disabled' : `data-action="toggle-light" data-entity="${BrunoOfficeSubview._escapeAttr(light.entity)}"`}>
        <span class="light-icon">${BrunoOfficeSubview._tplLightIcon(light.icon_type || light.icon, active)}</span>
        <strong>${BrunoOfficeSubview._escape(light.name)}</strong>
        <small>${disabled ? 'Placeholder' : (active ? 'Ligada' : 'Desligada')}</small>
      </button>
    `;
  }

  _renderLights(model) {
    // ANTERIOR (rollback): placeholders eram filtrados, deixando a 4a celula
    // do grid 2x2 vazia:
    // const visibleLights = (this._config.entities.lights || [])
    //   .filter((light) => light?.entity && !light.placeholder)
    //   .slice(0, 4);
    // NOVO (paridade Sala): placeholders renderizam como tile desabilitado,
    // mesmo padrao do "LED Fita TV" na Sala.
    const visibleLights = (this._config.entities.lights || []).slice(0, 4);

    return `
      <div class="glass-card lights-card office-lights-card">
        <div class="module-head">
          <div>
            <div class="module-title">Luzes</div>
          </div>
          <div class="head-actions">
            <button type="button" class="chip-button is-active" data-action="lights-on">Todas acesas</button>
            <button type="button" class="chip-button" data-action="lights-off">Apagar todas</button>
          </div>
        </div>

        <div class="lights-body office-lights-body">
          <div class="lights-single-grid office-lights-grid">
            ${visibleLights.map((light) => this._renderLightTile(light)).join('')}
          </div>
          ${this._renderLightZoneRail(visibleLights)}
        </div>
      </div>
    `;
  }

  /* =====================================================================
     ANTERIOR (rollback) — Focus card v1 (mode-row + ring grande + stat boxes).
     Substituido em 2026-06-12 pelo redesign aprovado pelo usuario
     (mini calendario + chip de reuniao + timer compacto).

  _renderFocus(model) {
    const focus = model.focus;
    const degrees = Math.round(focus.progress * 360);
    const mode = String(focus.semantic || '').toLowerCase();
    const workingActive = mode.includes('trabalh') || focus.running;
    const meetingActive = mode.includes('reuni');
    const availableActive = !workingActive && !meetingActive;

    return \`
      <section class="glass-card focus-card">
        <div class="focus-head">
          <div class="focus-title">
            <span class="micro-icon tone-blue"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></span>
            <strong>Foco & Produtividade</strong>
          </div>
        </div>

        <div class="focus-mode-row">
          <button type="button" class="focus-mode\${workingActive ? ' is-active' : ''}">
            <span>Trabalhando</span>
            <i></i>
          </button>
          <button type="button" class="focus-mode\${meetingActive ? ' is-active' : ''}">
            <span>Em reuniao</span>
            <i></i>
          </button>
          <button type="button" class="focus-mode\${availableActive ? ' is-active' : ''}">
            <span>Disponivel</span>
            <i></i>
          </button>
        </div>

        <div class="focus-dashboard">
          <div class="focus-ring-panel">
            <span>Timer de foco</span>
            <div class="focus-ring" style="--focus-angle:\${degrees}deg">
              <strong>\${BrunoOfficeSubview._escape(focus.label)}</strong>
              <small><ha-icon icon="mdi:waveform" style="--mdc-icon-size: 12px; margin-right: 4px;"></ha-icon>\${focus.running ? 'em foco' : 'pronto'}</small>
            </div>
            <button type="button" class="focus-toggle" data-action="\${focus.running ? 'focus-pause' : 'focus-start'}">
              <ha-icon icon="\${focus.running ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
              <span>\${focus.running ? 'Pausar' : 'Iniciar'}</span>
            </button>
          </div>

          <div class="focus-side">
            <div class="focus-next-minimal">
              <ha-icon icon="mdi:calendar-month-outline"></ha-icon>
              <span class="next-label">Status:</span>
              <strong class="next-title">\${meetingActive ? 'Em reuniao' : 'Agenda livre'}</strong>
              <span class="next-time">\${focus.running ? 'Foco ativo' : ''}</span>
            </div>
            <div class="focus-stats-grid">
              <div class="stat-box tone-green">
                <ha-icon icon="mdi:chart-line"></ha-icon>
                <strong>\${focus.sessions}</strong>
                <small>Sessoes</small>
              </div>
              <div class="stat-box tone-blue">
                <ha-icon icon="mdi:clock-outline"></ha-icon>
                <strong>\${BrunoOfficeSubview._escape(focus.focusedLabel)}</strong>
                <small>Tempo</small>
              </div>
            </div>
          </div>
        </div>
      </section>
    \`;
  }
  ===================================================================== */

  // NOVO — Focus card v2: header com chip de status, strip semanal do
  // calendario, proximo evento e timer pomodoro compacto em linha unica.
  _renderFocus(model) {
    const focus = model.focus;
    const calendar = this._calendarModel();
    const meetingActive = this._state(this._config.entities.meeting)?.state === 'on';
    const workingActive = this._state(this._config.entities.working)?.state === 'on';
    const chip = meetingActive
      ? { label: 'Em reuniao', tone: 'amber' }
      : workingActive
        ? { label: 'Trabalhando', tone: 'blue' }
        : { label: 'Livre', tone: 'green' };
    const sessionsLabel = focus.sessions === 1 ? '1 sessao' : `${focus.sessions} sessoes`;
    const next = calendar.nextEvent;

    return `
      <section class="glass-card focus-card">
        <div class="module-head focus-head">
          <div class="title-with-chip">
            <span class="micro-icon tone-blue"><ha-icon icon="mdi:crosshairs-gps"></ha-icon></span>
            <div>
              <div class="module-title">Foco</div>
            </div>
          </div>
          <span class="focus-status-chip tone-${chip.tone}"><span></span>${BrunoOfficeSubview._escape(chip.label)}</span>
        </div>

        <div class="focus-week" aria-label="Semana atual">
          ${calendar.days.map((day) => `
            <span class="focus-week-day${day.isToday ? ' is-today' : ''}">
              <small>${day.label}</small>
              <strong>${day.day}</strong>
              <span class="focus-week-dots">
                ${day.dots.map((color) => `<i style="background:${BrunoOfficeSubview._escapeAttr(color)}"></i>`).join('')}
              </span>
            </span>
          `).join('')}
        </div>

        <div class="focus-next">
          <span class="focus-next-label">${next ? (next.ongoing ? 'AGORA' : 'PROXIMO') : 'AGENDA'}</span>
          ${next ? `
            <span class="focus-next-time" style="--event-color:${BrunoOfficeSubview._escapeAttr(next.color)}">${BrunoOfficeSubview._escape(next.time)}</span>
            <span class="focus-next-copy">
              <strong>${BrunoOfficeSubview._escape(next.title)}</strong>
              <small>${BrunoOfficeSubview._escape(next.calendar)}</small>
            </span>
          ` : `
            <span class="focus-next-copy is-empty">
              <strong>${calendar.loaded ? 'Agenda livre' : 'Carregando agenda...'}</strong>
            </span>
          `}
        </div>

        <div class="focus-timer-row">
          <span class="focus-timer-time${focus.running ? ' is-running' : ''}">
            <ha-icon icon="mdi:timer-outline"></ha-icon>
            <strong>${BrunoOfficeSubview._escape(focus.label)}</strong>
          </span>
          <button type="button" class="focus-timer-toggle${focus.running ? ' is-running' : ''}" data-action="${focus.running ? 'focus-pause' : 'focus-start'}">
            <ha-icon icon="${focus.running ? 'mdi:pause' : 'mdi:play'}"></ha-icon>
            <span>${focus.running ? 'Pausar' : 'Iniciar'}</span>
          </button>
          <button type="button" class="focus-timer-reset" data-action="focus-reset" title="Reiniciar timer" aria-label="Reiniciar timer">
            <ha-icon icon="mdi:restart"></ha-icon>
          </button>
          <span class="focus-timer-meta">${BrunoOfficeSubview._escape(sessionsLabel)} · ${BrunoOfficeSubview._escape(focus.focusedLabel)}</span>
        </div>
      </section>
    `;
  }

  _renderCameras(model) {
    const active = model.cameras.activeCamera || model.cameras.cameras[0];

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
          <button type="button" class="camera-main" data-action="more-info" data-entity="${BrunoOfficeSubview._escapeAttr(active?.entity || '')}">
            ${this._cameraFrame(active)}
            <div class="camera-row-copy">
              <strong>${BrunoOfficeSubview._escape(active?.name || 'Camera')}</strong>
              <span><span class="live-dot"></span>${BrunoOfficeSubview._escape(active?.status || 'Online')}</span>
            </div>
            <ha-icon class="camera-chevron" icon="mdi:chevron-right"></ha-icon>
          </button>
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
        ${image ? `<img src="${BrunoOfficeSubview._escapeAttr(image)}" data-camera-src-base="${BrunoOfficeSubview._escapeAttr(base)}" data-camera-entity="${BrunoOfficeSubview._escapeAttr(camera.entity)}" alt="">` : ''}
        <div class="camera-placeholder"><ha-icon icon="mdi:video-outline"></ha-icon></div>
      </div>
    `;
  }

  _renderWorkspaceHub(model) {
    const selected = this._selectedWorkspace(model);
    const pc = model.pc;
    const spotify = model.spotify;
    const pcImage = BrunoOfficeSubview._escapeAttr(this._config.pc_image || '/local/images/office_pc.png');
    const spotifyArtwork = spotify.artwork ? BrunoOfficeSubview._resolvePicture(spotify.artwork) : '';
    const spotifyStandbyImage = this._config.spotify_standby_image || '/local/images/echo_pop.png';
    const spotifyVolume = spotify.volume == null ? 66 : spotify.volume;
    const metricIcon = {
      cpu: 'mdi:cpu-64-bit',
      ram: 'mdi:memory',
      gpu_temp: 'mdi:thermometer',
      network: 'mdi:wifi',
    };
    const compactMeta = (...values) => {
      const seen = new Set();
      return values
        .map((value) => String(value || '').trim())
        .filter((value) => {
          if (!value || value === '--') return false;
          const key = value.toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
    };
    const metaLine = (...values) => compactMeta(...values).join(' - ');
    const renderMeta = (value) => (
      value
        ? `<small>${BrunoOfficeSubview._escape(value)}</small>`
        : '<small aria-hidden="true">&nbsp;</small>'
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
        data-action="${BrunoOfficeSubview._escapeAttr(action)}"
        title="${BrunoOfficeSubview._escapeAttr(label)}"
        aria-label="${BrunoOfficeSubview._escapeAttr(label)}"
        ${attrs}
        ${disabled ? 'disabled' : ''}
      >
        <ha-icon icon="${BrunoOfficeSubview._escapeAttr(icon)}"></ha-icon>
      </button>
    `;
    const mediaIdentityCell = (type, active = false, options = {}) => `
      <span class="media-identity-cell is-${BrunoOfficeSubview._escapeAttr(type)}${active ? ' is-active' : ''}" aria-hidden="true">
        ${BrunoOfficeSubview._tplMediaIcon(type, { active, animate: Boolean(options.animate) })}
      </span>
    `;
    // ANTERIOR (rollback): img sem fallback — asset 404 ficava como imagem quebrada.
    // const standbyImage = (src, className, fallbackIcon) => (
    //   src
    //     ? `<img class="media-standby-image ${className}" src="${BrunoOfficeSubview._escapeAttr(src)}" alt="">`
    //     : `<ha-icon icon="${BrunoOfficeSubview._escapeAttr(fallbackIcon)}"></ha-icon>`
    // );
    // NOVO: wrapper com fallback gracioso via _bindImageFallbacks (paridade Sala).
    const standbyImage = (src, className, fallbackIcon) => (
      src
        ? `
          <span class="media-standby-shell" data-image-wrapper>
            <img class="media-standby-image ${className}" src="${BrunoOfficeSubview._escapeAttr(src)}" alt="" data-fallback-class="is-fallback">
            <ha-icon class="media-standby-fallback" icon="${BrunoOfficeSubview._escapeAttr(fallbackIcon)}"></ha-icon>
          </span>
        `
        : `<ha-icon icon="${BrunoOfficeSubview._escapeAttr(fallbackIcon)}"></ha-icon>`
    );
    const fillActionRow = (items) => {
      const visible = items.filter(Boolean).slice(0, 4);
      while (visible.length < 4) visible.push('<span class="media-action-spacer"></span>');
      return visible.join('');
    };
    const configuredButton = ({ entity, action, icon, label, className = '' }) => (
      entity
        ? mediaActionButton({ action, icon, label, className })
        : ''
    );
    const spotifyMeta = metaLine(
      spotify.subtitle,
      // ANTERIOR (rollback): fallback literal 'Echo Show' herdado da Sala.
      // spotify.source || this._config.spotify_device_name || 'Echo Show',
      spotify.source || this._config.spotify_device_name || 'Echo Pop Office',
    );
    const pcMeta = metaLine(
      pc.active ? 'Ativo' : 'Offline',
      pc.activeWindow,
      pc.session,
    );
    const spotifyTransportDisabled = !spotify.active;
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
    const pcPrimaryActions = fillActionRow([
      mediaIdentityCell('pc', pc.active),
      configuredButton({ entity: this._config.entities.pc_power, action: 'pc-power', icon: 'mdi:power', label: 'Ligar', className: 'is-main' }),
      configuredButton({ entity: this._config.entities.pc_sleep, action: 'pc-sleep', icon: 'mdi:weather-night', label: 'Sleep' }),
      configuredButton({ entity: this._config.entities.pc_restart, action: 'pc-restart', icon: 'mdi:restart', label: 'Reiniciar', className: 'is-tool' }),
    ]);
    const pcSecondaryButtons = [
      configuredButton({ entity: this._config.entities.pc_shutdown, action: 'pc-shutdown', icon: 'mdi:power-standby', label: 'Desligar' }),
      configuredButton({ entity: this._config.entities.pc_lock, action: 'pc-lock', icon: 'mdi:lock-outline', label: 'Bloquear' }),
    ].filter(Boolean);
    const pcFacts = [
      this._config.entities.pc_session && pc.session && pc.session !== '--'
        ? { icon: 'mdi:account-clock-outline', label: 'Sessao', value: pc.session }
        : null,
      this._config.entities.pc_idle && pc.idle && pc.idle !== '--'
        ? { icon: 'mdi:timer-sand', label: 'Inativo', value: pc.idle }
        : null,
      pc.webcamConfigured
        ? { icon: 'mdi:webcam', label: 'Webcam', value: pc.webcamActive ? 'On' : 'Off', active: pc.webcamActive }
        : null,
      this._config.entities.pc_volume && pc.volume && pc.volume !== '--'
        ? { icon: 'mdi:volume-high', label: 'Volume', value: pc.volume }
        : null,
      this._config.entities.pc_brightness && pc.brightness && pc.brightness !== '--'
        ? { icon: 'mdi:white-balance-sunny', label: 'Brilho', value: pc.brightness }
        : null,
      ...pc.metrics
        .filter((metric) => metric.entity && metric.value && metric.value !== '--')
        .map((metric) => ({
          icon: metricIcon[metric.key] || 'mdi:chart-line',
          label: metric.label,
          value: metric.value,
        })),
    ].filter(Boolean);
    const sources = {
      pc: {
        key: 'pc',
        label: 'PC',
        icon: 'mdi:monitor-dashboard',
        active: pc.active,
        state: pc.active ? 'Ativo' : 'Offline',
        title: 'Office PC',
        meta: renderMeta(pcMeta),
        visual: standbyImage(pcImage, 'media-pc-standby', 'mdi:monitor-dashboard'),
        primaryActions: pcPrimaryActions,
        secondaryActions: pcSecondaryButtons.length ? fillActionRow(pcSecondaryButtons) : '',
        extra: pcFacts.length
          ? `
            <div class="workspace-facts">
              ${pcFacts.slice(0, 4).map((fact) => `
                <span class="${fact.active ? 'is-active' : ''}">
                  <ha-icon icon="${BrunoOfficeSubview._escapeAttr(fact.icon)}"></ha-icon>
                  <small>${BrunoOfficeSubview._escape(fact.label)}</small>
                  <strong>${BrunoOfficeSubview._escape(fact.value)}</strong>
                </span>
              `).join('')}
            </div>
          `
          : '',
      },
      spotify: {
        key: 'spotify',
        label: 'Spotify',
        icon: 'mdi:spotify',
        active: spotify.active,
        state: spotify.playing ? 'Tocando' : this._mediaStateLabel(spotify.state, 'Off'),
        title: spotify.title || 'SpotifyPlus',
        meta: renderMeta(spotifyMeta),
        visual: spotifyArtwork
          ? `<img src="${BrunoOfficeSubview._escapeAttr(spotifyArtwork)}" alt="">`
          : standbyImage(spotifyStandbyImage, 'media-spotify-standby', 'mdi:music-note'),
        primaryActions: spotifyPrimaryActions,
        secondaryActions: spotifySecondaryActions,
        extra: `
          <div class="volume-row spotify-volume">
            <ha-icon icon="mdi:volume-medium"></ha-icon>
            <input type="range" min="0" max="100" value="${spotifyVolume}" data-action="spotify-volume" aria-label="Volume do Spotify" ${spotifyTransportDisabled ? 'disabled' : ''}>
            <strong>${spotifyVolume}%</strong>
          </div>
        `,
      },
    };
    const current = sources[selected] || sources.pc;
    const tabs = Object.values(sources);

    return `
      <section class="glass-card media-hub-card workspace-hub-card is-${BrunoOfficeSubview._escapeAttr(current.key)}">
        <div class="module-head media-hub-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:desk"></ha-icon></span>
            <div>
              <div class="module-title">Estacao de trabalho</div>
            </div>
          </div>
          <div class="media-tabs" role="tablist" aria-label="Fonte da estacao">
            ${tabs.map((source) => `
              <button
                type="button"
                class="${source.key === current.key ? 'is-selected' : ''}${source.active ? ' is-source-active' : ''}"
                data-action="select-workspace-source"
                data-source="${BrunoOfficeSubview._escapeAttr(source.key)}"
              >
                <span class="source-dot"></span>
                <span>${BrunoOfficeSubview._escape(source.label)}</span>
                <small>${BrunoOfficeSubview._escape(source.state)}</small>
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
              <strong>${BrunoOfficeSubview._escape(current.title)}</strong>
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

  _renderSpotify(model) {
    const spotify = model.spotify;
    const artwork = spotify.artwork ? BrunoOfficeSubview._resolvePicture(spotify.artwork) : '';
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
          <span class="state-chip"><span></span>${spotify.playing ? 'Playing' : BrunoOfficeSubview._escape(spotify.state)}</span>
        </div>

        <div class="spotify-body">
          <div class="spotify-art${artwork ? ' has-art' : ''}">
            ${artwork ? `<img src="${BrunoOfficeSubview._escapeAttr(artwork)}" alt="">` : '<ha-icon icon="mdi:music-note"></ha-icon>'}
          </div>
          <div class="spotify-copy">
            <div class="spotify-controls">
              ${controls}
            </div>
            <div class="volume-row spotify-volume">
              <ha-icon icon="mdi:volume-medium"></ha-icon>
              <input type="range" min="0" max="100" value="${volume}" data-action="spotify-volume" aria-label="Volume do Spotify"${transportDisabled}>
              <strong>${volume}%</strong>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderPC(model) {
    const pc = model.pc;
    const pcImage = BrunoOfficeSubview._escapeAttr(this._config.pc_image || '/local/images/office_pc.png');
    const metricIcon = {
      cpu: 'mdi:cpu-64-bit',
      ram: 'mdi:memory',
      gpu_temp: 'mdi:thermometer',
      network: 'mdi:wifi',
    };
    const metricTone = {
      cpu: 'blue',
      ram: 'purple',
      gpu_temp: 'amber',
      network: 'green',
    };

    return `
      <section class="glass-card pc-card${pc.active ? ' is-active' : ''}">
        <div class="pc-head">
          <div class="title-with-chip">
            <span class="micro-icon tone-blue"><ha-icon icon="mdi:monitor"></ha-icon></span>
            <div>
              <div class="pc-title-line">
                <div class="module-title">Office PC</div>
                <span class="pc-state-dot${pc.active ? ' is-on' : ''}"></span>
              </div>
            </div>
          </div>
        </div>

        <div class="pc-body">
          <div class="pc-hero-visual">
            <ha-icon class="pc-visual-fallback" icon="mdi:monitor-dashboard"></ha-icon>
            <img src="${pcImage}" alt="" loading="lazy">
          </div>

          <div class="pc-status-panel">
            <div class="pc-metrics">
              ${pc.metrics.map((metric) => `
                <span class="pc-metric tone-${metricTone[metric.key] || 'blue'}" style="--metric:${BrunoOfficeSubview._metricPercent(metric.value)}%">
                  <ha-icon icon="${metricIcon[metric.key] || 'mdi:chart-line'}"></ha-icon>
                  <small>${BrunoOfficeSubview._escape(metric.label)}</small>
                  <strong>${BrunoOfficeSubview._escape(metric.value)}</strong>
                  <i></i>
                </span>
              `).join('')}
            </div>
          </div>

          <div class="pc-actions">
            <button type="button" class="pc-action is-power" data-action="pc-power">
              <ha-icon icon="mdi:power"></ha-icon>
              <span>Ligar</span>
            </button>
            <button type="button" class="pc-action is-sleep" data-action="pc-sleep">
              <ha-icon icon="mdi:weather-night"></ha-icon>
              <span>Sleep</span>
            </button>
            <button type="button" class="pc-action is-warm" data-action="pc-restart">
              <ha-icon icon="mdi:restart"></ha-icon>
              <span>Restart</span>
            </button>
            <button type="button" class="pc-action is-danger" data-action="pc-shutdown">
              <ha-icon icon="mdi:power-standby"></ha-icon>
              <span>Shut Down</span>
            </button>
          </div>

          <div class="pc-controls-panel">
            <div class="pc-camera-row">
              <span><ha-icon icon="mdi:webcam"></ha-icon><strong>Webcam</strong></span>
              <em>${pc.webcamActive ? 'On' : 'Off'}</em>
              <i class="${pc.webcamActive ? 'is-on' : ''}"></i>
            </div>
            <div class="pc-slider-row">
              <span><ha-icon icon="mdi:volume-high"></ha-icon><strong>Volume</strong></span>
              <i style="--slider:${BrunoOfficeSubview._metricPercent(pc.volume)}%"></i>
              <em>${BrunoOfficeSubview._escape(pc.volume)}</em>
            </div>
            <div class="pc-slider-row">
              <span><ha-icon icon="mdi:white-balance-sunny"></ha-icon><strong>Brightness</strong></span>
              <i style="--slider:${BrunoOfficeSubview._metricPercent(pc.brightness)}%"></i>
              <em>${BrunoOfficeSubview._escape(pc.brightness)}</em>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderClimateRing(climate, target, current, minTarget, maxTarget, dialMode) {
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
      { text: `${this._formatNumber(safeMin, 0)}\u00b0`, angle: -180, r: radius + 52, cls: 'edge' },
      { text: '10', angle: -148, r: radius + 58, cls: '' },
      { text: '20', angle: -90, r: radius + 52, cls: 'top' },
      { text: '25', angle: -32, r: radius + 58, cls: '' },
      { text: `${this._formatNumber(safeMax, 0)}\u00b0`, angle: 0, r: radius + 52, cls: 'edge' },
    ];
    const labelMarkup = labels.map((label) => {
      const p = polarToCartesian(label.r, label.angle);
      return `<text x="${p.x.toFixed(3)}" y="${p.y.toFixed(3)}" text-anchor="middle" dominant-baseline="middle" class="icg-label ${label.cls}">${BrunoOfficeSubview._escape(label.text)}</text>`;
    }).join('');

    return `
      <div class="icg-root">
        <div class="icg-shell">
          <svg class="icg-svg" viewBox="0 0 720 460" role="img" aria-label="${BrunoOfficeSubview._escapeAttr(`Temperatura alvo ${targetLabel}\u00b0. Ambiente ${ambientLabel}\u00b0.`)}">
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
            <text x="${cx}" y="260" text-anchor="middle" dominant-baseline="middle" class="icg-center-mode">${BrunoOfficeSubview._escape(modeLabel)}</text>
            <text x="${cx}" y="328" text-anchor="middle" dominant-baseline="middle" class="icg-center-temp">${BrunoOfficeSubview._escape(targetLabel)}\u00b0</text>
            <text x="${cx}" y="382" text-anchor="middle" dominant-baseline="middle" class="icg-center-sub">SET TEMPERATURE</text>
            <line x1="${cx - 28}" y1="408" x2="${cx + 28}" y2="408" class="icg-center-line"></line>
            <text x="${cx}" y="432" text-anchor="middle" dominant-baseline="middle" class="icg-ambient">Ambient ${BrunoOfficeSubview._escape(ambientLabel)}\u00b0</text>
          </svg>
        </div>
      </div>
    `;
  }

  _renderAC(model) {
    const climate = model.climate;
    const target = climate.target == null ? '--' : this._formatNumber(climate.target, 0);
    const targetNumber = Number.isFinite(Number(climate.target)) ? Math.round(Number(climate.target)) : 22;
    const current = climate.current == null ? '--' : this._formatNumber(climate.current, 1);
    const minTarget = Number.isFinite(Number(climate.minTemp)) ? Number(climate.minTemp) : 16;
    const maxTarget = Number.isFinite(Number(climate.maxTemp)) ? Number(climate.maxTemp) : 30;
    const targetStep = Number.isFinite(Number(climate.targetStep)) ? Number(climate.targetStep) : 1;
    const deviceName = BrunoOfficeSubview._escape(this._config.climate_device_name || 'Ar condicionado');
    const climateImage = BrunoOfficeSubview._escapeAttr(this._config.climate_image || '/local/images/ar-condicionado-gree-tight.png');
    const climateActiveImage = BrunoOfficeSubview._escapeAttr(this._config.climate_active_image || '/local/images/ar-condicionado-gree-on-tight.png?v=20260606-on-1');
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
    const modeButtonClass = (button) => {
      return activeMode === button.key ? ' is-active' : '';
    };
    const hvacModes = Array.isArray(climate.hvacModes) ? climate.hvacModes : [];
    const hvacAvailable = (key) => !hvacModes.length || hvacModes.includes(key);
    const fanMode = (candidates, fallback) => this._climateOption(climate.fanModes, candidates, fallback);
    const lowMode = fanMode(['low', 'baixo'], 'low');
    const mediumMode = fanMode(['medium', 'med', 'medio'], 'medium');
    const highMode = fanMode(['high', 'alto'], 'high');
    const swingOnMode = this._climateOption(climate.swingModes, ['on', 'ativada', 'ativo', 'enabled'], '');
    const swingOffMode = this._climateOption(climate.swingModes, ['off', 'desativada', 'desativado', 'disabled'], '');
    const nextSwingMode = swingActive ? swingOffMode : swingOnMode;
    const fanActive = (value, aliases = []) => {
      const normalized = String(value || '').toLowerCase();
      return Boolean(normalized) && (fan === normalized || aliases.some((alias) => fan.includes(alias)));
    };
    const modeButtons = [
      { key: 'cool', icon: 'mdi:snowflake', label: 'Cool', disabled: !hvacAvailable('cool') },
      { key: 'heat', icon: 'mdi:fire', label: 'Heat', disabled: !hvacAvailable('heat') },
      { key: 'fan_only', icon: 'mdi:fan', label: 'Fan', disabled: !hvacAvailable('fan_only') },
    ];
    const fanButtons = [
      { key: 'low', label: 'Low', action: 'fan-mode', mode: lowMode, active: fanActive(lowMode, ['low', 'baixo']) },
      { key: 'medium', label: 'Med', action: 'fan-mode', mode: mediumMode, active: fanActive(mediumMode, ['med']) },
      { key: 'high', label: 'High', action: 'fan-mode', mode: highMode, active: fanActive(highMode, ['high', 'alto']) },
      { key: 'swing', label: 'Swing', action: 'swing-mode', mode: nextSwingMode, active: swingActive },
    ];

    /* ANTERIOR (rollback): class="glass-card ac-card${climate.active ? ' is-active' : ''}"
       Sala nunca usa is-active no root do ac-card — o card nao acende com o AC ligado. */
    return `
      <section class="glass-card ac-card">
        <div class="module-head ac-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:snowflake"></ha-icon></span>
            <div>
              <div class="module-title">Ar Condicionado</div>
              <div class="module-subtitle">${deviceName}</div>
            </div>
          </div>
          <button type="button" class="power-button${climate.active ? ' is-active' : ''}" data-action="toggle-climate" aria-label="Ligar ar condicionado">
            <ha-icon icon="mdi:power"></ha-icon>
          </button>
        </div>
        <div class="ac-body">
          <div class="ac-visual">
            <div class="ac-image-shell${climate.active ? ' is-on' : ''}" data-image-wrapper>
              <img
                class="ac-unit-image ac-unit-image-off"
                src="${climateImage}"
                alt=""
                data-fallback-class="is-fallback"
              >
              <img
                class="ac-unit-image ac-unit-image-on"
                src="${climateActiveImage}"
                alt=""
              >
              <ha-icon class="ac-image-fallback" icon="mdi:air-conditioner"></ha-icon>
            </div>
            ${this._renderClimateRing(climate, target, current, minTarget, maxTarget, dialMode)}
          </div>
          <label class="temperature-slider" aria-label="Temperatura do ar condicionado">
            <input type="range" min="${BrunoOfficeSubview._escapeAttr(minTarget)}" max="${BrunoOfficeSubview._escapeAttr(maxTarget)}" step="${BrunoOfficeSubview._escapeAttr(targetStep)}" value="${targetNumber}" data-action="climate-target">
          </label>
          <div class="climate-mode-row" aria-label="Modo do ar condicionado">
            ${modeButtons.map((button) => `
              <button
                type="button"
                class="climate-mode${modeButtonClass(button)}"
                data-action="climate-mode"
                data-mode="${BrunoOfficeSubview._escapeAttr(button.key)}"
                title="${BrunoOfficeSubview._escapeAttr(button.label)}"
                ${button.disabled ? 'disabled' : ''}
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
                data-action="${BrunoOfficeSubview._escapeAttr(button.action)}"
                data-mode="${BrunoOfficeSubview._escapeAttr(button.mode)}"
                ${button.mode ? '' : 'disabled'}
              >${BrunoOfficeSubview._escape(button.label)}</button>
            `).join('')}
          </div>
        </div>
      </section>
    `;
  }

  _styles() {
    return `
      :host {
        --office-gap: 10px;
        --office-radius: var(--bruno-liquid-card-radius, 18px);
        --office-radius-small: var(--bruno-liquid-card-radius-compact, 16px);
        /* ANTERIOR (rollback): --office-cell-radius: 12px; */
        /* NOVO (paridade Sala): mesmo token de raio de celula da Sala. */
        --office-cell-radius: var(--bruno-liquid-cell-radius, 16px);
        --accent: var(--bruno-liquid-accent, 150, 190, 255);
        --accent-blue: 96, 165, 250;
        --accent-cyan: 79, 172, 254;
        --accent-amber: 255, 183, 77;
        --media-screen-height: 154px;
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

      .office-subview {
        --office-shell-height: min(734px, calc(100vh - 34px));
        /* NOVO (paridade Sala): a Sala usa gap 12px no shell (override final). */
        --office-gap: 12px;
        width: 100%;
        min-height: 100vh;
        height: 100vh;
        display: grid;
        grid-template-columns: 56px minmax(420px, 540px) minmax(630px, 1fr);
        grid-template-rows: var(--office-shell-height);
        grid-template-areas: "frame-left left right";
        align-content: center;
        align-items: stretch;
        gap: var(--office-gap);
        padding: 12px 10px 22px;
        background:
          radial-gradient(760px 420px at 16% 2%, rgba(110,150,210,0.12), transparent 72%),
          radial-gradient(680px 420px at 96% 70%, rgba(255,190,120,0.08), transparent 74%),
          #020406;
        overflow: hidden;
      }

      .left-column,
      .right-column {
        min-width: 0;
        min-height: 0;
        height: 100%;
      }

      .left-column {
        grid-area: left;
        display: grid;
        grid-template-rows: minmax(320px, 1.24fr) minmax(250px, 1fr);
        gap: var(--office-gap);
      }

      .right-column {
        grid-area: right;
        display: grid;
        grid-template-rows: 64px minmax(0, 1fr);
        gap: var(--office-gap);
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
        gap: var(--office-gap);
      }

      .lower-left-grid {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1.08fr) minmax(250px, 0.92fr);
        gap: var(--office-gap);
      }

      .room-sidebar { grid-area: frame-left; }
      .hero-panel,
      .cameras-card,
      .focus-card,
      .lights-card,
      .media-hub-card,
      .ac-card {
        min-width: 0;
        min-height: 0;
      }
      .lights-card { grid-area: lights; }
      .media-hub-card { grid-area: media; }
      .ac-card { grid-area: ac; }

      .room-sidebar {
        position: relative;
        z-index: 3;
        isolation: isolate;
        align-self: center;
        justify-self: center;
        /* ANTERIOR (rollback): width 56px; rows 39px; gap 8px; padding 13px 8px 14px; */
        width: 58px;
        max-height: calc(100% - 6px);
        display: grid;
        grid-auto-rows: 40px;
        gap: 7px;
        padding: 12px 8px;
        border-radius: 999px;
        background: var(--bruno-liquid-rail-background,
          radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
          radial-gradient(38px 110px at 92% 86%, rgba(var(--accent),0.10), transparent 68%),
          linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
          linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
        );
        border: var(--bruno-liquid-rail-border, 1px solid rgba(255,255,255,0.11));
        box-shadow: var(--bruno-liquid-rail-shadow,
          inset 0 1px 0 rgba(255,255,255,0.18),
          inset 0 -1px 0 rgba(255,255,255,0.045),
          0 18px 40px rgba(0,0,0,0.36)
        );
        backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
        -webkit-backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
        overflow: hidden;
      }

      .room-sidebar::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        pointer-events: none;
        border-radius: calc(999px - 1px);
        background: var(--bruno-liquid-rail-sheen,
          radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
          radial-gradient(42px 70px at 94% 18%, rgba(var(--accent),0.16), transparent 72%),
          linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
          linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
        );
        opacity: var(--bruno-liquid-rail-sheen-opacity, 0.78);
      }

      .room-nav-button {
        position: relative;
        z-index: 1;
        /* ANTERIOR (rollback): width/height 39px; color rgba(255,255,255,0.62); */
        width: 40px;
        height: 40px;
        min-width: 40px;
        min-height: 40px;
        max-width: 40px;
        max-height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        color: rgba(255,255,255,0.70);
        background: transparent;
        transition: background 160ms ease, color 160ms ease, transform 160ms ease, box-shadow 160ms ease;
      }

      /* NOVO (paridade Sala): estilos do SVG custom da navegacao. */
      .room-nav-button svg {
        width: 20px;
        height: 20px;
        display: block;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.55;
        stroke-linecap: round;
        stroke-linejoin: round;
        filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
        pointer-events: none;
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
        background: var(--bruno-liquid-selected-blue-background,
          radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 62%),
          linear-gradient(180deg, rgba(105,150,230,0.68), rgba(59,92,178,0.54))
        );
        border: 1px solid var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.38));
        box-shadow: var(--bruno-liquid-selected-blue-shadow,
          inset 0 1px 0 rgba(255,255,255,0.32),
          0 0 20px rgba(96,165,250,0.32)
        );
      }

      .room-nav-button ha-icon {
        --mdc-icon-size: 19px;
      }

      /* =================================================================
         ANTERIOR (rollback) — skin glass-card v1 (geracao bento: tokens sem
         fallback, sheen atras do fundo e edge-glow no ::after):

      .glass-card {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 0;
        border-radius: var(--office-radius);
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
        border-radius: calc(var(--office-radius) - 1px);
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
      ================================================================= */

      /* NOVO (paridade Sala): skin glass-card transposto verbatim de
         bruno-sala-subview.js (bloco final/efetivo). */
      .glass-card {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 0;
        border-radius: var(--office-radius);
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
        border-radius: calc(var(--office-radius) - 1px);
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

      /* =================================================================
         ANTERIOR (rollback) — hero-bg v1 (center/cover, insets quase zero,
         fades proprios na direita):

      .hero-bg {
        position: absolute;
        pointer-events: none;
        z-index: 0;
        top: 0;
        bottom: 0;
        left: -10px;
        right: -2px;
        background:
          linear-gradient(90deg, rgba(4,10,18,0.82) 0%, rgba(5,10,18,0.66) 12%, rgba(6,12,20,0.42) 24%, rgba(7,13,22,0.22) 38%, rgba(7,13,22,0.10) 50%, rgba(7,13,22,0.08) 64%, rgba(7,13,22,0.16) 76%, rgba(7,13,22,0.38) 86%, rgba(7,13,22,0.72) 94%, rgba(7,13,22,0.98) 100%),
          linear-gradient(180deg, rgba(4,8,14,0.78) 0%, rgba(4,8,14,0.46) 10%, rgba(4,8,14,0.18) 22%, rgba(4,8,14,0.04) 34%, rgba(4,8,14,0.00) 46%, rgba(4,8,14,0.00) 58%, rgba(4,8,14,0.10) 72%, rgba(4,8,14,0.28) 84%, rgba(4,8,14,0.56) 94%, rgba(4,8,14,0.78) 100%),
          radial-gradient(680px 220px at 12% 4%, rgba(255,255,255,0.07), transparent 56%),
          radial-gradient(900px 320px at 74% 52%, rgba(255,255,255,0.03), transparent 66%),
          var(--hero-image) center center / cover no-repeat,
          var(--hero-fallback-image) center center / cover no-repeat;
        opacity: 1;
        filter: saturate(1.02) brightness(0.88);
        mask-image:
          linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.90) 82%, rgba(0,0,0,0.56) 93%, transparent 100%),
          linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
        -webkit-mask-image:
          linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 72%, rgba(0,0,0,0.90) 82%, rgba(0,0,0,0.56) 93%, transparent 100%),
          linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
        mask-composite: intersect;
        -webkit-mask-composite: source-in;
      }
      ================================================================= */

      /* NOVO (paridade Sala): hero-bg transposto verbatim da Sala —
         foto ancorada a esquerda (auto 100%) com overhang a direita. */
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

      /* ANTERIOR (rollback) — hero-bg::before v1 tinha inset estendido
         (-8px -172px -18px 0), rampa propria no eixo X e um radial extra:
         radial-gradient(320px 220px at 78% 48%, rgba(2,6,12,0.28), transparent 68%). */
      /* NOVO (paridade Sala): gradientes identicos aos da Sala, inset herdado (0). */
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
        inset: 0;
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
        /* ANTERIOR (rollback): padding: 16px 18px 14px; gap: 10px; */
        padding: 15px 18px 14px;
        gap: 8px;
      }

      .hero-top {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      /* ANTERIOR (rollback): valores hardcoded (radius 14px fixo, sem blur). */
      /* NOVO (paridade Sala): tokens liquid com fallbacks + backdrop-filter. */
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
        /* ANTERIOR (rollback): margin-top: 20px; */
        margin-top: 12px;
      }

      .hero-date-line {
        /* ANTERIOR (rollback): margin: 0 0 11px; */
        margin: 0 0 6px;
        color: rgba(255,255,255,0.54);
        font-size: 11px;
        line-height: 1;
        font-weight: 700;
        text-transform: uppercase;
      }

      .hero-clock {
        /* ANTERIOR (rollback): margin-top: 14px; font-size: clamp(56px, 7.4vh, 78px); */
        margin-top: 8px;
        font-size: clamp(54px, 7.1vh, 74px);
        line-height: 0.96;
        font-weight: 220;
        font-variant-numeric: tabular-nums;
        color: rgba(255,255,255,0.95);
        text-shadow: 0 10px 32px rgba(0,0,0,0.28);
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
        /* ANTERIOR (rollback): width: min(500px, 100%); */
        width: min(520px, 100%);
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
        /* ANTERIOR (rollback): repeat(4, minmax(68px, 1fr)) minmax(118px, auto); */
        grid-template-columns: repeat(4, minmax(70px, 1fr)) minmax(112px, auto);
        align-items: center;
        gap: 8px;
      }

      /* ANTERIOR (rollback): min-height 48px, valores hardcoded sem tokens liquid. */
      /* NOVO (paridade Sala): tokens liquid com fallbacks, min-height 46px. */
      .preset-button {
        min-height: 46px;
        display: grid;
        place-items: center;
        gap: 4px;
        padding: 6px 6px;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        background: var(--bruno-liquid-control-background,
          radial-gradient(74px 44px at 50% 0%, rgba(255,255,255,0.13), transparent 72%),
          rgba(255,255,255,0.058)
        );
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.12));
        color: rgba(255,255,255,0.72);
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.08));
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
      /* ANTERIOR (rollback): radius 12px e cores hardcoded. */
      /* NOVO (paridade Sala): tokens liquid. */
      .primary-button {
        min-height: 36px;
        padding: 0 14px;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        background: rgba(255,255,255,0.075);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
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

      .curtain-dock {
        width: min(520px, 100%);
        grid-template-rows: auto auto;
        gap: 11px;
        --curtain-gold: rgb(242,194,102);
      }

      .curtain-dock.is-disabled {
        opacity: 0.72;
      }

      .curtain-control-row {
        display: grid;
        grid-template-columns: minmax(116px, auto) minmax(86px, 1fr) auto;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .curtain-identity {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .curtain-icon-shell {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        flex: 0 0 auto;
        border-radius: 50%;
        background:
          radial-gradient(circle at 50% 0%, rgba(255,255,255,0.17), rgba(255,255,255,0.04) 56%, rgba(0,0,0,0.18)),
          rgba(18,20,21,0.52);
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
      }

      .curtain-title {
        font-size: 13px;
        line-height: 1.05;
        font-weight: 800;
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

      .curtain-status-text { color: var(--curtain-gold); }
      .curtain-status-percent { color: rgba(255,255,255,0.78); }

      .curtain-main-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 7px;
        min-width: 0;
      }

      .curtain-action-button {
        width: 78px;
        height: 40px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 5px;
        padding: 0 9px;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.15));
        background: var(--bruno-liquid-control-background,
          linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.025)),
          rgba(22,23,24,0.50)
        );
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.13), 0 8px 18px rgba(0,0,0,0.22));
        color: rgba(255,255,255,0.88);
        font-size: 12px;
        font-weight: 700;
        white-space: nowrap;
      }

      .curtain-action-button:disabled,
      .curtain-chip:disabled,
      .curtain-range:disabled {
        opacity: 0.46;
        cursor: not-allowed;
      }

      .curtain-svg {
        display: block;
        width: 19px;
        height: 19px;
        fill: rgba(255,255,255,0.70);
        stroke: rgba(255,255,255,0.58);
        stroke-width: 2.1;
        stroke-linecap: round;
        stroke-linejoin: round;
        flex: 0 0 auto;
      }

      .curtain-icon-shell .curtain-svg {
        width: 18px;
        height: 18px;
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
        top: -4px;
        width: var(--curtain-position);
        height: 14px;
        border-radius: 999px;
        background: linear-gradient(90deg, rgba(242,194,102,0.24), rgba(242,194,102,0.05));
        filter: blur(10px);
        pointer-events: none;
      }

      .curtain-range {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 4px;
        margin: 0;
        appearance: none;
        -webkit-appearance: none;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.08);
        background: linear-gradient(90deg, var(--curtain-gold) 0 var(--curtain-position), rgba(242,194,102,0.45) var(--curtain-position), rgba(255,255,255,0.10) var(--curtain-position) 100%);
        box-shadow: inset 0 1px 2px rgba(0,0,0,0.34);
        accent-color: var(--curtain-gold);
      }

      .curtain-range::-webkit-slider-runnable-track {
        height: 4px;
        border-radius: 999px;
        background: transparent;
      }

      .curtain-range::-webkit-slider-thumb {
        width: 18px;
        height: 18px;
        margin-top: -7px;
        -webkit-appearance: none;
        appearance: none;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.34);
        background:
          radial-gradient(circle at 40% 30%, rgba(255,255,255,0.95), rgba(235,190,100,0.72) 55%, rgba(20,20,20,0.85));
        box-shadow: 0 0 9px rgba(242,194,102,0.34), 0 2px 8px rgba(0,0,0,0.44);
      }

      .curtain-chips {
        display: flex;
        gap: 8px;
        margin-top: 14px;
        justify-content: center;
      }

      .curtain-chip {
        flex: 1 1 0;
        min-height: 31px;
        padding: 0 12px;
        border-radius: 999px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.052);
        color: rgba(255,255,255,0.48);
        font-size: 12px;
        font-weight: 700;
      }

      .status-rail {
        display: grid;
        /* ANTERIOR (rollback): repeat(6, minmax(0, 1fr)) — havia 6o item Clima. */
        grid-template-columns: repeat(5, minmax(0, 1fr));
        min-height: 64px;
        gap: 0;
        padding: 0;
      }

      .status-item {
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        min-width: 0;
        gap: 8px;
        /* ANTERIOR (rollback): padding: 0 13px; */
        padding: 0 12px;
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
        white-space: nowrap;
      }

      .status-item span:not(.micro-icon) {
        display: block;
        margin-top: 4px;
        font-size: 10px;
        line-height: 1;
        color: var(--text-soft);
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
      .focus-card,
      .tv-card,
      .pc-card,
      .spotify-card,
      .media-hub-card,
      .ac-card {
        padding: 14px;
        /* NOVO (paridade Sala): grid explicito head + corpo. */
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        /* ANTERIOR (rollback): gap: 6px; */
        gap: 8px;
      }

      /* NOVO (paridade Sala) */
      .ac-head {
        margin-bottom: 0;
      }

      .lights-card {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        /* ANTERIOR (rollback): gap: 7px; */
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
        margin-bottom: 8px;
      }

      .lights-card .module-head {
        /* ANTERIOR (rollback): min-height: 30px; */
        min-height: 40px;
        align-items: start;
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

      /* NOVO (paridade Sala): pílulas "Todas acesas"/"Apagar todas" com mesma
         altura e padding que a Sala (min-height 34px / padding 0 14px).
         Sem este override ficavam 4px mais baixas (base .chip-button = 30px). */
      .head-actions .chip-button {
        min-height: 34px;
        padding: 0 14px;
      }

      /* NOTA (2026-06-12): .lights-groups/.lights-divider/.light-group-grid sao
         CSS herdado da Sala sem markup correspondente no Office (codigo morto,
         sem efeito visual). Mantido por rastreabilidade — Regra de Ouro. */
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

      .lights-body {
        position: relative;
        z-index: 1;
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 60px;
        gap: 10px;
      }

      .lights-single-grid,
      .office-lights-grid {
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .light-tile {
        position: relative;
        display: grid;
        /* ANTERIOR (rollback): grid-template-columns: 66px minmax(0, 1fr); */
        grid-template-columns: 60px minmax(0, 1fr);
        grid-template-rows: auto auto;
        grid-template-areas:
          "icon title"
          "icon status";
        align-items: center;
        align-content: center;
        /* ANTERIOR (rollback): column-gap 15px; padding 13px 16px; radius var(--office-radius-small); */
        column-gap: 11px;
        min-height: 0;
        padding: 11px 12px;
        text-align: left;
        border-radius: var(--office-cell-radius);
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

      .lights-zone-rail {
        position: relative;
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto;
        justify-items: center;
        gap: 10px;
        padding: 9px 7px;
        overflow: hidden;
        /* ANTERIOR (rollback): border-radius: var(--office-radius-small); */
        border-radius: var(--office-cell-radius);
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
        /* ANTERIOR (rollback): calc(var(--office-radius-small) - 1px); */
        border-radius: calc(var(--office-cell-radius) - 1px);
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
        /* ANTERIOR (rollback): width/height 62px; */
        width: 60px;
        height: 60px;
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
        grid-area: title;
        min-width: 0;
        align-self: end;
        /* ANTERIOR (rollback): color: white; font-size: 15px; line-height: 1.1; font-weight: 850; */
        font-size: 14.8px;
        line-height: 1.12;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .light-tile small {
        grid-area: status;
        min-width: 0;
        color: rgba(255,205,95,0.92);
        /* ANTERIOR (rollback): font-size: 11px; */
        font-size: 12px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* =================================================================
         ANTERIOR (rollback) — CSS do Focus card v1 (mode-row, ring grande,
         stat boxes). Substituido em 2026-06-12 pelo redesign v2.

      .focus-card {
        min-width: 0;
        min-height: 0;
        padding: 15px;
        display: grid;
        grid-template-rows: 34px 38px minmax(0, 1fr);
        gap: 10px;
      }

      .focus-head {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: flex-start;
      }

      .focus-title {
        min-width: 0;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .focus-title strong {
        min-width: 0;
        font-size: 16px;
        line-height: 1;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .focus-mode-row {
        position: relative;
        z-index: 1;
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 12px;
      }

      .focus-mode {
        min-width: 0;
        min-height: 38px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
        padding: 0 12px;
        border-radius: 16px;
        color: rgba(255,255,255,0.68);
        background: linear-gradient(145deg, rgba(255,255,255,0.09), rgba(255,255,255,0.025));
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
      }

      .focus-mode span {
        min-width: 0;
        font-size: 11px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .focus-mode i {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        border: 1px solid rgba(255,255,255,0.30);
        flex-shrink: 0;
      }

      .focus-mode.is-active {
        color: rgba(210,232,255,0.98);
        background:
          radial-gradient(64px 42px at 12% 6%, rgba(96,165,250,0.20), transparent 74%),
          rgba(96,165,250,0.085);
        border-color: rgba(96,165,250,0.42);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.15),
          0 0 18px rgba(96,165,250,0.14);
      }

      .focus-mode.is-active i {
        background: rgb(96,190,255);
        border-color: rgba(96,190,255,0.88);
        box-shadow: 0 0 14px rgba(96,190,255,0.45);
      }

      .focus-dashboard {
        position: relative;
        z-index: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr);
        align-items: stretch;
        gap: 12px;
      }

      .focus-ring-panel,
      .focus-next-minimal {
        min-width: 0;
        border-radius: 18px;
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.11);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
      }

      .focus-ring-panel {
        display: grid;
        place-items: center;
        align-content: center;
        gap: 8px;
        padding: 10px;
      }

      .focus-ring-panel > span {
        color: var(--text-soft);
        font-size: 12px;
        font-weight: 700;
      }

      .focus-ring {
        width: 100%;
        max-width: 136px;
        aspect-ratio: 1;
        border-radius: 50%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 2px;
        background:
          radial-gradient(circle at 50% 50%, rgba(7,10,18,0.78) 0 56%, transparent 57%),
          conic-gradient(rgb(96,165,250) 0 var(--focus-angle), rgba(255,255,255,0.12) var(--focus-angle) 360deg);
        border: 1px solid rgba(255,255,255,0.13);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.14),
          0 0 28px rgba(96,165,250,0.30);
      }

      .focus-ring strong {
        font-size: 26px;
        line-height: 1;
        font-weight: 400;
        margin-top: 2px;
        font-variant-numeric: tabular-nums;
      }

      .focus-ring small {
        display: flex;
        align-items: center;
        color: rgb(126,204,255);
        font-size: 10px;
        font-weight: 700;
      }

      .focus-toggle {
        min-height: 32px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 7px;
        padding: 0 12px;
        border-radius: 999px;
        color: rgba(255,255,255,0.90);
        font-size: 11px;
        font-weight: 850;
        background: rgba(96,165,250,0.16);
        border: 1px solid rgba(96,165,250,0.30);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
      }

      .focus-toggle ha-icon {
        --mdc-icon-size: 14px;
      }

      .focus-side {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 10px;
      }

      .focus-next-minimal {
        position: relative;
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 10px 14px;
        border-radius: 14px;
        white-space: nowrap;
        overflow: hidden;
      }

      .focus-next-minimal ha-icon {
        --mdc-icon-size: 16px;
        color: rgba(255,255,255,0.66);
      }

      .focus-next-minimal .next-label {
        color: var(--text-soft);
        font-size: 11px;
        font-weight: 700;
      }

      .focus-next-minimal .next-title {
        color: white;
        font-size: 12px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .focus-next-minimal .next-time {
        color: rgba(126,204,255,0.92);
        font-size: 11px;
        font-weight: 700;
      }

      .focus-stats-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
        flex: 1;
        align-items: stretch;
      }

      .stat-box {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        border-radius: 14px;
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.11);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
        padding: 10px 4px;
      }

      .stat-box ha-icon {
        --mdc-icon-size: 20px;
        margin-bottom: 6px;
      }

      .stat-box.tone-green ha-icon { color: rgb(74,222,128); }
      .stat-box.tone-blue ha-icon { color: rgb(96,190,255); }
      .stat-box.tone-amber ha-icon { color: rgb(251,191,36); }

      .stat-box strong {
        font-size: 15px;
        line-height: 1;
        font-weight: 800;
        color: white;
        margin-bottom: 3px;
      }

      .stat-box small {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-soft);
        line-height: 1;
      }
      ================================================================= */

      /* NOVO — Focus card v2: header padrao + chip de status, strip semanal
         do calendario, proximo evento e timer compacto (visual limpo, sem
         sub-paineis aninhados — paridade com a linguagem dos cards da Sala). */
      .focus-card {
        min-width: 0;
        min-height: 0;
        padding: 14px;
        display: grid;
        grid-template-rows: auto auto minmax(0, 1fr) auto;
        gap: 10px;
      }

      .focus-head {
        margin-bottom: 0;
      }

      .focus-status-chip {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 800;
        color: rgba(255,255,255,0.88);
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        white-space: nowrap;
      }

      .focus-status-chip > span {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      .focus-status-chip.tone-green > span {
        background: rgb(74,222,128);
        box-shadow: 0 0 10px rgba(74,222,128,0.55);
      }

      .focus-status-chip.tone-blue > span {
        background: rgb(96,190,255);
        box-shadow: 0 0 10px rgba(96,190,255,0.55);
      }

      .focus-status-chip.tone-amber > span {
        background: rgb(251,191,36);
        box-shadow: 0 0 10px rgba(251,191,36,0.55);
      }

      .focus-week {
        display: grid;
        grid-template-columns: repeat(7, minmax(0, 1fr));
        gap: 4px;
      }

      .focus-week-day {
        min-width: 0;
        display: grid;
        justify-items: center;
        gap: 2px;
        padding: 6px 0 5px;
        border-radius: 12px;
        border: 1px solid transparent;
      }

      .focus-week-day small {
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.4px;
        color: var(--text-dim);
        text-transform: uppercase;
      }

      .focus-week-day strong {
        font-size: 13px;
        line-height: 1;
        font-weight: 700;
        color: rgba(255,255,255,0.82);
        font-variant-numeric: tabular-nums;
      }

      .focus-week-day.is-today {
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 14%, rgba(96,183,255,0.34), transparent 72%),
          rgba(38,92,154,0.42)
        );
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
        border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.34));
      }

      .focus-week-day.is-today small,
      .focus-week-day.is-today strong {
        color: white;
      }

      .focus-week-dots {
        min-height: 5px;
        display: inline-flex;
        gap: 3px;
      }

      .focus-week-dots i {
        width: 4px;
        height: 4px;
        border-radius: 50%;
      }

      .focus-next {
        min-width: 0;
        min-height: 0;
        display: flex;
        align-items: center;
        gap: 10px;
        overflow: hidden;
      }

      .focus-next-label {
        flex-shrink: 0;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.8px;
        color: var(--text-dim);
      }

      .focus-next-time {
        flex-shrink: 0;
        display: inline-flex;
        align-items: center;
        gap: 7px;
        font-size: 13px;
        font-weight: 800;
        color: rgba(255,255,255,0.92);
        font-variant-numeric: tabular-nums;
      }

      .focus-next-time::before {
        content: "";
        width: 3px;
        height: 16px;
        border-radius: 999px;
        background: var(--event-color, rgb(127,219,233));
      }

      .focus-next-copy {
        min-width: 0;
        display: grid;
        gap: 1px;
      }

      .focus-next-copy strong {
        min-width: 0;
        font-size: 12.5px;
        line-height: 1.15;
        font-weight: 800;
        color: white;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .focus-next-copy small {
        font-size: 10.5px;
        font-weight: 700;
        color: var(--text-soft);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .focus-next-copy.is-empty strong {
        color: rgba(255,255,255,0.72);
        font-weight: 700;
      }

      .focus-timer-row {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        padding-top: 9px;
        border-top: 1px solid rgba(255,255,255,0.09);
      }

      .focus-timer-time {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        color: rgba(255,255,255,0.88);
      }

      .focus-timer-time ha-icon {
        --mdc-icon-size: 15px;
        color: rgba(255,255,255,0.55);
      }

      .focus-timer-time strong {
        font-size: 16px;
        line-height: 1;
        font-weight: 700;
        font-variant-numeric: tabular-nums;
      }

      .focus-timer-time.is-running ha-icon {
        color: rgb(126,204,255);
      }

      .focus-timer-toggle {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 13px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 850;
        color: white;
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%),
          linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58))
        );
        border: 1px solid var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
        box-shadow: var(--bruno-liquid-control-blue-shadow,
          inset 0 1px 0 rgba(255,255,255,0.22),
          0 0 22px rgba(96,165,250,0.24)
        );
      }

      .focus-timer-toggle ha-icon {
        --mdc-icon-size: 14px;
      }

      .focus-timer-reset {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 30px;
        height: 30px;
        border-radius: 50%;
        color: rgba(255,255,255,0.62);
        background: rgba(255,255,255,0.07);
        border: 1px solid rgba(255,255,255,0.12);
      }

      .focus-timer-reset ha-icon {
        --mdc-icon-size: 14px;
      }

      .focus-timer-meta {
        margin-left: auto;
        font-size: 10.5px;
        font-weight: 700;
        color: var(--text-soft);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
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
        border-radius: var(--office-radius-small);
        background: rgba(255,255,255,0.045);
        border: 1px solid rgba(255,255,255,0.11);
        text-align: left;
      }

      .camera-row-image {
        position: relative;
        width: 100%;
        height: 100%;
        overflow: hidden;
        border-radius: var(--office-radius-small);
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
        background: linear-gradient(90deg, rgba(4,8,16,0.52), rgba(4,8,16,0.10) 68%, rgba(4,8,16,0.42));
      }

      .camera-row-copy,
      .camera-chevron {
        position: absolute;
        z-index: 2;
      }

      .camera-row-copy {
        /* ANTERIOR (rollback): left/bottom 14px, sem right. */
        left: 13px;
        right: 13px;
        bottom: 13px;
        display: grid;
        gap: 4px;
      }

      .camera-row-copy strong {
        /* ANTERIOR (rollback): font-size: 17px; */
        font-size: 15px;
        line-height: 1.08;
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
      .pc-card,
      .spotify-card,
      .ac-card {
        min-height: 0;
      }

      .tv-body,
      .ac-body {
        position: relative;
        z-index: 1;
        /* ANTERIOR (rollback): height: calc(100% - 46px); */
        height: auto;
        min-height: 0;
        display: grid;
        grid-template-columns: 1fr;
        gap: 14px;
        align-items: stretch;
      }

      .tv-main,
      .spotify-copy,
      .ac-main {
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

      /* ANTERIOR (rollback) — acento roxo:
      .control-button.is-main {
        background:
          radial-gradient(circle at 50% 18%, rgba(142,126,255,0.50), transparent 72%),
          linear-gradient(180deg, rgba(108,88,214,0.74), rgba(60,48,128,0.58));
        border-color: rgba(160,145,255,0.48);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.22),
          0 0 22px rgba(112,88,255,0.26);
      }
      */
      /* NOVO (paridade Sala): azul padrao. */
      .control-button.is-main {
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%),
          linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58))
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
        box-shadow: var(--bruno-liquid-control-blue-shadow,
          inset 0 1px 0 rgba(255,255,255,0.22),
          0 0 22px rgba(96,165,250,0.24)
        );
        color: white;
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
        /* ANTERIOR (rollback): accent-color: rgb(116,92,255); (roxo) */
        accent-color: rgb(28,214,104);
      }

      .spotify-volume input {
        accent-color: rgb(28,214,104);
      }

      .poster-card {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: var(--office-radius-small);
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.12);
        color: var(--text-dim);
        overflow: hidden;
        font-size: 12px;
        font-weight: 800;
      }

      .tv-card .poster-card,
      .spotify-art {
        height: var(--media-screen-height, 154px);
        min-height: var(--media-screen-height, 154px);
        max-height: var(--media-screen-height, 154px);
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

      .device-state {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        width: fit-content;
        color: rgba(255,255,255,0.82);
        font-size: 11px;
        font-weight: 800;
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

      /* ANTERIOR (rollback): apenas gap + max-width — sem display, sem pill visual.
         Causava renderizacao vertical dos tabs (PC / Spotify empilhados).
         NOVO (paridade Sala): inline-flex + pill identico ao .media-tabs da Sala. */
      .media-tabs {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        padding: 3px;
        background: rgba(255,255,255,0.065);
        border: 1px solid rgba(255,255,255,0.11);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
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
        grid-template-areas: "visual content";
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
        border-radius: var(--office-radius-small);
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

      /* NOVO: shell de fallback do visual standby (PC/Spotify).
         Se a imagem falhar (404), _bindImageFallbacks marca .is-fallback
         e o icone substitui a imagem quebrada. */
      .media-standby-shell {
        display: contents;
      }

      .media-standby-shell .media-standby-fallback {
        display: none;
      }

      .media-standby-shell.is-fallback .media-standby-fallback {
        display: inline-flex;
      }

      .media-pc-standby {
        width: 104% !important;
        height: 94% !important;
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

      .media-details {
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

      .media-details small {
        min-width: 0;
        color: var(--text-soft);
        font-size: 12px;
        line-height: 1.25;
        font-weight: 650;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
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

      .media-hub-extra {
        grid-area: auto;
        min-width: 0;
        align-self: end;
        display: grid;
        gap: 10px;
      }

      .workspace-facts {
        min-width: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .workspace-facts span {
        min-width: 0;
        min-height: 42px;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        grid-template-rows: auto auto;
        align-items: center;
        column-gap: 8px;
        row-gap: 2px;
        padding: 7px 10px;
        border-radius: 12px;
        color: var(--text-soft);
        background: rgba(255,255,255,0.052);
        border: 1px solid rgba(255,255,255,0.10);
      }

      .workspace-facts span.is-active {
        color: rgba(210,245,230,0.96);
        background:
          radial-gradient(circle at 12% 12%, rgba(46,231,122,0.16), transparent 72%),
          rgba(255,255,255,0.058);
        border-color: rgba(46,231,122,0.20);
      }

      .workspace-facts ha-icon {
        --mdc-icon-size: 18px;
        grid-row: 1 / -1;
      }

      .workspace-facts small,
      .workspace-facts strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .workspace-facts small {
        font-size: 10px;
        line-height: 1;
        font-weight: 750;
      }

      .workspace-facts strong {
        color: rgba(255,255,255,0.90);
        font-size: 12px;
        line-height: 1.1;
        font-weight: 850;
      }

      .workspace-metrics {
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .workspace-control-list {
        min-width: 0;
        display: grid;
        gap: 7px;
      }

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

      .ac-meta strong {
        color: white;
        min-width: 0;
        font-size: 13px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pc-card {
        padding: 14px;
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 10px;
      }

      .pc-head {
        position: relative;
        z-index: 1;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .pc-title-line {
        display: inline-flex;
        align-items: center;
        gap: 9px;
      }

      .pc-title-line .module-title {
        font-size: 16px;
      }

      .pc-state-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgba(255,255,255,0.22);
      }

      .pc-state-dot.is-on {
        background: rgb(74,222,128);
        box-shadow: 0 0 13px rgba(74,222,128,0.72);
      }

      .pc-body {
        position: relative;
        z-index: 1;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
        grid-template-rows: minmax(0, 1.3fr) minmax(0, 1fr);
        grid-template-areas:
          "visual status"
          "actions controls";
        gap: 12px;
      }

      .pc-hero-visual {
        grid-area: visual;
        min-width: 0;
        min-height: 0;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: var(--office-radius-small);
        background: transparent;
        border: 0;
        box-shadow: none;
        overflow: hidden;
      }

      .pc-hero-visual img {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        object-fit: contain;
        filter:
          drop-shadow(0 10px 16px rgba(0,0,0,0.42))
          drop-shadow(0 0 20px rgba(96,165,250,0.12));
      }

      .pc-visual-fallback {
        position: absolute;
        --mdc-icon-size: 72px;
        color: rgba(180,215,255,0.82);
        filter: drop-shadow(0 0 16px rgba(96,165,250,0.18));
      }

      .pc-visual-fallback {
        display: none;
      }

      .pc-actions {
        grid-area: actions;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .pc-action {
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr);
        align-items: center;
        justify-content: center;
        gap: 8px;
        min-height: 42px;
        padding: 0 10px;
        border-radius: 12px;
        color: rgba(255,255,255,0.78);
        background: rgba(255,255,255,0.055);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
      }

      .pc-action ha-icon {
        --mdc-icon-size: 20px;
      }

      .pc-action span {
        min-width: 0;
        font-size: 11px;
        font-weight: 800;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .pc-action.is-power {
        color: rgba(126,245,155,0.98);
        background:
          radial-gradient(54px 34px at 16% 6%, rgba(74,222,128,0.24), transparent 72%),
          rgba(74,222,128,0.08);
        border-color: rgba(74,222,128,0.28);
      }

      .pc-action.is-warm {
        color: rgba(255,205,95,0.98);
        background:
          radial-gradient(54px 34px at 16% 6%, rgba(255,183,77,0.20), transparent 72%),
          rgba(255,183,77,0.07);
        border-color: rgba(255,183,77,0.24);
      }

      .pc-action.is-sleep {
        color: rgba(139,180,255,0.98);
        background:
          radial-gradient(54px 34px at 16% 6%, rgba(96,165,250,0.18), transparent 72%),
          rgba(96,165,250,0.065);
        border-color: rgba(96,165,250,0.22);
      }

      .pc-action.is-danger {
        color: rgba(255,112,102,0.98);
        background:
          radial-gradient(54px 34px at 16% 6%, rgba(248,113,113,0.18), transparent 72%),
          rgba(248,113,113,0.06);
        border-color: rgba(248,113,113,0.22);
      }

      .pc-status-panel {
        grid-area: status;
        min-width: 0;
        min-height: 0;
        display: grid;
        align-content: center;
      }

      .pc-metrics {
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .pc-metric {
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto;
        grid-template-rows: auto 5px;
        align-items: center;
        column-gap: 6px;
        row-gap: 6px;
        padding: 8px 10px;
        border-radius: 15px;
        background: rgba(255,255,255,0.052);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
      }

      .pc-metric ha-icon {
        --mdc-icon-size: 18px;
        grid-row: 1 / -1;
        color: rgba(255,255,255,0.76);
      }

      .pc-metrics small {
        color: var(--text-soft);
        font-size: 10px;
        font-weight: 750;
        text-transform: none;
      }

      .pc-metrics strong {
        color: white;
        font-size: 12px;
      }

      .pc-metric i {
        grid-column: 2 / -1;
        height: 5px;
        overflow: hidden;
        border-radius: 999px;
        background: rgba(255,255,255,0.10);
      }

      .pc-metric i::before {
        content: "";
        display: block;
        width: var(--metric);
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, rgb(96,165,250), rgb(142,126,255));
        box-shadow: 0 0 12px rgba(96,165,250,0.24);
      }

      .pc-metric.tone-amber i::before {
        background: linear-gradient(90deg, rgb(255,183,77), rgb(255,139,82));
        box-shadow: 0 0 12px rgba(255,183,77,0.22);
      }

      .pc-metric.tone-purple i::before {
        background: linear-gradient(90deg, rgb(157,124,255), rgb(196,112,255));
        box-shadow: 0 0 12px rgba(157,124,255,0.22);
      }

      .pc-metric.tone-green i::before {
        background: linear-gradient(90deg, rgb(74,222,128), rgb(45,212,191));
        box-shadow: 0 0 12px rgba(74,222,128,0.22);
      }

      .pc-camera-row {
        min-width: 0;
        display: grid;
        grid-template-columns: auto minmax(0, 1fr) auto auto;
        align-items: center;
        gap: 9px;
        padding: 0 10px;
        min-height: 38px;
        border-radius: 16px;
        background: rgba(255,255,255,0.052);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
      }

      .pc-camera-row span {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 9px;
      }

      .pc-camera-row ha-icon {
        --mdc-icon-size: 20px;
        color: rgba(255,255,255,0.76);
      }

      .pc-camera-row strong,
      .pc-camera-row em {
        min-width: 0;
        font-size: 12px;
        font-style: normal;
        font-weight: 800;
      }

      .pc-camera-row em {
        color: rgba(126,245,155,0.92);
      }

      .pc-camera-row i {
        width: 34px;
        height: 20px;
        padding: 2px;
        border-radius: 999px;
        background: rgba(255,255,255,0.10);
        border: 1px solid rgba(255,255,255,0.12);
      }

      .pc-camera-row i::before {
        content: "";
        display: block;
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(255,255,255,0.72);
        transition: transform 160ms ease;
      }

      .pc-camera-row i.is-on {
        background: rgba(74,222,128,0.68);
      }

      .pc-camera-row i.is-on::before {
        transform: translateX(14px);
        background: white;
      }

      .pc-controls-panel {
        grid-area: controls;
        min-width: 0;
        display: grid;
        grid-template-rows: auto auto auto;
        align-content: center;
        gap: 14px;
      }

      .pc-slider-row {
        min-width: 0;
        display: grid;
        grid-template-columns: 80px minmax(0, 1fr) 36px;
        align-items: center;
        gap: 8px;
      }

      .pc-slider-row span {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: rgba(255,255,255,0.70);
      }

      .pc-slider-row ha-icon {
        --mdc-icon-size: 19px;
      }

      .pc-slider-row strong {
        font-size: 11px;
        font-weight: 750;
        white-space: nowrap;
      }

      .pc-slider-row > i {
        position: relative;
        height: 6px;
        overflow: visible;
        border-radius: 999px;
        background: rgba(255,255,255,0.12);
      }

      .pc-slider-row > i::before {
        content: "";
        position: absolute;
        inset: 0 auto 0 0;
        width: var(--slider);
        border-radius: inherit;
        background: rgb(96,165,250);
        box-shadow: 0 0 12px rgba(96,165,250,0.50);
      }

      .pc-slider-row > i::after {
        content: "";
        position: absolute;
        top: 50%;
        left: var(--slider);
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: white;
        transform: translate(-50%, -50%);
        box-shadow: 0 2px 9px rgba(0,0,0,0.35);
      }

      .pc-slider-row em {
        color: rgb(96,165,250);
        font-size: 12px;
        font-style: normal;
        font-weight: 800;
        text-align: right;
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
        grid-template-rows: var(--media-screen-height, 154px) auto;
        align-items: stretch;
        gap: 8px;
      }

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
        border-radius: var(--office-radius-small);
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
        grid-template-rows: minmax(0, 1fr) auto auto auto auto;
        gap: 10px;
        align-content: start;
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

      /* NOVO (paridade Sala): regras que ativam o fallback do AC quando a
         imagem falha — na Sala existem, no Office faltavam (o binder
         _bindImageFallbacks tambem foi transportado nesta sessao). */
      .ac-image-shell.is-fallback .ac-unit-image {
        display: none;
      }

      .ac-image-shell.is-fallback .ac-image-fallback {
        display: block;
      }

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
        aspect-ratio: 16 / 9;
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
        /* NOVO (paridade Sala): letter-spacing ausente causava numerais da escala colapsados. */
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
        /* NOVO (paridade Sala): letter-spacing ausente colapsava o label do modo (COOL/OFF). */
        letter-spacing: 9px;
        fill: rgba(38, 190, 255, 0.96);
        text-transform: uppercase;
      }

      .icg-center-temp {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 96px;
        font-weight: 300;
        /* NOVO (paridade Sala) */
        letter-spacing: -8px;
        fill: rgba(246, 250, 255, 0.98);
        filter: url(#icgTextGlow);
      }

      .icg-center-sub {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 15px;
        font-weight: 500;
        /* NOVO (paridade Sala): letter-spacing ausente colapsava "SET TEMPERATURE". */
        letter-spacing: 9px;
        fill: rgba(190, 204, 220, 0.72);
        text-transform: uppercase;
      }

      .icg-center-line {
        stroke: rgba(36, 195, 255, 0.95);
        stroke-width: 2;
        stroke-linecap: round;
        filter: url(#icgOfficeBlueGlow);
      }

      .icg-ambient {
        font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: 14px;
        font-weight: 500;
        /* NOVO (paridade Sala) */
        letter-spacing: 1.8px;
        fill: rgba(176, 196, 220, 0.60);
      }

      .temperature-slider {
        min-width: 0;
        width: 100%;
        display: block;
        align-items: center;
        padding: 0;
        background: transparent;
        border: 0;
        /* NOVO (paridade Sala) */
        margin-bottom: 3px;
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
        /* NOVO (paridade Sala) */
        align-items: start;
      }

      /* ANTERIOR (rollback): radius 12px e valores hardcoded sem tokens/blur. */
      /* NOVO (paridade Sala): tokens liquid com fallbacks + backdrop-filter. */
      .climate-mode,
      .fan-mode,
      .climate-stepper {
        min-height: 34px;
        border-radius: var(--bruno-liquid-control-radius, 14px);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.09));
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.050));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.06));
        backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
        -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
      }

      .climate-mode {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        color: rgba(255,255,255,0.66);
      }

      .climate-mode:disabled,
      .fan-mode:disabled {
        opacity: 0.42;
        cursor: default;
      }

      .climate-mode ha-icon {
        --mdc-icon-size: 17px;
      }

      /* ANTERIOR (rollback): azul hardcoded sem tokens/box-shadow. */
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
        background:
          radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%),
          rgba(38,92,138,0.38);
        border-color: rgba(96,165,250,0.32);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.12),
          0 0 14px rgba(96,165,250,0.16);
      }

      .climate-stepper {
        display: grid;
        grid-template-columns: 42px minmax(0, 1fr) 42px;
        align-items: center;
        overflow: hidden;
        /* NOVO (paridade Sala) */
        margin-bottom: 4px;
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
        min-height: 0;
        aspect-ratio: 1;
        height: auto;
        padding: 0 4px;
      }

      /* ANTERIOR (rollback): destaque neutro (branco translucido). */
      /* NOVO (paridade Sala): destaque azul com tokens. */
      .fan-mode.is-active {
        color: rgba(255,255,255,0.94);
        background: var(--bruno-liquid-control-blue-background,
          radial-gradient(circle at 50% 14%, rgba(96,183,255,0.24), transparent 72%),
          rgba(38,92,154,0.32)
        );
        border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.28));
        box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14));
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
        animation: bruno-office-marquee 10s linear infinite;
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

      @keyframes bruno-office-marquee {
        0%, 18% { transform: translateX(0); }
        82%, 100% { transform: translateX(calc(-100% + 100px)); }
      }

      @media (max-width: 1180px) {
        .room-sidebar {
          display: none;
        }

        .office-subview {
          height: auto;
          overflow: auto;
          grid-template-columns: 1fr;
          grid-template-rows: auto auto;
          grid-template-areas:
            "left"
            "right";
          align-content: start;
          padding: 10px;
        }

        .left-column {
          grid-template-rows: minmax(330px, 46vh) minmax(300px, auto);
        }

        .right-column {
          grid-template-rows: auto minmax(0, auto);
        }

        .lower-left-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          min-height: 300px;
        }

        /* ANTERIOR (rollback): cols 0.55fr, rows 280/320px.
           NOVO (paridade Sala): cols 0.72fr, rows 236/300px — iguais à Sala ≤1180px. */
        .right-control-grid {
          grid-template-columns: minmax(0, 1fr) minmax(280px, 0.55fr);
          grid-template-rows: minmax(280px, auto) minmax(320px, auto);
          grid-template-areas:
            "lights ac"
            "media ac";
        }

        /* ANTERIOR (rollback):
        .status-rail {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }

        .status-item {
          padding: 0 10px;
        }
        */
        /* NOVO (paridade Sala): rail mantem 5 colunas, so cresce a altura. */
        .status-rail {
          min-height: 68px;
        }
      }

      @media (max-width: 760px) {
        :host {
          height: auto;
          overflow: visible;
        }

        .office-subview {
          grid-template-columns: 1fr;
          grid-template-rows: auto;
          grid-template-areas:
            "left"
            "right";
          padding: 8px;
        }

        .left-column {
          grid-template-rows: auto auto;
        }

        .right-column {
          grid-template-rows: auto auto;
        }

        .lower-left-grid {
          grid-template-columns: 1fr;
        }

        .right-control-grid {
          grid-template-columns: 1fr;
          grid-template-rows: auto auto auto;
          grid-template-areas:
            "lights"
            "media"
            "ac";
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

        .media-hub-body {
          grid-template-columns: 1fr;
          grid-template-rows: minmax(210px, auto) auto;
          grid-template-areas:
            "visual"
            "content";
        }

        .media-tabs {
          max-width: 100%;
        }

        .media-primary-actions {
          grid-template-columns: repeat(4, minmax(44px, 1fr));
          gap: 8px;
        }

        .media-action-button {
          width: 100%;
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

        .media-hub-card,
        .ac-card {
          min-height: 260px;
        }

        .media-hub-card {
          min-height: 360px;
        }

        .ac-body {
          grid-template-columns: 1fr;
        }

        /* ANTERIOR (rollback): min-height 280px.
           NOVO (paridade Sala): min-height 238px — igual à Sala ≤760px. */
        .ac-visual {
          min-height: 238px;
        }
      }
    `;
  }

  static _tplMediaIcon(type, options = {}) {
    const name = String(type || '').replace(/[^a-z0-9_-]/gi, '') || 'pc';
    const active = typeof options === 'boolean' ? options : Boolean(options.active);
    const icons = {
      pc: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <linearGradient id="bruno-office-media-pc-screen" gradientUnits="userSpaceOnUse" x1="6" y1="34" x2="44" y2="12">
            <stop offset="0" stop-color="#60a5fa"/>
            <stop offset="1" stop-color="#7dd3fc"/>
          </linearGradient>
          <path d="M4 8.5h42v29H4v-29z" fill="${active ? 'url(#bruno-office-media-pc-screen)' : '#20262890'}"/>
          <path fill="currentColor" d="M45.8 7H4.2C2.9 7 2 8 2 9.2v27.6C2 38 2.9 39 4.2 39h41.6c1.2 0 2.2-1 2.2-2.2V9.2C48 8 47 7 45.8 7zm-.4 29.2H4.6V9.8h40.8v26.4zM18.7 42.2h12.6l1.6 3.1h5.8c.7 0 1.2.5 1.2 1.1v.3c0 .7-.5 1.2-1.2 1.2H11.3c-.7 0-1.2-.5-1.2-1.1v-.3c0-.7.5-1.2 1.2-1.2h5.8l1.6-3.1z"/>
        </svg>
      `,
      spotify: active
        ? `
          <svg viewBox="0 0 42.55 42.55" aria-hidden="true">
            <style>
              @keyframes bruno-office-spotify-bounce {
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
                animation: bruno-office-spotify-bounce 2.2s ease infinite alternate;
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

    return `<span class="tpl-media-icon icon-${name}${active ? ' is-active' : ''}">${icons[name] || icons.pc}</span>`;
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
    const safeType = pathSets[type] ? type : 'main';
    return `<svg class="curtain-svg is-${safeType}" viewBox="0 0 48 48" aria-hidden="true">${pathSets[safeType]}</svg>`;
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

  static _metricPercent(value) {
    const match = String(value ?? '').match(/-?\d+(?:[.,]\d+)?/);
    if (!match) return 0;
    const number = Number(match[0].replace(',', '.'));
    if (!Number.isFinite(number)) return 0;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoOfficeSubview._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_OFFICE_SUBVIEW_TAG)) {
  customElements.define(BRUNO_OFFICE_SUBVIEW_TAG, BrunoOfficeSubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_OFFICE_SUBVIEW_TAG,
  name: 'Bruno Office Subview',
  preview: false,
  description: 'Office subview rebuilt as an isolated Bruno Liquid Glass Web Component.',
});
