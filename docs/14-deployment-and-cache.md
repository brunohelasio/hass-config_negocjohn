# 14 — Publicação, cache e a VM

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
