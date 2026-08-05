# Prompt de continuidade — dashboard Home Assistant (negocjohn)

Cole isto numa sessão nova. Descreve o que estamos fazendo, onde paramos e o que
está quebrado agora.

---

## O projeto

Auditoria, limpeza e reestruturação arquitetural de um dashboard pessoal do Home
Assistant. O repositório é `C:\GitHub\hass-config_negocjohn\hass-config_negocjohn`;
a instância roda numa VM acessível por Samba em `\\192.168.3.102\config`.

O fluxo é: **alterar na pasta local → copiar para a VM → o usuário reinicia o HA**.
O usuário commita pelo GitHub Desktop; nunca dar `git push` sem pedido.

**Arquitetura-alvo:** TypeScript · Lit · Web Components · CSS modular com tokens ·
Vite · Zod · Vitest · Playwright · ESLint · Prettier. YAML só onde o Home
Assistant exige.

O código novo vive em `dashboard-src/` e é compilado para um bundle único em
`config/www/dashboard/`, referenciado por `frontend.extra_module_url` no
`configuration.yaml`. O código legado vive em `config/www/bruno-ui/`.

## Regras que o usuário impôs, e que valem sempre

1. **Nunca apagar código. Comentar antes de substituir**, com marcador de rollback.
2. **Só entregar quando ele autorizar.**
3. **Não mexer em sensores.** O escopo é `config/dashboards/`, `config/www/`,
   `dashboard-src/`. Se um sintoma vier de uma entidade do HA: diagnosticar e
   reportar, nunca editar `config/packages/` nem automações.
4. **Manter os assets antigos** e as views mobile V3 intactos.
5. **Consultar `docs/` ANTES de produzir**, não depois de errar.
6. **Só pedir validação sobre resultado medido.** Existe um banco de medição em
   `scripts/harness/`.
7. Não repetir status; entregar.

## Fases concluídas

| fase | o que foi |
|---|---|
| 0 | Proteção: checkpoint e backups |
| 1 | Auditoria (`PRE_MIGRATION_AUDIT.md`): 4 defeitos medidos, riscos R1–R10 |
| 2 | Documentação: `docs/00` a `docs/16`, 17 documentos |
| 3 | Isolamento do legado: 195 arquivos para `_archive/`, 0 mudança no alcançável |
| 4 | Fundação técnica: `dashboard-src/` com Vite, TS estrito, Vitest, ESLint |
| 5a | Piloto: um tile de cômodo pela arquitetura nova, ao lado dos antigos |
| 5b | **A faixa de cômodos da Home: 8 tiles por um componente.** Em produção e validada pelo usuário |

## Fase 5c — o que ela busca

Substituir as **seis subviews de cômodo** (Sala, Office, Cozinha, Q. Casal,
Q. Marina, Q. Miguel) por **um componente parametrizado**.

Os seis arquivos em `config/www/bruno-ui/subviews/` têm ~8.900 linhas cada:
**41.421 linhas no total, das quais só 5.876 são distintas** — 86% de repetição
literal. 111 dos ~120 métodos e 620 das regras de CSS são idênticos nos seis.

### O que já avançou

| entregue | onde |
|---|---|
| Configuração dos 6 cômodos, **gerada** dos arquivos originais | `dashboard-src/src/config/subviews.config.ts` (760 linhas) |
| CSS do componente, **gerado**, cobertura medida de 100% | `dashboard-src/src/components/rooms/subview-styles.generated.ts` |
| Página de medição + linha de base geométrica | `scripts/harness/` e `subview-baseline.json` |
| Componente | `dashboard-src/src/components/rooms/bruno-room-subview.ts` |

O componente reproduz a **geometria** da linha de base: 36 de 36 campos com delta
zero, viewport 1280×720, incluindo o grid próprio da Cozinha.

### ⚠️ Os problemas, apontados pelo usuário no tablet

A troca foi publicada e **o resultado está quebrado**:

1. **As subviews não estão completas.** A estrutura existe, o conteúdo não.
2. **Câmeras, hub de mídia e A/C perderam a pele de tile do tema Josh** — viram
   contornos sem material.
3. **Blocos de iluminação vazios.**
4. **Os cards no lugar dos tiles não têm conteúdo nenhum.**

### A causa provável — verificar primeiro

As subviews atuais injetam o material do tema por um módulo global:

```js
globalThis.BrunoSurfaceMaterial?.subviewStyles?.()   // CSS da pele
globalThis.BrunoSurfaceMaterial?.connect?.(host)     // marca o host com
                                                     // data-bruno-subview-surface-theme="josh"
```

Está em `config/www/bruno-ui/core/bruno-surface-material.js` e documentado no
`CLAUDE.md` (seções REV.14 a REV.18). **O componente novo não chama nenhum dos
dois** — o que explica os itens 2 e 4 de uma vez.

E o conteúdo vivo (imagem das câmeras, faixa tocando, temperatura do A/C, luzes
por zona) ainda não foi ligado às entidades: os módulos renderizam a caixa certa,
vazia.

### O erro de método que produziu isso

Foi usar **paridade geométrica** como critério de aceite. Ela é necessária e não
é suficiente: mede caixas, não conteúdo nem material. O aceite tem que incluir
"a tela funciona" — e isso só o usuário vê no tablet.

### Rollback imediato, sem reiniciar

Em `config/dashboards/views/bento_shell.yaml`: comentar o bloco marcado
`FASE 5c` e descomentar o `ANTERIOR` logo abaixo. Os seis arquivos antigos
continuam no disco e carregados.

## Fases seguintes

| fase | o que é |
|---|---|
| 6.1 | Performance no tablet: `triggers_update: all`, re-render total, 316 listeners, 127MB de bitmap decodificado |
| 6.2 | **Independência de resolução** — requisito do usuário. Hoje são ~6.210px fixos e 157 media queries calibradas num só tablet. Alvo: container queries e escalas fluidas, funcionando de 600 a 2000px sem breakpoint próprio |
| 7 | Consolidação: aposentar o legado, limpar `_archive/`, documentação final |

Pendências fora das fases: espaçamento da rail + tamanho dos badges superiores
(agrupados, porque os dois mexem na largura herdada pelas subviews);
`switch.macbook` não existe e tem 5 referências vivas em packages; `idle_time` do
PC reportando 4h33m com o PC em uso; assets V3 a trocar.

## Ferramentas de verificação

```bash
node scripts/validation/check-backtick.mjs --tudo    # crase em template literal
node scripts/validation/gen-subview-css.mjs          # regenera o CSS
node scripts/validation/gen-subview-config.mjs       # regenera a configuração
node scripts/harness/gen-subview-harness.mjs         # página de medição
perl scripts/validation/check-includes.pl .          # includes
cd dashboard-src && npm run check                    # typecheck + lint + test + build
```

**A armadilha da crase**: uma crase não escapada dentro de comentário que esteja
dentro de template literal fecha a string e derruba o módulo. Aconteceu **sete
vezes** neste projeto. O detector acima cobre comentário de JS, de CSS e de HTML.
