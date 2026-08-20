#!/usr/bin/env python3
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
ANDROID = 'media_player.android_tv_192_168_3_17'

ACTIVE_TV_FILES = [
    'dashboard-src/src/config/subviews.config.ts',
    'dashboard-src/src/config/rooms.config.ts',
    'dashboard-src/src/components/rooms/bruno-room-subview.ts',
    'config/www/bruno-ui/cards/bruno-sala-card.js',
    'config/www/bruno-ui/cards/bruno-media-card.js',
    'config/packages/active_player.yaml',
    'config/packages/home_activity.yaml',
    'config/packages/sala_tv_controls.yaml',
]

for relative in ACTIVE_TV_FILES:
    path = ROOT / relative
    text = path.read_text(encoding='utf-8')
    text = text.replace('media_player.smart_tv_pro_2', ANDROID)
    text = text.replace('media_player.smart_tv_pro', ANDROID)
    text = text.replace('remote.smart_tv_pro', 'remote.atv')

    # A transformação anterior separava power/media. Com Android como fonte
    # única, evitamos duplicar a mesma entidade na lista de players da Sala.
    if relative == 'dashboard-src/src/config/rooms.config.ts':
        duplicate = f"        '{ANDROID}',\n        '{ANDROID}',\n"
        text = text.replace(duplicate, f"        '{ANDROID}',\n")

    # Mantemos tvMedia explicitamente apontando para a própria Android TV para
    # que artwork/título/source venham da entidade que já era usada no painel.
    if relative == 'dashboard-src/src/config/subviews.config.ts':
        text = text.replace(
            '// TV: energia/comandos = Android TV Remote; mídia/arte = Cast.',
            '// TV: Android TV é a fonte única de estado, mídia e artwork; remote.atv é o controle remoto.',
        )

    path.write_text(text, encoding='utf-8')

# A documentação gerada pela candidata deve registrar a decisão final, não a
# tentativa intermediária de usar as entidades Smart TV Pro para artwork.
doc_path = ROOT / 'docs' / '34-implementacao-tv-performance-20260820.md'
if doc_path.exists():
    doc = doc_path.read_text(encoding='utf-8')
    doc = doc.replace('media_player.smart_tv_pro_2', ANDROID)
    doc = doc.replace('media_player.smart_tv_pro', ANDROID)
    doc = doc.replace('remote.smart_tv_pro', 'remote.atv')
    note = f"""

## Decisão final da TV — Android preservada

A entidade ativa do dashboard permanece `{ANDROID}` para estado, reprodução,
título, source, volume e artwork. Essa decisão é deliberada: a adoção da
entidade Android no painel ocorreu porque as entidades Smart TV Pro não
forneciam de forma suficiente a arte da mídia reproduzida. `remote.atv` é
mantido apenas como entidade de controle remoto (nome legado; não implica Apple
TV). As entidades Smart TV Pro continuam existindo no Home Assistant, mas não
participam desta candidata ativa.
"""
    if '## Decisão final da TV — Android preservada' not in doc:
        doc += note
    doc_path.write_text(doc, encoding='utf-8')

print('Android TV preserved as the active dashboard TV/media/artwork entity')
