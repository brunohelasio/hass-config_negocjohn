// bruno-roborock-subview.js — Console do Roborock como SECAO da shell (em JS).
//
// Reproduz FIELMENTE o popup footer_vacuum.yaml (Summary | Mapa | Settings) com
// AS MESMAS entidades e controles, agora no estilo liquid-glass e dentro da shell.
// O mapa interativo e reaproveitado via custom:xiaomi-vacuum-map-card (mesmo
// entity image.roborock_s7_map_0_custom do popup), embutido por loadCardHelpers.
//
// Filosofia identica as demais subviews: preenche a regiao de conteudo da shell,
// header transparente (voltar + titulo + relogio), atualizacao in-place (nao
// reconstroi o DOM a cada hass — preserva foco/interacao dos controles).

const BRUNO_ROBOROCK_SUBVIEW_TAG = 'bruno-roborock-subview';

const BRUNO_ROBOROCK_SUBVIEW_DEFAULTS = {
  title: 'Casa',
  section: 'Aspirador',
  entities: {
    vacuum: 'vacuum.roborock_s7',
    error: 'sensor.roborock_s7_vacuum_error',
    room: 'sensor.roborock_s7_comodo_atual',
    mop_attached: 'binary_sensor.roborock_s7_mop_attached',
    battery: 'sensor.roborock_s7_bateria',
    mop_intensity: 'select.roborock_s7_intensidade_do_mop',
    mop_mode: 'select.roborock_s7_modo_mop',
    volume: 'number.roborock_s7_volume',
    dnd: 'switch.roborock_s7_nao_perturbe',
    dnd_start: 'time.roborock_s7_comecar_nao_perturbe',
    dnd_end: 'time.roborock_s7_terminar_nao_perturbe',
    dock_light: 'switch.roborock_s7_dock_luz_indicadora_de_status',
    child_lock: 'switch.roborock_s7_dock_bloqueio_infantil',
    area_last: 'sensor.roborock_s7_area_de_limpeza',
    time_last: 'sensor.roborock_s7_tempo_de_limpeza',
    area_total: 'sensor.roborock_s7_area_total_de_limpeza',
    time_total: 'sensor.roborock_s7_tempo_total_de_limpeza',
    count_total: 'sensor.roborock_s7_contagem_total_de_limpeza',
    // Consumiveis / agua (na coluna da esquerda, onde ha espaco).
    brush_main: 'sensor.roborock_s7_tempo_restante_da_escova_principal',
    brush_side: 'sensor.roborock_s7_tempo_restante_da_escova_lateral',
    filter: 'sensor.roborock_s7_tempo_restante_do_filtro',
    sensor_life: 'sensor.roborock_s7_tempo_restante_do_sensor',
    water_box: 'binary_sensor.roborock_s7_water_box_attached',
    water_short: 'binary_sensor.roborock_s7_water_shortage',
  },
  // Mapa: IDENTICO ao footer_vacuum.yaml (nao alterar entidades).
  // card_mod com base VH (sempre positivo, como o popup), para SOBRAR espaco a
  // barra de controles nativa (zona/segmento/executar) SEM quebrar a calibracao.
  // (A tentativa anterior com calc(100% - 96px) degenerava p/ 0 na init -> erro.)
  map: {
    type: 'custom:xiaomi-vacuum-map-card',
    vacuum_platform: 'Roborock',
    entity: 'vacuum.roborock_s7',
    map_source: { camera: 'image.roborock_s7_map_0_custom' },
    calibration_source: { camera: true },
    map_locked: true,
    tiles: [],
    icons: [],
    card_mod: {
      style: `
        ha-card {
          height: calc(100vh - 182px) !important;
          max-height: calc(100vh - 182px) !important;
          overflow: hidden !important;
          --map-card-primary-color: #FFFFFF30;
          --map-card-secondary-color: #FFFFFF10;
          --map-card-secondary-text-color: #9da0a2;
          --map-card-zoomer-background: none;
          --map-card-internal-big-radius: 0.6em !important;
          background: transparent !important;
          border: none !important;
          box-shadow: none !important;
        }
        div.map-wrapper {
          max-height: calc(100vh - 290px) !important;
          padding: 0.35rem 0 0.25rem !important;
        }
        div.controls-wrapper { padding-top: 0; padding-bottom: 0; margin: 0; }
        div.map-controls-wrapper { padding: 2px 6px; }
        xvmc-zoom-buttons { display: none !important; }
        paper-button { --mdc-icon-size: 1.35em; color: #9da0a2 !important; padding: 0.32em; }
        #map-image { filter: brightness(0.85); }
      `,
    },
  },
  navigation_path: 'bento-lab',
};

const BRUNO_ROBOROCK_STATE_MAP = {
  cleaning: { label: 'Limpando', tone: 'active' },
  segment_cleaning: { label: 'Limpando cômodo', tone: 'active' },
  room_cleaning: { label: 'Limpando cômodo', tone: 'active' },
  spot_cleaning: { label: 'Limpeza pontual', tone: 'active' },
  zoned_cleaning: { label: 'Limpando zona', tone: 'active' },
  moving: { label: 'Movendo', tone: 'active' },
  returning: { label: 'Voltando à base', tone: 'returning' },
  docked: { label: 'Na base', tone: 'idle' },
  idle: { label: 'Ocioso', tone: 'idle' },
  paused: { label: 'Pausado', tone: 'paused' },
  charging: { label: 'Carregando', tone: 'returning' },
  error: { label: 'Erro', tone: 'error' },
};

const BRUNO_ROBOROCK_ACTIVE = ['cleaning', 'segment_cleaning', 'room_cleaning', 'spot_cleaning', 'zoned_cleaning', 'moving'];

class BrunoRoborockSubview extends HTMLElement {
  constructor() {
    super();
    this._built = false;
    this._mapEl = null;
    this._helpers = null;
    this._lastClock = BrunoRoborockSubview._clock();
    this._boundClick = (e) => this._onClick(e);
    this._boundChange = (e) => this._onChange(e);
    this._boundClock = () => this._tickClock();
  }

  setConfig(config) {
    const cfg = config || {};
    this._config = {
      ...BRUNO_ROBOROCK_SUBVIEW_DEFAULTS,
      ...cfg,
      entities: { ...BRUNO_ROBOROCK_SUBVIEW_DEFAULTS.entities, ...(cfg.entities || {}) },
      map: { ...BRUNO_ROBOROCK_SUBVIEW_DEFAULTS.map, ...(cfg.map || {}) },
    };
  }

  set hass(hass) {
    this._hass = hass;
    if (!this._built) {
      this._build();
    } else {
      this._update();
    }
    if (this._mapEl) this._mapEl.hass = hass;
  }

  getCardSize() { return 100; }

  connectedCallback() {
    globalThis.BrunoLiquidGlass && globalThis.BrunoLiquidGlass.apply && globalThis.BrunoLiquidGlass.apply();
    this._startClock();
    if (this._hass && !this._built) this._build();
  }

  disconnectedCallback() {
    this._stopClock();
  }

  // --- Helpers de estado --------------------------------------------------

  _entity(key) { return this._config && this._config.entities[key]; }
  _st(key) {
    const id = this._entity(key);
    return id && this._hass && this._hass.states ? this._hass.states[id] : undefined;
  }
  _state(key, fallback = '--') {
    const s = this._st(key);
    if (!s || ['unknown', 'unavailable', 'none', ''].includes(s.state)) return fallback;
    return s.state;
  }
  _num(key, digits = 0, fallback = '--') {
    const s = this._st(key);
    const v = s ? Number.parseFloat(s.state) : NaN;
    if (!Number.isFinite(v)) return fallback;
    return v.toFixed(digits).replace(/\.0+$/, '');
  }
  _unit(key) { const s = this._st(key); return (s && s.attributes && s.attributes.unit_of_measurement) || ''; }
  _vacAttr(attr) { const s = this._st('vacuum'); return s && s.attributes ? s.attributes[attr] : undefined; }

  _call(domain, service, data) {
    if (this._hass) this._hass.callService(domain, service, data || {});
  }

  // --- Construcao (uma vez) ----------------------------------------------

  _build() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${BrunoRoborockSubview._styles()}</style>
      <main class="rb-shell">
        <header class="rb-header">
          <button class="rb-back" type="button" data-action="navigate-home" aria-label="Voltar">
            <ha-icon icon="mdi:arrow-left"></ha-icon>
          </button>
          <div class="rb-brand">
            <span class="rb-brand-main">${BrunoRoborockSubview._esc(this._config.title)}</span>
            <span class="rb-brand-sep" aria-hidden="true">·</span>
            <strong class="rb-brand-strong">${BrunoRoborockSubview._esc(this._config.section)}</strong>
          </div>
          <div class="rb-clock" aria-label="Horario">
            <span data-clock>${BrunoRoborockSubview._esc(this._lastClock)}</span>
            <small data-date>${BrunoRoborockSubview._esc(BrunoRoborockSubview._date())}</small>
          </div>
        </header>

        <section class="rb-body">
          <!-- COLUNA 1 — SUMMARY -->
          <section class="rb-col rb-summary glass">
            <div class="rb-status">
              <span class="rb-status-dot" data-bind="status-dot"></span>
              <div class="rb-status-text">
                <span class="rb-status-name" data-bind="status-name">--</span>
                <span class="rb-status-sub" data-bind="status-sub">--</span>
              </div>
              <span class="rb-battery" data-bind="battery">--</span>
            </div>

            <div class="rb-rows">
              ${BrunoRoborockSubview._infoRow('Erro', 'error')}
              ${BrunoRoborockSubview._infoRow('Cômodo Atual', 'room')}
              ${BrunoRoborockSubview._infoRow('Mop Acoplado', 'mop')}
              ${BrunoRoborockSubview._infoRow('Bateria', 'battery2')}
              ${BrunoRoborockSubview._infoRow('Fan Speed', 'fan')}
            </div>

            <div class="rb-divider"></div>

            ${this._selectRow('Intensidade do Mop', 'mop_intensity')}
            ${this._selectRow('Modo do Mop', 'mop_mode')}

            <div class="rb-divider"></div>
            <div class="rb-col-title">Consumíveis</div>
            <div class="rb-rows">
              ${BrunoRoborockSubview._infoRow('Escova principal', 'brush_main')}
              ${BrunoRoborockSubview._infoRow('Escova lateral', 'brush_side')}
              ${BrunoRoborockSubview._infoRow('Filtro', 'filter')}
              ${BrunoRoborockSubview._infoRow('Sensor', 'sensor_life')}
              ${BrunoRoborockSubview._infoRow('Caixa d\'água', 'water_box')}
              ${BrunoRoborockSubview._infoRow('Falta de água', 'water_short')}
            </div>

            <div class="rb-controls">
              <button class="rb-ctrl" type="button" data-action="play-pause">
                <ha-icon icon="mdi:play-pause"></ha-icon><span data-bind="play-label">Iniciar</span>
              </button>
              <button class="rb-ctrl" type="button" data-action="return-base">
                <ha-icon icon="mdi:home-map-marker"></ha-icon><span>Base</span>
              </button>
              <button class="rb-ctrl" type="button" data-action="locate">
                <ha-icon icon="mdi:map-marker"></ha-icon><span>Localizar</span>
              </button>
            </div>
          </section>

          <!-- COLUNA 2 — MAPA -->
          <section class="rb-col rb-map glass">
            <div class="rb-map-slot" data-bind="map-slot"></div>
          </section>

          <!-- COLUNA 3 — SETTINGS -->
          <section class="rb-col rb-settings glass">
            <div class="rb-col-title">Configurações</div>
            ${this._sliderRow('Volume', 'volume')}
            ${this._toggleRow('Não Perturbe', 'dnd')}
            ${this._timeRow('Início NP', 'dnd_start')}
            ${this._timeRow('Fim NP', 'dnd_end')}
            ${this._toggleRow('Luz Indicadora', 'dock_light')}
            ${this._toggleRow('Bloqueio Infantil', 'child_lock')}

            <div class="rb-divider"></div>
            <div class="rb-col-title">Estatísticas</div>
            ${BrunoRoborockSubview._statRow('Área (Última)', 'area_last')}
            ${BrunoRoborockSubview._statRow('Tempo (Última)', 'time_last')}
            ${BrunoRoborockSubview._statRow('Área Total', 'area_total')}
            ${BrunoRoborockSubview._statRow('Tempo Total', 'time_total')}
            ${BrunoRoborockSubview._statRow('Nº de Limpezas', 'count_total')}
          </section>
        </section>

        <footer class="rb-footer">
          <span class="rb-foot-note">
            <ha-icon icon="mdi:robot-vacuum" aria-hidden="true"></ha-icon>
            <span data-bind="foot">Roborock S7</span>
          </span>
        </footer>
      </main>
    `;

    this.shadowRoot.removeEventListener('click', this._boundClick);
    this.shadowRoot.removeEventListener('change', this._boundChange);
    this.shadowRoot.removeEventListener('input', this._boundChange);
    this.shadowRoot.addEventListener('click', this._boundClick);
    this.shadowRoot.addEventListener('change', this._boundChange);
    this.shadowRoot.addEventListener('input', this._boundChange);

    this._embedMap();
    this._built = true;
    this._update();
  }

  async _embedMap() {
    try {
      if (!this._helpers && globalThis.loadCardHelpers) this._helpers = await globalThis.loadCardHelpers();
      if (!this._helpers) return;
      const slot = this.shadowRoot.querySelector('[data-bind="map-slot"]');
      if (!slot) return;
      this._mapEl = this._helpers.createCardElement(this._config.map);
      if (this._hass) this._mapEl.hass = this._hass;
      slot.replaceChildren(this._mapEl);
    } catch (error) {
      const slot = this.shadowRoot.querySelector('[data-bind="map-slot"]');
      if (slot) slot.innerHTML = `<div class="rb-map-err">Mapa: ${BrunoRoborockSubview._esc(error && error.message)}</div>`;
    }
  }

  // --- Atualizacao in-place ----------------------------------------------

  _update() {
    if (!this.shadowRoot) return;
    const r = this.shadowRoot;

    // Status hero
    const vac = this._st('vacuum');
    const stateKey = vac ? String(vac.state) : 'unknown';
    const meta = BRUNO_ROBOROCK_STATE_MAP[stateKey] || { label: this._state('vacuum'), tone: 'idle' };
    this._setText(r, 'status-name', meta.label);
    this._setText(r, 'status-sub', this._state('room', '—'));
    const dot = r.querySelector('[data-bind="status-dot"]');
    if (dot) dot.className = `rb-status-dot tone-${meta.tone}`;
    this._setText(r, 'foot', `Roborock S7 · ${meta.label}`);
    const batt = this._num('battery', 0, '--');
    this._setText(r, 'battery', batt === '--' ? '--' : `${batt}%`);

    // Linhas info
    this._setText(r, 'row-error', this._state('error', 'Sem erros'));
    this._setText(r, 'row-room', this._state('room'));
    this._setText(r, 'row-mop', this._st('mop_attached') ? (this._st('mop_attached').state === 'on' ? 'Sim' : 'Não') : '--');
    this._setText(r, 'row-battery2', batt === '--' ? '--' : `${batt}%`);
    this._setText(r, 'row-fan', BrunoRoborockSubview._cap(this._vacAttr('fan_speed')));

    // Consumiveis / agua (coluna esquerda)
    this._setText(r, 'row-brush_main', this._withUnit('brush_main'));
    this._setText(r, 'row-brush_side', this._withUnit('brush_side'));
    this._setText(r, 'row-filter', this._withUnit('filter'));
    this._setText(r, 'row-sensor_life', this._withUnit('sensor_life'));
    this._setText(r, 'row-water_box', this._binYesNo('water_box'));
    this._setText(r, 'row-water_short', this._binYesNo('water_short'));

    // Selects
    this._syncSelect(r, 'mop_intensity');
    this._syncSelect(r, 'mop_mode');

    // Botao play/pause (label conforme estado)
    const active = BRUNO_ROBOROCK_ACTIVE.includes(stateKey);
    this._setText(r, 'play-label', active ? 'Pausar' : 'Iniciar');

    // Slider volume
    this._syncSlider(r, 'volume');

    // Toggles
    this._syncToggle(r, 'dnd');
    this._syncToggle(r, 'dock_light');
    this._syncToggle(r, 'child_lock');

    // Time inputs
    this._syncTime(r, 'dnd_start');
    this._syncTime(r, 'dnd_end');

    // Estatisticas
    this._setText(r, 'stat-area_last', this._withUnit('area_last'));
    this._setText(r, 'stat-time_last', this._withUnit('time_last'));
    this._setText(r, 'stat-area_total', this._withUnit('area_total'));
    this._setText(r, 'stat-time_total', this._withUnit('time_total'));
    this._setText(r, 'stat-count_total', this._withUnit('count_total'));
  }

  _withUnit(key) {
    const v = this._state(key);
    if (v === '--') return '--';
    const u = this._unit(key);
    return u ? `${v} ${u}` : v;
  }

  _binYesNo(key) {
    const s = this._st(key);
    if (!s || ['unknown', 'unavailable', 'none', ''].includes(s.state)) return '--';
    return s.state === 'on' ? 'Sim' : 'Não';
  }

  _setText(root, bind, value) {
    const el = root.querySelector(`[data-bind="${bind}"]`);
    if (el) el.textContent = value == null ? '--' : String(value);
  }

  _syncSelect(root, key) {
    const el = root.querySelector(`select[data-entity="${this._entity(key)}"]`);
    const s = this._st(key);
    if (!el || !s) return;
    const options = (s.attributes && s.attributes.options) || [];
    // Repopula opcoes so se mudaram (evita resetar enquanto aberto).
    const want = options.join('|');
    if (el.dataset.options !== want) {
      el.dataset.options = want;
      el.innerHTML = options.map((o) => `<option value="${BrunoRoborockSubview._escAttr(o)}">${BrunoRoborockSubview._esc(o)}</option>`).join('');
    }
    if (root.activeElement !== el) el.value = s.state;
  }

  _syncSlider(root, key) {
    const el = root.querySelector(`input[type="range"][data-entity="${this._entity(key)}"]`);
    const s = this._st(key);
    if (!el || !s) return;
    const a = s.attributes || {};
    if (a.min != null) el.min = a.min;
    if (a.max != null) el.max = a.max;
    if (a.step != null) el.step = a.step;
    if (root.activeElement !== el) el.value = s.state;
    const lbl = root.querySelector(`[data-bind="val-${key}"]`);
    if (lbl) lbl.textContent = Number.isFinite(Number(s.state)) ? s.state : '--';
  }

  _syncToggle(root, key) {
    const el = root.querySelector(`.rb-toggle[data-entity="${this._entity(key)}"]`);
    const s = this._st(key);
    if (!el) return;
    el.classList.toggle('is-on', !!s && s.state === 'on');
  }

  _syncTime(root, key) {
    const el = root.querySelector(`input[type="time"][data-entity="${this._entity(key)}"]`);
    const s = this._st(key);
    if (!el || !s) return;
    if (root.activeElement !== el) el.value = String(s.state || '').slice(0, 5);
  }

  // --- Eventos ------------------------------------------------------------

  _onClick(event) {
    const target = event.target && event.target.closest ? event.target.closest('[data-action]') : null;
    if (!target) return;
    const action = target.dataset.action;
    const vac = this._entity('vacuum');

    if (action === 'navigate-home') {
      event.preventDefault();
      this._navigateHome();
      return;
    }
    if (action === 'play-pause') {
      event.preventDefault();
      const s = this._st('vacuum');
      const active = s && BRUNO_ROBOROCK_ACTIVE.includes(String(s.state));
      this._call('vacuum', active ? 'pause' : 'start', { entity_id: vac });
      return;
    }
    if (action === 'return-base') {
      event.preventDefault();
      this._call('vacuum', 'return_to_base', { entity_id: vac });
      return;
    }
    if (action === 'locate') {
      event.preventDefault();
      this._call('vacuum', 'locate', { entity_id: vac });
      return;
    }
    if (action === 'toggle') {
      event.preventDefault();
      const id = target.dataset.entity;
      if (id) this._call('switch', 'toggle', { entity_id: id });
    }
  }

  _onChange(event) {
    const el = event.target;
    if (!el || !el.dataset || !el.dataset.entity) return;
    const id = el.dataset.entity;
    const kind = el.dataset.kind;
    if (kind === 'select') {
      this._call('select', 'select_option', { entity_id: id, option: el.value });
    } else if (kind === 'number') {
      if (event.type !== 'change') return; // so no fim do arraste
      this._call('number', 'set_value', { entity_id: id, value: Number(el.value) });
    } else if (kind === 'time') {
      const v = el.value && el.value.length === 5 ? `${el.value}:00` : el.value;
      this._call('time', 'set_value', { entity_id: id, time: v });
    }
  }

  _navigateHome() {
    const path = this._config && this._config.navigation_path;
    if (!path) return;
    globalThis.BrunoLiquidGlass && globalThis.BrunoLiquidGlass.routeTransition && globalThis.BrunoLiquidGlass.routeTransition();
    const resolved = path.startsWith('/') ? path : `/${(globalThis.location.pathname.split('/').filter(Boolean)[0] || 'ngocjohn-main')}/${path}`;
    globalThis.history.pushState(null, '', resolved);
    globalThis.dispatchEvent(new CustomEvent('location-changed', { detail: { replace: false } }));
  }

  // --- Relogio ------------------------------------------------------------

  _startClock() { if (!this._clockTimer) this._clockTimer = globalThis.setInterval(this._boundClock, 1000); }
  _stopClock() { if (this._clockTimer) { globalThis.clearInterval(this._clockTimer); this._clockTimer = null; } }
  _tickClock() {
    const c = BrunoRoborockSubview._clock();
    if (c === this._lastClock || !this.shadowRoot) return;
    this._lastClock = c;
    const el = this.shadowRoot.querySelector('[data-clock]');
    if (el) el.textContent = c;
    const d = this.shadowRoot.querySelector('[data-date]');
    if (d) d.textContent = BrunoRoborockSubview._date();
  }

  // --- Renderizadores de linha (markup) -----------------------------------

  static _infoRow(label, bind) {
    return `
      <div class="rb-row">
        <span class="rb-row-label">${BrunoRoborockSubview._esc(label)}</span>
        <span class="rb-row-value" data-bind="row-${bind}">--</span>
      </div>`;
  }

  static _statRow(label, bind) {
    return `
      <div class="rb-row rb-row-stat">
        <span class="rb-row-label">${BrunoRoborockSubview._esc(label)}</span>
        <span class="rb-row-value" data-bind="stat-${bind}">--</span>
      </div>`;
  }

  _selectRow(label, key) {
    const id = this._entity(key);
    return `
      <div class="rb-row rb-row-ctrl">
        <span class="rb-row-label">${BrunoRoborockSubview._esc(label)}</span>
        <select class="rb-select" data-entity="${BrunoRoborockSubview._escAttr(id)}" data-kind="select" data-options=""></select>
      </div>`;
  }

  _sliderRow(label, key) {
    const id = this._entity(key);
    return `
      <div class="rb-row rb-row-ctrl rb-row-slider">
        <span class="rb-row-label">${BrunoRoborockSubview._esc(label)} <em class="rb-val" data-bind="val-${key}">--</em></span>
        <input class="rb-range" type="range" data-entity="${BrunoRoborockSubview._escAttr(id)}" data-kind="number" min="0" max="100" step="1">
      </div>`;
  }

  _timeRow(label, key) {
    const id = this._entity(key);
    return `
      <div class="rb-row rb-row-ctrl">
        <span class="rb-row-label">${BrunoRoborockSubview._esc(label)}</span>
        <input class="rb-time" type="time" data-entity="${BrunoRoborockSubview._escAttr(id)}" data-kind="time">
      </div>`;
  }

  _toggleRow(label, key) {
    const id = this._entity(key);
    return `
      <div class="rb-row rb-row-ctrl">
        <span class="rb-row-label">${BrunoRoborockSubview._esc(label)}</span>
        <button class="rb-toggle" type="button" data-action="toggle" data-entity="${BrunoRoborockSubview._escAttr(id)}" aria-label="${BrunoRoborockSubview._escAttr(label)}">
          <span class="rb-knob"></span>
        </button>
      </div>`;
  }

  // --- Utilitarios estaticos ----------------------------------------------

  static _clock() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2, '0')}:${String(n.getMinutes()).padStart(2, '0')}`;
  }
  static _date() {
    const days = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
    const months = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const n = new Date();
    return `${days[n.getDay()]}, ${n.getDate()} ${months[n.getMonth()]}`;
  }
  static _cap(v) {
    if (v == null || v === '') return '--';
    const s = String(v);
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
  static _esc(v) {
    return String(v == null ? '' : v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
  static _escAttr(v) { return BrunoRoborockSubview._esc(v).replace(/'/g, '&#39;'); }

  static _styles() {
    return `
      :host {
        --rb-accent: var(--bruno-liquid-accent, 150, 190, 255);
        --rb-green: var(--bruno-liquid-green-accent, 46, 231, 122);
        --rb-warn: var(--bruno-liquid-warm-accent, 255, 183, 77);
        display: block;
        width: 100%;
        height: 100%;
        min-height: 0;
        /* Transparente: o FUNDO e central (na shell, via --bruno-section-backdrop).
           A secao so consome o padrao do core — sem hardcode por arquivo. */
        background: transparent;
        color: rgba(246,250,255,0.94);
        font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      }
      * { box-sizing: border-box; }
      button { font: inherit; color: inherit; cursor: pointer; }

      .rb-shell {
        height: 100%;
        display: grid;
        /* NOVO (ajuste 1): topo (altura das badges) / conteudo / rodape (altura
           da barra de acoes da Home) — igual as Cameras. As faixas de topo e
           base ficam reservadas; o conteudo NAO invade a base. */
        grid-template-rows: 64px minmax(0, 1fr) 74px;
        gap: 10px;
      }

      /* Rodape transparente (faixa inferior reservada, info simples). */
      .rb-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 12px;
      }
      .rb-foot-note {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: rgba(226,232,240,0.46);
        font-size: 12px;
        font-weight: 560;
        letter-spacing: 0.02em;
      }
      .rb-foot-note ha-icon { --mdc-icon-size: 16px; color: rgba(226,232,240,0.5); flex: 0 0 auto; }

      /* Header transparente (igual as demais subviews) */
      .rb-header {
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 0 6px;
        background: transparent;
      }
      .rb-back {
        width: 36px; height: 36px; display: grid; place-items: center;
        border: none; background: transparent; border-radius: 999px;
        color: rgba(226,232,240,0.82); transition: background 160ms ease;
      }
      .rb-back:hover, .rb-back:focus-visible { background: rgba(var(--rb-accent),0.16); color: #fff; outline: none; }
      .rb-brand { display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 14px; letter-spacing: 0.04em; color: rgba(226,232,240,0.72); }
      .rb-brand-strong { color: rgba(255,255,255,0.92); font-weight: 760; }
      .rb-brand-sep { color: rgba(255,255,255,0.32); }
      .rb-clock { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; font-variant-numeric: tabular-nums; font-size: 12px; color: rgba(255,255,255,0.86); }
      .rb-clock small { color: rgba(226,232,240,0.58); font-size: 10px; }

      .rb-body {
        min-height: 0;
        display: grid;
        grid-template-columns: 320px minmax(0, 1fr) 300px;
        gap: 10px;
      }

      /* Cartao glass compartilhado */
      .glass {
        position: relative;
        min-width: 0; min-height: 0;
        border-radius: var(--bruno-liquid-card-radius, 24px);
        background: var(--bruno-liquid-surface-off-background, rgba(8,12,20,0.44));
        border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
        box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 44px rgba(0,0,0,0.27));
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
      }

      .rb-col { padding: 14px; display: flex; flex-direction: column; gap: 10px; overflow: auto; scrollbar-width: none; }
      .rb-col::-webkit-scrollbar { display: none; }
      .rb-col-title { font-size: 12px; font-weight: 760; letter-spacing: 0.06em; text-transform: uppercase; color: rgba(226,232,240,0.62); }

      .rb-map { padding: 8px; overflow: hidden; }
      .rb-map-slot { width: 100%; height: 100%; min-height: 0; border-radius: 16px; overflow: hidden; }
      .rb-map-slot > * { width: 100%; height: 100%; display: block; }
      .rb-map-err { padding: 16px; color: #ffd9df; font-size: 12px; }

      /* Status hero */
      .rb-status {
        display: grid; grid-template-columns: auto minmax(0,1fr) auto; align-items: center; gap: 10px;
        padding: 12px; border-radius: 16px;
        background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.05));
        border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.11));
      }
      .rb-status-dot { width: 12px; height: 12px; border-radius: 999px; background: rgba(148,163,184,0.85); }
      .rb-status-dot.tone-active { background: rgb(var(--rb-green)); box-shadow: 0 0 12px rgba(var(--rb-green),0.6); }
      .rb-status-dot.tone-returning { background: rgb(var(--rb-accent)); box-shadow: 0 0 12px rgba(var(--rb-accent),0.6); }
      .rb-status-dot.tone-error { background: rgb(239,68,68); box-shadow: 0 0 12px rgba(239,68,68,0.6); }
      .rb-status-dot.tone-paused, .rb-status-dot.tone-idle { background: rgba(148,163,184,0.85); }
      .rb-status-name { display: block; font-size: 15px; font-weight: 760; color: #fff; }
      .rb-status-sub { display: block; font-size: 11px; color: rgba(226,232,240,0.6); margin-top: 2px; }
      .rb-battery { font-size: 15px; font-weight: 760; font-variant-numeric: tabular-nums; color: rgba(220,252,231,0.92); }

      .rb-rows { display: flex; flex-direction: column; }
      .rb-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 36px; padding: 4px 2px; }
      .rb-row + .rb-row { border-top: 1px solid rgba(255,255,255,0.05); }
      .rb-row-label { font-size: 12.5px; color: rgba(226,232,240,0.72); }
      .rb-row-label em { font-style: normal; color: rgba(255,255,255,0.9); font-weight: 700; }
      .rb-row-value { font-size: 12.5px; font-weight: 640; color: rgba(255,255,255,0.92); text-align: right; }
      .rb-row-stat .rb-row-value { font-variant-numeric: tabular-nums; }
      .rb-divider { height: 1px; background: rgba(255,255,255,0.08); margin: 4px 0; }

      .rb-row-ctrl { flex-wrap: wrap; }
      .rb-row-slider { flex-direction: column; align-items: stretch; gap: 6px; }

      /* Controles nativos estilizados */
      .rb-select {
        appearance: none; -webkit-appearance: none;
        max-width: 60%; padding: 6px 10px; border-radius: 10px;
        color: #fff; font: inherit; font-size: 12.5px;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
      }
      .rb-range { width: 100%; accent-color: rgb(var(--rb-accent)); }
      .rb-time {
        appearance: none; -webkit-appearance: none;
        padding: 5px 9px; border-radius: 10px; color: #fff; font: inherit; font-size: 12.5px;
        background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.14);
        color-scheme: dark;
      }

      .rb-toggle {
        width: 42px; height: 24px; border-radius: 999px; padding: 0; position: relative;
        border: 1px solid rgba(255,255,255,0.16); background: rgba(255,255,255,0.10);
        transition: background 200ms ease, border-color 200ms ease;
      }
      .rb-toggle .rb-knob {
        position: absolute; top: 2px; left: 2px; width: 18px; height: 18px; border-radius: 999px;
        background: #fff; box-shadow: 0 2px 5px rgba(0,0,0,0.35); transition: transform 220ms cubic-bezier(0.2,0.8,0.2,1);
      }
      .rb-toggle.is-on { background: rgba(var(--rb-accent),0.85); border-color: rgba(var(--rb-accent),0.9); }
      .rb-toggle.is-on .rb-knob { transform: translateX(18px); }

      /* Botoes de controle do vacuum */
      .rb-controls { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: auto; }
      .rb-ctrl {
        display: inline-flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px;
        height: 56px; border-radius: 14px; color: rgba(255,255,255,0.9);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.06));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.16));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.1));
        font-size: 10.5px; font-weight: 700;
        transition: background 160ms ease, border-color 160ms ease, transform 120ms ease;
      }
      .rb-ctrl ha-icon { --mdc-icon-size: 22px; }
      .rb-ctrl:hover, .rb-ctrl:focus-visible { border-color: rgba(var(--rb-accent),0.5); background: rgba(var(--rb-accent),0.16); outline: none; }
      .rb-ctrl:active { transform: translateY(1px) scale(0.985); }

      @media (max-width: 1100px) {
        .rb-body { grid-template-columns: 280px minmax(0,1fr); }
        .rb-settings { grid-column: 1 / -1; }
      }
    `;
  }
}

if (!customElements.get(BRUNO_ROBOROCK_SUBVIEW_TAG)) {
  customElements.define(BRUNO_ROBOROCK_SUBVIEW_TAG, BrunoRoborockSubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_ROBOROCK_SUBVIEW_TAG,
  name: 'Bruno Roborock Subview',
  description: 'Console do Roborock (Summary/Mapa/Settings) como secao da shell.',
});
