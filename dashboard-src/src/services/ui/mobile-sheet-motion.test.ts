import { describe, expect, it } from 'vitest';

import {
  mobileSheetExitDuration,
  mobileSheetVelocity,
  shouldDismissMobileSheet,
} from './mobile-sheet-motion';

describe('mobile sheet motion', () => {
  it('mantem a folha aberta depois de um arrasto curto e lento', () => {
    expect(shouldDismissMobileSheet({ distance: 30, velocity: 0.12, height: 520 })).toBe(false);
  });

  it('fecha por distancia proporcional', () => {
    expect(shouldDismissMobileSheet({ distance: 116, velocity: 0.12, height: 520 })).toBe(true);
  });

  it('fecha por flick sem exigir noventa pixels', () => {
    expect(shouldDismissMobileSheet({ distance: 28, velocity: 0.72, height: 520 })).toBe(true);
  });

  it('ignora flick sem deslocamento intencional', () => {
    expect(shouldDismissMobileSheet({ distance: 8, velocity: 1.1, height: 520 })).toBe(false);
  });

  it('mede apenas a janela recente da velocidade', () => {
    expect(mobileSheetVelocity([
      { y: 0, time: 0 },
      { y: 20, time: 200 },
      { y: 80, time: 280 },
    ])).toBeCloseTo(0.75, 5);
  });

  it('reduz a duracao quando a folha ja percorreu mais distancia', () => {
    const inicio = mobileSheetExitDuration({ distance: 20, velocity: 0.1, height: 520 });
    const avancado = mobileSheetExitDuration({ distance: 300, velocity: 0.1, height: 520 });
    expect(avancado).toBeLessThan(inicio);
  });
});
