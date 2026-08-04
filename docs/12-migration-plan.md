# 12 — Plano de migração

Base: [`PRE_MIGRATION_AUDIT.md`](../PRE_MIGRATION_AUDIT.md).
Regra transversal: **uma fase resolve um problema.** Não misturar auditoria,
movimentação de arquivo, migração, redesign e correção funcional no mesmo passo.

## Situação das fases

*Atualizado em 2026-08-02, após as respostas do usuário aos riscos R1–R5.*

| Fase | Estado | Bloqueio |
|---|---|---|
| 0 — Proteção | ✅ concluída | — |
| 1 — Auditoria | ✅ concluída | — |
| 2 — Documentação | ✅ **concluída** | 17 documentos, 2.662 linhas |
| **2b — Reconciliar repo × `/config` do HA** | ✅ **concluída** | — |
| 3 — Isolar legado | ✅ **concluída** | 195 arquivos arquivados; `config/dashboards/` 354 → 163 |
| 4 — Fundação técnica | ✅ **concluída** | build, lint, testes e deploy funcionando |
| 5 — Migração incremental | 🔒 | depende da 4 |
| **6.1 — Assets de cômodo** | ✅ **concluída** | 64,3 MB → 9,6 MB de RAM decodificada |
| 6 — Performance (restante) | 🔓 liberada | — |
| 7 — Consolidação | 🔒 | depende de 5 e 6 |

## Fase 2b — Reconciliar repositório × `/config` ✅

Executada em 2026-08-02 por leitura direta do compartilhamento Samba do HA
(`\\192.168.3.102\config`, add-on Samba ativo, **somente leitura**).

### Resultado

| Direção | Quantidade | Conclusão |
|---|---|---|
| Existe no repo, falta no HA | **0** | a sincronização repo → HA está íntegra |
| Existe no HA, falta no repo (`dashboards/`) | 5 | trazidos para o repo |
| Existe no HA, falta no repo (`www/bruno-ui/`) | 2 | trazidos para o repo |
| Existe no HA, falta no repo (`www/` raiz) | 6 | bibliotecas de terceiros, **excluídas de propósito** pelo `.gitignore` |

Os 62 arquivos críticos foram comparados por SHA-256: **61 idênticos**; o único
diferente é o `configuration.yaml`, e o diff mostra exatamente — e apenas — a
remoção do dashboard `homekitesq-teste` que eu fiz nesta sessão.

**Isso valida a auditoria:** ela foi feita sobre os arquivos que realmente rodam.

### Arquivos trazidos do HA

| Arquivo | Linhas | Situação |
|---|---|---|
| `dashboards/shared/popup/media_all_players.yaml` | 87 | **ativo** — alvo de 24 `!include` em `grid_media.yaml` |
| `dashboards/views/main-grid/sidebar.yaml` | 7 | **ativo** — entra pelo `!include_dir_merge_list main-grid/` |
| `dashboards/subviews/sidebar_cameras.yaml` | 9 | órfão também no HA |
| `dashboards/subviews/sidebar_floorplan.yaml` | 9 | órfão também no HA |
| `dashboards/subviews/sidebar_roborock.yaml` | 9 | órfão também no HA |
| `www/bruno-ui/cards/bruno-sidebar-panels.js` | 776 | órfão — não está em `extra_module_url` |
| `www/bruno-ui/subviews/bruno-sidebar-subviews.js` | 1.236 | órfão — idem |

### Correção na lista de órfãos

| | Antes | Depois |
|---|---|---|
| Total de YAML em `dashboards/` | 349 | **354** |
| Alcançáveis | 197 | **200** |
| Órfãos | 152 | **154** |
| `!include` sem alvo | 1 | **0** |

Um único arquivo mudou de classificação: `shared/sidebar/sidebar_tablet_landscape.yaml`
**não era órfão** — é puxado por `main-grid/sidebar.yaml`, que só existia no HA.
Os outros 3 novos órfãos são os `subviews/sidebar_*.yaml` recém-importados.

Ou seja: a lista original estava correta em 151 de 152 casos. A ressalva
continua valendo em espírito — verificar antes de arquivar —, mas o risco
concreto era menor do que a incerteza sugeria.

### Pendente desta fase

Documentar em `14-deployment-and-cache.md` **como** o código sai daqui e chega no
HA. O compartilhamento Samba existe e está ativo; falta confirmar se é esse o
caminho usado, se é manual, e o que fica de fora.

---

## Fase 0 — Proteção ✅

- Raiz confirmada: `C:\GitHub\hass-config_negocjohn\hass-config_negocjohn`
- Checkpoint: commit `e0dc9da3`, tag `pre-dashboard-architecture`
- Snapshot de 62 arquivos críticos conferido contra SHA-256 (62/62 OK)
- Árvore, resources, entrypoints e hashes registrados em `_backups/`

Rollback total: `git checkout pre-dashboard-architecture -- .`

## Fase 1 — Auditoria ✅

Entregue: `PRE_MIGRATION_AUDIT.md` + `docs/00`, `01`, `02`, `03`, `12`, `16`.
Nenhum arquivo de produção alterado.

## Fase 2 — Documentação ✅ (2026-08-02)

**17 documentos, 2.662 linhas**, cobrindo `00` a `16`. Nenhum arquivo de produção
foi tocado.

| Documento | Conteúdo |
|---|---|
| `00`–`03` | Visão geral, arquitetura atual, inventário, entrypoints |
| `04` | **Livro-razão dos componentes** — 38 custom elements com linhas, entidades, serviços, timers e ciclo de vida |
| `05` | Entidades por cômodo — base da futura `rooms.config.ts` |
| `06` | Integrações do HA que o dashboard consome |
| `07` | Design system e **estratégia responsiva** |
| `08` | Tablet: aparelho, WebView, teto de RAM, custos medidos |
| `09` | Problemas conhecidos — arquitetura, funcionais, hardware, tablet |
| `10` | O que funciona e não pode ser perdido |
| `11` | Experimentos fracassados, com causa |
| `13` | Protocolo de validação |
| `14` | Publicação, cache e limpeza da VM |
| `15` | Registro de decisões |
| `16` | Guia de trabalho para IA |

**Achado da fase:** `AGENTS.md` (140 KB) é **subconjunto estrito** do `CLAUDE.md`
— zero seções próprias, e o `CLAUDE.md` tem duas a mais. É duplicação pura, que
já estava divergindo. Vai para `_archive/` na Fase 3, com um ponteiro no lugar.

Critério de aceitação atendido: um agente novo trabalha sem ler os 313 KB.

## Fase 3 — Isolar o legado ✅ lote 1 (2026-08-02)

**93 arquivos arquivados** em `_archive/`, com o caminho original preservado e um
`README.md` por categoria.

### Critério — três testes, todos obrigatórios

1. **Inalcançável** a partir de `ui-lovelace-main.yaml` por `!include` ativo
2. **Não referenciado por arquivo alcançável**, por caminho, em linha ativa
3. **Não citado em linha de rollback comentada** de arquivo ativo

O terceiro teste mudou a forma da fase. Dos 147 órfãos verificados, **58 são
citados em comentários de rollback** — estão a um "descomentar" de voltar a
funcionar. Movê-los quebraria silenciosamente o mecanismo de reversão que a
Regra de Ouro nº 1 criou ao longo de meses. **Ficaram onde estavam.**

| Categoria | Arquivos |
|---|---|
| `legacy/yaml-layout-card/` | 27 |
| `legacy/popup-navigation/` | 24 |
| `legacy/mobile-v3/` | 18 |
| `deprecated/` (inclui `AGENTS.md`) | 10 |
| `legacy/bento-grid/` | 5 |
| `legacy/button-card/` | 4 |
| `experiments/` (3 JS nunca carregados) | 3 |
| `legacy/negocjohn/` | 2 |

### Validação

| | Antes | Depois |
|---|---|---|
| **Arquivos alcançáveis** | **200** | **200** — zero diferença |
| `!include` sem alvo | 0 | 0 |
| `node --check` | 55/55 | 52/52 |
| YAML em `config/dashboards/` | 354 | 265 |
| JS em `config/www/` | 55 | 52 |

`AGENTS.md` foi arquivado e substituído por um ponteiro para `CLAUDE.md` +
`docs/` — era subconjunto estrito, e dois agentes com instruções divergentes é
risco ativo.

### Correção de rota registrada

Duas vezes durante esta fase minha primeira lista estava errada, e a verificação
pegou:

- **Casamento por nome de arquivo** dava falso positivo com homônimos
  (`bento_cozinha.yaml` existe em `shared/grid-cards/` **e** em
  `views/main-grid/`). Corrigido para casar por caminho.
- **`dashboards/floorplan/` (7 arquivos) apareceu como órfão** — é incluído por
  caminho absoluto `/config/dashboards/floorplan/`, que o resolvedor local não
  segue. **Estão em uso.** Excluídos da lista.

### Lote 2 ✅ — D1 e D2 autorizadas (2026-08-02)

**102 arquivos.** Duas decisões executadas juntas:

**D2 — ramo `views/main.yaml` aposentado.** Verificado antes: **nenhum
`navigation_path` aponta para `summary`**, e os templates `button-card` /
`streamline-card` continuam sendo usados por popups, colunas, `system-grid` e
`github-grid` — por isso `config/dashboards/templates/` **permanece**. O
`!include` foi comentado in-place com instrução de rollback, não removido.

Efeito: **200 → 151 arquivos alcançáveis.** Os 39 arquivos de `main-grid/` que
eram puxados por `!include_dir_merge_list` a cada carregamento saíram de
circulação.

**D1 — rollbacks de gerações mortas aposentados.** Regra aplicada: rollback de
funcionalidade **ativa** fica; rollback de geração **morta** vai para o arquivo.
Preservados 5 arquivos: `views/shell/section_home.yaml` (feature flag da Home
V1), os 3 fallbacks da Home V2 atual e `shared/snippets/view-background.yaml`.

| Categoria | Lote 2 |
|---|---|
| `legacy/bento-grid/` | 27 |
| `legacy/mat-interface/` (nova) | 24 |
| `legacy/popup-navigation/` | 18 |
| `legacy/mobile-v3/` | 16 |
| `legacy/negocjohn/` | 5 |
| `legacy/mobile-v1/` · `legacy/mobile-v2/` | 4 + 4 |
| `legacy/yaml-layout-card/` · `deprecated/` | 3 + 1 |

### Resultado da Fase 3

| | Início | Fim |
|---|---|---|
| YAML em `config/dashboards/` | 354 | **163** |
| Arquivos alcançáveis | 200 | **151** |
| JS em `config/www/` | 55 | **52** |
| Arquivos em `_archive/` | 0 | **195** (12 READMEs) |
| `!include` sem alvo | 0 | 0 |
| `node --check` | 55/55 | 52/52 |

Restam 12 arquivos não alcançáveis em `config/`, todos deliberados: 7 do
`floorplan/` (incluídos por caminho absoluto, **em uso**) e 5 rollbacks de
funcionalidades ativas.

### D3 — descartada pelo usuário (2026-08-02)

Propus aposentar as 5 views do Mobile V3 (`views/mobile/*.yaml`), que continuam
ativamente incluídas mas cuja barra de navegação aponta para um slug inexistente.

**Decisão do usuário: manter.** Serão a base do trabalho de layout mobile.
Verificado após a Fase 3: as 5 views e suas 27 dependências resolvem
integralmente, **zero ausências**. As 12 wrappers ativas
(`shared/mobile/mobile_js_*.yaml`) permanecem em `config/`; apenas as wrappers
antigas do V3, que só apareciam em comentários de rollback, foram arquivadas em
`_archive/legacy/mobile-v3/` e continuam disponíveis como referência.

### Limpeza da VM ✅ (2026-08-02)

Arquivar no repositório não apaga nada no `/config` do HA — copiar-e-sobrescrever
nunca apaga. Os 194 arquivos foram movidos na VM para
`_DESATIVADO_20260802_legado/`, com o caminho original preservado dentro da
pasta.

Somado ao `.git` adormecido e ao `Hemma-main`: **72 MB retirados de cada backup**
(4.775 + 95 + 194 = 5.064 arquivos). Excluir a partir de 2026-08-09.

VM e repositório em paridade após a limpeza: 163 YAML e 51 JS dos dois lados;
os 151 arquivos que o dashboard carrega e os 52 recursos JS, todos presentes.
Detalhe em [`14-deployment-and-cache.md`](14-deployment-and-cache.md).

### Nota sobre a VM

Arquivar aqui **não limpa o `/config` do HA** — copiar-e-sobrescrever nunca
apaga. Os 93 arquivos continuam lá. Limpeza da VM: passo próprio, mesmo padrão
de renomear-antes-de-apagar já usado com `.git` e `Hemma-main`.

## Fase 4 — Fundação técnica ✅ (2026-08-02)

Node.js **24.18.1** + npm **11.16.0** instalados via `winget`.

### O que existe agora

```
dashboard-src/
├── package.json  tsconfig.json  vite.config.ts
├── eslint.config.js  prettier.config.js
├── scripts/deploy.mjs
└── src/
    ├── main.ts                          entrypoint do bundle
    ├── config/rooms.config.ts           8 cômodos tipados (+ testes)
    ├── models/home-assistant.ts         tipos do hass + isOn/isUnavailable (+ testes)
    ├── styles/tokens/scale.ts           escalas fluidas em clamp()/cqi
    └── diagnostics/
        ├── entity-check.ts              existência de entidade + capacidades
        └── bruno-diagnostics.ts         primeiro componente Lit
```

| Comando | Resultado |
|---|---|
| `npm run typecheck` | ✅ sem erro |
| `npm run lint` | ✅ sem erro |
| `npm run test` | ✅ **9 testes, 2 arquivos** |
| `npm run build` | ✅ **33 kB / 10 kB gzip** |
| `npm run deploy:vm` | ✅ publica em `\\192.168.3.102\config\www\dashboard\` |

O bundle **convive** com os 52 módulos clássicos. Declarado em
`frontend.extra_module_url` como
`/local/dashboard/bruno-dashboard.<hash>.js` — **sem `?v=`**: o hash no nome é o
cache-bust, e some o risco R9 (esquecer de subir a versão).

### O erro da crase, de novo — e a prova de que a fase valeu

Escrevendo `src/styles/tokens/scale.ts` eu coloquei uma crase dentro de um
comentário CSS dentro de um template literal — **exatamente** o defeito que
derrubou este dashboard 4 vezes (ver `11-failed-experiments.md`).

O `tsc` apontou em segundos, com arquivo e linha, **antes de qualquer compilação**:

```
src/styles/tokens/scale.ts(56,27): error TS1005: ',' expected.
```

Na arquitetura antiga, esse mesmo caractere teria quebrado 6 subviews em
silêncio — sem erro no console, apenas o tema "voltando ao antigo". É a
justificativa da fase inteira, demonstrada por acidente.

### Decisões aplicadas

- **Sem Zod.** No lugar, `diagnostics/entity-check.ts` verifica se cada entidade
  configurada existe em `hass.states` e reporta cômodo e campo. Zod validaria o
  formato; o que quebra é a entidade renomeada — e isso esquema nenhum pega.
- **Sem Playwright** por ora (Fase 7). Vitest cobre funções puras: `isOn` por
  domínio (regressão do P5, o botão do A/C que não acendia) e a integridade da
  configuração de cômodos.
- **`target: es2022`, sem transpilar para trás.** O WebView do tablet é Chrome
  150; transpilar seria peso morto.
- **`inlineDynamicImports`** — um arquivo só, contra as 52 requisições atuais.

### Como publicar

```bash
cd dashboard-src
npm run check      # typecheck + lint + test + build
npm run deploy:vm  # publica na VM e imprime a linha de recurso se o hash mudou
```

O `deploy.mjs` detecta se o recurso já está declarado com aquele hash e, quando
não está, imprime a linha pronta para `configuration.yaml`. Bundles antigos são
removidos da VM a cada publicação — com hash no nome, se acumulariam.

### Estrutura de destino (referência)

```
dashboard-src/          ← fonte, FORA de config/www
├── package.json  tsconfig.json  vite.config.ts
├── eslint.config.js  prettier.config.js
└── src/
```

A fundação **coexiste** com a implementação atual. Nada é substituído nesta fase.
Build publica em `config/www/dashboard/` com hash no nome
(`dashboard.[hash].js`), o que elimina o cache-bust manual — e com ele o risco R9.

Critério de aceitação: `npm run build` produz um bundle; um componente trivial
renderiza no dashboard ao lado dos atuais; nada existente quebra.

## Fase 5 — Migração incremental 🔒

Um componente por vez, sempre nesta ordem:

1. registrar o comportamento atual (o que faz, entidades, eventos, serviços)
2. definir critério de equivalência **antes** de escrever código
3. implementar em `dashboard-src/`
4. testar isolado
5. integrar ao lado do atual (feature flag, como já se faz com `section_home_v2`)
6. validar no computador
7. **validar no tablet**
8. comparar visualmente
9. arquivar a implementação substituída
10. atualizar `02-file-inventory.md` e `04-dashboard-components.md`
11. commit próprio

### Primeiro componente recomendado: `bruno-corredor-card.js`

| Critério | Situação |
|---|---|
| Representativo | Sim — é um card de cômodo completo: ícone de estado, toggle, status semântico, PNG on/off. Migrá-lo exercita tokens, ações de serviço e leitura de entidade |
| Fronteiras claras | Sim — 1.575 linhas, um custom element, sem dependência de outros cards |
| Coexiste | Sim — é o 8º tile da faixa; feature flag já prevista no YAML |
| Falha não derruba o dashboard | Sim — um tile some, o resto continua |
| Baixa criticidade | Sim — controla a luz do corredor |
| Prova a stack | Sim — TypeScript, Lit, tokens, build versionado e deploy no tablet, tudo num componente pequeno |

**Não** começar por: a shell, o roteamento, as 6 subviews de cômodo, as câmeras
ou o estado global.

Depois do corredor, a sequência natural é: os 6 cards de cômodo restantes
(convergindo para **um** componente parametrizado) → a subview de cômodo
parametrizada (a maior economia: ~45.000 linhas) → mídia → câmeras → shell.

## Fase 6 — Performance 🔓 (não bloqueada)

Ordem por relação ganho/risco:

### 6.1 — Assets de cômodo ✅ (2026-08-02)

Medição prévia: o CSS nunca exibe esses PNGs acima de **120×116 px**
(`.room-icon`, `max-width: 122px`), mas os arquivos tinham até 1254×1254.

Alvo adotado: **384 px** no lado maior para assets de cômodo (3× o tamanho
exibido — folga confortável em tela de densidade 2×) e **768 px** para a imagem
da TV, que aparece maior no hub de mídia. Proporção e canal alfa preservados;
nomes e caminhos inalterados.

| | Antes | Depois |
|---|---|---|
| Arquivo em disco (19 assets) | 15,5 MB | 2,9 MB |
| **RAM decodificada** | **64,3 MB** | **9,6 MB** |

Script: `scripts/maintenance/resize-room-assets.ps1` (tem `-DryRun`).

**14 assets não foram tocados** — são referenciados apenas em comentários de
rollback (`kitchen-off.png`, `office-on.png`, `couple-bedroom-*-tight.png`, etc.).
Vão para `_archive/` na Fase 3, não faz sentido otimizá-los.

Entrega no tablet exigiu cache-bust em cascata: 34 URLs de imagem em 14 arquivos
JS, e o `?v=` desses 14 JS em `configuration.yaml` (valores anteriores comentados).

**Lição registrada:** a primeira tentativa de substituição em massa usou `$1`
seguido de dígitos numa regex Perl — `$1` + `20260802` virou o grupo inexistente
`$120260802`, e as URLs viraram `src="/local/-assets-resize-1"`. Detectado no
diff, revertido por `git checkout`, refeito com `${1}`. **Em substituição em
massa, sempre `${1}` quando o texto seguinte começa com dígito, e sempre conferir
o diff antes de seguir.**

### 6.2 — Independência de resolução 🔴 **novo requisito do usuário (2026-08-02)**

Relatado: trocar o Galaxy Tab S6 pelo Redmi Pad 2 desorganizou o dashboard, e só
voltou ao normal alterando a resolução do próprio tablet.

Medido: **6.210 valores em px fixos**, **157 media queries** com 6 breakpoints de
largura, **zero container queries**. O layout foi calibrado por olho num aparelho.

Isso deixa de ser "ajuste fino de performance" e vira **critério de aceitação da
arquitetura**: o dashboard precisa se adaptar ao viewport, não ser recalibrado
por aparelho. Diagnóstico completo e estratégia em
[`07-design-system.md`](07-design-system.md).

Consequências no plano:

1. A Fase 4 (fundação) passa a incluir **tokens de escala fluida** — sem isso,
   cada componente migrado carrega os px fixos para dentro do TypeScript e o
   problema atravessa a migração inteira.
2. Todo componente migrado na Fase 5 nasce com **container query**, não media
   query. Regra de aceitação por componente: funciona de 600 a 2000 px de
   viewport **sem** breakpoint próprio.
3. Verificar antes: versão da WebView no tablet (container query exige Chrome
   105+). Se for anterior, a alternativa é `clamp()` + layouts intrínsecos.

### 6.3 — Uniformidade dos ícones de cômodo

Também relatado em 2026-08-02. Causa medida: as proporções variam de 0,84 a 1,73
numa caixa de 1,50, e com `object-fit: contain` a largura renderizada varia de
**67 a 120 px**. Não é margem sobrando — todas as imagens ocupam 96–100% do
próprio canvas.

Depende de decisão do usuário sobre o que "uniforme" significa (três opções em
`07-design-system.md`). Recomendação: normalizar as imagens numa proporção comum
e expor `iconScale` por cômodo na configuração — encaixa naturalmente na Fase 5b.

### Restante da Fase 6

| # | Ação | Ganho esperado | Risco |
|---|---|---|---|
| 6.2 | Guard no `set hass` — comparar só as entidades que o card usa | corta ~30 re-renders por tique de sensor | baixo |
| 6.3 | `disconnectedCallback` nos 9 arquivos que não têm | fim do acúmulo de listeners | baixo |
| 6.4 | Trocar `setInterval` por atualização orientada a evento onde houver equivalente | menos trabalho em segundo plano | médio |
| 6.5 | Medir `backdrop-filter` no tablet antes de mexer | — | — |

**6.5 não é uma correção, é uma medição.** O `CLAUDE.md` registra várias idas e
vindas com blur (rev.9 → rev.12) decididas no olho. Só mexer com número na mão.

## Fase 7 — Consolidação 🔒

Eliminar duplicações restantes, revisar `_archive/`, revisar documentação e só
então **remover** definitivamente o que já estiver arquivado e validado.

---

## Critérios de validação após cada alteração

```
1. imports/resources conferidos
2. build (quando existir)
3. sintaxe — inclusive o detector de crase em template literal
4. custom elements registrados (console: customElements.get('...'))
5. resources com versão nova
6. verificação visual no desktop
7. verificação funcional
8. console sem erro novo
9. sem regressão nas áreas vizinhas
10. rollback registrado
```

**A validação no tablet é sempre manual e sempre do usuário.** Nenhuma alteração
pode ser declarada como funcionando no tablet sem esse retorno.

## Rollback

| Escopo | Comando |
|---|---|
| Um arquivo | `cp _backups/pre-architecture-migration/snapshot/<caminho> <caminho>` |
| Um arquivo (via Git) | `git checkout pre-dashboard-architecture -- <caminho>` |
| Tudo | `git checkout pre-dashboard-architecture -- .` |
| Um commit de fase | `git revert <sha>` |
| Recurso JS | reverter a linha `?v=` em `configuration.yaml` (o valor anterior está comentado ao lado) |
| Home V2 → V1 | trocar 1 linha em `views/bento_shell.yaml` (`section_home_v2` → `section_home`) |

---

## Fase 5a — CONCLUÍDA e validada pelo usuário em 2026-08-04

Primeiro componente da arquitetura nova em produção: `bruno-room-tile`, o nono
tile da faixa, ao lado dos oito atuais. Validado pelo usuário com o Office
renderizado duas vezes — card atual à esquerda, componente novo à direita.

### O que ficou provado

| Item | Resultado medido |
|---|---|
| Ícone, zona de navegação, título, chevron, linhas, coluna direita, métrica, pilha de dots | **0,00 px** em x, y, largura e altura |
| Desenho do PNG dentro da caixa | 0,7 px no topo · 1,1 px na altura |
| Pele do cartão, contagem e cor dos dots, textos, métrica | idênticos |
| Toque, arraste, pressão longa, navegação | mesmo comportamento e mesma chamada de serviço |
| Breakpoints `max-height: 760px` e `max-width: 800px` | declarações idênticas às do card real |

Ambientes medidos: viewport 1280×720 e 1280×900, célula 183×160.

### As duas causas que explicavam quase toda a divergência

**1. O modo tile nunca ligava.** O token `--bruno-tile-mode` era lido no
`firstUpdated`. O Lit faz o primeiro update no *attach*, **antes** de o Home
Assistant chamar `setConfig` — ali o token ainda não é visível e `variant` ainda
não existe. O tile caía no cartão de vidro, e daí vinham a névoa esbranquiçada no
estado aceso, a borda de 1 px que deslocava tudo e a pele errada dos dots.
Correção: avaliação preguiçosa com cache, invalidado no `connectedCallback` e no
evento `bruno-theme-changed` — que é exatamente o que os cards atuais fazem.

**2. Faltavam os dois breakpoints dos cards atuais.** Ver docs/07, seção
"Breakpoints existentes". Sem eles o ícone ficava 10 px mais alto que o dos
vizinhos em telas com menos de 760 px de altura.

### O que passou a existir na configuração

`rooms.config.ts` ganhou quatro campos que antes viviam espalhados nos cards:

- `toggleTarget` — o toque curto alterna a luz **principal**, não o grupo. O
  grupo só no *hold*, para apagar o cômodo. Estava errado nos oito cômodos.
- `activeSensor` — sensor `*_active`, fonte primária da contagem de luzes.
- `statusDots` — descritor declarativo dos pontos de status, transcrito do
  `status_dots` que os seis cards mais novos já usam.
- `semanticState` — apontando para as variantes `*_supervised`, que são as que os
  cards reais leem.

### Gap conhecido

O overlay de reunião (`.meeting-icon`) é exclusivo do `bruno-office-card` e não
foi transcrito. Decidir na Fase 5b se vira recurso do componente ou se sai.

---

## Fase 5b — próxima: converger os sete cards restantes

O caminho está aberto: `rooms.config.ts` já descreve os oito cômodos por
completo, e o banco de medição (`scripts/harness/`) permite validar cada um por
número antes de mostrar.

Ordem sugerida, do mais completo para o mais simples — assim cada passo já
exercita tudo que o anterior exercitou:

1. **Sala** — quatro dots, TV, A/C, Echo; é o outro card "grande".
2. **Q. Marina**, **Q. Miguel**, **Q. Casal** — mesma estrutura, A/C e Echo.
3. **Cozinha** — dots de eletrodoméstico, incluindo o que acende por atributo.
4. **Lavabo** — abre popup em vez de subview; é o caso que falta modelar.
5. **Corredor** — sem subview, sem sensores de clima.

Para cada um: trocar `room:` no harness, medir contra o card real correspondente,
e só então publicar. O card antigo permanece no disco até os oito estarem
validados.

### Erros da Fase 5a e o que cada um custou

| # | Erro | Causa raiz | Custo |
|---|---|---|---|
| 1 | `.metric` com 48px / `text-align: left` | copiei do `bruno-corredor-card`, que **não tem sensor de temperatura** — o CSS de lá nunca renderiza | 1 rodada |
| 2 | Ícone 94×94 quadrado | li `icon_size` do config; o CSS o sobrescreve com `100% / max 122 × 82` | 1 rodada |
| 3 | Assets em tela quadrada | normalizei **antes** de medir a caixa | 2 rodadas |
| 4 | Q. Casal com arquivo errado | montei o caminho por convenção (`-tight`); o real é `-generated-v3` | **4 rodadas** |
| 5 | Imagens em cache no harness | `?v=` fixo enquanto eu regerava os PNGs; o usuário avaliou arquivos velhos | **3 rodadas** |
| 6 | Crase em comentário de template literal | 5ª ocorrência no projeto; `tsc` pegou em segundos | ~0 |
| 7 | Receita dos dots copiada de bloco **comentado** | o card real guarda três tentativas rejeitadas em comentário; peguei uma delas | 1 rodada |
| 8 | Token do tema lido no `firstUpdated` | ciclo de vida do Lit ≠ ciclo de vida do card do HA | 1 rodada |

**O padrão dos oito: pedi avaliação visual quando deveria ter medido.** Toda vez
que medi, achei o defeito em um passo.

**Regra:** só pedir validação sobre resultado **medido**. Se não dá para provar
por número que está certo, não mostrar. Ver `scripts/harness/README.md`.

### Como retomar

```bash
cd dashboard-src && npm run check                   # typecheck + lint + test + build
perl scripts/validation/check-includes.pl .         # includes
```

Banco de medição: `scripts/harness/` — sobe um servidor que mapeia `/local/` para
`config/www/`, renderiza os dois cards na mesma célula e expõe `window.medir()`.
Referência é sempre o **`bruno-office-card`**, o cômodo mais completo — nunca o
Corredor nem o Lavabo, que têm CSS que nunca renderiza.
