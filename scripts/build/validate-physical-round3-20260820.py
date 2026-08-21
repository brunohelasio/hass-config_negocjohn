#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ANDROID = 'media_player.android_tv_192_168_3_17'
POWER = 'media_player.smart_tv_pro_2'
REMOTE = 'remote.smart_tv_pro'

media = (ROOT / 'config/www/bruno-ui/cards/bruno-media-card.js').read_text(encoding='utf-8')
room = (ROOT / 'dashboard-src/src/components/rooms/bruno-room-subview.ts').read_text(encoding='utf-8')
active = (ROOT / 'config/packages/active_player.yaml').read_text(encoding='utf-8')

required_media = [
    "const BRUNO_MEDIA_HYBRID_RUNTIME = 'round3';",
    '_tvPowered() {',
    'if (!this._tvPowered()) return 0;',
    "focusId === BRUNO_MEDIA_TV_ENTITY && this._tvPowered()",
    'rememberedTv?.image',
]
for token in required_media:
    if token not in media:
        raise SystemExit(f'missing media-card round3 token: {token}')
if 'BRUNO_MEDIA_TV_OFF_GRACE_MS' in media:
    raise SystemExit('stale TV off grace reference remains in media card')

required_room = [
    "TV_HUB_HISTORY_KEY = 'bruno-ui:tv-hub-history:v1'",
    'private _carregarHistoricoTv(): void',
    'private _salvarHistoricoTv(): void',
    "perform_action: 'remote.send_command'",
    "comando('DPAD_CENTER')",
    'media_player_id: mediaId',
]
for token in required_room:
    if token not in room:
        raise SystemExit(f'missing room-subview round3 token: {token}')

# Round5 adiciona labels aos mesmos botões sem mudar comando/entidade.
if not any(token in room for token in [
    "tecla('home', 'mdi:home', 'HOME')",
    "tecla('home', 'mdi:home', 'HOME', 'Início')",
]):
    raise SystemExit('missing HOME command in room-subview')
if not any(token in room for token in [
    "tecla('volume_up', 'mdi:volume-plus', 'VOLUME_UP')",
    "tecla('volume_up', 'mdi:volume-plus', 'VOLUME_UP', 'Vol +', true)",
]):
    raise SystemExit('missing VOLUME_UP command in room-subview')

if '// TV_REMOTE_PREMIUM_RUNTIME: round5' in room:
    premium_tokens = [
        "title: 'Controle da TV'",
        'radial-gradient(360px 240px at 18% -10%',
        'backdrop-filter: blur(20px) saturate(1.18) brightness(1.03)',
        "tecla('power', 'mdi:power', 'POWER', 'Power')",
        "tecla('channel_up', 'mdi:chevron-up', 'CHANNEL_UP', 'Canal +', true)",
        'styles: estiloNavegacao',
        'styles: estilosVision',
    ]
    for token in premium_tokens:
        if token not in room:
            raise SystemExit(f'missing premium remote round5 token: {token}')

if 'button.tv_sala_' in room:
    raise SystemExit('legacy button.tv_sala_* remote mapping remains')

# A round3 garantia que volume não voltasse à entidade POWER sem suporte.
# A round4 evolui o contrato: TV usa remote.send_command; demais players
# continuam usando media_player. Mantemos apenas a proibição da regressão POWER.
if f"{{{{ '{POWER}' if player == '{ANDROID}' else player }}}}" in active:
    raise SystemExit('TV volume step still routed to POWER entity')
if f"{{{{ '{POWER}' if focused_player == '{ANDROID}' else focused_player }}}}" in active:
    raise SystemExit('TV mute still routed to POWER entity')

print('round3/round5 validation passed')
print('TV_POWER_ENTITY', POWER)
print('TV_MEDIA_ENTITY', ANDROID)
print('TV_REMOTE_ENTITY', REMOTE)
