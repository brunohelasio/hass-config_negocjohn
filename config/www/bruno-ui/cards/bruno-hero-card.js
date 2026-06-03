const BRUNO_HERO_CARD_TAG = 'bruno-hero-card';

const BRUNO_HERO_DEFAULT_ENTITIES = {
  time: 'sensor.time',
  weather: 'weather.forecast_casa',
  sun: 'sun.sun',
};

const BRUNO_HERO_WEATHER_ICONS = {
  sunny: { day: 'clear-day', night: 'clear-night' },
  'clear-night': { day: 'clear-night', night: 'clear-night' },
  partlycloudy: { day: 'partly-cloudy-day', night: 'partly-cloudy-night' },
  cloudy: { day: 'cloudy', night: 'cloudy' },
  rainy: { day: 'rain', night: 'rain' },
  pouring: { day: 'rain', night: 'rain' },
  lightning: { day: 'rain', night: 'rain' },
  'lightning-rainy': { day: 'rain', night: 'rain' },
  snowy: { day: 'snow', night: 'snow' },
  'snowy-rainy': { day: 'sleet', night: 'sleet' },
  fog: { day: 'fog', night: 'fog' },
  windy: { day: 'wind', night: 'wind' },
  'windy-variant': { day: 'wind', night: 'wind' },
};

const BRUNO_HERO_DEFAULT_CALENDARS = [
  { entity: 'calendar.brunohelasio_gmail_com', name: 'Bruno', color: '#7fdbe9' },
  { entity: 'calendar.familia', name: 'Familia', color: '#fdd835' },
  { entity: 'calendar.birthdays', name: 'Aniversarios', color: '#ff6c92' },
  { entity: 'calendar.feriados_no_brasil', name: 'Feriados', color: '#1DB954' },
];

const BRUNO_HERO_POPUP_CALENDARS = [
  'calendar.brunohelasio_gmail_com',
  'calendar.familia',
  'calendar.feriados_no_brasil',
];

const BRUNO_HERO_DEFAULT_CAMERAS = [
  { entity: 'camera.sl_camera_2', name: 'Sala', short_name: 'Sala' },
  { entity: 'camera.vr_camera_2', name: 'Varanda', short_name: 'Varanda' },
  { entity: 'camera.cz_camera_2', name: 'Cozinha', short_name: 'Cozinha' },
  { entity: 'camera.as_camera_2', name: 'Area de Servico', short_name: 'Area' },
];

const BRUNO_HERO_REFRESH_MS = 5 * 60 * 1000;
const BRUNO_HERO_CAMERA_UNAVAILABLE_STATES = ['unknown', 'unavailable', 'idle', 'off', 'none', ''];

class BrunoHeroCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_HERO_DEFAULT_ENTITIES,
      ...(config?.entities || {}),
    };
    const calendarConfig = config?.calendar || {};
    const camerasConfig = config?.cameras || {};

    this._config = {
      name: 'Bruno',
      background: '/local/images/home.jpg',
      fallback_background: '/local/images/home.jpg',
      ...config,
      calendar: {
        days_to_show: 3,
        compact_events_to_show: 1,
        refresh_interval: BRUNO_HERO_REFRESH_MS,
        calendars: BRUNO_HERO_DEFAULT_CALENDARS,
        popup_calendars: BRUNO_HERO_POPUP_CALENDARS,
        ...calendarConfig,
      },
      cameras: {
        active_entity: 'input_select.bento_active_camera',
        limit: 4,
        items: BRUNO_HERO_DEFAULT_CAMERAS,
        ...camerasConfig,
      },
      entities,
    };
    this._events = this._events || [];
    this._lastCameraImages = this._lastCameraImages || {};
    this._loadedCameraUrls = this._loadedCameraUrls || {};
    this._cameraBaseUrls = this._cameraBaseUrls || {};
    this._refreshSeed = this._refreshSeed || Date.now();
    this._render();
    this._scheduleRefresh(true);
  }

  set hass(hass) {
    const firstHass = !this._hass;
    this._hass = hass;
    this._render();
    this._scheduleRefresh(firstHass);
  }

  connectedCallback() {
    this._scheduleRefresh(true);
  }

  disconnectedCallback() {
    if (!this._refreshTimer) return;
    clearInterval(this._refreshTimer);
    this._refreshTimer = null;
  }

  getCardSize() {
    return 5;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isUnavailable(entity) {
    return !entity || ['unknown', 'unavailable', ''].includes(entity.state);
  }

  _scheduleRefresh(immediate = false) {
    if (!this._config || this._config.variant === 'mobile' || !this.isConnected) return;
    if (!this._refreshTimer) {
      const interval = Math.max(5000, Number(this._config.calendar?.refresh_interval) || BRUNO_HERO_REFRESH_MS);
      this._refreshTimer = setInterval(() => this._loadEvents(), interval);
    }
    if (immediate) this._loadEvents();
  }

  async _loadEvents() {
    if (!this._hass || this._loadingEvents) return;
    this._loadingEvents = true;

    const calendarConfig = this._config.calendar || {};
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const days = Math.max(1, Number(calendarConfig.days_to_show || 3));
    const end = new Date(start.getTime() + days * 24 * 60 * 60 * 1000);

    try {
      const calendars = Array.isArray(calendarConfig.calendars) && calendarConfig.calendars.length
        ? calendarConfig.calendars
        : BRUNO_HERO_DEFAULT_CALENDARS;
      const eventsByCalendar = await Promise.all(
        calendars.map((calendar) => this._fetchCalendarEvents(calendar, start, end)),
      );
      this._events = eventsByCalendar
        .flat()
        .filter((event) => event.startMs >= Date.now() - 60 * 60 * 1000 || event.allDay)
        .sort((a, b) => a.startMs - b.startMs);
      this._lastFetchAt = Date.now();
    } catch (error) {
      this._lastEventError = error;
    } finally {
      this._loadingEvents = false;
      this._render();
    }
  }

  async _fetchCalendarEvents(calendar, start, end) {
    const entityId = calendar?.entity;
    if (!entityId) return [];

    let response = null;
    if (this._hass?.callWS) {
      try {
        response = await this._hass.callWS({
          type: 'calendar/list_events',
          entity_id: entityId,
          start: start.toISOString(),
          end: end.toISOString(),
        });
      } catch (error) {
        response = null;
      }
    }

    if (!response && this._hass?.callApi) {
      const path = `calendars/${encodeURIComponent(entityId)}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
      response = await this._hass.callApi('GET', path);
    }

    const rows = Array.isArray(response?.events)
      ? response.events
      : Array.isArray(response)
        ? response
        : [];

    return rows
      .map((event) => this._normalizeEvent(event, calendar))
      .filter(Boolean);
  }

  _normalizeEvent(event, calendar) {
    const start = this._eventDate(event?.start);
    const end = this._eventDate(event?.end);
    if (!start) return null;

    return {
      calendar: calendar.entity,
      calendarName: calendar.name || calendar.entity,
      color: calendar.color || '#7fdbe9',
      summary: event?.summary || event?.message || event?.title || 'Evento',
      location: event?.location || '',
      start,
      end,
      startMs: start.getTime(),
      allDay: Boolean(event?.start?.date && !event?.start?.dateTime),
    };
  }

  _eventDate(value) {
    const raw = value?.dateTime || value?.date || value;
    if (!raw) return null;
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  _nextEventModel() {
    const event = Array.isArray(this._events) ? this._events[0] : null;
    if (!event) {
      return {
        empty: true,
        label: 'Próximo evento',
        summary: 'Nenhum compromisso hoje',
        time: this._loadingEvents ? 'Atualizando agenda' : 'Agenda livre',
        color: '#7fdbe9',
      };
    }

    return {
      empty: false,
      label: 'Próximo evento',
      summary: event.summary,
      time: this._eventTimeLabel(event),
      color: event.color || '#7fdbe9',
    };
  }

  _eventTimeLabel(event) {
    if (!event?.start) return event?.calendarName || 'Agenda';
    if (event.allDay) return event.calendarName || 'Dia todo';
    const now = new Date();
    const sameDay = event.start.toDateString() === now.toDateString();
    const time = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return `${time} · ${event.calendarName || 'Agenda'}`;
    const day = event.start.toLocaleDateString([], { day: '2-digit', month: 'short' });
    return `${day} · ${time}`;
  }

  _cameraState(camera) {
    const entity = this._state(camera.entity);
    const state = entity?.state || '';
    const unavailable = !entity || BRUNO_HERO_CAMERA_UNAVAILABLE_STATES.includes(String(state).toLowerCase());
    const liveImage = entity?.attributes?.entity_picture || '';
    if (liveImage) this._lastCameraImages[camera.entity] = liveImage;

    const image = liveImage
      || this._lastCameraImages[camera.entity]
      || (camera.entity ? `/api/camera_proxy/${camera.entity}` : '');

    if (this._cameraBaseUrls[camera.entity] !== image) {
      this._cameraBaseUrls[camera.entity] = image;
      delete this._loadedCameraUrls[camera.entity];
    }

    return {
      ...camera,
      online: !unavailable,
      status: unavailable ? 'Indisponivel' : 'Online',
      image,
      imageUrl: this._loadedCameraUrls[camera.entity] || BrunoHeroCard._withCacheBust(image, this._refreshSeed),
    };
  }

  _cameraModel() {
    const cameraConfig = this._config.cameras || {};
    const configuredItems = Array.isArray(cameraConfig.items) && cameraConfig.items.length
      ? cameraConfig.items
      : BRUNO_HERO_DEFAULT_CAMERAS;
    const limit = Math.max(1, Number(cameraConfig.limit) || 4);
    return configuredItems.slice(0, limit).map((camera) => this._cameraState(camera));
  }

  _updateCameraImages() {
    if (!this.shadowRoot) return;
    const stamp = Date.now();
    this.shadowRoot.querySelectorAll('img[data-camera-src-base]').forEach((image) => {
      const baseSrc = image.dataset.cameraSrcBase;
      if (!baseSrc) return;
      const nextSrc = BrunoHeroCard._withCacheBust(baseSrc, stamp);
      if (image.dataset.loadedSrc === nextSrc || image.src === nextSrc) return;

      const loader = new Image();
      loader.onload = () => {
        image.dataset.loadedSrc = nextSrc;
        image.src = nextSrc;
        image.classList.remove('is-hidden');
        image.closest('.camera-thumb')?.classList.remove('is-image-error');
      };
      loader.onerror = () => {
        image.classList.add('is-hidden');
        image.closest('.camera-thumb')?.classList.add('is-image-error');
      };
      loader.src = nextSrc;
    });
  }

  _clock() {
    const timeState = this._state(this._config.entities.time)?.state;
    if (/^\d{1,2}:\d{2}/.test(timeState || '')) {
      return timeState.slice(0, 5);
    }

    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  _dateLine() {
    const days = [
      'Domingo',
      'Segunda-feira',
      'Terça-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'Sábado',
    ];
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    return `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]}`;
  }

  _greeting() {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    return `${greeting}, ${this._config.name}`;
  }

  _weatherIcon(state, isDay) {
    const mapped = BRUNO_HERO_WEATHER_ICONS[state] || BRUNO_HERO_WEATHER_ICONS.cloudy;
    return `/local/svg/weather/${isDay ? mapped.day : mapped.night}.svg`;
  }

  _formatSunTime(iso) {
    if (!iso) return '--:--';
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '--:--';
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  _roundedAttribute(entity, attribute, fallback, suffix = '') {
    const value = entity?.attributes?.[attribute];
    const numeric = Number.parseFloat(value);
    if (!Number.isFinite(numeric)) return fallback;
    return `${Math.round(numeric)}${suffix}`;
  }

  _weatherModel() {
    const weather = this._state(this._config.entities.weather);
    const sun = this._state(this._config.entities.sun);
    const isDay = sun?.state === 'above_horizon';
    const state = weather?.state || 'cloudy';
    const temperature = this._roundedAttribute(weather, 'temperature', '--', '°C');
    const apparent = this._roundedAttribute(weather, 'apparent_temperature', '--°C', '°C');
    const humidity = this._roundedAttribute(weather, 'humidity', '--%', '%');
    const wind = this._roundedAttribute(weather, 'wind_speed', '-- km/h', ' km/h');

    return {
      state,
      available: !this._isUnavailable(weather),
      icon: this._weatherIcon(state, isDay),
      temperature,
      apparent,
      humidity,
      wind,
      rising: this._formatSunTime(sun?.attributes?.next_rising),
      setting: this._formatSunTime(sun?.attributes?.next_setting),
    };
  }

  _fireDomEvent(action) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: action,
      bubbles: true,
      composed: true,
    }));
  }

  _openWeatherPopup() {
    this._fireDomEvent({
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Weather',
          style: '--max-popup-column: 2;',
          card_mod: {
            style: {
              'ha-dialog$': `
                .mdc-dialog__container {
                  align-items: center !important;
                  justify-content: center !important;
                }
              `,
            },
          },
          content: {
            type: 'custom:mod-card',
            card_mod: {
              style: {
                'layout-card$': {
                  'grid-layout$': {
                    '.': `
                      #root > * {
                        margin: 0px !important;
                      }
                      @media (max-width: 800px) {
                        #root {
                          display: block !important;
                        }
                      }
                    `,
                    'hui-entities-card$': {
                      '.': `
                        ha-card {
                          border-right: 0.1vw solid rgba(58, 69, 73, 0.2);
                          border-radius: 0;
                          transition: none;
                          margin-bottom: 0 !important;
                        }
                        ha-card.header .card-header {
                          letter-spacing: 0.005em;
                          font-size: 1.6em;
                          line-height: initial;
                        }
                        @media screen and (max-width: 800px) {
                          ha-card {
                            border-right: none;
                            border-bottom: 0.1vw solid rgba(58, 69, 73, 0.2);
                          }
                        }
                      `,
                      'hui-horizontal-stack-card': {
                        $: `
                          #root {
                            justify-content: space-evenly;
                            margin-block: 1em;
                            height: unset !important;
                          }
                        `,
                      },
                    },
                    'hui-entities-card:last-child': {
                      $: `
                        ha-card {
                          border: none;
                        }
                      `,
                    },
                  },
                },
              },
            },
            card: {
              type: 'custom:layout-card',
              layout_type: 'custom:grid-layout',
              layout: {
                'grid-template-columns': '1fr',
                'grid-template-rows': 'auto',
                margin: 0,
                padding: 0,
                mediaquery: {
                  '(min-width: 1441.99px)': {
                    'grid-template-columns': 'repeat(var(--max-popup-column), var(--max-popup-column-width, 550px))',
                    'grid-template-rows': 'auto',
                  },
                  '(min-width: 800px)': {
                    'grid-template-columns': '550px',
                    'grid-template-rows': 'auto',
                    margin: 0,
                    padding: 0,
                  },
                },
              },
              cards: [
                {
                  type: 'entities',
                  title: 'Salvador',
                  entities: [
                    {
                      type: 'custom:layout-card',
                      layout_type: 'custom:vertical-layout',
                      cards: [
                        {
                          type: 'weather-forecast',
                          show_current: true,
                          show_forecast: true,
                          entity: this._config.entities.weather,
                          name: ' ',
                          forecast_type: 'hourly',
                        },
                      ],
                    },
                    { type: 'divider' },
                    {
                      type: 'custom:weather-chart-card',
                      entity: this._config.entities.weather,
                      show_main: false,
                      show_attributes: false,
                      forecast: {
                        condition_icons: false,
                        show_wind_forecast: false,
                      },
                    },
                  ],
                },
                {
                  type: 'entities',
                  title: 'Radar',
                  card_mod: { class: 'header nopadding' },
                  entities: [
                    {
                      type: 'custom:weather-radar-card',
                      static_map: false,
                      map_style: 'Dark',
                      data_source: 'RainViewer-DarkSky',
                      show_scale: false,
                      show_range: false,
                      extra_labels: false,
                      center_longitude: -38.5108,
                      show_marker: false,
                      show_zoom: false,
                      center_latitude: -12.9714,
                      marker_latitude: -12.9714,
                      marker_longitude: -38.5108,
                      zoom_level: 5,
                      square_map: false,
                      show_recenter: true,
                      show_playback: false,
                    },
                  ],
                },
              ],
            },
          },
        },
      },
    });
  }

  _openAgendaPopup() {
    const calendarConfig = this._config.calendar || {};
    const calendars = Array.isArray(calendarConfig.popup_calendars) && calendarConfig.popup_calendars.length
      ? calendarConfig.popup_calendars
      : BRUNO_HERO_POPUP_CALENDARS;

    this._fireDomEvent({
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Agenda',
          size: 'wide',
          content: {
            type: 'calendar',
            entities: calendars,
          },
        },
      },
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

  _selectCamera(entityId) {
    if (!entityId) return;
    const activeEntity = this._config.cameras?.active_entity;
    if (activeEntity && this._hass?.callService) {
      this._hass.callService('input_select', 'select_option', {
        entity_id: activeEntity,
        option: entityId,
      });
    }
    this._openMoreInfo(entityId);
  }

  _weatherLabel(state) {
    const labels = {
      sunny: 'Ensolarado',
      'clear-night': 'Céu limpo',
      partlycloudy: 'Parcialmente nublado',
      cloudy: 'Nublado',
      rainy: 'Chuva',
      pouring: 'Chuva forte',
      lightning: 'Raios',
      'lightning-rainy': 'Temporal',
      snowy: 'Neve',
      'snowy-rainy': 'Chuva e neve',
      fog: 'Nevoeiro',
      windy: 'Vento',
      'windy-variant': 'Ventando',
    };
    return labels[state] || String(state || 'Clima').replace(/_/g, ' ');
  }

  _weatherMetric(icon, tone, label, value) {
    return `
      <span class="weather-metric">
        <ha-icon icon="${icon}" style="color:${tone}"></ha-icon>
        <span class="metric-label">${BrunoHeroCard._escape(label)}</span>
        <span class="metric-value">${BrunoHeroCard._escape(value)}</span>
      </span>
    `;
  }

  _renderDesktop() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const weather = this._weatherModel();
    const event = this._nextEventModel();
    const cameras = this._cameraModel();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --hero-text: rgba(248,251,255,0.96);
          --hero-muted: rgba(248,251,255,0.56);
          --hero-soft: rgba(248,251,255,0.74);
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 0;
          overflow: visible;
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

        .hero-stage {
          width: 100%;
          height: 100%;
          min-height: 0;
          color: var(--hero-text);
          position: relative;
          isolation: isolate;
        }

        .content {
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          padding: 20px 20px 18px;
          overflow: hidden;
        }

        .headline {
          min-width: 0;
          padding-top: 1px;
        }

        .date-line {
          margin: 0 0 12px;
          color: var(--hero-muted);
          font-size: 10px;
          line-height: 1;
          font-weight: 820;
          text-transform: uppercase;
        }

        .greeting {
          margin: 0;
          max-width: 460px;
          color: var(--hero-text);
          font-size: 25px;
          line-height: 1.08;
          font-weight: 790;
          text-shadow: 0 2px 20px rgba(0,0,0,0.28);
        }

        .clock {
          margin-top: 14px;
          color: rgba(255,255,255,0.96);
          font-size: clamp(66px, 8.6vh, 88px);
          line-height: 0.88;
          font-weight: 250;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 12px 34px rgba(0,0,0,0.34);
        }

        .inline-weather {
          appearance: none;
          -webkit-appearance: none;
          width: fit-content;
          max-width: 100%;
          min-height: 30px;
          margin-top: 15px;
          padding: 0 12px 0 9px;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.105), rgba(255,255,255,0.040)),
            rgba(8,12,18,0.22);
          backdrop-filter: blur(18px) saturate(1.32);
          -webkit-backdrop-filter: blur(18px) saturate(1.32);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.13),
            0 10px 24px rgba(0,0,0,0.18);
          transition: filter 160ms ease, transform 160ms ease, border-color 160ms ease;
        }

        .inline-weather:hover {
          filter: brightness(1.07);
          border-color: rgba(255,255,255,0.18);
        }

        .inline-weather:active {
          transform: translateY(1px) scale(0.996);
        }

        .inline-weather img {
          width: 19px;
          height: 19px;
          flex: 0 0 19px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.24));
        }

        .inline-weather strong {
          color: rgba(255,255,255,0.95);
          font-size: 14px;
          line-height: 1;
          font-weight: 820;
          white-space: nowrap;
        }

        .inline-weather small {
          min-width: 0;
          color: rgba(255,255,255,0.66);
          font-size: 11px;
          line-height: 1;
          font-weight: 620;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hero-bottom {
          display: flex;
          flex-direction: column;
          gap: 12px;
          min-height: 0;
        }

        .event-line {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          min-width: 0;
          padding: 0 2px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          text-align: left;
          border: 0;
          background: transparent;
          text-shadow: 0 3px 14px rgba(0,0,0,0.32);
        }

        .event-line span {
          color: rgba(255,255,255,0.54);
          font-size: 11px;
          line-height: 1;
          font-weight: 720;
        }

        .event-line strong {
          max-width: 100%;
          color: rgba(255,255,255,0.93);
          font-size: 14px;
          line-height: 1.12;
          font-weight: 820;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-line small {
          color: rgba(255,255,255,0.60);
          font-size: 10px;
          line-height: 1;
          font-weight: 620;
        }

        .camera-strip {
          height: 88px;
          min-height: 88px;
          padding: 7px;
          display: grid;
          grid-template-columns: repeat(${Math.max(1, cameras.length)}, minmax(0, 1fr));
          gap: 7px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.15);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.115), rgba(255,255,255,0.046)),
            rgba(9,13,20,0.24);
          backdrop-filter: blur(26px) saturate(1.48);
          -webkit-backdrop-filter: blur(26px) saturate(1.48);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.14),
            0 20px 54px rgba(0,0,0,0.25);
        }

        .camera-thumb {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          min-width: 0;
          height: 100%;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.11);
          background: rgba(4,8,14,0.32);
          padding: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.09);
          transition: transform 160ms ease, border-color 160ms ease, filter 160ms ease;
        }

        .camera-thumb:hover {
          filter: brightness(1.07);
          border-color: rgba(255,255,255,0.20);
        }

        .camera-thumb:active {
          transform: translateY(1px) scale(0.986);
        }

        .camera-thumb img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          opacity: 0.82;
          filter: saturate(0.94) contrast(1.05);
        }

        .camera-thumb img.is-hidden,
        .camera-thumb.is-image-error img {
          display: none;
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,0.38);
          background:
            radial-gradient(circle at 50% 20%, rgba(255,255,255,0.12), transparent 54%),
            rgba(4,8,14,0.34);
        }

        .camera-placeholder ha-icon {
          --mdc-icon-size: 22px;
        }

        .camera-thumb:not(.is-image-error) img + .camera-placeholder {
          opacity: 0;
        }

        .camera-thumb::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, transparent 34%, rgba(0,0,0,0.70) 100%);
        }

        .camera-label {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 7px;
          z-index: 2;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .camera-dot {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.38);
        }

        .camera-dot.is-online {
          background: rgb(46,232,109);
          box-shadow: 0 0 10px rgba(46,232,109,0.70);
        }

        .camera-label strong {
          min-width: 0;
          color: rgba(255,255,255,0.95);
          font-size: 10px;
          line-height: 1;
          font-weight: 820;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 2px 8px rgba(0,0,0,0.55);
        }

        @media (max-height: 760px) {
          .content {
            padding: 17px 18px 15px;
          }

          .clock {
            font-size: clamp(58px, 8vh, 78px);
          }

          .camera-strip {
            height: 80px;
            min-height: 80px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .inline-weather,
          .camera-thumb {
            transition: none !important;
          }
        }
      </style>

      <section class="hero-stage" aria-label="Hero do dashboard">
        <div class="content">
          <div class="headline">
            <p class="date-line">${BrunoHeroCard._escape(this._dateLine())}</p>
            <h2 class="greeting">${BrunoHeroCard._escape(this._greeting())}</h2>
            <div class="clock">${BrunoHeroCard._escape(this._clock())}</div>
            <button class="inline-weather" type="button" aria-label="Abrir clima">
              <img src="${BrunoHeroCard._escape(weather.icon)}" alt="${BrunoHeroCard._escape(this._weatherLabel(weather.state))}">
              <strong>${BrunoHeroCard._escape(weather.temperature)}</strong>
              <small>${BrunoHeroCard._escape(this._weatherLabel(weather.state))}</small>
            </button>
          </div>

          <div class="hero-bottom">
            <button class="event-line" type="button" aria-label="Abrir agenda" style="--event-color:${BrunoHeroCard._escapeAttr(event.color)}">
              <span>${BrunoHeroCard._escape(event.label)}</span>
              <strong>${BrunoHeroCard._escape(event.summary)}</strong>
              <small>${BrunoHeroCard._escape(event.time)}</small>
            </button>

            <div class="camera-strip" aria-label="Mini cameras">
              ${cameras.map((camera) => BrunoHeroCard._miniCamera(camera)).join('')}
            </div>
          </div>
        </div>
      </section>
    `;

    this.shadowRoot.querySelector('.inline-weather')?.addEventListener('click', (eventClick) => {
      eventClick.preventDefault();
      eventClick.stopPropagation();
      this._openWeatherPopup();
    });

    this.shadowRoot.querySelector('.event-line')?.addEventListener('click', (eventClick) => {
      eventClick.preventDefault();
      eventClick.stopPropagation();
      this._openAgendaPopup();
    });

    this.shadowRoot.querySelectorAll('.camera-thumb').forEach((button) => {
      button.addEventListener('click', (eventClick) => {
        eventClick.preventDefault();
        eventClick.stopPropagation();
        this._selectCamera(button.dataset.cameraId);
      });
    });

    this._updateCameraImages();
  }

  _render() {
    if (!this._config) return;
    if (this._config.variant !== 'mobile') {
      this._renderDesktop();
      return;
    }
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const weather = this._weatherModel();
    const background = BrunoHeroCard._cssUrl(this._config.background);
    const fallbackBackground = BrunoHeroCard._cssUrl(this._config.fallback_background);
    const mobileClass = this._config.variant === 'mobile' ? ' is-mobile' : '';
    const mobileHostMinHeight = this._config.variant === 'mobile' ? '0' : '300px';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --hero-radius-left: var(--bruno-liquid-card-radius, 22px);
          --hero-radius-right: var(--bruno-liquid-card-radius, 22px);
          --hero-accent: 150, 190, 255;
          --hero-text: rgba(248,251,255,0.96);
          --hero-muted: rgba(248,251,255,0.54);
          --hero-soft: rgba(248,251,255,0.72);
          display: block;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 0;
          overflow: visible;
          position: relative;
          z-index: 0;
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

        .hero-stage {
          width: 100%;
          height: 100%;
          min-height: 0;
          position: relative;
          isolation: isolate;
          overflow: visible;
          color: var(--hero-text);
          border-radius: 0;
          z-index: 0;
        }

        /*
         * FALLBACK RÁPIDO:
         * A implementação anterior usava .hero-clip com:
         * - border
         * - box-shadow
         * - background glass
         * - leitura de card fechado
         *
         * Se precisar restaurar rapidamente o visual anterior,
         * reintroduzir a camada .hero-clip e remover .hero-bg expandida.
         */

        .hero-bg {
          position: absolute;
          pointer-events: none;
          z-index: 0;
          top: -18px;
          bottom: -20px;
          left: -16px;
          right: -112px;
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
            url(${background}) left center / auto 100% no-repeat,
            url(${fallbackBackground}) left center / auto 100% no-repeat;
          opacity: 1;
          filter: saturate(1.01) brightness(0.90);
          mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.84) 4%,
              rgba(0,0,0,1) 10%,
              rgba(0,0,0,1) 78%,
              rgba(0,0,0,0.84) 88%,
              rgba(0,0,0,0.46) 94%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.84) 6%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 80%,
              rgba(0,0,0,0.82) 89%,
              rgba(0,0,0,0.42) 95%,
              transparent 100%
            );
          -webkit-mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.84) 4%,
              rgba(0,0,0,1) 10%,
              rgba(0,0,0,1) 78%,
              rgba(0,0,0,0.84) 88%,
              rgba(0,0,0,0.46) 94%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.84) 6%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 80%,
              rgba(0,0,0,0.82) 89%,
              rgba(0,0,0,0.42) 95%,
              transparent 100%
            );
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

        .content {
          position: relative;
          z-index: 2;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px 20px 18px;
          overflow: hidden;
        }

        .headline {
          min-width: 0;
        }

        .date-line {
          margin: 0 0 11px;
          color: var(--hero-muted);
          font-size: 11px;
          line-height: 1;
          font-weight: 700;
          text-transform: uppercase;
        }

        .greeting {
          margin: 0;
          max-width: 560px;
          color: var(--hero-text);
          font-size: 23px;
          line-height: 1.15;
          font-weight: 760;
          text-shadow: 0 2px 18px rgba(0,0,0,0.26);
        }

        .clock {
          margin-top: 14px;
          color: rgba(255,255,255,0.95);
          font-size: clamp(56px, 7.4vh, 78px);
          line-height: 0.96;
          font-weight: 220;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 10px 32px rgba(0,0,0,0.28);
        }

        .weather-dock {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          min-height: 88px;
          display: grid;
          grid-template-columns: minmax(190px, 1.05fr) minmax(130px, 0.9fr) minmax(138px, 0.92fr);
          align-items: center;
          gap: 18px;
          padding: 0;
          margin: 0;
          text-align: left;
          background: transparent;
          border: 0;
          outline: none;
          position: relative;
          transition: filter 180ms ease, transform 180ms ease;
          z-index: 2;
        }

        .weather-dock::before {
          display: none;
        }

        .weather-dock:hover {
          filter: brightness(1.06);
        }

        .weather-dock:active {
          transform: translateY(1px) scale(0.995);
        }

        .weather-primary {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .weather-primary img {
          width: 64px;
          height: 64px;
          flex: 0 0 64px;
          display: block;
          filter: drop-shadow(0 12px 18px rgba(0,0,0,0.30));
        }

        .weather-temp {
          display: block;
          color: var(--hero-text);
          font-size: 30px;
          line-height: 1;
          font-weight: 320;
          white-space: nowrap;
        }

        .weather-feels {
          display: block;
          margin-top: 6px;
          color: var(--hero-muted);
          font-size: 11px;
          line-height: 1.1;
          font-weight: 520;
          white-space: nowrap;
        }

        .metric-group {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          min-width: 0;
        }

        .metric-group.sun {
          padding-left: 16px;
          border-left: 1px solid rgba(255,255,255,0.11);
        }

        .weather-metric {
          min-width: 0;
          display: grid;
          grid-template-columns: 20px minmax(42px, auto) 1fr;
          align-items: center;
          column-gap: 8px;
        }

        .weather-metric ha-icon {
          --mdc-icon-size: 16px;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .metric-label {
          color: rgba(255,255,255,0.62);
          font-size: 10px;
          line-height: 1;
          font-weight: 720;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .metric-value {
          justify-self: end;
          color: rgba(255,255,255,0.88);
          font-size: 11px;
          line-height: 1;
          font-weight: 650;
          white-space: nowrap;
        }

        @media (max-width: 1100px) {
          .content {
            padding: 16px 18px 16px;
          }

          .hero-bg {
            right: -82px;
            top: -14px;
            bottom: -18px;
          }

          .weather-dock {
            grid-template-columns: minmax(180px, 1fr) minmax(120px, 0.86fr) minmax(122px, 0.86fr);
            gap: 13px;
          }

          .weather-primary img {
            width: 56px;
            height: 56px;
            flex-basis: 56px;
          }
        }

        @media (max-width: 800px) {
          :host {
            min-height: ${mobileHostMinHeight};
            overflow: hidden;
          }

          .hero-stage {
            overflow: hidden;
          }

          .hero-bg {
            top: -10px;
            bottom: -12px;
            left: -10px;
            right: -16px;
            background:
              linear-gradient(90deg,
                rgba(4,10,18,0.84) 0%,
                rgba(5,10,18,0.66) 18%,
                rgba(6,12,20,0.34) 36%,
                rgba(6,12,20,0.14) 54%,
                rgba(6,12,20,0.22) 70%,
                rgba(6,12,20,0.52) 86%,
                rgba(6,12,20,0.82) 100%
              ),
              linear-gradient(180deg,
                rgba(4,8,14,0.76) 0%,
                rgba(4,8,14,0.38) 14%,
                rgba(4,8,14,0.10) 28%,
                rgba(4,8,14,0.00) 42%,
                rgba(4,8,14,0.00) 60%,
                rgba(4,8,14,0.14) 76%,
                rgba(4,8,14,0.42) 90%,
                rgba(4,8,14,0.76) 100%
              ),
              url(${background}) left center / auto 100% no-repeat,
              url(${fallbackBackground}) left center / auto 100% no-repeat;
          }

          .content {
            padding: 16px;
          }

          .greeting {
            font-size: 21px;
          }

          .clock {
            font-size: 60px;
          }

          .weather-dock {
            grid-template-columns: 1fr;
            gap: 12px;
            min-height: 0;
            padding-top: 14px;
          }

          .metric-group.sun {
            padding-left: 0;
            border-left: 0;
          }
        }

        .hero-stage.is-mobile .content {
          padding: 14px 16px 14px;
        }

        .hero-stage.is-mobile .date-line {
          margin-bottom: 9px;
          font-size: 10px;
        }

        .hero-stage.is-mobile .greeting {
          font-size: 20px;
          max-width: 300px;
        }

        .hero-stage.is-mobile .clock {
          margin-top: 10px;
          font-size: 58px;
        }

        .hero-stage.is-mobile .weather-dock {
          grid-template-columns: minmax(154px, 1fr) minmax(102px, 0.76fr) minmax(102px, 0.76fr);
          gap: 10px;
          min-height: 62px;
        }

        .hero-stage.is-mobile .weather-primary {
          gap: 10px;
        }

        .hero-stage.is-mobile .weather-primary img {
          width: 50px;
          height: 50px;
          flex-basis: 50px;
        }

        .hero-stage.is-mobile .weather-temp {
          font-size: 26px;
        }

        .hero-stage.is-mobile .metric-group {
          gap: 7px;
        }

        .hero-stage.is-mobile .metric-group.sun {
          padding-left: 10px;
        }

        .hero-stage.is-mobile .metric-label {
          font-size: 9px;
        }

        .hero-stage.is-mobile .metric-value {
          font-size: 10px;
        }

        @media (max-width: 430px) {
          .hero-stage.is-mobile .weather-dock {
            grid-template-columns: minmax(150px, 1fr) minmax(92px, 0.7fr);
          }

          .hero-stage.is-mobile .metric-group.sun {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .weather-dock {
            transition: none !important;
          }
        }
      </style>

      <section class="hero-stage${mobileClass}" aria-label="Hero do dashboard">
        <div class="hero-bg" aria-hidden="true"></div>

        <div class="content">
          <div class="headline">
            <p class="date-line">${BrunoHeroCard._escape(this._dateLine())}</p>
            <h2 class="greeting">${BrunoHeroCard._escape(this._greeting())}</h2>
            <div class="clock">${BrunoHeroCard._escape(this._clock())}</div>
          </div>

          <button class="weather-dock" type="button" aria-label="Abrir clima">
            <span class="weather-primary">
              <img src="${BrunoHeroCard._escape(weather.icon)}" alt="${BrunoHeroCard._escape(weather.state)}">
              <span>
                <span class="weather-temp">${BrunoHeroCard._escape(weather.temperature)}</span>
                <span class="weather-feels">Sensação ${BrunoHeroCard._escape(weather.apparent)}</span>
              </span>
            </span>

            <span class="metric-group">
              ${this._weatherMetric('mdi:water-percent', '#60a5fa', 'Umid', weather.humidity)}
              ${this._weatherMetric('mdi:weather-windy', '#7dd3fc', 'Vento', weather.wind)}
            </span>

            <span class="metric-group sun">
              ${this._weatherMetric('mdi:weather-sunset-up', '#fb923c', 'Nascer', weather.rising)}
              ${this._weatherMetric('mdi:weather-sunset-down', '#f97316', 'Pôr', weather.setting)}
            </span>
          </button>
        </div>
      </section>
    `;

    this.shadowRoot
      .querySelector('.weather-dock')
      ?.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openWeatherPopup();
      });
  }

  static _cssUrl(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\)/g, '\\)');
  }

  static _withCacheBust(url, seed) {
    if (!url) return '';
    const separator = String(url).includes('?') ? '&' : '?';
    return `${url}${separator}v=${seed || Date.now()}`;
  }

  static _miniCamera(camera) {
    const hasImage = Boolean(camera?.imageUrl || camera?.image);
    const onlineClass = camera?.online ? ' is-online' : '';
    const errorClass = hasImage ? '' : ' is-image-error';
    return `
      <button class="camera-thumb${errorClass}" type="button" data-camera-id="${BrunoHeroCard._escapeAttr(camera?.entity || '')}" aria-label="${BrunoHeroCard._escapeAttr(camera?.name || 'Camera')}">
        ${hasImage ? `<img src="${BrunoHeroCard._escapeAttr(camera.imageUrl || camera.image)}" data-camera-src-base="${BrunoHeroCard._escapeAttr(camera.image || camera.imageUrl)}" data-camera-entity="${BrunoHeroCard._escapeAttr(camera.entity || '')}" alt="">` : ''}
        <span class="camera-placeholder" aria-hidden="true"><ha-icon icon="mdi:video-outline"></ha-icon></span>
        <span class="camera-label">
          <span class="camera-dot${onlineClass}" aria-hidden="true"></span>
          <strong>${BrunoHeroCard._escape(camera?.short_name || camera?.name || 'Camera')}</strong>
        </span>
      </button>
    `;
  }

  static _escapeAttr(value) {
    return BrunoHeroCard._escape(value).replace(/'/g, '&#39;');
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

if (!customElements.get(BRUNO_HERO_CARD_TAG)) {
  customElements.define(BRUNO_HERO_CARD_TAG, BrunoHeroCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_HERO_CARD_TAG,
  name: 'Bruno Hero Card',
  preview: false,
  description: 'Atmospheric Bento Hero with blended background layer and preserved weather popup.',
});
