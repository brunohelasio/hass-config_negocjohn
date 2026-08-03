# 16 — Guia de trabalho para IA

Leia isto **antes** de tocar em qualquer arquivo deste repositório.

## Ordem de leitura

1. `docs/00-project-overview.md` — o que é o projeto e por que está assim
2. Este arquivo — como trabalhar sem quebrar
3. `PRE_MIGRATION_AUDIT.md` — o diagnóstico completo
4. `docs/01-current-architecture.md` — como a aplicação carrega e renderiza
5. `docs/03-active-entrypoints.md` — o que executa de fato
6. `docs/02-file-inventory.md` — o que é ativo, legado, órfão ou desconhecido
7. `docs/12-migration-plan.md` — em que fase estamos e o que está bloqueado

`CLAUDE.md` (168 KB) e `AGENTS.md` (144 KB) são a fonte histórica primária.
**Não os leia inteiros por padrão** — procure a seção específica.

## As duas regras de ouro do projeto (do `CLAUDE.md`, ainda valem)

1. **Nunca excluir código. Comentar antes de substituir.** O código anterior fica
   comentado no próprio arquivo, marcado como `ANTERIOR` / `rollback`, e o novo
   entra abaixo.
2. **Só entregar quando o usuário autorizar.** Mudanças são incrementais e
   reversíveis; commit só depois da validação visual.

> Tensão conhecida: a regra 1 é a causa direta de 1.178 linhas de comentário
> histórico no código de produção (`bruno-josh.js` com 57%). A saída acordada no
> plano de migração é mover esse histórico para `docs/` **e** para o Git, não
> abandonar a regra.

## ⚠️ Invariantes que já quebraram o dashboard

### 1. Crase dentro de comentário em template literal — **4 ocorrências**

Todo o CSS é montado em template literal. Uma crase num comentário CSS/JS dentro
do template **fecha a string**, o módulo não compila e o dashboard cai inteiro.

```js
// ERRADO — a crase fecha o template literal
return `
  /* a regra `.lights-card` usa padding 14px */
  .lights-card { padding: 14px; }
`;
```

Use aspas retas ou apenas descreva. **Paridade de crases não detecta** — a crase
espúria vem em par.

**Detector correto (desde 2026-08-02, com Node instalado):**

```bash
powershell -File scripts/validation/check-syntax.ps1
```

Ele roda `node --check` em todos os arquivos JS. É parse real: acusa erro se, e
somente se, o arquivo não compila. **Zero falsos positivos.** Linha de base
verificada em 2026-08-02: **53 de 53 arquivos OK.**

Rode **antes** de pedir validação visual. Se falhar aqui, falharia no navegador —
e no tablet o sintoma aparece como "erro de configuração" ou como o tema
voltando silenciosamente ao anterior.

> Heurística anterior (Perl, `/\/\*/../\*\//` procurando crase) está
> **obsoleta**: produzia 24 falsos positivos e nenhum verdadeiro. Não use.

### 2. Ordem de carregamento é o grafo de dependências

Não há `import`. `bruno-josh.js` depende de `bruno-ios-dark.js`;
`bruno-theme-manager.js` depende dos temas. A única declaração disso é a **ordem
das linhas** em `frontend.extra_module_url`. Nunca reordene sem entender.

### 3. Consumo por `?.` mascara falha de carregamento

`globalThis.BrunoSurfaceMaterial?.connect?.(this)` não dá erro quando o módulo
não carregou — o efeito simplesmente não acontece. Sintoma típico: "o tema
voltou ao antigo". Antes de suspeitar de corrida de carregamento, verifique se
o módulo compila.

### 4. Assimetria Home × subviews é diagnóstica

A Home lê tokens direto do tema; as subviews passam por
`bruno-surface-material.js`. **Se a Home está normal e as subviews quebraram, o
tema está vivo** — o problema é o módulo de material, não o tema.

## Como verificar se um arquivo está em uso

**JavaScript:**
```bash
grep -n "nome-do-arquivo.js" config/configuration.yaml
```
Se não aparecer numa linha não comentada de `extra_module_url`, não é carregado.

**YAML:** resolver o grafo de `!include` a partir de `dashboards/ui-lovelace-main.yaml`,
ignorando linhas comentadas. A lista pronta está em `docs/02-file-inventory.md`.
Cuidado com dois casos:
- `!include_dir_merge_list main-grid/` puxa **todos** os arquivos do diretório
- includes por caminho absoluto (`/config/dashboards/floorplan/`) são válidos no
  HA e parecem quebrados localmente

**Custom element:**
```bash
grep -rn "BRUNO_.*_TAG = " config/www/bruno-ui/
```

## Como alterar um componente

1. Confirme que ele é carregado (acima)
2. Leia o `CLAUDE.md` na seção daquele componente — há grande chance de a
   mudança já ter sido tentada e revertida
3. Comente o bloco anterior in-place, marcado `ANTERIOR (rollback <data>)`
4. Escreva o novo abaixo
5. **Suba o `?v=` do recurso em `configuration.yaml`** e comente o valor anterior
   ao lado. Sem isso, o tablet continua com o arquivo velho
6. Verifique a sintaxe (chaves, parênteses, crases, e o detector de crase acima)
7. Peça validação visual — no tablet, não só no computador

## Como saber que a alteração chegou no tablet

O cache-bust é manual. Se a mudança aparece no computador e não no tablet:
o `?v=` não subiu, ou o WebView do Fully Kiosk está servindo do cache. Não
"conserte" o componente — conserte a entrega.

## Como validar

| # | Verificação |
|---|---|
| 1 | Sintaxe (sem Node: revisão manual + detector de crase) |
| 2 | Custom elements registrados (`customElements.get('bruno-…')` no console) |
| 3 | Recurso com versão nova em `configuration.yaml` |
| 4 | Visual no desktop |
| 5 | Funcional (a ação realmente chama o serviço) |
| 6 | Console sem erro novo |
| 7 | **Visual e funcional no tablet — sempre pelo usuário** |
| 8 | Rollback registrado |

## Limitações do ambiente

- **Node.js 24.18.1 + npm 11.16.0 instalados** em 2026-08-02 (winget, escopo de
  usuário). O `winget` só atualiza o `PATH` em shells novos — o
  `check-syntax.ps1` já contorna isso localizando o `node.exe` sozinho.
  Caminho: `%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_*\node-v24.18.1-win-x64\`.
- **Sem Python.** Disponível: `perl` e utilitários POSIX.
- **Windows + Git Bash + PowerShell.** A ferramenta Bash roda em sandbox; use
  caminhos absolutos (o `cd` não persiste de forma confiável entre chamadas).
- **Sem acesso ao Home Assistant em execução.** Não é possível confirmar quais
  entidades existem, quais integrações estão carregadas ou se um arquivo existe
  na máquina do HA mas não no repositório. **Quando a resposta depender disso,
  pergunte — não conclua.**
- ⚠️ **O repositório NÃO é espelho fiel do `/config` do HA.** Confirmado em
  2026-08-02: `shared/popup/media_all_players.yaml` existe no HA e nunca esteve
  neste repositório. Portanto "arquivo ausente aqui" **não** significa "include
  quebrado no HA", e "arquivo órfão aqui" **não** significa "não usado no HA".
  Confirme com o usuário antes de classificar ou arquivar.

## Como registrar decisões

Em `docs/15-decisions-log.md`:

```
Data:
Decisão:
Contexto:
Alternativas:
Motivo:
Consequências:
Arquivos afetados:
Status:
```

E atualize `docs/02-file-inventory.md` sempre que um arquivo mudar de classe.

## Como não reintroduzir o legado

- Nada em `_archive/` pode entrar no build, ser importado por `src/`, virar
  resource ou ser carregado pelo HA
- Não copie padrão de arquivo legado sem verificar se ele ainda é o padrão atual
- Antes de "criar um card novo para o cômodo X": **já existem 6 cópias.** A
  direção do projeto é convergir para um componente parametrizado, não somar a
  sétima cópia
- Antes de adicionar `setInterval`: verifique se o HA já entrega o dado por
  estado reativo

## Como não fazer alterações demais de uma vez

- Uma fase resolve um problema
- Um commit contém uma mudança coerente
- Não misture limpeza com migração, nem redesign com correção
- Se o dashboard quebrar e a causa não estiver identificada, **pare** — não
  avance para a fase seguinte

## Atenção operacional

**O usuário commita pelo GitHub Desktop, às vezes no meio de uma sessão.** Em
2026-08-02 apareceu um commit de 179 arquivos como `Atualização` entre duas
chamadas de ferramenta. Não é automação — é ele, manualmente. Como o GitHub
Desktop commita a árvore inteira, trabalho em andamento pode ser varrido para
dentro de uma mensagem genérica.

Quando uma fase precisar de commit próprio e rastreável, avise antes. Confira
`git rev-parse HEAD` no início e no fim de passos longos; se mudou, pergunte em
vez de presumir corrupção.

**Nunca dê `git push` sem pedido explícito.** O usuário prefere que as mudanças
fiquem locais até revisar o que vale commitar e publicar — e um push em `docs/**`
dispara deploy público no GitHub Pages.
