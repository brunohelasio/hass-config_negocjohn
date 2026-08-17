# Fase 6.3E — estado real da implementação mobile

**Data do registro:** 2026-08-12  
**Escopo:** Home mobile, subviews de cômodo, bottom sheets, rail inferior,
navegação interna e publicação dos artefatos.  
**Regra permanente:** qualquer correção desta fase deve ficar restrita ao
telefone (`max-width: 800px`). O tablet continua sendo a experiência principal
e não pode perder destinos, composição ou comportamento.

Este documento consolida informações que antes estavam distribuídas entre os
documentos 26–29, `CLAUDE.md`, o histórico de publicação e os bancos de teste.
Ele distingue implementação, validação de laboratório e aceite no aparelho.

---

## 1. Decisões de produto confirmadas

1. A mesma shell atende tablet e telefone; a composição interna continua
   específica de cada modo.
2. No telefone, a rail inferior mostra Home, Sala, Cozinha, Office e Quartos.
   Quartos abre Q. Casal, Q. Marina e Q. Miguel. No tablet permanecem os oito
   destinos: Home, Sala, Cozinha, Office, os três quartos e Power.
3. A Home mobile continua com rolagem curta. Na etapa inicial, Energia e Mídia
   permaneceram em linhas próprias; na revisão de 2026-08-10, os dois cards
   fixos foram preservados em comentário e cederam a posição para a área
   dinâmica de Câmera, Roborock e Mídia, acionada por relevância.
4. O card Sala da Home é full-width, com altura equivalente à dos demais cards
   de cômodo e separador central.
5. Nas subviews, a câmera permanece logo abaixo da faixa de status. Cortina,
   Iluminação, Hub/Estação e A/C formam a área de controles.
6. Iluminação, Hub/Estação, A/C e Eletrodomésticos abrem como bottom sheet no
   telefone. O tablet mantém os módulos no fluxo original.
7. O fechamento das folhas é por toque externo, arrasto para baixo ou chevron
   junto ao título. O botão Concluir e o X circular não fazem parte do desenho.
8. A rail fechada deve permanecer transparente. Somente com a folha aberta ela
   deve assumir exatamente o mesmo material visual da folha, separada por um
   filete translúcido.
9. A câmera continua sendo um card. A imagem fica dentro dele, com respiro entre
   todas as bordas da imagem e as bordas do card.
10. Cards dinâmicos da Home — Mídia/Spotify, Roborock e Câmera — devem preservar
    no telefone a mesma regra funcional já vigente no tablet.

---

## 2. O que foi implementado até o bundle atual

### 2.1 Home e navegação

- shell compartilhada reorganizada em uma coluna no telefone;
- rail vertical convertida em dock inferior somente abaixo de 800 px;
- Sala compacta e full-width; demais cômodos em grade de duas colunas;
- Energia e Mídia chegaram a ser mantidas separadas; na revisão de 2026-08-10,
  os includes fixos foram comentados e substituídos pela área dinâmica mobile;
- grupo Quartos adicionado à rail mobile;
- seleção de Q. Casal, Q. Marina e Q. Miguel pelo grupo Quartos;
- navegação interna do telefone trocada de `location.hash` com `hashchange`
  para `history.replaceState` mais ativação direta da seção já montada;
- eliminação, no banco e no aparelho, da remontagem geral que produzia tela
  preta e `Loading data` ao entrar e sair das subviews.

### 2.2 Subviews dos cômodos

- bloco de CSS mobile separado em `subview-phone.styles.ts`;
- empilhamento comum aplicado a Sala, Cozinha, Office e três quartos;
- câmera colocada imediatamente abaixo da faixa de status;
- PIP de Sala/Cozinha redimensionado e ancorado no canto inferior direito;
- Cortina convertida em faixa própria no telefone;
- Abrir, Parar, Fechar, slider e marcas percentuais religados aos serviços reais
  de `cover`;
- Iluminação, Hub/Estação, A/C e Eletrodomésticos transformados em lançadores e
  bottom sheets;
- folhas com altura derivada do conteúdo e teto baseado no viewport;
- saída animada, toque externo e arrasto para fechar;
- rail preservada visível durante a folha;
- material Josh mobile da folha aproximado do VisionOS;
- linhas internas do Hub receberam altura mínima e centralização adicionais;
- DOM móvel oculto acima de 800 px e estado da folha limpo ao cruzar o
  breakpoint para tablet.

### 2.3 Câmeras e ONVIF

- subviews TypeScript usam o player oficial `ha-web-rtc-player` para as câmeras
  autorizadas, mantendo snapshot como fallback;
- lazy-load determinístico, negociação de até 30 s e retomada 700 ms após
  fechamento do More Info;
- apenas a câmera principal recebe vídeo ao vivo; PIP permanece leve;
- quarentena de quadros verdes e retenção do último quadro válido;
- o ciclo ONVIF/WebRTC não é a causa direta da antiga tela global
  `Loading data`; a causa confirmada dessa tela era a navegação com
  `hashchange` no WebView.

### 2.4 Planta 3D, Roborock e demais subviews

- Roborock foi empilhado em uma coluna no telefone;
- mapa teve tratamento para impedir corte dos controles inferiores;
- subview de câmeras já tinha composição mobile própria;
- planta 3D recebeu proposta e implementação de visão geral mais comandos por
  cômodo para evitar 37 alvos sobrepostos em aproximadamente 390 px;
- essas áreas continuam subordinadas ao aceite visual em aparelho real.

---

## 3. Arquivos e artefatos envolvidos

### Fontes principais

- `dashboard-src/src/components/rooms/bruno-room-subview.ts`
- `dashboard-src/src/components/rooms/subview-phone.styles.ts`
- `dashboard-src/src/components/rooms/bruno-room-tile.ts`
- `dashboard-src/src/services/camera/`
- `dashboard-src/src/config/camera-webrtc.config.ts`
- `config/www/bruno-ui/core/bruno-shell.js`
- `config/www/bento-sidebar-card.js`
- `config/dashboards/views/shell/rail_rooms.yaml`
- `config/dashboards/views/main-grid/v2/bento_dynamic_phone.yaml`
- `config/dashboards/views/shell/section_home_v2.yaml`
- `scripts/harness/gen-shell-harness.mjs`

### Publicação ativa antes deste diagnóstico

- bundle: `bruno-dashboard.Dvu9B_BT.js`;
- shell: `bruno-shell.js?v=20260812-mobile-ajustes-finos-1`;
- sidebar: `bento-sidebar-card.js?v=20260812-mobile-faixa-refino-1`;
- rollback da última publicação:
  `\\192.168.3.102\config\tmp\rollback-20260812-mobile-ajustes-finos-1`.

Na última publicação, bundle, sourcemap, loader, manifesto, shell e
`configuration.yaml` foram copiados com a configuração por último. Os seis
pares local × VM tiveram SHA-256 idêntico.

---

## 4. O que os bancos de teste aprovaram

### Telefone 428 × 926

- câmera na mesma caixa geométrica antes e depois de abrir uma folha;
- PIP medido em 124 × 82,7 px, proporção 3:2;
- folha termina acima da rail;
- X invisível e chevron presente;
- toque externo, chevron e arrasto fecham;
- alturas das folhas diferentes e derivadas do conteúdo;
- nenhum conteúdo inalcançável;
- navegação Sala → Office → Cozinha → Sala sem `hashchange`, sem tela vazia e
  reutilizando a mesma shell;
- Cortina com quatro chamadas funcionais validadas;
- suíte Vitest com 208 testes aprovada.

### Tablet 1366 × 768

- oito destinos da rail visíveis;
- rail em coluna;
- conteúdo em colunas laterais;
- elementos exclusivos do telefone invisíveis;
- nenhuma folha ativa.

### Limite conhecido do banco

O banco desktop não reproduz fielmente:

- `env(safe-area-inset-bottom)` do iPhone dentro do app do Home Assistant;
- a composição de blur entre shadow roots no WebView iOS;
- a pintura real dos pseudo-elementos e bordas sobre o wallpaper do aparelho;
- a mudança de proporção do Hub com metadados e arte reais;
- o gatilho dos cards dinâmicos da Home a partir do estado real das entidades.

Portanto, aprovação geométrica no harness não equivale a aceite visual e
funcional no iPhone.

---

## 5. Resultado no iPhone após o bundle `Dvu9B_BT`

As imagens de 11:03 reprovaram quatro pontos:

1. **Câmera:** o card externo deixou de ser visualmente reconhecível. A imagem
   passou a parecer o próprio card; não há o respiro inferior solicitado. O PIP
   voltou a tocar a borda inferior da imagem. Com a folha aberta permanece uma
   colisão visual na região superior entre a borda/separador e o título/ícone.
2. **Rail:** fechada, recebeu uma superfície visível apesar do requisito de
   transparência. Aberta, sua superfície ainda não coincide com a folha; há uma
   mudança de tom/material na junção.
3. **Cards dinâmicos:** iniciar Spotify no Office atualiza a folha da subview,
   mas não produz o card dinâmico correspondente na Home mobile. Roborock e
   Câmera ainda precisam ser auditados pela mesma cadeia de visibilidade.
4. **Hub/Estação:** o módulo do tablet foi apenas estreitado. A redução de
   largura aumenta excessivamente a altura, empilha controles e deixa a arte
   vertical dominar a folha, sem uma composição mobile própria.

Esses quatro pontos permanecem **abertos**. Nenhuma correção deles foi aplicada
na rodada de documentação e diagnóstico que gerou este registro.

---

## 6. Critérios de aceite da próxima correção

1. câmera continua card, com cabeçalho, moldura e gaps independentes da imagem;
2. PIP não toca nenhuma borda e mantém alvo de toque adequado;
3. abrir qualquer folha não altera borda, título, ícone ou geometria da câmera;
4. rail fechada é transparente; rail aberta e folha têm valores computados
   idênticos de background, filter e cor;
5. Spotify ativo produz o card dinâmico na Home mobile; Roborock e Câmera passam
   pela mesma verificação;
6. Hub/Estação tem composição mobile própria, sem simplesmente comprimir o
   layout tablet;
7. nenhuma regra visual ou funcional nova atua acima de 800 px;
8. aceite final exige fotos ou inspeção no iPhone e regressão no tablet real,
   além do harness.
