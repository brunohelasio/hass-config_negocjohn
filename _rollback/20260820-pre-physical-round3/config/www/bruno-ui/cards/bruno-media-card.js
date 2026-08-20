const BRUNO_MEDIA_CARD_TAG = 'bruno-media-card';
const BRUNO_MEDIA_HISTORY_KEY = 'bruno-ui:media-history:v3';

const BRUNO_MEDIA_DEFAULT_CONFIG = {
  focus_sensor: 'sensor.media_focus_visuals',
  focus_select: 'input_select.media_focus_player',
  spotify_entity: 'media_player.spotifyplus_bruno_helasio',
  spotify_device_name: 'Echo Show',
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
    { entity: 'media_player.android_tv_192_168_3_17', name: 'TV', icon: 'mdi:television-classic', section: 'sala', path: 'subview-sala' },
    { entity: 'media_player.echo_show', name: 'Echo Show', icon: 'mdi:speaker-wireless', section: 'sala', path: 'subview-sala' },
    { entity: 'media_player.spotifyplus_bruno_helasio', name: 'Spotify', icon: 'mdi:spotify', section: 'sala', path: 'subview-sala' },
    { entity: 'media_player.echo_pop_office', name: 'Office', icon: 'mdi:speaker', section: 'office', path: 'subview-office' },
  ],
};

const BRUNO_MEDIA_ACTIVE_STATES = ['playing', 'paused'];
const BRUNO_MEDIA_TV_ENTITY = 'media_player.android_tv_192_168_3_17';
const BRUNO_MEDIA_TV_POWER_ENTITY = 'media_player.smart_tv_pro_2';
const BRUNO_MEDIA_TV_POWER_STATES = new Set(['on', 'playing', 'paused', 'idle', 'buffering']);

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
    this._slideIndex = this._slideIndex || 0;
    this._mediaMenuOpen = this._mediaMenuOpen || false;
    if (this._mediaHistory === undefined) this._mediaHistory = this._readMediaHistory();
    this._lastValidMedia = this._latestMediaSnapshot();
    this._safeRender();
  }

  set hass(hass) {
    this._hass = hass;
    const selected = this._state(this._config?.focus_select)?.state;
    if (this._localFocusEntity && selected === this._localFocusEntity) {
      this._localFocusEntity = '';
      this._localFocusAt = 0;
    }
    this._capturePlayerHistory();
    this._safeRender();
  }

  getCardSize() {
    return 4;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
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
    console.error('[bruno-media-card]', error);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .error-card {
          width: 100%;
          height: 100%;
          min-height: 160px;
          display: grid;
          place-items: center;
          padding: 18px;
          border-radius: var(--bruno-liquid-card-radius, 22px);
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.18));
          color: rgba(255,255,255,0.78);
          background: var(--bruno-liquid-surface-off-background, rgba(12,16,26,0.72));
          box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 46px rgba(0,0,0,0.31));
          box-sizing: border-box;
          text-align: center;
        }

        .title {
          display: block;
          color: rgba(255,255,255,0.92);
          font-size: 13px;
          font-weight: 780;
          text-transform: uppercase;
        }

        .message {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          font-weight: 620;
          color: rgba(255,255,255,0.54);
        }
      </style>
      <div class="error-card">
        <span>
          <span class="title">Media</span>
          <span class="message">Aguardando dados dos players</span>
        </span>
      </div>
    `;
  }

  _isActive(entityId) {
    const state = String(this._state(entityId)?.state || '').toLowerCase();
    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      const powerState = String(this._state(BRUNO_MEDIA_TV_POWER_ENTITY)?.state || '').toLowerCase();
      return BRUNO_MEDIA_TV_POWER_STATES.has(powerState);
    }
    return BRUNO_MEDIA_ACTIVE_STATES.includes(state);
  }

  _isStandbyImage(image) {
    return String(image || '').includes('standby_art');
  }

  _readMediaHistory() {
    try {
      const raw = globalThis.localStorage?.getItem(BRUNO_MEDIA_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch (_error) {
      return {};
    }
  }

  _storeLastValidMedia(snapshot) {
    if (!snapshot?.entity || (!snapshot.image && !snapshot.title)) return;
    this._mediaHistory = this._mediaHistory || {};
    const previous = this._mediaHistory[snapshot.entity];
    const comparable = (value) => JSON.stringify({
      ...(value || {}),
      savedAt: 0,
    });
    if (comparable(previous) === comparable(snapshot)) return;
    this._mediaHistory[snapshot.entity] = snapshot;
    this._lastValidMedia = this._latestMediaSnapshot();
    try {
      globalThis.localStorage?.setItem(BRUNO_MEDIA_HISTORY_KEY, JSON.stringify(this._mediaHistory));
    } catch (_error) {
      // Private WebViews can reject storage; the in-memory history remains valid.
    }
  }

  _latestMediaSnapshot() {
    return Object.values(this._mediaHistory || {})
      .filter((item) => item?.entity && (item.image || item.title))
      .sort((left, right) => Number(right.savedAt || 0) - Number(left.savedAt || 0))[0] || null;
  }

  _capturePlayerHistory() {
    if (!this._config || !this._hass) return;
    this._allPlayerIds().forEach((entityId) => {
      const entity = this._state(entityId);
      const attrs = entity?.attributes || {};
      const state = String(entity?.state || '').toLowerCase();
      const config = this._playerConfig(entityId);
      const title = this._cleanText(attrs.media_title);
      const rawImage = attrs.media_image_url || attrs.entity_picture || '';
      const image = this._isStandbyImage(rawImage) ? '' : rawImage;
      const appName = this._cleanText(attrs.app_name);
      const source = this._cleanText(attrs.source);
      const contentType = String(attrs.media_content_type || appName || '').toLowerCase();

      const previous = this._mediaHistory?.[entityId];
      if (previous && image && image !== previous.image && !['unknown', 'unavailable'].includes(state)) {
        this._storeLastValidMedia({ ...previous, image, savedAt: previous.savedAt || Date.now() });
      }
      if (!this._hasPlayback(state, title, image, appName, source, entityId, config, contentType, attrs)) return;

      const serviceName = this._mediaServiceName(entityId, config, contentType, appName, source);
      const spotifyTarget = serviceName === 'Spotify' ? this._spotifyRoomTarget(attrs) : null;
      const effectiveConfig = spotifyTarget ? { ...config, ...spotifyTarget } : config;
      const roomName = this._mediaRoomName(effectiveConfig);
      const artist = this._cleanText(attrs.media_artist);
      const album = this._cleanText(attrs.media_album_name);
      const series = this._cleanText(attrs.media_series_title);
      const channel = this._cleanText(attrs.media_channel);
      const fallbackTitle = this._fallbackMediaTitle(serviceName, roomName, entityId);
      const liveTitle = this._firstText([title, fallbackTitle, this._playerName(entityId)]);
      const secondary = this._firstText([artist, album, series, channel], [liveTitle]);
      this._storeLastValidMedia({
        entity: entityId,
        image,
        title: liveTitle,
        artist: artist && artist !== 'Pronto para tocar' ? artist : '',
        secondary,
        context: [serviceName, roomName].filter(Boolean).join(' '),
        serviceName,
        serviceIcon: config.icon || this._playerIcon(entityId),
        path: effectiveConfig.path || effectiveConfig.navigation_path || '',
        section: effectiveConfig.section || '',
        savedAt: Date.now(),
      });
    });
  }

  _visualBelongsToFocus(visual, focusId) {
    const attrs = visual?.attributes || {};
    const linked = [
      attrs.entity_id,
      attrs.entity,
      attrs.player,
      attrs.media_player,
      attrs.source_entity,
    ].filter(Boolean);
    if (!linked.length) return false;
    return linked.includes(focusId);
  }

  _playerConfig(entityId) {
    return this._config.players.find((player) => player.entity === entityId) || {};
  }

  _focusEntityId() {
    if (this._localFocusEntity && this._state(this._localFocusEntity)) {
      const age = Date.now() - (this._localFocusAt || 0);
      if (age < 5000) return this._localFocusEntity;
      this._localFocusEntity = '';
      this._localFocusAt = 0;
    }

    const livePlayer = this._allPlayerIds()
      .map((entityId) => ({
        entity: entityId,
        score: this._playbackPriority(entityId),
        updatedAt: Date.parse(this._state(entityId)?.last_updated || '') || 0,
      }))
      .filter((player) => player.score > 0)
      .sort((left, right) => right.score - left.score || right.updatedAt - left.updatedAt)[0];
    if (livePlayer?.entity) return livePlayer.entity;

    const selected = this._state(this._config.focus_select)?.state;
    if (selected && this._state(selected)) return selected;
    return this._config.players[0]?.entity;
  }

  _playbackPriority(entityId) {
    const entity = this._state(entityId);
    const state = String(entity?.state || '').toLowerCase();
    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      if (BRUNO_MEDIA_TV_POWER_STATES.has(state)) this._lastTvPoweredAt = Date.now();
      if (state === 'playing') return 4;
      if (state === 'buffering') return 3;
      if (state === 'paused') return 2;
      if (state === 'on' || state === 'idle') return 1;
      if (state === 'off' && Number.isFinite(this._lastTvPoweredAt)
          && Date.now() - this._lastTvPoweredAt <= BRUNO_MEDIA_TV_OFF_GRACE_MS) return 1;
    } else {
      if (state === 'playing') return 4;
      if (state === 'paused') return 2;
    }
    const config = this._playerConfig(entityId);
    const attrs = entity?.attributes || {};
    const contentType = String(attrs.media_content_type || attrs.app_name || '').toLowerCase();
    const image = this._isStandbyImage(attrs.entity_picture) ? '' : (attrs.entity_picture || '');
    return this._hasPlayback(
      state,
      this._cleanText(attrs.media_title),
      image,
      attrs.app_name,
      attrs.source,
      entityId,
      config,
      contentType,
      attrs,
    ) ? 3 : 0;
  }

  _focusModel() {
    const focusId = this._focusEntityId();
    const player = this._state(focusId);
    const visual = this._state(this._config.focus_sensor);
    const useVisual = this._visualBelongsToFocus(visual, focusId);
    const config = this._playerConfig(focusId);
    const state = (useVisual ? visual?.state : '') || player?.state || 'off';
    const rawImage = (useVisual ? (visual?.attributes?.media_image_url || visual?.attributes?.entity_picture) : '')
      || player?.attributes?.media_image_url
      || player?.attributes?.entity_picture
      || '';
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
    const rawTitle = this._cleanText((useVisual ? visual?.attributes?.media_title : '') || player?.attributes?.media_title);
    const artist = this._cleanText((useVisual ? visual?.attributes?.media_artist : '') || player?.attributes?.media_artist);
    const album = this._cleanText((useVisual ? visual?.attributes?.media_album_name : '') || player?.attributes?.media_album_name);
    const appName = this._cleanText((useVisual ? visual?.attributes?.app_name : '') || player?.attributes?.app_name);
    const source = this._cleanText((useVisual ? visual?.attributes?.source : '') || player?.attributes?.source);
    const seriesTitle = this._cleanText((useVisual ? visual?.attributes?.media_series_title : '') || player?.attributes?.media_series_title);
    const channel = this._cleanText((useVisual ? visual?.attributes?.media_channel : '') || player?.attributes?.media_channel);
    const duration = Number((useVisual ? visual?.attributes?.media_duration : undefined) ?? player?.attributes?.media_duration ?? 0);
    let position = Number((useVisual ? visual?.attributes?.media_position : undefined) ?? player?.attributes?.media_position ?? 0);
    const volume = Number(player?.attributes?.volume_level ?? (useVisual ? visual?.attributes?.volume_level : undefined) ?? 0);
    const contentType = String(
      (useVisual ? visual?.attributes?.media_content_type : '')
      || player?.attributes?.media_content_type
      || player?.attributes?.app_name
      || ''
    ).toLowerCase();
    const isVideo = ['video', 'movie', 'tvshow', 'episode', 'channel'].some((item) => contentType.includes(item));
    const updatedAt = Date.parse((useVisual ? visual?.attributes?.media_position_updated_at : '') || player?.attributes?.media_position_updated_at || '');
    if (state === 'playing' && Number.isFinite(updatedAt) && Number.isFinite(position)) {
      position += Math.max(0, (Date.now() - updatedAt) / 1000);
    }
    if (Number.isFinite(duration) && duration > 0) position = Math.min(position, duration);
    const serviceName = this._mediaServiceName(focusId, config, contentType, appName, source);
    const targetAttributes = {
      ...(player?.attributes || {}),
      ...(useVisual ? (visual?.attributes || {}) : {}),
    };
    const spotifyTarget = serviceName === 'Spotify' ? this._spotifyRoomTarget(targetAttributes) : null;
    const effectiveConfig = spotifyTarget ? { ...config, ...spotifyTarget } : config;
    const roomName = this._mediaRoomName(effectiveConfig);
    const hasPlayback = this._hasPlayback(state, rawTitle, rawImage, appName, source, focusId, config, contentType, targetAttributes);
    const fallbackTitle = this._fallbackMediaTitle(serviceName, roomName, focusId);
    const liveTitle = hasPlayback
      ? this._firstText([rawTitle, appName, source, fallbackTitle, this._playerName(focusId)])
      : '';
    const liveSecondary = hasPlayback
      ? this._firstText([artist, album, seriesTitle, channel, appName, source, this._stateLabel(state)], [liveTitle])
      : '';
    const liveContext = hasPlayback ? [serviceName, roomName].filter(Boolean).join(' ') : '';
    const serviceIcon = config.icon || this._playerIcon(focusId);
    const path = effectiveConfig.path || effectiveConfig.navigation_path || '';
    const section = effectiveConfig.section || '';

    if (hasPlayback && ['playing', 'paused'].includes(String(state).toLowerCase())) {
      this._storeLastValidMedia({
        entity: focusId,
        image,
        title: liveTitle,
        artist: artist && artist !== 'Pronto para tocar' ? artist : '',
        secondary: liveSecondary,
        context: liveContext,
        serviceName,
        serviceIcon,
        path,
        section,
        savedAt: Date.now(),
      });
    }

    const tvPowered = focusId === BRUNO_MEDIA_TV_ENTITY && this._isActive(focusId);
    const persisted = hasPlayback
      ? null
      : (tvPowered ? (this._mediaHistory?.[focusId] || null) : (this._mediaHistory?.[focusId] || this._latestMediaSnapshot()));
    const displayImage = hasPlayback ? image : (image || persisted?.image || this._lastArtworkByPlayer?.[focusId] || '');
    const displayTitle = hasPlayback ? liveTitle : (persisted?.title || (tvPowered ? 'TV ligada' : ''));
    const displaySecondary = hasPlayback
      ? liveSecondary
      : (persisted?.secondary || persisted?.artist || (tvPowered ? this._firstText([appName, source, 'Sala']) : ''));
    const displayContext = hasPlayback ? liveContext : (persisted?.context || (tvPowered ? 'TV Sala' : ''));

    return {
      entity: hasPlayback ? focusId : (persisted?.entity || focusId),
      image: displayImage,
      title: displayTitle,
      artist: hasPlayback ? (artist && artist !== 'Pronto para tocar' ? artist : '') : (persisted?.artist || ''),
      secondary: displaySecondary,
      context: displayContext,
      statusLabel: hasPlayback ? (state === 'paused' ? 'Pausado' : (state === 'on' ? this._stateLabel(state) : 'Reproduzindo agora')) : 'Nenhuma m\u00eddia ativa',
      state,
      serviceName: hasPlayback ? serviceName : (persisted?.serviceName || serviceName),
      serviceIcon: hasPlayback ? serviceIcon : (persisted?.serviceIcon || serviceIcon),
      path: hasPlayback ? path : (persisted?.path || path),
      section: hasPlayback ? section : (persisted?.section || section),
      duration: Number.isFinite(duration) ? duration : 0,
      position: Number.isFinite(position) ? Math.max(0, position) : 0,
      volumePercent: Number.isFinite(volume) ? Math.max(0, Math.min(100, Math.round(volume * 100))) : 0,
      isVideo,
      isPlaying: state === 'playing',
      isActive: hasPlayback,
      hasPlayback,
      hasLastMedia: Boolean(persisted && (persisted.image || persisted.title)),
      isSoftArtwork: (state === 'paused' || !hasPlayback) && Boolean(displayImage),
    };
  }

  _slotPlayerIds(focusId = '', limit = 4) {
    const ids = [];
    const push = (entityId) => {
      if (!entityId || entityId === focusId || ids.includes(entityId) || !this._state(entityId)) return;
      ids.push(entityId);
    };

    const recent = Object.values(this._mediaHistory || {})
      .sort((left, right) => Number(right.savedAt || 0) - Number(left.savedAt || 0));
    recent.forEach((snapshot) => push(snapshot?.entity));

    this._allPlayerIds()
      .filter((entityId) => this._playbackPriority(entityId) > 0)
      .forEach(push);

    if (!ids.length) {
      (this._config.slots || []).forEach((slotId) => {
        const entityId = this._state(slotId)?.state;
        if (this._mediaHistory?.[entityId] || this._playbackPriority(entityId) > 0) push(entityId);
      });
    }
    return ids.slice(0, limit);
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
    this._localFocusEntity = entityId;
    this._localFocusAt = Date.now();
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

  _navigate(path) {
    if (!path) {
      this._moreInfo(this._config.focus_sensor);
      return;
    }
    const resolvedPath = this._resolveNavigationPath(path);
    const eventPath = path.startsWith('/') ? resolvedPath : path;
    globalThis.BrunoLiquidGlass?.routeTransition?.();
    this.dispatchEvent(new CustomEvent('hass-navigate', {
      detail: { path: eventPath },
      bubbles: true,
      composed: true,
    }));

    globalThis.setTimeout(() => {
      if (!resolvedPath || globalThis.location?.pathname === resolvedPath) return;
      globalThis.history?.pushState?.(null, '', resolvedPath);
      globalThis.dispatchEvent?.(new CustomEvent('location-changed', { detail: { replace: false } }));
    }, 80);
  }

  _resolveNavigationPath(path) {
    if (!path) return '';
    if (path.startsWith('/')) return path;
    const current = globalThis.location?.pathname || '';
    const dashboard = current.split('/').filter(Boolean)[0];
    return `/${dashboard || 'ngocjohn-main'}/${path}`;
  }

  _openShellSection(section) {
    if (!section) return false;
    globalThis.BrunoLiquidGlass?.routeTransition?.();
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: { action: 'fire-dom-event', bruno_section: section },
      bubbles: true,
      composed: true,
    }));
    return true;
  }

  _openMediaTarget(path, section) {
    if (section && this._openShellSection(section)) return;
    if (path) this._navigate(path);
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

  _openSpotifyPlusPopup() {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: {
        action: 'fire-dom-event',
        bruno_action: 'spotify',
        bruno_spotify_config: {
          entity: this._config.spotify_entity,
          deviceDefaultId: this._config.spotify_device_name,
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

  _cleanText(value) {
    const text = String(value ?? '').trim();
    if (!text) return '';
    const normalized = text.toLowerCase();
    if (['unknown', 'unavailable', 'none', 'null', 'undefined'].includes(normalized)) return '';
    if (['sistema de áudio', 'sistema de audio', 'pronto para tocar'].includes(normalized)) return '';
    return text;
  }

  _normalizeMediaDevice(value) {
    return String(value || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  _spotifyRoomTarget(attrs = {}) {
    const candidates = [
      attrs.source,
      attrs.source_name,
      attrs.device_name,
      attrs.active_device_name,
      attrs.spotify_device_name,
      attrs.media_player,
      attrs.media_player_name,
    ].map((value) => this._normalizeMediaDevice(value)).filter(Boolean);
    if (!candidates.length) return null;

    const targets = [
      { section: 'office', path: 'subview-office', room: 'office', aliases: ['echo pop office', 'office'] },
      { section: 'casal', path: 'subview-quarto-casal', room: 'q. casal', aliases: ['echo pop quarto casal', 'quarto casal'] },
      { section: 'marina', path: 'subview-quarto-marina', room: 'q. marina', aliases: ['echo pop marina', 'quarto marina'] },
      { section: 'sala', path: 'subview-sala', room: 'sala', aliases: ['echo show', 'sala'] },
    ];

    return targets.find((target) => candidates.some((candidate) => target.aliases.some((alias) => (
      candidate === alias
      || candidate.includes(alias)
      || (candidate.length >= 8 && alias.includes(candidate))
    )))) || null;
  }

  _firstText(values, excludes = []) {
    const blocked = excludes.map((item) => this._cleanText(item).toLowerCase()).filter(Boolean);
    for (const value of values) {
      const text = this._cleanText(value);
      if (!text) continue;
      if (blocked.includes(text.toLowerCase())) continue;
      return text;
    }
    return '';
  }

  _hasPlayback(state, title, image, appName, source, entityId = '', config = {}, contentType = '', attributes = {}) {
    const normalized = String(state || '').toLowerCase();
    const shellText = `${title || ''} ${appName || ''} ${source || ''}`.toLowerCase();
    const isShell = ['google tv launcher', 'android tv launcher', 'launcher', 'ambient mode', 'backdrop', 'home screen']
      .some((term) => shellText.includes(term));
    if (isShell) return false;
    if (['playing', 'paused'].includes(normalized)) return Boolean(this._cleanText(title) || image || this._cleanText(appName));
    if (normalized !== 'on') return false;
    const hasMediaTitle = Boolean(this._cleanText(title));
    const hasTimedMedia = Number(attributes?.media_duration) > 0 || Number(attributes?.media_position) > 0;
    const hasArtwork = Boolean(image && !this._isStandbyImage(image));
    return hasMediaTitle
      && (hasArtwork || hasTimedMedia || ['video', 'movie', 'episode', 'tvshow'].some((term) => String(contentType).includes(term)))
      && this._isVideoPlayer(entityId, config, contentType, appName, source);
  }

  _isVideoPlayer(entityId = '', config = {}, contentType = '', appName = '', source = '') {
    const haystack = `${entityId || ''} ${config.name || ''} ${config.icon || ''} ${contentType || ''} ${appName || ''} ${source || ''}`.toLowerCase();
    return ['tv', 'television', 'android_tv', 'video', 'movie', 'episode', 'netflix', 'youtube', 'prime'].some((item) => haystack.includes(item));
  }

  _fallbackMediaTitle(serviceName = '', roomName = '', entityId = '') {
    const service = this._cleanText(serviceName);
    const room = this._cleanText(roomName);
    if (service.toLowerCase() === 'tv' && room.toLowerCase() === 'sala') return 'TV da sala';
    if (service.toLowerCase() === 'tv' && room) return `TV ${room}`;
    if (service && room) return `${service} ${room}`;
    return this._playerName(entityId);
  }

  _mediaRoomName(config = {}) {
    const raw = this._cleanText(config.room || config.area || config.path || config.navigation_path);
    const text = raw.toLowerCase();
    if (text.includes('sala')) return 'sala';
    if (text.includes('office')) return 'office';
    if (text.includes('cozinha')) return 'cozinha';
    if (text.includes('casal')) return 'q. casal';
    if (text.includes('marina')) return 'q. marina';
    if (text.includes('miguel')) return 'q. miguel';
    return '';
  }

  _mediaServiceName(entityId, config = {}, contentType = '', appName = '', source = '') {
    const haystack = `${entityId || ''} ${config.name || ''} ${config.icon || ''} ${contentType || ''} ${appName || ''} ${source || ''}`.toLowerCase();
    if (haystack.includes('spotify') || haystack.includes('music')) return 'Spotify';
    if (haystack.includes('ps5') || haystack.includes('playstation')) return 'PS5';
    if (haystack.includes('tv') || haystack.includes('television') || haystack.includes('video') || haystack.includes('movie') || haystack.includes('episode') || haystack.includes('netflix') || haystack.includes('youtube') || haystack.includes('prime')) return 'TV';
    return this._cleanText(config.name) || 'Mídia';
  }

  _stateLabel(state) {
    const normalized = String(state || '').toLowerCase();
    if (normalized === 'playing') return 'Reproduzindo';
    if (normalized === 'paused') return 'Pausado';
    if (normalized === 'on') return 'Ligada';
    if (normalized === 'idle') return 'Ociosa';
    if (normalized === 'off') return 'Desligada';
    return state ? state.replace('_', ' ') : '';
  }

  _playerModel(entityId, focusId) {
    const entity = this._state(entityId);
    const state = String(entity?.state || 'off').toLowerCase();
    const attrs = entity?.attributes || {};
    const config = this._playerConfig(entityId);
    const rawImage = attrs.media_image_url || attrs.entity_picture || '';
    const image = this._isStandbyImage(rawImage) ? '' : rawImage;
    const contentType = String(attrs.media_content_type || attrs.app_name || '').toLowerCase();
    const active = this._hasPlayback(state, attrs.media_title, image, attrs.app_name, attrs.source, entityId, config, contentType, attrs);
    const history = this._mediaHistory?.[entityId];
    const title = active
      ? (this._cleanText(attrs.media_title) || this._playerName(entityId))
      : (history?.title || this._playerName(entityId));
    const subtitle = active
      ? (this._cleanText(attrs.media_artist) || this._stateLabel(state))
      : (history?.secondary || history?.context || 'Ultima reproducao');

    return {
      entity: entityId,
      image: active ? image : (history?.image || ''),
      name: this._playerName(entityId),
      title,
      subtitle,
      state,
      icon: this._playerIcon(entityId),
      active,
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

    this.shadowRoot.querySelectorAll('[data-navigate-path]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._navigate(button.dataset.navigatePath);
      });
    });

    this.shadowRoot.querySelector('[data-action="media-route-menu"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._mediaMenuOpen = !this._mediaMenuOpen;
      this._render();
    });

    this.shadowRoot.querySelector('[data-action="open-media-subview"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._mediaMenuOpen = false;
      this._openMediaTarget(
        event.currentTarget.dataset.mediaPath || event.currentTarget.dataset.navigatePath || '',
        event.currentTarget.dataset.mediaSection || ''
      );
    });

    this.shadowRoot.querySelector('[data-action="choose-media"]')?.addEventListener('click', (event) => {
      event.preventDefault();
      event.stopPropagation();
      this._openSpotifyPlusPopup();
    });

    this.shadowRoot.querySelector('.wide-art img')?.addEventListener('error', (event) => {
      event.currentTarget.remove();
      this.shadowRoot.querySelector('.wide-art')?.classList.remove('has-art');
    }, { once: true });

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

      if (this._config.variant !== 'wide' && this._slideIndex === 0) {
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
      if (this._config.variant !== 'wide' && this._slideIndex === 0) this._runScript('play_pause');
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
      if (this._config.variant === 'wide') return;
      this._runScript('play_pause');
    });

    focusSurface?.addEventListener('contextmenu', (event) => {
      event.preventDefault();
      if (this._config.variant === 'wide') return;
      this._moreInfo(this._config.focus_sensor);
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const focus = this._focusModel();
    const focusImage = focus.image ? `--focus-art: url('${BrunoMediaCard._escapeAttr(BrunoMediaCard._cssUrl(focus.image))}');` : '';
    const focusSoftClass = focus.isSoftArtwork ? ' is-soft-artwork' : '';
    const focusEmptyClass = focus.image ? '' : ' is-empty-artwork';
    const focusPausedClass = focus.state === 'paused' ? ' is-paused-media' : '';
    const focusInactiveClass = focus.hasPlayback ? '' : ' is-inactive-media';
    const isWide = this._config.variant === 'wide';
    const players = this._slotPlayerIds(focus.entity, isWide ? 2 : 4).map((id) => this._playerModel(id, focus.entity));
    const slideIndex = players.length ? (this._slideIndex || 0) : 0;
    if (!players.length && this._slideIndex) this._slideIndex = 0;
    const wideClass = isWide ? ' is-wide' : '';
    const focusSurfaceAttrs = isWide
      ? 'aria-label="Resumo de mídia"'
      : 'role="button" tabindex="0" aria-label="Reproduzir ou pausar midia"';
    const progress = focus.hasPlayback && focus.duration > 0
      ? Math.max(0, Math.min(100, (focus.position / focus.duration) * 100))
      : 0;
    const artwork = focus.image ? BrunoMediaCard._escapeAttr(focus.image) : '';
    const canOpenMedia = focus.hasPlayback && Boolean(focus.section || focus.path);
    const mediaMenu = isWide && this._mediaMenuOpen ? `
      <div class="mh-overflow-panel media-action-panel" role="menu" aria-label="Opções de mídia">
        <button
          class="media-action-option${canOpenMedia ? '' : ' is-disabled'}"
          type="button"
          role="menuitem"
          ${canOpenMedia ? 'data-action="open-media-subview"' : ''}
          data-media-path="${BrunoMediaCard._escapeAttr(focus.path || '')}"
          data-media-section="${BrunoMediaCard._escapeAttr(focus.section || '')}"
          ${canOpenMedia ? '' : 'disabled'}
        >
          ${canOpenMedia ? 'Abrir' : 'Offline'}
        </button>
      </div>
    ` : '';
    const focusContent = isWide
      ? `
        <div class="wide-focus">
          <div class="media-headline">
            <span class="headline-left">
              <span class="header-icon" aria-hidden="true"><bruno-icon icon="mdi:music-note"></bruno-icon></span>
              <span class="title">
                <span class="title-main">Mídia</span>
              </span>
            </span>
            <button
              class="mh-menu${this._mediaMenuOpen ? ' is-active' : ''}"
              type="button"
              data-action="media-route-menu"
              aria-label="Abrir mídia"
              aria-expanded="${this._mediaMenuOpen ? 'true' : 'false'}"
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </div>
          <div class="wide-copy">
            ${focus.hasPlayback || focus.hasLastMedia ? `
              <strong class="wide-primary">${BrunoMediaCard._escape(focus.title)}</strong>
              <span class="wide-secondary">${BrunoMediaCard._escape(focus.secondary)}</span>
              <span class="wide-context">${BrunoMediaCard._escape(focus.context)}</span>
            ` : ''}
          </div>
          <div
            class="wide-art${artwork ? ' has-art' : ''}"
            aria-hidden="true"
          >
            ${artwork ? `<img src="${artwork}" alt="">` : `<bruno-icon icon="${BrunoMediaCard._escapeAttr(focus.serviceIcon || 'mdi:music-note')}"></bruno-icon>`}
          </div>
          ${focus.hasPlayback ? `
            <div class="wide-progress" style="--media-progress:${progress.toFixed(2)}%;">
              <span class="status-label"><i aria-hidden="true"></i>${BrunoMediaCard._escape(focus.statusLabel)}</span>
              <span class="progress-track"><span></span></span>
            </div>
          ` : `
            <div class="wide-progress is-inactive">
              <span class="status-label is-muted"><i aria-hidden="true"></i>${BrunoMediaCard._escape(focus.statusLabel)}</span>
              <button class="choose-media" type="button" data-action="choose-media">Escolher m\u00eddia</button>
            </div>
          `}
          ${mediaMenu}
        </div>
      `
      : `
        <span class="play-glyph" aria-hidden="true"><bruno-icon icon="${focus.isPlaying ? 'mdi:pause' : 'mdi:play'}"></bruno-icon></span>
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
      `;

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
            linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)),
            rgba(9,11,15,0.105)
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.090),
            0 10px 28px rgba(0,0,0,0.145)
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
            linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10);
        }

        .media-card::after {
          inset: 0;
          z-index: 4;
          padding: 1px;
          background: var(--bruno-liquid-surface-edge-glow,
            linear-gradient(125deg, rgba(255,255,255,0.11), rgba(255,255,255,0.026) 38%, rgba(255,255,255,0.010) 100%)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: 0.70;
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

        .play-glyph bruno-icon {
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

        .control bruno-icon {
          --mdc-icon-size: 17px;
        }

        .control.play bruno-icon {
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

        .player-icon bruno-icon {
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

        .media-card.is-wide {
          place-items: stretch;
          padding: 0;
        }

        .media-card.is-wide .media-shell {
          width: 100%;
          height: 100%;
          aspect-ratio: auto;
          border-radius: calc(var(--card-radius) - 6px);
          box-shadow: none;
        }

        .media-card.is-wide .viewport {
          border: 0;
          background: transparent;
        }

        .media-card.is-wide .focus-surface {
          grid-template-rows: minmax(0, 1fr);
          background: transparent;
        }

        .media-card.is-wide .focus-surface::before {
          opacity: 0;
        }

        .media-card.is-wide .focus-surface::after {
          opacity: 0;
        }

        .wide-focus {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(148px, 44%);
          grid-template-rows: 44px minmax(0, 1fr) auto;
          grid-template-areas:
            "head head"
            "copy art"
            "progress art";
          gap: 4px 18px;
          padding: 0 10px 10px 14px;
        }

        .wide-copy {
          grid-area: copy;
          min-width: 0;
          align-self: center;
          display: grid;
          gap: 5px;
        }

        .media-headline {
          grid-area: head;
          height: 44px;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          align-self: start;
          gap: 8px;
        }

        .headline-left {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
          background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.10);
          border: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .header-icon bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .title-main {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,0.92);
          font-size: 13px;
          line-height: 1.05;
          font-weight: 800;
        }

        .mh-menu {
          appearance: none;
          -webkit-appearance: none;
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 9px;
          color: rgba(255,255,255,0.54);
          background: transparent;
          outline: none;
        }

        .mh-menu bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
        }

        .mh-menu:hover,
        .mh-menu.is-active {
          color: rgba(255,255,255,0.88);
          background: rgba(255,255,255,0.072);
        }

        .mh-overflow-panel {
          position: absolute;
          top: 42px;
          right: 10px;
          z-index: 8;
          width: min(142px, calc(100% - 20px));
          display: grid;
          gap: 4px;
          padding: 7px;
          border-radius: var(--bruno-liquid-cell-radius, 13px);
          background: var(--bruno-liquid-popup-background,
            linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
          );
          border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
          box-shadow: var(--bruno-liquid-popup-shadow,
            inset 0 1px 0 rgba(255,255,255,0.100),
            0 18px 36px rgba(0,0,0,0.300)
          );
          backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
          -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
        }

        .media-action-option {
          appearance: none;
          -webkit-appearance: none;
          min-height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border: 0;
          border-radius: 9px;
          color: rgba(255,255,255,0.86);
          background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
          font-size: 11px;
          line-height: 1;
          font-weight: 780;
          text-align: center;
        }

        .media-action-option:hover {
          color: rgba(255,255,255,0.98);
          background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
        }

        .media-action-option:disabled {
          pointer-events: none;
          color: rgba(255,255,255,0.34);
        }

        .wide-primary,
        .wide-secondary,
        .wide-context {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 2px 10px rgba(0,0,0,0.36);
        }

        .wide-primary {
          color: rgba(255,255,255,0.96);
          font-size: clamp(15px, 2.05vh, 19px);
          line-height: 1.05;
          font-weight: 760;
        }

        .wide-secondary {
          color: rgba(255,255,255,0.68);
          font-size: 12px;
          line-height: 1.1;
          font-weight: 620;
        }

        .wide-context {
          color: rgba(255,255,255,0.56);
          font-size: 11px;
          line-height: 1.1;
          font-weight: 680;
        }

        .wide-art {
          grid-area: art;
          align-self: end;
          justify-self: end;
          position: relative;
          width: min(100%, 180px);
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          margin: 0 0 4px;
          padding: 0;
          overflow: hidden;
          border-radius: 18px;
          color: rgba(255,255,255,0.50);
          background:
            linear-gradient(145deg, rgba(255,255,255,0.052), rgba(255,255,255,0.016) 46%, rgba(0,0,0,0.110)),
            rgba(12,13,15,0.135);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 24px rgba(0,0,0,0.18);
        }

        .wide-art:not(.has-art) {
          background:
            radial-gradient(90% 72% at 68% 24%, rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.150), transparent 62%),
            radial-gradient(78% 72% at 20% 82%, rgba(160,178,190,0.080), transparent 64%),
            linear-gradient(145deg, rgba(255,255,255,0.070), rgba(255,255,255,0.018) 45%, rgba(0,0,0,0.155)),
            rgba(14,13,13,0.185);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.105),
            inset 0 -22px 48px rgba(0,0,0,0.105),
            0 12px 24px rgba(0,0,0,0.16);
        }

        .wide-art::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.120), transparent 34%),
            linear-gradient(315deg, transparent 58%, rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.055));
          opacity: 0;
          pointer-events: none;
        }

        .wide-art:not(.has-art)::before {
          opacity: 0.44;
        }

        .wide-art img {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .focus-surface.is-paused-media .wide-art.has-art img {
          filter: blur(2.8px) brightness(0.78) saturate(0.90);
          transform: scale(1.035);
        }

        .focus-surface.is-inactive-media .wide-art.has-art img {
          filter: blur(3.2px) brightness(0.72) saturate(0.46);
          transform: scale(1.04);
        }

        .wide-art bruno-icon {
          position: relative;
          z-index: 1;
          --mdc-icon-size: 44px;
          color: rgba(255,255,255,0.46);
          filter: drop-shadow(0 6px 18px rgba(0,0,0,0.32));
        }

        .wide-art:not(.has-art) bruno-icon {
          display: none;
        }

        .wide-progress {
          grid-area: progress;
          display: grid;
          gap: 8px;
          align-self: end;
        }

        .wide-progress.is-inactive {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: auto auto;
          justify-items: start;
          align-items: end;
          gap: 5px;
        }

        .wide-progress.is-inactive .status-label {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .choose-media {
          appearance: none;
          -webkit-appearance: none;
          min-height: 28px;
          padding: 0 10px;
          border-radius: var(--bruno-liquid-control-radius, 10px);
          color: rgba(255,255,255,0.82);
          background: var(--bruno-liquid-control-background, rgba(255,255,255,0.040));
          border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.090));
          box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          white-space: nowrap;
        }

        .choose-media:hover,
        .choose-media:focus-visible {
          color: rgba(255,255,255,0.96);
          background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
          outline: none;
        }

        .status-label {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.94);
          font-size: 12px;
          line-height: 1;
          font-weight: 680;
          white-space: nowrap;
        }

        .status-label i {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 999px;
          background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.96);
          box-shadow: 0 0 12px rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.28);
        }

        .status-label.is-muted {
          color: rgba(255,255,255,0.46);
        }

        .status-label.is-muted i {
          background: rgba(255,255,255,0.28);
          box-shadow: none;
        }

        .progress-track {
          position: relative;
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,0.13);
        }

        .progress-track span {
          position: absolute;
          inset: 0 auto 0 0;
          border-radius: inherit;
          background: rgba(246,190,92,0.96);
          box-shadow: 0 0 18px rgba(246,190,92,0.26);
        }

        .progress-track span {
          width: var(--media-progress, 0%);
        }

        .media-card.is-wide .player-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: minmax(0, 1fr);
          gap: 10px;
          padding: 9px;
          background: transparent;
        }

        .media-card.is-wide .player-card {
          grid-template-rows: minmax(0, 1fr) auto;
          border-radius: var(--bruno-liquid-card-radius-compact, 16px);
          background: var(--bruno-liquid-cell-background,
            linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006)),
            rgba(9,11,15,0.030)
          );
          border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.050));
          box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.040));
        }

        .media-card.is-wide .player-card.has-art {
          background:
            linear-gradient(180deg, rgba(7,10,18,0.02), rgba(7,10,18,0.48)),
            var(--player-art) center / cover no-repeat,
            var(--bruno-liquid-cell-background, rgba(255,255,255,0.010));
        }

        .media-card.is-wide .pagination {
          bottom: 7px;
        }

        @media (max-height: 760px) {
          .media-card { padding: 10px; }
          .focus-bottom { padding: 15px 10px 13px; gap: 5px; }
          .control { height: 25px; }
          .player-grid { gap: 7px; padding: 7px; }

          .media-card.is-wide .focus-bottom {
            gap: 10px;
            padding: 28px 12px 11px;
          }

          .media-card.is-wide .wide-focus {
            gap: 7px 14px;
            padding: 2px 0;
          }

          .media-card.is-wide .wide-art {
            width: min(100%, 148px);
            border-radius: 16px;
          }

          .media-card.is-wide .wide-primary {
            font-size: clamp(14px, 2vh, 18px);
          }

          .media-card.is-wide .player-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: minmax(0, 1fr);
          }
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

      <div class="media-card${wideClass}">
        <div class="media-shell" style="--slide-index:${slideIndex};">
          <div class="viewport">
            <div class="slides">
              <section class="slide focus-slide">
                <div class="focus-surface${focusSoftClass}${focusEmptyClass}${focusPausedClass}${focusInactiveClass}" ${focusSurfaceAttrs} style="${focusImage}">
                  ${focusContent}
                </div>
              </section>

              ${players.length ? `
                <section class="slide players-slide">
                  <div class="player-grid" aria-label="Players recentes">
                    ${players.map((player) => this._playerButton(player)).join('')}
                  </div>
                </section>
              ` : ''}
            </div>
          </div>

          <div class="pagination" aria-label="Slides de midia">
            <button class="dot${slideIndex === 0 ? ' is-active' : ''}" type="button" data-slide-index="0" aria-label="Slide principal"></button>
            ${players.length ? `<button class="dot${slideIndex === 1 ? ' is-active' : ''}" type="button" data-slide-index="1" aria-label="Players recentes"></button>` : ''}
          </div>
        </div>
      </div>
    `;

    this._wireActions();
  }

  _control(key, icon, label, extraClass = '') {
    return `
      <button class="control ${extraClass}" type="button" data-script-key="${key}" aria-label="${BrunoMediaCard._escapeAttr(label)}">
        <bruno-icon icon="${icon}"></bruno-icon>
      </button>
    `;
  }

  _playerButton(player) {
    const selected = player.selected ? ' is-selected' : '';
    const active = player.active ? ' is-active' : '';
    const art = player.image ? ' has-art' : '';
    const style = player.image ? ` style="--player-art: url('${BrunoMediaCard._escapeAttr(BrunoMediaCard._cssUrl(player.image))}');"` : '';
    return `
      <button class="player-card${selected}${active}${art}" type="button" data-player-id="${BrunoMediaCard._escapeAttr(player.entity)}"${style} aria-label="${BrunoMediaCard._escapeAttr(player.name)}">
        <span class="player-icon" aria-hidden="true"><bruno-icon icon="${BrunoMediaCard._escapeAttr(player.icon)}"></bruno-icon></span>
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

  static _cssUrl(value) {
    return String(value || '')
      .replace(/\\/g, '\\\\')
      .replace(/'/g, "\\'")
      .replace(/\)/g, '\\)')
      .replace(/[\r\n]/g, '');
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
