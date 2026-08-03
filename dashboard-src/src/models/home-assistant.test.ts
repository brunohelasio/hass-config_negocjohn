import { describe, it, expect } from 'vitest';
import { isOn, isUnavailable, type HassEntity } from './home-assistant';

const entity = (entity_id: string, state: string): HassEntity => ({
  entity_id,
  state,
  attributes: {},
  last_changed: '',
  last_updated: '',
});

describe('isOn', () => {
  it('reconhece luz e interruptor ligados', () => {
    expect(isOn(entity('light.sala_switch_1', 'on'))).toBe(true);
    expect(isOn(entity('switch.macbook', 'on'))).toBe(true);
    expect(isOn(entity('light.sala_switch_1', 'off'))).toBe(false);
  });

  // Regressao do P5 (docs/09): o botao do A/C nao acendia porque o template base
  // so conhecia 'on' e ignorava os estados de climate.
  it('reconhece os estados de climate como ligado', () => {
    for (const s of ['cool', 'heat', 'heat_cool', 'auto', 'dry', 'fan_only']) {
      expect(isOn(entity('climate.ac_office', s))).toBe(true);
    }
    expect(isOn(entity('climate.ac_office', 'off'))).toBe(false);
  });

  it('reconhece media_player tocando e pausado', () => {
    expect(isOn(entity('media_player.echo_show', 'playing'))).toBe(true);
    expect(isOn(entity('media_player.echo_show', 'paused'))).toBe(true);
    expect(isOn(entity('media_player.echo_show', 'idle'))).toBe(false);
  });

  it('nunca considera ligado o que esta indisponivel', () => {
    expect(isOn(entity('light.x', 'unavailable'))).toBe(false);
    expect(isOn(entity('light.x', 'unknown'))).toBe(false);
    expect(isOn(undefined)).toBe(false);
  });
});

describe('isUnavailable', () => {
  it('trata ausente, unavailable e unknown como indisponivel', () => {
    expect(isUnavailable(undefined)).toBe(true);
    expect(isUnavailable(entity('light.x', 'unavailable'))).toBe(true);
    expect(isUnavailable(entity('light.x', 'unknown'))).toBe(true);
    expect(isUnavailable(entity('light.x', 'off'))).toBe(false);
  });
});
