const BRUNO_SYSTEM_PANEL_VERSION = '20260802-josh-popup-material-1';

const BrunoSystemPanel = {
  render({ hass } = {}) {
    const model = this._model(hass);
    return `
      <style>${this._styles()}</style>
      <div class="config-scrim" data-system-action="close"></div>
      <section class="config-panel system-panel" role="dialog" aria-modal="true" aria-label="Sistema">
        <header class="config-header">
          <span class="config-icon system-icon" aria-hidden="true"><bruno-icon icon="mdi:chip"></bruno-icon></span>
          <div class="config-title">
            <strong>Sistema</strong>
            <span>Estado e manutencao</span>
          </div>
          <button class="config-close" type="button" data-system-action="close" aria-label="Fechar">&times;</button>
        </header>

        <div class="system-scroll">
          <div class="config-section">
            <div class="config-section-title">
              <span>Home Assistant</span>
              <small>${this._escape(model.haStatus)}</small>
            </div>
            <div class="panel-lines">
              ${this._metricLine('mdi:home-assistant', 'Atual', model.currentVersion)}
              ${this._metricLine('mdi:update', 'Proxima versao', model.nextRelease)}
              ${this._metricLine('mdi:database', 'Banco de dados', model.database)}
            </div>
            <div class="panel-bars">
              ${this._bar('CPU', model.haCpu, '%')}
              ${this._bar('Temperatura', model.haTemp, 'C')}
              ${this._bar('Memoria', model.haMemory, '%')}
              ${this._bar('Disco', model.haDisk, '%')}
            </div>
            <div class="panel-actions">
              <button type="button" data-system-action="reload-yaml">Recarregar YAML</button>
              <button type="button" data-system-action="restart-ha">Reiniciar HA</button>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Servidor</span>
              <small>${this._escape(model.serverStatus)}</small>
            </div>
            <div class="panel-lines">
              ${this._metricLine('mdi:raspberry-pi', 'Raspberry Docker', model.dockerState)}
              ${this._metricLine('mdi:clock-outline', 'Uptime', model.dockerUptime)}
            </div>
            <div class="panel-bars">
              ${this._bar('CPU', model.rpiCpu, '%')}
              ${this._bar('Temperatura', model.rpiTemp, 'C')}
              ${this._bar('Memoria', model.rpiMemory, '%')}
              ${this._bar('Disco livre', model.rpiDiskFree, '%')}
            </div>
            <div class="panel-actions">
              <button type="button" data-system-action="restart-pi">Reiniciar PI</button>
              <button type="button" data-system-action="purge-dockerlog">Limpar logs</button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  handleAction({ target, hass, host } = {}) {
    const action = target?.dataset?.systemAction;
    if (!action) return false;
    if (action === 'close') return false;
    if (action === 'reload-yaml') {
      hass?.callService?.('homeassistant', 'reload_all', {});
      return true;
    }
    if (action === 'restart-ha') {
      hass?.callService?.('homeassistant', 'restart', {});
      return true;
    }
    if (action === 'restart-pi') {
      hass?.callService?.('script', 'restart_pi_docker', {});
      return true;
    }
    if (action === 'purge-dockerlog') {
      hass?.callService?.('script', 'purge_dockerlog', {});
      return true;
    }
    if (action === 'more-info') {
      const entityId = target.dataset.entity;
      if (entityId) host?.dispatchEvent?.(new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }));
      return true;
    }
    return false;
  },

  _model(hass) {
    const states = hass?.states || {};
    const dockerOnline = this._state(states, 'binary_sensor.192_168_0_146', 'off') === 'on';
    return {
      haStatus: this._state(states, 'sensor.current_version') || 'Disponivel',
      currentVersion: this._state(states, 'sensor.current_version'),
      nextRelease: this._state(states, 'sensor.template_hass_next_release'),
      database: this._state(states, 'sensor.ha_db'),
      haCpu: this._num(states, 'sensor.ha_system_cpu_usage'),
      haTemp: this._num(states, 'sensor.ha_system_cpu_thermal_0_temperature'),
      haMemory: this._num(states, 'sensor.ha_system_memory_usage'),
      haDisk: this._num(states, 'sensor.ha_system_data_disk_usage'),
      serverStatus: dockerOnline ? 'Online' : 'Offline',
      dockerState: dockerOnline ? 'Online' : 'Offline',
      dockerUptime: this._attr(states, 'sensor.rpi_monitor_docker', 'up_time') || this._state(states, 'sensor.rpi_monitor_docker'),
      rpiCpu: this._num(states, 'sensor.rpi_monitor_docker_rpi_cpu_use_pidocker'),
      rpiTemp: this._num(states, 'sensor.rpi_monitor_docker_rpi_temp_pidocker'),
      rpiMemory: this._num(states, 'sensor.rpi_monitor_docker_rpi_used_pidocker'),
      rpiDiskFree: this._num(states, 'sensor.rpi_monitor_docker', 'fs_free_prcnt'),
    };
  },

  _metricLine(icon, label, value) {
    return `
      <div class="panel-line">
        <bruno-icon icon="${this._escapeAttr(icon)}"></bruno-icon>
        <span>${this._escape(label)}</span>
        <strong>${this._escape(value || '--')}</strong>
      </div>
    `;
  },

  _bar(label, value, suffix) {
    const number = Number(value);
    const hasValue = Number.isFinite(number);
    const clamped = hasValue ? Math.max(0, Math.min(100, number)) : 0;
    const text = hasValue ? `${number.toFixed(number >= 10 ? 0 : 1)}${suffix || ''}` : '--';
    return `
      <div class="panel-bar">
        <div><span>${this._escape(label)}</span><strong>${this._escape(text)}</strong></div>
        <i style="--value:${clamped}%"><b></b></i>
      </div>
    `;
  },

  _state(states, entityId, fallback = '--') {
    const value = states?.[entityId]?.state;
    return value && !['unknown', 'unavailable', 'none'].includes(String(value).toLowerCase()) ? value : fallback;
  },

  _num(states, entityId, attr) {
    const raw = attr ? states?.[entityId]?.attributes?.[attr] : states?.[entityId]?.state;
    const value = Number(raw);
    return Number.isFinite(value) ? value : null;
  },

  _attr(states, entityId, attr) {
    const value = states?.[entityId]?.attributes?.[attr];
    return value == null || ['unknown', 'unavailable', 'none'].includes(String(value).toLowerCase()) ? '--' : value;
  },

  _escape(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  _escapeAttr(value) {
    return this._escape(value).replace(/`/g, '&#96;');
  },

  _styles() {
    return `
      .system-panel { width: min(520px, calc(100vw - 124px)); max-height: min(74vh, 690px); display: flex; flex-direction: column; }
      .system-icon bruno-icon { --mdc-icon-size: 17px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.92); }
      .system-scroll { min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) transparent; }
      .system-scroll::-webkit-scrollbar { width: 6px; }
      .system-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 999px; }
      .panel-lines { display: grid; gap: 0; border-top: 1px solid rgba(255,255,255,0.08); }
      .panel-line { min-height: 38px; display: grid; grid-template-columns: 22px minmax(0,1fr) auto; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.78); }
      .panel-line bruno-icon { --mdc-icon-size: 15px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.75); }
      .panel-line span { min-width: 0; font-size: 11px; font-weight: 720; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .panel-line strong { font-size: 11px; font-weight: 760; color: rgba(255,255,255,0.90); }
      .panel-bars { display: grid; gap: 10px; margin-top: 12px; }
      .panel-bar { display: grid; gap: 6px; }
      .panel-bar div { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 10px; color: rgba(255,255,255,0.62); font-weight: 720; }
      .panel-bar strong { color: rgba(255,255,255,0.86); }
      .panel-bar i { display: block; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.10); overflow: hidden; }
      .panel-bar b { display: block; width: var(--value,0%); height: 100%; border-radius: inherit; background: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.76); box-shadow: 0 0 12px rgba(var(--bruno-liquid-warm-accent,255,214,10),0.24); }
      .panel-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      .panel-actions button { min-height: 30px; padding: 0 12px; border-radius: var(--bruno-popup-action-radius, 999px); border: var(--bruno-popup-inner-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent,255,214,10),0.28)); background: var(--bruno-popup-inner-warm-background, rgba(255,255,255,0.045)); box-shadow: var(--bruno-popup-inner-warm-shadow, none); -webkit-backdrop-filter: var(--bruno-popup-inner-filter, none); backdrop-filter: var(--bruno-popup-inner-filter, none); color: rgba(255,255,255,0.86); font: inherit; font-size: 10px; font-weight: 800; cursor: pointer; }
      .panel-actions button:hover { background: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.14); }
    `;
  },
};

globalThis.BrunoSystemPanel = BrunoSystemPanel;
