/**
 * Observador de entidades — o coração do estado seletivo (Fase 6.1).
 *
 * O PROBLEMA que ele resolve: o Home Assistant substitui o objeto `hass` a cada
 * mudança de estado de QUALQUER entidade da casa. Um componente que reaja ao
 * `hass` inteiro re-renderiza quando o aspirador anda, quando um sensor de
 * luminosidade oscila, quando um `sensor.time` vira o minuto. É o equivalente
 * moderno do `triggers_update: all` dos button-card, que docs/09 já apontava
 * como causa de lentidão.
 *
 * O CONTRATO: o módulo declara as entidades que lê; o observador responde
 * QUAIS delas mudaram desde a última pergunta. Lista vazia significa "nada que
 * te interesse mudou" — o componente não renderiza.
 *
 * Por que devolver a lista, e não um booleano: a Fase 6.0 mediu 3.328 renders
 * de ladrilho em 14 minutos e **não soube dizer qual entidade os causou**.
 * Devolver os ids transforma o próximo diagnóstico em dado. É a diferença entre
 * "renderizou muito" e "renderizou por causa de `sensor.X`".
 *
 * Puro e testável: sem DOM, sem `window`, sem Lit.
 */

import type { Hass, HassEntity } from '@/models/home-assistant';

/**
 * Como uma entidade é reduzida ao que o componente realmente enxerga.
 *
 * O padrão é `state` + `last_changed`. O `last_changed` entra porque um
 * `on -> off -> on` entre duas leituras deixaria o `state` igual, e há telas que
 * mostram há quanto tempo está ligado.
 *
 * Um módulo que só exibe o valor formatado pode passar uma projeção própria e
 * ignorar oscilações que não mudam nada na tela.
 */
export type ProjecaoDeEntidade = (entidade: HassEntity | undefined) => string;

/** Ausente é um valor como outro qualquer: some da tela e isso é uma mudança. */
const AUSENTE = '∅';

export const projecaoPadrao: ProjecaoDeEntidade = (e) =>
  e ? `${e.state}@${e.last_changed}` : AUSENTE;

/**
 * Só o estado, sem o carimbo de tempo.
 *
 * Para quem exibe apenas ligado/desligado e não conta tempo decorrido: um
 * `on -> off -> on` rápido não precisa repintar.
 */
export const projecaoDeEstado: ProjecaoDeEntidade = (e) => (e ? e.state : AUSENTE);

/** Um atributo específico — para quem lê `entity_picture`, `temperature`, etc. */
export function projecaoDeAtributo(nome: string): ProjecaoDeEntidade {
  return (e) => (e ? String(e.attributes[nome] ?? AUSENTE) : AUSENTE);
}

export interface OpcoesDeObservador {
  /** Projeções por entidade. Quem não estiver aqui usa a padrão. */
  projecoes?: Readonly<Record<string, ProjecaoDeEntidade>>;
}

export class ObservadorDeEntidades {
  private ids: readonly string[] = [];
  private ultimo = new Map<string, string>();
  private readonly projecoes: Readonly<Record<string, ProjecaoDeEntidade>>;
  /** Nunca perguntado ainda: a primeira leitura sempre pinta. */
  private virgem = true;

  constructor(ids: Iterable<string> = [], opcoes: OpcoesDeObservador = {}) {
    this.projecoes = opcoes.projecoes ?? {};
    this.observar(ids);
  }

  /**
   * Troca a lista observada.
   *
   * Necessário porque a lista de um cômodo só existe depois do `setConfig`, que
   * chega DEPOIS do primeiro `hass`. Trocar a lista volta o observador ao estado
   * virgem — senão o componente ficaria preso à leitura feita com a lista velha.
   */
  observar(ids: Iterable<string>): void {
    const limpos: string[] = [];
    const vistos = new Set<string>();
    for (const id of ids) {
      if (typeof id !== 'string' || !id || vistos.has(id)) continue;
      vistos.add(id);
      limpos.push(id);
    }
    this.ids = limpos;
    this.ultimo.clear();
    this.virgem = true;
  }

  get observadas(): readonly string[] {
    return this.ids;
  }

  private projetar(hass: Hass, id: string): string {
    const projecao = this.projecoes[id] ?? projecaoPadrao;
    return projecao(hass.states[id]);
  }

  /**
   * O que mudou desde a última pergunta.
   *
   * Efeito colateral deliberado: memoriza a leitura. Chamar duas vezes seguidas
   * devolve a lista cheia e depois vazia — é assim que o setter de `hass` a usa.
   *
   * A primeira chamada devolve todas as observadas: é a pintura inicial, e ela
   * tem de acontecer.
   */
  mudancas(hass: Hass | undefined): readonly string[] {
    if (!hass) return [];

    if (this.virgem) {
      this.virgem = false;
      for (const id of this.ids) this.ultimo.set(id, this.projetar(hass, id));
      return this.ids;
    }

    let mudou: string[] | undefined;
    for (const id of this.ids) {
      const agora = this.projetar(hass, id);
      if (agora === this.ultimo.get(id)) continue;
      this.ultimo.set(id, agora);
      // Aloca só quando há mudança. O caminho comum — nada mudou — não cria
      // objeto nenhum, e ele roda a cada atualização do hass.
      (mudou ??= []).push(id);
    }
    return mudou ?? [];
  }

  /** Mudou alguma coisa? Atalho para quem não precisa saber qual. */
  mudou(hass: Hass | undefined): boolean {
    return this.mudancas(hass).length > 0;
  }

  /** Esquece o que leu, sem trocar a lista. A próxima pergunta pinta tudo. */
  esquecer(): void {
    this.ultimo.clear();
    this.virgem = true;
  }
}

/**
 * Resume uma lista de ids para caber num rótulo de diagnóstico.
 *
 * O painel mostra o motivo do render. Uma lista com trinta ids não cabe e não
 * informa; dois ids e uma contagem informam.
 */
export function resumirMotivo(ids: readonly string[], teto = 2): string {
  if (ids.length === 0) return '';
  if (ids.length <= teto) return ids.join(' ');
  return `${ids.slice(0, teto).join(' ')} +${ids.length - teto}`;
}

/**
 * Um `dominio.objeto` do Home Assistant, e nada mais.
 *
 * Restrito de propósito: caminho de imagem, rótulo e nome de dispositivo também
 * são texto e convivem com os ids nos mesmos objetos de configuração.
 */
const ID_DE_ENTIDADE = /^[a-z_]+\.[a-z0-9_]+$/;

/** Fundo, para configuração com referência circular ou aninhamento absurdo. */
const PROFUNDIDADE_MAXIMA = 8;

/**
 * Varre uma configuração e recolhe todo id de entidade que houver dentro.
 *
 * POR QUE VARRER, e não declarar a lista à mão: os módulos grandes leem dezenas
 * de entidades espalhadas por uma configuração aninhada — luzes por zona,
 * câmeras com seus interruptores, climatização, mídia. Uma lista escrita à mão
 * seria a próxima coisa a ficar defasada, e o modo de falhar é o pior possível:
 * a entidade esquecida simplesmente para de atualizar na tela, sem erro nenhum.
 *
 * O viés é deliberado: recolher DEMAIS custa um render que já aconteceria antes
 * desta fase; recolher DE MENOS congela um pedaço da interface. Na dúvida,
 * recolhe.
 */
export function coletarIdsDeEntidade(valor: unknown, profundidade = 0): string[] {
  const achados: string[] = [];
  const vistos = new Set<string>();

  const andar = (v: unknown, nivel: number): void => {
    if (nivel > PROFUNDIDADE_MAXIMA || v == null) return;
    if (typeof v === 'string') {
      if (ID_DE_ENTIDADE.test(v) && !vistos.has(v)) {
        vistos.add(v);
        achados.push(v);
      }
      return;
    }
    if (Array.isArray(v)) {
      for (const item of v) andar(item, nivel + 1);
      return;
    }
    if (typeof v === 'object') {
      for (const item of Object.values(v as Record<string, unknown>)) andar(item, nivel + 1);
    }
  };

  andar(valor, profundidade);
  return achados;
}
