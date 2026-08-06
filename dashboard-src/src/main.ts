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
