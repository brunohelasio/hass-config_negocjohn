import { describe, expect, it, vi } from 'vitest';
import type { Hass } from '@/models/home-assistant';
import { callHaService } from './service-call';

describe('callHaService', () => {
  it('mantém entity_id e dados no terceiro argumento', async () => {
    const callService = vi.fn(async () => undefined);
    const hass: Hass = { states: {}, callService };
    await callHaService(hass, 'media_player', 'volume_set', {
      entity_id: 'media_player.spotify',
      volume_level: 0.42,
    });
    expect(callService).toHaveBeenCalledWith('media_player', 'volume_set', {
      entity_id: 'media_player.spotify',
      volume_level: 0.42,
    });
  });
});
