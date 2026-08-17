import { describe, expect, it, vi } from 'vitest';
import { HostDeTeste, HostHomeAssistant, type FonteDeAtualizacao } from './host-adapter';
import type { Hass } from '@/models/home-assistant';

function fabricarHass(estados: Record<string, { state: string; attributes?: Record<string, unknown> }>) {
  const chamadas: unknown[] = [];
  const hass = {
    states: Object.fromEntries(
      Object.entries(estados).map(([id, v]) => [
        id,
        { entity_id: id, state: v.state, attributes: v.attributes ?? {} },
      ]),
    ),
    callService: (d: string, s: string, dados: unknown, alvo: unknown) => {
      chamadas.push({ d, s, dados, alvo });
      return Promise.resolve();
    },
  } as unknown as Hass;
  return { hass, chamadas };
}

describe('HostHomeAssistant', () => {
  it('projeta o estado da entidade', () => {
    const { hass } = fabricarHass({ 'light.sala': { state: 'on', attributes: { brightness: 200 } } });
    const host = new HostHomeAssistant(() => hass);

    const st = host.estado('light.sala');
    expect(st?.state).toBe('on');
    expect(st?.attributes['brightness']).toBe(200);
    expect(host.estado('light.inexistente')).toBeUndefined();
    expect(host.estado(undefined)).toBeUndefined();
  });

  it('trata ausente, unavailable e unknown como indisponivel', () => {
    const { hass } = fabricarHass({
      'light.viva': { state: 'off' },
      'light.fora': { state: 'unavailable' },
      'light.enigma': { state: 'unknown' },
    });
    const host = new HostHomeAssistant(() => hass);

    expect(host.indisponivel('light.viva')).toBe(false);
    expect(host.indisponivel('light.fora')).toBe(true);
    expect(host.indisponivel('light.enigma')).toBe(true);
    expect(host.indisponivel('light.nem_existe')).toBe(true);
  });

  it('resolve lista de candidatos pelo primeiro disponivel', () => {
    const { hass } = fabricarHass({
      'climate.a': { state: 'unavailable' },
      'climate.b': { state: 'cool' },
    });
    const host = new HostHomeAssistant(() => hass);

    expect(host.resolver(['climate.a', 'climate.b'])).toBe('climate.b');
    expect(host.resolver('climate.a')).toBe('climate.a');
  });

  it('sem nenhum candidato vivo, devolve o primeiro da lista', () => {
    // A interface precisa dizer a QUE se refere, mesmo tudo indisponivel.
    const { hass } = fabricarHass({ 'climate.a': { state: 'unavailable' } });
    const host = new HostHomeAssistant(() => hass);
    expect(host.resolver(['climate.a', 'climate.z'])).toBe('climate.a');
  });

  it('encaminha a chamada de servico', async () => {
    const { hass, chamadas } = fabricarHass({});
    const host = new HostHomeAssistant(() => hass);

    await host.chamarServico('light', 'turn_on', { brightness: 10 }, { entity_id: 'light.sala' });
    expect(chamadas).toEqual([
      { d: 'light', s: 'turn_on', dados: { brightness: 10 }, alvo: { entity_id: 'light.sala' } },
    ]);
  });

  it('le o hass ATUAL a cada consulta, nao o do momento da construcao', () => {
    // Guardar a referencia devolveria estado velho — foi o defeito que a Fase
    // 6.1 teve de desfazer nos componentes.
    let atual = fabricarHass({ 'light.sala': { state: 'off' } }).hass;
    const host = new HostHomeAssistant(() => atual);
    expect(host.estado('light.sala')?.state).toBe('off');

    atual = fabricarHass({ 'light.sala': { state: 'on' } }).hass;
    expect(host.estado('light.sala')?.state).toBe('on');
  });

  it('dispara more-info e navegacao na origem informada', () => {
    const origem = new EventTarget();
    const maisInfo = vi.fn();
    const navegou = vi.fn();
    origem.addEventListener('hass-more-info', maisInfo);
    origem.addEventListener('location-changed', navegou);

    const { hass } = fabricarHass({});
    const host = new HostHomeAssistant(() => hass, undefined, origem);
    host.maisInfo('light.sala');
    host.navegar('/lovelace/bento-lab');

    expect(maisInfo).toHaveBeenCalledOnce();
    expect(navegou).toHaveBeenCalledOnce();
  });

  it('sem origem, more-info e navegacao nao quebram', () => {
    const { hass } = fabricarHass({});
    const host = new HostHomeAssistant(() => hass);
    expect(() => host.maisInfo('light.sala')).not.toThrow();
    expect(() => host.navegar('/x')).not.toThrow();
  });

  it('observar avisa so quando UMA das entidades declaradas muda', () => {
    let hass = fabricarHass({ 'light.a': { state: 'off' }, 'light.b': { state: 'off' } }).hass;
    const ouvintes = new Set<(h: Hass | undefined) => void>();
    const fonte: FonteDeAtualizacao = {
      assinar: (o) => {
        ouvintes.add(o);
        return () => ouvintes.delete(o);
      },
    };
    const host = new HostHomeAssistant(() => hass, fonte);
    const aviso = vi.fn();
    const cancelar = host.observar(['light.a'], aviso);

    // muda a NAO observada
    hass = fabricarHass({ 'light.a': { state: 'off' }, 'light.b': { state: 'on' } }).hass;
    ouvintes.forEach((o) => o(hass));
    expect(aviso).not.toHaveBeenCalled();

    // muda a observada
    hass = fabricarHass({ 'light.a': { state: 'on' }, 'light.b': { state: 'on' } }).hass;
    ouvintes.forEach((o) => o(hass));
    expect(aviso).toHaveBeenCalledWith(['light.a']);

    cancelar();
    expect(ouvintes.size).toBe(0);
  });

  it('sem fonte de atualizacao, observar devolve cancelamento inerte', () => {
    const { hass } = fabricarHass({});
    const host = new HostHomeAssistant(() => hass);
    const cancelar = host.observar(['light.a'], vi.fn());
    expect(() => cancelar()).not.toThrow();
  });
});

describe('HostDeTeste', () => {
  it('guarda as chamadas em vez de executar', async () => {
    const host = new HostDeTeste({ 'light.sala': { state: 'off' } });
    await host.chamarServico('light', 'toggle', {}, { entity_id: 'light.sala' });

    expect(host.chamadas).toEqual([
      { dominio: 'light', servico: 'toggle', dados: {}, alvo: { entity_id: 'light.sala' } },
    ]);
  });

  it('definir muda o estado e notifica quem observa aquele id', () => {
    const host = new HostDeTeste({ 'light.a': { state: 'off' } });
    const aviso = vi.fn();
    host.observar(['light.a'], aviso);

    host.definir('light.b', 'on');
    expect(aviso).not.toHaveBeenCalled();

    host.definir('light.a', 'on');
    expect(aviso).toHaveBeenCalledWith(['light.a']);
    expect(host.estado('light.a')?.state).toBe('on');
  });

  it('remover torna a entidade indisponivel', () => {
    const host = new HostDeTeste({ 'light.a': { state: 'on' } });
    host.remover('light.a');
    expect(host.indisponivel('light.a')).toBe(true);
  });

  it('registra more-info e navegacao', () => {
    const host = new HostDeTeste();
    host.maisInfo('light.sala');
    host.navegar('/lovelace/x');
    expect(host.maisInfoPedidos).toEqual(['light.sala']);
    expect(host.navegacoes).toEqual(['/lovelace/x']);
  });

  it('cancelar a observacao para de avisar', () => {
    const host = new HostDeTeste({ 'light.a': { state: 'off' } });
    const aviso = vi.fn();
    const cancelar = host.observar(['light.a'], aviso);
    cancelar();
    host.definir('light.a', 'on');
    expect(aviso).not.toHaveBeenCalled();
  });
});
