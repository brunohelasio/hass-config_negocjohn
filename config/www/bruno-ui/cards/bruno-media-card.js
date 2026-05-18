const BRUNO_MEDIA_CARD_TAG = 'bruno-media-card';

const BRUNO_MEDIA_DEFAULT_CONFIG = {
  focus_sensor: 'sensor.media_focus_visuals',
  focus_select: 'input_select.media_focus_player',
  scripts: {
    play_pause: 'script.media_focus_play_pause',
    volume_down: 'script.media_focus_volume_down',
    volume_up: 'script.media_focus_volume_up',
    previous: 'script.media_focus_previous_track',
    next: 'script.media_focus_next_track',
    mute: 'script.media_focus_volume_mute',
  },
  players: [
    { entity: 'media_player.android_tv_192_168_3_17', name: 'TV', icon: 'mdi:television-classic' },
    { entity: 'media_player.echo_show', name: 'Echo Show', icon: 'mdi:speaker-wireless' },
    { entity: 'media_player.spotifyplus_bruno_helasio', name: 'Spotify', icon: 'mdi:spotify' },
    { entity: 'media_player.echo_pop_office', name: 'Office', icon: 'mdi:speaker' },
  ],
};

const BRUNO_MEDIA_ACTIVE_STATES = ['playing', 'paused', 'on', 'idle'];

class BrunoMediaCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      ...BRUNO_MEDIA_DEFAULT_CONFIG,
      ...(config || {}),
      scripts: {
        ...BRUNO_MEDIA_DEFAULT_CONFIG.scripts,
        ...(config?.scripts || {}),
      },
      players: Array.isArray(config?.players) ? config.players : BRUNO_MEDIA_DEFAULT_CONFIG.players,
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

  _isActive(entityId) {
    return BRUNO_MEDIA_ACTIVE_STATES.includes(this._state(entityId)?.state || '');
  }

  _focusEntityId() {
    const selected = this._state(this._config.focus_select)?.state;
    if (selected && this._state(selected)) return selected;
    const active = this._config.players.find((player) => this._isActive(player.entity));
    return active?.entity || this._config.players[0]?.entity;
  }

  _focusModel() {
    const focusId = this._focusEntityId();
    const player = this._state(focusId);
    const visual = this._state(this._config.focus_sensor);
    const source = visual?.attributes?.entity_picture || player?.attributes?.entity_picture || '';
    const title = visual?.attributes?.media_title
      || player?.attributes?.media_title
      || player?.attributes?.friendly_name
      || this._config.players.find((item) => item.entity === focusId)?.name
      || 'Sistema de Audio';
    const artist = visual?.attributes?.media_artist || player?.attributes?.media_artist || '';
    const state = player?.state || visual?.state || 'off';
    const isPlaying = state === 'playing';
    const isActive = BRUNO_MEDIA_ACTIVE_STATES.includes(state);

    return {
      entity: focusId,
      title,
      artist: artist && artist !== 'Pronto para tocar' ? artist : '',
      state,
      isPlaying,
      isActive,
      image: source,
    };
  }

  _callService(serviceName, data = {}, target = {}) {
    if (!this._hass || !serviceName) return;
    const [domain, service] = serviceName.split('.');
    if (!domain || !service) return;
    this._hass.callService(domain, service, data, target);
  }

  _runScript(key) {
    const script = this._config.scripts?.[key];
    this._callService(script);
  }

  _selectPlayer(entityId) {
    if (!entityId) return;
    this._callService('input_select.select_option', {
      entity_id: this._config.focus_select,
      option: entityId,
    });
  }

  _openPlayersPopup() {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: 'Media',
            size: 'wide',
            content: {
              type: 'entities',
              entities: this._config.players.map((player) => ({
                entity: player.entity,
                name: player.name,
              })),
            },
          },
        },
      },
      bubbles: true,
      composed: true,
    }));
  }

  _wireActions() {
    this.shadowRoot.querySelector('.artwork-action')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._runScript('play_pause');
    });
    this.shadowRoot.querySelector('.artwork-action')?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._runScript('play_pause');
    });

    this.shadowRoot.querySelectorAll('[data-script-key]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._runScript(button.dataset.scriptKey);
      });
    });

    this.shadowRoot.querySelectorAll('[data-player-id]').forEach((button) => {
      let holdTimer = null;
      let holdFired = false;
      button.addEventListener('pointerdown', (event) => {
        if (event.button != null && event.button !== 0) return;
        holdFired = false;
        button.setPointerCapture?.(event.pointerId);
        holdTimer = window.setTimeout(() => {
          holdFired = true;
          this._openPlayersPopup();
        }, 560);
      });
      button.addEventListener('pointerup', (event) => {
        button.releasePointerCapture?.(event.pointerId);
        if (holdTimer) window.clearTimeout(holdTimer);
        holdTimer = null;
        if (holdFired) return;
        this._selectPlayer(button.dataset.playerId);
      });
      button.addEventListener('pointerleave', () => {
        if (holdTimer) window.clearTimeout(holdTimer);
        holdTimer = null;
      });
      button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        this._openPlayersPopup();
      });
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const focus = this._focusModel();
    const image = focus.image ? `url("${BrunoMediaCard._escapeAttr(focus.image)}")` : '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .media-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: minmax(0, 1fr) auto;
          gap: 10px;
          padding: 13px;
          color: rgba(248,251,255,0.96);
          background: var(--bruno-liquid-surface-off-background,
            linear-gradient(160deg, rgba(15,20,35,0.46), rgba(20,24,33,0.30))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.18));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.30),
            0 18px 46px rgba(0,0,0,0.31)
          );
          overflow: hidden;
        }

        .media-card::before,
        .media-card::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
        }

        .media-card::before {
          inset: 1px;
          z-index: 0;
          background: var(--bruno-liquid-surface-off-sheen,
            linear-gradient(180deg, rgba(255,255,255,0.16), transparent 38%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.82);
        }

        .media-card::after {
          inset: 0;
          z-index: 3;
          padding: 1px;
          background: var(--bruno-liquid-surface-edge-glow,
            linear-gradient(125deg, rgba(255,255,255,0.42), rgba(255,255,255,0.08) 36%, rgba(255,190,120,0.20) 100%)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: 0.72;
        }

        .artwork-action,
        .player-strip {
          position: relative;
          z-index: 1;
        }

        .artwork-action {
          appearance: none;
          -webkit-appearance: none;
          min-height: 0;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-rows: 1fr auto;
          padding: 0;
          text-align: left;
          cursor: pointer;
          border: 0;
          outline: none;
          border-radius: calc(var(--card-radius) - 7px);
          background:
            linear-gradient(180deg, rgba(3,7,16,0.10), rgba(3,7,16,0.74)),
            ${image ? `${image} center / cover no-repeat,` : ''}
            radial-gradient(circle at 50% 44%, rgba(var(--accent),0.16), transparent 42%),
            linear-gradient(160deg, rgba(12,17,28,0.76), rgba(5,8,15,0.88));
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 10px 24px rgba(0,0,0,0.18);
          overflow: hidden;
        }

        .artwork-action::before {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 50% 50%, rgba(var(--accent),0.18), transparent 30%),
            repeating-radial-gradient(circle at 50% 50%, rgba(180,225,255,0.18) 0 1px, transparent 1px 18px);
          opacity: ${image ? '0.16' : '0.50'};
          pointer-events: none;
        }

        .play-glyph {
          align-self: center;
          justify-self: center;
          width: 74px;
          height: 74px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: rgba(220,245,255,0.92);
          border: 1px solid rgba(220,245,255,0.28);
          background: rgba(10,16,26,0.18);
          backdrop-filter: blur(12px) saturate(1.2);
          -webkit-backdrop-filter: blur(12px) saturate(1.2);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 0 32px rgba(var(--accent),0.18);
          opacity: ${focus.isActive && image ? '0' : '1'};
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .artwork-action:hover .play-glyph {
          opacity: 1;
          transform: scale(1.03);
        }

        .play-glyph ha-icon {
          --mdc-icon-size: 34px;
        }

        .meta {
          position: relative;
          z-index: 1;
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 8px;
          padding: 0 12px 12px;
        }

        .title {
          min-width: 0;
        }

        .media-title {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 14px;
          line-height: 1.08;
          font-weight: 780;
        }

        .media-sub {
          display: block;
          margin-top: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          line-height: 1;
          font-weight: 620;
          color: rgba(255,255,255,0.62);
        }

        .controls {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 3px;
          border-radius: 999px;
          background: rgba(15,20,30,0.46);
          border: 1px solid rgba(255,255,255,0.11);
        }

        .control {
          appearance: none;
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255,255,255,0.82);
          outline: none;
        }

        .control:hover {
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.98);
        }

        .control ha-icon {
          --mdc-icon-size: 17px;
        }

        .control.play ha-icon {
          --mdc-icon-size: 20px;
        }

        .player-strip {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 7px;
        }

        .player {
          appearance: none;
          -webkit-appearance: none;
          min-width: 0;
          height: 48px;
          display: grid;
          grid-template-columns: 24px minmax(0, 1fr);
          align-items: center;
          column-gap: 8px;
          padding: 0 9px;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.035));
          color: rgba(255,255,255,0.74);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          overflow: hidden;
          outline: none;
          transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
        }

        .player.is-selected {
          color: rgba(255,255,255,0.96);
          border-color: rgba(var(--accent),0.42);
          background:
            radial-gradient(34px 24px at 12% 10%, rgba(255,255,255,0.22), transparent 72%),
            linear-gradient(180deg, rgba(var(--accent),0.20), rgba(255,255,255,0.055));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 18px rgba(var(--accent),0.16);
        }

        .player:active {
          transform: scale(0.98);
        }

        .player ha-icon {
          --mdc-icon-size: 20px;
        }

        .player-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
          text-align: left;
        }

        .player-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
        }

        .player-state {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          line-height: 1;
          font-weight: 650;
          color: rgba(255,255,255,0.48);
          text-transform: capitalize;
        }

        @media (max-height: 760px) {
          .media-card { padding: 11px; gap: 8px; }
          .player { height: 43px; }
          .controls { gap: 2px; }
          .control { width: 26px; height: 26px; }
        }

        @media (max-width: 800px) {
          .player-strip { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
      </style>

      <div class="media-card">
        <div class="artwork-action" role="button" tabindex="0" aria-label="Reproduzir ou pausar midia">
          <span class="play-glyph" aria-hidden="true"><ha-icon icon="${focus.isPlaying ? 'mdi:pause' : 'mdi:play'}"></ha-icon></span>
          <span class="meta">
            <span class="title">
              <span class="media-title">${BrunoMediaCard._escape(focus.title)}</span>
              <span class="media-sub">${BrunoMediaCard._escape(focus.artist || this._state(focus.entity)?.attributes?.friendly_name || focus.state)}</span>
            </span>
            <span class="controls" aria-label="Controles de midia">
              ${this._control('volume_down', 'mdi:volume-minus', 'Diminuir volume')}
              ${this._control('previous', 'mdi:skip-previous', 'Anterior')}
              ${this._control('play_pause', focus.isPlaying ? 'mdi:pause' : 'mdi:play', 'Play/Pause', 'play')}
              ${this._control('next', 'mdi:skip-next', 'Proxima')}
              ${this._control('volume_up', 'mdi:volume-plus', 'Aumentar volume')}
              ${this._control('mute', 'mdi:volume-mute', 'Mudo')}
            </span>
          </span>
        </div>

        <div class="player-strip">
          ${this._config.players.map((player) => this._playerButton(player, focus.entity)).join('')}
        </div>
      </div>
    `;

    this._wireActions();
  }

  _control(key, icon, label, extraClass = '') {
    return `
      <button class="control ${extraClass}" type="button" data-script-key="${key}" aria-label="${BrunoMediaCard._escapeAttr(label)}">
        <ha-icon icon="${icon}"></ha-icon>
      </button>
    `;
  }

  _playerButton(player, selectedId) {
    const entity = this._state(player.entity);
    const selected = player.entity === selectedId ? ' is-selected' : '';
    const state = entity?.state || 'off';
    return `
      <button class="player${selected}" type="button" data-player-id="${BrunoMediaCard._escapeAttr(player.entity)}" title="${BrunoMediaCard._escapeAttr(player.name)}">
        <ha-icon icon="${BrunoMediaCard._escapeAttr(player.icon || 'mdi:speaker')}"></ha-icon>
        <span class="player-text">
          <span class="player-name">${BrunoMediaCard._escape(player.name || entity?.attributes?.friendly_name || player.entity)}</span>
          <span class="player-state">${BrunoMediaCard._escape(state.replace('_', ' '))}</span>
        </span>
      </button>
    `;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoMediaCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_MEDIA_CARD_TAG)) {
  customElements.define(BRUNO_MEDIA_CARD_TAG, BrunoMediaCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_MEDIA_CARD_TAG,
  name: 'Bruno Media Card',
  preview: false,
  description: 'Isolated Bento media card with preserved media focus scripts and player selection.',
});
