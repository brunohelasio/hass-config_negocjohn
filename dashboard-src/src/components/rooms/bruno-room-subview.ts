import { LitElement, html, css, svg, nothing } from 'lit';
import type { Hass } from '@/models/home-assistant';
import { ROOMS, type RoomConfig } from '@/config/rooms.config';
import { SUBVIEWS, type SubviewConfig } from '@/config/subviews.config';
import { spotifyTocandoEm } from '@/services/entities/spotify-device';
import {
  conectou,
  desconectou,
  medirRender,
  intervalo,
  espera,
  encerrarTimer,
  requisicaoManual,
} from '@/diagnostics/runtime/probe';

/** Nome deste componente no coletor de runtime (Fase 6.0). */
const SONDA = 'bruno-room-subview';
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

function truthy(v: unknown): boolean {
  if (v === true) return true;
  if (typeof v === 'number') return v > 0;
  return ['true', 'on', 'yes', '1'].includes(String(v ?? '').toLowerCase());
}

/** Estados que contam como "ligado" em cada domínio — copiados dos originais. */
const ESTADOS_TV_LIGADA = ['on', 'playing', 'paused', 'idle'];
const ESTADOS_MIDIA_LIGADA = ['playing', 'paused', 'on', 'idle'];
const ESTADOS_CAMERA_ONLINE = ['streaming', 'recording', 'idle', 'on'];
const ESTADOS_CLIMATE_LIGADO = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const ACOES_CLIMATE_ATIVAS = ['cooling', 'heating', 'drying', 'fan', 'preheating'];
const ACOES_CLIMATE_INATIVAS = ['off', 'idle'];

/** `refresh_interval` das subviews atuais: 6.500 ms, com piso de 4.000. */
const INTERVALO_CAMERAS = 6500;

const IMAGEM_TV_ESPERA = '/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1';
const IMAGEM_SPOTIFY_ESPERA = '/local/images/echo_pop.png?v=20260702-all-images-1';
const IMAGEM_PC = '/local/images/office_pc.png?v=20260702-all-images-1';

function numero(valor: unknown, casas = 0): string {
  const n = Number(valor);
  if (!Number.isFinite(n)) return '--';
  return n.toFixed(casas).replace(/\.0+$/, '');
}

function duracao(segundos: number): string {
  const s = Math.max(0, Math.floor(Number(segundos) || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
  return `${m}:${String(r).padStart(2, '0')}`;
}

/** Selo de tempo na URL do instantâneo — o proxy do HA não muda o caminho. */
function comSelo(src: string, selo: number): string {
  if (!src) return '';
  return `${src}${src.includes('?') ? '&' : '?'}bruno_t=${selo || Date.now()}`;
}

function capitalizar(v: unknown): string {
  const t = String(v ?? '').replace(/_/g, ' ').trim();
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '—';
}

interface EstadoHa {
  state: string;
  attributes: Record<string, unknown>;
  last_changed?: string;
}

interface CameraCfg {
  entity: string;
  name?: string;
  shortName?: string;
  controls?: Array<{ key?: string; label?: string; description?: string; icon?: string; entity?: string }>;
}

interface CameraViva extends CameraCfg {
  online: boolean;
  indisponivel: boolean;
  base: string;
  url: string;
}

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

  // ── Estado de interação ────────────────────────────────────────────────────
  // Os originais guardam tudo isto em campos de instância e chamam `_safeRender`.
  // Aqui basta `requestUpdate()`: o Lit reconcilia só o que mudou.

  /** Fonte escolhida à mão no hub. Vazio = prioridade automática. */
  private _fonteMidia = '';
  /** Fontes que estavam ativas no render anterior — detecta ativação nova. */
  private _midiaAtivasAntes: string[] = [];
  private _menuMidiaAberto = false;
  private _spotifyFerramentas = false;
  /** Painel de A/C aberto: 'mode' | 'fan' | 'swing' | ''. */
  private _painelClima = '';
  private _controlesCameraAbertos = false;
  /** Câmera promovida ao feed principal pelo toque no PIP. */
  private _cameraAtiva = '';

  // Cache-bust das imagens de câmera. O original troca o selo a cada ciclo e
  // pré-carrega a imagem nova antes de trocar o `src`, para não piscar.
  private _seloCameras = Date.now();
  private _urlsCarregadas: Record<string, string> = {};
  private _ultimaImagem: Record<string, string> = {};
  private _timerCameras: number | undefined;

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

  /**
   * Mede o custo de cada atualização (Fase 6.0.1).
   *
   * No `update()`, e não no `render()`: é aqui que o Lit constrói E aplica o
   * DOM. Medir só o `render()` mediria a montagem do template, que é a parte
   * barata — e o número enganaria.
   */
  override update(mudancas: Map<string, unknown>): void {
    medirRender(SONDA, () => super.update(mudancas));
  }

  override connectedCallback(): void {
    super.connectedCallback();
    conectou(SONDA);
    this._aplicarAtributos();
    // O material do tema NÃO vem do CSS gerado: vem de um módulo global, que
    // marca o host com data-bruno-subview-surface-theme e reage à troca de tema.
    // Sem estas duas chamadas as câmeras, o hub e o A/C perdem a pele de tile do
    // Josh e viram contornos — foi exatamente o que aconteceu na primeira
    // publicação. Ver CLAUDE.md, seções REV.14 a REV.18.
    const g = globalThis as {
      BrunoLiquidGlass?: { apply?: () => void };
      BrunoSurfaceMaterial?: { connect?: (h: unknown) => void; disconnect?: (h: unknown) => void };
    };
    g.BrunoLiquidGlass?.apply?.();
    g.BrunoSurfaceMaterial?.connect?.(this);
    this._injetarMaterial();
    this._iniciarTimerCameras();
    this._iniciarTimerRelogio();
  }

  /**
   * O relógio da barra superior.
   *
   * Nada no hass muda de minuto em minuto, então sem um ciclo próprio a hora
   * congela no momento em que a subview abriu. O ciclo é de 15s e só redesenha
   * quando o minuto realmente vira.
   */
  private _iniciarTimerRelogio(): void {
    if (this._timerRelogio) return;
    this._timerRelogio = intervalo(SONDA, () => {
      const minuto = this._hora();
      if (minuto === this._ultimoMinuto) return;
      this._ultimoMinuto = minuto;
      this.requestUpdate();
    }, 15000);
  }

  private _ultimoMinuto = '';
  private _timerRelogio: number | undefined;

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    desconectou(SONDA);
    const g = globalThis as {
      BrunoSurfaceMaterial?: { disconnect?: (h: unknown) => void };
    };
    g.BrunoSurfaceMaterial?.disconnect?.(this);
    this._pararTimerCameras();
    if (this._timerLuzes) {
      encerrarTimer(SONDA, this._timerLuzes);
      this._timerLuzes = undefined;
    }
    if (this._timerRelogio) {
      encerrarTimer(SONDA, this._timerRelogio);
      this._timerRelogio = undefined;
    }
  }

  /**
   * Atualização periódica dos instantâneos de câmera.
   *
   * O quadro chega por `/api/camera_proxy/<entidade>`, com um selo de tempo na
   * query. A imagem nova é pré-carregada fora da árvore e só substitui a antiga
   * quando termina de baixar — é o que evita o piscar entre um quadro e outro.
   */
  private _iniciarTimerCameras(): void {
    if (this._timerCameras) return;
    // O quadro da câmera não chega por estado do hass — `entity_picture` só muda
    // de token, não de conteúdo. O ciclo é inevitável; o id fica guardado e o
    // `disconnectedCallback` logo abaixo o limpa.
    this._timerCameras = intervalo(SONDA, () => this._atualizarCameras(), INTERVALO_CAMERAS);
  }

  private _pararTimerCameras(): void {
    if (!this._timerCameras) return;
    encerrarTimer(SONDA, this._timerCameras);
    this._timerCameras = undefined;
  }

  private _atualizarCameras(): void {
    const raiz = this.shadowRoot;
    if (!raiz || !this._hass) return;
    const selo = Date.now();
    this._seloCameras = selo;

    for (const img of raiz.querySelectorAll<HTMLImageElement>('img[data-camera-src-base]')) {
      const base = img.dataset['cameraSrcBase'];
      const entityId = img.dataset['cameraEntity'];
      if (!base) continue;
      const proxima = comSelo(base, selo);
      // Instrumentado (Fase 6.0.1): o instantâneo da câmera é a requisição mais
      // frequente do painel — uma por câmera a cada 6,5s. `fetch` não a
      // enxerga, porque quem baixa é o próprio elemento de imagem; por isso o
      // tempo é medido aqui, na mão, e entra no coletor como requisição.
      const carregador = new Image();
      const t0 = performance.now();
      carregador.onload = () => {
        requisicaoManual(SONDA, performance.now() - t0, true);
        if (entityId) this._urlsCarregadas[entityId] = proxima;
        img.src = proxima;
        img.removeAttribute('hidden');
        img.classList.add('is-loaded');
        img.closest('.camera-main')?.classList.add('has-loaded-image');
      };
      carregador.onerror = () => requisicaoManual(SONDA, performance.now() - t0, false);
      carregador.src = proxima;
    }
  }

  /**
   * Injeta a folha de material do tema no shadow root.
   *
   * `subviewStyles()` devolve o CSS da pele das tiles (câmeras, hub, A/C,
   * cartela de iluminação). As subviews atuais o interpolam dentro do próprio
   * `<style>`; aqui ele entra como folha adotada, depois das folhas estáticas,
   * para manter a mesma ordem de cascata.
   *
   * O módulo pode ainda não ter carregado quando o componente conecta — daí a
   * segunda tentativa no próximo quadro.
   */
  private _injetarMaterial(tentativa = 0): void {
    const raiz = this.shadowRoot;
    if (!raiz || this._materialInjetado) return;
    // A instrumentação da Fase 6.0 mostrou esta cadeia disparando até 1,2s
    // depois de o componente sair da árvore (20 tentativas de 60ms). Não era
    // vazamento — os timeouts se encerram sozinhos —, mas era trabalho feito
    // sobre um componente morto, e o custo aparecia na medição. Sair aqui
    // encerra a cadeia na hora.
    if (!this.isConnected) return;
    const g = globalThis as { BrunoSurfaceMaterial?: { subviewStyles?: () => string } };
    const css = g.BrunoSurfaceMaterial?.subviewStyles?.();
    if (!css) {
      if (tentativa < 20) espera(SONDA, () => this._injetarMaterial(tentativa + 1), 60);
      return;
    }
    try {
      const folha = new CSSStyleSheet();
      folha.replaceSync(css);
      raiz.adoptedStyleSheets = [...raiz.adoptedStyleSheets, folha];
      this._materialInjetado = true;
    } catch {
      // Navegador sem CSSStyleSheet construível: cai para um <style>.
      const el = document.createElement('style');
      el.textContent = css;
      raiz.appendChild(el);
      this._materialInjetado = true;
    }
  }

  private _materialInjetado = false;

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

  /** O Office troca o hub de midia pela Estacao de Trabalho, com o PC. */
  private get _temPc(): boolean {
    const ent = this._sub?.entities as Record<string, unknown> | undefined;
    return Boolean(ent?.['pcSession'] ?? ent?.['pcActive'] ?? ent?.['pcPower']);
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

      /* Ajuste PEDIDO, não paridade: na origem o valor final é 20px de ícone e
         4px de gap — os 28px/11px que aparecem antes no arquivo são de uma
         definição sobrescrita depois. O usuário pediu um pouco maior e mais
         respiro, então a mudança fica aqui, no componente, e o CSS gerado segue
         cópia fiel do original. */
      /* ÍCONE DA CÉLULA DE LUZ — a causa raiz, depois de três tentativas minhas
         que não surtiram efeito nenhum.

         O elemento bruno-icon se dimensiona assim, no próprio shadow root:

             width:  var(--mdc-icon-size, 1em);
             height: var(--mdc-icon-size, 1em);

         Nada na cadeia da célula define --mdc-icon-size. O glifo caía no
         fallback 1em, isto é, o tamanho da FONTE herdada — cerca de 13px — e
         ficava minúsculo dentro de uma caixa muito maior.

         TENTATIVAS QUE FALHARAM, e por quê (mantidas aqui para não repetir):

           1. aumentar só .lc-icon         -> mexe na CAIXA, não no glifo;
           2. aumentar .tpl-light-icon     -> idem, é só o invólucro;
           3. regra .tpl-light-icon svg    -> NÃO CASA NADA. O <svg> vive dentro
                                              do shadow root do bruno-icon, e um
                                              seletor descendente comum não
                                              atravessa shadow root.

         O que funciona é a propriedade customizada: ela ATRAVESSA o shadow root
         por herança — é exatamente o mecanismo para o qual o bruno-icon foi
         escrito. Por isso o tamanho vai em --mdc-icon-size, e não em width.

         Medição: contar SVG por seletor descendente devolve zero mesmo com o
         ícone desenhado, pela mesma razão. Para medir, alcançar o shadow root
         do bruno-icon. */
      .lc-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon .tpl-light-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon bruno-icon {
        --mdc-icon-size: 30px;
        width: 30px;
        height: 30px;
      }
      .light-cell {
        grid-template-columns: 32px minmax(0, 1fr) auto;
        gap: 10px;
      }
      .light-grid {
        gap: 8px;
      }

      /* O dock nasce estável — sem barra de rolagem piscando nem célula que
         encolhe e alarga.

         O corpo abre animando a linha do grid de 0fr para 1fr. Enquanto ela
         cresce, o teto de altura do contêiner de rolagem vale quase zero, o
         conteúdo transborda e o navegador mostra a barra — que rouba largura,
         encolhe as duas colunas e, ao terminar a animação, devolve tudo. Duas
         medidas, ambas necessárias:

           1. reservar a calha da barra, para que a largura útil não dependa de
              ela estar presente ou não;
           2. rolagem só DEPOIS de assentar — durante a abertura o transbordo é
              apenas recortado. */
      .lights-scroll {
        scrollbar-gutter: stable;
      }
      .lights-card:not(.is-settled) .lights-scroll {
        overflow-y: hidden;
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
      { icon: 'mdi:thermometer', titulo: 'Temperatura',
        sub: this._valorSensor(this._idDe('temperature') ?? e?.temperature, '°', 1),
        tone: '247,170,90', ativo: false, ocultarNoTelefone: false },
      { icon: 'mdi:water-percent', titulo: 'Umidade',
        sub: this._valorSensor(this._idDe('humidity') ?? e?.humidity, '%', 0),
        tone: '127,200,233', ativo: false, ocultarNoTelefone: false },
      { icon: 'mdi:router-wireless', titulo: 'Roteador', sub: this._linhaRede(this._idDe('router')),
        tone: '154,160,166', ativo: false, ocultarNoTelefone: true },
      { icon: 'mdi:zigbee', titulo: 'Hub Zigbee', sub: this._linhaRede(this._idDe('zigbeeHub')),
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

  /**
   * Legenda da badge de luzes — acesas POR ZONA.
   *
   * As subviews atuais escrevem "Sala 3 · Varanda 4" nos quatro cômodos com duas
   * zonas, e "Office 2" / "Cozinha 1" nos dois de zona única. Em todos os seis o
   * texto é a chave da zona com inicial maiúscula, então a linha sai da própria
   * lista de luzes em vez de uma tabela paralela. Eu vinha escrevendo
   * "2 acesas", que perdia a divisão por zona.
   */
  private _linhaLuzes(): string {
    const luzes = this._luzesDaConfiguracao();
    if (!luzes.length) return `${this._contarLuzes()} acesas`;

    const porZona = new Map<string, number>();
    for (const luz of luzes) {
      const zona = luz.zone || 'sala';
      const acesa = this._hass?.states[luz.entity]?.state === 'on' ? 1 : 0;
      porZona.set(zona, (porZona.get(zona) ?? 0) + acesa);
    }
    return [...porZona.entries()]
      .map(([zona, n]) => `${zona.charAt(0).toUpperCase()}${zona.slice(1)} ${n}`)
      .join(' · ');
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

  /**
   * Leitura de um sensor da barra superior.
   *
   * Casas decimais e o traço de indisponível vêm dos originais: temperatura com
   * uma casa, umidade inteira, e `--` quando não há leitura. O grau é o SINAL DE
   * GRAU (U+00B0), não o ordinal masculino — este último desenha um traço sob o
   * círculo e destoa do resto do painel.
   */
  private _valorSensor(id: string | undefined, sufixo: string, casas = 0): string {
    const s = id && this._hass ? this._hass.states[id] : undefined;
    const bruto = String(s?.state ?? '').toLowerCase();
    if (!s || ['unknown', 'unavailable', 'none', ''].includes(bruto)) return '--';
    return `${numero(s.state, casas)}${sufixo}`;
  }

  /** Roteador e hub Zigbee: "Online" quando conectado, senão o próprio estado. */
  private _linhaRede(id: string | undefined): string {
    if (!id) return 'Online';
    const estado = String(this._hass?.states[id]?.state ?? 'Online');
    return ['on', 'home', 'connected', 'online'].includes(estado.toLowerCase()) ? 'Online' : estado;
  }

  private _hora(): string {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  /**
   * Data da barra superior.
   *
   * As tabelas são fixas de propósito: `toLocaleDateString` em pt-BR devolve
   * "segunda-feira, 5 de ago." — o " de " e o ponto final deixavam a linha 30px
   * mais larga que a das subviews atuais e empurravam o relógio para a esquerda.
   */
  private _data(): string {
    const dias = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
    const meses = ['JAN', 'FEV', 'MAR', 'ABR', 'MAI', 'JUN', 'JUL', 'AGO', 'SET', 'OUT', 'NOV', 'DEZ'];
    const agora = new Date();
    return `${dias[agora.getDay()]}, ${agora.getDate()} ${meses[agora.getMonth()]}`;
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
  /** Verdadeiro quando a animação de abertura já terminou. */
  private _luzesAssentadas = false;
  private _timerLuzes: number | undefined;

  /**
   * Abre e fecha o dock de iluminação.
   *
   * A transição do corpo é de 200 ms; a folga de 40 ms cobre o quadro em que o
   * navegador ainda está compondo. Só depois disso o corpo passa a rolar.
   */
  private _alternarDock(): void {
    this._lightsOpen = !this._lightsOpen;
    this._luzesAssentadas = false;
    encerrarTimer(SONDA, this._timerLuzes);
    this._timerLuzes = espera(SONDA, () => {
      this._luzesAssentadas = this._lightsOpen;
      this._timerLuzes = undefined;
      this.requestUpdate();
    }, 240);
    this.requestUpdate();
  }

  private _renderLightsDock() {
    const aberto = this._lightsOpen;
    const classes = [
      'glass-card',
      'lights-card',
      aberto ? 'is-open' : '',
      // Só depois que a animação termina o corpo pode rolar. Ver a nota em
      // `static styles`: rolar durante a abertura é o que fazia a barra piscar
      // e as células encolherem.
      this._luzesAssentadas ? 'is-settled' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return html`
      <div class=${classes}>
        <div class="lights-dock">
          <button
            type="button"
            class="lights-dock-id"
            aria-expanded=${aberto ? 'true' : 'false'}
            @click=${() => this._alternarDock()}
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
            <div class="lights-scroll">${this._renderSecoesDeLuz()}</div>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Seções de zona dentro do dock, com a grade de células de luz.
   *
   * As luzes vêm da configuração gerada (`entities.lights`), cada uma com
   * `zone`, `name` e `icon_type`. A ordem das zonas é a de aparição na lista, e
   * não uma lista fixa: é assim que a Sala tem "Sala" e "Varanda" e os demais
   * têm só uma.
   *
   * Célula larga na primeira posição quando a contagem é ÍMPAR — a luz principal
   * ocupa a linha inteira. Os filetes são por célula, não por gap: com gap o
   * fundo vazaria por baixo.
   */
  private _renderSecoesDeLuz() {
    const luzes = this._luzesDaConfiguracao();
    if (!luzes.length) return nothing;

    const rotulos = (this._sub?.['lightZoneLabels'] ?? {}) as Record<string, string>;
    const icones = (this._sub?.['lightZoneIcons'] ?? {}) as Record<string, string>;
    const padraoRotulo: Record<string, string> = { sala: 'Sala', varanda: 'Varanda' };
    const padraoIcone: Record<string, string> = { sala: 'mdi:sofa-outline', varanda: 'bruno:balcony' };

    const ordem: string[] = [];
    for (const l of luzes) if (!ordem.includes(l.zone)) ordem.push(l.zone);

    const zonas = ordem
      .map((chave) => {
        const daZona = luzes.filter((l) => l.zone === chave);
        return {
          chave,
          // Sem rotulo mapeado, a chave vira o nome com inicial maiuscula: no
          // Office e na Cozinha a zona unica saia como "office" e "cozinha".
          nome: rotulos[chave] ?? padraoRotulo[chave] ?? chave.charAt(0).toUpperCase() + chave.slice(1),
          icone: icones[chave] ?? padraoIcone[chave] ?? 'mdi:lightbulb-group',
          luzes: daZona,
          acesas: daZona.filter((l) => this._hass?.states[l.entity]?.state === 'on').length,
        };
      })
      .filter((z) => z.luzes.length > 0);

    const mostrarAcaoDaZona = zonas.length > 1;

    return zonas.map((z) => {
      const impar = z.luzes.length % 2 === 1;
      return html`
        <section class="light-section">
          <div class="section-head">
            <span class="zone-icon"><bruno-icon icon=${z.icone}></bruno-icon></span>
            <span class="zone-id">
              <strong>${z.nome}</strong>
              <small>${z.acesas}/${z.luzes.length} acesas</small>
            </span>
            ${mostrarAcaoDaZona
              ? html`<button
                  type="button"
                  class="zone-off"
                  @click=${() => this._apagarZona(z.luzes)}
                >
                  Apagar ${z.nome.toLowerCase()}
                </button>`
              : nothing}
          </div>
          <div class="light-grid">
            ${z.luzes.map((luz, i) => this._renderCelulaDeLuz(luz, i, impar))}
          </div>
        </section>
      `;
    });
  }

  private _luzesDaConfiguracao(): Array<{ entity: string; name: string; zone: string; icon: string | undefined }> {
    const bruto = (this._sub?.entities as Record<string, unknown> | undefined)?.['lights'];
    if (!Array.isArray(bruto)) return [];
    return bruto
      .filter((l): l is Record<string, unknown> => Boolean(l) && typeof l === 'object')
      .filter((l) => typeof l['entity'] === 'string' && !l['placeholder'])
      .map((l) => ({
        entity: String(l['entity']),
        name: String(l['name'] ?? 'Luz'),
        zone: String(l['zone'] ?? 'sala'),
        icon: typeof l['iconType'] === 'string' ? l['iconType'] : undefined,
      }));
  }

  private _renderCelulaDeLuz(
    luz: { entity: string; name: string; icon: string | undefined },
    indice: number,
    impar: boolean,
  ) {
    const acesa = this._hass?.states[luz.entity]?.state === 'on';
    // A luz principal ocupa a linha inteira quando a contagem é ímpar; a partir
    // daí a sequência volta a duas colunas, e é por isso que linha e coluna
    // saem de um cálculo e não de :nth-child.
    const larga = impar && indice === 0;
    const seq = impar ? indice - 1 : indice;
    const linha = larga ? 0 : Math.floor(seq / 2) + (impar ? 1 : 0);
    const classes = [
      'light-cell',
      acesa ? 'is-on' : '',
      larga ? 'is-wide' : '',
      !larga && linha > 0 ? 'has-rule-top' : '',
      !larga && seq % 2 === 1 ? 'has-rule-left' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <button
        type="button"
        class=${classes}
        role="switch"
        aria-checked=${acesa ? 'true' : 'false'}
        aria-label=${luz.name}
        @click=${() => this._alternarLuz(luz.entity)}
      >
        <span class="lc-icon">${this._iconeDaLuz(luz.icon, acesa)}</span>
        <span class="lc-name">${luz.name}</span>
        <span class="lc-switch" aria-hidden="true"><span class="lc-knob"></span></span>
      </button>
    `;
  }

  /**
   * Ícone da luz — SVG do conjunto próprio, não um `mdi:`.
   *
   * As subviews atuais chamam `BrunoIcons.render()` com nomes do conjunto do
   * projeto: `ledstrip`, `pendant`, `light_flush`. Eu havia mapeado esses nomes
   * para equivalentes `mdi:`, e o resultado era um ícone minúsculo ou um círculo
   * — o `mdi:` correspondente não existe, e o `bruno-icon` cai no genérico.
   *
   * A marcação de fora (`tpl-light-icon`, `icon-<nome>`, `is-on`) é o que o CSS
   * usa para dimensionar e colorir; sem ela o glifo fica sem tamanho.
   */
  private _iconeDaLuz(tipo: string | undefined, acesa: boolean) {
    const bruto = String(tipo ?? 'light_flush').replace(/^mdi:/, '');
    const nome = bruto.replace(/[^a-z0-9_-]/gi, '') || 'light_flush';
    // O conjunto de ícones do projeto é o Hugeicons, e `bruno-icons.js` já traz
    // os apelidos que interessam aqui:
    //   ledstrip → bruno:led-strip · pendant → hugeicons:candelier-02
    //   sconce   → hugeicons:lamp-wall-up · light_flush → hugeicons:bulb
    // Basta passar o nome cru; traduzir para `mdi:` foi o erro que produziu o
    // círculo genérico.
    return html`<span class="tpl-light-icon icon-${nome} ${acesa ? 'is-on' : ''}">
      <bruno-icon icon=${nome}></bruno-icon>
    </span>`;
  }

  private _alternarLuz(entityId: string): void {
    if (!this._hass) return;
    this._hass.callService('light', 'toggle', { entity_id: entityId }, { entity_id: entityId });
  }

  private _apagarZona(luzes: Array<{ entity: string }>): void {
    if (!this._hass || !luzes.length) return;
    const ids = luzes.map((l) => l.entity);
    this._hass.callService('light', 'turn_off', { entity_id: ids }, { entity_id: ids });
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
      <main class="room-subview">
        ${this._renderTopBand()}
        ${this._temEletrodomesticos ? this._corpoCozinha() : this._corpoPadrao()}
      </main>
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

  private _estado(id: string | undefined): EstadoHa | undefined {
    return id && this._hass ? (this._hass.states[id] as EstadoHa | undefined) : undefined;
  }

  private _indisponivel(st: EstadoHa | undefined): boolean {
    return !st || ['unavailable', 'unknown', ''].includes(String(st.state).toLowerCase());
  }

  private _servico(dominio: string, servico: string, dados: Record<string, unknown>): void {
    if (!this._hass) return;
    this._hass.callService(dominio, servico, dados, dados as { entity_id?: string });
  }

  /**
   * A lista de câmeras vem da configuração gerada — `entities.cameras` —, com
   * nome, nome curto e os três interruptores de cada uma (som, movimento,
   * privacidade). Eu vinha lendo só `cameraMain`/`cameraSecondary`, que são
   * ids soltos: sem nome, sem controles, e sem a segunda câmera onde a chave
   * não existia.
   */
  private _camerasConfiguradas(): CameraCfg[] {
    const bruto = (this._sub?.entities as Record<string, unknown> | undefined)?.['cameras'];
    if (!Array.isArray(bruto)) return [];
    return bruto.filter((c): c is CameraCfg => Boolean(c) && typeof (c as CameraCfg).entity === 'string');
  }

  /**
   * Estado vivo de uma câmera.
   *
   * A imagem sai de `entity_picture` quando o HA a publica, e cai para
   * `/api/camera_proxy/<entidade>` quando não. O último quadro conhecido fica
   * guardado: numa reconexão a imagem antiga continua na tela em vez de sumir.
   */
  private _cameraViva(cam: CameraCfg): CameraViva {
    const st = this._estado(cam.entity);
    const indisponivel = this._indisponivel(st);
    const online = !indisponivel && ESTADOS_CAMERA_ONLINE.includes(String(st?.state ?? ''));

    const publicada = String(st?.attributes['entity_picture'] ?? '');
    if (publicada) this._ultimaImagem[cam.entity] = publicada;
    const base = publicada || this._ultimaImagem[cam.entity] || `/api/camera_proxy/${cam.entity}`;

    return {
      ...cam,
      online,
      indisponivel,
      base,
      url: this._urlsCarregadas[cam.entity] ?? comSelo(base, this._seloCameras),
    };
  }

  /** Um dos três interruptores da câmera (som, movimento, privacidade). */
  private _controleCamera(cam: CameraViva | undefined, chave: string) {
    const ctrl = (cam?.controls ?? []).find((c) => String(c.key ?? '').toLowerCase() === chave);
    if (!ctrl?.entity) return undefined;
    const st = this._estado(ctrl.entity);
    const indisponivel = this._indisponivel(st);
    return {
      ...ctrl,
      entity: ctrl.entity,
      ativo: !indisponivel && String(st?.state ?? '').toLowerCase() === 'on',
      indisponivel,
    };
  }

  /**
   * Um feed de câmera.
   *
   * A estrutura — moldura, imagem, placeholder e legenda — é a que o CSS gerado
   * espera. O PIP é um botão: tocá-lo promove aquela câmera ao feed principal.
   */
  private _renderFeed(cam: CameraViva | undefined, pip: boolean) {
    const nome = cam?.shortName || cam?.name || 'Câmera';
    const privacidade = this._controleCamera(cam, 'privacy');
    const privado = Boolean(privacidade?.ativo);
    const indisponivel = !cam || cam.indisponivel;

    const classes = [
      'camera-main',
      'camera-feed',
      pip ? 'camera-pip-feed' : 'camera-primary-feed',
      privado ? 'is-private' : '',
      indisponivel ? 'is-unavailable' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const capa = indisponivel
      ? html`<div class="camera-state-surface">
          <bruno-icon icon="mdi:video-off-outline"></bruno-icon><span>Indisponível</span>
        </div>`
      : privado
        ? html`<div class="camera-state-surface">
            <bruno-icon icon="mdi:eye-off-outline"></bruno-icon><span>Modo privacidade ativo</span>
          </div>`
        : nothing;

    const conteudo = html`
      <div class="camera-row-image">
        ${cam
          ? html`<img
              src=${cam.url}
              data-camera-src-base=${cam.base}
              data-camera-entity=${cam.entity}
              alt=""
              @load=${(ev: Event) => {
                const img = ev.currentTarget as HTMLImageElement;
                img.classList.add('is-loaded');
                img.closest('.camera-main')?.classList.add('has-loaded-image');
              }}
              @error=${(ev: Event) => {
                const img = ev.currentTarget as HTMLImageElement;
                img.classList.remove('is-loaded');
                img.closest('.camera-main')?.classList.remove('has-loaded-image');
              }}
            />`
          : nothing}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
      ${capa}
      <div class="camera-row-copy"><strong>${nome}</strong></div>
    `;

    if (pip && cam) {
      return html`<button
        type="button"
        class=${classes}
        aria-label=${`Mostrar câmera ${nome}`}
        @click=${() => {
          this._cameraAtiva = cam.entity;
          this.requestUpdate();
        }}
      >
        ${conteudo}
      </button>`;
    }
    return html`<div class=${classes} aria-label=${`Câmera ${nome}`}>${conteudo}</div>`;
  }

  /** Câmeras: cabeçalho com o menu de três pontos + palco com feed e PIP. */
  private _renderCameras() {
    const vivas = this._camerasConfiguradas().map((c) => this._cameraViva(c));
    if (!vivas.length) {
      return html`
        <div class="glass-card cameras-card cameras-card-controls">
          <div class="mh-head cameras-head">
            <div class="mh-head-title">
              <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
              <div class="module-title">Câmeras</div>
            </div>
          </div>
          <div class="camera-stage camera-pip-stage">${this._renderFeed(undefined, false)}</div>
        </div>
      `;
    }

    // A escolhida é a do último toque; se ela estiver fora do ar e houver
    // alguma online, o palco cai para essa — o original faz o mesmo.
    const escolhida = vivas.find((c) => c.entity === this._cameraAtiva) ?? vivas[0];
    const online = vivas.find((c) => c.online);
    const principal = escolhida?.online || !online ? escolhida : online;
    const pip = vivas.find((c) => c.entity !== principal?.entity);
    const aberto = this._controlesCameraAbertos;

    return html`
      <div class="glass-card cameras-card cameras-card-controls">
        <div class="mh-head cameras-head">
          <div class="mh-head-title">
            <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
            <div class="module-title">Câmeras</div>
          </div>
          <button
            type="button"
            class="mh-menu camera-settings-button ${aberto ? 'is-active' : ''}"
            title="Controles"
            aria-expanded=${aberto ? 'true' : 'false'}
            aria-label=${aberto ? 'Fechar controles das câmeras' : 'Abrir controles das câmeras'}
            @click=${() => {
              this._controlesCameraAbertos = !this._controlesCameraAbertos;
              this.requestUpdate();
            }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
        </div>
        <div class="camera-stage camera-pip-stage ${aberto ? 'is-controls-open' : ''}">
          ${this._renderFeed(principal, false)}
          ${pip ? this._renderFeed(pip, true) : nothing}
          ${aberto ? this._renderControlesCamera(principal) : nothing}
        </div>
      </div>
    `;
  }

  private _renderControlesCamera(cam: CameraViva | undefined) {
    const controles = ['sound', 'motion', 'privacy']
      .map((k) => this._controleCamera(cam, k))
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
    if (!controles.length) return nothing;

    const nome = cam?.shortName || cam?.name || 'Câmera';
    return html`
      <div class="camera-control-strip" aria-label=${`Controles da câmera ${nome}`}>
        <div class="camera-controls">
          ${controles.map((c) => {
            const descricao = c.description || c.label || 'Controle';
            return html`
              <button
                type="button"
                class="camera-control ${c.ativo ? 'is-on' : ''} ${c.indisponivel ? 'is-unavailable' : ''}"
                ?disabled=${c.indisponivel}
                aria-pressed=${c.ativo ? 'true' : 'false'}
                title=${`${descricao} — câmera ${nome}`}
                @click=${() => this._servico('homeassistant', 'toggle', { entity_id: c.entity })}
              >
                <bruno-icon icon=${c.icon ?? 'mdi:toggle-switch-outline'}></bruno-icon>
                <span class="camera-control-label">${c.label || descricao}</span>
                <span class="camera-control-switch" aria-hidden="true"></span>
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }

  // ── Modelos das fontes de mídia ────────────────────────────────────────────

  /**
   * Uma chave de entidade pode ser um id ou uma LISTA de candidatos.
   *
   * O A/C do Q. Marina, por exemplo, traz onze nomes possíveis — a instalação
   * mudou de nome mais de uma vez e a configuração guarda todos. Vale o primeiro
   * que existir e estiver disponível; sem nenhum, o primeiro da lista, para que
   * o cartão ainda mostre a que ele se refere.
   */
  private _resolverId(valor: unknown): string | undefined {
    if (typeof valor === 'string') return valor || undefined;
    if (!Array.isArray(valor)) return undefined;
    const ids = valor.filter((v): v is string => typeof v === 'string' && Boolean(v));
    const vivo = ids.find((id) => !this._indisponivel(this._hass?.states[id] as EstadoHa | undefined));
    return vivo ?? ids[0];
  }

  private _idDe(chave: string): string | undefined {
    return this._resolverId((this._sub?.entities as Record<string, unknown> | undefined)?.[chave]);
  }

  private _modeloTv() {
    const st = this._estado(this._idDe('tv'));
    const a = st?.attributes ?? {};
    const estado = st?.state ?? 'off';
    const ativo = ESTADOS_TV_LIGADA.includes(estado);
    const fonte = String(a['source'] ?? a['app_name'] ?? '') || 'HDMI 1';
    const titulo = String(a['media_title'] ?? a['media_series_title'] ?? a['app_name'] ?? '');
    return {
      st,
      estado,
      ativo,
      fonte,
      titulo,
      volume: a['volume_level'] != null ? Math.round(Number(a['volume_level']) * 100) : null,
      poster: String(a['entity_picture'] ?? a['media_image_url'] ?? ''),
    };
  }

  private _modeloSpotify() {
    const st = this._estado(this._idDe('spotify'));
    const a = st?.attributes ?? {};
    const estado = st?.state ?? 'off';
    // A conta do Spotify é UMA só e todos os cômodos leem a mesma entidade.
    // Sem distinguir o DISPOSITIVO ativo, o card aparecia expandido nas seis
    // subviews ao mesmo tempo. Estas duas provas — dispositivo publicado pelo
    // Spotify, ou o Echo do cômodo tocando a mesma faixa — são as da origem, e
    // eu não as havia portado.
    const daquiEntao =
      ESTADOS_MIDIA_LIGADA.includes(estado) &&
      spotifyTocandoEm(
        st,
        this._sub?.['spotifyDeviceName'] as string | undefined,
        this._estado(this._idDe('speaker')),
      );
    const ativo = daquiEntao;
    const bruto = String(a['media_title'] ?? '') || 'SpotifyPlus';
    const duracaoTotal = Number(a['media_duration']) || 0;
    const posicao = Number(a['media_position']) || 0;
    const marcado = Date.parse(String(a['media_position_updated_at'] ?? ''));
    const tocando = ativo && estado === 'playing';
    const viva = tocando && Number.isFinite(marcado) ? posicao + (Date.now() - marcado) / 1000 : posicao;
    const atual = duracaoTotal > 0 ? Math.max(0, Math.min(duracaoTotal, viva)) : Math.max(0, viva);
    return {
      st,
      ativo,
      tocando,
      titulo: ativo ? (/^SpotifyPlus\s+Bruno/i.test(bruto) ? 'SpotifyPlus' : bruto) : 'SpotifyPlus',
      artista: ativo ? String(a['media_artist'] ?? a['media_album_name'] ?? '') : '',
      capa: ativo ? String(a['entity_picture'] ?? a['media_image_url'] ?? '') : '',
      volume: a['volume_level'] != null ? Math.round(Number(a['volume_level']) * 100) : null,
      dispositivo:
        (this._sub?.['spotifyDeviceName'] as string | undefined) || String(a['source'] ?? '') || 'SpotifyPlus',
      progresso: duracaoTotal > 0 ? Math.max(0, Math.min(100, (atual / duracaoTotal) * 100)) : 0,
      decorrido: duracao(atual),
      total: duracaoTotal > 0 ? duracao(duracaoTotal) : '--:--',
    };
  }

  private _modeloPc() {
    const ativo = this._estado(this._idDe('pcActive'))?.state === 'on';
    const sessao = this._estado(this._idDe('pcSession'))?.state ?? '';
    const janela = this._estado(this._idDe('pcWindow'))?.state ?? '';
    return { ativo, sessao, janela };
  }

  /**
   * Qual fonte fica aberta.
   *
   * As duas regras do original, e elas DIFEREM entre os cômodos:
   *
   * - TV + Spotify (cinco cômodos): a escolha manual persiste, mas quando
   *   qualquer fonte ACABA de ficar ativa ela é descartada e a prioridade
   *   automática volta a valer — é o que faz a TV subir sozinha ao ser ligada.
   * - PC + Spotify (Office): o Spotify TEM precedência. Ele toma a vaga ao
   *   começar a tocar, e assume também quando o PC se desliga com o painel do
   *   PC aberto. Sem seleção, Spotify ativo vence o PC ativo.
   *
   * Eu tratava os seis pela primeira regra, e o Office abria o PC quando devia
   * abrir o Spotify.
   */
  private _fonteAberta(chaves: string[], ativas: Record<string, boolean>): string {
    const agoraAtivas = chaves.filter((k) => ativas[k]);
    const antes = this._midiaAtivasAntes;
    this._midiaAtivasAntes = agoraAtivas;

    if (this._temPc) {
      if (ativas['spotify'] && !antes.includes('spotify')) this._fonteMidia = 'spotify';
      if (!ativas['pc'] && this._fonteMidia === 'pc' && ativas['spotify']) this._fonteMidia = 'spotify';
      if (chaves.includes(this._fonteMidia)) return this._fonteMidia;
      return ativas['spotify'] ? 'spotify' : 'pc';
    }

    if (agoraAtivas.some((k) => !antes.includes(k))) this._fonteMidia = '';
    if (chaves.includes(this._fonteMidia)) return this._fonteMidia;
    return agoraAtivas[0] ?? chaves[0] ?? '';
  }

  /** Linha de volume — o mesmo controle nas duas fontes. */
  private _linhaVolume(entityId: string | undefined, volume: number) {
    return html`
      <div class=${entityId ? 'mh-vol' : 'mh-vol is-disabled'}>
        <bruno-icon icon="mdi:volume-medium"></bruno-icon>
        <span class="mh-vol-label">Volume ${volume}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value=${String(volume)}
          .value=${String(volume)}
          aria-label="Volume"
          ?disabled=${!entityId}
          @change=${(ev: Event) => {
            const alvo = ev.currentTarget as HTMLInputElement;
            if (!entityId) return;
            this._servico('media_player', 'volume_set', {
              entity_id: entityId,
              volume_level: Number(alvo.value) / 100,
            });
          }}
        />
      </div>
    `;
  }

  /** Botão do corpo do hub. `soIcone` evita o truncamento nas fileiras de 4-5. */
  private _botaoMidia(
    rotulo: string,
    icone: string,
    aoClicar: () => void,
    opcoes: { principal?: boolean; mais?: boolean; soIcone?: boolean; desabilitado?: boolean } = {},
  ) {
    const soIcone = Boolean(opcoes.soIcone ?? opcoes.mais);
    const classes = [
      'mh-btn',
      opcoes.principal ? 'is-main' : '',
      opcoes.mais ? 'is-plus' : '',
      soIcone ? 'is-icon' : '',
    ]
      .filter(Boolean)
      .join(' ');
    return html`
      <button
        type="button"
        class=${classes}
        title=${rotulo}
        aria-label=${rotulo}
        ?disabled=${opcoes.desabilitado}
        @click=${aoClicar}
      >
        <bruno-icon icon=${icone}></bruno-icon>${soIcone ? nothing : html`<span>${rotulo}</span>`}
      </button>
    `;
  }

  /**
   * A arte da direita.
   *
   * Só o PNG, sobreposto — posicionado de forma absoluta pelo CSS, para nunca
   * ditar a altura da linha e empurrar os botões para fora do cartão.
   */
  private _arteMidia(src: string, forma: 'wide' | 'square', icone: string, capa: boolean) {
    return html`
      <div class="mh-art mh-art-${forma} ${capa ? 'is-cover' : 'is-standby'}">
        ${src ? html`<img src=${src} alt="" loading="lazy" />` : html`<bruno-icon icon=${icone}></bruno-icon>`}
      </div>
    `;
  }

  private _corpoTv() {
    const tv = this._modeloTv();
    const id = this._idDe('tv');
    const espera = (this._sub?.['tvStandbyImage'] as string | undefined) ?? IMAGEM_TV_ESPERA;
    const generico = !tv.titulo || /^TV (ligada|desligada)$/i.test(tv.titulo) || tv.titulo === tv.fonte;
    const segundaLinha = (!generico && tv.estado === 'playing' ? tv.titulo : '') || tv.fonte;

    if (!tv.ativo) {
      return html`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>HDMI 1 disponível</em></div>
          <div class="mh-controls">
            ${this._botaoMidia(
              'Ligar TV',
              'mdi:power',
              () => this._servico('homeassistant', 'toggle', { entity_id: id }),
              { principal: true, desabilitado: !id },
            )}
          </div>
        </div>
        ${this._arteMidia(espera, 'wide', 'mdi:television-classic', false)}
      `;
    }
    // A fileira de baixo alterna entre os três comandos e a lista de apps. Os
    // apps saem de `tvApps` na configuração — rótulo, imagem e o script que
    // abre cada um.
    const apps = Array.isArray(this._sub?.['tvApps'])
      ? (this._sub['tvApps'] as Array<{ key: string; label: string; image?: string; script?: string }>)
      : [];

    const fileira = this._appsTvAbertos && apps.length
      ? html`<div class="mh-btn-row mh-btn-row-5">
          ${apps.map((app) =>
            this._botaoMidia(app.label, 'mdi:play-box-outline', () => {
              if (app.script) this._servico('script', 'turn_on', { entity_id: app.script });
            }, { soIcone: true, desabilitado: !app.script }),
          )}
          ${this._botaoMidia('Voltar', 'mdi:chevron-left', () => {
            this._appsTvAbertos = false;
            this.requestUpdate();
          }, { mais: true })}
        </div>`
      : html`<div class="mh-btn-row mh-btn-row-3">
          ${this._botaoMidia('Pausar', 'mdi:pause', () =>
            this._servico('media_player', 'media_play_pause', { entity_id: id }), { soIcone: true })}
          ${this._botaoMidia('Controle remoto', 'mdi:remote-tv', () => this._abrirControleRemoto(), {
            soIcone: true,
            desabilitado: !this._idDe('tvRemote'),
          })}
          ${this._botaoMidia('Apps', 'mdi:apps', () => {
            this._appsTvAbertos = true;
            this.requestUpdate();
          }, { soIcone: true, desabilitado: !apps.length })}
        </div>`;

    return html`
      <div class="mh-left">
        <div class="mh-info">
          <small>Ligada</small>${segundaLinha ? html`<em>${segundaLinha}</em>` : nothing}
        </div>
        <div class="mh-controls">${this._linhaVolume(id, tv.volume ?? 60)} ${fileira}</div>
      </div>
      ${this._arteMidia(tv.poster || espera, 'wide', 'mdi:television-classic', Boolean(tv.poster))}
    `;
  }

  private _appsTvAbertos = false;

  /**
   * Popup do controle remoto.
   *
   * Mesmo evento e mesma carga das subviews atuais — `ll-custom` com a chamada
   * de `browser_mod.popup` e o `universal-remote-card`. Quem monta a janela é o
   * browser_mod, exatamente como hoje; só a Sala tem controle (`remote.atv`).
   */
  private _abrirControleRemoto(): void {
    const remoto = this._idDe('tvRemote');
    if (!remoto) return;
    const apertar = (entityId: string) => ({
      action: 'perform-action',
      perform_action: 'button.press',
      target: { entity_id: entityId },
    });
    const tecla = (nome: string, icone: string, entityId: string) => ({
      type: 'button',
      name: nome,
      icon: icone,
      tap_action: apertar(entityId),
    });

    this.dispatchEvent(
      new CustomEvent('ll-custom', {
        bubbles: true,
        composed: true,
        detail: {
          action: 'fire-dom-event',
          browser_mod: {
            service: 'browser_mod.popup',
            data: {
              title: 'Smart TV Remote',
              tag: 'tv_remote',
              style:
                '--popup-background-color: rgba(21,25,35,0.92); --popup-min-width: min(380px, 95vw); --popup-max-width: min(430px, 95vw); --popup-border-width: 0;',
              content: {
                type: 'custom:universal-remote-card',
                remote_id: remoto,
                media_player_id: this._idDe('tv'),
                rows: [
                  ['power', 'input', 'menu'],
                  ['navigation'],
                  ['back', 'home', 'mute'],
                  ['volume_down', 'volume_up', 'channel_down', 'channel_up'],
                ],
                custom_actions: [
                  tecla('power', 'mdi:power', 'button.tv_sala_power'),
                  tecla('input', 'mdi:import', 'button.tv_sala_input'),
                  tecla('menu', 'mdi:menu', 'button.tv_sala_menu'),
                  {
                    type: 'circlepad',
                    name: 'navigation',
                    icon: 'mdi:checkbox-blank-circle',
                    tap_action: apertar('button.tv_sala_ok'),
                    up: { icon: 'mdi:chevron-up', tap_action: apertar('button.tv_sala_navigate_up'), hold_action: { action: 'repeat' } },
                    down: { icon: 'mdi:chevron-down', tap_action: apertar('button.tv_sala_navigate_down'), hold_action: { action: 'repeat' } },
                    left: { icon: 'mdi:chevron-left', tap_action: apertar('button.tv_sala_navigate_left'), hold_action: { action: 'repeat' } },
                    right: { icon: 'mdi:chevron-right', tap_action: apertar('button.tv_sala_navigate_right'), hold_action: { action: 'repeat' } },
                  },
                  tecla('back', 'mdi:keyboard-backspace', 'button.tv_sala_back'),
                  tecla('home', 'mdi:home', 'button.tv_sala_homepage'),
                  tecla('mute', 'mdi:volume-mute', 'button.tv_sala_mute'),
                  tecla('volume_down', 'mdi:volume-minus', 'button.tv_sala_volume_down'),
                  tecla('volume_up', 'mdi:volume-plus', 'button.tv_sala_volume_up'),
                  tecla('channel_down', 'mdi:chevron-down', 'button.tv_sala_channel_down'),
                  tecla('channel_up', 'mdi:chevron-up', 'button.tv_sala_channel_up'),
                ],
              },
            },
          },
        },
      }),
    );
  }

  private _corpoPc() {
    const pc = this._modeloPc();
    const imagem = (this._sub?.['pcImage'] as string | undefined) ?? IMAGEM_PC;
    const detalhe = pc.ativo ? [pc.sessao, pc.janela].filter((v) => v && v !== '--')[0] || 'Sessão ativa' : 'Pronto para ligar';

    // Os comandos do PC são entidades do domínio `button` — `press`, não
    // `toggle`. Um `homeassistant.toggle` num button não faz nada.
    const apertar = (chave: string) => () => {
      const id = this._idDe(chave);
      if (id) this._servico('button', 'press', { entity_id: id });
    };

    return html`
      <div class="mh-left">
        <div class="mh-info"><small>${pc.ativo ? 'Ligado' : 'Desligado'}</small><em>${detalhe}</em></div>
        <div class="mh-controls">
          ${pc.ativo
            ? html`<div class="mh-btn-row mh-btn-row-5 office-pc-actions">
                ${this._botaoMidia('Sleep', 'mdi:weather-night', apertar('pcSleep'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcSleep'),
                })}
                ${this._botaoMidia('Reiniciar', 'mdi:restart', apertar('pcRestart'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcRestart'),
                })}
                ${this._botaoMidia('Desligar', 'mdi:power-standby', apertar('pcShutdown'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcShutdown'),
                })}
                ${this._botaoMidia('Bloquear', 'mdi:lock-outline', apertar('pcLock'), {
                  soIcone: true,
                  desabilitado: !this._idDe('pcLock'),
                })}
                ${this._botaoMidia(
                  pc.sessao && pc.sessao !== '--' ? pc.sessao : 'Sessão',
                  'mdi:account-clock-outline',
                  () => this._maisInfo(this._idDe('pcSession')),
                  { soIcone: true },
                )}
              </div>`
            : html`<div class="mh-btn-row mh-btn-row-3">
                ${this._botaoMidia('Ligar PC', 'mdi:power', apertar('pcPower'), {
                  principal: true,
                  desabilitado: !this._idDe('pcPower'),
                })}
              </div>`}
        </div>
      </div>
      ${this._arteMidia(imagem, 'wide', 'mdi:desktop-tower', false)}
    `;
  }

  private _corpoSpotify() {
    const sp = this._modeloSpotify();
    const id = this._idDe('spotify');
    const espera = (this._sub?.['spotifyStandbyImage'] as string | undefined) ?? IMAGEM_SPOTIFY_ESPERA;

    if (!sp.ativo) {
      // NÃO existe botão "Ligar"/"Tocar" aqui. Com o Spotify parado o cômodo não
      // tem para onde tocar: o que a origem oferece é a ESCOLHA DO DISPOSITIVO,
      // que abre o SpotifyPlus Card. Eu havia posto um "Tocar" chamando
      // `media_player.media_play` — sem dispositivo ativo o serviço dá erro.
      return html`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>${sp.dispositivo}</em></div>
          <div class="mh-controls">
            ${this._botaoMidia('Dispositivos', 'mdi:speaker-wireless', () => this._abrirSpotifyPlus('devices'), {
              principal: true,
              desabilitado: !id,
            })}
          </div>
        </div>
        ${this._arteMidia(espera, 'square', 'mdi:music-note', false)}
      `;
    }

    const fileira = this._spotifyFerramentas
      ? html`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia('Dispositivos', 'mdi:speaker-wireless', () => this._abrirSpotifyPlus('devices'), { soIcone: true })}
          ${this._botaoMidia('Presets', 'mdi:bookmark-music-outline', () => this._abrirSpotifyPlus('presets'), { soIcone: true })}
          ${this._botaoMidia('Fila', 'mdi:playlist-play', () => this._abrirSpotifyPlus('queue'), { soIcone: true })}
          ${this._botaoMidia('Voltar', 'mdi:chevron-left', () => {
            this._spotifyFerramentas = false;
            this.requestUpdate();
          }, { mais: true })}
        </div>`
      : html`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia('Anterior', 'mdi:skip-previous', () =>
            this._servico('media_player', 'media_previous_track', { entity_id: id }), { soIcone: true })}
          ${this._botaoMidia(sp.tocando ? 'Pausar' : 'Tocar', sp.tocando ? 'mdi:pause' : 'mdi:play', () => {
            if (sp.tocando) this._servico('media_player', 'media_pause', { entity_id: id });
            else this._tocarSpotify();
          }, { soIcone: true })}
          ${this._botaoMidia('Próxima', 'mdi:skip-next', () =>
            this._servico('media_player', 'media_next_track', { entity_id: id }), { soIcone: true })}
          ${this._botaoMidia('Mais', 'mdi:plus', () => {
            this._spotifyFerramentas = true;
            this.requestUpdate();
          }, { mais: true })}
        </div>`;

    return html`
      <div class="mh-left">
        <div class="mh-info">
          <small>${sp.titulo}</small>${sp.artista ? html`<em>${sp.artista}</em>` : nothing}
          <div class="mh-progress-wrap" aria-label="Progresso da faixa">
            <span class="mh-progress-time">${sp.decorrido}</span>
            <div class="mh-progress" aria-hidden="true"><span style=${`width:${sp.progresso}%`}></span></div>
            <span class="mh-progress-time">${sp.total}</span>
          </div>
        </div>
        <div class="mh-controls">${this._linhaVolume(id, sp.volume ?? 66)} ${fileira}</div>
      </div>
      ${this._arteMidia(sp.capa || espera, 'square', 'mdi:music-note', Boolean(sp.capa))}
    `;
  }

  /**
   * Abre o SpotifyPlus Card na aba pedida.
   *
   * Mesmo evento e mesma carga da origem: `ll-custom` com `bruno_action:
   * 'spotify'` e a configuração do card. Quem monta a janela é a shell.
   */
  private _abrirSpotifyPlus(modo: 'devices' | 'presets' | 'queue' | 'full'): void {
    const id = this._idDe('spotify');
    if (!id) return;
    this.dispatchEvent(
      new CustomEvent('ll-custom', {
        bubbles: true,
        composed: true,
        detail: {
          action: 'fire-dom-event',
          bruno_action: 'spotify',
          bruno_spotify_config: {
            entity: id,
            deviceDefaultId: this._sub?.['spotifyDeviceName'] as string | undefined,
            mode: modo,
          },
        },
      }),
    );
  }

  /**
   * Retomar o Spotify no dispositivo do cômodo.
   *
   * `media_player.media_play` sem dispositivo ativo dá erro. A origem transfere
   * a reprodução com `spotifyplus.player_transfer_playback`, ativando o
   * dispositivo pelo nome; só cai no serviço genérico quando o cômodo não
   * declara dispositivo.
   */
  private _tocarSpotify(): void {
    const id = this._idDe('spotify');
    if (!id) return;
    const dispositivo =
      (this._sub?.['spotifyDeviceName'] as string | undefined) ||
      String(this._estado(id)?.attributes['source'] ?? '');
    if (dispositivo) {
      this._servico('spotifyplus', 'player_transfer_playback', {
        entity_id: id,
        device_id: dispositivo,
        play: true,
        delay: 0.75,
        force_activate_device: true,
      });
      return;
    }
    this._servico('media_player', 'media_play', { entity_id: id });
  }

  private _maisInfo(entityId: string | undefined): void {
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent('hass-more-info', {
        detail: { entityId },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /**
   * Hub de mídia: acordeão de duas fontes — TV (ou PC, no Office) e Spotify.
   *
   * Só uma fica aberta por vez, no próprio lugar da lista: a fonte nunca é
   * promovida ao topo. A entrada do PS5 vive no menu de três pontos, e só onde
   * há entidade — hoje, apenas a Sala.
   */
  private _renderMediaHub() {
    const temPc = this._temPc;
    const tv = temPc ? undefined : this._modeloTv();
    const pc = temPc ? this._modeloPc() : undefined;
    const sp = this._modeloSpotify();

    const primeira = temPc
      ? { chave: 'pc', rotulo: 'PC', icone: 'mdi:desktop-tower', ativo: Boolean(pc?.ativo),
          resumo: pc?.ativo ? 'Ligado' : 'Desligado', corpo: () => this._corpoPc() }
      // DESVIO DELIBERADO da origem: os seis arquivos nasceram de uma cópia do
      // da Sala e todos rotulam a fonte como "TV da sala" — inclusive o Q.
      // Miguel, onde é simplesmente falso. Só a Sala tem entidade de TV; nos
      // outros a fonte fica sempre desligada, e o rótulo passa a ser "TV".
      : { chave: 'tv', rotulo: this._room?.id === 'sala' ? 'TV da sala' : 'TV', icone: 'mdi:television-classic',
          ativo: Boolean(tv?.ativo), resumo: tv?.ativo ? `Ligada · ${tv.fonte}` : 'Desligada',
          corpo: () => this._corpoTv() };

    const fontes = [
      primeira,
      { chave: 'spotify', rotulo: 'Spotify', icone: 'mdi:spotify', ativo: sp.ativo,
        resumo: sp.ativo ? sp.titulo : 'Nenhuma faixa', corpo: () => this._corpoSpotify() },
    ];

    const ativas = Object.fromEntries(fontes.map((f) => [f.chave, f.ativo]));
    const aberta = this._fonteAberta(fontes.map((f) => f.chave), ativas);
    const tocando = fontes.find((f) => f.chave === aberta)?.ativo;

    const classes = [
      'glass-card',
      'media-hub-card',
      temPc ? 'workspace-hub-card' : '',
      'mh-accordion',
      tocando ? 'is-playing' : '',
      this._menuMidiaAberto ? 'is-menu-open' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return html`
      <div class=${classes}>
        <div class="mh-head">
          <div class="mh-head-title">
            <span class="micro-icon ${temPc ? '' : 'tone-amber'}">
              <bruno-icon icon=${temPc ? 'mdi:desk' : 'mdi:multimedia'}></bruno-icon>
            </span>
            <div class="module-title">${temPc ? 'Estação de Trabalho' : 'Hub de Mídia'}</div>
          </div>
          <button
            type="button"
            class="mh-menu ${this._menuMidiaAberto ? 'is-active' : ''}"
            title="Opções"
            aria-label="Opções"
            aria-expanded=${this._menuMidiaAberto ? 'true' : 'false'}
            @click=${() => {
              this._menuMidiaAberto = !this._menuMidiaAberto;
              this.requestUpdate();
            }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
        </div>
        ${this._menuMidiaAberto ? this._renderMenuMidia() : nothing}
        <div class="mh-sources">
          ${fontes.map((f) => {
            const aberto = f.chave === aberta;
            const cls = ['mh-source', aberto ? 'is-open' : '', f.ativo ? 'is-active' : '']
              .filter(Boolean)
              .join(' ');
            return html`
              <div class=${cls}>
                <button
                  type="button"
                  class="mh-source-head"
                  aria-expanded=${aberto ? 'true' : 'false'}
                  @click=${() => {
                    this._fonteMidia = f.chave;
                    this._menuMidiaAberto = false;
                    this.requestUpdate();
                  }}
                >
                  <bruno-icon
                    class="mh-src-icon ${f.chave === 'spotify' ? 'mh-icon-spotify' : ''}"
                    icon=${f.icone}
                  ></bruno-icon>
                  <span class="mh-src-name">${f.rotulo}</span>
                  <span class="mh-src-summary">${f.resumo}</span>
                  ${aberto ? nothing : html`<bruno-icon class="mh-src-chevron" icon="mdi:chevron-right"></bruno-icon>`}
                </button>
                ${aberto ? html`<div class="mh-source-body">${f.corpo()}</div>` : nothing}
              </div>
            `;
          })}
        </div>
      </div>
    `;
  }

  /** O menu de três pontos. Só a Sala tem PS5; nos demais fica o more-info. */
  private _renderMenuMidia() {
    const ps5 = this._idDe('ps5');
    const st = this._estado(ps5);
    const ativo = st?.state === 'on';
    const itens = ps5
      ? [{ icone: 'mdi:sony-playstation', titulo: 'PS5', sub: ativo ? 'Online' : 'Offline', entidade: ps5, ativo }]
      : [];
    if (!itens.length) return nothing;

    return html`
      <div class="mh-overflow-panel" role="menu" aria-label="Opções de mídia">
        ${itens.map(
          (i) => html`
            <div class="mh-overflow-item">
              <span class="mh-overflow-icon"><bruno-icon icon=${i.icone}></bruno-icon></span>
              <span class="mh-overflow-copy"><strong>${i.titulo}</strong><small>${i.sub}</small></span>
              <button
                type="button"
                class="mh-overflow-action ${i.ativo ? 'is-active' : ''}"
                title=${i.ativo ? 'Desligar PS5' : 'Ligar PS5'}
                aria-label=${i.ativo ? 'Desligar PS5' : 'Ligar PS5'}
                @click=${() => this._servico('homeassistant', 'toggle', { entity_id: i.entidade })}
              >
                <bruno-icon icon="mdi:power"></bruno-icon>
              </button>
              <button
                type="button"
                class="mh-overflow-action"
                title="Detalhes"
                aria-label="Detalhes do PS5"
                @click=${() => this._maisInfo(i.entidade)}
              >
                <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>
              </button>
            </div>
          `,
        )}
      </div>
    `;
  }

  /**
   * Os cinco eletrodomésticos da Cozinha.
   *
   * Cada tile tem imagem, nome e o estado em texto. Só a lava-louças tem
   * entidade hoje; os demais são placeholders com `is-muted`, como no original —
   * aparecem, mas não prometem controle que não existe.
   */
  private _renderEletrodomesticos() {
    // A lista vem da própria configuração — `entities.appliances` —, com o PNG
    // de cada aparelho, os estados que contam como ativo e os rótulos. Eu havia
    // escrito uma lista fixa com ícones; o original usa IMAGEM.
    const bruto = (this._sub?.entities as Record<string, unknown> | undefined)?.['appliances'];
    if (!Array.isArray(bruto)) return nothing;

    return bruto
      .filter((a): a is Record<string, unknown> => Boolean(a) && typeof a === 'object')
      .map((item) => {
        const chave = String(item['key'] ?? 'item').replace(/[^a-z0-9_-]/gi, '-').toLowerCase();
        const nome = String(item['name'] ?? 'Eletrodoméstico');
        const imagem = typeof item['image'] === 'string' ? item['image'] : '';
        const alvo = typeof item['entity'] === 'string' ? item['entity'] : '';
        const idEstado = typeof item['stateEntity'] === 'string' ? item['stateEntity'] : alvo;
        const st = idEstado && this._hass ? this._hass.states[idEstado] : undefined;

        const ativos = Array.isArray(item['activeStates'])
          ? (item['activeStates'] as unknown[]).map((v) => String(v).toLowerCase())
          : ['on'];
        const atributoAtivo = typeof item['activeAttr'] === 'string' ? item['activeAttr'] : '';
        const sensorAtivo = this._room?.activeSensor ? this._hass?.states[this._room.activeSensor] : undefined;
        const ativo =
          ativos.includes(String(st?.state ?? '').toLowerCase()) ||
          (atributoAtivo ? truthy(sensorAtivo?.attributes[atributoAtivo]) : false);

        const placeholder = Boolean(item['placeholder']) || !alvo;
        const detalhes = typeof item['moreInfoEntity'] === 'string' ? item['moreInfoEntity'] : alvo;
        const classes = ['appliance-tile', `is-${chave}`, ativo ? 'is-on' : '', placeholder ? 'is-muted' : '']
          .filter(Boolean)
          .join(' ');

        return html`
          <article class=${classes}>
            <button
              type="button"
              class="appliance-main"
              aria-label=${nome}
              ?disabled=${placeholder}
              @click=${() => !placeholder && this._alternarAparelho(alvo)}
            >
              <div class="appliance-visual" data-image-wrapper>
                ${imagem ? html`<img src=${imagem} alt="" loading="lazy" decoding="async" />` : nothing}
              </div>
              <div class="appliance-copy">
                <strong>${nome}</strong>
                <small>${this._rotuloDoAparelho(item, st, ativo, placeholder)}</small>
              </div>
            </button>
            <button
              type="button"
              class="mh-menu appliance-more"
              title="Mais detalhes"
              aria-label=${`Mais detalhes de ${nome}`}
              ?disabled=${!detalhes}
              @click=${() => this._maisInfo(detalhes)}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </article>
        `;
      });
  }

  /** Rótulo de estado: os textos vêm da configuração, como no original. */
  private _rotuloDoAparelho(
    item: Record<string, unknown>,
    st: { state: string } | undefined,
    ativo: boolean,
    placeholder: boolean,
  ): string {
    const texto = (k: string, padrao: string) =>
      typeof item[k] === 'string' ? (item[k] as string) : padrao;
    if (placeholder) return texto('placeholderLabel', 'Sem tomada');
    if (!st) return 'Indisponível';
    if (ativo) return texto('activeLabel', 'Ligada');
    const s = String(st.state).toLowerCase();
    if (s === 'off' || s === 'unavailable') return texto('offLabel', 'Desligada');
    return texto('idleLabel', 'Ligada');
  }

  private _alternarAparelho(entityId: string): void {
    if (!this._hass) return;
    const dominio = entityId.split('.')[0] ?? 'switch';
    this._hass.callService(dominio, 'toggle', { entity_id: entityId }, { entity_id: entityId });
  }

  private _entidadeClimate(): string | undefined {
    return this._idDe('climate');
  }

  private _estadoClimate(): EstadoHa | undefined {
    return this._estado(this._entidadeClimate());
  }

  /**
   * O A/C está trabalhando?
   *
   * `hvac_action` manda quando existe: um aparelho em `cool` mas com a ação
   * `idle` não está resfriando. Sem ela, vale o estado.
   */
  private _modeloClimate() {
    const st = this._estadoClimate();
    const a = st?.attributes ?? {};
    const acao = String(a['hvac_action'] ?? '').toLowerCase();
    const indisponivel = this._indisponivel(st);
    const ativo = indisponivel || st?.state === 'off'
      ? false
      : ACOES_CLIMATE_ATIVAS.includes(acao)
        ? true
        : ACOES_CLIMATE_INATIVAS.includes(acao)
          ? false
          : ESTADOS_CLIMATE_LIGADO.includes(String(st?.state ?? ''));

    const num = (v: unknown, padrao: number | null) => (Number.isFinite(Number(v)) ? Number(v) : padrao);
    return {
      st,
      indisponivel,
      ativo,
      alvo: num(a['temperature'], null),
      atual: num(a['current_temperature'], null),
      minima: num(a['min_temp'], 16) as number,
      maxima: num(a['max_temp'], 30) as number,
      modo: st?.state ?? 'off',
      ventilacao: String(a['fan_mode'] ?? 'auto'),
      swing: String(a['swing_mode'] ?? ''),
      modos: Array.isArray(a['hvac_modes']) ? (a['hvac_modes'] as string[]) : [],
      ventilacoes: Array.isArray(a['fan_modes']) ? (a['fan_modes'] as string[]) : [],
      swings: Array.isArray(a['swing_modes']) ? (a['swing_modes'] as string[]) : [],
    };
  }

  private _rotuloModo(modo: string): string {
    const nomes: Record<string, string> = {
      off: 'Desligado', cool: 'Frio', heat: 'Aquecimento', fan_only: 'Ventilar',
      dry: 'Secar', heat_cool: 'Auto', auto: 'Auto',
    };
    return nomes[String(modo).toLowerCase()] ?? capitalizar(modo);
  }

  private _iconeModo(modo: string): string {
    const nomes: Record<string, string> = {
      off: 'mdi:power', cool: 'mdi:snowflake', heat: 'mdi:fire', fan_only: 'mdi:fan',
      dry: 'mdi:water-percent', auto: 'mdi:autorenew', heat_cool: 'mdi:autorenew',
    };
    return nomes[String(modo).toLowerCase()] ?? 'mdi:thermostat';
  }

  private _rotuloVentilacao(modo: string): string {
    const v = String(modo).toLowerCase();
    if (v === 'auto') return 'Auto';
    if (v.includes('low') || v.includes('baixo')) return 'Baixa';
    if (v.includes('med')) return 'Média';
    if (v.includes('high') || v.includes('alto')) return 'Alta';
    if (v.includes('fort')) return 'Forte';
    return capitalizar(modo);
  }

  private _iconeVentilacao(modo: string): string {
    const v = String(modo).toLowerCase();
    if (v.includes('auto')) return 'mdi:fan-auto';
    if (v.includes('low') || v.includes('baixo')) return 'mdi:fan-speed-1';
    if (v.includes('med')) return 'mdi:fan-speed-2';
    if (v.includes('high') || v.includes('alto') || v.includes('fort')) return 'mdi:fan-speed-3';
    return 'mdi:fan';
  }

  private _rotuloSwing(modo: string): string {
    const v = String(modo).toLowerCase();
    if (!v) return 'Indisponível';
    if (['off', 'desativado', 'desativada', 'disabled'].includes(v)) return 'Desligado';
    if (['on', 'ativo', 'ativada', 'enabled'].includes(v)) return 'Ativo';
    return capitalizar(modo);
  }

  /**
   * O anel — gauge semicircular de 180°, do mínimo à esquerda ao máximo à
   * direita, com o alvo no arco aceso e a temperatura ambiente sob a linha.
   *
   * A geometria é a do original: centro em (360, 410), raio 285, viewBox
   * 720×460. As duas coroas de marcas (90 externas, 72 internas) e as cinco
   * legendas são calculadas, não desenhadas à mão.
   */
  private _renderAnelClimate(cl: ReturnType<typeof this._modeloClimate>) {
    const cx = 360;
    const cy = 410;
    const raio = 285;
    const inicio = -180;
    const fim = 0;
    const varredura = fim - inicio;

    const min = Number.isFinite(cl.minima) ? cl.minima : 12;
    const max = Number.isFinite(cl.maxima) ? cl.maxima : 30;
    const alvo = Number.isFinite(Number(cl.alvo))
      ? Math.max(min, Math.min(max, Number(cl.alvo)))
      : min + (max - min) / 2;
    const fracao = Math.max(0, Math.min(1, (alvo - min) / Math.max(1, max - min)));
    const anguloAtual = inicio + varredura * fracao;

    const polar = (r: number, grau: number) => {
      const rad = (grau * Math.PI) / 180;
      return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
    };
    const arco = (r: number, a: number, b: number) => {
      const s = polar(r, a);
      const e = polar(r, b);
      const grande = Math.abs(b - a) <= 180 ? '0' : '1';
      return `M ${s.x.toFixed(3)} ${s.y.toFixed(3)} A ${r} ${r} 0 ${grande} 1 ${e.x.toFixed(3)} ${e.y.toFixed(3)}`;
    };

    const marcasExternas = Array.from({ length: 91 }, (_, i) => {
      const ang = inicio + varredura * (i / 90);
      const maior = i % 15 === 0;
      const media = i % 5 === 0;
      const p1 = polar(raio + 34, ang);
      const p2 = polar(maior ? raio + 8 : media ? raio + 14 : raio + 21, ang);
      const cls = maior ? 'icg-tick major' : media ? 'icg-tick medium' : 'icg-tick minor';
      return svg`<line x1=${p1.x.toFixed(3)} y1=${p1.y.toFixed(3)} x2=${p2.x.toFixed(3)} y2=${p2.y.toFixed(3)} class=${cls}></line>`;
    });

    const marcasInternas = Array.from({ length: 73 }, (_, i) => {
      const ang = inicio + varredura * (i / 72);
      const p1 = polar(raio - 18, ang);
      const p2 = polar(raio - 34, ang);
      return svg`<line x1=${p1.x.toFixed(3)} y1=${p1.y.toFixed(3)} x2=${p2.x.toFixed(3)} y2=${p2.y.toFixed(3)} class="icg-inner-tick"></line>`;
    });

    const legendas = [
      { texto: `${numero(min, 0)}°`, ang: -180, r: raio + 52, cls: 'edge' },
      { texto: '10', ang: -148, r: raio + 58, cls: '' },
      { texto: '20', ang: -90, r: raio + 52, cls: 'top' },
      { texto: '25', ang: -32, r: raio + 58, cls: '' },
      { texto: `${numero(max, 0)}°`, ang: 0, r: raio + 52, cls: 'edge' },
    ].map((l) => {
      const p = polar(l.r, l.ang);
      return svg`<text x=${p.x.toFixed(3)} y=${p.y.toFixed(3)} text-anchor="middle" dominant-baseline="middle" class=${`icg-label ${l.cls}`}>${l.texto}</text>`;
    });

    const marcador = polar(raio, anguloAtual);
    const rotuloAlvo = cl.alvo == null ? '--' : numero(cl.alvo, 0);
    const rotuloAmbiente = cl.atual == null ? '--' : numero(cl.atual, 1);
    const rotuloModo = (cl.modo === 'cool'
      ? 'Resfriamento'
      : cl.modo === 'heat'
        ? 'Aquecimento'
        : cl.modo === 'fan_only'
          ? 'Ventilacao'
          : 'Temperatura'
    ).toUpperCase();

    return html`
      <div class="icg-root">
        <div class="icg-shell">
          <svg
            class="icg-svg"
            viewBox="0 0 720 460"
            role="img"
            aria-label=${`Temperatura alvo ${rotuloAlvo}°. Ambiente ${rotuloAmbiente}°.`}
          >
            <defs>
              <linearGradient id="icgActiveBlue" x1="90" y1="340" x2="560" y2="90">
                <stop offset="0%" stop-color="#0078ff"></stop>
                <stop offset="38%" stop-color="#1fb7ff"></stop>
                <stop offset="72%" stop-color="#3ed6ff"></stop>
                <stop offset="100%" stop-color="#96f0ff"></stop>
              </linearGradient>
              <filter id="icgBlueGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur>
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0.02  0 0 0 0 0.42  0 0 0 0 1  0 0 0 0.95 0"
                ></feColorMatrix>
                <feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
              <filter id="icgTextGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#dcecff" flood-opacity="0.24"></feDropShadow>
              </filter>
            </defs>
            <g>${marcasExternas}</g>
            <g>${marcasInternas}</g>
            <path d=${arco(raio, inicio, fim)} class="icg-track-shadow"></path>
            <path d=${arco(raio, anguloAtual, fim)} class="icg-track-muted"></path>
            <path d=${arco(raio, inicio, anguloAtual)} class="icg-active-glow"></path>
            <path d=${arco(raio, inicio, anguloAtual)} class="icg-active-arc"></path>
            ${legendas}
            <circle cx=${marcador.x.toFixed(3)} cy=${marcador.y.toFixed(3)} r="21" class="icg-marker-glow"></circle>
            <circle cx=${marcador.x.toFixed(3)} cy=${marcador.y.toFixed(3)} r="13" class="icg-marker-ring"></circle>
            <circle
              cx=${(marcador.x - 4).toFixed(3)}
              cy=${(marcador.y - 5).toFixed(3)}
              r="4"
              class="icg-marker-highlight"
            ></circle>
            <text x=${cx} y="260" text-anchor="middle" dominant-baseline="middle" class="icg-center-mode">
              ${rotuloModo}
            </text>
            <text x=${cx} y="328" text-anchor="middle" dominant-baseline="middle" class="icg-center-temp">
              ${rotuloAlvo}°
            </text>
            <text x=${cx} y="382" text-anchor="middle" dominant-baseline="middle" class="icg-center-sub">
              SET TEMPERATURE
            </text>
            <line x1=${cx - 28} y1="408" x2=${cx + 28} y2="408" class="icg-center-line"></line>
            <text x=${cx} y="432" text-anchor="middle" dominant-baseline="middle" class="icg-ambient">
              Ambient ${rotuloAmbiente}°
            </text>
          </svg>
        </div>
      </div>
    `;
  }

  /** A/C: cabeçalho com power, anel de temperatura e três controles na base. */
  private _renderAC() {
    const id = this._entidadeClimate();
    const cl = this._modeloClimate();
    const swingNormalizado = cl.swing.toLowerCase();
    const swingAtivo =
      ['on', 'ativo', 'ativada', 'enabled'].includes(swingNormalizado) ||
      (swingNormalizado.includes('ativ') && !swingNormalizado.includes('desativ'));

    const unicos = (v: string[]) => [...new Set(v.filter(Boolean))];
    const painel = this._painelClima;

    const opcoes = {
      mode: unicos(cl.modos).map((m) => ({
        modo: m,
        rotulo: this._rotuloModo(m),
        icone: this._iconeModo(m),
        ativo: m.toLowerCase() === String(cl.modo).toLowerCase(),
        servico: 'set_hvac_mode' as const,
        campo: 'hvac_mode' as const,
      })),
      fan: unicos(cl.ventilacoes).map((m) => ({
        modo: m,
        rotulo: this._rotuloVentilacao(m),
        icone: this._iconeVentilacao(m),
        ativo: m.toLowerCase() === cl.ventilacao.toLowerCase(),
        servico: 'set_fan_mode' as const,
        campo: 'fan_mode' as const,
      })),
      swing: unicos(cl.swings).map((m) => ({
        modo: m,
        rotulo: this._rotuloSwing(m),
        icone: m.toLowerCase() === 'off' ? 'mdi:air-conditioner' : 'mdi:swap-vertical',
        ativo: m.toLowerCase() === swingNormalizado,
        servico: 'set_swing_mode' as const,
        campo: 'swing_mode' as const,
      })),
    };

    const popover = (chave: 'mode' | 'fan' | 'swing') => {
      if (painel !== chave) return nothing;
      const lista = opcoes[chave];
      if (!lista.length) {
        return html`<div class="ac-popover" role="menu">
          <button type="button" class="ac-popover-option" disabled>
            <bruno-icon icon="mdi:alert-circle-outline"></bruno-icon><span>Indisponível</span>
          </button>
        </div>`;
      }
      return html`<div class="ac-popover" role="menu">
        ${lista.map(
          (o) => html`
            <button
              type="button"
              class="ac-popover-option ${o.ativo ? 'is-active' : ''}"
              role="menuitem"
              @click=${() => {
                this._painelClima = '';
                if (id) this._servico('climate', o.servico, { entity_id: id, [o.campo]: o.modo });
                this.requestUpdate();
              }}
            >
              <bruno-icon icon=${o.icone}></bruno-icon><span>${o.rotulo}</span>
            </button>
          `,
        )}
      </div>`;
    };

    const controle = (
      chave: 'mode' | 'fan' | 'swing',
      icone: string,
      titulo: string,
      valor: string,
    ) => html`
      <div class="ac-control-wrap">
        <button
          type="button"
          class="ac-action ${painel === chave ? 'is-open' : ''}"
          aria-expanded=${painel === chave ? 'true' : 'false'}
          ?disabled=${cl.indisponivel || !id}
          @click=${() => {
            this._painelClima = this._painelClima === chave ? '' : chave;
            this.requestUpdate();
          }}
        >
          <span class="ac-action-icon"><bruno-icon icon=${icone}></bruno-icon></span>
          <span class="ac-action-text"><small>${titulo}</small><strong>${valor}</strong></span>
        </button>
        ${popover(chave)}
      </div>
    `;

    return html`
      <div class="glass-card ac-card ac-card-lean">
        <div class="ac-lean-head">
          <div class="mh-head-title ac-head-title">
            <span class="micro-icon tone-cyan"><bruno-icon icon="mdi:air-conditioner"></bruno-icon></span>
            <div class="module-title">Ar-condicionado</div>
          </div>
          <div class="ac-top-stack">
            <button
              type="button"
              class="mh-menu ac-more-button"
              title="Mais detalhes"
              aria-label="Mais detalhes"
              @click=${() => {
                this._painelClima = '';
                this._maisInfo(id);
              }}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
            <button
              type="button"
              class="ac-power-floating ${cl.ativo ? 'is-active' : ''}"
              aria-label=${cl.ativo ? 'Desligar ar condicionado' : 'Ligar ar condicionado'}
              ?disabled=${cl.indisponivel || !id}
              @click=${() => {
                if (!id) return;
                this._painelClima = '';
                this._servico('climate', cl.ativo ? 'turn_off' : 'turn_on', { entity_id: id });
              }}
            >
              <bruno-icon icon="mdi:power"></bruno-icon>
            </button>
          </div>
        </div>
        <div class="ac-lean-mid">
          <div class="ac-ring">${this._renderAnelClimate(cl)}</div>
        </div>
        <div class="ac-lean-foot">
          ${controle(
            'mode',
            'mdi:thermostat-auto',
            'Modo',
            !cl.ativo || cl.modo === 'off' ? 'Desligado' : this._rotuloModo(cl.modo),
          )}
          ${controle('fan', 'mdi:fan', 'Ventilação', this._rotuloVentilacao(cl.ventilacao))}
          ${controle(
            'swing',
            'mdi:air-conditioner',
            'Swing',
            cl.swing ? this._rotuloSwing(cl.swing) : swingAtivo ? 'Ativo' : 'Desligado',
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
        <div class="mh-head appliances-head">
          <div class="mh-head-title">
            <!-- O nome tem de ser um dos apelidos da tabela de Hugeicons.
                 "silverware-fork-knife" não está lá e caía no genérico — o
                 círculo que aparecia no lugar do ícone. O original usa este,
                 que resolve para "hugeicons:electric-home-01". -->
            <span class="micro-icon tone-amber">
              <bruno-icon icon="mdi:home-lightning-bolt-outline"></bruno-icon>
            </span>
            <div class="module-title">Eletrodomésticos</div>
          </div>
        </div>
        <div class="appliances-grid">${this._renderEletrodomesticos()}</div>
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
