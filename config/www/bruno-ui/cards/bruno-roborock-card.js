const BRUNO_ROBOROCK_CARD_TAG = 'bruno-roborock-card';

const BRUNO_ROBOROCK_DEFAULT_ENTITIES = {
  vacuum: 'vacuum.roborock_s7',
  room: 'sensor.roborock_s7_comodo_atual',
  battery: ['sensor.roborock_s7_bateria', 'sensor.roborock_s7_battery'],
  area: ['sensor.roborock_s7_area_limpa', 'sensor.roborock_s7_cleaning_area'],
  cleaning_time: ['sensor.roborock_s7_tempo_de_limpeza', 'sensor.roborock_s7_cleaning_time'],
};

const BRUNO_ROBOROCK_ACTIVE_STATES = ['cleaning', 'moving', 'returning', 'segment_cleaning'];
const BRUNO_ROBOROCK_INVALID_STATES = ['unknown', 'unavailable', 'none', ''];

class BrunoRoborockCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_ROBOROCK_DEFAULT_ENTITIES,
      ...(config?.entities || {}),
    };

    this._config = {
      name: 'Roborock',
      title: 'Roborock S7',
      image: '/local/images/roborock_S7.png',
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
    return 3;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isInvalid(value) {
    return value == null || BRUNO_ROBOROCK_INVALID_STATES.includes(String(value).toLowerCase());
  }

  _entityList(value) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  _firstValid(entityIds) {
    for (const entityId of this._entityList(entityIds)) {
      const entity = this._state(entityId);
      if (entity && !this._isInvalid(entity.state)) return entity.state;
    }
    return null;
  }

  _number(value, fallback = '--') {
    if (this._isInvalid(value)) return fallback;
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
  }

  _model() {
    const entities = this._config.entities;
    const vacuum = this._state(entities.vacuum);
    const state = vacuum?.state || 'unknown';
    const active = BRUNO_ROBOROCK_ACTIVE_STATES.includes(state);
    const labels = {
      cleaning: 'Limpando',
      returning: 'Retornando',
      docked: 'Na base',
      idle: 'Parado',
      paused: 'Parado',
      moving: 'Em movimento',
      segment_cleaning: 'Limpando',
    };

    const roomState = this._state(entities.room)?.state;
    const room = this._isInvalid(roomState) ? '--' : roomState;

    let battery = vacuum?.attributes?.battery_level;
    if (this._isInvalid(battery)) battery = this._firstValid(entities.battery);
    battery = this._number(battery);

    let area = vacuum?.attributes?.cleaning_area;
    if (this._isInvalid(area)) area = this._firstValid(entities.area);
    area = this._number(area);

    let time = vacuum?.attributes?.cleaning_time;
    if (this._isInvalid(time)) time = this._firstValid(entities.cleaning_time);
    time = this._number(time);
    if (typeof time === 'number' && time > 300) time /= 60;

    return {
      active,
      state,
      status: labels[state] || state || 'Indisponivel',
      room,
      battery: typeof battery === 'number' ? `${Math.round(battery)}%` : '--',
      area: typeof area === 'number' ? `${Number(area).toFixed(1).replace('.0', '')}m²` : '--m²',
      time: typeof time === 'number' ? `${Number(time).toFixed(1).replace('.0', '')} min` : '-- min',
    };
  }

  _callService(serviceName, data = {}, target = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;

    const serviceData = { ...data };
    if (target?.entity_id != null && serviceData.entity_id == null) {
      serviceData.entity_id = target.entity_id;
    }

    this._hass.callService(domain, service, serviceData, target);
  }

  _runVacuumAction(button) {
    const service = button?.dataset?.service;
    if (!service) return;

    const now = Date.now();
    const previous = Number(button.dataset.lastRunAt || 0);
    if (now - previous < 650) return;
    button.dataset.lastRunAt = String(now);

    this._callService(service, {}, { entity_id: this._config.entities.vacuum });
  }

  _openPopup() {
    const entities = this._config.entities;
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: this._config.title,
            size: 'wide',
            content: {
              type: 'entities',
              entities: [
                entities.vacuum,
                entities.room,
              ],
            },
          },
        },
      },
      bubbles: true,
      composed: true,
    }));
  }

  _wireActions() {
    const card = this.shadowRoot.querySelector('.roborock-card');
    card?.addEventListener('click', (event) => {
      if (event.target?.closest?.('[data-service]')) return;
      this._openPopup();
    });
    card?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._openPopup();
    });

    this.shadowRoot.querySelectorAll('[data-service]').forEach((button) => {
      let pointerHandledAt = 0;

      const stopOnly = (event) => {
        event.preventDefault();
        event.stopPropagation();
      };

      button.addEventListener('pointerdown', (event) => {
        stopOnly(event);
        button.classList.add('is-pressed');
        button.setPointerCapture?.(event.pointerId);
      });

      button.addEventListener('pointerup', (event) => {
        stopOnly(event);
        button.classList.remove('is-pressed');
        button.releasePointerCapture?.(event.pointerId);
        pointerHandledAt = Date.now();
        this._runVacuumAction(button);
      });

      button.addEventListener('pointercancel', () => {
        button.classList.remove('is-pressed');
      });

      button.addEventListener('pointerleave', () => {
        button.classList.remove('is-pressed');
      });

      button.addEventListener('click', (event) => {
        stopOnly(event);
        if (Date.now() - pointerHandledAt < 420) return;
        this._runVacuumAction(button);
      });

      button.addEventListener('keydown', (event) => {
        if (event.key !== 'Enter' && event.key !== ' ') return;
        stopOnly(event);
        this._runVacuumAction(button);
      });
    });

    const robotImage = this.shadowRoot.querySelector('.robot img');
    robotImage?.addEventListener('error', () => {
      robotImage.closest('.robot')?.classList.add('is-fallback');
      robotImage.setAttribute('hidden', '');
    }, { once: true });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const activeClass = model.active ? ' is-active' : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: 18px;
          --accent: 150, 190, 255;
          --accent-purple: 167, 139, 250;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.66);
          --text-muted: rgba(226,232,240,0.46);
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

        .roborock-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(76px, 0.9fr) minmax(0, 1.1fr) 96px;
          grid-template-rows: auto minmax(0, 1fr) 58px;
          grid-template-areas:
            "header header header"
            "icon status stats"
            "actions actions actions";
          gap: 8px 10px;
          padding: 13px 14px 12px;
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

        .roborock-card::before {
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

        .roborock-card.is-active {
          border-color: rgba(var(--accent-purple),0.34);
          box-shadow:
            var(--bruno-liquid-surface-off-shadow, 0 18px 44px rgba(0,0,0,0.27)),
            0 0 24px rgba(var(--accent-purple),0.13);
        }

        .header,
        .robot,
        .status,
        .stats,
        .actions {
          position: relative;
          z-index: 1;
        }

        .header {
          grid-area: header;
          display: flex;
          align-items: center;
          justify-content: space-between;
          min-width: 0;
        }

        .eyebrow {
          font-size: 11px;
          line-height: 1;
          font-weight: 780;
          text-transform: uppercase;
          color: rgba(255,255,255,0.50);
        }

        .state-pill {
          height: 24px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border-radius: 999px;
          color: rgba(226,232,240,0.82);
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
        }

        .state-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(148,163,184,0.85);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
        }

        .is-active .state-dot {
          background: rgb(var(--accent-purple));
          box-shadow: 0 0 12px rgba(var(--accent-purple),0.58);
        }

        .robot {
          grid-area: icon;
          align-self: center;
          justify-self: center;
          width: 72px;
          height: 72px;
          display: grid;
          place-items: center;
        }

        .robot img {
          width: 68px;
          height: 68px;
          display: block;
          object-fit: contain;
        }

        .robot-fallback {
          display: none;
          --mdc-icon-size: 54px;
          color: rgba(226,232,240,0.68);
        }

        .robot.is-fallback .robot-fallback {
          display: block;
        }

        .is-active .robot img,
        .is-active .robot-fallback {
          animation: bruno-roborock-drift 5s ease-in-out infinite;
        }

        .status {
          grid-area: status;
          align-self: center;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .status-main {
          min-width: 0;
          font-size: 16px;
          line-height: 1.08;
          font-weight: 760;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 13px;
          line-height: 1;
          font-weight: 620;
          color: var(--text-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location ha-icon {
          --mdc-icon-size: 15px;
          flex: 0 0 auto;
        }

        .stats {
          grid-area: stats;
          align-self: center;
          justify-self: end;
          width: 96px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .stat {
          min-width: 0;
          height: 42px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          border-radius: 10px;
          color: rgba(255,255,255,0.80);
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .stat ha-icon {
          --mdc-icon-size: 15px;
        }

        .stat span {
          max-width: 90%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
        }

        .actions {
          grid-area: actions;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          align-self: end;
        }

        .action {
          height: 54px;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 4px;
          padding: 0;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.14);
          background: rgba(255,255,255,0.06);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.64);
          outline: none;
          transition: transform 160ms ease, filter 160ms ease, background 160ms ease, border-color 160ms ease;
        }

        .action.primary {
          color: rgba(235,230,255,0.96);
          background: linear-gradient(180deg, rgba(137,122,255,0.48), rgba(92,82,190,0.34));
          border-color: rgba(180,170,255,0.42);
        }

        .action:hover {
          filter: brightness(1.08);
        }

        .action:active {
          transform: translateY(1px) scale(0.985);
        }

        .action.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .action ha-icon {
          --mdc-icon-size: 20px;
        }

        .action span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          line-height: 1;
          font-weight: 720;
        }

        @keyframes bruno-roborock-drift {
          0%, 100% { transform: rotate(-4deg) translateX(-1px); }
          50% { transform: rotate(4deg) translateX(1px); }
        }

        @media (max-height: 760px) {
          .roborock-card {
            padding: 12px;
            grid-template-columns: 74px minmax(0, 1fr) 92px;
            grid-template-rows: auto minmax(0, 1fr) 54px;
            gap: 7px;
          }

          .robot {
            width: 68px;
            height: 68px;
          }

          .robot img {
            width: 64px;
            height: 64px;
          }

          .action {
            height: 50px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .robot img,
          .robot-fallback,
          .action {
            animation: none !important;
            transition: none !important;
          }
        }
      </style>

      <div class="roborock-card${activeClass}" role="button" tabindex="0" aria-label="${BrunoRoborockCard._escape(this._config.title)}">
        <div class="header">
          <span class="eyebrow">${BrunoRoborockCard._escape(this._config.name)}</span>
          <span class="state-pill"><span class="state-dot"></span>${BrunoRoborockCard._escape(model.status)}</span>
        </div>

        <div class="robot" aria-hidden="true">
          <img src="${BrunoRoborockCard._escapeAttr(this._config.image)}" alt="">
          <ha-icon class="robot-fallback" icon="mdi:robot-vacuum"></ha-icon>
        </div>

        <div class="status">
          <div class="status-main">${BrunoRoborockCard._escape(model.status)}</div>
          <div class="location">
            <ha-icon icon="mdi:map-marker-radius-outline"></ha-icon>
            <span>${BrunoRoborockCard._escape(model.room)}</span>
          </div>
        </div>

        <div class="stats">
          ${this._stat('mdi:lightning-bolt', model.battery)}
          ${this._stat('mdi:cube-outline', model.area)}
          ${this._stat('mdi:timer-outline', model.time)}
        </div>

        <div class="actions">
          ${this._action('vacuum.start', 'mdi:play', 'Iniciar', true)}
          ${this._action('vacuum.stop', 'mdi:stop', 'Parar')}
          ${this._action('vacuum.return_to_base', 'mdi:home-map-marker', 'Base')}
        </div>
      </div>
    `;

    this._wireActions();
  }

  _stat(icon, value) {
    return `
      <div class="stat">
        <ha-icon icon="${icon}"></ha-icon>
        <span>${BrunoRoborockCard._escape(value)}</span>
      </div>
    `;
  }

  _action(service, icon, label, primary = false) {
    return `
      <button class="action${primary ? ' primary' : ''}" type="button" data-service="${service}" aria-label="${BrunoRoborockCard._escapeAttr(label)}">
        <ha-icon icon="${icon}"></ha-icon>
        <span>${BrunoRoborockCard._escape(label)}</span>
      </button>
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
    return BrunoRoborockCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_ROBOROCK_CARD_TAG)) {
  customElements.define(BRUNO_ROBOROCK_CARD_TAG, BrunoRoborockCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_ROBOROCK_CARD_TAG,
  name: 'Bruno Roborock Card',
  preview: false,
  description: 'Isolated Bento Roborock card with preserved vacuum actions and Bruno liquid glass visuals.',
});
