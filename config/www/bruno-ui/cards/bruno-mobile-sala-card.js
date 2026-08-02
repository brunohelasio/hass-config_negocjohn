const BRUNO_MOBILE_SALA_CARD_TAG = 'bruno-mobile-sala-card';

const BRUNO_MOBILE_SALA_DEFAULT_ENTITIES = {
  room_group: 'light.grupo_luzes_sala',
  room_toggle: 'light.sala_switch_2',
  room_fallback_lights: ['light.sala_switch_1', 'light.sala_switch_2'],
  active_sensor: 'sensor.living_room_active',
  semantic_sensor: 'sensor.sala_semantic_state_supervised',
  motion_recent: 'binary_sensor.sala_motion_recent',
  temperature: 'sensor.sensor_4_in_1_sala_temperature',
  humidity: 'sensor.sensor_4_in_1_sala_humidity',
  presence: 'binary_sensor.sensor_4_in_1_sala_presence',
  tv: 'media_player.android_tv_192_168_3_17',
  climate: 'climate.sl_ar_condicionado',
  speaker: 'media_player.echo_show',
  corridor: 'light.corredor_switch_1',
};

const BRUNO_MOBILE_SALA_TV_ON_STATES = ['on', 'playing', 'paused', 'idle'];
const BRUNO_MOBILE_SALA_CLIMATE_ON_STATES = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const BRUNO_MOBILE_SALA_CLIMATE_ACTIVE_ACTIONS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const BRUNO_MOBILE_SALA_CLIMATE_INACTIVE_ACTIONS = ['off', 'idle'];
const BRUNO_MOBILE_SALA_SPEAKER_ON_STATES = ['playing', 'on', 'paused'];
const BRUNO_MOBILE_SALA_ACTION_COOLDOWN = 1200;
const BRUNO_MOBILE_SALA_CLIMATE_COOLDOWN = 2500;

class BrunoMobileSalaCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_MOBILE_SALA_DEFAULT_ENTITIES,
      ...(config?.entities || {}),
    };

    this._config = {
      name: 'Sala',
      navigation_path: 'subview-sala',
      icon: {
        off: '/local/bruno-ui/assets/living-room-off.png?v=20260608-sala-shift-1',
        on: '/local/bruno-ui/assets/living-room-on.png?v=20260608-sala-shift-1',
      },
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
    return 2;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isUnavailable(entity) {
    return !entity || ['unknown', 'unavailable', 'none', ''].includes(String(entity.state || '').toLowerCase());
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
    }

    const ids = this._roomEntityIds(roomEntity);
    if (count === null && ids.length) count = ids.filter((id) => this._state(id)?.state === 'on').length;

    const fallbackIds = Array.isArray(entities.room_fallback_lights)
      ? entities.room_fallback_lights
      : BRUNO_MOBILE_SALA_DEFAULT_ENTITIES.room_fallback_lights;
    if (count === null) count = fallbackIds.filter((id) => this._state(id)?.state === 'on').length;

    let earliestOn = null;
    (ids.length ? ids : fallbackIds).forEach((id) => {
      const stateObj = this._state(id);
      if (stateObj?.state === 'on' && stateObj.last_changed) {
        const timestamp = Date.parse(stateObj.last_changed);
        if (!Number.isNaN(timestamp) && (earliestOn === null || timestamp < earliestOn)) earliestOn = timestamp;
      }
    });

    if (earliestOn === null && roomEntity?.last_changed) {
      const timestamp = Date.parse(roomEntity.last_changed);
      if (!Number.isNaN(timestamp)) earliestOn = timestamp;
    }

    const elapsed = earliestOn !== null ? this._elapsed(Date.now() - earliestOn) : '';
    const lightLabel = count === 1 ? '1 light' : `${count} lights`;
    return { count, label: count > 0 ? `${lightLabel}${elapsed ? ` / ${elapsed}` : ''}` : 'Apagada' };
  }

  _sensorValue(entityId, suffix = '') {
    const entity = this._state(entityId);
    if (this._isUnavailable(entity)) return '--';
    return `${BrunoMobileSalaCard._escape(entity.state)}${suffix}`;
  }

  _presenceRecent() {
    // NOVO (2026-07-12): usa somente a presenca supervisionada.
    const supervisedMotion = this._state(this._config.entities.motion_recent);
    return supervisedMotion?.state === 'on';

    /* ANTERIOR (rollback): presence bruta com janela artificial de 10 minutos.
    const entity = this._state(this._config.entities.presence);
    if (entity?.state !== 'on' || !entity.last_changed) return false;
    const changedAt = Date.parse(entity.last_changed);
    return !Number.isNaN(changedAt) && Date.now() - changedAt < 10 * 60 * 1000;
    */
  }

  _semanticLine() {
    const semantic = this._state(this._config.entities.semantic_sensor);
    const state = String(semantic?.state || '').toLowerCase();
    const display = String(semantic?.attributes?.display || '').trim();
    if (display && !['none', 'unknown', 'unavailable'].includes(state)) return display;
    return '';
  }

  _climateAction(entity) {
    return String(entity?.attributes?.hvac_action || '').toLowerCase();
  }

  _climateIsActive(entity) {
    if (this._isUnavailable(entity) || entity.state === 'off') return false;
    const hvacAction = this._climateAction(entity);
    if (BRUNO_MOBILE_SALA_CLIMATE_ACTIVE_ACTIONS.includes(hvacAction)) return true;
    if (BRUNO_MOBILE_SALA_CLIMATE_INACTIVE_ACTIONS.includes(hvacAction)) return false;
    return BRUNO_MOBILE_SALA_CLIMATE_ON_STATES.includes(entity?.state || '');
  }

  _tvLabel(entity) {
    if (!entity) return 'Desligada';
    if (entity.state === 'playing') return 'Tocando';
    if (entity.state === 'paused') return 'Pausada';
    if (['on', 'idle'].includes(entity.state)) return 'Ligada';
    return 'Desligada';
  }

  _climateLabel(entity) {
    const hvacAction = this._climateAction(entity);
    if (hvacAction === 'idle') return 'Em espera';
    if (!this._climateIsActive(entity)) return 'Desligado';
    const temperature = entity?.attributes?.temperature;
    return Number.isFinite(Number(temperature)) ? `${Number(temperature)}\u00b0` : 'Ligado';
  }

  _model() {
    const entities = this._config.entities;
    const room = this._state(entities.room_group);
    const tv = this._state(entities.tv);
    const climate = this._state(entities.climate);
    const corridor = this._state(entities.corridor);
    const roomOn = room?.state === 'on';

    return {
      roomOn,
      tvOn: BRUNO_MOBILE_SALA_TV_ON_STATES.includes(tv?.state || ''),
      climateOn: this._climateIsActive(climate),
      speakerOn: BRUNO_MOBILE_SALA_SPEAKER_ON_STATES.includes(this._state(entities.speaker)?.state || ''),
      corridorOn: corridor?.state === 'on',
      presenceOn: this._presenceRecent(),
      semanticLine: this._semanticLine(),
      temperature: this._sensorValue(entities.temperature, '\u00b0'),
      humidity: this._sensorValue(entities.humidity, '%'),
      lights: this._lightsSummary(room),
      tvLabel: this._tvLabel(tv),
      climateLabel: this._climateLabel(climate),
      corridorLabel: corridor?.state === 'on' ? 'Ligado' : 'Desligado',
    };
  }

  _runAction(key, gesture) {
    const entities = this._config.entities;

    if (key === 'room') {
      if (gesture === 'double') return this._navigate(this._config.navigation_path);
      if (gesture === 'hold') return this._callService('light.turn_off', {}, { entity_id: entities.room_group });
      return this._callService('light.toggle', {}, { entity_id: entities.room_toggle });
    }

    if (key === 'corridor') {
      if (gesture === 'tap' && this._isActionCoolingDown(key)) return;
      if (gesture === 'hold') return this._moreInfo(entities.corridor);
      return this._toggleEntity(entities.corridor);
    }

    if (key === 'tv') {
      if (gesture === 'tap' && this._isActionCoolingDown(key)) return;
      if (gesture === 'hold') return this._moreInfo(entities.tv);
      return this._toggleEntity(entities.tv);
    }

    if (key === 'climate') {
      if (gesture === 'tap' && this._isActionCoolingDown(key)) return;
      if (gesture === 'hold') return this._moreInfo(entities.climate);
      const service = this._climateIsActive(this._state(entities.climate)) ? 'climate.turn_off' : 'climate.turn_on';
      this._callService(service, {}, { entity_id: entities.climate });
    }
  }

  _isActionCoolingDown(key) {
    this._lastActionAt = this._lastActionAt || {};
    const now = Date.now();
    const cooldown = key === 'climate' ? BRUNO_MOBILE_SALA_CLIMATE_COOLDOWN : BRUNO_MOBILE_SALA_ACTION_COOLDOWN;
    if (now - (this._lastActionAt[key] || 0) < cooldown) return true;
    this._lastActionAt[key] = now;
    return false;
  }

  _callService(serviceName, data = {}, target = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;
    const serviceData = { ...data };
    if (target?.entity_id != null && serviceData.entity_id == null) serviceData.entity_id = target.entity_id;
    this._hass.callService(domain, service, serviceData, target);
  }

  _toggleEntity(entityId) {
    if (entityId) this._callService('homeassistant.toggle', {}, { entity_id: entityId });
  }

  _navigate(path) {
    if (!path) return;
    const resolvedPath = this._resolveNavigationPath(path);
    const eventPath = path.startsWith('/') ? resolvedPath : path;
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: eventPath },
      bubbles: true,
      composed: true,
    }));
    window.setTimeout(() => {
      if (!resolvedPath || window.location?.pathname === resolvedPath) return;
      window.history?.pushState?.(null, '', resolvedPath);
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

  _wireAction(button) {
    const key = button.dataset.actionKey;
    if (!key) return;
    let holdTimer = null;
    let tapTimer = null;
    let holdFired = false;
    const tapDelay = 440;

    const reset = () => {
      if (holdTimer) window.clearTimeout(holdTimer);
      holdTimer = null;
      button.classList.remove('is-pressed');
    };

    const runTap = () => this._runAction(key, 'tap');
    const runDouble = () => {
      if (tapTimer) window.clearTimeout(tapTimer);
      tapTimer = null;
      this._runAction(key, 'double');
    };

    button.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
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
      event.preventDefault();
      event.stopPropagation();
      button.releasePointerCapture?.(event.pointerId);
      reset();
      if (holdFired) return;
      if (key === 'room') {
        if (tapTimer) return runDouble();
        tapTimer = window.setTimeout(() => {
          tapTimer = null;
          runTap();
        }, tapDelay);
        return;
      }
      runTap();
    });

    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
      if (key === 'room') runDouble();
    });

    button.addEventListener('pointerleave', reset);
    button.addEventListener('pointercancel', reset);
  }

  _statusDot(icon, active, label, tone) {
    return `
      <span class="status-dot tone-${tone}${active ? ' is-active' : ''}" title="${BrunoMobileSalaCard._escape(label)}">
        <bruno-icon icon="${icon}"></bruno-icon>
      </span>
    `;
  }

  _actionButton(key, icon, name, label, active, tone) {
    return `
      <button class="action-pill tone-${tone}${active ? ' is-active' : ''}" type="button" data-action-key="${key}" aria-label="${BrunoMobileSalaCard._escapeAttr(name)}">
        <span class="pill-icon"><bruno-icon icon="${icon}"></bruno-icon></span>
        <span class="pill-text">
          <span class="pill-name">${BrunoMobileSalaCard._escape(name)}</span>
          <span class="pill-label">${label}</span>
        </span>
        <span class="pill-power" aria-hidden="true"></span>
      </button>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const model = this._model();
    const icon = model.roomOn ? this._config.icon.on : this._config.icon.off;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          height: 168px;
          min-width: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .sala-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(136px, 0.92fr);
          gap: 10px;
          padding: 12px;
          color: rgba(248,251,255,0.95);
          border-radius: var(--bruno-liquid-card-radius-compact, 18px);
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.18));
          background: var(--bruno-liquid-surface-off-background);
          box-shadow: var(--bruno-liquid-surface-off-shadow);
          backdrop-filter: var(--bruno-liquid-surface-off-filter);
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter);
          overflow: hidden;
        }

        .sala-card::before,
        .sala-card::after {
          content: "";
          position: absolute;
          inset: 1px;
          border-radius: calc(var(--bruno-liquid-card-radius-compact, 18px) - 1px);
          pointer-events: none;
          z-index: 0;
        }

        .sala-card::before {
          background: var(--bruno-liquid-surface-off-sheen);
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.82);
        }

        .sala-card::after {
          padding: 1px;
          background: var(--bruno-liquid-surface-edge-glow);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: 0.8;
        }

        .sala-card.is-on {
          border-color: var(--bruno-liquid-surface-on-border-color, rgba(255,255,255,0.32));
          background: var(--bruno-liquid-surface-on-background);
          box-shadow: var(--bruno-liquid-surface-on-shadow);
          backdrop-filter: var(--bruno-liquid-surface-on-filter);
          -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter);
        }

        .sala-card.is-on::before {
          background: var(--bruno-liquid-surface-on-sheen);
          opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
        }

        .hero-action,
        .action-pill {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          z-index: 1;
          border: 0;
          outline: none;
        }

        .hero-action {
          min-width: 0;
          display: grid;
          grid-template-columns: 78px minmax(0, 1fr) 30px;
          grid-template-rows: auto auto 1fr;
          align-items: start;
          gap: 0 8px;
          padding: 0;
          background: transparent;
          text-align: left;
        }

        .room-icon {
          grid-row: 1 / span 2;
          width: 72px;
          height: 72px;
          object-fit: contain;
          object-position: left top;
          filter: drop-shadow(0 8px 12px rgba(0,0,0,0.34));
        }

        .metric {
          margin-top: 2px;
          min-width: 0;
          line-height: 1;
        }

        .metric strong {
          display: block;
          font-size: 13px;
          font-weight: 780;
        }

        .metric span {
          display: block;
          margin-top: 5px;
          font-size: 11px;
          font-weight: 650;
          color: rgba(255,255,255,0.58);
        }

        .right-dots {
          grid-row: 1 / span 3;
          grid-column: 3;
          justify-self: end;
          display: flex;
          flex-direction: column;
          gap: 5px;
        }

        .status-dot {
          width: 27px;
          height: 27px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: rgba(255,255,255,0.38);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.13);
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
        }

        .status-dot bruno-icon {
          --mdc-icon-size: 14px;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .status-dot.is-active {
          color: rgba(var(--tone),0.98);
          background: rgba(var(--tone),0.14);
          border-color: rgba(var(--tone),0.38);
          box-shadow: 0 0 14px rgba(var(--tone),0.16);
        }

        .tone-blue { --tone: 96, 165, 250; }
        .tone-purple { --tone: 167, 139, 250; }
        .tone-cyan { --tone: 79, 172, 254; }
        .tone-amber { --tone: 255, 153, 0; }

        .title {
          grid-column: 1 / span 2;
          align-self: end;
          margin-top: auto;
          font-size: 16px;
          line-height: 1.1;
          font-weight: 780;
          text-shadow: 0 3px 12px rgba(0,0,0,0.28);
        }

        .lights {
          grid-column: 1 / span 2;
          margin-top: 4px;
          font-size: 11px;
          line-height: 1;
          font-weight: 560;
          color: rgba(255,255,255,0.55);
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
        }

        .actions {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-rows: repeat(3, 1fr);
          gap: 7px;
          min-width: 0;
        }

        .action-pill {
          display: grid;
          grid-template-columns: 34px minmax(0, 1fr) 25px;
          align-items: center;
          gap: 7px;
          min-width: 0;
          padding: 5px 7px;
          border-radius: 15px;
          color: rgba(255,255,255,0.82);
          background: linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.046));
          border: 1px solid rgba(255,255,255,0.15);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
          transition: transform 160ms ease, filter 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .action-pill.is-active {
          border-color: rgba(var(--tone),0.58);
          background:
            radial-gradient(44px 30px at 22% 16%, rgba(255,255,255,0.18), transparent 72%),
            linear-gradient(180deg, rgba(var(--tone),0.26), rgba(var(--tone),0.10)),
            linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.04));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 18px rgba(var(--tone),0.20);
        }

        .hero-action.is-pressed,
        .action-pill.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .pill-icon {
          width: 31px;
          height: 31px;
          display: grid;
          place-items: center;
          border-radius: 10px;
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.54);
        }

        .action-pill.is-active .pill-icon {
          color: rgba(var(--tone),0.98);
          background: rgba(var(--tone),0.18);
        }

        .pill-icon bruno-icon {
          --mdc-icon-size: 20px;
        }

        .pill-text {
          min-width: 0;
          display: grid;
          gap: 3px;
        }

        .pill-name,
        .pill-label {
          min-width: 0;
          overflow: hidden;
          white-space: nowrap;
          text-overflow: ellipsis;
          line-height: 1;
        }

        .pill-name {
          font-size: 11px;
          font-weight: 780;
        }

        .pill-label {
          font-size: 9px;
          font-weight: 650;
          color: rgba(255,255,255,0.48);
        }

        .pill-power {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          justify-self: end;
          background: rgba(255,255,255,0.72);
          box-shadow: inset 0 0 0 1px rgba(0,0,0,0.18);
        }

        .action-pill.is-active .pill-power {
          background: rgba(var(--tone),0.98);
          box-shadow: 0 0 14px rgba(var(--tone),0.42);
        }
      </style>

      <div class="sala-card${model.roomOn ? ' is-on' : ''}">
        <button class="hero-action" type="button" data-action-key="room" aria-label="Sala">
          <img class="room-icon" src="${BrunoMobileSalaCard._escapeAttr(icon)}" alt="">
          <div class="metric">
            <strong>${model.temperature}</strong>
            <span>${model.humidity}</span>
          </div>
          <div class="right-dots" aria-label="Status da sala">
            ${this._statusDot('mdi:account', model.presenceOn, 'Presenca recente', 'blue')}
            ${this._statusDot('mdi:television-classic', model.tvOn, 'TV ativa', 'purple')}
            ${this._statusDot('mdi:snowflake', model.climateOn, 'Ar condicionado ativo', 'cyan')}
            ${this._statusDot('mdi:speaker-wireless', model.speakerOn, 'Echo Show ativo', 'amber')}
          </div>
          <div class="title">${BrunoMobileSalaCard._escape(this._config.name)}</div>
          <div class="lights">${BrunoMobileSalaCard._escape(model.semanticLine || model.lights.label)}</div>
        </button>
        <div class="actions">
          ${this._actionButton('corridor', 'mdi:led-strip-variant', 'Corredor', BrunoMobileSalaCard._escape(model.corridorLabel), model.corridorOn, 'blue')}
          ${this._actionButton('tv', 'mdi:television-classic', 'TV', BrunoMobileSalaCard._escape(model.tvLabel), model.tvOn, 'purple')}
          ${this._actionButton('climate', 'mdi:air-conditioner', 'A/C', BrunoMobileSalaCard._escape(model.climateLabel), model.climateOn, 'cyan')}
        </div>
      </div>
    `;

    this.shadowRoot.querySelectorAll('[data-action-key]').forEach((button) => this._wireAction(button));
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoMobileSalaCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_MOBILE_SALA_CARD_TAG)) {
  customElements.define(BRUNO_MOBILE_SALA_CARD_TAG, BrunoMobileSalaCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_MOBILE_SALA_CARD_TAG,
  name: 'Bruno Mobile Sala Card',
  preview: false,
  description: 'Mobile horizontal Sala card preserving Home Assistant actions with Bruno liquid glass visuals.',
});
