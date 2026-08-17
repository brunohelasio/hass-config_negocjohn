/**
 * Coletor de métricas de runtime — o núcleo da Fase 6.0, corrigido na 6.1.
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
 *
 * ── O que a Fase 6.1 corrigiu, e por quê ──────────────────────────────────
 *
 * Duas baselines do tablet (568 s e 1391 s da mesma sessão) mostraram que o
 * painel mentia em dois pontos:
 *
 *   **"Aberto e não fechado: 8"** — eram os 8 ladrilhos da Home, montados e
 *   visíveis. Componente na tela não é vazamento. Somar instâncias vivas ao
 *   placar de vazamento faz o painel gritar exatamente quando está tudo bem, e
 *   um alarme que sempre toca deixa de ser lido. Instâncias vivas viraram
 *   informação (`vivos`); vazamento agora é só o que ninguém deveria estar
 *   segurando: timer, listener e assinatura.
 *
 *   **Memória "de 9,5 MB para 110,6 MB"** — `usedJSHeapSize` sobe e despenca a
 *   cada coleta de lixo. Comparar a primeira amostra com a última mede a fase da
 *   serra, não a tendência: 9,5 MB pode ser logo depois de uma coleta e 110,6
 *   logo antes da próxima. O que denuncia vazamento é o **piso** — o mínimo
 *   depois de cada coleta. Piso estável com pico oscilando é saudável; piso
 *   subindo é vazamento. As amostras já estavam guardadas; faltava a aritmética.
 *
 * E acrescentou o que faltava para a fase seguinte: **atribuição de render**. A
 * 6.0 mediu 3.328 renders de ladrilho em 14 minutos e não soube dizer qual
 * entidade os causou. Agora cada render pode chegar com o motivo, e o painel
 * mostra os maiores ofensores.
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

/** Quem causou renders, e quantos. Ordenado do maior para o menor. */
export interface MotivoDeRender {
  motivo: string;
  total: number;
}

export interface MetricaDeComponente {
  nome: string;
  /**
   * Instâncias criadas e encerradas. A diferença é quantas estão vivas — o que
   * é normal para componente na tela. O sinal de vazamento não é esta diferença
   * ser maior que zero, e sim ela **não voltar ao valor da marca** depois de um
   * ciclo de navegação.
   */
  instancias: ParDeRecurso;
  /** Instâncias vivas agora — `criados - encerrados`, já calculado. */
  vivos: number;
  render: MetricaDeRender;
  /** Os motivos mais frequentes de render. Vazio se o componente não os informa. */
  motivos: MotivoDeRender[];
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

/** Contagem de recursos num instante — usada como marca do ciclo de navegação. */
export interface ContagemDeRecursos {
  instancias: number;
  timers: number;
  listeners: number;
  assinaturas: number;
}

export interface LeituraDeMemoria {
  amostras: number;
  primeira?: AmostraDeMemoria;
  ultima?: AmostraDeMemoria;
  /** Crescimento entre a primeira e a última amostra, em bytes. Enganoso sozinho. */
  crescimento: number;
  /** Menor heap já visto — o piso depois de uma coleta de lixo. */
  piso: number;
  /** Maior heap já visto. */
  pico: number;
  /** Piso do primeiro terço das amostras. */
  pisoInicial: number;
  /** Piso do último terço. */
  pisoFinal: number;
  /** `pisoFinal - pisoInicial`. É ESTE o número que denuncia vazamento. */
  crescimentoDoPiso: number;
  /**
   * Quantos VALORES DISTINTOS de heap foram lidos.
   *
   * O navegador não entrega uma medida contínua: `performance.memory` é
   * quantizada e só é atualizada de tempos em tempos, para não virar canal de
   * espionagem. Na prática ela fica parada num valor por muitos minutos e então
   * salta. Com um único valor lido, TODAS as contas acima — piso, pico,
   * crescimento — são o mesmo número, e concluir "estável" a partir daí é
   * concluir a partir de nada.
   */
  degraus: number;
  /** Leitura em uma frase, para o painel. */
  veredito: string;
}

export interface LeituraDeTarefasLongas {
  total: number;
  duracaoTotal: number;
  pior: number;
  /** Tarefas longas ocorridas durante a carga da página. Custo de partida. */
  naCarga: number;
  /** Depois da carga — estas são as que atrapalham o uso. */
  depoisDaCarga: number;
  /** Ritmo das de depois, por minuto. */
  porMinuto: number;
}

export interface InstantaneoDeRuntime {
  /**
   * Versão do formato. Subiu para 2 na Fase 6.1: `vazamentos` deixou de contar
   * instâncias, e memória e tarefas longas ganharam campos. Uma baseline de
   * formato 1 não é comparável campo a campo com uma de formato 2.
   */
  formato: 2;
  build: string;
  capturadoEm: string;
  /** ms desde o carregamento da página. */
  desdeOCarregamento: number;
  componentes: MetricaDeComponente[];
  memoria: LeituraDeMemoria;
  tarefasLongas: LeituraDeTarefasLongas;
  /**
   * O que abriu e não fechou. Zero é o alvo, SEMPRE — nenhum destes tem motivo
   * legítimo para sobrar. Instâncias não entram aqui: ver o cabeçalho.
   */
  vazamentos: {
    timers: number;
    listeners: number;
    assinaturas: number;
  };
  /** Instâncias vivas por toda a árvore. Informação, não alarme. */
  vivos: number;
  /**
   * Diferença em relação à marca, quando há uma.
   *
   * É o critério de aceite da 6.1: marcar, navegar 50 vezes, voltar. Se algum
   * destes não for zero, alguma navegação deixou lixo para trás.
   */
  desdeAMarca?: ContagemDeRecursos;
}

function parVazio(): ParDeRecurso {
  return { criados: 0, encerrados: 0 };
}

interface EstadoDeComponente {
  nome: string;
  instancias: ParDeRecurso;
  render: MetricaDeRender;
  motivos: Map<string, number>;
  timers: ParDeRecurso;
  listeners: ParDeRecurso;
  assinaturas: ParDeRecurso;
  requisicoes: { total: number; falhas: number; duracaoTotal: number; pior: number };
}

function componenteVazio(nome: string): EstadoDeComponente {
  return {
    nome,
    instancias: parVazio(),
    render: { total: 0, duracaoTotal: 0, ultima: 0, pior: 0 },
    motivos: new Map(),
    timers: parVazio(),
    listeners: parVazio(),
    assinaturas: parVazio(),
    requisicoes: { total: 0, falhas: 0, duracaoTotal: 0, pior: 0 },
  };
}

/** Quantas amostras de memória e tarefas longas guardar. */
const TETO_AMOSTRAS = 720; // 1h a cada 5s
const TETO_TAREFAS = 200;
/** Motivos distintos guardados por componente, antes de tudo virar "outros". */
const TETO_MOTIVOS = 24;
/** Motivos mostrados no instantâneo. */
const MOTIVOS_NO_RELATORIO = 4;

/**
 * Até aqui é carga da página.
 *
 * A baseline do tablet mostrou a pior tarefa longa (504 ms) idêntica em 568 s e
 * em 1391 s — ou seja, ela aconteceu cedo e nunca mais se repetiu. Misturar o
 * custo de partida com o custo de uso esconde exatamente essa distinção.
 */
const FIM_DA_CARGA = 30_000;

/** Abaixo disto, o piso não tem amostras suficientes para significar algo. */
const AMOSTRAS_MINIMAS = 12; // 1 minuto a cada 5s
/** Crescimento de piso que merece ser chamado de vazamento. */
const PISO_SUSPEITO = 10 * 1024 * 1024;
/** Teto de valores distintos guardados — são poucos, mas o Set não pode crescer só. */
const TETO_DEGRAUS = 64;

function menorUsado(amostras: readonly AmostraDeMemoria[]): number {
  let min = Number.POSITIVE_INFINITY;
  for (const a of amostras) if (a.usado < min) min = a.usado;
  return Number.isFinite(min) ? min : 0;
}

export class ColetorDeRuntime {
  private readonly componentes = new Map<string, EstadoDeComponente>();
  private readonly memoria: AmostraDeMemoria[] = [];
  private readonly tarefas: TarefaLonga[] = [];
  private inicio = 0;
  private buildId = 'desconhecido';
  private marca: ContagemDeRecursos | undefined;

  /**
   * Totais que não podem ser perdidos pelo teto das listas.
   *
   * As listas são janelas — a de tarefas guarda 200. Numa sessão longa o
   * `shift()` descartaria as antigas e o total pareceria estacionar. Estes
   * contadores nunca são podados.
   */
  private tarefasTotal = 0;
  private tarefasDuracao = 0;
  private tarefasPior = 0;
  private tarefasNaCarga = 0;
  private pisoGlobal = Number.POSITIVE_INFINITY;
  private picoGlobal = 0;
  private readonly valoresDeMemoria = new Set<number>();

  /** Marca zero do relógio. Chamado uma vez, por quem inicia os observadores. */
  iniciar(agora: number, build: string): void {
    this.inicio = agora;
    this.buildId = build;
  }

  private de(nome: string): EstadoDeComponente {
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

  /**
   * Um render aconteceu.
   *
   * `motivo` é opcional porque nem todo componente sabe dizer o que o acordou —
   * mas os que sabem transformam "renderizou 3.328 vezes" em "renderizou 3.328
   * vezes por causa de `sensor.X`", que é acionável.
   */
  renderizou(nome: string, duracao: number, motivo?: string): void {
    const c = this.de(nome);
    const r = c.render;
    r.total++;
    r.duracaoTotal += duracao;
    r.ultima = duracao;
    if (duracao > r.pior) r.pior = duracao;

    if (!motivo) return;
    // Teto de chaves: os motivos vêm de ids de entidade e combinações deles.
    // Sem teto, uma sessão longa acumularia um mapa sem fim — o coletor viraria
    // o vazamento que ele existe para achar.
    const chave = c.motivos.has(motivo) || c.motivos.size < TETO_MOTIVOS ? motivo : 'outros';
    c.motivos.set(chave, (c.motivos.get(chave) ?? 0) + 1);
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
    if (amostra.usado < this.pisoGlobal) this.pisoGlobal = amostra.usado;
    if (amostra.usado > this.picoGlobal) this.picoGlobal = amostra.usado;
    if (this.valoresDeMemoria.size < TETO_DEGRAUS) this.valoresDeMemoria.add(amostra.usado);
  }

  tarefaLonga(tarefa: TarefaLonga): void {
    this.tarefas.push(tarefa);
    if (this.tarefas.length > TETO_TAREFAS) this.tarefas.shift();
    this.tarefasTotal++;
    this.tarefasDuracao += tarefa.duracao;
    if (tarefa.duracao > this.tarefasPior) this.tarefasPior = tarefa.duracao;
    if (tarefa.em < FIM_DA_CARGA) this.tarefasNaCarga++;
  }

  // ── Ciclo de navegação ────────────────────────────────────────────────────

  /**
   * Congela a contagem atual como referência.
   *
   * O teste da 6.1 é: marcar, navegar 50 vezes por todas as seções, voltar ao
   * ponto de partida e conferir que `desdeAMarca` é zero em tudo. Sem a marca, a
   * única alternativa seria zerar o coletor — o que apagaria a medição de render
   * que se quer justamente comparar.
   */
  marcar(agora: number): ContagemDeRecursos {
    this.marca = this.contagem();
    void agora;
    return this.marca;
  }

  limparMarca(): void {
    this.marca = undefined;
  }

  private contagem(): ContagemDeRecursos {
    const soma = (f: (c: EstadoDeComponente) => ParDeRecurso) => {
      let t = 0;
      for (const c of this.componentes.values()) t += f(c).criados - f(c).encerrados;
      return t;
    };
    return {
      instancias: soma((c) => c.instancias),
      timers: soma((c) => c.timers),
      listeners: soma((c) => c.listeners),
      assinaturas: soma((c) => c.assinaturas),
    };
  }

  // ── Leitura ───────────────────────────────────────────────────────────────

  private leituraDeMemoria(): LeituraDeMemoria {
    const amostras = this.memoria;
    const primeira = amostras[0];
    const ultima = amostras[amostras.length - 1];
    const n = amostras.length;

    // Terços: o piso do começo contra o piso do fim. O meio fica de fora de
    // propósito — é onde a serra está no meio do dente e não diz nada.
    const corte = Math.max(1, Math.floor(n / 3));
    const pisoInicial = n ? menorUsado(amostras.slice(0, corte)) : 0;
    const pisoFinal = n ? menorUsado(amostras.slice(n - corte)) : 0;
    const crescimentoDoPiso = pisoFinal - pisoInicial;

    const degraus = this.valoresDeMemoria.size;

    /**
     * O piso do terço do MEIO.
     *
     * Serve para distinguir as duas curvas que "piso subindo" confunde:
     *
     *   subida até o patamar   — o heap parte do zero numa carga fresca e sobe
     *                            até o consumo de operação, onde estabiliza;
     *   retenção               — o piso continua subindo depois disso.
     *
     * Comparar só o primeiro terço com o último acusa as duas do mesmo jeito.
     * Foi o que aconteceu em 2026-08-07: uma baseline colhida já no patamar deu
     * "estável" e outra colhida desde a carga deu "retenção" — as duas terminando
     * nos mesmos ~120 MB. O que decide é se a subida CONTINUA no fim.
     */
    const pisoMeio = n ? menorUsado(amostras.slice(corte, n - corte)) : 0;
    const crescimentoRecente = pisoFinal - pisoMeio;

    let veredito: string;
    if (n < AMOSTRAS_MINIMAS) {
      veredito = `Só ${n} amostra(s) — o piso ainda não significa nada.`;
    } else if (degraus < 2) {
      // A armadilha que enganou QUATRO leituras desta métrica. Com um valor só,
      // piso, pico e crescimento são todos o mesmo número, e "estável" seria uma
      // conclusão tirada de nada. Ver docs/24.
      veredito =
        `${n} amostras, mas um único valor de heap: o navegador ainda não ` +
        'atualizou a leitura. Sem informação — precisa de sessão longa.';
    } else if (crescimentoDoPiso > PISO_SUSPEITO && crescimentoRecente > PISO_SUSPEITO) {
      veredito =
        `Piso subiu ${(crescimentoDoPiso / 1048576).toFixed(1)} MB e AINDA sobe ` +
        `(${(crescimentoRecente / 1048576).toFixed(1)} MB no último terço) — isto é retenção.`;
    } else if (crescimentoDoPiso > PISO_SUSPEITO) {
      veredito =
        `Subiu ${(crescimentoDoPiso / 1048576).toFixed(1)} MB desde a carga e ` +
        `estabilizou em ${(pisoFinal / 1048576).toFixed(0)} MB — é custo de partida, não vazamento.`;
    } else {
      veredito =
        `Piso estável em ${degraus} degraus — a variação do heap é coleta de ` +
        'lixo, não vazamento.';
    }

    return {
      amostras: n,
      ...(primeira ? { primeira } : {}),
      ...(ultima ? { ultima } : {}),
      crescimento: primeira && ultima ? ultima.usado - primeira.usado : 0,
      piso: Number.isFinite(this.pisoGlobal) ? this.pisoGlobal : 0,
      pico: this.picoGlobal,
      pisoInicial,
      pisoFinal,
      crescimentoDoPiso,
      degraus,
      veredito,
    };
  }

  private leituraDeTarefas(desdeOCarregamento: number): LeituraDeTarefasLongas {
    const depoisDaCarga = this.tarefasTotal - this.tarefasNaCarga;
    const minutosDeUso = Math.max(0, desdeOCarregamento - FIM_DA_CARGA) / 60_000;
    return {
      total: this.tarefasTotal,
      duracaoTotal: Math.round(this.tarefasDuracao),
      pior: Math.round(this.tarefasPior),
      naCarga: this.tarefasNaCarga,
      depoisDaCarga,
      porMinuto: minutosDeUso > 0 ? Number((depoisDaCarga / minutosDeUso).toFixed(1)) : 0,
    };
  }

  /**
   * Fotografia do estado atual.
   *
   * `vazamentos` é a leitura de alarme: timer, listener ou assinatura que
   * sobrou. Zero é o alvo sempre. `vivos` e `desdeAMarca` são as leituras de
   * contexto — a primeira diz o que está montado, a segunda diz se navegar
   * deixou lixo.
   */
  instantaneo(agora: number): InstantaneoDeRuntime {
    const estados = [...this.componentes.values()].sort((a, b) =>
      a.nome.localeCompare(b.nome),
    );

    const componentes: MetricaDeComponente[] = estados.map((c) => ({
      nome: c.nome,
      instancias: { ...c.instancias },
      vivos: c.instancias.criados - c.instancias.encerrados,
      render: { ...c.render },
      motivos: [...c.motivos.entries()]
        .map(([motivo, total]) => ({ motivo, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, MOTIVOS_NO_RELATORIO),
      timers: { ...c.timers },
      listeners: { ...c.listeners },
      assinaturas: { ...c.assinaturas },
      requisicoes: { ...c.requisicoes },
    }));

    const agoraContado = this.contagem();
    const desdeOCarregamento = Math.round(agora - this.inicio);
    const marca = this.marca;

    return {
      formato: 2,
      build: this.buildId,
      capturadoEm: new Date().toISOString(),
      desdeOCarregamento,
      componentes,
      memoria: this.leituraDeMemoria(),
      tarefasLongas: this.leituraDeTarefas(desdeOCarregamento),
      vazamentos: {
        timers: agoraContado.timers,
        listeners: agoraContado.listeners,
        assinaturas: agoraContado.assinaturas,
      },
      vivos: agoraContado.instancias,
      ...(marca
        ? {
            desdeAMarca: {
              instancias: agoraContado.instancias - marca.instancias,
              timers: agoraContado.timers - marca.timers,
              listeners: agoraContado.listeners - marca.listeners,
              assinaturas: agoraContado.assinaturas - marca.assinaturas,
            },
          }
        : {}),
    };
  }

  /** Zera tudo. Usado antes de um ciclo de medição. */
  zerar(): void {
    this.componentes.clear();
    this.memoria.length = 0;
    this.tarefas.length = 0;
    this.marca = undefined;
    this.tarefasTotal = 0;
    this.tarefasDuracao = 0;
    this.tarefasPior = 0;
    this.tarefasNaCarga = 0;
    this.pisoGlobal = Number.POSITIVE_INFINITY;
    this.picoGlobal = 0;
    this.valoresDeMemoria.clear();
  }
}

/**
 * A instância única.
 *
 * Exportada como constante, e não criada num efeito de módulo — importar não
 * liga nada. Ver a regra 1 no topo do arquivo.
 */
export const coletor = new ColetorDeRuntime();
