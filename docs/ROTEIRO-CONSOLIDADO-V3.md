# Roteiro consolidado v3 — implementado, pendente e sequência

**Projeto:** dashboard pessoal do Home Assistant de Bruno Helásio (`negocjohn`)
**Substitui:** `ROTEIRO-CONSOLIDADO-V2.md` e a §11 do `RELATORIO-CONSOLIDADO.md`
**Data:** 2026-08-05 · **revisado em 2026-08-06** com quatro ajustes do usuário (Parte II-B)

Documento único de planejamento. O histórico do que foi feito está no
`RELATORIO-CONSOLIDADO.md`; aqui fica o estado e a sequência.

---

## Parte I — Estado do projeto

### 1.1 Implementado e em produção

| fase | entrega | evidência |
|---|---|---|
| 0 | Checkpoint, tag `pre-dashboard-architecture`, backups | commit `e0dc9da3` |
| 1 | Auditoria: 4 defeitos medidos, riscos R1–R10 | `PRE_MIGRATION_AUDIT.md` |
| 2 | 17 documentos, `docs/00` a `docs/16` | commit `d459dc9c` |
| 3 | 195 arquivos legados isolados em `_archive/`, zero mudança no caminho vivo | commit `6895e2eb` |
| 4 | `dashboard-src/`: TypeScript estrito, Lit, Vite, Vitest, ESLint, Prettier | commit `f82880ad` |
| 5a | Piloto: um tile de cômodo pela arquitetura nova | commits `426dc184`→`4f6ab280` |
| 5b | **8 tiles da Home → 1 componente** (`bruno-room-tile.ts`) | validado pelo usuário |
| 5c | **6 subviews (~8.900 linhas cada) → 1 componente** (`bruno-room-subview.ts`) | 461 campos medidos, 3 divergências documentadas |
| — | Assets de cômodo redimensionados: 64,3 → 9,6 MB de bitmap | commit `a3c74960` |

### 1.2 Ganho estrutural acumulado

| dimensão | antes | agora |
|---|---|---|
| Subviews de cômodo | 6 arquivos, 41.421 linhas | 1 componente, ~2.400 linhas + CSS gerado |
| Faixa de cômodos | 8 tiles em YAML | 1 componente |
| Ajuste num cômodo | repetir 6 vezes à mão | 1 lugar |
| Linguagem | JavaScript solto, sem build | TypeScript estrito, Lit, Vite |
| Verificação | nenhuma | typecheck + lint + 46 testes + build num comando |
| Erro de sintaxe | derrubava o dashboard em silêncio | pego antes de publicar |
| Legado no caminho vivo | 195 arquivos | 0 (isolados) |
| Cache-bust | `?v=` manual em cascata | hash de conteúdo do Vite |

### 1.3 Pendente da Fase 5c — a fechar antes de qualquer coisa nova

| # | item | estado |
|---|---|---|
| 5d.1 | **Validação visual das seis subviews no tablet** | só o usuário pode fazer |
| 5d.2 | Status da Home alinhados **acima**, iguais aos das subviews | causa localizada — ver §2.1 |
| 5d.3 | Proporção das colunas da subview após a redução do respiro da rail | precisa do olho do usuário |
| 5d.4 | Retirar do carregamento os 15 módulos já substituídos (1,8 MB) | pronto para executar após 5d.1 |
| 5d.5 | Espaçamento da rail + tamanho dos badges (A2); botão Apps da TV (A6) | aberto |
| 5d.6 | Consolidar o commit pendente e congelar a baseline | aberto |

### 1.4 Não migrado ainda

| item | linhas | fase prevista |
|---|---|---|
| `bruno-shell.js` (esqueleto de tudo) | — | 6.5 |
| `bento-sidebar-card.js` (a rail) | — | 6.5 |
| Cards da Home (hero, energia, mídia, câmera, agenda) | — | 6.6 |
| Popups (Sistema, Rede, Cenas, Config, Lavabo) | — | 5e e 6.6 |
| `bruno-cameras-security-subview.js` | 1.597 | 6.6 |
| `bruno-planta-3d-subview.js` | 2.204 | 6.6 |
| `bruno-roborock-subview.js` | 937 | 6.6 |
| Views mobile V1/V2/V3 | — | 6.3 |

---

## Parte II — Decisões desta revisão

### 2.1 Status da Home — sobem para o alinhamento das subviews

A causa está escrita no próprio arquivo. Em
`config/dashboards/views/shell/section_home_v2.yaml`:

```
grid-template-rows: 0px 48px calc(77vh - 154px) calc(23vh + 52px)
```

E o comentário do autor, logo acima:

> "Movida para o TOPO: o gap volta a ser um só (10px). **Efeito colateral aceito:
> a faixa de badges desce 10px.**"

A primeira linha do grid é uma linha de segurança de 0px. Ao movê-la para o topo,
o `grid-gap` de 10px passou a ficar **acima** da faixa de badges. Nas subviews a
barra é a primeira linha real, sem gap acima — daí a diferença.

**Decisão:** desfazer o efeito colateral. O ajuste é na aritmética das linhas da
Home, não no card de badges — que já foi medido e é idêntico ao das subviews
(46 px dentro de 48 px, mesmas colunas, mesma centralização).

### 2.2 Registry de widgets — mantido, com estrutura preparada

**Correção da v2.** Na v2 eu havia proposto reduzir a fase ao registry e adiar o
resto. O usuário determinou o contrário, e o argumento dele é o correto:

> A estrutura deve ficar previamente preparada para a implementação futura,
> evitando refatoração e reescrita de código já validado.

**Decisão:** os contratos (`WidgetInstance`, `WidgetDefinition`,
`LayoutRepository`, `HostAdapter`) entram desde já, e **todo componente migrado a
partir de agora nasce compatível com eles**. O que fica adiado é apenas a
*interface de edição* — drag-and-drop, redimensionamento e o painel do editor.

Consequência prática, e é ela que justifica a decisão: um componente que nasce
recebendo `config` tipada, declarando suas entidades e expondo um `type` no
registry não precisa ser reescrito quando o editor existir. Um que nasce lendo
`this._config` direto e desenhando no lugar fixo, precisa.

### 2.3 Regra de Ouro nº 1 — relaxada após a validação

**Aprovado pelo usuário nesta revisão.**

- **Antes da validação:** rollback in-place obrigatório, como sempre foi.
- **Depois da validação:** o bloco antigo sai do arquivo vivo e vai para
  `_archive/` com o caminho original registrado. O Git guarda tudo.

Motivo: a armadilha da crase disparou **nove vezes** neste projeto, e em todas
dentro de um comentário — quase sempre um bloco de rollback in-place.

---

## Parte III — Fase 5e: refinamento funcional

**Nova fase, entre o fechamento da 5c e as fases de otimização.** Determinada
pelo usuário nesta revisão.

### 5e.1 — Power na rail das subviews

**Hoje:** `rail.yaml` (Home) tem 9 itens e termina com `power`
(`action: navigate`, `navigation_path: /` — sai do dashboard para a tela
principal do HA). `rail_rooms.yaml` (subviews) tem 8 itens — Home + 7 cômodos —
e **não tem power**, deixando um vazio abaixo dos ícones.

**Ação:** acrescentar o `power` ao `rail_rooms.yaml`, na mesma posição e com a
mesma função.

**Ganho triplo:** identidade visual entre Home e subviews; elimina o espaço
vazio; permite sair do dashboard de qualquer ambiente, sem voltar à Home.

### 5e.2 — Remoção definitiva da faixa de ações rápidas da Home

**Hoje:** `bento_quick_actions_v2.yaml` ocupa a área `quick_actions` na linha
inferior da Home, dividindo a moldura com os 7 cômodos.

**Ação:** remover a faixa. A base do painel passa a ser **exclusivamente** a
faixa de tiles dos cômodos — mesmo conceito já usado nas subviews.

**As seis funções são redistribuídas** (5e.3 a 5e.6). Nenhuma se perde.

### 5e.3 — "Apagar todas as luzes" vira cena

**Hoje:** botão chamando `homeassistant.turn_off`.

**Ação:** deixa de ser botão independente e passa a ser uma **cena**, acessível
pelo painel de Cenas que já existe na rail.

**Nota de escopo:** criar a cena é configuração do HA, fora do escopo de
dashboard. O dashboard passa a apenas invocá-la.

### 5e.4 — Wi-Fi absorvido pelo botão Rede, em cadeia

**Hoje:** botão de ações rápidas abrindo um `browser_mod.popup`; e um botão
`network` na rail que abre o painel avançado de rede.

**Ação:** o botão **Rede** da rail passa a abrir, **primeiro**, um popup com o
**QR Code da rede de visitantes**. Dentro dele, um botão secundário abre em
seguida o popup avançado de configurações de rede que já existe.

**Padrão preservado:** navegação em cadeia — o simples primeiro, o avançado a um
toque de distância. É a arquitetura que o dashboard já adota.

### 5e.5 — "Atualizar" migra para Configurações

**Hoje:** botão de ações rápidas com `bruno_action: refresh`. O painel de
Configurações já existe (`bruno_action: config`) e concentra temas e wallpapers.

**Ação:** "Atualizar" passa a ser um item do menu Configurações, junto das demais
opções de personalização.

### 5e.6 — Popup **Dispositivos** substitui o popup Sistema

**Hoje:** `_renderSystemPanel` renderiza literalmente *"Sistema — Módulo
indisponível"*. É o que o usuário descreveu como "sem utilidade prática".

**Ação:** substituir pelo popup **Dispositivos** — ponto central de acesso rápido
aos principais equipamentos da casa.

**Conteúdo inicial:** TV da sala e ar-condicionado da sala (as duas funções que
saem das ações rápidas).

**Requisito de projeto, e é o ponto crítico desta entrega:** o popup **nasce
extensível**. A referência é a organização de sistemas profissionais de automação
— Savant, Control4, Crestron: uma lista de dispositivos, agrupada, com o controle
de cada um aberto ao ser selecionado.

Isso significa, desde a primeira versão:

- os dispositivos vêm de **configuração**, não de marcação fixa;
- cada tipo de dispositivo (TV, clima, mídia, persiana…) é um **componente de
  controle registrado**, não um bloco escrito dentro do popup;
- acrescentar um dispositivo novo é acrescentar uma **entrada de configuração**,
  não editar o popup.

É o primeiro consumidor real do registry da 6.4 (§2.2) — e por isso os contratos
precisam existir antes.

### 5e.7 — Luz do corredor

Nenhuma ação. A função já foi absorvida pela tile própria do Corredor.

### Critérios de aceite da 5e

- rail idêntica entre Home e subviews, com o power na mesma posição;
- base da Home composta só pela faixa de tiles;
- nenhuma das seis funções perdida — cada uma no destino acima;
- popup Dispositivos funcionando com TV e A/C da sala;
- **acrescentar um dispositivo ao popup não exige editar o componente do popup**;
- painel Sistema retirado do caminho vivo.

---

## Parte IV — Sequência completa

```
5d  Fechamento da 5c        ← validação no tablet, status da Home, módulos mortos
 ↓
5e  Refinamento funcional   ← rail, ações rápidas, Dispositivos, Rede, Config
 ↓
6.0 Baseline de runtime     ← medir no tablet + carregador estável + sondar câmeras
 ↓
6.1 Estado seletivo e ciclo de vida
 ↓
6.2 Migração por módulo     ← decomposição + responsividade + retirada do CSS (fundidas)
 ↓
6.2B Camera Engine          ← junto com o módulo de câmera
 ↓
6.3A Inventário e arquitetura mobile   ← requisitos, contrato de modo, classificação V1/V2/V3
 ↓
6.4 Registry e contratos    ← formaliza o que a 5e.0 começou
 ↓
6.5 Shell, rail e roteamento
 ↓
6.5B Implementação e validação mobile  ← navegação, estado e safe areas SOBRE a shell nova
 ↓
6.6 Home, popups e subviews especializadas
 ↓
7   Consolidação
```

**Observação sobre a 6.4:** a fase permanece nessa posição, mas **os contratos são
antecipados** — eles já orientam a 5e.6 (popup Dispositivos) e a 6.2 (cada módulo
migrado nasce compatível). A fase 6.4 formaliza e completa o que foi sendo
construído; ela não é o começo desse trabalho.

### Fase 6.0 — Baseline de runtime e carregador estável

| # | ação |
|---|---|
| 6.0.1 | Instrumentação embarcada: renders por módulo, listeners, timers, subscriptions, requests, memória, long tasks |
| 6.0.2 | Coleta **no tablet** — o harness não reproduz WebView, memória nem CPU da VM |
| 6.0.3 | Baseline reproduzível, versionada, comparável entre builds |
| 6.0.4 | **Carregador estável** (`loader` + `manifest` → bundle com hash): recarregar a página basta, sem reiniciar o HA |
| 6.0.5 | Sondar a capacidade real das câmeras: existe WebRTC/go2rtc, ou só HLS transcodificado? |

**Por que 6.0.4 é prioridade:** hoje toda troca de bundle exige reiniciar o HA — e
o reinício é o evento que se correlacionou **três vezes** com o Corredor quebrando.

### Fase 6.1 — Estado seletivo e ciclo de vida

- o setter de `hass` passa a comparar **só as entidades que o módulo usa**
  (equivalente novo do `triggers_update: all`, que é propriedade de button-card e
  só existe no YAML remanescente);
- seletores de entidade por módulo, declarados na configuração;
- timers centralizados (hoje: relógio, câmeras e dock, cada um com o seu);
- suspensão de módulo invisível; limpeza no `disconnectedCallback`;
- teste de 50 ciclos de navegação com os contadores da 6.0.

**Aceite:** contadores voltam ao inicial após 50 navegações; sem crescimento
contínuo de memória; redução de renders medida contra a 6.0.

### Fase 6.2 — Migração por módulo

Decomposição, responsividade e retirada do CSS legado são **o mesmo trabalho**,
por módulo. O CSS hoje é um bloco único de 5.266 linhas escopado por atributo no
host; quebrar o componente sem quebrar o CSS obrigaria a replicá-lo em sete
shadow roots.

```
migrar um módulo =
  extrair o componente filho (compatível com o registry)
+ extrair a fatia de CSS, já com container query e escala fluida
+ remover essa fatia do bloco gerado
+ medir contra a baseline
```

Ordem: `room-status` → `lighting-dock` → `climate-card` → `media-hub` →
`camera-stage` → `room-hero` → `appliances`.

**Aceite por módulo:** funciona de 600 a 2000 px sem breakpoint por aparelho;
não depende mais da fatia legada; paridade a 1280×720 e 1920×1200, tema Josh.
**Aceite da fase:** `subview-styles.generated.ts` esvaziado.

### Fase 6.2B — Camera Engine

- instantâneo imediato como placeholder — sempre;
- sessão de stream **opt-in por câmera**, decidida pela sondagem da 6.0.5;
- suspensão por invisibilidade; troca palco↔PIP sem remontar.

**Aceite:** tempo até a primeira imagem e fluidez **iguais ou melhores** que o
instantâneo de hoje, medidos no tablet, com a CPU da VM dentro do orçamento.

**Contexto que justifica esse critério:** o streaming ao vivo (`hui-image` com
`cameraView: 'live'`) já foi implementado nesta migração e **regrediu** — o
usuário relatou demora relevante. São 8 câmeras Tuya via Xtend; o caminho
realista é RTSP → HLS transcodificado na VM. Se o stream perder de novo na
medição, o instantâneo permanece e isso é registrado como decisão, não falha.

### Fase 6.3 — Modo mobile

Inventário das V1/V2/V3 **antes** de qualquer remoção; contrato de modo explícito
(não só `innerWidth`); navegação, densidade, toque, safe areas, câmera no mobile
(nunca múltiplos streams automáticos), performance mobile; classificação das views
antigas em REUTILIZAR / MIGRAR / ARQUIVAR / DESCARTAR.

### Fase 6.4 — Registry, contratos e host adapter

Formaliza o que a 5e.6 e a 6.2 vêm construindo: `WidgetInstance`,
`WidgetDefinition`, `LayoutRepository`, `HostAdapter`. A interface de edição
(drag-and-drop, redimensionamento, painel do editor) fica para depois — a
estrutura, não.

### Fase 6.5 — Shell, rail e roteamento

Depois de estado, lifecycle e registry. Risco a evitar, nomeado: a shell virar o
novo monólito.

### Fase 6.6 — Home, popups e subviews especializadas

Cards dinâmicos da Home → mídia e câmera da Home → popups → Roborock → câmeras de
segurança → planta 3D.

### Fase 7 — Consolidação

Aposentar originais, retirar YAML legado e views mobile, revisar `_archive`,
retirar rollbacks in-place já consolidados (§2.3), esvaziar o CSS gerado,
consolidar Playwright, congelar a arquitetura.

---

## Parte V — Trilhas paralelas

```
Trilha A — Aplicação frontend   (este roteiro)
Trilha B — Automação residencial (presença, iluminância, horários, cenas)
Trilha C — Voz e Alexa           (nomenclatura, aliases, áreas, rotinas)
```

**Princípio:** a automação funciona com o tablet desligado. O dashboard
visualiza, diagnostica e permite intervir — não é o executor.

---

## Parte VI — Documentos a criar

```
docs/17-runtime-architecture.md
docs/18-camera-engine.md          ← inclui a sondagem e o veredito medido
docs/19-state-and-lifecycle.md
docs/20-responsive-architecture.md
docs/21-mobile-mode.md
docs/22-widget-registry.md        ← contratos, incluindo layout e host adapter
docs/23-host-adapter.md
docs/24-performance-baseline.md
docs/25-automation-voice-boundaries.md
docs/26-devices-popup.md          ← o popup Dispositivos e seu modelo extensível
```

---

## Parte II-B — Ajustes do usuário, 2026-08-06

Quatro ajustes propostos pelo usuário e **aceitos integralmente**. Todos
corrigem problemas reais de sequenciamento ou de critério.

### Ajuste 1 — a Fase 6.3 Mobile é dividida

```
6.3A  Inventário e arquitetura mobile   ← ANTES da shell
6.5   Shell, rail e roteamento
6.5B  Implementação e validação mobile  ← DEPOIS da shell
```

**Motivo (do usuário, e está certo):** o roteiro colocava a implementação mobile
antes da migração da shell. Inventário e requisitos podem vir antes; mas
navegação, preservação de estado e safe areas **se implementam sobre a shell
nova** — fazê-los antes é retrabalho garantido.

- **6.3A:** inventário das V1/V2/V3, contrato de modo explícito
  (`DashboardMode`), requisitos de densidade, toque e câmera no mobile,
  classificação REUTILIZAR / MIGRAR / ARQUIVAR / DESCARTAR. Nenhuma remoção.
- **6.5B:** navegação mobile, preservação de estado entre views, safe areas,
  carregamento sob demanda, validação em retrato e paisagem, retirada das V1/V2/V3
  do caminho vivo.

### Ajuste 2 — Fase 5e.0: contratos mínimos antes do popup Dispositivos

**Motivo:** o popup Dispositivos já é o primeiro consumidor real do registry, mas
a formalização completa só aparecia na 6.4. Sem uma entrega explícita antes,
o risco é nascer uma solução provisória dentro do próprio popup — exatamente o
que a decisão §2.2 quer evitar.

**Escopo da 5e.0, deliberadamente pequeno:**

- `DeviceControlDefinition` — o que um controle informa sobre si;
- `DeviceInstanceConfig` — como um dispositivo é declarado na configuração;
- registry mínimo (registrar, obter, validar, agrupar);
- criação de controles **por configuração**.

**Fora do escopo, e continua na 6.4:** posição e tamanho de widget, persistência
de layout, host adapter, qualquer coisa de editor.

### Ajuste 3 — critérios da Camera Engine separados por métrica

**Motivo (do usuário):** comparar "stream vs snapshot" mistura rapidez inicial
com qualidade e estabilidade da transmissão contínua. São coisas diferentes e
podem ter vencedores diferentes.

O critério único da v2 é substituído por oito métricas independentes:

| # | métrica | por que importa |
|---|---|---|
| 1 | tempo até o primeiro snapshot | é o que o usuário percebe como "abriu" |
| 2 | tempo até o primeiro frame ao vivo | é o que o stream promete entregar |
| 3 | estabilidade por 10, 30 e 60 min | o defeito que só aparece com o tempo |
| 4 | número de reconexões | mede fragilidade da sessão |
| 5 | latência | atraso entre o mundo e a tela |
| 6 | CPU da VM | o gargalo real deste ambiente |
| 7 | memória e rede | orçamento do tablet e da casa |
| 8 | liberação do stream ao sair da view | vazamento é o pior defeito possível |

**Consequência:** o resultado pode ser misto — stream para a câmera principal do
cômodo ativo, snapshot para as demais — e isso passa a ser uma conclusão legítima,
não um meio-termo.

### Ajuste 4 — gate para a cena "Apagar todas as luzes"

**Motivo:** criar a cena é configuração do Home Assistant, não do frontend. O
roteiro reconhecia isso mas não dizia o que fazer se a cena não existir.

**Regra:** o dashboard **verifica se a entidade `scene` existe** antes de expor
a ação.

- **Existe:** o botão aparece e a invoca.
- **Não existe:** o dashboard **registra a dependência** no diagnóstico e
  **não atua fora do frontend**. Nada de criar a cena, nada de escrever em
  `config/packages/`. Aguarda autorização explícita.

É a Regra de Trabalho nº 3 aplicada a um caso concreto: diagnosticar e reportar,
nunca editar o que é do HA.

### Sequência final, com os ajustes

```
5d   Fechamento da 5c
 ↓
5e.0 Contratos mínimos de dispositivo        ← NOVO (ajuste 2)
 ↓
5e   Refinamento funcional (rail, ações rápidas, Dispositivos, Rede, Config)
 ↓
6.0  Baseline de runtime + carregador estável
 ↓
6.1  Estado seletivo e ciclo de vida
 ↓
6.2  Migração por módulo (decomposição + responsividade + retirada do CSS)
 ↓
6.2B Camera Engine                            ← 8 métricas (ajuste 3)
 ↓
6.3A Inventário e arquitetura mobile          ← dividido (ajuste 1)
 ↓
6.4  Registry e contratos (formaliza a 5e.0)
 ↓
6.5  Shell, rail e roteamento
 ↓
6.5B Implementação e validação mobile         ← dividido (ajuste 1)
 ↓
6.6  Home, popups e subviews especializadas
 ↓
7    Consolidação
```


---

## Atualização da Fase 6.2B — 2026-08-06, após a sondagem

**A sondagem 6.0.5 respondeu: 8 de 8 câmeras com WebRTC.**

Isso derruba a premissa da correção 1 do roteiro v2, que era minha e estava
errada: eu afirmei que "Tuya não expõe WebRTC nativamente" e que o caminho
realista seria HLS transcodificado na VM. Neste sistema, não.

| premissa antiga | premissa medida |
|---|---|
| Só HLS, transcodificando na VM | WebRTC em todas as oito |
| CPU da VM é a restrição principal | A restrição passa a ser o cliente: WebView, memória, rede |
| Instantâneo é o padrão até o stream vencer | O instantâneo, medido, já é ruim: 6 s de média, 31% de falha numa sessão |
| Stream é opt-in, uma câmera por vez | Continua prudente começar por uma, mas por causa do cliente, não do servidor |

**Novo objetivo da 6.2B:** substituir o instantâneo por WebRTC na câmera
principal do cômodo ativo, medindo pelas oito métricas já definidas. O
instantâneo permanece como primeiro quadro e como fallback.

As oito métricas de aceite não mudam — elas medem o resultado, não o caminho.
