# Fase 6.3A — inventário e arquitetura mobile

**Data:** 2026-08-09 (rev.2) · **Escopo:** levantamento e decisão. **Nenhuma
remoção, nenhuma alteração de código.**

---

## 0. Correção da rev.1

A primeira versão deste documento dizia *"a shell adaptada é o caminho único"* e
*"arquivar as cinco views mobile"*. O usuário leu isso como **reduzir o dashboard
de parede e chamar o resultado de mobile** — e o texto autorizava essa leitura.

Não era a intenção, mas a redação era ambígua e a correção é registrada aqui.

### A distinção que faltava

| | o que é | vale ser único? |
|---|---|---|
| **Moldura** | a shell: rail, slot de conteúdo, tema, papel de parede, popups, navegação | **Sim.** Duas molduras custam o dobro em toda mudança |
| **Composição** | quais cards, em que arranjo, com que prioridade | **Não.** É onde o mobile precisa ser diferente |

O que se quer eliminar é a duplicidade de **encanamento**, não a de desenho.

---

## 1. As definições do usuário — vinculantes

> "O meu dashboard foi concebido e desenvolvido prioritariamente para instalação
> na parede, em modo paisagem. A partir dessa estrutura principal, ele deve
> possuir uma adaptação específica para o ambiente mobile, cuja visualização será
> predominantemente em modo retrato."

**O mobile é adaptação específica, não redução.** Esta frase governa a 6.5B.

### Os dois modos

```
tablet   →  paisagem, na parede, uso à distância.  EXPERIÊNCIA PRINCIPAL
mobile   →  retrato, na mão.                        ADAPTAÇÃO ESPECÍFICA
```

Dois, não três. A rev.1 propôs `wall | tablet | phone` copiando um padrão
genérico; na casa do usuário o tablet **é** o de parede. Um terceiro modo só
existiria se um dia houvesse tablet na mão, e isso não está no projeto.

### Decisões de composição mobile já tomadas pelo usuário

Estas são anteriores a este roteiro e **permanecem**:

1. A rail lateral vira **barra horizontal inferior**.
2. A **faixa de tiles não existe no mobile** — ela é peça da parede.
3. No lugar dela, **cards de cômodo**: numa única view dá para ver o status do
   ambiente, acionar a luz principal e entrar na subview.
4. No painel de câmeras, **todas do mesmo tamanho** — sem câmera principal grande
   com as demais em miniatura ao redor.
5. Planta 3D e outros módulos têm adaptação própria.

---

## 2. Inventário

### O que está VIVO

```
config/dashboards/views/mobile/          5 views, incluídas em ui-lovelace-main.yaml
  mobile-casa · mobile-comodos · mobile-midia · mobile-cameras · mobile-mais

config/dashboards/shared/mobile/         12 componentes de apoio
```

URLs: `/lovelace/mobile-casa`, etc.

**Estas views SÃO a composição mobile.** Elas ficam, e são a base do trabalho.

### O que está no disco mas comentado no include

As linhas de V1 e V2 no `ui-lovelace-main.yaml`. Verificado: os arquivos não
existem mais em `views/`, e os wrappers V2 em `shared/grid-cards/mobile_*.yaml`
também não. Sobram só os comentários — histórico, não código morto. Limpeza
cosmética para a Fase 7.

### A moldura também tem modo phone

`bruno-shell.js` e a Home V2 têm caminho phone próprio, feito em 2026-07-09:

- shell: `@media (max-width: 800px)` — a rail vira dock na base;
- `rail.yaml`: 9 itens `hide_on_phone`, que migram para um menu "Mais";
- `section_home_v2.yaml`: `mediaquery '(max-width: 800px)'` reorganiza o grid.

Isso é **moldura**, e conversa com a decisão nº 1 do usuário. Fica.

---

## 3. O estado real: o mobile ficou para trás

> "no momento em que a gente migrou para o formato de tiles, de cards dinâmicos e
> de toda essa reestruturação, a gente abandonou o modo mobile."

O mobile parou em 2026-07-09. Desde então entraram: a arquitetura nova
(TypeScript/Lit), os tiles, os cards dinâmicos, a subview unificada, o estado
seletivo, o motor de câmeras e a escala fluida. **Nada disso chegou lá.**

Ou seja: não basta portar as melhorias arquiteturais. **O layout mobile em si
está inacabado** — e isso muda a estrutura do roteiro (§5).

### Um defeito de layout já diagnosticado

O usuário relata: *"as subviews de cômodos... atualmente alguns abrem os cards na
vertical, com scroll vertical, outros não."*

Causa encontrada, e não é aleatória — é ordem de cascata:

```css
/* BASE, dentro de @media (max-width: 760px) */
.room-subview { grid-template-columns: 1fr; }              /* empilha */

/* SOBREPOSIÇÃO da Cozinha, SEM media query, emitida DEPOIS */
:host([data-room='cozinha']) .room-subview {
  grid-template-columns: minmax(0,0.81fr) minmax(0,0.81fr) minmax(...,0.66fr);
}                                                          /* três colunas, sempre */
```

A sobreposição por cômodo é **mais específica e vem depois**. Ela vence em
qualquer largura. Os cômodos com sobreposição de grid **nunca empilham**; os sem
sobreposição empilham.

Isso é herança dos seis arquivos originais, onde cada cômodo tinha CSS próprio.
O gerador preservou fielmente — inclusive o defeito.

**Correção prevista para a 6.3B:** as sobreposições de grid por cômodo precisam
ser condicionadas ao modo, ou o modo mobile precisa ter grid próprio que não
dependa de vencer a cascata por acidente.

---

## 4. O contrato de modo — o que é e o que NÃO é

```ts
type DashboardMode = 'tablet' | 'mobile';
```

### O que ele NÃO é

Não é uma decisão de layout. Não implica composição igual. Não reduz a parede.

### O que ele é

Uma resposta única para "qual experiência renderizar agora". Hoje essa pergunta é
respondida em **três lugares independentes**, todos por largura de tela:

```
bruno-shell.js          @media (max-width: 800px)
section_home_v2.yaml    mediaquery '(max-width: 800px)'
rail.yaml               hide_on_phone: true  (9 itens — nem é media query)
```

Três fontes de verdade. Se o limite mudar, é preciso lembrar dos três.

**E é justamente o contrato que PERMITE duas composições distintas conviverem** —
em vez de cada arquivo adivinhar por media query, cada modo declara a sua.

### Sinais, na ordem em que decidem

1. **Configuração explícita** no YAML — permite forçar o modo, útil para teste.
2. **`pointer: coarse` + largura** — distingue toque de mouse.
3. **Largura do container** — desempate, não regra.

---

## 5. A mudança no roteiro: nasce a 6.3B

O roteiro previa 6.3A (inventário) e 6.5B (implementação sobre a shell nova).
Falta uma etapa entre elas, e ela é de **desenho**, não de código:

```
6.3A  Inventário e arquitetura mobile        ← este documento
6.3B  CONSOLIDAÇÃO DO LAYOUT MOBILE          ← NOVA
6.4   Registry e contratos
6.5   Shell, rail e roteamento
6.5B  Implementação mobile sobre a shell nova
```

### Por que ela precisa existir

A 6.5B pressupunha um layout mobile definido, que só precisaria ser reimplementado
sobre a arquitetura nova. **Não é o caso:** o layout está em construção. Sem
fechá-lo antes, a 6.5B implementaria decisões que ainda não foram tomadas — e
decisão de desenho tomada dentro da implementação é a receita do retrabalho.

### O que a 6.3B decide, tela por tela

| tela | o que precisa ser definido |
|---|---|
| **Home** | ordem e prioridade dos blocos em retrato; o que sai; o que vira acesso |
| **Cômodos** | o card de cômodo em retrato: proporção, o que mostra, o que aciona |
| **Subviews de cômodo** | **o layout mobile próprio** — resolve o defeito do §3.1: quais módulos, em que ordem, empilhados ou em abas |
| **Câmeras** | grade uniforme (decisão nº 4), quantas por linha, quando há vídeo |
| **Mídia** | composição em retrato |
| **Planta 3D** | adaptação — hoje "não está funcionando" no phone |
| **Roborock** | concebido em paisagem, não adapta |
| **Ações rápidas** | hoje ocultas no phone; onde reaparecem |
| **Barra inferior** | quais itens ficam visíveis, quais vão para "Mais" |

**Entregável da 6.3B:** um documento de layout por tela, com o suficiente para a
6.5B implementar sem decidir nada de desenho. Sem código.

### O que a 6.5B passa a ser

Implementar o layout fechado na 6.3B, sobre a shell da 6.5, herdando o que já
existe: escala fluida, estado seletivo, motor de câmeras, tokens e componentes.

---

## 6. Requisitos que a 6.5B herda, já medidos

### Câmera no mobile

**Nunca múltiplos streams automáticos.** Medido na 6.2B: duas câmeras disputando
a mesma fonte levaram uma a 100% de falha. No celular, com rede móvel, o custo é
maior.

Isso conversa diretamente com a decisão nº 4 do usuário: se todas as câmeras têm
o mesmo tamanho, nenhuma é "a principal" — então o instantâneo é o comportamento
certo para todas, e o vídeo entra sob demanda, numa de cada vez.

### Escala fluida

A 6.2 já entregou. Os cards de cômodo se acomodam à proporção do celular sem
breakpoint por aparelho — que é exatamente a adaptação de espaço que a decisão
nº 5 do usuário pede. O que falta é a **reorganização**, não o dimensionamento.

### Alvos de toque

Mínimo de 44×44 px em `mobile`, 48×48 em `tablet` (uso à distância).

### Estado entre views

Preservar cômodo selecionado, câmera promovida e seção aberta ao navegar.

### Safe areas

`env(safe-area-inset-*)` na barra inferior e no topo. Hoje não existe — em
aparelho com recorte, a barra encosta na área de gestos.

---

## 7. Pendências

| # | item | fase |
|---|---|---|
| M1 | Subviews de cômodo: layout mobile próprio + defeito da cascata (§3.1) | 6.3B decide, 6.5B implementa |
| M2 | Roborock e Planta 3D em retrato | 6.3B decide, 6.5B implementa |
| M3 | Ações rápidas: onde reaparecem | 6.3B |
| M4 | Popups de tablet no phone | 6.6 |
| M5 | Limpar linhas comentadas de V1/V2 | 7 |
