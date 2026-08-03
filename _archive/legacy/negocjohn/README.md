# Legado — herança do projeto ngocjohn

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** anterior a 2026-03

## Motivo do arquivamento

Arquivos do projeto de origem (`ngocjohn/hass-config`, ainda registrado como remote `upstream`), com entidades e cômodos que não existem nesta casa.

## O que substituiu

Equivalentes com as entidades reais do usuário.

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

Nenhum. As entidades referenciadas não existem neste Home Assistant.

## Arquivos

```
dashboards/shared/popup/camera_zahrada.yaml
dashboards/shared/popup/home_vietngoc.yaml
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/legacy/negocjohn/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
