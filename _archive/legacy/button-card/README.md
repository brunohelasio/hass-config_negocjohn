# Legado — templates de button-card

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** geração "Mat", 2025 a 2026-03

## Motivo do arquivamento

Templates do `custom:button-card` que geravam os botões da interface antiga.

## O que substituiu

Componentes JS próprios. Os templates ainda ativos permanecem em `config/dashboards/templates/` porque `views/main.yaml` continua sendo carregado.

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

Baixo, mas `tpl_base.yaml` (que **não** foi movido) documenta a lógica de `state_on` por domínio, hoje reimplementada solta nos cards.

## Arquivos

```
dashboards/templates/button_card_templates/system_monitoring/sys_base.yaml
dashboards/templates/button_card_templates/system_monitoring/system-monitor.yaml
dashboards/templates/button_card_templates/ui_button_cards/header-cards.yaml
dashboards/templates/button_card_templates/ui_button_cards/live-tiles.yaml
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/legacy/button-card/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
