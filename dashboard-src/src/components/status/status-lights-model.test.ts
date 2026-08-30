import { describe, expect, it } from 'vitest';

import type { Hass, HassEntity } from '@/models/home-assistant';

import { balanceStatusLightsRooms, buildStatusLightsInventory } from './status-lights-model';

function entity(entityId: string, state: string, attributes: Record<string, unknown> = {}): HassEntity {
  return {
    entity_id: entityId,
    state,
    attributes,
    last_changed: '2026-08-25T00:00:00Z',
    last_updated: '2026-08-25T00:00:00Z',
  };
}

function hass(states: Hass['states']): Hass {
  return { states, callService: async () => undefined };
}

describe('status lights inventory', () => {
  it('expande grupos recursivamente, deduplica e ignora entidades inexistentes', () => {
    const states: Hass['states'] = {
      'light.grupo_luzes_sala': entity('light.grupo_luzes_sala', 'on', {
        entity_id: ['light.sala_switch_1', 'light.grupo_sala_interno', 'light.fantasma'],
      }),
      'light.grupo_sala_interno': entity('light.grupo_sala_interno', 'on', {
        entity_id: ['light.sala_switch_2', 'light.sala_switch_1'],
      }),
      'light.sala_switch_1': entity('light.sala_switch_1', 'on', { friendly_name: 'Sanca' }),
      'light.sala_switch_2': entity('light.sala_switch_2', 'off', { friendly_name: 'Luz principal' }),
    };
    const inventory = buildStatusLightsInventory(hass(states));
    const sala = inventory.rooms.find((room) => room.id === 'sala');

    expect(sala?.lights.map((light) => light.entityId)).toEqual([
      'light.sala_switch_1',
      'light.sala_switch_2',
    ]);
    expect(inventory.total).toBe(2);
    expect(inventory.onCount).toBe(1);
    expect(inventory.expandedGroups).toContain('light.grupo_sala_interno');
  });

  it('preserva em Sem comodo uma luz monitorada que ROOMS nao associa', () => {
    const states: Hass['states'] = {
      'light.corredor_switch_1': entity('light.corredor_switch_1', 'off', { friendly_name: 'Corredor' }),
      'light.extra': entity('light.extra', 'on', { friendly_name: 'Luz sem área' }),
    };
    const inventory = buildStatusLightsInventory(
      hass(states),
      ['light.corredor_switch_1', 'light.extra'],
    );

    expect(inventory.orphanEntityIds).toEqual(['light.extra']);
    expect(inventory.rooms.find((room) => room.id === 'unassigned')?.lights[0]?.name).toBe('Luz sem área');
  });

  it('interrompe ciclos entre grupos sem duplicar circuitos', () => {
    const states: Hass['states'] = {
      'light.grupo_luzes_sala': entity('light.grupo_luzes_sala', 'on', {
        entity_id: ['light.grupo_ciclo'],
      }),
      'light.grupo_ciclo': entity('light.grupo_ciclo', 'on', {
        entity_id: ['light.grupo_luzes_sala', 'light.sala_switch_1'],
      }),
      'light.sala_switch_1': entity('light.sala_switch_1', 'on'),
    };
    const inventory = buildStatusLightsInventory(hass(states));
    expect(inventory.entityIds).toEqual(['light.sala_switch_1']);
  });

  it('remove somente os dois circuitos inativos do grupo interno do Quarto Casal', () => {
    const states: Hass['states'] = {
      'light.grupo_quarto_casal': entity('light.grupo_quarto_casal', 'on', {
        entity_id: ['light.qc_luz_principal', 'light.suite_casal_switch_1'],
      }),
      'light.qc_luz_principal': entity('light.qc_luz_principal', 'on', {
        entity_id: ['light.quarto_casal_2_switch_1', 'light.quarto_casal_switch_3'],
      }),
      'light.quarto_casal_2_switch_1': entity('light.quarto_casal_2_switch_1', 'off'),
      'light.quarto_casal_switch_3': entity('light.quarto_casal_switch_3', 'off'),
      'light.suite_casal_switch_1': entity('light.suite_casal_switch_1', 'on', {
        friendly_name: 'QCS - Luz principal',
      }),
    };
    const inventory = buildStatusLightsInventory(
      hass(states),
      ['light.grupo_quarto_casal', 'light.qc_luz_principal'],
    );
    const casal = inventory.rooms.find((room) => room.id === 'casal');

    expect(casal?.lights.map((light) => light.entityId)).toEqual(['light.suite_casal_switch_1']);
    expect(inventory.orphanEntityIds).toEqual([]);
  });

  it('balanceia duas colunas pelo numero estimado de linhas', () => {
    const makeRoom = (id: string, count: number) => ({
      id,
      name: id,
      lights: Array.from({ length: count }, (_, index) => ({
        entityId: `light.${id}_${index}`,
        name: `${id} ${index}`,
        isOn: false,
        isUnavailable: false,
      })),
    });
    const [left, right] = balanceStatusLightsRooms([
      makeRoom('sala', 7),
      makeRoom('office', 3),
      makeRoom('cozinha', 4),
      makeRoom('casal', 6),
    ]);
    const weight = (rooms: typeof left) => rooms.reduce(
      (sum, room) => sum + 1 + Math.ceil(room.lights.length / 2),
      0,
    );
    expect(Math.abs(weight(left) - weight(right))).toBeLessThanOrEqual(3);
  });
});
