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
