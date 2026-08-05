# 04 — Componentes do dashboard

Livro-razão da migração. Levantado do código em 2026-08-02; **atualizar a coluna
de estado a cada componente migrado.**

## Como ler

- **Entidades**: quantas entidades distintas o arquivo referencia diretamente
  (indício de acoplamento à configuração — quanto maior, mais valor em mover
  para a configuração central).
- **Serviços**: quantos serviços do HA distintos ele chama.
- **disc.CB**: tem `disconnectedCallback`. `—` significa que listeners e timers
  registrados por ele **não são removidos**.

## Contrato comum a todos

Todos são custom elements clássicos (`extends HTMLElement`), sem `import`. O
Home Assistant injeta o objeto `hass` por setter; quase todos respondem com
re-render total. Comunicação entre módulos por `globalThis`.

```js
set hass(hass) { this._hass = hass; this._render(); }   // padrão atual
```

**Alvo da migração:** cada componente declara de quais entidades depende e só
recalcula quando uma delas muda.

## Inventário

| Custom element | Arquivo | Linhas | Entidades | Serviços | Timers | disc.CB |
|---|---|---|---|---|---|---|
| `bento-sidebar-liquid-card` | `bento-sidebar-card.js` | 889 | 1 | 0 | 1 | — |
| `bruno-activity-column` | `bruno-ui/cards/bruno-activity-column.js` | 537 | 3 | 0 | 2 | sim |
| `bruno-agenda-card` | `bruno-ui/cards/bruno-agenda-card.js` | 518 | 0 | 0 | 1 | sim |
| `bruno-cameras-card` | `bruno-ui/cards/bruno-cameras-card.js` | 1137 | 9 | 1 | 1 | sim |
| `bruno-corredor-card` | `bruno-ui/cards/bruno-corredor-card.js` | 1575 | 7 | 0 | 9 | sim |
| `bruno-cozinha-card` | `bruno-ui/cards/bruno-cozinha-card.js` | 1546 | 16 | 0 | 11 | sim |
| `bruno-energy-card` | `bruno-ui/cards/bruno-energy-card.js` | 608 | 6 | 1 | 0 | — |
| `bruno-hero-card` | `bruno-ui/cards/bruno-hero-card.js` | 1898 | 7 | 1 | 1 | sim |
| `bruno-hero-stage-card` | `bruno-ui/cards/bruno-hero-stage-card.js` | 200 | 0 | 0 | 0 | — |
| `bruno-home-camera-card` | `bruno-ui/cards/bruno-home-camera-card.js` | 769 | 9 | 1 | 1 | sim |
| `bruno-lavabo-card` | `bruno-ui/cards/bruno-lavabo-card.js` | 1916 | 11 | 0 | 5 | sim |
| `bruno-media-card` | `bruno-ui/cards/bruno-media-card.js` | 2092 | 11 | 0 | 3 | — |
| `bruno-mobile-cameras-list-card` | `bruno-ui/cards/bruno-mobile-cameras-list-card.js` | 376 | 8 | 0 | 1 | sim |
| `bruno-mobile-card-frame` | `bruno-ui/cards/bruno-mobile-card-frame.js` | 110 | 0 | 0 | 0 | — |
| `bruno-mobile-nav-card` | `bruno-ui/cards/bruno-mobile-nav-card.js` | 228 | 0 | 0 | 1 | — |
| `bruno-mobile-rooms-card` | `bruno-ui/cards/bruno-mobile-rooms-card.js` | 183 | 0 | 0 | 0 | — |
| `bruno-mobile-sala-card` | `bruno-ui/cards/bruno-mobile-sala-card.js` | 721 | 17 | 0 | 4 | — |
| `bruno-office-card` | `bruno-ui/cards/bruno-office-card.js` | 1659 | 20 | 0 | 9 | sim |
| `bruno-quarto-casal-card` | `bruno-ui/cards/bruno-quarto-casal-card.js` | 1524 | 18 | 0 | 9 | sim |
| `bruno-quarto-marina-card` | `bruno-ui/cards/bruno-quarto-marina-card.js` | 1502 | 19 | 0 | 9 | sim |
| `bruno-quarto-miguel-card` | `bruno-ui/cards/bruno-quarto-miguel-card.js` | 1514 | 18 | 0 | 9 | sim |
| `bruno-quick-actions-card` | `bruno-ui/cards/bruno-quick-actions-card.js` | 671 | 1 | 0 | 2 | — |
| `bruno-roborock-card` | `bruno-ui/cards/bruno-roborock-card.js` | 942 | 11 | 0 | 0 | — |
| `bruno-sala-card` | `bruno-ui/cards/bruno-sala-card.js` | 4369 | 22 | 0 | 10 | sim |
| `bruno-sala-room-card` | `bruno-ui/cards/bruno-sala-room-card.js` | 1371 | 18 | 0 | 9 | sim |
| `—` | `bruno-ui/cards/bruno-sidebar-panels.js` | 776 | 23 | 0 | 0 | — |
| `bruno-top-badges-card` | `bruno-ui/cards/bruno-top-badges-card.js` | 1056 | 69 | 2 | 2 | — |
| `—` | `bruno-ui/core/bruno-hybrid-light-icons.js` | 228 | 0 | 0 | 0 | — |
| `bruno-icon` | `bruno-ui/core/bruno-icons.js` | 113 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-ios-dark.js` | 161 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-ios-light.js` | 187 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-josh.js` | 425 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-liquid-glass-ios.js` | 198 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-liquid-glass.js` | 459 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-liquid-glass_v1.js` | 379 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-network-panel.js` | 183 | 9 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-scenes-panel.js` | 169 | 0 | 1 | 0 | — |
| `bruno-shell` | `bruno-ui/core/bruno-shell.js` | 2061 | 2 | 0 | 0 | sim |
| `—` | `bruno-ui/core/bruno-surface-material.js` | 540 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-system-panel.js` | 189 | 12 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-theme-manager.js` | 151 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-updates-panel.js` | 408 | 1 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-visionos.js` | 409 | 0 | 0 | 0 | — |
| `—` | `bruno-ui/core/bruno-wallpaper-manager.js` | 121 | 0 | 1 | 0 | — |
| `bruno-cameras-security-subview` | `bruno-ui/subviews/bruno-cameras-security-subview.js` | 1597 | 9 | 1 | 2 | sim |
| `bruno-cozinha-subview` | `bruno-ui/subviews/bruno-cozinha-subview.js` | 8783 | 44 | 0 | 3 | sim |
| `bruno-music-subview` | `bruno-ui/subviews/bruno-music-subview.js` | 33 | 0 | 0 | 0 | — |
| `bruno-office-subview` | `bruno-ui/subviews/bruno-office-subview.js` | 8429 | 44 | 0 | 3 | sim |
| `—` | `bruno-ui/subviews/bruno-planta-3d-subview.js` | 2204 | 37 | 0 | 3 | sim |
| `bruno-quarto-casal-subview` | `bruno-ui/subviews/bruno-quarto-casal-subview.js` | 8889 | 39 | 0 | 3 | sim |
| `bruno-quarto-marina-subview` | `bruno-ui/subviews/bruno-quarto-marina-subview.js` | 8910 | 53 | 0 | 3 | sim |
| `bruno-quarto-miguel-subview` | `bruno-ui/subviews/bruno-quarto-miguel-subview.js` | 8925 | 43 | 0 | 3 | sim |
| `bruno-roborock-subview` | `bruno-ui/subviews/bruno-roborock-subview.js` | 937 | 25 | 0 | 1 | sim |
| `bruno-sala-subview` | `bruno-ui/subviews/bruno-sala-subview.js` | 8928 | 55 | 0 | 3 | sim |
| `—` | `bruno-ui/subviews/bruno-sidebar-subviews.js` | 1236 | 38 | 0 | 2 | sim |

## Agrupamento por natureza

### Núcleo (`core/`) — não registram custom element
Publicam objetos em `globalThis` e são consumidos pelos demais:
`BrunoIcons`, `BrunoLiquidGlass`, `BrunoLiquidGlassIOS`, `BrunoVisionOS`,
`BrunoIOSLight`, `BrunoIOSDark`, `BrunoJosh`, `BrunoThemeManager`,
`BrunoSurfaceMaterial`, `BrunoWallpaperManager`, `BrunoHybridLightIcons`,
`BrunoSystemPanel`, `BrunoNetworkPanel`, `BrunoScenesPanel`, `BrunoUpdatesPanel`.

**A ordem de carregamento é o grafo de dependências** — `bruno-josh` depende de
`bruno-ios-dark`; `bruno-theme-manager` depende dos temas. Nada verifica isso.

### Cards de cômodo — 7 cópias do mesmo componente
`bruno-{sala,office,cozinha,lavabo,quarto-casal,quarto-marina,quarto-miguel}-card`
mais `bruno-corredor-card` e `bruno-sala-room-card`.
**Convergem para um componente parametrizado na Fase 5b.**

### Subviews de cômodo — 6 cópias, 88–97% idênticas
`bruno-{sala,office,cozinha,quarto-casal,quarto-marina,quarto-miguel}-subview`,
~8.800 linhas cada. **Convergem para uma subview parametrizada na Fase 5c — é a
maior economia do projeto (~45.000 linhas).**

### Componentes singulares
`bruno-shell` (roteamento, rail, backdrops, popups), `bruno-media-card`,
`bruno-home-camera-card`, `bruno-cameras-security-subview`,
`bruno-roborock-subview`, `bruno-planta-3d-subview`, `bruno-energy-card`,
`bruno-agenda-card`, `bruno-hero-card`, `bruno-top-badges-card`,
`bruno-quick-actions-card`, `bruno-activity-column`, `bento-sidebar-liquid-card`.

### Legado móvel — carregados e sem uso prático
`bruno-mobile-{card-frame,nav-card,rooms-card,sala-card,cameras-list-card}` —
resquício do Mobile V3, cujas views apontam para um slug inexistente.

### Órfãos no disco
`bruno-liquid-glass_v1.js`, `bruno-sidebar-panels.js`, `bruno-sidebar-subviews.js`
— não estão em `extra_module_url`. Os dois últimos só existiam no `/config` do HA
e foram trazidos na Fase 2b.

## Ordem de migração

| # | Componente | Por quê |
|---|---|---|
| 1 | `bruno-corredor-card` | Piloto: card de cômodo completo, fronteira clara, falha não derruba nada |
| 2 | Demais cards de cômodo → **um** parametrizado | Fase 5b |
| 3 | Subviews de cômodo → **uma** parametrizada | Fase 5c — o prêmio |
| 4 | Mídia, câmeras | dependem do contrato de atualização do `hass` |
| 5 | Shell | por último: é o hospedeiro de todo o resto |

**Critério de aceitação por componente:** comportamento e visual idênticos ao
atual; funciona de 600 a 2000 px de viewport **sem breakpoint próprio**;
`disconnectedCallback` removendo tudo que registrou; sem `setInterval` onde
houver estado reativo equivalente.

---

## Anatomia de uma subview de cômodo (verificada no código, 2026-08-04)

Faltava no acervo, e a falta custou dois enganos meus: descrevi o hub de mídia
pelos **nomes dos métodos** em vez do caminho que realmente renderiza. Registrado
aqui para que ninguém repita.

### Caminho vivo do render

O template principal chama **oito** métodos, e só estes:

```
_renderTopBand      barra superior de badges
_renderHero         relógio, saudação, foto do cômodo
_renderCameras      câmera(s) + botão de 3 pontos com os controles
_renderMediaHub     hub de mídia  ← ver abaixo
_renderLights       dock de iluminação
_renderAC           bloco do ar-condicionado
_renderClimateRing  anel de temperatura
_renderCurtain      dock de cortina
```

### O hub de mídia por dentro

- corpo: **dois tiles lado a lado** — TV (ou PC, no Office) + **Spotify**;
- canto superior direito: botão de **três pontos** (`.mh-menu`,
  `mdi:dots-vertical`) que abre `.mh-overflow-panel` (`top: 42px; right: 10px`);
- dentro do painel: **PS5** (ligar/desligar + detalhes) e **selecionar fonte**.

### ⚠️ Código morto que parece vivo

| método | definido | chamado |
|---|---|---|
| `_renderTV` | sim | **não** |
| `_renderPS5` | sim | **não** |
| `_renderMediaHubLegacy` | sim | **não** |

Contar esses métodos como "o bloco de TV/PS5" foi o meu erro. **Antes de tratar
um método como parte da estrutura, confirme que ele é chamado**:

```bash
grep -cE "this\._renderX\(" arquivo.js    # 0 = morto
```

### ⚠️ Sete definições de `.sala-subview` no mesmo arquivo

Empilhadas: a base, mais blocos em `@media` de 1180px, 800px e 760px — e alguns
fora de media query, sobrescrevendo a base. **A última definição ativa vence**; a
primeira que aparece no arquivo quase nunca é a que vale.

O grid base ainda declara uma área `ps5` no `grid-template-areas`. Ela é
**vestigial**: como `_renderPS5` nunca é chamado, nenhum elemento ocupa essa
área. Ler o grid e concluir que existe um tile de PS5 é o mesmo erro por outro
caminho.

### Regra

Para descrever estrutura: partir do template principal e seguir só as chamadas
reais. Nome de método, seletor de CSS e área de grid **não provam** que algo
renderiza — no melhor caso são pistas, no pior são restos de tentativas
anteriores que a Regra de Ouro manda preservar.
