# 36 — Controle remoto premium VisionOS

"
    "Baseline preservado: round4 com 5G significativamente melhor, TV/Hub estáveis, card dinâmico funcional, artwork/volume corrigidos.

"
    "## Decisão visual
"
    "O popup continua usando `browser_mod.popup` + `universal-remote-card`; não foi criado um segundo motor de controle. A mudança é exclusivamente de composição visual.

"
    "O material principal reutiliza a mesma receita das bottom sheets VisionOS do telefone: radial highlight, gradiente translúcido e `blur(20px) saturate(1.18) brightness(1.03)`. Os botões evitam blur individual e animações contínuas para não reabrir o custo de repaint no iPhone.

"
    "## Hierarquia
"
    "1. Power / Entrada / Menu.
"
    "2. D-pad circular grande com centro OK.
"
    "3. Voltar / Início / Mudo.
"
    "4. Volume - / Volume + / Canal - / Canal +.

"
    "## Funcionalidade
"
    "Todos os comandos permanecem em `remote.smart_tv_pro` via `remote.send_command`. D-pad, volume e canais preservam repetição por hold.

"
    "## Rollback
"
    "Estado imediatamente anterior: `_rollback/20260820-pre-premium-tv-remote/`. O rollback inclui o source do room-subview, `configuration.yaml` e a pasta `config/www/dashboard/` da round4.
"
    