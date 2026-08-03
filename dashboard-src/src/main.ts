/**
 * Entrypoint do bundle.
 *
 * Carregado por `frontend.extra_module_url` como
 * `/local/dashboard/bruno-dashboard.<hash>.js`. O hash no nome elimina o
 * cache-bust manual por `?v=` — quando o conteúdo muda, o nome muda.
 *
 * Enquanto a migração acontece, este bundle CONVIVE com os 52 módulos clássicos
 * atuais. Não substitui nada; apenas acrescenta os componentes já migrados.
 */
import './diagnostics/bruno-diagnostics';

declare const __BUILD_ID__: string;
console.info(`[bruno-dashboard] build ${__BUILD_ID__}`);
