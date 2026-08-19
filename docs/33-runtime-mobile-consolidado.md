# Runtime mobile consolidado — 2026-08-19

Esta rodada conclui a direção arquitetural iniciada em `dashboard-src`: o dashboard ativo deve carregar um único bundle próprio no bootstrap, enquanto os módulos JavaScript clássicos ainda necessários permanecem no repositório como fontes/rollback e são incorporados ao bundle pelo Vite.

## Contratos

- `main` continua sendo a base validada até o teste físico desta branch.
- A shell `bento-lab` é a navegação ativa; as cinco views Mobile V3 permanecem no repositório, mas fora do runtime.
- TV da Sala: `media_player.android_tv_192_168_3_17` é a única autoridade de energia/reprodução. `remote.atv` continua somente como controle remoto. `media_player.atv` não existe e não participa do modelo.
- Energia de TV e reprodução são conceitos distintos. OFF transitório pode receber uma janela curta de estabilidade; `unknown` e `unavailable` não são mascarados.
- Volume, source, título e artwork válidos não devem desaparecer por um frame quando a entidade ADB omite temporariamente atributos.
- A cortina não pode concluir visualmente 0%/100% antes do tempo proporcional de percurso quando o dispositivo publica o alvo antecipadamente.
- O ajuste de long-press do iPhone permanece preservado.
- Câmeras não recebem novas alterações nesta rodada; os IDs ONVIF canônicos permanecem o contrato.

## Performance

A otimização desta rodada ataca fan-out de requisições, não apenas tamanho transferido. Os módulos próprios ainda usados são incorporados ao bundle Vite único. Os arquivos `.br`/`.gz` existentes no Everex não são removidos nesta fase; o novo bundle usa outro hash e recebe seus próprios irmãos comprimidos.
