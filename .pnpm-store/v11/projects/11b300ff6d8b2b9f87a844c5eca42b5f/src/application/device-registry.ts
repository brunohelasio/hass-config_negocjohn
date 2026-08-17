/**
 * Registry de controles de dispositivo — contratos mínimos (Fase 5e.0).
 *
 * Existe ANTES do popup Dispositivos, e não depois, de propósito: sem um
 * contrato prévio o popup nasceria com os controles escritos dentro dele, e
 * acrescentar um aparelho passaria a exigir editar o popup. Este arquivo é a
 * peça que impede isso.
 *
 * O escopo é deliberadamente pequeno. NÃO estão aqui — e ficam para a Fase 6.4:
 * posição e tamanho de widget, persistência de layout, host adapter, e qualquer
 * coisa relacionada a um editor. O que existe aqui é o suficiente para que
 * "acrescentar um dispositivo" seja "acrescentar uma entrada de configuração".
 *
 * Referência de organização: Savant, Control4, Crestron — uma lista de
 * dispositivos agrupada, e o controle de cada um aberto ao ser selecionado.
 */

import type { Hass } from '@/models/home-assistant';

/**
 * Uma instância de dispositivo, como aparece na CONFIGURAÇÃO.
 *
 * É isto que o usuário do dashboard escreve para acrescentar um aparelho. Nada
 * de marcação, nada de código.
 */
export interface DeviceInstanceConfig {
  /** Identificador estável — usado como chave de seleção e de estado. */
  id: string;
  /** Qual controle desenha este dispositivo. Precisa estar registrado. */
  type: string;
  /** Rótulo na lista. */
  name: string;
  /** Agrupamento na lista ("Sala", "Cozinha", "Casa"). */
  group?: string;
  /** Ícone da lista. Nome do conjunto do projeto (Hugeicons/apelido mdi). */
  icon?: string;
  /**
   * Entidade principal — a que decide se o dispositivo aparece como ativo.
   * Pode ser uma lista de candidatos, como no resto da configuração.
   */
  entity?: string | readonly string[];
  /** Configuração específica do tipo de controle. */
  config?: Record<string, unknown>;
  /** Versão do formato desta entrada, para migração futura. */
  version?: number;
}

/** O que um controle informa ao registry sobre si mesmo. */
export interface DeviceControlDefinition {
  /** Casa com `DeviceInstanceConfig.type`. */
  type: string;
  /** Nome legível do tipo ("TV", "Ar-condicionado"). */
  label: string;
  /** Ícone padrão, quando a instância não declara um. */
  icon?: string;
  /**
   * Cria o elemento de controle.
   *
   * Recebe a instância inteira — o controle lê dela o que precisa. Devolver um
   * elemento (e não marcação) é o que permite ao controle ter estado próprio e
   * ciclo de vida próprio, requisito da Fase 6.1.
   */
  create(instancia: DeviceInstanceConfig): HTMLElement;
  /**
   * Entidades que este controle observa, dada uma instância.
   *
   * É a base da atualização seletiva da Fase 6.1: o painel só redesenha um
   * controle quando UMA DESTAS entidades muda. Sem isso, qualquer mudança de
   * estado da casa redesenharia todos.
   */
  entities(instancia: DeviceInstanceConfig): readonly string[];
  /**
   * Validação da configuração da instância.
   *
   * Verifica o FORMATO. A existência da entidade no Home Assistant é outro
   * problema, e vive em `diagnostics/entity-check.ts` — foi por essa distinção
   * que o projeto decidiu não adotar Zod agora (ver docs/15).
   */
  validate?(instancia: DeviceInstanceConfig): ValidacaoResultado;
}

export interface ValidacaoResultado {
  ok: boolean;
  erros: readonly string[];
}

/**
 * O registry.
 *
 * Um mapa com uma regra: registrar duas vezes o mesmo tipo é erro de
 * programação, não algo a tolerar em silêncio — dois controles disputando o
 * mesmo nome renderizariam de forma imprevisível.
 */
class RegistryDeControles {
  private readonly definicoes = new Map<string, DeviceControlDefinition>();

  registrar(definicao: DeviceControlDefinition): void {
    if (this.definicoes.has(definicao.type)) {
      throw new Error(`device-registry: tipo já registrado — "${definicao.type}"`);
    }
    this.definicoes.set(definicao.type, definicao);
  }

  obter(tipo: string): DeviceControlDefinition | undefined {
    return this.definicoes.get(tipo);
  }

  tipos(): readonly string[] {
    return [...this.definicoes.keys()];
  }

  /** Um tipo desconhecido não derruba o painel — vira uma entrada inerte. */
  conhece(tipo: string): boolean {
    return this.definicoes.has(tipo);
  }
}

export const deviceRegistry = new RegistryDeControles();

/**
 * Cria o controle de uma instância.
 *
 * Devolve `undefined` quando o tipo não está registrado: o chamador decide o
 * que mostrar no lugar. Uma entrada de configuração com tipo errado tem de
 * aparecer como entrada inválida, não sumir sem explicação nem quebrar a lista.
 */
export function criarControle(instancia: DeviceInstanceConfig): HTMLElement | undefined {
  const definicao = deviceRegistry.obter(instancia.type);
  if (!definicao) return undefined;
  return definicao.create(instancia);
}

/** Entidades observadas por uma instância — vazio se o tipo é desconhecido. */
export function entidadesDaInstancia(instancia: DeviceInstanceConfig): readonly string[] {
  return deviceRegistry.obter(instancia.type)?.entities(instancia) ?? [];
}

/**
 * Valida uma lista de instâncias.
 *
 * Checa o que vale para qualquer tipo — id, type registrado, unicidade — e
 * delega ao controle o que é específico dele.
 */
export function validarInstancias(
  instancias: readonly DeviceInstanceConfig[],
): ValidacaoResultado {
  const erros: string[] = [];
  const vistos = new Set<string>();

  for (const [i, inst] of instancias.entries()) {
    const onde = inst.id || `posição ${i}`;
    if (!inst.id) erros.push(`dispositivo em ${onde}: falta "id"`);
    else if (vistos.has(inst.id)) erros.push(`id repetido — "${inst.id}"`);
    else vistos.add(inst.id);

    if (!inst.type) erros.push(`dispositivo "${onde}": falta "type"`);
    else if (!deviceRegistry.conhece(inst.type)) {
      erros.push(`dispositivo "${onde}": tipo não registrado — "${inst.type}"`);
    }

    if (!inst.name) erros.push(`dispositivo "${onde}": falta "name"`);

    const especifico = deviceRegistry.obter(inst.type)?.validate?.(inst);
    if (especifico && !especifico.ok) erros.push(...especifico.erros);
  }

  return { ok: erros.length === 0, erros };
}

/**
 * Resolve um id que pode ser lista de candidatos.
 *
 * Mesma regra do resto do projeto: vale o primeiro que existir e estiver
 * disponível; sem nenhum, o primeiro da lista, para que a interface ainda diga
 * a que se refere.
 */
export function resolverEntidade(
  valor: string | readonly string[] | undefined,
  hass: Hass | undefined,
): string | undefined {
  if (typeof valor === 'string') return valor || undefined;
  if (!Array.isArray(valor)) return undefined;
  const ids = valor.filter((v): v is string => typeof v === 'string' && Boolean(v));
  const vivo = ids.find((id) => {
    const st = hass?.states[id];
    return st && !['unavailable', 'unknown', ''].includes(String(st.state).toLowerCase());
  });
  return vivo ?? ids[0];
}

/** Agrupa instâncias preservando a ordem de declaração dos grupos. */
export function agrupar(
  instancias: readonly DeviceInstanceConfig[],
): ReadonlyArray<{ grupo: string; itens: readonly DeviceInstanceConfig[] }> {
  const mapa = new Map<string, DeviceInstanceConfig[]>();
  for (const inst of instancias) {
    const grupo = inst.group ?? 'Casa';
    const lista = mapa.get(grupo);
    if (lista) lista.push(inst);
    else mapa.set(grupo, [inst]);
  }
  return [...mapa.entries()].map(([grupo, itens]) => ({ grupo, itens }));
}
