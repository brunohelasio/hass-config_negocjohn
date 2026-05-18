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

class BrunoHeroCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_HERO_DEFAULT_ENTITIES,
      ...(config?.entities || {}),
    };

    this._config = {
      name: 'Bruno',
      background: '/local/images/home_color.jpg',
      fallback_background: '/local/images/home.jpg',
      ...config,
      entities,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
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
      'Ter\u00e7a-feira',
      'Quarta-feira',
      'Quinta-feira',
      'Sexta-feira',
      'S\u00e1bado',
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
    const temperature = this._roundedAttribute(weather, 'temperature', '--', '\u00b0C');
    const apparent = this._roundedAttribute(weather, 'apparent_temperature', '--\u00b0C', '\u00b0C');
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

  _weatherMetric(icon, tone, label, value) {
    return `
      <span class="weather-metric">
        <ha-icon icon="${icon}" style="color:${tone}"></ha-icon>
        <span class="metric-label">${BrunoHeroCard._escape(label)}</span>
        <span class="metric-value">${BrunoHeroCard._escape(value)}</span>
      </span>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const weather = this._weatherModel();
    const background = BrunoHeroCard._cssUrl(this._config.background);
    const fallbackBackground = BrunoHeroCard._cssUrl(this._config.fallback_background);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --hero-radius-left: 18px;
          --hero-radius-right: 18px;
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
          border-radius: var(--hero-radius-left) var(--hero-radius-right) var(--hero-radius-right) var(--hero-radius-left);
        }

        .hero-clip {
          position: absolute;
          inset: 0;
          z-index: 1;
          overflow: hidden;
          border-radius: inherit;
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          background:
            linear-gradient(90deg, rgba(6,14,24,0.88) 0%, rgba(7,15,26,0.70) 29%, rgba(7,15,26,0.28) 57%, rgba(7,15,26,0.06) 78%, rgba(7,15,26,0.00) 100%),
            radial-gradient(520px 220px at 18% 6%, rgba(145,185,245,0.22), transparent 62%),
            radial-gradient(520px 260px at 92% 52%, rgba(255,255,255,0.10), transparent 64%),
            url(${background}) center / cover no-repeat,
            url(${fallbackBackground}) center / cover no-repeat,
            linear-gradient(155deg, rgba(26,33,48,0.90), rgba(16,21,31,0.86));
          box-shadow:
            var(--bruno-liquid-surface-off-shadow,
              inset 0 1px 0 rgba(255,255,255,0.18),
              inset 1px 0 0 rgba(255,255,255,0.10),
              inset -1px -1px 0 rgba(255,255,255,0.026),
              0 18px 44px rgba(0,0,0,0.27),
              0 0 24px rgba(110,150,210,0.055)
            );
        }

        .hero-clip::before,
        .hero-clip::after {
          content: "";
          position: absolute;
          pointer-events: none;
        }

        .hero-clip::before {
          inset: 0;
          background:
            radial-gradient(580px 220px at 10% -8%, rgba(255,255,255,0.20), rgba(255,255,255,0.04) 48%, transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%),
            linear-gradient(0deg, rgba(0,0,0,0.34), rgba(0,0,0,0.00) 42%);
          opacity: 0.82;
        }

        .hero-clip::after {
          inset: 0;
          border-radius: inherit;
          box-shadow:
            inset 0 0 0 1px rgba(255,255,255,0.05),
            0 0 30px rgba(var(--hero-accent),0.08);
        }

        .lateral-veil {
          position: absolute;
          z-index: 0;
          top: 0;
          right: -32px;
          bottom: 0;
          width: 94px;
          pointer-events: none;
          border-radius: 0 20px 20px 0;
          background:
            linear-gradient(90deg, rgba(7,15,26,0.42), rgba(7,15,26,0.16) 42%, rgba(7,15,26,0.00) 100%),
            radial-gradient(110px 120px at 0% 18%, rgba(var(--hero-accent),0.12), transparent 74%);
          filter: blur(0.2px);
          opacity: 0.74;
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
            min-height: 300px;
          }

          .hero-stage {
            border-radius: 18px;
          }

          .lateral-veil {
            display: none;
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

        @media (prefers-reduced-motion: reduce) {
          .weather-dock {
            transition: none !important;
          }
        }
      </style>

      <section class="hero-stage" aria-label="Hero do dashboard">
        <div class="lateral-veil" aria-hidden="true"></div>
        <div class="hero-clip" aria-hidden="true"></div>

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
                <span class="weather-feels">Sensa\u00e7\u00e3o ${BrunoHeroCard._escape(weather.apparent)}</span>
              </span>
            </span>

            <span class="metric-group">
              ${this._weatherMetric('mdi:water-percent', '#60a5fa', 'Umid', weather.humidity)}
              ${this._weatherMetric('mdi:weather-windy', '#7dd3fc', 'Vento', weather.wind)}
            </span>

            <span class="metric-group sun">
              ${this._weatherMetric('mdi:weather-sunset-up', '#fb923c', 'Nascer', weather.rising)}
              ${this._weatherMetric('mdi:weather-sunset-down', '#f97316', 'P\u00f4r', weather.setting)}
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
  description: 'Isolated Bento Hero card with structural lateral blend and preserved weather popup.',
});
