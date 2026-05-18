const BRUNO_COZINHA_CARD_TAG = 'bruno-cozinha-card';

const BRUNO_COZINHA_DEFAULT_CONFIG = {
  "name": "Cozinha",
  "icon_size": 74,
  "room_on_states": [
    "on",
    "home",
    "active",
    "yes"
  ],
  "semantic_on_states": [
    "dishwashing",
    "cooking",
    "washing"
  ],
  "entities": {
    "room_group": "light.grupo_luzes_cozinha",
    "room_toggle": "light.cz_luz_principal",
    "room_fallback_lights": [
      "light.cz_luz_principal"
    ],
    "active_sensor": "sensor.cozinha_active",
    "temperature": [
      "sensor.temperatura_cozinha"
    ],
    "humidity": [
      "sensor.umidade_cozinha"
    ],
    "dishwasher": "sensor.lava_loucas_operation_state"
  },
  "icon": {
    "off": "/local/bruno-ui/assets/kitchen-off.png?v=20260517-4",
    "on": "/local/bruno-ui/assets/kitchen-on.png?v=20260517-4",
    "fallback": "mdi:noodles"
  },
  "status_dots": [
    {
      "icon": "mdi:account",
      "label": "Presenca",
      "tone": "blue"
    },
    {
      "icon": "mdi:dishwasher",
      "label": "Lava-loucas",
      "tone": "purple",
      "entity": "sensor.lava_loucas_operation_state",
      "states": [
        "run"
      ],
      "active_attr": "dishwasher_running"
    },
    {
      "icon": "mdi:washing-machine",
      "label": "Maquina de lavar",
      "tone": "cyan"
    },
    {
      "icon": "mdi:air-fryer",
      "label": "Air fryer",
      "tone": "amber"
    }
  ]
};

const BRUNO_COZINHA_ACTION_COOLDOWN = 1200;

class BrunoCozinhaCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_COZINHA_DEFAULT_CONFIG.entities,
      ...(config?.entities || {}),
    };
    const icon = {
      ...BRUNO_COZINHA_DEFAULT_CONFIG.icon,
      ...(config?.icon || {}),
    };

    this._config = {
      ...BRUNO_COZINHA_DEFAULT_CONFIG,
      ...config,
      entities,
      icon,
      room_on_states: this._array(config?.room_on_states || BRUNO_COZINHA_DEFAULT_CONFIG.room_on_states),
      semantic_on_states: this._array(config?.semantic_on_states || BRUNO_COZINHA_DEFAULT_CONFIG.semantic_on_states || []),
      status_dots: Array.isArray(config?.status_dots) ? config.status_dots : BRUNO_COZINHA_DEFAULT_CONFIG.status_dots,
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
    return `${BrunoCozinhaCard._escape(entity.state)}${suffix}`;
  }

  _truthy(value) {
    return value === true || value === 'true' || value === 'True' || value === 'on' || value === 'yes';
  }

  _roomOn(roomEntity) {
    const state = String(roomEntity?.state || '').toLowerCase();
    const activeState = String(this._state(this._config.entities.active_sensor)?.state || '').toLowerCase();
    const roomOn = this._config.room_on_states.map((item) => String(item).toLowerCase()).includes(state);
    const semanticOn = this._config.semantic_on_states.map((item) => String(item).toLowerCase()).includes(activeState);
    return roomOn || semanticOn;
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
    this._callService('light.toggle', {}, { entity_id: entities.room_toggle || entities.room_group });
  }

  _isActionCoolingDown(key) {
    this._lastActionAt = this._lastActionAt || {};
    const now = Date.now();
    const previous = this._lastActionAt[key] || 0;
    if (now - previous < BRUNO_COZINHA_ACTION_COOLDOWN) return true;
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
      <span class="status-dot tone-${dot.tone}${activeClass}" title="${BrunoCozinhaCard._escape(dot.label)}" aria-label="${BrunoCozinhaCard._escape(dot.label)}">
        <ha-icon icon="${dot.icon}"></ha-icon>
      </span>
    `;
  }

  _statusLines(lines) {
    if (!lines.length) return '';
    return lines.map((line) => `<span>${BrunoCozinhaCard._escape(line)}</span>`).join('');
  }

  _assetVisual(active) {
    const icon = this._config.icon;
    const fallback = BrunoCozinhaCard._escape(icon.fallback || 'mdi:home-outline');
    const off = BrunoCozinhaCard._escape(icon.off || '');
    const on = BrunoCozinhaCard._escape(icon.on || '');
    return `
      <span class="room-asset-wrap">
        <span class="room-asset-fallback"><ha-icon icon="${fallback}"></ha-icon></span>
        ${off ? `<img class="room-asset room-asset-off" src="${off}" alt="" loading="eager" decoding="async">` : ''}
        ${on ? `<img class="room-asset room-asset-on" src="${on}" alt="" loading="eager" decoding="async">` : ''}
      </span>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const roomActiveClass = model.roomOn ? ' is-room-on' : '';
    const hasMetricClass = model.temperature ? ' has-metric' : '';
    const iconSize = Number(this._config.icon_size) || BRUNO_COZINHA_DEFAULT_CONFIG.icon_size;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: 18px;
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
          --dot-off-bg: rgba(255,255,255,0.12);
          --dot-off-border: rgba(255,255,255,0.16);
          --dot-off-icon: rgba(255,255,255,0.48);
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
          grid-template-columns: auto 1fr auto;
          grid-template-rows: auto 1fr auto auto;
          grid-template-areas:
            "icon temp dots"
            "icon space dots"
            "title title dots"
            "state state dots";
          column-gap: 10px;
          row-gap: 0;
          align-items: start;
          padding: 14px 13px 13px 11px;
          margin: 0;
          text-align: left;
          background: transparent;
          border: 0;
          border-radius: var(--card-radius);
          box-shadow: none;
          overflow: hidden;
          transition: transform 160ms ease, filter 160ms ease;
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
          object-fit: contain;
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

        .room-asset-fallback ha-icon {
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

        .metric {
          grid-area: temp;
          justify-self: start;
          align-self: start;
          min-width: 48px;
          margin-top: 3px;
          text-align: left;
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
          max-width: 124px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .right-dots {
          grid-area: dots;
          justify-self: end;
          align-self: start;
          margin-right: 1px;
          padding-top: 1px;
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
          transition: background 160ms ease, border-color 160ms ease, color 160ms ease, box-shadow 160ms ease;
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
          color: rgba(var(--tone),0.98);
          background: rgba(var(--tone),0.13);
          border-color: rgba(var(--tone),0.34);
          box-shadow: 0 0 12px rgba(var(--tone),0.14);
        }

        .tone-blue { --tone: var(--accent-blue); }
        .tone-purple { --tone: var(--accent-purple); }
        .tone-cyan { --tone: var(--accent-cyan); }
        .tone-amber { --tone: var(--accent-amber); }

        @media (max-height: 760px) {
          .room-action {
            padding: 12px 13px;
          }

          .room-icon {
            width: calc(var(--room-icon-size) - 8px);
            height: calc(var(--room-icon-size) - 8px);
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
      </style>

      <div class="room-card${roomActiveClass}" style="--room-icon-size:${iconSize}px;">
        <button class="room-action${hasMetricClass}" type="button" data-action-key="room" aria-label="${BrunoCozinhaCard._escape(this._config.name)}">
          <div class="room-icon" aria-hidden="true">${this._assetVisual(model.iconActive)}</div>

          <div class="metric">
            <span class="metric-value">${model.temperature}</span>
            <span class="metric-sub">${model.humidity}</span>
          </div>

          <div class="title">${BrunoCozinhaCard._escape(this._config.name)}</div>
          <div class="status-lines">${this._statusLines(model.statusLines)}</div>

          <div class="right-dots" aria-label="Status do ambiente">
            ${model.dots.map((dot) => this._statusDot(dot)).join('')}
          </div>
        </button>
      </div>
    `;

    this.shadowRoot
      .querySelectorAll('[data-action-key]')
      .forEach((button) => this._wireAction(button));
    this._wireAssetFallback();
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

if (!customElements.get(BRUNO_COZINHA_CARD_TAG)) {
  customElements.define(BRUNO_COZINHA_CARD_TAG, BrunoCozinhaCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_COZINHA_CARD_TAG,
  name: 'Bruno Cozinha Card',
  preview: false,
  description: 'Bento Cozinha card with local room logic and Bruno liquid glass visuals.',
});
