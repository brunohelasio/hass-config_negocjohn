import type { Hass } from '@/models/home-assistant';

/** Chama serviço mantendo entity_id e payload no serviceData, como o frontend oficial do HA. */
export function callHaService(
  hass: Hass,
  domain: string,
  service: string,
  data: Record<string, unknown> = {},
): Promise<unknown> {
  return hass.callService(domain, service, data);
}
