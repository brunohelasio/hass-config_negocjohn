import { LitElement, html, css, nothing } from 'lit';
import type { Hass } from '@/models/home-assistant';
import { ROOMS, type RoomConfig, type RoomDot } from '@/config/rooms.config';
import { lightsSummary, semanticLine, isRoomOn, sensorDisplay } from '@/services/entities/room-state';

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
  static override properties = {
    _hass: { state: true },
  };

  private _config?: TileConfig;
  private _room?: RoomConfig;
  private _hass?: Hass;
  private _lastAction = 0;
  private _signature = '';

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
    const room = this._room;
    const e = room?.entities;
    if (!e) return [];
    const dotIds = (room?.statusDots ?? []).flatMap((d) => d.entities ?? []);
    return [
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

  private _buildSignature(hass: Hass): string {
    return this._watched()
      .map((id) => {
        const s = hass.states[id];
        return s ? `${id}=${s.state}@${s.last_changed}` : `${id}=∅`;
      })
      .join('|');
  }

  private _onThemeChanged = (): void => {
    this._tileModeCache = undefined;
    this.requestUpdate();
  };

  override connectedCallback(): void {
    super.connectedCallback();
    // O primeiro update do Lit acontece no attach, ANTES de o Home Assistant
    // chamar setConfig. Ali getComputedStyle ainda não vê os tokens do tema e
    // `variant` ainda não existe — por isso o cache é invalidado aqui e o valor
    // é recalculado no render, não guardado de uma leitura única.
    this._tileModeCache = undefined;
    globalThis.addEventListener?.('bruno-theme-changed', this._onThemeChanged);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
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

  private get _tileMode(): boolean {
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

  /** A shell escuta `ll-custom` e troca a seção; não há mudança de URL. */
  private _openSubview(): void {
    const section = this._room?.section;
    if (!section) return;
    feedback('tap');
    this.dispatchEvent(
      new CustomEvent('ll-custom', {
        detail: { action: 'fire-dom-event', bruno_section: section },
        bubbles: true,
        composed: true,
      }),
    );
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
        const e = hass.states[id];
        return Boolean(e) && estados.includes(String(e?.state ?? '').toLowerCase());
      });
      const porAtributo = d.activeAttr ? truthy(active?.attributes[d.activeAttr]) : false;
      return porEntidade || porAtributo;
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
      inset: auto 16px 8px 16px;
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
      grid-template-columns: minmax(0, 122px) minmax(0, 1fr) 40px;
      grid-template-rows: auto minmax(0, 1fr) auto auto;
      grid-template-areas:
        'icon space right'
        'icon space right'
        'title title right'
        'state state right';
      column-gap: 6px;
      row-gap: 0;
      align-items: start;
      padding: 14px 11px 13px 11px;
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
      max-width: 122px;
      height: 82px;
      margin-left: 0;
      margin-top: 1px;
    }

    .room-asset-wrap {
      position: absolute;
      inset: 0;
      display: block;
    }

    /* Assets V2: maquetes numa tela QUADRADA de 512x512 com cerca de 5% de
       margem transparente em volta. Os cards atuais usam PNGs "tight", em que o
       desenho encosta na borda do arquivo — por isso a mesma regra de CSS
       produz alturas diferentes nos dois.

       Estes tres valores existem para o CONTEUDO OPACO cair onde cai o do card
       real: altura de 81,7px e topo 2,3px acima da caixa do icone, que e o que
       alinha o desenho com a temperatura na coluna da direita. Medido com a
       caixa alfa de cada arquivo, nao calibrado no olho. A margem varia de 24 a
       32px entre os oito arquivos, o que deixa 1,2px de dispersao residual. */
    .room-asset {
      position: absolute;
      top: 0;
      left: 0;
      height: 111%;
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
      min-height: 56px;
      padding: 2px 24px 2px 0;
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
      gap: 8px;
      min-width: 0;
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

    /* Só em cômodo COM subview. Onde não há, o chevron seria promessa falsa. */
    .room-chevron {
      flex: 0 0 auto;
      font-size: 23px;
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
      font-size: 11px;
      line-height: 1.16;
      font-weight: 500;
      color: var(--text-soft);
      white-space: normal;
      overflow: hidden;
    }

    .status-lines span {
      display: block;
      max-width: 136px;
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
      gap: 7px;
      transform: translate(5px, -3px);
    }

    /* Medido no bruno-office-card, que É um card COM temperatura.
       36px de largura com texto centralizado deixa o dot de 26px centrado,
       sobrando 5px de cada lado — e o que alinha a metrica com os dots.

       NAO copiar do bruno-corredor-card: aquele comodo nao tem sensor de
       temperatura, a metrica nunca renderiza, e os valores de la (48px,
       text-align: left, margin-left 6px) sao codigo morto. */
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
      align-items: center;
      gap: 4px;
    }

    /* Receita VIGENTE dos cards: círculo com fundo tonal em gradiente, borda
       clara e glifo branco. Existem três recitas anteriores comentadas dentro
       do card real, todas rejeitadas — não copiar de lá. */
    .status-dot {
      width: 26px;
      height: 26px;
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
      width: 14px;
      height: 14px;
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

    .room-card.is-tile.is-room-on::after {
      inset: auto 14px 0 14px;
      opacity: 1;
      background: var(
        --bruno-tile-on-line,
        linear-gradient(90deg, rgba(255, 187, 72, 0) 0%, rgba(255, 187, 72, 0.42) 50%, rgba(255, 187, 72, 0) 100%)
      );
    }

    .room-card.is-tile .room-action {
      position: relative;
    }

    .room-card.is-tile.is-room-on .room-action::after {
      content: '';
      position: absolute;
      left: 8px;
      right: 8px;
      bottom: 0;
      height: 46px;
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
      top: 8px;
      bottom: 8px;
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

    /* Josh: material flat dos dots, restrito aos tiles da Home. */
    .room-card.is-tile .status-dot {
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
        padding: 12px 11px 12px 11px;
      }
      .room-icon {
        width: 100%;
        max-width: 108px;
        height: 72px;
      }
    }

    @media (max-width: 800px) {
      .room-action {
        padding: 11px 12px 10px 10px;
      }
      .room-icon {
        max-width: 100px;
        height: 62px;
      }
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
    const v = '20260803-normalized-2';
    const off = room.assetOff ? `/local/bruno-ui/assets/${room.assetOff}.png?v=${v}` : '';
    const onImg = room.assetOn ? `/local/bruno-ui/assets/${room.assetOn}.png?v=${v}` : '';

    const cardClasses = [
      'room-card',
      on ? 'is-room-on' : '',
      this._tileMode ? 'is-tile' : '',
      this._tileMode && this._config?.divider_left ? 'has-divider' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const nome = this._config?.name ?? room.name;

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
                ? html`<img class="room-asset room-asset-off" src=${off} alt="" decoding="async" />`
                : nothing}
              ${onImg
                ? html`<img class="room-asset room-asset-on" src=${onImg} alt="" decoding="async" />`
                : nothing}
            </span>
          </div>

          <span
            class="room-nav-zone"
            role=${room.section ? 'button' : 'presentation'}
            tabindex=${room.section ? 0 : -1}
            aria-label=${room.section ? `Abrir ${nome}` : nome}
            @pointerdown=${(e: PointerEvent) => room.section && this._onDown('nav', e)}
            @pointermove=${(e: PointerEvent) => room.section && this._onMove('nav', e)}
            @pointerup=${(e: PointerEvent) => room.section && this._onUp('nav', e)}
            @pointercancel=${(e: PointerEvent) => room.section && this._onCancel('nav', e)}
            @pointerleave=${() => room.section && this._resetGesture('nav')}
            @keydown=${(e: KeyboardEvent) => room.section && this._onKey('nav', e)}
          >
            <span class="room-title-row">
              <span class="title">${nome}</span>
              ${room.section ? html`<span class="room-chevron" aria-hidden="true">›</span>` : nothing}
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
