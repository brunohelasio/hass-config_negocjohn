export interface MobileSheetSample {
  /** Posicao no eixo ativo: Y nas bottom sheets e X nas side sheets. */
  position: number;
  time: number;
}

export interface MobileSheetRelease {
  distance: number;
  velocity: number;
  /** Dimensao da folha no eixo ativo. */
  size: number;
}

/**
 * Contrato unico das folhas no telefone e no tablet.
 *
 * A distancia continua proporcional a folha, mas exige um deslocamento
 * realmente intencional. Um flick pode fechar, desde que a superficie ja tenha
 * percorrido uma faixa tactil relevante; velocidade sozinha nunca recolhe a
 * folha. O mesmo calculo vale para Y (bottom sheet) e X (side sheet).
 */
export function shouldDismissMobileSheet(release: MobileSheetRelease): boolean {
  const size = Math.max(1, release.size);
  // ANTERIOR (rollback gesto tipo mola 2026-09-01):
  // min(132, max(72, size * 0.22)), com flick liberado a partir de 18px.
  const threshold = Math.min(220, Math.max(96, size * 0.29));
  const flickDistance = Math.min(72, Math.max(56, threshold * 0.42));
  const distance = Math.max(0, release.distance);
  const velocity = Math.max(0, release.velocity);
  return distance >= threshold || (distance >= flickDistance && velocity >= 0.9);
}

/** Velocidade no eixo ativo em px/ms usando somente a janela recente. */
export function mobileSheetVelocity(samples: readonly MobileSheetSample[]): number {
  if (samples.length < 2) return 0;
  const latest = samples.at(-1)!;
  const cutoff = latest.time - 120;
  const oldest = samples.find((sample) => sample.time >= cutoff) ?? samples[0]!;
  const elapsed = latest.time - oldest.time;
  if (elapsed <= 0) return 0;
  return Math.max(0, (latest.position - oldest.position) / elapsed);
}

/**
 * Duracao do trecho restante. A folha nunca reinicia do topo: quanto mais ela
 * ja acompanhou o dedo, menor e o percurso final ate sair da viewport.
 */
export function mobileSheetExitDuration(release: MobileSheetRelease): number {
  const size = Math.max(1, release.size);
  const remaining = Math.max(0, size - Math.max(0, release.distance));
  const progress = Math.min(1, remaining / size);
  const velocity = Math.max(0, release.velocity);
  const durationFromProgress = 135 + progress * 105;
  const velocityDiscount = Math.min(55, velocity * 44);
  return Math.round(Math.min(250, Math.max(130, durationFromProgress - velocityDiscount)));
}
