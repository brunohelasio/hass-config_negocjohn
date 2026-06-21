const BRUNO_COZINHA_SUBVIEW_TAG = 'bruno-cozinha-subview';

const BRUNO_COZINHA_SUBVIEW_DEFAULT_CONFIG = {
  title: 'Cozinha',
  subtitle: 'Visao geral',
  navigation_path: 'bento-lab',
  background: '/local/images/cozinha.jpg',
  fallback_background: '/local/images/cozinha.jpg',
  refresh_interval: 7000,
  room_nav: [
    { key: 'sala', name: 'Sala', icon: 'mdi:sofa', path: 'subview-sala', active: false },
    { key: 'office', name: 'Office', icon: 'mdi:desk', path: 'subview-office', active: false },
    { key: 'cozinha', name: 'Cozinha', icon: 'mdi:countertop', path: 'subview-cozinha', active: true },
    { key: 'lavabo', name: 'Lavabo', icon: 'mdi:toilet', path: 'subview-lavabo', divider_after: true, active: false },
    { key: 'casal', name: 'Q. Casal', icon: 'mdi:bed-king', path: 'subview-quarto-casal', active: false },
    { key: 'marina', name: 'Q. Marina', icon: 'mdi:bed-single', path: 'subview-quarto-marina', active: false },
    { key: 'miguel', name: 'Q. Miguel', icon: 'mdi:bed-single-outline', path: 'subview-quarto-miguel', active: false },
  ],
  entities: {
    active_sensor: 'sensor.cozinha_active',
    temperature: '',
    room_group: 'light.grupo_luzes_cozinha',
    lights: [
      { entity: 'light.cozinha_switch_2', name: 'Luz principal 1', icon_type: 'ledstrip', area: 'cozinha' },
      { entity: 'light.cozinha_switch_3', name: 'Luz principal 2', icon_type: 'ledstrip', area: 'cozinha' },
      { entity: 'light.cozinha_switch_1', name: 'Lavanderia', icon_type: 'pendant', area: 'lavanderia' },
      { entity: '', name: 'Reserva', icon_type: 'pendant', area: 'cozinha', placeholder: true },
    ],
    dishwasher: 'switch.cz_tomada_maq_lav_louca_socket_1',
    washer: '',
    appliances: [
      { key: 'dishwasher', name: 'Lava-loucas', entity: 'switch.cz_tomada_maq_lav_louca_socket_1', image: '/local/images/lava_louca.png' },
      { key: 'airfryer', name: 'Airfryer', entity: '', image: '/local/images/air_fry.png', placeholder: true },
      { key: 'fridge', name: 'Geladeira', entity: '', image: '/local/images/geladeira.png', placeholder: true },
      { key: 'microwave', name: 'Micro-ondas', entity: '', image: '/local/images/microondas.png', placeholder: true },
    ],
  },
  washer: {
    title: 'Lavadora',
    image: '/local/images/lava_roupa.png',
    program: 'Algodao',
    remaining: '--:--',
    status: 'Pronta para iniciar',
  },
};

const BRUNO_COZINHA_SUBVIEW_OFF_STATES = ['off', 'unavailable', 'unknown', '', 'none', 'null'];

class BrunoCozinhaSubview extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    this._lastMinute = BrunoCozinhaSubview._clock();
    this._boundActionHandler = (event) => this._handleAction(event);
    this._boundClock = () => {
      const nextMinute = BrunoCozinhaSubview._clock();
      if (nextMinute !== this._lastMinute) {
        this._lastMinute = nextMinute;
        this.shadowRoot?.querySelector('[data-clock]')?.replaceChildren(document.createTextNode(nextMinute));
      }
    };
  }

  connectedCallback() {
    if (!this._clockTimer) this._clockTimer = window.setInterval(this._boundClock, 1000);
  }

  disconnectedCallback() {
    if (this._clockTimer) window.clearInterval(this._clockTimer);
    this._clockTimer = null;
  }

  setConfig(config) {
    const incomingEntities = config?.entities || {};
    const entities = {
      ...BRUNO_COZINHA_SUBVIEW_DEFAULT_CONFIG.entities,
      ...incomingEntities,
      lights: Array.isArray(incomingEntities.lights)
        ? incomingEntities.lights
        : BRUNO_COZINHA_SUBVIEW_DEFAULT_CONFIG.entities.lights,
      appliances: Array.isArray(incomingEntities.appliances)
        ? incomingEntities.appliances
        : BRUNO_COZINHA_SUBVIEW_DEFAULT_CONFIG.entities.appliances,
    };

    this._config = {
      ...BRUNO_COZINHA_SUBVIEW_DEFAULT_CONFIG,
      ...config,
      room_nav: Array.isArray(config?.room_nav) ? config.room_nav : BRUNO_COZINHA_SUBVIEW_DEFAULT_CONFIG.room_nav,
      entities,
      washer: {
        ...BRUNO_COZINHA_SUBVIEW_DEFAULT_CONFIG.washer,
        ...(config?.washer || {}),
      },
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
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
    return !entity || BRUNO_COZINHA_SUBVIEW_OFF_STATES.includes(String(entity.state || '').toLowerCase());
  }

  _isOn(entityId) {
    const entity = this._state(entityId);
    return Boolean(entity && !this._isUnavailable(entity) && String(entity.state).toLowerCase() !== 'off');
  }

  _numberState(entityId, fallback = null) {
    const value = Number.parseFloat(this._state(entityId)?.state);
    return Number.isFinite(value) ? value : fallback;
  }

  _formatNumber(value, digits = 0) {
    if (!Number.isFinite(Number(value))) return '--';
    return Number(value).toFixed(digits).replace(/\.0+$/, '');
  }

  _temperatureLabel() {
    const value = this._numberState(this._config.entities.temperature, null);
    return value == null ? '--' : `${this._formatNumber(value, 1)}\u00b0`;
  }

  _activeLightsCount(area = '') {
    const lights = this._config.entities.lights || [];
    return lights.filter((light) => {
      if (area && light.area !== area) return false;
      return this._isOn(light.entity);
    }).length;
  }

  _brightnessPercent(entity) {
    const brightness = Number(entity?.attributes?.brightness);
    if (!Number.isFinite(brightness)) return entity?.state === 'on' ? 100 : 0;
    return Math.round((brightness / 255) * 100);
  }

  _lightLevel(light) {
    const state = this._state(light?.entity);
    if (!light?.entity || light.placeholder || state?.state !== 'on') return 0;
    return this._brightnessPercent(state);
  }

  _dishwasherModel() {
    const entityId = this._config.entities.dishwasher;
    const entity = this._state(entityId);
    const active = this._isOn(entityId);
    const unavailable = entityId && this._isUnavailable(entity);
    return {
      entityId,
      active,
      unavailable,
      label: !entityId || unavailable ? 'Indisponivel' : active ? 'Ligada' : 'Desligada',
    };
  }

  _washerModel() {
    const entityId = this._config.entities.washer;
    const entity = this._state(entityId);
    const configured = Boolean(entityId);
    const active = configured && this._isOn(entityId);
    const unavailable = configured && this._isUnavailable(entity);
    return {
      entityId,
      active,
      configured,
      unavailable,
      title: this._config.washer.title || 'Lavadora',
      image: this._config.washer.image || '/local/images/lava_roupa.png',
      status: configured && !unavailable ? (active ? 'Ligada' : 'Pronta') : 'Em integracao',
      program: this._config.washer.program || 'Algodao',
      remaining: this._config.washer.remaining || '--:--',
      detailStatus: this._config.washer.status || 'Pronta para iniciar',
    };
  }

  _applianceModel(item) {
    const entity = this._state(item.entity);
    const configured = Boolean(item.entity) && !item.placeholder;
    const unavailable = configured && this._isUnavailable(entity);
    const active = configured && !unavailable && String(entity.state).toLowerCase() !== 'off';
    return {
      ...item,
      configured,
      unavailable,
      active,
      label: !configured ? 'Em breve' : unavailable ? 'Indisponivel' : active ? 'Ligado' : 'Desligado',
    };
  }

  _sceneContextLabel() {
    const dishwasher = this._dishwasherModel();
    const washer = this._washerModel();
    if (washer.active) return 'Lavadora em uso';
    if (dishwasher.active) return 'Lava-loucas ativa';
    if (this._activeLightsCount() > 0) return 'Cozinha iluminada';
    const active = this._state(this._config.entities.active_sensor);
    return active?.state === 'yes' ? 'Cozinha em uso' : 'Cozinha em repouso';
  }

  _dateLine() {
    const days = [
      'DOMINGO',
      'SEGUNDA-FEIRA',
      'TERCA-FEIRA',
      'QUARTA-FEIRA',
      'QUINTA-FEIRA',
      'SEXTA-FEIRA',
      'SABADO',
    ];
    const now = new Date();
    return `${days[now.getDay()]}, ${String(now.getDate()).padStart(2, '0')} DE JUNHO`;
  }

  _handleAction(event) {
    const target = event.target.closest?.('[data-action]');
    if (!target) return;

    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.action;
    const entityId = target.dataset.entity;

    if (action === 'navigate') {
      this._navigate(target.dataset.path || this._config.navigation_path);
      return;
    }
    if (action === 'more-info') {
      this._moreInfo(entityId);
      return;
    }
    if (action === 'lights-on') {
      this._callService('light.turn_on', { entity_id: this._config.entities.room_group });
      return;
    }
    if (action === 'lights-off') {
      this._callService('light.turn_off', { entity_id: this._config.entities.room_group });
      return;
    }
    if (action === 'toggle-light' && entityId) {
      this._callService('homeassistant.toggle', { entity_id: entityId });
      return;
    }
    if (action === 'toggle-appliance' && entityId) {
      this._callService('homeassistant.toggle', { entity_id: entityId });
      return;
    }
  }

  _callService(serviceName, data = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;
    this._hass.callService(domain, service, data);
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
    const title = BrunoCozinhaSubview._escape(this._config.title);
    const subtitle = BrunoCozinhaSubview._escape(this._config.subtitle);
    const background = BrunoCozinhaSubview._escapeAttr(this._config.background);
    const fallbackBackground = BrunoCozinhaSubview._escapeAttr(this._config.fallback_background || this._config.background);

    return `
      <div class="hero-stage">
        <div class="hero-bg" style="--hero-image: url('${background}'); --hero-fallback-image: url('${fallbackBackground}');" aria-hidden="true"></div>
        <div class="hero-content">
          <div class="hero-top">
            <button class="back-button" type="button" data-action="navigate" data-path="${BrunoCozinhaSubview._escapeAttr(this._config.navigation_path)}" aria-label="Voltar">
              <ha-icon icon="mdi:arrow-left"></ha-icon>
            </button>
            <div>
              <div class="hero-title">${title}</div>
              <div class="hero-subtitle">${subtitle}</div>
            </div>
          </div>

          <div class="hero-headline">
            <p class="hero-date-line">${BrunoCozinhaSubview._escape(this._dateLine())}</p>
            <div class="hero-clock" data-clock>${this._lastMinute}</div>
            <button type="button" class="scene-pill" data-action="more-info" data-entity="${BrunoCozinhaSubview._escapeAttr(this._config.entities.active_sensor)}">
              <ha-icon icon="mdi:silverware-fork-knife"></ha-icon>
              <span>${BrunoCozinhaSubview._escape(this._sceneContextLabel())}</span>
            </button>
          </div>

          <div class="hero-metrics">
            <span><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>${model.lights} ${model.lights === 1 ? 'luz' : 'luzes'}</span>
            <span><ha-icon icon="mdi:power-plug-outline"></ha-icon>${model.activeAppliances} ativos</span>
          </div>
        </div>
      </div>
    `;
  }

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
            data-path="${BrunoCozinhaSubview._escapeAttr(item.path || this._config.navigation_path)}"
            title="${BrunoCozinhaSubview._escapeAttr(item.name)}"
            aria-label="${BrunoCozinhaSubview._escapeAttr(item.name)}"
          >
            ${BrunoCozinhaSubview._roomNavIcon(item.key || item.icon)}
          </button>
        `).join('')}
      </nav>
    `;
  }

  _renderStatusRail(model) {
    const status = [
      { icon: 'mdi:lightbulb-on', value: `${model.lights} ${model.lights === 1 ? 'luz' : 'luzes'}`, label: `Cozinha ${model.kitchenLights} - Lavanderia ${model.laundryLights}`, tone: 'amber' },
      { icon: 'mdi:thermometer', value: 'Temperatura', label: this._temperatureLabel(), tone: 'amber' },
      { icon: 'mdi:dishwasher', value: 'Lava-loucas', label: model.dishwasher.label, tone: model.dishwasher.active ? 'blue' : 'neutral' },
      { icon: 'mdi:washing-machine', value: 'Lavadora', label: model.washer.status, tone: model.washer.active ? 'blue' : 'neutral' },
      { icon: 'mdi:home-lightning-bolt-outline', value: 'Eletrodomesticos', label: `${model.activeAppliances} ativos`, tone: model.activeAppliances ? 'amber' : 'neutral' },
    ];

    return `
      <div class="glass-card status-rail">
        ${status.map((item) => `
          <div class="status-item">
            <span class="micro-icon tone-${item.tone}"><ha-icon icon="${item.icon}"></ha-icon></span>
            <div>
              <strong>${BrunoCozinhaSubview._escape(item.value)}</strong>
              <span>${BrunoCozinhaSubview._escape(item.label)}</span>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }

  _renderLightZoneRail(lights) {
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
    const label = 'Cozinha';
    const ariaLabel = `${label}: ${activeCount} de ${total} luzes acesas.`;

    return `
      <aside
        class="lights-zone-rail${isOff ? ' is-off' : ''}${isFull ? ' is-full' : ''}"
        aria-label="${BrunoCozinhaSubview._escapeAttr(ariaLabel)}"
        title="${BrunoCozinhaSubview._escapeAttr(ariaLabel)}"
        data-zone="cozinha"
        data-dimmer-entity="${BrunoCozinhaSubview._escapeAttr(dimmerTarget?.entity || '')}"
        data-dimmer-level="${BrunoCozinhaSubview._escapeAttr(String(fillPercent))}"
        style="--rail-fill:${fillPercent}%; --rail-fill-ratio:${(fillPercent / 100).toFixed(3)}; --rail-glow:${isOff ? '0' : '1'}; --rail-ambient-height:${Math.max(22, fillPercent * 1.9)}px;"
      >
        <span class="rail-zone">${BrunoCozinhaSubview._escape(label)}</span>
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
    const entity = this._state(light.entity);
    const active = entity?.state === 'on';
    const disabled = !light.entity || light.placeholder;

    return `
      <button type="button" class="light-tile${active ? ' is-on' : ''}${disabled ? ' is-placeholder' : ''}" ${disabled ? 'disabled' : `data-action="toggle-light" data-entity="${BrunoCozinhaSubview._escapeAttr(light.entity)}"`}>
        <span class="light-icon">${BrunoCozinhaSubview._tplLightIcon(light.icon_type || light.icon, active)}</span>
        <strong>${BrunoCozinhaSubview._escape(light.name)}</strong>
        <small>${disabled ? 'Placeholder' : active ? 'Ligada' : 'Desligada'}</small>
      </button>
    `;
  }

  _renderLights() {
    const visibleLights = (this._config.entities.lights || []).slice(0, 4);
    return `
      <div class="glass-card lights-card cozinha-lights-card">
        <div class="module-head">
          <div>
            <div class="module-title">Luzes</div>
          </div>
          <div class="head-actions">
            <button type="button" class="chip-button is-active" data-action="lights-on">Todas acesas</button>
            <button type="button" class="chip-button" data-action="lights-off">Apagar todas</button>
          </div>
        </div>

        <div class="lights-body cozinha-lights-body">
          <div class="lights-single-grid cozinha-lights-grid">
            ${visibleLights.map((light) => this._renderLightTile(light)).join('')}
          </div>
          ${this._renderLightZoneRail(visibleLights)}
        </div>
      </div>
    `;
  }

  _renderWasher(model) {
    const washer = model.washer;
    const disabled = washer.configured && !washer.unavailable ? '' : 'disabled';
    const image = BrunoCozinhaSubview._escapeAttr(washer.image);

    return `
      <section class="glass-card washer-card">
        <div class="washer-head">
          <div class="washer-title">
            <span class="micro-icon tone-neutral"><ha-icon icon="mdi:washing-machine"></ha-icon></span>
            <div>
              <div class="module-title">${BrunoCozinhaSubview._escape(washer.title)}</div>
              <div class="module-state">${BrunoCozinhaSubview._escape(washer.status)}</div>
            </div>
          </div>
          <button type="button" class="washer-power${washer.active ? ' is-on' : ''}" data-action="toggle-appliance" data-entity="${BrunoCozinhaSubview._escapeAttr(washer.entityId || '')}" ${disabled} aria-label="Ligar lavadora">
            <ha-icon icon="mdi:power"></ha-icon>
          </button>
        </div>

        <div class="washer-image" data-image-wrapper>
          <img src="${image}" alt="" data-fallback-class="is-image-missing" loading="eager">
          <ha-icon icon="mdi:washing-machine"></ha-icon>
        </div>

        <div class="washer-info-panel">
          <div class="washer-info-row">
            <span><ha-icon icon="mdi:washing-machine"></ha-icon>Programa</span>
            <strong>${BrunoCozinhaSubview._escape(washer.program)}</strong>
          </div>
          <div class="washer-info-row">
            <span><ha-icon icon="mdi:calendar-clock"></ha-icon>Tempo restante</span>
            <strong>${BrunoCozinhaSubview._escape(washer.remaining)}</strong>
          </div>
          <div class="washer-info-row">
            <span><ha-icon icon="mdi:progress-clock"></ha-icon>Status</span>
            <strong class="washer-ready"><i></i>${BrunoCozinhaSubview._escape(washer.detailStatus)}</strong>
          </div>
        </div>

        <div class="washer-actions">
          <button type="button" ${disabled}><ha-icon icon="mdi:play-outline"></ha-icon><span>Iniciar</span></button>
          <button type="button" ${disabled}><ha-icon icon="mdi:pause"></ha-icon><span>Pausar</span></button>
          <button type="button" ${disabled}><ha-icon icon="mdi:tune-variant"></ha-icon><span>Opcoes</span></button>
        </div>
      </section>
    `;
  }

  _renderApplianceTile(item) {
    const disabled = item.configured ? '' : 'disabled';
    const image = BrunoCozinhaSubview._escapeAttr(item.image || '');
    const activeClass = item.active ? ' is-on' : '';
    const disabledClass = item.configured ? '' : ' is-disabled';

    return `
      <button
        type="button"
        class="appliance-tile${activeClass}${disabledClass}"
        data-action="toggle-appliance"
        data-entity="${BrunoCozinhaSubview._escapeAttr(item.entity || '')}"
        ${disabled}
      >
        <span class="appliance-corner"><ha-icon icon="${item.active ? 'mdi:power-plug' : 'mdi:power-plug-outline'}"></ha-icon></span>
        <span class="appliance-image" data-image-wrapper>
          ${image ? `<img src="${image}" alt="" data-fallback-class="is-image-missing" loading="eager">` : ''}
          <ha-icon icon="${BrunoCozinhaSubview._applianceIcon(item.key)}"></ha-icon>
        </span>
        <strong>${BrunoCozinhaSubview._escape(item.name)}</strong>
        <small>${BrunoCozinhaSubview._escape(item.label)}</small>
      </button>
    `;
  }

  _renderApplianceHub(model) {
    return `
      <section class="glass-card appliances-hub-card">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon tone-neutral"><ha-icon icon="mdi:home-lightning-bolt-outline"></ha-icon></span>
            <div>
              <div class="module-title">Eletrodomesticos</div>
              <div class="module-subtitle">Monitoramento gradual</div>
            </div>
          </div>
        </div>
        <div class="appliances-grid">
          ${model.appliances.map((item) => this._renderApplianceTile(item)).join('')}
        </div>
      </section>
    `;
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    globalThis.BrunoLiquidGlass?.apply?.();

    const appliances = (this._config.entities.appliances || []).map((item) => this._applianceModel(item));
    const model = {
      lights: this._activeLightsCount(),
      kitchenLights: this._activeLightsCount('cozinha'),
      laundryLights: this._activeLightsCount('lavanderia'),
      activeAppliances: appliances.filter((item) => item.active).length,
      dishwasher: this._dishwasherModel(),
      washer: this._washerModel(),
      appliances,
    };
    this._lastMinute = BrunoCozinhaSubview._clock();

    this.shadowRoot.innerHTML = `
      <style>${this._styles()}</style>
      <main class="cozinha-subview">
        ${this._renderRoomSidebar()}
        <section class="hero-panel">
          ${this._renderHero(model)}
        </section>
        ${this._renderStatusRail(model)}
        <section class="right-control-grid">
          ${this._renderLights(model)}
          ${this._renderWasher(model)}
        </section>
        ${this._renderApplianceHub(model)}
      </main>
    `;

    this.shadowRoot.removeEventListener('click', this._boundActionHandler);
    this.shadowRoot.addEventListener('click', this._boundActionHandler);
    this._bindImageFallbacks();
  }

  _styles() {
    return `
      :host {
        --office-gap: 10px;
        --office-radius: var(--bruno-liquid-card-radius, 18px);
        --office-radius-small: var(--bruno-liquid-card-radius-compact, 16px);
        --office-cell-radius: var(--bruno-liquid-cell-radius, 16px);
        --accent: var(--bruno-liquid-accent, 150, 190, 255);
        --accent-blue: 96,190,255;
        --accent-amber: 255,183,77;
        --text-main: rgba(245,250,255,0.96);
        --text-soft: rgba(255,255,255,0.58);
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

      button:disabled {
        cursor: default;
      }

      .cozinha-subview {
        --office-shell-height: min(734px, calc(100vh - 34px));
        --office-gap: 12px;
        width: 100%;
        min-height: 100vh;
        height: 100vh;
        display: grid;
        grid-template-columns: 56px minmax(420px, 540px) minmax(0, 1fr) minmax(292px, 0.55fr);
        grid-template-rows: 64px minmax(264px, 1fr) minmax(292px, 1fr);
        grid-template-areas:
          "frame-left hero status status"
          "frame-left hero lights washer"
          "frame-left appliances appliances washer";
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

      .room-sidebar { grid-area: frame-left; }
      .hero-panel { grid-area: hero; }
      .status-rail { grid-area: status; }
      .lights-card { grid-area: lights; }
      .washer-card { grid-area: washer; }
      .appliances-hub-card { grid-area: appliances; }

      .right-control-grid {
        display: contents;
      }

      .hero-panel,
      .status-rail,
      .lights-card,
      .washer-card,
      .appliances-hub-card {
        min-width: 0;
        min-height: 0;
      }

      .room-sidebar {
        position: relative;
        z-index: 3;
        isolation: isolate;
        align-self: center;
        justify-self: center;
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

      .room-nav-button.has-divider {
        margin-bottom: 9px;
      }

      .room-nav-button ha-icon {
        --mdc-icon-size: 19px;
      }

      .glass-card,
      .hero-stage {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        border-radius: var(--office-radius);
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
      }

      .glass-card::before,
      .hero-stage::before {
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

      .glass-card > *,
      .hero-stage > * {
        position: relative;
        z-index: 1;
      }

      .hero-stage {
        isolation: isolate;
        overflow: visible;
        width: 100%;
        height: 100%;
        min-height: 0;
        border-radius: 0;
        background: transparent;
        border: 0;
        box-shadow: none;
        backdrop-filter: none;
        -webkit-backdrop-filter: none;
      }

      .hero-stage::before {
        display: none;
      }

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

      .hero-content {
        position: relative;
        z-index: 1;
        height: 100%;
        display: grid;
        grid-template-columns: 1fr auto;
        grid-template-rows: auto minmax(0, 1fr) auto;
        padding: 15px 18px 14px;
        gap: 8px;
      }

      .hero-top {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .back-button {
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

      .back-button ha-icon { --mdc-icon-size: 18px; }

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
        display: grid;
        margin-top: 12px;
        gap: 0;
        justify-items: start;
      }

      .hero-date-line {
        margin: 0 0 6px;
        color: rgba(255,255,255,0.54);
        font-size: 11px;
        line-height: 1;
        font-weight: 700;
        text-transform: uppercase;
      }

      .hero-clock {
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

      .hero-metrics {
        grid-column: 1 / -1;
        grid-row: 3;
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .hero-metrics span,
      .chip-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        min-height: 30px;
        padding: 0 12px;
        border-radius: 999px;
        font-size: 11px;
        font-weight: 850;
        color: rgba(255,255,255,0.86);
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.14);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 24px rgba(0,0,0,0.20);
        white-space: nowrap;
      }

      .hero-metrics ha-icon {
        --mdc-icon-size: 15px;
        color: rgb(255,205,95);
      }

      .status-rail {
        display: grid;
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
      }

      .status-item span:not(.micro-icon) {
        display: block;
        margin-top: 4px;
        font-size: 10px;
        line-height: 1;
        color: var(--text-soft);
      }

      .micro-icon {
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: inline-grid;
        place-items: center;
        flex: 0 0 auto;
        color: rgba(210,225,240,0.82);
        background: rgba(255,255,255,0.08);
        border: 1px solid rgba(255,255,255,0.13);
      }

      .micro-icon ha-icon {
        --mdc-icon-size: 17px;
      }

      .micro-icon.tone-amber {
        color: rgb(255,183,77);
        background: rgba(255,183,77,0.10);
        border-color: rgba(255,183,77,0.22);
      }

      .micro-icon.tone-blue {
        color: rgb(var(--accent-blue));
        background: rgba(var(--accent-blue),0.10);
        border-color: rgba(var(--accent-blue),0.24);
      }

      .micro-icon.tone-neutral {
        color: rgba(210,225,240,0.72);
      }

      .lights-card,
      .appliances-hub-card {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 8px;
        padding: 14px;
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
        min-height: 40px;
        align-items: start;
        margin-bottom: 0;
      }

      .head-actions,
      .title-with-chip {
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
      }

      .chip-button {
        min-width: 52px;
      }

      .head-actions .chip-button {
        min-height: 34px;
        padding: 0 14px;
      }

      .chip-button.is-active {
        background: rgba(24,134,190,0.36);
        border-color: rgba(96,190,255,0.46);
      }

      .lights-body {
        position: relative;
        z-index: 1;
        min-width: 0;
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-columns: minmax(0, 1fr) 60px;
        gap: 10px;
      }

      .lights-single-grid {
        min-width: 0;
        min-height: 0;
        height: 100%;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-template-rows: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .light-tile {
        position: relative;
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: 60px minmax(0, 1fr);
        grid-template-rows: auto auto;
        grid-template-areas:
          "icon title"
          "icon status";
        align-items: center;
        align-content: center;
        column-gap: 11px;
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

      .light-tile.is-placeholder {
        opacity: 0.58;
      }

      .light-icon {
        grid-area: icon;
        width: 52px;
        height: 52px;
        display: grid;
        place-items: center;
        justify-self: center;
        --light-color: var(--state-icon-color, #9da0a2);
        color: rgba(255,255,255,0.74);
      }

      .light-tile.is-on .light-icon {
        --light-color: var(--state-icon-active-color, #f0c040);
        color: rgb(255,210,86);
        filter: drop-shadow(0 0 10px rgba(255,183,77,0.34));
      }

      .light-tile strong {
        grid-area: title;
        min-width: 0;
        font-size: 13px;
        line-height: 1.1;
        font-weight: 850;
        color: rgba(255,255,255,0.88);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .light-tile small {
        grid-area: status;
        font-size: 11px;
        line-height: 1;
        font-weight: 800;
        color: rgb(255,205,95);
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
        position: relative;
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

      .rail-fill {
        position: absolute;
        left: 5px;
        right: 5px;
        bottom: 5px;
        height: calc((100% - 10px) * var(--rail-fill-ratio, 0));
        min-height: calc(24px * var(--rail-glow, 0));
        border-radius: inherit;
        background:
          radial-gradient(circle at 40% 12%, rgba(255,255,255,0.95), transparent 20%),
          linear-gradient(180deg, #fff6c9 0%, #ffe18a 24%, #ffc247 58%, #ff9f1f 100%);
        box-shadow:
          0 0 calc(16px * var(--rail-glow, 0)) rgba(255,226,138,0.70),
          0 0 calc(34px * var(--rail-glow, 0)) rgba(255,184,61,0.44),
          0 0 calc(64px * var(--rail-glow, 0)) rgba(255,145,31,0.25);
        opacity: var(--rail-glow, 0);
      }

      .rail-fill::before {
        content: "";
        position: absolute;
        top: 0;
        left: 6px;
        right: 6px;
        height: 32%;
        border-radius: inherit;
        background: linear-gradient(180deg, rgba(255,255,255,0.62), transparent);
        opacity: 0.58;
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
      }

      .rail-dimmer-ghost {
        position: absolute;
        inset: 7px;
        border-radius: inherit;
        border: 1px dashed rgba(255,255,255,0.12);
        opacity: 0;
        pointer-events: none;
      }

      .washer-card {
        display: grid;
        grid-template-rows: auto minmax(0, 1fr) auto auto;
        gap: 12px;
        padding: 18px;
      }

      .washer-head,
      .washer-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }

      .washer-title {
        justify-content: flex-start;
        min-width: 0;
      }

      .module-state {
        margin-top: 5px;
        font-size: 12px;
        font-weight: 850;
        color: rgb(36,220,128);
      }

      .washer-power {
        width: 48px;
        height: 48px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: rgba(255,255,255,0.88);
        background:
          radial-gradient(circle at 50% 16%, rgba(116,165,255,0.44), transparent 70%),
          rgba(56,110,190,0.34);
        border: 1px solid rgba(116,165,255,0.42);
        box-shadow: 0 0 26px rgba(96,165,250,0.18), inset 0 1px 0 rgba(255,255,255,0.20);
      }

      .washer-power:disabled {
        opacity: 0.48;
      }

      .washer-power ha-icon {
        --mdc-icon-size: 22px;
      }

      .washer-image {
        min-width: 0;
        min-height: 0;
        display: grid;
        place-items: center;
        padding: 2px 12px 0;
      }

      .washer-image img {
        width: min(94%, 330px);
        height: min(100%, 330px);
        object-fit: contain;
        filter: drop-shadow(0 22px 26px rgba(0,0,0,0.46));
      }

      .washer-image > ha-icon,
      .appliance-image > ha-icon {
        display: none;
        --mdc-icon-size: 74px;
        color: rgba(255,255,255,0.38);
      }

      .washer-image.is-image-missing > ha-icon,
      .appliance-image.is-image-missing > ha-icon {
        display: block;
      }

      .washer-info-panel {
        display: grid;
        gap: 0;
        padding: 10px 12px;
        border-radius: 16px;
        border: 1px solid rgba(255,255,255,0.10);
        background: rgba(255,255,255,0.045);
      }

      .washer-info-row {
        min-height: 37px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        border-bottom: 1px solid rgba(255,255,255,0.075);
      }

      .washer-info-row:last-child {
        border-bottom: 0;
      }

      .washer-info-row span,
      .washer-info-row strong {
        min-width: 0;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        font-size: 12px;
        font-weight: 760;
      }

      .washer-info-row span {
        color: rgba(255,255,255,0.58);
      }

      .washer-info-row ha-icon {
        --mdc-icon-size: 15px;
        color: rgba(255,255,255,0.48);
      }

      .washer-ready i {
        width: 6px;
        height: 6px;
        border-radius: 50%;
        background: rgb(36,220,128);
      }

      .washer-actions {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
      }

      .washer-actions button {
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 18px;
        border: 1px solid rgba(255,255,255,0.12);
        background:
          radial-gradient(90px 54px at 50% 0%, rgba(255,255,255,0.14), transparent 72%),
          rgba(255,255,255,0.060);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.11);
        color: rgba(255,255,255,0.82);
        font-size: 12px;
        font-weight: 820;
      }

      .washer-actions button:disabled {
        opacity: 0.50;
      }

      .washer-actions ha-icon {
        --mdc-icon-size: 18px;
      }

      .appliances-grid {
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 14px;
      }

      .appliance-tile {
        position: relative;
        min-width: 0;
        min-height: 0;
        display: grid;
        grid-template-rows: minmax(0, 1fr) auto auto auto;
        justify-items: center;
        align-items: center;
        gap: 5px;
        padding: 18px 12px 15px;
        border-radius: 20px;
        border: 1px solid rgba(255,255,255,0.12);
        background:
          radial-gradient(170px 140px at 50% -10%, rgba(255,255,255,0.17), transparent 70%),
          rgba(255,255,255,0.042);
        box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
      }

      .appliance-tile strong {
        width: 100%;
        min-width: 0;
        text-align: center;
        font-size: 14px;
        line-height: 1.05;
        font-weight: 850;
        color: rgba(255,255,255,0.92);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .appliance-tile small {
        width: 100%;
        text-align: center;
        font-size: 11px;
        line-height: 1;
        font-weight: 800;
        color: rgb(255,205,95);
      }

      .appliance-tile.is-on {
        border-color: rgba(var(--accent),0.46);
        background:
          radial-gradient(180px 130px at 50% 8%, rgba(var(--accent),0.18), transparent 72%),
          rgba(var(--accent),0.055);
      }

      .appliance-tile.is-disabled {
        opacity: 0.58;
      }

      .appliance-corner {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 28px;
        height: 28px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        color: rgba(var(--accent),0.90);
        background: rgba(var(--accent),0.11);
        border: 1px solid rgba(var(--accent),0.32);
      }

      .appliance-corner ha-icon {
        --mdc-icon-size: 15px;
      }

      .appliance-image {
        width: 100%;
        min-height: 104px;
        display: grid;
        place-items: center;
      }

      .appliance-image img {
        max-width: 74%;
        max-height: 112px;
        object-fit: contain;
        filter: drop-shadow(0 16px 18px rgba(0,0,0,0.44));
      }

      .tpl-light-icon {
        position: relative;
        width: 100%;
        height: 100%;
        display: block;
        color: var(--light-color, #9da0a2);
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
        fill: var(--light-color, #9da0a2);
      }

      .tpl-light-icon.is-on {
        color: rgb(255,210,86);
      }

      .tpl-light-icon.is-on .light-color {
        fill: rgb(255,210,86);
      }

      .tpl-light-glow {
        position: absolute;
        inset: 8px;
        border-radius: 50%;
        background: radial-gradient(circle, rgba(var(--accent),0.28), transparent 68%);
        filter: blur(8px);
      }

      @media (max-width: 1100px) {
        .cozinha-subview {
          grid-template-columns: 52px minmax(0, 1fr);
          grid-template-rows: auto auto auto auto auto;
          grid-template-areas:
            "frame-left hero"
            "frame-left status"
            "frame-left lights"
            "frame-left washer"
            "frame-left appliances";
          overflow-y: auto;
        }

        .status-rail,
        .appliances-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
    `;
  }

  static _applianceIcon(key) {
    const icons = {
      dishwasher: 'mdi:dishwasher',
      airfryer: 'mdi:pot-steam-outline',
      fridge: 'mdi:fridge-outline',
      microwave: 'mdi:microwave',
      washer: 'mdi:washing-machine',
    };
    return icons[key] || 'mdi:power-plug-outline';
  }

  static _tplLightIcon(type, active = false) {
    const name = String(type || '').replace(/^mdi:/, '').replace(/[^a-z0-9_-]/gi, '') || 'light_flush';
    const glow = active ? '<span class="tpl-light-glow" aria-hidden="true"></span>' : '';
    const icons = {
      ledstrip: `
        <svg viewBox="0 0 32 32" aria-hidden="true">
          <path class="light-color" d="M8.4395,16.668 C8.9795,16.552 9.5115,16.895 9.6285,17.435 C9.7455,17.974 9.4025,18.506 8.8625,18.623 C8.3225,18.74 7.7905,18.397 7.6735,17.857 C7.5565,17.317 7.9005,16.785 8.4395,16.668 M13.3275,15.611 C13.8665,15.495 14.3985,15.838 14.5155,16.377 C14.6325,16.917 14.2895,17.449 13.7505,17.566 C13.2105,17.683 12.6775,17.34 12.5605,16.8 C12.4445,16.261 12.7875,15.729 13.3275,15.611 M18.2135,14.555 C18.7535,14.438 19.2865,14.781 19.4025,15.32 C19.5195,15.86 19.1765,16.393 18.6365,16.51 C18.0965,16.626 17.5645,16.283 17.4485,15.743 C17.3315,15.203 17.6735,14.671 18.2135,14.555 M23.1005,13.498 C23.6405,13.381 24.1725,13.724 24.2905,14.264 C24.4065,14.804 24.0635,15.336 23.5235,15.453 C22.9835,15.569 22.4515,15.227 22.3355,14.687 C22.2175,14.147 22.5615,13.614 23.1005,13.498 M10.6695,20.639 L25.4735,17.444 C26.5535,17.211 27.2405,16.147 27.0065,15.067 C26.4495,12.484 23.9035,10.842 21.3205,11.399 L6.5165,14.594 C5.4365,14.827 4.7505,15.891 4.9835,16.971 C5.5415,19.554 8.0865,21.196 10.6695,20.639 M25,26 C24.447,26 24,25.553 24,25 C24,24.447 24.447,24 25,24 C25.553,24 26,24.447 26,25 C26,25.553 25.553,26 25,26 M20,26 C19.447,26 19,25.553 19,25 C19,24.447 19.447,24 20,24 C20.553,24 21,24.447 21,25 C21,25.553 20.553,26 20,26 M15,26 C14.447,26 14,25.553 14,25 C14,24.447 14.447,24 15,24 C15.553,24 16,24.447 16,25 C16,25.553 15.553,26 15,26 M10,26 C9.447,26 9,25.553 9,25 C9,24.447 9.447,24 10,24 C10.553,24 11,24.447 11,25 C11,25.553 10.553,26 10,26 M27,22 L9,22 C5,22 4,19 4,18 L4,23 C4,25.762 6.238,28 9,28 L27,28 C27.553,28 28,27.553 28,27 L28,23 C28,22.447 27.553,22 27,22 M22,8 C21.447,8 21,7.553 21,7 C21,6.447 21.447,6 22,6 C22.553,6 23,6.447 23,7 C23,7.553 22.553,8 22,8 M17,8 C16.447,8 16,7.553 16,7 C16,6.447 16.447,6 17,6 C17.553,6 18,6.447 18,7 C18,7.553 17.553,8 17,8 M12,8 C11.447,8 11,7.553 11,7 C11,6.447 11.447,6 12,6 C12.553,6 13,6.447 13,7 C13,7.553 12.553,8 12,8 M7,8 C6.447,8 6,7.553 6,7 C6,6.447 6.447,6 7,6 C7.553,6 8,6.447 8,7 C8,7.553 7.553,8 7,8 M23,4 L5,4 C4.447,4 4,4.447 4,5 L4,9 C4,9.553 4.447,10 5,10 L23,10 C27,10 28,13 28,14 L28,9 C28,6.238 25.762,4 23,4"/>
        </svg>
      `,
      pendant: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <path fill="none" stroke="#a0a0a0" stroke-width="2.8" stroke-linecap="round" d="M25 4v17"/>
          <path fill="#9da0a2" opacity="0.86" d="M22.7 18.2h4.8c1.2 0 2.1 1 2.1 2.2v5.8c0 1.2-.9 2.2-2.1 2.2h-4.8c-1.2 0-2.1-1-2.1-2.2v-5.8c0-1.2.9-2.2 2.1-2.2z"/>
          <path class="light-color" d="M9.1 34.4c-.2-7.3 7.2-14.1 15.9-14.1s16.1 6.8 15.9 14.1c-.1 4.9-2.5 5.5-8.8 5.7-4 .1-10.6.1-14.8 0-5.8-.1-8-.9-8.2-5.7z"/>
        </svg>
      `,
      light_flush: `
        <svg viewBox="0 0 50 50" aria-hidden="true">
          <path class="light-color" d="M25.243 17.913C15.653 17.809 8.131 21.052 7.733 25C7.315 29.148 16.07 32.922 25.452 32.922C34.834 32.922 43.112 28.716 42.336 25.07C41.622 21.715 34.903 18.087 25.243 17.913ZM25.417 30.866C16.78 30.771 12.541 27.226 13.405 24.828C13.791 23.847 15.401 21.415 22.459 20.58C26.249 20.248 27.413 20.489 29.761 21.022C36.964 22.661 36.752 25.989 36.752 25.989C36.301 29.257 30.348 30.939 25.418 30.867Z"/>
          <path fill="#707070" d="M42.316 25.012C41.603 23.019 40.277 22.207 40.277 22.207C36.714 19.347 31.883 18.661 28.947 18.224C25.505 17.712 21.478 18.057 21.478 18.057C15.227 18.68 12.928 19.952 10.795 21.096C10.795 21.096 8.371 23.11 7.808 24.606C7.808 24.606 8.205 22.474 8.531 21.871C9.048 20.912 10.53 19.862 11.002 19.572C16.034 17.047 19.435 16.678 23.652 16.585C24.911 16.557 26.971 16.634 26.971 16.634C31.712 16.954 33.768 17.631 36.597 18.675C36.597 18.675 39.671 20.146 40.678 21.183C41.125 21.643 41.752 22.321 41.956 22.929C42.111 23.459 42.266 24.473 42.316 25.012Z"/>
        </svg>
      `,
    };

    return `<span class="tpl-light-icon icon-${name}${active ? ' is-on' : ''}">${glow}${icons[name] || icons.light_flush}</span>`;
  }

  static _clock() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoCozinhaSubview._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_COZINHA_SUBVIEW_TAG)) {
  customElements.define(BRUNO_COZINHA_SUBVIEW_TAG, BrunoCozinhaSubview);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_COZINHA_SUBVIEW_TAG,
  name: 'Bruno Cozinha Subview',
  description: 'Kitchen subview aligned with the shared room geometry.',
});
