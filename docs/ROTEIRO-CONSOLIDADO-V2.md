# Roteiro consolidado v2 — posicionamento técnico e fases revisadas

> ⚠️ **SUPERADO pela V3 em 2026-08-05.** O posicionamento técnico da Parte I
> continua válido e é a justificativa das decisões; o ROTEIRO foi revisado —
> use **ROTEIRO-CONSOLIDADO-V3.md**.

**Base:** `RELATORIO-CONSOLIDADO.md` + `ANALISE-TECNICA-E-ROTEIRO-REVISTO-HA.md`
**Data:** 2026-08-05
**Status:** Fase 5c implementada e publicada; falta validação no tablet.

Este documento substitui a §11 do relatório consolidado. Nada do que já foi
construído é descartado.

---

## Parte I — Posicionamento técnico sobre a análise

### Onde concordo, sem ressalva

| tese da análise | por quê concordo |
|---|---|
| Nada da Fase 0 à 5c deve ser refeito | os ganhos são estruturais e medidos |
| Falta **arquitetura de runtime**, não mais organização | correto: organizar código não controla quem renderiza, quando, e o que fica montado |
| Decompor o `bruno-room-subview` | ele reúne 13 módulos num componente só; qualquer mudança de estado passa por todos |
| **Baseline de runtime antes de otimizar** (Fase 6.0) | é a lacuna mais séria do roteiro atual. Sem número inicial, "otimização" vira opinião |
| Critério de vazamento por ciclo, não por contagem absoluta | "316 listeners" isolado não é meta; voltar ao valor inicial após 50 navegações é |
| Zod adiado até haver editor e persistência | a validação de runtime só passa a valer quando a configuração deixa de ser autoral |
| Playwright como filtro após a responsividade | o harness já faz 90% disso; Playwright é a camada de automação |
| Modo mobile ≠ responsividade | são problemas diferentes e a análise separa corretamente |
| Trilhas separadas para automação e Alexa | a casa não pode depender do dashboard estar aberto |

### Correção 1 — a câmera por instantâneo não é ingenuidade; é a escolha da origem, e o streaming já regrediu neste hardware

A análise trata o snapshot como uma solução provisória a ser substituída por
WebRTC/HLS. Falta a esse diagnóstico um fato desta sessão:

**Eu implementei exatamente o que a análise propõe — `hui-image` com
`cameraView: 'live'` — e o retorno medido do usuário foi "câmera demora
horrivelmente pra renderizar".** Voltei ao instantâneo por isso, e porque é o
que as seis subviews originais sempre usaram.

Além disso: são **8 câmeras Tuya**, via integração Xtend. Tuya não expõe WebRTC
nativamente no HA; o caminho realista é RTSP → `stream` → HLS, que transcodifica
**na VM**. Duas câmeras ao vivo por subview, com navegação entre cômodos, é carga
de CPU contínua num host que já é o gargalo.

**Posição:** a Camera Engine entra no roteiro, mas com três condições que a
análise não impõe:

1. **Sondagem de capacidade real antes de escolher o caminho** — descobrir se
   go2rtc/WebRTC existe neste HA, ou se o único caminho é HLS transcodificado.
   Isso é investigação, e vem antes de escrever o player.
2. **O instantâneo continua sendo o padrão até que o stream vença na medição**,
   no tablet, contra a baseline atual. Não por conservadorismo — porque já
   perdeu uma vez.
3. **Stream é opt-in por câmera**, não global. A câmera principal do cômodo
   ativo pode justificar; oito simultâneas não.

O critério de aceite deixa de ser "streaming real" e passa a ser: *tempo até a
primeira imagem e fluidez iguais ou melhores que o instantâneo atual, medidos no
tablet, com a CPU da VM dentro do orçamento.*

### Correção 2 — decomposição e CSS são o MESMO trabalho, não duas fases

A análise põe decomposição na 6.1 e retirada do CSS legado na 6.2. **Nessa ordem
o trabalho dobra.**

O CSS das subviews hoje é **um bloco único de 5.266 linhas**, gerado dos
originais e escopado por atributo no host (`:host([data-room='cozinha'])`). Ele
depende da árvore inteira estar num único shadow root.

Ao quebrar o componente em sete filhos sem tocar no CSS, cada filho passa a
precisar da folha para se estilizar. As saídas seriam: replicar 5.266 linhas em
sete shadow roots (custo de memória num tablet que já é o gargalo), ou construir
uma ponte de `::part`/variáveis que será jogada fora na 6.2.

**Posição:** a unidade de trabalho é o **módulo**, e cada módulo migra inteiro:

```
migrar um módulo =
  extrair o componente filho
+ extrair a fatia de CSS dele, já com container query e escala fluida
+ remover essa fatia do bloco gerado
+ medir contra a baseline
```

Quando o último módulo sair, o arquivo gerado se esvazia sozinho. É o mesmo
método que funcionou nas fases 5a/5b/5c: um bloco coeso por vez, medido.

### Correção 3 — `triggers_update: all` não está no código novo

A análise lista "remover `triggers_update: all`" como ação da 6.1. Essa é uma
propriedade do **button-card**, do YAML legado. Não existe nos componentes Lit.

**Posição:** o alvo correto na 6.1 é o que resta em YAML/button-card. Nos
componentes novos o problema equivalente é outro e mais sutil: **o objeto `hass`
inteiro entra por um setter e dispara `requestUpdate()`**. É esse setter que
precisa passar a comparar apenas as entidades que o módulo usa.

### Correção 4 — o ganho de performance mais barato não está na análise

**1,8 MB de JavaScript morto ainda é baixado e interpretado a cada carregamento.**

| ainda em `extra_module_url` | situação |
|---|---|
| 6 subviews de cômodo (`bruno-*-subview.js`) | substituídas pelo componente na 5c |
| 9 cards de cômodo (`bruno-*-card.js`) | substituídos pelo tile na 5b |

São 53 módulos clássicos no total. Nenhum desses 15 é usado pelo caminho vivo —
continuam carregados só como rollback.

**Posição:** assim que a 5c for validada no tablet, comentar essas 15 linhas.
É a maior redução de trabalho de parse disponível hoje, custa um comentário, e o
rollback é descomentar. Entra na 5d, não na 7.

### Correção 5 — o carregador estável deve ser promovido, não deixado para o fim

A análise põe a camada `loader + manifest` na §13, sem fase. Mas hoje **toda
troca de bundle exige reiniciar o Home Assistant** — e o reinício do HA é o
evento que se correlacionou **três vezes** com o Corredor quebrando.

**Posição:** o carregador estável não é polimento de deploy; é o que tira o
reinício do ciclo de trabalho. Entra cedo, como item próprio da 6.0, porque toda
fase seguinte se beneficia dele.

### Correção 6 — registry de widgets e persistência são infraestrutura especulativa neste momento

A dor real e declarada é: fluidez no tablet, independência de resolução, modo
mobile. Editor de cards e drag-and-drop são desejo de futuro, não pendência.

**Posição:** manter a Fase 6.4, mas **depois** do mobile, e reduzida ao registry
— o contrato que permite registrar os componentes existentes. Layout persistido,
editor e drag-and-drop ficam fora do roteiro até haver pedido concreto. Construir
o `LayoutRepository` antes de os módulos estarem decompostos e responsivos é
projetar para um problema que ainda não existe.

### Sobre a Regra de Ouro nº 1 — decisão que é sua, não minha

A análise propõe relaxar o "nunca apagar código" após a validação. Tecnicamente
concordo, e tenho a evidência: **a armadilha da crase disparou nove vezes neste
projeto, e em todas elas dentro de um comentário** — quase sempre um bloco de
rollback in-place.

Mas a regra é sua e protegeu o projeto durante meses. **Proposta, para você
aceitar ou recusar:** o rollback in-place continua obrigatório até a validação;
depois dela, o bloco antigo sai do arquivo vivo e vai para `_archive/` com o
caminho original registrado. O Git guarda tudo de qualquer forma.

### Sobre o posicionamento dos status da Home — causa encontrada

Não precisa de medição: **está escrito no próprio arquivo.**

`config/dashboards/views/shell/section_home_v2.yaml`:

```
grid-template-rows: 0px 48px calc(77vh - 154px) calc(23vh + 52px)
```

E o comentário logo acima, do autor da mudança:

> "Movida para o TOPO: o gap volta a ser um só (10px). **Efeito colateral aceito:
> a faixa de badges desce 10px.**"

A primeira linha do grid é uma linha de segurança de 0px. Ao movê-la para o topo,
o `grid-gap` de 10px passou a ficar **acima** da faixa de badges — que por isso
desce 10px em relação às subviews, onde a barra é a primeira linha real.

Foi uma troca deliberada, registrada, e agora você quer desfeita. O ajuste é na
aritmética das linhas da Home, não no card de badges — que já medi e é idêntico
ao das subviews (46 px dentro de 48 px, mesmas colunas, mesma centralização).

---

## Parte II — Roteiro consolidado

### Fase 5d — Fechamento da 5c

**Objetivo:** consolidar antes de qualquer mudança estrutural nova.

| # | ação | origem |
|---|---|---|
| 5d.1 | Validar as seis subviews no tablet | análise |
| 5d.2 | **Alinhar os status da Home com os das subviews** — corrigir a aritmética das linhas em `section_home_v2.yaml`, não o card | pedido do usuário; causa localizada |
| 5d.3 | Decidir a proporção das colunas da subview após a redução do respiro da rail (o ganho hoje se distribui ~71%/29%; você quer mais na direita) | pendência aberta |
| 5d.4 | **Retirar do `extra_module_url` as 6 subviews + 9 cards já substituídos** — 1,8 MB de parse morto | correção 4 |
| 5d.5 | Pendências A2 (rail/badges) e A6 (botão Apps da TV) | relatório §11.1 |
| 5d.6 | Consolidar o commit pendente e congelar a baseline | análise |

**Aceite:** seis subviews validadas; status da Home alinhados; nenhum módulo
morto no carregamento; rollback confirmado.

### Fase 6.0 — Baseline de runtime e carregador estável

**Objetivo:** medir o comportamento real **no tablet** antes de otimizar, e tirar
o reinício do HA do ciclo.

| # | ação |
|---|---|
| 6.0.1 | Instrumentação embarcada (`bruno-diagnostics` já existe): renders por módulo, listeners, timers, subscriptions, requests, memória, long tasks |
| 6.0.2 | Coleta **no tablet**, não no desktop — o harness não reproduz WebView, memória nem CPU da VM |
| 6.0.3 | Baseline reproduzível e versionada, comparável entre builds |
| 6.0.4 | **Carregador estável** (`loader` + `manifest` → bundle com hash): recarregar a página passa a bastar, sem reiniciar o HA |
| 6.0.5 | Sondagem das capacidades de câmera: existe WebRTC/go2rtc neste HA, ou só HLS transcodificado? |

**Aceite:** baseline armazenada; troca de bundle sem reinício do HA; resposta
documentada sobre a capacidade real das câmeras.

### Fase 6.1 — Estado seletivo e ciclo de vida

**Objetivo:** impedir que mudança irrelevante atualize módulo pesado.

| # | ação |
|---|---|
| 6.1.1 | O setter de `hass` passa a comparar **só as entidades que o módulo usa** — é o equivalente novo do `triggers_update: all` |
| 6.1.2 | Seletores de entidade por módulo, declarados na configuração |
| 6.1.3 | Timers centralizados (hoje há relógio, câmeras e dock, cada um com o seu) |
| 6.1.4 | Suspensão de módulo invisível; limpeza no `disconnectedCallback` |
| 6.1.5 | Teste de 50 ciclos de navegação com os contadores da 6.0 |
| 6.1.6 | Remover `triggers_update: all` do que **resta em YAML/button-card** |

**Aceite:** contadores voltam ao inicial após 50 navegações; nenhum crescimento
contínuo de memória; redução de renders medida contra a 6.0.

### Fase 6.2 — Migração por módulo: decomposição + responsividade + retirada do CSS

**Fases 6.1 e 6.2 da análise, fundidas.** Ver correção 2.

Cada módulo migra inteiro, nesta ordem:

```
bruno-room-status      (barra superior — o mais simples, valida o método)
bruno-lighting-dock    (já mexido; o CSS dele é o mais contido)
bruno-climate-card     (o anel é autocontido)
bruno-media-hub        (o mais acoplado a estado)
bruno-camera-stage     (junto com a 6.2B)
bruno-room-hero
bruno-appliances
```

Para cada um: componente filho + fatia de CSS com container query e escala fluida
+ remoção da fatia do bloco gerado + medição contra a baseline.

**Aceite por módulo:** funciona de 600 a 2000 px sem breakpoint por aparelho;
não depende mais da fatia legada; paridade nas resoluções de referência
(1280×720 e 1920×1200, tema Josh).

**Aceite da fase:** `subview-styles.generated.ts` esvaziado.

### Fase 6.2B — Camera Engine

Entra junto com o módulo de câmera da 6.2. Ver correção 1.

| # | ação |
|---|---|
| 6.2B.1 | Instantâneo imediato como placeholder — sempre |
| 6.2B.2 | Sessão de stream **opt-in por câmera**, decidida pela sondagem da 6.0.5 |
| 6.2B.3 | Suspensão por invisibilidade; troca palco↔PIP sem remontar |
| 6.2B.4 | Comparação medida contra o instantâneo atual **e** contra o card oficial do HA |

**Aceite:** tempo até a primeira imagem e fluidez **iguais ou melhores** que o
instantâneo de hoje, no tablet, com a CPU da VM dentro do orçamento. Se o stream
perder, o instantâneo permanece e isso é registrado como decisão — não como
falha.

### Fase 6.3 — Modo mobile

Escopo integral da análise (§6.3), que está bem construído: inventário das V1/V2/V3,
contrato de modo explícito, navegação, densidade, toque, safe areas, câmera no
mobile, performance mobile, classificação das views antigas.

Duas notas:
- o inventário vem **antes** de qualquer remoção — regra que você já impôs;
- a câmera no mobile herda a decisão da 6.2B: nunca múltiplos streams automáticos.

### Fase 6.4 — Registry de componentes (reduzida)

Só o contrato de registro dos componentes existentes. Layout persistido, editor
e drag-and-drop ficam fora até haver pedido concreto. Ver correção 6.

### Fase 6.5 — Shell, rail e roteamento

Depois de estado, lifecycle e registry definidos — como a análise propõe. O risco
a evitar está nomeado por ela: a shell virar o novo monólito.

### Fase 6.6 — Home, popups e subviews especializadas

Ordem da análise, mantida: cards dinâmicos da Home → mídia e câmera da Home →
popups → Roborock → câmeras de segurança → planta 3D.

### Fase 7 — Consolidação

Como no relatório, mais: retirar os rollbacks in-place já consolidados (se você
aceitar a proposta sobre a Regra de Ouro nº 1) e congelar a arquitetura.

---

## Parte III — O que muda em relação ao roteiro anterior

| item | antes | agora |
|---|---|---|
| Baseline de runtime | não existia | **Fase 6.0**, gate obrigatório |
| Carregador estável | §13 sem fase | **6.0.4**, promovido |
| Decomposição × CSS | fases separadas (6.1, 6.2) | **fundidas por módulo** |
| Câmera | "streaming real" como meta | meta é **medição vencer o instantâneo**; stream opt-in |
| Módulos mortos carregados | não mencionado | **5d.4**, 1,8 MB |
| Widget registry | Fase 6.4 completa | reduzida ao registry, depois do mobile |
| Status da Home | pendência sem causa | **causa localizada**, 5d.2 |
| Modo mobile | "anotação para futuro" | **Fase 6.3** com escopo próprio |

---

## Parte IV — Próxima ação

```
1. Validar a 5c no tablet                       ← só você pode
2. Corrigir o alinhamento dos status da Home    (5d.2)
3. Decidir a proporção das colunas da subview   ← precisa do seu olho
4. Retirar os 15 módulos mortos do carregamento (5d.4)
5. Consolidar o commit e congelar a baseline
6. Construir a instrumentação e a baseline de runtime (6.0)
7. Carregador estável — fim do reinício a cada bundle (6.0.4)
8. Sondar a capacidade real das câmeras         (6.0.5)
9. Migrar o primeiro módulo pelo método fundido (6.2)
```

Concordo com a análise: **não** migrar agora a shell inteira, a planta 3D nem as
câmeras de segurança.

---

## Documentos a criar

Os da análise, com dois ajustes de escopo:

```
docs/17-runtime-architecture.md
docs/18-camera-engine.md          ← inclui a sondagem de capacidade e o veredito medido
docs/19-state-and-lifecycle.md
docs/20-responsive-architecture.md
docs/21-mobile-mode.md
docs/22-component-registry.md     ← registry, sem layout persistido
docs/23-host-adapter.md
docs/24-performance-baseline.md   ← a baseline da 6.0, versionada
docs/25-automation-voice-boundaries.md
```
