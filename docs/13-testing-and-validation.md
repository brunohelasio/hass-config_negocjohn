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

### Detector de crase — `scripts/validation/check-backtick.mjs`

A armadilha que já quebrou o dashboard **cinco vezes**: uma crase não escapada
dentro de um comentário que vive dentro de um template literal. Ela fecha a
string, o módulo para de compilar, e o sintoma aparece longe da causa — em
2026-07-29 as seis subviews voltaram ao tema errado por causa de uma dessas.

```bash
node scripts/validation/check-backtick.mjs --tudo
```

Varre `config/www`, `scripts` e `dashboard-src/src` (70 arquivos hoje). Sai com
código 1 se achar algo.

**Por que os detectores anteriores não serviam:**

| tentativa | por que falhou |
|---|---|
| paridade de crases no arquivo | a espúria vem em par — o total continua par |
| `grep` por palavras do bloco novo | a crase estava numa linha sem nenhuma delas |
| primeira versão deste script | acusava crase **escapada**, que é legítima |
| segunda versão | lia `http://` dentro de template como início de comentário |
| terceira versão | não rastreava aspas simples/duplas e **se acusava sozinha** |

A versão atual rastreia quatro estados — template literal, comentário de linha,
comentário de bloco e string entre aspas — e só acusa a combinação perigosa.
Verificada nos dois sentidos: acusa um arquivo-isca com o defeito, e passa limpo
nos 70 arquivos do projeto.

---

## Medir CONTEÚDO, não só geometria (2026-08-05)

A fase 5c publicou uma tela com a geometria exata e os módulos **vazios**. Foi um
erro de método: paridade geométrica mede caixas, e uma caixa vazia mede igual a
uma caixa cheia. O banco de medição passou a responder também "o módulo tem
conteúdo?".

```bash
node scripts/harness/gen-subview-harness.mjs
node scripts/harness/serve-harness.mjs scripts/harness/subview-parity.html 8199
# no navegador, viewport 1280x720:
#   await inspecao()   -> conteúdo dos seis, módulo a módulo
```

`window.conteudo(tag)` devolve, por cômodo:

| grupo | o que conta | defeito que ele pega |
|---|---|---|
| `hub` | fontes, quantas abertas, filhos e altura do `mh-source-body`, botões, volume, arte | acordeão que não abre; fonte sem corpo |
| `ac` | `icg-svg` presente, nº de arcos e de marcas, temperatura no centro, tag do power e o glifo dele, nº de controles | anel ausente; power como `<div>` vazio |
| `cameras` | feeds, PIP, imagens e os `src` sem query | PIP que não aparece; feed sem imagem |
| `eletro` | tiles, PNGs, e o **glifo do ícone do cabeçalho** | apelido inexistente caindo no ícone genérico |
| `luzes` | células e glifos | ícone que não resolve |

### O ícone genérico tem assinatura

Um `bruno-icon` cujo nome não está na tabela de apelidos desenha **um único
`<circle>`**. Um resolvido desenha `path` ou `g`. O inspetor devolve a lista de
tags filhas do `<svg>`, então `generico(circulo)` é diagnóstico, não suspeita.

### O glifo vive no shadow root

`querySelectorAll('.lc-icon svg')` devolve **zero** mesmo com o ícone desenhado:
o `<svg>` está dentro do shadow root do `bruno-icon`. Contar sem atravessar o
shadow root produz um falso defeito — aconteceu nesta sessão e quase virou uma
"correção" de um problema que não existia.

## Comparar contra o ORIGINAL VIVO, não contra a linha de base gravada

`subview-baseline.json` foi capturado num dia específico. Campos que dependem da
data ou do estado — largura do relógio, largura das badges — divergem sozinhos
depois. A comparação certa monta o componente **antigo** e o **novo** na mesma
página, no mesmo instante, e diffa os dois:

```js
window.montar(i)      // subview atual
window.montarNovo(i)  // componente novo, mesma célula
```

Na entrega de 2026-08-05: **461 campos, 3 divergências**, todas o mesmo desvio
deliberado (o rótulo "TV da sala" que a origem repete nos seis cômodos).

## Medir no TEMA e na RESOLUÇÃO do tablet (2026-08-05)

O banco sobe com o tema padrão (`liquid-glass`) e o viewport do navegador. O
tablet usa **Josh** e **1920×1200**. Um defeito real do A/C — o cartão 49px mais
estreito por causa de uma coluna nomeada inexistente — era invisível a 1280×720 e
saltava a 1920×1200.

```js
localStorage.setItem('bruno-ui-theme', 'josh');
BrunoThemeManager.apply('josh');
// e redimensionar a janela para 1920x1200 antes de medir
```

Confirme o host: `data-bruno-subview-surface-theme="josh"`. Com `default` você
está medindo sem a pele do tema — e sem os defeitos que só ela revela.

Medir nas duas resoluções, sempre. Geometria idêntica numa não prova nada sobre a
outra.

## Medir o COMPONENTE não é medir o LAYOUT (2026-08-06)

Duas rodadas falharam no alinhamento da faixa de status da Home por causa disto,
e a lição é maior que o caso.

**O que eu fiz:** montei `bruno-top-badges-card` sozinho num slot com o mesmo
padding do `content-slot`, medi, e concluí que o `margin-top: -10px` funcionava.

**O que acontece na Home:** o `layout-card` **envolve cada card num wrapper**, e
é o wrapper que é o item do grid — o `view_layout: grid-area` vai nele. Uma
margem negativa no `:host` do card move o card **dentro** do wrapper; a posição
da linha não muda. No banco de medição não havia wrapper, então a margem
funcionou lá e não na tela real.

**Regra:** quando o alvo está dentro de um contêiner de layout do Lovelace
(`layout-card`, `stack-in-card`, `hui-card`), medir o componente isolado responde
sobre o componente, não sobre o layout. Ou se reproduz a cadeia inteira de
wrappers, ou se mede na tela real.

**Sintoma que deveria ter me alertado:** a medição dizia "alinhado" e o usuário
dizia "continua diferente" — pela terceira vez. Quando a medição contradiz a
observação repetida, o suspeito é o banco de medição, não o observador.

**Correção real:** a linha-fantasma de 0px saiu do grid da Home (rev.6 em
`views/shell/section_home_v2.yaml`), e com ela o `grid-gap` que ficava acima da
faixa. As áreas que ela sustentava pertencem a cards com
`show.mediaquery (max-width: 800px)`: no desktop não renderizam, e área de card
não renderizado não precisa existir.
