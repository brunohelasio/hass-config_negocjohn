import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import type { Hass } from '@/models/home-assistant';
import { ROOMS, type RoomConfig } from '@/config/rooms.config';
import { lightsSummary, semanticLine, isRoomOn, firstSensorValue } from '@/services/entities/room-state';

/**
 * Tile de cômodo — arquitetura nova.
 *
 * Especificação: docs/07-design-system.md, seção "Composição canônica do tile de
 * cômodo". Os 8 cards atuais já são consistentes entre si; este componente
 * precisa REPRODUZIR essa composição, não propor outra.
 *
 * Uso:
 *     type: custom:bruno-room-tile
 *     room: corredor
 *     variant: tile
 *     divider_left: true
 */

interface TileConfig {
  room: string;
  variant?: string;
  divider_left?: boolean;
  name?: string;
}

interface StatusDot {
  icon: string;
  label: string;
  tone: string;
  on: boolean;
}

const ACTION_COOLDOWN_MS = 1200;

export class BrunoRoomTile extends LitElement {
  static override properties = {
    _hass: { state: true },
    _tileMode: { state: true },
  };

  private _config?: TileConfig;
  private _room?: RoomConfig;
  private _hass?: Hass;
  private _tileMode = false;
  private _lastAction = 0;
  private _signature = '';

  setConfig(config: TileConfig): void {
    if (!config?.room) throw new Error('bruno-room-tile: informe `room`');
    const room = ROOMS.find((r) => r.id === config.room);
    if (!room) throw new Error(`bruno-room-tile: cômodo desconhecido "${config.room}"`);
    this._config = config;
    this._room = room;
  }

  getCardSize(): number {
    return 3;
  }

  /**
   * O objeto hass muda a cada alteração de estado de QUALQUER entidade da casa.
   * Só re-renderiza quando muda algo que este tile realmente lê — é o contrato
   * que substitui o re-render total dos cards atuais (A2 em docs/09).
   */
  set hass(hass: Hass) {
    this._hass = hass;
    const sig = this._buildSignature(hass);
    if (sig === this._signature) return;
    this._signature = sig;
    this.requestUpdate();
  }

  private _watched(): string[] {
    const e = this._room?.entities;
    if (!e) return [];
    return [
      e.lightGroup,
      ...(e.lights ?? []),
      e.motionRecent,
      e.occupancy,
      e.semanticState,
      e.temperature,
      e.humidity,
      e.climate,
    ].filter((x): x is string => typeof x === 'string');
  }

  private _buildSignature(hass: Hass): string {
    return this._watched()
      .map((id) => {
        const s = hass.states[id];
        return s ? `${id}=${s.state}@${s.last_changed}` : `${id}=∅`;
      })
      .join('|');
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._readTileMode();
  }

  override firstUpdated(_changed: PropertyValues): void {
    this._readTileMode();
  }

  /**
   * Modo tile: DUAS condições simultâneas, ambas obrigatórias.
   *
   *   1. variant: tile  — vem do YAML, só a faixa de cômodos passa isso
   *   2. --bruno-tile-mode: on  — só o tema Josh define
   *
   * Sem as duas, o card renderiza como cartão de vidro. Foi exatamente este o
   * erro da primeira tentativa da Fase 5a: o tile ficou de vidro enquanto os
   * outros oito seguiam o Josh. Ver docs/07.
   */
  private _readTileMode(): void {
    let value = '';
    try {
      value = getComputedStyle(this).getPropertyValue('--bruno-tile-mode').trim();
    } catch {
      value = '';
    }
    const next = value === 'on' && this._config?.variant === 'tile';
    if (next !== this._tileMode) {
      this._tileMode = next;
      this.requestUpdate();
    }
  }

  private _toggle = (): void => {
    const now = Date.now();
    if (now - this._lastAction < ACTION_COOLDOWN_MS) return;
    this._lastAction = now;

    const e = this._room?.entities;
    const target = e?.lightGroup ?? e?.lights?.[0];
    if (!target || !this._hass) return;
    void this._hass.callService('light', 'toggle', {}, { entity_id: target });
  };

  private _dots(): StatusDot[] {
    const hass = this._hass;
    const e = this._room?.entities;
    if (!hass || !e) return [];
    const dots: StatusDot[] = [];

    // Presença: o ponto lê SÓ motion_recent. A ocupação, que é lenta, vive
    // apenas no texto — ver docs/10 e o incidente do recent_only em docs/11.
    if (e.motionRecent) {
      dots.push({
        icon: 'mdi:account',
        label: 'Presença',
        tone: 'blue',
        on: hass.states[e.motionRecent]?.state === 'on',
      });
    }
    if (e.climate) {
      const s = hass.states[e.climate]?.state ?? '';
      dots.push({
        icon: 'mdi:snowflake',
        label: 'Ar condicionado',
        tone: 'cyan',
        on: ['cool', 'heat', 'heat_cool', 'auto', 'dry', 'fan_only'].includes(s),
      });
    }
    return dots.filter((d) => d.on);
  }

  private _statusLines(): string[] {
    const hass = this._hass;
    const e = this._room?.entities;
    if (!hass || !e) return [];

    const lights = lightsSummary({
      hass,
      groupEntityId: e.lightGroup,
      fallbackLightIds: e.lights,
    });
    const semantic = semanticLine({
      hass,
      semanticSensorId: e.semanticState,
      motionRecentId: e.motionRecent,
      occupancyId: e.occupancy,
    });

    return [lights.label, semantic].filter((s): s is string => Boolean(s));
  }

  static override styles = css`
    :host {
      /* Raio e tokens locais — cópia dos cards atuais (docs/07). */
      --card-radius: var(--bruno-liquid-room-radius, var(--bruno-liquid-card-radius-compact, 16px));
      --accent: 150, 190, 255;
      --accent-blue: 96, 165, 250;
      --accent-cyan: 79, 172, 254;
      --accent-amber: 255, 153, 0;
      --text-main: rgba(245, 250, 255, 0.96);
      --text-soft: rgba(255, 255, 255, 0.4);
      --text-muted: rgba(255, 255, 255, 0.52);
      --dot-off-bg: rgba(255, 255, 255, 0.08);
      --dot-off-border: rgba(255, 255, 255, 0.12);
      --dot-off-icon: rgba(255, 255, 255, 0.35);
      --room-icon-size: 94px;

      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      margin: 0;
      padding: 0;
      contain: layout style;
    }

    /* Cartão de vidro — estado padrão, fora do modo tile.
       Os literais sao FALLBACK: valem so se o tema nao tiver carregado.
       Nunca substituir os tokens por valores fixos (docs/07). */
    .room-card {
      position: relative;
      isolation: isolate;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      color: var(--text-main);
      background: var(
        --bruno-liquid-surface-off-background,
        radial-gradient(165px 150px at 15% -9%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.042) 44%, transparent 73%),
        radial-gradient(150px 150px at 96% 92%, rgba(var(--accent), 0.09), transparent 69%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.118), rgba(255, 255, 255, 0.034) 36%, rgba(255, 255, 255, 0.056)),
        linear-gradient(155deg, rgba(18, 24, 36, 0.74), rgba(11, 14, 22, 0.61) 49%, rgba(33, 27, 25, 0.32))
      );
      backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
      -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
      border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255, 255, 255, 0.13));
      border-radius: var(--card-radius);
      box-shadow: var(
        --bruno-liquid-surface-off-shadow,
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        inset 1px 0 0 rgba(255, 255, 255, 0.1),
        inset -1px -1px 0 rgba(255, 255, 255, 0.026),
        0 18px 44px rgba(0, 0, 0, 0.27),
        0 0 24px rgba(110, 150, 210, 0.055)
      );
      overflow: hidden;
    }

    .room-card.is-room-on {
      --text-main: rgba(248, 251, 255, 0.96);
      --text-soft: rgba(255, 255, 255, 0.52);
      --text-muted: rgba(255, 255, 255, 0.62);
      --dot-off-bg: rgba(8, 12, 20, 0.22);
      --dot-off-border: rgba(255, 255, 255, 0.2);
      --dot-off-icon: rgba(255, 255, 255, 0.66);
      background: var(
        --bruno-liquid-surface-on-background,
        radial-gradient(170px 134px at 12% -10%, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.105) 52%, transparent 75%),
        radial-gradient(165px 148px at 98% 94%, rgba(135, 185, 245, 0.24), transparent 68%),
        radial-gradient(122px 96px at 27% 18%, rgba(255, 232, 126, 0.105), transparent 71%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.225), rgba(255, 255, 255, 0.073) 43%, rgba(255, 255, 255, 0.108)),
        linear-gradient(155deg, rgba(42, 51, 65, 0.72), rgba(23, 28, 38, 0.58) 52%, rgba(13, 16, 24, 0.44))
      );
      backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
      -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
      border-color: var(--bruno-liquid-surface-on-border-color, rgba(255, 255, 255, 0.24));
      box-shadow: var(
        --bruno-liquid-surface-on-shadow,
        inset 0 1px 0 rgba(255, 255, 255, 0.32),
        inset 1px 0 0 rgba(255, 255, 255, 0.13),
        inset 0 -1px 0 rgba(0, 0, 0, 0.18),
        0 0 22px rgba(255, 255, 255, 0.09),
        0 0 34px rgba(120, 170, 235, 0.1),
        0 18px 42px rgba(0, 0, 0, 0.28)
      );
    }

    /* Modo tile (tema Josh + variant: tile). Superfície chata, sem moldura
       propria — quem desenha o fundo e a faixa que hospeda os tiles. */
    .room-card.is-tile {
      background: var(--bruno-tile-off-background, transparent);
      backdrop-filter: var(--bruno-tile-off-filter, none);
      -webkit-backdrop-filter: var(--bruno-tile-off-filter, none);
      border: 0;
      border-radius: var(--bruno-tile-radius, 0);
      box-shadow: none;
    }

    .room-card.is-tile.is-room-on {
      background: var(--bruno-tile-on-background, rgba(255, 255, 255, 0.05));
      backdrop-filter: var(--bruno-tile-on-filter, none);
      -webkit-backdrop-filter: var(--bruno-tile-on-filter, none);
      border: 0;
      box-shadow: none;
    }

    .tile-divider {
      position: absolute;
      left: 0;
      top: 12px;
      bottom: 12px;
      width: 1px;
      z-index: 2;
      pointer-events: none;
      background: var(--bruno-tile-divider, rgba(255, 255, 255, 0.08));
    }

    .room-action {
      appearance: none;
      -webkit-appearance: none;
      outline: none;
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: grid;
      grid-template-columns: minmax(0, 124px) minmax(0, 1fr) 40px;
      grid-template-rows: auto minmax(0, 1fr) auto auto;
      grid-template-areas:
        'icon space right'
        'icon space right'
        'title title right'
        'state state right';
      column-gap: 6px;
      row-gap: 0;
      align-items: start;
      /* 14px 11px 13px — medido no Office. O 14px a direita veio do Corredor. */
      padding: 14px 11px 13px;
      margin: 0;
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: var(--card-radius);
      box-shadow: none;
      overflow: hidden;
      cursor: pointer;
      transition: transform var(--bruno-liquid-motion-fast, 160ms ease);
    }

    /* Medido no bruno-office-card renderizado, nao lido do config.
       A caixa do icone NAO e quadrada: largura fluida com teto de 124px e
       ALTURA FIXA de 82px. O valor "icon_size: 94" que aparece no config dos
       cards e fallback — o CSS o sobrescreve, e foi copia-lo que deixou meu
       icone 12px mais alto que o real. Sem margens negativas: Office usa 0 e 1px. */
    .room-icon {
      grid-area: icon;
      justify-self: start;
      align-self: start;
      position: relative;
      width: 100%;
      max-width: 124px;
      height: 82px;
      margin-left: 0;
      margin-top: 1px;
    }

    .room-asset-wrap {
      position: absolute;
      inset: 0;
      display: block;
    }

    .room-asset {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: opacity var(--bruno-liquid-motion-fast, 160ms ease);
    }

    .room-asset-on {
      opacity: 0;
    }
    .room-card.is-room-on .room-asset-off {
      opacity: 0;
    }
    .room-card.is-room-on .room-asset-on {
      opacity: 1;
    }

    .room-nav-zone {
      grid-area: title;
      grid-row: 3 / 5;
      min-width: 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      /* O grid tem align-items: start; sem isto a zona ancora no topo da area
         e o bloco de texto desce ~4px em relacao ao card real. */
      align-self: end;
    }

    /* Chevron: so em comodo COM subview. O Corredor nao tem — ali ele seria
       promessa falsa de navegacao. E ele que torna a linha do titulo mais alta
       nos demais cards; sem ele o bloco de texto sentava 3,7px mais baixo. */
    .room-title-row {
      display: flex;
      align-items: center;
      gap: 4px;
      min-width: 0;
    }

    .chevron {
      flex: none;
      font-size: 13px;
      line-height: 1;
      font-weight: 700;
      color: var(--text-soft);
      transform: translateY(-1px);
    }

    .title {
      display: block;
      min-width: 0;
      margin: 0 0 2px 0;
      font-size: 15px;
      line-height: 1.18;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .status-lines {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      font-size: 11px;
      line-height: 1.16;
      font-weight: 500;
      color: var(--text-soft);
      overflow: hidden;
    }

    .right-rail {
      grid-area: right;
      justify-self: center;
      align-self: start;
      margin: 0;
      padding-top: 1px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      transform: translate(5px, -3px);
    }

    /* Medido no bruno-office-card, que E um card COM temperatura.
       36px de largura com texto centralizado deixa o dot de 26px centrado,
       sobrando 5px de cada lado — e o que alinha a metrica com os dots.

       NAO copiar do bruno-corredor-card: aquele comodo nao tem sensor de
       temperatura, a metrica nunca renderiza, e os valores de la (48px,
       text-align: left, margin-left 6px) sao codigo morto que nunca foi
       exercitado. Foi o que deslocou a temperatura na primeira versao. */
    .metric {
      min-width: 36px;
      text-align: center;
      line-height: 1.1;
    }
    .metric-value {
      display: block;
      font-size: 13px;
      line-height: 1;
      font-weight: 760;
      color: var(--text-main);
    }
    .metric-sub {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      line-height: 1;
      font-weight: 600;
      color: var(--text-muted);
    }

    .status-stack {
      display: flex;
      flex-direction: column;
      gap: 7px;
    }

    .status-dot {
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      position: relative;
      color: rgb(var(--tone));
      background:
        radial-gradient(17px 15px at 50% 44%, rgba(var(--tone), 0.24), transparent 72%),
        rgba(6, 10, 18, 0.28);
      border: 1px solid rgba(var(--tone), 0.6);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        0 0 8px rgba(var(--tone), 0.34),
        0 0 18px rgba(var(--tone), 0.24),
        0 0 30px rgba(var(--tone), 0.12);
      transform: translateZ(0) scale(1.04);
    }
    .status-dot.tone-blue {
      --tone: var(--accent-blue);
    }
    .status-dot.tone-cyan {
      --tone: var(--accent-cyan);
    }
    .status-dot.tone-amber {
      --tone: var(--accent-amber);
    }

    /* Josh: material flat dos dots, restrito ao modo tile. */
    .room-card.is-tile .status-dot {
      background: rgba(var(--tone), var(--bruno-tile-status-dot-fill-alpha, 0.22));
      border: var(--bruno-tile-status-dot-border, 1px solid rgba(255, 255, 255, 0.14));
      box-shadow: 0 0 var(--bruno-tile-status-dot-halo-size, 10px)
        rgba(var(--tone), var(--bruno-tile-status-dot-halo-alpha, 0.2));
    }

    @media (prefers-reduced-motion: reduce) {
      .room-action,
      .room-asset {
        transition: none;
      }
    }
  `;

  override render() {
    const room = this._room;
    const hass = this._hass;
    if (!room) return nothing;

    const on = hass ? isRoomOn(hass, room.entities.lightGroup ?? room.entities.lights?.[0]) : false;
    const temp = hass ? firstSensorValue(hass, room.entities.temperature ? [room.entities.temperature] : [], '°') : '';
    const hum = hass ? firstSensorValue(hass, room.entities.humidity ? [room.entities.humidity] : [], '%') : '';
    const lines = this._statusLines();
    const dots = this._dots();

    // Caminho explicito da configuracao, nao montado por convencao: o Q. Casal
    // usa "-generated-v3" e existe um "-tight" orfao com outra dimensao, que a
    // convencao carregava por engano.
    const v = '20260803-normalized-2';
    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}.png?v=${v}` : '';
    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}.png?v=${v}` : '';

    const classes = [
      'room-card',
      on ? 'is-room-on' : '',
      this._tileMode ? 'is-tile' : '',
      this._tileMode && this._config?.divider_left ? 'has-divider' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <div class=${classes} @click=${this._toggle}>
        ${this._tileMode && this._config?.divider_left
          ? html`<span class="tile-divider" aria-hidden="true"></span>`
          : nothing}
        <button class="room-action" type="button" aria-label=${this._config?.name ?? room.name}>
          <div class="room-icon" aria-hidden="true">
            <span class="room-asset-wrap">
              ${off ? html`<img class="room-asset room-asset-off" src=${off} alt="" decoding="async" />` : nothing}
              ${onImg ? html`<img class="room-asset room-asset-on" src=${onImg} alt="" decoding="async" />` : nothing}
            </span>
          </div>

          <span class="room-nav-zone">
            <span class="room-title-row">
              <span class="title">${this._config?.name ?? room.name}</span>
              ${room.section
                ? html`<span class="chevron" aria-hidden="true">›</span>`
                : nothing}
            </span>
            <span class="status-lines">${lines.map((l) => html`<span>${l}</span>`)}</span>
          </span>

          <div class="right-rail" aria-label="Status do ambiente">
            ${temp || hum
              ? html`<div class="metric">
                  <span class="metric-value">${temp}</span>
                  <span class="metric-sub">${hum}</span>
                </div>`
              : nothing}
            <div class="status-stack">
              ${dots.map(
                (d) => html`<span class="status-dot tone-${d.tone}" title=${d.label}>
                  <bruno-icon icon=${d.icon}></bruno-icon>
                </span>`,
              )}
            </div>
          </div>
        </button>
      </div>
    `;
  }
}

if (!customElements.get('bruno-room-tile')) {
  customElements.define('bruno-room-tile', BrunoRoomTile);
}

interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
}
const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards ?? [];
if (!w.customCards.some((c) => c.type === 'bruno-room-tile')) {
  w.customCards.push({
    type: 'bruno-room-tile',
    name: 'Bruno · Tile de cômodo',
    description: 'Tile parametrizado por cômodo (arquitetura nova).',
  });
}
