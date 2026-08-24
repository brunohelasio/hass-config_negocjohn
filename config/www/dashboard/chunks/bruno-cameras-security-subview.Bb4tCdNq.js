const g = "bruno-cameras-security-subview", p = {
  title: "Residence Security",
  section: "Cameras",
  active_entity: "input_select.bento_active_camera",
  navigation_path: "bento-lab",
  // Secundarias atualizam a cada 3s (snapshot). O feed principal usa WebRTC
  // direto e so cede a foto depois do primeiro quadro real.
  refresh_interval: 3e3,
  // ANTERIOR (rollback ONVIF geral): cameras usavam os oito IDs Tuya *_2.
  // O inventario completo permanece no rollback desta rodada.
  cameras: [
    {
      entity: "camera.sl_camera_profile_1",
      name: "PRINCIPAL: SALA",
      short_name: "SL - Sala",
      display_name: "Sala",
      group: "social",
      motion_entity: "bruno_tuya_motion.sl_camera_2",
      controls: [
        { key: "sound", label: "Som", icon: "mdi:microphone-outline", entity: "switch.sl_camera_deteccao_de_som" },
        { key: "motion", label: "Movimento", icon: "mdi:run-fast", entity: "switch.sl_camera_alarme_de_movimento" },
        { key: "privacy", label: "Privacidade", icon: "mdi:eye-off-outline", entity: "switch.sl_camera_modo_de_privacidade" }
      ]
    },
    {
      entity: "camera.vr_camera_profile_1",
      name: "VR - Varanda",
      short_name: "VR - Varanda",
      display_name: "Varanda",
      group: "social",
      motion_entity: "bruno_tuya_motion.vr_camera_2",
      controls: [
        { key: "sound", label: "Som", icon: "mdi:microphone-outline", entity: "switch.vr_camera_deteccao_de_som" },
        { key: "motion", label: "Movimento", icon: "mdi:run-fast", entity: "switch.vr_camera_alarme_de_movimento" },
        { key: "privacy", label: "Privacidade", icon: "mdi:eye-off-outline", entity: "switch.vr_camera_modo_de_privacidade" }
      ]
    },
    {
      entity: "camera.cz_camera_profile_1",
      name: "CZ - Cozinha",
      short_name: "CZ - Cozinha",
      display_name: "Cozinha",
      group: "social",
      motion_entity: "bruno_tuya_motion.cz_camera_2",
      controls: [
        { key: "sound", label: "Som", icon: "mdi:microphone-outline", entity: "switch.cz_camera_deteccao_de_som" },
        { key: "motion", label: "Movimento", icon: "mdi:run-fast", entity: "switch.cz_camera_alarme_de_movimento" },
        { key: "privacy", label: "Privacidade", icon: "mdi:eye-off-outline", entity: "switch.cz_camera_modo_de_privacidade" }
      ]
    },
    {
      entity: "camera.as_camera_profile_1",
      name: "AS - Area Servico",
      short_name: "AS - Area Servico",
      display_name: "Área de Serviço",
      group: "social",
      motion_entity: "bruno_tuya_motion.as_camera_2"
    },
    {
      entity: "camera.of_camera_profile_1",
      name: "OF - Office",
      short_name: "OF - Office",
      display_name: "Office",
      group: "intimate",
      motion_entity: "bruno_tuya_motion.of_camera_2",
      controls: [
        { key: "sound", label: "Som", icon: "mdi:microphone-outline", entity: "switch.of_camera_deteccao_de_som" },
        { key: "motion", label: "Movimento", icon: "mdi:run-fast", entity: "switch.of_camera_alarme_de_movimento" },
        { key: "privacy", label: "Privacidade", icon: "mdi:eye-off-outline", entity: "switch.of_camera_modo_de_privacidade" }
      ]
    },
    {
      entity: "camera.qc_camera_profile_1",
      name: "QC - Quarto Casal",
      short_name: "QC - Quarto Casal",
      display_name: "Quarto Casal",
      group: "intimate",
      motion_entity: "bruno_tuya_motion.camera_quarto_casal_2"
    },
    {
      entity: "camera.qmi_camera_profile_1",
      name: "QMI - Quarto Miguel",
      short_name: "QMI - Quarto Miguel",
      display_name: "Quarto Filho",
      group: "intimate",
      motion_entity: "bruno_tuya_motion.qmi_camera_2"
    },
    {
      entity: "camera.qma_camera_profile_1",
      name: "QMA - Quarto Marina",
      short_name: "QMA - Quarto Marina",
      display_name: "Quarto Filha",
      group: "intimate",
      motion_entity: "bruno_tuya_motion.qma_camera_2"
    }
  ]
}, b = ["streaming", "recording", "idle", "on"], h = ["unavailable", "unknown", ""], x = /* @__PURE__ */ new Set([
  "camera.sl_camera_profile_1",
  "camera.vr_camera_profile_1",
  "camera.cz_camera_profile_1",
  "camera.as_camera_profile_1"
]), _ = /* @__PURE__ */ new Set([
  "camera.of_camera_profile_1",
  "camera.qc_camera_profile_1",
  "camera.qmi_camera_profile_1",
  "camera.qma_camera_profile_1"
]), u = 3e4, v = 9e4;
class o extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  constructor() {
    super(), this._refreshSeed = Date.now(), this._lastCameraImages = {}, this._lastClock = o._clock(), this._boundClick = (e) => this._handleClick(e), this._boundKeydown = (e) => this._handleKeydown(e), this._boundClock = () => this._updateClock(), this._liveEl = null, this._liveEntity = "", this._liveReady = "", this._liveTimer = null, this._liveState = "idle", this._liveBlockedEntity = "", this._liveLoadToken = 0, this._cameraMenuOpen = !1, this._boundDialogClosed = (e) => this._handleDialogClosed(e);
  }
  connectedCallback() {
    globalThis.BrunoLiquidGlass?.apply?.(), this._liveState = "idle", this._liveBlockedEntity = "", this._listeningDialogClosed || (globalThis.addEventListener?.("dialog-closed", this._boundDialogClosed, !0), this._listeningDialogClosed = !0), this._startRefreshTimer(), this._startClockTimer(), this._render();
  }
  disconnectedCallback() {
    this._liveLoadToken++, this._stopRefreshTimer(), this._stopClockTimer(), this._stopLiveFeed(), this._listeningDialogClosed && (globalThis.removeEventListener?.("dialog-closed", this._boundDialogClosed, !0), this._listeningDialogClosed = !1), this._liveResumeTimer && globalThis.clearTimeout(this._liveResumeTimer), this._liveResumeTimer = null;
  }
  setConfig(e) {
    this._config = this._normalizeConfig(e), this._render();
  }
  // --- ORIGINAL (rollback): re-render total a cada update de hass ---
  // set hass(hass) {
  //   this._hass = hass;
  //   this._render();
  //   this._startRefreshTimer();
  // }
  // --- FIM ORIGINAL ---
  // NOVO (anti-flicker): so reconstroi o shadow DOM quando algo ESTRUTURAL muda
  // (camera ativa, disponibilidade, online/status). O HA chama set hass com alta
  // frequencia; reconstruir os <img> a cada chamada fazia as cameras piscarem.
  // Updates triviais (ex.: token rotativo de entity_picture) NAO re-renderizam:
  // a imagem ao vivo e atualizada por _refreshCameraImages() (preload + swap, sem
  // piscar) e o relogio pelo clock timer.
  set hass(e) {
    this._hass = e;
    const a = this._renderSignature();
    if (this.shadowRoot && this._renderedSignature === a) {
      this._updateDesktopInformational(), this._syncCameraControls(), this._syncPrivacySurfaces(), this._startRefreshTimer();
      return;
    }
    this._render(), this._startRefreshTimer();
  }
  _renderSignature() {
    return !this._hass || !this._config ? "pending" : o._signatureFromModel(this._model());
  }
  static _signatureFromModel(e) {
    if (!e) return "pending";
    const a = (e.cameras || []).map((i) => `${i.entity}:${i.online ? 1 : 0}:${i.unavailable ? 1 : 0}:${i.image ? 1 : 0}:${i.status}`).join("|");
    return `${e.activeId}#${a}`;
  }
  _normalizeConfig(e = {}) {
    return {
      ...p,
      ...e,
      refresh_interval: Number(e.refresh_interval) > 0 ? Number(e.refresh_interval) : p.refresh_interval,
      cameras: Array.isArray(e.cameras) && e.cameras.length ? e.cameras : p.cameras
    };
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _cameraState(e) {
    const a = this._state(e.entity), i = a?.state || "", t = !a || h.includes(i), r = !t && b.includes(i), s = a?.attributes?.entity_picture || "";
    s && (this._lastCameraImages[e.entity] = s);
    const n = s || this._lastCameraImages[e.entity] || "";
    return {
      ...e,
      entityObj: a,
      state: i,
      image: n,
      imageUrl: o._withCacheBust(n, this._refreshSeed),
      unavailable: t,
      online: r,
      // MODO PRIVACIDADE (2026-08-24): calculado aqui porque _mainFeed e
      // _tile sao estaticos e nao alcancam _controlState. Mesma leitura que
      // o painel de controles ja faz.
      isPrivate: !!this._controlState(e, "privacy")?.active,
      status: o._statusLabel(i, t)
    };
  }
  _cameraGroup(e) {
    return e?.group === "social" || e?.group === "intimate" ? e.group : x.has(e?.entity) ? "social" : (_.has(e?.entity), "intimate");
  }
  _motionEvent(e) {
    if (!e?.motion_entity) return null;
    const a = this._state(e.motion_entity);
    if (!a || a.attributes?.event_type !== "ipc_motion") return null;
    const i = String(a.attributes?.detected_at || ""), t = Date.parse(i);
    return Number.isFinite(t) ? {
      entity: e.entity,
      name: o._displayName(e, !0, !0),
      detectedAt: i,
      timestamp: t
    } : null;
  }
  _recentMotionEvents(e) {
    return (e || []).map((a) => this._motionEvent(a)).filter(Boolean).sort((a, i) => i.timestamp - a.timestamp).slice(0, 3);
  }
  _motionCount(e) {
    const a = Date.now();
    return (e || []).filter((i) => {
      const t = this._motionEvent(i);
      return t && a - t.timestamp >= 0 && a - t.timestamp <= v;
    }).length;
  }
  _controlState(e, a) {
    const i = (e?.controls || []).find((s) => s?.key === a);
    if (!i?.entity) return null;
    const t = this._state(i.entity), r = !t || h.includes(String(t.state || "").toLowerCase());
    return {
      ...i,
      active: !r && String(t?.state || "").toLowerCase() === "on",
      unavailable: r
    };
  }
  _isMobileLayout() {
    return !!globalThis.matchMedia?.("(max-width: 800px)")?.matches;
  }
  _model() {
    const e = this._config || p, a = e.cameras.map((l) => this._cameraState(l)), i = this._state(e.active_entity)?.state, t = a[0]?.entity || "", r = this._localActiveCamera || (a.some((l) => l.entity === i) ? i : t), s = a.find((l) => l.entity === r) || a[0], n = a.filter((l) => l.entity !== s?.entity);
    return {
      activeCamera: s,
      activeId: r,
      // Mantidos para o layout mobile legado, que nao muda nesta rodada.
      sideCameras: n.slice(0, 3),
      bottomCameras: n.slice(3),
      // Desktop/tablet paisagem: os 7 secundarios sao sempre recalculados por setor.
      socialCameras: n.filter((l) => this._cameraGroup(l) === "social"),
      intimateCameras: n.filter((l) => this._cameraGroup(l) === "intimate"),
      cameras: a,
      onlineCount: a.filter((l) => l.online).length,
      motionCount: this._motionCount(a),
      recordingCount: a.filter((l) => l.state === "recording").length,
      recentMotionEvents: this._recentMotionEvents(a),
      totalCount: a.length
    };
  }
  // --- ORIGINAL (rollback): re-render TOTAL ao trocar de camera. Reconstruia o
  //     shadow DOM inteiro -> todos os <img> recriados -> TODAS as cameras
  //     piscavam (apagavam/acendiam) a cada clique. ---
  // _selectCamera(entityId) {
  //   if (!entityId) return;
  //   const model = this._model();
  //   if (entityId === model.activeId) return;
  //   this._localActiveCamera = entityId;
  //   this._refreshSeed = Date.now();
  //   globalThis.BrunoLiquidGlass?.feedback?.('tap');
  //   this._render();
  //   const activeEntity = this._config?.active_entity;
  //   if (activeEntity && this._hass?.states?.[activeEntity]) {
  //     this._callService('input_select', 'select_option', { entity_id: activeEntity, option: entityId });
  //   }
  // }
  // --- FIM ORIGINAL ---
  // NOVO (2b): troca SO o slot principal <-> o tile clicado, no lugar, sem
  // reconstruir o DOM. Os demais tiles permanecem intactos (sem piscar). As duas
  // imagens trocadas usam preload+swap (sem blank). Se o DOM ainda nao existir,
  // cai no render completo (caso raro de primeiro clique antes do mount).
  _selectCamera(e) {
    if (!e) return;
    const a = this._model();
    if (e === a.activeId) return;
    this._liveLoadToken++, this._liveState = "idle", this._liveBlockedEntity = "", globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._swapActive(e) || (this._localActiveCamera = e, this._refreshSeed = Date.now(), this._render());
    const t = this._config?.active_entity;
    t && this._hass?.states?.[t] && this._callService("input_select", "select_option", {
      entity_id: t,
      option: e
    });
  }
  // NOVO (2b): executa a troca principal <-> tile clicado no DOM existente.
  // Localiza o tile pelo seu data-camera-id ATUAL (= camera clicada), reescreve
  // o slot principal para a camera clicada e o tile clicado para a camera que
  // estava no principal. Atualiza so esses dois slots; nada mais re-renderiza.
  _swapActive(e) {
    const a = this.shadowRoot;
    if (!a) return !1;
    const i = this._model(), t = i.activeCamera;
    if (!t || e === t.entity) return !1;
    const r = a.querySelector(`.camera-tile[data-camera-id="${e}"]`), s = a.querySelector(".main-feed .image-stage");
    if (!r || !s) return !1;
    const n = i.cameras.find((d) => d.entity === e);
    if (!n) return !1;
    this._localActiveCamera = e, this._refreshSeed = Date.now(), this._updateStage(s, n), this._mountLiveFeed(n.entity), this._updateSlotPill(a.querySelector(".main-feed [data-feed-pill]"), n, !1);
    const l = a.querySelector(".main-feed [data-feed-title]");
    if (l && (l.textContent = o._displayName(n, !1, !0)), this._cameraMenuOpen) {
      this._cameraMenuOpen = !1;
      const d = a.querySelector(".main-feed [data-camera-controls]");
      d && (d.innerHTML = "", d.classList.remove("is-open"));
      const m = a.querySelector(".main-feed .feed-head-menu");
      m && (m.classList.remove("is-active"), m.setAttribute("aria-expanded", "false"));
    }
    const c = a.querySelector('.main-feed [data-action="more-info"]');
    c && (c.dataset.cameraId = n.entity), this._updateStage(r.querySelector(".image-stage"), t), this._updateSlotPill(r.querySelector(".tile-pill"), t, !0), r.dataset.cameraId = t.entity;
    const f = !!a.querySelector(".security-subview.is-desktop");
    return r.setAttribute(
      "aria-label",
      o._displayName(t, !0, f)
    ), this._syncDesktopGroups(), this._renderedSignature = o._signatureFromModel(this._model()), !0;
  }
  _syncDesktopGroups() {
    const e = this.shadowRoot;
    if (!e?.querySelector(".security-subview.is-desktop")) return;
    const a = this._model();
    [
      ["social", a.socialCameras],
      ["intimate", a.intimateCameras]
    ].forEach(([t, r]) => {
      const s = e.querySelector(`[data-camera-group-grid="${t}"]`), n = e.querySelector(`[data-camera-group-count="${t}"]`);
      n && (n.textContent = `${r.length} câmeras`), s && r.forEach((l) => {
        const c = e.querySelector(`.camera-tile[data-camera-id="${l.entity}"]`);
        c && s.appendChild(c);
      });
    }), this._replaceCameraControls(a.activeCamera), this._updateDesktopInformational(a);
  }
  /**
   * Liga/desliga a faixa de controles sem passar pelo _render.
   *
   * Toca so no recipiente da faixa e no botao de tres pontos. Tudo o mais —
   * inclusive o elemento ao vivo — permanece exatamente onde esta.
   */
  _alternarFaixaControles() {
    const e = this.shadowRoot;
    if (!e) return;
    const a = e.querySelector(".main-feed [data-camera-controls]"), i = e.querySelector(".main-feed .feed-head-menu"), t = !!this._cameraMenuOpen;
    if (a) {
      const r = this._model().activeCamera;
      a.innerHTML = t ? this._cameraControls(r) : "", a.classList.toggle("is-open", t);
    }
    i && (i.classList.toggle("is-active", t), i.setAttribute("aria-expanded", t ? "true" : "false"), i.setAttribute(
      "aria-label",
      t ? "Fechar controles da camera" : "Abrir controles da camera"
    ));
  }
  _replaceCameraControls(e) {
    const a = this.shadowRoot?.querySelector("[data-camera-controls]");
    a && (a.innerHTML = this._cameraControls(e));
  }
  // PAINEL DE CONTROLES (2026-08-24).
  //
  // ANTERIOR (rollback): tres botoes translucidos soltos sobre a imagem,
  // no canto superior direito. Saiu por decisao do usuario — nao funcionava
  // bem sobre o video.
  //
  // Agora e o MESMO painel das cameras das subviews: mesma tripla
  // (som, movimento, privacidade), mesma forma (icone + rotulo + chave),
  // aberto pelo botao de tres pontos do cabecalho. Nenhuma logica de
  // interacao nova: a acao continua sendo toggle-camera-control.
  _cameraControls(e) {
    if (!e) return "";
    const a = o._displayName(e, !1, !0), i = ["sound", "motion", "privacy"].map((t) => this._controlState(e, t)).filter(Boolean).map((t) => {
      const r = t.active ? " is-on" : "", s = t.unavailable ? " is-unavailable" : "", n = t.description || t.label || "Controle";
      return `
          <button
            class="camera-control${r}${s}"
            type="button"
            data-action="toggle-camera-control"
            data-control-entity="${o._escapeAttr(t.entity)}"
            title="${o._escapeAttr(n)} — camera ${o._escapeAttr(a)}"
            aria-label="${o._escapeAttr(t.label || t.key)}"
            aria-pressed="${t.active ? "true" : "false"}"
            ${t.unavailable ? "disabled" : ""}
          >
            <bruno-icon icon="${o._escapeAttr(t.icon || "mdi:toggle-switch-outline")}"></bruno-icon>
            <span class="camera-control-label">${o._escape(t.label || n)}</span>
            <span class="camera-control-switch" aria-hidden="true"></span>
          </button>
        `;
    }).join("");
    return i ? `<div class="camera-control-strip" aria-label="Controles da camera ${o._escapeAttr(a)}"><div class="camera-controls">${i}</div></div>` : "";
  }
  /**
   * Liga/desliga a superficie de privacidade sem reconstruir o DOM.
   *
   * Roda junto de _syncCameraControls a cada update de hass. Toca so na
   * classe do host e no proprio elemento da superficie; o video permanece.
   */
  _syncPrivacySurfaces() {
    const e = this.shadowRoot;
    if (!e) return;
    const a = this._model(), i = new Map((a.cameras || []).map((r) => [r.entity, r])), t = e.querySelector(".main-feed-card");
    t && this._aplicarEstadoCamera(t, i.get(a.activeId), ".image-stage"), e.querySelectorAll(".camera-tile[data-camera-id]").forEach((r) => {
      this._aplicarEstadoCamera(r, i.get(r.dataset.cameraId), ".image-stage");
    });
  }
  _aplicarEstadoCamera(e, a, i) {
    if (!e || !a) return;
    e.classList.toggle("is-private", !!a.isPrivate);
    const t = e.querySelector(i) || e, r = t.querySelector(".camera-state-surface"), s = o._stateSurface(a);
    if (!s) {
      r && r.remove();
      return;
    }
    if (!r) {
      t.insertAdjacentHTML("beforeend", s);
      return;
    }
    const n = document.createElement("div");
    n.innerHTML = s;
    const l = n.firstElementChild;
    l && r.textContent.trim() !== l.textContent.trim() && r.replaceWith(l);
  }
  _syncCameraControls() {
    const e = this.shadowRoot;
    e && e.querySelectorAll("[data-control-entity]").forEach((a) => {
      const i = this._state(a.dataset.controlEntity), t = !i || h.includes(String(i.state || "").toLowerCase()), r = !t && String(i?.state || "").toLowerCase() === "on";
      a.classList.toggle("is-on", r), a.classList.toggle("is-unavailable", t), a.toggleAttribute("disabled", t), a.setAttribute("aria-pressed", r ? "true" : "false");
    });
  }
  _updateDesktopInformational(e = this._model()) {
    const a = this.shadowRoot?.querySelector("[data-camera-insights]");
    if (!a) return;
    const i = o._insightsInner(e), t = [
      e.onlineCount,
      e.motionCount,
      e.recordingCount,
      ...(e.recentMotionEvents || []).map((r) => `${r.entity}:${r.detectedAt}`),
      Math.floor(Date.now() / 15e3)
    ].join("|");
    a.dataset.signature !== t && (a.dataset.signature = t, a.innerHTML = i);
  }
  // NOVO (2b, corrigido): atualiza a imagem de um slot (principal ou tile) na
  // troca. Le SEMPRE o entity_picture mais recente do hass (token novo — o token
  // do camera_proxy rotaciona em minutos; reusar o base antigo congelava a
  // imagem). Aplica o src DIRETO (acao deliberada do clique): garante a troca
  // visivel mesmo se um preload falhasse silenciosamente. Cria o <img> se o slot
  // estava em placeholder.
  // ORIGINAL (rollback): so aplicava o src dentro de loader.onload; se o preload
  // falhava (token expirado), o onload nunca disparava e a frame antiga
  // permanecia -> "o nome muda mas a imagem nao".
  _updateStage(e, a) {
    if (!e) return;
    const i = this._liveImageBase(a), t = !!i;
    e.classList.toggle("has-image", t);
    let r = e.querySelector("img.camera-image");
    if (!t) {
      r && r.classList.add("is-hidden");
      return;
    }
    const s = o._withCacheBust(i, this._refreshSeed);
    r || (r = document.createElement("img"), r.className = "camera-image is-hidden", r.alt = "", e.insertBefore(r, e.firstChild), this._bindImageElement(r)), r.dataset.cameraSrcBase = i, r.dataset.cameraEntity = a.entity, r.src = s;
  }
  // NOVO: retorna o entity_picture VIVO da camera (token atual do hass). Se o
  // hass ainda nao tiver, cai para o ultimo conhecido / o que veio no modelo.
  _liveImageBase(e) {
    if (!e) return "";
    const a = this._hass?.states?.[e.entity]?.attributes?.entity_picture || "";
    return a && (this._lastCameraImages[e.entity] = a), a || e.image || this._lastCameraImages[e.entity] || "";
  }
  // NOVO (2b): reescreve so o conteudo da pilula (sem imagens) -> nao pisca.
  _updateSlotPill(e, a, i) {
    if (!e) return;
    const t = !!e.closest?.(".security-subview.is-desktop");
    e.innerHTML = o._pillInner(a, i, t);
  }
  _openMoreInfo(e) {
    e && (globalThis.BrunoLiquidGlass?.feedback?.("tap"), this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: e },
      bubbles: !0,
      composed: !0
    })));
  }
  _handleDialogClosed(e) {
    if (e?.detail?.dialog !== "ha-more-info-dialog" || this._liveState !== "handed-off") return;
    const a = this._model()?.activeId || "";
    this._liveState = "resuming", globalThis.BrunoCameraLive?.marcar?.(a, "more-info fechado; retomando"), this._liveResumeTimer && globalThis.clearTimeout(this._liveResumeTimer), this._liveResumeTimer = globalThis.setTimeout(() => {
      this._liveResumeTimer = null, !(!this.isConnected || this._liveState !== "resuming") && (this._liveState = "idle", this._liveBlockedEntity = "", this._mountLiveFeed(this._model().activeId));
    }, 700);
  }
  _navigateHome() {
    const e = this._config?.navigation_path;
    if (!e) return;
    const a = this._resolveNavigationPath(e);
    globalThis.BrunoLiquidGlass?.routeTransition?.(), this.dispatchEvent(new CustomEvent("hass-navigate", {
      detail: { path: a },
      bubbles: !0,
      composed: !0
    })), globalThis.setTimeout?.(() => {
      !a || globalThis.location?.pathname === a || (globalThis.history?.pushState?.(null, "", a), globalThis.dispatchEvent?.(new CustomEvent("location-changed", { detail: { replace: !1 } })));
    }, 80);
  }
  _resolveNavigationPath(e) {
    if (!e) return "/";
    if (e.startsWith("/")) return e;
    const i = (globalThis.location?.pathname || "/lovelace/0").split("/").filter(Boolean);
    return `/${i.length ? i[0] : "lovelace"}/${e}`;
  }
  _callService(e, a, i = {}) {
    !this._hass || !e || !a || this._hass.callService(e, a, i);
  }
  _startClockTimer() {
    this._clockTimer || (this._clockTimer = globalThis.setInterval(this._boundClock, 1e3));
  }
  _stopClockTimer() {
    this._clockTimer && (globalThis.clearInterval(this._clockTimer), this._clockTimer = null);
  }
  _updateClock() {
    const e = o._clock();
    e !== this._lastClock && (this._lastClock = e, this.shadowRoot?.querySelector("[data-clock]")?.replaceChildren(document.createTextNode(e)), this.shadowRoot?.querySelector("[data-date]")?.replaceChildren(document.createTextNode(o._date()))), this._updateDesktopInformational();
  }
  _startRefreshTimer() {
    if (this._refreshTimer || !this.isConnected) return;
    const e = Math.max(3e3, Number(this._config?.refresh_interval) || p.refresh_interval);
    this._sincronizarMotorCameras(), !this._motorCameras && (this._refreshTimer = globalThis.setInterval(() => this._refreshCameraImagesLegado(), e));
  }
  _stopRefreshTimer() {
    this._motorCameras?.parar(), this._refreshTimer && (globalThis.clearInterval(this._refreshTimer), this._refreshTimer = null);
  }
  // ── MOTOR DE INSTANTANEOS (ponte, 2026-08-08) ─────────────────────────────
  //
  // ANTERIOR (rollback): o corpo original de _refreshCameraImages() esta logo
  // abaixo, comentado. Ele disparava um preload por camera a CADA 3 SEGUNDOS,
  // sem olhar se o anterior tinha terminado, sem prazo, sem cancelamento e sem
  // onerror. Com carga medida de 3 a 9 s por quadro e OITO cameras, cada uma
  // mantinha requisicoes sobrepostas o tempo todo — e um carregamento que
  // falhasse ficava pendurado para sempre, congelando aquela imagem.
  //
  //   _refreshCameraImages() {
  //     const stamp = Date.now();
  //     this._refreshSeed = stamp;
  //     this.shadowRoot.querySelectorAll('img[data-camera-src-base]').forEach((image) => {
  //       const nextSrc = ..._withCacheBust(baseSrc, stamp);
  //       const loader = new globalThis.Image();
  //       loader.onload = () => { image.src = nextSrc; ... };
  //       loader.src = nextSrc;      // sem onerror, sem prazo, sem cancelar
  //     });
  //   }
  //
  // AGORA: o mesmo motor do subview de comodo (services/camera/snapshot-engine),
  // exposto pelo bundle em globalThis.BrunoCameraEngine. Politica: nunca duas
  // requisicoes em voo por camera; espera = max(folga, cadencia - duracao);
  // prazo de 25 s com cancelamento; recuo exponencial que poupa quem ainda nao
  // mostrou imagem; partida escalonada; cadencia propria para as miniaturas.
  //
  // Sem o bundle carregado, cai no ciclo antigo — a subview nunca fica sem
  // atualizar imagem por causa desta ponte.
  _refreshCameraImages() {
    this._motorCameras?.atualizarAgora();
  }
  /**
   * O ciclo antigo, preservado como rede de segurança.
   *
   * So roda quando o bundle nao esta carregado (motor indisponivel). Ganhou o
   * `onerror` que faltava no original — sem ele, uma imagem que falhava ficava
   * escondida para sempre.
   */
  _refreshCameraImagesLegado() {
    if (!this.shadowRoot || !this._hass || !globalThis.Image) return;
    const e = Date.now();
    this._refreshSeed = e, this.shadowRoot.querySelectorAll("img[data-camera-src-base]").forEach((a) => {
      const i = a.dataset.cameraEntity, t = i ? this._hass.states?.[i]?.attributes?.entity_picture : "", r = t || a.dataset.cameraSrcBase;
      if (!r) return;
      t && t !== a.dataset.cameraSrcBase && (a.dataset.cameraSrcBase = t);
      const s = o._withCacheBust(r, e), n = new globalThis.Image();
      n.onload = () => {
        if (globalThis.BrunoCameraLive?.pareceQuadroVerde?.(n)) {
          globalThis.BrunoCameraLive?.marcar?.(i, "snapshot verde rejeitado", 0, !1);
          return;
        }
        a.src = s, a.dataset.hasLoaded = "true", a.classList.remove("is-hidden");
      }, n.onerror = () => {
        n.onload = null, n.onerror = null;
      }, n.src = s;
    });
  }
  /** Cria o motor uma vez. Devolve false quando o bundle nao esta disponivel. */
  _garantirMotorCameras() {
    if (this._motorCameras) return !0;
    const e = globalThis.BrunoCameraEngine;
    return typeof e != "function" ? !1 : (this._motorCameras = new e({
      aoCarregar: (a) => this._aplicarQuadro(a.entityId, a.url)
    }), !0);
  }
  /** Declara ao motor as cameras na tela: o palco e principal, as demais nao. */
  _sincronizarMotorCameras() {
    if (!this._garantirMotorCameras() || !this.shadowRoot || !this._hass) return;
    const e = [], a = /* @__PURE__ */ new Set();
    this.shadowRoot.querySelectorAll("img[data-camera-entity]").forEach((i) => {
      const t = i.dataset.cameraEntity;
      if (!t || a.has(t) || this._liveReady === t) return;
      const r = this._liveImageBase({ entity: t }) || i.dataset.cameraSrcBase;
      r && (a.add(t), e.push({
        entityId: t,
        base: r,
        prioridade: i.closest(".image-stage") && !i.closest(".camera-tile") ? "principal" : "secundaria"
      }));
    }), this._motorCameras.definirAlvos(e), this._motorCameras.iniciar();
  }
  /** Poe na tela o quadro que o motor baixou. */
  _aplicarQuadro(e, a) {
    const i = this.shadowRoot?.querySelector(`img[data-camera-entity="${e}"]`);
    i && (i.src = a, i.dataset.hasLoaded = "true", i.classList.remove("is-hidden"));
  }
  _handleClick(e) {
    const a = e.target?.closest?.("[data-action]");
    if (!a) return;
    const i = a.dataset.action, t = a.dataset.cameraId;
    if (i === "select-camera") {
      e.preventDefault(), this._selectCamera(t);
      return;
    }
    if (i === "toggle-camera-menu") {
      e.preventDefault(), globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._cameraMenuOpen = !this._cameraMenuOpen, this._alternarFaixaControles();
      return;
    }
    if (i === "toggle-camera-control") {
      e.preventDefault();
      const r = a.dataset.controlEntity;
      if (!r || !this._hass?.states?.[r]) return;
      globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._callService("homeassistant", "toggle", { entity_id: r });
      return;
    }
    if (i === "more-info") {
      e.preventDefault();
      const r = t || this._model().activeId;
      this._liveLoadToken++, this._liveState = "handed-off", globalThis.BrunoCameraLive?.marcar?.(r, "entregue ao more-info"), this._stopLiveFeed(), this._sincronizarMotorCameras(), this._refreshCameraImages(), this._openMoreInfo(r);
      return;
    }
    if (i === "refresh") {
      e.preventDefault(), globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._refreshSeed = Date.now(), this._render();
      return;
    }
    i === "navigate-home" && (e.preventDefault(), this._navigateHome());
  }
  _handleKeydown(e) {
    if (e.key !== "Enter" && e.key !== " ") return;
    const a = e.target?.closest?.("[data-action]");
    a && (e.preventDefault(), a.click());
  }
  _bindImages() {
    this.shadowRoot?.querySelectorAll("img[data-camera-src-base]").forEach((e) => this._bindImageElement(e));
  }
  // NOVO (2b): liga load/error de UM <img> (reutilizado por _updateStage ao
  // criar uma imagem nova durante a troca de slot).
  _bindImageElement(e) {
    e.addEventListener("load", () => {
      e.dataset.hasLoaded = "true", e.classList.remove("is-hidden");
    }), e.addEventListener("error", () => {
      e.dataset.hasLoaded !== "true" && e.classList.add("is-hidden");
    });
  }
  _render() {
    this._config || (this._config = this._normalizeConfig()), this.shadowRoot || this.attachShadow({ mode: "open" }), globalThis.BrunoLiquidGlass?.apply?.();
    try {
      const e = this._model(), a = e.activeCamera;
      this._lastClock = o._clock();
      const t = this._isMobileLayout() ? `
          <main class="security-subview">
            <header class="security-topbar">
              <button class="icon-button" type="button" data-action="navigate-home" aria-label="Voltar para o painel principal">
                <bruno-icon icon="mdi:arrow-left"></bruno-icon>
              </button>

              <div class="brand">
                <span class="brand-main">Residência</span>
                <span class="brand-sep" aria-hidden="true">·</span>
                <strong class="brand-strong">Segurança</strong>
              </div>

              <div class="clock-block" aria-label="Horario atual">
                <span data-clock>${o._escape(this._lastClock)}</span>
                <small data-date>${o._escape(o._date())}</small>
              </div>
            </header>

            <section class="security-grid">
              <section class="main-feed">
                ${o._mainFeed(a)}
              </section>

              <aside class="side-rail" aria-label="Cameras principais">
                ${e.sideCameras.map((r) => o._tile(r, "side")).join("")}
              </aside>

              <section class="bottom-strip" aria-label="Outras cameras">
                ${e.bottomCameras.map((r) => o._tile(r, "bottom")).join("")}
              </section>
            </section>

            <footer class="security-footer">
              <span class="enc-note">
                <bruno-icon icon="mdi:shield-lock-outline" aria-hidden="true"></bruno-icon>
                Todas as câmeras estão protegidas com criptografia de ponta a ponta
              </span>
            </footer>
          </main>
        ` : `
          <main class="security-subview is-desktop">
            <header class="camera-overview-head">
              <div class="camera-overview-title">
                <h1>Câmeras</h1>
                <p>
                  <span>${e.totalCount} câmeras</span>
                  <span class="overview-sep" aria-hidden="true">·</span>
                  <span>${e.onlineCount} online</span>
                </p>
              </div>
            </header>

            <section class="camera-overview-grid">
              <section class="camera-primary-column">
                <section class="main-feed" aria-label="Câmera principal">
                  ${o._mainFeed(a, !0, this._cameraControls(a), this._cameraMenuOpen)}
                </section>
                <section class="camera-insights" data-camera-insights aria-label="Resumo de câmeras">
                  ${o._insightsInner(e)}
                </section>
              </section>

              <aside class="camera-groups" aria-label="Câmeras por área">
                ${o._groupSection("social", "Área social", e.socialCameras)}
                ${o._groupSection("intimate", "Área íntima", e.intimateCameras)}
              </aside>
            </section>
          </main>
        `;
      this.shadowRoot.innerHTML = `<style>${this._styles()}</style>${t}`, this.shadowRoot.removeEventListener("click", this._boundClick), this.shadowRoot.removeEventListener("keydown", this._boundKeydown), this.shadowRoot.addEventListener("click", this._boundClick), this.shadowRoot.addEventListener("keydown", this._boundKeydown), this._bindImages(), this._syncCameraControls(), this._syncPrivacySurfaces(), this._updateDesktopInformational(e), this._mountLiveFeed(e.activeId), this._renderedSignature = o._signatureFromModel(e);
    } catch (e) {
      this._renderError(e);
    }
  }
  // ANTERIOR (rollback WebRTC direto): cria o hui-image legado. Usa o hui-image
  // nativo do HA (cameraView: live) — ele resolve HLS/WebRTC e ja faz fallback
  // para snapshot internamente. Se o hui-image nao estiver registrado, retorna
  // null e o chamador cai no snapshot.
  _ensureLiveEl() {
    if (this._liveEl) return this._liveEl;
    if (!globalThis.customElements || !customElements.get("hui-image")) return null;
    const e = document.createElement("hui-image");
    e.classList.add("camera-live-el"), e.cameraView = "live";
    try {
      e.fitMode = "cover";
    } catch {
    }
    return this._liveEl = e, e;
  }
  // ANTERIOR (rollback WebRTC direto): reaponta o hui-image legado.
  _setLiveCamera(e) {
    const a = this._liveEl;
    return a ? (a.hass = this._hass, a.cameraImage !== e && (a.cameraImage = e), !0) : !1;
  }
  // ANTERIOR (rollback ONVIF ao vivo 2026-08-24) — WebRTC direto.
  //
  // O bloco abaixo montava um ha-web-rtc-player cru sobre a entidade ONVIF.
  // Ele exige que a negociacao WebRTC feche; qualquer falha (prazo, sem video,
  // contexto Lit, player nao registrado) caia em _failLiveFeed, que marca
  // _liveBlockedEntity e BLOQUEIA aquela camera pelo resto da vida da
  // instancia — sobrando so o instantaneo.
  //
  // O bloco esta INTEGRO em comentario. Para reativar: descomentar e remover o
  // _mountLiveFeed novo. _startLivePlayerAfterContext permanece definido logo
  // abaixo, intacto.
  //
  //   // ATIVO: reinsere WebRTC direto quando o render recria o DOM. Sem o player
  //   // registrado, mantem somente o snapshot e nao inicia fallback HLS.
  //   _mountLiveFeed(activeId) {
  //     const mount = this.shadowRoot?.querySelector('.main-feed [data-live-mount]');
  //     const camera = this._model().cameras.find((item) => item.entity === activeId);
  //     if (this._liveState === 'fallback' && this._liveBlockedEntity !== activeId) {
  //       this._liveState = 'idle';
  //       this._liveBlockedEntity = '';
  //     }
  //     if (
  //       !this.isConnected || !mount || !activeId || camera?.unavailable ||
  //       ['loading-player', 'handed-off', 'resuming', 'fallback'].includes(this._liveState)
  //     ) {
  //       this._stopLiveFeed();
  //       return;
  //     }
  //
  //     if (!this._liveEl || this._liveEntity !== activeId) {
  //       this._stopLiveFeed();
  //       if (!globalThis.customElements?.get('ha-web-rtc-player')) {
  //         this._liveState = 'loading-player';
  //         const token = ++this._liveLoadToken;
  //         const garantir = globalThis.BrunoCameraLive?.garantirPlayer;
  //         if (typeof garantir !== 'function') {
  //           this._liveState = 'fallback';
  //           this._liveBlockedEntity = activeId;
  //           return;
  //         }
  //         Promise.resolve(garantir(activeId, this._hass)).then((ok) => {
  //           if (!this.isConnected || token !== this._liveLoadToken) return;
  //           this._liveState = ok ? 'idle' : 'fallback';
  //           this._liveBlockedEntity = ok ? '' : activeId;
  //           this._mountLiveFeed(this._model().activeId);
  //         });
  //         return;
  //       }
  //       const el = globalThis.BrunoCameraLive?.criarPlayer?.()
  //         || document.createElement('ha-web-rtc-player');
  //       this._liveState = 'negotiating';
  //       el.classList.add('camera-live-el');
  //       el.setAttribute('muted', '');
  //       el.setAttribute('playsinline', '');
  //       el.setAttribute('autoplay', '');
  //       try { el.fitMode = 'cover'; } catch (error) { /* CSS cobre versoes sem fitMode. */ }
  //       this._liveLoadHandler = () => this._markLiveReady();
  //       this._liveStreamsHandler = (event) => {
  //         if (event?.detail?.hasVideo === false) this._failLiveFeed(activeId, 'sem video');
  //       };
  //       el.addEventListener('load', this._liveLoadHandler);
  //       el.addEventListener('streams', this._liveStreamsHandler);
  //       this._liveEl = el;
  //       this._liveEntity = activeId;
  //
  //       // O player oficial consome apiContext/connectionContext no primeiro
  //       // update Lit. Atribuir entityid imediatamente depois do append ainda era
  //       // cedo: _startWebRtc retornava sem contexto e nao tentava novamente.
  //       mount.appendChild(el);
  //       // ANTERIOR (rollback contexto Lit): atribuicao imediata de entityid e
  //       // armacao do prazo de 30 s neste ponto.
  //       this._startLivePlayerAfterContext(el, activeId);
  //       return;
  //     }
  //
  //     if (this._liveEl.parentElement !== mount) mount.appendChild(this._liveEl);
  //     if (this._liveEl.entityid !== activeId) this._liveEl.entityid = activeId;
  //   }
  //
  //
  // ATIVO (2026-08-24): a camera principal transmite pela entidade ONVIF
  // usando o hui-image nativo do Home Assistant.
  //
  // POR QUE hui-image, e nao o player WebRTC direto
  //
  // hui-image com cameraView live e o mesmo elemento que o proprio HA usa no
  // more-info: ele resolve WebRTC quando disponivel, cai para HLS quando nao,
  // e cai para instantaneo por conta propria. Reimplementar essa cadeia a mao
  // ja custou uma rodada inteira neste projeto (registro de 2026-08-07 rev.2:
  // tres negociacoes, tres falhas, e as tentativas ainda consumiam a camera e
  // matavam de fome os instantaneos dos outros comodos).
  //
  // A entidade continua sendo a ONVIF declarada na configuracao
  // (camera.*_profile_1) — nada de origem muda aqui.
  //
  // _ensureLiveEl e _setLiveCamera ja existiam no arquivo para este caminho.
  _mountLiveFeed(e) {
    const a = this.shadowRoot?.querySelector(".main-feed [data-live-mount]"), i = this._model().cameras.find((r) => r.entity === e);
    if (this._liveState === "fallback" && this._liveBlockedEntity !== e && (this._liveState = "idle", this._liveBlockedEntity = ""), !this.isConnected || !a || !e || i?.unavailable || this._liveState === "fallback" && this._liveBlockedEntity === e) {
      this._stopLiveFeed();
      return;
    }
    const t = this._ensureLiveEl();
    if (!t) {
      this._liveState = "fallback", this._liveBlockedEntity = e, this._stopLiveFeed();
      return;
    }
    this._liveEntity !== e && (this._liveReady = "", this._liveGreenMarked = "", this._liveEntity = e, this._liveStartedAt = globalThis.performance?.now?.() || Date.now(), this._liveState = "negotiating", this._liveLoadHandler && t.removeEventListener("load", this._liveLoadHandler), this._liveLoadHandler = () => this._markLiveReady(), t.addEventListener("load", this._liveLoadHandler), this._liveTimer && globalThis.clearTimeout(this._liveTimer), this._liveTimer = globalThis.setTimeout(
      () => this._promoverLiveFeed(e),
      u
    )), this._setLiveCamera(e), t.parentElement !== a && a.appendChild(t);
  }
  // Prazo esgotado SEM video detectado.
  //
  // Nao e falha: hui-image e a autoridade sobre o que consegue exibir, e o
  // proprio fallback interno dele ja pode estar na tela. Revelar o elemento e
  // melhor do que arrancar um player que so demorou mais que o prazo — e, ao
  // contrario de _failLiveFeed, nao bloqueia a camera para o resto da sessao.
  _promoverLiveFeed(e) {
    !e || e !== this._liveEntity || !this._liveEl || (this._liveTimer = null, this._liveReady !== e && (this._liveReady = e, this._liveState = "live", this._liveEl.classList.add("is-ready"), this._sincronizarMotorCameras()));
  }
  _startLivePlayerAfterContext(e, a) {
    Promise.resolve(e.updateComplete).then(() => {
      this._liveEl !== e || this._liveEntity !== a || !e.isConnected || (this._liveStartedAt = globalThis.performance?.now?.() || Date.now(), e.entityid = a, globalThis.BrunoCameraLive?.marcar?.(a, "entityid atribuido"), this._liveTimer = globalThis.setTimeout(() => {
        this._liveEl === e && this._liveEntity === a && this._liveReady !== a && this._failLiveFeed(a, "prazo");
      }, u));
    }).catch(() => {
      this._liveEl === e && this._liveEntity === a && this._failLiveFeed(a, "contexto");
    });
  }
  // O <video> pode estar num shadow root ANINHADO.
  //
  // Com o player WebRTC cru ele era filho direto do proprio elemento. Com o
  // hui-image ha um nivel a mais: hui-image renderiza ha-hls-player ou
  // ha-web-rtc-player, e o video vive no shadow root DESSE filho. Uma busca de
  // um nivel so nunca acharia — e o feed ficaria invisivel para sempre, com o
  // instantaneo por baixo dando a impressao de que nada mudou.
  _acharVideoAoVivo(e, a = 0) {
    if (!e || a > 4) return null;
    const i = e.querySelector?.("video");
    if (i) return i;
    for (const t of e.querySelectorAll?.("*") ?? []) {
      if (!t.shadowRoot) continue;
      const r = this._acharVideoAoVivo(t.shadowRoot, a + 1);
      if (r) return r;
    }
    return null;
  }
  _markLiveReady() {
    const e = this._liveEl, a = this._liveEntity, i = e?.shadowRoot ? this._acharVideoAoVivo(e.shadowRoot) : null;
    if (!(!e || !a || !i || i.readyState < 2 || this._liveReady === a)) {
      if (globalThis.BrunoCameraLive?.pareceQuadroVerde?.(i)) {
        if (this._liveGreenMarked !== a) {
          this._liveGreenMarked = a;
          const t = globalThis.performance?.now?.() || Date.now();
          globalThis.BrunoCameraLive?.marcar?.(
            a,
            "quadro verde rejeitado",
            t - (this._liveStartedAt || t),
            !1
          );
        }
        this._liveGreenTimer && globalThis.clearTimeout(this._liveGreenTimer), this._liveGreenTimer = globalThis.setTimeout(() => {
          this._liveGreenTimer = null, this._markLiveReady();
        }, 700);
        return;
      }
      this._liveReady = a, this._liveState = "live", this._liveGreenTimer && globalThis.clearTimeout(this._liveGreenTimer), this._liveGreenTimer = null, e.classList.add("is-ready"), this._liveTimer && globalThis.clearTimeout(this._liveTimer), this._liveTimer = null, this._sincronizarMotorCameras();
    }
  }
  _failLiveFeed(e, a = "falha") {
    if (!e || e !== this._liveEntity) return;
    const i = globalThis.performance?.now?.() || Date.now();
    globalThis.BrunoCameraLive?.marcar?.(
      e,
      a,
      i - (this._liveStartedAt || i),
      !1
    ), this._liveState = "fallback", this._liveBlockedEntity = e, this._stopLiveFeed(), this._sincronizarMotorCameras(), this._refreshCameraImages();
  }
  _stopLiveFeed() {
    this._liveTimer && globalThis.clearTimeout(this._liveTimer), this._liveTimer = null, this._liveGreenTimer && globalThis.clearTimeout(this._liveGreenTimer), this._liveGreenTimer = null;
    const e = this._liveEl;
    e && (this._liveLoadHandler && e.removeEventListener("load", this._liveLoadHandler), this._liveStreamsHandler && e.removeEventListener("streams", this._liveStreamsHandler), e.remove()), this._liveEl = null, this._liveEntity = "", this._liveReady = "", this._liveGreenMarked = "", this._liveLoadHandler = null, this._liveStreamsHandler = null;
  }
  _renderError(e) {
    this.shadowRoot || this.attachShadow({ mode: "open" }), console.error("[bruno-cameras-security-subview]", e), this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          min-height: 520px;
        }
        .error-card {
          min-height: 520px;
          display: grid;
          place-items: center;
          padding: 24px;
          border-radius: 24px;
          color: rgba(255,255,255,0.92);
          background: linear-gradient(160deg, rgba(60,20,28,0.70), rgba(20,20,30,0.58));
          border: 1px solid rgba(255,120,145,0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 44px rgba(0,0,0,0.24);
        }
        .error-content {
          max-width: 520px;
        }
        .error-title {
          display: block;
          font-size: 16px;
          line-height: 1.2;
          font-weight: 760;
        }
        .error-detail {
          display: block;
          margin-top: 10px;
          font-size: 12px;
          line-height: 1.45;
          color: rgba(255,255,255,0.66);
          word-break: break-word;
        }
      </style>
      <div class="error-card">
        <span class="error-content">
          <span class="error-title">Bruno Cameras Security Subview</span>
          <span class="error-detail">${o._escape(e?.message || e || "Render error")}</span>
        </span>
      </div>
    `;
  }
  _styles() {
    return `
      :host {
        /* ORIGINAL (rollback):
        --security-accent: 96, 165, 250;
        --security-live: 34, 197, 94;
        --security-warn: 251, 191, 36;
        */
        /* NOVO: acentos ligados aos tokens do bruno-liquid-glass.js (padrao das
           demais subviews). Mantem o formato "R, G, B" usado em rgba(var(...)). */
        --security-accent: var(--bruno-liquid-accent, 150, 190, 255);
        --security-live: var(--bruno-liquid-green-accent, 46, 231, 122);
        --security-warn: var(--bruno-liquid-warm-accent, 255, 183, 77);
        /* ORIGINAL (rollback): --security-panel: rgba(10, 15, 22, 0.68); (slate/azul) */
        --security-panel: rgba(7, 9, 12, 0.66);
        --security-border: rgba(255,255,255,0.14);
        display: block;
        width: 100%;
        /* ORIGINAL (rollback): height: 100% / min-height:100vh.
           O 1fr dependia da altura do container; em subview o container nao
           recebia altura de viewport e a linha colapsava (conteudo achatado no
           topo, rail sem espaco para centralizar). */
        /* NOVO (feedback): altura DEFINIDA de viewport (desconta o padding de
           12px da shell, topo+base = 24px). Isso forca a linha a crescer => a
           celula da rail fica cheia e a rail centraliza sozinha, e o miolo
           ocupa quase todo o painel. Uso vh (nao dvh) por compat. com o tablet. */
        height: 100%;
        min-height: 0;
        /* transparente — a shell da view fornece o grafite da Home */
        background: transparent;
        color: rgba(246,250,255,0.94);
        font-family: var(--paper-font-body1_-_font-family, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
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

      /* ORIGINAL (rollback): shell com topbar 44px + grade, fundo proprio (foto/veu).
         grid-template-rows: 44px minmax(0,1fr); padding: 8px; background: <foto+veu>. */
      .security-subview {
        width: 100%;
        height: 100%;
        min-height: 0;
        display: grid;
        /* NOVO (feedback): faixa superior na altura da barra de badges (64px),
           miolo que cresce (1fr) e faixa inferior na altura da barra de cenas/
           acoes da Home (74px). */
        grid-template-rows: 48px minmax(0, 1fr) 54px;
        gap: 10px;
        padding: 0;
        overflow: hidden;
        /* NOVO: transparente — a shell da view (cameras-security.yaml) fornece o
           grafite quente da Home atras do rail + console. */
        background: transparent;
      }

      /* ORIGINAL (rollback): topbar com skin glass (caixa/janela translucida). */
      /* NOVO (feedback): faixa superior 100% TRANSPARENTE — sem caixa, sem
         janela, sem blur. Apenas seta (esq.) + titulo centralizado + relogio
         (dir.), igual ao "topo sem conteudo" das demais subviews. */
      .security-topbar {
        min-width: 0;
        display: grid;
        grid-template-columns: 40px minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        padding: 0 6px;
        background: transparent;
        border: none;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .security-topbar .icon-button[data-action="navigate-home"] {
        visibility: hidden;
        pointer-events: none;
      }

      /* NOVO (feedback): botao de voltar "fantasma" — sem caixa, so o icone.
         Ganha um leve realce (azul = interacao) em hover/foco. */
      .icon-button {
        appearance: none;
        -webkit-appearance: none;
        width: 36px;
        height: 36px;
        display: grid;
        place-items: center;
        padding: 0;
        border-radius: 999px;
        border: none;
        background: transparent;
        box-shadow: none;
        color: rgba(226,232,240,0.82);
        transition: background 160ms ease, color 160ms ease;
      }

      .icon-button:hover,
      .icon-button:focus-visible {
        background: rgba(var(--security-accent),0.16);
        color: rgba(245,250,255,0.96);
        outline: none;
      }

      .icon-button bruno-icon {
        --mdc-icon-size: 18px;
      }

      .brand {
        min-width: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        color: rgba(226,232,240,0.72);
        font-size: 14px;
        line-height: 1;
        letter-spacing: 0.04em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ORIGINAL (rollback): .brand strong / .divider (titulo TITLE | SECTION) */
      .brand-main {
        color: rgba(226,232,240,0.74);
        font-weight: 600;
      }

      .brand-strong {
        color: rgba(255,255,255,0.92);
        font-weight: 760;
      }

      .brand-sep {
        color: rgba(255,255,255,0.32);
        font-weight: 600;
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
      }

      .clock-block small {
        color: rgba(226,232,240,0.58);
        font-size: 10px;
        line-height: 1;
      }

      /* --- ORIGINAL (rollback): side-rail e bottom-strip dimensionados por
         mecanismos diferentes (1fr esticado vs clamp), gerando tiles laterais
         quase quadrados e inferiores retangulares. ---
      .security-grid {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: minmax(0, 1fr) clamp(188px, 22vw, 270px);
        grid-template-rows: minmax(0, 1fr) clamp(108px, 19vh, 158px);
        grid-template-areas:
          "main side"
          "strip strip";
        gap: 10px;
      }
      --- FIM ORIGINAL --- */
      /* NOVO: grade uniforme 4 colunas x 4 linhas. O feed principal ocupa o
         bloco 3x3 (main) e cada thumbnail (lateral ou inferior) ocupa exatamente
         1 coluna (1fr) x 1 linha (1fr) => TODOS os mini-tiles tem a MESMA
         dimensao. Os gaps internos das trilhas (10px) batem com o gap externo,
         garantindo a equalizacao. */
      .security-grid {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        grid-template-rows: repeat(4, minmax(0, 1fr));
        grid-template-areas:
          "main main main side"
          "main main main side"
          "main main main side"
          "strip strip strip strip";
        gap: 10px;
      }

      .main-feed {
        grid-area: main;
        min-width: 0;
        min-height: 0;
      }

      .side-rail {
        grid-area: side;
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .bottom-strip {
        grid-area: strip;
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 10px;
      }

      /* ORIGINAL (rollback): skin bespoke com gradientes/borda/sombra fixos.
      .feed-card,
      .camera-tile {
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        border-radius: 18px;
        background:
          radial-gradient(180px 110px at 16% 8%, rgba(255,255,255,0.10), transparent 72%),
          linear-gradient(155deg, rgba(255,255,255,0.10), rgba(255,255,255,0.034)),
          var(--security-panel);
        border: 1px solid var(--security-border);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.13),
          inset 0 -1px 0 rgba(0,0,0,0.26),
          0 18px 38px rgba(0,0,0,0.26);
        backdrop-filter: var(--bruno-liquid-card-filter, blur(28px) saturate(1.52));
        -webkit-backdrop-filter: var(--bruno-liquid-card-filter, blur(28px) saturate(1.52));
      }

      .feed-card {
        width: 100%;
        height: 100%;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto;
        border-radius: 22px;
      }
      --- FIM ORIGINAL --- */
      /* NOVO: superficie glass compartilhada (mesma assinatura .glass-card das
         demais subviews) lendo os tokens --bruno-liquid-surface-off-* e os raios
         de --bruno-liquid-cell-radius / --bruno-liquid-card-radius-compact. */
      .feed-card,
      .camera-tile {
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        border-radius: var(--bruno-liquid-cell-radius, 18px);
        background: var(--bruno-liquid-surface-off-background,
          radial-gradient(180px 110px at 16% 8%, rgba(255,255,255,0.10), transparent 72%),
          linear-gradient(155deg, rgba(255,255,255,0.10), rgba(255,255,255,0.034)),
          var(--security-panel));
        border: var(--bruno-liquid-surface-off-border, 1px solid var(--security-border));
        box-shadow: var(--bruno-liquid-surface-off-shadow,
          inset 0 1px 0 rgba(255,255,255,0.13),
          inset 0 -1px 0 rgba(0,0,0,0.26),
          0 18px 38px rgba(0,0,0,0.26));
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(28px) saturate(1.52));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(28px) saturate(1.52));
      }

      /* ORIGINAL (rollback): .feed-card em grid (imagem 1fr + rodape preto). */
      /* NOVO (redesign): hero ocupa tudo, cantos amplos da Home, sem rodape. */
      .feed-card {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: var(--bruno-liquid-card-radius, 24px);
      }

      .image-stage {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        /* ORIGINAL (rollback): linear-gradient(145deg, rgba(15,23,42,0.92), rgba(2,6,23,0.82)) (slate/azul) */
        background: rgba(255,255,255,0.025);
      }

      .camera-image {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        display: block;
        filter: saturate(1.02) contrast(1.02);
      }

      .camera-image.is-hidden,
      .image-stage:not(.has-image) .camera-image {
        display: none;
      }

      /* Player WebRTC acima da foto e abaixo da vinheta e dos controles. */
      .camera-live {
        position: absolute;
        inset: 0;
        overflow: hidden;
        z-index: 1;
        background: transparent;
      }

      .camera-live > *,
      .camera-live hui-image,
      .camera-live-el {
        display: block;
        width: 100% !important;
        height: 100% !important;
        opacity: 0;
        transition: opacity 160ms ease;
      }

      .camera-live-el.is-ready { opacity: 1; }

      .camera-live video,
      .camera-live img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }

      .camera-placeholder {
        position: absolute;
        inset: 0;
        display: none;
        place-items: center;
        color: rgba(226,232,240,0.24);
      }

      .camera-placeholder bruno-icon {
        --mdc-icon-size: 58px;
        filter: drop-shadow(0 14px 22px rgba(0,0,0,0.38));
      }

      /* ORIGINAL (rollback): .feed-scrim/.tile-scrim (scrim preto pesado). */
      /* NOVO (redesign): vinheta MUITO discreta nas extremidades — preserva a
         leitura do video; sem aplicar tom por cima da imagem. */
      .feed-vignette,
      .tile-vignette {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background:
          radial-gradient(120% 120% at 50% 42%, transparent 60%, rgba(0,0,0,0.26) 100%),
          linear-gradient(0deg, rgba(0,0,0,0.34), rgba(0,0,0,0.05) 24%, transparent 44%);
      }

      /* ORIGINAL (rollback): .feed-title (pilula unica topo-esquerda). */
      /* NOVO (redesign): faixa de overlay no topo do hero (nome a esq., REC a dir.). */
      .feed-overlay-top {
        position: absolute;
        left: 16px;
        right: 16px;
        top: 14px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        pointer-events: none;
      }

      .cam-pill {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        max-width: calc(100% - 130px);
        padding: 7px 12px;
        border-radius: 999px;
        color: rgba(255,255,255,0.95);
        background: rgba(6,8,11,0.42);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 22px rgba(0,0,0,0.26);
        backdrop-filter: blur(14px) saturate(1.22);
        -webkit-backdrop-filter: blur(14px) saturate(1.22);
        font-size: 12.5px;
        line-height: 1;
        font-weight: 720;
      }

      .cam-pill-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .rec-pill {
        display: inline-flex;
        align-items: center;
        gap: 7px;
        padding: 6px 11px;
        border-radius: 999px;
        color: rgba(255,236,236,0.96);
        background: rgba(220,38,38,0.22);
        border: 1px solid rgba(248,113,113,0.46);
        box-shadow: 0 0 16px rgba(239,68,68,0.26);
        font-size: 11px;
        line-height: 1;
        font-weight: 760;
        text-transform: uppercase;
        letter-spacing: 0.04em;
      }

      .rec-dot {
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: rgb(239,68,68);
        box-shadow: 0 0 10px rgba(239,68,68,0.8);
        animation: rec-blink 1.4s ease-in-out infinite;
      }

      @keyframes rec-blink {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.35; }
      }

      .status-dot {
        flex: 0 0 auto;
        width: 7px;
        height: 7px;
        border-radius: 999px;
        background: rgba(148,163,184,0.85);
        box-shadow: 0 0 0 1px rgba(255,255,255,0.12);
      }

      .status-dot.is-online {
        background: rgb(var(--security-live));
        box-shadow: 0 0 12px rgba(var(--security-live),0.62);
      }

      /* NOVO (disciplina de cor): vermelho SO em gravacao/alerta real. */
      .status-dot.is-recording {
        background: rgb(239,68,68);
        box-shadow: 0 0 12px rgba(239,68,68,0.7);
      }

      /* ORIGINAL (rollback): .feed-actions/.action-pill fixos sempre visiveis. */
      /* NOVO (redesign): controles flutuantes minimizados no canto do hero,
         faintes por padrao (acessiveis ao toque) e plenos em hover/foco. */
      .feed-controls {
        position: absolute;
        right: 14px;
        bottom: 14px;
        display: flex;
        align-items: center;
        gap: 8px;
        opacity: 0.4;
        transition: opacity 180ms ease;
      }

      .feed-card:hover .feed-controls,
      .feed-card:focus-within .feed-controls {
        opacity: 1;
      }

      .hc-btn {
        appearance: none;
        -webkit-appearance: none;
        width: 34px;
        height: 34px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 0;
        border-radius: 999px;
        color: rgba(255,255,255,0.92);
        background: rgba(6,8,11,0.5);
        border: 1px solid rgba(255,255,255,0.16);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 10px 20px rgba(0,0,0,0.28);
        backdrop-filter: blur(14px) saturate(1.22);
        -webkit-backdrop-filter: blur(14px) saturate(1.22);
      }

      .hc-btn span {
        display: none;
      }

      .hc-btn:hover,
      .hc-btn:focus-visible {
        border-color: rgba(var(--security-accent),0.5);
        background: rgba(var(--security-accent),0.2);
        outline: none;
      }

      .hc-btn bruno-icon {
        --mdc-icon-size: 16px;
      }

      /* ORIGINAL (rollback): .feed-footer / .active-name / .active-sub /
         .system-summary (rodape preto grande do hero). Substituidos por
         .feed-status (contagem online discreta sobreposta ao video). */
      .feed-status {
        position: absolute;
        left: 16px;
        bottom: 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        padding: 6px 11px;
        border-radius: 999px;
        color: rgba(220,252,231,0.92);
        background: rgba(6,8,11,0.4);
        border: 1px solid rgba(255,255,255,0.10);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        backdrop-filter: blur(12px) saturate(1.2);
        -webkit-backdrop-filter: blur(12px) saturate(1.2);
        font-size: 11px;
        line-height: 1;
        font-weight: 720;
        font-variant-numeric: tabular-nums;
      }

      .camera-tile {
        appearance: none;
        -webkit-appearance: none;
        display: block;
        width: 100%;
        height: 100%;
        padding: 0;
        outline: none;
        text-align: left;
        transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, filter 160ms ease;
      }

      .camera-tile:hover,
      .camera-tile:focus-visible {
        border-color: rgba(var(--security-accent),0.48);
        filter: brightness(1.06);
        outline: none;
      }

      .camera-tile:active {
        transform: translateY(1px) scale(0.992);
      }

      /* NOVO (2a): pilula do feed PRINCIPAL — mesmo padrao das secundarias
         (.tile-pill), ancorada no canto inferior esquerdo, so um pouco maior por
         ser o hero. Substitui o antigo overlay do topo + contagem "N/N online".
         As regras antigas (.feed-overlay-top, .cam-pill, .rec-pill, .feed-status)
         permanecem abaixo como inertes (nao ha mais markup que as use). */
      .feed-pill {
        position: absolute;
        left: 16px;
        bottom: 14px;
        max-width: calc(100% - 120px);
        display: inline-flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        padding: 0;
        border-radius: 0;
        color: rgba(255,255,255,0.95);
        background: transparent;
        border: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
        font-size: 12.5px;
        line-height: 1;
        font-weight: 720;
      }

      .feed-pill .cam-pill-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      /* ORIGINAL (rollback): .tile-label (barra inferior larga, centralizada). */
      /* NOVO (redesign): pilula compacta integrada, ancorada a esquerda. */
      .tile-pill {
        position: absolute;
        left: 7px;
        bottom: 7px;
        max-width: calc(100% - 14px);
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-width: 0;
        padding: 0;
        border-radius: 0;
        color: rgba(255,255,255,0.92);
        background: transparent;
        border: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .tile-rec {
        flex: 0 0 auto;
        padding: 1px 5px;
        border-radius: 999px;
        font-size: 8.5px;
        font-weight: 800;
        letter-spacing: 0.06em;
        color: rgba(255,236,236,0.96);
        background: rgba(220,38,38,0.30);
        border: 1px solid rgba(248,113,113,0.5);
      }

      .tile-name {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 11px;
        line-height: 1;
        font-weight: 720;
        text-shadow: 0 2px 8px rgba(0,0,0,0.58);
      }

      .side .tile-name {
        font-size: 10px;
      }

      /* NOVO (redesign): rodape transparente na altura do footer da Home, com
         frase translucida centralizada + cadeado (preenche o espaco, sem peso). */
      .security-footer {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 12px;
      }

      .enc-note {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        color: rgba(226,232,240,0.46);
        font-size: 12px;
        line-height: 1;
        font-weight: 560;
        letter-spacing: 0.02em;
        text-align: center;
      }

      .enc-note bruno-icon {
        --mdc-icon-size: 16px;
        color: rgba(226,232,240,0.5);
        flex: 0 0 auto;
      }

      @media (max-width: 980px) {
        .security-subview {
          height: auto;
          min-height: 100vh;
          overflow: visible;
        }

        .security-grid {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(340px, 55vh) auto auto;
          grid-template-areas:
            "main"
            "side"
            "strip";
        }

        .side-rail,
        .bottom-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(118px, 1fr));
        }

        .side-rail {
          display: grid;
        }

        .bottom-strip {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }

      @media (max-width: 640px) {
        :host {
          min-height: 100vh;
        }

        .security-subview {
          padding: 0;
          gap: 8px;
          grid-template-rows: clamp(46px, 8vh, 54px) minmax(0, 1fr) clamp(34px, 5vh, 44px);
        }

        .security-topbar {
          grid-template-columns: 36px minmax(0, 1fr) auto;
          gap: 8px;
          padding: 0 6px;
          border-radius: 17px;
        }

        .brand {
          justify-content: center;
          font-size: 12px;
          gap: 7px;
        }

        /* ORIGINAL (rollback): .brand span:first-child { display: none; }
           — escondia a primeira palavra; agora "Residência · Segurança" e curto. */
        .brand-sep {
          margin: 0 -1px;
        }

        .clock-block {
          min-width: 58px;
          font-size: 11px;
        }

        .clock-block small {
          font-size: 9px;
        }

        .security-grid {
          gap: 8px;
          grid-template-rows: minmax(310px, 48vh) auto auto;
        }

        .side-rail,
        .bottom-strip {
          gap: 8px;
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: none;
        }

        .camera-tile {
          min-height: 132px;
        }

        .feed-actions {
          right: 10px;
          bottom: 10px;
        }

        .action-pill span {
          display: none;
        }

        .feed-footer {
          grid-template-columns: minmax(0, 1fr);
          min-height: 64px;
        }

        .system-summary {
          width: max-content;
        }
      }

      /* ============================================================
         NOVO (2026-07-09) — Fase 2 mobile: CAMERAS UNIFORMES no phone.
         Feedback do usuario: a camera principal ficava gigante e as
         demais achatadas. Agora TODAS as cameras (principal + tiles)
         tem a MESMA altura e empilham em 1 coluna. Bloco fica APOS os
         @media 980/640 de proposito (cascata: este vence no overlap).
         ROLLBACK: remover este bloco @media.
         ============================================================ */
      @media (max-width: 800px) {
        .security-grid {
          grid-template-rows: auto auto auto;
        }

        .side-rail,
        .bottom-strip {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: none;
        }

        .main-feed,
        .camera-tile {
          height: clamp(190px, 26vh, 240px);
          min-height: 0;
        }
      }

      @media (max-height: 720px) and (min-width: 981px) {
        .security-subview {
          min-height: 560px;
        }

        /* ORIGINAL (rollback): grid-template-rows: minmax(0, 1fr) clamp(94px, 18vh, 130px); */
        /* NOVO: mantem a grade uniforme 4x4 tambem em telas baixas. */
        .security-grid {
          grid-template-rows: repeat(4, minmax(0, 1fr));
        }

        .feed-footer {
          min-height: 58px;
          padding: 10px 14px;
        }
      }

      /* ============================================================
         DESKTOP/TABLET PAISAGEM — layout definitivo de câmeras (2026-08-24).
         A rail continua fora deste componente, fornecida pelo YAML da subview.
         O markup mobile legado permanece intacto em <=800px.
         ============================================================ */
      @media (min-width: 801px) {
        .security-subview.is-desktop {
          height: 100%;
          min-height: 0;
          grid-template-rows: auto minmax(0, 1fr);
          /* ANTERIOR (rollback gaps 2026-08-24): clamp(12px, 1.05cqw, 18px) */
          gap: clamp(8px, 0.7cqw, 12px);
          padding: clamp(4px, 0.45cqw, 8px) clamp(4px, 0.6cqw, 10px) clamp(8px, 0.7cqw, 12px);
          overflow: hidden;
        }

        .camera-overview-head {
          min-width: 0;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          padding: 2px 4px 0;
        }

        .camera-overview-title {
          min-width: 0;
          display: grid;
          gap: 7px;
        }

        .camera-overview-title h1 {
          margin: 0;
          color: rgba(248,250,252,0.97);
          font-size: clamp(25px, 2.15cqw, 34px);
          line-height: 1;
          font-weight: 710;
          letter-spacing: -0.035em;
        }

        .camera-overview-title p {
          margin: 0;
          display: flex;
          align-items: center;
          gap: 7px;
          color: rgba(203,213,225,0.62);
          font-size: clamp(11px, 0.82cqw, 13px);
          line-height: 1;
          font-weight: 560;
          font-variant-numeric: tabular-nums;
        }

        .overview-sep {
          color: rgba(255,255,255,0.24);
        }

        .camera-overview-grid {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 3fr) minmax(320px, 2fr);
          /* ANTERIOR (rollback gaps 2026-08-24): clamp(12px, 1.05cqw, 18px) */
          gap: clamp(8px, 0.7cqw, 12px);
          align-items: stretch;
        }

        /* ==== QUATRO BLOCOS INDEPENDENTES (2026-08-24) ==================

           Camera principal, Atividade recente, Area social e Area intima
           passam a ser quatro superficies proprias — borda, raio, fundo e
           separacao clara entre si.

           O material e vidro fosco TRANSLUCIDO, nao solido: o fundo da Home
           ja chega borrado quando esta interface abre, e a superficie deve
           deixar isso aparecer.

           O que neutraliza o calor do wallpaper e o saturate MENOR que 1
           no backdrop-filter — nao um fundo mais opaco. Escurecer sem
           dessaturar deixaria a mancha alaranjada, so mais escura.
           ================================================================ */
        .security-subview.is-desktop {
          --cam-bloco-fundo:
            linear-gradient(180deg, rgba(255,255,255,0.042), rgba(255,255,255,0.014) 52%, rgba(0,0,0,0.030)),
            rgba(11, 13, 17, 0.46);
          --cam-bloco-borda: 1px solid rgba(255,255,255,0.085);
          --cam-bloco-raio: var(--bruno-liquid-card-radius, 22px);
          --cam-bloco-filtro: blur(3px) saturate(0.72) brightness(0.94);
          --cam-bloco-sombra:
            inset 0.5px 0.5px 1px 0 rgba(255,255,255,0.32),
            inset -0.5px -0.5px 1px 0 rgba(255,255,255,0.075),
            0 12px 30px -18px rgba(0,0,0,0.62);
        }

        .security-subview.is-desktop .main-feed-card,
        .security-subview.is-desktop .camera-insights,
        .security-subview.is-desktop .camera-group {
          background: var(--cam-bloco-fundo) !important;
          border: var(--cam-bloco-borda) !important;
          border-radius: var(--cam-bloco-raio) !important;
          box-shadow: var(--cam-bloco-sombra) !important;
          backdrop-filter: var(--cam-bloco-filtro);
          -webkit-backdrop-filter: var(--cam-bloco-filtro);
          overflow: hidden;
        }

        /* Os dois grupos deixam de ser um bloco unico dividido por filete:
           cada um tem caixa propria, entao o separador sai e o respiro do
           grid assume. */
        .security-subview.is-desktop .camera-group {
          padding: clamp(11px, 0.9cqw, 15px) clamp(11px, 0.9cqw, 15px) clamp(12px, 1cqw, 16px);
          border-top: 0;
        }

        .security-subview.is-desktop .camera-group:first-child {
          padding-top: clamp(11px, 0.9cqw, 15px);
        }

        /* As miniaturas ficam DENTRO do bloco do grupo, entao a caixa delas
           nao repete o material — so o recorte. */
        .security-subview.is-desktop .camera-group .camera-tile {
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .camera-primary-column {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: minmax(0, 7fr) minmax(0, 3fr);
          /* ANTERIOR (rollback gaps 2026-08-24): clamp(10px, 0.82cqw, 14px) */
          gap: clamp(8px, 0.7cqw, 12px);
        }

        .security-subview.is-desktop .main-feed {
          grid-area: auto;
          min-width: 0;
          min-height: 0;
        }

        .security-subview.is-desktop .main-feed-card {
          min-height: 0;
          border-radius: var(--bruno-liquid-card-radius, 24px);
        }

        .camera-groups {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: repeat(2, minmax(0, 1fr));
          /* ANTERIOR (rollback gaps 2026-08-24): clamp(14px, 1.15cqw, 20px) */
          gap: clamp(8px, 0.7cqw, 12px);
        }

        .camera-group {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 9px;
          padding-top: clamp(12px, 0.9cqw, 16px);
          border-top: 1px solid rgba(255,255,255,0.08);
        }

        .camera-group:first-child {
          padding-top: 0;
          border-top: 0;
        }

        .camera-group-head {
          min-width: 0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 12px;
          padding: 0 2px;
        }

        .camera-group-head h2 {
          margin: 0;
          min-width: 0;
          color: rgba(241,245,249,0.90);
          font-size: clamp(12px, 0.95cqw, 15px);
          line-height: 1;
          font-weight: 650;
        }

        .camera-group-head span {
          flex: 0 0 auto;
          color: rgba(203,213,225,0.48);
          font-size: clamp(10px, 0.75cqw, 12px);
          line-height: 1;
          font-weight: 560;
          font-variant-numeric: tabular-nums;
        }

        .camera-group-grid {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: clamp(8px, 0.72cqw, 11px);
        }

        .camera-group-grid .camera-tile {
          min-width: 0;
          min-height: 0;
          border-radius: var(--bruno-liquid-cell-radius, 18px);
        }

        .camera-group-grid .tile-pill {
          left: 9px;
          bottom: 9px;
          max-width: calc(100% - 18px);
          gap: 6px;
        }

        .camera-group-grid .tile-name {
          font-size: clamp(10px, 0.74cqw, 12px);
        }

        /* ANTERIOR (rollback 2026-08-24): a pilula com o nome do ambiente
           e os botoes Detalhes/Atualizar viviam sobrepostos a imagem.
             .feed-pill    { left: 17px; bottom: 16px; max-width: calc(100% - 126px); }
             .feed-controls{ right: 15px; bottom: 14px; }
           Essas informacoes passaram para a faixa de cabecalho. O markup
           continua no DOM (o mobile usa) — aqui so deixa de ser exibido. */
        .security-subview.is-desktop .main-feed-card .feed-pill,
        .security-subview.is-desktop .main-feed-card .feed-controls {
          display: none;
        }

        /* ==== MODO PRIVACIDADE / INDISPONIVEL =========================

           Transportado das cameras das subviews (.camera-state-surface),
           valores incluidos: mesmo fundo, mesmo blur, mesma tipografia e o
           mesmo icone escondido — la a leitura e do texto.

           Vale para o feed principal e para as miniaturas, como nas
           subviews, onde o palco e o PIP recebem o mesmo tratamento.
           ============================================================== */
        .camera-state-surface {
          position: absolute;
          inset: 0;
          z-index: 3;
          display: grid;
          place-items: center;
          align-content: center;
          gap: clamp(6px, 0.44cqw, 10px);
          padding: clamp(12px, 0.88cqw, 21px);
          color: rgba(255,255,255,0.78);
          text-align: center;
          background:
            radial-gradient(circle at 50% 42%, rgba(96,165,250,0.12), transparent 58%),
            rgba(5, 8, 14, 0.76);
          backdrop-filter: blur(8px) saturate(0.9);
          -webkit-backdrop-filter: blur(8px) saturate(0.9);
        }

        .camera-state-surface bruno-icon {
          display: none;
          --mdc-icon-size: 32px;
          color: rgba(255,255,255,0.64);
        }

        .camera-state-surface span {
          font-size: clamp(9px, 0.66cqw, 16px);
          font-weight: 760;
          line-height: 1.1;
        }

        .camera-tile .camera-state-surface span {
          font-size: clamp(8px, 0.5cqw, 12px);
        }

        /* A foto sai de cena junto com o video: sem isto a ultima imagem
           ficaria visivel por baixo do vidro, e era justamente essa foto
           congelada que fazia parecer que a camera so travou. */
        .main-feed-card.is-private .camera-image,
        .main-feed-card.is-private .camera-live,
        .camera-tile.is-private .camera-image {
          opacity: 0;
        }

        /* ==== FAIXA DE CABECALHO DO BLOCO PRINCIPAL ==================== */
        .security-subview.is-desktop .main-feed-card.has-head {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
        }

        /* A IMAGEM PRINCIPAL DEIXA DE SANGRAR (2026-08-24).

           A margem lateral e a inferior sao as MESMAS que as minicameras
           tem dentro do bloco do grupo — ou seja, o padding de
           .camera-group. Assim a principal e as miniaturas ficam recuadas
           igual, e o raio da imagem e o mesmo dos tiles.

           O topo fica rente ao filete do cabecalho, como pedido: a faixa
           esta imediatamente acima e nao ha margem entre as duas. */
        .security-subview.is-desktop .main-feed-card.has-head .main-feed-stage {
          /* .image-stage traz width e height em 100%. Com margem, isso soma
             100% + 2x e o palco TRANSBORDA o card em vez de recuar — medido:
             12,9px de recuo a esquerda e -10,9px a direita. Com auto, o item
             do grid estica sozinho e a margem passa a valer. */
          width: auto;
          height: auto;
          margin: 0 clamp(11px, 0.9cqw, 15px) clamp(12px, 1cqw, 16px);
          border-radius: var(--bruno-liquid-cell-radius, 18px);
          overflow: hidden;
        }

        .feed-head {
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: clamp(9px, 0.72cqw, 13px) clamp(12px, 0.95cqw, 16px);
          /* ANTERIOR (rollback 2026-08-24): border-bottom de 1px.
             Com a imagem recuada, o filete ficava colado nela e nao
             separava nada — o proprio recuo ja faz essa leitura. */
        }

        .feed-head-id {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .feed-head-title {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(244,248,255,0.95);
          font-size: clamp(13px, 1.02cqw, 17px);
          font-weight: 660;
          line-height: 1.1;
        }

        .feed-live-pill {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px 3px 6px;
          border-radius: 999px;
          background: rgba(239, 68, 68, 0.14);
          border: 1px solid rgba(239, 68, 68, 0.30);
          color: rgba(254, 226, 226, 0.94);
          font-size: clamp(9px, 0.62cqw, 11px);
          font-weight: 700;
          letter-spacing: 0.02em;
          text-transform: uppercase;
          line-height: 1;
        }

        .feed-live-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          box-shadow: 0 0 7px rgba(239, 68, 68, 0.72);
        }

        .feed-head-actions {
          flex: 0 0 auto;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        /* Mesma caixa dos dois: o expandir (More Info) e o de tres pontos. */
        .feed-head-btn {
          width: 32px;
          height: 32px;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: var(--bruno-liquid-control-radius-compact, 11px);
          border: 1px solid rgba(255,255,255,0.09);
          background: rgba(255,255,255,0.045);
          color: rgba(226,232,240,0.86);
          cursor: pointer;
          transition: background 140ms ease, color 140ms ease, transform 90ms ease;
        }

        .feed-head-btn bruno-icon {
          --mdc-icon-size: 17px;
          width: 17px;
          height: 17px;
        }

        .feed-head-btn:hover {
          background: rgba(255,255,255,0.085);
          color: rgba(241,245,249,0.96);
        }

        .feed-head-btn:active {
          transform: scale(0.93);
        }

        .feed-head-btn.is-active {
          background: rgba(255,255,255,0.14);
          color: #fff;
        }

        .security-subview.is-desktop .hc-btn {
          width: 36px;
          height: 36px;
        }

        /* ==== FAIXA DE CONTROLES NA BASE (2026-08-24) ==================

           ANTERIOR (rollback): um popup ancorado no canto superior direito do
           video. Cobria parte da cena e obrigava a tirar o olho da imagem.

           Agora e a MESMA faixa das cameras das subviews: translucida, colada
           na base do video, ocupando a largura util. Como ela deixa passar a
           imagem, o video segue visivel com os controles abertos.

           Valores transportados de .camera-control-strip do CSS gerado das
           subviews — fundo, blur, tres colunas, filete entre os itens e o
           verde do estado ligado. Nada recriado no olho.
           ============================================================== */
        .camera-control-cluster {
          position: absolute;
          left: clamp(8px, 0.55cqw, 13px);
          right: clamp(8px, 0.55cqw, 13px);
          bottom: clamp(8px, 0.55cqw, 13px);
          top: auto;
          z-index: 7;
          display: none;
        }

        .camera-control-cluster.is-open {
          display: block;
        }

        .camera-control-strip {
          min-height: clamp(45px, 3.19cqw, 75px);
          display: grid;
          align-items: stretch;
          padding: clamp(3px, 0.22cqw, 5px) 0;
          border: 0;
          border-radius: var(--bruno-liquid-control-radius-compact, 12px);
          overflow: hidden;
          background:
            linear-gradient(180deg, rgba(3,7,13,0.08), rgba(3,7,13,0.40)),
            rgba(6,8,12,0.18);
          backdrop-filter: blur(10px) saturate(0.95);
          -webkit-backdrop-filter: blur(10px) saturate(0.95);
          box-shadow: none;
        }

        .camera-controls {
          min-width: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: stretch;
          gap: 0;
        }

        .camera-control {
          position: relative;
          min-width: 0;
          min-height: clamp(39px, 2.75cqw, 65px);
          display: grid;
          grid-template-columns: clamp(14px, 0.99cqw, 23px) auto clamp(22px, 1.54cqw, 36px);
          align-items: center;
          justify-content: center;
          gap: clamp(5px, 0.38cqw, 9px);
          padding: 0 clamp(6px, 0.44cqw, 10px);
          border: 0;
          border-radius: 0;
          background: transparent;
          color: rgba(255,255,255,0.62);
          font: inherit;
          text-align: left;
          cursor: pointer;
          transition: color 160ms ease, background 160ms ease, opacity 160ms ease;
        }

        .camera-control + .camera-control::before {
          content: "";
          position: absolute;
          left: 0;
          top: clamp(8px, 0.6cqw, 14px);
          bottom: clamp(8px, 0.6cqw, 14px);
          width: 1px;
          background: rgba(255,255,255,0.105);
        }

        .camera-control:hover,
        .camera-control:focus-visible {
          color: rgba(255,255,255,0.90);
          background: rgba(255,255,255,0.036);
          outline: none;
        }

        .camera-control bruno-icon {
          --mdc-icon-size: 17px;
          width: 17px;
          height: 17px;
        }

        .camera-control-label {
          min-width: 0;
          font-size: clamp(9px, 0.6cqw, 14px);
          font-weight: 760;
          line-height: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .camera-control-switch {
          position: relative;
          justify-self: start;
          width: clamp(20px, 1.43cqw, 34px);
          height: clamp(11px, 0.77cqw, 18px);
          border-radius: 999px;
          border: 0;
          background: rgba(255,255,255,0.16);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.30);
          transition: background 160ms ease, box-shadow 160ms ease;
        }

        .camera-control-switch::after {
          content: "";
          position: absolute;
          top: 3px;
          left: 3px;
          width: clamp(6px, 0.44cqw, 10px);
          height: clamp(6px, 0.44cqw, 10px);
          border-radius: 50%;
          background: rgba(255,255,255,0.86);
          box-shadow: 0 1px 3px rgba(0,0,0,0.30);
          transition: transform 160ms ease, background 160ms ease;
        }

        .camera-control.is-on {
          color: rgba(218,248,230,0.94);
        }

        .camera-control.is-on .camera-control-switch {
          background: rgba(46,231,122,0.58);
          box-shadow: inset 0 1px 2px rgba(0,0,0,0.18), 0 0 8px rgba(46,231,122,0.18);
        }

        .camera-control.is-on .camera-control-switch::after {
          transform: translateX(12px);
          background: rgba(255,255,255,0.96);
        }

        .camera-control.is-unavailable,
        .camera-control:disabled {
          opacity: 0.34;
          cursor: not-allowed;
        }

        .camera-control-btn {
          appearance: none;
          -webkit-appearance: none;
          width: 34px;
          height: 34px;
          display: grid;
          place-items: center;
          padding: 0;
          border-radius: 999px;
          color: rgba(226,232,240,0.68);
          background: rgba(6,8,11,0.42);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(12px) saturate(1.16);
          -webkit-backdrop-filter: blur(12px) saturate(1.16);
          transition: background 160ms ease, color 160ms ease, border-color 160ms ease, opacity 160ms ease;
        }

        .camera-control-btn bruno-icon {
          --mdc-icon-size: 16px;
        }

        .camera-control-btn.is-on {
          color: rgba(241,250,255,0.97);
          background: rgba(var(--security-accent),0.22);
          border-color: rgba(var(--security-accent),0.42);
        }

        .camera-control-btn.is-unavailable {
          opacity: 0.32;
        }

        .camera-insights {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1.32fr) minmax(250px, 1fr);
          gap: clamp(10px, 0.82cqw, 14px);
          padding: clamp(12px, 1cqw, 16px);
          border-radius: var(--bruno-liquid-cell-radius, 18px);
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.08);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.035);
          overflow: hidden;
        }

        .recent-activity {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: auto repeat(3, minmax(0, 1fr));
          gap: 6px;
        }

        .insight-title {
          margin: 0;
          color: rgba(241,245,249,0.88);
          font-size: clamp(11px, 0.82cqw, 13px);
          line-height: 1;
          font-weight: 650;
        }

        .activity-row {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-columns: 28px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          padding: 6px 8px;
          border-radius: 10px;
          background: rgba(255,255,255,0.025);
          border: 1px solid rgba(255,255,255,0.045);
        }

        .activity-icon {
          width: 26px;
          height: 26px;
          display: grid;
          place-items: center;
          border-radius: 8px;
          color: rgb(var(--security-warn));
          background: rgba(var(--security-warn),0.09);
        }

        .activity-icon bruno-icon {
          --mdc-icon-size: 15px;
        }

        .activity-copy {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .activity-copy strong,
        .activity-copy small {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .activity-copy strong {
          color: rgba(241,245,249,0.82);
          font-size: clamp(9.5px, 0.7cqw, 11px);
          line-height: 1;
          font-weight: 610;
        }

        .activity-copy small,
        .activity-time {
          color: rgba(203,213,225,0.45);
          font-size: clamp(8px, 0.61cqw, 9.5px);
          line-height: 1;
          font-weight: 520;
        }

        .activity-row.is-empty {
          opacity: 0.46;
        }

        .camera-metrics {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 8px;
        }

        .metric-rings {
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          align-items: center;
          gap: 8px;
        }

        .metric {
          min-width: 0;
          display: grid;
          justify-items: center;
          gap: 6px;
        }

        .metric-ring {
          --ring-progress: 0deg;
          width: clamp(50px, 4.4cqw, 68px);
          aspect-ratio: 1;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background:
            radial-gradient(circle at center, rgba(8,11,15,0.98) 57%, transparent 59%),
            conic-gradient(rgb(var(--security-accent)) var(--ring-progress), rgba(255,255,255,0.08) 0);
          box-shadow: inset 0 0 0 1px rgba(255,255,255,0.055);
        }

        .metric.is-motion .metric-ring {
          background:
            radial-gradient(circle at center, rgba(8,11,15,0.98) 57%, transparent 59%),
            conic-gradient(rgb(var(--security-warn)) var(--ring-progress), rgba(255,255,255,0.08) 0);
        }

        .metric.is-recording .metric-ring {
          background:
            radial-gradient(circle at center, rgba(8,11,15,0.98) 57%, transparent 59%),
            conic-gradient(rgb(239,68,68) var(--ring-progress), rgba(255,255,255,0.08) 0);
        }

        .metric-value {
          color: rgba(248,250,252,0.94);
          font-size: clamp(13px, 1.08cqw, 17px);
          line-height: 1;
          font-weight: 680;
          font-variant-numeric: tabular-nums;
        }

        .metric-label {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(203,213,225,0.48);
          font-size: clamp(8px, 0.61cqw, 9.5px);
          line-height: 1;
          font-weight: 540;
          text-align: center;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .camera-tile,
        .action-pill {
          transition: none !important;
        }
      }
    `;
  }
  // --- ORIGINAL (rollback 2a): hero com faixa de overlay no topo (.feed-overlay-top
  //     com .cam-pill + .rec-pill "Gravando") e contagem "N/N online" (.feed-status)
  //     no rodape do video. Assinatura era _mainFeed(camera, model). ---
  //   <div class="feed-overlay-top">
  //     <span class="cam-pill"><span class="status-dot${onlineClass}"></span>
  //       <span class="cam-pill-name">${...camera.name...}</span></span>
  //     ${recording ? '<span class="rec-pill"><span class="rec-dot"></span>Gravando</span>' : ''}
  //   </div>
  //   ...controles flutuantes...
  //   <div class="feed-status"><span class="status-dot..."></span>
  //     <span>${model.onlineCount}/${model.totalCount} online</span></div>
  // --- FIM ORIGINAL ---
  // NOVO (2a): a camera principal segue o MESMO padrao das secundarias — uma
  // unica pilula no canto inferior ESQUERDO (status + nome + REC), via
  // _pillInner (compartilhado com os tiles). REMOVIDOS: overlay do topo
  // (.feed-overlay-top) e contagem "N/N online" (.feed-status). MANTIDOS: os
  // controles flutuantes (Detalhes/Atualizar) no canto inferior direito.
  // A pilula tem data-feed-pill para a troca in-place (2b) localiza-la.
  // O feed principal mantem o snapshot por baixo do ponto data-live-mount.
  // O player direto nasce invisivel e so aparece depois do primeiro quadro.
  // FAIXA DE CABECALHO (2026-08-24) — bloco da camera principal.
  //
  // No DESKTOP o bloco ganha um cabecalho proprio acima do video:
  //   titulo DINAMICO (segue a camera selecionada) + pilula Ao vivo a
  //   esquerda; expandir (More Info) e tres pontos a direita.
  //
  // Com isso saem de cima da imagem: a pilula com o nome do ambiente (que
  // agora vive no cabecalho) e os tres botoes translucidos de controle (que
  // viram o painel do menu de tres pontos, igual ao das subviews).
  //
  // O video fica mais baixo por construcao — a faixa consome altura, e essa
  // reducao e desejada.
  //
  // MOBILE inalterado: continua com a pilula sobreposta e sem cabecalho.
  static _mainFeed(e, a = !1, i = "", t = !1) {
    const r = !!e?.image, s = a ? `
        <header class="feed-head">
          <div class="feed-head-id">
            <span class="feed-head-title" data-feed-title>${o._escape(o._displayName(e, !1, !0))}</span>
            <span class="feed-live-pill"><span class="feed-live-dot" aria-hidden="true"></span>Ao vivo</span>
          </div>
          <div class="feed-head-actions">
            <button class="feed-head-btn" type="button" data-action="more-info" data-camera-id="${o._escapeAttr(e?.entity || "")}" title="Abrir detalhes" aria-label="Abrir detalhes da camera">
              <bruno-icon icon="mdi:magnify-plus-outline"></bruno-icon>
            </button>
            <button class="feed-head-btn feed-head-menu${t ? " is-active" : ""}" type="button" data-action="toggle-camera-menu" title="Controles" aria-expanded="${t ? "true" : "false"}" aria-label="${t ? "Fechar controles da camera" : "Abrir controles da camera"}">
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </div>
        </header>` : "";
    return `
      <article class="feed-card main-feed-card${a ? " has-head" : ""}${e?.isPrivate ? " is-private" : ""}">
        ${s}
        <div class="image-stage main-feed-stage${r ? " has-image" : ""}">
          ${r ? o._image(e, "camera-image camera-main-fallback") : ""}
          <div class="camera-placeholder" aria-hidden="true"></div>
          <div class="camera-live" data-live-mount aria-hidden="true"></div>
          ${o._stateSurface(e)}
          <div class="feed-vignette" aria-hidden="true"></div>
          <div class="camera-control-cluster${t ? " is-open" : ""}" data-camera-controls>${a && t ? i : ""}</div>
          <div class="feed-pill" data-feed-pill>
            ${o._pillInner(e, !1, a)}
          </div>
          <div class="feed-controls">
            <button class="hc-btn" type="button" data-action="more-info" data-camera-id="${o._escapeAttr(e?.entity || "")}" aria-label="Abrir detalhes da camera">
              <bruno-icon icon="mdi:magnify-plus-outline"></bruno-icon>
              <span>Detalhes</span>
            </button>
            <button class="hc-btn" type="button" data-action="refresh" aria-label="Atualizar cameras">
              <bruno-icon icon="mdi:refresh"></bruno-icon>
              <span>Atualizar</span>
            </button>
          </div>
        </div>
      </article>
    `;
  }
  // NOVO (2a/2b): conteudo da pilula compartilhado pelo principal e pelos tiles
  // (ponto de status + nome + "REC" quando gravando). compact=false usa o nome
  // longo (principal); compact=true usa short_name (tiles).
  static _displayName(e, a, i = !1) {
    return i && e?.display_name ? e.display_name : a ? e?.short_name || e?.name || "Camera" : e?.name || "Camera";
  }
  // SUPERFICIE DE ESTADO (2026-08-24) — transportada das cameras das
  // subviews (.camera-state-surface).
  //
  // Antes, ligar a privacidade so congelava a imagem: o instantaneo parava
  // de atualizar e a ultima foto ficava na tela, sem dizer por que. Agora o
  // comportamento e o mesmo das subviews — a camera escurece e a razao
  // aparece centralizada.
  //
  // O icone existe no markup e o CSS o esconde, exatamente como la: a
  // leitura e do texto.
  static _stateSurface(e) {
    return e?.unavailable ? '<div class="camera-state-surface"><bruno-icon icon="mdi:video-off-outline"></bruno-icon><span>Indisponível</span></div>' : e?.isPrivate ? '<div class="camera-state-surface"><bruno-icon icon="mdi:eye-off-outline"></bruno-icon><span>Modo privacidade ativo</span></div>' : "";
  }
  static _pillInner(e, a, i = !1) {
    const t = e?.online ? " is-online" : "", r = e?.state === "recording", s = r ? " is-recording" : "", n = o._displayName(e, a, i), l = a ? "tile-name" : "cam-pill-name", c = r ? '<span class="tile-rec">REC</span>' : "";
    return `<span class="status-dot${t}${s}"></span><span class="${l}">${o._escape(n)}</span>${c}`;
  }
  /* ORIGINAL (rollback): hero com rodape preto grande.
  static _mainFeedLegacy(camera, model) {
    const hasImage = Boolean(camera?.image);
    const onlineClass = camera?.online ? ' is-online' : '';
    return `
      <article class="feed-card">
        <div class="image-stage${hasImage ? ' has-image' : ''}">
          ${hasImage ? BrunoCamerasSecuritySubview._image(camera, 'camera-image') : ''}
          <div class="camera-placeholder" aria-hidden="true"></div>
          <div class="feed-scrim"></div>
          <div class="feed-title">...</div>
          <div class="feed-actions">...Detalhes/Atualizar...</div>
        </div>
        <footer class="feed-footer">...active-name / active-sub / system-summary...</footer>
      </article>
    `;
  }
  */
  // NOVO (redesign Opcao A): secundaria sem barra pesada — apenas uma pilula
  // inferior compacta integrada (ponto de status + nome + "REC" se gravando).
  static _tile(e, a, i = !1) {
    const t = !!e?.image, r = o._displayName(e, !0, i);
    return `
      <button class="camera-tile ${o._escapeAttr(a)}${e?.isPrivate ? " is-private" : ""}" type="button" data-action="select-camera" data-camera-id="${o._escapeAttr(e.entity)}" aria-label="${o._escapeAttr(r)}">
        <span class="image-stage${t ? " has-image" : ""}">
          ${t ? o._image(e, "camera-image") : ""}
          <span class="camera-placeholder" aria-hidden="true"></span>
          ${o._stateSurface(e)}
          <span class="tile-vignette" aria-hidden="true"></span>
          <span class="tile-pill">
            ${o._pillInner(e, !0, i)}
          </span>
        </span>
      </button>
    `;
  }
  static _formatMotionAge(e) {
    const a = Date.parse(e);
    if (!Number.isFinite(a)) return "";
    const i = Math.max(0, Math.floor((Date.now() - a) / 1e3));
    if (i < 45) return "Agora";
    const t = Math.floor(i / 60);
    if (t < 60) return `${t} min atrás`;
    const r = Math.floor(t / 60);
    return r < 24 ? `${r} h atrás` : new Date(a).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  }
  static _metric(e, a, i, t = "") {
    const r = Math.max(1, Number(i) || 0), s = Math.max(0, Number(a) || 0), n = Math.max(0, Math.min(360, s / r * 360)), l = e === "Online" ? `${s}/${Number(i) || 0}` : String(s);
    return `
      <div class="metric ${o._escapeAttr(t)}">
        <div class="metric-ring" style="--ring-progress:${n.toFixed(1)}deg">
          <span class="metric-value">${o._escape(l)}</span>
        </div>
        <span class="metric-label">${o._escape(e)}</span>
      </div>
    `;
  }
  static _insightsInner(e) {
    const a = [...e?.recentMotionEvents || []];
    return `
      <section class="recent-activity">
        <h2 class="insight-title">Atividade recente</h2>
        ${Array.from({ length: 3 }, (t, r) => {
      const s = a[r];
      return s ? `
        <div class="activity-row">
          <span class="activity-icon"><bruno-icon icon="mdi:run-fast"></bruno-icon></span>
          <span class="activity-copy">
            <strong>Movimento detectado</strong>
            <small>${o._escape(s.name)}</small>
          </span>
          <span class="activity-time">${o._escape(o._formatMotionAge(s.detectedAt))}</span>
        </div>
      ` : `
          <div class="activity-row is-empty">
            <span class="activity-icon"><bruno-icon icon="mdi:motion-sensor"></bruno-icon></span>
            <span class="activity-copy"><strong>Sem detecção registrada</strong><small>—</small></span>
            <span class="activity-time">—</span>
          </div>
        `;
    }).join("")}
      </section>
      <section class="camera-metrics">
        <h2 class="insight-title">Estado das câmeras</h2>
        <div class="metric-rings">
          ${o._metric("Online", e?.onlineCount || 0, e?.totalCount || 0, "is-online")}
          ${o._metric("Com movimento", e?.motionCount || 0, e?.totalCount || 0, "is-motion")}
          ${o._metric("Gravando", e?.recordingCount || 0, e?.totalCount || 0, "is-recording")}
        </div>
      </section>
    `;
  }
  static _groupSection(e, a, i) {
    return `
      <section class="camera-group" data-camera-group="${o._escapeAttr(e)}">
        <header class="camera-group-head">
          <h2>${o._escape(a)}</h2>
          <span data-camera-group-count="${o._escapeAttr(e)}">${i.length} câmeras</span>
        </header>
        <div class="camera-group-grid" data-camera-group-grid="${o._escapeAttr(e)}">
          ${i.map((t) => o._tile(t, "group", !0)).join("")}
        </div>
      </section>
    `;
  }
  static _image(e, a) {
    return `<img class="${a}" src="${o._escapeAttr(e.imageUrl || e.image)}" data-camera-src-base="${o._escapeAttr(e.image)}" data-camera-entity="${o._escapeAttr(e.entity)}" alt="">`;
  }
  static _statusLabel(e, a) {
    return a ? "Indisponivel" : e === "streaming" ? "Ao vivo" : e === "recording" ? "Gravando" : e === "idle" || e === "on" ? "Online" : e === "off" || e === "standby" ? "Em espera" : e || "Online";
  }
  static _withCacheBust(e, a) {
    if (!e) return "";
    const i = e.includes("?") ? "&" : "?";
    return `${e}${i}bruno_refresh=${encodeURIComponent(a || Date.now())}`;
  }
  static _clock() {
    const e = /* @__PURE__ */ new Date();
    return `${String(e.getHours()).padStart(2, "0")}:${String(e.getMinutes()).padStart(2, "0")}`;
  }
  static _date() {
    const e = /* @__PURE__ */ new Date(), a = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"], i = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
    return `${a[e.getDay()]}, ${e.getDate()} ${i[e.getMonth()]}`;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return o._escape(e).replace(/'/g, "&#39;");
  }
}
customElements.get(g) || customElements.define(g, o);
window.customCards = window.customCards || [];
window.customCards.push({
  type: g,
  name: "Bruno Cameras Security Subview",
  description: "Full-screen Bruno UI security camera console."
});
//# sourceMappingURL=bruno-cameras-security-subview.Bb4tCdNq.js.map
