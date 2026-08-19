// home-mobile-hero-rail.js — patch consolidado de runtime (2026-08-19)
//
// O arquivo já era carregado pelo dashboard validado e passa a concentrar as
// correções que precisam atingir TANTO o bundle TypeScript atual quanto o card
// clássico especial da Sala no telefone, sem criar um segundo runtime paralelo.
//
// Escopo:
// - refinamento visual Home V2 phone já validado;
// - long-press iOS sem callout/drag nativo nos room tiles;
// - dot do Office sem sessão HASS.Agent crua/congelada;
// - TV: uma entidade primária, OFF transitório filtrado por 45 s e artwork retido;
// - Spotify: entity_id volta a viajar dentro de serviceData;
// - cortina: alvo visual só conclui depois do percurso físico estimado.
//
// ROLLBACK: restaurar a versão ?v=20260817-chat-2 desta entrada.

const BRUNO_CHAT_PHONE_QUERY = '(max-width: 800px)';
const BRUNO_CHAT_HERO_TAG = 'bruno-hero-card';
const BRUNO_CHAT_RAIL_TAG = 'bento-sidebar-liquid-card';
const BRUNO_CHAT_ROTATION_MS = 6000;

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
      .hero-stage.is-v2 {
        height: 178px !important;
        min-height: 178px !important;
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

// ─────────────────────────────────────────────────────────────────────────────
// Runtime consolidation — 2026-08-19
// ─────────────────────────────────────────────────────────────────────────────

const BRUNO_RUNTIME_ROOM_TILE_TAG = 'bruno-room-tile';
const BRUNO_RUNTIME_ROOM_SUBVIEW_TAG = 'bruno-room-subview';
const BRUNO_RUNTIME_SALA_CARD_TAG = 'bruno-sala-card';
const BRUNO_RUNTIME_TV_ENTITY = 'media_player.android_tv_192_168_3_17';
const BRUNO_RUNTIME_TV_GRACE_MS = 45_000;
const BRUNO_RUNTIME_TV_POWER_STATES = new Set(['on', 'playing', 'paused', 'idle', 'buffering']);
const BRUNO_RUNTIME_TV_PLAYING_STATES = new Set(['playing', 'buffering']);
const BRUNO_RUNTIME_CURTAIN_FULL_TRAVEL_MS = 30_000;
const BRUNO_RUNTIME_CURTAIN_MIN_TRAVEL_MS = 1_200;
const BRUNO_RUNTIME_CURTAIN_TARGET_TOLERANCE = 2;
const BRUNO_RUNTIME_CURTAIN_STOP_GRACE_MS = 700;

function brunoRuntimeState(entity) {
  return String(entity?.state ?? '').toLowerCase();
}

function brunoRuntimeTvStable(host, entity, { cacheSnapshot = false } = {}) {
  const state = brunoRuntimeState(entity);
  const now = Date.now();
  if (BRUNO_RUNTIME_TV_POWER_STATES.has(state)) {
    host.__brunoRuntimeTvLastPoweredAt = now;
    if (cacheSnapshot && entity) {
      host.__brunoRuntimeTvSnapshot = {
        ...entity,
        attributes: { ...(entity.attributes || {}) },
      };
    }
    return true;
  }

  if (state !== 'off') {
    host.__brunoRuntimeTvLastPoweredAt = 0;
    if (cacheSnapshot) host.__brunoRuntimeTvSnapshot = null;
    return false;
  }

  const last = Number(host.__brunoRuntimeTvLastPoweredAt) || 0;
  return last > 0 && now - last <= BRUNO_RUNTIME_TV_GRACE_MS;
}

function brunoRuntimeProtectRoomAssets(tile) {
  const root = tile?.shadowRoot;
  if (!root) return;
  root.querySelectorAll('img.room-asset').forEach((img) => {
    img.draggable = false;
    img.setAttribute('draggable', 'false');
    img.style.setProperty('-webkit-touch-callout', 'none');
    img.style.setProperty('-webkit-user-drag', 'none');
    img.style.setProperty('-webkit-user-select', 'none');
    img.style.setProperty('user-select', 'none');
  });
}

function brunoRuntimePatchRoomTile(RoomTile) {
  if (!RoomTile || RoomTile.prototype.__brunoRuntimeConsolidated) return;
  const proto = RoomTile.prototype;
  proto.__brunoRuntimeConsolidated = true;

  // Long-press iOS: neutraliza somente o comportamento nativo da imagem.
  const originalUpdated = proto.updated;
  proto.updated = function patchedRuntimeUpdated(...args) {
    const result = originalUpdated?.apply(this, args);
    brunoRuntimeProtectRoomAssets(this);
    return result;
  };

  // Dots: Office usa apenas o sensor supervisionado; Sala compartilha a mesma
  // janela de estabilidade da TV usada no Hub, evitando o dot piscar OFF.
  const originalDots = proto._dots;
  proto._dots = function patchedRuntimeDots(...args) {
    let dots = originalDots?.apply(this, args) || [];
    const roomId = this?._room?.id;
    const hass = this?._hass;

    if (roomId === 'office' && hass) {
      const pcOn = String(hass.states?.['binary_sensor.office_pc_active']?.state || '').toLowerCase() === 'on';
      dots = dots.filter((dot) => dot?.label !== 'PC ativo');
      if (pcOn) {
        dots.push({ icon: 'mdi:desktop-classic', label: 'PC ativo', tone: 'purple' });
      }
    }

    if (roomId === 'sala' && hass) {
      const tvEntity = hass.states?.[BRUNO_RUNTIME_TV_ENTITY];
      const powered = brunoRuntimeTvStable(this, tvEntity);
      dots = dots.filter((dot) => dot?.label !== 'TV ativa');
      if (powered) {
        dots.push({ icon: 'mdi:television-classic', label: 'TV ativa', tone: 'purple' });
      }
    }

    return dots;
  };
}

function brunoRuntimePatchRoomSubview(RoomSubview) {
  if (!RoomSubview || RoomSubview.prototype.__brunoRuntimeConsolidated) return;
  const proto = RoomSubview.prototype;
  proto.__brunoRuntimeConsolidated = true;

  // Spotify/HA: entity_id faz parte do serviceData. O quarto argumento target
  // introduzido na migração quebrava schemas de integrações como SpotifyPlus.
  proto._servico = function patchedRuntimeService(dominio, servico, dados = {}) {
    if (!this?._hass) return;
    void this._hass.callService(dominio, servico, dados);
  };

  // TV: só a entidade primária decide energia/reprodução. Durante um OFF
  // transitório preservamos também os últimos metadados para a arte não sumir.
  proto._modeloTv = function patchedRuntimeTvModel() {
    const id = this._idDe?.('tv');
    const rawEntity = this._estado?.(id);
    const rawState = brunoRuntimeState(rawEntity) || 'off';
    const rawPowered = BRUNO_RUNTIME_TV_POWER_STATES.has(rawState);
    const powered = brunoRuntimeTvStable(this, rawEntity, { cacheSnapshot: true });
    const visualEntity = powered && !rawPowered && this.__brunoRuntimeTvSnapshot
      ? this.__brunoRuntimeTvSnapshot
      : rawEntity;
    const attrs = visualEntity?.attributes || {};

    return {
      st: visualEntity,
      estado: powered && rawState === 'off' ? 'idle' : rawState,
      ativo: powered,
      reproduzindo: BRUNO_RUNTIME_TV_PLAYING_STATES.has(rawState),
      fonte: String(attrs.source ?? attrs.app_name ?? '') || 'HDMI 1',
      titulo: String(attrs.media_title ?? attrs.media_series_title ?? attrs.app_name ?? ''),
      volume: attrs.volume_level != null ? Math.round(Number(attrs.volume_level) * 100) : null,
      poster: String(attrs.entity_picture ?? attrs.media_image_url ?? ''),
    };
  };

  // Cortina: mesma interpolação já existente, mas SEM aceitar o alvo só porque
  // o helper/cover saltou cedo para 0/100. O alvo só conclui após a duração
  // calculada do percurso, ou após reconciliação física intermediária.
  proto._fechamentoCortina = function patchedRuntimeCurtainClosed() {
    const relatado = this._fechamentoCortinaRelatado?.() ?? 0;
    const movimento = this._movimentoCortina;
    const id = this._entidadeCortina?.();
    if (!movimento || movimento.entityId !== id) return relatado;

    const agora = Date.now();
    const estado = String(this._estado?.(id)?.state ?? '').toLowerCase();
    const estaMovendo = estado === 'opening' || estado === 'closing';
    const fisico = this._fechamentoCortinaFisico?.();

    if (movimento.retido) {
      if (
        !estaMovendo
        && fisico != null
        && agora - movimento.retidoEm >= BRUNO_RUNTIME_CURTAIN_STOP_GRACE_MS
      ) {
        this._movimentoCortina = undefined;
        return fisico;
      }
      return movimento.fechado;
    }

    const decorrido = agora - movimento.iniciadoEm;
    const fisicoNoAlvo = fisico != null
      && Math.abs(fisico - movimento.alvoFechado) <= BRUNO_RUNTIME_CURTAIN_TARGET_TOLERANCE;

    const fisicoIntermediario = fisico != null && !fisicoNoAlvo;
    const mudouRelato = fisicoIntermediario
      && Math.abs(fisico - movimento.ultimoRelatado) >= 1;
    if (mudouRelato) {
      movimento.ultimoRelatado = fisico;
      movimento.inicioFechado = fisico;
      movimento.iniciadoEm = agora;
      movimento.duracao = Math.max(
        BRUNO_RUNTIME_CURTAIN_MIN_TRAVEL_MS,
        BRUNO_RUNTIME_CURTAIN_FULL_TRAVEL_MS
          * (Math.abs(movimento.alvoFechado - fisico) / 100),
      );
      return fisico;
    }

    const estimado = this._fechamentoMovimentoCortina?.(movimento, agora) ?? relatado;
    const terminou = decorrido >= movimento.duracao;
    if (terminou && !estaMovendo) {
      this._movimentoCortina = undefined;
      this._pararTimerMovimentoCortina?.();
      const comandado = this._fechamentoCortinaComandado?.();
      const comandoNoAlvo = comandado != null
        && Math.abs(comandado - movimento.alvoFechado) <= BRUNO_RUNTIME_CURTAIN_TARGET_TOLERANCE;
      return fisico != null && !fisicoNoAlvo && !comandoNoAlvo
        ? fisico
        : movimento.alvoFechado;
    }

    if (estaMovendo) {
      return movimento.alvoFechado > movimento.inicioFechado
        ? Math.min(estimado, Math.max(movimento.inicioFechado, movimento.alvoFechado - 1))
        : Math.max(estimado, Math.min(movimento.inicioFechado, movimento.alvoFechado + 1));
    }

    // Mesmo que o cover tenha parado de declarar opening/closing cedo, a UI
    // continua no estimado até a duração física daquele percurso terminar.
    return estimado;
  };
}

function brunoRuntimePatchSalaPhone(SalaCard) {
  if (!SalaCard || SalaCard.prototype.__brunoRuntimeConsolidated) return;
  const proto = SalaCard.prototype;
  proto.__brunoRuntimeConsolidated = true;
  const originalState = proto._state;

  // O card especial da Sala no telefone ainda é clássico. Em vez de manter uma
  // segunda regra de TV, estabilizamos a leitura da entidade no mesmo ponto de
  // entrada: OFF transitório reutiliza o último snapshot; unknown/unavailable não.
  proto._state = function patchedRuntimeSalaState(entityId, ...args) {
    const raw = originalState?.call(this, entityId, ...args);
    if (entityId !== (this?._config?.entities?.tv || BRUNO_RUNTIME_TV_ENTITY)) return raw;

    const powered = brunoRuntimeTvStable(this, raw, { cacheSnapshot: true });
    const rawState = brunoRuntimeState(raw);
    if (powered && rawState === 'off' && this.__brunoRuntimeTvSnapshot) {
      return {
        ...this.__brunoRuntimeTvSnapshot,
        state: 'idle',
      };
    }
    return raw;
  };
}

Promise.all([
  customElements.whenDefined(BRUNO_RUNTIME_ROOM_TILE_TAG),
  customElements.whenDefined(BRUNO_RUNTIME_ROOM_SUBVIEW_TAG),
  customElements.whenDefined(BRUNO_RUNTIME_SALA_CARD_TAG),
]).then(() => {
  brunoRuntimePatchRoomTile(customElements.get(BRUNO_RUNTIME_ROOM_TILE_TAG));
  brunoRuntimePatchRoomSubview(customElements.get(BRUNO_RUNTIME_ROOM_SUBVIEW_TAG));
  brunoRuntimePatchSalaPhone(customElements.get(BRUNO_RUNTIME_SALA_CARD_TAG));
});
