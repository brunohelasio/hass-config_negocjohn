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

## Analise de Funcionalidades negocjohn — Plano de Implementacao (2026-03-27)

Analise profunda do repositorio original (github.com/ngocjohn/hass-config) para implementar
funcionalidades avancadas no dashboard. A implementacao foi planejada mas NAO iniciada.

### 1. Efeito Vidro Fosco Escuro (Backdrop) para TODOS os Popups

**Situacao atual:**
- O popup da sala (`livingroom.yaml`) ja tem `backdrop-filter: blur(5px)` e background `rgba(8, 12, 20, 0.62)`
- O tema `graphite-auto.yaml` define via `uix-dialog` (anchor `&popup_card_mod`):
  - `--ha-dialog-surface-background: rgba(22, 24, 29, 0.7)`
  - `--mdc-dialog-scrim-color: rgba(0, 0, 0, 0.32)` (overlay escuro atras)
  - `dialog-backdrop-filter: blur(12px)` (variavel no topo do tema)
- Popups internos (light double-tap, more-info) usam `--popup-background-color: rgba(0, 0, 0, 0)` (transparente) — sem efeito de vidro fosco

**O que fazer:**
- a) Padronizar o `backdrop-filter` para `blur(12px)` em TODOS os popups (consistente com o tema)
- b) Aplicar `--mdc-dialog-scrim-color: rgba(0, 0, 0, 0.55)` para escurecer o fundo atras do popup
- c) Manter o glow azul suave no fundo: `--ha-dialog-surface-background: rgba(15, 20, 35, 0.75)` com `box-shadow: 0 0 24px rgba(62, 132, 255, 0.22)`
- d) Aplicar a mesma estilizacao nos popups internos de luz (`light` template, `tpl_popup_device`), via `card-mod-more-info-yaml` no tema ou inline nas chamadas browser_mod
- e) Considerar adicionar `card-mod-more-info-yaml` e `card-mod-dialog-yaml` no `graphite-auto.yaml` para afetar TODOS os dialogs sem modificar cada popup individualmente

**Arquivos afetados:**
- `config/themes/graphite-auto.yaml` — adicionar `card-mod-more-info-yaml` global
- `config/dashboards/shared/popup/rooms/livingroom.yaml` — ajustar backdrop
- `config/dashboards/templates/button_card_templates/tpl_sectors.yaml` — light template style (linhas 569-572)
- `config/dashboards/shared/snippets/style_popup_transparent.yaml` — snippet padrao

**Referencia tema original (graphite-auto.yaml):**
- Linhas 769-802: `uix-dialog: &popup_card_mod` — define estilos globais para ha-dialog
- Linha 782: `--ha-dialog-surface-background: rgba(22, 24, 29, 0.7)`
- Linha 784: `--mdc-dialog-scrim-color: var(--dialog-scrim-color, rgba(0, 0, 0, 0.32))`
- Linhas 792-800: Estilos especificos para `ha-dialog.type-browser-mod-popup`

---

### 2. Reduzir Tamanho dos Botoes e Espacamento do Popup da Sala

**Situacao atual (conforme screenshot):**
- Popup usa `--popup-width: 65vw` (max 920px)
- Botoes no popup herdam `button-card-font-size: 0.9vw` (mesmo que o painel principal)
- Grid usa `columns: 4` com gap implicito de `1.3%` (do tpl_base.yaml)
- Content padding: `0.5em 0.8em 0.8em 0.7em`
- Os botoes do popup aparecem maiores porque o popup ocupa mais espaco relativo

**O que fazer:**
- a) Reduzir `--popup-width` de `65vw` para ~`58vw` ou `55vw` (manter max-width ~850px)
- b) Considerar adicionar `card_mod` inline no popup para diminuir `--button-card-font-size` dentro do contexto popup (ex: `0.75vw`)
- c) Reduzir o gap entre botoes via `gap` no grid
- d) Ajustar o `--tablet-popup-content-padding` para reduzir margens internas
- e) Opcional: considerar `square: true` no grid para manter aspecto quadrado mas menor

**Arquivos afetados:**
- `config/dashboards/shared/popup/rooms/livingroom.yaml` — ajustar popup width e padding
- `config/dashboards/shared/columns/room_living_all_buttons.yaml` — ajustar gaps nos grids

**Dimensoes atuais do popup da sala:**
- Popup width: 65vw, max-width: 920px (livingroom.yaml linhas 54-55)
- Popup max-height: 88vh (livingroom.yaml linha 81)
- Content padding: 0.5em 0.8em 0.8em 0.7em (linha 59)
- Grid gap interno: 1.3% (tpl_base.yaml linha 53)
- Todas as 4 linhas de botoes usam `columns: 4` (room_living_all_buttons.yaml)

---

### 3. Icones de Status (Picons) no Botao Principal da Sala

**Templates ja prontos em `tpl_sectors.yaml` (disponiveis para uso):**

| Template | Icone | Variavel necessaria | O que mostra |
|----------|-------|---------------------|-------------|
| `motion` (L.148-170) | `mdi:motion-sensor` | `variables.motion` (binary_sensor) | Presenca/movimento detectado |
| `babycam` (L.171-193) | `custom:arlo-cam` | `variables.babycam` (switch) | Camera ligada |
| `server` (L.194-226) | `mdi:server-network` | `variables.server` (binary_sensor) | Servidor ativo/idle/sleeping |
| `macbook` (L.247-272) | `cil:laptop-mac` | `variables.macbook` (switch) | MacBook conectado |
| `door_state` (L.273-301) | `mdi:door` | `variables.door` (binary_sensor) | Porta aberta/fechada |
| `fan_circle` (L.417-454) | `custom:smoke-detector` | `variables.fan_circle` (fan entity) | Ventilador/exaustor ligado |
| `air_diffuser_circle` (L.227-246) | `fas:spray-can-sparkles` | `variables.air_diffuser_circle` (switch) | Difusor de aroma ativo |

**Posicionamento padrao dos icones (tpl_sectors.yaml):**
- Todos usam `position: absolute` no canto superior direito (`right: 1%`)
- Empilham verticalmente: primeiro icone em `top: 0`, segundo desce para `top: 30%` quando motion ativo
- Largura: `width: 15%`, padding: `5%`, margin: `-10%`, border-radius: `50%`
- Cor ativa: `var(--state-icon-active-color)` (azul)
- Transicao suave: `transition: top 250ms ease-out`

**Situacao atual do botao da sala (tpl_grid_mainrooms.yaml L.42-80):**
- Templates: `rooms_base` + `icon_couch_lamp` — SEM icones de status
- Variables: `light_entity: light.sala_switch_2`, `active: ''` (vazio)

**O que implementar para a Sala:**
- a) Adicionar template `motion` com variavel apontando para sensor de presenca da sala
- b) Criar novo custom_field para status de midia (TV/Spotify playing) — similar ao padrao motion
- c) Criar novo custom_field para status de climatizacao (AC cooling/heating)
- d) Criar icone de contagem de luzes ativas — usar sensor `active` com `attributes.lights_on`
- e) Os icones ficam no canto superior direito do botao, empilhados verticalmente

**Esquema visual:**
```
+------------------+
|            [luz] |  <- motion/presenca (top: 0, right: 1%)
|            [tv]  |  <- media (top: 30% quando motion on)
|                  |
|   Sala           |
|   2 lights       |
+------------------+
```

**Arquivos afetados:**
- `config/dashboards/templates/streamline_templates/tpl_grid_mainrooms.yaml` — adicionar templates de status
- `config/dashboards/templates/button_card_templates/tpl_sectors.yaml` — possivelmente criar novos custom_fields
- **Pre-requisito**: identificar entity_ids reais de presenca, midia e clima da sala

---

### 4. Botao Vermelho para Unavailable + Estados Especiais

**O que ja existe no repositorio:**

**a) Vermelho para unavailable (tpl_base.yaml):**
- Linha 25-26: `state_error` detecta `['error', 'unavailable']`
- Linha 85-101: Aplica `rgba(139, 51, 51, 0.9)` (vermelho escuro) como background
- Funciona para QUALQUER botao que herda de `base` — ja ativo automaticamente

**b) Estados especiais de comodos (rooms_base em tpl_sectors.yaml L.62-147):**
- `state_on` reconhece: `['yes', 'occupied', 'cleaning', 'washing', 'cooking', 'dishwashing', 'on']`
- `state_display` mostra textos especiais:
  - `'occupied'` → exibe "occupied"
  - `'washing'` → exibe `entity.attributes.washdryer_remain` (tempo restante)
  - Luzes on → exibe "1 light", "3 lights" etc. (via `active.attributes.lights_on`)
- Background especial para washing: `linear-gradient(to top, rgba(250,250,250,0.75) 0%, rgba(10,14,34,0.8) 100%)`

**c) Server com 3 estados visuais (server template L.194-226):**
- On: azul `var(--state-icon-active-color)`
- Idle: cinza (icone sem cor)
- Sleeping: vermelho `#fa0000`

**O que implementar:**
- a) Verificar se botoes do popup (tpl_popup_light, tpl_popup_base) herdam de `base` → SIM, herdam. Vermelho para unavailable ja deve funcionar. Testar visualmente.
- b) Para entidades inoperantes no popup da sala (PS5, Pioneer sem configurar), confirmar que o vermelho aparece
- c) Para Office em reuniao: definir `state_on` customizado que inclua estado de reuniao. Usar `state_display` para mostrar "Em reuniao" ou "Meeting". Alterar cor do background
- d) Possivel implementacao: `input_boolean` ou sensor template que detecta reuniao (calendario, microfone, app de videoconferencia)

**Arquivos afetados:**
- `config/dashboards/templates/streamline_templates/tpl_grid_mainrooms.yaml` — ajustar `state_on` no office
- `config/dashboards/shared/columns/room_living_all_buttons.yaml` — verificar heranca de templates nos botoes do popup

---

### 5. Contador de Tempo (Luz Acesa)

**O que ja existe no repositorio:**

**Template `circle_state` (tpl_sectors.yaml L.1098-1132):**
```
- Usa `triggers_update: sensor.time` para atualizar a cada minuto
- Calcula: Date.now() - Date.parse(entity.last_changed)
- Formata em: s (segundos), m (minutos), h (horas), d (dias)
- Renderiza dentro de SVG circle no campo custom_fields.circle
- Suporta `variables.retain` para persistir tempo (evita reset no reload do HA)
```

**Funcao de formatacao de tempo (usada em circle_state, camera, battery_circle):**
```javascript
let time = c => {
    let s = (c/1e3), m = (c/6e4), h = (c/36e5), d = (c/864e5);
    return s < 60 ? parseInt(s) + 's'
         : m < 60 ? parseInt(m) + 'm'
         : h < 24 ? parseInt(h) + 'h'
         : parseInt(d) + 'd';
};
```

**O que implementar:**
- a) No botao principal da sala: quando luz ON, mostrar tempo ligado no SVG circle (substituir ou complementar %)
- b) Nos botoes de luz do popup: adicionar `circle_state` para cada botao, mostrando ha quanto tempo a luz esta acesa
- c) Opcao simples: usar `state_display` para mostrar tempo em texto, sem SVG circle
- d) Requer `sensor.time` como triggers_update para atualizacao periodica
- e) Considerar `variables.retain` com `input_datetime` para persistir tempo apos restart do HA

**Arquivos afetados:**
- `config/dashboards/templates/streamline_templates/tpl_grid_mainrooms.yaml` — adicionar circle_state ou triggers_update
- `config/dashboards/shared/columns/room_living_all_buttons.yaml` — adicionar timer nos botoes do popup
- `config/dashboards/templates/button_card_templates/tpl_sectors.yaml` — possivel novo template `tpl_popup_light_timer`

---

### 6. Funcionalidades Adicionais do negocjohn (Alem das Citadas)

| # | Funcionalidade | Template (tpl_sectors.yaml) | Descricao |
|---|---------------|----------------------------|-----------|
| A | Animacao de ventilador | `icon_fanrotate` (L.302-378) | SVG animado com 3 estados: start (acelerando), on (constante), end (desacelerando). Usa CSS @keyframes rotate |
| B | Progresso de eletrodomestico | `appliance_circle` (L.379-416) | Circle SVG mostrando % progresso. Cores: amarelo (0-20%), azul (20-40%), verde (40-100%) |
| C | Badge de pessoa | `person` (L.819-860) | Avatar circular com grayscale quando `not_home`, colorido quando `home`. Suporta traducoes |
| D | Status de servidor | `server` (L.194-226) | 3 estados visuais: on (azul), idle (cinza), sleeping (vermelho #fa0000) |
| E | Timer de camera | `camera` (L.1071-1097) | Mostra ha quanto tempo a camera detectou ultimo evento |
| F | Gradiente para eletrodomesticos | `rooms_base` | Background com `linear-gradient` quando lavando |
| G | Bounce animation | `card_bounce` (tpl_tap_action.yaml) | Animacao de bounce responsiva no tap (menor no phone, maior no tablet) |
| H | Slider circular | `circle` (tpl_base.yaml) | SVG circle interativo com drag para ajustar brilho |
| I | Contagem de luzes | `rooms_base` (L.83-122) | state_display mostra "1 light", "3 lights" baseado em `active.attributes.lights_on` |
| J | Change grid title | `change_grid_title` (L.1236-1307) | Altera dinamicamente o titulo da secao do grid baseado em estado |
| K | Battery circle | `battery_circle` (L.1134-1235) | SVG circle mostrando % bateria com cores e icones dinamicos |
| L | Door state badge | `door_state` (L.273-301) | Badge no botao que mostra porta aberta/fechada, com background condicional |

---

### Ordem de Implementacao Sugerida

| Fase | Item | Prioridade | Complexidade | Dependencias |
|------|------|-----------|-------------|-------------|
| 1 | Backdrop/vidro fosco para todos os popups | Alta | Media | Nenhuma |
| 2 | Reduzir tamanho do popup da sala | Alta | Baixa | Nenhuma |
| 3 | Icones de status no botao da sala | Alta | Alta | Identificar entidades |
| 4 | Botao vermelho + estados especiais | Media | Media | Item 3 |
| 5 | Contador de tempo (luzes) | Media | Media | Nenhuma |
| 6 | Contagem de luzes ("3 lights") | Baixa | Baixa | Sensor active necessario |
| 7 | Funcionalidades extras (A-L acima) | Baixa | Variada | Conforme necessidade |

---

### Pre-requisitos / Informacoes Necessarias Antes de Implementar

1. **Entidades de presenca da sala**: Existe algum `binary_sensor.motion_sala` ou similar? Precisamos do entity_id exato
2. **Entidade de climatizacao**: Qual o entity_id do AC da sala? (ex: `climate.sala_ac`)
3. **Sensor de reuniao do Office**: Como detectar reuniao? Calendario, app, sensor?
4. **Sensor "active" da sala**: O `sensor.living_room_active` existe no HA? (esta comentado no codigo). Se nao, criar template sensor
5. **Sensor de retain/persistencia**: Para o timer nao resetar, precisa de `input_datetime` ou `input_text` helper no HA

---

### Prompt Sugerido para Retomada dos Trabalhos

```
Vamos retomar a implementacao das funcionalidades negocjohn no dashboard.
Consulte o CLAUDE.md secao "Analise de Funcionalidades negocjohn" para o plano completo.

Antes de comecar o codigo, preciso confirmar as entidades do meu HA:
- Presenca da sala: [informar entity_id do sensor de presenca/motion da sala]
- AC da sala: [informar entity_id do climate da sala]
- Sensor de reuniao: [informar como detectar reuniao no office, se aplicavel]

Vamos comecar pela Fase 1 (backdrop/vidro fosco) e Fase 2 (reduzir popup).
Essas duas nao dependem de entidades especificas.

Depois passamos para a Fase 3 (icones de status) com as entidades confirmadas acima.

Lembre-se: NUNCA excluir codigo, sempre comentar (Regra de Ouro do CLAUDE.md).
```
