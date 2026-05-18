const BRUNO_MOBILE_ROOMS_CARD_TAG = 'bruno-mobile-rooms-card';

const BRUNO_MOBILE_ROOMS_DEFAULT = [
  { tag: 'bruno-office-card', name: 'Office' },
  { tag: 'bruno-cozinha-card', name: 'Cozinha' },
  { tag: 'bruno-lavabo-card', name: 'Lavabo' },
  { tag: 'bruno-quarto-casal-card', name: 'Q. Casal' },
  { tag: 'bruno-quarto-marina-card', name: 'Q. Marina' },
  { tag: 'bruno-quarto-miguel-card', name: 'Q. Miguel' },
];

class BrunoMobileRoomsCard extends HTMLElement {
  static getStubConfig() {
    return { mode: 'carousel' };
  }

  setConfig(config) {
    this._config = {
      mode: 'carousel',
      rooms: BRUNO_MOBILE_ROOMS_DEFAULT,
      ...(config || {}),
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._children?.forEach((child) => { child.hass = hass; });
  }

  getCardSize() {
    return this._config?.mode === 'grid' ? 6 : 2;
  }

  _rooms() {
    return Array.isArray(this._config?.rooms) && this._config.rooms.length
      ? this._config.rooms
      : BRUNO_MOBILE_ROOMS_DEFAULT;
  }

  _chunks(items, size) {
    const chunks = [];
    for (let index = 0; index < items.length; index += size) chunks.push(items.slice(index, index + size));
    return chunks;
  }

  _mountChildren() {
    this._children = [];
    this.shadowRoot.querySelectorAll('[data-room-slot]').forEach((slot) => {
      const index = Number(slot.dataset.roomSlot);
      const room = this._rooms()[index];
      const tag = room?.tag || '';
      if (!tag) return;

      const child = document.createElement(tag);
      const childConfig = room.config || {};
      if (typeof child.setConfig === 'function') child.setConfig(childConfig);
      if (this._hass) child.hass = this._hass;
      slot.textContent = '';
      slot.appendChild(child);
      this._children.push(child);
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    const mode = this._config.mode === 'grid' ? 'grid' : 'carousel';
    const rooms = this._rooms();
    const chunks = this._chunks(rooms, 2);

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          min-width: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        .rooms {
          width: 100%;
          min-width: 0;
        }

        .rooms.is-carousel {
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: 100%;
          grid-template-rows: 168px;
          gap: 14px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
          -webkit-overflow-scrolling: touch;
          scrollbar-width: none;
        }

        .rooms.is-carousel::-webkit-scrollbar {
          display: none;
        }

        .slide,
        .rooms.is-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }

        .slide {
          height: 168px;
          scroll-snap-align: start;
        }

        .rooms.is-grid {
          grid-auto-rows: 168px;
        }

        .room-slot {
          display: block;
          min-width: 0;
          min-height: 0;
          height: 168px;
        }

        .room-slot > * {
          display: block;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
        }
      </style>

      ${mode === 'grid' ? `
        <div class="rooms is-grid">
          ${rooms.map((room, index) => `<div class="room-slot" data-room-slot="${index}" aria-label="${BrunoMobileRoomsCard._escapeAttr(room.name || '')}"></div>`).join('')}
        </div>
      ` : `
        <div class="rooms is-carousel">
          ${chunks.map((chunk, chunkIndex) => `
            <div class="slide">
              ${chunk.map((room, roomIndex) => {
                const index = chunkIndex * 2 + roomIndex;
                return `<div class="room-slot" data-room-slot="${index}" aria-label="${BrunoMobileRoomsCard._escapeAttr(room.name || '')}"></div>`;
              }).join('')}
            </div>
          `).join('')}
        </div>
      `}
    `;

    this._mountChildren();
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoMobileRoomsCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_MOBILE_ROOMS_CARD_TAG)) {
  customElements.define(BRUNO_MOBILE_ROOMS_CARD_TAG, BrunoMobileRoomsCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_MOBILE_ROOMS_CARD_TAG,
  name: 'Bruno Mobile Rooms Card',
  preview: false,
  description: 'Mobile rooms carousel/grid shell using existing Bruno room cards.',
});
