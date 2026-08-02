const BRUNO_WALLPAPER_MANAGER_VERSION = '20260717-wallpaper-manager-1';
const BRUNO_WALLPAPER_REVISION_ENTITY = 'input_number.bruno_wallpaper_revision';

const BRUNO_WALLPAPER_SECTIONS = Object.freeze([
  { key: 'home', label: 'Painel principal', entity: 'input_text.bruno_wallpaper_home' },
  { key: 'sala', label: 'Sala', entity: 'input_text.bruno_wallpaper_sala' },
  { key: 'office', label: 'Office', entity: 'input_text.bruno_wallpaper_office' },
  { key: 'cozinha', label: 'Cozinha', entity: 'input_text.bruno_wallpaper_cozinha' },
  { key: 'casal', label: 'Quarto Casal', entity: 'input_text.bruno_wallpaper_casal' },
  { key: 'marina', label: 'Quarto Marina', entity: 'input_text.bruno_wallpaper_marina' },
  { key: 'miguel', label: 'Quarto Miguel', entity: 'input_text.bruno_wallpaper_miguel' },
  { key: 'cameras', label: 'Cameras', entity: 'input_text.bruno_wallpaper_cameras' },
  { key: 'roborock', label: 'Aspirador', entity: 'input_text.bruno_wallpaper_roborock' },
  { key: 'floorplan', label: 'Planta 3D', entity: 'input_text.bruno_wallpaper_floorplan' },
]);

const BrunoWallpaperManager = {
  version: BRUNO_WALLPAPER_MANAGER_VERSION,
  sections: BRUNO_WALLPAPER_SECTIONS,
  _pending: new Map(),
  _revision: 0,

  section(key) {
    return BRUNO_WALLPAPER_SECTIONS.find((item) => item.key === key) || BRUNO_WALLPAPER_SECTIONS[0];
  },

  value(hass, key) {
    const section = this.section(key);
    if (this._pending.has(section.key)) return this._pending.get(section.key);
    const state = hass?.states?.[section.entity]?.state || '';
    return this._isUsableUrl(state) ? String(state).trim() : '';
  },

  resolve(hass, key, fallback = '') {
    const source = this.value(hass, key) || fallback || '';
    if (!source) return '';
    const revisionState = Number(hass?.states?.[BRUNO_WALLPAPER_REVISION_ENTITY]?.state) || 0;
    const revision = Math.max(revisionState, this._revision);
    return this._withRevision(source, revision);
  },

  async save({ hass, key, url } = {}) {
    const section = this.section(key);
    const normalized = String(url || '').trim();
    if (normalized && !this._isUsableUrl(normalized)) {
      throw new Error('Use um caminho /local/, /api/ ou uma URL http(s).');
    }

    this._pending.set(section.key, normalized);
    const persistedRevision = Number(hass?.states?.[BRUNO_WALLPAPER_REVISION_ENTITY]?.state) || 0;
    this._revision = Math.max(this._revision, persistedRevision) + 1;

    if (hass?.states?.[section.entity]) {
      await hass.callService('input_text', 'set_value', {
        entity_id: section.entity,
        value: normalized,
      });
    }
    if (hass?.states?.[BRUNO_WALLPAPER_REVISION_ENTITY]) {
      await hass.callService('input_number', 'set_value', {
        entity_id: BRUNO_WALLPAPER_REVISION_ENTITY,
        value: this._revision,
      });
    }

    globalThis.dispatchEvent?.(new CustomEvent('bruno-wallpaper-changed', {
      detail: { key: section.key, url: normalized, revision: this._revision },
    }));
    return normalized;
  },

  clearPending(hass, key) {
    const section = this.section(key);
    const persisted = hass?.states?.[section.entity]?.state || '';
    if (this._pending.get(section.key) === persisted) this._pending.delete(section.key);
  },

  _isUsableUrl(value) {
    const url = String(value || '').trim();
    if (!url || ['unknown', 'unavailable', 'none'].includes(url.toLowerCase())) return false;
    return /^(?:\/local\/|\/api\/|https?:\/\/)/i.test(url);
  },

  _withRevision(value, revision) {
    const source = String(value || '').replace(/([?&])bruno_wallpaper=\d+(&?)/, (_m, prefix, tail) => (tail ? prefix : ''));
    if (!revision) return source;
    return `${source}${source.includes('?') ? '&' : '?'}bruno_wallpaper=${encodeURIComponent(revision)}`;
  },
};

globalThis.BrunoWallpaperManager = BrunoWallpaperManager;
