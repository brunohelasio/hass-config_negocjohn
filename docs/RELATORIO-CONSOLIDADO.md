# Relatório consolidado — reestruturação do dashboard Home Assistant

**Projeto:** dashboard pessoal do Home Assistant de Bruno Helásio (`negocjohn`)
**Repositório:** `C:\GitHub\hass-config_negocjohn\hass-config_negocjohn`
**Instância:** VM acessível por Samba em `\\192.168.3.102\config`
**Data deste relatório:** 2026-08-05
**Estado:** Fase 5c concluída e em produção. Próxima: Fase 6.1.

Este documento é autossuficiente. Serve para retomar o trabalho numa sessão nova,
com esta ou com outra IA, sem depender do histórico da conversa.

---

## 1. O pedido original e o que ele virou

O pedido foi uma **auditoria, limpeza e reestruturação arquitetural** do
dashboard, feita de forma incremental e reversível no repositório e na VM
existentes — não uma reescrita do zero.

**Arquitetura-alvo acordada:** TypeScript · Lit · Web Components · CSS modular com
tokens de design · Vite · Vitest · ESLint · Prettier. YAML permanece **só** onde o
Home Assistant realmente exige.

Duas peças da proposta original foram **recusadas com motivo registrado** (ver §7):
Zod e Playwright-na-Fase-4.

### 1.1 O problema que motivou tudo

O dashboard cresceu por acréscimo durante meses. O estado encontrado:

| medida | valor encontrado |
|---|---|
| Arquivos JS/YAML no caminho vivo | centenas, com três gerações de interface móvel empilhadas |
| As seis subviews de cômodo | **8.429 a 8.925 linhas cada** — 41.421 no total |
| Repetição literal entre elas | **86%** — só 5.876 linhas eram distintas |
| Métodos idênticos nas seis | 111 de ~120 |
| Regras de CSS idênticas nas seis | 620 |
| Pixels fixos no CSS | ~6.210 |
| Media queries | 157, com 6 breakpoints, calibradas num único tablet |
| Container queries | zero |
| Bitmap decodificado em memória | 64,3 MB contra ~253 MB disponíveis ao app |

Consequência prática: **qualquer ajuste num cômodo tinha de ser repetido seis
vezes**, e trocar de tablet desorganizava a tela.

---

## 2. Regras de trabalho impostas pelo usuário

Estas valem para qualquer sessão futura. Não são preferências — são condições.

1. **Nunca apagar código.** Comentar antes de substituir, com marcador de rollback
   in-place. Vale para todos os arquivos, sem exceção.
2. **Só entregar quando ele autorizar.** Nada de commit/merge por conta própria.
3. **Não mexer no funcionamento de sensores.** O escopo é `config/dashboards/`,
   `config/www/`, `dashboard-src/`. Se um sintoma vier de uma entidade do HA:
   diagnosticar e reportar, **nunca** editar `config/packages/`, templates de
   presença ou automações.
4. **Manter os assets antigos** intactos, caso ele volte a usá-los.
5. **Não mexer nas views mobile** — serão necessárias no ajuste de layout móvel.
6. **Consultar `docs/` ANTES de produzir**, não depois de errar. E **complementar
   esses documentos a cada rodada**.
7. **Só pedir validação sobre resultado medido.** Existe um banco de medição em
   `scripts/harness/`.
8. **Mudanças ficam locais.** Ele commita pelo GitHub Desktop; nunca dar `git push`
   sem pedido. (`docs/**` dispara um deploy público no GitHub Pages.)
9. **Não repetir status nem narrar o óbvio.** Investigar e entregar.

---

## 3. As fases — o que era, o que foi feito, resultado

### Fase 0 — Proteção · ✅ concluída
Checkpoint e backups antes de tocar em qualquer coisa.
- Tag `pre-dashboard-architecture` ancorada no commit `e0dc9da3`.
- Descoberta relevante: um commit de 179 arquivos apareceu entre duas chamadas de
  ferramenta — era o próprio usuário pelo GitHub Desktop, no meio da sessão. Isso
  virou uma regra permanente de operação.

### Fase 1 — Auditoria · ✅ concluída
Produziu `PRE_MIGRATION_AUDIT.md`: 4 defeitos medidos e riscos R1–R10.
Commit: `92c45cb7`.

### Fase 2 — Documentação · ✅ concluída
17 documentos, `docs/00` a `docs/16`. É a base de conhecimento do projeto.
Commit: `d459dc9c`.

| doc | conteúdo |
|---|---|
| `00-project-overview.md` | visão geral |
| `01-current-architecture.md` | arquitetura encontrada |
| `02-file-inventory.md` | inventário de arquivos |
| `03-active-entrypoints.md` | o que realmente carrega |
| `04-dashboard-components.md` | componentes |
| `05-rooms-and-devices.md` | cômodos e entidades |
| `06-home-assistant-integrations.md` | integrações |
| `07-design-system.md` | tokens, Hugeicons, material dos temas |
| `08-performance-tablet.md` | memória e render no tablet |
| `09-known-issues.md` | defeitos conhecidos |
| `10-successful-implementations.md` | o que deu certo |
| `11-failed-experiments.md` | o que falhou e por quê |
| `12-migration-plan.md` | plano de migração e registro das fases |
| `13-testing-and-validation.md` | como medir e validar |
| `14-deployment-and-cache.md` | publicação e cache-bust |
| `15-decisions-log.md` | decisões com consequência arquitetural |
| `16-ai-working-guide.md` | guia de trabalho para IA |

### Fase 3 — Isolamento do legado · ✅ concluída
**195 arquivos** movidos para `_archive/`, com **zero mudança no caminho alcançável**.
Commit: `6895e2eb`.

```
_archive/
├── legacy/       189 arquivos
│   ├── bento-grid/          ├── mobile-v1/
│   ├── button-card/         ├── mobile-v2/
│   ├── mat-interface/       ├── mobile-v3/
│   ├── negocjohn/           ├── popup-navigation/
│   └── yaml-layout-card/
├── deprecated/    12 arquivos
└── experiments/    4 arquivos
```

Cada pasta tem `README.md` e `original-path` — dá para restaurar qualquer arquivo
no lugar exato de onde saiu.

### Fase 4 — Fundação técnica · ✅ concluída
`dashboard-src/` com Vite, TypeScript estrito, Vitest, ESLint, Prettier.
Commit: `f82880ad`. Exigiu instalar Node.js 24.18.1 LTS na máquina.

Ganho imediato e inesperado: a primeira checagem sintática do projeto
(`node --check`) — o detector correto para o **erro da crase**, que já havia
derrubado o dashboard quatro vezes (ver §6.1).

### Fase 5a — Piloto: um tile de cômodo · ✅ concluída
Um tile pela arquitetura nova, renderizado **ao lado** dos antigos para comparação.
Commits: `426dc184` → `4f6ab280`.
Resultado: paridade geométrica medida contra o card real do Office.

### Fase 5b — A faixa de cômodos da Home · ✅ concluída e validada pelo usuário
**8 tiles → 1 componente** (`bruno-room-tile.ts`).
Commits: `d1761282`, `6755797c`, `83242cb6`.
Os 8 cômodos foram medidos **de uma vez** e as 3 diferenças reais tratadas.

### Fase 5c — As seis subviews de cômodo · ✅ concluída (2026-08-05)
**Seis arquivos de ~8.900 linhas → um componente parametrizado.**

```yaml
# config/dashboards/views/bento_shell.yaml
type: custom:bruno-room-subview
room: sala        # sala | office | cozinha | casal | marina | miguel
```

O detalhamento está em §4.

### Fase 6.1 — Performance no tablet · 🔜 **PRÓXIMA**
Parcialmente antecipada: os assets de cômodo já foram redimensionados
(64,3 MB → 9,6 MB de bitmap decodificado, commit `a3c74960`).
Falta: `triggers_update: all`, re-render total, 316 listeners.

### Fase 6.2 — Independência de resolução · 🔜
**Critério de aceitação da arquitetura**, decidido em 2026-08-02 depois que o
usuário relatou que trocar o Galaxy Tab S6 Lite (2000×1200) pelo Redmi Pad 2
(2560×1600) desorganizou o dashboard.
Alvo: container queries e escalas fluidas, funcionando de 600 a 2000 px sem
breakpoint próprio. A WebView do tablet é Chrome 150 — container queries entraram
no Chrome 105, então não há fallback legado a manter.

### Fase 7 — Consolidação · 🔜
Aposentar o legado, limpar `_archive/`, documentação final, e só aqui entra o
Playwright (regressão de layout).

---

## 4. Fase 5c em detalhe

### 4.1 O que foi criado

| arquivo | linhas | o que é |
|---|---|---|
| `dashboard-src/src/components/rooms/bruno-room-subview.ts` | 2.288 | o componente |
| `dashboard-src/src/components/rooms/subview-styles.generated.ts` | 5.266 | CSS **gerado**, cobertura medida de 100% |
| `dashboard-src/src/config/subviews.config.ts` | 745 | configuração dos 6 cômodos, **gerada** |
| `dashboard-src/src/config/rooms.config.ts` | 421 | configuração dos tiles (Fase 5b) |
| `scripts/validation/gen-subview-css.mjs` | — | gera o CSS a partir dos originais |
| `scripts/validation/gen-subview-config.mjs` | — | gera a configuração |
| `scripts/validation/extract-subview-config.mjs` | — | extrai as `DEFAULT_CONFIG` |
| `scripts/validation/check-backtick.mjs` | — | detector da crase (ver §6.1) |
| `scripts/harness/gen-subview-harness.mjs` | — | gera a página de medição |
| `scripts/harness/serve-harness.mjs` | — | servidor estático da medição |
| `scripts/harness/subview-baseline.json` | — | linha de base geométrica |

**Nada foi transcrito à mão.** Configuração e CSS saem de script, com conferência
de cobertura — são 58 chaves por cômodo e 670 regras de CSS. Na Fase 5a uma
transcrição manual fez o Q. Casal apontar para um arquivo órfão; virou regra.

### 4.2 Como o componente resolve as diferenças entre cômodos

A estrutura é **uma só**. O que varia entra por atributo no host, e o CSS gerado
já vem escopado por esse atributo:

| atributo | significado |
|---|---|
| `data-room="<id>"` | sobreposição do cômodo (o grid próprio da Cozinha) |
| `data-tvhub` | hub com TV — cinco cômodos |
| `data-appliances` | eletrodomésticos — só a Cozinha |
| `data-ps5` | entrada de PS5 no menu — **só a Sala** |

### 4.3 Módulos ligados

- **Barra superior** — 6 badges (Presença, Luzes, Temperatura, Umidade, Roteador,
  Zigbee) + relógio com ciclo próprio.
- **Hero** — foto do cômodo com o dock de cortina sobreposto.
- **Câmeras** — instantâneo de `/api/camera_proxy/`, ciclo de 6,5 s com pré-carga
  fora da árvore; PIP clicável que promove a câmera ao palco; menu com os três
  interruptores (som, movimento, privacidade).
- **Hub de mídia** — acordeão de duas fontes. TV (volume, pausar, controle remoto,
  apps) ou PC no Office (sleep/reiniciar/desligar/bloquear/sessão), mais Spotify
  (faixa, artista, progresso, volume, transporte, painel de ferramentas).
  PS5 no menu de três pontos, só na Sala.
- **A/C** — gauge semicircular de 180° (90 marcas externas, 72 internas, 5
  legendas, arco aceso, marcador, alvo e ambiente), botão de power, botão de
  detalhes e três controles com popover (Modo, Ventilação, Swing).
- **Dock de iluminação** — faixa de 54 px que abre para cima, com as células de luz
  por zona.
- **Eletrodomésticos** (Cozinha) — 5 tiles com PNG do aparelho.

### 4.4 O único desvio deliberado da origem

Os seis arquivos originais nasceram de uma cópia do da Sala e **todos** rotulam a
fonte de TV como "TV da sala" — inclusive o Q. Miguel, onde é falso. Só a Sala tem
entidade de TV. Fora da Sala o rótulo passou a ser "TV". Está marcado no código
com comentário próprio.

### 4.5 Medição final (critério de aceite)

Subview atual e componente novo montados **na mesma página, no mesmo instante**,
com o tema **Josh** aplicado:

| resolução | campos | divergências |
|---|---|---|
| 1920×1200 (tablet) | 461 | 3 |
| 1280×720 | 461 | 3 |

As 3 são sempre o mesmo desvio de rótulo do §4.4.

Campos medidos: geometria de 13 módulos, textos das seis badges, rótulos dos
botões do hub e dos controles do A/C, fontes do acordeão.

Interação verificada: acordeão abre e fecha; popover de Modo abre com 5 opções e
dispara `climate.set_hvac_mode`; power dispara `climate.turn_off`; tocar no PIP
promove a segunda câmera; menu de câmeras abre 3 controles; botão do Spotify
dispara o evento do SpotifyPlus Card com a carga correta.

---

## 5. Ganho estrutural até aqui

| dimensão | antes | agora |
|---|---|---|
| Subviews de cômodo | 6 arquivos, 41.421 linhas | 1 componente, 2.288 linhas + CSS gerado |
| Faixa de cômodos da Home | 8 tiles em YAML | 1 componente |
| Ajuste num cômodo | repetir 6 vezes à mão | 1 lugar |
| Configuração dos cômodos | espalhada em 6 `DEFAULT_CONFIG` | 2 arquivos tipados, gerados |
| Linguagem | JavaScript solto, sem build | TypeScript estrito, Lit, Vite |
| Verificação | nenhuma | typecheck + lint + testes + build num comando |
| Erro de sintaxe | derrubava o dashboard silenciosamente | pego antes de publicar |
| Arquivos legados no caminho vivo | 195 | 0 (isolados em `_archive/`) |
| Bitmap decodificado | 64,3 MB | 9,6 MB |
| Cache-bust | `?v=` manual em cascata | hash de conteúdo do Vite |

**A mudança de linguagem não é cosmética.** Três dos defeitos mais caros deste
projeto — a crase em template literal, a configuração transcrita à mão, o CSS
duplicado que divergia entre cômodos — deixaram de ser possíveis por construção:
o build falha, a configuração é gerada, o CSS é um só.

---

## 6. Problemas identificados, resolvidos e documentados

Esta seção existe para que os mesmos erros não voltem. Cada item tem a causa real,
não o sintoma.

### 6.1 A crase dentro de template literal — **8 ocorrências**

Uma crase não escapada dentro de um **comentário** que vive dentro de um template
literal fecha a string. O módulo para de compilar e o sintoma aparece longe da
causa. Em 2026-07-29 as seis subviews voltaram ao tema errado por causa de uma.

Detectores que **não** serviram, e por quê:

| tentativa | por que falhou |
|---|---|
| paridade de crases no arquivo | a espúria vem em par — o total continua par |
| `grep` por palavras do bloco novo | a crase estava numa linha sem nenhuma delas |
| 1ª versão do script | acusava crase **escapada**, que é legítima |
| 2ª versão | lia `http://` dentro de template como início de comentário |
| 3ª versão | não rastreava aspas e **se acusava sozinha** |

O detector atual rastreia quatro estados — template literal, comentário de linha,
comentário de bloco e string entre aspas — e cobre comentário de JS, de CSS e de
HTML. Verificado nos dois sentidos: acusa um arquivo-isca e passa limpo nos 75
arquivos do projeto.

```bash
node scripts/validation/check-backtick.mjs --tudo
```

**Regra:** em comentário dentro desses arquivos, usar aspas retas ou descrever em
palavras. Nunca crase.

### 6.2 Paridade geométrica não é critério de aceite suficiente

A Fase 5c publicou uma tela com a **geometria exata** e os módulos **vazios**.
Geometria mede caixas — e uma caixa vazia mede igual a uma cheia.

Correção: o banco de medição ganhou `window.conteudo()` e `window.inspecao()`, que
contam conteúdo por módulo (fontes do hub, filhos e altura do corpo, arcos e
marcas do anel, tag do botão de power, feeds e PIP, PNGs, glifos).

Duas armadilhas de medição anotadas junto:
1. **O glifo vive no shadow root.** `querySelectorAll('.lc-icon svg')` devolve zero
   mesmo com o ícone desenhado. Contar sem atravessar o shadow root produz um
   falso defeito — quase virou uma "correção" de um problema inexistente.
2. **O ícone genérico tem assinatura.** Um `bruno-icon` com nome fora da tabela de
   apelidos desenha **um único `<circle>`**. Um resolvido desenha `path` ou `g`.
   Isso torna o diagnóstico objetivo.

### 6.3 Medir no tema e na resolução do tablet

O banco sobe com o tema padrão (`liquid-glass`) e o viewport do navegador. O
tablet usa **Josh** em **1920×1200**.

Um defeito real do A/C — cartão 49 px mais estreito por causa de uma coluna
nomeada inexistente — era **invisível a 1280×720** e saltava a 1920×1200. Eu
declarei "461 campos idênticos" medindo na resolução errada, e o usuário achou o
defeito no tablet.

```js
localStorage.setItem('bruno-ui-theme', 'josh');
BrunoThemeManager.apply('josh');
// e redimensionar para 1920x1200 antes de medir
```
Confirmar no host: `data-bruno-subview-surface-theme="josh"`. Com `default`, você
está medindo sem a pele do tema.

### 6.4 O gerador de CSS e a cascata — três correções

O gerador reproduz a cascata dos arquivos originais. Errou três vezes, cada uma
com um sintoma diferente:

| # | erro | sintoma | correção |
|---|---|---|---|
| 1 | emitia **uma** definição por seletor (a primeira, depois a última) | a raiz media 12 px; o dock ficou 29 px mais alto | `fundir()` — a cascata funde propriedade a propriedade, não troca a regra inteira |
| 2 | emitia na posição da **primeira** aparição | uma regra de grupo posterior sobrescrevia `.light-grid`, e o toggle encostava na borda | `emOrdemDeUltimaAparicao()` |
| 3 | ao fundir, uma declaração **morta** viajava para depois de quem a matou | `.ac-card` recebia `grid-column: ac` — coluna inexistente — e saía 49 px estreito | `anuladaDepois()` — descarta o que a cascata original já tinha matado |

O caso 3 em detalhe, porque é sutil: o arquivo original define
`.ac-card { grid-area: ac }` cedo, num bloco de layout legado, e **cancela** isso
depois com `.hero-panel, …, .ac-card, .curtain-card { grid-area: auto }`. Mais
adiante volta a definir `.ac-card` com outras propriedades. Como a fusão emite a
regra na última aparição, o `grid-area: ac` viajava junto e passava a vencer o
`auto` — o inverso da cascata original.

Outros dois guardas no gerador: `escopar()` não entra em `@keyframes` (um seletor
inválido ali matava a folha inteira) e `ehRaiz()` impede que a classe raiz caia
num bloco de recurso (o grid da Sala saiu rotulado como "PS5 CSS").

### 6.5 Erros de leitura da origem — corrigidos e registrados

| erro | causa | onde ficou registrado |
|---|---|---|
| Receita do ponto copiada de um bloco **comentado** | os cards guardam tentativas já recusadas em comentário | memória `nao-copiar-de-bloco-comentado` |
| `mdi:` traduzido por conta própria | **os ícones são Hugeicons**; `mdi:` são apelidos de uma tabela de 179 entradas | `docs/07-design-system.md` |
| Raiz como `<div>` em vez de `<main>` | `main::before` é quem desenha a moldura, os filetes, o scrim e o blur da faixa | `docs/07-design-system.md` |
| `hui-image` com `cameraView: 'live'` | negocia stream; a origem usa instantâneo do proxy | §4.3 |
| Botão "Tocar" inventado no Spotify | não existe; a origem oferece **escolha de dispositivo** (SpotifyPlus Card) | §6.6 |
| Comandos do PC com `homeassistant.toggle` | são entidades do domínio `button` — `press` | §6.6 |
| Id de entidade tratado só como texto | pode ser **lista de candidatos** (o A/C do Q. Marina tem onze nomes) | §6.6 |
| Regra do acordeão igual nos seis | difere: no Office o Spotify tem precedência | §6.6 |

### 6.6 Defeitos da Fase 5c relatados pelo usuário e resolvidos

| # | sintoma | causa |
|---|---|---|
| 1 | Hub de mídia sem conteúdo, acordeão inerte | só o cabeçalho era renderizado; sem corpo e sem tratador de clique |
| 2 | A/C sem anel e sem power | `icg-root` com `<svg>` vazio; `ac-power-floating` como `<div>` vazio |
| 3 | "Eletrodomésticos" com círculo no lugar do ícone | `mdi:silverware-fork-knife` não está na tabela; a origem usa `mdi:home-lightning-bolt-outline` |
| 4 | Câmera demorando a renderizar | `hui-image` ao vivo em vez do instantâneo do proxy |
| 5 | Cozinha sem a câmera PIP | eu lia ids soltos em vez de `entities.cameras`, que traz nome e controles |
| 6 | Botão "Ligar" no Spotify dando erro | botão inexistente na origem; devia ser **Dispositivos** abrindo o SpotifyPlus Card |
| 7 | Largura do A/C mudando ao ligar/desligar | bug do gerador de CSS — §6.4, caso 3 |

Achados durante a medição e corrigidos junto: A/C do Q. Marina mostrando `--`
(lista de candidatos); Office abrindo o PC em vez do Spotify; comandos do PC
inertes; data da barra superior 30 px mais larga que a origem (`toLocaleDateString`
em pt-BR devolve " de " e ponto final); badge de luzes como total em vez de por
zona; grau usando o ordinal masculino U+00BA em vez de U+00B0.

### 6.7 Correlação registrada: o Corredor

Três vezes o Corredor quebrou junto com uma entrega. Não há causa provada.
Procedimento: evitar reinício desnecessário do HA, **conferir o Corredor após cada
entrega que exija reinício**, e desfazer antes de investigar.

---

## 7. Decisões arquiteturais com consequência

Registro completo em `docs/15-decisions-log.md`. As de maior impacto:

| data | decisão | motivo |
|---|---|---|
| 2026-06-24 | A shell (`custom:bruno-shell`) vira o painel padrão | view única + `type: panel` + navegação por hash mantém a rail viva |
| 2026-06-24 | Remover `resources:` do `ui-lovelace-main.yaml` | o tablet baixava cada módulo **duas vezes** |
| 2026-08-02 | **Não** adotar Zod | valida formato, não existência da entidade — que é a falha real quando algo é renomeado. No lugar: verificação em `hass.states` na camada de diagnóstico |
| 2026-08-02 | Playwright só na Fase 7 | roda Chromium no computador; tudo o que quebra aqui quebra no **tablet**. Verde no desktop cria confiança falsa |
| 2026-08-02 | Independência de resolução vira critério de aceitação | breakpoints se multiplicam por aparelho **e** por arquivo duplicado. Não escala |
| 2026-08-02 | Container queries como mecanismo primário | WebView do tablet é Chrome 150; container queries entraram no 105 |
| 2026-08-02 | `npm run deploy` publicando direto no `/config` | sem isso a arquitetura nova acrescentaria build **e** manteria a cópia manual |
| 2026-08-05 | O CSS migrado é **gerado**, nunca transcrito | 670 regras por cômodo; transcrição manual já produziu um arquivo órfão |

---

## 8. O que está separado para exclusão futura

**Nada foi excluído.** Tudo abaixo está isolado e reversível.

| item | onde | condição para excluir |
|---|---|---|
| 195 arquivos legados | `_archive/` com `original-path` | Fase 7, após o legado ser aposentado |
| 14 assets de cômodo em resolução antiga | ainda no lugar | só aparecem em comentários de rollback |
| Views mobile V1/V2/V3 | ainda incluídas como fallback | **o usuário pediu para manter** — necessárias no ajuste de layout móvel |
| `.git` adormecido na VM (65 MB) | renomeado, não apagado | excluir a partir de 2026-08-09 se nada quebrar |
| `Hemma-main` na VM (6 MB) | renomeado | idem |
| `views/main.yaml` + 39 arquivos de `main-grid/` | ainda parseados a cada carregamento | Fase 7 |
| Os 6 arquivos originais de subview | no disco e carregados | **manter até a Fase 5c ser validada por uso** — são o rollback de um comando |

---

## 9. Estado atual — como está publicado

```
Repositório e VM sincronizados.
Bundle em produção: config/www/dashboard/bruno-dashboard.uIhLousp.js
Referenciado em:    config/configuration.yaml → frontend.extra_module_url
```

**Trocar o bundle exige reinício do Home Assistant.**

### 9.1 Arquivos alterados e ainda não commitados

```
 M CLAUDE.md
 M config/configuration.yaml
 M dashboard-src/src/components/rooms/bruno-room-subview.ts
 M dashboard-src/src/components/rooms/subview-styles.generated.ts
 M docs/12-migration-plan.md
 M docs/13-testing-and-validation.md
 M scripts/harness/gen-subview-harness.mjs
 M scripts/validation/gen-subview-css.mjs
```

### 9.2 Rollback

**Do bundle:** em `config/configuration.yaml`, voltar para a linha `# ANTERIOR:`
comentada logo acima.

**Da Fase 5c inteira:** em `config/dashboards/views/bento_shell.yaml`, comentar o
bloco `FASE 5c` e descomentar o `ANTERIOR` logo abaixo. Os seis arquivos originais
seguem no disco e carregados — é um comando, sem reinício.

---

## 10. Ferramentas de verificação

```bash
# antes de publicar qualquer coisa
cd dashboard-src && npm run check      # typecheck + lint + testes + build

# a armadilha da crase — 8 ocorrências neste projeto
node scripts/validation/check-backtick.mjs --tudo

# regenerar o que é gerado (nunca editar os arquivos .generated à mão)
node scripts/validation/gen-subview-css.mjs      # CSS + cobertura
node scripts/validation/gen-subview-config.mjs   # configuração dos cômodos

# banco de medição
node scripts/harness/gen-subview-harness.mjs
node scripts/harness/serve-harness.mjs scripts/harness/subview-parity.html 8199
#   no navegador, com o tema Josh e 1920x1200:
#     montar(0..5)      -> subview atual
#     montarNovo(0..5)  -> componente novo, mesma célula
#     inspecao()        -> conteúdo dos seis, módulo a módulo

# includes do YAML
perl scripts/validation/check-includes.pl .
```

---

## 11. Próximas etapas

### 11.1 Ajustes pontuais pendentes (não são fase)

| # | item | nota |
|---|---|---|
| A1 | Validação visual da 5c no tablet | os módulos foram medidos, mas quem vê a tela é o usuário |
| A2 | Espaçamento da rail + tamanho dos badges superiores | agrupados: os dois mexem na largura herdada pelas subviews |
| A3 | `switch.macbook` não existe | 5 referências vivas em packages — **fora do escopo de dashboard**, só reportar |
| A4 | `idle_time` do PC reportando 4h33m com o PC em uso | idem |
| A5 | Assets V3 a trocar | — |
| A6 | Botão "Apps" da TV | implementado a partir de `tvApps` da configuração; na origem era um botão morto. Sinalizar se não for desejado |

### 11.2 Fase 6.1 — Performance no tablet · **próxima**

Alvos medidos na auditoria:
- `triggers_update: all` — cada card re-renderiza a qualquer mudança de estado de
  qualquer entidade;
- re-render total em vez de reconciliação;
- 316 listeners;
- (já feito) 64,3 MB → 9,6 MB de bitmap decodificado.

O componente novo já usa Lit, que reconcilia — parte do ganho vem de graça à medida
que a migração avança. O que sobra é o YAML/button-card ainda vivo.

### 11.3 Fase 6.2 — Independência de resolução

Requisito do usuário, com critério de aceitação definido: funcionar de **600 a
2000 px sem breakpoint próprio**. Hoje são ~6.210 px fixos e 157 media queries
calibradas num único tablet.

Caminho: tokens de escala fluida + container queries. O `dashboard-src/src/styles/tokens/scale.ts`
já existe como semente. **Todo componente migrado deve nascer com container query** —
senão os px fixos atravessam a migração para dentro do TypeScript.

### 11.4 Fase 7 — Consolidação

- Aposentar os 6 arquivos originais de subview e os 8 tiles de YAML;
- Aposentar `views/main.yaml` e os 39 arquivos de `main-grid/`;
- Limpar `_archive/`;
- Playwright para regressão de layout;
- Documentação final.

### 11.5 O que ainda não foi migrado

| item | estado |
|---|---|
| `bruno-cameras-security-subview.js` (1.597 linhas) | JS solto |
| `bruno-planta-3d-subview.js` (2.204 linhas) | JS solto |
| `bruno-roborock-subview.js` (937 linhas) | JS solto |
| `bruno-shell.js` | JS solto — é o esqueleto de tudo |
| `bento-sidebar-card.js` | JS solto — a rail |
| Cards da Home (hero, energia, mídia, câmera, agenda…) | JS solto |
| Popups (Sistema, Rede, Cenas, Config, Lavabo) | JS solto |

A ordem sugerida é a mesma que funcionou até aqui: **medir primeiro, migrar
depois, um bloco coeso por vez**, com o componente novo ao lado do antigo até a
medição fechar.

---

## 12. Como retomar

1. Ler este relatório e `docs/16-ai-working-guide.md`.
2. Ler `docs/15-decisions-log.md` — as decisões já tomadas não se re-litigam.
3. Antes de tocar em CSS ou configuração migrada: conferir se aquilo é **gerado**.
   Se for, editar o **gerador**, nunca o arquivo.
4. Antes de dizer que algo bate: medir, com o tema **Josh** e em **1920×1200**
   além do breakpoint menor.
5. Antes de publicar: `npm run check` e `check-backtick.mjs --tudo`.
6. Depois de publicar algo que exija reinício do HA: conferir o Corredor.

---

## 13. Revisão final da Fase 5c — lista de 7 itens (2026-08-05)

Lista entregue pelo usuário para fechar a 5c antes das fases 6.1, 6.2 e 7.
Bundle desta rodada: `bruno-dashboard.ClNDMbAL.js`.

| # | item | estado |
|---|---|---|
| 3 | Layout shift ao abrir o card de iluminação | ✅ resolvido e medido |
| 4 | Ícones dos botões de iluminação maiores | ✅ resolvido e medido |
| 6 | Dots de status da Home | ⚠️ **diagnosticado — não era regressão**; um buraco real corrigido |
| 1 | Espaçamento entre rail e conteúdo | 🔜 medido, não implementado |
| 2 | Tamanho e posição dos status superiores | 🔜 as duas geometrias comparadas |
| 5 | Spotify Plus Card | 🔜 não iniciado |
| 7 | Spotify por ambiente | 🔜 não iniciado |

### 13.1 Item 3 — layout shift ✅

**Causa:** o corpo abre animando a linha do grid de `0fr` para `1fr`. Enquanto a
linha cresce, o teto de altura do contêiner de rolagem vale quase zero, o
conteúdo transborda, o navegador mostra a barra — que **rouba largura**, encolhe
as duas colunas, e devolve tudo ao fim da animação.

**Correção (duas medidas, ambas necessárias):**
1. `scrollbar-gutter: stable` — a largura útil deixa de depender da barra;
2. rolagem só **depois** de assentar: classe `is-settled` aplicada 240 ms após o
   toque (200 ms de transição + 40 ms de folga de composição). Durante a
   abertura o transbordo é apenas recortado.

**Medido:** seis amostras entre 30 ms e 400 ms após o toque — largura do grid e
da célula **318 px constante** nas seis. `overflow-y` sai de `hidden` e vira
`auto` na amostra de 300 ms, como projetado.

### 13.2 Item 4 — ícones de luz ✅

De 26 px para **32 px**, medido na caixa renderizada.

Por que os dois aumentos anteriores não pegaram: a camada interna e o SVG são
`100%` do pai. Aumentar só a largura deixava o SVG **sem altura** e ele colapsava.
Agora largura **e** altura sobem juntas, e a coluna da célula acompanha.

### 13.3 Item 6 — dots da Home ⚠️ o diagnóstico contraria o pedido

**Não é regressão.** O componente reproduz o card original: em ambos, só os dots
**ativos** são renderizados (`dots.filter(d => d.active)`). A versão que desenha
todos, apagados e acesos, existe nos arquivos originais mas está dentro de um
**bloco de rollback comentado** — não é o caminho vivo.

Os dots que não acendem não acendiam antes: **não têm entidade na configuração,
nem tinham no card original**.

| cômodo | dots sem entidade | existe entidade no sistema? |
|---|---|---|
| Q. Casal | TV, Clima | TV não; **Clima sim** |
| Q. Marina | TV | não |
| Q. Miguel | TV, Mídia | não (sem Alexa no cômodo) |
| Cozinha | Máquina de lavar, Air fryer | não (sem tomada monitorada) |

**Buraco real corrigido:** o Clima do Q. Casal. `climate.qc_ar_condicionado`
existe e é usado pela subview; o dot estava sem entidade no card original. Agora
acende como nos demais quartos.

**Decisão necessária do usuário:** se ele quiser os quatro dots **sempre
visíveis** (apagados quando inativos), isso é uma **mudança de comportamento**,
não uma restauração — e vale para os 8 tiles. É uma linha (`.filter` → marcar
`is-active`), mas muda a leitura da Home inteira.

### 13.4 Item 1 — espaçamento rail/conteúdo 🔜

**Medido:** a shell é `grid-template-columns: 86px minmax(0, 1fr)` com `gap: 0` e
`padding: 0`; o respiro inteiro está no `.content-slot`, com `padding: 12px`
(`bruno-shell.js`).

**Caminho:** reduzir o `padding-left` do `.content-slot` isoladamente (não o
padding inteiro — o direito e o superior sustentam o alinhamento atual). O ganho
se distribui sozinho: na Home a faixa de tiles é `1fr`; nas subviews a coluna
direita (iluminação + A/C) é a que absorve, porque a esquerda é `1fr`.

**Cuidado:** a subview mede a si mesma contra essa largura. Depois de mexer,
**remedir os 461 campos nas duas resoluções** — a mudança atravessa os seis
cômodos.

### 13.5 Item 2 — status superiores 🔜

As duas geometrias, lado a lado:

| | Home (`bruno-top-badges-card.js`) | Subview (topband) |
|---|---|---|
| host | `height: 48px` | linha de grid de 48px |
| badge | `height: 46px` | `height: 46px` |
| colunas | `22px auto` | `22px auto` |
| gap | `8px` | `9px` |
| padding | `0 13px` | `0 16px` |
| pele | **pílula** (borda + fundo + sombra) | **flat**, sem pílula |
| ícone | `--mdc-icon-size: 18px` | herdado |

Os 46 px dentro de 48 px centralizam igual nos dois. Portanto **o deslocamento de
alguns pixels não está no card** — está na linha do grid da Home que o hospeda.
Falta medir a Home montada; o banco de medição atual só monta subviews.

**Próximo passo concreto:** estender `gen-subview-harness.mjs` para montar também
a seção Home, e comparar o topo dos dois `.tb-badge` contra a mesma origem.

### 13.6 Itens 5 e 7 — Spotify 🔜 não iniciados

**Item 5 — o card.** O botão de escolha de dispositivo já dispara o evento certo
(`ll-custom` com `bruno_action: 'spotify'`, `deviceDefaultId`, `mode: 'devices'`),
verificado nesta sessão. O erro relatado (arte aparece, dá erro, interrompe a
reprodução e volta) acontece **depois**, em quem consome o evento — o painel do
SpotifyPlus na shell. É lá que a investigação começa, não no componente.

**Item 7 — Spotify por ambiente.** Hoje o card expandido aparece em **todas** as
subviews porque todas leem a mesma entidade
(`media_player.spotifyplus_bruno_helasio`) — uma conta só. A origem já tem a peça
que resolve: `_spotifySourceMatchesRoom()`, que compara o dispositivo ativo com o
`spotifyDeviceName` do cômodo, e `_spotifySpeakerMatchesRoom()`, que confere o
Echo local. **Eu não portei esses dois métodos** — o meu `_modeloSpotify` só olha
o estado global. É essa a causa, e a correção é portá-los.

Fica em aberto, como o usuário levantou: o que fazer quando ele troca o
dispositivo pelo próprio card. Como a conta é única, trocar o alvo move o card
expandido de cômodo. É decisão de produto, não de código.

### 13.7 Segunda rodada — o ícone da luz, o dot de mídia e o Spotify por cômodo

Bundle: `bruno-dashboard.p0dzlndD.js` · shell: `?v=20260805-rail-gap-1`.

#### Item 4 — a causa raiz do ícone pequeno (três tentativas antes desta)

`bruno-icon` se dimensiona no próprio shadow root:

```
width:  var(--mdc-icon-size, 1em);
height: var(--mdc-icon-size, 1em);
```

**Nada na cadeia da célula de luz definia `--mdc-icon-size`.** O glifo caía no
fallback `1em` — o tamanho da fonte herdada, medido em **12px** — dentro de uma
caixa muito maior. Por isso aumentar a caixa nunca mudou nada.

Tentativas que falharam, e por quê:

| tentativa | por que não funcionou |
|---|---|
| aumentar `.lc-icon` | mexe na CAIXA, não no glifo |
| aumentar `.tpl-light-icon` | idem, é só o invólucro |
| regra `.tpl-light-icon svg` | **não casa nada** — o `<svg>` vive dentro do shadow root do `bruno-icon`, e seletor descendente não atravessa shadow root |

**O que funciona:** a propriedade customizada, que atravessa o shadow root por
herança — o mecanismo para o qual o `bruno-icon` foi escrito.

```css
.lc-icon bruno-icon { --mdc-icon-size: 30px; width: 30px; height: 30px; }
```

**Medido**, alcançando o shadow root: `glifoSvg: [30, 30]` contra os 12px de
antes. A mesma armadilha vale para MEDIR: contar SVG por seletor descendente
devolve zero mesmo com o ícone desenhado.

#### Item 6 — o dot de mídia, agora com a leitura certa

O pedido era específico: **o dot de mídia não acende no cômodo onde a Alexa está
tocando**. A causa: quando o Spotify toca através do Echo por Spotify Connect, a
entidade do Echo continua em `standby` — a integração da Alexa não vê esse áudio.
Quem vai para `playing` é a entidade do Spotify.

O ponto ganhou uma segunda via: `spotifyDevice` no `RoomDot`. Ele acende pelo
Echo **ou** quando o Spotify está tocando e o dispositivo ativo é o do cômodo.

#### Item 7 — Spotify por ambiente

Mesma raiz. Novo módulo `services/entities/spotify-device.ts`, transportado de
`_normalizeMediaDevice` / `_spotifySourceMatchesRoom` / `_spotifySpeakerMatchesRoom`
das subviews atuais — os três métodos que eu não havia portado na 5c.

Duas provas, e basta uma: o dispositivo publicado pelo Spotify é o do cômodo, ou
o Echo do cômodo está tocando a mesma faixa. **13 testes** cobrindo nome com
acento e sufixo, cômodo errado, nome curto genérico e o caminho do alto-falante.

Com isso o card expandido aparece só na subview do dispositivo que está tocando.

#### Item 1 — espaçamento rail/conteúdo

`.content-slot` em `bruno-shell.js`: `padding: 12px` → `padding: 12px 12px 12px 6px`.
Só o lado esquerdo — os outros três sustentam o alinhamento do topo, da direita e
da base.

**Onde o ganho cai:** na resolução do tablet as duas colunas da subview são
fracionárias, então os 6px se distribuem pela proporção atual (~71% / 29%).
Levar a maior parte para a coluna direita, como o usuário pediu, é **mudar a
proporção** — decisão visual que precisa do olho dele, não do medidor.

#### Item 2 — status superiores: ainda aberto

As duas geometrias já estão comparadas em §13.5. O deslocamento não está no card;
está na linha do grid da Home que o hospeda, e o banco de medição só monta
subviews. Próximo passo: estender o banco para montar a seção Home.

#### Item 5 — Spotify Plus Card: ainda aberto

O botão dispara o evento correto (verificado). O erro está em quem consome —
o painel do SpotifyPlus na shell.
