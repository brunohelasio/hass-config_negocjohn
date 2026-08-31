export interface MobileSheetSample {
  y: number;
  time: number;
}

export interface MobileSheetRelease {
  distance: number;
  velocity: number;
  height: number;
}

/**
 * Contrato unico das bottom sheets no telefone.
 *
 * A distancia continua proporcional a folha, mas permanece numa faixa que
 * funciona tanto no Hub compacto quanto na Iluminacao mais alta. Um flick
 * curto tambem pode fechar, desde que ja exista deslocamento intencional.
 */
export function shouldDismissMobileSheet(release: MobileSheetRelease): boolean {
  const height = Math.max(1, release.height);
  const threshold = Math.min(132, Math.max(72, height * 0.22));
  const distance = Math.max(0, release.distance);
  const velocity = Math.max(0, release.velocity);
  return distance >= threshold || (distance >= 18 && velocity >= 0.55);
}

/** Velocidade vertical em px/ms usando somente a janela recente do gesto. */
export function mobileSheetVelocity(samples: readonly MobileSheetSample[]): number {
  if (samples.length < 2) return 0;
  const latest = samples.at(-1)!;
  const cutoff = latest.time - 120;
  const oldest = samples.find((sample) => sample.time >= cutoff) ?? samples[0]!;
  const elapsed = latest.time - oldest.time;
  if (elapsed <= 0) return 0;
  return Math.max(0, (latest.y - oldest.y) / elapsed);
}

/**
 * Duracao do trecho restante. A folha nunca reinicia do topo: quanto mais ela
 * ja acompanhou o dedo, menor e o percurso final ate sair da viewport.
 */
export function mobileSheetExitDuration(release: MobileSheetRelease): number {
  const height = Math.max(1, release.height);
  const remaining = Math.max(0, height - Math.max(0, release.distance));
  const progress = Math.min(1, remaining / height);
  const velocity = Math.max(0, release.velocity);
  const durationFromProgress = 135 + progress * 105;
  const velocityDiscount = Math.min(55, velocity * 44);
  return Math.round(Math.min(250, Math.max(130, durationFromProgress - velocityDiscount)));
}
