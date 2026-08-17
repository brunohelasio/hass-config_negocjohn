import type { Hass } from '@/models/home-assistant';
import { requisicaoManual } from '@/diagnostics/runtime/probe';

const PLAYER_TAG = 'ha-web-rtc-player';
const PRAZO_DEFINICAO = 6_000;
const AMOSTRA_LARGURA = 48;
const AMOSTRA_ALTURA = 27;
const INTERVALO_VIGILANCIA_QUADRO = 500;

export type PlayerWebRtc = HTMLElement & {
  entityid?: string | undefined;
  fitMode?: string | undefined;
  updateComplete?: Promise<unknown> | undefined;
};

type CardHelper = HTMLElement & { hass?: Hass | undefined };
type LovelaceHelpers = {
  createCardElement?: (config: Record<string, unknown>) => CardHelper;
};

type BrunoGlobal = typeof globalThis & {
  loadCardHelpers?: () => Promise<LovelaceHelpers>;
};

let definicaoEmCurso: Promise<boolean> | undefined;
const vigilancias = new WeakMap<PlayerWebRtc, number>();

function nomeDaCamera(entityId: string): string {
  return entityId.split('.')[1] ?? entityId;
}

/**
 * Marcador visivel no painel Bruno de diagnostico.
 *
 * Nao representa uma chamada de rede: o prefixo marco separa deliberadamente
 * estes eventos das requisicoes do motor de instantaneos.
 */
export function marcarPlayer(
  entityId: string,
  etapa: string,
  duracao = 0,
  ok = true,
): void {
  requisicaoManual(`marco: ${nomeDaCamera(entityId)} · player webrtc · ${etapa}`, duracao, ok);
}

function esperarDefinicao(): Promise<boolean> {
  if (typeof customElements === 'undefined') return Promise.resolve(false);
  if (customElements.get(PLAYER_TAG)) return Promise.resolve(true);

  return new Promise((resolve) => {
    let terminou = false;
    const encerrar = (ok: boolean) => {
      if (terminou) return;
      terminou = true;
      globalThis.clearTimeout(timer);
      resolve(ok);
    };
    const timer = globalThis.setTimeout(() => encerrar(Boolean(customElements.get(PLAYER_TAG))), PRAZO_DEFINICAO);
    void customElements.whenDefined(PLAYER_TAG).then(() => encerrar(true));
  });
}

async function carregarDefinicao(entityId: string, hass: Hass | undefined): Promise<boolean> {
  if (typeof customElements === 'undefined') return false;
  if (customElements.get(PLAYER_TAG)) return true;

  const carregarHelpers = (globalThis as BrunoGlobal).loadCardHelpers;
  if (typeof carregarHelpers !== 'function') return false;

  try {
    const helpers = await carregarHelpers();
    if (customElements.get(PLAYER_TAG)) return true;

    // ANTERIOR (rollback 2026-08-10): os consumidores consultavam somente
    // customElements.get e desistiam para sempre quando o frontend ainda nao
    // havia lazy-loaded o player. O PC frio caia nesse caminho; o WebView
    // persistente do tablet normalmente ja tinha o elemento registrado.
    //
    // createCardElement e a API suportada para pedir ao Lovelace que carregue
    // o modulo picture-entity. Esse modulo importa o caminho oficial de camera,
    // que registra ha-web-rtc-player. O card de sondagem nunca e conectado nem
    // abre stream: ele existe somente para acionar o lazy-load.
    const sonda = helpers.createCardElement?.({
      type: 'picture-entity',
      entity: entityId,
      camera_view: 'live',
      show_name: false,
      show_state: false,
    });
    if (sonda && hass) sonda.hass = hass;
    return await esperarDefinicao();
  } catch {
    return false;
  }
}

/** Garante o player mesmo numa carga fria do frontend. Chamadas concorrentes compartilham o lazy-load. */
export async function garantirPlayerWebRtc(entityId: string, hass?: Hass): Promise<boolean> {
  if (typeof customElements !== 'undefined' && customElements.get(PLAYER_TAG)) return true;

  const inicio = typeof performance !== 'undefined' ? performance.now() : Date.now();
  marcarPlayer(entityId, 'ausente; carregando modulo', 0, false);
  definicaoEmCurso ??= carregarDefinicao(entityId, hass).finally(() => {
    definicaoEmCurso = undefined;
  });
  const ok = await definicaoEmCurso;
  const fim = typeof performance !== 'undefined' ? performance.now() : Date.now();
  marcarPlayer(entityId, ok ? 'definido sob demanda' : 'definicao indisponivel', fim - inicio, ok);
  return ok;
}

/** Cria o player final do HA. O chamador ainda deve conectar, esperar updateComplete e atribuir entityid. */
export function criarPlayerWebRtc(): PlayerWebRtc | undefined {
  if (typeof customElements === 'undefined' || !customElements.get(PLAYER_TAG)) return undefined;
  const el = document.createElement(PLAYER_TAG) as PlayerWebRtc;
  el.classList.add('camera-live-el');
  el.setAttribute('muted', '');
  el.setAttribute('playsinline', '');
  el.setAttribute('autoplay', '');
  try {
    el.fitMode = 'cover';
  } catch {
    // O CSS dos tres consumidores cobre versoes do HA sem fitMode.
  }
  vigiarPlayerWebRtc(el);
  return el;
}

function pixelFortementeVerde(r: number, g: number, b: number): boolean {
  return g >= 80 && g - r >= 48 && g - b >= 48;
}

/**
 * Detecta corrupcao PARCIAL sem confundir uma arvore com defeito de decoder.
 *
 * ANTERIOR (rollback): somente a cor dominante do quadro inteiro era medida.
 * Uma faixa verde ocupando 10% a 40% da imagem ficava abaixo do limiar global
 * de 45% e chegava a tela. A amostra agora tambem e dividida em 6 x 3 blocos;
 * so ha rejeicao local quando dois blocos vizinhos sao fortemente verdes E
 * quase uniformes no mesmo cubo RGB. Folhagem variada nao satisfaz a segunda
 * condicao.
 */
function pareceBlocoVerdeParcial(
  pixels: Uint8ClampedArray,
  largura: number,
  altura: number,
): boolean {
  if (largura !== AMOSTRA_LARGURA || altura !== AMOSTRA_ALTURA) return false;
  // ANTERIOR (rollback): amostras sinteticas menores caiam na grade espacial
  // de 48 x 27; os indices ausentes viravam zero e tornavam o resultado
  // dependente da forma do buffer, nao apenas das cores. A vigilancia real
  // sempre entrega exatamente a area declarada.
  if (pixels.length !== largura * altura * 4) return false;

  const colunas = 6;
  const linhas = 3;
  const larguraBloco = largura / colunas;
  const alturaBloco = altura / linhas;
  const suspeitos = Array.from({ length: linhas }, () => Array<boolean>(colunas).fill(false));

  for (let linha = 0; linha < linhas; linha++) {
    for (let coluna = 0; coluna < colunas; coluna++) {
      const baldes = new Map<number, number>();
      let opacos = 0;
      let verdes = 0;
      let dominante = 0;
      for (let y = linha * alturaBloco; y < (linha + 1) * alturaBloco; y++) {
        for (let x = coluna * larguraBloco; x < (coluna + 1) * larguraBloco; x++) {
          const i = (y * largura + x) * 4;
          if ((pixels[i + 3] ?? 0) < 128) continue;
          const r = pixels[i] ?? 0;
          const g = pixels[i + 1] ?? 0;
          const b = pixels[i + 2] ?? 0;
          opacos++;
          if (!pixelFortementeVerde(r, g, b)) continue;
          verdes++;
          const chave = (r >> 4) | ((g >> 4) << 4) | ((b >> 4) << 8);
          const quantidade = (baldes.get(chave) ?? 0) + 1;
          baldes.set(chave, quantidade);
          dominante = Math.max(dominante, quantidade);
        }
      }
      suspeitos[linha]![coluna] =
        opacos >= 48 && verdes / opacos >= 0.82 && dominante / opacos >= 0.55;
    }
  }

  for (let linha = 0; linha < linhas; linha++) {
    for (let coluna = 0; coluna < colunas; coluna++) {
      if (!suspeitos[linha]![coluna]) continue;
      if (suspeitos[linha]![coluna + 1] || suspeitos[linha + 1]?.[coluna]) return true;
    }
  }
  return false;
}

/**
 * Detecta o defeito observado: uma grande regiao verde quase uniforme, embora
 * a imagem tenha carregado com sucesso. Folhagem real varia entre muitos tons;
 * o quadro corrompido concentra ao menos 45% da amostra no mesmo cubo RGB.
 */
export function pareceQuadroVerdeNaAmostra(
  pixels: Uint8ClampedArray,
  largura = AMOSTRA_LARGURA,
  altura = AMOSTRA_ALTURA,
): boolean {
  const baldes = new Map<number, number>();
  let opacos = 0;
  for (let i = 0; i + 3 < pixels.length; i += 4) {
    if ((pixels[i + 3] ?? 0) < 128) continue;
    const r = pixels[i] ?? 0;
    const g = pixels[i + 1] ?? 0;
    const b = pixels[i + 2] ?? 0;
    const chave = (r >> 4) | ((g >> 4) << 4) | ((b >> 4) << 8);
    baldes.set(chave, (baldes.get(chave) ?? 0) + 1);
    opacos++;
  }
  if (opacos < 32) return false;

  let dominante = 0;
  let chaveDominante = 0;
  for (const [chave, quantidade] of baldes) {
    if (quantidade <= dominante) continue;
    dominante = quantidade;
    chaveDominante = chave;
  }
  const r = (chaveDominante & 0x0f) * 16 + 8;
  const g = ((chaveDominante >> 4) & 0x0f) * 16 + 8;
  const b = ((chaveDominante >> 8) & 0x0f) * 16 + 8;
  const quadroInteiro = dominante / opacos >= 0.45 && pixelFortementeVerde(r, g, b);
  return quadroInteiro || pareceBlocoVerdeParcial(pixels, largura, altura);
}

/**
 * Continua observando o stream DEPOIS do primeiro quadro valido.
 *
 * O defeito ONVIF e eventual. O caminho anterior verificava apenas o evento de
 * carga inicial; qualquer corrupcao posterior permanecia visivel. Esta vigia e
 * deliberadamente pequena (48 x 27, uma camera primaria por tela): ao detectar
 * verde, remove apenas a classe que promove o video e revela o ultimo snapshot
 * bom que ja esta por baixo. Quando o decoder volta a produzir imagem valida,
 * o mesmo player e promovido novamente — sem reiniciar WebRTC ou alterar a
 * negociacao que hoje funciona.
 */
function vigiarPlayerWebRtc(el: PlayerWebRtc): void {
  if (vigilancias.has(el)) return;
  let ciclosDesconectado = 0;

  const verificar = () => {
    if (!el.isConnected) {
      // O render Lit recria o slot e pode desanexar o mesmo player por alguns
      // milissegundos antes de _sincronizarCameras() recoloca-lo. ANTERIOR
      // (rollback): depois do primeiro connect qualquer tick desconectado
      // encerrava a vigia definitivamente. A tolerancia de 10 s distingue esse
      // handoff normal de um player realmente descartado.
      ciclosDesconectado += 1;
      if (ciclosDesconectado >= 20) {
        vigilancias.delete(el);
        return;
      }
    } else {
      ciclosDesconectado = 0;
      const video = el.shadowRoot?.querySelector('video');
      if (video && video.readyState >= 2) {
        const verde = pareceQuadroVerde(video);
        const emQuarentena = el.hasAttribute('data-bruno-quadro-verde');
        if (verde && el.classList.contains('is-ready')) {
          el.classList.remove('is-ready');
          el.setAttribute('data-bruno-quadro-verde', '');
          marcarPlayer(el.entityid ?? 'camera.desconhecida', 'quadro verde eventual rejeitado', 0, false);
        } else if (!verde && emQuarentena) {
          el.removeAttribute('data-bruno-quadro-verde');
          el.classList.add('is-ready');
          marcarPlayer(el.entityid ?? 'camera.desconhecida', 'stream recuperado apos quadro verde');
        }
      }
    }

    const timer = globalThis.setTimeout(verificar, INTERVALO_VIGILANCIA_QUADRO);
    vigilancias.set(el, timer);
  };

  const timer = globalThis.setTimeout(verificar, INTERVALO_VIGILANCIA_QUADRO);
  vigilancias.set(el, timer);
}

/** Faz a amostragem sem bloquear o caminho quando canvas estiver indisponivel ou protegido. */
export function pareceQuadroVerde(fonte: CanvasImageSource): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = AMOSTRA_LARGURA;
    canvas.height = AMOSTRA_ALTURA;
    const contexto = canvas.getContext('2d', { willReadFrequently: true });
    if (!contexto) return false;
    contexto.drawImage(fonte, 0, 0, AMOSTRA_LARGURA, AMOSTRA_ALTURA);
    return pareceQuadroVerdeNaAmostra(
      contexto.getImageData(0, 0, AMOSTRA_LARGURA, AMOSTRA_ALTURA).data,
    );
  } catch {
    // Falha de canvas nunca deve derrubar ou bloquear uma camera valida.
    return false;
  }
}

export const BrunoCameraLive = {
  garantirPlayer: garantirPlayerWebRtc,
  criarPlayer: criarPlayerWebRtc,
  marcar: marcarPlayer,
  pareceQuadroVerde,
};
