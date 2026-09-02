import { describe, expect, it } from 'vitest';

import {
  mobileSheetExitDuration,
  mobileSheetVelocity,
  shouldDismissMobileSheet,
} from './mobile-sheet-motion';

describe('mobile sheet motion', () => {
  it('mantem a folha aberta depois de um arrasto curto e lento', () => {
    expect(shouldDismissMobileSheet({ distance: 30, velocity: 0.12, size: 520 })).toBe(false);
  });

  it('fecha por distancia proporcional', () => {
    expect(shouldDismissMobileSheet({ distance: 151, velocity: 0.12, size: 520 })).toBe(true);
  });

  it('nao fecha por flick curto, mesmo com velocidade alta', () => {
    expect(shouldDismissMobileSheet({ distance: 28, velocity: 1.2, size: 520 })).toBe(false);
  });

  it('fecha por flick somente depois de deslocamento intencional', () => {
    expect(shouldDismissMobileSheet({ distance: 64, velocity: 1.05, size: 520 })).toBe(true);
  });

  it('usa o mesmo limiar proporcional no eixo horizontal da side sheet', () => {
    expect(shouldDismissMobileSheet({ distance: 180, velocity: 0.2, size: 780 })).toBe(false);
    expect(shouldDismissMobileSheet({ distance: 226.2, velocity: 0.2, size: 780 })).toBe(true);
  });

  it('mede apenas a janela recente da velocidade', () => {
    expect(mobileSheetVelocity([
      { position: 0, time: 0 },
      { position: 20, time: 200 },
      { position: 80, time: 280 },
    ])).toBeCloseTo(0.75, 5);
  });

  it('reduz a duracao quando a folha ja percorreu mais distancia', () => {
    const inicio = mobileSheetExitDuration({ distance: 20, velocity: 0.1, size: 520 });
    const avancado = mobileSheetExitDuration({ distance: 300, velocity: 0.1, size: 520 });
    expect(avancado).toBeLessThan(inicio);
  });
});
