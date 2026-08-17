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

### Fase 6.1 — Estado seletivo e ciclo de vida · ✅ CONCLUÍDA (2026-08-06)

Entregue:

- `services/state/entity-watcher.ts` — o módulo declara o que lê, o observador
  responde QUAIS entidades mudaram. A lista sai de uma varredura da configuração,
  não de uma lista escrita à mão (que seria a próxima coisa a ficar defasada);
- `services/state/clock.ts` — relógio central: um intervalo para todos, some
  quando o último assinante sai, desliga com a aba oculta;
- suspensão de módulo invisível: o ciclo de instantâneos de câmera para com a
  tela apagada e busca um quadro na hora ao voltar;
- coletor corrigido: vazamento deixou de contar componente montado; memória ganhou
  piso/pico/degraus; tarefas longas separam carga de uso; marca de ciclo de
  navegação;
- `scripts/harness/gen-render-harness.mjs` — banco de medição de renders.

**O defeito que a fase achou:** `_hass` estava declarado como propriedade
**reativa** do Lit nos três componentes. Toda atribuição a propriedade reativa
pede render, e o setter atribui sempre — então a guarda por assinatura, que
existia desde a Fase 5, **nunca evitou um único render**. Era a origem dos 4
renders por segundo. Só ficou visível quando cada render passou a carregar o
motivo: 2.767 de 2.800 vinham de fora do observador.

**Medido:**

| | sem estado seletivo | com | redução |
|---|---|---|---|
| 7 ladrilhos · 400 atualizações do `hass` | 2.800 renders | 40 | 98,6% |
| 1 subview · 200 atualizações | 200 renders | 20 | 90,0% |
| **No tablet** (`bruno-room-tile`) | 4,04 renders/s | **0,32/s** | **12,6×** |

50 ciclos de navegação: instâncias, timers, listeners e assinaturas zerados
desde a marca.

**Aceite pendente:** "sem crescimento contínuo de memória" **não pôde ser
verificado** — e a razão está documentada: `performance.memory` é entregue em
degraus grandes e esparsos, e uma sessão de 146 s lê um valor só. O instrumento
agora se recusa a opinar com menos de dois degraus. Fica para uma sessão longa
(30 min+ sem recarregar).

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

### Fase 6.2B — Camera Engine · **PRÓXIMA** (promovida)

**Por que subiu na fila.** Depois da 6.1 o usuário confirmou: *"os resultados
podem ter melhorado, mas na prática ainda tem muita lentidão na renderização das
câmeras"*. Está certo, e a medição concorda — a 6.1 melhorou render de ladrilho e
**não tocou em câmera**. É o único incômodo que sobrou com evidência acumulada, e
é o que ele sente todo dia.

**A evidência medida no tablet** (baselines 3 a 6):

| medida | valor |
|---|---|
| Taxa de falha das requisições de instantâneo | **25%** (4 de 16; antes 7 de 28) |
| Pior tempo de resposta | **10.039 ms** — cheira a estouro de prazo, não a lentidão |
| Latência média por quadro (baseline 3) | 6,2 s |
| Câmeras com WebRTC | **8 de 8** |
| Câmeras só com HLS | 0 |

**Correção registrada:** versões anteriores deste roteiro afirmavam que "Tuya não
expõe WebRTC nativamente" e que "o caminho realista é HLS transcodificado na VM".
Eu escrevi isso sem medir. A sondagem por WebSocket (`camera/capabilities`,
Fase 6.0.5) devolveu **8 de 8 com `web_rtc`**. A leitura por atributo dizia
"instantâneo" nas oito e teria confirmado meu erro com aparência de dado — foi
preciso perguntar ao HA pela API. Ver docs/24.

**Escopo, em duas partes:**

#### Parte 1 — motor de instantâneos · ✅ CONCLUÍDA (2026-08-07)

O diagnóstico exigido saiu da leitura do código, sem precisar de medição nova:

```
cadência do ciclo antigo ......... 6.500 ms  (intervalo FIXO)
carga média de um quadro ......... 6.200 ms  (medido no tablet)
folga real ........................  300 ms
```

Cada câmera tinha uma requisição em voo quase o tempo todo — **saturando
exatamente aquilo que se esperava**. Sem prazo e sem cancelamento, pedido travado
ficava pendurado e o ciclo seguinte abria outro por cima; câmera fora do ar era
martelada a cada 6,5 s para sempre.

`services/camera/snapshot-engine.ts` — seis regras: nunca duas em voo por câmera;
espera `max(folga, cadência − duração)`; prazo de 8 s com abort; recuo
exponencial após 2 falhas (teto 60 s); partida escalonada; cadência própria do
PIP. 31 testes de unidade com agenda falsa + verificação de integração no
navegador. Troca palco↔PIP sem remontar: entregue (o alvo muda de prioridade e
preserva o estado).

Instrumentação passou a ser **por câmera**, com o primeiro quadro em rótulo
próprio — as duas perguntas que a baseline levantava e não respondia.

#### Parte 2 — WebRTC · PRÓXIMA

- instantâneo imediato como placeholder — sempre, inclusive enquanto negocia;
- sessão WebRTC **opt-in por câmera**, na principal do cômodo ativo;
- liberação da sessão ao sair da view (métrica 8) e na suspensão por
  invisibilidade (o gancho já existe, da 6.1).

**Pré-requisito de método:** WebRTC não tem como ser testado no banco local — não
há Home Assistant ali. Ou se colhe uma leitura no tablet com a parte 1 antes de
escrever a parte 2, ou se aceita escrever no escuro. A primeira opção é a que o
histórico deste projeto recomenda.

**Aceite:** as 8 métricas definidas na revisão anterior, medidas no tablet, tema
Josh, 1920×1200 — com destaque para tempo até a primeira imagem e taxa de falha,
que são os dois números que o usuário sente. Se o WebRTC perder na medição, o
instantâneo permanece e isso é registrado como decisão, não como falha.

### Fase 6.3 — Modo mobile

Inventário das V1/V2/V3 **antes** de qualquer remoção; contrato de modo explícito
(não só `innerWidth`); navegação, densidade, toque, safe areas, câmera no mobile
(nunca múltiplos streams automáticos), performance mobile; classificação das views
antigas em REUTILIZAR / MIGRAR / ARQUIVAR / DESCARTAR.

### Fase 6.3B — Consolidação do layout mobile  ✅ ENTREGUE (2026-08-09)

Documento: `docs/27-fase-6.3B-layout-mobile.md` — layout tela por tela,
aguardando aprovacao do usuario. Sem codigo.

### Fase 6.3C — Confronto com o código  ✅ ENTREGUE (2026-08-10)

Documento: `docs/28-fase-6.3-confronto-com-o-codigo.md`. Maquete comparativa
publicada como artifact. Sem codigo.

**Por que ela existe.** A 6.3B propos composicoes para telas cujo estado atual
nao havia sido medido — apenas inventariado por nome de arquivo. O usuario
apontou o metodo: *"a implementacao mobile nao deve ser tratada como uma
reconstrucao completa antes de avaliar tecnicamente o que ja existe"*.

Banco de medicao novo: `scripts/harness/gen-phone-harness.mjs` — monta o
componente real em 390×844 dentro de uma reproducao do content-slot em modo
telefone e devolve ordem visual, altura por modulo e o que fica acima da dobra.

**O que a medicao mudou:**

- a causa do "alguns empilham, outros nao" nao e a cascata (26 §3.1, ERRADO):
  o tratamento completo de telefone existe e esta preso ao seletor
  `[data-tvhub]` — e so a Sala tem TV;
- Home: cards em 2 colunas e area dinamica condicional **ja existem**; da 6.3B
  sobrevive apenas o hero (3 faixas de 48px = 144px de 328);
- Planta 3D tem tratamento proprio e funciona — a decisao D3 (paisagem forcada)
  foi RETIRADA, nascia de uma pendencia de 2026-07-09 ja vencida;
- D5 (inverter a ordem do usuario) RETIRADA: com a iluminacao recolhida a camera
  fica acima da dobra na ordem que ele propos. O argumento do Cenario B nao
  sobreviveu a medicao.

Recomendacao: **Cenario A** (reordenar o que existe), ou **A′** (A com a
iluminacao em folha) se o aparelho for de 667px de altura.

**Por que ela existe.** A 6.5B pressupunha um layout mobile definido, que só
precisaria ser reimplementado sobre a arquitetura nova. Não é o caso: nas
palavras do usuário, *"no momento em que a gente migrou para o formato de tiles,
de cards dinâmicos e de toda essa reestruturação, a gente abandonou o modo
mobile"*. O layout está em construção.

Sem fechá-lo antes, a 6.5B implementaria decisões de desenho ainda não tomadas —
e decisão de desenho tomada dentro da implementação é a receita do retrabalho.

**Decide, tela por tela:** Home, cards de cômodo, subviews de cômodo, câmeras,
mídia, planta 3D, Roborock, ações rápidas e barra inferior.

**Um defeito já diagnosticado que ela precisa resolver:** algumas subviews
empilham no celular e outras não. Não é aleatório — as sobreposições de grid por
cômodo são mais específicas e vêm depois da regra de `@media (max-width: 760px)`,
então vencem em qualquer largura. Herança dos seis arquivos originais.

**Entregável:** documento de layout por tela, suficiente para a 6.5B implementar
sem decidir nada de desenho. **Sem código.**

### Fase 6.4 — Registry, contratos e host adapter · ✅ CONCLUIDA (2026-08-16)

Entregue em `dashboard-src/src/application/`, com 49 testes:

| arquivo | papel |
|---|---|
| `host-adapter.ts` | a porta entre widget e casa: estado, serviço, more-info, navegação, observação. `HostHomeAssistant` e `HostDeTeste` |
| `widget-registry.ts` | `WidgetDefinition`, `WidgetInstance`, área (posição/tamanho), catálogo, colisão e validação |
| `layout-repository.ts` | `LayoutRepository`, porta de armazenamento, versionamento e migração. Memória e localStorage |

**Nada foi religado.** O `device-registry` da 5e.0 continua atendendo o painel
Dispositivos sem alteração, e nenhum componente passou a usar os contratos
novos. Prova disso: o bundle continuou `DpecM3wp`, byte a byte — os arquivos são
removidos pelo tree-shaking porque ninguém os importa. **A fase não exigiu
publicação.**

Isso e deliberado: o trabalho mobile do Codex esta validado no aparelho, e
reescrever seus consumidores para provar a arquitetura nova trocaria risco real
por simetria. A migracao dos consumidores acontece quando houver motivo — a 6.5
e a 6.6 —, nao por completude.

**Decisão que ficou em aberto, e é do usuário:** onde o layout persiste.
`localStorage` diverge entre tablet e telefone; uma entidade do HA sincroniza
mas exige criar entidade (packages estão fora do meu alcance sem autorização);
um arquivo em `/config` sincroniza sem entidade mas exige caminho de escrita.
A fase entrega a porta e duas implementações que não dependem da escolha.

A interface de edição (arrastar, redimensionar, painel do editor) fica para
depois — a estrutura, não.

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
