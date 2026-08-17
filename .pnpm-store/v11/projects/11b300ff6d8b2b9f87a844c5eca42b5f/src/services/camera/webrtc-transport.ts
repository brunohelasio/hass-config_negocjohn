/**
 * O transporte WebRTC sobre o WebSocket do Home Assistant (Fase 6.2B parte 2).
 *
 * Separado de `webrtc-session.ts` de propósito: a sessão contém o protocolo, que
 * é testável; este arquivo contém o acoplamento com o HA, que não é. Mantendo os
 * dois apartados, a parte que dá para provar fica provada, e a parte que só o
 * aparelho valida fica pequena e à vista.
 *
 * Se o Home Assistant desta instalação não tiver os comandos, `criarTransporte`
 * devolve `undefined` e o dashboard segue no instantâneo, sem erro na tela.
 */

import type { Hass } from '@/models/home-assistant';

import type { MensagemWebRtc, TransporteWebRtc } from './webrtc-session';

export function criarTransporte(hass: Hass | undefined): TransporteWebRtc | undefined {
  const conexao = hass?.connection;
  if (!conexao?.subscribeMessage) return undefined;

  return {
    oferecer(entityId, offer, aoReceber) {
      return conexao.subscribeMessage<MensagemWebRtc>(aoReceber, {
        type: 'camera/webrtc/offer',
        entity_id: entityId,
        offer,
      });
    },

    async enviarCandidato(entityId, sessionId, candidate) {
      await hass?.callWS?.({
        type: 'camera/webrtc/candidate',
        entity_id: entityId,
        session_id: sessionId,
        candidate,
      });
    },

    async configuracao(entityId) {
      try {
        const r = await hass?.callWS?.<{ configuration?: RTCConfiguration }>({
          type: 'camera/webrtc/get_client_config',
          entity_id: entityId,
        });
        return r?.configuration;
      } catch {
        // Instalação sem servidores ICE publicados: em rede local a conexão
        // costuma fechar mesmo assim, com candidatos de host.
        return undefined;
      }
    },
  };
}
