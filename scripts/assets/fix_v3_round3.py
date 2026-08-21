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


# 1) Josh: o modo tile continua sendo a linguagem da faixa no tablet/desktop,
# mas no PHONE os comodos voltam a ser cartelas translucidas. A Sala ja usa a
# superficie de card; os demais passam a cair no mesmo caminho padrao do
# BrunoRoomTile, que consome os mesmos surface-off/on tokens do VisionOS/Josh.
old_mode = """  private _tileModeCache: boolean | undefined;

  private get _tileMode(): boolean {
    if (this._config?.variant !== 'tile') return false;
    if (this._tileModeCache !== undefined) return this._tileModeCache;
    let value = '';
    try {
      value = getComputedStyle(this).getPropertyValue('--bruno-tile-mode').trim();
    } catch {
      value = '';
    }
    this._tileModeCache = value === 'on';
    return this._tileModeCache;
  }
"""
new_mode = """  private _tileModeCache: boolean | undefined;

  private get _joshHomeMode(): boolean {
    if (this._config?.variant !== 'tile') return false;
    if (this._tileModeCache !== undefined) return this._tileModeCache;
    let value = '';
    try {
      value = getComputedStyle(this).getPropertyValue('--bruno-tile-mode').trim();
    } catch {
      value = '';
    }
    this._tileModeCache = value === 'on';
    return this._tileModeCache;
  }

  private get _phoneJoshCard(): boolean {
    const phone = typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia('(max-width: 800px)').matches
      : false;
    return this._joshHomeMode && phone;
  }

  private get _tileMode(): boolean {
    return this._joshHomeMode && !this._phoneJoshCard;
  }
"""
replace_once(TILE, old_mode, new_mode, 'Josh: cards no phone, tiles no tablet')

old_classes = """    const cardClasses = [
      'room-card',
      on ? 'is-room-on' : '',
      this._tileMode ? 'is-tile' : '',
      this._tileMode && this._config?.divider_left ? 'has-divider' : '',
    ]
"""
new_classes = """    const cardClasses = [
      'room-card',
      on ? 'is-room-on' : '',
      this._phoneJoshCard ? 'is-josh-phone-card' : '',
      this._tileMode ? 'is-tile' : '',
      this._tileMode && this._config?.divider_left ? 'has-divider' : '',
    ]
"""
replace_once(TILE, old_classes, new_classes, 'classe Josh phone card')

# A cartela mobile usa o mesmo raio-base da Sala. Fundo, scrim, borda, blur,
# shadow e sheen ja sao os mesmos surface-* tokens; nao duplicamos esses valores.
old_mobile = """    @media (max-width: 800px) {
      .room-action {
        padding: clamp(8.58px, 5.03cqi, 14.3px) clamp(9.36px, 5.49cqi, 15.6px) clamp(7.8px, 4.57cqi, 13px) clamp(7.8px, 4.57cqi, 13px);
      }
      .room-icon {
        max-width: 100px;
        height: 62px;
      }
      .room-asset {
        height: 125%;
      }
    }
"""
new_mobile = """    @media (max-width: 800px) {
      .room-card.is-josh-phone-card {
        border-radius: var(--bruno-liquid-card-radius, 22px);
      }
      .room-card.is-josh-phone-card .room-action {
        border-radius: inherit;
      }
      .room-action {
        padding: clamp(8.58px, 5.03cqi, 14.3px) clamp(9.36px, 5.49cqi, 15.6px) clamp(7.8px, 4.57cqi, 13px) clamp(7.8px, 4.57cqi, 13px);
      }
      .room-icon {
        max-width: 100px;
        height: 62px;
      }
      .room-asset {
        height: 127.5%;
      }
    }
"""
replace_once(TILE, old_mobile, new_mobile, 'mobile Josh + escala 8%')

# 2) Escala V3: aplicar o pedido de +8% sobre os valores de referencia anteriores
# (111% tablet/desktop e 118% mobile). Round2 tinha aplicado apenas ~5-6%.
replace_once(
    TILE,
    """    .room-asset {
      position: absolute;
      top: 0;
      left: 0;
      height: 117%;
      width: auto;""",
    """    .room-asset {
      position: absolute;
      top: 0;
      left: 0;
      height: 120%;
      width: auto;""",
    'escala V3 tablet/desktop +8%',
)

# 3) Sala: mesma referencia visual. O baseline era 94%; +8% = 101.52%.
# Usamos 101.5% para manter valor estavel e legivel no CSS.
replace_once(
    SALA,
    """        .room-asset {
          width: 100%;
          height: 100%;
          object-fit: contain;""",
    """        .room-asset {
          width: 101.5%;
          height: 101.5%;
          object-fit: contain;""",
    'escala Sala V3 +8%',
)

print('V3 round3 aplicada: Josh mobile em cards e assets +8%')
