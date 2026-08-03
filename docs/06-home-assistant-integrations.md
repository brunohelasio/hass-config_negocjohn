# 06 — Integrações do Home Assistant

Levantado em 2026-08-02. **`config/custom_components/` está fora do escopo da
reestruturação do frontend** — são 55 integrações, 2.485 arquivos. Este documento
cobre o que o dashboard efetivamente consome.

> Só o Home Assistant em execução diz quais estão de fato carregadas. Várias são
> herança do projeto `ngocjohn` e provavelmente não são usadas. Classificadas
> como `UNKNOWN` na auditoria — **não mexer sem confirmar**.

## Integrações que o dashboard usa

| Integração | Para quê | Onde aparece |
|---|---|---|
| **Zigbee2MQTT** | Sensores 4-em-1 HOBEIAN/Tuya ZG-204ZV (presença, temperatura, umidade, iluminância) | todos os cômodos |
| **Tuya / Xtend Tuya** | 8 câmeras | seção de câmeras, cards de cômodo |
| **`bruno_tuya_motion`** (própria) | Ponte MQTT para o evento de movimento das câmeras | `bruno-home-camera-card` |
| **SpotifyPlus** | `media_player.spotifyplus_bruno_helasio` + `spotifyplus.player_media_play_pause` com `device_name` | hub de mídia |
| **Alexa Media Player** | Echo Show (Sala), Echo Pop (Office, Q. Casal, Marina) | hub de mídia |
| **Roborock** | `vacuum.roborock_s7`, ~30 sensores, `image.roborock_s7_map_0` | subview do Roborock |
| **Android TV / ADB** | `media_player.android_tv_192_168_3_17`, `remote.atv` | hub de mídia da Sala |
| **Music Assistant** (add-on) | Ingress nativo | `bruno-music-subview` (redireciona) |
| **`browser_mod`** | Popups no YAML legado | só o legado — a shell usa overlays próprios |
| **`kiosk_mode`** | `kiosk: true` no dashboard | `ui-lovelace-main.yaml` |
| **`custom:grid-layout` / `layout-card`** | Grades das seções | `section_home_v2.yaml` |
| **`card_mod`** | Ajustes de estilo no YAML | legado e wrappers |
| **`button-card` / `streamline-card`** | Geração "Mat" | `views/main-grid/` (legado) |

## Serviços chamados pelo frontend

`light.toggle` · `light.turn_off` · `climate.turn_on` · `climate.turn_off` ·
`climate.set_temperature` · `climate.set_hvac_mode` · `climate.set_fan_mode` ·
`climate.set_swing_mode` · `media_player.media_play_pause` ·
`media_player.media_play` · `media_player.media_pause` ·
`media_player.media_next_track` · `media_player.media_previous_track` ·
`media_player.volume_set` · `cover.open_cover` · `cover.close_cover` ·
`cover.stop_cover` · `cover.set_cover_position` ·
`spotifyplus.player_media_play_pause`

## Backend próprio — `config/packages/`

Onde vive a lógica que o dashboard apenas exibe:

| Package | Conteúdo |
|---|---|
| `<comodo>_presence.yaml` (7) | Molde de presença/ocupação em três camadas |
| `presence_supervision.yaml` | Supervisão dos sensores (`_supervised`) |
| `home_activity.yaml`, `home_insights.yaml` | Agregados da casa |
| `bruno_scenes.yaml`, `bruno_wallpapers.yaml` | Cenas e papéis de parede |
| `sala_tv_controls.yaml` | Scripts de abertura de app na TV + helper de expansão |
| `active_player.yaml` | Player ativo |
| `energy_estimated.yaml` | Consumo estimado |
| `templates/` | Sensores de template |

**Manter no backend.** São lógica do Home Assistant, não do frontend — e o
padrão de guardar estado de UI em `input_boolean`/`input_select` é correto
(sobrevive a recarregamentos, é visível às automações). Ver `10`.

## Limitações conhecidas

- **Spotify é uma entidade só para a casa toda.** O direcionamento por cômodo é
  feito com `device_name` no serviço, não por entidade separada.
- **Cozinha, Lavabo, Corredor e Q. Miguel não têm Alexa.**
- **Q. Casal não tem A/C**; o package de presença foi criado inerte, à espera do sensor.
- **Office não tem cortina** — o dock existe e é inerte, por paridade visual com a Sala.
- **Movimento das câmeras Tuya não é exposto pelas entidades nativas** — daí a
  ponte MQTT própria.
- **`camera.* = recording` não é evento de movimento**: é estado operacional
  persistente. Usá-lo produziu falso positivo em 7 das 8 câmeras.

## Integrações provavelmente herdadas e sem uso

`rohlikcz` (mercado tcheco), `mbapi2020` (Mercedes), `dyson_local`,
`dwains_dashboard`, `ui_lovelace_minimalist`, `eufy_security`, `midea_*`,
`gree`, `stremio`, `ytube_music_player`, `pid_departures`, `weatherdotcom`,
`delete`.

**Não remover sem confirmar no HA em execução.** Não afetam o frontend; são
peso de backup e de tempo de inicialização. Assunto para uma sessão dedicada,
fora da reestruturação do dashboard.
