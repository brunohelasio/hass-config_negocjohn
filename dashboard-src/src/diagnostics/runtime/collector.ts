/**
 * Coletor de métricas de runtime — o núcleo da Fase 6.0.
 *
 * Antes de otimizar é preciso ter número inicial. Sem baseline, "melhorou" vira
 * opinião. Este arquivo é o depósito e a aritmética; quem alimenta são os
 * pontos de coleta (`probe.ts`, `observers.ts`).
 *
 * Três regras que o desenho segue, e que existem por causa de uma tentativa
 * anterior que falhou:
 *
 *   1. **Nada de efeito colateral no escopo do módulo.** Importar este arquivo
 *      não cria timer, não observa nada, não mede nada. Quem liga é quem chama
 *      `iniciarObservadores()`. A tentativa anterior criava um `setInterval` no
 *      import e nunca o limpava — um módulo de detectar vazamento vazando.
 *   2. **Contadores em pares.** Todo recurso tem `criados` e `encerrados`; o
 *      que importa é a diferença voltar a zero depois de N navegações. Contagem
 *      absoluta não é meta.
 *   3. **Puro e testável.** Sem DOM, sem `window`. O que precisa de navegador
 *      vive em `observers.ts`.
 */

/** Contagem de um recurso que abre e fecha. */
export interface ParDeRecurso {
  criados: number;
  encerrados: number;
}

export interface MetricaDeRender {
  /** Quantas vezes o componente renderizou. */
  total: number;
  /** Soma das durações, em ms. */
  duracaoTotal: number;
  /** Última duração, em ms. */
  ultima: number;
  /** Maior duração já vista — é ela que trava a interface. */
  pior: number;
}

export interface MetricaDeComponente {
  nome: string;
  /** Instâncias vivas agora. Deve voltar ao inicial depois de navegar. */
  instancias: ParDeRecurso;
  render: MetricaDeRender;
  timers: ParDeRecurso;
  listeners: ParDeRecurso;
  assinaturas: ParDeRecurso;
  requisicoes: {
    total: number;
    falhas: number;
    duracaoTotal: number;
    pior: number;
  };
}

export interface AmostraDeMemoria {
  /** ms desde o início da página. */
  em: number;
  /** Heap usado, em bytes. */
  usado: number;
  limite: number;
}

export interface TarefaLonga {
  em: number;
  duracao: number;
}

export interface InstantaneoDeRuntime {
  /** Versão do formato — para comparar entre builds sem ambiguidade. */
  formato: 1;
  build: string;
  capturadoEm: string;
  /** ms desde o carregamento da página. */
  desdeOCarregamento: number;
  componentes: MetricaDeComponente[];
  memoria: {
    amostras: number;
    primeira?: AmostraDeMemoria;
    ultima?: AmostraDeMemoria;
    /** Crescimento entre a primeira e a última amostra, em bytes. */
    crescimento: number;
  };
  tarefasLongas: {
    total: number;
    duracaoTotal: number;
    pior: number;
  };
  /** Soma de tudo que abriu e não fechou. Zero é o alvo depois de navegar. */
  vazamentos: {
    instancias: number;
    timers: number;
    listeners: number;
    assinaturas: number;
  };
}

function parVazio(): ParDeRecurso {
  return { criados: 0, encerrados: 0 };
}

function componenteVazio(nome: string): MetricaDeComponente {
  return {
    nome,
    instancias: parVazio(),
    render: { total: 0, duracaoTotal: 0, ultima: 0, pior: 0 },
    timers: parVazio(),
    listeners: parVazio(),
    assinaturas: parVazio(),
    requisicoes: { total: 0, falhas: 0, duracaoTotal: 0, pior: 0 },
  };
}

/** Quantas amostras de memória e tarefas longas guardar. */
const TETO_AMOSTRAS = 720; // 1h a cada 5s
const TETO_TAREFAS = 200;

export class ColetorDeRuntime {
  private readonly componentes = new Map<string, MetricaDeComponente>();
  private readonly memoria: AmostraDeMemoria[] = [];
  private readonly tarefas: TarefaLonga[] = [];
  private inicio = 0;
  private buildId = 'desconhecido';

  /** Marca zero do relógio. Chamado uma vez, por quem inicia os observadores. */
  iniciar(agora: number, build: string): void {
    this.inicio = agora;
    this.buildId = build;
  }

  private de(nome: string): MetricaDeComponente {
    let m = this.componentes.get(nome);
    if (!m) {
      m = componenteVazio(nome);
      this.componentes.set(nome, m);
    }
    return m;
  }

  // ── Pontos de coleta ──────────────────────────────────────────────────────

  conectou(nome: string): void {
    this.de(nome).instancias.criados++;
  }

  desconectou(nome: string): void {
    this.de(nome).instancias.encerrados++;
  }

  renderizou(nome: string, duracao: number): void {
    const r = this.de(nome).render;
    r.total++;
    r.duracaoTotal += duracao;
    r.ultima = duracao;
    if (duracao > r.pior) r.pior = duracao;
  }

  timerCriado(nome: string): void {
    this.de(nome).timers.criados++;
  }

  timerEncerrado(nome: string): void {
    this.de(nome).timers.encerrados++;
  }

  listenerCriado(nome: string): void {
    this.de(nome).listeners.criados++;
  }

  listenerEncerrado(nome: string): void {
    this.de(nome).listeners.encerrados++;
  }

  assinou(nome: string): void {
    this.de(nome).assinaturas.criados++;
  }

  desassinou(nome: string): void {
    this.de(nome).assinaturas.encerrados++;
  }

  requisicao(nome: string, duracao: number, ok: boolean): void {
    const r = this.de(nome).requisicoes;
    r.total++;
    if (!ok) r.falhas++;
    r.duracaoTotal += duracao;
    if (duracao > r.pior) r.pior = duracao;
  }

  memoriaAmostrada(amostra: AmostraDeMemoria): void {
    this.memoria.push(amostra);
    if (this.memoria.length > TETO_AMOSTRAS) this.memoria.shift();
  }

  tarefaLonga(tarefa: TarefaLonga): void {
    this.tarefas.push(tarefa);
    if (this.tarefas.length > TETO_TAREFAS) this.tarefas.shift();
  }

  // ── Leitura ───────────────────────────────────────────────────────────────

  /**
   * Fotografia do estado atual.
   *
   * `vazamentos` é a leitura que importa: quanto abriu e não fechou. Depois de
   * navegar N vezes entre as seções e voltar, esses números têm de voltar ao
   * que eram — é o critério de aceite da Fase 6.1.
   */
  instantaneo(agora: number): InstantaneoDeRuntime {
    const componentes = [...this.componentes.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );

    const soma = (f: (c: MetricaDeComponente) => ParDeRecurso) =>
      componentes.reduce((t, c) => t + f(c).criados - f(c).encerrados, 0);

    const primeira = this.memoria[0];
    const ultima = this.memoria[this.memoria.length - 1];

    return {
      formato: 1,
      build: this.buildId,
      capturadoEm: new Date().toISOString(),
      desdeOCarregamento: Math.round(agora - this.inicio),
      componentes,
      memoria: {
        amostras: this.memoria.length,
        ...(primeira ? { primeira } : {}),
        ...(ultima ? { ultima } : {}),
        crescimento: primeira && ultima ? ultima.usado - primeira.usado : 0,
      },
      tarefasLongas: {
        total: this.tarefas.length,
        duracaoTotal: Math.round(this.tarefas.reduce((t, x) => t + x.duracao, 0)),
        pior: Math.round(this.tarefas.reduce((p, x) => Math.max(p, x.duracao), 0)),
      },
      vazamentos: {
        instancias: soma((c) => c.instancias),
        timers: soma((c) => c.timers),
        listeners: soma((c) => c.listeners),
        assinaturas: soma((c) => c.assinaturas),
      },
    };
  }

  /** Zera tudo. Usado antes de um ciclo de medição. */
  zerar(): void {
    this.componentes.clear();
    this.memoria.length = 0;
    this.tarefas.length = 0;
  }
}

/**
 * A instância única.
 *
 * Exportada como constante, e não criada num efeito de módulo — importar não
 * liga nada. Ver a regra 1 no topo do arquivo.
 */
export const coletor = new ColetorDeRuntime();
