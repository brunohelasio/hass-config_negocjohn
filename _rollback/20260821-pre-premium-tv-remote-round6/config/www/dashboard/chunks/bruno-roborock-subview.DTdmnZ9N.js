const c = "bruno-roborock-subview", l = {
  title: "Casa",
  section: "Aspirador",
  entities: {
    vacuum: "vacuum.roborock_s7",
    error: "sensor.roborock_s7_vacuum_error",
    room: "sensor.roborock_s7_comodo_atual",
    mop_attached: "binary_sensor.roborock_s7_mop_attached",
    battery: "sensor.roborock_s7_bateria",
    mop_intensity: "select.roborock_s7_intensidade_do_mop",
    mop_mode: "select.roborock_s7_modo_mop",
    volume: "number.roborock_s7_volume",
    dnd: "switch.roborock_s7_nao_perturbe",
    dnd_start: "time.roborock_s7_comecar_nao_perturbe",
    dnd_end: "time.roborock_s7_terminar_nao_perturbe",
    dock_light: "switch.roborock_s7_dock_luz_indicadora_de_status",
    child_lock: "switch.roborock_s7_dock_bloqueio_infantil",
    area_last: "sensor.roborock_s7_area_de_limpeza",
    time_last: "sensor.roborock_s7_tempo_de_limpeza",
    area_total: "sensor.roborock_s7_area_total_de_limpeza",
    time_total: "sensor.roborock_s7_tempo_total_de_limpeza",
    count_total: "sensor.roborock_s7_contagem_total_de_limpeza",
    // Consumiveis / agua (na coluna da esquerda, onde ha espaco).
    brush_main: "sensor.roborock_s7_tempo_restante_da_escova_principal",
    brush_side: "sensor.roborock_s7_tempo_restante_da_escova_lateral",
    filter: "sensor.roborock_s7_tempo_restante_do_filtro",
    sensor_life: "sensor.roborock_s7_tempo_restante_do_sensor"
    // ORIGINAL (rollback 1a): consumiveis "Caixa d'agua" / "Falta de agua".
    // Retirados da exibicao (geravam scroll vertical na coluna). As chaves ficam
    // aqui comentadas para reativacao rapida (descomentar + re-adicionar o
    // _infoRow correspondente no markup e o _setText em _update).
    // water_box: 'binary_sensor.roborock_s7_water_box_attached',
    // water_short: 'binary_sensor.roborock_s7_water_shortage',
  },
  // Mapa: IDENTICO ao footer_vacuum.yaml (nao alterar entidades).
  // card_mod com base VH (sempre positivo, como o popup), para SOBRAR espaco a
  // barra de controles nativa (zona/segmento/executar) SEM quebrar a calibracao.
  // (A tentativa anterior com calc(100% - 96px) degenerava p/ 0 na init -> erro.)
  map: {
    type: "custom:xiaomi-vacuum-map-card",
    vacuum_platform: "Roborock",
    entity: "vacuum.roborock_s7",
    map_source: { camera: "image.roborock_s7_map_0_custom" },
    calibration_source: { camera: !0 },
    map_locked: !0,
    tiles: [],
    icons: [],
    card_mod: {
      style: `
        ha-card {
          height: calc(100vh - 146px) !important;
          max-height: calc(100vh - 146px) !important;
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
          max-height: calc(100vh - 254px) !important;
          padding: 0.35rem 0 0.25rem !important;
        }
        div.controls-wrapper { padding-top: 0; padding-bottom: 0; margin: 0; }
        div.map-controls-wrapper { padding: 2px 6px; }
        xvmc-zoom-buttons { display: none !important; }
        paper-button { --mdc-icon-size: 1.35em; color: #9da0a2 !important; padding: 0.32em; }
        #map-image { filter: brightness(0.85); }

        /* NOVO (2026-07-22) — consolidacao mobile: o mapa deixa de herdar a
           altura desktop baseada em 100vh e passa a respeitar o slot 1-coluna
           com aspecto definido pela subview. As regras acima ficam como
           ANTERIOR (rollback) para desktop/tablet. */
        @media (max-width: 800px) {
          ha-card {
            height: 100% !important;
            max-height: 100% !important;
            min-height: 0 !important;
          }
          div.map-wrapper {
            height: auto !important;
            /* ANTERIOR (rollback 2026-07-22): reservava apenas 84px para os
               controles nativos; no phone a segunda faixa ficava cortada.
               max-height: calc(100% - 84px) !important; */
            max-height: calc(100% - 112px) !important;
          }
          div.controls-wrapper {
            position: static !important;
            height: auto !important;
            min-height: 96px;
            overflow: visible !important;
          }
          div.map-controls-wrapper {
            box-sizing: border-box;
            margin-bottom: 4px;
          }
        }
      `
    }
  },
  navigation_path: "bento-lab"
}, p = {
  cleaning: { label: "Limpando", tone: "active" },
  segment_cleaning: { label: "Limpando cômodo", tone: "active" },
  room_cleaning: { label: "Limpando cômodo", tone: "active" },
  spot_cleaning: { label: "Limpeza pontual", tone: "active" },
  zoned_cleaning: { label: "Limpando zona", tone: "active" },
  moving: { label: "Movendo", tone: "active" },
  returning: { label: "Voltando à base", tone: "returning" },
  docked: { label: "Na base", tone: "idle" },
  idle: { label: "Ocioso", tone: "idle" },
  paused: { label: "Pausado", tone: "paused" },
  charging: { label: "Carregando", tone: "returning" },
  error: { label: "Erro", tone: "error" }
}, d = ["cleaning", "segment_cleaning", "room_cleaning", "spot_cleaning", "zoned_cleaning", "moving"];
class r extends HTMLElement {
  constructor() {
    super(), this._built = !1, this._mapEl = null, this._helpers = null, this._lastClock = r._clock(), this._boundClick = (t) => this._onClick(t), this._boundChange = (t) => this._onChange(t), this._boundClock = () => this._tickClock();
  }
  setConfig(t) {
    const a = t || {};
    this._config = {
      ...l,
      ...a,
      entities: { ...l.entities, ...a.entities || {} },
      map: { ...l.map, ...a.map || {} }
    };
  }
  set hass(t) {
    this._hass = t, this._built ? this._update() : this._build(), this._mapEl && (this._mapEl.hass = t);
  }
  getCardSize() {
    return 100;
  }
  connectedCallback() {
    globalThis.BrunoLiquidGlass && globalThis.BrunoLiquidGlass.apply && globalThis.BrunoLiquidGlass.apply(), this._startClock(), this._hass && !this._built && this._build();
  }
  disconnectedCallback() {
    this._stopClock();
  }
  // --- Helpers de estado --------------------------------------------------
  _entity(t) {
    return this._config && this._config.entities[t];
  }
  _st(t) {
    const a = this._entity(t);
    return a && this._hass && this._hass.states ? this._hass.states[a] : void 0;
  }
  _state(t, a = "--") {
    const e = this._st(t);
    return !e || ["unknown", "unavailable", "none", ""].includes(e.state) ? a : e.state;
  }
  _num(t, a = 0, e = "--") {
    const s = this._st(t), o = s ? Number.parseFloat(s.state) : NaN;
    return Number.isFinite(o) ? o.toFixed(a).replace(/\.0+$/, "") : e;
  }
  _unit(t) {
    const a = this._st(t);
    return a && a.attributes && a.attributes.unit_of_measurement || "";
  }
  _vacAttr(t) {
    const a = this._st("vacuum");
    return a && a.attributes ? a.attributes[t] : void 0;
  }
  _call(t, a, e) {
    this._hass && this._hass.callService(t, a, e || {});
  }
  // --- Construcao (uma vez) ----------------------------------------------
  _build() {
    this.shadowRoot || this.attachShadow({ mode: "open" }), this.shadowRoot.innerHTML = `
      <style>${r._styles()}</style>
      <main class="rb-shell">
        <header class="rb-header">
          <button class="rb-back" type="button" data-action="navigate-home" aria-label="Voltar">
            <bruno-icon icon="mdi:arrow-left"></bruno-icon>
          </button>
          <div class="rb-brand">
            <span class="rb-brand-main">${r._esc(this._config.title)}</span>
            <span class="rb-brand-sep" aria-hidden="true">·</span>
            <strong class="rb-brand-strong">${r._esc(this._config.section)}</strong>
          </div>
          <div class="rb-clock" aria-label="Horario">
            <span data-clock>${r._esc(this._lastClock)}</span>
            <small data-date>${r._esc(r._date())}</small>
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

            <!-- NOVO (2026-07-22) — consolidacao mobile:
                 wrapper neutro no desktop; no phone agrupa os detalhes que
                 passam para depois do mapa. O conteudo original foi preservado. -->
            <div class="rb-summary-details">
            <div class="rb-rows">
              ${r._infoRow("Erro", "error")}
              ${r._infoRow("Cômodo Atual", "room")}
              ${r._infoRow("Mop Acoplado", "mop")}
              ${r._infoRow("Bateria", "battery2")}
              ${r._infoRow("Fan Speed", "fan")}
            </div>

            <div class="rb-divider"></div>

            ${this._selectRow("Intensidade do Mop", "mop_intensity")}
            ${this._selectRow("Modo do Mop", "mop_mode")}

            <div class="rb-divider"></div>
            <div class="rb-col-title">Consumíveis</div>
            <div class="rb-rows">
              ${r._infoRow("Escova principal", "brush_main")}
              ${r._infoRow("Escova lateral", "brush_side")}
              ${r._infoRow("Filtro", "filter")}
              ${r._infoRow("Sensor", "sensor_life")}
            </div>
            </div>

            <div class="rb-controls">
              <button class="rb-ctrl" type="button" data-action="play-pause">
                <bruno-icon icon="mdi:play-pause"></bruno-icon><span data-bind="play-label">Iniciar</span>
              </button>
              <button class="rb-ctrl" type="button" data-action="return-base">
                <bruno-icon icon="mdi:home-map-marker"></bruno-icon><span>Base</span>
              </button>
              <button class="rb-ctrl" type="button" data-action="locate">
                <bruno-icon icon="mdi:map-marker"></bruno-icon><span>Localizar</span>
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
            ${this._sliderRow("Volume", "volume")}
            ${this._toggleRow("Não Perturbe", "dnd")}
            ${this._timeRow("Início NP", "dnd_start")}
            ${this._timeRow("Fim NP", "dnd_end")}
            ${this._toggleRow("Luz Indicadora", "dock_light")}
            ${this._toggleRow("Bloqueio Infantil", "child_lock")}

            <div class="rb-divider"></div>
            <div class="rb-col-title">Estatísticas</div>
            ${r._statRow("Área (Última)", "area_last")}
            ${r._statRow("Tempo (Última)", "time_last")}
            ${r._statRow("Área Total", "area_total")}
            ${r._statRow("Tempo Total", "time_total")}
            ${r._statRow("Nº de Limpezas", "count_total")}
          </section>
        </section>

        <footer class="rb-footer">
          <span class="rb-foot-note">
            <bruno-icon icon="mdi:robot-vacuum" aria-hidden="true"></bruno-icon>
            <span data-bind="foot">Roborock S7</span>
          </span>
        </footer>
      </main>
    `, this.shadowRoot.removeEventListener("click", this._boundClick), this.shadowRoot.removeEventListener("change", this._boundChange), this.shadowRoot.removeEventListener("input", this._boundChange), this.shadowRoot.addEventListener("click", this._boundClick), this.shadowRoot.addEventListener("change", this._boundChange), this.shadowRoot.addEventListener("input", this._boundChange), this._embedMap(), this._built = !0, this._update();
  }
  async _embedMap() {
    try {
      if (!this._helpers && globalThis.loadCardHelpers && (this._helpers = await globalThis.loadCardHelpers()), !this._helpers) return;
      const t = this.shadowRoot.querySelector('[data-bind="map-slot"]');
      if (!t) return;
      this._mapEl = this._helpers.createCardElement(this._config.map), this._hass && (this._mapEl.hass = this._hass), t.replaceChildren(this._mapEl);
    } catch (t) {
      const a = this.shadowRoot.querySelector('[data-bind="map-slot"]');
      a && (a.innerHTML = `<div class="rb-map-err">Mapa: ${r._esc(t && t.message)}</div>`);
    }
  }
  // --- Atualizacao in-place ----------------------------------------------
  _update() {
    if (!this.shadowRoot) return;
    const t = this.shadowRoot, a = this._st("vacuum"), e = a ? String(a.state) : "unknown", s = p[e] || { label: this._state("vacuum"), tone: "idle" };
    this._setText(t, "status-name", s.label), this._setText(t, "status-sub", this._state("room", "—"));
    const o = t.querySelector('[data-bind="status-dot"]');
    o && (o.className = `rb-status-dot tone-${s.tone}`), this._setText(t, "foot", `Roborock S7 · ${s.label}`);
    const i = this._num("battery", 0, "--");
    this._setText(t, "battery", i === "--" ? "--" : `${i}%`), this._setText(t, "row-error", this._state("error", "Sem erros")), this._setText(t, "row-room", this._state("room")), this._setText(t, "row-mop", this._st("mop_attached") ? this._st("mop_attached").state === "on" ? "Sim" : "Não" : "--"), this._setText(t, "row-battery2", i === "--" ? "--" : `${i}%`), this._setText(t, "row-fan", r._cap(this._vacAttr("fan_speed"))), this._setText(t, "row-brush_main", this._withUnit("brush_main")), this._setText(t, "row-brush_side", this._withUnit("brush_side")), this._setText(t, "row-filter", this._withUnit("filter")), this._setText(t, "row-sensor_life", this._withUnit("sensor_life")), this._syncSelect(t, "mop_intensity"), this._syncSelect(t, "mop_mode");
    const n = d.includes(e);
    this._setText(t, "play-label", n ? "Pausar" : "Iniciar"), this._syncSlider(t, "volume"), this._syncToggle(t, "dnd"), this._syncToggle(t, "dock_light"), this._syncToggle(t, "child_lock"), this._syncTime(t, "dnd_start"), this._syncTime(t, "dnd_end"), this._setText(t, "stat-area_last", this._withUnit("area_last")), this._setText(t, "stat-time_last", this._withUnit("time_last")), this._setText(t, "stat-area_total", this._withUnit("area_total")), this._setText(t, "stat-time_total", this._withUnit("time_total")), this._setText(t, "stat-count_total", this._withUnit("count_total"));
  }
  _withUnit(t) {
    const a = this._num(t, 2);
    if (a === "--") return "--";
    const e = this._unit(t);
    return e ? `${a} ${e}` : a;
  }
  _binYesNo(t) {
    const a = this._st(t);
    return !a || ["unknown", "unavailable", "none", ""].includes(a.state) ? "--" : a.state === "on" ? "Sim" : "Não";
  }
  _setText(t, a, e) {
    const s = t.querySelector(`[data-bind="${a}"]`);
    s && (s.textContent = e == null ? "--" : String(e));
  }
  _syncSelect(t, a) {
    const e = t.querySelector(`select[data-entity="${this._entity(a)}"]`), s = this._st(a);
    if (!e || !s) return;
    const o = s.attributes && s.attributes.options || [], i = o.join("|");
    e.dataset.options !== i && (e.dataset.options = i, e.innerHTML = o.map((n) => `<option value="${r._escAttr(n)}">${r._esc(n)}</option>`).join("")), t.activeElement !== e && (e.value = s.state);
  }
  _syncSlider(t, a) {
    const e = t.querySelector(`input[type="range"][data-entity="${this._entity(a)}"]`), s = this._st(a);
    if (!e || !s) return;
    const o = s.attributes || {};
    o.min != null && (e.min = o.min), o.max != null && (e.max = o.max), o.step != null && (e.step = o.step), t.activeElement !== e && (e.value = s.state);
    const i = t.querySelector(`[data-bind="val-${a}"]`);
    i && (i.textContent = Number.isFinite(Number(s.state)) ? s.state : "--");
  }
  _syncToggle(t, a) {
    const e = t.querySelector(`.rb-toggle[data-entity="${this._entity(a)}"]`), s = this._st(a);
    e && e.classList.toggle("is-on", !!s && s.state === "on");
  }
  _syncTime(t, a) {
    const e = t.querySelector(`input[type="time"][data-entity="${this._entity(a)}"]`), s = this._st(a);
    !e || !s || t.activeElement !== e && (e.value = String(s.state || "").slice(0, 5));
  }
  // --- Eventos ------------------------------------------------------------
  _onClick(t) {
    const a = t.target && t.target.closest ? t.target.closest("[data-action]") : null;
    if (!a) return;
    const e = a.dataset.action, s = this._entity("vacuum");
    if (e === "navigate-home") {
      t.preventDefault(), this._navigateHome();
      return;
    }
    if (e === "play-pause") {
      t.preventDefault();
      const o = this._st("vacuum"), i = o && d.includes(String(o.state));
      this._call("vacuum", i ? "pause" : "start", { entity_id: s });
      return;
    }
    if (e === "return-base") {
      t.preventDefault(), this._call("vacuum", "return_to_base", { entity_id: s });
      return;
    }
    if (e === "locate") {
      t.preventDefault(), this._call("vacuum", "locate", { entity_id: s });
      return;
    }
    if (e === "toggle") {
      t.preventDefault();
      const o = a.dataset.entity;
      o && this._call("switch", "toggle", { entity_id: o });
    }
  }
  _onChange(t) {
    const a = t.target;
    if (!a || !a.dataset || !a.dataset.entity) return;
    const e = a.dataset.entity, s = a.dataset.kind;
    if (s === "select")
      this._call("select", "select_option", { entity_id: e, option: a.value });
    else if (s === "number") {
      if (t.type !== "change") return;
      this._call("number", "set_value", { entity_id: e, value: Number(a.value) });
    } else if (s === "time") {
      const o = a.value && a.value.length === 5 ? `${a.value}:00` : a.value;
      this._call("time", "set_value", { entity_id: e, time: o });
    }
  }
  _navigateHome() {
    const t = this._config && this._config.navigation_path;
    if (!t) return;
    globalThis.BrunoLiquidGlass && globalThis.BrunoLiquidGlass.routeTransition && globalThis.BrunoLiquidGlass.routeTransition();
    const a = t.startsWith("/") ? t : `/${globalThis.location.pathname.split("/").filter(Boolean)[0] || "ngocjohn-main"}/${t}`;
    globalThis.history.pushState(null, "", a), globalThis.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: !1 } }));
  }
  // --- Relogio ------------------------------------------------------------
  _startClock() {
    this._clockTimer || (this._clockTimer = globalThis.setInterval(this._boundClock, 1e3));
  }
  _stopClock() {
    this._clockTimer && (globalThis.clearInterval(this._clockTimer), this._clockTimer = null);
  }
  _tickClock() {
    const t = r._clock();
    if (t === this._lastClock || !this.shadowRoot) return;
    this._lastClock = t;
    const a = this.shadowRoot.querySelector("[data-clock]");
    a && (a.textContent = t);
    const e = this.shadowRoot.querySelector("[data-date]");
    e && (e.textContent = r._date());
  }
  // --- Renderizadores de linha (markup) -----------------------------------
  static _infoRow(t, a) {
    return `
      <div class="rb-row">
        <span class="rb-row-label">${r._esc(t)}</span>
        <span class="rb-row-value" data-bind="row-${a}">--</span>
      </div>`;
  }
  static _statRow(t, a) {
    return `
      <div class="rb-row rb-row-stat">
        <span class="rb-row-label">${r._esc(t)}</span>
        <span class="rb-row-value" data-bind="stat-${a}">--</span>
      </div>`;
  }
  _selectRow(t, a) {
    const e = this._entity(a);
    return `
      <div class="rb-row rb-row-ctrl">
        <span class="rb-row-label">${r._esc(t)}</span>
        <select class="rb-select" data-entity="${r._escAttr(e)}" data-kind="select" data-options=""></select>
      </div>`;
  }
  _sliderRow(t, a) {
    const e = this._entity(a);
    return `
      <div class="rb-row rb-row-ctrl rb-row-slider">
        <span class="rb-row-label">${r._esc(t)} <em class="rb-val" data-bind="val-${a}">--</em></span>
        <input class="rb-range" type="range" data-entity="${r._escAttr(e)}" data-kind="number" min="0" max="100" step="1">
      </div>`;
  }
  _timeRow(t, a) {
    const e = this._entity(a);
    return `
      <div class="rb-row rb-row-ctrl">
        <span class="rb-row-label">${r._esc(t)}</span>
        <input class="rb-time" type="time" data-entity="${r._escAttr(e)}" data-kind="time">
      </div>`;
  }
  _toggleRow(t, a) {
    const e = this._entity(a);
    return `
      <div class="rb-row rb-row-ctrl">
        <span class="rb-row-label">${r._esc(t)}</span>
        <button class="rb-toggle" type="button" data-action="toggle" data-entity="${r._escAttr(e)}" aria-label="${r._escAttr(t)}">
          <span class="rb-knob"></span>
        </button>
      </div>`;
  }
  // --- Utilitarios estaticos ----------------------------------------------
  static _clock() {
    const t = /* @__PURE__ */ new Date();
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }
  static _date() {
    const t = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"], a = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"], e = /* @__PURE__ */ new Date();
    return `${t[e.getDay()]}, ${e.getDate()} ${a[e.getMonth()]}`;
  }
  static _cap(t) {
    if (t == null || t === "") return "--";
    const a = String(t);
    return a.charAt(0).toUpperCase() + a.slice(1);
  }
  static _esc(t) {
    return String(t ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escAttr(t) {
    return r._esc(t).replace(/'/g, "&#39;");
  }
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
        grid-template-rows: 48px minmax(0, 1fr) 54px;
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
      .rb-foot-note bruno-icon { --mdc-icon-size: 16px; color: rgba(226,232,240,0.5); flex: 0 0 auto; }

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
        visibility: hidden;
        pointer-events: none;
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

      /* NOVO (2026-07-22) — consolidacao mobile:
         o wrapper nao altera a composicao desktop/tablet. */
      .rb-summary-details { display: contents; }

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
      .rb-ctrl bruno-icon { --mdc-icon-size: 22px; }
      .rb-ctrl:hover, .rb-ctrl:focus-visible { border-color: rgba(var(--rb-accent),0.5); background: rgba(var(--rb-accent),0.16); outline: none; }
      .rb-ctrl:active { transform: translateY(1px) scale(0.985); }

      @media (max-width: 1100px) {
        .rb-body { grid-template-columns: 280px minmax(0,1fr); }
        .rb-settings { grid-column: 1 / -1; }
      }

      /* NOVO (2026-07-22) — consolidacao mobile.
         As regras desktop/tablet anteriores permanecem acima para rollback.
         No phone, a shell externa e a unica proprietaria do scroll vertical. */
      @media (max-width: 800px) {
        :host {
          height: auto;
          min-height: 0;
          overflow: visible;
        }

        .rb-shell {
          height: auto;
          min-height: 0;
          grid-template-rows: 44px auto 34px;
          gap: 8px;
          overflow: visible;
          padding-bottom: max(0px, env(safe-area-inset-bottom));
        }

        .rb-header {
          min-height: 44px;
          grid-template-columns: 32px minmax(0, 1fr) auto;
          gap: 8px;
          padding: 0 4px;
        }

        .rb-brand {
          justify-content: flex-start;
          gap: 6px;
          font-size: 12px;
        }

        .rb-clock { font-size: 11px; }
        .rb-clock small { font-size: 9px; }

        .rb-body {
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          grid-auto-rows: auto;
          gap: 10px;
          overflow: visible;
        }

        /* A summary deixa de ser uma coluna unica apenas no phone. Assim,
           status e comandos podem vir antes do mapa, sem duplicar entidades. */
        .rb-summary {
          display: contents;
        }

        .rb-status {
          order: 1;
          min-height: 68px;
          padding: 12px 14px;
          border-radius: 18px;
          background: var(--bruno-liquid-surface-off-background, rgba(8,12,20,0.44));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 44px rgba(0,0,0,0.27));
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
        }

        .rb-controls {
          order: 2;
          margin-top: 0;
          padding: 10px;
          border-radius: 18px;
          background: var(--bruno-liquid-surface-off-background, rgba(8,12,20,0.44));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 44px rgba(0,0,0,0.27));
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
        }

        .rb-ctrl {
          min-height: 56px;
          height: 56px;
        }

        .rb-map {
          order: 3;
          width: min(100%, 560px);
          height: auto;
          /* ANTERIOR (rollback 2026-07-22): 1 / 1.08 mantinha o mapa grande,
             mas nao deixava altura para os controles inferiores completos.
             aspect-ratio: 1 / 1.08; */
          aspect-ratio: 5 / 6;
          justify-self: center;
          padding: 7px;
          overflow: hidden;
        }

        .rb-map-slot,
        .rb-map-slot > * {
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .rb-summary-details {
          order: 4;
          min-width: 0;
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow: visible;
          border-radius: var(--bruno-liquid-card-radius, 24px);
          background: var(--bruno-liquid-surface-off-background, rgba(8,12,20,0.44));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 44px rgba(0,0,0,0.27));
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.6));
        }

        .rb-settings {
          order: 5;
          grid-column: auto;
        }

        .rb-col,
        .rb-settings {
          height: auto;
          max-height: none;
          overflow: visible;
        }

        .rb-footer {
          min-height: 34px;
          height: 34px;
          padding: 0 8px;
        }

        .rb-foot-note { font-size: 11px; }
      }
    `;
  }
}
customElements.get(c) || customElements.define(c, r);
window.customCards = window.customCards || [];
window.customCards.push({
  type: c,
  name: "Bruno Roborock Subview",
  description: "Console do Roborock (Summary/Mapa/Settings) como secao da shell."
});
//# sourceMappingURL=bruno-roborock-subview.DTdmnZ9N.js.map
