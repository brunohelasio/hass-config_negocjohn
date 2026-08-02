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

Detector heurístico (procura crase dentro de bloco `/* */`):

```bash
perl -ne 'if (/\/\*/../\*\//) { print "$ARGV:$.: $_" if /`/ }' arquivo.js
```

**Ele produz falsos positivos** — em 2026-08-02 acusa 24 pontos em 9 arquivos,
todos benignos (o dashboard estava funcionando). O operador de intervalo do Perl
não distingue comentário real de `/*` dentro de string, e não sabe se o
comentário está dentro de um template literal.

Portanto **use-o como diff, não como veredito**: rode antes e depois da sua
edição no mesmo arquivo e investigue **apenas os pontos novos**.

```bash
perl -ne 'if (/\/\*/../\*\//) { print "$.\n" if /`/ }' arquivo.js > /tmp/antes
# … edite …
perl -ne 'if (/\/\*/../\*\//) { print "$.\n" if /`/ }' arquivo.js > /tmp/depois
diff /tmp/antes /tmp/depois
```

Linha de base atual (pontos conhecidos e benignos): `bruno-liquid-glass.js` 6,
`bruno-sala-card.js` 4, `bruno-cameras-security-subview.js` 2, e 2 em cada uma
das 6 subviews de cômodo (o bloco `ANTERIOR (rollback)` de `_presenceLine`).

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

- **Sem Node.js, npm ou Python.** Só `perl` e utilitários POSIX. Não há
  `node --check`, lint ou teste automatizado. Toda validação sintática é manual.
- **Windows + Git Bash + PowerShell.** A ferramenta Bash roda em sandbox; use
  caminhos absolutos (o `cd` não persiste de forma confiável entre chamadas).
- **Sem acesso ao Home Assistant em execução.** Não é possível confirmar quais
  entidades existem, quais integrações estão carregadas ou se um arquivo existe
  na máquina do HA mas não no repositório. **Quando a resposta depender disso,
  pergunte — não conclua.**

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

**Existe um processo externo que commita este repositório automaticamente.**
Em 2026-08-02 ele commitou 179 arquivos com a mensagem `Atualização` no meio de
uma sessão. Se você precisa de rastreabilidade por commit, confirme o estado do
Git imediatamente antes e depois de cada passo, e avise o usuário se encontrar
um commit que não foi você.
