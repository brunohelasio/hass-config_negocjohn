# 13 — Testes e validação

## Princípio

**O tablet é o alvo. Validação no computador não prova nada** — o WebView tem
memória disputada, cache próprio e políticas diferentes de autoplay e vibração.
Nada pode ser declarado como funcionando no tablet sem teste no tablet, feito
pelo usuário.

## Protocolo por alteração

| # | Verificação | Como |
|---|---|---|
| 1 | Sintaxe | `powershell -File scripts/validation/check-syntax.ps1` — linha de base **55/55 OK** |
| 2 | Referências resolvem | todo caminho de asset/include aponta para arquivo existente |
| 3 | Custom elements registrados | no console: `customElements.get('bruno-…')` |
| 4 | Cache-bust | `?v=` alterado **e** valor anterior comentado ao lado |
| 5 | Diff revisado | conferir o diff **antes** de copiar para a VM |
| 6 | Visual no desktop | — |
| 7 | Funcional | a ação chama mesmo o serviço do HA |
| 8 | Console sem erro novo | — |
| 9 | **Visual e funcional no tablet** | **sempre pelo usuário** |
| 10 | Rollback registrado | comando exato anotado |

O passo 5 não é burocracia: foi ele que pegou a substituição em massa que
corrompeu 34 URLs em 2026-08-02, antes de qualquer coisa sair da pasta local.

## Ordem em tarefas mistas

Quando a mesma tarefa altera **texto e binário**, fazer o **texto primeiro**.
Motivo: `git checkout` para reverter um arquivo de texto reverte a pasta inteira
— e leva o binário junto. Aprendido na Fase 6.1.

## Testes automatizados

### Hoje
Só `node --check`. Não há teste unitário nem de interface.

### A partir da Fase 4 — Vitest

Focar no que quebra em silêncio e é barato de testar: **funções puras**.

| Alvo | Por quê |
|---|---|
| Lógica de presença/ocupação | três camadas, timers, regra "texto exige ocupação **E** presença" |
| Formatação de tempo decorrido | `Xm` / `Xh` / `Xd` a partir de `last_changed` |
| Contagem de luzes acesas | ordem de prioridade: `lights_on_count` → `lights_on` → membros do grupo → fallback |
| Seletores de entidade | o contrato "de quais entidades este componente depende" |
| Validação da configuração | existência de entidade em `hass.states`, com componente e cômodo no diagnóstico |

**Não** perseguir cobertura de saída renderizada — retorno baixo e quebra a cada
ajuste visual.

### Banco de medição de paridade — em uso desde a Fase 5a

`scripts/harness/` sobe um servidor que mapeia `/local/` para `config/www/` — a
mesma raiz que o Home Assistant usa, então PNGs e módulos carregam sem alterar
caminho nenhum. A página renderiza o card **atual** e o componente **novo** na
mesma célula, com os mesmos tokens de tema e o mesmo estado de entidades.

Expõe `window.medir(hostId, seletores)`, que devolve a geometria de cada elemento
interno **relativa ao canto do próprio card** — dois cards em colunas diferentes
ficam comparáveis, e o resultado é um delta em pixels.

Também serve para comportamento: disparar `PointerEvent` e conferir a classe de
pressão, o cancelamento por arraste, o disparo do *hold* e a chamada de serviço
resultante. Foi assim que se provou que o toque alterna a mesma entidade que o
card real.

O que ele **não** cobre: o `bruno-icon` renderiza, mas o painel não estreita
abaixo de ~980 px, então o ramo `max-width: 800px` é conferido por **comparação
de regra CSS** entre os dois `shadowRoot`, não por medição.

Custo de medir: um comando. Custo de perguntar "está bom?": uma rodada do
usuário — e não detecta 1 px.

### Playwright — Fase 7, não antes

Playwright roda Chromium no computador. Tudo o que quebra neste projeto quebra no
**tablet**. Testes verdes no desktop criariam confiança falsa. Entra depois, só
para regressão de layout entre larguras de container.

## Verificação de independência de resolução

Critério de aceitação por componente migrado: **funciona de 600 a 2000 px de
viewport sem breakpoint próprio.**

Como verificar no desktop, antes do tablet:

1. DevTools → modo dispositivo → arrastar a largura continuamente de 600 a 2000
2. Procurar **saltos**: se algo muda de estado de uma vez num ponto específico,
   ainda há breakpoint escondido
3. Conferir que nenhum texto trunca nem transborda nos extremos

Isso não substitui o tablet — detecta a classe de defeito antes de chegar lá.

## Depuração no tablet

WebView 150 suporta DevTools remoto completo:

1. Ativar depuração USB no tablet
2. Conectar ao computador
3. `chrome://inspect` no Chrome do computador
4. Painéis de Performance, Memory e Console disponíveis

É o caminho para medir `backdrop-filter` (T3 em `09`) e diagnosticar
áudio/háptico/transições (T1) — dois itens que hoje só têm hipótese.

## Rollback

| Escopo | Comando |
|---|---|
| Um arquivo | `git checkout pre-dashboard-architecture -- <caminho>` |
| Assets de cômodo | `git checkout pre-dashboard-architecture -- config/www/bruno-ui/assets/` |
| Tudo | `git checkout pre-dashboard-architecture -- .` |
| Um recurso JS | reverter a linha `?v=` em `configuration.yaml` (valor anterior comentado ao lado) |
| Home V2 → V1 | uma linha em `views/bento_shell.yaml` |
| Limpeza da VM | `Rename-Item` de volta — ver `14` |
