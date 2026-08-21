from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TILE = ROOT / 'dashboard-src/src/components/rooms/bruno-room-tile.ts'
ROOMS = ROOT / 'dashboard-src/src/config/rooms.config.ts'
ROOMS_TEST = ROOT / 'dashboard-src/src/config/rooms.config.test.ts'
SALA = ROOT / 'config/www/bruno-ui/cards/bruno-sala-card.js'
LAVABO = ROOT / 'config/packages/lavabo_presence.yaml'
CORREDOR = ROOT / 'config/packages/corredor_presence.yaml'


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


# ---------------------------------------------------------------------------
# 1) Josh tablet/desktop: ON precisa ser legivel sem transformar tile em card.
#    Mantem a faixa flat, sem blur/borda/sombra propria; reforca apenas estado:
#    wash leitoso muito leve + filete quente + glow + texto mais presente.
# ---------------------------------------------------------------------------
old_tile_state = """    .room-card.is-tile::before,
    .room-card.is-tile.is-room-on::before {
      opacity: var(--bruno-tile-sheen-opacity, 0);
    }

    .room-card.is-tile.is-room-on::after {
      inset: auto clamp(10.92px, 6.4cqi, 18.2px) 0 clamp(10.92px, 6.4cqi, 18.2px);
      opacity: 1;
      background: var(
        --bruno-tile-on-line,
        linear-gradient(90deg, rgba(255, 187, 72, 0) 0%, rgba(255, 187, 72, 0.42) 50%, rgba(255, 187, 72, 0) 100%)
      );
    }
"""
new_tile_state = """    .room-card.is-tile::before,
    .room-card.is-tile.is-room-on::before {
      opacity: var(--bruno-tile-sheen-opacity, 0);
    }

    /* Josh ON: reforco sem reintroduzir uma cartela. A leitura vem de luz,
       nao de moldura: wash leitoso discreto, filete quente e glow de base. */
    .room-card.is-tile.is-room-on {
      --text-main: rgba(255, 252, 245, 0.99);
      --text-soft: rgba(255, 245, 226, 0.72);
      --text-muted: rgba(255, 247, 232, 0.76);
      --bruno-tile-on-line: linear-gradient(
        90deg,
        rgba(255, 194, 104, 0) 0%,
        rgba(255, 202, 122, 0.78) 50%,
        rgba(255, 194, 104, 0) 100%
      );
      --bruno-tile-on-glow: radial-gradient(
        82px 38px at 50% 100%,
        rgba(255, 194, 102, 0.22),
        rgba(255, 216, 156, 0.07) 48%,
        transparent 76%
      );
    }

    .room-card.is-tile.is-room-on::before {
      inset: 1px 2px 1px;
      border-radius: 0;
      background:
        radial-gradient(92% 78% at 50% 100%, rgba(255, 204, 126, 0.12), transparent 72%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.070), rgba(255, 247, 232, 0.025) 62%, transparent);
      opacity: 1;
    }

    .room-card.is-tile.is-room-on::after {
      inset: auto clamp(10.92px, 6.4cqi, 18.2px) 0 clamp(10.92px, 6.4cqi, 18.2px);
      opacity: 1;
      background: var(
        --bruno-tile-on-line,
        linear-gradient(90deg, rgba(255, 187, 72, 0) 0%, rgba(255, 187, 72, 0.42) 50%, rgba(255, 187, 72, 0) 100%)
      );
      box-shadow: 0 -2px 11px rgba(255, 194, 102, 0.17);
    }
"""
replace_once(TILE, old_tile_state, new_tile_state, 'Josh tile ON')


# ---------------------------------------------------------------------------
# 2) Josh mobile: cartela volta a ter corpo. OFF recebe scrim translucido;
#    ON ganha material leitoso quente. O mesmo material sera aplicado a Sala.
# ---------------------------------------------------------------------------
old_phone = """    @media (max-width: 800px) {
      .room-card.is-josh-phone-card {
        border-radius: var(--bruno-liquid-card-radius, 22px);
      }
      .room-card.is-josh-phone-card .room-action {
        border-radius: inherit;
      }
"""
new_phone = """    @media (max-width: 800px) {
      .room-card.is-josh-phone-card {
        border-radius: var(--bruno-liquid-card-radius, 22px);
        background:
          radial-gradient(150px 118px at 14% -8%, rgba(255, 255, 255, 0.12), transparent 72%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025) 46%, rgba(0, 0, 0, 0.045)),
          rgba(13, 14, 17, 0.34);
        border: 1px solid rgba(255, 255, 255, 0.135);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.13),
          0 10px 26px rgba(0, 0, 0, 0.19);
        backdrop-filter: blur(10px) saturate(1.10);
        -webkit-backdrop-filter: blur(10px) saturate(1.10);
      }
      .room-card.is-josh-phone-card::before {
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.085), transparent 36%),
          linear-gradient(90deg, rgba(255, 255, 255, 0.035), transparent 52%);
        opacity: 0.72;
      }
      .room-card.is-josh-phone-card.is-room-on {
        --text-main: rgba(255, 253, 248, 0.99);
        --text-soft: rgba(255, 246, 230, 0.72);
        --text-muted: rgba(255, 248, 236, 0.76);
        background:
          radial-gradient(175px 138px at 16% -10%, rgba(255, 252, 245, 0.30), transparent 72%),
          radial-gradient(155px 120px at 92% 100%, rgba(255, 207, 135, 0.13), transparent 72%),
          linear-gradient(180deg, rgba(255, 250, 240, 0.18), rgba(255, 242, 222, 0.075) 48%, rgba(44, 31, 22, 0.10)),
          rgba(30, 27, 24, 0.42);
        border-color: rgba(255, 244, 225, 0.275);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.27),
          inset 0 -1px 0 rgba(255, 213, 151, 0.07),
          0 0 24px rgba(255, 205, 132, 0.09),
          0 12px 28px rgba(0, 0, 0, 0.21);
        backdrop-filter: blur(12px) saturate(1.13) brightness(1.035);
        -webkit-backdrop-filter: blur(12px) saturate(1.13) brightness(1.035);
      }
      .room-card.is-josh-phone-card.is-room-on::before {
        background:
          radial-gradient(120px 86px at 18% 0%, rgba(255, 255, 255, 0.22), transparent 74%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 42%);
        opacity: 0.88;
      }
      .room-card.is-josh-phone-card .room-action {
        border-radius: inherit;
      }
"""
replace_once(TILE, old_phone, new_phone, 'Josh mobile material')


# Sala e a referencia do mobile: aplica a mesma receita material, sem alterar
# tablet/desktop. O card ja recebe `is-josh-theme` pelo tema ativo.
sala_anchor = """        .room-icon.has-image-error .room-asset-fallback {
          opacity: 1;
        }

        .metric {
"""
sala_material = """        .room-icon.has-image-error .room-asset-fallback {
          opacity: 1;
        }

        @media (max-width: 800px) {
          .sala-card.is-josh-theme {
            background:
              radial-gradient(150px 118px at 14% -8%, rgba(255,255,255,0.12), transparent 72%),
              linear-gradient(180deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025) 46%, rgba(0,0,0,0.045)),
              rgba(13,14,17,0.34);
            border: 1px solid rgba(255,255,255,0.135);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.13),
              0 10px 26px rgba(0,0,0,0.19);
            backdrop-filter: blur(10px) saturate(1.10);
            -webkit-backdrop-filter: blur(10px) saturate(1.10);
          }
          .sala-card.is-josh-theme::before {
            background:
              linear-gradient(180deg, rgba(255,255,255,0.085), transparent 36%),
              linear-gradient(90deg, rgba(255,255,255,0.035), transparent 52%);
            opacity: 0.72;
          }
          .sala-card.is-josh-theme.is-room-on {
            --text-main: rgba(255,253,248,0.99);
            --text-soft: rgba(255,246,230,0.72);
            --text-muted: rgba(255,248,236,0.76);
            background:
              radial-gradient(175px 138px at 16% -10%, rgba(255,252,245,0.30), transparent 72%),
              radial-gradient(155px 120px at 92% 100%, rgba(255,207,135,0.13), transparent 72%),
              linear-gradient(180deg, rgba(255,250,240,0.18), rgba(255,242,222,0.075) 48%, rgba(44,31,22,0.10)),
              rgba(30,27,24,0.42);
            border-color: rgba(255,244,225,0.275);
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.27),
              inset 0 -1px 0 rgba(255,213,151,0.07),
              0 0 24px rgba(255,205,132,0.09),
              0 12px 28px rgba(0,0,0,0.21);
            backdrop-filter: blur(12px) saturate(1.13) brightness(1.035);
            -webkit-backdrop-filter: blur(12px) saturate(1.13) brightness(1.035);
          }
          .sala-card.is-josh-theme.is-room-on::before {
            background:
              radial-gradient(120px 86px at 18% 0%, rgba(255,255,255,0.22), transparent 74%),
              linear-gradient(180deg, rgba(255,255,255,0.12), transparent 42%);
            opacity: 0.88;
          }
        }

        .metric {
"""
replace_once(SALA, sala_anchor, sala_material, 'Sala Josh mobile material')


# ---------------------------------------------------------------------------
# 3) Lavabo: o frontend consolidado tinha motion/occupancy, mas nenhuma fonte
#    semantica. Isso deixa a linha de sensor silenciosa. Cria uma fonte estavel
#    e explicita indisponibilidade do sensor bruto em vez de sumir.
# ---------------------------------------------------------------------------
replace_once(
    ROOMS,
    """      motionRecent: 'binary_sensor.lavabo_motion_recent',
      occupancy: 'binary_sensor.lavabo_occupancy',
      illuminance: 'sensor.lv_sensor_presenca_iluminancia',""",
    """      motionRecent: 'binary_sensor.lavabo_motion_recent',
      occupancy: 'binary_sensor.lavabo_occupancy',
      semanticState: 'sensor.lavabo_semantic_state',
      illuminance: 'sensor.lv_sensor_presenca_iluminancia',""",
    'Lavabo semanticState',
)

lavabo_semantic = """

      # Linha semantica consumida pelo BrunoRoomTile. O card deixa de parecer
      # "sem sensor" e, se o Tuya ficar fora do ar, informa isso explicitamente.
      - name: Lavabo Semantic State
        default_entity_id: sensor.lavabo_semantic_state
        unique_id: lavabo_semantic_state
        icon: mdi:motion-sensor
        state: >-
          {% set source = states('binary_sensor.lv_sensor_presenca_movimento') %}
          {% if source in ['unknown', 'unavailable', 'none', ''] %}sensor_offline
          {% elif is_state('binary_sensor.lavabo_motion_recent', 'on') %}motion
          {% elif is_state('binary_sensor.lavabo_occupancy', 'on') %}recent
          {% else %}none
          {% endif %}
        attributes:
          display: >-
            {% set source = states('binary_sensor.lv_sensor_presenca_movimento') %}
            {% if source in ['unknown', 'unavailable', 'none', ''] %}Sensor indisponivel
            {% elif is_state('binary_sensor.lavabo_motion_recent', 'on') %}Presenca
            {% elif is_state('binary_sensor.lavabo_occupancy', 'on') %}Presenca recente
            {% else %}
            {% endif %}
          source_entity: binary_sensor.lv_sensor_presenca_movimento
          source_state: "{{ states('binary_sensor.lv_sensor_presenca_movimento') }}"
          motion_recent: "{{ states('binary_sensor.lavabo_motion_recent') }}"
          occupancy: "{{ states('binary_sensor.lavabo_occupancy') }}"
"""
lavabo_text = LAVABO.read_text(encoding='utf-8')
if 'unique_id: lavabo_semantic_state' not in lavabo_text:
    LAVABO.write_text(lavabo_text.rstrip() + lavabo_semantic + '\n', encoding='utf-8')
    print('Lavabo semantic sensor: aplicado')
else:
    print('Lavabo semantic sensor: ja aplicado')


# Corredor: se o PIR estiver sem bateria/offline, o semantic state anterior
# caia para `none` e o frontend ficava vazio. Diferencia falha real de repouso.
old_corridor_state = """        state: >-
          {% if is_state('binary_sensor.corredor_motion_recent', 'on') %}motion
          {% elif is_state('binary_sensor.corredor_occupancy', 'on') %}recent
          {% else %}none
          {% endif %}
        attributes:
          display: >-
            {% if is_state('binary_sensor.corredor_motion_recent', 'on') %}Movimento
            {% elif is_state('binary_sensor.corredor_occupancy', 'on') %}Movimento recente
            {% else %}
            {% endif %}
"""
new_corridor_state = """        state: >-
          {% set source = states('binary_sensor.pir_motion_sensor_corredor_movimento') %}
          {% if source in ['unknown', 'unavailable', 'none', ''] %}sensor_offline
          {% elif is_state('binary_sensor.corredor_motion_recent', 'on') %}motion
          {% elif is_state('binary_sensor.corredor_occupancy', 'on') %}recent
          {% else %}none
          {% endif %}
        attributes:
          display: >-
            {% set source = states('binary_sensor.pir_motion_sensor_corredor_movimento') %}
            {% if source in ['unknown', 'unavailable', 'none', ''] %}Sensor indisponivel
            {% elif is_state('binary_sensor.corredor_motion_recent', 'on') %}Movimento
            {% elif is_state('binary_sensor.corredor_occupancy', 'on') %}Movimento recente
            {% else %}
            {% endif %}
"""
replace_once(CORREDOR, old_corridor_state, new_corridor_state, 'Corredor offline explicito')


# Regressao de config: Lavabo precisa continuar com fonte semantica propria.
test_text = ROOMS_TEST.read_text(encoding='utf-8')
needle = "lavabo e corredor mantem contrato semantico de presenca"
if needle not in test_text:
    pos = test_text.rfind('\n});')
    if pos < 0:
        raise SystemExit('rooms.config.test.ts: fechamento do describe nao encontrado')
    block = """

  it('lavabo e corredor mantem contrato semantico de presenca', () => {
    const lavabo = ROOMS.find((room) => room.id === 'lavabo');
    const corredor = ROOMS.find((room) => room.id === 'corredor');
    expect(lavabo?.entities.semanticState).toBe('sensor.lavabo_semantic_state');
    expect(corredor?.entities.semanticState).toBe('sensor.corredor_semantic_state');
  });
"""
    ROOMS_TEST.write_text(test_text[:pos] + block + test_text[pos:], encoding='utf-8')
    print('teste semantico Lavabo/Corredor: aplicado')
else:
    print('teste semantico Lavabo/Corredor: ja aplicado')


# Guarda local do round: os 8% ja foram aplicados na rodada anterior e nao
# podem regredir enquanto mexemos em material/estado.
tile_final = TILE.read_text(encoding='utf-8')
sala_final = SALA.read_text(encoding='utf-8')
required = [
    'height: 120%;',
    'height: 127.5%;',
    'is-josh-phone-card.is-room-on',
    '--bruno-tile-on-line',
]
missing = [x for x in required if x not in tile_final]
if missing:
    raise SystemExit(f'guard tile round4 falhou: {missing}')
if 'width: 101.5%;' not in sala_final or 'height: 101.5%;' not in sala_final:
    raise SystemExit('guard Sala: escala V3 de ~8% regrediu')

print('Round4 Josh ON + presenca aplicado')
