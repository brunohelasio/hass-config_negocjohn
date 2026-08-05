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

      /* Na subview atual o elemento interno do anel e uma DIV, e o anel mede 203,27px. Com um
         SVG no lugar dela media 203,00 exatos, e esse quarto de pixel movia o
         anel 1px para baixo no arredondamento — 424 contra os 423 da
         referencia. Com height 100% o anel mede 203,00 e o real 203,27: fica 1px acima no
         arredondamento. Um quarto de pixel num elemento interno, invisivel, e
         perseguir isso custaria mais do que vale — os seis modulos da linha de
         base batem exatos. */
      .icg-root {
        width: 100%;
        height: 100%;
        display: flex;
      }
      .icg-root > svg {
        display: block;
        width: 100%;
        height: 100%;
      }
    `,
  ];

  /**
   * Barra superior — seis badges e o relógio.
   *
   * Transcrito de `_renderTopBand`. A ordem importa: a Presença é a PRIMEIRA
   * desde 2026-07-29, quando o rodapé saiu e ela subiu para cá. As três marcadas
   * com `data-phone-hide` somem no telefone — a regra era posicional
   * (`nth-child(n+4)`) e virou explícita justamente porque a Presença mudou as
   * posições.
   *
   * O azul da Presença é o mesmo dot dos cards de cômodo (96,165,250) e lê a
   * mesma fonte — `motion_recent` —, para painel e subview nunca discordarem.
   */
  private _renderTopBand() {
    const e = this._room?.entities;
    const hass = this._hass;
    const estado = (id?: string) => (id && hass ? hass.states[id] : undefined);

    const luzes = this._contarLuzes();
    const presencaAtiva = estado(e?.motionRecent)?.state === 'on';

    const badges = [
      { icon: 'mdi:motion-sensor', titulo: 'Presença', sub: this._linhaPresenca(),
        tone: '96,165,250', ativo: presencaAtiva, ocultarNoTelefone: true },
      { icon: 'mdi:lightbulb', titulo: 'Luzes', sub: this._linhaLuzes(),
        tone: '247,198,0', ativo: luzes > 0, ocultarNoTelefone: false },
      { icon: 'mdi:thermometer', titulo: 'Temperatura', sub: this._valorSensor(e?.temperature, 'º'),
        tone: '247,170,90', ativo: false, ocultarNoTelefone: false },
      { icon: 'mdi:water-percent', titulo: 'Umidade', sub: this._valorSensor(e?.humidity, '%'),
        tone: '127,200,233', ativo: false, ocultarNoTelefone: false },
      { icon: 'mdi:router-wireless', titulo: 'Roteador', sub: 'Online',
        tone: '154,160,166', ativo: false, ocultarNoTelefone: true },
      { icon: 'mdi:zigbee', titulo: 'Hub Zigbee', sub: 'Online',
        tone: '154,160,166', ativo: false, ocultarNoTelefone: true },
    ];

    return html`
      <header class="subview-topband">
        <div class="topband-badges">
          ${badges.map(
            (b) => html`
              <div
                class="tb-badge ${b.ativo ? 'is-active' : ''}"
                data-phone-hide=${b.ocultarNoTelefone ? '' : nothing}
                style="--tone: ${b.tone};"
              >
                <span class="tb-badge-icon"><bruno-icon icon=${b.icon}></bruno-icon></span>
                <span class="tb-badge-text">
                  <span class="tb-badge-title">${b.titulo}</span>
                  <span class="tb-badge-sub">${b.sub}</span>
                </span>
              </div>
            `,
          )}
        </div>
        <div class="topband-clock" aria-label="Data e hora">
          <span data-clock>${this._hora()}</span>
          <small>${this._data()}</small>
        </div>
      </header>
    `;
  }

  private _contarLuzes(): number {
    const hass = this._hass;
    const e = this._room?.entities;
    if (!hass || !e?.lights) return 0;
    return e.lights.filter((id) => hass.states[id]?.state === 'on').length;
  }

  private _linhaLuzes(): string {
    const total = this._contarLuzes();
    return total === 1 ? '1 acesa' : `${total} acesas`;
  }

  private _linhaPresenca(): string {
    const hass = this._hass;
    const e = this._room?.entities;
    if (!hass || !e?.semanticState) return 'Sensor indisponível';
    const s = hass.states[e.semanticState];
    const display = s?.attributes['display'];
    if (display) return String(display);
    return hass.states[e.motionRecent ?? '']?.state === 'on' ? 'Presença' : 'Sem presença';
  }

  private _valorSensor(id: string | undefined, sufixo: string): string {
    const s = id && this._hass ? this._hass.states[id] : undefined;
    const bruto = String(s?.state ?? '').toLowerCase();
    if (!s || ['unknown', 'unavailable', 'none', ''].includes(bruto)) return '—';
    return `${s.state}${sufixo}`;
  }

  private _hora(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  private _data(): string {
    return new Date()
      .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'short' })
      .toUpperCase()
      .replace(/-FEIRA/, '-FEIRA');
  }

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
        ${this._renderTopBand()}
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
        ${this._renderHero()}
        <div class="cams-media-row">${this._renderCameras()} ${this._renderMediaHub()}</div>
      </div>
      <div class="right-column">${this._renderLightsDock()} ${this._renderAC()}</div>
    `;
  }

  /**
   * Hero — a foto do cômodo com o dock de cortina sobreposto na base.
   *
   * A hierarquia de três níveis (`hero-stage` > `hero-content` > `curtain-dock`)
   * não é decorativa: é ela que faz a cortina flutuar sobre a foto sem entrar no
   * fluxo. Lida do DOM renderizado.
   */
  private _renderHero() {
    return html`
      <div class="hero-panel">
        <div class="hero-stage hero-atmosphere">
          <div class="hero-content">
            <!-- O dock de cortina aparece nos CINCO cômodos com corpo padrão,
                 mesmo onde não há entidade: nos quatro sem cortina ele renderiza
                 inerte, mostrando "Indisponível". Só a Cozinha não o tem, e ela
                 usa outro corpo. Condicioná-lo à entidade tirava o dock de
                 Office, Casal, Marina e Miguel, que o exibem hoje. -->
            <div class="curtain-dock curtain-overlay">
              <div class="curtain-control-row">
                <div class="curtain-identity">
                  <span class="curtain-icon-shell">
                    <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                  </span>
                  <span class="curtain-title">Cortina</span>
                </div>
                <div class="curtain-status" aria-live="polite">
                  <span class="curtain-status-text">${this._estadoCortina()}</span>
                  <span class="curtain-status-percent">${this._percentualCortina()}</span>
                </div>
                <div class="curtain-main-actions">
                  ${[
                    ['cover-open', 'Abrir'],
                    ['cover-stop', 'Parar'],
                    ['cover-close', 'Fechar'],
                  ].map(
                    ([acao, rotulo]) => html`
                      <button type="button" class="curtain-action-button" data-action=${acao}>
                        <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                        <span>${rotulo}</span>
                      </button>
                    `,
                  )}
                </div>
              </div>
              <div class="curtain-slider-zone">
                <div class="curtain-slider-glow"></div>
                <input class="curtain-range" type="range" min="0" max="100" .value=${String(this._posicaoCortina())} />
                <!-- As marcas sao BOTOES, nao rotulos: cada uma leva a cortina
                     para aquela posicao. Como span elas mediam 17px em vez de
                     22px, e eram os 5px que faltavam na altura do dock. -->
                <div class="curtain-marks">
                  ${[0, 25, 50, 75, 100].map(
                    (fechada) => html`
                      <button
                        type="button"
                        class="curtain-mark"
                        data-action="cover-position"
                        data-position=${100 - fechada}
                        data-closed=${fechada}
                        aria-label="${fechada}% fechada"
                        @click=${() => this._posicionarCortina(100 - fechada)}
                      >
                        ${fechada}%
                      </button>
                    `,
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  private _entidadeCortina(): string | undefined {
    const v = (this._sub?.entities as Record<string, unknown> | undefined)?.['curtain'];
    return typeof v === 'string' ? v : undefined;
  }

  private _posicaoCortina(): number {
    const id = this._entidadeCortina();
    const s = id && this._hass ? this._hass.states[id] : undefined;
    const p = s?.attributes['current_position'];
    return typeof p === 'number' ? p : 100;
  }

  private _estadoCortina(): string {
    const id = this._entidadeCortina();
    if (!id) return 'Indisponível';
    const s = this._hass?.states[id];
    if (!s) return 'Indisponível';
    if (s.state === 'open') return 'Aberta';
    if (s.state === 'closed') return 'Fechada';
    return 'Indisponível';
  }

  private _percentualCortina(): string {
    return `- ${this._posicaoCortina()}%`;
  }

  private _posicionarCortina(posicao: number): void {
    const id = this._entidadeCortina();
    if (!id || !this._hass) return;
    this._hass.callService('cover', 'set_cover_position', { entity_id: id, position: posicao }, { entity_id: id });
  }

  /** Câmeras: cabeçalho com o menu de três pontos + palco com feed e PIP. */
  private _renderCameras() {
    return html`
      <div class="glass-card cameras-card cameras-card-controls">
        <div class="mh-head cameras-head">
          <div class="mh-head-title"></div>
          <div class="mh-menu camera-settings-button"></div>
        </div>
        <div class="camera-stage camera-pip-stage">
          <div class="camera-main camera-feed camera-primary-feed is-private"></div>
          <div class="camera-main camera-feed camera-pip-feed is-private"></div>
        </div>
      </div>
    `;
  }

  /**
   * Hub de mídia: dois tiles no corpo — TV (ou PC, no Office) e Spotify — com o
   * menu de três pontos no canto. A entrada do PS5 vive nesse menu, e só onde há
   * entidade: hoje, apenas a Sala.
   */
  private _renderMediaHub() {
    return html`
      <div class="glass-card media-hub-card mh-accordion">
        <div class="mh-head">
          <div class="mh-head-title"></div>
          <div class="mh-menu"></div>
        </div>
        <div class="mh-sources">
          <div class="mh-source is-open is-active"></div>
          <div class="mh-source is-active"></div>
        </div>
      </div>
    `;
  }

  /** A/C: cabeçalho com power, anel de temperatura e três controles na base. */
  private _renderAC() {
    return html`
      <div class="glass-card ac-card ac-card-lean">
        <div class="ac-lean-head">
          <div class="mh-head-title ac-head-title">
            <span class="micro-icon tone-cyan"><bruno-icon icon="mdi:air-conditioner"></bruno-icon></span>
            <span class="module-title">Ar-condicionado</span>
          </div>
          <div class="ac-top-stack">
            <div class="mh-menu ac-more-button"></div>
            <div class="ac-power-floating"></div>
          </div>
        </div>
        <div class="ac-lean-mid">
          <!-- O anel e um SVG: sem ele o elemento do anel mede zero, porque a altura
               vem do conteúdo, não de uma regra. A proporção 346x203 é a medida
               do anel na subview atual. -->
          <div class="ac-ring">
            <div class="icg-root">
              <svg viewBox="0 0 720 460" preserveAspectRatio="xMidYMid meet"></svg>
            </div>
          </div>
        </div>
        <div class="ac-lean-foot">
          ${[0, 1, 2].map(
            () => html`<div class="ac-control-wrap"><div class="ac-action"></div></div>`,
          )}
        </div>
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
      <div class="hero-panel is-unconfigured">
        <div class="hero-stage hero-atmosphere"><div class="hero-content"></div></div>
      </div>
      <div class="right-column">${this._renderLightsDock()}</div>
      ${this._renderCameras()}
      <div class="glass-card appliances-card kitchen-appliances-card">
        <div class="mh-head appliances-head"></div>
        <div class="appliances-grid"></div>
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
