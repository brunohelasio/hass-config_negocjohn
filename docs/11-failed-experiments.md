# 11 — Experimentos que não funcionaram

Extraído de `CLAUDE.md`. **Ler antes de propor qualquer coisa parecida** — várias
destas foram tentadas mais de uma vez, com o mesmo resultado.

---

## Crase dentro de comentário em template literal — **4 ocorrências**

**Objetivo:** documentar uma regra CSS num comentário, citando o seletor.
**Implementação:** crase em volta do nome da regra, dentro de um comentário que
vive **dentro** de um template literal.
**Resultado:** a crase fecha a string, o módulo não compila, **as 6 subviews caem
de uma vez.**
**Sintoma enganoso:** não aparece erro de carregamento. Como todo consumo é por
`?.`, o efeito simplesmente não acontece — na 3ª ocorrência o sintoma foi "todas
as subviews voltaram ao tema antigo", e eu perdi tempo investigando corrida de
carregamento no gerenciador de temas.

**A pista que resolve:** se a **Home está normal** e só as subviews quebraram, o
tema está vivo — o problema é o módulo de material, não o tema. A Home não passa
por esse módulo.

**Detectores que NÃO funcionam:** contar crases no arquivo (a espúria vem em
par); grep por palavra-chave da seção nova (o texto problemático pode estar em
outra linha); heurística em Perl procurando crase em bloco de comentário (24
falsos positivos, nenhum verdadeiro).
**Detector que funciona:** `node --check` — desde 2026-08-02, em
`scripts/validation/check-syntax.ps1`.

---

## Trava de contexto na ocupação (self-latch)

**Objetivo:** evitar que microquedas do radar derrubassem a ocupação.
**Implementação:** `occupancy = presença OU (occupancy E contexto)`, onde
contexto era TV/AC/PC ligado.
**Resultado:** com o A/C ligado, a ocupação ficava presa em ON **indefinidamente**.
Quarto vazio marcava "Ocupado" por minutos; ao entrar, o texto aparecia junto com
a presença, sem esperar os 60 s, porque já estava travado.
**Causa:** a condição nunca liberava — o contexto sozinho sustentava o estado.
**Recomendação:** a folga do `delay_off` (120–180 s) já cobre microquedas; a
trava era redundante e nociva. **Contexto não deve voltar como trava de estado.**
Se necessário no futuro, usar como condição em **automação** ("não desligar a luz
se a TV está tocando"), nunca preso dentro do `binary_sensor` de ocupação.

---

## `recent_only: 120s` no ponto de presença

**Objetivo:** manter o ponto aceso um tempo após a detecção.
**Resultado:** o ponto apagava com o cômodo ainda ocupado. Confirmado ao vivo na
Cozinha.
**Recomendação:** o ponto lê **apenas** `motion_recent` (5 s de anti-flicker). A
ocupação, que é lenta por natureza, vive só no texto.

---

## `grid-template-rows: 0` para esconder cards

**Objetivo:** esconder blocos por breakpoint zerando a altura da linha do grid.
**Resultado:** não esconde. Itens de CSS Grid têm `min-height: auto` — o conteúdo
transborda de uma linha de altura zero.
**Recomendação:** no `custom:grid-layout`, `show: mediaquery` é o mecanismo
**primário** de ocultação; a linha de altura zero serve só como rede de
segurança para evitar cards órfãos.

---

## `triggers_update: all` no template base do `button-card`

**Objetivo:** garantir que todo botão refletisse qualquer mudança.
**Resultado:** cada botão re-renderiza a **qualquer** mudança de estado de
**qualquer** entidade. Num popup com 14 botões, cada tique gera 14 renderizações.
**Recomendação:** listas específicas por botão. **É o mesmo defeito que o
`set hass → _render()` da camada JS** (A2 em `09`) — a arquitetura nova não pode
reintroduzi-lo em outra roupagem.

---

## `backdrop-filter` na cartela de Iluminação — entrou e saiu 3 vezes

**Cronologia (2026-07-29):** rev.9 adicionou blur de 2 px "por paridade com o
card dinâmico" e declarou que a nota da rev.7 estava errada. rev.12 removeu de
novo — **a rev.7 estava certa**.

**Causa da confusão:** o mapa de tokens do card dinâmico é referência de **cor e
contorno** (borda, edge-glow, sheen, raio, sombra), **não de filtro nem de
camadas radiais**. O mesmo valor de blur dá resultado oposto porque o que fica
**atrás** é diferente: na Home o card está sobre o papel de parede da shell; na
subview a cartela está sobre a **foto do cômodo**. Blur destrói a textura da foto
e tudo vira painel chapado.

**Efeito colateral relacionado (REV.17):** `backdrop-filter` no ancestral cria um
*backdrop root* — os filhos deixam de amostrar o fundo real. Foi por isso que os
botões de luz não ficavam foscos enquanto os controles do A/C, sem filtro
ancestral, ficavam.

**Recomendação:** não alterar blur por impressão visual. Medir. Ver `08`.

---

## Radial de topo na cartela de Iluminação

**Objetivo:** paridade com o card dinâmico.
**Resultado:** um arco visível atravessando o painel.
**Causa:** sem filtro, a rampa de alfa `0.105 → transparent` produz **banding**
sobre superfície lisa, e os degraus viram arcos. Textura mascara banding;
superfície lisa denuncia.

---

## Retry no gerenciador de temas

**Objetivo:** corrigir o que eu diagnostiquei como corrida de carregamento.
**Resultado:** revertido integralmente — **o diagnóstico estava errado** (era a
crase). A Home estar normal já provava que o tema estava ativo.
**Nota:** a fragilidade descrita **existe de verdade** — se `bruno-<tema>.js` der
cache miss e `bruno-theme-manager.js` der cache hit, a ordem de execução pode
inverter e a preferência cai no fallback naquele carregamento. Não foi a causa
daquele incidente e **não foi corrigida**.

---

## Substituição em massa com `$1` seguido de dígitos (2026-08-02)

**Objetivo:** trocar o `?v=` de 34 URLs de imagem em 14 arquivos.
**Implementação:** `s{(...\?v=)[^"']+}{$120260802-assets-resize-1}g`
**Resultado:** o Perl leu `$120260802` como grupo de captura inexistente. As URLs
viraram `src="/local/-assets-resize-1"` em 14 arquivos.
**Detecção:** no diff, antes de qualquer coisa sair da pasta local.
**Recomendação:** `${1}` sempre que o texto seguinte começar com dígito; conferir
o diff antes de seguir; e **em edição de texto + binário na mesma tarefa, fazer a
edição de texto primeiro** — `git checkout` para reverter o texto também reverte
o binário da mesma pasta.

---

## Mobile V1, V2 e V3

Três gerações de interface móvel paralela, todas abandonadas.

**V2:** a barra de navegação nunca foi conectada a view nenhuma — arquivo isolado.
**V3:** `navigation_path` apontando para `/lovelace/...`, um slug **especulativo**.
O slug real é `ngocjohn-main`. Os links nunca funcionaram.
**V2/V3:** reusavam os arquivos do grid do tablet (calibrados para células de
~245 px) dentro de contêineres móveis de 160–170 px — o conteúdo era cortado.

**Recomendação:** a Opção A (estender a própria shell para o celular, com media
query) substituiu tudo isso e é o caminho certo — **um único modelo de
interação**, não um mundo paralelo. As 5 views do V3 ainda são carregadas e
parseadas a cada load, sem servir para nada.

---

## Espelhar a Sala em layout 2×1 horizontal

**Objetivo:** hero à esquerda, faixa de ações à direita.
**Por que não foi feito:** exigiria duplicar as ~2.600 linhas do
`bento_sala.yaml` (hero ~290 + ações ~2.300), multiplicando a manutenção.
**Solução adotada:** card de largura total e altura maior, distinguindo-se como
"card de destaque".
**Recomendação:** só faz sentido depois que o conteúdo estiver em componente
parametrizado — aí o custo desaparece.

---

## Resolver o grafo de includes ignorando caminhos absolutos (2026-08-03)

**Objetivo:** classificar arquivos órfãos para arquivamento na Fase 3.

**Implementação:** um resolvedor que seguia `!include` a partir do entrypoint.
Ele tratava apenas caminhos **relativos** — includes do tipo
`!include_dir_merge_list /config/dashboards/floorplan/` eram registrados como
"alvo ausente" e descartados.

**Resultado:** os 7 arquivos de `dashboards/floorplan/` eu excluí manualmente do
arquivamento, reconhecendo o falso positivo. Mas **nunca traversei para dentro
deles** — e eles próprios incluem `../shared/honeycomb/*.yaml`. Essas
dependências ficaram invisíveis ao grafo, foram classificadas como órfãs e
arquivadas.

O Home Assistant passou a falhar ao carregar o dashboard:

```
Unable to read file /config/dashboards/floorplan/../shared/honeycomb/office_mode.yaml
```

**Causa:** reconhecer um falso positivo e **excluí-lo da lista** não é o mesmo
que **corrigir o resolvedor**. O arquivo ficou de fora do arquivamento, mas
continuou fora do grafo — e o grafo é o que decide o destino de todos os outros.

**Correção:** o resolvedor passou a mapear `/config/` para o diretório de
configuração. O grafo real tem **160** arquivos alcançáveis, não 151.
`shared/honeycomb/living.yaml` e `office_mode.yaml` foram restaurados.

**Prevenção:** `scripts/validation/check-includes.pl`, com duas varreduras
independentes — uma pelo grafo, outra exaustiva sobre todo YAML de
`dashboards/`. A segunda existe justamente porque a primeira pode ter pontos
cegos. Rodar **antes de mover qualquer arquivo**.

**Efeito colateral descoberto pela varredura exaustiva:** `views/shell/section_home.yaml`
— o rollback da Home V1, que eu preservei deliberadamente — depende de 8 arquivos
de `views/main-grid/` que a decisão D2 arquivou. O rollback ficou incompleto.
Não quebra nada (o arquivo não é carregado), mas o aviso está agora no topo do
próprio arquivo. Decisão pendente do usuário: restaurar as 14 dependências ou
aposentar a Home V1 de vez.

**Lição transferível:** ao decidir o destino de arquivos por análise estática,
qualquer ponto cego do analisador vira decisão errada em massa. Antes de mover,
validar o analisador contra o comportamento real — e ter uma segunda varredura
que não dependa das mesmas premissas.
