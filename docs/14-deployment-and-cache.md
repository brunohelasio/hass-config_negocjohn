# 14 — Publicação, cache e a VM

## Atualização operacional — Everex (2026-08-14)

O Home Assistant de produção deixou de executar na VM. O destino canônico é
agora o Home Assistant OS no servidor físico Everex, disponível por Samba em:

```text
\\192.168.3.154\config
```

Regras vigentes:

- a VM está aposentada e não deve ser lida, modificada nem usada como destino;
- a pasta local continua sendo a origem de desenvolvimento e versionamento;
- toda publicação deve criar antes um rollback local dos arquivos exatos do
  Everex que serão substituídos;
- copiar somente o payload autorizado e validar SHA-256 local × Everex;
- arquivos de runtime/bundle entram primeiro e `configuration.yaml` por último;
- não reiniciar o Home Assistant sem autorização explícita.

As seções abaixo que citam `\\192.168.3.102\config` e “VM” são registro
histórico do fluxo anterior, não instrução operacional atual.

## Como o código chega ao Home Assistant, hoje

```
1. A IA edita a pasta local     C:\GitHub\hass-config_negocjohn\hass-config_negocjohn\
2. Bruno copia e sobrescreve    \\192.168.3.102\config   (Samba, manual)
3. Bruno commita pelo GitHub Desktop, a partir da PASTA LOCAL
4. Recarrega o navegador / o tablet
```

Verificado em 2026-08-02: o `/config` da VM e a pasta local estão íntegros na
direção local → VM (**0 arquivos daqui faltando lá**; 61 dos 62 arquivos
críticos byte-idênticos).

## O defeito estrutural deste fluxo

> **Copiar e sobrescrever nunca apaga.**

Arquivos removidos da pasta local **permanecem para sempre** na VM. Foi assim
que 7 arquivos passaram a existir só lá. Isso não se resolve com organização —
resolve-se trocando o modo de cópia por um que **espelhe** (apague na VM o que
não existe mais na origem), com lista de exclusão obrigatória.

**Nunca podem ser tocados por um espelhamento:**

```
.storage/    .cloud/    .cache/    deps/    image/    tts/
zigbee2mqtt/    ps5-mqtt/    secrets.yaml
home-assistant_v2.db*    .HA_VERSION    .ha_run.lock
home-assistant.log*
```

## O que vai para a VM, e o que não vai

| Vai | Não vai |
|---|---|
| Tudo dentro de `config/` | `docs/` |
| | `scripts/` |
| | `_backups/` |
| | `PRE_MIGRATION_AUDIT.md` |
| | `dashboard-src/` (quando existir) |

**Regra permanente:** a VM recebe o que o Home Assistant precisa para funcionar,
nada além. Hoje isso coincide com "uma cópia de `config/`". **Depois da Fase 4
deixa de coincidir**: o TypeScript fica só na pasta local e a VM recebe apenas o
bundle compilado em `config/www/dashboard/`.

## Cache — por que muda no computador e não no tablet

Não há build nem hash de conteúdo. Cada um dos 52 recursos tem um `?v=` escrito
à mão em `configuration.yaml`. Se o `?v=` não sobe, o WebView do Fully Kiosk
serve o arquivo antigo — e o sintoma aparece como "erro de configuração" ou como
um módulo novo conversando com globais velhos.

Depois da Fase 4 isso desaparece: o Vite gera `dashboard.[hash].js`, e o nome
muda sozinho quando o conteúdo muda.

Enquanto isso: **ao alterar um JS, subir o `?v=` e comentar o valor anterior ao
lado.**

## Limpeza da VM — registro

Executada em **2026-08-02**, autorizada pelo usuário. Renomear em vez de apagar,
porque renomear é reversível.

| Item | Arquivos | Tamanho | Novo nome | O que era |
|---|---|---|---|---|
| `.git/` | 4.775 | 65 MB | `_DESATIVADO_20260802_git` | Repositório Git adormecido dentro do `/config`: branch `sync-config-local`, **um único commit** de 2026-04-10, nunca mais usado. Quem versiona é a pasta local. |
| `Hemma-main/` | 95 | 6 MB | `_DESATIVADO_20260802_Hemma-main` | Projeto de dashboard baixado do GitHub, usado como referência visual. Citado **apenas em comentários**; o HA não carrega nada dele. |
| Legado da Fase 3 | 194 | 1 MB | `_DESATIVADO_20260802_legado` | Os mesmos arquivos movidos para `_archive/` na Fase 3, com o caminho original preservado dentro da pasta. |

**Total: 72 MB retirados de cada backup.**

**Excluir definitivamente a partir de 2026-08-09**, se nada tiver quebrado.

Reverter (imediato, um comando por item):

```powershell
Rename-Item "\\192.168.3.102\config\_DESATIVADO_20260802_git" ".git" -Force
Rename-Item "\\192.168.3.102\config\_DESATIVADO_20260802_Hemma-main" "Hemma-main" -Force
```

Para o legado, os arquivos estão sob o caminho original dentro da pasta — mover de
volta restaura a posição exata:

```powershell
$d = "\\192.168.3.102\config\_DESATIVADO_20260802_legado"
Get-ChildItem $d -Recurse -File | ForEach-Object {
  $rel = $_.FullName.Substring($d.Length + 1)
  $dst = Join-Path "\\192.168.3.102\config" $rel
  New-Item -ItemType Directory -Path (Split-Path $dst) -Force | Out-Null
  Move-Item $_.FullName $dst -Force
}
```

### Estado após a limpeza (2026-08-02)

VM e repositório local em paridade:

| | VM | Local |
|---|---|---|
| YAML em `dashboards/` | 163 | 163 |
| JS em `www/bruno-ui/` | 51 | 51 |
| Arquivos que o dashboard carrega | 151/151 presentes | — |
| Recursos de `configuration.yaml` | 52/52 presentes | — |

### Deliberadamente **não** tocados

| Item | Por quê |
|---|---|
| `ps5-mqtt/credentials.json` | Credenciais de um add-on ativo |
| `templates/switch.yaml` | 0 bytes — renomear não economiza nada e adiciona risco |
| `image/` (62,8 MB) | Armazenamento legítimo de entidades `image` do HA |
| `.cache/`, `.storage/`, `.cloud/`, `deps/` | Runtime do HA |

## Pendente

- Substituir o copiar-e-colar por espelhamento com lista de exclusão
- Um `npm run deploy` que escreva **somente** em `config/www/dashboard/`
  (sem isso, a Fase 4 adiciona uma etapa de build **e** mantém a cópia manual —
  fica pior do que hoje para o usuário)

---

## Publicação da arquitetura nova (a partir da Fase 4)

O fluxo manual continua valendo para `config/dashboards/` e para os 52 módulos
clássicos. Para o que vem de `dashboard-src/`, existe comando:

```bash
cd dashboard-src
npm run check      # typecheck + lint + test + build
npm run deploy:vm  # publica em \192.168.3.102\config\www\dashboard\
```

### Por que o cache deixa de ser problema

O Vite gera `bruno-dashboard.<hash>.js`, onde o hash vem do **conteúdo**. Mudou o
código, mudou o nome do arquivo — o navegador nunca serve versão velha, porque
para ele é outra URL. **Não existe `?v=` nesse caminho, e não deve existir.**

Em troca, a linha em `frontend.extra_module_url` muda quando o hash muda. O
`deploy.mjs` detecta e imprime a linha pronta:

```
⚠ ATUALIZE config/configuration.yaml — em frontend.extra_module_url:
    - /local/dashboard/bruno-dashboard.DDAGhZ83.js
```

Quando o recurso já está declarado com aquele hash, ele confirma e não pede nada.

Bundles antigos são apagados da VM a cada publicação — com hash no nome, se
acumulariam indefinidamente.

### O que vai e o que não vai

| Vai para a VM | Fica só no repositório |
|---|---|
| `config/www/dashboard/*.js` (bundle + sourcemap) | `dashboard-src/src/` (fonte TypeScript) |
| `config/configuration.yaml` (linha do recurso) | `dashboard-src/node_modules/` |
| | `dashboard-src/scripts/`, testes, configs |

O bundle compilado é **ignorado pelo Git** (`config/www/*` no `.gitignore`), como
deve ser: artefato reproduzível não se versiona. Quem versiona é a fonte.

### Reinício

Alterar `frontend.extra_module_url` exige **reiniciar o Home Assistant** — a
lista é lida na inicialização. Trocar só o conteúdo do bundle (mesmo nome) não
exigiria, mas o nome sempre muda junto com o conteúdo.

---

## Publicação WebRTC `BY5H2fqa` (2026-08-10)

Publicados manualmente por Samba, sem excluir bundles anteriores:

- bundle, sourcemap, manifesto e loader;
- módulos clássicos Home Camera e Cameras Security;
- `configuration.yaml` por último.

Sete pares local × VM: SHA-256 idêntico. Rollback completo em
`\\192.168.3.102\config\tmp\rollback-20260810-webrtc-lifecycle-BY5H2fqa`.

O reinício não foi executado: o navegador disponível não tinha sessão
autenticada no Home Assistant. Portanto a cópia está concluída, mas a ativação
do novo `frontend.extra_module_url` depende do próximo reinício do HA.

---

## Publicação mobile faixa de controles `BCRw5wMI` (2026-08-12)

Publicação coordenada por Samba, com `configuration.yaml` copiado por último:

- bundle `bruno-dashboard.BCRw5wMI.js`, sourcemap, manifesto e loader;
- `rail_rooms.yaml`, `bento-sidebar-card.js` e `bruno-shell.js`;
- `configuration.yaml` com o bundle ativo e cache-bust
  `20260812-mobile-faixa-refino-1` para sidebar e shell.

Antes da escrita, oito hashes remotos foram comparados com o preflight. Depois
da escrita, oito pares local × VM tiveram SHA-256 idêntico. O bundle anterior
`JpxYam5N` foi preservado. Rollback completo em
`\\192.168.3.102\config\tmp\rollback-20260812-mobile-faixa-refino-1`.

O reinício do Home Assistant não foi executado. Como houve troca no
`frontend.extra_module_url`, a ativação no runtime depende do próximo reinício;
depois dele, validar telefone e tablet reais e fazer recarga forçada no app.

---

## Publicação mobile refino final `Dl1h2bqI` (2026-08-12)

Publicação coordenada por Samba, sem apagar o bundle anterior e com
`configuration.yaml` copiado por último:

- bundle `bruno-dashboard.Dl1h2bqI.js`, sourcemap, manifesto e loader;
- `bruno-shell.js` com cache-bust `20260812-mobile-refino-final-1`;
- `bruno-activity-column.js` com cache-bust
  `20260812-mobile-refino-final-1`;
- `configuration.yaml` apontando diretamente para o novo bundle.

Antes da escrita, cinco hashes remotos foram confrontados com o snapshot local
inicial; a operação foi abortada automaticamente diante de qualquer divergência.
Depois da escrita, os sete pares local × VM foram confirmados como idênticos por
SHA-256. O bundle anterior `Dvu9B_BT` foi preservado. Rollback completo em
`\\192.168.3.102\config\tmp\rollback-20260812-mobile-refino-final-Dl1h2bqI`.

O reinício do Home Assistant não foi executado. A cópia na VM está concluída,
mas a troca em `frontend.extra_module_url` depende do próximo reinício do HA e
de recarga forçada no aplicativo para chegar ao WebView.

---

## Publicação mobile ajustes finos `BhU8hVkk` (2026-08-12)

Publicação coordenada por Samba, sem apagar o bundle anterior e com backup
antes da substituição:

- bundle `bruno-dashboard.BhU8hVkk.js`, sourcemap, manifesto e loader;
- `section_home_v2.yaml`, apenas com a linha phone da Sala em 160 px;
- `bento_sala_phone.yaml`, com documentação da altura atual;
- `configuration.yaml` apontando diretamente para o novo bundle.

Os sete pares local × VM foram confirmados como idênticos por SHA-256. Rollback
completo em
`\\192.168.3.102\config\tmp\rollback-20260812-mobile-fine-tuning-BhU8hVkk`.

### Correção mobile pós-dispositivo `DPSqTbyG` (2026-08-12)

Correção restrita ao breakpoint de telefone, sem alterar composição, ordem ou
cards do tablet:

- fade lateral da faixa com alpha zero nas extremidades e sem blur retangular;
- limite superior dos bottom sheets medido pelo topo real da Cortina;
- tiles de iluminação em 68–72 px, gap de 9–10 px e toggle de 34 × 20 px;
- escolha manual de PC/TV/Spotify preservada no telefone;
- PNGs de espera ampliados internamente sem mudar a caixa do grid.

Publicação coordenada na VM com `configuration.yaml` copiado por último. Os
cinco pares local × VM (configuração, bundle, sourcemap, manifesto e loader)
foram confirmados como idênticos por SHA-256. O bundle anterior foi preservado.
Rollback em
`\\192.168.3.102\config\tmp\rollback-20260812-mobile-regression-DPSqTbyG`.

O layout interno de progresso, volume e transportes do Spotify não foi alterado,
pois depende de nova decisão visual do usuário.

O reinício do Home Assistant não foi executado. Como o hash do recurso mudou,
a ativação depende do próximo reinício do HA e de recarga forçada no aplicativo.

---

## Publicação mobile grade exata e Now Playing `BPkb_uaO` (2026-08-13)

Publicação coordenada do bundle, sourcemap, manifesto, loader e
`configuration.yaml`, com o entrypoint anterior `DPSqTbyG` preservado como
comentário. O escopo funcional e visual é exclusivo do telefone
(`max-width: 800px`): encaixe exato da grade de iluminação, correção do recorte
das artes de espera e composição compacta do Hub/Estação.

Os cinco pares local × VM foram confirmados por SHA-256. O bundle anterior
`DPSqTbyG` permanece na VM e o snapshot coordenado está em
`\\192.168.3.102\config\tmp\rollback-20260813-mobile-now-playing-BPkb_uaO`.

O reinício do Home Assistant não faz parte da publicação de arquivos. A troca
do `frontend.extra_module_url` entra em vigor depois do reinício e da recarga
forçada do aplicativo.

---

## Publicação mobile Hub/status/rail `Bi9xZDOa` (2026-08-13)

Publicação coordenada do bundle, sourcemap, manifesto, loader,
`bento-sidebar-card.js` e `configuration.yaml`. O entrypoint anterior
`BPkb_uaO` e o cache-bust anterior da sidebar foram preservados como
comentários de rollback. O escopo visual é exclusivo do telefone
(`max-width: 800px`): Hub 40 px mais baixo, quatro status por largura e ícones
da rail 2 px maiores sem mudança na altura do dock.

O reinício do Home Assistant não faz parte da cópia. A ativação do novo
entrypoint e do cache-bust da rail depende de reinício do HA e recarga forçada
do aplicativo.

Os seis pares local × VM foram confirmados por SHA-256. O bundle anterior
`BPkb_uaO` foi preservado e o snapshot coordenado está em
`\\192.168.3.102\config\tmp\rollback-20260813-mobile-hub-refino-Bi9xZDOa`.

---

## Publicação mobile Hub compacto `B5N215h6` (2026-08-13)

Publicação incremental restrita ao CSS phone do Hub. O bundle remove a
atmosfera recortada do corpo, reduz sua altura por geometria e elimina as
reservas redundantes acima da rail. O entrypoint `Bi9xZDOa` permanece
documentado como rollback.

O reinício do Home Assistant não faz parte da cópia; a ativação depende do
reinício e da recarga forçada do aplicativo.

Os cinco pares local × VM foram confirmados por SHA-256. O snapshot coordenado
está em
`\\192.168.3.102\config\tmp\rollback-20260813-mobile-hub-compacto-B5N215h6`.

---

## Produção atual: Everex com Home Assistant OS (2026-08-15)

O Home Assistant de produção foi migrado para o servidor físico Everex. O
diretório ativo está disponível por Samba em:

```text
\\192.168.3.154\config
```

A VM `192.168.3.102` foi abandonada e **não deve mais ser lida, modificada ou
usada como destino de publicação**. Todas as seções anteriores deste documento
que mencionam VM permanecem apenas como histórico de versões e rollbacks.

### Publicação estrutural `BJutTx-c` (2026-08-15)

Publicação coordenada no Everex, com backup local prévio, sem apagar bundles
anteriores e com `configuration.yaml` copiado por último:

- bundle `bruno-dashboard.BJutTx-c.js` e sourcemap;
- `manifest.json` e `bruno-loader.js`;
- `bento-sidebar-card.js` e `bruno-shell.js`;
- `configuration.yaml` com cache-bust `20260815-status-global-1`.

Os sete pares local × Everex foram confirmados por SHA-256. O bundle anterior
`DLc4aRtS` foi preservado e o snapshot coordenado está em
`tmp/everex-preflight-20260815-structural-round-1/`.

O reinício não faz parte da cópia. Como o nome do bundle e os recursos em
`frontend.extra_module_url` mudaram, a ativação depende de reiniciar o Home
Assistant e fazer recarga forçada no aplicativo/WebView.

### Build local pendente `DpecM3wp` (2026-08-15)

O microajuste mobile de status e estabilidade do cabeçalho da câmera foi
compilado como `bruno-dashboard.DpecM3wp.js`; o cache-bust preparado para
`bruno-top-badges-card.js` é `20260815-status-position-2`.

**Este build ainda não foi publicado.** A tentativa de pré-publicação foi
interrompida antes de qualquer escrita porque a camada de autorização não
permitiu ler os arquivos atuais do Everex e criar o backup local obrigatório.
O Everex permanece na versão anterior. Na próxima janela autorizada, copiar
bundle, sourcemap, manifesto, loader e top badges; copiar
`configuration.yaml` por último e confirmar todos os pares por SHA-256.

### Rodada Home mobile compacta — 2026-08-16

Esta rodada não gera bundle: altera três módulos clássicos, um YAML de matriz e
`configuration.yaml`. A publicação coordenada deve copiar para o Everex:

1. `dashboards/shared/grid-cards/bento_comodos_matriz.yaml`;
2. `www/bruno-ui/cards/bruno-activity-column.js`;
3. `www/bruno-ui/cards/bruno-hero-card.js`;
4. `www/bruno-ui/cards/bruno-top-badges-card.js`;
5. `configuration.yaml` por último.

Os três módulos usam o cache-bust `20260816-mobile-home-compacta-1`. O snapshot
prévio está em `tmp/everex-preflight-20260816-mobile-home-compacta-1/`. A VM
permanece proibida como origem, destino ou mecanismo de rollback.

Depois da cópia, comparar SHA-256 dos cinco pares. O reinício do Home Assistant
e a recarga forçada do aplicativo não fazem parte da cópia, mas são necessários
para ativar as URLs novas.
