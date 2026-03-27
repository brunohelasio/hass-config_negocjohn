# CLAUDE.md — Diretrizes para o Dashboard HA (negocjohn)

## Regra de Ouro (OBRIGATORIO)

**NUNCA excluir codigo existente. SEMPRE comentar antes de substituir.**

- Ao modificar qualquer arquivo YAML, o codigo original deve ser COMENTADO, nao deletado.
- Isso permite reverter facilmente e manter historico visual das mudancas.
- Novas estruturas devem ser adicionadas ABAIXO do codigo original comentado.
- Esta regra se aplica a TODOS os arquivos do projeto, sem excecao.

## Estrategia de Grid: Sagaland Hibrida (OBRIGATORIO)

Baseada na analise do repositorio sagaland-ha-dashboard, com ajuste pratico.

### Principio central

**TODAS as grid-areas devem existir em TODOS os breakpoints** (previne cards orfaos).

**`show: mediaquery` e NECESSARIO nos cards** para controlar quando renderizam.

- `grid-template-rows: 0` NAO esconde conteudo no custom:grid-layout do HA.
  Items CSS Grid tem `min-height: auto` — conteudo transborda da row de altura 0.
- Por isso, `show: mediaquery` e o mecanismo PRIMARIO de ocultacao.
- As rows de altura 0 ficam como safety net (areas existem, mas sem card renderizado).
- Resultado: zero orfaos + cards realmente ocultos.

### Grid-areas do projeto

Todas estas areas devem estar presentes em TODOS os breakpoints:

| Area        | Arquivo                    | Descricao                          |
|-------------|----------------------------|------------------------------------|
| sidebar     | sidebar.yaml               | Relogio, data, clima (landscape)   |
| chips       | a-chips.yaml               | Atalhos rapidos (lights, media...) |
| header      | header.yaml                | Relogio + clima (phone/portrait)   |
| security    | security.yaml              | Status de seguranca                |
| mainrooms   | mainrooms.yaml             | Masters (sala, cozinha, circ.)     |
| devices     | rooms2.yaml                | Rooms (quartos, office, lavabo)    |
| other       | devices.yaml               | Devices (a ser comentado depois)   |
| cameras     | cameras.yaml               | Cameras                            |
| climate     | climate.yaml               | Climatizacao                       |
| media       | grid_media.yaml            | Media (consolidado, inclui movies) |
| movies      | horizontal_movies.yaml     | Movies (a ser consolidado em media)|
| home        | home.yaml                  | Home status (portrait/phone)       |
| footer      | z-footer.yaml              | Rodape                             |

### Estrutura do landscape tablet (801-1440px, landscape)

```
Colunas: 0 | sidebar(14%) | 1fr | 1fr | 1fr | 0

Linha 1 (visivel):  sidebar | security  | mainrooms | devices
Linha 2 (visivel):  sidebar | cameras   | climate   | media
Linha 3 (visivel):  sidebar | footer    | footer    | footer
Linha 4 (h=0):      chips   | header    | home      | other
Linha 5 (h=0):      .       | movies    | .         | .
```

- Sidebar: coluna fixa a esquerda (relogio, data, clima)
- 3 colunas de conteudo
- Chips e header NAO aparecem (substituidos pelo sidebar)
- Other (Devices) e movies ficam ocultos (h=0)
- Home e portrait-only, fica oculto (h=0)

### Posicoes trocadas (IMPORTANTE)

- `rooms2.yaml` usa `grid-area: devices` (titulo "Rooms") — posicao trocada intencionalmente
- `devices.yaml` usa `grid-area: other` (titulo "Devices") — sera comentado no futuro

### Proximos passos planejados

1. ~~Implementar sidebar~~ (FEITO)
2. Aplicar estrategia Sagaland em todos os breakpoints (EM ANDAMENTO)
3. Comentar bloco Devices (other) quando sidebar estiver completa
4. Consolidar Movies dentro de Media
5. Sidebar substituira chips/header no landscape tablet

### O que NAO fazer

- NAO excluir codigo — SEMPRE comentar antes de substituir (Regra de Ouro)
- NAO confiar APENAS em `grid-template-rows: 0` para esconder cards (nao funciona no HA)
- NAO criar variantes de cards por breakpoint (ex: chips landscape, chips phone)
- NAO deixar grid-areas faltando em qualquer breakpoint
- NAO remover `show: mediaquery` dos cards — e o mecanismo primario de ocultacao

### Breakpoints do projeto

| Breakpoint            | Media query                                                              |
|-----------------------|--------------------------------------------------------------------------|
| Desktop               | default + (min-width: 1441px) and (max-width: 2000px)                   |
| Landscape tablet      | (min-width: 801px) and (max-width: 1440px) and (orientation: landscape)  |
| Portrait tablet       | (min-width: 801px) and (max-width: 1440px) and (orientation: portrait)   |
| Phone                 | (max-width: 800px) and (min-height: 463px)                              |
| Cover screen          | (max-height: 462px)                                                     |

### Arquivos desabilitados

- `config/dashboards/views/disabled/floorplan.yaml` — planta baixa removida do grid
- `config/dashboards/views/main-grid/cover-screen.yaml.disabled` — cover screen desabilitado

---

## Roteiro Consolidado — Ajustes do Botao da Sala e Popup (2026-03-27)

Definicoes finais consolidadas a partir da revisao do usuario. O roteiro anterior
(Analise de Funcionalidades negocjohn) foi substituido por este roteiro mais objetivo.

### Decisoes Consolidadas

1. **Circle no botao principal (grid)**: REMOVIDO. Nao faz parte do comportamento original.
2. **Circle nos botoes do popup**: MANTIDO apenas em Luz Principal (brilho), TV (volume) e Spotify (volume).
3. **Template media premium**: NAO adotado. Sem necessidade.
4. **entity_picture (artwork)**: Adiado. A origem era `entity.attributes.entity_picture` (atributo nativo do HA em media_player). Sera implementado futuramente.
5. **AC no popup**: Implementado via hold_action com popup thermostat.
6. **Logica de acendimento do botao**: Botao acende SOMENTE com luz ligada. Icone de lampada aparece. state_display mostra contagem + tempo ligado.
7. **Icones com botao apagado**: AC e midia ativos mostram icone mas botao NAO acende. Futuro: avaliar circulo de destaque.
8. **RGB**: Desconsiderado, mantido como comentario.
9. **Cores do circle**: Mantidas (cinza/amarelo/azul internos). Sem dimmer = 100% fixo. Com dimmer = slider interativo.

### Etapa 1: Remover circle do botao principal da sala (grid)

**Arquivo:** `config/dashboards/templates/streamline_templates/tpl_grid_mainrooms.yaml`

- Comentar `- circle` na lista de templates do `grid_living_room`
- Comentar variaveis `circle_input` e `circle_input_unit`
- Comentar bloco `card_mod` que escondia o circle quando luzes off
- Manter: `rooms_base`, `icon_couch_lamp`, `motion`, `ac_status`, `media_status`, `lights_status`

### Etapa 2: Adicionar circle na Luz Principal do popup

**Arquivo:** `config/dashboards/shared/columns/room_living_all_buttons.yaml`

- No botao "Luz Principal" (`light.sala_switch_2`), adicionar template `circle`
- Adicionar variaveis `circle_input` (brightness → 100% se sem dimmer) e `circle_input_unit: '%'`
- NAO alterar demais botoes de luz (LED Direito, LED Esquerdo, VR Principal, etc.)
- Cores do circle mantidas como estao (subtis, internas)

**Arquivo:** `config/dashboards/templates/button_card_templates/tpl_base.yaml`

- Corrigir `debug = true` → `debug = false` na secao LIGHT do circle (linha ~1307)
- O slider ficava semi-visivel (30% opacidade). Media_player ja tem debug=false.

### Etapa 3: Confirmar PS5/Pioneer/Cortina sem circle

Verificacao apenas — ja estao corretos:
- PS5: template `base` + `icon_playstation` — sem circle ✅
- Pioneer: template `base` — sem circle ✅
- Cortina: template `base` — sem circle ✅

### Etapa 4: Confirmar TV/Spotify com circle (volume)

Verificacao apenas — ja estao corretos:
- TV: template `mediaplayer` (inclui base+circle+loader+icon_tv) — circle de volume ✅
- Spotify: templates base+circle+loader+icon_spotify_color — circle de volume ✅

### Etapa 5: Comentar logica RGB residual

**Arquivo:** `config/dashboards/templates/button_card_templates/tpl_media.yaml`

- Comentar bloco `box-shadow` no template `mediaplayer` (linhas 644-657) que referencia `variables.light_entity` e `rgb_color`
- Nao temos luzes RGB — logica fica apenas como comentario

### Etapa 6: Timer de tempo no state_display (rooms_base)

**Arquivo:** `config/dashboards/templates/button_card_templates/tpl_sectors.yaml`

- No `state_display` do `rooms_base`, quando ha luzes ligadas, substituir "1 light" por "1 light · 2h"
- Usar funcao de formatacao de tempo do negocjohn: `Date.now() - Date.parse(entity.last_changed)` → s/m/h/d
- Adicionar `triggers_update: sensor.time` no botao da sala para atualizacao periodica
- Para performance: adicionar triggers_update via override na variavel do `grid_living_room` (nao no rooms_base global)

### Etapa 7: Ativar botao do Ar Condicionado com hold_action

**Arquivo:** `config/dashboards/shared/columns/room_living_all_buttons.yaml`

- No botao "Ar Condicionado", adicionar `entity: climate.sl_ar_condicionado`
- Adicionar `icon_climate` template com estado visual
- `tap_action: action: toggle` (liga/desliga AC)
- `hold_action`: abrir popup thermostat (reutiliza thermostat.yaml existente)
- Remover `opacity: 0.35` e `cursor: default` (botao ativo)
- Definir `state_on` para reconhecer estados do climate

### Etapa 8: entity_picture nos botoes de midia (ADIADO)

Adiado para momento posterior. A funcionalidade usaria `entity.attributes.entity_picture`
(atributo nativo do HA) para exibir capa do album/tela da TV como background do botao.

---

### Ordem de execucao

| Passo | Etapa | Complexidade | Risco |
|-------|-------|-------------|-------|
| 1 | Etapa 1 — Remover circle do botao grid | Baixa | Zero |
| 2 | Etapa 3 — Confirmar PS5/Pioneer/Cortina limpos | Zero | Zero |
| 3 | Etapa 4 — Confirmar TV/Spotify com circle | Zero | Zero |
| 4 | Etapa 2 — Adicionar circle na Luz Principal popup + fix debug | Media | Baixo |
| 5 | Etapa 5 — Comentar logica RGB residual | Baixa | Zero |
| 6 | Etapa 7 — Ativar botao AC com hold popup | Media | Baixo |
| 7 | Etapa 6 — Timer de tempo no state_display | Media | Medio |

### Arquivos afetados (resumo)

| Arquivo | Etapas |
|---------|--------|
| `tpl_grid_mainrooms.yaml` | 1, 6 (triggers_update) |
| `room_living_all_buttons.yaml` | 2, 7 |
| `tpl_base.yaml` | 2 (debug fix) |
| `tpl_sectors.yaml` | 6 (rooms_base state_display) |
| `tpl_media.yaml` | 5 (comentar RGB box-shadow) |

---

### Pre-requisitos / Informacoes Necessarias

**RESOLVIDO (2026-03-27):**

1. **Presenca da sala**: Ainda sem sensor. Placeholder vazio — nao quebra o painel.
2. **AC da sala**: `climate.sl_ar_condicionado` — CONFIRMADO.
3. **Sensor de temperatura**: `sensor.sl_sensor_temp_humid_temperatura` — CONFIRMADO.
4. **Sensor "active" da sala**: `sensor.living_room_active` — ATIVADO, com `lights_on` e `lights_on_count`.
5. **Termostatos europeus**: COMENTADOS em todos os arquivos.

### Entidades confirmadas do usuario (Brasil)

| Entidade | Entity ID | Tipo |
|----------|-----------|------|
| AC Sala | `climate.sl_ar_condicionado` | climate |
| AC Office | `climate.ac_office` | climate |
| AC Quarto Miguel | `climate.ac_quarto_miguel` | climate |
| Temp/Humid Sala | `sensor.sl_sensor_temp_humid_temperatura` | sensor |
| Luzes Sala (grupo) | `light.grupo_luzes_sala` | light |
| Luz principal Sala | `light.sala_switch_2` | light |
| TV Sala | `media_player.smart_tv_pro_2` | media_player |
| Remote TV | `remote.smart_tv_pro` | remote |
| Spotify | `media_player.spotifyplus_bruno_helasio` | media_player |
| Motion Sala | *(vazio — trocar quando sensor chegar)* | ⏳ pendente |

---

### Implementacao concluida

| Fase | Status | Descricao |
|------|--------|-----------|
| 0 | ✅ | Limpeza termostatos europeus, adaptacao sensor.home_climate para cooling |
| Anterior-1 | ✅ | Backdrop/vidro fosco blur(12px) em todos os popups |
| Anterior-2 | ✅ | Popup sala reduzido de 65vw para 55vw |
| Anterior-3 | ✅ | Icones de status: motion (placeholder), AC, TV, luzes |
| Anterior-4 | ✅ | Vermelho unavailable ja funciona via tpl_base.yaml (state_error) |
| Anterior-5 | ✅ | Contagem de luzes via sensor.living_room_active (lights_on_count) |
