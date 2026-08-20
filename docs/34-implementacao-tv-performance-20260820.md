# 34 — Implementação integral TV + cold start remoto (2026-08-20)

## Base e rollback

Esta candidata existe somente na branch `fix/mobile-runtime-tv-curtain-20260819` e no PR #602. O `main` permanece intacto.

Antes da transformação, os arquivos substituídos foram copiados para `_rollback/20260820-pre-full-candidate/`.

Rollback físico: restaurar os arquivos correspondentes dessa pasta para os mesmos caminhos no Everex e reiniciar o Home Assistant. A lista anterior de Lovelace Resources em `.storage` não é apagada nesta candidata; ao retirar `resource_mode: yaml`, ela volta a ser utilizada.

## TV — decisão final

- `media_player.android_tv_192_168_3_17` permanece como entidade ativa do dashboard para estado, reprodução, source, título, volume e artwork.
- A permanência da Android TV é deliberada: ela foi adotada no painel porque as entidades Smart TV Pro não forneciam de forma suficiente a arte da mídia reproduzida.
- `remote.atv` permanece apenas como entidade de controle remoto. O nome é legado e não significa Apple TV.
- As entidades Smart TV Pro continuam existindo no Home Assistant, mas não participam desta candidata ativa.
- Energia e reprodução continuam semanticamente separadas: `on`, `playing`, `paused`, `idle` e `buffering` contam como TV energizada; `playing` e `buffering` contam como reprodução.
- O caminho ativo deixou de usar a janela sintética de 45 s para mascarar `off`.
- O power deixou de usar `homeassistant.toggle`; a direção é explícita (`media_player.turn_on` / `media_player.turn_off`).
- Último source/título/artwork/volume válido é preservado durante perdas transitórias de atributos enquanto a TV continua energizada.

## Spotify / Office / cortina

- Spotify: `entity_id` permanece dentro do service data nas chamadas de `hass.callService`; play/pause/volume usam o mesmo contrato correto que o restante do dashboard.
- Office: o indicador `PC ativo` usa `binary_sensor.office_pc_active` como autoridade do dot.
- Cortina: permanece a interpolação temporal do curso, sem concluir visualmente 0/100 antes do movimento físico terminar; telemetria intermediária pode reancorar a estimativa.
- O ajuste de long-press já validado no iPhone foi preservado.
- As câmeras permanecem nos IDs ONVIF canônicos já recuperados; esta candidata não reintroduz fallback Tuya.

## Cold start remoto

- `button_card_templates` e `streamline_templates` globais que estavam fora do grafo ativo da shell deixam de ser parseados no cold start.
- `lovelace.resource_mode: yaml` carrega apenas o núcleo necessário à candidata; `.storage/lovelace_resources` fica preservado para rollback.
- Subviews de cômodo, Câmeras, Roborock, Planta 3D e Music são divididas em chunks e carregadas sob demanda.
- O cold start deixa de aquecer indiscriminadamente backdrops de todas as seções.
- Assets JavaScript >= 1 KiB recebem irmãos `.br` e `.gz` frescos no mesmo build. O entry Vite mínimo pode ficar sem compressão porque possui apenas dezenas de bytes.
- `window.brunoStartup`/métricas de boot registram marcas de bootstrap e volume de resources vistos pelo navegador.

## Artefatos finais

Entrada ativa: `config/www/dashboard/bruno-dashboard.DtMPOD_j.js`.

O entry importa os módulos em `config/www/dashboard/chunks/`; por isso o deploy deve copiar a pasta `config/www/dashboard/` inteira, preservando a subpasta `chunks/` e os irmãos `.br/.gz` existentes.

Arquivos de configuração que também precisam acompanhar o teste físico:

- `config/configuration.yaml`
- `config/dashboards/ui-lovelace-main.yaml`
- `config/dashboards/shared/grid-cards/bento_comodos_matriz.yaml`
- `config/packages/active_player.yaml`
- `config/packages/home_activity.yaml`
- `config/www/dashboard/` (pasta inteira)

## Validação automática concluída

A pipeline da candidata concluiu com sucesso:

- TypeScript `tsc --noEmit`;
- ESLint;
- Vitest: 17 arquivos / 275 testes;
- build Vite com code splitting;
- compressão dos assets elegíveis;
- validação estrutural da candidata;
- verificação de sintaxe YAML.

O PR #602 deve permanecer em draft até o teste físico no Everex/iPhone.

## Teste físico obrigatório antes de merge

1. reiniciar o Home Assistant após copiar os arquivos;
2. cold load real pelo 5G e comparação subjetiva/cronológica com o comportamento anterior;
3. confirmar ausência de `Erro de configuração` na Home;
4. manter a TV ligada por alguns minutos e observar Sala/tile/Hub/card dinâmico;
5. confirmar artwork/título/source da Android TV durante reprodução;
6. testar ligar/desligar e o controle remoto;
7. testar Spotify play/pause/volume;
8. testar cortina, long-press e smoke test das câmeras ONVIF;
9. abrir Câmeras, Roborock, Planta 3D, Music e uma subview de cômodo para validar os chunks lazy.
