# Fase 6.3D — viewport fixo de controles no mobile

**Data:** 2026-08-11 · **Estado:** DIAGNÓSTICO. **Nenhuma alteração de código.**
Aguarda validação antes de qualquer implementação.

Escopo: exclusivamente o layout mobile das subviews de cômodo. Nada de
tablet/desktop, nada fora de `@media (max-width: 800px)`.

---

## PARTE 1 — O "loading data"

### 1.1 O que já foi descartado, com evidência

| suspeito | verificação | veredito |
|---|---|---|
| a seção é recriada a cada troca | o caminho vivo é `_sectionElement`, que **cacheia** (`_sectionCache`). O `replaceChildren` que recria está em `_setSectionOriginalRollback`, método morto | descartado |
| navegação de URL recarrega o Lovelace | os cards de cômodo do telefone disparam `bruno_section`, igual à rail. Nenhum troca a view | descartado |
| a string é nossa ou de card HACS | `grep -ril "loading data"` em **todo** o `/config/www` da VM, incluindo `www/community` (39 cards de terceiros): **zero ocorrências** | descartado |

Sobra: **é string do próprio Home Assistant**, emitida por um elemento nativo.

### 1.2 Quais elementos nativos nós montamos

Só um: o **player de vídeo ao vivo**. `bruno-room-subview` cria
`ha-web-rtc-player` em `_criarPlayer()`, acionado por `_cuidarDoAoVivo()`
sempre que a câmera do palco muda. É trabalho do Codex, e não vou tocá-lo.

### 1.3 A hipótese que fecha com todos os fatos

```
ENTRAR na subview   → a câmera do cômodo inicializa o player  → estado de carga
SAIR para a Home    → a Home monta bruno-home-camera-card     → estado de carga
```

O segundo ramo é **nosso**: `bento_dynamic_phone.yaml`, criado nesta rodada,
colocou `bruno-home-camera-card` na Home do telefone. Antes, no telefone, a Home
tinha Energia e Mídia fixos — **nenhuma câmera**.

E o primeiro ramo também mudou de visibilidade: antes da nossa reordenação a
câmera da subview ficava em y=822, **abaixo da dobra**. Agora está em y=56. O
estado de carga provavelmente já existia; nós o trouxemos para o campo de visão.

Isso explica, sem forçar nada:

- por que é **só no mobile** (no tablet a Home nunca teve câmera dinâmica e a da
  subview sempre esteve visível — lá o comportamento é o de sempre);
- por que ocorre **na entrada E na saída** (dois players diferentes);
- por que **começou depois da nossa atualização** (um ramo é novo, o outro ficou
  visível).

### 1.4 O teste que decide, em 10 segundos

**Navegar de um cômodo direto para outro pela rail, sem passar pela Home.**

- se o "loading data" aparecer → é o player da subview (ramo 1);
- se NÃO aparecer → é a Home (ramo 2), e a causa é o card de câmera que
  acrescentamos.

Qualquer que seja o resultado, ele elimina metade das possibilidades.

### 1.5 Correção proposta — e ela já estava escrita por nós

O documento 26 (§6, "Requisitos que a 6.5B herda, já medidos") registra:

> **Nunca múltiplos streams automáticos no phone.** Medido na 6.2B: duas câmeras
> disputando a mesma fonte levaram uma a 100% de falha. No celular, com rede
> móvel, o custo é maior.

Eu não apliquei essa regra. A proposta é aplicá-la:

1. **no telefone, não iniciar o player ao vivo automaticamente.** A câmera
   mostra o instantâneo (que já funciona, com o motor da 6.2B) e o vídeo entra
   sob demanda — toque na imagem, que hoje já abre o more-info.
2. **na Home do telefone, tirar o slot de câmera da coluna dinâmica.** Roborock e
   Mídia continuam; a câmera é justamente a que carrega player. Quem quer ver
   câmera no telefone entra na seção Câmeras.

Custo: duas linhas de configuração e um guard. Ganho: sem estado de carga em
nenhum dos dois ramos, menos dados móveis, e a regra que nós mesmos escrevemos
passa a valer.

**Isto NÃO altera o trabalho do Codex** — o player continua existindo e
funcionando; muda apenas *quando* ele é acionado, e só abaixo de 800px.

---

## PARTE 2 — O viewport de controles

### 2.1 O que existe e é reaproveitado integralmente

| peça | classe | origem | reaproveitamento |
|---|---|---|---|
| faixa de status | `.subview-topband` / `.topband-badges` | componente | integral (já tem rolagem horizontal no telefone) |
| câmera | `.cameras-card` | componente | integral |
| cortina | `.curtain-dock` | dentro do hero | integral (já extraída como card no telefone) |
| iluminação | `.lights-card` | componente | integral |
| hub de mídia | `.media-hub-card` | componente | integral |
| ar-condicionado | `.ac-card` | componente | integral |
| eletrodomésticos | `.appliances-card` | componente (Cozinha) | integral |
| rail | `bento-sidebar-liquid-card` | shell | integral, intocada |

**Nenhum componente é reconstruído.** A mudança é de container, composição e
navegação — como o prompt pede.

### 2.2 O que sai

| peça | destino |
|---|---|
| `.resumo-telefone` (3 linhas) | removida do render |
| `.folha-scrim` | removida |
| `.folha-fechar` ("Concluir") | removida |
| CSS da folha (`position: fixed`, min/max-height, rodapé) | removido |
| evento `bruno-folha` + classe `tem-folha` na shell | **mantidos**, inertes — o prompt §1 diz que a infraestrutura de bottom sheet pode continuar existindo para usos secundários |
| `--bruno-dock-h` publicada pela shell | **mantida** — é informação correta e barata, útil a qualquer overlay futuro |

### 2.3 A decisão técnica central: como três módulos ocupam o mesmo slot

Os três módulos NÃO são irmãos no DOM: `.lights-card` e `.ac-card` vivem em
`.right-column`; `.media-hub-card` vive em `.cams-media-row`. Hoje o telefone
achata esses containers com `display: contents`, e eles viram itens diretos de
`.room-subview`.

Três caminhos possíveis:

| caminho | como | risco |
|---|---|---|
| A — envolver os três num wrapper no template | altera o DOM do TABLET | alto: mexe no que está validado |
| B — mover os nós para um wrapper via JS ao entrar no telefone | quebra a reconciliação do Lit | alto |
| **C — grid com os três na MESMA célula** | `.room-subview` vira grid no telefone; `display: contents` continua achatando os containers; os três módulos recebem a mesma `grid-row`/`grid-column` | **baixo — é só CSS** |

**Recomendo C.** O `display: contents` que já usamos faz os módulos
participarem do grid do `.room-subview`; basta colocá-los na mesma célula. Eles
se sobrepõem, e só o ativo fica visível.

```
.room-subview (grid, telefone)
  linha 1   .subview-topband
  linha 2   .cameras-card
  linha 3   divisor
  linha 4   .curtain-dock
  linha 5   .lights-card  ┐
            .media-hub-card ├ mesma célula: grid-row 5 / grid-column 1
            .ac-card      ┘
```

Consequências boas: nada de `position: fixed` (que nos custou três rodadas),
nada de wrapper novo, o tablet segue com o grid dele e o `main::before` continua
neutralizado só no telefone.

Para o swipe, cada módulo recebe `transform: translateX(...)` — o "trilho" é
virtual, e a posição sai de uma única variável CSS atualizada pelo JS.

### 2.4 O header com os seletores

Cada módulo tem cabeçalho próprio (`.lights-dock`, `.mh-head`, `.ac-head`).
O prompt (§13, §14) quer **um** header com ícone + nome à esquerda e os três
seletores à direita, sem barra de tabs adicional.

Proposta: um elemento novo `.viewport-head`, renderizado uma vez, oculto acima
de 800px. No telefone, esconder apenas a **parte de título** do cabeçalho de
cada módulo e **preservar as ações** (`Todas acesas`, `Apagar todas`,
`Apagar zona`), que continuam dentro do conteúdo.

Isso mantém a regra do prompt §18 (preservar as ações) sem duplicar cromo.

### 2.5 Iluminação aberta por padrão no telefone

`_lightsOpen` nasce `false`. No telefone o dock não deve existir como dock.

Proposta em CSS puro: no telefone, `.lights-body` recebe
`grid-template-rows: 1fr` independentemente de `is-open`, e o chevron some. A
célula do grid dá altura definida ao módulo, que é a condição que faltava — foi
medido em 2026-08-10 que `1fr` colapsa quando não há altura definida acima.

Sem tocar em `_lightsOpen`, então o tablet não muda.

### 2.6 O viewport não é card

Os módulos são `.glass-card` e recebem fundo, borda, raio e sombra do material
do tema. No telefone precisam virar plano contínuo.

Isso exige neutralizar **com a mesma forma composta que o material usa**
(`.glass-card.lights-card`), pela lição de 2026-08-10: o CSS do material é
injetado depois e empate em especificidade significa perder.

Neutralizar: `background: none`, `border: 0`, `border-radius: 0`,
`box-shadow: none`, `backdrop-filter: none`, e o `::before`/`::after` do
`.glass-card` (sheen e edge-glow). O divisor e o header ficam por conta de
filetes de 1px.

---

## PARTE 3 — O orçamento de altura, MEDIDO

Este é o achado que precisa de decisão antes de escrever código.

### 3.1 Quanto sobra para o viewport

Medido a 428×926, shell real, tema Josh. Dobra: **822** em tela cheia, **775**
se a barra de status ocupar espaço.

```
faixa de status      36
gap                   8
câmera              283
gap                   8
divisor              13
cortina             140
gap                   8
padding do slot      16
─────────────────────────
consumido           512

VIEWPORT = 310 px (tela cheia)  ·  263 px (com barra)
Cozinha (sem cortina) = 471 px  ·  424 px
```

### 3.2 De quanto os módulos precisam

Altura natural medida, forçando cada módulo em fluxo (sem o cromo do viewport):

| cômodo | iluminação | hub | A/C | eletrodomésticos |
|---|---|---|---|---|
| sala | **348** | 251 | 254 | — |
| office | 193 | 92 | 249 | — |
| cozinha | 193 | — | — | **410** |
| casal | 294 | 92 | 249 | — |
| marina | 294 | 92 | 249 | — |
| miguel | **348** | 92 | 249 | — |

Somando o header do viewport (~44) e o respiro interno (~20):

| cômodo | iluminação | hub | A/C | cabe em 310? |
|---|---|---|---|---|
| sala | 412 | 315 | 318 | **não** — falta 102 na iluminação |
| miguel | 412 | 156 | 313 | **não** — falta 102 |
| casal · marina | 358 | 156 | 313 | **não** — falta 48 |
| office | 257 | 156 | 313 | iluminação e hub sim; A/C falta 3 |
| cozinha | 257 | — | eletro 474 | viewport é 471 — falta 3 |

**Nenhum cômodo comporta os três módulos sem scroll interno.** Com a barra de
status (263 px) a folga desaparece de vez.

### 3.3 As três alavancas, com o ganho de cada uma

| alavanca | hoje | proposta | ganho |
|---|---|---|---|
| **cortina** | 140 | ~88 (título e estado na mesma linha dos botões) | **+52** |
| **câmera** | 283 | ~238 (feed 16:9 com o nome sobreposto, sem cabeçalho próprio) | **+45** |
| **scroll interno** | — | permitido pelo prompt §12 quando o conteúdo excede | o resto |

Com as duas primeiras: consumido 415 → **viewport 407 px** (tela cheia) /
**360 px** (com barra).

| cômodo | iluminação | cabe em 407? | cabe em 360? |
|---|---|---|---|
| sala · miguel | 412 | falta 5 | falta 52 |
| casal · marina | 358 | **sim** | falta 2 |
| office · cozinha | 257 | **sim** | **sim** |
| A/C (todos) | 313-318 | **sim** | **sim** |
| hub (sala) | 315 | **sim** | **sim** |

Ou seja: com as duas reduções, **só a Iluminação da Sala e do Q. Miguel** (7 e 8
luzes) precisa de scroll interno, e por pouco. É exatamente o caso que o prompt
§12 prevê e autoriza.

### 3.4 O que preciso que você decida

| # | decisão | recomendação |
|---|---|---|
| **D1** | reduzir a cortina de 140 para ~88 px | **sim** — é o módulo mais gordo por informação (título, estado e 3 botões em 3 linhas; cabem em 2) |
| **D2** | reduzir a câmera de 283 para ~238 px | **sim** — o feed vira 16:9 puro com o nome sobreposto na imagem, que é o padrão de câmera. Continua sendo o elemento âncora e dominante |
| **D3** | aceitar scroll interno na Iluminação da Sala e do Q. Miguel | **sim** — previsto no §12; alternativa seria encolher os tiles de luz, o que o §12 proíbe |
| **D4** | Cozinha: os eletrodomésticos entram no viewport como 4º módulo? | **sim** — ela não tem hub nem A/C, então o viewport dela teria só Iluminação. Com eletrodomésticos ficam dois |
| **D5** | tirar o slot de câmera da Home do telefone (Parte 1) | **sim** — é metade do "loading data" e economiza dados |

---

## PARTE 4 — Riscos

| # | risco | mitigação |
|---|---|---|
| R1 | neutralizar o `.glass-card` vazar para o tablet | tudo dentro de `@media (max-width: 800px)`; verificação por script de que nenhuma regra do arquivo novo vive fora de media query (já é rotina) |
| R2 | o `main::before` do tema voltar a atrapalhar no grid novo | ele já é `content: none` no telefone; com grid volta a existir a chance de posicionamento — manter a neutralização e medir |
| R3 | swipe conflitar com a rolagem horizontal da faixa de status e com o scroll interno da Iluminação | `touch-action` por eixo e limiar de direção; medir com evento sintético no banco |
| R4 | handlers de swipe ativos no tablet | guarda por `matchMedia('(max-width: 800px)')` no início do handler |
| R5 | a Cozinha ter 2 módulos e os demais 3 | o header lista só os módulos que o cômodo tem — a lista já é montada por configuração |

---

## PARTE 5 — Ordem de implementação

Espelha as oito etapas do prompt, com o ponto de medição de cada uma.

| etapa | entrega | como valido |
|---|---|---|
| 1 | grid do telefone: status, câmera, divisor, cortina, viewport vazio | posições dos 4 blocos nos 6 cômodos; tablet inalterado |
| 2 | Iluminação no viewport, aberta, sem moldura | altura do conteúdo vs viewport nos 6 |
| 3 | teste nos 6 cômodos (muitas luzes, poucas, espaço negativo, overflow) | tabela de folga/déficit por cômodo |
| 4 | Hub e A/C na mesma célula | os três na mesma `grid-row`, só um visível |
| 5 | seletores no header | troca sem mover câmera, cortina ou rail |
| 6 | swipe horizontal | deslocamento só do viewport; R3 medido |
| 7 | transição | duração e easing |
| 8 | refino: filetes, transparência, espaço negativo, estados | comparação com a faixa de tiles da Home |

Cada etapa é medida no banco `gen-shell-harness.mjs` — que monta a shell real e
força o tema Josh — antes de ir para a VM.

---

## PARTE 6 — O que NÃO será tocado

- qualquer coisa fora de `@media (max-width: 800px)` no CSS do telefone;
- `subview-styles.generated.ts` (transcrição, continua regenerável);
- o player ao vivo e a configuração de câmera do Codex — só *quando* ele é
  acionado no telefone muda, e isso é configuração, não o player;
- a rail, a shell (salvo o que já existe), a Home do tablet, packages, sensores,
  automações.
