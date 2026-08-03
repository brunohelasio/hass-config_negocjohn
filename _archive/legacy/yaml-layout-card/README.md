# Legado — snippets de layout-card

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** 2026-03 a 2026-05

## Motivo do arquivamento

Fragmentos de estilo e layout injetados por `!include` em popups e views, da época em que o layout era montado inteiramente em YAML com `custom:grid-layout` e `card_mod`.

## O que substituiu

CSS nos próprios componentes (Shadow DOM) e, na arquitetura de destino, tokens de design centralizados.

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

Baixo. São fragmentos de apoio, sem lógica.

## Arquivos

```
dashboards/shared/snippets/card-style-sticky-menu.yaml
dashboards/shared/snippets/layout-column.yaml
dashboards/shared/snippets/layout-header-content.yaml
dashboards/shared/snippets/layout-live-tile-mini.yaml
dashboards/shared/snippets/layout-live-tile.yaml
dashboards/shared/snippets/layout-page-columns-kodi.yaml
dashboards/shared/snippets/layout-page-columns-one.yaml
dashboards/shared/snippets/layout-page-columns.yaml
dashboards/shared/snippets/layout-page-title-with-2-badges.yaml
dashboards/shared/snippets/layout-page-title.yaml
dashboards/shared/snippets/main-grid-swipe-params.yaml
dashboards/shared/snippets/media-control-mute.yaml
dashboards/shared/snippets/media-control-next.yaml
dashboards/shared/snippets/media-control-playpause.yaml
dashboards/shared/snippets/media-control-prev.yaml
dashboards/shared/snippets/media-control-vol-down.yaml
dashboards/shared/snippets/media-control-vol-up.yaml
dashboards/shared/snippets/media-slide-focus-bento-square.yaml
dashboards/shared/snippets/media-slide-focus-bento.yaml
dashboards/shared/snippets/parameters-page-title-swipe-card.yaml
dashboards/shared/snippets/style-header-markdown.yaml
dashboards/shared/snippets/style-markdown-page-title.yaml
dashboards/shared/snippets/style-page-title-swipe-card-tile.yaml
dashboards/shared/snippets/style-page-title-swipe-card.yaml
dashboards/shared/snippets/style-person-popup.yaml
dashboards/shared/snippets/style-section-heading.yaml
dashboards/shared/snippets/style_popup_cardmod.yaml
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/legacy/yaml-layout-card/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
