# Projeto Bento Grid — Conversão do Dashboard Principal

> **Objetivo:** converter o painel principal para layout em **Bento Grid** com:
> - Sidebar fixa e estreita com ícones;
> - Linha superior de badges;
> - Área principal com cards de tamanhos diferentes;
> - **Roborock 1x2** e **Calendário com espaço flexível**.

---

## Regra de Ouro (obrigatória)

- **Não apagar código existente.**
- Tudo que deixar de ser usado deve ser **comentado** ou **desativado por condição/mediaquery**.
- Sempre manter caminho de rollback rápido.

---

## Layout final (visão macro)

### Estrutura
- **Coluna 1:** `sidebar` (fixa, estreita).
- **Colunas 2-13:** conteúdo em grade estilo Bento.

### Áreas do grid (desktop/tablet)
- `top_badges` (linha superior)
- `welcome_locks` (saudação + portas)
- `sala_feature` (sala destaque / clima)
- `office_tall` (office 1x2)
- `rooms_grid` (3x2 dos cômodos)
- `cameras_big` (bloco grande de câmeras)
- `calendar_card` (retangular, espaço flexível)
- `roborock_tall` (1x2 vertical)
- `media` (bloco mídia)

---

## Arquivos alterados e o que mudou

## 1) Estrutura principal de layout
- `config/dashboards/views/main.yaml`
  - Alterado para grid Bento com sidebar + 12 colunas de conteúdo.
  - Definidas novas `grid-template-areas`.
  - Mantido fallback mobile simples.
  - Trechos antigos preservados em comentários.

## 2) Sidebar
- `config/dashboards/shared/sidebar/sidebar_tablet_landscape.yaml`
  - Template trocado para `sidebar_nav_template` (antes `sidebar_template`, mantido comentado em linha).
- `config/dashboards/templates/button_card_templates/tpl_sidebar.yaml`
  - Adicionado `sidebar_nav_template` (ícones verticais: Home, Music, Security, Roborock, Network, System).
  - Template antigo `sidebar_template` preservado sem remoção.

## 3) Linha superior (badges)
- `config/dashboards/views/main-grid/a-chips.yaml`
  - `grid-area` migrada para `top_badges`.
  - Cards chips reativados para desktop/tablet (`min-width: 801px`).
  - Configuração antiga preservada em comentário.

## 4) Área de boas-vindas + portas
- `config/dashboards/views/main-grid/security.yaml`
  - Reaproveitado como `welcome_locks`.
  - Aponta para novo include de cards Bento.
- `config/dashboards/shared/grid-cards/welcome-locks.yaml` (**novo**)
  - Saudação dinâmica + data.
  - Card de portas (`grid_front_door`).

## 5) Sala destaque
- `config/dashboards/views/main-grid/climate.yaml`
  - `grid-area` alterada para `sala_feature`.
  - Título ajustado para “Sala”.
  - Reaproveita `climate-status.yaml` sem remoção.

## 6) Office 1x2
- `config/dashboards/views/main-grid/office.yaml` (**novo**)
  - Define bloco `office_tall`.
- `config/dashboards/shared/grid-cards/office-bento.yaml` (**novo**)
  - Card office + bloco auxiliar markdown.

## 7) Grid de cômodos 3x2
- `config/dashboards/views/main-grid/mainrooms.yaml`
  - `grid-area` alterada para `rooms_grid`.
  - Colunas alteradas para 3.
  - Include aponta para novo arquivo Bento.
- `config/dashboards/shared/grid-cards/rooms-bento.yaml` (**novo**)
  - 6 cards: Cozinha, Lavabo, Corredor, Q. Casal, Q. Marina, Q. Miguel.

## 8) Câmeras
- `config/dashboards/views/main-grid/cameras.yaml`
  - `grid-area` alterada para `cameras_big`.
  - Mantidos cards atuais de câmera.

## 9) Calendário
- `config/dashboards/views/main-grid/calendar.yaml` (**novo**)
  - Card dedicado `calendar_card`.
  - Abre popup de calendário existente.
  - Preview textual compacto.

## 10) Roborock 1x2
- `config/dashboards/views/main-grid/roborock.yaml` (**novo**)
  - Card dedicado `roborock_tall`.
  - Usa popup já existente (`footer_vacuum`).

## 11) Footer legado
- `config/dashboards/views/main-grid/z-footer.yaml`
  - Include antigo comentado.
  - Footer desativado em Bento com `media_query: '(max-width: 0px)'`.
  - Mantido no código para restauração rápida.

---

## Roteiro de implementação (ordem segura)

1. Atualizar `main.yaml` com áreas Bento.
2. Ativar `top_badges` (chips).
3. Aplicar sidebar ícones (`sidebar_nav_template`).
4. Conectar `welcome_locks` + `sala_feature`.
5. Inserir blocos novos (`office`, `calendar`, `roborock`).
6. Ajustar rooms 3x2.
7. Desativar footer horizontal legado (sem apagar).
8. Validar visual por viewport (desktop/tablet/mobile).

---

## Validação visual recomendada

Validar nos breakpoints:
- 1920x1080
- 1366x768
- 1280x800 (landscape)
- 800x1280 (portrait)
- 390x844 (mobile)

Checklist:
- Sidebar fixa e estreita, sem overflow.
- Top badges em linha única.
- Roborock realmente em 1x2.
- Calendário ocupa espaço restante sem quebrar.
- Câmeras e mídia sem distorção.

---

## Método de restauração (rollback seguro)

### Rollback rápido (sem editar YAML profundamente)
1. Em `config/dashboards/shared/sidebar/sidebar_tablet_landscape.yaml`:
   - voltar template para `sidebar_template`.
2. Em `config/dashboards/views/main.yaml`:
   - reativar bloco antigo de `grid-template-columns/areas` (já preservado em comentários).
3. Em `config/dashboards/views/main-grid/z-footer.yaml`:
   - descomentar include `../../shared/footer-shared.yaml`.

### Rollback por arquivo
Se necessário, desabilitar arquivos Bento novos:
- `views/main-grid/office.yaml`
- `views/main-grid/calendar.yaml`
- `views/main-grid/roborock.yaml`
- `shared/grid-cards/welcome-locks.yaml`
- `shared/grid-cards/rooms-bento.yaml`
- `shared/grid-cards/office-bento.yaml`

> Em rollback total, basta voltar o commit desta conversão.

---

## Observações finais

- Este documento é a referência de execução e manutenção da migração Bento.
- Novos ajustes devem seguir a mesma regra: **nunca apagar legado; comentar/desativar**.
