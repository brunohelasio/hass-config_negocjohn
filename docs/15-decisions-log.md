# 15 — Registro de decisões

Decisões com consequência arquitetural. As anteriores a 2026-08-02 foram
reconstruídas a partir do `CLAUDE.md`.

---

**Data:** 2026-06-24
**Decisão:** A shell (`custom:bruno-shell`) passa a ser o painel padrão, assumindo o path `bento-lab`.
**Contexto:** cada seção era uma view do Lovelace; trocar de seção remontava a rail inteira.
**Alternativas:** manter views separadas e aceitar a remontagem.
**Motivo:** view única + `type: panel` + navegação por hash mantém a rail viva.
**Consequências:** `views/main.yaml` e os 39 arquivos de `main-grid/` viraram legado, mas continuam sendo parseados a cada carregamento.
**Arquivos:** `ui-lovelace-main.yaml`, `views/bento_shell.yaml`
**Status:** ✅ vigente

---

**Data:** 2026-06-24
**Decisão:** Remover o bloco `resources:` do `ui-lovelace-main.yaml`.
**Contexto:** os mesmos JS eram declarados ali **e** em `frontend.extra_module_url`.
**Motivo:** o tablet baixava cada módulo duas vezes, dobrando a carga no WebView.
**Consequências:** `extra_module_url` virou o único manifesto de carregamento.
**Status:** ✅ vigente

---

**Data:** 2026-07-03/04
**Decisão:** Molde único de presença/ocupação em três camadas para todos os cômodos.
**Contexto:** 4 lógicas diferentes entre cômodos, 3 sem camada nenhuma; `static` excluído da ocupação e uso de `medium`, valor inexistente no enum do sensor.
**Motivo:** presença precisa ser imediata; ocupação precisa de permanência. São grandezas diferentes e estavam misturadas.
**Consequências:** 7 packages novos/alterados; o ponto lê só `motion_recent`, o texto exige ocupação **e** presença.
**Status:** ✅ vigente

---

**Data:** 2026-07-04
**Decisão:** Remover a trava de contexto (self-latch) da ocupação.
**Contexto:** com o A/C ligado, a ocupação do Q. Miguel ficava presa em ON indefinidamente.
**Alternativas:** ajustar os tempos da trava.
**Motivo:** a folga do `delay_off` já cobre microquedas do radar; a trava era redundante e nunca liberava.
**Consequências:** contexto **não** volta como trava de estado. Se necessário, usar como condição em automação.
**Status:** ✅ vigente

---

**Data:** 2026-07-09
**Decisão:** Estender a própria shell ao celular (media query), em vez de manter um mundo móvel paralelo.
**Contexto:** três gerações de interface móvel (V1, V2, V3), todas com defeitos estruturais — a barra do V2 nunca foi conectada a view alguma; o V3 navegava para um slug especulativo.
**Motivo:** um único modelo de interação.
**Consequências:** as 5 views do V3 continuam incluídas como fallback e ainda são parseadas sem servir para nada.
**Status:** ✅ vigente — aposentar as views V1/V2/V3 na Fase 3

---

**Data:** 2026-08-02
**Decisão:** Ancorar a tag `pre-dashboard-architecture` no commit `e0dc9da3` em vez de criar um commit de checkpoint.
**Contexto:** durante a Fase 0, apareceu um commit de 179 arquivos ("Atualização") entre duas chamadas de ferramenta. Depois confirmado: era o usuário pelo GitHub Desktop.
**Motivo:** o conteúdo era equivalente ao checkpoint pretendido; um segundo commit seria redundante.
**Status:** ✅ concluída

---

**Data:** 2026-08-02
**Decisão:** Remover o dashboard `homekitesq-teste`.
**Contexto:** registrado em `configuration.yaml` apontando para `lovelace-homekitesq.yaml`, inexistente no repositório e no histórico do Git.
**Motivo:** base "sagaland" que não evoluiu; aparecia quebrada no sidebar.
**Consequências:** 6 linhas comentadas in-place; exige reinício do HA.
**Status:** ✅ concluída

---

**Data:** 2026-08-02
**Decisão:** Instalar Node.js 24.18.1 LTS.
**Contexto:** a arquitetura de destino exige Node, ausente na máquina.
**Consequências:** desbloqueou a Fase 4 e, de imediato, deu ao projeto a primeira checagem sintática (`node --check`, 55/55 OK) — o detector correto para o erro da crase, que já derrubou o dashboard 4 vezes.
**Status:** ✅ concluída

---

**Data:** 2026-08-02
**Decisão:** **Não** adotar Zod.
**Contexto:** constava da proposta original de stack.
**Alternativas:** Zod para validar a configuração de cômodos e entidades.
**Motivo:** a configuração é estática e autoral — TypeScript já a cobre em tempo de build. E Zod **não resolve o defeito real**: valida o formato (`"light.x"` é texto?), não a existência da entidade no HA, que é a falha que de fato ocorre quando algo é renomeado. São ~13 KB num orçamento de ~253 MB de RAM disputada.
**Consequências:** no lugar, verificação de existência de entidades em `hass.states` na camada de diagnóstico, apontando componente e cômodo afetados.
**Status:** ✅ decidida

---

**Data:** 2026-08-02
**Decisão:** Adiar Playwright para a Fase 7.
**Contexto:** constava da fundação técnica (Fase 4).
**Motivo:** Playwright roda Chromium no computador. Tudo o que quebra neste projeto quebra no **tablet** — memória do WebView, autoplay, vibração, cache. Testes verdes no desktop criariam confiança falsa.
**Consequências:** Vitest fica, focado em funções puras (lógica de presença, tempo decorrido, contagem de luzes, seletores). Playwright entra depois, só para regressão de layout.
**Status:** ✅ decidida

---

**Data:** 2026-08-02
**Decisão:** O build precisa publicar direto no `/config` do HA (`npm run deploy`).
**Contexto:** o fluxo atual é editar → copiar por Samba → commitar.
**Motivo:** sem isso, a Fase 4 acrescenta uma etapa de build **e** mantém a cópia manual — a arquitetura nova deixaria o dia a dia pior que hoje.
**Status:** 🔜 Fase 4

---

**Data:** 2026-08-02
**Decisão:** Independência de resolução vira **critério de aceitação da arquitetura**.
**Contexto:** o usuário relatou que trocar o Galaxy Tab S6 Lite (2000×1200) pelo Redmi Pad 2 (2560×1600) desorganizou o dashboard, e só normalizou alterando a resolução do tablet. Medido: 6.210 px fixos, 157 media queries com 6 breakpoints, zero container queries.
**Alternativas:** somar mais breakpoints por aparelho.
**Motivo:** breakpoints se multiplicam por aparelho **e** pelos 6 arquivos de subview duplicados. Não escala.
**Consequências:** a Fase 4 passa a incluir tokens de escala fluida — sem isso os px fixos atravessam a migração para dentro do TypeScript. Todo componente migrado nasce com container query e precisa funcionar de 600 a 2000 px sem breakpoint próprio.
**Status:** ✅ decidida — ver `07`

---

**Data:** 2026-08-02
**Decisão:** Adotar container queries como mecanismo primário.
**Contexto:** WebView do tablet confirmada em **150.0.7871.181** (Chrome 150), Android 15.
**Motivo:** container queries entraram no Chrome 105 — 45 versões abaixo. Nenhum fallback legado necessário.
**Consequências:** também liberados `cqw/cqi/cqh`, `:has()`, `dvh/svh/lvh`, subgrid, `@property`.
**Status:** ✅ decidida

---

**Data:** 2026-08-02
**Decisão:** Redimensionar os assets de cômodo para 384 px (768 px para a TV).
**Contexto:** PNGs de até 1254×1254 exibidos a no máximo 120×116 px; 64,3 MB de bitmap decodificado contra ~253 MB de RAM disponível ao app.
**Motivo:** mais de um quarto do orçamento de memória gasto em resolução invisível.
**Consequências:** 64,3 → 9,6 MB. **14 assets não foram tocados** — só aparecem em comentários de rollback; vão para `_archive` na Fase 3. Exigiu cache-bust em cascata (34 URLs + 14 recursos).
**Status:** ✅ concluída — qualidade aprovada no tablet

---

**Data:** 2026-08-02
**Decisão:** Limpar a VM renomeando, não apagando.
**Contexto:** `.git` adormecido (65 MB, um commit de 2026-04-10, branch `sync-config-local` nunca usada) e `Hemma-main` (6 MB, projeto de referência) dentro do `/config`, entrando em todo backup.
**Motivo:** renomear é reversível em um comando; apagar não.
**Consequências:** 71 MB fora dos backups. **Excluir a partir de 2026-08-09** se nada quebrar.
**Status:** ⏳ em observação até 2026-08-09

---

**Data:** 2026-08-10
**Decisão:** ampliar de 10 s para 30 s o prazo de negociação do player WebRTC embutido nas subviews de cômodos, subview de câmeras e card dinâmico da Home.
**Contexto:** o diagnóstico do build `bruno-dashboard.ZlG6UJRv.js` registrou cinco de cinco tentativas encerradas pelo marcador `player webrtc · prazo`, todas entre 10.000,9 e 10.008,7 ms. O `more-info`, que não usa esse prazo customizado, atravessa a pausa inicial e permanece em tempo real.
**Motivo:** o limite local abortava a negociação antes de o fluxo ONVIF/WebRTC conseguir assumir e devolvia a interface ao motor de snapshots, produzindo a falsa aparência de atualização ao vivo a cada ~10 s.
**Consequências:** build `bruno-dashboard.Cvth7Jgi.js` e recursos clássicos com cache-bust publicados localmente e na VM; o snapshot permanece visível durante a negociação; fallback continua após 30 s; a validação funcional exige reinício do HA, recarga forçada e diagnóstico que identifique o novo build.
**Rollback:** URLs anteriores comentadas in-place, bundle `ZlG6UJRv` preservado e cópia local em `tmp/rollback-20260810-camera-webrtc-timeout/`.
**Status:** 🧪 publicada, aguardando validação no runtime do tablet

---

**Data:** 2026-08-10
**Decisão:** aguardar o primeiro `updateComplete` do `ha-web-rtc-player` antes de atribuir `entityid`, nas três superfícies Bruno.
**Contexto:** o build `Cvth7Jgi` repetiu a falha do Office exatamente em 30.000,6 ms, sem emitir primeiro quadro, `streams` sem vídeo ou erro. O player oficial consome `apiContext` e `connectionContext` no ciclo Lit e só chama `_startWebRtc()` quando `entityid` muda.
**Motivo:** anexar o elemento e atribuir `entityid` imediatamente ainda permitia que `_startWebRtc()` executasse antes dos contextos; nesse caso ele retorna e não repete a tentativa quando os contextos chegam.
**Consequências:** a negociação e seu prazo agora começam depois de `updateComplete`; build `bruno-dashboard.tdYjE8QO.js` e cache-bust `20260810-webrtc-lit-context-1` publicados localmente e na VM, com sete pares de hashes idênticos.
**Rollback:** build `Cvth7Jgi` preservado na VM e URLs anteriores comentadas em `configuration.yaml`.
**Status:** 🧪 publicada, aguardando confirmação de primeiro quadro no runtime

---

**Data:** 2026-08-10
**Decisão:** manter WebRTC direto, mas carregar deterministicamente seu módulo pelo caminho oficial do Lovelace; substituir suspensão permanente por estado com retomada no `dialog-closed`; colocar quadros verdes em quarentena.
**Contexto:** no PC frio o build `tdYjE8QO` não registrou nenhuma tentativa de player e ficou em snapshots; no tablet persistente houve primeiros quadros WebRTC, mas fechar More Info suspendia a tile até sair da subview. Imagens verdes disparavam `load` e eram promovidas como sucesso.
**Alternativas:** voltar a `hui-image`/HLS; instalar outra pilha go2rtc; manter o comportamento; abrir todos os streams simultaneamente.
**Motivo:** o tablet provou que ONVIF/WebRTC funciona. A falha é de lazy-load, ciclo de vida e validação de quadro; substituir a pilha agora acrescentaria custo e não atacaria a causa medida.
**Consequências:** estado explícito nas três superfícies; retomada 700 ms após fechar More Info; somente uma câmera principal ao vivo; instantâneo preservado até quadro válido; telemetria de lazy-load/handoff/verde; build `bruno-dashboard.BY5H2fqa.js`.
**Rollback:** reativar bundle `tdYjE8QO` e cache-bust `20260810-webrtc-lit-context-1`, depois reiniciar o HA.
**Arquivos afetados:** ver `docs/25-camera-streaming-webrtc.md`.
**Status:** publicada localmente e na VM com sete hashes idênticos; reinício do HA e aceite visual no tablet pendentes.

---

**Data:** 2026-08-12
**Decisão:** manter uma única ordem compartilhada `Sala → Cozinha → Office`,
sem duplicar a configuração da rail, mas curar somente a apresentação phone.
**Contexto:** no tablet devem permanecer Home, os seis cômodos e Power; no
telefone devem aparecer apenas Home, Sala, Cozinha, Office e Quartos.
**Motivo:** a ordem compartilhada foi aceita pelo usuário; o requisito crítico
é preservar os oito destinos do tablet e reduzir o dock do telefone.
**Consequências:** os três quartos usam `hide_on_phone` e alimentam o grupo
explícito `phone_more`; Power fica oculto no telefone, mas não entra em Quartos.
O CSS visual, os bottom sheets e o empilhamento da rail permanecem confinados a
`max-width: 800px`.
**Status:** implementada, validada no harness e publicada localmente e na VM;
reinício do Home Assistant e aceite nos aparelhos reais pendentes.

---

**Data:** 2026-08-14
**Decisão:** consolidar numa única rodada os remanescentes mobile/tablet e
publicar exclusivamente no Everex, preservando o streaming ONVIF atual.
**Contexto:** havia erros de schema nos serviços do Hub, regressão do percentual
dinâmico da cortina, arte pausada sem blur, metadados de Spotify atrasados,
anel de A/C aumentado pela caixa externa, escala-base pequena no tablet e
divergências de assets/status/Josh no telefone.
**Implementação:**

- `target` das ações de mídia passou a receber somente `entity_id`; volume,
  atraso e ativação do dispositivo permanecem em service data;
- a cortina voltou a usar percentual fechado (`0 = aberta`, `100 = fechada`),
  interpolação calibrada e estimativa progressiva com reancoragem quando o HA
  publica uma posição real;
- artwork pausada do Hub mantém a última capa válida com o mesmo blur da Home;
- a observação do Spotify considera também atributos de metadata, capa,
  progresso, volume e dispositivo, permitindo atualização imediata;
- o aumento do A/C ficou restrito ao raio interno `285 → 300`; o scale externo
  foi removido, restaurando a margem direita e preservando Power/Swing;
- no tablet, micromaquetes, métricas e dots receberam aumento fluido aproximado
  de 6%, exclusivamente acima de 800 px;
- no telefone, as mesmas micromaquetes V2 já aprovadas foram ampliadas sem tocar
  o tablet; Sala foi equalizada à escala aparente dos demais cômodos;
- status móveis passaram a reconhecer sessão destravada do PC e Spotify no
  dispositivo do cômodo; a altura mínima calculada para quatro dots ficou em
  172 px, mantida também na Sala para preservar uniformidade;
- o tema Josh ganhou dots flat no telefone sem alterar os demais temas;
- a compensação de scroll das folhas passou a ancorar na câmera, eliminando o
  deslocamento observado em Office e Quartos.

**Câmeras:** mantido `ha-web-rtc-player`, uma única câmera principal ao vivo e
PIP em snapshot. A investigação não encontrou correção frontend de baixo risco
para quadros verdes não uniformes; substituir por nova pilha go2rtc/HLS poderia
regredir o streaming em tempo real já aprovado.
**Persistência pausada:** confirmada como intencional no Hub; o card dinâmico da
Home possui janela própria de permanência, enquanto a subview conserva contexto
para retomada.
**Validação:** TypeScript, ESLint, 210 testes Vitest, sintaxe dos sete cards,
248 YAMLs, 112 arquivos no detector de crases e `git diff --check` aprovados.
**Publicação:** bundle `bruno-dashboard.DLc4aRtS.js`, sete cards clássicos, dois
YAMLs, manifesto e configuração publicados em `\\192.168.3.154\config`; 13
pares local × Everex confirmados por SHA-256. Rollback local em
`tmp/everex-preflight-20260814-remanescentes-1/`.
**Ainda não concluído/publicado no runtime:** reinício do Home Assistant e aceite
visual/funcional nos aparelhos reais; nenhuma alteração adicional para o verde
ONVIF foi publicada.
**Status:** arquivos publicados no Everex; ativação do novo módulo e aceite em
tablet/mobile pendentes.

---

**Data:** 2026-08-15
**Decisão:** executar em uma única rodada os ajustes estruturais de cortina,
anel de A/C, uniformidade dos status e estabilidade dos bottom sheets, deixando
expressamente fora do escopo qualquer alteração no pipeline das câmeras ou no
tratamento de quadros verdes.
**Contexto:** o diagnóstico identificou quatro causas independentes: o helper da
cortina publicava o alvo antes de o cover concluir o movimento; o aumento anterior
do A/C incidia na caixa externa; as subviews possuíam métricas de status diferentes
da Home; e a Sala conservava um piso interno do Hub que não era compartilhado por
Office e Quartos. A tentativa anterior de ancoragem também media a câmera depois da
mutação do estado, quando o deslocamento já havia ocorrido.
**Implementação:**

- a cortina usa primeiro a telemetria física de `current_position`; o helper fica
  como alvo comandado, com estimador progressivo, reancoragem em leituras reais,
  tolerância de confirmação e retenção breve ao interromper o movimento;
- somente os arcos e o marcador central do A/C passaram de raio 300 para 315;
  caixa, ticks, labels, Power, Swing e a largura aprovada
  `min(210px, 82%)` permaneceram inalterados;
- no tablet, Home e subviews passam a compartilhar faixa de 48 px, badges de
  46 px, ícones de 22/18 px e tipografia 10/11 px; a rail preserva todos os oito
  destinos e apenas seu padding superior muda para alinhar Home à primeira tile;
- no telefone foi adotado o plano B: a caixa no fluxo continua com 36,31 px,
  enquanto a faixa visual interna mede 48 px e ocupa os gaps já existentes. A
  câmera, os tiles, os bottom sheets e a rail de 58,4 px não mudam de posição;
- Sala, Office, Q. Casal, Q. Marina e Q. Miguel passam a compartilhar o mesmo
  piso interno do Hub. A âncora é capturada antes da abertura/fechamento e
  restaurada depois de `updateComplete` e dois frames; a shell desativa a
  ancoragem automática concorrente no slot rolável.

**Validação geométrica:** em 428 x 926, os cinco Hubs mediram 330,3 px, com
corpo ativo de 172 px; o deslocamento da câmera foi 0 px ao abrir e 0 px ao
fechar. Sala e Q. Miguel mantiveram a folha de iluminação em 505,4 px sem scroll
ou clipping. A faixa visual interna mediu 48 px, mas a câmera continuou em
`top = 56,31 px`. Em 1920 x 1200, as subviews mantiveram duas colunas, oito
destinos e DOM mobile oculto; a diferença entre os centros de Home e da primeira
badge foi 0,02 px.
**Validação automatizada:** TypeScript, ESLint, 210 testes Vitest, 248 YAMLs,
108 arquivos no detector de crases, sintaxe dos dois módulos clássicos,
`git diff --check` e harness mobile/tablet aprovados.
**Publicação:** bundle `bruno-dashboard.BJutTx-c.js`, sourcemap, loader,
manifesto, sidebar, shell e configuração publicados exclusivamente no Everex
`\\192.168.3.154\config`; sete pares local x Everex confirmados por SHA-256.
O bundle `DLc4aRtS` foi preservado e o rollback local está em
`tmp/everex-preflight-20260815-structural-round-1/`.
**Câmeras:** nenhum arquivo, configuração ou comportamento do pipeline WebRTC,
ONVIF, snapshot ou quarentena de quadros verdes foi alterado nesta rodada.
**Status:** arquivos publicados no Everex; reinício do Home Assistant e aceite
visual/funcional nos aparelhos reais ainda são necessários.

---

**Data:** 2026-08-15
**Decisão:** eliminar o último degrau visual Home → subview e o deslocamento
Office/Quartos ao abrir o Hub, sem alterar a geometria já aprovada do tablet.
**Diagnóstico medido:**

- no telefone 428 × 926, o plano visual do status da subview começava em
  `y = 4,17 px`, enquanto a faixa da Home começava em `y = 10 px`;
- a Sala mantinha o menu da câmera em `34,31 px`, cabeçalho em `48,31 px` e
  card em `277,25 px` tanto fechado quanto aberto;
- Office e Quartos usavam menu de `23,39 px` e cabeçalho de `44 px` fechados.
  Ao abrir o Hub, o seletor amplo de `.mh-menu` também alcançava o menu da
  câmera e o inflava para a geometria da Sala, criando um reflow de `4,31 px`.

**Implementação local:**

- a faixa da Home recebe `translateY(-5,84px)` somente em
  `max-width: 800px`; a linha continua reservando 48 px, portanto hero, cards e
  rail não se movem;
- o tile Temperatura redistribui apenas o gap/padding internos e conserva 25%
  da largura, altura e tipografia comuns;
- `camera-settings-button` passa a usar a mesma caixa de `34,32 px` da Sala em
  todas as subviews mobile;
- o seletor de tamanho mínimo do Hub foi restringido a
  `.media-hub-card .mh-menu`, deixando de atingir o menu da câmera.

**Validação:** em Sala, Office, Q. Casal e Q. Marina, fechado e aberto mediram
os mesmos `48,31 px` de cabeçalho, `34,31 px` de menu e
`top = 56,31 px` / `bottom = 333,56 px` para a câmera; todos os deltas foram
`0 px`. TypeScript, ESLint, 210 testes Vitest, 248 YAMLs, 108 arquivos no
detector de crases e 54 JS clássicos passaram.
**Build local:** `bruno-dashboard.DpecM3wp.js`; cache-bust preparado:
`bruno-top-badges-card.js?v=20260815-status-position-2`.
**Publicação:** pendente. O Everex não foi modificado nesta etapa porque a
camada de autorização da sessão recusou até a leitura necessária para criar o
backup pré-publicação. Não considerar `DpecM3wp` ativo em produção até nova
publicação coordenada e conferência de hashes.

---

**Data:** 2026-08-16
**Decisão:** compactar exclusivamente a Home do telefone sem reduzir ou
reestruturar os cards de cômodo e sem alterar tablet/desktop.

**Implementação:**

- Hero V2 phone em `160 px`, com relógio e tempo na mesma linha;
- cards preservados em `172 px`;
- indicador semântico transparente de `14 px` entre Q. Casal e Q. Marina;
- ordem estável e por prioridade dos status somente em `max-width: 800px`;
- Q. Marina + Q. Miguel permanecem numa linha integral abaixo do recorte e não
  aparecem parcialmente.

**Proteção do tablet:** nenhuma dimensão base da matriz foi alterada. Em
`801 × 1000`, Hero, indicador e ordem dos status retornam, respectivamente, a
`494 px`, `0 px` e à sequência fixa original.

**Rollback:**
`tmp/everex-preflight-20260816-mobile-home-compacta-1/`; cinco arquivos locais e
cinco arquivos do Everex preservados antes da rodada.

**Cache-bust:** `20260816-mobile-home-compacta-1`.

**Publicação:** pendente. Nenhuma escrita foi feita no Everex porque a camada de
autorização externa atingiu o limite de uso antes da verificação prévia dos
hashes. O estado local está pronto e validado; produção continua inalterada.

---

**Data:** 2026-08-25
**Decisão:** o hold da tile global `Lights` solicita uma sheet sem transferir
inventário, renderização ou controle de overlay para a própria tile.

**Arquitetura:** `bruno-top-badges-card` reconhece tap/hold/arrasto e emite um
evento semântico; `bruno-shell` hospeda a camada e mede a borda real da dock;
`bruno-status-lights-sheet` resolve o inventário a partir de `ROOMS` e observa
somente as entidades necessárias.

**Motivo:** a tile deve preservar sua expansão rápida e permanecer pequena,
enquanto a shell é a única camada que conhece viewport, rail, dock e z-index
globais. A medição da borda da dock é necessária porque o contêiner fixo da
shell pode ter geometria diferente da viewport visual no telefone.

**Contrato:** tablet sem scroll/clipping/paginação, mobile com scroll somente no
corpo, ação global restrita ao conjunto deduplicado conhecido e qualquer
circuito monitorado sem associação explícita exposto em `Sem cômodo`.

**Rollback:** `tmp/rollback-20260825-status-lights-sheet/`.

**Correção rev.2 após validação física:** a primeira implementação usava
`preventDefault` no `pointerdown`, captura explícita do ponteiro e o canal
genérico `ll-custom`. Esse conjunto divergia da arbitragem móvel já validada nos
room cards e o hold não abriu no aparelho. A tile passou a não capturar o
ponteiro, a cancelar por deslocamento, a emitir `bruno-status-lights-open` e a
usar `contextmenu` como fallback do long-press WebKit. O shell conserva o
tratamento anterior de `ll-custom` apenas para compatibilidade. Bundle candidato
rev.2: `bruno-dashboard.Cs0ZDrkD.js`; main chunk:
`chunks/main.CnYAbPol.js`.

**Publicação:** concluída no Everex em 2026-08-25, com `configuration.yaml`
copiado por último. Os 31 arquivos do payload tiveram SHA-256 local e remoto
idênticos; os sete módulos alcançáveis estão presentes e o bundle anterior
`bruno-dashboard.B_IHs_CU.js` foi preservado. Backup pré-publicação:
`tmp/everex-preflight-20260825-status-lights-hold-rev2/`. Reinício e aceite
físico continuam pendentes.

---

**Data:** 2026-08-26
**Decisão:** a sheet global de iluminação no mobile deve usar o mesmo contrato
de composição das folhas das subviews: o material segue até a borda inferior,
a rail apenas se sobrepõe de forma transparente e o scroll reserva a altura real
da dock.

**Motivo:** encerrar a sheet no topo da rail criava duas superfícies com tokens
visualmente diferentes e uma divisão marcada. A composição já validada nas
subviews elimina essa emenda sem duplicar os tokens na rail.

**Escopo:** nenhum gap, filete, posição de elemento, `ROOMS`, grupo do Home
Assistant, card ou subview foi alterado. A sheet exclui localmente somente
`light.quarto_casal_2_switch_1` e `light.quarto_casal_switch_3`, confirmados fora
de uso, inclusive do caminho de órfãos. O Q. Casal passa a seis controles.

**Geometria:** controles com 46 px no mobile e 38 px no tablet. Em 390 x 844 a
sheet começa em 185,7 px, não invade o Hero e cobre a rail; em 1280 x 720 o
tablet permanece com overflow vertical zero.

**Publicação:** `bruno-dashboard.DNHrEkaP.js` ativo no Everex em 2026-08-26;
30/30 hashes idênticos e sete módulos alcançáveis presentes. O bundle anterior
`bruno-dashboard.Cs0ZDrkD.js` foi preservado. Rollback local:
`tmp/rollback-20260826-status-lights-sheet-microadjust/`; backup pré-publicação:
`tmp/everex-preflight-20260826-status-lights-sheet-microadjust/`. Sem reinício,
commit, push, PR ou merge.

---

**Data:** 2026-08-26
**Decisão:** reduzir a side sheet de iluminação do tablet para 60% e elevar seus
controles para 42 px, usando a folga vertical observada sem alterar gaps ou
provocar scroll.

**Rail mobile:** a continuidade cromática da revisão anterior permanece. Como
esta sheet exige scroll, somente durante `tem-status-lights` a rail recebe um
véu preto neutro de 16% e blur de 16 px; isso separa os controles em movimento
dos botões da dock sem restaurar a superfície independente antiga.

**Altura mobile:** acréscimo limitado a 5 px. Em 390 x 844 o painel começa em
180,7 px e conserva 62,7 px de distância para o headline do Hero.

**Validação:** overflow vertical e horizontal zero no tablet em 1024 x 768,
1280 x 720 e 1363 x 742. Bundle `bruno-dashboard.B7LHAT4p.js` publicado no
Everex com 30/30 hashes e sete módulos alcançáveis; anterior
`bruno-dashboard.DNHrEkaP.js` preservado. Rollback:
`tmp/rollback-20260826-status-lights-sheet-microadjust-rev2/`; backup remoto:
`tmp/everex-preflight-20260826-status-lights-sheet-microadjust-rev2/`. Sem
reinício, commit, push, PR ou merge.

---

**Data:** 2026-08-30
**Decisão:** consolidar a implementação validada da sheet de iluminação sobre a
última base de `origin/main` e publicar exatamente o mesmo payload compilado no
Everex.

**Segurança:** caches `.pnpm-store`, configuração local `.claude` e snapshots
`tmp/` ficam fora do versionamento e do payload. O rebuild canônico
`bruno-dashboard.Dq2NEBNk.js` difere do B7 apenas pelo identificador diagnóstico
de data e pelos hashes derivados de main/room chunk.

**Validação:** Everex com 31/31 hashes idênticos ao local e sete módulos
alcançáveis; `configuration.yaml` copiado por último e B7 preservado. Rollback:
`tmp/rollback-20260830-three-way-sync/`; backup remoto:
`tmp/everex-preflight-20260830-three-way-sync/`. Home Assistant sem reinício.

---

**Data:** 2026-09-01
**Decisão:** retirar exclusivamente a tile visual do Corredor da Home tablet e
redistribuir toda a faixa entre as sete room tiles principais.

**Motivo:** aumentar presença, área tátil e legibilidade da série homogênea sem
inserir controles compensatórios. A perda do tap direto do Corredor no tablet é
aceita conscientemente; o acesso permanece no hold de `Lights` e na side sheet
global de Iluminação.

**Contrato:** `ROOMS`, `light.corredor_switch_1`, presença, automações e
inventário permanecem. Mobile, subviews, gestos e componentes fora do modo
tablet tile têm delta zero. A linha interna cresce 8/7, o Hero financia o delta
e o fechamento vertical permanece exato.

**Validação:** 19 arquivos/288 testes, TypeScript, ESLint, 250 YAMLs, 200 JS,
Vite/91 módulos, compressão e grafo local aprovados. Harness 1280 x 720 com
7/7 tiles, sem overflow; mobile 428 x 926 idêntico à baseline; hold de 620 ms
em `Lights` preservado com o Corredor monitorado.

**Operação:** bundle `bruno-dashboard.DhYtGiF6.js` publicado no Everex após
autorização explícita, com 32/32 hashes idênticos e sete módulos alcançáveis.
O anterior `bruno-dashboard.qBASlcMq.js` foi preservado. Rollback local em
`tmp/rollback-20260901-tablet-room-tiles-7/`; backup Everex em
`tmp/everex-preflight-20260901-tablet-room-tiles-7/`. Sem reinício do Home
Assistant; aceite físico permanece pendente.
---

**Data:** 2026-09-01

**Decisão:** usar a altura vertical efetivamente disponível para ampliar apenas
os controles da side sheet global de Iluminação em tablets altos, preservando o
modo compacto já saturado.

**Motivo:** a validação física identificou uma sobra equivalente a pouco mais de
três controles no tablet, enquanto os viewports baixos já estavam próximos do
limite sem scroll.

**Contrato:** `.light-control` usa
`clamp(48px, calc(9.1dvh - 25px), 60px)` acima do modo compacto; até 820 px de
altura permanece em `clamp(42px, 6dvh, 44px)`. Gaps, padding, largura,
agrupamentos, filetes, gesto e mobile ficam intactos.

**Validação:** nove viewports de tablet sem overflow vertical ou horizontal;
mobile 390x844 preservado em 46 px. TypeScript, ESLint, 291 testes, YAML, JS,
crases, build, manifesto, compressão e grafo aprovados.

**Operação:** bundle `bruno-dashboard.DuoAOL_I.js` copiado para o Everex com
28/28 hashes idênticos. Ativação pendente de reinício controlado do Home
Assistant. Rollback local em
`tmp/rollback-20260901-status-lights-tablet-height-rev4/`; backup Everex em
`tmp/everex-preflight-20260901-status-lights-tablet-height-rev4/`.

---

**Data:** 2026-09-02

**Decisão:** implementar somente a Parte A do Item 2, ocupação global em
shadow mode, após autorização. A migração Tuya → ONVIF permanece adiada;
nenhum sensor de câmera alimenta a camada e nenhum consumidor Tuya muda.

**Contrato:** oito entidades declarativas, snapshot único de evidências,
cinco estados, cobertura mínima 5/7, confirmação somente com 7/7 e fontes de
ausência válidas, janela inicial de pelo menos 60 s e `delay_on` de 900 s.
Lavabo sem health é complementar; Corredor/Lavabo verificam fonte bruta para
não confundir indisponibilidade com `off`. Office exige atividade humana
supervisionada. Não há serviço, automação física ou notificação.

**Validação e operação:** 30 regressões locais e 251 YAMLs aprovados. Pacote
e include publicados no Everex com 2/2 hashes iguais. Sessão HA disponível
está sem login: Check Configuration, reload e validação de estados/reinício
permanecem pendentes. Nenhum reload/restart realizado. Candidata
`codex/home-occupancy-shadow-20260902` sobre main `e0882b4`; não promover main
sem aceite. Bundle em disco `bruno-dashboard.DuoAOL_I.js` intacto. Documento
de fundação só será atualizado após validação explícita, sem marcar Item 2
concluído agora. Detalhes em `docs/43-home-occupancy-shadow-20260902.md`.

---

**Data:** 2026-09-03

**Decisão:** reservar explicitamente a safe area superior somente no modo phone
da `bruno-shell`, sem restaurar o pacote de ocupação nem alterar o tablet.

**Causa:** depois do reinício/HA 2026.9, o container passou a expor uma viewport
edge-to-edge e revelou que a shell dependia implicitamente de o próprio HA
retirar a barra de estado. O código tratava `safe-area-inset-bottom`, mas não o
topo. A comparação dos bundles `C5Tz4bF_` e `DuoAOL_I` descartou como causa a
mudança anterior de altura da sheet: seu delta era tablet-only e o mobile
continuava sobrescrito em 46 px.

**Contrato:** no breakpoint `<=800px`, usar o maior valor entre
`--safe-area-inset-top` e `env(safe-area-inset-top)` como `padding-top`, com
`box-sizing: border-box`. A altura externa continua em `100dvh`; tablet,
ocupação, Tuya/ONVIF, gestos e layouts internos ficam intactos.

**Validação:** TypeScript, ESLint, 20 arquivos/293 testes, 251 YAMLs, 200 JS,
Vite/91 módulos e grafo local com sete módulos aprovados. Bundle candidato
`bruno-dashboard.BHAJDN5A.js`; main chunk `chunks/main.uiioeD72.js`. Publicação
no Everex concluída com configuração por último, 30/30 hashes idênticos e grafo
remoto íntegro; não houve reinício. O merge em `main` continua bloqueado até o
aceite físico no iPhone. Detalhes e rollback em
`docs/44-mobile-safe-area-top-20260903.md`.
