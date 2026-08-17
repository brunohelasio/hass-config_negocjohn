# 24 — Baseline de runtime

Medida **no tablet**, que é onde ela vale. O harness do computador não reproduz a
WebView, a memória do aparelho nem a CPU da VM.

---

## Baseline 1 — 2026-08-06

| | |
|---|---|
| Build | `bruno-dashboard.BVD0DIRv.js` |
| Sessão | 363 s (~6 min) de uso real, navegando entre cômodos |
| Coleta | painel Config → Diagnóstico → Copiar baseline |

### Componentes

| componente | instâncias (criadas/encerradas) | renders | média | pior | timers | requisições |
|---|---|---|---|---|---|---|
| `bruno-room-subview` | 19 / 19 | 98 | 3,1 ms | **26,4 ms** | 46 / 46 | **13, sendo 4 falhas** |
| `bruno-room-tile` | 8 / 0 | **1.248** | 0,09 ms | 6,4 ms | 0 / 0 | — |

### Ambiente

| medida | valor |
|---|---|
| Tarefas longas | **50**, somando 4.861 ms, **pior 573 ms** |
| Vazamentos | instâncias 8 · timers 0 · listeners 0 · assinaturas 0 |
| Timers vivos | 0 |
| Memória | 73 amostras, **todas iguais** (ver ressalva) |

---

## Leitura

### 1. As câmeras são o pior problema, e por larga margem

```
13 requisições · 4 falhas (31%) · 81.338 ms no total
média 6.257 ms · pior 10.184 ms
```

**Seis segundos de média para um instantâneo, e dez segundos no pior caso.** É a
explicação medida do que o usuário já vinha relatando como "câmera demora
horrivelmente". Uma falha a cada três tentativas.

Isso muda o peso da Fase 6.2B: o problema não é "o instantâneo é inferior ao
stream". O problema é que **o instantâneo, do jeito que está, já é lento demais**
— e o alvo a bater é este número, não um ideal abstrato.

Hipóteses a investigar, em ordem de suspeita:
1. a VM demora a produzir o quadro (Tuya → Xtend → `camera_proxy`);
2. o ciclo de 6,5 s dispara a próxima busca antes de a anterior terminar,
   empilhando requisições;
3. as 4 falhas são timeout, e o retry implícito piora a fila.

### 2. Tarefas longas: 573 ms de travamento no pior caso

50 tarefas longas em 6 minutos, somando 4,8 s de interface bloqueada. **573 ms
num único bloqueio** é meio segundo em que o toque não responde.

O `pior render` medido é 26,4 ms — muito abaixo disso. Ou seja: **o bloqueio não
está nos componentes novos.** Vem de outro lugar — decodificação de imagem,
`card_mod`, ou o YAML legado. É o que a 6.1 precisa localizar.

### 3. O tile renderiza 1.248 vezes em 6 minutos

156 renders por tile, ~26 por minuto. Cada um custa 0,09 ms, então não é o
gargalo — mas é sinal de que a assinatura de estado do tile ainda deixa passar
mudança irrelevante. Alvo natural da 6.1, com ganho pequeno.

### 4. Vazamentos: limpo

`bruno-room-subview` fecha tudo o que abre — 19/19 instâncias, 46/46 timers.
Timers vivos: 0. Os 8 "vazamentos de instância" são os 8 tiles da Home, que
continuam montados de propósito.

**O critério da 6.1 já tem referência:** depois de 50 navegações, estes números
têm de continuar assim.

### ⚠️ Ressalva — a memória não é medível nesta WebView

```
usado:  10.000.000   (exatamente, em todas as 73 amostras)
limite: 2.190.000.000
crescimento: 0
```

Valores redondos demais e imóveis por 6 minutos. A WebView **quantiza**
`performance.memory` quando a página não está isolada entre origens — o número
existe, mas não tem resolução para medir crescimento.

**Consequência:** memória sai do conjunto de métricas confiáveis desta baseline.
O sinal de vazamento passa a ser exclusivamente o par criados/encerrados, que é
contado pelo próprio dashboard e não depende do navegador.

Alternativa, se um dia for necessário: `performance.measureUserAgentSpecificMemory()`,
que exige cross-origin isolation — e isso é configuração de servidor do HA, fora
do escopo do frontend.

---

## Prioridades que esta baseline define para a 6.1

| # | alvo | número atual |
|---|---|---|
| 1 | Latência e falha das câmeras | 6.257 ms de média, 31% de falha |
| 2 | Origem das tarefas longas | 573 ms no pior caso |
| 3 | Renders do tile | 1.248 em 6 min |
| 4 | Vazamentos | já em zero — **manter** |

---

## Como colher de novo

Painel: **rail → Config → Diagnóstico → Copiar baseline**.

Antes de copiar:
1. navegue por três ou quatro cômodos e volte à Home — sem isso a lista de
   componentes vem quase vazia;
2. deixe rodar alguns minutos — as amostras são de 5 em 5 segundos.

Console, se preciso: `brunoRuntime.texto()`.

---

## Baseline 2 — 2026-08-06, sessão mais longa (466 s)

| componente | instâncias | renders | média | pior | timers | requisições |
|---|---|---|---|---|---|---|
| `bruno-room-subview` | 8 / 8 | 21 | 7,9 ms | 32,6 ms | 16 / 16 | 3, **pior 5.638 ms** |
| `bruno-room-tile` | 16 / 8 | **2.248** | 0,2 ms | 15,7 ms | 0 / 0 | — |
| `bruno-devices-panel` | 1 / 1 | 3 | 0,9 ms | 2,4 ms | 0 / 0 | — |

| ambiente | valor |
|---|---|
| Memória usada | **110,6 MB** |
| **Crescimento** | **101,1 MB em 466 s** |
| Tarefas longas | **178**, somando 16.165 ms, pior **444 ms** |
| Vazamentos | instâncias 8 (os tiles da Home) · timers 0 · listeners 0 · assinaturas 0 |

---

## ⚠️ Correção da Baseline 1 — a memória É medível

Na Baseline 1 eu concluí que `performance.memory` era quantizada demais nesta
WebView e a tirei do conjunto confiável. **Estava errado.**

O que aconteceu: naquela sessão o valor ficou em `10.000.000` nas 73 amostras.
Eu li isso como "número congelado". Era outra coisa — o valor **é** grosso
(arredondado a blocos), e naquela janela o consumo não saiu do primeiro bloco.

Com 466 s a leitura se move e é inequívoca:

```
primeira:  10.000.000    (10 MB)
última:   116.000.000   (116 MB)
crescimento: 106.000.000  (101 MB)
```

**Resolução baixa não é ausência de sinal.** Concluir "não dá para medir" a
partir de uma janela curta foi o erro — e o tipo de erro que este documento
existe para evitar.

### E o número é preocupante

**101 MB em menos de 8 minutos**, num orçamento de app que a auditoria estimou
em ~253 MB. Nesse ritmo, um painel de parede ligado o dia inteiro estoura.

Não é o mesmo que vazamento de recurso: os contadores de instância, timer e
listener estão todos zerados. O crescimento é de **dados**, não de estrutura —
provavelmente os instantâneos de câmera, que chegam a cada 6,5 s por câmera e
ficam retidos enquanto houver referência a eles.

**Isto vira alvo nº 1 da Fase 6.1, junto com a latência das câmeras — e as duas
suspeitas apontam para o mesmo lugar.**

---

## Sondagem das câmeras — resultado, e por que ele ainda não decide

```
Total 8 · WebRTC 0 · HLS 0 · Só instantâneo 8 · Fora do ar 0
Todas as 8: "instantaneo · stream"
```

Duas leituras:

1. **As 8 câmeras estão no ar** — inclusive `camera.qmi_camera_2`. Nenhuma
   aparece como fora do ar.
2. **Todas declaram o bit de STREAM**, mas **nenhuma publica
   `frontend_stream_type`** como atributo de estado.

O segundo ponto torna a sondagem **inconclusiva**, não negativa. "Declara stream
e não diz o tipo" não é o mesmo que "não tem stream". Em versões recentes do
Home Assistant esse dado saiu do estado da entidade e passou a ser respondido
pelo WebSocket, em `camera/capabilities`.

**Corrigido:** a sondagem agora pergunta ao HA por esse comando e usa a resposta;
se ele não existir nesta versão, cai de volta na leitura por atributo, sem
quebrar o painel. Recolher para fechar a 6.0.5.

---

## Q. Miguel — a câmera existe e está no ar

`camera.qmi_camera_2` aparece na sondagem, no ar, com stream declarado, igual às
outras sete. E a configuração dela no dashboard é idêntica à do Q. Marina e à do
Q. Casal.

**Então não é entidade ausente nem cômodo mal configurado.** Sobram:

- o instantâneo daquela câmera especificamente demora mais que o teto e é
  abandonado — coerente com a média de 4,2 s e o pior de 5,6 s desta sessão;
- a câmera responde ao HA mas não entrega quadro (offline no lado do fabricante).

O caminho é abrir a subview do Q. Miguel, esperar, e comparar `requisições:
falhas` antes e depois. Se a falha aparecer, é timeout — e cai no mesmo alvo nº 1.

---

## Sondagem profunda — o veredito, e uma posição minha que cai

```
Total 8 · WebRTC 8 · HLS 0 · Só instantâneo 0 · Fora do ar 0
"8 de 8 com WebRTC — vale medir stream nessas."
```

Todas as oito, inclusive `camera.qmi_camera_2`, respondem `web_rtc` ao comando
`camera/capabilities`.

### Eu estava errado, e escrevi isso no roteiro

Na revisão do roteiro (v2, correção 1) afirmei:

> "São 8 câmeras Tuya, via integração Xtend. **Tuya não expõe WebRTC nativamente
> no HA**; o caminho realista é RTSP → `stream` → HLS, que transcodifica **na
> VM**."

**Não é o caso neste sistema.** As oito negociam WebRTC. Isso significa: sem
transcodificação na VM, latência baixa, e o custo de CPU do servidor sai da
conta que eu tinha montado.

A afirmação veio de conhecimento geral sobre a integração Tuya, não deste
sistema — e a sondagem existe exatamente para isso. Foi a leitura por atributo
que quase confirmou meu erro (`instantaneo` em todas as oito); só a pergunta
pelo WebSocket deu a resposta certa. **Meia investigação teria produzido a
conclusão errada com aparência de dado medido.**

### O que muda na Fase 6.2B

O que eu havia escrito | O que vale agora
---|---
"Instantâneo é o padrão até o stream vencer" | O stream tem caminho barato — e o instantâneo, medido, já é ruim (6 s de média)
"Stream é opt-in, uma câmera por vez, por causa da CPU da VM" | A restrição de CPU cai; a restrição que sobra é o cliente (WebView, memória, rede)
"Se o stream perder de novo, registra-se como decisão" | O alvo passa a ser **substituir** o instantâneo, não empatar com ele

As oito métricas de aceite continuam valendo — elas medem o que interessa
independentemente do caminho escolhido.

---

## Baseline 3 — 15 s após reinício: o crescimento é de CARGA, não de vazamento

| medida | valor |
|---|---|
| Desde o carregamento | **15 s** |
| Memória usada | 132,9 MB |
| Crescimento | **121,0 MB** |
| Tarefas longas | 3 · pior 118 ms |
| `bruno-room-tile` | 72 renders, média 0,1 ms, pior 1,4 ms · 8 vivos |
| Vazamentos | 8 instâncias (os tiles) · timers 0 · listeners 0 |

### Segunda correção sobre memória

Na Baseline 2 eu li "101 MB em 466 s" e escrevi que **"nesse ritmo, um painel de
parede ligado o dia inteiro estoura"**. Essa frase não se sustenta.

Aqui, **121 MB em 15 segundos**. Ou seja: o crescimento é **quase todo
front-loaded** — é o custo de montar o dashboard, não um acúmulo linear ao longo
do tempo. A primeira amostra é colhida no carregamento do bundle, antes de o
painel existir; o salto que aparece como "crescimento" é a construção da tela.

**O que isso realmente diz:** o dashboard custa ~120 MB para carregar, num
orçamento estimado em ~253 MB. É muito, e é alvo legítimo — mas é um problema de
**tamanho**, não de **vazamento**, e o remédio é outro.

**O que ainda não está medido:** se, depois de carregado, o consumo continua
subindo. Para responder isso é preciso uma sessão longa — 30 minutos ou mais,
sem recarregar. Fica como a medição pendente da 6.1.

Duas leituras erradas seguidas sobre a mesma métrica, em direções opostas:
primeiro achei que não dava para medir, depois li um número de carga como se
fosse taxa. A lição prática: **`crescimento` só vira "taxa" com sessão longa e
sem recarga.** O painel passa a merecer essa ressalva à vista.

---

## Baselines 4 e 5 — a mesma sessão em dois instantes (2026-08-06)

Dois retratos do tablet no mesmo carregamento, mesmo build
(`bruno-dashboard.CQEdeZDI.js`), com 568 s e 1391 s de sessão. Ter os dois é o
que permite ler **taxa**, e não só total.

| | 568 s | 1391 s | nos 823 s |
|---|---|---|---|
| `bruno-room-tile` renders | 2.344 | 5.672 | **+3.328 → 4,0/s** |
| `bruno-room-subview` renders | 96 | 135 | +39 |
| `bruno-devices-panel` renders | 7 | 7 | **0** |
| Tarefas longas | 75 | 152 | +77 → 1 a cada 10,7 s |
| Pior tarefa longa | 504 ms | 504 ms | **inalterada** |
| Requisições de câmera | 25 (6 falhas) | 28 (7 falhas) | 25% de falha, pior 10,1 s |
| Memória usada | 9,5 MB | 110,6 MB | — |
| Timers vivos | 0 | 0 | 0 |
| "Aberto e não fechado" | 8 | 8 | 8 |

### Três leituras, e duas são contra o próprio painel

**1. O "Aberto e não fechado: 8" era falso positivo.** Os 8 são os
`bruno-room-tile` da Home, montados e visíveis. A métrica somava
`criados − encerrados` de tudo e chamava a diferença de vazamento — ou seja,
gritava exatamente quando estava tudo certo. Um alarme que sempre toca deixa de
ser lido. Corrigido: vazamento passou a ser só timer, listener e assinatura;
instância virou `vivos`, que é informação.

**2. A memória não podia ser afirmada com esses dois pontos.** `usedJSHeapSize`
sobe e despenca a cada coleta de lixo; 9,5 MB pode ser logo depois de uma coleta
e 110,6 logo antes da próxima. O que denuncia retenção é o **piso** — o mínimo
depois de cada coleta. As 720 amostras já estavam guardadas; faltava a
aritmética. O painel agora mostra piso, pico e crescimento do piso, com veredito.
Esta é a **terceira** correção sobre a mesma métrica nesta fase.

**3. A pior tarefa longa não mudou entre os dois retratos** — logo, aconteceu na
carga e nunca se repetiu. Somar tudo num número só escondia isso. O painel agora
separa "na carga" de "depois", com ritmo por minuto.

### O defeito que a atribuição de render revelou

A 6.0 contou 3.328 renders de ladrilho e **não soube dizer qual entidade os
causou**. A 6.1 acrescentou o motivo a cada render — e o primeiro número medido
foi: **2.767 de 2.800 renders com motivo "outro"**, isto é, vindos de fora do
observador de entidades.

A causa: `_hass` estava declarado como **propriedade reativa** do Lit
(`static properties = { _hass: { state: true } }`). Toda atribuição a uma
propriedade reativa pede um render. Como o setter atribui sempre — o componente
precisa do hass mais recente para agir —, o `return` da guarda nunca evitava
nada: o render já tinha sido pedido na linha anterior.

**A guarda por assinatura existia desde a Fase 5 e nunca funcionou.** Era ela a
origem dos 4 renders por segundo. E não dava para ver antes, porque a contagem
não dizia quem pedia o render.

### Medição da 6.1

Banco próprio: `scripts/harness/gen-render-harness.mjs`. Ele reproduz o que o HA
faz — uma sequência de objetos `hass`, cada um com UMA entidade diferente da
anterior, 10% delas tocando o que os componentes leem.

| | sem estado seletivo | com | redução |
|---|---|---|---|
| 7 ladrilhos · 400 atualizações · 40 relevantes | 2.800 renders | **40** | **98,6%** |
| 1 subview · 200 atualizações · 20 relevantes | 200 renders | **20** | **90,0%** |

Nos dois casos o resultado é o ótimo teórico: **um render por mudança
relevante**, no componente certo. Ciclo de navegação: 50 montagens/desmontagens,
`desdeAMarca` zerado em instâncias, timers, listeners e assinaturas.

**Armadilha da medição, registrada:** a primeira rodada deu 99,8% de redução —
bom demais. O Lit agrupa os `requestUpdate` pendentes num único ciclo, e um laço
síncrono de 400 passos virava UM render por componente. Estava medindo o
agrupamento do Lit, não o estado seletivo. Com `await updateComplete` a cada
passo, o número honesto apareceu. Na casa real as mudanças chegam espalhadas no
tempo, cada uma com seu ciclo.

**Segunda armadilha:** `requestAnimationFrame` não dispara com a aba em segundo
plano, e a medição roda com a aba oculta. O banco usa `setTimeout`.

---

## Baseline 6 — a 6.1 no tablet, 146 s (2026-08-06)

Build `bruno-dashboard.BCJ0a8F_.js`, o primeiro com estado seletivo.

### O resultado

| | antes (6.0) | agora (6.1) |
|---|---|---|
| `bruno-room-tile` | 3.328 renders em 823 s = **4,04/s** | 47 em 146 s = **0,32/s** |
| Vazando (timer/listener/assinatura) | 0 | 0 |
| Componentes montados | 8 (contados como vazamento) | 8 (contados como informação) |

**12,6× menos renders de ladrilho**, medido no aparelho. Dos 47, 8 são a
montagem inicial — um por ladrilho.

E agora dá para ver a causa de cada um. O maior ofensor da sessão foi
`binary_sensor.corredor_motion_recent` + `sensor.corredor_semantic_state`, com 9
renders: alguém andando pelo corredor. É informação acionável; antes era só um
contador subindo.

### O que este retrato ensinou sobre memória — a quarta correção

Leitura: `usada 9,5 MB · piso 9,5 MB · pico 9,5 MB · crescimento do piso 0,0 MB`.
Em ~29 amostras, **um único valor**.

Cruzando com as baselines anteriores:

| sessão | tempo | heap lido |
|---|---|---|
| 6 (esta) | 146 s | 9,5 MB |
| 4 | 568 s | 9,5 MB |
| 5 (mesma sessão da 4) | 1391 s | 110,6 MB |
| 1 | 365 s | 73 amostras idênticas |

O padrão é claro e não é dente-de-serra: **o valor fica parado por muitos minutos
e então salta**. É a quantização do `performance.memory` — o navegador não
entrega medida contínua, para a métrica não virar canal de espionagem.

Isso invalida a correção anterior tanto quanto as duas antes dela. Com um valor
só, piso, pico e crescimento são **o mesmo número**, e o veredito "piso estável"
era conclusão tirada de nada — dita com a aparência de dado medido.

**Correção definitiva:** o coletor agora conta os DEGRAUS (valores distintos
lidos) e se recusa a emitir veredito com menos de dois. O painel marca o campo em
alerta enquanto houver um degrau só.

Quatro leituras erradas da mesma métrica, em três direções diferentes. A lição
que fica não é sobre memória: **quando uma métrica engana repetidamente, o
conserto é ensinar o instrumento a dizer "não sei", não afinar a interpretação.**

### O que continua aberto

- **Câmeras: 16 requisições, 4 falhas (25%), pior 10.039 ms.** Inalterado — a
  6.1 não mexeu nisso. É o alvo da 6.2B, com 8 de 8 suportando WebRTC.
- **Tarefas longas: 20 depois da carga em 146 s (10,4/min), pior 502 ms na
  carga.** A separação carga/uso funcionou; falta atribuir as de uso.
- **`bruno-room-subview`: "outro (22)"** de 47 renders. Corrigido para separar
  `montagem` (custo de navegar) de `interação` (resposta ao toque) — são coisas
  diferentes e estavam no mesmo balde.

---

## Baseline 7 — a parte 1 da 6.2B no PC, e uma regressão minha (2026-08-07)

Build `bruno-dashboard.BGs_M_Cz.js`, 442 s de sessão, navegando entre cômodos.
Colhida no PC, a pedido do usuário: *"acho que a renderização das câmeras até
piorou"*.

Ele está certo. E o dado aponta o culpado sem margem.

### As câmeras

| câmera | req | falhas | 1º quadro | pior |
|---|---|---|---|---|
| of_camera_2 | 3 | **3** | **nunca renderizou** | 8.001,5 ms |
| cz_camera_2 | 3 | 2 | 7.660,9 ms | 8.009,3 ms |
| qmi_camera_2 | 8 | 3 | 6.507,9 ms | 8.012,3 ms |
| camera_quarto_casal_2 | 2 | 1 | 7.298,0 ms | 8.008,0 ms |
| as_camera_2 | 2 | 1 | 4.159,8 ms | 8.001,8 ms |
| sl_camera_2 | 1 | 0 | 6.734,7 ms | — |
| vr_camera_2 | 1 | 0 | 6.673,0 ms | — |
| qma_camera_2 | 1 | 0 | 3.874,6 ms | — |

**As 10 falhas caem todas em ~8.001 ms.** Esse número não vem das câmeras: é o
**prazo de 8 s que eu introduzi na parte 1**. Eu abortei requisições que estavam
a caminho e teriam chegado.

O primeiro quadro legítimo leva de **3,9 s a 7,7 s** nessas câmeras. Um prazo de
8 s fica DENTRO da faixa normal de operação — vira gerador de falsa falha. E
falsa falha aciona o recuo exponencial, que afasta a tentativa seguinte e piora
exatamente o que se queria melhorar. A câmera do Office nunca renderizou: três
tentativas, três cortes meus.

Antes da parte 1 não havia prazo. Uma câmera lenta demorava 9, 10, 12 s e a
imagem **aparecia**. Depois, ela era cortada e não aparecia mais.

**Lição:** um prazo é uma afirmação sobre a distribuição do tempo de resposta.
Eu escolhi 8 s **sem olhar a distribuição** — e ela estava no relatório anterior
(média de 6,2 s). Média de 6,2 s significa que metade das amostras passa disso.

### O segundo defeito, achado junto

O elemento de imagem nascia com URL **carimbada com selo**, então:

1. nunca reusava o cache do navegador entre visitas ao cômodo;
2. o motor disparava OUTRA requisição no mesmo instante, com selo diferente.

**Duas requisições lentas por câmera na montagem, competindo**, num servidor que
leva de 4 a 8 s por quadro.

### Correções (rev.2)

| # | correção |
|---|---|
| 1 | prazo 8 s → **25 s**. A regra "nunca duas em voo" já impede o acúmulo; o prazo só existe para que uma requisição pendurada não trave a câmera para sempre |
| 2 | URL inicial **sem selo** — o primeiro quadro é do elemento, e ele pode vir do cache |
| 3 | motor com `atrasoInicial` de uma cadência: entra só na primeira ATUALIZAÇÃO |
| 4 | métrica nova `câmera <nome> · até aparecer`: tempo entre abrir o cômodo e a imagem estar na tela — que é o que o usuário chama de "demora", e não a duração da requisição |

36 testes de unidade (5 novos, incluindo "uma resposta de 10 s é sucesso, não
falha"). Verificação de integração no navegador: 5 atualizações em 22 s, zero
falhas, zero vazamentos.

### A memória — o instrumento finalmente tem sinal

```
piso inicial ........  18,2 MB
piso final .......... 119,3 MB
crescimento do piso .  96,4 MB   em 442 s
degraus .............  64
veredito ............ "isto é retenção, não oscilação"
```

Esta é a **primeira leitura de memória confiável de toda a Fase 6**. Nas
anteriores havia UM valor lido, e o instrumento se recusava a opinar — a correção
da 6.1 funcionou exatamente como projetada: ele calou quando não sabia e falou
quando passou a saber.

**Hipótese, com a aritmética:** quadros de câmera decodificados. Um instantâneo
de 1920×1080 ocupa 8,29 MB decodificado. Foram ~11 carregamentos bem-sucedidos
na sessão: 11 × 8,29 = **91 MB**, contra 96,4 MB de crescimento do piso. Além
disso, cada quadro tem URL única (o selo), então nenhum reusa entrada de cache.

**Descartado por verificação, não por suposição:** não é retenção de instância —
`vivos: 0` para a subview, timers 95/95, listeners 22/22, e o
`bruno-surface-material.js` guarda os hosts em `WeakMap`.

**A hipótese ainda NÃO está confirmada.** O experimento que decide, e é barato:
deixar a Home aberta 7 minutos e ler o crescimento do piso; depois deixar uma
subview com câmera aberta 7 minutos e ler de novo. Se o crescimento só aparecer
com câmera, está confirmado — e a correção é trocar `<img src>` por
`fetch` + `createObjectURL` + **`revokeObjectURL` do quadro anterior**, que dá
liberação determinística em vez de esperar o navegador despejar.

### O que NÃO é defeito

*"Só atualiza a imagem após um intervalo de alguns segundos."* É a natureza do
instantâneo: cada quadro é uma requisição que leva de 4 a 8 s, e a cadência
espera o anterior terminar. Nenhum ajuste de cliente muda isso. **É exatamente o
que a parte 2 (WebRTC) resolve** — lá o quadro flui, não é pedido.

---

## Baseline 8 — a rev.2 no PC: melhorou, e sobrou o Q. Miguel (2026-08-07)

Build `bruno-dashboard.DFKUsoLs.js`, 266 s. Usuário: *"o tempo de renderização
das câmeras melhorou"*.

### Tempo ATÉ APARECER (métrica nova — abrir o cômodo → imagem na tela)

| câmera | até aparecer | falhas |
|---|---|---|
| sl_camera_2 | 5.844 ms | 0 |
| cz_camera_2 | 5.959 ms | 0 |
| vr_camera_2 | 6.185 ms | 0 |
| as_camera_2 | 6.490 ms | 0 |
| qma_camera_2 | 6.663 ms | 0 |
| camera_quarto_casal_2 | 6.899 ms | 0 |
| of_camera_2 | 12.008 ms | 0 |
| **qmi_camera_2** | **49.479 ms** | **3 de 5** |

Sete câmeras convergiram para ~6 s. A do Q. Miguel levou **49 segundos** — e é
exatamente a que o usuário aponta há semanas.

### O que os 49 s revelam

O pior tempo do Q. Miguel é **10.004 ms**. Isso não é o prazo do motor (25 s):
é o **tempo limite do próprio Home Assistant** ao buscar imagem de câmera. A
câmera falha no lado do servidor em 3 de 5 tentativas.

E aí o meu recuo exponencial piorava: falha → 13 s → falha → 26 s. Somando,
49 s até a primeira imagem.

**A distinção que faltava:** recuar protege a VM de uma câmera morta, mas **antes
do primeiro quadro o usuário está olhando para uma caixa vazia**. Depois que há
imagem na tela, recuar não custa nada visualmente.

### Correções (rev.3)

| # | correção |
|---|---|
| 1 | recuo passa a distinguir **com** e **sem** imagem na tela: sem imagem, tolera 4 falhas antes de recuar (em vez de 2) e o teto cai de 60 s para 12 s |
| 2 | `buscarAgora(entityId)`: quando o elemento de imagem falha sozinho, o motor tenta na hora em vez de esperar uma cadência inteira |

42 testes de unidade no motor.

### A memória — a hipótese caiu, e por um erro meu de instrumento

A baseline acusou de novo: piso de 12,3 MB → 115,9 MB, +98,7 MB em 266 s,
54 degraus.

**Minha hipótese era quadros de câmera decodificados** — a aritmética batia
(11 × 8,29 MB = 91 MB, contra 96 MB medidos). Testei, e ela **está errada**:

```
40 imagens com URL única  -> heap +0,1 MB
40 imagens com URL igual  -> heap +0,0 MB
```

`performance.memory.usedJSHeapSize` mede **só o heap JavaScript**. Bitmap
decodificado vive no cache de imagens do renderizador, FORA desse heap. Imagem
nenhuma aparece nessa métrica, por construção — a coincidência aritmética era
coincidência.

> **A primeira versão do experimento imprimiu "hipótese CONFIRMADA"**, porque
> comparava 0,1 MB com 0,0 MB por RAZÃO e o limiar era 3×. Razão sobre ruído dá
> qualquer coisa. **Comparação proporcional exige magnitude mínima antes de
> valer.** É a mesma família de erro das quatro leituras anteriores de memória.

### O que o experimento certo mostrou

40 montagens e desmontagens da subview, medindo o heap JS:

```
início 3,3 MB -> fim 8,9 MB · +5,6 MB · 143 KB por montagem · vazamentos 0
```

Na sessão do usuário foram **28 montagens** → ~4 MB. A baseline mediu ~98 MB.
**O crescimento não vem dos componentes do dashboard**; vem do frontend do Home
Assistant, que ocupa a mesma página (fluxo de estados pelo WebSocket, histórico,
caches próprios).

Isso encerra a investigação de memória no escopo deste projeto: está medido,
atribuído e fora do alcance do dashboard.

### O que continua sendo limitação, não defeito

*"No SmartLife é em tempo real."* É: o SmartLife mantém um stream. O instantâneo
é pergunta e resposta — cada quadro é uma requisição de ~6 s ao HA, e a cadência
espera a anterior terminar. O usuário observou por conta própria que **no próprio
HA também não é instantâneo**, o que confirma que o teto é do servidor.

O caminho para tempo real é WebRTC (8 de 8 câmeras suportam) — **parte 2**.

---

## Baseline 9 — a rev.3, e o fim da investigação de memória (2026-08-07)

Build `bruno-dashboard.CmKjnA_7.js`, 107 s.

### Tempo ATÉ APARECER — a série completa da fase

| câmera | baseline 7 (8 s de prazo) | baseline 8 (rev.2) | baseline 9 (rev.3) |
|---|---|---|---|
| of_camera_2 | nunca renderizou | 12.008 ms | **2.871 ms** |
| sl_camera_2 | — | 5.844 ms | 3.083 ms |
| as_camera_2 | — | 6.490 ms | 3.491 ms |
| vr_camera_2 | — | 6.185 ms | 4.845 ms |
| cz_camera_2 | — | 5.959 ms | 5.397 ms |
| qma_camera_2 | — | 6.663 ms | 6.120 ms |
| camera_quarto_casal_2 | — | 6.899 ms | 7.112 ms |
| **qmi_camera_2** | — | **49.479 ms** | **21.949 ms** |

O Q. Miguel continua sendo o pior, e o motivo está medido: o pior tempo dele é
**10.005 ms**, que é o tempo limite do PRÓPRIO Home Assistant. A câmera falha no
lado do servidor. O que sobrava de responsabilidade do cliente foi corrigido.

Ajuste final da parte 1: **vigia do primeiro quadro**. O `@error` do elemento
cobre a falha declarada, mas no Q. Miguel o pedido **trava** — não carrega e não
dá erro — e a tela ficava vazia até o motor entrar, 6,5 s depois. Agora, se não
houver imagem em 4 s, o motor entra na hora. Seis das oito câmeras mostram o
primeiro quadro em menos de 5 s, então para elas o vigia não custa nada.

### Memória — ENCERRADA

```
piso 119,4 MB -> 121,4 MB · +2,0 MB em 105 s · 22 degraus
crescimento (primeira -> última amostra): -106 MB
veredito: "Piso estável — a variação do heap é coleta de lixo, não vazamento."
```

O `crescimento` **negativo** é a chave: a primeira amostra pegou 229,7 MB e a
última 123,4 MB. É a coleta de lixo trabalhando. O que eu li como "retenção" nas
baselines 7 e 8 era o heap subindo do zero até o patamar de operação depois de
uma carga fresca — **custo de partida atingindo o equilíbrio, não vazamento.**

Somando com o experimento da baseline 8 (40 montagens da subview = 143 KB por
montagem), a conclusão está fechada por duas vias independentes: **o dashboard
não vaza memória.** O patamar é ~120 MB e é estável.

Cinco leituras dessa métrica ao longo da Fase 6, três delas erradas. O que
finalmente resolveu não foi interpretar melhor: foi o instrumento passar a contar
degraus e a se recusar a opinar sem eles.

### Renders e travamentos

| | baseline 4-5 | baseline 9 |
|---|---|---|
| `bruno-room-tile` | 4,04 renders/s | **0,25/s** |
| Pior tarefa longa | 502 ms | **54 ms** |
| Tarefas longas depois da carga | 5,6/min | **0** |

---

## Baseline 10 — o WebRTC caseiro falhou e cobrou caro (2026-08-07)

Build `bruno-dashboard.DeJwOjlK.js`, 269 s.

| medida | valor |
|---|---|
| `webrtc sl_camera_2` | **3 requisições, 3 falhas**, todas em 12.020 ms |
| `sl_camera_2` (instantâneo) | 13 requisições, pior **25.003 ms** |
| `sl_camera_2 · até aparecer` | pior **22.686 ms** |
| `vr_camera_2` (o PIP da Sala) | 7 requisições, pior **25.010 ms** |

Os 12.020 ms são o prazo da minha própria negociação: ela nunca fechou. E as
tentativas **degradaram o instantâneo da mesma câmera e do PIP ao lado** — cada
oferta faz o HA abrir um stream, e a câmera não serve negociação e instantâneo ao
mesmo tempo. O usuário sentiu exatamente isso ao voltar para a Sala.

Isso viola a regra que a própria fase declarou: **falhar não pode custar nada.**

### A informação que resolveu veio do usuário

> "na subview de câmeras, quando a câmera da sala estava selecionada e ela fica
> ali maior no grid, estava em tempo real"

Aquela subview é legada e usa o `hui-image` nativo do HA com
`cameraView = 'live'`. Ele resolve WebRTC ou HLS conforme a câmera e já cai para
instantâneo sozinho. **O frontend já entregava pronto o que eu escrevi à mão, e a
versão pronta estava provada a dois cliques de distância.**

Correção: o player nativo entra no lugar; `webrtc-session.ts` sai do caminho
vivo (fica testado, fora do bundle).

### A memória e a contradição entre as baselines 9 e 10

| baseline | início | fim | veredito |
|---|---|---|---|
| 9 (105 s, colhida no patamar) | 119,4 MB | 121,4 MB | "piso estável" |
| 10 (269 s, desde a carga) | 56,7 MB | 120,9 MB | "retenção" |

**As duas terminam nos mesmos ~120 MB.** Comparar só o primeiro terço com o
último acusa igual duas curvas diferentes: a subida até o patamar e a retenção de
verdade. Corrigido — o coletor passa a olhar também o terço do meio, e só chama
de retenção quando a subida CONTINUA no fim.

---

## Baseline 11 — o instantâneo ficou saudável; o ao vivo ainda não se explica (2026-08-07)

Build `bruno-dashboard.DoWHeDfl.js`, 471 s.

### O instantâneo, enfim, estável

| medida | valor |
|---|---|
| Falhas de câmera | **zero, nas oito** |
| "até aparecer" | 3,9 s a 9,3 s |
| Tarefas longas | **1**, na carga, 55 ms |
| Vazamentos | 0 |
| `bruno-room-tile` | 72 renders em 471 s = 0,15/s |

### A memória: o veredito novo acertou

```
"Subiu 23,3 MB desde a carga e estabilizou em 118 MB — é custo de partida, não vazamento."
```

Terceiro ponto de partida diferente (98,9 MB de piso inicial), mesmo patamar
final (~120 MB). Com a leitura do terço do meio, o instrumento parou de chamar a
subida inicial de retenção.

### O ao vivo: mediu que existe, não mediu o que faz

`ao vivo sl_camera_2`: 2 registros, sem falha. Mas essa métrica só diz que o
`hui-image` foi CRIADO — não diz qual caminho ele escolheu.

O usuário relata que, na subview de cômodo, a imagem **continua atualizando a
cada 5-9 s**; e que ao tocar na câmera (o `more-info` novo) ela aparece **em
tempo real**, com travadas ocasionais que se recuperam.

Isso tem DUAS explicações possíveis, e a instrumentação atual não as separa:

1. o `hui-image` não está cobrindo o palco, e o que se vê é o meu instantâneo
   por baixo;
2. o `hui-image` está lá, mas escolheu o instantâneo interno dele.

**Não dá para corrigir sem saber qual.** Providências desta rodada:

- CSS do slot passou a ser **cópia literal** da que a subview de câmeras usa e
  que está provada nesta instalação, com `!important` — o `hui-image` se
  dimensiona por proporção e sem forçar não preenche o palco (hipótese 1);
- métrica nova `ao vivo <nome> · stream|instantâneo <altura>px`, lida 6 s depois
  de montar, direto do shadow root do elemento. Ela responde a hipótese 2 e, de
  quebra, denuncia elemento com 0 px de altura.

### A subview de câmeras

Relatada como pior: as oito câmeras juntas demoram muito e a troca de principal
não mostra imagem. **Ela é o módulo legado, não foi tocada nesta fase** e não tem
o motor de instantâneos. Fica registrada como alvo próprio — é o candidato
natural a receber o motor depois que o cômodo estabilizar.

---

## Conclusão da Fase 6.2B — o atraso é arquitetural (2026-08-07)

### O dado que fechou o diagnóstico

Relato do usuário: no `more-info` o relógio da câmera *"passou a avançar
continuamente"*, mas *"a imagem apresenta um delay significativo... ao acender ou
apagar uma luz... a ação demora para aparecer"*.

**Vídeo contínuo e liso, porém atrasado, é a assinatura do HLS.** O componente
`stream` do Home Assistant corta a transmissão em segmentos e o player só começa
depois de encher o buffer — daí a fluidez com 6 a 10 s de atraso. WebRTC ficaria
abaixo de 1 s.

Isso reconcilia tudo o que a fase mediu:

| observação | explicação |
|---|---|
| Minha negociação WebRTC falhou 3 de 3 | WebRTC não fecha nesta instalação |
| A sondagem 6.0.5 disse "8 de 8 com web_rtc" | é a CAPACIDADE anunciada, não a que funciona |
| Relógio anda, imagem atrasa | HLS com buffer de segmentos |
| Carregamento errático | o `stream` precisa subir e produzir segmentos a cada abertura |
| SmartLife é imediato | fala direto com a câmera, por protocolo próprio |

### Verificado no servidor

```
//192.168.3.102/config/go2rtc.yaml     -> NÃO EXISTE
custom_components/                     -> xtend_tuya (nuvem da Tuya)
```

Sem `go2rtc` com fonte RTSP, o caminho é **nuvem Tuya -> `stream` -> HLS**. O
atraso é dessa cadeia, não do dashboard. Nenhum ajuste de cliente o reduz.

### Decisão

O player ao vivo embutido foi **desligado** (`CAMERAS_WEBRTC` vazio). No ladrilho
ele nem chegava a assumir — o usuário media ~9 s entre imagens, que é a cadência
do instantâneo. Custava negociação, instabilidade e "às vezes não renderiza", sem
entregar tempo real.

Permanece: instantâneo saudável (zero falhas nas oito, 3,9 a 9,3 s até aparecer)
e o `more-info` do HA ao tocar na câmera.

### O que realmente resolveria, e é do lado do HA

1. **`go2rtc` com RTSP local por câmera** — tira a nuvem do caminho e habilita
   WebRTC de verdade, com atraso abaixo de 1 s. Depende de a câmera expor RTSP
   local; muitos modelos Tuya só o fazem com firmware alternativo.
2. **LL-HLS mais agressivo** — `stream:` com `part_duration` baixo reduz o buffer.
   Melhora de 6-10 s para ~2 s, sem chegar a tempo real.

Enquanto nenhuma das duas existir, **o SmartLife será mais rápido que qualquer
dashboard do Home Assistant nessas câmeras** — e isso é honesto dizer.

---

## Encerramento da Fase 6.2B (2026-08-08)

### O que a instrumentação respondeu, e o que ela me obrigou a corrigir

A métrica criada para separar as duas hipóteses devolveu:

```
ao vivo sl_camera_2 · stream 264px    4 registros · 0 falhas
```

**O player ao vivo estava funcionando** — modo `stream`, altura correta. Eu havia
afirmado que "no ladrilho ele nem chegava a assumir", e estava **errado**.

O que o mesmo retrato revelou é pior e é o que condena a configuração:

| câmera | requisições | falhas | pior |
|---|---|---|---|
| `sl_camera_2` | 32 | 6 | 25.015 ms |
| `vr_camera_2` (PIP da mesma sala) | 19 | 5 | 25.014 ms |
| `as_camera_2` | 7 | **7 — 100%** | 14.736 ms |
| `of_camera_2` | 15 | 2 | 25.008 ms |

"Até aparecer": `as_camera_2` **62,6 s**; `sl_camera_2` 28,4 s. Contra a baseline
sem o player: **zero falhas nas oito**, 3,9 a 9,3 s.

**O stream consumia a câmera e matava de fome os instantâneos de toda a casa.**
Erro de projeto meu: a rev.1 excluía a câmera ao vivo dos alvos do motor e a
rev.2 removeu essa exclusão argumentando que era "barato". Custou 6 tempos
esgotados na Sala e 100% de falha na área de serviço.

### Decisão final

Player ao vivo embutido **desligado** (`CAMERAS_WEBRTC` vazio), por duas razões
medidas: entrega HLS com 6-10 s de atraso, e degrada os instantâneos enquanto
roda. Permanece o instantâneo saudável no ladrilho e o `more-info` do HA ao
tocar na câmera.

### LL-HLS aplicado (2026-08-08)

```yaml
stream:
  ll_hls: true
  part_duration: 0.5    # padrão do HA: 1.0
  segment_duration: 6
```

Atua sobre o caminho do `more-info`, que é onde o vídeo ao vivo permanece.
Expectativa honesta: de 6-10 s para ~2 s. **Não chega a tempo real** — para isso
seria preciso `go2rtc` com RTSP local, tirando a nuvem da Tuya do caminho.
Custo: mais empacotamento na VM; se a CPU sofrer, subir `part_duration`.

### A memória, encerrada em definitivo

Sessão de 22 minutos, 221 amostras:

```
"Subiu 100 MB desde a carga e estabilizou em 112 MB — é custo de partida, não vazamento."
```

Cinco leituras erradas ao longo da Fase 6, três direções diferentes. O que
resolveu não foi interpretar melhor: foi o instrumento aprender a contar degraus,
a se calar sem eles, e a olhar o terço do meio antes de gritar retenção.
