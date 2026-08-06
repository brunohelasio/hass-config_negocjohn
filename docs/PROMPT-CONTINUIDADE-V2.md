# Prompt de continuidade — dashboard Home Assistant (negocjohn)

**Cole isto numa sessão nova, com qualquer IA.** Descreve a arquitetura, as
decisões já tomadas, tudo o que foi implementado, o ponto exato em que o
desenvolvimento parou e como prosseguir.

**Data de corte:** 2026-08-06 · Fases 5c, 5d e 5e **FECHADAS** e commitadas · próxima: **6.0**

---

## 0. ANTES DE AGIR — confirme o estado real

> As informações de bundle, arquivos alterados e fase atual representam a **data
> de corte**. Antes de agir, conferir `git status`, branch, commit, bundle
> referenciado, `extra_module_url` e os documentos atuais.
> **O repositório é a fonte operacional de verdade.**

```bash
git rev-parse --abbrev-ref HEAD && git rev-parse --short HEAD
git status --short
grep -nE "^    - /local/dashboard/" config/configuration.yaml     # bundle vivo
ls -t config/www/dashboard/*.js | head -3                          # builds no disco
```

Documentos vigentes: `docs/LEIA-PRIMEIRO.md` (índice),
`docs/ROTEIRO-CONSOLIDADO-V3.md` (plano) e `docs/RELATORIO-CONSOLIDADO.md`
(histórico). Se divergirem deste prompt, **eles vencem**.

---

## 1. O projeto

Auditoria, limpeza e reestruturação arquitetural de um dashboard pessoal do Home
Assistant, feita de forma **incremental e reversível** no repositório e na VM
existentes — não é uma reescrita do zero.

```
Repositório:  C:\GitHub\hass-config_negocjohn\hass-config_negocjohn
Instância:    VM por Samba em \\192.168.3.102\config
Fluxo:        editar local → copiar para a VM → o USUÁRIO reinicia o HA
Tablet-alvo:  1920×1200, tema Josh, WebView Chrome 150, Android 15
```

**Arquitetura-alvo:** TypeScript · Lit · Web Components · CSS modular com tokens ·
Vite · Vitest · ESLint · Prettier. YAML só onde o Home Assistant exige.

Código novo em `dashboard-src/`, compilado num bundle único em
`config/www/dashboard/`, referenciado por `frontend.extra_module_url` no
`configuration.yaml`. Código legado em `config/www/bruno-ui/`.

---

## 2. Regras de trabalho — condições, não preferências

### 2.1 O que exige autorização expressa

A IA **pode** investigar, editar e testar **localmente**, dentro da fase
autorizada. Sem autorização expressa do usuário, **não pode**:

- commit;
- merge;
- push;
- deploy (copiar para a VM);
- reiniciar o Home Assistant;
- excluir definitivamente qualquer coisa;
- alterar `packages`, sensores ou automações.

O usuário commita pelo GitHub Desktop, no meio da sessão. `docs/**` dispara
deploy público no GitHub Pages — nunca dar push sem pedido.

### 2.2 Escopo

`config/dashboards/`, `config/www/`, `dashboard-src/`. Se um sintoma vier de uma
entidade do HA: **diagnosticar e reportar**, nunca editar `config/packages/`,
templates de presença ou automações.

### 2.3 Nunca apagar código

Comentar antes de substituir, com marcador de rollback in-place.
**Exceção aprovada em 2026-08-05:** depois que uma entrega é validada pelo
usuário, o bloco antigo pode sair do arquivo vivo e ir para `_archive/` com o
caminho original registrado.

### 2.4 Decisões já tomadas

> Não reabrir decisões por preferência técnica. Só propor revisão diante de
> **evidência medida nova**, incompatibilidade comprovada, mudança do ambiente ou
> nova determinação do usuário.

### 2.5 Método

- **Consultar `docs/` ANTES de produzir**, não depois de errar. E complementar
  esses documentos a cada rodada.
- **Só pedir validação sobre resultado MEDIDO.** Banco de medição em
  `scripts/harness/`.
- Não repetir status nem narrar o óbvio. Investigar e entregar.
- Manter os assets antigos e as views mobile — serão usados na fase mobile.

---

## 3. O que já foi implementado

| fase | entrega |
|---|---|
| 0 | Checkpoint, tag `pre-dashboard-architecture` (commit `e0dc9da3`), backups |
| 1 | Auditoria: 4 defeitos medidos, riscos R1–R10 |
| 2 | 17 documentos, `docs/00` a `docs/16` |
| 3 | 195 arquivos legados isolados em `_archive/`, zero mudança no caminho vivo |
| 4 | `dashboard-src/` com a fundação técnica completa |
| 5a | Piloto: um tile de cômodo pela arquitetura nova |
| 5b | **8 tiles da Home → 1 componente** — validado pelo usuário |
| 5c | **6 subviews de ~8.900 linhas → 1 componente parametrizado** |
| 5d | **Fechamento:** alinhamento da faixa de status, espaçamento da rail, 1,8 MB retirados do carregamento, baseline congelada |
| 5e.0 | **Contratos mínimos de dispositivo** (registry) |
| 5e.1 | Power na rail das subviews |
| 5e.2 | Faixa de ações rápidas da Home removida |
| 5e.3 | Gate da cena "Apagar todas as luzes" |
| 5e.4 | Wi-Fi absorvido pelo botão Rede, em cadeia |
| 5e.5 | "Atualizar" migrado para Configurações |
| 5e.6 | **Popup Dispositivos** substitui o popup Sistema |

Fora de fase: assets de cômodo redimensionados, 64,3 → 9,6 MB de bitmap.

### 3.1 Arquivos-chave da arquitetura nova

```
dashboard-src/src/
├── application/
│   └── device-registry.ts              contratos mínimos (5e.0) + 16 testes
├── components/
│   ├── rooms/
│   │   ├── bruno-room-tile.ts          faixa de cômodos da Home (5b)
│   │   ├── bruno-room-subview.ts       as seis subviews (5c)
│   │   └── subview-styles.generated.ts CSS GERADO — não editar à mão
│   └── devices/
│       ├── bruno-devices-panel.ts      popup Dispositivos (5e.6)
│       └── controls.ts                 tipos registrados: media-tv, climate
├── config/
│   ├── rooms.config.ts                 8 cômodos: tiles, dots, entidades
│   ├── subviews.config.ts              6 cômodos: GERADO das DEFAULT_CONFIG
│   ├── devices.config.ts               instâncias do popup Dispositivos
│   └── scenes.config.ts                dependências de cena (gate 5e.3)
├── services/entities/
│   ├── room-state.ts                   luzes, semântica, sensores
│   └── spotify-device.ts               em qual cômodo o Spotify toca (+13 testes)
├── diagnostics/                         entidades ausentes + dependências do HA
└── styles/tokens/scale.ts               semente da escala fluida (6.2)
```

### 3.2 Como o componente de subview resolve as diferenças entre cômodos

Estrutura única; o que varia entra por atributo no host, e o CSS gerado já vem
escopado por esse atributo:

```
data-room="<id>"     sobreposição do cômodo (o grid próprio da Cozinha)
data-tvhub           hub com TV — cinco cômodos
data-appliances      eletrodomésticos — só a Cozinha
data-ps5             entrada de PS5 no menu — só a Sala
```

```yaml
type: custom:bruno-room-subview
room: sala          # sala | office | cozinha | casal | marina | miguel
```

### 3.3 O registry de dispositivos (5e.0) — e por que ele existe

`application/device-registry.ts` define `DeviceControlDefinition`,
`DeviceInstanceConfig`, o registry e a criação de controles **por configuração**.

O popup Dispositivos **não sabe o que é uma TV**: a lista sai de
`config/devices.config.ts` e cada controle vem do registry.

- acrescentar um **aparelho** = acrescentar uma entrada de configuração;
- acrescentar um **tipo** de aparelho = registrar um controle em `controls.ts`.

Nos dois casos o popup não muda. **Todo componente migrado a partir daqui nasce
compatível com esses contratos** — é o que evita reescrever código validado
quando o editor de layout existir (decisão do usuário, 2026-08-05).

Fora do escopo da 5e.0, e continua na 6.4: posição e tamanho de widget,
persistência de layout, host adapter, editor.

---

## 4. Decisões de projeto já tomadas — ver §2.4 antes de reabrir

| decisão | motivo |
|---|---|
| A shell (`custom:bruno-shell`) é o painel padrão | view única + `type: panel` + hash mantém a rail viva |
| `resources:` removido do `ui-lovelace-main.yaml` | o tablet baixava cada módulo duas vezes |
| **Não** adotar Zod agora | valida formato, não existência da entidade — que é a falha real. Reavaliar quando houver editor e persistência |
| Playwright só depois da responsividade | roda Chromium no desktop; tudo o que quebra aqui quebra no **tablet** |
| Independência de resolução é **critério de aceitação** | 6.210 px fixos e 157 media queries num só tablet não escalam |
| Container queries como mecanismo primário | WebView é Chrome 150; entraram no 105 |
| CSS e configuração migrados são **gerados**, nunca transcritos | 670 regras por cômodo; transcrição manual já criou um arquivo órfão |
| Decomposição e retirada do CSS são **o mesmo trabalho**, por módulo | o CSS é um bloco único escopado no host; separar obrigaria a replicá-lo em sete shadow roots |
| Câmera: instantâneo continua padrão até o stream **vencer na medição** | o streaming ao vivo já foi implementado e regrediu |
| Contratos de widget/layout **antecipados** | componente que nasce compatível não precisa ser reescrito quando o editor existir |
| Faixa de ações rápidas removida; funções redistribuídas | base da Home passa a ser só a faixa de tiles, como nas subviews |

---

## 5. Armadilhas deste projeto — leia antes de escrever qualquer linha

### 5.1 A crase em template literal — **10 ocorrências**

Uma crase não escapada dentro de um **comentário** que vive dentro de um template
literal fecha a string. O módulo para de compilar e o sintoma aparece longe da
causa.

```bash
node scripts/validation/check-backtick.mjs --tudo
```

Detectores que **não** funcionam: paridade de crases (a espúria vem em par),
`grep` por palavras do bloco novo. Cobre comentário de JS, de CSS e de HTML.

**Regra:** em comentário, aspas retas ou descrever em palavras. Nunca crase.

### 5.2 Paridade geométrica não é critério de aceite suficiente

A Fase 5c chegou a publicar uma tela com **geometria exata e módulos vazios**.
Caixa vazia mede igual a caixa cheia. Use também `window.conteudo()` /
`window.inspecao()` do harness, que contam conteúdo por módulo.

### 5.3 Medir no TEMA e na RESOLUÇÃO do tablet

O harness sobe com `liquid-glass` e o viewport do navegador. O tablet é **Josh**
em **1920×1200**. Um defeito real do A/C — cartão 49 px mais estreito — era
invisível a 1280×720.

```js
localStorage.setItem('bruno-ui-theme', 'josh');
BrunoThemeManager.apply('josh');
// e redimensionar para 1920x1200
```

### 5.4 Medir o COMPONENTE não é medir o LAYOUT

**Custou três rodadas em 2026-08-06.** O `layout-card` **envolve cada card num
wrapper**, e é o wrapper que é o item do grid — o `view_layout: grid-area` vai
nele. Uma margem no `:host` do card move o card **dentro** do wrapper.

No harness, com o card anexado direto ao slot, a medição dizia que funcionava.
Na tela real, não fazia nada.

**Sinal de alerta:** quando a medição diz "alinhado" e o usuário repete
"continua diferente", o suspeito é o **banco de medição**, não o observador.

### 5.5 O shadow root não é atravessado por seletor descendente

`bruno-icon` se dimensiona com `width: var(--mdc-icon-size, 1em)`. Sizing do
invólucro **não afeta o glifo**, e uma regra `.algo svg` **não casa nada** — o
`<svg>` está dentro do shadow root. Só a propriedade customizada atravessa.
Vale também para MEDIR.

### 5.6 Não copiar de bloco comentado

Os arquivos originais guardam tentativas **já recusadas** em comentários de
rollback. Buscar sempre a última definição ativa.

### 5.7 O gerador de CSS e a cascata — três erros já cometidos

| erro | sintoma | correção no gerador |
|---|---|---|
| emitir uma definição por seletor | raiz com 12 px; dock 29 px mais alto | `fundir()` |
| emitir na primeira aparição | regra de grupo posterior sobrescrevia | `emOrdemDeUltimaAparicao()` |
| declaração morta viajando para depois de quem a matou | A/C 49 px estreito | `anuladaDepois()` |

**Nunca editar `subview-styles.generated.ts` à mão.** Editar o gerador e regerar.

### 5.8 O Corredor quebra junto com entregas

Três vezes correlacionado. Evitar reinício desnecessário do HA; **conferir o
Corredor após cada entrega que exija reinício**; desfazer antes de investigar.

---

## 6. Ferramentas de verificação

```bash
# antes de publicar QUALQUER coisa
cd dashboard-src && npm run check          # typecheck + lint + 62 testes + build

# a armadilha da crase
node scripts/validation/check-backtick.mjs --tudo

# arquivos JS legados
node --check config/www/bruno-ui/core/bruno-shell.js

# includes do YAML
perl scripts/validation/check-includes.pl .

# regenerar o que é gerado
node scripts/validation/gen-subview-css.mjs      # CSS + relatório de cobertura
node scripts/validation/gen-subview-config.mjs   # configuração dos cômodos

# banco de medição
node scripts/harness/gen-subview-harness.mjs
node scripts/harness/serve-harness.mjs scripts/harness/subview-parity.html 8199
#   no navegador, tema Josh, 1920x1200 e 1280x720:
#     montar(0..5)      subview ATUAL
#     montarNovo(0..5)  componente NOVO, mesma célula
#     inspecao()        conteúdo dos seis, módulo a módulo
```

**Método que funcionou nas fases 5a/5b/5c:**
```
medir → reproduzir → comparar (antigo e novo na MESMA página, no mesmo instante)
→ validar → substituir → remover legado do caminho vivo
```

---

## 7. Onde o desenvolvimento parou (data de corte — confirmar, §0)

**Fases 5c, 5d e 5e FECHADAS, validadas no tablet pelo usuário e COMMITADAS.**

```
branch: main
commit: b0ceba1e   feat(5c/5d/5e): conteudo vivo das subviews, refinamento
                   funcional e fechamento
tag:    baseline-5e-fechada     <- baseline congelada
Bundle: config/www/dashboard/bruno-dashboard.Duzbu9AO.js
Árvore de trabalho LIMPA. VM sincronizada.
Trocar o bundle exige REINICIAR o Home Assistant.
```

**Não há pendência anterior à Fase 6.0.** A continuidade começa direto na 6.0.

### 7.1 Última medição da 5c

Subview atual e componente novo na mesma página, no mesmo instante, tema Josh:

| resolução | campos | divergências |
|---|---|---|
| 1920×1200 | 461 | 3 |
| 1280×720 | 461 | 3 |

As 3 são o mesmo desvio deliberado: os arquivos originais rotulam a fonte de TV
como "TV da sala" em todos os cômodos, inclusive no Q. Miguel, onde é falso.
Fora da Sala o rótulo passou a ser "TV".

### 7.2 Decisões do usuário no fechamento — não reabrir sem determinação dele

| item | decisão |
|---|---|
| Validação visual no tablet | **aprovada**, inclusive o alinhamento da faixa de status |
| Proporção das colunas da subview | **encerrada sem mudança.** Jogar o respiro para a direita desequilibraria a margem esquerda. Se voltar ao assunto, é decisão nova |
| Espaçamento da rail | aprovado em 2px |
| Botão Apps da TV | aprovado como está |
| Estilo visual do popup Dispositivos | aceito para a fase de transição; ele quer repensar depois |
| Cena "Apagar todas as luzes" | **autorizou criar** — feita no padrão já existente |

### 7.3 O que a Fase 5e entregou

| # | entrega |
|---|---|
| 5e.0 | Contratos mínimos de dispositivo (registry) + 16 testes |
| 5e.1 | Power na rail das subviews |
| 5e.2 | Faixa de ações rápidas removida da Home |
| 5e.3 | Cena "Apagar todas as luzes" + gate de dependência |
| 5e.4 | Wi-Fi absorvido pelo botão Rede, em cadeia |
| 5e.5 | "Atualizar" migrado para Configurações |
| 5e.6 | Popup **Dispositivos** substitui o popup Sistema |

A cena segue o padrão já existente: script `bruno_scene_*` em
`packages/bruno_scenes.yaml`, **não** entidade `scene.` — o painel de Cenas lista
scripts. Criada com autorização expressa (a regra §2.1 proíbe mexer em packages
sem ela).

### 7.4 O que a Fase 5d fechou (2026-08-06)

| # | mudança | arquivo |
|---|---|---|
| 1 | **Grid da Home, rev.6:** a linha-fantasma de 0px saiu; a faixa de status virou a primeira linha real, sem gap acima. Banda inferior de `calc(23vh + 52px)` → `calc(23vh - 12px)`; hero `calc(77vh - 154px)` → `calc(77vh - 80px)` | `views/shell/section_home_v2.yaml` |
| 2 | Constante do hero espelhada | `v2/bento_dynamic.yaml` (`available_height`) |
| 3 | Badges da Home passaram a **flat**, como as das subviews (a pílula era o degrau restante) | `cards/bruno-top-badges-card.js` |
| 4 | Scrim dos popups: `0.08`/`blur(2px)` → `0.42`/`blur(14px) saturate(.92) brightness(.82)` | `core/bruno-shell.js` |
| 5 | `content-slot` `padding-left`: 12 → 6 → **2px** | `core/bruno-shell.js` |
| 6 | Power na rail das subviews | `views/shell/rail_rooms.yaml` |
| 7 | Faixa de ações rápidas comentada; bloco inferior com uma linha | `v2/bento_bottom_block.yaml` |
| 8 | Rail: item Sistema → **Dispositivos** | `views/shell/rail.yaml` |
| 9 | Painel Dispositivos, registry, controles, gate da cena | `dashboard-src/` |
| 10 | **1,8 MB retirados do carregamento:** os 6 módulos de subview e as views legadas que os usavam | `configuration.yaml`, `ui-lovelace-main.yaml` |

**Atenção no item 10** — eu errei o escopo na primeira tentativa e a correção
vale como regra: os **8 cards de cômodo continuam carregados**, porque o layout
do TELEFONE os usa (`bento_comodos_phone` → `bento_comodos_matriz` →
`main-grid/bento_*.yaml`). Só as 6 subviews saíram.

> **Retirar do carregamento exige checar quem CONSOME, não só quem DECLARA.**
> `grep -rn "custom:<tag>" config/dashboards/` antes de comentar a linha.

### 7.5 Rollback

- **Bundle:** em `config/configuration.yaml`, voltar para a linha `# ANTERIOR:`
  comentada logo acima.
- **Tudo desta entrega:** `git revert b0ceba1e`, ou voltar à tag
  `baseline-5e-fechada`.
- **Fase 5c isolada:** em `config/dashboards/views/bento_shell.yaml`, comentar o
  bloco `FASE 5c` e descomentar o `ANTERIOR` — mas os 6 módulos antigos saíram do
  `extra_module_url` na 5d; descomentar junto as 6 linhas marcadas
  `RETIRADO (Fase 5d.3)`.
- **Ações rápidas:** descomentar o bloco em `v2/bento_bottom_block.yaml` **e**
  devolver `grid-template-rows: calc(23vh - 24px) 54px`.
- **Grid da Home:** as revisões anteriores estão comentadas in-place (rev.3 a
  rev.5).

---

## 8. O que fazer a seguir — comece pela 6.0

**As fases 5c, 5d e 5e estão fechadas.** Não há pendência anterior. A próxima
ação é a **Fase 6.0 — baseline de runtime e carregador estável** (§8.3).

### 8.1 Antes da primeira linha de código

1. Rodar os comandos do §0 e confirmar que a árvore está limpa e o bundle bate.
2. Ler `docs/ROTEIRO-CONSOLIDADO-V3.md` (plano) e as armadilhas do §5 daqui.
3. Confirmar com o usuário o escopo da 6.0 antes de publicar qualquer coisa —
   editar e testar localmente não precisa de autorização; publicar precisa (§2.1).

### 8.2 Sequência completa

```
6.0  Baseline de runtime + carregador estável + sondagem das câmeras
 ↓
6.1  Estado seletivo e ciclo de vida
 ↓
6.2  Migração por módulo (decomposição + responsividade + retirada do CSS)
 ↓
6.2B Camera Engine
 ↓
6.3A Inventário e arquitetura mobile        ← ANTES da shell
 ↓
6.4  Registry e contratos (formaliza a 5e.0)
 ↓
6.5  Shell, rail e roteamento
 ↓
6.5B Implementação e validação mobile       ← DEPOIS da shell
 ↓
6.6  Home, popups e subviews especializadas
 ↓
7    Consolidação
```

**Por que o mobile é dividido:** inventário e requisitos podem vir antes, mas
navegação, preservação de estado e safe areas **se implementam sobre a shell
nova**. Fazê-los antes é retrabalho garantido.

### 8.3 Fase 6.0 — baseline de runtime e carregador estável

| # | ação |
|---|---|
| 6.0.1 | Instrumentação embarcada: renders por módulo, listeners, timers, subscriptions, requests, memória, long tasks |
| 6.0.2 | Coleta **no tablet** — o harness não reproduz WebView, memória nem CPU da VM |
| 6.0.3 | Baseline reproduzível, versionada, comparável entre builds |
| 6.0.4 | **Carregador estável** (`loader` + `manifest` → bundle com hash): recarregar a página basta, sem reiniciar o HA |
| 6.0.5 | Sondar a capacidade real das câmeras: existe WebRTC/go2rtc, ou só HLS transcodificado? |

**6.0.4 é prioridade:** hoje toda troca de bundle exige reiniciar o HA, e o
reinício é o evento correlacionado três vezes com o Corredor quebrando.

### 8.4 Fase 6.1 — estado seletivo e ciclo de vida

- o setter de `hass` passa a comparar **só as entidades que o módulo usa** — o
  registry já expõe `entities(instancia)` para isso;
- seletores de entidade por módulo, declarados na configuração;
- timers centralizados (hoje: relógio, câmeras e dock, cada um com o seu);
- suspensão de módulo invisível; limpeza no `disconnectedCallback`;
- teste de 50 ciclos de navegação com os contadores da 6.0;
- `triggers_update: all` é propriedade de **button-card**: o alvo é o que resta
  em YAML, não os componentes Lit.

**Aceite:** contadores voltam ao inicial após 50 navegações; sem crescimento
contínuo de memória; redução de renders medida contra a 6.0.

### 8.5 Fase 6.2 — migração por módulo

Decomposição, responsividade e retirada do CSS legado são **o mesmo trabalho**,
por módulo:

```
migrar um módulo =
  extrair o componente filho (compatível com o registry)
+ extrair a fatia de CSS, já com container query e escala fluida
+ remover essa fatia do bloco gerado
+ medir contra a baseline
```

Ordem: `room-status` → `lighting-dock` → `climate-card` → `media-hub` →
`camera-stage` → `room-hero` → `appliances`.

**Aceite por módulo:** funciona de 600 a 2000 px sem breakpoint por aparelho;
não depende mais da fatia legada; paridade a 1280×720 e 1920×1200, tema Josh.
**Aceite da fase:** `subview-styles.generated.ts` esvaziado.

### 8.6 Fase 6.2B — Camera Engine, com critérios separados

Comparar "stream vs snapshot" num número só mistura rapidez inicial com
qualidade e estabilidade da transmissão contínua. Oito métricas independentes:

| # | métrica |
|---|---|
| 1 | tempo até o primeiro snapshot |
| 2 | tempo até o primeiro frame ao vivo |
| 3 | estabilidade por 10, 30 e 60 minutos |
| 4 | número de reconexões |
| 5 | latência |
| 6 | CPU da VM |
| 7 | memória e rede |
| 8 | liberação do stream ao sair da view |

Estratégia: instantâneo imediato como placeholder **sempre**; stream **opt-in por
câmera**, decidido pela sondagem da 6.0.5; suspensão por invisibilidade; troca
palco↔PIP sem remontar.

**O resultado pode ser misto** — stream na câmera principal do cômodo ativo,
snapshot nas demais — e isso é conclusão legítima, não meio-termo.

**Contexto:** o streaming ao vivo (`hui-image` com `cameraView: 'live'`) já foi
implementado nesta migração e **regrediu** (o usuário relatou demora relevante).
São 8 câmeras Tuya via Xtend; o caminho realista é RTSP → HLS transcodificado na
VM. Se o stream perder de novo, o instantâneo permanece e isso é registrado como
decisão, não falha.

### 8.7 Fase 6.3A — inventário e arquitetura mobile

Inventário das V1/V2/V3 **antes de qualquer remoção**; contrato de modo explícito
(`DashboardMode`, não só `innerWidth`); requisitos de densidade, toque, safe
areas e câmera no mobile; classificação REUTILIZAR / MIGRAR / ARQUIVAR /
DESCARTAR. **Nenhuma remoção nesta fase.**

### 8.8 Fase 6.4 — registry, contratos e host adapter

Formaliza o que a 5e.0 e a 6.2 vêm construindo: `WidgetInstance`,
`WidgetDefinition`, `LayoutRepository`, `HostAdapter`. A **interface de edição**
(drag-and-drop, redimensionamento, painel do editor) fica para depois — a
estrutura, não.

### 8.9 Fase 6.5 — shell, rail e roteamento

Depois de estado, lifecycle e registry. Risco a evitar, nomeado: a shell virar o
novo monólito.

### 8.10 Fase 6.5B — implementação e validação mobile

Navegação mobile, preservação de estado entre views, safe areas, carregamento sob
demanda, validação em retrato e paisagem, retirada das V1/V2/V3 do caminho vivo.
A câmera no mobile herda a decisão da 6.2B: nunca múltiplos streams automáticos.

### 8.11 Fases 6.6 e 7

6.6: cards dinâmicos da Home → mídia e câmera da Home → popups → Roborock →
câmeras de segurança → planta 3D.
7: aposentar originais, retirar YAML legado, revisar `_archive`, retirar
rollbacks in-place consolidados, esvaziar o CSS gerado, consolidar Playwright,
congelar a arquitetura.

**Não migrar agora:** a shell inteira, a planta 3D, as câmeras de segurança.

---

## 9. O que NÃO está migrado

| item | linhas | fase |
|---|---|---|
| `bruno-shell.js` | — | 6.5 |
| `bento-sidebar-card.js` | — | 6.5 |
| Cards da Home (hero, energia, mídia, câmera, agenda) | — | 6.6 |
| Popups (Rede, Cenas, Config, Lavabo) | — | 6.6 |
| `bruno-cameras-security-subview.js` | 1.597 | 6.6 |
| `bruno-planta-3d-subview.js` | 2.204 | 6.6 |
| `bruno-roborock-subview.js` | 937 | 6.6 |
| Views mobile V1/V2/V3 | — | 6.3A / 6.5B |

---

## 10. Como se comunicar com este usuário

- Ele é iniciante em automação e HA; explicar com analogias e passo a passo,
  sem jargão desnecessário.
- **Não** repetir o que ele já sabe, não narrar status, não dizer "o que falta" —
  investigar e entregar.
- **Só** pedir validação sobre resultado provado por número.
- Quando ele apontar um defeito: **investigar a causa raiz** antes de propor
  correção. Ele reage mal a tentativa e erro, e com razão.
- Quando o diagnóstico contrariar o que ele pediu, dizer isso com a evidência —
  ele aceita fato, não aceita correção silenciosa do pedido errado.
- Se um defeito sobreviver a duas rodadas, **o método de investigação está
  errado**, não o esforço. Trocar de método, não repetir o mesmo.
