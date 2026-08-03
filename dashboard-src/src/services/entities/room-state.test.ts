import { describe, it, expect } from 'vitest';
import {
  formatElapsed,
  lightsSummary,
  semanticLine,
  isRoomOn,
  firstSensorValue,
} from './room-state';
import type { Hass, HassEntity } from '@/models/home-assistant';

const NOW = Date.parse('2026-08-03T12:00:00Z');

function ent(
  entity_id: string,
  state: string,
  attributes: Record<string, unknown> = {},
  last_changed = '',
): HassEntity {
  return { entity_id, state, attributes, last_changed, last_updated: last_changed };
}

function hassOf(...entities: HassEntity[]): Hass {
  const states: Record<string, HassEntity> = {};
  for (const e of entities) states[e.entity_id] = e;
  return { states, callService: async () => undefined };
}

const ago = (ms: number) => new Date(NOW - ms).toISOString();

describe('formatElapsed', () => {
  it('usa o formato curto dos cards', () => {
    expect(formatElapsed(30_000)).toBe('<1m');
    expect(formatElapsed(5 * 60_000)).toBe('5m');
    expect(formatElapsed(59 * 60_000)).toBe('59m');
    expect(formatElapsed(2 * 3_600_000)).toBe('2h');
    expect(formatElapsed(23 * 3_600_000)).toBe('23h');
    expect(formatElapsed(3 * 86_400_000)).toBe('3d');
  });

  it('trunca, nao arredonda (90 min = 1h, nao 2h)', () => {
    expect(formatElapsed(90 * 60_000)).toBe('1h');
  });
});

describe('lightsSummary — ordem de prioridade das fontes', () => {
  it('1) lights_on_count tem precedencia sobre tudo', () => {
    const hass = hassOf(
      ent('sensor.x_active', 'on', { lights_on_count: 3, lights_on: ['a'] }),
      ent('light.grupo', 'on', { entity_id: ['light.a', 'light.b'] }),
      ent('light.a', 'on'),
      ent('light.b', 'off'),
    );
    expect(
      lightsSummary({
        hass,
        groupEntityId: 'light.grupo',
        activeSensorId: 'sensor.x_active',
        now: NOW,
      }).count,
    ).toBe(3);
  });

  it('2) lights_on como lista', () => {
    const hass = hassOf(ent('sensor.x_active', 'on', { lights_on: ['a', 'b'] }));
    expect(lightsSummary({ hass, activeSensorId: 'sensor.x_active', now: NOW }).count).toBe(2);
  });

  it('2b) lights_on serializado como string com aspas simples', () => {
    const hass = hassOf(ent('sensor.x_active', 'on', { lights_on: "['light.a', 'light.b']" }));
    expect(lightsSummary({ hass, activeSensorId: 'sensor.x_active', now: NOW }).count).toBe(2);
  });

  it('3) conta os membros do grupo quando nao ha sensor', () => {
    const hass = hassOf(
      ent('light.grupo', 'on', { entity_id: ['light.a', 'light.b', 'light.c'] }),
      ent('light.a', 'on'),
      ent('light.b', 'on'),
      ent('light.c', 'off'),
    );
    expect(lightsSummary({ hass, groupEntityId: 'light.grupo', now: NOW }).count).toBe(2);
  });

  it('4) cai na lista de fallback (caso do Corredor: circuito unico)', () => {
    const hass = hassOf(ent('light.corredor_switch_1', 'on'));
    const r = lightsSummary({
      hass,
      groupEntityId: 'light.corredor_switch_1',
      fallbackLightIds: ['light.corredor_switch_1'],
      now: NOW,
    });
    expect(r.count).toBe(1);
    expect(r.label).toMatch(/^1 light/);
  });

  it('5) ultimo recurso: o estado do proprio grupo', () => {
    const hass = hassOf(ent('light.grupo', 'on'));
    expect(lightsSummary({ hass, groupEntityId: 'light.grupo', now: NOW }).count).toBe(1);
  });

  it('nao mostra rotulo quando esta tudo apagado', () => {
    const hass = hassOf(ent('light.grupo', 'off'));
    expect(lightsSummary({ hass, groupEntityId: 'light.grupo', now: NOW }).label).toBe('');
  });

  it('singular e plural', () => {
    const h1 = hassOf(ent('sensor.a', 'on', { lights_on_count: 1, lights_elapsed: '' }));
    const h2 = hassOf(ent('sensor.a', 'on', { lights_on_count: 2, lights_elapsed: '' }));
    expect(lightsSummary({ hass: h1, activeSensorId: 'sensor.a', now: NOW }).label).toBe('1 light');
    expect(lightsSummary({ hass: h2, activeSensorId: 'sensor.a', now: NOW }).label).toBe('2 lights');
  });
});

describe('lightsSummary — tempo decorrido', () => {
  // Regra documentada em CLAUDE.md: `last_changed` do grupo tem inconsistencias
  // conhecidas no HA, por isso o tempo vem do membro ACESO MAIS ANTIGO.
  it('usa o membro aceso mais antigo, nao o grupo', () => {
    const hass = hassOf(
      ent('light.grupo', 'on', { entity_id: ['light.a', 'light.b'] }, ago(60_000)),
      ent('light.a', 'on', {}, ago(2 * 3_600_000)),
      ent('light.b', 'on', {}, ago(10 * 60_000)),
    );
    expect(lightsSummary({ hass, groupEntityId: 'light.grupo', now: NOW }).elapsed).toBe('2h');
  });

  it('ignora membro apagado ao calcular o tempo', () => {
    const hass = hassOf(
      ent('light.grupo', 'on', { entity_id: ['light.a', 'light.b'] }),
      ent('light.a', 'off', {}, ago(10 * 3_600_000)),
      ent('light.b', 'on', {}, ago(5 * 60_000)),
    );
    expect(lightsSummary({ hass, groupEntityId: 'light.grupo', now: NOW }).elapsed).toBe('5m');
  });

  it('o atributo lights_elapsed tem precedencia', () => {
    const hass = hassOf(
      ent('sensor.a', 'on', { lights_on_count: 1, lights_elapsed: '42m' }),
      ent('light.grupo', 'on', {}, ago(9 * 3_600_000)),
    );
    expect(
      lightsSummary({ hass, activeSensorId: 'sensor.a', groupEntityId: 'light.grupo', now: NOW })
        .elapsed,
    ).toBe('42m');
  });
});

describe('semanticLine', () => {
  it('prefere o atributo display do sensor semantico', () => {
    const hass = hassOf(ent('sensor.s', 'occupied', { display: 'Ocupada / 12m' }));
    expect(semanticLine({ hass, semanticSensorId: 'sensor.s' })).toBe('Ocupada / 12m');
  });

  it('ignora display quando o estado e none/unknown/unavailable', () => {
    for (const s of ['none', 'unknown', 'unavailable']) {
      const hass = hassOf(ent('sensor.s', s, { display: 'nao deve aparecer' }));
      expect(semanticLine({ hass, semanticSensorId: 'sensor.s' })).toBe('');
    }
  });

  // Regressao de 2026-07-04: o texto ficava ate 2 min apos a saida, com o ponto
  // azul ja apagado. Contradicao visual — o texto exige presenca ativa.
  it('exige presenca ativa junto com a ocupacao', () => {
    const saiu = hassOf(
      ent('binary_sensor.motion', 'off'),
      ent('binary_sensor.occ', 'on'), // ocupacao ainda segurando
    );
    expect(
      semanticLine({ hass: saiu, motionRecentId: 'binary_sensor.motion', occupancyId: 'binary_sensor.occ' }),
    ).toBe('');

    const dentro = hassOf(ent('binary_sensor.motion', 'on'), ent('binary_sensor.occ', 'on'));
    expect(
      semanticLine({
        hass: dentro,
        motionRecentId: 'binary_sensor.motion',
        occupancyId: 'binary_sensor.occ',
      }),
    ).toBe('Ocupado');
  });

  it('presenca sem ocupacao ainda nao e "Ocupado"', () => {
    const hass = hassOf(ent('binary_sensor.motion', 'on'), ent('binary_sensor.occ', 'off'));
    expect(
      semanticLine({ hass, motionRecentId: 'binary_sensor.motion', occupancyId: 'binary_sensor.occ' }),
    ).toBe('');
  });
});

describe('isRoomOn', () => {
  it('aceita os estados configurados', () => {
    const hass = hassOf(ent('light.g', 'home'));
    expect(isRoomOn(hass, 'light.g')).toBe(true);
    expect(isRoomOn(hass, 'light.g', ['on'])).toBe(false);
  });

  it('entidade ausente nunca esta ligada', () => {
    expect(isRoomOn(hassOf(), 'light.inexistente')).toBe(false);
    expect(isRoomOn(hassOf(), undefined)).toBe(false);
  });
});

describe('firstSensorValue', () => {
  it('pega o primeiro sensor valido e arredonda', () => {
    const hass = hassOf(ent('sensor.a', 'unavailable'), ent('sensor.b', '23.6'));
    expect(firstSensorValue(hass, ['sensor.a', 'sensor.b'], '°')).toBe('24°');
  });

  it('vazio quando nao ha sensor valido', () => {
    expect(firstSensorValue(hassOf(), ['sensor.x'], '°')).toBe('');
    expect(firstSensorValue(hassOf(), undefined)).toBe('');
  });
});
