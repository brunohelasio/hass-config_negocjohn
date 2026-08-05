# Retomada — 2026-08-05

## O que está no seu tablet

| | |
|---|---|
| bundle | `bruno-dashboard.gQQPjAce.js` |
| faixa de cômodos | 8 tiles pelo componente novo (Fase 5b) |
| **subviews de cômodo** | **6 pelo componente novo (Fase 5c)** |
| repo × VM | em sincronia |

**Reiniciar o HA** para carregar o bundle.

## Depois do reinício, conferir nesta ordem

1. **O Corredor** — quebrou nos reinícios anteriores; é a primeira verificação sempre
2. **As seis subviews** — Sala, Office, Cozinha, Q. Casal, Q. Marina, Q. Miguel
3. **A faixa de cômodos** na Home, que não foi tocada

## Rollback, sem reiniciar

Em `config/dashboards/views/bento_shell.yaml`: comentar o bloco marcado
`FASE 5c` e descomentar o `ANTERIOR` logo abaixo. Os seis arquivos antigos
continuam no disco e carregados.

## O que a Fase 5c entregou

Um componente, `bruno-room-subview`, no lugar de seis arquivos de ~8.900 linhas
— 41.421 no total, das quais só 5.876 eram distintas.

| | |
|---|---|
| CSS | gerado: 620 regras de base + 4 blocos condicionais + sobreposições, cobertura medida de 100% |
| configuração | gerada: 760 linhas, PS5 só na Sala |
| régua | `scripts/harness/subview-baseline.json` + página de medição |

**Aceite: 36 de 36 campos com delta zero**, viewport 1280×720, incluindo as três
particularidades da Cozinha (sem linha de câmeras+hub, coluna direita de 308px,
sem A/C).

Numa medição mais fina, de dez módulos por cômodo, 55 de 60. Os cinco restantes
são o mesmo elemento — o anel do A/C — com 1px em Y: o elemento interno mede
203,00 contra 203,27 do real, e um quarto de pixel muda o arredondamento.

## Pendências

| # | Item | Nota |
|---|---|---|
| A | Conteúdo vivo dos módulos | a estrutura está fiel; ligar entidades a câmeras, hub, A/C e eletrodomésticos é o passo seguinte |
| B | Espaçamento da rail + badges superiores | agrupados: os dois mexem na largura do conteúdo, herdada pelas subviews |
| C | `switch.macbook` não existe | 5 referências vivas em packages, uma na conta de energia |
| D | `idle_time` do PC com 4h33m em uso | verificar se o HASS.Agent parou de reportar |
| E | Assets V3 | uma linha por cômodo em `rooms.config.ts` |

## Ferramentas

```bash
node scripts/validation/check-backtick.mjs --tudo        # a armadilha da crase
node scripts/validation/gen-subview-css.mjs              # regenera o CSS
node scripts/validation/gen-subview-config.mjs           # regenera a configuração
node scripts/harness/gen-subview-harness.mjs             # página de medição
perl scripts/validation/check-includes.pl .              # includes
```
