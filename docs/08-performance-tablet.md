# 08 — Performance no tablet

O tablet é o alvo real. **Validação no computador não prova nada** — o WebView
tem memória disputada, cache próprio e políticas diferentes de autoplay e
vibração.

## Aparelho em produção (Device Info, 2026-08-02)

| | |
|---|---|
| App | Fully Kiosk `de.ozerov.fully` **1.61-play** (1483/1460) |
| WebView | `com.google.android.webview` **150.0.7871.181** |
| Android | **15** (SDK 35/36) |
| Modelo | **25040RPQAL** (Xiaomi — Redmi Pad 2) |
| Tela | **2560 × 1600 px** |
| RAM do app (usada / livre) | **9.762 KB / 252.381 KB** |

### O que esses números mudam

**WebView 150 (Chrome 150).** Nenhuma restrição de CSS moderno. Estão
disponíveis: `@container` (Chrome 105), unidades `cqw/cqi/cqh` (105), `:has()`
(105), `dvh/svh/lvh` (108), subgrid (117), `@property` (85), `text-wrap: balance`
(114). **Não é preciso fallback legado.** Isso fecha a decisão técnica da
estratégia responsiva em [`07-design-system.md`](07-design-system.md).

**Tela 2560×1600.** O aparelho anterior de desenvolvimento (Galaxy Tab S6 Lite)
é 2000×1200. Resoluções físicas bem diferentes — e é a origem direta da quebra
de layout relatada. Ver `07`.

**Teto de RAM ≈ 253 MB.** É o número que dá escala ao trabalho de assets: os
PNGs de cômodo ocupavam **64,3 MB de bitmap decodificado** — mais de um quarto
do orçamento — para imagens exibidas a 120 px. Depois da Fase 6.1, **9,6 MB**.

> **Medida ainda não capturada: o viewport CSS.** É ele que o CSS enxerga
> (`resolução física ÷ devicePixelRatio`), não os 2560×1600. Deve ser exposto
> pela camada de diagnóstico. Com container queries o valor exato deixa de ser
> crítico — mas continua sendo o número certo para investigar qualquer regressão
> de layout.

## Custos medidos no código (2026-08-02)

| Achado | Medida | Onde |
|---|---|---|
| Re-render total a cada `hass` | ~30 cards com `set hass → _render() → innerHTML =` | todos os `bruno-*-card.js` |
| Listeners sem remoção | **316 `addEventListener` × 62 `removeEventListener`** | 9 arquivos sem `disconnectedCallback` |
| Timers | **124** `setInterval`/`setTimeout`; 3 `setInterval` por subview | subviews e cards |
| Assets | 64,3 MB → **9,6 MB** de bitmap | ✅ resolvido na Fase 6.1 |
| Requisições no cold start | **52 módulos JS separados** (sem bundle) | `extra_module_url` |
| CSS reprocessado por render | ~300 KB por subview, em template literal | 6 subviews |

### Por que o re-render total é o pior deles

O Home Assistant atualiza o objeto `hass` a cada mudança de estado de **qualquer**
entidade da casa. Com ~30 cards montados, um único tique de sensor dispara ~30
reconstruções completas de DOM — cada uma jogando fora e recriando os elementos,
e reprocessando o CSS embutido no template.

Não é um problema de velocidade de máquina; é trabalho desnecessário multiplicado.
A correção é arquitetural: cada componente declara de quais entidades depende e
só recalcula quando uma delas muda. Está na Fase 6, item 6.2 do plano.

## Efeitos visuais: medir antes de mexer

O `CLAUDE.md` registra várias idas e vindas com `backdrop-filter` decididas no
olho (revisões 9 a 12 de 2026-07-29, com o blur entrando e saindo três vezes).

**Regra:** não alterar blur, sombra ou transparência por impressão. Medir com o
DevTools remoto (`chrome://inspect` no computador, com o tablet em depuração USB)
e só então propor. O WebView 150 suporta o painel de Performance completo.

Candidatos conhecidos a custo alto, ainda **não medidos**:

- `backdrop-filter` em áreas grandes (a moldura da shell, a faixa de tiles)
- filtros sobrepostos — um ancestral com filtro cria *backdrop root* e muda o
  comportamento dos filhos (foi a causa da REV.17 na Iluminação)
- múltiplas transparências empilhadas
- câmeras simultâneas na seção de segurança

## Transições, áudio e resposta tátil

Relatado como não funcionando bem no tablet; **causa ainda não diagnosticada**.
Não presumir que é a linguagem ou o tipo de componente. Investigar, nesta ordem:

1. política de autoplay do WebView (áudio exige interação prévia do usuário)
2. API de vibração — disponível e com permissão no Fully Kiosk?
3. recriação de elementos a cada render (uma animação em elemento recriado nunca
   completa — e isso é consequência direta do re-render total)
4. `prefers-reduced-motion` ativo no aparelho
5. latência de `pointerdown` → `click` no WebView

A hipótese 3 é a mais provável e a mais barata de testar, porque já sabemos que
o re-render total existe.

## Plano de otimização

| # | Ação | Estado |
|---|---|---|
| 6.1 | Redimensionar assets de cômodo | ✅ 64,3 → 9,6 MB |
| 6.2 | Independência de resolução (container queries + escalas fluidas) | requisito da arquitetura |
| 6.3 | Uniformidade dos ícones de cômodo | aguarda decisão de projeto |
| 6.4 | Contrato de atualização do `hass` (fim do re-render total) | Fase 5/6 |
| 6.5 | `disconnectedCallback` nos 9 arquivos sem ele | livre |
| 6.6 | Bundle único no lugar de 52 requisições | Fase 4 |
| 6.7 | Medir `backdrop-filter` no tablet | precisa de DevTools remoto |
| 6.8 | Diagnosticar áudio/háptico/transições | precisa do tablet |
