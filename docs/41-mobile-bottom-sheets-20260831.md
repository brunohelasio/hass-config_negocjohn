# Bottom sheets mobile — identidade e gesto unificados (2026-08-31)

## Escopo autorizado

Rodada exclusiva do modo mobile para uniformizar todas as folhas inferiores do
dashboard. O tablet continua usando a side sheet lateral e a composição já
validada.

Entraram no escopo:

- folhas de Iluminação, Hub de Mídia/Estação de Trabalho,
  Ar-condicionado e Eletrodomésticos das seis subviews;
- folha global de Iluminação aberta pela faixa superior;
- comportamento de arrastar, soltar, retornar e fechar;
- cromografia superior das folhas.

Não entraram no escopo alturas, conteúdo interno, rail, câmeras, cards, tiles,
entidades, serviços nem arquitetura das subviews.

## Contrato visual aplicado

No telefone, todas as folhas passam a apresentar uma alça horizontal real,
centralizada no topo. Chevrons de recolhimento e botões X deixaram de ser
visíveis. O toque no scrim continua disponível como rota secundária de
fechamento.

O markup legado dos chevrons e dos botões X foi preservado para rollback. As
regras mobile o retiram visualmente e a alça passa a ser a indicação única do
gesto. Na folha global, o botão de fechar continua acessível a tecnologias
assistivas, mas fica recortado visualmente no breakpoint mobile.

## Contrato do gesto

O movimento agora segue o dedo em proporção 1:1. A decisão de fechamento usa
dois sinais:

- distância proporcional à altura da folha, com limite entre 72 e 132 px;
- flick descendente a partir de 18 px e velocidade de 0,55 px/ms.

Um arrasto curto retorna ao topo em 180 ms. Um arrasto suficiente continua do
pixel exato da soltura até a base, com duração calculada pelo trecho restante,
entre 130 e 250 ms. A superfície deixa de combinar deslocamento com fade; a
entrada e a saída mobile usam somente transformação vertical.

O gesto começa na alça/faixa superior ou em uma área não interativa da folha.
Botões, sliders, links, campos e regiões editáveis não iniciam fechamento. Se o
conteúdo rolável estiver afastado do topo, a rolagem tem prioridade.

## Implementação

- `dashboard-src/src/services/ui/mobile-sheet-motion.ts`
  centraliza limiar, velocidade e duração.
- `dashboard-src/src/services/ui/mobile-sheet-motion.test.ts`
  cobre distância, flick, retorno e duração.
- `dashboard-src/src/components/rooms/bruno-room-subview.ts`
  aplica o gesto e a alça às quatro famílias de folhas das subviews.
- `dashboard-src/src/components/rooms/subview-phone.styles.ts`
  define a linguagem visual mobile, oculta o cromado anterior e mantém o
  tablet fora do override.
- `dashboard-src/src/components/status/bruno-status-lights-sheet.ts`
  aplica o mesmo contrato à folha global, preservando o gesto horizontal do
  tablet.
- `scripts/harness/gen-shell-harness.mjs`
  mede alça, ausência de chevron/X, retorno curto e continuidade da soltura;
  também carrega explicitamente o chunk lazy da subview.

## Validação local

- TypeScript: aprovado.
- ESLint de `src`: aprovado.
- Vitest: 19 arquivos e 288 testes aprovados.
- Detector de crases direcionado: seis fontes aprovadas. A varredura ampla
  continua encontrando somente ocorrências conhecidas em terceiros e artefatos
  de build.
- Harness mobile 428 x 926: aprovado. No arrasto de 122 px, a folha media
  122 px antes e imediatamente depois da soltura, comprovando ausência do salto
  ao topo.
- Folha global 428 x 926: alça visível, X invisível, continuidade e fechamento
  por arrasto aprovados.
- Harness tablet 1920 x 1200, tema Josh: aprovado; oito itens na rail, nenhuma
  peça mobile visível e geometria existente preservada.

Bundle ativo local e no Everex: `bruno-dashboard.qBASlcMq.js`, com
`chunks/main.D2BcXk8C.js` e
`chunks/bruno-room-subview.HHRyAifU.js`.

## Rollback e publicação

Snapshot anterior das fontes:

`tmp/rollback-20260831-mobile-bottom-sheet-gesture/`

O bundle canônico anterior é `bruno-dashboard.Dq2NEBNk.js` e permanece também
no Everex e no backup da sincronização de 2026-08-30.

A rodada foi publicada no Everex em 2026-08-31. Antes da escrita foi criado o
backup `tmp/everex-preflight-20260831-mobile-bottom-sheet-gesture/`, contendo o
`configuration.yaml` e o diretório `www/dashboard` anteriores. O dashboard e
seus chunks foram copiados primeiro e o `configuration.yaml`, por último.

A conferência pós-publicação encontrou 29/29 pares local/Everex idênticos por
SHA-256. O grafo ativo alcança sete módulos a partir de
`bruno-dashboard.qBASlcMq.js`, sem arquivo ausente. O entrypoint anterior
`bruno-dashboard.Dq2NEBNk.js` foi preservado no Everex para rollback.

Não houve reinício do Home Assistant nem merge para `main`. A implementação
permanece na branch candidata `local/ajustes-gerais-20260823`. A validação final
no app do Home Assistant e no Safari do iPhone continua obrigatória após
reinício autorizado.
