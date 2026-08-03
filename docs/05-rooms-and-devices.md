# 05 — Cômodos e dispositivos

Extraído do código em 2026-08-02 (configuração padrão dos cards e subviews).
**Esta é a base da futura `rooms.config.ts`** — hoje as mesmas entidades estão
repetidas em card, subview e package de presença.

> As entidades abaixo saíram do código, não do Home Assistant em execução.
> Uma entidade listada aqui pode ter sido renomeada no HA sem que o código
> soubesse — é justamente a falha que a verificação de existência da camada de
> diagnóstico deve pegar (ver [`12-migration-plan.md`](12-migration-plan.md),
> Fase 4).

## Padrão comum a todos os cômodos

Desde o molde único de presença (2026-07-03/04), todo cômodo segue três camadas:

```
L1  binary_sensor.<slug>_motion_recent   presença imediata  → acende o ponto azul
L2  binary_sensor.<slug>_occupancy       presença sustentada → semântica
L3  sensor.<slug>_semantic_state         occupied/none + texto do card
```

Regra funcional: **o ponto acende e apaga rápido** (5 s de anti-flicker); **o
texto "Ocupado" exige permanência** (45–60 s para ligar, 120–180 s para soltar) e
só aparece se a presença também estiver ativa.

Sensores 4-em-1: HOBEIAN / Tuya ZG-204ZV via Zigbee2MQTT.

## Sala

| Função | Entidade |
|---|---|
| Luzes (grupo) | `light.grupo_luzes_sala` |
| Luzes | `light.sala_switch_1`, `light.sala_switch_2` |
| A/C | `climate.sl_ar_condicionado` |
| TV | `media_player.android_tv_192_168_3_17` · `remote.atv` · `media_player.atv` |
| Alexa | `media_player.echo_show` |
| Spotify | `media_player.spotifyplus_bruno_helasio` (compartilhado) |
| Cortina | `cover.cortina_varanda_cortina_2` |
| Câmeras | `camera.sl_camera_2` · `camera.vr_camera_2` (varanda) |
| Presença | `binary_sensor.sensor_4_in_1_sala_presence` → `sala_motion_recent` / `sala_occupancy` |
| Semântica | `sensor.sala_semantic_state` (+ `_supervised`) · `sensor.living_room_active` |
| Clima | `sensor.sensor_4_in_1_sala_{temperature,humidity,illuminance}` |

Timers de ocupação: **60 s liga / 180 s solta**.

## Office

| Função | Entidade |
|---|---|
| Luzes (grupo) | `light.grupo_luzes_office` |
| Luzes | `light.office_switch_1`, `_2`, `_3` |
| A/C | `climate.ac_office` |
| PC | `switch.macbook` (ocupa o lugar da TV) |
| Alexa | `media_player.echo_pop_office` |
| Câmera | `camera.of_camera_2` |
| Presença | `binary_sensor.sensor_4_in_1_office_presence` → `office_motion_recent` / `office_occupancy` |
| Semântica | `sensor.office_semantic_state` (+ `_supervised`) · `sensor.office_active` |
| Contexto | `binary_sensor.office_pc_active` · `binary_sensor.office_meeting_active` |
| Clima | `sensor.sensor_4_in_1_office_{temperature,humidity,illuminance}` |

Timers: **60 s / 180 s**. Cortina: **não há entidade** — o dock existe mas é inerte.

## Cozinha

| Função | Entidade |
|---|---|
| Luzes (grupo) | `light.grupo_luzes_cozinha` |
| Luz principal | `light.cz_luz_principal` |
| Eletrodoméstico | `sensor.lava_loucas_operation_state` (contexto: `run`) |
| Câmeras | `camera.cz_camera_2` · `camera.as_camera_2` (área de serviço) |
| Presença | `binary_sensor.sensor_4_in_1_cozinha_presence` → `cozinha_motion_recent` / `cozinha_occupancy` |
| Semântica | `sensor.cozinha_semantic_state` (+ `_supervised`) · `sensor.cozinha_active` |
| Clima | `sensor.sensor_4_in_1_cozinha_{temperature,humidity,illuminance}` + `sensor.temperatura_cozinha` / `sensor.umidade_cozinha` |

Timers: **45 s / 120 s**. Sem Alexa, sem A/C. Texto semântico no feminino ("Ocupada").

## Lavabo

| Função | Entidade |
|---|---|
| Luzes (grupo) | `light.grupo_luzes_lavabo` |
| Luzes | `light.lavabo_switch_1`, `_2`, `_3` |
| Presença | `sensor.lv_sensor_presenca_pir` → `lavabo_motion_recent` / `lavabo_occupancy` |
| Iluminância | `sensor.lv_sensor_presenca_iluminancia` |
| Atividade | `sensor.lavabo_active` |

Ocupação: **120 s** para soltar; o ponto usa `motion_recent`. Sem câmera, sem
A/C, sem mídia. **Único cômodo cujo card abre popup** (`<dialog>` nativo com
Shadow DOM), não subview — e por isso tem ponte de tema própria.

## Quarto Casal

| Função | Entidade |
|---|---|
| Luzes (grupo) | `light.grupo_quarto_casal` |
| Luz principal | `light.qc_luz_principal` |
| Alexa | `media_player.echo_pop_quarto_casal` |
| Câmera | `camera.camera_quarto_casal_2` |
| Presença | `binary_sensor.sensor_4_in_1_q_casal_presence` → `q_casal_motion_recent` / `q_casal_occupancy` |
| Semântica | `sensor.q_casal_semantic_state` (+ `_supervised`) · `sensor.quarto_casal_active` |
| Clima | `sensor.sensor_4_in_1_q_casal_{temperature,humidity,illuminance}` + `sensor.qc_temperatura` / `sensor.qc_umidade` |

Timers: **60 s / 180 s**. **Sem A/C.** O package de presença foi criado inerte,
aguardando a instalação do sensor.

## Quarto Marina

| Função | Entidade |
|---|---|
| Luzes (grupo) | `light.grupo_luzes_quarto_marina` |
| Luz | `light.quarto_marina_switch_4` |
| A/C | `climate.ac_quarto_marina` |
| Alexa | `media_player.echo_pop_marina` |
| Câmera | `camera.qma_camera_2` |
| Presença | `binary_sensor.sensor_4_in_1_q_marina_presence` → `q_marina_motion_recent` / `q_marina_occupancy` |
| Semântica | `sensor.q_marina_semantic_state` (+ `_supervised`) · `sensor.quarto_marina_active` |
| Clima | `sensor.sensor_4_in_1_q_marina_{temperature,humidity,illuminance}` + `sensor.qma_temperatura` / `sensor.qma_umidade` |

Timers: **60 s / 180 s**. Ver problema de hardware S3 em
[`09-known-issues.md`](09-known-issues.md).

## Quarto Miguel

| Função | Entidade |
|---|---|
| Luzes (grupo) | `light.grupo_luzes_quarto_miguel` |
| Luz principal | `light.quarto_miguel_switch_2` |
| A/C | `climate.ac_quarto_miguel` |
| Câmera | `camera.qmi_camera_2` |
| Presença | `binary_sensor.sensor_4_in_1_q_miguel_presence` → `q_miguel_motion_recent` / `q_miguel_occupancy` |
| Semântica | `sensor.q_miguel_semantic_state` (+ `_supervised`) · `sensor.quarto_miguel_active` |
| Clima | `sensor.sensor_4_in_1_q_miguel_{temperature,humidity,illuminance}` + `sensor.qmi_temperatura` / `sensor.qmi_umidade` |

Timers: **60 s / 180 s**. **Sem Alexa.** É a zona com mais luzes na subview (6).

## Corredor

| Função | Entidade |
|---|---|
| Luz | `light.corredor_switch_1` |
| Presença | `binary_sensor.pir_motion_sensor_corredor_movimento` → `corredor_motion_recent` / `corredor_occupancy` |
| Semântica | `sensor.corredor_semantic_state` |

É o 8º tile da faixa da Home. **Sem subview** — toggle direto. Por isso é o
componente-piloto recomendado da migração.

## Câmeras (8)

`camera.sl_camera_2` (sala) · `camera.vr_camera_2` (varanda) ·
`camera.cz_camera_2` (cozinha) · `camera.as_camera_2` (área de serviço) ·
`camera.of_camera_2` (office) · `camera.camera_quarto_casal_2` ·
`camera.qma_camera_2` (Marina) · `camera.qmi_camera_2` (Miguel)

Movimento das câmeras Tuya vem da ponte própria
`config/custom_components/bruno_tuya_motion/`, que escuta a fila MQTT existente
(DP `initiative_message` / 212, `cmd: ipc_motion`) e publica estados
`bruno_tuya_motion.<camera>`. **As entidades nativas da integração não expõem
esse evento** — foi por isso que a ponte precisou existir.

## Outros

| | |
|---|---|
| Aspirador | `vacuum.roborock_s7` + ~30 sensores; mapa em `image.roborock_s7_map_0` |
| Spotify | `media_player.spotifyplus_bruno_helasio` — **uma entidade para a casa toda**, direcionada por `device_name` ao Echo do cômodo |
| Alexa | Echo Show (Sala), Echo Pop Office, Echo Pop Quarto Casal, Echo Pop Marina. **Cozinha, Lavabo, Corredor e Q. Miguel não têm.** |

## Duplicação a eliminar

A mesma entidade aparece hoje em até quatro lugares: no card do cômodo, na
subview, no package de presença e no YAML da shell. Renomear uma entidade no HA
exige caçar todas as ocorrências. **É o argumento central para a configuração
centralizada e tipada da Fase 4.**
