# 01 — Arquitetura atual

Estado verificado em 2026-08-02. Tudo aqui foi conferido no código.

## Fluxo de inicialização

```
1. Home Assistant sobe e lê config/configuration.yaml
2. frontend.extra_module_url injeta 52 <script type="module"> na ordem declarada
   └─ cada script registra custom elements e/ou publica um objeto em globalThis
3. Usuário abre /ngocjohn-main
4. HA lê dashboards/ui-lovelace-main.yaml e resolve TODOS os !include
   (inclusive das views que ninguém abre)
5. A primeira view (bento_shell.yaml) é o painel padrão: type: panel, 1 card
6. <bruno-shell> monta, lê sua config (rails, sections, backdrops) e renderiza
   a seção default_section: home
7. Trocar de seção = mudar o hash (bento-lab#cameras). A view nunca remonta.
```

## Camadas

```
┌──────────────────────────────────────────────────────────────┐
│  YAML — configuração                                          │
│  configuration.yaml · ui-lovelace-main.yaml · bento_shell.yaml│
│  shell/rail*.yaml · shell/section_*.yaml                      │
└───────────────────────────┬──────────────────────────────────┘
                            │ props do card
┌───────────────────────────▼──────────────────────────────────┐
│  SHELL — bruno-shell.js (2.061 linhas)                        │
│  roteamento por hash · rail · backdrops · popups · temas      │
└───┬──────────────────┬───────────────────┬───────────────────┘
    │                  │                   │
┌───▼──────────┐  ┌────▼───────────┐  ┌────▼──────────────────┐
│ RAIL         │  │ SEÇÕES         │  │ PAINÉIS               │
│ bento-       │  │ home  → YAML   │  │ system · network      │
│ sidebar-card │  │ demais → custom│  │ scenes · updates      │
│ (889 l.)     │  │  elements      │  │                       │
└──────────────┘  └────┬───────────┘  └───────────────────────┘
                       │
         ┌─────────────┴──────────────┐
    ┌────▼─────────┐          ┌───────▼────────────────┐
    │ CARDS (Home) │          │ SUBVIEWS (cômodo)      │
    │ 25 arquivos  │          │ 6 × ~8.800 linhas      │
    │ ~1.500 l/ea  │          │ 88–97% idênticas       │
    └──────────────┘          └────────────────────────┘
                       │
┌──────────────────────▼───────────────────────────────────────┐
│  NÚCLEO — globalThis                                          │
│  BrunoIcons · BrunoLiquidGlass · BrunoJosh · BrunoIOSDark     │
│  BrunoSurfaceMaterial · BrunoThemeManager · BrunoVisionOS …   │
└──────────────────────────────────────────────────────────────┘
```

## Como os módulos conversam

**Não há `import` nem `export` em nenhum dos 53 arquivos.** O contrato é:

```js
// quem publica
globalThis.BrunoSurfaceMaterial = { connect, disconnect, subviewStyles, … };

// quem consome (sempre com optional chaining, porque pode não ter carregado)
globalThis.BrunoSurfaceMaterial?.connect?.(this);
```

Consequências:

- A ordem em `frontend.extra_module_url` **é** o grafo de dependências.
- `bruno-josh.js` é um *delta* sobre `bruno-ios-dark.js`: precisa vir depois.
  `bruno-theme-manager.js` precisa dos temas já registrados.
- Nada verifica isso. Se um módulo vier de cache e outro da rede, a ordem de
  execução pode divergir da ordem declarada.
- O `?.` mascara a falha: em vez de erro, o efeito simplesmente não acontece.
  Foi assim que o incidente de 2026-07-29 se manifestou como "todas as subviews
  voltaram ao tema antigo" em vez de um erro de carregamento.

## Modelo de renderização

Praticamente todo card segue:

```js
set hass(hass) {
  this._hass = hass;
  this._render();        // ← sem comparar nada
}
_render() {
  this.shadowRoot.innerHTML = `…`;   // ← reconstrói tudo
}
```

O HA atualiza o objeto `hass` a cada mudança de estado de **qualquer** entidade
da casa. Com ~30 cards montados, cada tique de sensor dispara ~30 reconstruções
completas de DOM, incluindo reparse do CSS em template literal.

Exceções (fazem alguma verificação antes de renderizar):
`bruno-home-camera-card.js`, `bruno-activity-column.js`,
`bruno-mobile-cameras-list-card.js`, e as subviews via `_safeRender()`.

## Ciclo de vida

- 25 arquivos têm `disconnectedCallback`.
- 9 arquivos têm listener e/ou timer **sem** `disconnectedCallback`:
  `bento-sidebar-card.js`, `bruno-energy-card.js`, `bruno-media-card.js`,
  `bruno-mobile-nav-card.js`, `bruno-mobile-sala-card.js`,
  `bruno-quick-actions-card.js`, `bruno-roborock-card.js`,
  `bruno-top-badges-card.js`, `bruno-surface-material.js`.
- Total: **316 `addEventListener` × 62 `removeEventListener`**.
- Listeners em alvos globais (`window` / `matchMedia`), que sobrevivem ao
  elemento: 4 em `bruno-shell.js`, 1 em cada card de cômodo, 1 em
  `bruno-surface-material.js`.
- 124 `setInterval`/`setTimeout`. As 6 subviews têm 3 `setInterval` cada
  (refresh, relógio, câmera).

## Estado

Não há store. O estado vem de três lugares:

1. **`hass`** — injetado pelo HA em cada card (fonte principal)
2. **Estado local do elemento** (`this._expanded`, `this._section`, …)
3. **Helpers do HA como estado compartilhado** — `input_boolean`,
   `input_select` em `config/packages/` (ex.: `input_select.bento_active_camera`,
   `input_boolean.sala_tv_controls_expanded`). Padrão correto: o estado
   sobrevive a reloads e é visível ao HA.

Persistência do lado do cliente: `localStorage` (tema, última mídia válida).

## Navegação

- **Dentro da shell**: hash (`bento-lab#home`, `#sala`, `#cameras`, …). Sem
  remontagem.
- **Para fora**: `navigation_path` do Lovelace para as views legadas.
- **Popups**: os painéis (system/network/scenes/updates) são overlays da própria
  shell. `browser_mod.popup` sobrevive apenas no YAML legado.

## Temas

Cadeia por sobreposição de variáveis CSS:

```
tablet.yaml (tema do HA, aplicado na view)
   └─ bruno-liquid-glass.js      → tokens base
        └─ bruno-ios-dark.js     → tema iOS Dark
             └─ bruno-josh.js    → delta Josh.ai (o tema em uso)
                  └─ bruno-surface-material.js → materiais das subviews
```

`bruno-theme-manager.js` escolhe e persiste; `bruno-surface-material.js` marca o
host com `data-bruno-subview-surface-theme="josh"` e injeta o CSS das subviews.

## Câmeras

| Contexto | Mecanismo |
|---|---|
| Subviews de cômodo | `hui-image` (elemento oficial do HA) + `/api/camera_proxy` |
| `bruno-cameras-security-subview.js` | `hui-image` (13 usos) + `createElement('img')`; menciona WebRTC/HLS |
| `bruno-home-camera-card.js` | `/api/camera_proxy` com `setInterval` |
| `bruno-hero-card.js` | `/api/camera_proxy` |

Movimento das câmeras Tuya vem da ponte própria
`config/custom_components/bruno_tuya_motion/`, que escuta a fila MQTT existente
e publica estados `bruno_tuya_motion.<camera>`.

## YAML que continua ativo, e por quê

| Arquivo | Por que permanece |
|---|---|
| `configuration.yaml` | O HA exige |
| `ui-lovelace-main.yaml` | O HA exige para dashboard em modo `yaml` |
| `views/bento_shell.yaml` | Configuração da shell (rails, seções, backdrops) — é config, não layout |
| `shell/rail*.yaml`, `shell/section_*.yaml` | Idem |
| `packages/*.yaml` | Sensores de presença, cenas, helpers — backend, fora do frontend |
| `themes/tablet.yaml` | Tema do HA |
| `views/main.yaml` + `main-grid/` | **Legado ainda parseado.** A shell substituiu a função; a remoção depende de resolver o risco R1 |
