#!/usr/bin/env python3
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
ANDROID = 'media_player.android_tv_192_168_3_17'
POWER = 'media_player.smart_tv_pro_2'
REMOTE = 'remote.smart_tv_pro'
ROLLBACK = ROOT / '_rollback' / '20260820-pre-physical-round3'


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, value: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(value, encoding='utf-8')


def replace_required(source: str, old: str, new: str, label: str, *, all_occurrences: bool = False) -> str:
    if new in source and old not in source:
        return source
    if old not in source:
        raise SystemExit(f'MARKER NOT FOUND: {label}')
    return source.replace(old, new) if all_occurrences else source.replace(old, new, 1)


def backup(path: str) -> None:
    src = ROOT / path
    if not src.exists():
        return
    dst = ROLLBACK / path
    if dst.exists():
        if dst.is_dir():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    dst.parent.mkdir(parents=True, exist_ok=True)
    if src.is_dir():
        shutil.copytree(src, dst)
    else:
        shutil.copy2(src, dst)


for item in [
    'config/configuration.yaml',
    'config/packages/active_player.yaml',
    'config/www/dashboard',
    'config/www/bruno-ui/cards/bruno-media-card.js',
    'dashboard-src/src/components/rooms/bruno-room-subview.ts',
]:
    backup(item)

p = 'config/www/bruno-ui/cards/bruno-media-card.js'
s = read(p)
marker = "const BRUNO_MEDIA_TV_POWER_STATES = new Set(['on', 'playing', 'paused', 'idle', 'buffering']);"
if "const BRUNO_MEDIA_HYBRID_RUNTIME = 'round3';" not in s:
    s = replace_required(s, marker, marker + "\nconst BRUNO_MEDIA_HYBRID_RUNTIME = 'round3';", 'round3 media marker')
s = replace_required(s,"""  _isActive(entityId) {
    const state = String(this._state(entityId)?.state || '').toLowerCase();
    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      const powerState = String(this._state(BRUNO_MEDIA_TV_POWER_ENTITY)?.state || '').toLowerCase();
      return BRUNO_MEDIA_TV_POWER_STATES.has(powerState);
    }
    return BRUNO_MEDIA_ACTIVE_STATES.includes(state);
  }
""","""  _tvPowered() {
    const powerState = String(this._state(BRUNO_MEDIA_TV_POWER_ENTITY)?.state || '').toLowerCase();
    return BRUNO_MEDIA_TV_POWER_STATES.has(powerState);
  }

  _isActive(entityId) {
    const state = String(this._state(entityId)?.state || '').toLowerCase();
    if (entityId === BRUNO_MEDIA_TV_ENTITY) return this._tvPowered();
    return BRUNO_MEDIA_ACTIVE_STATES.includes(state);
  }
""",'media card helper tvPowered')
s = replace_required(s,"""    if (this._mediaHistory === undefined) this._mediaHistory = this._readMediaHistory();
    this._lastValidMedia = this._latestMediaSnapshot();
    this._safeRender();
""","""    if (this._mediaHistory === undefined) this._mediaHistory = this._readMediaHistory();
    this._lastArtworkByPlayer = this._lastArtworkByPlayer || {};
    const rememberedTv = this._mediaHistory?.[BRUNO_MEDIA_TV_ENTITY];
    if (!this._lastArtworkByPlayer[BRUNO_MEDIA_TV_ENTITY] && rememberedTv?.image) {
      this._lastArtworkByPlayer[BRUNO_MEDIA_TV_ENTITY] = rememberedTv.image;
    }
    this._lastValidMedia = this._latestMediaSnapshot();
    this._safeRender();
""",'seed persistent TV artwork')
s = replace_required(s,"""  _playbackPriority(entityId) {
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
""","""  _playbackPriority(entityId) {
    const entity = this._state(entityId);
    const state = String(entity?.state || '').toLowerCase();
    const config = this._playerConfig(entityId);
    const attrs = entity?.attributes || {};
    const contentType = String(attrs.media_content_type || attrs.app_name || '').toLowerCase();
    const rawImage = attrs.media_image_url || attrs.entity_picture || '';
    const image = this._isStandbyImage(rawImage) ? '' : rawImage;

    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      if (!this._tvPowered()) return 0;
      if (state === 'playing') return 4;
      if (state === 'buffering') return 3;
      if (state === 'paused') return 2;
      return this._hasPlayback(state, this._cleanText(attrs.media_title), image, attrs.app_name, attrs.source, entityId, config, contentType, attrs) ? 3 : 1;
    }
    if (state === 'playing') return 4;
    if (state === 'paused') return 2;
    return this._hasPlayback(state, this._cleanText(attrs.media_title), image, attrs.app_name, attrs.source, entityId, config, contentType, attrs) ? 3 : 0;
  }
""",'media card playback priority hybrid')
s = replace_required(s,"""  _hasPlayback(state, title, image, appName, source, entityId = '', config = {}, contentType = '', attributes = {}) {
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
""","""  _hasPlayback(state, title, image, appName, source, entityId = '', config = {}, contentType = '', attributes = {}) {
    const normalized = String(state || '').toLowerCase();
    const shellText = `${title || ''} ${appName || ''} ${source || ''}`.toLowerCase();
    const isShell = ['google tv launcher', 'android tv launcher', 'launcher', 'ambient mode', 'backdrop', 'home screen', 'android settings']
      .some((term) => shellText.includes(term));
    if (isShell) return false;
    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      if (!this._tvPowered()) return false;
      const hasArtwork = Boolean(image && !this._isStandbyImage(image));
      const hasTimedMedia = Number(attributes?.media_duration) > 0 || Number(attributes?.media_position) > 0;
      const meaningfulText = [title, appName, source].map((value) => this._cleanText(value)).filter(Boolean)
        .some((value) => !/^(?:tv|android tv|smart tv pro|hdmi\s*\d+)$/i.test(value));
      if (!(hasArtwork || hasTimedMedia || meaningfulText)) return false;
      if (['playing', 'paused', 'buffering'].includes(normalized)) return true;
      return this._isVideoPlayer(entityId, config, contentType, appName, source);
    }
    if (['playing', 'paused'].includes(normalized)) return Boolean(this._cleanText(title) || image || this._cleanText(appName));
    if (normalized !== 'on') return false;
    const hasMediaTitle = Boolean(this._cleanText(title));
    const hasTimedMedia = Number(attributes?.media_duration) > 0 || Number(attributes?.media_position) > 0;
    const hasArtwork = Boolean(image && !this._isStandbyImage(image));
    return hasMediaTitle && (hasArtwork || hasTimedMedia || ['video', 'movie', 'episode', 'tvshow'].some((term) => String(contentType).includes(term)))
      && this._isVideoPlayer(entityId, config, contentType, appName, source);
  }
""",'media card playback semantics for hybrid TV')
s = replace_required(s,"    const shouldKeepArtwork = ['paused', 'idle'].includes(state) && this._lastArtworkByPlayer[focusId];\n","""    const shouldKeepArtwork = (
      ['paused', 'idle'].includes(state)
      || (focusId === BRUNO_MEDIA_TV_ENTITY && this._tvPowered())
    ) && this._lastArtworkByPlayer[focusId];
""",'keep TV artwork across ADB off/idle')
if 'BRUNO_MEDIA_TV_OFF_GRACE_MS' in s:
    raise SystemExit('stale BRUNO_MEDIA_TV_OFF_GRACE_MS reference remains')
write(p, s)

p = 'dashboard-src/src/components/rooms/bruno-room-subview.ts'
s = read(p)
s = replace_required(s,"const IMAGEM_PC = '/local/images/office_pc.png?v=20260702-all-images-1';","const IMAGEM_PC = '/local/images/office_pc.png?v=20260702-all-images-1';\nconst TV_HUB_HISTORY_KEY = 'bruno-ui:tv-hub-history:v1';",'TV hub history key')
s = replace_required(s,"  private _tvUltimoTitulo = '';\n  private _menuMidiaAberto = false;\n","  private _tvUltimoTitulo = '';\n  private _tvHistoricoCarregado = false;\n  private _menuMidiaAberto = false;\n",'TV hub history field')
if 'private _carregarHistoricoTv()' not in s:
    helper = """  private _carregarHistoricoTv(): void {
    if (this._tvHistoricoCarregado) return;
    this._tvHistoricoCarregado = true;
    try {
      const raw = globalThis.localStorage?.getItem(TV_HUB_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const fonte = String(parsed['fonte'] ?? '').trim();
      const titulo = String(parsed['titulo'] ?? '').trim();
      const poster = String(parsed['poster'] ?? '').trim();
      const volume = Number(parsed['volume']);
      if (fonte) this._tvUltimaFonte = fonte;
      if (titulo) this._tvUltimoTitulo = titulo;
      if (poster) this._tvUltimoPoster = poster;
      if (Number.isFinite(volume)) this._tvUltimoVolume = volume;
    } catch (_error) {}
  }

  private _salvarHistoricoTv(): void {
    if (!this._tvUltimoPoster && !this._tvUltimoTitulo) return;
    try {
      globalThis.localStorage?.setItem(TV_HUB_HISTORY_KEY, JSON.stringify({ fonte: this._tvUltimaFonte, titulo: this._tvUltimoTitulo, poster: this._tvUltimoPoster, volume: this._tvUltimoVolume, savedAt: Date.now() }));
    } catch (_error) {}
  }

"""
    s = s.replace('  private _modeloTv() {', helper + '  private _modeloTv() {', 1)
s = replace_required(s,'  private _modeloTv() {\n    const powerId = this._idDe(\'tv\');\n','  private _modeloTv() {\n    this._carregarHistoricoTv();\n    const powerId = this._idDe(\'tv\');\n','load TV hub history')
s = replace_required(s,"    const posterAtual = String(ma['entity_picture'] ?? ma['media_image_url'] ?? '').trim();\n","    const posterAtual = String(ma['entity_picture'] ?? ma['media_image_url'] ?? ma['entity_picture_local'] ?? '').trim();\n",'hub artwork candidates')
s = replace_required(s,"""    if (ativo) {
      if (fonteAtual) this._tvUltimaFonte = fonteAtual;
      if (tituloAtual) this._tvUltimoTitulo = tituloAtual;
      if (posterAtual) this._tvUltimoPoster = posterAtual;
      if (volumeAtual != null) this._tvUltimoVolume = volumeAtual;
    } else {
      this._tvUltimoPoster = '';
      this._tvUltimoTitulo = '';
      this._tvUltimoVolume = null;
    }
""","""    if (ativo) {
      if (fonteAtual && this._tvUltimaFonte && fonteAtual !== this._tvUltimaFonte) {
        this._tvUltimoPoster = '';
        this._tvUltimoTitulo = '';
      }
      if (fonteAtual) this._tvUltimaFonte = fonteAtual;
      if (tituloAtual) this._tvUltimoTitulo = tituloAtual;
      if (posterAtual) this._tvUltimoPoster = posterAtual;
      if (volumeAtual != null) this._tvUltimoVolume = volumeAtual;
      this._salvarHistoricoTv();
    }
""",'persist TV hub metadata while powered')
s = replace_required(s,'        <div class="mh-controls">${this._linhaVolume(id, tv.volume ?? 60)} ${fileira}</div>','        <div class="mh-controls">${this._linhaVolume(mediaId, tv.volume ?? 60)} ${fileira}</div>','hub absolute volume uses ADB entity')
s = replace_required(s,"""    const remoto = this._idDe('tvRemote');
    if (!remoto) return;
    const apertar = (entityId: string) => ({
      action: 'perform-action',
      perform_action: 'button.press',
      target: { entity_id: entityId },
    });
    const tecla = (nome: string, icone: string, entityId: string) => ({
      type: 'button',
      name: nome,
      icon: icone,
      tap_action: apertar(entityId),
    });
""","""    const remoto = this._idDe('tvRemote');
    if (!remoto) return;
    const mediaId = this._idDe('tvMedia') ?? this._idDe('tv');
    const comando = (command: string) => ({ action: 'perform-action', perform_action: 'remote.send_command', target: { entity_id: remoto }, data: { command } });
    const tecla = (nome: string, icone: string, command: string) => ({ type: 'button', name: nome, icon: icone, tap_action: comando(command) });
""",'remote actions use remote.send_command')
remote_replacements = {
"tecla('power', 'mdi:power', 'button.tv_sala_power')":"tecla('power', 'mdi:power', 'POWER')",
"tecla('input', 'mdi:import', 'button.tv_sala_input')":"tecla('input', 'mdi:import', 'TV')",
"tecla('menu', 'mdi:menu', 'button.tv_sala_menu')":"tecla('menu', 'mdi:menu', 'MENU')",
"tap_action: apertar('button.tv_sala_ok')":"tap_action: comando('DPAD_CENTER')",
"tap_action: apertar('button.tv_sala_navigate_up')":"tap_action: comando('DPAD_UP')",
"tap_action: apertar('button.tv_sala_navigate_down')":"tap_action: comando('DPAD_DOWN')",
"tap_action: apertar('button.tv_sala_navigate_left')":"tap_action: comando('DPAD_LEFT')",
"tap_action: apertar('button.tv_sala_navigate_right')":"tap_action: comando('DPAD_RIGHT')",
"tecla('back', 'mdi:keyboard-backspace', 'button.tv_sala_back')":"tecla('back', 'mdi:keyboard-backspace', 'BACK')",
"tecla('home', 'mdi:home', 'button.tv_sala_homepage')":"tecla('home', 'mdi:home', 'HOME')",
"tecla('mute', 'mdi:volume-mute', 'button.tv_sala_mute')":"tecla('mute', 'mdi:volume-mute', 'MUTE')",
"tecla('volume_down', 'mdi:volume-minus', 'button.tv_sala_volume_down')":"tecla('volume_down', 'mdi:volume-minus', 'VOLUME_DOWN')",
"tecla('volume_up', 'mdi:volume-plus', 'button.tv_sala_volume_up')":"tecla('volume_up', 'mdi:volume-plus', 'VOLUME_UP')",
"tecla('channel_down', 'mdi:chevron-down', 'button.tv_sala_channel_down')":"tecla('channel_down', 'mdi:chevron-down', 'CHANNEL_DOWN')",
"tecla('channel_up', 'mdi:chevron-up', 'button.tv_sala_channel_up')":"tecla('channel_up', 'mdi:chevron-up', 'CHANNEL_UP')"}
for old,new in remote_replacements.items(): s = replace_required(s,old,new,f'remote mapping {old}')
s = replace_required(s,"                media_player_id: this._idDe('tv'),",'                media_player_id: mediaId,','remote popup media entity')
if 'button.tv_sala_' in s: raise SystemExit('legacy TV remote button entities still active')
write(p,s)

p='config/packages/active_player.yaml'; s=read(p)
smart_expr=f"{{{{ '{POWER}' if player == '{ANDROID}' else player }}}}"
s=replace_required(s,smart_expr,'{{ player }}','volume down back to ADB'); s=replace_required(s,smart_expr,'{{ player }}','volume up back to ADB')
smart_mute=f"volume_player: \"{{{{ '{POWER}' if focused_player == '{ANDROID}' else focused_player }}}}\""
s=replace_required(s,smart_mute,'volume_player: "{{ focused_player }}"','mute back to ADB'); write(p,s)
print('physical round3 fixes applied')
