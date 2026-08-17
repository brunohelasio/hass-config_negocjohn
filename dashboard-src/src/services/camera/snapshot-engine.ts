/**
 * Motor de instantâneos de câmera (Fase 6.2B, parte 1).
 *
 * ── O DEFEITO QUE ELE CORRIGE ────────────────────────────────────────────
 *
 * A subview pedia um quadro novo de CADA câmera a cada 6.500 ms, num intervalo
 * fixo. A baseline do tablet mediu a carga de um quadro em **6.200 ms de média**.
 *
 * Ou seja: a cada 6,5 s começava uma requisição, e a anterior mal tinha
 * terminado — quando terminava. Cada câmera mantinha uma requisição em voo
 * praticamente o tempo todo, e a Cozinha, com duas câmeras, mantinha duas.
 * **Estávamos saturando exatamente aquilo que estávamos esperando.**
 *
 * Pior: nada cancelava o pedido anterior e nada tinha prazo. Um pedido que
 * travava ficava pendurado para sempre, e no ciclo seguinte nascia outro por
 * cima. O pior tempo medido, 10.039 ms, tem cara de prazo estourado do outro
 * lado — não de rede lenta.
 * E uma câmera fora do ar era martelada a cada 6,5 s, indefinidamente.
 *
 * ── A POLÍTICA NOVA ──────────────────────────────────────────────────────
 *
 *   1. **Nunca duas requisições em voo para a mesma câmera.** O próximo quadro
 *      só é agendado quando o anterior termina — por sucesso, erro ou prazo.
 *   2. **Período, com folga mínima garantida.** A espera é
 *      `max(folga, cadência − duração)`: quando o servidor responde rápido, o
 *      ritmo é o de sempre; quando responde devagar, sobra respiro em vez de
 *      fila.
 *   3. **Prazo com cancelamento.** Passou de 8 s, o pedido é abortado e contado
 *      como falha. Nada fica pendurado.
 *   4. **Recuo exponencial.** Duas falhas seguidas e a câmera passa a ser
 *      consultada cada vez menos, até 60 s. Uma câmera fora do ar deixa de
 *      consumir a VM e volta sozinha ao ritmo quando responder.
 *   5. **Início escalonado.** As câmeras não partem todas no mesmo instante.
 *   6. **O PIP tem cadência própria**, mais lenta: é uma miniatura.
 *
 * ── POR QUE É UM SERVIÇO, E NÃO MÉTODO DO COMPONENTE ─────────────────────
 *
 * Porque assim dá para TESTAR. Carregador, agenda e relógio entram por
 * parâmetro; em teste são falsos e o tempo anda na mão. A política acima tem
 * seis regras que interagem — validá-la clicando no tablet seria adivinhação.
 */

export type PrioridadeDeCamera = 'principal' | 'secundaria';

import { pareceQuadroVerde } from './ha-webrtc-player';

export type Desfecho = 'ok' | 'erro' | 'prazo' | 'quadro-verde';

export interface AlvoDeCamera {
  entityId: string;
  /** URL sem o selo de tempo. */
  base: string;
  prioridade: PrioridadeDeCamera;
}

export interface QuadroPronto {
  entityId: string;
  url: string;
  duracao: number;
  /** É o primeiro quadro desta câmera? É a métrica que o usuário sente. */
  primeiro: boolean;
}

/** Baixa a imagem; devolve a função que aborta. */
export type ResultadoDoCarregador = boolean | 'quadro-verde';
export type Carregador = (
  url: string,
  terminou: (resultado: ResultadoDoCarregador) => void,
) => () => void;

export interface Agenda {
  agendar(fn: () => void, ms: number): number;
  cancelar(id: number): void;
  agora(): number;
}

export interface OpcoesDoMotor {
  carregador?: Carregador;
  agenda?: Agenda;
  /** Chamado quando um quadro novo está pronto para entrar na tela. */
  aoCarregar?: (quadro: QuadroPronto) => void;
  /** Chamado a cada tentativa, para a instrumentação. */
  aoMedir?: (entityId: string, duracao: number, desfecho: Desfecho, primeiro: boolean) => void;
  /**
   * Espera antes da PRIMEIRA busca de cada câmera.
   *
   * Existe porque quem busca o primeiro quadro é o próprio elemento de imagem —
   * ele nasce com um `src` e o navegador o baixa sozinho. Sem esta espera o
   * motor disparava uma segunda requisição no mesmo instante, para a mesma
   * câmera, com selo diferente: **duas requisições lentas competindo** num
   * servidor que leva de 4 a 8 s para produzir um quadro. Medido no PC em
   * 2026-08-07.
   */
  atrasoInicial?: number;
}

/** Período alvo entre quadros, por prioridade. */
export const CADENCIA: Record<PrioridadeDeCamera, number> = {
  principal: 6500,
  secundaria: 15000,
};

/**
 * Folga mínima entre o fim de um pedido e o começo do próximo.
 *
 * É esta a regra que quebra a saturação. Sem ela, com carga de 6,2 s e cadência
 * de 6,5 s, a folga real seria de 300 ms — praticamente nenhuma.
 */
export const FOLGA_MINIMA: Record<PrioridadeDeCamera, number> = {
  principal: 1500,
  secundaria: 3000,
};

/**
 * Prazo de um pedido.
 *
 * ANTERIOR (rollback): 8.000 ms — e foi um erro de calibragem MEU, medido no PC
 * em 2026-08-07: das 21 requisições, 10 falharam, e **todas as 10 em ~8.001 ms**.
 * Não era falha das câmeras: era este prazo cortando requisições que estavam a
 * caminho. A câmera do Office nunca chegou a renderizar por causa disso — três
 * tentativas, três cortes.
 *
 * O primeiro quadro legítimo nestas câmeras leva de **3,9 s a 7,7 s**. Um prazo
 * de 8 s fica DENTRO da faixa normal de operação, o que o torna um gerador de
 * falsas falhas — e falsa falha aciona o recuo, que afasta a tentativa seguinte
 * e piora justamente o que se queria melhorar.
 *
 * 25 s é folgado de propósito. O prazo aqui não existe para exigir rapidez: a
 * regra 1 (nunca duas em voo) já impede o acúmulo. Ele existe só para que uma
 * requisição verdadeiramente pendurada não trave aquela câmera para sempre.
 */
export const PRAZO = 25_000;

/** Distância entre as partidas, para as câmeras não saírem juntas. */
export const ESCALONAMENTO = 300;

/** Teto do recuo, para uma câmera morta não desaparecer de vez. */
export const RECUO_MAXIMO = 60_000;

/**
 * Teto do recuo ENQUANTO a câmera nunca mostrou um quadro.
 *
 * Medido no PC em 2026-08-07: a câmera do Q. Miguel falha no tempo limite do
 * PRÓPRIO Home Assistant (~10 s) em 3 de 5 tentativas. Com o recuo comum, a
 * sequência falha → 13 s → falha → 26 s levou **49 segundos até a primeira
 * imagem** — e é exatamente o que o usuário relata como "o Q. Miguel é o que
 * mais demora".
 *
 * A distinção que faltava: recuar protege a VM de uma câmera morta, mas antes do
 * primeiro quadro o usuário está olhando para uma caixa vazia. Enquanto não há
 * imagem na tela, insistir; depois que há, recuar à vontade.
 */
export const RECUO_SEM_IMAGEM = 12_000;

/** Falhas seguidas antes de começar a recuar. Mais tolerante sem imagem. */
export const FALHAS_ANTES_DO_RECUO = { comImagem: 2, semImagem: 4 };

/** Selo de tempo na URL — o proxy do HA não muda o caminho. */
export function comSelo(src: string, selo: number): string {
  if (!src) return '';
  return `${src}${src.includes('?') ? '&' : '?'}bruno_t=${selo || 1}`;
}

export interface MetricaDeCamera {
  entityId: string;
  prioridade: PrioridadeDeCamera;
  quadros: number;
  falhas: number;
  falhasSeguidas: number;
  /** Tempo do PRIMEIRO quadro, em ms. É a métrica nº 1 do aceite da 6.2B. */
  primeiroQuadro?: number;
  ultimaDuracao: number;
  pior: number;
  emVoo: boolean;
  ultimoDesfecho?: Desfecho;
}

// `| undefined` explícito porque o projeto usa `exactOptionalPropertyTypes`:
// "ausente" e "presente valendo undefined" são coisas diferentes, e aqui os
// campos são apagados com `= undefined` ao encerrar um voo.
interface EstadoDeCamera {
  alvo: AlvoDeCamera;
  timer?: number | undefined;
  prazo?: number | undefined;
  abortar?: (() => void) | undefined;
  emVoo: boolean;
  inicio: number;
  quadros: number;
  falhas: number;
  falhasSeguidas: number;
  primeiroQuadro?: number | undefined;
  ultimaDuracao: number;
  pior: number;
  ultimoDesfecho?: Desfecho | undefined;
}

const carregadorDeImagem: Carregador = (url, terminou) => {
  const img = new Image();
  let vivo = true;
  const encerrar = (resultado: ResultadoDoCarregador) => {
    if (!vivo) return;
    vivo = false;
    terminou(resultado);
  };
  // ANTERIOR (rollback 2026-08-10): qualquer Image.onload promovia o quadro.
  // A corrupcao verde e uma imagem tecnicamente valida, portanto passava pelo
  // onload e substituia um quadro bom. Agora ela conta como falha e o ultimo
  // quadro visualmente valido permanece na tela.
  img.onload = () => encerrar(pareceQuadroVerde(img) ? 'quadro-verde' : true);
  img.onerror = () => encerrar(false);
  img.src = url;
  return () => {
    vivo = false;
    img.onload = null;
    img.onerror = null;
    // Zerar o `src` é o que aborta a busca em andamento. Sem isto, o pedido
    // continua ocupando conexão mesmo depois de o prazo estourar — que é
    // metade do problema que este motor veio resolver.
    img.src = '';
  };
};

const agendaPadrao: Agenda = {
  agendar: (fn, ms) => globalThis.setTimeout(fn, ms) as unknown as number,
  cancelar: (id) => globalThis.clearTimeout(id),
  agora: () => (typeof performance !== 'undefined' ? performance.now() : Date.now()),
};

export class MotorDeInstantaneos {
  private readonly cameras = new Map<string, EstadoDeCamera>();
  private readonly carregador: Carregador;
  private readonly agenda: Agenda;
  private readonly aoCarregar: (q: QuadroPronto) => void;
  private readonly aoMedir: (
    entityId: string,
    duracao: number,
    desfecho: Desfecho,
    primeiro: boolean,
  ) => void;
  private readonly atrasoInicial: number;
  private ligado = false;

  constructor(opcoes: OpcoesDoMotor = {}) {
    this.carregador = opcoes.carregador ?? carregadorDeImagem;
    this.agenda = opcoes.agenda ?? agendaPadrao;
    this.aoCarregar = opcoes.aoCarregar ?? (() => {});
    this.aoMedir = opcoes.aoMedir ?? (() => {});
    this.atrasoInicial = opcoes.atrasoInicial ?? 0;
  }

  /**
   * Declara quais câmeras existem agora e com que prioridade.
   *
   * Chamável a cada render: câmera que continua **mantém o estado** — inclusive
   * o recuo e a contagem do primeiro quadro. Trocar o PIP pelo principal muda a
   * cadência sem reiniciar o ciclo, que é o requisito "troca palco↔PIP sem
   * remontar" do roteiro.
   */
  definirAlvos(alvos: readonly AlvoDeCamera[]): void {
    const vistos = new Set<string>();

    for (const alvo of alvos) {
      if (!alvo.entityId || !alvo.base) continue;
      vistos.add(alvo.entityId);
      const atual = this.cameras.get(alvo.entityId);
      if (atual) {
        atual.alvo = alvo;
        continue;
      }
      this.cameras.set(alvo.entityId, {
        alvo,
        emVoo: false,
        inicio: 0,
        quadros: 0,
        falhas: 0,
        falhasSeguidas: 0,
        ultimaDuracao: 0,
        pior: 0,
      });
      if (this.ligado) this.agendarPrimeiro(alvo.entityId, vistos.size - 1);
    }

    for (const [id, cam] of [...this.cameras]) {
      if (vistos.has(id)) continue;
      this.desmontar(cam);
      this.cameras.delete(id);
    }
  }

  /** Liga o ciclo. Idempotente. As câmeras partem escalonadas. */
  iniciar(): void {
    if (this.ligado) return;
    this.ligado = true;
    let i = 0;
    for (const id of this.cameras.keys()) this.agendarPrimeiro(id, i++);
  }

  /**
   * Para tudo: cancela os agendamentos E aborta o que está em voo.
   *
   * Abortar importa tanto quanto cancelar. Sem isso, sair de um cômodo deixaria
   * as requisições daquele cômodo terminando de baixar em segundo plano,
   * competindo com as do cômodo novo — que é exatamente a sensação de "demora ao
   * navegar".
   */
  parar(): void {
    this.ligado = false;
    for (const cam of this.cameras.values()) this.desmontar(cam);
  }

  /**
   * Busca um quadro de todas agora, sem esperar a cadência.
   *
   * Usado quando a tela volta a acender: a imagem na tela é de quando ela
   * apagou. Câmera com pedido em voo é pulada — a regra 1 vale sempre.
   */
  atualizarAgora(): void {
    if (!this.ligado) return;
    for (const cam of this.cameras.values()) {
      if (cam.emVoo) continue;
      if (cam.timer !== undefined) {
        this.agenda.cancelar(cam.timer);
        cam.timer = undefined;
      }
      this.buscar(cam);
    }
  }

  /** Retrato das métricas, por câmera. */
  metricas(): MetricaDeCamera[] {
    return [...this.cameras.values()].map((c) => ({
      entityId: c.alvo.entityId,
      prioridade: c.alvo.prioridade,
      quadros: c.quadros,
      falhas: c.falhas,
      falhasSeguidas: c.falhasSeguidas,
      ...(c.primeiroQuadro !== undefined ? { primeiroQuadro: c.primeiroQuadro } : {}),
      ultimaDuracao: c.ultimaDuracao,
      pior: c.pior,
      emVoo: c.emVoo,
      ...(c.ultimoDesfecho ? { ultimoDesfecho: c.ultimoDesfecho } : {}),
    }));
  }

  /**
   * Busca UMA câmera agora, sem esperar o atraso inicial nem a cadência.
   *
   * Existe para o caso em que o elemento de imagem falha ao baixar o primeiro
   * quadro sozinho: sem isto, a tela ficaria vazia até o motor entrar, uma
   * cadência inteira depois. Ignora câmera com pedido em voo — a regra 1 vale
   * sempre.
   */
  buscarAgora(entityId: string): void {
    if (!this.ligado) return;
    const cam = this.cameras.get(entityId);
    if (!cam || cam.emVoo) return;
    if (cam.timer !== undefined) {
      this.agenda.cancelar(cam.timer);
      cam.timer = undefined;
    }
    this.buscar(cam);
  }

  /** Quantas requisições estão em voo agora. Zero é o esperado em repouso. */
  emVoo(): number {
    let n = 0;
    for (const c of this.cameras.values()) if (c.emVoo) n++;
    return n;
  }

  // ── interno ───────────────────────────────────────────────────────────────

  private agendarPrimeiro(entityId: string, indice: number): void {
    const cam = this.cameras.get(entityId);
    if (!cam || cam.timer !== undefined || cam.emVoo) return;
    cam.timer = this.agenda.agendar(
      () => this.buscar(cam),
      this.atrasoInicial + indice * ESCALONAMENTO,
    );
  }

  private desmontar(cam: EstadoDeCamera): void {
    if (cam.timer !== undefined) {
      this.agenda.cancelar(cam.timer);
      cam.timer = undefined;
    }
    if (cam.prazo !== undefined) {
      this.agenda.cancelar(cam.prazo);
      cam.prazo = undefined;
    }
    cam.abortar?.();
    cam.abortar = undefined;
    cam.emVoo = false;
  }

  private buscar(cam: EstadoDeCamera): void {
    cam.timer = undefined;
    if (!this.ligado || cam.emVoo) return;

    cam.emVoo = true;
    cam.inicio = this.agenda.agora();
    const url = comSelo(cam.alvo.base, Math.round(cam.inicio) || 1);

    cam.prazo = this.agenda.agendar(() => this.encerrar(cam, 'prazo', url), PRAZO);
    cam.abortar = this.carregador(url, (resultado) =>
      this.encerrar(
        cam,
        resultado === 'quadro-verde' ? 'quadro-verde' : resultado ? 'ok' : 'erro',
        url,
      ),
    );
  }

  private encerrar(cam: EstadoDeCamera, desfecho: Desfecho, url: string): void {
    // O prazo e o carregador podem chegar quase juntos; quem chegar primeiro
    // encerra, o segundo não faz nada.
    if (!cam.emVoo) return;
    cam.emVoo = false;

    if (cam.prazo !== undefined) {
      this.agenda.cancelar(cam.prazo);
      cam.prazo = undefined;
    }
    cam.abortar?.();
    cam.abortar = undefined;

    const duracao = this.agenda.agora() - cam.inicio;
    cam.ultimaDuracao = duracao;
    if (duracao > cam.pior) cam.pior = duracao;
    cam.ultimoDesfecho = desfecho;

    const primeiro = desfecho === 'ok' && cam.quadros === 0;
    if (desfecho === 'ok') {
      cam.quadros++;
      cam.falhasSeguidas = 0;
      if (primeiro) cam.primeiroQuadro = duracao;
      this.aoCarregar({ entityId: cam.alvo.entityId, url, duracao, primeiro });
    } else {
      cam.falhas++;
      cam.falhasSeguidas++;
    }

    this.aoMedir(cam.alvo.entityId, duracao, desfecho, primeiro);

    if (this.ligado) this.agendarProximo(cam, duracao);
  }

  private agendarProximo(cam: EstadoDeCamera, duracao: number): void {
    const p = cam.alvo.prioridade;
    let espera = Math.max(FOLGA_MINIMA[p], CADENCIA[p] - duracao);

    // Enquanto não houve NENHUM quadro, o usuário está olhando para uma caixa
    // vazia: recuar aí é punir quem espera. Depois que há imagem na tela, o
    // recuo protege a VM sem custo visível.
    const semImagem = cam.quadros === 0;
    const limiar = semImagem ? FALHAS_ANTES_DO_RECUO.semImagem : FALHAS_ANTES_DO_RECUO.comImagem;
    const teto = semImagem ? RECUO_SEM_IMAGEM : RECUO_MAXIMO;

    if (cam.falhasSeguidas >= limiar) {
      const fator = 2 ** Math.min(cam.falhasSeguidas - limiar + 1, 5);
      espera = Math.min(teto, espera * fator);
    }

    cam.timer = this.agenda.agendar(() => this.buscar(cam), espera);
  }
}
