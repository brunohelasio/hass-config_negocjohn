# 00 — Visão geral do projeto

> Documento de entrada. Se você é uma IA começando a trabalhar neste projeto,
> leia este arquivo e depois [`16-ai-working-guide.md`](16-ai-working-guide.md).

## O que é

Dashboard pessoal de Home Assistant para um apartamento, operado principalmente
num **tablet em modo quiosque** (Fully Kiosk) e secundariamente em celular e
computador. A interface visual é inspirada em **Josh.ai, visionOS e iOS**.

O repositório **é o próprio diretório `/config`** do Home Assistant, espelhado
para o Git. Não é um projeto frontend separado que publica num servidor: os
arquivos daqui são lidos diretamente pelo HA.

## Histórico resumido

O projeto foi herdado de [`ngocjohn/hass-config`](https://github.com/ngocjohn/hass-config)
(ainda registrado como remote `upstream`) e passou por gerações sucessivas de
interface, cada uma deixando sedimento:

| Geração | Tecnologia | Situação hoje |
|---|---|---|
| 1. Dashboard `negocjohn` | YAML + `button-card` + `layout-card` | resíduo — entidades e cômodos europeus |
| 2. Interface "Mat" (botões) | `button_card_templates` | resíduo — `tpl_*.yaml` ainda parseados |
| 3. Bento Grid | `custom:grid-layout` | parcialmente vivo (`views/main.yaml`) |
| 4. Cômodos por pop-up | `browser_mod.popup` | resíduo — `shared/popup/` |
| 5. Subviews YAML | views `subview: true` | resíduo parcial |
| 6. **Web Components (atual)** | JS puro + Shadow DOM | **em produção** |

A geração 6 começou como cards isolados e evoluiu para uma **shell** única
(`custom:bruno-shell`) que hospeda todas as seções.

## Estado atual, em números

| Métrica | Valor |
|---|---|
| JavaScript | 93.928 linhas em 53 arquivos |
| Custom elements | 38 |
| Recursos carregados pelo HA | 52 (nenhum bundle — 52 requisições) |
| YAML em `dashboards/` | 349 arquivos — 197 alcançáveis, **145 órfãos** |
| Assets | 51 MB (127 MB de bitmap decodificado) |
| Duplicação entre as 6 subviews de cômodo | 88–97% |
| `addEventListener` / `removeEventListener` | 316 / 62 |
| Comentários históricos no código de produção | 1.178 linhas |

## Tecnologias hoje

- **JavaScript ES2020**, classes nativas estendendo `HTMLElement`
- **Shadow DOM** com CSS em template literal
- **Sem `import`/`export`** — o acoplamento entre os 53 arquivos é feito por
  **18 objetos em `globalThis`**, e a ordem de carregamento é a única
  declaração de dependência que existe
- **Sem build, sem lint, sem testes.** Editar → salvar → recarregar o navegador
- Design tokens em variáveis CSS, definidos em 4 arquivos de tema + inline

## Objetivos da reestruturação

1. Eliminar a duplicação das 6 subviews (uma subview parametrizada por cômodo)
2. Parar o re-render total a cada atualização do `hass`
3. Ganhar checagem sintática antes do navegador (o erro de crase em template
   literal já derrubou o dashboard 4 vezes)
4. Centralizar entidades e cômodos em configuração tipada e validada
5. Reduzir o custo no tablet: assets, blur, listeners, timers
6. Documentar o conhecimento que hoje vive em 313 KB de `CLAUDE.md` + `AGENTS.md`

## Arquitetura de destino

TypeScript · Lit · Web Components · CSS modular com design tokens · Vite ·
Zod · Vitest · Playwright · ESLint · Prettier.

**Pré-requisito não atendido:** Node.js e npm **não estão instalados** nesta
máquina. Ver [`12-migration-plan.md`](12-migration-plan.md), Fase 4.

## Limitações conhecidas

- **O tablet é o alvo real.** Validação no computador não prova nada: o WebView
  do Fully Kiosk tem memória disputada, cache próprio e políticas de autoplay e
  vibração diferentes.
- **Transições, som e resposta tátil não funcionam bem no tablet** — causa ainda
  não diagnosticada (candidatos: política de autoplay, API de vibração,
  recriação de elementos a cada render).
- **Câmeras**: as subviews usam `hui-image` (o elemento oficial do HA), mas os
  cards da Home usam `/api/camera_proxy` com timer. A diferença de comportamento
  entre o dashboard oficial e este ainda não foi medida.
- **Cache no tablet**: alterações aparecem no computador e não no tablet; o
  cache-bust é manual, arquivo por arquivo.
- **Um processo externo commita este repositório automaticamente** (observado
  em 2026-08-02). Isso interfere na rastreabilidade por commit.

## O que não fazer

- Não reescrever tudo de uma vez. O dashboard funciona e tem partes maduras.
- Não substituir componente por preferência arquitetural — só por defeito medido.
- Não eliminar YAML artificialmente: o HA exige YAML em vários pontos.
- Não considerar um arquivo obsoleto por ser antigo ou por ser YAML.
- Não declarar que algo funciona no tablet sem ter testado no tablet.
