# Backup — estado anterior à reestruturação arquitetural

Gerado em **2026-08-02** (Fase 0 — Proteção). Nenhum arquivo do projeto foi
modificado, movido ou excluído para produzir este backup.

## Identificação do projeto

| Item | Valor |
|---|---|
| Raiz real do projeto | `C:\GitHub\hass-config_negocjohn\hass-config_negocjohn` |
| Tipo | Repositório de configuração do Home Assistant (config dir espelhado) |
| Git | Sim |
| Branch | `main` |
| Remote `origin` | `https://github.com/brunohelasio/hass-config_negocjohn.git` |
| Remote `upstream` | `https://github.com/ngocjohn/hass-config.git` (projeto de origem) |
| Commit do checkpoint | `e0dc9da34f194813342f6d6c607a7e9e2ecdde37` |
| Tag do checkpoint | `pre-dashboard-architecture` |

## Como o checkpoint foi criado

A intenção era executar `git add -A` + commit. **Durante a auditoria, um processo
externo commitou a árvore de trabalho** com a mensagem `Atualização`, autoria
`brunohelasio <brunohelasio@gmail.com>`, em `2026-08-02 10:09:49 -0300`.

Esse commit (`e0dc9da3`) contém exatamente o conteúdo que seria capturado pelo
checkpoint: **179 arquivos** (121 adicionados + 58 modificados), incluindo todo o
trabalho não commitado que existia no início da sessão (97 entradas em
`git status`). Verificado em `checkpoint-commit-files.txt`.

Como o conteúdo é equivalente, **a tag foi anexada a esse commit** em vez de criar
um commit redundante:

```
git tag -a pre-dashboard-architecture -m "..." e0dc9da3
```

**Consequência operacional registrada como risco:** há um processo externo que
commita esta árvore automaticamente. Ver `RISCOS` em `PRE_MIGRATION_AUDIT.md`.

## Conteúdo deste diretório

| Arquivo | O que é |
|---|---|
| `backup-metadata.md` | Este documento |
| `git-status-pre-checkpoint.txt` | `git status` capturado (já pós-commit externo) |
| `git-log-pre-checkpoint.txt` | Últimos 25 commits + HEAD no momento da captura |
| `checkpoint-commit-files.txt` | Os 179 arquivos do commit do checkpoint |
| `directory-tree.txt` | Árvore de diretórios (sem `.git`; `custom_components` só no 1º nível) |
| `active-entrypoints.md` | Entrypoints reais do dashboard |
| `active-resources.md` | Os 52 recursos JS carregados pelo Home Assistant |
| `critical-files.txt` | 62 arquivos considerados críticos |
| `file-hashes.txt` | SHA-256 dos 62 arquivos críticos |
| `snapshot/` | Cópia literal dos 62 arquivos críticos (3,5 MB), conferida contra os hashes |

## O que **não** foi copiado (proposital)

`.git`, `config/custom_components/**` (2.485 arquivos de integrações
vendorizadas, restauráveis pelo Git/HACS), `config/www/images` e
`config/www/bruno-ui/assets` (51 MB de binários já versionados), `tmp/`,
caches e logs.

## Restauração

Restaurar **um arquivo** a partir do snapshot:

```bash
cp _backups/pre-architecture-migration/snapshot/config/www/bruno-ui/core/bruno-shell.js config/www/bruno-ui/core/bruno-shell.js
```

Restaurar **todo o projeto** ao ponto do checkpoint:

```bash
git checkout pre-dashboard-architecture -- .
```

> **Nota sobre finais de linha:** o repositório está com `core.autocrlf` ativo.
> Ao serem commitados, os arquivos do `snapshot/` sofrem a mesma normalização
> LF↔CRLF que os originais — cópia e original permanecem equivalentes. Ainda
> assim, para restauração byte-a-byte prefira `git checkout pre-dashboard-architecture`,
> que é a fonte autoritativa; o `snapshot/` é conveniência para inspeção rápida.

Conferir se um arquivo crítico foi alterado desde o checkpoint:

```bash
sha256sum -c _backups/pre-architecture-migration/file-hashes.txt
```

## Backup externo

Existe uma cópia externa integral anterior a esta reestruturação, mantida pelo
usuário fora do repositório. **Ela não foi lida, alterada ou referenciada por
este processo.**
