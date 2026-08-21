# 37 — Controle remoto premium round6

Refinamento visual solicitado após validação física da round5. A funcionalidade permanece intacta.

## Ajustes
- centro do D-pad passa a ser círculo real, com host e botão em `aspect-ratio: 1 / 1`;
- D-pad recebe quatro filetes diagonais translúcidos para separar UP/RIGHT/DOWN/LEFT;
- barras Power/Entrada/Menu, Voltar/Início/Mudo e Volume/Canal recebem divisores translúcidos curtos;
- popup usa `--dialog-surface-margin-top: auto` e margem horizontal automática para centralização no mobile;
- material VisionOS, comandos, hold/repeat e arquitetura da TV permanecem inalterados.

## Implementação
A round6 continua usando `browser_mod.popup` + `universal-remote-card` + `remote.send_command`. Não foi criado um novo motor de controle.

A centralização vertical usa o mecanismo atual do Browser Mod/HA (`--dialog-surface-margin-top: auto`) e a centralização interna/horizontal permanece no próprio card.

## Validação automática
- TypeScript: OK;
- ESLint: OK;
- Vitest: 17 arquivos / 275 testes: OK;
- Vite/code splitting: OK;
- compressão: OK;
- validação estrutural da candidata: OK;
- YAML: OK;
- commit/push da candidata gerada: OK.

## Candidata validada
- head gerado: `a00b8ee494fe9dd45b79c5adc1e7893bf5e9fc50`;
- bundle: `bruno-dashboard.CAlKI3vO.js`.

## Instalação mínima sobre a round5
- `config/configuration.yaml`;
- `config/www/dashboard/` inteira, incluindo `chunks/`, `manifest.json` e `.br/.gz`.

## Rollback
Estado imediatamente anterior em `_rollback/20260821-pre-premium-tv-remote-round6/`.
