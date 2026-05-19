const BRUNO_SALA_SUBVIEW_TAG = 'bruno-sala-subview';

const BRUNO_SALA_DEFAULT_CONFIG = {
  title: 'Sala',
  subtitle: 'Visão geral',
  navigation_path: '/lovelace/ngocjohn-main/bento-lab',
  background: '/local/images/sala_estar.jpg',
  fallback_background: '/local/images/sala_estar.jpg',
  entities: {
    curtain: 'cover.cortina_sala',
    room_group: 'light.grupo_luzes_sala',
    active_sensor: 'sensor.living_room_active',
    temperature: 'sensor.sl_sensor_temp_humid_temperatura',
    humidity: 'sensor.sl_sensor_temp_humid_umidade',
    router: '',
    zigbee_hub: '',
    ps5: '',
    camera_main: 'camera.sl_camera_2',
    camera_secondary: 'camera.vr_camera_2',
    tv: 'media_player.android_tv_192_168_3_17',
    spotify: 'media_player.spotifyplus_bruno_helasio',
    climate: 'climate.sl_ar_condicionado',
    lights: [
      { entity: 'light.sala_switch_2', short: 'Spot TV' },
      { entity: 'light.sl_leds_direito_e_esquerdo', short: 'Fita LED' },
      { entity: 'light.sala_2_switch_2', short: 'Luz Cortina' },
      { entity: 'light.sala_2_switch_3', short: 'Luz Estante' },
      { entity: 'light.varanda_switch_1', short: 'Luz Teto' },
      { entity: 'light.varanda_switch_2', short: 'Luz Vaso' },
      { entity: '', short: 'Luz Ambiente', placeholder: true },
      { entity: '', short: 'Luz Painel', placeholder: true },
    ],
  },
};

class BrunoSalaSubview extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  constructor() {
    super();
    this._config = { ...BRUNO_SALA_DEFAULT_CONFIG };
    this._hass = null;
    this._bound = false;
  }

  setConfig(config) {
    const entities = {
      ...BRUNO_SALA_DEFAULT_CONFIG.entities,
      ...(config?.entities || {}),
    };

    if (Array.isArray(config?.entities?.lights)) {
      entities.lights = config.entities.lights;
    }

    this._config = {
      ...BRUNO_SALA_DEFAULT_CONFIG,
      ...(config || {}),
      entities,
    };

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 14;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _safeState(entityId, fallback = '—') {
    const value = this._state(entityId)?.state;
    if (value == null) return fallback;
    const normalized = String(value).toLowerCase();
    if (['unknown', 'unavailable', 'none', 'null'].includes(normalized)) return fallback;
    return value;
  }

  _numberState(entityId, fallback = null) {
    const raw = this._state(entityId)?.state;
    const num = Number.parseFloat(raw);
    return Number.isFinite(num) ? num : fallback;
  }

  _friendly(entityId, fallback = '—') {
    return this._state(entityId)?.attributes?.friendly_name || fallback;
  }

  _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  _callService(service, data = {}) {
    if (!this._hass || !service) return;
    const [domain, action] = service.split('.');
    if (!domain || !action) return;
    this._hass.callService(domain, action, data);
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

  _toggle(entityId) {
    if (!entityId) return;
    this._callService('homeassistant.toggle', { entity_id: entityId });
  }

  _turnOn(entityId) {
    if (!entityId) return;
    this._callService('light.turn_on', { entity_id: entityId });
  }

  _openCover() {
    this._callService('cover.open_cover', { entity_id: this._config.entities.curtain });
  }

  _closeCover() {
    this._callService('cover.close_cover', { entity_id: this._config.entities.curtain });
  }

  _stopCover() {
    this._callService('cover.stop_cover', { entity_id: this._config.entities.curtain });
  }

  _greeting() {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia, Bruno';
    if (hour < 18) return 'Boa tarde, Bruno';
    return 'Boa noite, Bruno';
  }

  _clock() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  _curtainPosition() {
    const value = this._state(this._config.entities.curtain)?.attributes?.current_position;
    const num = Number(value);
    if (!Number.isFinite(num)) return 65;
    return Math.max(0, Math.min(100, num));
  }

  _activeLightsCount() {
    const active = this._state(this._config.entities.active_sensor)?.attributes;
    if (active?.lights_on_count != null) return Number(active.lights_on_count);

    return (this._config.entities.lights || [])
      .map((item) => item.entity)
      .filter(Boolean)
      .filter((entityId) => this._state(entityId)?.state === 'on').length;
  }

  _temperatureLabel() {
    const value = this._numberState(this._config.entities.temperature, null);
    return value == null ? '—' : `${Math.round(value * 10) / 10}°`;
  }

  _humidityLabel() {
    const value = this._numberState(this._config.entities.humidity, null);
    return value == null ? '—' : `${Math.round(value)}%`;
  }

  _statusMetric(entityId, fallbackLabel) {
    if (!entityId) return fallbackLabel;
    const state = String(this._safeState(entityId, fallbackLabel)).toLowerCase();
    if (['on', 'home', 'connected', 'online', 'idle'].includes(state)) return 'Online';
    if (['off', 'not_home', 'disconnected', 'offline'].includes(state)) return 'Offline';
    return this._safeState(entityId, fallbackLabel);
  }

  _tvModel() {
    const entity = this._state(this._config.entities.tv);
    const attrs = entity?.attributes || {};
    return {
      source: attrs.source || attrs.app_name || 'HDMI 1',
      subtitle: attrs.media_title || attrs.app_name || 'Apple TV 4K',
      volume: attrs.volume_level != null ? Math.round(attrs.volume_level * 100) : 60,
      poster: attrs.entity_picture || '',
    };
  }

  _spotifyModel() {
    const entity = this._state(this._config.entities.spotify);
    const attrs = entity?.attributes || {};
    return {
      title: attrs.media_title || 'Spotify',
      artist: attrs.media_artist || 'Sem reprodução',
      artwork: attrs.entity_picture || '',
      state: entity?.state || 'idle',
    };
  }

  _climateModel() {
    const entity = this._state(this._config.entities.climate);
    const attrs = entity?.attributes || {};
    return {
      target: attrs.temperature ?? 23.5,
      hvacMode: entity?.state || 'cool',
      fan: attrs.fan_mode || 'Média',
      swing: attrs.swing_mode || 'Ativada',
      action: attrs.hvac_action || 'idle',
    };
  }

  _ps5Model() {
    const entityId = this._config.entities.ps5;
    if (!entityId) {
      return {
        placeholder: true,
        status: 'Entidade a confirmar',
        mode: '—',
      };
    }

    const entity = this._state(entityId);
    return {
      placeholder: false,
      status: entity?.state || 'Ativo',
      mode: entity?.attributes?.source || 'Performance',
    };
  }

  _cameraImage(entityId) {
    if (!entityId) return '';
    return `/api/camera_proxy/${entityId}`;
  }

  _icon(name) {
    const common = 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';
    switch (name) {
      case 'back':
        return `<svg ${common}><path d="M15 18l-6-6 6-6"/><path d="M21 12H9"/></svg>`;
      case 'temp':
        return `<svg ${common}><path d="M14 14.76V3.5a2 2 0 10-4 0v11.26a4 4 0 104 0z"/></svg>`;
      case 'humidity':
        return `<svg ${common}><path d="M12 2C12 2 6 8.4 6 13a6 6 0 0012 0c0-4.6-6-11-6-11z"/></svg>`;
      case 'router':
        return `<svg ${common}><path d="M5 18h14"/><rect x="4" y="10" width="16" height="6" rx="2"/><path d="M8 6a6 6 0 018 0"/><path d="M10 8a3 3 0 014 0"/></svg>`;
      case 'zigbee':
        return `<svg ${common}><path d="M12 2l6 4v6l-6 4-6-4V6l6-4z"/><path d="M12 8v8"/><path d="M9 10l6 4"/></svg>`;
      case 'light':
        return `<svg ${common}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14c-1.2-1-2-2.5-2-4a6 6 0 1112 0c0 1.5-.8 3-2 4-.7.7-1 1.3-1 2H9c0-.7-.3-1.3-1-2z"/></svg>`;
      case 'curtain':
        return `<svg ${common}><path d="M4 4h16"/><path d="M6 4v15"/><path d="M18 4v15"/><path d="M6 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2"/></svg>`;
      case 'tv':
        return `<svg ${common}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/></svg>`;
      case 'camera':
        return `<svg ${common}><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
      case 'music':
        return `<svg ${common}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
      case 'ac':
        return `<svg ${common}><path d="M4 8h16"/><path d="M4 12h16"/><path d="M4 16h10"/></svg>`;
      case 'console':
        return `<svg ${common}><path d="M7 16l-2 2"/><path d="M17 16l2 2"/><rect x="5" y="7" width="14" height="10" rx="3"/><path d="M9 11H7"/><path d="M8 10v2"/></svg>`;
      case 'power':
        return `<svg ${common}><path d="M12 2v10"/><path d="M18.4 6.6a8 8 0 11-12.8 0"/></svg>`;
      case 'play':
        return `<svg ${common}><polygon points="8 5 19 12 8 19 8 5"/></svg>`;
      case 'pause':
        return `<svg ${common}><path d="M10 5v14"/><path d="M14 5v14"/></svg>`;
      default:
        return `<svg ${common}><circle cx="12" cy="12" r="8"/></svg>`;
    }
  }

  _renderHero() {
    const position = this._curtainPosition();

    return `
      <section class="sala-hero">
        <div class="hero-bg" aria-hidden="true"></div>

        <div class="hero-content">
          <div class="hero-topbar">
            <button class="back-btn" data-action="navigate" data-path="${this._escape(this._config.navigation_path)}">
              ${this._icon('back')}
            </button>
            <div class="hero-title-wrap">
              <h1 class="hero-room">${this._escape(this._config.title)}</h1>
              <div class="hero-subtitle">${this._escape(this._config.subtitle)}</div>
            </div>
          </div>

          <div class="hero-main">
            <div class="hero-headline">
              <div class="hero-greeting">${this._escape(this._greeting())}</div>
              <div class="hero-clock">${this._escape(this._clock())}</div>
              <div class="hero-status-line">Ambiente confortável</div>
              <div class="hero-status-subline">Tudo funcionando perfeitamente.</div>
            </div>
          </div>

          <div class="curtain-dock">
            <div class="curtain-dock-head">
              <div class="curtain-head-left">
                <span class="module-icon">${this._icon('curtain')}</span>
                <div>
                  <div class="curtain-title">Cortinas</div>
                  <div class="curtain-subtitle">Controle</div>
                </div>
              </div>
              <div class="curtain-chip">Automática • ${position}%</div>
            </div>

            <div class="curtain-actions">
              <button class="curtain-btn" data-action="cover-open">Aberta</button>
              <button class="curtain-btn" data-action="cover-stop">Semiaberta</button>
              <button class="curtain-btn" data-action="cover-close">Fechada</button>
              <button class="curtain-btn is-active" data-action="cover-stop">Automática</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderStatusRail() {
    const routerValue = this._config.entities.router
      ? this._statusMetric(this._config.entities.router, 'Online')
      : 'Placeholder';

    const zigbeeValue = this._config.entities.zigbee_hub
      ? this._statusMetric(this._config.entities.zigbee_hub, 'Online')
      : 'Placeholder';

    return `
      <section class="status-rail">
        <div class="status-pill">
          <span class="status-icon">${this._icon('temp')}</span>
          <div class="status-copy">
            <div class="status-value">${this._escape(this._temperatureLabel())}</div>
            <div class="status-label">Temperatura</div>
          </div>
        </div>

        <div class="status-pill">
          <span class="status-icon">${this._icon('humidity')}</span>
          <div class="status-copy">
            <div class="status-value">${this._escape(this._humidityLabel())}</div>
            <div class="status-label">Umidade</div>
          </div>
        </div>

        <div class="status-pill ${this._config.entities.router ? '' : 'is-placeholder'}">
          <span class="status-icon">${this._icon('router')}</span>
          <div class="status-copy">
            <div class="status-value">Roteador</div>
            <div class="status-label">${this._escape(routerValue)}</div>
          </div>
        </div>

        <div class="status-pill ${this._config.entities.zigbee_hub ? '' : 'is-placeholder'}">
          <span class="status-icon">${this._icon('zigbee')}</span>
          <div class="status-copy">
            <div class="status-value">Hub Zigbee</div>
            <div class="status-label">${this._escape(zigbeeValue)}</div>
          </div>
        </div>
      </section>
    `;
  }

  _renderLights() {
    const total = (this._config.entities.lights || []).length;
    const active = this._activeLightsCount();

    return `
      <section class="module-card lights-card">
        <div class="module-header">
          <div class="module-header-left">
            <span class="module-icon">${this._icon('light')}</span>
            <div>
              <div class="module-title">Luzes da Sala</div>
              <div class="module-subtitle">${total} Luzes · ${active} acesas</div>
            </div>
          </div>
          <button class="all-on-btn" data-action="lights-on">Todas ON</button>
        </div>

        <div class="lights-grid">
          ${(this._config.entities.lights || []).map((light) => {
            const entity = light.entity ? this._state(light.entity) : null;
            const isOn = entity?.state === 'on';
            const placeholder = !light.entity || light.placeholder;

            return `
              <button
                class="light-tile ${isOn ? 'is-on' : ''} ${placeholder ? 'is-placeholder' : ''}"
                ${light.entity ? `data-action="toggle-light" data-entity="${this._escape(light.entity)}"` : 'disabled'}
              >
                <div class="light-tile-top">
                  <span class="module-icon">${this._icon('light')}</span>
                  <span class="light-switch ${isOn ? 'is-on' : ''}"></span>
                </div>
                <div class="light-name">${this._escape(light.short || 'Luz')}</div>
                <div class="light-level">${placeholder ? 'Placeholder' : (isOn ? 'Ligada' : 'Desligada')}</div>
              </button>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }

  _renderCameras() {
    return `
      <section class="module-card cameras-card">
        <div class="module-header">
          <div class="module-header-left">
            <span class="module-icon">${this._icon('camera')}</span>
            <div>
              <div class="module-title">Câmeras</div>
              <div class="module-subtitle">2 câmeras</div>
            </div>
          </div>
          <div class="live-chip">2 online</div>
        </div>

        <div class="camera-stack">
          <button class="camera-tile" data-action="more-info" data-entity="${this._escape(this._config.entities.camera_main)}">
            <div class="camera-name">Sala Principal</div>
            <img src="${this._escape(this._cameraImage(this._config.entities.camera_main))}" alt="Sala Principal">
            <div class="camera-foot">Ao vivo</div>
          </button>

          <button class="camera-tile" data-action="more-info" data-entity="${this._escape(this._config.entities.camera_secondary)}">
            <div class="camera-name">Sala Lateral</div>
            <img src="${this._escape(this._cameraImage(this._config.entities.camera_secondary))}" alt="Sala Lateral">
            <div class="camera-foot">Ao vivo</div>
          </button>
        </div>
      </section>
    `;
  }

  _renderTV() {
    const tv = this._tvModel();

    return `
      <section class="module-card tv-card">
        <div class="module-header">
          <div class="module-header-left">
            <span class="module-icon">${this._icon('tv')}</span>
            <div>
              <div class="module-title">Televisão</div>
              <div class="module-subtitle">Sala</div>
            </div>
          </div>
        </div>

        <div class="tv-body">
          <div class="tv-copy">
            <div class="tv-source">${this._escape(tv.source)}</div>
            <div class="tv-meta">${this._escape(tv.subtitle)}</div>

            <div class="tv-actions">
              <button class="control-btn" data-action="toggle-tv">${this._icon('power')}</button>
              <button class="control-btn" data-action="more-info" data-entity="${this._escape(this._config.entities.tv)}">${this._icon('tv')}</button>
              <button class="control-btn">${this._icon('play')}</button>
            </div>

            <div class="tv-volume">
              <span class="tv-volume-label">${tv.volume}%</span>
              <div class="tv-volume-bar">
                <div class="tv-volume-fill" style="width:${tv.volume}%;"></div>
              </div>
            </div>
          </div>

          <div class="tv-poster ${tv.poster ? '' : 'is-placeholder'}">
            ${tv.poster ? `<img src="${this._escape(tv.poster)}" alt="Poster TV">` : '<span>Poster</span>'}
          </div>
        </div>
      </section>
    `;
  }

  _renderPS5() {
    const ps5 = this._ps5Model();

    return `
      <section class="module-card ps5-card ${ps5.placeholder ? 'is-placeholder' : ''}">
        <div class="module-header">
          <div class="module-header-left">
            <span class="module-icon">${this._icon('console')}</span>
            <div>
              <div class="module-title">PlayStation 5</div>
              <div class="module-subtitle">Sala</div>
            </div>
          </div>
          <div class="live-chip ${ps5.placeholder ? 'is-placeholder' : ''}">${ps5.placeholder ? 'Placeholder' : 'Online'}</div>
        </div>

        <div class="ps5-body">
          <div class="ps5-copy">
            <div class="ps5-status">${this._escape(ps5.status)}</div>
            <div class="ps5-actions-row">
              <button class="primary-btn" ${ps5.placeholder ? 'disabled' : ''}>Ligar Console</button>
              <div class="ps5-meta-box">
                <div class="meta-label">Status</div>
                <div class="meta-value">${ps5.placeholder ? '—' : 'Ativo'}</div>
              </div>
              <div class="ps5-meta-box">
                <div class="meta-label">Modo</div>
                <div class="meta-value">${this._escape(ps5.mode)}</div>
              </div>
            </div>
          </div>

          <div class="ps5-visual">
            <div class="ps5-console-shape"></div>
          </div>
        </div>
      </section>
    `;
  }

  _renderSpotify() {
    const spotify = this._spotifyModel();

    return `
      <section class="module-card spotify-card">
        <div class="module-header">
          <div class="module-header-left">
            <span class="module-icon">${this._icon('music')}</span>
            <div>
              <div class="module-title">Spotify</div>
              <div class="module-subtitle">Sala</div>
            </div>
          </div>
          <div class="spot-state">Tocando no Spotify</div>
        </div>

        <div class="spotify-body">
          <div class="spot-art ${spotify.artwork ? '' : 'is-placeholder'}">
            ${spotify.artwork ? `<img src="${this._escape(spotify.artwork)}" alt="Spotify">` : '<span>Cover</span>'}
          </div>

          <div class="spot-copy">
            <div class="spot-track">${this._escape(spotify.title)}</div>
            <div class="spot-artist">${this._escape(spotify.artist)}</div>

            <div class="spot-controls">
              <button class="control-btn">${this._icon('play')}</button>
              <button class="control-btn is-primary">${this._icon('pause')}</button>
              <button class="control-btn">${this._icon('play')}</button>
            </div>

            <div class="tv-volume">
              <span class="tv-volume-label">66%</span>
              <div class="tv-volume-bar is-green">
                <div class="tv-volume-fill is-green" style="width:66%;"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderClimate() {
    const climate = this._climateModel();

    return `
      <section class="module-card ac-card">
        <div class="module-header">
          <div class="module-header-left">
            <span class="module-icon">${this._icon('ac')}</span>
            <div>
              <div class="module-title">Ar Condicionado</div>
              <div class="module-subtitle">Sala</div>
            </div>
          </div>
        </div>

        <div class="ac-body">
          <div class="ac-main">
            <div class="ac-temp">${this._escape(climate.target)}°</div>
            <div class="ac-state">${this._escape(climate.action)}</div>

            <div class="ac-controls">
              <button class="primary-btn" data-action="toggle-climate">Desligar</button>
              <div class="temp-stepper">
                <button data-action="temp-down">−</button>
                <span>${this._escape(climate.target)}°</span>
                <button data-action="temp-up">+</button>
              </div>
            </div>
          </div>

          <div class="ac-meta">
            <div class="ac-meta-row"><span>Modo</span><strong>${this._escape(climate.hvacMode)}</strong></div>
            <div class="ac-meta-row"><span>Ventilação</span><strong>${this._escape(climate.fan)}</strong></div>
            <div class="ac-meta-row"><span>Oscilação</span><strong>${this._escape(climate.swing)}</strong></div>
            <button class="ghost-btn" data-action="more-info" data-entity="${this._escape(this._config.entities.climate)}">Mais opções</button>
          </div>
        </div>
      </section>
    `;
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    try {
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: block;
            min-height: 100vh;
            height: 100%;
            --surface-bg: rgba(14, 18, 28, 0.84);
            --surface-border: 1px solid rgba(255,255,255,0.09);
            --surface-shadow: 0 20px 60px rgba(0,0,0,0.34);
            --text-strong: rgba(255,255,255,0.96);
            --text-soft: rgba(255,255,255,0.62);
            --text-dim: rgba(255,255,255,0.46);
            --accent: #6a5cff;
            --success: #22c55e;
            --panel-radius: 22px;
          }

          * { box-sizing: border-box; }

          ha-card {
            height: 100vh;
            margin: 0;
            border: none;
            border-radius: 0;
            background: transparent;
            box-shadow: none;
            overflow: auto;
            --ha-card-background: transparent;
            --ha-card-border-width: 0;
            --ha-card-box-shadow: none;
          }

          .subview-shell {
            min-height: 100%;
            padding: 16px;
            display: grid;
            gap: 14px;
            grid-template-columns: minmax(0, 1.18fr) minmax(430px, 0.92fr);
            grid-template-rows: minmax(330px, 1fr) minmax(320px, auto);
            grid-template-areas:
              "hero side"
              "bottom bottom";
            background:
              radial-gradient(1200px 380px at 20% 0%, rgba(255,255,255,0.04), transparent 60%),
              linear-gradient(180deg, rgba(6,8,14,0.96) 0%, rgba(7,10,18,0.98) 100%);
          }

          .hero-wrap { grid-area: hero; min-width: 0; }
          .side-wrap { grid-area: side; min-width: 0; display: grid; gap: 14px; align-content: start; }
          .bottom-wrap {
            grid-area: bottom;
            min-width: 0;
            display: grid;
            gap: 14px;
            grid-template-columns: minmax(300px, 0.9fr) minmax(0, 1fr) minmax(0, 1fr);
          }

          .stack-col {
            display: grid;
            gap: 14px;
            grid-template-rows: 1fr 1fr;
            min-width: 0;
          }

          .sala-hero {
            position: relative;
            min-height: 330px;
            height: 100%;
            overflow: hidden;
            border-radius: 28px;
            isolation: isolate;
          }

          .hero-bg {
            position: absolute;
            inset: -18px -120px -18px -12px;
            pointer-events: none;
            z-index: 0;
            background:
              linear-gradient(90deg,
                rgba(4,10,18,0.80) 0%,
                rgba(5,10,18,0.62) 12%,
                rgba(6,12,20,0.38) 24%,
                rgba(7,13,22,0.18) 38%,
                rgba(7,13,22,0.08) 48%,
                rgba(7,13,22,0.12) 58%,
                rgba(7,13,22,0.28) 70%,
                rgba(7,13,22,0.56) 84%,
                rgba(7,13,22,0.84) 100%
              ),
              linear-gradient(180deg,
                rgba(4,8,14,0.76) 0%,
                rgba(4,8,14,0.42) 12%,
                rgba(4,8,14,0.14) 24%,
                rgba(4,8,14,0.02) 34%,
                rgba(4,8,14,0.00) 46%,
                rgba(4,8,14,0.00) 58%,
                rgba(4,8,14,0.10) 74%,
                rgba(4,8,14,0.28) 86%,
                rgba(4,8,14,0.58) 96%,
                rgba(4,8,14,0.78) 100%
              ),
              radial-gradient(720px 220px at 10% 2%, rgba(255,255,255,0.08), transparent 58%),
              radial-gradient(980px 380px at 76% 48%, rgba(255,255,255,0.03), transparent 68%),
              url('${this._escape(this._config.background)}') left center / auto 100% no-repeat,
              url('${this._escape(this._config.fallback_background)}') left center / auto 100% no-repeat;
            filter: saturate(1.02) brightness(0.92);
          }

          .hero-content {
            position: relative;
            z-index: 2;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            height: 100%;
            padding: 14px 18px 18px 18px;
          }

          .hero-topbar { display: flex; align-items: flex-start; gap: 12px; }
          .back-btn {
            width: 34px; height: 34px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.12);
            background: rgba(0,0,0,0.22); color: var(--text-strong); display: inline-flex; align-items: center;
            justify-content: center; cursor: pointer; flex: 0 0 auto;
          }
          .back-btn svg { width: 18px; height: 18px; }
          .hero-room { margin: 0; font-size: 18px; line-height: 1.1; font-weight: 700; color: var(--text-strong); }
          .hero-subtitle { color: var(--text-soft); font-size: 14px; }
          .hero-main { display: flex; align-items: center; min-height: 0; }
          .hero-headline { max-width: 360px; }
          .hero-greeting { font-size: 26px; line-height: 1.1; font-weight: 720; color: var(--text-strong); }
          .hero-clock { margin-top: 10px; font-size: clamp(64px, 6vw, 88px); line-height: 0.94; font-weight: 220; color: rgba(255,255,255,0.95); }
          .hero-status-line { margin-top: 18px; font-size: 15px; font-weight: 650; color: var(--text-strong); }
          .hero-status-subline { margin-top: 6px; font-size: 14px; color: var(--text-soft); }

          .curtain-dock, .module-card, .status-rail {
            border-radius: var(--panel-radius);
            border: var(--surface-border);
            background: linear-gradient(180deg, rgba(20,24,34,0.76), rgba(14,18,28,0.90));
            box-shadow: var(--surface-shadow);
            backdrop-filter: blur(14px) saturate(1.12);
            -webkit-backdrop-filter: blur(14px) saturate(1.12);
          }

          .curtain-dock { width: min(420px, 100%); padding: 14px; }
          .curtain-dock-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-bottom: 12px; }
          .curtain-head-left, .module-header-left { display: flex; align-items: center; gap: 10px; min-width: 0; }
          .curtain-title, .module-title { font-size: 14px; font-weight: 700; color: var(--text-strong); }
          .curtain-subtitle, .module-subtitle { font-size: 12px; color: var(--text-soft); }
          .curtain-chip, .live-chip, .spot-state {
            border-radius: 999px; padding: 6px 10px; font-size: 12px; font-weight: 700; color: #ffd27d;
            background: rgba(255,176,32,0.10); border: 1px solid rgba(255,176,32,0.18); white-space: nowrap;
          }
          .live-chip { color: #86efac; background: rgba(34,197,94,0.10); border-color: rgba(34,197,94,0.18); }
          .curtain-actions { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }

          .curtain-btn, .control-btn, .all-on-btn, .primary-btn, .ghost-btn, .temp-stepper button {
            appearance: none; -webkit-appearance: none; border: 1px solid rgba(255,255,255,0.10);
            background: rgba(255,255,255,0.04); color: var(--text-strong); cursor: pointer; font: inherit;
          }

          .curtain-btn {
            min-height: 58px; border-radius: 16px; font-size: 13px; color: var(--text-soft);
          }

          .curtain-btn.is-active, .primary-btn, .control-btn.is-primary {
            background: linear-gradient(180deg, rgba(108,92,255,0.82), rgba(78,62,235,0.82));
            border-color: rgba(130,120,255,0.38); color: white;
          }

          .status-rail { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); padding: 10px 12px; }
          .status-pill {
            display: flex; align-items: center; gap: 10px; padding: 6px 10px; min-width: 0;
            border-right: 1px solid rgba(255,255,255,0.06);
          }
          .status-pill:last-child { border-right: none; }
          .status-value { font-size: 13px; font-weight: 700; color: var(--text-strong); }
          .status-label { font-size: 12px; color: var(--text-soft); }

          .module-card { padding: 14px; min-height: 0; display: flex; flex-direction: column; }
          .module-header { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
          .all-on-btn, .ghost-btn, .primary-btn { border-radius: 14px; padding: 10px 14px; font-size: 13px; font-weight: 700; }
          .ghost-btn { background: rgba(255,255,255,0.05); color: var(--text-soft); }

          .lights-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
          .light-tile {
            min-height: 104px; border-radius: 18px; border: 1px solid rgba(255,176,32,0.12);
            background: rgba(255,255,255,0.03); color: var(--text-strong); text-align: left; padding: 12px;
          }
          .light-tile.is-on { border-color: rgba(255,176,32,0.24); background: rgba(255,176,32,0.05); }
          .light-tile.is-placeholder { opacity: 0.74; }
          .light-tile-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; }
          .light-switch {
            width: 38px; height: 22px; border-radius: 999px; background: rgba(255,255,255,0.08);
            border: 1px solid rgba(255,255,255,0.12); position: relative; display: inline-block;
          }
          .light-switch::after {
            content: ""; position: absolute; top: 2px; left: 2px; width: 16px; height: 16px; border-radius: 999px;
            background: rgba(255,255,255,0.75);
          }
          .light-switch.is-on { background: rgba(255,176,32,0.88); }
          .light-switch.is-on::after { transform: translateX(16px); background: white; }
          .light-name { font-size: 14px; font-weight: 700; color: var(--text-strong); line-height: 1.1; }
          .light-level { margin-top: 6px; font-size: 13px; color: #ffca6e; }

          .camera-stack { display: grid; gap: 12px; grid-template-rows: 1fr 1fr; min-height: 0; flex: 1; }
          .camera-tile {
            position: relative; overflow: hidden; min-height: 0; border-radius: 16px;
            border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03); padding: 0;
          }
          .camera-tile img { width: 100%; height: 100%; object-fit: cover; display: block; opacity: 0.78; }
          .camera-name, .camera-foot { position: absolute; left: 12px; z-index: 2; color: white; font-size: 13px; font-weight: 700; }
          .camera-name { top: 12px; }
          .camera-foot { bottom: 12px; color: #86efac; font-size: 12px; }

          .tv-body, .spotify-body, .ps5-body, .ac-body { display: grid; gap: 14px; min-height: 0; flex: 1; }
          .tv-body { grid-template-columns: 1fr 154px; }
          .spotify-body { grid-template-columns: 120px 1fr; }
          .ps5-body { grid-template-columns: 1fr 110px; }
          .ac-body { grid-template-columns: 1fr 190px; }

          .tv-source, .spot-track, .ps5-status { font-size: 22px; line-height: 1.05; font-weight: 700; color: var(--text-strong); }
          .tv-meta, .spot-artist { margin-top: 6px; font-size: 14px; color: var(--text-soft); }
          .tv-actions, .spot-controls, .ac-controls, .ps5-actions-row { display: flex; align-items: center; gap: 10px; margin-top: 18px; flex-wrap: wrap; }
          .control-btn { width: 48px; height: 48px; border-radius: 14px; display: inline-flex; align-items: center; justify-content: center; }
          .control-btn svg { width: 18px; height: 18px; }
          .tv-volume { display: flex; align-items: center; gap: 12px; margin-top: 16px; }
          .tv-volume-label { font-size: 14px; font-weight: 700; color: var(--text-strong); min-width: 42px; }
          .tv-volume-bar { flex: 1; height: 6px; border-radius: 999px; background: rgba(255,255,255,0.08); overflow: hidden; }
          .tv-volume-fill { height: 100%; background: linear-gradient(90deg, #735dff, #8b7bff); }
          .tv-volume-fill.is-green { background: linear-gradient(90deg, #21c45a, #4ade80); }
          .tv-poster, .spot-art {
            border-radius: 18px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
            overflow: hidden; display: flex; align-items: center; justify-content: center; min-height: 0;
          }
          .tv-poster img, .spot-art img { width: 100%; height: 100%; object-fit: cover; display: block; }
          .tv-poster.is-placeholder, .spot-art.is-placeholder { color: var(--text-dim); font-size: 13px; font-weight: 700; }

          .ps5-meta-box {
            min-width: 84px; padding: 10px 12px; border-radius: 14px; border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.03);
          }
          .meta-label { font-size: 11px; color: var(--text-dim); }
          .meta-value { margin-top: 4px; font-size: 14px; font-weight: 700; color: var(--text-strong); }

          .ps5-visual { display: flex; align-items: center; justify-content: center; }
          .ps5-console-shape {
            width: 42px; height: 120px; border-radius: 18px 18px 14px 14px;
            background: linear-gradient(180deg, rgba(255,255,255,0.94), rgba(220,228,240,0.94));
            position: relative;
          }
          .ps5-console-shape::after {
            content: ""; position: absolute; top: 8px; bottom: 8px; left: 18px; width: 6px; border-radius: 999px;
            background: rgba(8,10,16,0.8);
          }

          .ac-temp { font-size: 58px; line-height: 0.9; font-weight: 240; color: var(--text-strong); }
          .ac-state { margin-top: 8px; color: #60a5fa; font-size: 16px; font-weight: 700; }
          .temp-stepper {
            display: inline-flex; align-items: center; gap: 18px; padding: 0 12px; min-height: 46px;
            border-radius: 14px; border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
          }
          .temp-stepper button { width: 30px; height: 30px; border: none; background: transparent; color: var(--text-strong); font-size: 24px; }
          .ac-meta { display: flex; flex-direction: column; justify-content: space-between; gap: 12px; }
          .ac-meta-row {
            display: flex; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 10px;
            border-bottom: 1px solid rgba(255,255,255,0.06); font-size: 14px; color: var(--text-soft);
          }
          .ac-meta-row strong { color: var(--text-strong); font-weight: 700; }

          @media (max-width: 1320px) {
            .subview-shell {
              grid-template-columns: 1fr;
              grid-template-rows: auto auto auto;
              grid-template-areas: "hero" "side" "bottom";
            }
            .bottom-wrap { grid-template-columns: 1fr; }
            .stack-col { grid-template-rows: auto auto; }
          }

          @media (max-width: 900px) {
            .status-rail { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
            .status-pill { border-right: none; border-radius: 16px; background: rgba(255,255,255,0.02); }
            .lights-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .curtain-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
            .tv-body, .spotify-body, .ps5-body, .ac-body { grid-template-columns: 1fr; }
            .sala-hero { min-height: 420px; }
          }
        </style>

        <ha-card>
          <section class="subview-shell">
            <div class="hero-wrap">${this._renderHero()}</div>

            <div class="side-wrap">
              ${this._renderStatusRail()}
              ${this._renderLights()}
            </div>

            <div class="bottom-wrap">
              ${this._renderCameras()}
              <div class="stack-col">
                ${this._renderTV()}
                ${this._renderPS5()}
              </div>
              <div class="stack-col">
                ${this._renderSpotify()}
                ${this._renderClimate()}
              </div>
            </div>
          </section>
        </ha-card>
      `;
    } catch (error) {
      this.shadowRoot.innerHTML = `
        <ha-card style="padding:16px;background:#220909;color:#fff;border-radius:16px;">
          <strong>Erro na subview da Sala</strong>
          <div style="margin-top:8px;font-size:12px;opacity:.85;">${this._escape(error?.message || 'Erro desconhecido')}</div>
        </ha-card>
      `;
      // eslint-disable-next-line no-console
      console.error('bruno-sala-subview render error', error);
    }

    this._bindEvents();
  }

  _bindEvents() {
    if (!this.shadowRoot || this._bound) return;

    this.shadowRoot.addEventListener('click', (event) => {
      const target = event.target.closest('[data-action]');
      if (!target) return;

      const action = target.dataset.action;
      const entity = target.dataset.entity;
      const path = target.dataset.path;

      switch (action) {
        case 'navigate':
          this._navigate(path);
          break;
        case 'lights-on':
          this._turnOn(this._config.entities.room_group);
          break;
        case 'toggle-light':
          this._toggle(entity);
          break;
        case 'cover-open':
          this._openCover();
          break;
        case 'cover-stop':
          this._stopCover();
          break;
        case 'cover-close':
          this._closeCover();
          break;
        case 'more-info':
          this._moreInfo(entity);
          break;
        case 'toggle-tv':
          this._toggle(this._config.entities.tv);
          break;
        case 'toggle-climate':
          this._toggle(this._config.entities.climate);
          break;
        case 'temp-up':
          this._callService('climate.set_temperature', {
            entity_id: this._config.entities.climate,
            temperature: (this._climateModel().target || 23) + 1,
          });
          break;
        case 'temp-down':
          this._callService('climate.set_temperature', {
            entity_id: this._config.entities.climate,
            temperature: (this._climateModel().target || 23) - 1,
          });
          break;
        default:
          break;
      }
    });

    this._bound = true;
  }
}

if (!customElements.get(BRUNO_SALA_SUBVIEW_TAG)) {
  customElements.define(BRUNO_SALA_SUBVIEW_TAG, BrunoSalaSubview);
}

window.customCards = window.customCards || [];
if (!window.customCards.find((item) => item.type === BRUNO_SALA_SUBVIEW_TAG)) {
  window.customCards.push({
    type: BRUNO_SALA_SUBVIEW_TAG,
    name: 'Bruno Sala Subview',
    preview: true,
    description: 'Premium Sala subview with atmospheric hero and structured functional layout.',
  });
}