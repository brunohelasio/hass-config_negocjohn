const BRUNO_SIDEBAR_PANELS_VERSION = '20260622-sidebar-panels-1';
const BRUNO_PANEL_INVALID_STATES = ['unknown', 'unavailable', 'none', 'null', ''];

class BrunoSidebarPanelBase extends HTMLElement {
  constructor() {
    super();
    this._config = {};
    this._hass = null;
  }

  setConfig(config) {
    this._config = { ...(this.defaultConfig || {}), ...(config || {}) };
    this._safeRender();
  }

  set hass(hass) {
    this._hass = hass;
    this._safeRender();
  }

  connectedCallback() {
    globalThis.BrunoLiquidGlass?.apply?.();
  }

  getCardSize() {
    return 6;
  }

  _safeRender() {
    try {
      this._render();
    } catch (error) {
      this._renderError(error);
    }
  }

  _renderError(error) {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${BrunoSidebarPanelBase.styles()}</style>
      <section class="panel-shell">
        <div class="glass-card empty-card">
          <strong>Erro no painel</strong>
          <span>${BrunoSidebarPanelBase.escape(error?.message || error)}</span>
        </div>
      </section>
    `;
  }

  _state(entityId) {
    if (Array.isArray(entityId)) {
      const states = entityId.map((id) => this._state(id)).filter(Boolean);
      return states.find((entity) => !this._isInvalid(entity?.state)) || states[0];
    }
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isInvalid(value) {
    return value == null || BRUNO_PANEL_INVALID_STATES.includes(String(value).toLowerCase());
  }

  _display(entityId, fallback = '--') {
    const entity = this._state(entityId);
    if (!entity || this._isInvalid(entity.state)) return fallback;
    const unit = entity.attributes?.unit_of_measurement || '';
    return `${entity.state}${unit ? ` ${unit}` : ''}`;
  }

  _numeric(entityId, fallback = null) {
    const raw = this._state(entityId)?.state;
    const value = Number.parseFloat(String(raw).replace(',', '.'));
    return Number.isFinite(value) ? value : fallback;
  }

  _callService(serviceName, data = {}, target = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;
    const payload = { ...data };
    if (target?.entity_id && payload.entity_id == null) payload.entity_id = target.entity_id;
    this._hass.callService(domain, service, payload, target);
  }

  _openUrl(url) {
    if (!url) return;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  _openMoreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _fireBrowserModPopup(title, content) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: { title, content },
        },
      },
      bubbles: true,
      composed: true,
    }));
  }

  _panelHeader(title, subtitle, icon) {
    return `
      <header class="panel-header">
        <span class="header-icon"><ha-icon icon="${BrunoSidebarPanelBase.escapeAttr(icon)}"></ha-icon></span>
        <span>
          <strong>${BrunoSidebarPanelBase.escape(title)}</strong>
          <small>${BrunoSidebarPanelBase.escape(subtitle)}</small>
        </span>
      </header>
    `;
  }

  _metric(label, value, icon = 'mdi:chart-box-outline', options = {}) {
    const percent = options.percent != null ? Number(options.percent) : null;
    const style = Number.isFinite(percent)
      ? ` style="--bar-value:${Math.max(0, Math.min(100, percent))}%"`
      : '';
    return `
      <button class="metric${options.clickable ? ' is-clickable' : ''}" type="button" ${options.entity ? `data-more-info="${BrunoSidebarPanelBase.escapeAttr(options.entity)}"` : ''}>
        <ha-icon icon="${BrunoSidebarPanelBase.escapeAttr(icon)}"></ha-icon>
        <span>
          <small>${BrunoSidebarPanelBase.escape(label)}</small>
          <strong>${BrunoSidebarPanelBase.escape(value)}</strong>
        </span>
        ${Number.isFinite(percent) ? `<i${style}></i>` : ''}
      </button>
    `;
  }

  _wireMoreInfo() {
    this.shadowRoot.querySelectorAll('[data-more-info]').forEach((button) => {
      button.addEventListener('click', () => this._openMoreInfo(button.dataset.moreInfo));
    });
  }

  static styles() {
    return `
      :host {
        --accent: 150, 190, 255;
        display: block;
        color: rgba(246,250,255,0.94);
        font-family: var(--primary-font-family, system-ui, sans-serif);
      }

      * {
        box-sizing: border-box;
        letter-spacing: 0;
      }

      button {
        font: inherit;
        color: inherit;
        cursor: pointer;
        touch-action: manipulation;
      }

      .panel-shell {
        width: min(940px, 92vw);
        max-height: min(740px, 82vh);
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        gap: 12px;
        padding: 4px;
        overflow: hidden;
      }

      .panel-header {
        min-height: 44px;
        display: flex;
        align-items: center;
        gap: 11px;
        min-width: 0;
      }

      .panel-header .header-icon {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 14px;
        color: rgba(191,219,254,0.92);
        background: rgba(255,255,255,0.075);
        border: 1px solid rgba(255,255,255,0.12);
      }

      .panel-header span:last-child {
        min-width: 0;
        display: grid;
        gap: 3px;
      }

      .panel-header strong {
        font-size: 18px;
        line-height: 1;
        font-weight: 820;
      }

      .panel-header small {
        font-size: 12px;
        color: rgba(226,232,240,0.62);
        font-weight: 680;
      }

      .panel-body {
        min-height: 0;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
        overflow: auto;
        padding-right: 2px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.22) transparent;
      }

      .panel-body.single {
        grid-template-columns: minmax(0, 1fr);
      }

      .glass-card {
        position: relative;
        isolation: isolate;
        min-width: 0;
        min-height: 0;
        display: grid;
        align-content: start;
        gap: 10px;
        padding: 14px;
        border-radius: var(--bruno-liquid-card-radius, 24px);
        color: rgba(246,250,255,0.94);
        background: var(--bruno-liquid-surface-off-background, rgba(15,20,30,0.58));
        border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.16));
        box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 44px rgba(0,0,0,0.30));
        backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.62));
        -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.62));
        overflow: hidden;
      }

      .glass-card::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        pointer-events: none;
        border-radius: inherit;
        background: var(--bruno-liquid-surface-off-sheen, linear-gradient(180deg, rgba(255,255,255,0.14), transparent 40%));
        opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.72);
      }

      .glass-card > * {
        position: relative;
        z-index: 1;
      }

      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 10px;
        min-width: 0;
      }

      .section-title strong {
        font-size: 14px;
        line-height: 1;
        font-weight: 820;
      }

      .section-title small {
        color: rgba(226,232,240,0.56);
        font-size: 11px;
        font-weight: 720;
      }

      .metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }

      .metric {
        appearance: none;
        -webkit-appearance: none;
        min-height: 72px;
        min-width: 0;
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        padding: 10px;
        text-align: left;
        border-radius: var(--bruno-liquid-cell-radius, 18px);
        border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.13));
        background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.06));
        box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
        outline: none;
        position: relative;
        overflow: hidden;
      }

      .metric ha-icon {
        --mdc-icon-size: 22px;
        color: rgba(191,219,254,0.88);
      }

      .metric span {
        min-width: 0;
        display: grid;
        gap: 5px;
      }

      .metric small {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 10px;
        line-height: 1;
        color: rgba(226,232,240,0.56);
        font-weight: 760;
        text-transform: uppercase;
      }

      .metric strong {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 18px;
        line-height: 1;
      }

      .metric i {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 3px;
        background: linear-gradient(90deg, rgba(var(--accent),0.74) var(--bar-value), rgba(255,255,255,0.08) var(--bar-value));
      }

      .actions-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .action-button {
        appearance: none;
        -webkit-appearance: none;
        min-height: 48px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 0 12px;
        border-radius: var(--bruno-liquid-control-radius, 18px);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.18));
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.06));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.16));
        color: rgba(255,255,255,0.86);
        outline: none;
      }

      .action-button.primary {
        background: var(--bruno-liquid-control-blue-background, rgba(59,130,246,0.52));
        border-color: var(--bruno-liquid-control-blue-border, rgba(175,214,255,0.48));
        box-shadow: var(--bruno-liquid-control-blue-shadow, 0 0 22px rgba(96,165,250,0.30));
      }

      .list {
        display: grid;
        gap: 8px;
      }

      .row {
        min-width: 0;
        min-height: 58px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 10px 12px;
        border-radius: 18px;
        background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.06));
        border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.13));
      }

      .row-copy {
        min-width: 0;
        display: grid;
        gap: 5px;
      }

      .row-copy strong,
      .row-copy small {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .row-copy strong {
        font-size: 13px;
      }

      .row-copy small {
        font-size: 11px;
        color: rgba(226,232,240,0.58);
        font-weight: 680;
      }

      .row-actions {
        display: inline-flex;
        gap: 6px;
      }

      .mini-button {
        appearance: none;
        -webkit-appearance: none;
        min-width: 40px;
        height: 36px;
        display: inline-grid;
        place-items: center;
        border-radius: 13px;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.18));
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.06));
        color: rgba(255,255,255,0.86);
      }

      .empty-card {
        min-height: 180px;
        place-items: center;
        text-align: center;
        color: rgba(226,232,240,0.70);
      }

      @media (max-width: 760px) {
        .panel-shell {
          width: min(94vw, 560px);
          max-height: 84vh;
        }

        .panel-body {
          grid-template-columns: 1fr;
        }

        .metric-grid,
        .actions-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
  }

  static escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static escapeAttr(value) {
    return BrunoSidebarPanelBase.escape(value).replace(/'/g, '&#39;');
  }
}

class BrunoSystemPanelCard extends BrunoSidebarPanelBase {
  get defaultConfig() {
    return {
      title: 'System Information',
      subtitle: 'Home Assistant e host',
      metrics: {
        cpu: ['sensor.ha_system_cpu_usage', 'sensor.system_monitor_processor_use'],
        temperature: ['sensor.ha_system_cpu_thermal_0_temperature', 'sensor.system_monitor_processor_temperature'],
        memory: ['sensor.ha_system_memory_usage', 'sensor.system_monitor_memory_usage'],
        disk: ['sensor.ha_system_data_disk_usage', 'sensor.system_monitor_disk_usage'],
      },
      rpi: {
        status: 'binary_sensor.192_168_0_146',
        cpu: 'sensor.rpi_monitor_docker_rpi_cpu_use_pidocker',
        temperature: 'sensor.rpi_monitor_docker_rpi_temp_pidocker',
        memory: 'sensor.rpi_monitor_docker_rpi_used_pidocker',
        disk: 'sensor.rpi_monitor_docker',
      },
    };
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const metrics = this._config.metrics || {};
    const rpi = this._config.rpi || {};
    this.shadowRoot.innerHTML = `
      <style>${BrunoSidebarPanelBase.styles()}</style>
      <section class="panel-shell">
        ${this._panelHeader(this._config.title, this._config.subtitle, 'mdi:chip')}
        <div class="panel-body">
          <article class="glass-card">
            <div class="section-title"><strong>Home Assistant</strong><small>${this._display('sensor.current_version', 'versao indisponivel')}</small></div>
            <div class="metric-grid">
              ${this._metric('CPU', this._display(metrics.cpu), 'mdi:cpu-64-bit', { percent: this._numeric(metrics.cpu), entity: this._entityId(metrics.cpu), clickable: true })}
              ${this._metric('Temp.', this._display(metrics.temperature), 'mdi:thermometer', { percent: this._numeric(metrics.temperature), entity: this._entityId(metrics.temperature), clickable: true })}
              ${this._metric('Memoria', this._display(metrics.memory), 'mdi:memory', { percent: this._numeric(metrics.memory), entity: this._entityId(metrics.memory), clickable: true })}
              ${this._metric('Disco', this._display(metrics.disk), 'mdi:harddisk', { percent: this._numeric(metrics.disk), entity: this._entityId(metrics.disk), clickable: true })}
            </div>
            <div class="actions-grid">
              <button class="action-button primary" type="button" data-service="homeassistant.restart"><ha-icon icon="mdi:restart"></ha-icon><span>Restart</span></button>
              <button class="action-button" type="button" data-service="homeassistant.reload_all"><ha-icon icon="mdi:reload"></ha-icon><span>Reload</span></button>
              <button class="action-button" type="button" data-service="browser_mod.refresh"><ha-icon icon="mdi:broom"></ha-icon><span>Frontend</span></button>
            </div>
          </article>

          <article class="glass-card">
            <div class="section-title"><strong>Host / Docker</strong><small>${this._display(rpi.status, 'configuravel')}</small></div>
            <div class="metric-grid">
              ${this._metric('CPU', this._display(rpi.cpu), 'mdi:cpu-64-bit', { percent: this._numeric(rpi.cpu), entity: rpi.cpu, clickable: true })}
              ${this._metric('Temp.', this._display(rpi.temperature), 'mdi:thermometer', { percent: this._numeric(rpi.temperature), entity: rpi.temperature, clickable: true })}
              ${this._metric('Memoria', this._display(rpi.memory), 'mdi:memory', { percent: this._numeric(rpi.memory), entity: rpi.memory, clickable: true })}
              ${this._metric('Disco', this._rpiDiskValue(rpi.disk), 'mdi:harddisk', { percent: this._rpiDiskPercent(rpi.disk), entity: rpi.disk, clickable: true })}
            </div>
            <div class="list">
              <div class="row">
                <span class="row-copy"><strong>Perfil portatil</strong><small>Troque entidades do host ao migrar para mini PC ou Raspberry Pi.</small></span>
                <ha-icon icon="mdi:server"></ha-icon>
              </div>
            </div>
          </article>
        </div>
      </section>
    `;
    this._wireMoreInfo();
    this.shadowRoot.querySelectorAll('[data-service]').forEach((button) => {
      button.addEventListener('click', () => this._callService(button.dataset.service));
    });
  }

  _entityId(value) {
    if (!Array.isArray(value)) return value;
    const entity = this._state(value);
    return entity?.entity_id || value[0];
  }

  _rpiDiskPercent(entityId) {
    const entity = this._state(entityId);
    const value = entity?.attributes?.fs_free_prcnt;
    const percent = Number.parseFloat(value);
    return Number.isFinite(percent) ? percent : null;
  }

  _rpiDiskValue(entityId) {
    const percent = this._rpiDiskPercent(entityId);
    if (Number.isFinite(percent)) return `${Math.round(percent)}%`;
    return this._display(entityId, '--');
  }
}

class BrunoNetworkPanelCard extends BrunoSidebarPanelBase {
  get defaultConfig() {
    return {
      title: 'Network',
      subtitle: 'WAN, UniFi e acessos rapidos',
      router_url: '',
      unifi_url: '',
      zigbee_url: '/api/hassio_ingress/Ew2YSafnnerR2_NXuuOG-3KWDZvnNgFBSfdzoUmcR_Y/#/map',
      entities: {
        wan: 'binary_sensor.arris_tg3442de_wan_status',
        clients: 'sensor.unifi_controller_clients',
        all_clients: 'sensor.unifi_controller_all_clients',
        alert: 'binary_sensor.unifi_controller_alert',
        download: 'sensor.speedtest_download',
        upload: 'sensor.speedtest_upload',
      },
    };
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const entities = this._config.entities || {};
    this.shadowRoot.innerHTML = `
      <style>${BrunoSidebarPanelBase.styles()}</style>
      <section class="panel-shell">
        ${this._panelHeader(this._config.title, this._config.subtitle, 'mdi:wifi')}
        <div class="panel-body">
          <article class="glass-card">
            <div class="section-title"><strong>Router</strong><small>${this._display(entities.wan, 'sem dados')}</small></div>
            <div class="metric-grid">
              ${this._metric('WAN', this._display(entities.wan), 'mdi:wan', { entity: entities.wan, clickable: true })}
              ${this._metric('Clientes', this._clientsLabel(entities), 'mdi:devices', { entity: entities.clients, clickable: true })}
              ${this._metric('Download', this._display(entities.download), 'mdi:download-network-outline', { entity: entities.download, clickable: true })}
              ${this._metric('Upload', this._display(entities.upload), 'mdi:upload-network-outline', { entity: entities.upload, clickable: true })}
            </div>
            <div class="actions-grid">
              <button class="action-button" type="button" data-url="${BrunoSidebarPanelBase.escapeAttr(this._config.router_url)}"><ha-icon icon="mdi:router-wireless"></ha-icon><span>Vodafone</span></button>
              <button class="action-button primary" type="button" data-url="${BrunoSidebarPanelBase.escapeAttr(this._config.unifi_url)}"><ha-icon icon="si:ubiquiti"></ha-icon><span>UniFi</span></button>
              <button class="action-button" type="button" data-zigbee><ha-icon icon="si:zigbee"></ha-icon><span>ZigBee</span></button>
            </div>
          </article>
          <article class="glass-card">
            <div class="section-title"><strong>Alertas</strong><small>${this._display(entities.alert, 'sem alertas')}</small></div>
            <div class="list">
              <div class="row">
                <span class="row-copy">
                  <strong>Controller UniFi</strong>
                  <small>${BrunoSidebarPanelBase.escape(this._display(entities.alert, 'entidade nao configurada'))}</small>
                </span>
                <div class="row-actions">
                  <button class="mini-button" type="button" data-more-info="${BrunoSidebarPanelBase.escapeAttr(entities.alert)}"><ha-icon icon="mdi:information-outline"></ha-icon></button>
                  <button class="mini-button" type="button" data-archive><ha-icon icon="mdi:archive-minus"></ha-icon></button>
                </div>
              </div>
              <div class="row">
                <span class="row-copy">
                  <strong>Access Points</strong>
                  <small>Resumo preparado para sensores UniFi/Speedtest sem cards antigos.</small>
                </span>
                <ha-icon icon="mdi:access-point-network"></ha-icon>
              </div>
            </div>
          </article>
        </div>
      </section>
    `;
    this._wireMoreInfo();
    this.shadowRoot.querySelectorAll('[data-url]').forEach((button) => {
      button.addEventListener('click', () => this._openUrl(button.dataset.url));
    });
    this.shadowRoot.querySelector('[data-zigbee]')?.addEventListener('click', () => {
      this._fireBrowserModPopup('ZigBee map', { type: 'iframe', url: this._config.zigbee_url });
    });
    this.shadowRoot.querySelector('[data-archive]')?.addEventListener('click', () => {
      this._callService('input_button.press', { entity_id: 'input_button.unifi_archive_alerts' });
    });
  }

  _clientsLabel(entities) {
    const clients = this._display(entities.clients, '');
    const all = this._display(entities.all_clients, '');
    if (clients && all) return `${clients}/${all}`;
    return clients || all || '--';
  }
}

class BrunoUpdatesPanelCard extends BrunoSidebarPanelBase {
  get defaultConfig() {
    return {
      title: 'Updates',
      subtitle: 'Atualizacoes disponiveis',
      entities: {
        current: 'sensor.current_version',
        latest: 'sensor.home_assistant_versions',
        release_notes: 'sensor.hass_release_notes',
        hacs_installed: 'sensor.hacs_installed',
      },
    };
  }

  _updates() {
    const states = Object.values(this._hass?.states || {});
    return states
      .filter((entity) => entity.entity_id?.startsWith('update.'))
      .filter((entity) => entity.state === 'on')
      .sort((a, b) => this._friendly(a).localeCompare(this._friendly(b)));
  }

  _friendly(entity) {
    return entity?.attributes?.friendly_name || entity?.entity_id || 'Update';
  }

  _versionLine(entity) {
    const installed = entity?.attributes?.installed_version;
    const latest = entity?.attributes?.latest_version;
    if (installed && latest) return `${installed} -> ${latest}`;
    return entity?.state || '';
  }

  _render() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const entities = this._config.entities || {};
    const updates = this._updates();
    this.shadowRoot.innerHTML = `
      <style>${BrunoSidebarPanelBase.styles()}</style>
      <section class="panel-shell">
        ${this._panelHeader(this._config.title, `${updates.length} pendente(s)`, 'mdi:update')}
        <div class="panel-body single">
          <article class="glass-card">
            <div class="section-title">
              <strong>Home Assistant</strong>
              <small>${this._display(entities.current, 'versao indisponivel')}</small>
            </div>
            <div class="metric-grid">
              ${this._metric('Instalado', this._display(entities.current), 'mdi:home-assistant', { entity: entities.current, clickable: true })}
              ${this._metric('Latest', this._display(entities.latest), 'mdi:tag-outline', { entity: entities.latest, clickable: true })}
            </div>
            <div class="actions-grid">
              <button class="action-button" type="button" data-release><ha-icon icon="mdi:github"></ha-icon><span>Release</span></button>
              <button class="action-button primary" type="button" data-more-info="${BrunoSidebarPanelBase.escapeAttr(entities.hacs_installed)}"><ha-icon icon="mdi:package-variant"></ha-icon><span>HACS</span></button>
              <button class="action-button" type="button" data-refresh><ha-icon icon="mdi:refresh"></ha-icon><span>Atualizar</span></button>
            </div>
          </article>

          <article class="glass-card">
            <div class="section-title"><strong>Integracoes</strong><small>${updates.length ? 'prontas para instalar' : 'nenhuma pendencia'}</small></div>
            <div class="list">
              ${updates.length ? updates.map((entity) => this._updateRow(entity)).join('') : this._emptyUpdates()}
            </div>
          </article>
        </div>
      </section>
    `;
    this._wireMoreInfo();
    this.shadowRoot.querySelector('[data-release]')?.addEventListener('click', () => {
      const url = this._state(entities.release_notes)?.attributes?.html_url;
      this._openUrl(url);
    });
    this.shadowRoot.querySelector('[data-refresh]')?.addEventListener('click', () => {
      this._callService('homeassistant.update_entity', { entity_id: Object.values(entities).filter(Boolean) });
    });
    this.shadowRoot.querySelectorAll('[data-install-update]').forEach((button) => {
      button.addEventListener('click', () => this._callService('update.install', {}, { entity_id: button.dataset.installUpdate }));
    });
    this.shadowRoot.querySelectorAll('[data-skip-update]').forEach((button) => {
      button.addEventListener('click', () => this._callService('update.skip', {}, { entity_id: button.dataset.skipUpdate }));
    });
  }

  _updateRow(entity) {
    return `
      <div class="row">
        <span class="row-copy">
          <strong>${BrunoSidebarPanelBase.escape(this._friendly(entity))}</strong>
          <small>${BrunoSidebarPanelBase.escape(this._versionLine(entity))}</small>
        </span>
        <div class="row-actions">
          <button class="mini-button" type="button" data-install-update="${BrunoSidebarPanelBase.escapeAttr(entity.entity_id)}" aria-label="Instalar"><ha-icon icon="mdi:download"></ha-icon></button>
          <button class="mini-button" type="button" data-skip-update="${BrunoSidebarPanelBase.escapeAttr(entity.entity_id)}" aria-label="Ignorar"><ha-icon icon="mdi:skip-next"></ha-icon></button>
        </div>
      </div>
    `;
  }

  _emptyUpdates() {
    return `
      <div class="row">
        <span class="row-copy">
          <strong>Nenhuma atualizacao pendente</strong>
          <small>Os erros de template antigo deixam de aparecer neste painel JS.</small>
        </span>
        <ha-icon icon="mdi:check-circle-outline"></ha-icon>
      </div>
    `;
  }
}

[
  ['bruno-system-panel-card', BrunoSystemPanelCard, 'Bruno System Panel'],
  ['bruno-network-panel-card', BrunoNetworkPanelCard, 'Bruno Network Panel'],
  ['bruno-updates-panel-card', BrunoUpdatesPanelCard, 'Bruno Updates Panel'],
].forEach(([tag, klass, name]) => {
  if (!customElements.get(tag)) customElements.define(tag, klass);
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: tag,
    name,
    preview: false,
    description: `Sidebar panel bundle ${BRUNO_SIDEBAR_PANELS_VERSION}`,
  });
});
