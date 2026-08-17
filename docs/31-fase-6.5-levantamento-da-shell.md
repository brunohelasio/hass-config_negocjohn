# Fase 6.5 — levantamento da shell, antes de tocar nela

**Data:** 2026-08-16 · **Estado:** LEVANTAMENTO. **Nenhuma alteração de código.**
Aguarda validação.

Motivo do cuidado: a shell contém trabalho recente **validado no aparelho** —
do Codex (navegação, rail do telefone) e meu (altura do dock, camadas da folha).
Extrair peças dali sem mapa é o caminho mais curto para uma regressão em algo
que já passou pelo aceite.

---

## 1. O que a shell é hoje, medido

```
config/www/bruno-ui/core/bruno-shell.js
  2.452 linhas · 51 métodos · JavaScript clássico
  fora do TypeScript · fora dos 257 testes · 1 dos 47 extra_module_url
```

O roteiro dizia: *"risco a evitar, nomeado: a shell virar o novo monólito"*.
**O risco se concretizou.** Ela é o maior arquivo do projeto fora do gerado e o
único lugar onde seis assuntos independentes se encontram.

---

## 2. Os 51 métodos, agrupados por assunto

| grupo | linhas | % | métodos |
|---|---|---|---|
| **Estilo** | 886 | 36% | `_styles` |
| **Painéis / popups** | ~646 | 27% | 23 métodos: Config, Rede, Cenas, Sistema, Dispositivos, Updates, Temas, Wallpaper, Diagnóstico |
| **Ciclo de vida / infra** | ~371 | 15% | `constructor`, `setConfig`, `_configFingerprint`, `connectedCallback`, `disconnectedCallback`, `_observarDock`, `_onFolha`, utilitários |
| **Roteamento / seções** | ~288 | 12% | `_goToSection`, `_activateSection`, `_syncFromHash`, `_sectionElement`, `_setSectionVisibility`, `_navigationSectionKey`, `_handleSectionNavigationClick`, `_handleHassNavigate`, `_currentHashKey`, `_homeSectionKey`, erros de seção |
| **Fundo (backdrop)** | 116 | 5% | `_applyBackdrop`, `_loadBackdrop`, `_applyBackdropEffect`, os dois `_preload*` |
| **Rail** | 56 | 2% | `_applyRailForSection`, `_updateRailSelection`, `_renderRailError` |

### O achado que reposiciona a fase

**Roteamento + rail + fundo somam 460 linhas — 19% do arquivo.** Extrair
exatamente o que o roteiro chama de 6.5 deixaria a shell com ~2.000 linhas.

O volume está em **estilo (36%)** e **painéis (27%)**. E os painéis são
território da 6.6.

---

## 3. Como os painéis estão montados hoje

Dois padrões convivendo:

**Antigo — string de HTML + despacho central.** `bruno-system-panel.js`,
`bruno-network-panel.js`, `bruno-scenes-panel.js` e `bruno-updates-panel.js`
exportam um objeto com `render()` que devolve **texto HTML**. A shell injeta
esse texto num overlay e trata os cliques por delegação. É por isso que
`_handleConfigClick` tem **128 linhas**: ele é o roteador de eventos de seis
painéis ao mesmo tempo.

**Novo — elemento de verdade.** Diagnóstico e Dispositivos são custom elements,
criados com `createElement` e com estado próprio.

O alvo já está demonstrado dentro do próprio projeto. Não é preciso inventá-lo.

---

## 4. O que NÃO pode ser alterado

15 blocos da shell mudaram desde o último commit (+177 / −7). São trabalho
recente e validado:

| região | origem | o que é |
|---|---|---|
| navegação por `history.replaceState` e ativação direta | **Codex** | matou o `Loading data` ao entrar e sair das subviews |
| rail do telefone, `hide_on_phone`, grupo Quartos | **Codex** | cinco destinos, aceito no aparelho |
| bloco `@media (max-width: 800px)` do `_styles` | **Codex** | dock, safe-area, material da folha |
| `_observarDock` e `--bruno-dock-h` | meu | altura do dock medida, publicada por herança |
| `_onFolha` e a classe `tem-folha` | meu | camadas quando a bottom sheet abre |

**Regra para a fase inteira: comportamento idêntico.** A extração move código
de lugar; não corrige, não melhora e não "aproveita para" nada. Qualquer
melhoria vira item separado, depois do verde.

---

## 5. Duas opções de escopo

### Opção A — 6.5 como está no roteiro

Extrai roteamento, rail e fundo para TypeScript, dentro do bundle e sob teste.

| | |
|---|---|
| sai da shell | ~460 linhas (19%) |
| shell fica com | ~2.000 linhas |
| ganho principal | **roteamento passa a ter teste** — hoje tem zero, e foi exatamente ele que quebrou no telefone |
| ganho na corrida de carga | 0 módulos a menos (a shell continua sendo um arquivo à parte) |
| risco | baixo: são as três áreas com menos trabalho recente |

### Opção B — 6.5 + os painéis (antecipa parte da 6.6)

Além do acima, converte os quatro painéis de string para elemento e move a
shell inteira para o bundle.

| | |
|---|---|
| sai da shell | ~1.100 linhas (45%) |
| shell fica com | ~900, quase só moldura e estilo |
| ganho na corrida de carga | **−5 módulos** (shell + 4 painéis saem dos 47) |
| risco | médio: mexe no `_handleConfigClick`, que é o roteador de eventos de todos os painéis |

**Recomendo a A.** Não por ser menor, mas porque o ganho que importa hoje é
teste de roteamento, e ele vem inteiro na A. A B mistura duas fases e coloca o
despacho de eventos dos painéis em risco na mesma rodada em que o roteamento
muda de lugar — se algo quebrar, não se sabe qual metade foi.

A B fica como 6.6, onde os painéis já estavam.

---

## 6. Ordem proposta para a Opção A

Cada passo é verificável antes do seguinte, e cada um pode parar sem deixar o
projeto num estado intermediário.

| passo | o que sai da shell | como verifico |
|---|---|---|
| 1 | **Roteamento**: qual seção está ativa, como se chega, cache, histórico | testes de unidade do roteador + banco de shell nos seis cômodos, telefone e tablet |
| 2 | **Rail**: itens por seção, seleção, erro | banco de shell: 5 destinos no telefone, 8 no tablet |
| 3 | **Fundo**: carga, pré-carga, efeito por seção | comparação de imagem aplicada por seção, antes e depois |
| 4 | shell passa a delegar às três peças; o arquivo encolhe | contagem de linhas e `npm run check` |

Em nenhum passo o `_styles` é tocado — é onde vive o bloco de telefone do
Codex, e ele não tem por que se mover nesta fase.

---

## 7. Critérios de aceite

1. navegação Home → cômodo → Home → outro cômodo, no telefone e no tablet, sem
   remontagem, sem tela vazia e sem `Loading data`;
2. rail com 5 destinos no telefone e 8 no tablet, seleção acesa correta;
3. fundo trocando por seção como hoje;
4. geometria das subviews idêntica no banco 428×926 e 1920×1200, antes e depois;
5. `npm run check` verde, com testes NOVOS cobrindo roteamento;
6. bundle publicado só depois de 1 a 5.

---

## 8. O que fica fora desta fase, explicitamente

- os seis painéis e o `_handleConfigClick` → 6.6;
- o `_styles`, inclusive o bloco de telefone → nenhuma fase prevista; ele só se
  move quando os painéis saírem e levarem seu CSS junto;
- qualquer ajuste visual, de composição ou de comportamento do telefone;
- a contagem de 47 módulos só cai na 6.6/7 — a 6.5 não promete isso.
