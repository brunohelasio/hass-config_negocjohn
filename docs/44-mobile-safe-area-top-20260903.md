# Regressão mobile — área segura superior do iPhone

Data: 2026-09-03. Correção implementada na candidata
`codex/home-occupancy-shadow-20260902`; aceite físico no iPhone ainda pendente.

## Sintoma e causa

Depois do reinício do Home Assistant, o dashboard passou a começar no topo da
viewport e ficou por baixo da barra de estado do iPhone. A captura recebida tem
742 x 1600 pixels e mostra hora, conectividade e bateria sobrepostos à faixa de
status do Bruno UI.

A regressão apareceu na mesma rodada da ativação da ocupação, mas o pacote
`home_occupancy_core.yaml` não altera frontend. A auditoria do commit de
ocupação confirmou que ele tocou somente o package, o include, testes e
documentação. O bundle `DuoAOL_I` já estava publicado e aguardava reinício.

O reinício também efetivou a passagem observada de HA Core 2026.8.3 para
2026.9.0. O defeito real estava no custom element `bruno-shell`: o modo phone
fixava `height: 100dvh`, porém não reservava o inset superior. Havia tratamento
explícito apenas para `env(safe-area-inset-bottom)`. Enquanto o container do HA
entregava uma área útil já recortada, o defeito ficava oculto; ao receber uma
viewport edge-to-edge, a shell começava em `y = 0`.

A comparação binária entre o bundle anteriormente carregado `C5Tz4bF_` e o
publicado `DuoAOL_I` não encontrou mudança de shell/Home mobile: o delta de
fonte era a altura responsiva dos controles da sheet de Iluminação do tablet.
No telefone, outra regra continuava fixando esses controles em 46 px. Portanto,
restaurar apenas `DuoAOL_I` não corrigiria a sobreposição superior.

## Correção mínima

Em `config/www/bruno-ui/core/bruno-shell.js`, somente dentro de
`@media (max-width: 800px)`, a shell agora:

1. calcula `--bruno-safe-top` como o maior valor entre o contrato publicado
   pelo HA (`--safe-area-inset-top`) e o inset nativo do WebKit
   (`env(safe-area-inset-top)`);
2. aplica esse valor como `padding-top`;
3. usa `box-sizing: border-box`, mantendo a altura externa em `100dvh`.

Assim, para uma viewport de altura `H` e inset `S`, a shell continua ocupando
exatamente `H`; o conteúdo útil começa em `S` e passa a ter `H - S`. Não há
acréscimo de altura nem deslocamento do dock para fora da tela. Com inset zero,
a geometria anterior é preservada. Acima de 800 px, nenhuma regra muda.

O código anterior ficou descrito imediatamente antes da correção para rollback,
conforme a regra de preservação do repositório. Há também um teste dedicado que
impede a remoção futura do `border-box`, dos dois fornecedores de inset ou do
teto de `100dvh`.

## Build e validação

- TypeScript: aprovado.
- ESLint: aprovado.
- Vitest: 20 arquivos e 293 testes aprovados.
- YAML: 251 arquivos aprovados.
- Sintaxe JavaScript: 200 arquivos aprovados pelo verificador do repositório.
- Build Vite: 91 módulos.
- Bundle: `bruno-dashboard.BHAJDN5A.js`.
- Main chunk: `chunks/main.uiioeD72.js`.
- Grafo local: sete módulos alcançáveis, nenhum ausente.
- Manifesto e compressões: gerados.

A comparação de `sourcesContent` entre os source maps anterior e novo encontrou
exatamente um fonte alterado no main chunk:
`../../bruno-ui/core/bruno-shell.js`. O source map do room chunk permaneceu sem
nenhum delta de fonte; seu novo hash deriva da referência ao main renomeado.

O verificador histórico de crases em modo `--tudo` continua acusando ocorrências
preexistentes em bundles e outros arquivos que não pertencem a esta correção;
ele não é registrado como aprovado. A sintaxe do arquivo alterado foi verificada
diretamente.

## Publicação, ativação e aceite

O runtime foi publicado no Everex com `configuration.yaml` por último. Foram
comparados 30 arquivos: 28 em `www/dashboard`, a fonte clássica da shell e a
configuração; **30/30 hashes SHA-256 são idênticos** entre checkout e Everex.
O verificador remoto encontrou os mesmos sete módulos alcançáveis e nenhum
ausente. `bruno-dashboard.DuoAOL_I.js` continua no destino para rollback.

| Arquivo-chave | SHA-256 publicado |
| --- | --- |
| `configuration.yaml` | `52EA693D6820FBACD14FC4CA799D1B559E9DC7A72DB1AAE921F0BE0BD35028C6` |
| `www/bruno-ui/core/bruno-shell.js` | `13DB1459DC4E8B8A4C62AF7010D65DA0D6859B2AE7AAE7F4E5B27962BDCE73EB` |
| `www/dashboard/manifest.json` | `A3F095848E66B366ABE186B6382EF4AF7CE3B7019E0D402AB60C03EF81868C01` |
| `www/dashboard/bruno-dashboard.BHAJDN5A.js` | `C8DAC14255108FA83C54517DBF80C987AA53EB56CF1FE01974A1EF6AE89B2C93` |
| `www/dashboard/chunks/main.uiioeD72.js` | `A244CE074D5F698C0981245180E84C0860D356561FED3B4C2351B8D28B69C52D` |

A troca do URL em `frontend.extra_module_url` exige reinício controlado do
Home Assistant. O agente não reiniciou o serviço; a validação física ocorre
depois de o usuário reiniciar e reabrir o app.

Checklist físico no iPhone:

- faixa de status do Bruno UI inteiramente abaixo de hora/Wi-Fi/bateria;
- Hero, Cômodos e Favoritos sem compressão anormal ou corte;
- dock inferior visível e tocável;
- abrir e fechar uma subview e a sheet de Iluminação;
- girar/reabrir o app e confirmar que não surge scroll do documento.

O merge em `main` permanece bloqueado até esse aceite.

## Rollback

Backup pré-alteração:
`tmp/rollback-20260903-mobile-safe-top/`.

Rollback cirúrgico: restaurar a versão anterior do bloco phone da shell,
reapontar `configuration.yaml` para
`bruno-dashboard.DuoAOL_I.js`, publicar a configuração por último e reiniciar
em janela autorizada. O package de ocupação não precisa ser removido para esse
rollback, pois não participa da renderização.
