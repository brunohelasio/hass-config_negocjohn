from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
CONFIG = ROOT / "dashboard-src/src/config/rooms.config.ts"
TEST = ROOT / "dashboard-src/src/config/rooms.config.test.ts"
TILE = ROOT / "dashboard-src/src/components/rooms/bruno-room-tile.ts"

ROOMS = (
    "sala",
    "office",
    "cozinha",
    "lavabo",
    "casal",
    "marina",
    "miguel",
    "corredor",
)


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f"{label}: esperado 1 trecho, encontrado {count}")
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# Config central: V3 nomeada, com extensao explicita. Mantem rollback V2.
# ---------------------------------------------------------------------------
config = CONFIG.read_text(encoding="utf-8")
config = replace_once(
    config,
    "   * Caminhos completos dos assets, por estado.\n   *\n",
    "   * Caminhos completos dos assets, por estado. A extensao faz parte do caminho\n"
    "   * para o renderer nao impor PNG/WebP e o config continuar sendo a fonte unica.\n   *\n",
    "comentario RoomConfig.asset",
)
for room in ROOMS:
    old = f"    assetOff: 'v2/{room}-off',\n    assetOn: 'v2/{room}-on',"
    new = (
        f"    // ANTERIOR (rollback V2): assetOff: 'v2/{room}-off',\n"
        f"    // ANTERIOR (rollback V2): assetOn: 'v2/{room}-on',\n"
        f"    assetOff: 'v3/{room}-off.webp',\n"
        f"    assetOn: 'v3/{room}-on.webp',"
    )
    config = replace_once(config, old, new, f"assets {room}")
CONFIG.write_text(config, encoding="utf-8")

# ---------------------------------------------------------------------------
# Renderer: preserva a geometria calibrada, troca formato/cache e prioriza o
# estado visivel. Os dois estados continuam residentes para manter crossfade.
# ---------------------------------------------------------------------------
tile = TILE.read_text(encoding="utf-8")
old_css_comment = """    /* Assets V2: maquetes numa tela QUADRADA de 512x512 com cerca de 5% de
       margem transparente em volta. Os cards atuais usam PNGs \"tight\", em que o
       desenho encosta na borda do arquivo — por isso a mesma regra de CSS
       produz alturas diferentes nos dois.

       Estes tres valores existem para o CONTEUDO OPACO cair onde cai o do card
       real: altura de 81,7px e topo 2,3px acima da caixa do icone, que e o que
       alinha o desenho com a temperatura na coluna da direita. Medido com a
       caixa alfa de cada arquivo, nao calibrado no olho. A margem varia de 24 a
       32px entre os oito arquivos, o que deixa 1,2px de dispersao residual. */"""
new_css_comment = """    /* Assets V3: as fontes 1254x1254 sao normalizadas pelo pipeline para
       canvas 512x512, caixa visual de ~460px, centro X=256 e base Y=485. Esse
       envelope replica a geometria que este tile ja foi calibrado para usar;
       por isso escala e translacao abaixo permanecem deliberadamente iguais.

       A normalizacao e feita por PAR ON/OFF com a mesma transformacao, evitando
       salto de tamanho/posicao no crossfade. O WebP reduz transferencia sem
       aumentar o bitmap decodificado que o browser mantem em memoria. */"""
tile = replace_once(tile, old_css_comment, new_css_comment, "comentario CSS V3")

old_paths = """    // Caminho explicito da configuracao, nao montado por convencao: o Q. Casal
    // usa \"-generated-v3\" e existe um \"-tight\" orfao com outra dimensao, que a
    // convencao carregava por engano.
    // ANTERIOR (rollback): '20260803-normalized-2'
    //
    // Maquetes premium de 2026-08-08. A família inteira foi regerada com a Sala
    // como âncora de câmera, lente, plataforma e direção de luz — e desta vez
    // com caixa óptica IDÊNTICA nos 16 (460x452 em +26+34, centro X 256, último
    // Y 485). Os pares ON/OFF têm máscara alfa igual pixel a pixel, então a
    // troca de estado não desloca nem redimensiona nada.
    //
    // Os arquivos anteriores estão em _archive/assets/v2-anterior-20260808/.
    const v = '20260808-maquetes-premium-1';
    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}.png?v=${v}` : '';
    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}.png?v=${v}` : '';"""
new_paths = """    // Caminho explicito da configuracao. Na V3 a extensao pertence ao proprio
    // asset para o renderer nao impor um formato e permitir evolucao sem nova
    // regra de convencao.
    //
    // ANTERIOR (rollback V2): const v = '20260808-maquetes-premium-1';
    // ANTERIOR (rollback V2): `${room.assetOff}.png?v=${v}` / `${room.assetOn}.png?v=${v}`
    //
    // V3 de 2026-08-21: fontes 1254x1254 normalizadas para 512x512 e WebP q82.
    // O cache-bust muda junto com a familia; depois da primeira carga o browser
    // reutiliza os 16 arquivos sem depender de invalidacao manual.
    const v = '20260821-v3-webp-1';
    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}?v=${v}` : '';
    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}?v=${v}` : '';"""
tile = replace_once(tile, old_paths, new_paths, "resolver de assets")

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

# ---------------------------------------------------------------------------
# Regressao simples: todos os 8 comodos precisam usar os 16 WebPs V3 unicos.
# ---------------------------------------------------------------------------
test = TEST.read_text(encoding="utf-8")
needle = "assets de comodo usam V3 WebP normalizada"
if needle not in test:
    pos = test.rfind("\n});")
    if pos < 0:
        raise SystemExit("rooms.config.test.ts: fechamento do describe nao encontrado")
    block = """

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

print("V3 aplicada ao dashboard com sucesso")
