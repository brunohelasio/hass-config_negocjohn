# CLAUDE.md — Diretrizes para o Dashboard HA (negocjohn)

## Regras de Ouro (OBRIGATORIO)

### 1. NUNCA excluir codigo existente. SEMPRE comentar antes de substituir.

- Ao modificar qualquer arquivo YAML, o codigo original deve ser COMENTADO, nao deletado.
- Isso permite reverter facilmente e manter historico visual das mudancas.
- Novas estruturas devem ser adicionadas ABAIXO do codigo original comentado.
- Esta regra se aplica a TODOS os arquivos do projeto, sem excecao.

### 2. So entregar codigo quando o usuario autorizar.

- Codigo implementado deve ser revisado e aprovado pelo usuario antes de ser entregue/merged.
- Sempre aguardar autorizacao explicita para avancar para proxima fase.
- Mudancas devem ser incrementais e reversiveis.

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

### Pendencias das Fases 0 e 1 (registradas 2026-03-28)

As seguintes pendencias permanecem abertas das Fases 0 e 1. Nenhuma das tentativas
anteriores resolveu estes problemas — serao revisitados em sessao futura.

| # | Pendencia | Descricao | Status |
|---|-----------|-----------|--------|
| P1 | Espacamento lateral dos botoes | Gap/espacamento entre botoes no popup da sala ainda muito grande. Multiplas tentativas com gap:4px, padding, margin nao resolveram. O grid nativo do HA parece impor espacamento minimo. | ⏳ PENDENTE |
| P2 | Smart Remote TV — botoes | O popup do controle remoto da TV (smart_tv_remote.yaml) esta montado com layout de grid e remote.send_command, mas os botoes ainda nao funcionam corretamente. Precisa de implementacao/debug. | ⏳ PENDENTE |
| P3 | Spotify — botao nao liga e comandos nao respondem | O botao Spotify no popup da sala nao liga e os comandos (play/pause via media_player.media_play_pause) nao respondem. A integracao SpotifyPlus pode precisar de configuracao adicional ou a entidade pode estar offline. | ⏳ PENDENTE |
| P4 | Hold do Ar Condicionado — erro de configuracao | O hold_action do botao AC que abre o popup thermostat.yaml ainda apresenta erro de configuracao. O popup do termostato pode nao estar carregando corretamente. | ⏳ PENDENTE |
| P5 | AC ligado — botao nao fica branco (aceso) | Quando o ar condicionado esta ligado (cool/fan_only/dry/heat), o botao no popup nao muda para background branco. Tentativas com state: operator:template e styles.card JS templates nao resolveram de forma confiavel. O button-card pode estar sobrescrevendo os estilos. | ⏳ PENDENTE |

---

## Roteiro de Implementacao — Reestruturacao Completa (2026-03-27)

Baseado na revisao do usuario sobre icones, popups e expansao para todos os comodos.

### Premissas Confirmadas

| Item | Situacao Real |
|------|---------------|
| Echo/Alexa | NAO existem. O setup usa HomePods (media_player.office, media_player.bathroom_homepod, etc.) |
| Spotify | Entidade unica: `media_player.spotifyplus_bruno_helasio`. Card `custom:spotify-card` ja instalado |
| Quarto Miguel | Entidades sao `switch.quarto_miguel_*` (8 switches). O grupo `light.grupo_luzes_quarto_miguel` existe |
| Cameras fisicas | 13 cameras. Por comodo: sl_camera_2 (sala), cz_camera + as_camera (cozinha), of_camera (office), camera_quarto_casal, qmi_camera, qma_camera, vr_camera_2 (varanda) + doorway, terasa, zahrada, kids_room, sl_camera |
| Fechadura | `lock.nuki_neklanka_byt_lock` (Nuki) — unica entidade de lock |
| Roborock | `vacuum.roidmi_eve` com 30+ sensores, mapa via camera.roidmi_eve |
| Planta 3D | View existente: `subviews/floor-plan.yaml` com SVG interativo |
| Alarme | NAO possui. Bloco Security sera reestruturado |
| Sensores presenca/porta | NAO possui ainda |
| PC Office | `switch.macbook` (MacBook) |

### FASE 0 — Preparacao e Seguranca (Pre-requisito)

**0.1 — Criar snippet `style_popup_complete.yaml`**
- Unifica: centralizacao (.mdc-dialog__container), scrim escuro (.mdc-dialog__scrim), backdrop blur(12px), blue glow shadow
- Substituira `style_popup_center.yaml` em todos os popups
- Parametrizavel via CSS custom properties do browser_mod (--popup-width, --popup-max-width)

**0.2 — Definir padrao reutilizavel de popup de comodo**
- Padrao de estrutura: browser_mod.popup → data.style (tamanho) → data.card_mod (snippet) → content (grid col_buttons + col_camera)
- Cada comodo herda a mesma estrutura, variando conteudo e largura

### FASE 1 — Ajustes no Popup da Sala (Itens 1.1-1.5)

**1.1 — Restaurar icones originais (icon_tv e icon_spotify)**
- icon_tv: Descomentar original ngocjohn (linhas 1784-1882 tpl_icons.yaml). Comentar versao custom (1883-1960)
- icon_spotify: Descomentar SVG estatico original (linhas 677-683). Comentar versao hybrid (684-796)
- Risco: Zero — restauracao pura

**1.2 — Restaurar mediaplayer template**
- Descomentar state_display e state_on no tpl_media.yaml (linhas 627-633)
- Os templates originais do mediaplayer devem prevalecer sobre icon_tv
- Risco: Zero — restauracao

**1.3 — Substituir thermostat popup por card estilo sagaland93**
- Arquivo: thermostat.yaml — comentar conteudo atual (layout com footer)
- Novo conteudo: Popup simples com thermostat card HA nativo para climate.sl_ar_condicionado
- Apenas 1 AC (sala), sem footer layout complexo
- Hold_action do botao AC ja referencia thermostat.yaml
- Risco: Baixo — arquivo isolado

**1.4 — Substituir Spotify popup pelo custom:spotify-card**
- Arquivo: media_spotify.yaml — comentar layout 2-colunas atual
- Novo conteudo: custom:spotify-card unico, limpo, com controles de player
- Entity: media_player.spotifyplus_bruno_helasio
- Hold_action do botao Spotify ja referencia media_spotify.yaml
- Risco: Baixo — arquivo isolado

**1.5 — Aplicar snippet popup padronizado na Sala**
- Arquivo: livingroom.yaml — extrair CSS inline para usar style_popup_complete.yaml
- Verificar comportamento visual identico
- Risco: Minimo — reorganizacao sem mudanca funcional

### FASE 2 — Replicar Popup para Demais Comodos (Item 2)

Estrutura padrao: col_buttons (luzes + midia/clima em grid 5-col) + col_camera

**2.1 — Quarto Casal**: 7 luzes, Spotify (hold→spotify popup), AC placeholder desabilitado, camera.camera_quarto_casal
**2.2 — Quarto Miguel**: 8 switches (tratar como luzes), Spotify, climate.ac_quarto_miguel, camera.qmi_camera
**2.3 — Quarto Marina**: 6 luzes, Spotify, AC placeholder desabilitado, camera.qma_camera
**2.4 — Office**: 3 luzes, switch.macbook (PC no lugar da TV), Spotify, climate.ac_office, camera.of_camera
**2.5 — Cozinha**: 3 luzes, eletrodomesticos (airfryer, lava-louca, lava-roupa como placeholders), camera.cz_camera + camera.as_camera
**2.6 — Lavabo**: Popup PEQUENO (~400-450px) com apenas 3 botoes de luzes. Sem midia, sem camera
**2.7 — Circulacao**: Sem popup — botao direto liga/desliga light.corredor_switch_1 (ja configurado)

### FASE 3 — Reestruturar Bloco Security → "Home" (Item 3)

**3.1 — Comentar bloco Security atual** (tpl_grid_security.yaml inteiro + security-status.yaml)
**3.2 — Criar novo bloco "Home"** (4 botoes em grid 2x2):
- Porta: lock.nuki_neklanka_byt_lock (tap: toggle, hold: more-info)
- Planta 3D: tap → navigate subviews/floorplan
- Roborock: vacuum.roidmi_eve (tap: toggle, hold: popup vacuum)
- Cameras: tap → popup com grid completo de 8 cameras do usuario
**3.3 — Criar popup de cameras completo (8 cameras)**:
sl_camera_2, vr_camera_2, cz_camera, as_camera, of_camera, camera_quarto_casal, qmi_camera, qma_camera
**3.4 — Atualizar titulo** do grid-area: Security → Home

### FASE 4 — Media Carrossel no Painel Principal (Item 4)

**4.1 — Ativar swipe-card** no bloco media (codigo ja existe comentado em grid_media.yaml)
**4.2 — Adaptar entidades** para o setup do usuario (smart_tv_pro_2, spotifyplus_bruno_helasio)
**4.3 — Estilo sagaland93**: coverflow effect com artwork do player ativo

### FASE 5 — Mobile Layout (Item 5 — Anotacao para Futuro)

Registrar necessidade de ajustar exibicao mobile:
- Popups colapsam para 1 coluna em mobile (sem col_camera)
- Tamanho popup: 95vw em mobile
- Grid de botoes: 3-col em mobile (vs 5-col desktop)
- Chips/header para mobile conforme estrategia Sagaland

### Ordem de Execucao

| Passo | Fase | Descricao | Complexidade | Risco |
|-------|------|-----------|-------------|-------|
| 1 | 0.1 | Criar snippet style_popup_complete.yaml | Baixa | Zero |
| 2 | 1.1 | Restaurar icones originais TV + Spotify | Media | Zero |
| 3 | 1.2 | Restaurar mediaplayer template | Baixa | Zero |
| 4 | 1.3 | Thermostat popup estilo sagaland93 | Media | Baixo |
| 5 | 1.4 | Spotify popup com spotify-card | Media | Baixo |
| 6 | 1.5 | Aplicar snippet popup na Sala | Baixa | Minimo |
| 7 | 2.1-2.6 | Popups de todos os comodos | Alta | Baixo |
| 8 | 3.1-3.4 | Bloco Home + cameras completo | Alta | Medio |
| 9 | 4.1-4.3 | Media carrossel swipe-card | Media | Medio |
| 10 | 5 | Mobile layout (futuro) | — | — |

### Arquivos Afetados (Resumo)

| Arquivo | Acao | Fases |
|---------|------|-------|
| `shared/snippets/style_popup_complete.yaml` | CRIAR | 0, 1, 2 |
| `templates/button_card_templates/tpl_icons.yaml` | Comentar/descomentar icon_tv e icon_spotify | 1.1 |
| `templates/button_card_templates/tpl_media.yaml` | Descomentar state_display/state_on | 1.2 |
| `shared/popup/thermostat.yaml` | Comentar + novo conteudo | 1.3 |
| `shared/popup/media_spotify.yaml` | Comentar + novo conteudo | 1.4 |
| `shared/popup/rooms/livingroom.yaml` | Refatorar CSS para snippet | 1.5 |
| `shared/columns/room_*_all_buttons.yaml` | CRIAR (6 novos) | 2 |
| `shared/popup/rooms/*.yaml` | Reescrever (6 comodos) | 2 |
| `templates/streamline_templates/tpl_grid_security.yaml` | Comentar + bloco Home | 3 |
| `shared/grid-cards/security-status.yaml` | Comentar + home-status | 3 |
| `shared/popup/cameras_full.yaml` | CRIAR (8 cameras) | 3 |
| `views/main-grid/grid_media.yaml` | Descomentar swipe + adaptar | 4 |

### Prompt para Continuar (Fases 2-5)

```
Continuando o roteiro do CLAUDE.md — Fases 0 e 1 estao concluidas.
Implemente a FASE 2 (popups de todos os comodos), comecando pelo Quarto Casal (2.1).

Estrutura padrao por comodo:
- col_buttons: vertical-stack com secoes Luzes (header + grid 5-col) e Midia/Clima (header + grid 5-col)
- col_camera: layout-card com camera(s) do comodo
- Popup usa style_popup_complete.yaml
- Botoes sem entidade: opacity 0.35-0.45, cursor default, sem acao
- Spotify compartilhado: mesma entidade, hold → media_spotify.yaml

Apos concluir Fase 2, implemente Fase 3 (bloco Home substituindo Security).
Apos Fase 3, implemente Fase 4 (media carrossel).
Fase 5 (mobile) fica como anotacao para futuro.

Regra de Ouro: COMENTAR codigo existente, nunca deletar.
So entregar quando eu autorizar.
```
