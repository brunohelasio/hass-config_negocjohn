import { describe, it, expect, beforeEach } from 'vitest';
import { ColetorDeRuntime } from './collector';

let c: ColetorDeRuntime;

beforeEach(() => {
  c = new ColetorDeRuntime();
  c.iniciar(1000, 'build-teste');
});

describe('instantâneo', () => {
  it('nasce vazio e coerente', () => {
    const s = c.instantaneo(1000);
    expect(s.formato).toBe(1);
    expect(s.build).toBe('build-teste');
    expect(s.componentes).toEqual([]);
    expect(s.vazamentos).toEqual({ instancias: 0, timers: 0, listeners: 0, assinaturas: 0 });
  });

  it('conta o tempo desde o início, não desde a época', () => {
    expect(c.instantaneo(4500).desdeOCarregamento).toBe(3500);
  });

  it('ordena componentes por nome, para dois instantâneos serem comparáveis', () => {
    c.conectou('zebra');
    c.conectou('alfa');
    expect(c.instantaneo(1000).componentes.map((x) => x.nome)).toEqual(['alfa', 'zebra']);
  });
});

describe('vazamentos — o número que importa', () => {
  it('abrir e fechar na mesma medida não vaza', () => {
    c.conectou('a');
    c.timerCriado('a');
    c.listenerCriado('a');
    c.assinou('a');
    c.desconectou('a');
    c.timerEncerrado('a');
    c.listenerEncerrado('a');
    c.desassinou('a');
    expect(c.instantaneo(1000).vazamentos).toEqual({
      instancias: 0, timers: 0, listeners: 0, assinaturas: 0,
    });
  });

  it('o que abre e não fecha aparece', () => {
    c.conectou('a');
    c.conectou('a');
    c.desconectou('a');
    c.timerCriado('a');
    const v = c.instantaneo(1000).vazamentos;
    expect(v.instancias).toBe(1);
    expect(v.timers).toBe(1);
  });

  it('soma o vazamento de todos os componentes', () => {
    c.timerCriado('a');
    c.timerCriado('b');
    c.timerEncerrado('b');
    expect(c.instantaneo(1000).vazamentos.timers).toBe(1);
  });

  it('fechar mais do que abriu não vira número negativo enganoso', () => {
    // Pode acontecer com timeout que dispara e depois é limpo por engano.
    c.timerCriado('a');
    c.timerEncerrado('a');
    c.timerEncerrado('a');
    // O valor fica negativo de propósito: esconder isso mascararia um defeito
    // de contabilidade no ponto de coleta.
    expect(c.instantaneo(1000).vazamentos.timers).toBe(-1);
  });
});

describe('render', () => {
  it('acumula total, soma e guarda o pior', () => {
    c.renderizou('a', 5);
    c.renderizou('a', 20);
    c.renderizou('a', 3);
    const r = c.instantaneo(1000).componentes[0]!.render;
    expect(r.total).toBe(3);
    expect(r.duracaoTotal).toBe(28);
    expect(r.ultima).toBe(3);
    expect(r.pior).toBe(20);
  });
});

describe('requisições', () => {
  it('separa falha de sucesso e guarda a pior duração', () => {
    c.requisicao('a', 100, true);
    c.requisicao('a', 900, false);
    const r = c.instantaneo(1000).componentes[0]!.requisicoes;
    expect(r.total).toBe(2);
    expect(r.falhas).toBe(1);
    expect(r.pior).toBe(900);
  });
});

describe('memória', () => {
  it('crescimento é a diferença entre a primeira e a última amostra', () => {
    c.memoriaAmostrada({ em: 0, usado: 1000, limite: 9999 });
    c.memoriaAmostrada({ em: 5000, usado: 1500, limite: 9999 });
    c.memoriaAmostrada({ em: 10000, usado: 1800, limite: 9999 });
    const m = c.instantaneo(1000).memoria;
    expect(m.amostras).toBe(3);
    expect(m.crescimento).toBe(800);
  });

  it('sem amostra, crescimento é zero e não há campos inventados', () => {
    const m = c.instantaneo(1000).memoria;
    expect(m.amostras).toBe(0);
    expect(m.crescimento).toBe(0);
    expect(m.primeira).toBeUndefined();
  });

  it('descarta as mais antigas em vez de crescer sem limite', () => {
    for (let i = 0; i < 800; i++) c.memoriaAmostrada({ em: i, usado: i, limite: 1 });
    const m = c.instantaneo(1000).memoria;
    expect(m.amostras).toBe(720);
    expect(m.primeira?.usado).toBe(80); // as 80 primeiras saíram
  });
});

describe('tarefas longas', () => {
  it('soma e guarda a pior', () => {
    c.tarefaLonga({ em: 10, duracao: 60 });
    c.tarefaLonga({ em: 20, duracao: 140 });
    const t = c.instantaneo(1000).tarefasLongas;
    expect(t.total).toBe(2);
    expect(t.duracaoTotal).toBe(200);
    expect(t.pior).toBe(140);
  });
});

describe('zerar', () => {
  it('limpa tudo, para um novo ciclo de medição', () => {
    c.conectou('a');
    c.memoriaAmostrada({ em: 0, usado: 1, limite: 2 });
    c.tarefaLonga({ em: 0, duracao: 99 });
    c.zerar();
    const s = c.instantaneo(1000);
    expect(s.componentes).toEqual([]);
    expect(s.memoria.amostras).toBe(0);
    expect(s.tarefasLongas.total).toBe(0);
  });
});
