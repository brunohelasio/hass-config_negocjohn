import { ROOMS } from '@/config/rooms.config';
import type { Hass, HassEntity } from '@/models/home-assistant';

export interface StatusLight {
  entityId: string;
  name: string;
  isOn: boolean;
  isUnavailable: boolean;
}

export interface StatusLightsRoom {
  id: string;
  name: string;
  lights: readonly StatusLight[];
  sourceGroup?: string;
  isUnassigned?: boolean;
}

export interface StatusLightsInventory {
  rooms: readonly StatusLightsRoom[];
  entityIds: readonly string[];
  expandedGroups: readonly string[];
  orphanEntityIds: readonly string[];
  onCount: number;
  total: number;
}

/**
 * Circuitos físicos confirmados pelo usuário como inativos em 2026-08-26.
 *
 * Ambos são membros internos de light.qc_luz_principal. A expansão recursiva
 * correta dos grupos os expunha como controles independentes, embora não façam
 * parte dos seis módulos efetivamente usados no Quarto Casal. A exclusão fica
 * restrita ao inventário desta sheet; ROOMS e os grupos do HA não são alterados.
 */
const STATUS_LIGHTS_EXCLUDED_ENTITY_IDS = new Set([
  'light.quarto_casal_2_switch_1',
  'light.quarto_casal_switch_3',
]);

function memberIds(entity: HassEntity | undefined): readonly string[] {
  const raw = entity?.attributes?.['entity_id'];
  return Array.isArray(raw) ? raw.filter((id): id is string => typeof id === 'string') : [];
}

function fallbackName(entityId: string): string {
  const objectId = entityId.split('.')[1] ?? entityId;
  return objectId
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function lightFrom(hass: Hass, entityId: string): StatusLight | undefined {
  const entity = hass.states[entityId];
  if (!entity || !entityId.startsWith('light.')) return undefined;
  const friendlyName = entity.attributes?.['friendly_name'];
  const state = String(entity.state ?? '').toLowerCase();
  return {
    entityId,
    name: typeof friendlyName === 'string' && friendlyName.trim()
      ? friendlyName.trim()
      : fallbackName(entityId),
    isOn: state === 'on',
    isUnavailable: state === 'unavailable' || state === 'unknown',
  };
}

function expandLight(
  hass: Hass,
  entityId: string | undefined,
  expandedGroups: Set<string>,
  seen = new Set<string>(),
  allowLeaf = true,
): string[] {
  if (!entityId || seen.has(entityId)) return [];
  seen.add(entityId);
  const entity = hass.states[entityId];
  if (!entity) return [];
  const members = memberIds(entity);
  if (members.length) {
    expandedGroups.add(entityId);
    return members.flatMap((member) => expandLight(hass, member, expandedGroups, seen, true));
  }
  return allowLeaf && entityId.startsWith('light.') ? [entityId] : [];
}

function uniqueExistingLights(hass: Hass, ids: Iterable<string>): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id) || STATUS_LIGHTS_EXCLUDED_ENTITY_IDS.has(id) || !lightFrom(hass, id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/**
 * Resolve o inventario da sheet usando ROOMS como autoridade de agrupamento.
 * O universo monitorado pela tile entra apenas para a auditoria de completude:
 * qualquer circuito real que os grupos nao associem aparece em Sem comodo.
 */
export function buildStatusLightsInventory(
  hass: Hass | undefined,
  monitoredLights: Iterable<string> = [],
): StatusLightsInventory {
  if (!hass) {
    return { rooms: [], entityIds: [], expandedGroups: [], orphanEntityIds: [], onCount: 0, total: 0 };
  }

  const expandedGroups = new Set<string>();
  const assigned = new Set<string>();
  const rooms: StatusLightsRoom[] = [];

  for (const room of ROOMS) {
    const ids: string[] = [];
    const group = room.entities.lightGroup;
    if (group) ids.push(...expandLight(hass, group, expandedGroups, new Set<string>(), false));
    for (const explicit of room.entities.lights ?? []) {
      ids.push(...expandLight(hass, explicit, expandedGroups));
    }
    const roomIds = uniqueExistingLights(hass, ids).filter((id) => {
      if (assigned.has(id)) return false;
      assigned.add(id);
      return true;
    });
    const lights = roomIds.map((id) => lightFrom(hass, id)).filter((light): light is StatusLight => Boolean(light));
    if (lights.length) {
      rooms.push({
        id: room.id,
        name: room.name,
        lights,
        ...(group ? { sourceGroup: group } : {}),
      });
    }
  }

  const monitoredResolved = uniqueExistingLights(
    hass,
    Array.from(monitoredLights).flatMap((id) => expandLight(hass, id, expandedGroups)),
  );
  const orphanEntityIds = monitoredResolved.filter((id) => !assigned.has(id));
  if (orphanEntityIds.length) {
    const lights = orphanEntityIds
      .map((id) => lightFrom(hass, id))
      .filter((light): light is StatusLight => Boolean(light));
    rooms.push({ id: 'unassigned', name: 'Sem cômodo', lights, isUnassigned: true });
  }

  const entityIds = rooms.flatMap((room) => room.lights.map((light) => light.entityId));
  const onCount = rooms.reduce(
    (total, room) => total + room.lights.filter((light) => light.isOn).length,
    0,
  );
  return {
    rooms,
    entityIds,
    expandedGroups: [...expandedGroups],
    orphanEntityIds,
    onCount,
    total: entityIds.length,
  };
}

/** Distribui os comodos em duas colunas com peso proporcional as linhas. */
export function balanceStatusLightsRooms(
  rooms: readonly StatusLightsRoom[],
): readonly [readonly StatusLightsRoom[], readonly StatusLightsRoom[]] {
  const columns: [[number, StatusLightsRoom][], [number, StatusLightsRoom][]] = [[], []];
  const weights: [number, number] = [0, 0];
  const weighted = rooms
    .map((room, index) => ({ room, index, weight: 1 + Math.ceil(room.lights.length / 2) }))
    .sort((a, b) => b.weight - a.weight || a.index - b.index);
  for (const item of weighted) {
    const target: 0 | 1 = weights[0] <= weights[1] ? 0 : 1;
    columns[target].push([item.index, item.room]);
    weights[target] += item.weight;
  }
  return columns.map((column) => column.sort((a, b) => a[0] - b[0]).map((entry) => entry[1])) as [
    StatusLightsRoom[],
    StatusLightsRoom[],
  ];
}
