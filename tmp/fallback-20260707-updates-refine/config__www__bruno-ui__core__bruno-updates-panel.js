const BRUNO_UPDATES_PANEL_VERSION = '20260707-updates-panel-1';
const BRUNO_UPDATES_EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const BrunoUpdatesPanel = {
  render({ hass } = {}) {
    const model = this._model(hass);
    return `
      <style>${this._styles()}</style>
      <div class="config-scrim" data-updates-action="close"></div>
      <section class="config-panel updates-panel" role="dialog" aria-modal="true" aria-label="Updates">
        <header class="config-header">
          <span class="config-icon updates-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="M7 10l5 5 5-5"/><path d="M12 15V3"/></svg>
          </span>
          <div class="config-title">
            <strong>Updates</strong>
            <span>Atualizacoes do sistema</span>
          </div>
          <button class="config-close" type="button" data-updates-action="close" aria-label="Fechar">&times;</button>
        </header>

        <div class="updates-scroll">
          <div class="config-section">
            <div class="config-section-title">
              <span>Home Assistant</span>
              <small>${this._escape(model.home.status)}</small>
            </div>
            ${this._homeCard(model.home)}
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Integracoes</span>
              <small>${this._escape(model.integrationStatus)}</small>
            </div>
            ${this._updatesList(model.updates)}
          </div>
        </div>

        <footer class="config-footer updates-footer">
          <button class="config-refresh" type="button" data-updates-action="open-updates-page">Central de updates</button>
        </footer>
      </section>
    `;
  },

  handleAction({ target, hass, host } = {}) {
    const action = target?.dataset?.updatesAction;
    if (!action) return false;
    const entityId = target.dataset.entity;

    if (action === 'more-info' && entityId) {
      host?.dispatchEvent?.(new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }));
      return true;
    }

    if (action === 'install' && entityId) {
      hass?.callService?.('update', 'install', { entity_id: entityId });
      this._scheduleRender(host);
      return true;
    }

    if (action === 'skip' && entityId) {
      hass?.callService?.('update', 'skip', { entity_id: entityId });
      this._scheduleRender(host);
      return true;
    }

    if (action === 'release-notes') {
      const url = target.dataset.url;
      if (url) globalThis.open?.(url, '_blank', 'noopener,noreferrer');
      return true;
    }

    if (action === 'open-updates-page') {
      const panelPath = hass?.panels?.config?.url_path || 'config';
      globalThis.location.href = `/${panelPath}/updates`;
      return true;
    }

    return false;
  },

  _scheduleRender(host) {
    globalThis.setTimeout?.(() => host?._renderUpdatesPanel?.(), 900);
  },

  _model(hass) {
    const states = hass?.states || {};
    const installed = this._state(states, 'sensor.current_version') || '--';
    const latestStable = this._state(states, 'sensor.home_assistant_versions') || '--';
    const latestBeta = this._state(states, 'sensor.docker_hub_beta') || latestStable;
    const beta = String(installed).toLowerCase().includes('b');
    const latest = beta ? latestBeta : latestStable;
    const releaseEntity = beta ? 'sensor.hass_release_notes_beta' : 'sensor.hass_release_notes';
    const release = states[releaseEntity];
    const homeUpdates = Number(this._attr(states, 'sensor.hassio_updates_available', 'home_assistant')) || 0;
    const updates = this._updateEntities(states);
    const count = updates.length;

    return {
      home: {
        installed,
        latest,
        available: homeUpdates > 0,
        status: homeUpdates > 0 ? `${installed} -> ${latest}` : `Atualizado - ${installed}`,
        releaseTitle: release?.state || 'Release notes',
        releaseUrl: release?.attributes?.html_url || '',
      },
      updates,
      integrationStatus: count === 0 ? 'Nenhuma pendente' : `${count} ${count === 1 ? 'pendente' : 'pendentes'}`,
    };
  },

  _homeCard(home) {
    const tone = home.available ? 'is-active' : '';
    const notes = home.releaseUrl
      ? `<button class="updates-mini" type="button" data-updates-action="release-notes" data-url="${this._escapeAttr(home.releaseUrl)}">Release notes</button>`
      : '';
    return `
      <article class="updates-home ${tone}">
        <div class="updates-home-main">
          <span class="updates-home-mark" aria-hidden="true">HA</span>
          <div>
            <strong>${this._escape(home.available ? 'Atualizacao disponivel' : 'Sistema atualizado')}</strong>
            <small>${this._escape(home.status)}</small>
          </div>
        </div>
        <div class="updates-home-actions">
          ${notes}
          <button class="updates-mini" type="button" data-updates-action="open-updates-page">Abrir central</button>
        </div>
      </article>
    `;
  },

  _updatesList(items) {
    if (!items.length) {
      return `
        <div class="updates-empty">
          <span class="updates-empty-dot" aria-hidden="true"></span>
          <div>
            <strong>Nada pendente</strong>
            <small>Integracoes e componentes estao sem atualizacoes.</small>
          </div>
        </div>
      `;
    }

    return `
      <div class="updates-list">
        ${items.map((item) => `
          <article class="updates-item">
            <button class="updates-info" type="button" data-updates-action="more-info" data-entity="${this._escapeAttr(item.entityId)}">
              <span class="updates-thumb" aria-hidden="true">
                <img src="${this._escapeAttr(item.picture)}" alt="">
              </span>
              <span class="updates-copy">
                <strong>${this._escape(item.name)}</strong>
                <small>${this._escape(item.versionLine)}</small>
              </span>
            </button>
            <div class="updates-actions">
              <button class="updates-mini" type="button" data-updates-action="install" data-entity="${this._escapeAttr(item.entityId)}">Instalar</button>
              <button class="updates-mini is-muted" type="button" data-updates-action="skip" data-entity="${this._escapeAttr(item.entityId)}">Ignorar</button>
            </div>
          </article>
        `).join('')}
      </div>
    `;
  },

  _updateEntities(states) {
    return Object.entries(states || {})
      .filter(([entityId, state]) => entityId.startsWith('update.') && state?.state === 'on')
      .map(([entityId, state]) => {
        const attributes = state.attributes || {};
        const name = this._cleanName(attributes.friendly_name || entityId);
        const installed = attributes.installed_version || attributes.installed || '--';
        const latest = attributes.latest_version || attributes.latest || '--';
        return {
          entityId,
          name,
          picture: attributes.entity_picture || BRUNO_UPDATES_EMPTY_IMAGE,
          versionLine: `${installed} -> ${latest}`,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  _state(states, entityId) {
    const state = states?.[entityId]?.state;
    return state && !['unknown', 'unavailable'].includes(String(state).toLowerCase()) ? state : '';
  },

  _attr(states, entityId, attr) {
    return states?.[entityId]?.attributes?.[attr];
  },

  _cleanName(value) {
    return String(value || '')
      .replace(/_/g, ' ')
      .replace(/\s+update$/i, '')
      .replace(/^update\./i, '')
      .trim();
  },

  _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  },

  _escapeAttr(value) {
    return this._escape(value).replace(/`/g, '&#96;');
  },

  _styles() {
    return `
      .updates-panel {
        width: min(520px, calc(100vw - 124px));
        max-height: min(74vh, 690px);
        display: flex;
        flex-direction: column;
      }

      .updates-icon svg {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .updates-scroll {
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.24) transparent;
      }

      .updates-scroll::-webkit-scrollbar {
        width: 6px;
      }

      .updates-scroll::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.22);
        border-radius: 999px;
      }

      .updates-home,
      .updates-item,
      .updates-empty {
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
      }

      .updates-home {
        display: grid;
        gap: 12px;
        padding: 12px;
      }

      .updates-home.is-active {
        background: var(--bruno-liquid-selected-blue-background, rgba(96,165,250,0.26));
        border-color: var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.24));
      }

      .updates-home-main,
      .updates-empty,
      .updates-info {
        display: grid;
        grid-template-columns: 38px minmax(0, 1fr);
        align-items: center;
        gap: 11px;
      }

      .updates-home-mark,
      .updates-thumb,
      .updates-empty-dot {
        width: 38px;
        height: 38px;
        display: grid;
        place-items: center;
        border-radius: 12px;
        background: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.09);
        border: 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.16);
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.92);
        font-size: 11px;
        font-weight: 900;
      }

      .updates-thumb {
        overflow: hidden;
        background: rgba(255,255,255,0.055);
      }

      .updates-thumb img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        display: block;
      }

      .updates-home strong,
      .updates-copy strong,
      .updates-empty strong {
        display: block;
        min-width: 0;
        font-size: 12px;
        line-height: 1.12;
        font-weight: 850;
        color: rgba(255,255,255,0.90);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .updates-home small,
      .updates-copy small,
      .updates-empty small {
        display: block;
        margin-top: 3px;
        min-width: 0;
        font-size: 10px;
        line-height: 1.15;
        font-weight: 650;
        color: rgba(255,255,255,0.56);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .updates-list {
        display: grid;
        gap: 8px;
      }

      .updates-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 8px;
      }

      .updates-info {
        min-width: 0;
        border: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      .updates-actions,
      .updates-home-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 7px;
      }

      .updates-mini {
        min-height: 30px;
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.18));
        border-radius: var(--bruno-liquid-control-radius-compact, 12px);
        background: var(--bruno-liquid-control-warm-background, rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.038));
        color: rgba(255,255,255,0.82);
        padding: 0 10px;
        font-size: 10px;
        font-weight: 850;
        cursor: pointer;
      }

      .updates-mini.is-muted {
        border-color: rgba(255,255,255,0.075);
        background: rgba(255,255,255,0.030);
        color: rgba(255,255,255,0.58);
      }

      .updates-empty {
        padding: 12px;
      }

      .updates-empty-dot::before {
        content: "";
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: rgba(112,255,166,0.92);
        box-shadow: 0 0 14px rgba(112,255,166,0.35);
      }

      .updates-footer {
        flex: 0 0 auto;
      }
    `;
  },
};

globalThis.BrunoUpdatesPanel = BrunoUpdatesPanel;