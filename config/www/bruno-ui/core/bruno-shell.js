// bruno-shell.js — App-shell em JavaScript (Etapa 1).
//
// Objetivo: uma barra lateral FIXA (rail) que nunca re-monta + uma regiao de
// conteudo que troca de SECAO no lugar (sem trocar de view do HA). A view do HA
// e unica (type: panel) e seu unico card e <bruno-shell>; por isso a rail nunca
// re-monta e nao ha "degrau" ao alternar.
//
// Principios (ver docs/bruno-shell-spec.md):
//  - REUSA os cards/subviews existentes via window.loadCardHelpers() — NAO edita
//    nenhum conteudo. A shell so instancia e posiciona.
//  - Roteamento por hash (#home, #cameras, ...). Mudar o hash NAO troca a view.
//  - Itens de SECAO na rail usam action: fire-dom-event com `bruno_section: <key>`;
//    a shell intercepta o evento `ll-custom`, troca a secao e atualiza a selecao
//    da rail (sem reconstruir a rail).
//  - Itens de POPUP/navegacao da rail seguem inalterados (overlays/navegacao).

const BRUNO_SHELL_TAG = 'bruno-shell';

class BrunoShell extends HTMLElement {
  constructor() {
    super();
    this._activeKey = null;
    this._railEl = null;
    this._sectionEl = null;
    this._helpers = null;
    this._built = false;
    this._onHashChange = () => this._syncFromHash();
    this._onLlCustom = (event) => {
      const key = event && event.detail && event.detail.bruno_section;
      if (key) {
        event.stopPropagation();
        this._goToSection(key);
      }
    };
  }

  // --- Lovelace card API -----------------------------------------------------

  setConfig(config) {
    if (!config) throw new Error('bruno-shell: config ausente');
    this._config = config;
    this._sections = config.sections || {};
    this._defaultSection = config.default_section || Object.keys(this._sections)[0] || 'home';
    // NOVO (Etapa A): rail por SEÇÃO (mantém retrocompat com `rail` único).
    //  - `rails`: mapa de configs de rail (ex.: { default: <app-nav>, rooms: <Home+cômodos> });
    //  - `section_rails`: { <secao>: <nome-do-rail> };
    //  - `default_rail`: nome do rail padrão.
    // Sem `rails` no config => mecanismo DORMENTE (rail único de hoje, inalterado).
    this._rails = config.rails || null;
    this._sectionRails = config.section_rails || {};
    this._defaultRailName = config.default_rail || 'default';
    this._railConfig = config.rail
      || (this._rails ? this._rails[this._defaultRailName] : null);
    this._currentRailName = null;
    this._built = false;
    this._build();
  }

  set hass(hass) {
    this._hass = hass;
    if (this._railEl) this._railEl.hass = hass;
    if (this._sectionEl) this._sectionEl.hass = hass;
  }

  getCardSize() {
    return 100;
  }

  // --- Ciclo de vida ---------------------------------------------------------

  connectedCallback() {
    globalThis.BrunoLiquidGlass && globalThis.BrunoLiquidGlass.apply && globalThis.BrunoLiquidGlass.apply();
    globalThis.addEventListener('hashchange', this._onHashChange);
    globalThis.addEventListener('location-changed', this._onHashChange);
    this.addEventListener('ll-custom', this._onLlCustom);
    if (this._built) this._syncFromHash();
  }

  disconnectedCallback() {
    globalThis.removeEventListener('hashchange', this._onHashChange);
    globalThis.removeEventListener('location-changed', this._onHashChange);
    this.removeEventListener('ll-custom', this._onLlCustom);
  }

  // --- Helpers ---------------------------------------------------------------

  async _ensureHelpers() {
    if (!this._helpers && globalThis.loadCardHelpers) {
      this._helpers = await globalThis.loadCardHelpers();
    }
    return this._helpers;
  }

  async _createCard(config) {
    const helpers = await this._ensureHelpers();
    if (!helpers) throw new Error('loadCardHelpers indisponivel');
    const el = helpers.createCardElement(config);
    if (this._hass) el.hass = this._hass;
    // Re-propaga hass quando o elemento sinalizar que precisa (cards lazy).
    el.addEventListener('ll-rebuild', () => {
      if (this._hass) el.hass = this._hass;
    });
    return el;
  }

  // --- Construcao da moldura -------------------------------------------------

  async _build() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    this.shadowRoot.innerHTML = `
      <style>${BrunoShell._styles()}</style>
      <div class="shell">
        <div class="rail-slot" id="rail"></div>
        <div class="content-slot" id="content"></div>
      </div>
    `;

    // Rail: criada UMA vez e mantida viva (nunca recriada).
    try {
      if (this._railConfig) {
        this._railEl = await this._createCard(this._railConfig);
        this._currentRailName = this._rails ? this._defaultRailName : null;
        const railSlot = this.shadowRoot.getElementById('rail');
        if (railSlot) railSlot.replaceChildren(this._railEl);
      }
    } catch (error) {
      this._renderRailError(error);
    }

    this._built = true;
    this._syncFromHash();
  }

  // --- Secoes ----------------------------------------------------------------

  _currentHashKey() {
    const raw = (globalThis.location && globalThis.location.hash) || '';
    const key = raw.replace(/^#/, '');
    return this._sections && this._sections[key] ? key : this._defaultSection;
  }

  _syncFromHash() {
    if (!this._built) return;
    const key = this._currentHashKey();
    if (key === this._activeKey) {
      this._updateRailSelection(key);
      return;
    }
    this._setSection(key);
  }

  _goToSection(key) {
    if (!this._sections || !this._sections[key]) return;
    const current = ((globalThis.location && globalThis.location.hash) || '').replace(/^#/, '');
    if (current !== key) {
      // Muda o hash → dispara hashchange → _syncFromHash (sem trocar a view).
      globalThis.location.hash = key;
    } else {
      this._setSection(key);
    }
  }

  async _setSection(key) {
    const config = this._sections && this._sections[key];
    if (!config) return;
    this._activeKey = key;

    const content = this.shadowRoot && this.shadowRoot.getElementById('content');
    if (!content) return;
    // Fundo da regiao de conteudo e CENTRAL (na shell), por secao: a Home fica
    // transparente (usa o grafite/hero proprio); as demais secoes recebem o
    // fundo ambiente do token --bruno-section-backdrop (ver _styles).
    content.dataset.section = key;

    // NOVO (Etapa A): troca os ITENS do rail conforme a seção (sem recriar o
    // elemento) ANTES de montar o conteúdo, para a moldura não "saltar".
    this._applyRailForSection(key);

    try {
      const el = await this._createCard(config);
      // Se a secao mudou de novo enquanto criava, aborta.
      if (this._activeKey !== key) return;
      this._sectionEl = el;
      content.replaceChildren(el); // remove a secao anterior → dispara seu disconnectedCallback
    } catch (error) {
      this._renderSectionError(content, error);
    }

    this._updateRailSelection(key);
  }

  // NOVO (Etapa A): troca os ITENS do rail conforme a seção, SEM recriar o
  // elemento — a moldura/posição não se move; só os botões internos mudam
  // (ex.: app-nav nas seções gerais; Home + cômodos nas seções de cômodo).
  // O Home permanece ancorado no topo (item 0 das duas listas).
  _applyRailForSection(key) {
    if (!this._rails || !this._railEl) return;        // dormente -> rail único fixo
    const railName = this._sectionRails[key] || this._defaultRailName;
    if (railName === this._currentRailName) return;   // já está nesse rail
    const cfg = this._rails[railName] || this._rails[this._defaultRailName];
    if (!cfg) return;
    this._currentRailName = railName;
    try {
      this._railEl.setConfig(cfg);
      if (this._hass) this._railEl.hass = this._hass;
    } catch (error) {
      // não derruba a shell por erro de rail
      // eslint-disable-next-line no-console
      console.warn('bruno-shell: falha ao trocar rail da secao', key, error);
    }
  }

  // Atualiza o item ativo da rail SEM reconstrui-la (so alterna a classe .selected
  // pelos data-key dos botoes — aditivo no bento-sidebar-card.js).
  _updateRailSelection(key) {
    const root = this._railEl && this._railEl.shadowRoot;
    if (!root) return;
    const buttons = root.querySelectorAll('.nav-button[data-key]');
    if (!buttons.length) {
      // Rail ainda nao renderizou; tenta de novo no proximo frame.
      globalThis.requestAnimationFrame && globalThis.requestAnimationFrame(() => {
        const r = this._railEl && this._railEl.shadowRoot;
        if (!r) return;
        r.querySelectorAll('.nav-button[data-key]').forEach((btn) => {
          btn.classList.toggle('selected', btn.dataset.key === key);
        });
      });
      return;
    }
    buttons.forEach((btn) => {
      btn.classList.toggle('selected', btn.dataset.key === key);
    });
  }

  // --- Erros (nao derrubam a shell) ------------------------------------------

  _renderRailError(error) {
    const railSlot = this.shadowRoot && this.shadowRoot.getElementById('rail');
    if (railSlot) railSlot.innerHTML = `<div class="err">rail: ${BrunoShell._escape(error && error.message)}</div>`;
  }

  _renderSectionError(content, error) {
    content.innerHTML = `<div class="err">secao: ${BrunoShell._escape(error && error.message || error)}</div>`;
  }

  // --- Estilo da moldura -----------------------------------------------------

  static _styles() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        /* ORIGINAL (rollback): gradiente 140deg deixava a BORDA ESQUERDA (onde
           fica o rail) mais escura que o miolo -> rail parecia uma faixa marcada.
           background: linear-gradient(140deg, #07090d 0%, #111722 55%, #07090d 100%); */
        /* NOVO: gradiente VERTICAL (uniforme no eixo X) -> a coluna do rail tem o
           MESMO tom do fundo ao lado, ajudando o rail a fundir com o painel. */
        background: linear-gradient(180deg, #0a0e15 0%, #11161f 100%);
        color: rgba(246,250,255,0.94);
        font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      }

      * { box-sizing: border-box; }

      /* ORIGINAL (rollback): rail flutuante 64px, gap 10px, padding 12px na shell.
        .shell { grid-template-columns: 64px minmax(0,1fr); gap:10px; padding:12px; }
        .rail-slot { grid-column:1; }
        .content-slot { grid-column:2; }
      */
      /* NOVO (Caminho 2): rail RENTE — coluna 86px colada na borda (gap 0, sem
         padding na shell). O respiro migra para o .content-slot (padding 12px).
         Uma fina divisoria vertical (mais forte no centro) separa rail/conteudo. */
      .shell {
        height: 100%;
        display: grid;
        grid-template-columns: 86px minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        gap: 0;
        padding: 0;
      }

      .rail-slot {
        grid-column: 1;
        position: relative;
        min-width: 0;
        min-height: 0;
      }

      .rail-slot::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        pointer-events: none;
        background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.16) 50%, transparent 100%);
      }

      .content-slot {
        grid-column: 2;
        position: relative;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        padding: 12px;
        /* Fundo CENTRAL das secoes (padrao unico, nao por arquivo): por padrao
           TRANSPARENTE -> mostra o grafite do :host (o "escuro atras do hero").
           Para trocar o fundo de TODAS as secoes de uma vez, basta definir
           --bruno-section-backdrop no core (bruno-liquid-glass.js). */
        background: var(--bruno-section-backdrop, transparent);
      }

      /* A secao ativa preenche a regiao de conteudo. */
      .content-slot > * {
        display: block;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }

      .err {
        padding: 16px;
        color: #ffd9df;
        font: 600 13px/1.4 var(--primary-font-family, inherit);
      }
    `;
  }

  static _escape(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

if (!customElements.get(BRUNO_SHELL_TAG)) {
  customElements.define(BRUNO_SHELL_TAG, BrunoShell);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_SHELL_TAG,
  name: 'Bruno Shell',
  description: 'App-shell com barra fixa e conteudo que troca por secao.',
});
