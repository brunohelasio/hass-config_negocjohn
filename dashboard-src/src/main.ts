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
import './diagnostics/bruno-diagnostics';
import './components/rooms/bruno-room-tile';
import './components/rooms/bruno-room-subview';

declare const __BUILD_ID__: string;
console.info(`[bruno-dashboard] build ${__BUILD_ID__}`);
