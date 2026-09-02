# Status Iluminacao — hold para sheet global

Data: **2026-08-25**
Branch local: `local/ajustes-gerais-20260823`
HEAD de base: `f4f24b53710f5a2bb5286916a621d9f1acb1eee1`
Bundle candidato: `bruno-dashboard.Cs0ZDrkD.js`
Main chunk: `chunks/main.CnYAbPol.js`

## Escopo implementado

- O tap curto da tile `Lights` continua usando
  `input_select.hemma_expanded_row` para expandir/recolher a faixa atual.
- O hold de 560 ms em `Lights` emite o evento dedicado
  `bruno-status-lights-open`; nenhum toggle nem escrita no `input_select` ocorre
  nesse caminho. A shell ainda aceita o `ll-custom` anterior somente como
  compatibilidade de rollback.
- Movimento de mais de 10 px cancela o hold, protegendo o scroll horizontal da
  faixa.
- O gesto segue a arbitragem móvel já validada nos room cards: não usa
  `setPointerCapture`, não bloqueia o `pointerdown` e possui fallback por
  `contextmenu` para o long-press nativo do WebKit.
- `bruno-shell` hospeda a camada global e repassa `hass` e o universo monitorado
  para `bruno-status-lights-sheet`.
- O componente novo usa `ROOMS` como autoridade, expande recursivamente
  `lightGroup.attributes.entity_id`, inclui luzes explícitas, deduplica e ignora
  somente entidades inexistentes.
- O universo da tile e o inventário da sheet foram comparados. Resultado do
  estado sintético completo: **37/37 circuitos**, todos únicos, sem órfãos.
- Ações individuais usam `turn_on`/`turn_off` conforme o estado atual. Ações
  globais usam exatamente o vetor deduplicado da sheet.
- A atualização é reativa por `ObservadorDeEntidades`, sem polling.

## Inventário validado

| Cômodo | Circuitos |
| --- | ---: |
| Sala | 7 |
| Office | 3 |
| Cozinha | 4 |
| Lavabo | 3 |
| Casal | 7 |
| Marina | 6 |
| Miguel | 6 |
| Corredor | 1 |
| **Total** | **37** |

Grupos expandidos:

- `light.grupo_luzes_sala`
- `light.grupo_luzes_office`
- `light.grupo_luzes_cozinha`
- `light.grupo_luzes_lavabo`
- `light.grupo_quarto_casal`
- `light.grupo_luzes_quarto_marina`
- `light.grupo_luzes_quarto_miguel`

Nenhuma luz ficou em `Sem cômodo`.

## Layout medido

Tablet 1280 x 720:

- side sheet de 826 x 704 px (64,5% da largura);
- duas colunas principais de cômodos e duas colunas internas de controles;
- 37 controles e oito cômodos simultaneamente visíveis;
- `bodyClientHeight = bodyScrollHeight = 644 px`;
- overflow vertical 0, overflow horizontal falso e `overflow-y: visible`.

Mobile 390 x 844:

- bottom sheet de 390 x 540 px (64% da altura);
- topo em 260 px e base em 800 px, exatamente na borda superior da dock;
- dock medida em 45 px; a shell publica o deslocamento real, sem estimativa;
- duas colunas de cômodos, uma coluna interna de controles por cômodo;
- cabeçalho estável; corpo com `overflow-y: auto`;
- scroll interno medido em 320 px sem fechar a sheet;
- drag iniciado no cabeçalho fechou a sheet e não interfere no scroll do corpo.

## Interações verificadas no harness local

- tap 1: `input_select` para `lights`, sheet fechada;
- tap 2: `input_select` para `none`, sheet fechada;
- arrasto horizontal: nenhum serviço e nenhuma sheet;
- hold: sheet aberta, `input_select` preservado e nenhum serviço;
- toggle individual: `light.turn_off` determinístico no circuito que estava on;
- `Apagar todas`: 37 alvos e contador reativo em 0/37;
- `Acender todas`: 37 alvos e contador reativo em 37/37;
- fechamento por botão, scrim e drag: aprovados;
- nenhum erro ou warning de console.

Após o relato físico de que o hold da primeira revisão não abria, um harness
direcionado ao gesto da revisão 2 também confirmou:

- hold contínuo: uma abertura e um circuito monitorado;
- movimento acima do limiar: zero aberturas;
- sequência `pointercancel` + `contextmenu`: uma abertura pelo fallback móvel;
- hold já reconhecido seguido de `contextmenu`: continuou em uma única abertura.

## Arquivos de implementação

- `dashboard-src/src/components/status/status-lights-model.ts`
- `dashboard-src/src/components/status/status-lights-model.test.ts`
- `dashboard-src/src/components/status/bruno-status-lights-sheet.ts`
- `dashboard-src/src/main.ts`
- `config/www/bruno-ui/cards/bruno-top-badges-card.js`
- `config/www/bruno-ui/core/bruno-shell.js`
- `config/configuration.yaml`
- `config/www/dashboard/`

Nenhuma subview, câmera, clima, mídia, presença, backend ou entidade foi
alterada.

## Validação automatizada

- TypeScript: aprovado;
- ESLint completo de `dashboard-src/src`: aprovado;
- Vitest: 18 arquivos e 281 testes aprovados;
- YAML: 250 arquivos aprovados;
- sintaxe JavaScript: 200 arquivos aprovados;
- detector direcionado de crases perigosas: seis arquivos aprovados;
- Vite: 90 módulos transformados;
- manifesto e compressão: aprovados, com seis assets comprimidos.

## Rollback

Snapshot integral pré-rodada:
`tmp/rollback-20260825-status-lights-sheet/`.

Rollback rápido:

1. restaurar do snapshot `config/configuration.yaml`;
2. substituir `config/www/dashboard/` pelo diretório preservado;
3. restaurar os dois módulos clássicos preservados em
   `config/www/bruno-ui/core/bruno-shell.js` e
   `config/www/bruno-ui/cards/bruno-top-badges-card.js`;
4. reiniciar o Home Assistant e executar recarga forçada no tablet/iPhone.

O bundle anterior de referência é `bruno-dashboard.B_IHs_CU.js`.

## Estado

Publicado no Everex em 2026-08-25. Foram confirmados 31/31 pares SHA-256 entre
origem local e destino, e os sete módulos alcançáveis pelo entrypoint estão
presentes. O bundle anterior `bruno-dashboard.B_IHs_CU.js` permaneceu no destino
para rollback rápido. Backup pré-publicação:
`tmp/everex-preflight-20260825-status-lights-hold-rev2/`.

A primeira revisão falhou no hold do aparelho físico; a revisão 2 está corrigida
e aprovada nos gates locais, mas ainda depende de reinício do Home Assistant,
recarga forçada e validação física no tablet/iPhone. Nenhum commit, push, PR ou
merge foi realizado nesta rodada.

---

## Microajustes pós-aceite — 2026-08-26

Esta seção substitui os números de inventário e geometria acima para a candidata
atual. O comportamento de tap/hold, ações, gaps, filetes e demais estruturas já
validadas não foi alterado.

### Continuidade mobile entre sheet e rail

- Foi replicado o contrato estrutural das folhas mobile das subviews: o material
  da sheet continua até `bottom: 0`, por trás da rail, e o corpo reserva a altura
  real de `--bruno-dock-h` para o scroll não terminar oculto.
- Quando a sheet de iluminação está aberta, a rail fica acima dela, transparente
  e sem um segundo `backdrop-filter`. Assim, os tokens da própria sheet formam
  uma superfície contínua até a borda inferior.
- A antiga variável que fazia a sheet parar no topo da rail é removida pela
  shell, com o comportamento anterior preservado em comentário para rollback.

### Inventário corrigido

Os dois membros internos de `light.qc_luz_principal` confirmados como fora de
uso foram excluídos somente do inventário desta sheet:

- `light.quarto_casal_2_switch_1`;
- `light.quarto_casal_switch_3`.

`ROOMS`, grupos do Home Assistant, cards e subviews permanecem intactos. O Q.
Casal passa de oito módulos físicos expandidos para seis controles exibidos, e
as entidades excluídas também não reaparecem em `Sem cômodo`.

| Cômodo | Circuitos |
| --- | ---: |
| Sala | 7 |
| Office | 3 |
| Cozinha | 4 |
| Lavabo | 3 |
| Casal | 6 |
| Marina | 6 |
| Miguel | 6 |
| Corredor | 1 |
| **Total** | **36** |

### Geometria medida

Mobile 390 x 844:

- sheet de 390 x 658,3 px, com topo em 185,7 px e base em 844 px;
- Hero termina em 182 px: não há sobreposição;
- título `Cômodos` começa em 187 px: a sheet fica 1,3 px acima do seu topo;
- rail ocupa 785,6–844 px e permanece sobre o mesmo material da sheet;
- controles com 46 px; corpo com scroll interno e sem overflow horizontal.

Tablet 1280 x 720:

- side sheet de 825,6 x 704 px;
- controles ampliados para 38 px;
- `bodyClientHeight = bodyScrollHeight = 644 px`;
- overflow vertical 0 e overflow horizontal falso.

Em ambos os breakpoints o harness confirmou 36 controles totais, seis no Q.
Casal e ausência das duas entidades excluídas.

### Build, publicação e rollback

- Entry point: `bruno-dashboard.DNHrEkaP.js`;
- main chunk: `chunks/main.CH662_yg.js`;
- room chunk: `chunks/bruno-room-subview.CuQK6_nU.js`;
- TypeScript, ESLint, 18 arquivos/282 testes Vitest, 250 YAMLs, 200 JS,
  detector de crases em seis fontes, Vite com 90 módulos, manifesto,
  compressão e grafo local de sete módulos: aprovados;
- publicado no Everex em 2026-08-26: 30/30 pares SHA-256 idênticos e sete
  módulos alcançáveis presentes;
- bundle anterior `bruno-dashboard.Cs0ZDrkD.js` preservado no Everex;
- snapshot local pré-ajuste:
  `tmp/rollback-20260826-status-lights-sheet-microadjust/`;
- backup pré-publicação do Everex:
  `tmp/everex-preflight-20260826-status-lights-sheet-microadjust/`.

O Home Assistant não foi reiniciado. Recarga/reinício e aceite no aparelho físico
continuam pendentes. Não houve commit, push, PR ou merge.

---

## Microajustes de densidade — revisão 2 (2026-08-26)

Aplicado após inspeção da captura física do tablet, sem alterar gaps, paddings,
filetes, distribuição dos cômodos, inventário ou ações.

### Tablet

- largura da side sheet reduzida de 64,5% para **60%**, com teto de 1120 px;
- altura dos controles elevada de 38 para **42 px** no perfil baixo de tablet;
- 1280 x 720: painel de 768 x 704 px e
  `bodyClientHeight = bodyScrollHeight = 644 px`;
- 1363 x 742, tamanho da captura: painel de 817,8 x 726 px e
  `bodyClientHeight = bodyScrollHeight = 666 px`;
- 1024 x 768: painel de 614,4 x 752 px e
  `bodyClientHeight = bodyScrollHeight = 692 px`;
- nos três tamanhos: overflow vertical 0 e overflow horizontal falso.

### Mobile

- a bottom sheet ganhou exatamente **5 px**;
- em 390 x 844, mede 390 x 663,3 px e começa em 180,7 px;
- o topo fica 6,3 px acima do início do título `Cômodos`; o headline do Hero
  conserva 62,7 px de distância;
- a rail continua sobre o mesmo material, mas recebe somente um véu neutro
  `rgba(0,0,0,0.16)` com `blur(16px) saturate(1.08)`, reduzindo a leitura dos
  controles que passam por baixo durante o scroll;
- controles mobile permanecem em 46 px e não há overflow horizontal.

### Build, publicação e rollback

- entry point: `bruno-dashboard.B7LHAT4p.js`;
- main chunk: `chunks/main.dAuboa0p.js`;
- room chunk: `chunks/bruno-room-subview.DvvqdWQE.js`;
- TypeScript, ESLint, 18 arquivos/282 testes Vitest, 250 YAMLs, 200 JS,
  detector de crases em seis fontes, Vite com 90 módulos, compressão e grafo de
  sete módulos: aprovados;
- Everex: 30/30 hashes idênticos, sete módulos alcançáveis e bundle anterior
  `bruno-dashboard.DNHrEkaP.js` preservado;
- rollback local:
  `tmp/rollback-20260826-status-lights-sheet-microadjust-rev2/`;
- backup pré-publicação:
  `tmp/everex-preflight-20260826-status-lights-sheet-microadjust-rev2/`.

O Home Assistant não foi reiniciado. Não houve commit, push, PR ou merge.

---

## Sincronização local, GitHub e Everex — 2026-08-30

- O commit remoto `cd2244d3` foi incorporado antes da publicação; ele adiciona
  somente `docs/40-automacao-inteligente-fundacao.md`.
- O dashboard foi recompilado a partir dos fontes canônicos limpos. A diferença
  funcional para B7 limita-se ao identificador diagnóstico de build
  `20260830`; os demais deltas são os nomes hashados do entrypoint, main e room
  chunk.
- Entry point reproduzível: `bruno-dashboard.Dq2NEBNk.js`.
- Main chunk: `chunks/main.DOvb_YDD.js`.
- Room chunk: `chunks/bruno-room-subview.COtclf9Q.js`.
- Everex: 31/31 arquivos do payload iguais ao local por SHA-256 e sete módulos
  alcançáveis presentes; `configuration.yaml` foi copiado por último.
- O bundle anterior `bruno-dashboard.B7LHAT4p.js` permaneceu no Everex para
  rollback.
- Rollback local: `tmp/rollback-20260830-three-way-sync/`.
- Backup pré-publicação: `tmp/everex-preflight-20260830-three-way-sync/`.

Gates repetidos após a integração: TypeScript, ESLint, 18 arquivos/282 testes
Vitest, 250 YAMLs, 200 JS, detector de crases em seis fontes, Vite com 90
módulos, compressão e grafo de sete módulos. O Home Assistant não foi
reiniciado.
## Altura dos controles no tablet — revisão 4 (2026-09-01)

A validação física mostrou que o teto anterior de 48 px ainda deixava uma faixa
vazia equivalente a pouco mais de três controles no tablet alto. O ajuste ficou
restrito à propriedade `min-height` de `.light-control`: a curva vigente é
`clamp(48px, calc(9.1dvh - 25px), 60px)`. O override compacto até 820 px foi
preservado em `clamp(42px, 6dvh, 44px)`, pois nesses viewports a coluna crítica
já fecha a altura disponível.

Não mudaram gaps, paddings, cabeçalhos, agrupamentos, largura da side sheet,
filetes, gestos, inventário nem o bottom sheet mobile. O harness confirmou zero
scroll no tablet nos viewports 1280x720, 1363x742, 1024x768, 1363x820,
1363x821, 1363x900, 1363x926, 1920x1045 e 1920x1200. Em 1920x1045, referência
compatível com a sobra física relatada, os controles medem 60 px e a folga da
coluna crítica cai para 100 px.

Bundle candidato: `bruno-dashboard.DuoAOL_I.js`, com
`chunks/main.7kuhW78o.js`. Local e Everex passaram em 28/28 hashes, mas o
processo do Home Assistant ainda anuncia `C5Tz4bF_`; a troca do módulo ativo
depende de reinício controlado do Home Assistant.
