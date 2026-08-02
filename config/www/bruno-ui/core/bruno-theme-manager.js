const BRUNO_THEME_MANAGER_VERSION = '20260723-liquid-glass-ios-1';
const BRUNO_THEME_STORAGE_KEY = 'bruno-ui-theme';
const BRUNO_THEME_STORAGE_VERSION_KEY = 'bruno-ui-theme-storage-version';
const BRUNO_THEME_STORAGE_VERSION = '2';
const BRUNO_THEME_DEFAULT = 'visionos';

function brunoThemeManagerCreate() {
  const liquidOriginal = globalThis.BrunoLiquidGlassOriginal
    || (globalThis.BrunoLiquidGlass?.__brunoThemeProxy ? null : globalThis.BrunoLiquidGlass);
  const liquidIOSOriginal = globalThis.BrunoLiquidGlassIOS;
  const visionOriginal = globalThis.BrunoVisionOSOriginal || globalThis.BrunoVisionOS;
  const iosLightOriginal = globalThis.BrunoIOSLight;
  const iosDarkOriginal = globalThis.BrunoIOSDark;
  // NOVO (2026-07-24) — HOME V2: tema Josh.ai (cards cinza-quentes flat).
  const joshOriginal = globalThis.BrunoJosh;

  if (liquidOriginal) globalThis.BrunoLiquidGlassOriginal = liquidOriginal;
  if (visionOriginal) globalThis.BrunoVisionOSOriginal = visionOriginal;

  const themes = {
    'liquid-glass': {
      key: 'liquid-glass',
      label: 'Liquid Glass',
      get api() { return globalThis.BrunoLiquidGlassOriginal || liquidOriginal || null; },
    },
    'liquid-glass-ios': {
      key: 'liquid-glass-ios',
      label: 'Liquid Glass - iOS',
      get api() { return globalThis.BrunoLiquidGlassIOS || liquidIOSOriginal || null; },
    },
    visionos: {
      key: 'visionos',
      label: 'VisionOS',
      get api() { return globalThis.BrunoVisionOSOriginal || globalThis.BrunoVisionOS || visionOriginal || null; },
    },
    'ios-light': {
      key: 'ios-light',
      label: 'iOS Light',
      get api() { return globalThis.BrunoIOSLight || iosLightOriginal || null; },
    },
    'ios-dark': {
      key: 'ios-dark',
      label: 'iOS Dark',
      get api() { return globalThis.BrunoIOSDark || iosDarkOriginal || null; },
    },
    // NOVO (2026-07-24) — HOME V2: tema Josh.ai (core/bruno-josh.js).
    // FALLBACK: remover esta entrada (e o resource) — nada mais depende dela.
    josh: {
      key: 'josh',
      label: 'Josh.ai',
      get api() { return globalThis.BrunoJosh || joshOriginal || null; },
    },
  };

  const fallbackTheme = () => {
    if (themes[BRUNO_THEME_DEFAULT]?.api) return BRUNO_THEME_DEFAULT;
    if (themes['liquid-glass']?.api) return 'liquid-glass';
    return BRUNO_THEME_DEFAULT;
  };

  const validTheme = (key) => (themes[key]?.api ? key : fallbackTheme());

  const state = {
    current: fallbackTheme(),
  };

  const readStoredTheme = () => {
    try {
      const storageVersion = globalThis.localStorage?.getItem(BRUNO_THEME_STORAGE_VERSION_KEY) || '';
      if (storageVersion !== BRUNO_THEME_STORAGE_VERSION) {
        globalThis.localStorage?.setItem(BRUNO_THEME_STORAGE_VERSION_KEY, BRUNO_THEME_STORAGE_VERSION);
        globalThis.localStorage?.setItem(BRUNO_THEME_STORAGE_KEY, BRUNO_THEME_DEFAULT);
        return BRUNO_THEME_DEFAULT;
      }
      return globalThis.localStorage?.getItem(BRUNO_THEME_STORAGE_KEY) || '';
    } catch (error) {
      return '';
    }
  };

  const storeTheme = (key) => {
    try {
      globalThis.localStorage?.setItem(BRUNO_THEME_STORAGE_VERSION_KEY, BRUNO_THEME_STORAGE_VERSION);
      globalThis.localStorage?.setItem(BRUNO_THEME_STORAGE_KEY, key);
    } catch (error) {
      // Storage can be blocked in some embedded browsers; visual theme still applies.
    }
  };

  const activeApi = () => themes[state.current]?.api || themes[fallbackTheme()]?.api || null;

  const compatApi = {
    __brunoThemeProxy: true,
    get version() { return activeApi()?.version || BRUNO_THEME_MANAGER_VERSION; },
    apply(options) { return activeApi()?.apply?.(options) || null; },
    injectGlobalStyle(options) { return activeApi()?.injectGlobalStyle?.(options) || null; },
    tokens(options) { return activeApi()?.tokens?.(options) || ''; },
    cssVars(options) { return activeApi()?.cssVars?.(options) || ''; },
    cardVars(options) { return activeApi()?.cardVars?.(options) || ''; },
    controlVars(options) { return activeApi()?.controlVars?.(options) || ''; },
    popupVars(options) { return activeApi()?.popupVars?.(options) || ''; },
    iconVars(options) { return activeApi()?.iconVars?.(options) || ''; },
    styles(options) { return activeApi()?.styles?.(options) || ''; },
    buildStyles(options) { return activeApi()?.buildStyles?.(options) || ''; },
  };

  const manager = {
    version: BRUNO_THEME_MANAGER_VERSION,
    storageKey: BRUNO_THEME_STORAGE_KEY,
    defaultTheme: BRUNO_THEME_DEFAULT,
    themes,
    list() {
      return Object.values(themes).map((theme) => ({
        key: theme.key,
        label: theme.label,
        available: Boolean(theme.api?.apply),
      }));
    },
    current() {
      return state.current;
    },
    activeLabel() {
      return themes[state.current]?.label || themes[fallbackTheme()]?.label || 'VisionOS';
    },
    apply(key, options = {}) {
      const next = validTheme(key || BRUNO_THEME_DEFAULT);
      const api = themes[next]?.api || themes[fallbackTheme()]?.api;
      if (!api?.apply) return null;
      const style = api.apply(options.styleOptions || undefined);
      state.current = next;
      if (options.persist !== false) storeTheme(next);
      globalThis.BrunoLiquidGlass = compatApi;
      globalThis.dispatchEvent?.(new CustomEvent('bruno-theme-changed', {
        detail: { key: next, label: themes[next]?.label || next },
      }));
      return style;
    },
    get activeApi() {
      return activeApi();
    },
    compatApi,
  };

  const stored = validTheme(readStoredTheme() || BRUNO_THEME_DEFAULT);
  state.current = stored;
  globalThis.BrunoThemeManager = manager;
  manager.apply(stored, { persist: false });
  return manager;
}

globalThis.BrunoThemeManager = brunoThemeManagerCreate();
