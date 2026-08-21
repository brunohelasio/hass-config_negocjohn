class e extends HTMLElement {
  set hass(s) {
    this._hass = s, this._redirected || this._redirect();
  }
  setConfig(s) {
    this._config = s || {};
  }
  getCardSize() {
    return 1;
  }
  async _redirect() {
    this._redirected = !0;
    try {
      const s = await this._hass.callWS({
        type: "hassio/ingress/entry",
        entry: "d5369777_music_assistant"
      });
      if (s?.url)
        globalThis.location.href = s.url;
      else
        throw new Error("URL de ingress não retornada");
    } catch (s) {
      console.error("Erro ao abrir Music Assistant:", s), globalThis.location.href = "/hassio/addon/d5369777_music_assistant";
    }
  }
}
customElements.define("bruno-music-subview", e);
//# sourceMappingURL=bruno-music-subview.XuZ319ir.js.map
