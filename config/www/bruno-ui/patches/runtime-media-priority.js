// Media Hub runtime contract — 2026-08-19
// Energia da TV decide presença/estado visual; reprodução decide prioridade e animação.
const BRUNO_MEDIA_RUNTIME_TAG = 'bruno-room-subview';

customElements.whenDefined(BRUNO_MEDIA_RUNTIME_TAG).then(() => {
  const RoomSubview = customElements.get(BRUNO_MEDIA_RUNTIME_TAG);
  if (!RoomSubview || RoomSubview.prototype.__brunoRuntimeMediaPriority) return;
  const proto = RoomSubview.prototype;
  proto.__brunoRuntimeMediaPriority = true;

  const originalFonteAberta = proto._fonteAberta;
  proto._fonteAberta = function patchedRuntimeFonteAberta(chaves, ativas) {
    if (
      this?._temPc
      || !Array.isArray(chaves)
      || !chaves.includes('tv')
      || !chaves.includes('spotify')
    ) {
      return originalFonteAberta.call(this, chaves, ativas);
    }

    // No telefone, uma escolha explícita do usuário continua soberana até uma
    // nova reprodução real começar. Esse é o mesmo contrato de interação já
    // adotado pela subview unificada.
    if (this._estaNoTelefone?.() && this._fonteMidiaManual && chaves.includes(this._fonteMidia)) {
      const tv = this._modeloTv?.();
      const spotify = this._modeloSpotify?.();
      const reproduzindoAgora = [
        tv?.reproduzindo ? 'tv' : '',
        spotify?.tocando ? 'spotify' : '',
      ].filter(Boolean);
      const antes = this.__brunoRuntimePlaybackBefore || [];
      const nova = reproduzindoAgora.find((k) => !antes.includes(k));
      this.__brunoRuntimePlaybackBefore = reproduzindoAgora;
      if (!nova) return this._fonteMidia;
      this._fonteMidiaManual = false;
      this._fonteMidia = '';
      return nova;
    }

    const tv = this._modeloTv?.();
    const spotify = this._modeloSpotify?.();
    const playing = {
      tv: Boolean(tv?.reproduzindo),
      spotify: Boolean(spotify?.tocando),
    };
    const reproduzindoAgora = chaves.filter((k) => playing[k]);
    const antes = this.__brunoRuntimePlaybackBefore || [];
    this.__brunoRuntimePlaybackBefore = reproduzindoAgora;

    // Mantém o bookkeeping de energia do algoritmo antigo sincronizado para
    // que um simples "on/idle" não roube o foco de uma fonte que está tocando.
    this._midiaAtivasAntes = chaves.filter((k) => Boolean(ativas?.[k]));

    const novaReproducao = reproduzindoAgora.find((k) => !antes.includes(k));
    if (novaReproducao) {
      this._fonteMidia = '';
      return novaReproducao;
    }

    if (reproduzindoAgora.includes(this._fonteMidia)) return this._fonteMidia;
    if (reproduzindoAgora.length) return reproduzindoAgora[0];

    return originalFonteAberta.call(this, chaves, ativas);
  };

  // O template antigo ligava a classe is-playing quando a fonte estava apenas
  // energizada. Corrigimos no pós-render: TV só anima em playing/buffering e
  // Spotify só em playing. PC mantém a semântica de atividade do workspace.
  const originalUpdated = proto.updated;
  proto.updated = function patchedRuntimeMediaUpdated(...args) {
    const result = originalUpdated?.apply(this, args);
    const hub = this.shadowRoot?.querySelector('.media-hub-card.mh-accordion');
    const corpo = hub?.querySelector('.mh-source.is-open .mh-source-body');
    if (!hub || !corpo) return result;

    let tocando = false;
    if (corpo.classList.contains('mh-source-body-tv')) {
      tocando = Boolean(this._modeloTv?.()?.reproduzindo);
    } else if (corpo.classList.contains('mh-source-body-spotify')) {
      tocando = Boolean(this._modeloSpotify?.()?.tocando);
    } else if (corpo.classList.contains('mh-source-body-pc')) {
      tocando = Boolean(this._modeloPc?.()?.ativo);
    }
    hub.classList.toggle('is-playing', tocando);
    return result;
  };
});
