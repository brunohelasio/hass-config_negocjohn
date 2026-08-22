// home-mobile-hero-rail.js — experimento Chat -> GitHub (2026-08-17)
//
// Escopo estrito: Home V2 em phone (<=800px) + microindicador da rail phone.
// O modulo e deliberadamente isolado para validar o conceito sem reescrever os
// arquivos classicos grandes pela Contents API. Depois do aceite visual, pode
// ser incorporado aos componentes de origem em uma rodada propria.
//
// ROLLBACK: remover este arquivo e a unica entrada correspondente em
// configuration.yaml. Nenhum bundle TypeScript e alterado.

const BRUNO_CHAT_PHONE_QUERY = '(max-width: 800px)';
const BRUNO_CHAT_HERO_TAG = 'bruno-hero-card';
const BRUNO_CHAT_RAIL_TAG = 'bento-sidebar-liquid-card';
const BRUNO_CHAT_ROTATION_MS = 6000;

// HOME PHONE (2026-08-22): a faixa rotativa de agenda/insights saiu do hero no
// telefone e passou a viver no card Agenda do bloco Favoritos, com a mesma
// cadencia. Ligar de volta aqui restaura o comportamento anterior por inteiro.
const BRUNO_CHAT_HERO_CAROUSEL = false;

const brunoChatIsPhone = () => Boolean(globalThis.matchMedia?.(BRUNO_CHAT_PHONE_QUERY).matches);

function brunoChatClearHeroTimer(card) {
  if (!card?.__brunoChatHeroTimer) return;
  clearInterval(card.__brunoChatHeroTimer);
  card.__brunoChatHeroTimer = null;
}

function brunoChatApplyHeroPage(card, usefulLines) {
  if (!card?.shadowRoot || !Array.isArray(usefulLines) || !usefulLines.length) return;
  const count = usefulLines.length;
  const index = Math.max(0, Number(card.__brunoChatHeroIndex) || 0) % count;
  card.__brunoChatHeroIndex = index;

  usefulLines.forEach((line, page) => {
    const active = page === index;
    line.classList.toggle('bruno-chat-active', active);
    line.setAttribute('aria-hidden', active ? 'false' : 'true');
    line.tabIndex = active && !line.classList.contains('is-insight') ? 0 : -1;
  });

  card.shadowRoot.querySelectorAll('[data-bruno-chat-dot]').forEach((dot, page) => {
    dot.classList.toggle('is-active', page === index);
  });
}

function brunoChatEnsureHeroStyle(root) {
  if (!root || root.querySelector('style[data-bruno-chat-hero-patch]')) return;
  const style = document.createElement('style');
  style.dataset.brunoChatHeroPatch = '1';
  style.textContent = `
    @media (max-width: 800px) {
      /* ── HOME PHONE (2026-08-22) ───────────────────────────────────────
         ANTERIOR (rollback):
           height: 178px !important;
           min-height: 178px !important;

         Os 178px foram calibrados COM a faixa de agenda/insights embaixo do
         relogio: conteudo (~117px) + carrossel (48px + respiros). A faixa
         migrou para o card Agenda do bloco Favoritos, e a altura fixa passou a
         reservar ~60px de vazio entre o relogio e o titulo "Comodos".

         Altura automatica: o hero passa a medir o proprio conteudo, e o que
         sobra vai para Comodos + Favoritos. Nada aqui depende mais de um
         numero calibrado a mao.

         O carrossel em si e desligado por BRUNO_CHAT_HERO_CAROUSEL (abaixo) —
         nao por CSS, para nao entrar em guerra de especificidade com este
         proprio bloco. */
      .hero-stage.is-v2 {
        height: auto !important;
        min-height: 0 !important;
      }

      .hero-stage.is-v2 .content {
        padding: 6px 16px 7px !important;
        gap: 0 !important;
      }

      .hero-stage.is-v2 .headline {
        column-gap: 12px !important;
      }

      .hero-stage.is-v2 .clock {
        margin-top: 0 !important;
        font-size: clamp(66px, 17vw, 72px) !important;
        line-height: 0.92 !important;
        font-weight: 220 !important;
      }

      .hero-stage.is-v2 .inline-weather {
        display: grid !important;
        grid-template-columns: 24px minmax(0, auto) !important;
        grid-template-rows: auto auto !important;
        grid-template-areas: "weather-icon weather-temp" "weather-icon weather-label" !important;
        align-items: center !important;
        justify-items: start !important;
        column-gap: 7px !important;
        row-gap: 3px !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        margin-top: 0 !important;
        justify-self: end !important;
      }

      .hero-stage.is-v2 .inline-weather img {
        grid-area: weather-icon !important;
        width: 24px !important;
        height: 24px !important;
        align-self: center !important;
      }

      .hero-stage.is-v2 .inline-weather strong {
        grid-area: weather-temp !important;
        font-size: 16px !important;
        line-height: 1 !important;
      }

      .hero-stage.is-v2 .inline-weather small {
        grid-area: weather-label !important;
        max-width: min(35vw, 142px) !important;
        font-size: 11.5px !important;
        line-height: 1.08 !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel {
        position: relative !important;
        display: block !important;
        min-height: 48px !important;
        margin-top: 4px !important;
        padding-top: 9px !important;
        padding-right: 46px !important;
        overflow: hidden !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.17) 20%, rgba(255,255,255,0.29) 50%, rgba(255,255,255,0.17) 80%, transparent);
        pointer-events: none;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel > .event-line.bruno-chat-page {
        display: flex !important;
        position: absolute !important;
        top: 9px !important;
        left: 0 !important;
        right: 46px !important;
        width: auto !important;
        opacity: 0 !important;
        transform: translateY(2px) !important;
        pointer-events: none !important;
        transition: opacity 170ms ease, transform 170ms ease !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel
      > .event-line.bruno-chat-page:not(.is-insight) {
        padding-left: 11px !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel
      > .event-line.bruno-chat-page:not(.is-insight)::before {
        content: "";
        position: absolute;
        left: 0;
        top: 2px;
        bottom: 2px;
        width: 2px;
        border-radius: 999px;
        background: linear-gradient(
          180deg,
          rgba(255, 205, 70, 0.96),
          rgba(255, 171, 0, 0.78)
        );
        box-shadow: 0 0 8px rgba(255, 186, 32, 0.22);
        pointer-events: none;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel > .event-line.bruno-chat-page.bruno-chat-active {
        opacity: 1 !important;
        transform: translateY(0) !important;
        pointer-events: auto !important;
      }

      .hero-stage.is-v2 .headline .event-stack > .event-line.is-empty {
        display: none !important;
      }

      .bruno-chat-event-dots {
        position: absolute;
        right: 2px;
        top: 28px;
        display: flex;
        align-items: center;
        gap: 5px;
        pointer-events: none;
      }

      .bruno-chat-event-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(255,255,255,0.32);
        transition: background 170ms ease, box-shadow 170ms ease;
      }

      .bruno-chat-event-dot.is-active {
        background: rgba(255,255,255,0.92);
        box-shadow: 0 0 7px rgba(255,255,255,0.35);
      }
    }

    @media (max-width: 360px) {
      .hero-stage.is-v2 .clock {
        font-size: 66px !important;
      }

      .hero-stage.is-v2 .headline {
        column-gap: 8px !important;
      }

      .hero-stage.is-v2 .inline-weather {
        column-gap: 5px !important;
      }

      .hero-stage.is-v2 .inline-weather small {
        max-width: 112px !important;
        font-size: 10.5px !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .event-line.bruno-chat-page,
      .bruno-chat-event-dot {
        transition: none !important;
      }
    }
  `;
  root.appendChild(style);
}

function brunoChatApplyHero(card) {
  if (!card?.shadowRoot || card?._config?.hero_layout !== 'v2' || !brunoChatIsPhone()) {
    brunoChatClearHeroTimer(card);
    return;
  }

  const root = card.shadowRoot;
  const stage = root.querySelector('.hero-stage.is-v2');
  const stack = root.querySelector('.headline .event-stack');
  if (!stage || !stack) return;

  brunoChatEnsureHeroStyle(root);

  // ── HOME PHONE (2026-08-22) ────────────────────────────────────────────
  // A faixa de agenda/insights saiu do hero no telefone e migrou para o card
  // Agenda do bloco Favoritos, que reproduz a MESMA logica (paginas rotativas
  // a cada BRUNO_CHAT_ROTATION_MS).
  //
  // Desligar aqui, no JS, e nao por CSS: o bloco de estilo deste proprio
  // arquivo usa `!important` no carrossel, entao qualquer regra externa
  // entraria numa guerra de especificidade. Aqui a faixa simplesmente nao e
  // instalada, e o hero mede so o proprio conteudo.
  //
  // ROLLBACK: trocar para `true` e devolver a altura fixa no bloco de estilo.
  if (!BRUNO_CHAT_HERO_CAROUSEL) {
    stack.classList.remove('bruno-chat-carousel');
    stack.style.display = 'none';
    stack.querySelector('.bruno-chat-event-dots')?.remove();
    brunoChatClearHeroTimer(card);
    card.__brunoChatHeroIndex = 0;
    return;
  }

  const allLines = [...stack.querySelectorAll(':scope > .event-line')];
  const usefulLines = allLines.filter((line) => !line.classList.contains('is-empty'));
  const emptyLines = allLines.filter((line) => line.classList.contains('is-empty'));
  emptyLines.forEach((line) => {
    line.style.display = 'none';
    line.setAttribute('aria-hidden', 'true');
    line.tabIndex = -1;
  });

  stack.querySelector('.bruno-chat-event-dots')?.remove();

  if (!usefulLines.length) {
    stack.classList.remove('bruno-chat-carousel');
    stack.style.display = 'none';
    brunoChatClearHeroTimer(card);
    card.__brunoChatHeroIndex = 0;
    return;
  }

  stack.style.removeProperty('display');
  stack.classList.add('bruno-chat-carousel');
  usefulLines.forEach((line) => line.classList.add('bruno-chat-page'));

  card.__brunoChatHeroIndex = Math.max(0, Number(card.__brunoChatHeroIndex) || 0) % usefulLines.length;

  if (usefulLines.length > 1) {
    const dots = document.createElement('span');
    dots.className = 'bruno-chat-event-dots';
    dots.setAttribute('aria-hidden', 'true');
    usefulLines.forEach((_, index) => {
      const dot = document.createElement('i');
      dot.className = 'bruno-chat-event-dot';
      dot.dataset.brunoChatDot = String(index);
      dots.appendChild(dot);
    });
    stack.appendChild(dots);
  }

  brunoChatApplyHeroPage(card, usefulLines);

  if (usefulLines.length <= 1) {
    brunoChatClearHeroTimer(card);
    return;
  }

  if (!card.__brunoChatHeroTimer) {
    card.__brunoChatHeroTimer = setInterval(() => {
      if (!card.isConnected || !brunoChatIsPhone()) {
        brunoChatClearHeroTimer(card);
        return;
      }
      const currentLines = [...card.shadowRoot?.querySelectorAll('.event-stack.bruno-chat-carousel > .event-line.bruno-chat-page') || []];
      if (currentLines.length <= 1) {
        brunoChatClearHeroTimer(card);
        return;
      }
      card.__brunoChatHeroIndex = (Math.max(0, Number(card.__brunoChatHeroIndex) || 0) + 1) % currentLines.length;
      brunoChatApplyHeroPage(card, currentLines);
    }, BRUNO_CHAT_ROTATION_MS);
  }
}

function brunoChatPatchHeroClass(HeroCard) {
  if (!HeroCard || HeroCard.prototype.__brunoChatHomePatch) return;
  const proto = HeroCard.prototype;
  proto.__brunoChatHomePatch = true;

  const originalRenderDesktop = proto._renderDesktop;
  proto._renderDesktop = function patchedRenderDesktop(...args) {
    const result = originalRenderDesktop.apply(this, args);
    brunoChatApplyHero(this);
    return result;
  };

  const originalConnected = proto.connectedCallback;
  proto.connectedCallback = function patchedConnected(...args) {
    const result = originalConnected?.apply(this, args);
    if (!this.__brunoChatViewportQuery && globalThis.matchMedia) {
      this.__brunoChatViewportQuery = globalThis.matchMedia(BRUNO_CHAT_PHONE_QUERY);
      this.__brunoChatViewportListener = () => {
        brunoChatClearHeroTimer(this);
        this._render?.();
      };
      this.__brunoChatViewportQuery.addEventListener?.('change', this.__brunoChatViewportListener);
    }
    brunoChatApplyHero(this);
    return result;
  };

  const originalDisconnected = proto.disconnectedCallback;
  proto.disconnectedCallback = function patchedDisconnected(...args) {
    brunoChatClearHeroTimer(this);
    if (this.__brunoChatViewportQuery && this.__brunoChatViewportListener) {
      this.__brunoChatViewportQuery.removeEventListener?.('change', this.__brunoChatViewportListener);
    }
    this.__brunoChatViewportQuery = null;
    this.__brunoChatViewportListener = null;
    return originalDisconnected?.apply(this, args);
  };
}

function brunoChatEnsureRailStyle(root) {
  if (!root || root.querySelector('style[data-bruno-chat-rail-patch]')) return;
  const style = document.createElement('style');
  style.dataset.brunoChatRailPatch = '1';
  style.textContent = `
    @media (max-width: 800px) {
      .overflow-hint {
        top: 2px !important;
        bottom: auto !important;
        margin-bottom: 0 !important;
        right: 10px !important;
      }
    }
  `;
  root.appendChild(style);
}

function brunoChatPatchRailClass(RailCard) {
  if (!RailCard || RailCard.prototype.__brunoChatRailPatch) return;
  const proto = RailCard.prototype;
  proto.__brunoChatRailPatch = true;
  const originalRender = proto._render;
  proto._render = function patchedRailRender(...args) {
    const result = originalRender.apply(this, args);
    brunoChatEnsureRailStyle(this.shadowRoot);
    return result;
  };
}

Promise.all([
  customElements.whenDefined(BRUNO_CHAT_HERO_TAG),
  customElements.whenDefined(BRUNO_CHAT_RAIL_TAG),
]).then(() => {
  brunoChatPatchHeroClass(customElements.get(BRUNO_CHAT_HERO_TAG));
  brunoChatPatchRailClass(customElements.get(BRUNO_CHAT_RAIL_TAG));
});
