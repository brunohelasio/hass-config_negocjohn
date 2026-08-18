const BRUNO_MOBILE_CAMERAS_LIST_CARD_TAG = 'bruno-mobile-cameras-list-card';

const BRUNO_MOBILE_CAMERAS_DEFAULT_CONFIG = {
  refresh_interval: 6500,
  cameras: [
    { entity: 'camera.sl_camera_2', name: 'Sala' },
    { entity: 'camera.vr_camera_2', name: 'Varanda' },
    { entity: 'camera.cz_camera_2', name: 'Cozinha' },
    { entity: 'camera.as_camera_2', name: 'Area de Servico' },
    { entity: 'camera.of_camera_2', name: 'Office' },
    { entity: 'camera.camera_quarto_casal_2', name: 'Quarto Casal' },
    { entity: 'camera.qmi_camera_2', name: 'Quarto Miguel' },
    { entity: 'camera.qma_camera_2', name: 'Quarto Marina' },
  ],
};

const BRUNO_MOBILE_CAMERA_ONLINE_STATES = ['streaming', 'recording', 'idle', 'on'];
const BRUNO_MOBILE_CAMERA_UNAVAILABLE_STATES = ['unavailable', 'unknown', ''];

class BrunoMobileCamerasListCard extends HTMLElement {
  static getStubConfig() {
    return {};
  }

  setConfig(config) {
    this._config = {
      ...BRUNO_MOBILE_CAMERAS_DEFAULT_CONFIG,
      ...(config || {}),
      cameras: Array.isArray(config?.cameras) && config.cameras.length
        ? config.cameras
        : BRUNO_MOBILE_CAMERAS_DEFAULT_CONFIG.cameras,
    };
    this._refreshSeed = this._refreshSeed || Date.now();
    this._render();
    this._startRefreshTimer();
  }

  set hass(hass) {
    this._hass = hass;
    if (this.shadowRoot?.querySelector('.camera-list')) {
      this._updateStateOnly();
    } else {
      this._render();
    }
    this._startRefreshTimer();
  }

  connectedCallback() {
    this._startRefreshTimer();
  }

  disconnectedCallback() {
    this._stopRefreshTimer();
  }

  getCardSize() {
    return 8;
  }

  _state(entityId) {
    return entityId ? this._hass?.states?.[entityId] : undefined;
  }

  _cameraState(camera) {
    const entity = this._state(camera.entity);
    const state = entity?.state || '';
    const unavailable = !entity || BRUNO_MOBILE_CAMERA_UNAVAILABLE_STATES.includes(state);
    const online = !unavailable && BRUNO_MOBILE_CAMERA_ONLINE_STATES.includes(state);
    this._lastCameraImages = this._lastCameraImages || {};
    const liveImage = entity?.attributes?.entity_picture || '';
    if (liveImage) this._lastCameraImages[camera.entity] = liveImage;
    const image = liveImage || this._lastCameraImages[camera.entity] || '';

    return {
      ...camera,
      state,
      online,
      image,
      imageUrl: BrunoMobileCamerasListCard._withCacheBust(image, this._refreshSeed || Date.now()),
      status: online ? 'Gravando' : 'Offline',
    };
  }

  _model() {
    return this._config.cameras.map((camera) => this._cameraState(camera));
  }

  _startRefreshTimer() {
    if (this._refreshTimer || !this._config || !this.isConnected) return;
    const refreshInterval = Math.max(4500, Number(this._config.refresh_interval) || 6500);
    this._refreshTimer = globalThis.setInterval(() => this._refreshCameraImages(), refreshInterval);
  }

  _stopRefreshTimer() {
    if (!this._refreshTimer) return;
    globalThis.clearInterval(this._refreshTimer);
    this._refreshTimer = null;
  }

  _refreshCameraImages() {
    if (!this.shadowRoot || !this._hass || !globalThis.Image) return;
    const stamp = Date.now();
    this._refreshSeed = stamp;

    this.shadowRoot.querySelectorAll('img[data-camera-src-base]').forEach((image) => {
      const baseSrc = image.dataset.cameraSrcBase;
      if (!baseSrc) return;
      const nextSrc = BrunoMobileCamerasListCard._withCacheBust(baseSrc, stamp);
      const loader = new globalThis.Image();
      loader.onload = () => {
        image.src = nextSrc;
        image.classList.remove('is-hidden');
      };
      loader.src = nextSrc;
    });
  }

  _updateStateOnly() {
    const cameras = this._model();
    cameras.forEach((camera) => {
      const card = this.shadowRoot.querySelector(`[data-camera-card="${BrunoMobileCamerasListCard._escapeAttr(camera.entity)}"]`);
      if (!card) return;
      card.classList.toggle('is-online', camera.online);
      card.classList.toggle('has-image', Boolean(camera.image));
      const image = card.querySelector('img[data-camera-src-base]');
      if (!image && camera.image) {
        this._render();
        return;
      }
      if (image && camera.image) image.dataset.cameraSrcBase = camera.image;
      const status = card.querySelector('.status');
      if (status) {
        status.innerHTML = `<span class="status-dot${camera.online ? ' is-online' : ''}"></span>${BrunoMobileCamerasListCard._escape(camera.status)}`;
      }
    });
  }

  _openMoreInfo(entityId) {
    if (!entityId) return;
    this.dispatchEvent(new CustomEvent('hass-more-info', {
      detail: { entityId },
      bubbles: true,
      composed: true,
    }));
  }

  _wireActions() {
    this.shadowRoot.querySelectorAll('[data-camera-button]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        this._openMoreInfo(button.dataset.cameraButton);
      });
    });
  }

  _render() {
    if (!this._config) return;
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });
    const cameras = this._model();

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          min-width: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        .camera-list {
          display: grid;
          gap: 12px;
        }

        button {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          isolation: isolate;
          display: block;
          width: 100%;
          aspect-ratio: 16 / 9;
          padding: 0;
          border-radius: var(--bruno-liquid-card-radius-compact, 18px);
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.18));
          background: var(--bruno-liquid-surface-off-background);
          box-shadow: var(--bruno-liquid-surface-off-shadow);
          color: rgba(248,251,255,0.96);
          overflow: hidden;
          cursor: pointer;
          font: inherit;
          text-align: left;
          backdrop-filter: var(--bruno-liquid-surface-off-filter);
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter);
        }

        button::before,
        button::after {
          content: "";
          position: absolute;
          inset: 0;
          border-radius: inherit;
          pointer-events: none;
        }

        button::before {
          z-index: 2;
          background:
            linear-gradient(180deg, rgba(5,8,14,0.12), transparent 36%, rgba(5,8,14,0.62)),
            radial-gradient(420px 190px at 18% -6%, rgba(255,255,255,0.18), transparent 66%);
        }

        button::after {
          z-index: 4;
          padding: 1px;
          background: var(--bruno-liquid-surface-edge-glow);
          -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: 0.7;
        }

        .camera-image,
        .placeholder {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .camera-image {
          z-index: 1;
          filter: saturate(0.88) contrast(1.04);
          /* Item 2 (2026-08-17): impede o callout nativo do iOS/WebKit
             (copiar/salvar imagem) no long-press sobre o instantaneo. */
          -webkit-touch-callout: none;
          -webkit-user-drag: none;
          -webkit-user-select: none;
          user-select: none;
        }

        .camera-image.is-hidden,
        button:not(.has-image) .camera-image {
          opacity: 0;
        }

        .placeholder {
          z-index: 0;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,0.32);
          background:
            radial-gradient(160px 140px at 50% 26%, rgba(150,190,255,0.10), transparent 70%),
            linear-gradient(155deg, rgba(11,16,27,0.96), rgba(4,7,14,0.96));
        }

        .placeholder bruno-icon {
          --mdc-icon-size: 42px;
        }

        .meta {
          position: absolute;
          z-index: 3;
          left: 12px;
          right: 12px;
          bottom: 10px;
          display: flex;
          align-items: flex-end;
          justify-content: space-between;
          gap: 10px;
        }

        .name {
          display: block;
          font-size: 16px;
          line-height: 1;
          font-weight: 820;
          text-shadow: 0 3px 12px rgba(0,0,0,0.45);
        }

        .status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 6px;
          color: rgba(255,255,255,0.74);
          font-size: 11px;
          line-height: 1;
          font-weight: 650;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(255,255,255,0.34);
        }

        .status-dot.is-online {
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34,197,94,0.44);
        }

        .open-chip {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          min-height: 28px;
          padding: 0 12px;
          border-radius: 999px;
          color: rgba(255,255,255,0.84);
          background: rgba(10,15,26,0.48);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
          backdrop-filter: blur(14px) saturate(1.2);
          -webkit-backdrop-filter: blur(14px) saturate(1.2);
          font-size: 10px;
          font-weight: 780;
          text-transform: uppercase;
        }

        .open-chip bruno-icon {
          --mdc-icon-size: 13px;
        }
      </style>

      <div class="camera-list">
        ${cameras.map((camera) => `
          <button class="${camera.online ? 'is-online ' : ''}${camera.image ? 'has-image' : ''}" type="button" data-camera-card="${BrunoMobileCamerasListCard._escapeAttr(camera.entity)}" data-camera-button="${BrunoMobileCamerasListCard._escapeAttr(camera.entity)}" aria-label="${BrunoMobileCamerasListCard._escapeAttr(camera.name)}">
            ${camera.image ? `<img class="camera-image" src="${BrunoMobileCamerasListCard._escapeAttr(camera.imageUrl)}" data-camera-src-base="${BrunoMobileCamerasListCard._escapeAttr(camera.image)}" alt="">` : ''}
            <div class="placeholder" aria-hidden="true"><bruno-icon icon="mdi:video-outline"></bruno-icon></div>
            <div class="meta">
              <span>
                <span class="name">${BrunoMobileCamerasListCard._escape(camera.name)}</span>
                <span class="status"><span class="status-dot${camera.online ? ' is-online' : ''}"></span>${BrunoMobileCamerasListCard._escape(camera.status)}</span>
              </span>
              <span class="open-chip"><bruno-icon icon="mdi:eye"></bruno-icon>Abrir</span>
            </div>
          </button>
        `).join('')}
      </div>
    `;

    this._wireActions();
  }

  static _withCacheBust(url, stamp) {
    if (!url) return '';
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}bruno_refresh=${encodeURIComponent(stamp)}`;
  }

  static _escape(value) {
    return String(value ?? '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  static _escapeAttr(value) {
    return BrunoMobileCamerasListCard._escape(value).replace(/'/g, '&#39;');
  }
}

if (!customElements.get(BRUNO_MOBILE_CAMERAS_LIST_CARD_TAG)) {
  customElements.define(BRUNO_MOBILE_CAMERAS_LIST_CARD_TAG, BrunoMobileCamerasListCard);
}

window.customCards = window.customCards || [];
window.customCards.push({
  type: BRUNO_MOBILE_CAMERAS_LIST_CARD_TAG,
  name: 'Bruno Mobile Cameras List Card',
  preview: false,
  description: 'Mobile vertical cameras list with flicker-free snapshot refresh and Bruno liquid glass visuals.',
});
