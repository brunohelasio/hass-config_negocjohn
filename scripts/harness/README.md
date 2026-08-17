# Harness de paridade

Renderiza o card ATUAL e o componente NOVO lado a lado, fora do Home Assistant,
com os mesmos tokens de tema e o mesmo estado de entidades — e mede os dois.

Existe porque a alternativa era pedir validação visual a cada tentativa. Medir
custa um comando; olhar custa uma rodada de ida e volta, e não detecta 1px.

```bash
node scripts/harness/serve-harness.mjs scripts/harness/office-parity.html 8123
```

Antes de servir, troque `__BUNDLE__` pelo nome do bundle atual:

```bash
B=$(ls -t config/www/dashboard/ | grep -E '^bruno-dashboard\..*\.js$' | head -1)
sed "s/__BUNDLE__/$B/" scripts/harness/office-parity.src.html > scripts/harness/office-parity.html
```

O servidor mapeia `/local/` para `config/www/`, que é a mesma raiz que o HA usa —
por isso os PNGs e os módulos carregam sem alterar caminho nenhum.

A página expõe `window.medir(hostId, seletores)`, que devolve a geometria de cada
elemento interno relativa ao canto do próprio card. Dois cards em colunas
diferentes ficam comparáveis, e o resultado é um delta em pixels.

`office-parity.html` é gerado e fica fora do Git.

---

## Banco de custo de render (Fase 6.1)

O banco acima mede **geometria e conteúdo**: se o componente novo desenha o mesmo
que o antigo. Não diz nada sobre custo — uma caixa vazia mede igual a uma cheia,
e um componente que repinta 3.000 vezes mede igual a um que repinta 40.

`render-cost.html` mede a outra pergunta: **quantas vezes o componente repinta, e
por causa de quê.**

```bash
node scripts/harness/gen-render-harness.mjs
node scripts/harness/serve-harness.mjs scripts/harness/render-cost.html 8127
```

No console da página:

```js
await window.medirRenders(400, 0.1)   // 7 ladrilhos, 400 atualizações, 10% relevantes
await window.medirSubview(200, 0.1)   // a subview, que é o componente pesado
await window.medirCiclos(50)          // monta/desmonta 50x e confere o que sobrou
```

Ele reproduz o que o Home Assistant faz: uma sequência de objetos `hass`, cada um
com UMA entidade diferente do anterior. A fração que toca entidades observadas é
o parâmetro — na casa real a maioria esmagadora das mudanças é de coisas que o
cômodo da vez não mostra.

**Duas armadilhas que custaram rodadas:**

- **O Lit agrupa `requestUpdate` pendentes.** Um laço síncrono vira UM render por
  componente, e o resultado parece bom demais (99,8%). É obrigatório
  `await el.updateComplete` a cada passo — senão a medição mede o agrupamento do
  Lit, não o estado seletivo.
- **`requestAnimationFrame` não dispara com a aba em segundo plano**, e a medição
  roda com a aba oculta. Usar `setTimeout`.

Os ids de cômodo saem do próprio bundle, por tentativa de `setConfig`. A primeira
versão os escreveu à mão, errou quatro dos sete e quebrou na montagem — lista
escrita no banco mede a suposição de quem escreveu, não o sistema.

`render-cost.html` é gerado e fica fora do Git.

### Câmeras (Fase 6.2B)

```js
await window.medirCameras(30)        // câmeras fora do ar: caminho de erro e recuo
await window.medirCameras(25, true)  // caminho de sucesso completo
```

O segundo modo põe `entity_picture` apontando para uma imagem que existe neste
servidor, e então o motor percorre tudo: baixa, avisa a subview, e ela troca o
`src` do elemento. O resultado traz `naTela`, que é a única prova de que a
ligação motor → tela fecha.

**Um artefato do laboratório:** a aba roda em segundo plano, e a suspensão de
módulo invisível (6.1) desliga o ciclo de câmera exatamente nessa condição. A
primeira execução deu zero tentativas e parecia defeito do motor — era a
suspensão funcionando. O banco força `visibilityState: 'visible'`. Neutralizar
artefato do instrumento é legítimo; forjar resultado não seria.
