# 39 — Ajustes gerais do dashboard (2026-08-23) — REFERÊNCIA DE CONSULTA

Rodada de implementação controlada, três blocos, itens A/B/C fechados no
prompt. Escopo estrito: nada fora dos itens listados foi alterado.

> **Como usar este documento:** cada item traz *o que mudou*, *onde*, *valor
> antes → depois*, *o que observar na validação física* e *como reverter só
> aquele item*. Os números de linha são do estado final desta rodada
> (`7aa59467`) e servem de âncora; os marcadores no código
> (`ANTERIOR (rollback ...)`, `A1 (2026-08-23)`, etc.) são a referência
> definitiva se o arquivo se mover.

---

## Estado da rodada

| | |
|---|---|
| Branch local de trabalho | `local/ajustes-gerais-20260823` |
| Partida | `fix/home-mobile-v4-clean` · `08066375` |
| Head da rodada | `7aa59467` |
| Bundle ativo | **`bruno-dashboard.DB1sivd6.js`** |
| Bundle anterior à rodada | `bruno-dashboard.DJf5VDPn.js` |
| Bundles por bloco | 1 `CKib2awp` · 2 `WRycymXp` · 3 `DB1sivd6` |
| GitHub remoto | **INTACTO** — sem push, PR, merge ou escrita via API |
| Onde a candidata vive | **LOCAL + Everex** |
| Validação física | **pendente** |

**Pacote Everex:** `config/configuration.yaml` + todo o diretório
`config/www/dashboard/` + os 8 EXTRAS declarados em
`dashboard-src/scripts/deploy.mjs`.

**Exige reinício do Home Assistant** — o `extra_module_url` mudou de versão.

---

## Índice rápido

| Item | Escopo | Status | Arquivo principal |
|---|---|---|---|
| [A1](#a1--cortina) | mobile + tablet | implementado | `bruno-room-subview.ts`, `bruno-top-badges-card.js` |
| [A2](#a2--hub-artwork) | mobile + tablet | implementado | `bruno-room-subview.ts` |
| [A3](#a3--atalhos-de-streaming) | mobile + tablet | implementado | `bruno-room-subview.ts` |
| [A4](#a4--status-superior-de-mídia) | mobile + tablet | implementado | `bruno-top-badges-card.js` |
| [A5](#a5--anel-do-ar-condicionado) | mobile + tablet | implementado | `bruno-room-subview.ts` |
| [B1](#b1--layout-interno-do-hub-no-tablet) | tablet | implementado | `bruno-room-subview.ts` |
| [B2](#b2--atalhos-em-uma-fileira-no-tablet) | tablet | implementado | `bruno-room-subview.ts` |
| [B3](#b3--iluminação-expandida-ao-entrar) | tablet | implementado | `bruno-room-subview.ts` |
| [B4](#b4--altura-das-células-de-iluminação) | tablet | implementado | `bruno-room-subview.ts` |
| [B5](#b5--faixa-inferior-dos-8-tiles) | tablet | **NÃO ALTERADO** | — |
| [B6](#b6--scrim-lateral--hero) | tablet | implementado | `bruno-shell.js` |
| [B7](#b7--ícone-meteorológico) | tablet | implementado | `bruno-hero-card.js` |
| [B8](#b8--agenda--insights-no-hero) | tablet | implementado | `bruno-hero-card.js` |
| [C1](#c1--cards-das-seções-do-hub-no-mobile) | mobile | implementado | `subview-phone.styles.ts` |
| [C2](#c2--microdeslocamento-ao-abrir-iluminaçãoac) | mobile | implementado | `subview-phone.styles.ts` |
| [C3](#c3--paginação-dos-cômodos-na-home) | mobile | implementado | `bruno-home-phone.ts` |

---

## A1 — Cortina

**Commit:** `d48c9d09` · **Escopo:** compartilhado

### O que mudou

**1. Subview — a retenção pós-Stop deixa de ser timeout cego.**

| | antes | depois |
|---|---|---|
| condição de liberação | `agora - retidoEm >= 700ms` | `telemetria NOVA` **e** `>= 700ms` |
| "telemetria nova" | não existia | `fisico !== movimento.fisicoNoStop` |

O Stop passa a gravar a leitura física daquele instante
(`bruno-room-subview.ts:2800`, campo `fisicoNoStop` no tipo em `:142`), e a
retenção só cai quando o cover publica algo **diferente** dessa âncora
(`:2705`). Os 700ms viram apenas piso. Uma nova ordem Open/Close/Set já
substituía `_movimentoCortina` inteiro, então invalida a retenção sozinha.

**2. Barra superior — prioridade alinhada à subview.**

`bruno-top-badges-card.js:394` — a ordem em `_curtainOpenPosition` foi
invertida:

| | antes | depois |
|---|---|---|
| 1ª fonte | `number.cortina_varanda_percent_control` (helper) | `cover.attributes.current_position` |
| 2ª fonte | `current_position` | helper |

**Por quê:** o helper representa o **alvo** do comando e salta a 0/100 enquanto
o motor ainda corre — foi por isso que a subview o rebaixou a fallback em
2026-08-15. Com prioridades opostas, barra e subview liam fontes diferentes.

### Não alterado

Curva de calibração (`0→0`, `25→33`, `50→47`, `75→70`, `100→100`), entidades,
serviços, comandos Abrir/Parar/Fechar, lógica física do cover.

### O que observar

0%, ~25%, ~50%, ~75%, 100% e Stops intermediários. Após o Stop o valor não pode
saltar; texto, barra e status superior devem convergir.

### Reverter só A1

`git revert d48c9d09` + rebuild + ressincronizar.

---

## A2 — Hub: artwork

**Commit:** `e32b3bbb` · **Escopo:** compartilhado

### O que mudou

| # | antes | depois | onde |
|---|---|---|---|
| preload | `loading="lazy"` | sem lazy, `decoding="async"` | `:3486` (`_arteMidia`) |
| erro | nenhum tratamento | `@error` → `_artesQuebradas` → volta ao standby/ícone | `:3455`, `:3460` |
| "última válida" | promovida só por existir no atributo | URL reprovada não é promovida; `@load` confirma | `:3213` |
| forma da TV ativa | `wide` | **`square`** | `:3563` |
| forma do standby | `wide` | `wide` (inalterado) | `:3563` |

`object-fit: cover` na ativa e `contain` no standby já vinham das regras
`.is-cover` / `.is-standby` do CSS gerado — não foi preciso tocar nelas.

**Por que o defeito só aparecia no mobile:** com a folha fechada o Hub inteiro
fica `display: none`, o que impedia a carga antecipada; no tablet ele já está
visível.

### Não alterado

Power da TV, playback, Spotify routing, comandos de mídia, play/pause, assets
de standby, troca TV/Spotify e o blur do `paused`.

### O que observar

Primeira abertura do Hub; URL válida; URL inválida (não pode sobrar retângulo
quebrado); TV ativa quadrada; Spotify quadrado; standby em `contain`.

---

## A3 — Atalhos de streaming

**Commits:** `dafda1ad` (lógica) · `b9634889` (CSS) · **Escopo:** compartilhado

### O que mudou

**Os assets nunca faltaram.** `tvApps` já trazia `label`, `image` e `script` por
app; o renderer é que ignorava `app.image` e desenhava
`mdi:play-box-outline` em todos.

- `_botaoMidia` ganhou a opção `imagem` (`:3407`). Quando presente, a arte entra
  no lugar do `bruno-icon`; o ícone permanece como **fallback** e volta sozinho
  se a imagem falhar (mesmo `@error` de A2).
- CSS `.mh-btn.is-app` / `.mh-btn-img` (`:1362`): 44px como ponto de partida, a
  caixa do botão não muda.
- **Controle remoto:** os mesmos quatro atalhos entram no popup, vindos da
  **mesma fonte** (`:3614`, `appsRemoto`). Nada é duplicado — o script acionado
  é o que a configuração já declara. Sem `tvApps` a fileira não existe.

Ordem preservada: **Netflix · Prime Video · Disney+ · Max**.

### Não alterado

As doze teclas do remoto, `remote.smart_tv_pro`, `browser_mod.popup`,
`custom:universal-remote-card`, os scripts e a navegação existente.

---

## A4 — Status superior de mídia

**Commit:** `91c859dd` · **Escopo:** compartilhado

### Cor

`tone: 'gray'` → **`tone: 'purple'`** (`:342`), com
`.tone-purple { --tone: 167, 139, 250 }` (`:1055`) — o mesmo RGB de
`--accent-purple` que o room tile já usa no dot de mídia. **Nenhuma paleta
nova.**

### Contagem

`_mediaModel` contava **entidades**. `_mediaSessions` (`:286`) passa a colapsar
em **sessões físicas**, em quatro passos:

1. endpoints declarados em `BRUNO_TOP_BADGES_MEDIA_ENDPOINTS` (`:18`) viram um
   aparelho — hoje só a TV da Sala (`smart_tv_pro_2` = power/status +
   `android_tv_192_168_3_17` = playback, contrato do checkpoint);
2. o Echo que espelha a reprodução do Spotify é absorvido pela sessão do
   Spotify, decidido pelo **mesmo** `spotify-device.ts` que os room tiles usam
   (`altoFalanteCasa` / `dispositivoDoComodo`) — sem algoritmo paralelo;
3. Echo com conteúdo próprio segue sessão independente;
4. Spotify sem endpoint reconhecível segue uma sessão.

O chip continua agindo sobre **uma** entidade, então `play-pause-media` não
muda de contrato.

> **Para acrescentar um aparelho de dupla entidade no futuro:** acrescente uma
> linha em `BRUNO_TOP_BADGES_MEDIA_ENDPOINTS`. Nada mais muda.

### Não alterado

O comportamento validado dos room tiles.

### O que observar

Spotify no Echo Sala = **1** · Spotify + Echo espelhando = **1** · Echo
independente = **1** · TV com duas entidades = **1** · nenhuma mídia = "All
Off" · cor claramente ativa.

---

## A5 — Anel do ar-condicionado

**Commit:** `95d032fa` · **Escopo:** compartilhado

`raioAnel: 315 → 330` (`:4505`). **Só o arco e o marcador.** A coroa de
marcações segue em `raioMarcacoes = 300` e o container **não** é escalado — a
tentativa anterior com `scale(1.06)` no container deslocava Power/Swing e foi
revertida.

**Clipping conferido pela aritmética do SVG:** viewBox `0 0 720 460`, centro
`(360, 410)`, maior stroke do anel = 18 (`icg-active-glow`), logo o desenho
alcança `330 + 9 = 339`. Em x: `360 ± 339 = 21..699` (21px de folga de cada
lado). Em y: `410 − 339 = 71`. Ambos dentro da caixa.

### Não alterado

Power, Swing, labels, título, menu, controles inferiores, posição do SVG, raio
das marcações.

---

## B1 — Layout interno do Hub no tablet

**Commit:** `b9634889` · **Escopo:** tablet · `:1383`

O tablet mantinha a composição antiga: `.mh-left` como coluna flex confinada à
esquerda, com os controles empilhados dentro dela — a largura sob a arte ficava
sem uso.

O **conceito** do telefone veio para cá: `.mh-left` passa a `display: contents`,
então `info`, `controls` e `art` viram filhos diretos do grid.

```
info     | art
controls | art
```

**Nenhuma medida do telefone foi copiada.** Colunas, gaps e paddings continuam
os do tablet, vindos de `subview-styles.generated.ts` (arquivo **gerado**, não
editado). Só mudaram as *áreas*. O acordeão não foi tocado.

A regra vive em `@media (min-width: 801px)` — telefone intocado.

---

## B2 — Atalhos em uma fileira no tablet

**Commit:** `b9634889` · **Escopo:** tablet · `:1379`

`.mh-btn-row-5` só tinha regra escopada a `office` e `cozinha`. Na Sala caía no
`.mh-btn-row` genérico (grid de uma coluna) e os atalhos empilhavam
verticalmente.

Regra nova, genérica, dentro de `@media (min-width: 801px)`:

```css
.mh-btn-row-5 { grid-template-columns: repeat(4, minmax(0, 1fr)) clamp(32.76px, 2.31cqi, 54.6px); }
```

Resultado: **Netflix | Prime | Disney | Max | Voltar** numa linha. O telefone já
tem override próprio em `subview-phone.styles.ts` e não é afetado.

---

## B3 — Iluminação expandida ao entrar

**Commit:** `0040140c` · **Escopo:** tablet · `:553`

As subviews não-Home são **desconectadas ao sair e reconectadas ao voltar**,
então `connectedCallback` já tem exatamente a semântica pedida:

- entra → Iluminação aberta;
- pode recolher manualmente durante a visita (nada aqui roda de novo);
- sai e volta → abre de novo.

**Não foi preciso protocolo novo na shell.** `_luzesAssentadas` entra junto —
mesmo par que a folha do telefone usa; sem ele o corpo nasce sem rolagem.

Gate: `if (!this._estaNoTelefone())`. **Mobile inalterado** — lá quem abre
continua sendo a folha.

---

## B4 — Altura das células de iluminação

**Commit:** `8f2af7a1` · **Escopo:** tablet · `:1438`

| | antes | depois |
|---|---|---|
| `.light-cell` `min-height` | `clamp(46.8px, 3.3cqi, 78px)` | `clamp(53.8px, 3.8cqi, 89.7px)` |

Acréscimo proporcional em toda a faixa, então a resposta ao container não muda
de natureza. Regra no `static styles` do componente, dentro de
`@media (min-width: 801px)` — o arquivo **gerado** não foi editado.

### Não alterado

Ícones, textos, switches, gaps, ordem, lógica e o telefone.

---

## B5 — Faixa inferior dos 8 tiles

**STATUS: NÃO ALTERADO. Nenhuma mudança foi feita em B5.**

Tokens do Josh em `bruno-josh.js`:

| token | valor |
|---|---|
| tracks | 8 × `1fr` |
| `bruno-tile-gap` | `0px` |
| `bruno-tile-grid-inset-start` | `8px` |
| `bruno-tile-grid-inset-end` | `12px` |
| `bruno-strip-bleed-start` | `10px` |
| `bruno-strip-bleed-end` | `12px` |

Eliminar **todo** o inset renderia 20px ÷ 8 tiles = **2,5px por tile** (~1,1% de
um tile de ~218px), e colaria o primeiro tile na rail e o último na borda do
viewport. Não há margem segura a tomar.

**Pendente:** observação física no Everex. Só alterar se o olho mostrar margem
real — e nunca com `transform: scale`, mexendo na rail ou na distribuição dos 8
tracks.

---

## B6 — Scrim lateral + hero

**Commit:** `956d530f` · **Escopo:** tablet · `bruno-shell.js:1648`

A vinheta de perímetro (`.backdrop::after`) é igual nas quatro bordas.
Aumentar só o lado esquerdo dela escureceria também a faixa de tiles da Home.

As duas responsabilidades passam a viver num pseudo-elemento próprio,
`.backdrop::before`:

1. **scrim lateral estreito**, ancorado na largura da rail — `0.50` na borda,
   `0.22` em 86px, transparente em 118px. Vale em todas as seções;
2. **scrim do hero, só na Home** (`.backdrop[data-secao="home"]::before`,
   `:1681`) — gradiente vertical `0.40 → 0.20 (44%) → 0 (88%)`, com máscara
   horizontal que o encerra em 62% da largura.

**A garantia de não invadir a faixa é estrutural, não calibrada no olho:** na
Home o pseudo-elemento tem `height: 74vh`, e a faixa de tiles começa em `77vh`
(grid da `section_home_v2`: `48px + calc(77vh − 80px)` + gaps).

Somente gradientes alpha — **nenhum** `backdrop-filter`, **nenhum** backdrop
root novo. `_applyBackdrop` ganhou apenas o atributo `data-secao` (`:715`);
nenhuma lógica de navegação mudou.

---

## B7 — Ícone meteorológico

**Commit:** `ecb394ac` · **Escopo:** tablet · `bruno-hero-card.js:1202`

`23px → 26px` na regra base do hero V2. O telefone tem override próprio de
`20px` dentro de `@media (max-width: 800px)`, que continua vencendo.

> **Atenção ao editar este arquivo:** ele tem **dois** templates com blocos
> `@media (max-width: 800px)` quase iguais. O da Home V2 é o primeiro; o segundo
> atende `variant: mobile` das views V3. Confirme em qual template o seletor
> vive antes de mexer.

### Não alterado

Temperatura, descrição, tipografia, espaçamento global, mobile.

---

## B8 — Agenda / Insights no hero

**Commit:** `048200ab` · **Escopo:** tablet · `bruno-hero-card.js:726`

Regra nova:

| situação | resultado |
|---|---|
| existe evento real | mostra Agenda |
| **não** existe evento | **não** mostra placeholder |
| existe insight | mostra Insight |
| nem Agenda real nem Insight | **`event-stack` não renderiza** |
| Agenda + Insight | filete sutil entre os grupos |

O filete (`:913`, `.event-line.has-separator::before`) usa a linguagem já
existente — `--bruno-liquid-surface-bottom-line`: mais intenso no centro, fade
nas laterais. Desenhado em `::before` para não ocupar faixa nem mudar o gap.

**Mobile inalterado por construção:** lá o CSS já ocultava `.is-empty` e a ordem
visível resultante era exatamente a de agora. `_nextEventModel` e a classe
`.is-empty` permanecem intactos (usados fora do hero V2).

---

## C1 — Cards das seções do Hub no mobile

**Commit:** `7f3206c0` · **Escopo:** mobile · `subview-phone.styles.ts:1697`

Uma decisão anterior integrou o conteúdo na folha zerando material, borda, raio
e sombra de `.mh-source` / `.mh-source.is-open` / `.mh-source-body` — **duas
dessas regras com `!important`**. TV, PC e Spotify ficaram sem hierarquia
externa.

O bloco novo devolve **somente o material**, com os **mesmos tokens**
`--bruno-liquid-band-*` que o tablet já consome. Precisa de `!important` porque
a regra que zera também usa.

| categoria | tocado? |
|---|---|
| grid, arte à direita, play/pause circular, volume, controles, acordeão, lógica | **não** |
| gap entre as fontes | 0 → **6px** |
| respiro no rodapé do corpo | → **8px** |
| filetes de separação | desligados (cada card tem borda própria; ficaria linha dupla) |

### Reverter só C1

Remover o bloco marcado `C1`; as regras que zeram o material continuam acima,
intactas, e voltam a valer sozinhas.

---

## C2 — Microdeslocamento ao abrir Iluminação/AC

**Commit:** `7ff42517` · **Escopo:** mobile · `subview-phone.styles.ts:839`

### A medição que decidiu

Banco: `scripts/harness/gen-shell-harness.mjs`, 428×926, tema **Josh** forçado,
animações neutralizadas (a aba oculta não progride transições).

**ANTES:**

| linha | câmera topo | **câmera altura** | resumo topo | scrollTop |
|---|---|---|---|---|
| luzes | 0 | **+1,00** | +1,00 | 0 |
| midia | 0 | 0 | 0 | 0 |
| ac | 0 | **+1,00** | +1,00 | 0 |

Mídia zerada **prova** que `_capturarBaseFolha`/`_restaurarBaseFolha` funciona:
não era lifecycle nem ancoragem. Descendo um nível: o crescimento estava no
primeiro row do grid da câmera (48,3125 → 49,3125px), e a propriedade que mudou
foi `border-bottom-width: 0px → 1px` em `.mh-head.cameras-head`.

### Causa

A regra do filete usava `.mh-head` **puro**. O cabeçalho da câmera também tem
essa classe, então ganhava a borda sempre que qualquer folha abria. A folha de
**mídia** não sofria porque a regra de `[data-folha='midia']` mais abaixo zera
essa borda; luzes e ac não tinham equivalente.

> **Mesma família do defeito de 2026-08-15**, quando `.camera-settings-button`
> foi capturado por uma regra não escopada do Hub. Vale como padrão: no
> telefone, seletores de classe compartilhada dentro de `[data-folha]` alcançam
> o cabeçalho da câmera.

### Correção

`:not(.cameras-head)` no seletor do filete — ele deixa de alcançar um cabeçalho
que nunca foi seu alvo. **Nenhuma compensação visual arbitrária.**

**DEPOIS:** 0 em `cameraTop`, `cameraH`, `headH`, `resumoTop` e `scrollTop` nas
**três** folhas; a borda do cabeçalho da câmera fica em `0px` sempre.

**Instrumentação:** toda no console do banco. Nenhum `console.log`, dataset,
overlay ou estilo de diagnóstico entrou em arquivo.

---

## C3 — Paginação dos cômodos na Home

**Commit:** `f646de3e` · **Escopo:** mobile · `bruno-home-phone.ts:386`

O aviso de cômodos ativos fora da página (16px) só era **criado** quando havia
ativos. Como a linha do grid é automática e `.indicadores` garantia apenas
`min-height: 12px`, entrar/sair o aviso mudava a altura total e Favoritos
descia/subia a cada swipe.

| | antes | depois |
|---|---|---|
| slot do aviso | criado só quando `fora > 0` | **existe sempre** |
| `.indicadores` `min-height` | `12px` | **`16px`** (a altura do próprio aviso) |
| estado vazio | elemento ausente | `visibility: hidden` (`:813`) |

`visibility`, não `display: none`: `display: none` devolveria a largura ao flex e
mexeria na centralização dos dots.

---

## Achado fora do escopo — NÃO ALTERADO

`dashboard-src/scripts/deploy.mjs` (~linha 80) falha com `EPERM` ao copiar
`config/www/dashboard/chunks`: trata o diretório como arquivo.

**Impacto:** `npm run deploy:everex` não conclui.
**Contorno usado:** sincronização com a **mesma semântica** do script (dist
recursivo + os 8 EXTRAS), conferida por SHA-256.
**Não corrigido** por estar fora do escopo autorizado.

---

## Rollback

Cada item tem commit próprio e marcador `ANTERIOR (rollback ...)` no código.
`git revert` **não basta** enquanto o Everex consome bundle gerado. Rollback
completo de um item:

1. `git revert <sha>` na branch local;
2. em `dashboard-src/`: `npx vite build && npm run manifesto && npm run compress`;
3. voltar o ponteiro em `config/configuration.yaml` (o anterior está comentado
   ao lado);
4. recopiar `config/www/dashboard/` + `configuration.yaml` (+ EXTRAS se o item
   tocou um deles) para o Everex;
5. reiniciar o HA e confirmar que o comportamento anterior voltou.

### Mapa item → arquivos → o que rebuildar

| Item | Arquivos | Precisa rebuild? | EXTRAS a recopiar |
|---|---|---|---|
| A1 | `bruno-room-subview.ts`, `bruno-top-badges-card.js` | sim | `bruno-top-badges-card.js` |
| A2, A3, A5, B1, B2, B3, B4 | `bruno-room-subview.ts` | sim | — |
| A4 | `bruno-top-badges-card.js` | sim | `bruno-top-badges-card.js` |
| B6 | `bruno-shell.js` | sim | `bruno-shell.js` |
| B7, B8 | `bruno-hero-card.js` | sim | `bruno-hero-card.js` |
| C1, C2 | `subview-phone.styles.ts` | sim | — |
| C3 | `bruno-home-phone.ts` | sim | — |

> Os arquivos legados em `config/www/bruno-ui/` são **consolidados no bundle** —
> `extra_module_url` tem **um único módulo ativo**. Eles vão aos EXTRAS só para
> manter repo e Everex idênticos.

---

## Validação automática executada

`check:yaml` (nenhum erro) · detector de crase nos fontes alterados (limpo) ·
`tsc --noEmit` · `eslint src` · **277 testes Vitest** · `vite build` ·
`manifesto` · `compress` — aprovados nos três blocos.

`materialize:remote` (parte de `npm run build`) exige Python, ausente nesta
máquina. Verificado que é **no-op**: o marcador `TV_REMOTE_PREMIUM_RUNTIME:
round6` já está na fonte e o script sai imediatamente. As demais etapas do gate
rodaram diretamente.

## Invariante reforçada nesta rodada

**Crase em comentário dentro de template literal** derrubou a compilação
**duas vezes** aqui, ambas em comentário CSS que eu mesmo escrevi. O detector
`node scripts/validation/check-backtick.mjs --tudo` pega — rode-o **antes** do
`tsc`, não depois.

---

# CORREÇÕES PÓS-VALIDAÇÃO FÍSICA (2026-08-23, mesma data)

Rodada de correção dos oito itens reprovados na validação física. Bundle
**`bruno-dashboard.Cqr-1HMb.js`**. Remoto intacto.

| Item | Causa real | Diagnóstico anterior | Commit |
|---|---|---|---|
| 1 | retenção em estado de INSTÂNCIA + dois donos do número | corrigido | `0240be00` |
| 2 | `+/-` perdidos na migração da Fase 5c (CSS existe, markup não) | confirmado | `10c8b496` |
| 3 | Echo em `standby` nunca entrava na lista de ativos | corrigido | `f7e35e1e` |
| 4 | perdi por ESPECIFICIDADE: `.mh-source.is-open` é (0,2,0) | confirmado | `681671ad` |
| 5 | `_loadEvents` descarta evento iniciado há >1h | corrigido | `0d1d7198` |
| 6 | **não reproduzido** — B1 removido por risco | não confirmado | `b31b0335` |
| 7 | `::before` pinta ATRÁS das `.backdrop-layer` | confirmado | `f17ce2cf` |
| 8 | mecanismo existe; a 2ª sessão só aparecia ao deslizar | corrigido | `b314982e` |

## Item 6 — o que foi medido, e por que mesmo assim reverti

Banco da shell, 1920×1200, tema Josh, material carregado:

- acordeão alterna (TV → Spotify → TV), estado correto a cada passo;
- `.mh-source-head`, "Ligar TV", Pausar, Controle remoto e Apps **todos
  alcançáveis** por `elementsFromPoint` — nenhum overlay invisível;
- **zero exceções** de render (`console.error`, `window.error` e
  `unhandledrejection` capturados durante as interações);
- B1 aplicado de fato (`mh-left` com `display: contents`, `mh-info` na área);
- sem sobreposição entre a Iluminação aberta por B3 e o Hub;
- Everex íntegro: 28/28 arquivos, nenhum hash divergente, todos os chunks
  referenciados presentes.

Não há evidência de que B1 fosse a causa. Ele saiu porque foi a **única**
mudança estrutural feita no Hub do tablet, e `display:contents` tem histórico de
falha de hit-testing em WebView Android — justamente a diferença entre o
navegador do banco e o aparelho. O bloco ficou **íntegro em comentário**, com
instrução de reativação. B2 e B4 permanecem.

> **Se o Hub continuar quebrado depois desta rodada**, a causa é outra e o
> banco não a alcança. O que resolveria: abrir o inspetor no tablet e capturar
> (a) erros de console ao tocar no cabeçalho da fonte, (b)
> `document.elementFromPoint` no centro do botão.

## Item 1 — a fonte única

`dashboard-src/src/services/entities/curtain-hold.ts` (novo).

O Stop grava o **percentual visual exibido** + a **leitura bruta** do cover
naquele instante. A retenção vale enquanto a física não mudar; um
`current_position` diferente do gravado é a "evidência física nova" e derruba a
retenção. Ordem nova ou movimento declarado limpam na hora. `localStorage` é o
mesmo mecanismo do histórico da TV — nenhum protocolo novo.

Subview e barra leem e escrevem o mesmo registro.

**Medido** (retenção 90% com físico 12 no Stop):

| físico atual | barra exibe |
|---|---|
| 12 (igual ao do Stop) | **90% fechada** |
| 40 (telemetria nova) | 62% (solta, calibrado da física) |
| 40 (leitura seguinte) | 62% (registro já limpo) |

## Item 4 — medições antes e depois

| | antes | depois |
|---|---|---|
| seção **aberta** | borda 0px · raio 0px | **1px · 16px · sombra** |
| seção fechada | 1px · 16px · sem sombra | **1px · 16px · sombra** |
| folga da última ao filete | 3,6px | **14px** |
| altura da folha | 336px | 348px |

## Achado fora do escopo — NÃO ALTERADO

Já registrado acima: `dashboard-src/scripts/deploy.mjs` falha com `EPERM` em
`config/www/dashboard/chunks`. Segue sem correção.

## Rollback

Um commit por item. Rollback completo exige `git revert` + `vite build` +
`manifesto` + `compress` + voltar o ponteiro (`DB1sivd6`, comentado ao lado) +
ressincronizar `config/www/dashboard/` para o Everex.

---

# HOME MOBILE — PRIMEIRO QUADRO ESTÁVEL (2026-08-25)

## Sintoma e causa confirmada

No iPhone 428x926, o bloco estático da Home nascia aproximadamente 101 px mais
baixo/curto e se corrigia alguns segundos depois. O estado final já estava
correto; a regressão existia somente no primeiro quadro.

A causa era a combinação de duas geometrias aplicadas em momentos diferentes:

1. `bruno-hero-card.js` entregava o primeiro quadro mobile com
   `.hero-stage.is-v2` em `height/min-height: 182px`;
2. `home-mobile-hero-rail.js` injetava posteriormente um patch que trocava essa
   altura por `auto` e também aplicava a composição compacta final;
3. `bruno-home-phone` media a altura útil enquanto o Hero ainda estava alto.

O piso `min-content` introduzido na tentativa anterior não corrigia a origem.
Ele media cerca de 567 px contra 679 px naturais e transferia a compressão para
as linhas automáticas: Cozinha/Lavabo encolhiam e surgia o vão abaixo de
Favoritos.

## Correção aplicada

- A geometria compacta final do Hero passou a existir no CSS nativo do próprio
  card, dentro de `@media (max-width: 800px)`. Assim, o primeiro quadro e o
  quadro assentado usam a mesma altura.
- A chamada tardia que injetava a geometria do Hero foi desativada. A função
  antiga permanece inteira no arquivo para rollback; o patch de rail continua
  ativo e independente.
- A linha estática voltou a `minmax(0, 1fr)` e o `min-height: min-content`
  regressivo ficou preservado em comentário.
- O cálculo da altura útil e a correção já validada que prende a shell à
  viewport do telefone não foram alterados.

## Arquivos

- `config/www/bruno-ui/cards/bruno-hero-card.js`
- `config/www/bruno-ui/patches/home-mobile-hero-rail.js`
- `dashboard-src/src/components/home/bruno-home-phone.ts`
- `config/configuration.yaml`
- `config/www/dashboard/` completo, incluindo `chunks/`

## Escopo e validação

- Escopo visual: somente telefone, breakpoint `max-width: 800px`.
- Banco Home em 428x926: altura útil 679 px, Hero 118,6 px, pager 352 px,
  Favoritos 248,8 px, folga final de 6 px e nenhum scroll no slot estático.
- Banco da shell em 1920x1200, tema Josh: `aprovado: true`, rail com oito itens,
  duas colunas lado a lado e nenhum elemento mobile visível.
- Gates: TypeScript, ESLint, 17 arquivos/277 testes Vitest, Vite, manifesto,
  compressão, YAML e detector de crases nos três fontes alterados aprovados.
- Bundle: `bruno-dashboard.hpd0Vfwq.js`; main chunk:
  `chunks/main.Da31I_xT.js`.
- Publicação Everex: 28 arquivos do runtime mais `configuration.yaml` e os dois
  módulos clássicos, 31/31 SHA-256 idênticos. O validador encontrou os sete
  módulos alcançáveis e nenhum chunk ausente. O reinício do HA ficou pendente
  porque a sessão de navegador disponível abriu na tela de login.

## Rollback desta rodada

- Código anterior preservado nos próprios arquivos com marcadores
  `ANTERIOR (rollback 2026-08-25)`.
- Ponteiro anterior preservado em `configuration.yaml`:
  `bruno-dashboard.B7kOYusv.js`.
- Snapshot integral pré-publicação:
  `tmp/everex-preflight-20260825-home-phone-first-paint/`.
- Não houve commit, push, PR ou merge nesta rodada.
