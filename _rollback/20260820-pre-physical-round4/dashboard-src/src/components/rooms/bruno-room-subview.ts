import { LitElement, html, css, svg, nothing } from 'lit';
import { scaleTokens } from '@/styles/tokens/scale';
import type { Hass, HassEntity } from '@/models/home-assistant';
import { ROOMS, type RoomConfig } from '@/config/rooms.config';
import { SUBVIEWS, type SubviewConfig } from '@/config/subviews.config';
import { spotifyTocandoEm } from '@/services/entities/spotify-device';
import { isMediaPlaying, isTvPowered } from '@/services/entities/media-state';
import { callHaService } from '@/services/home-assistant/service-call';
import {
  coletarIdsDeEntidade,
  ObservadorDeEntidades,
  resumirMotivo,
} from '@/services/state/entity-watcher';
import { assinarRelogio } from '@/services/state/clock';
import { CADENCIA, MotorDeInstantaneos } from '@/services/camera/snapshot-engine';
import {
  criarPlayerWebRtc,
  garantirPlayerWebRtc,
  marcarPlayer,
  pareceQuadroVerde,
} from '@/services/camera/ha-webrtc-player';
import { usaWebRtc } from '@/config/camera-webrtc.config';
import {
  conectou,
  desconectou,
  medirRender,
  espera,
  encerrarTimer,
  intervalo,
  requisicaoManual,
  ouvir,
  pararDeOuvir,
} from '@/diagnostics/runtime/probe';

/** Nome deste componente no coletor de runtime (Fase 6.0). */
const SONDA = 'bruno-room-subview';

/**
 * Contrato minimo do player ao vivo.
 *
 * O caminho ativo usa `ha-web-rtc-player` e `entityid`. As propriedades do
 * seletor antigo permanecem opcionais somente para o rollback documentado.
 */
type PlayerAoVivo = HTMLElement & {
  hass?: Hass | undefined;
  entityid?: string | undefined;
  cameraImage?: string | undefined;
  cameraView?: string | undefined;
  fitMode?: string | undefined;
  updateComplete?: Promise<unknown> | undefined;
};
import {
  SUBVIEW_BASE_CSS,
  SUBVIEW_APPLIANCES_CSS,
  SUBVIEW_TVHUB_CSS,
  SUBVIEW_PS5_CSS,
  SUBVIEW_SOBREPOSICOES,
} from './subview-styles.generated';
import { SUBVIEW_TELEFONE_CSS } from './subview-phone.styles';

/**
 * Subview de cômodo — arquitetura nova.
 *
 * Substitui os seis arquivos de ~8.900 linhas cada. A medição que autorizou isso
 * está em docs/12: 86% de repetição literal, 111 dos ~120 métodos e 620 das
 * regras de CSS idênticos nos seis.
 *
 * A ESTRUTURA é uma só. O que varia entra por atributo no host, e o CSS gerado
 * já vem escopado por esse atributo:
 *
 *   data-room="<id>"      sobreposição do cômodo (o grid próprio da Cozinha)
 *   data-tvhub            hub com TV — cinco cômodos
 *   data-appliances       eletrodomésticos — só a Cozinha
 *   data-ps5              entrada de PS5 no menu — SÓ A SALA
 *
 * Critério de aceite: reproduzir `scripts/harness/subview-baseline.json` com
 * delta 0,00 nos cinco cômodos, e os três valores próprios da Cozinha.
 *
 * Uso:
 *     type: custom:bruno-room-subview
 *     room: sala
 */

function truthy(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === 'number') return v > 0;
  return ['true', 'on', 'yes', '1'].includes(String(v ?? '').toLowerCase());
}

/** Estados que contam como "ligado" nos domínios ainda locais deste componente. */
const ESTADOS_MIDIA_LIGADA = ['playing', 'paused', 'on', 'idle'];
const ESTADOS_CAMERA_ONLINE = ['streaming', 'recording', 'idle', 'on'];
const ESTADOS_CLIMATE_LIGADO = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const ACOES_CLIMATE_ATIVAS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const ACOES_CLIMATE_INATIVAS = ['off', 'idle'];

/**
 * Calibração preservada das subviews clássicas.
 * `visual` é abertura percebida; `position` é a posição bruta enviada ao cover.
 * O controle exibido ao usuário continua sendo o inverso: percentual FECHADO.
 */
const CORTINA_CALIBRACAO = [
  { visual: 0, position: 0 },
  { visual: 25, position: 33 },
  { visual: 50, position: 47 },
  { visual: 75, position: 70 },
  { visual: 100, position: 100 },
] as const;

// Recuperado das subviews clássicas: o cover nem sempre publica posições
// intermediárias durante o curso. A estimativa mantém percentual, dot e barra
// progressivos sem alterar o comando enviado ao Home Assistant.
const CORTINA_CURSO_MS = 30_000;
const CORTINA_MOVIMENTO_MIN_MS = 1_200;
const CORTINA_TICK_MS = 350;
const CORTINA_TOLERANCIA_ALVO = 2;
const CORTINA_GRAÇA_PARADA_MS = 700;

type MovimentoCortina =
  | {
      entityId: string;
      inicioFechado: number;
      alvoFechado: number;
      iniciadoEm: number;
      duracao: number;
      ultimoRelatado: number;
      retido?: false;
    }
  | { entityId: string; fechado: number; retidoEm: number; retido: true };

type AncoraFolhaTelefone = {
  rolavel: HTMLElement;
  topoCamera: number;
  rolagem: number;
  token: number;
};

/** Metadados de mídia mudam sem necessariamente mudar state/last_changed. */
function projecaoMidia(entidade: HassEntity | undefined): string {
  if (!entidade) return '∅';
  const a = entidade.attributes;
  return JSON.stringify([
    entidade.state,
    entidade.last_changed,
    a['media_title'],
    a['media_artist'],
    a['media_album_name'],
    a['entity_picture'],
    a['media_image_url'],
    a['media_duration'],
    a['media_position'],
    a['media_position_updated_at'],
    a['volume_level'],
    a['source'],
    a['source_name'],
    a['device_name'],
    a['active_device_name'],
    a['spotify_device_name'],
  ]);
}

/**
 * Quanto esperar pelo primeiro quadro antes de o motor entrar por cima.
 *
 * Seis das oito camaras mostram o primeiro quadro em menos de 5 s (medido em
 * 2026-08-07); para elas o vigia nao custa nada. Ver `_armarVigiaDeCameras`.
 */
const PRAZO_PRIMEIRO_QUADRO = 4000;

// ANTERIOR (rollback WebRTC Office): const PRAZO_MODO_AO_VIVO = 6000.
// Seis segundos eram usados apenas para fotografar o estado do DOM. Agora o
// prazo encerra uma tentativa real que ainda nao entregou o primeiro quadro.
// ANTERIOR (rollback expansao ONVIF): const PRAZO_MODO_AO_VIVO = 10000.
// Nas outras sete cameras o more-info atravessa uma pausa inicial e depois fica
// em tempo real. Dez segundos encerravam o player customizado antes dessa virada
// e devolviam a tela ao motor de instantaneos. A foto continua visivel enquanto
// estes 30 s correm, portanto ampliar a negociacao nao cria tela vazia.
const PRAZO_MODO_AO_VIVO = 30000;
const ATRASO_RETOMADA_MORE_INFO = 700;

type EstadoAoVivo =
  | 'ocioso'
  | 'carregando-player'
  | 'negociando'
  | 'ao-vivo'
  | 'entregue-more-info'
  | 'retomando'
  | 'fallback';

// ANTERIOR (rollback 6.2B): `const INTERVALO_CAMERAS = 6500;` — o intervalo fixo
// herdado das subviews antigas (`refresh_interval` 6.500 ms, piso 4.000). A
// cadência agora é política do motor, em `services/camera/snapshot-engine.ts`,
// e depende de a requisição anterior ter terminado.

const IMAGEM_TV_ESPERA = '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1';
const IMAGEM_SPOTIFY_ESPERA = '/local/images/echo_pop.png?v=20260702-all-images-1';
const IMAGEM_PC = '/local/images/office_pc.png?v=20260702-all-images-1';
const TV_HUB_HISTORY_KEY = 'bruno-ui:tv-hub-history:v1';

/**
 * Módulos que, no TELEFONE, viram linha-resumo e abrem como bottom sheet.
 *
 * A chave é a mesma que sai no atributo `data-folha` do host e que o CSS usa
 * para escolher qual módulo sobe. Manter esta lista e o CSS em sincronia: uma
 * chave nova aqui sem a regra correspondente lá abre uma folha vazia.
 */
type FolhaChave = 'luzes' | 'ac' | 'midia' | 'eletro';

function numero(valor: unknown, casas = 0): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '--';
  return n.toFixed(casas).replace(/\.0+$/, '');
}

function duracao(segundos: number): string {
  const s = Math.max(0, Math.floor(Number(segundos) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

// ANTERIOR (rollback 6.2B rev.2): a função `comSelo` vivia aqui e carimbava a
// URL inicial do elemento. O selo agora é responsabilidade exclusiva do motor
// (`services/camera/snapshot-engine.ts`), que o aplica só nas ATUALIZAÇÕES — a
// URL inicial fica sem selo, para poder reusar o cache do navegador.
//
//   function comSelo(src, selo) {
//     if (!src) return "";
//     return src + (src.includes("?") ? "&" : "?") + "bruno_t=" + selo;
//   }

function capitalizar(v: unknown): string {
  const t = String(v ?? '').replace(/_/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—';
}

interface EstadoHa {
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
}

interface CameraCfg {
  entity: string;
  fallbackEntity?: string;
  name?: string;
  shortName?: string;
  controls?: Array<{ key?: string; label?: string; description?: string; icon?: string; entity?: string }>;
}

interface CameraViva extends CameraCfg {
  online: boolean;
  indisponivel: boolean;
  base: string;
  url: string;
}

interface SubviewCardConfig {
  room: string;
}

export class BrunoRoomSubview extends LitElement {
  /**
   * ANTERIOR (rollback 6.1): `_hass: { state: true }`.
   *
   * Propriedade reativa pede render a cada atribuição, por cima de qualquer
   * guarda no setter. Ver a nota longa em `bruno-room-tile.ts`.
   */
  static override properties = {};

  /** Guardado para o rollback e para diagnostico; ainda nao lido no render. */
  private _config: SubviewCardConfig | undefined;
  private _room?: RoomConfig;
  private _sub: SubviewConfig | undefined;
  private _hass: Hass | undefined;
  /** Estado do dock de iluminacao: fechado por padrao, como nas subviews atuais. */
  private _lightsOpen = false;
  /**
   * Folha aberta no TELEFONE (Cenário B, decisão do usuário em 2026-08-10).
   *
   * No telefone os módulos completos saem do fluxo e viram linha-resumo; tocar
   * numa linha traz o módulo de volta como bottom sheet ancorada na base. O
   * valor vira o atributo `data-folha` no host, e é ELE que o CSS lê — do mesmo
   * jeito que `data-room` e `data-appliances`.
   *
   * `null` no tablet, sempre: as linhas-resumo e o escurecimento existem no DOM
   * mas ficam `display: none` acima de 800px, e nada os aciona lá.
   */
  private _folha: FolhaChave | null = null;
  /**
   * Mantem a folha montada durante os poucos milissegundos da animacao de
   * saida. ANTERIOR (rollback refinamento mobile): o fechamento zerava
   * `_folha` imediatamente e, por isso, a folha simplesmente desaparecia.
   */
  private _folhaSaindo = false;
  private _timerFecharFolha: number | undefined;
  private _mediaTelefone: MediaQueryList | undefined;
  private _tokenAncoraFolha = 0;

  // ── Estado de interação ────────────────────────────────────────────────────
  // Os originais guardam tudo isto em campos de instância e chamam `_safeRender`.
  // Aqui basta `requestUpdate()`: o Lit reconcilia só o que mudou.

  /** Fonte escolhida à mão no hub. Vazio = prioridade automática. */
  private _fonteMidia = '';
  /** Uma escolha explícita no acordeão sempre vence a prioridade automática. */
  private _fonteMidiaManual = false;
  /** Fontes que estavam ativas no render anterior — detecta ativação nova. */
  private _midiaAtivasAntes: string[] = [];
  /** Últimos atributos válidos: ADB pode omiti-los por um frame sem power-off. */
  private _tvUltimoVolume: number | null = null;
  private _tvUltimoPoster = '';
  private _tvUltimaFonte = 'HDMI 1';
  private _tvUltimoTitulo = '';
  private _tvHistoricoCarregado = false;
  private _menuMidiaAberto = false;
  private _spotifyFerramentas = false;
  private _movimentoCortina: MovimentoCortina | undefined;
  private _timerMovimentoCortina: number | undefined;
  /** Painel de A/C aberto: 'mode' | 'fan' | 'swing' | ''. */
  private _painelClima = '';
  private _controlesCameraAbertos = false;
  /** Câmera promovida ao feed principal pelo toque no PIP. */
  private _cameraAtiva = '';

  // ANTERIOR (rollback 6.2B rev.2): `private _seloCameras = Date.now();` — o
  // selo da URL inicial. Saiu junto com `comSelo`; ver a nota lá em cima.
  //
  // O último quadro baixado por câmera. É o que faz voltar a um cômodo já
  // visitado mostrar a imagem na hora, em vez de esperar 4-8 s de novo.
  private _urlsCarregadas: Record<string, string> = {};
  private _ultimaImagem: Record<string, string> = {};

  /**
   * O motor de instantâneos (Fase 6.2B).
   *
   * A agenda passa pela sonda: assim todo timer do ciclo de câmera continua
   * tendo dono e sendo contado, e um esquecimento apareceria em `vazamentos`.
   *
   * A medição é **por câmera**, com o primeiro quadro num rótulo próprio. Era o
   * que faltava para responder as duas perguntas que a baseline levantou e não
   * respondia: *qual* câmera falha (o usuário relatou o Q. Miguel) e *quanto
   * tempo* leva até a primeira imagem — que é o que ele chama de "demora".
   */
  private readonly _motorCameras = new MotorDeInstantaneos({
    // O primeiro quadro é do elemento de imagem, que nasce com `src` e baixa
    // sozinho. O motor entra só na primeira atualização — sem isto eram DUAS
    // requisições lentas por câmera na montagem, competindo entre si.
    atrasoInicial: CADENCIA.principal,
    agenda: {
      agendar: (fn, ms) => espera(SONDA, fn, ms),
      cancelar: (id) => encerrarTimer(SONDA, id),
      agora: () => performance.now(),
    },
    aoCarregar: (q) => this._quadroPronto(q.entityId, q.url),
    aoMedir: (entityId, duracao, desfecho, primeiro) => {
      const nome = entityId.split('.')[1] ?? entityId;
      requisicaoManual(`câmera ${nome}`, duracao, desfecho === 'ok');
      if (primeiro) requisicaoManual(`câmera ${nome} · 1º quadro`, duracao, true);
    },
  });

  /**
   * Vídeo ao vivo do palco (Fase 6.2B parte 2, rev.2).
   *
   * ── O ERRO DA REV.1, E POR QUE ELE CUSTOU CARO ──────────────────────────
   *
   * Eu escrevi a negociação WebRTC à mão. Medido no PC em 2026-08-07:
   * **3 tentativas, 3 falhas, todas em 12.020 ms** — o prazo da minha própria
   * negociação. Nunca funcionou.
   *
   * Pior: as tentativas DEGRADARAM o instantâneo. Cada oferta faz o HA abrir um
   * stream para a câmera, e a mesma câmera não serve negociação e instantâneo ao
   * mesmo tempo. O resultado foi `sl_camera_2` com pior tempo de 25.003 ms (o
   * teto do motor) e o usuário esperando 22,7 s pela imagem ao voltar para a
   * Sala. Isso viola a regra que eu mesmo escrevi para esta fase: **falhar não
   * pode custar nada.**
   *
   * ── O QUE JÁ EXISTIA, FUNCIONANDO, NESTA MESMA INSTALAÇÃO ───────────────
   *
   * A subview de câmeras (legada) mostra a mesma câmera EM TEMPO REAL usando o
   * `hui-image` nativo do Home Assistant com `cameraView = 'live'`. Ele resolve
   * WebRTC ou HLS conforme a câmera, e já cai para instantâneo sozinho.
   *
   * Ou seja: eu reimplementei um protocolo que o frontend já entrega pronto e
   * cuja versão pronta estava provada a dois cliques de distância. A troca é
   * usar o `hui-image`, e o código do protocolo sai do caminho vivo.
   */
  private _liveEl: PlayerAoVivo | undefined;
  /** Entidade da negociacao atual e entidade que ja entregou quadro real. */
  private _liveEntity = '';
  private _livePronto = '';
  /** Inicio da tentativa, para medir WebRTC sem misturar o tempo de montagem. */
  private _liveIniciadoEm = 0;
  private _timerAoVivo: number | undefined;
  /** Uma falha nao pode abrir nova negociacao a cada atualizacao de sensor. */
  // ANTERIOR (rollback 2026-08-10): private _aoVivoSuspenso = false.
  // Um booleano misturava falha, player ausente e entrega ao More Info. Depois
  // de fechar o dialogo ele continuava true ate desmontar toda a subview.
  private _estadoAoVivo: EstadoAoVivo = 'ocioso';
  private _tokenDefinicaoPlayer = 0;
  private _timerRetomadaAoVivo: number | undefined;
  private _timerQuadroVerde: number | undefined;
  private _quadroVerdeRegistrado = '';
  private _fallbackAoVivo = '';
  private _ouvindoFechamentoDialogo = false;

  /** Estado seletivo (Fase 6.1): só repinta quando muda o que este módulo lê. */
  private _observador = new ObservadorDeEntidades();
  private _motivo = '';
  /** Cancela a assinatura do relógio central. */
  private _cancelarRelogio: (() => void) | undefined;

  setConfig(config: SubviewCardConfig): void {
    if (!config?.room) throw new Error('bruno-room-subview: informe `room`');
    const room = ROOMS.find((r) => r.id === config.room);
    if (!room) throw new Error(`bruno-room-subview: cômodo desconhecido "${config.room}"`);
    this._config = config;
    this._room = room;
    this._sub = SUBVIEWS[config.room];
    void this._config;
    void this._hass;
    // As duas configurações, varridas: a do cômodo (luzes, sensores, presença) e
    // a da subview (mídia, climatização, câmeras). Só depois do setConfig elas
    // existem — o primeiro `hass` chega antes.
    const observadas = [
      ...coletarIdsDeEntidade(room),
      ...coletarIdsDeEntidade(this._sub),
    ];
    const entidadesSubview = (this._sub?.entities ?? {}) as Record<string, unknown>;
    const idsMidia = ['spotify', 'tv', 'speaker']
      .flatMap((chave) => {
        const valor = entidadesSubview[chave];
        return Array.isArray(valor) ? valor : typeof valor === 'string' ? [valor] : [];
      })
      .filter((id): id is string => Boolean(id));
    const projecoes = Object.fromEntries(idsMidia.map((id) => [id, projecaoMidia]));
    this._observador = new ObservadorDeEntidades(observadas, { projecoes });
    this._aplicarAtributos();
  }

  /**
   * ANTERIOR (rollback 6.1) — sem guarda nenhuma:
   *
   *   set hass(hass: Hass) {
   *     this._hass = hass;
   *     this.requestUpdate();
   *   }
   *
   * O Home Assistant troca o objeto `hass` a cada mudança de estado de qualquer
   * entidade da casa. Este componente é o mais pesado do dashboard (média de
   * 3 ms por render na baseline do tablet, pior caso 34,9 ms) e repintava a cada
   * uma delas — inclusive quando o que mudou foi o aspirador em outro cômodo.
   */
  set hass(hass: Hass) {
    this._hass = hass;
    const mudou = this._observador.mudancas(hass);
    if (mudou.length === 0) return;
    this._motivo = resumirMotivo(mudou);
    this.requestUpdate();
  }

  getCardSize(): number {
    return 12;
  }

  /**
   * Mede o custo de cada atualização (Fase 6.0.1).
   *
   * No `update()`, e não no `render()`: é aqui que o Lit constrói E aplica o
   * DOM. Medir só o `render()` mediria a montagem do template, que é a parte
   * barata — e o número enganaria.
   */
  override update(mudancas: Map<string, unknown>): void {
    const motivo = this._motivo;
    this._motivo = '';
    // Sem motivo do observador, ainda dá para separar os dois casos que
    // importam: a MONTAGEM (navegar para o cômodo) da INTERAÇÃO (abrir um menu,
    // trocar de fonte, promover uma câmera). O primeiro retrato desta fase
    // mostrou "outro (22)" sem distinguir os dois — e são coisas diferentes:
    // montagem é custo de navegação, interação é resposta ao toque.
    medirRender(SONDA, () => super.update(mudancas), motivo || this._motivoPadrao());
  }

  private _motivoPadrao(): string {
    return this.hasUpdated ? 'interação' : 'montagem';
  }

  /**
   * Depois de cada render, o motor recebe a lista de câmeras da tela.
   *
   * Aqui, e não no render: o motor só deve descobrir a promoção do PIP quando os
   * elementos correspondentes já existem — é neles que o quadro pronto entra.
   */
  override updated(mudancas: Map<string, unknown>): void {
    super.updated(mudancas);
    if (!this._hass) return;
    this._sincronizarCameras();
    this._sincronizarLimiteFolhaTelefone();
    this._sincronizarAlturaLuzesTelefone();
  }

  override connectedCallback(): void {
    super.connectedCallback();
    conectou(SONDA);
    this._estadoAoVivo = 'ocioso';
    this._fallbackAoVivo = '';
    this._montadoEm = performance.now();
    this._quadrosNaTela.clear();
    this._socorros.clear();
    this._aplicarAtributos();
    // O material do tema NÃO vem do CSS gerado: vem de um módulo global, que
    // marca o host com data-bruno-subview-surface-theme e reage à troca de tema.
    // Sem estas duas chamadas as câmeras, o hub e o A/C perdem a pele de tile do
    // Josh e viram contornos — foi exatamente o que aconteceu na primeira
    // publicação. Ver CLAUDE.md, seções REV.14 a REV.18.
    const g = globalThis as {
      BrunoLiquidGlass?: { apply?: () => void };
      BrunoSurfaceMaterial?: { connect?: (h: unknown) => void; disconnect?: (h: unknown) => void };
    };
    g.BrunoLiquidGlass?.apply?.();
    g.BrunoSurfaceMaterial?.connect?.(this);
    this._injetarMaterial();
    this._iniciarVigiaTelefone();
    this._iniciarTimerCameras();
    this._armarVigiaDeCameras();
    this._iniciarTimerRelogio();
    if (!this._ouvindoVisibilidade && typeof document !== 'undefined') {
      ouvir(SONDA, document, 'visibilitychange', this._aoMudarVisibilidade);
      this._ouvindoVisibilidade = true;
    }
    if (!this._ouvindoFechamentoDialogo && typeof window !== 'undefined') {
      ouvir(SONDA, window, 'dialog-closed', this._aoFecharDialogo);
      this._ouvindoFechamentoDialogo = true;
    }
  }

  /**
   * O relógio da barra superior.
   *
   * Nada no hass muda de minuto em minuto, então sem uma batida externa a hora
   * congela no momento em que a subview abriu. A comparação com o último minuto
   * continua: batida não é render, só vira render quando o minuto realmente
   * vira.
   *
   * ANTERIOR (rollback 6.1) — intervalo próprio de 15s por instância:
   *
   *   private _iniciarTimerRelogio(): void {
   *     if (this._timerRelogio) return;
   *     this._timerRelogio = intervalo(SONDA, () => { ... }, 15000);
   *   }
   *
   * Cada módulo que mostrasse hora criaria o seu, todos desalinhados entre si e
   * nenhum parando com a tela apagada. O relógio central é um só, e some quando
   * o último assinante sai.
   */
  private _iniciarTimerRelogio(): void {
    if (this._cancelarRelogio) return;
    this._cancelarRelogio = assinarRelogio(() => {
      const minuto = this._hora();
      if (minuto === this._ultimoMinuto) return;
      this._ultimoMinuto = minuto;
      this._motivo = 'relógio';
      this.requestUpdate();
    });
  }

  private _pararTimerRelogio(): void {
    this._cancelarRelogio?.();
    this._cancelarRelogio = undefined;
  }

  private _ultimoMinuto = '';

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    desconectou(SONDA);
    const g = globalThis as {
      BrunoSurfaceMaterial?: { disconnect?: (h: unknown) => void };
    };
    g.BrunoSurfaceMaterial?.disconnect?.(this);
    // Fecha o contrato com a shell mesmo se a rota mudar com a folha aberta.
    // ANTERIOR (rollback refinamento mobile): apenas os ouvintes de arrasto
    // eram removidos; `bruno-folha` podia permanecer ativo na shell seguinte.
    this._limparFolhaImediatamente();
    this._pararVigiaTelefone();
    // Os ouvintes do arrasto vivem em globalThis enquanto o gesto dura. Sair do
    // cômodo no meio de um arrasto deixaria três ouvintes presos a um
    // componente já desmontado — vazamento clássico.
    this._encerrarArrasto();
    this._pararTimerMovimentoCortina();
    this._pararTimerCameras();
    this._tokenDefinicaoPlayer++;
    this._estadoAoVivo = 'ocioso';
    this._pararAoVivo();
    encerrarTimer(SONDA, this._timerRetomadaAoVivo);
    this._timerRetomadaAoVivo = undefined;
    if (this._timerLuzes) {
      encerrarTimer(SONDA, this._timerLuzes);
      this._timerLuzes = undefined;
    }
    this._pararTimerRelogio();
    if (this._ouvindoVisibilidade) {
      pararDeOuvir(SONDA, document, 'visibilitychange', this._aoMudarVisibilidade);
      this._ouvindoVisibilidade = false;
    }
    if (this._ouvindoFechamentoDialogo) {
      pararDeOuvir(SONDA, window, 'dialog-closed', this._aoFecharDialogo);
      this._ouvindoFechamentoDialogo = false;
    }
  }

  /**
   * Suspensão do módulo invisível (Fase 6.1).
   *
   * Este dashboard vive num tablet de parede, cuja tela apaga. Continuar
   * buscando um quadro de câmera a cada ciclo com ninguém olhando é rede, CPU e
   * bateria gastas em nada — e a baseline mostrou 25% dessas requisições
   * falhando, com pior caso de 10 s. Ao voltar, um quadro é buscado na hora, para
   * a tela não acender com a imagem de dez minutos atrás.
   */
  private _ouvindoVisibilidade = false;

  private _aoMudarVisibilidade = (): void => {
    if (!this.isConnected) return;
    if (document.visibilityState === 'hidden') {
      this._pararTimerCameras();
      // Stream aberto com a tela apagada é o pior dos dois mundos: gasta CPU
      // na VM e rede, para ninguém. Reabre sozinho ao voltar.
      this._tokenDefinicaoPlayer++;
      this._estadoAoVivo = 'ocioso';
      this._fallbackAoVivo = '';
      this._pararAoVivo();
      return;
    }
    this._atualizarCameras();
    this._iniciarTimerCameras();
    this._estadoAoVivo = 'ocioso';
    this._fallbackAoVivo = '';
    this._sincronizarCameras();
  };

  /**
   * ANTERIOR (rollback 6.2B) — o ciclo de intervalo fixo que o motor substituiu:
   *
   *   private _iniciarTimerCameras(): void {
   *     if (this._timerCameras) return;
   *     this._timerCameras = intervalo(SONDA, () => this._atualizarCameras(), 6500);
   *   }
   *
   *   private _atualizarCameras(): void {
   *     for (const img of raiz.querySelectorAll("img[data-camera-src-base]")) {
   *       const carregador = new Image();
   *       carregador.onload = () => { ...troca o src... };
   *       carregador.onerror = () => requisicaoManual(SONDA, ..., false);
   *       carregador.src = proxima;
   *     }
   *   }
   *
   * Ele pedia um quadro de cada câmera a cada 6.500 ms **sem olhar se o anterior
   * tinha terminado**, sem prazo e sem cancelamento. Com a carga medida em
   * 6.200 ms de média, cada câmera ficava com uma requisição em voo quase o tempo
   * todo — e um pedido travado ficava pendurado para sempre enquanto outro
   * nascia por cima. A política nova está em `services/camera/snapshot-engine.ts`,
   * com o raciocínio completo no cabeçalho de lá.
   */
  private _iniciarTimerCameras(): void {
    // Com a tela apagada não há para quem buscar quadro. O ouvinte de
    // visibilidade religa o ciclo quando ela volta.
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    this._motorCameras.iniciar();
  }

  private _pararTimerCameras(): void {
    this._motorCameras.parar();
  }

  private _atualizarCameras(): void {
    this._motorCameras.atualizarAgora();
  }

  /**
   * Declara ao motor quais câmeras estão na tela e com que prioridade.
   *
   * Chamado a cada render: promover o PIP a palco muda só a cadência, sem
   * reiniciar o ciclo nem perder a métrica do primeiro quadro.
   */
  private _sincronizarCameras(): void {
    const vivas = this._camerasConfiguradas().map((c) => this._cameraViva(c));
    if (!vivas.length) {
      this._motorCameras.definirAlvos([]);
      this._pararAoVivo();
      return;
    }
    const escolhida = vivas.find((c) => c.entity === this._cameraAtiva) ?? vivas[0];
    const online = vivas.find((c) => c.online);
    const principal = escolhida?.online || !online ? escolhida : online;

    this._motorCameras.definirAlvos(
      vivas
        // A câmera com vídeo ao vivo MONTADO sai dos alvos do motor.
        //
        // Na rev.2 eu removi este filtro argumentando que manter o motor era
        // "barato perto de ficar sem imagem". A medição desmentiu: com o ao vivo
        // ligado, `sl_camera_2` teve 32 requisições e 6 tempos esgotados, e a
        // `as_camera_2` chegou a 100% de falha. A câmera não serve stream e
        // instantâneo ao mesmo tempo.
        //
        // O filtro depende do elemento estar CONECTADO, não de a lista permitir:
        // enquanto o player não monta, o instantâneo continua e a tela nunca
        // fica vazia. Se o player cair, o próximo render o recoloca.
        // ANTERIOR (rollback WebRTC Office): o filtro retirava a camera assim
        // que o ELEMENTO era conectado, mesmo sem video. No diagnostico isso
        // congelou o fallback durante cinco negociacoes sem quadro.
        // Agora o motor so para depois do evento de carga e de readyState >= 2.
        .filter((c) => !(this._liveEl?.isConnected && this._livePronto === c.entity))
        .map((c) => ({
          entityId: c.entity,
          base: c.base,
          prioridade:
            c.entity === principal?.entity ? ('principal' as const) : ('secundaria' as const),
        })),
    );

    this._cuidarDoAoVivo(principal?.entity);
  }

  /**
   * Aponta o player WebRTC nativo do HA para a câmera do palco.
   *
   * A foto continua por baixo até o evento real de primeiro quadro. Se a
   * negociação não fechar, o player é removido e a foto permanece ativa.
   */
  private _cuidarDoAoVivo(entityPalco: string | undefined): void {
    const alvo = entityPalco && usaWebRtc(entityPalco) ? entityPalco : '';
    if (!alvo) {
      this._estadoAoVivo = 'ocioso';
      this._pararAoVivo();
      return;
    }
    if (this._estadoAoVivo === 'fallback' && this._fallbackAoVivo !== alvo) {
      this._estadoAoVivo = 'ocioso';
      this._fallbackAoVivo = '';
    }
    if (
      this._estadoAoVivo === 'entregue-more-info' ||
      this._estadoAoVivo === 'retomando' ||
      this._estadoAoVivo === 'fallback' ||
      this._estadoAoVivo === 'carregando-player'
    ) {
      this._pararAoVivo();
      return;
    }

    const slot = this.shadowRoot?.querySelector<HTMLElement>(
      `.camera-live-slot[data-camera-live="${alvo}"]`,
    );
    if (!slot) return;

    if (!this._liveEl || this._liveEntity !== alvo) {
      this._pararAoVivo();
      const el = this._criarPlayer();
      if (!el) {
        // Carga fria: pede ao Lovelace o modulo oficial e tenta de novo quando
        // customElements registrar o player. A foto continua por baixo.
        this._estadoAoVivo = 'carregando-player';
        const token = ++this._tokenDefinicaoPlayer;
        void garantirPlayerWebRtc(alvo, this._hass).then((ok) => {
          if (!this.isConnected || token !== this._tokenDefinicaoPlayer) return;
          this._estadoAoVivo = ok ? 'ocioso' : 'fallback';
          this._fallbackAoVivo = ok ? '' : alvo;
          this._sincronizarCameras();
        });
        return;
      }
      this._estadoAoVivo = 'negociando';
      this._liveEl = el;
      this._liveEntity = alvo;
      // ANTERIOR (rollback contexto Lit): o relogio comecava antes do primeiro
      // update do player: `this._liveIniciadoEm = performance.now()`.
      // Agora mede a partir do momento em que entityid realmente dispara a
      // negociacao, depois de apiContext e connectionContext estarem consumidos.
      ouvir(SONDA, el, 'load', this._aoCarregarAoVivo);
      ouvir(SONDA, el, 'streams', this._aoInformarStreams);

      // O player consome os contextos internos de API e conexao do HA durante
      // o primeiro update Lit. Apenas anexar e escrever a propriedade na linha
      // seguinte ainda era cedo: _startWebRtc via os contextos vazios, retornava
      // e nao repetia quando eles chegavam. Primeiro conecta e espera o primeiro
      // updateComplete; somente depois muda entityid e dispara a negociacao.
      slot.appendChild(el);
      // ANTERIOR (rollback contexto Lit):
      //   el.entityid = alvo;
      //   this._armarPrazoAoVivo(el, alvo);
      this._iniciarPlayerAposContexto(el, alvo);
      return;
    }

    const el = this._liveEl;
    // O render recria o DOM e desanexa o elemento; reanexar aqui é o que o
    // mantém vivo sem recriá-lo.
    if (el.parentElement !== slot) slot.appendChild(el);
    if (el.entityid !== alvo) el.entityid = alvo;
  }

  /**
   * Cria o player ao vivo, preferindo WebRTC DIRETO.
   *
   * ── POR QUE NAO USAR MAIS `hui-image cameraView="live"` ──────────────────
   *
   * Aquele caminho monta um `ha-camera-stream`, que é um SELETOR: ele começa
   * exibindo HLS e só migra para WebRTC depois que a negociação fecha e o vídeo
   * fica válido. Medido em 2026-08-09 pelos dois relógios na mesma tela —
   * more-info 10:46:45, tile 10:46:33 — ele **ficou no HLS**, com os ~12 s de
   * buffer de segmentos.
   *
   * E a métrica `stream 264px` que eu havia usado como prova de sucesso só
   * confirmava a PRESENÇA do `ha-camera-stream`, nunca o protocolo. Diagnóstico
   * do Codex, e ele está certo.
   *
   * `ha-web-rtc-player` é o player final, sem o seletor na frente: negocia
   * WebRTC e ponto. Sem fase HLS, sem tentativa paralela dos dois — que era
   * também o que competia com o more-info.
   *
   * ── O FALLBACK ANTERIOR, E POR QUE SAIU ─────────────────────────────────
   *
   * O fallback para `hui-image` reabria HLS e devolvia os 12 s de atraso. Se o
   * player direto não estiver registrado, o fallback correto é a foto já
   * renderizada, sem iniciar outro protocolo.
   */
  private _criarPlayer(): PlayerAoVivo | undefined {
    const el = criarPlayerWebRtc() as PlayerAoVivo | undefined;
    if (el) {
      el.classList.add('camera-live-el');
      // Atributos booleanos: o player os lê como atributo, não como propriedade.
      el.setAttribute('muted', '');
      el.setAttribute('playsinline', '');
      el.setAttribute('autoplay', '');
      try {
        el.fitMode = 'cover';
      } catch {
        // Versão sem a propriedade: o CSS já cobre o enquadramento.
      }
      this._modoPlayer = 'webrtc';
      return el;
    }

    // ANTERIOR (rollback WebRTC Office): quando o player direto nao estava
    // registrado, criava hui-image com cameraView live. Esse fallback reabria
    // exatamente o HLS de 12 segundos que esta correcao precisa evitar.
    // O fallback agora e o instantaneo que ja existe sob o slot.

    this._modoPlayer = 'nenhum';
    return undefined;
  }

  private _modoPlayer: 'webrtc' | 'nenhum' = 'nenhum';

  /**
   * Espera o player oficial consumir os contextos Lit antes de lhe dar a
   * entidade. O componente do HA so reinicia WebRTC quando `entityid` muda; se
   * essa mudanca acontece antes de apiContext/connectionContext, ele retorna e
   * fica inerte ate ser removido.
   */
  private _iniciarPlayerAposContexto(el: PlayerAoVivo, entityId: string): void {
    void Promise.resolve(el.updateComplete)
      .then(() => {
        if (this._liveEl !== el || this._liveEntity !== entityId || !el.isConnected) return;
        this._liveIniciadoEm = performance.now();
        el.entityid = entityId;
        marcarPlayer(entityId, 'entityid atribuido');
        this._armarPrazoAoVivo(el, entityId);
      })
      .catch(() => {
        if (this._liveEl === el && this._liveEntity === entityId) this._falharAoVivo('contexto');
      });
  }

  /**
   * Registra QUAL player foi montado, e se ele produziu vídeo.
   *
   * ── POR QUE ESTA MEDIÇÃO MUDOU ──────────────────────────────────────────
   *
   * A versão anterior media a PRESENÇA de um "ha-camera-stream" no shadow root
   * e registrava isso como sucesso. Não provava nada sobre o protocolo: aquele
   * elemento é um seletor que começa em HLS. Eu li "stream 264px" como "está em
   * WebRTC" e estava errado.
   *
   * E ela chamava "requisicaoManual" com o tempo desde a montagem do
   * componente. O painel mostra isso na coluna de REQUISIÇÕES, ao lado de
   * chamadas de rede reais — um "pior: 122.348 ms" ali parece uma requisição
   * pendurada por dois minutos, que nunca existiu. Métrica sintética vestida de
   * medição de rede. Diagnóstico do Codex, e ele está certo nos dois pontos.
   *
   * Agora o evento `load` do próprio player, confirmado por readyState >= 2,
   * promove o vídeo. A duração começa na tentativa WebRTC, não na montagem.
   */
  // ANTERIOR (rollback WebRTC Office): marcarModoAoVivo esperava seis segundos
  // e fotografava readyState. Nao reagia a sucesso nem a falha, deixava o video
  // vazio por cima da foto e registrava tempo desde a montagem.

  private _aoCarregarAoVivo = (): void => {
    const el = this._liveEl;
    const entityId = this._liveEntity;
    if (!el || !entityId || !this.isConnected) return;
    const video = el.shadowRoot?.querySelector('video');
    if (!video || video.readyState < 2 || this._livePronto === entityId) return;

    if (pareceQuadroVerde(video)) {
      if (this._quadroVerdeRegistrado !== entityId) {
        this._quadroVerdeRegistrado = entityId;
        marcarPlayer(
          entityId,
          'quadro verde rejeitado',
          performance.now() - this._liveIniciadoEm,
          false,
        );
      }
      encerrarTimer(SONDA, this._timerQuadroVerde);
      this._timerQuadroVerde = espera(SONDA, () => {
        this._timerQuadroVerde = undefined;
        this._aoCarregarAoVivo();
      }, 700);
      return;
    }

    this._livePronto = entityId;
    this._estadoAoVivo = 'ao-vivo';
    encerrarTimer(SONDA, this._timerQuadroVerde);
    this._timerQuadroVerde = undefined;
    el.classList.add('is-ready');
    encerrarTimer(SONDA, this._timerAoVivo);
    this._timerAoVivo = undefined;
    const nome = entityId.split('.')[1] ?? entityId;
    requisicaoManual(
      `marco: ${nome} · player ${this._modoPlayer} · primeiro quadro`,
      performance.now() - this._liveIniciadoEm,
      true,
    );
    // Somente agora o motor de instantaneos pode ceder esta camera ao video.
    this._sincronizarCameras();
  };

  private _aoInformarStreams = (evento: Event): void => {
    const detalhe = (evento as CustomEvent<{ hasVideo?: boolean }>).detail;
    if (detalhe?.hasVideo === false) this._falharAoVivo('sem video');
  };

  private _armarPrazoAoVivo(el: PlayerAoVivo, entityId: string): void {
    encerrarTimer(SONDA, this._timerAoVivo);
    this._timerAoVivo = espera(SONDA, () => {
      this._timerAoVivo = undefined;
      if (this._liveEl !== el || this._liveEntity !== entityId || this._livePronto === entityId) return;
      this._falharAoVivo('prazo');
    }, PRAZO_MODO_AO_VIVO);
  }

  private _falharAoVivo(motivo: 'sem video' | 'prazo' | 'contexto'): void {
    const entityId = this._liveEntity;
    if (!entityId) return;
    const nome = entityId.split('.')[1] ?? entityId;
    requisicaoManual(
      `marco: ${nome} · player ${this._modoPlayer} · ${motivo}`,
      performance.now() - this._liveIniciadoEm,
      false,
    );
    // Nao repetir a negociacao a cada sensor do Office. Uma nova tentativa
    // acontece ao sair e voltar ao comodo.
    this._estadoAoVivo = 'fallback';
    this._fallbackAoVivo = entityId;
    this._pararAoVivo();
    this._sincronizarCameras();
  }

  private _pararAoVivo(): void {
    encerrarTimer(SONDA, this._timerAoVivo);
    this._timerAoVivo = undefined;
    encerrarTimer(SONDA, this._timerQuadroVerde);
    this._timerQuadroVerde = undefined;
    const el = this._liveEl;
    if (el) {
      pararDeOuvir(SONDA, el, 'load', this._aoCarregarAoVivo);
      pararDeOuvir(SONDA, el, 'streams', this._aoInformarStreams);
      el.remove();
    }
    this._liveEl = undefined;
    this._liveEntity = '';
    this._livePronto = '';
    this._quadroVerdeRegistrado = '';
    this._modoPlayer = 'nenhum';
  }

  private _aoFecharDialogo = (evento: Event): void => {
    const detalhe = (evento as CustomEvent<{ dialog?: string }>).detail;
    if (detalhe?.dialog !== 'ha-more-info-dialog') return;
    if (this._estadoAoVivo !== 'entregue-more-info') return;

    this._estadoAoVivo = 'retomando';
    marcarPlayer(this._cameraAtiva, 'more-info fechado; retomando');
    encerrarTimer(SONDA, this._timerRetomadaAoVivo);
    this._timerRetomadaAoVivo = espera(SONDA, () => {
      this._timerRetomadaAoVivo = undefined;
      if (!this.isConnected || this._estadoAoVivo !== 'retomando') return;
      this._estadoAoVivo = 'ocioso';
      this._fallbackAoVivo = '';
      this._sincronizarCameras();
    }, ATRASO_RETOMADA_MORE_INFO);
  };

  /**
   * A métrica que o usuário de fato sente: **quanto tempo desde abrir o cômodo
   * até a imagem aparecer**.
   *
   * Não é a duração da requisição. Quem busca o primeiro quadro é o próprio
   * elemento de imagem, e o relógio que importa começa quando a subview monta —
   * é isso que ele chama de "demora para renderizar". Só o primeiro por
   * montagem: os seguintes são atualização, não espera.
   */
  private _marcarQuadroNaTela(entityId: string): void {
    if (this._quadrosNaTela.has(entityId)) return;
    this._quadrosNaTela.add(entityId);
    const nome = entityId.split('.')[1] ?? entityId;
    requisicaoManual(`câmera ${nome} · até aparecer`, performance.now() - this._montadoEm, true);
  }

  private _montadoEm = 0;
  private readonly _quadrosNaTela = new Set<string>();
  private readonly _socorros = new Set<string>();

  /**
   * O elemento não conseguiu baixar o primeiro quadro sozinho.
   *
   * Sem isto a tela ficaria vazia até o motor entrar, uma cadência inteira
   * depois. Uma vez por câmera por montagem: se a segunda também falhar, quem
   * cuida é o ciclo normal, com o recuo dele.
   */
  private _socorrerCamera(entityId: string): void {
    if (this._socorros.has(entityId)) return;
    this._socorros.add(entityId);
    this._motorCameras.buscarAgora(entityId);
  }

  /**
   * Vigia do primeiro quadro.
   *
   * O `@error` do elemento cobre a falha declarada. Não cobre o caso do
   * Q. Miguel, medido em 2026-08-07: o pedido do elemento **trava** — não
   * carrega e não dá erro — e a tela fica vazia até o motor entrar, uma cadência
   * inteira depois.
   *
   * O prazo é 4 s porque seis das oito câmeras mostram o primeiro quadro em
   * menos de 5 s: para elas o vigia não custa nada, porque a imagem já chegou.
   * Só as travadas pagam uma requisição a mais, e para elas vale.
   */
  private _armarVigiaDeCameras(): void {
    for (const cam of this._camerasConfiguradas()) {
      espera(SONDA, () => {
        if (!this.isConnected || this._quadrosNaTela.has(cam.entity)) return;
        this._socorrerCamera(cam.entity);
      }, PRAZO_PRIMEIRO_QUADRO);
    }
  }

  /** Põe na tela o quadro que o motor acabou de baixar. */
  private _quadroPronto(entityId: string, url: string): void {
    this._urlsCarregadas[entityId] = url;
    const img = this.shadowRoot?.querySelector<HTMLImageElement>(
      `img[data-camera-entity="${entityId}"]`,
    );
    if (!img) return;
    img.src = url;
    img.classList.add('is-loaded');
    img.closest('.camera-main')?.classList.add('has-loaded-image');
  }

  /**
   * Injeta a folha de material do tema no shadow root.
   *
   * `subviewStyles()` devolve o CSS da pele das tiles (câmeras, hub, A/C,
   * cartela de iluminação). As subviews atuais o interpolam dentro do próprio
   * `<style>`; aqui ele entra como folha adotada, depois das folhas estáticas,
   * para manter a mesma ordem de cascata.
   *
   * O módulo pode ainda não ter carregado quando o componente conecta — daí a
   * segunda tentativa no próximo quadro.
   */
  private _injetarMaterial(tentativa = 0): void {
    const raiz = this.shadowRoot;
    if (!raiz || this._materialInjetado) return;
    // A instrumentação da Fase 6.0 mostrou esta cadeia disparando até 1,2s
    // depois de o componente sair da árvore (20 tentativas de 60ms). Não era
    // vazamento — os timeouts se encerram sozinhos —, mas era trabalho feito
    // sobre um componente morto, e o custo aparecia na medição. Sair aqui
    // encerra a cadeia na hora.
    if (!this.isConnected) return;
    const g = globalThis as { BrunoSurfaceMaterial?: { subviewStyles?: () => string } };
    const css = g.BrunoSurfaceMaterial?.subviewStyles?.();
    if (!css) {
      if (tentativa < 20) espera(SONDA, () => this._injetarMaterial(tentativa + 1), 60);
      return;
    }
    try {
      const folha = new CSSStyleSheet();
      folha.replaceSync(css);
      raiz.adoptedStyleSheets = [...raiz.adoptedStyleSheets, folha];
      this._materialInjetado = true;
    } catch {
      // Navegador sem CSSStyleSheet construível: cai para um <style>.
      const el = document.createElement('style');
      el.textContent = css;
      raiz.appendChild(el);
      this._materialInjetado = true;
    }
  }

  private _materialInjetado = false;

  /**
   * Os atributos do host são o interruptor de cada bloco de CSS.
   *
   * Ficam no HOST, não numa classe interna, porque o CSS gerado usa
   * `:host([data-…])` — é o que permite base e blocos conviverem na mesma folha
   * sem o grid da Cozinha valer para todos.
   */
  private _aplicarAtributos(): void {
    const room = this._room;
    if (!room) return;
    this.setAttribute('data-room', room.id);

    const ent = this._sub?.entities as Record<string, unknown> | undefined;
    const liga = (nome: string, condicao: boolean) => {
      if (condicao) this.setAttribute(nome, '');
      else this.removeAttribute(nome);
    };

    liga('data-appliances', Boolean(ent?.['appliances'] ?? ent?.['dishwasher']));
    liga('data-tvhub', Boolean(ent?.['tv']));
    // Folha do telefone: o atributo é o interruptor, igual aos demais. Sem
    // folha aberta ele não existe, e nenhuma regra de folha casa.
    if (this._folha) this.setAttribute('data-folha', this._folha);
    else this.removeAttribute('data-folha');
    if (this._folhaSaindo) this.setAttribute('data-folha-saindo', '');
    else this.removeAttribute('data-folha-saindo');
    // PS5 só existe onde há entidade declarada. Na Sala há; nos outros cinco a
    // chave era string vazia e saiu na geração da configuração.
    liga('data-ps5', Boolean(ent?.['ps5']));
  }

  /** O Office troca o hub de midia pela Estacao de Trabalho, com o PC. */
  private get _temPc(): boolean {
    const ent = this._sub?.entities as Record<string, unknown> | undefined;
    return Boolean(ent?.['pcSession'] ?? ent?.['pcActive'] ?? ent?.['pcPower']);
  }

  /** O cômodo tem eletrodomésticos? Só a Cozinha, e ela usa um grid próprio. */
  private get _temEletrodomesticos(): boolean {
    const ent = this._sub?.entities as Record<string, unknown> | undefined;
    return Boolean(ent?.['appliances'] ?? ent?.['dishwasher']);
  }

  static override styles = [
    /*
     * BASE DA FASE 6.2 — escala fluida + container query.
     *
     * Hoje o CSS gerado tem 1.257 valores em px fixos, calibrados num único
     * tablet. A saída não é somar breakpoints (eles se multiplicam por
     * aparelho): é medir relativo ao CONTAINER, com piso e teto.
     *
     * Estas duas linhas NÃO mudam nada por si: enquanto as regras continuarem
     * em px, o layout é idêntico. Elas apenas tornam `cqi` disponível, que é o
     * pré-requisito de cada módulo extraído daqui em diante — sem
     * `container-type`, `cqi` não resolve e todo valor fluido vira zero.
     *
     * Verificado: geometria dos módulos idêntica antes e depois, em 1920x1200 e
     * 1280x720. Ver docs/24-performance-baseline.md.
     */
    scaleTokens,
    css`
      :host {
        container-type: inline-size;
        container-name: subview;
      }
    `,
    SUBVIEW_BASE_CSS,
    SUBVIEW_TVHUB_CSS,
    SUBVIEW_APPLIANCES_CSS,
    SUBVIEW_PS5_CSS,
    ...Object.values(SUBVIEW_SOBREPOSICOES),
    css`
      /*
       * Vídeo ao vivo (Fase 6.2B parte 2).
       *
       * Mesma caixa da imagem, uma camada ACIMA dela, e com o mesmo tratamento
       * de cor — a troca entre instantâneo e vídeo não pode aparecer como um
       * salto de brilho. Nasce invisível: só aparece quando o stream toca de
       * fato. Enquanto isso o instantâneo está embaixo, e é o que se vê.
       */
      .camera-live-slot {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
      }
      .camera-live-slot:empty {
        display: none;
      }
      /*
       * O player nativo cobre a caixa inteira e recebe o mesmo tratamento de cor
       * do instantâneo — a troca entre os dois não pode aparecer como salto de
       * brilho. O instantâneo continua embaixo, como rede de segurança.
       */
      /*
       * As regras abaixo são cópia literal das que a subview de câmeras usa e
       * que estão provadas nesta instalação. O "!important" não é exagero: o
       * "hui-image" dimensiona a si próprio por proporção, e sem forçar ele não
       * preenche o palco.
       */
      .camera-live-slot > *,
      .camera-live-slot hui-image,
      .camera-live-el {
        display: block;
        width: 100% !important;
        height: 100% !important;
      }
      .camera-live-slot video,
      .camera-live-slot img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      .camera-live-el {
        filter: brightness(0.86) saturate(0.94);
        opacity: 0;
        transition: opacity 160ms ease;
      }
      .camera-live-el.is-ready {
        opacity: 1;
      }

      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }

      /* Na subview atual o elemento interno do anel e uma DIV, e o anel mede 203,27px. Com um
         SVG no lugar dela media 203,00 exatos, e esse quarto de pixel movia o
         anel 1px para baixo no arredondamento — 424 contra os 423 da
         referencia. Com height 100% o anel mede 203,00 e o real 203,27: fica 1px acima no
         arredondamento. Um quarto de pixel num elemento interno, invisivel, e
         perseguir isso custaria mais do que vale — os seis modulos da linha de
         base batem exatos. */
      .icg-root {
        width: 100%;
        height: 100%;
        display: flex;
      }
      .icg-root > svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      /* Ajuste PEDIDO, não paridade: na origem o valor final é 20px de ícone e
         4px de gap — os 28px/11px que aparecem antes no arquivo são de uma
         definição sobrescrita depois. O usuário pediu um pouco maior e mais
         respiro, então a mudança fica aqui, no componente, e o CSS gerado segue
         cópia fiel do original. */
      /* ÍCONE DA CÉLULA DE LUZ — a causa raiz, depois de três tentativas minhas
         que não surtiram efeito nenhum.

         O elemento bruno-icon se dimensiona assim, no próprio shadow root:

             width:  var(--mdc-icon-size, 1em);
             height: var(--mdc-icon-size, 1em);

         Nada na cadeia da célula define --mdc-icon-size. O glifo caía no
         fallback 1em, isto é, o tamanho da FONTE herdada — cerca de 13px — e
         ficava minúsculo dentro de uma caixa muito maior.

         TENTATIVAS QUE FALHARAM, e por quê (mantidas aqui para não repetir):

           1. aumentar só .lc-icon         -> mexe na CAIXA, não no glifo;
           2. aumentar .tpl-light-icon     -> idem, é só o invólucro;
           3. regra .tpl-light-icon svg    -> NÃO CASA NADA. O <svg> vive dentro
                                              do shadow root do bruno-icon, e um
                                              seletor descendente comum não
                                              atravessa shadow root.

         O que funciona é a propriedade customizada: ela ATRAVESSA o shadow root
         por herança — é exatamente o mecanismo para o qual o bruno-icon foi
         escrito. Por isso o tamanho vai em --mdc-icon-size, e não em width.

         Medição: contar SVG por seletor descendente devolve zero mesmo com o
         ícone desenhado, pela mesma razão. Para medir, alcançar o shadow root
         do bruno-icon. */
      .lc-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon .tpl-light-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon bruno-icon {
        --mdc-icon-size: 30px;
        width: 30px;
        height: 30px;
      }
      .light-cell {
        grid-template-columns: 32px minmax(0, 1fr) auto;
        gap: 10px;
      }
      .light-grid {
        gap: 8px;
      }

      /* Mesma linguagem do card dinâmico da Home: a arte permanece como
         contexto no pause, mas perde nitidez para sinalizar que não está
         reproduzindo. A caixa e a geometria do Hub não mudam. */
      .mh-art.is-paused img {
        filter: blur(2.8px) brightness(0.78) saturate(0.9);
      }
      /* A arte tablet e centralizada por translate(-50%, -50%). Escalar sem
         preservar esse translate deslocaria a capa ao pausar. */
      .mh-art.is-paused.is-cover img {
        transform: translate(-50%, -50%) scale(1.035);
      }

      /* UNIFORMIDADE GLOBAL DOS STATUS (2026-08-15).
         A Home usa faixa de 48px, tile de 46px, ícone de 22/18px e textos
         10/11px. As subviews herdavam uma transcrição fluida menor. No tablet
         a linha do grid também passa a reservar 48px; no telefone o Plano B
         visual, definido no último stylesheet, preserva a geometria do fluxo. */
      @media (min-width: 801px) {
        :host([data-room='sala']) .room-subview,
        :host([data-room='office']) .room-subview,
        :host([data-room='casal']) .room-subview,
        :host([data-room='marina']) .room-subview,
        :host([data-room='miguel']) .room-subview {
          grid-template-rows: 48px minmax(0, 1fr);
        }
        .subview-topband {
          height: 48px;
          min-height: 48px;
          gap: 8px;
        }
        .topband-badges {
          height: 48px;
        }
        .tb-badge {
          height: 46px;
          grid-template-columns: 22px auto;
          column-gap: 9px;
          padding: 0 16px;
        }
        .tb-badge-icon {
          width: 22px;
          height: 22px;
        }
        .tb-badge-icon bruno-icon {
          --mdc-icon-size: 18px;
        }
        .tb-badge-title {
          font-size: 10px;
        }
        .tb-badge-sub {
          font-size: 11px;
        }
      }

      /* O dock nasce estável — sem barra de rolagem piscando nem célula que
         encolhe e alarga.

         O corpo abre animando a linha do grid de 0fr para 1fr. Enquanto ela
         cresce, o teto de altura do contêiner de rolagem vale quase zero, o
         conteúdo transborda e o navegador mostra a barra — que rouba largura,
         encolhe as duas colunas e, ao terminar a animação, devolve tudo. Duas
         medidas, ambas necessárias:

           1. reservar a calha da barra, para que a largura útil não dependa de
              ela estar presente ou não;
           2. rolagem só DEPOIS de assentar — durante a abertura o transbordo é
              apenas recortado. */
      .lights-scroll {
        scrollbar-gutter: stable;
      }
      .lights-card:not(.is-settled) .lights-scroll {
        overflow-y: hidden;
      }
    `,
    // ÚLTIMO de propósito: o layout de telefone sombreia os oito blocos
    // `@media (max-width: 800px)` que vieram dos arquivos originais. Ver o
    // cabeçalho de subview-phone.styles.ts.
    SUBVIEW_TELEFONE_CSS,
  ];

  /**
   * Barra superior — seis badges e o relógio.
   *
   * Transcrito de `_renderTopBand`. A ordem importa: a Presença é a PRIMEIRA
   * desde 2026-07-29, quando o rodapé saiu e ela subiu para cá. As três marcadas
   * com `data-phone-hide` somem no telefone — a regra era posicional
   * (`nth-child(n+4)`) e virou explícita justamente porque a Presença mudou as
   * posições.
   *
   * O azul da Presença é o mesmo dot dos cards de cômodo (96,165,250) e lê a
   * mesma fonte — `motion_recent` —, para painel e subview nunca discordarem.
   */
  private _renderTopBand() {
    const e = this._room?.entities;
    const hass = this._hass;
    const estado = (id?: string) => (id && hass ? hass.states[id] : undefined);

    const luzes = this._contarLuzes();
    const presencaAtiva = estado(e?.motionRecent)?.state === 'on';

    const badges = [
      { icon: 'mdi:motion-sensor', titulo: 'Presença', sub: this._linhaPresenca(),
        tone: '96,165,250', ativo: presencaAtiva, ocultarNoTelefone: true },
      { icon: 'mdi:lightbulb', titulo: 'Luzes', sub: this._linhaLuzes(),
        tone: '247,198,0', ativo: luzes > 0, ocultarNoTelefone: false },
      { icon: 'mdi:thermometer', titulo: 'Temperatura',
        sub: this._valorSensor(this._idDe('temperature') ?? e?.temperature, '°', 1),
        tone: '247,170,90', ativo: false, ocultarNoTelefone: false },
      { icon: 'mdi:water-percent', titulo: 'Umidade',
        sub: this._valorSensor(this._idDe('humidity') ?? e?.humidity, '%', 0),
        tone: '127,200,233', ativo: false, ocultarNoTelefone: false },
      { icon: 'mdi:router-wireless', titulo: 'Roteador', sub: this._linhaRede(this._idDe('router')),
        tone: '154,160,166', ativo: false, ocultarNoTelefone: true },
      { icon: 'mdi:zigbee', titulo: 'Hub Zigbee', sub: this._linhaRede(this._idDe('zigbeeHub')),
        tone: '154,160,166', ativo: false, ocultarNoTelefone: true },
    ];

    return html`
      <header class="subview-topband">
        <div class="topband-badges">
          ${badges.map(
            (b) => html`
              <div
                class="tb-badge ${b.ativo ? 'is-active' : ''}"
                data-phone-hide=${b.ocultarNoTelefone ? '' : nothing}
                style="--tone: ${b.tone};"
              >
                <span class="tb-badge-icon"><bruno-icon icon=${b.icon}></bruno-icon></span>
                <span class="tb-badge-text">
                  <span class="tb-badge-title">${b.titulo}</span>
                  <span class="tb-badge-sub">${b.sub}</span>
                </span>
              </div>
            `,
          )}
        </div>
        <div class="topband-clock" aria-label="Data e hora">
          <span data-clock>${this._hora()}</span>
          <small>${this._data()}</small>
        </div>
      </header>
    `;
  }

  private _contarLuzes(): number {
    const hass = this._hass;
    const e = this._room?.entities;
    if (!hass || !e?.lights) return 0;
    return e.lights.filter((id) => hass.states[id]?.state === 'on').length;
  }

  /**
   * Legenda da badge de luzes — acesas POR ZONA.
   *
   * As subviews atuais escrevem "Sala 3 · Varanda 4" nos quatro cômodos com duas
   * zonas, e "Office 2" / "Cozinha 1" nos dois de zona única. Em todos os seis o
   * texto é a chave da zona com inicial maiúscula, então a linha sai da própria
   * lista de luzes em vez de uma tabela paralela. Eu vinha escrevendo
   * "2 acesas", que perdia a divisão por zona.
   */
  private _linhaLuzes(): string {
    const luzes = this._luzesDaConfiguracao();
    if (!luzes.length) return `${this._contarLuzes()} acesas`;

    const porZona = new Map<string, number>();
    for (const luz of luzes) {
      const zona = luz.zone || 'sala';
      const acesa = this._hass?.states[luz.entity]?.state === 'on' ? 1 : 0;
      porZona.set(zona, (porZona.get(zona) ?? 0) + acesa);
    }
    return [...porZona.entries()]
      .map(([zona, n]) => `${zona.charAt(0).toUpperCase()}${zona.slice(1)} ${n}`)
      .join(' · ');
  }

  private _linhaPresenca(): string {
    const hass = this._hass;
    const e = this._room?.entities;
    if (!hass || !e?.semanticState) return 'Sensor indisponível';
    const s = hass.states[e.semanticState];
    const display = s?.attributes['display'];
    if (display) return String(display);
    return hass.states[e.motionRecent ?? '']?.state === 'on' ? 'Presença' : 'Sem presença';
  }

  /**
   * Leitura de um sensor da barra superior.
   *
   * Casas decimais e o traço de indisponível vêm dos originais: temperatura com
   * uma casa, umidade inteira, e `--` quando não há leitura. O grau é o SINAL DE
   * GRAU (U+00B0), não o ordinal masculino — este último desenha um traço sob o
   * círculo e destoa do resto do painel.
   */
  private _valorSensor(id: string | undefined, sufixo: string, casas = 0): string {
    const s = id && this._hass ? this._hass.states[id] : undefined;
    const bruto = String(s?.state ?? '').toLowerCase();
    if (!s || ['unknown', 'unavailable', 'none', ''].includes(bruto)) return '--';
    return `${numero(s.state, casas)}${sufixo}`;
  }

  /** Roteador e hub Zigbee: "Online" quando conectado, senão o próprio estado. */
  private _linhaRede(id: string | undefined): string {
    if (!id) return 'Online';
    const estado = String(this._hass?.states[id]?.state ?? 'Online');
    return ['on', 'home', 'connected', 'online'].includes(estado.toLowerCase()) ? 'Online' : estado;
  }

  private _hora(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Data da barra superior.
   *
   * As tabelas são fixas de propósito: `toLocaleDateString` em pt-BR devolve
   * "segunda-feira, 5 de ago." — o " de " e o ponto final deixavam a linha 30px
   * mais larga que a das subviews atuais e empurravam o relógio para a esquerda.
   */
  private _data(): string {
    const dias = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const agora = new Date();
    return `${dias[agora.getDay()]}, ${agora.getDate()} ${meses[agora.getMonth()]}`;
  }

  /**
   * Dock de iluminação — a faixa de 54px na coluna direita, acima do A/C.
   *
   * Transcrito de `_renderLightsDock` das subviews atuais. A altura de 54px vem
   * da faixa fechada, não de um valor no CSS: é o `lights-dock` com o botão de
   * título à esquerda e os dois chips à direita. Renderizar o cartão vazio dava
   * 2px — só as bordas — e era a única divergência que sobrava contra a linha
   * de base.
   *
   * O corpo (`lights-body`) existe sempre; quem o abre é a classe `is-open` no
   * cartão, e o CSS resolve a altura. As seções de zona entram no passo
   * seguinte — a faixa fechada já fecha a geometria.
   */
  /** Verdadeiro quando a animação de abertura já terminou. */
  private _luzesAssentadas = false;
  private _timerLuzes: number | undefined;

  /**
   * Abre e fecha o dock de iluminação.
   *
   * A transição do corpo é de 200 ms; a folga de 40 ms cobre o quadro em que o
   * navegador ainda está compondo. Só depois disso o corpo passa a rolar.
   */
  private _alternarDock(): void {
    this._lightsOpen = !this._lightsOpen;
    this._luzesAssentadas = false;
    encerrarTimer(SONDA, this._timerLuzes);
    this._timerLuzes = espera(SONDA, () => {
      this._luzesAssentadas = this._lightsOpen;
      this._timerLuzes = undefined;
      this.requestUpdate();
    }, 240);
    this.requestUpdate();
  }

  /**
   * No tablet o titulo conserva o comportamento historico de expandir/recolher
   * o dock. Na folha do telefone ele passa a ser o controle de retorno pedido
   * no ajuste pos-dispositivo: o chevron ao lado do titulo fecha a folha.
   */
  private _acionarCabecalhoLuzes(): void {
    if (this._estaNoTelefone() && this._folha === 'luzes') {
      this._fecharFolha();
      return;
    }
    this._alternarDock();
  }

  /**
   * Troca a fonte do acordeao sem depender de uma atualizacao do HA.
   *
   * Esses campos nao usam decorador reativo. Informar ao Lit o valor anterior
   * garante a reconciliacao imediata no WebView; um `requestUpdate()` generico
   * podia ser absorvido durante outro update e manter TV/PC visualmente presos
   * mesmo depois de um toque explicito no Spotify.
   */
  private _selecionarFonteMidia(chave: string): void {
    const anterior = this._fonteMidia;
    this._fonteMidia = chave;
    this._fonteMidiaManual = this._estaNoTelefone();
    this._menuMidiaAberto = false;
    this.requestUpdate('_fonteMidia', anterior);
  }

  // O breakpoint e o mesmo do CSS. A vigia nao redesenha o tablet: ela apenas
  // impede que um estado de folha aberto no telefone sobreviva a uma mudanca
  // de largura e deixe a shell com a camada elevada fora do modo mobile.
  private _aoMudarModoTelefone = (evento: MediaQueryListEvent): void => {
    if (!evento.matches) this._limparFolhaImediatamente();
  };

  private _iniciarVigiaTelefone(): void {
    if (typeof globalThis.matchMedia !== 'function') return;
    this._pararVigiaTelefone();
    this._mediaTelefone = globalThis.matchMedia('(max-width: 800px)');
    this._mediaTelefone.addEventListener('change', this._aoMudarModoTelefone);
    if (!this._mediaTelefone.matches) this._limparFolhaImediatamente();
  }

  private _pararVigiaTelefone(): void {
    this._mediaTelefone?.removeEventListener('change', this._aoMudarModoTelefone);
    this._mediaTelefone = undefined;
  }

  private _estaNoTelefone(): boolean {
    if (this._mediaTelefone) return this._mediaTelefone.matches;
    if (typeof globalThis.matchMedia !== 'function') return true;
    return globalThis.matchMedia('(max-width: 800px)').matches;
  }

  /** Captura a câmera ANTES de qualquer mutação que monte ou desmonte a folha. */
  private _capturarBaseFolha(): AncoraFolhaTelefone | undefined {
    if (!this._estaNoTelefone()) return undefined;
    let cursor: Node | null = this.parentNode;
    let rolavel: HTMLElement | undefined;
    while (cursor) {
      if (cursor instanceof HTMLElement) {
        const estilo = globalThis.getComputedStyle?.(cursor);
        if (estilo && /(auto|scroll)/.test(estilo.overflowY)) {
          rolavel = cursor;
          break;
        }
      }
      if (cursor.parentNode) {
        cursor = cursor.parentNode;
        continue;
      }
      const raiz = cursor.getRootNode();
      cursor = raiz instanceof ShadowRoot && raiz.host !== cursor ? raiz.host : null;
    }
    if (!rolavel) return undefined;
    const ancora = this.renderRoot.querySelector<HTMLElement>('.cameras-card') ?? this;
    return {
      rolavel,
      topoCamera: ancora.getBoundingClientRect().top,
      rolagem: rolavel.scrollTop,
      token: ++this._tokenAncoraFolha,
    };
  }

  /**
   * Mantém câmera e faixa de tiles no mesmo pixel ao montar/desmontar uma folha.
   *
   * ANTERIOR (rollback 2026-08-15): a medição acontecia depois de alterar
   * data-folha. Nesse instante o WebView já podia ter aplicado o primeiro
   * reflow; portanto topoAntes e topoDepois descreviam a mesma geometria e a
   * correção chegava tarde. A captura agora precede a mutação e a restauração
   * espera duas composições, cobrindo Lit + scroll anchoring do Safari.
   */
  private _restaurarBaseFolha(estado: AncoraFolhaTelefone | undefined): void {
    if (!estado) return;
    void this.updateComplete.then(() => {
      globalThis.requestAnimationFrame(() => {
        globalThis.requestAnimationFrame(() => {
          if (estado.token !== this._tokenAncoraFolha || !estado.rolavel.isConnected) return;
          const ancoraDepois = this.renderRoot.querySelector<HTMLElement>('.cameras-card') ?? this;
          const delta = ancoraDepois.getBoundingClientRect().top - estado.topoCamera;
          estado.rolavel.scrollTop = Math.max(0, estado.rolagem + delta);
        });
      });
    });
  }

  /**
   * Ancora a altura máxima da folha no topo REAL da Cortina.
   *
   * O cálculo anterior usava apenas dvh e uma reserva estimada. Safe-area,
   * escala do WebView e altura efetiva da câmera podem divergir no iPhone. A
   * medição ocorre somente no telefone e publica um token CSS; não redesenha o
   * tablet nem muda a geometria da câmera.
   */
  private _sincronizarLimiteFolhaTelefone(): void {
    if (!this._estaNoTelefone()) {
      this.style.removeProperty('--fone-folha-top');
      return;
    }
    const cortina = this.renderRoot.querySelector<HTMLElement>('.curtain-dock');
    const camera = this.renderRoot.querySelector<HTMLElement>('.cameras-card');
    const topo = cortina?.getBoundingClientRect().top ?? ((camera?.getBoundingClientRect().bottom ?? 0) + 8);
    if (!Number.isFinite(topo) || topo <= 0) return;
    const valor = `${Math.round(topo)}px`;
    if (this.style.getPropertyValue('--fone-folha-top') !== valor) {
      this.style.setProperty('--fone-folha-top', valor);
    }
  }

  /**
   * Faz as quatro linhas visuais de Sala e Q. Miguel caberem exatamente na
   * área útil da folha, sem depender da altura nominal do aparelho.
   *
   * O WebView do iPhone perde pixels para barras e safe-area. Por isso um
   * valor que cabia no banco 428 x 926 ainda rolava no aparelho. Aqui se mede
   * o espaço não ocupado por cabeçalhos, separadores e gaps e se divide apenas
   * o restante pelas linhas reais de cada grid. O resultado fica limitado à
   * faixa ergonômica de 56 a 60 px; telas menores continuam com scroll como
   * proteção, em vez de comprimir o alvo indefinidamente.
   */
  private _sincronizarAlturaLuzesTelefone(): void {
    const token = '--fone-luz-cell-h';
    if (!this._estaNoTelefone() || this._folha !== 'luzes') {
      this.style.removeProperty(token);
      return;
    }

    const scroll = this.renderRoot.querySelector<HTMLElement>('.lights-scroll');
    const grids = [...this.renderRoot.querySelectorAll<HTMLElement>('.light-grid')];
    if (!scroll || !grids.length || scroll.clientHeight <= 0) return;

    let linhas = 0;
    let alturaDasGrades = 0;
    let totalDeGaps = 0;
    for (const grid of grids) {
      const celulas = grid.querySelectorAll('.light-cell').length;
      const linhasDaGrade = Math.ceil(celulas / 2);
      if (!linhasDaGrade) continue;
      const gap = Number.parseFloat(getComputedStyle(grid).rowGap) || 0;
      linhas += linhasDaGrade;
      alturaDasGrades += grid.getBoundingClientRect().height;
      totalDeGaps += Math.max(0, linhasDaGrade - 1) * gap;
    }
    if (!linhas) return;

    const alturaFixa = Math.max(0, scroll.scrollHeight - alturaDasGrades);
    const alturaCalculada = (scroll.clientHeight - alturaFixa - totalDeGaps - 2) / linhas;
    const altura = Math.floor(Math.max(56, Math.min(60, alturaCalculada)) * 10) / 10;
    if (!Number.isFinite(altura)) return;

    const valor = `${altura}px`;
    if (this.style.getPropertyValue(token) !== valor) this.style.setProperty(token, valor);
  }

  // ── Cenário B: linhas-resumo e folha (SÓ no telefone) ─────────────────────
  //
  // O DOM é o mesmo nos dois modos. O que muda é o CSS: acima de 800px as
  // linhas e o escurecimento ficam `display: none` e os módulos completos
  // seguem no fluxo, exatamente como hoje. Abaixo de 800px é o inverso.
  //
  // Isso evita o contrato de modo em JS: nada aqui pergunta "é telefone?".
  // O único estado é qual folha está aberta, e no tablet ele nunca sai de null
  // porque as linhas que o mudam não são clicáveis lá.

  /** Abre a folha do módulo, ou fecha se já for a que está aberta. */
  private _abrirFolha(chave: FolhaChave): void {
    if (!this._estaNoTelefone()) return;
    if (this._folha === chave && !this._folhaSaindo) {
      this._fecharFolha();
      return;
    }
    const ancora = this._capturarBaseFolha();

    // Um segundo toque durante a saida cancela o fechamento, sem desmontar e
    // reconstruir o modulo. Isso tambem evita deixar a shell fechada enquanto
    // uma folha voltou a ficar visivel.
    encerrarTimer(SONDA, this._timerFecharFolha);
    this._timerFecharFolha = undefined;
    this._folhaSaindo = false;
    this._folha = chave;
    // A folha de luzes mostra a GRADE, não o dock recolhido. Abrir a folha
    // implica abrir o corpo; o `is-settled` entra junto para o corpo já nascer
    // rolável (a espera de 240ms de `_alternarDock` existe por causa da
    // animação, e aqui não há animação de altura a acompanhar).
    if (this._folha === 'luzes') {
      this._lightsOpen = true;
      this._luzesAssentadas = true;
    }
    this._aplicarAtributos();
    this._avisarFolha();
    this.requestUpdate();
    this._restaurarBaseFolha(ancora);
  }

  private _fecharFolha(): void {
    if (!this._folha || this._folhaSaindo) return;
    const ancora = this._capturarBaseFolha();
    this._encerrarArrasto();
    this._folhaSaindo = true;
    this._aplicarAtributos();
    this.requestUpdate();
    this._restaurarBaseFolha(ancora);

    // ANTERIOR (rollback refinamento mobile): `_folha = null` acontecia aqui.
    // O modulo perdia `display` antes de o navegador poder compor uma saida.
    const reduzMovimento =
      typeof globalThis.matchMedia === 'function' &&
      globalThis.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduzMovimento) {
      this._limparFolhaImediatamente();
      return;
    }
    // ANTERIOR (rollback pos-device): 180ms. A folha agora percorre sua altura
    // inteira ate a base; o estado permanece montado pelos mesmos 280ms do CSS.
    this._timerFecharFolha = espera(SONDA, () => {
      this._timerFecharFolha = undefined;
      this._limparFolhaImediatamente();
    }, 280);
  }

  private _limparFolhaImediatamente(avisar = true): void {
    const ancora = this._capturarBaseFolha();
    const estavaAberta = Boolean(this._folha);
    encerrarTimer(SONDA, this._timerFecharFolha);
    this._timerFecharFolha = undefined;
    this._folhaSaindo = false;
    this._folha = null;
    this._encerrarArrasto();
    this._aplicarAtributos();
    if (estavaAberta && avisar) this._avisarFolha();
    this.requestUpdate();
    this._restaurarBaseFolha(ancora);
  }

  /**
   * O botão discreto de fechar, no cabeçalho de cada folha.
   *
   * Ele vive dentro dos módulos, que são os MESMOS do tablet — no tablet o CSS
   * o esconde (ver o bloco `min-width: 801px` em `subview-phone.styles.ts`).
   * É o terceiro caminho de fechamento do item 12 do roteiro; os outros dois
   * (arrastar para baixo e tocar fora) não têm marcação visível.
   */
  private _botaoFecharFolha() {
    return html`
      <button
        type="button"
        class="folha-x"
        aria-label="Fechar"
        @click=${() => this._fecharFolha()}
      >
        <!-- ANTERIOR (rollback pos-device): bruno-icon mdi:close. No WebView
             real o glifo nao foi resolvido e restou apenas um circulo vazio. -->
        <span class="folha-x-glyph" aria-hidden="true">&times;</span>
      </button>
    `;
  }

  /**
   * Chevron discreto ao lado do titulo das folhas de telefone.
   *
   * O X anterior continua montado e escondido pelo CSS como caminho de rollback.
   * Acima de 800px este botao tambem fica oculto, preservando o cabecalho tablet.
   */
  private _botaoRecolherFolha() {
    return html`
      <button
        type="button"
        class="folha-recolher"
        aria-label="Recolher painel"
        @click=${() => this._fecharFolha()}
      >
        <bruno-icon icon="mdi:chevron-down"></bruno-icon>
      </button>
    `;
  }

  /** O elemento que ESTÁ servindo de folha agora, ou null. */
  private _folhaEl(): HTMLElement | null {
    const seletores: Record<FolhaChave, string> = {
      luzes: '.glass-card.lights-card',
      ac: '.glass-card.ac-card',
      midia: '.glass-card.media-hub-card',
      eletro: '.glass-card.appliances-card',
    };
    const chave = this._folha;
    if (!chave) return null;
    return (this.renderRoot as ParentNode).querySelector<HTMLElement>(seletores[chave]);
  }

  // ── Arrastar para baixo para fechar (item 12) ─────────────────────────────
  //
  // Só começa quando a folha está no TOPO da própria rolagem (`scrollTop === 0`)
  // e o dedo desce: assim o gesto nunca disputa com a rolagem interna, que é o
  // que faz uma folha nativa parecer nativa. Enquanto o gesto não passa do
  // limiar, o dedo arrasta a folha; ao soltar, ela volta ou fecha.
  //
  // Se o navegador decidir que o gesto é rolagem (`pointercancel`), a folha
  // volta ao lugar e nada quebra — o toque fora e o X continuam fechando.

  private _arrastoY: number | null = null;
  private _arrastoAlvo: HTMLElement | null = null;

  private _iniciarArrasto = (evento: PointerEvent): void => {
    if (!this._folha || evento.button !== 0) return;
    const folha = this._folhaEl();
    if (!folha || !evento.composedPath().includes(folha)) return;
    if (folha.scrollTop > 0) return;
    this._arrastoY = evento.clientY;
    this._arrastoAlvo = folha;
    globalThis.addEventListener('pointermove', this._moverArrasto, { passive: true });
    globalThis.addEventListener('pointerup', this._soltarArrasto);
    globalThis.addEventListener('pointercancel', this._cancelarArrasto);
  };

  private _moverArrasto = (evento: PointerEvent): void => {
    if (this._arrastoY == null || !this._arrastoAlvo) return;
    const dy = evento.clientY - this._arrastoY;
    if (dy <= 0) {
      this._arrastoAlvo.style.transform = '';
      return;
    }
    // Resistência: o arrasto acompanha o dedo mas com freio, para o gesto ter
    // peso e não parecer que a folha escorregou sozinha.
    this._arrastoAlvo.style.transform = `translateY(${(dy * 0.72).toFixed(1)}px)`;
  };

  private _soltarArrasto = (evento: PointerEvent): void => {
    const inicio = this._arrastoY;
    const alvo = this._arrastoAlvo;
    this._encerrarArrasto();
    if (inicio == null || !alvo) return;
    if (evento.clientY - inicio > 90) this._fecharFolha();
  };

  private _cancelarArrasto = (): void => {
    this._encerrarArrasto();
  };

  private _encerrarArrasto(): void {
    if (this._arrastoAlvo) this._arrastoAlvo.style.transform = '';
    this._arrastoY = null;
    this._arrastoAlvo = null;
    globalThis.removeEventListener('pointermove', this._moverArrasto);
    globalThis.removeEventListener('pointerup', this._soltarArrasto);
    globalThis.removeEventListener('pointercancel', this._cancelarArrasto);
  }

  /**
   * Avisa a shell que há folha aberta.
   *
   * No telefone a shell dá `z-index: 2` ao dock e `1` ao conteúdo. Uma bottom
   * sheet que sobe da borda inferior precisa cobrir o dock — e nenhum z-index
   * daqui de dentro alcança isso, porque a pilha é decidida um nível acima.
   * Então a shell ergue o slot de conteúdo enquanto a folha existe, e o baixa
   * quando ela fecha. É o mínimo de contrato para a folha ser folha.
   */
  private _avisarFolha(): void {
    this.dispatchEvent(
      new CustomEvent('bruno-folha', {
        detail: { aberta: Boolean(this._folha) },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * As linhas-resumo do telefone.
   *
   * A lista sai do que o cômodo TEM: a Cozinha não tem A/C nem hub de mídia e
   * tem eletrodomésticos; o Office troca o hub pela Estação de Trabalho, que
   * mora no mesmo `.media-hub-card`. Nenhuma linha aparece sem o módulo
   * correspondente existir, senão a folha subiria vazia.
   */
  private _linhasResumo(): Array<{
    chave: FolhaChave;
    icone: string;
    tom: string;
    titulo: string;
    resumo: string;
  }> {
    const linhas: Array<{ chave: FolhaChave; icone: string; tom: string; titulo: string; resumo: string }> = [
      {
        chave: 'luzes',
        icone: 'mdi:lightbulb-group',
        tom: 'tone-amber',
        titulo: 'Iluminação',
        resumo: this._linhaLuzes(),
      },
    ];

    if (this._temEletrodomesticos) {
      linhas.push({
        chave: 'eletro',
        icone: 'mdi:home-lightning-bolt-outline',
        tom: 'tone-amber',
        titulo: 'Eletrodomésticos',
        resumo: this._resumoEletrodomesticos(),
      });
    } else {
      linhas.push({
        chave: 'midia',
        // ANTERIOR (rollback): no Office o launcher usava
        // mdi:desktop-tower-monitor, diferente do mdi:desk do cabeçalho.
        icone: this._temPc ? 'mdi:desk' : 'mdi:music',
        tom: 'tone-blue',
        // ANTERIOR (rollback refinamento mobile): o launcher dizia apenas
        // "Mídia", embora a folha e o roteiro usem o nome completo do módulo.
        titulo: this._temPc ? 'Estação de trabalho' : 'Hub de Mídia',
        resumo: this._resumoMidia(),
      });
    }

    if (this._estadoClimate()) {
      linhas.push({
        chave: 'ac',
        icone: 'mdi:snowflake',
        tom: 'tone-blue',
        titulo: 'Ar-condicionado',
        resumo: this._resumoClimate(),
      });
    }

    return linhas;
  }

  /** "Frio · 23°" — mesmo vocabulário do card completo, via `_rotuloModo`. */
  private _resumoClimate(): string {
    const m = this._modeloClimate();
    if (m.indisponivel) return 'Indisponível';
    if (!m.ativo) return 'Desligado';
    const modo = this._rotuloModo(String(m.modo));
    return m.alvo == null ? modo : `${modo} · ${numero(m.alvo)}°`;
  }

  /**
   * O mesmo resumo que a fonte ativa mostra dentro do hub.
   *
   * A ordem de prioridade é a do próprio hub (PC ou TV primeiro, Spotify
   * depois) — se divergisse, a linha diria uma coisa e a folha outra.
   */
  private _resumoMidia(): string {
    if (this._temPc) return this._modeloPc().ativo ? 'Ligado' : 'Desligado';
    const tv = this._modeloTv();
    if (tv.ativo) return `Ligada · ${tv.fonte}`;
    const sp = this._modeloSpotify();
    if (sp.ativo) return sp.titulo;
    return 'Nada tocando';
  }

  /**
   * "1 de 5 ligados" — conta só o que tem tomada.
   *
   * Os `placeholder: true` da configuração da Cozinha (air fryer, geladeira)
   * não têm entidade e nunca contariam como ligados; incluí-los no total faria
   * a linha parecer sempre incompleta.
   */
  private _resumoEletrodomesticos(): string {
    const lista = (this._sub?.entities as Record<string, unknown> | undefined)?.['appliances'];
    if (!Array.isArray(lista) || !lista.length) return 'Sem aparelhos';
    const reais = (lista as Array<Record<string, unknown>>).filter((a) => !a['placeholder'] && a['entity']);
    if (!reais.length) return `${lista.length} sem tomada`;
    const ligados = reais.filter((a) => {
      const st = this._hass?.states[String(a['stateEntity'] ?? a['entity'])]?.state;
      const ativos = Array.isArray(a['activeStates']) ? (a['activeStates'] as string[]) : ['on'];
      return st != null && ativos.includes(String(st));
    }).length;
    return `${ligados} de ${reais.length} ligados`;
  }

  /**
   * As linhas + o escurecimento.
   *
   * O escurecimento fica ABAIXO da câmera na pilha de camadas (o CSS dá
   * `z-index` maior ao módulo de câmeras), então ela continua acesa e clicável
   * com a folha aberta — que é a razão de o usuário ter escolhido este cenário.
   * Tocar no escurecimento fecha.
   */
  /*
   * ANTERIOR (rollback rev. faixa-de-tiles): depois do scrim era renderizado
   * um button com classe folha-fechar e texto "Concluir". Ele foi retirado do
   * DOM porque fechamento nao e etapa de formulario. Permanecem os tres gestos
   * previstos: X no cabecalho, toque fora e arrasto para baixo.
   */
  private _renderResumoTelefone() {
    const linhas = this._linhasResumo();
    return html`
      <div
        class="folha-scrim"
        aria-hidden="true"
        @click=${() => this._fecharFolha()}
      ></div>
      <div class="resumo-telefone">
        ${linhas.map(
          (l) => html`
            <button
              type="button"
              class="resumo-linha ${this._folha === l.chave ? 'is-active' : ''}"
              aria-expanded=${this._folha === l.chave ? 'true' : 'false'}
              @click=${() => this._abrirFolha(l.chave)}
            >
              <span class="micro-icon ${l.tom}"><bruno-icon icon=${l.icone}></bruno-icon></span>
              <span class="resumo-texto">
                <span class="resumo-titulo">${l.titulo}</span>
                <span class="resumo-estado">${l.resumo}</span>
              </span>
              <!-- ANTERIOR (rollback rev. faixa-de-tiles): mdi:chevron-up,
                   girado 180deg pelo CSS. O roteiro pede chevron discreto
                   apontando para a direita: a linha abre um SEGUNDO NIVEL
                   (bottom sheet), nao expande no lugar. -->
              <span class="resumo-chevron" aria-hidden="true">
                <bruno-icon icon="mdi:chevron-right"></bruno-icon>
              </span>
            </button>
          `,
        )}
      </div>
    `;
  }

  private _renderLightsDock() {
    const aberto = this._lightsOpen;
    const classes = [
      'glass-card',
      'lights-card',
      aberto ? 'is-open' : '',
      // Só depois que a animação termina o corpo pode rolar. Ver a nota em
      // `static styles`: rolar durante a abertura é o que fazia a barra piscar
      // e as células encolherem.
      this._luzesAssentadas ? 'is-settled' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return html`
      <div class=${classes}>
        <div class="lights-dock">
          <button
            type="button"
            class="lights-dock-id"
            aria-expanded=${aberto ? 'true' : 'false'}
            @click=${() => this._acionarCabecalhoLuzes()}
          >
            <span class="micro-icon tone-amber"><bruno-icon icon="mdi:lightbulb-group"></bruno-icon></span>
            <span class="module-title">Iluminação</span>
            <span class="lights-dock-chevron" aria-hidden="true">
              <bruno-icon
                icon=${this._estaNoTelefone() && this._folha === 'luzes'
                  ? 'mdi:chevron-down'
                  : 'mdi:chevron-up'}
              ></bruno-icon>
            </span>
          </button>
          <div class="lights-dock-actions">
            <button type="button" class="chip-button is-active" @click=${() => this._todasAsLuzes('turn_on')}>
              Todas acesas
            </button>
            <button type="button" class="chip-button" @click=${() => this._todasAsLuzes('turn_off')}>
              Apagar todas
            </button>
            ${this._botaoFecharFolha()}
          </div>
        </div>
        <div class="lights-body">
          <div class="lights-body-clip">
            <div class="lights-scroll">${this._renderSecoesDeLuz()}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Seções de zona dentro do dock, com a grade de células de luz.
   *
   * As luzes vêm da configuração gerada (`entities.lights`), cada uma com
   * `zone`, `name` e `icon_type`. A ordem das zonas é a de aparição na lista, e
   * não uma lista fixa: é assim que a Sala tem "Sala" e "Varanda" e os demais
   * têm só uma.
   *
   * Célula larga na primeira posição quando a contagem é ÍMPAR — a luz principal
   * ocupa a linha inteira. Os filetes são por célula, não por gap: com gap o
   * fundo vazaria por baixo.
   */
  private _renderSecoesDeLuz() {
    const luzes = this._luzesDaConfiguracao();
    if (!luzes.length) return nothing;

    const rotulos = (this._sub?.['lightZoneLabels'] ?? {}) as Record<string, string>;
    const icones = (this._sub?.['lightZoneIcons'] ?? {}) as Record<string, string>;
    const padraoRotulo: Record<string, string> = { sala: 'Sala', varanda: 'Varanda' };
    const padraoIcone: Record<string, string> = { sala: 'mdi:sofa-outline', varanda: 'bruno:balcony' };

    const ordem: string[] = [];
    for (const l of luzes) if (!ordem.includes(l.zone)) ordem.push(l.zone);

    const zonas = ordem
      .map((chave) => {
        const daZona = luzes.filter((l) => l.zone === chave);
        return {
          chave,
          // Sem rotulo mapeado, a chave vira o nome com inicial maiuscula: no
          // Office e na Cozinha a zona unica saia como "office" e "cozinha".
          nome: rotulos[chave] ?? padraoRotulo[chave] ?? chave.charAt(0).toUpperCase() + chave.slice(1),
          icone: icones[chave] ?? padraoIcone[chave] ?? 'mdi:lightbulb-group',
          luzes: daZona,
          acesas: daZona.filter((l) => this._hass?.states[l.entity]?.state === 'on').length,
        };
      })
      .filter((z) => z.luzes.length > 0);

    const mostrarAcaoDaZona = zonas.length > 1;

    return zonas.map((z) => {
      const impar = z.luzes.length % 2 === 1;
      return html`
        <section class="light-section">
          <div class="section-head">
            <span class="zone-icon"><bruno-icon icon=${z.icone}></bruno-icon></span>
            <span class="zone-id">
              <strong>${z.nome}</strong>
              <small>${z.acesas}/${z.luzes.length} acesas</small>
            </span>
            ${mostrarAcaoDaZona
              ? html`<button
                  type="button"
                  class="zone-off"
                  @click=${() => this._apagarZona(z.luzes)}
                >
                  Apagar ${z.nome.toLowerCase()}
                </button>`
              : nothing}
          </div>
          <div class="light-grid">
            ${z.luzes.map((luz, i) => this._renderCelulaDeLuz(luz, i, impar))}
          </div>
        </section>
      `;
    });
  }

  private _luzesDaConfiguracao(): Array<{ entity: string; name: string; zone: string; icon: string | undefined }> {
    const bruto = (this._sub?.entities as Record<string, unknown> | undefined)?.['lights'];
    if (!Array.isArray(bruto)) return [];
    return bruto
      .filter((l): l is Record<string, unknown> => Boolean(l) && typeof l === 'object')
      .filter((l) => typeof l['entity'] === 'string' && !l['placeholder'])
      .map((l) => ({
        entity: String(l['entity']),
        name: String(l['name'] ?? 'Luz'),
        zone: String(l['zone'] ?? 'sala'),
        icon: typeof l['iconType'] === 'string' ? l['iconType'] : undefined,
      }));
  }

  private _renderCelulaDeLuz(
    luz: { entity: string; name: string; icon: string | undefined },
    indice: number,
    impar: boolean,
  ) {
    const acesa = this._hass?.states[luz.entity]?.state === 'on';
    // A luz principal ocupa a linha inteira quando a contagem é ímpar; a partir
    // daí a sequência volta a duas colunas, e é por isso que linha e coluna
    // saem de um cálculo e não de :nth-child.
    const larga = impar && indice === 0;
    const seq = impar ? indice - 1 : indice;
    const linha = larga ? 0 : Math.floor(seq / 2) + (impar ? 1 : 0);
    const classes = [
      'light-cell',
      acesa ? 'is-on' : '',
      larga ? 'is-wide' : '',
      !larga && linha > 0 ? 'has-rule-top' : '',
      !larga && seq % 2 === 1 ? 'has-rule-left' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <button
        type="button"
        class=${classes}
        role="switch"
        aria-checked=${acesa ? 'true' : 'false'}
        aria-label=${luz.name}
        @click=${() => this._alternarLuz(luz.entity)}
      >
        <span class="lc-icon">${this._iconeDaLuz(luz.icon, acesa)}</span>
        <span class="lc-name">${luz.name}</span>
        <span class="lc-switch" aria-hidden="true"><span class="lc-knob"></span></span>
      </button>
    `;
  }

  /**
   * Ícone da luz — SVG do conjunto próprio, não um `mdi:`.
   *
   * As subviews atuais chamam `BrunoIcons.render()` com nomes do conjunto do
   * projeto: `ledstrip`, `pendant`, `light_flush`. Eu havia mapeado esses nomes
   * para equivalentes `mdi:`, e o resultado era um ícone minúsculo ou um círculo
   * — o `mdi:` correspondente não existe, e o `bruno-icon` cai no genérico.
   *
   * A marcação de fora (`tpl-light-icon`, `icon-<nome>`, `is-on`) é o que o CSS
   * usa para dimensionar e colorir; sem ela o glifo fica sem tamanho.
   */
  private _iconeDaLuz(tipo: string | undefined, acesa: boolean) {
    const bruto = String(tipo ?? 'light_flush').replace(/^mdi:/, '');
    const nome = bruto.replace(/[^a-z0-9_-]/gi, '') || 'light_flush';
    // O conjunto de ícones do projeto é o Hugeicons, e `bruno-icons.js` já traz
    // os apelidos que interessam aqui:
    //   ledstrip → bruno:led-strip · pendant → hugeicons:candelier-02
    //   sconce   → hugeicons:lamp-wall-up · light_flush → hugeicons:bulb
    // Basta passar o nome cru; traduzir para `mdi:` foi o erro que produziu o
    // círculo genérico.
    return html`<span class="tpl-light-icon icon-${nome} ${acesa ? 'is-on' : ''}">
      <bruno-icon icon=${nome}></bruno-icon>
    </span>`;
  }

  private _alternarLuz(entityId: string): void {
    if (!this._hass) return;
    this._hass.callService('light', 'toggle', { entity_id: entityId }, { entity_id: entityId });
  }

  private _apagarZona(luzes: Array<{ entity: string }>): void {
    if (!this._hass || !luzes.length) return;
    const ids = luzes.map((l) => l.entity);
    this._hass.callService('light', 'turn_off', { entity_id: ids }, { entity_id: ids });
  }

  private _todasAsLuzes(servico: 'turn_on' | 'turn_off'): void {
    const grupo = this._room?.entities.lightGroup;
    if (!grupo || !this._hass) return;
    this._hass.callService('light', servico, { entity_id: grupo }, { entity_id: grupo });
  }

  override render() {
    const room = this._room;
    if (!room) return nothing;

    // A estrutura dos módulos é a mesma dos seis arquivos atuais, com os nomes
    // de classe e as áreas de grid lidos do DOM RENDERIZADO — não deduzidos do
    // código, que guarda sete definições empilhadas e blocos mortos.
    return html`
      <main class="room-subview" @pointerdown=${this._iniciarArrasto}>
        ${this._renderTopBand()}
        ${this._temEletrodomesticos ? this._corpoCozinha() : this._corpoPadrao()}
      </main>
    `;
  }

  /**
   * Cinco cômodos: coluna esquerda (hero + linha de câmeras/hub) e coluna
   * direita (dock de luzes + A/C), dentro de `content-left` e `right-column`.
   */
  private _corpoPadrao() {
    return html`
      <div class="content-left">
        ${this._renderHero()}
        <div class="cams-media-row">${this._renderCameras()} ${this._renderMediaHub()}</div>
      </div>
      <div class="right-column">${this._renderLightsDock()} ${this._renderAC()}</div>
      ${this._renderResumoTelefone()}
    `;
  }

  /**
   * Hero — a foto do cômodo com o dock de cortina sobreposto na base.
   *
   * A hierarquia de três níveis (`hero-stage` > `hero-content` > `curtain-dock`)
   * não é decorativa: é ela que faz a cortina flutuar sobre a foto sem entrar no
   * fluxo. Lida do DOM renderizado.
   */
  private _renderHero() {
    const cortinaId = this._entidadeCortina();
    const cortinaEstado = this._estado(cortinaId);
    const cortinaIndisponivel = this._indisponivel(cortinaEstado);
    const cortinaMovendo = ['opening', 'closing'].includes(String(cortinaEstado?.state));
    return html`
      <div class="hero-panel">
        <div class="hero-stage hero-atmosphere">
          <div class="hero-content">
            <!-- O dock de cortina aparece nos CINCO cômodos com corpo padrão,
                 mesmo onde não há entidade: nos quatro sem cortina ele renderiza
                 inerte, mostrando "Indisponível". Só a Cozinha não o tem, e ela
                 usa outro corpo. Condicioná-lo à entidade tirava o dock de
                 Office, Casal, Marina e Miguel, que o exibem hoje. -->
            <div
              class="curtain-dock curtain-overlay"
              style=${`--curtain-position:${this._fechamentoCortina()}%`}
            >
              <div class="curtain-control-row">
                <div class="curtain-identity">
                  <span class="curtain-icon-shell">
                    <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                  </span>
                  <span class="curtain-title">Cortina</span>
                </div>
                <div class="curtain-status" aria-live="polite">
                  <span class="curtain-status-text">${this._estadoCortina()}</span>
                  <span class="curtain-status-percent">${this._percentualCortina()}</span>
                </div>
                <div class="curtain-main-actions">
                  ${[
                    ['cover-open', 'open_cover', 'Abrir'],
                    ['cover-stop', 'stop_cover', 'Parar'],
                    ['cover-close', 'close_cover', 'Fechar'],
                  ].map(
                    ([acao, servico, rotulo]) => html`
                      <button
                        type="button"
                        class="curtain-action-button ${acao === 'cover-stop' ? 'is-muted' : ''} ${acao === 'cover-stop' && cortinaMovendo ? 'is-active' : ''}"
                        data-action=${acao}
                        ?disabled=${cortinaIndisponivel}
                        @click=${() => this._acionarCortina(servico as 'open_cover' | 'stop_cover' | 'close_cover')}
                      >
                        <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                        <span>${rotulo}</span>
                      </button>
                    `,
                  )}
                </div>
              </div>
              <div class="curtain-slider-zone">
                <div class="curtain-slider-glow"></div>
                <!-- ANTERIOR (rollback funcional da cortina): o range nao tinha
                     evento algum; arrastar o polegar mudava apenas o DOM local. -->
                <input
                  class="curtain-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  .value=${String(this._fechamentoCortina())}
                  aria-label="Percentual de fechamento da cortina"
                  ?disabled=${cortinaIndisponivel}
                  @input=${(evento: Event) => this._previsualizarFechamentoCortina(evento)}
                  @change=${(evento: Event) =>
                    this._posicionarCortinaPorFechamento(Number((evento.currentTarget as HTMLInputElement).value))}
                />
                <!-- As marcas sao BOTOES, nao rotulos: cada uma leva a cortina
                     para aquela posicao. Como span elas mediam 17px em vez de
                     22px, e eram os 5px que faltavam na altura do dock. -->
                <div class="curtain-marks">
                  ${[0, 25, 50, 75, 100].map(
                    (fechada) => html`
                      <button
                        type="button"
                        class="curtain-mark"
                        data-action="cover-position"
                        data-position=${this._posicaoBrutaPorFechamento(fechada)}
                        data-closed=${fechada}
                        aria-label="${fechada}% fechada"
                        ?disabled=${cortinaIndisponivel}
                        @click=${() => this._posicionarCortinaPorFechamento(fechada)}
                      >
                        ${fechada}%
                      </button>
                    `,
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _entidadeCortina(): string | undefined {
    const v = (this._sub?.entities as Record<string, unknown> | undefined)?.['curtain'];
    return typeof v === 'string' ? v : undefined;
  }

  private _posicaoCortina(): number | undefined {
    const id = this._entidadeCortina();
    const s = id && this._hass ? this._hass.states[id] : undefined;
    const p = s?.attributes['current_position'];
    // ANTERIOR (rollback): ausência de telemetria virava abertura 100. Isso
    // impedia distinguir cover sem current_position de cortina realmente
    // aberta e fazia a leitura física vencer indevidamente o helper.
    return typeof p === 'number' ? p : undefined;
  }

  private _percentualCortinaValido(valor: unknown): number | undefined {
    const numero = Number(valor);
    if (!Number.isFinite(numero)) return undefined;
    return Math.max(0, Math.min(100, Math.round(numero)));
  }

  private _interpolarCortina(
    valor: number,
    origem: 'visual' | 'position',
    destino: 'visual' | 'position',
  ): number {
    const percentual = this._percentualCortinaValido(valor) ?? 0;
    const pontos = CORTINA_CALIBRACAO;
    const primeiro = pontos[0]!;
    if (percentual <= primeiro[origem]) return primeiro[destino];
    for (let indice = 1; indice < pontos.length; indice += 1) {
      const anterior = pontos[indice - 1]!;
      const atual = pontos[indice]!;
      if (percentual <= atual[origem]) {
        const faixa = atual[origem] - anterior[origem];
        if (faixa === 0) return atual[destino];
        const razao = (percentual - anterior[origem]) / faixa;
        return this._percentualCortinaValido(
          anterior[destino] + (atual[destino] - anterior[destino]) * razao,
        ) ?? atual[destino];
      }
    }
    return pontos[pontos.length - 1]![destino];
  }

  /** Posição física do cover, já convertida para percentual visual FECHADO. */
  private _fechamentoCortinaFisico(): number | undefined {
    const aberturaBruta = this._percentualCortinaValido(this._posicaoCortina());
    if (aberturaBruta == null) return undefined;
    const aberturaVisual = this._interpolarCortina(aberturaBruta, 'position', 'visual');
    return 100 - aberturaVisual;
  }

  /** Valor do helper de comando, usado somente quando o cover não mede posição. */
  private _fechamentoCortinaComandado(): number | undefined {
    const controle = this._sub?.entities?.['curtainPercentControl'];
    const estadoControle = typeof controle === 'string' ? this._estado(controle) : undefined;
    return this._indisponivel(estadoControle)
      ? undefined
      : this._percentualCortinaValido(estadoControle?.state);
  }

  /**
   * Leitura publicada pelo HA, sem a estimativa local de percurso.
   *
   * ANTERIOR (rollback 2026-08-15): o helper de percentual tinha prioridade.
   * Ele representa o ALVO do comando e salta imediatamente a 0/100, embora o
   * motor continue em movimento. A posição física do cover volta a ser a fonte
   * primária; o helper permanece como fallback para covers sem telemetria.
   */
  private _fechamentoCortinaRelatado(): number {
    const fisico = this._fechamentoCortinaFisico();
    if (fisico != null) return fisico;
    const comandado = this._fechamentoCortinaComandado();
    if (comandado != null) return comandado;
    const estado = String(this._estado(this._entidadeCortina())?.state ?? '').toLowerCase();
    return estado === 'closed' ? 100 : 0;
  }

  private _fechamentoMovimentoCortina(movimento = this._movimentoCortina, agora = Date.now()): number | undefined {
    if (!movimento) return undefined;
    if (movimento.retido) return this._percentualCortinaValido(movimento.fechado);
    const progresso = Math.min(1, Math.max(0, (agora - movimento.iniciadoEm) / Math.max(1, movimento.duracao)));
    return this._percentualCortinaValido(
      movimento.inicioFechado + (movimento.alvoFechado - movimento.inicioFechado) * progresso,
    );
  }

  /** Percentual visual fechado: 0 = aberta; 100 = fechada. */
  private _fechamentoCortina(): number {
    const relatado = this._fechamentoCortinaRelatado();
    const movimento = this._movimentoCortina;
    const id = this._entidadeCortina();
    if (!movimento || movimento.entityId !== id) return relatado;
    const agora = Date.now();
    const estado = String(this._estado(id)?.state ?? '').toLowerCase();
    const estaMovendo = estado === 'opening' || estado === 'closing';
    const fisico = this._fechamentoCortinaFisico();

    if (movimento.retido) {
      // O clique em Parar chega antes da atualização do cover. Segura o ponto
      // calculado por uma janela curta e só então reconcilia com a posição
      // física, evitando voltar ao extremo antigo no mesmo frame do toque.
      if (!estaMovendo && fisico != null && agora - movimento.retidoEm >= CORTINA_GRAÇA_PARADA_MS) {
        this._movimentoCortina = undefined;
        return fisico;
      }
      return movimento.fechado;
    }

    const decorrido = agora - movimento.iniciadoEm;
    const fisicoNoAlvo = fisico != null
      && Math.abs(fisico - movimento.alvoFechado) <= CORTINA_TOLERANCIA_ALVO;


    const fisicoIntermediario = fisico != null && !fisicoNoAlvo;
    const mudouRelato = fisicoIntermediario && Math.abs(fisico - movimento.ultimoRelatado) >= 1;
    if (mudouRelato) {
      movimento.ultimoRelatado = fisico;
      movimento.inicioFechado = fisico;
      movimento.iniciadoEm = agora;
      movimento.duracao = Math.max(
        CORTINA_MOVIMENTO_MIN_MS,
        CORTINA_CURSO_MS * (Math.abs(movimento.alvoFechado - fisico) / 100),
      );
      return fisico;
    }

    const estimado = this._fechamentoMovimentoCortina(movimento, agora) ?? relatado;
    const terminou = decorrido >= movimento.duracao;
    if (terminou && !estaMovendo) {
      this._movimentoCortina = undefined;
      this._pararTimerMovimentoCortina();
      const estadoConfirmaAlvo =
        (estado === 'closed' && movimento.alvoFechado >= 100 - CORTINA_TOLERANCIA_ALVO)
        || (estado === 'open' && movimento.alvoFechado <= CORTINA_TOLERANCIA_ALVO);
      if (fisicoNoAlvo || estadoConfirmaAlvo) return movimento.alvoFechado;
      return fisico ?? movimento.alvoFechado;
    }

    if (estaMovendo) {
      // Nunca desenha o extremo enquanto o motor ainda declara movimento.
      return movimento.alvoFechado > movimento.inicioFechado
        ? Math.min(estimado, Math.max(movimento.inicioFechado, movimento.alvoFechado - 1))
        : Math.max(estimado, Math.min(movimento.inicioFechado, movimento.alvoFechado + 1));
    }
    return estimado;
  }

  private _iniciarTimerMovimentoCortina(): void {
    if (this._timerMovimentoCortina || !this.isConnected) return;
    this._timerMovimentoCortina = intervalo(SONDA, () => {
      if (!this._movimentoCortina || this._movimentoCortina.retido) {
        this._pararTimerMovimentoCortina();
        return;
      }
      this._motivo = 'cortina em movimento';
      this.requestUpdate();
    }, CORTINA_TICK_MS);
  }

  private _pararTimerMovimentoCortina(): void {
    encerrarTimer(SONDA, this._timerMovimentoCortina);
    this._timerMovimentoCortina = undefined;
  }

  private _iniciarMovimentoCortina(alvoFechado: number): void {
    const entityId = this._entidadeCortina();
    const alvo = this._percentualCortinaValido(alvoFechado);
    if (!entityId || alvo == null) return;
    const inicio = this._fechamentoMovimentoCortina() ?? this._fechamentoCortinaRelatado();
    const distancia = Math.abs(alvo - inicio);
    this._movimentoCortina = {
      entityId,
      inicioFechado: inicio,
      alvoFechado: alvo,
      iniciadoEm: Date.now(),
      duracao: Math.max(CORTINA_MOVIMENTO_MIN_MS, CORTINA_CURSO_MS * (distancia / 100)),
      ultimoRelatado: this._fechamentoCortinaRelatado(),
    };
    this._iniciarTimerMovimentoCortina();
    this.requestUpdate();
  }

  private _reterMovimentoCortina(): void {
    const entityId = this._entidadeCortina();
    if (!entityId) return;
    const fechado = this._fechamentoMovimentoCortina() ?? this._fechamentoCortinaRelatado();
    this._movimentoCortina = { entityId, fechado, retidoEm: Date.now(), retido: true };
    this._pararTimerMovimentoCortina();
    this.requestUpdate();
  }

  private _posicaoBrutaPorFechamento(fechamento: number): number {
    const aberturaVisual = 100 - (this._percentualCortinaValido(fechamento) ?? 0);
    return this._interpolarCortina(aberturaVisual, 'visual', 'position');
  }

  private _estadoCortina(): string {
    const id = this._entidadeCortina();
    if (!id) return 'Indisponível';
    const s = this._hass?.states[id];
    if (!s) return 'Indisponível';
    const fechamento = this._fechamentoCortina();
    const estado = String(s.state ?? '').toLowerCase();
    const movimento = this._movimentoCortina;
    const localMovendo = movimento && !movimento.retido && movimento.entityId === id ? movimento : undefined;
    if (estado === 'opening' || (localMovendo && localMovendo.alvoFechado < localMovendo.inicioFechado)) {
      return `Abrindo ${fechamento}%`;
    }
    if (estado === 'closing' || (localMovendo && localMovendo.alvoFechado > localMovendo.inicioFechado)) {
      return `Fechando ${fechamento}%`;
    }
    if (fechamento <= 1) return 'Aberta';
    if (fechamento >= 99) return 'Fechada';
    return `Fechada ${fechamento}%`;
  }

  private _percentualCortina(): string {
    // ANTERIOR (rollback): o cabeçalho concatenava a abertura bruta em um
    // segundo span ("Aberta - 100%"). A semântica aprovada agora vive inteira
    // em _estadoCortina: Aberta, Fechada ou Fechada N%.
    return '';
  }

  private _previsualizarFechamentoCortina(evento: Event): void {
    const input = evento.currentTarget as HTMLInputElement;
    const fechamento = this._percentualCortinaValido(input.value) ?? 0;
    const dock = input.closest<HTMLElement>('.curtain-dock');
    dock?.style.setProperty('--curtain-position', `${fechamento}%`);
    dock?.querySelector('.curtain-status-text')?.replaceChildren(
      document.createTextNode(
        fechamento <= 1 ? 'Aberta' : fechamento >= 99 ? 'Fechada' : `Fechada ${fechamento}%`,
      ),
    );
  }

  private _posicionarCortinaPorFechamento(fechamento: number): void {
    this._iniciarMovimentoCortina(fechamento);
    this._posicionarCortina(this._posicaoBrutaPorFechamento(fechamento));
  }

  private _posicionarCortina(posicao: number): void {
    const id = this._entidadeCortina();
    if (!id || !this._hass) return;
    this._hass.callService('cover', 'set_cover_position', { entity_id: id, position: posicao }, { entity_id: id });
  }

  private _acionarCortina(servico: 'open_cover' | 'stop_cover' | 'close_cover'): void {
    const id = this._entidadeCortina();
    if (!id || !this._hass || this._indisponivel(this._estado(id))) return;
    if (servico === 'stop_cover') this._reterMovimentoCortina();
    else this._iniciarMovimentoCortina(servico === 'open_cover' ? 0 : 100);
    this._hass.callService('cover', servico, { entity_id: id }, { entity_id: id });
  }

  private _estado(id: string | undefined): EstadoHa | undefined {
    return id && this._hass ? (this._hass.states[id] as EstadoHa | undefined) : undefined;
  }

  private _indisponivel(st: EstadoHa | undefined): boolean {
    return !st || ['unavailable', 'unknown', ''].includes(String(st.state).toLowerCase());
  }

  private _servico(dominio: string, servico: string, dados: Record<string, unknown>): void {
    if (!this._hass) return;
    // O frontend oficial do HA e a subview legada enviam entity_id dentro de
    // serviceData. A migração para target quebrou serviços de integrações que
    // validam o schema dos dados (SpotifyPlus em especial).
    void callHaService(this._hass, dominio, servico, dados);
  }

  /**
   * A lista de câmeras vem da configuração gerada — `entities.cameras` —, com
   * nome, nome curto e os três interruptores de cada uma (som, movimento,
   * privacidade). Eu vinha lendo só `cameraMain`/`cameraSecondary`, que são
   * ids soltos: sem nome, sem controles, e sem a segunda câmera onde a chave
   * não existia.
   */
  private _camerasConfiguradas(): CameraCfg[] {
    const bruto = (this._sub?.entities as Record<string, unknown> | undefined)?.['cameras'];
    if (!Array.isArray(bruto)) return [];
    return bruto.filter((c): c is CameraCfg => Boolean(c) && typeof (c as CameraCfg).entity === 'string');
  }

  /**
   * Estado vivo de uma câmera.
   *
   * A imagem sai de `entity_picture` quando o HA a publica, e cai para
   * `/api/camera_proxy/<entidade>` quando não. O último quadro conhecido fica
   * guardado: numa reconexão a imagem antiga continua na tela em vez de sumir.
   */
  private _cameraViva(cam: CameraCfg): CameraViva {
    const principal = this._estado(cam.entity);
    const fallback = cam.fallbackEntity ? this._estado(cam.fallbackEntity) : undefined;
    const usarFallback = this._indisponivel(principal) && Boolean(cam.fallbackEntity) && !this._indisponivel(fallback);
    const entity = usarFallback ? String(cam.fallbackEntity) : cam.entity;
    const st = usarFallback ? fallback : principal;
    const indisponivel = this._indisponivel(st);
    const online = !indisponivel && ESTADOS_CAMERA_ONLINE.includes(String(st?.state ?? ''));

    const publicada = String(st?.attributes['entity_picture'] ?? '');
    if (publicada) this._ultimaImagem[entity] = publicada;
    const base = publicada || this._ultimaImagem[entity] || `/api/camera_proxy/${entity}`;

    return {
      ...cam,
      entity,
      online,
      indisponivel,
      base,
      // ANTERIOR (rollback 6.2B rev.2):
      //   url: this._urlsCarregadas[cam.entity] ?? comSelo(base, this._seloCameras)
      //
      // O selo aqui tornava a URL inicial ÚNICA a cada montagem — nunca reusava
      // o cache do navegador, e ainda por cima duplicava a requisição, porque o
      // motor disparava outra no mesmo instante. Sem o selo, voltar a um cômodo
      // visitado mostra o último quadro imediatamente, e o motor cuida da
      // atualização a partir daí.
      url: this._urlsCarregadas[entity] ?? base,
    };
  }

  /** Um dos três interruptores da câmera (som, movimento, privacidade). */
  private _controleCamera(cam: CameraViva | undefined, chave: string) {
    const ctrl = (cam?.controls ?? []).find((c) => String(c.key ?? '').toLowerCase() === chave);
    if (!ctrl?.entity) return undefined;
    const st = this._estado(ctrl.entity);
    const indisponivel = this._indisponivel(st);
    return {
      ...ctrl,
      entity: ctrl.entity,
      ativo: !indisponivel && String(st?.state ?? '').toLowerCase() === 'on',
      indisponivel,
    };
  }

  /**
   * Um feed de câmera.
   *
   * A estrutura — moldura, imagem, placeholder e legenda — é a que o CSS gerado
   * espera. O PIP é um botão: tocá-lo promove aquela câmera ao feed principal.
   */
  private _renderFeed(cam: CameraViva | undefined, pip: boolean) {
    const nome = cam?.shortName || cam?.name || 'Câmera';
    const privacidade = this._controleCamera(cam, 'privacy');
    const privado = Boolean(privacidade?.ativo);
    const indisponivel = !cam || cam.indisponivel;

    const classes = [
      'camera-main',
      'camera-feed',
      pip ? 'camera-pip-feed' : 'camera-primary-feed',
      privado ? 'is-private' : '',
      indisponivel ? 'is-unavailable' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const capa = indisponivel
      ? html`<div class="camera-state-surface">
          <bruno-icon icon="mdi:video-off-outline"></bruno-icon><span>Indisponível</span>
        </div>`
      : privado
        ? html`<div class="camera-state-surface">
            <bruno-icon icon="mdi:eye-off-outline"></bruno-icon><span>Modo privacidade ativo</span>
          </div>`
        : nothing;

    // WebRTC só no palco, e só nas câmeras da lista curta (Fase 6.2B parte 2).
    // O instantâneo continua embaixo, sempre: se a negociação falhar, o usuário
    // não percebe diferença nenhuma em relação a hoje.
    const comVideo = Boolean(cam && !pip && usaWebRtc(cam.entity));

    const conteudo = html`
      <div class="camera-row-image">
        ${comVideo
          ? html`<div class="camera-live-slot" data-camera-live=${cam!.entity}></div>`
          : nothing}
        ${cam
          ? html`<img
              src=${cam.url}
              data-camera-src-base=${cam.base}
              data-camera-entity=${cam.entity}
              alt=""
              @load=${(ev: Event) => {
                const img = ev.currentTarget as HTMLImageElement;
                img.classList.add('is-loaded');
                img.closest('.camera-main')?.classList.add('has-loaded-image');
                this._marcarQuadroNaTela(cam.entity);
              }}
              @error=${(ev: Event) => {
                const img = ev.currentTarget as HTMLImageElement;
                img.classList.remove('is-loaded');
                img.closest('.camera-main')?.classList.remove('has-loaded-image');
                this._socorrerCamera(cam.entity);
              }}
            />`
          : nothing}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
      ${capa}
      <div class="camera-row-copy"><strong>${nome}</strong></div>
    `;

    if (pip && cam) {
      return html`<button
        type="button"
        class=${classes}
        aria-label=${`Mostrar câmera ${nome}`}
        @click=${() => {
          this._cameraAtiva = cam.entity;
          this.requestUpdate();
        }}
      >
        ${conteudo}
      </button>`;
    }
    // ANTERIOR (rollback 6.2B rev.2): o palco era um `<div>` inerte.
    //
    //   return html`<div class=${classes} aria-label=...>${conteudo}</div>`;
    //
    // Faltava o gesto mais óbvio de uma câmera. Pedido do usuário em
    // 2026-08-07: *"a impossibilidade de um clique na câmera abrir aquela
    // câmera maior do próprio Home Assistant... é algo que a gente precisa
    // corrigir"*. O `more-info` de câmera do HA é o player grande, com os
    // controles dele — não há por que reconstruí-lo aqui.
    if (!cam) {
      return html`<div class=${classes} aria-label=${`Câmera ${nome}`}>${conteudo}</div>`;
    }
    return html`<button
      type="button"
      class=${classes}
      aria-label=${`Abrir câmera ${nome} em tela cheia`}
      @click=${() => this._maisInfo(cam.entity)}
    >
      ${conteudo}
    </button>`;
  }

  /** Câmeras: cabeçalho com o menu de três pontos + palco com feed e PIP. */
  private _renderCameras() {
    const vivas = this._camerasConfiguradas().map((c) => this._cameraViva(c));
    if (!vivas.length) {
      return html`
        <div class="glass-card cameras-card cameras-card-controls">
          <div class="mh-head cameras-head">
            <div class="mh-head-title">
              <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
              <div class="module-title">Câmeras</div>
            </div>
          </div>
          <div class="camera-stage camera-pip-stage">${this._renderFeed(undefined, false)}</div>
        </div>
      `;
    }

    // A escolhida é a do último toque; se ela estiver fora do ar e houver
    // alguma online, o palco cai para essa — o original faz o mesmo.
    const escolhida = vivas.find((c) => c.entity === this._cameraAtiva) ?? vivas[0];
    const online = vivas.find((c) => c.online);
    const principal = escolhida?.online || !online ? escolhida : online;
    const pip = vivas.find((c) => c.entity !== principal?.entity);
    const aberto = this._controlesCameraAbertos;

    return html`
      <div class="glass-card cameras-card cameras-card-controls">
        <div class="mh-head cameras-head">
          <div class="mh-head-title">
            <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
            <div class="module-title">Câmeras</div>
          </div>
          <button
            type="button"
            class="mh-menu camera-settings-button ${aberto ? 'is-active' : ''}"
            title="Controles"
            aria-expanded=${aberto ? 'true' : 'false'}
            aria-label=${aberto ? 'Fechar controles das câmeras' : 'Abrir controles das câmeras'}
            @click=${() => {
              this._controlesCameraAbertos = !this._controlesCameraAbertos;
              this.requestUpdate();
            }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
        </div>
        <div class="camera-stage camera-pip-stage ${aberto ? 'is-controls-open' : ''}">
          ${this._renderFeed(principal, false)}
          ${pip ? this._renderFeed(pip, true) : nothing}
          ${aberto ? this._renderControlesCamera(principal) : nothing}
        </div>
      </div>
    `;
  }

  private _renderControlesCamera(cam: CameraViva | undefined) {
    const controles = ['sound', 'motion', 'privacy']
      .map((k) => this._controleCamera(cam, k))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (!controles.length) return nothing;

    const nome = cam?.shortName || cam?.name || 'Câmera';
    return html`
      <div class="camera-control-strip" aria-label=${`Controles da câmera ${nome}`}>
        <div class="camera-controls">
          ${controles.map((c) => {
            const descricao = c.description || c.label || 'Controle';
            return html`
              <button
                type="button"
                class="camera-control ${c.ativo ? 'is-on' : ''} ${c.indisponivel ? 'is-unavailable' : ''}"
                ?disabled=${c.indisponivel}
                aria-pressed=${c.ativo ? 'true' : 'false'}
                title=${`${descricao} — câmera ${nome}`}
                @click=${() => this._servico('homeassistant', 'toggle', { entity_id: c.entity })}
              >
                <bruno-icon icon=${c.icon ?? 'mdi:toggle-switch-outline'}></bruno-icon>
                <span class="camera-control-label">${c.label || descricao}</span>
                <span class="camera-control-switch" aria-hidden="true"></span>
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }

  // ── Modelos das fontes de mídia ────────────────────────────────────────────

  /**
   * Uma chave de entidade pode ser um id ou uma LISTA de candidatos.
   *
   * O A/C do Q. Marina, por exemplo, traz onze nomes possíveis — a instalação
   * mudou de nome mais de uma vez e a configuração guarda todos. Vale o primeiro
   * que existir e estiver disponível; sem nenhum, o primeiro da lista, para que
   * o cartão ainda mostre a que ele se refere.
   */
  private _resolverId(valor: unknown): string | undefined {
    if (typeof valor === 'string') return valor || undefined;
    if (!Array.isArray(valor)) return undefined;
    const ids = valor.filter((v): v is string => typeof v === 'string' && Boolean(v));
    const vivo = ids.find((id) => !this._indisponivel(this._hass?.states[id] as EstadoHa | undefined));
    return vivo ?? ids[0];
  }

  private _idDe(chave: string): string | undefined {
    return this._resolverId((this._sub?.entities as Record<string, unknown> | undefined)?.[chave]);
  }

  private _carregarHistoricoTv(): void {
    if (this._tvHistoricoCarregado) return;
    this._tvHistoricoCarregado = true;
    try {
      const raw = globalThis.localStorage?.getItem(TV_HUB_HISTORY_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      const fonte = String(parsed['fonte'] ?? '').trim();
      const titulo = String(parsed['titulo'] ?? '').trim();
      const poster = String(parsed['poster'] ?? '').trim();
      const volume = Number(parsed['volume']);
      if (fonte) this._tvUltimaFonte = fonte;
      if (titulo) this._tvUltimoTitulo = titulo;
      if (poster) this._tvUltimoPoster = poster;
      if (Number.isFinite(volume)) this._tvUltimoVolume = volume;
    } catch { /* localStorage opcional */ }
  }

  private _salvarHistoricoTv(): void {
    if (!this._tvUltimoPoster && !this._tvUltimoTitulo) return;
    try {
      globalThis.localStorage?.setItem(TV_HUB_HISTORY_KEY, JSON.stringify({ fonte: this._tvUltimaFonte, titulo: this._tvUltimoTitulo, poster: this._tvUltimoPoster, volume: this._tvUltimoVolume, savedAt: Date.now() }));
    } catch { /* localStorage opcional */ }
  }

  private _modeloTv() {
    this._carregarHistoricoTv();
    const powerId = this._idDe('tv');
    const mediaId = this._idDe('tvMedia') ?? powerId;
    const power = this._estado(powerId);
    const media = this._estado(mediaId);
    const pa = power?.attributes ?? {};
    const ma = media?.attributes ?? {};
    const ativo = isTvPowered(this._hass, powerId);
    const reproduzindo = isMediaPlaying(this._hass, mediaId);
    const estadoPower = String(power?.state ?? 'off').toLowerCase();
    const estadoMedia = String(media?.state ?? '').toLowerCase();

    const fonteAtual = String(ma['app_name'] ?? ma['source'] ?? pa['source'] ?? pa['app_name'] ?? '').trim();
    const tituloAtual = String(ma['media_title'] ?? ma['media_series_title'] ?? ma['app_name'] ?? '').trim();
    const posterAtual = String(ma['entity_picture'] ?? ma['media_image_url'] ?? ma['entity_picture_local'] ?? '').trim();
    const volumeBruto = pa['volume_level'] ?? ma['volume_level'];
    const volumeNumero = volumeBruto == null ? Number.NaN : Number(volumeBruto);
    const volumeAtual = Number.isFinite(volumeNumero) ? Math.round(volumeNumero * 100) : null;

    if (ativo) {
      if (fonteAtual && this._tvUltimaFonte && fonteAtual !== this._tvUltimaFonte) {
        this._tvUltimoPoster = '';
        this._tvUltimoTitulo = '';
      }
      if (fonteAtual) this._tvUltimaFonte = fonteAtual;
      if (tituloAtual) this._tvUltimoTitulo = tituloAtual;
      if (posterAtual) this._tvUltimoPoster = posterAtual;
      if (volumeAtual != null) this._tvUltimoVolume = volumeAtual;
      this._salvarHistoricoTv();
    }

    return {
      st: power,
      media,
      estado: reproduzindo ? estadoMedia : estadoPower,
      ativo,
      reproduzindo,
      fonte: fonteAtual || (ativo ? this._tvUltimaFonte : 'HDMI 1') || 'HDMI 1',
      titulo: tituloAtual || (ativo ? this._tvUltimoTitulo : ''),
      volume: volumeAtual ?? (ativo ? this._tvUltimoVolume : null),
      poster: posterAtual || (ativo ? this._tvUltimoPoster : ''),
    };
  }

  private _modeloSpotify() {
    const st = this._estado(this._idDe('spotify'));
    const a = st?.attributes ?? {};
    const estado = st?.state ?? 'off';
    // A conta do Spotify é UMA só e todos os cômodos leem a mesma entidade.
    // Sem distinguir o DISPOSITIVO ativo, o card aparecia expandido nas seis
    // subviews ao mesmo tempo. Estas duas provas — dispositivo publicado pelo
    // Spotify, ou o Echo do cômodo tocando a mesma faixa — são as da origem, e
    // eu não as havia portado.
    const daquiEntao =
      ESTADOS_MIDIA_LIGADA.includes(estado) &&
      spotifyTocandoEm(
        st,
        this._sub?.['spotifyDeviceName'] as string | undefined,
        this._estado(this._idDe('speaker')),
      );
    const ativo = daquiEntao;
    const bruto = String(a['media_title'] ?? '') || 'SpotifyPlus';
    const duracaoTotal = Number(a['media_duration']) || 0;
    const posicao = Number(a['media_position']) || 0;
    const marcado = Date.parse(String(a['media_position_updated_at'] ?? ''));
    const tocando = ativo && estado === 'playing';
    const viva = tocando && Number.isFinite(marcado) ? posicao + (Date.now() - marcado) / 1000 : posicao;
    const atual = duracaoTotal > 0 ? Math.max(0, Math.min(duracaoTotal, viva)) : Math.max(0, viva);
    return {
      st,
      estado,
      ativo,
      tocando,
      titulo: ativo ? (/^SpotifyPlus\s+Bruno/i.test(bruto) ? 'SpotifyPlus' : bruto) : 'SpotifyPlus',
      artista: ativo ? String(a['media_artist'] ?? a['media_album_name'] ?? '') : '',
      capa: ativo ? String(a['entity_picture'] ?? a['media_image_url'] ?? '') : '',
      volume: a['volume_level'] != null ? Math.round(Number(a['volume_level']) * 100) : null,
      dispositivo:
        (this._sub?.['spotifyDeviceName'] as string | undefined) || String(a['source'] ?? '') || 'SpotifyPlus',
      progresso: duracaoTotal > 0 ? Math.max(0, Math.min(100, (atual / duracaoTotal) * 100)) : 0,
      decorrido: duracao(atual),
      total: duracaoTotal > 0 ? duracao(duracaoTotal) : '--:--',
    };
  }

  private _modeloPc() {
    const ativo = this._estado(this._idDe('pcActive'))?.state === 'on';
    const sessao = this._estado(this._idDe('pcSession'))?.state ?? '';
    const janela = this._estado(this._idDe('pcWindow'))?.state ?? '';
    return { ativo, sessao, janela };
  }

  /**
   * Qual fonte fica aberta.
   *
   * As duas regras do original, e elas DIFEREM entre os cômodos:
   *
   * - TV + Spotify (cinco cômodos): a escolha manual persiste, mas quando
   *   qualquer fonte ACABA de ficar ativa ela é descartada e a prioridade
   *   automática volta a valer — é o que faz a TV subir sozinha ao ser ligada.
   * - PC + Spotify (Office): o Spotify TEM precedência. Ele toma a vaga ao
   *   começar a tocar, e assume também quando o PC se desliga com o painel do
   *   PC aberto. Sem seleção, Spotify ativo vence o PC ativo.
   *
   * Eu tratava os seis pela primeira regra, e o Office abria o PC quando devia
   * abrir o Spotify.
   */
  private _fonteAberta(chaves: string[], ativas: Record<string, boolean>): string {
    const agoraAtivas = chaves.filter((k) => ativas[k]);
    const antes = this._midiaAtivasAntes;
    this._midiaAtivasAntes = agoraAtivas;

    // O toque no cabeçalho é uma ordem explícita. Ele precisa continuar
    // funcionando mesmo quando o Spotify está ativo e teria precedência
    // automática no Office.
    if (this._estaNoTelefone() && this._fonteMidiaManual && chaves.includes(this._fonteMidia)) {
      return this._fonteMidia;
    }

    if (this._temPc) {
      if (ativas['spotify'] && !antes.includes('spotify')) this._fonteMidia = 'spotify';
      if (!ativas['pc'] && this._fonteMidia === 'pc' && ativas['spotify']) this._fonteMidia = 'spotify';
      if (chaves.includes(this._fonteMidia)) return this._fonteMidia;
      return ativas['spotify'] ? 'spotify' : 'pc';
    }

    if (agoraAtivas.some((k) => !antes.includes(k))) this._fonteMidia = '';
    if (chaves.includes(this._fonteMidia)) return this._fonteMidia;
    return agoraAtivas[0] ?? chaves[0] ?? '';
  }

  /** Linha de volume — o mesmo controle nas duas fontes. */
  private _linhaVolume(entityId: string | undefined, volume: number) {
    return html`
      <div class=${entityId ? 'mh-vol' : 'mh-vol is-disabled'}>
        <bruno-icon icon="mdi:volume-medium"></bruno-icon>
        <span class="mh-vol-label">Volume ${volume}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value=${String(volume)}
          .value=${String(volume)}
          aria-label="Volume"
          ?disabled=${!entityId}
          @change=${(ev: Event) => {
            const alvo = ev.currentTarget as HTMLInputElement;
            if (!entityId) return;
            this._servico('media_player', 'volume_set', {
              entity_id: entityId,
              volume_level: Number(alvo.value) / 100,
            });
          }}
        />
      </div>
    `;
  }

  /** Botão do corpo do hub. `soIcone` evita o truncamento nas fileiras de 4-5. */
  private _botaoMidia(
    rotulo: string,
    icone: string,
    aoClicar: () => void,
    opcoes: { principal?: boolean; mais?: boolean; soIcone?: boolean; desabilitado?: boolean } = {},
  ) {
    const soIcone = Boolean(opcoes.soIcone ?? opcoes.mais);
    const classes = [
      'mh-btn',
      opcoes.principal ? 'is-main' : '',
      opcoes.mais ? 'is-plus' : '',
      soIcone ? 'is-icon' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return html`
      <button
        type="button"
        class=${classes}
        title=${rotulo}
        aria-label=${rotulo}
        ?disabled=${opcoes.desabilitado}
        @click=${aoClicar}
      >
        <bruno-icon icon=${icone}></bruno-icon>${soIcone ? nothing : html`<span>${rotulo}</span>`}
      </button>
    `;
  }

  /**
   * A arte da direita.
   *
   * Só o PNG, sobreposto — posicionado de forma absoluta pelo CSS, para nunca
   * ditar a altura da linha e empurrar os botões para fora do cartão.
   */
  private _arteMidia(src: string, forma: 'wide' | 'square', icone: string, capa: boolean, pausada = false) {
    return html`
      <div class="mh-art mh-art-${forma} ${capa ? 'is-cover' : 'is-standby'}${pausada ? ' is-paused' : ''}">
        ${src ? html`<img src=${src} alt="" loading="lazy" />` : html`<bruno-icon icon=${icone}></bruno-icon>`}
      </div>
    `;
  }

  private _corpoTv() {
    const tv = this._modeloTv();
    const id = this._idDe('tv');
    const mediaId = this._idDe('tvMedia') ?? id;
    const espera = (this._sub?.['tvStandbyImage'] as string | undefined) ?? IMAGEM_TV_ESPERA;
    const generico = !tv.titulo || /^TV (ligada|desligada)$/i.test(tv.titulo) || tv.titulo === tv.fonte;
    const segundaLinha = (!generico && tv.estado === 'playing' ? tv.titulo : '') || tv.fonte;

    if (!tv.ativo) {
      return html`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>HDMI 1 disponível</em></div>
          <div class="mh-controls">
            ${this._botaoMidia(
              'Ligar TV',
              'mdi:power',
              () => this._servico('media_player', 'turn_on', { entity_id: id }),
              { principal: true, desabilitado: !id },
            )}
          </div>
        </div>
        ${this._arteMidia(espera, 'wide', 'mdi:television-classic', false)}
      `;
    }
    // A fileira de baixo alterna entre os três comandos e a lista de apps. Os
    // apps saem de `tvApps` na configuração — rótulo, imagem e o script que
    // abre cada um.
    const apps = Array.isArray(this._sub?.['tvApps'])
      ? (this._sub['tvApps'] as Array<{ key: string; label: string; image?: string; script?: string }>)
      : [];

    const fileira = this._appsTvAbertos && apps.length
      ? html`<div class="mh-btn-row mh-btn-row-5">
          ${apps.map((app) =>
            this._botaoMidia(app.label, 'mdi:play-box-outline', () => {
              if (app.script) this._servico('script', 'turn_on', { entity_id: app.script });
            }, { soIcone: true, desabilitado: !app.script }),
          )}
          ${this._botaoMidia('Voltar', 'mdi:chevron-left', () => {
            this._appsTvAbertos = false;
            this.requestUpdate();
          }, { mais: true })}
        </div>`
      : html`<div class="mh-btn-row mh-btn-row-3">
          ${this._botaoMidia('Pausar', 'mdi:pause', () =>
            this._servico('media_player', 'media_play_pause', { entity_id: mediaId }), { soIcone: true })}
          ${this._botaoMidia('Controle remoto', 'mdi:remote-tv', () => this._abrirControleRemoto(), {
            soIcone: true,
            desabilitado: !this._idDe('tvRemote'),
          })}
          ${this._botaoMidia('Apps', 'mdi:apps', () => {
            this._appsTvAbertos = true;
            this.requestUpdate();
          }, { soIcone: true, desabilitado: !apps.length })}
        </div>`;

    return html`
      <div class="mh-left">
        <div class="mh-info">
          <small>Ligada</small>${segundaLinha ? html`<em>${segundaLinha}</em>` : nothing}
        </div>
        <div class="mh-controls">${this._linhaVolume(mediaId, tv.volume ?? 60)} ${fileira}</div>
      </div>
      ${this._arteMidia(tv.poster || espera, 'wide', 'mdi:television-classic', Boolean(tv.poster), tv.estado === 'paused')}
    `;
  }

  private _appsTvAbertos = false;

  /**
   * Popup do controle remoto.
   *
   * Mesmo evento e mesma carga das subviews atuais — `ll-custom` com a chamada
   * de `browser_mod.popup` e o `universal-remote-card`. Quem monta a janela é o
   * browser_mod, exatamente como hoje; só a Sala tem controle (`remote.atv`).
   */
  private _abrirControleRemoto(): void {
    const remoto = this._idDe('tvRemote');
    if (!remoto) return;
    const mediaId = this._idDe('tvMedia') ?? this._idDe('tv');
    const comando = (command: string) => ({ action: 'perform-action', perform_action: 'remote.send_command', target: { entity_id: remoto }, data: { command } });
    const tecla = (nome: string, icone: string, command: string) => ({ type: 'button', name: nome, icon: icone, tap_action: comando(command) });

    this.dispatchEvent(
      new CustomEvent('ll-custom', {
        bubbles: true,
        composed: true,
        detail: {
          action: 'fire-dom-event',
          browser_mod: {
            service: 'browser_mod.popup',
            data: {
              title: 'Smart TV Remote',
              tag: 'tv_remote',
              style:
                '--popup-background-color: rgba(21,25,35,0.92); --popup-min-width: min(380px, 95vw); --popup-max-width: min(430px, 95vw); --popup-border-width: 0;',
              content: {
                type: 'custom:universal-remote-card',
                remote_id: remoto,
                media_player_id: mediaId,
                rows: [
                  ['power', 'input', 'menu'],
                  ['navigation'],
                  ['back', 'home', 'mute'],
                  ['volume_down', 'volume_up', 'channel_down', 'channel_up'],
                ],
                custom_actions: [
                  tecla('power', 'mdi:power', 'POWER'),
                  tecla('input', 'mdi:import', 'TV'),
                  tecla('menu', 'mdi:menu', 'MENU'),
                  {
                    type: 'circlepad',
                    name: 'navigation',
                    icon: 'mdi:checkbox-blank-circle',
                    tap_action: comando('DPAD_CENTER'),
                    up: { icon: 'mdi:chevron-up', tap_action: comando('DPAD_UP'), hold_action: { action: 'repeat' } },
                    down: { icon: 'mdi:chevron-down', tap_action: comando('DPAD_DOWN'), hold_action: { action: 'repeat' } },
                    left: { icon: 'mdi:chevron-left', tap_action: comando('DPAD_LEFT'), hold_action: { action: 'repeat' } },
                    right: { icon: 'mdi:chevron-right', tap_action: comando('DPAD_RIGHT'), hold_action: { action: 'repeat' } },
                  },
                  tecla('back', 'mdi:keyboard-backspace', 'BACK'),
                  tecla('home', 'mdi:home', 'HOME'),
                  tecla('mute', 'mdi:volume-mute', 'MUTE'),
                  tecla('volume_down', 'mdi:volume-minus', 'VOLUME_DOWN'),
                  tecla('volume_up', 'mdi:volume-plus', 'VOLUME_UP'),
                  tecla('channel_down', 'mdi:chevron-down', 'CHANNEL_DOWN'),
                  tecla('channel_up', 'mdi:chevron-up', 'CHANNEL_UP'),
                ],
              },
            },
          },
        },
      }),
    );
  }

  private _corpoPc() {
    const pc = this._modeloPc();
    const imagem = (this._sub?.['pcImage'] as string | undefined) ?? IMAGEM_PC;
    const detalhe = pc.ativo ? [pc.sessao, pc.janela].filter((v) => v && v !== '--')[0] || 'Sessão ativa' : 'Pronto para ligar';

    // Os comandos do PC são entidades do domínio `button` — `press`, não
    // `toggle`. Um `homeassistant.toggle` num button não faz nada.
    const apertar = (chave: string) => () => {
      const id = this._idDe(chave);
      if (id) this._servico('button', 'press', { entity_id: id });
    };

    return html`
      <div class="mh-left">
        <div class="mh-info"><small>${pc.ativo ? 'Ligado' : 'Desligado'}</small><em>${detalhe}</em></div>
        <div class="mh-controls">
          ${pc.ativo
            ? html`<div class="mh-btn-row mh-btn-row-5 office-pc-actions">
                ${this._botaoMidia('Sleep', 'mdi:weather-night', apertar('pcSleep'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcSleep'),
                })}
                ${this._botaoMidia('Reiniciar', 'mdi:restart', apertar('pcRestart'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcRestart'),
                })}
                ${this._botaoMidia('Desligar', 'mdi:power-standby', apertar('pcShutdown'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcShutdown'),
                })}
                ${this._botaoMidia('Bloquear', 'mdi:lock-outline', apertar('pcLock'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcLock'),
                })}
                ${this._botaoMidia(
                  pc.sessao && pc.sessao !== '--' ? pc.sessao : 'Sessão',
                  'mdi:account-clock-outline',
                  () => this._maisInfo(this._idDe('pcSession')),
                  { soIcone: true },
                )}
              </div>`
            : html`<div class="mh-btn-row mh-btn-row-3">
                ${this._botaoMidia('Ligar PC', 'mdi:power', apertar('pcPower'), {
                  principal: true,
                  desabilitado: !this._idDe('pcPower'),
                })}
              </div>`}
        </div>
      </div>
      ${this._arteMidia(imagem, 'wide', 'mdi:desktop-tower', false)}
    `;
  }

  private _corpoSpotify() {
    const sp = this._modeloSpotify();
    const id = this._idDe('spotify');
    const espera = (this._sub?.['spotifyStandbyImage'] as string | undefined) ?? IMAGEM_SPOTIFY_ESPERA;

    if (!sp.ativo) {
      // NÃO existe botão "Ligar"/"Tocar" aqui. Com o Spotify parado o cômodo não
      // tem para onde tocar: o que a origem oferece é a ESCOLHA DO DISPOSITIVO,
      // que abre o SpotifyPlus Card. Eu havia posto um "Tocar" chamando
      // `media_player.media_play` — sem dispositivo ativo o serviço dá erro.
      return html`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>${sp.dispositivo}</em></div>
          <div class="mh-controls">
            ${this._botaoMidia('Dispositivos', 'mdi:speaker-wireless', () => this._abrirSpotifyPlus('devices'), {
              principal: true,
              desabilitado: !id,
            })}
          </div>
        </div>
        ${this._arteMidia(espera, 'square', 'mdi:music-note', false)}
      `;
    }

    const fileira = this._spotifyFerramentas
      ? html`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia('Dispositivos', 'mdi:speaker-wireless', () => this._abrirSpotifyPlus('devices'), { soIcone: true })}
          ${this._botaoMidia('Presets', 'mdi:bookmark-music-outline', () => this._abrirSpotifyPlus('presets'), { soIcone: true })}
          ${this._botaoMidia('Fila', 'mdi:playlist-play', () => this._abrirSpotifyPlus('queue'), { soIcone: true })}
          ${this._botaoMidia('Voltar', 'mdi:chevron-left', () => {
            this._spotifyFerramentas = false;
            this.requestUpdate();
          }, { mais: true })}
        </div>`
      : html`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia('Anterior', 'mdi:skip-previous', () =>
            this._servico('media_player', 'media_previous_track', { entity_id: id }), { soIcone: true })}
          ${this._botaoMidia(sp.tocando ? 'Pausar' : 'Tocar', sp.tocando ? 'mdi:pause' : 'mdi:play', () => {
            if (sp.tocando) this._servico('media_player', 'media_pause', { entity_id: id });
            else this._tocarSpotify();
          }, { soIcone: true })}
          ${this._botaoMidia('Próxima', 'mdi:skip-next', () =>
            this._servico('media_player', 'media_next_track', { entity_id: id }), { soIcone: true })}
          ${this._botaoMidia('Mais', 'mdi:plus', () => {
            this._spotifyFerramentas = true;
            this.requestUpdate();
          }, { mais: true })}
        </div>`;

    return html`
      <div class="mh-left">
        <div class="mh-info">
          <small>${sp.titulo}</small>${sp.artista ? html`<em>${sp.artista}</em>` : nothing}
          <div class="mh-progress-wrap" aria-label="Progresso da faixa">
            <span class="mh-progress-time">${sp.decorrido}</span>
            <div class="mh-progress" aria-hidden="true"><span style=${`width:${sp.progresso}%`}></span></div>
            <span class="mh-progress-time">${sp.total}</span>
          </div>
        </div>
        <div class="mh-controls">${this._linhaVolume(id, sp.volume ?? 66)} ${fileira}</div>
      </div>
      ${this._arteMidia(sp.capa || espera, 'square', 'mdi:music-note', Boolean(sp.capa), sp.estado === 'paused')}
    `;
  }

  /**
   * Abre o SpotifyPlus Card na aba pedida.
   *
   * Mesmo evento e mesma carga da origem: `ll-custom` com `bruno_action:
   * 'spotify'` e a configuração do card. Quem monta a janela é a shell.
   */
  private _abrirSpotifyPlus(modo: 'devices' | 'presets' | 'queue' | 'full'): void {
    const id = this._idDe('spotify');
    if (!id) return;
    this.dispatchEvent(
      new CustomEvent('ll-custom', {
        bubbles: true,
        composed: true,
        detail: {
          action: 'fire-dom-event',
          bruno_action: 'spotify',
          bruno_spotify_config: {
            entity: id,
            deviceDefaultId: this._sub?.['spotifyDeviceName'] as string | undefined,
            mode: modo,
          },
        },
      }),
    );
  }

  /**
   * Retomar o Spotify no dispositivo do cômodo.
   *
   * `media_player.media_play` sem dispositivo ativo dá erro. A origem transfere
   * a reprodução com `spotifyplus.player_transfer_playback`, ativando o
   * dispositivo pelo nome; só cai no serviço genérico quando o cômodo não
   * declara dispositivo.
   */
  private _tocarSpotify(): void {
    const id = this._idDe('spotify');
    if (!id) return;
    const dispositivo =
      (this._sub?.['spotifyDeviceName'] as string | undefined) ||
      String(this._estado(id)?.attributes['source'] ?? '');
    if (dispositivo) {
      this._servico('spotifyplus', 'player_transfer_playback', {
        entity_id: id,
        device_id: dispositivo,
        play: true,
        delay: 0.75,
        force_activate_device: true,
      });
      return;
    }
    this._servico('media_player', 'media_play', { entity_id: id });
  }

  private _maisInfo(entityId: string | undefined): void {
    if (!entityId) return;
    if (usaWebRtc(entityId)) {
      // ANTERIOR (rollback 2026-08-10): a suspensao permanecia ate sair e
      // entrar novamente no comodo. Agora o dialogo recebe a sessao e, no
      // evento oficial dialog-closed, o tile negocia outra depois de 700 ms.
      this._tokenDefinicaoPlayer++;
      this._estadoAoVivo = 'entregue-more-info';
      marcarPlayer(entityId, 'entregue ao more-info');
      this._pararAoVivo();
      this._sincronizarCameras();
    }
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Hub de mídia: acordeão de duas fontes — TV (ou PC, no Office) e Spotify.
   *
   * Só uma fica aberta por vez, no próprio lugar da lista: a fonte nunca é
   * promovida ao topo. A entrada do PS5 vive no menu de três pontos, e só onde
   * há entidade — hoje, apenas a Sala.
   */
  private _renderMediaHub() {
    const temPc = this._temPc;
    const tv = temPc ? undefined : this._modeloTv();
    const pc = temPc ? this._modeloPc() : undefined;
    const sp = this._modeloSpotify();

    const primeira = temPc
      ? { chave: 'pc', rotulo: 'PC', icone: 'mdi:desktop-tower', ativo: Boolean(pc?.ativo), tocando: Boolean(pc?.ativo),
          resumo: pc?.ativo ? 'Ligado' : 'Desligado', atmosfera: '', corpo: () => this._corpoPc() }
      // DESVIO DELIBERADO da origem: os seis arquivos nasceram de uma cópia do
      // da Sala e todos rotulam a fonte como "TV da sala" — inclusive o Q.
      // Miguel, onde é simplesmente falso. Só a Sala tem entidade de TV; nos
      // outros a fonte fica sempre desligada, e o rótulo passa a ser "TV".
      : { chave: 'tv', rotulo: this._room?.id === 'sala' ? 'TV da sala' : 'TV', icone: 'mdi:television-classic',
          ativo: Boolean(tv?.ativo), tocando: Boolean(tv?.reproduzindo),
          resumo: tv?.ativo ? `Ligada · ${tv.fonte}` : 'Desligada',
          atmosfera: tv?.ativo ? tv.poster : '', corpo: () => this._corpoTv() };

    const fontes = [
      primeira,
      { chave: 'spotify', rotulo: 'Spotify', icone: 'mdi:spotify', ativo: sp.ativo, tocando: sp.tocando,
        resumo: sp.ativo ? sp.titulo : 'Nenhuma faixa', atmosfera: sp.ativo ? sp.capa : '',
        corpo: () => this._corpoSpotify() },
    ];

    const ativas = Object.fromEntries(fontes.map((f) => [f.chave, f.ativo]));
    const prioridade = !temPc && fontes.some((f) => f.tocando)
      ? Object.fromEntries(fontes.map((f) => [f.chave, Boolean(f.tocando)]))
      : ativas;
    const aberta = this._fonteAberta(fontes.map((f) => f.chave), prioridade);
    const tocando = Boolean(fontes.find((f) => f.chave === aberta)?.tocando);

    const classes = [
      'glass-card',
      'media-hub-card',
      temPc ? 'workspace-hub-card' : '',
      'mh-accordion',
      tocando ? 'is-playing' : '',
      this._menuMidiaAberto ? 'is-menu-open' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <div class=${classes}>
        <div class="mh-head">
          <div class="mh-head-title">
            <span class="micro-icon ${temPc ? '' : 'tone-amber'}">
              <bruno-icon icon=${temPc ? 'mdi:desk' : 'mdi:multimedia'}></bruno-icon>
            </span>
            <div class="module-title">${temPc ? 'Estação de Trabalho' : 'Hub de Mídia'}</div>
            ${this._botaoRecolherFolha()}
          </div>
          <button
            type="button"
            class="mh-menu ${this._menuMidiaAberto ? 'is-active' : ''}"
            title="Opções"
            aria-label="Opções"
            aria-expanded=${this._menuMidiaAberto ? 'true' : 'false'}
            @click=${() => {
              this._menuMidiaAberto = !this._menuMidiaAberto;
              this.requestUpdate();
            }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
          ${this._botaoFecharFolha()}
        </div>
        ${this._menuMidiaAberto ? this._renderMenuMidia() : nothing}
        <div class="mh-sources">
          ${fontes.map((f) => {
            const aberto = f.chave === aberta;
            const cls = ['mh-source', aberto ? 'is-open' : '', f.ativo ? 'is-active' : '']
              .filter(Boolean)
              .join(' ');
            const corpoCls = [
              'mh-source-body',
              `mh-source-body-${f.chave}`,
              f.ativo ? 'is-source-active' : 'is-source-idle',
              f.atmosfera ? 'has-atmosphere' : '',
            ]
              .filter(Boolean)
              .join(' ');
            return html`
              <div class=${cls}>
                <button
                  type="button"
                  class="mh-source-head"
                  aria-expanded=${aberto ? 'true' : 'false'}
                  @click=${() => this._selecionarFonteMidia(f.chave)}
                >
                  <bruno-icon
                    class="mh-src-icon ${f.chave === 'spotify' ? 'mh-icon-spotify' : ''}"
                    icon=${f.icone}
                  ></bruno-icon>
                  <span class="mh-src-name">${f.rotulo}</span>
                  <span class="mh-src-summary">${f.resumo}</span>
                  ${aberto ? nothing : html`<bruno-icon class="mh-src-chevron" icon="mdi:chevron-right"></bruno-icon>`}
                </button>
                ${aberto
                  ? html`<div class=${corpoCls}>
                      ${this._estaNoTelefone() && f.atmosfera
                        ? html`<img class="mh-now-atmosphere" src=${f.atmosfera} alt="" aria-hidden="true" />`
                        : nothing}
                      ${f.corpo()}
                    </div>`
                  : nothing}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  /** O menu de três pontos. Só a Sala tem PS5; nos demais fica o more-info. */
  private _renderMenuMidia() {
    const ps5 = this._idDe('ps5');
    const st = this._estado(ps5);
    const ativo = st?.state === 'on';
    const itens = ps5
      ? [{ icone: 'mdi:sony-playstation', titulo: 'PS5', sub: ativo ? 'Online' : 'Offline', entidade: ps5, ativo }]
      : [];
    if (!itens.length) return nothing;

    return html`
      <div class="mh-overflow-panel" role="menu" aria-label="Opções de mídia">
        ${itens.map(
          (i) => html`
            <div class="mh-overflow-item">
              <span class="mh-overflow-icon"><bruno-icon icon=${i.icone}></bruno-icon></span>
              <span class="mh-overflow-copy"><strong>${i.titulo}</strong><small>${i.sub}</small></span>
              <button
                type="button"
                class="mh-overflow-action ${i.ativo ? 'is-active' : ''}"
                title=${i.ativo ? 'Desligar PS5' : 'Ligar PS5'}
                aria-label=${i.ativo ? 'Desligar PS5' : 'Ligar PS5'}
                @click=${() => this._servico('homeassistant', 'toggle', { entity_id: i.entidade })}
              >
                <bruno-icon icon="mdi:power"></bruno-icon>
              </button>
              <button
                type="button"
                class="mh-overflow-action"
                title="Detalhes"
                aria-label="Detalhes do PS5"
                @click=${() => this._maisInfo(i.entidade)}
              >
                <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>
              </button>
            </div>
          `,
        )}
      </div>
    `;
  }

  /**
   * Os cinco eletrodomésticos da Cozinha.
   *
   * Cada tile tem imagem, nome e o estado em texto. Só a lava-louças tem
   * entidade hoje; os demais são placeholders com `is-muted`, como no original —
   * aparecem, mas não prometem controle que não existe.
   */
  private _renderEletrodomesticos() {
    // A lista vem da própria configuração — `entities.appliances` —, com o PNG
    // de cada aparelho, os estados que contam como ativo e os rótulos. Eu havia
    // escrito uma lista fixa com ícones; o original usa IMAGEM.
    const bruto = (this._sub?.entities as Record<string, unknown> | undefined)?.['appliances'];
    if (!Array.isArray(bruto)) return nothing;

    return bruto
      .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object')
      .map((item) => {
        const chave = String(item['key'] ?? 'item').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
        const nome = String(item['name'] ?? 'Eletrodoméstico');
        const imagem = typeof item['image'] === 'string' ? item['image'] : '';
        const alvo = typeof item['entity'] === 'string' ? item['entity'] : '';
        const idEstado = typeof item['stateEntity'] === 'string' ? item['stateEntity'] : alvo;
        const st = idEstado && this._hass ? this._hass.states[idEstado] : undefined;

        const ativos = Array.isArray(item['activeStates'])
          ? (item['activeStates'] as unknown[]).map((v) => String(v).toLowerCase())
          : ['on'];
        const atributoAtivo = typeof item['activeAttr'] === 'string' ? item['activeAttr'] : '';
        const sensorAtivo = this._room?.activeSensor ? this._hass?.states[this._room.activeSensor] : undefined;
        const ativo =
          ativos.includes(String(st?.state ?? '').toLowerCase()) ||
          (atributoAtivo ? truthy(sensorAtivo?.attributes[atributoAtivo]) : false);

        const placeholder = Boolean(item['placeholder']) || !alvo;
        const detalhes = typeof item['moreInfoEntity'] === 'string' ? item['moreInfoEntity'] : alvo;
        const classes = ['appliance-tile', `is-${chave}`, ativo ? 'is-on' : '', placeholder ? 'is-muted' : '']
          .filter(Boolean)
          .join(' ');

        return html`
          <article class=${classes}>
            <button
              type="button"
              class="appliance-main"
              aria-label=${nome}
              ?disabled=${placeholder}
              @click=${() => !placeholder && this._alternarAparelho(alvo)}
            >
              <div class="appliance-visual" data-image-wrapper>
                ${imagem ? html`<img src=${imagem} alt="" loading="lazy" decoding="async" />` : nothing}
              </div>
              <div class="appliance-copy">
                <strong>${nome}</strong>
                <small>${this._rotuloDoAparelho(item, st, ativo, placeholder)}</small>
              </div>
            </button>
            <button
              type="button"
              class="mh-menu appliance-more"
              title="Mais detalhes"
              aria-label=${`Mais detalhes de ${nome}`}
              ?disabled=${!detalhes}
              @click=${() => this._maisInfo(detalhes)}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </article>
        `;
      });
  }

  /** Rótulo de estado: os textos vêm da configuração, como no original. */
  private _rotuloDoAparelho(
    item: Record<string, unknown>,
    st: { state: string } | undefined,
    ativo: boolean,
    placeholder: boolean,
  ): string {
    const texto = (k: string, padrao: string) =>
      typeof item[k] === 'string' ? (item[k] as string) : padrao;
    if (placeholder) return texto('placeholderLabel', 'Sem tomada');
    if (!st) return 'Indisponível';
    if (ativo) return texto('activeLabel', 'Ligada');
    const s = String(st.state).toLowerCase();
    if (s === 'off' || s === 'unavailable') return texto('offLabel', 'Desligada');
    return texto('idleLabel', 'Ligada');
  }

  private _alternarAparelho(entityId: string): void {
    if (!this._hass) return;
    const dominio = entityId.split('.')[0] ?? 'switch';
    this._hass.callService(dominio, 'toggle', { entity_id: entityId }, { entity_id: entityId });
  }

  private _entidadeClimate(): string | undefined {
    return this._idDe('climate');
  }

  private _estadoClimate(): EstadoHa | undefined {
    return this._estado(this._entidadeClimate());
  }

  /**
   * O A/C está trabalhando?
   *
   * `hvac_action` manda quando existe: um aparelho em `cool` mas com a ação
   * `idle` não está resfriando. Sem ela, vale o estado.
   */
  private _modeloClimate() {
    const st = this._estadoClimate();
    const a = st?.attributes ?? {};
    const acao = String(a['hvac_action'] ?? '').toLowerCase();
    const indisponivel = this._indisponivel(st);
    const ativo = indisponivel || st?.state === 'off'
      ? false
      : ACOES_CLIMATE_ATIVAS.includes(acao)
        ? true
        : ACOES_CLIMATE_INATIVAS.includes(acao)
          ? false
          : ESTADOS_CLIMATE_LIGADO.includes(String(st?.state ?? ''));

    const num = (v: unknown, padrao: number | null) => (Number.isFinite(Number(v)) ? Number(v) : padrao);
    return {
      st,
      indisponivel,
      ativo,
      alvo: num(a['temperature'], null),
      atual: num(a['current_temperature'], null),
      minima: num(a['min_temp'], 16) as number,
      maxima: num(a['max_temp'], 30) as number,
      modo: st?.state ?? 'off',
      ventilacao: String(a['fan_mode'] ?? 'auto'),
      swing: String(a['swing_mode'] ?? ''),
      modos: Array.isArray(a['hvac_modes']) ? (a['hvac_modes'] as string[]) : [],
      ventilacoes: Array.isArray(a['fan_modes']) ? (a['fan_modes'] as string[]) : [],
      swings: Array.isArray(a['swing_modes']) ? (a['swing_modes'] as string[]) : [],
    };
  }

  private _rotuloModo(modo: string): string {
    const nomes: Record<string, string> = {
      off: 'Desligado', cool: 'Frio', heat: 'Aquecimento', fan_only: 'Ventilar',
      dry: 'Secar', heat_cool: 'Auto', auto: 'Auto',
    };
    return nomes[String(modo).toLowerCase()] ?? capitalizar(modo);
  }

  private _iconeModo(modo: string): string {
    const nomes: Record<string, string> = {
      off: 'mdi:power', cool: 'mdi:snowflake', heat: 'mdi:fire', fan_only: 'mdi:fan',
      dry: 'mdi:water-percent', auto: 'mdi:autorenew', heat_cool: 'mdi:autorenew',
    };
    return nomes[String(modo).toLowerCase()] ?? 'mdi:thermostat';
  }

  private _rotuloVentilacao(modo: string): string {
    const v = String(modo).toLowerCase();
    if (v === 'auto') return 'Auto';
    if (v.includes('low') || v.includes('baixo')) return 'Baixa';
    if (v.includes('med')) return 'Média';
    if (v.includes('high') || v.includes('alto')) return 'Alta';
    if (v.includes('fort')) return 'Forte';
    return capitalizar(modo);
  }

  private _iconeVentilacao(modo: string): string {
    const v = String(modo).toLowerCase();
    if (v.includes('auto')) return 'mdi:fan-auto';
    if (v.includes('low') || v.includes('baixo')) return 'mdi:fan-speed-1';
    if (v.includes('med')) return 'mdi:fan-speed-2';
    if (v.includes('high') || v.includes('alto') || v.includes('fort')) return 'mdi:fan-speed-3';
    return 'mdi:fan';
  }

  private _rotuloSwing(modo: string): string {
    const v = String(modo).toLowerCase();
    if (!v) return 'Indisponível';
    if (['off', 'desativado', 'desativada', 'disabled'].includes(v)) return 'Desligado';
    if (['on', 'ativo', 'ativada', 'enabled'].includes(v)) return 'Ativo';
    return capitalizar(modo);
  }

  /**
   * O anel — gauge semicircular de 180°, do mínimo à esquerda ao máximo à
   * direita, com o alvo no arco aceso e a temperatura ambiente sob a linha.
   *
   * A caixa preserva a geometria original: centro em (360, 410), viewBox
   * 720×460. O arco luminoso tem raio próprio; marcas, textos, Power, Swing e
   * todos os containers externos mantêm exatamente a geometria aprovada.
   */
  private _renderAnelClimate(cl: ReturnType<typeof this._modeloClimate>) {
    const cx = 360;
    const cy = 410;
    // ANTERIOR (rollback): raio unico 300. A tentativa ainda anterior aplicava
    // scale(1.06) no container e deslocava Power/Swing. Agora só os quatro
    // paths e o marcador usam 315; a coroa permanece em 300 e fica por cima.
    const raioMarcacoes = 300;
    const raioAnel = 315;
    const inicio = -180;
    const fim = 0;
    const varredura = fim - inicio;

    const min = Number.isFinite(cl.minima) ? cl.minima : 12;
    const max = Number.isFinite(cl.maxima) ? cl.maxima : 30;
    const alvo = Number.isFinite(Number(cl.alvo))
      ? Math.max(min, Math.min(max, Number(cl.alvo)))
      : min + (max - min) / 2;
    const fracao = Math.max(0, Math.min(1, (alvo - min) / Math.max(1, max - min)));
    const anguloAtual = inicio + varredura * fracao;

    const polar = (r: number, grau: number) => {
      const rad = (grau * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const arco = (r: number, a: number, b: number) => {
      const s = polar(r, a);
      const e = polar(r, b);
      const grande = Math.abs(b - a) <= 180 ? '0' : '1';
      return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${grande} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
    };

    const marcasExternas = Array.from({ length: 91 }, (_, i) => {
      const ang = inicio + varredura * (i / 90);
      const maior = i % 15 === 0;
      const media = i % 5 === 0;
      const p1 = polar(raioMarcacoes + 34, ang);
      const p2 = polar(
        maior ? raioMarcacoes + 8 : media ? raioMarcacoes + 14 : raioMarcacoes + 21,
        ang,
      );
      const cls = maior ? 'icg-tick major' : media ? 'icg-tick medium' : 'icg-tick minor';
      return svg`<line x1=${p1.x.toFixed(3)} y1=${p1.y.toFixed(3)} x2=${p2.x.toFixed(3)} y2=${p2.y.toFixed(3)} class=${cls}></line>`;
    });

    const marcasInternas = Array.from({ length: 73 }, (_, i) => {
      const ang = inicio + varredura * (i / 72);
      const p1 = polar(raioMarcacoes - 18, ang);
      const p2 = polar(raioMarcacoes - 34, ang);
      return svg`<line x1=${p1.x.toFixed(3)} y1=${p1.y.toFixed(3)} x2=${p2.x.toFixed(3)} y2=${p2.y.toFixed(3)} class="icg-inner-tick"></line>`;
    });

    const legendas = [
      { texto: `${numero(min, 0)}°`, ang: -180, r: raioMarcacoes + 52, cls: 'edge' },
      { texto: '10', ang: -148, r: raioMarcacoes + 58, cls: '' },
      { texto: '20', ang: -90, r: raioMarcacoes + 52, cls: 'top' },
      { texto: '25', ang: -32, r: raioMarcacoes + 58, cls: '' },
      { texto: `${numero(max, 0)}°`, ang: 0, r: raioMarcacoes + 52, cls: 'edge' },
    ].map((l) => {
      const p = polar(l.r, l.ang);
      return svg`<text x=${p.x.toFixed(3)} y=${p.y.toFixed(3)} text-anchor="middle" dominant-baseline="middle" class=${`icg-label ${l.cls}`}>${l.texto}</text>`;
    });

    const marcador = polar(raioAnel, anguloAtual);
    const rotuloAlvo = cl.alvo == null ? '--' : numero(cl.alvo, 0);
    const rotuloAmbiente = cl.atual == null ? '--' : numero(cl.atual, 1);
    const rotuloModo = (cl.modo === 'cool'
      ? 'Resfriamento'
      : cl.modo === 'heat'
        ? 'Aquecimento'
        : cl.modo === 'fan_only'
          ? 'Ventilacao'
          : 'Temperatura'
    ).toUpperCase();

    return html`
      <div class="icg-root">
        <div class="icg-shell">
          <svg
            class="icg-svg"
            viewBox="0 0 720 460"
            role="img"
            aria-label=${`Temperatura alvo ${rotuloAlvo}°. Ambiente ${rotuloAmbiente}°.`}
          >
            <defs>
              <linearGradient id="icgActiveBlue" x1="90" y1="340" x2="560" y2="90">
                <stop offset="0%" stop-color="#0078ff"></stop>
                <stop offset="38%" stop-color="#1fb7ff"></stop>
                <stop offset="72%" stop-color="#3ed6ff"></stop>
                <stop offset="100%" stop-color="#96f0ff"></stop>
              </linearGradient>
              <filter id="icgBlueGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur>
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0.02  0 0 0 0 0.42  0 0 0 0 1  0 0 0 0.95 0"
                ></feColorMatrix>
                <feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
              <filter id="icgTextGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#dcecff" flood-opacity="0.24"></feDropShadow>
              </filter>
            </defs>
            <path d=${arco(raioAnel, inicio, fim)} class="icg-track-shadow"></path>
            <path d=${arco(raioAnel, anguloAtual, fim)} class="icg-track-muted"></path>
            <path d=${arco(raioAnel, inicio, anguloAtual)} class="icg-active-glow"></path>
            <path d=${arco(raioAnel, inicio, anguloAtual)} class="icg-active-arc"></path>
            <g>${marcasExternas}</g>
            <g>${marcasInternas}</g>
            ${legendas}
            <circle cx=${marcador.x.toFixed(3)} cy=${marcador.y.toFixed(3)} r="21" class="icg-marker-glow"></circle>
            <circle cx=${marcador.x.toFixed(3)} cy=${marcador.y.toFixed(3)} r="13" class="icg-marker-ring"></circle>
            <circle
              cx=${(marcador.x - 4).toFixed(3)}
              cy=${(marcador.y - 5).toFixed(3)}
              r="4"
              class="icg-marker-highlight"
            ></circle>
            <text x=${cx} y="260" text-anchor="middle" dominant-baseline="middle" class="icg-center-mode">
              ${rotuloModo}
            </text>
            <text x=${cx} y="328" text-anchor="middle" dominant-baseline="middle" class="icg-center-temp">
              ${rotuloAlvo}°
            </text>
            <text x=${cx} y="382" text-anchor="middle" dominant-baseline="middle" class="icg-center-sub">
              SET TEMPERATURE
            </text>
            <line x1=${cx - 28} y1="408" x2=${cx + 28} y2="408" class="icg-center-line"></line>
            <text x=${cx} y="432" text-anchor="middle" dominant-baseline="middle" class="icg-ambient">
              Ambient ${rotuloAmbiente}°
            </text>
          </svg>
        </div>
      </div>
    `;
  }

  /** A/C: cabeçalho com power, anel de temperatura e três controles na base. */
  private _renderAC() {
    const id = this._entidadeClimate();
    const cl = this._modeloClimate();
    const swingNormalizado = cl.swing.toLowerCase();
    const swingAtivo =
      ['on', 'ativo', 'ativada', 'enabled'].includes(swingNormalizado) ||
      (swingNormalizado.includes('ativ') && !swingNormalizado.includes('desativ'));

    const unicos = (v: string[]) => [...new Set(v.filter(Boolean))];
    const painel = this._painelClima;

    const opcoes = {
      mode: unicos(cl.modos).map((m) => ({
        modo: m,
        rotulo: this._rotuloModo(m),
        icone: this._iconeModo(m),
        ativo: m.toLowerCase() === String(cl.modo).toLowerCase(),
        servico: 'set_hvac_mode' as const,
        campo: 'hvac_mode' as const,
      })),
      fan: unicos(cl.ventilacoes).map((m) => ({
        modo: m,
        rotulo: this._rotuloVentilacao(m),
        icone: this._iconeVentilacao(m),
        ativo: m.toLowerCase() === cl.ventilacao.toLowerCase(),
        servico: 'set_fan_mode' as const,
        campo: 'fan_mode' as const,
      })),
      swing: unicos(cl.swings).map((m) => ({
        modo: m,
        rotulo: this._rotuloSwing(m),
        icone: m.toLowerCase() === 'off' ? 'mdi:air-conditioner' : 'mdi:swap-vertical',
        ativo: m.toLowerCase() === swingNormalizado,
        servico: 'set_swing_mode' as const,
        campo: 'swing_mode' as const,
      })),
    };

    const popover = (chave: 'mode' | 'fan' | 'swing') => {
      if (painel !== chave) return nothing;
      const lista = opcoes[chave];
      if (!lista.length) {
        return html`<div class="ac-popover" role="menu">
          <button type="button" class="ac-popover-option" disabled>
            <bruno-icon icon="mdi:alert-circle-outline"></bruno-icon><span>Indisponível</span>
          </button>
        </div>`;
      }
      return html`<div class="ac-popover" role="menu">
        ${lista.map(
          (o) => html`
            <button
              type="button"
              class="ac-popover-option ${o.ativo ? 'is-active' : ''}"
              role="menuitem"
              @click=${() => {
                this._painelClima = '';
                if (id) this._servico('climate', o.servico, { entity_id: id, [o.campo]: o.modo });
                this.requestUpdate();
              }}
            >
              <bruno-icon icon=${o.icone}></bruno-icon><span>${o.rotulo}</span>
            </button>
          `,
        )}
      </div>`;
    };

    const controle = (
      chave: 'mode' | 'fan' | 'swing',
      icone: string,
      titulo: string,
      valor: string,
    ) => html`
      <div class="ac-control-wrap">
        <button
          type="button"
          class="ac-action ${painel === chave ? 'is-open' : ''}"
          aria-expanded=${painel === chave ? 'true' : 'false'}
          ?disabled=${cl.indisponivel || !id}
          @click=${() => {
            this._painelClima = this._painelClima === chave ? '' : chave;
            this.requestUpdate();
          }}
        >
          <span class="ac-action-icon"><bruno-icon icon=${icone}></bruno-icon></span>
          <span class="ac-action-text"><small>${titulo}</small><strong>${valor}</strong></span>
        </button>
        ${popover(chave)}
      </div>
    `;

    return html`
      <div class="glass-card ac-card ac-card-lean">
        <div class="ac-lean-head">
          <div class="mh-head-title ac-head-title">
            <span class="micro-icon tone-cyan"><bruno-icon icon="mdi:air-conditioner"></bruno-icon></span>
            <div class="module-title">Ar-condicionado</div>
            ${this._botaoRecolherFolha()}
          </div>
          <div class="ac-top-stack">
            <button
              type="button"
              class="mh-menu ac-more-button"
              title="Mais detalhes"
              aria-label="Mais detalhes"
              @click=${() => {
                this._painelClima = '';
                this._maisInfo(id);
              }}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
            <button
              type="button"
              class="ac-power-floating ${cl.ativo ? 'is-active' : ''}"
              aria-label=${cl.ativo ? 'Desligar ar condicionado' : 'Ligar ar condicionado'}
              ?disabled=${cl.indisponivel || !id}
              @click=${() => {
                if (!id) return;
                this._painelClima = '';
                this._servico('climate', cl.ativo ? 'turn_off' : 'turn_on', { entity_id: id });
              }}
            >
              <bruno-icon icon="mdi:power"></bruno-icon>
            </button>
            ${this._botaoFecharFolha()}
          </div>
        </div>
        <div class="ac-lean-mid">
          <div class="ac-ring">${this._renderAnelClimate(cl)}</div>
        </div>
        <div class="ac-lean-foot">
          ${controle(
            'mode',
            'mdi:thermostat-auto',
            'Modo',
            !cl.ativo || cl.modo === 'off' ? 'Desligado' : this._rotuloModo(cl.modo),
          )}
          ${controle('fan', 'mdi:fan', 'Ventilação', this._rotuloVentilacao(cl.ventilacao))}
          ${controle(
            'swing',
            'mdi:air-conditioner',
            'Swing',
            cl.swing ? this._rotuloSwing(cl.swing) : swingAtivo ? 'Ativo' : 'Desligado',
          )}
        </div>
      </div>
    `;
  }

  /**
   * Cozinha: grid próprio de três colunas.
   *
   *   "topband topband topband"
   *   "hero    hero    right"
   *   "cams    appliances appliances"
   *
   * Não há `content-left` nem A/C, e o hero, as câmeras e os eletrodomésticos
   * são filhos DIRETOS da raiz — cada um ocupando sua área. Lido do DOM da
   * subview atual; deduzir do CSS teria dado o grid errado, porque o arquivo
   * guarda definições antigas empilhadas.
   */
  private _corpoCozinha() {
    return html`
      <div class="hero-panel is-unconfigured">
        <div class="hero-stage hero-atmosphere"><div class="hero-content"></div></div>
      </div>
      <div class="right-column">${this._renderLightsDock()}</div>
      ${this._renderCameras()}
      <div class="glass-card appliances-card kitchen-appliances-card">
        <div class="mh-head appliances-head">
          <div class="mh-head-title">
            <!-- O nome tem de ser um dos apelidos da tabela de Hugeicons.
                 "silverware-fork-knife" não está lá e caía no genérico — o
                 círculo que aparecia no lugar do ícone. O original usa este,
                 que resolve para "hugeicons:electric-home-01". -->
            <span class="micro-icon tone-amber">
              <bruno-icon icon="mdi:home-lightning-bolt-outline"></bruno-icon>
            </span>
            <div class="module-title">Eletrodomésticos</div>
            ${this._botaoRecolherFolha()}
          </div>
          ${this._botaoFecharFolha()}
        </div>
        <div class="appliances-grid">${this._renderEletrodomesticos()}</div>
      </div>
      ${this._renderResumoTelefone()}
    `;
  }
}

if (!customElements.get('bruno-room-subview')) {
  customElements.define('bruno-room-subview', BrunoRoomSubview);
}

interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
}
const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards ?? [];
if (!w.customCards.some((c) => c.type === 'bruno-room-subview')) {
  w.customCards.push({
    type: 'bruno-room-subview',
    name: 'Bruno · Subview de cômodo',
    description: 'Subview parametrizada por cômodo (arquitetura nova).',
  });
}
