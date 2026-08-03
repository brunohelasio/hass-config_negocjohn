import type { Hass, HassEntity } from '@/models/home-assistant';

/**
 * Lógica de estado de cômodo — funções puras, extraídas dos cards atuais.
 *
 * Hoje esta mesma lógica está copiada em 7 cards e 6 subviews, e já divergiu
 * entre eles. Aqui é uma definição só, testada.
 *
 * O comportamento foi transcrito de `bruno-corredor-card.js` sem alteração
 * deliberada: a migração preserva o comportamento atual. Onde algo parecer
 * errado, corrigir DEPOIS, num passo próprio e visível.
 */

/** Tempo decorrido no formato curto usado nos cards: `<1m`, `Nm`, `Nh`, `Nd`. */
export function formatElapsed(deltaMs: number): string {
  const minutes = deltaMs / 60_000;
  const hours = deltaMs / 3_600_000;
  const days = deltaMs / 86_400_000;

  if (minutes < 1) return '<1m';
  if (minutes < 60) return `${Math.trunc(minutes)}m`;
  if (hours < 24) return `${Math.trunc(hours)}h`;
  return `${Math.trunc(days)}d`;
}

export interface LightsSummary {
  count: number;
  elapsed: string;
  label: string;
}

export interface LightsSummaryInput {
  hass: Hass;
  /** Entidade de grupo do cômodo (pode ser o próprio interruptor). */
  groupEntityId?: string | undefined;
  /** Sensor `*_active`, quando existe: traz `lights_on_count` / `lights_on`. */
  activeSensorId?: string | undefined;
  /** Luzes individuais, usadas quando não há grupo nem sensor. */
  fallbackLightIds?: readonly string[] | undefined;
  now?: number;
}

/**
 * Quantas luzes acesas e há quanto tempo.
 *
 * A ordem de prioridade é a do card atual e existe por um motivo: o atributo
 * `lights_on_count` do sensor `*_active` é a fonte mais confiável; o grupo do HA
 * tem inconsistências conhecidas em `last_changed`, por isso o tempo decorrido
 * usa o membro ACESO MAIS ANTIGO, não o estado do grupo.
 *
 *   1) atributo `lights_on_count`
 *   2) atributo `lights_on` (lista ou string)
 *   3) membros do grupo (`entity_id` nos atributos)
 *   4) lista de fallback
 *   5) estado do próprio grupo (1 ou 0)
 */
export function lightsSummary(input: LightsSummaryInput): LightsSummary {
  const { hass, groupEntityId, activeSensorId, fallbackLightIds = [] } = input;
  const now = input.now ?? Date.now();

  const group = groupEntityId ? hass.states[groupEntityId] : undefined;
  const active = activeSensorId ? hass.states[activeSensorId] : undefined;

  let count: number | null = null;

  const rawCount = active?.attributes['lights_on_count'];
  if (rawCount != null && rawCount !== '' && !Number.isNaN(Number(rawCount))) {
    count = Math.trunc(Number(rawCount));
  } else {
    const lightsOn = active?.attributes['lights_on'];
    if (Array.isArray(lightsOn)) {
      count = lightsOn.length;
    } else if (typeof lightsOn === 'string' && lightsOn.startsWith('[')) {
      // O HA às vezes serializa a lista como string com aspas simples.
      const quotes = lightsOn.match(/'/g);
      if (quotes) count = quotes.length / 2;
    }
  }

  const memberIds = groupMemberIds(group);
  if (count === null && memberIds.length > 0) {
    count = memberIds.filter((id) => hass.states[id]?.state === 'on').length;
  }
  if (count === null && fallbackLightIds.length > 0) {
    count = fallbackLightIds.filter((id) => hass.states[id]?.state === 'on').length;
  }
  if (count === null) count = group?.state === 'on' ? 1 : 0;

  let elapsed = String(active?.attributes['lights_elapsed'] ?? '');
  if (!elapsed) {
    const ids = memberIds.length > 0 ? memberIds : fallbackLightIds;
    let earliest: number | null = null;
    for (const id of ids) {
      const s = hass.states[id];
      if (s?.state !== 'on' || !s.last_changed) continue;
      const ts = Date.parse(s.last_changed);
      if (!Number.isNaN(ts) && (earliest === null || ts < earliest)) earliest = ts;
    }
    if (earliest === null && group?.state === 'on' && group.last_changed) {
      const ts = Date.parse(group.last_changed);
      if (!Number.isNaN(ts)) earliest = ts;
    }
    elapsed = earliest === null ? '' : formatElapsed(now - earliest);
  }

  const noun = count === 1 ? '1 light' : `${count} lights`;
  return {
    count,
    elapsed,
    label: count > 0 ? `${noun}${elapsed ? ` / ${elapsed}` : ''}` : '',
  };
}

function groupMemberIds(group: HassEntity | undefined): string[] {
  const raw = group?.attributes['entity_id'];
  if (Array.isArray(raw)) return raw.filter((v): v is string => typeof v === 'string');
  return [];
}

export interface SemanticLineInput {
  hass: Hass;
  semanticSensorId?: string | undefined;
  motionRecentId?: string | undefined;
  occupancyId?: string | undefined;
}

/**
 * Texto de ocupação ("Ocupado" / "Ocupada").
 *
 * A regra de 2026-07-04 é o ponto delicado: o texto só aparece quando a ocupação
 * E a presença estão ativas. Sem a segunda condição, o texto ficava visível por
 * até 2 minutos depois de a pessoa sair — com o ponto azul já apagado. Texto sem
 * ponto é contradição visual, e foi assim que o usuário percebeu o defeito.
 */
export function semanticLine(input: SemanticLineInput): string {
  const { hass, semanticSensorId, motionRecentId, occupancyId } = input;

  const semantic = semanticSensorId ? hass.states[semanticSensorId] : undefined;
  const state = String(semantic?.state ?? '').toLowerCase();
  const display = semantic?.attributes['display'];
  if (display && !['none', 'unknown', 'unavailable', ''].includes(state)) {
    return String(display).trim();
  }

  const motion = motionRecentId ? hass.states[motionRecentId] : undefined;
  if (motion && motion.state !== 'on') return '';

  const occupancy = occupancyId ? hass.states[occupancyId] : undefined;
  return occupancy?.state === 'on' ? 'Ocupado' : '';
}

/** O cômodo está "aceso"? */
export function isRoomOn(
  hass: Hass,
  groupEntityId: string | undefined,
  onStates: readonly string[] = ['on', 'home', 'active', 'yes'],
): boolean {
  if (!groupEntityId) return false;
  const entity = hass.states[groupEntityId];
  if (!entity) return false;
  return onStates.includes(String(entity.state).toLowerCase());
}

/** Primeiro valor numérico disponível numa lista de sensores. */
export function firstSensorValue(
  hass: Hass,
  entityIds: readonly string[] | undefined,
  suffix = '',
): string {
  for (const id of entityIds ?? []) {
    const e = hass.states[id];
    if (!e || e.state === 'unavailable' || e.state === 'unknown') continue;
    const n = Number(e.state);
    if (Number.isNaN(n)) continue;
    return `${Math.round(n)}${suffix}`;
  }
  return '';
}
