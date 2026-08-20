const b = "bruno-planta-3d-subview", _ = "20260718-floorplan-premium-1", g = [
  { point: 1, entity: "light.sala_2_switch_2", room: "VR", name: "Luz principal", x: 24.43, y: 6.87 },
  { point: 2, entity: "light.varanda_switch_2", room: "VR", name: "Pendente", x: 24.57, y: 12.84 },
  { point: 3, entity: "light.sala_2_switch_3", room: "VR", name: "Cristaleira", x: 41.1, y: 13.93 },
  { point: 4, entity: "light.suite_casal_switch_2", room: "QCS", name: "Luz azul", x: 60.4, y: 15.69 },
  { point: 5, entity: "light.suite_casal_switch_1", room: "QCS", name: "Luz principal", x: 68.8, y: 15.96 },
  { point: 6, entity: "light.varanda_switch_1", room: "VR", name: "Area gourmet", x: 5.14, y: 15.43 },
  { point: 7, entity: "light.office_switch_2", room: "OF", name: "Luz ambiente", x: 47.75, y: 12.78 },
  { point: 8, entity: "light.sala_switch_1", room: "SL", name: "Led esquerdo", x: 24.27, y: 20.36 },
  { point: 10, entity: "light.office_switch_3", room: "OF", name: "Luz central", x: 52.73, y: 27.46 },
  { point: 11, entity: "light.sala_switch_2", room: "SL", name: "Luz principal", x: 24.4, y: 30.85 },
  { point: 12, entity: "light.quarto_casal_2_switch_2", room: "QC", name: "Luz sanca", x: 92.37, y: 31.02 },
  { point: 13, entity: "light.quarto_casal_switch_2", room: "QC", name: "Luzes closet", x: 64.53, y: 31.7 },
  { point: 14, entity: "light.qc_luz_principal", room: "QC", name: "Luz principal", x: 75.82, y: 33.06 },
  { point: 15, entity: "light.office_switch_1", room: "OF", name: "Luz estante", x: 47.39, y: 35.78 },
  { point: 16, entity: "light.quarto_casal_switch_1", room: "QC", name: "Luzes quadros", x: 85.76, y: 39.98 },
  { point: 17, entity: "light.quarto_marina_switch_2", room: "QMA", name: "Estante", x: 78.31, y: 45.27 },
  { point: 18, entity: "light.sala_switch_3", room: "SL", name: "Led direito", x: 24.14, y: 45.39 },
  { point: 19, entity: "light.corredor_switch_1", room: "COR", name: "Luz principal", x: 58.19, y: 46.22 },
  { point: 20, entity: "light.quarto_marina_switch_1", room: "QMA", name: "Arandela", x: 91.54, y: 49.88 },
  { point: 21, entity: "light.quarto_miguel_2_switch_2", room: "QMI", name: "Arandela poltrona", x: 54.88, y: 51.78 },
  { point: 22, entity: "light.lavabo_switch_2", room: "LV", name: "Luz principal", x: 20.42, y: 53.36 },
  { point: 23, entity: "light.quarto_miguel_switch_1", room: "QMI", name: "Prateleiras", x: 46.48, y: 53.73 },
  { point: 24, entity: "light.lavabo_switch_3", room: "LV", name: "Luz espelho", x: 23.88, y: 57.65 },
  { point: 25, entity: "light.lavabo_switch_1", room: "LV", name: "Luz parede", x: 16.05, y: 57.91 },
  { point: 26, entity: "light.quarto_marina_switch_4", room: "QMA", name: "Luz principal", x: 82.86, y: 61.14 },
  { point: 27, entity: "light.quarto_marina_switch_3", room: "QMA", name: "Cortineiro", x: 92.92, y: 61.96 },
  { point: 28, entity: "light.cozinha_switch_2", room: "CZ", name: "Luz principal 1", x: 37.8, y: 61.01 },
  { point: 29, entity: "light.cozinha_switch_3", room: "CZ", name: "Luz principal 2", x: 32.42, y: 60.74 },
  { point: 30, entity: "light.quarto_miguel_2_switch_1", room: "QMI", name: "Luzes armario", x: 47.2, y: 62.96 },
  { point: 31, entity: "light.quarto_miguel_switch_2", room: "QMI", name: "Luz principal", x: 53.93, y: 62.96 },
  { point: 32, entity: "light.suite_miguel_switch_1", room: "QMIS", name: "Luz principal", x: 68.25, y: 62.09 },
  { point: 33, entity: "light.quarto_miguel_2_switch_3", room: "QMI", name: "Arandela berco", x: 46.61, y: 71.94 },
  { point: 34, entity: "light.suite_miguel_switch_2", room: "QMIS", name: "Luz azul", x: 68.12, y: 71.45 },
  { point: 35, entity: "light.suite_marina_switch_2", room: "QMAS", name: "Luz principal", x: 82.3, y: 73.63 },
  { point: 36, entity: "light.suite_marina_switch_1", room: "QMAS", name: "Luz azul", x: 90.85, y: 73.76 },
  { point: 37, entity: "light.quarto_miguel_switch_3", room: "QMI", name: "Cortineiro", x: 54.33, y: 73.63 },
  { point: 38, entity: "light.cozinha_switch_1", room: "AS", name: "Lavanderia", x: 34.83, y: 80.07 }
], u = [
  {
    point: 1,
    entity: "light.sala_2_switch_2",
    room: "VR",
    name: "Luz principal",
    shape: "rect",
    x: 10.14,
    y: 7.71,
    width: 26.97,
    height: 9.99
  },
  {
    point: 8,
    entity: "light.sala_switch_1",
    room: "SL",
    name: "Led esquerdo",
    shape: "polyline",
    points: [[5.26, 45.9], [5.26, 22.25], [42.5, 22.25]]
  },
  {
    point: 18,
    entity: "light.sala_switch_3",
    room: "SL",
    name: "Led direito",
    shape: "polyline",
    points: [[7.7, 45.9], [36.47, 45.9]]
  },
  {
    point: 19,
    entity: "light.corredor_switch_1",
    room: "COR",
    name: "Luz principal",
    shape: "polyline",
    points: [[46.61, 45.9], [70.88, 45.9]]
  },
  {
    point: 14,
    entity: "light.qc_luz_principal",
    room: "QC",
    name: "Luz principal",
    shape: "polyline",
    points: [[75.63, 37.55], [75.63, 23.52], [88.47, 23.52]]
  },
  {
    point: 29,
    entity: "light.cozinha_switch_3",
    room: "CZ",
    name: "Luz principal 2",
    shape: "polyline",
    points: [[32.36, 54.11], [32.36, 73.59]]
  },
  {
    point: 28,
    entity: "light.cozinha_switch_2",
    room: "CZ",
    name: "Luz principal 1",
    shape: "polyline",
    points: [[37.37, 54.24], [37.37, 73.59]]
  },
  {
    point: 31,
    entity: "light.quarto_miguel_switch_2",
    room: "QMI",
    name: "Luz principal",
    shape: "rect",
    x: 50.07,
    y: 55.26,
    width: 9,
    height: 14.79
  }
], v = [
  {
    id: "sala_varanda",
    label: "Sala e Varanda",
    shortLabel: "Sala + Varanda",
    icon: "mdi:sofa",
    codes: ["SL", "VR"],
    x: 23.8,
    y: 26.2,
    focusX: 23.12,
    focusY: 26.13,
    scale: 2.22
  },
  {
    id: "office",
    label: "Office",
    shortLabel: "Office",
    icon: "mdi:desk",
    codes: ["OF"],
    x: 50,
    y: 23,
    focusX: 50,
    focusY: 25,
    scale: 2.15
  },
  {
    id: "quarto_casal",
    label: "Quarto do Casal",
    shortLabel: "Q. Casal",
    icon: "mdi:bed-king",
    codes: ["QC", "QCS"],
    x: 78,
    y: 27,
    focusX: 75.5,
    focusY: 27.5,
    scale: 2.05
  },
  {
    id: "quarto_marina",
    label: "Quarto Marina",
    shortLabel: "Q. Marina",
    icon: "mdi:bed-single",
    codes: ["QMA", "QMAS"],
    x: 86,
    y: 58,
    focusX: 76.7,
    focusY: 60,
    scale: 2.15
  },
  {
    id: "quarto_miguel",
    label: "Quarto Miguel",
    shortLabel: "Q. Miguel",
    icon: "mdi:crib",
    codes: ["QMI", "QMIS"],
    x: 56,
    y: 65,
    focusX: 57,
    focusY: 63,
    scale: 2.15
  },
  {
    id: "cozinha",
    label: "Cozinha e Área de Serviço",
    shortLabel: "Cozinha",
    icon: "mdi:countertop-outline",
    codes: ["CZ", "AS"],
    x: 35,
    y: 70,
    focusX: 35,
    focusY: 69,
    scale: 2.6
  },
  {
    id: "lavabo",
    label: "Lavabo",
    shortLabel: "Lavabo",
    icon: "mdi:toilet",
    codes: ["LV"],
    x: 19,
    y: 55,
    focusX: 20,
    focusY: 56,
    scale: 3.1
  },
  {
    id: "circulacao",
    label: "Circulação",
    shortLabel: "Circulação",
    icon: "mdi:floor-plan",
    codes: ["COR"],
    x: 58,
    y: 46,
    focusX: 58,
    focusY: 46,
    scale: 2.4
  }
], y = {
  1: "Varanda · Principal",
  2: "Varanda · Pendente",
  3: "Varanda · Cristaleira",
  4: "Suíte · Luz azul",
  5: "Suíte · Principal",
  6: "Varanda · Área gourmet",
  7: "Ambiente",
  8: "Sala · LED esquerdo",
  10: "Central",
  11: "Sala · Principal",
  12: "Sanca",
  13: "Closet",
  14: "Quarto · Principal",
  15: "Estante",
  16: "Quadros",
  17: "Estante",
  18: "Sala · LED direito",
  19: "Principal",
  20: "Arandela",
  21: "Arandela da poltrona",
  22: "Principal",
  23: "Prateleiras",
  24: "Espelho",
  25: "Parede",
  26: "Quarto · Principal",
  27: "Cortineiro",
  28: "Principal 1",
  29: "Principal 2",
  30: "Armários",
  31: "Quarto · Principal",
  32: "Suíte · Principal",
  33: "Arandela do berço",
  34: "Suíte · Luz azul",
  35: "Suíte · Principal",
  36: "Suíte · Luz azul",
  37: "Cortineiro",
  38: "Área de serviço · Lavanderia"
};
class r extends HTMLElement {
  constructor() {
    super(), this._config = null, this._hass = null, this._clockTimer = null, this._lastAction = "", this._lastToggleAt = 0, this._lastMobileToggleByEntity = /* @__PURE__ */ new Map(), this._selectedRoom = "", this._activePointer = null, this._suppressClickUntil = 0, this._boundClick = this._handleClick.bind(this), this._boundKeydown = this._handleKeydown.bind(this), this._boundPointerDown = this._handlePointerDown.bind(this), this._boundPointerMove = this._handlePointerMove.bind(this), this._boundPointerUp = this._handlePointerUp.bind(this), this._boundPointerCancel = this._handlePointerCancel.bind(this);
  }
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      title: "Planta 3D",
      section: "Luzes",
      image: "/local/images/planta_apartamento_home_assistant.png",
      markers: g,
      ledStrips: u,
      ...e
    }, this._render();
  }
  set hass(e) {
    this._hass = e, this._render();
  }
  connectedCallback() {
    this._startClock();
  }
  disconnectedCallback() {
    window.clearInterval(this._clockTimer), this._clockTimer = null, this.shadowRoot?.removeEventListener("click", this._boundClick), this.shadowRoot?.removeEventListener("keydown", this._boundKeydown), this.shadowRoot?.removeEventListener("pointerdown", this._boundPointerDown), this.shadowRoot?.removeEventListener("pointermove", this._boundPointerMove), this.shadowRoot?.removeEventListener("pointerup", this._boundPointerUp), this.shadowRoot?.removeEventListener("pointercancel", this._boundPointerCancel);
  }
  getCardSize() {
    return 8;
  }
  _markers() {
    return (Array.isArray(this._config?.markers) ? this._config.markers : g).filter((t) => t?.entity).map((t) => ({
      point: Number(t.point),
      entity: String(t.entity).trim(),
      room: t.room || "",
      name: t.name || t.entity,
      x: Number(t.x),
      y: Number(t.y)
    })).filter((t) => Number.isFinite(t.x) && Number.isFinite(t.y));
  }
  _ledStrips() {
    return (Array.isArray(this._config?.ledStrips) ? this._config.ledStrips : u).filter((t) => t?.entity && t?.shape).map((t) => ({
      point: Number(t.point),
      entity: String(t.entity).trim(),
      room: t.room || "",
      name: t.name || t.entity,
      shape: t.shape,
      x: Number(t.x),
      y: Number(t.y),
      width: Number(t.width),
      height: Number(t.height),
      points: Array.isArray(t.points) ? t.points : []
    })).filter((t) => Number.isFinite(t.point) ? t.shape === "rect" ? [t.x, t.y, t.width, t.height].every(Number.isFinite) : t.shape === "polyline" && t.points.length >= 2 && t.points.every((o) => Array.isArray(o) && o.length === 2 && Number.isFinite(Number(o[0])) && Number.isFinite(Number(o[1]))) : !1);
  }
  _visibleMarkers(e, t) {
    const o = new Set(t.map((i) => i.point));
    return e.filter((i) => !o.has(i.point));
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isOn(e) {
    return this._state(e)?.state === "on";
  }
  _isUnavailable(e) {
    const t = this._state(e)?.state;
    return !t || t === "unknown" || t === "unavailable";
  }
  _counts(e) {
    return e.reduce((t, o) => (this._isOn(o.entity) && (t.on += 1), this._isUnavailable(o.entity) && (t.unavailable += 1), t), { on: 0, unavailable: 0 });
  }
  _mobileRooms() {
    return v;
  }
  _mobileRoom(e) {
    return this._mobileRooms().find((t) => t.id === e) || null;
  }
  _mobileRoomIdForCode(e) {
    return this._mobileRooms().find((t) => t.codes.includes(e))?.id || "";
  }
  _mobileRoomMarkers(e, t = this._markers()) {
    const o = this._mobileRoom(e);
    return o ? t.filter((i) => o.codes.includes(i.room)) : [];
  }
  _mobileLightName(e) {
    const t = y[e.point];
    if (t) return t;
    const o = String(e.name || e.entity).replace(/^Luz\s+/i, "").replace(/^Luzes\s+/i, "");
    return this._mobileRoomIdForCode(e.room) === "sala_varanda" ? `${e.room === "VR" ? "Varanda" : "Sala"} · ${o}` : e.room === "AS" ? `Área de serviço · ${o}` : ["QCS", "QMIS", "QMAS"].includes(e.room) ? `Suíte · ${o}` : ["QC", "QMI", "QMA"].includes(e.room) && /principal/i.test(o) ? "Quarto · Principal" : o;
  }
  _mobileCountLabel(e, t) {
    return `${e} de ${t} ${t === 1 ? "luz acesa" : "luzes acesas"}`;
  }
  _handlePointerDown(e) {
    if (e.target?.closest?.("[data-action]")) {
      if (this._activePointer && this._activePointer.id !== e.pointerId) {
        this._activePointer = null, this._suppressClickUntil = Date.now() + 500;
        return;
      }
      this._activePointer = {
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        moved: !1
      };
    }
  }
  _handlePointerMove(e) {
    const t = this._activePointer;
    if (!t || t.id !== e.pointerId) return;
    Math.max(
      Math.abs(e.clientX - t.x),
      Math.abs(e.clientY - t.y)
    ) > 10 && (t.moved = !0);
  }
  _handlePointerUp(e) {
    const t = this._activePointer;
    !t || t.id !== e.pointerId || (t.moved && (this._suppressClickUntil = Date.now() + 500), this._activePointer = null);
  }
  _handlePointerCancel() {
    this._activePointer && (this._suppressClickUntil = Date.now() + 500), this._activePointer = null;
  }
  // ORIGINAL (rollback) — click tratava apenas toggle e usava debounce global:
  // _handleClick(event) {
  //   const control = event.target?.closest?.('[data-action="toggle-light"]');
  //   if (!control) return;
  //   event.preventDefault();
  //   event.stopPropagation();
  //   const point = Number(control.dataset.point);
  //   const marker = this._markers().find((item) => item.point === point);
  //   if (!marker || this._isUnavailable(marker.entity)) return;
  //   const now = Date.now();
  //   if (now - this._lastToggleAt < 420) return;
  //   this._lastToggleAt = now;
  //   this._lastAction = `${marker.room} ${marker.name}`.trim();
  //   control.classList.add('is-pressed');
  //   window.setTimeout(() => control.classList.remove('is-pressed'), 180);
  //   globalThis.BrunoLiquidGlass?.feedback?.('tap');
  //   this._hass?.callService?.('light', 'toggle', { entity_id: marker.entity });
  //   this._renderFooter();
  // }
  _handleClick(e) {
    const t = e.target?.closest?.("[data-action]");
    if (!t || (e.preventDefault(), e.stopPropagation(), Date.now() < this._suppressClickUntil)) return;
    if (t.dataset.action === "select-room") {
      const s = t.dataset.room || "";
      if (s && !this._mobileRoom(s) || s === this._selectedRoom) return;
      this._selectedRoom = s, globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._render();
      return;
    }
    if (t.dataset.action !== "toggle-light") return;
    const o = Number(t.dataset.point), i = this._markers().find((s) => s.point === o);
    if (!i || this._isUnavailable(i.entity)) return;
    const a = Date.now();
    if (t.dataset.mobileControl === "true") {
      const s = this._lastMobileToggleByEntity.get(i.entity) || 0;
      if (a - s < 420) return;
      this._lastMobileToggleByEntity.set(i.entity, a);
    } else {
      if (a - this._lastToggleAt < 420) return;
      this._lastToggleAt = a;
    }
    this._lastAction = this._mobileLightName(i), t.classList.add("is-pressed"), window.setTimeout(() => t.classList.remove("is-pressed"), 180), globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._hass?.callService?.("light", "toggle", { entity_id: i.entity }), this._renderFooter();
  }
  _handleKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const t = e.target?.closest?.("[data-action]");
    !t || t.matches("button") || this._handleClick(e);
  }
  _startClock() {
    this._clockTimer || (this._clockTimer = window.setInterval(() => this._renderClock(), 3e4), this._renderClock());
  }
  _renderClock() {
    if (!this.shadowRoot) return;
    const e = this.shadowRoot.querySelector("[data-clock]"), t = this.shadowRoot.querySelector("[data-date]");
    e && (e.textContent = r._clock()), t && (t.textContent = r._date());
  }
  _renderFooter() {
    if (!this.shadowRoot) return;
    const e = this.shadowRoot.querySelector(".floorplan-footer");
    if (!e) return;
    const t = this._markers(), o = this._counts(t);
    e.innerHTML = this._footerTemplate(t, o);
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._markers(), t = this._ledStrips(), o = this._visibleMarkers(e, t), i = this._counts(e), a = this._mobileRoom(this._selectedRoom);
    this._selectedRoom && !a && (this._selectedRoom = "");
    const n = a ? this._mobileRoomMarkers(a.id, e) : [], s = a ? [
      `--focus-x:${a.focusX}%`,
      `--focus-y:${a.focusY}%`,
      `--focus-scale:${a.scale}`,
      `--focus-hit:${r._fmt(48 / a.scale)}px`,
      `--focus-disc:${r._fmt(32 / a.scale)}px`,
      `--focus-icon:${r._fmt(16 / a.scale)}px`
    ].join(";") : "";
    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main class="floorplan-shell">
        <header class="floorplan-topbar">
          <div class="brand">
            <span>${r._escape(this._config.title)}</span>
            <span class="divider" aria-hidden="true"></span>
            <strong>${r._escape(this._config.section)}</strong>
          </div>

          <div class="clock-block" aria-label="Horario atual">
            <span data-clock>${r._escape(r._clock())}</span>
            <small data-date>${r._escape(r._date())}</small>
          </div>
        </header>

        <section class="map-area ${a ? "has-mobile-focus" : "has-mobile-overview"}" aria-label="Planta 3D interativa">
          <div
            class="plan-wrap ${a ? "is-mobile-focused" : "is-mobile-overview"}"
            style="--plan-fallback-image:url('${r._escapeAttr(r._cssUrl(this._config.image))}');${s}"
          >
            <img
              data-plan-image
              src="${r._escapeAttr(this._assetUrl(this._config.image))}"
              data-fallback-src="${r._escapeAttr(this._config.image)}"
              alt="Planta 3D do apartamento"
              draggable="false"
            >
            <div class="led-strips-layer" aria-label="Perfis de LED">
              ${t.map((l) => this._stripTemplate(l)).join("")}
            </div>
            <div class="markers-layer">
              ${o.map((l) => this._markerTemplate(l)).join("")}
            </div>
            <div class="mobile-room-layer" aria-label="Ambientes da residência">
              ${this._mobileRooms().map((l) => this._mobileRoomHotspotTemplate(l, e)).join("")}
            </div>
            <div class="mobile-focus-layer" aria-label="Luzes do ambiente selecionado">
              ${n.map((l) => this._mobileFocusMarkerTemplate(l)).join("")}
            </div>
          </div>
        </section>

        ${this._mobilePanelTemplate(e, a)}

        <footer class="floorplan-footer" aria-label="Resumo das luzes">
          ${this._footerTemplate(e, i)}
        </footer>
      </main>
    `, this.shadowRoot.removeEventListener("click", this._boundClick), this.shadowRoot.removeEventListener("keydown", this._boundKeydown), this.shadowRoot.removeEventListener("pointerdown", this._boundPointerDown), this.shadowRoot.removeEventListener("pointermove", this._boundPointerMove), this.shadowRoot.removeEventListener("pointerup", this._boundPointerUp), this.shadowRoot.removeEventListener("pointercancel", this._boundPointerCancel), this.shadowRoot.addEventListener("click", this._boundClick), this.shadowRoot.addEventListener("keydown", this._boundKeydown), this.shadowRoot.addEventListener("pointerdown", this._boundPointerDown), this.shadowRoot.addEventListener("pointermove", this._boundPointerMove), this.shadowRoot.addEventListener("pointerup", this._boundPointerUp), this.shadowRoot.addEventListener("pointercancel", this._boundPointerCancel), this._wirePlanImage(), this._startClock();
  }
  _wirePlanImage() {
    const e = this.shadowRoot?.querySelector("[data-plan-image]");
    if (!e) return;
    const t = () => {
      e.classList.add("is-loaded"), e.classList.remove("is-failed");
    };
    e.addEventListener("load", t, { once: !0 }), e.addEventListener("error", () => {
      if (e.dataset.retried !== "1" && e.dataset.fallbackSrc) {
        e.dataset.retried = "1", e.src = e.dataset.fallbackSrc;
        return;
      }
      e.classList.add("is-failed");
    }), e.complete && e.naturalWidth > 0 && t();
  }
  _markerTemplate(e) {
    const o = (this._state(e.entity)?.state || "unavailable") === "on", i = this._isUnavailable(e.entity), a = `${e.point}. ${e.room} - ${e.name}`;
    return `
      <button
        class="${[
      "light-marker",
      o ? "is-on" : "is-off",
      i ? "is-unavailable" : ""
    ].filter(Boolean).join(" ")}"
        type="button"
        data-action="toggle-light"
        data-point="${e.point}"
        aria-label="${r._escapeAttr(a)}"
        aria-pressed="${o ? "true" : "false"}"
        title="${r._escapeAttr(a)}"
        style="--x:${e.x}%;--y:${e.y}%;"
        ${i ? "disabled" : ""}
      >
        <bruno-icon icon="${o ? "mdi:lightbulb-on-outline" : "mdi:lightbulb-outline"}"></bruno-icon>
      </button>
    `;
  }
  _mobileRoomHotspotTemplate(e, t) {
    const o = this._mobileRoomMarkers(e.id, t), i = this._counts(o), a = o.length > 0 && i.unavailable === o.length, n = [
      "mobile-room-hotspot",
      i.on > 0 ? "is-on" : "is-off",
      a ? "is-unavailable" : ""
    ].filter(Boolean).join(" "), s = `${e.label}: ${this._mobileCountLabel(i.on, o.length)}`;
    return `
      <button
        class="${n}"
        type="button"
        data-action="select-room"
        data-room="${r._escapeAttr(e.id)}"
        aria-label="${r._escapeAttr(s)}"
        style="--x:${e.x}%;--y:${e.y}%;"
      >
        <bruno-icon icon="${r._escapeAttr(e.icon)}"></bruno-icon>
        <span>${i.on}</span>
      </button>
    `;
  }
  _mobileFocusMarkerTemplate(e) {
    const o = (this._state(e.entity)?.state || "unavailable") === "on", i = this._isUnavailable(e.entity), a = this._mobileLightName(e), n = `${a}: ${i ? "indisponível" : o ? "ligada" : "desligada"}`;
    return `
      <button
        class="${[
      "mobile-focus-marker",
      o ? "is-on" : "is-off",
      i ? "is-unavailable" : ""
    ].filter(Boolean).join(" ")}"
        type="button"
        data-action="toggle-light"
        data-mobile-control="true"
        data-point="${e.point}"
        aria-label="${r._escapeAttr(n)}"
        aria-pressed="${o ? "true" : "false"}"
        title="${r._escapeAttr(a)}"
        style="--x:${e.x}%;--y:${e.y}%;"
        ${i ? "disabled" : ""}
      >
        <bruno-icon icon="${o ? "mdi:lightbulb-on-outline" : "mdi:lightbulb-outline"}"></bruno-icon>
      </button>
    `;
  }
  _mobilePanelTemplate(e, t) {
    if (!t) {
      const n = this._counts(e);
      return `
        <section class="mobile-room-panel is-overview" aria-label="Seleção de ambientes">
          <div class="mobile-panel-heading">
            <div class="mobile-panel-title">
              <span>Controle por ambiente</span>
              <strong>Escolha um cômodo</strong>
            </div>
            <div class="mobile-panel-count" aria-label="${this._mobileCountLabel(n.on, e.length)}">
              <strong>${n.on}</strong><span>/${e.length}</span>
            </div>
          </div>
          <div class="mobile-room-grid">
            ${this._mobileRooms().map((s) => this._mobileRoomCardTemplate(s, e)).join("")}
          </div>
        </section>
      `;
    }
    const o = this._mobileRoomMarkers(t.id, e), i = this._counts(o), a = i.unavailable ? `${i.unavailable} indisponível${i.unavailable === 1 ? "" : "is"}` : "Todos disponíveis";
    return `
      <section class="mobile-room-panel is-focused" aria-label="Controles de ${r._escapeAttr(t.label)}">
        <div class="mobile-panel-heading has-back">
          <button
            class="mobile-overview-button"
            type="button"
            data-action="select-room"
            data-room=""
            aria-label="Voltar para visão geral"
          >
            <bruno-icon icon="mdi:arrow-left"></bruno-icon>
          </button>
          <div class="mobile-panel-title">
            <span>${r._escape(a)}</span>
            <strong>${r._escape(t.label)}</strong>
          </div>
          <div class="mobile-panel-count" aria-label="${this._mobileCountLabel(i.on, o.length)}">
            <strong>${i.on}</strong><span>/${o.length}</span>
          </div>
        </div>
        <div class="mobile-light-grid">
          ${o.map((n) => this._mobileLightControlTemplate(n)).join("")}
        </div>
      </section>
    `;
  }
  _mobileRoomCardTemplate(e, t) {
    const o = this._mobileRoomMarkers(e.id, t), i = this._counts(o), a = o.length > 0 && i.unavailable === o.length;
    return `
      <button
        class="${[
      "mobile-room-card",
      i.on > 0 ? "is-on" : "is-off",
      a ? "is-unavailable" : ""
    ].filter(Boolean).join(" ")}"
        type="button"
        data-action="select-room"
        data-room="${r._escapeAttr(e.id)}"
        aria-label="Abrir ${r._escapeAttr(e.label)}"
      >
        <span class="mobile-room-card-icon">
          <bruno-icon icon="${r._escapeAttr(e.icon)}"></bruno-icon>
        </span>
        <span class="mobile-room-card-copy">
          <strong>${r._escape(e.shortLabel)}</strong>
          <small>${i.on}/${o.length} ${o.length === 1 ? "acesa" : "acesas"}</small>
        </span>
        <bruno-icon class="mobile-room-card-arrow" icon="mdi:chevron-right"></bruno-icon>
      </button>
    `;
  }
  _mobileLightControlTemplate(e) {
    const o = (this._state(e.entity)?.state || "unavailable") === "on", i = this._isUnavailable(e.entity), a = this._mobileLightName(e), n = i ? "Indisponível" : o ? "Ligada" : "Desligada";
    return `
      <button
        class="${[
      "mobile-light-control",
      o ? "is-on" : "is-off",
      i ? "is-unavailable" : ""
    ].filter(Boolean).join(" ")}"
        type="button"
        data-action="toggle-light"
        data-mobile-control="true"
        data-point="${e.point}"
        aria-label="${r._escapeAttr(`${a}: ${n}`)}"
        aria-pressed="${o ? "true" : "false"}"
        ${i ? "disabled" : ""}
      >
        <span class="mobile-light-icon">
          <bruno-icon icon="${o ? "mdi:lightbulb-on-outline" : "mdi:lightbulb-outline"}"></bruno-icon>
        </span>
        <span class="mobile-light-copy">
          <strong>${r._escape(a)}</strong>
          <small>${r._escape(n)}</small>
        </span>
      </button>
    `;
  }
  _stripTemplate(e) {
    const o = (this._state(e.entity)?.state || "unavailable") === "on", i = this._isUnavailable(e.entity), a = `${e.point}. ${e.room} - ${e.name}`, n = [
      o ? "is-on" : "is-off",
      i ? "is-unavailable" : ""
    ].filter(Boolean).join(" "), s = `
      type="button"
      data-action="toggle-light"
      data-point="${e.point}"
      aria-label="${r._escapeAttr(a)}"
      aria-pressed="${o ? "true" : "false"}"
      title="${r._escapeAttr(a)}"
      ${i ? "disabled" : ""}
    `;
    if (e.shape === "rect") {
      const l = e.x, c = e.y, d = e.x + e.width, p = e.y + e.height;
      return [
        [[l, c], [d, c]],
        [[d, c], [d, p]],
        [[d, p], [l, p]],
        [[l, p], [l, c]]
      ].map(([h, m]) => this._stripSegmentTemplate(h, m, n, s)).join("");
    }
    return e.points.slice(1).map((l, c) => this._stripSegmentTemplate(e.points[c], l, n, s)).join("");
  }
  _stripSegmentTemplate(e, t, o, i) {
    const [a, n] = e.map(Number), [s, l] = t.map(Number), c = Math.abs(s - a) >= Math.abs(l - n), d = r._fmt(Math.min(a, s)), p = r._fmt(Math.min(n, l)), h = r._fmt(Math.abs(s - a)), m = r._fmt(Math.abs(l - n)), f = c ? "is-horizontal" : "is-vertical", x = c ? `--x:${d}%;--y:${r._fmt(n)}%;--w:${h}%;` : `--x:${r._fmt(a)}%;--y:${p}%;--h:${m}%;`;
    return `
      <button
        class="led-strip-control led-strip-segment ${f} ${o}"
        style="${x}"
        ${i}
      ></button>
    `;
  }
  _footerTemplate(e, t) {
    const o = e.length, i = t.unavailable ? `<span class="footer-chip muted">${t.unavailable} indisponivel${t.unavailable === 1 ? "" : "s"}</span>` : "", a = this._lastAction ? `<span class="footer-chip">${r._escape(this._lastAction)}</span>` : `<span class="footer-chip muted">${o} pontos mapeados</span>`;
    return `
      <span class="footer-chip strong">
        <bruno-icon icon="mdi:lightbulb-group-outline"></bruno-icon>
        ${t.on} de ${o} luzes acesas
      </span>
      ${i}
      ${a}
    `;
  }
  _assetUrl(e) {
    return e ? `${e}${String(e).includes("?") ? "&" : "?"}v=${_}` : "";
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
        --light-shell-bg: rgba(20,24,29,0.28);
        --light-shell-on-bg: rgba(67,54,27,0.28);
        --light-shell-border: rgba(255,255,255,0.105);
        --light-shell-on-border: rgba(255,221,130,0.34);
        --light-icon-off: rgba(236,241,248,0.58);
        --light-icon-on: rgba(255,218,112,0.96);
        --led-off-bg: rgba(25,29,34,0.44);
        --led-hover-bg: rgba(255,224,135,0.30);
        --led-on-core: rgba(255,221,118,0.88);
        --led-on-edge: rgba(255,248,211,0.24);
        --light-shadow: 0 4px 11px rgba(0,0,0,0.18);
        --light-glow: 0 0 6px rgba(var(--accent),0.26), 0 0 14px rgba(var(--accent),0.10);
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
        background: var(--plan-fallback-image) center / contain no-repeat;
      }

      .plan-wrap img {
        position: relative;
        z-index: 1;
        width: 100%;
        height: 100%;
        display: block;
        object-fit: contain;
        opacity: 1;
        user-select: none;
        -webkit-user-drag: none;
      }

      .plan-wrap img.is-failed {
        visibility: hidden;
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
        border: 1px solid rgba(255,255,255,0.055);
        background: linear-gradient(180deg, rgba(255,255,255,0.045), transparent), var(--led-off-bg);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.065), var(--light-shadow);
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
        height: 4px;
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
        width: 4px;
        transform: translateX(-50%);
      }

      .led-strip-control.is-on::before {
        background:
          linear-gradient(90deg, var(--led-on-edge), var(--led-on-core) 50%, var(--led-on-edge));
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.30),
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
          radial-gradient(circle at 50% 24%, rgba(255,255,255,0.11), transparent 58%),
          linear-gradient(180deg, rgba(255,255,255,0.050), rgba(255,255,255,0.012)),
          var(--light-shell-bg);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.14),
          inset 0 -1px 0 rgba(0,0,0,0.18),
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

      .light-marker bruno-icon {
        --mdc-icon-size: 15px;
        pointer-events: none;
        filter: drop-shadow(0 1px 1px rgba(0,0,0,0.22));
      }

      .light-marker.is-on bruno-icon {
        filter:
          drop-shadow(0 0 3px rgba(var(--accent),0.58))
          drop-shadow(0 0 8px rgba(var(--accent),0.18));
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
          radial-gradient(circle at 50% 28%, rgba(255,239,190,0.18), transparent 60%),
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

      .footer-chip bruno-icon {
        --mdc-icon-size: 15px;
        flex: 0 0 auto;
      }

      .footer-chip.strong {
        color: rgba(255,255,255,0.88);
      }

      .footer-chip.muted {
        color: var(--text-muted);
      }

      /* Mobile-only progressive disclosure layers. They remain outside the
         tablet/desktop rendering path until the <=800px breakpoint enables
         them. */
      .mobile-room-layer,
      .mobile-focus-layer,
      .mobile-room-panel {
        display: none;
      }

      @media (max-height: 760px) {
        .light-marker {
          width: 26px;
          height: 26px;
          min-width: 26px;
          min-height: 26px;
        }

        .light-marker bruno-icon {
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

      /* ORIGINAL (rollback, 2026-07-22) — consolidacao mobile anterior.
         Mantido integralmente e desativado por max-width:0px. */
      @media (max-width: 0px) {
        :host {
          height: auto;
          min-height: 0;
          overflow: visible;
        }

        .floorplan-shell {
          height: auto;
          min-height: 0;
          display: grid;
          grid-template-rows: 38px auto 34px;
          gap: 4px;
          overflow: visible;
          padding-bottom: max(0px, env(safe-area-inset-bottom));
        }

        .floorplan-topbar,
        .floorplan-footer {
          position: relative;
          inset: auto;
        }

        .floorplan-topbar {
          height: 38px;
          min-height: 38px;
          gap: 8px;
          padding: 0 6px;
        }

        .brand {
          justify-content: flex-start;
          gap: 7px;
          font-size: 12px;
        }

        .divider { height: 16px; }

        .clock-block {
          min-width: 64px;
          font-size: 11px;
        }

        .clock-block small { font-size: 9px; }

        .map-area {
          position: relative;
          inset: auto;
          width: 100%;
          height: auto;
          min-height: 0;
          display: block;
          overflow: hidden;
        }

        .plan-wrap {
          width: 100%;
          height: auto;
          max-width: 100%;
          max-height: none;
          aspect-ratio: 1024 / 1040;
          margin: 0 auto;
        }

        /* Area real de toque de 44px; o disco visual continua compacto. */
        .light-marker {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          border: 0;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          transition: none;
        }

        .light-marker::before {
          content: "";
          position: absolute;
          z-index: 0;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          border: 1px solid var(--light-shell-border);
          background:
            radial-gradient(circle at 50% 24%, rgba(255,255,255,0.11), transparent 58%),
            linear-gradient(180deg, rgba(255,255,255,0.050), rgba(255,255,255,0.012)),
            var(--light-shell-bg);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.14),
            inset 0 -1px 0 rgba(0,0,0,0.18),
            var(--light-shadow);
          backdrop-filter: blur(12px) saturate(1.15);
          -webkit-backdrop-filter: blur(12px) saturate(1.15);
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
        }

        .light-marker bruno-icon {
          position: relative;
          z-index: 1;
          --mdc-icon-size: 14px;
        }

        .light-marker.is-on,
        .light-marker.is-off,
        .light-marker:hover,
        .light-marker:focus-visible,
        .light-marker.is-pressed {
          transform: translate(-50%, -50%);
          border-color: transparent;
          background: transparent;
          box-shadow: none;
        }

        .light-marker.is-on::before {
          border-color: var(--light-shell-on-border);
          background:
            radial-gradient(circle at 50% 28%, rgba(255,239,190,0.18), transparent 60%),
            var(--light-shell-on-bg);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            var(--light-glow),
            var(--light-shadow);
        }

        .light-marker:hover::before,
        .light-marker:focus-visible::before {
          transform: scale(1.06);
          border-color: var(--light-shell-on-border);
        }

        .light-marker.is-pressed::before { transform: scale(0.94); }

        /* Os perfis de LED preservam a linha visual de 4px, mas recebem uma
           faixa transversal de toque equivalente aos demais controles. */
        .led-strip-segment.is-horizontal { height: 44px; }
        .led-strip-segment.is-vertical { width: 44px; }

        .floorplan-footer {
          min-height: 34px;
          height: 34px;
          justify-content: center;
          gap: 6px;
          padding: 0 6px;
          overflow: hidden;
        }

        .footer-chip {
          height: 24px;
          padding: 0 4px;
          font-size: 10.5px;
        }

        .footer-chip:last-child:not(.strong) { display: none; }
      }

      /* NOVO (2026-07-22) — phone em dois niveis:
         1) visao geral com oito ambientes nao sobrepostos;
         2) foco no ambiente + painel inferior com uma acao por entidade.
         Tablet e desktop continuam integralmente nas regras-base acima. */
      @media (max-width: 800px) {
        :host {
          height: auto;
          min-height: calc(100vh - 104px - env(safe-area-inset-bottom, 0px));
          min-height: calc(100dvh - 104px - env(safe-area-inset-bottom, 0px));
          overflow: visible;
        }

        .floorplan-shell {
          width: 100%;
          height: auto;
          min-height: calc(100vh - 104px - env(safe-area-inset-bottom, 0px));
          min-height: calc(100dvh - 104px - env(safe-area-inset-bottom, 0px));
          display: grid;
          grid-template-rows: 38px auto minmax(260px, 1fr);
          gap: 6px;
          overflow: visible;
          padding-bottom: max(0px, env(safe-area-inset-bottom));
        }

        .floorplan-topbar {
          position: relative;
          inset: auto;
          height: 38px;
          min-height: 38px;
          gap: 8px;
          padding: 0 6px;
        }

        .brand {
          justify-content: flex-start;
          gap: 7px;
          font-size: 12px;
        }

        .divider { height: 16px; }

        .clock-block {
          min-width: 64px;
          font-size: 11px;
        }

        .clock-block small { font-size: 9px; }

        .map-area {
          position: relative;
          inset: auto;
          width: 100%;
          height: auto;
          min-height: 0;
          aspect-ratio: 1024 / 1040;
          display: block;
          overflow: hidden;
          border-radius: 18px;
          contain: layout paint;
        }

        .plan-wrap {
          width: 100%;
          height: 100%;
          max-width: 100%;
          max-height: none;
          aspect-ratio: 1024 / 1040;
          margin: 0 auto;
          transform: none;
          transform-origin: 50% 50%;
          transition: transform 280ms cubic-bezier(0.22, 1, 0.36, 1);
          will-change: transform;
        }

        .plan-wrap.is-mobile-focused {
          transform-origin: var(--focus-x) var(--focus-y);
          transform:
            translate(calc(50% - var(--focus-x)), calc(50% - var(--focus-y)))
            scale(var(--focus-scale));
        }

        /* Desktop LED geometry remains intact in the DOM, but mobile renders
           exactly one focus marker for each canonical light entity. */
        .led-strips-layer,
        .markers-layer {
          display: none;
        }

        .mobile-room-layer,
        .mobile-focus-layer {
          position: absolute;
          inset: 0;
          z-index: 4;
          display: block;
          pointer-events: none;
        }

        .plan-wrap.is-mobile-focused .mobile-room-layer,
        .plan-wrap.is-mobile-overview .mobile-focus-layer {
          display: none;
        }

        .mobile-room-hotspot {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: 50px;
          height: 50px;
          min-width: 50px;
          min-height: 50px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 999px;
          appearance: none;
          -webkit-appearance: none;
          color: rgba(239,244,250,0.78);
          background: transparent;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          cursor: pointer;
          touch-action: manipulation;
          outline: none;
        }

        .mobile-room-hotspot::before {
          content: "";
          position: absolute;
          inset: 5px;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.14);
          background:
            radial-gradient(circle at 50% 20%, rgba(255,255,255,0.13), transparent 58%),
            rgba(20,24,29,0.46);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.14),
            0 7px 18px rgba(0,0,0,0.24);
          backdrop-filter: blur(13px) saturate(1.15);
          -webkit-backdrop-filter: blur(13px) saturate(1.15);
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
        }

        .mobile-room-hotspot bruno-icon {
          position: relative;
          z-index: 1;
          --mdc-icon-size: 17px;
          pointer-events: none;
        }

        .mobile-room-hotspot > span {
          position: absolute;
          z-index: 2;
          right: 2px;
          bottom: 2px;
          min-width: 17px;
          height: 17px;
          padding: 0 4px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.20);
          border-radius: 999px;
          background: rgba(21,25,31,0.88);
          color: rgba(244,248,252,0.88);
          font-size: 9px;
          font-weight: 750;
          line-height: 1;
          pointer-events: none;
        }

        .mobile-room-hotspot.is-on {
          color: var(--light-icon-on);
        }

        .mobile-room-hotspot.is-on::before {
          border-color: var(--light-shell-on-border);
          background:
            radial-gradient(circle at 50% 24%, rgba(255,239,190,0.19), transparent 60%),
            rgba(67,54,27,0.46);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            var(--light-glow),
            0 7px 18px rgba(0,0,0,0.24);
        }

        .mobile-room-hotspot.is-on > span {
          border-color: rgba(255,221,130,0.44);
          color: rgba(255,224,134,0.98);
        }

        .mobile-room-hotspot:focus-visible::before {
          border-color: rgba(255,224,135,0.58);
          box-shadow: 0 0 0 3px rgba(var(--accent),0.14), var(--light-shadow);
        }

        .mobile-room-hotspot:active::before { transform: scale(0.94); }
        .mobile-room-hotspot.is-unavailable { opacity: 0.58; }

        .mobile-focus-marker {
          position: absolute;
          left: var(--x);
          top: var(--y);
          width: var(--focus-hit);
          height: var(--focus-hit);
          min-width: var(--focus-hit);
          min-height: var(--focus-hit);
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 999px;
          appearance: none;
          -webkit-appearance: none;
          color: var(--light-icon-off);
          background: transparent;
          transform: translate(-50%, -50%);
          pointer-events: auto;
          cursor: pointer;
          touch-action: manipulation;
          outline: none;
        }

        .mobile-focus-marker::before {
          content: "";
          position: absolute;
          width: var(--focus-disc);
          height: var(--focus-disc);
          border-radius: inherit;
          border: 1px solid var(--light-shell-border);
          background:
            radial-gradient(circle at 50% 24%, rgba(255,255,255,0.11), transparent 58%),
            var(--light-shell-bg);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.14),
            var(--light-shadow);
          backdrop-filter: blur(12px) saturate(1.15);
          -webkit-backdrop-filter: blur(12px) saturate(1.15);
          transition: transform 150ms ease, border-color 150ms ease, box-shadow 150ms ease;
        }

        .mobile-focus-marker bruno-icon {
          position: relative;
          z-index: 1;
          --mdc-icon-size: var(--focus-icon);
          pointer-events: none;
        }

        .mobile-focus-marker.is-on {
          color: var(--light-icon-on);
        }

        .mobile-focus-marker.is-on::before {
          border-color: var(--light-shell-on-border);
          background:
            radial-gradient(circle at 50% 28%, rgba(255,239,190,0.18), transparent 60%),
            var(--light-shell-on-bg);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            var(--light-glow),
            var(--light-shadow);
        }

        .mobile-focus-marker:focus-visible::before {
          border-color: rgba(255,224,135,0.62);
          box-shadow: 0 0 0 2px rgba(var(--accent),0.16), var(--light-shadow);
        }

        .mobile-focus-marker.is-pressed::before,
        .mobile-focus-marker:active::before {
          transform: scale(0.92);
        }

        .mobile-focus-marker.is-unavailable,
        .mobile-focus-marker:disabled {
          opacity: 0.42;
          cursor: not-allowed;
        }

        .mobile-room-panel {
          position: relative;
          z-index: 5;
          min-width: 0;
          min-height: 260px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 13px 11px 15px;
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 22px;
          background:
            radial-gradient(circle at 14% 0%, rgba(255,255,255,0.08), transparent 42%),
            linear-gradient(180deg, rgba(36,29,24,0.43), rgba(17,20,25,0.34));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.11),
            0 14px 34px rgba(0,0,0,0.20);
          backdrop-filter: blur(18px) saturate(1.14);
          -webkit-backdrop-filter: blur(18px) saturate(1.14);
          overflow: visible;
        }

        .mobile-panel-heading {
          min-width: 0;
          min-height: 46px;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
        }

        .mobile-panel-heading.has-back {
          grid-template-columns: 44px minmax(0, 1fr) auto;
        }

        .mobile-panel-title {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-panel-title > span {
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 650;
          line-height: 1;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-panel-title > strong {
          color: rgba(255,255,255,0.93);
          font-size: 16px;
          font-weight: 720;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-panel-count {
          min-width: 44px;
          height: 36px;
          padding: 0 9px;
          display: flex;
          /* ANTERIOR (rollback): baseline encostava 0/37 na borda superior. */
          align-items: center;
          justify-content: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 999px;
          background: rgba(13,17,22,0.25);
          color: rgba(255,255,255,0.62);
          font-size: 11px;
          line-height: 1;
        }

        .mobile-panel-count strong {
          color: rgba(255,222,127,0.96);
          font-size: 16px;
          font-weight: 760;
        }

        .mobile-panel-count strong,
        .mobile-panel-count span {
          display: flex;
          align-items: center;
          line-height: 1;
        }

        .mobile-overview-button {
          width: 44px;
          height: 44px;
          min-width: 44px;
          min-height: 44px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 1px solid rgba(255,255,255,0.13);
          border-radius: 14px;
          appearance: none;
          -webkit-appearance: none;
          background: rgba(18,22,28,0.32);
          color: rgba(245,248,252,0.86);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
          touch-action: manipulation;
          cursor: pointer;
        }

        .mobile-overview-button bruno-icon { --mdc-icon-size: 19px; }
        .mobile-overview-button:active { transform: scale(0.96); }

        .mobile-room-grid,
        .mobile-light-grid {
          min-width: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .mobile-room-card,
        .mobile-light-control {
          min-width: 0;
          min-height: 60px;
          display: grid;
          align-items: center;
          gap: 8px;
          padding: 8px 9px;
          border: 1px solid rgba(255,255,255,0.095);
          border-radius: 17px;
          appearance: none;
          -webkit-appearance: none;
          text-align: left;
          color: rgba(244,247,252,0.89);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012)),
            rgba(17,21,27,0.25);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.075);
          cursor: pointer;
          touch-action: manipulation;
          transition: transform 140ms ease, border-color 150ms ease, background 150ms ease;
        }

        .mobile-room-card {
          grid-template-columns: 34px minmax(0, 1fr) 13px;
        }

        .mobile-light-control {
          grid-template-columns: 36px minmax(0, 1fr);
          min-height: 64px;
        }

        .mobile-room-card:active,
        .mobile-light-control.is-pressed,
        .mobile-light-control:active {
          transform: scale(0.975);
        }

        .mobile-room-card.is-on,
        .mobile-light-control.is-on {
          border-color: rgba(255,219,119,0.28);
          background:
            radial-gradient(circle at 16% 12%, rgba(255,226,142,0.13), transparent 48%),
            rgba(67,54,27,0.25);
        }

        .mobile-room-card:focus-visible,
        .mobile-light-control:focus-visible,
        .mobile-overview-button:focus-visible {
          outline: 2px solid rgba(255,224,135,0.46);
          outline-offset: 2px;
        }

        .mobile-room-card-icon,
        .mobile-light-icon {
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.10);
          border-radius: 12px;
          background: rgba(255,255,255,0.045);
          color: rgba(238,243,249,0.70);
        }

        .mobile-light-icon {
          width: 36px;
          height: 36px;
          border-radius: 999px;
        }

        .mobile-room-card-icon bruno-icon,
        .mobile-light-icon bruno-icon {
          --mdc-icon-size: 17px;
        }

        .mobile-room-card.is-on .mobile-room-card-icon,
        .mobile-light-control.is-on .mobile-light-icon {
          border-color: rgba(255,219,119,0.30);
          color: var(--light-icon-on);
          background: rgba(255,218,112,0.08);
          box-shadow: 0 0 12px rgba(var(--accent),0.10);
        }

        .mobile-room-card-copy,
        .mobile-light-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .mobile-room-card-copy strong,
        .mobile-light-copy strong {
          min-width: 0;
          color: rgba(250,252,255,0.91);
          font-size: 12px;
          font-weight: 680;
          line-height: 1.15;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-room-card-copy small,
        .mobile-light-copy small {
          color: var(--text-muted);
          font-size: 10px;
          font-weight: 540;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .mobile-light-control.is-on .mobile-light-copy small {
          color: rgba(255,222,127,0.80);
        }

        .mobile-room-card-arrow {
          --mdc-icon-size: 13px;
          color: rgba(255,255,255,0.38);
        }

        .mobile-room-card.is-unavailable,
        .mobile-light-control.is-unavailable,
        .mobile-light-control:disabled {
          opacity: 0.48;
        }

        .mobile-light-control:disabled {
          cursor: not-allowed;
        }

        .floorplan-footer {
          display: none;
        }

        /* ORIGINAL (rollback): narrow-phone refinements were initially nested.
           Kept disabled here; the equivalent standalone query follows below. */
        @media (max-width: 0px) {
          .mobile-room-panel { padding-inline: 9px; }
          .mobile-room-grid,
          .mobile-light-grid { gap: 7px; }
          .mobile-room-card,
          .mobile-light-control { padding-inline: 7px; }
          .mobile-room-card-copy strong,
          .mobile-light-copy strong { font-size: 11px; }
        }
      }

      @media (max-width: 370px) {
        .mobile-room-panel { padding-inline: 9px; }
        .mobile-room-grid,
        .mobile-light-grid { gap: 7px; }
        .mobile-room-card,
        .mobile-light-control { padding-inline: 7px; }
        .mobile-room-card-copy strong,
        .mobile-light-copy strong { font-size: 11px; }
      }

      @media (prefers-reduced-motion: reduce) {
        .light-marker {
          transition: none !important;
        }

        .plan-wrap,
        .mobile-room-hotspot::before,
        .mobile-room-card,
        .mobile-light-control {
          transition: none !important;
        }
      }
    `;
  }
  static _clock() {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit"
    }).format(/* @__PURE__ */ new Date());
  }
  static _date() {
    return new Intl.DateTimeFormat("pt-BR", {
      weekday: "short",
      day: "2-digit",
      month: "short"
    }).format(/* @__PURE__ */ new Date()).replace(".", "");
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  static _escapeAttr(e) {
    return r._escape(e).replace(/'/g, "&#39;");
  }
  static _cssUrl(e) {
    return String(e || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\)/g, "\\)").replace(/[\r\n]/g, "");
  }
  static _fmt(e) {
    return Number(e).toFixed(2).replace(/\.?0+$/, "");
  }
}
customElements.get(b) || customElements.define(b, r);
window.customCards = window.customCards || [];
window.customCards.push({
  type: b,
  name: "Bruno Planta 3D Subview",
  preview: !1,
  description: "Interactive apartment floorplan with mapped light toggles."
});
//# sourceMappingURL=bruno-planta-3d-subview.BuWQZlf2.js.map
