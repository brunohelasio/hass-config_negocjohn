const BRUNO_SALA_CARD_TAG = 'bruno-sala-card';

const BRUNO_SALA_DEFAULT_ENTITIES = {
  room_group: 'light.grupo_luzes_sala',
  room_toggle: 'light.sala_switch_2',
  room_fallback_lights: ['light.sala_switch_1', 'light.sala_switch_2'],
  active_sensor: 'sensor.living_room_active',
  temperature: 'sensor.sensor_4_in_1_sala_temperature',
  humidity: 'sensor.sensor_4_in_1_sala_humidity',
  presence: 'binary_sensor.sensor_4_in_1_sala_presence',
  tv: 'media_player.android_tv_192_168_3_17',
  climate: 'climate.sl_ar_condicionado',
  speaker: 'media_player.echo_show',
  corridor: 'light.corredor_switch_1',
};

const BRUNO_SALA_TV_ON_STATES = ['on', 'playing', 'paused', 'idle'];
const BRUNO_SALA_CLIMATE_ON_STATES = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const BRUNO_SALA_SPEAKER_ON_STATES = ['playing', 'on', 'paused'];

class BrunoSalaCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_SALA_DEFAULT_ENTITIES,
      ...(config?.entities || {}),
    };

    this._config = {
      name: 'Sala',
      navigation_path: 'subview-sala',
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
    return 4;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isUnavailable(entity) {
    return !entity || ['unknown', 'unavailable', ''].includes(entity.state);
  }

  _isState(entityId, state) {
    return this._state(entityId)?.state === state;
  }

  _isAnyState(entityId, states) {
    return states.includes(this._state(entityId)?.state || '');
  }

  _roomEntityIds(roomEntity) {
    const ids = roomEntity?.attributes?.entity_id;
    return Array.isArray(ids) ? ids : [];
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

    if (count === null) {
      const fallbackIds = Array.isArray(entities.room_fallback_lights)
        ? entities.room_fallback_lights
        : BRUNO_SALA_DEFAULT_ENTITIES.room_fallback_lights;
      count = fallbackIds.filter((id) => this._state(id)?.state === 'on').length;
    }

    let earliestOn = null;
    ids.forEach((id) => {
      const stateObj = this._state(id);
      if (stateObj?.state === 'on' && stateObj.last_changed) {
        const timestamp = Date.parse(stateObj.last_changed);
        if (!Number.isNaN(timestamp) && (earliestOn === null || timestamp < earliestOn)) {
          earliestOn = timestamp;
        }
      }
    });

    if (earliestOn === null && roomEntity?.last_changed) {
      const timestamp = Date.parse(roomEntity.last_changed);
      if (!Number.isNaN(timestamp)) earliestOn = timestamp;
    }

    const elapsed = earliestOn !== null ? this._elapsed(Date.now() - earliestOn) : '';
    const label = count === 1 ? '1 light' : `${count} lights`;

    return {
      count,
      elapsed,
      label: count > 0 ? `${label}${elapsed ? ` · ${elapsed}` : ''}` : 'Apagada',
    };
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

  _sensorValue(entityId, suffix = '') {
    const entity = this._state(entityId);
    if (this._isUnavailable(entity)) return '&mdash;';
    return `${BrunoSalaCard._escape(entity.state)}${suffix}`;
  }

  _presenceRecent() {
    const entity = this._state(this._config.entities.presence);
    if (entity?.state !== 'on' || !entity.last_changed) return false;

    const changedAt = Date.parse(entity.last_changed);
    return !Number.isNaN(changedAt) && Date.now() - changedAt < 10 * 60 * 1000;
  }

  _tvLabel(entity) {
    if (!entity) return 'Desligada';
    if (entity.state === 'playing') return 'Reproduzindo';
    if (entity.state === 'paused') return 'Pausado';
    if (['on', 'idle'].includes(entity.state)) return 'Ligada';
    return 'Desligada';
  }

  _climateLabel(entity) {
    const isOn = BRUNO_SALA_CLIMATE_ON_STATES.includes(entity?.state || '');
    if (!isOn) return 'Desligado';

    const temperature = entity?.attributes?.temperature;
    return Number.isFinite(Number(temperature)) ? `${Number(temperature)}&deg;` : 'Ligado';
  }

  _model() {
    const entities = this._config.entities;
    const room = this._state(entities.room_group);
    const tv = this._state(entities.tv);
    const climate = this._state(entities.climate);
    const corridor = this._state(entities.corridor);

    const roomOn = room?.state === 'on';
    const tvOn = BRUNO_SALA_TV_ON_STATES.includes(tv?.state || '');
    const climateOn = BRUNO_SALA_CLIMATE_ON_STATES.includes(climate?.state || '');
    const speakerOn = BRUNO_SALA_SPEAKER_ON_STATES.includes(this._state(entities.speaker)?.state || '');
    const corridorOn = corridor?.state === 'on';
    const lights = this._lightsSummary(room);

    return {
      roomOn,
      tvOn,
      climateOn,
      speakerOn,
      corridorOn,
      presenceOn: this._presenceRecent(),
      temperature: this._sensorValue(entities.temperature, '&deg;'),
      humidity: this._sensorValue(entities.humidity, '%'),
      lights,
      tvLabel: this._tvLabel(tv),
      climateLabel: this._climateLabel(climate),
      corridorLabel: corridorOn ? 'Ligado' : 'Desligado',
    };
  }

  _runAction(key, gesture) {
    const entities = this._config.entities;

    if (key === 'room') {
      if (gesture === 'double') {
        this._navigate(this._config.navigation_path);
        return;
      }
      if (gesture === 'hold') {
        this._callService('light.turn_off', {}, { entity_id: entities.room_group });
        return;
      }
      this._callService('light.toggle', {}, { entity_id: entities.room_toggle });
      return;
    }

    if (key === 'corridor') {
      if (gesture === 'hold') {
        this._moreInfo(entities.corridor);
        return;
      }
      this._toggleEntity(entities.corridor);
      return;
    }

    if (key === 'tv') {
      if (gesture === 'hold') {
        this._moreInfo(entities.tv);
        return;
      }
      this._toggleEntity(entities.tv);
      return;
    }

    if (key === 'climate') {
      if (gesture === 'hold') {
        this._moreInfo(entities.climate);
        return;
      }
      const service = BRUNO_SALA_CLIMATE_ON_STATES.includes(this._state(entities.climate)?.state || '')
        ? 'climate.turn_off'
        : 'climate.turn_on';
      this._callService(service, {}, { entity_id: entities.climate });
    }
  }

  _callService(serviceName, data = {}, target = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;

    this._hass.callService(domain, service, data, target);
  }

  _toggleEntity(entityId) {
    if (!entityId) return;
    this._callService('homeassistant.toggle', {}, { entity_id: entityId });
  }

  _navigate(path) {
    if (!path) return;
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path },
      bubbles: true,
      composed: true,
    }));
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _wireAction(button) {
    const key = button.dataset.actionKey;
    if (!key) return;

    let holdTimer = null;
    let tapTimer = null;
    let holdFired = false;

    const clearHold = () => {
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const resetPress = () => {
      clearHold();
      button.classList.remove('is-pressed');
    };

    button.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      holdFired = false;
      button.classList.add('is-pressed');
      button.setPointerCapture?.(event.pointerId);

      holdTimer = window.setTimeout(() => {
        holdFired = true;
        button.classList.add('is-hold-fired');
        window.setTimeout(() => button.classList.remove('is-hold-fired'), 260);
        this._runAction(key, 'hold');
      }, 560);
    });

    button.addEventListener('pointerup', (event) => {
      button.releasePointerCapture?.(event.pointerId);
      resetPress();
      if (holdFired) return;

      if (key === 'room') {
        if (tapTimer) {
          window.clearTimeout(tapTimer);
          tapTimer = null;
          this._runAction(key, 'double');
          return;
        }

        tapTimer = window.setTimeout(() => {
          tapTimer = null;
          this._runAction(key, 'tap');
        }, 260);
        return;
      }

      this._runAction(key, 'tap');
    });

    button.addEventListener('pointerleave', resetPress);
    button.addEventListener('pointercancel', resetPress);

    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._runAction(key, 'tap');
    });
  }

  _statusDot(icon, active, label, tone) {
    const activeClass = active ? ' is-active' : '';
    return `
      <span class="status-dot tone-${tone}${activeClass}" title="${BrunoSalaCard._escape(label)}" aria-label="${BrunoSalaCard._escape(label)}">
        <ha-icon icon="${icon}"></ha-icon>
      </span>
    `;
  }

  _actionButton(key, icon, name, label, active, tone) {
    const activeClass = active ? ' is-active' : '';
    return `
      <button class="action-pill tone-${tone}${activeClass}" type="button" data-action-key="${key}" aria-label="${BrunoSalaCard._escape(name)}">
        <span class="pill-icon"><ha-icon icon="${icon}"></ha-icon></span>
        <span class="pill-copy">
          <span class="pill-name">${BrunoSalaCard._escape(name)}</span>
          <span class="pill-label">${label}</span>
        </span>
      </button>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const roomActiveClass = model.roomOn ? ' is-room-on' : '';
    const roomState = model.roomOn ? 'Ligada' : 'Apagada';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: 26px;
          --inner-radius: 22px;
          --button-radius: 18px;
          --accent: 150, 190, 255;
          --accent-blue: 96, 165, 250;
          --accent-purple: 167, 139, 250;
          --accent-cyan: 79, 172, 254;
          --accent-amber: 255, 153, 0;
          --glass-line: rgba(255,255,255,0.14);
          --glass-line-soft: rgba(255,255,255,0.075);
          --text-main: rgba(245,250,255,0.96);
          --text-soft: rgba(226,238,255,0.64);
          --text-muted: rgba(226,238,255,0.42);
          display: block;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 0;
          contain: layout style;
        }

        * {
          box-sizing: border-box;
          letter-spacing: 0;
        }

        .sala-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px;
          color: var(--text-main);
          background:
            radial-gradient(180px 160px at 16% -12%, rgba(255,255,255,0.22), rgba(255,255,255,0.055) 42%, transparent 72%),
            radial-gradient(190px 160px at 108% 88%, rgba(var(--accent),0.17), transparent 70%),
            linear-gradient(180deg, rgba(255,255,255,0.145), rgba(255,255,255,0.045) 36%, rgba(255,255,255,0.075)),
            linear-gradient(155deg, rgba(26,33,48,0.82), rgba(20,22,29,0.64) 48%, rgba(42,32,24,0.34));
          backdrop-filter: blur(30px) saturate(1.58) contrast(1.05);
          -webkit-backdrop-filter: blur(30px) saturate(1.58) contrast(1.05);
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: var(--card-radius);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.030),
            0 18px 44px rgba(0,0,0,0.25),
            0 0 28px rgba(110,150,210,0.10);
          overflow: hidden;
        }

        .sala-card::before,
        .sala-card::after {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .sala-card::before {
          inset: 1px;
          border-radius: calc(var(--card-radius) - 1px);
          background:
            radial-gradient(120px 82px at 18% 0%, rgba(255,255,255,0.26), transparent 72%),
            radial-gradient(150px 120px at 96% 14%, rgba(var(--accent),0.15), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.00) 36%),
            linear-gradient(90deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 44%);
          opacity: 0.78;
        }

        .sala-card::after {
          inset: auto 18px 10px 18px;
          height: 1px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
          opacity: 0.42;
        }

        .sala-card.is-room-on {
          border-color: rgba(226,238,255,0.22);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.28),
            inset 1px 0 0 rgba(255,255,255,0.12),
            0 20px 48px rgba(0,0,0,0.25),
            0 0 34px rgba(var(--accent-blue),0.17);
        }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .hero-action,
        .action-pill {
          appearance: none;
          -webkit-appearance: none;
          border: 0;
          outline: none;
          position: relative;
          z-index: 1;
        }

        .hero-action {
          flex: 1 1 auto;
          min-height: 116px;
          width: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto minmax(0, 1fr) auto;
          grid-template-areas:
            "header status"
            "icon status"
            "summary status";
          gap: 8px 12px;
          padding: 15px 14px 14px;
          text-align: left;
          background:
            radial-gradient(120px 95px at 8% 8%, rgba(255,255,255,0.12), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.030));
          border: 1px solid rgba(255,255,255,0.095);
          border-radius: var(--inner-radius);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.11),
            inset 0 -1px 0 rgba(255,255,255,0.035);
          overflow: hidden;
          transition:
            background 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            transform 160ms ease;
        }

        .hero-action:hover {
          background:
            radial-gradient(120px 95px at 8% 8%, rgba(255,255,255,0.16), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.038));
          border-color: rgba(255,255,255,0.15);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 8px 18px rgba(0,0,0,0.16);
        }

        .hero-action.is-pressed,
        .action-pill.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .hero-action.is-hold-fired,
        .action-pill.is-hold-fired {
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 0 0 3px rgba(var(--accent),0.13),
            0 0 24px rgba(var(--accent),0.18);
        }

        .hero-header {
          grid-area: header;
          min-width: 0;
        }

        .eyebrow {
          font-size: 10px;
          line-height: 1.1;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
        }

        .title-row {
          display: flex;
          align-items: baseline;
          gap: 8px;
          min-width: 0;
        }

        .title {
          font-size: 20px;
          line-height: 1.05;
          font-weight: 780;
          color: var(--text-main);
          white-space: nowrap;
        }

        .room-state {
          font-size: 11px;
          line-height: 1;
          font-weight: 700;
          color: var(--text-soft);
          white-space: nowrap;
        }

        .hero-icon {
          grid-area: icon;
          align-self: center;
          width: 68px;
          height: 68px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 22px;
          background:
            radial-gradient(34px 34px at 28% 16%, rgba(255,255,255,0.28), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.14), rgba(255,255,255,0.045));
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 9px 20px rgba(0,0,0,0.18);
        }

        .hero-icon ha-icon {
          width: 36px;
          height: 36px;
          color: rgba(245,250,255,0.92);
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.24));
          transition: color 160ms ease, filter 160ms ease, transform 160ms ease;
        }

        .sala-card.is-room-on .hero-icon ha-icon {
          color: rgba(255,240,190,0.96);
          filter:
            drop-shadow(0 0 10px rgba(250,204,21,0.28))
            drop-shadow(0 2px 4px rgba(0,0,0,0.22));
        }

        .hero-summary {
          grid-area: summary;
          align-self: end;
          min-width: 0;
        }

        .summary-main {
          font-size: 12px;
          line-height: 1.22;
          font-weight: 700;
          color: var(--text-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .summary-sub {
          margin-top: 3px;
          display: flex;
          align-items: center;
          gap: 7px;
          font-size: 11px;
          line-height: 1.1;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .status-column {
          grid-area: status;
          align-self: stretch;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          justify-content: space-between;
          gap: 8px;
        }

        .metric {
          min-width: 58px;
          padding: 8px 9px;
          border-radius: 16px;
          text-align: right;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.095), rgba(255,255,255,0.035));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .metric-value {
          display: block;
          font-size: 14px;
          line-height: 1;
          font-weight: 800;
          color: var(--text-main);
        }

        .metric-sub {
          display: block;
          margin-top: 4px;
          font-size: 11px;
          line-height: 1;
          color: var(--text-muted);
        }

        .dots {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .status-dot {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          color: rgba(226,238,255,0.40);
          background: rgba(255,255,255,0.070);
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.07);
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
        }

        .status-dot ha-icon {
          width: 14px;
          height: 14px;
        }

        .status-dot.is-active {
          color: rgba(245,250,255,0.95);
          border-color: rgba(226,238,255,0.32);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 16px rgba(var(--tone),0.24);
          background:
            radial-gradient(16px 14px at 30% 20%, rgba(255,255,255,0.36), transparent 72%),
            rgba(var(--tone),0.18);
        }

        .tone-blue { --tone: var(--accent-blue); }
        .tone-purple { --tone: var(--accent-purple); }
        .tone-cyan { --tone: var(--accent-cyan); }
        .tone-amber { --tone: var(--accent-amber); }

        .action-strip {
          position: relative;
          z-index: 1;
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 6px;
        }

        .action-pill {
          height: 52px;
          width: 100%;
          display: grid;
          grid-template-columns: 42px minmax(0, 1fr);
          align-items: center;
          gap: 9px;
          padding: 0 12px;
          text-align: left;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.035));
          border: 1px solid rgba(255,255,255,0.11);
          border-radius: var(--button-radius);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.065);
          overflow: hidden;
          transition:
            background 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        .action-pill:hover {
          background:
            linear-gradient(180deg, rgba(255,255,255,0.105), rgba(255,255,255,0.045));
          border-color: rgba(255,255,255,0.16);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.11),
            0 6px 14px rgba(0,0,0,0.14);
        }

        .action-pill.is-active {
          color: rgba(245,250,255,0.96);
          background:
            radial-gradient(34px 28px at 18% 18%, rgba(255,255,255,0.34), transparent 70%),
            radial-gradient(62px 44px at 92% 85%, rgba(var(--tone),0.20), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.078)),
            linear-gradient(135deg, rgba(var(--tone),0.24), rgba(255,255,255,0.025));
          border-color: rgba(226,238,255,0.36);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.24),
            inset 1px 0 0 rgba(255,255,255,0.09),
            0 8px 18px rgba(0,0,0,0.22),
            0 0 22px rgba(var(--tone),0.18);
        }

        .pill-icon {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          color: rgba(226,238,255,0.58);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.065), rgba(255,255,255,0.020));
          border: 1px solid rgba(255,255,255,0.075);
        }

        .action-pill.is-active .pill-icon {
          color: rgba(245,250,255,0.96);
          background: rgba(var(--tone),0.16);
          border-color: rgba(var(--tone),0.32);
        }

        .pill-icon ha-icon {
          width: 19px;
          height: 19px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
        }

        .pill-copy {
          min-width: 0;
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
        }

        .pill-name {
          min-width: 0;
          font-size: 12px;
          line-height: 1;
          font-weight: 720;
          color: rgba(245,250,255,0.86);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .pill-label {
          flex: 0 0 auto;
          font-size: 11px;
          line-height: 1;
          font-weight: 650;
          color: rgba(226,238,255,0.42);
          white-space: nowrap;
        }

        .action-pill.is-active .pill-label {
          color: rgba(var(--tone),0.98);
        }

        @media (max-height: 760px) {
          :host {
            --card-radius: 24px;
            --inner-radius: 20px;
            --button-radius: 16px;
          }

          .sala-card {
            padding: 12px;
            gap: 8px;
          }

          .hero-action {
            min-height: 102px;
            padding: 13px 12px;
          }

          .hero-icon {
            width: 58px;
            height: 58px;
            border-radius: 20px;
          }

          .hero-icon ha-icon {
            width: 31px;
            height: 31px;
          }

          .action-pill {
            height: 48px;
          }
        }

        @media (max-width: 800px) {
          :host {
            min-height: 300px;
          }

          .sala-card {
            min-height: 300px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-action,
          .action-pill,
          .status-dot,
          .pill-icon,
          .hero-icon ha-icon {
            transition: none !important;
          }
        }
      </style>

      <div class="sala-card${roomActiveClass}">
        <button class="hero-action" type="button" data-action-key="room" aria-label="Sala">
          <div class="hero-header">
            <div class="eyebrow">Ambiente</div>
            <div class="title-row">
              <div class="title">${BrunoSalaCard._escape(this._config.name)}</div>
              <div class="room-state">${roomState}</div>
            </div>
          </div>

          <div class="hero-icon" aria-hidden="true">
            <ha-icon icon="mdi:sofa"></ha-icon>
          </div>

          <div class="hero-summary">
            <div class="summary-main">${BrunoSalaCard._escape(model.lights.label)}</div>
            <div class="summary-sub">
              <span>TV ${BrunoSalaCard._escape(model.tvLabel)}</span>
              <span>A/C ${model.climateLabel}</span>
            </div>
          </div>

          <div class="status-column">
            <div class="metric">
              <span class="metric-value">${model.temperature}</span>
              <span class="metric-sub">${model.humidity}</span>
            </div>
            <div class="dots" aria-label="Status da sala">
              ${this._statusDot('mdi:account', model.presenceOn, 'Presenca recente', 'blue')}
              ${this._statusDot('mdi:television-classic', model.tvOn, 'TV ativa', 'purple')}
              ${this._statusDot('mdi:snowflake', model.climateOn, 'Ar condicionado ativo', 'cyan')}
              ${this._statusDot('mdi:speaker-wireless', model.speakerOn, 'Echo Show ativo', 'amber')}
            </div>
          </div>
        </button>

        <div class="action-strip">
          ${this._actionButton('corridor', 'mdi:led-strip-variant', 'Corredor', BrunoSalaCard._escape(model.corridorLabel), model.corridorOn, 'blue')}
          ${this._actionButton('tv', 'mdi:television-classic', 'TV', BrunoSalaCard._escape(model.tvLabel), model.tvOn, 'purple')}
          ${this._actionButton('climate', 'mdi:snowflake', 'A/C', model.climateLabel, model.climateOn, 'cyan')}
        </div>
      </div>
    `;

    this.shadowRoot
      .querySelectorAll('[data-action-key]')
      .forEach((button) => this._wireAction(button));
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

if (!customElements.get(BRUNO_SALA_CARD_TAG)) {
  customElements.define(BRUNO_SALA_CARD_TAG, BrunoSalaCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_SALA_CARD_TAG,
  name: 'Bruno Sala Card',
  preview: false,
  description: 'Isolated Bento Sala card with preserved Home Assistant actions and premium liquid glass visuals.',
});
