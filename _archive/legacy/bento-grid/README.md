# Legado — Bento Grid

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** 2026-04 a 2026-06

## Motivo do arquivamento

Geração em que a Home era um grid Bento montado em YAML.

## O que substituiu

A shell (`custom:bruno-shell`) com seções e a Home V2/V3 em `section_home_v2.yaml`.

## Verificação feita antes de mover

Cada arquivo aqui passou por três testes:

1. **Inalcançável** a partir de `config/dashboards/ui-lovelace-main.yaml`
   seguindo `!include` em linhas não comentadas;
2. **Não referenciado por nenhum arquivo alcançável**, nem por caminho nem
   por nome, em linha ativa;
3. **Não citado em nenhuma linha de rollback comentada** de arquivo ativo —
   arquivos "a um descomentar" de voltar **não** foram movidos.

Após a movimentação, o conjunto de arquivos alcançáveis permaneceu em **200**,
idêntico ao de antes.

## Risco de restauração

Baixo. Os arquivos `shared/grid-cards/bento_*.yaml` citados em comentários de rollback **não** foram movidos.

## Arquivos

```
dashboards/shared/grid-cards/bento_sidebar.yaml
dashboards/shared/grid-cards/bento_top_badges.yaml
dashboards/views/disabled/floorplan.yaml
dashboards/views/media-grid/footer_copy.yaml
dashboards/views/media-grid/movies.yaml
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/legacy/bento-grid/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
