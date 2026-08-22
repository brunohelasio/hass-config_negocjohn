import { beforeEach, describe, expect, it } from 'vitest';
import type { Hass, HassEntity } from '@/models/home-assistant';
import {
  MEDIA_PLAYING_STATES,
  TV_POWER_ON_STATES,
  isMediaPlaying,
  isTvPowered,
  isTvPoweredStable,
  resetTvPowerStabilityForTests,
} from './media-state';

function hassComEstado(state: string): Hass {
  const entity: HassEntity = {
    entity_id: 'media_player.tv',
    state,
    attributes: {},
    last_changed: '',
    last_updated: '',
  };
  return {
    states: { 'media_player.tv': entity },
    callService: async () => undefined,
  };
}

function hassVazio(): Hass {
  return {
    states: {},
    callService: async () => undefined,
  };
}

describe('semântica de estado de mídia', () => {
  beforeEach(() => resetTvPowerStabilityForTests());
  it.each(TV_POWER_ON_STATES)('considera %s como TV ligada', (state) => {
    expect(isTvPowered(hassComEstado(state), 'media_player.tv')).toBe(true);
  });

  it.each(['off', 'unknown', 'unavailable'])('não considera %s como TV ligada', (state) => {
    expect(isTvPowered(hassComEstado(state), 'media_player.tv')).toBe(false);
  });

  it.each(MEDIA_PLAYING_STATES)('considera %s como reprodução ativa', (state) => {
    expect(isMediaPlaying(hassComEstado(state), 'media_player.tv')).toBe(true);
  });

  it.each(['on', 'idle', 'paused', 'off'])('separa %s de reprodução ativa', (state) => {
    expect(isMediaPlaying(hassComEstado(state), 'media_player.tv')).toBe(false);
  });

  it('segura um off transitório depois de prova positiva e expira a janela', () => {
    const on = hassComEstado('on');
    const off = hassComEstado('off');
    expect(isTvPoweredStable(on, 'media_player.tv', 1_000, 45_000)).toBe(true);
    expect(isTvPoweredStable(off, 'media_player.tv', 20_000, 45_000)).toBe(true);
    expect(isTvPoweredStable(off, 'media_player.tv', 47_000, 45_000)).toBe(false);
  });

  it('não segura unavailable/unknown como energia', () => {
    expect(isTvPoweredStable(hassComEstado('on'), 'media_player.tv', 1_000, 45_000)).toBe(true);
    expect(isTvPoweredStable(hassComEstado('unavailable'), 'media_player.tv', 2_000, 45_000)).toBe(false);
  });

  it('não inventa estado quando a entidade não existe', () => {
    const hass = hassVazio();
    expect(isTvPowered(hass, 'media_player.tv')).toBe(false);
    expect(isMediaPlaying(hass, 'media_player.tv')).toBe(false);
  });
});
