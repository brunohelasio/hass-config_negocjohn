import { describe, expect, it } from 'vitest';
import { pareceQuadroVerdeNaAmostra } from './ha-webrtc-player';

function pixels(cores: readonly [number, number, number][]): Uint8ClampedArray {
  return new Uint8ClampedArray(cores.flatMap(([r, g, b]) => [r, g, b, 255]));
}

describe('quarentena de quadro verde', () => {
  it('rejeita a faixa verde uniforme observada nas cameras', () => {
    const verde = Array.from({ length: 70 }, () => [0, 160, 0] as [number, number, number]);
    const cena = Array.from({ length: 30 }, (_, i) => [80 + i, 75 + (i % 20), 60 + i] as [number, number, number]);
    expect(pareceQuadroVerdeNaAmostra(pixels([...verde, ...cena]))).toBe(true);
  });

  it('aceita uma cena normal sem verde dominante', () => {
    const cena = Array.from({ length: 100 }, (_, i) => [40 + (i % 80), 35 + (i % 70), 30 + (i % 60)] as [number, number, number]);
    expect(pareceQuadroVerdeNaAmostra(pixels(cena))).toBe(false);
  });

  it('aceita folhagem com tons variados em vez de um bloco uniforme', () => {
    const cena = Array.from({ length: 100 }, (_, i) => [10 + (i * 7) % 70, 85 + (i * 13) % 150, 5 + (i * 11) % 90] as [number, number, number]);
    expect(pareceQuadroVerdeNaAmostra(pixels(cena))).toBe(false);
  });

  it('rejeita uma faixa verde parcial formada por blocos vizinhos', () => {
    const largura = 48;
    const altura = 27;
    const cena = Array.from({ length: largura * altura }, (_, i) => {
      const x = i % largura;
      const y = Math.floor(i / largura);
      if (x < 16 && y < 18) return [0, 160, 0] as [number, number, number];
      return [55 + (x % 50), 48 + (y % 40), 40 + ((x + y) % 45)] as [number, number, number];
    });
    expect(pareceQuadroVerdeNaAmostra(pixels(cena), largura, altura)).toBe(true);
  });

  it('aceita um unico bloco verde localizado para evitar falso positivo de folhagem', () => {
    const largura = 48;
    const altura = 27;
    const cena = Array.from({ length: largura * altura }, (_, i) => {
      const x = i % largura;
      const y = Math.floor(i / largura);
      if (x < 8 && y < 9) return [0, 160, 0] as [number, number, number];
      return [48 + (x % 62), 42 + (y % 54), 36 + ((x + y) % 50)] as [number, number, number];
    });
    expect(pareceQuadroVerdeNaAmostra(pixels(cena), largura, altura)).toBe(false);
  });
});
