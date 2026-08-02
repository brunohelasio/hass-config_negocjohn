class BrunoMusicSubview extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this._redirected) this._redirect();
  }

  setConfig(config) {
    this._config = config || {};
  }

  getCardSize() {
    return 1;
  }

  async _redirect() {
    this._redirected = true;
    try {
      const result = await this._hass.callWS({
        type: 'hassio/ingress/entry',
        entry: 'd5369777_music_assistant'
      });
      if (result?.url) {
        globalThis.location.href = result.url;
      } else {
        throw new Error('URL de ingress não retornada');
      }
    } catch (e) {
      console.error('Erro ao abrir Music Assistant:', e);
      globalThis.location.href = '/hassio/addon/d5369777_music_assistant';
    }
  }
}

customElements.define('bruno-music-subview', BrunoMusicSubview);