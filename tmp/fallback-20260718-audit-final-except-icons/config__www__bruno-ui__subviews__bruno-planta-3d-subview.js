const BRUNO_PLANTA_3D_SUBVIEW_TAG = 'bruno-planta-3d-subview';
const BRUNO_PLANTA_3D_ASSET_VERSION = '20260710-floorplan-lights-9';

// Source: "Relacao Ponto -> Entidade_atualizada.docx" plus the annotated PNG
// "codex-clipboard-c19a7816-9841-48e0-8ada-cf3d604f7045.png"; microadjusts
// from "codex-clipboard-a924e606-351c-41c8-8434-22719715995e.png"; LED strip
// shapes from "codex-clipboard-8386f08b-532d-482c-8c13-71baa79b6f82.png".
// Coordinates are percentages over the clean 1024x1040 dashboard PNG.
const BRUNO_PLANTA_3D_MARKERS = [
  { point: 1, entity: 'light.sala_2_switch_2', room: 'VR', name: 'Luz principal', x: 24.43, y: 6.87 },
  { point: 2, entity: 'light.varanda_switch_2', room: 'VR', name: 'Pendente', x: 24.57, y: 12.84 },
  { point: 3, entity: 'light.sala_2_switch_3', room: 'VR', name: 'Cristaleira', x: 41.10, y: 13.93 },
  { point: 4, entity: 'light.suite_casal_switch_2', room: 'QCS', name: 'Luz azul', x: 60.40, y: 15.69 },
  { point: 5, entity: 'light.suite_casal_switch_1', room: 'QCS', name: 'Luz principal', x: 68.80, y: 15.96 },
  { point: 6, entity: 'light.varanda_switch_1', room: 'VR', name: 'Area gourmet', x: 5.14, y: 15.43 },
  { point: 7, entity: 'light.office_switch_2', room: 'OF', name: 'Luz ambiente', x: 47.75, y: 12.78 },
  { point: 8, entity: 'light.sala_switch_1', room: 'SL', name: 'Led esquerdo', x: 24.27, y: 20.36 },
  { point: 10, entity: 'light.office_switch_3', room: 'OF', name: 'Luz central', x: 52.73, y: 27.46 },
  { point: 11, entity: 'light.sala_switch_2', room: 'SL', name: 'Luz principal', x: 24.40, y: 30.85 },
  { point: 12, entity: 'light.quarto_casal_2_switch_2', room: 'QC', name: 'Luz sanca', x: 92.37, y: 31.02 },
  { point: 13, entity: 'light.quarto_casal_switch_2', room: 'QC', name: 'Luzes closet', x: 64.53, y: 31.70 },
  { point: 14, entity: 'light.qc_luz_principal', room: 'QC', name: 'Luz principal', x: 75.82, y: 33.06 },
  { point: 15, entity: 'light.office_switch_1', room: 'OF', name: 'Luz estante', x: 47.39, y: 35.78 },
  { point: 16, entity: 'light.quarto_casal_switch_1', room: 'QC', name: 'Luzes quadros', x: 85.76, y: 39.98 },
  { point: 17, entity: 'light.quarto_marina_switch_2', room: 'QMA', name: 'Estante', x: 78.31, y: 45.27 },
  { point: 18, entity: 'light.sala_switch_3', room: 'SL', name: 'Led direito', x: 24.14, y: 45.39 },
  { point: 19, entity: 'light.corredor_switch_1', room: 'COR', name: 'Luz principal', x: 58.19, y: 46.22 },
  { point: 20, entity: 'light.quarto_marina_switch_1', room: 'QMA', name: 'Arandela', x: 91.54, y: 49.88 },
  { point: 21, entity: 'light.quarto_miguel_2_switch_2', room: 'QMI', name: 'Arandela poltrona', x: 54.88, y: 51.78 },
  { point: 22, entity: 'light.lavabo_switch_2', room: 'LV', name: 'Luz principal', x: 20.42, y: 53.36 },
  { point: 23, entity: 'light.quarto_miguel_switch_1', room: 'QMI', name: 'Prateleiras', x: 46.48, y: 53.73 },
  { point: 24, entity: 'light.lavabo_switch_3', room: 'LV', name: 'Luz espelho', x: 23.88, y: 57.65 },
  { point: 25, entity: 'light.lavabo_switch_1', room: 'LV', name: 'Luz parede', x: 16.05, y: 57.91 },
  { point: 26, entity: 'light.quarto_marina_switch_4', room: 'QMA', name: 'Luz principal', x: 82.86, y: 61.14 },
  { point: 27, entity: 'light.quarto_marina_switch_3', room: 'QMA', name: 'Cortineiro', x: 92.92, y: 61.96 },
  { point: 28, entity: 'light.cozinha_switch_2', room: 'CZ', name: 'Luz principal 1', x: 37.80, y: 61.01 },
  { point: 29, entity: 'light.cozinha_switch_3', room: 'CZ', name: 'Luz principal 2', x: 32.42, y: 60.74 },
  { point: 30, entity: 'light.quarto_miguel_2_switch_1', room: 'QMI', name: 'Luzes armario', x: 47.20, y: 62.96 },
  { point: 31, entity: 'light.quarto_miguel_switch_2', room: 'QMI', name: 'Luz principal', x: 53.93, y: 62.96 },
  { point: 32, entity: 'light.suite_miguel_switch_1', room: 'QMIS', name: 'Luz principal', x: 68.25, y: 62.09 },
  { point: 33, entity: 'light.quarto_miguel_2_switch_3', room: 'QMI', name: 'Arandela berco', x: 46.61, y: 71.94 },
  { point: 34, entity: 'light.suite_miguel_switch_2', room: 'QMIS', name: 'Luz azul', x: 68.12, y: 71.45 },
  { point: 35, entity: 'light.suite_marina_switch_2', room: 'QMAS', name: 'Luz principal', x: 82.30, y: 73.63 },
  { point: 36, entity: 'light.suite_marina_switch_1', room: 'QMAS', name: 'Luz azul', x: 90.85, y: 73.76 },
  { point: 37, entity: 'light.quarto_miguel_switch_3', room: 'QMI', name: 'Cortineiro', x: 54.33, y: 73.63 },
  { point: 38, entity: 'light.cozinha_switch_1', room: 'AS', name: 'Lavanderia', x: 34.83, y: 80.07 },
];

const BRUNO_PLANTA_3D_LED_STRIPS = [
  {
    point: 1,
    entity: 'light.sala_2_switch_2',
    room: 'VR',
    name: 'Luz principal',
    shape: 'rect',
    x: 10.14,
    y: 7.71,
    width: 26.97,
    height: 9.99,
  },
  {
    point: 8,
    entity: 'light.sala_switch_1',
    room: 'SL',
    name: 'Led esquerdo',
    shape: 'polyline',
    points: [[5.26, 45.90], [5.26, 22.25], [42.50, 22.25]],
  },
  {
    point: 18,
    entity: 'light.sala_switch_3',
    room: 'SL',
    name: 'Led direito',
    shape: 'polyline',
    points: [[7.70, 45.90], [36.47, 45.90]],
  },
  {
    point: 19,
    entity: 'light.corredor_switch_1',
    room: 'COR',
    name: 'Luz principal',
    shape: 'polyline',
    points: [[46.61, 45.90], [70.88, 45.90]],
  },
  {
    point: 14,
    entity: 'light.qc_luz_principal',
    room: 'QC',
    name: 'Luz principal',
    shape: 'polyline',
    points: [[75.63, 37.55], [75.63, 23.52], [88.47, 23.52]],
  },
  {
    point: 29,
    entity: 'light.cozinha_switch_3',
    room: 'CZ',
    name: 'Luz principal 2',
    shape: 'polyline',
    points: [[32.36, 54.11], [32.36, 73.59]],
  },
  {
    point: 28,
    entity: 'light.cozinha_switch_2',
    room: 'CZ',
    name: 'Luz principal 1',
    shape: 'polyline',
    points: [[37.37, 54.24], [37.37, 73.59]],
  },
  {
    point: 31,
    entity: 'light.quarto_miguel_switch_2',
    room: 'QMI',
    name: 'Luz principal',
    shape: 'rect',
    x: 50.07,
    y: 55.26,
    width: 9.00,
    height: 14.79,
  },
];

class BrunoPlanta3DSubview extends HTMLElement {
  constructor() {
    super();
    this._config = null;
    this._hass = null;
    this._clockTimer = null;
    this._lastAction = '';
    this._lastToggleAt = 0;
    this._boundClick = this._handleClick.bind(this);
    this._boundKeydown = this._handleKeydown.bind(this);
  }

  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      title: 'Planta 3D',
      section: 'Luzes',
      image: '/local/images/planta_apartamento_home_assistant.png',
      markers: BRUNO_PLANTA_3D_MARKERS,
      ledStrips: BRUNO_PLANTA_3D_LED_STRIPS,
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  connectedCallback() {
    this._startClock();
  }

  disconnectedCallback() {
    window.clearInterval(this._clockTimer);
    this._clockTimer = null;
    this.shadowRoot?.removeEventListener('click', this._boundClick);
    this.shadowRoot?.removeEventListener('keydown', this._boundKeydown);
  }

  getCardSize() {
    return 8;
  }

  _markers() {
    const markers = Array.isArray(this._config?.markers)
      ? this._config.markers
      : BRUNO_PLANTA_3D_MARKERS;
    return markers
      .filter((marker) => marker?.entity)
      .map((marker) => ({
        point: Number(marker.point),
        entity: String(marker.entity).trim(),
        room: marker.room || '',
        name: marker.name || marker.entity,
        x: Number(marker.x),
        y: Number(marker.y),
      }))
      .filter((marker) => Number.isFinite(marker.x) && Number.isFinite(marker.y));
  }

  _ledStrips() {
    const ledStrips = Array.isArray(this._config?.ledStrips)
      ? this._config.ledStrips
      : BRUNO_PLANTA_3D_LED_STRIPS;
    return ledStrips
      .filter((strip) => strip?.entity && strip?.shape)
      .map((strip) => ({
        point: Number(strip.point),
        entity: String(strip.entity).trim(),
        room: strip.room || '',
        name: strip.name || strip.entity,
        shape: strip.shape,
        x: Number(strip.x),
        y: Number(strip.y),
        width: Number(strip.width),
        height: Number(strip.height),
        points: Array.isArray(strip.points) ? strip.points : [],
      }))
      .filter((strip) => {
        if (!Number.isFinite(strip.point)) return false;
        if (strip.shape === 'rect') {
          return [strip.x, strip.y, strip.width, strip.height].every(Number.isFinite);
        }
        return strip.shape === 'polyline'
          && strip.points.length >= 2
          && strip.points.every((point) => Array.isArray(point)
            && point.length === 2
            && Number.isFinite(Number(point[0]))
            && Number.isFinite(Number(point[1])));
      });
  }

  _visibleMarkers(markers, ledStrips) {
    const stripPoints = new Set(ledStrips.map((strip) => strip.point));
    return markers.filter((marker) => !stripPoints.has(marker.point));
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isOn(entityId) {
    return this._state(entityId)?.state === 'on';
  }

  _isUnavailable(entityId) {
    const state = this._state(entityId)?.state;
    return !state || state === 'unknown' || state === 'unavailable';
  }

  _counts(markers) {
    return markers.reduce((acc, marker) => {
      if (this._isOn(marker.entity)) acc.on += 1;
      if (this._isUnavailable(marker.entity)) acc.unavailable += 1;
      return acc;
    }, { on: 0, unavailable: 0 });
  }

  _handleClick(event) {
    const control = event.target?.closest?.('[data-action="toggle-light"]');
    if (!control) return;

    event.preventDefault();
    event.stopPropagation();

    const point = Number(control.dataset.point);
    const marker = this._markers().find((item) => item.point === point);
    if (!marker || this._isUnavailable(marker.entity)) return;

    const now = Date.now();
    if (now - this._lastToggleAt < 420) return;
    this._lastToggleAt = now;
    this._lastAction = `${marker.room} ${marker.name}`.trim();

    control.classList.add('is-pressed');
    window.setTimeout(() => control.classList.remove('is-pressed'), 180);
    globalThis.BrunoLiquidGlass?.feedback?.('tap');
    this._hass?.callService?.('light', 'toggle', { entity_id: marker.entity });
    this._renderFooter();
  }

  _handleKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    const control = event.target?.closest?.('[data-action="toggle-light"]');
    if (!control || control.matches('button')) return;
    this._handleClick(event);
  }

  _startClock() {
    if (this._clockTimer) return;
    this._clockTimer = window.setInterval(() => this._renderClock(), 30000);
    this._renderClock();
  }

  _renderClock() {
    if (!this.shadowRoot) return;
    const clock = this.shadowRoot.querySelector('[data-clock]');
    const date = this.shadowRoot.querySelector('[data-date]');
    if (clock) clock.textContent = BrunoPlanta3DSubview._clock();
    if (date) date.textContent = BrunoPlanta3DSubview._date();
  }

  _renderFooter() {
    if (!this.shadowRoot) return;
    const footer = this.shadowRoot.querySelector('.floorplan-footer');
    if (!footer) return;
    const markers = this._markers();
    const counts = this._counts(markers);
    footer.innerHTML = this._footerTemplate(markers, counts);
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const markers = this._markers();
    const ledStrips = this._ledStrips();
    const visibleMarkers = this._visibleMarkers(markers, ledStrips);
    const counts = this._counts(markers);

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main class="floorplan-shell">
        <header class="floorplan-topbar">
          <div class="brand">
            <span>${BrunoPlanta3DSubview._escape(this._config.title)}</span>
            <span class="divider" aria-hidden="true"></span>
            <strong>${BrunoPlanta3DSubview._escape(this._config.section)}</strong>
          </div>

          <div class="clock-block" aria-label="Horario atual">
            <span data-clock>${BrunoPlanta3DSubview._escape(BrunoPlanta3DSubview._clock())}</span>
            <small data-date>${BrunoPlanta3DSubview._escape(BrunoPlanta3DSubview._date())}</small>
          </div>
        </header>

        <section class="map-area" aria-label="Planta 3D interativa">
          <div class="plan-wrap">
            <img
              src="${BrunoPlanta3DSubview._escapeAttr(this._assetUrl(this._config.image))}"
              alt="Planta 3D do apartamento"
              draggable="false"
            >
            <div class="led-strips-layer" aria-label="Perfis de LED">
              ${ledStrips.map((strip) => this._stripTemplate(strip)).join('')}
            </div>
            <div class="markers-layer">
              ${visibleMarkers.map((marker) => this._markerTemplate(marker)).join('')}
            </div>
          </div>
        </section>

        <footer class="floorplan-footer" aria-label="Resumo das luzes">
          ${this._footerTemplate(markers, counts)}
        </footer>
      </main>
    `;

    this.shadowRoot.removeEventListener('click', this._boundClick);
    this.shadowRoot.removeEventListener('keydown', this._boundKeydown);
    this.shadowRoot.addEventListener('click', this._boundClick);
    this.shadowRoot.addEventListener('keydown', this._boundKeydown);
    this._startClock();
  }

  _markerTemplate(marker) {
    const state = this._state(marker.entity)?.state || 'unavailable';
    const on = state === 'on';
    const unavailable = this._isUnavailable(marker.entity);
    const label = `${marker.point}. ${marker.room} - ${marker.name}`;
    const classes = [
      'light-marker',
      on ? 'is-on' : 'is-off',
      unavailable ? 'is-unavailable' : '',
    ].filter(Boolean).join(' ');

    return `
      <button
        class="${classes}"
        type="button"
        data-action="toggle-light"
        data-point="${marker.point}"
        aria-label="${BrunoPlanta3DSubview._escapeAttr(label)}"
        aria-pressed="${on ? 'true' : 'false'}"
        title="${BrunoPlanta3DSubview._escapeAttr(label)}"
        style="--x:${marker.x}%;--y:${marker.y}%;"
        ${unavailable ? 'disabled' : ''}
      >
        <ha-icon icon="${on ? 'mdi:lightbulb-on-outline' : 'mdi:lightbulb-outline'}"></ha-icon>
      </button>
    `;
  }

  _stripTemplate(strip) {
    const state = this._state(strip.entity)?.state || 'unavailable';
    const on = state === 'on';
    const unavailable = this._isUnavailable(strip.entity);
    const label = `${strip.point}. ${strip.room} - ${strip.name}`;
    const stateClasses = [
      on ? 'is-on' : 'is-off',
      unavailable ? 'is-unavailable' : '',
    ].filter(Boolean).join(' ');
    const commonAttrs = `
      type="button"
      data-action="toggle-light"
      data-point="${strip.point}"
      aria-label="${BrunoPlanta3DSubview._escapeAttr(label)}"
      aria-pressed="${on ? 'true' : 'false'}"
      title="${BrunoPlanta3DSubview._escapeAttr(label)}"
      ${unavailable ? 'disabled' : ''}
    `;

    if (strip.shape === 'rect') {
      const x = strip.x;
      const y = strip.y;
      const x2 = strip.x + strip.width;
      const y2 = strip.y + strip.height;
      return [
        [[x, y], [x2, y]],
        [[x2, y], [x2, y2]],
        [[x2, y2], [x, y2]],
        [[x, y2], [x, y]],
      ]
        .map(([start, end]) => this._stripSegmentTemplate(start, end, stateClasses, commonAttrs))
        .join('');
    }

    return strip.points
      .slice(1)
      .map((point, index) => this._stripSegmentTemplate(strip.points[index], point, stateClasses, commonAttrs))
      .join('');
  }

  _stripSegmentTemplate(start, end, stateClasses, commonAttrs) {
    const [x1, y1] = start.map(Number);
    const [x2, y2] = end.map(Number);
    const horizontal = Math.abs(x2 - x1) >= Math.abs(y2 - y1);
    const left = BrunoPlanta3DSubview._fmt(Math.min(x1, x2));
    const top = BrunoPlanta3DSubview._fmt(Math.min(y1, y2));
    const width = BrunoPlanta3DSubview._fmt(Math.abs(x2 - x1));
    const height = BrunoPlanta3DSubview._fmt(Math.abs(y2 - y1));
    const axis = horizontal ? 'is-horizontal' : 'is-vertical';
    const style = horizontal
      ? `--x:${left}%;--y:${BrunoPlanta3DSubview._fmt(y1)}%;--w:${width}%;`
      : `--x:${BrunoPlanta3DSubview._fmt(x1)}%;--y:${top}%;--h:${height}%;`;

    return `
      <button
        class="led-strip-control led-strip-segment ${axis} ${stateClasses}"
        style="${style}"
        ${commonAttrs}
      ></button>
    `;
  }

  _footerTemplate(markers, counts) {
    const total = markers.length;
    const unavailable = counts.unavailable
      ? `<span class="footer-chip muted">${counts.unavailable} indisponivel${counts.unavailable === 1 ? '' : 's'}</span>`
      : '';
    const last = this._lastAction
      ? `<span class="footer-chip">${BrunoPlanta3DSubview._escape(this._lastAction)}</span>`
      : `<span class="footer-chip muted">${total} pontos mapeados</span>`;

    return `
      <span class="footer-chip strong">
        <ha-icon icon="mdi:lightbulb-group-outline"></ha-icon>
        ${counts.on} de ${total} luzes acesas
      </span>
      ${unavailable}
      ${last}
    `;
  }

  _assetUrl(src) {
    if (!src) return '';
    return `${src}${String(src).includes('?') ? '&' : '?'}v=${BRUNO_PLANTA_3D_ASSET_VERSION}`;
  }

  _styles() {
    return `
      :host {
        --panel-bg: rgba(7, 11, 18, 0.54);
        --line: rgba(255,255,255,0.10);
        --text-main: rgba(246,250,255,0.94);
        --text-soft: rgba(226,232,240,0.66);
        --text-muted: rgba(226,232,240,0.48);
        --accent: 252, 211, 77;
        --light-shell-bg: rgba(35,39,44,0.32);
        --light-shell-on-bg: rgba(60,52,34,0.30);
        --light-shell-border: rgba(255,255,255,0.085);
        --light-shell-on-border: rgba(255,221,130,0.24);
        --light-icon-off: rgba(236,241,248,0.48);
        --light-icon-on: rgba(255,218,112,0.96);
        --led-off-bg: rgba(35,39,44,0.36);
        --led-hover-bg: rgba(255,224,135,0.26);
        --led-on-core: rgba(255,218,104,0.72);
        --led-on-edge: rgba(255,245,190,0.18);
        --light-shadow: 0 4px 10px rgba(0,0,0,0.14);
        --light-glow: 0 0 9px rgba(var(--accent),0.24);
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        box-sizing: border-box;
        color: var(--text-main);
        font-family: var(--ha-font-family-body, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      }

      * {
        box-sizing: border-box;
      }

      .floorplan-shell {
        width: 100%;
        height: 100%;
        min-height: 0;
        position: relative;
        display: block;
        overflow: hidden;
      }

      .floorplan-topbar,
      .floorplan-footer {
        min-width: 0;
        position: absolute;
        left: 0;
        right: 0;
        z-index: 4;
        background: transparent;
        border: 0;
        border-radius: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        pointer-events: none;
      }

      .floorplan-topbar {
        top: 0;
        height: 44px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 0 14px 0 18px;
      }

      .brand {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 12px;
        color: var(--text-soft);
        font-size: 15px;
        line-height: 1;
        text-transform: uppercase;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        text-shadow: 0 1px 8px rgba(0,0,0,0.42);
      }

      .brand strong {
        color: rgba(255,255,255,0.88);
        font-weight: 720;
      }

      .divider {
        width: 1px;
        height: 20px;
        background: rgba(255,255,255,0.16);
        flex: 0 0 auto;
      }

      .clock-block {
        min-width: 72px;
        display: flex;
        flex-direction: column;
        align-items: flex-end;
        gap: 2px;
        font-variant-numeric: tabular-nums;
        color: rgba(255,255,255,0.86);
        font-size: 12px;
        line-height: 1;
        text-shadow: 0 1px 8px rgba(0,0,0,0.42);
      }

      .clock-block small {
        color: rgba(226,232,240,0.58);
        font-size: 10px;
        line-height: 1;
      }

      .map-area {
        position: absolute;
        inset: 0;
        z-index: 1;
        min-width: 0;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        overflow: hidden;
        padding: 0;
      }

      .plan-wrap {
        position: relative;
        height: 100%;
        max-height: 100%;
        max-width: 100%;
        aspect-ratio: 1024 / 1040;
        overflow: hidden;
        isolation: isolate;
      }

      .plan-wrap img {
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
        user-select: none;
        -webkit-user-drag: none;
      }

      .markers-layer {
        position: absolute;
        inset: 0;
        z-index: 3;
        pointer-events: none;
      }

      .led-strips-layer {
        position: absolute;
        inset: 0;
        z-index: 2;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
      }

      .led-strip-control {
        position: absolute;
        display: block;
        padding: 0;
        border: 0;
        border-radius: 0;
        appearance: none;
        -webkit-appearance: none;
        background: transparent;
        cursor: pointer;
        pointer-events: auto;
        outline: none;
      }

      .led-strip-control::before {
        content: "";
        position: absolute;
        display: block;
        border-radius: 999px;
        pointer-events: none;
        background: var(--led-off-bg);
        box-shadow: var(--light-shadow);
        transition:
          opacity 160ms ease,
          background 160ms ease,
          border-color 160ms ease,
          box-shadow 160ms ease;
      }

      .led-strip-segment.is-horizontal {
        left: var(--x);
        top: var(--y);
        width: var(--w);
        height: 22px;
        transform: translateY(-50%);
      }

      .led-strip-segment.is-horizontal::before {
        left: 0;
        right: 0;
        top: 50%;
        height: 5px;
        transform: translateY(-50%);
      }

      .led-strip-segment.is-vertical {
        left: var(--x);
        top: var(--y);
        width: 22px;
        height: var(--h);
        transform: translateX(-50%);
      }

      .led-strip-segment.is-vertical::before {
        top: 0;
        bottom: 0;
        left: 50%;
        width: 5px;
        transform: translateX(-50%);
      }

      .led-strip-control.is-on::before {
        background:
          linear-gradient(90deg, var(--led-on-edge), var(--led-on-core) 50%, var(--led-on-edge));
        box-shadow:
          var(--light-glow),
          var(--light-shadow);
      }

      .led-strip-control.is-on.is-vertical::before {
        background:
          linear-gradient(180deg, var(--led-on-edge), var(--led-on-core) 50%, var(--led-on-edge));
      }

      .led-strip-control:hover::before,
      .led-strip-control:focus-visible::before {
        background: var(--led-hover-bg);
        box-shadow:
          var(--light-glow),
          var(--light-shadow);
      }

      .led-strip-control.is-pressed::before {
        opacity: 0.76;
      }

      .led-strip-control.is-unavailable,
      .led-strip-control:disabled {
        cursor: not-allowed;
        opacity: 0.36;
        filter: grayscale(0.65);
      }

      .light-marker {
        position: absolute;
        left: var(--x);
        top: var(--y);
        width: 30px;
        height: 30px;
        min-width: 30px;
        min-height: 30px;
        display: grid;
        place-items: center;
        padding: 0;
        border-radius: 999px;
        border: 1px solid var(--light-shell-border);
        transform: translate(-50%, -50%);
        appearance: none;
        -webkit-appearance: none;
        cursor: pointer;
        pointer-events: auto;
        color: var(--light-icon-off);
        background:
          linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.018)),
          var(--light-shell-bg);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.10),
          var(--light-shadow);
        backdrop-filter: blur(12px) saturate(1.15);
        -webkit-backdrop-filter: blur(12px) saturate(1.15);
        transition:
          transform 160ms ease,
          border-color 160ms ease,
          background 160ms ease,
          box-shadow 160ms ease,
          color 160ms ease;
      }

      .light-marker ha-icon {
        --mdc-icon-size: 15px;
        pointer-events: none;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.22));
      }

      .light-marker.is-on ha-icon {
        filter:
          drop-shadow(0 0 4px rgba(var(--accent),0.58))
          drop-shadow(0 0 10px rgba(var(--accent),0.20));
      }

      .light-marker:hover,
      .light-marker:focus-visible {
        outline: none;
        transform: translate(-50%, -50%) scale(1.06);
        border-color: var(--light-shell-on-border);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.12),
          0 0 0 2px rgba(var(--accent),0.08),
          var(--light-shadow);
      }

      .light-marker.is-pressed {
        transform: translate(-50%, -50%) scale(0.96);
      }

      .light-marker.is-on {
        color: var(--light-icon-on);
        border-color: var(--light-shell-on-border);
        background:
          radial-gradient(circle at 50% 28%, rgba(255,234,164,0.12), transparent 62%),
          var(--light-shell-on-bg);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.18),
          var(--light-glow),
          var(--light-shadow);
      }

      .light-marker.is-off {
        color: var(--light-icon-off);
      }

      .light-marker.is-unavailable,
      .light-marker:disabled {
        cursor: not-allowed;
        opacity: 0.42;
        filter: grayscale(0.65);
      }

      .floorplan-footer {
        bottom: 0;
        height: 42px;
        min-height: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 10px;
        padding: 0 14px 0 18px;
        color: var(--text-soft);
        overflow: hidden;
        text-shadow: 0 1px 8px rgba(0,0,0,0.42);
      }

      .footer-chip {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 26px;
        padding: 0 6px;
        border-radius: 0;
        border: 0;
        background: transparent;
        color: var(--text-soft);
        font-size: 12px;
        line-height: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .footer-chip ha-icon {
        --mdc-icon-size: 15px;
        flex: 0 0 auto;
      }

      .footer-chip.strong {
        color: rgba(255,255,255,0.88);
      }

      .footer-chip.muted {
        color: var(--text-muted);
      }

      @media (max-height: 760px) {
        .light-marker {
          width: 26px;
          height: 26px;
          min-width: 26px;
          min-height: 26px;
        }

        .light-marker ha-icon {
          --mdc-icon-size: 13px;
        }
      }

      @media (max-width: 900px) {
        .floorplan-topbar {
          padding: 0 10px;
          gap: 8px;
        }

        .brand {
          justify-content: flex-start;
          font-size: 13px;
        }

        .floorplan-footer {
          justify-content: flex-end;
          padding: 0 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .floorplan-footer::-webkit-scrollbar {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .light-marker {
          transition: none !important;
        }
      }
    `;
  }

  static _clock() {
    return new Intl.DateTimeFormat('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date());
  }

  static _date() {
    return new Intl.DateTimeFormat('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    }).format(new Date()).replace('.', '');
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  static _escapeAttr(value) {
    return BrunoPlanta3DSubview._escape(value).replace(/'/g, '&#39;');
  }

  static _fmt(value) {
    return Number(value).toFixed(2).replace(/\.?0+$/, '');
  }
}

if (!customElements.get(BRUNO_PLANTA_3D_SUBVIEW_TAG)) {
  customElements.define(BRUNO_PLANTA_3D_SUBVIEW_TAG, BrunoPlanta3DSubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_PLANTA_3D_SUBVIEW_TAG,
  name: 'Bruno Planta 3D Subview',
  preview: false,
  description: 'Interactive apartment floorplan with mapped light toggles.',
});
