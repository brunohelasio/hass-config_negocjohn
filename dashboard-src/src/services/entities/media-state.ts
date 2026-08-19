import type { Hass } from '@/models/home-assistant';

/** Estados que significam TV energizada/operacional. */
export const TV_POWER_ON_STATES = ['on', 'playing', 'paused', 'idle', 'buffering'] as const;

/** Estados que significam reprodução efetivamente em andamento. */
export const MEDIA_PLAYING_STATES = ['playing', 'buffering'] as const;

export function isEntityInStates(
  hass: Hass | undefined,
  entityId: string | undefined,
  states: readonly string[],
): boolean {
  if (!hass || !entityId) return false;
  const current = hass.states[entityId]?.state;
  if (!current) return false;
  const normalized = String(current).toLowerCase();
  return states.some((state) => state.toLowerCase() === normalized);
}

export function isTvPowered(hass: Hass | undefined, entityId: string | undefined): boolean {
  return isEntityInStates(hass, entityId, TV_POWER_ON_STATES);
}

export function isMediaPlaying(hass: Hass | undefined, entityId: string | undefined): boolean {
  return isEntityInStates(hass, entityId, MEDIA_PLAYING_STATES);
}

const lastPoweredAt = new Map<string, number>();

/**
 * Absorve apenas OFF transitório publicado pela própria entidade primária.
 * unknown/unavailable nunca são convertidos em ligado.
 */
export function isTvPoweredStable(
  hass: Hass | undefined,
  entityId: string | undefined,
  now = Date.now(),
  graceMs = 45_000,
): boolean {
  if (!hass || !entityId) return false;
  const raw = String(hass.states[entityId]?.state ?? '').toLowerCase();
  if (TV_POWER_ON_STATES.includes(raw as (typeof TV_POWER_ON_STATES)[number])) {
    lastPoweredAt.set(entityId, now);
    return true;
  }
  if (raw !== 'off') return false;
  const last = lastPoweredAt.get(entityId);
  return last !== undefined && now - last <= graceMs;
}

export function resetTvPowerStabilityForTests(): void {
  lastPoweredAt.clear();
}
