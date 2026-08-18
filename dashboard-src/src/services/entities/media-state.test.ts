import { describe, expect, it } from 'vitest';
import type { Hass, HassEntity } from '@/models/home-assistant';
import {
  MEDIA_PLAYING_STATES,
  TV_POWER_ON_STATES,
  isMediaPlaying,
  isTvPowered,
} from './media-state';

function hassComEstado(state: string): Hass {
  const entity = {
    entity_id: 'media_player.tv',
    state,
    attributes: {},
    last_changed: '',
    last_updated: '',
    context: { id: '', parent_id: null, user_id: null },
  } as HassEntity;
  return { states: { 'media_player.tv': entity } } as Hass;
}

describe('semântica de estado de mídia', () => {
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

  it('não inventa estado quando a entidade não existe', () => {
    const hass = { states: {} } as Hass;
    expect(isTvPowered(hass, 'media_player.tv')).toBe(false);
    expect(isMediaPlaying(hass, 'media_player.tv')).toBe(false);
  });
});
