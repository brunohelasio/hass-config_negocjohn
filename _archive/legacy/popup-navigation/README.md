# Legado — navegação por pop-up

**Arquivado em:** 2026-08-02 (Fase 3 da reestruturação)
**Geração:** 2026-03 a 2026-06

## Motivo do arquivamento

Geração em que cada cômodo abria um popup do `browser_mod` com colunas de botões e câmera. Substituída por subviews e depois pela shell.

## O que substituiu

As subviews de cômodo (`custom:bruno-*-subview`) dentro da shell, que trocam de seção por hash sem remontar a rail.

## Verificação feita antes de mover

Cada arquivo aqui passou por três testes:

1. **Inalcançável** a partir de `config/dashboards/ui-lovelace-main.yaml`
   seguindo `!include` em linhas não comentadas;
2. **Não referenciado por nenhum arquivo alcançável**, nem por caminho nem
   por nome, em linha ativa;
3. **Não citado em nenhuma linha de rollback comentada** de arquivo ativo —
   arquivos "a um descomentar" de voltar **não** foram movidos.

Após a movimentação, o conjunto de arquivos alcançáveis permaneceu em **200**,
idêntico ao de antes.

## Risco de restauração

Médio. Alguns destes arquivos contêm o mapeamento entidade↔cômodo mais completo do repositório — foi fonte para `docs/05-rooms-and-devices.md`. Consultar antes de descartar de vez.

## Arquivos

```
dashboards/shared/columns/lights-all-light.yaml
dashboards/shared/columns/nowplaying.yaml
dashboards/shared/columns/room-living-cameras.yaml
dashboards/shared/columns/room-living-extras.yaml
dashboards/shared/columns/room-living-lights.yaml
dashboards/shared/columns/system-hass-chart.yaml
dashboards/shared/columns/system-hassio.yaml
dashboards/shared/extra-popup/vanessa.yaml
dashboards/shared/popup/all_lights.yaml
dashboards/shared/popup/camera_popup.yaml
dashboards/shared/popup/currently_playing.yaml
dashboards/shared/popup/footer/vacuum_roidmi.yaml
dashboards/shared/popup/footer/wifi_qr.yaml
dashboards/shared/popup/hallway.yaml
dashboards/shared/popup/livingroom_tv_popup.yaml
dashboards/shared/popup/rooms/livingroom_complex_backup.yaml
dashboards/shared/popup/rooms/livingroom_fullscreen.yaml
dashboards/shared/popup/rooms/livingroom_fullscreen/_cards.yaml
dashboards/shared/popup/rooms/livingroom_fullscreen/_layout.yaml
dashboards/shared/popup/spotify_playlist.yaml
dashboards/shared/popup/tvremote.yaml
dashboards/subviews/sidebar_cameras.yaml
dashboards/subviews/sidebar_floorplan.yaml
dashboards/subviews/sidebar_roborock.yaml
```

## Como restaurar

```bash
# um arquivo
git checkout pre-dashboard-architecture -- config/<caminho-original>

# ou mover de volta a partir daqui
mv _archive/legacy/popup-navigation/original-path/config/<caminho> config/<caminho>
```

> Nada aqui pode entrar no build, virar recurso do Lovelace, ser importado
> por `src/` ou ser carregado pelo Home Assistant.
