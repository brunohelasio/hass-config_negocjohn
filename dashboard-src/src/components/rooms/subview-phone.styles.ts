import { css } from 'lit';

/**
 * Layout de TELEFONE das subviews de cômodo — Cenário B.
 *
 * ─── Por que este arquivo existe, separado do gerado ───────────────────────
 *
 * `subview-styles.generated.ts` é TRANSCRIÇÃO: sai do gerador, que lê os seis
 * arquivos originais e reemite o CSS deles sem inventar nada. Este bloco é
 * DESENHO NOVO — não pode nascer de um gerador que não tem de onde tirá-lo.
 * Misturar os dois no mesmo arquivo tornaria o gerado irregenerável.
 *
 * ─── O que ele substitui ───────────────────────────────────────────────────
 *
 * O CSS gerado traz oito blocos `@media (max-width: 800px)` herdados dos
 * originais. Um deles, com 35 regras, é o tratamento COMPLETO de telefone — e
 * está preso ao seletor `[data-tvhub]`, que só a Sala satisfaz (só ela tem
 * `tv:` na configuração). Os outros quatro cômodos de corpo padrão recebiam
 * uma regra só: empilhar. Daí câmera e hub lado a lado com 180px cada.
 *
 * Este bloco vem DEPOIS de todos eles em `static styles` e usa o prefixo
 * `:host([data-room]) .room-subview` — especificidade (0,4,0), que empata com
 * a maior existente (a da Cozinha) e vence por posição. Nada foi apagado: os
 * blocos antigos continuam lá e ficam integralmente sombreados.
 *
 * ─── A composição (decisão do usuário, 2026-08-10) ─────────────────────────
 *
 *   Status (rolagem horizontal)
 *   Câmera            ← não se move nunca
 *   Cortina           ← card próprio, saiu de cima da foto
 *   Iluminação        ┐
 *   Ar-condicionado   ├ linhas-resumo; tocar traz o módulo como bottom sheet
 *   Mídia             ┘
 *
 * A folha sobe pela base, cobre as linhas e para acima do dock, que permanece
 * visível. O fundo escurece — MENOS a câmera, que fica reconhecível acima dele.
 * Esse laço (acionar e ver o efeito) é a razão de o Cenário B ter sido
 * escolhido; ver docs/28-fase-6.3-confronto-com-o-codigo.md §9.
 *
 * ─── Rollback ──────────────────────────────────────────────────────────────
 *
 * Remover este bloco do array `static styles` em `bruno-room-subview.ts`. Os
 * blocos antigos voltam a valer e o telefone retorna ao estado de 2026-08-10.
 */
export const SUBVIEW_TELEFONE_CSS = css`
  @media (max-width: 800px) {
    /* ══ 1. A MOLDURA ═══════════════════════════════════════════════════════ */

    :host([data-room]) {
      height: auto;
      /* A folha é ancorada na base da subview; sem esta linha a subview teria
         a altura do conteúdo (671px) e a folha subiria no lugar errado. */
      min-height: 100%;
      overflow: visible;
      /* ANTERIOR (rollback): o WebView podia escolher a subview como âncora ao
         montar uma folha fixed e deslocar Office/Quartos alguns pixels. */
      overflow-anchor: none;
    }

    :host([data-room]) .room-subview {
      overflow-anchor: none;
      /* Reserva acima da folha: o que fica entre o topo e o fim da câmera.
         Medido a 428px; a folha nunca ultrapassa este limite, então a câmera
         é preservada por construção e não por sorte de aritmética. */
      /* ── A CÂMERA É O ELEMENTO DOMINANTE (itens 3 e 23) ───────────────────
         ANTERIOR (rollback rev. faixa-de-tiles): --fone-reserva: 372px e palco
         em 58vw (248px a 428 de largura). Medido a 428x926: a composicao
         terminava em y=654 e sobravam 214px mortos acima do dock — um quarto da
         tela vazio. Na Cozinha, que nao tem cortina, sobravam 403px.

         Essa tentativa foi substituida depois do aceite no aparelho: o palco
         volta a 16:9 e a area restante e espaco negativo intencional. A camera
         permanece a ancora visual sem virar um bloco quase quadrado.

         O teto da folha nao segue mais o palco: com palco variavel isso o
         tornaria variavel tambem. Ele passa a garantir uma FAIXA DE CAMERA
         sempre visivel — que e exatamente o que o item 3 pede ("a parte
         superior da camera devera continuar visivel") e o item 9 reforca
         ("a camera deve continuar reconhecivel"). 98px e o topo do palco
         (10 do slot + 44 da barra + 10 de respiro + 34 do cabecalho). */
      --fone-camera-cab: clamp(34.32px, 2.42cqi, 57.2px);
      --fone-camera-min: 200px;
      /* O teto quase nunca morde: o palco cresce apenas ate ocupar a sobra, e
         em cinco comodos a faixa ja consome tudo. Ele existe para a Cozinha,
         que nao tem cortina — com 62dvh sobravam 77px mortos ali. Em 72dvh a
         Cozinha fecha tambem, e o teto so voltaria a valer numa tela muito
         alta, onde uma camera sem limite ficaria desproporcional. */
      /* ANTERIOR (rollback pos-device): a camera crescia ate 72dvh e a folha
         reservava 298px. No aparelho isso transformou o palco 16:9 em um bloco
         quase quadrado. A camera volta a ter proporcao propria; esta reserva
         serve apenas para manter uma faixa reconhecivel dela quando a folha
         precisa subir. */
      --fone-camera-max: none;
      --fone-camera-visivel: clamp(160px, 26dvh, 220px);
      --fone-reserva: calc(78px + var(--fone-camera-visivel));
      --fone-gap: 10px;
      --fone-hit-min: 44px;
      --fone-raio: var(--bruno-liquid-card-radius, 20px);
      /* A folha do telefone usa os tokens visuais exatos do VisionOS inclusive
         quando o tema Josh esta ativo. O escopo termina neste media query; os
         materiais globais e o tablet continuam intocados. */
      --fone-folha-vision-background:
        radial-gradient(360px 240px at 18% -10%, rgba(255, 255, 255, 0.105), transparent 64%),
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.060),
          rgba(255, 255, 255, 0.018) 48%,
          rgba(0, 0, 0, 0.035)
        ),
        rgba(0, 0, 0, 0.300);
      --fone-folha-vision-filter: blur(20px) saturate(1.18) brightness(1.03);
      /* ANTERIOR (rollback rev. faixa-de-tiles): --fone-fechar-h: 54px;
         Era a altura da barra "Concluir". A barra saiu (item 12 do roteiro:
         fechar deixou de ser etapa de formulario) e o valor passou a ser so o
         respiro inferior da folha. */
      --fone-fechar-h: 18px;

      /* ── A FAIXA DE CONTROLES (rev. faixa-de-tiles) ────────────────────────
         Cortina, Iluminacao, Hub e A/C deixam de ser quatro cards e passam a
         ser um PLANO CONTINUO, na mesma linguagem da faixa de tiles da Home.
         Cortina e launchers usam o mesmo gradiente HORIZONTAL: as vinhetas
         laterais se repetem sem criar emenda vertical entre os dois elementos
         irmaos. Os filetes leem os tokens da faixa da Home. */
      --fone-faixa-scrim:
        radial-gradient(105% 120px at 7% 50%, rgba(132, 88, 52, 0.09), transparent 62%),
        radial-gradient(105% 120px at 93% 50%, rgba(65, 104, 132, 0.075), transparent 62%),
        linear-gradient(
          90deg,
          rgba(8, 11, 17, 0) 0%,
          rgba(8, 11, 17, 0.15) 7%,
          rgba(8, 11, 17, 0.24) 18%,
          rgba(8, 11, 17, 0.24) 82%,
          rgba(8, 11, 17, 0.15) 93%,
          rgba(8, 11, 17, 0) 100%
        );
      --fone-faixa-filete: rgba(255, 255, 255, 0.085);
      --fone-faixa-divisor: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.055) 9%,
        rgba(255, 255, 255, 0.105) 50%,
        rgba(255, 255, 255, 0.055) 91%,
        rgba(255, 255, 255, 0) 100%
      );
      --fone-faixa-borda: var(
        --bruno-strip-frame-top-line,
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.16) 20%,
          rgba(255, 255, 255, 0.34) 50%,
          rgba(255, 255, 255, 0.16) 80%,
          rgba(255, 255, 255, 0) 100%
        )
      );
      /* Blur no elemento inteiro sempre revela uma caixa retangular. O fade
         lateral vem apenas da pintura, que chega a alpha zero sem apagar o
         conteudo ou reduzir a area de toque. */
      --fone-faixa-blur: none;

      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      height: auto;
      /* ANTERIOR (rollback rev. faixa-de-tiles): min-height: 100%;
         A porcentagem NAO resolvia. A cadeia e host (height:auto) -> main, e
         min-height percentual so resolve contra pai de altura DEFINIDA — entao
         computava como "auto" e o main ficava do tamanho do conteudo. Enquanto
         tudo tinha tamanho fixo isso nao aparecia; ao pedir que a camera
         crescesse para ocupar a sobra, nao havia sobra nenhuma para distribuir
         e ela caiu no piso (medido: 234px, o minimo).
         O valor abaixo e explicito: a altura da tela menos o dock (a shell
         publica --bruno-dock-h, que ela MEDE) menos o padding do slot (10 em
         cima, 6 embaixo). */
      min-height: calc(100dvh - var(--bruno-dock-h, 74px) - 16px);
      /* ANTERIOR (rollback rev. faixa-de-tiles): gap: var(--fone-gap);
         O gap uniforme separava TODOS os modulos, inclusive os que agora
         precisam encostar para formar um plano so. O respiro passa a ser
         declarado por modulo, em margin — ver a secao 2. */
      gap: 0;
      padding: 0;
      background: transparent;
      overflow: visible;
    }

    /* A FAIXA DO TEMA NÃO EXISTE NO TELEFONE.
       O material do Josh desenha a faixa inferior como "main::before" e a
       posiciona pelo GRID (grid-row: 2 / -1), atrás da linha de tiles. Aqui o
       main é FLEX — grid-row não significa nada e o pseudo-elemento vira o
       PRIMEIRO item do flex, com os 320px de --ac-h. Foi exatamente isso que
       empurrou a barra de status de 10px para 340px no aparelho.
       O "::after" acompanha por precaução: a composição do telefone não tem
       faixa nenhuma para desenhar. */
    :host([data-room]) .room-subview::before,
    :host([data-room]) .room-subview::after {
      content: none;
      display: none;
    }

    /* Os containers do tablet somem do FLUXO, não da tela: "contents" faz os
       filhos virarem itens diretos do flex, que é onde "order" atua. Era esta
       declaração que faltava para ".right-column" no bloco "[data-tvhub]", e
       por isso as luzes e o A/C subiam para o topo na Sala. */
    :host([data-room]) .room-subview .content-left,
    :host([data-room]) .room-subview .cams-media-row,
    :host([data-room]) .room-subview .right-column,
    :host([data-room]) .room-subview .hero-panel,
    :host([data-room]) .room-subview .hero-stage,
    :host([data-room]) .room-subview .hero-content {
      display: contents;
    }

    /* A foto do cômodo não existe no telefone: quem manda é a câmera ao vivo.
       "contents" acima já apaga a foto (o elemento deixa de gerar caixa, e com
       ela o background) e preserva a cortina, que morava dentro. */
    :host([data-room]) .room-subview .hero-panel.is-unconfigured,
    :host([data-room]) .room-subview .subview-footer,
    :host([data-room]) .room-subview .subview-topbar,
    :host([data-room]) .room-subview .room-sidebar,
    :host([data-room]) .room-subview .lights-zone-rail {
      display: none;
    }

    /* ══ 2. ORDEM ═══════════════════════════════════════════════════════════ */

    :host([data-room]) .room-subview .subview-topband { order: 0; }
    :host([data-room]) .room-subview .curtain-dock    { order: 20; }
    :host([data-room]) .room-subview .resumo-telefone { order: 30; }

    /* O respiro que o gap dava, agora declarado onde ele deve existir: DEPOIS
       da barra de status e DEPOIS da camera. Entre a cortina e as linhas nao
       ha respiro nenhum — e ali que a faixa continua se forma. */
    :host([data-room]) .room-subview .subview-topband { margin-bottom: var(--fone-gap); }
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      margin-bottom: var(--fone-gap);
    }

    /* A câmera precisa da classe composta: a sobreposição da Cozinha escreve
       ".cameras-card.cameras-card-controls" com order 40, e (0,5,0) venceria os
       (0,4,0) daqui — foi o que colocou o resumo antes da câmera na primeira
       medição. Com a mesma composta, empata em especificidade e vence por
       posição, como todo o resto deste arquivo. */
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      order: 10;
    }

    /* ══ 3. BARRA DE STATUS ═════════════════════════════════════════════════ */
    /* Rolagem horizontal real, no mesmo padrão do bruno-top-badges-card da
       Home. As badges que o bloco antigo escondia (Presença, Roteador, Zigbee)
       voltam: agora são alcançáveis arrastando. */

    :host([data-room]) .room-subview .subview-topband {
      width: 100%;
      /* PLANO B (2026-08-15): a faixa continua reservando os mesmos 36,32px
         no fluxo. Somente o plano visual interno cresce para os 48px da Home;
         portanto câmera, tiles, folhas e rail não perdem um único pixel. */
      position: relative;
      height: 36.32px;
      min-height: 36.32px;
      display: block;
      overflow: visible;
    }
    :host([data-room]) .room-subview .topband-badges {
      position: absolute;
      top: -5.84px;
      left: 0;
      width: 100%;
      height: 48px;
      max-width: 100%;
      display: flex;
      align-items: center;
      /* ANTERIOR (rollback rev. faixa-de-tiles): gap: 6px;
         Com gap, o filete divisor de cada badge (border-left, herdado do
         tablet) descolava do conteudo e a barra lia como uma fileira de
         cartoezinhos. Em zero, as badges encostam e os filetes viram o
         divisor vertical de um plano continuo — que e o que o item 2 do
         roteiro pede e o que a barra do tablet ja faz. */
      gap: 0;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
      touch-action: pan-x;
      padding: 0 1px 2px;
    }
    :host([data-room]) .room-subview .topband-badges::-webkit-scrollbar {
      display: none;
    }
    :host([data-room]) .room-subview .tb-badge,
    :host([data-room]) .room-subview .tb-badge[data-phone-hide] {
      /* NOVO (2026-08-13) — quatro tiles completos por pagina, como na Home.
         ANTERIOR (rollback): flex: 0 0 auto; e padding horizontal de 9.36px.
         A largura por conteudo exibia parte do quinto status. Cada tile passa
         a ocupar exatamente um quarto da faixa; os demais seguem acessiveis
         pelo mesmo scroll horizontal. Restrito ao breakpoint phone. */
      flex: 0 0 25%;
      width: 25%;
      max-width: 25%;
      box-sizing: border-box;
      min-width: 0;
      height: 46px;
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr);
      column-gap: 9px;
      padding: 0 clamp(7px, 2.5vw, 12px);
      touch-action: pan-x;
    }
    :host([data-room]) .room-subview .tb-badge-icon {
      width: 22px;
      height: 22px;
    }
    :host([data-room]) .room-subview .tb-badge-icon bruno-icon { --mdc-icon-size: 18px; }
    :host([data-room]) .room-subview .tb-badge-title { font-size: 10px; }
    :host([data-room]) .room-subview .tb-badge-sub { font-size: 11px; }
    :host([data-room]) .room-subview .tb-badge-sub { max-width: 100%; }
    /* A palavra "Temperatura" terminava a apenas 1,47px do filete no viewport
       de referencia (428px). O terceiro tile continua com exatamente 25% da
       faixa; apenas redistribui 5,7px internos para preservar o respiro sem
       alterar tipografia, altura ou os demais status. */
    :host([data-room]) .room-subview .tb-badge:nth-child(3) {
      column-gap: 6px;
      padding-inline: 8px;
    }
    :host([data-room]) .room-subview .topband-clock { display: none; }

    /* ══ 4. CÂMERA ══════════════════════════════════════════════════════════ */
    /* Mesmos valores do bloco [data-tvhub], que já estavam calibrados — muda
       só a ordem e o fato de valerem nos SEIS cômodos. */

    /* ANTERIOR (rollback rev. faixa-de-tiles): o palco era
         clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px))
       — 248px a 428 de largura, sem flex. A camera ocupava 30% da tela.

       "flex: 1 0 auto" e deliberado: cresce para tomar a sobra, mas NAO encolhe.
       Com shrink ligado, um comodo de faixa alta espremeria justamente o
       elemento que o item 3 manda preservar; sem shrink, quem cede e a rolagem
       do proprio conteudo, que ja existe. */
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      --fone-camera-card-gap: clamp(10px, 2.8cqi, 14px);
      --fone-camera-pip-inset: clamp(8px, 2.4cqi, 12px);
      width: 100%;
      height: auto;
      min-height: 0;
      /* ANTERIOR (rollback pos-device): flex: 1 0 auto distribuia toda a
         sobra vertical para a camera e a deixava quase quadrada. */
      flex: 0 0 auto;
      max-height: none;
      grid-template-rows: auto auto;
      /* ANTERIOR (rollback pos-device): z-index 8 so era aplicado com a folha
         aberta. A troca de camada alterava a composicao aparente do topo da
         camera no WebView. A camada agora e estavel nos dois estados. */
      position: relative;
      z-index: 8;
      isolation: isolate;
    }
    /* No tablet o material Josh usa a cartela compartilhada de main::before.
       Esse plano e deliberadamente desligado no telefone; portanto a camera
       recupera a propria cartela SOMENTE aqui. A especificidade e os
       !important vencem a folha de material injetada depois deste CSS. */
    :host([data-bruno-subview-surface-theme='josh'][data-room])
      .room-subview .glass-card.cameras-card.cameras-card-controls {
      background: var(--bruno-josh-subview-surface-background,
        var(--bruno-liquid-surface-off-background, rgba(22, 18, 16, 0.42))) !important;
      backdrop-filter: var(--bruno-josh-subview-surface-filter,
        blur(20px) saturate(1.08)) !important;
      -webkit-backdrop-filter: var(--bruno-josh-subview-surface-filter,
        blur(20px) saturate(1.08)) !important;
      border: var(--bruno-josh-subview-surface-border,
        var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13))) !important;
      border-radius: var(--bruno-liquid-card-radius, 20px) !important;
      box-shadow: var(--bruno-josh-subview-surface-shadow,
        var(--bruno-liquid-surface-off-shadow, 0 14px 32px rgba(0,0,0,0.24))) !important;
      overflow: hidden;
    }
    :host([data-room]) .room-subview .cameras-head {
      position: relative;
      z-index: 2;
      /* O material Josh e injetado depois e fixa o cabecalho em 34px. Estes
         importantes sao locais ao breakpoint e preservam a zona segura entre
         a borda superior do card e icone/titulo quando a folha esta aberta. */
      height: auto !important;
      min-height: 44px !important;
      padding: 8px 12px 6px !important;
      box-sizing: border-box;
    }
    /* Sala era a unica subview que herdava do bloco legado data-tvhub uma area
       de 34,32px para o menu da camera. Office e Quartos ficavam em 23,39px;
       ao abrir o Hub, a regra generica de .mh-menu os inflava para 34,32px e o
       cabecalho saltava de 44px para 48,31px. Todas as subviews passam a usar a
       geometria estavel da Sala nos dois estados. */
    :host([data-room]) .room-subview .camera-settings-button {
      flex: 0 0 auto;
      width: clamp(34.32px, 2.42cqi, 57.2px);
      height: clamp(34.32px, 2.42cqi, 57.2px);
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    /* O ":not(.camera-pip-feed)" é obrigatório: o PIP da Varanda carrega
       "camera-feed camera-pip-feed". Sem a exclusão, o "height: 100%" daqui
       (0,4,0) vencia o tamanho do PIP (0,1,0) e ele virava uma tira estreita
       da altura inteira do palco — foi o "PIP com muita altura" do aparelho. */
    :host([data-room]) .room-subview .camera-pip-stage {
      min-height: 0;
      height: auto;
      /* O feed conserva 16:9; o palco acrescenta o respiro inferior. Assim o
      frame cresce alguns pixels sem reduzir a imagem. */
      aspect-ratio: auto;
      padding: 0 var(--fone-camera-card-gap) var(--fone-camera-card-gap);
    }
    :host([data-room]) .room-subview .camera-feed:not(.camera-pip-feed) {
      min-height: 0;
      height: auto;
      aspect-ratio: 16 / 9;
    }
    /* Miniatura com proporção de câmera, ancorada no canto. */
    :host([data-room]) .room-subview .camera-pip-feed {
      width: min(34%, 124px);
      height: auto;
      /* ANTERIOR (rollback pos-device): 4 / 3. No aparelho a miniatura ficou
         visualmente quadrada; 3 / 2 reduz apenas a altura, sem perder largura. */
      aspect-ratio: 3 / 2;
      right: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
      bottom: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
    }
    /* Sala e Cozinha sao as composicoes com PIP. Esta regra vence as
       sobreposicoes legadas sem tocar no breakpoint de tablet. */
    :host([data-room='sala']) .room-subview .camera-pip-feed,
    :host([data-room='cozinha']) .room-subview .camera-pip-feed {
      right: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
      bottom: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
    }
    :host([data-room]) .room-subview .camera-control {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    :host([data-room]) .room-subview .camera-list { grid-template-columns: 1fr; }

    /* ══ 5. CORTINA ═════════════════════════════════════════════════════════ */
    /* Era um overlay sobre a foto — ".curtain-overlay" zera fundo e borda com
       !important, então recuperá-los aqui também exige !important. É o único
       lugar deste arquivo que precisa disso, e o motivo está registrado.

       rev. faixa-de-tiles: a cortina deixou de ser CARD e virou o primeiro
       trecho da faixa continua. Ela mantem todos os controles diretos (titulo,
       estado, percentual, Abrir/Parar/Fechar, slider e marcacoes) — o que saiu
       foi a moldura externa: raio, borda e sombra.

       ANTERIOR (rollback rev. faixa-de-tiles) — a versao em card:
         border-radius: var(--fone-raio) !important;
         background: var(--bruno-liquid-surface-off-background,
                          rgba(255,255,255,0.062)) !important;
         border: var(--bruno-liquid-surface-off-border,
                     1px solid rgba(255,255,255,0.105)) !important;
         box-shadow: var(--bruno-liquid-surface-off-shadow, none) !important;
         backdrop-filter: var(--bruno-liquid-surface-off-filter, none) !important;
         .curtain-control-row -> grid-template-columns: minmax(0, 1fr)
                                 (identidade, estado e botoes em tres linhas)
         .curtain-status       -> justify-self: start                            */

    :host([data-room]) .room-subview .curtain-dock {
      grid-row: auto;
      grid-column: auto;
      align-self: stretch;
      width: 100% !important;
      max-width: 100% !important;
      display: grid;
      grid-template-columns: 1fr;
      gap: clamp(9px, 0.63cqi, 15px);
      padding: 14px clamp(10.92px, 0.77cqi, 18.2px) 16px !important;
      /* O plano: sem raio, sem borda, sem sombra. So o scrim e o filete que
         abre a faixa. */
      border-radius: 0 !important;
      background: var(--fone-faixa-scrim) !important;
      border: 0 !important;
      box-shadow: none !important;
      backdrop-filter: var(--fone-faixa-blur) !important;
      -webkit-backdrop-filter: var(--fone-faixa-blur) !important;
      position: relative;
    }
    /* Filete SUPERIOR da faixa. Pseudo-elemento, e nao border-top, porque o
       token do tema e um gradiente horizontal (some nas pontas) e border nao
       aceita gradiente. */
    :host([data-room]) .room-subview .curtain-dock::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: var(--fone-faixa-borda);
      pointer-events: none;
    }

    /* Linha 1: titulo a esquerda, estado a direita. Linha 2: os tres botoes,
       ocupando a largura toda. O slider fica fora desta grade, na linha 3 do
       proprio dock. E o desenho do item 5 do roteiro. */
    :host([data-room]) .room-subview .curtain-control-row {
      align-items: center;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px clamp(7.8px, 0.55cqi, 13px);
    }
    :host([data-room]) .room-subview .curtain-status {
      justify-self: end;
      grid-column: 2;
      grid-row: 1;
    }
    :host([data-room]) .room-subview .curtain-main-actions {
      grid-column: 1 / -1;
      width: 100%;
      justify-content: stretch;
    }
    :host([data-room]) .room-subview .curtain-action-button {
      flex: 1 1 0;
      min-width: 0;
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    /* Iconografia fina: o anel do icone da cortina era mais uma moldura dentro
       da faixa. Vira glifo. */
    :host([data-room]) .room-subview .curtain-icon-shell {
      width: 22px;
      height: 22px;
      background: none;
      border: 0;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      color: rgba(255, 255, 255, 0.62);
    }

    /* ══ 6. LINHAS-RESUMO ═══════════════════════════════════════════════════ */

    /* ANTERIOR (rollback rev. faixa-de-tiles) — cada linha era um CARD:
         .resumo-telefone -> gap: var(--fone-gap)
         .resumo-linha    -> border-radius: var(--fone-raio);
                             background: --bruno-liquid-surface-off-background;
                             border: --bruno-liquid-surface-off-border;
                             box-shadow / backdrop-filter do mesmo pacote.
       Agora sao trechos do mesmo plano da cortina: fundo unico, sem raio, sem
       borda; o que separa um modulo do outro e um filete horizontal. */
    :host([data-room]) .room-subview .resumo-telefone {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      position: relative;
      background: var(--fone-faixa-scrim);
      backdrop-filter: var(--fone-faixa-blur);
      -webkit-backdrop-filter: var(--fone-faixa-blur);
    }
    /* Filete INFERIOR: fecha a faixa. Mesmo motivo do ::before da cortina. */
    :host([data-room]) .room-subview .resumo-telefone::after {
      content: '';
      position: absolute;
      inset: auto 0 0 0;
      height: 1px;
      background: var(--fone-faixa-borda);
      pointer-events: none;
    }
    :host([data-room]) .room-subview .resumo-linha {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) auto;
      align-items: center;
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      width: 100%;
      min-height: 58px;
      padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      color: var(--text-main, rgba(248, 251, 255, 0.94));
      font: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 150ms ease;
      position: relative;
    }
    /* Divisor atmosferico: desaparece nas extremidades em vez de recortar a
       faixa com uma linha rigida. A primeira linha separa a cortina dos
       launchers; as demais mantem o mesmo ritmo vertical. */
    :host([data-room]) .room-subview .resumo-linha::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: var(--fone-faixa-divisor);
      pointer-events: none;
    }
    /* Feedback de toque curto (item 7 do roteiro: 120-180ms), com o acento do
       proprio modulo — a cor vem do --tone que o tom do icone ja carrega. */
    :host([data-room]) .room-subview .resumo-linha:active {
      background: rgba(255, 255, 255, 0.06);
      transition-duration: 120ms;
    }
    :host([data-room]) .room-subview .resumo-linha:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: -2px;
    }
    /* Iconografia fina: sem anel, so o glifo — igual a cortina. */
    :host([data-room]) .room-subview .resumo-linha .micro-icon {
      width: 24px;
      height: 24px;
      background: none;
      border: 0;
      box-shadow: none;
    }
    :host([data-room]) .room-subview .resumo-linha .micro-icon bruno-icon {
      --mdc-icon-size: 21px;
    }
    :host([data-room]) .room-subview .resumo-texto {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    :host([data-room]) .room-subview .resumo-titulo {
      font-size: 14.8px;
      font-weight: 700;
      line-height: 1.12;
    }
    :host([data-room]) .room-subview .resumo-estado {
      font-size: 12px;
      font-weight: 500;
      line-height: 1.15;
      color: var(--text-soft, rgba(255, 255, 255, 0.52));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* ANTERIOR (rollback rev. faixa-de-tiles): o chevron era "mdi:chevron-up"
       girado 180deg (apontando para baixo) e desgirava quando ativo. Virou o
       chevron DISCRETO apontando para a direita do item 6 do roteiro — ele
       indica "abre um segundo nivel", nao "expande aqui". */
    :host([data-room]) .room-subview .resumo-chevron {
      width: 20px;
      height: 20px;
      display: grid;
      place-items: center;
      color: rgba(255, 255, 255, 0.34);
      transform: none;
      transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), color 180ms ease;
    }
    :host([data-room]) .room-subview .resumo-chevron bruno-icon {
      --mdc-icon-size: 19px;
    }
    :host([data-room]) .room-subview .resumo-linha.is-active .resumo-chevron {
      transform: rotate(90deg);
      color: rgba(255, 255, 255, 0.62);
    }

    /* ══ 7. A FOLHA ═════════════════════════════════════════════════════════ */
    /* Fora do telefone estes quatro módulos ficam no fluxo, como sempre. Aqui
       eles só existem quando a linha correspondente é tocada. */

    :host([data-room]) .room-subview .glass-card.lights-card,
    :host([data-room]) .room-subview .glass-card.ac-card,
    :host([data-room]) .room-subview .glass-card.media-hub-card,
    :host([data-room]) .room-subview .glass-card.appliances-card {
      display: none;
    }

    /* Cada módulo volta com o display que ELE usa — "flex" para todos quebraria
       o grid interno do A/C e do hub. */
    :host([data-folha='luzes']) .room-subview .glass-card.lights-card { display: flex; }
    :host([data-folha='ac']) .room-subview .glass-card.ac-card { display: grid; }
    :host([data-folha='midia']) .room-subview .glass-card.media-hub-card { display: grid; }
    :host([data-folha='eletro']) .room-subview .glass-card.appliances-card { display: block; }

    /* O ".glass-card" no seletor NÃO é decorativo: é especificidade.
       O material do Josh declara
         :host([data-bruno-subview-surface-theme="josh"]) .glass-card.ac-card
       com position: relative — (0,4,0), o mesmo peso que este bloco tinha, e
       injetado DEPOIS em adoptedStyleSheets. Empate resolvido por posição: o
       material vencia e só a folha de luzes (que não está naquela lista)
       chegava a ser fixed. Medido: A/C, mídia e eletrodomésticos ficavam
       relative e apareciam no meio do fluxo. Com a classe composta são
       (0,5,0). */
    :host([data-folha]) .room-subview .glass-card.lights-card,
    :host([data-folha]) .room-subview .glass-card.ac-card,
    :host([data-folha]) .room-subview .glass-card.media-hub-card,
    :host([data-folha]) .room-subview .glass-card.appliances-card {
      position: fixed;
      left: 0;
      right: 0;
      /* A folha PARA em cima do dock, não por baixo dele.
         No telefone a shell dá z-index 2 ao rail-slot e 1 ao content-slot. A
         folha vive dentro do content-slot, então nenhum z-index daqui a coloca
         sobre o dock — a pilha é decidida um nível acima. Tentar cobrir o dock
         dá o que apareceu no aparelho: as últimas linhas da folha escondidas
         atrás dele. Parando acima, o dock continua aceso e utilizável.
         A altura vem da shell ("--bruno-dock-h"), que é quem a conhece. */
      /* ANTERIOR (rollback antes da rail persistente): a folha subia da borda
         inferior e cobria o dock. A shell elevava o slot de conteudo para isso.
         A decisao atual prioriza rail sempre visivel e controles sem sobreposicao. */
      /* ANTERIOR (rollback rail persistente): bottom: 0. A folha cobria a rail e
         os ultimos controles ficavam na mesma regiao de toque. A rail agora
         permanece visivel, e a folha termina imediatamente acima dela. */
      /* REV. mobile final: a folha pinta ate a borda inferior e passa por tras
         da rail. O padding inferior reserva a area de toque do dock, mantendo
         os controles acima dele sem criar uma segunda superficie. */
      bottom: 0;
      z-index: 9;
      width: auto;
      height: max-content;
      margin: 0;
      /* ANTERIOR (rollback rev. faixa-de-tiles):
           min-height: min(52dvh, 420px);
           border-radius: 26px 26px 0 0;
           padding-top: 22px;
           box-shadow: 0 -28px 56px -18px rgba(0,0,0,0.85);
         O piso equalizava ARTIFICIALMENTE a altura das tres folhas — o item 10
         do roteiro proibe isso: a altura tem de sair do conteudo. O raio de
         26px e a sombra de 56px eram o que fazia a folha ler como card grande
         flutuando por cima, e nao como extensao inferior da subview (item 8).
         Sem o piso, o teto passa a ser o unico limite. */
      min-height: 0;
      max-height: calc(100vh - var(--fone-folha-top, var(--fone-reserva)));
      max-height: calc(100dvh - var(--fone-folha-top, var(--fone-reserva)));
      overflow-y: auto;
      overscroll-behavior: contain;
      border-radius: 18px 18px 0 0;
      padding: 18px clamp(10.92px, 0.77cqi, 18.2px)
        calc(10px + var(--bruno-dock-h, 74px));
      /* ANTERIOR (rollback pos-device): o padding inferior somava novamente
         env(safe-area-inset-bottom). A altura medida do dock ja inclui essa
         area no iPhone, portanto a soma duplicada criava o vazio que nao
         aparecia no navegador de PC. */
      background: var(--fone-folha-vision-background) !important;
      backdrop-filter: var(--fone-folha-vision-filter) !important;
      -webkit-backdrop-filter: var(--fone-folha-vision-filter) !important;
      /* Sombra so o suficiente para descolar da faixa; sem borda e sem glow. */
      box-shadow: 0 -14px 30px -20px rgba(0, 0, 0, 0.7);
      border: 0;
      /* A transicao da abertura. "translateY" e barato e nao remede layout.
         O fill-mode e "backwards", NAO "both": com "both" o valor final da
         animacao (translateY(0)) continua aplicado depois que ela termina e
         VENCE o transform inline — e o arrasto para fechar escreve exatamente
         em transform inline. Com "backwards" a animacao solta a propriedade ao
         terminar e o arrasto funciona. */
      align-content: start;
      animation: fone-folha-sobe 280ms cubic-bezier(0.18, 0.86, 0.24, 1) backwards;
      touch-action: pan-y;
    }

    @keyframes fone-folha-sobe {
      from { transform: translateY(100%); opacity: 0.82; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    /* ANTERIOR (rollback refinamento mobile): zerar o estado escondia a folha
       sem transicao. O host agora conserva data-folha por 280ms e acrescenta
       data-folha-saindo, exclusivamente abaixo do breakpoint de telefone. */
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.lights-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.ac-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.media-hub-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.appliances-card {
      animation: fone-folha-desce 280ms cubic-bezier(0.42, 0, 0.78, 0.18) forwards;
      pointer-events: none;
    }

    @keyframes fone-folha-desce {
      from { transform: translateY(0); opacity: 1; }
      to   { transform: translateY(100%); opacity: 0.82; }
    }

    /* A alça: dica visual de que a folha se fecha arrastando ou tocando fora. */
    :host([data-folha]) .room-subview .glass-card.lights-card::after,
    :host([data-folha]) .room-subview .glass-card.ac-card::after,
    :host([data-folha]) .room-subview .glass-card.media-hub-card::after,
    :host([data-folha]) .room-subview .glass-card.appliances-card::after {
      content: '';
      position: absolute;
      inset: 7px auto auto 50%;
      transform: translateX(-50%);
      /* Menor e mais discreta que a anterior (42x4 / 0.28): o item 11 pede que
         a alca nao chame atencao. */
      width: 34px;
      height: 3px;
      padding: 0;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.20);
      z-index: 2;
      pointer-events: none;
    }

    /* Dentro da folha o corpo das luzes rola sozinho, sem teto herdado. */
    :host([data-folha='luzes']) .room-subview .lights-zones,
    :host([data-folha='luzes']) .room-subview .zone-lights,
    :host([data-folha='luzes']) .room-subview .office-light-list {
      flex: 0 0 auto;
      max-height: none !important;
      overflow-y: visible !important;
      overscroll-behavior: auto;
    }
    :host([data-folha='luzes']) .room-subview .lights-body { grid-template-rows: 1fr; }

    /* ── 7a. CABEÇALHO DAS FOLHAS (item 11) ───────────────────────────────────
       Compacto e numa linha so: icone + titulo a esquerda, acoes globais a
       direita. O respiro de cima ja e do padding da folha (16px), que abriga a
       alca — o cabecalho nao precisa de altura propria para decoracao.

       ANTERIOR (rollback rev. faixa-de-tiles): as regras deste trecho miravam
       ".lights-card .module-head", ".head-actions" e ".zone-header". NENHUMA
       dessas classes existe no markup atual (o dock usa ".lights-dock",
       ".lights-dock-actions" e ".section-head"), entao as regras eram letra
       morta e o cabecalho da folha de luzes seguia com a geometria do tablet.
       Os nomes abaixo saem do markup renderizado. */
    :host([data-folha]) .room-subview .lights-dock,
    :host([data-folha]) .room-subview .mh-head,
    :host([data-folha]) .room-subview .ac-lean-head {
      min-height: 0;
      height: auto;
      padding: 0 2px 12px;
      gap: 10px;
    }
    /* Filete abaixo do cabecalho — mesmo divisor da faixa, para o segundo nivel
       falar a mesma lingua do primeiro. */
    :host([data-folha]) .room-subview .lights-card.is-open .lights-dock,
    :host([data-folha]) .room-subview .mh-head,
    :host([data-folha]) .room-subview .ac-lean-head {
      border-bottom: 1px solid var(--fone-faixa-filete);
    }
    /* Dentro da folha o titulo NAO alterna nada: a folha ja esta aberta. O
       chevron do dock de luzes so confundiria. */
    :host([data-folha='luzes']) .room-subview .lights-dock-chevron { display: none; }
    :host([data-folha]) .room-subview .lights-dock .micro-icon,
    :host([data-folha]) .room-subview .mh-head .micro-icon,
    :host([data-folha]) .room-subview .ac-lean-head .micro-icon {
      width: 24px;
      height: 24px;
      background: none;
      border: 0;
      box-shadow: none;
    }
    /* O titulo empurra: com o X entrando como TERCEIRO filho, o
       "justify-content: space-between" herdado do tablet jogaria o botao do
       meio para o centro. Com o titulo crescendo, os dois botoes ficam colados
       na direita, separados pelo gap do cabecalho. */
    :host([data-folha]) .room-subview .mh-head > .mh-head-title,
    :host([data-folha]) .room-subview .ac-lean-head > .ac-head-title,
    :host([data-folha]) .room-subview .appliances-head > .mh-head-title {
      flex: 1 1 auto;
      min-width: 0;
    }
    :host([data-folha]) .room-subview .lights-dock-actions {
      flex: 0 0 auto;
      gap: 6px;
    }
    :host([data-folha]) .room-subview .lights-dock-actions .chip-button {
      min-height: 32px;
      min-width: 0;
    }

    /* ── 7b. FOLHA DE ILUMINAÇÃO (item 13) ────────────────────────────────── */
    /* Quem rola e a GRADE, nao a folha: o cabecalho fica parado, que e o que o
       item 10 pede quando o conteudo passa do limite.

       ANTERIOR (rollback rev. faixa-de-tiles) — eu havia escrito aqui
         max-height: none; overflow: visible;
       para "soltar" a lista. Isso quebrou a rolagem: ".lights-body-clip"
       recorta o excedente, entao o conteudo nao aumentava o scrollHeight da
       folha e as ultimas luzes sumiam sem que nada rolasse. Medido no banco:
       a 7a celula da Sala terminava 12,5px abaixo da base da folha, com
       scrollHeight == clientHeight. A base ja fazia certo (max-height: 100% +
       overflow-y: auto) — o override era o defeito. */
    :host([data-folha='luzes']) .room-subview .lights-scroll {
      padding: 12px 0 0;
    }
    :host([data-folha='luzes']) .room-subview .light-grid {
      width: 100%;
      margin-inline: 0;
      gap: 0;
    }
    /* Cada luz deixa de ser um cartao com contorno completo: fica so o filete
       que separa as celulas, como no plano da faixa. */
    :host([data-folha='luzes']) .room-subview .light-cell {
      border: 0;
      border-radius: 0;
      background: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: none;
      min-height: 56px;
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-left {
      border-left: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='luzes']) .room-subview .section-head {
      padding: 12px 2px 6px;
    }
    :host([data-folha='luzes']) .room-subview .section-head .zone-off {
      min-height: 30px;
    }

    /* ── 7c. FOLHA DO AR-CONDICIONADO (item 15) ───────────────────────────── */
    /* O anel continua sendo o elemento dominante; Modo/Ventilacao/Swing mantem
       area tatil propria, sem um card externo envolvendo o conjunto. */
    :host([data-folha='ac']) .room-subview .ac-card.ac-card-lean {
      grid-template-rows: auto minmax(clamp(171.6px, 12.09cqi, 286px), auto) auto;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-mid { padding: 10px 0 12px; }
    :host([data-folha='ac']) .room-subview .ac-lean-foot {
      align-items: stretch;
      padding: 0;
      gap: 8px;
    }
    :host([data-folha='ac']) .room-subview .ac-action {
      min-height: clamp(40.56px, 2.86cqi, 67.6px);
    }

    /* ── 7d. FOLHA DO HUB DE MÍDIA (item 14) ──────────────────────────────── */
    /* O conteudo integra a superficie da folha em vez de parecer um card dentro
       dela: as fontes viram trechos separados por filete, sem moldura propria. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      grid-template-rows: auto minmax(0, 1fr);
    }
    :host([data-folha='midia']) .room-subview .mh-sources { gap: 0; }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      border-radius: 0;
      background: none;
      border: 0;
      border-top: 1px solid var(--fone-faixa-filete);
      min-height: 54px;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      grid-template-columns: minmax(0, 1fr)
        clamp(clamp(81.12px, 5.71cqi, 135.2px), 30vw, clamp(115.44px, 8.13cqi, 192.4px));
      gap: clamp(6.24px, 0.44cqi, 10.4px);
      padding-inline: 2px;
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='midia']) .room-subview .mh-info { padding-left: 0; }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
    }
    /* ANTERIOR (rollback):
       :host([data-folha='midia']) .room-subview .mh-menu,
       O seletor amplo tambem alcancava .camera-settings-button, porque o botao
       de tres pontos da camera compartilha a classe utilitaria .mh-menu. */
    :host([data-folha='midia']) .room-subview .media-hub-card .mh-menu,
    :host([data-folha='midia']) .room-subview .mh-btn {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }

    /* ── 7e. FOLHA DE ELETRODOMÉSTICOS (Cozinha) ──────────────────────────── */
    :host([data-folha='eletro']) .room-subview .appliances-grid {
      padding-top: 12px;
    }

    /* -- 7f. CORRECAO POS-DISPOSITIVO: INTERIOR ORIGINAL -------------------
       ANTERIOR (rollback faixa-de-tiles): o primeiro desenho da folha zerava
       raio, fundo, borda e espacos das celulas internas para prolongar a faixa
       fechada para dentro do segundo nivel. O aparelho confirmou que isso
       redesenhava componentes ja consolidados no tablet. As regras abaixo
       restauram a mesma hierarquia interna; somente a caixa externa continua
       sendo adaptada para folha no telefone. */

    :host([data-folha='luzes']) .room-subview .lights-dock {
      min-height: clamp(40.56px, 2.86cqi, 67.6px);
      height: auto;
      padding: 0 clamp(7.8px, 0.55cqi, 13px);
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    }
    :host([data-folha='midia']) .room-subview .mh-head,
    :host([data-folha='ac']) .room-subview .ac-lean-head {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
      height: clamp(34.32px, 2.42cqi, 57.2px);
      padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      border-bottom: 0;
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-chevron {
      display: grid;
      transform: none;
    }

    :host([data-folha]) .room-subview .lights-dock .micro-icon,
    :host([data-folha]) .room-subview .mh-head .micro-icon,
    :host([data-folha]) .room-subview .ac-lean-head .micro-icon {
      width: clamp(21.84px, 1.54cqi, 36.4px);
      height: clamp(21.84px, 1.54cqi, 36.4px);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.13);
      box-shadow: none;
    }
    :host([data-folha]) .room-subview .micro-icon.tone-amber {
      color: rgb(255, 183, 77);
      background: rgba(255, 183, 77, 0.10);
      border-color: rgba(255, 183, 77, 0.22);
    }
    :host([data-folha]) .room-subview .micro-icon.tone-cyan {
      color: rgb(111, 224, 241);
      background: rgba(111, 224, 241, 0.10);
      border-color: rgba(111, 224, 241, 0.20);
    }

    :host([data-folha='luzes']) .room-subview .glass-card.lights-card {
      padding-left: clamp(20px, 5.6vw, 24px);
      padding-right: clamp(20px, 5.6vw, 24px);
    }
    :host([data-folha='luzes']) .room-subview .lights-dock {
      padding-inline: 0;
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-actions {
      gap: clamp(7px, 2vw, 10px);
      /* Afasta as pills apenas do filete inferior; a altura da folha não muda. */
      transform: translateY(-3px);
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-actions .chip-button {
      min-height: 36px;
    }
    :host([data-folha='luzes']) .room-subview .lights-scroll {
      padding: 12px 0 0;
    }
    :host([data-folha='luzes']) .room-subview .light-grid {
      width: 100%;
      margin-inline: 0;
      gap: clamp(8px, 2vw, 9px);
    }
    :host([data-folha='luzes']) .room-subview .light-cell {
      height: var(--fone-luz-cell-h, clamp(58px, 6.45dvh, 60px));
      min-height: var(--fone-luz-cell-h, clamp(58px, 6.45dvh, 60px));
      padding-inline: clamp(10px, 2.8vw, 12px);
      border: 1px solid rgba(255, 255, 255, 0.105);
      border-color: rgba(255, 255, 255, 0.105);
      border-radius: var(--bruno-subview-cartela-inner-radius, var(--bruno-liquid-control-radius-compact, 12px));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.060), rgba(255, 255, 255, 0.022));
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
    }
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-left,
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-top {
      border-color: rgba(255, 255, 255, 0.105);
    }
    :host([data-folha='luzes']) .room-subview .section-head {
      padding: 0 0 10px;
    }
    :host([data-folha='luzes']) .room-subview .section-head .zone-off {
      min-height: 32px;
    }
    :host([data-folha='luzes']) .room-subview .light-section + .light-section {
      margin-top: 14px;
      padding-top: 14px;
      border-top-color: rgba(255, 255, 255, 0.085);
    }
    :host([data-folha='luzes']) .room-subview .lc-switch {
      width: 34px;
      height: 20px;
      padding-inline: 2px;
    }
    :host([data-folha='luzes']) .room-subview .lc-knob {
      width: 14px;
      height: 14px;
    }
    :host([data-folha='luzes']) .room-subview .light-cell.is-on .lc-knob {
      transform: translateX(14px);
    }

    /* O acordeao conserva uma fonte aberta e outra recolhida, como no tablet.
       No telefone, TV/PC e Spotify compartilham a mesma altura de corpo para a
       folha nao saltar durante a alternancia; o conteudo continua responsivo. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      grid-template-rows: auto auto;
      align-content: start;
      --fone-midia-arte: clamp(100px, 29cqi, 110px);
      /* NOVO (2026-08-13) — altura derivada dos elementos, nao de dvh.
         92px = paddings 8 + gap de camadas 4 + transportes/volume 80.
         ANTERIOR (rollback): clamp(226px, 27dvh, 232px). */
      --fone-midia-corpo-altura: calc(var(--fone-midia-arte) + 92px);
      --fone-midia-gap: clamp(10px, 2.8cqi, 12px);
      --fone-midia-padding-x: clamp(12px, 3.4cqi, 16px);
      /* O material da folha continua por tras da rail, mas a reserva extra
         acima do filete cai de 10 para 4px. A altura medida do dock permanece
         intacta. Restrito a folha de midia no telefone. */
      padding-bottom: calc(4px + var(--bruno-dock-h, 74px));
    }
    :host([data-folha='midia']) .room-subview .mh-sources {
      gap: 0;
      /* ANTERIOR (rollback): padding inferior de 10px, que se somava ao
         padding da folha e afastava o ultimo controle do filete da rail. */
      padding: 0 clamp(10px, 2.8vw, 13px);
    }
    :host([data-folha='midia']) .room-subview .mh-source {
      flex: 0 0 44px;
      overflow: visible;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open {
      flex: 0 0 auto;
      position: relative;
    }
    :host([data-folha='midia']) .room-subview .mh-source + .mh-source.is-open::before {
      content: '';
      position: absolute;
      z-index: 2;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--fone-faixa-filete);
      pointer-events: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      min-height: 44px;
      height: 44px;
      align-items: center;
      padding-block: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    :host([data-folha='midia']) .room-subview .mh-source + .mh-source .mh-source-head {
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open .mh-source-head {
      /* NOVO (2026-08-13) — o titulo da fonte aberta pertence ao Now Playing.
         ANTERIOR (rollback): ocupava uma linha propria de 40px antes do corpo.
         Sobreposto apenas a coluna textual, alinha Spotify, TV ou PC ao topo
         da arte e reduz a folha sem comprimir nenhuma area tatil. */
      position: absolute;
      z-index: 3;
      top: 8px;
      left: var(--fone-midia-padding-x);
      right: calc(var(--fone-midia-padding-x) + var(--fone-midia-arte) + var(--fone-midia-gap));
      width: auto;
      height: 30px;
      min-height: 30px;
      padding: 0;
      border-top: 0;
      grid-template-columns: 18px minmax(0, auto);
      justify-content: start;
      gap: 6px;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      /* Now Playing compacto: metadata e arte dividem a primeira camada;
         transportes e volume ocupam a largura toda abaixo dela. */
      height: var(--fone-midia-corpo-altura);
      min-height: var(--fone-midia-corpo-altura);
      box-sizing: border-box;
      position: relative;
      isolation: isolate;
      overflow: hidden;
      grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
      grid-template-rows: minmax(var(--fone-midia-arte), 1fr) auto;
      grid-template-areas:
        'info art'
        'controls controls';
      align-items: start;
      align-content: start;
      gap: 4px var(--fone-midia-gap);
      padding: 4px var(--fone-midia-padding-x);
      border-top: 0;
      background: transparent;
      box-shadow: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body.has-atmosphere::after {
      /* ANTERIOR (rollback): um gradiente escuro cobria todo o retangulo do
         corpo e o destacava da folha. A atmosfera agora vem somente da arte
         desfocada abaixo, com mascara que desaparece nas quatro extremidades. */
      display: none;
    }
    :host([data-folha='midia']) .room-subview .mh-now-atmosphere {
      /* O elemento ampliado era maior que o corpo; o fade ficava fora do
         recorte e o WebView mostrava exatamente a borda retangular do
         overflow. No telefone o corpo passa a revelar somente o material
         VisionOS da propria folha. A capa nitida continua na coluna de arte.
         ANTERIOR (rollback): imagem 160%, opacity .12, blur 30px e mascara. */
      display: none;
    }
    :host([data-folha='midia']) .room-subview .mh-left {
      display: contents;
    }
    :host([data-folha='midia']) .room-subview .mh-info {
      grid-area: info;
      position: relative;
      z-index: 1;
      padding-left: 0;
      padding-top: 36px;
    }
    :host([data-folha='midia']) .room-subview .mh-progress-wrap {
      width: 100%;
    }
    :host([data-folha='midia']) .room-subview .mh-controls {
      grid-area: controls;
      position: relative;
      z-index: 1;
      width: 100%;
      margin-top: 0;
      gap: 2px;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-art {
      grid-area: art;
      position: relative;
      z-index: 1;
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
      align-self: start;
      border-radius: 12px;
    }
    :host([data-folha='midia']) .room-subview .mh-art-wide {
      aspect-ratio: 16 / 9;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art-wide {
      aspect-ratio: 1 / 1;
    }
    :host([data-folha='midia']) .room-subview .mh-art img,
    :host([data-folha='midia']) .room-subview .mh-art-square.is-cover img,
    :host([data-folha='midia']) .room-subview .mh-art-wide.is-cover img {
      inset: 0;
      top: auto;
      left: auto;
      transform: none;
      width: 100%;
      height: 100%;
      aspect-ratio: auto;
      object-fit: contain;
      border-radius: inherit;
    }
    :host([data-folha='midia']) .room-subview .mh-art.is-cover img {
      object-fit: cover;
    }
    :host([data-folha='midia']) .room-subview .mh-art.is-paused img {
      filter: blur(2.8px) brightness(0.78) saturate(0.9);
      transform: scale(1.035);
    }
    /* Standby usa contain sem escala: o PNG inteiro permanece dentro da caixa
       de 100 a 110 px e nunca volta a ser recortado pelo overflow da arte. */
    :host([data-folha='midia']) .room-subview .mh-art.is-standby img {
      object-fit: contain;
      transform: none;
    }
    /* ANTERIOR (rollback): TV e PC usavam a mesma caixa nominal do Echo, mas
       seus PNGs têm mais transparência interna e pareciam menores. Compensação
       exclusivamente óptica e exclusiva do telefone. */
    :host([data-folha='midia']) .room-subview .mh-source-body-tv .mh-art.is-standby img,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art.is-standby img {
      transform: scale(1.1);
      transform-origin: center;
    }
    :host([data-folha='midia']) .room-subview .mh-vol {
      order: 2;
      min-height: 34px;
      padding-inline: 2px;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row {
      order: 1;
      gap: 0;
      min-height: 44px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-4,
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn {
      min-height: 44px;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn:nth-child(2) bruno-icon {
      --mdc-icon-size: 28px;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      order: 1;
      min-height: 46px;
    }
    /* PC desligado usava a grade de tres colunas dos transportes, deixando o
       CTA estreito. TV, PC e Spotify passam a compartilhar a mesma linguagem
       de acao principal em largura total. */
    :host([data-folha='midia']) .room-subview .mh-source-body-pc.is-source-idle .mh-btn-row-3 {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body-pc.is-source-idle .mh-btn-row-3 .mh-btn.is-main {
      width: 100%;
      min-width: 0;
      min-height: 46px;
      padding-inline: 12px;
      border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
      border-radius: var(--bruno-liquid-control-radius-compact, 9px);
      background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
      box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
    }

    /* REV. 2026-08-14 — composicao final do Hub no telefone.
       O corpo anterior somava padding da lista e padding proprio: o icone da
       fonte comecava 13,7px depois do icone do cabecalho, e a arte terminava
       na mesma distancia antes do menu. A lista passa a ocupar o eixo inteiro
       da folha e cada secao usa os mesmos 12px do cabecalho nas duas bordas.

       A estrutura anterior tambem empilhava transportes e volume em toda a
       largura. Ela permanece acima como rollback; as regras abaixo apenas
       recompõem o mesmo DOM em tres zonas no breakpoint de telefone:
       informacao, controles na coluna textual e volume na base. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      --fone-midia-eixo-x: 12px;
      --fone-midia-corpo-altura: calc(var(--fone-midia-arte) + 62px);
      --fone-midia-gap: clamp(8px, 2.4cqi, 10px);
      /* Sala herdava este piso do antigo bloco data-tvhub; Office e Quartos
         não. A composição mobile passa a ter a mesma altura estrutural nos
         seis cômodos antes de a ancoragem corrigir qualquer reflow do WebView. */
      height: auto;
      min-height: clamp(257.4px, 18.13cqi, 429px);
      grid-template-rows: auto auto;
    }
    :host([data-folha='midia']) .room-subview .mh-sources {
      padding-inline: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-source,
    :host([data-folha='midia']) .room-subview .mh-source.is-open,
    :host([data-folha='midia']) .room-subview .mh-source-body {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: 0;
      border-radius: 0;
      box-shadow: none !important;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      isolation: auto;
      overflow: visible;
      grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
      grid-template-rows: minmax(0, 1fr) 44px 34px;
      grid-template-areas:
        'info art'
        'buttons art'
        'volume volume';
      gap: 4px var(--fone-midia-gap);
      padding: 4px var(--fone-midia-eixo-x);
    }
    :host([data-folha='midia']) .room-subview .mh-source-body::before,
    :host([data-folha='midia']) .room-subview .mh-source-body::after {
      content: none !important;
      display: none !important;
    }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      padding-inline: var(--fone-midia-eixo-x);
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open .mh-source-head {
      top: 8px;
      left: var(--fone-midia-eixo-x);
      right: calc(var(--fone-midia-eixo-x) + var(--fone-midia-arte) + var(--fone-midia-gap));
      padding: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-info {
      grid-area: info;
      align-self: start;
      padding-top: 34px;
    }
    :host([data-folha='midia']) .room-subview .mh-progress-wrap {
      width: 100%;
    }
    :host([data-folha='midia']) .room-subview .mh-controls {
      display: contents;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row {
      grid-area: buttons;
      align-self: center;
      width: 100%;
      min-width: 0;
      min-height: 44px;
    }
    :host([data-folha='midia']) .room-subview .mh-vol {
      grid-area: volume;
      align-self: end;
      width: 100%;
      min-width: 0;
      min-height: 34px;
      padding-inline: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-art {
      grid-area: art;
      align-self: center;
      justify-self: end;
    }

    /* Sem volume, TV/PC/Spotify conservam a mesma altura externa. A arte usa
       toda a altura disponivel e o CTA ocupa a metade inferior da coluna de
       texto, em vez de deixar uma faixa vazia na base. */
    :host([data-folha='midia']) .room-subview .mh-source-body.is-source-idle .mh-art,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art {
      grid-column: 2;
      grid-row: 1 / 4;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-btn-row {
      grid-column: 1;
      grid-row: 2 / 4;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
      min-height: 46px;
    }

    /* Os quatro transportes mantem caixas tateis invisiveis de pelo menos
       44px. So Play/Pause e Mais desenham circulos: o primeiro e o foco optico;
       o segundo recebe um acento menor. */
    :host([data-folha='midia']) .room-subview .mh-btn-row-4 {
      grid-template-columns: repeat(4, minmax(44px, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(5, minmax(44px, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn {
      position: relative;
      isolation: isolate;
      min-width: 44px;
      min-height: 44px;
      overflow: visible;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn::before {
      content: '';
      position: absolute;
      z-index: -1;
      left: 50%;
      top: 50%;
      width: 0;
      height: 0;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      pointer-events: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Tocar']::before,
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Pausar']::before {
      width: 42px;
      height: 42px;
      background: rgba(255, 255, 255, 0.085);
      border: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.34);
      box-shadow: 0 5px 14px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.10);
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn.is-plus::before {
      width: 30px;
      height: 30px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(255,255,255,0.13);
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn bruno-icon {
      position: relative;
      z-index: 1;
      --mdc-icon-size: 23px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Tocar'] bruno-icon,
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Pausar'] bruno-icon {
      --mdc-icon-size: 25px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn.is-plus bruno-icon {
      --mdc-icon-size: 18px;
    }

    @container subview (max-width: 350px) {
      :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
        --fone-midia-arte: 96px;
        --fone-midia-gap: 8px;
      }
      :host([data-folha='midia']) .room-subview .mh-source-body {
        grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
        gap: 8px var(--fone-midia-gap);
      }
      :host([data-folha='midia']) .room-subview .mh-vol-label {
        display: none;
      }
      /* Em 320px a coluna textual nao comporta fisicamente as cinco acoes do
         PC com alvos Apple de 44px. Mantemos os cinco alvos integrais e
         limitamos a faixa a sua propria coluna; somente esse conjunto pode ser
         percorrido horizontalmente, sem invadir a arte nem aumentar a folha. */
      :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
        grid-template-columns: repeat(5, 44px);
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-inline: contain;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      :host([data-folha='midia']) .room-subview .mh-btn-row-5::-webkit-scrollbar {
        display: none;
      }
    }

    :host([data-folha='ac']) .room-subview .ac-card.ac-card-lean {
      grid-template-rows: auto auto auto;
      align-content: start;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-mid {
      min-height: clamp(178px, 48vw, 210px);
      padding: 0 clamp(4.68px, 0.33cqi, 7.8px) 2px;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-foot {
      padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
      gap: clamp(6.24px, 0.44cqi, 10.4px);
    }

    /* ANTERIOR (rollback pos-device): Josh usava um gradiente quase opaco e
       blur(28px) brightness(.78). No telefone ele agora recebe exatamente o
       mesmo material VisionOS da regra-base da folha. */
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.lights-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.ac-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.media-hub-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.appliances-card {
      background: var(--fone-folha-vision-background) !important;
      backdrop-filter: var(--fone-folha-vision-filter) !important;
      -webkit-backdrop-filter: var(--fone-folha-vision-filter) !important;
    }

    /* ══ 8. ESCURECIMENTO ═══════════════════════════════════════════════════ */
    /* A câmera fica ACIMA dele: acesa, transmitindo e clicável com a folha
       aberta. Todo o resto escurece, e tocar no escuro fecha. */

    /* ── FECHAR (item 12) ──────────────────────────────────────────────────
       A barra "Concluir" SAIU. Ela transformava o fechamento em etapa de
       formulario, ocupava 54px na base e competia com o dock logo abaixo.
       Agora o fechamento e o de uma folha nativa: arrastar para baixo (ver
       "_arrastarFolha" no componente), tocar fora, ou o botao discreto no
       cabecalho.

       ANTERIOR (rollback rev. faixa-de-tiles) — a barra:
         :host([data-folha]) .folha-fechar {
           display: flex; position: fixed; left: 0; right: 0; bottom: 0;
           z-index: 10;
           height: calc(var(--fone-fechar-h) + env(safe-area-inset-bottom,0px));
           border-top: 1px solid rgba(255,255,255,0.09);
           background: var(--bruno-liquid-surface-off-background,
                            rgba(20,24,33,0.92));
           backdrop-filter: blur(18px) saturate(1.12);
           font-size: 15px; font-weight: 640;
         }
       ANTERIOR: o elemento continuava no DOM, apenas escondido. Agora ele saiu
       tambem da marcacao; para voltar, restaurar o bloco acima, o button no
       componente e devolver --fone-fechar-h a 54px. */
    :host([data-room]) .room-subview .folha-fechar { display: none; }
    :host([data-folha]) .room-subview .folha-fechar { display: none; }

    /* O chevron fica imediatamente depois do titulo e recolhe a folha. Ele nao
       tem disco, moldura ou fundo: e o mesmo vocabulario do chevron da faixa. */
    :host([data-room]) .room-subview .folha-recolher { display: none; }
    :host([data-folha]) .room-subview .folha-recolher {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      padding: 0;
      margin: 0 0 0 -4px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: rgba(255, 255, 255, 0.58);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-folha]) .room-subview .folha-recolher bruno-icon {
      --mdc-icon-size: 20px;
    }
    :host([data-folha]) .room-subview .folha-recolher:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: 2px;
    }

    /* ANTERIOR (rollback pos-device): o X era um glifo MDI e depois um caractere
       em circulo. O markup fica preservado, mas sem ocupar layout; o chevron ao
       lado do titulo assumiu o fechamento. */
    :host([data-room]) .room-subview .folha-x { display: none; }
    :host([data-folha]) .room-subview .folha-x {
      display: none;
      place-items: center;
      width: 34px;
      height: 34px;
      flex: 0 0 auto;
      padding: 0;
      margin: 0;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      color: rgba(255, 255, 255, 0.96);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-folha]) .room-subview .folha-x bruno-icon {
      --mdc-icon-size: 18px;
    }
    :host([data-folha]) .room-subview .folha-x-glyph {
      display: block;
      font-size: 26px;
      font-weight: 420;
      line-height: 1;
      transform: translateY(-1px);
    }
    :host([data-folha]) .room-subview .folha-x:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: 2px;
    }

    /* ── O OVERLAY (item 9) ────────────────────────────────────────────────
       ANTERIOR (rollback rev. faixa-de-tiles): rgba(4, 7, 12, 0.62).
       0.62 apagava o comodo — e a razao de ser deste cenario e VER o ambiente
       enquanto se comanda. Em 0.34 a subview apenas REBAIXA: a faixa e a barra
       de status continuam reconheciveis atras da folha. Sem blur, de proposito
       (o item 9 proibe blur excessivo, e qualquer blur aqui criaria um backdrop
       root que quebraria o microblur da faixa — mesma armadilha da REV.17). */
    :host([data-room]) .room-subview .folha-scrim { display: none; }
    :host([data-folha]) .room-subview .folha-scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 7;
      background: rgba(4, 7, 12, 0.34);
      animation: fone-scrim-entra 180ms ease both;
    }
    :host([data-folha][data-folha-saindo]) .room-subview .folha-scrim {
      animation: fone-scrim-sai 180ms ease forwards;
      pointer-events: none;
    }
    /* A camera fica ACIMA do escurecimento: acesa, transmitindo e clicavel. */
    :host([data-folha]) .room-subview .cameras-card { z-index: 8; }

    @keyframes fone-scrim-entra {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fone-scrim-sai {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  }

  /* Fora do telefone nada disto existe: as linhas e o escurecimento estão no
     DOM mas não aparecem, e nenhum caminho de interação as alcança. */
  @media (min-width: 801px) {
    .resumo-telefone,
    .folha-scrim,
    /* O X de fechar mora no cabecalho dos modulos, que sao os MESMOS do
       tablet. Sem esta linha ele apareceria la — a regra que o esconde vive
       dentro do bloco de telefone e nao alcança larguras maiores. */
    .folha-x,
    .folha-recolher,
    .folha-fechar {
      display: none !important;
    }
  }

  /* ====================================================================
     C1 (2026-08-23) — MOBILE: as fontes do Hub voltam a ler como cards.

     Uma decisao anterior integrou o conteudo na folha zerando material,
     borda, raio e sombra de .mh-source / .mh-source.is-open / .mh-source-body
     (regras acima, duas delas com !important). O resultado foi TV, PC e
     Spotify sem hierarquia externa nenhuma.

     Aqui volta SOMENTE o material. Nada de geometria interna: grid, arte a
     direita, play/pause circular, volume, controles, acordeao e a logica
     seguem exatamente como estao. As unicas medidas tocadas sao o gap entre
     as fontes e o padding externo do corpo — sem eles cards colados leem como
     um bloco unico.

     Os valores nao sao novos: sao os MESMOS tokens --bruno-liquid-band-* que
     o tablet ja consome em subview-styles.generated.ts.

     ROLLBACK: remover este bloco inteiro; as regras que zeram o material
     continuam acima, intactas, e voltam a valer sozinhas.
     ==================================================================== */
  @media (max-width: 800px) {
    :host([data-folha='midia']) .room-subview .mh-sources {
      gap: 6px;
    }

    :host([data-folha='midia']) .room-subview .mh-source {
      /* !important porque a regra que zera o material tambem usa !important:
         especificidade e ordem nao bastam contra ela. */
      background: var(--bruno-liquid-band-background, rgba(255, 255, 255, 0.01)) !important;
      box-shadow: var(--bruno-liquid-band-shadow, none) !important;
      border: var(--bruno-liquid-band-border, 1px solid rgba(255, 255, 255, 0.035));
      border-radius: var(--bruno-liquid-cell-radius, 16px);
      overflow: hidden;
    }

    :host([data-folha='midia']) .room-subview .mh-source.is-open {
      background: var(
        --bruno-liquid-band-open-background,
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.044),
          rgba(255, 255, 255, 0.012) 54%,
          rgba(255, 255, 255, 0.018)
        ),
        rgba(9, 11, 15, 0.052)
      ) !important;
      border-color: var(--bruno-liquid-band-open-border-color, rgba(255, 255, 255, 0.092));
      box-shadow: var(
        --bruno-liquid-band-open-shadow,
        inset 0 1px 0 rgba(255, 255, 255, 0.066),
        0 6px 16px rgba(0, 0, 0, 0.105)
      ) !important;
    }

    /* Com borda propria em cada card, os filetes de separacao viram linha
       dupla. Eles existiam justamente porque nao havia caixa. */
    :host([data-folha='midia']) .room-subview .mh-source + .mh-source.is-open::before {
      display: none;
    }

    :host([data-folha='midia']) .room-subview .mh-source + .mh-source .mh-source-head {
      border-top: 0;
    }

    /* O corpo respira dentro do card sem mexer no grid interno. */
    :host([data-folha='midia']) .room-subview .mh-source-body {
      padding-bottom: 8px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .folha-scrim,
    .resumo-chevron,
    .glass-card.lights-card,
    .glass-card.ac-card,
    .glass-card.media-hub-card,
    .glass-card.appliances-card {
      animation: none !important;
      transition: none !important;
    }
  }
`;
