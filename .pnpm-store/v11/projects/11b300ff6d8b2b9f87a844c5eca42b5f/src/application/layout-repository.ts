/**
 * Repositório de layout — persistência da composição (Fase 6.4).
 *
 * ─── O que ele guarda ─────────────────────────────────────────────────────
 *
 * Uma SUPERFÍCIE: um conjunto de widgets com suas áreas, identificado por
 * chave ("home", "sala", "cozinha"). É o que o editor da fase seguinte vai
 * ler e escrever, e é o que hoje está espalhado entre arquivos YAML e
 * `subviews.config.ts`.
 *
 * ─── Por que uma PORTA e não um arquivo ───────────────────────────────────
 *
 * Onde o layout mora ainda não está decidido, e a decisão não é minha:
 *
 *   · `localStorage` é por navegador — o tablet de parede e o telefone
 *     divergiriam, o que contraria a ideia de uma casa só;
 *   · uma entidade do Home Assistant sincroniza, mas exige criar entidade, e
 *     packages/sensores estão fora do meu alcance sem autorização expressa;
 *   · um arquivo em `/config` sincroniza e não cria entidade, mas exige um
 *     caminho de escrita que o frontend não tem sozinho.
 *
 * Então a fase entrega o CONTRATO e duas implementações que não dependem de
 * nenhuma dessas decisões. A terceira, sincronizada, entra quando o usuário
 * escolher onde ela mora.
 *
 * ─── Versionamento ────────────────────────────────────────────────────────
 *
 * Todo documento carrega `versao`. Ler um documento de versão futura é erro
 * explícito, não silêncio: um layout escrito por uma versão mais nova pode ter
 * campos que esta não entende, e aplicá-lo pela metade perderia trabalho do
 * usuário.
 */

import type { WidgetInstance } from './widget-registry';

/** Versão do formato escrita por ESTA build. */
export const VERSAO_DO_LAYOUT = 1;

export interface LayoutDeSuperficie {
  /** Chave da superfície: "home", "sala", "cozinha"… */
  superficie: string;
  versao: number;
  /** Colunas da grade. Ausente = superfície em fluxo, sem grade. */
  colunas?: number | undefined;
  widgets: readonly WidgetInstance[];
  /** Carimbo da última escrita, em ISO. Só informativo. */
  salvoEm?: string | undefined;
}

/** A porta de armazenamento. Texto puro: quem implementa não conhece o formato. */
export interface ArmazenamentoDeLayout {
  ler(chave: string): string | undefined | Promise<string | undefined>;
  escrever(chave: string, conteudo: string): void | Promise<void>;
  remover(chave: string): void | Promise<void>;
  chaves(): readonly string[] | Promise<readonly string[]>;
}

/** Em memória — o padrão dos testes e da pré-visualização do editor. */
export class ArmazenamentoEmMemoria implements ArmazenamentoDeLayout {
  private readonly dados = new Map<string, string>();

  ler(chave: string): string | undefined {
    return this.dados.get(chave);
  }
  escrever(chave: string, conteudo: string): void {
    this.dados.set(chave, conteudo);
  }
  remover(chave: string): void {
    this.dados.delete(chave);
  }
  chaves(): readonly string[] {
    return [...this.dados.keys()];
  }
}

/**
 * `localStorage`, com prefixo próprio.
 *
 * Serve para rascunho e para o editor funcionar antes de haver sincronização.
 * NÃO serve como fonte de verdade entre aparelhos — ver o cabeçalho.
 */
export class ArmazenamentoLocal implements ArmazenamentoDeLayout {
  constructor(private readonly prefixo = 'bruno:layout:') {}

  private get loja(): Storage | undefined {
    try {
      return globalThis.localStorage ?? undefined;
    } catch {
      // Navegador com armazenamento bloqueado. Não é erro fatal: o layout
      // apenas não persiste, e o padrão de configuração continua valendo.
      return undefined;
    }
  }

  ler(chave: string): string | undefined {
    return this.loja?.getItem(this.prefixo + chave) ?? undefined;
  }
  escrever(chave: string, conteudo: string): void {
    try {
      this.loja?.setItem(this.prefixo + chave, conteudo);
    } catch {
      // Cota estourada ou modo privado: silêncio deliberado. Perder o rascunho
      // é ruim; derrubar o dashboard por causa dele é pior.
    }
  }
  remover(chave: string): void {
    this.loja?.removeItem(this.prefixo + chave);
  }
  chaves(): readonly string[] {
    const loja = this.loja;
    if (!loja) return [];
    const saida: string[] = [];
    for (let i = 0; i < loja.length; i++) {
      const k = loja.key(i);
      if (k?.startsWith(this.prefixo)) saida.push(k.slice(this.prefixo.length));
    }
    return saida;
  }
}

export class ErroDeLayout extends Error {}

/**
 * Migrações entre versões do documento.
 *
 * Uma entrada por salto: de 1 para 2, de 2 para 3. Encadear passos pequenos é
 * o que permite abrir um layout antigo depois de várias versões sem manter uma
 * função gigante que conhece todas as épocas ao mesmo tempo.
 */
export type Migracao = (bruto: Record<string, unknown>) => Record<string, unknown>;

const MIGRACOES = new Map<number, Migracao>();

export function registrarMigracao(deVersao: number, migracao: Migracao): void {
  if (MIGRACOES.has(deVersao)) {
    throw new Error(`layout-repository: migracao ja registrada para a versao ${deVersao}`);
  }
  MIGRACOES.set(deVersao, migracao);
}

/** Só para teste — o mapa é global. */
export function limparMigracoes(): void {
  MIGRACOES.clear();
}

export class LayoutRepository {
  constructor(private readonly armazenamento: ArmazenamentoDeLayout) {}

  /**
   * Lê uma superfície.
   *
   * `undefined` quando não há nada salvo — que é diferente de "salvo vazio".
   * Quem chama usa o padrão da configuração no primeiro caso e respeita a
   * escolha do usuário no segundo.
   */
  async ler(superficie: string): Promise<LayoutDeSuperficie | undefined> {
    const bruto = await this.armazenamento.ler(superficie);
    if (bruto === undefined) return undefined;

    let doc: Record<string, unknown>;
    try {
      doc = JSON.parse(bruto) as Record<string, unknown>;
    } catch {
      throw new ErroDeLayout(`layout de "${superficie}" ilegivel: JSON invalido`);
    }

    let versao = Number(doc['versao'] ?? 0);
    if (!Number.isFinite(versao) || versao < 1) {
      throw new ErroDeLayout(`layout de "${superficie}" sem versao valida`);
    }
    if (versao > VERSAO_DO_LAYOUT) {
      throw new ErroDeLayout(
        `layout de "${superficie}" foi escrito pela versao ${versao}; esta build entende ate ${VERSAO_DO_LAYOUT}`,
      );
    }

    while (versao < VERSAO_DO_LAYOUT) {
      const migracao = MIGRACOES.get(versao);
      if (!migracao) {
        throw new ErroDeLayout(
          `layout de "${superficie}": falta migracao da versao ${versao} para ${versao + 1}`,
        );
      }
      doc = migracao(doc);
      versao = Number(doc['versao'] ?? versao + 1);
    }

    const widgets = Array.isArray(doc['widgets']) ? (doc['widgets'] as WidgetInstance[]) : [];
    return {
      superficie,
      versao: VERSAO_DO_LAYOUT,
      colunas: typeof doc['colunas'] === 'number' ? doc['colunas'] : undefined,
      widgets,
      salvoEm: typeof doc['salvoEm'] === 'string' ? doc['salvoEm'] : undefined,
    };
  }

  async salvar(layout: LayoutDeSuperficie): Promise<void> {
    const doc: LayoutDeSuperficie = {
      ...layout,
      versao: VERSAO_DO_LAYOUT,
      salvoEm: new Date().toISOString(),
    };
    await this.armazenamento.escrever(layout.superficie, JSON.stringify(doc));
  }

  /** Volta ao padrão da configuração: apaga o salvo, não grava um vazio. */
  async restaurarPadrao(superficie: string): Promise<void> {
    await this.armazenamento.remover(superficie);
  }

  async superficies(): Promise<readonly string[]> {
    return this.armazenamento.chaves();
  }
}

/**
 * Monta um layout a partir da configuração declarada em código.
 *
 * É o caminho de quem NUNCA editou nada: a configuração continua sendo a fonte
 * de verdade, e o repositório só entra quando o usuário mexe. Sem isto, a
 * primeira abertura do editor apareceria vazia.
 */
export function layoutDaConfiguracao(
  superficie: string,
  widgets: readonly WidgetInstance[],
  colunas?: number,
): LayoutDeSuperficie {
  return { superficie, versao: VERSAO_DO_LAYOUT, colunas, widgets };
}
