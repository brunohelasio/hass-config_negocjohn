#!/usr/bin/env python3
from pathlib import Path
import json
import re
import shutil

ROOT = Path(__file__).resolve().parents[2]
PRE = 'e4901bd71ea4e460098d1692423f497067cd051c'
ROLLBACK = ROOT / '_rollback' / '20260820-pre-full-candidate'
ROLLBACK.mkdir(parents=True, exist_ok=True)


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding='utf-8')


def write(path: str, value: str) -> None:
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(value, encoding='utf-8')


def backup(path: str) -> None:
    src = ROOT / path
    if not src.exists():
        return
    dst = ROLLBACK / path
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if old not in source:
        raise SystemExit(f'MARKER NOT FOUND: {label}')
    return source.replace(old, new, 1)


def regex_once(source: str, pattern: str, replacement: str, label: str, flags=re.S) -> str:
    out, count = re.subn(pattern, replacement, source, count=1, flags=flags)
    if count != 1:
        raise SystemExit(f'REGEX {label}: expected 1, got {count}')
    return out


BACKUP_FILES = [
    'config/configuration.yaml',
    'config/dashboards/ui-lovelace-main.yaml',
    'config/packages/home_activity.yaml',
    'config/packages/active_player.yaml',
    'config/packages/sala_tv_controls.yaml',
    'config/www/bruno-ui/cards/bruno-sala-card.js',
    'config/www/bruno-ui/cards/bruno-media-card.js',
    'config/www/bruno-ui/core/bruno-shell.js',
    'dashboard-src/src/config/subviews.config.ts',
    'dashboard-src/src/config/rooms.config.ts',
    'dashboard-src/src/components/rooms/bruno-room-subview.ts',
    'dashboard-src/src/legacy-runtime.generated.ts',
    'dashboard-src/src/main.ts',
    'dashboard-src/vite.config.ts',
    'dashboard-src/package.json',
    'config/www/dashboard/bruno-dashboard.9t_Xp8gv.js',
    'config/www/dashboard/bruno-dashboard.9t_Xp8gv.js.br',
    'config/www/dashboard/bruno-dashboard.9t_Xp8gv.js.gz',
]
for item in BACKUP_FILES:
    backup(item)

# ---------------------------------------------------------------------------
# TV: energia/comandos pela Android TV Remote; mídia/arte pelo Cast.
# ---------------------------------------------------------------------------
p = 'dashboard-src/src/config/subviews.config.ts'
s = read(p)
s = replace_once(
    s,
    "      tv: 'media_player.android_tv_192_168_3_17',\n      tvRemote: 'remote.atv',",
    "      // TV: energia/comandos = Android TV Remote; mídia/arte = Cast.\n"
    "      tv: 'media_player.smart_tv_pro_2',\n"
    "      tvMedia: 'media_player.smart_tv_pro',\n"
    "      tvRemote: 'remote.smart_tv_pro',",
    'subviews tv split',
)
write(p, s)

p = 'dashboard-src/src/config/rooms.config.ts'
s = read(p)
s = replace_once(
    s,
    "        entities: ['media_player.android_tv_192_168_3_17'],\n"
    "        states: TV_POWER_ON_STATES, offDelayMs: 45_000 },",
    "        entities: ['media_player.smart_tv_pro_2'],\n"
    "        states: TV_POWER_ON_STATES },",
    'room tv status dot',
)
s = replace_once(
    s,
    "        'media_player.android_tv_192_168_3_17',\n        'media_player.echo_show',",
    "        'media_player.smart_tv_pro_2',\n"
    "        'media_player.smart_tv_pro',\n"
    "        'media_player.echo_show',",
    'room media players',
)
write(p, s)

p = 'dashboard-src/src/components/rooms/bruno-room-subview.ts'
s = read(p)
s = replace_once(
    s,
    "import { isMediaPlaying, isTvPoweredStable } from '@/services/entities/media-state';",
    "import { isMediaPlaying, isTvPowered } from '@/services/entities/media-state';",
    'room subview media import',
)
modelo_tv = """  private _modeloTv() {
    const powerId = this._idDe('tv');
    const mediaId = this._idDe('tvMedia') ?? powerId;
    const power = this._estado(powerId);
    const media = this._estado(mediaId);
    const pa = power?.attributes ?? {};
    const ma = media?.attributes ?? {};
    const ativo = isTvPowered(this._hass, powerId);
    const reproduzindo = isMediaPlaying(this._hass, mediaId);
    const estadoPower = String(power?.state ?? 'off').toLowerCase();
    const estadoMedia = String(media?.state ?? '').toLowerCase();

    const fonteAtual = String(ma['app_name'] ?? ma['source'] ?? pa['source'] ?? pa['app_name'] ?? '').trim();
    const tituloAtual = String(ma['media_title'] ?? ma['media_series_title'] ?? ma['app_name'] ?? '').trim();
    const posterAtual = String(ma['entity_picture'] ?? ma['media_image_url'] ?? '').trim();
    const volumeBruto = pa['volume_level'] ?? ma['volume_level'];
    const volumeNumero = volumeBruto == null ? Number.NaN : Number(volumeBruto);
    const volumeAtual = Number.isFinite(volumeNumero) ? Math.round(volumeNumero * 100) : null;

    if (ativo) {
      if (fonteAtual) this._tvUltimaFonte = fonteAtual;
      if (tituloAtual) this._tvUltimoTitulo = tituloAtual;
      if (posterAtual) this._tvUltimoPoster = posterAtual;
      if (volumeAtual != null) this._tvUltimoVolume = volumeAtual;
    } else {
      this._tvUltimoPoster = '';
      this._tvUltimoTitulo = '';
      this._tvUltimoVolume = null;
    }

    return {
      st: power,
      media,
      estado: reproduzindo ? estadoMedia : estadoPower,
      ativo,
      reproduzindo,
      fonte: fonteAtual || (ativo ? this._tvUltimaFonte : 'HDMI 1') || 'HDMI 1',
      titulo: tituloAtual || (ativo ? this._tvUltimoTitulo : ''),
      volume: volumeAtual ?? (ativo ? this._tvUltimoVolume : null),
      poster: posterAtual || (ativo ? this._tvUltimoPoster : ''),
    };
  }

  private _modeloSpotify()"""
s = regex_once(
    s,
    r"  private _modeloTv\(\) \{.*?\n  \}\n\n  private _modeloSpotify\(\)",
    modelo_tv,
    'modeloTv split power/media',
)
s = replace_once(
    s,
    "    const id = this._idDe('tv');\n    const espera =",
    "    const id = this._idDe('tv');\n    const mediaId = this._idDe('tvMedia') ?? id;\n    const espera =",
    'corpoTv media id',
)
s = replace_once(
    s,
    "() => this._servico('homeassistant', 'toggle', { entity_id: id })",
    "() => this._servico('media_player', 'turn_on', { entity_id: id })",
    'corpoTv explicit power on',
)
s = replace_once(
    s,
    "this._servico('media_player', 'media_play_pause', { entity_id: id })",
    "this._servico('media_player', 'media_play_pause', { entity_id: mediaId })",
    'corpoTv playback via Cast',
)
write(p, s)

p = 'config/www/bruno-ui/cards/bruno-sala-card.js'
s = read(p)
s = replace_once(
    s,
    "  tv: 'media_player.android_tv_192_168_3_17',",
    "  tv: 'media_player.smart_tv_pro_2',\n  tv_media: 'media_player.smart_tv_pro',",
    'legacy sala tv entities',
)
s = s.replace("const BRUNO_SALA_TV_OFF_GRACE_MS = 45_000;\n", '', 1)
s = replace_once(
    s,
    "    const tv = this._state(entities.tv);\n    const climate = this._state(entities.climate);",
    "    const tv = this._state(entities.tv);\n"
    "    const tvMedia = this._state(entities.tv_media) || tv;\n"
    "    const climate = this._state(entities.climate);",
    'legacy sala tv media state',
)
s = replace_once(
    s,
    "    const tvState = String(tv?.state || '').toLowerCase();\n"
    "    if (BRUNO_SALA_TV_ON_STATES.includes(tvState)) this._lastTvPoweredAt = Date.now();\n"
    "    const tvOn = BRUNO_SALA_TV_ON_STATES.includes(tvState)\n"
    "      || (tvState === 'off' && Number.isFinite(this._lastTvPoweredAt)\n"
    "        && Date.now() - this._lastTvPoweredAt <= BRUNO_SALA_TV_OFF_GRACE_MS);",
    "    const tvState = String(tv?.state || '').toLowerCase();\n"
    "    const tvOn = BRUNO_SALA_TV_ON_STATES.includes(tvState);",
    'legacy sala remove grace',
)
s = s.replace(
    'tvSemanticStatus: this._getTvSemanticStatus(tv, tvOn),',
    'tvSemanticStatus: this._getTvSemanticStatus(tvMedia, tvOn),',
    1,
)
s = replace_once(
    s,
    "      this._toggleEntity(entities.tv);\n      return;",
    "      const service = BRUNO_SALA_TV_ON_STATES.includes(String(this._state(entities.tv)?.state || '').toLowerCase())\n"
    "        ? 'media_player.turn_off'\n"
    "        : 'media_player.turn_on';\n"
    "      this._callService(service, {}, { entity_id: entities.tv });\n"
    "      return;",
    'legacy sala explicit power',
)
write(p, s)

p = 'config/www/bruno-ui/cards/bruno-media-card.js'
s = read(p)
s = replace_once(
    s,
    "{ entity: 'media_player.android_tv_192_168_3_17', name: 'TV'",
    "{ entity: 'media_player.smart_tv_pro', name: 'TV'",
    'media card Cast visual entity',
)
s = replace_once(
    s,
    "const BRUNO_MEDIA_TV_ENTITY = 'media_player.android_tv_192_168_3_17';",
    "const BRUNO_MEDIA_TV_ENTITY = 'media_player.smart_tv_pro';\n"
    "const BRUNO_MEDIA_TV_POWER_ENTITY = 'media_player.smart_tv_pro_2';",
    'media card TV constants',
)
s = s.replace("const BRUNO_MEDIA_TV_OFF_GRACE_MS = 45_000;\n", '', 1)
s = regex_once(
    s,
    r"  _isActive\(entityId\) \{\n    const state = String\(this\._state\(entityId\)\?\.state \|\| ''\)\.toLowerCase\(\);\n    if \(entityId === BRUNO_MEDIA_TV_ENTITY\) \{.*?\n    \}\n    return BRUNO_MEDIA_ACTIVE_STATES\.includes\(state\);\n  \}",
    """  _isActive(entityId) {
    const state = String(this._state(entityId)?.state || '').toLowerCase();
    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      const powerState = String(this._state(BRUNO_MEDIA_TV_POWER_ENTITY)?.state || '').toLowerCase();
      return BRUNO_MEDIA_TV_POWER_STATES.has(powerState);
    }
    return BRUNO_MEDIA_ACTIVE_STATES.includes(state);
  }""",
    'media card active power',
)
write(p, s)

p = 'config/packages/active_player.yaml'
s = read(p).replace('media_player.android_tv_192_168_3_17', 'media_player.smart_tv_pro')
for service in ['volume_down', 'volume_up']:
    old = (
        f"      - service: media_player.{service}\n"
        "        target:\n"
        "          entity_id: \"{{ states('input_select.media_focus_player') }}\""
    )
    new = (
        f"      - service: media_player.{service}\n"
        "        target:\n"
        "          entity_id: >-\n"
        "            {% set player = states('input_select.media_focus_player') %}\n"
        "            {{ 'media_player.smart_tv_pro_2' if player == 'media_player.smart_tv_pro' else player }}"
    )
    s = replace_once(s, old, new, f'active_player {service}')
s = replace_once(
    s,
    "      - service: media_player.volume_mute\n"
    "        target:\n"
    "          entity_id: \"{{ states('input_select.media_focus_player') }}\"\n"
    "        data:\n"
    "          is_volume_muted: >\n"
    "            {{ not state_attr(states('input_select.media_focus_player'), 'is_volume_muted') | default(false) }}",
    "      - variables:\n"
    "          focused_player: \"{{ states('input_select.media_focus_player') }}\"\n"
    "          volume_player: \"{{ 'media_player.smart_tv_pro_2' if focused_player == 'media_player.smart_tv_pro' else focused_player }}\"\n"
    "      - service: media_player.volume_mute\n"
    "        target:\n"
    "          entity_id: \"{{ volume_player }}\"\n"
    "        data:\n"
    "          is_volume_muted: >\n"
    "            {{ not state_attr(volume_player, 'is_volume_muted') | default(false) }}",
    'active_player mute routing',
)
write(p, s)

p = 'config/packages/home_activity.yaml'
s = read(p)
s = replace_once(
    s,
    "states('media_player.android_tv_192_168_3_17')",
    "states('media_player.smart_tv_pro_2')",
    'home activity stable tv',
)
write(p, s)

p = 'config/packages/sala_tv_controls.yaml'
s = read(p).replace('media_player.android_tv_192_168_3_17', 'media_player.smart_tv_pro_2')
write(p, s)

# ---------------------------------------------------------------------------
# Lovelace cold-start: active shell no longer parses unused global templates.
# ---------------------------------------------------------------------------
p = 'config/dashboards/ui-lovelace-main.yaml'
s = read(p)
s = replace_once(
    s,
    "button_card_templates: !include_dir_merge_named ./templates/button_card_templates\n"
    "streamline_templates: !include_dir_merge_named ./templates/streamline_templates\n",
    "# 2026-08-20: árvores legadas fora do grafo ativo da shell.\n"
    "# Rollback em _rollback/20260820-pre-full-candidate/.\n",
    'remove unused global template roots',
)
write(p, s)

# Resource mode YAML keeps the 73-entry .storage list untouched, but does not load it.
p = 'config/configuration.yaml'
s = read(p)
resources_block = """lovelace:
  mode: storage
  # 2026-08-20: recursos do dashboard ativo. A lista em .storage permanece
  # intacta para rollback; resource_mode: yaml apenas deixa de carregá-la.
  resource_mode: yaml
  resources:
    - url: /browser_mod.js
      type: module
    - url: /hacsfiles/lovelace-card-mod/card-mod.js
      type: module
    - url: /hacsfiles/kiosk-mode/kiosk-mode.js
      type: module
    - url: /hacsfiles/lovelace-layout-card/layout-card.js
      type: module
    - url: /hacsfiles/lovelace-xiaomi-vacuum-map-card/xiaomi-vacuum-map-card.js
      type: module
    - url: /hacsfiles/spotifyplus_card/spotifyplus_card.js
      type: module
    - url: /hacsfiles/universal-remote-card/universal-remote-card.min.js
      type: module
    - url: /hacsfiles/honeycomb-menu/honeycomb-menu.js
      type: module
    - url: /hacsfiles/mini-media-player/mini-media-player-bundle.js
      type: module
  dashboards:"""
s = replace_once(s, "lovelace:\n  mode: storage\n  dashboards:", resources_block, 'lovelace resource mode')
write(p, s)

# ---------------------------------------------------------------------------
# Split bundle: Home/core first; route-only sections lazy.
# ---------------------------------------------------------------------------
p = 'dashboard-src/src/legacy-runtime.generated.ts'
s = read(p)
for line in [
    "import '../../config/www/bruno-ui/subviews/bruno-cameras-security-subview.js';\n",
    "import '../../config/www/bruno-ui/subviews/bruno-roborock-subview.js';\n",
    "import '../../config/www/bruno-ui/subviews/bruno-planta-3d-subview.js';\n",
    "import '../../config/www/bruno-ui/subviews/bruno-music-subview.js';\n",
]:
    if line not in s:
        raise SystemExit(f'missing lazy import: {line.strip()}')
    s = s.replace(line, '', 1)
s = replace_once(s, 'export const LEGACY_RUNTIME_MODULE_COUNT = 34;', 'export const LEGACY_RUNTIME_MODULE_COUNT = 30;', 'legacy count')
write(p, s)

write(
    'dashboard-src/src/lazy-runtime.ts',
    """type LazyConfig = { type?: string; card?: LazyConfig; cards?: LazyConfig[] };

type BrunoLazyApi = { ensureForConfig: (config: LazyConfig | undefined) => Promise<void> };

const loaders: Record<string, () => Promise<unknown>> = {
  'custom:bruno-room-subview': () => import('./components/rooms/bruno-room-subview'),
  'custom:bruno-cameras-security-subview': () => import('../../config/www/bruno-ui/subviews/bruno-cameras-security-subview.js'),
  'custom:bruno-roborock-subview': () => import('../../config/www/bruno-ui/subviews/bruno-roborock-subview.js'),
  'custom:bruno-planta-3d-subview': () => import('../../config/www/bruno-ui/subviews/bruno-planta-3d-subview.js'),
  'custom:bruno-music-subview': () => import('../../config/www/bruno-ui/subviews/bruno-music-subview.js'),
};

const pending = new Map<string, Promise<unknown>>();

async function ensureType(type: string | undefined): Promise<void> {
  if (!type || !loaders[type]) return;
  let task = pending.get(type);
  if (!task) {
    task = loaders[type]();
    pending.set(type, task);
  }
  await task;
}

async function ensureForConfig(config: LazyConfig | undefined): Promise<void> {
  if (!config) return;
  await ensureType(config.type);
  if (config.card) await ensureForConfig(config.card);
  if (Array.isArray(config.cards)) await Promise.all(config.cards.map(ensureForConfig));
}

(globalThis as typeof globalThis & { BrunoLazyModules?: BrunoLazyApi }).BrunoLazyModules = { ensureForConfig };
""",
)

p = 'dashboard-src/src/main.ts'
s = read(p)
s = s.replace("import './components/rooms/bruno-room-subview';\n", '', 1)
s = replace_once(
    s,
    "import './diagnostics/bruno-diagnostics';\n",
    "import './diagnostics/bruno-diagnostics';\n"
    "import './diagnostics/startup-metrics';\n"
    "import './lazy-runtime';\n",
    'main lazy/metrics imports',
)
write(p, s)

write(
    'dashboard-src/src/diagnostics/startup-metrics.ts',
    """type StartupMetric = { at: number; resources?: number; transferBytes?: number };
type StartupState = { startedAt: number; marks: Record<string, StartupMetric> };

const state: StartupState = { startedAt: performance.now(), marks: {} };
const mark = (name: string): void => { state.marks[name] = { at: Math.round(performance.now()) }; };

mark('module');
customElements.whenDefined('bruno-shell').then(() => mark('shell-defined'));
window.addEventListener('DOMContentLoaded', () => mark('dom-content-loaded'), { once: true });
window.addEventListener('load', () => {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  state.marks.load = {
    at: Math.round(performance.now()),
    resources: entries.length,
    transferBytes: entries.reduce((sum, entry) => sum + Number(entry.transferSize || 0), 0),
  };
}, { once: true });

(globalThis as typeof globalThis & { brunoStartup?: StartupState }).brunoStartup = state;
""",
)

p = 'config/www/bruno-ui/core/bruno-shell.js'
s = read(p)
s = replace_once(
    s,
    "  async _createCard(config) {\n    const helpers = await this._ensureHelpers();",
    "  async _createCard(config) {\n"
    "    await globalThis.BrunoLazyModules?.ensureForConfig?.(config);\n"
    "    const helpers = await this._ensureHelpers();",
    'shell lazy card hook',
)
s = s.replace('    this._preloadBackdrops();', '    this._preloadBackdropFor(this._defaultSection);', 1)
s = s.replace('    this._preloadResolvedBackdrops();', '    this._preloadResolvedBackdropFor(this._activeKey || this._defaultSection);', 1)
s = replace_once(
    s,
    "  _preloadBackdrops() {\n"
    "    if (!this._backdrops) return;\n"
    "    for (const k of Object.keys(this._backdrops)) {\n"
    "      const url = this._backdrops[k];\n"
    "      if (url) this._loadBackdrop(url);\n"
    "    }\n"
    "  }\n\n"
    "  _preloadResolvedBackdrops() {\n"
    "    if (!this._hass || !this._backdrops) return;\n"
    "    for (const key of Object.keys(this._backdrops)) {\n"
    "      const fallback = this._backdrops[key] || this._backdrops.default;\n"
    "      const url = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, key, fallback) || fallback;\n"
    "      if (url) this._loadBackdrop(url);\n"
    "    }\n"
    "  }",
    "  _preloadBackdropFor(key) {\n"
    "    if (!this._backdrops || !key) return;\n"
    "    const url = this._backdrops[key] || this._backdrops.default;\n"
    "    if (url) this._loadBackdrop(url);\n"
    "  }\n\n"
    "  _preloadResolvedBackdropFor(key) {\n"
    "    if (!this._hass || !this._backdrops || !key) return;\n"
    "    const fallback = this._backdrops[key] || this._backdrops.default;\n"
    "    const url = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, key, fallback) || fallback;\n"
    "    if (url) this._loadBackdrop(url);\n"
    "  }",
    'shell backdrop preload scope',
)
write(p, s)

p = 'dashboard-src/vite.config.ts'
s = read(p)
s = replace_once(
    s,
    "        // Um bundle só. O projeto atual faz 52 requisições separadas no cold\n"
    "        // start do tablet — este é o principal ganho de carregamento.\n"
    "        inlineDynamicImports: true,\n"
    "        entryFileNames: 'bruno-dashboard.[hash].js',",
    "        // Core da Home no entry; subviews pesadas ficam em chunks sob demanda.\n"
    "        entryFileNames: 'bruno-dashboard.[hash].js',\n"
    "        chunkFileNames: 'chunks/[name].[hash].js',",
    'vite split chunks',
)
write(p, s)

write(
    'dashboard-src/scripts/compress-output.mjs',
    """import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { brotliCompressSync, gzipSync, constants } from 'node:zlib';

const root = resolve(import.meta.dirname, '..', '..', 'config', 'www', 'dashboard');
const extensions = new Set(['.js', '.css', '.json', '.svg']);
const files = [];

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path);
    else if (extensions.has(extname(path)) && statSync(path).size >= 1024) files.push(path);
  }
}

walk(root);
for (const path of files) {
  const raw = readFileSync(path);
  writeFileSync(path + '.br', brotliCompressSync(raw, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }));
  writeFileSync(path + '.gz', gzipSync(raw, { level: 9 }));
}
console.log(`compressed ${files.length} dashboard assets`);
""",
)

p = 'dashboard-src/package.json'
package = json.loads(read(p))
package['scripts']['compress'] = 'node scripts/compress-output.mjs'
package['scripts']['build'] = 'vite build && npm run manifesto && npm run compress'
write(p, json.dumps(package, ensure_ascii=False, indent=2) + '\n')

write(
    'docs/34-implementacao-tv-performance-20260820.md',
    f"""# 34 — Implementação integral TV + cold start remoto (2026-08-20)

## Base e rollback

Esta candidata é aplicada somente na branch `fix/mobile-runtime-tv-curtain-20260819`.
`main` permanece intacto. Ponto anterior desta rodada: `{PRE}`.

Os arquivos substituídos antes da transformação foram copiados para:
`_rollback/20260820-pre-full-candidate/`.

## TV

- `media_player.smart_tv_pro_2`: autoridade de energia, volume e power.
- `media_player.smart_tv_pro`: reprodução, fonte, título e artwork.
- `remote.smart_tv_pro`: controle remoto.
- `media_player.android_tv_192_168_3_17`: retirado das decisões ativas do dashboard; a integração ADB não é desabilitada nesta candidata.
- removidas as janelas de graça de 45 s dos caminhos ativos.
- power deixa de usar `homeassistant.toggle`; a direção passa a ser explícita.

## Cold start remoto

- as árvores globais `button_card_templates` e `streamline_templates`, fora do grafo da shell ativa, deixam de ser parseadas.
- `lovelace.resource_mode: yaml` carrega somente o núcleo da candidata; a lista anterior de `.storage/lovelace_resources` não é apagada.
- subviews de cômodo, Câmeras, Roborock, Planta 3D e Music são carregadas por chunks sob demanda.
- o cold start aquece somente o backdrop da seção atual, não todos os cômodos.
- cada JS gerado recebe `.br` e `.gz` frescos no mesmo build.
- `window.brunoStartup` registra marcas de bootstrap e número/bytes de resources vistos pelo browser.

## Rollback físico

Copiar de `_rollback/20260820-pre-full-candidate/` para os mesmos caminhos no Everex e reiniciar o Home Assistant. Para o frontend, restaurar também o bundle `bruno-dashboard.9t_Xp8gv.js` e seus irmãos `.br/.gz` e a `configuration.yaml` anterior. Como `.storage/lovelace_resources` não é alterado, voltar `resource_mode` restaura a lista antiga sem reconstruí-la.

## Teste físico obrigatório antes de merge

1. cold start real pelo 5G;
2. Home sem `Erro de configuração`;
3. TV ligada por pelo menos 5 minutos: tile/card/hub permanecem ligados mesmo se a entidade ADB oscilar;
4. power liga/desliga; controle remoto abre; artwork/título aparecem quando o Cast publica mídia;
5. Spotify play/pause/volume;
6. Sala/Office, câmeras ONVIF, cortina e long-press;
7. abrir Câmeras, Roborock, Planta 3D, Music e uma subview de cômodo para validar os chunks lazy.
""",
)

print('full candidate source transformation applied')
