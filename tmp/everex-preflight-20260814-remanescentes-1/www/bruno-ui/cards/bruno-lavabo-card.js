const BRUNO_LAVABO_CARD_TAG = 'bruno-lavabo-card';

const BRUNO_LAVABO_DEFAULT_CONFIG = {
  "name": "Lavabo",
  "icon_size": 94,
  "room_on_states": [
    "on",
    "home",
    "active",
    "yes"
  ],
  "semantic_on_states": [],
  "entities": {
    "room_group": "light.grupo_luzes_lavabo",
    "room_toggle": "light.grupo_luzes_lavabo",
    "room_fallback_lights": [
      "light.lavabo_switch_2",
      "light.lavabo_switch_1",
      "light.lavabo_switch_3"
    ],
    "active_sensor": "sensor.lavabo_active",
    // NOVO (2026-07-03): presenca imediata para o dot; lavabo_occupancy fica
    // para automacao de luz (segurava o dot aceso por minutos apos a saida).
    "motion_recent": "binary_sensor.lavabo_motion_recent",
    "presence": "binary_sensor.lavabo_occupancy",
    "illuminance": "sensor.lv_sensor_presenca_iluminancia",
    "pir": "sensor.lv_sensor_presenca_pir",
    "temperature": [],
    "humidity": [],
    "dishwasher": ""
  },
  "icon": {
    // ORIGINAL (rollback rapido): "off": "/local/bruno-ui/assets/lavabo-off.png?v=20260702-all-images-1",
    "off": "/local/bruno-ui/assets/lavabo-off-tight.png?v=20260802-assets-resize-1",
    // ORIGINAL (rollback rapido): "on": "/local/bruno-ui/assets/lavabo-on.png?v=20260702-all-images-1",
    "on": "/local/bruno-ui/assets/lavabo-on-tight.png?v=20260802-assets-resize-1",
    "phone_off": "/local/bruno-ui/assets/v2/lavabo-off.png?v=20260808-maquetes-premium-1",
    "phone_on": "/local/bruno-ui/assets/v2/lavabo-on.png?v=20260808-maquetes-premium-1",
    "fallback": "mdi:toilet"
  },
  "popup": {
    // ANTERIOR (rollback): banner usava os PNGs off/on do icone do card.
    // "banner": "/local/bruno-ui/assets/lavabo-off-tight.png?v=20260704-lavabo-popup-1",
    // "banner_on": "/local/bruno-ui/assets/lavabo-on-tight.png?v=20260704-lavabo-popup-1",
    // NOVO: foto real do lavabo (bordas atmosfericas aplicadas via CSS no shade).
    "banner": "/local/images/lavabo.jpg?v=20260705-lavabo-jpg-1",
    "banner_on": "/local/images/lavabo.jpg?v=20260705-lavabo-jpg-1",
    "lights": [
      { "entity": "light.lavabo_switch_2", "name": "Luz principal", "icon": "ledstrip" },
      { "entity": "light.lavabo_switch_1", "name": "Luz parede", "icon": "sconce" },
      { "entity": "light.lavabo_switch_3", "name": "Luz espelho", "icon": "light_flush" }
    ]
  },
  "status_dots": [
    {
      "icon": "mdi:account",
      "label": "Presenca",
      "tone": "blue",
      // ANTERIOR (rollback): dot lia lavabo_occupancy (delay_off de minutos —
      // o icone ficava aceso muito tempo apos a saida).
      // "entity": "binary_sensor.lavabo_occupancy",
      // NOVO: presenca imediata — liga na deteccao, apaga ~35s apos a saida
      // (fading 30s do sensor + 5s de anti-flicker).
      "entity": "binary_sensor.lavabo_motion_recent",
      "states": [
        "on"
      ]
    }
  ]
};

const BRUNO_LAVABO_ACTION_COOLDOWN = 1200;

class BrunoLavaboCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_LAVABO_DEFAULT_CONFIG.entities,
      ...(config?.entities || {}),
    };
    const icon = {
      ...BRUNO_LAVABO_DEFAULT_CONFIG.icon,
      ...(config?.icon || {}),
    };

    const popup = {
      ...BRUNO_LAVABO_DEFAULT_CONFIG.popup,
      ...(config?.popup || {}),
      lights: Array.isArray(config?.popup?.lights)
        ? config.popup.lights
        : BRUNO_LAVABO_DEFAULT_CONFIG.popup.lights,
    };
    this._config = {
      ...BRUNO_LAVABO_DEFAULT_CONFIG,
      ...config,
      entities,
      icon,
      popup,
      room_on_states: this._array(config?.room_on_states || BRUNO_LAVABO_DEFAULT_CONFIG.room_on_states),
      semantic_on_states: this._array(config?.semantic_on_states || BRUNO_LAVABO_DEFAULT_CONFIG.semantic_on_states || []),
      status_dots: Array.isArray(config?.status_dots) ? config.status_dots : BRUNO_LAVABO_DEFAULT_CONFIG.status_dots,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 3;
  }

  // ==== HOME V3 - MODO TILE (2026-07-26) ==================================
  // Duas condicoes INDEPENDENTES, ambas necessarias:
  //  1) POSICAO - `variant: tile` vem do YAML e e passado APENAS pelos
  //     includes da faixa de comodos do desktop V2
  //     (views/main-grid/v2/bento_bottom_block.yaml). O phone
  //     (v2/bento_comodos_phone.yaml) e a Home V1 NAO passam a flag, entao
  //     nunca viram tile.
  //  2) TEMA - o tema ativo declara `--bruno-tile-mode: on`. Hoje somente o
  //     Josh.ai declara. Em qualquer outro tema o modo nao liga e o render
  //     fica IDENTICO ao atual. Assim o visual novo pertence ao TEMA e nao
  //     ao layout, e um tema futuro adota o tile sem tocar em JS.
  // ROLLBACK: remover `variant: tile` do YAML OU o token do tema.
  // =======================================================================
  _themeTileMode() {
    if (this._tileModeCache !== undefined) return this._tileModeCache;
    let value = '';
    try {
      value = getComputedStyle(this).getPropertyValue('--bruno-tile-mode').trim();
    } catch (_error) {
      value = '';
    }
    this._tileModeCache = value === 'on';
    return this._tileModeCache;
  }

  _tileClasses() {
    if (this._config?.variant !== 'tile' || !this._themeTileMode()) return '';
    return this._config?.divider_left ? ' is-tile has-divider' : ' is-tile';
  }

  _tileDivider() {
    return this._tileClasses().indexOf('has-divider') >= 0
      ? '<span class="tile-divider" aria-hidden="true"></span>'
      : '';
  }

  connectedCallback() {
    // Trocar de tema (Config > Themes) precisa reavaliar o modo tile.
    if (!this._onBrunoThemeChanged) {
      this._onBrunoThemeChanged = () => {
        this._tileModeCache = undefined;
        this._render();
      };
    }
    globalThis.addEventListener?.('bruno-theme-changed', this._onBrunoThemeChanged);
    // O primeiro render pode ocorrer antes do attach; ali getComputedStyle
    // ainda nao ve os tokens do tema. Invalida e repinta ja conectado.
    this._tileModeCache = undefined;
    this._render();
  }

  disconnectedCallback() {
    if (!this._onBrunoThemeChanged) return;
    globalThis.removeEventListener?.('bruno-theme-changed', this._onBrunoThemeChanged);
  }
  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _array(value) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  _isUnavailable(entity) {
    return !entity || ['unknown', 'unavailable', 'none', ''].includes(String(entity.state || '').toLowerCase());
  }

  _firstValid(entityIds) {
    for (const entityId of this._array(entityIds)) {
      const entity = this._state(entityId);
      if (!this._isUnavailable(entity)) return entity;
    }
    return null;
  }

  _roomEntityIds(roomEntity) {
    const ids = roomEntity?.attributes?.entity_id;
    return Array.isArray(ids) ? ids : [];
  }

  _elapsed(delta) {
    const minute = delta / 60000;
    const hour = delta / 3600000;
    const day = delta / 86400000;

    if (minute < 1) return '<1m';
    if (minute < 60) return `${parseInt(minute, 10)}m`;
    if (hour < 24) return `${parseInt(hour, 10)}h`;
    return `${parseInt(day, 10)}d`;
  }

  _lightsSummary(roomEntity) {
    const entities = this._config.entities;
    const activeEntity = this._state(entities.active_sensor);
    const lightsOnCount = activeEntity?.attributes?.lights_on_count;
    const lightsOn = activeEntity?.attributes?.lights_on;
    let count = null;

    if (lightsOnCount != null && lightsOnCount !== '' && !Number.isNaN(Number(lightsOnCount))) {
      count = parseInt(lightsOnCount, 10);
    } else if (Array.isArray(lightsOn)) {
      count = lightsOn.length;
    } else if (typeof lightsOn === 'string' && lightsOn.startsWith('[')) {
      const matches = lightsOn.match(/'/g);
      if (matches) count = matches.length / 2;
    }

    const ids = this._roomEntityIds(roomEntity);
    if (count === null && ids.length) {
      count = ids.filter((id) => this._state(id)?.state === 'on').length;
    }

    const fallbackIds = this._array(entities.room_fallback_lights);
    if (count === null && fallbackIds.length) {
      count = fallbackIds.filter((id) => this._state(id)?.state === 'on').length;
    }

    if (count === null) count = roomEntity?.state === 'on' ? 1 : 0;

    let elapsed = activeEntity?.attributes?.lights_elapsed || '';
    if (!elapsed) {
      let earliestOn = null;
      const elapsedIds = ids.length ? ids : fallbackIds;
      elapsedIds.forEach((id) => {
        const stateObj = this._state(id);
        if (stateObj?.state === 'on' && stateObj.last_changed) {
          const timestamp = Date.parse(stateObj.last_changed);
          if (!Number.isNaN(timestamp) && (earliestOn === null || timestamp < earliestOn)) {
            earliestOn = timestamp;
          }
        }
      });

      if (earliestOn === null && roomEntity?.state === 'on' && roomEntity.last_changed) {
        const timestamp = Date.parse(roomEntity.last_changed);
        if (!Number.isNaN(timestamp)) earliestOn = timestamp;
      }

      elapsed = earliestOn !== null ? this._elapsed(Date.now() - earliestOn) : '';
    }

    const label = count === 1 ? '1 light' : `${count} lights`;
    return {
      count,
      elapsed,
      label: count > 0 ? `${label}${elapsed ? ` / ${elapsed}` : ''}` : '',
    };
  }

  _sensorValue(entityIds, suffix = '') {
    const entity = this._firstValid(entityIds);
    if (!entity) return '';
    return `${BrunoLavaboCard._escape(entity.state)}${suffix}`;
  }

  _truthy(value) {
    return value === true || value === 'true' || value === 'True' || value === 'on' || value === 'yes';
  }

  _roomLightEntities() {
    const entities = this._config.entities || {};
    return [
      ...this._array(entities.room_fallback_lights),
      ...this._popupLights().map((light) => light.entity),
    ].filter(Boolean);
  }

  _uniqueRoomLightStates() {
    const seen = new Set();
    return this._roomLightEntities()
      .filter((entityId) => {
        if (!entityId || seen.has(entityId)) return false;
        seen.add(entityId);
        return true;
      })
      .map((entityId) => this._state(entityId))
      .filter((entity) => entity && !this._isUnavailable(entity));
  }

  _anyRoomLightOn() {
    return this._uniqueRoomLightStates().some((entity) => entity.state === 'on');
  }

  // ANTERIOR (rollback): dependia SOMENTE dos membros light.lavabo_switch_* para
  // decidir o on-state. O toque (room_toggle) age no GRUPO light.grupo_luzes_lavabo;
  // se os membros nao refletirem imediatamente/estiverem indisponiveis, o botao
  // nunca acendia (PNG cinza fixo) mesmo com a luz ligada.
  // _roomOn(roomEntity) {
  //   const lightStates = this._uniqueRoomLightStates();
  //   if (lightStates.length) return lightStates.some((entity) => entity.state === 'on');
  //   const state = String(roomEntity?.state || '').toLowerCase();
  //   const activeState = String(this._state(this._config.entities.active_sensor)?.state || '').toLowerCase();
  //   const roomOn = this._config.room_on_states.map((item) => String(item).toLowerCase()).includes(state);
  //   const semanticOn = this._config.semantic_on_states.map((item) => String(item).toLowerCase()).includes(activeState);
  //   return roomOn || semanticOn;
  // }
  // NOVO: fonte primaria = estado do GRUPO (reflete sempre o toque). Reforco: se
  // qualquer switch membro estiver on. Fallback semantico por ultimo.
  _roomOn(roomEntity) {
    const groupState = String(roomEntity?.state || '').toLowerCase();
    const onStates = this._config.room_on_states.map((item) => String(item).toLowerCase());
    if (onStates.includes(groupState)) return true;

    if (this._uniqueRoomLightStates().some((entity) => entity.state === 'on')) return true;

    const activeState = String(this._state(this._config.entities.active_sensor)?.state || '').toLowerCase();
    return this._config.semantic_on_states.map((item) => String(item).toLowerCase()).includes(activeState);
  }

  _dishwasherLine() {
    const entities = this._config.entities;
    const active = this._state(entities.active_sensor);
    const dishwasher = this._state(entities.dishwasher);
    const running = this._truthy(active?.attributes?.dishwasher_running) || dishwasher?.state === 'run';
    if (!running) return '';
    const elapsed = active?.attributes?.dishwasher_elapsed || '';
    return `Lavando${elapsed ? ` / ${elapsed}` : ''}`;
  }

  _model() {
    const entities = this._config.entities;
    const room = this._state(entities.room_group);
    const roomOn = this._roomOn(room);
    const lights = this._lightsSummary(room);
    const dishwasherLine = this._dishwasherLine();
    const statusLines = [];

    if (lights.label) statusLines.push(lights.label);
    if (dishwasherLine) statusLines.push(dishwasherLine);

    return {
      roomOn,
      iconActive: roomOn,
      temperature: this._sensorValue(entities.temperature, '&deg;'),
      humidity: this._sensorValue(entities.humidity, '%'),
      statusLines,
      dots: this._config.status_dots.map((dot) => this._dotModel(dot, roomOn)),
    };
  }

  _dotModel(dot, roomOn) {
    const entity = this._state(dot.entity);
    const states = this._array(dot.states).map((item) => String(item));
    const activeFromEntity = entity && states.includes(String(entity.state));
    const activeEntity = this._state(this._config.entities.active_sensor);
    const attrValue = dot.active_attr ? activeEntity?.attributes?.[dot.active_attr] : undefined;
    const active = Boolean(dot.active) || Boolean(activeFromEntity) || this._truthy(attrValue);

    return {
      icon: dot.icon || 'mdi:circle-small',
      label: dot.label || '',
      tone: dot.tone || 'blue',
      active,
      mutedOn: Boolean(roomOn && dot.muted_on !== false),
    };
  }


  _runAction(key, gesture) {
    if (key !== 'room') return;
    globalThis.BrunoLiquidGlass?.feedback?.(gesture === 'hold' ? 'hold' : 'tap');

    const entities = this._config.entities;
    if (gesture === 'hold') {
      this._callService('light.turn_off', {}, { entity_id: entities.room_group });
      return;
    }
    if (this._isActionCoolingDown(key)) return;
    this._callService('light.toggle', {}, { entity_id: entities.room_toggle || entities.room_group });
  }

  _runRoomSubview() {
    globalThis.BrunoLiquidGlass?.feedback?.('tap');
    this._openLavaboPopup();
  }


  _popupLights() {
    return Array.isArray(this._config?.popup?.lights) ? this._config.popup.lights : [];
  }

  _lightPopupModel(light) {
    const entity = this._state(light.entity);
    const state = String(entity?.state || '').toLowerCase();
    const on = state === 'on';
    const unavailable = !entity || ['unavailable', 'unknown', 'none', ''].includes(state);
    return {
      ...light,
      on,
      unavailable,
      stateLabel: unavailable ? 'Indisponivel' : (on ? 'Ligada' : 'Desligada'),
    };
  }

  _openLavaboPopup() {
    this._lavaboPopupOpen = true;
    this._render();
  }

  _closeLavaboPopup() {
    this._lavaboPopupOpen = false;
    const dialog = this.shadowRoot?.querySelector('.lavabo-dialog');
    if (dialog?.open) {
      try { dialog.close(); } catch (_) { /* noop */ }
    }
    this._render();
  }

  _togglePopupLight(entityId) {
    if (!entityId) return;
    globalThis.BrunoLiquidGlass?.feedback?.('tap');
    this._callService('light.toggle', {}, { entity_id: entityId });
  }

  _renderLavaboPopup(model) {
    // NOVO: <dialog> nativo com showModal() -> renderiza na TOP LAYER do browser,
    // acima de tudo e IMUNE ao overflow:hidden / transform de ancestrais (o motivo
    // do popup com position:fixed ficar cortado/invisivel dentro do shell).
    // O markup existe sempre; a abertura/fechamento e via showModal()/close().
    const popup = this._config.popup || {};
    const banner = model.roomOn ? (popup.banner_on || popup.banner) : (popup.banner || popup.banner_on);
    const lights = this._popupLights().map((light) => this._lightPopupModel(light));
    const popupTheme = globalThis.BrunoThemeManager?.current?.() === 'josh' ? 'josh' : 'default';
    return `
      <dialog class="lavabo-dialog" data-bruno-popup-theme="${popupTheme}" aria-label="Lavabo">
        <section class="lavabo-popup-panel" role="document">
          <header class="lavabo-popup-header">
            <span class="lavabo-popup-icon" aria-hidden="true"><bruno-icon icon="mdi:toilet"></bruno-icon></span>
            <div class="lavabo-popup-title">
              <strong>Lavabo</strong>
              <span>Controle rapido de luzes</span>
            </div>
            <button class="lavabo-popup-close" type="button" data-popup-action="close" aria-label="Fechar">&times;</button>
          </header>
          <div class="lavabo-popup-banner">
            ${banner ? `<img src="${BrunoLavaboCard._escapeAttr(banner)}" alt="" loading="eager" decoding="async">` : ''}
            <div class="lavabo-popup-banner-shade" aria-hidden="true"></div>
          </div>
          <div class="lavabo-popup-lights">
            ${lights.map((light) => `
              <button class="lavabo-light-tile${light.on ? ' is-on' : ''}${light.unavailable ? ' is-unavailable' : ''}" type="button" data-popup-light="${BrunoLavaboCard._escapeAttr(light.entity)}" aria-label="${BrunoLavaboCard._escapeAttr(light.name)}">
                <span class="lavabo-light-icon" aria-hidden="true"><bruno-icon icon="${BrunoLavaboCard._escapeAttr(light.icon || 'mdi:lightbulb-outline')}"></bruno-icon></span>
                <span class="lavabo-light-copy">
                  <strong>${BrunoLavaboCard._escape(light.name || 'Luz')}</strong>
                  <span>${BrunoLavaboCard._escape(light.stateLabel)}</span>
                </span>
              </button>
            `).join('')}
          </div>
        </section>
      </dialog>
    `;
  }

  _wireLavaboPopup() {
    const root = this.shadowRoot;
    if (!root) return;
    const dialog = root.querySelector('.lavabo-dialog');
    if (!dialog) return;

    // Clique no fundo do dialog (fora do painel) fecha; clique no painel nao.
    const panel = root.querySelector('.lavabo-popup-panel');
    panel?.addEventListener('click', (event) => event.stopPropagation());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) this._closeLavaboPopup();
    });
    // ESC (evento 'cancel' do <dialog>) fecha pelo nosso fluxo.
    dialog.addEventListener('cancel', (event) => {
      event.preventDefault();
      this._closeLavaboPopup();
    });

    root.querySelectorAll('[data-popup-action="close"]').forEach((node) => {
      node.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._closeLavaboPopup();
      });
    });
    root.querySelectorAll('[data-popup-light]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._togglePopupLight(button.dataset.popupLight);
      });
    });

    // O _render() recria o markup a cada atualizacao de hass. Se o popup deve
    // estar aberto, reabrimos o <dialog> recem-criado (sincrono, sem flicker)
    // e reancoramos o painel ao botao do card.
    if (this._lavaboPopupOpen) {
      if (!dialog.open) {
        try { dialog.showModal(); } catch (_) { /* dialog ainda nao conectado */ }
      }
      this._positionPopup();
    }
  }

  // Ancora o painel ao proprio botao do Lavabo (a semelhanca do popup de Config).
  // O <dialog> esta na top layer -> getBoundingClientRect()/coords sao da viewport.
  _positionPopup() {
    const panel = this.shadowRoot?.querySelector('.lavabo-popup-panel');
    if (!panel) return;
    const anchor = this.getBoundingClientRect();
    if (!anchor.width && !anchor.height) return;
    const gap = 10;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const pw = panel.offsetWidth || 520;
    const ph = panel.offsetHeight || 240;

    // Horizontal: alinha a borda DIREITA do painel a borda direita do botao
    // (o Lavabo fica no canto superior direito -> abre para dentro da tela).
    let left = anchor.right - pw;
    left = Math.min(Math.max(left, gap), Math.max(gap, vw - pw - gap));

    // Vertical: abre logo ABAIXO do botao; se nao couber, abre ACIMA.
    let top = anchor.bottom + gap;
    if (top + ph > vh - gap) top = anchor.top - ph - gap;
    top = Math.min(Math.max(top, gap), Math.max(gap, vh - ph - gap));

    panel.style.left = `${Math.round(left)}px`;
    panel.style.top = `${Math.round(top)}px`;
  }
  _isActionCoolingDown(key) {
    this._lastActionAt = this._lastActionAt || {};
    const now = Date.now();
    const previous = this._lastActionAt[key] || 0;
    if (now - previous < BRUNO_LAVABO_ACTION_COOLDOWN) return true;
    this._lastActionAt[key] = now;
    return false;
  }

  _runConfiguredAction(action, fallbackEntityId) {
    if (!action) {
      this._moreInfo(fallbackEntityId);
      return;
    }

    switch (action.action) {
      case 'fire-dom-event':
        this._fireDomEvent(action);
        return;
      case 'more-info':
        this._moreInfo(action.entity || fallbackEntityId);
        return;
      case 'navigate':
        this._navigate(action.navigation_path || action.path);
        return;
      case 'perform-action':
      case 'call-service':
        this._callConfiguredService(action);
        return;
      case 'none':
        return;
      default:
        this._fireDomEvent(action);
    }
  }

  _callConfiguredService(action) {
    const serviceName = action.perform_action || action.service;
    const data = action.data || action.service_data || {};
    const target = action.target || {};
    this._callService(serviceName, data, target);
  }

  _callService(serviceName, data = {}, target = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;

    const serviceData = { ...data };
    if (target?.entity_id != null && serviceData.entity_id == null) serviceData.entity_id = target.entity_id;
    if (target?.area_id != null && serviceData.area_id == null) serviceData.area_id = target.area_id;
    if (target?.device_id != null && serviceData.device_id == null) serviceData.device_id = target.device_id;

    this._hass.callService(domain, service, serviceData, target);
  }

  _navigate(path) {
    if (!path) return;
    const resolvedPath = this._resolveNavigationPath(path);
    const eventPath = path.startsWith('/') ? resolvedPath : path;
    globalThis.BrunoLiquidGlass?.routeTransition?.();
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: eventPath },
      bubbles: true,
      composed: true,
    }));

    window.setTimeout(() => {
      if (!resolvedPath || window.location?.pathname === resolvedPath) return;
      if (window.history?.pushState) window.history.pushState(null, '', resolvedPath);
      window.dispatchEvent?.(new CustomEvent('location-changed', { detail: { replace: false } }));
    }, 80);
  }

  _resolveNavigationPath(path) {
    if (!path) return '';
    if (path.startsWith('/')) return path;

    const current = window.location?.pathname || '';
    const dashboard = current.split('/').filter(Boolean)[0];
    return `/${dashboard || 'ngocjohn-main'}/${path}`;
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _fireDomEvent(action) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: action,
      bubbles: true,
      composed: true,
    }));
  }

  _wireAction(button) {
    const key = button.dataset.actionKey;
    if (!key) return;

    let holdTimer = null;
    let holdFired = false;
    let pointerDown = false;
    // NOVO (2026-07-22) — consolidacao mobile: separa tap intencional de
    // arraste iniciado sobre o card sem bloquear o scroll nativo.
    const dragCancelThreshold = 10;
    let activePointerId = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerMoved = false;

    const clearHold = () => {
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const resetPress = () => {
      clearHold();
      pointerDown = false;
      pointerMoved = false;
      activePointerId = null;
      button.classList.remove('is-pressed');
    };

    button.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      // NOVO (2026-07-22) — consolidacao mobile: serializa o gesto; pointers
      // adicionais nao substituem o pointer/timer que iniciou a interacao.
      if (activePointerId !== null) return;
      // ANTERIOR (rollback): event.preventDefault();
      // NOVO (2026-07-22) — consolidacao mobile: libera o pan da shell.
      event.stopPropagation();

      pointerDown = true;
      holdFired = false;
      activePointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerMoved = false;
      button.classList.add('is-pressed');
      // ANTERIOR (rollback): button.setPointerCapture?.(event.pointerId);

      holdTimer = window.setTimeout(() => {
        if (!pointerDown || pointerMoved) return;
        holdFired = true;
        button.classList.add('is-hold-fired');
        window.setTimeout(() => button.classList.remove('is-hold-fired'), 260);
        this._runAction(key, 'hold');
      }, 560);
    });

    // NOVO (2026-07-22) — consolidacao mobile: deslocamento acima da
    // tolerancia cancela tap/hold; deliberadamente nao usa preventDefault().
    button.addEventListener('pointermove', (event) => {
      if (!pointerDown || event.pointerId !== activePointerId) return;
      const movedX = Math.abs(event.clientX - pointerStartX);
      const movedY = Math.abs(event.clientY - pointerStartY);
      if (movedX <= dragCancelThreshold && movedY <= dragCancelThreshold) return;
      pointerMoved = true;
      clearHold();
      button.classList.remove('is-pressed');
    });

    button.addEventListener('pointerup', (event) => {
      // NOVO (2026-07-22) — consolidacao mobile: somente o pointer que abriu
      // o gesto pode conclui-lo e executar a acao.
      if (event.pointerId !== activePointerId) return;
      event.preventDefault();
      event.stopPropagation();
      // ANTERIOR (rollback): button.releasePointerCapture?.(event.pointerId);

      const wasPointerDown = pointerDown;
      const wasPointerMoved = pointerMoved;
      resetPress();

      // ANTERIOR (rollback): if (!wasPointerDown || holdFired) return;
      if (!wasPointerDown || wasPointerMoved || holdFired) return;
      this._runAction(key, 'tap');
    });

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    button.addEventListener('pointerleave', resetPress);
    // ANTERIOR (rollback): button.addEventListener('pointercancel', resetPress);
    button.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== activePointerId) return;
      resetPress();
    });

    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._runAction(key, 'tap');
    });
  }

  _wireRoomNavZone(zone) {
    if (!zone) return;

    let pointerHandled = false;
    // NOVO (2026-07-22) — consolidacao mobile: o Lavabo preserva seu fluxo
    // direto de navegacao, agora com cancelamento por deslocamento.
    const dragCancelThreshold = 10;
    let pointerDown = false;
    let activePointerId = null;
    let pointerStartX = 0;
    let pointerStartY = 0;
    let pointerMoved = false;

    const open = (event) => {
      event.preventDefault();
      event.stopPropagation();
      zone.classList.add('is-navigating');
      window.setTimeout(() => zone.classList.remove('is-navigating'), 420);
      window.setTimeout(() => this._runRoomSubview(), 90);
    };

    const resetPress = () => {
      pointerDown = false;
      pointerMoved = false;
      activePointerId = null;
      zone.classList.remove('is-pressed');
    };

    zone.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      // NOVO (2026-07-22) — consolidacao mobile: mantem um unico pointer
      // responsavel pela navegacao ate o encerramento do gesto.
      if (activePointerId !== null) return;
      // ANTERIOR (rollback): event.preventDefault();
      // NOVO (2026-07-22) — consolidacao mobile: preserva o scroll nativo.
      event.stopPropagation();
      pointerHandled = false;
      pointerDown = true;
      activePointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerMoved = false;
      zone.classList.add('is-pressed');
      // ANTERIOR (rollback): zone.setPointerCapture?.(event.pointerId);
    });

    // NOVO (2026-07-22) — consolidacao mobile: movimento cancela a abertura
    // da subview e nao interfere no gesto de pan.
    zone.addEventListener('pointermove', (event) => {
      if (!pointerDown || event.pointerId !== activePointerId) return;
      const movedX = Math.abs(event.clientX - pointerStartX);
      const movedY = Math.abs(event.clientY - pointerStartY);
      if (movedX <= dragCancelThreshold && movedY <= dragCancelThreshold) return;
      pointerMoved = true;
      pointerHandled = true;
      zone.classList.remove('is-pressed');
    });

    zone.addEventListener('pointerup', (event) => {
      // NOVO (2026-07-22) — consolidacao mobile: pointer secundario nao pode
      // concluir a navegacao iniciada por outro toque.
      if (event.pointerId !== activePointerId) return;
      // ANTERIOR (rollback): zone.releasePointerCapture?.(event.pointerId);
      const shouldOpen = pointerDown && !pointerMoved;
      resetPress();
      pointerHandled = true;
      if (!shouldOpen) {
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      open(event);
    });

    zone.addEventListener('click', (event) => {
      if (pointerHandled) {
        pointerHandled = false;
        event.preventDefault();
        event.stopPropagation();
        return;
      }
      open(event);
    });

    zone.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    zone.addEventListener('pointerleave', resetPress);
    // ANTERIOR (rollback): zone.addEventListener('pointercancel', resetPress);
    zone.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== activePointerId) return;
      resetPress();
    });

    zone.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      open(event);
    });
  }

  _wireAssetFallback() {
    this.shadowRoot
      ?.querySelectorAll('.room-asset')
      .forEach((asset) => {
        asset.addEventListener('error', () => {
          asset.closest('.room-icon')?.classList.add('has-image-error');
        }, { once: true });
      });
  }

  _statusDot(dot) {
    const activeClass = dot.active ? ' is-active' : '';
    return `
      <span class="status-dot tone-${dot.tone}${activeClass}" title="${BrunoLavaboCard._escape(dot.label)}" aria-label="${BrunoLavaboCard._escape(dot.label)}">
        <bruno-icon icon="${dot.icon}"></bruno-icon>
      </span>
    `;
  }

  _statusLines(lines) {
    if (!lines.length) return '';
    return lines.map((line) => `<span>${BrunoLavaboCard._escape(line)}</span>`).join('');
  }

  _assetVisual(active) {
    const icon = this._config.icon;
    const fallback = BrunoLavaboCard._escape(icon.fallback || 'mdi:home-outline');
    const off = BrunoLavaboCard._escape(icon.off || '');
    const on = BrunoLavaboCard._escape(icon.on || '');
    const phoneOff = BrunoLavaboCard._escape(icon.phone_off || '');
    const phoneOn = BrunoLavaboCard._escape(icon.phone_on || '');
    return `
      <span class="room-asset-wrap">
        <span class="room-asset-fallback"><bruno-icon icon="${fallback}"></bruno-icon></span>
        ${off ? `<picture>${phoneOff ? `<source media="(max-width: 800px)" srcset="${phoneOff}">` : ''}<img class="room-asset room-asset-off" src="${off}" alt="" loading="eager" decoding="async"></picture>` : ''}
        ${on ? `<picture>${phoneOn ? `<source media="(max-width: 800px)" srcset="${phoneOn}">` : ''}<img class="room-asset room-asset-on" src="${on}" alt="" loading="eager" decoding="async"></picture>` : ''}
      </span>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const roomActiveClass = model.roomOn ? ' is-room-on' : '';
    const hasMetricClass = model.temperature || model.dots.some((dot) => dot.active) ? ' has-metric' : '';
    const iconSize = Number(this._config.icon_size) || BRUNO_LAVABO_DEFAULT_CONFIG.icon_size;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-room-radius, var(--bruno-liquid-card-radius-compact, 16px));
          --accent: 150, 190, 255;
          --accent-blue: 96, 165, 250;
          --accent-purple: 167, 139, 250;
          --accent-cyan: 79, 172, 254;
          --accent-amber: 255, 153, 0;
          --text-main: rgba(245,250,255,0.96);
          --text-soft: rgba(255,255,255,0.40);
          --text-muted: rgba(255,255,255,0.52);
          --dot-off-bg: rgba(255,255,255,0.08);
          --dot-off-border: rgba(255,255,255,0.12);
          --dot-off-icon: rgba(255,255,255,0.35);
          display: block;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          margin: 0;
          padding: 0;

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

        .room-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
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

        .room-card::before,
        .room-card::after {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .room-card::before {
          inset: 1px;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .room-card::after {
          inset: auto 16px 8px 16px;
          height: 1px;
          border-radius: 999px;
          background: var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent));
          opacity: var(--bruno-liquid-surface-bottom-line-opacity, 0);
        }

        .room-card.is-room-on {
          --text-main: rgba(248,251,255,0.96);
          --text-soft: rgba(255,255,255,0.52);
          --text-muted: rgba(255,255,255,0.62);
          --dot-off-bg: rgba(8,12,20,0.22);
          --dot-off-border: rgba(255,255,255,0.20);
          --dot-off-icon: rgba(255,255,255,0.66);
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

        .room-card.is-room-on::before {
          background: var(--bruno-liquid-surface-on-sheen,
            radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%),
            radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%),
            radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%),
            linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%)
          );
          opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
        }

        .room-action {
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: grid;
          /* --- ORIGINAL grid 2 colunas (rollback rapido) ---
          grid-template-columns: auto minmax(0, 1fr);
          grid-template-rows: auto 1fr auto auto;
          grid-template-areas:
            "icon temp"
            "icon space"
            "title title"
            "state state";
          column-gap: 0;
          row-gap: 0;
          align-items: start;
          padding: 14px 54px 13px 11px;
          --- FIM ORIGINAL --- */
          /* ANTERIOR (2026-07-03): 124px fixo estourava a largura real do card
             (124+40+gaps+padding > largura) e clipava o dot de presenca a direita
             — este era o "desalinhamento" do Lavabo (nao a falta de temp/umidade).
             grid-template-columns: 124px minmax(0, 1fr) 40px; */
          /* NOVO (padrao Office): a coluna do icone absorve o deficit e o PNG
             encolhe proporcionalmente — os status nunca sao clipados. */
          grid-template-columns: minmax(0, 124px) minmax(0, 1fr) 40px;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
          grid-template-areas:
            "icon space right"
            "icon space right"
            "title title right"
            "state state right";
          column-gap: 6px;
          row-gap: 0;
          align-items: start;
          /* ORIGINAL padding-right: 10px */
          padding: 14px 14px 13px 11px;
          margin: 0;
          text-align: left;
          background: transparent;
          border: 0;
          border-radius: var(--card-radius);
          box-shadow: none;
          overflow: hidden;
          transition:
            transform var(--bruno-liquid-motion-fast, 160ms ease),
            filter var(--bruno-liquid-motion-fast, 160ms ease);
        }

        .room-action:hover {
          filter: brightness(1.05);
        }

        .room-action.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .room-action.is-hold-fired {
          filter: drop-shadow(0 0 18px rgba(var(--accent),0.28));
        }

        /* --- ORIGINAL .room-icon 94x94 (rollback rapido) ---
        .room-icon {
          grid-area: icon;
          justify-self: start;
          align-self: start;
          position: relative;
          width: var(--room-icon-size);
          height: var(--room-icon-size);
          margin-left: -4px;
          margin-top: -4px;
        }
        --- FIM ORIGINAL --- */

        .room-icon {
          grid-area: icon;
          justify-self: start;
          align-self: start;
          position: relative;
          /* ANTERIOR (2026-07-03): width fixo 120px transbordava quando a track encolhe. */
          /* NOVO (padrao Office): imagem flexivel — encolhe junto com a coluna. */
          width: 100%;
          max-width: 120px;
          height: 80px;
          margin-left: 0;
          margin-top: 1px;
        }

        .room-asset-wrap,
        .room-asset-fallback,
        .room-asset {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .room-asset {
          width: 96%;
          height: 96%;
          object-fit: contain;
          object-position: left top; /* NOVO: ancora asset tight no topo-esquerdo */
          opacity: 0;
          transform: translateZ(0);
          filter: drop-shadow(0 6px 8px rgba(0,0,0,0.22));
          transition: opacity 420ms ease, filter 420ms ease, transform 420ms ease;
        }

        .room-asset-off {
          opacity: 1;
        }

        .room-card.is-room-on .room-asset-off {
          opacity: 0;
        }

        .room-card.is-room-on .room-asset-on {
          opacity: 1;
          filter: drop-shadow(0 6px 9px rgba(0,0,0,0.20)) drop-shadow(0 0 12px rgba(255,187,72,0.14));
          transform: translateY(-1px) scale(1.01);
        }

        .room-asset-fallback {
          opacity: 0;
          pointer-events: none;
          color: rgba(255,255,255,0.58);
        }

        .room-asset-fallback bruno-icon {
          --mdc-icon-size: 100%;
          width: 100%;
          height: 100%;
        }

        .room-icon.has-image-error .room-asset {
          display: none;
        }

        .room-icon.has-image-error .room-asset-fallback {
          opacity: 1;
        }

        /* --- ORIGINAL .metric grid-area temp (rollback rapido) ---
        .metric {
          grid-area: temp;
          justify-self: start;
          align-self: start;
          min-width: 48px;
          margin-left: 6px;
          margin-top: 3px;
          text-align: left;
          line-height: 1.1;
        }
        --- FIM ORIGINAL --- */

        .metric {
          min-width: 36px;
          text-align: center;
          line-height: 1.1;
        }

        .room-action:not(.has-metric) .metric {
          display: none;
        }

        .metric-value {
          display: block;
          font-size: 13px;
          line-height: 1;
          font-weight: 760;
          color: var(--text-main);
        }

        .metric-sub {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          line-height: 1;
          font-weight: 600;
          color: var(--text-muted);
        }

        .room-copy {
          grid-column: 1 / 3;
          grid-row: 3 / 5;
          align-self: end;
          justify-self: start;
          min-width: 0;
          width: min(136px, 100%);
          min-height: 56px;
          padding: 2px 24px 2px 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
        }

        .room-nav-zone {
          flex: 0 0 auto;
          width: 24px;
          height: 24px;
          display: inline-grid;
          place-items: center;
          outline: none;
          border-radius: 999px;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .room-title-row {
          display: flex;
          align-items: center;
          gap: 8px;
          min-width: 0;
        }

        .title {
          display: block;
          min-width: 0;
          margin: 0 0 2px 0;
          font-size: 15px;
          line-height: 1.18;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .room-chevron {
          flex: 0 0 auto;
          font-size: 23px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.56);
          transform: translateY(-1px);
          transition:
            color var(--bruno-liquid-motion-fast, 140ms ease),
            transform var(--bruno-liquid-motion-fast, 140ms ease),
            filter var(--bruno-liquid-motion-fast, 140ms ease);
        }


        .room-nav-zone.is-pressed .room-chevron {
          color: rgba(255,255,255,0.96);
          transform: translate(2px, -1px);
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.26));
        }

        .room-nav-zone.is-hold-fired .room-chevron {
          color: rgba(255,214,150,0.98);
          filter: drop-shadow(0 0 10px rgba(255,190,90,0.34));
        }

        .room-nav-zone.is-navigating .room-chevron {
          animation: brunoRoomChevronNavigate 360ms ease both;
        }

        @keyframes brunoRoomChevronNavigate {
          0% { transform: translate(0, -1px); }
          52% { transform: translate(5px, -1px); }
          100% { transform: translate(2px, -1px); }
        }

        .status-lines {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 1px;
          font-size: 11px;
          line-height: 1.16;
          font-weight: 500;
          color: var(--text-soft);
          white-space: normal;
          overflow: hidden;
        }

        .status-lines span {
          display: block;
          max-width: 136px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* --- ORIGINAL .right-dots absoluto (rollback rapido) ---
        .right-dots {
          position: absolute;
          z-index: 2;
          top: 15px;
          right: 13px;
          margin: 0;
          padding-top: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 5px;
        }
        --- FIM ORIGINAL --- */

        .right-rail {
          grid-area: right;
          justify-self: center;
          align-self: start;
          margin: 0;
          padding-top: 1px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          transform: translate(5px, -3px);
        }

        .status-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        /* --- ORIGINAL .status-dot vidro fosco (rollback rapido) ---
        .status-dot {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          position: relative;
          color: var(--dot-off-icon);
          background: var(--dot-off-bg);
          border: 1px solid var(--dot-off-border);
          box-shadow: none;
          transition:
            background var(--bruno-liquid-motion-fast, 160ms ease),
            border-color var(--bruno-liquid-motion-fast, 160ms ease),
            color var(--bruno-liquid-motion-fast, 160ms ease),
            box-shadow var(--bruno-liquid-motion-fast, 160ms ease),
            transform var(--bruno-liquid-motion-fast, 160ms ease);
        }

        .status-dot.is-active {
          color: rgb(var(--tone));
          background:
            radial-gradient(17px 15px at 50% 44%, rgba(var(--tone),0.24), transparent 72%),
            rgba(6,10,18,0.28);
          border-color: rgba(var(--tone),0.60);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 8px rgba(var(--tone),0.34),
            0 0 18px rgba(var(--tone),0.24),
            0 0 30px rgba(var(--tone),0.12);
          transform: translateZ(0) scale(1.04);
        }

        .status-dot.is-active bruno-icon {
          filter: drop-shadow(0 0 5px rgba(var(--tone),0.56));
        }
        --- FIM ORIGINAL --- */

        .status-dot {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          position: relative;
          color: #ffffff;
          background:
            radial-gradient(circle at 50% 18%, rgba(255,255,255,0.30), transparent 62%),
            linear-gradient(180deg, rgba(var(--tone),0.68), rgba(var(--tone),0.40));
          border: 1px solid rgba(255,255,255,0.38);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.32),
            0 0 12px rgba(var(--tone),0.32);
        }

        @keyframes brunoRoomDotIn {
          from { opacity: 0; transform: scale(0.55); }
          to { opacity: 1; transform: scale(1); }
        }

        .status-dot bruno-icon {
          --mdc-icon-size: 14px;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
          color: #ffffff;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.28));
        }

        .tone-blue { --tone: var(--accent-blue); }
        .tone-purple { --tone: var(--accent-purple); }
        .tone-cyan { --tone: var(--accent-cyan); }
        .tone-amber { --tone: var(--accent-amber); }
/* ANTERIOR (rollback): overlay com position:fixed dentro do shadow DOM — ficava
           cortado pelo overflow:hidden do .content-slot do shell.
        .lavabo-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 40;
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .lavabo-popup-scrim {
          position: absolute;
          inset: -12px;
          background: rgba(0,0,0,0.34);
          backdrop-filter: blur(18px) saturate(1.08);
          -webkit-backdrop-filter: blur(18px) saturate(1.08);
        }
        --- FIM ANTERIOR --- */

        /* NOVO: <dialog> nativo na top layer — centraliza o painel e cobre a tela
           inteira independentemente de overflow/transform de ancestrais. */
        .lavabo-dialog {
          margin: 0;
          padding: 0;
          border: 0;
          inset: 0;
          width: 100vw;
          max-width: 100vw;
          height: 100vh;
          max-height: 100vh;
          background: transparent;
          color: inherit;
          overflow: visible;
        }

        /* ANTERIOR (rollback): centralizava o painel (display:grid + place-items:center).
           NOVO: o dialog so cobre a viewport (backdrop + clique-fora); o painel e
           ANCORADO ao botao do card via top/left inline (ver _positionPopup). */
        .lavabo-dialog[open] {
          display: block;
        }

        .lavabo-dialog:not([open]) {
          display: none;
        }

        /* ANTERIOR (rollback): blur forte (18px) escurecia demais o fundo.
           NOVO: fundo suave a semelhanca do popup de Config (blur 2px / ~0.08). */
        .lavabo-dialog::backdrop {
          background: rgba(0,0,0,0.10);
          backdrop-filter: blur(3px) saturate(1.04);
          -webkit-backdrop-filter: blur(3px) saturate(1.04);
        }

        .lavabo-popup-panel {
          position: fixed;
          top: 0;
          left: 0;
          z-index: 1;
          width: min(520px, calc(100vw - 52px));
          border-radius: var(--bruno-liquid-panel-radius, 18px);
          border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.16));
          color: rgba(255,255,255,0.94);
          background: var(--bruno-liquid-popup-background,
            linear-gradient(180deg, rgba(44,33,26,0.80), rgba(16,14,14,0.82)),
            rgba(20,18,18,0.80)
          );
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 24px 64px rgba(0,0,0,0.42);
          backdrop-filter: var(--bruno-liquid-popup-filter, blur(28px) saturate(1.42));
          -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(28px) saturate(1.42));
          overflow: hidden;
        }

        .lavabo-dialog[data-bruno-popup-theme="josh"] .lavabo-popup-panel {
          border: var(--bruno-josh-popup-border, var(--bruno-liquid-popup-border));
          background: var(--bruno-josh-popup-background, var(--bruno-liquid-popup-background));
          box-shadow: var(--bruno-josh-popup-shadow, var(--bruno-liquid-popup-shadow));
          backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
          -webkit-backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
          isolation: isolate;
        }

        .lavabo-dialog[data-bruno-popup-theme="josh"] .lavabo-popup-panel::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          border-radius: inherit;
          background: var(--bruno-josh-popup-sheen, none);
          opacity: var(--bruno-josh-popup-sheen-opacity, 0.13);
          pointer-events: none;
        }

        .lavabo-dialog[data-bruno-popup-theme="josh"] .lavabo-popup-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 2;
          padding: 1px;
          border-radius: inherit;
          background: var(--bruno-josh-popup-edge-glow, none);
          opacity: var(--bruno-josh-popup-edge-opacity, 0.70);
          pointer-events: none;
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
        }

        .lavabo-dialog[data-bruno-popup-theme="josh"] .lavabo-popup-panel > * {
          position: relative;
          z-index: 1;
        }

        .lavabo-popup-header {
          height: 52px;
          padding: 10px 12px 8px 14px;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .lavabo-popup-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: rgb(255,195,83);
          background: rgba(255,185,70,0.13);
          border: 1px solid rgba(255,190,80,0.35);
        }

        .lavabo-popup-icon bruno-icon {
          --mdc-icon-size: 16px;
        }

        .lavabo-popup-title {
          flex: 1 1 auto;
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .lavabo-popup-title strong {
          font-size: 14px;
          line-height: 1;
          font-weight: 800;
        }

        .lavabo-popup-title span {
          font-size: 10px;
          line-height: 1;
          font-weight: 650;
          color: rgba(255,255,255,0.52);
        }

        .lavabo-popup-close {
          appearance: none;
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.14);
          color: rgba(255,255,255,0.72);
          background: rgba(255,255,255,0.08);
        }

        .lavabo-dialog[data-bruno-popup-theme="josh"] .lavabo-popup-close {
          border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
          background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
          box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
          backdrop-filter: var(--bruno-liquid-control-filter, none);
          -webkit-backdrop-filter: var(--bruno-liquid-control-filter, none);
        }

        .lavabo-popup-banner {
          position: relative;
          height: 128px;
          margin: 0 12px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          overflow: hidden;
          background:
            radial-gradient(140px 80px at 20% 14%, rgba(255,219,155,0.20), transparent 70%),
            linear-gradient(135deg, rgba(86,62,44,0.70), rgba(20,17,16,0.86));
        }

        .lavabo-popup-banner img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: brightness(0.86) saturate(1.04);
        }

        /* NOVO: bordas atmosfericas nas 4 arestas (mesma linguagem do backdrop do
           shell) — escurece o perimetro da foto para fundir com o painel. */
        .lavabo-popup-banner-shade {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(90deg,  rgba(12,9,7,0.72) 0%, rgba(12,9,7,0.28) 7%, transparent 18%),
            linear-gradient(270deg, rgba(12,9,7,0.72) 0%, rgba(12,9,7,0.28) 7%, transparent 18%),
            linear-gradient(0deg,   rgba(12,9,7,0.78) 0%, rgba(12,9,7,0.30) 8%, transparent 22%),
            linear-gradient(180deg, rgba(255,255,255,0.10) 0%, rgba(12,9,7,0.34) 6%, transparent 20%);
        }

        .lavabo-popup-lights {
          padding: 0 12px 14px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
        }

        .lavabo-light-tile {
          appearance: none;
          min-width: 0;
          min-height: 74px;
          padding: 10px 9px;
          display: grid;
          grid-template-columns: auto minmax(0, 1fr);
          align-items: center;
          gap: 9px;
          text-align: left;
          border-radius: var(--bruno-liquid-control-radius, 11px);
          border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
          color: rgba(255,255,255,0.88);
          background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
          box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
          backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(1.08));
          -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(1.08));
        }

        .lavabo-light-tile.is-on {
          color: rgba(255,246,225,0.98);
          border-color: rgba(255,195,80,0.38);
          background:
            radial-gradient(80px 48px at 18% 12%, rgba(255,203,95,0.22), transparent 70%),
            rgba(255,255,255,0.09);
        }

        .lavabo-light-tile.is-unavailable {
          opacity: 0.58;
        }

        .lavabo-light-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          color: rgb(255,197,92);
        }

        .lavabo-light-icon bruno-icon {
          --mdc-icon-size: 24px;
        }

        .lavabo-light-copy {
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .lavabo-light-copy strong,
        .lavabo-light-copy span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .lavabo-light-copy strong {
          font-size: 12px;
          line-height: 1;
          font-weight: 800;
        }

        .lavabo-light-copy span {
          font-size: 10px;
          line-height: 1;
          font-weight: 650;
          color: rgba(255,255,255,0.56);
        }


        @media (max-height: 760px) {
          .room-action {
            /* ORIGINAL padding-right: 8px */
            padding: 12px 11px 12px 11px;
          }

          .room-icon {
            /* ANTERIOR (2026-07-03): width: 108px; */
            width: 100%;
            max-width: 108px;
            height: 72px;
          }
        }

        /* NOVO (2026-07-09) — Fase 2 mobile: card de comodo no phone.
           PNG menor + padding reduzido => sobra altura para os status
           semanticos e para a coluna direita de indicadores (que estavam
           sendo cortados). ROLLBACK: remover este bloco @media. */
        @media (max-width: 800px) {
          .room-action {
            padding: 11px 12px 10px 10px;
          }

          .room-icon {
            max-width: 100px;
            height: 62px;
          }

          .room-asset-wrap picture {
            display: contents;
          }

          .room-asset,
          .room-card.is-room-on .room-asset-on {
            inset: auto;
            top: 0;
            left: 0;
            width: auto;
            height: 111%;
            aspect-ratio: 1 / 1;
            object-fit: contain;
            object-position: left top;
            transform: translate(-8.66%, -7.81%);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .room-action,
          .status-dot,
          .room-asset {
            animation: none !important;
            transition: none !important;
          }
        }
        /* ==== HOME V3 - MODO TILE (2026-07-26) ==========================
           Ativo somente quando o card recebe 'variant: tile' (faixa de
           comodos do desktop V2) E o tema declara --bruno-tile-mode: on
           (hoje: apenas Josh.ai). Nos demais temas estas classes nunca
           aparecem no elemento - phone e Home V1 ficam identicos.
           Calibravel por tema via --bruno-tile-*; os fallbacks abaixo ja
           sao o visual de tile aprovado no mockup.
           INVARIANTE (rev.7): o tile perde o backdrop-filter aqui, e e isso
           que autoriza a BANDA a ter blur. Se o tile voltar a filtrar, o
           blur da banda sai no MESMO commit - senao volta o borrao sobre
           borrao. Ver v2/bento_bottom_block.yaml.
           ROLLBACK: remover 'variant: tile' do YAML ou o token do tema.
           =============================================================== */
        .room-card.is-tile,
        .room-card.is-tile.is-room-on {
          background: var(--bruno-tile-background, none);
          border: var(--bruno-tile-border, 0);
          border-radius: var(--bruno-tile-radius, 0);
          box-shadow: var(--bruno-tile-shadow, none);
          backdrop-filter: var(--bruno-tile-filter, none);
          -webkit-backdrop-filter: var(--bruno-tile-filter, none);
        }

        .room-card.is-tile::before,
        .room-card.is-tile.is-room-on::before {
          opacity: var(--bruno-tile-sheen-opacity, 0);
        }

        /* Filete vertical no lugar do gap (gap vira 0 via --bruno-tile-gap). */
        .room-card.is-tile.has-divider .tile-divider {
          position: absolute;
          left: 0;
          top: 8px;
          bottom: 8px;
          width: 1px;
          z-index: 2;
          pointer-events: none;
          background: var(--bruno-tile-divider, linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.19) 22%, rgba(255,255,255,0.19) 78%, rgba(255,255,255,0) 100%));
        }

        /* ON sem vidro: filete quente na base (reaproveita o ::after que ja
           existe com opacidade 0) + brilho difuso sob o titulo. */
        .room-card.is-tile.is-room-on::after {
          inset: auto 14px 0 14px;
          opacity: 1;
          background: var(--bruno-tile-on-line, linear-gradient(90deg, rgba(255,187,72,0) 0%, rgba(255,187,72,0.42) 50%, rgba(255,187,72,0) 100%));
        }

        .room-card.is-tile .room-action {
          position: relative;
        }

        .room-card.is-tile.is-room-on .room-action::after {
          content: "";
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 0;
          height: 46px;
          z-index: 0;
          pointer-events: none;
          background: var(--bruno-tile-on-glow, radial-gradient(60px 30px at 50% 100%, rgba(255,187,72,0.10), transparent 72%));
        }

        /* Josh.ai: material flat dos dots, restrito aos tiles da Home. */
        .room-card.is-tile .status-dot.is-active {
          background: rgba(var(--tone), var(--bruno-tile-status-dot-fill-alpha));
          border: var(--bruno-tile-status-dot-border);
          box-shadow: 0 0 var(--bruno-tile-status-dot-halo-size)
            rgba(var(--tone), var(--bruno-tile-status-dot-halo-alpha));
        }
      </style>

      <div class="room-card${roomActiveClass}${this._tileClasses()}" style="--room-icon-size:${iconSize}px;">
        ${this._tileDivider()}
        <button class="room-action${hasMetricClass}" type="button" data-action-key="room" aria-label="${BrunoLavaboCard._escape(this._config.name)}">
          <div class="room-icon" aria-hidden="true">${this._assetVisual(model.iconActive)}</div>

          <!-- ORIGINAL metric topo-esquerdo (rollback rapido):
          <div class="metric">
            <span class="metric-value">\${model.temperature}</span>
            <span class="metric-sub">\${model.humidity}</span>
          </div>
          FIM ORIGINAL -->
          <span class="room-copy">
            <span class="room-title-row">
              <span class="title">${BrunoLavaboCard._escape(this._config.name)}</span>
              <span class="room-nav-zone" data-room-nav role="button" tabindex="0" aria-label="Abrir ${BrunoLavaboCard._escape(this._config.name)}">
                <span class="room-chevron" aria-hidden="true">&rsaquo;</span>
              </span>
            </span>
            <span class="status-lines">${this._statusLines(model.statusLines)}</span>
          </span>

          <!-- ORIGINAL right-dots fixos (rollback rapido):
          <div class="right-dots" aria-label="Status do ambiente">
            \${model.dots.map((dot) => this._statusDot(dot)).join('')}
          </div>
          FIM ORIGINAL -->
          <div class="right-rail" aria-label="Status do ambiente">
            <div class="metric" aria-label="Temperatura e umidade">
              <span class="metric-value">${model.temperature}</span>
              <span class="metric-sub">${model.humidity}</span>
            </div>
            <div class="status-stack">
              ${model.dots.filter((dot) => dot.active).map((dot) => this._statusDot(dot)).join('')}
            </div>
          </div>
        </button>
      </div>
      ${this._renderLavaboPopup(model)}
    `;

    this.shadowRoot
      .querySelectorAll('[data-action-key]')
      .forEach((button) => this._wireAction(button));
    this._wireRoomNavZone(this.shadowRoot.querySelector('[data-room-nav]'));
    this._wireAssetFallback();
    this._wireLavaboPopup();
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // FIX (popup): o markup do popup chamava BrunoLavaboCard._escapeAttr(), que
  // NAO existia -> TypeError durante o _render() do popup -> a montagem inteira
  // do innerHTML falhava e o popup nunca aparecia (chevron "sem efeito").
  // Mesmo contrato do BrunoShell._escapeAttr.
  static _escapeAttr(value) {
    return BrunoLavaboCard._escape(value);
  }
}

if (!customElements.get(BRUNO_LAVABO_CARD_TAG)) {
  customElements.define(BRUNO_LAVABO_CARD_TAG, BrunoLavaboCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_LAVABO_CARD_TAG,
  name: 'Bruno Lavabo Card',
  preview: false,
  description: 'Bento Lavabo card with local room logic and Bruno liquid glass visuals.',
});
