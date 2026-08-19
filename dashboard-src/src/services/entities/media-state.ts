import type { Hass } from '@/models/home-assistant';

/**
 * Estados de media_player que significam "energizado / aceitando comandos".
 *
 * `buffering` precisa contar como ligado: pelo contrato do Home Assistant ele
 * representa um player preparando reprodução, não um aparelho desligado.
 */
export const TV_POWER_ON_STATES = ['on', 'playing', 'paused', 'idle', 'buffering'] as const;

/** Estados que significam reprodução em andamento (ou prestes a iniciar). */
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

/** Estado de energia publicado pela entidade primária da TV. */
export function isTvPowered(hass: Hass | undefined, entityId: string | undefined): boolean {
  return isEntityInStates(hass, entityId, TV_POWER_ON_STATES);
}

const ultimoTvLigado = new Map<string, number>();

/**
 * Filtra OFF transitório da entidade de TV sem transformar outra integração em
 * autoridade de energia. Um estado positivo renova a janela; unknown e
 * unavailable continuam falsos.
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
    ultimoTvLigado.set(entityId, now);
    return true;
  }
  if (raw !== 'off') return false;
  const ultimo = ultimoTvLigado.get(entityId);
  return ultimo !== undefined && now - ultimo <= graceMs;
}

export function resetTvPowerStabilityForTests(): void {
  ultimoTvLigado.clear();
}

/** Reprodução, deliberadamente separada do estado de energia. */
export function isMediaPlaying(hass: Hass | undefined, entityId: string | undefined): boolean {
  return isEntityInStates(hass, entityId, MEDIA_PLAYING_STATES);
}
