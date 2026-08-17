const BRUNO_NETWORK_PANEL_VERSION = '20260802-josh-popup-material-1';

const BrunoNetworkPanel = {
  render({ hass } = {}) {
    const model = this._model(hass);
    return `
      <style>${this._styles()}</style>
      <div class="config-scrim" data-network-action="close"></div>
      <section class="config-panel network-panel" role="dialog" aria-modal="true" aria-label="Rede">
        <header class="config-header">
          <span class="config-icon network-icon" aria-hidden="true"><bruno-icon icon="mdi:wifi"></bruno-icon></span>
          <div class="config-title">
            <strong>Rede</strong>
            <span>Conectividade e pontos de acesso</span>
          </div>
          <button class="config-close" type="button" data-network-action="close" aria-label="Fechar">&times;</button>
        </header>

        <div class="network-scroll">
          <div class="config-section">
            <div class="config-section-title">
              <span>Access Points</span>
              <small>${this._escape(model.apStatus)}</small>
            </div>
            <div class="network-list">
              ${model.aps.map((ap) => this._apLine(ap)).join('')}
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Router</span>
              <small>${this._escape(model.routerState)}</small>
            </div>
            <div class="network-list">
              ${this._metricLine('mdi:wan', 'WAN', model.routerState)}
              ${this._metricLine('mdi:account-group', 'Clientes ativos', model.clients)}
              ${this._metricLine('mdi:account-multiple-outline', 'Clientes totais', model.allClients)}
              ${this._metricLine('mdi:alert-circle-outline', 'Alertas Unifi', model.alertState)}
            </div>
            <div class="panel-actions">
              <button type="button" data-network-action="archive-alerts">Arquivar alertas</button>
              <button type="button" data-network-action="zigbee-map">Mapa Zigbee</button>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Speedtest</span>
              <small>${this._escape(model.speedStatus)}</small>
            </div>
            <div class="network-speed">
              ${this._speedItem('Download', model.download, 'Mbps')}
              ${this._speedItem('Upload', model.upload, 'Mbps')}
            </div>
            <div class="panel-actions">
              <button type="button" data-network-action="refresh-speedtest">Atualizar</button>
            </div>
          </div>
        </div>
      </section>
    `;
  },

  handleAction({ target, hass } = {}) {
    const action = target?.dataset?.networkAction;
    if (!action) return false;
    if (action === 'close') return false;
    if (action === 'archive-alerts') {
      hass?.callService?.('input_button', 'press', { entity_id: 'input_button.unifi_archive_alerts' });
      return true;
    }
    if (action === 'refresh-speedtest') {
      hass?.callService?.('homeassistant', 'update_entity', { entity_id: ['sensor.speedtest_download', 'sensor.speedtest_upload'] });
      return true;
    }
    if (action === 'zigbee-map') {
      globalThis.location.href = '/api/hassio_ingress/Ew2YSafnnerR2_NXuuOG-3KWDZvnNgFBSfdzoUmcR_Y/#/map';
      return true;
    }
    return false;
  },

  _model(hass) {
    const states = hass?.states || {};
    const aps = [
      { entity: 'sensor.unifi_office_ap', name: 'Office' },
      { entity: 'sensor.unifi_wall_ap', name: 'Living Room' },
      { entity: 'sensor.unifi_bedroom_ap', name: 'Bedroom' },
    ].map((ap) => ({
      ...ap,
      state: this._state(states, ap.entity),
      score: this._attr(states, ap.entity, 'score') || this._attr(states, ap.entity, 'Score') || '--',
    }));
    const online = aps.filter((ap) => !['--', 'off', 'unavailable'].includes(String(ap.state).toLowerCase())).length;
    return {
      aps,
      apStatus: `${online}/${aps.length} online`,
      routerState: this._state(states, 'binary_sensor.arris_tg3442de_wan_status'),
      clients: this._state(states, 'sensor.unifi_controller_clients'),
      allClients: this._state(states, 'sensor.unifi_controller_all_clients'),
      alertState: this._state(states, 'binary_sensor.unifi_controller_alert'),
      download: this._state(states, 'sensor.speedtest_download'),
      upload: this._state(states, 'sensor.speedtest_upload'),
      speedStatus: `${this._state(states, 'sensor.speedtest_download')} / ${this._state(states, 'sensor.speedtest_upload')}`,
    };
  },

  _apLine(ap) {
    return `
      <div class="network-line">
        <bruno-icon icon="mdi:access-point"></bruno-icon>
        <span><strong>${this._escape(ap.name)}</strong><small>${this._escape(ap.entity)}</small></span>
        <em>${this._escape(ap.score)}</em>
      </div>
    `;
  },

  _metricLine(icon, label, value) {
    return `
      <div class="network-line">
        <bruno-icon icon="${this._escapeAttr(icon)}"></bruno-icon>
        <span><strong>${this._escape(label)}</strong></span>
        <em>${this._escape(value || '--')}</em>
      </div>
    `;
  },

  _speedItem(label, value, unit) {
    return `
      <div class="speed-item">
        <span>${this._escape(label)}</span>
        <strong>${this._escape(value || '--')}</strong>
        <small>${this._escape(unit)}</small>
      </div>
    `;
  },

  _state(states, entityId, fallback = '--') {
    const value = states?.[entityId]?.state;
    return value && !['unknown', 'unavailable', 'none'].includes(String(value).toLowerCase()) ? value : fallback;
  },

  _attr(states, entityId, attr) {
    const value = states?.[entityId]?.attributes?.[attr];
    return value == null || ['unknown', 'unavailable', 'none'].includes(String(value).toLowerCase()) ? '' : value;
  },

  _escape(value) {
    return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },

  _escapeAttr(value) {
    return this._escape(value).replace(/`/g, '&#96;');
  },

  _styles() {
    return `
      .network-panel { width: min(500px, calc(100vw - 124px)); max-height: min(74vh, 690px); display: flex; flex-direction: column; }
      .network-icon bruno-icon { --mdc-icon-size: 17px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.92); }
      .network-scroll { min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) transparent; }
      .network-scroll::-webkit-scrollbar { width: 6px; }
      .network-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 999px; }
      .network-list { display: grid; gap: 0; border-top: 1px solid rgba(255,255,255,0.08); }
      .network-line { min-height: 42px; display: grid; grid-template-columns: 24px minmax(0,1fr) auto; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.80); }
      .network-line bruno-icon { --mdc-icon-size: 16px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.75); }
      .network-line span { min-width: 0; display: grid; gap: 3px; }
      .network-line strong { min-width: 0; font-size: 11px; font-weight: 780; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .network-line small { min-width: 0; font-size: 9px; color: rgba(255,255,255,0.44); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .network-line em { font-style: normal; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.86); }
      .network-speed { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
      .speed-item { min-height: 72px; display: grid; align-content: center; gap: 4px; padding: 12px; border-radius: var(--bruno-popup-inner-radius, 14px); background: var(--bruno-popup-inner-background, rgba(255,255,255,0.045)); border: var(--bruno-popup-inner-border, 1px solid rgba(255,255,255,0.08)); box-shadow: var(--bruno-popup-inner-shadow, none); -webkit-backdrop-filter: var(--bruno-popup-inner-filter, none); backdrop-filter: var(--bruno-popup-inner-filter, none); }
      .speed-item span { font-size: 10px; color: rgba(255,255,255,0.54); font-weight: 740; }
      .speed-item strong { font-size: 19px; line-height: 1; color: rgba(255,255,255,0.92); }
      .speed-item small { font-size: 9px; color: rgba(255,255,255,0.46); }
      .panel-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      .panel-actions button { min-height: 30px; padding: 0 12px; border-radius: var(--bruno-popup-action-radius, 999px); border: var(--bruno-popup-inner-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent,255,214,10),0.28)); background: var(--bruno-popup-inner-warm-background, rgba(255,255,255,0.045)); box-shadow: var(--bruno-popup-inner-warm-shadow, none); -webkit-backdrop-filter: var(--bruno-popup-inner-filter, none); backdrop-filter: var(--bruno-popup-inner-filter, none); color: rgba(255,255,255,0.86); font: inherit; font-size: 10px; font-weight: 800; cursor: pointer; }
      .panel-actions button:hover { background: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.14); }
    `;
  },
};

globalThis.BrunoNetworkPanel = BrunoNetworkPanel;
