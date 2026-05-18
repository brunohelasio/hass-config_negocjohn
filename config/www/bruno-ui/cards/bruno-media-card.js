const BRUNO_MEDIA_CARD_TAG = 'bruno-media-card';

const BRUNO_MEDIA_DEFAULT_CONFIG = {
  focus_sensor: 'sensor.media_focus_visuals',
  focus_select: 'input_select.media_focus_player',
  slots: [
    'input_select.media_slot_1',
    'input_select.media_slot_2',
    'input_select.media_slot_3',
    'input_select.media_slot_4',
  ],
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
      slots: Array.isArray(config?.slots) ? config.slots : BRUNO_MEDIA_DEFAULT_CONFIG.slots,
      players: Array.isArray(config?.players) ? config.players : BRUNO_MEDIA_DEFAULT_CONFIG.players,
    };
    this._slideIndex = 0;
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

  _isStandbyImage(image) {
    return String(image || '').includes('standby_art');
  }

  _playerConfig(entityId) {
    return this._config.players.find((player) => player.entity === entityId) || {};
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
    const config = this._playerConfig(focusId);
    const state = visual?.state || player?.state || 'off';
    const rawImage = visual?.attributes?.entity_picture || player?.attributes?.entity_picture || '';
    this._lastArtworkByPlayer = this._lastArtworkByPlayer || {};
    if (rawImage && !this._isStandbyImage(rawImage)) {
      this._lastArtworkByPlayer[focusId] = rawImage;
    }
    const shouldKeepArtwork = ['paused', 'idle'].includes(state) && this._lastArtworkByPlayer[focusId];
    let image = rawImage;
    if (shouldKeepArtwork && (!rawImage || this._isStandbyImage(rawImage))) {
      image = this._lastArtworkByPlayer[focusId];
    } else if (this._isStandbyImage(rawImage)) {
      image = '';
    }
    const title = visual?.attributes?.media_title
      || player?.attributes?.media_title
      || player?.attributes?.friendly_name
      || config.name
      || 'Sistema de Audio';
    const artist = visual?.attributes?.media_artist || player?.attributes?.media_artist || '';

    return {
      entity: focusId,
      image,
      title,
      artist: artist && artist !== 'Pronto para tocar' ? artist : '',
      state,
      isPlaying: state === 'playing',
      isActive: BRUNO_MEDIA_ACTIVE_STATES.includes(state),
      isSoftArtwork: ['paused', 'idle'].includes(state) && Boolean(image) && !this._isStandbyImage(image),
    };
  }

  _slotPlayerIds() {
    const ids = [];
    const push = (entityId) => {
      if (!entityId || ids.includes(entityId) || !this._state(entityId)) return;
      ids.push(entityId);
    };

    (this._config.slots || []).forEach((slotId) => push(this._state(slotId)?.state));
    (this._config.players || []).forEach((player) => push(player.entity));
    return ids.slice(0, 4);
  }

  _allPlayerIds() {
    const ids = [];
    const push = (entityId) => {
      if (!entityId || ids.includes(entityId)) return;
      ids.push(entityId);
    };

    const focusOptions = this._state(this._config.focus_select)?.attributes?.options;
    if (Array.isArray(focusOptions)) focusOptions.forEach(push);
    (this._config.players || []).forEach((player) => push(player.entity));
    (this._config.slots || []).forEach((slotId) => push(this._state(slotId)?.state));
    return ids;
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
    this._setSlide(0);
  }

  _setSlide(index) {
    const nextIndex = Math.max(0, Math.min(1, Number(index) || 0));
    if (this._slideIndex === nextIndex) return;
    this._slideIndex = nextIndex;
    this._render();
  }

  _moreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _openPlayersPopup() {
    const entities = this._allPlayerIds().map((entity) => ({
      entity,
      name: this._playerName(entity),
    }));

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
              entities,
            },
          },
        },
      },
      bubbles: true,
      composed: true,
    }));
  }

  _playerName(entityId) {
    const entity = this._state(entityId);
    const config = this._playerConfig(entityId);
    return config.name || entity?.attributes?.friendly_name || entityId;
  }

  _playerIcon(entityId) {
    return this._playerConfig(entityId).icon || 'mdi:speaker-wireless';
  }

  _playerModel(entityId, focusId) {
    const entity = this._state(entityId);
    const state = entity?.state || 'off';
    const title = entity?.attributes?.media_title || this._playerName(entityId);
    const artist = entity?.attributes?.media_artist || '';
    const subtitle = artist && state !== 'off'
      ? artist
      : BRUNO_MEDIA_ACTIVE_STATES.includes(state)
        ? state.replace('_', ' ')
        : 'Off';

    return {
      entity: entityId,
      image: entity?.attributes?.entity_picture || '',
      name: this._playerName(entityId),
      title,
      subtitle,
      state,
      icon: this._playerIcon(entityId),
      active: BRUNO_MEDIA_ACTIVE_STATES.includes(state),
      selected: entityId === focusId,
    };
  }

  _wireActions() {
    this.shadowRoot.querySelectorAll('[data-script-key]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._runScript(button.dataset.scriptKey);
      });
    });

    this.shadowRoot.querySelectorAll('[data-slide-index]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._setSlide(button.dataset.slideIndex);
      });
    });

    this.shadowRoot.querySelectorAll('[data-player-id]').forEach((button) => {
      let holdTimer = null;
      let holdFired = false;
      const clearHold = () => {
        if (holdTimer) window.clearTimeout(holdTimer);
        holdTimer = null;
      };

      button.addEventListener('pointerdown', (event) => {
        if (event.button != null && event.button !== 0) return;
        event.preventDefault();
        event.stopPropagation();
        holdFired = false;
        button.classList.add('is-pressed');
        button.setPointerCapture?.(event.pointerId);
        holdTimer = window.setTimeout(() => {
          holdFired = true;
          button.classList.remove('is-pressed');
          this._openPlayersPopup();
        }, 560);
      });

      button.addEventListener('pointerup', (event) => {
        event.preventDefault();
        event.stopPropagation();
        button.releasePointerCapture?.(event.pointerId);
        clearHold();
        button.classList.remove('is-pressed');
        if (holdFired) return;
        this._selectPlayer(button.dataset.playerId);
      });

      button.addEventListener('pointerleave', () => {
        clearHold();
        button.classList.remove('is-pressed');
      });

      button.addEventListener('pointercancel', () => {
        clearHold();
        button.classList.remove('is-pressed');
      });

      button.addEventListener('contextmenu', (event) => {
        event.preventDefault();
        this._openPlayersPopup();
      });
    });

    const shell = this.shadowRoot.querySelector('.media-shell');
    const focusSurface = this.shadowRoot.querySelector('.focus-surface');
    if (!shell) return;
    const isInteractiveTarget = (target) => Boolean(target?.closest?.('button'));

    let startX = 0;
    let startY = 0;
    let holdTimer = null;
    let holdFired = false;
    let tracking = false;

    const clearHold = () => {
      if (holdTimer) window.clearTimeout(holdTimer);
      holdTimer = null;
    };

    const endTracking = () => {
      tracking = false;
      clearHold();
      shell.classList.remove('is-pressed');
    };

    shell.addEventListener('pointerdown', (event) => {
      if (event.button != null && event.button !== 0) return;
      if (isInteractiveTarget(event.target)) return;
      tracking = true;
      holdFired = false;
      startX = event.clientX;
      startY = event.clientY;
      shell.classList.add('is-pressed');
      shell.setPointerCapture?.(event.pointerId);

      if (this._slideIndex === 0) {
        holdTimer = window.setTimeout(() => {
          holdFired = true;
          this._moreInfo(this._config.focus_sensor);
        }, 620);
      }
    });

    shell.addEventListener('pointermove', (event) => {
      if (!tracking) return;
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      if (Math.abs(dx) > 12 || Math.abs(dy) > 12) clearHold();
    });

    shell.addEventListener('pointerup', (event) => {
      if (!tracking) return;
      event.preventDefault();
      shell.releasePointerCapture?.(event.pointerId);
      const dx = event.clientX - startX;
      const dy = event.clientY - startY;
      endTracking();
      if (holdFired) return;
      if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
        this._setSlide(this._slideIndex + (dx < 0 ? 1 : -1));
        return;
      }
      if (this._slideIndex === 0) this._runScript('play_pause');
    });

    shell.addEventListener('pointercancel', endTracking);
    shell.addEventListener('pointerleave', () => {
      if (tracking) clearHold();
      shell.classList.remove('is-pressed');
    });

    let touchStartX = 0;
    let touchStartY = 0;
    let touchDragging = false;
    shell.addEventListener('touchstart', (event) => {
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches?.[0];
      if (!touch) return;
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      touchDragging = false;
    }, { passive: true });

    shell.addEventListener('touchmove', (event) => {
      if (isInteractiveTarget(event.target)) return;
      const touch = event.touches?.[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
        touchDragging = true;
        event.preventDefault();
      }
    }, { passive: false });

    shell.addEventListener('touchend', (event) => {
      if (isInteractiveTarget(event.target)) return;
      const touch = event.changedTouches?.[0];
      if (!touch) return;
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;
      if (!touchDragging && (Math.abs(dx) <= 34 || Math.abs(dx) <= Math.abs(dy))) return;
      event.preventDefault();
      this._setSlide(this._slideIndex + (dx < 0 ? 1 : -1));
    }, { passive: false });

    focusSurface?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._runScript('play_pause');
    });

    focusSurface?.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      this._moreInfo(this._config.focus_sensor);
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const focus = this._focusModel();
    const focusImage = focus.image ? `--focus-art: url(&quot;${BrunoMediaCard._escapeAttr(focus.image)}&quot;);` : '';
    const focusSoftClass = focus.isSoftArtwork ? ' is-soft-artwork' : '';
    const focusEmptyClass = focus.image ? '' : ' is-empty-artwork';
    const players = this._slotPlayerIds().map((id) => this._playerModel(id, focus.entity));
    const slideIndex = this._slideIndex || 0;

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
          place-items: center;
          padding: 12px;
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
          z-index: 4;
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

        .media-shell {
          position: relative;
          z-index: 1;
          height: 100%;
          width: auto;
          max-width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: calc(var(--card-radius) - 7px);
          overflow: hidden;
          touch-action: pan-y;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 10px 24px rgba(0,0,0,0.18);
          transition: transform 160ms ease;
        }

        .media-shell.is-pressed {
          transform: scale(0.992);
        }

        .viewport,
        .slides,
        .slide {
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .viewport {
          overflow: hidden;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            radial-gradient(circle at 50% 44%, rgba(var(--accent),0.16), transparent 42%),
            linear-gradient(160deg, rgba(12,17,28,0.76), rgba(5,8,15,0.88));
        }

        .slides {
          display: flex;
          transform: translateX(calc(${slideIndex} * -100%));
          transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .slide {
          flex: 0 0 100%;
          position: relative;
        }

        .focus-surface {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-rows: 1fr auto;
          overflow: hidden;
          outline: none;
          cursor: pointer;
          touch-action: pan-y;
          background:
            radial-gradient(circle at 50% 44%, rgba(var(--accent),0.16), transparent 42%),
            linear-gradient(160deg, rgba(12,17,28,0.76), rgba(5,8,15,0.88));
        }

        .focus-surface::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: var(--focus-art, none) center / cover no-repeat;
          filter: var(--focus-art-filter, none);
          transform: var(--focus-art-transform, scale(1));
          pointer-events: none;
        }

        .focus-surface.is-soft-artwork {
          --focus-art-filter: blur(4px) brightness(0.62) saturate(0.92);
          --focus-art-transform: scale(1.035);
        }

        .focus-surface.is-empty-artwork {
          grid-template-rows: 1fr;
        }

        .focus-surface::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(180deg, rgba(3,7,16,0.04), rgba(3,7,16,0.62)),
            radial-gradient(circle at 50% 50%, rgba(var(--accent),0.16), transparent 30%),
            repeating-radial-gradient(circle at 50% 50%, rgba(180,225,255,0.16) 0 1px, transparent 1px 18px);
          opacity: ${focus.image ? '0.10' : '0.52'};
          pointer-events: none;
        }

        .play-glyph {
          position: relative;
          z-index: 2;
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
          opacity: ${focus.isActive && focus.image ? '0' : '1'};
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .focus-surface:hover .play-glyph,
        .focus-surface:focus-visible .play-glyph,
        .focus-surface.is-empty-artwork .play-glyph {
          opacity: 1;
          transform: scale(1.03);
        }

        .play-glyph ha-icon {
          --mdc-icon-size: 34px;
        }

        .focus-bottom {
          position: relative;
          z-index: 3;
          min-width: 0;
          display: grid;
          grid-template-rows: auto auto;
          gap: 6px;
          padding: 18px 11px 14px;
          background:
            linear-gradient(180deg, rgba(7,10,18,0), rgba(7,10,18,0.50) 30%, rgba(7,10,18,0.64));
          backdrop-filter: blur(8px) saturate(1.14);
          -webkit-backdrop-filter: blur(8px) saturate(1.14);
        }

        .focus-surface.is-empty-artwork .focus-bottom {
          display: none;
        }

        .focus-title {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 10px;
        }

        .media-copy {
          min-width: 0;
        }

        .media-title,
        .media-sub {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.62);
        }

        .media-title {
          font-size: 14px;
          line-height: 1.08;
          font-weight: 780;
        }

        .media-sub {
          margin-top: 4px;
          font-size: 11px;
          line-height: 1;
          font-weight: 620;
          color: rgba(255,255,255,0.68);
        }

        .focus-state {
          flex: 0 0 auto;
          height: 23px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border-radius: 999px;
          color: rgba(255,255,255,0.78);
          background: rgba(13,18,28,0.48);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          text-transform: capitalize;
        }

        .focus-state::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${focus.isActive ? 'rgb(52,211,153)' : 'rgba(255,255,255,0.34)'};
          box-shadow: ${focus.isActive ? '0 0 10px rgba(52,211,153,0.70)' : 'none'};
        }

        .controls {
          min-width: 0;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 4px;
          padding: 4px;
          border-radius: 999px;
          background: rgba(15,20,30,0.48);
          border: 1px solid rgba(255,255,255,0.11);
        }

        .control {
          appearance: none;
          -webkit-appearance: none;
          height: 27px;
          min-width: 0;
          display: grid;
          place-items: center;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255,255,255,0.84);
          outline: none;
        }

        .control:hover {
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.98);
        }

        .control:active,
        .player-card.is-pressed {
          transform: scale(0.97);
        }

        .control ha-icon {
          --mdc-icon-size: 17px;
        }

        .control.play ha-icon {
          --mdc-icon-size: 20px;
        }

        .player-grid {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 9px;
          padding: 9px;
          background:
            radial-gradient(120px 90px at 20% 4%, rgba(255,255,255,0.12), transparent 70%),
            linear-gradient(160deg, rgba(7,10,18,0.36), rgba(7,10,18,0.70));
        }

        .player-card {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: end;
          padding: 8px;
          text-align: left;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,0.13);
          background:
            radial-gradient(38px 30px at 18% 12%, rgba(255,255,255,0.16), transparent 72%),
            linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
          color: rgba(255,255,255,0.82);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 8px 20px rgba(0,0,0,0.15);
          overflow: hidden;
          outline: none;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .player-card.has-art {
          background:
            linear-gradient(180deg, rgba(7,10,18,0.08), rgba(7,10,18,0.76)),
            var(--player-art) center / cover no-repeat,
            linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
        }

        .player-card.is-selected {
          border-color: rgba(var(--accent),0.60);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 0 1px rgba(var(--accent),0.18),
            0 0 22px rgba(var(--accent),0.22);
        }

        .player-icon {
          position: absolute;
          left: 8px;
          top: 8px;
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(255,255,255,0.82);
          background: rgba(8,12,20,0.36);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px) saturate(1.18);
          -webkit-backdrop-filter: blur(10px) saturate(1.18);
        }

        .player-icon ha-icon {
          --mdc-icon-size: 17px;
        }

        .player-meta {
          position: relative;
          z-index: 1;
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .player-name,
        .player-sub {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.62);
        }

        .player-name {
          font-size: 11px;
          line-height: 1;
          font-weight: 780;
        }

        .player-sub {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          line-height: 1;
          font-weight: 680;
          color: rgba(255,255,255,0.70);
        }

        .player-sub::before {
          content: "";
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 50%;
          background: var(--player-dot, rgba(255,255,255,0.36));
          box-shadow: var(--player-dot-glow, none);
        }

        .player-card.is-active {
          --player-dot: rgb(52,211,153);
          --player-dot-glow: 0 0 10px rgba(52,211,153,0.70);
        }

        .pagination {
          position: absolute;
          z-index: 3;
          left: 50%;
          bottom: 6px;
          display: inline-flex;
          gap: 6px;
          transform: translateX(-50%);
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(8,12,18,0.32);
          backdrop-filter: blur(10px) saturate(1.16);
          -webkit-backdrop-filter: blur(10px) saturate(1.16);
        }

        .dot {
          appearance: none;
          -webkit-appearance: none;
          width: 7px;
          height: 7px;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.34);
          outline: none;
        }

        .dot.is-active {
          background: rgba(255,255,255,0.82);
          box-shadow: 0 0 12px rgba(var(--accent),0.44);
        }

        @media (max-height: 760px) {
          .media-card { padding: 10px; }
          .focus-bottom { padding: 15px 10px 13px; gap: 5px; }
          .control { height: 25px; }
          .player-grid { gap: 7px; padding: 7px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .slides,
          .media-shell,
          .control,
          .player-card {
            transition: none !important;
          }
        }
      </style>

      <div class="media-card">
        <div class="media-shell" style="--slide-index:${slideIndex};">
          <div class="viewport">
            <div class="slides">
              <section class="slide focus-slide">
                <div class="focus-surface${focusSoftClass}${focusEmptyClass}" role="button" tabindex="0" aria-label="Reproduzir ou pausar midia" style="${focusImage}">
                  <span class="play-glyph" aria-hidden="true"><ha-icon icon="${focus.isPlaying ? 'mdi:pause' : 'mdi:play'}"></ha-icon></span>
                  <div class="focus-bottom">
                    <div class="focus-title">
                      <span class="media-copy">
                        <span class="media-title">${BrunoMediaCard._escape(focus.title)}</span>
                        <span class="media-sub">${BrunoMediaCard._escape(focus.artist || this._playerName(focus.entity) || focus.state)}</span>
                      </span>
                      <span class="focus-state">${BrunoMediaCard._escape(focus.state.replace('_', ' '))}</span>
                    </div>
                    <div class="controls" aria-label="Controles de midia">
                      ${this._control('volume_down', 'mdi:volume-minus', 'Diminuir volume')}
                      ${this._control('previous', 'mdi:skip-previous', 'Anterior')}
                      ${this._control('play_pause', focus.isPlaying ? 'mdi:pause' : 'mdi:play', 'Play/Pause', 'play')}
                      ${this._control('next', 'mdi:skip-next', 'Proxima')}
                      ${this._control('volume_up', 'mdi:volume-plus', 'Aumentar volume')}
                      ${this._control('mute', 'mdi:volume-mute', 'Mudo')}
                    </div>
                  </div>
                </div>
              </section>

              <section class="slide players-slide">
                <div class="player-grid" aria-label="Players recentes">
                  ${players.map((player) => this._playerButton(player)).join('')}
                </div>
              </section>
            </div>
          </div>

          <div class="pagination" aria-label="Slides de midia">
            <button class="dot${slideIndex === 0 ? ' is-active' : ''}" type="button" data-slide-index="0" aria-label="Slide principal"></button>
            <button class="dot${slideIndex === 1 ? ' is-active' : ''}" type="button" data-slide-index="1" aria-label="Players recentes"></button>
          </div>
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

  _playerButton(player) {
    const selected = player.selected ? ' is-selected' : '';
    const active = player.active ? ' is-active' : '';
    const art = player.image ? ' has-art' : '';
    const style = player.image ? ` style="--player-art: url(&quot;${BrunoMediaCard._escapeAttr(player.image)}&quot;);"` : '';
    return `
      <button class="player-card${selected}${active}${art}" type="button" data-player-id="${BrunoMediaCard._escapeAttr(player.entity)}"${style} aria-label="${BrunoMediaCard._escapeAttr(player.name)}">
        <span class="player-icon" aria-hidden="true"><ha-icon icon="${BrunoMediaCard._escapeAttr(player.icon)}"></ha-icon></span>
        <span class="player-meta">
          <span class="player-name">${BrunoMediaCard._escape(player.name)}</span>
          <span class="player-sub">${BrunoMediaCard._escape(player.subtitle)}</span>
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
  description: 'Isolated Bento media card with preserved media focus, FIFO slots and square swipe behavior.',
});
