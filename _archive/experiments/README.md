# Experimentos

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** 2026-06 a 2026-07

## Motivo do arquivamento

Módulos JS que nunca entraram em `frontend.extra_module_url`: uma versão anterior do material Liquid Glass e dois módulos de sidebar que existiam **apenas** no `/config` do Home Assistant, trazidos para o repositório na Fase 2b.

## O que substituiu

`bruno-liquid-glass.js` e a rail atual (`bento-sidebar-card.js`).

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

Baixo. Nunca foram carregados.

## Arquivos

```
www/bruno-ui/cards/bruno-sidebar-panels.js
www/bruno-ui/core/bruno-liquid-glass_v1.js
www/bruno-ui/subviews/bruno-sidebar-subviews.js
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/experiments/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
