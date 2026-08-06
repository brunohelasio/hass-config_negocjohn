import { describe, it, expect, beforeEach } from 'vitest';
import {
  deviceRegistry,
  criarControle,
  entidadesDaInstancia,
  validarInstancias,
  resolverEntidade,
  agrupar,
  type DeviceInstanceConfig,
} from './device-registry';

// Os testes rodam em Node, sem DOM. O contrato do registry é "devolver o que o
// controle criou" — quem cria é o controle, e isso é verificável sem navegador.
const elementoFalso = () => ({ tagName: 'DIV' }) as unknown as HTMLElement;

const tipo = (nome: string) => ({
  type: nome,
  label: nome,
  create: () => elementoFalso(),
  entities: (i: DeviceInstanceConfig) => (typeof i.entity === 'string' ? [i.entity] : []),
});

// O registry é um singleton; cada teste registra um tipo com nome próprio para
// não depender da ordem de execução.
let n = 0;
const nomeUnico = () => `teste-${++n}`;

describe('registro de tipos', () => {
  it('registra e recupera', () => {
    const t = nomeUnico();
    deviceRegistry.registrar(tipo(t));
    expect(deviceRegistry.conhece(t)).toBe(true);
    expect(deviceRegistry.obter(t)?.label).toBe(t);
  });

  it('registrar duas vezes é erro, não silêncio', () => {
    const t = nomeUnico();
    deviceRegistry.registrar(tipo(t));
    expect(() => deviceRegistry.registrar(tipo(t))).toThrow(/já registrado/);
  });
});

describe('criarControle', () => {
  it('cria pelo tipo registrado, devolvendo o que o controle criou', () => {
    const t = nomeUnico();
    const marcado = elementoFalso();
    deviceRegistry.registrar({ ...tipo(t), create: () => marcado });
    expect(criarControle({ id: 'a', type: t, name: 'A' })).toBe(marcado);
  });

  it('tipo desconhecido devolve undefined — o chamador decide', () => {
    expect(criarControle({ id: 'a', type: 'inexistente', name: 'A' })).toBeUndefined();
  });
});

describe('entidadesDaInstancia', () => {
  it('devolve as entidades declaradas pelo controle', () => {
    const t = nomeUnico();
    deviceRegistry.registrar(tipo(t));
    expect(entidadesDaInstancia({ id: 'a', type: t, name: 'A', entity: 'light.x' })).toEqual(['light.x']);
  });

  it('tipo desconhecido não quebra', () => {
    expect(entidadesDaInstancia({ id: 'a', type: 'nada', name: 'A' })).toEqual([]);
  });
});

describe('validarInstancias', () => {
  let t: string;
  beforeEach(() => {
    t = nomeUnico();
    deviceRegistry.registrar(tipo(t));
  });

  it('aceita configuração válida', () => {
    expect(validarInstancias([{ id: 'tv', type: t, name: 'TV' }]).ok).toBe(true);
  });

  it('acusa id repetido', () => {
    const r = validarInstancias([
      { id: 'tv', type: t, name: 'TV' },
      { id: 'tv', type: t, name: 'Outra' },
    ]);
    expect(r.ok).toBe(false);
    expect(r.erros.join(' ')).toMatch(/id repetido/);
  });

  it('acusa tipo não registrado', () => {
    const r = validarInstancias([{ id: 'x', type: 'fantasma', name: 'X' }]);
    expect(r.erros.join(' ')).toMatch(/tipo não registrado/);
  });

  it('acusa falta de nome', () => {
    const r = validarInstancias([{ id: 'x', type: t, name: '' }]);
    expect(r.erros.join(' ')).toMatch(/falta "name"/);
  });

  it('delega a validação específica do controle', () => {
    const especial = nomeUnico();
    deviceRegistry.registrar({
      ...tipo(especial),
      validate: () => ({ ok: false, erros: ['precisa de media_player'] }),
    });
    const r = validarInstancias([{ id: 'y', type: especial, name: 'Y' }]);
    expect(r.erros).toContain('precisa de media_player');
  });
});

describe('resolverEntidade', () => {
  const hass = {
    states: {
      'climate.a': { state: 'unavailable', attributes: {} },
      'climate.b': { state: 'cool', attributes: {} },
    },
  } as unknown as Parameters<typeof resolverEntidade>[1];

  it('texto simples passa direto', () => {
    expect(resolverEntidade('light.x', hass)).toBe('light.x');
  });

  it('lista: escolhe o primeiro disponível', () => {
    expect(resolverEntidade(['climate.a', 'climate.b'], hass)).toBe('climate.b');
  });

  it('lista sem nenhum vivo: devolve o primeiro, para a interface dizer a que se refere', () => {
    expect(resolverEntidade(['climate.z', 'climate.w'], hass)).toBe('climate.z');
  });
});

describe('agrupar', () => {
  it('preserva a ordem de declaração dos grupos', () => {
    const g = agrupar([
      { id: '1', type: 'x', name: 'A', group: 'Sala' },
      { id: '2', type: 'x', name: 'B', group: 'Cozinha' },
      { id: '3', type: 'x', name: 'C', group: 'Sala' },
    ]);
    expect(g.map((x) => x.grupo)).toEqual(['Sala', 'Cozinha']);
    expect(g[0]?.itens).toHaveLength(2);
  });

  it('sem grupo declarado, cai em Casa', () => {
    expect(agrupar([{ id: '1', type: 'x', name: 'A' }])[0]?.grupo).toBe('Casa');
  });
});
