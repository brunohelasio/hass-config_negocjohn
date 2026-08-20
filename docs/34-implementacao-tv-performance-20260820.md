# 34 — Implementação integral TV + cold start remoto (2026-08-20)

## Base e rollback

Esta candidata é aplicada somente na branch `fix/mobile-runtime-tv-curtain-20260819`.
`main` permanece intacto. Ponto anterior desta rodada: `e4901bd71ea4e460098d1692423f497067cd051c`.

Os arquivos substituídos antes da transformação foram copiados para:
`_rollback/20260820-pre-full-candidate/`.

## TV

- `media_player.android_tv_192_168_3_17`: autoridade de energia, volume e power.
- `media_player.android_tv_192_168_3_17`: reprodução, fonte, título e artwork.
- `remote.atv`: controle remoto.
- `media_player.android_tv_192_168_3_17`: retirado das decisões ativas do dashboard; a integração ADB não é desabilitada nesta candidata.
- removidas as janelas de graça de 45 s dos caminhos ativos.
- power deixa de usar `homeassistant.toggle`; a direção passa a ser explícita.

## Cold start remoto

- as árvores globais `button_card_templates` e `streamline_templates`, fora do grafo da shell ativa, deixam de ser parseadas.
- `lovelace.resource_mode: yaml` carrega somente o núcleo da candidata; a lista anterior de `.storage/lovelace_resources` não é apagada.
- subviews de cômodo, Câmeras, Roborock, Planta 3D e Music são carregadas por chunks sob demanda.
- o cold start aquece somente o backdrop da seção atual, não todos os cômodos.
- cada JS gerado recebe `.br` e `.gz` frescos no mesmo build.
- `window.brunoStartup` registra marcas de bootstrap e número/bytes de resources vistos pelo browser.

## Rollback físico

Copiar de `_rollback/20260820-pre-full-candidate/` para os mesmos caminhos no Everex e reiniciar o Home Assistant. Para o frontend, restaurar também o bundle `bruno-dashboard.9t_Xp8gv.js` e seus irmãos `.br/.gz` e a `configuration.yaml` anterior. Como `.storage/lovelace_resources` não é alterado, voltar `resource_mode` restaura a lista antiga sem reconstruí-la.

## Teste físico obrigatório antes de merge

1. cold start real pelo 5G;
2. Home sem `Erro de configuração`;
3. TV ligada por pelo menos 5 minutos: tile/card/hub permanecem ligados mesmo se a entidade ADB oscilar;
4. power liga/desliga; controle remoto abre; artwork/título aparecem quando o Cast publica mídia;
5. Spotify play/pause/volume;
6. Sala/Office, câmeras ONVIF, cortina e long-press;
7. abrir Câmeras, Roborock, Planta 3D, Music e uma subview de cômodo para validar os chunks lazy.


## Decisão final da TV — Android preservada

A entidade ativa do dashboard permanece `media_player.android_tv_192_168_3_17` para estado, reprodução,
título, source, volume e artwork. Essa decisão é deliberada: a adoção da
entidade Android no painel ocorreu porque as entidades Smart TV Pro não
forneciam de forma suficiente a arte da mídia reproduzida. `remote.atv` é
mantido apenas como entidade de controle remoto (nome legado; não implica Apple
TV). As entidades Smart TV Pro continuam existindo no Home Assistant, mas não
participam desta candidata ativa.
