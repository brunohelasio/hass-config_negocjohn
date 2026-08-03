# Legado — Mobile V1

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação, lote 2)
**Geração:** 2025, desativada em 2026-05-10

## Motivo do arquivamento

Primeira interface móvel paralela: quatro views (`mobile-home`, `mobile-security-cameras`, `mobile-masters-rooms`, `mobile-climate-media`). Os `!include` já estavam comentados em `ui-lovelace-main.yaml` desde 2026-05.

## O que substituiu

A Opção A (2026-07-09): estender a **própria shell** ao celular por media query.

## Verificação feita antes de mover

Inalcançável a partir de `ui-lovelace-main.yaml`; não referenciado por
nenhum arquivo alcançável; não citado em rollback de funcionalidade ativa.
Após a movimentação o conjunto alcançável ficou em **151**, idêntico ao de antes.

## Risco de restauração

Nenhum. Desativada há meses e substituída duas vezes desde então.

## Arquivos

```
dashboards/views/mobile-climate-media.yaml
dashboards/views/mobile-home.yaml
dashboards/views/mobile-masters-rooms.yaml
dashboards/views/mobile-security-cameras.yaml
```

## Como restaurar

```bash
git checkout pre-dashboard-architecture -- config/<caminho-original>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace ou ser carregado pelo HA.
