from __future__ import annotations

from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "dashboard-src/src/config/rooms.config.ts"
TEST = ROOT / "dashboard-src/src/config/rooms.config.test.ts"
TILE = ROOT / "dashboard-src/src/components/rooms/bruno-room-tile.ts"

ROOMS = {
    "sala": "sala",
    "office": "office",
    "cozinha": "cozinha",
    "lavabo": "lavabo",
    "casal": "quarto-casal",
    "marina": "quarto-menina",
    "miguel": "quarto-bebe",
    "corredor": "corredor",
}


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: esperado 1 trecho, encontrado {count}")
    return text.replace(old, new, 1)


# Config: altera somente a familia de assets. Toda a logica TV/Office da #602 permanece.
config = CONFIG.read_text(encoding="utf-8")
config = replace_once(
    config,
    "   * Caminhos completos dos assets, por estado.\n   *\n",
    "   * Caminhos completos dos assets, por estado. A extensao faz parte do caminho\n"
    "   * para o renderer nao impor PNG/WebP e o config continuar sendo a fonte unica.\n   *\n",
    "comentario RoomConfig.asset",
)
for room, legacy_stem in ROOMS.items():
    old = f"    assetOff: 'v2/{legacy_stem}-off',\n    assetOn: 'v2/{legacy_stem}-on',"
    new = (
        f"    // ANTERIOR (rollback V2): assetOff: 'v2/{legacy_stem}-off',\n"
        f"    // ANTERIOR (rollback V2): assetOn: 'v2/{legacy_stem}-on',\n"
        f"    assetOff: 'v3/{room}-off.webp',\n"
        f"    assetOn: 'v3/{room}-on.webp',"
    )
    config = replace_once(config, old, new, f"assets {room}")
CONFIG.write_text(config, encoding="utf-8")

# Tile: preserva toda a logica de runtime da #602 e muda apenas assets/carregamento.
tile = TILE.read_text(encoding="utf-8")
pattern_css = re.compile(r"    /\* Assets V2:.*?residual\. \*/(?=\n    \.room-asset \{)", re.S)
new_css = """    /* Assets V3: as fontes 1254x1254 sao normalizadas pelo pipeline para
       canvas 512x512, caixa visual de ~460px, centro X=256 e base Y=485. Esse
       envelope replica a geometria que este tile ja foi calibrado para usar;
       por isso escala e translacao abaixo permanecem deliberadamente iguais.

       A normalizacao e feita por PAR ON/OFF com a mesma transformacao, evitando
       salto de tamanho/posicao no crossfade. O WebP reduz transferencia sem
       aumentar o bitmap decodificado que o browser mantem em memoria. */"""
tile, n = pattern_css.subn(new_css, tile, count=1)
if n != 1:
    raise SystemExit(f"comentario CSS V3: esperado 1 trecho, encontrado {n}")

old_paths = """    const v = '20260820-webp-runtime-2';
    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}.webp?v=${v}` : '';
    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}.webp?v=${v}` : '';"""
new_paths = """    const v = '20260821-v3-webp-1';
    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}?v=${v}` : '';
    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}?v=${v}` : '';"""
tile = replace_once(tile, old_paths, new_paths, "resolver de assets V3")

old_off = 'html`<img class="room-asset room-asset-off" src=${off} alt="" decoding="async" />`'
new_off = (
    'html`<img class="room-asset room-asset-off" src=${off} alt="" width="512" height="512" '
    'loading="eager" decoding="async" fetchpriority=${on ? \'low\' : \'high\'} />`'
)
tile = replace_once(tile, old_off, new_off, "img OFF")
old_on = 'html`<img class="room-asset room-asset-on" src=${onImg} alt="" decoding="async" />`'
new_on = (
    'html`<img class="room-asset room-asset-on" src=${onImg} alt="" width="512" height="512" '
    'loading="eager" decoding="async" fetchpriority=${on ? \'high\' : \'low\'} />`'
)
tile = replace_once(tile, old_on, new_on, "img ON")
TILE.write_text(tile, encoding="utf-8")

# Teste de regressao da familia de assets.
test = TEST.read_text(encoding="utf-8")
needle = "assets de comodo usam V3 WebP normalizada"
if needle not in test:
    pos = test.rfind("\n});")
    if pos < 0:
        raise SystemExit("rooms.config.test.ts: fechamento do describe nao encontrado")
    block = r"""

  it('assets de comodo usam V3 WebP normalizada', () => {
    const assets = ROOMS.flatMap((room) => [room.assetOff, room.assetOn]);
    expect(assets).toHaveLength(ROOMS.length * 2);
    expect(new Set(assets).size).toBe(ROOMS.length * 2);
    for (const room of ROOMS) {
      expect(room.assetOff, `${room.id}.assetOff`).toMatch(/^v3\/.+-off\.webp$/);
      expect(room.assetOn, `${room.id}.assetOn`).toMatch(/^v3\/.+-on\.webp$/);
    }
  });
"""
    test = test[:pos] + block + test[pos:]
TEST.write_text(test, encoding="utf-8")

print("V3 aplicada sobre o runtime validado da #602")
