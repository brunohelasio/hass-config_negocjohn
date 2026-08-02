# Entrypoints ativos — 2026-08-02

Registro factual de como o dashboard é iniciado. Tudo aqui foi verificado no
código, não inferido.

## 1. Home Assistant → dashboards

`config/configuration.yaml`, chave `lovelace:` (linha 366):

```yaml
lovelace:
  mode: storage
  dashboards:
    ngocjohn-main:
      mode: yaml
      title: Ngocjohn Main
      filename: dashboards/ui-lovelace-main.yaml   # <-- ENTRYPOINT REAL
    homekitesq-teste:
      mode: yaml
      title: Teste HomeKit
      filename: lovelace-homekitesq.yaml           # <-- ARQUIVO NÃO EXISTE
```

- **Slug do dashboard ativo: `ngocjohn-main`** → URLs em `/ngocjohn-main/<path>`.
- `lovelace-homekitesq.yaml` **não existe** em lugar nenhum do repositório nem no
  histórico do Git. Ver risco R2 no `PRE_MIGRATION_AUDIT.md`.

## 2. Entrypoint do dashboard

`config/dashboards/ui-lovelace-main.yaml` (106 linhas) declara:

- `button_card_templates: !include_dir_merge_named ./templates/button_card_templates`
- `streamline_templates: !include_dir_merge_named ./templates/streamline_templates`
- `kiosk_mode: {kiosk: true}`
- bloco `resources:` **inteiro comentado** desde 2026-06-24 (dedup — os JS já vêm
  por `frontend.extra_module_url`; carregar nos dois lugares fazia o tablet baixar
  cada módulo duas vezes)
- `views:` — ver abaixo

## 3. Views declaradas (ordem real)

| # | Include / inline | Situação |
|---|---|---|
| 1 | `views/bento_shell.yaml` | **PAINEL PADRÃO** — path `bento-lab`, `type: panel`, 1 card: `custom:bruno-shell` |
| 2 | `views/main.yaml` | Grid legado do tablet; puxa `!include_dir_merge_list main-grid/` (39 arquivos) |
| 3-7 | `views/mobile/mobile-{casa,comodos,midia,cameras,mais}.yaml` | Mobile V3 — ainda incluídas |
| 8 | `views/system.yaml` | — |
| 9 | `views/github-view.yaml` | — |
| 10-13 | `subviews/{movie-panel,music-assistant,cameras-security,floor-plan}.yaml` | — |
| 14-15 | `subviews/{sala_subview,office_subview}.yaml` | Subviews YAML antigas de Sala/Office |
| 16-19 | 4 views **inline** | Cozinha, Q. Casal, Q. Marina, Q. Miguel → `custom:bruno-*-subview` |

Comentadas (rollback preservado): `views/bento_main.yaml`, mobile V1 (4 views),
mobile V2 (4 views), `subviews/ytube-music.yaml`.

## 4. A shell — o entrypoint real da interface atual

`views/bento_shell.yaml` monta **um único** custom element, `custom:bruno-shell`,
que recebe toda a configuração como propriedades do card:

```yaml
type: custom:bruno-shell
default_section: home
rails:
  default: !include shell/rail.yaml
  rooms:   !include shell/rail_rooms.yaml
default_rail: default
section_rails: {sala: rooms, office: rooms, cozinha: rooms,
                casal: rooms, marina: rooms, miguel: rooms}
backdrops: {home:…, sala:…, office:…, cozinha:…, casal:…,
            marina:…, miguel:…, cameras:…, roborock:…, floorplan:…}
backdrop_effects: {cameras:…, roborock:…, floorplan:…}
sections:
  home:      !include shell/section_home_v2.yaml   # FEATURE FLAG (V1 comentada)
  cameras:   !include shell/section_cameras.yaml
  roborock:  {type: custom:bruno-roborock-subview}      # inline
  floorplan: {type: custom:bruno-planta-3d-subview}     # inline
  sala:      {type: custom:bruno-sala-subview}
  office:    {type: custom:bruno-office-subview}
  cozinha:   {type: custom:bruno-cozinha-subview}
  casal:     {type: custom:bruno-quarto-casal-subview}
  marina:    {type: custom:bruno-quarto-marina-subview}
  miguel:    {type: custom:bruno-quarto-miguel-subview}
  music:     {type: custom:bruno-music-subview}
```

A navegação da shell é **por hash** (`bento-lab#home`, `bento-lab#cameras`, …).
Como a view é única e `type: panel`, a rail nunca remonta ao trocar de seção.

`sections.roborock` e `sections.floorplan` estão **inline** de propósito: o
comentário no arquivo registra que era para evitar `Unable to read file` quando
`shell/section_roborock.yaml` não tinha sincronizado no `/config`.
Consequência: `shell/section_roborock.yaml` existe no disco e **não é usado**.

## 5. Feature flag ativa

`sections.home` aponta para `shell/section_home_v2.yaml` (Home V2/V3).
`shell/section_home.yaml` (V1) fica como rollback de uma linha. Ambos os arquivos
têm tratamento de phone (`max-width: 800px`), então o rollback é funcional.

`section_home_v2.yaml` inclui, ativos:

```
../main-grid/bento_top_badges.yaml
../main-grid/v2/bento_welcome_v2.yaml
../main-grid/v2/bento_sala_phone.yaml
../main-grid/v2/bento_comodos_phone.yaml
../main-grid/v2/bento_dynamic.yaml
../main-grid/v2/bento_energy_phone.yaml
../main-grid/v2/bento_media_phone.yaml
../main-grid/v2/bento_bottom_block.yaml
```

## 6. Camada JS

Carregada **exclusivamente** por `frontend.extra_module_url` em
`configuration.yaml` (linhas 14–311). 52 recursos ativos, 242 linhas comentadas
de rollback no mesmo bloco. Lista completa e comentada em `active-resources.md`.
