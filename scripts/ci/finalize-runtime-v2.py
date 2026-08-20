#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]

def read(path):
    return (ROOT / path).read_text(encoding='utf-8')

def write(path, text):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(text, encoding='utf-8')

def replace_once(text, old, new, label):
    if old not in text:
        raise SystemExit(f'fragmento nao encontrado: {label}')
    return text.replace(old, new, 1)

# ---------------------------------------------------------------------------
# 1. Lovelace: uma unica view real; templates legados ficam no repo, fora do runtime.
# ---------------------------------------------------------------------------
p = 'config/dashboards/ui-lovelace-main.yaml'
s = read(p)
s = replace_once(
    s,
    'button_card_templates: !include_dir_merge_named ./templates/button_card_templates\nstreamline_templates: !include_dir_merge_named ./templates/streamline_templates\n',
    '# Runtime 2026-08-20: os templates legados permanecem no repositorio, mas a\n# shell ativa nao referencia button-card/streamline-card (auditoria do grafo: 13 YAML).\n# Portanto nao entram mais no payload Lovelace principal.\n',
    'templates globais',
)
views = '''  - !include views/system.yaml\n  - !include views/github-view.yaml\n  - !include subviews/movie-panel.yaml\n  - !include subviews/music-assistant.yaml\n  - !include subviews/cameras-security.yaml\n  - !include subviews/floor-plan.yaml\n'''
s = replace_once(
    s, views,
    '  # Runtime 2026-08-20: dashboard principal = somente bento_shell.\n'
    '  # System/GitHub/movie/MA/cameras/floor-plan continuam preservados no repositorio;\n'
    '  # as funcoes usadas hoje vivem dentro da propria shell ou de seus paineis.\n',
    'views irmas legadas',
)
write(p, s)

# ---------------------------------------------------------------------------
# 2. Resources: saem do estado opaco de .storage e viram fonte versionada.
# A lista e o fechamento da auditoria: 73 atuais -> 7 necessarios pelo runtime ativo.
# ---------------------------------------------------------------------------
resources = '''# Recursos do dashboard ativo — fonte de verdade versionada (2026-08-20).\n# O HACS continua instalado; retirar daqui somente impede download no bootstrap.\n# Auditoria: 13 YAML alcancaveis + JS/TS do runtime ativo.\n- url: /hacsfiles/lovelace-layout-card/layout-card.js?hacstag=156434866247\n  type: module\n- url: /hacsfiles/lovelace-xiaomi-vacuum-map-card/xiaomi-vacuum-map-card.js?hacstag=193372044241\n  type: module\n- url: /browser_mod.js?automatically-added&3.2.1\n  type: module\n- url: /hacsfiles/kiosk-mode/kiosk-mode.js?hacstag=4973191281402\n  type: module\n- url: /hacsfiles/spotifyplus_card/spotifyplus_card.js?hacstag=8764888741072\n  type: module\n- url: /hacsfiles/universal-remote-card/universal-remote-card.min.js?hacstag=6543936464115\n  type: module\n- url: /hacsfiles/lovelace-card-mod/card-mod.js?hacstag=190927524421\n  type: module\n'''
write('config/lovelace-resources.yaml', resources)

p = 'config/configuration.yaml'
s = read(p)
s = replace_once(
    s,
    '    sala_tv_controls: !include packages/sala_tv_controls.yaml\n',
    '    sala_tv: !include packages/sala_tv.yaml\n    sala_tv_controls: !include packages/sala_tv_controls.yaml\n',
    'include sala_tv',
)
s = replace_once(
    s,
    'lovelace:\n  mode: storage\n',
    'lovelace:\n  # Runtime principal reproduzivel por Git: resources deixam .storage.\n  resource_mode: yaml\n  resources: !include lovelace-resources.yaml\n  mode: storage\n',
    'resource_mode lovelace',
)
write(p, s)

# ---------------------------------------------------------------------------
# 3. TV canonica no backend: Android TV Remote = power/volume/control; Cast = midia.
# ---------------------------------------------------------------------------
sala_tv = '''# TV da Sala — contrato canonico (2026-08-20)\n#\n# Power/volume/control: Android TV Remote, estavel e local-push.\n# Metadata/playback: Google Cast quando houver sessao ativa.\n# A entidade ADB antiga permanece instalada somente para observacao/rollback e\n# nao participa mais do Dashboard.\nmedia_player:\n  - platform: universal\n    name: Sala TV\n    unique_id: sala_tv_canonical\n    device_class: tv\n    children:\n      - media_player.smart_tv_pro_2\n      - media_player.smart_tv_pro\n    active_child_template: >\n      {% if states('media_player.smart_tv_pro') in ['playing', 'paused', 'buffering'] %}\n        media_player.smart_tv_pro\n      {% else %}\n        media_player.smart_tv_pro_2\n      {% endif %}\n    state_template: >\n      {% set power = states('media_player.smart_tv_pro_2') %}\n      {% set cast = states('media_player.smart_tv_pro') %}\n      {% if power == 'off' %}\n        off\n      {% elif cast in ['playing', 'paused', 'buffering'] %}\n        {{ cast }}\n      {% elif power not in ['off', 'unknown', 'unavailable', 'none', ''] %}\n        on\n      {% elif cast in ['playing', 'paused', 'buffering'] %}\n        {{ cast }}\n      {% else %}\n        {{ power }}\n      {% endif %}\n    browse_media_entity: media_player.smart_tv_pro\n    commands:\n      turn_on:\n        action: media_player.turn_on\n        target:\n          entity_id: media_player.smart_tv_pro_2\n      turn_off:\n        action: media_player.turn_off\n        target:\n          entity_id: media_player.smart_tv_pro_2\n      volume_up:\n        action: media_player.volume_up\n        target:\n          entity_id: media_player.smart_tv_pro_2\n      volume_down:\n        action: media_player.volume_down\n        target:\n          entity_id: media_player.smart_tv_pro_2\n      volume_set:\n        action: media_player.volume_set\n        target:\n          entity_id: media_player.smart_tv_pro_2\n        data:\n          volume_level: "{{ volume_level }}"\n      volume_mute:\n        action: media_player.volume_mute\n        target:\n          entity_id: media_player.smart_tv_pro_2\n        data:\n          is_volume_muted: "{{ is_volume_muted }}"\n      media_play:\n        action: remote.send_command\n        target:\n          entity_id: remote.smart_tv_pro\n        data:\n          command: MEDIA_PLAY\n      media_pause:\n        action: remote.send_command\n        target:\n          entity_id: remote.smart_tv_pro\n        data:\n          command: MEDIA_PAUSE\n      media_stop:\n        action: remote.send_command\n        target:\n          entity_id: remote.smart_tv_pro\n        data:\n          command: MEDIA_STOP\n      media_previous_track:\n        action: remote.send_command\n        target:\n          entity_id: remote.smart_tv_pro\n        data:\n          command: MEDIA_PREVIOUS\n      media_next_track:\n        action: remote.send_command\n        target:\n          entity_id: remote.smart_tv_pro\n        data:\n          command: MEDIA_NEXT\n    attributes:\n      volume_level: media_player.smart_tv_pro_2|volume_level\n      is_volume_muted: media_player.smart_tv_pro_2|is_volume_muted\n      source: media_player.smart_tv_pro_2|app_name\n'''
write('config/packages/sala_tv.yaml', sala_tv)

# Toda a camada de foco/relevancia passa a observar a entidade canonica.
for p in ['config/packages/active_player.yaml', 'config/packages/home_activity.yaml']:
    s = read(p).replace('media_player.android_tv_192_168_3_17', 'media_player.sala_tv')
    write(p, s)

# Apps: comandos saem pelo Android TV Remote, sem depender do ADB instavel.
controls = '''##############################################################################\n# SALA TV QUICK CONTROLS — Android TV Remote (2026-08-20)\n##############################################################################\nscript:\n  sala_tv_open_netflix:\n    alias: "Sala TV — Abrir Netflix"\n    mode: restart\n    sequence:\n      - action: remote.turn_on\n        target: { entity_id: remote.smart_tv_pro }\n        data: { activity: com.netflix.ninja }\n\n  sala_tv_open_disney:\n    alias: "Sala TV — Abrir Disney+"\n    mode: restart\n    sequence:\n      - action: remote.turn_on\n        target: { entity_id: remote.smart_tv_pro }\n        data: { activity: com.disney.disneyplus }\n\n  sala_tv_open_prime:\n    alias: "Sala TV — Abrir Prime Video"\n    mode: restart\n    sequence:\n      - action: remote.turn_on\n        target: { entity_id: remote.smart_tv_pro }\n        data: { activity: com.amazon.amazonvideo.livingroom }\n\n  sala_tv_open_hbo:\n    alias: "Sala TV — Abrir HBO Max"\n    mode: restart\n    sequence:\n      - action: remote.turn_on\n        target: { entity_id: remote.smart_tv_pro }\n        data: { activity: com.wbd.stream }\n'''
write('config/packages/sala_tv_controls.yaml', controls)

# ---------------------------------------------------------------------------
# 4. Frontend: todas as superficies usam a mesma TV; remote inexistente sai.
# ---------------------------------------------------------------------------
p='dashboard-src/src/config/subviews.config.ts'
s=read(p).replace("tv: 'media_player.android_tv_192_168_3_17'", "tv: 'media_player.sala_tv'")
s=s.replace("tvRemote: 'remote.atv'", "tvRemote: 'remote.smart_tv_pro'")
write(p,s)

p='dashboard-src/src/config/rooms.config.ts'
s=read(p).replace("entity: 'media_player.android_tv_192_168_3_17',\n        states: TV_POWER_ON_STATES,\n        offDelayMs: 45_000,", "entity: 'media_player.sala_tv',\n        states: TV_POWER_ON_STATES,")
s=s.replace("'media_player.android_tv_192_168_3_17'", "'media_player.sala_tv'")
write(p,s)

p='dashboard-src/src/components/rooms/bruno-room-subview.ts'
s=read(p)
s=s.replace('import { isMediaPlaying, isTvPoweredStable } from \'@/services/entities/media-state\';', "import { isMediaPlaying, isTvPowered } from '@/services/entities/media-state';")
s=re.sub(r'isTvPoweredStable\(\s*this\._hass,\s*([^,\n]+),\s*Date\.now\(\),\s*45_000,?\s*\)', r'isTvPowered(this._hass, \1)', s)
s=s.replace("callHaService(this._hass, 'homeassistant', 'toggle', { entity_id: tvId });", "callHaService(this._hass, 'media_player', 'turn_on', { entity_id: tvId });")
if 'isTvPoweredStable' in s:
    raise SystemExit('room-subview ainda usa isTvPoweredStable')
write(p,s)

# Legados ainda usados na Home: mesma entidade; grace zerado porque a fonte agora e canonica.
for p in ['config/www/bruno-ui/cards/bruno-sala-card.js','config/www/bruno-ui/cards/bruno-media-card.js']:
    s=read(p).replace('media_player.android_tv_192_168_3_17','media_player.sala_tv')
    s=s.replace('const BRUNO_SALA_TV_OFF_GRACE_MS = 45_000;', 'const BRUNO_SALA_TV_OFF_GRACE_MS = 0; // fonte canonica: sem mascara de OFF')
    s=s.replace('const BRUNO_MEDIA_TV_OFF_GRACE_MS = 45_000;', 'const BRUNO_MEDIA_TV_OFF_GRACE_MS = 0; // fonte canonica: sem mascara de OFF')
    write(p,s)

# ---------------------------------------------------------------------------
# 5. Runtime: core pequeno + chunks por secao. Nada raro bloqueia a Home.
# ---------------------------------------------------------------------------
core = '''/** Runtime inicial da Home. Modulos de secoes sao lazy em lazy-sections.ts. */\nimport '../../config/www/bruno-ui/core/bruno-icons.js';\nimport '../../config/www/bento-sidebar-card.js';\nimport '../../config/www/bruno-ui/core/bruno-wallpaper-manager.js';\nimport '../../config/www/bruno-ui/core/bruno-scenes-panel.js';\nimport '../../config/www/bruno-ui/core/bruno-shell.js';\nimport '../../config/www/bruno-ui/core/bruno-liquid-glass.js';\nimport '../../config/www/bruno-ui/core/bruno-liquid-glass-ios.js';\nimport '../../config/www/bruno-ui/core/bruno-visionos.js';\nimport '../../config/www/bruno-ui/core/bruno-ios-light.js';\nimport '../../config/www/bruno-ui/core/bruno-ios-dark.js';\nimport '../../config/www/bruno-ui/core/bruno-josh.js';\nimport '../../config/www/bruno-ui/core/bruno-theme-manager.js';\nimport '../../config/www/bruno-ui/core/bruno-surface-material.js';\nimport '../../config/www/bruno-ui/core/bruno-updates-panel.js';\nimport '../../config/www/bruno-ui/core/bruno-network-panel.js';\nimport '../../config/www/bruno-ui/core/bruno-hybrid-light-icons.js';\nimport '../../config/www/bruno-ui/cards/bruno-sala-card.js';\nimport '../../config/www/bruno-ui/cards/bruno-activity-column.js';\nimport '../../config/www/bruno-ui/cards/bruno-roborock-card.js';\nimport '../../config/www/bruno-ui/cards/bruno-home-camera-card.js';\nimport '../../config/www/bruno-ui/cards/bruno-hero-card.js';\nimport '../../config/www/bruno-ui/cards/bruno-top-badges-card.js';\nimport '../../config/www/bruno-ui/cards/bruno-media-card.js';\nimport '../../config/www/bruno-ui/patches/home-mobile-hero-rail.js';\n\nexport const LEGACY_RUNTIME_MODULE_COUNT = 24;\n'''
write('dashboard-src/src/legacy-runtime.generated.ts', core)

lazy = '''type Loader = () => Promise<unknown>;\n\nlet cameraBridgeReady = false;\nasync function loadCameras(): Promise<void> {\n  if (!cameraBridgeReady) {\n    const [{ MotorDeInstantaneos }, { BrunoCameraLive }] = await Promise.all([\n      import('../services/camera/snapshot-engine'),\n      import('../services/camera/ha-webrtc-player'),\n    ]);\n    (globalThis as { BrunoCameraEngine?: unknown }).BrunoCameraEngine = MotorDeInstantaneos;\n    (globalThis as { BrunoCameraLive?: unknown }).BrunoCameraLive = BrunoCameraLive;\n    cameraBridgeReady = true;\n  }\n  await import('../../../config/www/bruno-ui/subviews/bruno-cameras-security-subview.js');\n}\n\nconst room: Loader = () => import('../components/rooms/bruno-room-subview');\nconst sections: Record<string, Loader> = {\n  sala: room, office: room, cozinha: room, casal: room, marina: room, miguel: room,\n  cameras: loadCameras,\n  roborock: () => import('../../../config/www/bruno-ui/subviews/bruno-roborock-subview.js'),\n  floorplan: () => import('../../../config/www/bruno-ui/subviews/bruno-planta-3d-subview.js'),\n  music: () => import('../../../config/www/bruno-ui/subviews/bruno-music-subview.js'),\n};\nconst inflight = new Map<string, Promise<unknown>>();\n\nasync function ensureSection(key: string): Promise<void> {\n  const loader = sections[key];\n  if (!loader) return;\n  let p = inflight.get(key);\n  if (!p) {\n    p = Promise.resolve(loader());\n    inflight.set(key, p);\n  }\n  await p;\n}\n\nexport function installLazyRuntime(): void {\n  (globalThis as unknown as { BrunoRuntimeLoader?: { ensureSection: (key: string) => Promise<void> } }).BrunoRuntimeLoader = { ensureSection };\n}\n'''
write('dashboard-src/src/runtime/lazy-sections.ts', lazy)

p='dashboard-src/src/main.ts'
s=read(p)
s=s.replace("import './components/rooms/bruno-room-subview';\n", '')
s=s.replace("import './components/devices/bruno-devices-panel';\n", "import './components/devices/bruno-devices-panel';\nimport { installLazyRuntime } from './runtime/lazy-sections';\n")
s=s.replace('installRoomTileIosLongPressGuard();', 'installLazyRuntime();\ninstallRoomTileIosLongPressGuard();')
# Camera engine deixa o bootstrap; sera carregado junto da secao Cameras.
s=re.sub(r'/\*\*\n \* PONTE PARA O MÓDULO LEGADO[\s\S]*?\(globalThis as \{ BrunoCameraLive\?: unknown \}\)\.BrunoCameraLive = BrunoCameraLive;\n?', '', s)
write(p,s)

p='dashboard-src/vite.config.ts'
s=read(p)
s=s.replace("        // Um bundle só. O projeto atual faz 52 requisições separadas no cold\n        // start do tablet — este é o principal ganho de carregamento.\n        inlineDynamicImports: true,\n        entryFileNames: 'bruno-dashboard.[hash].js',", "        // Core inicial pequeno; secoes raras viram chunks sob demanda.\n        entryFileNames: 'bruno-dashboard.[hash].js',\n        chunkFileNames: 'chunks/[name].[hash].js',")
write(p,s)

# Shell espera o chunk da secao antes de pedir ao HA para criar o custom element.
p='config/www/bruno-ui/core/bruno-shell.js'
s=read(p)
s=replace_once(
    s,
    '    const promise = this._createCard(config).then((el) => {',
    "    const lazy = globalThis.BrunoRuntimeLoader?.ensureSection?.(key);\n    const promise = Promise.resolve(lazy).then(() => this._createCard(config)).then((el) => {",
    'lazy section hook',
)
s=replace_once(
    s,
    '''  _preloadBackdrops() {\n    if (!this._backdrops) return;\n    for (const k of Object.keys(this._backdrops)) {\n      const url = this._backdrops[k];\n      if (url) this._loadBackdrop(url);\n    }\n  }''',
    '''  _preloadBackdrops() {\n    if (!this._backdrops) return;\n    const key = this._activeKey || this._defaultSection || 'home';\n    const url = this._backdrops[key] || this._backdrops.default;\n    if (url) this._loadBackdrop(url);\n  }''',
    'preload backdrops',
)
s=re.sub(
    r'  _preloadResolvedBackdrops\(\) \{\n    if \(!this\._hass \|\| !this\._backdrops\) return;\n    for \(const key of Object\.keys\(this\._backdrops\)\) \{\n      const fallback = this\._backdrops\[key\] \|\| this\._backdrops\.default;\n      const url = globalThis\.BrunoWallpaperManager\?\.resolve\?\.\(this\._hass, key, fallback\) \|\| fallback;\n      if \(url\) this\._loadBackdrop\(url\);\n    \}\n  \}',
    "  _preloadResolvedBackdrops() {\n    if (!this._hass || !this._backdrops) return;\n    const key = this._activeKey || this._defaultSection || 'home';\n    const fallback = this._backdrops[key] || this._backdrops.default;\n    const url = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, key, fallback) || fallback;\n    if (url) this._loadBackdrop(url);\n  }",
    s,
    count=1,
)
write(p,s)

# ---------------------------------------------------------------------------
# Guardas: se algum contrato morto continuar no runtime ativo, a rodada falha.
# ---------------------------------------------------------------------------
active = [
  'config/packages/active_player.yaml','config/packages/home_activity.yaml',
  'config/packages/sala_tv_controls.yaml','dashboard-src/src/config/subviews.config.ts',
  'dashboard-src/src/config/rooms.config.ts','dashboard-src/src/components/rooms/bruno-room-subview.ts',
  'config/www/bruno-ui/cards/bruno-sala-card.js','config/www/bruno-ui/cards/bruno-media-card.js',
]
for path in active:
    t=read(path)
    if 'media_player.android_tv_192_168_3_17' in t or "remote.atv" in t:
        raise SystemExit(f'contrato TV antigo ainda ativo em {path}')

print('runtime-v2: patches aplicados')
