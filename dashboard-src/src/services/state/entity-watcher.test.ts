import { describe, expect, it } from 'vitest';

import type { Hass, HassEntity } from '@/models/home-assistant';

import {
  coletarIdsDeEntidade,
  ObservadorDeEntidades,
  projecaoDeAtributo,
  projecaoDeEstado,
  resumirMotivo,
} from './entity-watcher';

function entidade(id: string, state: string, extras: Partial<HassEntity> = {}): HassEntity {
  return {
    entity_id: id,
    state,
    attributes: {},
    last_changed: '2026-01-01T00:00:00Z',
    last_updated: '2026-01-01T00:00:00Z',
    ...extras,
  };
}

function hassCom(...entidades: HassEntity[]): Hass {
  const states: Record<string, HassEntity> = {};
  for (const e of entidades) states[e.entity_id] = e;
  return {
    states,
    callService: () => Promise.resolve(),
  };
}

describe('ObservadorDeEntidades', () => {
  it('a primeira leitura devolve todas as observadas — é a pintura inicial', () => {
    const obs = new ObservadorDeEntidades(['light.a', 'light.b']);
    const hass = hassCom(entidade('light.a', 'on'), entidade('light.b', 'off'));
    expect(obs.mudancas(hass)).toEqual(['light.a', 'light.b']);
  });

  it('a segunda leitura sem mudança devolve vazio', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    const hass = hassCom(entidade('light.a', 'on'));
    obs.mudancas(hass);
    expect(obs.mudancas(hass)).toEqual([]);
  });

  it('devolve só a entidade que mudou, não a lista toda', () => {
    const obs = new ObservadorDeEntidades(['light.a', 'light.b', 'light.c']);
    obs.mudancas(hassCom(entidade('light.a', 'on'), entidade('light.b', 'off'), entidade('light.c', 'on')));

    const depois = hassCom(
      entidade('light.a', 'on'),
      entidade('light.b', 'on', { last_changed: '2026-01-01T00:05:00Z' }),
      entidade('light.c', 'on'),
    );
    expect(obs.mudancas(depois)).toEqual(['light.b']);
  });

  it('ignora entidade fora da lista, por mais que o hass mude', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    obs.mudancas(hassCom(entidade('light.a', 'on')));

    const comRuido = hassCom(entidade('light.a', 'on'), entidade('sensor.ruido', '999'));
    expect(obs.mudancas(comRuido)).toEqual([]);
  });

  it('entidade que some conta como mudança', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    obs.mudancas(hassCom(entidade('light.a', 'on')));
    expect(obs.mudancas(hassCom())).toEqual(['light.a']);
  });

  it('entidade que nunca existiu não fica mudando sozinha', () => {
    const obs = new ObservadorDeEntidades(['light.fantasma']);
    obs.mudancas(hassCom());
    expect(obs.mudancas(hassCom())).toEqual([]);
  });

  it('on -> off -> on entre leituras é detectado pelo last_changed', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    obs.mudancas(hassCom(entidade('light.a', 'on')));

    const voltou = hassCom(entidade('light.a', 'on', { last_changed: '2026-01-01T00:09:00Z' }));
    expect(obs.mudancas(voltou)).toEqual(['light.a']);
  });

  it('projeção de estado ignora o carimbo de tempo', () => {
    const obs = new ObservadorDeEntidades(['light.a'], {
      projecoes: { 'light.a': projecaoDeEstado },
    });
    obs.mudancas(hassCom(entidade('light.a', 'on')));

    const soOCarimbo = hassCom(entidade('light.a', 'on', { last_changed: '2026-01-01T00:09:00Z' }));
    expect(obs.mudancas(soOCarimbo)).toEqual([]);
  });

  it('projeção de atributo pega mudança que não aparece no estado', () => {
    const obs = new ObservadorDeEntidades(['media_player.x'], {
      projecoes: { 'media_player.x': projecaoDeAtributo('entity_picture') },
    });
    obs.mudancas(
      hassCom(entidade('media_player.x', 'playing', { attributes: { entity_picture: '/a.jpg' } })),
    );

    const trocouArte = hassCom(
      entidade('media_player.x', 'playing', { attributes: { entity_picture: '/b.jpg' } }),
    );
    expect(obs.mudancas(trocouArte)).toEqual(['media_player.x']);
  });

  it('trocar a lista volta ao estado virgem — a nova lista precisa pintar', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    const hass = hassCom(entidade('light.a', 'on'), entidade('light.b', 'off'));
    obs.mudancas(hass);
    expect(obs.mudancas(hass)).toEqual([]);

    obs.observar(['light.a', 'light.b']);
    expect(obs.mudancas(hass)).toEqual(['light.a', 'light.b']);
  });

  it('descarta id repetido e id vazio', () => {
    const obs = new ObservadorDeEntidades(['light.a', 'light.a', '', 'light.b']);
    expect(obs.observadas).toEqual(['light.a', 'light.b']);
  });

  it('sem hass não há mudança', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    expect(obs.mudancas(undefined)).toEqual([]);
  });

  it('esquecer faz a próxima leitura pintar tudo de novo', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    const hass = hassCom(entidade('light.a', 'on'));
    obs.mudancas(hass);
    obs.esquecer();
    expect(obs.mudancas(hass)).toEqual(['light.a']);
  });

  it('mudou() é o atalho booleano', () => {
    const obs = new ObservadorDeEntidades(['light.a']);
    const hass = hassCom(entidade('light.a', 'on'));
    expect(obs.mudou(hass)).toBe(true);
    expect(obs.mudou(hass)).toBe(false);
  });

  it('lista vazia nunca muda', () => {
    const obs = new ObservadorDeEntidades([]);
    const hass = hassCom(entidade('light.a', 'on'));
    expect(obs.mudancas(hass)).toEqual([]);
    expect(obs.mudancas(hass)).toEqual([]);
  });
});

describe('coletarIdsDeEntidade', () => {
  it('acha ids soltos, em lista e aninhados', () => {
    const config = {
      lightGroup: 'light.grupo_sala',
      lights: ['light.a', 'light.b'],
      cameras: [{ entity: 'camera.sl', motion: 'binary_sensor.sl_motion' }],
    };
    expect(coletarIdsDeEntidade(config)).toEqual([
      'light.grupo_sala',
      'light.a',
      'light.b',
      'camera.sl',
      'binary_sensor.sl_motion',
    ]);
  });

  it('ignora caminho de imagem, rótulo e nome de dispositivo', () => {
    const config = {
      background: '/local/images/sala.jpg?v=1',
      spotifyDeviceName: 'Echo Show',
      climateDeviceName: 'Gree',
      title: 'Sala',
      entity: 'light.a',
    };
    expect(coletarIdsDeEntidade(config)).toEqual(['light.a']);
  });

  it('não repete id que aparece em dois lugares', () => {
    const config = { a: 'light.x', b: { c: 'light.x' } };
    expect(coletarIdsDeEntidade(config)).toEqual(['light.x']);
  });

  it('sobrevive a nulo, indefinido e tipos inesperados', () => {
    expect(coletarIdsDeEntidade(undefined)).toEqual([]);
    expect(coletarIdsDeEntidade(null)).toEqual([]);
    expect(coletarIdsDeEntidade(42)).toEqual([]);
    expect(coletarIdsDeEntidade({ a: null, b: 7, c: true, d: 'light.a' })).toEqual(['light.a']);
  });

  it('não entra em laço infinito com referência circular', () => {
    const a: Record<string, unknown> = { entity: 'light.a' };
    a['self'] = a;
    expect(coletarIdsDeEntidade(a)).toEqual(['light.a']);
  });

  it('recusa texto que só parece id', () => {
    const config = {
      a: 'Sala.Estar',
      b: 'light.',
      c: '.x',
      d: 'sensor.OK_MAIUSCULO',
      e: 'sensor.valido_2',
    };
    expect(coletarIdsDeEntidade(config)).toEqual(['sensor.valido_2']);
  });
});

describe('resumirMotivo', () => {
  it('lista vazia vira texto vazio', () => {
    expect(resumirMotivo([])).toBe('');
  });

  it('até o teto, mostra tudo', () => {
    expect(resumirMotivo(['a', 'b'])).toBe('a b');
  });

  it('acima do teto, resume com a contagem do resto', () => {
    expect(resumirMotivo(['a', 'b', 'c', 'd'])).toBe('a b +2');
  });
});
