# V3 — Josh, Hemma e Lavabo — 2026-08-22

## Contexto

A PR #606 é filha direta da #604 e preserva o runtime validado da #602. Esta documentação registra a rodada Hemma/Lavabo e, principalmente, a correção visual round2 feita após validação física no Everex/iPhone.

## Resultado da primeira validação física do Josh

### Tablet/desktop

A primeira candidata manteve um wash leitoso no estado ON. Mesmo com gradientes radiais, a superfície continuou sendo percebida como um retângulo/quadrado dentro da faixa de tiles.

**Decisão:** abandonar o wash no tablet. A tile continua sem cartela e o feedback ON fica no PNG aceso, texto, filete inferior quente e glow inferior.

### Phone

A primeira candidata também não reproduziu visualmente o ON do Liquid Glass. O clareamento continuou concentrado perto do PNG, apesar de os valores de CSS terem sido copiados para um bridge.

A causa encontrada no round2 foi o próprio mecanismo de instalação: o bridge tentava sobrescrever `connectedCallback` depois de `customElements.define()`. Esse lifecycle já é capturado pelo registro do custom element, portanto a folha de estilo não chegava de forma confiável às instâncias criadas posteriormente.

**Decisão round2:** manter a estrutura Josh e corrigir apenas o mecanismo de aplicação. O bridge agora observa os elementos reais, descobre `bruno-room-tile` inclusive dentro de Shadow DOMs e instala a folha diretamente no `shadowRoot` de cada tile. Para o phone ON, a folha usa literalmente a receita visual vigente de `bruno-liquid-surface-on-*` do Liquid Glass: background, blur/filter, border-color, shadow, sheen e sheen-opacity. Não altera radius, semântica, estado, gesto, asset ou layout.

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

## Arquivos da rodada round2

- `dashboard-src/src/themes/josh-phone-on-bridge.ts`
- `docs/CHECKPOINT-ATUAL.md`
- `docs/38-v3-josh-hemma-lavabo-20260822.md`
- `docs/LEIA-PRIMEIRO.md`
- `docs/16-ai-working-guide.md`
- `docs/33-runtime-mobile-consolidado.md`
- `docs/15-decisions-log.md`

O bundle gerado e o `configuration.yaml` são atualizados somente após a validação automática da candidata.

### Consolidação de fonte

A PR técnica #611 foi aberta somente para forçar a esteira de CI atualizada. O objetivo é, se a esteira disparar, retirar o wash diretamente de `bruno-room-tile.ts` e fazer o phone consumir tokens Liquid Glass por uma autoridade única em `bruno-josh.js`, deixando o bridge de Shadow DOM apenas como mecanismo transitório/fallback. Esta PR técnica nunca deve ser mergeada.

## Validação física esperada

- Tablet: Office ON sem retângulo/veil; filete inferior perceptível; nenhuma cartela nova.
- Phone Josh: OFF idêntico; ON com a mesma linguagem material do Liquid Glass, mantendo o raio Josh.
- Hemma presente no seletor e Liquid Glass iOS ausente.
- Lavabo exibindo temperatura/umidade reais se os dois `entity_id` históricos estiverem ativos no HA.
- Sem regressão em TV, Hub, Office PC, cortina, câmeras ou assets V3.

## Merge

**Não mergear a #606 antes da validação física no Everex/iPhone.**
