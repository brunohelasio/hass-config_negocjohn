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
    agenda?: {
      calendarEntity?: string;
      insightsEntity?: string;
      /** Calendarios extras exibidos SO na agenda completa (item 6). */
      extraCalendars?: string[];
    };
  };
  /** Sensores que fazem a seção "Em execução" existir. */
  running?: { camera?: string; roborock?: string; media?: string };
  /** Card da área dinâmica, reaproveitado dentro de "Em execução". */
  dynamicCard?: Record<string, unknown>;
}

// Altura da linha (172px) e o gap (8px) vivem no CSS: sao geometria, nao
// logica, e mante-los num lugar so evita os dois divergirem.
// Mesma cadencia da faixa que saiu do hero (BRUNO_CHAT_ROTATION_MS no patch).
const ROTACAO_MS = 6000;

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
    _pagAgenda: { state: true },
    _rodando: { state: true },
  };

  private _hass?: Hass;
  private _config?: HomePhoneConfig;
  private _pagina = 0;
  private _rodando = false;
  private _pagAgenda = 0;
  private _relogio: ReturnType<typeof setInterval> | undefined;
  private _observador: ResizeObserver | undefined;
  private _assinatura = '';
  private _montados = new WeakSet<Element>();

  /**
   * Rotação da agenda: mesma cadência da faixa que saiu do hero.
   *
   * O timer vive no ciclo de vida do elemento — some quando ele sai do DOM e
   * pausa com a aba oculta. Um intervalo que sobrevive à desmontagem é
   * vazamento, e a aba escondida não tem quem olhe.
   */
  override connectedCallback(): void {
    super.connectedCallback();
    this._relogio ??= setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      this._pagAgenda += 1;
      this.requestUpdate();
    }, ROTACAO_MS);
    this._observador ??= new ResizeObserver(() => this._medirAlturaUtil());
    this._observador.observe(document.documentElement);
    requestAnimationFrame(() => this._medirAlturaUtil());
  }

  /**
   * Mede a altura util: do topo deste componente ate o fim da area rolavel da
   * shell. E o unico valor que nao cresce quando a secao "Em execucao" aparece.
   */
  /**
   * Sobe ate a area rolavel da shell ATRAVESSANDO shadow roots.
   *
   * `closest()` sozinho nao serve: ele para na fronteira do shadow DOM, e este
   * componente vive dentro de dois (a shell e o layout-card). A busca falhava,
   * caia no fallback de viewport inteiro e o bloco ficava ~64px alto demais —
   * a altura da rail mais o padding. Era esse o corte.
   */
  private _acharSlot(): HTMLElement | null {
    let no: Node | null = this.parentNode;
    while (no) {
      if (no instanceof HTMLElement && no.classList.contains('content-slot')) return no;
      no = no instanceof ShadowRoot ? no.host : no.parentNode;
    }
    return null;
  }

  private _medirAlturaUtil = (): void => {
    const slot = this._acharSlot();
    const caixa = this.getBoundingClientRect();
    if (!caixa.height && !caixa.top) return;
    // Sem o slot NAO ha limite confiavel: `innerHeight` nao desconta a rail nem
    // o padding, e usa-lo deixava o bloco ~64px alto demais — cortado pela rail.
    // Ficar em `auto` (mais curto) e sempre preferivel a cortar.
    if (!slot) {
      this.style.removeProperty('--altura-util');
      return;
    }
    // ANTERIOR (rollback): media em coordenadas de VIEWPORT.
    //   const limite = slot.getBoundingClientRect().bottom - paddingBottom;
    //   const util   = limite - caixa.top;
    // Ao rolar, caixa.top diminui e util CRESCE. Com a secao "Em execucao"
    // presente o slot rola, o componente re-renderiza durante a rolagem e o
    // bloco estatico inflava ate ocupar a tela inteira. Era esse o estouro.
    //
    // Agora a medida e feita nas coordenadas do CONTEUDO do slot: somar
    // scrollTop neutraliza a rolagem, e o resultado e identico ao anterior
    // quando o slot esta no topo.
    const caixaSlot = slot.getBoundingClientRect();
    const topoNoConteudo = caixa.top - caixaSlot.top - slot.clientTop + slot.scrollTop;
    const fim = slot.clientHeight - parseFloat(getComputedStyle(slot).paddingBottom || '0');
    const util = Math.max(0, Math.round(fim - topoNoConteudo));
    if (!util) return;
    this.style.setProperty('--altura-util', String(util) + 'px');
  };

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    this._observador?.disconnect();
    if (this._relogio) clearInterval(this._relogio);
    this._relogio = undefined;
  }

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
    this._medirAlturaUtil();
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
        <!-- C3 (2026-08-23): o slot existe SEMPRE.

             ANTERIOR (rollback): o span so era criado quando fora > 0. Como
             a linha do grid e automatica e .indicadores so garantia
             min-height: 12px, entrar/sair o aviso (16px) mudava a altura
             total e deslocava Favoritos a cada troca de pagina.

             Agora a caixa e reservada e so o conteudo muda; a paginacao nao
             altera mais a altura da composicao. Os dots seguem iguais. -->
        <span
          class="aviso-comodos ${fora > 0 ? '' : 'is-vazio'}"
          title="Cômodos ativos na outra página"
          aria-hidden=${fora > 0 ? 'false' : 'true'}
          >${fora > 0 ? fora : ''}</span
        >
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
    // A linha de estado semântico saiu do card (rev.3): eram QUATRO linhas
    // contra três da Agenda, e a diferença virava altura desperdiçada nos dois.
    // O estado continua calculado e vai para o `title`, então a informação não
    // se perde — só deixa de ocupar uma linha.
    const estado = offline ? 'Offline' : down >= 1 ? 'Excelente' : 'Parcial';
    return html`
      <div class="fav-card wifi" title=${`Sinal ${estado}`}>
        <div class="fav-topo">
          <bruno-icon class="fav-icone" icon="wifi"></bruno-icon>
          <strong>Wi-Fi</strong>
        </div>
        <div class="wifi-rede">${offline ? 'Sem rede' : bruto}</div>
        <div class="wifi-taxas">
          <span>↓ ${down.toFixed(1)}</span><span>↑ ${up.toFixed(1)}</span>
        </div>
      </div>
    `;
  }

  /**
   * Card ÚNICO de Favoritos com as quatro ações dentro.
   *
   * Sem título "Cenas" e sem card separado: o mockup pede um bloco só, e um
   * título extra roubaria a altura que a seção não tem.
   */
  private _cenas() {
    const cenas = (this._config?.scenes ?? []).slice(0, 4);
    return html`
      <div class="fav-card cenas">
        ${cenas.map(
          (cena) => html`
            <button
              class="cena"
              type="button"
              aria-label=${cena.label}
              @click=${() =>
                this._hass?.callService('script', 'turn_on', { entity_id: cena.script })}
            >
              <bruno-icon class="cena-icone" icon=${cena.icon ?? 'circle'}></bruno-icon>
              <span class="cena-nome">${cena.label}</span>
            </button>
          `,
        )}
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
      | { items?: Array<{ text?: string; detail?: string }> }
      | undefined;

    // As páginas são as MESMAS da faixa que saiu do hero: o compromisso na
    // frente quando existe, seguido das informações da casa. A rotação de 6 s
    // reproduz a cadência daquela faixa (BRUNO_CHAT_ROTATION_MS no patch).
    // ITEM 6 (2026-08-22): a alternancia deixou de ser so de conteudo. Cada
    // pagina carrega o TIPO, e dele saem titulo, icone e a existencia de acao.
    // No insight o `detail` NAO e exibido: e onde vinha a chamada de toque
    // ('Toque para abrir o comodo'), e o estado de insight nao tem acao.
    const paginas: Array<{ tipo: 'agenda' | 'insight'; marca: string; texto: string }> = [];
    if (titulo) paginas.push({ tipo: 'agenda', marca: hora || 'Hoje', texto: titulo });
    for (const item of insights?.items ?? []) {
      const texto = String(item?.text ?? '').trim();
      if (texto) paginas.push({ tipo: 'insight', marca: '', texto });
    }
    if (!paginas.length) {
      paginas.push({ tipo: 'agenda', marca: 'Hoje', texto: 'Sem compromissos' });
    }

    const indice = this._pagAgenda % paginas.length;
    const atual = paginas[indice] ?? paginas[0];
    const ehAgenda = atual?.tipo !== 'insight';
    // So abre o calendario quando ha calendario configurado E a pagina atual
    // e a da agenda. O estado de insight nao tem acao de clique.
    const abre = ehAgenda && Boolean(cfg.calendarEntity);
    return html`
      <div
        class="fav-card agenda ${ehAgenda ? '' : 'is-insight'} ${abre ? 'is-clicavel' : ''}"
        role=${abre ? 'button' : nothing}
        tabindex=${abre ? '0' : nothing}
        aria-label=${abre ? 'Abrir agenda' : nothing}
        @click=${abre ? this._abrirAgenda : nothing}
        @keydown=${abre ? this._teclaAgenda : nothing}
      >
        <div class="fav-topo">
          <bruno-icon
            class="fav-icone"
            icon=${ehAgenda ? 'mdi:calendar-month-outline' : 'mdi:pulse'}
          ></bruno-icon>
          <strong>${ehAgenda ? 'Agenda' : 'Insights'}</strong>
          ${paginas.length > 1
            ? html`<span class="agenda-dots">
                ${paginas.map((_, i) => html`<i class=${i === indice ? 'is-atual' : ''}></i>`)}
              </span>`
            : nothing}
        </div>
        ${ehAgenda
          ? html`<div class="agenda-marca">${atual?.marca ?? ''}</div>`
          : nothing}
        <div class="agenda-titulo">${atual?.texto ?? ''}</div>
      </div>
    `;
  }

  private _teclaAgenda = (ev: KeyboardEvent): void => {
    if (ev.key !== 'Enter' && ev.key !== ' ') return;
    ev.preventDefault();
    void this._abrirAgenda();
  };

  /**
   * Agenda completa no telefone.
   *
   * Reusa o MESMO `bruno-agenda-card` do tablet — nao ha segunda agenda. O
   * recipiente e um <dialog> com showModal(): renderiza na top layer do
   * navegador, acima do dock e imune ao overflow dos ancestrais. Foi o
   * caminho que resolveu o painel de comodo do bruno-room-tile.
   */
  private _abrirAgenda = async (): Promise<void> => {
    const cfg = this._config?.favorites?.agenda ?? {};
    if (!cfg.calendarEntity) return;
    const dialogo = this.renderRoot.querySelector('dialog.agenda-modal') as
      | (HTMLElement & { showModal?: () => void })
      | null;
    const host = this.renderRoot.querySelector('.agenda-modal-corpo') as HTMLElement | null;
    if (!dialogo || !host) return;
    dialogo.showModal?.();
    await this._montar(host, {
      type: 'custom:bruno-agenda-card',
      calendars: [cfg.calendarEntity, ...(cfg.extraCalendars ?? [])],
      days_to_show: 7,
    });
  };

  private _fecharAgenda = (): void => {
    const dialogo = this.renderRoot.querySelector('dialog.agenda-modal') as
      | (HTMLElement & { close?: () => void })
      | null;
    dialogo?.close?.();
  };

  private _favoritos() {
    return html`
      <h2 class="titulo is-favoritos">Favoritos</h2>
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
      <h2 class="titulo is-rodando">Em execução</h2>
      <div class="rodando" data-card-host=${JSON.stringify(this._config.dynamicCard)}></div>
    `;
  }

  protected override render() {
    if (!this._config) return nothing;
    return html`
      <div class="estatico">
        <h2 class="titulo">Cômodos</h2>
        ${this._pager()} ${this._indicadores()} ${this._favoritos()}
      </div>
      ${this._emExecucao()}
      ${this._modalAgenda()}
    `;
  }

  /**
   * Recipiente da agenda completa (item 6).
   *
   * <dialog> + showModal(): top layer do navegador, acima do dock e imune ao
   * overflow dos ancestrais. O card so e criado no primeiro toque — enquanto
   * ninguem abre, nao ha busca de calendario nem custo de render.
   */
  private _modalAgenda() {
    return html`
      <dialog class="agenda-modal" @click=${this._fecharPorFora} @cancel=${this._fecharAgenda}>
        <div class="agenda-modal-painel">
          <div class="agenda-modal-topo">
            <bruno-icon class="fav-icone" icon="mdi:calendar-month-outline"></bruno-icon>
            <strong>Agenda</strong>
            <button class="agenda-modal-x" @click=${this._fecharAgenda} aria-label="Fechar">
              <bruno-icon icon="mdi:chevron-down"></bruno-icon>
            </button>
          </div>
          <div class="agenda-modal-corpo"></div>
        </div>
      </dialog>
    `;
  }

  /** Toque no escurecimento fecha; toque no painel nao. */
  private _fecharPorFora = (ev: Event): void => {
    const alvo = ev.target as HTMLElement | null;
    if (alvo?.classList.contains('agenda-modal')) this._fecharAgenda();
  };

  static override styles = css`
    /* O componente só é montado pelo card com show.mediaquery (max-width:800px),
       mas o :host guarda o breakpoint de novo: se algum dia ele for colocado
       noutro lugar, não vaza geometria de telefone para o tablet. */
    @media (min-width: 801px) {
      :host {
        display: none;
      }
    }

    /* ── ALTURA ────────────────────────────────────────────────────────────
       O compositor ocupa a linha do grid externo, que no telefone é
       minmax(0, 1fr). Cômodos tem altura fixa e conhecida; FAVORITOS recebe o
       que sobra (1fr) e por isso termina exatamente onde a rail começa.

       É a inversão que o desenho pedia: a rail determina a altura de
       Favoritos, não o contrário. Nada aqui é calibrado em pixel de aparelho.

       "Em execução" e uma faixa automatica e so existe quando há atividade — é ele, e só
       ele, que faz o conteúdo passar da viewport e habilitar a rolagem. */
    :host {
      display: flex;
      flex-direction: column;
      /* MEDIDO (rev.4): com o host esticado e "Em execucao" na mesma grade, o
         auto da secao dinamica disputava altura com o 1fr de Favoritos — o
         bloco encolhia de 252,8px para 136,6px e o titulo aparecia ACIMA do
         filete. Com align-self: start o host mede o CONTEUDO, e min-height
         100% garante que, sem atividade, ele ainda preencha ate a rail. */
      height: 100%;
      width: 100%;
      min-width: 0;
      color: var(--bruno-text-main, rgba(245, 250, 255, 0.96));
    }

    /* O estatico preenche e NAO encolhe; a secao em execucao flui depois e
       transborda, que e o que habilita a rolagem. */
    .estatico {
      display: grid;
      /* CINCO filhos: titulo Comodos, pager, indicadores, titulo Favoritos e a
         grade de Favoritos. Com quatro linhas o 1fr caia no TITULO e a grade
         ficava no auto implicito — media 136,6px em vez de preencher. */
      grid-template-rows: auto auto auto auto minmax(0, 1fr);
      /* A altura NAO vem do CSS: vem de --altura-util, medida em runtime.

         Tentativas anteriores, todas medidas e descartadas:
          - 1fr na mesma grade do "Em execucao": a secao dinamica disputava
            altura e Favoritos caia de 252,8px para 136,6px;
          - min-height 100%: o grid da secao cresce com o transbordo, a linha
            1fr cresce junto e Favoritos inflava para 727,2px — laco.

         O que nao cresce e o content-slot da shell (viewport menos a rail).
         Entao a altura util e slotBottom - topoDoHost, medida com
         ResizeObserver. E medicao, nao calibragem: nao ha numero de aparelho
         aqui, e qualquer viewport chega ao mesmo resultado. */
      height: var(--altura-util, auto);
      flex: 0 0 auto;
    }

    .titulo {
      margin: 0 0 5px;
      font-size: 14px;
      font-weight: 700;
      letter-spacing: 0.01em;
      color: var(--bruno-text-main, rgba(245, 250, 255, 0.96));
    }
    /* Respiro entre Cômodos e Favoritos reduzido de propósito: é altura que
       vai direto para os cards de Favoritos. */
    .titulo.is-favoritos,
    .titulo.is-rodando {
      margin-top: 7px;
    }

    /* ── pager ── */
    .pager {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: 100%;
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

    /* Duas linhas de 172px + um gap. Altura intrínseca: nada depende de vh
       nem de track de 0px no grid externo. */
    .pagina {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: 172px;
      gap: 8px;
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
      border-radius: var(--bruno-liquid-card-radius, 16px);
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
      padding: 6px 0 0;
      /* C3: a linha passa a ser sempre da altura do aviso (16px), que e o
         elemento mais alto aqui. ANTERIOR (rollback): min-height: 12px. */
      min-height: 16px;
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
      min-width: 16px;
      height: 16px;
      padding: 0 4px;
      border-radius: 8px;
      background: var(--bruno-accent-amber, #f7c600);
      color: rgba(12, 14, 20, 0.92);
      font: 700 10.5px/1 system-ui, -apple-system, sans-serif;
    }

    /* C3: sem aviso a caixa continua ocupando o mesmo espaco — so o
       desenho some. visibility, nao display: display: none devolveria a
       largura ao flex e mexeria na centralizacao dos dots. */
    .aviso-comodos.is-vazio {
      visibility: hidden;
    }

    /* ── favoritos ──────────────────────────────────────────────────────────
       Mesmas colunas e o MESMO gap da seção de cômodos: duas faixas iguais de
       1fr separadas por 8px. Assim as bordas dos dois blocos ficam alinhadas
       verticalmente.

       A coluna da esquerda empilha Agenda e Wi-Fi em duas linhas iguais com o
       mesmo gap, então a soma das duas alturas mais o respiro fecha exatamente
       a altura do card da direita. */
    .favoritos {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
      min-height: 0;
    }
    /* rev.3: as duas linhas medem o CONTEUDO (auto), nao a sobra (1fr). Como
       Agenda e Wi-Fi tem 3 linhas cada, saem com a mesma altura por construcao.
       O card de Cenas, na coluna vizinha, estica e fica valendo exatamente
       Agenda + gap + Wi-Fi — a regra pedida, sem calculo em pixel. */
    /* rev.4, MEDIDO: dimensionar por conteudo dava a cada linha a sua PROPRIA
       altura —
       agenda 61,2px contra wifi 64,3px. Com 1fr as duas dividem a coluna em
       partes iguais, entao saem identicas por construcao, e o card de Cenas
       (que estica ao lado) vale exatamente Agenda + gap + Wi-Fi. */
    .fav-coluna {
      display: grid;
      grid-template-rows: repeat(2, minmax(0, 1fr));
      gap: 8px;
      min-width: 0;
      min-height: 0;
    }

    /* ── SUPERFÍCIE ─────────────────────────────────────────────────────────
       Os mesmos tokens que os demais cards consomem. Ao trocar de tema, estes
       valores mudam com ele — não há cor fixa aqui, só o fallback de segurança
       para o caso de o tema não ter carregado ainda. */
    /* rev.3: alinhado ao TOPO, nao centrado. Centrado, a Agenda (3 linhas)
       sobrava espaco em cima e embaixo enquanto o Wi-Fi (4 linhas) enchia — as
       duas mediam igual, mas so uma parecia cheia. Com o topo como referencia e
       as duas em 3 linhas, o respiro inferior fecha igual ao superior sozinho. */
    .fav-card {
      display: flex;
      flex-direction: column;
      justify-content: flex-start;
      gap: 1px;
      padding: 7px 11px;
      min-width: 0;
      min-height: 0;
      overflow: hidden;
      border-radius: var(--bruno-liquid-card-radius, 16px);
      background: var(--bruno-liquid-card-background, rgba(255, 255, 255, 0.06));
      border: 1px solid var(--bruno-liquid-card-border, rgba(255, 255, 255, 0.105));
      box-shadow: var(--bruno-liquid-card-shadow, none);
      backdrop-filter: var(--bruno-liquid-card-filter, none);
      -webkit-backdrop-filter: var(--bruno-liquid-card-filter, none);
    }
    .fav-card > * {
      min-width: 0;
    }
    .fav-topo {
      display: flex;
      align-items: center;
      gap: 5px;
      font-size: 11px;
      color: var(--bruno-text-soft, rgba(255, 255, 255, 0.58));
    }
    .fav-icone {
      --mdc-icon-size: 13px;
      width: 13px;
      height: 13px;
      opacity: 0.8;
      flex: 0 0 13px;
    }

    /* ── agenda ── */
    .agenda-dots {
      display: flex;
      gap: 3px;
      margin-left: auto;
    }
    .agenda-dots i {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.22);
    }
    .agenda-dots i.is-atual {
      background: var(--bruno-accent-amber, #f7c600);
    }
    .agenda-marca {
      font-size: 11px;
      font-weight: 700;
      color: var(--bruno-accent-amber, #f7c600);
      font-variant-numeric: tabular-nums;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .agenda-titulo {
      font-size: 12px;
      font-weight: 600;
      line-height: 1.2;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }

    /* ITEM 6 (2026-08-22): no estado de insight o card perde a linha de
       marca (era onde vinha a chamada de toque) — o texto ganha a linha
       livre em vez de deixar buraco. A ALTURA nao muda: ela vem da coluna
       (repeat(2, minmax(0,1fr))), nao do conteudo. */
    .agenda.is-insight .agenda-titulo {
      -webkit-line-clamp: 3;
    }
    .agenda.is-clicavel {
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .agenda.is-clicavel:active {
      transform: scale(0.985);
    }
    .agenda {
      transition: transform 140ms ease;
    }

    /* ── agenda completa (modal) ── */
    .agenda-modal {
      margin: 0;
      padding: 0;
      border: 0;
      inset: 0;
      width: 100vw;
      max-width: 100vw;
      height: 100dvh;
      max-height: 100dvh;
      background: transparent;
      overflow: hidden;
    }
    .agenda-modal::backdrop {
      background: rgba(6, 8, 12, 0.62);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
    }
    .agenda-modal[open] {
      display: flex;
      align-items: flex-end;
      justify-content: center;
    }
    /* Folha na base, como as das subviews: o polegar alcanca, e ela para
       acima do dock lendo a altura que a shell publica. */
    .agenda-modal-painel {
      width: 100%;
      max-height: calc(100dvh - var(--bruno-dock-h, 58px) - 24px);
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 12px calc(var(--bruno-dock-h, 58px) + 12px);
      border-radius: var(--bruno-liquid-card-radius, 20px)
        var(--bruno-liquid-card-radius, 20px) 0 0;
      background: var(--bruno-liquid-card-background, rgba(20, 22, 28, 0.92));
      border: 1px solid var(--bruno-liquid-card-border, rgba(255, 255, 255, 0.105));
      box-shadow: var(--bruno-liquid-card-shadow, none);
      backdrop-filter: var(--bruno-liquid-card-filter, none);
      -webkit-backdrop-filter: var(--bruno-liquid-card-filter, none);
      color: var(--bruno-text-main, rgba(245, 250, 255, 0.96));
    }
    .agenda-modal-topo {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--bruno-text-soft, rgba(255, 255, 255, 0.58));
    }
    .agenda-modal-x {
      margin-left: auto;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 30px;
      height: 30px;
      border: 0;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.08);
      color: inherit;
      cursor: pointer;
    }
    .agenda-modal-x bruno-icon {
      --mdc-icon-size: 16px;
      width: 16px;
      height: 16px;
    }
    .agenda-modal-corpo {
      flex: 1 1 auto;
      min-height: 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* ── wi-fi ── */
    .wifi-rede {
      font-size: 12.5px;
      font-weight: 650;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .wifi-estado {
      font-size: 10.5px;
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
      gap: 9px;
      font-size: 11px;
      font-weight: 700;
      color: var(--bruno-accent-amber, #f7c600);
      font-variant-numeric: tabular-nums;
    }

    /* ── cenas: UM card com as quatro ações dentro ── */
    .cenas {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-template-rows: repeat(2, minmax(0, 1fr));
      gap: 6px;
      padding: 8px;
      justify-content: stretch;
    }
    .cena {
      display: grid;
      grid-template-rows: auto auto;
      align-content: center;
      justify-items: center;
      gap: 3px;
      padding: 4px 3px;
      min-width: 0;
      min-height: 0;
      border-radius: calc(var(--bruno-liquid-card-radius, 16px) * 0.6);
      cursor: pointer;
      color: inherit;
      text-align: center;
      background: var(--bruno-liquid-control-background, rgba(255, 255, 255, 0.05));
      border: 1px solid var(--bruno-liquid-control-border, rgba(255, 255, 255, 0.1));
      transition: transform 120ms ease;
    }
    .cena:active {
      transform: translateY(1px);
    }
    .cena-icone {
      --mdc-icon-size: 17px;
      width: 17px;
      height: 17px;
      opacity: 0.88;
    }
    .cena-nome {
      font-size: 9.5px;
      font-weight: 600;
      line-height: 1.05;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      max-width: 100%;
    }

    .rodando > * {
      display: block;
      min-width: 0;
    }

    @media (prefers-reduced-motion: reduce) {
      .dot,
      .cena {
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
