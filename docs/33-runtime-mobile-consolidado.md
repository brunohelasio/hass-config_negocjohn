# Runtime mobile consolidado — 2026-08-19

> **ATENÇÃO — DOCUMENTO HISTÓRICO.** O contrato de TV descrito originalmente nesta rodada foi superado pelas rodadas #602/#604. Para qualquer implementação atual, leia primeiro `docs/CHECKPOINT-ATUAL.md`. O contrato vigente é: power/status = `media_player.smart_tv_pro_2`; playback/source/title/artwork = `media_player.android_tv_192_168_3_17`; comandos físicos/volume = `remote.smart_tv_pro`; estabilidade transitória = `isTvPoweredStable`.

Esta rodada concluiu a direção arquitetural iniciada em `dashboard-src`: o dashboard ativo carrega um único bundle próprio no bootstrap, enquanto módulos JavaScript clássicos ainda necessários permanecem no repositório como fontes/rollback e são incorporados ao bundle pelo Vite.

## Contratos históricos desta rodada

- `main` continuava sendo a base validada até o teste físico daquela branch.
- A shell `bento-lab` era a navegação ativa; as cinco views Mobile V3 permaneciam no repositório, mas fora do runtime.
- **SUPERADO:** nesta data ainda se tratava `media_player.android_tv_192_168_3_17` como autoridade única de energia/reprodução e `remote.atv` como controle. Não reutilizar esse contrato. Ver checkpoint atual.
- Energia de TV e reprodução são conceitos distintos. OFF transitório pode receber uma janela curta de estabilidade; `unknown` e `unavailable` não são mascarados.
- Volume, source, título e artwork válidos não devem desaparecer por um frame quando a entidade de mídia omite temporariamente atributos.
- A cortina não pode concluir visualmente 0%/100% antes do tempo proporcional de percurso quando o dispositivo publica o alvo antecipadamente.
- O ajuste de long-press do iPhone permanece preservado.
- Câmeras não receberam novas alterações nesta rodada; os IDs ONVIF canônicos permaneciam o contrato.

## Performance

A otimização desta rodada atacou fan-out de requisições, não apenas tamanho transferido. Os módulos próprios ainda usados foram incorporados ao bundle Vite único. Os arquivos `.br`/`.gz` existentes no Everex não eram removidos nesta fase; o novo bundle usava outro hash e recebia seus próprios irmãos comprimidos.

## Continuidade

Este arquivo deve ser usado como histórico da consolidação de 2026-08-19, não como checkpoint corrente. Para retomar desenvolvimento, use `docs/CHECKPOINT-ATUAL.md` e a documentação da rodada indicada nele.
