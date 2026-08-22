import { LitElement, html, css, nothing, type PropertyValues } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { Hass } from '@/models/home-assistant';
import { ROOMS } from '@/config/rooms.config';

/**
 * Compositor do bloco estático da Home no TELEFONE.
 *
 * POR QUE ELE EXISTE
 *
 * A Home no phone empilhava Sala, matriz de cômodos e área dinâmica como
 * linhas independentes do grid da `section_home_v2.yaml`. Isso obrigava o grid
 * a declarar doze tracks — nove delas de 0px — e a área dinâmica reservava
 * altura mesmo vazia. Aqui um único card é dono de Cômodos, Favoritos e da
 * seção condicional "Em execução", e o grid externo volta a ter três tracks
 * reais.
 *
 * O QUE MATOU A TENTATIVA ANTERIOR (2026-08-22, branch chat/home-mobile-v4)
 *
 * Aquele compositor foi declarado num bloco `resources:` dentro do YAML do
 * dashboard. Mas o Lovelace roda `mode: storage`, e nesse modo os recursos vêm
 * de `.storage/lovelace_resources` — o bloco do YAML é ignorado. O arquivo
 * nunca carregou, o custom element nunca registrou e o card virou
 * `hui-error-card` exatamente onde deveria começar a seção de cômodos.
 *
 * Este componente entra pelo `main.ts`, ou seja, pelo bundle único que o
 * `extra_module_url` já declara. Carrega uma vez, sem caminho paralelo.
 *
 * ISOLAMENTO DE ERRO
 *
 * Cada card filho é criado por `loadCardHelpers().createCardElement()` dentro
 * de um try/catch próprio. Um filho que falhe vira um aviso naquela célula e
 * não derruba o compositor — foi o efeito dominó que apagou a Home inteira na
 * tentativa anterior.
 *
 * ROLLBACK: comentar o `!include` de `v2/bento_home_phone.yaml` em
 * `shell/section_home_v2.yaml` e reativar os três includes originais
 * (`bento_sala_phone`, `bento_comodos_phone`, `bento_dynamic_phone`),
 * restaurando também o `grid-template-rows`/`areas` do bloco phone.
 */

interface CardHelpers {
  createCardElement(config: Record<string, unknown>): HTMLElement & {
    hass?: Hass;
    setConfig?: (c: Record<string, unknown>) => void;
  };
}

interface CenaConfig {
  /** Rótulo curto exibido no ladrilho. */
  label: string;
  /** `script.bruno_scene_*` — a cena precisa existir; nada é inventado aqui. */
  script: string;
  icon?: string;
}

interface HomePhoneConfig {
  type: string;
  /** Ordem das páginas do pager. Cada entrada vira uma página. */
  pages?: Array<{ rooms: string[] }>;
  /** As quatro cenas do Bento. Vêm da configuração para poder mudar sem build. */
  scenes?: CenaConfig[];
  favorites?: {
    wifi?: { ssidEntity?: string; downloadEntity?: string; uploadEntity?: string };
    agenda?: { calendarEntity?: string; insightsEntity?: string };
  };
  /** Sensores que fazem a seção "Em execução" existir. */
  running?: { camera?: string; roborock?: string; media?: string };
  /** Card da área dinâmica, reaproveitado dentro de "Em execução". */
  dynamicCard?: Record<string, unknown>;
}

const ALTURA_LINHA = 172;
const GAP = 8;

/** Sala tem card próprio e ocupa a linha inteira; os demais são ladrilhos. */
const configDoComodo = (id: string): Record<string, unknown> =>
  (id === 'sala'
    ? { type: 'custom:bruno-sala-card' }
    : { type: 'custom:bruno-room-tile', room: id, variant: 'tile' });

@customElement('bruno-home-phone')
export class BrunoHomePhone extends LitElement {
  // NUNCA declarar `hass` como propriedade reativa: o setter atribui sempre, e
  // toda atribuição a uma propriedade reativa pede render. A guarda por
  // assinatura abaixo é o que evita os renders inúteis (invariante da Fase 6.1).
  static override properties = {
    _pagina: { state: true },
    _rodando: { state: true },
  };

  private _hass?: Hass;
  private _config?: HomePhoneConfig;
  private _pagina = 0;
  private _rodando = false;
  private _assinatura = '';
  private _montados = new WeakSet<Element>();

  set hass(hass: Hass) {
    this._hass = hass;
    for (const filho of this.renderRoot?.querySelectorAll<HTMLElement & { hass?: Hass }>(
      '[data-card-host] > *',
    ) ?? []) {
      filho.hass = hass;
    }
    const nova = this._assinaturaDeEstado();
    if (nova === this._assinatura) return;
    this._assinatura = nova;
    this._rodando = this._temAtividadeDinamica();
    this.requestUpdate();
  }

  setConfig(config: HomePhoneConfig): void {
    if (!config) throw new Error('bruno-home-phone: configuração ausente');
    this._config = config;
    this.requestUpdate();
  }

  getCardSize(): number {
    return 12;
  }

  // ── estado ───────────────────────────────────────────────────────────────

  private _estado(id?: string): string {
    if (!id || !this._hass) return '';
    return String(this._hass.states[id]?.state ?? '').toLowerCase();
  }

  private _ligado(id?: string): boolean {
    return ['on', 'playing', 'buffering', 'paused', 'home', 'detected', 'open'].includes(
      this._estado(id),
    );
  }

  private _paginas(): Array<{ rooms: string[] }> {
    return this._config?.pages ?? [];
  }

  /**
   * Atividade de um cômodo: luz, presença, clima ou mídia.
   *
   * Lê `ROOMS` — a mesma configuração que os ladrilhos usam —, então o
   * indicador nunca diverge do que o próprio card mostra.
   */
  private _comodoAtivo(id: string): boolean {
    const room = ROOMS.find((r) => r.id === id);
    if (!room) return false;
    const e = room.entities;
    if (this._ligado(e.lightGroup)) return true;
    if (this._ligado(e.motionRecent)) return true;
    const clima = this._estado(e.climate);
    if (clima && !['off', 'unavailable', 'unknown', ''].includes(clima)) return true;
    return (e.mediaPlayers ?? []).some((m) => ['playing', 'buffering'].includes(this._estado(m)));
  }

  /** Quantos cômodos das páginas que NÃO estão à vista têm atividade. */
  private _ativosForaDaPagina(): number {
    return this._paginas()
      .filter((_, i) => i !== this._pagina)
      .flatMap((p) => p.rooms)
      .filter((id) => this._comodoAtivo(id)).length;
  }

  private _temAtividadeDinamica(): boolean {
    const r = this._config?.running ?? {};
    return [r.camera, r.roborock, r.media].some((id) => this._estado(id) === 'on');
  }

  /**
   * Só o que muda a PINTURA entra na assinatura. Sem isso, cada tick do hass
   * (dezenas por minuto) pediria um render do compositor inteiro.
   */
  private _assinaturaDeEstado(): string {
    const r = this._config?.running ?? {};
    const f = this._config?.favorites?.wifi ?? {};
    const a = this._config?.favorites?.agenda ?? {};
    const partes = [
      ...this._paginas().flatMap((p) => p.rooms).map((id) => (this._comodoAtivo(id) ? '1' : '0')),
      this._estado(r.camera),
      this._estado(r.roborock),
      this._estado(r.media),
      this._estado(f.ssidEntity),
      this._estado(f.downloadEntity),
      this._estado(f.uploadEntity),
      this._estado(a.calendarEntity),
      JSON.stringify(this._hass?.states[a.calendarEntity ?? '']?.attributes?.['message'] ?? ''),
      this._estado(a.insightsEntity),
      ...(this._config?.scenes ?? []).map((c) => this._estado(c.script)),
    ];
    return partes.join('|');
  }

  // ── cards filhos ─────────────────────────────────────────────────────────

  /**
   * Monta um card do Lovelace dentro de um contêiner, uma única vez.
   *
   * A falha é contida na célula: sem isto, um único filho quebrado
   * transformaria o compositor inteiro num `hui-error-card`.
   */
  private async _montar(host: HTMLElement, config: Record<string, unknown>): Promise<void> {
    if (this._montados.has(host)) return;
    this._montados.add(host);
    try {
      const helpers = (await (
        globalThis as unknown as { loadCardHelpers?: () => Promise<CardHelpers> }
      ).loadCardHelpers?.()) as CardHelpers | undefined;
      if (!helpers) throw new Error('loadCardHelpers indisponível');
      const el = helpers.createCardElement(config);
      if (this._hass) el.hass = this._hass;
      host.replaceChildren(el);
    } catch (erro) {
      this._montados.delete(host);
      const aviso = document.createElement('div');
      aviso.className = 'falha';
      aviso.textContent = String(config['room'] ?? config['type'] ?? 'card');
      host.replaceChildren(aviso);
      console.warn('bruno-home-phone: card filho falhou', config, erro);
    }
  }

  protected override updated(_mudou: PropertyValues): void {
    for (const host of this.renderRoot.querySelectorAll<HTMLElement>('[data-card-host]')) {
      const bruto = host.dataset['cardHost'];
      if (!bruto) continue;
      try {
        void this._montar(host, JSON.parse(bruto) as Record<string, unknown>);
      } catch {
        /* config ilegível: a célula fica vazia, o resto da Home continua */
      }
    }
  }

  // ── pager ────────────────────────────────────────────────────────────────

  private _aoRolarPager(ev: Event): void {
    const trilho = ev.currentTarget as HTMLElement;
    const largura = trilho.clientWidth || 1;
    const pagina = Math.round(trilho.scrollLeft / largura);
    if (pagina === this._pagina) return;
    this._pagina = pagina;
    this.requestUpdate();
  }

  private _irPara(indice: number): void {
    const trilho = this.renderRoot.querySelector<HTMLElement>('.pager');
    if (!trilho) return;
    trilho.scrollTo({ left: indice * trilho.clientWidth, behavior: 'smooth' });
  }

  // ── render ───────────────────────────────────────────────────────────────

  private _celula(id: string, largo = false) {
    return html`
      <div
        class="celula ${largo ? 'is-larga' : ''}"
        data-card-host=${JSON.stringify(configDoComodo(id))}
      ></div>
    `;
  }

  private _pager() {
    const paginas = this._paginas();
    return html`
      <div class="pager" @scroll=${this._aoRolarPager}>
        ${paginas.map(
          (pagina) => html`
            <div class="pagina">
              ${pagina.rooms.map((id, i) =>
                this._celula(id, pagina.rooms.length === 3 && i === 0),
              )}
            </div>
          `,
        )}
      </div>
    `;
  }

  private _indicadores() {
    const paginas = this._paginas();
    const fora = this._ativosForaDaPagina();
    return html`
      <div class="indicadores">
        <div class="dots">
          ${paginas.map(
            (_, i) => html`
              <button
                class="dot ${i === this._pagina ? 'is-atual' : ''}"
                type="button"
                aria-label=${`Página ${i + 1}`}
                aria-current=${i === this._pagina ? 'true' : 'false'}
                @click=${() => this._irPara(i)}
              ></button>
            `,
          )}
        </div>
        ${fora > 0
          ? html`<span class="aviso-comodos" title="Cômodos ativos na outra página">${fora}</span>`
          : nothing}
      </div>
    `;
  }

  private _wifi() {
    const w = this._config?.favorites?.wifi ?? {};
    const ssid = this._hass?.states[w.ssidEntity ?? '']?.state ?? '';
    const bruto = String(ssid).trim();
    const offline = !bruto || ['unknown', 'unavailable', 'none', ''].includes(bruto.toLowerCase());
    const numero = (id?: string): number => {
      const v = Number(this._hass?.states[id ?? '']?.state);
      return Number.isFinite(v) ? v : 0;
    };
    const down = numero(w.downloadEntity);
    const up = numero(w.uploadEntity);
    // Semântica pedida: Excelente / Parcial / Offline.
    const estado = offline ? 'Offline' : down >= 1 ? 'Excelente' : 'Parcial';
    return html`
      <div class="fav-card wifi">
        <div class="fav-topo"><span class="fav-icone">✧</span><strong>Wi-Fi</strong></div>
        <div class="wifi-rede">${offline ? 'Sem rede' : bruto}</div>
        <div class="wifi-estado is-${estado.toLowerCase()}">${estado}</div>
        <div class="wifi-taxas">
          <span>↓ ${down.toFixed(1)}</span><span>↑ ${up.toFixed(1)}</span>
        </div>
      </div>
    `;
  }

  private _cenas() {
    const cenas = (this._config?.scenes ?? []).slice(0, 4);
    return html`
      <div class="cenas-bloco">
        <div class="fav-card cenas-titulo">
          <span class="fav-icone">✦</span><strong>Cenas</strong>
        </div>
        <div class="cenas-grade">
          ${cenas.map(
            (cena) => html`
              <button
                class="cena"
                type="button"
                @click=${() =>
                  this._hass?.callService('script', 'turn_on', { entity_id: cena.script })}
              >
                <span class="cena-nome">${cena.label}</span>
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  /**
   * Agenda compacta: próximo compromisso + uma informação inteligente.
   *
   * NÃO usa `bruno-agenda-card` de propósito. Aquele card é uma agenda mensal
   * sem modo compacto — espremê-lo numa célula do Bento produziria o mesmo
   * tipo de aperto que quebrou as tentativas anteriores.
   *
   * O próximo compromisso sai dos atributos que a própria entidade de
   * calendário do Home Assistant publica (`message`/`start_time`), então não há
   * segunda busca de agenda nem duplicação da lógica do hero. A linha
   * secundária vem de `sensor.home_insights`, já ordenado por severidade no
   * backend — a mesma fonte que o hero usa no tablet.
   */
  private _agenda() {
    const cfg = this._config?.favorites?.agenda ?? {};
    const cal = cfg.calendarEntity ? this._hass?.states[cfg.calendarEntity] : undefined;
    const attrs = (cal?.attributes ?? {}) as Record<string, unknown>;
    const titulo = String(attrs['message'] ?? '').trim();
    const inicio = String(attrs['start_time'] ?? '').trim();

    let hora = '';
    if (inicio) {
      const d = new Date(inicio.replace(' ', 'T'));
      if (!Number.isNaN(d.getTime())) {
        hora = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      }
    }

    const insights = this._hass?.states[cfg.insightsEntity ?? '']?.attributes as
      | { items?: Array<{ text?: string }> }
      | undefined;
    const insight = String(insights?.items?.[0]?.text ?? '').trim();

    return html`
      <div class="fav-card agenda">
        <div class="fav-topo"><span class="fav-icone">◷</span><strong>Agenda</strong></div>
        ${titulo
          ? html`
              <div class="agenda-hora">${hora || 'Hoje'}</div>
              <div class="agenda-titulo">${titulo}</div>
            `
          : html`<div class="agenda-vazia">Sem compromissos</div>`}
        ${insight ? html`<div class="agenda-insight">${insight}</div>` : nothing}
      </div>
    `;
  }

  private _favoritos() {
    return html`
      <h2 class="titulo">Favoritos</h2>
      <div class="favoritos">
        <div class="fav-coluna">${this._agenda()} ${this._wifi()}</div>
        ${this._cenas()}
      </div>
    `;
  }

  private _emExecucao() {
    // A seção não existe quando nada está ativo: sem título, sem gap, sem
    // altura reservada. É isso que mantém a Home sem rolagem no estado normal.
    if (!this._rodando || !this._config?.dynamicCard) return nothing;
    return html`
      <h2 class="titulo">Em execução</h2>
      <div class="rodando" data-card-host=${JSON.stringify(this._config.dynamicCard)}></div>
    `;
  }

  protected override render() {
    if (!this._config) return nothing;
    return html`
      <h2 class="titulo">Cômodos</h2>
      ${this._pager()} ${this._indicadores()} ${this._favoritos()} ${this._emExecucao()}
    `;
  }

  static override styles = css`
    /* O componente só é montado pelo card com show.mediaquery (max-width:800px),
       mas o :host guarda o breakpoint de novo: se algum dia ele for colocado
       noutro lugar, não vaza geometria de telefone para o tablet. */
    :host {
      display: block;
      width: 100%;
      min-width: 0;
      color: var(--bruno-text-main, rgba(245, 250, 255, 0.96));
    }
    @media (min-width: 801px) {
      :host {
        display: none;
      }
    }

    .titulo {
      margin: 0 0 6px;
      font-size: 15px;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: var(--bruno-text-main, rgba(245, 250, 255, 0.96));
    }
    .titulo:not(:first-child) {
      margin-top: 12px;
    }

    /* ── pager ── */
    .pager {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 100%;
      gap: 0;
      overflow-x: auto;
      overflow-y: hidden;
      scroll-snap-type: x mandatory;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
    }
    .pager::-webkit-scrollbar {
      display: none;
    }

    /* Altura intrínseca e explícita: duas linhas de 172px + um gap de 8px.
       Nada aqui depende de vh nem de track de 0px no grid externo. */
    .pagina {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: ${ALTURA_LINHA}px;
      gap: ${GAP}px;
      scroll-snap-align: start;
      scroll-snap-stop: always;
      min-width: 0;
    }
    .celula {
      min-width: 0;
      min-height: 0;
    }
    .celula.is-larga {
      grid-column: 1 / -1;
    }
    .celula > * {
      display: block;
      height: 100%;
      min-width: 0;
    }
    .falha {
      display: grid;
      place-items: center;
      height: 100%;
      border-radius: 16px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.5);
      background: rgba(255, 255, 255, 0.05);
      border: 1px dashed rgba(255, 255, 255, 0.14);
    }

    /* ── indicadores ── */
    .indicadores {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 8px;
      min-height: 14px;
    }
    .dots {
      display: flex;
      gap: 6px;
    }
    .dot {
      width: 6px;
      height: 6px;
      padding: 0;
      border: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.26);
      cursor: pointer;
      transition: background 160ms ease, width 160ms ease;
    }
    .dot.is-atual {
      width: 16px;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.72);
    }
    .aviso-comodos {
      display: grid;
      place-items: center;
      min-width: 17px;
      height: 17px;
      padding: 0 4px;
      border-radius: 9px;
      background: var(--bruno-accent-amber, #f7c600);
      color: rgba(12, 14, 20, 0.92);
      font: 700 11px/1 system-ui, -apple-system, sans-serif;
    }

    /* ── favoritos ── */
    .favoritos {
      display: grid;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
      gap: ${GAP}px;
      align-items: stretch;
    }
    .fav-coluna {
      display: grid;
      grid-auto-rows: minmax(0, 1fr);
      gap: ${GAP}px;
      min-width: 0;
    }
    .fav-card {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 10px 12px;
      border-radius: 16px;
      min-width: 0;
      background: var(--bruno-liquid-surface-off-bg, rgba(255, 255, 255, 0.06));
      border: 1px solid var(--bruno-liquid-surface-off-border, rgba(255, 255, 255, 0.105));
    }
    .fav-card > * {
      min-width: 0;
    }
    .fav-topo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.62);
    }
    .fav-icone {
      opacity: 0.7;
    }
    .agenda-hora {
      font-size: 12px;
      font-weight: 700;
      color: var(--bruno-accent-amber, #f7c600);
      font-variant-numeric: tabular-nums;
    }
    .agenda-titulo,
    .agenda-vazia,
    .agenda-insight {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .agenda-titulo {
      font-size: 12.5px;
      font-weight: 600;
    }
    .agenda-vazia {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.45);
    }
    .agenda-insight {
      margin-top: 2px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.55);
    }
    .wifi-rede {
      font-size: 13px;
      font-weight: 650;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .wifi-estado {
      font-size: 11px;
      font-weight: 600;
    }
    .wifi-estado.is-excelente {
      color: #6ee7a8;
    }
    .wifi-estado.is-parcial {
      color: var(--bruno-accent-amber, #f7c600);
    }
    .wifi-estado.is-offline {
      color: rgba(255, 255, 255, 0.42);
    }
    .wifi-taxas {
      display: flex;
      gap: 10px;
      margin-top: 2px;
      font-size: 11px;
      color: rgba(255, 255, 255, 0.55);
      font-variant-numeric: tabular-nums;
    }

    .cenas-bloco {
      display: grid;
      grid-template-rows: auto minmax(0, 1fr);
      gap: ${GAP}px;
      min-width: 0;
    }
    .cenas-titulo {
      flex-direction: row;
      align-items: center;
      padding: 8px 12px;
    }
    .cenas-grade {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: minmax(0, 1fr);
      gap: ${GAP}px;
      min-width: 0;
    }
    .cena {
      display: grid;
      align-content: end;
      padding: 8px 10px;
      border-radius: 14px;
      min-width: 0;
      text-align: left;
      cursor: pointer;
      color: inherit;
      background: var(--bruno-liquid-control-bg, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--bruno-liquid-control-border, rgba(255, 255, 255, 0.1));
    }
    .cena:active {
      transform: translateY(1px);
    }
    .cena-nome {
      font-size: 11.5px;
      font-weight: 600;
      line-height: 1.15;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .rodando > * {
      display: block;
      min-width: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .dot {
        transition: none;
      }
    }
  `;
}

declare global {
  interface HTMLElementTagNameMap {
    'bruno-home-phone': BrunoHomePhone;
  }
}
