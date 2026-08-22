// home-mobile-v4.js — Home phone V4, validação isolada (2026-08-22)
//
// Escopo estrito: <=800px.
// - hero sem agenda/insights;
// - pager de cômodos 2 páginas;
// - Bento Favoritos (Agenda/Casa, Wi-Fi e 4 cenas).
//
// IMPORTANTE: os cards-filho são criados com loadCardHelpers(), o mesmo padrão
// já validado em bruno-activity-column.js. Nenhum setConfig() de filho pode
// propagar exceção e derrubar o compositor inteiro.
//
// O microindicador da rail NÃO é alterado aqui. Sua semântica V4 está declarada
// em shell/rail.yaml, usando os três binary_sensor.home_activity_*.

const BRUNO_HOME_V4_QUERY = '(max-width: 800px)';
const BRUNO_HOME_V4_TAG = 'bruno-home-phone-v4-card';
const brunoHomeV4IsPhone = () => Boolean(globalThis.matchMedia?.(BRUNO_HOME_V4_QUERY).matches);

const BRUNO_HOME_V4_CALENDARS = [
  ['calendar.brunohelasio_gmail_com', 'Bruno'],
  ['calendar.familia', 'Familia'],
  ['calendar.birthdays', 'Aniversarios'],
  ['calendar.feriados_no_brasil', 'Feriados'],
];

const BRUNO_HOME_V4_PAGE2_ACTIVITY = [
  [
    'light.grupo_luzes_office',
    'binary_sensor.office_motion_recent',
    'binary_sensor.office_occupancy',
    'binary_sensor.office_pc_active',
    'climate.ac_office',
    'media_player.echo_pop_office',
  ],
  [
    'light.grupo_quarto_casal',
    'binary_sensor.q_casal_motion_recent',
    'binary_sensor.q_casal_occupancy',
    'media_player.echo_pop_quarto_casal',
  ],
  [
    'light.grupo_luzes_quarto_marina',
    'binary_sensor.q_marina_motion_recent',
    'binary_sensor.q_marina_occupancy',
    'climate.ac_quarto_marina',
    'media_player.echo_pop_marina',
  ],
  [
    'light.grupo_luzes_quarto_miguel',
    'binary_sensor.q_miguel_motion_recent',
    'binary_sensor.q_miguel_occupancy',
    'climate.ac_quarto_miguel',
  ],
];

const BRUNO_HOME_V4_SCENES = [
  ['Bom dia', 'script.bruno_scene_bom_dia', 'mdi:weather-sunset-up'],
  ['Sair', 'script.bruno_scene_sair_de_casa', 'mdi:exit-run'],
  ['Cinema', 'script.bruno_scene_cinema', 'mdi:movie-open'],
  ['Boa noite', 'script.bruno_scene_boa_noite', 'mdi:weather-night'],
];

class BrunoHomePhoneV4Card extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = { ...(config || {}) };
    this._page = this._page || 0;
    this._events = this._events || [];
    this._cards = this._cards || new Map();
    this._lastCalendarLoad = this._lastCalendarLoad || 0;
    this._renderShell();
    this._ensureCards();
  }

  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this._cards?.forEach((card) => {
      try {
        card.hass = hass;
      } catch (error) {
        console.warn('[home-mobile-v4] falha ao atualizar card-filho:', error);
      }
    });
    this._sync();
    if (first || Date.now() - this._lastCalendarLoad > 300000) this._loadCalendar();
  }

  connectedCallback() {
    this._renderShell();
    this._ensureCards();
    this._loadCalendar();
  }

  disconnectedCallback() {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._cardRetryTimer) clearTimeout(this._cardRetryTimer);
    this._cardRetryTimer = null;
  }

  getCardSize() {
    return 11;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isActive(entityId) {
    const entity = this._state(entityId);
    if (!entity) return false;
    const state = String(entity.state || '').toLowerCase();
    const domain = String(entityId).split('.')[0];

    if (['binary_sensor', 'light', 'switch', 'input_boolean'].includes(domain)) return state === 'on';
    if (domain === 'media_player') return ['playing', 'paused', 'buffering', 'on'].includes(state);
    if (domain === 'climate') return !['', 'off', 'idle', 'unavailable', 'unknown', 'none'].includes(state);
    return !['', 'off', 'idle', 'standby', 'closed', 'not_home', 'unknown', 'unavailable', 'none'].includes(state);
  }

  _page2ActiveCount() {
    return BRUNO_HOME_V4_PAGE2_ACTIVITY.filter((entities) => entities.some((id) => this._isActive(id))).length;
  }

  _rooms() {
    return Array.isArray(this._config?.rooms) ? this._config.rooms.slice(0, 7) : [];
  }

  async _ensureCards() {
    if (this._creatingCards || !this.shadowRoot || this._rooms().length < 7) return;
    this._creatingCards = true;

    try {
      const helpers = await globalThis.loadCardHelpers?.();
      if (!helpers?.createCardElement) throw new Error('loadCardHelpers indisponivel');

      const rooms = this._rooms();
      for (let index = 0; index < 7; index += 1) {
        if (this._cards.has(index)) continue;
        const slot = this.shadowRoot.querySelector(`[data-room="${index}"]`);
        const config = rooms[index];
        if (!slot || !config?.type) continue;

        try {
          const card = helpers.createCardElement(config);
          if (this._hass) card.hass = this._hass;
          slot.replaceChildren(card);
          this._cards.set(index, card);
        } catch (error) {
          // Um cômodo nunca pode transformar o compositor inteiro em hui-error-card.
          console.error(`[home-mobile-v4] falha ao criar cômodo ${index}:`, error, config);
          slot.innerHTML = '<span class="room-fallback">Cômodo indisponível</span>';
        }
      }
    } catch (error) {
      console.warn('[home-mobile-v4] helpers ainda indisponíveis; nova tentativa:', error);
      if (this.isConnected && !this._cardRetryTimer) {
        this._cardRetryTimer = setTimeout(() => {
          this._cardRetryTimer = null;
          this._ensureCards();
        }, 250);
      }
    } finally {
      this._creatingCards = false;
    }
  }

  _networkModel() {
    const value = (id) => {
      const state = this._state(id)?.state;
      if (state == null || ['unknown', 'unavailable', 'none', ''].includes(String(state).toLowerCase())) return '--';
      return String(state);
    };

    const aps = ['sensor.unifi_office_ap', 'sensor.unifi_wall_ap', 'sensor.unifi_bedroom_ap'];
    const online = aps.filter((id) => !['--', 'off', 'unavailable'].includes(value(id).toLowerCase())).length;
    const wan = value('binary_sensor.arris_tg3442de_wan_status').toLowerCase();
    const status = ['--', 'off', 'unavailable', 'unknown'].includes(wan) || online === 0
      ? 'Offline'
      : online < aps.length
        ? 'Parcial'
        : 'Excelente';

    return {
      status,
      download: value('sensor.speedtest_download'),
      upload: value('sensor.speedtest_upload'),
    };
  }

  _insightModel() {
    const items = this._state('sensor.home_insights')?.attributes?.items;
    const item = Array.isArray(items) ? items[0] : null;
    if (!item?.text) return null;
    return { text: String(item.text), tone: String(item.tone || 'amber') };
  }

  _nextEventModel() {
    const event = this._events[0];
    if (!event) return { summary: 'Agenda livre', time: 'Hoje', detail: 'Sem compromissos' };

    let time = 'Dia todo';
    if (!event.allDay) {
      const clock = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      time = event.start.toDateString() === new Date().toDateString()
        ? clock
        : `${event.start.toLocaleDateString([], { day: '2-digit', month: 'short' })} · ${clock}`;
    }

    return { summary: event.summary, time, detail: event.calendarName };
  }

  async _loadCalendar() {
    if (!this._hass?.callWS || this._loadingCalendar || !this.isConnected) return;
    if (Date.now() - this._lastCalendarLoad < 15000) return;
    this._loadingCalendar = true;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + 3 * 24 * 60 * 60 * 1000);

    try {
      const groups = await Promise.all(BRUNO_HOME_V4_CALENDARS.map(async ([entityId, name]) => {
        try {
          const response = await this._hass.callWS({
            type: 'calendar/list_events',
            entity_id: entityId,
            start: start.toISOString(),
            end: end.toISOString(),
          });
          const rows = Array.isArray(response?.events) ? response.events : Array.isArray(response) ? response : [];
          return rows.map((row) => {
            const raw = row?.start?.dateTime || row?.start?.date || row?.start;
            if (!raw) return null;

            let date;
            if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
              const [year, month, day] = raw.split('-').map(Number);
              date = new Date(year, month - 1, day);
            } else {
              date = new Date(raw);
            }
            if (Number.isNaN(date.getTime())) return null;

            return {
              summary: row?.summary || row?.message || 'Evento',
              start: date,
              startMs: date.getTime(),
              allDay: Boolean(row?.start?.date && !row?.start?.dateTime),
              calendarName: name,
            };
          }).filter(Boolean);
        } catch (error) {
          console.warn(`[home-mobile-v4] agenda ${entityId}:`, error);
          return [];
        }
      }));

      this._events = groups
        .flat()
        .filter((event) => event.startMs >= Date.now() - 60 * 60 * 1000 || event.allDay)
        .sort((a, b) => a.startMs - b.startMs);
      this._lastCalendarLoad = Date.now();
      this._sync();
    } finally {
      this._loadingCalendar = false;
    }
  }

  _goToPage(page) {
    const pages = this.shadowRoot?.querySelector('.pages');
    if (!pages) return;
    const next = Math.max(0, Math.min(1, Number(page) || 0));
    pages.scrollTo({ left: next * pages.clientWidth, behavior: 'smooth' });
  }

  _syncPager() {
    this.shadowRoot?.querySelectorAll('[data-page]').forEach((button) => {
      button.classList.toggle('is-active', Number(button.dataset.page) === this._page);
    });
  }

  _sync() {
    if (!this.shadowRoot) return;

    const activeRooms = this._page2ActiveCount();
    const activity = this.shadowRoot.querySelector('.room-activity');
    if (activity) {
      activity.hidden = this._page !== 0 || activeRooms === 0;
      activity.textContent = String(activeRooms);
    }

    const network = this._networkModel();
    const status = this.shadowRoot.querySelector('[data-net-status]');
    if (status) {
      status.textContent = network.status;
      status.dataset.state = network.status.toLowerCase();
    }
    const download = this.shadowRoot.querySelector('[data-download]');
    const upload = this.shadowRoot.querySelector('[data-upload]');
    if (download) download.textContent = network.download;
    if (upload) upload.textContent = network.upload;

    const event = this._nextEventModel();
    const insight = this._insightModel();
    const eventSummary = this.shadowRoot.querySelector('[data-event-summary]');
    const eventTime = this.shadowRoot.querySelector('[data-event-time]');
    const eventDetail = this.shadowRoot.querySelector('[data-event-detail]');
    const insightDot = this.shadowRoot.querySelector('.insight-dot');
    if (eventSummary) eventSummary.textContent = event.summary;
    if (eventTime) eventTime.textContent = event.time;
    if (eventDetail) eventDetail.textContent = insight?.text || event.detail;
    if (insightDot) {
      insightDot.hidden = !insight;
      insightDot.dataset.tone = insight?.tone || 'amber';
    }
  }

  _wire() {
    const pages = this.shadowRoot?.querySelector('.pages');
    pages?.addEventListener('scroll', () => {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        const page = Math.max(0, Math.min(1, Math.round(pages.scrollLeft / Math.max(1, pages.clientWidth))));
        if (page === this._page) return;
        this._page = page;
        this._syncPager();
        this._sync();
      });
    }, { passive: true });

    this.shadowRoot?.querySelectorAll('[data-page]').forEach((button) => {
      button.addEventListener('click', () => this._goToPage(Number(button.dataset.page)));
    });

    this.shadowRoot?.querySelector('[data-network]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('ll-custom', {
        detail: { action: 'fire-dom-event', bruno_action: 'network' },
        bubbles: true,
        composed: true,
      }));
    });

    this.shadowRoot?.querySelector('[data-agenda]')?.addEventListener('click', () => {
      this.dispatchEvent(new CustomEvent('hass-more-info', {
        detail: { entityId: 'calendar.brunohelasio_gmail_com' },
        bubbles: true,
        composed: true,
      }));
    });

    this.shadowRoot?.querySelectorAll('[data-scene]').forEach((button) => {
      button.addEventListener('click', async () => {
        const scene = BRUNO_HOME_V4_SCENES[Number(button.dataset.scene)];
        if (!scene || !this._hass || button.disabled) return;
        button.disabled = true;
        button.classList.add('is-running');
        try {
          await this._hass.callService('script', 'turn_on', {}, { entity_id: scene[1] });
          globalThis.BrunoLiquidGlass?.feedback?.('tap');
        } catch (error) {
          console.warn(`[home-mobile-v4] cena ${scene[0]}:`, error);
        } finally {
          setTimeout(() => {
            button.disabled = false;
            button.classList.remove('is-running');
          }, 650);
        }
      });
    });
  }

  _renderShell() {
    if (!this._config || !brunoHomeV4IsPhone()) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    if (this.shadowRoot.querySelector('.home-v4')) return;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-width: 0;
          height: auto;
          min-height: 0;
          color: rgba(255,255,255,0.94);
          contain: layout style;
        }
        * { box-sizing: border-box; letter-spacing: 0; }
        button { font: inherit; color: inherit; }
        h2 {
          margin: 0 0 6px 10px;
          font: 760 14px/1 system-ui, -apple-system, sans-serif;
          text-shadow: 0 2px 12px rgba(0,0,0,0.28);
        }
        .home-v4 { display: block; width: 100%; min-width: 0; }
        .pages {
          width: 100%;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 100%;
          gap: 10px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }
        .pages::-webkit-scrollbar { display: none; }
        .page {
          height: 352px;
          display: grid;
          grid-template: repeat(2, 172px) / repeat(2, minmax(0, 1fr));
          gap: 8px;
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        .social [data-room="0"] { grid-column: 1 / -1; }
        .room { height: 172px; min-width: 0; min-height: 0; overflow: hidden; }
        .room > * { display: block; width: 100%; height: 100%; min-width: 0; min-height: 0; }
        .room-fallback {
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.10);
          background: rgba(20,22,28,0.30);
          color: rgba(255,255,255,0.52);
          font: 650 11px/1 system-ui;
        }
        .pager {
          height: 22px;
          margin: 4px 5px 5px 0;
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 7px;
        }
        .page-dots { display: flex; gap: 6px; }
        .page-dot {
          appearance: none;
          width: 7px;
          height: 7px;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.34);
        }
        .page-dot.is-active { background: rgba(255,255,255,0.92); }
        .room-activity {
          min-width: 19px;
          height: 19px;
          padding: 0 5px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          background: var(--bruno-accent-amber, #f7c600);
          box-shadow: 0 0 10px rgba(247,198,0,0.40);
          color: #0c0e14;
          font: 820 10px/1 system-ui;
        }
        .room-activity[hidden] { display: none; }
        .favorites-title { margin-top: 4px; }
        .bento {
          --square: clamp(128px, 34vw, 145px);
          display: grid;
          grid-template-columns: minmax(0, 1fr) var(--square);
          grid-template-rows: var(--square);
          gap: 8px;
        }
        .favorite-left {
          display: grid;
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 8px;
          min-width: 0;
        }
        .favorite-card,
        .scenes-card {
          position: relative;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.15);
          background:
            radial-gradient(100px 62px at 18% 0%, rgba(255,255,255,0.14), transparent 72%),
            linear-gradient(160deg, rgba(68,57,50,0.48), rgba(35,31,30,0.36));
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), 0 8px 24px rgba(0,0,0,0.18);
          backdrop-filter: blur(24px) saturate(1.18);
          -webkit-backdrop-filter: blur(24px) saturate(1.18);
        }
        .favorite-card {
          appearance: none;
          width: 100%;
          display: grid;
          grid-template-columns: 32px minmax(0,1fr);
          align-items: center;
          gap: 8px;
          padding: 8px 10px;
          border-radius: 19px;
          text-align: left;
          cursor: pointer;
        }
        .favorite-card:active { transform: scale(0.99); }
        .favorite-icon {
          width: 32px;
          height: 32px;
          border-radius: 12px;
          display: grid;
          place-items: center;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.09);
        }
        .favorite-icon bruno-icon { --mdc-icon-size: 19px; }
        .favorite-copy { min-width: 0; display: grid; gap: 2px; }
        .favorite-top { display: flex; align-items: center; gap: 6px; min-width: 0; }
        .favorite-top > span:first-child {
          flex: 1;
          font-size: 9px;
          font-weight: 760;
          color: rgba(255,255,255,0.58);
        }
        .favorite-top em {
          max-width: 72px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font: 800 9px/1 system-ui;
          color: rgba(255,255,255,0.72);
        }
        .favorite-copy strong,
        .favorite-copy small { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .favorite-copy strong { font: 760 11px/1.12 system-ui; }
        .favorite-copy small { font: 620 8.7px/1.1 system-ui; color: rgba(255,255,255,0.52); }
        .insight-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #f7c600;
          box-shadow: 0 0 7px rgba(247,198,0,0.44);
        }
        .insight-dot[hidden] { display: none; }
        .insight-dot[data-tone="red"] { background: #ff453a; }
        .insight-dot[data-tone="blue"] { background: #7fdbe9; }
        .insight-dot[data-tone="green"] { background: #30d158; }
        [data-net-status][data-state="excelente"] { color: #62d27b; }
        [data-net-status][data-state="parcial"] { color: #f7c600; }
        [data-net-status][data-state="offline"] { color: #ff6259; }
        .network-metrics { display: flex; gap: 7px; }
        .network-metrics span { display: flex; align-items: center; gap: 2px; }
        .network-metrics bruno-icon { --mdc-icon-size: 10px; }
        .scenes-card {
          border-radius: 21px;
          padding: 8px;
          display: grid;
          grid-template-rows: 17px 1fr;
          gap: 5px;
        }
        .scenes-card > strong {
          padding-left: 2px;
          font: 780 10px/1 system-ui;
          color: rgba(255,255,255,0.74);
        }
        .scene-grid {
          display: grid;
          grid-template: repeat(2,1fr) / repeat(2,1fr);
          gap: 5px;
          min-height: 0;
        }
        .scene-button {
          appearance: none;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 3px;
          min-width: 0;
          min-height: 0;
          padding: 4px 2px;
          border: 1px solid rgba(255,255,255,0.09);
          border-radius: 13px;
          background: rgba(255,255,255,0.045);
        }
        .scene-button bruno-icon { --mdc-icon-size: 17px; }
        .scene-button span {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font: 690 7.5px/1 system-ui;
          color: rgba(255,255,255,0.66);
        }
        .scene-button:active,
        .scene-button.is-running { transform: scale(0.96); background: rgba(255,255,255,0.09); }
        @media (max-width: 390px) {
          .bento { --square: 128px; }
          .favorite-card { grid-template-columns: 29px 1fr; gap: 6px; padding: 7px 8px; }
          .favorite-icon { width: 29px; height: 29px; }
          .favorite-copy strong { font-size: 10px; }
          .favorite-copy small { font-size: 8px; }
          .favorite-top em { max-width: 58px; font-size: 8px; }
        }
      </style>

      <div class="home-v4">
        <section aria-label="Cômodos">
          <h2>Cômodos</h2>
          <div class="pages">
            <div class="page social">
              <div class="room" data-room="0"></div>
              <div class="room" data-room="1"></div>
              <div class="room" data-room="2"></div>
            </div>
            <div class="page">
              <div class="room" data-room="3"></div>
              <div class="room" data-room="4"></div>
              <div class="room" data-room="5"></div>
              <div class="room" data-room="6"></div>
            </div>
          </div>
          <div class="pager">
            <span class="page-dots">
              <button class="page-dot is-active" data-page="0" aria-label="Página social"></button>
              <button class="page-dot" data-page="1" aria-label="Página íntima e trabalho"></button>
            </span>
            <span class="room-activity" hidden>0</span>
          </div>
        </section>

        <section aria-label="Favoritos">
          <h2 class="favorites-title">Favoritos</h2>
          <div class="bento">
            <div class="favorite-left">
              <button class="favorite-card" data-agenda>
                <span class="favorite-icon"><bruno-icon icon="mdi:calendar-blank-outline"></bruno-icon></span>
                <span class="favorite-copy">
                  <span class="favorite-top"><span>Agenda</span><i class="insight-dot" hidden></i><em data-event-time>Hoje</em></span>
                  <strong data-event-summary>Agenda livre</strong>
                  <small data-event-detail>Sem avisos da casa</small>
                </span>
              </button>

              <button class="favorite-card" data-network>
                <span class="favorite-icon"><bruno-icon icon="mdi:wifi"></bruno-icon></span>
                <span class="favorite-copy">
                  <span class="favorite-top"><span>Wi-Fi</span><em data-net-status>--</em></span>
                  <strong>Rede Principal</strong>
                  <small class="network-metrics">
                    <span><bruno-icon icon="mdi:download"></bruno-icon><b data-download>--</b></span>
                    <span><bruno-icon icon="mdi:upload"></bruno-icon><b data-upload>--</b></span>
                    <span>Mbps</span>
                  </small>
                </span>
              </button>
            </div>

            <div class="scenes-card">
              <strong>Cenas</strong>
              <div class="scene-grid">
                ${BRUNO_HOME_V4_SCENES.map((scene, index) => `
                  <button class="scene-button" data-scene="${index}" aria-label="Ativar cena ${BrunoHomePhoneV4Card._escape(scene[0])}">
                    <bruno-icon icon="${scene[2]}"></bruno-icon>
                    <span>${BrunoHomePhoneV4Card._escape(scene[0])}</span>
                  </button>
                `).join('')}
              </div>
            </div>
          </div>
        </section>
      </div>
    `;

    this._wire();
    this._syncPager();
    this._sync();
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_HOME_V4_TAG)) {
  customElements.define(BRUNO_HOME_V4_TAG, BrunoHomePhoneV4Card);
}

// ---------------------------------------------------------------------------
// HERO PHONE V4
// O patch de 17/08 continua carregado pelo configuration.yaml. Esta camada
// roda depois dele na view, cancela o carrossel no phone e remove seu style
// antes de aplicar a geometria V4. Tablet/desktop não são alterados.
// ---------------------------------------------------------------------------
function brunoHomeV4ApplyHero(card) {
  if (!card?.shadowRoot || card?._config?.hero_layout !== 'v2' || !brunoHomeV4IsPhone()) return;

  if (card.__brunoChatHeroTimer) {
    clearInterval(card.__brunoChatHeroTimer);
    card.__brunoChatHeroTimer = null;
  }

  const root = card.shadowRoot;
  root.querySelector('style[data-bruno-chat-hero-patch]')?.remove();
  root.querySelector('.bruno-chat-event-dots')?.remove();

  if (root.querySelector('style[data-bruno-home-v4-hero]')) return;
  const style = document.createElement('style');
  style.dataset.brunoHomeV4Hero = '1';
  style.textContent = `
    @media (max-width: 800px) {
      .hero-stage.is-v2 {
        height: 128px !important;
        min-height: 128px !important;
      }
      .hero-stage.is-v2 .content {
        padding: 5px 16px 4px !important;
        gap: 0 !important;
      }
      .hero-stage.is-v2 .headline {
        column-gap: 12px !important;
      }
      .hero-stage.is-v2 .date-line {
        margin-bottom: 4px !important;
      }
      .hero-stage.is-v2 .greeting {
        font-size: 19px !important;
      }
      .hero-stage.is-v2 .clock {
        margin-top: 0 !important;
        font-size: clamp(62px, 16.5vw, 69px) !important;
        line-height: 0.90 !important;
        font-weight: 220 !important;
      }
      .hero-stage.is-v2 .headline .event-stack {
        display: none !important;
        min-height: 0 !important;
        margin: 0 !important;
        padding: 0 !important;
      }
      .hero-stage.is-v2 .hero-bottom:not(.has-cameras) {
        display: none !important;
      }
      .hero-stage.is-v2 .inline-weather {
        display: grid !important;
        grid-template: auto auto / 23px minmax(0, auto) !important;
        grid-template-areas: "icon temp" "icon label" !important;
        align-items: center !important;
        column-gap: 7px !important;
        row-gap: 3px !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        margin-top: 0 !important;
        justify-self: end !important;
      }
      .hero-stage.is-v2 .inline-weather img {
        grid-area: icon !important;
        width: 23px !important;
        height: 23px !important;
      }
      .hero-stage.is-v2 .inline-weather strong {
        grid-area: temp !important;
        font-size: 16px !important;
        line-height: 1 !important;
      }
      .hero-stage.is-v2 .inline-weather small {
        grid-area: label !important;
        max-width: min(35vw, 142px) !important;
        font-size: 11px !important;
        line-height: 1.06 !important;
      }
    }
    @media (max-width: 390px) {
      .hero-stage.is-v2 {
        height: 124px !important;
        min-height: 124px !important;
      }
      .hero-stage.is-v2 .clock { font-size: 62px !important; }
      .hero-stage.is-v2 .headline { column-gap: 8px !important; }
      .hero-stage.is-v2 .inline-weather small { max-width: 112px !important; font-size: 10.5px !important; }
    }
  `;
  root.appendChild(style);
}

function brunoHomeV4PatchHero(HeroCard) {
  if (!HeroCard || HeroCard.prototype.__brunoHomeV4Patch) return;
  const original = HeroCard.prototype._renderDesktop;
  if (typeof original !== 'function') return;

  HeroCard.prototype.__brunoHomeV4Patch = true;
  HeroCard.prototype._renderDesktop = function patchedHomeV4Hero(...args) {
    const result = original.apply(this, args);
    brunoHomeV4ApplyHero(this);
    return result;
  };

  // Aplica também ao card já montado quando o resource chega depois da Home.
  document.querySelectorAll?.('bruno-hero-card').forEach((card) => brunoHomeV4ApplyHero(card));
}

customElements.whenDefined('bruno-hero-card').then(() => {
  brunoHomeV4PatchHero(customElements.get('bruno-hero-card'));
});

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_HOME_V4_TAG,
  name: 'Bruno Home Phone V4',
  preview: false,
  description: 'Pager mobile de cômodos + Bento Favoritos.',
});
