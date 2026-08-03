# `_archive/` — legado isolado

Código retirado de circulação, **preservado e não excluído**.

## Regras invioláveis

Nada aqui pode:

- entrar no build
- ser importado por `src/` ou por qualquer módulo ativo
- ser registrado como recurso do Lovelace
- ser carregado pelo Home Assistant
- ser copiado para o `/config` da VM
- ser alterado como se ainda fosse código ativo

## Estrutura

O caminho original é preservado dentro de cada categoria:

```
_archive/<categoria>/original-path/config/<caminho original>
```

Exemplo: `config/dashboards/shared/honeycomb/living.yaml` está em
`_archive/legacy/negocjohn/original-path/config/dashboards/shared/honeycomb/living.yaml`.

| Categoria | Arquivos | Geração |
|---|---|---|
| `legacy/popup-navigation/` | 42 | cômodos por pop-up (2026-03 a 06) |
| `legacy/mobile-v3/` | 34 | Mobile V3 (2026-05) |
| `legacy/bento-grid/` | 32 | Bento Grid (2026-04 a 06) |
| `legacy/yaml-layout-card/` | 30 | snippets de layout-card (2026-03 a 05) |
| `legacy/mat-interface/` | 24 | interface "Mat", grid de botões (2025 a 2026-04) |
| `deprecated/` | 11 | sem geração identificável + `AGENTS.md` |
| `legacy/negocjohn/` | 7 | herança do projeto de origem |
| `legacy/button-card/` | 4 | templates da geração "Mat" |
| `legacy/mobile-v1/` | 4 | Mobile V1 (2025) |
| `legacy/mobile-v2/` | 4 | Mobile V2 (2025-05) |
| `experiments/` | 3 | módulos JS nunca carregados |
| **Total** | **195** | |

Arquivado em dois lotes:

- **Lote 1** — 93 arquivos: órfãos que não eram citados em nenhum rollback.
- **Lote 2** — 102 arquivos: aposentadoria do ramo `views/main.yaml` (D2) e dos
  rollbacks de gerações mortas (D1), autorizadas pelo usuário.

Cada categoria tem um `README.md` com origem, motivo, o que a substituiu, lista
de arquivos e risco de restauração.

## Critério usado (Fase 3, 2026-08-02)

Um arquivo só foi movido se passou nos **três** testes:

1. **Inalcançável** a partir de `config/dashboards/ui-lovelace-main.yaml`
   seguindo `!include` em linhas não comentadas;
2. **Não referenciado por nenhum arquivo alcançável**, por caminho, em linha ativa;
3. **Não citado em nenhuma linha de rollback comentada** de arquivo ativo.

O terceiro teste foi decisivo: **58 dos 147 órfãos são citados em comentários de
rollback** e estão a um "descomentar" de voltar a funcionar. Movê-los quebraria
silenciosamente o mecanismo de reversão que a Regra de Ouro nº 1 criou.
Continuam em `config/` — ver "O que NÃO foi movido", abaixo.

## Validação

| Verificação | Lote 1 | Lote 2 |
|---|---|---|
| Arquivos alcançáveis, antes → depois | **200 → 200** | **151 → 151** |
| `!include` sem alvo | nenhum novo | nenhum novo |
| Todo arquivo alcançável existe no disco | ✓ | ✓ |
| Sintaxe JS (`node --check`) | 52/52 | 52/52 |
| Recursos de `configuration.yaml` resolvem | 52/52 | 52/52 |

A queda de 200 para 151 entre os lotes é o efeito **pretendido** do D2: a
aposentadoria do ramo `views/main.yaml`, que puxava 39 arquivos por
`!include_dir_merge_list` a cada carregamento.

`config/dashboards/`: **354 → 163 arquivos YAML.**

## O que **não** foi movido, e por quê

Restam 12 arquivos não alcançáveis em `config/`, todos deliberadamente:

| Item | Motivo |
|---|---|
| `dashboards/floorplan/` (7) | **em uso** — incluídos por caminho absoluto `/config/dashboards/floorplan/`, que um resolvedor local não consegue seguir |
| `views/shell/section_home.yaml` | rollback de **uma linha** da Home V1, feature flag ativa em `bento_shell.yaml` |
| `views/main-grid/v2/bento_comodos_strip.yaml` | rollback da Home V2 **atual** |
| `views/main-grid/v2/bento_quick_actions_v2.yaml` | idem |
| `views/main-grid/v2/legacy/bento_dynamic_conditional.yaml` | fallback da coluna dinâmica **atual** |
| `shared/snippets/view-background.yaml` | rollback citado em `views/system.yaml`, que continua ativa |

**Regra aplicada:** rollback de funcionalidade **ativa** fica; rollback de
geração **morta** vai para o arquivo morto.

Também não tocados: `config/dashboards/templates/` (ainda usados por popups,
colunas, `system-grid` e `github-grid`), `views/mobile/*.yaml` (5 views do Mobile
V3 ainda ativamente incluídas), os 14 PNGs de cômodo citados em rollback, e
`config/custom_components/` (fora do escopo do frontend).

## Nota sobre a VM

Arquivar aqui **não limpa o `/config` do Home Assistant**. O fluxo de publicação
é copiar-e-sobrescrever, que nunca apaga — os 93 arquivos continuam na VM até
serem removidos de lá explicitamente. Ver
[`docs/14-deployment-and-cache.md`](../docs/14-deployment-and-cache.md).
