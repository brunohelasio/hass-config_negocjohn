const BRUNO_SALA_CARD_TAG = 'bruno-sala-card';

const BRUNO_SALA_DEFAULT_ENTITIES = {
  room_group: 'light.grupo_luzes_sala',
  room_toggle: 'light.sala_switch_2',
  room_fallback_lights: ['light.sala_switch_1', 'light.sala_switch_2'],
  active_sensor: 'sensor.living_room_active',
  // ANTERIOR (rollback): semantic_sensor: 'sensor.sala_semantic_state',
  semantic_sensor: 'sensor.sala_semantic_state_supervised',
  motion_recent: 'binary_sensor.sala_motion_recent',
  occupancy: 'binary_sensor.sala_occupancy',
  temperature: 'sensor.sensor_4_in_1_sala_temperature',
  humidity: 'sensor.sensor_4_in_1_sala_humidity',
  presence: 'binary_sensor.sensor_4_in_1_sala_presence',
  illuminance: 'sensor.sensor_4_in_1_sala_illuminance',
  tv: 'media_player.smart_tv_pro_2',
  tv_media: 'media_player.android_tv_192_168_3_17',
  climate: 'climate.sl_ar_condicionado',
  speaker: 'media_player.echo_show',
  spotify: 'media_player.spotifyplus_bruno_helasio',
  corridor: 'light.corredor_switch_1',
  corridor_motion_recent: 'binary_sensor.corredor_motion_recent',
  corridor_occupancy: 'binary_sensor.corredor_occupancy',
};

// ANTERIOR (rollback): const BRUNO_SALA_TV_ON_STATES = ['on', 'playing', 'paused', 'idle'];
// `buffering` e um estado transitorio ligado do MediaPlayer e deve permanecer ON.
const BRUNO_SALA_TV_ON_STATES = ['on', 'playing', 'paused', 'idle', 'buffering'];
const BRUNO_SALA_CLIMATE_ON_STATES = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const BRUNO_SALA_CLIMATE_ACTIVE_ACTIONS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const BRUNO_SALA_CLIMATE_INACTIVE_ACTIONS = ['off', 'idle'];
const BRUNO_SALA_SPEAKER_ON_STATES = ['playing', 'on', 'paused'];
const BRUNO_SALA_ACTION_COOLDOWN = 1200;
const BRUNO_SALA_CLIMATE_COOLDOWN = 2500;
const BRUNO_SALA_TV_ANIMATION_MS = 950;
const BRUNO_SALA_PRESENCE_FALLBACK_MS = 10 * 60 * 1000;

// Icones hibridos aprovados: os canvases canonicos, a ordem das camadas e os
// tempos abaixo espelham tv-v3, ac-v5 e led-strip-v7 sem reinterpretacao visual.
// ANTERIOR (cache rollback): const BRUNO_SALA_HYBRID_ASSET_VERSION = '20260713-hybrid-icons-1';
// ANTERIOR (cache rollback): const BRUNO_SALA_HYBRID_ASSET_VERSION = '20260713-premium-dashboard-1';
// ANTERIOR (cache rollback): const BRUNO_SALA_HYBRID_ASSET_VERSION = '20260714-premium-dashboard-2';
// ANTERIOR (cache rollback): const BRUNO_SALA_HYBRID_ASSET_VERSION = '20260714-premium-dashboard-3';
const BRUNO_SALA_HYBRID_ASSET_VERSION = '20260716-premium-dashboard-5';
const BRUNO_SALA_TV_HYBRID_ASSET_VERSION = '20260718-tv-hybrid-v5-blue-3';
const BRUNO_SALA_HYBRID_TIMINGS = Object.freeze({
  corridor: Object.freeze({ on: 880, off: 720, fade: 300 }),
  tv: Object.freeze({ on: 1120, off: 1020, fade: 0 }),
  climate: Object.freeze({ on: 780, off: 720, fade: 300 }),
});
const BRUNO_SALA_HYBRID_LOOPS = Object.freeze({
  corridor: Object.freeze({ glow: 6800 }),
  tv: Object.freeze({ glow: 5500 }),
  climate: Object.freeze({ glow: 4800, airflow: 2200 }),
});

function _hybridRootClass(family, active, transition) {
  // ANTERIOR (rollback): a prop active recebia o estado visual temporario no
  // desligamento. Isso preservava o frame, mas fazia a prop divergir da entidade.
  // const visualActive = active;
  const visualActive = transition === 'turning-off' ? true : active;
  return [
    'hybridIcon',
    `${family}Hybrid`,
    // ANTERIOR (rollback): active ? 'hybridIcon--on' : 'hybridIcon--off',
    visualActive ? 'hybridIcon--on' : 'hybridIcon--off',
    transition ? `hybridIcon--${transition}` : '',
  ].filter(Boolean).join(' ');
}

function _hybridStyle(size, canonicalWidth, elapsed, phases = {}) {
  const safeSize = Number.isFinite(Number(size)) ? Number(size) : 42;
  const safeElapsed = Math.max(0, Number(elapsed) || 0);
  const declarations = [
    `--hybrid-size:${safeSize}px`,
    `--hybrid-scale:${safeSize / canonicalWidth}`,
    `--hybrid-transition-delay:-${safeElapsed}ms`,
  ];

  Object.entries(phases).forEach(([name, value]) => {
    declarations.push(`--hybrid-${name}-delay:-${Math.max(0, Number(value) || 0)}ms`);
  });

  return declarations.join(';');
}

// Componentes visuais controlados. Eles retornam somente o icone aprovado:
// sem botao, card, texto, pill, background ou estado local proprio.
function HybridTvIcon({ active, transition = '', elapsed = 0, size = 42, glowPhase = 0, key = 'tv' }) {
  const rootClass = _hybridRootClass('tv', active, transition);
  const style = _hybridStyle(size, 250, elapsed, { glow: glowPhase });
  const base = `/local/bruno-ui/assets/hybrid-icons/tv/v5`;
  const version = BRUNO_SALA_TV_HYBRID_ASSET_VERSION;

  return `
    <span class="${rootClass}" data-hybrid-key="${key}" style="${style}">
      <span class="tvV5__canvas">
        <img class="tvV5__layer tvV5__screenGlow" src="${base}/tv-glow.png?v=${version}" alt="">
        <span class="tvV5__screenBase"></span>
        <img class="tvV5__layer tvV5__screenOn" src="${base}/tv-screen-on.png?v=${version}" alt="">
        <span class="tvV5__screenClip">
          <span class="tvV5__screenWash"></span>
          <span class="tvV5__oledLine"></span>
        </span>
        <img class="tvV5__layer tvV5__frameOff" src="${base}/tv-frame-off.png?v=${version}" alt="">
        <img class="tvV5__layer tvV5__frameOn" src="${base}/tv-frame-on.png?v=${version}" alt="">
        <span class="tvV5__metalFrame"></span>
      </span>
    </span>
  `;
}

function HybridAcIcon({
  active,
  transition = '',
  elapsed = 0,
  size = 42,
  glowPhase = 0,
  airflowPhase = 0,
  key = 'climate',
}) {
  const rootClass = _hybridRootClass('ac', active, transition);
  const style = _hybridStyle(size, 250, elapsed, {
    glow: glowPhase,
    airflow: airflowPhase,
  });
  const base = `/local/bruno-ui/assets/hybrid-icons/ac`;
  const version = BRUNO_SALA_HYBRID_ASSET_VERSION;

  return `
    <span class="${rootClass}" data-hybrid-key="${key}" style="${style}">
      <span class="acHybrid__canvas">
        <img class="acHybrid__layer acHybrid__glow" src="${base}/ac-glow.png?v=${version}" alt="">
        <!-- ANTERIOR V2 (rollback):
        <img class="acHybrid__layer acHybrid__airflow" src="${base}/ac-airflow.png?v=${version}" alt="">
        -->
        <!-- DASHBOARD EDITION V3: o viewport desacopla a escala vertical do
             airflow da animacao interna e devolve altura util ao aparelho. -->
        <span class="acHybrid__airflowViewport">
          <img class="acHybrid__layer acHybrid__airflow" src="${base}/ac-airflow.png?v=${version}" alt="">
        </span>
        <img class="acHybrid__layer acHybrid__frameOff" src="${base}/ac-frame-off.png?v=${version}" alt="">
        <img class="acHybrid__layer acHybrid__frameOn" src="${base}/ac-frame-on.png?v=${version}" alt="">
        <span class="acHybrid__chassisRim"></span>
        <span class="acHybrid__statusLed"></span>
        <span class="acHybrid__outletLine"></span>
      </span>
    </span>
  `;
}

function HybridLedStripIcon({ active, transition = '', elapsed = 0, size = 42, glowPhase = 0, key = 'corridor' }) {
  const rootClass = _hybridRootClass('led', active, transition);
  const style = _hybridStyle(size, 280, elapsed, { glow: glowPhase });
  const base = `/local/bruno-ui/assets/hybrid-icons/led-strip`;
  const version = BRUNO_SALA_HYBRID_ASSET_VERSION;

  return `
    <span class="${rootClass}" data-hybrid-key="${key}" style="${style}">
      <span class="ledHybrid__canvas">
        <img class="ledHybrid__layer ledHybrid__glow" src="${base}/led-strip-glow.png?v=${version}" alt="">
        <img class="ledHybrid__layer ledHybrid__frameOff" src="${base}/led-strip-frame-off.png?v=${version}" alt="">
        <img class="ledHybrid__layer ledHybrid__frameOn" src="${base}/led-strip-frame-on.png?v=${version}" alt="">
        <!-- DASHBOARD EDITION: trilho estrutural de duplo contraste. Mantem a
             geometria aprovada e garante leitura premium mesmo no estado OFF. -->
        <svg class="ledHybrid__rail" viewBox="0 0 360 210" aria-hidden="true">
          <path class="ledHybrid__railBase" d="M175 113 H74 C47 113 29 101 29 82 C29 63 45 47 74 47 H306"></path>
          <path class="ledHybrid__railBase" d="M175 113 H280 C303 113 317 130 317 151 C317 170 303 184 280 184 H29"></path>
          <path class="ledHybrid__railRim" d="M175 113 H74 C47 113 29 101 29 82 C29 63 45 47 74 47 H306"></path>
          <path class="ledHybrid__railRim" d="M175 113 H280 C303 113 317 130 317 151 C317 170 303 184 280 184 H29"></path>
          <path class="ledHybrid__railDiffuser" pathLength="1" d="M175 113 H74 C47 113 29 101 29 82 C29 63 45 47 74 47 H306"></path>
          <path class="ledHybrid__railDiffuser" pathLength="1" d="M175 113 H280 C303 113 317 130 317 151 C317 170 303 184 280 184 H29"></path>
        </svg>
        <svg class="ledHybrid__trace" viewBox="0 0 360 210" aria-hidden="true">
          <path class="ledHybrid__traceA" pathLength="1" d="M175 113 H74 C47 113 29 101 29 82 C29 63 45 47 74 47 H306"></path>
          <path class="ledHybrid__traceB" pathLength="1" d="M175 113 H280 C303 113 317 130 317 151 C317 170 303 184 280 184 H29"></path>
        </svg>
      </span>
    </span>
  `;
}

class BrunoSalaCard extends HTMLElement {
  constructor() {
    super();
    this._hybridTransitions = new Map();
    this._hybridTimers = new Map();
    this._hybridTransitionToken = 0;
  }

  connectedCallback() {
    if (!this._onBrunoThemeChanged) {
      this._onBrunoThemeChanged = () => {
        this._joshModeCache = undefined;
        this._render();
      };
    }
    globalThis.addEventListener?.('bruno-theme-changed', this._onBrunoThemeChanged);
    this._joshModeCache = undefined;
    if (this._config) this._render();
  }

  disconnectedCallback() {
    this._hybridTimers.forEach((timer) => window.clearTimeout(timer));
    this._hybridTimers.clear();
    globalThis.removeEventListener?.('bruno-theme-changed', this._onBrunoThemeChanged);
  }

  _themeJoshMode() {
    if (this._joshModeCache !== undefined) return this._joshModeCache;
    let value = '';
    try {
      value = getComputedStyle(this).getPropertyValue('--bruno-tile-mode').trim();
    } catch (_error) {
      value = '';
    }
    this._joshModeCache = value === 'on';
    return this._joshModeCache;
  }

  _homeThemeClass() {
    return this._themeJoshMode() ? ' is-josh-theme' : '';
  }

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
      // NOVO (Etapa B): a Sala é SEÇÃO da shell. O chevron abre a seção #sala (sem
      // trocar de view). Se `section` for removido, volta a navegar p/ navigation_path.
      section: 'sala',
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
    // NOVO (2026-07-12): fail-closed. Somente o motion_recent supervisionado
    // pode acender o dot; ausencia da entidade nunca volta ao raw MQTT.
    const supervisedMotion = this._state(this._config.entities.motion_recent);
    return supervisedMotion?.state === 'on';

    /* ANTERIOR (rollback): fallbacks para occupancy e presence bruta.
    // ANTERIOR (rollback): dot tambem acendia com occupancy — apos a saida, o
    // delay_off da ocupacao (minutos) segurava o dot aceso com presence ja false.
    // if (motion?.state === 'on' || occupancy?.state === 'on') return true;
    // if (motion || occupancy) return false;
    // NOVO (2026-07-03): dot = presenca imediata APENAS (regra: saiu -> apaga rapido).
    // Occupancy so e usada como fonte se a camada motion_recent nao existir.
    const motion = this._state(this._config.entities.motion_recent);
    if (motion) return motion.state === 'on';
    const occupancy = this._state(this._config.entities.occupancy);
    if (occupancy) return occupancy.state === 'on';

    // FALLBACK - sensor original da Sala antes da camada de ocupacao.
    const entity = this._state(this._config.entities.presence);
    if (entity?.state !== 'on' || !entity.last_changed) return false;

    const changedAt = Date.parse(entity.last_changed);
    return !Number.isNaN(changedAt) && Date.now() - changedAt < BRUNO_SALA_PRESENCE_FALLBACK_MS;
    */
  }

  _semanticLine() {
    const semantic = this._state(this._config.entities.semantic_sensor);
    const semanticState = String(semantic?.state || '').toLowerCase();
    const display = semantic?.attributes?.display;
    if (display && !['none', 'unknown', 'unavailable'].includes(semanticState)) {
      return String(display).trim();
    }

    // ANTERIOR (rollback): fallback mostrava o texto so pela ocupacao (podia
    // ficar visivel apos o dot apagar).
    // return occupancy?.state === 'on' ? 'Ocupada' : '';
    // NOVO (2026-07-04): fallback exige presenca ativa junto com a ocupacao.
    const motionRecent = this._state(this._config.entities.motion_recent);
    if (motionRecent && motionRecent.state !== 'on') return '';
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

  // A linha inferior representa se o climate esta habilitado, mesmo quando a
  // acao HVAC esta idle. O dot superior continua usando _climateIsActive().
  _climateIsEnabled(entity) {
    return !this._isUnavailable(entity) && entity.state !== 'off';
  }

  _getCorridorSemanticStatus() {
    const entities = this._config.entities;
    const motionRecent = this._state(entities.corridor_motion_recent);
    if (motionRecent?.state === 'on') return 'Presença detectada';

    const occupancy = this._state(entities.corridor_occupancy);
    if (occupancy?.state === 'on') return 'Movimento recente';

    return null;
  }

  _semanticMediaValue(value) {
    if (typeof value !== 'string') return null;
    const normalized = value.trim();
    if (!normalized) return null;

    const lower = normalized.toLowerCase();
    if (['unknown', 'unavailable', 'none', 'null', 'off', 'idle'].includes(lower)) return null;
    // ANTERIOR (rollback): filtrava apenas http(s), paths e package IDs com
    // tres ou mais segmentos; por exemplo, `com.netflix` ainda vazava.
    // if (/^(https?:|\/)/i.test(normalized)) return null;
    // if (/^[a-z][a-z0-9_-]*(?:\.[a-z0-9_-]+){2,}$/i.test(normalized)) return null;
    if (/^(?:[a-z][a-z0-9+.-]*:\/\/|\/)/i.test(normalized)) return null;
    if (/^[a-z][a-z0-9_-]*(?:\.[a-z0-9_-]+)+$/.test(normalized)) return null;
    if (/^(media_player|sensor|switch|remote|input_[a-z_]+)\.[a-z0-9_]+$/i.test(normalized)) return null;

    return normalized;
  }

  _getTvSemanticStatus(entity, enabled) {
    if (!enabled) return null;

    const attributes = entity?.attributes || {};
    // ANTERIOR (rollback): aceitava title/series tambem em `on` e `idle`,
    // estados nos quais Android TV costuma reter metadata antiga.
    // const candidates = [
    //   attributes.media_title,
    //   attributes.media_series_title,
    //   attributes.app_name,
    //   attributes.source,
    // ];
    const playbackState = String(entity?.state || '').toLowerCase();
    // ANTERIOR (rollback): const reliableTitles = ['playing', 'paused'].includes(playbackState)
    const reliableTitles = ['playing', 'paused', 'buffering'].includes(playbackState)
      ? [attributes.media_title, attributes.media_series_title]
      : [];
    const candidates = [
      ...reliableTitles,
      attributes.app_name,
      attributes.source,
    ];

    for (const candidate of candidates) {
      const value = this._semanticMediaValue(candidate);
      if (value) return value;
    }

    return 'Em reprodução';
  }

  _translateHvacAction(value) {
    const action = String(value || '').toLowerCase();
    const translations = {
      cooling: 'Resfriando',
      heating: 'Aquecendo',
      preheating: 'Aquecendo',
      drying: 'Desumidificando',
      fan: 'Ventilando',
    };
    return translations[action] || null;
  }

  _formatTargetTemperature(value) {
    if (value === null || value === undefined || value === '') return null;
    const temperature = Number(value);
    if (!Number.isFinite(temperature)) return null;
    return String(temperature).replace('.', ',');
  }

  _getAcSemanticStatus(entity, enabled) {
    if (!enabled) return null;

    const target = this._formatTargetTemperature(entity?.attributes?.temperature);
    const action = this._translateHvacAction(this._climateAction(entity));

    if (target && action) return `${target}° · ${action}`;
    if (target) return `Ajustado em ${target}°`;
    if (action) return action;
    return 'Climatização ativa';
  }

  _climateLabel(entity) {
    const hvacAction = this._climateAction(entity);
    if (hvacAction === 'idle') return 'Em espera';
    if (!this._climateIsActive(entity)) return 'Desligado';

    const temperature = entity?.attributes?.temperature;
    return Number.isFinite(Number(temperature)) ? `${Number(temperature)}&deg;` : 'Ligado';
  }

  _normalizeMediaDevice(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  _spotifyOnDevice(expected) {
    const spotify = this._state(this._config.entities.spotify);
    if (!BRUNO_SALA_SPEAKER_ON_STATES.includes(spotify?.state || '')) return false;
    const attrs = spotify?.attributes || {};
    const wanted = this._normalizeMediaDevice(expected);
    if (!wanted) return false;
    return [
      attrs.source,
      attrs.source_name,
      attrs.device_name,
      attrs.active_device_name,
      attrs.spotify_device_name,
      attrs.media_player,
      attrs.media_player_name,
    ].some((value) => {
      const current = this._normalizeMediaDevice(value);
      return current && (current.includes(wanted) || wanted.includes(current));
    });
  }

  _model() {
    const entities = this._config.entities;
    const room = this._state(entities.room_group);
    const tv = this._state(entities.tv);
    const tvMedia = this._state(entities.tv_media) || tv;
    const climate = this._state(entities.climate);
    const corridor = this._state(entities.corridor);

    const roomOn = room?.state === 'on';
    const tvState = String(tv?.state || '').toLowerCase();
    const tvOn = BRUNO_SALA_TV_ON_STATES.includes(tvState);
    const climateOn = this._climateIsActive(climate);
    const climateEnabled = this._climateIsEnabled(climate);
    const speakerOn = BRUNO_SALA_SPEAKER_ON_STATES.includes(this._state(entities.speaker)?.state || '')
      || this._spotifyOnDevice('Echo Show');
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
      climateEnabled,
      speakerOn,
      corridorOn,
      presenceOn: this._presenceRecent(),
      temperature: this._sensorValue(entities.temperature, '&deg;'),
      humidity: this._sensorValue(entities.humidity, '%'),
      lights,
      statusLines,
      corridorSemanticStatus: this._getCorridorSemanticStatus(),
      tvSemanticStatus: this._getTvSemanticStatus(tvMedia, tvOn),
      acSemanticStatus: this._getAcSemanticStatus(climate, climateEnabled),
      // ORIGINAL labels (rollback): mantidos para aria-label/tooltip futuro
      tvLabel: this._tvLabel(tv),
      climateLabel: this._climateLabel(climate),
      corridorLabel: corridorOn ? 'Ligado' : 'Desligado',
      // NOVO: labels compactos ON/OFF para command-state (mockup react)
      tvStateLabel: tvOn ? 'ON' : 'OFF',
      // ANTERIOR (rollback): climateStateLabel: climateOn ? 'ON' : 'OFF',
      climateStateLabel: climateEnabled ? 'ON' : 'OFF',
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
      const service = BRUNO_SALA_TV_ON_STATES.includes(String(this._state(entities.tv)?.state || '').toLowerCase())
        ? 'media_player.turn_off'
        : 'media_player.turn_on';
      this._callService(service, {}, { entity_id: entities.tv });
      return;
    }

    if (key === 'climate') {
      if (gesture === 'tap' && this._isActionCoolingDown(key)) return;
      if (gesture === 'hold') {
        this._moreInfo(entities.climate);
        return;
      }
      /* ANTERIOR (rollback): a acao idle era interpretada como climate OFF.
      const service = this._climateIsActive(this._state(entities.climate))
        ? 'climate.turn_off'
        : 'climate.turn_on';
      */
      const service = this._climateIsEnabled(this._state(entities.climate))
        ? 'climate.turn_off'
        : 'climate.turn_on';
      this._callService(service, {}, { entity_id: entities.climate });
    }
  }

  _runRoomSubview() {
    globalThis.BrunoLiquidGlass?.feedback?.('tap');
    // NOVO (Etapa B): se houver `section`, abre a SEÇÃO da shell (mesma mecânica
    // do rail: fire-dom-event bruno_section) — sem trocar de view, sem salto.
    // Caso contrário, mantém o comportamento antigo (navegar para a subview).
    const section = this._config?.section;
    if (section) {
      this.dispatchEvent(new CustomEvent('ll-custom', {
        detail: { action: 'fire-dom-event', bruno_section: section },
        bubbles: true,
        composed: true,
      }));
      return;
    }
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

  _wireAction(button) {
    const key = button.dataset.actionKey;
    if (!key) return;

    let holdTimer = null;
    let holdFired = false;
    let pointerDown = false;
    // NOVO (2026-07-22) — consolidacao mobile: distingue tap intencional de
    // arraste iniciado sobre o card, sem impedir o scroll nativo da shell.
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
      // ANTERIOR (rollback): if (activePointerId !== null) return;
      if (activePointerId !== null) {
        event.stopPropagation();
        return;
      }
      // ANTERIOR (rollback): event.preventDefault();
      // NOVO (2026-07-22) — consolidacao mobile: nao cancela o gesto nativo;
      // a shell continua livre para iniciar a rolagem vertical.
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
        globalThis.BrunoLiquidGlass?.feedback?.('hold');
        this._runAction(key, 'hold');
      }, 560);
    });

    // NOVO (2026-07-22) — consolidacao mobile: qualquer deslocamento acima
    // da tolerancia cancela tap e hold, mas nao chama preventDefault().
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
      // ANTERIOR (rollback): if (event.pointerId !== activePointerId) return;
      if (event.pointerId !== activePointerId) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      // ANTERIOR (rollback): button.releasePointerCapture?.(event.pointerId);

      const wasPointerDown = pointerDown;
      const wasPointerMoved = pointerMoved;
      resetPress();

      // ANTERIOR (rollback): if (!wasPointerDown || holdFired) return;
      if (!wasPointerDown || wasPointerMoved || holdFired) return;
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
    // ANTERIOR (rollback): button.addEventListener('pointercancel', resetPress);
    button.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== activePointerId) return;
      resetPress();
    });

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
    // NOVO (2026-07-22) — consolidacao mobile: a zona de navegacao segue o
    // mesmo contrato de gesto do restante do card.
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
      zone.classList.remove('is-pressed');
    };

    zone.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      // NOVO (2026-07-22) — consolidacao mobile: mantem um unico pointer
      // responsavel pela navegacao/hold ate o encerramento do gesto.
      // ANTERIOR (rollback): if (activePointerId !== null) return;
      if (activePointerId !== null) {
        event.stopPropagation();
        return;
      }
      // ANTERIOR (rollback): event.preventDefault();
      // NOVO (2026-07-22) — consolidacao mobile: preserva o scroll nativo.
      event.stopPropagation();

      pointerDown = true;
      holdFired = false;
      activePointerId = event.pointerId;
      pointerStartX = event.clientX;
      pointerStartY = event.clientY;
      pointerMoved = false;
      zone.classList.add('is-pressed');
      // ANTERIOR (rollback): zone.setPointerCapture?.(event.pointerId);

      holdTimer = window.setTimeout(() => {
        if (!pointerDown || pointerMoved) return;
        holdFired = true;
        zone.classList.add('is-hold-fired');
        window.setTimeout(() => zone.classList.remove('is-hold-fired'), 260);
        globalThis.BrunoLiquidGlass?.feedback?.('hold');
        this._runAction('room', 'hold');
      }, 560);
    });

    // NOVO (2026-07-22) — consolidacao mobile: movimento cancela navegacao
    // e hold sem bloquear o pan vertical ou horizontal do navegador.
    zone.addEventListener('pointermove', (event) => {
      if (!pointerDown || event.pointerId !== activePointerId) return;
      const movedX = Math.abs(event.clientX - pointerStartX);
      const movedY = Math.abs(event.clientY - pointerStartY);
      if (movedX <= dragCancelThreshold && movedY <= dragCancelThreshold) return;
      pointerMoved = true;
      clearHold();
      zone.classList.remove('is-pressed');
    });

    zone.addEventListener('pointerup', (event) => {
      // NOVO (2026-07-22) — consolidacao mobile: pointer secundario nao pode
      // concluir a navegacao iniciada por outro toque.
      // ANTERIOR (rollback): if (event.pointerId !== activePointerId) return;
      if (event.pointerId !== activePointerId) {
        event.stopPropagation();
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      // ANTERIOR (rollback): zone.releasePointerCapture?.(event.pointerId);

      const wasPointerDown = pointerDown;
      const wasPointerMoved = pointerMoved;
      resetPress();

      // ANTERIOR (rollback): if (!wasPointerDown || holdFired) return;
      if (!wasPointerDown || wasPointerMoved || holdFired) return;
      zone.classList.add('is-navigating');
      window.setTimeout(() => zone.classList.remove('is-navigating'), 420);
      window.setTimeout(() => this._runRoomSubview(), 90);
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
    // ANTERIOR (rollback): zone.addEventListener('pointercancel', resetPress);
    zone.addEventListener('pointercancel', (event) => {
      if (event.pointerId !== activePointerId) return;
      resetPress();
    });

    zone.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      event.stopPropagation();
      zone.classList.add('is-navigating');
      window.setTimeout(() => zone.classList.remove('is-navigating'), 420);
      window.setTimeout(() => this._runRoomSubview(), 90);
    });
  }

  _statusDot(icon, active, label, tone) {
    const activeClass = active ? ' is-active' : '';
    return `
      <span class="status-dot tone-${tone}${activeClass}" title="${BrunoSalaCard._escape(label)}" aria-label="${BrunoSalaCard._escape(label)}">
        <bruno-icon icon="${icon}"></bruno-icon>
      </span>
    `;
  }

  _statusLines(lines) {
    if (!lines.length) return '';
    return lines
      .map((line) => `<span>${BrunoSalaCard._escape(line)}</span>`)
      .join('');
  }

  _clearHybridTimer(key) {
    const timer = this._hybridTimers.get(key);
    if (timer !== undefined) window.clearTimeout(timer);
    this._hybridTimers.delete(key);
  }

  _scheduleHybridTransition(key, entry) {
    this._clearHybridTimer(key);
    if (!entry.phase || !entry.until) return;

    const token = entry.token;
    const delay = Math.max(0, entry.until - Date.now());
    const timer = window.setTimeout(() => this._advanceHybridTransition(key, token), delay);
    this._hybridTimers.set(key, timer);
  }

  _applyHybridDomState(key, entry) {
    const root = this.shadowRoot?.querySelector(`[data-hybrid-key="${key}"]`);
    if (!root) return;

    const visualOn = entry.phase === 'turning-off' ? true : entry.active;
    root.classList.remove(
      'hybridIcon--on',
      'hybridIcon--off',
      'hybridIcon--turning-on',
      'hybridIcon--turning-off',
      'hybridIcon--settling-off',
    );
    root.classList.add(visualOn ? 'hybridIcon--on' : 'hybridIcon--off');
    if (entry.phase) root.classList.add(`hybridIcon--${entry.phase}`);
    root.style.setProperty('--hybrid-transition-delay', '0ms');
  }

  _advanceHybridTransition(key, token) {
    const entry = this._hybridTransitions.get(key);
    if (!entry || entry.token !== token) return;

    this._hybridTimers.delete(key);
    const timing = BRUNO_SALA_HYBRID_TIMINGS[key];
    const now = Date.now();

    if (entry.phase === 'turning-off') {
      entry.phase = 'settling-off';
      entry.startedAt = now;
      entry.until = now + timing.fade;
      entry.token = ++this._hybridTransitionToken;
      this._applyHybridDomState(key, entry);
      this._scheduleHybridTransition(key, entry);
      return;
    }

    if (entry.phase === 'turning-on') {
      if (key === 'corridor') entry.glowStartedAt = now;
      if (key === 'climate') entry.airflowStartedAt = now;
    }

    entry.phase = '';
    entry.startedAt = 0;
    entry.until = 0;
    entry.token = ++this._hybridTransitionToken;
    this._applyHybridDomState(key, entry);
  }

  _normalizeHybridTransition(key, entry, now) {
    if (!entry.phase || now < entry.until) return;

    const timing = BRUNO_SALA_HYBRID_TIMINGS[key];
    if (entry.phase === 'turning-off') {
      const fadeStartedAt = entry.until;
      const fadeUntil = fadeStartedAt + timing.fade;
      if (now < fadeUntil) {
        entry.phase = 'settling-off';
        entry.startedAt = fadeStartedAt;
        entry.until = fadeUntil;
        entry.token = ++this._hybridTransitionToken;
        this._scheduleHybridTransition(key, entry);
        return;
      }
    }

    if (entry.phase === 'turning-on') {
      if (key === 'corridor') entry.glowStartedAt = now;
      if (key === 'climate') entry.airflowStartedAt = now;
    }

    entry.phase = '';
    entry.startedAt = 0;
    entry.until = 0;
    entry.token = ++this._hybridTransitionToken;
    this._clearHybridTimer(key);
  }

  _hybridTransitionFor(key, active, now) {
    if (!this._hass) {
      return { active, transition: '', elapsed: 0 };
    }

    let entry = this._hybridTransitions.get(key);
    if (!entry) {
      entry = {
        active,
        phase: '',
        startedAt: 0,
        until: 0,
        glowStartedAt: active ? now : 0,
        airflowStartedAt: active && key === 'climate' ? now : 0,
        token: ++this._hybridTransitionToken,
      };
      this._hybridTransitions.set(key, entry);
    } else {
      this._normalizeHybridTransition(key, entry, now);
    }

    if (entry.active !== active) {
      this._clearHybridTimer(key);
      entry.active = active;
      entry.phase = active ? 'turning-on' : 'turning-off';
      entry.startedAt = now;
      entry.until = now + BRUNO_SALA_HYBRID_TIMINGS[key][active ? 'on' : 'off'];
      if (active) {
        entry.glowStartedAt = key === 'corridor' ? 0 : now;
        entry.airflowStartedAt = key === 'climate' ? 0 : entry.airflowStartedAt;
      }
      entry.token = ++this._hybridTransitionToken;
      this._scheduleHybridTransition(key, entry);
    }

    if (entry.phase && !this._hybridTimers.has(key)) {
      this._scheduleHybridTransition(key, entry);
    }

    const loopDurations = BRUNO_SALA_HYBRID_LOOPS[key];
    const loopPhase = (startedAt, duration) => (
      startedAt && duration ? Math.max(0, now - startedAt) % duration : 0
    );
    return {
      // ANTERIOR (rollback): active: visualOn,
      // `active` permanece sempre igual ao estado real da entidade; a classe
      // visual ON durante turning-off e derivada apenas da fase de transicao.
      active: entry.active,
      transition: entry.phase,
      elapsed: entry.phase ? Math.max(0, now - entry.startedAt) : 0,
      glowPhase: loopPhase(entry.glowStartedAt, loopDurations.glow),
      airflowPhase: loopPhase(entry.airflowStartedAt, loopDurations.airflow),
    };
  }

  // NOTA (2026-07-20): uso intencional do renderer plano (BrunoIcons.render),
  // mesma biblioteca de icones do resto do dashboard — HybridTvIcon/HybridAcIcon/
  // HybridLedStripIcon (linhas 87-179) ficam preservados sem uso, decisao do
  // usuario de nao usar os icones hibridos em PNG neste bloco.
  _hybridIcon(key, iconName) {
    const requested = iconName === 'ledstrip'
      ? 'ledstrip'
      : iconName === 'climate'
        ? 'climate'
        : iconName === 'light_flush'
          ? 'light_flush'
          : 'tv';
    const icon = globalThis.BrunoIcons?.render(requested) || '';
    return `<span class="tpl-icon bruno-command-icon" data-bruno-device-icon="${requested}">${icon}</span>`;
  }

  _screenReaderStatus(value) {
    return String(value || '')
      .replace(/°/g, ' graus')
      .replace(/\s*·\s*/g, ', ')
      .trim();
  }

  /* ANTERIOR (rollback): icones SVG inline + subtitulo generico sempre renderizado.
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
  */

  _actionButton(key, iconName, name, label, active, tone, options = {}) {
    const activeClass = active ? ' is-active' : '';
    const semanticStatus = options.semanticStatus || null;
    const semanticClass = semanticStatus ? ' has-semantic-status' : '';
    const ariaName = options.ariaName || name;
    const ariaState = options.ariaState || (active ? 'ligado' : 'desligado');
    const ariaParts = [ariaName, ariaState];
    if (semanticStatus) ariaParts.push(this._screenReaderStatus(semanticStatus));
    const ariaLabel = ariaParts.join(', ');
    const hybridIcon = this._hybridIcon(key, iconName, options.hybridTransition, options.now);

    return `
      <button class="command-row icon-${iconName} tone-${tone}${activeClass}" type="button" data-action-key="${key}" aria-label="${BrunoSalaCard._escape(ariaLabel)}" aria-pressed="${active ? 'true' : 'false'}">
        <!-- ANTERIOR (rollback): class="command-icon is-hybrid" — a classe is-hybrid
             forcava color:inherit/filter:none (regra .command-icon.is-hybrid, ~linha
             1960), pensada para os icones PNG em camadas. Como o icone aqui e o
             vetor plano da BrunoIcons (nao mais o hibrido), essa regra cancelava a
             cor por tom de .command-row.icon-X.is-active .command-icon (~linha 1842),
             e o icone nunca mudava de cor entre ligado/desligado. -->
        <span class="command-icon" aria-hidden="true">${hybridIcon}</span>
        <span class="command-copy${semanticClass}">
          <span class="command-name">${BrunoSalaCard._escape(name)}</span>
          ${semanticStatus ? `<span class="command-category">${BrunoSalaCard._escape(semanticStatus)}</span>` : ''}
        </span>
        <span class="command-state">${BrunoSalaCard._escape(label)}</span>
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
    /* ANTERIOR (rollback): janela unica usada apenas pelo SVG inline da TV.
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
    */
    const hybridTransitions = {
      corridor: this._hybridTransitionFor('corridor', model.corridorOn, now),
      tv: this._hybridTransitionFor('tv', model.tvOn, now),
      climate: this._hybridTransitionFor('climate', model.climateEnabled, now),
    };

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
          width: 101.5%;
          height: 101.5%;
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
          width: 100%;
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

        .room-nav-zone.is-navigating .room-chevron {
          animation: brunoRoomChevronNavigate 360ms ease both;
        }

        @keyframes brunoRoomChevronNavigate {
          0% { transform: translate(0, -1px); }
          52% { transform: translate(5px, -1px); }
          100% { transform: translate(2px, -1px); }
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

        .status-dot.is-active bruno-icon {
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

        /* ANTERIOR (rollback): color: var(--state-icon-active-color, #f0c040);
           --state-icon-active-color e uma custom property herdada do DOM externo
           (fora do shadow root deste card) — no card da Sala (view principal,
           dentro do grid/stack-in-card) ela resolve para um azul vindo de um
           ancestral; nas subviews (componente isolado) essa herança nao existe e
           o fallback #f0c040 e usado, por isso so aqui aparecia azul. Corrigido
           para usar --tone local (mesmo padrao ja usado por icon-tv/icon-climate
           abaixo), que nao depende de heranca externa. */
        .command-row.icon-light_flush.is-active .command-icon {
          color: rgb(var(--tone));
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

        /* NOVO: espessura optica — mesma espessura VISUAL (em px de tela) dos
           icones da rail (bento-sidebar-card.js: 19px de exibicao, stroke-width
           1.55 => ~1.227px na tela). Como o icone aqui e exibido bem maior
           (40px), o stroke-width em unidades de viewBox precisa ser BEM menor
           para que o traco pareca do mesmo peso fino: 1.227 * 24/40 ≈ 0.74.
           Repetido dentro dos 2 media queries abaixo (34px e 30px) com o valor
           recalculado para cada tamanho — sem isso o traco engrossa visualmente
           conforme o icone cresce. CSS sempre vence o atributo de apresentacao
           stroke-width="1.5" embutido no corpo do svg da Hugeicons, entao isso
           e seguro e fica restrito a este card. O icone led-strip usa
           <g transform="scale(0.75)"> internamente, entao recebe o valor ja
           dividido por 0.75 para compensar. */
        .command-icon svg g,
        .command-icon svg path {
          stroke-width: 0.74;
        }

        /* ANTERIOR (obsoleto, 2026-07-20): compensacao so fazia sentido para o
           icone customizado led-strip, que tinha <g transform="scale(0.75)">
           interno. O icone foi trocado para hugeicons:bulb (sem transform),
           entao a regra geral acima ja se aplica corretamente sem compensacao.
        .command-icon [data-bruno-device-icon="ledstrip"] svg path {
          stroke-width: 0.98;
        }
        --- FIM ANTERIOR --- */

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

        /* Icones hibridos premium — port visual literal dos pacotes aprovados.
           O canvas canonico inteiro e escalado como unidade para preservar
           strokes, sombras, glows e proporcoes internas no tamanho compacto. */
        .command-icon.is-hybrid,
        .command-row.is-active .command-icon.is-hybrid {
          color: inherit;
          filter: none;
          transform: none;
          overflow: visible;
          pointer-events: none;
        }

        .command-copy:not(.has-semantic-status) {
          justify-content: center;
          gap: 0;
        }

        .command-row.icon-light_flush.is-active .command-state,
        .command-row.icon-tv.is-active .command-state {
          color: rgba(238,201,139,0.98);
          text-shadow:
            0 0 10px rgba(238,201,139,0.42),
            0 0 22px rgba(238,201,139,0.16);
          border-left-color: rgba(238,201,139,0.20);
        }

        .command-row.icon-climate.is-active .command-state {
          color: rgba(111,224,241,0.98);
          text-shadow:
            0 0 10px rgba(111,224,241,0.42),
            0 0 22px rgba(111,224,241,0.16);
          border-left-color: rgba(111,224,241,0.20);
        }

        .hybridIcon {
          position: relative;
          display: block;
          width: var(--hybrid-size, 42px);
          height: var(--hybrid-size, 42px);
          flex: 0 0 auto;
          isolation: isolate;
          overflow: visible;
          border: 0;
          background: none;
          pointer-events: none;
        }

        .tvHybrid__canvas,
        .acHybrid__canvas,
        .ledHybrid__canvas {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scale(var(--hybrid-scale));
          transform-origin: center;
          isolation: isolate;
          pointer-events: none;
        }

        /* TV v3 — glow -> screen -> clip/wash/OLED -> frame OFF -> frame ON. */
        .tvHybrid__canvas {
          width: 250px;
          aspect-ratio: 475 / 300;
        }

        .tvHybrid__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 320ms ease;
        }

        .tvHybrid__frameOff { opacity: 1; z-index: 4; }
        .tvHybrid__frameOn { opacity: 0; z-index: 5; }
        .tvHybrid__screenOn { opacity: 0; z-index: 1; }
        .tvHybrid__screenGlow { opacity: 0; z-index: 0; }

        .tvHybrid.hybridIcon--on .tvHybrid__frameOff { opacity: 0; }
        .tvHybrid.hybridIcon--on .tvHybrid__frameOn { opacity: 1; }
        .tvHybrid.hybridIcon--on .tvHybrid__screenOn { opacity: 1; }

        .tvHybrid.hybridIcon--on .tvHybrid__screenGlow {
          opacity: 0.65;
          animation: tvHybridGlowBreath 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvHybrid__screenClip {
          position: absolute;
          left: 7.37%;
          top: 11.33%;
          width: 85.47%;
          height: 70.33%;
          overflow: hidden;
          z-index: 3;
          pointer-events: none;
        }

        .tvHybrid__oledLine {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 1px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.85) 18%,
            #fff 50%,
            rgba(255,255,255,0.85) 82%,
            transparent 100%
          );
          box-shadow:
            0 0 5px rgba(255,255,255,0.88),
            0 0 12px rgba(238,201,139,0.52);
          opacity: 0;
        }

        .tvHybrid__screenWash {
          position: absolute;
          inset: 0;
          opacity: 0;
          background:
            radial-gradient(circle at 50% 22%, rgba(239,198,128,0.18), transparent 54%),
            linear-gradient(180deg, rgba(90,69,43,0.12), rgba(35,29,21,0.03));
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__frameOff {
          animation: tvHybridFrameOffWake 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__frameOn,
        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenOn {
          animation: tvHybridLayerOnWake 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__oledLine {
          animation: tvHybridOledOpen 900ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenWash {
          animation: tvHybridScreenWake 900ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__oledLine {
          animation: tvHybridOledClose 820ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenWash {
          animation: tvHybridScreenSleep 820ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--settling-off .tvHybrid__frameOff {
          animation: tvHybridFrameOffSettle 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--settling-off .tvHybrid__frameOn,
        .tvHybrid.hybridIcon--settling-off .tvHybrid__screenOn {
          animation: tvHybridLayerOnSettle 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes tvHybridOledOpen {
          0% {
            width: 0;
            opacity: 0;
            transform: translate(-50%, -50%) scaleY(0.7);
          }
          16% { width: 2%; opacity: 1; }
          62% { width: 100%; opacity: 1; }
          82% { width: 100%; opacity: 0.5; }
          100% { width: 100%; opacity: 0; }
        }

        @keyframes tvHybridFrameOffWake {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvHybridLayerOnWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvHybridScreenWake {
          0%, 45% { opacity: 0; }
          72% { opacity: 0.45; }
          100% { opacity: 1; }
        }

        @keyframes tvHybridOledClose {
          0% { width: 100%; opacity: 0; }
          18% { width: 100%; opacity: 1; }
          70% { width: 3%; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }

        @keyframes tvHybridScreenSleep {
          0% { opacity: 1; }
          52% { opacity: 0.24; }
          100% { opacity: 0; }
        }

        @keyframes tvHybridGlowBreath {
          0%, 100% { opacity: 0.42; transform: scale(1); }
          50% { opacity: 0.68; transform: scale(1.012); }
        }

        @keyframes tvHybridFrameOffSettle {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvHybridLayerOnSettle {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* A/C v5 — glow -> airflow (cinco curvas) -> frames -> calha. */
        .acHybrid__canvas {
          width: 250px;
          aspect-ratio: 439 / 318;
        }

        .acHybrid__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 300ms ease;
        }

        .acHybrid__frameOff { opacity: 1; z-index: 4; }
        .acHybrid__frameOn { opacity: 0; z-index: 5; }
        .acHybrid__glow { opacity: 0; z-index: 0; }
        .acHybrid__airflow { opacity: 0; z-index: 2; transform: translateY(-10px); }

        .acHybrid.hybridIcon--on .acHybrid__frameOff { opacity: 0; }
        .acHybrid.hybridIcon--on .acHybrid__frameOn { opacity: 1; }

        .acHybrid.hybridIcon--on .acHybrid__glow {
          opacity: 0.62;
          animation: acHybridGlowBreath 4.8s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .acHybrid.hybridIcon--on .acHybrid__airflow {
          opacity: 1;
          animation: acHybridAirflowLoop 2.2s ease-in-out infinite;
          animation-delay: var(--hybrid-airflow-delay);
        }

        .acHybrid__outletLine {
          position: absolute;
          left: 16%;
          top: 50.5%;
          width: 68%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(111,224,241,0.95), transparent);
          box-shadow: 0 0 8px rgba(111,224,241,0.58);
          opacity: 0;
          transform: scaleX(0.15);
          transform-origin: center;
          z-index: 6;
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__frameOff {
          animation: acHybridFrameOffWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__frameOn {
          animation: acHybridLayerOnWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__outletLine {
          animation: acHybridOutletOn 760ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__airflow {
          animation: acHybridAirflowWake 760ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-off .acHybrid__outletLine {
          animation: acHybridOutletOff 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-off .acHybrid__airflow {
          animation: acHybridAirflowSleep 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--on:not(.hybridIcon--turning-on) .acHybrid__outletLine {
          opacity: 1;
          transform: scaleX(1);
        }

        .acHybrid.hybridIcon--settling-off .acHybrid__frameOff {
          animation: acHybridFrameOffSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--settling-off .acHybrid__frameOn {
          animation: acHybridLayerOnSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes acHybridOutletOn {
          0%, 28% { opacity: 0; transform: scaleX(0.12); }
          62% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 1; transform: scaleX(1); }
        }

        @keyframes acHybridFrameOffWake {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes acHybridLayerOnWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes acHybridAirflowWake {
          0%, 42% { opacity: 0; transform: translateY(-16px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes acHybridOutletOff {
          0% { opacity: 1; transform: scaleX(1); }
          54% { opacity: 0.4; transform: scaleX(0.55); }
          100% { opacity: 0; transform: scaleX(0.12); }
        }

        @keyframes acHybridAirflowSleep {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(12px); }
        }

        @keyframes acHybridAirflowLoop {
          0%, 100% { opacity: 0.48; transform: translateY(-2px); }
          50% { opacity: 0.95; transform: translateY(5px); }
        }

        @keyframes acHybridGlowBreath {
          0%, 100% { opacity: 0.38; transform: scale(1); }
          50% { opacity: 0.64; transform: scale(1.01); }
        }

        @keyframes acHybridFrameOffSettle {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes acHybridLayerOnSettle {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* LED Strip v7 — mesmo SVG na transicao e no estado ON final. */
        .ledHybrid {
          --led-hybrid-hot: #fff0c3;
        }

        .ledHybrid__canvas {
          width: 280px;
          aspect-ratio: 360 / 210;
        }

        .ledHybrid__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 300ms ease;
        }

        .ledHybrid__frameOff { opacity: 1; z-index: 4; }
        .ledHybrid__frameOn { opacity: 0; z-index: 5; }
        .ledHybrid__glow { opacity: 0; z-index: 1; }
        .ledHybrid__lightFinal { opacity: 0; z-index: 6; }

        .ledHybrid.hybridIcon--on .ledHybrid__frameOff { opacity: 0; }
        .ledHybrid.hybridIcon--on .ledHybrid__frameOn { opacity: 1; }

        .ledHybrid.hybridIcon--on .ledHybrid__glow {
          opacity: 0.76;
          animation: ledHybridGlowBreath 6.8s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .ledHybrid__trace {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 7;
          overflow: visible;
          pointer-events: none;
          opacity: 0;
        }

        .ledHybrid__trace path {
          fill: none;
          stroke: var(--led-hybrid-hot);
          stroke-width: 4.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          filter:
            drop-shadow(0 0 3px rgba(255,240,195,0.98))
            drop-shadow(0 0 9px rgba(255,210,125,0.82))
            drop-shadow(0 0 16px rgba(255,208,116,0.32));
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__frameOff {
          animation: ledHybridFrameOffWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__frameOn {
          animation: ledHybridLayerOnWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__trace {
          opacity: 1;
        }

        .ledHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .ledHybrid__trace path {
          stroke-dashoffset: 0;
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__traceA,
        .ledHybrid.hybridIcon--turning-on .ledHybrid__traceB {
          animation: ledHybridTraceOn 860ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-off .ledHybrid__traceA,
        .ledHybrid.hybridIcon--turning-off .ledHybrid__traceB {
          stroke-dashoffset: 0;
          animation: ledHybridTraceOff 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__glow {
          animation: ledHybridGlowOn 860ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-off .ledHybrid__glow {
          animation: ledHybridGlowOff 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--settling-off .ledHybrid__frameOff {
          animation: ledHybridFrameOffSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--settling-off .ledHybrid__frameOn {
          animation: ledHybridLayerOnSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes ledHybridTraceOn {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes ledHybridFrameOffWake {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes ledHybridLayerOnWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ledHybridTraceOff {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 1; }
        }

        @keyframes ledHybridGlowOn {
          0%, 36% { opacity: 0; }
          72% { opacity: 0.48; }
          100% { opacity: 0.76; }
        }

        @keyframes ledHybridGlowOff {
          0% { opacity: 0.76; }
          100% { opacity: 0; }
        }

        @keyframes ledHybridGlowBreath {
          0%, 100% { opacity: 0.58; transform: scale(1); }
          50% { opacity: 0.80; transform: scale(1.006); }
        }

        @keyframes ledHybridFrameOffSettle {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ledHybridLayerOnSettle {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* DASHBOARD EDITION PREMIUM ---------------------------------------
           O master aprovado continua intacto. Esta camada faz a correcao
           optica necessaria em 32-46px: silhueta primeiro, material depois e
           emissao apenas no ON. Nao cria fundo, mini-card ou segundo botao. */
        .ledHybrid { --premium-halo: 255, 204, 125; }
        .tvHybrid { --premium-halo: 238, 201, 139; }
        .acHybrid { --premium-halo: 111, 224, 241; }

        /* A assinatura cromatica da linha acompanha o proprio objeto premium,
           eliminando o rail azul/roxo herdado dos glifos vetoriais antigos. */
        .command-row.icon-light_flush { --tone: 255, 204, 125; }
        .command-row.icon-tv { --tone: 238, 201, 139; }
        .command-row.icon-climate { --tone: 111, 224, 241; }

        .hybridIcon::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 53%;
          width: 94%;
          height: 58%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(4,6,10,0.72), rgba(4,6,10,0.30) 43%, transparent 74%);
          filter: blur(2.4px);
          opacity: 0.58;
          z-index: 0;
          pointer-events: none;
          transition: opacity 300ms ease, filter 300ms ease, background 300ms ease;
        }

        .sala-card.is-room-on .hybridIcon--off::before {
          opacity: 0.82;
          filter: blur(2px);
        }

        .hybridIcon--on::before {
          width: 112%;
          height: 82%;
          background: radial-gradient(ellipse, rgba(var(--premium-halo),0.42), rgba(var(--premium-halo),0.15) 42%, transparent 73%);
          filter: blur(4px);
          opacity: 0.88;
        }

        .tvHybrid__canvas,
        .acHybrid__canvas,
        .ledHybrid__canvas {
          z-index: 1;
        }

        /* TV: vidro fumê com aro champagne. A massa escura ancora a silhueta
           em fundos claros; o aro e o specular preservam leitura em fundos escuros. */
        .tvHybrid__screenClip {
          border-radius: 3px;
          background:
            radial-gradient(circle at 32% 18%, rgba(255,255,255,0.14), transparent 28%),
            linear-gradient(155deg, rgba(47,52,57,0.96), rgba(13,15,19,0.98) 54%, rgba(4,5,8,0.99));
          box-shadow:
            inset 0 0 0 1px rgba(242,229,207,0.48),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -2px 6px rgba(0,0,0,0.58),
            0 1px 2px rgba(0,0,0,0.72);
          transition: background 320ms ease, box-shadow 320ms ease;
        }

        .sala-card.is-room-on .tvHybrid.hybridIcon--off .tvHybrid__screenClip {
          background:
            radial-gradient(circle at 30% 16%, rgba(255,255,255,0.12), transparent 25%),
            linear-gradient(155deg, rgba(40,43,47,0.99), rgba(8,10,13,0.99) 58%, #020305);
          box-shadow:
            inset 0 0 0 1px rgba(255,232,191,0.68),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -2px 6px rgba(0,0,0,0.68),
            0 1px 3px rgba(0,0,0,0.84);
        }

        .tvHybrid__frameOff {
          filter:
            brightness(1.22)
            contrast(1.16)
            drop-shadow(0 1px 1px rgba(0,0,0,0.88))
            drop-shadow(0 0 1px rgba(255,238,207,0.48));
        }

        .tvHybrid__frameOn {
          filter:
            contrast(1.08)
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 4px rgba(238,201,139,0.74));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          background:
            radial-gradient(circle at 46% 20%, rgba(255,224,170,0.38), transparent 48%),
            linear-gradient(180deg, rgba(72,50,25,0.62), rgba(16,13,11,0.76));
          box-shadow:
            inset 0 0 0 1px rgba(255,222,167,0.88),
            inset 0 1px 0 rgba(255,255,255,0.34),
            inset 0 -3px 8px rgba(26,13,3,0.42),
            0 0 8px rgba(238,201,139,0.56),
            0 2px 3px rgba(0,0,0,0.78);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background:
            radial-gradient(circle at 42% 18%, rgba(255,223,169,0.42), transparent 52%),
            linear-gradient(180deg, rgba(126,81,31,0.28), rgba(35,22,10,0.08));
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenWash {
          opacity: 0.86;
        }

        /* A/C: corpo grafite sob o frame original. O frame continua sendo a
           fonte de geometria/indicador; o corpo adiciona densidade de produto. */
        .acHybrid__canvas::before {
          content: "";
          position: absolute;
          left: 9.4%;
          top: 14.2%;
          width: 81.2%;
          height: 38.8%;
          border-radius: 17px 17px 9px 9px;
          background:
            radial-gradient(circle at 28% 8%, rgba(255,255,255,0.18), transparent 30%),
            linear-gradient(180deg, rgba(58,63,68,0.98), rgba(19,22,27,0.99) 58%, rgba(6,8,11,0.99));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.20),
            inset 0 -5px 12px rgba(0,0,0,0.48),
            0 5px 10px rgba(0,0,0,0.54);
          z-index: 1;
          transition: background 300ms ease, box-shadow 300ms ease;
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--off .acHybrid__canvas::before {
          background:
            radial-gradient(circle at 28% 8%, rgba(255,255,255,0.15), transparent 28%),
            linear-gradient(180deg, rgba(47,51,56,0.99), rgba(12,15,19,0.99) 60%, rgba(3,5,8,0.99));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -5px 12px rgba(0,0,0,0.58),
            0 5px 12px rgba(0,0,0,0.68);
        }

        .acHybrid__frameOff {
          filter:
            brightness(1.12)
            contrast(1.16)
            drop-shadow(0 1px 1px rgba(0,0,0,0.88))
            drop-shadow(0 0 1px rgba(244,234,217,0.46));
        }

        .acHybrid__frameOn {
          filter:
            contrast(1.10)
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 5px rgba(111,224,241,0.76));
        }

        .acHybrid.hybridIcon--on .acHybrid__canvas::before {
          background:
            radial-gradient(circle at 28% 8%, rgba(210,252,255,0.20), transparent 30%),
            linear-gradient(180deg, rgba(23,51,57,0.99), rgba(6,23,28,0.99) 58%, rgba(2,8,11,0.99));
          box-shadow:
            inset 0 1px 0 rgba(206,251,255,0.25),
            inset 0 -5px 12px rgba(0,10,13,0.62),
            0 0 10px rgba(111,224,241,0.34),
            0 5px 10px rgba(0,0,0,0.58);
        }

        /* LED: trilho grafite + filete metálico no OFF. O trace aprovado
           permanece acima e transforma o mesmo objeto em luz no ON. */
        .ledHybrid__rail {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          z-index: 6;
          pointer-events: none;
        }

        .ledHybrid__rail path {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke 300ms ease, filter 300ms ease, opacity 300ms ease;
        }

        .ledHybrid__railBase {
          stroke: rgba(11,14,19,0.96);
          stroke-width: 11;
          filter: drop-shadow(0 5px 7px rgba(0,0,0,0.62));
        }

        .ledHybrid__railRim {
          stroke: rgba(219,210,194,0.82);
          stroke-width: 4.4;
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.92))
            drop-shadow(0 0 1px rgba(255,244,225,0.50));
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railBase {
          stroke: rgba(6,8,12,0.99);
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railRim {
          stroke: rgba(245,220,181,0.90);
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.96))
            drop-shadow(0 0 2px rgba(255,230,188,0.48));
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railBase {
          stroke: rgba(35,24,13,0.92);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railRim {
          stroke: rgba(255,213,139,0.48);
          filter: drop-shadow(0 0 3px rgba(255,205,121,0.55));
        }

        .ledHybrid.hybridIcon--on .ledHybrid__trace path {
          stroke-width: 5.2;
        }

        /* DASHBOARD EDITION PREMIUM V3 ------------------------------------
           Revisao optica tablet-first. A camada V2 acima permanece intacta
           para rollback; estes overrides separam materia fisica permanente
           de emissao, que continua restrita ao estado ON. */
        .hybridIcon {
          --premium-metal-hi: rgba(247,238,221,0.96);
          --premium-metal-mid: rgba(148,146,140,0.98);
          --premium-metal-low: rgba(42,46,50,0.99);
        }

        /* TV V3: o painel deixa de carregar sozinho a silhueta. O suporte
           possui contraste, espessura e sombra proprios, inclusive no ON. */
        .tvHybrid__bezel,
        .tvHybrid__neck,
        .tvHybrid__foot {
          position: absolute;
          pointer-events: none;
          transition: filter 320ms ease, box-shadow 320ms ease;
        }

        .tvHybrid__bezel {
          left: 5.55%;
          top: 9.2%;
          width: 88.9%;
          height: 74.7%;
          box-sizing: border-box;
          border: 5px solid transparent;
          border-radius: 7px;
          background:
            linear-gradient(160deg, var(--premium-metal-hi), var(--premium-metal-mid) 42%, var(--premium-metal-low) 82%) border-box;
          -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter:
            drop-shadow(0 4px 4px rgba(0,0,0,0.74))
            drop-shadow(0 0 1px rgba(255,245,226,0.64));
          z-index: 6;
        }

        .tvHybrid__neck {
          left: 50%;
          top: 81.4%;
          width: 10.8%;
          height: 11.4%;
          transform: translateX(-50%);
          border-radius: 0 0 5px 5px;
          background: linear-gradient(90deg, #393d41 0%, #d8d1c5 38%, #817f7b 63%, #292d31 100%);
          box-shadow:
            inset 1px 0 rgba(255,255,255,0.28),
            inset -2px 0 rgba(0,0,0,0.42),
            0 3px 4px rgba(0,0,0,0.72);
          z-index: 7;
        }

        .tvHybrid__foot {
          left: 50%;
          top: 91.1%;
          width: 38%;
          height: 8.4%;
          transform: translateX(-50%);
          border-radius: 48% 48% 32% 32% / 62% 62% 38% 38%;
          background:
            linear-gradient(180deg, rgba(247,238,221,0.98), rgba(126,126,124,0.98) 38%, rgba(34,38,42,0.99) 82%);
          box-shadow:
            inset 0 2px rgba(255,255,255,0.42),
            inset 0 -3px rgba(0,0,0,0.42),
            0 4px 5px rgba(0,0,0,0.78),
            0 0 1px rgba(255,245,226,0.68);
          z-index: 8;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__bezel,
        .tvHybrid.hybridIcon--on .tvHybrid__neck,
        .tvHybrid.hybridIcon--on .tvHybrid__foot {
          filter:
            drop-shadow(0 3px 3px rgba(0,0,0,0.76))
            drop-shadow(0 0 2px rgba(255,222,166,0.44));
        }

        /* A/C V3: o chassi ganha altura propria e centraliza no eixo da linha.
           O frame mantem a geometria original, mas perde a coloracao ciano; a
           assinatura ativa fica apenas no indicador, na calha e no airflow. */
        .acHybrid__canvas::before,
        .acHybrid__chassisRim {
          left: 5%;
          top: 10%;
          width: 90%;
          height: 51%;
          transform: translateY(26px);
          border-radius: 24px 24px 12px 12px;
        }

        .acHybrid__canvas::before {
          background:
            linear-gradient(105deg, transparent 0 17%, rgba(255,255,255,0.18) 23%, transparent 30%),
            linear-gradient(180deg, rgba(192,190,184,0.99), rgba(105,108,110,0.99) 28%, rgba(48,53,57,0.99) 67%, rgba(22,27,31,0.99));
          box-shadow:
            inset 0 3px 0 rgba(255,255,255,0.34),
            inset 0 -9px 13px rgba(0,0,0,0.38),
            0 7px 10px rgba(0,0,0,0.58);
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--off .acHybrid__canvas::before,
        .acHybrid.hybridIcon--on .acHybrid__canvas::before {
          background:
            linear-gradient(105deg, transparent 0 17%, rgba(255,255,255,0.16) 23%, transparent 30%),
            linear-gradient(180deg, rgba(184,183,178,0.99), rgba(94,99,102,0.99) 29%, rgba(40,46,50,0.99) 68%, rgba(16,21,25,0.99));
          box-shadow:
            inset 0 3px 0 rgba(255,255,255,0.32),
            inset 0 -9px 13px rgba(0,0,0,0.44),
            0 7px 11px rgba(0,0,0,0.68);
        }

        .acHybrid__frameOff,
        .acHybrid__frameOn {
          transform: translateY(26px) scale(1.11, 1.30);
          transform-origin: 50% 34%;
        }

        .acHybrid__frameOn {
          filter:
            saturate(0)
            brightness(1.08)
            contrast(1.13)
            drop-shadow(0 1px 1px rgba(0,0,0,0.86))
            drop-shadow(0 0 1px rgba(247,238,221,0.52));
        }

        .acHybrid__chassisRim {
          position: absolute;
          box-sizing: border-box;
          border: 5px solid transparent;
          background:
            linear-gradient(158deg, var(--premium-metal-hi), rgba(139,140,137,0.98) 44%, var(--premium-metal-low) 86%) border-box;
          -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter:
            drop-shadow(0 4px 4px rgba(0,0,0,0.68))
            drop-shadow(0 0 1px rgba(255,246,229,0.64));
          z-index: 7;
          pointer-events: none;
        }

        .acHybrid__airflowViewport {
          position: absolute;
          inset: 0;
          transform: translateY(25px) scaleY(0.58);
          transform-origin: 50% 50%;
          z-index: 2;
          pointer-events: none;
        }

        .acHybrid__airflowViewport .acHybrid__airflow {
          inset: 0;
        }

        .acHybrid__outletLine {
          left: 14%;
          top: 67.2%;
          width: 72%;
          height: 3px;
          z-index: 9;
        }

        .acHybrid__statusLed {
          position: absolute;
          right: 22%;
          top: 40.5%;
          width: 8.5%;
          height: 4px;
          border-radius: 999px;
          background: rgba(27,32,35,0.92);
          box-shadow:
            inset 0 1px rgba(255,255,255,0.24),
            0 1px 1px rgba(0,0,0,0.72);
          opacity: 0.72;
          z-index: 9;
          transition: background 280ms ease, box-shadow 280ms ease, opacity 280ms ease;
          pointer-events: none;
        }

        .acHybrid.hybridIcon--on .acHybrid__statusLed {
          background: rgba(154,246,255,0.98);
          box-shadow:
            0 0 5px rgba(111,224,241,0.92),
            0 0 12px rgba(111,224,241,0.42);
          opacity: 1;
        }

        .acHybrid.hybridIcon--on::before {
          top: 67%;
          width: 94%;
          height: 38%;
          background: radial-gradient(ellipse, rgba(111,224,241,0.36), rgba(111,224,241,0.11) 42%, transparent 74%);
          filter: blur(3px);
          opacity: 0.78;
        }

        .acHybrid.hybridIcon--on .acHybrid__glow {
          opacity: 0.28;
          transform: translateY(24px) scaleY(0.58);
          transform-origin: 50% 50%;
          filter: blur(1px);
          animation: acHybridOutletGlowBreath 4.8s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        @keyframes acHybridOutletGlowBreath {
          0%, 100% {
            opacity: 0.18;
            transform: translateY(24px) scale(1, 0.54);
          }
          50% {
            opacity: 0.31;
            transform: translateY(24px) scale(1.018, 0.62);
          }
        }

        /* LED V3: a borda nao engrossa sozinha. O volume adicional pertence ao
           corpo do tubo; dentro dele surge um difusor segmentado reconhecivel. */
        .ledHybrid__railBase {
          stroke: rgba(45,49,52,0.99);
          stroke-width: 18;
          filter:
            drop-shadow(0 5px 7px rgba(0,0,0,0.66))
            drop-shadow(0 0 1px rgba(255,245,226,0.34));
        }

        .ledHybrid__railRim {
          stroke: rgba(226,218,203,0.94);
          stroke-width: 13.2;
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.94))
            drop-shadow(0 0 1px rgba(255,246,229,0.66));
        }

        .ledHybrid__railDiffuser {
          stroke: rgba(184,175,160,0.96);
          stroke-width: 7.4;
          stroke-dasharray: 0.10 0.065;
          opacity: 0.96;
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 1px rgba(245,230,205,0.38));
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railBase {
          stroke: rgba(35,39,42,0.99);
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railRim {
          stroke: rgba(238,222,197,0.96);
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railDiffuser {
          stroke: rgba(154,144,128,0.98);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railBase {
          stroke: rgba(67,53,36,0.96);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railRim {
          stroke: rgba(235,218,190,0.72);
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 2px rgba(255,219,158,0.44));
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railDiffuser {
          stroke: rgba(255,205,122,0.52);
          opacity: 0.72;
          filter: drop-shadow(0 0 2px rgba(255,199,105,0.64));
        }

        /* DASHBOARD EDITION PREMIUM V4 ------------------------------------
           Correcao cirurgica posterior ao QA real. A V3 permanece acima para
           rollback. O LED strip aprovado nao recebe qualquer override aqui. */

        /* TV V4: uma unica estrutura fisica permanente. Os frames raster
           OFF/ON anteriores ficam preservados no markup, mas deixam de disputar
           contorno com bezel, pescoco e base construidos na V3. */
        .tvHybrid__frameOff,
        .tvHybrid__frameOn {
          opacity: 0 !important;
          animation: none !important;
          filter: none !important;
        }

        .tvHybrid__bezel {
          top: 8.6%;
          height: 76%;
          border-width: 5px 5px 6px;
        }

        .tvHybrid__neck {
          top: 84.7%;
          height: 9.4%;
        }

        .tvHybrid__foot {
          top: 92.8%;
          height: 7%;
        }

        /* ANTERIOR V3: bezel, pescoco e base recebiam um filtro champagne
           adicional no ON. Agora o material fisico e identico nos dois estados. */
        .tvHybrid.hybridIcon--on .tvHybrid__bezel {
          filter:
            drop-shadow(0 4px 4px rgba(0,0,0,0.74))
            drop-shadow(0 0 1px rgba(255,245,226,0.64));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__neck,
        .tvHybrid.hybridIcon--on .tvHybrid__foot {
          filter: none;
        }

        /* Todo conteudo emissivo fica limitado ao retangulo interno da tela.
           O clip usa exatamente a geometria canonica do screenClip. */
        .tvHybrid__screenOn,
        .tvHybrid__screenGlow {
          clip-path: inset(11.33% 7.16% 18.34% 7.37% round 3px);
          transform-origin: 50% 46%;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          /* ANTERIOR V4 QA: linear-gradient(180deg, rgba(76,58,36,0.78), rgba(24,18,12,0.88)); */
          background: linear-gradient(180deg, rgba(92,70,42,0.82), rgba(35,24,14,0.90));
          box-shadow:
            inset 0 0 0 1px rgba(226,213,192,0.58),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -3px 7px rgba(20,12,5,0.46),
            0 1px 2px rgba(0,0,0,0.76);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background: linear-gradient(180deg, rgba(255,222,168,0.24), rgba(151,102,47,0.14) 48%, rgba(44,27,12,0.06));
        }

        /* ANTERIOR V3: o halo geral mudava tamanho, cor e centro optico no ON.
           A TV volta a conservar apenas a mesma sombra neutra do produto OFF. */
        .tvHybrid.hybridIcon--on::before {
          top: 53%;
          width: 94%;
          height: 58%;
          background: radial-gradient(ellipse, rgba(4,6,10,0.72), rgba(4,6,10,0.30) 43%, transparent 74%);
          filter: blur(2.4px);
          opacity: 0.58;
        }

        .sala-card.is-room-on .tvHybrid.hybridIcon--on::before {
          opacity: 0.82;
          filter: blur(2px);
        }

        /* Sequencia OLED: primeiro a linha abre; somente depois de atingir a
           largura maxima a tela recebe preenchimento e glow uniformes. */
        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenOn {
          animation: tvHybridScreenFillAfterLine 900ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowAfterLine 900ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenWash {
          animation: tvHybridScreenWashAfterLine 900ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenOn {
          opacity: 0.92;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          /* ANTERIOR V4 QA: opacity: 0.34; */
          opacity: 0.42;
          animation: tvHybridScreenBreath 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenOn {
          animation: tvHybridScreenFillSleep 820ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowSleep 820ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes tvHybridScreenFillAfterLine {
          0%, 62% { opacity: 0; }
          70% { opacity: 0.14; }
          100% { opacity: 0.92; }
        }

        @keyframes tvHybridScreenGlowAfterLine {
          0%, 64% { opacity: 0; }
          74% { opacity: 0.10; }
          /* ANTERIOR V4 QA: 100% { opacity: 0.34; } */
          100% { opacity: 0.42; }
        }

        @keyframes tvHybridScreenWashAfterLine {
          0%, 62% { opacity: 0; }
          74% { opacity: 0.18; }
          100% { opacity: 0.78; }
        }

        @keyframes tvHybridScreenBreath {
          /* ANTERIOR V4 QA: 0%,100% 0.28; 50% 0.38. */
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.46; }
        }

        @keyframes tvHybridScreenFillSleep {
          0% { opacity: 0.92; }
          58%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenGlowSleep {
          /* ANTERIOR V4 QA: 0% { opacity: 0.34; } */
          0% { opacity: 0.42; }
          52%, 100% { opacity: 0; }
        }

        /* A/C V4: corpo e chassisRim compartilham a mesma geometria e passam
           a ser a unica silhueta fisica. Os frames PNG concorrentes continuam
           preservados no markup apenas para rollback. */
        .acHybrid__frameOff,
        .acHybrid__frameOn {
          opacity: 0 !important;
          animation: none !important;
          filter: none !important;
        }

        /* AJUSTE V4 POS-RENDER: ocultar ambos os frames removeu detalhe demais.
           O frame OFF neutro passa a ser o unico contorno autoritativo e fica
           permanente; a moldura CSS V3 e o frame ON continuam preservados,
           porem visualmente desativados para nao produzir linhas duplas. */
        .acHybrid__frameOff {
          opacity: 1 !important;
          transform: translateY(31px) scale(1.04, 1.30);
          transform-origin: 50% 34%;
          filter:
            brightness(1.10)
            contrast(1.14)
            drop-shadow(0 1px 1px rgba(0,0,0,0.86))
            drop-shadow(0 0 1px rgba(247,238,221,0.50)) !important;
        }

        .acHybrid__frameOn {
          opacity: 0 !important;
        }

        .acHybrid__chassisRim {
          opacity: 0;
        }

        /* O halo de estado nao altera mais o envelope optico do aparelho.
           Ciano permanece apenas no indicador, calha, glow interno e airflow. */
        .acHybrid.hybridIcon--on::before {
          top: 53%;
          width: 94%;
          height: 58%;
          background: radial-gradient(ellipse, rgba(4,6,10,0.72), rgba(4,6,10,0.30) 43%, transparent 74%);
          filter: blur(2.4px);
          opacity: 0.58;
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--on::before {
          opacity: 0.82;
          filter: blur(2px);
        }

        .acHybrid__glow {
          clip-path: inset(44% 10% 8% 10% round 0 0 20px 20px);
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

          /* NOVO: espessura optica recalculada para 34px (ver comentario na
             regra base): 1.227 * 24/34 ≈ 0.87. */
          .command-icon svg g,
          .command-icon svg path {
            stroke-width: 0.87;
          }

          /* ANTERIOR (obsoleto, 2026-07-20): ver comentario na regra base (40px).
          .command-icon [data-bruno-device-icon="ledstrip"] svg path {
            stroke-width: 1.16;
          }
          --- FIM ANTERIOR --- */

          /* ANTERIOR (rollback):
          .hybridIcon { --hybrid-size: 36px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.144 !important; }
          .ledHybrid { --hybrid-scale: 0.1285714286 !important; }
          */
          .hybridIcon { --hybrid-size: 40px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.16 !important; }
          .ledHybrid { --hybrid-scale: 0.1428571429 !important; }

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

        /* --- ANTERIOR (rollback) — bloco herdado do embed mobile V3.5:
           inflava o card no phone (min-height 300px), causando a altura
           excessiva apontada pelo usuario na Fase 2 mobile.
        @media (max-width: 800px) {
          :host {
            min-height: 300px;
          }

          .sala-card {
            min-height: 300px;
          }
        }
        --- FIM ANTERIOR --- */

        /* ANTERIOR (rollback) — Fase 2 mobile de 2026-07-09: SALA COMPACTA
           vertical no phone. Permanece ativa como fallback antes da camada
           final de consolidacao mobile de 2026-07-22.
           PNG menor, hero mais baixo e linhas de comando mais densas.
           ROLLBACK: remover este bloco e descomentar o ANTERIOR acima. */
        @media (max-width: 800px) {
          :host {
            min-height: 0;
          }

          .sala-card {
            min-height: 0;
            padding: 10px 12px;
          }

          .hero-action {
            min-height: 96px;
            grid-template-columns: 96px minmax(0, 1fr) 36px;
            padding: 0 0 6px;
          }

          .room-icon {
            width: 92px;
            height: 62px;
          }

          .command-row {
            height: 46px;
            grid-template-columns: 34px minmax(0, 1fr) 42px;
            column-gap: 5px;
          }

          .command-icon {
            width: 30px;
            height: 30px;
          }

          /* NOVO: espessura optica recalculada para 30px (ver comentario na
             regra base): 1.227 * 24/30 ≈ 0.98. */
          .command-icon svg g,
          .command-icon svg path {
            stroke-width: 0.98;
          }

          /* ANTERIOR (obsoleto, 2026-07-20): ver comentario na regra base (40px).
          .command-icon [data-bruno-device-icon="ledstrip"] svg path {
            stroke-width: 1.31;
          }
          --- FIM ANTERIOR --- */

          /* ANTERIOR (rollback):
          .hybridIcon { --hybrid-size: 32px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.128 !important; }
          .ledHybrid { --hybrid-scale: 0.1142857143 !important; }
          */
          .hybridIcon { --hybrid-size: 36px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.144 !important; }
          .ledHybrid { --hybrid-scale: 0.1285714286 !important; }

          .command-name {
            font-size: 12.6px;
          }

          .command-category {
            font-size: 10px;
          }

          .command-state {
            font-size: 9.6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-action,
          .command-row,
          .status-dot,
          .command-icon {
            transition: none !important;
          }

          .tvHybrid__oledLine,
          .tvHybrid__screenWash,
          .tvHybrid__screenGlow {
            animation: none !important;
          }
        }

        /* DASHBOARD EDITION PREMIUM V5 ------------------------------------
           Microajuste de largura posterior ao fechamento dos icones. As
           estruturas e animacoes premium permanecem intocadas: esta camada
           redistribui apenas as tres colunas internas de cada command-row. */
        .command-row {
          /* ANTERIOR V4: 40px minmax(0,1fr) 44px. */
          grid-template-columns: 40px minmax(0, 1fr) 36px;
        }

        .command-state {
          /* ANTERIOR V4: padding-left 10px; border-left 1px solid. */
          padding-left: 4px;
          border-left: 0;
          letter-spacing: 0.7px;
        }

        /* O A/C e o unico produto que ocupa quase toda a coluna de icone.
           O respiro adicional nao altera Corredor, TV ou a geometria do A/C. */
        .command-row.icon-climate .command-copy {
          padding-left: 3px;
        }

        @media (max-height: 760px) {
          .command-row {
            /* ANTERIOR V4: 36px minmax(0,1fr) 40px. */
            grid-template-columns: 36px minmax(0, 1fr) 33px;
          }

          .command-state {
            /* ANTERIOR V4: padding-left 8px. */
            padding-left: 3px;
            letter-spacing: 0.65px;
          }
        }

        @media (max-width: 800px) {
          .command-row {
            /* ANTERIOR V4: 34px minmax(0,1fr) 42px. */
            grid-template-columns: 34px minmax(0, 1fr) 34px;
          }

          .command-state {
            padding-left: 3px;
            letter-spacing: 0.6px;
          }
        }

        /* DASHBOARD EDITION PREMIUM V6 ------------------------------------
           Ajuste exclusivamente cosmetico dos produtos TV e A/C. A V4/V5
           permanece acima como fallback: nenhuma geometria, timing ou acao e
           alterada por esta camada. */

        /* A moldura continua fisicamente identica, mas o material deixa de
           usar um gradiente diagonal que sugeria laterais inclinadas em 40px. */
        .tvHybrid__bezel {
          background:
            linear-gradient(180deg, var(--premium-metal-hi), var(--premium-metal-mid) 48%, var(--premium-metal-low) 100%) border-box;
        }

        /* A assinatura ligada volta ao azul frio do template SVG anterior.
           Toda emissao permanece recortada no interior da tela. */
        .tvHybrid {
          --premium-halo: 100, 172, 183;
        }

        .command-row.icon-tv {
          --tone: 100, 172, 183;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          background: linear-gradient(180deg, rgba(127,219,233,0.84), rgba(100,172,183,0.72) 48%, rgba(24,66,78,0.92));
          box-shadow:
            inset 0 0 0 1px rgba(180,236,244,0.70),
            inset 0 1px 0 rgba(255,255,255,0.34),
            inset 0 -3px 8px rgba(9,34,43,0.54),
            0 1px 2px rgba(0,0,0,0.76);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background: linear-gradient(180deg, rgba(210,247,252,0.34), rgba(127,219,233,0.22) 46%, rgba(38,111,128,0.10));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenOn,
        .tvHybrid.hybridIcon--on .tvHybrid__screenGlow {
          filter: grayscale(1) sepia(1) saturate(4.6) hue-rotate(142deg) brightness(1.18);
          mix-blend-mode: screen;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          opacity: 0.56;
          animation: tvHybridScreenBreathBlue 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        @keyframes tvHybridScreenBreathBlue {
          0%, 100% { opacity: 0.48; }
          50% { opacity: 0.62; }
        }

        /* Remove somente a faixa diagonal especular esquerda do A/C. O
           gradiente vertical, o frame, o LED e o airflow ficam intactos. */
        .acHybrid__canvas::before {
          background:
            linear-gradient(180deg, rgba(192,190,184,0.99), rgba(105,108,110,0.99) 28%, rgba(48,53,57,0.99) 67%, rgba(22,27,31,0.99));
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--off .acHybrid__canvas::before,
        .acHybrid.hybridIcon--on .acHybrid__canvas::before {
          background:
            linear-gradient(180deg, rgba(184,183,178,0.99), rgba(94,99,102,0.99) 29%, rgba(40,46,50,0.99) 68%, rgba(16,21,25,0.99));
        }

        /* DASHBOARD EDITION PREMIUM V7 ------------------------------------
           Fechamento optico da TV: bezel uniforme, material fisico neutro e
           uma unica assinatura azul no estado ligado. A sequencia OLED
           centro-para-fora permanece a mesma no ligar e no desligar. */
        .tvHybrid__bezel {
          border-width: 5px;
        }

        .tvHybrid__neck {
          background: linear-gradient(90deg, #34393e 0%, #c9c7c2 38%, #777a7c 63%, #252a2f 100%);
        }

        .tvHybrid__foot {
          background: linear-gradient(180deg, rgba(226,226,222,0.98), rgba(116,120,122,0.98) 40%, rgba(31,36,41,0.99) 84%);
          box-shadow:
            inset 0 2px rgba(255,255,255,0.34),
            inset 0 -3px rgba(0,0,0,0.46),
            0 4px 5px rgba(0,0,0,0.76),
            0 0 1px rgba(224,235,238,0.54);
        }

        .command-row.icon-tv.is-active .command-state {
          color: rgba(156,226,238,0.98);
          text-shadow:
            0 0 9px rgba(100,172,183,0.34),
            0 0 18px rgba(100,172,183,0.12);
          border-left-color: rgba(100,172,183,0.20);
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          opacity: 0.24;
          animation: tvHybridScreenBreathBlue 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        @keyframes tvHybridScreenGlowAfterLine {
          0%, 64% { opacity: 0; }
          74% { opacity: 0.07; }
          100% { opacity: 0.24; }
        }

        @keyframes tvHybridScreenGlowSleep {
          0% { opacity: 0.24; }
          52%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenBreathBlue {
          0%, 100% { opacity: 0.20; }
          50% { opacity: 0.27; }
        }

        /* DASHBOARD EDITION PREMIUM V8 ------------------------------------
           Fechamento final da TV: aro opticamente uniforme, tela fria sem
           contaminacao champagne e sequencia OLED visivel nos dois sentidos. */
        .tvHybrid__bezel {
          left: 5.55%;
          top: 8.6%;
          width: 88.9%;
          height: 76%;
          border-width: 5px;
          border-style: solid;
          border-color: transparent;
          border-radius: 7px;
          background: linear-gradient(180deg, #d3d5d4 0%, #85898b 46%, #262b2f 100%) border-box;
          filter:
            drop-shadow(0 3px 3px rgba(0,0,0,0.70))
            drop-shadow(0 0 1px rgba(229,238,240,0.50));
        }

        .tvHybrid__screenClip {
          left: 7.55%;
          top: 11.76%;
          width: 84.9%;
          height: 69.68%;
          border-radius: 3px;
          background:
            radial-gradient(circle at 32% 18%, rgba(255,255,255,0.10), transparent 28%),
            linear-gradient(160deg, rgba(38,44,49,0.98), rgba(10,13,17,0.99) 56%, rgba(3,5,8,1));
          box-shadow:
            inset 0 0 0 1px rgba(214,224,226,0.42),
            inset 0 1px 0 rgba(255,255,255,0.16),
            inset 0 -2px 5px rgba(0,0,0,0.62),
            0 1px 2px rgba(0,0,0,0.74);
        }

        .tvHybrid__screenOn,
        .tvHybrid__screenGlow {
          clip-path: inset(11.76% 7.55% 18.56% 7.55% round 3px);
          transform-origin: 50% 46.6%;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          background:
            radial-gradient(circle at 38% 18%, rgba(220,250,255,0.20), transparent 34%),
            linear-gradient(180deg, rgba(120,196,213,0.70), rgba(64,132,148,0.56) 48%, rgba(15,45,55,0.88));
          box-shadow:
            inset 0 0 0 1px rgba(182,232,240,0.60),
            inset 0 1px 0 rgba(255,255,255,0.28),
            inset 0 -3px 7px rgba(7,28,36,0.48),
            0 1px 2px rgba(0,0,0,0.76);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background: linear-gradient(180deg, rgba(221,249,253,0.20), rgba(112,190,206,0.12) 46%, rgba(34,91,104,0.05));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenOn,
        .tvHybrid.hybridIcon--on .tvHybrid__screenGlow {
          filter: saturate(0.82) brightness(1.02);
          mix-blend-mode: screen;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenOn {
          opacity: 0.48;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          opacity: 0.11;
          animation: tvHybridScreenBreathV8 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvHybrid__oledLine {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(174,234,244,0.82) 18%, #f6fdff 50%, rgba(174,234,244,0.82) 82%, transparent 100%);
          box-shadow: 0 0 4px rgba(234,252,255,0.92), 0 0 9px rgba(100,172,183,0.54);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__oledLine {
          animation: tvHybridOledOpenV8 900ms cubic-bezier(0.2,0.72,0.2,1) forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenOn {
          animation: tvHybridScreenFillAfterLineV8 900ms cubic-bezier(0.2,0.72,0.2,1) forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowAfterLineV8 900ms ease-out forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__oledLine {
          animation: tvHybridOledCloseV8 820ms cubic-bezier(0.2,0.72,0.2,1) forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenOn {
          animation: tvHybridScreenFillSleepV8 820ms ease-in forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowSleepV8 820ms ease-in forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        @keyframes tvHybridOledOpenV8 {
          0% { width: 0; opacity: 0; transform: translate(-50%, -50%) scaleY(0.7); }
          15% { width: 3%; opacity: 1; }
          60% { width: 100%; opacity: 1; }
          82% { width: 100%; opacity: 0.48; }
          100% { width: 100%; opacity: 0; }
        }

        @keyframes tvHybridOledCloseV8 {
          0% { width: 100%; opacity: 0; }
          16% { width: 100%; opacity: 1; }
          70% { width: 3%; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }

        @keyframes tvHybridScreenFillAfterLineV8 {
          0%, 60% { opacity: 0; }
          72% { opacity: 0.12; }
          100% { opacity: 0.48; }
        }

        @keyframes tvHybridScreenGlowAfterLineV8 {
          0%, 64% { opacity: 0; }
          76% { opacity: 0.04; }
          100% { opacity: 0.11; }
        }

        @keyframes tvHybridScreenFillSleepV8 {
          0% { opacity: 0.48; }
          52%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenGlowSleepV8 {
          0% { opacity: 0.11; }
          48%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenBreathV8 {
          0%, 100% { opacity: 0.09; }
          50% { opacity: 0.13; }
        }

        /* TV HYBRID V5 PACKAGE -------------------------------------------
           Namespace isolado: nenhuma regra das edicoes V3-V8 interfere nas
           quatro camadas e na sequencia OLED entregues pelo pacote V5. */
        .tvHybrid::before {
          content: none !important;
        }

        .tvV5__canvas {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 250px;
          aspect-ratio: 475 / 300;
          transform: translate(-50%, -50%) scale(var(--hybrid-scale));
          transform-origin: center;
          isolation: isolate;
          z-index: 1;
          pointer-events: none;
        }

        .tvV5__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 320ms ease;
        }

        .tvV5__frameOff { z-index: 4; opacity: 1; }
        .tvV5__frameOn { z-index: 5; opacity: 0; }
        .tvV5__screenOn { z-index: 2; opacity: 0; }
        .tvV5__screenGlow { z-index: 2; opacity: 0; }

        .tvV5__screenOn,
        .tvV5__screenGlow {
          clip-path: inset(14.50% 8.96% 21.50% 9.37% round 2px);
        }

        .tvV5__screenBase {
          position: absolute;
          left: 7.37%;
          top: 11.33%;
          width: 85.47%;
          height: 70.33%;
          box-sizing: border-box;
          border-radius: 3px;
          background:
            radial-gradient(circle at 34% 18%, rgba(73,80,86,0.20), transparent 32%),
            linear-gradient(158deg, rgba(29,33,37,0.99), rgba(8,10,13,1) 58%, rgba(2,3,5,1));
          box-shadow:
            inset 0 0 0 1px rgba(211,218,219,0.16),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -3px 7px rgba(0,0,0,0.72);
          z-index: 1;
          pointer-events: none;
        }

        .tvV5__screenBase::after {
          content: "";
          position: absolute;
          inset: 5px 4.5px;
          border-radius: 2px;
          opacity: 0;
          background:
            radial-gradient(circle at 38% 18%, rgba(214,246,252,0.18), transparent 35%),
            linear-gradient(180deg, rgba(104,190,209,0.84), rgba(54,126,145,0.78) 50%, rgba(13,45,55,0.96));
          box-shadow:
            inset 0 0 0 1px rgba(193,235,242,0.38),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -3px 7px rgba(5,27,34,0.58);
          pointer-events: none;
        }

        .tvV5__metalFrame {
          position: absolute;
          left: 5.95%;
          top: 9.37%;
          width: 88.32%;
          height: 74.26%;
          box-sizing: border-box;
          border: 7px solid rgba(142,147,149,0.98);
          border-radius: 7px;
          box-shadow:
            inset 0 0 0 1px rgba(232,235,234,0.34),
            0 0 0 1px rgba(31,35,38,0.84),
            0 3px 4px rgba(0,0,0,0.68),
            0 0 2px rgba(224,230,230,0.42);
          z-index: 6;
          pointer-events: none;
        }

        .tvHybrid.hybridIcon--on .tvV5__frameOff { opacity: 0; }
        .tvHybrid.hybridIcon--on .tvV5__frameOn { opacity: 1; }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvV5__screenOn {
          opacity: 1;
          filter: saturate(1.16) brightness(1.12);
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvV5__screenBase::after {
          opacity: 1;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvV5__screenGlow {
          opacity: 0.34;
          filter: saturate(1.14) brightness(1.10);
          animation: tvV5GlowBreath 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvV5__screenClip {
          position: absolute;
          left: 9.37%;
          top: 14.50%;
          z-index: 3;
          width: 81.67%;
          height: 64%;
          overflow: hidden;
          pointer-events: none;
        }

        .tvV5__oledLine {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 1px;
          opacity: 0;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 18%, #fff 50%, rgba(255,255,255,0.85) 82%, transparent 100%);
          box-shadow: 0 0 5px rgba(255,255,255,0.88), 0 0 12px rgba(84,164,255,0.55);
        }

        .tvV5__screenWash {
          position: absolute;
          inset: 0;
          opacity: 0;
          background:
            radial-gradient(circle at 50% 22%, rgba(84,164,255,0.18), transparent 54%),
            linear-gradient(180deg, rgba(35,67,104,0.12), rgba(18,29,43,0.03));
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__oledLine {
          animation: tvV5OledOpen 700ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__screenWash {
          animation: tvV5ScreenWake 420ms ease-out forwards;
          animation-delay: calc(650ms + var(--hybrid-transition-delay));
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__screenOn {
          animation: tvV5ScreenLayerIn 420ms ease-out forwards;
          animation-delay: calc(650ms + var(--hybrid-transition-delay));
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__screenGlow {
          animation: tvV5GlowLayerIn 420ms ease-out forwards;
          animation-delay: calc(650ms + var(--hybrid-transition-delay));
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenGlow {
          opacity: 0.34;
          animation: tvV5GlowLayerOut 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenBase::after {
          opacity: 1;
          animation: tvV5ScreenBaseOut 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenOn {
          opacity: 1;
          animation: tvV5ScreenLayerOut 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenWash {
          opacity: 1;
          animation: tvV5ScreenSleep 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__oledLine {
          animation: tvV5OledClose 700ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: calc(300ms + var(--hybrid-transition-delay));
        }

        @keyframes tvV5OledOpen {
          0% { width: 0; opacity: 0; transform: translate(-50%, -50%) scaleY(0.7); }
          14% { width: 2%; opacity: 1; }
          78% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }

        @keyframes tvV5ScreenWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvV5ScreenLayerIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvV5GlowLayerIn {
          from { opacity: 0; }
          to { opacity: 0.34; }
        }

        @keyframes tvV5GlowLayerOut {
          from { opacity: 0.34; }
          to { opacity: 0; }
        }

        @keyframes tvV5ScreenBaseOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvV5ScreenLayerOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvV5ScreenSleep {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvV5OledClose {
          0% { width: 100%; opacity: 0; }
          14% { width: 100%; opacity: 1; }
          82% { width: 3%; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }

        @keyframes tvV5GlowBreath {
          0%, 100% { opacity: 0.26; }
          50% { opacity: 0.36; }
        }

        /* NOVO (2026-07-22) — consolidacao mobile -------------------------
           A Sala conserva a hierarquia pela largura integral, mas passa a
           compartilhar a altura de 176px dos demais comodos. Identidade e
           navegacao ficam a esquerda; Corredor, TV e A/C formam tres alvos
           independentes empilhados a direita. Esta camada final e aditiva e
           sobrescreve somente a geometria em <=800px.

           ANTERIOR (rollback): composicao vertical definida nos blocos
           @media (max-width: 800px) acima (hero 96px + tres comandos 46px). */
        @media (max-width: 800px) {
          :host {
            height: 100%;
            min-height: 0;
          }

          .sala-card {
            height: 100%;
            min-height: 0;
            display: grid;
            /* ANTERIOR (rollback):
               grid-template-columns: minmax(0, 1fr) minmax(138px, 44%); */
            /* NOVO (2026-07-22) — a divisoria da action-strip coincide com o
               eixo geometrico do card e com a separacao da grade abaixo. */
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: minmax(0, 1fr);
            /* ANTERIOR (rollback): column-gap: 9px; */
            column-gap: 0;
            padding: 10px 10px 10px 12px;
          }

          .hero-action {
            min-width: 0;
            width: 100%;
            height: 100%;
            min-height: 0;
            /* ANTERIOR (rollback):
               grid-template-columns: 82px minmax(0, 1fr) 32px; */
            /* NOVO (2026-07-22) — a trilha final reserva 8px de respiro
               entre temperatura/status e a divisoria central. */
            grid-template-columns: 82px minmax(0, 1fr) 40px;
            grid-template-rows: auto minmax(0, 1fr) auto auto;
            column-gap: 4px;
            padding: 0;
          }

          .room-icon {
            width: 80px;
            height: 54px;
            margin: 0;
          }

          /* Micromaquete V2 apenas no phone. A caixa do icone permanece
             80x54; a escala/offset reproduzem, proporcionalmente, o encaixe
             alfa medido e aprovado no bruno-room-tile do tablet. */
          .room-asset-wrap picture {
            display: contents;
          }

          .room-asset,
          .sala-card.is-room-on .room-asset-on {
            inset: auto;
            top: 0;
            left: 0;
            width: auto;
            /* ANTERIOR (rollback microajustes remanescentes): height: 111%; */
            /* Sala partia de uma caixa 80x54; 135% iguala a altura visual das
               micromaquetes dos demais comodos sem alterar o tablet. */
            height: 135%;
            aspect-ratio: 1 / 1;
            object-fit: contain;
            object-position: left top;
            transform: translate(-8.66%, -7.81%);
          }

          .sala-card.is-josh-theme .status-dot.is-active {
            background: rgba(var(--tone), var(--bruno-tile-status-dot-fill-alpha, 0.78));
            border: var(--bruno-tile-status-dot-border, 0);
            box-shadow: 0 0 var(--bruno-tile-status-dot-halo-size, 8px)
              rgba(var(--tone), var(--bruno-tile-status-dot-halo-alpha, 0.18));
          }

          .right-rail {
            width: 32px;
            /* ANTERIOR (rollback): herdava transform: translate(5px, -3px)
               do contrato desktop, aproximando a metrica da divisoria. */
            justify-self: start;
            transform: translate(0, -3px);
          }

          .room-nav-zone {
            min-height: 48px;
            padding-right: 8px;
          }

          .title {
            font-size: 14px;
          }

          .lights-line,
          .sala-card.has-status-stack .lights-line {
            max-height: 25px;
            font-size: 10.2px;
          }

          .action-strip {
            align-self: stretch;
            height: 100%;
            min-height: 0;
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: repeat(3, minmax(0, 1fr));
            border-left: 1px solid rgba(255,255,255,0.105);
            padding-left: 7px;
          }

          .command-row {
            height: auto;
            min-height: 44px;
            grid-template-columns: 30px minmax(0, 1fr) 32px;
            column-gap: 4px;
            padding: 0 0 0 2px;
          }

          .command-row::before {
            left: -1px;
            top: 10px;
            bottom: 10px;
          }

          .command-row::after {
            left: 34px;
            right: 34px;
          }

          .command-icon {
            width: 30px;
            height: 30px;
          }

          .command-copy {
            gap: 3px;
          }

          .command-name {
            font-size: 11.8px;
          }

          .command-category {
            font-size: 9.4px;
          }

          .command-state {
            width: 100%;
            padding-left: 2px;
            font-size: 9px;
            letter-spacing: 0.45px;
          }

          .command-row.icon-climate .command-copy {
            padding-left: 0;
          }
        }
      </style>

      <div class="sala-card${roomActiveClass}${statusStackClass}${this._homeThemeClass()}">
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

        <!-- ANTERIOR (rollback): icones SVG inline e categorias genericas.
        <div class="action-strip">
          \${this._actionButton('corridor', 'ledstrip', 'Corredor', model.corridorStateLabel, model.corridorOn, 'blue', { category: 'Iluminação' })}
          \${this._actionButton('tv', 'tv', 'TV', model.tvStateLabel, model.tvOn, 'purple', { animate: animateTv, category: 'Entretenimento' })}
          \${this._actionButton('climate', 'climate', 'A/C', model.climateStateLabel, model.climateOn, 'cyan', { category: 'Climatização' })}
        </div>
        -->
        <div class="action-strip">
          ${this._actionButton('corridor', 'light_flush', 'Corredor', model.corridorStateLabel, model.corridorOn, 'blue', {
            semanticStatus: model.corridorSemanticStatus,
            ariaState: model.corridorOn ? 'luz ligada' : 'luz desligada',
            hybridTransition: hybridTransitions.corridor,
            now,
          })}
          ${this._actionButton('tv', 'tv', 'TV', model.tvStateLabel, model.tvOn, 'purple', {
            semanticStatus: model.tvSemanticStatus,
            ariaState: model.tvOn ? 'ligada' : 'desligada',
            hybridTransition: hybridTransitions.tv,
            now,
          })}
          ${this._actionButton('climate', 'climate', 'A/C', model.climateStateLabel, model.climateEnabled, 'cyan', {
            semanticStatus: model.acSemanticStatus,
            ariaName: 'Ar-condicionado',
            ariaState: model.climateEnabled ? 'ligado' : 'desligado',
            hybridTransition: hybridTransitions.climate,
            now,
          })}
        </div>
      </div>
    `;

    // ANTERIOR (rollback): if (this._hass) this._lastTvOn = model.tvOn;

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
        <img class="room-asset room-asset-off" src="/local/bruno-ui/assets/living-room-off.png?v=20260802-assets-resize-1" alt="" loading="eager" decoding="async">
        <img class="room-asset room-asset-on" src="/local/bruno-ui/assets/living-room-on.png?v=20260802-assets-resize-1" alt="" loading="eager" decoding="async">
      </span>
    `;
  }
  */

  // NOVO: assets tight (trim de borda transparente) — sofa ocupa ~100% do conteiner
  static _roomVisual(active) {
    return `
      <span class="room-asset-wrap">
        <span class="room-asset-fallback">${BrunoSalaCard._roomIcon(active)}</span>
        <picture>
          <!-- V3 unica em todos os breakpoints; rollback permanece no historico Git. -->
          <source media="(max-width: 800px)" srcset="/local/bruno-ui/assets/v3/sala-off.webp?v=20260821-v3-webp-2">
          <img class="room-asset room-asset-off" src="/local/bruno-ui/assets/v3/sala-off.webp?v=20260821-v3-webp-2" alt="" width="512" height="512" loading="eager" decoding="async">
        </picture>
        <picture>
          <source media="(max-width: 800px)" srcset="/local/bruno-ui/assets/v3/sala-on.webp?v=20260821-v3-webp-2">
          <img class="room-asset room-asset-on" src="/local/bruno-ui/assets/v3/sala-on.webp?v=20260821-v3-webp-2" alt="" width="512" height="512" loading="eager" decoding="async">
        </picture>
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

  static _tplIcon(name) {
    const requested = {
      living_sofa: 'living_sofa',
      ledstrip: 'ledstrip',
      tv: 'tv',
      climate: 'climate',
      motion: 'motion',
      homepod: 'homepod',
    }[name] || 'living_sofa';
    return `<span class="tpl-icon">${globalThis.BrunoIcons?.render(requested) || ''}</span>`;
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
