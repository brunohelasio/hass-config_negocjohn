# Round4 — Hub artwork e volume da TV

Baseline preservado: round3 confirmou ganho significativo no 5G, power da TV estável e card dinâmico com artwork.

## Ajustes desta rodada
- Hub usa a mesma prioridade de artwork do card dinâmico: `media_image_url` → `entity_picture` → `entity_picture_local`, ignorando strings vazias.
- Oscilação de `app_name/source` do ADB não apaga mais o último poster válido enquanto a entidade estável de power mantiver a TV ligada.
- Slider da TV não usa mais `media_player.volume_set`; converte o delta em `VOLUME_UP`/`VOLUME_DOWN` via `remote.smart_tv_pro`, caminho confirmado fisicamente no popup remoto.
- Scripts de volume/mute do Media Grid fazem a mesma rota para TV e preservam `media_player` para Spotify/Echos.

## Rollback
Estado anterior à round4: `_rollback/20260820-pre-physical-round4/`.

## Escopo preservado
Nenhuma mudança em performance, code splitting, Resources, power da TV, card dinâmico, cortina, câmeras, Spotify ou long-press.
