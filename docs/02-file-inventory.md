# 02 — Inventário de arquivos

Levantamento de 2026-08-02. Métricas obtidas por varredura, não por estimativa.

## Legenda de classificação

| Classe | Significado |
|---|---|
| `ACTIVE` | Executa em produção, sem dívida estrutural grave |
| `ACTIVE_BUT_NEEDS_REFACTOR` | Executa em produção **e** tem dívida medida |
| `REUSABLE_LEGACY` | Fora de produção, mas contém conhecimento a preservar |
| `OBSOLETE` | Fora do grafo de execução e de geração encerrada |
| `DUPLICATE` | Cópia de outro arquivo |
| `EXPERIMENTAL` | Tentativa, feature flag ou rollback deliberado |
| `UNKNOWN` | Uso não comprovável daqui — **não mover** |

## Totais

| | Quantidade |
|---|---|
| Arquivos JS (`config/www`) | 53 — 93.928 linhas |
| Custom elements registrados | 38 |
| Recursos ativos no HA | 52 |
| YAML em `config/dashboards/` | 349 |
| — alcançáveis pelo entrypoint | 197 |
| — órfãos (fora do grafo) | 152 (145 reais + 7 falso-positivo de caminho absoluto) |
| YAML em `config/packages/` | 42 |
| Temas | 17 (1 referenciado pelas views) |
| Integrações em `custom_components/` | 55 (2.485 arquivos) |
| Assets | 138 imagens, 51 MB, 127 MB decodificados |

---

## Camada JavaScript — inventário completo

`hist` = linhas de comentário com marcador histórico (`ANTERIOR`, `ORIGINAL`,
`rollback`, `LEGADO`, `DESATIVADO`). `disc.CB` = tem `disconnectedCallback`.

| Arquivo | Linhas | %coment | hist | timers | listen | remove | disc.CB |
|---|---|---|---|---|---|---|---|
| `bento-sidebar-card.js` | 889 | 3% | 2 | 1 | 3 | 0 | — |
| `bruno-ui/cards/bruno-activity-column.js` | 537 | 17% | 0 | 2 | 0 | 0 | sim |
| `bruno-ui/cards/bruno-agenda-card.js` | 518 | 0% | 0 | 1 | 2 | 0 | sim |
| `bruno-ui/cards/bruno-cameras-card.js` | 1137 | 0% | 0 | 1 | 10 | 0 | sim |
| `bruno-ui/cards/bruno-corredor-card.js` | 1575 | 9% | 33 | 9 | 20 | 0 | sim |
| `bruno-ui/cards/bruno-cozinha-card.js` | 1546 | 5% | 32 | 11 | 19 | 0 | sim |
| `bruno-ui/cards/bruno-energy-card.js` | 608 | 0% | 1 | 0 | 1 | 0 | — |
| `bruno-ui/cards/bruno-hero-card.js` | 1898 | 1% | 0 | 1 | 4 | 0 | sim |
| `bruno-ui/cards/bruno-hero-stage-card.js` | 200 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/cards/bruno-home-camera-card.js` | 769 | 0% | 1 | 1 | 5 | 0 | sim |
| `bruno-ui/cards/bruno-lavabo-card.js` | 1916 | 5% | 28 | 5 | 24 | 0 | sim |
| `bruno-ui/cards/bruno-media-card.js` | 2092 | 0% | 0 | 3 | 22 | 0 | — |
| `bruno-ui/cards/bruno-mobile-cameras-list-card.js` | 376 | 0% | 0 | 1 | 1 | 0 | sim |
| `bruno-ui/cards/bruno-mobile-card-frame.js` | 110 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/cards/bruno-mobile-nav-card.js` | 228 | 0% | 0 | 1 | 1 | 0 | — |
| `bruno-ui/cards/bruno-mobile-rooms-card.js` | 183 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/cards/bruno-mobile-sala-card.js` | 721 | 0% | 1 | 4 | 5 | 0 | — |
| `bruno-ui/cards/bruno-office-card.js` | 1659 | 5% | 36 | 9 | 19 | 0 | sim |
| `bruno-ui/cards/bruno-quarto-casal-card.js` | 1524 | 5% | 36 | 9 | 19 | 0 | sim |
| `bruno-ui/cards/bruno-quarto-marina-card.js` | 1502 | 4% | 27 | 9 | 19 | 0 | sim |
| `bruno-ui/cards/bruno-quarto-miguel-card.js` | 1514 | 5% | 31 | 9 | 19 | 0 | sim |
| `bruno-ui/cards/bruno-quick-actions-card.js` | 671 | 2% | 3 | 2 | 6 | 0 | — |
| `bruno-ui/cards/bruno-roborock-card.js` | 942 | 0% | 0 | 0 | 9 | 0 | — |
| `bruno-ui/cards/bruno-sala-card.js` | 4369 | 4% | 76 | 10 | 19 | 0 | sim |
| `bruno-ui/cards/bruno-sala-room-card.js` | 1371 | 3% | 1 | 9 | 17 | 0 | sim |
| `bruno-ui/cards/bruno-top-badges-card.js` | 1056 | 1% | 0 | 2 | 9 | 0 | — |
| `bruno-ui/core/bruno-hybrid-light-icons.js` | 228 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-icons.js` | 113 | 2% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-ios-dark.js` | 161 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-ios-light.js` | 187 | 1% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-josh.js` | 425 | 57% | 12 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-liquid-glass-ios.js` | 198 | 4% | 1 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-liquid-glass.js` | 459 | 3% | 2 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-liquid-glass_v1.js` | 379 | 1% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-network-panel.js` | 183 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-scenes-panel.js` | 169 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-shell.js` | 2061 | 5% | 8 | 0 | 12 | 9 | sim |
| `bruno-ui/core/bruno-surface-material.js` | 540 | 26% | 4 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-system-panel.js` | 189 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-theme-manager.js` | 151 | 2% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-updates-panel.js` | 408 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-visionos.js` | 409 | 1% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/core/bruno-wallpaper-manager.js` | 121 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/subviews/bruno-cameras-security-subview.js` | 1597 | 9% | 25 | 2 | 4 | 2 | sim |
| `bruno-ui/subviews/bruno-cozinha-subview.js` | 8783 | 2% | 33 | 3 | 6 | 6 | sim |
| `bruno-ui/subviews/bruno-music-subview.js` | 33 | 0% | 0 | 0 | 0 | 0 | — |
| `bruno-ui/subviews/bruno-office-subview.js` | 8429 | 2% | 33 | 3 | 6 | 6 | sim |
| `bruno-ui/subviews/bruno-planta-3d-subview.js` | 2204 | 1% | 4 | 3 | 8 | 12 | sim |
| `bruno-ui/subviews/bruno-quarto-casal-subview.js` | 8889 | 3% | 37 | 3 | 6 | 6 | sim |
| `bruno-ui/subviews/bruno-quarto-marina-subview.js` | 8910 | 3% | 36 | 3 | 6 | 6 | sim |
| `bruno-ui/subviews/bruno-quarto-miguel-subview.js` | 8925 | 3% | 35 | 3 | 6 | 6 | sim |
| `bruno-ui/subviews/bruno-roborock-subview.js` | 937 | 5% | 3 | 1 | 3 | 3 | sim |
| `bruno-ui/subviews/bruno-sala-subview.js` | 8928 | 3% | 40 | 3 | 6 | 6 | sim |

## YAML órfão — lista completa

Arquivos em `config/dashboards/` que **não** são alcançáveis a partir de
`ui-lovelace-main.yaml` seguindo apenas `!include` em linhas não comentadas.

> **Falso-positivo conhecido:** os 7 arquivos de `dashboards/floorplan/` são
> incluídos por caminho absoluto (`!include_dir_merge_list /config/dashboards/floorplan/`),
> válido no HA mas não resolvível pelo resolvedor local. **Eles estão em uso.**
>
> ✅ **Validado contra o `/config` real (Fase 2b, 2026-08-02).** A lista abaixo é
> a versão **anterior** à reconciliação, mantida para rastreabilidade. Correções:
> `shared/sidebar/sidebar_tablet_landscape.yaml` **não é órfão** (é puxado por
> `main-grid/sidebar.yaml`, que só existia no HA e foi importado); e os 3 novos
> `subviews/sidebar_{cameras,floorplan,roborock}.yaml` entraram como órfãos.
>
> **Números corrigidos: 354 YAML, 200 alcançáveis, 154 órfãos, 0 `!include` sem
> alvo.** Detalhe em [`12-migration-plan.md`](12-migration-plan.md), Fase 2b.

```
dashboards/floorplan/covers.yaml
dashboards/floorplan/doors.yaml
dashboards/floorplan/lights.yaml
dashboards/floorplan/mediaplayers.yaml
dashboards/floorplan/mix.yaml
dashboards/floorplan/motions.yaml
dashboards/floorplan/temphumid.yaml
dashboards/shared/cards-sticky-menu.yaml
dashboards/shared/columns/lights-all-light.yaml
dashboards/shared/columns/nowplaying.yaml
dashboards/shared/columns/room-living-cameras.yaml
dashboards/shared/columns/room-living-extras.yaml
dashboards/shared/columns/room-living-lights.yaml
dashboards/shared/columns/room_living_extras.yaml
dashboards/shared/columns/room_living_lights.yaml
dashboards/shared/columns/system-hass-chart.yaml
dashboards/shared/columns/system-hassio.yaml
dashboards/shared/extra-popup/vanessa.yaml
dashboards/shared/grid-cards/bento_calendar.yaml
dashboards/shared/grid-cards/bento_cameras.yaml
dashboards/shared/grid-cards/bento_cozinha.yaml
dashboards/shared/grid-cards/bento_energy.yaml
dashboards/shared/grid-cards/bento_lavabo.yaml
dashboards/shared/grid-cards/bento_media.yaml
dashboards/shared/grid-cards/bento_office.yaml
dashboards/shared/grid-cards/bento_quarto_casal.yaml
dashboards/shared/grid-cards/bento_quarto_marina.yaml
dashboards/shared/grid-cards/bento_quarto_miguel.yaml
dashboards/shared/grid-cards/bento_quick_actions.yaml
dashboards/shared/grid-cards/bento_roborock.yaml
dashboards/shared/grid-cards/bento_sala.yaml
dashboards/shared/grid-cards/bento_sidebar.yaml
dashboards/shared/grid-cards/bento_top_badges.yaml
dashboards/shared/grid-cards/bento_welcome.yaml
dashboards/shared/grid-cards/mobile-media.yaml
dashboards/shared/grid-cards/mobile_comodos_rail.yaml
dashboards/shared/grid-cards/mobile_sala_wrapper.yaml
dashboards/shared/grid-cards/mobile_top_badges.yaml
dashboards/shared/hidden/atv_remote.yaml
dashboards/shared/hidden/floorplan_landscape.yaml
dashboards/shared/hidden/floorplan_portrait.yaml
dashboards/shared/hidden/movie_slide.yaml
dashboards/shared/hidden/sticky_menu.yaml
dashboards/shared/hidden/stiicky-menu.yaml
dashboards/shared/hidden/ymovie.yaml
dashboards/shared/honeycomb/cover_bedroom.yaml
dashboards/shared/honeycomb/cover_living.yaml
dashboards/shared/honeycomb/living.yaml
dashboards/shared/honeycomb/office_mode.yaml
dashboards/shared/honeycomb/security.yaml
dashboards/shared/mobile-bottom-nav.yaml
dashboards/shared/mobile-pill-nav.yaml
dashboards/shared/mobile/mobile_calendar_card.yaml
dashboards/shared/mobile/mobile_cameras_card.yaml
dashboards/shared/mobile/mobile_card_cozinha.yaml
dashboards/shared/mobile/mobile_card_lavabo.yaml
dashboards/shared/mobile/mobile_card_office.yaml
dashboards/shared/mobile/mobile_card_quarto_casal.yaml
dashboards/shared/mobile/mobile_card_quarto_marina.yaml
dashboards/shared/mobile/mobile_card_quarto_miguel.yaml
dashboards/shared/mobile/mobile_card_room_compact.yaml
dashboards/shared/mobile/mobile_card_sala_compact.yaml
dashboards/shared/mobile/mobile_comodos_grid.yaml
dashboards/shared/mobile/mobile_energy_card.yaml
dashboards/shared/mobile/mobile_hero_welcome.yaml
dashboards/shared/mobile/mobile_media_card.yaml
dashboards/shared/mobile/mobile_pill_nav.yaml
dashboards/shared/mobile/mobile_quick_actions.yaml
dashboards/shared/mobile/mobile_roborock_card.yaml
dashboards/shared/mobile/mobile_rooms_carousel.yaml
dashboards/shared/mobile/mobile_rooms_rail.yaml
dashboards/shared/mobile/mobile_sala_card.yaml
dashboards/shared/mobile/mobile_sala_hero.yaml
dashboards/shared/mobile/mobile_top_badges.yaml
dashboards/shared/popup/airpurifier.yaml
dashboards/shared/popup/all_lights.yaml
dashboards/shared/popup/camera_popup.yaml
dashboards/shared/popup/camera_zahrada.yaml
dashboards/shared/popup/cameras.yaml
dashboards/shared/popup/currently_playing.yaml
dashboards/shared/popup/footer/vacuum_roidmi.yaml
dashboards/shared/popup/footer/wifi_qr.yaml
dashboards/shared/popup/hallway.yaml
dashboards/shared/popup/home_vietngoc.yaml
dashboards/shared/popup/livingroom_tv_popup.yaml
dashboards/shared/popup/media_spotify.yaml
dashboards/shared/popup/mobile_mais_sheet.yaml
dashboards/shared/popup/mobile_more_menu.yaml
dashboards/shared/popup/popup_mass.yaml
dashboards/shared/popup/rooms/atv_remote.yaml
dashboards/shared/popup/rooms/livingroom_complex_backup.yaml
dashboards/shared/popup/rooms/livingroom_fullscreen.yaml
dashboards/shared/popup/rooms/livingroom_fullscreen/_cards.yaml
dashboards/shared/popup/rooms/livingroom_fullscreen/_layout.yaml
dashboards/shared/popup/security_sensors.yaml
dashboards/shared/popup/spotify_playlist.yaml
dashboards/shared/popup/tvremote.yaml
dashboards/shared/sidebar/sidebar_mobile_home.yaml
dashboards/shared/sidebar/sidebar_tablet_landscape.yaml
dashboards/shared/snippets/card-style-sticky-menu.yaml
dashboards/shared/snippets/layout-column.yaml
dashboards/shared/snippets/layout-header-content.yaml
dashboards/shared/snippets/layout-live-tile-mini.yaml
dashboards/shared/snippets/layout-live-tile.yaml
dashboards/shared/snippets/layout-page-columns-kodi.yaml
dashboards/shared/snippets/layout-page-columns-one.yaml
dashboards/shared/snippets/layout-page-columns.yaml
dashboards/shared/snippets/layout-page-title-with-2-badges.yaml
dashboards/shared/snippets/layout-page-title.yaml
dashboards/shared/snippets/main-grid-swipe-params.yaml
dashboards/shared/snippets/media-control-mute.yaml
dashboards/shared/snippets/media-control-next.yaml
dashboards/shared/snippets/media-control-playpause.yaml
dashboards/shared/snippets/media-control-prev.yaml
dashboards/shared/snippets/media-control-vol-down.yaml
dashboards/shared/snippets/media-control-vol-up.yaml
dashboards/shared/snippets/media-slide-focus-bento-square.yaml
dashboards/shared/snippets/media-slide-focus-bento.yaml
dashboards/shared/snippets/parameters-page-title-swipe-card.yaml
dashboards/shared/snippets/style-header-markdown.yaml
dashboards/shared/snippets/style-markdown-page-title.yaml
dashboards/shared/snippets/style-page-title-swipe-card-tile.yaml
dashboards/shared/snippets/style-page-title-swipe-card.yaml
dashboards/shared/snippets/style-person-popup.yaml
dashboards/shared/snippets/style-section-heading.yaml
dashboards/shared/snippets/style_popup_cardmod.yaml
dashboards/shared/snippets/view-background.yaml
dashboards/subviews/modules/sala/_cards.yaml
dashboards/subviews/modules/sala/_layout.yaml
dashboards/subviews/ytube-music.yaml
dashboards/templates/button_card_templates/system_monitoring/sys_base.yaml
dashboards/templates/button_card_templates/system_monitoring/system-monitor.yaml
dashboards/templates/button_card_templates/ui_button_cards/header-cards.yaml
dashboards/templates/button_card_templates/ui_button_cards/live-tiles.yaml
dashboards/views/bento_main.yaml
dashboards/views/disabled/floorplan.yaml
dashboards/views/main-grid/v2/bento_comodos_strip.yaml
dashboards/views/main-grid/v2/bento_quick_actions_v2.yaml
dashboards/views/main-grid/v2/legacy/bento_dynamic_conditional.yaml
dashboards/views/media-grid/footer_copy.yaml
dashboards/views/media-grid/movies.yaml
dashboards/views/mobile-climate-media.yaml
dashboards/views/mobile-home.yaml
dashboards/views/mobile-masters-rooms.yaml
dashboards/views/mobile-security-cameras.yaml
dashboards/views/mobile-v2-cameras.yaml
dashboards/views/mobile-v2-casa.yaml
dashboards/views/mobile-v2-comodos.yaml
dashboards/views/mobile-v2-midia.yaml
dashboards/views/mobile/mobile-desktop-redirect.yaml
dashboards/views/shell/section_home.yaml
dashboards/views/shell/section_roborock.yaml
```

---

## Classificação por grupo

### `ACTIVE`
Núcleo enxuto: `bruno-icons.js`, `bruno-theme-manager.js`,
`bruno-wallpaper-manager.js`, `bruno-{system,network,scenes,updates}-panel.js`,
`bruno-{ios-light,ios-dark,visionos}.js`, `bruno-hybrid-light-icons.js`,
`bruno-music-subview.js`, `bruno-hero-stage-card.js`, `bruno-agenda-card.js`,
`bruno-energy-card.js`, `bruno-activity-column.js`.
YAML: `bento_shell.yaml`, `shell/{rail,rail_rooms,section_home_v2,section_cameras}.yaml`,
`packages/*_presence.yaml`, `themes/tablet.yaml`.

### `ACTIVE_BUT_NEEDS_REFACTOR`
As 6 subviews de cômodo (52.864 linhas, 88–97% duplicadas), os 7 cards de cômodo,
`bruno-sala-card.js` (4.369), `bruno-shell.js` (2.061), `bruno-media-card.js`
(2.092), `bruno-lavabo-card.js` (1.916), `bruno-planta-3d-subview.js` (2.204),
`bruno-surface-material.js` (44% comentário), `bruno-josh.js` (57% comentário).
YAML: `views/main.yaml` + os 39 de `views/main-grid/`, `templates/**`.

### `REUSABLE_LEGACY`
`CLAUDE.md` (168 KB), `AGENTS.md` (144 KB), `docs/bruno-shell-spec.md` (25 KB),
`shared/popup/rooms/*.yaml` (mapeamento entidade↔cômodo mais completo do repo),
`templates/button_card_templates/tpl_base.yaml` (lógica de `state_on` por domínio).

### `OBSOLETE` — 145 arquivos
Mobile V1/V2/V3 shared (40) · herança `negocjohn` (12: `home_vietngoc.yaml`,
`home_zuzu.yaml`, `camera_zahrada.yaml`, `honeycomb/*`) · Bento anterior (~20) ·
popups (16) · snippets (28) · `hidden/` (7) · backups explícitos (3) ·
`shell/section_roborock.yaml` · `bruno-liquid-glass_v1.js`.

### `DUPLICATE`
6 subviews entre si · 7 cards de cômodo entre si ·
`hidden/sticky_menu.yaml` × `hidden/stiicky-menu.yaml` (typo) ·
`popup/rooms/atv_remote.yaml` × `hidden/atv_remote.yaml` ·
`main-grid/floorplan.yaml` × `disabled/floorplan.yaml` ·
`main-grid/bento_*.yaml` × `main-grid/v2/bento_*.yaml` ·
design tokens repetidos entre `bruno-josh.js`, `bruno-visionos.js`,
`bruno-ios-*.js` e inline nas 6 subviews.

### `EXPERIMENTAL`
`main-grid/v2/` + `v2/legacy/` (parte em produção) ·
`shell/section_home.yaml` (rollback deliberado de 1 linha) ·
`custom_components/bruno_tuya_motion/` (ponte própria) ·
`cover-screen.yaml.disabled` · `views/disabled/`.

### `UNKNOWN` — não mover
`config/lovelace-homekitesq.yaml` (registrado e inexistente) ·
`shared/popup/media_all_players.yaml` (24 includes ativos, nunca existiu no Git) ·
`custom_components/` (55) · `custom_components/delete/` ·
`themes/` (16 não referenciados) · `tmp/` (49 fallbacks).

---

## Problemas transversais

| Problema | Escala | Onde |
|---|---|---|
| Re-render total no `set hass` | ~30 cards | todos os `bruno-*-card.js` |
| Listeners sem remoção | 316 add / 62 remove | 9 arquivos sem `disconnectedCallback` |
| Polling por `setInterval` | 124 timers | 3 por subview de cômodo |
| Comentário histórico em produção | 1.178 linhas | pior caso: `bruno-josh.js` 57%, `bruno-surface-material.js` 44% |
| Rollback comentado no manifesto | 242 linhas | `configuration.yaml`, bloco `extra_module_url` |
| Assets superdimensionados | 33 PNG → 127 MB | `www/bruno-ui/assets/` — 1254×1254 px exibidos a ~100 px |
| Tokens duplicados | — | 4 arquivos de tema + inline nas 6 subviews |
| CSS em template literal sem checagem | 93.928 linhas | incidente da crase: 4 ocorrências |
