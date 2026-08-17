/**
 * Sessão WebRTC de câmera (Fase 6.2B, parte 2) — FORA DO CAMINHO VIVO.
 *
 * ⚠️ NÃO É USADO PELO DASHBOARD. Medido no PC em 2026-08-07: 3 tentativas,
 * 3 falhas, todas no prazo de negociação. E, pior, as tentativas degradaram o
 * instantâneo da mesma câmera (25 s de pior caso), violando a regra desta fase.
 *
 * A troca foi usar o `hui-image` nativo do Home Assistant com
 * `cameraView = 'live'` — o MESMO elemento que a subview de câmeras já usava
 * para mostrar esta câmera em tempo real. Eu reimplementei à mão um protocolo
 * que o frontend entrega pronto e cuja versão pronta estava provada a dois
 * cliques de distância.
 *
 * Fica aqui, testado, porque é uma implementação completa e pode servir se um
 * dia for preciso negociar fora do `hui-image`. O Vite não a inclui no bundle
 * enquanto ninguém a importar.
 *
 * ── O PROBLEMA QUE ELA RESOLVE ──────────────────────────────────────────
 *
 * O instantâneo é pergunta e resposta: cada quadro é uma requisição que leva de
 * 3 a 7 s ao Home Assistant, e a cadência espera a anterior terminar. Foi
 * medido, melhorado ao limite do que o cliente controla, e o teto que sobra é do
 * servidor. O usuário resume: *"no SmartLife é em tempo real e gostaria que no
 * dashboard fosse assim também"*.
 *
 * Com WebRTC o quadro FLUI — não é pedido. É a única mudança que altera a
 * natureza do problema em vez de otimizar em volta dele.
 *
 * ── O CONTRATO COM O HOME ASSISTANT ─────────────────────────────────────
 *
 * O HA expõe a negociação pelo WebSocket (2024.11+). O fluxo é:
 *
 *   1. `camera/webrtc/get_client_config`  -> servidores ICE (pode não existir)
 *   2. cria RTCPeerConnection, transceiver de vídeo só de recepção
 *   3. cria a oferta local
 *   4. `camera/webrtc/offer` (assinatura)  -> devolve, em mensagens:
 *        { type: 'session',  session_id }
 *        { type: 'answer',   answer }
 *        { type: 'candidate', candidate }
 *        { type: 'error',    code, message }
 *   5. candidatos locais sobem por `camera/webrtc/candidate`
 *
 * ── POR QUE ESTE ARQUIVO NÃO TOCA NO DOM ────────────────────────────────
 *
 * Ele recebe a fábrica de `RTCPeerConnection` e o transporte por parâmetro. Isso
 * é o que torna o protocolo testável em Node, sem navegador e sem Home
 * Assistant — e nesta fase isso importa mais do que o normal, porque a
 * negociação real só pode ser validada no aparelho do usuário.
 *
 * ── A REGRA QUE GOVERNA TUDO AQUI ───────────────────────────────────────
 *
 * **Falhar é normal e não pode custar nada.** Qualquer erro em qualquer etapa
 * encerra a sessão e avisa quem chamou; o instantâneo continua na tela, exatamente
 * como está hoje. Uma câmera que não negocia deve ficar igual ao que já era, nunca
 * pior.
 */

export type EstadoDaSessao = 'ocioso' | 'negociando' | 'ativo' | 'falhou' | 'encerrado';

/** Uma mensagem do HA na assinatura da oferta. */
export interface MensagemWebRtc {
  type: string;
  session_id?: string;
  answer?: string;
  candidate?: unknown;
  code?: string;
  message?: string;
}

/**
 * O transporte — tudo o que a sessão precisa do Home Assistant.
 *
 * Reduzido a três verbos de propósito: o que for além disto é detalhe do
 * frontend do HA e não deve vazar para cá.
 */
export interface TransporteWebRtc {
  /** Assina a oferta. Devolve a função que cancela a assinatura. */
  oferecer(
    entityId: string,
    offer: string,
    aoReceber: (msg: MensagemWebRtc) => void,
  ): Promise<() => void>;
  /** Envia um candidato ICE local. */
  enviarCandidato(entityId: string, sessionId: string, candidate: unknown): Promise<void>;
  /** Servidores ICE, quando o HA os publica. */
  configuracao?(entityId: string): Promise<RTCConfiguration | undefined>;
}

export interface OpcoesDaSessao {
  /** Fábrica da conexão — injetável para teste. */
  criarConexao?: (cfg: RTCConfiguration) => RTCPeerConnection;
  aoMudarEstado?: (estado: EstadoDaSessao, detalhe?: string) => void;
  /** O vídeo chegou e está pronto para ir à tela. */
  aoReceberMidia?: (stream: MediaStream) => void;
  /** Quanto esperar pela negociação inteira antes de desistir. */
  prazo?: number;
}

/**
 * Prazo da negociação.
 *
 * 12 s é folgado: a negociação é troca de mensagens, não transferência de
 * vídeo — se não fechou nesse tempo, não vai fechar. Calibrado com folga sobre a
 * faixa observada de resposta do HA (3 a 10 s para uma imagem), pela regra que a
 * rev.2 desta fase deixou registrada: **prazo é afirmação sobre distribuição**.
 */
export const PRAZO_NEGOCIACAO = 12_000;

export class SessaoWebRtc {
  private pc: RTCPeerConnection | undefined;
  private cancelarAssinatura: (() => void) | undefined;
  private sessionId = '';
  private _estado: EstadoDaSessao = 'ocioso';
  private prazoTimer: ReturnType<typeof setTimeout> | undefined;
  private encerrada = false;
  /** Candidatos locais gerados antes de o session_id chegar. */
  private candidatosPendentes: unknown[] = [];

  private readonly criarConexao: (cfg: RTCConfiguration) => RTCPeerConnection;
  private readonly aoMudarEstado: (estado: EstadoDaSessao, detalhe?: string) => void;
  private readonly aoReceberMidia: (stream: MediaStream) => void;
  private readonly prazo: number;

  constructor(
    private readonly transporte: TransporteWebRtc,
    opcoes: OpcoesDaSessao = {},
  ) {
    this.criarConexao =
      opcoes.criarConexao ?? ((cfg) => new RTCPeerConnection(cfg));
    this.aoMudarEstado = opcoes.aoMudarEstado ?? (() => {});
    this.aoReceberMidia = opcoes.aoReceberMidia ?? (() => {});
    this.prazo = opcoes.prazo ?? PRAZO_NEGOCIACAO;
  }

  get estado(): EstadoDaSessao {
    return this._estado;
  }

  private mudar(estado: EstadoDaSessao, detalhe?: string): void {
    if (this._estado === estado) return;
    this._estado = estado;
    this.aoMudarEstado(estado, detalhe);
  }

  /**
   * Negocia e entrega o vídeo.
   *
   * Nunca lança: falha vira estado `falhou`. Quem chama continua mostrando o
   * instantâneo — a regra do cabeçalho.
   */
  async iniciar(entityId: string): Promise<boolean> {
    if (this._estado === 'negociando' || this._estado === 'ativo') return true;
    this.encerrada = false;
    this.mudar('negociando');

    this.prazoTimer = setTimeout(() => {
      this.falhar('a negociação estourou o prazo');
    }, this.prazo);

    try {
      const cfg = (await this.transporte.configuracao?.(entityId)) ?? {};
      if (this.encerrada) return false;

      const pc = this.criarConexao(cfg);
      this.pc = pc;

      // Só de recepção: o dashboard nunca envia mídia. Sem isto o navegador
      // negociaria bidirecionalmente e pediria permissão de câmera ao usuário.
      pc.addTransceiver('video', { direction: 'recvonly' });

      pc.ontrack = (ev: RTCTrackEvent) => {
        const stream = ev.streams[0];
        if (!stream || this.encerrada) return;
        this.limparPrazo();
        this.mudar('ativo');
        this.aoReceberMidia(stream);
      };

      pc.onicecandidate = (ev: RTCPeerConnectionIceEvent) => {
        if (!ev.candidate) return;
        const c = ev.candidate.toJSON ? ev.candidate.toJSON() : ev.candidate;
        if (!this.sessionId) {
          // O HA só aceita candidato depois de abrir a sessão. Guardar em vez de
          // descartar é o que evita perder o caminho de conexão em rede local,
          // onde os candidatos costumam sair antes da resposta.
          this.candidatosPendentes.push(c);
          return;
        }
        void this.transporte.enviarCandidato(entityId, this.sessionId, c).catch(() => {
          // Candidato perdido não derruba a sessão: ainda pode haver outro caminho.
        });
      };

      pc.onconnectionstatechange = () => {
        if (this.encerrada) return;
        const s = pc.connectionState;
        if (s === 'failed' || s === 'closed') this.falhar(`conexão ${s}`);
      };

      const oferta = await pc.createOffer();
      if (this.encerrada) return false;
      await pc.setLocalDescription(oferta);
      if (this.encerrada) return false;

      const sdp = pc.localDescription?.sdp ?? oferta.sdp ?? '';
      if (!sdp) {
        this.falhar('oferta local vazia');
        return false;
      }

      this.cancelarAssinatura = await this.transporte.oferecer(entityId, sdp, (msg) =>
        this.receber(entityId, msg),
      );
      if (this.encerrada) {
        this.cancelarAssinatura?.();
        this.cancelarAssinatura = undefined;
      }
      return true;
    } catch (erro) {
      this.falhar(erro instanceof Error ? erro.message : String(erro));
      return false;
    }
  }

  private receber(entityId: string, msg: MensagemWebRtc): void {
    if (this.encerrada || !this.pc) return;
    const tipo = String(msg.type ?? '');

    if (tipo === 'error') {
      this.falhar(msg.message ?? msg.code ?? 'erro do servidor');
      return;
    }

    // O HA já chamou este campo de 'id' e de 'session'; aceitar os dois evita
    // que uma diferença de versão vire "não funciona" sem explicação.
    if ((tipo === 'session' || tipo === 'id') && msg.session_id) {
      this.sessionId = msg.session_id;
      const pendentes = this.candidatosPendentes;
      this.candidatosPendentes = [];
      for (const c of pendentes) {
        void this.transporte.enviarCandidato(entityId, this.sessionId, c).catch(() => {});
      }
      return;
    }

    if (tipo === 'answer' && msg.answer) {
      void this.pc
        .setRemoteDescription({ type: 'answer', sdp: msg.answer })
        .catch((erro: unknown) =>
          this.falhar(erro instanceof Error ? erro.message : 'resposta inválida'),
        );
      return;
    }

    if (tipo === 'candidate' && msg.candidate) {
      void this.pc.addIceCandidate(msg.candidate as RTCIceCandidateInit).catch(() => {
        // Candidato remoto inválido é comum e não derruba a sessão.
      });
    }
  }

  private limparPrazo(): void {
    if (this.prazoTimer === undefined) return;
    clearTimeout(this.prazoTimer);
    this.prazoTimer = undefined;
  }

  private falhar(detalhe: string): void {
    if (this.encerrada) return;
    this.desmontar();
    this.mudar('falhou', detalhe);
  }

  /** Encerra e libera tudo. Idempotente. */
  parar(): void {
    if (this.encerrada && this._estado === 'encerrado') return;
    this.desmontar();
    this.mudar('encerrado');
  }

  private desmontar(): void {
    this.encerrada = true;
    this.limparPrazo();
    this.cancelarAssinatura?.();
    this.cancelarAssinatura = undefined;
    if (this.pc) {
      // Zerar os handlers antes de fechar: `close()` dispara mudança de estado, e
      // sem isto ela reentraria em `falhar` durante o próprio encerramento.
      this.pc.ontrack = null;
      this.pc.onicecandidate = null;
      this.pc.onconnectionstatechange = null;
      try {
        this.pc.close();
      } catch {
        // Fechar duas vezes não é erro que interesse a ninguém.
      }
      this.pc = undefined;
    }
    this.sessionId = '';
    this.candidatosPendentes = [];
  }
}
