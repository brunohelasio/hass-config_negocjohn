/**
 * Ponto de entrada do runtime instrumentado (Fase 6.0).
 *
 * Liga os observadores e expõe uma janela de leitura no `window`, para que a
 * baseline possa ser colhida **no tablet** — que é onde ela vale. O harness do
 * computador não reproduz a WebView, a memória do aparelho nem a CPU da VM.
 *
 * No console do tablet (ou por USB debugging):
 *
 *     brunoRuntime.instantaneo()   // objeto
 *     brunoRuntime.texto()         // JSON pronto para copiar
 *     brunoRuntime.zerar()         // recomeça a medição
 *
 * E, sem console, pelo painel de diagnóstico — que é o caminho previsto.
 */

import { coletor, type InstantaneoDeRuntime } from './collector';
import { iniciarObservadores, observadoresLigados } from './observers';
import { timersVivos } from './probe';

export * from './collector';
export * from './probe';
export * from './observers';

/**
 * Identificação do build.
 *
 * Sai do nome do próprio arquivo do bundle, que carrega o hash de conteúdo do
 * Vite. Sem isso, duas medições de versões diferentes seriam comparadas sem que
 * ninguém percebesse.
 */
function identificarBuild(): string {
  try {
    const url = import.meta.url;
    const nome = url.slice(url.lastIndexOf('/') + 1);
    return nome || 'desconhecido';
  } catch {
    return 'desconhecido';
  }
}

export interface JanelaDeRuntime {
  instantaneo(): InstantaneoDeRuntime & { timersVivos: number };
  texto(): string;
  zerar(): void;
}

function instantaneo(): InstantaneoDeRuntime & { timersVivos: number } {
  return { ...coletor.instantaneo(performance.now()), timersVivos: timersVivos() };
}

/**
 * Liga a instrumentação. Idempotente.
 *
 * Chamado uma vez por `main.ts`. Importar qualquer módulo do runtime NÃO liga
 * nada — ver a nota em `observers.ts` sobre a tentativa anterior, que criava um
 * intervalo no escopo do módulo e nunca o limpava.
 */
export function iniciarRuntime(): void {
  if (observadoresLigados()) return;
  iniciarObservadores(identificarBuild());

  const janela: JanelaDeRuntime = {
    instantaneo,
    texto: () => JSON.stringify(instantaneo(), null, 2),
    zerar: () => coletor.zerar(),
  };
  (globalThis as { brunoRuntime?: JanelaDeRuntime }).brunoRuntime = janela;
}

export { instantaneo };
