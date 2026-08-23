# 39 — Ajustes gerais do dashboard (2026-08-23)

Rodada de implementação controlada, três blocos, itens A/B/C fechados no
prompt. Escopo estrito: nenhum ajuste fora dos itens listados.

## Estado

- Branch local de trabalho: `local/ajustes-gerais-20260823` (a partir de
  `fix/home-mobile-v4-clean`, SHA `08066375`).
- **Remoto NÃO alterado**: sem push, sem PR, sem merge.
- Bundle final: `bruno-dashboard.DB1sivd6.js`.
- LOCAL + Everex sincronizados; validação física pendente.

## Resultado por item

| Item | Status | Causa confirmada |
|---|---|---|
| A1 | implementado | timeout cego pós-Stop + prioridades opostas entre subview e barra |
| A2 | implementado | `loading="lazy"` + ausência de recuperação de erro |
| A3 | implementado | renderer ignorava `tvApps[].image` |
| A4 | implementado | contagem por entidade, não por sessão física; `tone-gray` |
| A5 | implementado | raio do arco em 315 |
| B1 | implementado | `.mh-left` como coluna flex confinada |
| B2 | implementado | `.mh-btn-row-5` só existia escopado a office/cozinha |
| B3 | implementado | não havia abertura automática no tablet |
| B4 | implementado | `min-height` da `.light-cell` |
| B5 | **NÃO ALTERADO** | margem residual de 2,5px/tile — insuficiente |
| B6 | implementado | uma única vinheta de perímetro para duas responsabilidades |
| B7 | implementado | ícone base do hero V2 em 23px |
| C1 | implementado | material zerado por decisão anterior |
| C2 | implementado | **filete real**: `border-bottom` ligando no cabeçalho da câmera |
| C3 | implementado | linha automática + aviso condicional |

## C2 — a medição que decidiu

Banco: `scripts/harness/gen-shell-harness.mjs`, 428x926, tema Josh forçado,
animações neutralizadas (a aba oculta não progride transições).

ANTES da correção:

| linha | cameraTop | cameraH | resumoTop | scrollTop |
|---|---|---|---|---|
| luzes | 0 | **+1,00** | +1,00 | 0 |
| midia | 0 | 0 | 0 | 0 |
| ac | 0 | **+1,00** | +1,00 | 0 |

Mídia zerada prova que `_capturarBaseFolha`/`_restaurarBaseFolha` funciona: não
era lifecycle nem ancoragem. Descendo um nível, o crescimento estava no primeiro
row do grid da câmera (48,3125 → 49,3125px) e a propriedade que mudou foi
`border-bottom-width: 0px → 1px` em `.mh-head.cameras-head`.

Causa: a regra do filete usava `.mh-head` puro. O cabeçalho da câmera também tem
essa classe. A folha de mídia não apresentava o defeito porque a regra de
`[data-folha='midia']` mais abaixo zera essa borda; luzes e ac não tinham
equivalente. **Mesma família do defeito de 2026-08-15**, quando
`.camera-settings-button` foi capturado por regra não escopada do Hub.

Correção: `:not(.cameras-head)` no seletor do filete.

DEPOIS: 0 em cameraTop, cameraH, headH, resumoTop e scrollTop nas três folhas.

Nenhuma instrumentação entrou em arquivo — foi toda no console do banco.

## B5 — por que não alterar

Tokens do Josh: 8 tracks `1fr`, `bruno-tile-gap: 0px`,
`bruno-tile-grid-inset-start: 8px`, `bruno-tile-grid-inset-end: 12px`,
`bruno-strip-bleed-start: 10px`, `bruno-strip-bleed-end: 12px`.

Eliminar TODO o inset renderia 20px divididos por 8 tiles = **2,5px por tile**
(~1,1% de um tile de ~218px), e colaria o primeiro tile na rail e o último na
borda do viewport. Não há margem segura. **Nenhuma mudança foi feita em B5.**

## Achado fora do escopo — NÃO ALTERADO

`dashboard-src/scripts/deploy.mjs` falha com `EPERM` ao copiar
`config/www/dashboard/chunks` — trata o diretório como arquivo (linha ~80).
Impacto: `npm run deploy:everex` não conclui. A sincronização desta rodada foi
feita com a mesma semântica do script (dist recursivo + EXTRAS), conferida por
hash. **Não corrigido** por estar fora do escopo autorizado.

## Rollback

Cada item tem commit local próprio com marcador `ANTERIOR (rollback ...)` no
código. Rollback completo de qualquer item exige, além do `git revert`:

1. `npx vite build && npm run manifesto && npm run compress` em `dashboard-src/`;
2. voltar o ponteiro em `config/configuration.yaml` (o anterior está comentado
   ao lado);
3. recopiar `config/www/dashboard/` + `configuration.yaml` para o Everex.

Bundles por bloco: bloco 1 `CKib2awp`, bloco 2 `WRycymXp`, bloco 3 `DB1sivd6`.
Anterior à rodada: `DJf5VDPn`.
