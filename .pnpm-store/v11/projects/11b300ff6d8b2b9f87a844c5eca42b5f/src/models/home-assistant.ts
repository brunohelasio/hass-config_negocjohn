/**
 * Tipos mínimos do objeto `hass` injetado pelo Home Assistant nos custom cards.
 *
 * O HA não publica tipos estáveis para isto; declaramos só o que consumimos.
 * Ampliar conforme necessário — não copiar a definição inteira do frontend.
 */

export interface HassEntity {
  entity_id: string;
  state: string;
  attributes: Record<string, unknown>;
  last_changed: string;
  last_updated: string;
}

export interface HassServiceTarget {
  entity_id?: string | string[];
  device_id?: string | string[];
  area_id?: string | string[];
}

export interface Hass {
  states: Record<string, HassEntity | undefined>;
  themes?: { darkMode?: boolean };
  language?: string;
  callService(
    domain: string,
    service: string,
    serviceData?: Record<string, unknown>,
    target?: HassServiceTarget,
  ): Promise<unknown>;
  callWS?<T>(msg: Record<string, unknown>): Promise<T>;
  /**
   * A conexão WebSocket crua.
   *
   * Declarada só pelo que consumimos: `subscribeMessage`, que é como o Home
   * Assistant entrega uma sequência de respostas para um mesmo comando — o caso
   * da negociação WebRTC de câmera, em que a oferta devolve sessão, resposta e
   * candidatos ao longo do tempo. `callWS` entrega uma resposta só e não serve.
   */
  connection?: {
    subscribeMessage<T>(
      callback: (msg: T) => void,
      msg: Record<string, unknown>,
    ): Promise<() => void>;
  };
}

/** Estados que contam como "ligado", por domínio. */
const ON_STATES: Record<string, readonly string[]> = {
  light: ['on'],
  switch: ['on'],
  fan: ['on'],
  input_boolean: ['on'],
  binary_sensor: ['on'],
  media_player: ['playing', 'on', 'paused', 'buffering'],
  climate: ['cool', 'heat', 'heat_cool', 'auto', 'dry', 'fan_only'],
  cover: ['open', 'opening'],
  lock: ['unlocked'],
  vacuum: ['cleaning', 'returning'],
};

/**
 * Está ligado?
 *
 * Existe porque a lógica de `state_on` está hoje reimplementada solta em vários
 * cards, e divergiu: o botão do A/C não acendia porque o template base não
 * conhecia os estados de `climate` (P5 em docs/09-known-issues.md). Uma
 * definição, testada.
 */
export function isOn(entity: HassEntity | undefined): boolean {
  if (!entity) return false;
  if (entity.state === 'unavailable' || entity.state === 'unknown') return false;
  const domain = entity.entity_id.split('.')[0] ?? '';
  const states = ON_STATES[domain] ?? ['on'];
  return states.includes(entity.state);
}

/** Indisponível ou desconhecida — merece fallback visual, não um valor falso. */
export function isUnavailable(entity: HassEntity | undefined): boolean {
  return !entity || entity.state === 'unavailable' || entity.state === 'unknown';
}
