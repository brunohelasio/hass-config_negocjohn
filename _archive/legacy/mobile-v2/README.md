# Legado — Mobile V2

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação, lote 2)
**Geração:** 2025-05, desativada em 2026-05-10

## Motivo do arquivamento

Segunda interface móvel paralela: quatro views (`casa`, `comodos`, `midia`, `cameras`). Defeito estrutural documentado: **a barra de navegação nunca foi conectada a view nenhuma** — o arquivo ficou isolado.

## O que substituiu

Substituída pelo Mobile V3 e depois pela Opção A (shell no celular).

## Verificação feita antes de mover

Inalcançável a partir de `ui-lovelace-main.yaml`; não referenciado por
nenhum arquivo alcançável; não citado em rollback de funcionalidade ativa.
Após a movimentação o conjunto alcançável ficou em **151**, idêntico ao de antes.

## Risco de restauração

Nenhum. Nunca funcionou por completo.

## Arquivos

```
dashboards/views/mobile-v2-cameras.yaml
dashboards/views/mobile-v2-casa.yaml
dashboards/views/mobile-v2-comodos.yaml
dashboards/views/mobile-v2-midia.yaml
```

## Como restaurar

```bash
git checkout pre-dashboard-architecture -- config/<caminho-original>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace ou ser carregado pelo HA.
