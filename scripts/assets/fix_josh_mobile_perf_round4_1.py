from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TILE = ROOT / 'dashboard-src/src/components/rooms/bruno-room-tile.ts'
SALA = ROOT / 'config/www/bruno-ui/cards/bruno-sala-card.js'


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding='utf-8')
    old_count = text.count(old)
    new_count = text.count(new)
    if old_count == 1:
        path.write_text(text.replace(old, new, 1), encoding='utf-8')
        print(f'{label}: aplicado')
        return
    if old_count == 0 and new_count >= 1:
        print(f'{label}: ja aplicado')
        return
    raise SystemExit(
        f'{label}: esperado 1 trecho antigo ou patch ja aplicado; '
        f'antigo={old_count} novo={new_count}'
    )


# O Josh foi deliberadamente reduzido a microblur de 2px para evitar varias
# backdrop roots pesadas na Home. O round4 reforca o material com SCRIM e SHEEN,
# portanto nao precisa reintroduzir blur de 10/12px por card.
#
# IMPORTANTE: troca primeiro a variante -webkit-. Assim `backdrop-filter:` nao
# casa como substring dentro dela e cada substituicao continua deterministica.
for path, prefix in ((TILE, 'tile'), (SALA, 'Sala')):
    replace_once(
        path,
        '-webkit-backdrop-filter: blur(10px) saturate(1.10);',
        '-webkit-backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.10);',
        f'{prefix} OFF microblur webkit',
    )
    replace_once(
        path,
        'backdrop-filter: blur(10px) saturate(1.10);',
        'backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.10);',
        f'{prefix} OFF microblur',
    )
    replace_once(
        path,
        '-webkit-backdrop-filter: blur(12px) saturate(1.13) brightness(1.035);',
        '-webkit-backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.13) brightness(1.035);',
        f'{prefix} ON microblur webkit',
    )
    replace_once(
        path,
        'backdrop-filter: blur(12px) saturate(1.13) brightness(1.035);',
        'backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.13) brightness(1.035);',
        f'{prefix} ON microblur',
    )

for path in (TILE, SALA):
    text = path.read_text(encoding='utf-8')
    if 'backdrop-filter: blur(10px) saturate(1.10)' in text:
        raise SystemExit(f'{path}: blur OFF pesado do round4 ainda presente')
    if 'backdrop-filter: blur(12px) saturate(1.13)' in text:
        raise SystemExit(f'{path}: blur ON pesado do round4 ainda presente')

print('Round4.1: microblur Josh preservado')
