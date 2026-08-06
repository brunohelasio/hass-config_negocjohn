/**
 * Os pontos de coleta — o que efetivamente instrumenta os componentes.
 *
 * A tentativa anterior desta fase entregou o depósito e os contadores, mas
 * **nenhum ponto de coleta ligado**: a biblioteca existia e ninguém a chamava.
 * Este arquivo é o que faz a instrumentação acontecer, e ele é usado de verdade
 * por `bruno-room-subview`, `bruno-room-tile` e `bruno-devices-panel`.
 *
 * O desenho evita o erro clássico de instrumentação: **medir custa**. Por isso
 * o custo por evento é uma soma num objeto já alocado — sem criar array, sem
 * `Error().stack`, sem `JSON`, sem procurar em lista.
 */

import { coletor } from './collector';

/**
 * Timers com dono.
 *
 * O motivo de existir: um `setInterval` esquecido é o vazamento mais comum e o
 * mais difícil de ver. Aqui todo timer nasce com nome de componente e é contado
 * na criação e no encerramento; a diferença aparece em `vazamentos.timers`.
 *
 * Guarda o tipo junto do id porque `clearInterval` e `clearTimeout` não são
 * intercambiáveis em toda plataforma — a versão anterior chamava os dois no
 * mesmo id, no escuro.
 */
const tiposDeTimer = new Map<number, 'intervalo' | 'espera'>();

export function intervalo(dono: string, fn: () => void, ms: number): number {
  // A regra existe para impedir timer solto em componente. ESTE arquivo e o
  // invólucro que a torna verificavel: todo timer nasce com dono e e contado.
  // eslint-disable-next-line no-restricted-syntax
  const id = window.setInterval(fn, ms);
  tiposDeTimer.set(id, 'intervalo');
  coletor.timerCriado(dono);
  return id;
}

export function espera(dono: string, fn: () => void, ms: number): number {
  const id = window.setTimeout(() => {
    // Um timeout se encerra sozinho ao disparar: contabiliza aqui, senão ele
    // apareceria como vazamento eterno.
    tiposDeTimer.delete(id);
    coletor.timerEncerrado(dono);
    fn();
  }, ms);
  tiposDeTimer.set(id, 'espera');
  coletor.timerCriado(dono);
  return id;
}

/** Encerra um timer criado aqui. Ignora id desconhecido — nada a contar. */
export function encerrarTimer(dono: string, id: number | undefined): void {
  if (id === undefined) return;
  const tipo = tiposDeTimer.get(id);
  if (tipo === undefined) return;
  if (tipo === 'intervalo') window.clearInterval(id);
  else window.clearTimeout(id);
  tiposDeTimer.delete(id);
  coletor.timerEncerrado(dono);
}

/** Quantos timers estão vivos agora — usado nos testes e no painel. */
export function timersVivos(): number {
  return tiposDeTimer.size;
}

// ── Listeners ───────────────────────────────────────────────────────────────

export function ouvir(
  dono: string,
  alvo: EventTarget,
  evento: string,
  fn: EventListenerOrEventListenerObject,
  opcoes?: AddEventListenerOptions,
): void {
  alvo.addEventListener(evento, fn, opcoes);
  coletor.listenerCriado(dono);
}

export function pararDeOuvir(
  dono: string,
  alvo: EventTarget,
  evento: string,
  fn: EventListenerOrEventListenerObject,
  opcoes?: EventListenerOptions,
): void {
  alvo.removeEventListener(evento, fn, opcoes);
  coletor.listenerEncerrado(dono);
}

// ── Assinaturas (WebSocket do HA, observers, etc.) ──────────────────────────

export function assinou(dono: string): void {
  coletor.assinou(dono);
}

export function desassinou(dono: string): void {
  coletor.desassinou(dono);
}

// ── Requisições ─────────────────────────────────────────────────────────────

/**
 * `fetch` com dono.
 *
 * Mede duração e sucesso. Não substitui o `fetch` global de propósito: trocar o
 * global mediria também o que o próprio Home Assistant faz, e a baseline
 * ficaria impossível de atribuir.
 */
export async function buscar(dono: string, entrada: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const t0 = performance.now();
  try {
    const resposta = await fetch(entrada, init);
    coletor.requisicao(dono, performance.now() - t0, resposta.ok);
    return resposta;
  } catch (erro) {
    coletor.requisicao(dono, performance.now() - t0, false);
    throw erro;
  }
}

/** Registra manualmente uma requisição que não passou por `buscar` (ex.: `<img>`). */
export function requisicaoManual(dono: string, duracao: number, ok: boolean): void {
  coletor.requisicao(dono, duracao, ok);
}

// ── Ciclo de vida e render ──────────────────────────────────────────────────

export function conectou(dono: string): void {
  coletor.conectou(dono);
}

export function desconectou(dono: string): void {
  coletor.desconectou(dono);
}

/**
 * Mede um render.
 *
 * Uso: chamar no `update()` do componente, envolvendo `super.update()`. É ali
 * que o Lit constrói e aplica o DOM — medir no `render()` mediria só a montagem
 * do template, que é a parte barata.
 */
export function medirRender<T>(dono: string, fn: () => T): T {
  const t0 = performance.now();
  try {
    return fn();
  } finally {
    coletor.renderizou(dono, performance.now() - t0);
  }
}
