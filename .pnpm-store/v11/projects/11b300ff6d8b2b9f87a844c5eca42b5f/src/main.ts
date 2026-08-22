import './services/performance/boot-metrics';

/**
 * Entrypoint do bundle.
 *
 * Carregado por `frontend.extra_module_url` como
 * `/local/dashboard/bruno-dashboard.<hash>.js`. O hash no nome elimina o
 * cache-bust manual por `?v=` — quando o conteúdo muda, o nome muda.
 */
import { iniciarRuntime } from './diagnostics/runtime';
iniciarRuntime();

import './legacy-runtime.generated';

import './diagnostics/bruno-diagnostics';
import './services/performance/boot-metrics';
import './lazy-runtime';
import './config/lavabo-climate.runtime';
import './themes/josh-phone-on-bridge';
import './components/rooms/bruno-room-tile';
// Compositor do bloco estatico da Home no telefone (Comodos + Favoritos +
// Em execucao). Entra pelo bundle unico: e o unico caminho de carga que o
// Lovelace em mode: storage respeita.
import './components/home/bruno-home-phone';
import { installRoomTileIosLongPressGuard } from './services/ui/ios-longpress-guard';
import './components/devices/bruno-devices-panel';

installRoomTileIosLongPressGuard();

declare const __BUILD_ID__: string;
console.info(`[bruno-dashboard] build ${__BUILD_ID__}`);

/**
 * Ponte temporária para a subview clássica de câmeras.
 * A rodada runtime-v2 moverá esta ponte para o chunk lazy de câmeras.
 */
import { MotorDeInstantaneos } from './services/camera/snapshot-engine';
import { BrunoCameraLive } from './services/camera/ha-webrtc-player';

(globalThis as { BrunoCameraEngine?: unknown }).BrunoCameraEngine = MotorDeInstantaneos;
(globalThis as { BrunoCameraLive?: unknown }).BrunoCameraLive = BrunoCameraLive;
