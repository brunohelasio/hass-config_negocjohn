# Diagnostico + Plano de Correcao — Layout Vertical

## ETAPA 1 — DIAGNOSTICO TECNICO

### O problema em uma frase

O grid nao preenche a altura da viewport porque as rows usam `auto` (tamanho do conteudo) mas **nada forca o grid container a ter `min-height: 100vh`**.

### Cadeia causal detalhada

```
main.yaml (landscape tablet):
  grid-template-rows: auto auto min-content 0 0 0
                      ^^^^  ^^^^
                      Row 1  Row 2  → tamanho = conteudo dos cards

tablet.yaml (theme CSS):
  #root { min-height: 100%; overflow: hidden !important; }
         ^^^^^^^^^^^^^^^^
         100% do pai, que e o layout-card container.
         MAS o layout-card nao tem height definida.
         Resultado: 100% de "nada" = height do conteudo = nao estica.
```

**O que acontece:**
1. Cards de security/mainrooms/devices (Row 1) tem `aspect_ratio: 1/1` via `base` template
2. Cards sao dispostos em grid de 2 colunas (`columns: 2`)
3. Cada card-grid (ex: security) tem 6 cards em 2 colunas = 3 linhas de cards quadrados
4. A altura de cada row do grid principal = altura do conteudo (3 cards quadrados empilhados)
5. Footer = `min-content` (uma linha de botoes)
6. Total: ~60-70% da viewport → sobra 30-40% embaixo

### Por que ficou "engessado"

Antes, com 5 colunas (`1fr 1fr 1fr 1fr 1fr`) e mais cards visíveis, o conteudo naturalmente ocupava mais espaco vertical. Ao mudar para sidebar + 4 colunas, cada coluna ficou mais larga, os cards quadrados ficaram mais largos E mais altos, mas ha MENOS linhas de cards por row. O resultado visual e que o conteudo encolheu verticalmente.

---

## ETAPA 2 — COMPARACAO COM SAGALAND93

### Grid do Sagaland (desktop/tablet)

```yaml
grid-template-columns: repeat(5, 1fr) 0
grid-template-rows: 0 repeat(2, fit-content(100%)) 0fr
grid-template-areas: |
  "sidebar  .       .         .        .       ."
  "sidebar  home    security  climate  rooms   ."
  "sidebar  media   cameras   outside  rooms2  ."
  "sidebar  footer1 footer1   footer1  footer1 ."
  "sidebar  footer2 footer2   footer2  footer2 ."
```

### Theme CSS do Sagaland (o segredo)

```css
hui-view {
  min-height: 100vh;           /* View = pelo menos viewport */
}

#view {
  background: url(...);
  background-size: cover;      /* Background preenche tudo */
}

/* Sidebar vertical-stack */
#root {
  min-height: 100vh;           /* Sidebar forca grid a ter 100vh */
  min-width: 18.8vw;
}
```

### Tabela comparativa

| Aspecto | Sagaland | Negocjohn | Impacto |
|---------|----------|-----------|---------|
| grid-template-rows | `fit-content(100%)` | `auto auto min-content` | Equivalente — ambos usam tamanho do conteudo |
| min-height no root | `100vh` | `100%` (ineficaz) | **CRITICO** — Sagaland forca 100vh, negocjohn nao |
| Background | `background-size: cover` no #view | Nenhum background no #view | Sagaland preenche espaço visual restante |
| Sidebar height | `min-height: 100vh` no sidebar stack | Nenhum min-height | **CRITICO** — sidebar nao estica ate o fundo |
| Card aspect-ratio | `1/1` (base template) | `1/1` (base template) | Identico |
| Grid columns | `repeat(5, 1fr) 0` | `0 1.3fr 1fr 1fr 1fr 0` | Similar, negocjohn tem sidebar mais larga |
| Footer | 2 rows (footer + RSS) | 1 row (horizontal-stack) | Sagaland usa mais espaco vertical |
| Streamline wrapper | Nao usa | Usa em todos os cards | Negocjohn tem camada extra de DOM |
| overflow | `overflow: visible` no footer | `overflow: hidden` no root | Negocjohn corta conteudo |

### Por que o Sagaland funciona e o negocjohn nao

**Sagaland resolve com 3 coisas simples:**
1. `min-height: 100vh` no container da sidebar → forca o grid inteiro a ter pelo menos a altura da viewport
2. `min-height: 100vh` no `hui-view` → garante que a view HA tenha altura total
3. Background image com `cover` → qualquer espaco restante e preenchido visualmente

**Negocjohn nao faz nenhuma das 3.** O `min-height: 100%` no `#root` e ineficaz porque `100%` referencia o pai (layout-card), que nao tem altura explicita.

---

## ETAPA 3 — PLANO A (SOLUCAO CORRETA)

### Mudancas necessarias (3 arquivos)

#### 1. tablet.yaml — Forcar 100vh no grid container

**Arquivo:** `config/themes/tablet.yaml`
**Linha 108:** Trocar `min-height: 100%` por `min-height: 100vh`

```yaml
# ANTES (comentar):
# #root {
#   min-height: 100%;
#   overflow: hidden !important;
# }

# DEPOIS:
grid-layout:
  $: |
    #root {
      min-height: calc(100vh - 56px);   /* 56px = header bar do HA */
      overflow: hidden !important;
    }
```

**Por que `calc(100vh - 56px)`:** O HA tem uma barra de navegacao no topo de ~56px. Usar `100vh` puro causaria scroll de 56px. O `calc` subtrai isso.

#### 2. main.yaml — Trocar rows auto por 1fr (landscape tablet)

**Arquivo:** `config/dashboards/views/main.yaml`
**Breakpoint landscape tablet (linhas 40-59):**

```yaml
# ANTES (comentar):
# grid-template-rows: auto auto min-content 0 0 0

# DEPOIS:
grid-template-rows: 1fr 1fr min-content 0 0 0
```

**Por que `1fr` em vez de `auto`:**
- `auto` = tamanho do conteudo (nao estica)
- `1fr` = divide o espaco restante proporcionalmente
- Com `min-height: calc(100vh - 56px)` no container, as 2 rows de `1fr` dividem o espaco vertical disponivel igualmente
- Cards dentro dessas rows vao se alinhar ao topo (comportamento padrao de grid items)

#### 3. main.yaml — Aplicar a mesma logica no desktop

**Breakpoint desktop (1441-2000px):**

```yaml
# ANTES (comentar):
# grid-template-rows: min-content 1fr 1fr min-content 0 0

# DEPOIS (ja usa 1fr — OK, mas adicionar):
grid-template-rows: 1fr 1fr min-content 0 0 0
```

O desktop ja usa `1fr` nas rows 2-3. O problema e que a row 1 usa `min-content` (chips). Se os chips forem removidos, essa row pode virar `0` e as 2 content rows de `1fr` dividem o espaco.

#### Resumo de mudancas do Plano A

| Arquivo | Mudanca | Motivo |
|---------|---------|--------|
| tablet.yaml | `min-height: 100%` → `min-height: calc(100vh - 56px)` | Forcar grid a ocupar viewport |
| main.yaml (landscape) | `auto auto` → `1fr 1fr` | Rows esticam para preencher espaco |
| main.yaml (desktop) | Ajustar rows se chips removidos | Consistencia |

**Risco:** Se os cards nao responderem bem ao `1fr` (ex: ficarem esticados demais), podemos usar `minmax(auto, 1fr)` que permite que a row cresca mas nunca encolha abaixo do conteudo.

---

## ETAPA 3B — PLANO B (GAMBIARRA CONTROLADA)

Se o Plano A nao der resultado visual satisfatorio:

### 1. Sidebar: esticar ate o fundo

Adicionar CSS na sidebar para ocupar toda a altura:

```css
/* No tpl_sidebar.yaml, extra_styles */
:host {
  min-height: calc(100vh - 56px - 3vw) !important;
}
```

### 2. Footer: aumentar altura dos botoes

No `tpl_footer.yaml`, aumentar o padding dos botoes:

```yaml
# ANTES (comentar padding original):
# padding: 0.5em 1em

# DEPOIS:
padding: 1em 1.5em
```

### 3. Centralizar verticalmente

No tablet.yaml, adicionar no `#root`:

```css
#root {
  min-height: calc(100vh - 56px);
  display: grid;
  align-content: center;     /* centraliza o conteudo verticalmente */
}
```

**Atencao:** `align-content: center` no grid-layout do HA pode ter efeitos colaterais com as grid-areas. Testar com cuidado.

---

## DECISAO RECOMENDADA

**Plano A primeiro** — e a solucao correta e sao apenas 2 mudancas (tablet.yaml + main.yaml). Se o resultado visual nao for ideal, aplicamos refinamentos do Plano B incrementalmente.
