import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  PRAZO_NEGOCIACAO,
  SessaoWebRtc,
  type EstadoDaSessao,
  type MensagemWebRtc,
  type TransporteWebRtc,
} from './webrtc-session';

/**
 * `RTCPeerConnection` falsa.
 *
 * Node não tem WebRTC, e o Home Assistant real não está aqui. O que dá para
 * validar — e é o que costuma quebrar — é o PROTOCOLO: ordem das mensagens,
 * candidato gerado antes da sessão existir, erro do servidor, prazo, e a
 * liberação no encerramento.
 */
class ConexaoFalsa {
  ontrack: ((ev: unknown) => void) | null = null;
  onicecandidate: ((ev: unknown) => void) | null = null;
  onconnectionstatechange: (() => void) | null = null;
  connectionState = 'new';
  localDescription: { sdp: string } | undefined;
  remoteDescriptions: unknown[] = [];
  candidatosRemotos: unknown[] = [];
  transceivers: { kind: string; direction: string }[] = [];
  fechada = false;

  constructor(public readonly cfg: RTCConfiguration) {}

  addTransceiver(kind: string, init: { direction: string }): void {
    this.transceivers.push({ kind, direction: init.direction });
  }

  createOffer(): Promise<{ type: string; sdp: string }> {
    return Promise.resolve({ type: 'offer', sdp: 'sdp-local' });
  }

  setLocalDescription(d: { sdp: string }): Promise<void> {
    this.localDescription = { sdp: d.sdp };
    return Promise.resolve();
  }

  setRemoteDescription(d: unknown): Promise<void> {
    this.remoteDescriptions.push(d);
    return Promise.resolve();
  }

  addIceCandidate(c: unknown): Promise<void> {
    this.candidatosRemotos.push(c);
    return Promise.resolve();
  }

  close(): void {
    this.fechada = true;
  }

  /** Simula o navegador entregando a mídia. */
  emitirMidia(stream: unknown): void {
    this.ontrack?.({ streams: [stream] });
  }

  /** Simula um candidato ICE local. */
  emitirCandidato(c: unknown): void {
    this.onicecandidate?.({ candidate: c ? { toJSON: () => c } : null });
  }

  mudarConexao(estado: string): void {
    this.connectionState = estado;
    this.onconnectionstatechange?.();
  }
}

class TransporteFalso implements TransporteWebRtc {
  ofertas: { entityId: string; offer: string }[] = [];
  candidatos: { entityId: string; sessionId: string; candidate: unknown }[] = [];
  assinaturasCanceladas = 0;
  private aoReceber: ((msg: MensagemWebRtc) => void) | undefined;
  configFalha = false;
  ofertaFalha = false;

  oferecer(
    entityId: string,
    offer: string,
    aoReceber: (msg: MensagemWebRtc) => void,
  ): Promise<() => void> {
    if (this.ofertaFalha) return Promise.reject(new Error('websocket recusou'));
    this.ofertas.push({ entityId, offer });
    this.aoReceber = aoReceber;
    return Promise.resolve(() => {
      this.assinaturasCanceladas++;
    });
  }

  enviarCandidato(entityId: string, sessionId: string, candidate: unknown): Promise<void> {
    this.candidatos.push({ entityId, sessionId, candidate });
    return Promise.resolve();
  }

  configuracao(): Promise<RTCConfiguration | undefined> {
    if (this.configFalha) return Promise.reject(new Error('sem config'));
    return Promise.resolve({ iceServers: [{ urls: 'stun:exemplo' }] });
  }

  /** O servidor manda uma mensagem. */
  emitir(msg: MensagemWebRtc): void {
    this.aoReceber?.(msg);
  }
}

let transporte: TransporteFalso;
let conexoes: ConexaoFalsa[];
let estados: { estado: EstadoDaSessao; detalhe?: string }[];
let midias: unknown[];

function novaSessao(prazo = PRAZO_NEGOCIACAO): SessaoWebRtc {
  return new SessaoWebRtc(transporte, {
    criarConexao: (cfg) => {
      const c = new ConexaoFalsa(cfg);
      conexoes.push(c);
      return c as unknown as RTCPeerConnection;
    },
    aoMudarEstado: (estado, detalhe) => estados.push({ estado, ...(detalhe ? { detalhe } : {}) }),
    aoReceberMidia: (s) => midias.push(s),
    prazo,
  });
}

const ultima = () => conexoes[conexoes.length - 1]!;

beforeEach(() => {
  transporte = new TransporteFalso();
  conexoes = [];
  estados = [];
  midias = [];
  vi.useFakeTimers();
});

describe('negociação feliz', () => {
  it('percorre config, oferta, resposta e mídia', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');

    expect(transporte.ofertas).toEqual([{ entityId: 'camera.sala', offer: 'sdp-local' }]);
    expect(s.estado).toBe('negociando');

    transporte.emitir({ type: 'session', session_id: 'sess-1' });
    transporte.emitir({ type: 'answer', answer: 'sdp-remoto' });
    await Promise.resolve();

    expect(ultima().remoteDescriptions).toEqual([{ type: 'answer', sdp: 'sdp-remoto' }]);

    ultima().emitirMidia({ id: 'stream' });
    expect(s.estado).toBe('ativo');
    expect(midias).toEqual([{ id: 'stream' }]);
  });

  it('pede vídeo SÓ de recepção — nunca aciona a câmera do aparelho', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    expect(ultima().transceivers).toEqual([{ kind: 'video', direction: 'recvonly' }]);
  });

  it('usa os servidores ICE que o HA publicou', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    expect(ultima().cfg).toEqual({ iceServers: [{ urls: 'stun:exemplo' }] });
  });
});

describe('candidatos ICE', () => {
  it('guarda o candidato gerado ANTES da sessão e o envia depois', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');

    ultima().emitirCandidato({ candidate: 'cand-1' });
    expect(transporte.candidatos).toHaveLength(0); // ainda não há session_id

    transporte.emitir({ type: 'session', session_id: 'sess-1' });
    expect(transporte.candidatos).toEqual([
      { entityId: 'camera.sala', sessionId: 'sess-1', candidate: { candidate: 'cand-1' } },
    ]);
  });

  it('envia direto o candidato gerado depois da sessão', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    transporte.emitir({ type: 'session', session_id: 'sess-1' });

    ultima().emitirCandidato({ candidate: 'cand-2' });
    expect(transporte.candidatos).toHaveLength(1);
    expect(transporte.candidatos[0]!.candidate).toEqual({ candidate: 'cand-2' });
  });

  it('candidato nulo (fim da coleta) não vira envio', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    transporte.emitir({ type: 'session', session_id: 'sess-1' });
    ultima().emitirCandidato(null);
    expect(transporte.candidatos).toHaveLength(0);
  });

  it('aceita candidato remoto', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    transporte.emitir({ type: 'candidate', candidate: { candidate: 'remoto' } });
    expect(ultima().candidatosRemotos).toEqual([{ candidate: 'remoto' }]);
  });

  it('aceita "id" como nome do campo de sessão, além de "session"', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    ultima().emitirCandidato({ candidate: 'c' });
    transporte.emitir({ type: 'id', session_id: 'sess-9' });
    expect(transporte.candidatos[0]!.sessionId).toBe('sess-9');
  });
});

describe('falhar é normal e não pode custar nada', () => {
  it('erro do servidor encerra e informa o motivo', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    transporte.emitir({ type: 'error', code: 'webrtc_offer_failed', message: 'sem stream' });

    expect(s.estado).toBe('falhou');
    expect(estados.at(-1)?.detalhe).toBe('sem stream');
    expect(ultima().fechada).toBe(true);
  });

  it('recusa do websocket não lança — devolve falso', async () => {
    transporte.ofertaFalha = true;
    const s = novaSessao();
    await expect(s.iniciar('camera.sala')).resolves.toBe(false);
    expect(s.estado).toBe('falhou');
  });

  it('falha ao ler a configuração não lança', async () => {
    transporte.configFalha = true;
    const s = novaSessao();
    await expect(s.iniciar('camera.sala')).resolves.toBe(false);
    expect(s.estado).toBe('falhou');
  });

  it('conexão que cai vira falha', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    ultima().mudarConexao('failed');
    expect(s.estado).toBe('falhou');
  });

  it('estoura o prazo se a negociação não fecha', async () => {
    const s = novaSessao(5000);
    await s.iniciar('camera.sala');
    vi.advanceTimersByTime(5000);
    expect(s.estado).toBe('falhou');
    expect(estados.at(-1)?.detalhe).toContain('prazo');
  });

  it('mídia recebida cancela o prazo', async () => {
    const s = novaSessao(5000);
    await s.iniciar('camera.sala');
    ultima().emitirMidia({ id: 's' });
    vi.advanceTimersByTime(10_000);
    expect(s.estado).toBe('ativo');
  });
});

describe('liberação', () => {
  it('parar fecha a conexão e cancela a assinatura', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    s.parar();

    expect(ultima().fechada).toBe(true);
    expect(transporte.assinaturasCanceladas).toBe(1);
    expect(s.estado).toBe('encerrado');
  });

  it('parar duas vezes não quebra nem duplica o cancelamento', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    s.parar();
    s.parar();
    expect(transporte.assinaturasCanceladas).toBe(1);
  });

  it('mensagem que chega depois de parar é ignorada', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    const c = ultima();
    s.parar();
    transporte.emitir({ type: 'answer', answer: 'tardia' });
    expect(c.remoteDescriptions).toHaveLength(0);
  });

  it('fechar a conexão não reentra em falha durante o encerramento', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    s.parar();
    expect(estados.filter((e) => e.estado === 'falhou')).toHaveLength(0);
  });

  it('iniciar de novo depois de parar funciona', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    s.parar();
    await s.iniciar('camera.sala');
    expect(transporte.ofertas).toHaveLength(2);
  });

  it('iniciar duas vezes seguidas não abre duas conexões', async () => {
    const s = novaSessao();
    await s.iniciar('camera.sala');
    await s.iniciar('camera.sala');
    expect(conexoes).toHaveLength(1);
  });
});
