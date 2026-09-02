# Home tablet — faixa de 7 room tiles (2026-09-01)

## Decisão e escopo

A Home V2/V3 do tablet deixa de renderizar a instância visual do Corredor e
mantém, nesta ordem, Sala, Office, Cozinha, Lavabo, Casal, Marina e Miguel.
`rooms.config.ts` não foi alterado: o Corredor continua sendo um cômodo lógico,
com `light.corredor_switch_1` e `binary_sensor.corredor_motion_recent`, e segue
no inventário da sheet global de Iluminação.

No tablet, a perda do tap direto do Corredor é deliberada. O caminho preservado
é hold em `Lights` -> side sheet -> circuito Corredor. Nenhuma função nova,
controle compensatório ou representação substituta de presença foi criada.

O mobile não usa o bloco alterado: `bottom_block` e `dynamic` continuam
restritos a `min-width: 801px`, enquanto a composição phone é definida pelo
override `max-width: 800px`.

## Geometria

A linha interna anterior era `calc(23vh - 24px)`. O fator 8/7 foi aplicado à
linha e ao bloco externo; o Hero cede exatamente o mesmo delta:

| medida | anterior | nova |
|---|---:|---:|
| linha interna | `calc(23vh - 24px)` | `calc(26.285714vh - 27.428571px)` |
| `bottom_block` | `calc(23vh - 12px)` | `calc(26.285714vh - 15.428571px)` |
| Hero/dynamic | `calc(77vh - 80px)` | `calc(73.714286vh - 76.571429px)` |
| colunas | 8 | 7 |

Resultados determinísticos:

| viewport | Hero antes -> depois | faixa antes -> depois | tile H antes -> depois |
|---|---:|---:|---:|
| 1280 x 720 | 474,4 -> 454,1714 px | 153,6 -> 173,8286 px | 141,6 -> 161,8286 px |
| 1363 x 742 | 491,34 -> 470,3886 px | 158,66 -> 179,6114 px | 146,66 -> 167,6114 px |
| 1920 x 1200 | 844 -> 808 px | 264 -> 300 px | 252 -> 288 px |

Em todos os casos a altura fecha exatamente: badges 48 px + Hero + faixa +
dois gaps de 10 px + padding externo de 24 px = 100% do viewport. A borda
inferior permanece ancorada e não nasce scroll vertical.

No Josh, com o mesmo limite externo, inset total de 60 px e gap zero, a faixa
de referência de 1820 px passa de 220 px por track para 251,4286 px. O browser
arredondou os sete tracks para 251,4219/251,4375 px, sem overflow. Em
1280 x 720, a faixa de 1180 px passa de 140 px para 160 px por track. Largura e
altura crescem 8/7 = 14,2857%; a área cresce 30,6122%.

Nos temas cujo token conserva gap de 10 px, o gap não foi alterado nem
transformado em margem: além do espaço da oitava track, as sete tiles absorvem
o gap que deixa de existir. Por isso a largura efetiva cresce ligeiramente mais
que 14,2857% nesse fallback, comportamento coerente com o limite externo fixo.

## Escala interna

Os valores preferidos em `cqi` continuam iguais e crescem automaticamente com
o container: título, texto semântico, métricas, dots, área do asset, navegação,
trilhos e espaçamentos fluidos. Os limites `min`/`max` dos clamps do modo tile
tablet foram elevados em 8/7, pois em telas baixas eles prendiam a composição
nos limites antigos. Também foram escalados os poucos pixels fixos relevantes;
o glifo interno dos dots passou de 14 para 16 px.

No harness 1280 x 720, a tile de 160 x 161,8286 px mediu: título 13,37 px,
texto semântico 9,81 px, métrica 12,29/10,39 px, dot 24,5625 px, glifo 16 px,
chevron 20,5 px e asset com 68,0156 px de altura. As razões contra os limites
anteriores ficam entre 14,17% e 14,34%, apenas com arredondamento subpixel.
Não há `transform: scale()` e todo override novo está sob
`@media (min-width: 801px)` + `.room-card.is-tile`.

## Validação

- TypeScript e ESLint: aprovados.
- Vitest relacionado: 35/35 testes aprovados.
- Vitest completo: 19 arquivos, 288/288 testes aprovados.
- YAML: 250/250 arquivos aprovados.
- Sintaxe JS: 200/200 arquivos aprovados.
- Guard de crases direcionado ao fonte alterado: aprovado. A varredura ampla
  continua apresentando os falsos positivos históricos de terceiros/build.
- Vite: 91 módulos; bundle `bruno-dashboard.DhYtGiF6.js`, main chunk
  `chunks/main.tKE0s7fq.js` e room chunk
  `chunks/bruno-room-subview.WhJmFbja.js`.
- Manifesto, compressões e grafo local de sete módulos: aprovados.
- Faixa 1280 x 720: 7/7 tiles, ordem esperada, 160 px cada,
  `clientWidth = scrollWidth = 1180`, overflow horizontal falso.
- Faixa de referência 1920: sete tracks de aproximadamente 251,43 px,
  `clientWidth = scrollWidth = 1820`, overflow horizontal falso.
- Mobile 428 x 926: todas as medidas da baseline repetidas exatamente, inclusive
  Hero 118,6 px, pager 352 px, favoritos 248,8 px, sem scroll e 6 px de folga
  até o filete.
- Hold real de 620 ms em `Lights`: evento de abertura emitido, sheet solicitada
  e `light.corredor_switch_1` presente nas entidades monitoradas.
- Os fontes do hold, shell, sheet e `rooms.config.ts` têm delta zero nesta
  rodada. O teste do modelo confirma que o Corredor permanece associado ao
  inventário, e não cai em `Sem cômodo`.

## Operação, base e rollback

`origin/main` está em `5e67467a`; o checkout e o Everex vigentes estão na
candidata `local/ajustes-gerais-20260823`, HEAD `84d8fa0a`, que contém um commit
mobile já implantado. Os quatro fontes-alvo eram idênticos entre as duas refs.
A alteração foi feita na candidata operacional para não republicar um bundle
que regredisse esse commit mobile. `main` não foi mergeada nem alterada.

Rollback local: `tmp/rollback-20260901-tablet-room-tiles-7/`.
Backup do payload atual do Everex:
`tmp/everex-preflight-20260901-tablet-room-tiles-7/`.

Publicado no Everex em 2026-09-01 após autorização explícita. Os 28 arquivos de
`config/www/dashboard/` foram copiados primeiro; os três YAMLs vieram em seguida
e `configuration.yaml` foi copiado por último. A comparação final aprovou
32/32 pares SHA-256. O grafo remoto encontrou sete módulos alcançáveis a partir
de `bruno-dashboard.DhYtGiF6.js`, sem ausência. O bundle anterior
`bruno-dashboard.qBASlcMq.js` permanece no Everex para rollback. O Home
Assistant não foi reiniciado; aceite físico no tablet continua pendente.
