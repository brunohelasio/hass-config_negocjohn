# Fase 6.3E — estado real da implementação mobile

**Data do registro:** 2026-08-12  
**Escopo:** Home mobile, subviews de cômodo, bottom sheets, rail inferior,
navegação interna e publicação dos artefatos.  
**Regra permanente:** qualquer correção desta fase deve ficar restrita ao
telefone (`max-width: 800px`). O tablet continua sendo a experiência principal
e não pode perder destinos, composição ou comportamento.

Este documento consolida informações que antes estavam distribuídas entre os
documentos 26–29, `CLAUDE.md`, o histórico de publicação e os bancos de teste.
Ele distingue implementação, validação de laboratório e aceite no aparelho.

---

## 1. Decisões de produto confirmadas

1. A mesma shell atende tablet e telefone; a composição interna continua
   específica de cada modo.
2. No telefone, a rail inferior mostra Home, Sala, Cozinha, Office e Quartos.
   Quartos abre Q. Casal, Q. Marina e Q. Miguel. No tablet permanecem os oito
   destinos: Home, Sala, Cozinha, Office, os três quartos e Power.
3. A Home mobile continua com rolagem curta. Na etapa inicial, Energia e Mídia
   permaneceram em linhas próprias; na revisão de 2026-08-10, os dois cards
   fixos foram preservados em comentário e cederam a posição para a área
   dinâmica de Câmera, Roborock e Mídia, acionada por relevância.
4. O card Sala da Home é full-width, com altura equivalente à dos demais cards
   de cômodo e separador central.
5. Nas subviews, a câmera permanece logo abaixo da faixa de status. Cortina,
   Iluminação, Hub/Estação e A/C formam a área de controles.
6. Iluminação, Hub/Estação, A/C e Eletrodomésticos abrem como bottom sheet no
   telefone. O tablet mantém os módulos no fluxo original.
7. O fechamento das folhas é por toque externo, arrasto para baixo ou chevron
   junto ao título. O botão Concluir e o X circular não fazem parte do desenho.
8. A rail fechada deve permanecer transparente. Somente com a folha aberta ela
   deve assumir exatamente o mesmo material visual da folha, separada por um
   filete translúcido.
9. A câmera continua sendo um card. A imagem fica dentro dele, com respiro entre
   todas as bordas da imagem e as bordas do card.
10. Cards dinâmicos da Home — Mídia/Spotify, Roborock e Câmera — devem preservar
    no telefone a mesma regra funcional já vigente no tablet.

---

## 2. O que foi implementado até o bundle atual

### 2.1 Home e navegação

- shell compartilhada reorganizada em uma coluna no telefone;
- rail vertical convertida em dock inferior somente abaixo de 800 px;
- Sala compacta e full-width; demais cômodos em grade de duas colunas;
- Energia e Mídia chegaram a ser mantidas separadas; na revisão de 2026-08-10,
  os includes fixos foram comentados e substituídos pela área dinâmica mobile;
- grupo Quartos adicionado à rail mobile;
- seleção de Q. Casal, Q. Marina e Q. Miguel pelo grupo Quartos;
- navegação interna do telefone trocada de `location.hash` com `hashchange`
  para `history.replaceState` mais ativação direta da seção já montada;
- eliminação, no banco e no aparelho, da remontagem geral que produzia tela
  preta e `Loading data` ao entrar e sair das subviews.

### 2.2 Subviews dos cômodos

- bloco de CSS mobile separado em `subview-phone.styles.ts`;
- empilhamento comum aplicado a Sala, Cozinha, Office e três quartos;
- câmera colocada imediatamente abaixo da faixa de status;
- PIP de Sala/Cozinha redimensionado e ancorado no canto inferior direito;
- Cortina convertida em faixa própria no telefone;
- Abrir, Parar, Fechar, slider e marcas percentuais religados aos serviços reais
  de `cover`;
- Iluminação, Hub/Estação, A/C e Eletrodomésticos transformados em lançadores e
  bottom sheets;
- folhas com altura derivada do conteúdo e teto baseado no viewport;
- saída animada, toque externo e arrasto para fechar;
- rail preservada visível durante a folha;
- material Josh mobile da folha aproximado do VisionOS;
- linhas internas do Hub receberam altura mínima e centralização adicionais;
- DOM móvel oculto acima de 800 px e estado da folha limpo ao cruzar o
  breakpoint para tablet.

### 2.3 Câmeras e ONVIF

- subviews TypeScript usam o player oficial `ha-web-rtc-player` para as câmeras
  autorizadas, mantendo snapshot como fallback;
- lazy-load determinístico, negociação de até 30 s e retomada 700 ms após
  fechamento do More Info;
- apenas a câmera principal recebe vídeo ao vivo; PIP permanece leve;
- quarentena de quadros verdes e retenção do último quadro válido;
- o ciclo ONVIF/WebRTC não é a causa direta da antiga tela global
  `Loading data`; a causa confirmada dessa tela era a navegação com
  `hashchange` no WebView.

### 2.4 Planta 3D, Roborock e demais subviews

- Roborock foi empilhado em uma coluna no telefone;
- mapa teve tratamento para impedir corte dos controles inferiores;
- subview de câmeras já tinha composição mobile própria;
- planta 3D recebeu proposta e implementação de visão geral mais comandos por
  cômodo para evitar 37 alvos sobrepostos em aproximadamente 390 px;
- essas áreas continuam subordinadas ao aceite visual em aparelho real.

---

## 3. Arquivos e artefatos envolvidos

### Fontes principais

- `dashboard-src/src/components/rooms/bruno-room-subview.ts`
- `dashboard-src/src/components/rooms/subview-phone.styles.ts`
- `dashboard-src/src/components/rooms/bruno-room-tile.ts`
- `dashboard-src/src/services/camera/`
- `dashboard-src/src/config/camera-webrtc.config.ts`
- `config/www/bruno-ui/core/bruno-shell.js`
- `config/www/bento-sidebar-card.js`
- `config/dashboards/views/shell/rail_rooms.yaml`
- `config/dashboards/views/main-grid/v2/bento_dynamic_phone.yaml`
- `config/dashboards/views/shell/section_home_v2.yaml`
- `scripts/harness/gen-shell-harness.mjs`

### Publicação ativa antes deste diagnóstico

- bundle: `bruno-dashboard.Dvu9B_BT.js`;
- shell: `bruno-shell.js?v=20260812-mobile-ajustes-finos-1`;
- sidebar: `bento-sidebar-card.js?v=20260812-mobile-faixa-refino-1`;
- rollback da última publicação:
  `\\192.168.3.102\config\tmp\rollback-20260812-mobile-ajustes-finos-1`.

Na última publicação, bundle, sourcemap, loader, manifesto, shell e
`configuration.yaml` foram copiados com a configuração por último. Os seis
pares local × VM tiveram SHA-256 idêntico.

---

## 4. O que os bancos de teste aprovaram

### Telefone 428 × 926

- câmera na mesma caixa geométrica antes e depois de abrir uma folha;
- PIP medido em 124 × 82,7 px, proporção 3:2;
- folha termina acima da rail;
- X invisível e chevron presente;
- toque externo, chevron e arrasto fecham;
- alturas das folhas diferentes e derivadas do conteúdo;
- nenhum conteúdo inalcançável;
- navegação Sala → Office → Cozinha → Sala sem `hashchange`, sem tela vazia e
  reutilizando a mesma shell;
- Cortina com quatro chamadas funcionais validadas;
- suíte Vitest com 208 testes aprovada.

### Tablet 1366 × 768

- oito destinos da rail visíveis;
- rail em coluna;
- conteúdo em colunas laterais;
- elementos exclusivos do telefone invisíveis;
- nenhuma folha ativa.

### Limite conhecido do banco

O banco desktop não reproduz fielmente:

- `env(safe-area-inset-bottom)` do iPhone dentro do app do Home Assistant;
- a composição de blur entre shadow roots no WebView iOS;
- a pintura real dos pseudo-elementos e bordas sobre o wallpaper do aparelho;
- a mudança de proporção do Hub com metadados e arte reais;
- o gatilho dos cards dinâmicos da Home a partir do estado real das entidades.

Portanto, aprovação geométrica no harness não equivale a aceite visual e
funcional no iPhone.

---

## 5. Resultado no iPhone após o bundle `Dvu9B_BT`

As imagens de 11:03 reprovaram quatro pontos:

1. **Câmera:** o card externo deixou de ser visualmente reconhecível. A imagem
   passou a parecer o próprio card; não há o respiro inferior solicitado. O PIP
   voltou a tocar a borda inferior da imagem. Com a folha aberta permanece uma
   colisão visual na região superior entre a borda/separador e o título/ícone.
2. **Rail:** fechada, recebeu uma superfície visível apesar do requisito de
   transparência. Aberta, sua superfície ainda não coincide com a folha; há uma
   mudança de tom/material na junção.
3. **Cards dinâmicos:** iniciar Spotify no Office atualiza a folha da subview,
   mas não produz o card dinâmico correspondente na Home mobile. Roborock e
   Câmera ainda precisam ser auditados pela mesma cadeia de visibilidade.
4. **Hub/Estação:** o módulo do tablet foi apenas estreitado. A redução de
   largura aumenta excessivamente a altura, empilha controles e deixa a arte
   vertical dominar a folha, sem uma composição mobile própria.

Esses quatro pontos permanecem **abertos**. Nenhuma correção deles foi aplicada
na rodada de documentação e diagnóstico que gerou este registro.

---

## 6. Critérios de aceite da próxima correção

1. câmera continua card, com cabeçalho, moldura e gaps independentes da imagem;
2. PIP não toca nenhuma borda e mantém alvo de toque adequado;
3. abrir qualquer folha não altera borda, título, ícone ou geometria da câmera;
4. rail fechada é transparente; aberta continua transparente e lê visualmente
   como a mesma superfície porque a própria folha se prolonga por trás dela;
5. Spotify ativo produz o card dinâmico na Home mobile; Roborock e Câmera passam
   pela mesma verificação;
6. Hub/Estação tem composição mobile própria, sem simplesmente comprimir o
   layout tablet;
7. nenhuma regra visual ou funcional nova atua acima de 800 px;
8. aceite final exige fotos ou inspeção no iPhone e regressão no tablet real,
   além do harness.

---

## 7. Correção mobile final — bundle `Dl1h2bqI`

Implementação autorizada e concluída em 2026-08-12, sem alterar a composição
do tablet:

1. **Câmera:** a cartela externa foi restaurada exclusivamente em
   `max-width: 800px`; cabeçalho e conteúdo passaram a ter zonas internas
   independentes. O feed mantém 16:9 e o PIP 3:2, com aproximadamente 10 px de
   respiro real em relação às bordas inferior e direita do feed.
2. **Folha e rail:** a rail permanece transparente fechada e aberta. Quando uma
   folha abre, é a própria superfície da folha que continua até a borda inferior
   e passa por trás da rail. O padding inferior reserva a altura medida do dock,
   impedindo sobreposição dos controles.
3. **Cards dinâmicos:** foi removido o ciclo de partida fria em que o host
   colapsado media 0 px e, por isso, nunca conseguia produzir o primeiro plano.
   A capacidade configurada de 300 px é usada como fallback somente no telefone
   e somente quando já existe uma atividade real. A posição da faixa na Home não
   mudou: continua imediatamente depois de Q. Marina e Q. Miguel.
4. **Hub de Mídia:** o corpo aberto ganhou grid mobile próprio. Metadados e arte
   compartilham a primeira linha; volume, progresso e transportes usam a largura
   completa da segunda linha. A arte mede entre 88 e 112 px conforme a largura
   do aparelho; abaixo de 350 px passa a 82 px e o rótulo textual de volume é
   ocultado, preservando o slider e os alvos de toque.

### Proteção do tablet

- todas as regras visuais novas estão dentro de `@media (max-width: 800px)`;
- o fallback funcional do container dinâmico é condicionado por
  `matchMedia('(max-width: 800px)')`;
- fora do breakpoint, o critério anterior de visibilidade do container foi
  preservado literalmente;
- a rail tablet continua em coluna e exibe os oito destinos: Home, Sala,
  Cozinha, Office, Q. Casal, Q. Marina, Q. Miguel e Power;
- a ordem compartilhada Sala, Cozinha e Office foi aceita pelo usuário e não
  houve nova reordenação nesta correção.

### Validação local

- TypeScript, ESLint, sintaxe dos JS clássicos, YAML e detector de crase: OK;
- Vitest: 12 arquivos e 208 testes aprovados;
- harness 428 × 926: aprovado, incluindo três folhas por conteúdo, rail sempre
  visível, câmera reconhecível, controles fora da rail, navegação sem remontagem
  e partida fria do card dinâmico;
- Hub medido também em 320 px: coluna de arte em 82 px e controles em largura
  integral;
- harness tablet 1024 × 768: aprovado, com oito itens, duas colunas e nenhum
  elemento exclusivo do telefone visível.

O aceite definitivo continua dependente da inspeção visual no aplicativo do
Home Assistant, pois safe-area e composição de blur do WebView iOS não são
reproduzidos integralmente pelo harness desktop.

---

## 8. Refinamento dimensional e visual — bundle `BhU8hVkk`

Rodada incremental concluída em 2026-08-12 sobre a arquitetura mobile já
aprovada. Câmera, PIP, navegação, rail e arquitetura das folhas não foram
reestruturados.

1. **Plano contínuo fechado:** Cortina, Iluminação, Hub e A/C continuam sem
   container externo. Cortina e launchers agora compartilham vinhetas laterais
   sutis; os divisores entre módulos são gradientes de 1 px com fade nas
   extremidades. Linhas individuais permanecem sem raio, borda completa, sombra
   ou background próprio.
2. **Iluminação:** a folha usa padding lateral adaptativo de 20 a 24 px em um
   único eixo de alinhamento para cabeçalho, títulos e grid. Após o retorno do
   aparelho, os tiles foram recalibrados para 68 a 72 px, com gaps de 9 a 10 px
   e maior separação entre Sala e Varanda.
   Borda e superfície internas tiveram o contraste reduzido.
3. **Hub/Estação:** TV, PC e Spotify passam a compartilhar uma altura de corpo
   expandido entre 254 e 274 px. Alternar a fonte muda apenas o conteúdo; a
   altura externa da folha permanece estável. A coluna de arte cresceu para
   104–132 px, com fallback de 94 px abaixo de 350 px, sem retirar a largura
   integral dos controles.
4. **Home:** a linha mobile da Sala passou de 150 para 160 px, exatamente a
   altura vigente das demais tiles de cômodo. A diferença hierárquica continua
   sendo largura integral e composição horizontal.

### Medições de aceite local

- 428 × 926: tiles de luz com 75,9 px, gaps de 11,5 px e margens laterais de
  24 px; a folha começa na região da Cortina e preserva toda a câmera;
- 428 × 926: TV ↔ Spotify e PC ↔ Spotify com diferença de 0 px na folha e no
  corpo; corpo com 266,7 px e arte quadrada com 126,5 px;
- 320 × 844: nenhum overflow horizontal; tiles com 72 px, gap de 10 px, arte
  com 94 px e folha de mídia estável entre fontes;
- 1280 × 720: linha mobile invisível, duas colunas preservadas e os oito itens
  originais da rail tablet visíveis.

### Isolamento

Todas as regras visuais desta rodada permanecem dentro de
`@media (max-width: 800px)`. A alteração de 150 para 160 px está exclusivamente
no bloco `mediaquery` de telefone da Home. Nenhuma geometria, ordem ou card do
tablet/desktop foi modificado.

### Correção pós-dispositivo — bundle `DPSqTbyG`

O bundle, sourcemap, manifesto, loader e entrypoint foram publicados na VM com
verificação SHA-256. Rollback preservado em
`\\192.168.3.102\config\tmp\rollback-20260812-mobile-regression-DPSqTbyG`.

- o fundo da faixa fechada passa a alpha zero nas duas extremidades e não usa
  mais blur no elemento inteiro, eliminando a caixa lateral escura;
- a altura máxima da folha passa a ler o topo real da Cortina no WebView, e não
  apenas uma reserva estimada em `dvh`;
- Sala e Q. Miguel foram medidos sem scroll interno no banco 428 × 926;
- o toggle passou para 34 × 20 px, com folga interna discreta;
- a escolha manual de PC/TV/Spotify prevalece no telefone, sem alterar a regra
  de prioridade do tablet;
- PNGs de espera ganharam escala interna de 1,14 sem mudar a caixa do grid;
- a redistribuição interna de progresso, volume e transportes do Spotify ficou
  deliberadamente fora desta correção, aguardando nova decisão visual.

---

## 9. Grade exata e Now Playing compacto — bundle `BPkb_uaO`

Rodada mobile de 2026-08-13, sem alterar a composição do tablet:

1. **Iluminação:** a altura das células passa a ser calculada com a altura real
   disponível no WebView, descontando cabeçalho, títulos, divisores e gaps. No
   banco 390 × 844, a área útil ficou em 369 px e o token resultante em 57 px;
   as duas grades terminam exatamente no limite da área, com
   `scrollHeight === clientHeight === 369`.
2. **Hub/Estação:** o corpo aberto foi reduzido para 226–232 px. TV, PC e
   Spotify continuam com a mesma altura externa, e a escolha manual da fonte
   é reconciliada imediatamente mesmo quando o Spotify está ativo.
3. **Now Playing:** metadados e progresso dividem a linha superior com arte de
   100–110 px; transportes usam áreas táteis sem caixas individuais; o volume
   virou uma linha funcional integrada. Quando há capa, uma cópia ampliada,
   desfocada e de baixa opacidade cria atmosfera dentro do próprio módulo.
4. **Espera:** imagens de TV, PC e Spotify usam `object-fit: contain` e não
   recebem mais escala por transformação, eliminando o recorte observado no
   aparelho.

### Proteção do tablet

As novas regras visuais permanecem integralmente no bloco
`@media (max-width: 800px)`. O harness 1280 × 720 foi aprovado com as duas
colunas, oito itens na rail, nenhuma linha/folha mobile visível e nenhuma
atmosfera mobile inserida no DOM do tablet.

Bundle, sourcemap, manifesto, loader e configuração foram publicados na VM e
os cinco pares local × remoto foram confirmados por SHA-256. Rollback em
`\\192.168.3.102\config\tmp\rollback-20260813-mobile-now-playing-BPkb_uaO`.

---

## 10. Refinamento final do Hub, status e rail — bundle `Bi9xZDOa`

Rodada mobile de 2026-08-13, preservando a arquitetura aprovada e sem alterar
a composição do tablet:

1. **Hub/Estação:** o cabeçalho da fonte aberta deixou de consumir uma linha
   independente de 40 px e foi integrado à coluna textual do Now Playing. A
   folha caiu de 442,2 para 402,2 px no banco 390 × 844, mantendo o corpo em
   227,9 px e todas as áreas táteis.
2. **Distribuição interna:** metadata e progresso foram centralizados em
   relação à arte; transportes e volume desceram 5 px e a linha flexível usa o
   espaço restante. TV, PC e Spotify permanecem com altura externa idêntica.
3. **Superfície:** foi retirado o gradiente escuro retangular do corpo. A cópia
   desfocada da capa permanece como atmosfera de baixa opacidade, agora com
   máscara radial que desaparece nas quatro extremidades.
4. **Ações em espera:** o CTA de PC desligado passa a usar a mesma largura,
   borda quente e hierarquia dos CTAs de TV e Spotify.
5. **Status:** cada tile ocupa exatamente 25% da faixa visível; quatro estados
   preenchem a largura e os seguintes permanecem acessíveis por scroll.
6. **Rail:** os ícones phone passam de 18 para 20 px e descem 2 px. O padding
   foi compensado para preservar exatamente a altura de 58,4 px e a posição do
   filete.

### Evidência de isolamento

As regras de Hub e status continuam dentro de `@media (max-width: 800px)`; a
rail recebeu a mudança somente no bloco phone. No harness 1024 × 768, o Hub
permaneceu relativo, as badges continuaram com `flex-basis: auto` e os ícones
da rail continuaram em 24 px. Nenhuma geometria tablet foi alterada.

Bundle, sourcemap, manifesto, loader, sidebar e configuração foram publicados
na VM. Os seis pares local × remoto foram confirmados por SHA-256. Rollback em
`\\192.168.3.102\config\tmp\rollback-20260813-mobile-hub-refino-Bi9xZDOa`.

---

## 11. Correção geométrica do Hub — bundle `B5N215h6`

O retorno do aparelho mostrou que a atmosfera desfocada ainda formava um
retângulo no WebView. A causa foi confirmada por geometria: a imagem de fundo
media 570,8 × 375,5 px dentro de um corpo de 346,4 × 227,9 px; o fade ficava
fora do recorte e o `overflow` exibia uma borda rígida.

Correção exclusiva do telefone:

1. a atmosfera ampliada deixa de ser renderizada visualmente; a capa nítida
   permanece e o corpo revela exatamente o material VisionOS da folha;
2. a altura do corpo passa a ser derivada da arte (`arte + 92px`), ficando em
   199,3 px no banco 390 × 844, contra 227,9 px anteriormente;
3. transportes passam de 48 para 44 px, volume de 42 para 34 px, gap interno de
   6 para 2 px e separação entre camadas de 8 para 4 px;
4. o padding inferior da lista de fontes cai de 10 para 0 px e a reserva acima
   da rail cai de 10 para 4 px.

### Medições

- 390 × 844: folha de 357,6 px, contra 402,2 px; volume termina 7,6 px antes do
  filete da rail, contra 27,6 px;
- 320 × 700: corpo de 188 px e folha de 346,3 px, sem overflow horizontal;
- 428 × 926: corpo de 202 px e folha de 360,3 px, sem overflow horizontal;
- 1024 × 768: Hub continua relativo com 320 px e rail tablet em 24 px.

Nenhuma regra fora de `@media (max-width: 800px)` foi alterada.

Bundle, sourcemap, manifesto, loader e configuração foram publicados na VM;
os cinco pares local × remoto foram confirmados por SHA-256. Rollback em
`\\192.168.3.102\config\tmp\rollback-20260813-mobile-hub-compacto-B5N215h6`.

---

## 12. Uniformidade estrutural sem reduzir a rail — bundle `BJutTx-c`

Rodada de 2026-08-15. O ajuste segue o plano B aprovado para o telefone e não
redistribui a geometria vertical já validada:

1. **Status:** o wrapper continua com 36,31 px no fluxo. A faixa visual interna
   mede 48 px, badge 46 px, e cresce sobre os gaps existentes. A câmera continua
   em `top = 56,31 px`; rail, tiles e bottom sheets não foram deslocados.
2. **Hub compartilhado:** Sala, Office, Q. Casal, Q. Marina e Q. Miguel usam a
   mesma altura de folha (330,3 px) e o mesmo corpo ativo (172 px) no banco
   428 × 926. Não existe mais uma regra geométrica residual exclusiva da Sala.
3. **Layout shift:** a referência da câmera é capturada antes de mudar o estado
   da folha e restaurada após o ciclo Lit e dois frames. A shell desabilita
   `overflow-anchor` concorrente no slot. O harness mediu 0 px ao abrir e 0 px
   ao fechar em todos os cinco cômodos com Hub.
4. **Folha de iluminação:** Sala e Q. Miguel, os casos mais altos, mediram
   505,4 px sem scroll e sem clipping em 428 × 926.
5. **Rail mobile:** permanece com 58,4 px e os cinco destinos já aprovados. O
   plano B não depende de reduzir sua altura.

### Tablet

As subviews agora usam as mesmas métricas da faixa da Home: 48 px para a faixa,
46 px para as badges, caixa de ícone de 22 px, glyph de 18 px e tipografia
10/11 px. A rail conserva Home, seis cômodos e Power com as dimensões dos
botões inalteradas; somente o padding superior foi corrigido. Em 1920 × 1200,
a diferença medida entre o centro de Home e o centro da primeira badge foi
0,02 px.

### Itens globais da mesma rodada

- cortina: telemetria física prioritária, alvo comandado separado e estimativa
  progressiva com retenção/reconciliação;
- A/C: somente arco e marcador passam de raio 300 para 315; a caixa e os demais
  controles não mudam;
- câmeras verdes: diagnóstico e pipeline deliberadamente excluídos.

### Publicação

O bundle, sourcemap, loader, manifesto, shell, sidebar e configuração foram
publicados exclusivamente no Everex `\\192.168.3.154\config`, com sete hashes
idênticos. A VM deixou de ser destino de trabalho. A ativação depende de
reinício do Home Assistant e recarga forçada no aplicativo.

---

## 13. Microalinhamento Home e estabilidade estrutural da câmera — `DpecM3wp`

Rodada local de 2026-08-15, exclusiva do telefone.

### Degrau Home → subview

A faixa da Home ocupava a linha correta, mas sua pintura começava em 10 px; a
pintura interna da subview começava em 4,17 px. A Home sobe visualmente 5,84 px
sem mudar a caixa de 48 px no fluxo. O ajuste fica em `max-width: 800px`, então
não alcança o tablet. O tile Temperatura conserva 25% da faixa e recebe somente
uma redistribuição interna de gap/padding para afastar o título do filete.

### Salto Office/Quartos ao abrir o Hub

O HTML compartilhado não era suficiente para garantir a mesma geometria. A
Sala ativava o bloco legado `data-tvhub`, que deixava o menu da câmera com
34,31 px. Nas demais subviews ele media 23,39 px. A abertura do Hub aplicava um
seletor amplo de `.mh-menu`; como o botão de câmera também usa essa classe, seu
tamanho crescia e o cabeçalho passava de 44 para 48,31 px.

A geometria da Sala agora é explícita para todas as subviews mobile e a regra
do Hub está restrita ao próprio `.media-hub-card`. Em 428 × 926, Sala, Office,
Casal e Marina mediram câmera em `56,31 → 333,56 px`, cabeçalho de 48,31 px e
menu de 34,31 px nos estados fechado e aberto, com delta zero.

### Estado de entrega

Bundle local `bruno-dashboard.DpecM3wp.js`; cache-bust local
`20260815-status-position-2`. A publicação no Everex está pendente: a sessão
não obteve autorização para ler os arquivos remotos e produzir o backup
prévio. A produção permanece na versão anterior até publicação coordenada.

---

## 14. Publicação concluída (2026-08-16)

O usuário publicou `DpecM3wp` no Everex e reiniciou o Home Assistant. **Não há
pendência de publicação** — o §13 fica encerrado.

Registros que passam a valer para qualquer rodada futura:

1. **Destino único: Everex `\192.168.3.154\config`.** A VM `192.168.3.102` foi
   abandonada e não é mais destino de nada.
2. **As alterações são simultâneas na pasta local e no Everex.** Publicar só o
   repositório deixa a casa parada; publicar só o Everex desfaz na próxima
   build.
3. **O trabalho mobile do Codex está validado e é INTOCÁVEL.** Nenhuma rodada
   futura deve alterar composição, geometria ou comportamento do telefone sem
   pedido explícito — o risco é regressão em algo que já passou pelo aparelho.

`dashboard-src/scripts/deploy.mjs` foi corrigido nesta data: apontava para a VM
abandonada, o que faria uma publicação "bem-sucedida" não chegar a lugar nenhum.
Agora tem `--everex` (com `--vm` sobrevivendo como apelido que avisa) e cobre
também os arquivos fora de `www/dashboard` — `configuration.yaml`,
`bento-sidebar-card.js` e `bruno-shell.js` — comparando antes de escrever.

**Estado de publicação:** implementação e validação concluídas na pasta local.
O Everex não foi modificado: a autorização externa atingiu o limite de uso
antes da conferência final dos hashes remotos. Publicar os cinco arquivos
somente numa nova janela autorizada, com `configuration.yaml` por último.

---

## 15. Home mobile compacta com continuidade sem card cortado — 2026-08-16

Rodada autorizada exclusivamente para telefone. Tablet e desktop permanecem
com a composição anterior.

### Geometria adotada

Os cards de cômodo conservam integralmente a arquitetura e a altura aprovada de
`172 px`. O ganho de espaço vem da região superior:

- Hero V2 mobile: `160 px`;
- relógio e previsão do tempo: mesma linha;
- gaps externos da sequência principal: `8 px`;
- Sala: `172 px`;
- Office + Cozinha: `172 px`;
- Lavabo + Q. Casal: `172 px`;
- indicador semântico: linha própria de `14 px`;
- Q. Marina + Q. Miguel: quarta linha de `172 px`, integralmente abaixo do
  recorte inicial.

Na referência `428 × 926`, antes da rail, a sequência calculada é:

| Região | Top | Bottom |
|---|---:|---:|
| status | 10 | 58 |
| hero | 66 | 226 |
| Sala | 234 | 406 |
| Office + Cozinha | 414 | 586 |
| Lavabo + Q. Casal | 594 | 766 |
| indicador | 774 | 788 |
| Q. Marina + Q. Miguel | 796 | 968 |

Assim, não há card parcialmente cortado: a terceira faixa termina antes do
filete da rail, o indicador ocupa o remanescente e a faixa seguinte começa
somente abaixo da viewport útil.

### Indicador e status

`bruno-home-overflow-indicator` não cria card, fundo ou área de toque. Ele conta
atividade por cômodo oculto (luz, clima, presença e mídia) e informa zero, um
ou dois ambientes ativos; também pode sinalizar cards dinâmicos abaixo.

`bruno-top-badges-card` ordena os status apenas no telefone: atenção primeiro,
depois estados ativos e, por fim, estados inativos. Empates mantêm a ordem fixa
original, evitando dança visual. No tablet a lista original não é reordenada.

### Isolamento do tablet

As regras visuais novas estão em `@media (max-width: 800px)` e o indicador é
ocultado fora desse breakpoint. No teste de fronteira em `801 × 1000`, o Hero
voltou a `494 px`, o indicador mediu `0 px` e os status conservaram a ordem
original `Security, Cortinas, Lights, Media, Climate`. A matriz base do tablet
continua em três colunas e duas linhas; somente o override phone ganhou a linha
de 14 px.

### Cache, rollback e publicação

Cache-bust preparado: `20260816-mobile-home-compacta-1`. Snapshot coordenado:
`tmp/everex-preflight-20260816-mobile-home-compacta-1/`. O arquivo `README.md`
do snapshot contém a ordem segura de reversão local e no Everex.

---

## 15. Ajuste da Home mobile — largura uniforme e indicador contextual (2026-08-16)

Dois ajustes pedidos pelo usuário, ambos restritos a `max-width: 800px`.
Bundle NÃO alterado: as duas mudanças vivem em JS clássico.

### 15.1 Tiles de status com largura uniforme

**Causa medida.** O bloco `@media (max-width: 900px)` deixa
`.badge { flex: 0 0 auto }` — largura ditada pelo CONTEÚDO. Medido a 428 px:
**99,3 · 101,8 · 96,1 · 96,1 · 98,4**. As quatro primeiras somavam 394,2 de 408
úteis, então bastava um rótulo mais longo ser priorizado para a quarta ser
cortada.

**Correção.** `flex: 0 0 25%` da caixa de conteúdo do trilho: quatro tiles
ocupam a largura útil exata com qualquer combinação que a prioridade escolher.
O filete entre badges é `border-left` e o `box-sizing` é `border-box`, então ele
não acrescenta largura. Padding de 16 → 10 px e gap 9 → 7 px devolvem 14 px ao
texto; título e subtítulo truncam com reticências.

**A lógica de prioridade não foi tocada** — só a geometria.

**Onde o bloco ficou, e por quê.** Por ÚLTIMO na folha. O bloco de re-skin
redefine `.badge { padding: 0 16px }` sem media query, e media query não
acrescenta especificidade: quem decide é a posição. Colocado antes, o padding
daqui era ignorado — medido antes de mover.

**Breakpoint 800 px**, não 900. O bloco de 900 alcança 801–900, que é faixa de
tablet.

**Medido depois** (428×926):

| | antes | depois |
|---|---|---|
| larguras | 99,3 · 101,8 · 96,1 · 96,1 · 98,4 | **101,5 nas cinco** |
| todas iguais | não | **sim** |
| quarta termina em | 394,2 | **407** de 408 úteis |
| texto disponível | 38,5 px | **52,5 px** |

Teste de esforço com rótulos longos (Energia · 1,42 kWh, Temperatura ·
24,6 °C · 61%, Climatização · Refrigerar 23°): larguras seguem em 101,5, quarta
em 407, e **nenhum texto transborda** — trunca na borda.

### 15.2 Indicador de overflow só enquanto há o que revelar

**Comportamento.** Visível no topo quando há atividade abaixo; some ao começar a
rolagem (limiar de 6 px, para um toque de um ou dois pixels não fazer piscar);
volta ao retornar ao topo, se a atividade justificar.

**Esconde, não colapsa.** A linha de 14 px é do grid, definida em
`bento_comodos_matriz.yaml`. Colapsá-la durante a rolagem faria a terceira faixa
saltar 22 px para cima com o dedo na tela. Fica a linha vazia, que lê como
respiro e não como divisor.

**Sem `requestAnimationFrame`.** A primeira versão ligava o observador dentro de
um rAF, que não dispara com a aba em segundo plano — o vínculo ficaria sem ser
feito e o indicador permaneceria aceso durante a rolagem. Agora tenta
imediatamente e repete a partir de `set hass`, que é chamado a cada atualização
de estado.

O `aria-hidden` passou a acompanhar a classe: antes só era escrito no render, e
diria "visível" ao leitor de tela com o indicador oculto.

**Medido**: container de rolagem encontrado através dos shadow roots; classe
aplicada em `scrollTop 40`, removida em `4` e em `0`. Com a transição
neutralizada, `opacity 0 / visibility hidden` no estado rolado e `1 / visible`
fora dele.

### 15.3 Publicação

Local e Everex, com backup prévio e conferência por md5 dos quatro pares:
`bruno-top-badges-card.js`, `bruno-activity-column.js`, `configuration.yaml` e o
bundle (inalterado). Cache-bust `20260816-status-uniforme-1`.

### 15.4 RESOLVIDA (2026-08-17) — o repositório não reproduz o bundle de produção

Ao rodar `npm run check` nesta rodada, a build produziu
`bruno-dashboard.BLT5EaVb.js`: **mesmo tamanho** (521.866 bytes) e **conteúdo
diferente** do `DpecM3wp` que está em produção.

O que foi verificado:

- a build é **determinística** (duas execuções seguidas dão o mesmo hash);
- **nenhum arquivo TypeScript** foi alterado nesta rodada;
- o código da Fase 6.4 **não está** no bundle (as strings dele não aparecem);
- não é diferença de cache-bust de asset.

Mesmo tamanho com conteúdo diferente aponta para uma string de comprimento
igual, mas não a localizei.

**Decisão tomada:** não publicar um bundle cuja diferença eu não sei explicar. O
`BLT5EaVb` foi descartado e o `DpecM3wp` de produção foi restaurado no
repositório. Produção segue exatamente como o usuário validou.

**Por que isso importa antes da Fase 6.5:** aquela fase recompila. Se o
repositório não reproduz o bundle de produção, a próxima build levaria junto uma
diferença não intencional. Investigar a origem é pré-requisito da 6.5.

#### Causa encontrada (2026-08-17)

A build de hoje deu um TERCEIRO hash — `TT8NMeKv`, de novo com 521.866 bytes —
sem nenhuma linha de TypeScript alterada. Com três amostras e um diff byte a
byte contra o `DpecM3wp` de produção, a diferença apareceu em UM ponto:

```
produção:  buildId: "20260815"
hoje:      buildId: "20260817"
```

`vite.config.ts` define `BUILD_ID` como a DATA da build, injetada por
`define` e portanto embutida no bundle — o que a faz entrar no hash do
conteúdo. Oito caracteres, sempre: por isso o tamanho nunca mudava.

O comentário no próprio arquivo diz que usar só a data faz o hash mudar
"só quando o código muda". Não é verdade: ele muda também quando o DIA muda.
Os três hashes são três dias de build (15, 16 e 17 de agosto) do mesmo código.

**A divergência era benigna.** O repositório reproduz o bundle de produção; o
que ele não reproduz é a data em que aquele bundle foi gerado. Não há
pré-requisito pendente para a Fase 6.5.

Como o `DpecM3wp` continua sendo o que o usuário validou, e a única diferença
é uma string de diagnóstico, o bundle de produção foi restaurado no repositório
de novo em vez de publicar um novo — publicar exigiria trocar a linha do
`extra_module_url` e reiniciar o Home Assistant sem nenhum ganho funcional.

**Correção sugerida, fora do escopo desta rodada:** derivar o `BUILD_ID` do
commit do git (ou tirá-lo do `define` e lê-lo do `manifest.json` em runtime),
para que o hash volte a depender só do código. Enquanto isso não for feito,
toda build feita num dia diferente produz um nome de arquivo novo.
