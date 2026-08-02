const BRUNO_ROBOROCK_CARD_TAG = 'bruno-roborock-card';
const BRUNO_ROBOROCK_ASSET_VERSION = '20260606-main-view-4';

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
      image: '/local/images/roborock_S7.png?v=20260702-all-images-1',
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
    const details = {
      cleaning: 'Limpeza em andamento',
      returning: 'Voltando para a base',
      docked: 'Pronto para limpar',
      idle: 'Aguardando comando',
      paused: 'Pausado',
      moving: 'Reposicionando',
      segment_cleaning: 'Limpeza por comodo',
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
      cleaning: ['cleaning', 'segment_cleaning'].includes(state),
      state,
      status: labels[state] || state || 'Indisponivel',
      detail: details[state] || 'Aguardando status',
      room,
      battery: typeof battery === 'number' ? `${Math.round(battery)}%` : '--',
      area: typeof area === 'number' ? `${Number(area).toFixed(1).replace('.0', '')}m²` : '--m²',
      time: typeof time === 'number' ? `${Number(time).toFixed(1).replace('.0', '')} min` : '-- min',
      stateMetric: state === 'docked' ? 'Idle' : (this._isInvalid(state) ? 'Indisp.' : (labels[state] || state || '--')),
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

    globalThis.BrunoLiquidGlass?.feedback?.('tap');
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

  _assetUrl(src) {
    if (!src) return '';
    return `${src}${String(src).includes('?') ? '&' : '?'}v=${BRUNO_ROBOROCK_ASSET_VERSION}`;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const activeClass = model.active ? ' is-active' : '';
    const cleaningClass = model.cleaning ? ' is-cleaning' : '';
    const compactClass = this._config.variant === 'compact' ? ' is-compact' : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 150, 190, 255;
          --accent-purple: 167, 139, 250;
          --accent-warm: 255, 166, 72;
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
          grid-template-columns: 138px minmax(0, 1fr);
          grid-template-rows: 44px minmax(0, 1fr) 46px;
          grid-template-areas:
            "header stats"
            "icon status"
            "icon actions";
          gap: 8px 5px;
          padding: 13px 14px 13px 12px;
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

        .roborock-card::after {
          content: "";
          position: absolute;
          inset: 30px 44px 16px 122px;
          z-index: 0;
          pointer-events: none;
          opacity: 0.48;
          background:
            radial-gradient(circle at 58% 48%, rgba(96,165,250,0.95) 0 3px, rgba(96,165,250,0.32) 4px, transparent 13px),
            radial-gradient(circle at 58% 48%, rgba(96,165,250,0.18), transparent 30px),
            linear-gradient(90deg, transparent 0 19%, rgba(255,255,255,0.085) 19.4% 19.9%, transparent 20.4% 100%),
            linear-gradient(90deg, transparent 0 53%, rgba(255,255,255,0.070) 53.4% 53.9%, transparent 54.4% 100%),
            linear-gradient(90deg, transparent 0 78%, rgba(255,255,255,0.060) 78.4% 78.9%, transparent 79.4% 100%),
            linear-gradient(0deg, transparent 0 31%, rgba(255,255,255,0.075) 31.4% 31.9%, transparent 32.4% 100%),
            linear-gradient(0deg, transparent 0 67%, rgba(255,255,255,0.064) 67.4% 67.9%, transparent 68.4% 100%),
            linear-gradient(135deg, transparent 0 43%, rgba(96,165,250,0.115) 43.4% 44%, transparent 44.6% 100%);
          filter: blur(0.05px);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
          mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
        }

        .roborock-card.is-cleaning {
          background: var(--bruno-liquid-surface-on-background,
            radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.30), rgba(255,255,255,0.082) 52%, transparent 75%),
            radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.16), transparent 68%),
            linear-gradient(180deg, rgba(255,255,255,0.165), rgba(255,255,255,0.052) 43%, rgba(255,255,255,0.078)),
            linear-gradient(155deg, rgba(18,24,36,0.68), rgba(11,14,22,0.56) 49%, rgba(33,27,25,0.30))
          );
        }

        .roborock-card.is-cleaning::before {
          opacity: 0.86;
        }

        .roborock-card.is-compact {
          grid-template-columns: minmax(98px, 0.48fr) minmax(0, 1fr) minmax(82px, 0.42fr);
          grid-template-rows: 28px minmax(0, 1fr) 42px;
          grid-template-areas:
            "header header header"
            "icon status stats"
            "icon actions actions";
          gap: 7px 12px;
          padding: 12px 13px 12px 12px;
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(150px 105px at 14% 0%, rgba(255,255,255,0.13), transparent 72%),
            linear-gradient(155deg, rgba(18,24,36,0.56), rgba(11,14,22,0.50) 50%, rgba(33,27,25,0.26))
          );
        }

        .roborock-card.is-compact::after {
          display: none;
        }

        .roborock-card.is-compact .header {
          height: 28px;
        }

        .roborock-card.is-compact .robot {
          width: min(110px, 100%);
          height: min(110px, 100%);
          justify-self: center;
          align-self: center;
          transform: none;
        }

        .roborock-card.is-compact .robot img {
          width: min(106px, 100%);
          height: min(106px, 100%);
        }

        .roborock-card.is-compact .robot-fallback {
          --mdc-icon-size: 72px;
        }

        .roborock-card.is-compact .status {
          align-self: center;
          justify-content: center;
          gap: 5px;
          padding: 0 12px 0 0;
          transform: none;
        }

        .roborock-card.is-compact .status-main {
          font-size: 17px;
        }

        .roborock-card.is-compact .status-detail {
          display: none;
        }

        .roborock-card.is-compact .location {
          font-size: 11px;
        }

        .roborock-card.is-compact .stats {
          align-self: stretch;
          display: flex;
          justify-content: center;
          align-items: center;
          padding-left: 14px;
          border-left: 1px solid rgba(255,255,255,0.090);
          transform: none;
        }

        .roborock-card.is-compact .stats .stat:nth-child(n+2) {
          display: none;
        }

        .roborock-card.is-compact .stat {
          height: auto;
          justify-content: center;
        }

        .roborock-card.is-compact .stat bruno-icon {
          --mdc-icon-size: 28px;
        }

        .roborock-card.is-compact .stat-value {
          font-size: 17px;
        }

        .roborock-card.is-compact .stat-label {
          font-size: 10px;
        }

        .roborock-card.is-compact .actions {
          align-self: stretch;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.085);
          transform: none;
        }

        .roborock-card.is-compact .action {
          height: 36px;
          border-radius: var(--bruno-liquid-control-radius, 14px);
        }

        .roborock-card.is-compact .action bruno-icon {
          --mdc-icon-size: 20px;
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
          align-self: start;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          min-width: 0;
          height: 26px;
        }

        .header-copy {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: rgba(191,219,254,0.86);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .header-icon bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title-main {
          font-size: 13px;
          line-height: 1.05;
          font-weight: 800;
          color: rgba(255,255,255,0.93);
        }

        .state-pill {
          height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border-radius: 999px;
          color: rgba(255,222,178,0.94);
          background:
            radial-gradient(28px 18px at 20% 20%, rgba(255,255,255,0.17), transparent 72%),
            rgba(var(--accent-warm),0.090);
          border: 1px solid rgba(var(--accent-warm),0.22);
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
        }

        .state-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgb(var(--accent-warm));
          box-shadow: 0 0 12px rgba(var(--accent-warm),0.48);
        }

        .robot {
          grid-area: icon;
          align-self: center;
          justify-self: start;
          width: 150px;
          height: 150px;
          display: grid;
          place-items: center;
          transform: translate(-7px, -5px);
        }

        .robot img {
          width: 146px;
          height: 146px;
          display: block;
          object-fit: contain;
          filter: none !important;
          box-shadow: none !important;
        }

        .robot-fallback {
          display: none;
          --mdc-icon-size: 110px;
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
          gap: 6px;
          padding-left: 0;
          transform: translateX(-5px);
        }

        .status-main {
          min-width: 0;
          font-size: 19px;
          line-height: 1.08;
          font-weight: 760;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-detail {
          min-width: 0;
          font-size: 12px;
          line-height: 1;
          font-weight: 650;
          color: rgba(255,205,132,0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          line-height: 1;
          font-weight: 620;
          color: var(--text-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location bruno-icon {
          --mdc-icon-size: 15px;
          flex: 0 0 auto;
        }

        .stats {
          grid-area: stats;
          align-self: start;
          justify-self: stretch;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: start;
          gap: 4px;
          transform: translateX(-5px);
        }

        .stat {
          min-width: 0;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 1px;
          padding: 0;
          color: rgba(255,255,255,0.88);
          background: transparent;
          border: 0;
          box-shadow: none;
          overflow: visible;
          text-shadow: 0 1px 8px rgba(0,0,0,0.34);
        }

        .stat bruno-icon {
          --mdc-icon-size: 18px;
          color: rgba(255,222,178,0.92);
          filter: drop-shadow(0 0 8px rgba(255,171,72,0.22));
        }

        .stat-value {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12.6px;
          line-height: 1.03;
          font-weight: 760;
        }

        .stat-label {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          line-height: 1.05;
          font-weight: 680;
          color: rgba(226,232,240,0.68);
        }

        .actions {
          grid-area: actions;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          align-self: end;
          justify-content: stretch;
          min-width: 0;
          transform: translateX(-5px);
        }

        .action {
          width: 100%;
          height: 46px;
          min-width: 0;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 0;
          border-radius: 15px;
          border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
          background: var(--bruno-liquid-control-background, rgba(255,255,255,0.06));
          box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.10));
          color: rgba(255,255,255,0.72);
          outline: none;
          transition: transform 160ms ease, filter 160ms ease, background 160ms ease, border-color 160ms ease;
        }

        .action.primary {
          color: rgba(245,250,255,0.98);
          background: var(--bruno-liquid-selected-blue-background,
            radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 62%),
            linear-gradient(180deg, rgba(105,150,230,0.68), rgba(59,92,178,0.54))
          );
          border-color: var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.38));
          box-shadow: var(--bruno-liquid-selected-blue-shadow,
            inset 0 1px 0 rgba(255,255,255,0.32),
            0 0 20px rgba(96,165,250,0.32)
          );
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

        .action bruno-icon {
          --mdc-icon-size: 23px;
        }

        .action span {
          display: none;
        }

        @keyframes bruno-roborock-drift {
          0%, 100% { transform: rotate(-4deg) translateX(-1px); }
          50% { transform: rotate(4deg) translateX(1px); }
        }

        @media (max-height: 760px) {
          .roborock-card {
            padding: 12px 12px 12px 10px;
            grid-template-columns: 128px minmax(0, 1fr);
            grid-template-rows: 42px minmax(0, 1fr) 42px;
            grid-template-areas:
              "header stats"
              "icon status"
              "icon actions";
            gap: 7px 5px;
          }

          .robot {
            width: 138px;
            height: 138px;
            transform: translate(-7px, -4px);
          }

          .robot img {
            width: 132px;
            height: 132px;
          }

          .stat {
            height: 42px;
          }

          .stat bruno-icon {
            --mdc-icon-size: 17px;
          }

          .stat-value {
            font-size: 12px;
          }

          .stat-label {
            font-size: 8.7px;
          }

          .action {
            height: 44px;
          }

          .roborock-card.is-compact {
            grid-template-columns: minmax(86px, 0.42fr) minmax(0, 1fr) minmax(74px, 0.38fr);
            grid-template-rows: 26px minmax(0, 1fr) 36px;
            grid-template-areas:
              "header header header"
              "icon status stats"
              "icon actions actions";
            gap: 6px 9px;
            padding: 10px 11px;
          }

          .roborock-card.is-compact .robot {
            width: min(92px, 100%);
            height: min(92px, 100%);
            transform: none;
          }

          .roborock-card.is-compact .robot img {
            width: min(88px, 100%);
            height: min(88px, 100%);
          }

          .roborock-card.is-compact .status-main {
            font-size: 15px;
          }

          .roborock-card.is-compact .action {
            height: 32px;
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

      <div class="roborock-card${activeClass}${cleaningClass}${compactClass}" role="button" tabindex="0" aria-label="${BrunoRoborockCard._escape(this._config.title)}">
        <div class="header">
          <span class="header-copy">
            <span class="header-icon" aria-hidden="true"><bruno-icon icon="mdi:robot-vacuum"></bruno-icon></span>
            <span class="title-main">${BrunoRoborockCard._escape(this._config.name)}</span>
          </span>
        </div>

        <div class="robot" aria-hidden="true">
          <img src="${BrunoRoborockCard._escapeAttr(this._assetUrl(this._config.image))}" alt="">
          <bruno-icon class="robot-fallback" icon="mdi:robot-vacuum"></bruno-icon>
        </div>

        <div class="status">
          <div class="status-main">${BrunoRoborockCard._escape(model.status)}</div>
          <div class="status-detail">${BrunoRoborockCard._escape(model.detail)}</div>
          <div class="location">
            <bruno-icon icon="mdi:map-marker-radius-outline"></bruno-icon>
            <span>${BrunoRoborockCard._escape(model.room)}</span>
          </div>
        </div>

        <div class="stats">
          ${this._stat('mdi:lightning-bolt', model.battery, 'Bateria')}
          ${this._stat('mdi:cube-outline', model.area, 'Area limpa')}
          ${this._stat('mdi:timer-outline', model.time, 'Tempo')}
          ${this._stat('mdi:pulse', model.stateMetric, 'Status')}
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

  _stat(icon, value, label) {
    return `
      <div class="stat">
        <bruno-icon icon="${icon}"></bruno-icon>
        <span class="stat-value">${BrunoRoborockCard._escape(value)}</span>
        <span class="stat-label">${BrunoRoborockCard._escape(label)}</span>
      </div>
    `;
  }

  _action(service, icon, label, primary = false) {
    return `
      <button class="action${primary ? ' primary' : ''}" type="button" data-service="${service}" aria-label="${BrunoRoborockCard._escapeAttr(label)}">
        <bruno-icon icon="${icon}"></bruno-icon>
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
