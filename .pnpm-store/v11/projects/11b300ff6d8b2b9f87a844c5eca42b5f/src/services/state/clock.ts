/**
 * Relógio central (Fase 6.1).
 *
 * O PROBLEMA: cada módulo que mostra hora, ou "ligado há 2h", criava o próprio
 * `setInterval`. São relógios independentes, desalinhados entre si, e cada um é
 * um vazamento em potencial se o `disconnectedCallback` esquecer de limpá-lo.
 *
 * A TROCA: um único intervalo para todos os assinantes. Sem assinante, ele não
 * existe — o timer é criado no primeiro `assinar` e destruído no último
 * `cancelar`. Isso torna o vazamento impossível por construção: não há timer
 * sobrando porque não há timer sem quem o use.
 *
 * SUSPENSÃO. Este dashboard vive num tablet de parede, cuja tela apaga. Um
 * relógio contando para ninguém é trabalho puro perdido, e pior: acorda a CPU.
 * Com a aba oculta o intervalo é desligado; ao voltar, dispara uma vez na hora
 * (a tela pode ter ficado apagada dez minutos) e volta a contar.
 *
 * O período é o segundo cheio, alinhado ao relógio da parede: quem mostra
 * `14:07` deve virar para `14:08` junto com o relógio de verdade, não 340 ms
 * depois.
 */

type Assinante = () => void;

const assinantes = new Set<Assinante>();

interface EstadoDoRelogio {
  timer: number | undefined;
  ouvindoVisibilidade: boolean;
}

const estado: EstadoDoRelogio = { timer: undefined, ouvindoVisibilidade: false };

/** Intervalo entre batidas. Um segundo é o menor passo que a tela mostra. */
const PERIODO = 1000;

function bater(): void {
  // Cópia: um assinante pode cancelar durante a própria batida, e mexer no Set
  // enquanto se itera sobre ele é como o relógio pararia sozinho.
  for (const fn of [...assinantes]) {
    try {
      fn();
    } catch {
      // Um assinante quebrado não pode parar o relógio dos outros.
    }
  }
}

function oculto(): boolean {
  return typeof document !== 'undefined' && document.visibilityState === 'hidden';
}

function ligar(): void {
  if (estado.timer !== undefined || assinantes.size === 0 || oculto()) return;
  // Este é o único timer periódico de relógio do dashboard; ele nasce e morre
  // junto com a lista de assinantes, que é o que a regra quer garantir.
  // eslint-disable-next-line no-restricted-syntax
  estado.timer = globalThis.setInterval(bater, PERIODO);
}

function desligar(): void {
  if (estado.timer === undefined) return;
  globalThis.clearInterval(estado.timer);
  estado.timer = undefined;
}

function aoMudarVisibilidade(): void {
  if (oculto()) {
    desligar();
    return;
  }
  // Voltou à tona: a tela está com a hora de quando apagou. Atualiza já, e só
  // depois retoma o ritmo.
  if (assinantes.size > 0) {
    bater();
    ligar();
  }
}

function observarVisibilidade(): void {
  if (estado.ouvindoVisibilidade || typeof document === 'undefined') return;
  document.addEventListener('visibilitychange', aoMudarVisibilidade);
  estado.ouvindoVisibilidade = true;
}

/**
 * Assina o relógio. Devolve a função que cancela.
 *
 * Devolver o cancelador em vez de exigir `cancelar(fn)` evita o erro mais comum
 * nesse padrão: guardar a referência errada e nunca conseguir cancelar.
 */
export function assinarRelogio(fn: Assinante): () => void {
  assinantes.add(fn);
  observarVisibilidade();
  ligar();

  let cancelado = false;
  return () => {
    if (cancelado) return;
    cancelado = true;
    assinantes.delete(fn);
    if (assinantes.size === 0) desligar();
  };
}

/** Quantos módulos dependem do relógio agora. Para o painel e para os testes. */
export function assinantesDoRelogio(): number {
  return assinantes.size;
}

/** O intervalo existe agora? Zero assinantes ou aba oculta devem dar `false`. */
export function relogioAtivo(): boolean {
  return estado.timer !== undefined;
}

/** Desmonta tudo. Existe para os testes; em produção o último cancelar basta. */
export function pararRelogio(): void {
  assinantes.clear();
  desligar();
  if (estado.ouvindoVisibilidade && typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', aoMudarVisibilidade);
    estado.ouvindoVisibilidade = false;
  }
}
