# Retomada — 2026-08-04, fim do dia

Onde parar e onde pegar. Uma página, sem procurar.

## O que está rodando no seu tablet agora

| | |
|---|---|
| bundle | `bruno-dashboard.2q_aNpe1.js` |
| faixa de cômodos | **8 tiles, todos pelo componente novo** (Fase 5b) |
| subviews | **as seis antigas**, intocadas |
| repo × VM | em sincronia |

O tile do PC no Office foi corrigido para ler a sessão da máquina, e o glifo da
rail está em 24px. **Falta reiniciar o HA** para carregar o bundle `2q_aNpe1` se
você ainda não reiniciou desde a última entrega.

## ⚠️ Antes de qualquer próxima publicação

`dashboard-src/src/main.ts` **já importa** `bruno-room-subview`, que está
incompleto. O próximo `npm run build` gera um bundle com um componente sem
estilo. Ele não é referenciado por YAML nenhum, então não aparece na tela — mas
**não publicar** até os dois defeitos abaixo caírem.

Se precisar publicar outra coisa antes disso, comentar a linha 13 do `main.ts`.

## Fase 5c — onde parou

### Pronto e verificado

| | |
|---|---|
| configuração dos 6 cômodos | gerada, 760 linhas, PS5 só na Sala |
| CSS do componente | gerado, cobertura medida de **100%** |
| página de medição | monta os seis, atual e novo, na mesma célula |
| linha de base geométrica | `scripts/harness/subview-baseline.json` |

Critério de aceite: reproduzir a base com **delta 0,00** nos cinco cômodos, e os
três valores próprios da Cozinha.

### O que falta — dois defeitos localizados

O componente renderiza a estrutura, mas o CSS não aplica: onde o esperado é
`1170×48`, mede-se `12×330`. Das onze folhas adotadas, **a folha 0 tem 16 regras
e as folhas 1 a 10 têm zero** — o navegador aborta a análise no começo de cada uma.

**1. CONFIRMADO — escopo dentro de `@keyframes`.**
`escopar()` em `scripts/validation/gen-subview-css.mjs` aplica o prefixo também
aos blocos de `@keyframes`, produzindo
`:host([data-room='sala']) 0%, :host([data-room='sala']) 18% {`. Dentro de
`@keyframes` os seletores são porcentagens; isso é inválido e derruba a folha
inteira. São 12 blocos `@keyframes` no arquivo gerado.
Correção: `escopar()` não pode tocar em bloco cujo contexto seja `@keyframes`.

**2. EM ABERTO — a folha da base também para em 16 regras.**
A base não é escopada, então é outra causa. Suspeita: a serialização de `@media`
em `serializar()`. **Diagnosticar antes de mexer** — presumir foi o que produziu
os erros das sessões anteriores.

### Como retomar em dois comandos

```bash
node scripts/harness/gen-subview-harness.mjs
node scripts/harness/serve-harness.mjs scripts/harness/subview-parity.html 8126
```

No console do navegador:

```js
document.querySelector('bruno-room-subview').shadowRoot
  .adoptedStyleSheets.map((f, i) => [i, f.cssRules.length])
```

Folha com zero regras é folha que o navegador rejeitou. Depois:
`await medicaoNova()` e comparar com `subview-baseline.json`.

## Pendências fora da 5c

| # | Item | Nota |
|---|---|---|
| A | Espaçamento à direita da rail | agrupado com o item B: os dois mexem na largura do conteúdo, herdada pelas 6 subviews. Uma passada, uma remedição |
| B | Aumentar os badges de status superiores | ajuste fino, adiado por você |
| C | `switch.macbook` não existe | 5 referências vivas em packages, uma delas na conta de energia estimada. Fora do meu escopo |
| D | `idle_time` do PC com 4h33m com o PC em uso | verificar se o HASS.Agent parou de reportar |
| E | Assets V3 | quando chegarem: uma linha por cômodo em `rooms.config.ts`. Se mantiverem a tela quadrada da V2, zero calibração |

## Ferramentas criadas hoje

| script | para quê |
|---|---|
| `scripts/validation/check-backtick.mjs` | a armadilha da crase, verificada nos dois sentidos |
| `scripts/validation/compare-method.mjs` | compara o corpo de um método entre arquivos |
| `scripts/validation/extract-subview-config.mjs` | lê as 6 configs e mostra o que varia |
| `scripts/validation/gen-subview-config.mjs` | gera `subviews.config.ts` |
| `scripts/validation/diff-subview-css.mjs` | compara o CSS regra a regra |
| `scripts/validation/gen-subview-css.mjs` | gera o CSS do componente |
| `scripts/harness/gen-subview-harness.mjs` | página de medição das subviews |
| `scripts/harness/band-parity.src.html` | página de medição da faixa (8 pares) |
| `scripts/harness/rail-size.src.html` | alvo de toque e glifo da rail |
