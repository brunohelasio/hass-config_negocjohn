const INSTALL_FLAG = Symbol.for('bruno.room-tile.ios-longpress-guard');

interface RoomTileLifecycle extends HTMLElement {
  updated?: (...args: unknown[]) => void;
  [INSTALL_FLAG]?: boolean;
}

interface RoomTileConstructor extends CustomElementConstructor {
  prototype: RoomTileLifecycle;
}

/**
 * Replica somente o ajuste da rodada Sonnet que foi validado fisicamente no
 * iPhone: desliga o callout/drag/selecao nativos da imagem sem mexer nos
 * eventos de pointer do botao, portanto o hold customizado continua intacto.
 *
 * A migracao PNG->WebP e as demais alteracoes daquela rodada NAO entram aqui.
 */
function protectRoomAssets(tile: RoomTileLifecycle): void {
  const root = tile.shadowRoot;
  if (!root) return;

  root.querySelectorAll<HTMLImageElement>('img.room-asset').forEach((img) => {
    img.draggable = false;
    img.setAttribute('draggable', 'false');
    img.style.setProperty('-webkit-touch-callout', 'none');
    img.style.setProperty('-webkit-user-drag', 'none');
    img.style.setProperty('-webkit-user-select', 'none');
    img.style.setProperty('user-select', 'none');
  });
}

/** Instala uma unica vez a protecao nos tiles de comodo ja registrados. */
export function installRoomTileIosLongPressGuard(): void {
  void customElements.whenDefined('bruno-room-tile').then(() => {
    const ctor = customElements.get('bruno-room-tile') as RoomTileConstructor | undefined;
    if (!ctor) return;

    const proto = ctor.prototype;
    if (proto[INSTALL_FLAG]) return;
    proto[INSTALL_FLAG] = true;

    const previousUpdated = proto.updated;
    proto.updated = function (...args: unknown[]): void {
      previousUpdated?.apply(this, args);
      protectRoomAssets(this);
    };
  });
}
