import { LitElement, html, css, nothing } from 'lit';
import type { Hass } from '@/models/home-assistant';
import { ROOMS, SPOTIFY_ENTITY, type RoomConfig, type RoomDot } from '@/config/rooms.config';
import { lightsSummary, semanticLine, isRoomOn, sensorDisplay } from '@/services/entities/room-state';
import { spotifyTocandoEm } from '@/services/entities/spotify-device';
import { isTvPoweredStable } from '@/services/entities/media-state';
import { ObservadorDeEntidades, resumirMotivo } from '@/services/state/entity-watcher';
import { conectou, desconectou, medirRender } from '@/diagnostics/runtime/probe';

/** Nome deste componente no coletor de runtime (Fase 6.0). */
const SONDA = 'bruno-room-tile';

/**
 * Tile de cômodo — arquitetura nova.
 *
 * Especificação: docs/07-design-system.md, seção "Composição canônica do tile de
 * cômodo". Os 8 cards atuais já são consistentes entre si; este componente
 * precisa REPRODUZIR essa composição, não propor outra. Toda medida aqui foi
 * lida de `bruno-office-card.js`, que é o card com mais status renderizados.
 *
 * Uso:
 *     type: custom:bruno-room-tile
 *     room: office
 *     variant: tile
 *     divider_left: true
 */

interface TileConfig {
  room: string;
  variant?: string;
  divider_left?: boolean;
  name?: string;
}

interface ResolvedDot {
  icon: string;
  label: string;
  tone: string;
}

/** Alvos de gesto: o botão do cômodo e a zona de navegação, dentro dele. */
type GestureTarget = 'room' | 'nav';

interface GestureState {
  pointerId: number | null;
  down: boolean;
  moved: boolean;
  holdFired: boolean;
  startX: number;
  startY: number;
  holdTimer: number | null;
}

const ACTION_COOLDOWN_MS = 1200;
/** Tempo de pressão que dispara o hold. Valor dos cards atuais. */
const HOLD_MS = 560;
/** Deslocamento acima do qual o gesto vira rolagem da faixa e o toque é cancelado. */
const DRAG_CANCEL_PX = 10;

function novoGesto(): GestureState {
  return {
    pointerId: null,
    down: false,
    moved: false,
    holdFired: false,
    startX: 0,
    startY: 0,
    holdTimer: null,
  };
}

/** Retorno tátil/sonoro do frontend, quando o módulo está carregado. */
function feedback(kind: 'tap' | 'hold'): void {
  const g = globalThis as { BrunoLiquidGlass?: { feedback?: (k: string) => void } };
  g.BrunoLiquidGlass?.feedback?.(kind);
}

function truthy(value: unknown): boolean {
  if (value === true) return true;
  if (typeof value === 'number') return value > 0;
  return ['true', 'on', 'yes', '1'].includes(String(value ?? '').toLowerCase());
}

export class BrunoRoomTile extends LitElement {
  /**
   * ANTERIOR (rollback 6.1) — e o defeito que a Fase 6.1 achou:
   *
   *   static override properties = { _hass: { state: true } };
   *
   * Declarar `_hass` como propriedade REATIVA faz o Lit pedir um render a cada
   * atribuição. Como o setter atribui SEMPRE (o componente precisa do hass mais
   * recente para agir), o `return` da guarda nunca evitava nada: o render já
   * tinha sido pedido na linha anterior.
   *
   * Era isto que produzia os 4 renders por segundo medidos no tablet. A guarda
   * por assinatura existia desde a Fase 5 e nunca funcionou — e não dava para
   * ver, porque a contagem não dizia QUEM pedia o render. A atribuição de motivo
   * da 6.1 mostrou 2.767 de 2.800 renders com motivo "outro", isto é, vindos de
   * fora do observador.
   *
   * Sem esta declaração, o único caminho para renderizar é o `requestUpdate()`
   * explícito — que é o que a guarda controla.
   */
  static override properties = {};

  private _config?: TileConfig;
  private _room?: RoomConfig;
  private _hass?: Hass;
  private _lastAction = 0;
  /**
   * ANTERIOR (rollback 6.1): assinatura em texto, montada e comparada aqui
   * dentro. Funcionava, mas não sabia dizer QUAL entidade mudou — e a baseline
   * do tablet contou 3.328 renders sem conseguir apontar a causa.
   *
   *   private _signature = '';
   */
  private readonly _observador = new ObservadorDeEntidades();
  /** Ids que causaram o render pendente. Vira o motivo em `update()`. */
  private _motivo = '';

  private _gestures: Record<GestureTarget, GestureState> = {
    room: novoGesto(),
    nav: novoGesto(),
  };

  private _timers = new Set<number>();

  setConfig(config: TileConfig): void {
    if (!config?.room) throw new Error('bruno-room-tile: informe `room`');
    const room = ROOMS.find((r) => r.id === config.room);
    if (!room) throw new Error(`bruno-room-tile: cômodo desconhecido "${config.room}"`);
    this._config = config;
    this._room = room;
    // A lista observada só existe depois daqui: o primeiro `hass` chega ANTES
    // do setConfig. Sem esta linha o observador ficaria eternamente com a lista
    // vazia e o ladrilho nunca repintaria.
    this._observador.observar(this._watched());
  }

  getCardSize(): number {
    return 3;
  }

  /**
   * Mede o custo de cada atualizacao (Fase 6.0.1) e registra o MOTIVO (6.1).
   *
   * O motivo é consumido aqui: se o mesmo render for pedido de novo por outro
   * caminho (troca de tema, por exemplo), ele não pode herdar a causa anterior.
   */
  override update(mudancas: Map<string, unknown>): void {
    const motivo = this._motivo;
    this._motivo = '';
    medirRender(
      SONDA,
      () => super.update(mudancas),
      motivo || (this.hasUpdated ? 'interação' : 'montagem'),
    );
  }


  /**
   * O objeto hass muda a cada alteração de estado de QUALQUER entidade da casa.
   * Só re-renderiza quando muda algo que este tile realmente lê — é o contrato
   * que substitui o re-render total dos cards atuais (A2 em docs/09).
   */
  set hass(hass: Hass) {
    this._hass = hass;
    const mudou = this._observador.mudancas(hass);
    if (mudou.length === 0) return;
    this._motivo = resumirMotivo(mudou);
    this.requestUpdate();
  }

  private _watched(): string[] {
    const room = this._room;
    const e = room?.entities;
    if (!e) return [];
    const dotIds = (room?.statusDots ?? []).flatMap((d) => d.entities ?? []);
    const painelIds = (room?.popup?.lights ?? []).map((l) => l.entity);
    return [
      ...painelIds,
      room?.applianceLine?.entity,
      e.lightGroup,
      ...(e.lights ?? []),
      room?.toggleTarget,
      room?.activeSensor,
      e.motionRecent,
      e.occupancy,
      e.semanticState,
      e.temperature,
      e.humidity,
      ...dotIds,
    ].filter((x): x is string => typeof x === 'string');
  }

  /**
   * ANTERIOR (rollback 6.1) — a assinatura em texto que o observador substituiu:
   *
   *   private _buildSignature(hass: Hass): string {
   *     return this._watched()
   *       .map((id) => {
   *         const s = hass.states[id];
   *         return s ? id + "=" + s.state + "@" + s.last_changed : id + "=vazio";
   *       })
   *       .join("|");
   *   }
   *
   * Montava uma string com TODAS as entidades a cada atualização do hass — ou
   * seja, alocava a cada mudança de qualquer coisa na casa, só para descobrir
   * que nada dali havia mudado. O observador compara campo a campo e só aloca
   * quando há mudança de fato.
   */

  private _onThemeChanged = (): void => {
    this._tileModeCache = undefined;
    this.requestUpdate();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    conectou(SONDA);
    // O primeiro update do Lit acontece no attach, ANTES de o Home Assistant
    // chamar setConfig. Ali getComputedStyle ainda não vê os tokens do tema e
    // `variant` ainda não existe — por isso o cache é invalidado aqui e o valor
    // é recalculado no render, não guardado de uma leitura única.
    this._tileModeCache = undefined;
    globalThis.addEventListener?.('bruno-theme-changed', this._onThemeChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    desconectou(SONDA);
    globalThis.removeEventListener?.('bruno-theme-changed', this._onThemeChanged);
    for (const t of this._timers) window.clearTimeout(t);
    this._timers.clear();
    for (const alvo of ['room', 'nav'] as GestureTarget[]) this._resetGesture(alvo);
  }

  /**
   * Modo tile: DUAS condições simultâneas, ambas obrigatórias.
   *
   *   1. variant: tile  — vem do YAML, só a faixa de cômodos passa isso
   *   2. --bruno-tile-mode: on  — só o tema Josh define
   *
   * Sem as duas, o card renderiza como cartão de vidro. Foi exatamente este o
   * erro da primeira tentativa da Fase 5a, e voltou na segunda por outro
   * caminho: eu lia o token no `firstUpdated`, que dispara antes do setConfig.
   * Avaliação preguiçosa no render, com cache, é o que os cards atuais fazem.
   */
  private _tileModeCache: boolean | undefined;

  private get _joshHomeMode(): boolean {
    if (this._config?.variant !== 'tile') return false;
    if (this._tileModeCache !== undefined) return this._tileModeCache;
    let value = '';
    try {
      value = getComputedStyle(this).getPropertyValue('--bruno-tile-mode').trim();
    } catch {
      value = '';
    }
    this._tileModeCache = value === 'on';
    return this._tileModeCache;
  }

  private get _phoneJoshCard(): boolean {
    const phone = typeof globalThis.matchMedia === 'function'
      ? globalThis.matchMedia('(max-width: 800px)').matches
      : false;
    return this._joshHomeMode && phone;
  }

  private get _tileMode(): boolean {
    return this._joshHomeMode && !this._phoneJoshCard;
  }

  /**
   * Liga/desliga uma classe de interação DIRETO no elemento.
   *
   * Não passa por estado reativo de propósito. Pelo Lit a classe só chegaria ao
   * DOM no próximo microtask, e um botão que responde ao toque não pode depender
   * de agendamento — além de disparar um render inteiro a cada dedo na tela,
   * durante a rolagem da faixa. Os atributos `class` destes dois elementos são
   * estáticos no template, então o Lit não os sobrescreve.
   */
  private _classe(seletor: string, nome: string, ligada: boolean): void {
    const el = this.shadowRoot?.querySelector(seletor);
    if (!el) return;
    el.classList.toggle(nome, ligada);
  }

  private _alvoSeletor(alvo: GestureTarget): string {
    return alvo === 'room' ? '.room-action' : '.room-nav-zone';
  }

  private _later(fn: () => void, ms: number): number {
    const id = window.setTimeout(() => {
      this._timers.delete(id);
      fn();
    }, ms);
    this._timers.add(id);
    return id;
  }

  // ── Gestos ───────────────────────────────────────────────────────────────
  //
  // Transcrito de `_wireAction` / `_wireRoomNavZone` dos cards atuais. Três
  // detalhes NÃO são cosméticos e não podem ser simplificados:
  //
  //   1. a classe de pressão é aplicada por JS, não por `:active`. No WebView do
  //      tablet o `:active` fica preso quando o gesto vira rolagem da faixa;
  //   2. o deslocamento acima de 10px cancela o toque SEM `preventDefault`, para
  //      que a faixa continue rolando com o dedo;
  //   3. a zona de navegação vive DENTRO do botão do cômodo. É o
  //      `stopPropagation` dela que impede o toque no título de acender a luz.

  private _resetGesture(alvo: GestureTarget): void {
    const g = this._gestures[alvo];
    if (g.holdTimer !== null) {
      window.clearTimeout(g.holdTimer);
      this._timers.delete(g.holdTimer);
      g.holdTimer = null;
    }
    g.down = false;
    g.moved = false;
    g.pointerId = null;
    this._classe(this._alvoSeletor(alvo), 'is-pressed', false);
  }

  private _onDown(alvo: GestureTarget, ev: PointerEvent): void {
    if (ev.button != null && ev.button !== 0) return;
    const g = this._gestures[alvo];
    if (g.pointerId !== null) {
      ev.stopPropagation();
      return;
    }
    ev.stopPropagation();

    g.down = true;
    g.moved = false;
    g.holdFired = false;
    g.pointerId = ev.pointerId;
    g.startX = ev.clientX;
    g.startY = ev.clientY;
    this._classe(this._alvoSeletor(alvo), 'is-pressed', true);

    g.holdTimer = this._later(() => {
      g.holdTimer = null;
      if (!g.down || g.moved) return;
      g.holdFired = true;
      this._classe(this._alvoSeletor(alvo), 'is-hold-fired', true);
      this._later(() => this._classe(this._alvoSeletor(alvo), 'is-hold-fired', false), 260);
      this._runAction('hold');
    }, HOLD_MS);
  }

  private _onMove(alvo: GestureTarget, ev: PointerEvent): void {
    const g = this._gestures[alvo];
    if (!g.down || ev.pointerId !== g.pointerId) return;
    const dx = Math.abs(ev.clientX - g.startX);
    const dy = Math.abs(ev.clientY - g.startY);
    if (dx <= DRAG_CANCEL_PX && dy <= DRAG_CANCEL_PX) return;
    g.moved = true;
    if (g.holdTimer !== null) {
      window.clearTimeout(g.holdTimer);
      this._timers.delete(g.holdTimer);
      g.holdTimer = null;
    }
    this._classe(this._alvoSeletor(alvo), 'is-pressed', false);
  }

  private _onUp(alvo: GestureTarget, ev: PointerEvent): void {
    const g = this._gestures[alvo];
    if (ev.pointerId !== g.pointerId) {
      ev.stopPropagation();
      return;
    }
    ev.preventDefault();
    ev.stopPropagation();

    const estavaPressionado = g.down;
    const arrastou = g.moved;
    const segurou = g.holdFired;
    this._resetGesture(alvo);

    if (!estavaPressionado || arrastou || segurou) return;
    if (alvo === 'room') {
      this._runAction('tap');
      return;
    }
    this._classe('.room-nav-zone', 'is-navigating', true);
    this._later(() => this._classe('.room-nav-zone', 'is-navigating', false), 420);
    this._later(() => this._openSubview(), 90);
  }

  private _onCancel(alvo: GestureTarget, ev: PointerEvent): void {
    if (ev.pointerId !== this._gestures[alvo].pointerId) return;
    this._resetGesture(alvo);
  }

  private _onKey(alvo: GestureTarget, ev: KeyboardEvent): void {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    if (alvo === 'room') {
      this._runAction('tap');
      return;
    }
    ev.stopPropagation();
    this._classe('.room-nav-zone', 'is-navigating', true);
    this._later(() => this._classe('.room-nav-zone', 'is-navigating', false), 420);
    this._later(() => this._openSubview(), 90);
  }

  /** Toque curto alterna a luz principal; pressão longa apaga o cômodo inteiro. */
  private _runAction(gesto: 'tap' | 'hold'): void {
    const room = this._room;
    const hass = this._hass;
    if (!room || !hass) return;
    feedback(gesto);

    if (gesto === 'hold') {
      const grupo = room.entities.lightGroup;
      if (!grupo) return;
      hass.callService('light', 'turn_off', { entity_id: grupo }, { entity_id: grupo });
      return;
    }

    const agora = Date.now();
    if (agora - this._lastAction < ACTION_COOLDOWN_MS) return;
    this._lastAction = agora;

    const alvo = room.toggleTarget ?? room.entities.lightGroup ?? room.entities.lights?.[0];
    if (!alvo) return;
    hass.callService('light', 'toggle', { entity_id: alvo }, { entity_id: alvo });
  }

  /**
   * Destino do chevron: a subview do cômodo ou, onde não há, o painel próprio.
   *
   * A shell escuta `ll-custom` e troca a seção; não há mudança de URL.
   */
  private _openSubview(): void {
    const room = this._room;
    if (!room) return;
    feedback('tap');
    if (room.section) {
      this.dispatchEvent(
        new CustomEvent('ll-custom', {
          detail: { action: 'fire-dom-event', bruno_section: room.section },
          bubbles: true,
          composed: true,
        }),
      );
      return;
    }
    if (room.popup) this._abrirPainel();
  }

  private _abrirPainel(): void {
    const dialog = this.shadowRoot?.querySelector('dialog.room-popup');
    if (!dialog) return;
    try {
      (dialog as HTMLDialogElement).showModal();
    } catch {
      return;
    }
    this._posicionarPainel();
  }

  private _fecharPainel = (): void => {
    const dialog = this.shadowRoot?.querySelector('dialog.room-popup');
    (dialog as HTMLDialogElement | null)?.close();
  };

  /**
   * Ancora o painel ao próprio tile.
   *
   * O `<dialog>` está na top layer, então `getBoundingClientRect()` já devolve
   * coordenadas de viewport. Abre abaixo do tile; se não couber, acima. O
   * alinhamento é pela borda direita porque o cômodo com painel fica na metade
   * direita da faixa — alinhar pela esquerda jogaria o painel para fora.
   */
  private _posicionarPainel(): void {
    const painel = this.shadowRoot?.querySelector<HTMLElement>('.room-popup-panel');
    if (!painel) return;
    const ancora = this.getBoundingClientRect();
    if (!ancora.width && !ancora.height) return;

    const folga = 10;
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    const pw = painel.offsetWidth || 520;
    const ph = painel.offsetHeight || 240;

    let left = ancora.right - pw;
    left = Math.min(Math.max(left, folga), Math.max(folga, vw - pw - folga));

    let top = ancora.bottom + folga;
    if (top + ph > vh - folga) top = ancora.top - ph - folga;
    top = Math.min(Math.max(top, folga), Math.max(folga, vh - ph - folga));

    painel.style.left = `${Math.round(left)}px`;
    painel.style.top = `${Math.round(top)}px`;
  }

  private _alternarLuzDoPainel(entityId: string): void {
    if (!this._hass) return;
    feedback('tap');
    this._hass.callService('light', 'toggle', { entity_id: entityId }, { entity_id: entityId });
  }

  // ── Modelo ───────────────────────────────────────────────────────────────

  private _dots(): ResolvedDot[] {
    const hass = this._hass;
    const room = this._room;
    if (!hass || !room) return [];

    const active = room.activeSensor ? hass.states[room.activeSensor] : undefined;
    const aceso = (d: RoomDot): boolean => {
      const estados = (d.states ?? []).map((s) => s.toLowerCase());
      const porEntidade = (d.entities ?? []).some((id) => {
        if (d.offDelayMs && id.startsWith('media_player.')) {
          return isTvPoweredStable(hass, id, Date.now(), d.offDelayMs);
        }
        const e = hass.states[id];
        return Boolean(e) && estados.includes(String(e?.state ?? '').toLowerCase());
      });
      const porAtributo = d.activeAttr ? truthy(active?.attributes[d.activeAttr]) : false;
      // O ponto de mídia também acende pelo Spotify: quando a música toca no
      // Echo por Spotify Connect, a entidade do Echo continua em standby e só
      // a do Spotify vai para `playing`. Sem esta segunda via o ponto ficava
      // apagado exatamente no cômodo onde a música estava tocando.
      const porSpotify = d.spotifyDevice
        ? spotifyTocandoEm(hass.states[SPOTIFY_ENTITY], d.spotifyDevice)
        : false;
      return porEntidade || porAtributo || porSpotify;
    };

    return (room.statusDots ?? [])
      .filter(aceso)
      .map((d) => ({ icon: d.icon, label: d.label, tone: d.tone }));
  }

  private _statusLines(): string[] {
    const hass = this._hass;
    const room = this._room;
    if (!hass || !room) return [];

    const lights = lightsSummary({
      hass,
      groupEntityId: room.entities.lightGroup,
      activeSensorId: room.activeSensor,
      fallbackLightIds: room.entities.lights,
    });
    // Só há linha semântica onde há sensor semântico. O atalho de ler a ocupação
    // crua nunca dispara em produção — todos os cards usam o sensor supervisionado
    // — e no Lavabo, que não tem nenhum, ele inventava um "Ocupado" que o card
    // real não mostra.
    const semantic = room.entities.semanticState
      ? semanticLine({
          hass,
          semanticSensorId: room.entities.semanticState,
          motionRecentId: room.entities.motionRecent,
          occupancyId: room.entities.occupancy,
        })
      : '';

    const linhas: string[] = [];
    if (lights.label) linhas.push(lights.label);
    else if (isRoomOn(hass, room.entities.lightGroup)) linhas.push('On');
    const aparelho = this._applianceLine();
    if (aparelho) linhas.push(aparelho);
    if (semantic) linhas.push(semantic);
    return linhas;
  }

  /** Linha do eletrodoméstico, no formato "Lavando / 12m". */
  private _applianceLine(): string {
    const hass = this._hass;
    const room = this._room;
    const cfg = room?.applianceLine;
    if (!hass || !room || !cfg) return '';

    const active = room.activeSensor ? hass.states[room.activeSensor] : undefined;
    const estados = (cfg.states ?? []).map((s) => s.toLowerCase());
    const entidade = cfg.entity ? hass.states[cfg.entity] : undefined;
    const ligado =
      (Boolean(entidade) && estados.includes(String(entidade?.state ?? '').toLowerCase())) ||
      (cfg.activeAttr ? truthy(active?.attributes[cfg.activeAttr]) : false);
    if (!ligado) return '';

    const decorrido = cfg.elapsedAttr ? String(active?.attributes[cfg.elapsedAttr] ?? '') : '';
    return decorrido ? `${cfg.label} / ${decorrido}` : cfg.label;
  }

  static override styles = css`
    :host {
      /*
       * CONTAINER DA ESCALA FLUIDA (Fase 6.2, correção de 2026-08-09).
       *
       * Sem isto, "cqi" não resolve neste componente e todo valor fluido vira
       * zero. A primeira passada da 6.2 alcançou só o CSS GERADO da subview;
       * este arquivo tem CSS escrito à mão e ficou de fora — os cartões
       * escalavam e os PNGs não, causando sobreposição.
       *
       * Referência da conversão: 218,75 px — a largura de UMA célula da faixa
       * de oito na calibragem: (1820 − 7 × 10 de gap) / 8.
       */
      container-type: inline-size;
      container-name: ladrilho;

      /* Raio e tokens locais — cópia dos cards atuais (docs/07). */
      --card-radius: var(--bruno-liquid-room-radius, var(--bruno-liquid-card-radius-compact, 16px));
      --accent: 150, 190, 255;
      --accent-blue: 96, 165, 250;
      --accent-purple: 167, 139, 250;
      --accent-cyan: 79, 172, 254;
      --accent-amber: 255, 153, 0;
      --text-main: rgba(245, 250, 255, 0.96);
      --text-soft: rgba(255, 255, 255, 0.4);
      --text-muted: rgba(255, 255, 255, 0.52);
      --dot-off-bg: rgba(255, 255, 255, 0.08);
      --dot-off-border: rgba(255, 255, 255, 0.12);
      --dot-off-icon: rgba(255, 255, 255, 0.35);

      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      margin: 0;
      padding: 0;
      contain: layout style;
    }

    * {
      box-sizing: border-box;
      letter-spacing: 0;
    }

    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }

    /* Cartão de vidro — estado padrão, fora do modo tile.
       Os literais sao FALLBACK: valem so se o tema nao tiver carregado.
       Nunca substituir os tokens por valores fixos (docs/07). */
    .room-card {
      position: relative;
      isolation: isolate;
      width: 100%;
      max-width: 100%;
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

    .room-card::before,
    .room-card::after {
      content: '';
      position: absolute;
      pointer-events: none;
      z-index: 0;
    }

    .room-card::before {
      inset: 1px;
      border-radius: calc(var(--card-radius) - 1px);
      background: var(
        --bruno-liquid-surface-off-sheen,
        radial-gradient(78px 62px at 19% 2%, rgba(255, 255, 255, 0.2), transparent 72%),
        radial-gradient(82px 92px at 94% 18%, rgba(var(--accent), 0.12), transparent 74%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0) 35%),
        linear-gradient(90deg, rgba(255, 255, 255, 0.085), rgba(255, 255, 255, 0) 48%)
      );
      opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
    }

    /* Filete inferior: nasce invisível e é o modo tile que o acende em âmbar
       quando o cômodo está aceso. Sem ele o tile ON perde a única marcação de
       estado que o Josh admite. */
    .room-card::after {
      inset: auto clamp(12.48px, 7.31cqi, 20.8px) clamp(6.24px, 3.66cqi, 10.4px) clamp(12.48px, 7.31cqi, 20.8px);
      height: 1px;
      border-radius: 999px;
      background: var(
        --bruno-liquid-surface-bottom-line,
        linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent)
      );
      opacity: var(--bruno-liquid-surface-bottom-line-opacity, 0);
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

    .room-card.is-room-on::before {
      background: var(
        --bruno-liquid-surface-on-sheen,
        radial-gradient(92px 74px at 17% 0%, rgba(255, 255, 255, 0.34), transparent 72%),
        radial-gradient(118px 110px at 96% 96%, rgba(120, 178, 245, 0.22), transparent 74%),
        radial-gradient(80px 58px at 27% 18%, rgba(255, 232, 126, 0.095), transparent 72%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 38%),
        linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 50%)
      );
      opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
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
      /* A coluna do ícone é minmax(0, 122px), não 122px fixos: a largura real do
         tile é ~183px e a coluna fixa estourava, clipando a coluna direita. */
      grid-template-columns: minmax(0, clamp(95.16px, 55.77cqi, 158.6px)) minmax(0, 1fr) clamp(31.2px, 18.29cqi, 52px);
      grid-template-rows: auto minmax(0, 1fr) auto auto;
      grid-template-areas:
        'icon space right'
        'icon space right'
        'title title right'
        'state state right';
      column-gap: clamp(4.68px, 2.74cqi, 7.8px);
      row-gap: 0;
      align-items: start;
      padding: clamp(10.92px, 6.4cqi, 18.2px) clamp(8.58px, 5.03cqi, 14.3px) clamp(10.14px, 5.94cqi, 16.9px) clamp(8.58px, 5.03cqi, 14.3px);
      margin: 0;
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: var(--card-radius);
      box-shadow: none;
      overflow: hidden;
      transition:
        transform var(--bruno-liquid-motion-fast, 160ms ease),
        filter var(--bruno-liquid-motion-fast, 160ms ease);
    }

    .room-action:hover {
      filter: brightness(1.05);
    }

    .room-action.is-pressed {
      transform: translateY(1px) scale(0.985);
    }

    .room-action.is-hold-fired {
      filter: drop-shadow(0 0 18px rgba(var(--accent), 0.28));
    }

    /* Medido no bruno-office-card renderizado, nao lido do config.
       A caixa do icone NAO e quadrada: largura fluida com teto de 122px e
       ALTURA FIXA de 82px. O valor "icon_size: 94" que aparece no config dos
       cards e fallback — o CSS o sobrescreve. Sem margens negativas. */
    .room-icon {
      grid-area: icon;
      justify-self: start;
      align-self: start;
      position: relative;
      width: 100%;
      max-width: clamp(95.16px, 55.77cqi, 158.6px);
      height: clamp(63.96px, 37.49cqi, 106.6px);
      margin-left: 0;
      margin-top: 1px;
    }

    .room-asset-wrap {
      position: absolute;
      inset: 0;
      display: block;
    }

    /* Assets V3: as fontes 1254x1254 sao normalizadas pelo pipeline para
       canvas 512x512, caixa visual de ~460px, centro X=256 e base Y=485. Esse
       envelope replica a geometria que este tile ja foi calibrado para usar;
       por isso escala e translacao abaixo permanecem deliberadamente iguais.

       A normalizacao e feita por PAR ON/OFF com a mesma transformacao, evitando
       salto de tamanho/posicao no crossfade. O WebP reduz transferencia sem
       aumentar o bitmap decodificado que o browser mantem em memoria. */
    .room-asset {
      position: absolute;
      top: 0;
      left: 0;
      height: 120%;
      width: auto;
      aspect-ratio: 1 / 1;
      object-fit: contain;
      object-position: left top;
      transform: translate(-8.66%, -7.81%);
      filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.22));
      transition: opacity 420ms ease, filter 420ms ease;
    }

    .room-asset-on {
      opacity: 0;
    }
    .room-card.is-room-on .room-asset-off {
      opacity: 0;
    }
    .room-card.is-room-on .room-asset-on {
      opacity: 1;
      filter: drop-shadow(0 6px 9px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 12px rgba(255, 187, 72, 0.14));
    }

    /* Zona de navegação: ocupa as duas primeiras colunas nas duas últimas
       linhas. O min-height de 56px NÃO é decorativo — é ele que fixa a altura
       das linhas do grid; sem ele o bloco de título assenta alguns pixels mais
       baixo que o dos cards vizinhos. */
    .room-nav-zone {
      grid-column: 1 / 3;
      grid-row: 3 / 5;
      justify-self: start;
      align-self: end;
      position: relative;
      z-index: 4;
      min-width: 0;
      width: 100%;
      min-height: clamp(43.68px, 25.6cqi, 72.8px);
      /* ANTERIOR: padding: 2px 24px 2px 0
         Os 24px eram respiro, não alvo de toque — a zona já ocupa duas colunas
         inteiras. Numa célula de 152px (a largura real no tablet) sobravam 44px
         para o título, e SEIS dos oito cômodos saíam cortados. 8px devolvem 16px
         ao texto sem encostar na coluna dos pontos, que é a terceira. */
      padding: 2px clamp(6.24px, 3.66cqi, 10.4px) 2px 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      outline: none;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .room-title-row {
      display: flex;
      align-items: center;
      /* ANTERIOR: gap: 8px — mais 4px para o título, pela mesma razão do padding
         da zona de navegação acima. O chevron continua legível colado. */
      gap: clamp(3.12px, 1.83cqi, 5.2px);
      min-width: 0;
    }

    .title {
      display: block;
      min-width: 0;
      margin: 0 0 2px 0;
      font-size: clamp(11.7px, 6.86cqi, 19.5px);
      line-height: 1.18;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Só em cômodo COM subview. Onde não há, o chevron seria promessa falsa. */
    .room-chevron {
      flex: 0 0 auto;
      font-size: clamp(17.94px, 10.51cqi, 29.9px);
      line-height: 1;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.56);
      transform: translateY(-1px);
      transition:
        color var(--bruno-liquid-motion-fast, 140ms ease),
        transform var(--bruno-liquid-motion-fast, 140ms ease),
        filter var(--bruno-liquid-motion-fast, 140ms ease);
    }

    .room-nav-zone.is-pressed .title,
    .room-nav-zone.is-pressed .status-lines {
      filter: brightness(1.13);
    }

    .room-nav-zone.is-pressed .room-chevron {
      color: rgba(255, 255, 255, 0.96);
      transform: translate(2px, -1px);
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.26));
    }

    .room-nav-zone.is-hold-fired .room-chevron {
      color: rgba(255, 214, 150, 0.98);
      filter: drop-shadow(0 0 10px rgba(255, 190, 90, 0.34));
    }

    .room-nav-zone.is-navigating .room-chevron {
      animation: brunoRoomChevronNavigate 360ms ease both;
    }

    @keyframes brunoRoomChevronNavigate {
      0% {
        transform: translate(0, -1px);
      }
      52% {
        transform: translate(5px, -1px);
      }
      100% {
        transform: translate(2px, -1px);
      }
    }

    .status-lines {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      font-size: clamp(8.58px, 5.03cqi, 14.3px);
      line-height: 1.16;
      font-weight: 500;
      color: var(--text-soft);
      white-space: normal;
      overflow: hidden;
    }

    .status-lines span {
      display: block;
      max-width: clamp(106.08px, 62.17cqi, 176.8px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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
      gap: clamp(5.46px, 3.2cqi, 9.1px);
      transform: translate(5px, -3px);
    }

    /* Medido no bruno-office-card, que É um card COM temperatura.
       36px de largura com texto centralizado deixa o dot de 26px centrado,
       sobrando 5px de cada lado — e o que alinha a metrica com os dots.

       NAO copiar do bruno-corredor-card: aquele comodo nao tem sensor de
       temperatura, a metrica nunca renderiza, e os valores de la (48px,
       text-align: left, margin-left 6px) sao codigo morto. */
    .metric {
      min-width: clamp(28.08px, 16.46cqi, 46.8px);
      text-align: center;
      line-height: 1.1;
    }
    .metric-value {
      display: block;
      font-size: clamp(10.14px, 5.94cqi, 16.9px);
      line-height: 1;
      font-weight: 760;
      color: var(--text-main);
    }
    .metric-sub {
      display: block;
      margin-top: clamp(3.12px, 1.83cqi, 5.2px);
      font-size: clamp(8.58px, 5.03cqi, 14.3px);
      line-height: 1;
      font-weight: 600;
      color: var(--text-muted);
    }

    .status-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(3.12px, 1.83cqi, 5.2px);
    }

    /* Receita VIGENTE dos cards: círculo com fundo tonal em gradiente, borda
       clara e glifo branco. Existem três recitas anteriores comentadas dentro
       do card real, todas rejeitadas — não copiar de lá. */
    .status-dot {
      width: clamp(20.28px, 11.89cqi, 33.8px);
      height: clamp(20.28px, 11.89cqi, 33.8px);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      position: relative;
      color: #ffffff;
      background:
        radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.3), transparent 62%),
        linear-gradient(180deg, rgba(var(--tone), 0.68), rgba(var(--tone), 0.4));
      border: 1px solid rgba(255, 255, 255, 0.38);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.32),
        0 0 12px rgba(var(--tone), 0.32);
    }

    .tone-blue {
      --tone: var(--accent-blue);
    }
    .tone-purple {
      --tone: var(--accent-purple);
    }
    .tone-cyan {
      --tone: var(--accent-cyan);
    }
    .tone-amber {
      --tone: var(--accent-amber);
    }

    /* O bruno-icon nao tem tamanho proprio: sem estas regras ele renderiza
       colapsado e o dot fica com um glifo ilegivel. */
    .status-dot bruno-icon {
      --mdc-icon-size: 14px;
      width: clamp(10.92px, 6.4cqi, 18.2px);
      height: clamp(10.92px, 6.4cqi, 18.2px);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.28));
    }

    /* ==== MODO TILE (tema Josh + variant: tile) =========================
       O tile não tem moldura própria: quem desenha o fundo é a faixa que o
       hospeda. ON e OFF compartilham a MESMA regra de superfície — não existe
       fundo esbranquiçado no estado aceso; o estado aparece no filete âmbar da
       base e no brilho difuso sob o título.
       INVARIANTE: o tile perde o backdrop-filter aqui, e é isso que autoriza a
       FAIXA a ter blur. Se o tile voltar a filtrar, o blur da faixa sai no mesmo
       commit — senão volta borrão sobre borrão.
       ==================================================================== */
    .room-card.is-tile,
    .room-card.is-tile.is-room-on {
      background: var(--bruno-tile-background, none);
      border: var(--bruno-tile-border, 0);
      border-radius: var(--bruno-tile-radius, 0);
      box-shadow: var(--bruno-tile-shadow, none);
      backdrop-filter: var(--bruno-tile-filter, none);
      -webkit-backdrop-filter: var(--bruno-tile-filter, none);
    }

    .room-card.is-tile::before,
    .room-card.is-tile.is-room-on::before {
      opacity: var(--bruno-tile-sheen-opacity, 0);
    }

    /* Josh ON tablet/desktop: continua TILE, sem cartela e sem veil.
       O wash foi reprovado na validacao fisica de 2026-08-22 porque ainda
       desenhava um retangulo perceptivel. O feedback ON fica no PNG, texto,
       filete quente e glow inferior. */
    .room-card.is-tile.is-room-on {
      --text-main: rgba(255, 252, 245, 0.99);
      --text-soft: rgba(255, 245, 226, 0.72);
      --text-muted: rgba(255, 247, 232, 0.76);
      --bruno-tile-on-line: linear-gradient(
        90deg,
        rgba(255, 194, 104, 0) 0%,
        rgba(255, 202, 122, 0.92) 50%,
        rgba(255, 194, 104, 0) 100%
      );
      --bruno-tile-on-glow: radial-gradient(
        82px 38px at 50% 100%,
        rgba(255, 194, 102, 0.22),
        rgba(255, 216, 156, 0.07) 48%,
        transparent 76%
      );
    }

    .room-card.is-tile.is-room-on::before {
      inset: 0;
      border-radius: 0;
      background: none;
      opacity: 0;
    }

    .room-card.is-tile.is-room-on::after {
      inset: auto clamp(10.92px, 6.4cqi, 18.2px) 0 clamp(10.92px, 6.4cqi, 18.2px);
      opacity: 1;
      background: var(
        --bruno-tile-on-line,
        linear-gradient(90deg, rgba(255, 187, 72, 0) 0%, rgba(255, 187, 72, 0.42) 50%, rgba(255, 187, 72, 0) 100%)
      );
      box-shadow: 0 -2px 14px rgba(255, 194, 102, 0.24);
    }

    .room-card.is-tile .room-action {
      position: relative;
    }

    .room-card.is-tile.is-room-on .room-action::after {
      content: '';
      position: absolute;
      left: clamp(6.24px, 3.66cqi, 10.4px);
      right: clamp(6.24px, 3.66cqi, 10.4px);
      bottom: 0;
      height: clamp(35.88px, 21.03cqi, 59.8px);
      z-index: 0;
      pointer-events: none;
      background: var(
        --bruno-tile-on-glow,
        radial-gradient(60px 30px at 50% 100%, rgba(255, 187, 72, 0.1), transparent 72%)
      );
    }

    /* Filete vertical no lugar do gap (o gap vira 0 via --bruno-tile-gap). */
    .room-card.is-tile.has-divider .tile-divider {
      position: absolute;
      left: 0;
      top: clamp(6.24px, 3.66cqi, 10.4px);
      bottom: clamp(6.24px, 3.66cqi, 10.4px);
      width: 1px;
      z-index: 2;
      pointer-events: none;
      background: var(
        --bruno-tile-divider,
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.19) 22%,
          rgba(255, 255, 255, 0.19) 78%,
          rgba(255, 255, 255, 0) 100%
        )
      );
    }

    /* Josh: material flat dos dots. Os tiles do tablet ja usavam; o cartao
       do telefone caia no vidro compartilhado com os outros temas. Mesma
       regra, sem variante nova. */
    .room-card.is-tile .status-dot,
    .room-card.is-josh-phone-card .status-dot {
      background: rgba(var(--tone), var(--bruno-tile-status-dot-fill-alpha, 0.78));
      border: var(--bruno-tile-status-dot-border, 0);
      box-shadow: 0 0 var(--bruno-tile-status-dot-halo-size, 8px)
        rgba(var(--tone), var(--bruno-tile-status-dot-halo-alpha, 0.18));
    }

    /* ==== BREAKPOINTS DOS CARDS ATUAIS ==================================
       Não são enfeite: sem eles o tile fica com o ícone 10px mais alto e 2px
       mais de padding que os vizinhos em telas baixas — e foi assim que a
       primeira comparação lado a lado saiu desalinhada. A compensação da
       maquete V2 é proporcional (111% da altura da caixa), então acompanha os
       três tamanhos sozinha.
       ==================================================================== */
    @media (max-height: 760px) {
      .room-action {
        padding: clamp(9.36px, 5.49cqi, 15.6px) clamp(8.58px, 5.03cqi, 14.3px) clamp(9.36px, 5.49cqi, 15.6px) clamp(8.58px, 5.03cqi, 14.3px);
      }
      .room-icon {
        width: 100%;
        max-width: clamp(84.24px, 49.37cqi, 140.4px);
        height: clamp(56.16px, 32.91cqi, 93.6px);
      }
    }

    /* Tablet somente: mantém os mesmos clamps e a mesma resposta ao container,
       elevando em ~6% a escala-base que ficou pequena depois da fluidização. */
    @media (min-width: 801px) {
      .room-icon {
        max-width: clamp(100.87px, 59.12cqi, 168.12px);
        height: clamp(67.8px, 39.74cqi, 113px);
      }
      /* ITEM 5 (2026-08-22): mesma proporcao do telefone. Na celula de
         referencia (218,75px) a caixa mede ~87px: 120% = 104,4px ->
         126% = 109,6px (+5,2px). Cresce so o desenho, nao a caixa. */
      .room-asset {
        height: 126%;
      }
      .metric-value {
        font-size: clamp(10.75px, 6.3cqi, 17.91px);
      }
      .metric-sub {
        font-size: clamp(9.09px, 5.33cqi, 15.16px);
      }
      .status-dot {
        width: clamp(21.5px, 12.6cqi, 35.83px);
        height: clamp(21.5px, 12.6cqi, 35.83px);
      }
      .status-dot bruno-icon {
        width: clamp(11.58px, 6.78cqi, 19.29px);
        height: clamp(11.58px, 6.78cqi, 19.29px);
      }
    }

    @media (min-width: 801px) and (max-height: 760px) {
      .room-icon {
        max-width: clamp(89.29px, 52.33cqi, 148.82px);
        height: clamp(59.53px, 34.88cqi, 99.22px);
      }
    }

    @media (max-width: 800px) {
      .room-card.is-josh-phone-card {
        border-radius: var(--bruno-liquid-card-radius, 22px);
        background:
          radial-gradient(150px 118px at 14% -8%, rgba(255, 255, 255, 0.12), transparent 72%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.075), rgba(255, 255, 255, 0.025) 46%, rgba(0, 0, 0, 0.045)),
          rgba(13, 14, 17, 0.34);
        border: 1px solid rgba(255, 255, 255, 0.135);
        /* ANTERIOR (rollback item 2 - 2026-08-22):
             inset 0 1px 0 rgba(255,255,255,0.13), 0 10px 26px rgba(0,0,0,0.19)
           A borda luminosa parcial dos cards de Favoritos vem do box-shadow
           inset do token de card do tema: 0.40 no topo/esquerda e 0.10 na
           base/direita — por isso ela nao percorre o perimetro inteiro. Aqui
           havia um inset unico de 0.13 so no topo. */
        box-shadow:
          var(
            --bruno-liquid-card-shadow,
            inset 0.5px 0.5px 1px 0 rgba(255, 255, 255, 0.4),
            inset -0.5px -0.5px 1px 0 rgba(255, 255, 255, 0.1)
          ),
          0 10px 26px rgba(0, 0, 0, 0.19);
        backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.10);
        -webkit-backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.10);
      }
      .room-card.is-josh-phone-card::before {
        background:
          linear-gradient(180deg, rgba(255, 255, 255, 0.085), transparent 36%),
          linear-gradient(90deg, rgba(255, 255, 255, 0.035), transparent 52%);
        opacity: 0.72;
      }
      .room-card.is-josh-phone-card.is-room-on {
        --text-main: rgba(248, 251, 255, 0.96);
        --text-soft: rgba(255, 255, 255, 0.52);
        --text-muted: rgba(255, 255, 255, 0.62);
        background: var(--bruno-josh-room-on-background);
        border-color: var(--bruno-josh-room-on-border-color);
        box-shadow: var(--bruno-josh-room-on-shadow);
        backdrop-filter: var(--bruno-josh-room-on-filter);
        -webkit-backdrop-filter: var(--bruno-josh-room-on-filter);
      }
      .room-card.is-josh-phone-card.is-room-on::before {
        background: var(--bruno-josh-room-on-sheen);
        opacity: var(--bruno-josh-room-on-sheen-opacity);
      }
      .room-card.is-josh-phone-card .room-action {
        border-radius: inherit;
      }
      .room-action {
        padding: clamp(8.58px, 5.03cqi, 14.3px) clamp(9.36px, 5.49cqi, 15.6px) clamp(7.8px, 4.57cqi, 13px) clamp(7.8px, 4.57cqi, 13px);
      }
      .room-icon {
        max-width: 100px;
        height: 62px;
      }
      .room-asset {
        /* ANTERIOR (rollback item 5 - 2026-08-22): 127.5% */
        /* 62px de caixa: 127,5% = 79,1px -> 135,5% = 84,0px (+4,9px). A
           caixa NAO muda, entao nada no grid do cartao se desloca. */
        height: 135.5%;
      }
    }

    /* ==== PAINEL PRÓPRIO (cômodo sem subview) ==========================
       Transcrito do dialog do bruno-lavabo-card. O elemento é <dialog> com
       showModal(): renderiza na top layer do navegador, acima de tudo e imune ao
       overflow hidden e aos transform dos ancestrais — que era o motivo de o
       painel antigo, com position fixed, sair cortado dentro da shell.
       ==================================================================== */
    .room-popup {
      margin: 0;
      padding: 0;
      border: 0;
      inset: 0;
      width: 100vw;
      max-width: 100vw;
      height: 100vh;
      max-height: 100vh;
      background: transparent;
      color: inherit;
      overflow: visible;
    }

    .room-popup[open] {
      display: block;
    }
    .room-popup:not([open]) {
      display: none;
    }

    .room-popup::backdrop {
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(3px) saturate(1.04);
      -webkit-backdrop-filter: blur(3px) saturate(1.04);
    }

    /* O painel é fixed e recebe top/left inline: quem o ancora ao tile é o JS. */
    .room-popup-panel {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1;
      width: min(clamp(405.6px, 237.71cqi, 676px), calc(100vw - clamp(40.56px, 23.77cqi, 67.6px)));
      border-radius: var(--bruno-liquid-panel-radius, 18px);
      border: var(--bruno-liquid-popup-border, 1px solid rgba(255, 255, 255, 0.16));
      color: rgba(255, 255, 255, 0.94);
      background: var(
        --bruno-liquid-popup-background,
        linear-gradient(180deg, rgba(44, 33, 26, 0.8), rgba(16, 14, 14, 0.82)),
        rgba(20, 18, 18, 0.8)
      );
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.16),
        0 24px 64px rgba(0, 0, 0, 0.42);
      backdrop-filter: var(--bruno-liquid-popup-filter, blur(28px) saturate(1.42));
      -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(28px) saturate(1.42));
      overflow: hidden;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel {
      border: var(--bruno-josh-popup-border, var(--bruno-liquid-popup-border));
      background: var(--bruno-josh-popup-background, var(--bruno-liquid-popup-background));
      box-shadow: var(--bruno-josh-popup-shadow, var(--bruno-liquid-popup-shadow));
      backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
      -webkit-backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
      isolation: isolate;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel::before {
      content: '';
      position: absolute;
      inset: 1px;
      z-index: 0;
      border-radius: inherit;
      background: var(--bruno-josh-popup-sheen, none);
      opacity: var(--bruno-josh-popup-sheen-opacity, 0.13);
      pointer-events: none;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 2;
      padding: 1px;
      border-radius: inherit;
      background: var(--bruno-josh-popup-edge-glow, none);
      opacity: var(--bruno-josh-popup-edge-opacity, 0.7);
      pointer-events: none;
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel > * {
      position: relative;
      z-index: 1;
    }

    .room-popup-header {
      height: clamp(40.56px, 23.77cqi, 67.6px);
      padding: clamp(7.8px, 4.57cqi, 13px) clamp(9.36px, 5.49cqi, 15.6px) clamp(6.24px, 3.66cqi, 10.4px) clamp(10.92px, 6.4cqi, 18.2px);
      display: flex;
      align-items: center;
      gap: clamp(7.8px, 4.57cqi, 13px);
    }

    .room-popup-icon {
      width: clamp(23.4px, 13.71cqi, 39px);
      height: clamp(23.4px, 13.71cqi, 39px);
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: rgb(255, 195, 83);
      background: rgba(255, 185, 70, 0.13);
      border: 1px solid rgba(255, 190, 80, 0.35);
    }

    .room-popup-icon bruno-icon {
      --mdc-icon-size: 16px;
    }

    .room-popup-title {
      flex: 1 1 auto;
      min-width: 0;
      display: grid;
      gap: 2px;
    }

    .room-popup-title strong {
      font-size: clamp(10.92px, 6.4cqi, 18.2px);
      line-height: 1;
      font-weight: 800;
    }

    .room-popup-title span {
      font-size: clamp(7.8px, 4.57cqi, 13px);
      line-height: 1;
      font-weight: 650;
      color: rgba(255, 255, 255, 0.52);
    }

    .room-popup-close {
      appearance: none;
      width: clamp(23.4px, 13.71cqi, 39px);
      height: clamp(23.4px, 13.71cqi, 39px);
      display: grid;
      place-items: center;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: rgba(255, 255, 255, 0.72);
      background: rgba(255, 255, 255, 0.08);
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-close {
      border: var(--bruno-liquid-control-border, 1px solid rgba(255, 255, 255, 0.14));
      background: var(--bruno-liquid-control-background, rgba(255, 255, 255, 0.08));
      box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.12));
      backdrop-filter: var(--bruno-liquid-control-filter, none);
      -webkit-backdrop-filter: var(--bruno-liquid-control-filter, none);
    }

    .room-popup-banner {
      position: relative;
      height: clamp(99.84px, 58.51cqi, 166.4px);
      margin: 0 clamp(9.36px, 5.49cqi, 15.6px) clamp(9.36px, 5.49cqi, 15.6px);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      overflow: hidden;
      background:
        radial-gradient(140px 80px at 20% 14%, rgba(255, 219, 155, 0.2), transparent 70%),
        linear-gradient(135deg, rgba(86, 62, 44, 0.7), rgba(20, 17, 16, 0.86));
    }

    .room-popup-banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: brightness(0.86) saturate(1.04);
    }

    /* Escurece o perímetro da foto para fundir com o painel. */
    .room-popup-banner-shade {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, rgba(12, 9, 7, 0.72) 0%, rgba(12, 9, 7, 0.28) 7%, transparent 18%),
        linear-gradient(270deg, rgba(12, 9, 7, 0.72) 0%, rgba(12, 9, 7, 0.28) 7%, transparent 18%),
        linear-gradient(0deg, rgba(12, 9, 7, 0.78) 0%, rgba(12, 9, 7, 0.3) 8%, transparent 22%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(12, 9, 7, 0.34) 6%, transparent 20%);
    }

    .room-popup-lights {
      padding: 0 clamp(9.36px, 5.49cqi, 15.6px) clamp(10.92px, 6.4cqi, 18.2px);
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: clamp(6.24px, 3.66cqi, 10.4px);
    }

    .room-popup-light {
      appearance: none;
      min-width: 0;
      min-height: clamp(57.72px, 33.83cqi, 96.2px);
      padding: clamp(7.8px, 4.57cqi, 13px) clamp(7.02px, 4.11cqi, 11.7px);
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: clamp(7.02px, 4.11cqi, 11.7px);
      text-align: left;
      border-radius: var(--bruno-liquid-control-radius, 11px);
      border: var(--bruno-liquid-control-border, 1px solid rgba(255, 255, 255, 0.14));
      color: rgba(255, 255, 255, 0.88);
      background: var(--bruno-liquid-control-background, rgba(255, 255, 255, 0.075));
      box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.12));
      backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(1.08));
      -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(1.08));
    }

    .room-popup-light.is-on {
      color: rgba(255, 246, 225, 0.98);
      border-color: rgba(255, 195, 80, 0.38);
      background:
        radial-gradient(80px 48px at 18% 12%, rgba(255, 203, 95, 0.22), transparent 70%),
        rgba(255, 255, 255, 0.09);
    }

    .room-popup-light.is-unavailable {
      opacity: 0.58;
    }

    .room-popup-light-icon {
      width: clamp(23.4px, 13.71cqi, 39px);
      height: clamp(23.4px, 13.71cqi, 39px);
      display: grid;
      place-items: center;
      color: rgb(255, 197, 92);
    }

    .room-popup-light-icon bruno-icon {
      --mdc-icon-size: 24px;
    }

    .room-popup-light-copy {
      min-width: 0;
      display: grid;
      gap: clamp(3.12px, 1.83cqi, 5.2px);
    }

    .room-popup-light-copy strong,
    .room-popup-light-copy span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .room-popup-light-copy strong {
      font-size: clamp(9.36px, 5.49cqi, 15.6px);
      line-height: 1;
      font-weight: 800;
    }

    .room-popup-light-copy span {
      font-size: clamp(7.8px, 4.57cqi, 13px);
      line-height: 1;
      font-weight: 650;
      color: rgba(255, 255, 255, 0.56);
    }

    @media (prefers-reduced-motion: reduce) {
      .room-action,
      .room-asset,
      .room-chevron {
        transition: none;
      }
      .room-nav-zone.is-navigating .room-chevron {
        animation: none;
      }
    }
  `;

  override render() {
    const room = this._room;
    const hass = this._hass;
    if (!room) return nothing;

    const on = hass ? isRoomOn(hass, room.entities.lightGroup ?? room.entities.lights?.[0]) : false;
    // Valor bruto do sensor, sem arredondar: o card real mostra "29.1°", e
    // arredondar deixava este tile com "29°" ao lado dos vizinhos.
    const temp = hass ? sensorDisplay(hass, room.entities.temperature, '°') : '--';
    const hum = hass ? sensorDisplay(hass, room.entities.humidity, '%') : '--';
    // Cômodo SEM sensor de clima não reserva o espaço da métrica — os pontos
    // sobem e a coluna encolhe para a largura do próprio ponto. Os cards atuais
    // divergem aqui: o Corredor encolhe, o Lavabo deixa um bloco vazio de 28px.
    // `--` continua valendo para sensor declarado que está indisponível.
    const temMetrica = Boolean(room.entities.temperature ?? room.entities.humidity);
    const lines = this._statusLines();
    const dots = this._dots();

    // Caminho explicito da configuracao, nao montado por convencao: o Q. Casal
    // usa "-generated-v3" e existe um "-tight" orfao com outra dimensao, que a
    // convencao carregava por engano.
    // ANTERIOR (rollback): '20260803-normalized-2'
    //
    // Maquetes premium de 2026-08-08. A família inteira foi regerada com a Sala
    // como âncora de câmera, lente, plataforma e direção de luz — e desta vez
    // com caixa óptica IDÊNTICA nos 16 (460x452 em +26+34, centro X 256, último
    // Y 485). Os pares ON/OFF têm máscara alfa igual pixel a pixel, então a
    // troca de estado não desloca nem redimensiona nada.
    //
    // Os arquivos anteriores estão em _archive/assets/v2-anterior-20260808/.
    // WebP preserva a mesma caixa óptica dos PNGs, com payload drasticamente menor.
    // Ambos os estados são carregados já no tile: nada de aparição progressiva em idle.
    const v = '20260821-v3-webp-2';
    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}?v=${v}` : '';
    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}?v=${v}` : '';

    const cardClasses = [
      'room-card',
      on ? 'is-room-on' : '',
      this._phoneJoshCard ? 'is-josh-phone-card' : '',
      this._tileMode ? 'is-tile' : '',
      this._tileMode && this._config?.divider_left ? 'has-divider' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const nome = this._config?.name ?? room.name;
    // O chevron promete uma segunda tela. Onde não há nem subview nem painel
    // próprio, ele não aparece — seria promessa falsa (é o caso do Corredor).
    const temNav = Boolean(room.section ?? room.popup);
    const painel = room.popup;
    const painelTema =
      (globalThis as { BrunoThemeManager?: { current?: () => string } }).BrunoThemeManager?.current?.() ===
      'josh'
        ? 'josh'
        : 'default';

    return html`
      <div class=${cardClasses}>
        ${this._tileMode && this._config?.divider_left
          ? html`<span class="tile-divider" aria-hidden="true"></span>`
          : nothing}
        <button
          class="room-action"
          type="button"
          aria-label=${nome}
          @pointerdown=${(e: PointerEvent) => this._onDown('room', e)}
          @pointermove=${(e: PointerEvent) => this._onMove('room', e)}
          @pointerup=${(e: PointerEvent) => this._onUp('room', e)}
          @pointercancel=${(e: PointerEvent) => this._onCancel('room', e)}
          @pointerleave=${() => this._resetGesture('room')}
          @keydown=${(e: KeyboardEvent) => this._onKey('room', e)}
          @click=${(e: Event) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          @dblclick=${(e: Event) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <div class="room-icon" aria-hidden="true">
            <span class="room-asset-wrap">
              ${off
                ? html`<img class="room-asset room-asset-off" src=${off} alt="" width="512" height="512" loading="eager" decoding="async" fetchpriority=${on ? 'low' : 'high'} />`
                : nothing}
              ${onImg
                ? html`<img class="room-asset room-asset-on" src=${onImg} alt="" width="512" height="512" loading="eager" decoding="async" fetchpriority=${on ? 'high' : 'low'} />`
                : nothing}
            </span>
          </div>

          <span
            class="room-nav-zone"
            role=${temNav ? 'button' : 'presentation'}
            tabindex=${temNav ? 0 : -1}
            aria-label=${temNav ? `Abrir ${nome}` : nome}
            @pointerdown=${(e: PointerEvent) => temNav && this._onDown('nav', e)}
            @pointermove=${(e: PointerEvent) => temNav && this._onMove('nav', e)}
            @pointerup=${(e: PointerEvent) => temNav && this._onUp('nav', e)}
            @pointercancel=${(e: PointerEvent) => temNav && this._onCancel('nav', e)}
            @pointerleave=${() => temNav && this._resetGesture('nav')}
            @keydown=${(e: KeyboardEvent) => temNav && this._onKey('nav', e)}
          >
            <span class="room-title-row">
              <span class="title">${nome}</span>
              ${temNav ? html`<span class="room-chevron" aria-hidden="true">›</span>` : nothing}
            </span>
            <span class="status-lines">${lines.map((l) => html`<span>${l}</span>`)}</span>
          </span>

          <div class="right-rail" aria-label="Status do ambiente">
            ${temMetrica
              ? html`<div class="metric" aria-label="Temperatura e umidade">
                  <span class="metric-value">${temp}</span>
                  <span class="metric-sub">${hum}</span>
                </div>`
              : nothing}
            <div class="status-stack">
              ${dots.map(
                (d) => html`<span class="status-dot tone-${d.tone}" title=${d.label} aria-label=${d.label}>
                  <bruno-icon icon=${d.icon}></bruno-icon>
                </span>`,
              )}
            </div>
          </div>
        </button>
        ${painel
          ? html`<dialog
              class="room-popup"
              data-bruno-popup-theme=${painelTema}
              aria-label=${painel.title}
              @click=${(ev: MouseEvent) => {
                // Clique no próprio dialog é clique FORA do painel: o painel é
                // filho e para a propagação dos seus próprios cliques.
                if (ev.target === ev.currentTarget) this._fecharPainel();
              }}
            >
              <section class="room-popup-panel" role="document" @click=${(e: Event) => e.stopPropagation()}>
                <header class="room-popup-header">
                  <span class="room-popup-icon" aria-hidden="true">
                    <bruno-icon icon=${painel.icon}></bruno-icon>
                  </span>
                  <div class="room-popup-title">
                    <strong>${painel.title}</strong>
                    ${painel.subtitle ? html`<span>${painel.subtitle}</span>` : nothing}
                  </div>
                  <button
                    class="room-popup-close"
                    type="button"
                    aria-label="Fechar"
                    @click=${this._fecharPainel}
                  >
                    ×
                  </button>
                </header>
                ${painel.banner || painel.bannerOn
                  ? html`<div class="room-popup-banner">
                      <img
                        src=${(on ? painel.bannerOn ?? painel.banner : painel.banner ?? painel.bannerOn) ?? ''}
                        alt=""
                        loading="eager"
                        decoding="async"
                      />
                      <div class="room-popup-banner-shade" aria-hidden="true"></div>
                    </div>`
                  : nothing}
                <div class="room-popup-lights">
                  ${painel.lights.map((luz) => {
                    const e = hass?.states[luz.entity];
                    const estado = String(e?.state ?? '').toLowerCase();
                    const acesa = estado === 'on';
                    const indisponivel = !e || ['unavailable', 'unknown', 'none', ''].includes(estado);
                    const classes = [
                      'room-popup-light',
                      acesa ? 'is-on' : '',
                      indisponivel ? 'is-unavailable' : '',
                    ]
                      .filter(Boolean)
                      .join(' ');
                    return html`<button
                      class=${classes}
                      type="button"
                      aria-label=${luz.name}
                      @click=${() => this._alternarLuzDoPainel(luz.entity)}
                    >
                      <span class="room-popup-light-icon" aria-hidden="true">
                        <bruno-icon icon=${luz.icon ?? 'mdi:lightbulb-outline'}></bruno-icon>
                      </span>
                      <span class="room-popup-light-copy">
                        <strong>${luz.name}</strong>
                        <span>${indisponivel ? 'Indisponivel' : acesa ? 'Ligada' : 'Desligada'}</span>
                      </span>
                    </button>`;
                  })}
                </div>
              </section>
            </dialog>`
          : nothing}
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
