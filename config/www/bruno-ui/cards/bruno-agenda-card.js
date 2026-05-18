const BRUNO_AGENDA_CARD_TAG = 'bruno-agenda-card';

const BRUNO_AGENDA_DEFAULT_CALENDARS = [
  { entity: 'calendar.brunohelasio_gmail_com', name: 'Bruno', color: '#7fdbe9' },
  { entity: 'calendar.familia', name: 'Familia', color: '#fdd835' },
  { entity: 'calendar.birthdays', name: 'Aniversarios', color: '#ff6c92' },
  { entity: 'calendar.feriados_no_brasil', name: 'Feriados', color: '#1DB954' },
];

const BRUNO_AGENDA_POPUP_CALENDARS = [
  'calendar.brunohelasio_gmail_com',
  'calendar.familia',
  'calendar.feriados_no_brasil',
];

const BRUNO_AGENDA_REFRESH_MS = 5 * 1000;
const BRUNO_AGENDA_INVALID_STATES = ['unknown', 'unavailable', 'none', ''];

class BrunoAgendaCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      name: 'Agenda',
      title: 'Agenda Mensal',
      days_to_show: 3,
      compact_events_to_show: 3,
      refresh_interval: BRUNO_AGENDA_REFRESH_MS,
      calendars: BRUNO_AGENDA_DEFAULT_CALENDARS,
      popup_calendars: BRUNO_AGENDA_POPUP_CALENDARS,
      ...(config || {}),
    };
    this._events = this._events || [];
    this._render();
    this._scheduleRefresh(true);
  }

  set hass(hass) {
    const firstHass = !this._hass;
    this._hass = hass;
    this._render();
    this._scheduleRefresh(firstHass);
  }

  connectedCallback() {
    this._scheduleRefresh(true);
  }

  disconnectedCallback() {
    if (!this._refreshTimer) return;
    clearInterval(this._refreshTimer);
    this._refreshTimer = null;
  }

  getCardSize() {
    return 3;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _isInvalid(value) {
    return value == null || BRUNO_AGENDA_INVALID_STATES.includes(String(value).toLowerCase());
  }

  _scheduleRefresh(immediate = false) {
    if (!this._config || !this.isConnected) return;
    if (!this._refreshTimer) {
      const interval = Math.max(5000, Number(this._config.refresh_interval) || BRUNO_AGENDA_REFRESH_MS);
      this._refreshTimer = setInterval(() => this._loadEvents(), interval);
    }
    if (immediate) this._loadEvents();
  }

  async _loadEvents() {
    if (!this._hass || this._loading) return;
    this._loading = true;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start.getTime() + Number(this._config.days_to_show || 3) * 24 * 60 * 60 * 1000);

    try {
      const eventsByCalendar = await Promise.all(
        this._config.calendars.map((calendar) => this._fetchCalendarEvents(calendar, start, end)),
      );
      this._events = eventsByCalendar
        .flat()
        .sort((a, b) => a.startMs - b.startMs);
      this._lastFetchAt = Date.now();
    } catch (error) {
      this._lastError = error;
    } finally {
      this._loading = false;
      this._render();
    }
  }

  async _fetchCalendarEvents(calendar, start, end) {
    const entityId = calendar.entity;
    if (!entityId) return [];

    let response = null;
    if (this._hass?.callWS) {
      try {
        response = await this._hass.callWS({
          type: 'calendar/list_events',
          entity_id: entityId,
          start: start.toISOString(),
          end: end.toISOString(),
        });
      } catch (error) {
        response = null;
      }
    }

    if (!response && this._hass?.callApi) {
      const path = `calendars/${encodeURIComponent(entityId)}?start=${encodeURIComponent(start.toISOString())}&end=${encodeURIComponent(end.toISOString())}`;
      response = await this._hass.callApi('GET', path);
    }

    const rows = Array.isArray(response?.events)
      ? response.events
      : Array.isArray(response)
        ? response
        : [];

    return rows
      .map((event) => this._normalizeEvent(event, calendar))
      .filter(Boolean);
  }

  _normalizeEvent(event, calendar) {
    const start = this._eventDate(event?.start);
    const end = this._eventDate(event?.end);
    if (!start) return null;

    return {
      calendar: calendar.entity,
      calendarName: calendar.name || calendar.entity,
      color: calendar.color || '#7fdbe9',
      summary: event?.summary || event?.message || event?.title || 'Evento',
      location: event?.location || '',
      start,
      end,
      startMs: start.getTime(),
      allDay: Boolean(event?.start?.date && !event?.start?.dateTime),
    };
  }

  _eventDate(value) {
    const raw = value?.dateTime || value?.date || value;
    if (!raw) return null;
    if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [year, month, day] = raw.split('-').map(Number);
      return new Date(year, month - 1, day);
    }
    const date = new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  _openPopup() {
    const calendars = Array.isArray(this._config.popup_calendars)
      ? this._config.popup_calendars
      : BRUNO_AGENDA_POPUP_CALENDARS;

    this.dispatchEvent(new CustomEvent('ll-custom', {
      detail: {
        action: 'fire-dom-event',
        browser_mod: {
          service: 'browser_mod.popup',
          data: {
            title: this._config.title,
            size: 'wide',
            content: {
              type: 'calendar',
              entities: calendars,
              initial_view: 'dayGridMonth',
            },
          },
        },
      },
      bubbles: true,
      composed: true,
    }));
  }

  _wireActions() {
    const card = this.shadowRoot.querySelector('.agenda-card');
    card?.addEventListener('click', () => this._openPopup());
    card?.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter' && event.key !== ' ') return;
      event.preventDefault();
      this._openPopup();
    });
  }

  _visibleEvents() {
    const limit = Math.max(1, Number(this._config.compact_events_to_show) || 3);
    return this._events.slice(0, limit);
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const events = this._visibleEvents();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: 18px;
          --accent: 150, 190, 255;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.62);
          --text-muted: rgba(226,232,240,0.42);
          display: block;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * {
          box-sizing: border-box;
          letter-spacing: 0;
        }

        .agenda-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px;
          padding: 14px 16px 14px 14px;
          color: var(--text-main);
          cursor: pointer;
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
            radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%),
            linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
            linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.27),
            0 0 24px rgba(110,150,210,0.055)
          );
          overflow: hidden;
        }

        .agenda-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .header,
        .events {
          position: relative;
          z-index: 1;
        }

        .eyebrow {
          font-size: 11px;
          line-height: 1;
          font-weight: 780;
          text-transform: uppercase;
          color: rgba(255,255,255,0.48);
        }

        .events {
          min-height: 0;
          display: grid;
          align-content: start;
          gap: 7px;
          margin-left: -4px;
        }

        .event-row {
          min-width: 0;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          gap: 8px;
          align-items: center;
        }

        .date {
          min-width: 0;
          text-align: center;
          color: rgba(255,255,255,0.84);
        }

        .weekday {
          display: block;
          font-size: 9px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.48);
          text-transform: uppercase;
        }

        .day {
          display: block;
          margin-top: 3px;
          font-size: 18px;
          line-height: 1;
          font-weight: 780;
        }

        .event {
          min-width: 0;
          position: relative;
          padding-left: 10px;
          color: rgba(255,255,255,0.92);
        }

        .event::before {
          content: "";
          position: absolute;
          left: 0;
          top: 5px;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: var(--event-color);
          box-shadow: 0 0 10px var(--event-color);
        }

        .summary {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          line-height: 1.15;
          font-weight: 720;
        }

        .time {
          display: block;
          margin-top: 3px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          line-height: 1;
          font-weight: 620;
          color: rgba(255,255,255,0.56);
        }

        .empty {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          color: rgba(255,255,255,0.56);
          font-size: 12px;
          font-weight: 650;
        }

        .empty ha-icon {
          --mdc-icon-size: 16px;
          color: rgba(255,255,255,0.46);
        }
      </style>

      <div class="agenda-card" role="button" tabindex="0" aria-label="${BrunoAgendaCard._escapeAttr(this._config.title)}">
        <div class="header">
          <div class="eyebrow">${BrunoAgendaCard._escape(this._config.name)}</div>
        </div>
        <div class="events">
          ${events.length ? events.map((event) => this._eventRow(event)).join('') : this._emptyState()}
        </div>
      </div>
    `;

    this._wireActions();
  }

  _eventRow(event) {
    const date = event.start;
    return `
      <div class="event-row">
        <div class="date">
          <span class="weekday">${BrunoAgendaCard._escape(this._weekday(date))}</span>
          <span class="day">${date.getDate()}</span>
        </div>
        <div class="event" style="--event-color:${BrunoAgendaCard._escapeAttr(event.color)}">
          <span class="summary">${BrunoAgendaCard._escape(event.summary)}</span>
          <span class="time">${BrunoAgendaCard._escape(this._timeLabel(event))}</span>
        </div>
      </div>
    `;
  }

  _emptyState() {
    return `
      <div class="empty">
        <ha-icon icon="mdi:check"></ha-icon>
        <span>Nenhum evento nos proximos dias</span>
      </div>
    `;
  }

  _weekday(date) {
    return ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'][date.getDay()] || '';
  }

  _timeLabel(event) {
    if (event.allDay) return event.calendarName;
    const time = event.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return `${time} \u00b7 ${event.calendarName}`;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoAgendaCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_AGENDA_CARD_TAG)) {
  customElements.define(BRUNO_AGENDA_CARD_TAG, BrunoAgendaCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_AGENDA_CARD_TAG,
  name: 'Bruno Agenda Card',
  preview: false,
  description: 'Isolated Bento agenda card with Home Assistant calendar events and Bruno liquid glass visuals.',
});
