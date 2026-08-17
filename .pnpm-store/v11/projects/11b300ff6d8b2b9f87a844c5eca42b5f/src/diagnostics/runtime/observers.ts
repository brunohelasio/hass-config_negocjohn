/**
 * Observadores do ambiente: memória e tarefas longas.
 *
 * Separado de `collector.ts` porque isto precisa de navegador — e porque o
 * coletor tem de continuar testável em Node.
 *
 * **Nada aqui roda por importar o arquivo.** Quem liga é `iniciarObservadores()`,
 * chamado uma vez pelo ponto de entrada do bundle. A tentativa anterior desta
 * fase criava um `setInterval` no escopo do módulo e nunca o limpava; um módulo
 * cuja função é achar vazamento não pode ser a origem de um.
 */

import { coletor } from './collector';

/** Intervalo entre amostras de memória. 5s cobre uma hora em 720 amostras. */
const PERIODO_MEMORIA = 5000;

/** Acima disto o navegador considera a tarefa longa; é o limiar da própria API. */
export const LIMIAR_TAREFA_LONGA = 50;

interface Ligado {
  timerMemoria: number | undefined;
  observador: PerformanceObserver | undefined;
}

const estado: Ligado = { timerMemoria: undefined, observador: undefined };

interface MemoriaDoChrome {
  usedJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Leitura de memória.
 *
 * `performance.memory` é do Chrome — e a WebView do tablet é Chrome 150, então
 * existe lá. Em outro navegador devolve `undefined` e o painel mostra "sem
 * leitura", em vez de fingir um número.
 */
export function lerMemoria(): { usado: number; limite: number } | undefined {
  const p = performance as Performance & { memory?: MemoriaDoChrome };
  if (!p.memory) return undefined;
  return { usado: p.memory.usedJSHeapSize, limite: p.memory.jsHeapSizeLimit };
}

/**
 * Liga a coleta de ambiente. Idempotente: chamar duas vezes não duplica nada.
 *
 * `build` entra no instantâneo para que duas medições nunca sejam comparadas
 * sem se saber de que versão cada uma veio.
 */
export function iniciarObservadores(build: string): void {
  if (estado.timerMemoria !== undefined || estado.observador !== undefined) return;

  coletor.iniciar(performance.now(), build);

  const amostrar = () => {
    const m = lerMemoria();
    if (m) coletor.memoriaAmostrada({ em: Math.round(performance.now()), ...m });
  };
  amostrar(); // a primeira amostra é a referência do crescimento
  // Nao ha estado do hass que sirva: memoria e do processo, nao da casa. O id
  // fica guardado em `estado` e `pararObservadores()` o limpa.
  // eslint-disable-next-line no-restricted-syntax
  estado.timerMemoria = window.setInterval(amostrar, PERIODO_MEMORIA);

  if ('PerformanceObserver' in window) {
    try {
      const obs = new PerformanceObserver((lista) => {
        for (const entrada of lista.getEntries()) {
          coletor.tarefaLonga({
            em: Math.round(entrada.startTime),
            duracao: Math.round(entrada.duration),
          });
        }
      });
      // `longtask` não existe em todo navegador; o try/catch é o teste.
      obs.observe({ entryTypes: ['longtask'] });
      estado.observador = obs;
    } catch {
      // Sem suporte: o painel mostra zero tarefas longas, o que é honesto —
      // não foram observadas, e não que não existiram.
    }
  }
}

/** Desliga tudo. Existe para os testes e para o rollback em runtime. */
export function pararObservadores(): void {
  if (estado.timerMemoria !== undefined) {
    window.clearInterval(estado.timerMemoria);
    estado.timerMemoria = undefined;
  }
  estado.observador?.disconnect();
  estado.observador = undefined;
}

export function observadoresLigados(): boolean {
  return estado.timerMemoria !== undefined;
}
