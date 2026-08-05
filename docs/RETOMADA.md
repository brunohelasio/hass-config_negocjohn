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

### Estado medido (2026-08-05)

Os três defeitos do dia anterior caíram. Contra `subview-baseline.json`,
viewport 1280×720:

| módulo | linha de base | componente | delta |
|---|---|---|---|
| topband | 1170×48 | 1170×48 | **0** |
| hero | 800×308 | 800×308 | **0** |
| cams + hub | 800×320 | 800×320 | **0** |
| coluna direita | 360×638 | 360×638 | **0** |
| A/C | 360×320 | 360×320 | **0** |
| dock de luzes | 360×54 | 360×83 | **+29px** |

### O defeito aberto — o dock não recebe display

Medido nos dois lados, mesmo elemento:

| elemento | real | componente |
|---|---|---|
| `.lights-card` | 54px, `display: flex` | 83px, **`display: block`** |
| `.lights-dock` | 52px, `display: flex` | 61px, **`display: block`** |
| `.lights-body` | 0px, `display: grid`, rows 0 | 20px, **`display: block`** |

Os três caem para `block`, que é o padrão — ou seja, **as regras de layout desses
três seletores não estão sendo aplicadas ao componente**. Não é valor errado: é
regra ausente. Diagnosticar ONDE elas foram parar na geração (base, bloco ou
sobreposição) e por que o seletor não casa. Não editar o CSS antes de saber.

Comando para retomar exatamente daqui:

```js
// com o harness aberto, apos montarNovo(0):
const sr = document.querySelector("bruno-room-subview").shadowRoot;
sr.adoptedStyleSheets.flatMap((f, i) => [...f.cssRules]
  .filter(r => r.selectorText && r.selectorText.includes("lights-card"))
  .map(r => [i, r.selectorText, r.style.display]))
```

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
