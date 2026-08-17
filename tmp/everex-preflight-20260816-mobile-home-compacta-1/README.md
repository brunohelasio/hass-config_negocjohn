# Rollback — Home mobile compacta 1

Snapshot criado antes da rodada de 2026-08-16. O escopo da rodada é exclusivo
do telefone (`max-width: 800px`). A VM abandonada não participa deste rollback.

## Conteúdo

- `local-before/`: cópia dos arquivos locais antes da rodada;
- `everex-before/`: cópia dos arquivos que estavam no Everex antes da publicação;
- `baseline-sha256.txt`: hashes usados para confirmar a igualdade inicial.

## Restaurar o Everex

Copiar, nesta ordem, os arquivos de `everex-before/` para
`\\192.168.3.154\config`, mantendo os mesmos caminhos relativos:

1. `dashboards/shared/grid-cards/bento_comodos_matriz.yaml`;
2. `www/bruno-ui/cards/bruno-activity-column.js`;
3. `www/bruno-ui/cards/bruno-hero-card.js`;
4. `www/bruno-ui/cards/bruno-top-badges-card.js`;
5. `configuration.yaml` por último.

Depois, comparar SHA-256 dos cinco pares. A ativação no Home Assistant exige
reinício e recarga forçada do aplicativo/WebView.

## Restaurar a pasta local

Usar os arquivos equivalentes de `local-before/`, preservando quaisquer outras
alterações do worktree. Não usar `git reset`, não restaurar o diretório inteiro
e não tocar na VM.
