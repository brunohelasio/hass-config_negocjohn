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
