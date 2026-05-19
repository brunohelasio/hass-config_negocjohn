const BRUNO_SALA_SUBVIEW_TAG = 'bruno-sala-subview';

const BRUNO_SALA_DEFAULT_CONFIG = {
  title: 'Sala',
  subtitle: 'Visão geral',
  navigation_path: '/lovelace/ngocjohn-main/bento-lab',
  background: '/local/images/sala_estar.jpg',
  fallback_background: '/local/images/sala_estar.jpg',
  entities: {
    curtain: 'cover.cortina_sala',
    active_sensor: 'sensor.living_room_active',
    temperature: 'sensor.sl_sensor_temp_humid_temperatura',
    humidity: 'sensor.sl_sensor_temp_humid_umidade',
    room_group: 'light.grupo_luzes_sala',
    camera_main: 'camera.sl_camera_2',
    camera_secondary: 'camera.vr_camera_2',
    active_camera_select: 'input_select.bento_active_camera',
    tv: 'media_player.android_tv_192_168_3_17',
    spotify: 'media_player.spotifyplus_bruno_helasio',
    climate: 'climate.sl_ar_condicionado',
    router: '',
    zigbee_hub: '',
    ps5: '',
    lights: [
      { entity: 'light.sala_switch_2', name: 'Luz Principal', short: 'Spot TV' },
      { entity: 'light.sl_leds_direito_e_esquerdo', name: 'LEDs Sala', short: 'Fita LED' },
      { entity: 'light.sala_2_switch_2', name: 'VR Principal', short: 'Luz Cortina' },
      { entity: 'light.sala_2_switch_3', name: 'VR Cristaleira', short: 'Luz Estante' },
      { entity: 'light.varanda_switch_1', name: 'VR Gourmet', short: 'Luz Teto' },
      { entity: 'light.varanda_switch_2', name: 'VR Pendente', short: 'Luz Vaso' },
      { entity: '', name: 'Placeholder 7', short: 'Luz Ambiente', placeholder: true },
      { entity: '', name: 'Placeholder 8', short: 'Luz Painel', placeholder: true },
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
    this._embedded = {};
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
    this._updateEmbeddedCards();
  }

  getCardSize() {
    return 12;
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
    const value = Number.parseFloat(this._state(entityId)?.state);
    return Number.isFinite(value) ? value : fallback;
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

  _turnOff(entityId) {
    if (!entityId) return;
    this._callService('light.turn_off', { entity_id: entityId });
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

  _clock() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  }

  _curtainPosition() {
    const value = this._state(this._config.entities.curtain)?.attributes?.current_position;
    const num = Number(value);
    if (!Number.isFinite(num)) return 0;
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
    return value == null ? '—' : `${Math.round(value)}°C`;
  }

  _humidityLabel() {
    const value = this._numberState(this._config.entities.humidity, null);
    return value == null ? '—' : `${Math.round(value)}%`;
  }

  _routerLabel() {
    if (!this._config.entities.router) return 'Placeholder';
    return this._safeState(this._config.entities.router, 'Online');
  }

  _zigbeeLabel() {
    if (!this._config.entities.zigbee_hub) return 'Placeholder';
    return this._safeState(this._config.entities.zigbee_hub, 'Online');
  }

  _tvModel() {
    const entity = this._state(this._config.entities.tv);
    const attrs = entity?.attributes || {};
    return {
      source: attrs.source || attrs.app_name || 'HDMI 1',
      subtitle: attrs.media_title || attrs.app_name || 'Apple TV 4K',
      poster: attrs.entity_picture || '',
      volume: attrs.volume_level != null ? Math.round(attrs.volume_level * 100) : 60,
    };
  }

  _climateModel() {
    const entity = this._state(this._config.entities.climate);
    const attrs = entity?.attributes || {};
    return {
      target: attrs.temperature ?? 23.5,
      hvacMode: entity?.state || 'off',
      fan: attrs.fan_mode || 'auto',
      swing: attrs.swing_mode || 'Ativada',
      action: attrs.hvac_action || entity?.state || 'off',
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
        return `<svg ${common}><path d="M12 2l6 4v6l-6 4-6-4V6l6-4z"/><path d="M12 8v8"/></svg>`;
      case 'curtain':
        return `<svg ${common}><path d="M4 4h16"/><path d="M6 4v15"/><path d="M18 4v15"/><path d="M6 8c2 0 2 2 4 2s2-2 4-2 2 2 4 2"/></svg>`;
      case 'light':
        return `<svg ${common}><path d="M9 18h6"/><path d="M10 22h4"/><path d="M8 14c-1.2-1-2-2.5-2-4a6 6 0 1112 0c0 1.5-.8 3-2 4-.7.7-1 1.3-1 2H9c0-.7-.3-1.3-1-2z"/></svg>`;
      case 'camera':
        return `<svg ${common}><path d="M23 7l-7 5 7 5V7z"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`;
      case 'tv':
        return `<svg ${common}><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8"/></svg>`;
      case 'music':
        return `<svg ${common}><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`;
      case 'ac':
        return `<svg ${common}><path d="M4 8h16"/><path d="M4 12h16"/><path d="M4 16h10"/></svg>`;
      case 'console':
        return `<svg ${common}><path d="M7 16l-2 2"/><path d="M17 16l2 2"/><rect x="5" y="7" width="14" height="10" rx="3"/></svg>`;
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
    const temp = this._temperatureLabel();
    const lights = this._activeLightsCount();

    return `
      <section class="sala-hero">
        <div class="hero-bg" aria-hidden="true"></div>

        <div class="hero-content">
          <div class="hero-top">
            <div class="hero-top-left">
              <button class="back-btn" data-action="navigate" data-path="${this._escape(this._config.navigation_path)}">
                ${this._icon('back')}
              </button>
              <div class="hero-heading">
                <div class="hero-title">Sala</div>
                <div class="hero-subtitle">Visão geral</div>
              </div>
            </div>

            <div class="hero-chips">
              <span class="hero-chip">${lights} luzes</span>
              <span class="hero-chip">${temp}</span>
            </div>
          </div>

          <div class="hero-clock-wrap">
            <div class="hero-clock">${this._escape(this._clock())}</div>
          </div>

          <div class="curtain-dock">
            <div class="curtain-head">
              <div class="curtain-head-left">
                <span class="module-icon">${this._icon('curtain')}</span>
                <div>
                  <div class="curtain-title">Cortinas</div>
                  <div class="curtain-subtitle">Controle</div>
                </div>
              </div>
              <div class="curtain-pill">Automática • ${position}%</div>
            </div>

            <div class="curtain-body">
              <div class="curtain-position">
                <span class="curtain-value">${position}%</span>
                <span class="curtain-label">abertura</span>
              </div>

              <div class="curtain-actions">
                <button class="curtain-btn" data-action="cover-open">Abrir</button>
                <button class="curtain-btn is-active" data-action="cover-stop">Parar</button>
                <button class="curtain-btn" data-action="cover-close">Fechar</button>
              </div>

              <div class="curtain-progress">
                <div class="curtain-progress-fill" style="width:${position}%;"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  _renderStatusRail() {
    return `
      <section class="status-rail module-card">
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
            <div class="status-label">${this._escape(this._routerLabel())}</div>
          </div>
        </div>

        <div class="status-pill ${this._config.entities.zigbee_hub ? '' : 'is-placeholder'}">
          <span class="status-icon">${this._icon('zigbee')}</span>
          <div class="status-copy">
            <div class="status-value">Hub Zigbee</div>
            <div class="status-label">${this._escape(this._zigbeeLabel())}</div>
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
          <div>
            <div class="module-title">Luzes da Sala</div>
            <div class="module-subtitle">${total} Luzes · ${active} acesas</div>
          </div>

          <div class="lights-actions">
            <button class="chip-btn is-on" data-action="lights-on">ON</button>
            <button class="chip-btn" data-action="lights-off">OFF</button>
          </div>
        </div>

        <div class="lights-grid">
          ${(this._config.entities.lights || []).map((light) => {
            const entity = light.entity ? this._state(light.entity) : null;
            const isOn = entity?.state === 'on';
            const placeholder = !light.entity || light.placeholder;

            return `
              <button
                class="light-card ${isOn ? 'is-on' : ''} ${placeholder ? 'is-placeholder' : ''}"
                ${light.entity ? `data-action="toggle-light" data-entity="${this._escape(light.entity)}"` : 'disabled'}
              >
                <div class="light-card-head">
                  <span class="module-icon">${this._icon('light')}</span>
                  <span class="switch-pill ${isOn ? 'is-on' : ''}"></span>
                </div>
                <div class="light-card-name">${this._escape(light.short)}</div>
                <div class="light-card-state">${placeholder ? 'Placeholder' : (isOn ? 'Ligada' : 'Desligada')}</div>
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
          <div>
            <div class="module-title">Câmeras</div>
            <div class="module-subtitle">2 câmeras</div>
          </div>
          <div class="live-chip">2 online</div>
        </div>

        <div class="camera-list">
          <button class="camera-card" data-action="more-info" data-entity="${this._escape(this._config.entities.camera_main)}">
            <div class="camera-card-title">Sala Principal</div>
            <img src="${this._escape(this._cameraImage(this._config.entities.camera_main))}" alt="Sala Principal">
            <div class="camera-card-foot">Ao vivo</div>
          </button>

          <button class="camera-card" data-action="more-info" data-entity="${this._escape(this._config.entities.camera_secondary)}">
            <div class="camera-card-title">Sala Lateral</div>
            <img src="${this._escape(this._cameraImage(this._config.entities.camera_secondary))}" alt="Sala Lateral">
            <div class="camera-card-foot">Ao vivo</div>
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
          <div>
            <div class="module-title">Televisão</div>
            <div class="module-subtitle">Sala</div>
          </div>
        </div>

        <div class="tv-body">
          <div class="tv-main">
            <div class="tv-source">${this._escape(tv.source)}</div>
            <div class="tv-sub">${this._escape(tv.subtitle)}</div>

            <div class="tv-controls">
              <button class="control-btn" data-action="toggle-tv">${this._icon('power')}</button>
              <button class="control-btn" data-action="more-info" data-entity="${this._escape(this._config.entities.tv)}">${this._icon('tv')}</button>
              <button class="control-btn">${this._icon('play')}</button>
            </div>

            <div class="volume-row">
              <span class="volume-label">${tv.volume}%</span>
              <div class="volume-bar">
                <div class="volume-fill" style="width:${tv.volume}%;"></div>
              </div>
            </div>
          </div>

          <div class="poster-card ${tv.poster ? '' : 'is-placeholder'}">
            ${tv.poster ? `<img src="${this._escape(tv.poster)}" alt="Poster TV">` : '<span>Poster</span>'}
          </div>
        </div>
      </section>
    `;
  }

  _renderPS5() {
    return `
      <section class="module-card ps5-card is-placeholder">
        <div class="module-header">
          <div>
            <div class="module-title">PlayStation 5</div>
            <div class="module-subtitle">Sala</div>
          </div>
          <div class="live-chip is-placeholder">Placeholder</div>
        </div>

        <div class="ps5-body">
          <div class="ps5-title">Entidade a confirmar</div>

          <div class="ps5-row">
            <button class="primary-btn" disabled>Ligar Console</button>

            <div class="mini-meta">
              <div class="mini-meta-label">Status</div>
              <div class="mini-meta-value">—</div>
            </div>

            <div class="mini-meta">
              <div class="mini-meta-label">Modo</div>
              <div class="mini-meta-value">—</div>
            </div>
          </div>

          <div class="ps5-art"></div>
        </div>
      </section>
    `;
  }

  _renderSpotifyShell() {
    return `
      <section class="module-card spotify-shell">
        <div id="spotify-card-mount" class="spotify-mount">
          <div class="spotify-fallback">Spotify</div>
        </div>
      </section>
    `;
  }

  _renderAC() {
    const climate = this._climateModel();

    return `
      <section class="module-card ac-card">
        <div class="module-header">
          <div>
            <div class="module-title">Ar Condicionado</div>
            <div class="module-subtitle">Sala</div>
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

  async _attachSpotifyCard() {
    const mount = this.shadowRoot?.getElementById('spotify-card-mount');
    if (!mount || mount.dataset.ready === '1') return;
    mount.dataset.ready = '1';

    try {
      if (!window.loadCardHelpers) {
        mount.innerHTML = '<div class="spotify-fallback">Spotify indisponível</div>';
        return;
      }

      const helpers = await window.loadCardHelpers();
      const card = await helpers.createCardElement({
        type: 'custom:spotifyplus-card',
        entity: this._config.entities.spotify,
        deviceDefaultId: 'Echo Show',
        deviceControlByName: true,
        sections: ['player', 'userpresets'],
      });

      card.hass = this._hass;
      this._embedded.spotify = card;
      mount.replaceChildren(card);
    } catch (error) {
      mount.innerHTML = '<div class="spotify-fallback">Erro ao carregar Spotify</div>';
      console.warn('bruno-sala-subview spotify mount failed', error);
    }
  }

  _updateEmbeddedCards() {
    if (this._embedded.spotify) {
      this._embedded.spotify.hass = this._hass;
    }
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          min-height: 100vh;
          --panel-radius: 20px;
          --panel-border: 1px solid rgba(255,255,255,0.10);
          --panel-bg:
            linear-gradient(180deg, rgba(15,20,35,0.78) 0%, rgba(20,24,33,0.88) 100%);
          --panel-shadow:
            0 0 24px rgba(62,132,255,0.18),
            0 0 60px rgba(62,132,255,0.10);
          --text-strong: rgba(255,255,255,0.96);
          --text-soft: rgba(255,255,255,0.62);
          --text-dim: rgba(255,255,255,0.42);
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
          height: 100%;
          padding: 10px 10px 10px 10px;
          display: grid;
          gap: 10px;
          grid-template-columns: 1.12fr 0.92fr;
          grid-template-rows: minmax(300px, 42vh) minmax(290px, 46vh);
          grid-template-areas:
            "hero side"
            "bottom bottom";
          background:
            radial-gradient(1000px 280px at 20% 0%, rgba(255,255,255,0.03), transparent 60%),
            linear-gradient(180deg, rgba(6,8,14,0.97) 0%, rgba(7,10,18,0.99) 100%);
          overflow: hidden;
        }

        .hero-wrap { grid-area: hero; min-width: 0; }
        .side-wrap { grid-area: side; min-width: 0; display: grid; gap: 10px; }
        .bottom-wrap {
          grid-area: bottom;
          min-width: 0;
          display: grid;
          gap: 10px;
          grid-template-columns: 1fr 1.08fr 1.08fr;
        }

        .stack-col {
          min-width: 0;
          display: grid;
          gap: 10px;
          grid-template-rows: 1fr 1fr;
        }

        .sala-hero {
          position: relative;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 24px;
          isolation: isolate;
        }

        .hero-bg {
          position: absolute;
          inset: -16px -100px -16px -10px;
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
          padding: 12px 14px 14px 14px;
        }

        .hero-top {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 12px;
        }

        .hero-top-left {
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }

        .back-btn {
          width: 34px;
          height: 34px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.16);
          background: rgba(0,0,0,0.24);
          color: white;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .back-btn svg { width: 18px; height: 18px; }

        .hero-title {
          font-size: 16px;
          line-height: 1.1;
          font-weight: 700;
          color: var(--text-strong);
        }

        .hero-subtitle {
          margin-top: 2px;
          font-size: 13px;
          color: var(--text-soft);
        }

        .hero-chips {
          display: flex;
          gap: 8px;
          align-items: center;
          flex-wrap: wrap;
        }

        .hero-chip {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
          border: 1px solid rgba(104,205,255,0.55);
          background: rgba(22,134,190,0.35);
          color: rgba(255,255,255,0.95);
        }

        .hero-clock-wrap {
          display: flex;
          align-items: center;
          flex: 1;
        }

        .hero-clock {
          font-size: clamp(54px, 5.2vw, 72px);
          line-height: 0.95;
          font-weight: 220;
          color: rgba(255,255,255,0.95);
        }

        .curtain-dock,
        .module-card {
          border-radius: var(--panel-radius);
          border: var(--panel-border);
          background: var(--panel-bg);
          box-shadow: var(--panel-shadow);
          overflow: hidden;
        }

        .curtain-dock {
          width: min(420px, 100%);
          padding: 14px 16px;
        }

        .curtain-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .curtain-head-left,
        .module-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
        }

        .module-icon svg {
          width: 18px;
          height: 18px;
          color: rgba(255,255,255,0.92);
        }

        .curtain-title,
        .module-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-strong);
        }

        .curtain-subtitle,
        .module-subtitle {
          margin-top: 2px;
          font-size: 12px;
          color: var(--text-soft);
        }

        .curtain-pill,
        .live-chip {
          padding: 8px 12px;
          border-radius: 999px;
          font-size: 12px;
          font-weight: 700;
        }

        .curtain-pill {
          color: #ffcf78;
          background: rgba(255,176,32,0.12);
          border: 1px solid rgba(255,176,32,0.18);
        }

        .live-chip {
          color: #86efac;
          background: rgba(34,197,94,0.12);
          border: 1px solid rgba(34,197,94,0.18);
        }

        .live-chip.is-placeholder {
          color: var(--text-soft);
        }

        .curtain-body {
          margin-top: 12px;
          display: grid;
          gap: 10px;
        }

        .curtain-position {
          display: flex;
          align-items: end;
          gap: 8px;
        }

        .curtain-value {
          font-size: 34px;
          line-height: 1;
          font-weight: 700;
          color: #fff;
        }

        .curtain-label {
          font-size: 16px;
          color: rgba(255,255,255,.62);
        }

        .curtain-actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .curtain-btn,
        .chip-btn,
        .control-btn,
        .primary-btn,
        .ghost-btn,
        .temp-stepper button {
          appearance: none;
          -webkit-appearance: none;
          border: 1px solid rgba(255,255,255,0.18);
          background: rgba(255,255,255,0.08);
          color: #fff;
          font: inherit;
          cursor: pointer;
        }

        .curtain-btn {
          padding: 8px 14px;
          border-radius: 13px;
          font-size: 14px;
          font-weight: 600;
        }

        .curtain-btn.is-active,
        .chip-btn.is-on,
        .primary-btn {
          background: rgba(22,134,190,0.45);
          border-color: rgba(104,205,255,0.55);
          font-weight: 700;
        }

        .curtain-progress {
          height: 8px;
          border-radius: 999px;
          background: rgba(255,255,255,0.25);
          overflow: hidden;
        }

        .curtain-progress-fill {
          height: 100%;
          background: rgba(255,255,255,0.85);
        }

        .module-card {
          padding: 12px 14px;
          min-height: 0;
          display: flex;
          flex-direction: column;
        }

        .status-rail {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: center;
          padding: 8px 10px;
        }

        .status-pill {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 10px;
          min-width: 0;
          border-right: 1px solid rgba(255,255,255,0.08);
        }

        .status-pill:last-child { border-right: none; }

        .status-pill.is-placeholder .status-label {
          color: var(--text-dim);
        }

        .status-copy { min-width: 0; }

        .status-value {
          font-size: 13px;
          font-weight: 700;
          color: var(--text-strong);
          white-space: nowrap;
        }

        .status-label {
          font-size: 12px;
          color: var(--text-soft);
          white-space: nowrap;
        }

        .lights-card {
          height: 100%;
        }

        .lights-actions {
          display: flex;
          gap: 8px;
        }

        .chip-btn {
          min-width: 60px;
          padding: 8px 0;
          border-radius: 999px;
          font-size: 13px;
          font-weight: 700;
        }

        .lights-grid {
          margin-top: 12px;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 10px;
          flex: 1;
        }

        .light-card {
          min-height: 90px;
          border-radius: 18px;
          border: 1px solid rgba(255,176,32,0.12);
          background: rgba(255,255,255,0.04);
          color: white;
          padding: 12px;
          text-align: left;
        }

        .light-card.is-on {
          border-color: rgba(255,176,32,0.28);
          background: rgba(255,176,32,0.05);
        }

        .light-card.is-placeholder {
          opacity: 0.72;
        }

        .light-card-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }

        .switch-pill {
          width: 38px;
          height: 22px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          position: relative;
        }

        .switch-pill::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          border-radius: 999px;
          background: rgba(255,255,255,0.78);
        }

        .switch-pill.is-on {
          background: rgba(255,176,32,0.88);
        }

        .switch-pill.is-on::after {
          transform: translateX(16px);
          background: white;
        }

        .light-card-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--text-strong);
        }

        .light-card-state {
          margin-top: 6px;
          font-size: 13px;
          color: #ffca6e;
        }

        .camera-list,
        .stack-col {
          min-height: 0;
        }

        .camera-list {
          margin-top: 10px;
          display: grid;
          gap: 10px;
          flex: 1;
          min-height: 0;
        }

        .camera-card {
          position: relative;
          min-height: 0;
          overflow: hidden;
          border-radius: 16px;
          border: 1px solid rgba(255,255,255,0.12);
          background: rgba(255,255,255,0.04);
          padding: 0;
        }

        .camera-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .camera-card-title,
        .camera-card-foot {
          position: absolute;
          left: 12px;
          z-index: 2;
          font-weight: 700;
          color: white;
        }

        .camera-card-title {
          top: 12px;
          font-size: 13px;
        }

        .camera-card-foot {
          bottom: 12px;
          font-size: 12px;
          color: #86efac;
        }

        .tv-body,
        .ps5-body,
        .ac-body {
          margin-top: 10px;
          display: grid;
          gap: 12px;
          min-height: 0;
          flex: 1;
        }

        .tv-body {
          grid-template-columns: 1fr 140px;
        }

        .tv-source,
        .ps5-title {
          font-size: 22px;
          line-height: 1.05;
          font-weight: 700;
          color: var(--text-strong);
        }

        .tv-sub {
          margin-top: 6px;
          font-size: 14px;
          color: var(--text-soft);
        }

        .tv-controls,
        .ps5-row,
        .ac-controls {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-top: 18px;
          flex-wrap: wrap;
        }

        .control-btn {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .control-btn svg {
          width: 18px;
          height: 18px;
        }

        .volume-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 14px;
        }

        .volume-label {
          min-width: 38px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-strong);
        }

        .volume-bar {
          flex: 1;
          height: 6px;
          border-radius: 999px;
          background: rgba(255,255,255,0.08);
          overflow: hidden;
        }

        .volume-fill {
          height: 100%;
          background: linear-gradient(90deg, #735dff, #8b7bff);
        }

        .poster-card {
          border-radius: 18px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(255,255,255,0.04);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .poster-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .poster-card.is-placeholder {
          color: var(--text-dim);
          font-weight: 700;
        }

        .spotify-shell {
          padding: 8px;
        }

        .spotify-mount {
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 12px;
        }

        .spotify-mount > * {
          width: 100%;
          height: 100%;
        }

        .spotify-fallback {
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-soft);
          font-weight: 700;
        }

        .mini-meta {
          min-width: 74px;
          padding: 10px 12px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }

        .mini-meta-label {
          font-size: 11px;
          color: var(--text-dim);
        }

        .mini-meta-value {
          margin-top: 4px;
          font-size: 14px;
          font-weight: 700;
          color: var(--text-strong);
        }

        .ps5-art {
          width: 42px;
          height: 118px;
          border-radius: 18px 18px 14px 14px;
          background: linear-gradient(180deg, rgba(255,255,255,0.96), rgba(220,228,240,0.94));
          justify-self: end;
          position: relative;
        }

        .ps5-art::after {
          content: "";
          position: absolute;
          top: 8px;
          bottom: 8px;
          left: 18px;
          width: 6px;
          border-radius: 999px;
          background: rgba(8,10,16,0.8);
        }

        .ac-body {
          grid-template-columns: 1fr 180px;
        }

        .ac-temp {
          font-size: 54px;
          line-height: 0.9;
          font-weight: 240;
          color: var(--text-strong);
        }

        .ac-state {
          margin-top: 8px;
          color: #60a5fa;
          font-size: 16px;
          font-weight: 700;
        }

        .temp-stepper {
          display: inline-flex;
          align-items: center;
          gap: 16px;
          padding: 0 12px;
          min-height: 44px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.03);
        }

        .temp-stepper button {
          width: 28px;
          height: 28px;
          border: none;
          background: transparent;
          font-size: 24px;
        }

        .ac-meta {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 10px;
        }

        .ac-meta-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255,255,255,0.06);
          font-size: 14px;
          color: var(--text-soft);
        }

        .ac-meta-row strong {
          color: var(--text-strong);
          font-weight: 700;
        }

        .ghost-btn,
        .primary-btn {
          min-height: 42px;
          padding: 10px 14px;
          border-radius: 14px;
          font-size: 13px;
          font-weight: 700;
        }

        .ghost-btn {
          background: rgba(255,255,255,0.05);
        }

        @media (max-width: 1300px) {
          .subview-shell {
            grid-template-columns: 1fr;
            grid-template-rows: auto auto auto;
            grid-template-areas:
              "hero"
              "side"
              "bottom";
            overflow: auto;
          }

          .bottom-wrap {
            grid-template-columns: 1fr;
          }

          .stack-col {
            grid-template-rows: auto auto;
          }
        }

        @media (max-width: 900px) {
          .status-rail {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .lights-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .tv-body,
          .ac-body {
            grid-template-columns: 1fr;
          }
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
              ${this._renderSpotifyShell()}
              ${this._renderAC()}
            </div>
          </div>
        </section>
      </ha-card>
    `;

    this._bindEvents();
    this._attachSpotifyCard();
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
        case 'lights-off':
          this._turnOff(this._config.entities.room_group);
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
if (!window.customCards.find((card) => card.type === BRUNO_SALA_SUBVIEW_TAG)) {
  window.customCards.push({
    type: BRUNO_SALA_SUBVIEW_TAG,
    name: 'Bruno Sala Subview',
    preview: true,
    description: 'Sala premium subview aligned with Bento atmospheric hero and original Sala entities.',
  });
}
