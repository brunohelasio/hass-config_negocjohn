// home-mobile-hero-rail.js — Home phone V4 (2026-08-22)
// Escopo: <=800px. Hero sem agenda/insights + pager de cômodos + Bento Favoritos.
// ROLLBACK: restaurar este arquivo no commit anterior e os dois wrappers YAML phone.

const BRUNO_HOME_V4_QUERY = '(max-width: 800px)';
const BRUNO_HOME_V4_TAG = 'bruno-home-phone-v4-card';
const brunoHomeV4Phone = () => Boolean(globalThis.matchMedia?.(BRUNO_HOME_V4_QUERY).matches);

const BRUNO_HOME_V4_CALENDARS = [
  ['calendar.brunohelasio_gmail_com', 'Bruno'],
  ['calendar.familia', 'Familia'],
  ['calendar.birthdays', 'Aniversarios'],
  ['calendar.feriados_no_brasil', 'Feriados'],
];

const BRUNO_HOME_V4_DEFAULT_ROOMS = [
  { type: 'custom:bruno-sala-card' },
  { type: 'custom:bruno-cozinha-card', section: 'cozinha', double_tap_action: { action: 'fire-dom-event', bruno_section: 'cozinha' } },
  { type: 'custom:bruno-lavabo-card' },
  { type: 'custom:bruno-office-card', section: 'office', double_tap_action: { action: 'fire-dom-event', bruno_section: 'office' } },
  { type: 'custom:bruno-quarto-casal-card', section: 'casal', double_tap_action: { action: 'fire-dom-event', bruno_section: 'casal' } },
  { type: 'custom:bruno-quarto-marina-card', section: 'marina', double_tap_action: { action: 'fire-dom-event', bruno_section: 'marina' } },
  { type: 'custom:bruno-quarto-miguel-card', section: 'miguel', double_tap_action: { action: 'fire-dom-event', bruno_section: 'miguel' } },
];

const BRUNO_HOME_V4_PAGE2 = [
  ['light.grupo_luzes_office','binary_sensor.office_motion_recent','binary_sensor.office_occupancy','binary_sensor.office_pc_active','climate.ac_office','media_player.echo_pop_office'],
  ['light.grupo_quarto_casal','binary_sensor.q_casal_motion_recent','binary_sensor.q_casal_occupancy','media_player.echo_pop_quarto_casal'],
  ['light.grupo_luzes_quarto_marina','binary_sensor.q_marina_motion_recent','binary_sensor.q_marina_occupancy','climate.ac_quarto_marina','media_player.echo_pop_marina'],
  ['light.grupo_luzes_quarto_miguel','binary_sensor.q_miguel_motion_recent','binary_sensor.q_miguel_occupancy','climate.ac_quarto_miguel'],
];

const BRUNO_HOME_V4_SCENES = [
  ['Bom dia','script.bruno_scene_bom_dia','mdi:weather-sunset-up'],
  ['Sair','script.bruno_scene_sair_de_casa','mdi:exit-run'],
  ['Cinema','script.bruno_scene_cinema','mdi:movie-open'],
  ['Boa noite','script.bruno_scene_boa_noite','mdi:weather-night'],
];

class BrunoHomePhoneV4Card extends HTMLElement {
  static getStubConfig() { return {}; }
  setConfig(config) {
    this._config = { ...(config || {}) };
    this._page = 0;
    this._events = [];
    this._lastCalendarLoad = 0;
    this._render();
  }
  set hass(hass) {
    const first = !this._hass;
    this._hass = hass;
    this._children?.forEach((child) => { child.hass = hass; });
    this._sync();
    if (first || Date.now() - this._lastCalendarLoad > 300000) this._loadCalendar();
  }
  connectedCallback() { this._render(); this._loadCalendar(); }
  disconnectedCallback() { if (this._raf) cancelAnimationFrame(this._raf); }
  getCardSize() { return 10; }

  _state(id) { return id ? this._hass?.states?.[id] : undefined; }
  _active(id) {
    const e = this._state(id); if (!e) return false;
    const s = String(e.state || '').toLowerCase();
    const d = String(id).split('.')[0];
    if (['binary_sensor','light','switch','input_boolean'].includes(d)) return s === 'on';
    if (d === 'media_player') return ['playing','paused','buffering','on'].includes(s);
    if (d === 'climate') return !['','off','idle','unavailable','unknown','none'].includes(s);
    return !['','off','idle','standby','closed','not_home','unknown','unavailable','none'].includes(s);
  }
  _page2Count() { return BRUNO_HOME_V4_PAGE2.filter((ids) => ids.some((id) => this._active(id))).length; }

  _network() {
    const val = (id) => {
      const s = this._state(id)?.state;
      return s == null || ['unknown','unavailable','none',''].includes(String(s).toLowerCase()) ? '--' : String(s);
    };
    const aps = ['sensor.unifi_office_ap','sensor.unifi_wall_ap','sensor.unifi_bedroom_ap'];
    const online = aps.filter((id) => !['--','off','unavailable'].includes(val(id).toLowerCase())).length;
    const wan = val('binary_sensor.arris_tg3442de_wan_status').toLowerCase();
    const status = ['--','off','unavailable','unknown'].includes(wan) || online === 0 ? 'Offline' : online < 3 ? 'Parcial' : 'Excelente';
    return { status, down: val('sensor.speedtest_download'), up: val('sensor.speedtest_upload') };
  }
  _insight() {
    const items = this._state('sensor.home_insights')?.attributes?.items;
    const i = Array.isArray(items) ? items[0] : null;
    return i?.text ? { text: String(i.text), tone: String(i.tone || 'amber') } : null;
  }
  _nextEvent() {
    const e = this._events[0];
    if (!e) return { summary: 'Agenda livre', time: 'Hoje', detail: 'Sem compromissos' };
    const time = e.allDay ? 'Dia todo' : e.start.toDateString() === new Date().toDateString()
      ? e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : `${e.start.toLocaleDateString([], { day: '2-digit', month: 'short' })} · ${e.start.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return { summary: e.summary, time, detail: e.calendarName };
  }

  async _loadCalendar() {
    if (!this._hass?.callWS || this._loading || !this.isConnected || Date.now() - this._lastCalendarLoad < 15000) return;
    this._loading = true;
    const start = new Date(); start.setHours(0,0,0,0);
    const end = new Date(start.getTime() + 259200000);
    try {
      const result = await Promise.all(BRUNO_HOME_V4_CALENDARS.map(async ([entity, name]) => {
        try {
          const r = await this._hass.callWS({ type: 'calendar/list_events', entity_id: entity, start: start.toISOString(), end: end.toISOString() });
          const rows = Array.isArray(r?.events) ? r.events : Array.isArray(r) ? r : [];
          return rows.map((x) => {
            const raw = x?.start?.dateTime || x?.start?.date || x?.start;
            if (!raw) return null;
            let dt;
            if (typeof raw === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw)) { const [y,m,d] = raw.split('-').map(Number); dt = new Date(y,m-1,d); }
            else dt = new Date(raw);
            if (Number.isNaN(dt.getTime())) return null;
            return { summary: x?.summary || x?.message || 'Evento', start: dt, startMs: dt.getTime(), allDay: Boolean(x?.start?.date && !x?.start?.dateTime), calendarName: name };
          }).filter(Boolean);
        } catch (_e) { return []; }
      }));
      this._events = result.flat().filter((e) => e.startMs >= Date.now() - 3600000 || e.allDay).sort((a,b) => a.startMs - b.startMs);
      this._lastCalendarLoad = Date.now();
      this._sync();
    } finally { this._loading = false; }
  }

  _rooms() { return Array.isArray(this._config?.rooms) && this._config.rooms.length >= 7 ? this._config.rooms : BRUNO_HOME_V4_DEFAULT_ROOMS; }
  _mountRooms() {
    this._children = [];
    const rooms = this._rooms();
    this.shadowRoot?.querySelectorAll('[data-room]').forEach((slot) => {
      const cfg = rooms[Number(slot.dataset.room)] || {};
      const type = String(cfg.type || ''); const tag = type.startsWith('custom:') ? type.slice(7) : type;
      if (!tag) return;
      const child = document.createElement(tag); const { type: _type, ...childCfg } = cfg;
      child.setConfig?.(childCfg); if (this._hass) child.hass = this._hass;
      slot.replaceChildren(child); this._children.push(child);
    });
  }
  _go(page) {
    const s = this.shadowRoot?.querySelector('.pages'); if (!s) return;
    s.scrollTo({ left: Math.max(0,Math.min(1,page)) * s.clientWidth, behavior: 'smooth' });
  }
  _syncPager() {
    this.shadowRoot?.querySelectorAll('[data-page]').forEach((b) => b.classList.toggle('on', Number(b.dataset.page) === this._page));
  }
  _sync() {
    if (!this.shadowRoot) return;
    const count = this._page2Count(); const badge = this.shadowRoot.querySelector('.activity');
    if (badge) { badge.hidden = this._page !== 0 || count === 0; badge.textContent = String(count); }
    const n = this._network();
    const ns = this.shadowRoot.querySelector('[data-net-status]'); if (ns) { ns.textContent = n.status; ns.dataset.state = n.status.toLowerCase(); }
    const nd = this.shadowRoot.querySelector('[data-down]'); if (nd) nd.textContent = n.down;
    const nu = this.shadowRoot.querySelector('[data-up]'); if (nu) nu.textContent = n.up;
    const ev = this._nextEvent(), ins = this._insight();
    const es = this.shadowRoot.querySelector('[data-event-summary]'); if (es) es.textContent = ev.summary;
    const et = this.shadowRoot.querySelector('[data-event-time]'); if (et) et.textContent = ev.time;
    const ed = this.shadowRoot.querySelector('[data-event-detail]'); if (ed) ed.textContent = ins?.text || ev.detail;
    const dot = this.shadowRoot.querySelector('.insight'); if (dot) { dot.hidden = !ins; dot.dataset.tone = ins?.tone || 'amber'; }
  }
  _wire() {
    const pages = this.shadowRoot?.querySelector('.pages');
    pages?.addEventListener('scroll', () => {
      if (this._raf) cancelAnimationFrame(this._raf);
      this._raf = requestAnimationFrame(() => {
        const p = Math.max(0,Math.min(1,Math.round(pages.scrollLeft / Math.max(1,pages.clientWidth))));
        if (p !== this._page) { this._page = p; this._syncPager(); this._sync(); }
      });
    }, { passive: true });
    this.shadowRoot?.querySelectorAll('[data-page]').forEach((b) => b.addEventListener('click', () => this._go(Number(b.dataset.page))));
    this.shadowRoot?.querySelector('[data-network]')?.addEventListener('click', () => this.dispatchEvent(new CustomEvent('ll-custom', { detail: { action:'fire-dom-event', bruno_action:'network' }, bubbles:true, composed:true })));
    this.shadowRoot?.querySelector('[data-agenda]')?.addEventListener('click', () => this.dispatchEvent(new CustomEvent('hass-more-info', { detail:{ entityId:'calendar.brunohelasio_gmail_com' }, bubbles:true, composed:true })));
    this.shadowRoot?.querySelectorAll('[data-scene]').forEach((b) => b.addEventListener('click', async () => {
      const scene = BRUNO_HOME_V4_SCENES[Number(b.dataset.scene)]; if (!scene || !this._hass || b.disabled) return;
      b.disabled = true; b.classList.add('running');
      try { await this._hass.callService('script','turn_on',{}, { entity_id:scene[1] }); globalThis.BrunoLiquidGlass?.feedback?.('tap'); }
      finally { setTimeout(() => { b.disabled = false; b.classList.remove('running'); }, 650); }
    }));
  }

  _render() {
    if (!this._config || !brunoHomeV4Phone()) return;
    if (!this.shadowRoot) this.attachShadow({ mode:'open' });
    this.shadowRoot.innerHTML = `
      <style>
        :host{display:block;width:100%;min-width:0;color:rgba(255,255,255,.94);contain:layout style}*{box-sizing:border-box;letter-spacing:0}button{font:inherit;color:inherit}
        h2{margin:0 0 6px 10px;font:760 14px/1 system-ui,-apple-system,sans-serif;text-shadow:0 2px 12px rgba(0,0,0,.28)}
        .pages{width:100%;display:grid;grid-auto-flow:column;grid-auto-columns:100%;gap:10px;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;scrollbar-width:none}.pages::-webkit-scrollbar{display:none}
        .page{height:352px;display:grid;grid-template:repeat(2,172px)/repeat(2,minmax(0,1fr));gap:8px;scroll-snap-align:start;scroll-snap-stop:always}.social [data-room="0"]{grid-column:1/-1}.room{height:172px;min-width:0;min-height:0}.room>*{display:block;width:100%;height:100%;min-width:0;min-height:0}
        .pager{height:22px;margin:4px 5px 5px 0;display:flex;justify-content:flex-end;align-items:center;gap:7px}.dots{display:flex;gap:6px}.dot{appearance:none;width:7px;height:7px;margin:0;padding:0;border:0;border-radius:50%;background:rgba(255,255,255,.34)}.dot.on{background:rgba(255,255,255,.92)}.activity{min-width:19px;height:19px;padding:0 5px;display:grid;place-items:center;border-radius:999px;background:var(--bruno-accent-amber,#f7c600);box-shadow:0 0 10px rgba(247,198,0,.4);color:#0c0e14;font:820 10px/1 system-ui}.activity[hidden]{display:none}
        .fav-title{margin-top:4px}.bento{--sq:clamp(128px,34vw,145px);display:grid;grid-template-columns:minmax(0,1fr) var(--sq);grid-template-rows:var(--sq);gap:8px}.left{display:grid;grid-template-rows:repeat(2,minmax(0,1fr));gap:8px;min-width:0}
        .fav,.scenes{position:relative;overflow:hidden;border:1px solid rgba(255,255,255,.15);background:radial-gradient(100px 62px at 18% 0%,rgba(255,255,255,.14),transparent 72%),linear-gradient(160deg,rgba(68,57,50,.48),rgba(35,31,30,.36));box-shadow:inset 0 1px 0 rgba(255,255,255,.13),0 8px 24px rgba(0,0,0,.18);backdrop-filter:blur(24px) saturate(1.18);-webkit-backdrop-filter:blur(24px) saturate(1.18)}
        .fav{appearance:none;width:100%;display:grid;grid-template-columns:32px minmax(0,1fr);align-items:center;gap:8px;padding:8px 10px;border-radius:19px;text-align:left;cursor:pointer}.fav:active{transform:scale(.99)}.ico{width:32px;height:32px;border-radius:12px;display:grid;place-items:center;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.09)}.ico bruno-icon{--mdc-icon-size:19px}.copy{min-width:0;display:grid;gap:2px}.top{display:flex;align-items:center;gap:6px;min-width:0}.top>span:first-child{flex:1;font-size:9px;font-weight:760;color:rgba(255,255,255,.58)}.top em{max-width:72px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:800 9px/1 system-ui;color:rgba(255,255,255,.72)}.copy strong,.copy small{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.copy strong{font:760 11px/1.12 system-ui}.copy small{font:620 8.7px/1.1 system-ui;color:rgba(255,255,255,.52)}
        .insight{width:5px;height:5px;border-radius:50%;background:#f7c600;box-shadow:0 0 7px rgba(247,198,0,.44)}.insight[hidden]{display:none}.insight[data-tone="red"]{background:#ff453a}.insight[data-tone="blue"]{background:#7fdbe9}.insight[data-tone="green"]{background:#30d158}[data-net-status][data-state="excelente"]{color:#62d27b}[data-net-status][data-state="parcial"]{color:#f7c600}[data-net-status][data-state="offline"]{color:#ff6259}.metrics{display:flex;gap:7px}.metrics span{display:flex;align-items:center;gap:2px}.metrics bruno-icon{--mdc-icon-size:10px}
        .scenes{border-radius:21px;padding:8px;display:grid;grid-template-rows:17px 1fr;gap:5px}.scenes>strong{padding-left:2px;font:780 10px/1 system-ui;color:rgba(255,255,255,.74)}.scene-grid{display:grid;grid-template:repeat(2,1fr)/repeat(2,1fr);gap:5px;min-height:0}.scene{appearance:none;display:grid;place-items:center;align-content:center;gap:3px;min-width:0;min-height:0;padding:4px 2px;border:1px solid rgba(255,255,255,.09);border-radius:13px;background:rgba(255,255,255,.045)}.scene bruno-icon{--mdc-icon-size:17px}.scene span{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font:690 7.5px/1 system-ui;color:rgba(255,255,255,.66)}.scene:active,.scene.running{transform:scale(.96);background:rgba(255,255,255,.09)}
        @media(max-width:390px){.bento{--sq:128px}.fav{grid-template-columns:29px 1fr;gap:6px;padding:7px 8px}.ico{width:29px;height:29px}.copy strong{font-size:10px}.copy small{font-size:8px}.top em{max-width:58px;font-size:8px}}
      </style>
      <section aria-label="Cômodos"><h2>Cômodos</h2><div class="pages">
        <div class="page social"><div class="room" data-room="0"></div><div class="room" data-room="1"></div><div class="room" data-room="2"></div></div>
        <div class="page"><div class="room" data-room="3"></div><div class="room" data-room="4"></div><div class="room" data-room="5"></div><div class="room" data-room="6"></div></div>
      </div><div class="pager"><span class="dots"><button class="dot on" data-page="0" aria-label="Página social"></button><button class="dot" data-page="1" aria-label="Página íntima e trabalho"></button></span><span class="activity" hidden>0</span></div></section>
      <section aria-label="Favoritos"><h2 class="fav-title">Favoritos</h2><div class="bento"><div class="left">
        <button class="fav" data-agenda><span class="ico"><bruno-icon icon="mdi:calendar-blank-outline"></bruno-icon></span><span class="copy"><span class="top"><span>Agenda</span><i class="insight" hidden></i><em data-event-time>Hoje</em></span><strong data-event-summary>Agenda livre</strong><small data-event-detail>Sem avisos da casa</small></span></button>
        <button class="fav" data-network><span class="ico"><bruno-icon icon="mdi:wifi"></bruno-icon></span><span class="copy"><span class="top"><span>Wi-Fi</span><em data-net-status>--</em></span><strong>Rede Principal</strong><small class="metrics"><span><bruno-icon icon="mdi:download"></bruno-icon><b data-down>--</b></span><span><bruno-icon icon="mdi:upload"></bruno-icon><b data-up>--</b></span><span>Mbps</span></small></span></button>
      </div><div class="scenes"><strong>Cenas</strong><div class="scene-grid">${BRUNO_HOME_V4_SCENES.map((s,i)=>`<button class="scene" data-scene="${i}" aria-label="Ativar cena ${BrunoHomePhoneV4Card._esc(s[0])}"><bruno-icon icon="${s[2]}"></bruno-icon><span>${BrunoHomePhoneV4Card._esc(s[0])}</span></button>`).join('')}</div></div></div></section>`;
    this._mountRooms(); this._wire(); this._syncPager(); this._sync();
  }
  static _esc(v) { return String(v ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
}

if (!customElements.get(BRUNO_HOME_V4_TAG)) customElements.define(BRUNO_HOME_V4_TAG, BrunoHomePhoneV4Card);

function brunoHomeV4PatchHero(Hero) {
  if (!Hero || Hero.prototype.__homeV4) return; Hero.prototype.__homeV4 = true;
  const original = Hero.prototype._renderDesktop; if (typeof original !== 'function') return;
  Hero.prototype._renderDesktop = function(...args) {
    const out = original.apply(this,args);
    if (this?._config?.hero_layout === 'v2' && brunoHomeV4Phone() && this.shadowRoot && !this.shadowRoot.querySelector('style[data-home-v4]')) {
      const st = document.createElement('style'); st.dataset.homeV4 = '1'; st.textContent = `
        @media(max-width:800px){.hero-stage.is-v2{height:128px!important;min-height:128px!important}.hero-stage.is-v2 .content{padding:5px 16px 4px!important;gap:0!important}.hero-stage.is-v2 .headline{column-gap:12px!important}.hero-stage.is-v2 .clock{margin-top:0!important;font-size:clamp(62px,16.5vw,69px)!important;line-height:.9!important;font-weight:220!important}.hero-stage.is-v2 .headline .event-stack{display:none!important}.hero-stage.is-v2 .inline-weather{display:grid!important;grid-template: auto auto/23px minmax(0,auto)!important;grid-template-areas:"i t" "i l"!important;align-items:center!important;column-gap:7px!important;row-gap:3px!important;width:auto!important;margin-top:0!important;justify-self:end!important}.hero-stage.is-v2 .inline-weather img{grid-area:i!important;width:23px!important;height:23px!important}.hero-stage.is-v2 .inline-weather strong{grid-area:t!important;font-size:16px!important}.hero-stage.is-v2 .inline-weather small{grid-area:l!important;max-width:min(35vw,142px)!important;font-size:11px!important;line-height:1.06!important}}
        @media(max-width:390px){.hero-stage.is-v2{height:124px!important;min-height:124px!important}.hero-stage.is-v2 .clock{font-size:62px!important}.hero-stage.is-v2 .headline{column-gap:8px!important}.hero-stage.is-v2 .inline-weather small{max-width:112px!important;font-size:10.5px!important}}
      `; this.shadowRoot.appendChild(st);
    }
    return out;
  };
}

function brunoHomeV4PatchRail(Rail) {
  if (!Rail || Rail.prototype.__homeV4) return; Rail.prototype.__homeV4 = true;
  const originalCount = Rail.prototype._contarAmbientesAtivos;
  if (typeof originalCount === 'function') Rail.prototype._contarAmbientesAtivos = function(...args) {
    if (brunoHomeV4Phone()) return ['binary_sensor.home_activity_camera','binary_sensor.home_activity_roborock','binary_sensor.home_activity_media'].filter((id) => this._entidadeRelevante?.(id)).length;
    return originalCount.apply(this,args);
  };
  const originalRender = Rail.prototype._render; if (typeof originalRender !== 'function') return;
  Rail.prototype._render = function(...args) {
    const out = originalRender.apply(this,args);
    if (this.shadowRoot && !this.shadowRoot.querySelector('style[data-home-v4-rail]')) { const st=document.createElement('style'); st.dataset.homeV4Rail='1'; st.textContent='@media(max-width:800px){.overflow-hint{top:2px!important;bottom:auto!important;margin-bottom:0!important;right:10px!important}}'; this.shadowRoot.appendChild(st); }
    return out;
  };
}

Promise.all([customElements.whenDefined('bruno-hero-card'),customElements.whenDefined('bento-sidebar-liquid-card')]).then(()=>{brunoHomeV4PatchHero(customElements.get('bruno-hero-card'));brunoHomeV4PatchRail(customElements.get('bento-sidebar-liquid-card'));});
window.customCards=window.customCards||[];window.customCards.push({type:BRUNO_HOME_V4_TAG,name:'Bruno Home Phone V4',preview:false,description:'Phone pager + favoritos bento.'});
