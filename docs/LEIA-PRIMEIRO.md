# Leia primeiro — índice dos documentos do projeto

Atualizado em **2026-08-05**, ao fim da Fase 5c.

---

## Para retomar o trabalho

| ordem | documento | para quê |
|---|---|---|
| 1 | **`PROMPT-CONTINUIDADE-V2.md`** | cole numa sessão nova, com qualquer IA. Arquitetura, decisões, o que foi feito, onde parou, armadilhas e como prosseguir |
| 2 | **`ROTEIRO-CONSOLIDADO-V3.md`** | o plano vigente: implementado, pendente e sequência das fases |
| 3 | **`RELATORIO-CONSOLIDADO.md`** | o histórico completo: cada fase, cada defeito, cada decisão, com as medições |

Esses três bastam para retomar do zero, sem o histórico da conversa.

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
| `12-migration-plan.md` | registro de cada fase, com causa e correção |
| `13-testing-and-validation.md` | como medir: harness, conteúdo, tema e resolução do tablet, detector da crase |
| `15-decisions-log.md` | decisões com consequência arquitetural, e o motivo de cada uma |
| `16-ai-working-guide.md` | como trabalhar neste repositório |

---

## Histórico e superados

| documento | situação |
|---|---|
| `ANALISE-TECNICA-E-ROTEIRO-REVISTO-HA.md` | análise externa que motivou a revisão do roteiro. Consulta |
| `ROTEIRO-CONSOLIDADO-V2.md` | **superado pela V3.** A Parte I (posicionamento técnico, com as seis correções de rota) continua válida e é a justificativa das decisões |
| `PROMPT-CONTINUIDADE.md` | **superado pela V2.** Descreve a 5c ainda quebrada |
| `RETOMADA.md` | página de retomada de uma sessão anterior |
| `bruno-shell-spec.md` | especificação da shell |
| `BENTO_REACT_PARA_YAML.md` | referência de conversão |

---

## Antes de escrever qualquer linha de código

```bash
cd dashboard-src && npm run check                    # typecheck + lint + testes + build
node scripts/validation/check-backtick.mjs --tudo    # a armadilha da crase — 9 ocorrências
```

E duas regras que já custaram caro:

- **`subview-styles.generated.ts` e `subviews.config.ts` são GERADOS.** Editar o
  gerador em `scripts/validation/`, nunca o arquivo.
- **Medir com o tema Josh, a 1920×1200 e a 1280×720.** Um defeito real do A/C era
  invisível na resolução menor.
