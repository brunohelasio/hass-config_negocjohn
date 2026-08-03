# 10 — O que funciona e não pode ser perdido

Soluções maduras, validadas no tablet. **A migração precisa preservar o
comportamento destas** — se um componente migrado divergir daqui, o migrado está
errado.

---

## Molde único de presença/ocupação (2026-07-03 a 07-04)

A solução mais bem resolvida do projeto. Três camadas por cômodo:

```
L1  binary_sensor.<slug>_motion_recent   espelho do presence bruto (delay_off 5s)
L2  binary_sensor.<slug>_occupancy       presença sustentada (delay_on 45–60s)
L3  sensor.<slug>_semantic_state         occupied/none + texto de exibição
```

**Regra funcional:** o **ponto** acende e apaga rápido (presença); o **texto**
exige permanência (ocupação) **e** presença ativa. A ocupação mantém liberação
longa (120–180 s) para automações futuras, mas essa folga fica invisível na UI.

Por que importa: antes disso havia 4 lógicas diferentes entre cômodos e 3 sem
camada nenhuma. O estado `static` do `motion_state` era excluído (pessoa parada
nunca virava "Ocupado") e usava-se `medium`, valor **inexistente** no enum
`none/large/small/static`.

Timers: Sala/Office 60/180 · Quartos 60/180 · Cozinha 45/120 · Lavabo 120.

---

## Shell única com navegação por hash (2026-06-24)

`views/bento_shell.yaml` → um único `custom:bruno-shell`, `type: panel`, path
`bento-lab`. As seções trocam pelo hash (`bento-lab#home`, `#sala`, `#cameras`).

**Ganho:** como a view é única, **a rail nunca remonta** ao trocar de seção. É a
diferença entre uma aplicação e um conjunto de páginas.

Preservar na migração: o roteamento por hash, a rail persistente e a troca de
rail por seção (`section_rails`), que mantém moldura e posição fixas trocando só
os itens.

---

## Feature flag de uma linha

```yaml
sections:
  # ANTERIOR (rollback V1): home: !include shell/section_home.yaml
  home: !include shell/section_home_v2.yaml
```

Home V1 e V2 convivem; a troca é uma linha. Ambas as versões têm tratamento de
celular, então o rollback é funcional, não teórico.

**Padrão a manter na migração:** cada componente migrado entra ao lado do atual,
com troca de uma linha — nunca substituindo direto.

---

## Deduplicação de recursos (2026-06-24)

O bloco `resources:` do `ui-lovelace-main.yaml` foi comentado por inteiro: todos
os JS já vinham por `frontend.extra_module_url`. Carregar nos dois lugares fazia
o tablet **baixar cada módulo duas vezes**, dobrando a carga no WebView e
contribuindo para os "erro de configuração" intermitentes.

---

## Pipeline `uix-dialog` no tema do tablet (2026-03-29)

O `tablet.yaml` era o único tema sem o bloco `uix-dialog`, então `--popup-width`
era ignorado. A compensação era um `card_mod` com `!important` direto no
`.mdc-dialog__surface` de **cada** popup, sobrescrevendo o sistema nativo.

Com o bloco no tema, o pipeline voltou a ser:

```
popup: --popup-width  →  tema: --ha-dialog-width-md  →  HA dimensiona
```

Redimensionar um popup voltou a ser mudar **um valor**.

**Lição transferível:** quando cada instância precisa de um `!important`, o
defeito está uma camada acima.

---

## Ponte de movimento das câmeras Tuya (2026-07-13)

`config/custom_components/bruno_tuya_motion/` escuta a fila MQTT **já criada**
pela integração Tuya/Xtend e traduz o DP `initiative_message` (212,
`cmd: ipc_motion`) em estados `bruno_tuya_motion.<camera>`.

**Não modifica a integração original.** As entidades nativas
(`movement_detect_pic`, `alarm_message`, `device_notifications`) não publicam
esse evento — daí a necessidade.

Contra-exemplo registrado junto: `camera.* = recording` **não** é evento de
movimento; é estado operacional persistente. Usá-lo gerou o falso "7 de 8
câmeras com movimento".

---

## Estado compartilhado em helpers do HA

`input_boolean.sala_tv_controls_expanded`, `input_select.bento_active_camera` e
similares guardam estado de UI **no Home Assistant**, não no cliente.

**Por que é o padrão certo:** o estado sobrevive a recarregamentos, é o mesmo em
todos os aparelhos e é visível ao HA (automações podem lê-lo). Manter na
arquitetura nova — é preferível a um store no cliente.

---

## Fallback gracioso de imagem

`_bindImageFallbacks()` + `data-image-wrapper` com ícone de reserva em
`display: contents`: se o PNG der 404, aparece o ícone em vez de imagem
quebrada. É o que segura a ausência de `/local/images/office_pc.png` hoje.

Generalizar na arquitetura nova: **nenhum recurso ausente deve produzir estado
visual quebrado.**

---

## Grade 2 colunas de iluminação com clamp por faixas inteiras

A seção expandida de luzes trava num múltiplo exato de faixa e rola o excedente
— **nunca mostra meia faixa cortada**. O cálculo é layout-agnóstico: mede o
limite inferior da coluna, desconta o que vem depois e o que já está ocupado.

Preservar o comportamento; a implementação (medição em JS) deve virar
container query na migração.

---

## Regra de ouro: comentar antes de substituir

Todo bloco substituído fica comentado in-place, marcado `ANTERIOR (rollback)`,
com o novo abaixo. **Foi o que permitiu reverter, em minutos, os incidentes de
2026-07-29 e 2026-08-02.**

Tensão conhecida: é também a origem de 1.178 linhas de comentário histórico no
código de produção (`bruno-josh.js` com 57%). A saída acordada é mover o
histórico para `docs/` **e** para o Git — não abandonar a regra enquanto não
houver build, teste e revisão para substituí-la.
