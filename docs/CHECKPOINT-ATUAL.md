# CHECKPOINT ATUAL — LEITURA OBRIGATÓRIA

Atualizado em **2026-08-22**. Este documento é a primeira fonte de continuidade operacional do projeto.

> **REGRA ZERO PARA QUALQUER IA/CHAT NOVO:** antes de diagnosticar, propor branch, escrever código, orientar GitHub Desktop ou indicar arquivos para o Everex, leia este arquivo e depois `docs/LEIA-PRIMEIRO.md`. Não reconstrua o estado apenas pela lista de PRs nem apenas pela memória do chat.

## Fonte de verdade e fluxo

- Repositório: `brunohelasio/hass-config_negocjohn`.
- `main` permanece intacto enquanto uma candidata não for validada fisicamente.
- Modos de execução: **MODO MANUAL**, **MODO CHAT-GITHUB**, **MODO AGENTE**; preferir sempre menor custo e menor risco.
- Em MODO CHAT-GITHUB, usar branch candidata, validar automaticamente, manter PR draft e **não mergear antes do aceite no Everex/iPhone**.
- Ao final de TODA rodada, informar: **branch**, **head**, **bundle ativo**, **estado dos testes** e **lista exata do que copiar para o Everex**.
- Toda implementação relevante deve atualizar este checkpoint e a documentação correspondente em `docs/`; não depender da memória de uma conversa.

## Definition of Done — uma rodada só termina Everex-ready

Este requisito é obrigatório e foi reforçado pelo usuário em 2026-08-22 após recorrência do mesmo problema operacional.

- **Não encerrar uma rodada no estado intermediário** “fonte alterada, mas ainda falta build/teste/bundle/cache-bust”.
- Não apresentar um resumo de implementação como se fosse entrega final enquanto ainda existir qualquer etapa necessária antes da cópia ao Everex.
- Se uma etapa técnica ainda estiver pendente, **continue executando-a na mesma rodada**; não transfira a pendência ao usuário como conclusão.
- A resposta final da rodada só deve ser emitida quando a candidata estiver **Everex-ready**, isto é:
  1. implementação funcional consolidada na branch correta;
  2. documentação/checkpoint atualizados;
  3. validações automáticas previstas executadas e resultado conhecido;
  4. build Vite concluído quando o runtime compilado for afetado;
  5. `manifest.json`, bundle com hash, compressões e `configuration.yaml` coerentes entre si;
  6. branch/PR funcional apontando para o estado final da rodada;
  7. pacote exato de arquivos a copiar para `/config` do Everex definido;
  8. instruções de cache/restart/reload e rollback prontas.
- **“Não copie para o Everex ainda” não é uma entrega final aceitável** quando a própria IA ainda tem etapas de implementação/build que pode e deve concluir.
- Exceção: somente um bloqueio externo real e não contornável (por exemplo, credencial/serviço indisponível ou informação que só existe no HA físico) pode impedir o Everex-ready; nesse caso o bloqueio deve ser identificado assim que surgir, não apenas depois de uma longa rodada.
- A validação física no Everex/iPhone continua sendo posterior e continua bloqueando o merge para `main`; **Everex-ready não significa validado fisicamente nem mergeado**.

## Cadeia vigente

1. **#602 — `fix/mobile-runtime-tv-curtain-20260819`**: runtime mobile/TV/Hub/Spotify/cortina validado fisicamente.
2. **#604 — `feat/mobile-runtime-v3-20260821`**: candidata V3 construída sobre #602; assets V3 e round4 visual/semântico.
3. **#606 — `feat/mobile-runtime-v3-hemma-josh-lavabo-20260822`**: candidata funcional atual, construída sobre #604. Inclui Hemma, clima do Lavabo e Josh ON round2. **Não mergear antes da validação física.**

## Última candidata Everex-ready — 2026-08-22

- PR funcional: **#606**.
- Branch: `feat/mobile-runtime-v3-hemma-josh-lavabo-20260822`.
- Commit que materializou e publicou o runtime: `fe1e870e85843bce33110ff5fc902a8f3c098340`.
- Bundle ativo: `bruno-dashboard.DS0_M01T.js`.
- Main chunk: `chunks/main.D0kWSwW_.js`.
- `manifest.json` aponta para `bruno-dashboard.DS0_M01T.js`.
- `config/configuration.yaml` aponta para `/local/dashboard/bruno-dashboard.DS0_M01T.js`.
- Rollback imediato de bundle: `bruno-dashboard.DDPR7KRw.js`.
- Validação automática: npm ci, 248 YAMLs, guard de crases, TypeScript, ESLint, **17 arquivos / 277 testes Vitest**, Vite (75 módulos), manifesto, compressão de 6 assets e guard de escopo — todos aprovados.
- Pacote Everex desta rodada: `config/configuration.yaml` + **todo o diretório** `config/www/dashboard/`.
- Não copiar nesta rodada: `dashboard-src/`, `docs/`, `scripts/`, `.pnpm-store/`, `_rollback/` ou assets V3.

## Contratos que NÃO podem regredir

- TV Sala — power/status: `media_player.smart_tv_pro_2` + `TV_POWER_ON_STATES`.
- TV Sala — playback/source/title/artwork: `media_player.android_tv_192_168_3_17`.
- Comandos físicos/volume da TV: `remote.smart_tv_pro`.
- Preservar `isTvPoweredStable`; não voltar a misturar power e playback.
- Office PC dot: autoridade exclusiva `binary_sensor.office_pc_active`; não voltar a usar sessão HASS.Agent congelada nem `switch.macbook` como autoridade do dot.
- Hub: preservar último poster/artwork válido quando atributos chegam vazios; volume da TV por comandos do remote.
- Cortina: preservar mecanismo/estimador já validado; calibração fina é assunto separado.
- Câmeras: não alterar IDs/streaming nesta cadeia sem demanda específica.
- Não presumir Apple TV; `media_player.atv` não é contrato do projeto.

## Lavabo — hardware e entidades

- Presença/luminância e temperatura/umidade são **dois dispositivos físicos diferentes**.
- O sensor PIR/luminância do Lavabo é do mesmo tipo/arranjo usado no Corredor.
- O sensor separado de temperatura/umidade do Lavabo é o antigo sensor que ficava no Office antes da chegada dos sensores 4-em-1.
- Mapeamento candidato: `sensor.office_temp_humid_temperature` e `sensor.office_temp_humid_humidity`.
- A confirmação final desse mapeamento é no HA real; não inventar novos `entity_id` sem evidência.

## Josh — contrato visual por breakpoint

### Tablet/desktop (>800px)

- Cômodos são **tiles**, não cards.
- Não criar cartela, raio de card ou blur próprio da tile.
- ON = PNG aceso + texto + filete inferior quente + glow inferior.
- O veil/wash leitoso foi **reprovado fisicamente em 2026-08-22** porque continuou desenhando um retângulo perceptível.
- Round2 final: `.room-card.is-tile.is-room-on::before` não desenha superfície (`background: none; opacity: 0`).

### Phone (<=800px)

- Cômodos permanecem **cards Josh**.
- OFF permanece Josh.
- Somente o material visual ON reproduz a receita canônica `bruno-liquid-surface-on-*` do Liquid Glass: `background`, `filter/blur`, `border-color`, `shadow`, `sheen` e `sheen-opacity`.
- **Não alterar raio, semântica, lógica de estado, gestos, assets ou layout.**
- Não criar receita “parecida”. Os valores visuais devem vir literalmente da implementação Liquid Glass vigente.
- Round2 final: `bruno-room-tile.ts` consome tokens `--bruno-josh-room-on-*`; `bruno-josh.js` resolve esses tokens diretamente dos `bruno-liquid-surface-on-*` do Liquid Glass.
- O bridge anterior fica **inerte** (`export {}`): não existe `MutationObserver`, monkey-patch de `connectedCallback` nem segunda camada de CSS no Shadow DOM.

## Tema Hemma

- `Hemma` substitui `Liquid Glass - iOS` no seletor da #606.
- Implementação: `config/www/bruno-ui/core/bruno-hemma.js`, incorporada ao bundle.
- `bruno-liquid-glass-ios.js` permanece no repositório apenas para rollback e fica fora do runtime ativo da candidata.

## `.pnpm-store` — NÃO MEXER

- GitHub Desktop pode mostrar dezenas de arquivos locais sob `.pnpm-store/...`.
- Esse problema já foi investigado em rodadas anteriores; tentativas de remover/ignorar não resolveram satisfatoriamente.
- Decisão do usuário: **deixar esse ruído local quieto**.
- Não pedir para descartar, apagar, commitar, adicionar ao `.gitignore` nem repetir a investigação, salvo pedido explícito do usuário.
- Esses arquivos nunca entram no pacote do Everex.

## Publicação / Everex

- GitHub/branch candidata é a fonte da implementação; não pedir commit local para aplicar mudanças feitas via Chat-GitHub.
- O pacote exato de cópia deve ser calculado ao final de cada rodada.
- Não mandar copiar `dashboard-src`, `.pnpm-store`, `scripts` ou `_rollback` para o Everex.
- Bundle Vite com hash + `configuration.yaml` fazem o cache-bust.
- `config/www/bruno-ui/assets/v3/` só precisa ser recopiado quando mudar ou quando o Everex ainda não tiver a V3 correspondente.

## Estado da validação física — 2026-08-22

- Runtime/V3 base: preservado.
- Tablet Josh ON da candidata anterior: **REPROVADO visualmente** — veil retangular ainda perceptível.
- Phone Josh ON da candidata anterior: **REPROVADO visualmente** — material não reproduziu o Liquid Glass; o clareamento continuou concentrado próximo ao PNG.
- Round2 final: **Everex-ready, ainda não validado fisicamente** — tablet sem veil; phone usando a autoridade visual canônica do Liquid Glass, sem bridge ativo.
- Lavabo temperatura/umidade: ainda requer confirmação no HA real.

## Rodada de ajustes gerais — 2026-08-23 (LOCAL + Everex, remoto intacto)

- Branch local de trabalho: `local/ajustes-gerais-20260823`, a partir de
  `fix/home-mobile-v4-clean` (SHA `08066375`).
- **GitHub remoto NAO foi alterado nesta rodada**: sem push, PR, merge ou
  escrita via API. A candidata vive em LOCAL + Everex ate a validacao fisica.
- Bundle ativo: **`bruno-dashboard.DB1sivd6.js`**. Anterior a rodada:
  `bruno-dashboard.DJf5VDPn.js`. Por bloco: 1 `CKib2awp`, 2 `WRycymXp`,
  3 `DB1sivd6`.
- `manifest.json` e `config/configuration.yaml` apontam para `DB1sivd6`.
- Pacote Everex: `config/configuration.yaml` + todo o diretorio
  `config/www/dashboard/` + os EXTRAS declarados em `dashboard-src/scripts/deploy.mjs`.
- Validacao automatica: YAML (nenhum erro), detector de crase nos fontes
  alterados, TypeScript, ESLint, 277 testes Vitest, Vite build, manifesto e
  compressao — todos aprovados.
- Itens: A1..A5, B1..B4, B6..B8, C1..C3 implementados; **B5 nao alterado**
  por ausencia de margem segura. Detalhe em `docs/39-ajustes-gerais-20260823.md`.
- `materialize:remote` do `npm run build` exige Python, ausente nesta maquina;
  o gerador ja esta materializado (marcador `round6` presente na fonte) e sai
  sem fazer nada, entao as demais etapas do gate foram executadas diretamente.
- ACHADO FORA DO ESCOPO, nao corrigido: `dashboard-src/scripts/deploy.mjs`
  falha com EPERM ao copiar `config/www/dashboard/chunks` (trata diretorio
  como arquivo).

## Ordem obrigatória de continuidade

1. `docs/CHECKPOINT-ATUAL.md`
2. `docs/LEIA-PRIMEIRO.md`
3. `docs/16-ai-working-guide.md`
4. `docs/38-v3-josh-hemma-lavabo-20260822.md`
5. `docs/15-decisions-log.md` quando houver consequência arquitetural
6. `docs/11-failed-experiments.md` antes de repetir uma solução antiga

Em caso de conflito, **este checkpoint + código da branch candidata + PR funcional atual prevalecem sobre documentos históricos**.

---

## Atualização operacional — Home mobile sem reacomodação inicial (2026-08-25)

- Branch local: `local/ajustes-gerais-20260823`; HEAD de base `b8531f29`, com
  alterações ainda sem commit por decisão da rodada.
- Novo bundle local: **`bruno-dashboard.hpd0Vfwq.js`**; main chunk
  `chunks/main.Da31I_xT.js`.
- Rollback imediato de bundle: `bruno-dashboard.B7kOYusv.js`, preservado em
  comentário em `config/configuration.yaml`.
- Causa corrigida: o Hero mobile iniciava em 182 px e recebia depois um patch
  tardio para altura automática; a medição do bloco estático capturava o estado
  intermediário. O piso `min-content` da tentativa seguinte apenas deslocava a
  compressão para Cozinha/Lavabo.
- Solução: geometria final do Hero no CSS nativo mobile desde o primeiro quadro,
  injeção tardia do Hero desativada e linha estática restaurada a
  `minmax(0, 1fr)`.
- Tablet 1920x1200/Josh medido e aprovado sem alteração: oito itens na rail,
  layout em duas colunas e nenhum DOM mobile visível.
- Gates locais aprovados: TypeScript, ESLint, 277 testes, Vite, manifesto,
  compressão, YAML e detector de crases direcionado aos fontes alterados.
- Everex sincronizado: 31/31 arquivos conferidos por SHA-256 e sete módulos
  alcançáveis sem chunk ausente. `manifest.json` e `configuration.yaml` remotos
  apontam para `bruno-dashboard.hpd0Vfwq.js`. Reinício do HA pendente por falta
  de uma sessão autenticada disponível no navegador desta rodada.
- Snapshot de rollback pré-publicação:
  `tmp/everex-preflight-20260825-home-phone-first-paint/`.
- Detalhes completos em `docs/39-ajustes-gerais-20260823.md`, seção
  "HOME MOBILE — PRIMEIRO QUADRO ESTÁVEL".
