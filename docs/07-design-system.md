# 07 — Design system e estratégia responsiva

Estado medido em 2026-08-02.

## O problema central: o layout é calibrado em pixels, para um tablet

| Medida | Valor |
|---|---|
| Valores em **px fixos** no CSS | **6.210** |
| `clamp()` | 43 |
| `rem` / `em` | 36 |
| `vw` / `vh` / `dvh` | 161 |
| `fr` (grid) | 1.035 |
| **`@media`** | **157** |
| **`@container`** | **0** |

Breakpoints de largura em uso: **760, 800, 900, 980, 1100, 1180 px** — seis
valores diferentes, mais dois de altura (690, 760). O `CLAUDE.md` registra que
foram calibrados no **Galaxy Tab S6 Lite (2000×1200)**.

### Por que trocar de tablet desorganiza tudo

O CSS não enxerga a resolução física do aparelho. Ele enxerga o **viewport CSS**:

```
viewport CSS = resolução física ÷ densidade de pixels (devicePixelRatio)
```

Aparelhos com resoluções ou densidades diferentes entregam viewports CSS
diferentes. Como todos os tamanhos deste projeto são números absolutos amarrados
a faixas fixas de viewport, mudar de aparelho move o layout para outra faixa e
**tudo salta de uma vez**.

Foi exatamente o que aconteceu ao migrar do **Galaxy Tab S6 Lite (2000×1200)**
para o **Redmi Pad 2 (2560×1600)** — resoluções físicas bem diferentes. E por
isso alterar a resolução do Redmi "resolveu": o ajuste empurrou o viewport CSS de
volta para a faixa em que os breakpoints tinham sido calibrados.

Note que há breakpoints em **1100** e **1180 px**. Basta o viewport CSS de um
aparelho cair de um lado e o do outro cair do outro para o layout inteiro trocar
de configuração — sem nada estar "errado".

**Isso não se conserta somando breakpoints.** Cada novo aparelho pediria mais
uma faixa, e as faixas se multiplicam pelos 6 arquivos de subview duplicados —
parte relevante dos 6.210 px fixos está copiada seis vezes.

## Estratégia de destino: adaptar em vez de comutar

Três mudanças, em ordem de impacto:

### 1. Container queries no lugar de media queries

Hoje cada card pergunta *"qual o tamanho da tela?"*. O certo é perguntar
*"qual o tamanho da MINHA caixa?"*:

```css
.room-card { container-type: inline-size; }

@container (min-width: 220px) {
  .room-name { font-size: 15px; }
}
```

Isso resolve um problema que o projeto tem hoje e trata na mão: **o mesmo card
aparece em três contextos** — na faixa da Home, no rail de cômodos e empilhado no
celular. Com container query ele se adapta sozinho aos três, sem saber em que
aparelho está.

> ✅ **Suporte confirmado (2026-08-02).** WebView do tablet: **150.0.7871.181**
> (Chrome 150), Android 15. Container queries entraram no Chrome 105 — estamos
> 45 versões acima. Também disponíveis: `cqw/cqi/cqh`, `:has()`, `dvh/svh/lvh`,
> subgrid, `@property`. **Nenhum fallback legado é necessário.**
> Ver [`08-performance-tablet.md`](08-performance-tablet.md).

### 2. Escalas fluidas com `clamp()`

Em vez de trocar de valor num degrau, interpolar continuamente:

```css
/* antes: 15px, e 13px abaixo de 800px */
font-size: clamp(12px, 1.1cqw + 9px, 15px);

/* antes: height 320px fixo para o bloco do A/C */
--ac-h: clamp(240px, 34cqh, 320px);
```

O layout deixa de ter "tamanho certo" e passa a ter "faixa aceitável".

### 3. Layouts intrínsecos

```css
/* antes: repeat(7, 1fr) no desktop, repeat(2, 1fr) no phone, via media query */
grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
```

A grade decide sozinha quantas colunas cabem. Some a necessidade de declarar a
contagem por faixa de tela.

## Meta mensurável

| | Hoje | Meta |
|---|---|---|
| px fixos | 6.210 | < 500 (só bordas, raios e filetes) |
| `@media` | 157 | < 20 (só orientação e `prefers-reduced-motion`) |
| `@container` | 0 | o mecanismo primário |
| Aparelhos suportados | 1 calibrado | qualquer viewport entre ~600 e ~2000 px |

## Uniformidade dos ícones de cômodo

Reportado pelo usuário em 2026-08-02: os PNGs de cômodo parecem ter tamanhos
diferentes entre si.

**A causa não é margem sobrando na imagem** — medi o retângulo opaco de cada uma
e todas ocupam 96–100% do próprio canvas. A causa é a **proporção**, combinada
com `object-fit: contain` numa caixa de proporção fixa (`.room-icon`, ~120×80 =
1,50):

| Asset | Proporção | Renderizado em 120×80 |
|---|---|---|
| `miguel-bedroom-on-tight` | 1,73 | **120 × 69** |
| `couple-bedroom-on-generated-v3` | 1,68 | 120 × 71 |
| `living-room-on-tight` | 1,53 | 120 × 78 |
| `kitchen-on-tight` | 1,21 | 96 × 80 |
| `office-on-tight` | 1,13 | 90 × 80 |
| `marina-bedroom-on-tight` | 1,09 | 87 × 80 |
| `lavabo-on-tight` | 0,88 | 70 × 80 |
| `corridor-on-tight` | 0,84 | **67 × 80** |

Imagem mais larga que a caixa encosta nas laterais e domina; mais alta que a
caixa encosta em cima e embaixo e fica estreita. A largura renderizada varia de
**67 a 120 px** — quase o dobro. É isso que se vê como falta de uniformidade.

### Como resolver — decisão pendente do usuário

Não é problema técnico, é definição de projeto. O que "uniforme" significa:

| Opção | O que iguala | Efeito |
|---|---|---|
| **A** — altura igual | todos com a mesma altura renderizada | é o comportamento atual para as imagens altas; sofá largo continua parecendo maior |
| **B** — peso visual igual | área renderizada semelhante | perceptualmente o mais uniforme; exige um fator de escala por asset |
| **C** — normalizar na origem | recanvasar todos numa proporção comum, com o objeto na mesma fração | mais robusto: a caixa volta a ser previsível |

**Recomendação: C como base + B como ajuste fino.** Normalizar as imagens numa
proporção única e expor um `iconScale` por cômodo na configuração central
(`rooms.config.ts`), para acertar no olho sem tocar em código nem em imagem.

Encaixa na Fase 5b, quando os 7 cards de cômodo viram um componente
parametrizado — é exatamente o tipo de valor que passa a morar na configuração.

---

## Composição canônica do tile de cômodo

Medida nos 8 cards em 2026-08-03. **Os 8 já são consistentes entre si** — não há
divergência a resolver, há um padrão a preservar.

Esta é a especificação que a Fase 5b deve aplicar ao componente único. Qualquer
migração que produza valores diferentes destes está errada, mesmo que pareça
melhor isoladamente: o requisito do usuário é que **todos os tiles tenham a
mesma composição** de altura, ícone, tipografia, posicionamento e status.

### Grade interna (`.room-action`)

```
grid-template-columns: minmax(0, 124px) minmax(0, 1fr) 40px
grid-template-rows:    auto minmax(0, 1fr) auto auto
grid-template-areas:   "icon  space right"
                       "icon  space right"
                       "title title right"
                       "state state right"
column-gap: 6px
row-gap:    0
padding:    14px 14px 13px 11px
align-items: start
```

A primeira coluna é `minmax(0, 124px)`, não `124px` fixo: ela absorve o déficit
quando a faixa encolhe, em vez de clipar a coluna de status. Padrão herdado do
Office depois do incidente de clipping de 2026-07-03.

### Dimensões e tipografia

| Elemento | Valor |
|---|---|
| `.room-icon` | **`width: 100%`, `max-width: 124px`, `height: 82px`** — a caixa **não é quadrada**; margens `0` / `1px` |
| `padding` da ação | **`14px 11px 13px`** |
| `.title` | **15 px** / peso 700 / `line-height` 1.18 / `margin-bottom` 2px |
| `.status-lines` | **11 px** / peso 500 / `line-height` 1.16 / `gap` 1px |
| `.metric` | **`min-width: 36px`, `text-align: center`**, sem margens |
| `.metric-value` | 13 px / peso 760 |
| `.metric-sub` | 11 px / peso 600 / `margin-top` 4px |
| `.status-dot` | **26 × 26 px**, círculo |
| `.right-rail` | coluna, `gap` 7px, `transform: translate(5px, -3px)`, `align-items: center` |

> ⚠️ **Não copiar `.metric` do `bruno-corredor-card.js`.** O Corredor **não tem
> sensor de temperatura** — a métrica nunca renderiza naquele card, e os valores
> de lá (`min-width: 48px`, `text-align: left`, `margin-left: 6px`,
> `margin-top: 3px`) são código morto que nunca foi exercitado. Copiá-los
> produz o trilho com 48px e o texto começando 10px antes do dot.
>
> **A referência correta é o `bruno-office-card.js`**, medido no navegador em
> 2026-08-03: trilho de 36px, métrica ocupando os 36px com texto centralizado,
> dot de 26px centrado com 5px de folga de cada lado.
>
> Regra geral que sai daqui: ao extrair especificação de um card, confirmar que
> o trecho **realmente renderiza** naquele cômodo. Card que não tem a entidade
> carrega CSS morto.

### ⚠️ Como extrair esta especificação — leia antes de migrar qualquer card

Em 2026-08-03 eu errei **três vezes seguidas** montando este componente, sempre
pelo mesmo motivo: **li o código-fonte em vez de medir o resultado renderizado.**

| # | O que copiei | Da fonte | O real | Efeito |
|---|---|---|---|---|
| 1 | `.metric: 48px, left, margin-left 6px` | `bruno-corredor-card` | `36px, center, sem margem` | temperatura 10px à esquerda dos dots |
| 2 | `icon_size: 94` (quadrado) | config do card | `100% / max 124 × 82px` | ícone 12px mais alto |
| 3 | `padding: 14px 14px 13px 11px` | `bruno-corredor-card` | `14px 11px 13px` | 3px a mais à direita |

A raiz dos três: **o `bruno-corredor-card` não tem sensor de temperatura**, então
metade do CSS dele nunca renderiza. E o `icon_size` do config é fallback — o CSS
o sobrescreve.

**O método que funciona** é medir no navegador, com o card real montado:

```js
const sr = document.querySelector('bruno-office-card').shadowRoot;
const c  = sr.querySelector('.office-card').getBoundingClientRect();
const el = sr.querySelector('.room-icon').getBoundingClientRect();
({ esq: el.left - c.left, topo: el.top - c.top, larg: el.width, alt: el.height })
```

**Referência correta: `bruno-office-card`** — é o cômodo mais completo (luzes,
clima, presença, temperatura, umidade, PC), então exercita todo o CSS.
Nunca extrair do Corredor ou do Lavabo.

Resultado após medir: ícone **0 px de diferença** em posição e tamanho.
| raio do card | `var(--bruno-liquid-room-radius, var(--bruno-liquid-card-radius-compact, 16px))` |

### Material — **consumir token, nunca reescrever valor**

O tile **não** define o próprio fundo. Ele consome a cadeia que os módulos de
tema publicam, com o mesmo encadeamento de fallback dos cards atuais:

```
--bruno-liquid-surface-off-background / -filter / -border / -shadow
--bruno-liquid-surface-on-*            (estado aceso)
--bruno-tile-*                          (modo tile do Josh)
```

**Erro cometido em 2026-08-03:** escrever valores literais como fallback no
componente novo. Os literais venceram, e o tile ficou de vidro enquanto os
demais seguiam o tema Josh. O fallback existe para o caso de o tema não ter
carregado — não para substituir o tema.

### Tokens locais do `:host`

```
--accent: 150,190,255      --accent-blue: 96,165,250
--accent-purple: 167,139,250   --accent-cyan: 79,172,254
--accent-amber: 255,153,0
--text-main: rgba(245,250,255,0.96)
--text-soft: rgba(255,255,255,0.40)
--text-muted: rgba(255,255,255,0.52)
--dot-off-bg / -border / -icon
```

No estado aceso (`.is-room-on`) esses valores mudam em bloco — ver o card atual.

### Breakpoints existentes

`max-width: 800px` (phone), `max-height: 760px`, `prefers-reduced-motion`.

**Os dois primeiros mudam a composição e são obrigatórios em qualquer
reimplementação.** Foram esquecidos na Fase 5a e o tile saiu com o ícone 10 px
mais alto que o dos vizinhos em telas baixas. Valores exatos:

```css
@media (max-height: 760px) {
  .room-action { padding: 12px 11px 12px 11px; }   /* base: 14px 11px 13px */
  .room-icon   { width: 100%; max-width: 108px; height: 72px; }  /* base: 122 × 82 */
}

@media (max-width: 800px) {
  .room-action { padding: 11px 12px 10px 10px; }
  .room-icon   { max-width: 100px; height: 62px; }
}
```

Consequência para os assets: qualquer compensação de enquadramento precisa ser
**proporcional à caixa**, não em pixels fixos — senão o desenho descola em um dos
três tamanhos. No tile novo isso é `height: 111%` da caixa, com o deslocamento
também em percentual do próprio elemento.

### O interruptor do modo tile — armadilha de ciclo de vida

`--bruno-tile-mode` **não pode ser lido no `firstUpdated`** de um componente Lit.
O Lit faz o primeiro update no *attach*; o Home Assistant chama `setConfig`
depois. Naquele instante o token do tema ainda não é visível e o `variant` ainda
não existe — o resultado é um cartão de vidro no meio de oito tiles.

O padrão correto, que os cards atuais já usam: avaliação preguiçosa no render,
com cache invalidado no `connectedCallback` e no evento `bruno-theme-changed`.

### Onde NÃO copiar valores: blocos comentados

Os cards guardam tentativas rejeitadas em comentário, com o marcador
`ORIGINAL ... (rollback rapido)`. O `.status-dot`, por exemplo, tem **três**
receitas antigas comentadas antes da vigente. Copiar a primeira que aparece no
arquivo entrega justamente o visual que o usuário já recusou.

A receita vigente do dot: círculo com gradiente tonal, borda clara e glifo
branco; em modo tile vira preenchimento chapado com alfa 0,78 e sem borda.

Ao migrar para container query, o alvo é **cair no mesmo valor** que estes
breakpoints produzem hoje na largura do tablet. Independência de resolução não
pode custar paridade visual: se `clamp()` não reproduzir a composição acima no
aparelho real, o px fixo é a escolha certa e a fluidez fica para depois.

---

## Ícones: o conjunto é o **Hugeicons**, não o MDI

Os nomes `mdi:` que aparecem no código são **apelidos**. `bruno-icons.js` traduz
cada um para o Hugeicons (ou para um SVG próprio, prefixo `bruno:`) por uma
tabela de 179 entradas. Traduzir um nome do projeto para um `mdi:` "equivalente"
faz o ícone cair no genérico — foi o que produziu círculos no lugar dos ícones
de luz.

Apelidos que importam no bloco de iluminação e na cortina:

| nome no código | resolve para |
|---|---|
| `ledstrip` | `bruno:led-strip` |
| `pendant` | `hugeicons:candelier-02` |
| `sconce` | `hugeicons:lamp-wall-up` |
| `light_flush` | `hugeicons:bulb` |
| `mdi:led-strip-variant` | `bruno:led-strip` |
| `mdi:ceiling-light-outline` | `hugeicons:spotlight` |
| `mdi:string-lights` | `hugeicons:lamp-04` |
| `curtain`, `curtain-open`, `curtain-close` | `hugeicons:curtains` |
| `curtain-stop` | `hugeicons:stop` |

**Regra:** passar o nome CRU para `<bruno-icon icon="…">` ou para
`BrunoIcons.render()`. Nunca converter para outro conjunto.

Para listar os apelidos disponíveis:

```bash
node -e "const s=require('fs').readFileSync('config/www/bruno-ui/core/bruno-icons.js','utf8');const i=s.search(/const ALIASES/),j=s.indexOf('});',i);console.log([...s.slice(i,j).matchAll(/\"([^\"]+)\":\"([^\"]+)\"/g)].map(m=>m[1]+' -> '+m[2]).join('\n'))"
```

## A moldura da faixa de tiles exige `<main>`

O filete superior, o inferior, o scrim e o blur da faixa de tiles das subviews
vêm de **`main::before`**, em `core/bruno-surface-material.js`. As seis subviews
usam `<main class="…-subview">` como raiz.

Trocar a raiz por `<div>` faz o seletor deixar de casar, e os quatro somem de uma
vez — sem erro no console, porque não há erro: a regra simplesmente não aplica.

E o material **não vem do CSS do componente**. Vem do módulo global, em dois
pontos, e os dois são obrigatórios:

```js
connectedCallback()  →  BrunoLiquidGlass.apply()
                        BrunoSurfaceMaterial.connect(this)
render()             →  BrunoSurfaceMaterial.subviewStyles()
```
