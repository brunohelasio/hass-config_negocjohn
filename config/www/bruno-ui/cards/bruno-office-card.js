const BRUNO_OFFICE_CARD_TAG = 'bruno-office-card';

const BRUNO_OFFICE_DEFAULT_ENTITIES = {
  room_group: 'light.grupo_luzes_office',
  room_toggle: 'light.office_switch_3',
  room_fallback_lights: ['light.office_switch_1', 'light.office_switch_2', 'light.office_switch_3'],
  active_sensor: 'sensor.office_active',
  semantic_sensor: 'sensor.office_semantic_state',
  occupancy: 'binary_sensor.office_occupancy',
  pc_active: 'binary_sensor.office_pc_active',
  pc_fallback: 'switch.macbook',
  meeting: 'binary_sensor.office_meeting_active',
  climate: 'climate.ac_office',
  speaker: 'media_player.echo_pop_office',
  temperature: [
    'sensor.office_temp_humid_temperature',
    'sensor.of_sensor_temp_humid_temperatura',
    'sensor.temperatura_office',
    'sensor.office_temperatura',
    'sensor.of_temperatura',
  ],
  humidity: [
    'sensor.office_temp_humid_humidity',
    'sensor.of_sensor_temp_humid_umidade',
    'sensor.umidade_office',
    'sensor.office_umidade',
    'sensor.of_umidade',
  ],
};

const BRUNO_OFFICE_CLIMATE_ON_STATES = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const BRUNO_OFFICE_SPEAKER_ON_STATES = ['playing', 'on', 'paused'];
const BRUNO_OFFICE_ACTION_COOLDOWN = 1200;

class BrunoOfficeCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_OFFICE_DEFAULT_ENTITIES,
      ...(config?.entities || {}),
    };

    this._config = {
      name: 'Office',
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

  _isUnavailable(entity) {
    return !entity || ['unknown', 'unavailable', 'none', ''].includes(String(entity.state || '').toLowerCase());
  }

  _entityList(value) {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }

  _firstValid(entityIds) {
    for (const entityId of this._entityList(entityIds)) {
      const entity = this._state(entityId);
      if (!this._isUnavailable(entity)) return entity;
    }
    return null;
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

    const fallbackIds = Array.isArray(entities.room_fallback_lights)
      ? entities.room_fallback_lights
      : BRUNO_OFFICE_DEFAULT_ENTITIES.room_fallback_lights;
    if (count === null) {
      count = fallbackIds.filter((id) => this._state(id)?.state === 'on').length;
    }

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

    const elapsed = earliestOn !== null ? this._elapsed(Date.now() - earliestOn) : '';
    const label = count === 1 ? '1 light' : `${count} lights`;

    return {
      count,
      elapsed,
      label: count > 0 ? `${label}${elapsed ? ` / ${elapsed}` : ''}` : '',
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

  _sensorValue(entityIds, suffix = '') {
    const entity = this._firstValid(entityIds);
    if (!entity) return '--';
    return `${BrunoOfficeCard._escape(entity.state)}${suffix}`;
  }

  _semanticLine() {
    const semantic = this._state(this._config.entities.semantic_sensor);
    const semanticState = String(semantic?.state || '').toLowerCase();
    const display = semantic?.attributes?.display;
    if (!display || ['none', 'unknown', 'unavailable'].includes(semanticState)) return '';
    return String(display);
  }

  _meetingOn() {
    return this._state(this._config.entities.meeting)?.state === 'on'
      || this._state(this._config.entities.semantic_sensor)?.state === 'meeting';
  }

  _climateOn(entity) {
    if (this._isUnavailable(entity) || entity.state === 'off') return false;
    return BRUNO_OFFICE_CLIMATE_ON_STATES.includes(entity.state) || entity.state !== 'off';
  }

  _model() {
    const entities = this._config.entities;
    const room = this._state(entities.room_group);
    const climate = this._state(entities.climate);
    const speaker = this._state(entities.speaker);
    const roomOn = room?.state === 'on';
    const pcFallbackOn = this._state(entities.pc_fallback)?.state === 'on';
    const lights = this._lightsSummary(room);
    const statusLines = [];
    const semanticLine = this._semanticLine();

    if (lights.label) {
      statusLines.push(lights.label);
    } else if (roomOn) {
      statusLines.push('On');
    }
    if (semanticLine) statusLines.push(semanticLine);

    return {
      roomOn,
      iconActive: roomOn || pcFallbackOn,
      meetingOn: this._meetingOn(),
      presenceOn: this._state(entities.occupancy)?.state === 'on',
      pcOn: this._state(entities.pc_active)?.state === 'on' || pcFallbackOn,
      climateOn: this._climateOn(climate),
      speakerOn: BRUNO_OFFICE_SPEAKER_ON_STATES.includes(speaker?.state || ''),
      temperature: this._sensorValue(entities.temperature, '&deg;'),
      humidity: this._sensorValue(entities.humidity, '%'),
      statusLines,
    };
  }

  _runAction(key, gesture) {
    if (key !== 'room') return;
    globalThis.BrunoLiquidGlass?.feedback?.(gesture === 'hold' ? 'hold' : 'tap');

    const entities = this._config.entities;
    if (gesture === 'double') {
      this._runConfiguredAction(this._config.double_tap_action, entities.room_group);
      return;
    }
    if (gesture === 'hold') {
      this._callService('light.turn_off', {}, { entity_id: entities.room_group });
      return;
    }
    if (this._isActionCoolingDown(key)) return;
    this._callService('light.toggle', {}, { entity_id: entities.room_toggle });
  }

  _isActionCoolingDown(key) {
    this._lastActionAt = this._lastActionAt || {};
    const now = Date.now();
    const previous = this._lastActionAt[key] || 0;
    if (now - previous < BRUNO_OFFICE_ACTION_COOLDOWN) return true;
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
    let tapTimer = null;
    let holdFired = false;
    let lastDoubleAt = 0;
    let lastTapActionAt = 0;
    const tapDelay = 520;

    const clearHold = () => {
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const clearTap = () => {
      if (tapTimer) {
        window.clearTimeout(tapTimer);
        tapTimer = null;
      }
    };

    const resetPress = () => {
      clearHold();
      button.classList.remove('is-pressed');
    };

    const runDouble = () => {
      const now = Date.now();
      if (now - lastDoubleAt < 300) return;
      lastDoubleAt = now;
      clearTap();
      lastTapActionAt = now;
      this._runAction(key, 'double');
    };

    const runTap = () => {
      const now = Date.now();
      if (now - lastTapActionAt < 280) return;
      lastTapActionAt = now;
      this._runAction(key, 'tap');
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
      resetPress();
      if (holdFired) return;

      if (tapTimer) {
        runDouble();
        return;
      }

      tapTimer = window.setTimeout(() => {
        tapTimer = null;
        if (Date.now() - lastDoubleAt < tapDelay) return;
        runTap();
      }, tapDelay);
    });

    button.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();

      if (event.detail >= 2) {
        resetPress();
        runDouble();
      }
    });

    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
      resetPress();
      runDouble();
    });

    button.addEventListener('pointerleave', resetPress);
    button.addEventListener('pointercancel', resetPress);

    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._runAction(key, 'tap');
    });
  }

  _wireAssetFallback() {
    this.shadowRoot
      ?.querySelectorAll('.office-asset')
      .forEach((asset) => {
        asset.addEventListener('error', () => {
          asset.closest('.office-icon')?.classList.add('has-image-error');
        }, { once: true });
      });
  }

  _statusDot(icon, active, label, tone) {
    const activeClass = active ? ' is-active' : '';
    return `
      <span class="status-dot tone-${tone}${activeClass}" title="${BrunoOfficeCard._escape(label)}" aria-label="${BrunoOfficeCard._escape(label)}">
        <ha-icon icon="${icon}"></ha-icon>
      </span>
    `;
  }

  _statusLines(lines) {
    if (!lines.length) return '';
    return lines
      .map((line) => `<span>${BrunoOfficeCard._escape(line)}</span>`)
      .join('');
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const roomActiveClass = model.roomOn ? ' is-room-on' : '';
    const meetingClass = model.meetingOn ? ' is-meeting' : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-room-radius, var(--bruno-liquid-card-radius-compact, 16px));
          --accent: 150, 190, 255;
          --accent-blue: 96, 165, 250;
          --accent-purple: 167, 139, 250;
          --accent-cyan: 79, 172, 254;
          --accent-amber: 255, 153, 0;
          --accent-red: 248, 113, 113;
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

        .office-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          max-width: 100%;
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

        .office-card::before,
        .office-card::after {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .office-card::before {
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

        .office-card::after {
          inset: auto 16px 8px 16px;
          height: 1px;
          border-radius: 999px;
          background: var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent));
          opacity: var(--bruno-liquid-surface-bottom-line-opacity, 0);
        }

        .office-card.is-room-on {
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

        .office-card.is-room-on::before {
          background: var(--bruno-liquid-surface-on-sheen,
            radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%),
            radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%),
            radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%),
            linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%)
          );
          opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
        }

        .office-card.is-meeting {
          --accent: var(--accent-red);
          border-color: rgba(var(--accent-red),0.38);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.24),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset 0 -1px 0 rgba(0,0,0,0.18),
            0 0 24px rgba(var(--accent-red),0.20),
            0 18px 42px rgba(0,0,0,0.30);
        }

        .office-card.is-meeting .office-action::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: -1;
          background:
            radial-gradient(120px 92px at 13% 8%, rgba(var(--accent-red),0.16), transparent 72%),
            linear-gradient(145deg, rgba(127,29,29,0.11), rgba(239,68,68,0.035));
          pointer-events: none;
        }

        .office-action {
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: grid;
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

        .office-action:hover {
          filter: brightness(1.05);
        }

        .office-action.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .office-action.is-hold-fired {
          filter: drop-shadow(0 0 18px rgba(var(--accent),0.28));
        }

        .room-icon {
          grid-area: icon;
          justify-self: start;
          align-self: start;
          position: relative;
          width: 94px;
          height: 94px;
          margin-left: -8px;
          margin-top: -8px;
        }

        .office-icon {
          position: absolute;
          inset: 0;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: block;
          transition: opacity 180ms ease, filter 180ms ease;
          filter: var(--office-icon-filter, none);
        }

        .office-card.is-room-on .office-icon {
          --office-icon-filter: drop-shadow(2px 3px 6px rgba(0,0,0,0.32)) contrast(1.1);
        }

        .office-card.is-meeting .office-icon {
          opacity: 0.54;
          filter: grayscale(0.55) brightness(0.72) contrast(0.92);
        }

        .office-card.is-meeting.is-room-on .office-icon {
          opacity: 0.68;
          filter: saturate(0.52) brightness(0.82) contrast(0.94) drop-shadow(0 0 6px rgba(0,0,0,0.22));
        }

        .office-asset-wrap,
        .office-asset-fallback,
        .office-asset {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .office-asset {
          object-fit: contain;
          opacity: 0;
          transform: translateZ(0);
          filter: drop-shadow(0 6px 8px rgba(0,0,0,0.22));
          transition: opacity 420ms ease, filter 420ms ease, transform 420ms ease;
        }

        .office-asset-off {
          opacity: 1;
        }

        .office-card.is-room-on .office-asset-off {
          opacity: 0;
        }

        .office-card.is-room-on .office-asset-on {
          opacity: 1;
          filter: drop-shadow(0 6px 9px rgba(0,0,0,0.20)) drop-shadow(0 0 12px rgba(255,187,72,0.14));
          transform: translateY(-1px) scale(1.01);
        }

        .office-asset-fallback {
          opacity: 0;
          pointer-events: none;
        }

        .office-asset-fallback svg {
          width: 100%;
          height: 100%;
          display: block;
        }

        .office-icon.has-image-error .office-asset {
          display: none;
        }

        .office-icon.has-image-error .office-asset-fallback {
          opacity: 1;
        }

        .meeting-icon {
          position: absolute;
          z-index: 2;
          left: -2px;
          top: -2px;
          width: 98px;
          height: 98px;
          pointer-events: none;
          filter: drop-shadow(0 0 10px rgba(var(--accent-red),0.42));
        }

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

        .title {
          grid-area: title;
          justify-self: start;
          align-self: end;
          min-width: 0;
          margin-top: 4px;
          margin-bottom: 2px;
          font-size: 15px;
          line-height: 1.18;
          font-weight: 700;
          color: var(--text-main);
          white-space: nowrap;
        }

        .status-lines {
          grid-area: state;
          justify-self: start;
          align-self: start;
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

        .status-dot ha-icon {
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

        .status-dot.is-active ha-icon {
          filter: drop-shadow(0 0 5px rgba(var(--tone),0.56));
        }

        .tone-blue { --tone: var(--accent-blue); }
        .tone-purple { --tone: var(--accent-purple); }
        .tone-cyan { --tone: var(--accent-cyan); }
        .tone-amber { --tone: var(--accent-amber); }

        @keyframes officeMeetingPulse {
          0%, 100% { opacity: .78; transform: scale(.98); }
          50% { opacity: 1; transform: scale(1.03); }
        }

        @keyframes officeMeetingSlash {
          0%, 100% { stroke-opacity: .82; }
          50% { stroke-opacity: 1; }
        }

        .meeting-pulse {
          transform-origin: center;
          animation: officeMeetingPulse 2.6s ease-in-out infinite;
        }

        .meeting-slash {
          animation: officeMeetingSlash 1.8s ease-in-out infinite;
        }

        @media (max-height: 760px) {
          .office-action {
            padding: 12px 52px 12px 11px;
          }

          .room-icon {
            width: 86px;
            height: 86px;
          }

          .meeting-icon {
            width: 90px;
            height: 90px;
          }

          .right-dots {
            top: 13px;
            right: 12px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .office-action,
          .status-dot,
          .office-icon,
          .meeting-pulse,
          .meeting-slash {
            animation: none !important;
            transition: none !important;
          }
        }
      </style>

      <div class="office-card${roomActiveClass}${meetingClass}">
        <button class="office-action" type="button" data-action-key="room" aria-label="${BrunoOfficeCard._escape(this._config.name)}">
          <div class="room-icon" aria-hidden="true">
            <span class="office-icon">${BrunoOfficeCard._officeVisual(model.iconActive)}</span>
            ${model.meetingOn ? BrunoOfficeCard._meetingIcon() : ''}
          </div>

          <div class="metric">
            <span class="metric-value">${model.temperature}</span>
            <span class="metric-sub">${model.humidity}</span>
          </div>

          <div class="title">${BrunoOfficeCard._escape(this._config.name)}</div>
          <div class="status-lines">${this._statusLines(model.statusLines)}</div>

          <div class="right-dots" aria-label="Status do Office">
            ${this._statusDot('mdi:account', model.presenceOn, 'Presenca no Office', 'blue')}
            ${this._statusDot('mdi:desktop-classic', model.pcOn, 'PC ativo', 'purple')}
            ${this._statusDot('mdi:snowflake', model.climateOn, 'Ar condicionado ativo', 'cyan')}
            ${this._statusDot('mdi:speaker-wireless', model.speakerOn, 'Echo Pop ativo', 'amber')}
          </div>
        </button>
      </div>
    `;

    this.shadowRoot
      .querySelectorAll('[data-action-key]')
      .forEach((button) => this._wireAction(button));
    this._wireAssetFallback();
  }

  static _officeVisual(active) {
    const version = '20260607-office-asset-clean-1';
    return `
      <span class="office-asset-wrap">
        <span class="office-asset-fallback">${BrunoOfficeCard._officeIcon(active)}</span>
        <img class="office-asset office-asset-off" src="/local/bruno-ui/assets/office-off.png?v=${version}" alt="" loading="eager" decoding="async">
        <img class="office-asset office-asset-on" src="/local/bruno-ui/assets/office-on.png?v=${version}" alt="" loading="eager" decoding="async">
      </span>
    `;
  }

  static _officeIcon(active) {
    if (active) {
      return `
        <svg data-name="Layer 3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41.91 41.91">
          <defs>
            <linearGradient id="office-b" x1="29.6" y1="45.46" x2="29.6" y2="6.68" gradientTransform="matrix(1 0 0 -1 0 44.53)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffb900"/><stop offset=".17" stop-color="#ef8400"/><stop offset=".31" stop-color="#e25c01"/><stop offset=".43" stop-color="#db4401"/><stop offset=".5" stop-color="#d83b01"/></linearGradient>
            <linearGradient id="office-c" x1="22.61" y1="44.09" x2="2.07" y2="14.77" gradientTransform="matrix(1 0 0 -1 0 44.53)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#800600"/><stop offset=".6" stop-color="#c72127"/><stop offset=".73" stop-color="#c13959"/><stop offset=".85" stop-color="#bc4b81"/><stop offset=".94" stop-color="#b95799"/><stop offset="1" stop-color="#b85ba2"/></linearGradient>
            <linearGradient id="office-d" x1="12.12" y1="8.1" x2="38.93" y2="8.1" gradientTransform="matrix(1 0 0 -1 0 44.53)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#f32b44"/><stop offset=".6" stop-color="#a4070a"/></linearGradient>
            <linearGradient id="office-a" x1="23.03" y1="44.69" x2="18.68" y2="38.48" gradientTransform="matrix(1 0 0 -1 0 44.53)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-opacity=".4"/><stop offset="1" stop-opacity="0"/></linearGradient>
            <linearGradient id="office-e" x1="30.33" y1="7.5" x2="18.33" y2="8.55" href="#office-a"/>
          </defs>
          <g data-name="Icons - Color">
            <g data-name="Desktop - Full Bleed">
              <g style="opacity:.2"><path d="M13.05 32.09c-1.16.01-2.1.97-2.09 2.13 0 .74.4 1.42 1.04 1.8l7.44 4.22a4.053 4.053 0 0 0 3.13.37l11.19-3.19c1.71-.49 2.9-2.06 2.9-3.84V32.1H13.05Z" style="fill:#fff"/></g>
              <g style="opacity:.12"><path d="M13.05 32.09c-1.16.01-2.1.97-2.09 2.13 0 .74.4 1.42 1.04 1.8l7.44 4.22a4.053 4.053 0 0 0 3.13.37l11.19-3.19c1.71-.49 2.9-2.06 2.9-3.84V32.1H13.05Z" style="fill:#fff"/></g>
              <path d="m22.53 1.31 3.01 6.88v23.9l-2.96 8.51 11.19-3.19c1.71-.49 2.9-2.06 2.9-3.84V8.34c0-1.79-1.19-3.36-2.91-3.85L22.53 1.31Z" style="fill:url(#office-b)"/>
              <path d="m8.34 31.83 3.27-1.77c.91-.5 1.48-1.46 1.48-2.51V14.69c0-1.2.75-2.27 1.88-2.68l10.56-3.82v-2.9c0-1.85-1.23-3.47-3.01-3.98-.37-.11-.75-.16-1.13-.16-.72 0-1.43.19-2.06.54L7.26 8.59a3.996 3.996 0 0 0-2.02 3.47v17.92c0 1.16.94 2.1 2.1 2.11.35 0 .7-.09 1.01-.25Z" style="fill:url(#office-c)"/>
              <path d="M25.54 32.09H13.05c-1.16.01-2.1.97-2.09 2.13 0 .74.4 1.42 1.04 1.8l7.44 4.22a4.053 4.053 0 0 0 3.13.37c1.76-.5 2.96-2.1 2.96-3.93V32.1Z" style="fill:url(#office-d)"/>
              <path d="m8.34 31.83 3.27-1.77c.91-.5 1.48-1.46 1.48-2.51V14.69c0-1.2.75-2.27 1.88-2.68l10.56-3.82v-2.9c0-1.85-1.23-3.47-3.01-3.98-.37-.11-.75-.16-1.13-.16-.72 0-1.43.19-2.06.54L7.26 8.59a3.996 3.996 0 0 0-2.02 3.47v17.92c0 1.16.94 2.1 2.1 2.11.35 0 .7-.09 1.01-.25Z" style="fill:url(#office-a)"/>
              <path d="M25.54 32.09H13.05c-1.16.01-2.1.97-2.09 2.13 0 .74.4 1.42 1.04 1.8l7.44 4.22a4.053 4.053 0 0 0 3.13.37c1.76-.5 2.96-2.1 2.96-3.93V32.1Z" style="fill:url(#office-e)"/>
              <path style="fill:none" d="M0 0h41.91v41.91H0z"/>
            </g>
          </g>
        </svg>
      `;
    }

    return `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 41.91 41.91">
        <defs>
          <linearGradient id="office-off-d" x1="29.6" y1="414.54" x2="29.6" y2="453.32" gradientTransform="translate(0 -415.47)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#d5d5d5"/><stop offset=".17" stop-color="#bfbfbf"/><stop offset=".31" stop-color="#aeaeae"/><stop offset=".43" stop-color="#a5a5a5"/><stop offset=".5" stop-color="#a0a0a0"/></linearGradient>
          <linearGradient id="office-off-e" x1="22.61" y1="415.91" x2="2.07" y2="445.23" gradientTransform="translate(0 -415.47)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7d7d7d"/><stop offset=".6" stop-color="#979797"/><stop offset=".73" stop-color="#a2a2a2"/><stop offset=".85" stop-color="#aaa"/><stop offset=".94" stop-color="#b0b0b0"/><stop offset="1" stop-color="#b2b2b2"/></linearGradient>
          <linearGradient id="office-off-f" x1="12.12" y1="451.9" x2="38.93" y2="451.9" gradientTransform="translate(0 -415.47)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#a5a5a5"/><stop offset=".6" stop-color="#858585"/></linearGradient>
          <linearGradient id="office-off-g" x1="23.03" y1="415.31" x2="18.68" y2="421.52" gradientTransform="translate(0 -415.47)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#646464" stop-opacity=".4"/><stop offset="1" stop-color="#646464" stop-opacity="0"/></linearGradient>
          <linearGradient id="office-off-h" x1="30.33" y1="452.51" x2="18.33" y2="451.46" gradientTransform="translate(0 -415.47)" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#646464" stop-opacity=".4"/><stop offset="1" stop-color="#646464" stop-opacity="0"/></linearGradient>
        </defs>
        <g>
          <g>
            <g style="opacity:.2;"><path d="M13.05,32.09c-1.16,0-2.1,.97-2.09,2.13,0,.74,.4,1.42,1.04,1.8l7.44,4.22c.61,.35,1.31,.53,2.01,.53,.38,0,.76-.06,1.12-.16l11.19-3.19c1.71-.49,2.9-2.06,2.9-3.84v-1.48H13.05Z" style="fill:#fff;"/></g>
            <g style="opacity:.12;"><path d="M13.05,32.09c-1.16,0-2.1,.97-2.09,2.13,0,.74,.4,1.42,1.04,1.8l7.44,4.22c.61,.35,1.31,.53,2.01,.53,.38,0,.76-.06,1.12-.16l11.19-3.19c1.71-.49,2.9-2.06,2.9-3.84v-1.48H13.05Z" style="fill:#fff;"/></g>
            <path d="M22.53,1.31l3.01,6.88v23.9l-2.96,8.51,11.19-3.19c1.71-.49,2.9-2.06,2.9-3.84V8.34c0-1.79-1.19-3.36-2.91-3.85L22.53,1.31Z" style="fill:url(#office-off-d);"/>
            <path d="M8.34,31.83l3.27-1.77c.91-.5,1.48-1.46,1.48-2.51V14.69c0-1.2,.75-2.27,1.88-2.68l10.56-3.82v-2.9c0-1.85-1.23-3.47-3.01-3.98-.37-.11-.75-.16-1.13-.16h0c-.72,0-1.43,.19-2.06,.54L7.26,8.59c-1.25,.71-2.02,2.04-2.02,3.47V29.98c0,1.16,.94,2.1,2.1,2.11,.35,0,.7-.09,1.01-.25h-.01Z" style="fill:url(#office-off-e);"/>
            <path d="M25.54,32.09H13.05c-1.16,0-2.1,.97-2.09,2.13,0,.74,.4,1.42,1.04,1.8l7.44,4.22c.61,.35,1.31,.53,2.01,.53h0c.38,0,.76-.06,1.12-.16,1.76-.5,2.96-2.1,2.96-3.93v-4.58h0Z" style="fill:url(#office-off-f);"/>
            <path d="M8.34,31.83l3.27-1.77c.91-.5,1.48-1.46,1.48-2.51V14.69c0-1.2,.75-2.27,1.88-2.68l10.56-3.82v-2.9c0-1.85-1.23-3.47-3.01-3.98-.37-.11-.75-.16-1.13-.16h0c-.72,0-1.43,.19-2.06,.54L7.26,8.59c-1.25,.71-2.02,2.04-2.02,3.47V29.98c0,1.16,.94,2.1,2.1,2.11,.35,0,.7-.09,1.01-.25h-.01Z" style="fill:url(#office-off-g);"/>
            <path d="M25.54,32.09H13.05c-1.16,0-2.1,.97-2.09,2.13,0,.74,.4,1.42,1.04,1.8l7.44,4.22c.61,.35,1.31,.53,2.01,.53h0c.38,0,.76-.06,1.12-.16,1.76-.5,2.96-2.1,2.96-3.93v-4.58h0Z" style="fill:url(#office-off-h);"/>
            <rect width="41.91" height="41.91" style="fill:none;"/>
          </g>
        </g>
      </svg>
    `;
  }

  static _meetingIcon() {
    return `
      <svg class="meeting-icon" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <circle cx="25" cy="25" r="21" fill="rgba(127,29,29,0.34)" stroke="rgba(248,113,113,0.72)" stroke-width="2.5" class="meeting-pulse"/>
        <circle cx="25" cy="25" r="15.5" fill="none" stroke="rgba(254,202,202,0.92)" stroke-width="4.2"/>
        <line x1="14.2" y1="14.2" x2="35.8" y2="35.8" stroke="rgba(254,202,202,0.98)" stroke-width="5.2" stroke-linecap="round" class="meeting-slash"/>
        <circle cx="25" cy="25" r="22.5" fill="none" stroke="rgba(239,68,68,0.22)" stroke-width="5"/>
      </svg>
    `;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

if (!customElements.get(BRUNO_OFFICE_CARD_TAG)) {
  customElements.define(BRUNO_OFFICE_CARD_TAG, BrunoOfficeCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_OFFICE_CARD_TAG,
  name: 'Bruno Office Card',
  preview: false,
  description: 'Isolated Bento Office card with preserved Home Assistant semantics and Bruno liquid glass visuals.',
});
