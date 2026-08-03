# Descontinuados

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** diversas

## Motivo do arquivamento

Arquivos sem geração identificável, incluindo a pasta `shared/hidden/` (nunca renderizada), duplicatas literais como o par `sticky_menu.yaml` / `stiicky-menu.yaml` (erro de digitação), backups explícitos e o `AGENTS.md`.

## O que substituiu

No caso do `AGENTS.md`: o `CLAUDE.md` (do qual era subconjunto estrito) mais os 17 documentos em `docs/`. Um ponteiro ficou no lugar.

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

Baixo.

## Arquivos

```
_archive/deprecated/original-path/AGENTS.md
dashboards/shared/cards-sticky-menu.yaml
dashboards/shared/hidden/atv_remote.yaml
dashboards/shared/hidden/floorplan_landscape.yaml
dashboards/shared/hidden/floorplan_portrait.yaml
dashboards/shared/hidden/movie_slide.yaml
dashboards/shared/hidden/sticky_menu.yaml
dashboards/shared/hidden/stiicky-menu.yaml
dashboards/shared/hidden/ymovie.yaml
dashboards/views/shell/section_roborock.yaml
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/deprecated/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
