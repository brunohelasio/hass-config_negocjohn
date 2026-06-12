const BRUNO_SALA_CARD_TAG = 'bruno-sala-card';

const BRUNO_SALA_DEFAULT_ENTITIES = {
  room_group: 'light.grupo_luzes_sala',
  room_toggle: 'light.sala_switch_2',
  room_fallback_lights: ['light.sala_switch_1', 'light.sala_switch_2'],
  active_sensor: 'sensor.living_room_active',
  semantic_sensor: 'sensor.sala_semantic_state',
  motion_recent: 'binary_sensor.sala_motion_recent',
  occupancy: 'binary_sensor.sala_occupancy',
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
const BRUNO_SALA_CLIMATE_ACTIVE_ACTIONS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const BRUNO_SALA_CLIMATE_INACTIVE_ACTIONS = ['off', 'idle'];
const BRUNO_SALA_SPEAKER_ON_STATES = ['playing', 'on', 'paused'];
const BRUNO_SALA_ACTION_COOLDOWN = 1200;
const BRUNO_SALA_CLIMATE_COOLDOWN = 2500;
const BRUNO_SALA_TV_ANIMATION_MS = 950;
const BRUNO_SALA_PRESENCE_FALLBACK_MS = 10 * 60 * 1000;

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

  _sensorValue(entityId, suffix = '') {
    const entity = this._state(entityId);
    if (this._isUnavailable(entity)) return '&mdash;';
    return `${BrunoSalaCard._escape(entity.state)}${suffix}`;
  }

  _presenceRecent() {
    const motion = this._state(this._config.entities.motion_recent);
    const occupancy = this._state(this._config.entities.occupancy);
    if (motion?.state === 'on' || occupancy?.state === 'on') return true;

    // FALLBACK - sensor original da Sala antes da camada de ocupacao.
    const entity = this._state(this._config.entities.presence);
    if (entity?.state !== 'on' || !entity.last_changed) return false;

    const changedAt = Date.parse(entity.last_changed);
    return !Number.isNaN(changedAt) && Date.now() - changedAt < BRUNO_SALA_PRESENCE_FALLBACK_MS;
  }

  _semanticLine() {
    const semantic = this._state(this._config.entities.semantic_sensor);
    const semanticState = String(semantic?.state || '').toLowerCase();
    const display = semantic?.attributes?.display;
    if (display && !['none', 'unknown', 'unavailable'].includes(semanticState)) {
      return String(display).trim();
    }

    const occupancy = this._state(this._config.entities.occupancy);
    return occupancy?.state === 'on' ? 'Ocupada' : '';
  }

  _tvLabel(entity) {
    if (!entity) return 'Desligada';
    if (entity.state === 'playing') return 'Reproduzindo';
    if (entity.state === 'paused') return 'Pausado';
    if (['on', 'idle'].includes(entity.state)) return 'Ligada';
    return 'Desligada';
  }

  _climateAction(entity) {
    return String(entity?.attributes?.hvac_action || '').toLowerCase();
  }

  _climateIsActive(entity) {
    if (this._isUnavailable(entity) || entity.state === 'off') return false;

    const hvacAction = this._climateAction(entity);
    if (BRUNO_SALA_CLIMATE_ACTIVE_ACTIONS.includes(hvacAction)) return true;
    if (BRUNO_SALA_CLIMATE_INACTIVE_ACTIONS.includes(hvacAction)) return false;

    return BRUNO_SALA_CLIMATE_ON_STATES.includes(entity?.state || '');
  }

  _climateLabel(entity) {
    const hvacAction = this._climateAction(entity);
    if (hvacAction === 'idle') return 'Em espera';
    if (!this._climateIsActive(entity)) return 'Desligado';

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
    const climateOn = this._climateIsActive(climate);
    const speakerOn = BRUNO_SALA_SPEAKER_ON_STATES.includes(this._state(entities.speaker)?.state || '');
    const corridorOn = corridor?.state === 'on';
    const lights = this._lightsSummary(room);
    const statusLines = [];
    const semanticLine = this._semanticLine();

    if (lights.label) statusLines.push(lights.label);
    if (semanticLine) statusLines.push(semanticLine);

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
      statusLines,
      // ORIGINAL labels (rollback): mantidos para aria-label/tooltip futuro
      tvLabel: this._tvLabel(tv),
      climateLabel: this._climateLabel(climate),
      corridorLabel: corridorOn ? 'Ligado' : 'Desligado',
      // NOVO: labels compactos ON/OFF para command-state (mockup react)
      tvStateLabel: tvOn ? 'ON' : 'OFF',
      climateStateLabel: climateOn ? 'ON' : 'OFF',
      corridorStateLabel: corridorOn ? 'ON' : 'OFF',
    };
  }

  _runAction(key, gesture) {
    const entities = this._config.entities;

    if (key === 'room') {
      if (gesture === 'hold') {
        this._callService('light.turn_off', {}, { entity_id: entities.room_group });
        return;
      }
      this._callService('light.toggle', {}, { entity_id: entities.room_toggle });
      return;
    }

    if (key === 'corridor') {
      if (gesture === 'tap' && this._isActionCoolingDown(key)) return;
      if (gesture === 'hold') {
        this._moreInfo(entities.corridor);
        return;
      }
      this._toggleEntity(entities.corridor);
      return;
    }

    if (key === 'tv') {
      if (gesture === 'tap' && this._isActionCoolingDown(key)) return;
      if (gesture === 'hold') {
        this._moreInfo(entities.tv);
        return;
      }
      this._toggleEntity(entities.tv);
      return;
    }

    if (key === 'climate') {
      if (gesture === 'tap' && this._isActionCoolingDown(key)) return;
      if (gesture === 'hold') {
        this._moreInfo(entities.climate);
        return;
      }
      const service = this._climateIsActive(this._state(entities.climate))
        ? 'climate.turn_off'
        : 'climate.turn_on';
      this._callService(service, {}, { entity_id: entities.climate });
    }
  }

  _runRoomSubview() {
    globalThis.BrunoLiquidGlass?.feedback?.('tap');
    this._navigate(this._config.navigation_path);
  }

  _isActionCoolingDown(key) {
    this._lastActionAt = this._lastActionAt || {};
    const now = Date.now();
    const previous = this._lastActionAt[key] || 0;
    const cooldown = key === 'climate' ? BRUNO_SALA_CLIMATE_COOLDOWN : BRUNO_SALA_ACTION_COOLDOWN;
    if (now - previous < cooldown) return true;
    this._lastActionAt[key] = now;
    return false;
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

  _toggleEntity(entityId) {
    if (!entityId) return;
    this._callService('homeassistant.toggle', {}, { entity_id: entityId });
  }

  _navigate(path) {
    if (!path) return;
    const resolvedPath = this._resolveNavigationPath(path);
    const eventPath = resolvedPath;
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

  _wireAction(button) {
    const key = button.dataset.actionKey;
    if (!key) return;

    let holdTimer = null;
    let holdFired = false;
    let pointerDown = false;

    const clearHold = () => {
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const resetPress = () => {
      clearHold();
      pointerDown = false;
      button.classList.remove('is-pressed');
    };

    button.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      pointerDown = true;
      holdFired = false;
      button.classList.add('is-pressed');
      button.setPointerCapture?.(event.pointerId);

      holdTimer = window.setTimeout(() => {
        holdFired = true;
        button.classList.add('is-hold-fired');
        window.setTimeout(() => button.classList.remove('is-hold-fired'), 260);
        globalThis.BrunoLiquidGlass?.feedback?.('hold');
        this._runAction(key, 'hold');
      }, 560);
    });

    button.addEventListener('pointerup', (event) => {
      event.preventDefault();
      event.stopPropagation();
      button.releasePointerCapture?.(event.pointerId);

      const wasPointerDown = pointerDown;
      resetPress();

      if (!wasPointerDown || holdFired) return;
      globalThis.BrunoLiquidGlass?.feedback?.('tap');
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
    button.addEventListener('pointercancel', resetPress);

    button.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      globalThis.BrunoLiquidGlass?.feedback?.('tap');
      this._runAction(key, 'tap');
    });
  }

  _wireRoomNavZone(zone) {
    if (!zone) return;

    let holdTimer = null;
    let holdFired = false;
    let pointerDown = false;

    const clearHold = () => {
      if (holdTimer) {
        window.clearTimeout(holdTimer);
        holdTimer = null;
      }
    };

    const resetPress = () => {
      clearHold();
      pointerDown = false;
      zone.classList.remove('is-pressed');
    };

    zone.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();

      pointerDown = true;
      holdFired = false;
      zone.classList.add('is-pressed');
      zone.setPointerCapture?.(event.pointerId);

      holdTimer = window.setTimeout(() => {
        holdFired = true;
        zone.classList.add('is-hold-fired');
        window.setTimeout(() => zone.classList.remove('is-hold-fired'), 260);
        globalThis.BrunoLiquidGlass?.feedback?.('hold');
        this._runAction('room', 'hold');
      }, 560);
    });

    zone.addEventListener('pointerup', (event) => {
      event.preventDefault();
      event.stopPropagation();
      zone.releasePointerCapture?.(event.pointerId);

      const wasPointerDown = pointerDown;
      resetPress();

      if (!wasPointerDown || holdFired) return;
      this._runRoomSubview();
    });

    zone.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    zone.addEventListener('dblclick', (event) => {
      event.preventDefault();
      event.stopPropagation();
    });

    zone.addEventListener('pointerleave', resetPress);
    zone.addEventListener('pointercancel', resetPress);

    zone.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      this._runRoomSubview();
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

  _statusLines(lines) {
    if (!lines.length) return '';
    return lines
      .map((line) => `<span>${BrunoSalaCard._escape(line)}</span>`)
      .join('');
  }

  _actionButton(key, iconName, name, label, active, tone, options = {}) {
    const activeClass = active ? ' is-active' : '';
    const category = options.category || '';

    return `
      <button class="command-row icon-${iconName} tone-${tone}${activeClass}" type="button" data-action-key="${key}" aria-label="${BrunoSalaCard._escape(name)}">
        <span class="command-icon" aria-hidden="true">${BrunoSalaCard._tplIcon(iconName, { active, ...options })}</span>
        <span class="command-copy">
          <span class="command-name">${BrunoSalaCard._escape(name)}</span>
          <span class="command-category">${BrunoSalaCard._escape(category)}</span>
        </span>
        <span class="command-state">${label}</span>
      </button>
    `;
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

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const model = this._model();
    const roomActiveClass = model.roomOn ? ' is-room-on' : '';
    const statusStackClass = model.statusLines.length > 1 ? ' has-status-stack' : '';
    const now = Date.now();
    const tvStateChanged = Boolean(this._hass && this._lastTvOn !== undefined && this._lastTvOn !== model.tvOn);
    if (tvStateChanged) {
      this._tvAnimationUntil = now + BRUNO_SALA_TV_ANIMATION_MS;
      this._tvAnimationState = model.tvOn;
    }
    const animateTv = Boolean(
      this._hass
      && this._tvAnimationState === model.tvOn
      && this._tvAnimationUntil
      && now < this._tvAnimationUntil,
    );

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --button-radius: 14px;
          --accent: 150, 190, 255;
          --accent-blue: 96, 165, 250;
          --accent-purple: 167, 139, 250;
          --accent-cyan: 79, 172, 254;
          --accent-amber: 255, 153, 0;
          --text-main: rgba(245,250,255,0.96);
          --text-soft: rgba(255,255,255,0.40);
          --text-muted: rgba(255,255,255,0.52);
          --action-off-bg: var(--bruno-liquid-control-background, linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.045)));
          --action-off-border: rgba(255,255,255,0.18);
          --action-off-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 22px rgba(0,0,0,0.18));
          --action-name: rgba(255,255,255,0.82);
          --action-label: rgba(255,255,255,0.42);
          --dot-off-bg: rgba(255,255,255,0.075);
          --dot-off-border: rgba(255,255,255,0.14);
          --dot-off-icon: rgba(255,255,255,0.48);
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
          justify-content: space-between;
          gap: 0;
          padding: 12px 14px;
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
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .sala-card::after {
          inset: auto 16px 8px 16px;
          height: 1px;
          border-radius: 999px;
          background: var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent));
          opacity: var(--bruno-liquid-surface-bottom-line-opacity, 0);
        }

        .sala-card.is-room-on {
          --text-main: rgba(248,251,255,0.96);
          --text-soft: rgba(255,255,255,0.52);
          --text-muted: rgba(255,255,255,0.62);
          --action-off-bg:
            linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.055)),
            linear-gradient(155deg, rgba(30,38,50,0.42), rgba(12,15,22,0.24));
          --action-off-border: rgba(255,255,255,0.14);
          --action-off-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.12);
          --action-name: rgba(248,251,255,0.86);
          --action-label: rgba(255,255,255,0.46);
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

        .sala-card.is-room-on::before {
          background: var(--bruno-liquid-surface-on-sheen,
            radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%),
            radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%),
            radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%),
            linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%)
          );
          opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
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
        .command-row {
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          position: relative;
          z-index: 1;
        }

        /* --- ORIGINAL .hero-action (rollback rapido) ---
        .hero-action {
          flex: 1 1 auto;
          min-height: 142px;
          width: 100%;
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr) 38px;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
          grid-template-areas:
            "icon space right"
            "icon space right"
            "title title right"
            "lights lights right";
          column-gap: 4px;
          row-gap: 0;
          align-items: start;
          padding: 0 0 16px;
          ...
        }
        --- FIM ORIGINAL --- */

        .hero-action {
          flex: 1 1 auto;
          min-height: 130px;
          width: 100%;
          display: grid;
          grid-template-columns: 124px minmax(0, 1fr) 40px;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
          grid-template-areas:
            "icon space right"
            "icon space right"
            "title title right"
            "lights lights right";
          column-gap: 6px;
          row-gap: 0;
          align-items: start;
          padding: 0 0 8px;
          text-align: left;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;
          transition:
            transform var(--bruno-liquid-motion-fast, 160ms ease),
            filter var(--bruno-liquid-motion-fast, 160ms ease);
        }

        .hero-action:hover {
          filter: brightness(1.05);
        }

        .hero-action.is-pressed,
        .command-row.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .hero-action.is-hold-fired,
        .command-row.is-hold-fired {
          filter: drop-shadow(0 0 18px rgba(var(--accent),0.28));
        }

        /* --- ORIGINAL .room-icon (rollback rapido) ---
        .room-icon {
          grid-area: icon;
          width: 116px;
          height: 116px;
          margin-left: -4px;
          margin-top: -3px;
        }
        --- FIM ORIGINAL --- */

        .room-icon {
          grid-area: icon;
          justify-self: start;
          align-self: start;
          width: 120px;
          height: 80px;
          margin-left: 0;
          margin-top: 1px;
          position: relative;
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

        .room-asset-wrap {
          overflow: visible;
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

        .sala-card.is-room-on .room-asset-off {
          opacity: 0;
        }

        .sala-card.is-room-on .room-asset-on {
          opacity: 1;
          filter: drop-shadow(0 6px 9px rgba(0,0,0,0.20)) drop-shadow(0 0 12px rgba(255,187,72,0.16));
          transform: translateY(-1px) scale(1.01);
        }

        .room-asset-fallback {
          opacity: 0;
          pointer-events: none;
        }

        .room-icon.has-image-error .room-asset {
          display: none;
        }

        .room-icon.has-image-error .room-asset-fallback {
          opacity: 1;
        }

        .metric {
          min-width: 36px;
          text-align: center;
          line-height: 1.1;
        }

        /* --- ORIGINAL .metric-value/.metric-sub 13.5/11.2px (rollback rapido) ---
        .metric-value {
          display: block;
          font-size: 13.5px;
          line-height: 1;
          font-weight: 760;
          color: var(--text-main);
        }

        .metric-sub {
          display: block;
          margin-top: 4px;
          font-size: 11.2px;
          line-height: 1;
          font-weight: 600;
          color: var(--text-muted);
        }
        --- FIM ORIGINAL --- */

        /* NOVO: paridade com Office (13px/11px) */
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

        .room-nav-zone {
          grid-column: 1 / 3;
          grid-row: 3 / 5;
          justify-self: start;
          align-self: end;
          position: relative;
          z-index: 4;
          min-width: 0;
          width: min(164px, 100%);
          min-height: 48px;
          padding: 1px 24px 2px 0;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          outline: none;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
          -webkit-tap-highlight-color: transparent;
        }

        .room-title-row {
          display: flex;
          align-items: center;
          gap: 7px;
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
          font-size: 22px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.56);
          transform: translateY(-1px);
          transition:
            color var(--bruno-liquid-motion-fast, 140ms ease),
            transform var(--bruno-liquid-motion-fast, 140ms ease),
            filter var(--bruno-liquid-motion-fast, 140ms ease);
        }

        .room-nav-zone.is-pressed .title,
        .room-nav-zone.is-pressed .lights-line {
          filter: brightness(1.13);
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

        .lights-line {
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
          max-height: 28px;
          padding-right: 4px;
        }

        /* --- ORIGINAL .lights-line span max-width (rollback) ---
        .lights-line span { max-width: 142px; }
        --- FIM ORIGINAL --- */

        .lights-line span {
          display: block;
          max-width: 158px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* --- ORIGINAL .right-rail translateX(2px) (rollback rapido) ---
        .right-rail {
          grid-area: right;
          justify-self: center;
          align-self: start;
          margin-right: 0;
          padding-top: 1px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          transform: translateX(2px);
        }
        --- FIM ORIGINAL --- */

        /* NOVO: paridade de posicionamento com Office (translate(5px, -3px)) */
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

        .status-dot.is-active ha-icon {
          filter: drop-shadow(0 0 5px rgba(var(--tone),0.56));
        }
        --- FIM ORIGINAL --- */

        /* --- ORIGINAL .status-dot flat colorido solido (rollback rapido) ---
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
            linear-gradient(135deg, rgba(255,255,255,0.20), rgba(0,0,0,0.16)),
            rgb(var(--tone));
          border: none;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.28),
            0 2px 6px rgba(0,0,0,0.25),
            0 0 12px rgba(var(--tone),0.35);
        }
        --- FIM ORIGINAL --- */

        /* NOVO: paridade com Office — padrao .nav-button.selected da barra fixa
           (fundo tonal translucido em gradiente, borda clara, icone branco, glow suave) */
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
          /* animation: brunoSalaDotIn 240ms ease; — removido: replay no hass() causava piscar */
        }

        @keyframes brunoSalaDotIn {
          from { opacity: 0; transform: scale(0.55); }
          to { opacity: 1; transform: scale(1); }
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
          color: #ffffff;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.28));
        }

        .sala-card.has-status-stack .lights-line {
          max-height: 25px;
          font-size: 10.6px;
          line-height: 1.08;
        }

        .tone-blue { --tone: var(--accent-blue); }
        .tone-purple { --tone: var(--accent-purple); }
        .tone-cyan { --tone: var(--accent-cyan); }
        .tone-amber { --tone: var(--accent-amber); }

        /* --- ORIGINAL .action-strip + .command-row (rollback rapido) ---
        .action-strip { padding: 0 1px 1px; }
        .command-row {
          height: 43px;
          grid-template-columns: 36px minmax(0,1fr) minmax(62px, auto);
          column-gap: 9px;
          padding: 0 8px 0 9px;
          border-radius: 12px;
          background: linear-gradient(...), rgba(5,8,13,0.03);
        }
        .command-row:not(:last-child)::after { background: linear-gradient(90deg, ...); }
        .command-row::before { top: 9px; bottom: 9px; }
        .command-row.is-active { background: radial-gradient(...) + ... }
        .command-row.is-active::before { box-shadow: 0 0 10px rgba(var(--tone),0.44), 0 0 20px rgba(var(--tone),0.18); }
        --- FIM ORIGINAL --- */

        .action-strip {
          position: relative;
          z-index: 1;
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          padding: 0;
        }

        /* --- ORIGINAL .command-row v1 (rollback rapido) ---
        grid-template-columns: 44px minmax(0,1fr) minmax(58px, auto);
        column-gap: 14px;
        padding: 0 6px 0 12px;
        --- FIM ORIGINAL --- */
        /* --- ORIGINAL .command-row v2 (rollback) ---
        column-gap: 10px;
        padding: 0 4px 0 8px;
        --- FIM ORIGINAL --- */

        .command-row {
          --command-accent: rgb(var(--tone));
          height: 60px;
          width: 100%;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr) 44px;
          grid-template-rows: 1fr;
          align-items: center;
          column-gap: 6px;
          padding: 0 4px 0 4px;
          margin: 0;
          text-align: left;
          color: var(--action-name);
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          transition:
            background var(--bruno-liquid-motion-fast, 160ms ease),
            color var(--bruno-liquid-motion-fast, 160ms ease),
            transform var(--bruno-liquid-motion-fast, 160ms ease),
            filter var(--bruno-liquid-motion-fast, 160ms ease);
        }

        .command-row + .command-row {
          border-top: 1px solid rgba(255,255,255,0.105);
        }

        .command-row::before {
          content: "";
          position: absolute;
          left: -2px;
          top: 14px;
          bottom: 14px;
          width: 2px;
          border-radius: 999px;
          background: rgb(var(--tone));
          box-shadow: 0 0 0 rgba(var(--tone),0);
          opacity: 0;
          transform: scaleY(0.74);
          transition:
            opacity var(--bruno-liquid-motion-fast, 160ms ease),
            transform var(--bruno-liquid-motion-fast, 160ms ease);
        }

        /* NOVO: glow line inferior quando ativo (estilo mockup react .rail-line) */
        /* offsets ajustados v2: icone termina em 44px (padding 4 + col 40), state comeca em 48px (padding 4 + col 44) */
        .command-row::after {
          content: "";
          position: absolute;
          left: 46px;
          right: 46px;
          bottom: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(var(--tone), 0),
            rgba(var(--tone), 0.62),
            rgba(var(--tone), 0)
          );
          box-shadow: 0 0 10px rgba(var(--tone), 0.28);
          opacity: 0;
          transform: scaleX(0.72);
          transform-origin: left;
          transition:
            opacity 350ms ease,
            transform 350ms ease;
          pointer-events: none;
          z-index: 0;
        }

        .command-row.is-active::after {
          opacity: 1;
          transform: scaleX(1);
        }

        .command-row:hover {
          background: linear-gradient(90deg, rgba(255,255,255,0.045), rgba(255,255,255,0.014));
        }

        .command-row.is-active {
          background: transparent;
        }

        .command-row.is-active::before {
          opacity: 1;
          transform: scaleY(1);
          animation: brunoSalaRailPulse 2.4s ease-in-out infinite;
        }

        @keyframes brunoSalaRailPulse {
          0%, 100% {
            opacity: 0.78;
            box-shadow:
              0 0 10px rgba(var(--tone),0.62),
              0 0 24px rgba(var(--tone),0.26);
          }
          50% {
            opacity: 1;
            box-shadow:
              0 0 12px rgba(var(--tone),0.95),
              0 0 32px rgba(var(--tone),0.48);
          }
        }

        /* --- ORIGINAL .command-icon (rollback) --- width/height 30px --- */
        .command-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(245,240,232,0.58);
          filter: drop-shadow(0 3px 8px rgba(0,0,0,0.24));
          transform: scale(0.96);
          transition:
            color 320ms ease,
            filter 320ms ease,
            transform 320ms ease,
            opacity 320ms ease;
        }

        .command-row.is-active .command-icon {
          transform: scale(1.04);
        }

        .command-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          line-height: 1;
        }

        .command-row.icon-ledstrip.is-active .command-icon {
          color: var(--state-icon-active-color, #f0c040);
        }

        .command-row.icon-tv.is-active .command-icon {
          color: rgb(var(--tone));
        }

        .command-row.icon-climate.is-active .command-icon {
          color: rgb(var(--tone));
        }

        .command-row.is-active .command-icon {
          filter:
            drop-shadow(0 1px 2px rgba(0,0,0,0.18))
            drop-shadow(0 0 8px rgba(var(--tone),0.32));
        }

        /* --- ORIGINAL .command-name / .command-category / .command-state (rollback) ---
        font-size 12 / 10.4 / 10; weight 680/560/720; state max-width 68px sem border-left
        --- FIM ORIGINAL --- */

        .command-name {
          min-width: 0;
          font-size: 14px;
          line-height: 1.05;
          font-weight: 500;
          letter-spacing: -0.2px;
          color: rgba(255,255,255,0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }

        .command-row.is-active .command-name {
          color: rgba(255,255,255,0.96);
          text-shadow: 0 0 10px rgba(255,255,255,0.08);
        }

        /* --- ORIGINAL .command-category v1 (rollback): font-size 11px --- */
        .command-category {
          min-width: 0;
          text-align: left;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 400;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s ease;
        }

        .command-row.is-active .command-category {
          color: rgba(210,236,255,0.60);
        }

        /* --- ORIGINAL .command-state v1 (rollback) ---
        justify-self: end; max-width: 56px; padding-left: 12px;
        Problema: largura variavel ON/OFF deslocava border-left.
        --- FIM ORIGINAL --- */

        .command-state {
          width: 100%;
          padding-left: 10px;
          border-left: 1px solid rgba(255,255,255,0.11);
          text-align: right;
          font-size: 11px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: 1.1px;
          color: rgba(255,255,255,0.36);
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition:
            color 0.3s ease,
            text-shadow 0.3s ease,
            border-color 0.3s ease;
        }

        .command-row.is-active .command-state {
          color: rgba(92,194,255,0.98);
          text-shadow:
            0 0 10px rgba(45,170,255,0.42),
            0 0 22px rgba(45,170,255,0.16);
          border-left-color: rgba(120,205,255,0.20);
        }

        /* --- ORIGINAL is-active overrides (rollback) ---
        .command-row.is-active .command-name { color: var(--action-name); }
        .command-row.is-active .command-category { color: rgba(255,255,255,0.58); }
        .command-row.is-active .command-state {
          color: rgba(var(--tone),0.98);
          filter: drop-shadow(0 0 7px rgba(var(--tone),0.25));
        }
        --- FIM ORIGINAL --- */

        .tpl-icon,
        .tpl-icon svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .tpl-icon svg {
          overflow: visible;
        }

        /* --- ORIGINAL @media (max-height: 760px) (rollback) ---
        hero-action min-height 134, col 106; room-icon 104x104 margin -4/-3;
        command-row 40px / 32px col / 8gap; icon 27px; fonts 11.6/9.8/9.8
        --- FIM ORIGINAL --- */

        @media (max-height: 760px) {
          :host {
            --card-radius: var(--bruno-liquid-card-radius, 22px);
            --button-radius: 14px;
          }

          .sala-card {
            padding: 10px 12px;
          }

          .hero-action {
            min-height: 120px;
            grid-template-columns: 112px minmax(0, 1fr) 38px;
            padding-bottom: 6px;
          }

          .room-icon {
            width: 108px;
            height: 72px;
            margin-left: 0;
            margin-top: 1px;
          }

          .command-row {
            height: 52px;
            grid-template-columns: 36px minmax(0, 1fr) 40px;
            column-gap: 5px;
            padding: 0 3px 0 4px;
          }

          .command-row::after {
            left: 40px;
            right: 40px;
          }

          .command-icon {
            width: 34px;
            height: 34px;
          }

          .command-name {
            font-size: 13px;
          }

          .command-category {
            font-size: 10.4px;
          }

          .command-state {
            font-size: 10px;
            padding-left: 8px;
            width: 100%;
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
          .command-row,
          .status-dot,
          .command-icon {
            transition: none !important;
          }
        }
      </style>

      <div class="sala-card${roomActiveClass}${statusStackClass}">
        <button class="hero-action" type="button" data-action-key="room" aria-label="Sala">
          <div class="room-icon" aria-hidden="true">
            ${BrunoSalaCard._roomVisual(model.roomOn)}
          </div>

          <span class="room-nav-zone" data-room-nav role="button" tabindex="0" aria-label="Abrir ${BrunoSalaCard._escape(this._config.name)}">
            <span class="room-title-row">
              <span class="title">${BrunoSalaCard._escape(this._config.name)}</span>
              <span class="room-chevron" aria-hidden="true">&rsaquo;</span>
            </span>
            <span class="lights-line">${this._statusLines(model.statusLines)}</span>
          </span>

          <div class="right-rail" aria-label="Status da sala">
            <div class="metric" aria-label="Temperatura e umidade">
              <span class="metric-value">${model.temperature}</span>
              <span class="metric-sub">${model.humidity}</span>
            </div>
            <!-- ORIGINAL dots fixos (rollback rapido):
            \${this._statusDot('mdi:account', model.presenceOn, 'Presenca na Sala', 'blue')}
            \${this._statusDot('mdi:television-classic', model.tvOn, 'TV ativa', 'purple')}
            \${this._statusDot('mdi:snowflake', model.climateOn, 'Ar condicionado ativo', 'cyan')}
            \${this._statusDot('mdi:speaker-wireless', model.speakerOn, 'Echo Show ativo', 'amber')}
            FIM ORIGINAL -->
            <div class="status-stack">
              ${[
                { icon: 'mdi:account', active: model.presenceOn, label: 'Presenca na Sala', tone: 'blue' },
                { icon: 'mdi:television-classic', active: model.tvOn, label: 'TV ativa', tone: 'purple' },
                { icon: 'mdi:snowflake', active: model.climateOn, label: 'Ar condicionado ativo', tone: 'cyan' },
                { icon: 'mdi:speaker-wireless', active: model.speakerOn, label: 'Echo Show ativo', tone: 'amber' },
              ].filter((dot) => dot.active)
                .map((dot) => this._statusDot(dot.icon, dot.active, dot.label, dot.tone))
                .join('')}
            </div>
          </div>
        </button>

        <!-- ORIGINAL action-strip (rollback): usava model.corridorLabel/tvLabel/climateLabel (Ligado/Desligado etc) -->
        <div class="action-strip">
          ${this._actionButton('corridor', 'ledstrip', 'Corredor', model.corridorStateLabel, model.corridorOn, 'blue', { category: 'Iluminação' })}
          ${this._actionButton('tv', 'tv', 'TV', model.tvStateLabel, model.tvOn, 'purple', { animate: animateTv, category: 'Entretenimento' })}
          ${this._actionButton('climate', 'climate', 'A/C', model.climateStateLabel, model.climateOn, 'cyan', { category: 'Climatização' })}
        </div>
      </div>
    `;

    if (this._hass) this._lastTvOn = model.tvOn;

    this.shadowRoot
      .querySelectorAll('[data-action-key]')
      .forEach((button) => this._wireAction(button));
    this._wireRoomNavZone(this.shadowRoot.querySelector('[data-room-nav]'));
    this._wireAssetFallback();
  }

  /* --- ORIGINAL _roomVisual (rollback rapido — assets nao-trimados) ---
  static _roomVisualOriginal(active) {
    return `
      <span class="room-asset-wrap">
        <span class="room-asset-fallback">${BrunoSalaCard._roomIcon(active)}</span>
        <img class="room-asset room-asset-off" src="/local/bruno-ui/assets/living-room-off.png?v=20260608-sala-shift-1" alt="" loading="eager" decoding="async">
        <img class="room-asset room-asset-on" src="/local/bruno-ui/assets/living-room-on.png?v=20260608-sala-shift-1" alt="" loading="eager" decoding="async">
      </span>
    `;
  }
  */

  // NOVO: assets tight (trim de borda transparente) — sofa ocupa ~100% do conteiner
  static _roomVisual(active) {
    return `
      <span class="room-asset-wrap">
        <span class="room-asset-fallback">${BrunoSalaCard._roomIcon(active)}</span>
        <img class="room-asset room-asset-off" src="/local/bruno-ui/assets/living-room-off-tight.png?v=20260609-sala-shift-2" alt="" loading="eager" decoding="async">
        <img class="room-asset room-asset-on" src="/local/bruno-ui/assets/living-room-on-tight.png?v=20260609-sala-shift-2" alt="" loading="eager" decoding="async">
      </span>
    `;
  }

  static _roomIcon(active) {
    const filter = active ? 'none' : 'grayscale(1) contrast(0.4) brightness(0.8)';
    return `
      <svg viewBox="0 0 4.8 4.8" xmlns="http://www.w3.org/2000/svg" style="width:65px;height:65px;filter:${filter};display:block;">
        <path d="M.78 2.565H.69V.87C.69.75.75.51.975.51v.098C.78.608.78.855.78.871v1.695" fill="#666"/>
        <path d="M1.62.525a.81.81 0 0 0-.188-.09L1.313.052C1.298 0 1.171-.008 1.021.037s-.255.128-.24.18l.128.397S.811.786.804.846c-.022.12.045.472.045.472l1.05-.315c-.007-.007-.172-.39-.278-.48" fill="#94989b"/>
        <path d="M1.89.998c.03.105-.188.263-.472.345-.292.09-.547.075-.57-.03-.03-.105.188-.263.472-.345.285-.09.547-.075.57.03" fill="#ffe62e"/>
        <path d="M4.447 3.053a.15.15 0 0 1-.15.15H.502a.15.15 0 0 1-.15-.15v-.975a.15.15 0 0 1 .15-.15h3.803a.15.15 0 0 1 .15.15v.975z" fill="#42ade2"/>
        <path d="M4.447 3.053a.15.15 0 0 1-.15.15H.502a.15.15 0 0 1-.15-.15v-.975a.15.15 0 0 1 .15-.15h3.803a.15.15 0 0 1 .15.15v.975z" fill="#428bc1" opacity=".5"/>
        <path d="M3.375 3.203H.352V2.047s.6.69 3.022 1.155" fill="#428bc1"/>
        <path d="M4.672 2.288c0-.135-.098-.24-.225-.24-.12 0-.217.105-.217.24v.93c0 .135.098.24.217.24.12 0 .225-.105.225-.24v-.93" fill="#42ade2"/>
        <path fill="#8a8e92" d="M.457 4.485H.75V4.8H.457z"/>
        <path d="M3.375 4.485H.3c-.165 0-.3-.142-.3-.322s.135-.322.3-.322h3.075v.645m0-.646H.3c-.165 0-.3-.142-.3-.322s.135-.322.3-.322h3.075v.645" fill="#428bc1"/>
        <path fill="#8a8e92" d="M4.05 4.485h.292V4.8H4.05z"/>
        <path d="M1.425 3.84H4.5c.165 0 .3.142.3.322s-.135.322-.3.322H1.425v-.645" fill="#428bc1"/>
        <path d="M1.425 3.203H4.5c.165 0 .3.142.3.322s-.135.322-.3.322H1.425v-.645" fill="#428bc1"/>
        <path d="M.57 2.288c0-.135-.098-.24-.217-.24-.12 0-.217.105-.217.24v.93c0 .135.098.24.217.24.12 0 .217-.105.217-.24v-.93" fill="#42ade2"/>
        <path d="M4.53 1.965s-.217.187-.255.285c-.075.21-.022.667 0 .892.007.037.037.142.037.142s-.255-.068-.345-.083c-.172-.022-.51.015-.682 0-.075-.007-.3-.06-.3-.06s.195-.09.232-.15c.12-.186.143-.666.158-.891v-.128s.165.052.225.06c.165.015.51-.015.675-.03.06 0 .255-.037.255-.037" fill="#c7e755"/>
      </svg>
    `;
  }

  static _tplIcon(name, options = {}) {
    const active = Boolean(options.active);
    const animate = Boolean(options.animate);
    const tvScreen = active
      ? `<path${animate ? ' class="tv-screen-on"' : ''} d="M2.9,8h44.3v29.9H2.9V8z" fill="url(#bruno-tv-screen)"/>`
      : animate
        ? `<path class="tv-screen-off" d="M2.9,8h44.3v29.9H2.9V8z" fill="url(#bruno-tv-screen)"/>`
        : '';
    const icons = {
      living_sofa: `
        <svg viewBox="0 0 24 24" class="tpl-icon-svg tpl-icon-living-sofa" aria-hidden="true">
          <path fill="currentColor" d="M21,9.75c0.83,0,1.5,0.67,1.5,1.5v4.55c0,0.39-0.31,0.7-0.7,0.7H21v0.75c0,0.83-0.67,1.5-1.5,1.5s-1.5-0.67-1.5-1.5V16.5H6v0.75c0,0.83-0.67,1.5-1.5,1.5S3,18.08,3,17.25V16.5H2.2c-0.39,0-0.7-0.31-0.7-0.7v-4.55c0-0.83,0.67-1.5,1.5-1.5s1.5,0.67,1.5,1.5v1.5h15v-1.5C19.5,10.42,20.17,9.75,21,9.75z M6,11.25c0-1.66-1.34-3-3-3v-1.5c0-0.83,0.67-1.5,1.5-1.5h15c0.83,0,1.5,0.67,1.5,1.5v1.5c-1.66,0-3,1.34-3,3H6z"/>
        </svg>
      `,
      ledstrip: `
        <svg viewBox="0 0 32 32" class="tpl-icon-svg tpl-icon-ledstrip" aria-hidden="true">
          <path fill="currentColor" d="M8.4395,16.668 C8.9795,16.552 9.5115,16.895 9.6285,17.435 C9.7455,17.974 9.4025,18.506 8.8625,18.623 C8.3225,18.74 7.7905,18.397 7.6735,17.857 C7.5565,17.317 7.9005,16.785 8.4395,16.668 M13.3275,15.611 C13.8665,15.495 14.3985,15.838 14.5155,16.377 C14.6325,16.917 14.2895,17.449 13.7505,17.566 C13.2105,17.683 12.6775,17.34 12.5605,16.8 C12.4445,16.261 12.7875,15.729 13.3275,15.611 M18.2135,14.555 C18.7535,14.438 19.2865,14.781 19.4025,15.32 C19.5195,15.86 19.1765,16.393 18.6365,16.51 C18.0965,16.626 17.5645,16.283 17.4485,15.743 C17.3315,15.203 17.6735,14.671 18.2135,14.555 M23.1005,13.498 C23.6405,13.381 24.1725,13.724 24.2905,14.264 C24.4065,14.804 24.0635,15.336 23.5235,15.453 C22.9835,15.569 22.4515,15.227 22.3355,14.687 C22.2175,14.147 22.5615,13.614 23.1005,13.498 M10.6695,20.639 L25.4735,17.444 C26.5535,17.211 27.2405,16.147 27.0065,15.067 C26.4495,12.484 23.9035,10.842 21.3205,11.399 L6.5165,14.594 C5.4365,14.827 4.7505,15.891 4.9835,16.971 C5.5415,19.554 8.0865,21.196 10.6695,20.639 M25,26 C24.447,26 24,25.553 24,25 C24,24.447 24.447,24 25,24 C25.553,24 26,24.447 26,25 C26,25.553 25.553,26 25,26 M20,26 C19.447,26 19,25.553 19,25 C19,24.447 19.447,24 20,24 C20.553,24 21,24.447 21,25 C21,25.553 20.553,26 20,26 M15,26 C14.447,26 14,25.553 14,25 C14,24.447 14.447,24 15,24 C15.553,24 16,24.447 16,25 C16,25.553 15.553,26 15,26 M10,26 C9.447,26 9,25.553 9,25 C9,24.447 9.447,24 10,24 C10.553,24 11,24.447 11,25 C11,25.553 10.553,26 10,26 M27,22 L9,22 C5,22 4,19 4,18 L4,23 C4,25.762 6.238,28 9,28 L27,28 C27.553,28 28,27.553 28,27 L28,23 C28,22.447 27.553,22 27,22 M22,8 C21.447,8 21,7.553 21,7 C21,6.447 21.447,6 22,6 C22.553,6 23,6.447 23,7 C23,7.553 22.553,8 22,8 M17,8 C16.447,8 16,7.553 16,7 C16,6.447 16.447,6 17,6 C17.553,6 18,6.447 18,7 C18,7.553 17.553,8 17,8 M12,8 C11.447,8 11,7.553 11,7 C11,6.447 11.447,6 12,6 C12.553,6 13,6.447 13,7 C13,7.553 12.553,8 12,8 M7,8 C6.447,8 6,7.553 6,7 C6,6.447 6.447,6 7,6 C7.553,6 8,6.447 8,7 C8,7.553 7.553,8 7,8 M23,4 L5,4 C4.447,4 4,4.447 4,5 L4,9 C4,9.553 4.447,10 5,10 L23,10 C27,10 28,13 28,14 L28,9 C28,6.238 25.762,4 23,4"/>
        </svg>
      `,
      tv: `
        <svg viewBox="0 0 50 50" class="tpl-icon-svg tpl-icon-tv" aria-hidden="true">
          <style>
            @keyframes bruno-tv-on {
              from { transform: scaleY(0); }
              to { transform: scaleY(1); }
            }
            @keyframes bruno-tv-off {
              from { transform: scaleY(1); }
              to { transform: scaleY(0); }
            }
            .tv-screen-on {
              animation: bruno-tv-on 900ms cubic-bezier(0.25,0.46,0.45,0.94) forwards;
              transform-origin: -100% 46%;
            }
            .tv-screen-off {
              animation: bruno-tv-off 650ms cubic-bezier(0.25,0.46,0.45,0.94) both;
              transform-origin: -100% 46%;
            }
          </style>
          <linearGradient id="bruno-tv-screen" gradientUnits="userSpaceOnUse" x1="5.401" y1="34.714" x2="43.817" y2="11.74">
            <stop offset="0" stop-color="#64acb7"/>
            <stop offset="1" stop-color="#7fdbe9"/>
          </linearGradient>
          <path d="M2.9,8h44.3v29.9H2.9V8z" fill="#20262890"/>
          ${tvScreen}
          <path fill="currentColor" d="M46 9.2v27.5H4.1V9.2H46m2.4-2.4H1.6v32.3h46.7c.1 0 .1-32.3.1-32.3zM11.9 43.2h26.3c.6 0 1.1-.4 1.1-1v-.3c0-.6-.4-1.1-1-1.1H11.9c-.6 0-1.1.4-1.1 1v.3a1.11 1.11 0 0 0 1.1 1.1z"/>
        </svg>
      `,
      climate: `
        <svg viewBox="0 0 50 50" class="tpl-icon-svg tpl-icon-climate" aria-hidden="true">
          <path fill="currentColor" d="M36.8 1.2v1.7a5.34 5.34 0 0 1-5.3 5.3H18.4a5.34 5.34 0 0 1-5.3-5.3V1.2c-2.6.4-4.7 2.8-4.7 5.6v36.5c0 3.1 2.6 5.7 5.7 5.7h21.8c3.1 0 5.7-2.6 5.7-5.7V6.8c0-2.8-2.1-5.2-4.8-5.6zm-1.7 35.6c-.2 0-.4 0-.5-.1-.4-.1-1.2-.2-2.4-.6-.5-.2-.8-.3-1.2-.4-.3-.1-.7-.3-1.4-.5-1-.4-1.5-.5-1.9-.6-.5-.1-1.1-.2-1.9-.2s-1.4.2-1.9.4c-1 .3-1.8.7-2.1.9l-.6.3a9.75 9.75 0 0 1-1.4.6c-.3.1-.9.3-1.6.3h-.3c-.4 0-1 0-2-.2-.3-.1-.6-.1-.8-.2v-2.7l1.3.3c.5.1 1.3.2 1.7.2.5 0 .9-.2 1.1-.2.4-.1.6-.2 1-.4.2-.1.4-.2.7-.4.4-.2 1.3-.7 2.5-1 .6-.2 1.4-.4 2.5-.5s2 .1 2.5.2c.6.1 1.2.3 2.2.7l1.5.5c.3.1.6.2 1 .4 1 .3 1.8.5 2.1.5h.1v2.7zm0-6c-.2 0-.4 0-.5-.1-.4-.1-1.2-.2-2.4-.6-.5-.2-.8-.3-1.2-.4-.3-.1-.7-.3-1.4-.5-1-.4-1.5-.5-1.9-.6-.5-.1-1.1-.2-1.9-.2s-1.4.2-1.9.4c-1 .3-1.8.7-2.1.9l-.6.3a9.75 9.75 0 0 1-1.4.6c-.3.1-.9.3-1.6.3h-.3c-.4 0-1 0-2-.2-.3-.1-.6-.1-.8-.2v-2.7l1.3.3c.5.1 1.3.2 1.7.2.5 0 .9-.2 1.1-.2.4-.1.6-.2 1-.4.2-.1.4-.2.7-.4.4-.2 1.3-.7 2.5-1 .6-.2 1.4-.4 2.5-.5s2 .1 2.5.2c.6.1 1.2.3 2.2.7l1.5.5c.3.1.6.2 1 .4 1 .3 1.8.5 2.1.5h.1v2.7zm0-6c-.2 0-.4 0-.5-.1-.4-.1-1.2-.2-2.4-.6-.5-.2-.8-.3-1.2-.4-.3-.1-.7-.3-1.4-.5-1-.4-1.5-.5-1.9-.6-.5-.1-1.1-.2-1.9-.2s-1.4.2-1.9.4c-1 .3-1.8.7-2.1.9l-.6.3c-.4.2-.8.4-1.4.6-.3.1-.9.3-1.6.3h-.3c-.4 0-1 0-2-.2-.3-.1-.6-.1-.8-.2v-2.7l1.3.3c.5.1 1.3.2 1.7.2.5 0 .9-.2 1.1-.2.4-.1.6-.2 1-.4.2-.1.4-.2.7-.4.4-.2 1.3-.7 2.5-1 .6-.2 1.4-.4 2.5-.5s2 .1 2.5.2c.6.1 1.2.3 2.2.7l1.5.5c.3.1.6.2 1 .4 1 .3 1.8.5 2.1.5h.1v2.7zM15.7 1.9v-.8h18.6V3c0 1.5-1.2 2.8-2.8 2.8H18.4c-1.5 0-2.8-1.2-2.8-2.8V1.9z"/>
        </svg>
      `,
      motion: `
        <svg viewBox="0 0 50 45" class="tpl-icon-svg tpl-icon-motion" aria-hidden="true">
          <path fill="currentColor" d="M37.85,39.55c1.33,2.67,5.32,1,3.89-1.91l-3.72-7.52c-.28-.56-.65-1.15-1.06-1.76l-2.24-3.19,.09-.3c.56-2,.89-3.13,1.02-5l.37-5.28c.2-2.8-1.52-4.78-4.22-4.78-2.04,0-3.46,1.06-5.24,2.8l-2.8,2.74c-.91,.91-1.28,1.72-1.39,3.04l-.35,4.32c-.11,1.28,.67,2.22,1.87,2.26,1.22,.09,2-.7,2.11-2.02l.39-4.59,1-.89c.28-.26,.74-.13,.7,.33l-.26,3.52c-.15,1.96,.24,3.06,1.78,4.98l3.69,4.63c.33,.41,.39,.54,.56,.89l3.8,7.74Zm-3.67-30.86c2.39,0,4.35-1.96,4.35-4.35s-1.96-4.35-4.35-4.35-4.35,1.96-4.35,4.35,1.96,4.35,4.35,4.35Zm-9.13,31.46l5.5-6.52c.59-.7,.72-.89,.91-1.56l.04-.15-3.41-4.26-.72,3.32-5.35,6.35c-2.04,2.43,1.33,4.85,3.02,2.82Zm19.45-23.23h-4.04l-2.09-2.28-.37,5.26,.13,.13c.65,.65,1.26,.87,2.46,.87h3.91c1.33,0,2.19-.78,2.19-1.98s-.89-2-2.19-2Z"/>
          <path fill="currentColor" opacity="0.45" d="M1.41,16.58H15.82c.78,0,1.43-.7,1.43-1.52s-.65-1.52-1.43-1.52H1.41c-.78,0-1.41,.7-1.41,1.52s.63,1.52,1.41,1.52ZM10.65,7.54h10.17c.78,0,1.43-.7,1.43-1.52s-.65-1.52-1.43-1.52H10.65c-.8,0-1.46,.7-1.46,1.52s.65,1.52,1.46,1.52ZM2.59,34.66H13.65c.78,0,1.43-.7,1.43-1.52s-.65-1.52-1.43-1.52H2.59c-.8,0-1.46,.7-1.46,1.52s.65,1.52,1.46,1.52Zm6.26-9.04h7.63c.78,0,1.43-.7,1.43-1.52s-.65-1.52-1.43-1.52h-7.63c-.78,0-1.43,.7-1.43,1.52s.65,1.52,1.43,1.52Z"/>
        </svg>
      `,
      homepod: `
        <svg viewBox="0 0 50 50" class="tpl-icon-svg tpl-icon-homepod" aria-hidden="true">
          <path fill="currentColor" opacity="0.95" d="M32.7,47.5c6.2,0,8.9-0.8,11.3-3.1c3.5-3.2,5.5-7.8,5.5-12.7c0-4-1.4-7.8-4.1-10.9c-0.6-0.8-1.3-0.8-2-0.4c-2.5,1.9-5.3,2.9-10.8,2.9c-5.5,0-8.3-1-10.9-2.9c-0.7-0.5-1.4-0.4-2,0.4c-2.7,3.1-4.1,6.8-4.1,10.9c0,4.9,2.1,9.5,5.5,12.7C23.8,46.7,26.5,47.5,32.7,47.5z"/>
          <path fill="currentColor" opacity="0.62" d="M4.7,37.7h9.1c-0.4-1.3-0.7-2.5-0.8-4.1c-3.8-0.2-6.8-3.3-6.8-7.2c0-4,3.2-7.2,7.2-7.2c1.2,0,2.4,0.3,3.3,0.8c2.3-3.1,5.4-4.7,9.6-5.5V9.1c0-2.9-1.5-4.4-4.3-4.4H4.7c-2.8,0-4.3,1.5-4.3,4.4v24.2C0.4,36.2,1.9,37.7,4.7,37.7z M13.4,16.7c-2.2,0-4-1.8-4-3.9c0-2.2,1.8-3.9,4-3.9s4,1.8,4,3.9C17.3,14.9,15.5,16.7,13.4,16.7z M13.4,14.8c1.1,0,2-0.9,2-2c0-1.1-0.9-2-2-2s-2,0.9-2,2C11.4,13.9,12.3,14.8,13.4,14.8z M10.3,26.4c0,1.6,1.2,2.9,2.8,3c0.2-2,0.8-4,1.6-5.8c-0.4-0.2-0.8-0.3-1.3-0.3C11.7,23.4,10.3,24.8,10.3,26.4z"/>
          <path fill="currentColor" opacity="0.45" d="M32.7,21c4.7,0,8.1-0.9,8.1-2.2c0-1.3-3.3-2.2-8.1-2.2c-4.7,0-8.1,0.9-8.1,2.2C24.7,20.1,28,21,32.7,21z"/>
        </svg>
      `,
    };

    return `<span class="tpl-icon">${icons[name] || icons.living_sofa}</span>`;
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
