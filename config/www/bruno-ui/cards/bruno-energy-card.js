const BRUNO_ENERGY_CARD_TAG = 'bruno-energy-card';

const BRUNO_ENERGY_DEFAULT_ENTITIES = {
  period: 'input_select.periodo_energia_dashboard',
  total: 'sensor.energia_total_casa_periodo_atual',
  daily: 'sensor.potencia_total_casa',
  weekly: 'sensor.energia_total_casa_semanal',
  monthly: 'sensor.energia_total_casa_mensal',
};

const BRUNO_ENERGY_PERIODS = [
  {
    option: 'Di\u00e1rio',
    button: 'Dia',
    label: 'Di\u00e1rio',
    entityKey: 'daily',
    unit: 'W',
    hours: 24,
    lowerBound: -150,
    aggregate: 'raw',
  },
  {
    option: 'Semanal',
    button: 'Semana',
    label: 'Semanal',
    entityKey: 'weekly',
    unit: 'kWh',
    hours: 168,
    lowerBound: -0.05,
    aggregate: 'day-max',
  },
  {
    option: 'Mensal',
    button: 'M\u00eas',
    label: 'Mensal',
    entityKey: 'monthly',
    unit: 'kWh',
    hours: 720,
    lowerBound: -0.05,
    aggregate: 'day-max',
  },
];

const BRUNO_ENERGY_INVALID_STATES = ['unknown', 'unavailable', 'none', ''];
const BRUNO_ENERGY_HISTORY_TTL = 60 * 1000;

class BrunoEnergyCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_ENERGY_DEFAULT_ENTITIES,
      ...(config?.entities || {}),
    };

    this._config = {
      name: 'Energia',
      ...config,
      entities,
    };
    this._historyCache = this._historyCache || {};
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 3;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isInvalid(value) {
    return value == null || BRUNO_ENERGY_INVALID_STATES.includes(String(value).toLowerCase());
  }

  _activePeriod() {
    const state = this._state(this._config.entities.period)?.state;
    return BRUNO_ENERGY_PERIODS.find((item) => item.option === state)
      || BRUNO_ENERGY_PERIODS[0];
  }

  _model() {
    const period = this._activePeriod();
    const totalState = this._state(this._config.entities.total)?.state;
    const total = this._isInvalid(totalState) ? 0 : Number(totalState);
    const graphEntity = this._config.entities[period.entityKey];
    const graphState = this._state(graphEntity)?.state;
    const graphCurrent = this._isInvalid(graphState) ? null : Number(graphState);
    const cacheKey = this._historyKey(period, graphEntity);
    const cached = this._historyCache?.[cacheKey]?.points || [];

    return {
      period,
      graphEntity,
      cacheKey,
      total: Number.isFinite(total) ? total : 0,
      graphCurrent: Number.isFinite(graphCurrent) ? graphCurrent : null,
      points: cached,
    };
  }

  _historyKey(period, entityId) {
    return `${period.option}:${entityId || ''}`;
  }

  _selectPeriod(option) {
    if (!this._hass || !option) return;
    this._hass.callService('input_select', 'select_option', {
      entity_id: this._config.entities.period,
      option,
    });
  }

  _wireActions() {
    this.shadowRoot.querySelectorAll('[data-energy-option]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._selectPeriod(button.dataset.energyOption);
      });
    });
  }

  _ensureHistory(model) {
    if (!this._hass || !model.graphEntity) return;

    const cached = this._historyCache?.[model.cacheKey];
    const now = Date.now();
    if (cached?.loading || (cached?.fetchedAt && now - cached.fetchedAt < BRUNO_ENERGY_HISTORY_TTL)) return;

    this._historyCache[model.cacheKey] = {
      ...(cached || {}),
      loading: true,
    };

    this._fetchHistory(model.period, model.graphEntity)
      .then((points) => {
        this._historyCache[model.cacheKey] = {
          fetchedAt: Date.now(),
          loading: false,
          points,
        };
        this._render();
      })
      .catch(() => {
        this._historyCache[model.cacheKey] = {
          fetchedAt: Date.now(),
          loading: false,
          points: cached?.points || [],
        };
        this._render();
      });
  }

  async _fetchHistory(period, entityId) {
    if (!this._hass?.callApi || !entityId) return [];

    const end = new Date();
    const start = new Date(end.getTime() - period.hours * 60 * 60 * 1000);
    const params = [
      `filter_entity_id=${encodeURIComponent(entityId)}`,
      `end_time=${encodeURIComponent(end.toISOString())}`,
      'minimal_response',
      'no_attributes',
    ];
    const path = `history/period/${encodeURIComponent(start.toISOString())}?${params.join('&')}`;

    const response = await this._hass.callApi('GET', path);
    return this._normalizeHistory(response, period);
  }

  _normalizeHistory(response, period) {
    const rows = Array.isArray(response?.[0])
      ? response[0]
      : Array.isArray(response)
        ? response
        : [];

    const points = rows
      .map((row) => {
        const value = Number(row?.state ?? row?.s ?? row?.[1]);
        const dateRaw = row?.last_changed ?? row?.last_updated ?? row?.lu ?? row?.[0];
        const date = this._dateFromHistory(dateRaw);
        if (!Number.isFinite(value) || !date) return null;
        return { value, time: date.getTime() };
      })
      .filter(Boolean);

    if (period.aggregate !== 'day-max') return this._downsample(points, 96);

    const buckets = new Map();
    points.forEach((point) => {
      const date = new Date(point.time);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const previous = buckets.get(key);
      if (!previous || point.value > previous.value) buckets.set(key, point);
    });

    return Array.from(buckets.values()).sort((a, b) => a.time - b.time);
  }

  _dateFromHistory(value) {
    if (value == null) return null;
    if (typeof value === 'number') {
      const timestamp = value > 100000000000 ? value : value * 1000;
      const date = new Date(timestamp);
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  _downsample(points, maxPoints) {
    if (points.length <= maxPoints) return points;
    const stride = Math.ceil(points.length / maxPoints);
    return points.filter((_, index) => index % stride === 0);
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    this._ensureHistory(model);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: 18px;
          --accent: 96, 165, 250;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.62);
          --text-muted: rgba(226,232,240,0.42);
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

        .energy-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 6px;
          padding: 13px 14px 10px;
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

        .energy-card::before {
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

        .header,
        .chart {
          position: relative;
          z-index: 1;
        }

        .header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto;
          gap: 5px 10px;
          align-items: start;
        }

        .header-copy {
          grid-column: 1;
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
          gap: 3px;
        }

        .title-main {
          font-size: 12px;
          line-height: 1;
          font-weight: 780;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
        }

        .value {
          min-width: 0;
          font-size: 17px;
          line-height: 1.08;
          font-weight: 760;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .selector {
          grid-column: 2;
          grid-row: 1;
          align-self: start;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          height: 30px;
          padding: 3px;
          border-radius: 999px;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(14px) saturate(1.15);
          -webkit-backdrop-filter: blur(14px) saturate(1.15);
        }

        .segment {
          appearance: none;
          -webkit-appearance: none;
          height: 24px;
          min-width: 42px;
          padding: 0 9px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255,255,255,0.78);
          font-size: 10px;
          line-height: 24px;
          font-weight: 740;
          outline: none;
          transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
        }

        .segment.is-active {
          color: rgba(0,0,0,0.84);
          background: rgba(255,255,255,0.92);
          box-shadow:
            0 2px 9px rgba(0,0,0,0.22),
            inset 0 1px 0 rgba(255,255,255,0.55);
        }

        .chart {
          min-height: 0;
          align-self: stretch;
          display: flex;
          align-items: stretch;
          margin: -7px -15px -9px -15px;
        }

        .chart svg {
          width: 100%;
          height: 100%;
          min-height: 86px;
          display: block;
          overflow: visible;
        }

        .axis-label {
          font-size: 10px;
          font-weight: 680;
          fill: rgba(226,232,240,0.46);
        }

        @media (prefers-reduced-motion: reduce) {
          .segment {
            transition: none !important;
          }
        }
      </style>

      <div class="energy-card">
        <div class="header">
          <div class="header-copy">
            <span class="header-icon" aria-hidden="true"><ha-icon icon="mdi:lightning-bolt"></ha-icon></span>
            <span class="title">
              <span class="title-main">${BrunoEnergyCard._escape(this._config.name)}</span>
              <span class="value">${BrunoEnergyCard._escape(model.period.label)} &middot; ${model.total.toFixed(2)} kWh</span>
            </span>
          </div>
          <div class="selector" aria-label="Periodo de energia">
            ${BRUNO_ENERGY_PERIODS.map((period) => this._segment(period, period.option === model.period.option)).join('')}
          </div>
        </div>
        <div class="chart" aria-label="Grafico de energia">
          ${this._chart(model)}
        </div>
      </div>
    `;

    this._wireActions();
  }

  _segment(period, active) {
    return `
      <button class="segment${active ? ' is-active' : ''}" type="button" data-energy-option="${BrunoEnergyCard._escapeAttr(period.option)}">
        ${BrunoEnergyCard._escape(period.button)}
      </button>
    `;
  }

  _chart(model) {
    const points = model.points.length
      ? model.points
      : [{ value: model.graphCurrent ?? 0, time: Date.now() - 1 }, { value: model.graphCurrent ?? 0, time: Date.now() }];

    const width = 360;
    const height = 100;
    const padX = 0;
    const padTop = 10;
    const padBottom = 20;
    const values = points.map((point) => point.value);
    const minValue = Math.min(model.period.lowerBound, ...values);
    const maxValue = Math.max(1, ...values);
    const span = Math.max(1, maxValue - minValue);

    const xFor = (index) => {
      if (points.length <= 1) return padX;
      return padX + (index / (points.length - 1)) * (width - padX * 2);
    };
    const yFor = (value) => padTop + ((maxValue - value) / span) * (height - padTop - padBottom);

    const line = points.map((point, index) => {
      const x = xFor(index).toFixed(2);
      const y = yFor(point.value).toFixed(2);
      return `${index ? 'L' : 'M'} ${x} ${y}`;
    }).join(' ');
    const firstX = xFor(0).toFixed(2);
    const lastX = xFor(points.length - 1).toFixed(2);
    const baseY = (height - padBottom).toFixed(2);
    const area = `${line} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
    const current = model.graphCurrent == null
      ? '--'
      : `${Number(model.graphCurrent).toFixed(model.period.unit === 'W' ? 0 : 2).replace('.00', '')} ${model.period.unit}`;

    return `
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="${BrunoEnergyCard._escapeAttr(current)}">
        <defs>
          <linearGradient id="bruno-energy-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(111,184,255,0.42)"/>
            <stop offset="70%" stop-color="rgba(111,184,255,0.12)"/>
            <stop offset="100%" stop-color="rgba(111,184,255,0)"/>
          </linearGradient>
          <filter id="bruno-energy-glow" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="2.8" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="${area}" fill="url(#bruno-energy-area)"></path>
        <path d="${line}" fill="none" stroke="#6FB8FF" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" filter="url(#bruno-energy-glow)"></path>
        <text x="18" y="94" class="axis-label">${BrunoEnergyCard._escape(current)}</text>
      </svg>
    `;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoEnergyCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_ENERGY_CARD_TAG)) {
  customElements.define(BRUNO_ENERGY_CARD_TAG, BrunoEnergyCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_ENERGY_CARD_TAG,
  name: 'Bruno Energy Card',
  preview: false,
  description: 'Isolated Bento energy card with period selector, Home Assistant history, and Bruno liquid glass visuals.',
});
