from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TILE = ROOT / 'dashboard-src/src/components/rooms/bruno-room-tile.ts'
SALA = ROOT / 'config/www/bruno-ui/cards/bruno-sala-card.js'


def replace_once(path: Path, old: str, new: str, label: str) -> None:
    text = path.read_text(encoding='utf-8')
    if new in text:
        print(f'{label}: ja aplicado')
        return
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: esperado 1 trecho, encontrado {count}')
    path.write_text(text.replace(old, new, 1), encoding='utf-8')
    print(f'{label}: aplicado')


# 1) Forca nova requisicao dos assets. O round1 chegou a pedir estes mesmos URLs
# quando o diretorio ainda estava com caixa incorreta; alguns clientes mantiveram
# o resultado quebrado. Mudar somente o cache-bust invalida essa resposta sem
# alterar a familia de arquivos.
replace_once(
    TILE,
    "    const v = '20260821-v3-webp-1';",
    "    const v = '20260821-v3-webp-2';",
    'cache-bust V3',
)

# 2) Aumento visual leve e uniforme dos tiles V3. Mantem a mesma geometria e
# transformacao; sobe apenas a altura renderizada em ~5-6%.
replace_once(
    TILE,
    """    .room-asset {
      position: absolute;
      top: 0;
      left: 0;
      height: 111%;
      width: auto;""",
    """    .room-asset {
      position: absolute;
      top: 0;
      left: 0;
      height: 117%;
      width: auto;""",
    'escala V3 tablet/desktop',
)
replace_once(
    TILE,
    """      .room-asset {
        height: 118%;
      }""",
    """      .room-asset {
        height: 125%;
      }""",
    'escala V3 mobile',
)

# 3) A Sala nao usa BrunoRoomTile na Home: continua no card legado consolidado
# no bundle. Round1 alterou rooms.config.ts, mas este card manteve V2 no phone e
# os antigos *-tight no tablet/desktop. Troca os dois estados para a mesma V3.
old_sala = """        <span class=\"room-asset-fallback\">${BrunoSalaCard._roomIcon(active)}</span>
        <picture>
          <!-- O source V2 e exclusivo do phone; o img preserva integralmente
               o asset anterior em tablet/desktop e funciona como rollback. -->
          <source media=\"(max-width: 800px)\" srcset=\"/local/bruno-ui/assets/v2/sala-off.png?v=20260808-maquetes-premium-1\">
          <img class=\"room-asset room-asset-off\" src=\"/local/bruno-ui/assets/living-room-off-tight.png?v=20260802-assets-resize-1\" alt=\"\" loading=\"eager\" decoding=\"async\">
        </picture>
        <picture>
          <source media=\"(max-width: 800px)\" srcset=\"/local/bruno-ui/assets/v2/sala-on.png?v=20260808-maquetes-premium-1\">
          <img class=\"room-asset room-asset-on\" src=\"/local/bruno-ui/assets/living-room-on-tight.png?v=20260802-assets-resize-1\" alt=\"\" loading=\"eager\" decoding=\"async\">
        </picture>"""
new_sala = """        <span class=\"room-asset-fallback\">${BrunoSalaCard._roomIcon(active)}</span>
        <picture>
          <!-- V3 unica em todos os breakpoints; rollback permanece no historico Git. -->
          <source media=\"(max-width: 800px)\" srcset=\"/local/bruno-ui/assets/v3/sala-off.webp?v=20260821-v3-webp-2\">
          <img class=\"room-asset room-asset-off\" src=\"/local/bruno-ui/assets/v3/sala-off.webp?v=20260821-v3-webp-2\" alt=\"\" width=\"512\" height=\"512\" loading=\"eager\" decoding=\"async\">
        </picture>
        <picture>
          <source media=\"(max-width: 800px)\" srcset=\"/local/bruno-ui/assets/v3/sala-on.webp?v=20260821-v3-webp-2\">
          <img class=\"room-asset room-asset-on\" src=\"/local/bruno-ui/assets/v3/sala-on.webp?v=20260821-v3-webp-2\" alt=\"\" width=\"512\" height=\"512\" loading=\"eager\" decoding=\"async\">
        </picture>"""
replace_once(SALA, old_sala, new_sala, 'Sala V3 todos breakpoints')

# O card legado da Sala usa uma caixa diferente dos BrunoRoomTile; o equivalente
# visual do mesmo bump leve e passar de 94% para 100%.
replace_once(
    SALA,
    """        .room-asset {
          width: 94%;
          height: 94%;
          object-fit: contain;""",
    """        .room-asset {
          width: 100%;
          height: 100%;
          object-fit: contain;""",
    'escala Sala V3',
)

print('V3 round2 aplicada')
