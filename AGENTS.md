# AGENTS.md

> **Este arquivo era uma cópia do `CLAUDE.md` e foi arquivado em 2026-08-02.**
>
> Verificação feita antes de arquivar: `AGENTS.md` era **subconjunto estrito** do
> `CLAUDE.md` — nenhuma seção própria, e o `CLAUDE.md` tinha duas a mais. Eram
> 140 KB duplicados que já estavam divergindo, com o risco de dois agentes
> operarem sob instruções diferentes.
>
> Cópia integral preservada em
> `_archive/deprecated/original-path/AGENTS.md`.

## Onde estão as instruções agora

**Leia, nesta ordem:**

1. [`docs/16-ai-working-guide.md`](docs/16-ai-working-guide.md) — como trabalhar
   neste repositório sem quebrar nada. **Comece por aqui.**
2. [`CLAUDE.md`](CLAUDE.md) — regras de ouro e histórico completo das revisões
3. [`docs/00-project-overview.md`](docs/00-project-overview.md) — o que é o projeto
4. [`PRE_MIGRATION_AUDIT.md`](PRE_MIGRATION_AUDIT.md) — diagnóstico técnico

## As duas regras de ouro (resumo — o detalhe está no `CLAUDE.md`)

1. **Nunca excluir código. Comentar antes de substituir.**
2. **Só entregar quando o usuário autorizar.**

## O mínimo para não quebrar o dashboard

- **Nunca use crase dentro de comentário em template literal.** Já derrubou o
  dashboard 4 vezes. Verifique com
  `powershell -File scripts/validation/check-syntax.ps1`.
- **Ao alterar um JS, suba o `?v=` em `config/configuration.yaml`** e comente o
  valor anterior ao lado. Sem isso, o tablet continua com o arquivo velho.
- **A ordem das linhas em `frontend.extra_module_url` é o grafo de dependências.**
  Não há `import`; o acoplamento é por `globalThis`. Não reordene sem entender.
- **O repositório não é espelho fiel do `/config` do Home Assistant.** Confirme
  antes de classificar um arquivo como órfão.
- **Nada em `_archive/` pode voltar ao build, virar recurso ou ser carregado
  pelo HA.**

## Documentação completa

Os 17 documentos em [`docs/`](docs/) cobrem arquitetura, inventário,
componentes, cômodos, integrações, design system, performance no tablet,
problemas conhecidos, experimentos fracassados, plano de migração, validação,
publicação e registro de decisões.
