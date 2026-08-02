# 12 — Plano de migração

Base: [`PRE_MIGRATION_AUDIT.md`](../PRE_MIGRATION_AUDIT.md).
Regra transversal: **uma fase resolve um problema.** Não misturar auditoria,
movimentação de arquivo, migração, redesign e correção funcional no mesmo passo.

## Situação das fases

| Fase | Estado | Bloqueio |
|---|---|---|
| 0 — Proteção | ✅ concluída | — |
| 1 — Auditoria | ✅ concluída | — |
| 2 — Documentação | 🔓 liberada | — |
| 3 — Isolar legado | 🔒 bloqueada | **R1, R2** — confirmação do usuário |
| 4 — Fundação técnica | 🔒 bloqueada | **R5** — Node.js ausente na máquina |
| 5 — Migração incremental | 🔒 | depende da 4 |
| 6 — Performance | 🔓 **liberada** | — (ganhos imediatos aqui) |
| 7 — Consolidação | 🔒 | depende de 5 e 6 |

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

## Fase 2 — Documentação 🔓

Extrair de `CLAUDE.md` (168 KB) e `AGENTS.md` (144 KB) — que hoje são o único
registro de ~40 revisões — para documentos consultáveis:

| Destino | Conteúdo a extrair |
|---|---|
| `09-known-issues.md` | Pendências P1–P13, S1–S5, MS1–MS6, F3.1–F3.5, L1–L3, O1–O4 |
| `10-successful-implementations.md` | Molde de presença (2026-07-03/04), pipeline `uix-dialog`, shell por hash, dedup de resources |
| `11-failed-experiments.md` | Trava de contexto na ocupação, `recent_only: 120s`, `grid-template-rows: 0`, `triggers_update: all`, backdrop-filter na cartela (rev.9→12), retry do theme-manager |
| `15-decisions-log.md` | Decisões com data, contexto, alternativas e consequências |
| `07-design-system.md` | Tokens hoje espalhados em 4 temas + inline |
| `05-rooms-and-devices.md` | Entidades por cômodo — a base da futura `rooms.config.ts` |
| `08-performance-tablet.md` | Achados A1–A4 desta auditoria + medições no tablet |

Critério de aceitação: um agente novo consegue trabalhar sem ler os 313 KB.
Risco: nenhum (só escrita em `docs/`).

## Fase 3 — Isolar o legado 🔒

**Bloqueada por R1 e R2.** Não faz sentido arquivar `views/main-grid/` sem antes
saber se `media_all_players.yaml` existe na máquina do HA.

Ordem quando desbloquear:

1. Mover **apenas** os 47 `SAFE_TO_MOVE` para `_archive/`, preservando o caminho
   original dentro da categoria
2. Um `README.md` por grupo: origem, geração, motivo, o que substituiu, risco de
   restauração
3. Validar que o dashboard continua carregando
4. Commit próprio, isolado
5. Os 98 `REQUIRES_REVIEW` ficam para uma passada seguinte, em lotes pequenos

`views/main-grid/` inteiro é `DO_NOT_MOVE` enquanto `views/main.yaml` usar
`!include_dir_merge_list`: retirar um arquivo muda o resultado do merge.

## Fase 4 — Fundação técnica 🔒

**Bloqueada por R5: Node.js e npm não estão instalados.** Verificado:
`node`, `npm`, `python`, `python3` ausentes; disponível apenas `perl`.

Quando houver Node (LTS):

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

| # | Ação | Ganho esperado | Risco |
|---|---|---|---|
| 6.1 | Redimensionar os 33 PNG de cômodo | 127 MB → ~21 MB de bitmap | mínimo |
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
