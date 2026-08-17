# Fase 6.2 — plano de execução e trilha de rollback

**Data:** 2026-08-09 · **Estado:** em execução

---

## 1. O problema, medido

| | hoje |
|---|---|
| CSS gerado da subview | 5.266 linhas · **1.257 valores em pixel fixo** · 16 media queries |
| Componente da subview | 3.190 linhas |
| Legado que ainda roda | 12.139 pixels fixos · 145 media queries |

Cada um desses 1.257 números foi escolhido olhando **um** aparelho (Galaxy Tab
S6 Lite, 2000×1200). Trocar para o Redmi Pad 2 (2560×1600) desorganizou o layout
— não porque algo quebrou, mas porque o CSS não vê a resolução física, vê o
viewport. Com tudo amarrado a valores fixos, mudar de aparelho joga o layout
inteiro para outra escala de uma vez.

**Somar breakpoints não resolve:** eles se multiplicam por aparelho e viram
calibragem manual permanente. A saída é medir relativo ao CONTAINER, com piso e
teto.

---

## 2. O que muda no desenho da fase, e por quê

O roteiro previa a 6.2 como **sete extrações de componente**, cada uma levando
sua fatia de CSS:

```
room-status → lighting-dock → climate-card → media-hub
            → camera-stage → room-hero → appliances
```

**`camera-stage` está fora do alcance.** Ele contém o trabalho de streaming
entregue pelo Codex, e há instrução expressa do usuário de não alterá-lo.
Extraí-lo para um componente filho significaria reestruturar exatamente esse
código.

Portanto a decomposição em sete componentes **não pode ser executada
integralmente** — ela ficaria com seis de sete, que é justamente o
fracionamento que o usuário proibiu.

### A decisão

Executar **integralmente o resultado da fase** — independência de resolução —
por um caminho que cobre 100% do CSS de uma vez e não toca em nenhuma lógica:
a conversão acontece no **gerador**, não à mão.

Isso segue um princípio já estabelecido no projeto: *gerar em vez de
transcrever*. O CSS já é produzido por `scripts/validation/gen-subview-css.mjs`;
a fluidização entra como uma transformação nesse gerador e alcança as 5.266
linhas de uma vez, de forma reproduzível e reversível por uma constante.

**A decomposição em componentes fica registrada como pendência**, com o motivo
(bloqueio no `camera-stage`) e o momento natural de retomada: depois que o
streaming estabilizar e o usuário liberar aquele arquivo.

---

## 3. Como a conversão funciona

### A regra

```
14px  →  clamp(11px, 0.77cqi, 18px)
```

`cqi` é 1% da largura do container. Com `container-type: inline-size` no `:host`
(já ligado e verificado), `1cqi` = 1% da largura da subview.

### A largura de referência

```
viewport do tablet .................. 1920
− coluna da rail (86px) ............. 1834
− padding esquerdo do content-slot (2)  1832
− padding direito do content-slot (12)  1820
```

**Referência = 1820 px.** Na calibragem, `N px` vira `(N / 1820 × 100) cqi`, que
resolve exatamente para `N px` naquela largura.

**Consequência verificável:** a 1820 px de container, a geometria é IDÊNTICA à
de hoje. É o critério de aceite principal.

### Piso e teto

`clamp(N × 0.78, fluido, N × 1.30)` — permite encolher até 78% e crescer até
130%. Fora dessa faixa o valor trava, o que evita texto ilegível em tela pequena
e elementos desproporcionais em tela grande.

### O que NÃO é convertido

Seguindo a regra já escrita em `styles/tokens/scale.ts`: *componente novo não
declara px fixo para tamanho, espaço ou tipografia; só bordas, raios e filetes.*

| convertido | preservado |
|---|---|
| `font-size`, `line-height` | `border-width`, `border-radius` |
| `padding*`, `margin*`, `gap` | `outline*` |
| `width`, `height`, `min-*`, `max-*` | `box-shadow` (blur/spread) |
| `top/right/bottom/left`, `inset` | `letter-spacing`, `text-shadow` |
| `flex-basis`, tracks de `grid-template-*` | valores dentro de `filter` |

Bordas e raios não escalam de propósito: um filete de 1px que vira 1,3px fica
borrado, e um raio que cresce muda a linguagem visual do tema.

### Valores pequenos ficam de fora

Abaixo de 4px a conversão não compensa: a diferença entre 2px e 2,6px não é
percebida e o `clamp` só polui o CSS. Ficam literais.

---

## 4. Critérios de aceite

| # | critério | como se verifica |
|---|---|---|
| 1 | Geometria **idêntica** a 1820 px de container | `window.geometria()` no banco, antes e depois |
| 2 | Nada colapsa a 600 px | mesma medição, largura 600 |
| 3 | Nada estoura a 2560 px | mesma medição, largura 2560 |
| 4 | Zero px fixo nas propriedades de escala | contagem no CSS gerado |
| 5 | Gate limpo | `npm run check` |

---

## 5. Trilha de rollback

### Rollback total, em uma linha

Em `scripts/validation/gen-subview-css.mjs`:

```js
const FLUIDIZAR = false;   // volta a emitir px literal
```

Depois `node scripts/validation/gen-subview-css.mjs && npm run build`. O CSS
volta byte a byte ao que era — porque é gerado, não editado.

### Rollback parcial

- **Largura de referência errada:** ajustar `LARGURA_REFERENCIA`.
- **Faixa apertada ou frouxa:** ajustar `PISO` e `TETO`.
- **Uma propriedade que não devia escalar:** tirar de `PROPRIEDADES_FLUIDAS`.

Os três são constantes no topo do gerador, e regerar leva um segundo.

### O que NÃO é tocado

- `bruno-room-subview.ts` — nenhuma alteração de lógica.
- Todo o trabalho de câmera/streaming do Codex.
- `camera-webrtc.config.ts`, `subviews.config.ts`.
- Os arquivos legados em `config/www/bruno-ui/`.

---

## 6. Pendência registrada

**Decomposição em sete componentes filhos.** Não executada, por bloqueio no
`camera-stage`. Retomar quando o streaming estabilizar e o arquivo for liberado.
Quando for, o CSS já estará fluido — cada componente leva sua fatia como está,
sem reconversão.

---

## 7. Execução — resultado medido (2026-08-09)

### O que foi feito

`scripts/validation/gen-subview-css.mjs` ganhou a função `fluidizar()`, aplicada
na emissão de cada declaração. **618 valores convertidos** para `clamp()` com
`cqi`. Bordas, raios, filetes e valores abaixo de 4px preservados, por regra.

Nenhuma linha de `bruno-room-subview.ts` foi tocada. Nenhum arquivo de câmera.

### Critério 1 — geometria idêntica na calibragem

Medido com `window.geometria()` no banco, antes e depois, em três cômodos:

| cena | campos | divergências |
|---|---|---|
| Sala a 1820 px | 5 | **0** |
| Office a 1820 px | 5 | **0** |
| Cozinha a 1820 px | 4 | **0** |

**Doze campos, zero divergência.** No tablet, o layout é o mesmo pixel a pixel.

### Critérios 2 e 3 — o layout agora se acomoda

As divergências aparecem só fora da calibragem, que é o objetivo da fase:

| módulo | 600 px: antes → agora | 2560 px: antes → agora |
|---|---|---|
| `.hero-panel` | 230×812 → **309×823** | 1812×812 → **1812×798** |
| `.lights-card` | 360×54 → **281×43** | 738×54 → **738×70** |
| `.ac-card` | 360×320 → **281×320** | — |
| `.cameras-card` | 110×320 → **150×320** | — |

Nada colapsou para zero, nada estourou. Em 600 px os cartões encolhem e o hero
ganha altura; em 2560 px a cartela de luzes cresce e o hero cede espaço.

### Critério 5 — gate

208 testes, 12 arquivos. YAML, crases, tipos, lint e build limpos.

### Publicado

`bruno-dashboard.AjFBISLQ.js`, na VM.

---

## 8. O que NÃO foi feito, e por quê

**A decomposição em sete componentes filhos.**

`camera-stage` é um dos sete e contém o trabalho de streaming do Codex, com
instrução expressa de não alterá-lo. Extraí-lo significaria reestruturar
exatamente esse código. Fazer os outros seis seria entregar a fase pela metade —
o fracionamento que o usuário proibiu nesta rodada.

A decomposição entrega **manutenibilidade**, não comportamento. O CSS já está
fluido: quando ela for feita, cada componente leva sua fatia como está, sem
reconversão.

**Retomar quando:** o streaming estabilizar e o arquivo for liberado.
