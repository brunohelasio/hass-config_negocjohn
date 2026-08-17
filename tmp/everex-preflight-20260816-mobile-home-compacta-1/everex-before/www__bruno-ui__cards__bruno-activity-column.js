// ============================================================================
// bruno-activity-column — ÁREA DINÂMICA DE ATIVIDADES (Home V2, mecânica B).
// Criado em 2026-07-25 após o feedback da rev.3.
//
// POR QUE UM CONTAINER JS (mecânica B) SUBSTITUIU OS `conditional` (mecânica A):
//   1. Ancoragem na base exigia `height: 100%`, que NAO resolve nesta base —
//      o HA 2026.3 envolve cada card num <hui-card> com height auto, quebrando
//      a cadeia de porcentagem (causa confirmada do empilhamento de cima p/
//      baixo nas rev.2/rev.3). Aqui a altura é EXPLÍCITA (config) e medida.
//   2. Dimensionar por CONTAGEM de cards ativos é impossível em CSS puro:
//      cards `conditional` ocultos permanecem no DOM, então :nth-child e
//      quantity queries contam os invisíveis.
//   3. "Ordem de ativação" é estado temporal — não existe em CSS.
//   4. Bônus: animação de SAÍDA (a mecânica A só permitia entrada).
//
// REGRAS DE LAYOUT (definidas pelo usuário em 2026-07-25):
//   - máximo de 2 cards EMPILHADOS por coluna (3 ficariam baixos demais);
//   - o 1º card ativado senta na BASE da coluna direita; os seguintes vão
//     sendo empilhados ACIMA dele (ordem visual baixo->cima = cronológica);
//   - o 3º card abre uma SEGUNDA COLUNA à esquerda, mesma largura, também
//     preenchida de baixo para cima;
//   - alturas: câmera e Roborock são FIXAS (reduzir quebra a estrutura/
//     visibilidade). Só o card de MÍDIA aceita redução (min_height) — usado
//     apenas quando a altura útil não comporta a dupla.
//   - se nem assim couber (janela estreita / 2ª coluna indisponível), o card
//     MAIS ANTIGO sai — nunca se corta um card.
//
// Os cards são criados UMA ÚNICA VEZ (loadCardHelpers) e nunca destruídos:
// só mudam de posição/visibilidade. Isso evita reiniciar o stream da câmera
// e o piscar da arte da mídia. A posição é dada por grid-column/grid-row
// inline — sem mover nada no DOM.
//
// FALLBACK: a versão `conditional` (mecânica A) está preservada em
// v2/legacy/bento_dynamic_conditional.yaml — basta trocar o include em
// shell/section_home_v2.yaml.
// ============================================================================

const BRUNO_ACTIVITY_COLUMN_TAG = 'bruno-activity-column';

const BRUNO_ACTIVITY_COLUMN_DEFAULTS = {
  // Espelha a linha do hero em shell/section_home_v2.yaml. Se a régua do grid
  // mudar lá, mudar AQUI também (referência cruzada anotada nos dois arquivos).
  available_height: 'calc(77vh - 154px)',
  max_per_column: 2,
  gap: 12,
  // REV.7 (2026-07-25) — TRAVA DE LARGURA REMOVIDA (0 = sem trava).
  // Era a ÚNICA coisa capaz de impedir a 2ª coluna, e dependia de medir o
  // host em tempo de execução — medida que falha silenciosamente quando o
  // elemento é avaliado antes do layout ou com a seção oculta (a shell
  // esconde seções com `hidden`). Como a área `dynamic` é uma coluna
  // PRÓPRIA do grid da seção (8 de 12 colunas), a coluna esquerda nunca
  // invade o hero — a trava protegia contra um risco que não existe.
  // Agora o comportamento é determinístico: a 2ª coluna sempre existe.
  // (Config mantida por compatibilidade; > 0 volta a travar.)
  second_column_min_width: 0,
  // Overlay de diagnóstico (largura/altura medidas + plano). Ligar com
  // `debug: true` no YAML quando algo não posicionar como esperado.
  debug: false,
  slots: [
    {
      key: 'camera',
      entity: 'binary_sensor.home_activity_camera',
      height: 296,
      card: { type: 'custom:bruno-home-camera-card' },
    },
    {
      key: 'roborock',
      entity: 'binary_sensor.home_activity_roborock',
      height: 176,
      card: { type: 'custom:bruno-roborock-card', variant: 'compact' },
    },
    {
      key: 'media',
      entity: 'binary_sensor.home_activity_media',
      height: 248,
      // ÚNICO card que aceita compressão (decisão do usuário 2026-07-25).
      min_height: 196,
      card: { type: 'custom:bruno-media-card', variant: 'wide' },
    },
  ],
};

const BRUNO_ACTIVITY_COLUMN_ENTER_MS = 260;
const BRUNO_ACTIVITY_COLUMN_EXIT_MS = 220;

class BrunoActivityColumn extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      ...BRUNO_ACTIVITY_COLUMN_DEFAULTS,
      ...(config || {}),
      slots: Array.isArray(config?.slots) && config.slots.length
        ? config.slots
        : BRUNO_ACTIVITY_COLUMN_DEFAULTS.slots,
    };
    this._cards = this._cards || new Map();
    this._wrappers = this._wrappers || new Map();
    this._activeSince = this._activeSince || new Map();
    this._visible = this._visible || new Set();
    this._enterTimers = this._enterTimers || new Map();
    this._exitTimers = this._exitTimers || new Map();
    this._renderShell();
    this._ensureCards();
  }

  set hass(hass) {
    this._hass = hass;
    this._cards.forEach((card) => {
      try {
        card.hass = hass;
      } catch (_error) {
        // Um card individual não pode derrubar a coluna inteira.
      }
    });
    this._update();
  }

  connectedCallback() {
    if (!this._resizeObserver && typeof ResizeObserver === 'function') {
      this._resizeObserver = new ResizeObserver(() => this._update());
      this._resizeObserver.observe(this);
    }
    this._update();
    // REV.7: no primeiro attach o layout ainda pode não estar resolvido —
    // remede no próximo frame para não planejar com medida provisória.
    globalThis.requestAnimationFrame?.(() => this._update());
  }

  disconnectedCallback() {
    this._resizeObserver?.disconnect();
    this._resizeObserver = null;
    this._enterTimers.forEach((timer) => window.clearTimeout(timer));
    this._enterTimers.clear();
    this._exitTimers.forEach((timer) => window.clearTimeout(timer));
    this._exitTimers.clear();
  }

  getCardSize() {
    return 8;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  async _ensureCards() {
    if (this._creating) return;
    this._creating = true;
    try {
      const helpers = await globalThis.loadCardHelpers?.();
      if (!helpers?.createCardElement) throw new Error('loadCardHelpers indisponivel');

      this._config.slots.forEach((slot) => {
        if (this._cards.has(slot.key)) return;
        const wrapper = this._wrappers.get(slot.key);
        if (!wrapper || !slot.card) return;
        const element = helpers.createCardElement(slot.card);
        if (this._hass) element.hass = this._hass;
        wrapper.appendChild(element);
        this._cards.set(slot.key, element);
      });
    } catch (error) {
      // Sem os helpers a área fica vazia (o hero segue visível) — o dashboard
      // não quebra. O fallback documentado é voltar ao arquivo conditional.
      console.warn('[bruno-activity-column] falha ao criar cards:', error);
    } finally {
      this._creating = false;
      this._update();
    }
  }

  // Lista de chaves ativas em ORDEM DE ATIVAÇÃO (mais antiga primeiro).
  _activeKeys() {
    const now = Date.now();
    const active = [];

    this._config.slots.forEach((slot) => {
      const state = String(this._state(slot.entity)?.state || '').toLowerCase();
      const isActive = state === 'on';
      if (isActive) {
        if (!this._activeSince.has(slot.key)) this._activeSince.set(slot.key, now);
        active.push(slot.key);
      } else {
        this._activeSince.delete(slot.key);
      }
    });

    return active.sort((a, b) => (this._activeSince.get(a) || 0) - (this._activeSince.get(b) || 0));
  }

  _slotConfig(key) {
    return this._config.slots.find((slot) => slot.key === key);
  }

  _slotEntry(key) {
    const slot = this._slotConfig(key) || {};
    const height = Number(slot.height) || 200;
    const minHeight = Math.min(Number(slot.min_height) || height, height);
    return { key, height, minHeight };
  }

  // Altura mínima que uma coluna precisa para acomodar este conjunto.
  _columnMinHeight(keys, gap) {
    if (!keys.length) return 0;
    return keys.reduce((sum, key) => sum + this._slotEntry(key).minHeight, 0)
      + gap * (keys.length - 1);
  }

  // Distribui as chaves ativas em colunas. Map(key -> {column, row, height});
  // column 2 = coluna direita (principal), column 1 = coluna esquerda.
  //
  // REV.6 (2026-07-25) — CORREÇÃO: antes as colunas eram fatiadas por
  // CONTAGEM (2 primeiras à direita) e o que não coubesse em ALTURA era
  // DESCARTADO ali mesmo, sem nunca chegar à coluna esquerda. Numa janela
  // mais baixa que o tablet a coluna direita só comporta um card, então o
  // 3º card "substituía" o de cima em vez de abrir a 2ª coluna.
  // Agora é preenchimento sequencial: cada card entra na coluna atual
  // enquanto couber (contagem E altura); quando não cabe, TRANSBORDA para a
  // coluna seguinte. Descarte só se não houver mais coluna disponível.
  _plan(activeKeys, availableHeight) {
    const gap = Number(this._config.gap) || 12;
    const maxPerColumn = Math.max(1, Number(this._config.max_per_column) || 2);
    const minWidth = Number(this._config.second_column_min_width) || 0;
    const allowSecondColumn = minWidth <= 0
      || this.getBoundingClientRect().width >= minWidth;

    // Ordem de preenchimento: direita primeiro (o 1º ativado fica na base
    // dela), transbordo para a esquerda.
    const columnOrder = allowSecondColumn ? [2, 1] : [2];
    const remaining = activeKeys.slice();
    const plan = new Map();

    columnOrder.forEach((column) => {
      const chosen = [];
      while (remaining.length && chosen.length < maxPerColumn) {
        const candidate = chosen.concat(remaining[0]);
        if (this._columnMinHeight(candidate, gap) > availableHeight) break;
        chosen.push(remaining.shift());
      }

      // Viewport minúsculo: em vez de coluna vazia com card pendente,
      // mostra ao menos um (a altura é clampada em _fitColumn).
      if (!chosen.length && remaining.length && column === columnOrder[0]) {
        chosen.push(remaining.shift());
      }

      // `chosen` vem em ordem de ativação (mais antigo primeiro). O mais
      // antigo ocupa a ÚLTIMA linha (base da coluna) e os seguintes sobem.
      this._fitColumn(chosen, availableHeight, gap).forEach((entry, index) => {
        plan.set(entry.key, {
          column,
          row: Math.max(1, maxPerColumn - index),
          height: entry.height,
        });
      });
    });

    return plan;
  }

  // Ajusta as alturas de uma coluna ao espaço disponível. Só os slots com
  // min_height (hoje: mídia) encolhem; câmera e Roborock mantêm a altura.
  // A seleção de quem entra na coluna já foi feita em _plan.
  _fitColumn(keys, availableHeight, gap) {
    if (!keys.length) return [];

    const entries = keys.map((key) => this._slotEntry(key));
    const gaps = gap * Math.max(0, entries.length - 1);
    const natural = entries.reduce((sum, entry) => sum + entry.height, 0) + gaps;

    if (natural <= availableHeight) {
      return entries.map(({ key, height }) => ({ key, height }));
    }

    // Distribui o déficit apenas entre os slots flexíveis.
    let deficit = natural - availableHeight;
    const totalSlack = entries.reduce((sum, entry) => sum + (entry.height - entry.minHeight), 0);
    const result = entries.map((entry) => {
      const slack = entry.height - entry.minHeight;
      if (!slack || !totalSlack) return { key: entry.key, height: entry.height };
      const share = Math.min(slack, Math.round((slack / totalSlack) * deficit));
      deficit -= share;
      return { key: entry.key, height: entry.height - share };
    });

    // Último recurso (card único rígido em viewport curto): clampa para não
    // vazar sobre o bloco inferior.
    if (result.length === 1 && result[0].height > availableHeight) {
      result[0].height = Math.max(120, Math.floor(availableHeight));
    }

    return result;
  }

  // REV.7: uma medição ruim (seção oculta pela shell, layout ainda não
  // resolvido) devolvia altura ~0 e derrubava cards do plano. Agora medidas
  // implausíveis são ignoradas e vale a última boa.
  _availableHeight(hasActivePhoneSlot = false) {
    const measured = Math.max(0, this.getBoundingClientRect().height);
    if (measured >= 120) {
      this._lastGoodHeight = measured;
      return measured;
    }
    // No telefone, :host(.is-empty) mede 0px por desenho. Quando a primeira
    // atividade liga, esperar uma medicao positiva criaria um ciclo fechado:
    // sem altura nao ha plano, sem plano o host continua vazio. A configuracao
    // mobile ja fornece a capacidade explicita (300px); ela serve apenas como
    // partida fria. O caminho do tablet continua usando exclusivamente a
    // medicao real/ultima medicao boa.
    const isPhone = globalThis.matchMedia?.('(max-width: 800px)')?.matches === true;
    if (isPhone && hasActivePhoneSlot) {
      const configured = Number.parseFloat(String(this._config?.available_height || ''));
      return this._lastGoodHeight || (Number.isFinite(configured) ? configured : 300);
    }
    return this._lastGoodHeight || 0;
  }

  _update() {
    if (!this._config || !this.shadowRoot) return;

    const activeKeys = this._hass ? this._activeKeys() : [];
    const availableHeight = this._availableHeight(activeKeys.length > 0);
    const plan = availableHeight > 0 ? this._plan(activeKeys, availableHeight) : new Map();
    this._renderDebug(availableHeight, activeKeys, plan);

    this._config.slots.forEach((slot) => {
      const wrapper = this._wrappers.get(slot.key);
      if (!wrapper) return;

      const entry = plan.get(slot.key);
      const wasVisible = this._visible.has(slot.key);

      if (entry) {
        const timer = this._exitTimers.get(slot.key);
        if (timer) {
          window.clearTimeout(timer);
          this._exitTimers.delete(slot.key);
        }

        wrapper.style.gridColumn = String(entry.column);
        wrapper.style.gridRow = String(entry.row);
        wrapper.style.height = `${entry.height}px`;
        wrapper.classList.remove('is-hidden', 'is-leaving');
        if (!wasVisible) {
          const previousEnterTimer = this._enterTimers.get(slot.key);
          if (previousEnterTimer) window.clearTimeout(previousEnterTimer);
          wrapper.classList.remove('is-entering');
          // Reinicia a animação de entrada.
          void wrapper.offsetWidth;
          wrapper.classList.add('is-entering');
          // A classe nao pode permanecer apos a entrada: o transform retido
          // criaria uma camada de composicao permanente e alteraria a leitura
          // de backdrop-filter dos cards dinamicos, sobretudo no tablet.
          const enterTimer = window.setTimeout(() => {
            wrapper.classList.remove('is-entering');
            this._enterTimers.delete(slot.key);
          }, BRUNO_ACTIVITY_COLUMN_ENTER_MS + 40);
          this._enterTimers.set(slot.key, enterTimer);
        }
        this._visible.add(slot.key);
        return;
      }

      if (!wasVisible) {
        wrapper.classList.add('is-hidden');
        return;
      }

      // Saída animada: só então remove do fluxo.
      this._visible.delete(slot.key);
      const enterTimer = this._enterTimers.get(slot.key);
      if (enterTimer) {
        window.clearTimeout(enterTimer);
        this._enterTimers.delete(slot.key);
      }
      wrapper.classList.remove('is-entering');
      wrapper.classList.add('is-leaving');
      const timer = window.setTimeout(() => {
        wrapper.classList.remove('is-leaving');
        wrapper.classList.add('is-hidden');
        this._exitTimers.delete(slot.key);
      }, BRUNO_ACTIVITY_COLUMN_EXIT_MS);
      this._exitTimers.set(slot.key, timer);
    });

    // NOVO (2026-08-10) — MODO TELEFONE. No tablet a coluna divide a linha com
    // o hero e ficar vazia não custa nada: ela é transparente e não captura
    // toque. No telefone ela é uma FAIXA no empilhamento, e uma faixa vazia de
    // 300px empurraria os cômodos para fora da tela. A classe deixa o CSS
    // colapsá-la — só abaixo de 800px; no tablet nada muda.
    // A condicao ativa e a fonte da verdade para reabrir a faixa no telefone.
    // Usar _visible aqui perpetuava a partida fria em 0px antes do primeiro
    // plano. Fora do breakpoint, conserva-se literalmente o criterio anterior
    // do tablet, embora a classe so tenha regra visual no telefone.
    const isPhone = globalThis.matchMedia?.('(max-width: 800px)')?.matches === true;
    this.classList.toggle('is-empty', isPhone ? activeKeys.length === 0 : this._visible.size === 0);
  }

  // Overlay de diagnóstico (config `debug: true`). Mostra exatamente o que o
  // algoritmo mediu e decidiu — evita novo ciclo de tentativa e erro caso
  // algum card não apareça onde deveria.
  _renderDebug(availableHeight, activeKeys, plan) {
    if (!this.shadowRoot) return;
    const box = this.shadowRoot.querySelector('.debug');
    if (!box) return;
    if (!this._config.debug) {
      box.textContent = '';
      return;
    }

    const width = Math.round(this.getBoundingClientRect().width);
    const placed = [...plan.entries()]
      .map(([key, entry]) => `${key}:c${entry.column}r${entry.row}/${entry.height}px`)
      .join('  ');
    const dropped = activeKeys.filter((key) => !plan.has(key));

    box.textContent = [
      `host ${width}x${Math.round(availableHeight)}px`,
      `ativos: ${activeKeys.join(',') || '-'}`,
      `plano: ${placed || '-'}`,
      dropped.length ? `DESCARTADOS: ${dropped.join(',')}` : '',
    ].filter(Boolean).join(' | ');
  }

  _renderShell() {
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (this._shellReady) return;

    const gap = Number(this._config.gap) || 12;
    const rows = Math.max(1, Number(this._config.max_per_column) || 2);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: ${this._config.available_height};
          min-height: 0;
          /* O host cobre também a faixa da 2ª coluna (vazia na maior parte do
             tempo). pointer-events: none deixa o hero clicável por baixo; só
             os cards voltam a capturar o toque. */
          pointer-events: none;
        }

        * { box-sizing: border-box; }

        .columns {
          height: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(${rows}, auto);
          /* Ancora a pilha na BASE (logo acima do bloco inferior). */
          align-content: end;
          align-items: end;
          gap: ${gap}px;
        }

        .slot {
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          pointer-events: auto;
        }

        .slot.is-hidden {
          display: none;
        }

        .slot.is-entering {
          animation: brunoActivityIn ${BRUNO_ACTIVITY_COLUMN_ENTER_MS}ms ease both;
        }

        .slot.is-leaving {
          animation: brunoActivityOut ${BRUNO_ACTIVITY_COLUMN_EXIT_MS}ms ease both;
        }

        /* Os cards internos preenchem o slot (altura vem do wrapper). */
        .slot > * {
          display: block;
          height: 100%;
          min-height: 0;
        }

        @keyframes brunoActivityIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes brunoActivityOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(6px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .slot.is-entering,
          .slot.is-leaving {
            animation: none !important;
          }
        }

        /* NOVO (2026-08-10) — MODO TELEFONE.
           No telefone a coluna vira uma FAIXA do empilhamento: uma coluna só,
           ancorada no topo, e colapsada quando não há nada ativo. A colocação
           calculada em _plan vem por estilo inline (grid-column/grid-row), daí
           o !important — é o único jeito de a media query vencer o inline.
           ROLLBACK: remover este bloco. O tablet não é tocado por ele. */
        @media (max-width: 800px) {
          :host(.is-empty) {
            height: 0;
          }
          .columns {
            grid-template-columns: minmax(0, 1fr);
            grid-auto-rows: auto;
            align-content: start;
            align-items: start;
          }
          .slot {
            grid-column: 1 / -1 !important;
            grid-row: auto !important;
          }
        }

        /* Overlay de diagnóstico (só com debug: true). */
        .debug {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          z-index: 9;
          padding: 4px 8px;
          font: 600 10px/1.3 ui-monospace, monospace;
          color: rgba(255,255,255,0.92);
          background: rgba(0,0,0,0.62);
          border-radius: 8px;
          pointer-events: none;
          white-space: pre-wrap;
        }

        .debug:empty {
          display: none;
        }
      </style>

      <div class="columns" role="region" aria-label="Atividades da casa">
        ${this._config.slots.map((slot) => `
          <div class="slot is-hidden" data-slot-key="${BrunoActivityColumn._escapeAttr(slot.key)}"></div>
        `).join('')}
      </div>
      <div class="debug" aria-hidden="true"></div>
    `;

    this._wrappers.clear();
    this.shadowRoot.querySelectorAll('[data-slot-key]').forEach((wrapper) => {
      this._wrappers.set(wrapper.dataset.slotKey, wrapper);
    });
    this._shellReady = true;
  }

  static _escapeAttr(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }
}

if (!customElements.get(BRUNO_ACTIVITY_COLUMN_TAG)) {
  customElements.define(BRUNO_ACTIVITY_COLUMN_TAG, BrunoActivityColumn);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_ACTIVITY_COLUMN_TAG,
  name: 'Bruno Activity Column',
  preview: false,
  description: 'Home V2 dynamic activity area: bottom-anchored stack, max 2 per column, overflow to a second column.',
});
