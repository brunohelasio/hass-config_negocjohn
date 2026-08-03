# Legado — interface "Mat" (grid de botões)

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação, lote 2)
**Geração:** 2025 a 2026-04

## Motivo do arquivamento

Blocos do grid do tablet montados com `custom:button-card` e `custom:streamline-card`: chips, câmeras, climatização, dispositivos, mídia, cabeçalho, rodapé e a sidebar YAML. Vinham da view `views/main.yaml` (path `summary`), aposentada no lote 2.

Continuavam sendo **parseados a cada carregamento** do dashboard, porque `views/main.yaml` usava `!include_dir_merge_list main-grid/`, que puxava a pasta inteira — usada ou não.

## O que substituiu

A shell (`custom:bruno-shell`) e os componentes JS. **Os templates em `config/dashboards/templates/` NÃO foram movidos**: continuam sendo usados por popups, colunas, `system-grid` e `github-grid`.

## Verificação feita antes de mover

Inalcançável a partir de `ui-lovelace-main.yaml`; não referenciado por
nenhum arquivo alcançável; não citado em rollback de funcionalidade ativa.
Após a movimentação o conjunto alcançável ficou em **151**, idêntico ao de antes.

## Risco de restauração

Baixo. Nada aqui era alcançável pelo usuário: verificou-se que **nenhum `navigation_path` aponta para `summary`**.

## Arquivos

```
dashboards/shared/grid-cards/cameras.yaml
dashboards/shared/grid-cards/climate-status.yaml
dashboards/shared/grid-cards/common-rooms.yaml
dashboards/shared/grid-cards/devices.yaml
dashboards/shared/grid-cards/home-status.yaml
dashboards/shared/grid-cards/main-rooms.yaml
dashboards/shared/grid-cards/security-status.yaml
dashboards/shared/sidebar/sidebar_tablet_landscape.yaml
dashboards/views/main-grid/a-chips.yaml
dashboards/views/main-grid/cameras.yaml
dashboards/views/main-grid/climate.yaml
dashboards/views/main-grid/cover-screen.yaml
dashboards/views/main-grid/devices.yaml
dashboards/views/main-grid/floorplan.yaml
dashboards/views/main-grid/grid_media.yaml
dashboards/views/main-grid/header.yaml
dashboards/views/main-grid/home.yaml
dashboards/views/main-grid/horizontal_movies.yaml
dashboards/views/main-grid/mainrooms.yaml
dashboards/views/main-grid/rooms2.yaml
dashboards/views/main-grid/security.yaml
dashboards/views/main-grid/sidebar.yaml
dashboards/views/main-grid/y-quick-actions.yaml
dashboards/views/main-grid/z-footer.yaml
```

## Como restaurar

```bash
git checkout pre-dashboard-architecture -- config/<caminho-original>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace ou ser carregado pelo HA.
