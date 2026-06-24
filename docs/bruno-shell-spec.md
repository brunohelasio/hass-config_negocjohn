# Especificação de Implementação — Bruno Shell (barra fixa + conteúdo que troca)

> Documento de handoff autossuficiente. Pode ser entregue a **qualquer IA** com
> acesso a este repositório para executar a implementação. Escrito em PT-BR.
> Última atualização: 2026-06-24. Branch de trabalho: `claude/hopeful-lovelace-cuc93o` (PR #552).

---

## 0. TL;DR (o que é e por que)

Transformar o dashboard num **app-shell em JavaScript**: uma **barra lateral fixa**
(rail) que **nunca re-monta**, e uma **região de conteúdo** à direita que **troca de
seção no lugar** (Home, Câmeras, Roborock, Música, Planta 3D, popups…). Hoje cada
destino é uma *view* separada do Home Assistant; trocar de view **re-monta a view
inteira** (rail incluída), o que causa "degrau"/flash e quebra a sensação de barra
fixa. A solução é ter **uma única view** que hospeda a shell; só o miolo troca.

**Resultado perseguido:** aperta o botão Câmeras → Home sai da seleção, Câmeras
acende, o conteúdo aparece à direita — **a barra permanece imóvel**. Mesma
tipografia, mesmos cantos, mesma transparência e mesma rail do painel principal.
Fundação para, no futuro, **reposicionar/redimensionar blocos** (grid controlado por JS).

---

## 1. Contexto do repositório (fatos que a IA precisa saber)

- **Home Assistant**, dashboards em **modo YAML**.
- Slug/URL do dashboard principal: **`ngocjohn-main`** (NÃO é `lovelace`).
  Definido em `config/configuration.yaml` (`lovelace: dashboards: ngocjohn-main:`),
  arquivo `config/dashboards/ui-lovelace-main.yaml`. URLs ficam em `/ngocjohn-main/<path>`.
- **`kiosk_mode: kiosk: true`** está ativo (esconde header/sidebar nativos do HA).
- **Tema:** `tablet` (em `config/themes/tablet.yaml`). Hardware-alvo: tablets
  landscape ~1920–2000 × 1200.
- **Tudo é JavaScript custom element.** Cards de cômodo e subviews estão em
  `config/www/bruno-ui/`. Eles têm **status semânticos, ações de clique, chevrons,
  mediaqueries próprios**. **NÃO podem ser alterados** (ver Seção 4).
- **Design system:** `config/www/bruno-ui/core/bruno-liquid-glass.js` injeta tokens
  CSS no `:root` (`--bruno-liquid-*`: cores, raios, superfícies glass, estados). Os
  tokens **atravessam shadow DOM** — qualquer custom element os consome via
  `var(--bruno-liquid-...)`. **Consumir, nunca editar.**

### 1.1 Painel principal hoje
- View: `config/dashboards/views/bento_main.yaml`, `path: bento-lab`,
  `type: custom:grid-layout`, `theme: tablet`.
- `card_mod` da view aplica o **fundo grafite**:
  `linear-gradient(140deg, #07090d 0%, #111722 55%, #07090d 100%)`.
- `layout:` (resumo): `padding: 12px`, `grid-gap: 10px`,
  - `grid-template-columns: 64px repeat(3, minmax(0,1.15fr)) repeat(4, minmax(0,1fr)) repeat(2, minmax(0,0.84fr)) repeat(3, minmax(0,1.22fr))`
  - `grid-template-rows: auto 40vh 16vh 24vh 74px`
  - `grid-template-areas` (5 linhas) posicionam: `sidebar`, `top_badges`, `welcome`,
    `sala`, `comodos`, `energy`, `roborock`, `media`, `quick_actions`.
  - Há `mediaquery (max-width: 800px)` que empilha tudo em 1 coluna (mobile).
- `cards:` (includes): `main-grid/zz-mobile-redirect.yaml`, `main-grid/bento_hero_stage.yaml`,
  `main-grid/bento_sidebar.yaml`, `main-grid/bento_top_badges.yaml`,
  `main-grid/bento_welcome.yaml`, `main-grid/bento_sala.yaml`, `main-grid/bento_comodos.yaml`,
  `main-grid/bento_energy.yaml`, `main-grid/bento_roborock.yaml`,
  `main-grid/bento_quick_actions.yaml`, `main-grid/bento_media.yaml`.

### 1.2 A rail (barra fixa) hoje
- Custom element **`bento-sidebar-liquid-card`**, arquivo `config/www/bento-sidebar-card.js`.
- Config por YAML: `config/dashboards/views/main-grid/bento_sidebar.yaml`.
  - `top_items`: home (`selected: true`, `action: none`), music (navigate `mass-media`),
    cameras (navigate `cameras-security`, `divider_after`), system/vacuum/network/updates/floorplan
    (popups via `tap_action: !include ../../shared/popup/footer/*.yaml` e `planta_3d.yaml`),
    refresh (call-service `browser_mod.javascript` → `location.reload()`).
  - `bottom_items`: power (navigate `/`).
- Estado ativo: classe `.nav-button.selected`, usando tokens
  `--bruno-liquid-selected-blue-*` (AZUL = seleção) + animação `selected-breathe`.
- Ícone `cameras` já existe no set SVG interno (`BentoSidebarCard` … `cameras:`).
- Ações suportadas em `_handleAction`: `navigate`, `url`, `call-service`,
  `more-info`, `fire-dom-event`.
- `_navigate(path)` (já corrigido nesta saga): dispara `hass-navigate` **e** faz
  `history.pushState` + evento `location-changed` (o roteador do HA reconhece este
  último). `_resolveNavigationPath` resolve paths relativos contra o dashboard atual
  (fallback `ngocjohn-main`).

### 1.3 A subview de Câmeras hoje (já redesenhada e aprovada visualmente)
- Custom element **`bruno-cameras-security-subview`**, arquivo
  `config/www/bruno-ui/subviews/bruno-cameras-security-subview.js`.
- Já implementado e aprovado: header transparente "Residência · Segurança"
  (seta à esquerda, relógio à direita), **hero** sem rodapé preto (nome/status
  sobre o vídeo, vinheta discreta, controles Detalhes/Atualizar flutuantes),
  **secundárias** com pílula compacta, **rodapé transparente** com a frase de
  criptografia, **grade 4×4** (hero 3×3 + 3 laterais + 4 inferiores, todas do
  mesmo tamanho), **anti-flicker** (re-render só quando a assinatura estrutural
  muda; imagens via preload-swap em `_refreshCameraImages`), **disciplina de cor**
  (azul=interação, verde=online, vermelho=gravação/alerta).
- Hoje é hospedada por `config/dashboards/subviews/cameras-security.yaml` (que
  virou um `custom:grid-layout` "Opção A" com uma cópia da rail
  `views/main-grid/bento_sidebar_cameras.yaml`). **Essa Opção A será substituída
  pela shell** (ver Seção 6, Etapa 7).

### 1.4 Registro de recursos JS e cache-busting (REGRA OPERACIONAL CRÍTICA)
- Todo JS custom precisa estar em **`frontend.extra_module_url`** no
  `config/configuration.yaml` **E** (por consistência) em `resources:` no
  `config/dashboards/ui-lovelace-main.yaml`. **Lição aprendida:** se faltar no
  `extra_module_url`, o elemento pode não ser definido e os cards mostram
  "Erro de configuração".
- **Sempre** versionar com `?v=AAAAMMDD-descricao-N`. Ao mudar um JS, **bumpar o
  `?v=`** nos dois lugares.
- Após mudar `configuration.yaml`: **reiniciar o Home Assistant**.
- **Tablet:** o WebView (Fully Kiosk / Companion App) cacheia agressivamente —
  após mudanças, **limpar o cache do app** + hard reload. "Abre no PC e não no
  tablet" = quase sempre cache do tablet (config válida, pois o PC abre).

---

## 2. Objetivo final (a perseguir)

Um **app-shell em JS** (`bruno-shell`) que:
1. Renderiza **a moldura**: rail fixa à esquerda (64px) + região de conteúdo à direita,
   sobre o fundo grafite, ocupando 100% da altura.
2. Mantém a **rail montada uma única vez** (nunca re-monta) — barra fixa de verdade.
3. **Troca de seção no lugar** por estado (hash, ex.: `#home`, `#cameras`), montando
   e desmontando apenas o conteúdo da seção ativa.
4. **Reusa os cards/subviews existentes SEM editá-los** — a shell apenas os
   **instancia e posiciona** (via `window.loadCardHelpers().createCardElement`,
   propagando `hass`).
5. Serve de **fundação** para, no futuro, a região de conteúdo virar um grid JS
   com **reposicionamento/redimensionamento** de blocos persistidos.

Sensação final: extensão natural do painel — mesma rail, mesma tipografia, mesmos
cantos, mesma transparência; só o miolo muda.

---

## 3. Arquitetura técnica

```
View única (type: panel, kiosk)  ──►  card único: <bruno-shell>
                                          │
        ┌─────────────────────────────────┴───────────────────────────────┐
        │  bruno-shell (custom element)                                     │
        │  fundo grafite + grid: [ rail 64px | conteúdo 1fr ]               │
        │                                                                   │
        │  ┌── rail (esq.) ──┐   ┌──────── região de conteúdo (dir.) ─────┐ │
        │  │ bento-sidebar-  │   │  seção ATIVA (montada via helpers):     │ │
        │  │ liquid-card     │   │   #home   → custom:grid-layout (mosaico)│ │
        │  │ (1 instância,   │   │   #cameras→ bruno-cameras-security-...  │ │
        │  │  nunca remonta) │   │   #roborock, #music, … (futuro)         │ │
        │  └─────────────────┘   └─────────────────────────────────────────┘ │
        └───────────────────────────────────────────────────────────────────┘
```

- **Por que `type: panel` + 1 card:** o HA re-monta a *view* a cada navegação. Com
  uma view única cujo conteúdo é a shell, **a view nunca muda** → a rail (dentro da
  shell) nunca re-monta. A troca de seção é interna à shell (sem navegar de view).
- **Roteamento por hash:** itens de seção da rail navegam para `#<secao>`
  (ex.: `#cameras`). Mudar o hash **não troca a view** (não re-monta). A shell
  escuta `hashchange`/`location-changed`, lê o hash e troca a seção. Botão "voltar"
  do navegador anda no histórico de hash.
- **Seleção da rail = derivada do hash.** O item ativo acende conforme a seção
  corrente (sem depender de `selected` fixo no YAML).
- **Instanciar cards reusando o motor do HA:**
  ```js
  const helpers = await window.loadCardHelpers();
  const el = helpers.createCardElement(sectionConfig); // sectionConfig = YAML do card
  el.hass = this._hass;                                 // propagar hass sempre que mudar
  contentRegion.replaceChildren(el);
  ```
  Assim **a seção `home` reusa o mesmo `custom:grid-layout` de hoje** (mosaico
  idêntico) e a seção `cameras` reusa o console — **sem reescrever posições à mão**
  nesta primeira rodada (mitiga o risco; ver Seção 5).

### 3.1 Seção `home` — transcrição do mosaico (1 nível abaixo)
A `home` é um card `custom:grid-layout` com o **mesmo** layout de hoje, **removendo a
coluna `sidebar`** (a rail agora está na moldura da shell). Transcrição exata:

```yaml
type: custom:grid-layout
layout:
  margin: 0
  padding: 0            # a shell controla o respiro externo
  grid-gap: 10px
  grid-template-columns: repeat(3, minmax(0,1.15fr)) repeat(4, minmax(0,1fr)) repeat(2, minmax(0,0.84fr)) repeat(3, minmax(0,1.22fr))
  grid-template-rows: auto 40vh 16vh 24vh 74px
  grid-template-areas: |
    "top_badges top_badges top_badges top_badges top_badges top_badges top_badges top_badges top_badges top_badges top_badges top_badges"
    "welcome welcome welcome welcome welcome sala sala comodos comodos comodos comodos comodos"
    "welcome welcome welcome welcome welcome energy energy energy energy media media media"
    "welcome welcome welcome welcome welcome roborock roborock roborock roborock media media media"
    "quick_actions quick_actions quick_actions quick_actions quick_actions quick_actions quick_actions quick_actions quick_actions quick_actions quick_actions quick_actions"
cards:
  - !include main-grid/bento_top_badges.yaml
  - !include main-grid/bento_welcome.yaml
  - !include main-grid/bento_sala.yaml
  - !include main-grid/bento_comodos.yaml
  - !include main-grid/bento_energy.yaml
  - !include main-grid/bento_roborock.yaml
  - !include main-grid/bento_quick_actions.yaml
  - !include main-grid/bento_media.yaml
  # hero_stage (fundo) é opcional aqui: o grafite já vem da shell; manter se desejar a foto.
```
> Conferir contagem: 12 colunas (3+4+2+3) e **12 tokens por linha** de área. Cada
> linha do `grid-template-areas` original perdeu apenas o 1º token (`sidebar`).
> `zz-mobile-redirect` continua tratando mobile fora da shell (ver Seção 4).

### 3.2 Seção `cameras`
- Config: `{ type: 'custom:bruno-cameras-security-subview' }` (console já pronto).
- Ajuste pequeno permitido (arquivo é nosso): quando hospedado na shell, o root do
  console deve **preencher a região de conteúdo** (`height: 100%`), em vez do
  `calc(100vh - 24px)` que ele usa hoje na Opção A. Manter o original comentado
  (Regra de Ouro).
- O console **não** desenha rail (a rail é da shell). O header transparente
  (Residência · Segurança) e o rodapé (criptografia) são da seção — ok manter.

### 3.3 Rail na shell
- Reusar **a mesma `bento-sidebar-liquid-card`** (preserva popups/serviços).
- Config da rail na shell:
  - itens de **seção** (`home`, `cameras`, e futuros): `tap_action: navigate` para
    `#home`/`#cameras` **OU** uma ação custom que a shell intercepte. (Recomendado:
    a shell intercepta cliques cujo destino seja `#<secao>` conhecida e troca a
    seção; senão deixa o comportamento padrão.)
  - itens de **popup** (system/vacuum/network/updates/floorplan): **inalterados**
    (overlays; não navegam; a rail permanece).
  - `music`/`power`: por enquanto **inalterados** (navegam para fora até serem
    migrados em etapas — ver Seção 6).
- A shell atualiza o **estado ativo** da rail conforme o hash (item aceso correto).

---

## 4. O QUE NÃO PODE SER ALTERADO (intocável)

1. **Nenhum arquivo de card/subview de conteúdo existente** pode ter sua lógica
   editada: `config/www/bruno-ui/cards/bruno-*-card.js`,
   `config/www/bruno-ui/subviews/bruno-*-subview.js` (sala, office, cozinha,
   quartos), e os wrappers `config/dashboards/views/main-grid/bento_*.yaml`.
   Seus **status semânticos, ações de clique, chevrons, mediaqueries** devem
   permanecer 100% intactos. A shell **apenas os instancia/posiciona**.
2. **`bruno-liquid-glass.js`**: só consumir tokens; não editar.
3. **Comportamento atual da rail** (`bento-sidebar-card.js`): navigate/url/
   call-service/more-info/fire-dom-event e os popups via YAML **não podem
   regredir**. Alterações na rail devem ser **aditivas** (ex.: ler hash p/ seleção,
   interceptar seção) e reversíveis.
3.1. As **subviews de cômodo** (Sala/Office/Quartos) e sua **rail interna própria**
   (navegação entre cômodos) ficam **fora do escopo** desta shell por enquanto —
   não tocar.
4. **`bento_main.yaml`** permanece **intocado** (ou integralmente comentado) até
   validação lado a lado (ver Seção 5).
5. **Deep-link `/ngocjohn-main/cameras-security`** deve continuar funcionando
   (vira redirect para a shell na seção cameras).
6. **Redesign aprovado do console de câmeras** não pode ser desfeito.
7. **`zz-mobile-redirect`** e o fluxo mobile (views `views/mobile/*`) permanecem;
   a shell é para desktop/tablet. Mobile continua redirecionando como hoje.

---

## 5. RISCOS e MITIGAÇÃO (ler antes de codar)

| # | Risco | Severidade | Mitigação |
|---|-------|-----------|-----------|
| R1 | Reproduzir o mosaico da Home 1 nível abaixo (Seção 3.1) errado → Home desalinhada | **Principal** | **Reusar o `grid-layout` atual** (não recodificar posições à mão); transcrição mecânica (só remove a coluna `sidebar`); **validar no PC** antes de entregar |
| R2 | Altura da região de conteúdo não plumbada → seções com `vh` (Home) ou o console "encolhem"/sobem | Média | Região de conteúdo recebe **altura definida** (100% de 100vh menos paddings da shell); console com `height:100%` na shell |
| R3 | Mecanismo de troca de seção / leitura de hash com bug | Baixa (cosmético) | Falha não derruba a Home; testar `#home`/`#cameras`/voltar do navegador |
| R4 | `createCardElement` sem `hass` propagado → cards "vazios"/sem estado | Média | Propagar `this._hass` para o elemento da seção ativa a cada `set hass`; criar via `loadCardHelpers()` (async) com fallback |
| R5 | Cache do tablet / recurso não registrado | Operacional | Registrar `bruno-shell.js` em **extra_module_url + resources**, `?v=` bumpado; reiniciar HA; limpar cache do tablet |
| R6 | Popups da rail dependem de config YAML | Baixa | **Não migrar popups para JS**; a rail continua sendo o card com a config YAML atual (popups intactos) |

**Estratégia de isolamento (obrigatória):** implementar a shell como **arquivo(s)
novo(s) + view nova paralela** (ex.: `path: bento-shell`), com `bento_main`
**intocado**. Validar em `/ngocjohn-main/bento-shell` lado a lado com
`/ngocjohn-main/bento-lab`. **Só** trocar o ponto de entrada após aprovação
explícita do usuário.

---

## 6. PASSO A PASSO (sequência de execução)

### Pré-requisitos
- P0. Confirmar branch de trabalho; nunca commitar direto na default.
- P1. Ler: `bento_main.yaml`, `bento-sidebar-card.js`, `bento_sidebar.yaml`,
  `bruno-cameras-security-subview.js`, `bruno-liquid-glass.js`,
  `configuration.yaml` (extra_module_url) e `ui-lovelace-main.yaml`.

### Etapa 1 — Shell + Home + Câmeras (em paralelo, sem tocar no bento_main)
1. **Criar `config/www/bruno-shell.js`** — custom element `bruno-shell`:
   - `:host` ocupa 100% (a view panel dá 100vh); fundo grafite
     (`linear-gradient(140deg,#07090d,#111722,#07090d)`); `display:grid`
     `grid-template-columns: 64px minmax(0,1fr)`; `padding:12px`; `gap:10px`.
   - Coluna esq.: instancia **uma** `bento-sidebar-liquid-card` (config da rail da
     shell — Seção 3.3) e a mantém viva (nunca recriar).
   - Coluna dir.: **região de conteúdo**; método `_setSection(name)` que monta a
     config da seção via `loadCardHelpers().createCardElement` e faz
     `replaceChildren`. Desmontar a seção anterior (deixa o `disconnectedCallback`
     do card rodar — ex.: timers do console param).
   - `set hass(hass)`: guardar e **propagar** para a rail e para o elemento da
     seção ativa (`el.hass = hass`).
   - Roteamento: ler `location.hash` (default `#home`); ouvir `hashchange` e
     `location-changed`; ao mudar, `_setSection` + atualizar item ativo da rail.
   - Registro de seções (mapa nome→config). Etapa 1: `home` (Seção 3.1) e
     `cameras` (Seção 3.2).
   - Tratar erros de criação de card com um placeholder (não derrubar a shell).
2. **Registrar** `bruno-shell.js` em `configuration.yaml` (`extra_module_url`) e em
   `ui-lovelace-main.yaml` (`resources:`), com `?v=` novo.
3. **Criar view nova** `config/dashboards/views/bento_shell.yaml`:
   ```yaml
   title: Shell
   path: bento-shell
   subview: false
   theme: tablet
   type: panel
   cards:
     - type: custom:bruno-shell
   ```
   Incluí-la em `ui-lovelace-main.yaml` (`views:`) **sem remover** o `bento_main`.
4. **Config das seções:** definir o YAML do `home` (Seção 3.1) e do `cameras`
   (Seção 3.2). Pode ser embutido na config da shell (via `cards`/`sections`) ou
   em arquivos `!include` próprios (ex.: `views/shell/section_home.yaml`,
   `views/shell/section_cameras.yaml`). Reaproveitar os `!include` de
   `main-grid/bento_*.yaml`.
5. **Console na shell:** ajustar o root do `bruno-cameras-security-subview` para
   `height:100%` quando dentro da shell (Regra de Ouro: comentar o `calc` anterior).
6. **Validar no PC** em `/ngocjohn-main/bento-shell` (Seção 7). Entregar para o
   usuário revisar **sem** mexer no `bento_main`.

### Etapa 2 — Troca do ponto de entrada (somente após aprovação)
7. Repointar a entrada para a shell e tornar a Opção A obsoleta:
   - `cameras-security.yaml` vira **redirect** para `bento-shell#cameras`
     (manter conteúdo antigo comentado).
   - `bento_sidebar_cameras.yaml` (cópia) deixa de ser usado (comentar referência).
   - `bento_main.yaml`: comentar o original e apontar a Home para a shell
     (ou tornar `bento-shell` a landing). Regra de Ouro.
8. **Cache-bust** + reiniciar HA + limpar cache do tablet + validar no tablet.

### Etapa 3+ — Migração incremental dos demais botões (uma seção por vez)
9. Para cada botão, criar uma **nova seção** na shell e mudar a ação da rail para
   `#<secao>`:
   - **Roborock** → seção `#roborock` (reusar `bento_roborock` ou um card dedicado).
   - **Música (mass-media)** → seção `#music` (reusar a subview de música).
   - **Planta 3D** → seção `#floorplan` (quando implementada).
   - **Popups selecionáveis** → avaliar caso a caso; popups continuam overlays, mas
     os que tiverem **erro de config** são corrigidos ao migrar.
10. **Subviews de cômodo:** decisão futura — manter rail própria OU unificar na shell.

### Etapa 4 — Futuro (visão de longo prazo)
11. Evoluir a **região de conteúdo** para um **grid controlado por JS** com
    **reposicionar/redimensionar** blocos e **persistir** posições (ex.: em
    `localStorage` ou um helper do HA). Como a shell já é JS e dona do DOM, isso é
    uma evolução natural — sem refazer a fundação.

---

## 7. CHECKLIST DE VALIDAÇÃO (antes de entregar cada etapa)

- [ ] `node --check` em todo JS alterado/criado passa.
- [ ] YAML novo/alterado parseia (loader que ignore tags `!`).
- [ ] No PC, `/ngocjohn-main/bento-shell`:
  - [ ] Rail aparece **centralizada** e **idêntica** à da Home, e **não se move** ao
        alternar `#home`↔`#cameras` (sem degrau, sem flash da barra).
  - [ ] **Home** com o **mosaico idêntico** ao `bento-lab` atual (posições/tamanhos).
  - [ ] **Câmeras** com o console redesenhado intacto (hero, pílulas, rodapé, cores).
  - [ ] Item ativo da rail acende conforme a seção (azul de seleção).
  - [ ] **Popups** (Sistema/Aspirador/Rede/Updates/Planta) abrem normalmente.
  - [ ] **Status/chevrons/ações** dos cards de cômodo funcionam como antes.
  - [ ] Voltar do navegador alterna seções via hash.
- [ ] `bento_main` original **intocado** (Etapa 1) ou comentado (Etapa 2).
- [ ] Recurso registrado em extra_module_url + resources, `?v=` bumpado.
- [ ] Tablet: após reiniciar HA + limpar cache, abre sem "Erro de configuração".

---

## 8. REGRA DE OURO (obrigatória em todo o projeto)

> Definida em `CLAUDE.md`. Resumo operacional:
1. **NUNCA excluir código existente.** **SEMPRE comentar** o original **antes** de
   substituir; o novo vai **abaixo/ao lado** do comentado. Vale para **todos** os
   arquivos (JS e YAML), sem exceção.
2. Usar marcadores claros: `# --- ORIGINAL (rollback) ---` / `# NOVO:` (YAML) e
   `/* ORIGINAL (rollback) ... */` / `// NOVO:` (JS).
3. **Mudanças incrementais e reversíveis.** Implementar em blocos pequenos.
4. **Só entregar/mudar o ponto de entrada quando o usuário autorizar.** Validar no
   PC primeiro; tablet depois.
5. **Rollback rápido** sempre disponível: descomentar o original e comentar o novo;
   ou `git revert` do commit da etapa.

---

## 9. Mapa de arquivos (referência rápida)

| Arquivo | Papel | Pode editar? |
|---------|-------|--------------|
| `config/www/bruno-shell.js` | **NOVO** — a shell (frame + rail + troca de seção) | Criar/editar |
| `config/dashboards/views/bento_shell.yaml` | **NOVO** — view panel que hospeda a shell | Criar/editar |
| `config/dashboards/views/shell/section_*.yaml` | **NOVO (opcional)** — configs das seções | Criar/editar |
| `config/www/bento-sidebar-card.js` | Rail — alterações **aditivas** (hash/seleção/intercept) | Editar com cuidado (Regra de Ouro) |
| `config/dashboards/views/main-grid/bento_sidebar*.yaml` | Config da rail | Editar (aditivo) |
| `config/www/bruno-ui/subviews/bruno-cameras-security-subview.js` | Console de câmeras (seção) | Ajuste mínimo (height) permitido |
| `config/dashboards/subviews/cameras-security.yaml` | Vira redirect (Etapa 2) | Editar (Etapa 2) |
| `config/dashboards/views/bento_main.yaml` | Painel atual | **Intocado até validação**; depois comentar |
| `config/dashboards/views/main-grid/bento_*.yaml` | Cards de conteúdo (Home) | **Reusar via include — NÃO editar** |
| `config/www/bruno-ui/cards/bruno-*-card.js` | Cards JS de cômodo | **NÃO editar** |
| `config/www/bruno-ui/subviews/bruno-*-subview.js` | Subviews de cômodo | **NÃO editar** |
| `config/www/bruno-ui/core/bruno-liquid-glass.js` | Tokens do design system | **Só consumir** |
| `config/configuration.yaml` | `frontend.extra_module_url` (registro + `?v=`) | Editar (registro) |
| `config/dashboards/ui-lovelace-main.yaml` | `resources:` + `views:` | Editar (registro + view) |

---

## 10. Pendência separada (não faz parte da shell, mas anotar)
**Cortina invertida (objetivo 1, em aberto):** no badge superior e no hero da Sala,
a cortina totalmente aberta mostra "Aberta · 0%" e slider cheio (deveria ser
"100%"/vazio). Causa: inversão `100 - percentControl` em
`config/www/bruno-ui/cards/bruno-top-badges-card.js` (`_curtainOpenPosition`) e
`config/www/bruno-ui/subviews/bruno-sala-subview.js` (`_curtainOpenPositionFromState`),
pois `number.cortina_varanda_percent_control` reporta **percentual ABERTO** (100 =
aberta), não fechado. Verificar o valor ao vivo com a cortina aberta e remover a
inversão nos dois arquivos (mais a calibração `*_CURTAIN_CALIBRATION`). **Fora do
escopo da shell.**
