// tv-office-state-contract.js — validacao Chat -> GitHub (2026-08-18)
//
// Escopo: estabilizar o contrato de estado da TV (power != playback), impedir
// falso positivo do PC enquanto o HASS.Agent estiver sem liveness confiavel,
// ligar a tile real da cortina da Sala quando a configuracao compilada nao
// entregar a entidade, e preservar a supressao de long-press ja validada no
// iOS. O patch e deliberadamente pequeno e reversivel: apos validacao fisica,
// as regras podem ser incorporadas aos componentes-fonte em uma rodada propria.
//
// ROLLBACK: remover o import deste modulo no fim de home-mobile-hero-rail.js e
// apagar este arquivo. Nenhum comando de power da TV e substituido aqui.

const BRUNO_STATE_PATCH_TV_RICH = 'media_player.android_tv_192_168_3_17';
const BRUNO_STATE_PATCH_TV_POWER = 'media_player.atv';
const BRUNO_STATE_PATCH_CURTAIN = 'cover.cortina_varanda_cortina_2';
const BRUNO_STATE_PATCH_PC_ACTIVE = 'binary_sensor.office_pc_active';
const BRUNO_STATE_PATCH_TV_ON = new Set(['on', 'playing', 'paused', 'idle', 'buffering']);
const BRUNO_STATE_PATCH_BAD = new Set(['', 'unknown', 'unavailable', 'none', 'null']);

function brunoStateValue(entity) {
  return String(entity?.state ?? '').toLowerCase();
}

function brunoStateUnavailable(entity) {
  return !entity || BRUNO_STATE_PATCH_BAD.has(brunoStateValue(entity));
}

function brunoStateTvPowerOn(hass, richId = BRUNO_STATE_PATCH_TV_RICH, powerId = BRUNO_STATE_PATCH_TV_POWER) {
  const stable = hass?.states?.[powerId];
  const stableState = brunoStateValue(stable);

  // A fonte Android TV Remote e autoridade de power quando esta disponivel.
  if (!brunoStateUnavailable(stable)) {
    if (stableState === 'off') return false;
    if (BRUNO_STATE_PATCH_TV_ON.has(stableState)) return true;
  }

  // Fallback somente quando a fonte de power nao esta utilizavel. Mantem o
  // comportamento anterior sem permitir que transicoes normais virem OFF.
  const rich = hass?.states?.[richId];
  return BRUNO_STATE_PATCH_TV_ON.has(brunoStateValue(rich));
}

function brunoStateInsertAfterPresence(dots, dot) {
  const next = Array.isArray(dots) ? [...dots] : [];
  const lastPresence = next.reduce((found, item, index) => {
    const label = String(item?.label ?? '').toLowerCase();
    return label.includes('presen') ? index : found;
  }, -1);
  next.splice(lastPresence + 1, 0, dot);
  return next;
}

function brunoStatePatchSalaCard(Card) {
  if (!Card || Card.prototype.__brunoStateTvPowerPatch) return;
  const proto = Card.prototype;
  if (typeof proto._model !== 'function') return;
  proto.__brunoStateTvPowerPatch = true;

  const originalModel = proto._model;
  proto._model = function patchedSalaModel(...args) {
    const model = originalModel.apply(this, args);
    if (!model || !this?._hass) return model;

    const richId = this?._config?.entities?.tv || BRUNO_STATE_PATCH_TV_RICH;
    const tvOn = brunoStateTvPowerOn(this._hass, richId, BRUNO_STATE_PATCH_TV_POWER);
    model.tvOn = tvOn;
    model.tvStateLabel = tvOn ? 'ON' : 'OFF';
    if (String(model.tvLabel || '').toLowerCase() === 'desligado' && tvOn) model.tvLabel = 'Ligado';
    return model;
  };
}

function brunoStatePatchOfficeCard(Card) {
  if (!Card || Card.prototype.__brunoStatePcPatch) return;
  const proto = Card.prototype;
  if (typeof proto._model !== 'function') return;
  proto.__brunoStatePcPatch = true;

  const originalModel = proto._model;
  proto._model = function patchedOfficeModel(...args) {
    const model = originalModel.apply(this, args);
    if (!model) return model;

    // Fail-closed: session_state pode permanecer Unlocked com o HASS.Agent
    // desconectado. Enquanto nao houver liveness confiavel, ele nao e power.
    const id = this?._config?.entities?.pc_active || BRUNO_STATE_PATCH_PC_ACTIVE;
    model.pcOn = this?._hass?.states?.[id]?.state === 'on';
    return model;
  };
}

function brunoStatePatchRoomTile(Card) {
  if (!Card || Card.prototype.__brunoStateRoomTilePatch) return;
  const proto = Card.prototype;
  proto.__brunoStateRoomTilePatch = true;

  if (typeof proto._watched === 'function') {
    const originalWatched = proto._watched;
    proto._watched = function patchedWatched(...args) {
      const ids = originalWatched.apply(this, args) || [];
      if (this?._room?.id !== 'sala' || ids.includes(BRUNO_STATE_PATCH_TV_POWER)) return ids;
      return [...ids, BRUNO_STATE_PATCH_TV_POWER];
    };
  }

  if (typeof proto._dots === 'function') {
    const originalDots = proto._dots;
    proto._dots = function patchedDots(...args) {
      let dots = originalDots.apply(this, args) || [];
      const roomId = this?._room?.id;
      const hass = this?._hass;

      if (roomId === 'sala') {
        dots = dots.filter((dot) => String(dot?.label || '').toLowerCase() !== 'tv ativa');
        if (brunoStateTvPowerOn(hass)) {
          dots = brunoStateInsertAfterPresence(dots, {
            icon: 'mdi:television-classic',
            label: 'TV ativa',
            tone: 'purple',
          });
        }
      }

      if (roomId === 'office') {
        dots = dots.filter((dot) => String(dot?.label || '').toLowerCase() !== 'pc ativo');
        if (hass?.states?.[BRUNO_STATE_PATCH_PC_ACTIVE]?.state === 'on') {
          dots = brunoStateInsertAfterPresence(dots, {
            icon: 'mdi:desktop-classic',
            label: 'PC ativo',
            tone: 'purple',
          });
        }
      }

      return dots;
    };
  }
}

function brunoStatePatchRoomSubview(Card) {
  if (!Card || Card.prototype.__brunoStateRoomSubviewPatch) return;
  const proto = Card.prototype;
  proto.__brunoStateRoomSubviewPatch = true;

  if (typeof proto._modeloTv === 'function') {
    const originalModeloTv = proto._modeloTv;
    proto._modeloTv = function patchedModeloTv(...args) {
      const model = originalModeloTv.apply(this, args);
      if (!model || !this?._hass) return model;

      const richId = this?._idDe?.('tv') || this?._sub?.entities?.tv || BRUNO_STATE_PATCH_TV_RICH;
      const powerId = this?._idDe?.('tvRemotePlayer') || this?._sub?.entities?.tvRemotePlayer || BRUNO_STATE_PATCH_TV_POWER;
      const ativo = brunoStateTvPowerOn(this._hass, richId, powerId);
      const richState = brunoStateValue(this._hass?.states?.[richId]);
      const powerState = brunoStateValue(this._hass?.states?.[powerId]);

      model.ativo = ativo;
      if (!ativo) {
        model.estado = 'off';
      } else if (!BRUNO_STATE_PATCH_TV_ON.has(richState)) {
        model.estado = BRUNO_STATE_PATCH_TV_ON.has(powerState) ? powerState : 'on';
      }
      return model;
    };
  }

  if (typeof proto._entidadeCortina === 'function') {
    const originalCurtain = proto._entidadeCortina;
    proto._entidadeCortina = function patchedCurtainEntity(...args) {
      const candidates = [];
      const add = (value) => {
        if (typeof value === 'string' && value && !candidates.includes(value)) candidates.push(value);
      };

      add(originalCurtain.apply(this, args));
      add(this?._idDe?.('curtain'));
      const covers = this?._room?.entities?.covers;
      if (Array.isArray(covers)) covers.forEach(add);
      if (this?._room?.id === 'sala' || this?._sub?.id === 'sala') add(BRUNO_STATE_PATCH_CURTAIN);

      const live = candidates.find((id) => {
        const entity = this?._estado?.(id) || this?._hass?.states?.[id];
        return entity && !brunoStateUnavailable(entity);
      });
      return live || candidates[0];
    };
  }
}

function brunoStatePatchMediaCard(Card) {
  if (!Card || Card.prototype.__brunoStateMediaPatch) return;
  const proto = Card.prototype;
  proto.__brunoStateMediaPatch = true;

  if (typeof proto._isActive === 'function') {
    const originalIsActive = proto._isActive;
    proto._isActive = function patchedIsActive(entityId) {
      if (brunoStateValue(this?._state?.(entityId)) === 'buffering') return true;
      return originalIsActive.call(this, entityId);
    };
  }

  if (typeof proto._hasPlayback === 'function') {
    const originalHasPlayback = proto._hasPlayback;
    proto._hasPlayback = function patchedHasPlayback(
      state, title, image, appName, source, entityId = '', config = {}, contentType = '', attributes = {}
    ) {
      const normalized = String(state || '').toLowerCase();
      const shellText = `${title || ''} ${appName || ''} ${source || ''}`.toLowerCase();
      const isShell = ['google tv launcher', 'android tv launcher', 'launcher', 'ambient mode', 'backdrop', 'home screen']
        .some((term) => shellText.includes(term));
      if (normalized === 'buffering') return !isShell;
      return originalHasPlayback.call(
        this, state, title, image, appName, source, entityId, config, contentType, attributes
      );
    };
  }

  if (typeof proto._stateLabel === 'function') {
    const originalStateLabel = proto._stateLabel;
    proto._stateLabel = function patchedStateLabel(state) {
      if (String(state || '').toLowerCase() === 'buffering') return 'Carregando';
      return originalStateLabel.call(this, state);
    };
  }

  if (typeof proto._focusModel === 'function') {
    const originalFocusModel = proto._focusModel;
    proto._focusModel = function patchedFocusModel(...args) {
      const model = originalFocusModel.apply(this, args);
      if (!model || String(model.state || '').toLowerCase() !== 'buffering') return model;

      model.hasPlayback = true;
      model.isActive = true;
      model.statusLabel = 'Carregando';
      if (!model.image) {
        model.image = this?._lastArtworkByPlayer?.[model.entity]
          || this?._mediaHistory?.[model.entity]?.image
          || '';
      }
      model.isSoftArtwork = false;
      return model;
    };
  }
}

function brunoStateProtectImages(card) {
  card?.shadowRoot?.querySelectorAll?.('img').forEach((image) => {
    image.setAttribute('draggable', 'false');
    image.style.webkitTouchCallout = 'none';
    image.style.webkitUserDrag = 'none';
    image.style.userSelect = 'none';
    image.style.webkitUserSelect = 'none';
  });
}

function brunoStatePatchClassicImages(Card) {
  if (!Card || Card.prototype.__brunoStateImagePatch || typeof Card.prototype._render !== 'function') return;
  const proto = Card.prototype;
  proto.__brunoStateImagePatch = true;
  const originalRender = proto._render;
  proto._render = function patchedImageRender(...args) {
    const result = originalRender.apply(this, args);
    brunoStateProtectImages(this);
    return result;
  };
}

function brunoStatePatchLitImages(Card) {
  if (!Card || Card.prototype.__brunoStateLitImagePatch) return;
  const proto = Card.prototype;
  proto.__brunoStateLitImagePatch = true;
  const originalUpdated = proto.updated;
  proto.updated = function patchedUpdated(...args) {
    const result = originalUpdated?.apply(this, args);
    brunoStateProtectImages(this);
    return result;
  };
}

const BRUNO_STATE_CLASSIC_IMAGE_TAGS = [
  'bruno-sala-card',
  'bruno-office-card',
  'bruno-cozinha-card',
  'bruno-lavabo-card',
  'bruno-quarto-casal-card',
  'bruno-quarto-marina-card',
  'bruno-quarto-miguel-card',
  'bruno-cameras-card',
  'bruno-home-camera-card',
  'bruno-mobile-cameras-list-card',
  'bruno-media-card',
];

const brunoStateDefinitions = [
  ['bruno-sala-card', brunoStatePatchSalaCard],
  ['bruno-office-card', brunoStatePatchOfficeCard],
  ['bruno-room-tile', brunoStatePatchRoomTile],
  ['bruno-room-subview', brunoStatePatchRoomSubview],
  ['bruno-media-card', brunoStatePatchMediaCard],
];

brunoStateDefinitions.forEach(([tag, patch]) => {
  customElements.whenDefined(tag).then(() => patch(customElements.get(tag)));
});

BRUNO_STATE_CLASSIC_IMAGE_TAGS.forEach((tag) => {
  customElements.whenDefined(tag).then(() => brunoStatePatchClassicImages(customElements.get(tag)));
});

['bruno-room-tile', 'bruno-room-subview'].forEach((tag) => {
  customElements.whenDefined(tag).then(() => brunoStatePatchLitImages(customElements.get(tag)));
});
