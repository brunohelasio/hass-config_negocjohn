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
