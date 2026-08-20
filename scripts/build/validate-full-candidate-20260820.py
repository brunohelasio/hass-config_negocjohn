#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'config' / 'www' / 'dashboard'

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

required = [entry, Path(str(entry) + '.br'), Path(str(entry) + '.gz')]
chunks = sorted((OUT / 'chunks').glob('*.js'))
if not chunks:
    raise SystemExit('no lazy chunks generated')
for path in required + chunks:
    if not path.exists():
        raise SystemExit(f'missing {path}')
for path in chunks:
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
    if 'remote.atv' in active:
        raise SystemExit(f'remote.atv still active in {relative}')
    if 'media_player.android_tv_192_168_3_17' in active:
        raise SystemExit(f'ADB still active in {relative}')

subviews = (ROOT / 'dashboard-src/src/config/subviews.config.ts').read_text(encoding='utf-8')
for required_token in [
    "tv: 'media_player.smart_tv_pro_2'",
    "tvMedia: 'media_player.smart_tv_pro'",
    "tvRemote: 'remote.smart_tv_pro'",
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
print('ENTRY_BR', Path(str(entry) + '.br').stat().st_size)
print('CHUNKS', len(chunks))
for path in chunks:
    print('CHUNK', path.name, path.stat().st_size, Path(str(path) + '.br').stat().st_size)
print('candidate validation passed')
