import { describe, it, expect } from 'vitest';
import {
  normalizarDispositivo,
  dispositivoDoComodo,
  spotifyTocandoEm,
} from './spotify-device';

const tocando = (attrs: Record<string, unknown> = {}) => ({ state: 'playing', attributes: attrs });

describe('normalizarDispositivo', () => {
  it('derruba acento, caixa e pontuação', () => {
    expect(normalizarDispositivo('Echo Pop — Office')).toBe('echo pop office');
    expect(normalizarDispositivo('Sala/Varanda')).toBe('sala varanda');
  });
});

describe('dispositivoDoComodo', () => {
  it('sem dispositivo declarado, aceita qualquer um', () => {
    expect(dispositivoDoComodo({ source: 'Echo Show' }, undefined)).toBe(true);
  });

  it('casa pelo nome exato', () => {
    expect(dispositivoDoComodo({ source: 'Echo Show' }, 'Echo Show')).toBe(true);
  });

  it('casa com sufixo que o Spotify acrescenta', () => {
    expect(dispositivoDoComodo({ source: 'Echo Show de Bruno' }, 'Echo Show')).toBe(true);
  });

  it('não casa cômodo diferente', () => {
    expect(dispositivoDoComodo({ source: 'Echo Pop Marina' }, 'Echo Show')).toBe(false);
  });

  it('um nome curto não casa com todos', () => {
    // "Echo" tem 4 caracteres: o caminho inverso exige 10 ou mais, senão um
    // dispositivo genérico acenderia o ponto nos quatro cômodos.
    expect(dispositivoDoComodo({ source: 'Echo' }, 'Echo Pop Office')).toBe(false);
  });

  it('procura em qualquer um dos campos publicados', () => {
    expect(dispositivoDoComodo({ active_device_name: 'Echo Pop Office' }, 'Echo Pop Office')).toBe(true);
  });
});

describe('spotifyTocandoEm', () => {
  it('parado não conta', () => {
    expect(spotifyTocandoEm({ state: 'off', attributes: {} }, 'Echo Show')).toBe(false);
  });

  it('tocando no dispositivo do cômodo', () => {
    expect(spotifyTocandoEm(tocando({ source: 'Echo Show' }), 'Echo Show')).toBe(true);
  });

  it('tocando em outro cômodo não acende aqui', () => {
    expect(spotifyTocandoEm(tocando({ source: 'Echo Pop Marina' }), 'Echo Show')).toBe(false);
  });

  it('sem dispositivo publicado, vale o Echo do cômodo tocando Spotify', () => {
    const spotify = tocando({ media_title: 'Faixa' });
    const echo = { state: 'playing', attributes: { app_name: 'Spotify' } };
    expect(spotifyTocandoEm(spotify, 'Echo Show', echo)).toBe(true);
  });

  it('sem dispositivo publicado, vale a mesma faixa no Echo do cômodo', () => {
    const spotify = tocando({ media_title: 'Faixa', media_artist: 'Artista' });
    const echo = { state: 'playing', attributes: { media_title: 'Faixa' } };
    expect(spotifyTocandoEm(spotify, 'Echo Show', echo)).toBe(true);
  });

  it('Echo do cômodo parado não salva', () => {
    const spotify = tocando({ source: 'Echo Pop Marina' });
    const echo = { state: 'standby', attributes: {} };
    expect(spotifyTocandoEm(spotify, 'Echo Show', echo)).toBe(false);
  });
});
