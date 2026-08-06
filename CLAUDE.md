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

## Registro de Implementacao — Opcao A no Bento Sala (2026-04-22)

Escopo autorizado pelo usuario: implementar a **Opcao A** (levar a logica de acendimento
dos comodos para o botao hero da Sala, sem mudar a arquitetura geral do card).

### Arquivo alterado

- `config/dashboards/shared/grid-cards/bento_sala.yaml`

### O que foi implementado

1. **Variavel de estado visual no hero (`state_on`)**
   - Adicionada variavel para definir estado ligado/desligado a partir de
     `light.grupo_luzes_sala`.

2. **Acendimento visual do hero**
   - `styles.card.background` deixou de ser fixo transparente e passou a alternar:
     - ligado: `rgba(250, 250, 250, 0.75)` (paridade visual com `rooms_base`);
     - desligado: `transparent` (mantem linguagem de vidro do container).

3. **Contraste dinamico de texto**
   - Nome e bloco de temperatura/umidade agora mudam contraste conforme `state_on`
     (preto quando ligado, branco quando desligado), alinhando com os comodos.

4. **State/lights com logica robusta (paridade com `rooms_base`)**
   - Mantida compatibilidade com `sensor.living_room_active`.
   - Ordem de prioridade para contagem:
     1) `lights_on_count` (atributo),
     2) `lights_on` (array/string),
     3) membros do grupo (`entity.attributes.entity_id`),
     4) fallback fixo `light.sala_switch_1`/`light.sala_switch_2`.
   - Tempo ligado agora usa o **membro ligado mais antigo** do grupo (e fallback para
     `entity.last_changed`), evitando inconsistencias conhecidas de group last_changed.

### Regra de rollback rapido

- **Nenhum codigo antigo foi apagado**.
- Trechos anteriores foram mantidos comentados no proprio `bento_sala.yaml` com marcacao
  `ORIGINAL — mantido para rollback rapido`.
- Para restaurar comportamento anterior:
  1) descomentar bloco antigo do `custom_fields.lights`;
  2) voltar `styles.card.background: transparent`;
  3) voltar `name.color: white`;
  4) comentar os blocos novos da Opcao A.

### Ajuste fino pos-feedback visual (2026-04-23)

Feedback do usuario: "**muito longe do planejado**" (hero da Sala ficou claro/branco demais).

Ajustes aplicados mantendo a logica da Opcao A:

1. **Acendimento visual suavizado**
   - Fundo ligado alterado de branco forte `rgba(250,250,250,0.75)` para gradiente leve:
     `linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.06) 100%)`.
   - Objetivo: preservar linguagem glass e evitar "bloco branco chapado".

2. **Contraste de texto restaurado ao padrao visual anterior**
   - Nome voltou para `white` fixo.
   - Temperatura/umidade voltaram para tons brancos fixos (`0.9`/`0.52`).

3. **Codigo da versao anterior preservado em comentarios**
   - Regras de nao exclusao e rollback rapido mantidas.

### Correcao estrutural pos-feedback (2026-04-23 — bloco completo)

Novo feedback do usuario: o erro nao era de cor, e sim de escopo de acendimento.
O hero estava acendendo sozinho; o esperado era acender o **cartao completo da Sala**
(wrapper que contem hero + TV + A/C + demais elementos).

Correcao aplicada:

1. `config/dashboards/views/main-grid/bento_sala.yaml`
   - Acendimento movido para o `ha-card` do `stack-in-card` (container total).
   - Estilo do wrapper agora alterna por estado de `light.grupo_luzes_sala`:
     - OFF: vidro fosco original;
     - ON: fundo branco translúcido no bloco inteiro.
   - Codigo original de vidro mantido comentado para rollback.

2. `config/dashboards/shared/grid-cards/bento_sala.yaml`
   - Hero voltou a ficar com `background: transparent` em ambos os estados.
   - Evita acendimento parcial/isolado do topo.

### Ajuste de padronizacao visual/contraste (2026-04-24)

Novo feedback do usuario: quando a Sala acende, a cor estava translúcida/fosca demais
e o contraste dos elementos internos ficava lavado (diferente do Office).

Ajustes aplicados:

1. `config/dashboards/views/main-grid/bento_sala.yaml`
   - Estado ON do wrapper alterado para branco real (`rgb(250,250,250)`), sem transparência.
   - Borda/sombra ajustadas para leitura e padrao de "botao aceso" mais proximo dos demais.

2. `config/dashboards/shared/grid-cards/bento_sala.yaml`
   - Contraste dinâmico no estado ON da Sala para elementos internos:
     - hero (nome + temperatura/umidade),
     - dots laterais,
     - cards TV e A/C (fundo, borda, icon, name, state, label, controles),
     - bloco Corredor (titulo/subtitulo/icone inativo).
   - Objetivo: manter bloco inteiro aceso e preservar legibilidade/padronizacao.

### Ajuste de aderencia ao padrao dos comodos (2026-04-24 — revisao 2)

Feedback do usuario: branco da Sala ainda estava mais forte que os demais comodos e
o formato/cor do status de iluminacao nao seguia o padrao.

Acoes:

1. Wrapper da Sala (`views/main-grid/bento_sala.yaml`)
   - Estado ON ajustado de `rgb(250,250,250)` para `rgba(250,250,250,0.75)`,
     reproduzindo o branco usado pelos cards base de comodos.

2. Status de iluminacao (`shared/grid-cards/bento_sala.yaml`)
   - Formato padronizado para `1 light` / `N lights` + tempo (`· Xm/Xh/Xd`),
     alinhado com demais comodos.
   - Cor do texto do status no estado ON ajustada para contraste escuro.

3. Contraste dos toggles
   - Toggles de TV, A/C e Corredor agora escurecem trilho/contorno no estado OFF
     quando a Sala esta acesa, evitando perda de contraste sobre fundo claro.

### Ajuste solicitado pelo usuario (2026-04-24 — revisao 3)

Demandas:
1) status de iluminacao da Sala com mesma assinatura visual do Office;
2) icone de lampada do Corredor igual ao status de luz;
3) aumentar contraste dos toggles.

Aplicacao:
- `shared/grid-cards/bento_sala.yaml`
  - status de luz da Sala com tipografia/cor alinhada ao Office (`11px/500`,
    contraste `rgba(0,0,0,0.6)` no estado ON);
  - icone do Corredor alterado para `mdi:lightbulb-on` (igual assinatura do status);
  - trilhos OFF dos toggles (TV/A-C/Corredor) escurecidos e borda do knob reforcada.

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



---

## Registro de Implementacao — Refatoracao Completa do Popup Vacuum (2026-04-01)

### Contexto

O popup do vacuum (`footer_vacuum.yaml`) persistia com erro de configuracao mesmo
apos multiplas tentativas de correcao incremental. As causas-raiz eram estruturais:

1. O mapa era renderizado dentro de um card `entities` via `custom:hui-element`,
   o que limitava sua renderizacao e causava conflitos com o CSS do `style_popup_footer.yaml`.
2. Os botoes de controle tentavam usar `custom:hui-element` com `card_type: horizontal-stack`
   como entities row — o HA nao suporta isso de forma confiavel.
3. O layout usava `!include` snippets (`popup_footer_layout.yaml`, `style_popup_footer.yaml`)
   que injetavam CSS via shadow DOM piercing — funcionava no setup europeu do ngocjohn
   mas nao no setup do usuario.

### Solucao

Reescrito do ZERO baseado no codigo funcional do dashboard antigo do usuario.

**Estrutura nova:**
- `custom:mod-card` → `custom:layout-card` com grid explicito de 3 colunas (320px | 1fr | 280px)
- Coluna 1 (Summary): `vertical-stack` com card `entities` (status, pecas, mop) + `horizontal-stack` (botoes play/pause e return-to-base)
- Coluna 2 (Mapa): `custom:xiaomi-vacuum-map-card` como card de PRIMEIRO NIVEL (nao dentro de entities)
- Coluna 3 (Settings): `vertical-stack` com card `entities` (config, divider, estatisticas)

**Mudancas-chave vs versao anterior:**
- Mapa e um card direto (nao `custom:hui-element` dentro de `entities`)
- Botoes de controle sao `horizontal-stack` separado (nao entities row)
- Popup usa `popup_styles` com `style: all` para scrim/blur (nao `card_mod` com `!include`)
- `bar-card` com barras de desgaste (bateria, filtro, escova principal/lateral, sensores)
- Layout responsivo: 1 coluna em mobile (<800px)
- Divisorias verticais entre colunas via CSS no `layout-card`

**Entidades usadas (todas confirmadas pelo usuario):**
- `vacuum.roborock_s7` (vacuum principal)
- `sensor.roborock_s7_status`, `sensor.roborock_s7_comodo_atual`, `sensor.roborock_s7_vacuum_error`
- `sensor.roborock_s7_bateria`
- `binary_sensor.roborock_s7_mop_attached`, `binary_sensor.roborock_s7_water_box_attached`, `binary_sensor.roborock_s7_water_shortage`
- `sensor.roborock_s7_tempo_restante_do_filtro`, `sensor.roborock_s7_tempo_restante_da_escova_principal`, `sensor.roborock_s7_tempo_restante_da_escova_lateral`, `sensor.roborock_s7_tempo_restante_do_sensor`
- `select.roborock_s7_intensidade_do_mop`, `select.roborock_s7_modo_mop`
- `number.roborock_s7_volume`
- `switch.roborock_s7_nao_perturbe`, `switch.roborock_s7_dock_luz_indicadora_de_status`, `switch.roborock_s7_dock_bloqueio_infantil`
- `time.roborock_s7_comecar_nao_perturbe`, `time.roborock_s7_terminar_nao_perturbe`
- `sensor.roborock_s7_area_de_limpeza`, `sensor.roborock_s7_tempo_de_limpeza`
- `sensor.roborock_s7_area_total_de_limpeza`, `sensor.roborock_s7_tempo_total_de_limpeza`, `sensor.roborock_s7_contagem_total_de_limpeza`
- `image.roborock_s7_map_0` (mapa ao vivo)

### Rollback

O codigo original (versao ngocjohn com !include snippets) esta integralmente
comentado no inicio do arquivo, delimitado por:
- `# --- CÓDIGO ORIGINAL COMENTADO (versao ngocjohn com !include snippets) ---`
- `# --- FIM CÓDIGO ORIGINAL ---`

Para restaurar: descomentar o bloco original e comentar/remover o bloco `# NOVO:`.


---

## Registro de Implementacao — Climate, Media e Vacuum (2026-04-03)

### Problemas corrigidos

#### 1. Bloco Climate — Botoes temperatura/umidade sem grafico visivel

**Causa-raiz:**
- Template `airpurifier` em `tpl_climate.yaml` tinha `grid-template-areas: |` com valor vazio (pipe sem conteudo apos). Isso invalidava o grid de custom_fields, fazendo `humid` flutuar sem area definida.
- Ambos `airpurifier` e `thermostat` posicionavam `graph` com `position: absolute; bottom: -40%` — 40% abaixo do card — mas com `overflow: hidden` no card, o grafico ficava completamente invisivel.
- Background usava `linear-gradient(to top, rgba(53,59,83,0.8)...)` opaco em vez do transparente/frosted padrao.
- Sessao anterior reconstruiu os botoes do zero (2026-04-02) em `climate-status.yaml` sem mini-graph, tentando resolver os problemas de sobreposicao, mas perdeu a funcionalidade de grafico/min/max/media.

**Solucao implementada:**
- `tpl_climate.yaml` (template `airpurifier`):
  - Corrigido `grid-template-areas` para `"humid" "n" "graph"` (tres rows validas)
  - `grid-template-rows` alterado de `fit-content(100%) min-content 1fr` para `min-content min-content 1fr`
  - Removido `position: absolute; bottom: -40%; left: -15%; width: 130%` do graph — substituido por `width: 100%; place-self: stretch`
  - Background alterado para `rgba(115, 115, 115, 0.2)` (frosted, sem gradiente)
- `tpl_climate.yaml` (template `thermostat`):
  - Mesmos ajustes no graph (remocao de posicao absoluta)
  - Background alterado para `rgba(115, 115, 115, 0.2)`
- `climate-status.yaml`:
  - Botoes "simples" (sem grafico) comentados
  - Restaurados templates `airpurifier` (umidade) e `thermostat` (temperatura) com mini-graph-card funcional mostrando extrema (min/max) e average (media)

**Rollback:**
- `tpl_climate.yaml`: Descomentar blocos `# --- CÓDIGO ORIGINAL COMENTADO ---` para restaurar posicao absoluta e gradient.
- `climate-status.yaml`: Descomentar bloco `# --- CÓDIGO COMENTADO ---` para restaurar botoes simples. Comentar as duas linhas de restauracao dos templates.

---

#### 2. Bloco Media — Slide 2 vazio + Slide 1 sem artwork

**Causa-raiz:**
- Um `custom:button-card` com `color_type: blank-card` foi inserido entre o Slide 1 (artwork) e o `type: grid` (grade 2x2). Esse card fantasma virava um slide vazio no swipe-card, deslocando a grade 2x2 para Slide 3.
- Slide 1 usava hack CSS `height: 0; padding-bottom: 100%; position: relative` para criar aspect-ratio quadrado. No contexto de swipe-card com `autoHeight: false`, esse hack pode resultar em container de altura 0, impedindo que o `background-image` (artwork) seja renderizado corretamente pelo navegador.

**Solucao implementada:**
- `grid_media.yaml` (desktop e tablet):
  - Removido blank-card fantasma (comentado com `# --- CÓDIGO ORIGINAL COMENTADO ---`)
  - Substituido hack CSS `height: 0; padding-bottom: 100%; position: relative` por `aspect_ratio: 1/1` (parametro nativo do button-card, mais confiavel para sizing dentro de swipe-card)
  - Grade 2x2 volta a ser Slide 2 diretamente apos o Slide 1

**Rollback:**
- Descomentar os blocos `# --- CÓDIGO ORIGINAL COMENTADO ---` em `grid_media.yaml` para restaurar blank-card e remover `aspect_ratio: 1/1` do Slide 1.

---

#### 3. Botao Vacuum no Rodape — Nao abre popup do vacuum

**Causa-raiz:**
- Em `footer-shared.yaml`, o botao vacuum tinha o `tap_action: !include ./popup/footer/footer_vacuum.yaml` comentado (linha 32, marcado `# ANTERIOR:`).
- Em seu lugar, foi inserida inline uma definicao massiva de `tap_action` com um popup de cameras (grade 2x2 de 8 cameras com zoom individual). Esse codigo foi colocado no slot do vacuum por engano durante a implementacao da funcionalidade de cameras.
- Resultado: ao clicar no botao vacuum, abria uma grade de cameras em vez do popup do aspirador.
- Adicionalmente, `footer_vacuum.yaml` referenciava `image.roborock_s7_map_0_custom` (entidade inexistente — sufixo `_custom` incorreto). A entidade correta e `image.roborock_s7_map_0`.

**Solucao implementada:**
- `footer-shared.yaml`: Cameras popup inline comentado (bloco com marcador `# CÂMERAS POPUP (colocado aqui por engano)`). Restaurado `tap_action: !include ./popup/footer/footer_vacuum.yaml`.
- `footer_vacuum.yaml`: `entity: image.roborock_s7_map_0_custom` → `entity: image.roborock_s7_map_0` (linha da coluna mapa).

**Rollback:**
- `footer-shared.yaml`: Descomentar o bloco `# CÂMERAS POPUP`. Comentar `tap_action: !include ./popup/footer/footer_vacuum.yaml`.
- `footer_vacuum.yaml`: Reverter para `entity: image.roborock_s7_map_0_custom` (linha comentada disponivel no arquivo).

---

## Registro de Implementacao — Bento Sala TV/A-C/Corredor (2026-04-25)

### Objetivo
Implementar o mockup final do bloco Sala no dashboard principal com foco em controle rapido real:
- TV ocupando faixa inteira da linha 2
- A/C ocupando ~70% na linha 3
- Botao Corredor como quick action na direita da linha 3
- Hero mantido funcionalmente intacto (status, icones, acoes)

### Arquivos alterados
1. `config/dashboards/shared/grid-cards/bento_sala.yaml`
2. `config/packages/sala_tv_controls.yaml` (novo)
3. `config/configuration.yaml`

### Decisoes de arquitetura

#### 1) Hero preservado
- Bloco Hero foi mantido (nao migramos corredor para o hero).
- Mantida logica de toque/luzes/status e coluna de dots da direita.

#### 2) TV deixou de ser "um botao unico"
- Antes: `button-card` unico com `tap_action: toggle` no card inteiro.
- Agora: container `stack-in-card` com elementos interativos independentes:
  - Header (icone, titulo, subtitulo)
  - Botao Power independente (canto superior direito)
  - Faixa inferior dinamica (Apps OU Mini-controles)

#### 3) Toggle Apps <-> Mini-controles
- Criado helper `input_boolean.sala_tv_controls_expanded`.
- Quando `off`: exibimos botoes de streaming + botao `+`.
- Quando `on`: exibimos mini-controles (play/pause, stop, vol-, vol+) + botao de retorno para Apps.

#### 4) Streaming com acao real
- Criados scripts:
  - `script.sala_tv_open_netflix`
  - `script.sala_tv_open_disney`
  - `script.sala_tv_open_prime`
  - `script.sala_tv_open_hbo`
- Fluxo: liga TV se estiver off, aguarda 2s e chama `media_player.select_source`.
- HBO tenta `Max` primeiro; fallback para `HBO Max`.

#### 5) Reaproveitamento de assets
- Netflix/HBO usam imagens existentes em `/local/images/`:
  - `netflix_bg.jpg`
  - `HBOMax_bg.jpg`
- Disney/Prime seguem placeholders visuais (D/P) conforme alinhado.

### Ajustes de layout no card Sala
- Grid principal da Sala ajustado para:
  - Linha 1: `hero hero`
  - Linha 2: `tv tv`
  - Linha 3: `ac corredor`
- Colunas ajustadas para favorecer A/C + quick action de corredor na ultima linha.

### Rollback rapido

#### Rollback completo do bloco Sala (visual + interacao)
1. Restaurar `config/dashboards/shared/grid-cards/bento_sala.yaml` para revisao anterior.
2. Remover include da package em `config/configuration.yaml`:
   - `sala_tv_controls: !include packages/sala_tv_controls.yaml`
3. Remover arquivo `config/packages/sala_tv_controls.yaml`.

#### Rollback parcial (manter layout novo sem scripts/apps)
- Em `bento_sala.yaml`, no bloco TV:
  - comentar botoes de app que chamam scripts,
  - manter apenas Power + mini-controles locais.

### Observacoes operacionais
- `media_player.select_source` depende do nome exato em `source_list` da TV.
- Se algum app nao abrir por nome divergente, ajustar somente o `source` no script correspondente (fallback simples e seguro).

---

## Registro de Ajuste Pontual — Sala (2026-04-25, revisão 3)

Solicitação do usuário após rollback manual para versão funcional:
- diminuir apenas a altura da faixa 2 (TV),
- aumentar proporcionalmente a faixa 3 (A/C + Corredor),
- reforçar espaçamento (gap) vertical entre TV e linha inferior e gap horizontal entre A/C e Corredor.

### Ajustes aplicados (mínimos)
- `grid-template-rows`: `142px minmax(96px, 1fr) 94px`
- `column-gap`: `16px`
- `row-gap`: `14px`
- Card A/C recebeu leve margem para abrir respiro no encontro com Corredor.
- Card Corredor recebeu leve margem e `min-height` ajustado para acompanhar a faixa 3 mais alta.

### Escopo preservado
- Hero mantido intacto (sem mudança funcional/visual de lógica).
- TV mantida na arquitetura funcional já aprovada (power + apps/controles).

---

## Registro de Correção Estrutural — Sala (2026-04-25, revisão 4)

Objetivo: corrigir empurrão da TV sobre A/C+Corredor sem alterar a linha 1 (Hero).

### Causa-raiz confirmada
- Linha 2 definida com `1fr` (consumia sobra vertical).
- Card TV com `height: 100%` (expandia para toda a linha 2).
- Resultado: espaço vazio na TV e compressão visual da linha 3.

### Correção aplicada (uma passada)
- `grid-template-rows`: `142px minmax(104px, max-content) minmax(98px, 1fr)`
  - Linha 2 passa a seguir conteúdo (não sobra).
  - Linha 3 absorve a sobra restante.
- TV: `height: auto` e padding vertical reduzido.
- TV: título reduzido para melhorar densidade sem alterar comportamento.
- Power da TV reduzido para harmonizar proporção.
- A/C: título reduzido para aliviar altura útil da linha 3.

### Escopo preservado
- Hero (linha 1) mantido sem alterações funcionais.
- Lógica de apps/mini-controles da TV mantida.

---

## Registro de Ajuste Estrutural — Sala (2026-04-25, revisão 5)

Solicitação específica do usuário:
1. Título `A/C` ao lado do ícone, sem subtítulo.
2. Substituir toggle por botão de power igual ao da TV, na direita.
3. Botões `+/-` abaixo do power.
4. Aumentar gap entre A/C e Corredor.
5. Aplicar imagens nos botões Disney e Prime.
6. Evitar sangramento na borda inferior da linha 3 com margem inferior equivalente ao respiro do bloco.

### Implementação aplicada
- A/C refatorado para `stack-in-card` com layout 2x2:
  - `info` (ícone + título) à esquerda,
  - `power` no topo da coluna direita,
  - `+/-` abaixo do power.
- Power do A/C usa a mesma linguagem visual do power da TV (dimensão, borda e estado).
- Botões `+/-` do A/C agora acionam `climate.set_temperature` com incremento/decremento de 1°C (limites 16–30).
- Gap horizontal global entre A/C e Corredor aumentado (`column-gap: 20px`).
- Disney: background com `/local/images/dp_bg.jpg`.
- Prime: background com `/local/images/prime_bg.jpg` + fallback em gradiente.
- Corredor e A/C com `height: auto` e margem inferior para respiro (`12px`) evitando expansão na borda inferior.

### Escopo preservado
- Altura do card TV mantida.
- Hero mantido sem alterações funcionais.

---

## Registro de Ajuste Estrutural — Sala (2026-04-25, revisão 6)

Solicitação do usuário:
1) mover `+/-` do A/C para a esquerda (abaixo de ícone/título);
2) exibir temperatura selecionada ao lado de `+/-`;
3) aumentar discretamente altura dos botões de streaming (sem mexer na altura do card TV);
4) garantir corredor com mesma altura visual do A/C e com ícone.

### Implementação aplicada
- Linha de apps da TV: botões Netflix/Disney/HBO/Prime de `32px` para `34px`.
- A/C:
  - layout alterado para `"info power" / "controls power"`;
  - `controls` movido para a esquerda, abaixo do título;
  - controles agora em ordem `- [temperatura] +`;
  - temperatura selecionada exibida em badge central (`xx°`).
- Corredor:
  - ícone alterado para `mdi:door-closed`;
  - altura mínima ajustada para alinhar melhor com o A/C;
  - centralização explícita de conteúdo no card.

### Escopo preservado
- Altura do card TV não alterada.
- Hero sem mudança funcional.

---

## Registro de Ajuste Estrutural — Sala (2026-04-25, revisão 7)

Correção solicitada após revisão 6:
- Ao elevar discretamente os botões de streaming para `34px`, era necessário elevar proporcionalmente a altura útil do card da TV.

### Ajuste aplicado
- Grid da Sala: linha 2 (TV) de `minmax(104px, max-content)` para `minmax(110px, max-content)`.
- Card TV: adicionado `min-height: 112px` para garantir folga vertical estável com os botões de streaming mais altos.

### Escopo preservado
- Hero sem alterações.
- Estrutura A/C e Corredor mantida.

---

## Plano de Implementação — Refatoração Sala (2026-04-26, revisão 8)

Solicitação do usuário:
1) remover o card separado de Corredor da linha 3;
2) transformar a linha 3 em um único card de A/C full-width;
3) mover o controle do Corredor para uma pílula no Hero;
4) aumentar a estabilidade de layout para ajustes de altura da TV;
5) manter fallback rápido sem apagar código antigo.

### Estratégia aplicada
- Grid principal da Sala alterado para:
  - linha 1: `hero hero`
  - linha 2: `tv tv`
  - linha 3: `ac ac`
- Linha 3 fixada em `96px` para reduzir variabilidade vertical.
- Linha 2 (TV) ampliada para `minmax(134px, max-content)` para maior respiro dos controles.
- Hero refatorado para 4 colunas internas (`icon/temp`, conteúdo textual, pílula corredor, status).
- Pílula de Corredor implementada no próprio Hero via `custom_fields.corredor` (toggle + more-info).
- Card separado de Corredor desativado e preservado integralmente comentado com instruções explícitas de reativação.

### Fallback rápido documentado no código
- Bloco legado do Corredor foi mantido comentado em `bento_sala.yaml` com cabeçalho:
  - "LEGADO DESATIVADO (fallback rápido)".
- Instruções de rollback no próprio arquivo:
  1) restaurar grid para `"ac corredor"`;
  2) descomentar o bloco legado.

### Riscos conhecidos
- Aumento de densidade no Hero (mais elementos interativos na faixa superior).
- Dependência de contraste da pílula de Corredor em tema claro/escuro.
- Necessidade de validação visual em dispositivos menores (mobile portrait).

---

## Registro de Ajuste de Layout — Sala (2026-04-26, revisão 9)

Ajuste solicitado pelo usuário para aderência à referência visual (imagem 2):
- A/C em **linha única horizontal** (sem quebra em duas linhas).
- Redução da altura da linha 3 e do card A/C para evitar aproximação da borda inferior.

### Implementação aplicada
- Linha 3 ajustada para `84px`.
- Bloco A/C refatorado para `single-row` com áreas:
  - `info | toggle | minus | temp | plus`
- Substituição do power circular isolado por controle visual tipo toggle inline.
- Bloco anterior (A/C em duas linhas) removido da execução e sinalizado no código como legado/fallback para rollback rápido.

### Fallback rápido
- Em caso de regressão visual/funcional:
  1) reativar bloco legado de A/C em duas linhas;
  2) restaurar altura da linha 3 para valor anterior;
  3) manter card de corredor legado comentado conforme revisão 8.

---

## Registro de Implementacao — Mobile V3 (2026-05-10)

### Contexto

A view principal Bento (desktop/tablet) esta validada e foi mantida 100% intacta.
As tentativas mobile anteriores (V1 e V2) tinham falhas estruturais documentadas
no diagnostico tecnico desta sessao:

- Pill navbar V2 nunca foi conectada em nenhuma view (arquivo isolado).
- `navigation_path` apontava para slug especulativo (`/lovelace-yaml/...`).
- Wrappers V2 reusavam diretamente `views/main-grid/bento_X.yaml` (com
  `view_layout: grid-area: X` no topo, calibrado para celulas ~245px) dentro
  de containers mobile com altura 160-170px → conteudo clipado.
- Top badges V2 nao rolava horizontalmente (track `1fr` no layout-card matava o
  overflow).
- Sala "2x1 horizontal" pedida pelo usuario nao havia sido implementada.

### Slug confirmado pelo usuario

- Dashboard slug: `lovelace`
- URLs das abas: `/lovelace/mobile-casa`, `/lovelace/mobile-comodos`,
  `/lovelace/mobile-midia`, `/lovelace/mobile-cameras`, `/lovelace/mobile-mais`.

### Restricoes operacionais aplicadas

- NAO mexer em estrutura tablet/desktop (`views/main.yaml`, `views/main-grid/`,
  `shared/grid-cards/bento_*.yaml`).
- NAO mexer em templates globais (`templates/`).
- Codigo legado mobile (V1 e V2) preservado e apenas comentado.
- Toda nova arvore mobile e aditiva, isolada em diretorios proprios.

### Estrutura final implementada

```
config/dashboards/
├── views/mobile/                       (NOVO — 5 views)
│   ├── mobile-casa.yaml                badges → hero → sala → rail → quick → navbar
│   ├── mobile-comodos.yaml             grade 2-col com 7 comodos + navbar
│   ├── mobile-midia.yaml               wrapper bento_media + navbar
│   ├── mobile-cameras.yaml             wrapper bento_cameras + navbar
│   └── mobile-mais.yaml                Energia + Roborock + Calendar + navbar
│
├── shared/mobile/                      (NOVO — 16 componentes)
│   ├── mobile_pill_nav.yaml            navbar 5 abas, slug /lovelace/ hardcoded
│   ├── mobile_top_badges.yaml          scroll horizontal real (forca min-width: max-content via card_mod)
│   ├── mobile_hero_welcome.yaml        glass+imagem+conteudo bento_welcome
│   ├── mobile_sala_card.yaml           wrapper full-width do bento_sala (preserva room+actions)
│   ├── mobile_rooms_rail.yaml          rail horizontal scroll-snap dos 6 demais comodos
│   ├── mobile_comodos_grid.yaml        grade 2-col com 7 comodos para aba Comodos
│   ├── mobile_quick_actions.yaml       wrapper bento_quick_actions com glass mobile
│   ├── mobile_card_sala_compact.yaml   Sala 1x1 para grade Comodos (height max 158px)
│   ├── mobile_card_office.yaml         wrapper bento_office
│   ├── mobile_card_cozinha.yaml        wrapper bento_cozinha
│   ├── mobile_card_lavabo.yaml         wrapper bento_lavabo
│   ├── mobile_card_quarto_casal.yaml   wrapper bento_quarto_casal
│   ├── mobile_card_quarto_marina.yaml  wrapper bento_quarto_marina
│   ├── mobile_card_quarto_miguel.yaml  wrapper bento_quarto_miguel
│   ├── mobile_media_card.yaml          wrapper bento_media
│   ├── mobile_cameras_card.yaml        wrapper bento_cameras
│   ├── mobile_energy_card.yaml         wrapper bento_energy
│   ├── mobile_roborock_card.yaml       wrapper bento_roborock
│   ├── mobile_calendar_card.yaml       wrapper bento_calendar
│   └── mobile_card_room_compact.yaml   referencia/documentacao do padrao
│
└── ui-lovelace-main.yaml               (alterado: bloco V3 adicionado, V1/V2 comentados)
```

### Principios aplicados

- **P1 — Isolamento total**: arvore `views/mobile/` + `shared/mobile/` separadas.
  Zero acoplamento ao `views/main-grid/`.
- **P2 — Reuso somente do conteudo interno** (`shared/grid-cards/bento_*.yaml`),
  que nao tem `view_layout` e nao assume geometria do main grid.
- **P3 — Wrappers mobile aplicam glassmorphism + altura controlada** apenas no nivel
  externo. Conteudo interno permanece inalterado.
- **P4 — Sem `view_layout: grid-area:`** em fluxo mobile. Apenas `vertical-stack`
  ou `custom:grid-layout` com colunas explicitas.
- **P5 — `card_mod` em no maximo 2 camadas** (frame externo + conteudo).
- **P6 — Pill navbar** parametrizada com slug confirmado, incluida em TODAS as 5 views.

### Decisoes tecnicas relevantes

**1. Top badges com scroll horizontal real**
O `bento_top_badges.yaml` interno usa `grid-template-columns: ... minmax(0, 1fr) ...`
que faz o conteudo se contrair em vez de transbordar. Solucao: `mobile_top_badges.yaml`
aplica via `card_mod` profundo (`hui-card$`) regras `min-width: max-content` no
`hui-grid-layout` interno, forcando overflow real. Container externo tem `overflow-x: auto`.

**2. Sala "2x1 horizontal" — interpretacao pragmatica**
O `bento_sala.yaml` shared tem 2618 linhas, com `grid-template-rows: 1fr auto`
(hero em cima + strip de actions embaixo). Espelhar para layout 2-col horizontal
exigiria duplicar todo o conteudo (room hero ~290 linhas + actions strip ~2300 linhas),
multiplicando a manutencao. Solucao adotada:
- `mobile_sala_card.yaml`: include direto do `bento_sala.yaml` shared inteiro;
- altura 270px+ (vs ~158px dos demais comodos);
- ocupa LARGURA TOTAL da view mobile (vs cards 1×1 do rail);
- distinguindo-se visualmente como "card de destaque".

Caso o usuario queira VERDADEIRO 2×1 horizontal (hero esquerda + actions direita),
e necessario refatorar `shared/grid-cards/bento_sala.yaml` extraindo room+actions em
includes separados — operacao maior, requer aprovacao especifica.

**3. Rail horizontal**
Cada cartao do rail e um `mod-card` (snap target) contendo um wrapper mobile
(`mobile_card_<comodo>.yaml`) que aplica glass. Largura `calc(50vw - 22px)` para
mostrar 2 cards completos + peek do terceiro. Scroll touch via `-webkit-overflow-scrolling`.

**4. Aba Comodos — reuso 100%**
A grade 2-col reusa exatamente os mesmos 6 wrappers do rail + `mobile_card_sala_compact.yaml`
(versao da Sala com altura forcada de 158px para uniformizar a grade).

**5. Pill navbar**
- `position: fixed` com `z-index: 2147483647` para escapar de stacking contexts
  criados por `transform` em ancestrais.
- Background dinamico por aba via JS template `location.pathname.split('/').slice(-1)[0]`.
- Botao "Mais" agora navega para a aba `/lovelace/mobile-mais` (V2 abria popup).

### Validacao executada

- 26/26 arquivos YAML validam sintaticamente (parser Python yaml).
- `git status`: somente `ui-lovelace-main.yaml` modificado; demais alteracoes sao
  pastas novas. Nenhum arquivo de `views/main.yaml`, `views/main-grid/`,
  `shared/grid-cards/`, `templates/` foi tocado.

### Rollback

**Rollback completo (1 minuto):**
1. Em `ui-lovelace-main.yaml`, comentar as 5 linhas do bloco `# ── MOBILE V3 ──`.
2. (Opcional) descomentar bloco V2 ou V1.
3. Os arquivos novos em `views/mobile/` e `shared/mobile/` permanecem no disco
   sem afetar o dashboard ate serem incluidos novamente.

**Rollback granular:**
- Para desativar uma aba especifica, comentar apenas o `!include` daquela view
  em `ui-lovelace-main.yaml`.
- Para substituir um wrapper mobile, editar somente o arquivo em `shared/mobile/`
  correspondente — wrappers sao independentes entre si.

### Pendencias / Pontos de atencao

| # | Item | Notas |
|---|------|-------|
| M1 | Validar visualmente no Galaxy Tab S6 Lite | testar todas as 5 abas |
| M2 | Confirmar slug `/lovelace/` em produção | se diferir, ajustar `mobile_pill_nav.yaml` |
| M3 | Sala 2x1 horizontal real | aguardar feedback do usuario apos teste visual da implementacao atual |
| M4 | `position: fixed` da navbar | se algum tema criar stacking context que capture a navbar, mover para `card_mod` global do tema (requer aprovacao) |
| M5 | Top badges scroll | se `min-width: max-content` via `card_mod` profundo nao surtir efeito (depende da versao do `card_mod`/`layout-card`), alternativa e refatorar `bento_top_badges` para extrair lista de badges em arquivo proprio (toca codigo desktop — requer aprovacao) |
| M6 | Wrappers V2 antigos em `shared/grid-cards/mobile_*.yaml` | mantidos no disco, fora do uso. Nao sao referenciados pelo V3 |
| M7 | Limpeza opcional dos arquivos legados | mover `views/mobile-v2-*.yaml`, `views/mobile-home.yaml`, etc. para `views/disabled/` apos V3 estabilizar (requer aprovacao) |

---

## Registro de Implementacao — Paridade Subview Office com Sala + Focus v2 (2026-06-12)

### Diretriz do usuario

A subview do Office (`bruno-office-subview.js`) deve ser **reproducao fiel** da subview
da Sala (`bruno-sala-subview.js`, padrao) em layout, cor, visual, tamanho, dimensao e
posicionamento. Unicas diferencas autorizadas: entidades; bloco de cameras com 1 camera
(espaco restante vira bloco "Foco & Produtividade"); hub de midia sem PS5 (Spotify
identico + PC no lugar da TV). Navegar entre subviews nao pode dar sensacao de "degrau".

Decisoes do usuario nesta sessao:
1. Curtain dock: identico ao da Sala, porem inerte (`entities.curtain: ''`).
2. Focus card: redesign aprovado (mini calendario semanal + status de reuniao + timer).

### Arquivo alterado

- `config/www/bruno-ui/subviews/bruno-office-subview.js` (unico arquivo tocado)

### A) Correcoes de paridade visual (valores da Sala transpostos verbatim)

| Item | ANTERIOR (Office) | NOVO (= Sala) |
|------|-------------------|---------------|
| `.glass-card` (todos os cards) | tokens sem fallback, sem color/transition, sheen `z-index:-1`, `::after` edge-glow | skin completo da Sala: fallbacks, `color: var(--text-main)`, transition, sheen `z-index:0` op. 0.74, `::after` bottom-line, `> *` z-index 1, estados `.is-active` |
| `.hero-bg` | `center/cover`, insets ~0, fades proprios | `left center / auto 100%`, insets -18/-86/-20/-16, fades/masks da Sala; `::before` sem inset estendido nem radial extra |
| Tipografia hero | clock `clamp(56,7.4vh,78)` mt14, headline mt20, content 16/10 | clock `clamp(54,7.1vh,74)` mt8, headline mt12, date-line mb6, content `15px 18px 14px`/gap 8 |
| Curtain dock | 500px, cols 68/118, 4o botao "Automatica" is-primary, pill "Automatica" | 520px, cols 70/112, botao "Parar" (mdi:pause), pill "Posicao - X%", preset-button tokens + 46px |
| Status rail | 6 itens (com "Clima"), sem min-height | 5 itens (Clima comentado), `repeat(5)`, min-height 64 (68 @1180), item padding 12 |
| Sidebar nav | `ha-icon` mdi generico, 56/39px, cor 0.62 | SVGs custom `_roomNavIcon` (transportado), 58/40px, gap 7, cor 0.70, `.room-nav-button svg` |
| Light tiles | radius 22px (radius-compact), 66px col, pad 13/16, strong branco 850 15px, small 11 | radius `--office-cell-radius` = `var(--bruno-liquid-cell-radius,16px)`, 60px col, gap 11, pad 11/12, strong 14.8/1.12 herdado, small 12, icon 60px, card gap 10, module-head 40px |
| Grid de luzes 2x2 | 3 tiles + buraco (filtro descartava placeholders) | 4o tile placeholder "OF Luz Auxiliar" (padrao "LED Fita TV" da Sala); filtro removido |
| Controles | hardcoded: radius 12-14, sem blur; is-main/volume ROXOS | tokens liquid (`control-*`) com blur; is-main/volume/climate/fan AZUL/VERDE padrao Sala |
| AC | ac-card sem grid, ac-body `minmax(0,1fr)` + `calc(100%-46px)` | ac-card grid `auto minmax(0,1fr)` gap 6, ac-head mb0, ac-body `minmax(320px,auto)` height auto; icg letter-spacing -8px/1.8px; stepper mb4; slider mb3; fallback `.ac-image-shell.is-fallback` |
| Shell | `--office-gap: 10px` | `--office-gap: 12px` no `.office-subview` (= Sala) |
| Camera | copy 14px sem right, strong 17px | copy 13px com right, strong 15px/1.08 |
| Spotify meta | fallback literal 'Echo Show' | 'Echo Pop Office' |

### B) Funcionais

1. **`_bindImageFallbacks()` transportado** da Sala + chamada no `_render()`.
2. **Standby do hub (PC/Spotify)** agora usa `media-standby-shell` com
   `data-image-wrapper` + icone fallback (`display: contents`): se
   `/local/images/office_pc.png` ou `echo_pop.png` derem 404, aparece o icone
   em vez de imagem quebrada. NOTA: `office_pc.png` ainda nao existe em
   `config/www/images/` — subir o asset quando disponivel.
3. Regras `.ac-image-shell.is-fallback` adicionadas (faltavam no Office).

### C) Focus card v2 (redesign aprovado)

- **Header**: `module-head` padrao + chip de status (`.focus-status-chip`):
  "Em reuniao" (ambar, `binary_sensor.office_meeting_active`) > "Trabalhando"
  (azul, `binary_sensor.office_working_active`) > "Livre" (verde).
- **Mini calendario**: strip semanal seg-dom, hoje em pill azul (tokens liquid),
  dots coloridos por dia com evento. Fontes: `calendar.brunohelasio_gmail_com`
  (#7fdbe9) + `calendar.familia` (#fdd835), configuravel via `config.calendars`.
- **Proximo evento**: linha "PROXIMO/AGORA" com hora + titulo + calendario.
- **Timer**: linha unica `mm:ss` + pill Iniciar/Pausar (azul padrao) + botao
  reset (acao nova `focus-reset`) + meta "N sessoes · Xm".
- **Infra**: `_loadCalendarEvents`/`_fetchCalendarEvents` (WS
  `calendar/list_events` + fallback REST, mesmo padrao do `bruno-agenda-card`),
  cache 5 min com timer proprio, falha silenciosa ("Agenda livre").
- Os 3 botoes mortos "Trabalhando/Em reuniao/Disponivel" sairam (status virou chip).

### Rollback

- Todos os blocos substituidos estao comentados in-place com marcadores
  `ANTERIOR (rollback)` / `NOVO (paridade Sala)` no proprio
  `bruno-office-subview.js` (JS: `//` ou `/* */`; CSS: `/* */`).
- Focus v1 completo (markup + CSS) preservado em dois blocos
  `ANTERIOR (rollback) — Focus card v1`.
- Alternativa: `git revert` do commit desta sessao.

### Validacao

- `node --check` OK.
- Diff programatico de CSS efetivo (Sala normalizada vs Office): seletores
  compartilhados identicos, exceto equivalencias (`margin: 0 0 6px` ≡
  `margin-bottom: 6px`; `height: auto` default) e o rename intencional dos IDs
  de defs SVG do anel (`icgOffice*`).

### Pendencias

| # | Item | Nota |
|---|------|------|
| O1 | Asset `/local/images/office_pc.png` | nao existe; fallback gracioso cobre ate o upload |
| O2 | Entidades temp/umidade do Office | config ainda lista 5 nomes candidatos por sensor; confirmar os reais no HA |
| O3 | Cortina do Office | dock identico-inerte; mapear `entities.curtain` quando houver entidade |
| O4 | Validacao visual no tablet | comparar Sala ↔ Office lado a lado (sem "degrau") |

---

## Registro de Implementacao — Molde Unico de Presenca/Ocupacao + Alinhamento dos Cards (2026-07-03)

### Contexto

Diagnostico completo dos sensores 4-em-1 (HOBEIAN/Tuya ZG-204ZV via Zigbee2MQTT) realizado
nesta data identificou: (1) logica de ocupacao excluia o estado 'static' do motion_state
(pessoa parada nunca virava "Ocupado") e usava 'medium' (valor inexistente no enum
none/large/small/static); (2) 4 padroes de logica diferentes entre comodos + 3 comodos sem
camada logica; (3) hack `recent_only: 120s` nos cards apagava o dot com o comodo ainda
ocupado (confirmado ao vivo na Cozinha); (4) cards Lavabo/Cozinha (124px) e Miguel/Casal
(112px) com coluna de icone fixa clipando os status a direita (overflow: hidden);
(5) Marina/Cozinha/Miguel cairam da rede Zigbee (LQI fraco) — estados congelados/unknown.

### Regra funcional definida pelo usuario

- **Presenca (dot azul)**: IMEDIATA — liga na deteccao, apaga rapido na saida
  (fading 30s do sensor + 5s anti-flicker do template).
- **Ocupacao (texto "Ocupado/Ocupada")**: exige permanencia (delay_on 45-60s) e/ou
  contexto (TV/AC/PC/Echo); delay_off por tipo de comodo.

### Arquitetura implementada (molde unico por comodo)

```
L1  binary_sensor.<slug>_motion_recent  = espelho do presence bruto (delay_off 5s) -> dot
L2  binary_sensor.<slug>_occupancy      = presenca sustentada (delay_on) + trava de
                                          contexto (self-latch: occupancy on AND contexto
                                          segura em microquedas do radar) -> semantica
L3  sensor.<slug>_semantic_state        = occupied/none + attr display -> texto no card
```

Timers: Sala/Office 60s on / 180s off; Quartos 60s / 300s; Cozinha 45s / 120s;
Lavabo occupancy 120s off (dot usa motion_recent).
Contextos: Sala TV+AC+Echo Show; Office PC+AC+Echo Pop; Marina AC+Echo; Miguel AC;
Casal Echo; Cozinha lava-loucas (sensor.lava_loucas_operation_state == 'run').

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `packages/sala_presence.yaml` | motion_recent 25s->5s; occupancy 2min->60s/180s + contexto + sem gating |
| `packages/office_presence.yaml` | motion_recent sem gating, 5s; occupancy 60s/180s + contexto |
| `packages/q_marina_presence.yaml` | idem (delay_off 300s) |
| `packages/lavabo_presence.yaml` | NOVO lavabo_motion_recent (5s); occupancy 3min->120s |
| `packages/cozinha_presence.yaml` | CRIADO (molde unico + semantica "Ocupada") |
| `packages/q_miguel_presence.yaml` | CRIADO (molde unico + semantica "Ocupado") |
| `packages/q_casal_presence.yaml` | CRIADO (inerte ate instalar o sensor; nomear device "Sensor 4 in 1 q casal") |
| `configuration.yaml` | 3 includes novos + cache-bust dos 5 cards (presence-uniform-1) |
| `bruno-quarto-miguel-card.js` | dot -> motion_recent+occupancy (sem recent_only); _semanticLine; _dotModel com lista; grid minmax(0,124px) + icone flexivel |
| `bruno-cozinha-card.js` | idem Miguel ("Ocupada") |
| `bruno-quarto-casal-card.js` | idem Miguel |
| `bruno-quarto-marina-card.js` | _semanticLine adicionada (sensor ja existia e nao era exibido) |
| `bruno-lavabo-card.js` | dot -> lavabo_motion_recent; grid minmax(0,124px) + icone flexivel |

### Padrao de alinhamento (Office)

`grid-template-columns: minmax(0, 124px) minmax(0, 1fr) 40px` + `.room-icon { width: 100%;
max-width: <n>px }` — a coluna do icone absorve o deficit de largura e o PNG encolhe
proporcionalmente; a coluna dos status nunca e clipada. Aplicado em Miguel, Casal,
Cozinha e Lavabo (Marina ja estava ok com 96px fixo — mantida).

### Rollback

- Todos os blocos anteriores comentados in-place com `ANTERIOR (2026-07-03)` / `NOVO`.
- Packages novos: comentar os 3 includes em configuration.yaml.
- Cards: reverter cache-bust para `?v=20260702-all-images-1`.

### Pendencias pos-implementacao

| # | Item | Nota |
|---|------|------|
| S1 | Availability no Zigbee2MQTT | habilitar (config do Z2M, fora do repo) para estados congelados virarem `unavailable` — elimina "presenca eterna" |
| S2 | Roteador Zigbee | LQI fracos: sala 29, cozinha 29, marina 21, miguel 47 (office 149). Adicionar router (plug Zigbee) na ala quartos/cozinha |
| S3 | Marina presence travado | testar com quarto vazio 3-5min; se nao cair: static sens 8->3, distance 5->3m; persistindo: trocar com unidade do Q. Casal (defeito conhecido do modelo) |
| S4 | Sensor temp/umid extra no Lavabo | opcional — layout NAO depende mais dele |
| S5 | Commit das mudancas | aguardando validacao visual do usuario (Regra de Ouro #2) |

### Revisao 2 (2026-07-03, mesma sessao) — dot desacoplado da ocupacao

Feedback do usuario: no Q. Miguel, presence ja estava false no HA mas o dot continuava
aceso por 1-2+ minutos. Causa: o dot acendia com motion_recent OU occupancy, e o
delay_off da ocupacao (300s nos quartos / 180s Sala-Office) segurava o icone.

Correcao (regra do usuario: "saiu -> icone apaga rapido"):
- Dot passa a ler APENAS `<slug>_motion_recent` (occupancy so como fallback se a
  camada nao existir). Ocupacao aparece exclusivamente no texto "Ocupado/Ocupada".
- Arquivos: bruno-sala-card.js e bruno-office-card.js (`_presenceRecent`),
  bruno-quarto-miguel/cozinha/quarto-casal/quarto-marina-card.js (dot entities).
- Cache-bust: 6 cards -> ?v=20260703-presence-uniform-2 (lavabo permanece uniform-1).

Notas de hardware da mesma sessao:
- Q. Marina: rejeita gravacao de parametros (erro) + presence travado em true +
  motion_state 'large' fantasma; sensor estava alimentado por USB/tomada e foi
  religado. Protocolo: factory reset (segurar botao ate LED piscar) + re-parear na
  posicao final JA na alimentacao definitiva, aplicar calibracao logo apos o join
  (device acordado aceita escrita); se persistir, trocar pela unidade do Q. Casal.
- Q. Miguel: PIR detecta passagem pelo corredor atraves da porta aberta — limite de
  distancia por software nao se aplica a PIR; corrigir reposicionando/angulando o
  sensor (porta fora do campo de visao).

### Revisao 3 (2026-07-04) — texto semantico sincronizado com a presenca

Teste do usuario na Cozinha: dot apagou correto na saida, mas o texto "Ocupada"
permaneceu ~2 min (delay_off da ocupacao) — contradicao visual (texto sem dot).

Correcao: o TEXTO semantico agora exige ocupacao E presenca ativa (motion_recent).
A ENTIDADE occupancy mantem a liberacao longa (2-5 min) para futuras automacoes
(ex.: nao apagar luz em saida rapida) — a liberacao ficou invisivel na UI.

- Packages (6): semantic_state com guard `and is_state(<slug>_motion_recent,'on')`
  em icon/state/display/priority (sala, office [3 niveis], q_marina, cozinha,
  q_miguel, q_casal).
- Cards (5): fallback do `_semanticLine` com o mesmo guard (sala, marina, miguel,
  cozinha, casal). Office nao tem fallback — sem mudanca no JS.
- Cache-bust: 5 cards -> ?v=20260704-semantic-sync-1.

Estado de rede na mesma data: availability habilitada no Z2M (passive 180 min);
canal Zigbee 25 (ideal); canal Wi-Fi pendente de verificacao; power-cycle limpou
o fantasma da Cozinha; roteador Zigbee segue recomendado (Miguel LQI 14).

### Revisao 4 (2026-07-04) — trava de contexto REMOVIDA da ocupacao

Bug confirmado pelo usuario no Q. Miguel: com o AC ligado, a ocupacao ficava presa
em ON indefinidamente (self-latch `occupancy and context` nunca liberava). Sintomas:
"Ocupado" com quarto vazio por minutos; ao entrar, texto aparecia JUNTO com a
presenca (sem esperar os 60s), pois a ocupacao ja estava latched.

Correcao nos 6 packages: occupancy = SOMENTE presenca sustentada
(`is_state(<presence>, 'on')` + delay_on/delay_off). A folga de delay_off ja cobre
microquedas do radar — a trava era redundante e nociva. Folga dos quartos reduzida
de 300s para 180s (pedido do usuario). Blocos com trava mantidos comentados
(`ANTERIOR ... trava de contexto — REMOVIDA`).

Timers finais: Sala/Office 60s/180s · Quartos 60s/180s · Cozinha 45s/120s ·
Lavabo 120s (dot via motion_recent).

Nota: contexto (TV/AC/PC) NAO deve voltar como latch de estado; se necessario no
futuro, usar como condicao em AUTOMACOES (ex.: nao desligar luz se TV playing),
nunca preso dentro do binary_sensor de ocupacao.

Fisico pendente (Miguel): sensor fica ao lado da camera (split USB do mesmo ponto
de energia) — reposicionamento limitado. Mitigacoes: cabo USB mais longo para
descolar o sensor da camera; fita na lateral da lente PIR voltada a porta;
motion_detection_sensitivity 5 (4 ficou lento para detectar entrada).

---

## Registro de Implementacao — Grade 2-col de Iluminacao nas Subviews (2026-07-07)

### Escopo autorizado

Etapa 2 aprovada pelo usuario (tile 92px + clamp JS "opcao B"). Trocar o conteudo
interno da secao expandida do acordeao de luzes: de LISTA vertical (icone + nome +
barra luminosa) para GRADE de 2 colunas de tiles compactos (icone + toggle em cima;
nome + status "Ligada"/"Desligada" embaixo). Todas as luzes sao on/off puro — sem
dimmer/slider/porcentagem.

### Regra da grade
- 2 colunas fixas. Contagem IMPAR => 1º tile (luz principal) ocupa a linha inteira
  (`.zl-tile.is-wide`, layout horizontal). PAR => todos em pares.
- Altura do tile: 92px. Gap: 12px.

### Diagnostico-chave (Etapa 1)
- Render de luzes e DUPLICADO em 6 subviews (nao ha componente unico).
- Dois formatos: ACORDEAO (`.zone-lights` via `_renderLightZone`) em sala, casal,
  miguel, marina; LISTA UNICA (`.office-light-list`) em office e cozinha.
- Nao existia `max-height` fixo dedicado; a altura era derivada/`auto`.

### Decisoes do usuario aplicadas
1. Teto = espaco acima do bloco A/C, com respiro minimo garantido (nunca encosta no A/C).
2. Removidos TODOS os placeholders da lista; removida a 5ª luz fantasma do Q. Casal
   (`light.quarto_casal_2_switch_3` "Luz cortineiro" — nao existe no HA).
3. Anti-corte (opcao B): a secao expandida so exibe FAIXAS INTEIRAS. Se nao couber,
   trava num multiplo exato de faixa + scroll vertical (minimo 2 faixas). Nunca meia
   faixa cortada.

### Implementacao
- Novo metodo `_renderZoneTile(light, wide)` (nome distinto do rollback
  `_renderLightTile`) — tile com `role="switch"`/`aria-checked` + toggle CSS.
- Novo helper `_clampExpandedLights()` (chamado apos `_mountLiveCameraFeeds()`):
  LAYOUT-AGNOSTICO. Mede o limite inferior da COLUNA (parent do card), desconta os
  blocos apos o card (A/C) + MIN_GAP(12px) + o que ja e ocupado dentro do card
  (cabecalhos + zonas fechadas abaixo) e trava a grade em faixas inteiras via
  `maxHeight` inline + `overflow-y:auto`. Constantes 92/12 espelham o CSS.
- CSS: `.zone-lights` / `.office-light-list` viraram grid 2-col
  (`grid-auto-rows: 92px`); adicionado bloco `.zl-tile`/`.zl-icon`/`.zl-switch`/
  `.zl-name`/`.zl-status` (skin ambar quando ligado).

### Arquivos alterados (6)
- `bruno-sala-subview.js` (referencia), `bruno-quarto-casal-subview.js`
  (+ remocao do cortineiro), `bruno-quarto-miguel-subview.js`,
  `bruno-quarto-marina-subview.js` (acordeao);
- `bruno-office-subview.js`, `bruno-cozinha-subview.js` (lista unica).

### Contagens finais (por zona expandida) e linhas na grade
- Sala·sala 3 (impar→1 full+1 par=2 linhas) · Sala·varanda 4 (2)
- Casal·sala 4 (2) · Casal·varanda 2 (1)
- Miguel·sala 6 (3 — pior caso) · Miguel·varanda 2 (1)
- Marina·sala 4 (2) · Marina·varanda 2 (1)
- Office 3 (impar, 2) · Cozinha 3 (impar, 2)
Pior caso (3 linhas) cabe com folga no tablet-alvo; clamp e rede p/ viewports menores.

### Regra de Ouro / Rollback
- Nada foi apagado. `_renderLightRow` comentado in-place nos acordeoes (mantido intacto
  em office/cozinha por ser usado pelo `_renderLightZone` morto). CSS `.zone-lights`/
  `.office-light-list` anterior mantido em comentario `ANTERIOR (rollback)`.
- Rollback: descomentar os blocos ANTERIOR e remover os blocos NOVO; ou `git revert`.

### Pendencias / pontos de atencao
- Acao "Apagar [zona]" permanece no cabecalho da secao (inalterada). Se a densidade
  nova pedir reposiciona-la, sinalizar antes de mudar.
- Validacao VISUAL no tablet pendente (Regra de Ouro #2 — sem commit ate aprovar).
- Sem runtime Node/Python no ambiente: nao foi possivel `node --check`; revisao manual.

### 2ª passada — ajustes pos-feedback visual (2026-07-07)

Feedback do usuario apos a 1ª passada. Aplicado nos 6 arquivos:

- **A1 (alinhamento):** glifo do ícone alinhado à esquerda (`.zl-icon` `place-items: center start`), casando `início do ícone = início do título`.
- **B3 (remover status):** removido o texto "Ligada/Desligada" (redundante c/ toggle + realce). Consequencias:
  - tile **largo** virou LINHA ÚNICA `ícone | nome | toggle` (`.zl-tile.is-wide` 1 linha + `align-content: center`) — elimina o gap grande do tile largo;
  - tile **compacto** ganhou mais respiro ícone↔nome e **ícone maior** (caixa 36→40px, glifo 23→27px, nome 14→15px).
  - `<span class="zl-status">` removido do `_renderZoneTile` (comentado ANTERIOR); regras `.zl-status` comentadas.
- **Tempo ligado (lógica do painel principal):** helper `_zoneOnLabel` (luz ACESA mais antiga da zona via `last_changed`) + `_fmtElapsed` (Xm/Xh/Xd). Exibido no cabeçalho da seção junto de "N/M acesas · Xh". Office/Cozinha (sem seção) ganharam mini-cabeçalho `.lights-substatus` entre o cabeçalho "Iluminação" e a grade.
- **Efeito "escada":** auditoria confirmou estrutura consistente (grid 48/1fr/54, --ac-h 320, zone-header, tile). Achado real: `.lights-zones` gap era 7px em Casal/Miguel vs 10px em Sala/Marina — **padronizado em 10px** (Casal, Miguel).

Decisoes do usuario nesta passada: Office/Cozinha mantem posicionamento atual (vao ate o A/C aceito por ora); shell inferior (54px) mantida; padronizacao de ícones (SVG animado vs flat/MDI) adiada para etapa propria. Pendencia registrada: A/C "fantasma" de 320px reservado na coluna direita da Cozinha (verificar em etapa futura).

### 3ª passada — ajustes finos + escopo de ícones aprovado (2026-07-07)

- **Item 1 (fonte do título):** confirmado que TODOS os `.zl-name` ja sao 15px/700 identicos (compacto=largo, nos 6). Usuario decidiu manter como esta; unica mudanca pedida: renomear "LED" -> "Led" (`sala-subview` linhas 80-81 + placeholder comentado; `planta-3d-subview` 6 ocorrencias). Se a diferenca visual persistir no tablet, e cache (subviews nao tem `?v=`) ou otico — nao ha diferenca no codigo.
- **Item 2 (gap ícone↔título no tile largo):** causa real = caixa do ícone 40px com glifo 27px alinhado à esquerda (~13px de sobra) + `column-gap: 14px`. Corrigido nos 6: `.zl-tile.is-wide` column-gap 14->10 + `.zl-tile.is-wide .zl-icon { width: 28px }` (abraça o glifo). Compacto inalterado.
- **Item 3 (ícones):** escopo APROVADO pelo usuario. Plano: 2 tiers numa unica linguagem (viewBox 24, stroke ~1.6, linha do rail em `bento-sidebar-card.js`). Tier 1 flat neutro (títulos de seção, cabeçalho, chips, rail — substitui MDI). Tier 2 flat + estado (apagado neutro; aceso = âmbar + fill translúcido + glow + pulsação). Arquitetura: modulo compartilhado `bruno-icons.js`. Rollout faseado (piloto no bloco de iluminação). Preview visual apresentado ao usuario (widget) para validar a linguagem ANTES de wire nos 20+ arquivos. `_tplLightIcon` atual sera mantido comentado no rollout. AGUARDA aprovacao visual do preview para iniciar o wire.

---

## Registro de Implementacao — Shell Mobile Fase 1 (Opcao A) (2026-07-09)

### Contexto e decisao

Diagnostico desta sessao: o mobile (V3/V3.5 de 2026-05) ficou defasado do desktop,
que migrou para a `bruno-shell` (2026-06-24). Causas registradas: entrada fragil
(redirect one-shot dentro da section_home), modelo de interacao divergente (popups
browser_mod abandonados no desktop; navegacao caindo em views de tablet sem navbar),
sensores de presenca antigos nos `bruno-mobile-*` (anteriores ao molde semantico de
2026-07-03/04) e cards desktop redesenhados espremidos em molduras mobile fixas.

Usuario aprovou a **Opcao A**: estender a PROPRIA shell para o mobile (um unico
modelo de interacao; nada de mundo paralelo). Mockup visual aprovado antes do codigo.

### Mecanica implementada (tudo por media query `(max-width: 800px)` — sem JS novo)

```
PHONE (<=800px):
  bruno-shell  -> grid 1 coluna x 2 linhas: content-slot (rolavel) em cima,
                  rail-slot na BASE. Altura 100dvh. Config panel ancora acima do dock.
  rail (bento-sidebar-card) -> "deita": flex-direction row, dock horizontal com
                  scroll-x, labels 9px, itens hide_on_phone somem.
  section_home -> mediaquery do layout-card: 1 coluna empilhada
                  (top_badges, welcome, sala, comodos, energy, roborock, media,
                  camera, quick_actions, sidebar[0px]) com alturas minimas por bloco.
                  card_mod libera height:auto no phone (tablet mantem 100%).
  comodos matriz -> mediaquery: 2 colunas x 3 linhas de 150px.
  subviews     -> JA tinham @media <=760px (1 coluna); nada foi alterado nelas.
```

### Curadoria do dock (rail.yaml, `hide_on_phone: true`)

- VISIVEIS no phone: Home, Cameras, Aspirador, Planta 3D, Config (5 itens).
- OCULTOS no phone: Musica (view tablet nao adaptada), Sistema/Rede/Updates
  (popups de tablet), Atualizar (existe dentro do painel Config) e Power.
- Rail de comodos (rail_rooms.yaml): 7 itens, todos visiveis (cabem no dock).
- A troca de rail por secao (default/rooms) funciona igual no dock — mesma shell.

### Arquivos alterados (6)

| Arquivo | Alteracao |
|---------|-----------|
| `www/bento-sidebar-card.js` | Bloco ADITIVO @media <=800px (modo dock) + atributo `data-hide-phone` no `_button()` |
| `www/bruno-ui/core/bruno-shell.js` | Bloco ADITIVO @media <=800px no `_styles()` (grid 1-col, content rolavel, config panel) |
| `views/shell/section_home.yaml` | Bloco `mediaquery` phone no layout + @media no card_mod + **zz-mobile-redirect COMENTADO** (celular agora FICA na shell) |
| `views/shell/rail.yaml` | `hide_on_phone: true` em music/system/network/refresh/updates/power + comentario de curadoria |
| `shared/grid-cards/bento_comodos_matriz.yaml` | Bloco `mediaquery` phone (2col x 3x150px) |
| `configuration.yaml` | Cache-bust: bento-sidebar-card.js e bruno-shell.js -> `?v=20260709-mobile-shell-1` |

### Decisoes tecnicas

1. **CSS puro, sem JS de deteccao**: shell e rail flipam juntos no MESMO breakpoint
   (800px, o "Phone" historico do projeto) via media queries proprias — sem
   matchMedia/atributos sincronizados, menos pontos de falha.
2. **Dock com overflow-x**: `justify-content: flex-start` no `.rail` (distribuicoes
   centradas + overflow deixam itens da esquerda inalcancaveis); a distribuicao
   uniforme fica no `.group.top { flex:1; justify-content: space-evenly }`.
3. **Estrategia Sagaland preservada** na section_home: todas as grid-areas existem
   no breakpoint phone (sidebar como linha 0px, sem card).
4. **Mundo mobile V3/V3.5 NAO removido**: as 5 views `/mobile-*` continuam
   incluidas no ui-lovelace-main.yaml como fallback manual. Aposentadoria
   (mover para disabled) fica para fase de limpeza, apos validacao no aparelho.

### Rollback

1. `configuration.yaml`: reverter os 2 cache-busts (ANTERIOR comentado inline).
2. `section_home.yaml`: descomentar `zz-mobile-redirect` + remover bloco mediaquery
   e o @media do card_mod => celular volta a ser expulso para /slug/mobile-casa (V3).
3. `bruno-shell.js` / `bento-sidebar-card.js`: remover os blocos @media marcados
   `NOVO (2026-07-09) — MODO PHONE/DOCK` (aditivos; nada acima foi alterado).
4. `rail.yaml`: remover linhas `hide_on_phone`. `bento_comodos_matriz.yaml`:
   remover bloco mediaquery.

### Validacao executada

- Sem runtime Node/Python no ambiente (restricao conhecida): revisao manual dos
  blocos JS (template literals sem backtick/`${` espurios) e do YAML (indentacao
  dos blocos mediaquery conferida por leitura; sintaxe identica a views/main.yaml).
- Tablet/desktop: NENHUMA regra fora de @media <=800px foi tocada — comportamento
  atual preservado por construcao.

### Pendencias (Fase 2+)

| # | Item | Nota |
|---|------|------|
| MS1 | Validacao visual no celular | ✅ FEITA (2026-07-09, iPhone) — Fase 1 aprovada como base; feedback virou a Fase 2 abaixo |
| MS2 | Ajuste fino das subviews no phone | ⏳ parcialmente coberto na Fase 2 (cameras); comodos/roborock/planta pendentes |
| MS3 | Hero (bruno-hero-card) full no phone | ✅ RESOLVIDO na Fase 2 (bloco @media phone no template desktop) |
| MS4 | Faixa 761-800px (landscape de phone grande) | shell em modo phone, subviews no breakpoint 1180px (2 colunas) — verificar se aceitavel |
| MS5 | Aposentar V1/V2/V3/V3.5 | mover includes para bloco comentado + arquivos para disabled/ apos Fase 2 aprovada (Regra de Ouro: nada apagado) |
| MS6 | Popups de tablet no phone | Sistema/Rede/Updates sairam do dock para o menu "Mais"; versoes phone dos popups em fase propria |

---

## Registro de Implementacao — Shell Mobile Fase 2 (2026-07-09, mesma sessao)

### Feedback do usuario (apos teste no iPhone)

Fase 1 satisfatoria como base, mas a UI herdou demais o tablet: (1) hero ocupava
espaco excessivo; (2) card da Sala alto demais; (3) cards de comodo com altura
insuficiente (PNG grande cortava status semanticos e o 4o indicador); (4) home
longa demais — Roborock e Monitoramento redundantes com o dock; (5) Acoes Rapidas
+ dock = dois grupos de botoes empilhados; substituir Config do dock por "Mais";
(6) subviews (cameras/roborock/planta/comodos) precisam de layout proprio phone.

### Implementado nesta fase

| # | Item | Arquivos | Mecanica |
|---|------|----------|----------|
| 1 | Home enxuta | `bento_roborock.yaml`, `bento_camera.yaml`, `bento_quick_actions.yaml`, `section_home.yaml` | `view_layout.show.mediaquery (min-width: 801px)` nos 3 cards + linhas 0px no bloco phone (Sagaland). Home phone: badges → hero → sala → comodos → energia → midia |
| 2 | Hero compacto | `bruno-hero-card.js` | @media <=800px no template DESKTOP (o que roda na home): clock 42px, greeting 19px, paddings minimos, removida regua de 54px do rodape (reservava espaco p/ dock do tablet) |
| 3 | Sala compacta | `bruno-sala-card.js` | Bloco @media 800px ANTERIOR (min-height 300px, resquicio do embed V3.5 que INFLAVA o card) comentado; novo bloco: hero-action 96px, PNG 92x62, command-rows 46px |
| 4 | Comodos legiveis | `bento_comodos_matriz.yaml` + 6 room cards | Linhas da matriz 150->176px + @media phone nos cards: PNG max 100x62 (Marina 64x64 quadrado) + padding reduzido => status semanticos e 4o indicador visiveis |
| 5 | Dock "Mais" | `bento-sidebar-card.js`, `rail.yaml`, `bruno-shell.js` | Botao "Mais" (so phone) no fim do dock abre action-sheet liquid com TODOS os itens `hide_on_phone` (Musica/Sistema/Rede/Atualizar/Updates/Config/Power). Config saiu do dock (hide_on_phone). Sheet fecha ao navegar. rail-slot z-index 2 no phone (sheet sobre o conteudo) |
| 6 | Cameras uniformes | `bruno-cameras-security-subview.js` | @media <=800px (apos os blocos 980/640 — cascata vence): main-feed e camera-tile com MESMA altura `clamp(190px, 26vh, 240px)`, 1 coluna |
| 7 | Cache-busts | `configuration.yaml` | shell/sidebar -> `mobile-shell-2`; hero, sala, office, cozinha, lavabo, casal, marina, miguel, cameras-subview -> `20260709-mobile-phase2-1` |

### Rollback

- JS: todos os blocos novos marcados `NOVO (2026-07-09) — Fase 2 mobile`; o unico
  bloco substituido (sala 800px do V3.5) esta comentado in-place como ANTERIOR.
- YAML: blocos `show:` e ajustes de linha com comentario NOVO/ANTERIOR inline.
- configuration.yaml: versoes ANTERIOR comentadas em cada linha.

### Pendencias para Fase 3 (exigem sessao dedicada)

| # | Item | Nota |
|---|------|------|
| F3.1 | Subviews de COMODO no phone | @media 760px atual empilha mas "desconfigura" (feedback); precisa layout proprio por subview (6 arquivos grandes) |
| F3.2 | Roborock subview no phone | layout concebido em landscape; nao adapta |
| F3.3 | Planta 3D no phone | "nao esta funcionando" — precisa diagnostico ao vivo (console/comportamento) antes de corrigir |
| F3.4 | Acoes Rapidas realocadas | menu expansivel acionado por botao no Hero (sugestao do usuario); hoje estao apenas ocultas no phone |
| F3.5 | Hero: agenda "Atualizando agenda" | verificar por que o fetch de agenda demora/falha no phone (visto no screenshot) |

---

## Registro de Implementacao - Ajustes pontuais da Home (2026-07-11)

### Escopo aplicado

Somente os cards JS da Home foram alterados; grid, shell, subviews, tokens globais
e packages de sensores permaneceram fora do escopo.

| Area | Arquivos | Implementacao |
|---|---|---|
| Comodos | `bruno-sala-card.js`, `bruno-office-card.js`, `bruno-cozinha-card.js`, `bruno-lavabo-card.js`, `bruno-quarto-casal-card.js`, `bruno-quarto-marina-card.js`, `bruno-quarto-miguel-card.js` | Faixa inferior ampliada nos comodos com subview; feedback local e animacao curta do chevron. Lavabo preserva a regra especial: somente o chevron abre o popup existente. |
| Energia | `bruno-energy-card.js` | Titulo `Consumo parcial`; comparativo via atributo `last_period` dos utility meters diario, semanal e mensal. |
| Roborock | `bruno-roborock-card.js` | Estado `cleaning`/`segment_cleaning` usa somente leve ganho de superficie pelo token `surface-on`; removidos borda e glow do destaque ativo. |
| Monitoramento | `bruno-home-camera-card.js` | Fila FIFO, handoff 5s, retorno Sala 8s e override manual 30s, condicionados a um `motion_entity` real por camera. `recording` foi descartado como sinal por ser estado operacional persistente da Tuya. |
| Midia | `bruno-media-card.js` | Ultima midia valida persistida em `localStorage` (`bruno-ui:last-valid-media:v1`); estado inativo conserva arte/metadados, remove progresso e abre Spotify Plus por `Escolher midia`. |

### Fallback rapido

1. Restaurar apenas o card afetado pela copia anterior ou pelo diff local; os cinco
   grupos acima sao independentes e nao exigem rollback conjunto.
2. Em `configuration.yaml`, devolver o recurso correspondente ao `?v=` anterior
   registrado no historico local e recarregar os recursos do frontend.
3. Camera: remover constantes `BRUNO_HOME_CAMERA_*`, metodos de fila entre
   `_model()` e `_selectCamera()` e classes `is-motion`; o comportamento anterior
   volta a obedecer somente `input_select.bento_active_camera`.
4. Midia: remover `BRUNO_MEDIA_LAST_VALID_KEY`, helpers de snapshot, branch
   `.is-inactive-media` e acao `choose-media`; playing/paused nao dependem desse
   fallback.
5. Energia: remover `*_total`, `_comparison()` e o segundo `<text>` do SVG.
6. Roborock: remover `cleaningClass` e `.is-cleaning`; o restante da logica do robo
   permanece intacto.

### Cache-buster

Os cards do lote receberam cache-buster em `config/configuration.yaml`; camera,
energia e midia estao na revisao `?v=20260711-home-microadjust-2` apos a correcao
de campo abaixo.

### Correcao de campo - camera, midia e energia (2026-07-11)

- Camera: `camera.* = recording` nao e evento de movimento nas cameras Tuya; sete
  entidades permaneceram nesse estado e produziram o falso `7/8`. A fila agora
  aceita somente `motion_entity` explicito por camera, com estado `on`, `detected`
  ou `motion`. Como a integracao atual nao expoe entidade de evento funcional, o
  auto-switch fica inativo e a selecao manual permanece estavel, sem falso positivo.
- Midia: estado inativo passou a empilhar status e `Escolher midia`, eliminando a
  sobreposicao no estreito trilho esquerdo.
- Energia: `Consumo parcial` usa 11px/500 e `--text-soft`, igual aos status
  semanticos dos cards de comodo.
- Cache-buster destes tres cards: `?v=20260711-home-microadjust-2`.

### Ponte de movimento Tuya das cameras (2026-07-13)

- O DP bruto `initiative_message` (212) chega pelo MQTT com `cmd: ipc_motion`,
  mas nao e publicado pelas entidades `movement_detect_pic`, `alarm_message` ou
  `device_notifications` da integracao atual.
- `config/custom_components/bruno_tuya_motion/` apenas escuta a fila MQTT ja
  criada por Tuya/Xtend Tuya. A integracao original nao foi modificada.
- Cada pacote `ipc_motion` atualiza um estado
  `bruno_tuya_motion.<object_id_da_camera>`. O card usa esses oito estados como
  `motion_entity`, preservando fila FIFO, handoff, retorno e selecao manual ja
  existentes.
- `configuration.yaml` carrega a ponte pela chave `bruno_tuya_motion:` e usa o
  cache-buster `20260713-camera-motion-bridge-1` no card de monitoramento.

Fallback rapido:

1. Comentar apenas `bruno_tuya_motion:` em `configuration.yaml`.
2. Restaurar o mapeamento anterior no inicio de
   `bruno-home-camera-card.js` ou deixar `motion_entity` vazio para manter apenas
   selecao manual.
3. Restaurar o `?v=20260712-camera-motion-event-3` do recurso e reiniciar o Home
   Assistant. Nenhum package de presenca ou arquivo da Xtend Tuya precisa ser
   revertido.

---

## Registro de Implementacao — Faixa de tiles ate a base nas subviews (2026-07-29)

### Escopo

Item 2 do bloco aprovado, parte "subviews". A Home NAO foi tocada nesta passada
(o dock de acoes rapidas so pode sair depois que o painel Dispositivos existir).

### O que mudou

A linha `bottomband` (54px) saiu do grid das 6 subviews de comodo. Ela carregava
apenas o status de presenca. Consequencias:

- A faixa de tiles (cameras / hub de midia / eletrodomesticos / A-C) passa a
  encostar na base do painel, como na Home.
- A linha de conteudo (`1fr`) ganha 64px (54px da faixa + 10px do gap). Esse ganho
  vai para o hero (coluna esquerda) e para a Iluminacao (coluna direita) — e o que
  tira a rolagem do bloco de luzes no Q. Miguel, que tem 6 luzes na zona sala.
- A presenca virou a PRIMEIRA badge da barra superior (`mdi:motion-sensor`, azul
  `96,165,250` = `--accent-blue` do dot dos cards de comodo). Texto de
  `_presenceLine()` (inalterado); acendimento por `_presenceActive()` (novo), que
  le `motion_recent` — mesmo contrato de 2026-07-03: dot/acendimento imediato pela
  presenca, texto pela ocupacao.

### Phone: byte-equivalente ao de hoje

A regra do phone que escondia Roteador/Zigbee era POSICIONAL
(`.tb-badge:nth-child(n + 4)`). Com a Presenca no inicio ela passaria a esconder a
Umidade. Trocada por selecao por ATRIBUTO (`[data-phone-hide]`), marcada em
Presenca + Roteador + Zigbee. O phone segue exibindo Luzes / Temperatura / Umidade,
e a Presenca fica oculta — o rodape ja era `display: none` no phone.

### Aplica-se a TODOS os temas

A mudanca e de LAYOUT, nao de pele: os 64px e a badge valem em iOS / visionOS /
Liquid Glass / Josh. So a moldura (`main::before`) e exclusiva do Josh, e ela
apenas acompanhou a nova regua.

### Arquivos alterados (8)

| Arquivo | Alteracao |
|---------|-----------|
| `subviews/bruno-sala-subview.js` | grid sem `bottomband`; badge Presenca; `_presenceActive()`; regra do phone por atributo; chamada `_renderFrameBottom()` comentada |
| `subviews/bruno-office-subview.js` | idem |
| `subviews/bruno-cozinha-subview.js` | idem (grid 3-col, 4 linhas -> 3) |
| `subviews/bruno-quarto-casal-subview.js` | idem |
| `subviews/bruno-quarto-marina-subview.js` | idem |
| `subviews/bruno-quarto-miguel-subview.js` | idem |
| `core/bruno-surface-material.js` | `--bruno-subview-band-height`: `calc(--ac-h + gap + 54px)` -> `var(--ac-h, 320px)`. `grid-row: 2 / -1` segue correto: com uma linha a menos, `-1` virou o fim da propria linha dos cards |
| `configuration.yaml` | cache-bust `?v=20260729-subview-footer-out-1` nos 7 recursos acima |

NAO tocadas: `bruno-cameras-security-subview.js`, `bruno-roborock-subview.js`,
`bruno-planta-3d-subview.js` (nao tem rodape nem injetam `subviewStyles()`).

### Rollback

Tudo comentado in-place com o marcador `rollback 2026-07-29`. Por arquivo:
1. restaurar `grid-template-rows` / `grid-template-areas` do bloco ANTERIOR;
2. devolver a interpolacao `this._renderFrameBottom()` no lugar do comentario HTML
   (o metodo continua definido);
3. voltar a regra do phone para `nth-child(n + 4)` e remover `phoneHide` das badges;
4. em `bruno-surface-material.js`, voltar o default de `--bruno-subview-band-height`;
5. reverter os `?v=` em `configuration.yaml` (linhas ANTERIOR ao lado).
Ou `git revert` do commit desta sessao.

### Validacao

Sem runtime Node/Python no ambiente. Verificado por script: chaves balanceadas nos
6 arquivos (delta 0), backticks em numero PAR (nenhum backtick aninhado em template
literal), zero `${` dentro dos comentarios novos, `_presenceActive`/`_presenceLine`
presentes uma vez em cada, `_renderFrameBottom()` sem chamadas ativas, `--ac-h: 320px`
declarado nas 6 subviews (bate com o fallback do modulo de material).

### Pendencias

| # | Item | Nota |
|---|------|------|
| SB1 | Validacao visual no tablet | conferir se a Iluminacao do Q. Miguel deixou de rolar e se a faixa assenta na base nas 6 subviews |
| SB2 | Home: mesma mudanca | depende do painel Dispositivos (item 4) — sem ele, sair o dock tira TV e A-C da tela sem destino |
| SB3 | Cozinha: grids legados | duas definicoes antigas de `.cozinha-subview` (2-col) seguem no arquivo, sobrescritas pela ativa. Nao foram tocadas |

### Incidente e correcao — crase dentro de template literal (2026-07-29)

Sintoma reportado: nas 6 subviews TUDO voltou ao estilo VisionOS — faixa de tiles,
filetes, pele dos cards. A Home ficou intacta (tiles e faixa normais).

Causa raiz: no comentario CSS que eu adicionei em `main::before`
(`core/bruno-surface-material.js`) escrevi uma expressao entre CRASES. Esse
comentario vive DENTRO do template literal retornado por
`brunoSubviewTileStyles()`. A crase FECHOU a string, o modulo parou de compilar e
`globalThis.BrunoSurfaceMaterial` nunca foi definido. Consequencia em cascata:

- `subviewStyles?.()` virou `undefined` -> `|| ''` -> ZERO css Josh nas subviews;
- `connect?.(host)` virou no-op -> o host nunca recebeu
  `data-bruno-subview-surface-theme="josh"`.

A Home nao passa por esse modulo (o modo tile dela le `--bruno-tile-mode` direto
dos tokens do tema), por isso continuou perfeita — e essa assimetria foi o que
identificou o culpado: se o tema tivesse caido, a Home cairia junto.

Correcao: crases trocadas por aspas retas. Cache-bust
`?v=20260729-subview-footer-out-2`. A remocao do rodape e a badge de Presenca
seguem valendo — nao tinham relacao com a falha.

#### INVARIANTE (terceira ocorrencia do mesmo erro neste projeto)

**NUNCA usar crase dentro de comentario CSS/JS que esteja dentro de template
literal.** Paridade de crases NAO detecta: uma crase espuria vira duas e o total
continua par. O check correto conta crases DENTRO do bloco de template, entre o
`return` e o fechamento. Vale para os arquivos de tema, de material e de card —
todos montam CSS por template literal.

#### Diagnostico errado que tomei no caminho (registrado para nao repetir)

Antes de achar a crase, atribui a falha a uma corrida de carregamento no
`bruno-theme-manager.js` (`validTheme()` descarta a preferencia se o modulo do
tema ainda nao executou, e nada reavalia depois) e cheguei a implementar um
retry. A Home estar normal PROVAVA que o tema estava ativo, o que invalidava essa
hipotese — a alteracao foi integralmente revertida (arquivo identico ao HEAD).

A fragilidade descrita, ainda assim, EXISTE: se um dia `bruno-<tema>.js` for
cache MISS e `bruno-theme-manager.js` cache HIT, a ordem de execucao dos
`extra_module_url` pode inverter (script criado por JS executa na ordem em que
TERMINA de carregar) e a preferencia cai no fallback de forma permanente naquele
load. Nao foi a causa deste incidente e nao foi corrigida — fica registrada para
avaliacao futura.

---

## Registro de Implementacao — Iluminacao: paridade de tokens + dock (2026-07-29, rev.9)

### Parte A — a cartela da Iluminacao passa a USAR os tokens do card dinamico

Diagnostico: as revisoes 6/7/8 calibraram a cartela no olho e ela divergia do card
dinamico da Home em CINCO pontos. A cadeia real do card dinamico (ex. `.media-card`):

```
--bruno-liquid-surface-off-*   (o Josh NAO sobrescreve)
  -> --bruno-liquid-card-*     (bruno-visionos.js, base do Josh)
  -> --ha-card-background: none / --ha-card-box-shadow: none   (themes/tablet.yaml)
```

| # | Card dinamico | Iluminacao (rev.8) |
|---|---------------|--------------------|
| 1 | radial de topo `360x240 at 18% -10%` | ausente |
| 2 | sem base escura (tablet.yaml zera) | `rgba(0,0,0,0.300)` |
| 3 | `blur(20px) saturate(1.18) brightness(1.03)` | `none` |
| 4 | borda `rgba(255,255,255,0.105)` | `0.10` |
| 5 | edge-glow opacidade `1` | `0.70` |

Correcao: os tokens `--bruno-subview-cartela-*` deixaram de ter valores proprios e
passaram a APONTAR para `--bruno-liquid-surface-off-*`. Nao ha valor duplicado — se
o card dinamico mudar, a Iluminacao acompanha e a divergencia fica impossivel por
construcao. Adicionados `-filter`, `-sheen-opacity` e `-edge-opacity`.

Os itens 1 e 3 andam juntos: sem blur o radial pousa sobre a foto nitida e le como
bolha de borda dura (foi o "efeito circular" da rev.8). Com blur ele dissolve. NAO
remover um sem o outro. A nota REV.7 em `bruno-surface-material.js` (que mandava nao
reintroduzir filtro) fica como historico, nao como regra: ela tomou a FAIXA como
referencia, e a referencia correta e o CARD DINAMICO.

### Parte B — nova estrutura do bloco (dock)

- Colapsado por padrao numa faixa de 54px ancorada 7px acima da faixa de tiles e
  alinhada a coluna do A/C.
- Faixa = icone + "Iluminacao" + pilulas + chevron. As pilulas agem no estado
  colapsado; so o titulo e o chevron alternam o painel.
- Abre para CIMA sobre o hero, sem reflow: `.lights-card` e `position: absolute`
  dentro de `.right-column` (que virou `position: relative`), ancorado por
  `bottom: var(--lights-dock-bottom)`. Corpo primeiro no DOM, faixa por ultimo.
- Animacao por `grid-template-rows: 0fr -> 1fr` (200ms) — acompanha a altura do
  conteudo sem medicao em JS. Chevron gira 180deg.
- `max-height: calc(100% - var(--lights-dock-bottom))` + `overflow-y: auto` no
  conteudo: rolagem so quando estoura a area util. Substitui `_clampExpandedLights()`,
  cuja chamada foi comentada (metodo preservado).
- Sem acordeao: todas as secoes visiveis ao mesmo tempo. Filete entre secoes.
- Grade 2-col SEM cards: celulas separadas por filetes (`has-rule-top`/`has-rule-left`
  calculados em `_lightCellFlags`, porque a luz principal ocupa a linha inteira quando
  a contagem e impar e o `nth-child` erraria).
- Office/Cozinha nao tem secoes: mantem so o substatus, sem "Apagar <zona>" (a faixa
  de titulo ja concentra "Apagar todas") — evita redundancia.
- `--lights-dock-bottom`: `calc(var(--ac-h,320px) + 7px)` nas 5 subviews cuja coluna
  direita contem o A/C; na Cozinha a coluna termina acima da linha `appliances`, entao
  o valor e `calc(7px - var(--office-gap,10px))`.

### Phone intocado

Todo o bloco novo de CSS foi inserido ANTES das media queries de 1180/760/800px, e o
posicionamento absoluto esta dentro de `@media (min-width: 761px)`. No phone o card
volta a ser bloco em fluxo, com as regras existentes prevalecendo.

### Arquivos alterados (9)

`core/bruno-josh.js`, `core/bruno-surface-material.js`, as 6 subviews de comodo e
`configuration.yaml` (cache-bust `?v=20260729-lights-dock-1`).

### Rollback

Tudo comentado in-place com o marcador `rev.9` / `rollback 2026-07-29`.
`_renderLightZone`, `_renderZoneTile` e `_clampExpandedLights` seguem definidos e
intactos; o CSS antigo (`.lights-zones`, `.light-zone`, `.zone-lights`, `.zl-*`)
tambem. Para reverter: restaurar o `return` de `_renderLights`, descomentar a chamada
do clamp, remover o bloco de CSS marcado REV.9 e voltar os tokens da cartela aos
valores comentados em `bruno-josh.js`.

### Validacao

Sem runtime Node/Python. Por script: chaves e parenteses balanceados nos 6 arquivos
(delta 0), backticks em numero PAR, ZERO crase nos comentarios novos (a armadilha de
2026-07-29 — ver invariante acima), e cada metodo novo presente exatamente uma vez.

### Pendencias

| # | Item | Nota |
|---|------|------|
| L1 | Validacao visual no tablet | conferir alinhamento do dock com a tile do A/C e a abertura sobre o hero |
| L2 | Q. Miguel: 3 faixas | com o dock a altura util e maior; verificar se ainda rola |
| L3 | Cozinha | `--lights-dock-bottom` negativo por construcao (coluna termina acima da faixa); conferir no tablet |

### REV.10 (2026-07-29) — correcoes do dock, sem tocar na receita da cartela

Os tokens da rev.9 (cartela = `--bruno-liquid-surface-off-*` do card dinamico)
NAO foram alterados. As 5 divergencias mapeadas — radial, base, blur, borda
0.105, edge-glow 1.0 — seguem resolvidas por alias e ficam congeladas.

| # | Defeito | Causa | Correcao |
|---|---------|-------|----------|
| 1/7 | card "fosco", sem nivel interno | a rev.9 renomeou `.zl-tile` -> `.light-cell` e NAO atualizou `BRUNO_SURFACE_CARTELA_INNER`; as celulas ficaram orfas da regra e o card virou lamina uniforme | `.light-cell` entrou na lista. A regra nao define radius nem border-width, entao a celula ganha superficie + blur do hub sem virar card |
| 2 | "linha circular" | DOIS aneis: `.micro-icon` (28px) no cabecalho e `.zone-icon` (34px) em cada secao. Nao e o radial — ele e parte da receita exigida no item 1 | borda/fundo/raio zerados so dentro do `.lights-card`; glifo âmbar preservado |
| 3 | chevron na borda direita | estava em `.lights-dock-actions`, com `space-between` | movido para dentro de `.lights-dock-id` |
| 4 | recuo lateral grande | 3 recuos distintos (dock 14, scroll 12, celula 12 sobre coluna de 28) | unificados em 10px, coluna de icone 22px |
| 5 | cabecalho preso na base | a rev.9 pos o corpo PRIMEIRO no DOM; com o card ancorado pelo `bottom`, a faixa ficava embaixo | faixa primeiro, corpo depois — o cabecalho viaja ate o topo ao abrir |
| 6 | rotulos truncados + sobra a direita | cromo de 114px numa coluna de ~193px deixava 79px para o nome | cromo -> ~86px (icone 22, gap 8, toggle 34, padding 10) |
| 8 | sem filete cabecalho/conteudo | so existia `.light-section + .light-section` | `.lights-card.is-open .lights-dock { border-bottom }` |
| 9 | Office/Cozinha sem secao | interpretei "sem acao Apagar" como "sem secao" | uma secao unica, mesma composicao, sem a acao |

`.light-section` NAO entrou em `BRUNO_SURFACE_CARTELA_GROUPS` de proposito: aquela
regra desenha borda completa e transformaria cada secao numa caixa. A separacao
entre secoes continua sendo filete.

Arquivos: `core/bruno-surface-material.js` + as 6 subviews. Cache-bust
`?v=20260729-lights-dock-2` (o `bruno-josh.js` nao mudou e ficou em `-1`).

### REV.11 / REV.12 (2026-07-29) — o blur sai de novo; a REV.7 estava certa

Duas regressoes minhas na mesma sessao, ambas por aplicar o mapa de tokens do
card dinamico ao pe da letra:

1. **REV.11 — radial.** Eu argumentei que a "linha circular" nao podia ser o
   radial porque ele integra a receita do card dinamico. Errado: no print do
   bloco aberto o arco atravessa o painel. Sem filtro, a rampa de alfa 0.105 ->
   transparent exibe BANDING sobre superficie lisa, e os degraus viram arcos.
   Textura mascara banding; superficie lisa denuncia. Radial removido.

2. **REV.12 — blur.** A rev.9 reintroduziu `backdrop-filter` e escreveu no
   modulo que a nota REV.7 estava errada. Nao estava. Este registro ja dizia
   "NAO reintroduzir backdrop-filter aqui" e o motivo continua valendo: a
   Iluminacao le como TRANSLUCIDA porque NAO filtra — a foto atras aparece
   NITIDA, so escurecida pelo scrim. Blur destroi a textura e tudo vira painel
   chapado. Voltou `filter: none` + scrim `rgba(0,0,0,0.300)`.

**A distincao que faltava, e que fica como regra:** o mapa de tokens do card
dinamico e referencia de COR e CONTORNO — borda `rgba(255,255,255,0.105)`,
edge-glow opacidade `1.0`, sheen `0.13`, raio `20px`, sombra `none`, todos
adotados e mantidos. NAO e referencia de FILTRO nem das camadas radiais. O mesmo
valor de blur da resultado oposto porque o que fica ATRAS e diferente: na Home o
card dinamico esta sobre o wallpaper da shell; na subview a cartela esta sobre a
foto do comodo.

Estado final da cartela: `linear-gradient(180deg, rgba(255,255,255,0.060),
rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)` +
`backdrop-filter: none` + borda 0.105 + edge 1.0 + sheen 0.13 + raio 20px.

Cache-bust `?v=20260729-lights-dock-4` (josh + material).

### QUARTA ocorrencia da crase (2026-07-29) — e o detector correto

Na rev.13 escrevi, num comentario CSS dentro do template literal, o nome de uma
regra entre CRASES. Resultado: as 6 subviews caíram com "Erro de configuração".

Meus dois checks passaram, e por isso falharam:
- paridade de crases no arquivo: a crase espuria vem em PAR (abre e fecha);
- grep por linha usando palavras-chave do bloco novo: o texto com a crase estava
  numa linha que nao continha nenhuma das palavras procuradas.

**Detector correto** (scratchpad/crase.pl): varre o arquivo mantendo estado de
"dentro de comentario /* */" e acusa QUALQUER crase ali dentro. Roda em todos os
arquivos que montam CSS por template literal. Ele acusa tambem 12 falsos
positivos conhecidos (o bloco `ANTERIOR (rollback)` de `_presenceLine`, que e
comentario JS comum fora de template, nas 6 subviews) — esses sao inofensivos.

REGRA: ao citar codigo em comentario nesses arquivos, usar aspas retas ou
simplesmente descrever ("a regra .lights-card com padding de 14px"). NUNCA crase.

### REV.14 (2026-08-01) - microblur Josh de 2px, com rollback cirurgico

Objetivo aprovado: desfocar minimamente o wallpaper sob as superficies Josh,
sem alterar transparencia, scrim, bordas, filetes, sheen, edge-glow ou geometria.
A regra e uma unica amostragem por superficie principal; nunca empilhar blur no
container e em seus filhos.

Aplicacao:
- cards Josh: `--bruno-liquid-card-filter` e estados on/off usam blur(2px),
  preservando saturate, brightness e contrast ja existentes;
- faixa da Home: somente `--bruno-strip-frame-filter` usa blur(2px); tiles
  individuais continuam com filtro none;
- faixa inferior das subviews: somente `main::before` consome
  `--bruno-subview-band-filter: blur(2px)`; cards filhos continuam sem filtro;
- cartela de Iluminacao: somente a cartela externa usa blur(2px);
- filtros internos anteriores de 14px e 12px ficam none no Josh para impedir
  borrado sobre borrado. Outros temas nao mudam.

Rollback rapido, sem tocar em fills ou contornos:
1. remover os overrides `bruno-liquid-card-filter`,
   `bruno-liquid-surface-off-filter` e `bruno-liquid-surface-on-filter` de
   `bruno-josh.js`;
2. restaurar `bruno-strip-frame-filter` e `bruno-subview-cartela-filter` para
   `none`, remover `bruno-subview-band-filter`, restaurar
   `bruno-subview-tile-inner-filter` para `blur(14px) saturate(1.10)` e
   `bruno-subview-cartela-inner-filter` para `blur(12px) saturate(1.08)`;
3. em `bruno-surface-material.js`, remover somente as duas declaracoes de
   backdrop-filter de `main::before`;
4. reativar os resources anteriores anotados em `configuration.yaml`:
   Josh `20260731-josh-syntax-fix-1` e material
   `20260731-lights-grid-final-1`.

### REV.15 (2026-08-01) - hierarquia interna e composicao dos cards dinamicos

Objetivo aprovado: preservar integralmente o microblur externo de 2px da
REV.14 e recuperar apenas a separacao visual das superficies internas do Hub
de Midia e dos botoes de Iluminacao. Em paralelo, impedir que os cards
dinamicos permaneçam dentro de um wrapper transformado apos a animacao.

Aplicacao cirurgica:
- `--bruno-subview-tile-inner-filter` voltou para
  `blur(14px) saturate(1.10)`; os seletores continuam limitados aos agrupadores
  internos mapeados por `BRUNO_SURFACE_BAND_INNER`;
- `--bruno-subview-cartela-inner-filter` voltou para
  `blur(12px) saturate(1.08)`; somente `.zl-tile`, `.light-row` e `.light-cell`
  consomem esse nivel;
- filtros externos `bruno-strip-frame-filter`, `bruno-subview-band-filter` e
  `bruno-subview-cartela-filter` permanecem em 2px, sem alteracao de fill,
  scrim, borda, filete, sheen, edge-glow ou geometria;
- `bruno-activity-column.js` remove `is-entering` 40ms depois do fim nominal
  da animacao. Assim o `transform` com fill-mode `both` nao permanece como
  camada de composicao sobre os cards dinamicos.

Rollback rapido desta revisao, sem tocar na REV.14:
1. em `bruno-josh.js`, devolver somente os dois tokens internos para `none`;
2. em `bruno-activity-column.js`, remover `BRUNO_ACTIVITY_COLUMN_ENTER_MS`,
   `_enterTimers` e o timer de limpeza; devolver a animacao para `260ms`;
3. reativar em `configuration.yaml` os resources
   `20260801-josh-microblur-1` e `20260725-home-v2-7`.

### REV.16 (2026-08-01) - botoes de luz com o material dos controles do A/C

Objetivo aprovado: corrigir somente as superficies dos botoes de luz nas
subviews Josh, mantendo intactos o microblur externo de 2px, os cards
dinamicos, a faixa de comodos, os cards externos, dimensoes, gaps e funcoes.

Aplicacao:
- os tokens `--bruno-subview-cartela-inner-*` apontam para o mesmo pacote
  `--bruno-liquid-control-*` consumido por `.ac-action`;
- a regra central de `.zl-tile`, `.light-row` e `.light-cell` passa a consumir
  background, filtro, borda completa, raio compacto e sombra desse pacote;
- a regra continua limitada ao Josh pelo atributo
  `data-bruno-subview-surface-theme="josh"`; nenhum outro tema muda;
- nenhuma das seis subviews foi editada individualmente.

Rollback rapido:
1. reativar os resources `20260801-josh-inner-hierarchy-1` e
   `20260801-josh-microblur-1` anotados em `configuration.yaml`;
2. em `bruno-josh.js`, restaurar os tokens internos registrados na REV.15;
3. em `bruno-surface-material.js`, remover apenas `border` e `border-radius`
   da regra central `cartelaInner`, preservando `border-color` e `box-shadow`.

### REV.17 (2026-08-01) - backdrop root da Iluminacao

Diagnostico confirmado: os botoes de luz e os controles do A/C ja consumiam o
mesmo pacote `--bruno-liquid-control-*`, mas estavam em hierarquias de
composicao diferentes. O `backdrop-filter: blur(2px)` aplicado diretamente na
cartela externa da Iluminacao criava um backdrop root. Com isso, o filtro forte
dos botoes internos nao conseguia amostrar a foto do comodo; no A/C, cujo tile
externo nao tem filtro ancestral, a mesma receita produzia o fosco correto.

Correcao cirurgica em `bruno-surface-material.js`:
- a cartela externa mantem background, borda, raio, sombra e transparencia;
- o filtro direto do ancestral passa a `none`;
- o pseudo-elemento `::after`, antes desativado por gerar o arco de edge-glow,
  vira um plano retangular transparente atras do conteudo e recebe somente o
  microblur externo de 2px;
- o sheen permanece acima desse plano e o conteudo acima de ambos;
- os botoes continuam usando o pacote completo do A/C, agora sem o bloqueio do
  backdrop root.

Nao houve alteracao em `bruno-josh.js`, A/C, faixa inferior, geometria, gaps,
funcoes ou arquivos individuais das subviews.

Rollback rapido: reativar o resource
`20260801-light-control-material-1` anotado em `configuration.yaml`. Isso volta
somente a REV.16; todos os tokens e ajustes anteriores permanecem preservados.

### REV.18 (2026-08-02) - material Josh nos popups

Objetivo aprovado: aplicar aos popups Sistema, Rede, Cenas, Config e Lavabo o
mesmo pacote visual dos cards Josh, sem alterar geometria, posicionamento,
scrim, imagens, conteudo ou comportamento.

Aplicacao:
- `bruno-josh.js` expoe aliases `--bruno-josh-popup-*` que apontam diretamente
  para o pacote aprovado `--bruno-liquid-surface-off-*`; nao ha copia de RGBA;
- `bruno-shell.js` marca o overlay com `data-bruno-popup-theme="josh"` e aplica
  o material somente aos paineis Config, Sistema, Rede e Cenas. Spotify e o
  popup autonomo de Updates ficam fora desse escopo;
- superficies internas continuam consumindo `--bruno-liquid-control-*`;
- `bruno-lavabo-card.js`, por usar Shadow DOM e `<dialog>` nativo, possui uma
  ponte local Josh equivalente; foto e shade do banner permanecem intactos;
- cenas preservam integralmente suas imagens e recebem apenas o contorno do
  pacote de controles.

Invariantes: nao editar cards dinamicos, subviews, faixa da Home, shell,
dimensoes dos popups ou handlers para calibrar esse material.

Rollback rapido:
1. reativar em `configuration.yaml` os seis resources anteriores anotados para
   Josh, Shell, Sistema, Rede, Cenas e Lavabo;
2. remover somente os aliases `--bruno-josh-popup-*`, os seletores Josh do
   overlay compartilhado e a ponte local do dialog do Lavabo.

---

## Registro de Implementacao — Fase 5c: conteudo vivo dos modulos (2026-08-05)

### Escopo

Ligar os modulos das seis subviews de comodo no componente novo
(`dashboard-src/src/components/rooms/bruno-room-subview.ts`). A troca estrutural
ja estava em producao desde 2026-08-05 pela manha; faltava o conteudo.

### Defeitos relatados pelo usuario e causa de cada um

| # | Sintoma | Causa |
|---|---------|-------|
| 1 | Hub de midia sem conteudo, acordeao inerte (Sala, Office, Casal, Marina, Miguel) | so o cabecalho (`mh-source-head`) era renderizado; sem `mh-source-body` e sem tratador de clique |
| 2 | A/C sem anel luminoso e sem botao de power (todas) | `icg-root` com `<svg>` VAZIO; `ac-power-floating` como `<div>` vazio |
| 3 | Cabecalho "Eletrodomesticos" com circulo no lugar do icone | `mdi:silverware-fork-knife` nao esta na tabela de apelidos dos Hugeicons; origem usa `mdi:home-lightning-bolt-outline` |
| 4 | Camera demorando muito a renderizar | eu montava `hui-image` com `cameraView: 'live'` (negocia stream). Origem usa instantaneo `/api/camera_proxy/` com ciclo de 6,5s e pre-carga fora da arvore |
| 5 | Cozinha sem a camera PIP | eu lia `cameraMain`/`cameraSecondary` (ids soltos) em vez de `entities.cameras`, que traz nome, nome curto e os tres interruptores |

### Correcoes estruturais adicionais (achadas na medicao)

- **Id de entidade pode ser LISTA de candidatos** (A/C do Q. Marina tem onze
  nomes). `_resolverId` escolhe o primeiro disponivel. Sem isso o Marina exibia `--`.
- **Regra do acordeao DIFERE por comodo**: TV+Spotify descarta a escolha manual
  quando uma fonte fica ativa; PC+Spotify (Office) da PRECEDENCIA ao Spotify.
- **Comandos do PC sao do dominio `button`** — `press`, nao `toggle`.
- **Data da barra superior**: `toLocaleDateString('pt-BR')` devolve " de " e ponto
  final, 30px mais largo que a origem. Tabela fixa de dias/meses.
- **Badge de luzes e por ZONA** ("Sala 3 · Varanda 4"), nao um total.
- **Grau e U+00B0**, nao o ordinal masculino U+00BA.

### Desvio deliberado (unico)

Os seis arquivos originais rotulam a fonte de TV como "TV da sala" nos SEIS —
inclusive no Q. Miguel. So a Sala tem entidade de TV. Fora dela o rotulo passa a
ser "TV". Marcado no codigo com comentario proprio.

### Medicao (criterio de aceite)

Comparacao entre a subview ATUAL e o componente NOVO, montados na mesma pagina e
no mesmo instante (viewport 1280x720), nos seis comodos:

- **461 campos** — geometria de 13 modulos, textos das seis badges, rotulos dos
  botoes do hub e dos controles do A/C, fontes do acordeao;
- **3 divergencias**, todas o desvio de rotulo acima.

Interacao verificada: acordeao abre/fecha; popover de Modo abre com 5 opcoes e
dispara `climate.set_hvac_mode`; power dispara `climate.turn_off`; toque no PIP
promove a segunda camera; menu de cameras abre 3 controles.

### Licao de metodo (a que produziu o erro)

Paridade GEOMETRICA foi usada como criterio de aceite. Ela mede caixas — e uma
caixa vazia mede igual a uma cheia. O banco de medicao ganhou `window.conteudo()`
/ `window.inspecao()`, que contam conteudo por modulo. Registrado em
`docs/13-testing-and-validation.md`.

Duas armadilhas de medicao anotadas la:
1. o glifo do `bruno-icon` vive no SHADOW ROOT — contar `.lc-icon svg` da zero
   mesmo com o icone desenhado (falso defeito);
2. o icone generico tem assinatura: um unico `<circle>`. Um resolvido tem `path`
   ou `g`.

### OITAVA ocorrencia da crase

Escrevi crases dentro de um comentario HTML dentro de template literal, no
`_corpoCozinha`. Derrubou a compilacao (`tsc` acusou octal invalido). O detector
`check-backtick.mjs` pegou. Aspas retas em comentario, sempre.

### Arquivos alterados

| Arquivo | Alteracao |
|---------|-----------|
| `dashboard-src/src/components/rooms/bruno-room-subview.ts` | modelos de TV/Spotify/PC/climate/camera, hub com acordeao e corpo, anel do A/C, power e popovers, cameras por instantaneo, barra superior fiel |
| `scripts/harness/gen-subview-harness.mjs` | bundle lido do diretorio (hash muda a cada build); `window.conteudo()` e `window.inspecao()` |
| `config/configuration.yaml` | bundle -> `bruno-dashboard.BXcjd4_G.js` (ANTERIOR comentado) |
| `docs/12-migration-plan.md`, `docs/13-testing-and-validation.md` | registro acima |

### Rollback

1. `config/configuration.yaml`: voltar ao bundle ANTERIOR comentado na propria linha.
2. Rollback total da fase: em `config/dashboards/views/bento_shell.yaml`, comentar
   o bloco `FASE 5c` e descomentar o `ANTERIOR` — os seis arquivos originais
   seguem no disco e carregados.

### Atencao

A troca do `extra_module_url` no `configuration.yaml` EXIGE reinicio do Home
Assistant. Conferir o Corredor apos o reinicio (ver historico de correlacao).

### Correcao pos-feedback — Spotify e largura do A/C (2026-08-05, mesma sessao)

#### 1. Spotify desligado: eu inventei um botao "Tocar"

Nao existe botao de ligar nesse estado. Com o Spotify parado o comodo nao tem
para onde tocar; o que a origem oferece e a ESCOLHA DO DISPOSITIVO, que abre o
SpotifyPlus Card. Meu botao chamava `media_player.media_play`, que sem
dispositivo ativo devolve erro na tela.

Corrigido para o comportamento da origem:
- estado desligado: um botao **Dispositivos** que dispara `ll-custom` com
  `bruno_action: 'spotify'` + `bruno_spotify_config { entity, deviceDefaultId,
  mode: 'devices' }` — mesma carga do `_openSpotifyPlusPopup`;
- fileira "Mais": Dispositivos / Presets / Fila / Voltar (eu tinha posto
  aleatorio e repetir, que nao existem la);
- play com o Spotify parado usa `spotifyplus.player_transfer_playback` com
  `device_id`, `force_activate_device: true` — nao `media_player.media_play`.

#### 2. A/C mudando de largura — BUG NO GERADOR DE CSS

Sintoma: no Office, Q. Casal, Q. Marina e Q. Miguel o cartao do A/C mudava de
largura ao ligar/desligar.

Causa raiz (medida na resolucao real do tablet, 1920x1200, tema Josh): o cartao
saia **49px mais estreito** que o original e alinhado a direita, porque recebia
`grid-column: ac` — uma coluna nomeada que nao existe. A coluna direita virava
`49px 472px` em vez de uma unica faixa de 521px.

De onde veio: o arquivo original define `.ac-card { grid-area: ac }` cedo (bloco
de layout legado) e a CANCELA depois com
`.hero-panel, …, .ac-card, .curtain-card { grid-area: auto }`. Mais adiante volta
a definir `.ac-card` com outras propriedades. O gerador funde todas as
declaracoes de um seletor e emite a regra na ULTIMA aparicao — entao o
`grid-area: ac` viajava junto e passava a vencer o `auto`, invertendo a cascata
original.

Correcao no `scripts/validation/gen-subview-css.mjs`: nova funcao
`anuladaDepois()`. Antes de fundir, cada declaracao e descartada se existir,
DEPOIS dela e no mesmo contexto de media, uma regra de seletor diferente que
declara a mesma propriedade e que inclui este seletor na sua lista separada por
virgula. Ou seja: o que a cascata original ja tinha matado nao ressuscita.

Efeito: 20 declaracoes mortas sairam do CSS gerado (`.ac-card`, `.hero-panel`,
`.cameras-card`, `.lights-groups` e blocos legados de spotify/ps5/tv).
Cobertura segue em 0 regras nao cobertas nos seis comodos.

#### 3. O medidor rodava fora do tema e fora da resolucao do tablet

O banco de medicao subia com o tema `liquid-glass` e viewport 1280x720. O tablet
usa **Josh** e **1920x1200** — e o defeito do A/C so aparece la. Medicao refeita
nas duas resolucoes, com o tema Josh aplicado antes:

- 1920x1200 · Josh: **461 campos, 3 divergencias**
- 1280x720 · Josh: **461 campos, 3 divergencias**

As 3 sao sempre o mesmo desvio deliberado ("TV da sala" -> "TV" fora da Sala).

REGRA: medir com o tema do tablet aplicado e na resolucao do tablet. Geometria
identica em 1280x720 nao prova nada sobre 1920x1200 — foi exatamente o que
deixou o A/C passar.

---

## Registro de Implementacao — Fases 5c (fechamento), 5d e 5e (2026-08-06)

### Fase 5e — refinamento funcional

| # | entrega | arquivo |
|---|---------|---------|
| 5e.0 | Contratos minimos de dispositivo: `DeviceControlDefinition`, `DeviceInstanceConfig`, registry, criacao por configuracao. 16 testes | `dashboard-src/src/application/device-registry.ts` |
| 5e.1 | Power na rail das subviews (identico ao da Home) | `views/shell/rail_rooms.yaml` |
| 5e.2 | Faixa de acoes rapidas removida da Home | `v2/bento_bottom_block.yaml` |
| 5e.3 | Cena "Apagar todas as luzes" + gate de dependencia | `packages/bruno_scenes.yaml`, `config/scenes.config.ts` |
| 5e.4 | Wi-Fi absorvido pelo botao Rede, em cadeia (QR -> painel avancado) | `core/bruno-shell.js` |
| 5e.5 | "Atualizar" migrado para o menu Configuracoes | `core/bruno-shell.js` |
| 5e.6 | Popup **Dispositivos** substitui o popup Sistema | `components/devices/` |

**O popup Dispositivos nao sabe o que e uma TV.** A lista sai de
`config/devices.config.ts` e cada controle vem do registry. Acrescentar um
aparelho = acrescentar uma entrada; acrescentar um TIPO = registrar um controle
em `controls.ts`. Nos dois casos o popup nao muda.

**A cena segue o padrao ja anotado**: script `bruno_scene_*` em
`packages/bruno_scenes.yaml`, nao entidade `scene.` — o painel de Cenas lista
scripts. Criada com autorizacao expressa do usuario (a Regra de Trabalho n. 3
proibe mexer em packages sem ela).

### Fase 5d — fechamento

| # | entrega |
|---|---------|
| 5d.1 | Validacao visual no tablet — **aprovada pelo usuario** |
| 5d.2 | Proporcao das colunas — **encerrada sem mudanca**: jogar o respiro para a direita desequilibraria a margem esquerda |
| 5d.3 | 6 modulos de subview retirados do carregamento (1,8 MB) + views legadas retiradas |
| 5d.4 | Espacamento da rail e botao Apps da TV — aprovados como estao |
| 5d.5 | Cena criada (ver 5e.3) |
| 5d.6 | Commit consolidado, baseline congelada |

#### O erro que quase virou regressao no 5d.3

Eu havia afirmado que "nenhum dos 15 modulos e usado pelo caminho vivo". Estava
ERRADO: conferi `extra_module_url` e nao os consumidores em YAML.

- os **8 cards de comodo** sao usados pelo layout do TELEFONE
  (`bento_comodos_phone` -> `bento_comodos_matriz` -> `main-grid/bento_*.yaml`);
- as **6 subviews antigas** tinham views proprias registradas em
  `ui-lovelace-main.yaml`, alcancaveis por URL direta.

Escopo corrigido: os 8 cards **permanecem carregados**; as 6 subviews sairam,
junto com as views que as usavam. Sao os 1,8 MB.

**Licao:** retirar do carregamento exige checar quem CONSOME, nao so quem
DECLARA. `grep -rn "custom:<tag>" config/dashboards/` antes de comentar a linha.

### Correcoes visuais da mesma data

| # | correcao | causa |
|---|----------|-------|
| 1 | Faixa de status da Home alinhada com as subviews | a linha-fantasma de 0px no topo do grid criava um `grid-gap` acima da faixa. **Removida** (rev.6): as areas que ela sustentava pertencem a cards com `show.mediaquery`, que no desktop nao renderizam |
| 2 | Badges da Home passaram a flat | a pilula era o degrau que sobrava depois do alinhamento |
| 3 | Banda inferior sem vazio | o dock de 54px saiu; banda `calc(23vh + 52px)` -> `calc(23vh - 12px)`, hero -> `calc(77vh - 80px)` |
| 4 | Scrim dos popups reforcado | `0.08`/`blur(2px)` -> `0.42`/`blur(14px)`. O tema Josh deixa o painel translucido; o cenario competia com o texto |
| 5 | Respiro da rail | `content-slot` `padding-left` 12 -> 6 -> 2px |

#### Tentativa frustrada, documentada para nao repetir

`margin-top: -10px` no `:host` do card de badges **nao funciona na Home**: o
`layout-card` envolve cada card num wrapper, e o item do grid e o WRAPPER. A
margem movia o card DENTRO do wrapper. No banco de medicao o card era anexado
direto ao slot, sem wrapper — por isso a medicao dizia que funcionava e a tela
dizia que nao. Custou tres rodadas.

**Regra nova:** quando o alvo esta dentro de um container de layout do Lovelace,
medir o componente isolado responde sobre o componente, nao sobre o layout.

### Estado

Bundle `bruno-dashboard.Duzbu9AO.js`. Proxima fase: **6.0 — baseline de runtime
e carregador estavel**.
