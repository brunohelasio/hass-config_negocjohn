import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  CADENCIA,
  ESCALONAMENTO,
  FOLGA_MINIMA,
  MotorDeInstantaneos,
  PRAZO,
  RECUO_MAXIMO,
  RECUO_SEM_IMAGEM,
  comSelo,
  type AlvoDeCamera,
  type Carregador,
  type ResultadoDoCarregador,
  type Agenda,
  type Desfecho,
} from './snapshot-engine';

/**
 * Relógio e agenda falsos.
 *
 * O tempo anda na mão. Sem isso, testar "espera `cadência − duração`" exigiria
 * esperar de verdade, e a política tem seis regras que interagem — validá-la no
 * tablet seria adivinhação.
 */
class AgendaFalsa implements Agenda {
  private t = 0;
  private proximoId = 1;
  private tarefas = new Map<number, { em: number; fn: () => void }>();

  agendar(fn: () => void, ms: number): number {
    const id = this.proximoId++;
    this.tarefas.set(id, { em: this.t + ms, fn });
    return id;
  }

  cancelar(id: number): void {
    this.tarefas.delete(id);
  }

  agora(): number {
    return this.t;
  }

  /** Avança o tempo, disparando o que vencer no caminho, em ordem. */
  avancar(ms: number): void {
    const destino = this.t + ms;
    for (;;) {
      let proxima: { id: number; em: number; fn: () => void } | undefined;
      for (const [id, tarefa] of this.tarefas) {
        if (tarefa.em > destino) continue;
        if (!proxima || tarefa.em < proxima.em) proxima = { id, ...tarefa };
      }
      if (!proxima) break;
      this.tarefas.delete(proxima.id);
      this.t = proxima.em;
      proxima.fn();
    }
    this.t = destino;
  }

  get pendentes(): number {
    return this.tarefas.size;
  }
}

/** Carregador falso: registra as URLs pedidas e deixa o teste decidir o desfecho. */
class CarregadorFalso {
  pedidos: { url: string; terminou: (resultado: ResultadoDoCarregador) => void; abortado: boolean }[] = [];

  readonly fn: Carregador = (url, terminou) => {
    const pedido = { url, terminou, abortado: false };
    this.pedidos.push(pedido);
    return () => {
      pedido.abortado = true;
    };
  };

  get emAberto() {
    return this.pedidos.filter((p) => !p.abortado);
  }

  /** Responde ao pedido de índice `i`. */
  responder(i: number, ok = true): void {
    this.pedidos[i]?.terminou(ok);
  }

  ultimo() {
    return this.pedidos[this.pedidos.length - 1];
  }

  urlsDe(entityId: string): string[] {
    return this.pedidos.filter((p) => p.url.includes(entityId)).map((p) => p.url);
  }
}

function alvo(id: string, prioridade: AlvoDeCamera['prioridade'] = 'principal'): AlvoDeCamera {
  return { entityId: id, base: `/api/camera_proxy/${id}`, prioridade };
}

let agenda: AgendaFalsa;
let carregador: CarregadorFalso;
let quadros: { entityId: string; primeiro: boolean }[];
let medidas: { entityId: string; duracao: number; desfecho: Desfecho; primeiro: boolean }[];

function novoMotor(): MotorDeInstantaneos {
  return new MotorDeInstantaneos({
    agenda,
    carregador: carregador.fn,
    aoCarregar: (q) => quadros.push({ entityId: q.entityId, primeiro: q.primeiro }),
    aoMedir: (entityId, duracao, desfecho, primeiro) =>
      medidas.push({ entityId, duracao, desfecho, primeiro }),
  });
}

beforeEach(() => {
  agenda = new AgendaFalsa();
  carregador = new CarregadorFalso();
  quadros = [];
  medidas = [];
});

describe('comSelo', () => {
  it('acrescenta o selo respeitando query existente', () => {
    expect(comSelo('/a/b', 7)).toBe('/a/b?bruno_t=7');
    expect(comSelo('/a/b?token=x', 7)).toBe('/a/b?token=x&bruno_t=7');
  });

  it('url vazia continua vazia', () => {
    expect(comSelo('', 7)).toBe('');
  });
});

describe('ciclo básico', () => {
  it('não pede nada antes de iniciar', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    agenda.avancar(60_000);
    expect(carregador.pedidos).toHaveLength(0);
  });

  it('parte assim que inicia', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    expect(carregador.pedidos).toHaveLength(1);
  });

  it('escalona a partida das câmeras', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a'), alvo('camera.b'), alvo('camera.c')]);
    m.iniciar();

    agenda.avancar(0);
    expect(carregador.pedidos).toHaveLength(1);
    agenda.avancar(ESCALONAMENTO);
    expect(carregador.pedidos).toHaveLength(2);
    agenda.avancar(ESCALONAMENTO);
    expect(carregador.pedidos).toHaveLength(3);
  });

  it('o primeiro quadro é marcado como primeiro, os seguintes não', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, true);

    agenda.avancar(CADENCIA.principal);
    carregador.responder(1, true);

    expect(quadros.map((q) => q.primeiro)).toEqual([true, false]);
  });

  it('guarda o tempo do primeiro quadro — é a métrica nº 1 do aceite', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(1200);
    carregador.responder(0, true);

    expect(m.metricas()[0]!.primeiroQuadro).toBe(1200);
  });
});

describe('regra 1 — nunca duas requisições em voo para a mesma câmera', () => {
  /**
   * A regressão que este motor veio corrigir: cadência de 6,5 s com carga de
   * 6,2 s mantinha uma requisição em voo praticamente o tempo todo.
   */
  it('não abre um segundo pedido enquanto o primeiro não responde', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);

    // Bem além de várias cadências, mas ainda dentro do prazo — o pedido segue
    // em voo e NENHUM outro é aberto. (Passado o prazo o voo se encerra por
    // conta própria: é a regra 3, testada adiante.)
    agenda.avancar(PRAZO - 1);
    expect(carregador.pedidos).toHaveLength(1);
    expect(m.emVoo()).toBe(1);
  });

  it('atualizarAgora pula câmera com pedido em voo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);

    m.atualizarAgora();
    expect(carregador.pedidos).toHaveLength(1);
  });

  it('atualizarAgora busca já quando não há nada em voo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, true);

    m.atualizarAgora();
    expect(carregador.pedidos).toHaveLength(2);
  });
});

describe('regra 2 — período com folga mínima', () => {
  it('resposta rápida mantém o período da cadência', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(500);
    carregador.responder(0, true);

    agenda.avancar(CADENCIA.principal - 500 - 1);
    expect(carregador.pedidos).toHaveLength(1);
    agenda.avancar(1);
    expect(carregador.pedidos).toHaveLength(2);
  });

  it('resposta lenta garante a folga em vez de emendar', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(6200); // a média medida no tablet
    carregador.responder(0, true);

    agenda.avancar(FOLGA_MINIMA.principal - 1);
    expect(carregador.pedidos).toHaveLength(1);
    agenda.avancar(1);
    expect(carregador.pedidos).toHaveLength(2);
  });

  it('o PIP tem cadência própria, mais lenta', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a', 'secundaria')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, true);

    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(1);
    agenda.avancar(CADENCIA.secundaria - CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(2);
  });

  it('quadro verde nao substitui o ultimo quadro valido e conta como falha', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.pedidos[0]?.terminou('quadro-verde');

    expect(quadros).toHaveLength(0);
    expect(medidas.at(-1)).toMatchObject({ desfecho: 'quadro-verde', primeiro: false });
    expect(m.metricas()[0]).toMatchObject({ quadros: 0, falhas: 1 });
  });
});

describe('regra 3 — prazo com cancelamento', () => {
  it('estoura o prazo, conta falha e ABORTA o pedido', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);

    agenda.avancar(PRAZO);
    expect(medidas.at(-1)).toMatchObject({ desfecho: 'prazo' });
    expect(carregador.pedidos[0]!.abortado).toBe(true);
    expect(m.emVoo()).toBe(0);
  });

  it('resposta que chega depois do prazo não conta duas vezes', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(PRAZO);

    carregador.responder(0, true); // o servidor respondeu tarde
    expect(medidas).toHaveLength(1);
    expect(quadros).toHaveLength(0);
  });

  it('não estoura prazo quando a resposta chega antes', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(1000);
    carregador.responder(0, true);

    agenda.avancar(PRAZO);
    expect(medidas.filter((x) => x.desfecho === 'prazo')).toHaveLength(0);
  });
});

describe('o prazo não pode gerar falsa falha', () => {
  /**
   * A regressão de 2026-08-07, medida no PC: com prazo de 8 s, 10 das 21
   * requisições "falharam" — TODAS em ~8.001 ms. Não eram falhas das câmeras;
   * era o prazo cortando requisições a caminho. A câmera do Office nunca chegou
   * a renderizar por isso.
   *
   * O primeiro quadro legítimo nestas câmeras leva de 3,9 s a 7,7 s.
   */
  it('uma resposta de 10 s é sucesso, não falha', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(10_000);
    carregador.responder(0, true);

    const x = m.metricas()[0]!;
    expect(x.quadros).toBe(1);
    expect(x.falhas).toBe(0);
    expect(x.primeiroQuadro).toBe(10_000);
  });

  it('o prazo cobre com folga a faixa normal medida (3,9 s a 7,7 s)', () => {
    expect(PRAZO).toBeGreaterThan(7700 * 2);
  });
});

describe('atraso inicial — o primeiro quadro é do elemento de imagem', () => {
  /**
   * Sem isto, o motor disparava uma requisição no mesmo instante em que o
   * elemento de imagem disparava a dele: duas requisições lentas para a MESMA
   * câmera, competindo, num servidor que leva de 4 a 8 s por quadro.
   */
  it('não busca nada antes do atraso configurado', () => {
    const m = new MotorDeInstantaneos({
      agenda,
      carregador: carregador.fn,
      atrasoInicial: CADENCIA.principal,
    });
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();

    agenda.avancar(CADENCIA.principal - 1);
    expect(carregador.pedidos).toHaveLength(0);
    agenda.avancar(1);
    expect(carregador.pedidos).toHaveLength(1);
  });

  it('o escalonamento continua valendo depois do atraso', () => {
    const m = new MotorDeInstantaneos({
      agenda,
      carregador: carregador.fn,
      atrasoInicial: 1000,
    });
    m.definirAlvos([alvo('camera.a'), alvo('camera.b')]);
    m.iniciar();

    agenda.avancar(1000);
    expect(carregador.pedidos).toHaveLength(1);
    agenda.avancar(ESCALONAMENTO);
    expect(carregador.pedidos).toHaveLength(2);
  });

  it('o atraso vale só para a primeira busca, não para as seguintes', () => {
    const m = new MotorDeInstantaneos({
      agenda,
      carregador: carregador.fn,
      atrasoInicial: 10_000,
    });
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(10_000);
    carregador.responder(0, true);

    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(2);
  });
});

describe('regra 4 — recuo exponencial', () => {
  it('a primeira falha não muda o ritmo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, false);

    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(2);
  });

  // Estes dois exigem que a câmera JÁ tenha mostrado um quadro: com imagem na
  // tela o recuo é agressivo; sem imagem ele é contido de propósito (ver o
  // bloco "recuo não pune quem ainda não viu imagem nenhuma").
  it('falhas seguidas espaçam as tentativas', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, true); // já há imagem na tela
    agenda.avancar(CADENCIA.principal);
    carregador.responder(1, false);
    agenda.avancar(CADENCIA.principal);
    carregador.responder(2, false); // segunda falha seguida

    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(3); // ainda recuando
    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(4);
  });

  it('câmera que caiu depois de funcionar não é martelada', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, true); // funcionou uma vez, e depois caiu

    for (let i = 0; i < 12; i++) {
      agenda.avancar(RECUO_MAXIMO);
      const pedido = carregador.ultimo();
      if (pedido && !pedido.abortado) pedido.terminou(false);
    }

    // Em 12 minutos de tempo simulado, uma câmera morta a 6,5s daria ~110
    // tentativas. Com recuo, fica na casa das dezenas.
    expect(carregador.pedidos.length).toBeLessThan(20);
    expect(m.metricas()[0]!.falhasSeguidas).toBeGreaterThan(2);
  });

  it('uma resposta boa devolve a câmera ao ritmo normal', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();

    // Falha 1: responde na hora, então a espera é a cadência cheia.
    agenda.avancar(0);
    carregador.responder(0, false);
    agenda.avancar(CADENCIA.principal);

    // Falha 2: entra o recuo — a espera dobra.
    carregador.responder(1, false);
    expect(m.metricas()[0]!.falhasSeguidas).toBe(2);
    agenda.avancar(CADENCIA.principal * 2);

    // E agora responde bem.
    carregador.responder(2, true);
    expect(m.metricas()[0]!.falhasSeguidas).toBe(0);

    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(4);
  });
});

describe('recuo não pune quem ainda não viu imagem nenhuma', () => {
  /**
   * Medido no PC em 2026-08-07: a câmera do Q. Miguel falha no tempo limite do
   * PRÓPRIO Home Assistant (~10 s) em 3 de 5 tentativas. Com o recuo comum, a
   * sequência falha → 13 s → falha → 26 s levou 49 s até a primeira imagem.
   */
  it('sem quadro nenhum, tolera mais falhas antes de recuar', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();

    // Três falhas seguidas, e o ritmo ainda é o normal.
    for (let i = 0; i < 3; i++) {
      agenda.avancar(i === 0 ? 0 : CADENCIA.principal);
      carregador.responder(i, false);
    }
    expect(m.metricas()[0]!.falhasSeguidas).toBe(3);
    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(4);
  });

  it('sem quadro nenhum, o recuo tem teto baixo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    for (let i = 0; i < 8; i++) {
      agenda.avancar(RECUO_SEM_IMAGEM);
      const p = carregador.ultimo();
      if (p && !p.abortado) p.terminou(false);
    }
    // Com o teto baixo, oito tentativas cabem em ~96 s. Com o teto de 60 s, não.
    expect(carregador.pedidos.length).toBeGreaterThanOrEqual(7);
  });

  it('depois do primeiro quadro, o recuo volta a ser o longo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, true); // já há imagem na tela

    agenda.avancar(CADENCIA.principal);
    carregador.responder(1, false);
    agenda.avancar(CADENCIA.principal);
    carregador.responder(2, false); // segunda falha: já recua

    agenda.avancar(CADENCIA.principal);
    expect(carregador.pedidos).toHaveLength(3);
  });
});

describe('socorro — buscarAgora', () => {
  it('busca uma câmera na hora, sem esperar a cadência', () => {
    const m = new MotorDeInstantaneos({
      agenda,
      carregador: carregador.fn,
      atrasoInicial: CADENCIA.principal,
    });
    m.definirAlvos([alvo('camera.a'), alvo('camera.b')]);
    m.iniciar();

    m.buscarAgora('camera.a');
    expect(carregador.urlsDe('camera.a')).toHaveLength(1);
    expect(carregador.urlsDe('camera.b')).toHaveLength(0);
  });

  it('não abre um segundo pedido se já há um em voo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);

    m.buscarAgora('camera.a');
    expect(carregador.pedidos).toHaveLength(1);
  });

  it('não faz nada com o motor parado, nem com câmera desconhecida', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.buscarAgora('camera.a');
    m.iniciar();
    m.buscarAgora('camera.z');
    expect(carregador.pedidos).toHaveLength(0);
  });
});

describe('ciclo de vida', () => {
  it('parar cancela o agendado E aborta o que está em voo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a'), alvo('camera.b')]);
    m.iniciar();
    agenda.avancar(ESCALONAMENTO);
    expect(m.emVoo()).toBe(2);

    m.parar();
    expect(m.emVoo()).toBe(0);
    expect(carregador.pedidos.every((p) => p.abortado)).toBe(true);

    agenda.avancar(60_000);
    expect(carregador.pedidos).toHaveLength(2);
  });

  it('nada fica agendado depois de parar', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    carregador.responder(0, true);
    m.parar();
    expect(agenda.pendentes).toBe(0);
  });

  it('atualizarAgora não faz nada com o motor parado', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.atualizarAgora();
    expect(carregador.pedidos).toHaveLength(0);
  });
});

describe('troca de alvos', () => {
  it('câmera que sai da lista é abortada e esquecida', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a'), alvo('camera.b')]);
    m.iniciar();
    agenda.avancar(ESCALONAMENTO);

    m.definirAlvos([alvo('camera.a')]);
    expect(m.metricas().map((x) => x.entityId)).toEqual(['camera.a']);
    expect(carregador.pedidos[1]!.abortado).toBe(true);
  });

  /** O requisito "troca palco↔PIP sem remontar" do roteiro. */
  it('trocar a prioridade preserva o estado e não reinicia o ciclo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a', 'secundaria')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(800);
    carregador.responder(0, true);

    m.definirAlvos([alvo('camera.a', 'principal')]);
    const metrica = m.metricas()[0]!;
    expect(metrica.prioridade).toBe('principal');
    expect(metrica.primeiroQuadro).toBe(800);
    expect(metrica.quadros).toBe(1);
  });

  it('câmera nova entra no ciclo com o motor já ligado', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);

    m.definirAlvos([alvo('camera.a'), alvo('camera.b')]);
    agenda.avancar(ESCALONAMENTO * 2);
    expect(carregador.urlsDe('camera.b')).toHaveLength(1);
  });

  it('alvo sem base é ignorado — não vira pedido vazio', () => {
    const m = novoMotor();
    m.definirAlvos([{ entityId: 'camera.a', base: '', prioridade: 'principal' }]);
    m.iniciar();
    agenda.avancar(1000);
    expect(carregador.pedidos).toHaveLength(0);
  });
});

describe('métricas', () => {
  it('separa quadros de falhas e guarda o pior tempo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(300);
    carregador.responder(0, true);

    // A espera é `cadência − duração`, não a cadência cheia: quem responde em
    // 300 ms devolve esses 300 ms ao período.
    agenda.avancar(CADENCIA.principal - 300);
    agenda.avancar(2000);
    carregador.responder(1, false);

    const x = m.metricas()[0]!;
    expect(x.quadros).toBe(1);
    expect(x.falhas).toBe(1);
    expect(x.pior).toBe(2000);
    expect(x.ultimoDesfecho).toBe('erro');
  });

  it('cada câmera tem métrica própria — é o que responde "qual delas falha"', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.boa'), alvo('camera.ruim')]);
    m.iniciar();
    agenda.avancar(ESCALONAMENTO);
    carregador.responder(0, true);
    carregador.responder(1, false);

    const porId = Object.fromEntries(m.metricas().map((x) => [x.entityId, x]));
    expect(porId['camera.boa']!.quadros).toBe(1);
    expect(porId['camera.ruim']!.falhas).toBe(1);
  });

  it('a url pedida carrega selo novo a cada ciclo', () => {
    const m = novoMotor();
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    agenda.avancar(100);
    carregador.responder(0, true);
    agenda.avancar(CADENCIA.principal);

    const urls = carregador.urlsDe('camera.a');
    expect(urls[0]).not.toBe(urls[1]);
  });
});

describe('carregador real', () => {
  it('o padrão não é chamado quando um é injetado', () => {
    const espiao = vi.fn(() => () => {});
    const m = new MotorDeInstantaneos({ agenda, carregador: espiao });
    m.definirAlvos([alvo('camera.a')]);
    m.iniciar();
    agenda.avancar(0);
    expect(espiao).toHaveBeenCalledOnce();
  });
});
