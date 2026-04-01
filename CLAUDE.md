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

## Registro de Execucao Controlada — 2026-03-30 (Fases A, B, C)

### Fase A — Baseline e congelamento

- Baseline registrado antes de alterar layout principal.
- Escopo autorizado pelo usuario: executar Fases A, B e C.
- Diretriz adicional do usuario: apos retirar coluna Devices/Movies, ajustar barra fixa + colunas para 25% cada.

### Fase B — Retirada de colunas Devices e Movies (sem exclusao)

- `config/dashboards/views/main-grid/devices.yaml`
  - Blocos ativos da coluna Devices (`grid-area: other`) comentados por completo.
  - Nenhum trecho apagado; rollback imediato disponivel por descomentar.
- `config/dashboards/views/main-grid/horizontal_movies.yaml`
  - Bloco ativo de Movies (placeholder Netflix) comentado por completo.
  - Nenhum trecho apagado; rollback imediato disponivel por descomentar.
- `config/dashboards/views/main.yaml`
  - Grid principal ajustado para remover colunas visiveis `other` e `movies`.
  - Estrutura atualizada para 4 colunas uteis iguais (sidebar + 3 colunas de conteudo), 25% cada.
  - Ajustes aplicados em default, desktop, landscape tablet, portrait tablet e phone.

### Fase C — Correcao estrutural do bloco Media (erro button-card)

- `config/dashboards/views/main-grid/grid_media.yaml`
  - Cards ativos deixaram de usar `conditional_media` / `currently_playing` no grid principal.
  - Substituicao por `mediaplayer` + icones especificos (`icon_tv`, `icon_homepod`, `icon_spotify_color`) nos blocos desktop e tablet.
  - Motivo: evitar dependencia de contexto `swipe-card/swiper` em renderizacao direta de grid.

### Observacoes

- Regra de ouro preservada: nenhuma exclusao de codigo foi realizada.
- Historico anterior mantido em comentarios para rastreabilidade e reversao.
- HOTFIX pos-feedback: areas `other` e `movies` foram reintroduzidas no `main.yaml`
  como trilhas ocultas (coluna/linha zero) para evitar auto-placement residual e
  compressao do grid principal quando houver qualquer card legado ainda renderizando.
- HOTFIX FINAL pos-segundo feedback:
  - sidebar ajustada para ocupar 27% do grid principal;
  - restante redistribuido igualmente entre 3 colunas de conteudo;
  - removidas novamente areas `other`/`movies` do `grid-template-areas` principal;
  - adicionados stubs condicionais `max-width: 0px` em `devices.yaml` e
    `horizontal_movies.yaml` para impedir qualquer render residual dessas colunas.
  - bloco media reduzido para 4 botoes (desktop/tablet) e
    carrossel `swipe-card` exclusivo para phone alternando:
    (slide 1) arte da midia em execucao (entity_picture) + (slide 2) grade 2x2 dos 4 botoes.
  - correcao adicional: removido `icon_homepod` dos cards Echo no bloco media
    para eliminar erro de `button-card` em dois botoes.

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

---

## Analise Consolidada dos Pop-ups (2026-03-28)

Analise completa da estrutura dos popups, templates e problemas identificados.
Baseada em revisao profunda do codigo e respostas do usuario.

### Hardware e Resolucao de Referencia

| Dispositivo | Resolucao | Uso |
|-------------|-----------|-----|
| Galaxy Tab S6 Lite | 2000 x 1200 | Testes atuais |
| Galaxy Tab A11+ | 1920 x 1200 | Producao (planejado) |

Ambos em landscape: ~1920-2000px largura x ~1200px altura.
Popups e botoes devem ser otimizados para essas resolucoes.

### Dispositivos Alexa e Entidades Confirmadas

| Comodo | Dispositivo | Entity ID | Spotify via Alexa |
|--------|-------------|-----------|-------------------|
| Sala | Echo Show | media_player.echo_show | ✅ |
| Office | Echo Pop Office | media_player.echo_pop_office | ✅ |
| Quarto Casal | Echo Pop Quarto Casal | media_player.echo_pop_quarto_casal | ✅ |
| Quarto Marina | Echo Pop Marina | media_player.echo_pop_marina | ✅ |
| Cozinha | — | — | ❌ Sem Alexa |
| Lavabo | — | — | ❌ Sem Alexa |
| Circulacao | — | — | ❌ Sem Alexa |
| Quarto Miguel | — | — | ❌ Sem Alexa |

### Decisao: Cameras nos popups

O usuario QUER MANTER cameras nos popups de Cozinha e Office, mesmo com menos botoes.
Solucao de dimensionamento deve acomodar camera + botoes menores.

### Estado Atual dos Pop-ups por Comodo

| Comodo | Popup Width | Grid Cols | Botoes Ativos | Camera | Status Geral |
|--------|------------|-----------|---------------|--------|-------------|
| Sala | 65vw/980px | 5+5 | 14 (7 luzes + TV + Spotify + PS5 + Pioneer + Cortina + AC) | ✅ | Referencia |
| Quarto Casal | 65vw/980px | 5+5 | 8 (7 luzes + Spotify) | ✅ | OK (herda problemas globais) |
| Quarto Miguel | 65vw/980px | 5+5 | 10 (8 switches + Spotify + AC) | ✅ | ⚠️ Problemas especificos |
| Quarto Marina | 65vw/980px | 5+5 | 7 (6 luzes + Spotify) | ✅ | OK (herda problemas globais) |
| Office | 65vw/980px | 3+3 | 6 (3 luzes + PC + Spotify + AC) | ✅ | ❌ Botoes grandes |
| Cozinha | 65vw/980px | 3+3 | 3 (3 luzes) | ✅ | ❌ Botoes grandes |
| Lavabo | 450px/450px | 3 | 3 (3 luzes) | ❌ | ⚠️ "Todas luzes" quebrado |
| Circulacao | — | — | Toggle direto | ❌ | ✅ OK |

---

### PROBLEMA 1: Botao do AC Nao Acende Visualmente

**Sintoma:** O icone do AC muda de cor (cinza → azul) quando ligado, mas o FUNDO do
botao permanece escuro/cinza em vez de ficar branco como nos demais botoes.

**Analise da cadeia de templates:**

1. **Template `base` (tpl_base.yaml:23-24)** define `variables.state_on`:
   ```
   state_on = ['on','home','cool','fan_only','unlocked','open','streaming','yes',...].indexOf(entity.state) !== -1
   ```
   JA inclui 'cool' e 'fan_only'. Deveria funcionar para climate.

2. **Template `base` (tpl_base.yaml:90-101)** define `styles.card.background-color`:
   ```
   return variables.state_on ? 'rgba(250,250,250,0.75)' : 'rgba(115,115,115,0.2)'
   ```
   Usa `variables.state_on` para decidir branco vs cinza.

3. **O botao do AC (room_living_all_buttons.yaml:692-741)** FAZ OVERRIDE de ambos:
   - Override de `variables.state_on` (linhas 702-703): verifica climate states
   - Override de `styles.card.background-color` (linhas 714-727): mesma logica branco/cinza

4. **O BUG:** O button-card processa templates na seguinte ordem:
   - Card-level styles → Template-level styles (base)
   - O template `base` avalia `variables.state_on` com SUA PROPRIA definicao
   - O override do card e processado ANTES, e o template SOBRESCREVE depois
   - Resultado: o template base reavalia background-color usando sua versao de state_on

**Solucao proposta:**
- Opcao A: Criar template `tpl_popup_climate` (como tpl_popup_light) que inclua
  state_on correto para climate na cadeia de heranca
- Opcao B: Remover override de styles.card do botao AC e garantir que a variavel
  state_on do base (que JA inclui 'cool','fan_only') funcione — verificar se o
  override de variables no card realmente prevalece sobre o do template
- Opcao C: Usar `state:` section do button-card com operator:template
  (tentado antes — falhou por mesmo motivo de cascata)
- **RECOMENDADO: Opcao A** — template dedicado garante ordem de avaliacao correta

**Template `icon_climate` (tpl_icons.yaml:1322-1342):**
- Define fill azul (#3583b6) quando ativo, cinza (#9da0a2) quando off
- NAO define state_on nem styles.card — so afeta o icone SVG
- Isso explica por que o icone funciona mas o fundo nao

---

### PROBLEMA 2: Spotify — Arquitetura Inadequada

**Situacao atual:**
- Todos os comodos usam MESMA entidade: `media_player.spotifyplus_bruno_helasio`
- Todos abrem MESMO popup: `media_spotify.yaml`
- Popup usa `custom:spotify-card` (card generico antigo)
- tap_action faz `media_player.media_play_pause` (global, sem device control)
- Nenhuma entidade Alexa esta ativa nos botoes

**Problema:** Play/pause controla o ULTIMO dispositivo ativo do Spotify, sem
distincao por comodo. Nao e possivel direcionar para a Alexa especifica.

**Solucao proposta: SpotifyPlus Card (`custom:spotifyplus-card`)**

O repositorio `thlucas1/spotifyplus_card` oferece:
- `deviceDefaultId`: define dispositivo padrao por instancia do card
- Player completo: artwork, progress bar, controles, volume
- Selecao de devices: lista todos os Spotify Connect
- Favoritos, busca, presets

**Integracao com Alexa Media Player:**
- `deviceDefaultId` aponta para o nome do Echo no Spotify Connect
- Cada comodo tera popup Spotify PROPRIO com seu deviceDefaultId
- O SpotifyPlus integration precisa reconhecer os Echo como dispositivos Spotify Connect

**Mapeamento Spotify → Alexa por comodo:**

| Comodo | deviceDefaultId (nome no Spotify Connect) | Entidade Alexa |
|--------|-------------------------------------------|----------------|
| Sala | (verificar nome do Echo Show no Spotify) | media_player.echo_show |
| Office | (verificar nome do Echo Pop no Spotify) | media_player.echo_pop_office |
| Quarto Casal | (verificar nome do Echo Pop no Spotify) | media_player.echo_pop_quarto_casal |
| Quarto Marina | (verificar nome do Echo Pop no Spotify) | media_player.echo_pop_marina |
| Quarto Miguel | ❌ Sem Alexa — botao Spotify desabilitado | — |
| Cozinha | ❌ Sem Alexa — sem botao Spotify | — |
| Lavabo | ❌ Sem botao Spotify | — |

**PENDENTE:** Usuario precisa confirmar os nomes EXATOS dos Echo no Spotify Connect
(ex: "Echo Show", "Echo Pop de Bruno — Office", etc.)

**Arquivos de popup Spotify por comodo (a criar):**
- `media_spotify_sala.yaml` → deviceDefaultId: "Echo Show" (ou nome real)
- `media_spotify_office.yaml` → deviceDefaultId: "Echo Pop Office" (ou nome real)
- `media_spotify_quarto_casal.yaml` → deviceDefaultId: "Echo Pop Quarto Casal" (ou nome real)
- `media_spotify_quarto_marina.yaml` → deviceDefaultId: "Echo Pop Marina" (ou nome real)

---

### PROBLEMA 3: Dimensionamento dos Pop-ups e Botoes

**Diagnostico por resolucao:**
- Tablet landscape: ~1920-2000px de largura
- 65vw = ~1248-1300px de popup
- Layout 1.4fr + 1.0fr = ~729px botoes + ~521px camera
- 5 colunas × 98px = 490px + gaps → OK no espaco de 729px
- 3 colunas × 98px = 294px + gaps → 294px vs 729px = MUITO espaco sobrando

**O problema nao e que os botoes sao grandes (sao 98px fixos em todos os comodos).
O problema e que o POPUP e grande demais para 3 colunas.**

**Opcoes de solucao (camera mantida por decisao do usuario):**

| Opcao | Popup Width | Grid Cols | Resultado |
|-------|------------|-----------|-----------|
| A. Popup menor | 650px | 3 × 98px | Botoes 98px, camera compactada |
| B. Botoes 1fr | 65vw/980px | 3 × 1fr | Botoes ~240px cada (MUITO grandes) |
| C. Layout adaptativo | auto | 3 × 98px justify-center | Botoes centralizados, popup cheio |
| D. Tamanho fixo por comodo | px fixo | 3 × 98px | Controle total |

**RECOMENDACAO: Opcao D (tamanho fixo por comodo)**

| Comodo | Popup Width | Layout | Colunas |
|--------|------------|--------|---------|
| Sala | 980px | 1.4fr 1.0fr | 5 × 98px |
| Quartos (casal/miguel/marina) | 980px | 1.4fr 1.0fr | 5 × 98px |
| Office | 680px | 1.2fr 1.0fr | 3 × 98px |
| Cozinha | 680px | 1.2fr 1.0fr | 3 × 98px |
| Lavabo | 450px | vertical-stack | 3 × 98px |

Isso mantem botoes uniformes de 98px e ajusta o CONTAINER ao conteudo.

---

### PROBLEMA 4: Responsividade e Performance

**Causa provavel: `triggers_update: all` no template `base`**

O template `base` (tpl_base.yaml:37) define `triggers_update: all`, o que faz
CADA button-card re-renderizar em QUALQUER mudanca de estado de QUALQUER entidade.

Num popup com 14 botoes (Sala), cada mudanca de estado gera 14 re-renderizacoes.
Com dezenas de entidades mudando estado por minuto, o total de re-renders e enorme.

**Agravantes:**
- Templates aninhados: base → tpl_popup_base → tpl_popup_light → icon_light_flush
  + circle + loader = JS avaliado dinamicamente a cada render
- card_mod presente em quase todo card
- Cameras ao vivo fazem polling periodico
- 61KB de templates JS no tpl_base.yaml

**Solucoes possiveis:**
1. Substituir `triggers_update: all` por lista especifica de entidades por botao
2. Usar cards mais leves (mushroom, etc.) para botoes simples
3. Reduzir animacoes CSS ativas simultaneamente
4. Lazy-load cameras (so renderizar quando popup abrir)

---

### PROBLEMA 5: "Todas as Luzes" — Lavabo Quebrado + Toggle Visual

**Lavabo (lavabo.yaml:122-153):**
- Botao titulo "Luzes" NAO tem `entity` definido
- `tap_action: action: none` — nao faz NADA ao clicar
- Icone fixo cinza, sem feedback visual de estado
- **FIX:** Adicionar `entity: light.grupo_luzes_lavabo` e `tap_action: action: toggle`

**Sala e demais comodos (room_living_all_buttons.yaml:298-333):**
- Botao titulo tem `entity: light.grupo_luzes_*`
- `tap_action: action: toggle`
- Icone muda cor: dourado (#f0c040) quando on, cinza quando off
- **FUNCIONA** mas sem toggle visual (apenas icone muda cor)

**Toggle visual solicitado pelo usuario:**
- Adicionar elemento ON/OFF ao lado do icone de lampadas
- Azul quando ativado, cinza quando desativado
- Logica: qualquer luz acesa → clicar desliga todas; todas apagadas → clicar acende todas
- Implementavel via `custom_fields` no button-card com HTML/SVG inline
- Deve ser replicado em TODOS os comodos

---

### PROBLEMA 6: Quarto Miguel — Problemas Especificos

**6.1. Grid button nao reflete estado das luzes:**
- Entity: `light.grupo_luzes_quarto_miguel` (grupo HA, recriado pelo usuario)
- `active: ''` (vazio) — sem sensor de atividade
- Sem `triggers_update` especifico — nao atualiza periodicamente
- A Sala tem: `active: sensor.living_room_active` + `triggers_update: [sensor.time, sensor.living_room_active]`
- **FIX:** Ou criar sensor `sensor.quarto_miguel_active` ou usar fallback direto do grupo

**6.2. Botao luz principal (popup) nao acende visualmente:**
- Entity: `switch.quarto_miguel_switch_2` (tipo switch, nao light)
- Template `tpl_popup_light` herda de `base` que verifica state == 'on'
- Switch tem state 'on'/'off' — DEVERIA funcionar
- **VERIFICAR:** Se o grupo `light.grupo_luzes_quarto_miguel` esta configurado
  corretamente no HA com os switches como membros. Grupo foi recriado.

**6.3. Duplicata de variaveis no grid (tpl_grid_room2.yaml:63-69):**
- `ac_entity: climate.ac_quarto_miguel` aparece DUAS vezes (linhas 65 e 69)
- Nao causa erro mas indica limpeza necessaria

---

### PROBLEMA 7: Indicadores de Status no Botao Principal

**Templates de status (tpl_sectors.yaml):**

| Template | Icone | Condicao | Cor | Comodos Ativos |
|----------|-------|----------|-----|----------------|
| motion | mdi:walk | binary_sensor = on | Active color | Sala (vazio) |
| ac_status | mdi:snowflake | climate in cool/heat/fan_only/dry | Azul #3583b6 | Sala, Office, Q.Miguel |
| media_status | mdi:television | media_player in playing/on | Active color | Sala (TV) |
| lights_status | mdi:lightbulb-on | lights_on_count > 0 | Amarelo #f0c040 | Sala (via sensor) |

**Problema:** Apenas a Sala tem `active: sensor.living_room_active` e
`triggers_update: [sensor.time, sensor.living_room_active]`. Todos os demais
comodos tem `active: ''` — sem sensor, sem contagem de luzes, sem timer.

**Para status de midia/Spotify:** Nenhum comodo tem `media_status` apontando
para Spotify. Quando integrado com SpotifyPlus Card, considerar adicionar
`media_entity: media_player.spotifyplus_bruno_helasio` nos comodos relevantes.

---

### Plano de Implementacao Consolidado

**Fase C1: Correcoes Urgentes (baixo risco, impacto imediato)**

| # | Acao | Arquivo(s) | Complexidade |
|---|------|-----------|-------------|
| C1.1 | Corrigir "todas as luzes" lavabo | lavabo.yaml | Baixa |
| C1.2 | Criar template tpl_popup_climate | tpl_sectors.yaml ou tpl_base.yaml | Media |
| C1.3 | Aplicar tpl_popup_climate em todos os botoes AC | room_*_all_buttons.yaml | Baixa |
| C1.4 | Limpar duplicata ac_entity em tpl_grid_room2 | tpl_grid_room2.yaml | Baixa |

**Fase C2: Dimensionamento dos Pop-ups (media complexidade)**

| # | Acao | Arquivo(s) | Complexidade |
|---|------|-----------|-------------|
| C2.1 | Reduzir popup Office para 680px | office.yaml | Baixa |
| C2.2 | Reduzir popup Cozinha para 680px | kitchen.yaml | Baixa |
| C2.3 | Ajustar layout 1.2fr 1.0fr para 3-col | office.yaml, kitchen.yaml | Baixa |

**Fase C3: Spotify com SpotifyPlus Card (alta complexidade)**

| # | Acao | Arquivo(s) | Complexidade |
|---|------|-----------|-------------|
| C3.1 | Verificar nomes dos Echo no Spotify Connect | (usuario confirma) | — |
| C3.2 | Criar popup Spotify por comodo (4 arquivos) | media_spotify_*.yaml | Media |
| C3.3 | Atualizar hold_action do botao Spotify por comodo | room_*_all_buttons.yaml | Baixa |
| C3.4 | Desabilitar botao Spotify em comodos sem Alexa | room_quarto_miguel_all_buttons.yaml | Baixa |

**Fase C4: Toggle Visual "Todas as Luzes"**

| # | Acao | Arquivo(s) | Complexidade |
|---|------|-----------|-------------|
| C4.1 | Criar elemento toggle ON/OFF com custom_fields | Header de cada room_*_all_buttons.yaml + lavabo.yaml | Media |
| C4.2 | Replicar em todos os comodos | 7 arquivos | Baixa |

**Fase C5: Quarto Miguel e Status Indicators**

| # | Acao | Arquivo(s) | Complexidade |
|---|------|-----------|-------------|
| C5.1 | Investigar grupo light.grupo_luzes_quarto_miguel | configuration.yaml / helpers | Baixa |
| C5.2 | Adicionar triggers_update no grid button Q.Miguel | tpl_grid_room2.yaml | Baixa |
| C5.3 | Validar state_on para switch entities no popup | tpl_base.yaml, tpl_sectors.yaml | Media |
| C5.4 | Criar sensors *_active para demais comodos (HA config) | (fora do dashboard) | Media |

**Fase C6: Performance e Responsividade**

| # | Acao | Arquivo(s) | Complexidade |
|---|------|-----------|-------------|
| C6.1 | Substituir triggers_update:all por listas especificas | tpl_base.yaml (global) ou por card | Alta |
| C6.2 | Avaliar substituicao de button-card por cards leves | Multiplos | Alta |

**PENDENCIAS que dependem do usuario:**
1. Nomes EXATOS dos Echo no Spotify Connect (para deviceDefaultId)
2. ~~Verificacao do grupo light.grupo_luzes_quarto_miguel no HA (recriado)~~ **RESOLVIDO** (usuario recriou grupo)
3. ~~Autorizacao para iniciar implementacao~~ **AUTORIZADO** (2026-03-28)

---

## Registro de Implementacao — Fases C1 a C6 (2026-03-28)

Implementacao consolidada das fases C1-C6 conforme autorizacao do usuario.
Todas as alteracoes sao incrementais e reversiveis (codigo anterior comentado).

### Resolucoes Confirmadas pelo Usuario

| Item | Status | Nota |
|------|--------|------|
| Quarto Miguel — botao grid nao acendia | ✅ RESOLVIDO | Usuario recriou grupo `light.grupo_luzes_quarto_miguel`. Botao voltou a acender. |
| Grupo Q.Miguel indisponivel | ✅ RESOLVIDO | Excluido e recriado com mesmo nome no HA |
| Cameras nos popups Cozinha/Office | MANTIDAS | Usuario confirmou que quer manter cameras nesses comodos |

### Alteracoes Implementadas

| Fase | Arquivo | Alteracao | Detalhes |
|------|---------|-----------|----------|
| C1.1 | `shared/popup/rooms/lavabo.yaml` | Fix "todas as luzes" | Adicionado `entity: light.grupo_luzes_lavabo`, `tap_action: toggle`, cor dinamica do icone (amarelo on, cinza off) |
| C2.1 | `shared/popup/rooms/office.yaml` | Popup 680px | Reduzido de 65vw/980px para 680px fixo (3-col room com camera) |
| C2.2 | `shared/popup/rooms/kitchen.yaml` | Popup 680px | Reduzido de 65vw/980px para 680px fixo (3-col room com camera) |
| C2.3 | `shared/popup/rooms/office.yaml`, `kitchen.yaml` | Layout 1.2fr 1.0fr | Proporcao ajustada para 3 colunas de botoes 98px (antes 1.4fr sobrava espaco) |
| C4.1 | `shared/columns/room_living_all_buttons.yaml` | ON/OFF badge Sala | Pill badge azul (#3b82f6) quando ON, cinza quando OFF — custom_field no header Luzes |
| C4.1 | `shared/columns/room_office_all_buttons.yaml` | ON/OFF badge Office | Mesmo padrao visual |
| C4.1 | `shared/columns/room_cozinha_all_buttons.yaml` | ON/OFF badge Cozinha | Mesmo padrao visual |
| C4.1 | `shared/columns/room_quarto_casal_all_buttons.yaml` | ON/OFF badge Q.Casal | Mesmo padrao visual |
| C4.1 | `shared/columns/room_quarto_marina_all_buttons.yaml` | ON/OFF badge Q.Marina | Mesmo padrao visual |
| C4.1 | `shared/columns/room_quarto_miguel_all_buttons.yaml` | ON/OFF badge Q.Miguel | Mesmo padrao visual |
| C4.1 | `shared/popup/rooms/lavabo.yaml` | ON/OFF badge Lavabo | Mesmo padrao visual |
| C5.2 | `templates/streamline_templates/tpl_grid_room2.yaml` | triggers_update Q.Miguel | Adicionado `triggers_update: [sensor.time]` para atualizar timer periodicamente |

### Fases NAO implementadas (justificativa)

| Fase | Motivo |
|------|--------|
| C1.2-C1.3 | Template tpl_popup_climate — AC button styling (P5) permanece como pendencia. Requer investigacao mais profunda da cascata CSS do button-card. |
| C3 | Spotify por comodo — Aguarda nomes dos Echo no Spotify Connect (deviceDefaultId) |
| C5.1 | Grupo Q.Miguel — RESOLVIDO pelo usuario (recriou grupo no HA) |
| C5.3-C5.4 | Sensors *_active — Requer criacao no HA (fora do dashboard) |
| C6.1-C6.2 | Performance — Alta complexidade, risco de quebrar cards existentes. Adiado. |

### Pendencias Atualizadas (P1-P6 + P7)

| # | Pendencia | Status | Nota |
|---|-----------|--------|------|
| P1 | Espacamento lateral dos botoes | ⏳ PENDENTE | Grid nativo do HA impoe espacamento minimo |
| P2 | Smart Remote TV — botoes | ⏳ PENDENTE | Precisa debug do remote.send_command |
| P3 | Spotify — botao nao liga | ⏳ PENDENTE | Integracao SpotifyPlus pode precisar de config adicional |
| P4 | Hold do AC — erro config | ⏳ PENDENTE | Popup thermostat pode nao estar carregando |
| P5 | AC ligado — botao nao fica branco | ✅ RESOLVIDO | Criado tpl_popup_climate (C1.2-C1.3) — herda base com state_on correto para climate |
| P6 | Quarto Miguel — botao grid | ✅ RESOLVIDO | Usuario recriou grupo. triggers_update adicionado (C5.2) |

---

## Registro de Implementacao — Fases C1.2-C1.3, C3, C5.3-C5.4 (2026-03-28)

Implementacao das fases pendentes conforme solicitacao do usuario.

### C1.2-C1.3 — Investigacao profunda + Fix AC Button (P5)

**Analise da causa raiz:**
1. Template `base` (tpl_base.yaml:23-24) define `state_on` que JA inclui 'cool' e 'fan_only'
2. Template `base` (tpl_base.yaml:90-101) usa `variables.state_on` para `styles.card.background-color`
3. Botoes AC tinham override de `variables.state_on` E `styles.card.background-color` no card-level
4. O button-card avaliava a cadeia de templates numa ordem que causava conflito entre o override do card e o do template base

**Solucao implementada: `tpl_popup_climate`**
- Criado template `tpl_popup_climate` em `tpl_sectors.yaml` (herda de `base`)
- Define `state_on` correto para climate: `['cool', 'fan_only', 'dry', 'heat', 'heat_cool', 'auto']`
- O `styles.card.background-color` do `base` agora usa o `state_on` do `tpl_popup_climate` (branco quando ativo)
- Nao precisa mais de override de styles no card-level — a heranca funciona corretamente
- Botoes AC usam: `template: [tpl_popup_climate, icon_climate]`

**Arquivos alterados:**
| Arquivo | Alteracao |
|---------|-----------|
| `tpl_sectors.yaml` | Novo template `tpl_popup_climate` (apos `tpl_popup_light`) |
| `room_living_all_buttons.yaml` | AC button: base → tpl_popup_climate, styles override comentado |
| `room_office_all_buttons.yaml` | AC button: base → tpl_popup_climate, styles override comentado |
| `room_quarto_miguel_all_buttons.yaml` | AC button: base → tpl_popup_climate, styles override comentado |

### C3 — Spotify Per-Room com Default Device

**Dispositivos Alexa confirmados pelo usuario:**
| Comodo | Nome do Echo | Entity ID HA | Nome Spotify Connect |
|--------|-------------|-------------|---------------------|
| Sala | Echo Show | media_player.echo_show | Echo Show |
| Office | Echo Pop Office | media_player.echo_pop_office | Echo Pop Office |
| Quarto Casal | Echo Pop Quarto Casal | media_player.echo_pop_quarto_casal | Echo Pop Quarto Casal |
| Quarto Marina | Echo Pop Marina | media_player.echo_pop_marina | Echo Pop Marina |
| Quarto Miguel | — | — | ❌ Sem Alexa |
| Cozinha | — | — | ❌ Sem Alexa |
| Lavabo | — | — | ❌ Sem Alexa |

**Popups criados:**
| Arquivo | default_device | Tag |
|---------|---------------|-----|
| `media_spotify_sala.yaml` | Echo Show | spotify_sala |
| `media_spotify_office.yaml` | Echo Pop Office | spotify_office |
| `media_spotify_quarto_casal.yaml` | Echo Pop Quarto Casal | spotify_quarto_casal |
| `media_spotify_quarto_marina.yaml` | Echo Pop Marina | spotify_quarto_marina |

**Botoes atualizados:**
| Comodo | hold_action | Nota |
|--------|------------|------|
| Sala | media_spotify_sala.yaml | ✅ |
| Office | media_spotify_office.yaml | ✅ |
| Quarto Casal | media_spotify_quarto_casal.yaml | ✅ |
| Quarto Marina | media_spotify_quarto_marina.yaml | ✅ |
| Quarto Miguel | Desabilitado (opacity 0.35) | Sem Alexa — botao placeholder |

**NOTA IMPORTANTE:** Os nomes de `default_device` devem corresponder EXATAMENTE aos
nomes dos dispositivos no Spotify Connect. Se o Spotify mostrar os dispositivos com
nomes diferentes (ex: "Echo Show de Bruno", "Echo Pop - Office"), ajustar manualmente
nos arquivos media_spotify_*.yaml.

O arquivo `media_spotify.yaml` original (popup compartilhado sem device targeting)
foi MANTIDO intacto para referencia futura.

### C5.3-C5.4 — Orientacao para criar sensors active (ver abaixo)

Orientacao fornecida ao usuario sobre como criar template sensors para cada comodo.
Definicoes devem ser adicionadas em `config/packages/templates/sensors/template_sensors.yaml`.

---

## Registro de Implementacao — Sessao 2026-03-28 (tarde)

Implementacao consolidada dos problemas prioritarios reportados pelo usuario.

### Alteracoes Implementadas

| # | Problema | Solucao | Arquivos |
|---|----------|---------|----------|
| 1 | Nomes/entidades incorretos nos botoes | Corrigidos prefixos (SL-, VR-, CZ-, QC-, QMI-, QMA-, OF-, LV-). Q.Miguel: switch.* → light.* | room_*_all_buttons.yaml, lavabo.yaml, tpl_grid_room2.yaml |
| 2 | Botoes 98px esticavam em popups 3-col | justify-content: start nos grids 3-col. Popups cozinha/office: auto 1fr (col botoes auto-size) | room_cozinha/office_all_buttons.yaml, kitchen/office.yaml, lavabo.yaml |
| 3 | Toggle ON/OFF nao atualizava visualmente | Badge ON/OFF → toggle switch CSS (iOS-style). triggers_update com entidade grupo | 7 arquivos room_*_all_buttons.yaml + lavabo.yaml |
| 4 | Spotify nao iniciava sem device ativo | tap_action: spotifyplus.player_media_play_pause com device_name por comodo | room_living/office/quarto_casal/quarto_marina_all_buttons.yaml |
| 5 | SpotifyPlus Card nao implementado | Auditado: custom:spotify-card funcional. spotifyplus-card NAO instalado (documentado) | media_spotify_*.yaml (4 arquivos) |
| 6 | Template sensors nao conectados ao grid | active: sensor.NOME_active + triggers_update em todos os grid buttons | tpl_grid_mainrooms.yaml, tpl_grid_room2.yaml |
| 7 | Security: Alarm sem funcao, Front Door errado | Front Door → lock.sl_fechadura_operate_lock. Alarm → Cameras (popup 8 cameras). Doors/Sensors → placeholders | tpl_grid_security.yaml, security-status.yaml, cameras_user.yaml (NOVO) |
| 8 | Planta 3D ausente do dashboard | Botao no footer com navigate para /lovelace/floorplan | footer-shared.yaml |

### Detalhes Tecnicos

**Toggle switch visual:**
- CSS puro: div 36x20px, border-radius: 10px, knob branco 16px com transition 0.25s
- Azul #3b82f6 quando ON, rgba(255,255,255,0.2) quando OFF
- triggers_update com entidade do grupo garante re-render instantaneo

**Spotify tap_action:**
- Servico: spotifyplus.player_media_play_pause (integracao SpotifyPlus v1.0.187)
- Parametro device_name envia playback para Echo especifico do comodo
- Sala: "Echo Show", Office: "Echo Pop Office", Q.Casal: "Echo Pop Quarto Casal", Q.Marina: "Echo Pop Marina"
- Q.Miguel: desabilitado (sem Alexa)
- TENTATIVAS ANTERIORES: media_player.media_play_pause (falhava sem device ativo)

**Popup padronizacao 3-col:**
- grid-template-columns: repeat(3, 98px) com justify-content: start
- Popup layout: auto 1fr (coluna botoes auto-size, camera preenche o resto)
- TENTATIVAS ANTERIORES: 1.2fr 1.0fr (botoes esticavam), repeat(3, 98px) sem justify-content (gap visual)

**Security block:**
- Cameras popup: 8 cameras em grid 2x2 responsivo (2 colunas desktop, 1 coluna mobile)
- Doors/Sensors: placeholders com base template, opacity 0.45, sem entidade (nao gera erro)
- Alarm original: COMENTADO (nunca deletado — Regra de Ouro)

### Pendencias Atualizadas

| # | Pendencia | Status | Nota |
|---|-----------|--------|------|
| P1 | Espacamento lateral dos botoes | ⏳ PENDENTE | Grid nativo do HA impoe espacamento minimo |
| P2 | Smart Remote TV — botoes | ⏳ PENDENTE | Precisa debug do remote.send_command |
| P3 | Spotify — botao nao liga | ✅ RESOLVIDO | spotifyplus.player_media_play_pause com device_name |
| P4 | Hold do AC — erro config | ⏳ PENDENTE | Popup thermostat pode nao estar carregando |
| P5 | AC ligado — botao nao fica branco | ✅ RESOLVIDO | tpl_popup_climate com state_on correto |
| P6 | Quarto Miguel — botao grid | ✅ RESOLVIDO | Grupo recriado + triggers_update |
| P7 | Toggle nao atualizava visualmente | ✅ RESOLVIDO | Toggle switch CSS + triggers_update |
| P8 | Botoes 3-col esticavam | ✅ RESOLVIDO | justify-content: start + auto 1fr |
| P9 | Sensors nao conectados ao grid | ✅ RESOLVIDO | active + triggers_update em todos os comodos |
| P10 | Nomes incorretos nos botoes | ✅ RESOLVIDO | Prefixos por comodo (SL-, CZ-, QC-, etc.) |
| P11 | Q.Miguel entidades switch→light | ✅ RESOLVIDO | Entidades atualizadas de switch.* para light.* |
| P12 | Security sem funcao util | ✅ RESOLVIDO | Front Door corrigido, Cameras popup, placeholders |
| P13 | Planta 3D ausente | ✅ RESOLVIDO | Botao no footer |

---

## Registro de Implementacao — Diagnostico Raiz Cameras e Media (2026-03-29)

Correcao dos ButtonCardErrors causados por entidades do repositorio original ngocjohn
que nao existem no setup do usuario. Todas as alteracoes seguem a Regra de Ouro
(codigo original comentado, nunca deletado).

### Diagnostico Raiz

**Cameras — Causa dos ButtonCardErrors no grid principal:**
O template `camera` em `tpl_sectors.yaml` tinha 3 dependencias que causavam erros JS:
1. `stream_state` variable: `states[variables.stream_status].state` → `stream_status` indefinido → JS error
2. `tooltip`: `states[variables.battery].state+' %'` → `battery` era '' → `states[''].state` → JS error
3. `tap_action`: `button.press` usando `states[variables.stream_status]` → JS error

**Media — Causa dos ButtonCardErrors no grid principal:**
1. Template `currently_playing` em `tpl_media.yaml`: card_mod hardcoded com `media_player.mass_universal_airplay` e `media_player.spotifyplus_ngoc_nguyen`
2. `media_universal.yaml`: criava `media_player.currently_playing` a partir de entidades europeias inexistentes
3. `hass_group.yaml`: grupos `cameras`, `device_players`, `conditional_media`, `homepod_airplay`, `homepod_mass_airplay` todos com entidades europeias
4. `currently_playing.yaml` popup: `sensor.youtube_thumbnail`, `sensor.muted_color`, `sensor.dark_vibrant_color` nao existem

### Alteracoes Implementadas

| Arquivo | Acao | Detalhes |
|---------|------|----------|
| `tpl_sectors.yaml` | Camera template reescrito | Removidos: battery, stream_status, button.press. tap_action → more-info. background-image usa entity.attributes.entity_picture direto. Circle e icon_spot_cam mantidos. |
| `tpl_media.yaml` | currently_playing card_mod corrigido | Removida referencia hardcoded a mass_universal_airplay e spotifyplus_ngoc_nguyen. Substituida por spotifyplus_bruno_helasio. |
| `hass_group.yaml` | Grupos cameras e media atualizados | cameras: 8 cameras do usuario. device_players: smart_tv_pro_2 + spotifyplus_bruno_helasio. conditional_media: TV + Spotify + 4 Echo devices. homepod_airplay e homepod_mass_airplay comentados. |
| `media_universal.yaml` | Reescrito com entidades do usuario | media_player.currently_playing: Spotify, Smart TV, Echo Show, 3 Echo Pop. select.conditional_media usa group.conditional_media atualizado. sensor.currently_playing simplificado (sem homepod groups). |
| `cameras.yaml` (popup) | Comentado inteiro | Popup de cameras europeias (terasa, zahrada, doorway, kids_room). Nao era referenciado por codigo ativo (grid usa cameras_user.yaml). Placeholder `action: none` mantido. |
| `currently_playing.yaml` (popup) | Corrigido entity refs | sensor.youtube_thumbnail → entity_picture direto. sensor.dark_vibrant_color → var(--mush-rgb-blue-grey). sensor.muted_color → var(--mush-rgb-blue-grey). living_room_tv → smart_tv_pro_2. bedroom_tv removido. |

### Arquivos NAO alterados (entidades europeias em codigo JA comentado)

Estes arquivos contem referencia a entidades europeias, mas APENAS em linhas ja comentadas:
- `tpl_grid_cameras.yaml`: cameras europeias ja estavam comentadas
- `grid_media.yaml`: 3 versoes anteriores com conditionals ja comentadas
- `atv_remote.yaml`: sensor.youtube_thumbnail em linhas comentadas e nao-comentadas (arquivo nao referenciado por codigo ativo)
- `floorplan/mediaplayers.yaml`: sensor.youtube_thumbnail (floorplan nao ativo no grid principal)

### Arquivos com entidades europeias em automations (NAO alterados)

`automations.yaml` contem ~30 referencias a cameras europeias (doorway, terasa, zahrada, kids_room)
em automacoes de snapshot e monitoramento. Estas automacoes falham silenciosamente no HA
quando as entidades nao existem — nao causam ButtonCardErrors no dashboard.
Recomendacao: comentar as automacoes europeias em sessao futura dedicada.

### Resumo de Entidades Substituidas

| Entidade Original (ngocjohn) | Entidade Nova (usuario) | Tipo |
|-------------------------------|-------------------------|------|
| camera.doorway | camera.sl_camera_2 | camera |
| camera.kids_room | camera.cz_camera_2 | camera |
| camera.terasa | camera.vr_camera_2 | camera |
| camera.zahrada | camera.as_camera_2 | camera |
| media_player.living_room_tv | media_player.smart_tv_pro_2 | media_player |
| media_player.spotifyplus_ngoc_nguyen | media_player.spotifyplus_bruno_helasio | media_player |
| media_player.mass_universal_airplay | (removido — nao existe) | media_player |
| media_player.kodi_atv | (removido — nao existe) | media_player |
| media_player.shield (bedroom_tv) | (removido — nao existe) | media_player |
| media_player.playstation_5 | (removido — nao existe) | media_player |
| sensor.youtube_thumbnail | (removido — nao existe) | sensor |
| sensor.muted_color | (removido — nao existe) | sensor |
| sensor.dark_vibrant_color | (removido — nao existe) | sensor |
| sensor.doorway_battery_percentage | (removido — nao existe) | sensor |
| sensor.terasa_battery_percentage | (removido — nao existe) | sensor |
| sensor.zahrada_battery_percentage | (removido — nao existe) | sensor |

### Para Restore

Todos os blocos originais estao comentados com marcadores:
- `# --- CÓDIGO ORIGINAL COMENTADO (...) ---`
- `# --- FIM CÓDIGO ORIGINAL ---`

Para restaurar qualquer bloco: descomentar o original e comentar a versao NOVO.

---

## Registro de Implementacao — Pipeline uix-dialog no Tema Tablet (2026-03-29)

Correcao da causa raiz do problema de redimensionamento de popups no tema tablet.
O tema tablet.yaml era o unico que NAO tinha o bloco `uix-dialog`, fazendo com que
`--popup-width` definido nos popups fosse IGNORADO pelo HA. Como compensacao, cada
popup tinha um `card_mod` hack direto no `.mdc-dialog__surface` com `!important`.

### Diagnostico

**Problema:** `--popup-width: 65vw` definido no `style:` dos popups nao era consumido
pelo tema tablet, ao contrario do Graphite Auto que tem:
```css
ha-dialog.type-browser-mod-popup {
  --ha-dialog-width-md: calc(var(--max-popup-column, 1) * var(--popup-width, 550px)) !important;
}
```

**Consequencia:** Cada popup precisava de `card_mod` com `ha-dialog$ .mdc-dialog__surface { width: 65vw !important }`
que SOBRESCREVIA o sistema nativo do HA, criando conflitos ao tentar redimensionar.

**Problema adicional:** `--button-card-border-radius: 10%` era exclusivo do tema tablet.
Em outros temas, `var(--button-card-border-radius)` = undefined → `calc(undefined / 2)` = 0 → botoes quadrados.

### Solucao Implementada

| Acao | Arquivo(s) | Detalhes |
|------|-----------|----------|
| Adicionar `uix-dialog` ao tema tablet | `tablet.yaml` | Bloco completo: blur(12px), scrim, centering, `--ha-dialog-width-md`, card resets. Adaptado do graphite-auto.yaml. |
| Comentar `card_mod` hack em todos os popups | 7 arquivos popup (rooms/*.yaml) | card_mod com `.mdc-dialog__surface { width: ... !important }` comentado. `--popup-width` no `style:` agora funciona nativamente. |
| Hardcode `border-radius: 10%` no tpl_base | `tpl_base.yaml` | Linha 70: `var(--button-card-border-radius)` → `10%` (mesma regra do tpl_popup_base:934). |
| Hardcode `border-radius` no tpl_media | `tpl_media.yaml` | 10 ocorrencias: `var(--button-card-border-radius)` → `10%`, `calc(.../2)` → `5%`. |
| Hardcode `border-radius` em templates auxiliares | `tpl_climate.yaml`, `tpl_iphone.yaml`, `horizontal_movies.yaml` | Mesmo padrao: `var(--button-card-border-radius)` → `10%` ou `5%`. |

### Pipeline de Sizing (como funciona agora)

```
popup style: --popup-width: 65vw
       ↓
tema tablet uix-dialog: --ha-dialog-width-md: calc(1 * 65vw)
       ↓
HA nativo dimensiona o dialog
       ↓
Para redimensionar: basta mudar --popup-width no style: do popup
```

### Arquivos Alterados

| Arquivo | Tipo de Alteracao |
|---------|-------------------|
| `config/themes/tablet.yaml` | ADICIONADO: bloco uix-dialog (linhas 98-142) |
| `config/dashboards/shared/popup/rooms/livingroom.yaml` | COMENTADO: card_mod inteiro |
| `config/dashboards/shared/popup/rooms/kitchen.yaml` | COMENTADO: card_mod inteiro |
| `config/dashboards/shared/popup/rooms/office.yaml` | COMENTADO: card_mod inteiro |
| `config/dashboards/shared/popup/rooms/quarto_casal.yaml` | COMENTADO: card_mod inteiro |
| `config/dashboards/shared/popup/rooms/quarto_miguel.yaml` | COMENTADO: card_mod inteiro |
| `config/dashboards/shared/popup/rooms/quarto_marina.yaml` | COMENTADO: card_mod inteiro |
| `config/dashboards/shared/popup/rooms/lavabo.yaml` | COMENTADO: card_mod inteiro |
| `config/dashboards/templates/button_card_templates/tpl_base.yaml` | HARDCODED: border-radius 10% + clip-paths |
| `config/dashboards/templates/button_card_templates/tpl_media.yaml` | HARDCODED: border-radius 10%/5% (10 ocorrencias) |
| `config/dashboards/templates/button_card_templates/tpl_climate.yaml` | HARDCODED: border-radius 10% |
| `config/dashboards/templates/button_card_templates/tpl_iphone.yaml` | HARDCODED: border-radius 10% |
| `config/dashboards/views/main-grid/horizontal_movies.yaml` | HARDCODED: border-radius 5% |

### Para Restaurar (Rollback)

1. **Popups:** Descomentar `card_mod:` em cada arquivo de popup (marcado com `# --- CÓDIGO ORIGINAL COMENTADO ---`)
2. **Tema:** Remover ou comentar o bloco `uix-dialog:` e as linhas `uix-browser-mod-popup-inner:` e `uix-more-info:` no tablet.yaml
3. **Border-radius:** Reverter `10%` → `var(--button-card-border-radius)` e `5%` → `calc(var(--button-card-border-radius) / 2)` nos templates

### Nota sobre --button-card-border-radius no tablet.yaml

A variavel `button-card-border-radius: 10%` PERMANECE definida no tablet.yaml (linha 25)
para manter compatibilidade com qualquer codigo que ainda a referencie indiretamente
(ex: via `--custom-button-card-border-radius` em cards de spotify). Os templates
principais agora usam valores hardcoded, tornando-os independentes do tema.

---

---

## Registro Pre-Implementacao — 2026-03-31 (Roborock Popup + Sidebar Re-Skin)

### Contexto da solicitacao

Usuario autorizou avancar para implementacao, com exigencia de registrar antes:
1) estado tecnico atual;
2) alteracoes planejadas;
3) trilha de restore/rollback.

Este registro congela o baseline imediatamente anterior a qualquer mudanca de implementacao.

### Baseline atual confirmado

#### A) Popup do vacuum no rodape

- Botao `Vacuum` do footer chama `config/dashboards/shared/popup/footer/footer_vacuum.yaml`.
- Popup atual esta nomeado como `Roborock S7` e utiliza entidades `vacuum.roborock_s7`.
- Ha risco alto de erro de configuracao no card `entities` por uso de `secondary_info` em formato objeto (`entity/prefix/postfix`) na linha principal do aspirador.
- Mapa usa `custom:xiaomi-vacuum-map-card` com `vacuum_platform: Roborock`.
- Ambiente ainda apresenta legado misto Roidmi/Roborock (ex.: notify do footer e honeycomb com `vacuum.roidmi_eve`).

#### B) Sidebar atual

- Largura do layout principal esta fixa em ~27% para coluna da sidebar (`minmax(260px, 27%)`) nos breakpoints principais.
- Estilo atual da moldura e glassmorphism definido no `sidebar_template` (`background gradient`, `backdrop blur 40px`, borda translucida e sombra).
- Estrutura funcional vigente (que deve ser preservada):
  1. relogio;
  2. data;
  3. saudacao;
  4. bloco dinamico com badges de luzes/midia/clima/presenca;
  5. acoes rapidas;
  6. previsao/tempo.
- Badge de presenca hoje ainda segue formato de pilula no bloco dinamico.

### Escopo autorizado para a proxima implementacao

#### Item 1 — Popup Roborock

Objetivo: remover erro de configuracao do popup sem reintroduzir tentativas fracassadas.

Plano tecnico:
1. Corrigir schema do bloco `Summary` para evitar quebra no card `entities`.
2. Validar compatibilidade da secao de mapa com a versao instalada do card de mapa do vacuum.
3. Alinhar referencias de entidade do vacuum em pontos criticos do dashboard para reduzir inconsistencia Roidmi/Roborock.
4. Preservar semantica funcional do popup (sumario, comandos basicos, mapa e configuracoes).

#### Item 2 — Sidebar (re-skin estetico + unica mudanca estrutural em presenca)

Objetivo: manter estrutura e funcoes, alterando apenas visual conforme diretriz.

Plano tecnico:
1. Substituir moldura glass atual por fundo preto continuo de coluna (estilo sagaland/lukevink), mantendo altura total.
2. Manter badges de luzes/midia/clima com mesma funcionalidade de expand/collapse e interacao; alterar somente estetica para modo flat, destacando pill apenas quando pressionada/ativa.
3. Executar unica mudanca estrutural solicitada:
   - remover badge de presenca do bloco principal;
   - criar secao inferior dedicada com pessoas presentes em avatares circulares.
4. Manter intactas acoes rapidas e card de tempo/previsao na mesma hierarquia funcional.
5. Nao alterar logica de performance existente (`triggers_update` direcionado; sem retornar para `all`).

### Regras de execucao para preservar restore

- Regra de ouro mantida: nao excluir codigo existente; comentar antes de substituir.
- Implementacao incremental por blocos pequenos para rollback rapido.
- Qualquer ajuste adicional fora do escopo acima exige nova aprovacao do usuario.

### Critérios de aceite (pre-definidos)

#### Popup Roborock
- Ao clicar no botao do footer, popup abre sem `Configuration error`.
- Cards internos carregam sem quebrar toda a janela.
- Comandos principais do vacuum permanecem operacionais.

#### Sidebar
- Layout continua ocupando faixa lateral prevista no grid.
- Ordem funcional original dos blocos permanece.
- Apenas presenca muda de estrutura para avatares circulares na base.
- Demais mudancas sao exclusivamente visuais.

### Restore rapido (caso necessario)

- Referencia baseline: este registro + estado Git imediatamente anterior ao commit de implementacao.
- Em caso de regressao, reverter por:
  1) descomentar blocos anteriores mantidos in-place; ou
  2) `git revert` do(s) commit(s) de implementacao.


## Registro de Implementacao — 2026-03-31 (Frosted Dark Sagalang + ajustes popup/sidebar)

### Objetivo

Aplicar o contraste visual solicitado (barra fixa preta + painel cinza escuro) sem perder identidade frosted,
resolver o erro do popup do vacuum e registrar trilha de restore.

### Alteracoes executadas

1. **Novo tema adicionado**
   - Arquivo: `config/themes/frosted_dark_sagalang.yaml`
   - Tema novo com base no Frosted Dark informado pelo usuario, ajustado para contraste:
     - `sidebar-background-color` em tom preto profundo;
     - `secondary-background-color` para painel cinza escuro;
     - `lovelace-background` sem imagem, seguindo cor do tema.

2. **View principal migrada para novo tema**
   - Arquivo: `config/dashboards/views/main.yaml`
   - `theme` alterado de `tablet` para `frosted_dark_sagalang`.
   - Fundo da view alterado de radial custom para `var(--secondary-background-color)`
     para obedecer o tema ativo e manter contraste com a sidebar.

3. **Popup Roborock (erro de configuracao)**
   - Arquivo: `config/dashboards/shared/popup/footer/footer_vacuum.yaml`
   - Bloco row invalido (`custom:mod-card` dentro de `entities`) foi mantido em comentario
     e substituido por `custom:hui-element` com `card_type: horizontal-stack`.
   - Objetivo: eliminar `Configuration Error` ao abrir popup.

4. **Sidebar (estilo dos botoes)**
   - Arquivo: `config/dashboards/templates/button_card_templates/tpl_sidebar.yaml`
   - Reaplicado visual frosted nos badges de Luzes/Midia/Clima
     (fundo + borda translucidos quando inativos e destaque ao expandir),
     conforme diretriz de manter botoes em estilo vidro fosco.

### Restore rapido

- Reverter tema da view: `theme: frosted_dark_sagalang` -> `theme: tablet` em `main.yaml`.
- Reativar fundo anterior: descomentar/comentar bloco de background em `main.yaml`.
- Popup vacuum: reverter para bloco anterior comentado no proprio arquivo.
- Tema novo: remover `config/themes/frosted_dark_sagalang.yaml` se necessario.


## Registro de Correcao de Regressao — 2026-03-31 (hotfix visual pos-feedback)

### Problema reportado pelo usuario

Apos migracao para `frosted_dark_sagalang`, o dashboard apresentou regressao visual:
- escala/tamanho alterado (incluindo rodape),
- tonalidade azulada indesejada no painel,
- barra lateral sem leitura visual esperada,
- efeito frosted ainda presente em blocos que deveriam ficar sem destaque.

### Correcao aplicada

1. **Restore de tema na view principal**
   - `config/dashboards/views/main.yaml`
   - tema da view retornado para `tablet` (com `frosted_dark_sagalang` comentado),
     para restaurar escala/espacamentos originais do dashboard.

2. **Fundo principal neutralizado**
   - `config/dashboards/views/main.yaml`
   - fundo alterado para cinza neutro `#2f3342` (sem dominante azul),
     mantendo contraste com a sidebar preta.

3. **Remocao de destaque indevido**
   - `config/dashboards/templates/button_card_templates/tpl_sidebar.yaml`
   - botao `Apagar Todas as Luzes`: `background: transparent; border: none`.
   - card de tempo/clima na base: `background: transparent; border: none`.

### Estado funcional preservado

- Correcao estrutural do popup Roborock mantida (row valida em `entities`).
- Presenca em avatares na base da sidebar mantida.



---

## Registro de Implementacao — Correcoes de 5 Problemas Persistentes (2026-04-01)

### Problemas corrigidos

#### Problema 1 — Presenca desalinhada na Sidebar

**Arquivo:** `config/dashboards/templates/button_card_templates/tpl_sidebar.yaml`

**Causa-raiz:** O bloco "PESSOAS EM CASA" (wrapper div + avatares) nao tinha padding-left,
ficando rente a borda esquerda do container. Os badges de Luzes/Midia/Clima possuem
`padding: 12px 16px`, portanto o icone/texto dos badges comeca a 16px da esquerda.
O container "PESSOAS EM CASA" comeava a 0px, causando desalinhamento visivel.

**Solucao aplicada:**
- Wrapper externo do bloco presenca: adicionado `padding-left: 12px`
- Div interno dos avatares: adicionado `padding-left: 4px` (total: 16px da esquerda)
- Codigo original comentado inline antes da alteracao

**Rollback:** descomentar o bloco `<!-- ORIGINAL: ... FIM ORIGINAL -->` e remover o bloco NOVO.

---

#### Problema 2 — Botao Refresh sem efeito

**Arquivos:**
- `config/dashboards/views/media-grid/footer_copy.yaml`
- `config/dashboards/templates/streamline_templates/streamline-card.yaml`

(Nota: `shared/footer-shared.yaml` ja estava corrigido desde sessao anterior.)

**Causa-raiz:** O botao Refresh chamava `browser_mod.sequence` com dois passos:
1. `shell_command.refresh_lovelace` — fazia git pull do repo europeu ngocjohn (inutil no contexto do usuario)
2. `browser_mod.javascript: lovelace_reload()` — sem mudancas pendentes no YAML, nao produzia efeito visivel

**Solucao aplicada:** Substituido por `browser_mod.javascript` com `code: location.reload()`
— hard reload do navegador no tablet, unico efeito util no contexto atual.

**Rollback:** descomentar o bloco `# ANTERIOR: ...` e remover o bloco `# NOVO:`.

---

#### Problema 3 — Vacuum popup com erro de configuracao

**Arquivo:** `config/dashboards/shared/popup/footer/footer_vacuum.yaml`

**Causa-raiz:** O `map_source.camera` referenciava `image.roborock_s7_map_0_custom`
(com sufixo `_custom`) que nao existe no HA. A entidade correta criada pela integracao
Roborock e `image.roborock_s7_map_0` (sem sufixo). Adicionalmente, `vacuum_platform`
estava como `default` em vez de `Roborock`.

**Solucao aplicada:**
- `camera: image.roborock_s7_map_0_custom` → `camera: image.roborock_s7_map_0`
- `vacuum_platform: default` → `vacuum_platform: Roborock`
- Linhas anteriores comentadas inline

**Rollback:** reverter as duas linhas para os valores comentados.

---

#### Problema 4 — Bloco Climate: botoes sem icone SVG + 4o botao com erro

**Arquivo:** `config/dashboards/templates/streamline_templates/tpl_grid_climate.yaml`

**Causa-raiz:**
- Posicoes 1 e 2 (`grid_air_purifier`, `grid_thermostat`) usavam entidades europeias
  (`sensor.home_climate`) com templates `airpurifier`/`thermostat` que nao existem no setup.
- Posicoes 3 e 4 usavam `template: base` sem o icone SVG proprio `icon_climate`.
- O 4o botao (`grid_covers_bedroom`) estava apontando para `climate.ac_quarto_miguel`
  (posicao 3 duplicada) em vez de `climate.ac_quarto_casal` (placeholder).

**Solucao aplicada:** Todo o bloco anterior foi comentado. Novos 4 templates criados:

| Posicao | Key streamline | Entidade | Template |
|---------|----------------|----------|---------|
| 1 | `grid_air_purifier` | `climate.sl_ar_condicionado` | `tpl_popup_climate + icon_climate` |
| 2 | `grid_thermostat` | `climate.ac_office` | `tpl_popup_climate + icon_climate` |
| 3 | `grid_covers_living` | `climate.ac_quarto_miguel` | `tpl_popup_climate + icon_climate` |
| 4 | `grid_covers_bedroom` | *(sem entity — placeholder)* | `base + icon_climate` |

- Botoes ativos: `perform-action: climate.toggle` com `haptic: success`
- Placeholder AC Q.Casal: `opacity: 0.45`, `cursor: default`, sem acao
- `climate-status.yaml` NAO foi alterado (ja referenciava os 4 streamline templates corretamente)

**Rollback:** descomentar o bloco `# --- CÓDIGO ORIGINAL COMENTADO ---` e remover os novos templates.

---

#### Problema 5 — Bloco Media: erros no Slide 1, Slide 2 cortado, Echo com erro

**Arquivo:** `config/dashboards/views/main-grid/grid_media.yaml`

##### 5A. Slide 1 — template conditional_media causava erro de button-card

**Causa-raiz:** O template `conditional_media` continha:
1. JavaScript de DOM navigation (`this.getRootNode().host`) para interceptar eventos do swipe-card
2. Acesso a `entity.attributes.data` sem verificacao de null
3. `aspect_ratio: 1000/996` que forcava o Slide 1 a ser quadrado

Quando `media_player.currently_playing` estava `off`/`unavailable`, o JS lancava
excecao, causando o erro vermelho de button-card.

**Solucao:** Substituido `conditional_media` por `media` (template mais simples que
exibe artwork via `background-image` sem navegacao DOM). Aplicado nos 2 breakpoints.

##### 5B. Slide 2 — botoes inferiores cortados

**Causa-raiz:** O swipe-card redimensionava todos os slides pela altura do Slide 1
(que tinha `aspect_ratio: 1000/996`, virtualmente quadrado). O grid 2x2 do Slide 2
precisava de mais altura para os 4 botoes, mas era cortado pelo container.

**Solucao:** Adicionado `square: false` no `type: grid` do Slide 2 (ambos os breakpoints).
Isso evita que os botoes forcem aspect-ratio quadrado, permitindo auto-dimensionamento.

##### 5C. Echo Show — erro com icon_homepod

**Causa-raiz:** Template `icon_homepod` acessa `variables.vibrant_data.LightVibrant`
(sensor de cores vibrantes que nao existe no setup). Combinado com `media_premium`
que define `custom_fields.circle`, causava conflito e erro de button-card.

**Solucao:** Substituido `icon_homepod` por `icon_tv` no card do Echo Show.
O `icon_tv` e genericamente funcional e nao tem dependencias externas. Aplicado
nos 2 breakpoints. Codigo anterior comentado inline.

---

### Resumo de arquivos alterados

| Arquivo | Tipo de alteracao |
|---------|------------------|
| `tpl_sidebar.yaml` | padding-left adicionado ao wrapper de presenca |
| `footer_copy.yaml` | Refresh → location.reload() |
| `streamline-card.yaml` | Refresh → location.reload() |
| `footer_vacuum.yaml` | camera entity + vacuum_platform corrigidos |
| `tpl_grid_climate.yaml` | 4 ACs reescritos com tpl_popup_climate + icon_climate |
| `grid_media.yaml` | Slide 1: media template; Slide 2: square:false; Echo: icon_tv |

### Para rollback completo

Todos os blocos originais estao comentados inline nos respectivos arquivos com marcadores:
- `# ANTERIOR:` ou `# --- CÓDIGO ORIGINAL COMENTADO ---`
- Para reverter: descomentar o bloco ANTERIOR e comentar/remover o bloco NOVO.

