// ============================================================================
// bruno-josh.js — Tema "Josh.ai".
//
// REV.2 (2026-07-26) — TEMA HÍBRIDO, por decisão do usuário:
//   base VisionOS para TODO o painel (subviews, cards dinâmicos, popups,
//   rail, faixas) + APENAS a faixa de cômodos/ações em tiles.
//
// ANTERIOR (2026-07-24): o tema era delta sobre o iOS Dark e sobrescrevia a
// superfície de card global (cinza quente opaco). Efeito colateral relatado:
// TODO o dashboard virava cinza — Roborock, mídia, câmera, energia, agenda e
// as 7 subviews — enquanto o foco era só a faixa de cômodos. Os valores
// daquela superfície seguem comentados abaixo para quando a identidade
// própria do Josh.ai for desenvolvida para o painel inteiro (fase futura).
//
// O QUE ESTE TEMA MUDA HOJE (e só isto):
//   1. --bruno-tile-*  : pele dos 7 cards da faixa quando em modo tile;
//   2. --bruno-strip-* : banda full-bleed que os contém (+ dock);
//   3. --bruno-tile-mode: on : o interruptor que os cards leem.
//   4. --bruno-subview-card-edge-* : edge-glow dos cards das subviews.
// Todo o resto vem do VisionOS, idêntico a quem usa VisionOS puro.
//
// Registro: bruno-theme-manager.js (key 'josh', label 'Josh.ai').
// Resource: configuration.yaml (carregar DEPOIS de bruno-visionos.js).
// FALLBACK: comentar o resource + a entrada no theme-manager; nenhum outro
// arquivo depende deste.
// ============================================================================

const BRUNO_JOSH_VERSION = '20260802-josh-popup-material-1';
const BRUNO_JOSH_STYLE_ID = 'bruno-liquid-glass-tokens';
// A base é resolvida no momento da aplicação, não na avaliação do módulo.
// Isso elimina a corrida de carregamento que podia congelar Liquid Glass ou
// iOS Dark como base do Josh em navegadores mais lentos. Josh depende apenas
// do VisionOS; os demais temas continuam alternativas selecionáveis, não
// fallbacks visuais deste tema.
function brunoJoshVisionOSBase() {
  return globalThis.BrunoVisionOSOriginal || globalThis.BrunoVisionOS || null;
}

const BRUNO_JOSH_OVERRIDES = {
  // Microblur Josh controlado: uma unica amostragem por superficie principal.
  // Fills, scrims, bordas, filetes, sheen e edge-glow permanecem inalterados.
  'bruno-josh-microblur': 'blur(2px)',
  'bruno-liquid-card-filter': 'var(--bruno-josh-microblur, blur(2px)) saturate(1.18) brightness(1.03)',
  'bruno-liquid-surface-off-filter': 'var(--bruno-liquid-card-filter)',
  'bruno-liquid-surface-on-filter': 'var(--bruno-josh-microblur, blur(2px)) saturate(0.92) brightness(1.05) contrast(1.02)',

  // --- ANTERIOR (rollback / base da futura identidade Josh.ai global) ------
  // Superfície de card cinza quente, sólida e flat. DESATIVADA na rev.2
  // porque valia para TODOS os cards do painel, não só para a faixa.
  // 'bruno-liquid-card-background': 'linear-gradient(172deg, rgb(104,100,96), rgb(86,83,79) 62%, rgb(92,88,83))',
  // 'bruno-liquid-card-filter': 'none',
  // 'bruno-liquid-card-border': '1px solid rgba(255,255,255,0.14)',
  // 'bruno-liquid-card-shadow': '0 10px 24px rgba(0,0,0,0.24)',
  // 'bruno-liquid-card-sheen': 'none',
  // 'bruno-liquid-card-sheen-opacity': '0',
  // 'bruno-liquid-card-edge-glow': 'none',
  // 'ha-card-background': 'rgba(96,92,88,0.94)',
  // ------------------------------------------------------------------------

  // Room-subview cards already consume the same VisionOS `surface-off-*`
  // material as the dynamic cards. These Josh-only geometry tokens complete
  // that material by turning the old bottom-line pseudo-element into the same
  // masked perimeter edge glow used by the dynamic Media card.
  'bruno-subview-card-edge-display': 'block',
  'bruno-subview-card-edge-inset': '0',
  'bruno-subview-card-edge-z': '4',
  'bruno-subview-card-edge-height': 'auto',
  'bruno-subview-card-edge-padding': '1px',
  'bruno-subview-card-edge-radius': 'inherit',
  'bruno-subview-card-edge-background': 'var(--bruno-liquid-surface-edge-glow)',
  'bruno-subview-card-edge-opacity': '0.70',
  'bruno-subview-card-edge-mask': 'linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)',
  'bruno-subview-card-edge-webkit-composite': 'xor',
  'bruno-subview-card-edge-composite': 'exclude',

  // ======================================================================
  // SUBVIEWS EM MODO TILE (2026-07-27) — mesma linguagem da faixa da Home.
  // Consumidos por core/bruno-surface-material.js, que escopa tudo em
  // :host([data-bruno-subview-surface-theme="josh"]) — nenhum outro tema é
  // afetado. Os valores abaixo são LITERALMENTE os da faixa de cômodos:
  // mesmo véu, mesmos dois filetes, mesmo divisor vertical.
  // INVARIANTE: nada de backdrop-filter no tile (superfície estática).
  // ======================================================================
  // ---- MOLDURA da faixa inferior (main::before nas subviews) -------------
  // ANTERIOR (rev.1 — o erro): o fill era só `linear-gradient(rgba(255,255,255,
  // 0.030) -> 0.012)`, um véu de 3% de branco SEM base escura. Sobre foto isso
  // é praticamente invisível — daí a queixa de "completamente transparente",
  // evidente na Cozinha, cuja imagem de fundo é mais clara.
  // AGORA: receita IDÊNTICA à da faixa de cômodos da Home, cuja última camada
  // é um scrim preto de 30% — é ele que cria o contraste tonal com o fundo.
  'bruno-subview-band-fill': 'radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%), linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)',
  'bruno-subview-band-filter': 'var(--bruno-josh-microblur, blur(2px))',
  // Filetes com realce no centro, como os da Home (antes: chapados 0.20/0.12).
  'bruno-subview-band-top-line': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)',
  'bruno-subview-band-bottom-line': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)',
  // ANTERIOR (rev.3): 24px por ponta, copiado da Home ao pé da letra. Lá a
  // faixa tem ~1245px e as pontas caem sobre a base já escura do hero; aqui
  // a faixa tem ~1310px e as pontas caem sobre lambri claro e sobre a borda
  // atmosférica da shell — 24px é 1,8% da largura, proporcionalmente
  // invisível, e a ponta terminava em corte reto.
  // 'bruno-subview-band-fade': 'linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
  'bruno-subview-band-fade': 'linear-gradient(90deg, transparent 0, #000 110px, #000 calc(100% - 110px), transparent 100%)',
  // Sangra até a borda do viewport (content-slot da shell tem padding 12px).
  'bruno-subview-band-bleed': '12px',

  'bruno-subview-tile-divider': 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.19) 22%, rgba(255,255,255,0.19) 78%, rgba(255,255,255,0) 100%)',
  'bruno-subview-tile-radius': '0',
  // ANTERIOR (rev.3): 'bruno-subview-tile-bleed': '12px' — sangrava só a
  // Iluminação, que por ser o único bloco a sangrar desalinhava da coluna
  // abaixo. A Iluminação voltou a ser cartela e não sangra mais.

  // ---- Nível 2 DENTRO da faixa (plano chapado) ---------------------------
  // Correção de FORMA, não de opacidade: sobre plano chapado o alfa sozinho
  // não cria hierarquia. Borda e raio devolvem a leitura de bloco contido.
  'bruno-subview-tile-inner-background': 'linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))',
  'bruno-subview-tile-inner-border': '1px solid rgba(255,255,255,0.16)',
  'bruno-subview-tile-inner-radius': '14px',
  'bruno-subview-tile-inner-shadow': 'inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 16px rgba(0,0,0,0.16)',

  // REV.15: o microblur externo continua em 2px, mas os agrupadores internos
  // recuperam o filtro forte anterior para restabelecer a hierarquia do Hub,
  // cameras e eletrodomesticos. Nao ampliar este filtro para a faixa externa.
  'bruno-subview-tile-inner-filter': 'blur(14px) saturate(1.10)',

  // ---- CARTELA da Iluminacao = MESMOS TOKENS dos cards dinamicos ---------
  // REV.9 (2026-07-29). As revisoes 6/7/8 calibraram esta cartela no olho, com
  // valores proprios, e o resultado divergia do card dinamico em CINCO pontos:
  //   1. faltava o radial de topo  -> era o "esbranquicado" que o card tem;
  //   2. sobrava um scrim de 30%   -> o card dinamico NAO tem base escura,
  //      porque o tema tablet zera --ha-card-background;
  //   3. backdrop-filter: none     -> o card tem blur(20px) sat(1.18) bri(1.03);
  //   4. borda 0.10                -> o card usa 0.105;
  //   5. edge-glow a 0.70          -> no card a opacidade e 1.
  //
  // A CADEIA REAL do card dinamico (ex.: .media-card em bruno-media-card.js):
  //   --bruno-liquid-surface-off-*  (o Josh NAO sobrescreve — ver bloco abaixo)
  //   -> --bruno-liquid-card-*      (bruno-visionos.js, a base do Josh)
  //   -> --ha-card-background: none / --ha-card-box-shadow: none (tablet.yaml)
  //
  // Em vez de copiar valores, a cartela agora APONTA para os mesmos tokens.
  // Nao ha duplicacao: se o card dinamico mudar, a Iluminacao acompanha, e a
  // divergencia deixa de ser possivel por construcao.
  //
  // O radial volta junto com o blur, e isso NAO e opcional: sem filtro o radial
  // pousa sobre a foto nitida e le como uma bolha de borda dura (foi o "efeito
  // circular" da rev.8). Com blur(20px) ele dissolve, exatamente como no card
  // dinamico. Os dois andam juntos — nao remover um sem o outro.
  //
  // ANTERIOR (rollback rev.8):
  //   'bruno-subview-cartela-background': 'linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)',
  //   'bruno-subview-cartela-border': '1px solid rgba(255,255,255,0.10)',
  //   'bruno-subview-cartela-shadow': 'none',
  // REV.11 (2026-07-29) — O RADIAL SAI, e SO ele.
  // Eu argumentei que a "linha circular" nao podia ser o radial porque ele faz
  // parte da receita do card dinamico. Estava errado: no print do bloco aberto
  // o arco atravessa o painel inteiro, inconfundivel.
  // POR QUE aparece aqui e nao no card dinamico: o radial de 360x240 com alfa
  // 0.105 caindo para transparent em 64% e uma rampa longa e de alfa
  // baixissimo. Sobre a superficie do card dinamico ela se dissolve; aqui
  // ela pousa sobre um backdrop BORRADO (blur 20px), que e liso e sem textura,
  // e a rampa passa a exibir banding — os degraus viram arcos concentricos.
  // Textura mascara banding; superficie lisa denuncia.
  // Todas as OUTRAS camadas seguem token-identicas ao card dinamico: mesmo
  // linear-gradient e mesma ultima camada var(--ha-card-background), que o tema
  // tablet zera (sem base escura). Filtro, borda, sombra, raio, sheen e
  // edge-glow continuam vindo de --bruno-liquid-surface-off-*.
  // ANTERIOR (rollback): 'var(--bruno-liquid-surface-off-background)'
  // REV.12 (2026-07-29) — O BLUR VOLTA A SAIR. A REV.7 ESTAVA CERTA.
  // A rev.9 leu o mapa de tokens do card dinamico e aplicou TODOS ao pe da
  // letra, blur incluso, declarando que a nota da REV.7 estava errada. Nao
  // estava. O registro no CLAUDE.md termina com "NAO reintroduzir
  // backdrop-filter aqui" e o motivo continua valendo:
  //   a Iluminacao le como TRANSLUCIDA porque NAO filtra — a foto atras aparece
  //   NITIDA, so escurecida pelo scrim. blur(20px) destroi a textura, e sem
  //   textura qualquer superficie vira painel chapado, por mais translucida que
  //   seja a cor.
  // LICAO: o mapa de tokens do card dinamico e a referencia de COR e CONTORNO,
  // nao de FILTRO. O filtro depende do que esta atras: na Home o card dinamico
  // fica sobre o wallpaper da shell; aqui a cartela fica sobre a foto do comodo,
  // e o resultado do mesmo valor e oposto.
  // O radial tambem nao volta (rev.11): sem filtro ele vira arco por banding.
  // O que FICA do mapa: borda 0.105, edge-glow 1.0, sheen 0.13, raio 20px,
  // sombra none — tudo confirmado igual ao card dinamico.
  // ANTERIOR (rollback rev.9/rev.11):
  //   background sem scrim (var(--ha-card-background) = none pelo tablet.yaml)
  //   filter: 'var(--bruno-liquid-surface-off-filter)'
  'bruno-subview-cartela-background': 'linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)',
  // REV.14: excecao controlada e aprovada para blur de apenas 2px. Os filhos
  // ficam sem filtro; isto nao reintroduz a receita destrutiva de 20px.
  'bruno-subview-cartela-filter': 'var(--bruno-josh-microblur, blur(2px))',
  'bruno-subview-cartela-border': 'var(--bruno-liquid-surface-off-border)',
  'bruno-subview-cartela-shadow': 'var(--bruno-liquid-surface-off-shadow)',
  'bruno-subview-cartela-radius': 'var(--bruno-liquid-card-radius, 20px)',
  'bruno-subview-cartela-sheen-opacity': 'var(--bruno-liquid-surface-off-sheen-opacity, 0.13)',
  // O ::after da cartela e o mesmo edge-glow dos cards dinamicos, mas o token
  // global das subviews o entrega a 0.70. No card dinamico a opacidade e 1 —
  // era essa a "borda que nao bate". Override so para a cartela; os demais
  // cards da subview seguem em 0.70.
  'bruno-subview-cartela-edge-opacity': '1',

  // Zona do acordeao: agrupador transparente, para a Iluminacao com acordeao
  // (Sala, quartos) nao ficar mais pesada que a sem acordeao (Office, Cozinha).
  // REV.8: borda discreta em vez de transparente — as secoes do acordeao
  // tinham perdido qualquer demarcacao. Blur aqui nao e possivel: a zona e
  // ancestral dos tiles, que ja tem blur proprio (ver a nota no modulo).
  'bruno-subview-cartela-group-background': 'none',
  'bruno-subview-cartela-group-border': '1px solid rgba(255,255,255,0.10)',
  'bruno-subview-cartela-group-shadow': 'none',

  // ---- Nível 2 DENTRO da cartela da Iluminação ---------------------------
  // REV.15: excecao localizada. A cartela externa conserva apenas 2px; as
  // celulas pequenas recuperam o filtro anterior para devolver a hierarquia
  // sem alterar o material nem a geometria do bloco principal.
  // REV.16: as celulas de luz usam exatamente o mesmo pacote material dos
  // controles do A/C. O escopo continua restrito aos seletores de luz do
  // bruno-surface-material.js; geometria, gaps e card externo nao mudam.
  'bruno-subview-cartela-inner-background': 'var(--bruno-liquid-control-background)',
  'bruno-subview-cartela-inner-filter': 'var(--bruno-liquid-control-filter)',
  'bruno-subview-cartela-inner-border': 'var(--bruno-liquid-control-border)',
  'bruno-subview-cartela-inner-border-color': 'var(--bruno-liquid-control-border-color, rgba(255,255,255,0.070))',
  'bruno-subview-cartela-inner-radius': 'var(--bruno-liquid-control-radius-compact, 12px)',
  'bruno-subview-cartela-inner-shadow': 'var(--bruno-liquid-control-shadow)',

  // ---- Popups Josh.ai ----------------------------------------------------
  // REV.18: aliases, sem copiar RGBA. O plano externo dos popups aponta para
  // o mesmo pacote surface-off ja aprovado nos cards Josh; controles internos
  // continuam usando o pacote control. Nenhum outro tema consome estes nomes.
  'bruno-josh-popup-background': 'var(--bruno-liquid-surface-off-background)',
  'bruno-josh-popup-filter': 'var(--bruno-liquid-surface-off-filter)',
  'bruno-josh-popup-border': 'var(--bruno-liquid-surface-off-border)',
  'bruno-josh-popup-shadow': 'var(--bruno-liquid-surface-off-shadow)',
  'bruno-josh-popup-sheen': 'var(--bruno-liquid-surface-off-sheen)',
  'bruno-josh-popup-sheen-opacity': 'var(--bruno-liquid-surface-off-sheen-opacity, 0.13)',
  'bruno-josh-popup-edge-glow': 'var(--bruno-liquid-surface-edge-glow)',
  'bruno-josh-popup-edge-opacity': '0.70',

  // ---- Ritmo comum dos cabeçalhos da faixa -------------------------------
  'bruno-subview-band-head-height': '34px',
  'bruno-subview-band-head-gap': '8px',

  // Josh-only room-subview material. Values are the concrete fallback recipe
  // declared by BrunoMediaCard itself, not aliases of the VisionOS surface.
  // Only bruno-surface-material.js consumes these namespaced tokens.
  'bruno-josh-subview-surface-background': 'linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)), rgba(9,11,15,0.105)',
  'bruno-josh-subview-surface-filter': 'blur(18px) saturate(0.92) brightness(1.05) contrast(1.02)',
  'bruno-josh-subview-surface-border': '1px solid rgba(255,255,255,0.070)',
  'bruno-josh-subview-surface-shadow': 'inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145)',
  'bruno-josh-subview-surface-sheen': 'linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%)',
  'bruno-josh-subview-surface-sheen-opacity': '0.10',
  'bruno-josh-subview-surface-edge-glow': 'linear-gradient(125deg, rgba(255,255,255,0.11), rgba(255,255,255,0.026) 38%, rgba(255,255,255,0.010) 100%)',
  'bruno-josh-subview-surface-edge-opacity': '0.70',

  // --- Moldura da faixa de cômodos (Home V2) ---
  // ANTERIOR (rev.4/rev.7 — moldura em CARTELA, mantido para rollback):
  // 'bruno-strip-frame-background': 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
  // 'bruno-strip-frame-border': '1px solid rgba(255,255,255,0.11)',
  // 'bruno-strip-frame-filter': 'none',   // obrigatorio enquanto os tiles filtravam
  // 'bruno-strip-frame-shadow': 'inset 0 1px 0 rgba(255,255,255,0.10)',

  // ======================================================================
  // HOME V3 (2026-07-26) - TILES + BANDA AUTONOMA, exclusivos DESTE tema.
  //
  // Interruptor: `bruno-tile-mode: on`. Os 7 cards de comodo leem este
  // token (getComputedStyle) e so entram em modo tile quando ele vale 'on'
  // E o YAML passa `variant: tile` (faixa do desktop V2). Como nenhum outro
  // tema declara o token, iOS / visionOS / Liquid Glass continuam com o
  // visual de cartela EXATAMENTE como hoje, no desktop e no phone.
  //
  // A banda nao herda a superficie completa dos cards dinamicos. Ela usa
  // uma receita estatica propria, sem blur, borda ou sombra de cartela. Isso
  // evita backdrop roots e elimina divergencias de composicao entre PC e
  // tablet. Os filetes superior e inferior sao camadas independentes.
  // ======================================================================
  'bruno-tile-mode': 'on',
  // Gap entre tiles: 0 (o filete vertical substitui o antigo gap de 10px).
  'bruno-tile-gap': '0px',
  // ---- Insets laterais: recuperados para acomodar o 8o tile --------------
  // ANTERIOR (7 tiles): 22px/38px = 60px reservados apenas para LIMITAR a
  // largura individual dos tiles. Sem funcao estrutural — era espaco morto.
  // 'bruno-tile-grid-inline-inset': '30px',
  // 'bruno-tile-grid-inset-start': '22px',
  // 'bruno-tile-grid-inset-end': '38px',
  //
  // NOVO (8 tiles, com o Corredor): 8px/12px = 20px. Os 40px liberados vao
  // direto para as tracks, o que absorve boa parte do custo da coluna extra.
  // A assimetria menor (start < end) preserva o mesmo vies otico de antes,
  // mantendo a faixa centrada no conteudo util ao lado da rail.
  // MEDIDAS REAIS (largura util = W - 86 de rail - 24 de padding do ha-card
  // - 20 de inset): tile = (W - 130) / 8.
  //   W=1382 (janela de teste): 156px  ·  W=1920 (tablet): 224px
  // No tablet a coluna de icone fica em ~154px, acima do max-width de 120px
  // do PNG — ou seja, os assets NAO encolhem no dispositivo-alvo.
  'bruno-tile-grid-inline-inset': '10px',
  'bruno-tile-grid-inset-start': '8px',
  'bruno-tile-grid-inset-end': '12px',
  'bruno-tile-background': 'none',
  'bruno-tile-border': '0',
  'bruno-tile-radius': '0',
  'bruno-tile-shadow': 'none',
  'bruno-tile-filter': 'none',
  'bruno-tile-sheen-opacity': '0',
  // Status dots da faixa: mesma linguagem flat da rail, calibrada para o
  // diametro maior de 26px. Sem borda, gradiente ou brilho interno; apenas
  // preenchimento semantico e um halo curto para separar do wallpaper.
  'bruno-tile-status-dot-fill-alpha': '0.78',
  'bruno-tile-status-dot-border': '0',
  'bruno-tile-status-dot-halo-size': '8px',
  'bruno-tile-status-dot-halo-alpha': '0.18',
  'bruno-tile-divider': 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.19) 22%, rgba(255,255,255,0.19) 78%, rgba(255,255,255,0) 100%)',
  // Afordancia de ACESO sem vidro: filete quente na base + brilho difuso.
  // (O asset `-on` do PNG e o clareamento de texto do .is-room-on continuam
  // valendo — sao hardcoded nos cards.)
  'bruno-tile-on-line': 'linear-gradient(90deg, rgba(255,187,72,0) 0%, rgba(255,187,72,0.42) 50%, rgba(255,187,72,0) 100%)',
  'bruno-tile-on-glow': 'radial-gradient(60px 30px at 50% 100%, rgba(255,187,72,0.10), transparent 72%)',

  // --- Banda (faixa de comodos + acoes rapidas) ---
  // A tinta replica o material INTERNO resolvido dos cards dinamicos no
  // VisionOS: tres camadas luminosas sobre base preta 0.30. Borda, sombra,
  // sheen perimetral e blur(20px) permanecem de fora para evitar cartela e
  // backdrop root na superficie grande. Os valores sao literais para nao
  // depender da ordem de carga dos temas.
  'bruno-strip-frame-radius': '0px',
  'bruno-strip-frame-border': '0',
  'bruno-strip-frame-shadow': 'none',
  'bruno-strip-frame-background': 'transparent',
  'bruno-strip-frame-filter': 'var(--bruno-josh-microblur, blur(2px))',
  'bruno-strip-frame-fill': 'radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%), linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)',
  'bruno-strip-frame-fill-opacity': '1',
  // Dissolve somente a tinta nos 24px laterais. O container, os tiles e os
  // filetes continuam sem mask, evitando a antiga moldura perimetral.
  'bruno-strip-frame-fill-fade': 'linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
  // Filetes reais, sem mask perimetral: nao existem segmentos laterais nem
  // cantos capazes de formar uma moldura fechada.
  'bruno-strip-frame-top-line': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)',
  'bruno-strip-frame-bottom-line': 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)',
  'bruno-strip-frame-lines-opacity': '1',
  // Neutraliza os tokens antigos para permitir fallback imediato sem deixar
  // camadas residuais se um navegador conservar CSS de uma revisao anterior.
  'bruno-strip-frame-sheen': 'none',
  'bruno-strip-frame-sheen-opacity': '0',
  'bruno-strip-frame-edge-glow': 'none',
  'bruno-strip-frame-edge-glow-opacity': '0',
  'bruno-strip-bleed': '0px',
  // ---- Sangramento assimetrico (recuperacao de espaco morto) -------------
  // O grid da secao reserva uma coluna `sidebar` de 0px + um gap de 10px
  // entre a rail e a faixa: espaco sem funcao. O start de 10px recupera esse
  // gap sem encostar na rail (a faixa passa a comecar na borda da caixa de
  // conteudo, a 12px da rail). O end de 12px leva a faixa ate a borda do
  // viewport, absorvendo o padding do content-slot.
  // Ganho liquido: 22px de largura util, que vao para as tracks.
  'bruno-strip-bleed-start': '10px',
  'bruno-strip-bleed-end': '12px',
  'bruno-strip-mask': 'none',
};

function brunoJoshTokens() {
  const base = brunoJoshVisionOSBase();
  return Object.assign({}, base?.tokens || {}, BRUNO_JOSH_OVERRIDES);
}

// ANTERIOR (rollback — junto da superfície cinza global desativada acima):
// espelhamento surface-off -> card, herdado do padrão do iOS Dark. Não é
// mais necessário: a base VisionOS já faz esse alias e a superfície dos
// cards agora vem INTEIRA dela. Reativar apenas quando a identidade própria
// do Josh.ai for estendida para todo o painel.
// Object.assign(BRUNO_JOSH_TOKENS, {
//   'bruno-liquid-surface-off-background': 'var(--bruno-liquid-card-background)',
//   'bruno-liquid-surface-off-filter': 'var(--bruno-liquid-card-filter)',
//   'bruno-liquid-surface-off-border': 'var(--bruno-liquid-card-border)',
//   'bruno-liquid-surface-off-shadow': 'var(--bruno-liquid-card-shadow)',
//   'bruno-liquid-surface-off-sheen': 'var(--bruno-liquid-card-sheen)',
//   'bruno-liquid-surface-off-sheen-opacity': 'var(--bruno-liquid-card-sheen-opacity)',
//   'bruno-liquid-surface-edge-glow': 'var(--bruno-liquid-card-edge-glow)',
// });

const BRUNO_JOSH_GLOBAL_CSS = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: rgba(0,0,0,0.12);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}
@keyframes bruno-liquid-route-fade { 0% { opacity: 0; } 36% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after { -webkit-backdrop-filter: none; backdrop-filter: none; animation-duration: 180ms; }
}
`;

function brunoJoshSerialize(tokens) {
  return Object.entries(tokens)
    .map(([name, value]) => `  --${name}: ${String(value).trim().replace(/\s+/g, ' ')};`)
    .join('\n');
}

function brunoJoshApply(root = globalThis.document) {
  if (!root?.head) return null;
  const base = brunoJoshVisionOSBase();
  if (!base?.tokens) {
    console.error('[BrunoJosh] VisionOS base unavailable; Josh was not applied.');
    return null;
  }
  let style = root.getElementById(BRUNO_JOSH_STYLE_ID);
  if (!style) {
    style = root.createElement('style');
    style.id = BRUNO_JOSH_STYLE_ID;
    root.head.appendChild(style);
  }
  style.textContent = `:root {\n${brunoJoshSerialize(brunoJoshTokens())}\n}\n${BRUNO_JOSH_GLOBAL_CSS}`;
  return style;
}

globalThis.BrunoJosh = {
  version: BRUNO_JOSH_VERSION,
  get tokens() { return brunoJoshTokens(); },
  get surfaces() { return brunoJoshVisionOSBase()?.surfaces || {}; },
  get states() { return brunoJoshVisionOSBase()?.states || {}; },
  apply: brunoJoshApply,
  feedback: (...args) => brunoJoshVisionOSBase()?.feedback?.(...args) || false,
  routeTransition: (...args) => brunoJoshVisionOSBase()?.routeTransition?.(...args),
};
