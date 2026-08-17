/**
 * Quais câmeras usam o player ao vivo embutido (Fase 6.2B, parte 2).
 *
 * ── OFFICE LIGADO COM PLAYER WEBRTC DIRETO (2026-08-09, rev.2) ──────────
 *
 * REV.3 (Codex, 2026-08-09): o diagnostico da rev.2 registrou cinco tentativas
 * sem quadro. O gate continua somente no Office, mas o componente agora conecta
 * o player ao contexto do HA antes de atribuir a entidade, mantem o instantaneo
 * ativo e visivel ate o primeiro quadro real, encerra a tentativa em 10 s e
 * libera a sessao do tile antes de abrir o more-info.
 *
 * A rodada anterior desligou a lista porque o player embutido entregava ~12 s
 * de atraso e quebrava o more-info. O diagnostico do Codex mostrou POR QUE:
 * `hui-image cameraView="live"` monta um `ha-camera-stream`, que e um SELETOR —
 * comeca em HLS e so migra para WebRTC se a negociacao fechar. Ele ficou no HLS.
 *
 * Agora o player e o `ha-web-rtc-player` DIRETO, sem o seletor na frente. Sem
 * fase HLS e sem tentativa paralela dos dois protocolos — que era tambem o que
 * competia com o more-info.
 *
 * Rollback: esvaziar a lista. Uma linha.
 *
 * ── HISTORICO: POR QUE A LISTA JA FICOU VAZIA DUAS VEZES ────────────────
 *
 * O teste com `camera.of_camera_profile_1` (ONVIF, local) FUNCIONOU: o painel
 * registrou `ao vivo of_camera_profile_1 · stream 264px` e o relogio do tile
 * passou a avancar segundo a segundo. Nao e questao de nao funcionar.
 *
 * O saldo e que e ruim, e por dois motivos medidos:
 *
 *   1. **Atraso de ~10 s no tile.** Medido pelos dois relogios na mesma tela:
 *      more-info 10:46:45, tile 10:46:33. O `hui-image` no tile cai para HLS,
 *      com buffer de segmentos; o more-info negocia sem buffer.
 *   2. **Quebra o more-info.** O tile passa a segurar um stream PERMANENTE da
 *      camera. Ao abrir o more-info, o HA pede um segundo stream da mesma
 *      fonte — e ela nao serve dois. O more-info parou de renderizar.
 *
 * Ou seja: custa um stream permanente para entregar imagem atrasada, e cobra
 * o unico lugar onde o tempo real estava funcionando. Nao compensa.
 *
 * O QUE FICA: o tile mostra a foto (agora em **1,3 s**, contra 3-9 s antes da
 * troca para ONVIF) e tocar nele abre o more-info em tempo real. E o melhor
 * arranjo que a medicao suporta hoje.
 *
 * PARA RELIGAR: acrescentar o id aqui. So faz sentido se um dia o tile puder
 * ceder o stream ao more-info ao inves de disputar com ele.
 *
 * ── HISTORICO: POR QUE A LISTA FICOU VAZIA ──────────────────────────────
 *
 * O player ao vivo embutido foi DESLIGADO em 2026-08-07. O motivo não é que ele
 * quebre: é que **ele não entrega o que se queria dele**, e cobra por isso.
 *
 * O relato do usuário contém o dado decisivo: no `more-info` o relógio da câmera
 * *"passou a avançar continuamente"*, mas *"a imagem apresenta um delay
 * significativo... ao acender ou apagar uma luz... a ação demora para aparecer"*.
 *
 * Vídeo contínuo e liso, porém atrasado, é a assinatura do **HLS**. O componente
 * `stream` do Home Assistant corta a transmissão em segmentos e o player só
 * começa depois de encher o buffer — daí a fluidez com 6 a 10 s de atraso.
 * WebRTC ficaria abaixo de 1 s. Confere com a outra medição desta fase: minha
 * negociação WebRTC direta falhou 3 de 3 vezes.
 *
 * Do lado do servidor a explicação fecha: **não há `go2rtc.yaml` nesta
 * instalação**, e as câmeras vêm da `xtend_tuya` (nuvem da Tuya). O caminho é
 * nuvem -> `stream` -> HLS. O SmartLife é rápido porque fala direto com a
 * câmera por protocolo próprio.
 *
 * ── POR QUE DESLIGAR, E NÃO INSISTIR ────────────────────────────────────
 *
 * No ladrilho do cômodo o player embutido nem chegava a assumir — o usuário
 * media ~9 s entre imagens, que é a cadência do instantâneo. Ou seja: ele
 * custava negociação, instabilidade e "às vezes não renderiza", sem entregar
 * tempo real. O instantâneo, medido, está saudável: zero falhas nas oito
 * câmeras, 3,9 a 9,3 s até aparecer.
 *
 * O que permanece: tocar na câmera abre o `more-info` do HA, com o player dele.
 * Isso o usuário aprovou e não depende desta lista.
 *
 * ── PARA RELIGAR ────────────────────────────────────────────────────────
 *
 * Acrescentar o id da câmera aqui. Faz sentido DEPOIS de existir go2rtc com
 * fonte RTSP local — aí o caminho passa a ser WebRTC de verdade e o atraso cai
 * para menos de um segundo. Antes disso, religar só recria o mesmo sintoma.
 *
 *     export const CAMERAS_WEBRTC: readonly string[] = ['camera.sl_camera_2'];
 */
export const CAMERAS_WEBRTC: readonly string[] = ['camera.of_camera_profile_1'];

export function usaWebRtc(entityId: string | undefined): boolean {
  return Boolean(entityId) && CAMERAS_WEBRTC.includes(entityId as string);
}
