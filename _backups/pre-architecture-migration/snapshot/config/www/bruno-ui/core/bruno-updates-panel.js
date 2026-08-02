const BRUNO_UPDATES_PANEL_VERSION = '20260710-updates-panel-3';
const BRUNO_UPDATES_EMPTY_IMAGE = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const BrunoUpdatesPanel = {
  _installingEntities: new Set(),

  render({ hass, embedded = false } = {}) {
    const model = this._model(hass);
    const closeAction = embedded
      ? 'data-config-action="child-close"'
      : 'data-updates-action="close"';
    return `
      <style>${this._styles()}</style>
      ${embedded ? '' : '<div class="config-scrim" data-updates-action="close"></div>'}
      <section class="config-panel updates-panel${embedded ? ' config-child-panel' : ''}" role="dialog" aria-modal="true" aria-label="Updates">
        <header class="config-header">
          <span class="config-icon updates-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render('updates') || ''}
          </span>
          <div class="config-title">
            <strong>Updates</strong>
            <span>Atualizacoes do sistema</span>
          </div>
          <button class="config-close" type="button" ${closeAction} aria-label="Fechar">&times;</button>
        </header>

        <div class="updates-scroll">
          <div class="config-section">
            <div class="config-section-title">
              <span>Home Assistant</span>
              <small>${this._escape(model.homeStatus)}</small>
            </div>
            ${this._updatesList(model.systemUpdates, {
              emptyTitle: 'Sem updates do sistema',
              emptyText: 'Core, OS e Supervisor nao possuem atualizacoes pendentes.',
            })}
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Integracoes</span>
              <small>${this._escape(model.integrationStatus)}</small>
            </div>
            ${this._updatesList(model.integrationUpdates, {
              emptyTitle: 'Nada pendente',
              emptyText: 'Integracoes e componentes estao sem atualizacoes.',
            })}
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
      const state = hass?.states?.[entityId];
      if (this._installingEntities.has(entityId) || this._isInstalling(state?.attributes?.in_progress)) return true;
      this._installingEntities.add(entityId);
      Promise.resolve(hass?.callService?.('update', 'install', { entity_id: entityId }))
        .catch(() => this._installingEntities.delete(entityId));
      globalThis.setTimeout?.(() => this._installingEntities.delete(entityId), 60000);
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
    globalThis.setTimeout?.(() => host?._refreshUpdatesPanel?.({ preserveScroll: true }), 900);
  },

  _model(hass) {
    const states = hass?.states || {};
    const allUpdates = this._updateEntities(states);
    const systemUpdates = allUpdates.filter((item) => item.group === 'system');
    const integrationUpdates = allUpdates.filter((item) => item.group !== 'system');
    const systemPending = systemUpdates.length;
    const aggregateHomeUpdates = Number(this._attr(states, 'sensor.hassio_updates_available', 'home_assistant')) || 0;
    const pendingHomeCount = Math.max(systemPending, aggregateHomeUpdates);

    return {
      homeStatus: pendingHomeCount > 0
        ? `${pendingHomeCount} ${pendingHomeCount === 1 ? 'pendente' : 'pendentes'}`
        : 'Sem updates do sistema',
      systemUpdates,
      integrationUpdates,
      integrationStatus: integrationUpdates.length === 0
        ? 'Nenhuma pendente'
        : `${integrationUpdates.length} ${integrationUpdates.length === 1 ? 'pendente' : 'pendentes'}`,
    };
  },

  _updatesList(items, empty = {}) {
    if (!items.length) {
      return `
        <div class="updates-empty">
          <span class="updates-empty-dot" aria-hidden="true"></span>
          <div>
            <strong>${this._escape(empty.emptyTitle || 'Nada pendente')}</strong>
            <small>${this._escape(empty.emptyText || 'Nao ha atualizacoes pendentes.')}</small>
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
              <button class="updates-mini${item.installing ? ' is-installing' : ''}" type="button"
                data-updates-action="install" data-entity="${this._escapeAttr(item.entityId)}"
                ${item.installing ? 'disabled aria-busy="true"' : ''}>${item.installing ? 'Instalando' : 'Instalar'}</button>
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
        const rawName = attributes.friendly_name || entityId;
        const name = this._cleanName(rawName);
        const installed = attributes.installed_version || attributes.installed || '--';
        const latest = attributes.latest_version || attributes.latest || '--';
        return {
          entityId,
          name,
          group: this._updateGroup(entityId, rawName),
          picture: attributes.entity_picture || BRUNO_UPDATES_EMPTY_IMAGE,
          versionLine: `${installed} -> ${latest}`,
          installing: this._installingEntities.has(entityId) || this._isInstalling(attributes.in_progress),
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  },

  _isInstalling(value) {
    if (value === true) return true;
    const number = Number(value);
    if (Number.isFinite(number) && number > 0) return true;
    return ['true', 'installing', 'in_progress'].includes(String(value || '').toLowerCase());
  },

  _updateGroup(entityId, name) {
    const value = `${entityId} ${name}`.toLowerCase();
    return [
      'home_assistant_core',
      'home assistant core',
      'home assistant operating system',
      'home_assistant_operating_system',
      'operating system',
      'hassos',
      'supervisor',
      'home_assistant_supervisor',
    ].some((term) => value.includes(term)) ? 'system' : 'integration';
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

      .updates-thumb,
      .updates-empty-dot {
        display: grid;
        place-items: center;
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.92);
        font-weight: 900;
      }

      .updates-list {
        display: grid;
      }

      .updates-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        background: transparent;
      }

      .updates-item + .updates-item {
        border-top: 1px solid rgba(255,255,255,0.060);
      }

      .updates-info {
        min-width: 0;
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        border: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      .updates-thumb {
        width: 28px;
        height: 28px;
        overflow: hidden;
        border-radius: 0;
        background: transparent;
      }

      .updates-thumb img {
        width: 20px;
        height: 20px;
        object-fit: contain;
        display: block;
      }

      .updates-copy strong,
      .updates-empty strong {
        display: block;
        min-width: 0;
        font-size: 11px;
        line-height: 1.12;
        font-weight: 850;
        color: rgba(255,255,255,0.90);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .updates-copy small,
      .updates-empty small {
        display: block;
        margin-top: 2px;
        min-width: 0;
        font-size: 9px;
        line-height: 1.15;
        font-weight: 650;
        color: rgba(255,255,255,0.56);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .updates-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
      }

      .updates-mini {
        min-height: 25px;
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.18));
        border-radius: var(--bruno-liquid-control-radius-compact, 10px);
        background: var(--bruno-liquid-control-warm-background, rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.038));
        color: rgba(255,255,255,0.82);
        padding: 0 8px;
        font-size: 9px;
        font-weight: 850;
        cursor: pointer;
      }

      .updates-mini.is-muted {
        border-color: rgba(255,255,255,0.070);
        background: rgba(255,255,255,0.026);
        color: rgba(255,255,255,0.54);
      }

      .updates-empty {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        padding: 8px 0;
      }

      .updates-empty-dot {
        width: 28px;
        height: 28px;
        border-radius: 0;
      }

      .updates-empty-dot::before {
        content: "";
        width: 7px;
        height: 7px;
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
