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
  /** Estado do dock de iluminacao: fechado por padrao, como nas subviews atuais. */
  private _lightsOpen = false;

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

  /** O cômodo tem eletrodomésticos? Só a Cozinha, e ela usa um grid próprio. */
  private get _temEletrodomesticos(): boolean {
    const ent = this._sub?.entities as Record<string, unknown> | undefined;
    return Boolean(ent?.['appliances'] ?? ent?.['dishwasher']);
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

  /**
   * Dock de iluminação — a faixa de 54px na coluna direita, acima do A/C.
   *
   * Transcrito de `_renderLightsDock` das subviews atuais. A altura de 54px vem
   * da faixa fechada, não de um valor no CSS: é o `lights-dock` com o botão de
   * título à esquerda e os dois chips à direita. Renderizar o cartão vazio dava
   * 2px — só as bordas — e era a única divergência que sobrava contra a linha
   * de base.
   *
   * O corpo (`lights-body`) existe sempre; quem o abre é a classe `is-open` no
   * cartão, e o CSS resolve a altura. As seções de zona entram no passo
   * seguinte — a faixa fechada já fecha a geometria.
   */
  private _renderLightsDock() {
    const aberto = this._lightsOpen;
    const classes = ['glass-card', 'lights-card', aberto ? 'is-open' : ''].filter(Boolean).join(' ');
    return html`
      <div class=${classes}>
        <div class="lights-dock">
          <button
            type="button"
            class="lights-dock-id"
            aria-expanded=${aberto ? 'true' : 'false'}
            @click=${() => {
              this._lightsOpen = !this._lightsOpen;
              this.requestUpdate();
            }}
          >
            <span class="micro-icon tone-amber"><bruno-icon icon="mdi:lightbulb-group"></bruno-icon></span>
            <span class="module-title">Iluminação</span>
            <span class="lights-dock-chevron" aria-hidden="true">
              <bruno-icon icon="mdi:chevron-up"></bruno-icon>
            </span>
          </button>
          <div class="lights-dock-actions">
            <button type="button" class="chip-button is-active" @click=${() => this._todasAsLuzes('turn_on')}>
              Todas acesas
            </button>
            <button type="button" class="chip-button" @click=${() => this._todasAsLuzes('turn_off')}>
              Apagar todas
            </button>
          </div>
        </div>
        <div class="lights-body">
          <div class="lights-body-clip">
            <div class="lights-scroll"></div>
          </div>
        </div>
      </div>
    `;
  }

  private _todasAsLuzes(servico: 'turn_on' | 'turn_off'): void {
    const grupo = this._room?.entities.lightGroup;
    if (!grupo || !this._hass) return;
    this._hass.callService('light', servico, { entity_id: grupo }, { entity_id: grupo });
  }

  override render() {
    const room = this._room;
    if (!room) return nothing;

    // A estrutura dos módulos é a mesma dos seis arquivos atuais, com os nomes
    // de classe e as áreas de grid lidos do DOM RENDERIZADO — não deduzidos do
    // código, que guarda sete definições empilhadas e blocos mortos.
    return html`
      <div class="room-subview">
        <div class="subview-topband">
          <div class="topband-badges"></div>
          <div class="topband-clock"></div>
        </div>
        ${this._temEletrodomesticos ? this._corpoCozinha() : this._corpoPadrao()}
      </div>
    `;
  }

  /**
   * Cinco cômodos: coluna esquerda (hero + linha de câmeras/hub) e coluna
   * direita (dock de luzes + A/C), dentro de `content-left` e `right-column`.
   */
  private _corpoPadrao() {
    return html`
      <div class="content-left">
        <div class="hero-panel"></div>
        <div class="cams-media-row"></div>
      </div>
      <div class="right-column">
        ${this._renderLightsDock()}
        <div class="glass-card ac-card ac-card-lean"></div>
      </div>
    `;
  }

  /**
   * Cozinha: grid próprio de três colunas.
   *
   *   "topband topband topband"
   *   "hero    hero    right"
   *   "cams    appliances appliances"
   *
   * Não há `content-left` nem A/C, e o hero, as câmeras e os eletrodomésticos
   * são filhos DIRETOS da raiz — cada um ocupando sua área. Lido do DOM da
   * subview atual; deduzir do CSS teria dado o grid errado, porque o arquivo
   * guarda definições antigas empilhadas.
   */
  private _corpoCozinha() {
    return html`
      <div class="hero-panel is-unconfigured"></div>
      <div class="right-column">${this._renderLightsDock()}</div>
      <div class="glass-card cameras-card cameras-card-controls"></div>
      <div class="glass-card appliances-card kitchen-appliances-card"></div>
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
