/**
 * Sondagem da capacidade real das câmeras (Fase 6.0.5).
 *
 * A pergunta que precisa de resposta ANTES de escrever qualquer player:
 * **este Home Assistant consegue WebRTC, ou o único caminho é HLS
 * transcodificado na VM?**
 *
 * Por que isso decide a fase seguinte: são 8 câmeras Tuya via Xtend. Tuya não
 * expõe WebRTC nativamente; sem go2rtc no meio, o caminho é RTSP → `stream` →
 * HLS, e a transcodificação roda **na VM**, que já é o gargalo. Duas câmeras ao
 * vivo por subview, com navegação entre cômodos, viraria carga contínua.
 *
 * Isto é investigação, não player. Só lê o que o HA já publica.
 *
 * O sinal decisivo é `frontend_stream_type` no atributo da entidade:
 *
 *   'web_rtc'  -> o frontend negocia WebRTC direto. Baixa latência, sem transcodificar.
 *   'hls'      -> o componente `stream` monta HLS. Transcodifica na VM.
 *   ausente    -> a câmera só oferece instantâneo.
 */

import type { Hass } from '@/models/home-assistant';

export type CaminhoDeVideo = 'web_rtc' | 'hls' | 'instantaneo' | 'indisponivel';

export interface CapacidadeDeCamera {
  entityId: string;
  nome: string;
  estado: string;
  caminho: CaminhoDeVideo;
  /** `supported_features` da entidade; bit 2 = STREAM. */
  suportaStream: boolean;
}

export interface SondagemDeCameras {
  /** O componente `stream` está carregado? Sem ele não há HLS nem WebRTC. */
  streamCarregado: boolean;
  cameras: CapacidadeDeCamera[];
  resumo: Record<CaminhoDeVideo, number>;
  /** Leitura em uma linha, para o painel. */
  veredito: string;
}

/** Bit de `supported_features` de `camera` que indica suporte a stream. */
const RECURSO_STREAM = 2;

function caminhoDe(atributos: Record<string, unknown>, estado: string): CaminhoDeVideo {
  if (['unavailable', 'unknown'].includes(estado)) return 'indisponivel';
  const tipo = String(atributos['frontend_stream_type'] ?? '');
  if (tipo === 'web_rtc') return 'web_rtc';
  if (tipo === 'hls') return 'hls';
  return 'instantaneo';
}

/**
 * Sonda todas as câmeras conhecidas pelo Home Assistant.
 *
 * Puro: recebe o `hass` e devolve o retrato. Sem rede, sem efeito — dá para
 * testar e dá para rodar no painel a qualquer momento.
 */
/**
 * Sondagem PROFUNDA, pela API do Home Assistant.
 *
 * A leitura por atributo (`sondarCameras`) ficou INCONCLUSIVA neste HA: as 8
 * cameras declaram o bit de STREAM em `supported_features`, mas nao publicam
 * `frontend_stream_type` como atributo de estado. Em versoes recentes esse dado
 * saiu do estado e passou a ser respondido pelo WebSocket, em
 * `camera/capabilities`.
 *
 * Sem isto, a decisao da Fase 6.2B seria tomada no escuro: "declara stream" nao
 * diz se o caminho e WebRTC (barato, sem transcodificar) ou HLS (transcodifica
 * na VM, que ja e o gargalo).
 *
 * Falha em silencio e devolve a sondagem rasa — um painel de diagnostico que
 * quebra a tela nao diagnostica nada.
 */
export async function sondarCamerasProfundo(hass: Hass | undefined): Promise<SondagemDeCameras> {
  const raso = sondarCameras(hass);
  const chamar = hass?.callWS;
  if (!chamar || !raso.cameras.length) return raso;

  const cameras = await Promise.all(
    raso.cameras.map(async (c) => {
      if (c.caminho === 'indisponivel') return c;
      try {
        const cap = await chamar<{ frontend_stream_types?: string[] }>({
          type: 'camera/capabilities',
          entity_id: c.entityId,
        });
        const tipos = cap?.frontend_stream_types ?? [];
        if (tipos.includes('web_rtc')) return { ...c, caminho: 'web_rtc' as const };
        if (tipos.includes('hls')) return { ...c, caminho: 'hls' as const };
        return c;
      } catch {
        // Comando ausente nesta versao, ou camera sem resposta: fica o que a
        // leitura por atributo disse.
        return c;
      }
    }),
  );

  const resumo: Record<CaminhoDeVideo, number> = {
    web_rtc: 0, hls: 0, instantaneo: 0, indisponivel: 0,
  };
  for (const c of cameras) resumo[c.caminho]++;

  return {
    streamCarregado: raso.streamCarregado,
    cameras,
    resumo,
    veredito: vereditoDe(resumo, cameras.length, raso.streamCarregado),
  };
}

export function sondarCameras(hass: Hass | undefined): SondagemDeCameras {
  const vazio: SondagemDeCameras = {
    streamCarregado: false,
    cameras: [],
    resumo: { web_rtc: 0, hls: 0, instantaneo: 0, indisponivel: 0 },
    veredito: 'Sem hass — nada a sondar.',
  };
  if (!hass) return vazio;

  const cameras: CapacidadeDeCamera[] = [];
  for (const [entityId, estado] of Object.entries(hass.states)) {
    if (!entityId.startsWith('camera.')) continue;
    // `hass.states` é indexado por texto: o TypeScript não garante que o valor
    // exista, mesmo vindo de `Object.entries`. Sem esta guarda, uma entidade
    // apagada entre o snapshot e a leitura derrubaria o painel.
    if (!estado) continue;
    const atributos = estado.attributes ?? {};
    const recursos = Number(atributos['supported_features'] ?? 0);
    cameras.push({
      entityId,
      nome: String(atributos['friendly_name'] ?? entityId),
      estado: String(estado.state),
      caminho: caminhoDe(atributos, String(estado.state)),
      suportaStream: (recursos & RECURSO_STREAM) !== 0,
    });
  }
  cameras.sort((a, b) => a.entityId.localeCompare(b.entityId));

  const resumo: Record<CaminhoDeVideo, number> = {
    web_rtc: 0, hls: 0, instantaneo: 0, indisponivel: 0,
  };
  for (const c of cameras) resumo[c.caminho]++;

  // O componente `stream` publica entidades próprias? A leitura mais confiável
  // sem chamar a API é: alguma câmera declara suporte a stream.
  const streamCarregado = cameras.some((c) => c.suportaStream);

  return {
    streamCarregado,
    cameras,
    resumo,
    veredito: vereditoDe(resumo, cameras.length, streamCarregado),
  };
}

function vereditoDe(
  resumo: Record<CaminhoDeVideo, number>,
  total: number,
  streamCarregado: boolean,
): string {
  if (total === 0) return 'Nenhuma câmera encontrada.';
  if (resumo.web_rtc > 0) {
    return `${resumo.web_rtc} de ${total} com WebRTC — vale medir stream nessas.`;
  }
  if (resumo.hls > 0) {
    return (
      `${resumo.hls} de ${total} só com HLS. A transcodificação roda na VM: ` +
      'stream só se a medição provar que compensa, e uma câmera por vez.'
    );
  }
  if (!streamCarregado) {
    return 'Nenhuma câmera declara suporte a stream — o instantâneo é o único caminho.';
  }
  return 'Câmeras com stream declarado, mas sem tipo publicado — sondar de novo com o painel aberto.';
}
