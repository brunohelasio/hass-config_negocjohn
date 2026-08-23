# Leia primeiro — índice dos documentos do projeto

Atualizado em **2026-08-22**. O estado operacional vivo fica em `CHECKPOINT-ATUAL.md`.

---

## Para retomar o trabalho

> **PASSO ZERO:** leia **`CHECKPOINT-ATUAL.md`** antes de qualquer outro documento. Ele registra a branch/PR realmente vigente, contratos que não podem regredir, problemas já abandonados, estado da validação física e regras de publicação. Em caso de conflito com documentos históricos, o checkpoint prevalece.

| ordem | documento | para quê |
|---|---|---|
| 0 | **`CHECKPOINT-ATUAL.md`** | estado operacional canônico da rodada atual; leitura obrigatória em todo chat/sessão nova |
| 1 | **`PROMPT-CONTINUIDADE-V2.md`** | arquitetura e histórico consolidado de referência; pode conter estado operacional superado pelo checkpoint |
| 2 | **`ROTEIRO-CONSOLIDADO-V3.md`** | plano de migração e sequência das fases |
| 3 | **`RELATORIO-CONSOLIDADO.md`** | histórico amplo: fases, defeitos, decisões e medições |

O checkpoint existe justamente para evitar que uma IA precise reconstruir o estado corrente lendo PRs ou conversas antigas. Os demais documentos aprofundam arquitetura e histórico.

---

## Base de conhecimento (Fase 2)

`00` a `16` — arquitetura, inventário, entrypoints, componentes, cômodos,
integrações, design system, performance, defeitos conhecidos, implementações que
deram certo, experimentos que falharam, plano de migração, testes e validação,
publicação e cache, registro de decisões, guia de trabalho para IA.

Os que mais mudam e mais valem consulta:

| documento | conteúdo |
|---|---|
| `07-design-system.md` | tokens, **Hugeicons**, material dos temas, requisito do `<main>` |
| `11-failed-experiments.md` | tentativas que não devem ser repetidas sem nova evidência |
| `12-migration-plan.md` | registro de cada fase, com causa e correção |
| `13-testing-and-validation.md` | como medir: harness, conteúdo, tema e resolução do tablet, detector da crase |
| `15-decisions-log.md` | decisões com consequência arquitetural, e o motivo de cada uma |
| `16-ai-working-guide.md` | como trabalhar neste repositório |
| `38-v3-josh-hemma-lavabo-20260822.md` | rodada V3 atual: Josh, Hemma e Lavabo |
| `39-ajustes-gerais-20260823.md` | **referencia de consulta** dos ajustes A/B/C: causa, arquivo, antes/depois e rollback por item |

---

## Histórico e superados

| documento | situação |
|---|---|
| `ANALISE-TECNICA-E-ROTEIRO-REVISTO-HA.md` | análise externa que motivou a revisão do roteiro. Consulta |
| `ROTEIRO-CONSOLIDADO-V2.md` | **superado pela V3.** A Parte I continua válida como justificativa histórica |
| `PROMPT-CONTINUIDADE.md` | **superado pela V2.** Descreve a 5c ainda quebrada |
| `RETOMADA.md` | página de retomada de uma sessão anterior |
| `bruno-shell-spec.md` | especificação da shell |
| `BENTO_REACT_PARA_YAML.md` | referência de conversão |

Documentos históricos podem conter contratos que já mudaram. **Nunca usar um contrato histórico para substituir o que estiver no `CHECKPOINT-ATUAL.md` e no código da branch candidata.**

---

## Antes de escrever qualquer linha de código

1. Leia `CHECKPOINT-ATUAL.md`.
2. Confirme no GitHub a branch/PR indicada nele.
3. Consulte `11-failed-experiments.md` antes de repetir solução já tentada.
4. Só então faça diagnóstico e escolha MODO MANUAL / CHAT-GITHUB / AGENTE.

Validação padrão quando a execução local/CI estiver disponível:

```bash
cd dashboard-src && npm run check
node scripts/validation/check-backtick.mjs --tudo
```

Regras que já custaram caro:

- **`subview-styles.generated.ts` e `subviews.config.ts` são GERADOS.** Editar o gerador em `scripts/validation/`, nunca o arquivo gerado quando esse contrato estiver vigente na rodada.
- **Medir com o tema Josh, a 1920×1200 e a 1280×720**, além do iPhone quando houver alteração mobile.
- **Não mergear candidata antes da validação física Everex/iPhone.**
- **Ao fechar uma rodada, documentar e informar branch, head, bundle, testes e pacote exato do Everex.**
