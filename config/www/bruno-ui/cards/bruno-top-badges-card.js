const BRUNO_TOP_BADGES_CARD_TAG = 'bruno-top-badges-card';
const BRUNO_TOP_BADGES_CURTAIN_CALIBRATION = [
  { visual: 0, position: 0 },
  { visual: 25, position: 33 },
  { visual: 50, position: 47 },
  { visual: 75, position: 70 },
  { visual: 100, position: 100 },
];

const BRUNO_TOP_BADGES_DEFAULT_ENTITIES = {
  expanded: 'input_select.hemma_expanded_row',
  person: 'person.bruno_helasio',
  locks: ['lock.porta_sala', 'lock.porta_servico'],
  door: 'binary_sensor.entrada_porta_aberta',
  motion: 'binary_sensor.entrada_movimento',
  lights_group: 'light.todas_as_luzes',
  lights: [
    'light.sala_switch_1',
    'light.sala_switch_2',
    'light.cozinha_switch_1',
    'light.cozinha_switch_2',
    'light.lavabo_switch_1',
    'light.corredor_switch_1',
    'light.quarto_miguel_switch_1',
    'light.quarto_miguel_switch_2',
  ],
  media: [
    'media_player.smart_tv_pro_2',
    'media_player.spotifyplus_bruno_helasio',
    'media_player.echo_show',
  ],
  climate: [
    'climate.sl_ar_condicionado',
    'climate.ac_office',
    'climate.ac_quarto_miguel',
  ],
  curtains: [
    {
      title: 'Sala',
      entity: 'cover.cortina_varanda_cortina_2',
      percent_control: 'number.cortina_varanda_percent_control',
    },
  ],
};

const BRUNO_TOP_BADGES_MEDIA_ON_STATES = ['playing', 'paused', 'on'];
const BRUNO_TOP_BADGES_OFF_STATES = ['off', 'unavailable', 'unknown', ''];

class BrunoTopBadgesCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      entities: {
        ...BRUNO_TOP_BADGES_DEFAULT_ENTITIES,
        ...(config?.entities || {}),
      },
      ...config,
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 1;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isUnavailable(entity) {
    return !entity || BRUNO_TOP_BADGES_OFF_STATES.includes(String(entity.state || '').toLowerCase());
  }

  _expanded() {
    if (this._localExpanded && this._localExpanded !== 'none') return this._localExpanded;
    return this._state(this._config.entities.expanded)?.state || 'none';
  }

  _entityName(entityId) {
    return this._state(entityId)?.attributes?.friendly_name || entityId;
  }

  _toPercent(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    return Math.max(0, Math.min(100, Math.round(number)));
  }

  _interpolateCurtainPercent(value, fromKey, toKey) {
    const percent = this._toPercent(value) ?? 0;
    const points = BRUNO_TOP_BADGES_CURTAIN_CALIBRATION;

    if (percent <= points[0][fromKey]) return points[0][toKey];
    for (let index = 1; index < points.length; index += 1) {
      const previous = points[index - 1];
      const next = points[index];
      if (percent <= next[fromKey]) {
        const span = next[fromKey] - previous[fromKey];
        if (span === 0) return next[toKey];
        const ratio = (percent - previous[fromKey]) / span;
        return this._toPercent(previous[toKey] + ((next[toKey] - previous[toKey]) * ratio)) ?? next[toKey];
      }
    }

    return points[points.length - 1][toKey];
  }

  _curtainDisplayOpenPosition(openPosition) {
    return this._interpolateCurtainPercent(openPosition, 'position', 'visual');
  }

  _setExpanded(value) {
    const entityId = this._config.entities.expanded;
    if (!entityId || !this._hass) {
      this._localExpanded = this._localExpanded === value ? 'none' : value;
      this._render();
      return;
    }
    const current = this._expanded();
    const option = current === value ? 'none' : value;
    const options = this._state(entityId)?.attributes?.options || [];
    if (!options.includes(option)) {
      this._localExpanded = option;
      this._render();
      return;
    }
    this._localExpanded = 'none';
    this._hass.callService('input_select', 'select_option', {
      entity_id: entityId,
      option,
    });
  }

  _securityModel() {
    const entities = this._config.entities;
    const locks = entities.locks || [];
    const unlocked = locks.some((id) => this._state(id)?.state === 'unlocked');
    const doorOpen = this._state(entities.door)?.state === 'on';
    const motion = this._state(entities.motion)?.state === 'on';
    let sub = 'Locked';
    if (unlocked) sub = 'Unlocked';
    if (doorOpen) sub = 'Door Open';
    if (motion) sub = 'Motion';

    return {
      key: 'security',
      title: 'Security',
      sub,
      icon: 'mdi:shield-lock',
      tone: 'blue',
      active: unlocked || doorOpen || motion,
      chips: locks.map((id) => {
        const state = this._state(id)?.state || 'unknown';
        return {
          icon: state === 'locked' ? 'mdi:lock' : 'mdi:lock-open-variant',
          title: this._entityName(id),
          sub: state.replace('_', ' '),
        };
      }),
    };
  }

  _expandLights(ids, seen = new Set()) {
    return ids.flatMap((id) => {
      if (!id || seen.has(id)) return [];
      seen.add(id);
      const entity = this._state(id);
      if (!entity) return [];
      const children = entity.attributes?.entity_id;
      if (Array.isArray(children) && children.length) return this._expandLights(children, seen);
      return id.startsWith('light.') ? [id] : [];
    });
  }

  _lightsModel() {
    const entities = this._config.entities;
    const groupIds = this._state(entities.lights_group)?.attributes?.entity_id;
    const source = [...new Set([
      ...(Array.isArray(groupIds) ? groupIds : []),
      ...(entities.lights || []),
    ])];
    const lights = [...new Set(this._expandLights(source))];
    const on = lights.filter((id) => this._state(id)?.state === 'on');
    const sub = on.length === 0 ? 'All Off' : on.length === lights.length ? 'All On' : `${on.length} On`;
    return {
      key: 'lights',
      title: 'Lights',
      sub,
      icon: 'mdi:lightbulb',
      tone: 'amber',
      active: on.length > 0,
      chips: on.map((id) => {
        const brightness = this._state(id)?.attributes?.brightness;
        return {
          icon: 'mdi:lightbulb-on',
          title: this._entityName(id),
          sub: brightness != null ? `${Math.round((Number(brightness) / 255) * 100)}%` : 'On',
        };
      }),
    };
  }

  _mediaModel() {
    const active = (this._config.entities.media || [])
      .filter((id) => BRUNO_TOP_BADGES_MEDIA_ON_STATES.includes(this._state(id)?.state || ''));
    return {
      key: 'media',
      title: 'Media',
      sub: active.length ? `${active.length} On` : 'All Off',
      icon: 'mdi:speaker-wireless',
      tone: 'gray',
      active: active.length > 0,
      chips: active.map((id) => ({
        icon: 'mdi:music-note',
        title: this._entityName(id),
        sub: (this._state(id)?.state || 'on').replace('_', ' '),
      })),
    };
  }

  _climateModel() {
    const active = (this._config.entities.climate || [])
      .filter((id) => !BRUNO_TOP_BADGES_OFF_STATES.includes(this._state(id)?.state || 'unknown'));
    return {
      key: 'climate',
      title: 'Climate',
      sub: active.length ? `${active.length} On` : 'Off',
      icon: 'mdi:fan',
      tone: 'green',
      active: active.length > 0,
      chips: active.map((id) => {
        const temperature = this._state(id)?.attributes?.temperature;
        return {
          icon: 'mdi:air-conditioner',
          title: this._entityName(id),
          sub: temperature != null ? `${temperature}\u00b0` : (this._state(id)?.state || 'on').replace('_', ' '),
        };
      }),
    };
  }

  _curtainOpenPosition(item) {
    const entityId = item.entity || item.cover;
    const cover = this._state(entityId);
    const state = String(cover?.state || '').toLowerCase();
    const percentEntity = this._state(item.percent_control || item.percentControl);
    const percentControl = this._isUnavailable(percentEntity) ? null : this._toPercent(percentEntity?.state);
    if (percentControl != null) return 100 - percentControl;

    const coverPosition = this._toPercent(cover?.attributes?.current_position);
    if (coverPosition != null) return coverPosition;

    if (state === 'open') return 100;
    if (state === 'closed') return 0;
    return 0;
  }

  _curtainsModel() {
    const curtains = (this._config.entities.curtains || [])
      .map((item) => (typeof item === 'string' ? { entity: item } : item))
      .filter((item) => item?.entity || item?.cover);

    const chips = curtains.map((item) => {
      const entityId = item.entity || item.cover;
      const cover = this._state(entityId);
      const state = String(cover?.state || '').toLowerCase();
      const available = !this._isUnavailable(cover);
      const openPosition = available ? this._curtainOpenPosition(item) : null;
      const displayPosition = openPosition == null ? null : this._curtainDisplayOpenPosition(openPosition);
      return {
        icon: displayPosition != null && displayPosition <= 3 ? 'mdi:curtains-closed' : 'mdi:curtains',
        title: item.title || this._entityName(entityId),
        sub: displayPosition == null ? 'indisponivel' : `${displayPosition}% aberta`,
        active: available && (state === 'opening' || state === 'closing'),
      };
    });

    return {
      key: 'curtains',
      title: 'Cortinas',
      sub: '',
      icon: 'mdi:curtains',
      tone: 'amber',
      active: false,
      chips,
    };
  }

  _models() {
    return [
      this._securityModel(),
      this._curtainsModel(),
      this._lightsModel(),
      this._mediaModel(),
      this._climateModel(),
    ];
  }

  _visibleModels(models, expanded) {
    if (!expanded || expanded === 'none') return models;
    const index = models.findIndex((model) => model.key === expanded);
    return index < 0 ? models : models.slice(0, index + 1);
  }

  _openSecurityPopup() {
    const locks = this._config.entities.locks || [];
    this._fireDomEvent({
      action: 'fire-dom-event',
      browser_mod: {
        service: 'browser_mod.popup',
        data: {
          title: 'Security',
          size: 'wide',
          content: {
            type: 'entities',
            entities: locks.map((entity) => ({ entity, name: this._entityName(entity) })),
          },
        },
      },
    });
  }

  _toggleMainLock() {
    const entityId = (this._config.entities.locks || [])[0];
    if (!entityId || !this._hass) return;
    this._hass.callService('lock', 'toggle', { entity_id: entityId }, { entity_id: entityId });
  }

  _runAction(key, gesture) {
    if (gesture === 'hold' && key !== 'security') return;
    if (key === 'security' && gesture === 'hold') {
      this._openSecurityPopup();
      return;
    }
    if (key === 'security' && gesture === 'double') {
      this._toggleMainLock();
      return;
    }
    this._setExpanded(key);
  }

  _fireDomEvent(action) {
    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: action,
      bubbles: true,
      composed: true,
    }));
  }

  _wireActions() {
    this.shadowRoot.querySelectorAll('[data-badge-key]').forEach((button) => {
      const key = button.dataset.badgeKey;
      let holdTimer = null;
      let tapTimer = null;
      let holdFired = false;
      const clearHold = () => {
        if (holdTimer) window.clearTimeout(holdTimer);
        holdTimer = null;
      };
      const clearTap = () => {
        if (tapTimer) window.clearTimeout(tapTimer);
        tapTimer = null;
      };

      button.addEventListener('pointerdown', (event) => {
        if (event.button != null && event.button !== 0) return;
        event.preventDefault();
        holdFired = false;
        button.classList.add('is-pressed');
        button.setPointerCapture?.(event.pointerId);
        holdTimer = window.setTimeout(() => {
          holdFired = true;
          this._runAction(key, 'hold');
        }, 560);
      });

      button.addEventListener('pointerup', (event) => {
        event.preventDefault();
        button.releasePointerCapture?.(event.pointerId);
        clearHold();
        button.classList.remove('is-pressed');
        if (holdFired) return;
        if (key === 'security') {
          if (tapTimer) {
            clearTap();
            this._runAction(key, 'double');
            return;
          }
          tapTimer = window.setTimeout(() => {
            tapTimer = null;
            this._runAction(key, 'tap');
          }, 300);
          return;
        }
        this._runAction(key, 'tap');
      });

      button.addEventListener('dblclick', (event) => {
        event.preventDefault();
        clearHold();
        clearTap();
        this._runAction(key, 'double');
      });

      button.addEventListener('pointerleave', () => {
        clearHold();
        button.classList.remove('is-pressed');
      });
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const expanded = this._expanded();
    const models = this._models();
    const visibleModels = this._visibleModels(models, expanded);
    const expandedModel = models.find((model) => model.key === expanded);
    const person = this._state(this._config.entities.person);
    const avatar = person?.attributes?.entity_picture || '';

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          height: 48px;
          min-height: 0;
          contain: layout style;
          /* TRANSPARENTE: legibilidade vem da BORDA ATMOSFÉRICA escurecida do
             backdrop (vinheta no topo), não de faixa/blur aqui. */
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        .badges-card {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
          color: rgba(248,251,255,0.96);
        }

        .left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: visible;
        }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .badge {
          appearance: none;
          -webkit-appearance: none;
          height: 46px;
          min-width: 0;
          display: grid;
          grid-template-columns: 22px auto;
          align-items: center;
          column-gap: 8px;
          padding: 0 13px;
          border-radius: 999px;
          border: var(--bruno-liquid-chip-border, 1px solid rgba(255,255,255,0.14));
          background: var(--bruno-liquid-chip-background,
            linear-gradient(180deg, rgba(255,255,255,0.105), rgba(255,255,255,0.040)),
            rgba(16,18,24,0.46)
          );
          box-shadow: var(--bruno-liquid-chip-shadow,
            inset 0 1px 0 rgba(255,255,255,0.13),
            0 8px 20px rgba(0,0,0,0.14)
          );
          backdrop-filter: var(--bruno-liquid-chip-filter, blur(18px) saturate(1.28));
          -webkit-backdrop-filter: var(--bruno-liquid-chip-filter, blur(18px) saturate(1.28));
          transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .badge.is-active {
          background:
            radial-gradient(30px 24px at 22% 16%, rgba(255,255,255,0.62), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,248,252,0.78));
          border-color: rgba(255,255,255,0.42);
          color: rgba(14,18,24,0.88);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.48),
            0 10px 22px rgba(0,0,0,0.16),
            0 0 20px rgba(var(--tone),0.18);
        }

        .badge.is-expanded {
          border-color: rgba(var(--tone),0.50);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.34),
            0 8px 22px rgba(0,0,0,0.18),
            0 0 24px rgba(var(--tone),0.22);
        }

        .badge.is-pressed {
          transform: scale(0.98);
        }

        .badge-icon {
          position: relative;
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(var(--tone),0.98);
        }

        .badge-icon ha-icon {
          --mdc-icon-size: 18px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .badge-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          line-height: 1.02;
        }

        .badge-title {
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          color: currentColor;
        }

        .badge-sub {
          font-size: 11px;
          line-height: 1;
          font-weight: 650;
          color: var(--sub-color, rgba(255,255,255,0.66));
        }

        .badge.is-active .badge-sub {
          color: rgba(16,20,26,0.54);
        }

        .rail {
          min-width: 0;
          flex: 1 1 auto;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          max-width: min(64vw, 720px);
        }

        .rail::-webkit-scrollbar { display: none; }

        .chip {
          flex: 0 0 auto;
          height: 42px;
          display: grid;
          grid-template-columns: 20px auto;
          align-items: center;
          column-gap: 8px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(16,18,24,0.52);
          border: 1px solid rgba(255,255,255,0.13);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .chip ha-icon {
          --mdc-icon-size: 18px;
          color: rgba(var(--tone),0.95);
        }

        .chip-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .chip-title {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.90);
        }

        .chip-sub {
          font-size: 10px;
          line-height: 1;
          font-weight: 640;
          color: rgba(255,255,255,0.54);
          text-transform: capitalize;
        }

        .empty-chip {
          color: rgba(255,255,255,0.52);
          font-size: 11px;
          font-weight: 650;
        }

        .avatars {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: max-content;
        }

        .avatar {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          color: rgba(255,255,255,0.82);
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 7px 16px rgba(0,0,0,0.18);
        }

        .avatar + .avatar {
          margin-left: -12px;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .tone-blue { --tone: 126, 200, 255; }
        .tone-amber { --tone: 247, 198, 0; }
        .tone-gray { --tone: 154, 160, 166; }
        .tone-green { --tone: 86, 216, 155; }

        @media (max-width: 900px) {
          :host { height: auto; min-height: 48px; }
          .badges-card {
            grid-template-columns: 1fr;
            gap: 8px;
            min-width: 0;
            overflow: hidden;
            padding: 0;
          }
          .avatars { display: none; }
          .left {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-x: contain;
            touch-action: pan-x;
            padding: 0 1px 2px;
          }
          .left::-webkit-scrollbar { display: none; }
          .badge {
            flex: 0 0 auto;
            touch-action: pan-x;
          }
          .rail {
            flex: 0 0 auto;
            max-width: none;
            touch-action: pan-x;
          }
        }

        /* ============================================================
           NOVO — FAIXA DE STATUS (re-skin savant). Bloco ADITIVO/CSS-only:
           a LÓGICA (modelos, contagem, .is-active aceso/apagado, expandir/
           colapsar via input_select, gestos) NÃO é tocada — só restilizo as
           classes vindas do JS. ROLLBACK: remover este bloco => volta às pílulas.
           Estado "aceso" no estilo mais premium/savant: SEM pill branco; o grupo
           ACENDE na sua cor de acento (--tone), com leve glow no ícone e a
           contagem na cor do grupo. "Apagado" = cinza sóbrio. Separação por
           filete fino entre badges (linguagem do rail/dock).
           ============================================================ */
        .left { gap: 0; }
        .left .badge + .badge {
          border-left: 1px solid rgba(255,255,255,0.10);   /* filete entre badges */
        }
        .badge {
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          padding: 0 16px;
          column-gap: 9px;
          color: rgba(255,255,255,0.92);
        }
        /* APAGADO (sóbrio) */
        .badge .badge-icon { color: rgba(255,255,255,0.44); }
        .badge .badge-title { color: rgba(255,255,255,0.60); font-weight: 600; }
        .badge .badge-sub { color: rgba(255,255,255,0.42); font-weight: 600; }
        /* ACESO (premium/savant): acende na cor do grupo, sem pill branco */
        .badge.is-active {
          background: transparent;
          border: none;
          box-shadow: none;
          color: inherit;
        }
        .badge.is-active .badge-icon {
          color: rgb(var(--tone));
          filter: drop-shadow(0 0 8px rgba(var(--tone),0.45));
        }
        .badge.is-active .badge-title { color: rgba(255,255,255,0.94); }
        .badge.is-active .badge-sub { color: rgb(var(--tone)); }
        /* EXPANDIDO: aba ativa discreta (sublinhado de acento + leve tinte) */
        .badge.is-expanded {
          background: linear-gradient(180deg, rgba(var(--tone),0.10), rgba(var(--tone),0.03));
          border: none;
          box-shadow: inset 0 -2px 0 rgba(var(--tone),0.55);
        }
        .badge.is-pressed { transform: scale(0.99); }
        /* lista expandida: RESPIRO + filete separando a badge ativa dos itens
           (antes a lista colava na badge e a borda do 1º chip encostava no
           acento/glow). */
        .left .rail {
          gap: 0;
          margin-left: 14px;
          padding-left: 14px;
          border-left: 1px solid rgba(255,255,255,0.12);
        }
        /* chips FLAT (mesmo idioma da faixa): SEM caixa/pílula, só ícone + nome,
           separados por filete fino — continuação natural da ribbon. */
        .chip {
          height: 40px;
          padding: 0 12px;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .rail .chip + .chip {
          border-left: 1px solid rgba(255,255,255,0.10);
        }
      </style>

      <div class="badges-card">
        <div class="left">
          ${visibleModels.map((model) => this._badge(model, expanded)).join('')}
          ${this._expandedRail(expandedModel)}
        </div>
        <div class="avatars" aria-label="Moradores">
          <span class="avatar">${avatar ? `<img src="${BrunoTopBadgesCard._escapeAttr(avatar)}" alt="Bruno">` : 'B'}</span>
          <span class="avatar">D</span>
          <span class="avatar">M</span>
        </div>
      </div>
    `;

    this._wireActions();
  }

  _badge(model, expanded) {
    const activeClass = model.active ? ' is-active' : '';
    const expandedClass = expanded === model.key ? ' is-expanded' : '';
    return `
      <button class="badge tone-${model.tone}${activeClass}${expandedClass}" type="button" data-badge-key="${model.key}" aria-label="${BrunoTopBadgesCard._escapeAttr(model.title)}">
        <span class="badge-icon" aria-hidden="true"><ha-icon icon="${model.icon}"></ha-icon></span>
        <span class="badge-text">
          <span class="badge-title">${BrunoTopBadgesCard._escape(model.title)}</span>
          ${model.sub ? `<span class="badge-sub">${BrunoTopBadgesCard._escape(model.sub)}</span>` : ''}
        </span>
      </button>
    `;
  }

  _expandedRail(model) {
    if (!model) return '';
    if (!model.chips?.length) {
      return `<div class="rail tone-${model.tone}"><span class="chip empty-chip">Nada ativo</span></div>`;
    }
    return `
      <div class="rail tone-${model.tone}">
        ${model.chips.map((chip) => `
          <span class="chip">
            <ha-icon icon="${chip.icon}"></ha-icon>
            <span class="chip-text">
              <span class="chip-title">${BrunoTopBadgesCard._escape(chip.title)}</span>
              <span class="chip-sub">${BrunoTopBadgesCard._escape(chip.sub)}</span>
            </span>
          </span>
        `).join('')}
      </div>
    `;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoTopBadgesCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_TOP_BADGES_CARD_TAG)) {
  customElements.define(BRUNO_TOP_BADGES_CARD_TAG, BrunoTopBadgesCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_TOP_BADGES_CARD_TAG,
  name: 'Bruno Top Badges Card',
  preview: false,
  description: 'Isolated Bento top badges card with preserved status expansion semantics.',
});
