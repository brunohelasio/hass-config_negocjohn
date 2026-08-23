// A4 (2026-08-23): a contagem de midia reusa o MESMO helper que os room
// tiles ja usam para decidir em qual comodo o Spotify toca. Este arquivo e
// consolidado no bundle Vite (nenhuma linha ativa em extra_module_url),
// entao o import resolve em build e nao gera fetch em runtime.
import { altoFalanteCasa, dispositivoDoComodo } from '@/services/entities/spotify-device';

const BRUNO_TOP_BADGES_CARD_TAG = 'bruno-top-badges-card';

/**
 * Entidades que representam o MESMO endpoint fisico.
 *
 * A TV da Sala publica por duas integracoes: smart_tv_pro_2 responde por
 * power/status e android_tv_... por playback (contrato do checkpoint). Contar
 * as duas fazia o status dizer 2 quando ha uma TV.
 *
 * Declarativo de proposito: acrescentar um aparelho e acrescentar uma linha.
 */
const BRUNO_TOP_BADGES_MEDIA_ENDPOINTS = [
  {
    id: 'tv-sala',
    title: 'TV Sala',
    entities: ['media_player.smart_tv_pro_2', 'media_player.android_tv_192_168_3_17'],
  },
];
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
    'light.sala_switch_3',
    'light.sala_2_switch_2',
    'light.sala_2_switch_3',
    'light.varanda_switch_1',
    'light.varanda_switch_2',
    'light.cozinha_switch_1',
    'light.cozinha_switch_2',
    'light.cozinha_switch_3',
    'light.cz_luz_principal',
    'light.quarto_casal_switch_1',
    'light.quarto_casal_switch_2',
    'light.quarto_casal_2_switch_2',
    'light.quarto_casal_2_switch_3',
    'light.qc_luz_principal',
    'light.suite_casal_switch_1',
    'light.suite_casal_switch_2',
    'light.quarto_marina_switch_1',
    'light.quarto_marina_switch_2',
    'light.quarto_marina_switch_3',
    'light.quarto_marina_switch_4',
    'light.suite_marina_switch_1',
    'light.suite_marina_switch_2',
    'light.office_switch_1',
    'light.office_switch_2',
    'light.office_switch_3',
    'light.lavabo_switch_1',
    'light.lavabo_switch_2',
    'light.lavabo_switch_3',
    'light.corredor_switch_1',
    'light.quarto_miguel_switch_1',
    'light.quarto_miguel_switch_2',
    'light.quarto_miguel_switch_3',
    'light.quarto_miguel_2_switch_1',
    'light.quarto_miguel_2_switch_2',
    'light.quarto_miguel_2_switch_3',
  ],
  media: [
    'media_player.android_tv_192_168_3_17',
    'media_player.smart_tv_pro_2',
    'media_player.spotifyplus_bruno_helasio',
    'media_player.echo_show',
    'media_player.echo_pop_office',
    'media_player.echo_pop_quarto_casal',
    'media_player.echo_pop_marina',
  ],
  climate: [
    'climate.sl_ar_condicionado',
    'climate.ac_office',
    'climate.ac_quarto_miguel',
    'climate.ac_quarto_marina',
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
          entityId: id,
          action: state === 'unlocked' ? 'lock' : '',
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
          entityId: id,
          action: 'toggle-light',
        };
      }),
    };
  }

  /**
   * A4 (2026-08-23) — sessoes fisicas, nao entidades.
   *
   * ANTERIOR (rollback): _mediaModel contava ENTIDADES ativas. Como a TV
   * publica por duas integracoes e o Spotify aparece tanto na entidade do
   * SpotifyPlus quanto na do Echo que reproduz, o status somava integracoes.
   *
   * Aqui as entidades ativas sao colapsadas em SESSOES:
   *   1. entidades do mesmo endpoint declarado viram uma so (TV da Sala);
   *   2. o Echo que espelha a reproducao do Spotify e absorvido pela sessao
   *      do Spotify — decidido pelo MESMO helper que os room tiles usam;
   *   3. Echo com conteudo proprio permanece sessao independente;
   *   4. Spotify sem endpoint reconhecivel continua sendo uma sessao.
   */
  _mediaSessions() {
    const ativas = (this._config.entities.media || [])
      .filter((id) => BRUNO_TOP_BADGES_MEDIA_ON_STATES.includes(this._state(id)?.state || ''));
    const restantes = new Set(ativas);
    const sessoes = [];

    // 1) endpoints declarados: varias entidades, um aparelho.
    for (const grupo of BRUNO_TOP_BADGES_MEDIA_ENDPOINTS) {
      const membros = grupo.entities.filter((id) => restantes.has(id));
      if (!membros.length) continue;
      membros.forEach((id) => restantes.delete(id));
      sessoes.push({ entityId: membros[0], membros, title: grupo.title, fonte: 'tv' });
    }

    // 2) Spotify absorve o alto-falante que espelha a mesma reproducao.
    for (const id of Array.from(restantes)) {
      if (!id.includes('spotify')) continue;
      restantes.delete(id);
      const spotify = this._state(id);
      const membros = [id];
      let endpoint = '';
      for (const outro of Array.from(restantes)) {
        const falante = this._state(outro);
        const mesmoConteudo = altoFalanteCasa(spotify?.attributes, falante);
        const mesmoDispositivo = dispositivoDoComodo(spotify?.attributes, this._entityName(outro));
        if (!mesmoConteudo && !mesmoDispositivo) continue;
        restantes.delete(outro);
        membros.push(outro);
        endpoint = this._entityName(outro);
      }
      sessoes.push({
        entityId: id,
        membros,
        title: endpoint ? `Spotify - ${endpoint}` : this._entityName(id),
        fonte: 'spotify',
      });
    }

    // 3) o que sobrou toca por conta propria.
    for (const id of restantes) {
      sessoes.push({ entityId: id, membros: [id], title: this._entityName(id), fonte: 'outro' });
    }

    return sessoes;
  }

  _mediaModel() {
    const active = this._mediaSessions();
    return {
      key: 'media',
      title: 'Media',
      sub: active.length ? `${active.length} On` : 'All Off',
      icon: 'mdi:speaker-wireless',
      // ANTERIOR (rollback A4 2026-08-23): tone: 'gray' — ativo ficava
      // visualmente igual a inativo. O violeta e a linguagem que o proprio
      // dashboard ja usa para midia/TV (--accent-purple do room tile).
      tone: 'purple',
      active: active.length > 0,
      // O chip continua agindo sobre UMA entidade (a mesma de antes: a que
      // representa a sessao), entao play-pause-media nao muda de contrato.
      chips: active.map((sessao) => ({
        icon: sessao.fonte === 'tv' ? 'mdi:television-classic' : 'mdi:music-note',
        title: sessao.title,
        sub: (this._state(sessao.entityId)?.state || 'on').replace('_', ' '),
        entityId: sessao.entityId,
        action: 'play-pause-media',
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
          entityId: id,
          action: 'toggle-climate',
        };
      }),
    };
  }

  _curtainOpenPosition(item) {
    const entityId = item.entity || item.cover;
    const cover = this._state(entityId);
    const state = String(cover?.state || '').toLowerCase();
    // ANTERIOR (rollback A1 2026-08-23): o helper de percentual tinha
    // prioridade sobre a posicao fisica aqui, ao contrario da subview.
    //   const percentControl = ...;
    //   if (percentControl != null) return 100 - percentControl;
    //   const coverPosition = ...;
    //
    // O helper representa o ALVO do comando e salta a 0/100 enquanto o motor
    // ainda corre — foi por isso que a subview o rebaixou a fallback em
    // 2026-08-15. Com as duas prioridades opostas, barra e subview liam
    // fontes diferentes e divergiam. Agora a ordem e a MESMA da subview:
    // posicao fisica primeiro, helper so quando o cover nao mede posicao.
    const coverPosition = this._toPercent(cover?.attributes?.current_position);
    if (coverPosition != null) {
      if (state === 'open' && coverPosition <= 1) return 100;
      if (state === 'closed' && coverPosition >= 99) return 0;
      return coverPosition;
    }

    const percentEntity = this._state(item.percent_control || item.percentControl);
    const percentControl = this._isUnavailable(percentEntity) ? null : this._toPercent(percentEntity?.state);
    if (percentControl != null) return 100 - percentControl;

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
      const displayOpenPosition = openPosition == null ? null : this._curtainDisplayOpenPosition(openPosition);
      const displayClosedPosition = displayOpenPosition == null ? null : 100 - displayOpenPosition;
      return {
        icon: displayClosedPosition != null && displayClosedPosition >= 97 ? 'mdi:curtains-closed' : 'mdi:curtains',
        title: item.title || this._entityName(entityId),
        sub: displayClosedPosition == null ? 'indisponivel' : `${displayClosedPosition}% fechada`,
        active: available && (state === 'opening' || state === 'closing'),
        entityId,
        action: available ? 'toggle-curtain' : '',
        value: displayClosedPosition,
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

  // Prioridade exclusiva do telefone. O tablet conserva a ordem historica.
  // Nivel 0: anomalia/atencao; nivel 1: atividade; nivel 2: estado normal.
  // O indice original desempata, impedindo trocas arbitrarias a cada update.
  _mobilePriority(model) {
    const text = `${model?.title || ''} ${model?.sub || ''}`.toLowerCase();
    const securityAttention = model?.key === 'security' && model?.active;
    const explicitAttention = /unlocked|door open|error|offline|unavailable/.test(text);
    if (securityAttention || explicitAttention) return 0;

    const curtainRelevant = model?.key === 'curtains'
      && (model.chips || []).some((chip) => chip.active || (Number.isFinite(chip.value) && chip.value < 97));
    if (model?.active || curtainRelevant) return 1;
    return 2;
  }

  _models() {
    const models = [
      this._securityModel(),
      this._curtainsModel(),
      this._lightsModel(),
      this._mediaModel(),
      this._climateModel(),
      // NOVO (2026-07-25) — HOME V2 item 3: o card de energia saiu da Home,
      // então o resumo de consumo passou a viver aqui. Se o package
      // home_insights nao estiver carregado, o badge se omite (ver
      // _energyModel -> retorno null filtrado abaixo).
      this._energyModel(),
    ].filter(Boolean);

    // NOVO (2026-08-16) — status prioritarios somente no mobile.
    // ANTERIOR (rollback): retorno direto da lista fixa acima. Remover este
    // bloco devolve Security -> Cortinas -> Luzes -> Midia -> Clima -> Energia
    // em todas as larguras. A faixa continua horizontal e com a mesma altura.
    const isPhone = globalThis.matchMedia?.('(max-width: 800px)')?.matches === true;
    if (!isPhone) return models;
    return models
      .map((model, index) => ({ model, index, priority: this._mobilePriority(model) }))
      .sort((left, right) => (left.priority - right.priority) || (left.index - right.index))
      .map((item) => item.model);
  }

  // NOVO (2026-07-25) — Badge de Energia.
  // TODA a matemática (kW + desvio %) vem do backend, em
  // sensor.home_energy_status (package home_insights.yaml) — fonte única
  // compartilhada com as linhas inteligentes do hero. Aqui só se exibe.
  _energyModel() {
    const status = this._state(this._config.entities.energy_status
      || 'sensor.home_energy_status');
    if (!status || ['unknown', 'unavailable'].includes(String(status.state).toLowerCase())) {
      return null;
    }

    const attributes = status.attributes || {};
    const deltaRaw = attributes.delta_pct;
    const delta = Number.parseInt(deltaRaw, 10);
    const hasDelta = Number.isFinite(delta);
    const chips = [];

    const addChip = (entityId, title, icon) => {
      const entity = this._state(entityId);
      if (!entity || this._isUnavailable(entity)) return;
      const value = Number.parseFloat(entity.state);
      chips.push({
        icon,
        title,
        sub: Number.isFinite(value) ? `${value.toFixed(1).replace('.', ',')} kWh` : entity.state,
        entityId,
      });
    };

    addChip('sensor.energia_total_casa_diaria', 'Hoje', 'mdi:calendar-today');
    addChip('sensor.energia_total_casa_semanal', 'Semana', 'mdi:calendar-week');
    addChip('sensor.energia_total_casa_mensal', 'Mes', 'mdi:calendar-month');
    addChip('sensor.energia_luzes_diaria', 'Luzes', 'mdi:lightbulb');
    addChip('sensor.energia_clima_diaria', 'Clima', 'mdi:air-conditioner');

    return {
      key: 'energy',
      title: 'Energy',
      sub: attributes.badge_sub || `${status.state} kW`,
      icon: 'mdi:flash',
      tone: 'amber',
      // Aceso apenas quando o consumo está acima do esperado para o horário.
      active: hasDelta && delta > 15,
      chips,
    };
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

  _callService(domainService, data = {}) {
    if (!this._hass || !domainService) return;
    const [domain, service] = String(domainService).split('.');
    if (!domain || !service) return;
    this._hass.callService(domain, service, data);
  }

  _runChipAction(action, entityId, value) {
    if (!action || !entityId) return;
    globalThis.BrunoLiquidGlass?.feedback?.('tap');

    if (action === 'toggle-light') {
      this._callService('light.toggle', { entity_id: entityId });
      return;
    }

    if (action === 'play-pause-media') {
      const state = String(this._state(entityId)?.state || '').toLowerCase();
      if (!BRUNO_TOP_BADGES_MEDIA_ON_STATES.includes(state)) return;
      this._callService('media_player.media_play_pause', { entity_id: entityId });
      return;
    }

    if (action === 'toggle-climate') {
      const entity = this._state(entityId);
      const state = String(entity?.state || '').toLowerCase();
      if (!entity || ['unavailable', 'unknown', '', 'none'].includes(state)) return;
      const service = state === 'off' ? 'climate.turn_on' : 'climate.turn_off';
      this._callService(service, { entity_id: entityId });
      return;
    }

    if (action === 'toggle-curtain') {
      const state = String(this._state(entityId)?.state || '').toLowerCase();
      const closedPercent = Number(value);
      const service = state === 'closed'
        ? 'cover.open_cover'
        : state === 'open'
          ? 'cover.close_cover'
          : Number.isFinite(closedPercent) && closedPercent >= 50
            ? 'cover.open_cover'
            : 'cover.close_cover';
      this._callService(service, { entity_id: entityId });
      return;
    }

    if (action === 'lock') {
      if (this._state(entityId)?.state !== 'unlocked') return;
      this._callService('lock.lock', { entity_id: entityId });
    }
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

  _wireChipActions() {
    this.shadowRoot.querySelectorAll('button[data-chip-action][data-chip-entity]').forEach((button) => {
      const clearPress = () => button.classList.remove('is-pressed');

      button.addEventListener('pointerdown', (event) => {
        if (event.button != null && event.button !== 0) return;
        event.stopPropagation();
        button.classList.add('is-pressed');
      });

      button.addEventListener('pointerup', clearPress);
      button.addEventListener('pointerleave', clearPress);
      button.addEventListener('pointercancel', clearPress);

      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        clearPress();
        this._runChipAction(button.dataset.chipAction, button.dataset.chipEntity, button.dataset.chipValue);
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

        /* NOVO (2026-08-06) — ALINHAMENTO COM AS SUBVIEWS.
           A faixa da Home ficava 10px abaixo da faixa das subviews. A causa
           esta no grid da Home (views/shell/section_home_v2.yaml) e o proprio
           autor a registrou:

             "Movida para o TOPO: o gap volta a ser um so (10px).
              Efeito colateral aceito: a faixa de badges desce 10px."

           A primeira linha do grid e uma linha-fantasma de 0px (safety net
           Sagaland, para as areas usadas so no phone). Ao move-la para o topo,
           o grid-gap de 10px passou a ficar ACIMA da faixa. Nas subviews a
           barra e a primeira linha real, sem gap acima.

           Correcao aqui, e nao no grid, de proposito: a aritmetica das linhas
           esta calibrada para somar 100vh e a constante do hero e espelhada em
           v2/bento_dynamic.yaml (available_height). Puxar o card 10px para
           cima cancela exatamente o gap, sem tocar em nenhuma das duas.

           A linha do grid continua com 48px, entao o hero nao se move.
           So no desktop/tablet: no phone a faixa ja e a primeira linha real.
           ROLLBACK: remover este bloco. */
        /* REMOVIDO (2026-08-06, rev.6) — TENTATIVA FRUSTRADA.
           margin-top: -10px no :host NAO move a faixa na Home: o layout-card
           envolve cada card num wrapper, e o item do grid e o WRAPPER. A margem
           deslocava o card DENTRO do wrapper, sem efeito na posicao da linha.
           A correcao real foi remover a linha-fantasma de 0px do grid da Home
           (views/shell/section_home_v2.yaml, rev.6). */

        /* NOVO (2026-08-06, 2a passada) — O DEGRAU NAO ERA POSICAO.
           Depois do ajuste acima, a geometria da Home e a da subview passaram a
           coincidir. Medido, com os dois cards montados na mesma pagina:

             Home    badge topo 13px · altura 46px · icone 18px
             Subview badge topo 13px · altura 46px · icone 18px

           O que sobrava era a PELE. As badges da Home eram PILULAS (borda,
           fundo, sombra e blur); as das subviews sao FLAT — so icone e texto.
           Uma pilula de 46px pinta um bloco de 13 a 59; a versao flat pinta so
           a tinta do conteudo. O olho le isso como degrau na transicao, mesmo
           com as caixas alinhadas ao pixel.

           Igualar a pele resolve de verdade e ainda atende o pedido anterior de
           "revisar o tamanho dos indicadores superiores": sem a pilula, a faixa
           fica mais leve.

           ROLLBACK: remover este bloco — as regras originais da pilula seguem
           logo abaixo, intactas. */
        @media (min-width: 901px) {
          .badge {
            border: 1px solid transparent;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            padding: 0 16px;
            column-gap: 9px;
          }
          .badge:hover {
            background: rgba(255, 255, 255, 0.04);
          }
          /* Aceso: a subview acende pelo TOM do grupo, sem pilula branca. */
          .badge.is-active {
            background: transparent;
            border-color: transparent;
            color: rgba(255, 255, 255, 0.96);
            box-shadow: none;
          }
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

        .badge-icon bruno-icon {
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

        button.chip {
          appearance: none;
          -webkit-appearance: none;
          font: inherit;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        button.chip:focus {
          outline: none;
        }

        .chip bruno-icon {
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
        /* A4: mesmo RGB de --accent-purple usado no dot de midia do room tile. */
        .tone-purple { --tone: 167, 139, 250; }
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

        /* NOVO (2026-08-15) — microajuste EXCLUSIVO do phone.
           A faixa visual da Home comecava em y=10px, enquanto o plano visual
           equivalente das subviews comecava em y=4,16px. O fluxo ja estava
           correto e nao podia ceder altura do hero; por isso o ajuste e apenas
           de pintura. A caixa continua reservando os mesmos 48px e somente seu
           conteudo sobe os 5,84px medidos no harness.

           ANTERIOR (rollback desta rodada): o transform foi colocado dentro do
           media de 900px. Isso tambem alcançaria a faixa 801–900px, que pertence
           ao tablet. O breakpoint correto e o contrato phone da shell: 800px. */
        @media (max-width: 800px) {
          :host { transform: translateY(-5.84px); }
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

        /* ============================================================
           NOVO (2026-08-16) — LARGURA UNIFORME DAS TILES DE STATUS.

           POR ULTIMO de proposito. O bloco de re-skin acima redefine
           ".badge { padding: 0 16px }" sem media query; media query nao
           acrescenta especificidade, entao quem decide e a POSICAO. Colocado
           antes, o padding daqui era ignorado — medido.

           O DEFEITO: o bloco de 900px deixa ".badge { flex: 0 0 auto }", ou
           seja, largura ditada pelo CONTEUDO. Medido a 428px: 99,3 · 101,8 ·
           96,1 · 96,1 · 98,4 — desiguais. As quatro primeiras somavam 394,2 de
           408 uteis, entao bastava um rotulo mais longo (Energia) ser
           priorizado para a quarta ser cortada.

           25% da caixa de conteudo do trilho => quatro tiles ocupam a largura
           util EXATA, com qualquer combinacao que a prioridade escolher. O
           filete entre badges e "border-left" e o box-sizing e border-box,
           entao ele nao acrescenta largura.

           A LOGICA de prioridade (nivel 0 atencao, 1 atividade, 2 normal) NAO e
           tocada — so a geometria.

           BREAKPOINT: 800px, o contrato de telefone da shell. O bloco de 900px
           alcanca 801-900, que e faixa de tablet.

           ROLLBACK: remover este bloco; volta a largura por conteudo.
           ============================================================ */
        @media (max-width: 800px) {
          .badge {
            flex: 0 0 25%;
            min-width: 0;
            /* 16px de cada lado custavam 31% de uma tile de 101,5px. 10px
               devolve 12px ao texto sem encostar no filete. */
            padding: 0 10px;
            column-gap: 7px;
          }

          /* Sem isto um rotulo longo transborda a tile em vez de truncar, e a
             largura fixa nao adiantaria nada: o texto invadiria a vizinha. */
          .badge .badge-text { min-width: 0; max-width: 100%; }
          .badge .badge-title,
          .badge .badge-sub {
            display: block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
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
    this._wireChipActions();
  }

  _badge(model, expanded) {
    const activeClass = model.active ? ' is-active' : '';
    const expandedClass = expanded === model.key ? ' is-expanded' : '';
    return `
      <button class="badge tone-${model.tone}${activeClass}${expandedClass}" type="button" data-badge-key="${model.key}" aria-label="${BrunoTopBadgesCard._escapeAttr(model.title)}">
        <span class="badge-icon" aria-hidden="true"><bruno-icon icon="${model.icon}"></bruno-icon></span>
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
    const renderChip = (chip) => {
      const body = `
        <bruno-icon icon="${chip.icon}"></bruno-icon>
        <span class="chip-text">
          <span class="chip-title">${BrunoTopBadgesCard._escape(chip.title)}</span>
          <span class="chip-sub">${BrunoTopBadgesCard._escape(chip.sub)}</span>
        </span>
      `;
      if (!chip.action || !chip.entityId) {
        return `<span class="chip">${body}</span>`;
      }
      const valueAttr = chip.value == null ? '' : ` data-chip-value="${BrunoTopBadgesCard._escapeAttr(chip.value)}"`;
      const label = [chip.title, chip.sub].filter(Boolean).join(' - ');
      return `
        <button class="chip" type="button" data-chip-action="${BrunoTopBadgesCard._escapeAttr(chip.action)}" data-chip-entity="${BrunoTopBadgesCard._escapeAttr(chip.entityId)}"${valueAttr} aria-label="${BrunoTopBadgesCard._escapeAttr(label)}">
          ${body}
        </button>
      `;
    };
    return `
      <div class="rail tone-${model.tone}">
        ${model.chips.map((chip) => renderChip(chip)).join('')}
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
