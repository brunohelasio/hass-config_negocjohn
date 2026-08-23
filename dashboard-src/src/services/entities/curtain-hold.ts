/**
 * Retenção da posição da cortina — fonte ÚNICA e persistente.
 *
 * ─── Por que este módulo existe ────────────────────────────────────────────
 *
 * A validação física de 2026-08-23 mostrou dois defeitos que são o mesmo por
 * baixo:
 *
 *   1. depois de parar num ponto intermediário, o percentual sobrevivia por um
 *      tempo e então mudava sozinho — bastava navegar para outra seção e voltar
 *      à Sala para o valor virar "totalmente aberta";
 *   2. a barra superior mostrava 0% fechada enquanto a subview mostrava ~90%.
 *
 * A causa de (1) é o ciclo de vida: a retenção morava em `_movimentoCortina`,
 * estado de instância. As subviews não-Home são desconectadas ao sair e
 * reconectadas ao voltar, então a instância nova nascia sem memória e voltava a
 * confiar na telemetria — que continua publicando a leitura antiga.
 *
 * A causa de (2) é haver dois donos do mesmo número. Alinhar a PRIORIDADE das
 * fontes (rodada anterior) não bastou: a subview retinha e a barra não.
 *
 * Aqui os dois passam a ler e escrever o MESMO registro. Não é cache de
 * conveniência: é onde a posição efetiva mora enquanto não houver evidência
 * física nova.
 *
 * ─── A regra ───────────────────────────────────────────────────────────────
 *
 * O Stop grava o percentual visual exibido E a leitura física bruta daquele
 * instante. A retenção vale enquanto a física não mudar. Assim que o cover
 * publicar um `current_position` DIFERENTE do gravado, a retenção cai e a
 * física volta a mandar — é essa a "evidência física nova".
 *
 * Uma nova ordem (abrir/fechar/posicionar) limpa o registro na hora.
 *
 * `localStorage` porque é o mesmo mecanismo que o Hub já usa para o histórico
 * da TV — nenhum protocolo novo no projeto.
 */

const CHAVE = 'bruno-ui:curtain-hold:v1';

/** Tempo máximo de vida do registro. Um dia é folgado para o uso real e evita
 *  que um valor esquecido sobreviva a uma troca de hardware. */
const VALIDADE_MS = 24 * 60 * 60 * 1000;

export interface RetencaoCortina {
  /** Percentual VISUAL fechado (0 = aberta, 100 = fechada), já calibrado. */
  fechado: number;
  /** `current_position` BRUTO no instante do Stop. `null` quando o cover não
   *  publicava posição — nesse caso qualquer leitura futura conta como nova. */
  fisicoBruto: number | null;
  /** Quando foi gravado. */
  em: number;
}

type Mapa = Record<string, RetencaoCortina>;

function armazem(): Storage | undefined {
  try {
    return globalThis.localStorage ?? undefined;
  } catch {
    return undefined;
  }
}

function ler(): Mapa {
  try {
    const cru = armazem()?.getItem(CHAVE);
    if (!cru) return {};
    const dados = JSON.parse(cru) as Mapa;
    return dados && typeof dados === 'object' ? dados : {};
  } catch {
    return {};
  }
}

function gravar(mapa: Mapa): void {
  try {
    armazem()?.setItem(CHAVE, JSON.stringify(mapa));
  } catch {
    /* modo privado ou cota cheia: a retenção deixa de persistir, e o
       comportamento cai para o da instância — nunca quebra. */
  }
}

/** Registro válido desta entidade, se houver. */
export function lerRetencao(entityId: string | undefined): RetencaoCortina | undefined {
  if (!entityId) return undefined;
  const item = ler()[entityId];
  if (!item) return undefined;
  if (!Number.isFinite(item.fechado)) return undefined;
  if (Date.now() - (item.em ?? 0) > VALIDADE_MS) {
    limparRetencao(entityId);
    return undefined;
  }
  return item;
}

export function gravarRetencao(
  entityId: string | undefined,
  fechado: number,
  fisicoBruto: number | null,
): void {
  if (!entityId || !Number.isFinite(fechado)) return;
  const mapa = ler();
  mapa[entityId] = { fechado: Math.max(0, Math.min(100, Math.round(fechado))), fisicoBruto, em: Date.now() };
  gravar(mapa);
}

export function limparRetencao(entityId: string | undefined): void {
  if (!entityId) return;
  const mapa = ler();
  if (!(entityId in mapa)) return;
  delete mapa[entityId];
  gravar(mapa);
}

/**
 * O percentual VISUAL fechado que deve ser exibido, ou `undefined` para
 * "use a leitura física normal".
 *
 * @param movendo o cover declara `opening`/`closing`. Movimento é evidência
 *   física por si só, então a retenção cai.
 * @param fisicoBruto `current_position` atual, ou `undefined` se o cover não
 *   publica posição.
 */
export function fechamentoRetido(
  entityId: string | undefined,
  fisicoBruto: number | undefined,
  movendo: boolean,
): number | undefined {
  const item = lerRetencao(entityId);
  if (!item) return undefined;

  if (movendo) {
    limparRetencao(entityId);
    return undefined;
  }

  // Telemetria NOVA: o cover publicou algo diferente do que havia no Stop.
  const temLeitura = typeof fisicoBruto === 'number' && Number.isFinite(fisicoBruto);
  if (temLeitura && item.fisicoBruto !== null && fisicoBruto !== item.fisicoBruto) {
    limparRetencao(entityId);
    return undefined;
  }
  if (temLeitura && item.fisicoBruto === null) {
    // Não havia leitura no Stop e agora há: isso também é evidência nova.
    limparRetencao(entityId);
    return undefined;
  }

  return item.fechado;
}
