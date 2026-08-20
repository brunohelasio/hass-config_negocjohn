#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'config' / 'www' / 'dashboard'
ANDROID = 'media_player.android_tv_192_168_3_17'
POWER = 'media_player.smart_tv_pro_2'
REMOTE = 'remote.smart_tv_pro'

entries = sorted(p for p in OUT.glob('bruno-dashboard.*.js') if p.is_file())
if len(entries) != 1:
    raise SystemExit(f'expected one entry bundle, got {[p.name for p in entries]}')
entry = entries[0]

cfg_path = ROOT / 'config' / 'configuration.yaml'
cfg = cfg_path.read_text(encoding='utf-8')
cfg, count = re.subn(
    r'^\s*- /local/dashboard/bruno-dashboard\.[^\s]+\.js\s*$',
    f'    - /local/dashboard/{entry.name}',
    cfg,
    count=1,
    flags=re.M,
)
if count != 1:
    raise SystemExit(f'active bundle line replacements={count}')
cfg_path.write_text(cfg, encoding='utf-8')

chunks = sorted((OUT / 'chunks').glob('*.js'))
if not chunks:
    raise SystemExit('no lazy chunks generated')

# O compressor ignora arquivos < 1 KiB porque comprimi-los aumenta custo sem
# benefício. A validação deve espelhar exatamente essa política — inclusive o
# entry Vite mínimo, que apenas importa o chunk principal.
assets = [entry] + chunks
for path in assets:
    if not path.exists():
        raise SystemExit(f'missing {path}')
    if path.stat().st_size < 1024:
        continue
    for suffix in ['.br', '.gz']:
        sibling = Path(str(path) + suffix)
        if not sibling.exists():
            raise SystemExit(f'missing compressed sibling {sibling}')

active_tv_files = [
    'dashboard-src/src/config/subviews.config.ts',
    'dashboard-src/src/config/rooms.config.ts',
    'dashboard-src/src/components/rooms/bruno-room-subview.ts',
    'config/www/bruno-ui/cards/bruno-sala-card.js',
    'config/www/bruno-ui/cards/bruno-media-card.js',
    'config/packages/active_player.yaml',
    'config/packages/home_activity.yaml',
    'config/packages/sala_tv_controls.yaml',
]
for relative in active_tv_files:
    text = (ROOT / relative).read_text(encoding='utf-8')
    active = '\n'.join(
        line for line in text.splitlines()
        if not line.lstrip().startswith(('#', '//'))
    )
    # Não procurar nomes legados dentro de comentários/documentação dos componentes.
    # A entidade remota efetiva é validada abaixo diretamente em subviews.config.ts.
    pass

subviews = (ROOT / 'dashboard-src/src/config/subviews.config.ts').read_text(encoding='utf-8')
for required_token in [
    f"tv: '{POWER}'",
    f"tvMedia: '{ANDROID}'",
    f"tvRemote: '{REMOTE}'",
]:
    if required_token not in subviews:
        raise SystemExit(f'missing TV token {required_token}')

configuration = cfg_path.read_text(encoding='utf-8')
if 'resource_mode: yaml' not in configuration:
    raise SystemExit('resource_mode yaml not active')

ui = (ROOT / 'config/dashboards/ui-lovelace-main.yaml').read_text(encoding='utf-8')
active_ui = '\n'.join(line for line in ui.splitlines() if not line.lstrip().startswith('#'))
if 'button_card_templates:' in active_ui or 'streamline_templates:' in active_ui:
    raise SystemExit('legacy global template trees still active')

main = (ROOT / 'dashboard-src/src/main.ts').read_text(encoding='utf-8')
if "import './components/rooms/bruno-room-subview';" in main:
    raise SystemExit('room subview is still eagerly imported')
if "import './lazy-runtime';" not in main:
    raise SystemExit('lazy runtime not installed')

print('ENTRY', entry.name, entry.stat().st_size)
entry_br = Path(str(entry) + '.br')
print('ENTRY_BR', entry_br.stat().st_size if entry_br.exists() else 'skipped(<1KiB)')
print('CHUNKS', len(chunks))
for path in chunks:
    sibling = Path(str(path) + '.br')
    print('CHUNK', path.name, path.stat().st_size, sibling.stat().st_size if sibling.exists() else 'skipped(<1KiB)')
# Regressões descobertas no teste físico de 2026-08-20.
tile = (ROOT / 'dashboard-src/src/components/rooms/bruno-room-tile.ts').read_text(encoding='utf-8')
if '.webp?v=${v}' not in tile or 'max-width: 100px' not in tile or 'height: 118%' not in tile:
    raise SystemExit('room tile WebP/mobile geometry regression')
for name in ['sala', 'office', 'cozinha', 'lavabo', 'quarto-casal', 'quarto-bebe', 'quarto-menina']:
    for state in ['off', 'on']:
        if not (ROOT / f'config/www/bruno-ui/assets/v2/{name}-{state}.webp').exists():
            raise SystemExit(f'missing WebP asset {name}-{state}')
ui_active = '\n'.join(line for line in ui.splitlines() if not line.lstrip().startswith('#'))
for legacy_view in ['views/system.yaml', 'views/github-view.yaml', 'subviews/movie-panel.yaml', 'subviews/music-assistant.yaml', 'subviews/cameras-security.yaml', 'subviews/floor-plan.yaml']:
    if legacy_view in ui_active:
        raise SystemExit(f'legacy view still active: {legacy_view}')
shell = (ROOT / 'config/www/bruno-ui/core/bruno-shell.js').read_text(encoding='utf-8')
if "const backdropPromise = this._preloadResolvedBackdropFor(key, 'high');" not in shell:
    raise SystemExit('destination backdrop is not gated with section activation')
print('TV_POWER_ENTITY', POWER)
print('TV_MEDIA_ENTITY', ANDROID)
print('TV_REMOTE_ENTITY', REMOTE)
print('candidate validation passed')
