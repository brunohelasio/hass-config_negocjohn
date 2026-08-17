# Fase 6.3 — confronto das propostas com o código atual

**Data:** 2026-08-10 · **Escopo:** auditoria medida. **Nenhuma alteração de
código.** Corrige os documentos 26 (rev.2) e 27.

---

## 0. Por que este documento existe

O usuário leu as propostas da 6.3 e apontou o método:

> "A implementação mobile não deve ser tratada como uma reconstrução completa
> antes de avaliar tecnicamente o que já existe."

Está certo, e a 6.3B foi escrita sem essa avaliação. O documento 27 propôs
composições novas para telas cujo estado atual eu não tinha medido — apenas
inventariado por nome de arquivo. Este documento faz o que faltava: **monta o
componente real no tamanho do telefone e mede**.

O banco de medição novo é `scripts/harness/gen-phone-harness.mjs`. Ele reproduz
o content-slot da shell em modo telefone (grid de uma coluna, dock na base,
padding 10/10/6) e responde três coisas por cômodo: a **ordem visual** dos
módulos, a **altura** de cada um e o que fica **acima da dobra**.

---

## 1. Correção do que eu afirmei antes

### 1.1 A causa do "alguns empilham, outros não" — eu errei

O documento 26 §3.1 afirmava que as sobreposições de grid por cômodo venciam a
cascata e por isso alguns cômodos nunca empilhavam. **Está errado.** Os seis
cômodos têm, cada um, um bloco `@media (max-width: 800px)` que troca o grid por
`display: flex; flex-direction: column`. Todos empilham.

A causa real é outra, e é mais simples de consertar:

```
:host([data-tvhub]) …   →  35 regras — o tratamento COMPLETO de telefone
:host([data-room='cozinha']) …  →  25 regras — tratamento próprio
sala · office · casal · marina · miguel  →  1 regra cada: só o flex
```

E `data-tvhub` é ligado por `Boolean(ent?.['tv'])` — **só a Sala tem `tv:`** em
`subviews.config.ts`. O comentário no CSS diz "cinco cômodos", e é resíduo de
quando outros cômodos tinham TV.

Ou seja: o tratamento de telefone existe, está pronto e testado — e está preso à
chave errada. Office, Casal, Marina e Miguel recebem uma única regra (empilhar) e
mantêm o grid do tablet dentro dos containers.

Isso explica cada sintoma que o usuário descreveu:

| sintoma relatado | causa medida |
|---|---|
| "status superiores pequenos, sobrepostos ou quebrados" | `.topband-badges` mantém o grid do tablet; as pílulas não recebem as regras de altura/coluna do bloco `[data-tvhub]` |
| "alguns módulos em duas colunas, outros em largura integral" | `.cams-media-row` continua `display: grid` → câmera e hub ficam **lado a lado com 180 px cada** (medido) |
| "quebrando a consistência estabelecida pela Sala" | literal: a consistência é a Sala porque o tratamento é dela |

### 1.2 A ordem da Sala também tem um defeito, e é de uma linha

O bloco `[data-tvhub]` aplica `display: contents` em `.content-left` e
`.cams-media-row` — mas **não em `.right-column`**. Sem isso, a coluna direita
continua sendo um único item de flex sem `order`, e o `order: 20/30` das luzes e
do A/C nunca chega a valer no eixo externo.

Resultado medido na Sala hoje:

```
topband 10 · iluminação 54 · A/C 97 · cortina 427 · hub 554 · câmeras 822
```

O A/C ocupa 320 px logo no topo e a câmera fica a 822 px — fora da dobra em
qualquer telefone. É exatamente o "a ordem dos módulos não é a mais conveniente"
do usuário, e a causa é uma declaração faltando.

### 1.3 Um defeito que eu quase reportei, e não existe

Medi o dock de iluminação abrindo para 0 px no telefone e cheguei a concluir que
o módulo não abria. **Não é verdade.** Com o painel do navegador oculto as
transições CSS não avançam, e `grid-template-rows` estava sendo lido no valor
inicial. Neutralizada a transição, a medição é consistente:

| cômodo | recolhido | aberto | células |
|---|---|---|---|
| sala | 43 | 348 | 7 |
| office | 43 | 193 | 3 |
| cozinha | 43 | 193 | 3 |
| casal | 43 | 294 | 6 |
| marina | 43 | 294 | 6 |
| miguel | 43 | 348 | 8 |

Sem rolagem interna: o conteúdo cabe. **O módulo de iluminação funciona no
telefone.**

#### ARMADILHA DE MEDIÇÃO (nova, mesma família das anteriores)

**Com o painel do navegador oculto, transições CSS não progridem.** Qualquer
leitura de propriedade em transição devolve o valor de partida. É irmã da
armadilha do `requestAnimationFrame` (2026-08-06). Quem mede estado pós-animação
tem de neutralizar a transição antes, não esperar mais tempo.

#### ARMADILHA DE MEDIÇÃO (nova)

**Sem `<meta name="viewport">`, o navegador em emulação móvel adota o viewport de
layout padrão de 980 px** e nenhuma media query de telefone casa. A primeira
rodada inteira mediu o layout de tablet achando que media o de telefone. A linha
está agora no gerador, com comentário.

---

## 2. Home — o que já existe

O celular **não** vai para as cinco views V3: o redirect foi comentado em
2026-07-09 e o telefone permanece na shell. O que o usuário vê é
`section_home_v2.yaml` no bloco `(max-width: 800px)`.

### 2.1 Confronto item a item

| observação do usuário | estado no código | veredito |
|---|---|---|
| "status superiores já utilizam scroll horizontal" | `bruno-top-badges-card.js`: `.left { overflow-x: auto; touch-action: pan-x }` dentro de `@media (max-width: 800px)` | **confirmado** — e é a peça a reaproveitar nas subviews |
| "Hero reúne saudação, data, relógio, previsão, evento e informações inteligentes" | `heroLines = [nextEvent, ...insights(2)]` → **3 faixas de 48 px** | **confirmado** |
| "ocupa cerca de um terço ou mais da tela" | hero intrínseco medido: **328 px** de 764 de dobra = **43%** | **confirmado, e maior que ele estimou** |
| "cards de cômodos no formato horizontal" | `bento_comodos_matriz` no phone: 2 colunas × 3 linhas de 176 px, usando os oito `bruno-*-card.js` legados | **confirmado** — e é por isso que esses cards seguem carregados |
| "card de energia deve ser retirado" | `bento_energy_phone.yaml`, linha de `minmax(140px, auto)` | existe; sai comentando o include e zerando a linha |
| "cards dinâmicos... somente aparecem quando existe condição ativa" | `bruno-activity-column` + `binary_sensor.home_activity_*`, com `show.mediaquery '(min-width: 801px)'` | **já existe e está pronto** — está apenas excluído do telefone |

### 2.2 O que a proposta 6.3B dizia de diferente — e por que era redundante

O documento 27 propunha "Home como ponto de partida, cards de cômodo em duas
colunas, bloco de contexto condicional". Confrontado com o código:

- **duas colunas**: já são duas. Nada a fazer.
- **bloco condicional**: já existe, com prioridade por ordem de ativação, no
  máximo dois por coluna, alturas por slot. Melhor do que eu propus.
- **hero compacto**: é a única parte que sobrevive — e a régua correta são os
  144 px das três faixas, que eu não tinha.

**Conclusão:** na Home a 6.3B não propunha arquitetura nova; propunha, sem
saber, o que já estava construído. Fica valendo só o hero.

### 2.3 O orçamento vertical, que responde à pergunta do usuário

> "existe a possibilidade de exibir, sem scroll: Sala; Office e Cozinha; Lavabo e
> Quarto de Casal"

Dobra em 390×844 = 844 − 64 (dock) − 16 (padding) = **764 px**.

```
badges                    44
hero condensado          232   (328 − 96 das duas faixas de insight)
Sala                     176
Office / Cozinha         176
Lavabo / Q. Casal        176
4 gaps de 10             40
──────────────────────────────
                         844   →  80 px acima da dobra
```

**Não cabe com os valores atuais.** Cabe assim:

| ajuste | economia | total |
|---|---|---|
| hero condensado para 3 → 1 faixa | −96 | 844 |
| Sala 176 → 150 | −26 | 818 |
| linhas da matriz 176 → 160 | −32 | 786 |
| gaps 10 → 8 | −8 | 778 |
| hero 232 → 210 (relógio 42 → 34) | −22 | **756** ✓ |

Cabe em 764, com 8 px de folga. Em telefone de 932 px sobra folga; em 667 px
(iPhone SE / mini) é impossível — lá a terceira dupla fica abaixo da dobra e
isso é aceitável, porque um recorte parcial visível sinaliza que há mais.

**Recomendação:** não perseguir os 8 px. Mirar o hero em ~210 px e deixar a
terceira linha da matriz aparecendo pela metade — o recorte parcial é o que
convida a rolar. Perseguir o encaixe exato produz um layout que quebra no
próximo aparelho.

---

## 3. Subviews da rail — o que já existe

| subview | media queries de telefone | avaliação do usuário | confronto |
|---|---|---|---|
| Câmeras / Segurança | 980 · 800 · 640 · 520 px | "estrutura adequada" | **confirmado.** O bloco de 800 px iguala palco e miniatura em `clamp(190px, 26vh, 240px)`, uma coluna — é literalmente a decisão nº 4 do usuário já implementada |
| Aspirador | 1100 · 800 (×2) | "adaptação satisfatória" | **confirmado** |
| Planta 3D | 900 · 800 · 370 px | "mais adequada ao smartphone que a do tablet" | **confirmado** — existe tratamento próprio |
| Rail / dock | `hide_on_phone` em 6 itens | "deve permanecer sincronizada" | **já está.** Dispositivos (5e.6) e Cenas (5e.3) entraram com `hide_on_phone: true` |

### 3.1 Correção da proposta 6.3B sobre a Planta 3D

O documento 27 propunha **paisagem forçada**. A base era a pendência F3.3 do
`CLAUDE.md`, de 2026-07-09: *"não está funcionando — precisa diagnóstico ao
vivo"*. Essa pendência **envelheceu**: o tratamento de telefone existe e o
usuário confirma que funciona, com seleção de cômodo, ampliação e controles de
iluminação por ambiente.

**A decisão D3 da 6.3B está retirada.** Paisagem forçada é pior do que o que já
existe, e a proposta nasceu de uma nota velha em vez de uma verificação.

### 3.2 Tela verde nas câmeras

Concordo com a separação que o usuário fez: é o feed, não o layout. Fica fora da
6.3 e entra na frente de streaming (território do Codex, que não altero).

---

## 4. Subviews de cômodo — onde está o trabalho

### 4.1 Estado medido, 390×844, dobra em 764 px

| cômodo | ordem visual hoje | rolagem |
|---|---|---|
| **sala** | topband → luzes → **A/C** → cortina → hub → **câmeras (822)** | 321 px |
| office · casal · marina · miguel | topband → cortina → **[câmeras \| hub] lado a lado, 180 px** → luzes → A/C | 76 px |
| cozinha | topband → luzes → eletrodomésticos (442) → câmeras | 26 px |

### 4.2 Alturas reais dos módulos (largura 370 px)

| módulo | altura |
|---|---|
| barra de status | 34 |
| cortina (só a linha de controle) | 82 · ~100 como card próprio |
| iluminação recolhida | 43 |
| iluminação aberta | 193 – 348 conforme o cômodo |
| câmeras | 263 (feed 218) |
| hub de mídia | 257 |
| ar-condicionado | **320** |
| eletrodomésticos (Cozinha) | **442** |

Duas leituras que valem registro:

- **o A/C custa 320 px**, 42% da dobra, para um controle de três toques. É o
  módulo mais caro da tela e o menos usado;
- **os eletrodomésticos custam 442 px**. A intuição do usuário de compactar em
  3 + 2 está certa e é a maior economia isolada disponível.

### 4.3 Cenário A — a proposta do usuário, medida

Ordem: status (scroll-x) → cortina → iluminação → câmeras → hub → A/C.

```
recolhida:  topband 10 · cortina 54 · luzes 164 · câmeras 217 · hub 490 · A/C 757
aberta:     …                          luzes 164 · câmeras 522 · hub 795 · A/C 1062
```

Com a iluminação recolhida, **a câmera fica inteiramente acima da dobra** em
qualquer telefone. Com ela aberta:

| aparelho | dobra | câmera visível |
|---|---|---|
| 375×667 | 587 | 65 de 263 px |
| 390×844 | 764 | 242 de 263 px |
| 430×932 | 852 | inteira |

### 4.4 Cenário B — a proposta 6.3B, medida

```
topband 10 · câmera 54 · cortina 327 · iluminação 437 · A/C 511 · mídia 585
```

Total 649 px: cabe inteiro, sem rolagem, em 844 e 932. A câmera não sai da tela
porque a iluminação abre em folha, por cima.

### 4.5 O confronto honesto

| | Cenário A | Cenário B |
|---|---|---|
| o que se constrói | nada — reordenar, generalizar o tratamento da Sala, extrair a cortina | linha-resumo, folha e cabeçalho colapsável: três componentes |
| onde mexe | gerador de CSS + bloco de telefone | no componente compartilhado com o tablet |
| risco para o tablet | nenhum (tudo dentro de `max-width: 800px`) | real (markup novo aparece nos dois modos) |
| telefone pequeno | câmera sai da tela ao operar as luzes | funciona igual |
| profundidade | tudo à vista, rolando | resumo à vista, detalhe em folha — mais toques |
| coerência com o tablet | idêntica | o telefone ganha vocabulário próprio |

**Recomendação: Cenário A.** O argumento que sustentava o B — "câmera e comandos
não coexistem numa pilha rolável" — **não sobreviveu à medição**: com a
iluminação recolhida a câmera está acima da dobra na ordem que o usuário propôs.
O B só ganha no caso de telefone pequeno com iluminação aberta, e paga por isso
com três componentes novos dentro do arquivo compartilhado com o tablet.

Se o telefone do usuário for de 667 px de altura, a conclusão se inverte. É a
única informação que falta.

**Meio-termo, se ele quiser:** manter o Cenário A e fazer **só a iluminação**
abrir em folha. Um componente novo em vez de três, e o único caso ruim
desaparece. Fica registrado como Cenário A′.

---

## 5. O que a 6.5B passa a implementar

Ordenado por relação entre efeito e risco.

| # | ação | arquivo | efeito |
|---|---|---|---|
| 1 | trocar a chave `[data-tvhub]` do bloco de telefone pelo próprio cômodo | `gen-subview-css.mjs` | conserta Office, Casal, Marina e Miguel de uma vez |
| 2 | acrescentar `.right-column { display: contents }` ao bloco de telefone | idem | destrava o `order` e corrige a ordem da Sala |
| 3 | reordenar: cortina 10 · luzes 20 · câmeras 30 · hub 40 · A/C 50 | idem | ordem do usuário |
| 4 | barra de status com rolagem horizontal | idem | reaproveita o padrão do `bruno-top-badges-card` |
| 5 | gap uniforme entre módulos | idem | a queixa de respiro |
| 6 | extrair a cortina do hero como card próprio no telefone | `bruno-room-subview.ts` | tira o hero decorativo do caminho |
| 7 | compactar os eletrodomésticos para 3 + 2 | idem | −150 px na Cozinha |
| 8 | hero da Home: 3 faixas → 1 | `bruno-hero-card.js` | −96 px |
| 9 | retirar o card de energia do telefone | `section_home_v2.yaml` | −150 px |
| 10 | habilitar a área dinâmica no telefone | `bento_dynamic.yaml` | mídia e câmera passam a ser condicionais |

Itens 1 a 5 vivem no gerador e são reversíveis por regeneração. Itens 6 e 7
tocam o componente e exigem a disciplina de `@media (max-width: 800px)`.

---

## 6. Decisões que ficam com o usuário

| # | decisão | recomendação |
|---|---|---|
| **D1** | Cenário A, B ou A′ (A com a iluminação em folha) | **A**, ou **A′** se o aparelho for pequeno |
| **D2** | altura da tela do seu telefone | precisa da informação — inverte D1 |
| **D3** | ~~planta 3D em paisagem forçada~~ | **retirada** — a solução atual é melhor |
| **D4** | perseguir "sem scroll" na Home | **não** — mirar hero ~210 px e deixar a terceira linha aparecendo pela metade |
| **D5** | mídia da Home: fixa ou condicional | **condicional**, junto com câmera e Roborock, reusando a área dinâmica |

---

## 7. Correções aos documentos anteriores

| documento | trecho | correção |
|---|---|---|
| 26 rev.2 | §3.1 — cascata das sobreposições impediria o empilhamento | falso; a causa é a chave `[data-tvhub]` (§1.1) |
| 26 rev.2 | tabela §5 — "Planta 3D não está funcionando" | envelhecido; tem tratamento próprio e funciona |
| 27 | Home como lançador com cards em duas colunas | já existe |
| 27 | "bloco de contexto condicional" | já existe, melhor do que o proposto |
| 27 | D3 — planta em paisagem forçada | retirada |
| 27 | D5 — inverter a ordem do usuário | **retirada**: a medição não sustenta a inversão |

---

## 8. Método

O erro da 6.3B não foi a proposta; foi a ordem. Inventariei arquivos e propus
composições sem montar nenhuma tela no tamanho em que ela é usada.

**Regra que fica:** antes de propor composição para um alvo, montar o
componente real naquele alvo e medir. Vale o mesmo princípio já registrado para
o tema e a resolução do tablet — medir a 1280 não diz nada sobre 1920, e medir a
1920 não diz nada sobre 390.

---

## 9. Revisão 2 (2026-08-10) — o que "folha" significa, e o 13 Pro Max

### 9.1 O que "abrir folha" significa — e o erro do primeiro mockup

A interpretação do usuário está correta e é a que o documento 27 queria dizer:
**bottom sheet deslizante**, no padrão de Apple, Google e SmartThings.

1. tela principal: `Status → Câmera → Cortina → três linhas-resumo`, sem rolagem;
2. tocar numa linha faz subir da base uma folha com os controles completos;
3. o fundo escurece **menos a câmera**, que fica no tamanho original e transmitindo;
4. fecha arrastando, tocando fora ou em Concluir; toca-se em outra linha e abre a
   folha correspondente.

**O mockup da rev.1 estava errado**, e o usuário identificou: ele mostrava a
câmera encolhida E a folha aberta ao mesmo tempo. São dois mecanismos distintos
e eu misturei os dois estados. O encolhimento servia ao caso de a pilha rolar —
com folha a pilha não rola, e **não há nada a encolher**.

Consequência prática: o Cenário B custa **dois** componentes (linha-resumo e
folha), não três.

### 9.2 Medição a 428 px (iPhone 13 Pro Max)

| módulo | 390 px | **428 px** |
|---|---|---|
| barra de status | 34 | 34 |
| cortina (linha) | 82 | 82 |
| iluminação recolhida | 43 | 43 |
| iluminação aberta (Sala / Miguel) | 348 | 348 |
| iluminação aberta (Casal / Marina) | 294 | 294 |
| iluminação aberta (Office / Cozinha) | 193 | 193 |
| câmeras | 263 | **285** (feed 240) |
| hub de mídia | 257 | 257 |
| ar-condicionado | 320 | 320 |

Só a câmera cresce, porque o feed é 16:9 da largura.

### 9.3 A dobra do aparelho

Tela 428×926 pt. Dock = 64 + 34 de `safe-area-inset-bottom` = **98**.

| como abre | altura útil | dobra |
|---|---|---|
| Companion em tela cheia | 926 | **822** |
| com a barra de status ocupada | 879 | **775** |

As duas hipóteses ficam ACIMA dos 764 px usados na rev.1 — as conclusões
anteriores valem e melhoram.

### 9.4 Cenário A no aparelho — a previsão do usuário confere

```
repouso:  status 10 · cortina 54 · luzes 164 · câmera 217 · hub 512 · A/C 779
abertas:  …                        luzes 164 · câmera 522 · hub 817 · A/C 1084
```

- **em repouso** o hub termina em 769 — acima da dobra nas duas hipóteses.
  Só o A/C fica abaixo. É exatamente o que o usuário previu;
- **com as luzes abertas** a câmera vai de 522 a 807: **inteira** em tela cheia,
  89% da altura se a barra de status ocupar espaço. Cortina, controles de luz e
  câmera ficam simultaneamente visíveis — também como ele previu.

### 9.5 Cenário B no aparelho

```
status 10 · câmera 54 · cortina 349 · iluminação 459 · A/C 533 · mídia 607
total 671 → cabe inteiro, com 104 a 151 px de sobra
```

Folha da iluminação da Sala: conteúdo 306 + cromo + área do indicador =
**456 px**, topo em **470**. A câmera termina em 339 e a cortina em 449 — a
folha cobre apenas as linhas-resumo. **Câmera e cortina permanecem à vista.**

Nos demais cômodos a folha é igual ou menor (A/C ≈ 410, mídia ≈ 347,
iluminação de Office/Cozinha ≈ 301). Em nenhum caso ela alcança a câmera.

Implementação da preservação: o escurecimento é um elemento em `z-index: 6` e o
módulo da câmera recebe `z-index: 7` — a câmera fica acima do escurecimento sem
truque nenhum.

### 9.6 A recomendação muda para o Cenário B

| | A | B |
|---|---|---|
| câmera ao operar as luzes | desce 305 px; 89–100% visível | **não se move; 100% sempre** |
| rolagem | 323 px em repouso | **nenhuma** |
| ver o A/C | rolar até o fim | estado na linha; folha ao tocar |
| o que se constrói | nada | linha-resumo + bottom sheet |
| onde mexe | gerador de CSS | componente compartilhado |
| risco para o tablet | nenhum | contido: markup oculto acima de 800 px |
| aparelho menor no futuro | degrada | indiferente |

**Cenário B.** O laço "acionar e ver o efeito pela câmera" é a razão que o
usuário deu para o mobile existir, e só o B o garante em 100%. Com a folha
representada corretamente ele custa dois componentes, não três.

O A continua sendo a resposta certa se a prioridade for entregar já — e os itens
que consertam Office e quartos (§5, itens 1 a 5) são **os mesmos nos dois
caminhos**, então podem ser feitos antes da decisão sem retrabalho.

### 9.7 Nota de implementação do B

Não exige o contrato de modo da 6.3A. As linhas-resumo são markup novo com
`display: none` acima de 800 px; a folha é `position: fixed` com uma classe
booleana, no mesmo padrão do `is-open` que o dock de iluminação já usa. O
tablet não vê nenhuma das duas.

---

## 10. Implementação (2026-08-10) — Cenário B + Home condensada

Escopo autorizado pelo usuário: *"pode seguir com a opção B e no home pode
seguir com a sua recomendação [...]; lembrando que card de energia e mídia
cedem para os atuais cards dinâmicos do modo tablet"*.

### 10.1 Subviews — arquivo novo, gerado intocado

`dashboard-src/src/components/rooms/subview-phone.styles.ts` — o layout de
telefone inteiro, hand-authored, **último** no array `static styles`.

Ele não entrou no gerador de propósito: `subview-styles.generated.ts` é
TRANSCRIÇÃO dos seis arquivos originais e precisa continuar regenerável.
Desenho novo num gerador que não tem de onde tirá-lo tornaria a regeneração
impossível.

Prefixo `:host([data-room]) .room-subview` — especificidade (0,4,0), que empata
com a maior existente (a da Cozinha) e vence por posição. **Nada foi apagado:**
os oito blocos `@media (max-width: 800px)` herdados continuam no arquivo gerado
e ficam integralmente sombreados. Rollback = tirar uma linha do array.

Uma exceção de especificidade, encontrada por medição: a Cozinha escreve
`.cameras-card.cameras-card-controls` (0,5,0) com `order: 40`, e na primeira
rodada isso pôs o resumo ANTES da câmera. A regra de ordem usa agora a mesma
classe composta.

### 10.2 O componente

| adição | papel |
|---|---|
| `_folha: FolhaChave \| null` | qual folha está aberta; vira `data-folha` no host |
| `_abrirFolha` / `_fecharFolha` | alternam; abrir a de luzes já abre o corpo do dock |
| `_linhasResumo()` | monta as linhas do que o cômodo TEM (Cozinha não tem A/C nem hub; Office troca mídia por Estação de trabalho) |
| `_resumoClimate` / `_resumoMidia` / `_resumoEletrodomesticos` | o texto de cada linha, com a MESMA prioridade que o módulo usa por dentro |
| `_renderResumoTelefone()` | as linhas + o escurecimento |

**Nenhum código pergunta "é telefone?".** O DOM é o mesmo nos dois modos; acima
de 800px as linhas e o escurecimento são `display: none` e nada as alcança. Foi
o que dispensou o contrato de modo da 6.3A nesta etapa.

A folha **não duplica conteúdo**: o próprio `.lights-card` / `.ac-card` /
`.media-hub-card` / `.appliances-card` vira a folha, saindo do fluxo com
`position: fixed`. Cada um volta com o `display` que ELE usa — `flex` para
todos quebraria o grid interno do A/C e do hub.

### 10.3 Medido no aparelho do usuário (428×926)

Layout, idêntico nos seis (a Cozinha não tem cortina):

```
câmera   56 → 341
cortina 351 → 491
resumo  500 → 712        total 718 · dobra 775 a 822 · sobra 57 a 104
```

As 17 folhas dos seis cômodos:

| cômodo | folha | altura | folga até a câmera |
|---|---|---|---|
| sala | luzes / mídia / A-C | 381 · 257 · 289 | 204 · 328 · 296 |
| office | luzes / trabalho / A-C | 226 · 127 · 289 | 359 · 458 · 296 |
| cozinha | luzes / eletrodomésticos | 226 · 445 | 359 · **140** |
| casal · marina | luzes / mídia / A-C | 326 · 127 · 289 | 259 · 458 · 296 |
| miguel | luzes / mídia / A-C | 381 · 127 · 289 | 204 · 458 · 296 |

Todas `position: fixed`, base em 926 (cobrem o dock). **A menor folga é 140px:
a câmera nunca é alcançada.** O teto `--fone-reserva: 372px` existe como rede e
nunca chegou a atuar.

Escurecimento em `z-index: 7`, câmera em `8`, folha em `9` — a câmera fica
acesa, transmitindo e clicável com a folha aberta.

### 10.4 Tablet inalterado, verificado a 1920×1200

`.room-subview` continua `grid`; `.resumo-telefone` e `.folha-scrim` em
`display: none`; nenhum módulo em `position: fixed`; geometria idêntica
(câmeras [10,164,666,320], hub [686,164,666,320], A/C [1363,164,547,320], dock
de luzes [1363,100,547,56], cortina [10,70,1343,83]).

Verificado por script que **toda** regra do arquivo novo vive dentro de uma
media query — o tablet não pode ser afetado por construção.

### 10.5 Home

| mudança | arquivo | efeito medido |
|---|---|---|
| hero: 3 faixas → 1, relógio 38→35, respiros | `bruno-hero-card.js` | **328 → 210px** |
| ordem das faixas por relevância | idem | sem compromisso, a faixa visível é o insight — não o placeholder |
| Sala 176 → 150 · matriz 176 → 160 · gaps 10 → 8 | `section_home_v2.yaml`, `bento_comodos_matriz.yaml` | ver orçamento abaixo |
| Energia e Mídia fixos saem | `section_home_v2.yaml` | −320px de conteúdo permanente |
| área dinâmica entra | `bento_dynamic_phone.yaml` (novo) | câmera / Roborock / mídia só com condição ativa |

Orçamento medido:

```
badges          10 →  54
hero            62 → 272
Sala           280 → 430
Office/Cozinha 438 → 598
Lavabo/Casal   606 → 766   ← completa nas DUAS hipóteses de dobra
Marina/Miguel  774 → 934   ← 48px visíveis em tela cheia
```

A faixa dinâmica no telefone tem config própria (uma coluna, um card por vez,
`second_column_min_width: 4000`) e **colapsa quando nada está ativo** — a
classe `is-empty` no `bruno-activity-column`, com o CSS restrito a
`max-width: 800px`.

### 10.6 A única mudança visível no tablet

A ordem das faixas do hero. Se HÁ próximo compromisso, nada muda. Se não há, os
insights sobem e o placeholder "Nenhum compromisso hoje" vai para a terceira
linha. É pré-requisito do telefone (com uma faixa só, a fixa seria o
placeholder) e no tablet as três continuam visíveis.

### 10.7 Rollback

| alvo | como |
|---|---|
| Cenário B inteiro | remover `SUBVIEW_TELEFONE_CSS` do array `static styles` |
| linhas e folha (DOM) | comentar as duas chamadas de `_renderResumoTelefone()` |
| Home: energia e mídia | descomentar os dois includes em `section_home_v2.yaml` |
| Home: linhas e gaps | valores ANTERIOR anotados in-place |
| hero | remover o bloco marcado em `@media (max-width: 800px)` |
| recursos | `?v=` anteriores comentados ao lado em `configuration.yaml` |

### 10.8 DÉCIMA SEGUNDA ocorrência da crase — e o falso verde do detector

Escrevi crases em comentário dentro de template literal duas vezes nesta
sessão: no CSS novo (14 delas) e depois num comentário do hero.

O detector pegou a primeira. A segunda passou porque **eu rodei
`check-backtick.mjs` sem argumento, e sem argumento ele varria ZERO arquivos e
imprimia "0 arquivo(s) varrido(s): nenhuma crase perigosa"** — que lê como
aprovação. `npm run check` sempre passou `--tudo` e estava correto; o buraco era
a invocação avulsa.

Corrigido: sem argumento agora significa `--tudo`. **Um detector que aprova sem
olhar nada é pior que nenhum, porque cria confiança falsa.**

### 10.9 Pendências

| # | item | nota |
|---|---|---|
| B1 | Validação visual no aparelho | as 17 folhas e o orçamento da Home estão medidos; falta o olho |
| B2 | Fechar a folha | hoje: tocar no escurecimento. A alça é dica visual, não arrasta |
| B3 | Cozinha: dock de luzes com 3px no tablet | PRÉ-EXISTENTE (pendência L3 de 2026-07-29), não introduzido aqui |
| B4 | Terceira dupla da Home | 48px visíveis em tela cheia, 1px com a barra de status. Se ele usar Safari, verá duas duplas e rola |

---

## 11. Duas regressões minhas, achadas no aparelho (2026-08-10, rev.3)

O usuário validou no iPhone: barra de status no meio da tela, folha abrindo
errado. Ambas eram minhas, e ambas passaram porque o **banco de medição não
reproduzia o ambiente real**.

### 11.1 O pseudo-elemento da faixa virou item de flex — 320 px no topo

O material do Josh desenha a faixa inferior das subviews como `main::before` e
a posiciona **pelo grid** (`grid-row: 2 / -1`), atrás da linha de tiles.

No telefone eu troquei `main` de `grid` para **flex**. `grid-row` deixou de
significar nada, e o pseudo-elemento passou a ser o **primeiro item do flex**,
com os 320 px de `--ac-h`.

Medido, com o tema Josh forçado:

```
main::before  content: ""  ·  height: 320px  ·  grid-row: 2 / -1
topo da .subview-topband:  10px  →  340px
altura do main:           702px → 1030px
```

Correção: `content: none; display: none` em `.room-subview::before/::after`
dentro do bloco de telefone. No tablet a faixa segue intacta (verificado a
1920×1200: `content: ""`, 320 px, `grid-row: 2 / -1`).

### 11.2 Só a folha de luzes era `fixed`

O material declara

```
:host([data-bruno-subview-surface-theme="josh"]) .glass-card.ac-card { position: relative }
```

— (0,4,0), **o mesmo peso** do meu bloco, e injetado DEPOIS em
`adoptedStyleSheets`. Empate resolvido por posição: o material vencia. A folha
de luzes escapava só porque `.lights-card` não está naquela lista (ela é
cartela, não tile de faixa).

Resultado no aparelho: A/C, mídia e eletrodomésticos apareciam no meio do
fluxo, não como folha.

Correção: os seletores da folha passaram a usar a mesma classe composta do
material (`.glass-card.ac-card`), subindo para (0,5,0).

**Regra que fica:** o CSS do material é injetado depois do `static styles` do
componente. Empatar em especificidade com ele significa PERDER. Ao sobrepor
qualquer coisa que o material toque, usar a mesma forma composta que ele usa.

### 11.3 A folha não pode cobrir o dock

No telefone a shell dá `z-index: 2` ao `rail-slot` e `1` ao `content-slot`.
Nenhum `z-index` de dentro do conteúdo pinta sobre o dock — a pilha é decidida
um nível acima. A folha tentava cobri-lo e as últimas linhas ficavam escondidas
atrás dele.

Correção: a folha para ACIMA do dock. A altura vem da shell, que é quem a
conhece — `--bruno-dock-h`, publicada no `:host` do bloco de telefone e lida por
herança de propriedade customizada através do shadow DOM.

### 11.4 O banco novo: `gen-shell-harness.mjs`

`gen-phone-harness.mjs` anexava a subview direto num content-slot escrito à
mão. O novo monta a **shell de verdade** (`bruno-shell` com `loadCardHelpers`
stubado), com o CSS dela, o dock, os irmãos ocultos e o backdrop — e **força o
tema Josh**, que é o que o usuário roda.

Sem forçar o tema, o banco media com `default`, onde `main::before` é
`content: none`. Um defeito de 320 px ficava invisível.

**INVARIANTE: medir com o TEMA do usuário, não só na resolução dele.** Já
estava registrado para o tablet (Josh + 1920×1200) e eu não apliquei ao
telefone.

### 11.5 Medido depois da correção (428×926, shell real, Josh)

Layout idêntico nos seis:

```
topband 10 · câmera 56 · cortina 349 · resumo 498 → fim 710
```

17 folhas: todas `position: fixed`, base em 868 = topo do dock exato
(`invadeDock: 0`), folga até a câmera de **86 a 404 px**.

Tablet a 1920×1200: `main` grid, faixa intacta, resumo e escurecimento em
`display: none`, A/C `relative`, geometria dos tiles inalterada.

---

## 12. Rev.4 — os quatro defeitos de geometria (2026-08-10)

Relatados pelo usuário depois da rev.3, com o layout já correto.

### 12.1 PIP esticado — regressão minha

Copiei do bloco `[data-tvhub]` a regra

```
.camera-pip-stage, .camera-feed { min-height: 0; height: 100% }
```

O PIP da Varanda carrega **`camera-feed camera-pip-feed`**. Com (0,4,0) o meu
`height: 100%` vencia o tamanho do PIP (0,1,0) e ele virava uma tira da altura
inteira do palco.

Correção: `.camera-feed:not(.camera-pip-feed)` + tamanho explícito do PIP
(`min(34%, 124px)`, `aspect-ratio: 4/3`, ancorado no canto). Medido: **124×93**.

### 12.2 A folha ainda passava por baixo do dock

A rev.3 usou `--bruno-dock-h: calc(58px + env(safe-area-inset-bottom))` — e os
58 px saíram do MEU banco em Chromium, onde `env()` é 0. No iPhone o dock é mais
alto e a folha continuou passando por baixo.

Correção: a shell **mede** o `rail-slot` (`getBoundingClientRect` +
`ResizeObserver`) e publica o valor real em `--bruno-dock-h`. O número no CSS
virou só rede de segurança.

**Regra:** quando o valor existe no DOM, medir. Constante calibrada num
navegador que não é o do usuário é chute com aparência de número.

### 12.3 Folha sem botão de fechar

Só dava para fechar tocando fora. A folha É o módulo, cuja altura vem do
conteúdo — não há onde ancorar um X no topo dela.

Solução: barra **Concluir** ancorada na base, ENTRE a folha e o dock. Depende
só da altura do dock, que agora é medida. E no telefone o alcance do polegar
está embaixo, não no canto superior.

### 12.4 Hub de mídia pequeno demais

Com as duas fontes recolhidas a folha abria com **125 px** e lia como tira.
Piso `min-height: min(46dvh, 360px)`. O teto continua garantindo que a folha
nunca alcance a câmera.

### 12.5 Medido depois (428×926, shell real, tema Josh)

| | valor |
|---|---|
| dock publicado | medido, igual ao real |
| folha (todas as 17) | `position: fixed`, base 812 · dock em 868 → **56 px de folga** |
| botão Concluir | 812→856 · **12 px acima do dock** |
| altura da folha | 360 a 440 px (era 125 no hub) |
| folga até a câmera | 33 a 113 px |
| PIP | 124×93, canto inferior direito |

Tablet a 1920×1200: `main` grid, faixa do tema intacta (320 px,
`grid-row: 2 / -1`), resumo e botão em `display: none`, PIP 150×86, tiles da
faixa inalterados, A/C `relative`.

### 12.6 "Loading" e erro de configuração ao trocar de subview — NÃO é recriação

Verificado: o caminho vivo (`_sectionElement`) **cacheia** as seções; o
`replaceChildren` que recria está em `_setSectionOriginalRollback`, método morto
de rollback. Trocar de cômodo não remonta o componente.

Sobra a corrida de carregamento já registrada: o HA injeta os
`extra_module_url` sem esperar por eles, e o Lovelace não tenta de novo quando
um custom element ainda não registrou. São 47 recursos. É a mesma causa da
faixa vermelha no tablet e a correção é estrutural (Fases 6.5 e 7). **Não foi
introduzida nesta fase e não tem ajuste pontual.**
