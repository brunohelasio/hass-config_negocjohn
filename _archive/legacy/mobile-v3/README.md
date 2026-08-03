# Legado — Mobile V3 (componentes compartilhados)

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** 2026-05, abandonada em 2026-07-09

## Motivo do arquivamento

Terceira tentativa de interface móvel paralela. Os wrappers aqui reusavam arquivos do grid do tablet (calibrados para células de ~245 px) dentro de contêineres de 160–170 px, cortando o conteúdo. A barra de navegação apontava para o slug `/lovelace/`, **especulativo** — o slug real é `ngocjohn-main`, então os links nunca funcionaram.

## O que substituiu

A Opção A (2026-07-09): estender a **própria shell** ao celular por media query, mantendo um único modelo de interação em vez de um mundo paralelo.

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

Baixo. Nada aqui funcionava de fato. As 5 views do V3 em `views/mobile/` **continuam ativas** no dashboard e não foram movidas — aposentá-las é decisão pendente.

## Arquivos

```
dashboards/shared/grid-cards/mobile-media.yaml
dashboards/shared/grid-cards/mobile_comodos_rail.yaml
dashboards/shared/grid-cards/mobile_sala_wrapper.yaml
dashboards/shared/grid-cards/mobile_top_badges.yaml
dashboards/shared/mobile-bottom-nav.yaml
dashboards/shared/mobile-pill-nav.yaml
dashboards/shared/mobile/mobile_card_cozinha.yaml
dashboards/shared/mobile/mobile_card_lavabo.yaml
dashboards/shared/mobile/mobile_card_office.yaml
dashboards/shared/mobile/mobile_card_quarto_casal.yaml
dashboards/shared/mobile/mobile_card_quarto_marina.yaml
dashboards/shared/mobile/mobile_card_quarto_miguel.yaml
dashboards/shared/mobile/mobile_card_room_compact.yaml
dashboards/shared/mobile/mobile_card_sala_compact.yaml
dashboards/shared/mobile/mobile_sala_hero.yaml
dashboards/shared/popup/mobile_mais_sheet.yaml
dashboards/shared/popup/mobile_more_menu.yaml
dashboards/shared/sidebar/sidebar_mobile_home.yaml
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/legacy/mobile-v3/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
