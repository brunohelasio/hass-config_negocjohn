// ============================================================================
// bruno-surface-material.js — material dos cards das SUBVIEWS de cômodo.
//
// REV.2 (2026-07-27) — MODO TILE (Home V3 estendido às subviews).
// Pedido do usuário: os cards das subviews (Câmeras, Hub de Mídia / Estação de
// Trabalho / Eletrodomésticos, A/C e Iluminação) deixam de ser cartelas de
// vidro e passam a ter a MESMA linguagem da faixa de cômodos da Home:
// superfície plana + filete superior e inferior, sem borda e sem cantos.
//
// GATING (inalterado): o host recebe `data-bruno-subview-surface-theme="josh"`
// quando o tema ativo é o Josh.ai. Todo o CSS abaixo é escopado por esse
// atributo, então iOS / visionOS / Liquid Glass continuam com a cartela
// original, byte a byte.
//
// REV.3 (2026-07-27) — MOLDURA CONTÍNUA + SCRIM + SUPERFÍCIES INTERNAS.
// Três correções sobre a rev.2, todas apontadas pelo usuário:
//
//   1. FALTAVA O SCRIM. O fill era um véu de 3% de branco, sem base escura —
//      invisível sobre foto. A receita correta é a MESMA da faixa da Home, e
//      a última camada dela é um scrim PRETO de 30%: é ele que cria o
//      contraste tonal com o fundo do painel. Ver --bruno-subview-band-fill.
//
//   2. FALTAVA A MOLDURA. Pintar fill + filetes em cada card deixava a faixa
//      segmentada pelos gaps de 10px. Na Home a continuidade vem da moldura
//      que envolve os cômodos; aqui passa a vir de `main::before`. Pseudo-
//      elemento de container grid participa como ITEM do grid, então a
//      moldura é posicionada por grid-column/grid-row SEM markup novo — o que
//      resolve também a divergência de layout da Cozinha (faixa `appliances`
//      própria) com uma única regra extra.
//
//   3. FALTAVA TRATAR O SEGUNDO NÍVEL. Acordeões, abas e tiles internos usam
//      de 1,8% a 7% de branco, alfa calibrado para sentar sobre a cartela de
//      vidro. Sem ela, somem. Ver BRUNO_SURFACE_BAND_INNER (dentro da faixa,
//      plano chapado) e BRUNO_SURFACE_CARTELA_INNER (dentro da Iluminação).
//
// REV.4 (2026-07-27) — pós-avaliação de design. Cinco ajustes: Iluminação
// volta a ser cartela (bloco isolado não é série); nível 2 corrigido por
// FORMA e não por opacidade; fade lateral proporcional à largura real da
// faixa; moldura engloba o rodapé de presença, com o filete indo para BAIXO
// do status; e um ritmo comum para os três cabeçalhos da faixa.
//
// GEOMETRIA DA MOLDURA: cobre a faixa inferior (Câmeras + Hub de Mídia + A/C,
// ou Câmeras + Eletrodomésticos na Cozinha) e sua borda inferior cai
// exatamente sobre o separador que já existe acima de "Presença". A
// Iluminação fica fora da moldura — está sozinha no alto à direita, sem gap
// para atravessar, então carrega a própria receita.
//
// INVARIANTE (herdada da faixa da Home): o tile NÃO tem backdrop-filter. A
// superfície é estática, o que evita backdrop roots e mantém a composição
// determinística. Não reintroduzir blur aqui.
//
// ROLLBACK: trocar `subviewStyles` de volta para `brunoSubviewMaterialStyles`
// (a receita de cartela anterior, preservada logo abaixo) OU remover os
// tokens --bruno-subview-tile-* do tema.
// ============================================================================

const BRUNO_SURFACE_MATERIAL_VERSION = '20260801-light-control-backdrop-root-1';

const BRUNO_SURFACE_THEME_ATTRIBUTE = 'data-bruno-subview-surface-theme';
const BRUNO_SURFACE_CONNECTIONS = new WeakMap();

function brunoSurfaceCurrentTheme() {
  return globalThis.BrunoThemeManager?.current?.() || '';
}

function brunoSurfaceSyncTheme(host) {
  if (!host?.setAttribute) return;
  host.setAttribute(
    BRUNO_SURFACE_THEME_ATTRIBUTE,
    brunoSurfaceCurrentTheme() === 'josh' ? 'josh' : 'default',
  );
}

function brunoSurfaceConnect(host) {
  if (!host) return;
  const previous = BRUNO_SURFACE_CONNECTIONS.get(host);
  if (previous) globalThis.removeEventListener?.('bruno-theme-changed', previous);

  const sync = () => brunoSurfaceSyncTheme(host);
  BRUNO_SURFACE_CONNECTIONS.set(host, sync);
  globalThis.addEventListener?.('bruno-theme-changed', sync);
  sync();
}

function brunoSurfaceDisconnect(host) {
  const sync = BRUNO_SURFACE_CONNECTIONS.get(host);
  if (sync) globalThis.removeEventListener?.('bruno-theme-changed', sync);
  BRUNO_SURFACE_CONNECTIONS.delete(host);
}

// Os 5 cards que viram tile. A lista corresponde exatamente ao que o usuário
// enumerou: câmeras, hub de mídia / estação de trabalho, eletrodomésticos,
// A/C e iluminação.
// REV.4 — a Iluminação SAIU da lista. Ela é bloco isolado, não série: dois
// filetes horizontais sem repetição entre eles não formam faixa, formam duas
// réguas soltas. Volta a ser CARTELA, e como a base do Josh é o VisionOS ela
// herda exatamente a mesma gramática dos cards dinâmicos da Home (o material
// surface-off-* mais o edge glow de --bruno-subview-card-edge-*), sem precisar
// de regra própria aqui.
const BRUNO_SURFACE_TILE_CARDS = [
  '.glass-card.cameras-card',
  '.glass-card.media-hub-card',
  '.glass-card.ac-card',
  '.glass-card.appliances-card',
];

// Cards que ficam DENTRO da faixa inferior. Eles não pintam superfície
// nenhuma: quem pinta é a MOLDURA (main::before), atravessando os gaps.
const BRUNO_SURFACE_BAND_CARDS = BRUNO_SURFACE_TILE_CARDS;

// Cards que NÃO são os primeiros da sua faixa recebem o filete vertical, no
// mesmo idioma do divisor entre os tiles de cômodo da Home.
const BRUNO_SURFACE_DIVIDER_CARDS = [
  '.glass-card.media-hub-card',
  '.glass-card.ac-card',
];

// ---------------------------------------------------------------------------
// SUPERFÍCIES DE SEGUNDO NÍVEL — REV.4
//
// A varredura da rev.3 usava um awk que rastreava "última classe vista" e
// atribuiu a `.cameras-head` um fundo que pertencia à regra seguinte. Como
// `.cameras-head` é só a linha de título ("Câmeras ⋮") e NÃO tem superfície
// própria, ela ganhou um gradiente branco: era a faixa esbranquiçada relatada.
// Refeita bloco a bloco: das onze classes, dez têm mesmo background+border
// próprios; `.cameras-head` era o único falso positivo e saiu da lista.
//
// A correção agora é de FORMA, não de opacidade. Quando o nível 1 vira plano,
// 0% contra 7,5% é degrau pequeno demais para ler como "dentro de" — o nível 2
// precisa de borda e raio, que é o que o dá contenção.
// ---------------------------------------------------------------------------

// Nível 2 sobre plano CHAPADO (dentro da faixa): precisa de contenção forte.
const BRUNO_SURFACE_BAND_INNER = [
  // Hub de mídia / estação de trabalho
  // `.mh-source` e o container de CADA secao do hub (PC, Spotify) — e ele que
  // aparece como "card dentro do card". Ficou de fora das listas anteriores,
  // e era por isso que o hub continuava sem hierarquia interna por mais que
  // os tokens fossem calibrados: a regra nunca chegava nele.
  '.mh-source',
  '.media-tabs',
  '.media-image-button',
  '.media-extra-info',
  // Câmeras
  '.camera-main',
  '.camera-control',
  '.camera-thumb-overlay',
  // Eletrodomésticos
  '.appliance-tile',
];

// A Iluminação NÃO entra na faixa: é bloco isolado, no alto à direita. Ela
// carrega a composição dos cards dinâmicos da Home (ver a regra que usa esta
// lista). Constante reintroduzida em 2026-07-29 — havia sido removida junto
// com o modo tile da Iluminação, e a regra de cartela ficou referenciando uma
// variável inexistente, o que derrubava o módulo inteiro (ReferenceError:
// soloCards is not defined) e, com ele, as 6 subviews.
const BRUNO_SURFACE_SOLO_CARDS = [
  '.glass-card.lights-card',
];

// Nível 2 dentro da Iluminação: SÓ os tiles de luz.
// REV.7 — `.light-zone` SAIU da lista. Ela é a zona do acordeão (Sala,
// Varanda), um AGRUPADOR, não um bloco de conteúdo. Dando superfície a ela E
// aos tiles internos, o resultado virava três camadas empilhadas — e era por
// isso que a Iluminação com acordeão (Sala, quartos) ficava visivelmente mais
// pesada que a sem acordeão (Office, Cozinha), onde os tiles sentam direto no
// card. Agora só o nível de conteúdo recebe superfície, nos dois casos, e a
// zona vira um agrupador transparente (ver a regra dedicada adiante).
const BRUNO_SURFACE_CARTELA_INNER = [
  '.zl-tile',
  '.light-row',
  // REV.10 (2026-07-29): a celula da grade nova. A rev.9 renomeou `.zl-tile`
  // para `.light-cell` e NAO atualizou esta lista — as celulas ficaram orfas da
  // regra e o card virou uma lamina borrada uniforme, sem nivel interno. Era
  // isso que lia como "fosco", nao a receita externa (que e token-identica ao
  // card dinamico desde a rev.9). Na REV.16 estes seletores passaram a consumir
  // o pacote material completo dos controles do A/C; a geometria da grade
  // continua pertencendo a cada subview.
  '.light-cell',
];

// Agrupadores do acordeão: existem para organizar, não para competir.
const BRUNO_SURFACE_CARTELA_GROUPS = [
  '.light-zone',
];

// Cabeçalhos das três gramáticas da faixa (vídeo, acordeão, gauge). Sem um
// ritmo comum, continuidade de fundo não unifica — só expõe a diferença.
const BRUNO_SURFACE_BAND_HEADS = [
  '.cameras-head',
  '.media-hub-card .module-head',
  '.ac-card .module-head',
];

function brunoSurfaceSelectors(list, suffix = '') {
  const root = `:host([${BRUNO_SURFACE_THEME_ATTRIBUTE}="josh"])`;
  return list.map((selector) => `${root} ${selector}${suffix}`).join(',\n');
}

// ---------------------------------------------------------------------------
// NOVO (rev.2): receita de TILE.
// ---------------------------------------------------------------------------
function brunoSubviewTileStyles() {
  const root = `:host([${BRUNO_SURFACE_THEME_ATTRIBUTE}="josh"])`;
  const cards = brunoSurfaceSelectors(BRUNO_SURFACE_TILE_CARDS);
  const before = brunoSurfaceSelectors(BRUNO_SURFACE_TILE_CARDS, '::before');
  const after = brunoSurfaceSelectors(BRUNO_SURFACE_TILE_CARDS, '::after');
  const active = brunoSurfaceSelectors(BRUNO_SURFACE_TILE_CARDS.map((s) => `${s}.is-active`));
  const bandCards = brunoSurfaceSelectors(BRUNO_SURFACE_BAND_CARDS);
  const soloCards = brunoSurfaceSelectors(BRUNO_SURFACE_SOLO_CARDS);
  const dividers = brunoSurfaceSelectors(BRUNO_SURFACE_DIVIDER_CARDS);
  const bandInner = brunoSurfaceSelectors(BRUNO_SURFACE_BAND_INNER);
  const cartelaInner = brunoSurfaceSelectors(BRUNO_SURFACE_CARTELA_INNER);
  const cartelaGroups = brunoSurfaceSelectors(BRUNO_SURFACE_CARTELA_GROUPS);
  const bandHeads = brunoSurfaceSelectors(BRUNO_SURFACE_BAND_HEADS);

  return `
    /* ---- 1. Cards viram tile: perdem cartela, blur, borda e cantos. ------- */
    ${cards},
    ${active} {
      background: none;
      /* INVARIANTE: superfície estática, sem backdrop-filter. */
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: 0;
      border-radius: var(--bruno-subview-tile-radius, 0);
      box-shadow: none;
      isolation: isolate;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    /* Sheen e edge-glow da cartela não existem no tile. */
    ${before},
    ${after} {
      display: none;
    }

    /* ---- 2. MOLDURA da faixa inferior (main::before). --------------------
       Pseudo-elemento de um container grid participa como ITEM do grid, então
       a moldura é posicionada por grid-column/grid-row sem nenhum markup novo.
       Ela atravessa os gaps entre os cards e devolve a continuidade que a
       faixa da Home tem. A borda inferior dela cai exatamente sobre o
       separador que já existe acima de "Presença".
       A RECEITA é a mesma da faixa da Home, scrim preto incluso — era isso que
       faltava e fazia tudo parecer transparente. */
    ${root} main::before {
      content: "";
      grid-column: 1 / -1;
      /* REV.4 — a moldura vai da linha dos cards até a última linha do grid,
         ancorada na base (align-self: end). Assim ela ASSENTA em vez de flutuar.
         REV.9 (2026-07-29) — o rodapé de presença de 54px SAIU do grid das
         subviews (a presença virou badge da barra superior), então a faixa
         encosta na base do painel e a altura volta a ser exatamente a linha dos
         cards. A regra "grid-row: 2 / -1" continua correta: com uma linha a
         menos, -1 passou a ser o fim da própria linha dos cards.
         ATENCAO: NUNCA usar crase neste comentario. Ele vive DENTRO do template
         literal que comeca no "return" desta funcao — uma crase fecha a string,
         o modulo para de compilar, globalThis.BrunoSurfaceMaterial nunca e
         definido e TODAS as subviews perdem o material Josh de uma vez (a Home
         nao usa este modulo e fica intacta, o que disfarca a causa). Foi
         exatamente o que aconteceu em 2026-07-29.
         ANTERIOR (rollback): altura = linha dos cards + gap + rodapé (54px)
           calc(var(--ac-h, 320px) + var(--sala-gap, 10px) + 54px) */
      grid-row: var(--bruno-subview-band-row, 2) / -1;
      align-self: end;
      height: var(--bruno-subview-band-height, var(--ac-h, 320px));
      z-index: 0;
      pointer-events: none;
      margin: 0 calc(-1 * var(--bruno-subview-band-bleed, 0px));
      background:
        var(--bruno-subview-band-top-line, linear-gradient(transparent, transparent)) top center / 100% 1px no-repeat,
        var(--bruno-subview-band-bottom-line, linear-gradient(transparent, transparent)) bottom center / 100% 1px no-repeat,
        var(--bruno-subview-band-fill, none);
      backdrop-filter: var(--bruno-subview-band-filter, none);
      -webkit-backdrop-filter: var(--bruno-subview-band-filter, none);
      -webkit-mask-image: var(--bruno-subview-band-fade, none);
      mask-image: var(--bruno-subview-band-fade, none);
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-size: 100% 100%;
      mask-size: 100% 100%;
    }

    /* Cozinha: a faixa começa na linha própria dela (appliances) e segue até
       o fim do grid, mesma regra de altura das outras cinco. */
    ${root} main.cozinha-subview::before {
      grid-row: var(--bruno-subview-band-row-cozinha, 3) / -1;
    }

    /* Vestígio de rollback: desde a REV.9 o rodapé não é mais renderizado, então
       esta regra não tem alvo. Ela fica para o caso de o rodapé voltar — sem ela
       nasceriam duas réguas paralelas a 10px (o filete do rodapé e o da moldura). */
    ${root} .subview-footer::before {
      display: none;
    }

    /* Cards dentro da faixa não pintam nada — quem pinta é a moldura. */
    ${bandCards} {
      background: none;
    }

    /* Filete vertical entre tiles da mesma faixa. border-image para herdar o
       fade nas pontas sem pseudo-elemento (que o overflow:hidden recortaria). */
    ${dividers} {
      border-left: 1px solid transparent;
      border-image: var(--bruno-subview-tile-divider,
        linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.19) 22%, rgba(255,255,255,0.19) 78%, rgba(255,255,255,0) 100%)
      ) 1;
    }

    /* ---- 3. Nível 2 dentro da faixa: CONTENÇÃO, não só opacidade. --------
       Sobre plano chapado, alfa sozinho não cria hierarquia. Superfície mais
       marcada + borda + raio devolvem a leitura de bloco contido. */
    ${bandInner} {
      background: var(--bruno-subview-tile-inner-background,
        linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))
      );
      /* BLUR PRÓPRIO — seguro AQUI, e só aqui. O tile da faixa é estático
         (sem backdrop-filter), então estes blocos amostram o papel de parede
         e o fill da moldura diretamente: não há aninhamento, não há borrão
         sobre borrão. É esta segunda camada que cria a hierarquia entre o
         contêiner e seus componentes.
         CUIDADO: cada blur é uma camada de composição por frame. Aplicado no
         nível de AGRUPAMENTO (abas, moldura de câmera, tile de
         eletrodoméstico), não em cada elemento folha — mesma hierarquia, uma
         fração do custo no tablet. */
      backdrop-filter: var(--bruno-subview-tile-inner-filter, none);
      -webkit-backdrop-filter: var(--bruno-subview-tile-inner-filter, none);
      border: var(--bruno-subview-tile-inner-border, 1px solid rgba(255,255,255,0.16));
      border-radius: var(--bruno-subview-tile-inner-radius, 14px);
      box-shadow: var(--bruno-subview-tile-inner-shadow,
        inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 16px rgba(0,0,0,0.16)
      );
    }

    /* ---- 4. CARTELA da Iluminação = mesma composição dos cards dinâmicos.
       O container já lê a mesma cadeia de tokens dos cards dinâmicos da Home
       (surface-off-*, que sob VisionOS resolve para card-*). A ÚNICA
       divergência era geométrica: o radial daquela receita tem tamanho
       ABSOLUTO (360x240px). No card de Mídia (~430x248) ele cobre quase tudo
       e lê como lavagem uniforme; na Iluminação (~376x386) cobre só o topo e
       lê como bolha circular — o "efeito circular do VisionOS" relatado.
       Aqui o mesmo desenho é redeclarado em PORCENTAGEM, então acompanha a
       proporção do contêiner. A última camada continua sendo
       --ha-card-background (que o tema tablet zera): é justamente a ausência
       dessa base escura que produz a translucidez que virou identidade do
       painel. NÃO reintroduzir base preta nem sombra — seria voltar ao vidro
       fosco do VisionOS. */
    /* REV.7 — A CAUSA ERA O BLUR, NÃO A COR.
       Rodadas anteriores tentaram igualar a Iluminação aos cards dinâmicos
       mexendo em gradiente, alfa e scrim. Errado: a faixa parece transparente
       porque ela NÃO filtra — você vê a imagem NÍTIDA atrás, só escurecida
       pelo scrim. A Iluminação tinha backdrop-filter: blur(20px), e blur
       destrói a textura da foto; sem textura, qualquer superfície lê como
       painel chapado, por mais translúcida que seja a cor.
       Agora a Iluminação usa exatamente a MESMA receita da faixa: superfície
       estática, sem filtro, com o mesmo fill. É o material que o usuário
       aponta como correto, e passa a ser um só em toda a subview.
       NÃO reintroduzir backdrop-filter aqui. */
    /* REV.12 (2026-07-29) — A REV.7 ACIMA CONTINUA VALENDO COMO REGRA.
       A rev.9 declarou aqui que a REV.7 estava errada e reintroduziu o blur,
       porque o mapa de tokens do card dinamico traz backdrop-filter. Foi
       regressao: a Iluminacao virou uma lamina fosca e perdeu a translucidez
       que o usuario tinha aprovado.
       A distincao que faltava: o mapa do card dinamico e referencia de COR e
       CONTORNO (borda 0.105, edge-glow 1.0, sheen 0.13, raio 20px, sombra none
       — todos adotados), mas NAO de FILTRO. O mesmo valor de blur da resultados
       opostos porque o que fica ATRAS e diferente: na Home o card dinamico esta
       sobre o wallpaper da shell; aqui a cartela esta sobre a foto do comodo.
       Sem filtro a foto aparece nitida e a superficie le como vidro; com filtro
       a textura morre e tudo vira painel chapado.
       NAO reintroduzir backdrop-filter aqui — terceira vez que isso se decide. */
    /* REV.17: o microblur visual continua em 2px, mas deixa de viver no
       ancestral dos botoes. backdrop-filter no ancestral cria um backdrop
       root; por isso o blur forte das celulas nao conseguia amostrar a foto,
       embora consumisse exatamente os mesmos tokens do A/C. A amostragem de
       2px passa para um plano atras do conteudo, definido no pseudo-elemento
       abaixo. Fill, borda, raio, sombra e transparencia nao mudam. */
    ${soloCards} {
      background: var(--bruno-subview-cartela-background,
        var(--bruno-liquid-surface-off-background, var(--bruno-subview-band-fill, none))
      );
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: var(--bruno-subview-cartela-border, var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.105)));
      box-shadow: var(--bruno-subview-cartela-shadow, var(--bruno-liquid-surface-off-shadow, none));
      border-radius: var(--bruno-subview-cartela-radius, var(--bruno-liquid-card-radius, 20px));
    }

    /* O antigo edge-glow mascarado continuaria produzindo o arco interno.
       O pseudo-elemento e reutilizado como plano retangular transparente do
       microblur, sem mascara, glow, cor ou contorno. Assim o aspecto externo
       permanece, mas o plano nao se torna ancestral dos controles internos. */
    ${brunoSurfaceSelectors(BRUNO_SURFACE_SOLO_CARDS, '::after')} {
      display: block;
      inset: 0;
      z-index: 0;
      width: auto;
      height: auto;
      padding: 0;
      border-radius: inherit;
      background: rgba(255,255,255,0.001);
      backdrop-filter: var(--bruno-subview-cartela-filter,
        var(--bruno-liquid-surface-off-filter, none));
      -webkit-backdrop-filter: var(--bruno-subview-cartela-filter,
        var(--bruno-liquid-surface-off-filter, none));
      -webkit-mask: none;
      mask: none;
      opacity: 1;
    }

    /* O sheen do container segue o mesmo valor dos cards dinamicos (0.13),
       e nao o fallback de 0.74 da cartela de subview — era mais um ponto em
       que os dois divergiam. */
    ${brunoSurfaceSelectors(BRUNO_SURFACE_SOLO_CARDS, '::before')} {
      z-index: 1;
      opacity: var(--bruno-subview-cartela-sheen-opacity, 0.13);
    }

    ${brunoSurfaceSelectors(BRUNO_SURFACE_SOLO_CARDS, ' > *')} {
      z-index: 2;
    }

    /* REV.16: somente os controles internos de luz recebem o mesmo pacote
       material dos controles do A/C. O microblur externo de 2px permanece
       intocado; esta amostragem localizada restaura a hierarquia interna. */
    ${cartelaInner} {
      background: var(--bruno-subview-cartela-inner-background,
        linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))
      );
      /* Fallback rapido: restaurar os tokens da REV.15 remove apenas este
         material interno, sem tocar na superficie externa da subview. */
      backdrop-filter: var(--bruno-subview-cartela-inner-filter, none);
      -webkit-backdrop-filter: var(--bruno-subview-cartela-inner-filter, none);
      border: var(--bruno-subview-cartela-inner-border, 1px solid rgba(255,255,255,0.16));
      border-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
      border-radius: var(--bruno-subview-cartela-inner-radius, var(--bruno-liquid-control-radius-compact, 12px));
      box-shadow: var(--bruno-subview-cartela-inner-shadow, inset 0 1px 0 rgba(255,255,255,0.07));
    }

    /* Zona do acordeão: agrupador com DEMARCAÇÃO DISCRETA, sem blur.
       REV.8 — na rev.7 ela ficou totalmente transparente e as seções (Sala,
       Varanda) perderam qualquer delimitação, ficando "soltas".
       POR QUE NÃO BLUR AQUI: a zona é ANCESTRAL dos tiles de luz, e os tiles
       já têm blur próprio (que ficou correto). Blur na zona faria os tiles
       borrarem um backdrop já borrado — o mesmo aninhamento que arruinou a
       moldura da Home nas rev.5/6. Como a hierarquia já vem do blur dos
       tiles, aqui basta a borda: é a alternativa que o próprio usuário
       autorizou, e a única compatível com a invariante.
       O contorno é o mesmo idioma dos filetes: fino e translúcido. */
    ${cartelaGroups} {
      background: var(--bruno-subview-cartela-group-background, none);
      border: var(--bruno-subview-cartela-group-border, 1px solid rgba(255,255,255,0.10));
      box-shadow: var(--bruno-subview-cartela-group-shadow, none);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    /* ---- 5. Ritmo comum dos cabeçalhos da faixa. -------------------------
       Vídeo, acordeão e gauge têm paddings e escalas distintos. Uma altura e
       um respiro comuns dão o mínimo de série que a continuidade de fundo
       sozinha não entrega. Não toca no conteúdo interno dos blocos. */
    ${bandHeads} {
      min-height: var(--bruno-subview-band-head-height, 34px);
      padding-bottom: var(--bruno-subview-band-head-gap, 8px);
      display: flex;
      align-items: center;
    }
  `;
}

// ---------------------------------------------------------------------------
// ANTERIOR (rollback) — receita de CARTELA (material Josh das subviews, rev.1).
// Preservada integralmente. Para voltar: trocar a referência em
// `subviewStyles` de brunoSubviewTileStyles para brunoSubviewMaterialStyles.
// ---------------------------------------------------------------------------
function brunoSubviewMaterialStyles() {
  const cards = brunoSurfaceSelectors(BRUNO_SURFACE_TILE_CARDS);
  const before = brunoSurfaceSelectors(BRUNO_SURFACE_TILE_CARDS, '::before');
  const after = brunoSurfaceSelectors(BRUNO_SURFACE_TILE_CARDS, '::after');

  return `
    ${cards} {
      background: var(--bruno-josh-subview-surface-background);
      -webkit-backdrop-filter: var(--bruno-josh-subview-surface-filter);
      backdrop-filter: var(--bruno-josh-subview-surface-filter);
      border: var(--bruno-josh-subview-surface-border);
      box-shadow: var(--bruno-josh-subview-surface-shadow);
      isolation: isolate;
      overflow: hidden;
    }

    ${before} {
      content: "";
      position: absolute;
      inset: 1px;
      z-index: 0;
      pointer-events: none;
      border-radius: inherit;
      background: var(--bruno-josh-subview-surface-sheen);
      opacity: var(--bruno-josh-subview-surface-sheen-opacity);
    }

    ${after} {
      content: "";
      display: block;
      position: absolute;
      inset: 0;
      z-index: 4;
      width: auto;
      height: auto;
      padding: 1px;
      pointer-events: none;
      border-radius: inherit;
      background: var(--bruno-josh-subview-surface-edge-glow);
      -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      mask-composite: exclude;
      opacity: var(--bruno-josh-subview-surface-edge-opacity);
    }
  `;
}

globalThis.BrunoSurfaceMaterial = {
  version: BRUNO_SURFACE_MATERIAL_VERSION,
  connect: brunoSurfaceConnect,
  disconnect: brunoSurfaceDisconnect,
  sync: brunoSurfaceSyncTheme,
  // ANTERIOR (rollback): subviewStyles: brunoSubviewMaterialStyles,
  subviewStyles: brunoSubviewTileStyles,
  materialStyles: brunoSubviewMaterialStyles,
};
