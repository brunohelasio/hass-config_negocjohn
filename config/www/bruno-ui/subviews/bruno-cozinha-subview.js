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
    room_group: 'light.grupo_luzes_cozinha',
    lights: [
      { entity: 'light.cozinha_switch_2', name: 'Luz principal 1', icon: 'mdi:led-strip-variant' },
      { entity: 'light.cozinha_switch_3', name: 'Luz principal 2', icon: 'mdi:led-strip-variant' },
      { entity: 'light.cozinha_switch_1', name: 'Lavanderia', icon: 'mdi:ceiling-light' },
    ],
    appliances: [
      { key: 'washer', name: 'Lava-roupas', icon: 'mdi:washing-machine', entity: '', placeholder: true },
      { key: 'dishwasher', name: 'Lava-loucas', icon: 'mdi:dishwasher', entity: 'switch.cz_tomada_maq_lav_louca_socket_1' },
      { key: 'airfryer', name: 'Airfryer', icon: 'mdi:pot-steam-outline', entity: '', placeholder: true },
      { key: 'fridge', name: 'Geladeira', icon: 'mdi:fridge-outline', entity: '', placeholder: true },
      { key: 'microwave', name: 'Micro-ondas', icon: 'mdi:microwave', entity: '', placeholder: true },
    ],
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
    if (!this._clockTimer) {
      this._clockTimer = window.setInterval(this._boundClock, 1000);
    }
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
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 6;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isUnavailable(entity) {
    return !entity || BRUNO_COZINHA_SUBVIEW_OFF_STATES.includes(String(entity.state || '').toLowerCase());
  }

  _activeLights() {
    return (this._config.entities.lights || []).filter((light) => this._state(light.entity)?.state === 'on');
  }

  _applianceModel(item) {
    const entity = this._state(item.entity);
    const available = Boolean(item.entity) && !this._isUnavailable(entity);
    const active = available && entity?.state === 'on';
    return {
      ...item,
      available,
      active,
      state: item.placeholder || !item.entity ? 'Em breve' : (active ? 'Ligado' : 'Desligado'),
    };
  }

  _sceneLabel() {
    const active = this._state(this._config.entities.active_sensor);
    const state = String(active?.state || '').toLowerCase();
    const appliances = (this._config.entities.appliances || []).map((item) => this._applianceModel(item));
    const running = appliances.find((item) => item.active);
    if (running) return `${running.name} ativa`;
    if (this._activeLights().length) return 'Cozinha iluminada';
    if (state && !BRUNO_COZINHA_SUBVIEW_OFF_STATES.includes(state)) return 'Cozinha em uso';
    return 'Cozinha em repouso';
  }

  _dateLine() {
    const date = new Date();
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'short',
    }).replace('.', '').toUpperCase();
  }

  _navigate(path) {
    if (!path) return;
    const normalized = String(path).startsWith('/') ? String(path) : `/dashboard-negocjohn/${path}`;
    if (globalThis.location?.pathname === normalized) return;
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: normalized },
      bubbles: true,
      composed: true,
    }));
  }

  _callService(service, data = {}) {
    if (!service || !this._hass) return;
    const [domain, action] = service.split('.');
    if (!domain || !action) return;
    this._hass.callService(domain, action, data);
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _handleAction(event) {
    const target = event.target?.closest?.('[data-action]');
    if (!target) return;
    event.preventDefault();
    event.stopPropagation();

    const action = target.dataset.action;
    const entityId = target.dataset.entity;

    if (action === 'navigate') this._navigate(target.dataset.path || this._config.navigation_path);
    if (action === 'lights-on') this._callService('light.turn_on', { entity_id: this._config.entities.room_group });
    if (action === 'lights-off') this._callService('light.turn_off', { entity_id: this._config.entities.room_group });
    if (action === 'toggle-light') this._callService('homeassistant.toggle', { entity_id: entityId });
    if (action === 'toggle-appliance') this._callService('homeassistant.toggle', { entity_id: entityId });
    if (action === 'more-info') this._moreInfo(entityId);
  }

  _renderSidebar() {
    return `
      <nav class="room-sidebar" aria-label="Navegacao de comodos">
        ${(this._config.room_nav || []).map((item) => `
          <button
            type="button"
            class="nav-button${item.active ? ' is-active' : ''}${item.divider_after ? ' has-divider' : ''}"
            data-action="navigate"
            data-path="${BrunoCozinhaSubview._escapeAttr(item.path)}"
            title="${BrunoCozinhaSubview._escapeAttr(item.name)}"
            aria-label="${BrunoCozinhaSubview._escapeAttr(item.name)}"
          >
            <ha-icon icon="${BrunoCozinhaSubview._escapeAttr(item.icon)}"></ha-icon>
          </button>
        `).join('')}
      </nav>
    `;
  }

  _renderHero() {
    const title = BrunoCozinhaSubview._escape(this._config.title);
    const subtitle = BrunoCozinhaSubview._escape(this._config.subtitle);
    const background = BrunoCozinhaSubview._escapeAttr(this._config.background);
    const fallbackBackground = BrunoCozinhaSubview._escapeAttr(this._config.fallback_background || this._config.background);
    const lightsCount = this._activeLights().length;
    const appliances = (this._config.entities.appliances || []).map((item) => this._applianceModel(item));
    const activeAppliances = appliances.filter((item) => item.active).length;

    return `
      <section class="hero-stage">
        <div class="hero-bg" style="--hero-image:url('${background}'); --hero-fallback-image:url('${fallbackBackground}');" aria-hidden="true"></div>
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
              <span>${BrunoCozinhaSubview._escape(this._sceneLabel())}</span>
            </button>
          </div>

          <div class="hero-metrics">
            <span><ha-icon icon="mdi:lightbulb-on-outline"></ha-icon>${lightsCount} ${lightsCount === 1 ? 'luz' : 'luzes'}</span>
            <span><ha-icon icon="mdi:power-plug-outline"></ha-icon>${activeAppliances} ativos</span>
          </div>
        </div>
      </section>
    `;
  }

  _renderLights() {
    const lights = this._config.entities.lights || [];
    const activeCount = this._activeLights().length;
    return `
      <section class="glass-card lights-card">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:lightbulb-group-outline"></ha-icon></span>
            <div>
              <div class="module-title">Luzes</div>
              <div class="module-subtitle">${activeCount} de ${lights.length} acesas</div>
            </div>
          </div>
          <div class="head-actions">
            <button type="button" class="chip-button is-active" data-action="lights-on">Todas acesas</button>
            <button type="button" class="chip-button" data-action="lights-off">Apagar todas</button>
          </div>
        </div>
        <div class="lights-grid">
          ${lights.map((light) => {
            const active = this._state(light.entity)?.state === 'on';
            return `
              <button type="button" class="light-tile${active ? ' is-on' : ''}" data-action="toggle-light" data-entity="${BrunoCozinhaSubview._escapeAttr(light.entity)}">
                <span class="tile-icon"><ha-icon icon="${BrunoCozinhaSubview._escapeAttr(light.icon || 'mdi:lightbulb')}"></ha-icon></span>
                <strong>${BrunoCozinhaSubview._escape(light.name)}</strong>
                <small>${active ? 'Acesa' : 'Desligada'}</small>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  _renderAppliances() {
    const appliances = (this._config.entities.appliances || []).map((item) => this._applianceModel(item));
    return `
      <section class="glass-card appliances-card">
        <div class="module-head">
          <div class="title-with-chip">
            <span class="micro-icon"><ha-icon icon="mdi:countertop"></ha-icon></span>
            <div>
              <div class="module-title">Eletrodomesticos</div>
              <div class="module-subtitle">Monitoramento gradual</div>
            </div>
          </div>
        </div>
        <div class="appliance-grid">
          ${appliances.map((item) => `
            <button
              type="button"
              class="appliance-tile${item.active ? ' is-on' : ''}${item.placeholder || !item.entity ? ' is-placeholder' : ''}"
              ${item.entity ? `data-action="toggle-appliance" data-entity="${BrunoCozinhaSubview._escapeAttr(item.entity)}"` : 'disabled'}
            >
              <span class="tile-icon"><ha-icon icon="${BrunoCozinhaSubview._escapeAttr(item.icon || 'mdi:power-plug-outline')}"></ha-icon></span>
              <strong>${BrunoCozinhaSubview._escape(item.name)}</strong>
              <small>${BrunoCozinhaSubview._escape(item.state)}</small>
            </button>
          `).join('')}
        </div>
      </section>
    `;
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (!this._config) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: 22px;
          --cell-radius: 16px;
          --accent: 245, 190, 90;
          display: block;
          width: 100%;
          min-height: 100vh;
          color: rgba(248,250,252,0.95);
          font-family: var(--paper-font-body1_-_font-family, inherit);
        }

        * { box-sizing: border-box; letter-spacing: 0; }
        button { font: inherit; color: inherit; cursor: pointer; -webkit-tap-highlight-color: transparent; }
        button:disabled { cursor: default; }

        .page {
          min-height: 100vh;
          display: grid;
          grid-template-columns: 70px minmax(0, 1fr);
          gap: 14px;
          padding: 10px 12px 12px;
          background:
            radial-gradient(900px 420px at 18% 0%, rgba(255,255,255,0.10), transparent 62%),
            linear-gradient(145deg, #05070b 0%, #10141d 54%, #05070b 100%);
        }

        .room-sidebar {
          position: sticky;
          top: 10px;
          align-self: start;
          min-height: calc(100vh - 22px);
          display: grid;
          align-content: start;
          gap: 8px;
          padding: 10px 7px;
          border-radius: 22px;
          background: rgba(15,18,26,0.50);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 18px 40px rgba(0,0,0,0.22);
          backdrop-filter: blur(24px) saturate(1.3);
          -webkit-backdrop-filter: blur(24px) saturate(1.3);
        }

        .nav-button {
          width: 52px;
          height: 52px;
          display: grid;
          place-items: center;
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: 17px;
          background: rgba(255,255,255,0.052);
          color: rgba(255,255,255,0.66);
        }

        .nav-button ha-icon { --mdc-icon-size: 22px; }
        .nav-button.is-active {
          color: rgba(255,231,174,0.98);
          border-color: rgba(var(--accent),0.52);
          background:
            radial-gradient(48px 42px at 50% 14%, rgba(var(--accent),0.26), transparent 72%),
            rgba(255,255,255,0.07);
          box-shadow: 0 0 24px rgba(var(--accent),0.14);
        }

        .nav-button.has-divider { margin-bottom: 10px; }

        .main {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.28fr);
          grid-template-rows: minmax(280px, 42vh) minmax(260px, 1fr);
          grid-template-areas:
            "hero hero"
            "lights appliances";
          gap: 14px;
        }

        .glass-card,
        .hero-stage {
          position: relative;
          overflow: hidden;
          border-radius: var(--card-radius);
          border: 1px solid rgba(255,255,255,0.13);
          background:
            radial-gradient(210px 160px at 12% -10%, rgba(255,255,255,0.18), transparent 68%),
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.038)),
            rgba(12,15,22,0.56);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), 0 18px 44px rgba(0,0,0,0.24);
          backdrop-filter: blur(28px) saturate(1.36);
          -webkit-backdrop-filter: blur(28px) saturate(1.36);
        }

        .hero-stage { grid-area: hero; min-height: 0; }
        .hero-bg {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(90deg, rgba(4,7,12,0.72), rgba(4,7,12,0.28) 42%, rgba(4,7,12,0.18)),
            var(--hero-image),
            var(--hero-fallback-image);
          background-size: cover;
          background-position: center;
          transform: scale(1.01);
        }

        .hero-content {
          position: relative;
          z-index: 1;
          height: 100%;
          display: grid;
          grid-template-rows: auto 1fr auto;
          padding: 16px;
        }

        .hero-top {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .back-button {
          width: 42px;
          height: 42px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.22);
          background: rgba(255,255,255,0.10);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.18);
        }

        .hero-title,
        .module-title {
          font-size: 14px;
          line-height: 1;
          font-weight: 850;
          color: rgba(255,255,255,0.96);
        }

        .hero-subtitle,
        .module-subtitle {
          margin-top: 4px;
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.58);
        }

        .hero-headline {
          align-self: center;
          display: grid;
          gap: 8px;
          justify-items: start;
        }

        .hero-date-line {
          margin: 0;
          font-size: 11px;
          font-weight: 850;
          color: rgba(255,255,255,0.54);
        }

        .hero-clock {
          font-size: 68px;
          line-height: 0.94;
          font-weight: 300;
          color: rgba(255,255,255,0.98);
        }

        .scene-pill,
        .hero-metrics span,
        .chip-button {
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.075);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12);
          backdrop-filter: blur(18px) saturate(1.24);
          -webkit-backdrop-filter: blur(18px) saturate(1.24);
        }

        .scene-pill {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 12px;
          color: rgba(255,255,255,0.86);
          font-size: 11px;
          font-weight: 800;
        }

        .scene-pill ha-icon { --mdc-icon-size: 16px; color: rgb(var(--accent)); }

        .hero-metrics {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .hero-metrics span {
          min-height: 30px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 11px;
          font-size: 11px;
          font-weight: 780;
          color: rgba(255,255,255,0.76);
        }

        .hero-metrics ha-icon { --mdc-icon-size: 15px; color: rgb(var(--accent)); }

        .lights-card,
        .appliances-card {
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 12px;
          padding: 14px;
        }

        .lights-card { grid-area: lights; }
        .appliances-card { grid-area: appliances; }

        .module-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          min-height: 36px;
        }

        .title-with-chip {
          display: flex;
          align-items: center;
          gap: 9px;
          min-width: 0;
        }

        .micro-icon {
          width: 30px;
          height: 30px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.13);
        }

        .micro-icon ha-icon { --mdc-icon-size: 17px; color: rgba(255,255,255,0.72); }

        .head-actions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .chip-button {
          min-height: 32px;
          padding: 0 14px;
          font-size: 11px;
          font-weight: 820;
          color: rgba(255,255,255,0.75);
        }

        .chip-button.is-active {
          color: rgb(var(--accent));
          border-color: rgba(var(--accent),0.44);
          background: rgba(var(--accent),0.12);
        }

        .lights-grid {
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 10px;
        }

        .appliance-grid {
          min-height: 0;
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 10px;
        }

        .light-tile,
        .appliance-tile {
          position: relative;
          min-width: 0;
          min-height: 118px;
          display: grid;
          grid-template-rows: 48px auto auto;
          align-content: center;
          justify-items: start;
          gap: 8px;
          padding: 16px;
          text-align: left;
          border-radius: var(--cell-radius);
          border: 1px solid rgba(255,255,255,0.11);
          background: rgba(255,255,255,0.055);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .light-tile.is-on,
        .appliance-tile.is-on {
          border-color: rgba(var(--accent),0.44);
          background:
            radial-gradient(92px 56px at 18% 14%, rgba(255,255,255,0.22), transparent 72%),
            radial-gradient(110px 68px at 94% 82%, rgba(var(--accent),0.22), transparent 72%),
            rgba(255,255,255,0.070);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.16), 0 0 22px rgba(var(--accent),0.15);
        }

        .appliance-tile.is-placeholder {
          opacity: 0.52;
        }

        .tile-icon {
          width: 48px;
          height: 48px;
          display: grid;
          place-items: center;
          border-radius: 15px;
          color: rgba(255,255,255,0.76);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.12);
        }

        .is-on .tile-icon {
          color: rgb(var(--accent));
          border-color: rgba(var(--accent),0.36);
          background: rgba(var(--accent),0.12);
        }

        .tile-icon ha-icon { --mdc-icon-size: 25px; }

        .light-tile strong,
        .appliance-tile strong {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 13px;
          line-height: 1.08;
          font-weight: 820;
          color: rgba(255,255,255,0.92);
        }

        .light-tile small,
        .appliance-tile small {
          font-size: 11px;
          line-height: 1;
          font-weight: 780;
          color: rgba(255,204,117,0.78);
        }

        @media (max-width: 900px) {
          .page {
            grid-template-columns: 1fr;
            padding: 8px;
          }
          .room-sidebar {
            position: relative;
            min-height: 0;
            grid-auto-flow: column;
            grid-auto-columns: 48px;
            overflow-x: auto;
          }
          .nav-button { width: 48px; height: 48px; }
          .main {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            grid-template-areas:
              "hero"
              "lights"
              "appliances";
          }
          .hero-stage { min-height: 280px; }
          .appliance-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .lights-grid { grid-template-columns: 1fr; }
        }
      </style>

      <div class="page">
        ${this._renderSidebar()}
        <main class="main">
          ${this._renderHero()}
          ${this._renderLights()}
          ${this._renderAppliances()}
        </main>
      </div>
    `;

    this.shadowRoot.removeEventListener('click', this._boundActionHandler);
    this.shadowRoot.addEventListener('click', this._boundActionHandler);
  }

  static _clock() {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
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
  description: 'Kitchen subview with hero, lights, and appliance placeholders.',
});
