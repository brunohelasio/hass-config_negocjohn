import { LitElement, css, html, nothing } from 'lit';

import { ROOMS } from '@/config/rooms.config';
import type { Hass, HassEntity } from '@/models/home-assistant';
import { ObservadorDeEntidades, type ProjecaoDeEntidade } from '@/services/state/entity-watcher';

import {
  balanceStatusLightsRooms,
  buildStatusLightsInventory,
  type StatusLight,
  type StatusLightsInventory,
  type StatusLightsRoom,
} from './status-lights-model';

const TAG = 'bruno-status-lights-sheet';
const EXIT_MS = 280;

const projectLight: ProjecaoDeEntidade = (entity: HassEntity | undefined) => {
  if (!entity) return 'absent';
  return JSON.stringify([
    entity.state,
    entity.last_changed,
    entity.attributes?.['friendly_name'],
    entity.attributes?.['entity_id'],
  ]);
};

export class BrunoStatusLightsSheet extends LitElement {
  static override properties = {};

  private _hass?: Hass;
  private _monitoredLights: readonly string[] = [];
  private _inventory: StatusLightsInventory = buildStatusLightsInventory(undefined);
  private _observer = new ObservadorDeEntidades();
  private _closeTimer: number | undefined;
  private _auditFrame: number | undefined;
  private _dragPointer: number | undefined;
  private _dragStartX = 0;
  private _dragStartY = 0;
  private _dragPanel: HTMLElement | undefined;

  set hass(hass: Hass) {
    this._hass = hass;
    if (!this.hasAttribute('data-open') || !this._observer.mudou(hass)) return;
    this._rebuildInventory();
    this.requestUpdate();
  }

  get hass(): Hass | undefined {
    return this._hass;
  }

  set monitoredLights(value: readonly string[] | undefined) {
    const next = Array.isArray(value) ? [...new Set(value.filter((id) => typeof id === 'string'))] : [];
    if (next.join('|') === this._monitoredLights.join('|')) return;
    this._monitoredLights = next;
    if (this.hasAttribute('data-open')) {
      this._rebuildInventory();
      this.requestUpdate();
    }
  }

  get monitoredLights(): readonly string[] {
    return this._monitoredLights;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    if (!this.hasAttribute('data-open')) this.hidden = true;
  }

  override disconnectedCallback(): void {
    this._clearCloseTimer();
    this._endDrag();
    this._removeKeyListener();
    if (this._auditFrame != null) cancelAnimationFrame(this._auditFrame);
    super.disconnectedCallback();
  }

  open(monitoredLights?: readonly string[]): void {
    if (monitoredLights) this.monitoredLights = monitoredLights;
    this._clearCloseTimer();
    this.removeAttribute('data-closing');
    this.hidden = false;
    this.setAttribute('data-open', '');
    this._rebuildInventory();
    this._addKeyListener();
    this._emitState(true);
    this.requestUpdate();
    void this.updateComplete.then(() => {
      this.renderRoot.querySelector<HTMLButtonElement>('.close-button')?.focus({ preventScroll: true });
    });
  }

  close(): void {
    if (!this.hasAttribute('data-open') || this.hasAttribute('data-closing')) return;
    this._endDrag();
    if (globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      this._finishClose();
      return;
    }
    this.setAttribute('data-closing', '');
    this._closeTimer = window.setTimeout(() => this._finishClose(), EXIT_MS);
  }

  inventoryAudit(): StatusLightsInventory {
    return this._inventory;
  }

  layoutAudit(): Record<string, number | string | boolean> {
    const panel = this.renderRoot.querySelector<HTMLElement>('.panel');
    const body = this.renderRoot.querySelector<HTMLElement>('.body');
    const mobile = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    return {
      mode: mobile ? 'mobile' : 'tablet',
      panelWidth: Math.round(panel?.getBoundingClientRect().width ?? 0),
      panelHeight: Math.round(panel?.getBoundingClientRect().height ?? 0),
      bodyClientHeight: body?.clientHeight ?? 0,
      bodyScrollHeight: body?.scrollHeight ?? 0,
      overflow: Math.max(0, (body?.scrollHeight ?? 0) - (body?.clientHeight ?? 0)),
      hasHorizontalOverflow: Boolean(body && body.scrollWidth > body.clientWidth + 1),
    };
  }

  protected override updated(): void {
    if (this._auditFrame != null) cancelAnimationFrame(this._auditFrame);
    this._auditFrame = requestAnimationFrame(() => {
      this._auditFrame = undefined;
      this._auditTabletFit();
    });
  }

  private _rebuildInventory(): void {
    this._inventory = buildStatusLightsInventory(this._hass, this._monitoredLights);
    const ids = new Set<string>([
      ...this._inventory.entityIds,
      ...this._inventory.expandedGroups,
      ...this._monitoredLights,
      ...ROOMS.flatMap((room) => [
        room.entities.lightGroup,
        ...(room.entities.lights ?? []),
      ]).filter((id): id is string => Boolean(id)),
    ]);
    const projections = Object.fromEntries([...ids].map((id) => [id, projectLight]));
    this._observer = new ObservadorDeEntidades(ids, { projecoes: projections });
    this._observer.mudancas(this._hass);
  }

  private _emitState(open: boolean): void {
    this.dispatchEvent(new CustomEvent('bruno-status-lights-sheet-state', {
      detail: { open },
      bubbles: true,
      composed: true,
    }));
  }

  private _finishClose(): void {
    this._clearCloseTimer();
    this.removeAttribute('data-open');
    this.removeAttribute('data-closing');
    this.removeAttribute('data-tablet-overflow');
    this.hidden = true;
    this._removeKeyListener();
    this._emitState(false);
  }

  private _clearCloseTimer(): void {
    if (this._closeTimer != null) window.clearTimeout(this._closeTimer);
    this._closeTimer = undefined;
  }

  private readonly _onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Escape') return;
    event.preventDefault();
    this.close();
  };

  private _addKeyListener(): void {
    globalThis.removeEventListener('keydown', this._onKeyDown);
    globalThis.addEventListener('keydown', this._onKeyDown);
  }

  private _removeKeyListener(): void {
    globalThis.removeEventListener('keydown', this._onKeyDown);
  }

  private _toggleLight(light: StatusLight): void {
    if (!this._hass || light.isUnavailable) return;
    const service = light.isOn ? 'turn_off' : 'turn_on';
    void this._hass.callService(
      'light',
      service,
      { entity_id: light.entityId },
      { entity_id: light.entityId },
    );
  }

  private _setAll(service: 'turn_on' | 'turn_off'): void {
    if (!this._hass || !this._inventory.entityIds.length) return;
    const ids = [...this._inventory.entityIds];
    void this._hass.callService('light', service, { entity_id: ids }, { entity_id: ids });
  }

  private _startDrag(event: PointerEvent): void {
    if (event.button !== 0 || event.composedPath().some((node) => node instanceof HTMLButtonElement)) return;
    const panel = this.renderRoot.querySelector<HTMLElement>('.panel');
    if (!panel) return;
    this._dragPointer = event.pointerId;
    this._dragStartX = event.clientX;
    this._dragStartY = event.clientY;
    this._dragPanel = panel;
    globalThis.addEventListener('pointermove', this._moveDrag, { passive: false });
    globalThis.addEventListener('pointerup', this._releaseDrag);
    globalThis.addEventListener('pointercancel', this._cancelDrag);
  }

  private readonly _moveDrag = (event: PointerEvent): void => {
    if (event.pointerId !== this._dragPointer || !this._dragPanel) return;
    const mobile = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    const distance = mobile
      ? Math.max(0, event.clientY - this._dragStartY)
      : Math.max(0, event.clientX - this._dragStartX);
    if (distance <= 0) return;
    event.preventDefault();
    const translated = (distance * 0.72).toFixed(1);
    this._dragPanel.style.transform = mobile
      ? `translateY(${translated}px)`
      : `translateX(${translated}px)`;
  };

  private readonly _releaseDrag = (event: PointerEvent): void => {
    if (event.pointerId !== this._dragPointer) return;
    const mobile = globalThis.matchMedia?.('(max-width: 800px)').matches ?? false;
    const distance = mobile
      ? event.clientY - this._dragStartY
      : event.clientX - this._dragStartX;
    this._endDrag();
    if (distance > (mobile ? 90 : 110)) this.close();
  };

  private readonly _cancelDrag = (): void => this._endDrag();

  private _endDrag(): void {
    if (this._dragPanel) this._dragPanel.style.transform = '';
    this._dragPointer = undefined;
    this._dragPanel = undefined;
    globalThis.removeEventListener('pointermove', this._moveDrag);
    globalThis.removeEventListener('pointerup', this._releaseDrag);
    globalThis.removeEventListener('pointercancel', this._cancelDrag);
  }

  private _auditTabletFit(): void {
    if (!this.hasAttribute('data-open') || globalThis.matchMedia?.('(max-width: 800px)').matches) {
      this.removeAttribute('data-tablet-overflow');
      return;
    }
    const audit = this.layoutAudit();
    const overflow = Number(audit['overflow'] ?? 0);
    const horizontal = Boolean(audit['hasHorizontalOverflow']);
    this.toggleAttribute('data-tablet-overflow', overflow > 1 || horizontal);
    if (overflow > 1 || horizontal) {
      console.warn('[bruno-status-lights-sheet] conteudo excede a side sheet', audit);
    }
  }

  private _renderLight(light: StatusLight) {
    const label = light.isUnavailable
      ? `${light.name}, indisponível`
      : `${light.isOn ? 'Apagar' : 'Acender'} ${light.name}`;
    return html`
      <button
        class="light-control ${light.isOn ? 'is-on' : ''}"
        type="button"
        aria-label=${label}
        aria-pressed=${light.isOn ? 'true' : 'false'}
        ?disabled=${light.isUnavailable}
        @click=${() => this._toggleLight(light)}
      >
        <span class="light-icon" aria-hidden="true">
          <bruno-icon icon=${light.isOn ? 'mdi:lightbulb-on' : 'mdi:lightbulb-outline'}></bruno-icon>
        </span>
        <span class="light-name">${light.name}</span>
        <span class="switch" aria-hidden="true"><span class="knob"></span></span>
      </button>
    `;
  }

  private _renderRoom(room: StatusLightsRoom) {
    return html`
      <section class="room ${room.isUnassigned ? 'is-unassigned' : ''}" aria-labelledby="room-${room.id}">
        <div class="room-head">
          <h2 id="room-${room.id}">${room.name}</h2>
          <span>${room.lights.length} ${room.lights.length === 1 ? 'luz' : 'luzes'}</span>
        </div>
        <div class="room-lights">${room.lights.map((light) => this._renderLight(light))}</div>
      </section>
    `;
  }

  private _renderColumn(rooms: readonly StatusLightsRoom[]) {
    return html`<div class="room-column">${rooms.map((room) => this._renderRoom(room))}</div>`;
  }

  override render() {
    const [left, right] = balanceStatusLightsRooms(this._inventory.rooms);
    const total = this._inventory.total;
    const on = this._inventory.onCount;
    return html`
      <div class="scrim" aria-hidden="true" @click=${() => this.close()}></div>
      <section
        class="panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="status-lights-title"
        @click=${(event: Event) => event.stopPropagation()}
      >
        <header class="header" @pointerdown=${(event: PointerEvent) => this._startDrag(event)}>
          <div class="handle" aria-hidden="true"></div>
          <div class="identity">
            <span class="title-icon" aria-hidden="true"><bruno-icon icon="mdi:lightbulb-group"></bruno-icon></span>
            <span class="title-copy">
              <strong id="status-lights-title">Iluminação</strong>
              <small>${total} ${total === 1 ? 'circuito' : 'circuitos'} • ${on}/${total} ${on === 1 ? 'acesa' : 'acesas'}</small>
            </span>
          </div>
          <div class="global-actions">
            <button type="button" ?disabled=${!total} @click=${() => this._setAll('turn_on')}>
              <bruno-icon icon="mdi:lightbulb-on"></bruno-icon><span>Acender todas</span>
            </button>
            <button type="button" ?disabled=${!total} @click=${() => this._setAll('turn_off')}>
              <bruno-icon icon="mdi:lightbulb-off"></bruno-icon><span>Apagar todas</span>
            </button>
          </div>
          <button class="close-button" type="button" aria-label="Fechar" @click=${() => this.close()}>
            <span aria-hidden="true">×</span>
          </button>
        </header>
        <div class="body">
          ${total
            ? html`<div class="rooms-grid">${this._renderColumn(left)}${this._renderColumn(right)}</div>`
            : html`<div class="empty">Nenhuma luz disponível.</div>`}
          ${this._inventory.orphanEntityIds.length
            ? html`<p class="audit-note">${this._inventory.orphanEntityIds.length} circuito(s) sem associação segura a um cômodo.</p>`
            : nothing}
        </div>
      </section>
    `;
  }

  static override styles = css`
    :host {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: block;
      color: var(--text-main, rgba(248, 251, 255, 0.94));
      font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      user-select: none;
      -webkit-user-select: none;
      -webkit-touch-callout: none;
    }
    :host([hidden]) { display: none; }
    * { box-sizing: border-box; }
    button { font: inherit; -webkit-tap-highlight-color: transparent; }
    .scrim {
      position: absolute;
      inset: 0;
      background: rgba(4, 7, 12, 0.42);
      -webkit-backdrop-filter: blur(10px) saturate(0.94) brightness(0.84);
      backdrop-filter: blur(10px) saturate(0.94) brightness(0.84);
      animation: scrim-in 180ms ease backwards;
    }
    .panel {
      position: absolute;
      inset: 8px 0 8px auto;
      /* ANTERIOR (rollback microajuste tablet rev.2): min(64.5vw, 1200px).
         A reducao conserva as duas colunas e devolve mais area para a Home. */
      width: min(60vw, 1120px);
      min-width: 0;
      display: flex;
      flex-direction: column;
      border: var(--bruno-josh-popup-border, var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115)));
      border-right: 0;
      border-radius: var(--bruno-liquid-card-radius-compact, 24px) 0 0 var(--bruno-liquid-card-radius-compact, 24px);
      background: var(--bruno-josh-popup-background, var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.78), rgba(12,13,16,0.72))));
      box-shadow: var(--bruno-josh-popup-shadow, var(--bruno-liquid-popup-shadow, -18px 0 42px rgba(0,0,0,0.34)));
      -webkit-backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94)));
      backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94)));
      animation: side-in 280ms cubic-bezier(0.18, 0.86, 0.24, 1) backwards;
      isolation: isolate;
    }
    .panel::before {
      content: '';
      position: absolute;
      inset: 1px;
      z-index: -1;
      border-radius: inherit;
      background: var(--bruno-josh-popup-sheen, none);
      opacity: var(--bruno-josh-popup-sheen-opacity, 0.13);
      pointer-events: none;
    }
    .header {
      position: relative;
      display: grid;
      grid-template-columns: minmax(180px, 1fr) auto 38px;
      align-items: center;
      gap: 10px;
      min-height: 64px;
      padding: 10px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.085);
      touch-action: none;
      cursor: grab;
    }
    .header:active { cursor: grabbing; }
    .handle { display: none; }
    .identity { min-width: 0; display: flex; align-items: center; gap: 10px; }
    .title-icon {
      width: 34px;
      height: 34px;
      flex: 0 0 auto;
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: rgba(255, 209, 92, 0.96);
      background: rgba(255, 196, 56, 0.10);
      border: 1px solid rgba(255, 205, 88, 0.25);
    }
    .title-icon bruno-icon { --mdc-icon-size: 20px; }
    .title-copy { min-width: 0; display: grid; gap: 3px; }
    .title-copy strong { font-size: 16px; line-height: 1.05; font-weight: 800; }
    .title-copy small { color: var(--text-soft, rgba(255,255,255,0.55)); font-size: 10px; font-weight: 650; }
    .global-actions { display: flex; align-items: center; gap: 7px; }
    .global-actions button,
    .close-button {
      border: var(--bruno-liquid-control-warm-border, 1px solid rgba(255, 210, 92, 0.18));
      background: var(--bruno-liquid-control-warm-background, rgba(255, 201, 63, 0.055));
      box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.07));
      color: rgba(255,255,255,0.88);
      cursor: pointer;
      transition: transform 140ms ease, background 140ms ease;
    }
    .global-actions button {
      min-height: 36px;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 0 10px;
      border-radius: var(--bruno-liquid-control-radius-compact, 12px);
      font-size: 10px;
      font-weight: 760;
    }
    .global-actions bruno-icon { --mdc-icon-size: 17px; color: rgba(255, 209, 92, 0.92); }
    .global-actions button:active,
    .close-button:active { transform: scale(0.97); background: rgba(255,255,255,0.11); }
    button:focus-visible { outline: 2px solid rgba(120,178,245,0.86); outline-offset: 2px; }
    button:disabled { opacity: 0.42; cursor: default; }
    .close-button {
      width: 36px;
      height: 36px;
      display: grid;
      place-items: center;
      padding: 0;
      border-radius: 50%;
      border-color: rgba(255,255,255,0.16);
      background: rgba(255,255,255,0.055);
    }
    .close-button span { font-size: 25px; line-height: 1; transform: translateY(-1px); }
    .body { flex: 1 1 auto; min-height: 0; padding: 8px 14px 12px; }
    .rooms-grid { height: 100%; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .room-column { min-width: 0; display: flex; flex-direction: column; gap: 8px; }
    .room { min-width: 0; padding-top: 7px; border-top: 1px solid rgba(255,255,255,0.085); }
    .room:first-child { border-top-color: transparent; }
    .room.is-unassigned { border-top-color: rgba(255, 178, 72, 0.28); }
    .room-head { min-height: 23px; display: flex; align-items: baseline; justify-content: space-between; gap: 8px; padding: 0 2px 5px; }
    .room-head h2 { min-width: 0; margin: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 11px; line-height: 1; font-weight: 800; }
    .room-head span { flex: 0 0 auto; color: var(--text-soft, rgba(255,255,255,0.52)); font-size: 9px; font-weight: 650; }
    .room-lights { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 5px; }
    .light-control {
      min-width: 0;
      /* ANTERIOR (rollback microajuste tablet rev.2):
         min-height: clamp(38px, 3.9dvh, 46px). */
      min-height: clamp(42px, 4.3dvh, 48px);
      display: grid;
      grid-template-columns: 22px minmax(0, 1fr) 30px;
      align-items: center;
      gap: 6px;
      padding: 0 8px;
      border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.075));
      border-radius: var(--bruno-liquid-control-radius-compact, 12px);
      background: var(--bruno-liquid-control-background, rgba(255,255,255,0.035));
      box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.055));
      color: rgba(255,255,255,0.82);
      text-align: left;
      cursor: pointer;
      transition: transform 130ms ease, background 150ms ease, border-color 150ms ease;
    }
    .light-control:active { transform: scale(0.985); }
    .light-control.is-on {
      background: var(--bruno-liquid-control-warm-background, rgba(255, 201, 63, 0.09));
      border-color: rgba(255, 211, 99, 0.24);
      color: rgba(255,255,255,0.96);
    }
    .light-icon { width: 22px; height: 22px; display: grid; place-items: center; color: rgba(255,255,255,0.44); }
    .light-icon bruno-icon { --mdc-icon-size: 18px; }
    .light-control.is-on .light-icon { color: rgba(255, 209, 92, 0.98); }
    .light-name { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 9.5px; font-weight: 690; }
    .switch { width: 30px; height: 17px; position: relative; border-radius: 999px; background: rgba(255,255,255,0.13); box-shadow: inset 0 1px 2px rgba(0,0,0,0.25); }
    .knob { position: absolute; top: 2px; left: 2px; width: 13px; height: 13px; border-radius: 50%; background: rgba(255,255,255,0.80); transition: transform 150ms ease; }
    .light-control.is-on .switch { background: rgba(255, 194, 48, 0.74); }
    .light-control.is-on .knob { transform: translateX(13px); background: #fff; }
    .empty { height: 100%; display: grid; place-items: center; color: var(--text-soft, rgba(255,255,255,0.52)); }
    .audit-note { margin: 8px 2px 0; color: rgba(255, 184, 86, 0.86); font-size: 9px; }
    :host([data-closing]) .scrim { animation: scrim-out 180ms ease forwards; pointer-events: none; }
    :host([data-closing]) .panel { animation: side-out 280ms cubic-bezier(0.42, 0, 0.78, 0.18) forwards; pointer-events: none; }
    @keyframes scrim-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scrim-out { from { opacity: 1; } to { opacity: 0; } }
    @keyframes side-in { from { transform: translateX(100%); opacity: 0.86; } to { transform: translateX(0); opacity: 1; } }
    @keyframes side-out { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0.86; } }
    @media (min-width: 801px) and (max-height: 820px) {
      .header { min-height: 58px; padding-block: 7px; }
      .body { padding-top: 5px; padding-bottom: 8px; }
      .room-column { gap: 5px; }
      .room { padding-top: 4px; }
      .room-head { min-height: 20px; padding-bottom: 3px; }
      .light-control { min-height: 42px; }
    }
    @media (max-width: 800px) {
      .scrim { background: rgba(4, 7, 12, 0.34); -webkit-backdrop-filter: none; backdrop-filter: none; }
      .panel {
        /* Mesmo contrato das folhas das subviews: a superfície segue até a
           borda inferior e passa por trás da rail transparente. O padding do
           corpo reserva a altura medida do dock para os controles. */
        inset: auto 0 0 0;
        width: 100%;
        /* ANTERIOR (rollback microajuste 2026-08-26): 64dvh, terminando acima
           da dock. O novo teto sobe até a vizinhança do título Cômodos sem
           alcançar o headline do Hero, inclusive em viewports baixas. */
        /* REV.2: mais 5px, dentro da faixa pedida, para encobrir por completo
           o titulo Cômodos sem avancar de forma material sobre o Hero. */
        height: min(calc(78dvh + 5px), calc(100dvh - 171px));
        border: 0;
        border-radius: 18px 18px 0 0;
        background: var(--bruno-mobile-sheet-background,
          radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%),
          linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)),
          rgba(0,0,0,0.300));
        -webkit-backdrop-filter: var(--bruno-mobile-sheet-filter, blur(20px) saturate(1.18) brightness(1.03));
        backdrop-filter: var(--bruno-mobile-sheet-filter, blur(20px) saturate(1.18) brightness(1.03));
        box-shadow: 0 -14px 30px -20px rgba(0,0,0,0.7);
        animation-name: bottom-in;
      }
      .header {
        grid-template-columns: minmax(0, 1fr) 36px;
        grid-template-rows: auto auto;
        min-height: 105px;
        gap: 7px 10px;
        padding: 17px 12px 9px;
      }
      .handle { display: block; position: absolute; top: 7px; left: 50%; width: 34px; height: 3px; transform: translateX(-50%); border-radius: 2px; background: rgba(255,255,255,0.20); }
      .identity { grid-column: 1; grid-row: 1; }
      .close-button { grid-column: 2; grid-row: 1; }
      .global-actions { grid-column: 1 / -1; grid-row: 2; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .global-actions button { justify-content: center; min-height: 35px; }
      .body { overflow-y: auto; overscroll-behavior: contain; -webkit-overflow-scrolling: touch; padding: 8px 10px calc(12px + var(--bruno-dock-h, 74px)); touch-action: pan-y; }
      .rooms-grid { height: auto; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px; }
      .room-column { gap: 7px; }
      .room { padding-top: 6px; }
      .room-lights { grid-template-columns: minmax(0, 1fr); gap: 5px; }
      .light-control { min-height: 46px; grid-template-columns: 21px minmax(0, 1fr) 30px; padding-inline: 7px; }
      .light-name { font-size: 10px; }
      :host([data-closing]) .panel { animation-name: bottom-out; }
      @keyframes bottom-in { from { transform: translateY(100%); opacity: 0.82; } to { transform: translateY(0); opacity: 1; } }
      @keyframes bottom-out { from { transform: translateY(0); opacity: 1; } to { transform: translateY(100%); opacity: 0.82; } }
    }
    @media (max-width: 360px) {
      .rooms-grid { grid-template-columns: minmax(0, 1fr); }
      .room-column { display: contents; }
      .global-actions button span { font-size: 9px; }
    }
    @media (prefers-reduced-motion: reduce) {
      .scrim, .panel { animation-duration: 1ms !important; }
      * { scroll-behavior: auto !important; }
    }
  `;
}

if (!customElements.get(TAG)) customElements.define(TAG, BrunoStatusLightsSheet);

declare global {
  interface HTMLElementTagNameMap {
    'bruno-status-lights-sheet': BrunoStatusLightsSheet;
  }
}
