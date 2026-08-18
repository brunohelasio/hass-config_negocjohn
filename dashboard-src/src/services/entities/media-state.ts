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

/** Reprodução, deliberadamente separada do estado de energia. */
export function isMediaPlaying(hass: Hass | undefined, entityId: string | undefined): boolean {
  return isEntityInStates(hass, entityId, MEDIA_PLAYING_STATES);
}
