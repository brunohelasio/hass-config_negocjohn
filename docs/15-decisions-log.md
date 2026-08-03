# 15 — Registro de decisões

Decisões com consequência arquitetural. As anteriores a 2026-08-02 foram
reconstruídas a partir do `CLAUDE.md`.

---

**Data:** 2026-06-24
**Decisão:** A shell (`custom:bruno-shell`) passa a ser o painel padrão, assumindo o path `bento-lab`.
**Contexto:** cada seção era uma view do Lovelace; trocar de seção remontava a rail inteira.
**Alternativas:** manter views separadas e aceitar a remontagem.
**Motivo:** view única + `type: panel` + navegação por hash mantém a rail viva.
**Consequências:** `views/main.yaml` e os 39 arquivos de `main-grid/` viraram legado, mas continuam sendo parseados a cada carregamento.
**Arquivos:** `ui-lovelace-main.yaml`, `views/bento_shell.yaml`
**Status:** ✅ vigente

---

**Data:** 2026-06-24
**Decisão:** Remover o bloco `resources:` do `ui-lovelace-main.yaml`.
**Contexto:** os mesmos JS eram declarados ali **e** em `frontend.extra_module_url`.
**Motivo:** o tablet baixava cada módulo duas vezes, dobrando a carga no WebView.
**Consequências:** `extra_module_url` virou o único manifesto de carregamento.
**Status:** ✅ vigente

---

**Data:** 2026-07-03/04
**Decisão:** Molde único de presença/ocupação em três camadas para todos os cômodos.
**Contexto:** 4 lógicas diferentes entre cômodos, 3 sem camada nenhuma; `static` excluído da ocupação e uso de `medium`, valor inexistente no enum do sensor.
**Motivo:** presença precisa ser imediata; ocupação precisa de permanência. São grandezas diferentes e estavam misturadas.
**Consequências:** 7 packages novos/alterados; o ponto lê só `motion_recent`, o texto exige ocupação **e** presença.
**Status:** ✅ vigente

---

**Data:** 2026-07-04
**Decisão:** Remover a trava de contexto (self-latch) da ocupação.
**Contexto:** com o A/C ligado, a ocupação do Q. Miguel ficava presa em ON indefinidamente.
**Alternativas:** ajustar os tempos da trava.
**Motivo:** a folga do `delay_off` já cobre microquedas do radar; a trava era redundante e nunca liberava.
**Consequências:** contexto **não** volta como trava de estado. Se necessário, usar como condição em automação.
**Status:** ✅ vigente

---

**Data:** 2026-07-09
**Decisão:** Estender a própria shell ao celular (media query), em vez de manter um mundo móvel paralelo.
**Contexto:** três gerações de interface móvel (V1, V2, V3), todas com defeitos estruturais — a barra do V2 nunca foi conectada a view alguma; o V3 navegava para um slug especulativo.
**Motivo:** um único modelo de interação.
**Consequências:** as 5 views do V3 continuam incluídas como fallback e ainda são parseadas sem servir para nada.
**Status:** ✅ vigente — aposentar as views V1/V2/V3 na Fase 3

---

**Data:** 2026-08-02
**Decisão:** Ancorar a tag `pre-dashboard-architecture` no commit `e0dc9da3` em vez de criar um commit de checkpoint.
**Contexto:** durante a Fase 0, apareceu um commit de 179 arquivos ("Atualização") entre duas chamadas de ferramenta. Depois confirmado: era o usuário pelo GitHub Desktop.
**Motivo:** o conteúdo era equivalente ao checkpoint pretendido; um segundo commit seria redundante.
**Status:** ✅ concluída

---

**Data:** 2026-08-02
**Decisão:** Remover o dashboard `homekitesq-teste`.
**Contexto:** registrado em `configuration.yaml` apontando para `lovelace-homekitesq.yaml`, inexistente no repositório e no histórico do Git.
**Motivo:** base "sagaland" que não evoluiu; aparecia quebrada no sidebar.
**Consequências:** 6 linhas comentadas in-place; exige reinício do HA.
**Status:** ✅ concluída

---

**Data:** 2026-08-02
**Decisão:** Instalar Node.js 24.18.1 LTS.
**Contexto:** a arquitetura de destino exige Node, ausente na máquina.
**Consequências:** desbloqueou a Fase 4 e, de imediato, deu ao projeto a primeira checagem sintática (`node --check`, 55/55 OK) — o detector correto para o erro da crase, que já derrubou o dashboard 4 vezes.
**Status:** ✅ concluída

---

**Data:** 2026-08-02
**Decisão:** **Não** adotar Zod.
**Contexto:** constava da proposta original de stack.
**Alternativas:** Zod para validar a configuração de cômodos e entidades.
**Motivo:** a configuração é estática e autoral — TypeScript já a cobre em tempo de build. E Zod **não resolve o defeito real**: valida o formato (`"light.x"` é texto?), não a existência da entidade no HA, que é a falha que de fato ocorre quando algo é renomeado. São ~13 KB num orçamento de ~253 MB de RAM disputada.
**Consequências:** no lugar, verificação de existência de entidades em `hass.states` na camada de diagnóstico, apontando componente e cômodo afetados.
**Status:** ✅ decidida

---

**Data:** 2026-08-02
**Decisão:** Adiar Playwright para a Fase 7.
**Contexto:** constava da fundação técnica (Fase 4).
**Motivo:** Playwright roda Chromium no computador. Tudo o que quebra neste projeto quebra no **tablet** — memória do WebView, autoplay, vibração, cache. Testes verdes no desktop criariam confiança falsa.
**Consequências:** Vitest fica, focado em funções puras (lógica de presença, tempo decorrido, contagem de luzes, seletores). Playwright entra depois, só para regressão de layout.
**Status:** ✅ decidida

---

**Data:** 2026-08-02
**Decisão:** O build precisa publicar direto no `/config` do HA (`npm run deploy`).
**Contexto:** o fluxo atual é editar → copiar por Samba → commitar.
**Motivo:** sem isso, a Fase 4 acrescenta uma etapa de build **e** mantém a cópia manual — a arquitetura nova deixaria o dia a dia pior que hoje.
**Status:** 🔜 Fase 4

---

**Data:** 2026-08-02
**Decisão:** Independência de resolução vira **critério de aceitação da arquitetura**.
**Contexto:** o usuário relatou que trocar o Galaxy Tab S6 Lite (2000×1200) pelo Redmi Pad 2 (2560×1600) desorganizou o dashboard, e só normalizou alterando a resolução do tablet. Medido: 6.210 px fixos, 157 media queries com 6 breakpoints, zero container queries.
**Alternativas:** somar mais breakpoints por aparelho.
**Motivo:** breakpoints se multiplicam por aparelho **e** pelos 6 arquivos de subview duplicados. Não escala.
**Consequências:** a Fase 4 passa a incluir tokens de escala fluida — sem isso os px fixos atravessam a migração para dentro do TypeScript. Todo componente migrado nasce com container query e precisa funcionar de 600 a 2000 px sem breakpoint próprio.
**Status:** ✅ decidida — ver `07`

---

**Data:** 2026-08-02
**Decisão:** Adotar container queries como mecanismo primário.
**Contexto:** WebView do tablet confirmada em **150.0.7871.181** (Chrome 150), Android 15.
**Motivo:** container queries entraram no Chrome 105 — 45 versões abaixo. Nenhum fallback legado necessário.
**Consequências:** também liberados `cqw/cqi/cqh`, `:has()`, `dvh/svh/lvh`, subgrid, `@property`.
**Status:** ✅ decidida

---

**Data:** 2026-08-02
**Decisão:** Redimensionar os assets de cômodo para 384 px (768 px para a TV).
**Contexto:** PNGs de até 1254×1254 exibidos a no máximo 120×116 px; 64,3 MB de bitmap decodificado contra ~253 MB de RAM disponível ao app.
**Motivo:** mais de um quarto do orçamento de memória gasto em resolução invisível.
**Consequências:** 64,3 → 9,6 MB. **14 assets não foram tocados** — só aparecem em comentários de rollback; vão para `_archive` na Fase 3. Exigiu cache-bust em cascata (34 URLs + 14 recursos).
**Status:** ✅ concluída — qualidade aprovada no tablet

---

**Data:** 2026-08-02
**Decisão:** Limpar a VM renomeando, não apagando.
**Contexto:** `.git` adormecido (65 MB, um commit de 2026-04-10, branch `sync-config-local` nunca usada) e `Hemma-main` (6 MB, projeto de referência) dentro do `/config`, entrando em todo backup.
**Motivo:** renomear é reversível em um comando; apagar não.
**Consequências:** 71 MB fora dos backups. **Excluir a partir de 2026-08-09** se nada quebrar.
**Status:** ⏳ em observação até 2026-08-09
