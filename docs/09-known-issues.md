# 09 — Problemas conhecidos

Extraído de `CLAUDE.md` (2026-03 a 2026-08) e da auditoria de 2026-08-02.
Fecha quando houver correção **validada no tablet**.

## Abertos — arquitetura

| # | Problema | Evidência |
|---|---|---|
| **A1** | As 6 subviews de cômodo são cópias (88–97% idênticas). Todo ajuste visual é feito 6 vezes; um erro de digitação derruba as 6 de uma vez | 52.864 linhas |
| **A2** | Re-render total do DOM a cada atualização do `hass`, em ~30 cards, sem comparar nada | `set hass → _render() → innerHTML =` |
| **A3** | 316 `addEventListener` contra 62 `removeEventListener`; 9 arquivos com listener/timer e sem `disconnectedCallback` | varredura |
| **A4** | Dependências entre módulos declaradas **só** pela ordem das linhas em `extra_module_url`; consumo por `?.` esconde a falha | 0 `import`, 18 globais |
| **A5** | 6.210 px fixos e 157 media queries calibradas num aparelho — trocar de tablet desorganiza o layout | ver `07` |
| **A6** | A mesma entidade repetida em card, subview, package e YAML | ver `05` |
| **A7** | Cache-bust manual por arquivo, em 8 formatos de data. Esquecer um deixa o tablet com módulo velho conversando com globais novos | 52 recursos |

## Abertos — funcionais

| # | Problema | Nota |
|---|---|---|
| **P1** | Espaçamento lateral dos botões no popup da Sala grande demais. `gap`, `padding` e `margin` não resolveram — o grid do HA parece impor mínimo | herdado |
| **P2** | Botões do controle remoto da TV (`smart_tv_remote.yaml`) não funcionam. Layout e `remote.send_command` montados, falta depurar | herdado |
| **P4** | `hold_action` do A/C que abre o popup do termostato dá erro de configuração | herdado |
| **F3.1** | Subviews de cômodo no celular: empilham, mas "desconfiguram" | precisa layout próprio |
| **F3.2** | Subview do Roborock concebida em paisagem, não adapta ao celular | — |
| **F3.3** | Planta 3D "não está funcionando" no celular | precisa diagnóstico ao vivo |
| **F3.5** | Hero fica em "Atualizando agenda" no celular | verificar o fetch |
| **O1** | `/local/images/office_pc.png` não existe; há fallback gracioso | subir o asset |
| **O2** | Entidades de temperatura/umidade do Office: a config lista 5 candidatos por sensor | confirmar no HA |
| **O3** | Cortina do Office: dock idêntico ao da Sala, porém inerte | mapear entidade quando houver |

## Abertos — hardware / rede Zigbee

| # | Problema | Nota |
|---|---|---|
| **S2** | LQI fraco: sala 29, cozinha 29, marina 21, miguel 47 (office 149). Recomendado adicionar um roteador Zigbee (tomada) na ala quartos/cozinha | |
| **S3** | Q. Marina rejeita gravação de parâmetros, presença travada em `true`, `motion_state` `large` fantasma. Protocolo: factory reset + re-parear **na posição final e na alimentação definitiva**, calibrar logo após o join. Se persistir, trocar pela unidade do Q. Casal | defeito conhecido do modelo |
| **S4** | Q. Miguel: o PIR detecta passagem pelo corredor através da porta aberta. Limite de distância por software **não se aplica a PIR** — corrigir reposicionando/angulando. Restrição física: o sensor divide a fonte USB com a câmera | mitigações: cabo USB mais longo, fita na lateral da lente |

## Abertos — tablet

| # | Problema | Nota |
|---|---|---|
| **T1** | Transições, áudio e resposta tátil não funcionam bem. Causa não diagnosticada — a hipótese mais provável é elemento recriado a cada render (consequência de A2) | ver `08` |
| **T2** | Câmeras: o dashboard oficial do HA exibe em tempo real; este depende de atualização intervalada em alguns pontos | subviews já usam `hui-image` |
| **T3** | Custo de `backdrop-filter` nunca medido. O `CLAUDE.md` registra o blur entrando e saindo três vezes por impressão visual (rev. 9 → 12) | medir antes de mexer |
| **T4** | Auto-switch de câmera por movimento inativo: `camera.* = recording` é estado operacional persistente da Tuya, não evento. Resolvido pela ponte MQTT, mas o comportamento precisa de validação | ver `05` |

## Resolvidos

| # | Problema | Solução |
|---|---|---|
| P3 | Spotify não ligava sem dispositivo ativo | `spotifyplus.player_media_play_pause` com `device_name` por cômodo |
| P5 | Botão do A/C não ficava branco quando ligado | `tpl_popup_climate` com `state_on` correto para `climate` |
| P6 | Q. Miguel: botão do grid não acendia | grupo recriado no HA + `triggers_update` |
| P7 | Toggle não atualizava visualmente | toggle CSS + `triggers_update` com a entidade do grupo |
| P8 | Botões esticavam em popups de 3 colunas | `justify-content: start` + coluna `auto` |
| P12 | Bloco Security sem função útil | Front Door corrigido, popup de câmeras, placeholders |
| — | Ocupação presa em ON com o A/C ligado | trava de contexto (self-latch) **removida** dos 6 packages |
| — | Ponto de presença demorava a apagar | ponto passou a ler **só** `motion_recent` |
| — | Texto "Ocupado" sem o ponto aceso | texto passou a exigir ocupação **E** presença ativa |
| — | Popups não redimensionavam no tema tablet | bloco `uix-dialog` adicionado ao `tablet.yaml` |
| — | `ButtonCardError` em câmeras e mídia | entidades europeias do `ngocjohn` substituídas |
| — | Assets consumindo 64,3 MB de bitmap | redimensionados para 9,6 MB (Fase 6.1) |
| — | Dashboard "Teste HomeKit" apontando para arquivo inexistente | removido |

## Notas de rede (2026-07-04)

Availability habilitada no Zigbee2MQTT (passive 180 min) — estados congelados
passam a virar `unavailable` em vez de "presença eterna". Canal Zigbee 25
(ideal). **Canal Wi-Fi ainda não verificado.**
