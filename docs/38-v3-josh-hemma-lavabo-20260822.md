# V3 — Josh, Hemma e Lavabo — 2026-08-22

## Contexto

A PR #606 é filha direta da #604 e preserva o runtime validado da #602. Esta documentação registra a rodada Hemma/Lavabo e a correção visual Josh round2 feita após a primeira validação física no Everex/iPhone.

## Resultado da primeira validação física do Josh

### Tablet/desktop

A primeira candidata manteve um wash leitoso no estado ON. Mesmo com gradientes radiais, a superfície continuou sendo percebida como um retângulo/quadrado dentro da faixa de tiles.

**Decisão final:** abandonar o wash no tablet. A tile continua sem cartela e o feedback ON fica no PNG aceso, texto, filete inferior quente e glow inferior.

### Phone

A primeira candidata também não reproduziu visualmente o ON do Liquid Glass. O clareamento continuou concentrado perto do PNG, apesar de os valores de CSS terem sido copiados para um bridge.

A causa encontrada foi a duplicação de autoridade visual: `bruno-room-tile.ts` mantinha uma receita Josh ON própria e o bridge tentava empilhar outra folha dentro do Shadow DOM. A primeira implementação do bridge ainda dependia de monkey-patch tardio de `connectedCallback`, o que tornava a aplicação inconsistente.

**Decisão final round2:** retirar a duplicação. O estado ON do phone permanece estruturalmente Josh, mas `bruno-room-tile.ts` passa a consumir tokens namespaced definidos por `bruno-josh.js`; esses tokens são resolvidos diretamente a partir dos `bruno-liquid-surface-on-*` canônicos do Liquid Glass. O bridge antigo fica inerte (`export {}`), sem `MutationObserver`, sem monkey-patch de lifecycle e sem segunda camada CSS.

Os tokens copiados são somente os visuais:

- background;
- filter/blur/saturate/brightness;
- border-color;
- shadow;
- sheen;
- sheen-opacity.

Não foram alterados raio Josh, semântica, lógica ON/OFF, gestos, layout, entidades nem assets.

## Implementação round2

### Tablet/desktop (>800px)

Em `dashboard-src/src/components/rooms/bruno-room-tile.ts`:

- `.room-card.is-tile.is-room-on::before` passa a `background: none` e `opacity: 0`;
- o filete inferior ON foi reforçado;
- o glow inferior continua radial e termina em transparente;
- continuam válidas as escalas V3 já aprovadas.

### Phone (<=800px)

Em `dashboard-src/src/components/rooms/bruno-room-tile.ts`, o ON usa:

- `--bruno-josh-room-on-background`;
- `--bruno-josh-room-on-filter`;
- `--bruno-josh-room-on-border-color`;
- `--bruno-josh-room-on-shadow`;
- `--bruno-josh-room-on-sheen`;
- `--bruno-josh-room-on-sheen-opacity`.

Em `config/www/bruno-ui/core/bruno-josh.js`, esses tokens são resolvidos da implementação Liquid Glass vigente (`bruno-liquid-surface-on-*`), com os próprios valores canônicos como fallback determinístico.

`dashboard-src/src/themes/josh-phone-on-bridge.ts` permanece somente como registro/rollback e não injeta estilos.

## Lavabo

O Lavabo possui dois dispositivos físicos distintos:

- PIR/luminância;
- temperatura/umidade.

O sensor de temperatura/umidade é o antigo sensor separado do Office, transferido para o Lavabo quando o Office recebeu sensores 4-em-1. A candidata usa:

- `sensor.office_temp_humid_temperature`;
- `sensor.office_temp_humid_humidity`.

A confirmação final continua sendo feita no HA real.

## Hemma

`Hemma` substitui `Liquid Glass - iOS` no Theme Manager da candidata. O tema foi portado do YAML para `config/www/bruno-ui/core/bruno-hemma.js`, mantendo os elementos visuais compatíveis com o contrato Bruno e deixando o arquivo antigo de Liquid Glass iOS apenas para rollback.

## Validação automática final

Execução completa em GitHub Actions sobre a branch funcional atual:

- `npm ci`: passou;
- YAML: **248 arquivos**, nenhum erro de sintaxe;
- guard de crases: **6 fontes**, nenhum caso perigoso;
- TypeScript: passou;
- ESLint: passou;
- Vitest: **17 arquivos / 277 testes**, todos passaram;
- Vite production build: **75 módulos**, passou;
- manifesto: passou;
- compressão: **6 assets**, passou;
- guard de escopo pós-build: passou;
- publicação do bundle na branch: passou.

## Candidata Everex-ready

- PR funcional: **#606**;
- branch: `feat/mobile-runtime-v3-hemma-josh-lavabo-20260822`;
- commit de build: `fe1e870e85843bce33110ff5fc902a8f3c098340`;
- bundle: `bruno-dashboard.DS0_M01T.js`;
- main chunk: `chunks/main.D0kWSwW_.js`;
- manifesto: `config/www/dashboard/manifest.json`;
- cache-bust ativo em `config/configuration.yaml`: `/local/dashboard/bruno-dashboard.DS0_M01T.js`;
- rollback imediato: `bruno-dashboard.DDPR7KRw.js`.

### Pacote para o Everex

Nesta rodada, copiar apenas:

1. `config/configuration.yaml` → `/config/configuration.yaml`;
2. **todo o conteúdo** de `config/www/dashboard/` → `/config/www/dashboard/`, substituindo o diretório correspondente.

Não copiar nesta rodada: `dashboard-src/`, `docs/`, `scripts/`, `.pnpm-store/` ou `config/www/bruno-ui/assets/v3/`.

## Validação física esperada

- Tablet: Office ON sem retângulo/veil; nenhuma cartela nova; leitura ON por PNG + texto + filete/glow inferior.
- Phone Josh: OFF idêntico; ON com material visual do Liquid Glass e o mesmo raio/estrutura Josh.
- Hemma presente no seletor e Liquid Glass iOS ausente.
- Lavabo exibindo temperatura/umidade reais se os dois `entity_id` históricos estiverem ativos no HA.
- Sem regressão em TV, Hub, Office PC, cortina, câmeras ou assets V3.

## Merge

**Não mergear a #606 antes da validação física no Everex/iPhone.**
