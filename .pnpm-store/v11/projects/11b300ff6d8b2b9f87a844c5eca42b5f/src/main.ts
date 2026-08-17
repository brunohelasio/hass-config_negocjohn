/**
 * Entrypoint do bundle.
 *
 * Carregado por `frontend.extra_module_url` como
 * `/local/dashboard/bruno-dashboard.<hash>.js`. O hash no nome elimina o
 * cache-bust manual por `?v=` â€” quando o conteÃºdo muda, o nome muda.
 *
 * Enquanto a migraÃ§Ã£o acontece, este bundle CONVIVE com os 52 mÃ³dulos clÃ¡ssicos
 * atuais. NÃ£o substitui nada; apenas acrescenta os componentes jÃ¡ migrados.
 */
// Fase 6.0 — instrumentacao de runtime. Liga os observadores e expoe a janela
// de leitura em window.brunoRuntime. Importar os modulos do runtime NAO liga
// nada; quem liga e esta chamada, uma vez.
import { iniciarRuntime } from './diagnostics/runtime';
iniciarRuntime();

import './diagnostics/bruno-diagnostics';
import './components/rooms/bruno-room-tile';
import './components/rooms/bruno-room-subview';
// Fase 5e.6 — popup Dispositivos. Importar aqui registra o componente E os
// controles (a lista de tipos vive em components/devices/controls.ts).
import './components/devices/bruno-devices-panel';

declare const __BUILD_ID__: string;
console.info(`[bruno-dashboard] build ${__BUILD_ID__}`);

/**
 * PONTE PARA O MÓDULO LEGADO (Fase 6.2B, 2026-08-08).
 *
 * A subview de câmeras (`www/bruno-ui/subviews/bruno-cameras-security-subview.js`)
 * ainda é JS clássico — ela só será migrada na Fase 6.6. Mas é ela que o usuário
 * usa para ver as oito câmeras, e é o pior ponto que sobrou: intervalo FIXO de
 * 3 s por câmera, com carga medida de 3 a 9 s, sem prazo, sem cancelamento e sem
 * `onerror`. Oito câmeras acumulando requisições sobrepostas o tempo todo.
 *
 * Expor o motor aqui deixa o módulo legado usar a política já medida e provada no
 * cômodo — sem esperar a migração inteira daquela subview.
 *
 * É acoplamento temporário e está registrado como dívida: quando a 6.6 migrar
 * aquela subview, ela passa a importar o motor direto e esta ponte sai.
 */
import { MotorDeInstantaneos } from './services/camera/snapshot-engine';
import { BrunoCameraLive } from './services/camera/ha-webrtc-player';

(globalThis as { BrunoCameraEngine?: unknown }).BrunoCameraEngine = MotorDeInstantaneos;
(globalThis as { BrunoCameraLive?: unknown }).BrunoCameraLive = BrunoCameraLive;
