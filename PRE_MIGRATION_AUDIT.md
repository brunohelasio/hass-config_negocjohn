# PRE_MIGRATION_AUDIT

**Auditoria prévia à reestruturação arquitetural do dashboard**
Data: 2026-08-02 · Fase 0 (Proteção) + Fase 1 (Auditoria) · **Nenhum arquivo de
produção foi alterado, movido ou excluído.**

---

## RESUMO EXECUTIVO

O repositório é o diretório de configuração de um Home Assistant, herdado do
projeto `ngocjohn/hass-config` e reescrito ao longo de ~6 gerações de interface.
A interface **em produção hoje** não é mais YAML: é uma aplicação de Web
Components carregada por `frontend.extra_module_url`, com **93.928 linhas de
JavaScript** em 53 arquivos e **38 custom elements**. O YAML sobrevive como
camada de configuração e como sedimento das gerações anteriores.

O projeto **funciona** e tem qualidade visual alta. Os problemas não são de
gosto arquitetural — são quatro defeitos mensuráveis que explicam, juntos,
praticamente todos os sintomas relatados no tablet:

| # | Achado | Medida |
|---|---|---|
| **A1** | As 6 subviews de cômodo são **cópias** umas das outras | 88–97% de linhas em comum; 52.864 linhas para ~2.000 de lógica real |
| **A2** | Todo card faz **re-render total** a cada atualização do `hass` | `set hass → this._render() → innerHTML = …`, sem diff, em ~30 cards |
| **A3** | **316 `addEventListener`** contra **62 `removeEventListener`** | 9 arquivos com listener/timer e sem `disconnectedCallback` |
| **A4** | Assets de cômodo em 1254×1254 px exibidos a ~100 px | 33 PNGs = **127 MB** de bitmap decodificado |

Nenhum deles se resolve com "reescrever em TypeScript". Todos se resolvem com
mudanças pequenas e verificáveis — e é por isso que a migração deve começar por
eles, não pela fundação de build.

**Restrição bloqueante para a arquitetura de destino:** a stack pedida
(TypeScript + Vite + Vitest + Playwright + ESLint + Prettier) exige Node.js.
**Node não está instalado nesta máquina** (`node`, `npm`, `python` ausentes;
apenas `perl` disponível). Isso não impede as Fases 1–3; impede a Fase 4.

---

## ESTRUTURA ATUAL

```
C:\GitHub\hass-config_negocjohn\hass-config_negocjohn\   ← raiz real (= /config do HA)
├── config/
│   ├── configuration.yaml          382 linhas — entrypoint do HA
│   ├── dashboards/                 349 YAML — 197 alcançáveis, 152 órfãos
│   │   ├── ui-lovelace-main.yaml   entrypoint do dashboard
│   │   ├── views/                  views + shell + 3 gerações de mobile
│   │   ├── subviews/               subviews YAML antigas
│   │   ├── shared/                 grid-cards, popups, colunas, snippets
│   │   ├── templates/              button_card / streamline (geração "Mat")
│   │   └── floorplan/              regras SVG da planta (via caminho absoluto)
│   ├── www/                        53 JS + 51 MB de assets  ← A APLICAÇÃO
│   │   ├── bento-sidebar-card.js   rail (889 linhas)
│   │   └── bruno-ui/
│   │       ├── core/               shell, temas, painéis, ícones (17 arquivos)
│   │       ├── cards/              cards da Home (25 arquivos)
│   │       ├── subviews/           subviews de cômodo (11 arquivos)
│   │       └── assets/             29 MB de PNG
│   ├── packages/                   42 YAML — sensores de presença, cenas, etc.
│   ├── themes/                     17 temas
│   └── custom_components/          55 integrações (2.485 arquivos)
├── docs/                           README, bruno-shell-spec, screenshots
├── tmp/                            49 snapshots de fallback de sessões antigas
├── _backups/                       ← criado nesta fase
├── CLAUDE.md                       168 KB de histórico de decisões
└── AGENTS.md                       144 KB (idem, para outro agente)
```

---

## ENTRYPOINTS

Detalhamento completo em
[`_backups/pre-architecture-migration/active-entrypoints.md`](_backups/pre-architecture-migration/active-entrypoints.md).

```
Home Assistant
└── configuration.yaml
    ├── frontend.extra_module_url ──► 52 arquivos JS (a aplicação)
    └── lovelace.dashboards
        ├── ngocjohn-main ──► dashboards/ui-lovelace-main.yaml   ✔ ATIVO
        └── homekitesq-teste ──► lovelace-homekitesq.yaml        ✘ NÃO EXISTE

ui-lovelace-main.yaml
├── views/bento_shell.yaml ──► custom:bruno-shell        ← PAINEL PADRÃO (path bento-lab)
│   ├── rails: shell/rail.yaml + shell/rail_rooms.yaml
│   ├── sections.home ──► shell/section_home_v2.yaml     ← feature flag (V1 = rollback)
│   ├── sections.cameras ──► shell/section_cameras.yaml
│   └── sections.{roborock,floorplan,sala,office,cozinha,
│                 casal,marina,miguel,music} ──► custom elements
├── views/main.yaml ──► !include_dir_merge_list main-grid/  (39 arquivos, geração Bento)
├── views/mobile/*.yaml × 5                                 (Mobile V3, órfão na prática)
├── views/system.yaml, views/github-view.yaml
├── subviews/{movie-panel,music-assistant,cameras-security,floor-plan}.yaml
├── subviews/{sala_subview,office_subview}.yaml             (geração pop-up/subview YAML)
└── 4 views inline ──► custom:bruno-{cozinha,quarto-*}-subview
```

**Slug real: `ngocjohn-main`.** A navbar do Mobile V3 aponta para `/lovelace/…`
(registrado no `CLAUDE.md` como "slug confirmado"). Esse slug **não existe** —
os links do Mobile V3 estão quebrados. Na prática isso é inofensivo hoje, porque
o redirect que jogava o celular para lá foi comentado e o phone permanece na
shell; mas as 5 views continuam sendo carregadas e parseadas a cada load.

---

## RESOURCES ATIVOS

52 recursos, listados um a um em
[`_backups/pre-architecture-migration/active-resources.md`](_backups/pre-architecture-migration/active-resources.md).

Fatos relevantes:

- **Zero `import`/`export` em todo o `config/www`.** Os 53 arquivos são scripts
  clássicos; o acoplamento é por **18 objetos em `globalThis`**
  (`BrunoLiquidGlass`, `BrunoJosh`, `BrunoSurfaceMaterial`, `BrunoThemeManager`,
  `BrunoIcons`, …). A ordem de carregamento é a única coisa que garante que
  `bruno-josh.js` (delta) rode depois de `bruno-ios-dark.js` (base) — e essa
  dependência **não está declarada em nenhum lugar**, só na ordem das linhas do
  YAML. O `CLAUDE.md` já registra uma investigação sobre corrida de carregamento
  no `bruno-theme-manager.js`; a causa estrutural é esta.
- **242 linhas comentadas** de `# ANTERIOR (cache rollback): …` no mesmo bloco
  das 52 ativas — 82% do bloco é comentário morto. `bruno-josh.js` sozinho
  acumula 18 versões comentadas.
- **Não há bundle.** 52 requisições HTTP separadas no cold start, mais 51 MB de
  assets.
- Cache-bust manual por arquivo, em 8 formatos de data diferentes.

---

## ARQUIVOS ATIVOS

`ACTIVE` — em produção, comportamento correto, sem dívida estrutural grave.

| Arquivo | Linhas | Papel |
|---|---|---|
| `www/bruno-ui/core/bruno-icons.js` | 113 | Biblioteca de ícones SVG (82 KB numa linha — dado, não código) |
| `www/bruno-ui/core/bruno-theme-manager.js` | 151 | Seleção/persistência de tema |
| `www/bruno-ui/core/bruno-wallpaper-manager.js` | 121 | Wallpaper por seção |
| `www/bruno-ui/core/bruno-{system,network,scenes}-panel.js` | 169–189 | Painéis da rail |
| `www/bruno-ui/core/bruno-updates-panel.js` | 408 | Painel de updates |
| `www/bruno-ui/core/bruno-{ios-light,ios-dark,visionos}.js` | 161–409 | Temas |
| `www/bruno-ui/core/bruno-hybrid-light-icons.js` | 228 | Ícones híbridos de luz |
| `www/bruno-ui/subviews/bruno-music-subview.js` | 34 | Redirect para ingress do Music Assistant |
| `www/bruno-ui/cards/bruno-hero-stage-card.js` | 200 | — |
| `www/bruno-ui/cards/bruno-agenda-card.js` | 518 | Agenda (WS `calendar/list_events` + fallback REST) |
| `www/bruno-ui/cards/bruno-energy-card.js` | 608 | Consumo |
| `www/bruno-ui/cards/bruno-activity-column.js` | 537 | Coluna dinâmica da Home V2 |
| `config/dashboards/views/bento_shell.yaml` | 98 | Config da shell |
| `config/dashboards/views/shell/*.yaml` | 4 ativos | Rails e seções |
| `config/packages/*_presence.yaml` | 7 | Molde único de presença/ocupação (2026-07-03) |
| `config/themes/tablet.yaml` | — | Tema base efetivamente usado |

---

## ARQUIVOS QUE PRECISAM DE REFATORAÇÃO

`ACTIVE_BUT_NEEDS_REFACTOR` — em produção **e** com dívida estrutural medida.

### Bloco 1 — as 6 subviews de cômodo (o problema dominante)

| Arquivo | Linhas | KB | Comum com `sala` |
|---|---|---|---|
| `bruno-quarto-miguel-subview.js` | 8.925 | 306 | 96% |
| `bruno-sala-subview.js` | 8.928 | 305 | — (referência) |
| `bruno-quarto-marina-subview.js` | 8.910 | 305 | 96% |
| `bruno-quarto-casal-subview.js` | 8.889 | 304 | 97% |
| `bruno-cozinha-subview.js` | 8.783 | 292 | 88% |
| `bruno-office-subview.js` | 8.429 | 281 | 93% |
| **Total** | **52.864** | **1,8 MB** | |

Cada arquivo carrega o CSS completo do comodo, o hero, a grade de iluminação, o
A/C, o hub de mídia, as câmeras e a barra de badges. **Qualquer ajuste visual
precisa ser aplicado seis vezes** — e o `CLAUDE.md` documenta exatamente isso em
todas as revisões ("Arquivos alterados (6)", "aplicado nos 6").

O custo não é só manutenção: é a origem direta do incidente da crase em template
literal, que derrubou as 6 subviews de uma vez e já ocorreu **4 vezes** neste
projeto. Um erro de digitação num comentário CSS quebra 300 KB de aplicação
porque não existe build nem checagem sintática entre o editor e o navegador.

### Bloco 2 — cards de cômodo da Home

`bruno-{office,cozinha,quarto-casal,quarto-marina,quarto-miguel,corredor,lavabo}-card.js`
— 1.500–1.900 linhas cada, 12–16% de comentário histórico, mesma estrutura
repetida. `bruno-sala-card.js` tem **4.369 linhas** e 117 comentários históricos.

### Bloco 3 — núcleo

| Arquivo | Linhas | Dívida |
|---|---|---|
| `bruno-shell.js` | 2.061 | 14 `innerHTML =`; roteamento, rail, backdrops, popups e temas no mesmo arquivo |
| `bruno-surface-material.js` | 540 | **44% comentário**; sem `disconnectedCallback` com listener global |
| `bruno-josh.js` | 425 | **57% comentário** — o registro de 12 revisões vive dentro do CSS |
| `bruno-media-card.js` | 2.092 | 22 listeners, 3 timers, sem `disconnectedCallback` |
| `bruno-lavabo-card.js` | 1.916 | 24 listeners; `<dialog>` + Shadow DOM com ponte de tema própria |
| `bruno-planta-3d-subview.js` | 2.204 | 8 listeners / 12 removals / 3 timers |

### Bloco 4 — YAML ativo que já foi substituído por JS

`views/main.yaml` + os 39 arquivos de `views/main-grid/` continuam sendo
parseados a cada load do dashboard, embora a shell tenha assumido a interface.
Inclui `grid_media.yaml` (1.316 linhas) e os templates `button_card`
(`tpl_icons.yaml` 3.928 linhas, `tpl_media.yaml` 2.561, `tpl_base.yaml` 1.660).

---

## LEGADO REUTILIZÁVEL

`REUSABLE_LEGACY` — não está em produção, mas contém conhecimento que não deve
ser perdido.

| Item | Por quê |
|---|---|
| `docs/bruno-shell-spec.md` (25 KB) | Especificação da shell — base do `01-current-architecture.md` |
| `CLAUDE.md` (168 KB) / `AGENTS.md` (144 KB) | Registro de ~40 revisões: causa-raiz, tentativas fracassadas, invariantes. **A fonte primária do `docs/09` e `docs/11`.** |
| `tmp/fallback-*/` (49 arquivos) | Snapshots de 4 sessões anteriores — servem de referência histórica, mas o Git já cobre isso |
| `config/dashboards/shared/popup/rooms/*.yaml` | Popups de cômodo da geração anterior; contêm o mapeamento entidade↔cômodo mais completo do repositório |
| `config/dashboards/templates/button_card_templates/tpl_base.yaml` | Documenta a lógica de `state_on` por domínio (climate/light/switch/media) que hoje está reimplementada solta nos cards |

---

## ARQUIVOS OBSOLETOS

`OBSOLETE` — comprovadamente fora do grafo de execução **e** de uma geração
encerrada. **145 arquivos** (152 órfãos menos os 7 de `dashboards/floorplan/`,
que são falso-positivo: são incluídos por caminho absoluto `/config/...`, válido
no HA e não resolvível localmente).

| Geração | Arquivos | Exemplos |
|---|---|---|
| Mobile V1 / V2 / V3 (shared) | 40 | `views/mobile-home.yaml`, `views/mobile-v2-*.yaml`, `shared/mobile/mobile_{calendar,cameras,…}_card.yaml`, `shared/mobile-pill-nav.yaml` |
| Herança `negocjohn` (Chéquia) | ~12 | `shared/popup/home_vietngoc.yaml`, `home_zuzu.yaml`, `camera_zahrada.yaml`, `shared/honeycomb/*` (5) |
| Bento Grid anterior | ~20 | `views/bento_main.yaml`, `shared/grid-cards/*` órfãos |
| Pop-up navigation | ~16 | `shared/popup/{cameras,all_lights,airpurifier,hallway,…}.yaml` |
| Snippets `layout-card`/`button-card` | 28 | `shared/snippets/*` |
| `hidden/` (nunca renderizado) | 7 | `sticky_menu.yaml` **e** `stiicky-menu.yaml` (erro de digitação duplicado) |
| Fullscreen/backup explícitos | 3 | `rooms/livingroom_complex_backup.yaml`, `rooms/livingroom_fullscreen/*` |

Também obsoleto e fora de `dashboards/`:

- `config/dashboards/views/shell/section_roborock.yaml` — a seção foi colocada
  **inline** no `bento_shell.yaml` e o arquivo ficou órfão.
- `config/www/bruno-ui/core/bruno-liquid-glass_v1.js` (379 linhas) — único JS não
  referenciado.

---

## ARQUIVOS DUPLICADOS

`DUPLICATE`

| Duplicação | Escala |
|---|---|
| 6 subviews de cômodo | 88–97% idênticas — ~45.000 linhas redundantes |
| 7 cards de cômodo | mesma estrutura, ~9.000 linhas |
| `shared/hidden/sticky_menu.yaml` × `stiicky-menu.yaml` | par literal com typo |
| `shared/popup/rooms/atv_remote.yaml` × `shared/hidden/atv_remote.yaml` | mesmo componente em dois lugares |
| `views/main-grid/floorplan.yaml` × `views/disabled/floorplan.yaml` | idênticos no include da planta |
| `views/main-grid/bento_*.yaml` × `views/main-grid/v2/bento_*.yaml` | V1 e V2 convivendo |
| Design tokens | mesmos valores RGBA repetidos entre `bruno-josh.js`, `bruno-visionos.js`, `bruno-ios-*.js` e inline nas 6 subviews |

---

## ARQUIVOS EXPERIMENTAIS

`EXPERIMENTAL`

| Arquivo | Situação |
|---|---|
| `config/dashboards/views/main-grid/v2/` + `v2/legacy/` | Home V2/V3 — **parte está em produção** (via `section_home_v2.yaml`), parte não. Precisa de separação item a item. |
| `config/dashboards/views/shell/section_home.yaml` | V1 da Home, mantida como rollback de uma linha — **intencional, não é lixo** |
| `config/custom_components/bruno_tuya_motion/` | Ponte MQTT criada em 2026-07-13; funcional, mas é código próprio dentro do diretório de integrações de terceiros |
| `config/dashboards/views/main-grid/cover-screen.yaml.disabled` | Desabilitado por extensão |
| `config/dashboards/views/disabled/floorplan.yaml` | Idem, por diretório |

---

## ARQUIVOS DE USO DESCONHECIDO

`UNKNOWN` — **não mover, não tocar** até haver evidência.

| Item | Por que é desconhecido |
|---|---|
| `config/lovelace-homekitesq.yaml` | Registrado em `configuration.yaml` e **inexistente** no disco e no histórico do Git. Ou o HA está com um dashboard quebrado no sidebar, ou o arquivo existe só na máquina do HA. **Só o usuário pode dizer.** |
| `config/dashboards/shared/popup/media_all_players.yaml` | 24 `!include` **ativos** apontam para ele a partir de `views/main-grid/grid_media.yaml`, que é alcançável. Nunca esteve no Git. Mesmo dilema. Ver risco R1. |
| `config/custom_components/` — 55 integrações | Várias claramente da herança europeia (`rohlikcz`, `mbapi2020`, `dyson_local`, `dwains_dashboard`, `ui_lovelace_minimalist`). Não são frontend e **não fazem parte deste escopo**; só o HA em execução diz quais estão carregadas. |
| `config/custom_components/delete/` | Nome sugere descarte; conteúdo não verificado |
| `config/themes/` — 17 temas | Só `tablet.yaml` é referenciado pelas views. Os demais podem estar selecionados por usuário no perfil do HA |
| `tmp/` (49 arquivos) | Fallbacks de sessões antigas; utilidade atual não confirmada |

---

## MAIORES ARQUIVOS

| Linhas | Arquivo |
|---|---|
| 8.928 | `www/bruno-ui/subviews/bruno-sala-subview.js` |
| 8.925 | `www/bruno-ui/subviews/bruno-quarto-miguel-subview.js` |
| 8.910 | `www/bruno-ui/subviews/bruno-quarto-marina-subview.js` |
| 8.889 | `www/bruno-ui/subviews/bruno-quarto-casal-subview.js` |
| 8.783 | `www/bruno-ui/subviews/bruno-cozinha-subview.js` |
| 8.429 | `www/bruno-ui/subviews/bruno-office-subview.js` |
| 4.369 | `www/bruno-ui/cards/bruno-sala-card.js` |
| 3.951 | `dashboards/shared/grid-cards/bento_cameras.yaml` |
| 3.928 | `dashboards/templates/button_card_templates/tpl_icons.yaml` |
| 2.770 | `dashboards/shared/grid-cards/bento_sala.yaml` |
| 2.561 | `dashboards/templates/button_card_templates/tpl_media.yaml` |
| 2.204 | `www/bruno-ui/subviews/bruno-planta-3d-subview.js` |
| 2.092 | `www/bruno-ui/cards/bruno-media-card.js` |
| 2.061 | `www/bruno-ui/core/bruno-shell.js` |

Acima de 1.000 linhas: **31 arquivos**. Acima de 3.000: **10**. Acima de 5.000: **6**.

---

## MAPA DE DEPENDÊNCIAS

```
                    ┌─────────────────────────────────────────┐
                    │  globalThis (único canal entre módulos) │
                    │  18 objetos, 0 imports, ordem implícita │
                    └─────────────────────────────────────────┘
                                     ▲
   ordem de carregamento em frontend.extra_module_url (a "declaração" de deps)
                                     │
 1. bruno-icons ──────────────► BrunoIcons
 2. bento-sidebar-card (rail)
 3. bruno-wallpaper-manager ──► BrunoWallpaperManager
 4. bruno-scenes-panel ───────► BrunoScenesPanel
 5. bruno-shell ──────────────► registra <bruno-shell>, consome TODOS os globais
 6. bruno-liquid-glass ───────► BrunoLiquidGlass
 7. bruno-liquid-glass-ios ───► BrunoLiquidGlassIOS
 8. bruno-visionos ───────────► BrunoVisionOS
 9. bruno-ios-light ──────────► BrunoIOSLight
10. bruno-ios-dark ───────────► BrunoIOSDark      ┐ base
11. bruno-josh ───────────────► BrunoJosh         ┘ delta — DEPENDE de #10
12. bruno-theme-manager ──────► BrunoThemeManager   — DEPENDE de #6-11
13. bruno-surface-material ───► BrunoSurfaceMaterial — consumido pelas 6 subviews
14-17. painéis (updates, system, network, hybrid-light-icons)
18-27. subviews  ─┐
28-52. cards      ┘ consomem BrunoIcons / BrunoLiquidGlass / BrunoSurfaceMaterial
```

**Fragilidade estrutural:** as dependências 10→11→12→13 são reais e não
declaradas. Script criado dinamicamente executa na ordem em que **termina** de
baixar; com cache miss em um e hit em outro, a ordem pode inverter. O `CLAUDE.md`
registra essa hipótese (e o descarte dela num incidente específico, corretamente)
— mas a fragilidade continua existindo e não foi corrigida.

Do lado do YAML: `views/main.yaml` → `!include_dir_merge_list main-grid/` puxa
**todos** os 39 arquivos do diretório, usados ou não. Não há como desativar um
card sem retirá-lo da pasta.

---

## RISCOS IDENTIFICADOS

> **Atualização 2026-08-02** — R1 a R5 foram respondidos pelo usuário. Ver
> `RESOLUÇÃO DOS RISCOS` logo abaixo da tabela.

| # | Risco | Severidade | Evidência |
|---|---|---|---|
| **R1** | ~~`grid_media.yaml` referencia arquivo inexistente~~ → **reclassificado**: o arquivo existe no HA e **não** neste repositório. O repo **não é espelho fiel** do `/config`. | **ALTA** (nova forma) | `grid_media.yaml:329,349,…` + confirmação do usuário |
| **R2** | ~~Dashboard `homekitesq-teste` apontando para arquivo inexistente~~ | ✅ **RESOLVIDO** | removido em 2026-08-02 |
| **R3** | ~~Processo externo commita automaticamente~~ → era o **usuário via GitHub Desktop**. Não há automação a pausar; é coordenação. | BAIXA | confirmado pelo usuário |
| **R4** | `docs/**` dispara deploy público no GitHub Pages **a cada push** (`.github/workflows/deploy-page.yml`) | MÉDIA | decisão: manter tudo **local**, sem push, até o usuário revisar |
| **R5** | ~~Node.js/npm ausentes~~ | ✅ **EM RESOLUÇÃO** | Node LTS sendo instalado via `winget` (autorizado) |
| **R6** | Sem build e sem lint, um erro de sintaxe só aparece no navegador. O incidente da crase em template literal já ocorreu **4 vezes** e derruba as 6 subviews de uma vez | **ALTA** | `CLAUDE.md`, seções de 2026-07-29 |
| **R7** | 254 listeners sem remoção correspondente; 9 arquivos com listener/timer e sem `disconnectedCallback` | MÉDIA | contagem em `docs/02-file-inventory.md` |
| **R8** | Mover qualquer YAML de `views/main-grid/` altera o resultado do `!include_dir_merge_list` — o efeito é global, não local | MÉDIA | `views/main.yaml:96` |
| **R9** | Cache-bust manual: um esquecimento deixa o tablet com um módulo velho conversando com globais novos | MÉDIA | 52 recursos, 8 formatos de versão |
| **R10** | `tpl_*.yaml` (button-card) e os cards JS reimplementam a **mesma** lógica de `state_on`/contagem de luzes em paralelo | BAIXA | `tpl_base.yaml:23` vs cards |

### RESOLUÇÃO DOS RISCOS — 2026-08-02

**R1 — resolvido.** O usuário confirmou que `media_all_players.yaml` existe no
HA; o dashboard não está quebrado. A partir daí executei a **Fase 2b**
(reconciliação completa repo × `/config`) por leitura do compartilhamento Samba
do HA, e o resultado é bem melhor do que a incerteza sugeria:

- **0 arquivos** existem aqui e faltam no HA — a sincronização repo → HA está íntegra
- **7 arquivos** existiam só no HA e foram importados (5 YAML + 2 JS)
- **61 dos 62 arquivos críticos são byte-idênticos** ao que roda no HA; o único
  diferente é o `configuration.yaml`, pela remoção do `homekitesq-teste` que fiz
  nesta sessão

**Isso valida a auditoria** — ela foi feita sobre os arquivos que realmente rodam.

Correção na lista de órfãos: **354 YAML, 200 alcançáveis, 154 órfãos, 0 `!include`
sem alvo**. Apenas um arquivo mudou de classificação
(`shared/sidebar/sidebar_tablet_landscape.yaml` não era órfão). A Fase 3 está
**desbloqueada**.

Fica pendente documentar **como** o código chega daqui ao HA
(`docs/14-deployment-and-cache.md`) — o Samba está ativo, mas falta confirmar se
é esse o caminho usado e o que fica de fora.

**R2 — resolvido.** Dashboard `homekitesq-teste` retirado de
`configuration.yaml` em 2026-08-02, com autorização explícita. As 6 linhas
originais ficaram comentadas in-place (Regra de Ouro nº 1), com instrução de
rollback. Exige reinício do HA para sair do sidebar.

**R3 — resolvido, e meu diagnóstico estava errado.** Não havia processo
automatizado: o commit `Atualização` foi feito pelo próprio usuário no GitHub
Desktop. Não há nada a pausar; é coordenação. O que permanece útil: commits pelo
botão do GitHub Desktop varrem a árvore inteira, então trabalho em andamento
pode acabar dentro de uma mensagem genérica.

**R4 — decisão tomada.** Nada será enviado ao remote por ora. O GitHub Pages só
dispara em `push`, então commits locais são seguros. O usuário revisa depois o
que commitar e publicar.

**R5 — resolvido.** Node.js **24.18.1** LTS + npm **11.16.0** instalados via
`winget` (escopo de usuário, download do `nodejs.org` com hash verificado).

**R6 — mitigado.** Com Node disponível, o projeto ganhou pela primeira vez uma
checagem sintática real: `scripts/validation/check-syntax.ps1` roda
`node --check` nos 53 arquivos. **Linha de base: 53/53 OK.** Isso substitui a
heurística em Perl que eu havia documentado, que produzia 24 falsos positivos e
nenhum verdadeiro. A Fase 4 deixa de estar bloqueada.

---

## ESTRUTURA PROPOSTA

Ajustada à realidade encontrada. **Sem diretórios vazios e sem camadas sem uso
concreto** — cada pasta abaixo tem conteúdo identificado nesta auditoria.

```
/  (raiz = /config do Home Assistant — não muda)
├── config/                      ← continua sendo o que o HA lê
│   ├── configuration.yaml
│   ├── dashboards/              ← encolhe conforme o JS assume
│   ├── packages/  themes/  custom_components/
│   └── www/
│       ├── bruno-ui/            ← HOJE: fonte + produção no mesmo lugar
│       └── dashboard/           ← DEPOIS: só o bundle compilado + assets
│
├── dashboard-src/               ← NOVO: código-fonte, fora do que o HA serve
│   ├── src/
│   │   ├── components/
│   │   │   ├── shell/  rail/  rooms/  lighting/  climate/
│   │   │   ├── media/  cameras/  status/  shared/
│   │   ├── views/room/          ← UMA subview parametrizada (hoje são 6 cópias)
│   │   ├── services/
│   │   │   ├── home-assistant/  ← acesso ao hass + chamadas de serviço
│   │   │   ├── entities/        ← seletores; substitui o re-render total
│   │   │   ├── feedback/        ← áudio/háptico/visual + detecção de capacidade
│   │   │   └── cameras/
│   │   ├── config/              ← rooms.config.ts, entities.config.ts (Zod)
│   │   ├── styles/tokens/       ← fonte única dos design tokens
│   │   ├── models/  utils/  diagnostics/
│   │   └── main.ts
│   ├── tests/{unit,visual}/
│   ├── package.json  tsconfig.json  vite.config.ts
│   └── eslint.config.js  prettier.config.js
│
├── docs/                        ← 00…16 + camera-streaming-analysis
├── _archive/                    ← legado isolado, fora do build e do HA
│   ├── legacy/{negocjohn,bento-grid,popup-navigation,mobile-v1,
│   │           mobile-v2,mobile-v3,yaml-layout-card,button-card}/
│   ├── experiments/  deprecated/  unknown/
├── _backups/                    ← criado na Fase 0
└── PRE_MIGRATION_AUDIT.md
```

**Três desvios conscientes da estrutura sugerida no pedido:**

1. **`dashboard-src/` em vez de `dashboard/`** na raiz, e o `config/` permanece
   onde está. Este repositório **é** o `/config` do HA: mover `config/` quebraria
   o espelhamento com a máquina do Home Assistant.
2. **`views/room/` com uma única subview parametrizada.** As 6 cópias não são 6
   componentes — são 1 componente com 6 configurações. É a mudança que sozinha
   elimina ~45.000 linhas.
3. **Sem `state/` global no início.** O HA já é a fonte de estado; introduzir um
   store paralelo antes de resolver o re-render (A2) adicionaria uma segunda
   fonte de verdade sem resolver o problema real.

---

## PLANO DE MIGRAÇÃO

Detalhamento em [`docs/12-migration-plan.md`](docs/12-migration-plan.md).

| Fase | Objetivo | Depende de | Risco |
|---|---|---|---|
| **0** ✅ | Checkpoint, tag, snapshot verificado | — | nenhum |
| **1** ✅ | Esta auditoria | — | nenhum |
| **2** | Extrair o conhecimento de `CLAUDE.md`/`AGENTS.md` para `docs/09`, `10`, `11`, `15` | 1 | nenhum |
| **3** | Isolar em `_archive/` apenas os 145 órfãos comprovados | 1, **R1/R2 resolvidos** | baixo |
| **4** | Fundação técnica (TS/Vite/Lint/Vitest) coexistindo com o atual | **R5 resolvido (instalar Node)** | baixo |
| **5** | Migração incremental, um componente por vez | 4 | médio |
| **6** | Performance: re-render, listeners, assets, cache | 1 (parcialmente independente) | médio |
| **7** | Consolidação | 5, 6 | baixo |

**As Fases 3 e 4 estão bloqueadas** — 3 por R1/R2, 4 por R5. A Fase 6 **não está
bloqueada** e é onde estão os ganhos imediatos.

---

## PRIMEIRA ALTERAÇÃO SEGURA

**Reduzir os PNGs de cômodo à resolução em que são efetivamente exibidos.**

Justificativa: é a única mudança que atende simultaneamente a todos os critérios
de "primeira alteração segura" —

- **Não toca em código.** Zero linhas de JS ou YAML alteradas; nenhum caminho
  de arquivo muda; nenhum cache-bust é necessário.
- **Ganho medido, não estimado.** 33 PNGs em 1254×1254 px decodificam a
  **127 MB** de bitmap. Exibidos a ~100–120 px, 512×512 px é generoso: reduz para
  ~21 MB. Numa WebView do Fully Kiosk com memória disputada, é a diferença entre
  caber e não caber.
- **Reversível em um comando** (`git checkout pre-dashboard-architecture -- <path>`).
- **Falha visível e inofensiva**: se algo der errado, a imagem aparece com menos
  nitidez — não derruba o dashboard.
- **Valida a cadeia de deploy inteira** (editar → sincronizar → tablet → cache)
  sem arriscar comportamento.

Detalhe operacional: os PNGs `*-tight.png` (1042×926) e os `*-on/-off` (1254×1254)
são pares de estado; ambos precisam do mesmo tratamento para não haver salto
visual na troca.

**Segunda candidata**, se a primeira for aprovada: remover as 242 linhas
comentadas de `frontend.extra_module_url` (o histórico está no Git desde sempre)
— também sem efeito funcional, e devolve legibilidade ao único manifesto de
carregamento que o projeto tem.

---

## CLASSIFICAÇÃO PARA MOVIMENTAÇÃO

| Classe | Qtd | Conteúdo |
|---|---|---|
| `SAFE_TO_MOVE` | 47 | Mobile V1 (4 views) + V2 (4 views) + `shared/mobile/` órfãos (22) + `shared/honeycomb/` (5) + `shared/hidden/` (7) + `bruno-liquid-glass_v1.js` + `views/bento_main.yaml` + `shell/section_roborock.yaml` + `rooms/livingroom_complex_backup.yaml` + `rooms/livingroom_fullscreen/` (3) |
| `REQUIRES_REVIEW` | 98 | Demais órfãos de `shared/{popup,snippets,columns,grid-cards}` — órfãos hoje, mas vários são referenciados por arquivos que também são órfãos; mover em bloco pode esconder uma dependência viva |
| `DO_NOT_MOVE` | todo `views/main-grid/` | `!include_dir_merge_list` — retirar um arquivo muda o resultado do merge |
| `UNKNOWN_USAGE` | 6 grupos | `lovelace-homekitesq.yaml`, `media_all_players.yaml`, `custom_components/` (55), `custom_components/delete/`, `themes/` (16 não referenciados), `tmp/` (49) |

Nenhum arquivo foi movido nesta fase.
