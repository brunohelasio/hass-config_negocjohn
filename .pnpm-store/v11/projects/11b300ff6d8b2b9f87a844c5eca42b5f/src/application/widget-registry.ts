/**
 * Registry de widgets — contratos de composição (Fase 6.4).
 *
 * ─── Relação com o device-registry ────────────────────────────────────────
 *
 * `application/device-registry.ts` (Fase 5e.0) resolveu o mesmo problema para
 * UM caso: a lista de dispositivos. Ele diz "acrescentar um aparelho é
 * acrescentar uma entrada de configuração", e funciona.
 *
 * Este arquivo generaliza a ideia para QUALQUER coisa que ocupe espaço numa
 * superfície do dashboard, acrescentando o que o device-registry
 * deliberadamente deixou de fora e nomeou como sendo da 6.4: **posição e
 * tamanho**.
 *
 * O device-registry NÃO é reescrito nem substituído aqui. Ele continua
 * atendendo o painel Dispositivos, que está validado e em produção. A migração
 * dele para cima deste contrato é mecânica — as formas são compatíveis de
 * propósito — e fica para quando houver motivo, não por simetria.
 *
 * ─── O que este arquivo NÃO faz ───────────────────────────────────────────
 *
 * Não desenha nada, não persiste nada e não conhece o Home Assistant. Desenho
 * é do widget; persistência é do `LayoutRepository`; a casa é do `HostAdapter`.
 * Cada um em seu arquivo, e é essa separação que permite testar layout sem
 * navegador e widget sem servidor.
 */

import type { HostAdapter } from './host-adapter';

/** Posição e tamanho numa grade de superfície. Unidade: célula, não pixel. */
export interface AreaDoWidget {
  /** Coluna inicial, base 1 — mesma convenção do CSS Grid. */
  coluna: number;
  /** Linha inicial, base 1. */
  linha: number;
  /** Largura em colunas. Mínimo 1. */
  colunas: number;
  /** Altura em linhas. Mínimo 1. */
  linhas: number;
}

/** Limites de tamanho que um tipo de widget aceita. */
export interface LimitesDeTamanho {
  minColunas?: number;
  minLinhas?: number;
  maxColunas?: number;
  maxLinhas?: number;
}

/**
 * Uma instância de widget, como aparece na CONFIGURAÇÃO ou no layout salvo.
 *
 * `area` é opcional porque nem toda superfície é uma grade: uma faixa em fluxo
 * ordena por posição na lista. Superfície com grade exige `area`; a validação
 * cobra isso.
 */
export interface WidgetInstance {
  id: string;
  type: string;
  name?: string;
  area?: AreaDoWidget;
  config?: Record<string, unknown>;
  /** Versão do formato desta entrada, para migração futura. */
  version?: number;
}

/** O que um widget informa ao registry sobre si mesmo. */
export interface WidgetDefinition {
  type: string;
  label: string;
  icon?: string;
  /** Agrupamento no catálogo do futuro editor. */
  categoria?: string;
  /** Tamanho sugerido ao inserir. */
  tamanhoPadrao?: Pick<AreaDoWidget, 'colunas' | 'linhas'>;
  limites?: LimitesDeTamanho;
  /**
   * Cria o elemento.
   *
   * Recebe o host em vez de `hass`: é o que permite instanciar o widget no
   * catálogo do editor, sem sessão do Home Assistant.
   */
  create(instancia: WidgetInstance, host: HostAdapter): HTMLElement;
  /** Entidades observadas — base da atualização seletiva da Fase 6.1. */
  entities?(instancia: WidgetInstance): readonly string[];
  validate?(instancia: WidgetInstance): ResultadoDeValidacao;
}

export interface ResultadoDeValidacao {
  ok: boolean;
  erros: readonly string[];
}

class RegistryDeWidgets {
  private readonly definicoes = new Map<string, WidgetDefinition>();

  /** Registrar duas vezes o mesmo tipo é erro de programação, não um aviso. */
  registrar(definicao: WidgetDefinition): void {
    if (this.definicoes.has(definicao.type)) {
      throw new Error(`widget-registry: tipo ja registrado — "${definicao.type}"`);
    }
    this.definicoes.set(definicao.type, definicao);
  }

  obter(tipo: string): WidgetDefinition | undefined {
    return this.definicoes.get(tipo);
  }

  conhece(tipo: string): boolean {
    return this.definicoes.has(tipo);
  }

  tipos(): readonly string[] {
    return [...this.definicoes.keys()];
  }

  /** O catálogo do editor: tudo que dá para inserir, agrupado. */
  catalogo(): ReadonlyArray<{ categoria: string; itens: readonly WidgetDefinition[] }> {
    const mapa = new Map<string, WidgetDefinition[]>();
    for (const def of this.definicoes.values()) {
      const cat = def.categoria ?? 'Geral';
      const lista = mapa.get(cat);
      if (lista) lista.push(def);
      else mapa.set(cat, [def]);
    }
    return [...mapa.entries()].map(([categoria, itens]) => ({ categoria, itens }));
  }

  /** Só para teste: o registry é global e os testes precisam de isolamento. */
  limpar(): void {
    this.definicoes.clear();
  }
}

export const widgetRegistry = new RegistryDeWidgets();

/**
 * Cria o elemento de uma instância.
 *
 * `undefined` quando o tipo é desconhecido: quem chama decide o que mostrar.
 * Uma entrada com tipo errado tem de aparecer como entrada inválida — não
 * sumir em silêncio nem derrubar a superfície inteira.
 */
export function criarWidget(
  instancia: WidgetInstance,
  host: HostAdapter,
): HTMLElement | undefined {
  return widgetRegistry.obter(instancia.type)?.create(instancia, host);
}

/** Entidades observadas por uma instância — vazio se o tipo é desconhecido. */
export function entidadesDoWidget(instancia: WidgetInstance): readonly string[] {
  return widgetRegistry.obter(instancia.type)?.entities?.(instancia) ?? [];
}

/** Aplica os limites do tipo a uma área — usado ao inserir e ao redimensionar. */
export function ajustarArea(area: AreaDoWidget, limites: LimitesDeTamanho = {}): AreaDoWidget {
  const prender = (v: number, min: number, max: number | undefined) =>
    Math.max(min, max === undefined ? v : Math.min(v, max));
  return {
    coluna: Math.max(1, Math.round(area.coluna)),
    linha: Math.max(1, Math.round(area.linha)),
    colunas: prender(Math.round(area.colunas), Math.max(1, limites.minColunas ?? 1), limites.maxColunas),
    linhas: prender(Math.round(area.linhas), Math.max(1, limites.minLinhas ?? 1), limites.maxLinhas),
  };
}

/** Duas áreas se sobrepõem? Base da checagem de colisão do editor. */
export function areasColidem(a: AreaDoWidget, b: AreaDoWidget): boolean {
  const semCruzarX = a.coluna + a.colunas <= b.coluna || b.coluna + b.colunas <= a.coluna;
  const semCruzarY = a.linha + a.linhas <= b.linha || b.linha + b.linhas <= a.linha;
  return !(semCruzarX || semCruzarY);
}

export interface OpcoesDeValidacao {
  /** Superfície em grade: `area` passa a ser obrigatória e colisão vira erro. */
  emGrade?: boolean;
  /** Colunas da superfície. Um widget que ultrapassa a borda é erro. */
  colunas?: number;
}

/**
 * Valida uma lista de instâncias.
 *
 * Checa o que vale para qualquer tipo — id, tipo registrado, unicidade, área —
 * e delega ao widget o que é específico dele. Devolve TODOS os erros, não o
 * primeiro: quem edita configuração à mão precisa da lista inteira.
 */
export function validarWidgets(
  instancias: readonly WidgetInstance[],
  opcoes: OpcoesDeValidacao = {},
): ResultadoDeValidacao {
  const erros: string[] = [];
  const vistos = new Set<string>();

  for (const [i, inst] of instancias.entries()) {
    const onde = inst.id || `posicao ${i}`;

    if (!inst.id) erros.push(`widget em ${onde}: falta "id"`);
    else if (vistos.has(inst.id)) erros.push(`id repetido — "${inst.id}"`);
    else vistos.add(inst.id);

    if (!inst.type) erros.push(`widget "${onde}": falta "type"`);
    else if (!widgetRegistry.conhece(inst.type)) {
      erros.push(`widget "${onde}": tipo nao registrado — "${inst.type}"`);
    }

    if (opcoes.emGrade) {
      if (!inst.area) erros.push(`widget "${onde}": falta "area" numa superficie em grade`);
      else {
        const a = inst.area;
        if (a.coluna < 1 || a.linha < 1) erros.push(`widget "${onde}": area comeca fora da grade`);
        if (a.colunas < 1 || a.linhas < 1) erros.push(`widget "${onde}": area sem tamanho`);
        if (opcoes.colunas && a.coluna + a.colunas - 1 > opcoes.colunas) {
          erros.push(`widget "${onde}": ultrapassa a borda direita da grade`);
        }
      }
    }

    const especifico = widgetRegistry.obter(inst.type)?.validate?.(inst);
    if (especifico && !especifico.ok) erros.push(...especifico.erros);
  }

  if (opcoes.emGrade) {
    const comArea = instancias.filter((i): i is WidgetInstance & { area: AreaDoWidget } =>
      Boolean(i.area),
    );
    for (let i = 0; i < comArea.length; i++) {
      for (let j = i + 1; j < comArea.length; j++) {
        if (areasColidem(comArea[i]!.area, comArea[j]!.area)) {
          erros.push(`widgets "${comArea[i]!.id}" e "${comArea[j]!.id}" se sobrepoem`);
        }
      }
    }
  }

  return { ok: erros.length === 0, erros };
}
