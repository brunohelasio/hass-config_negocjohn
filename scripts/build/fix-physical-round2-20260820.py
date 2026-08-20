#!/usr/bin/env python3
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
ANDROID = 'media_player.android_tv_192_168_3_17'
POWER = 'media_player.smart_tv_pro_2'
REMOTE = 'remote.smart_tv_pro'
ROLLBACK = ROOT / '_rollback' / '20260820-pre-physical-round2'


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, value: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(value, encoding='utf-8')


def replace_required(source: str, old: str, new: str, label: str, *, all_occurrences=False) -> str:
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
    if src.is_dir():
        if dst.exists():
            shutil.rmtree(dst)
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copytree(src, dst)
    else:
        dst.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dst)


# ---------------------------------------------------------------------------
# Rollback físico da candidata que acabou de ser testada.
# ---------------------------------------------------------------------------
for item in [
    'config/configuration.yaml',
    'config/dashboards/ui-lovelace-main.yaml',
    'config/dashboards/shared/grid-cards/bento_comodos_matriz.yaml',
    'config/packages/active_player.yaml',
    'config/packages/home_activity.yaml',
    'config/packages/sala_tv_controls.yaml',
    'config/www/dashboard',
    'dashboard-src/src/config/subviews.config.ts',
    'dashboard-src/src/config/rooms.config.ts',
    'dashboard-src/src/components/rooms/bruno-room-subview.ts',
    'dashboard-src/src/components/rooms/bruno-room-tile.ts',
    'config/www/bruno-ui/cards/bruno-sala-card.js',
    'config/www/bruno-ui/cards/bruno-media-card.js',
    'config/www/bruno-ui/core/bruno-shell.js',
]:
    backup(item)

# ---------------------------------------------------------------------------
# TV: energia/volume/power = Android TV Remote estável; mídia/arte = Android ADB.
# O ADB permanece SOMENTE onde sua riqueza de metadata/artwork é necessária.
# ---------------------------------------------------------------------------
p = 'dashboard-src/src/config/subviews.config.ts'
s = read(p)
s = replace_required(
    s,
    "      // TV: Android TV é a fonte única de estado, mídia e artwork; remote.atv é o controle remoto.\n"
    f"      tv: '{ANDROID}',\n"
    f"      tvMedia: '{ANDROID}',\n"
    "      tvRemote: 'remote.atv',",
    "      // TV híbrida: power/volume pela Android TV Remote estável; metadata/artwork pela ADB.\n"
    f"      tv: '{POWER}',\n"
    f"      tvMedia: '{ANDROID}',\n"
    f"      tvRemote: '{REMOTE}',",
    'subviews TV híbrida',
)
write(p, s)

p = 'dashboard-src/src/config/rooms.config.ts'
s = read(p)
s = replace_required(
    s,
    f"        entities: ['{ANDROID}'],\n        states: TV_POWER_ON_STATES }},",
    f"        entities: ['{POWER}'],\n        states: TV_POWER_ON_STATES }},",
    'dot TV Sala usa power estável',
)
write(p, s)

p = 'config/www/bruno-ui/cards/bruno-sala-card.js'
s = read(p)
s = replace_required(
    s,
    f"  tv: '{ANDROID}',\n  tv_media: '{ANDROID}',",
    f"  tv: '{POWER}',\n  tv_media: '{ANDROID}',",
    'Sala separa power e mídia',
)
write(p, s)

p = 'config/www/bruno-ui/cards/bruno-media-card.js'
s = read(p)
s = replace_required(
    s,
    f"const BRUNO_MEDIA_TV_POWER_ENTITY = '{ANDROID}';",
    f"const BRUNO_MEDIA_TV_POWER_ENTITY = '{POWER}';",
    'Media card usa power estável',
)
write(p, s)

p = 'config/packages/home_activity.yaml'
s = read(p)
s = replace_required(
    s,
    f"{{{{ states('{ANDROID}') in",
    f"{{{{ states('{POWER}') in",
    'home activity TV power',
)
write(p, s)

p = 'config/packages/active_player.yaml'
s = read(p)
s = replace_required(
    s,
    f"{{{{ '{ANDROID}' if player == '{ANDROID}' else player }}}}",
    f"{{{{ '{POWER}' if player == '{ANDROID}' else player }}}}",
    'volume down TV -> power entity',
)
s = replace_required(
    s,
    f"{{{{ '{ANDROID}' if player == '{ANDROID}' else player }}}}",
    f"{{{{ '{POWER}' if player == '{ANDROID}' else player }}}}",
    'volume up TV -> power entity',
)
s = replace_required(
    s,
    f"volume_player: \"{{{{ '{ANDROID}' if focused_player == '{ANDROID}' else focused_player }}}}\"",
    f"volume_player: \"{{{{ '{POWER}' if focused_player == '{ANDROID}' else focused_player }}}}\"",
    'mute TV -> power entity',
)
write(p, s)

p = 'config/packages/sala_tv_controls.yaml'
s = read(p)
s = replace_required(
    s,
    f"{{{{ states('{ANDROID}') in ['off','unknown','unavailable'] }}}}",
    f"{{{{ states('{POWER}') in ['off','unknown','unavailable'] }}}}",
    'apps power condition', all_occurrences=True,
)
s = replace_required(
    s,
    f"{{{{ states('{ANDROID}') not in ['off','unknown','unavailable'] }}}}",
    f"{{{{ states('{POWER}') not in ['off','unknown','unavailable'] }}}}",
    'apps power wait', all_occurrences=True,
)
s = replace_required(
    s,
    f"- action: media_player.turn_on\n                target:\n                  entity_id: {ANDROID}",
    f"- action: media_player.turn_on\n                target:\n                  entity_id: {POWER}",
    'apps turn_on power entity', all_occurrences=True,
)
# select_source continua deliberadamente no Android ADB, que mantém a lista rica de apps.
write(p, s)

# ---------------------------------------------------------------------------
# Views: o dashboard principal é uma shell single-view de verdade.
# Os arquivos legados ficam no repositório, mas não são parseados/renderizados.
# ---------------------------------------------------------------------------
p = 'config/dashboards/ui-lovelace-main.yaml'
s = read(p)
legacy_views = [
    '  - !include views/system.yaml',
    '  - !include views/github-view.yaml',
    '  - !include subviews/movie-panel.yaml',
    '  - !include subviews/music-assistant.yaml',
    '  - !include subviews/cameras-security.yaml',
    '  - !include subviews/floor-plan.yaml',
]
for line in legacy_views:
    if line in s:
        s = s.replace(line, f"  # RETIRADO DO RUNTIME 2026-08-20: {line.strip()}", 1)
write(p, s)

# ---------------------------------------------------------------------------
# Assets da Home: recupera WebP (~centenas de KB para a família toda) e
# restaura a geometria mobile anterior, sem o preload em idle que fazia PNGs
# aparecerem aos poucos. Ambos os estados ON/OFF entram imediatamente.
# ---------------------------------------------------------------------------
p = 'dashboard-src/src/components/rooms/bruno-room-tile.ts'
s = read(p)
s = replace_required(
    s,
    "    const v = '20260808-maquetes-premium-1';\n"
    "    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}.png?v=${v}` : '';\n"
    "    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}.png?v=${v}` : '';",
    "    // WebP preserva a mesma caixa óptica dos PNGs, com payload drasticamente menor.\n"
    "    // Ambos os estados são carregados já no tile: nada de aparição progressiva em idle.\n"
    "    const v = '20260820-webp-runtime-2';\n"
    "    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}.webp?v=${v}` : '';\n"
    "    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}.webp?v=${v}` : '';",
    'room tile WebP',
)
s = replace_required(
    s,
    "      .room-icon {\n        max-width: clamp(78px, 45.71cqi, 130px);\n        height: clamp(48.36px, 28.34cqi, 80.6px);\n      }",
    "      .room-icon {\n        max-width: 100px;\n        height: 62px;\n      }\n"
    "      .room-asset {\n        height: 118%;\n      }",
    'restaurar geometria mobile dos assets',
)
write(p, s)

# ---------------------------------------------------------------------------
# Navegação: card e backdrop do destino ficam prontos em paralelo; a seção
# anterior só é retirada quando AMBOS estiverem disponíveis. Depois da Home,
# aquece os demais backdrops em baixa prioridade, sem bloquear o cold start.
# ---------------------------------------------------------------------------
p = 'config/www/bruno-ui/core/bruno-shell.js'
s = read(p)
s = replace_required(
    s,
    "  _preloadResolvedBackdropFor(key) {\n"
    "    if (!this._hass || !this._backdrops || !key) return;\n"
    "    const fallback = this._backdrops[key] || this._backdrops.default;\n"
    "    const url = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, key, fallback) || fallback;\n"
    "    if (url) this._loadBackdrop(url);\n"
    "  }\n\n"
    "  _loadBackdrop(url) {",
    "  _preloadResolvedBackdropFor(key, priority = 'auto') {\n"
    "    if (!this._backdrops || !key) return Promise.resolve(null);\n"
    "    const fallback = this._backdrops[key] || this._backdrops.default;\n"
    "    const url = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, key, fallback) || fallback;\n"
    "    return url ? this._loadBackdrop(url, priority) : Promise.resolve(null);\n"
    "  }\n\n"
    "  _loadBackdrop(url, priority = 'auto') {",
    'backdrop preload retorna promise',
)
s = replace_required(
    s,
    "    const image = new Image();\n    image.decoding = 'async';",
    "    const image = new Image();\n    image.decoding = 'async';\n"
    "    if ('fetchPriority' in image) image.fetchPriority = priority;",
    'prioridade de backdrop',
)
s = replace_required(
    s,
    "      const homePromise = this._sectionElement(homeKey, homeConfig, generation);\n"
    "      const sectionPromise = key === homeKey\n"
    "        ? homePromise\n"
    "        : this._sectionElement(key, config, generation);\n"
    "      const [homeEl, el] = await Promise.all([homePromise, sectionPromise]);",
    "      const homePromise = this._sectionElement(homeKey, homeConfig, generation);\n"
    "      const sectionPromise = key === homeKey\n"
    "        ? homePromise\n"
    "        : this._sectionElement(key, config, generation);\n"
    "      // Não troca os cards deixando o wallpaper antigo para trás: chunk e\n"
    "      // backdrop do destino são buscados em paralelo e ativados juntos.\n"
    "      const backdropPromise = this._preloadResolvedBackdropFor(key, 'high');\n"
    "      const [homeEl, el] = await Promise.all([homePromise, sectionPromise, backdropPromise]);",
    'aguardar backdrop junto com seção',
)
s = replace_required(
    s,
    "    globalThis.requestAnimationFrame?.(() => {\n      if (requestId === this._sectionRequestId && this._activeKey === key) content.scrollTop = scrollTop;\n    });\n  }",
    "    globalThis.requestAnimationFrame?.(() => {\n      if (requestId === this._sectionRequestId && this._activeKey === key) content.scrollTop = scrollTop;\n    });\n"
    "    if (key === homeKey) this._scheduleBackdropWarmup();\n  }",
    'agendar warmup após Home',
)
# Insere warmup logo antes de _preloadBackdropFor.
marker = "  _preloadBackdropFor(key) {"
if '_scheduleBackdropWarmup() {' not in s:
    warmup = """  _scheduleBackdropWarmup() {
    if (this._backdropWarmupScheduled || !this._backdrops) return;
    this._backdropWarmupScheduled = true;
    const run = async () => {
      const current = this._activeKey || this._defaultSection;
      const keys = Object.keys(this._backdrops).filter((key) => key !== 'default' && key !== current);
      for (const key of keys) {
        await this._preloadResolvedBackdropFor(key, 'low');
      }
    };
    if (typeof globalThis.requestIdleCallback === 'function') {
      globalThis.requestIdleCallback(() => { void run(); }, { timeout: 4000 });
    } else {
      globalThis.setTimeout(() => { void run(); }, 1200);
    }
  }

"""
    if marker not in s:
        raise SystemExit('MARKER NOT FOUND: inserir backdrop warmup')
    s = s.replace(marker, warmup + marker, 1)
write(p, s)

# ---------------------------------------------------------------------------
# Validador passa a exigir a arquitetura híbrida e os regressions fixes.
# ---------------------------------------------------------------------------
p = 'scripts/build/validate-full-candidate-20260820.py'
s = read(p)
s = replace_required(
    s,
    "ANDROID = 'media_player.android_tv_192_168_3_17'",
    "ANDROID = 'media_player.android_tv_192_168_3_17'\nPOWER = 'media_player.smart_tv_pro_2'\nREMOTE = 'remote.smart_tv_pro'",
    'validator TV constants',
)
old_forbidden = """    for forbidden in [
        'media_player.smart_tv_pro',
        'media_player.smart_tv_pro_2',
        'remote.smart_tv_pro',
    ]:
        if forbidden in active:
            raise SystemExit(f'{forbidden} still active in {relative}')
"""
new_forbidden = """    if 'remote.atv' in active:
        raise SystemExit(f'remote.atv still active in {relative}')
"""
s = replace_required(s, old_forbidden, new_forbidden, 'validator legacy remote')
s = replace_required(
    s,
    "    f\"tv: '{ANDROID}'\",\n    f\"tvMedia: '{ANDROID}'\",\n    \"tvRemote: 'remote.atv'\",",
    "    f\"tv: '{POWER}'\",\n    f\"tvMedia: '{ANDROID}'\",\n    f\"tvRemote: '{REMOTE}'\",",
    'validator hybrid tokens',
)
s = replace_required(
    s,
    "print('TV_ENTITY', ANDROID)",
    "# Regressões descobertas no teste físico de 2026-08-20.\n"
    "tile = (ROOT / 'dashboard-src/src/components/rooms/bruno-room-tile.ts').read_text(encoding='utf-8')\n"
    "if '.webp?v=${v}' not in tile or 'max-width: 100px' not in tile or 'height: 118%' not in tile:\n"
    "    raise SystemExit('room tile WebP/mobile geometry regression')\n"
    "for name in ['sala', 'office', 'cozinha', 'lavabo', 'quarto-casal', 'quarto-bebe', 'quarto-menina']:\n"
    "    for state in ['off', 'on']:\n"
    "        if not (ROOT / f'config/www/bruno-ui/assets/v2/{name}-{state}.webp').exists():\n"
    "            raise SystemExit(f'missing WebP asset {name}-{state}')\n"
    "ui_active = '\\n'.join(line for line in ui.splitlines() if not line.lstrip().startswith('#'))\n"
    "for legacy_view in ['views/system.yaml', 'views/github-view.yaml', 'subviews/movie-panel.yaml', 'subviews/music-assistant.yaml', 'subviews/cameras-security.yaml', 'subviews/floor-plan.yaml']:\n"
    "    if legacy_view in ui_active:\n"
    "        raise SystemExit(f'legacy view still active: {legacy_view}')\n"
    "shell = (ROOT / 'config/www/bruno-ui/core/bruno-shell.js').read_text(encoding='utf-8')\n"
    "if \"const backdropPromise = this._preloadResolvedBackdropFor(key, 'high');\" not in shell:\n"
    "    raise SystemExit('destination backdrop is not gated with section activation')\n"
    "print('TV_POWER_ENTITY', POWER)\n"
    "print('TV_MEDIA_ENTITY', ANDROID)\n"
    "print('TV_REMOTE_ENTITY', REMOTE)",
    'validator physical regressions',
)
write(p, s)

print('physical round2 fixes applied')
