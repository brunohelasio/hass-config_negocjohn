import { describe, it, expect, beforeEach } from 'vitest';
import { ColetorDeRuntime } from './collector';

let c: ColetorDeRuntime;

beforeEach(() => {
  c = new ColetorDeRuntime();
  c.iniciar(1000, 'build-teste');
});

const MB = 1024 * 1024;

describe('instantâneo', () => {
  it('nasce vazio e coerente', () => {
    const s = c.instantaneo(1000);
    expect(s.formato).toBe(2);
    expect(s.build).toBe('build-teste');
    expect(s.componentes).toEqual([]);
    expect(s.vazamentos).toEqual({ timers: 0, listeners: 0, assinaturas: 0 });
    expect(s.vivos).toBe(0);
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
      timers: 0, listeners: 0, assinaturas: 0,
    });
  });

  it('o que abre e não fecha aparece', () => {
    c.timerCriado('a');
    c.listenerCriado('a');
    const v = c.instantaneo(1000).vazamentos;
    expect(v.timers).toBe(1);
    expect(v.listeners).toBe(1);
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

  /**
   * A correção da 6.1. O painel do tablet mostrava "Aberto e não fechado: 8"
   * com os 8 ladrilhos da Home montados e visíveis — tudo certo, alarme tocando.
   */
  it('componente montado NÃO é vazamento', () => {
    for (let i = 0; i < 8; i++) c.conectou('bruno-room-tile');
    const s = c.instantaneo(1000);
    expect(s.vazamentos).toEqual({ timers: 0, listeners: 0, assinaturas: 0 });
    expect(s.vivos).toBe(8);
    expect(s.componentes[0]!.vivos).toBe(8);
  });
});

describe('ciclo de navegação', () => {
  it('sem marca, o instantâneo não inventa a comparação', () => {
    expect(c.instantaneo(1000).desdeAMarca).toBeUndefined();
  });

  it('navegar e voltar deixa tudo zerado em relação à marca', () => {
    for (let i = 0; i < 8; i++) c.conectou('tile'); // a Home já montada
    c.marcar(1000);

    // 50 idas e voltas a uma subview, cada uma com timer e listener próprios.
    for (let i = 0; i < 50; i++) {
      c.conectou('subview');
      c.timerCriado('subview');
      c.listenerCriado('subview');
      c.desconectou('subview');
      c.timerEncerrado('subview');
      c.listenerEncerrado('subview');
    }

    expect(c.instantaneo(2000).desdeAMarca).toEqual({
      instancias: 0, timers: 0, listeners: 0, assinaturas: 0,
    });
  });

  it('uma navegação que esquece o timer aparece na diferença', () => {
    c.marcar(1000);
    c.conectou('subview');
    c.timerCriado('subview');
    c.desconectou('subview'); // saiu da tela, mas o timer ficou
    expect(c.instantaneo(2000).desdeAMarca).toEqual({
      instancias: 0, timers: 1, listeners: 0, assinaturas: 0,
    });
  });

  it('a marca conta o que já estava montado, não o zero absoluto', () => {
    for (let i = 0; i < 8; i++) c.conectou('tile');
    expect(c.marcar(1000).instancias).toBe(8);
    expect(c.instantaneo(1000).desdeAMarca!.instancias).toBe(0);
  });

  it('limparMarca remove a comparação', () => {
    c.marcar(1000);
    c.limparMarca();
    expect(c.instantaneo(1000).desdeAMarca).toBeUndefined();
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

  it('sem motivo informado, a lista de motivos fica vazia', () => {
    c.renderizou('a', 5);
    expect(c.instantaneo(1000).componentes[0]!.motivos).toEqual([]);
  });

  it('agrupa por motivo e ordena do maior ofensor para o menor', () => {
    c.renderizou('a', 1, 'sensor.temp');
    c.renderizou('a', 1, 'sensor.temp');
    c.renderizou('a', 1, 'sensor.temp');
    c.renderizou('a', 1, 'light.x');
    const m = c.instantaneo(1000).componentes[0]!.motivos;
    expect(m[0]).toEqual({ motivo: 'sensor.temp', total: 3 });
    expect(m[1]).toEqual({ motivo: 'light.x', total: 1 });
  });

  it('mostra só os maiores ofensores, não a lista inteira', () => {
    for (let i = 0; i < 10; i++) c.renderizou('a', 1, `motivo-${i}`);
    expect(c.instantaneo(1000).componentes[0]!.motivos).toHaveLength(4);
  });

  it('motivo novo depois do teto vira "outros" — o coletor não pode vazar', () => {
    for (let i = 0; i < 24; i++) c.renderizou('a', 1, `m${i}`);
    for (let i = 0; i < 100; i++) c.renderizou('a', 1, `novo-${i}`);
    const motivos = c.instantaneo(1000).componentes[0]!.motivos;
    expect(motivos[0]).toEqual({ motivo: 'outros', total: 100 });
  });

  it('motivo já conhecido continua contando depois do teto', () => {
    for (let i = 0; i < 24; i++) c.renderizou('a', 1, `m${i}`);
    for (let i = 0; i < 5; i++) c.renderizou('a', 1, 'm0');
    const m = c.instantaneo(1000).componentes[0]!.motivos;
    expect(m.find((x) => x.motivo === 'm0')!.total).toBe(6);
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

  it('guarda piso e pico mesmo depois de a janela descartar as amostras', () => {
    c.memoriaAmostrada({ em: 0, usado: 5, limite: 1 });
    for (let i = 0; i < 800; i++) c.memoriaAmostrada({ em: i, usado: 100 + i, limite: 1 });
    const m = c.instantaneo(1000).memoria;
    expect(m.piso).toBe(5); // a amostra já saiu da janela, o piso não
    expect(m.pico).toBe(899);
  });

  /**
   * O erro que a baseline do tablet quase provocou: 9,5 MB e depois 110,6 MB
   * parecem vazamento, mas são as duas pontas de um dente-de-serra de coleta de
   * lixo. O piso é que decide.
   */
  it('dente-de-serra com piso estável NÃO é vazamento', () => {
    for (let i = 0; i < 30; i++) {
      c.memoriaAmostrada({ em: i * 5000, usado: (i % 2 === 0 ? 10 : 110) * MB, limite: 500 * MB });
    }
    const m = c.instantaneo(1000).memoria;
    expect(m.crescimentoDoPiso).toBe(0);
    expect(m.veredito).toContain('Piso estável');
  });

  it('piso que sobe é chamado de retenção', () => {
    // A subida precisa CONTINUAR no último terço: subir e estabilizar é custo
    // de partida, não vazamento. Ver o bloco "patamar não é vazamento".
    for (let i = 0; i < 30; i++) {
      const piso = 10 * MB + i * 3 * MB;
      c.memoriaAmostrada({ em: i * 5000, usado: (i % 2 === 0 ? piso : piso + 80 * MB), limite: 500 * MB });
    }
    const m = c.instantaneo(1000).memoria;
    expect(m.crescimentoDoPiso).toBeGreaterThan(10 * MB);
    expect(m.veredito).toContain('retenção');
  });

  it('com poucas amostras, não arrisca veredito', () => {
    c.memoriaAmostrada({ em: 0, usado: 10 * MB, limite: 500 * MB });
    c.memoriaAmostrada({ em: 5000, usado: 200 * MB, limite: 500 * MB });
    expect(c.instantaneo(1000).memoria.veredito).toContain('ainda não significa');
  });

  /**
   * A armadilha que enganou QUATRO leituras desta métrica. O navegador quantiza
   * `performance.memory` e só a atualiza de tempos em tempos: ela fica parada
   * num valor por muitos minutos e então salta. Com um valor só, piso, pico e
   * crescimento são o mesmo número — e "estável" seria conclusão tirada de nada.
   */
  it('muitas amostras com um valor só NÃO autorizam veredito', () => {
    for (let i = 0; i < 40; i++) {
      c.memoriaAmostrada({ em: i * 5000, usado: 9.5 * MB, limite: 500 * MB });
    }
    const m = c.instantaneo(1000).memoria;
    expect(m.degraus).toBe(1);
    expect(m.crescimentoDoPiso).toBe(0);
    expect(m.veredito).toContain('Sem informação');
  });

  it('conta os degraus distintos, não as amostras', () => {
    for (let i = 0; i < 40; i++) {
      c.memoriaAmostrada({ em: i * 5000, usado: (i < 20 ? 9.5 : 110.6) * MB, limite: 500 * MB });
    }
    const m = c.instantaneo(1000).memoria;
    expect(m.amostras).toBe(40);
    expect(m.degraus).toBe(2);
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

  /**
   * A baseline mostrou a pior tarefa (504 ms) idêntica em 568 s e em 1391 s:
   * aconteceu na carga e nunca mais. Somar tudo esconde isso.
   */
  it('separa o custo de partida do custo de uso', () => {
    c.tarefaLonga({ em: 1_000, duracao: 500 });
    c.tarefaLonga({ em: 20_000, duracao: 80 });
    c.tarefaLonga({ em: 90_000, duracao: 60 });
    const t = c.instantaneo(1000 + 630_000).tarefasLongas; // 10 min de sessão
    expect(t.naCarga).toBe(2);
    expect(t.depoisDaCarga).toBe(1);
    expect(t.porMinuto).toBe(0.1);
  });

  it('antes de a carga terminar, o ritmo é zero e não uma divisão por zero', () => {
    c.tarefaLonga({ em: 1_000, duracao: 500 });
    expect(c.instantaneo(1000 + 10_000).tarefasLongas.porMinuto).toBe(0);
  });

  it('o total não estaciona quando a janela enche', () => {
    for (let i = 0; i < 500; i++) c.tarefaLonga({ em: 60_000 + i, duracao: 55 });
    expect(c.instantaneo(1000 + 600_000).tarefasLongas.total).toBe(500);
  });
});

describe('zerar', () => {
  it('limpa tudo, para um novo ciclo de medição', () => {
    c.conectou('a');
    c.memoriaAmostrada({ em: 0, usado: 1, limite: 2 });
    c.tarefaLonga({ em: 0, duracao: 99 });
    c.marcar(1000);
    c.zerar();
    const s = c.instantaneo(1000);
    expect(s.componentes).toEqual([]);
    expect(s.memoria.amostras).toBe(0);
    expect(s.memoria.piso).toBe(0);
    expect(s.tarefasLongas.total).toBe(0);
    expect(s.desdeAMarca).toBeUndefined();
  });
});

describe('memória — patamar não é vazamento', () => {
  /**
   * Duas baselines de 2026-08-07 se contradisseram: uma colhida já no patamar
   * disse "estável", outra colhida desde a carga disse "retenção" — e as duas
   * terminaram nos mesmos ~120 MB. O que decide é se a subida CONTINUA no fim.
   */
  it('sobe na carga e estabiliza — é custo de partida', () => {
    const c2 = new ColetorDeRuntime();
    c2.iniciar(0, 'b');
    // Primeiro terço sobe de 20 para 120 MB; os dois terços seguintes ficam lá.
    for (let i = 0; i < 30; i++) {
      const piso = i < 10 ? (20 + i * 10) * MB : 120 * MB;
      c2.memoriaAmostrada({ em: i * 5000, usado: piso + (i % 2) * MB, limite: 500 * MB });
    }
    const m = c2.instantaneo(1000).memoria;
    expect(m.crescimentoDoPiso).toBeGreaterThan(10 * MB);
    expect(m.veredito).toContain('custo de partida');
  });

  it('sobe sem parar — é retenção', () => {
    const c2 = new ColetorDeRuntime();
    c2.iniciar(0, 'b');
    for (let i = 0; i < 30; i++) {
      c2.memoriaAmostrada({ em: i * 5000, usado: (20 + i * 5) * MB, limite: 500 * MB });
    }
    const m = c2.instantaneo(1000).memoria;
    expect(m.veredito).toContain('AINDA sobe');
  });
});
