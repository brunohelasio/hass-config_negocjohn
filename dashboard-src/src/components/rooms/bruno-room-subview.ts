import { LitElement, html, css, nothing } from 'lit';
import type { Hass } from '@/models/home-assistant';
import { ROOMS, type RoomConfig } from '@/config/rooms.config';
import { SUBVIEWS, type SubviewConfig } from '@/config/subviews.config';
import {
  SUBVIEW_BASE_CSS,
  SUBVIEW_APPLIANCES_CSS,
  SUBVIEW_TVHUB_CSS,
  SUBVIEW_PS5_CSS,
  SUBVIEW_SOBREPOSICOES,
} from './subview-styles.generated';

/**
 * Subview de cômodo — arquitetura nova.
 *
 * Substitui os seis arquivos de ~8.900 linhas cada. A medição que autorizou isso
 * está em docs/12: 86% de repetição literal, 111 dos ~120 métodos e 620 das
 * regras de CSS idênticos nos seis.
 *
 * A ESTRUTURA é uma só. O que varia entra por atributo no host, e o CSS gerado
 * já vem escopado por esse atributo:
 *
 *   data-room="<id>"      sobreposição do cômodo (o grid próprio da Cozinha)
 *   data-tvhub            hub com TV — cinco cômodos
 *   data-appliances       eletrodomésticos — só a Cozinha
 *   data-ps5              entrada de PS5 no menu — SÓ A SALA
 *
 * Critério de aceite: reproduzir `scripts/harness/subview-baseline.json` com
 * delta 0,00 nos cinco cômodos, e os três valores próprios da Cozinha.
 *
 * Uso:
 *     type: custom:bruno-room-subview
 *     room: sala
 */

interface SubviewCardConfig {
  room: string;
}

export class BrunoRoomSubview extends LitElement {
  static override properties = {
    _hass: { state: true },
  };

  /** Guardado para o rollback e para diagnostico; ainda nao lido no render. */
  private _config: SubviewCardConfig | undefined;
  private _room?: RoomConfig;
  private _sub: SubviewConfig | undefined;
  private _hass: Hass | undefined;

  setConfig(config: SubviewCardConfig): void {
    if (!config?.room) throw new Error('bruno-room-subview: informe `room`');
    const room = ROOMS.find((r) => r.id === config.room);
    if (!room) throw new Error(`bruno-room-subview: cômodo desconhecido "${config.room}"`);
    this._config = config;
    this._room = room;
    this._sub = SUBVIEWS[config.room];
    void this._config;
    void this._hass;
    this._aplicarAtributos();
  }

  set hass(hass: Hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  getCardSize(): number {
    return 12;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    this._aplicarAtributos();
  }

  /**
   * Os atributos do host são o interruptor de cada bloco de CSS.
   *
   * Ficam no HOST, não numa classe interna, porque o CSS gerado usa
   * `:host([data-…])` — é o que permite base e blocos conviverem na mesma folha
   * sem o grid da Cozinha valer para todos.
   */
  private _aplicarAtributos(): void {
    const room = this._room;
    if (!room) return;
    this.setAttribute('data-room', room.id);

    const ent = this._sub?.entities as Record<string, unknown> | undefined;
    const liga = (nome: string, condicao: boolean) => {
      if (condicao) this.setAttribute(nome, '');
      else this.removeAttribute(nome);
    };

    liga('data-appliances', Boolean(ent?.['appliances'] ?? ent?.['dishwasher']));
    liga('data-tvhub', Boolean(ent?.['tv']));
    // PS5 só existe onde há entidade declarada. Na Sala há; nos outros cinco a
    // chave era string vazia e saiu na geração da configuração.
    liga('data-ps5', Boolean(ent?.['ps5']));
  }

  /** O cômodo tem a coluna de câmeras + hub e o bloco de A/C? */
  private get _temColunaCompleta(): boolean {
    const ent = this._sub?.entities as Record<string, unknown> | undefined;
    return Boolean(ent?.['camera_main'] ?? ent?.['cameras']);
  }

  static override styles = [
    SUBVIEW_BASE_CSS,
    SUBVIEW_TVHUB_CSS,
    SUBVIEW_APPLIANCES_CSS,
    SUBVIEW_PS5_CSS,
    ...Object.values(SUBVIEW_SOBREPOSICOES),
    css`
      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }
    `,
  ];

  override render() {
    const room = this._room;
    if (!room) return nothing;
    const completa = this._temColunaCompleta;

    // A estrutura dos módulos é a mesma dos seis arquivos atuais, com os nomes
    // de classe lidos do DOM renderizado — não deduzidos do código.
    return html`
      <div class="room-subview">
        <div class="subview-topband">
          <div class="topband-badges"></div>
          <div class="topband-clock"></div>
        </div>

        ${completa
          ? html`<div class="content-left">
              <div class="hero-panel"></div>
              <div class="cams-media-row"></div>
            </div>`
          : html`<div class="hero-panel"></div>`}

        <div class="right-column">
          <div class="glass-card lights-card"></div>
          ${completa ? html`<div class="glass-card ac-card ac-card-lean"></div>` : nothing}
        </div>
      </div>
    `;
  }
}

if (!customElements.get('bruno-room-subview')) {
  customElements.define('bruno-room-subview', BrunoRoomSubview);
}

interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
}
const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards ?? [];
if (!w.customCards.some((c) => c.type === 'bruno-room-subview')) {
  w.customCards.push({
    type: 'bruno-room-subview',
    name: 'Bruno · Subview de cômodo',
    description: 'Subview parametrizada por cômodo (arquitetura nova).',
  });
}
