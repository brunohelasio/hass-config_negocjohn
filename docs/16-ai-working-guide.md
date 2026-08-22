# 16 — Guia de trabalho para IA

Leia isto **antes** de tocar em qualquer arquivo deste repositório.

## REGRA ZERO — continuidade entre sessões

**Primeiro abra `docs/CHECKPOINT-ATUAL.md`.** Ele é o estado operacional canônico e deve ser atualizado ao final de cada rodada. Não reconstrua o trabalho apenas pela memória do chat, pelo título das PRs ou pela branch mais recente visualmente.

Se houver conflito entre um documento histórico e o checkpoint, use esta ordem de autoridade:

1. `docs/CHECKPOINT-ATUAL.md`;
2. código da branch candidata indicada no checkpoint;
3. PR funcional atual;
4. documentação específica da rodada;
5. documentos históricos.

## Ordem de leitura

1. `docs/CHECKPOINT-ATUAL.md` — estado atual, branch/PR, contratos, pendências e validação física
2. `docs/LEIA-PRIMEIRO.md` — índice
3. este arquivo — procedimento de trabalho
4. documentação específica da rodada atual indicada no checkpoint
5. `docs/11-failed-experiments.md` antes de repetir uma solução já tentada
6. `docs/15-decisions-log.md` para decisões arquiteturais
7. somente depois, os documentos históricos necessários (`00`–`14`, relatórios, CLAUDE/AGENTS)

`CLAUDE.md` e `AGENTS.md` são fontes históricas extensas. **Não os leia inteiros por padrão**; procure a seção específica e confira se o contrato não foi superado no checkpoint.

## Fluxo operacional vigente

O repositório `brunohelasio/hass-config_negocjohn` é a fonte principal de diagnóstico. `main` é o último estado consolidado/aceito e **não deve receber uma candidata ainda não validada fisicamente**.

Para cada demanda:

1. consulte o checkpoint;
2. investigue primeiro o código/PR correto no GitHub;
3. identifique causa, arquivos envolvidos e solução;
4. classifique a execução em **MODO MANUAL**, **MODO CHAT-GITHUB** ou **MODO AGENTE**;
5. escolha o caminho de menor custo e menor risco;
6. implemente e valide;
7. atualize documentação e checkpoint;
8. informe branch, head, bundle, testes e pacote exato para o Everex;
9. aguarde validação Everex/iPhone antes de mergear.

### MODO MANUAL

Mudanças pequenas, determinísticas e de baixo risco. Informar arquivo, trecho atual, trecho novo, cache-bust e validação.

### MODO CHAT-GITHUB

Quando o diagnóstico estiver fechado e a alteração puder ser feita com segurança no GitHub. Criar/usar branch candidata, manter PR draft, executar validações disponíveis e deixar `main` intacto até o aceite físico. **Neste modo, commits/pushes feitos pelo conector fazem parte do fluxo aprovado; não pedir ao usuário para reproduzir manualmente a escrita já feita no GitHub.**

### MODO AGENTE

Somente quando houver necessidade real de execução local, build/harness complexo, testes fora do CI, refactor estrutural ou risco elevado.

## Documentação é parte da implementação

Uma rodada não está concluída apenas porque o código foi alterado.

Toda implementação relevante deve:

- atualizar `docs/CHECKPOINT-ATUAL.md`;
- criar/atualizar o documento específico da rodada;
- registrar decisão em `docs/15-decisions-log.md` quando houver consequência arquitetural ou regra que não pode ser esquecida;
- registrar tentativa rejeitada em `docs/11-failed-experiments.md` quando houver risco real de repetição futura;
- marcar documentos históricos como superados quando contiverem contratos perigosos.

## Invariantes que já quebraram o dashboard

### Crase em comentário dentro de template literal

Uma crase não escapada em comentário CSS/HTML/JS dentro de template literal pode fechar a string e derrubar o módulo. Use o detector vigente:

```bash
node scripts/validation/check-backtick.mjs --tudo
```

Quando o bundle antigo contiver falsos positivos históricos, valide explicitamente os fontes alterados antes do rebuild e registre a razão; não declare sucesso sem executar TypeScript/build depois.

### Ordem de carregamento é dependência

Os módulos clássicos consolidados em `legacy-runtime.generated.ts` ainda têm ordem significativa. Antes de mudar dependências entre temas/core, confira a ordem real de importação e não presuma que `extra_module_url` histórico continua sendo a única fonte.

### Optional chaining mascara falha

Chamadas como `globalThis.Modulo?.metodo?.()` podem falhar silenciosamente quando o módulo não carregou. Sintoma visual não prova que a lógica executou. Confirme carregamento, ordem e bundle.

### Home × subviews

Assimetrias entre Home e subviews são diagnósticas. Não replique automaticamente uma correção de um contexto no outro: confirme qual componente/tokens materializam cada superfície.

## Antes de alterar um componente

1. confirme que ele está no runtime ativo da branch;
2. leia o checkpoint e a documentação da rodada;
3. procure a mesma área em `11-failed-experiments.md` e no histórico relevante;
4. identifique se o valor é fonte, gerado ou bundle compilado;
5. altere a fonte correta;
6. preserve contratos marcados no checkpoint;
7. valide automaticamente;
8. gere novo bundle/cache-bust quando a fonte fizer parte do Vite;
9. valide visualmente em Everex/iPhone antes de merge.

## Arquivos gerados e bundle

Não editar bundle compilado como fonte de implementação. O código em `dashboard-src/` e módulos clássicos incorporados pelo runtime são a fonte; `config/www/dashboard/` é produto do build.

Quando o build gerar novo hash:

- confirmar `config/www/dashboard/manifest.json`;
- confirmar o ponteiro ativo em `config/configuration.yaml`;
- registrar o novo bundle no checkpoint/PR;
- indicar exatamente o que deve ser copiado para o Everex.

## Validação mínima de candidata

Quando a esteira estiver disponível:

1. YAML;
2. detector de crase nos fontes relevantes;
3. TypeScript;
4. ESLint;
5. Vitest;
6. Vite build;
7. manifesto/compressão;
8. guard de escopo;
9. confirmação do bundle ativo;
10. validação física Everex/iPhone.

Nunca confundir “código parece correto” com “build executado e aprovado”.

## `.pnpm-store`

O ruído local `.pnpm-store/...` no GitHub Desktop já foi investigado e foi deliberadamente deixado quieto. **Não pedir para descartar, excluir, commitar, adicionar ao `.gitignore` nem repetir a investigação**, salvo pedido explícito do usuário. Consulte o checkpoint.

## Home Assistant em execução

O repositório não é necessariamente espelho integral do `/config` do HA. Quando uma conclusão depender da existência/estado atual de entidade ou arquivo exclusivamente no HA real, use evidência do repositório quando houver e marque o restante para validação física; não invente `entity_id`.

## Como registrar decisões

Em `docs/15-decisions-log.md`:

```text
Data:
Decisão:
Contexto:
Alternativas:
Motivo:
Consequências:
Arquivos afetados:
Status:
```

## Como não reintroduzir legado

- nada em `_archive/` entra no runtime novo sem decisão explícita;
- não copiar padrão legado sem verificar se ainda é o padrão vigente;
- não criar nova duplicação quando existe componente parametrizado;
- antes de polling/`setInterval`, verificar se o HA já entrega o dado de forma reativa;
- antes de mudar contrato TV/Hub/Office/cortina/câmeras, conferir o checkpoint.

## Como não fazer alterações demais de uma vez

- uma rodada resolve um conjunto coerente e diagnosticado;
- não misturar limpeza genérica com correção funcional;
- não avançar quando a validação física reprovar o comportamento anterior;
- registrar reprovação e causa antes da nova tentativa.

## Fechamento obrigatório de cada rodada

A resposta ao usuário deve terminar com:

- **branch candidata**;
- **head SHA**;
- **bundle ativo**;
- **testes realmente executados e resultado**;
- **arquivos/pastas exatos para copiar ao Everex**;
- **o que NÃO copiar**;
- **checklist objetivo de validação física**;
- confirmação de que **não houve merge para `main`**.
