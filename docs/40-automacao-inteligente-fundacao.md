# Projeto de Automação Inteligente — Fundação, Diagnóstico e Checklist

> Documento vivo do projeto de automação residencial do apartamento.
>
> Objetivo: registrar decisões, diagnóstico, arquitetura proposta, inventário curado, validações de runtime, etapas concluídas, interferências e mudanças de premissa. Este arquivo deve permitir que outra IA ou outro responsável técnico retome o trabalho sem depender do histórico de conversa.

**Status atual:** Fase 0 em andamento — Item 1 (Curadoria) concluído.

**Última atualização:** 2026-08-30

---

## 1. Objetivo do projeto

Construir uma arquitetura de automação residencial moderna no Home Assistant que melhore efetivamente o dia a dia dos moradores sem criar comportamento invasivo, imprevisível ou excessivamente automatizado.

A migração do ecossistema Smart Life/Tuya para Home Assistant só é considerada vantajosa se o HA passar a usar contexto, presença, atividade, estado da casa e intenção humana para tomar decisões melhores do que simples rotinas de horário ou presença.

O sistema deverá ser inspirado em princípios encontrados em plataformas comerciais de alto nível como Crestron, Control4, Savant e Josh.ai, mas adaptado à realidade física, aos dispositivos existentes e aos hábitos reais do apartamento.

---

## 2. Princípios arquiteturais já definidos

### 2.1 Conforto e previsibilidade acima de automação pela automação

- Uma entidade ter mudado de estado não significa que alguma ação precisa acontecer.
- Presença detectada não autoriza automaticamente acender uma luz.
- Movimento não significa necessariamente presença humana.
- Atividade de TV, PC, Alexa ou ar-condicionado é evidência de atividade, não prova de ocupação humana.
- `unknown` e `unavailable` significam estado desconhecido, nunca “ambiente vazio”.
- O sistema deve aceitar **não agir** como decisão válida.
- Comandos manuais do usuário devem prevalecer sobre automações de conforto.
- Segurança crítica tem prioridade superior a conforto e override humano quando aplicável.

### 2.2 Quatro classes de comportamento

Toda política futura deverá ser classificada em uma destas modalidades:

1. **Automática segura** — pode executar sem perguntar quando as condições são altamente determinísticas e a ação possui baixo risco de incomodar.
2. **Automática contextual** — executa apenas quando múltiplos sinais, bloqueios e contexto tornam a ação apropriada.
3. **Assistida** — detecta uma oportunidade, informa o usuário e solicita confirmação antes de executar.
4. **Sob demanda** — somente acontece quando explicitamente acionada por voz, botão, dashboard ou cena.

Além das quatro classes, existe sempre a decisão **SILENT / NO ACTION**.

### 2.3 Estrutura lógica pretendida

```text
HARDWARE / INTEGRATIONS
        ↓
ENTITY AUTHORITY
        ↓
HEALTH / SUPERVISION
        ↓
FACTS
        ↓
OCCUPANCY + ACTIVITY
        ↓
HOUSE / ROOM CONTEXT
        ↓
HUMAN INTENT
        ↓
POLICY ENGINE
        ↓
DECISION CLASSIFIER
 ┌────────┬─────────┬─────────┬─────────┐
 │ AUTO   │ ASSIST  │ MANUAL  │ SILENT  │
 └────────┴─────────┴─────────┴─────────┘
        ↓
ACTION / INTERACTION
 Home Assistant | Dashboard | Alexa | Assist | Devices
```

Princípio equivalente: **observe → compreenda → decida se existe benefício → aja somente quando confiança e benefício justificarem a intervenção**.

### 2.4 Padrão de políticas

O modelo de decisão deverá seguir uma lógica equivalente a:

```text
IF <evento/contexto>
THEN <ação ou recomendação>
BUT ONLY WHEN <gates, bloqueios, health, override, quiet hours, confiança>
```

A intenção é evitar automações simples do tipo `trigger → action` quando o comportamento exige contexto.

---

## 3. Separação obrigatória em duas fases de hardware

### Fase 1 — dispositivos e entidades existentes hoje

A primeira versão deve funcionar com o hardware atual. Não pode depender de dispositivos ainda não adquiridos.

Características conhecidas:

- luzes atuais são estritamente **ON/OFF**;
- nenhuma luz atual possui dimmer, RGB ou ajuste de temperatura de cor;
- existe uma cortina automatizada na Sala;
- existe rede relevante de presença/ocupação;
- existem sensores de temperatura, umidade e iluminância em vários ambientes;
- existem câmeras ONVIF no dashboard, mas a origem atual de eventos de movimento ainda depende de uma ponte Tuya customizada;
- existem ACs em múltiplos ambientes;
- existe Roborock S7;
- existem dispositivos Alexa/Echo em Sala, Office, Quarto Casal e Quarto Marina; há intenção futura de adicionar ao Quarto Miguel;
- existe Nabu Casa/Home Assistant Cloud;
- vários circuitos de iluminação atuais ainda são Tuya e poderão migrar futuramente para Zigbee2MQTT.

### Fase 2 — expansão futura de hardware

Possíveis dispositivos/capacidades futuras, ainda não pressupostos pela Fase 1:

- sensores de porta/janela;
- sensores de vazamento;
- sensores de ocupação de cama;
- dimmers e/ou balizadores de baixa intensidade;
- medição elétrica real;
- sensores adicionais de presença com zoning/classificação onde necessário;
- Assist Satellites;
- mais cortinas motorizadas;
- botões/keypads físicos contextuais.

---

## 4. Modos e contexto global previstos

Conjunto mínimo atualmente recomendado:

- **Home**
- **Away**
- **Sleep**
- **Guest**

Possível modo Vacation futuramente.

`Cinema`, `Work` e `Meeting` não devem ser tratados como modos globais mutuamente exclusivos da residência; são contextos de atividade.

`Night` pode ser derivado de horário/sol e não precisa necessariamente ser modo persistente.

`Sleep` deverá inicialmente ser explícito/confiável, não inferido apenas por horário. Futuramente sensores de cama podem ampliar essa inferência.

---

## 5. Quiet Hours / direito ao silêncio

O projeto deverá possuir uma camada de inibição de ações intrusivas.

Possível representação conceitual:

```text
DAY
EVENING
QUIET
SLEEP
```

Ainda não foram definidos horários fixos.

Toda ação potencialmente perceptível deverá avaliar algo equivalente a:

```text
MAY_INTERRUPT?
```

A decisão poderá considerar:

- modo da casa;
- horário/fase temporal;
- ocupação do ambiente;
- Sleep;
- Meeting/Work;
- media activity;
- override manual;
- severidade do evento.

Durante `SLEEP`, iluminação automática, áudio, anúncios, movimentação de cortina e outras intervenções devem ser fortemente bloqueados, exceto eventos críticos de segurança.

Esse desenho também reduz falsos positivos provocados por animais circulando durante a madrugada.

---

## 6. Ocupação da residência

### 6.1 Premissa fundamental

Os celulares rastreados são **evidência**, não autoridade para declarar a casa vazia.

A residência possui moradores sem telefone rastreável em todo momento e também pode conter funcionários/babá. Portanto:

```text
all tracked phones away ≠ house empty
```

### 6.2 Modelo assimétrico de confiança

Estados internos sugeridos:

- `OCCUPIED`
- `PROBABLY_OCCUPIED`
- `PROBABLY_EMPTY`
- `EMPTY_CONFIRMED`
- `UNKNOWN`

É deliberadamente mais fácil provar que a casa está ocupada do que declarar que está vazia.

Ações de ausência potencialmente intrusivas — desligar AC, TV, iluminação, iniciar Roborock etc. — devem exigir `EMPTY_CONFIRMED`, e não apenas `PROBABLY_EMPTY`.

### 6.3 Evidências candidatas

- ocupação/presença dos ambientes;
- movimento recente;
- telefones rastreados;
- movimento de câmera como evidência complementar;
- sinais coerentes de atividade de dispositivos;
- saúde dos sensores.

Câmera, TV, PC e outros dispositivos não devem isoladamente provar ocupação.

---

## 7. Manual override / intenção humana

Comando manual deve prevalecer sobre automação de conforto.

O override deverá ser preferencialmente:

- por ambiente e domínio, não global;
- liberado por transição de contexto relevante;
- protegido por timeout longo apenas como failsafe, não por temporizador curto arbitrário.

Exemplo conceitual:

```text
Usuário desligou manualmente a luz da Sala
→ automação não a religa imediatamente
→ override permanece até uma transição significativa
   (ex.: Sala realmente vazia → nova ocupação, Away, cena explícita etc.)
```

Home Assistant Context (`context.id`, `user_id`, `parent_id`) poderá ajudar a distinguir origem de ações, mas essa capacidade ainda precisa ser validada no runtime real, especialmente para comandos vindos de interruptores físicos e integrações.

---

## 8. Curadoria da base atual — Item 1 concluído

### 8.1 Base válida para fundação

**Manter e reutilizar:**

- packages de presença por ambiente;
- `presence_supervision.yaml`;
- temperatura, umidade e iluminância;
- entidades atuais de iluminação;
- ACs atuais;
- cortina da Sala;
- Android TV e media players atuais quando necessários;
- Roborock;
- câmeras ONVIF como transporte de vídeo;
- HASS.Agent/telemetria do Office com supervisão e tratamento de disponibilidade.

### 8.2 Componentes aproveitáveis com ressalvas

- `home_activity.yaml` — contém ideias úteis, mas não deve ser autoridade automática da arquitetura nova;
- `home_insights.yaml` — pode fornecer conceitos de insight, mas deve ser revisado em função das políticas novas;
- `active_player.yaml` — arquitetura de foco de mídia existente; reutilizar apenas onde compatível;
- `bruno_scenes.yaml` — scripts atuais podem servir como referência/ações explícitas, mas não devem ser acionados cegamente pelas novas automações.

### 8.3 Conteúdo excluído da fundação nova

`config/automations.yaml` contém automações provenientes do repositório de referência antigo e não representa a realidade do apartamento.

Decisão: **não refatorar nem modernizar essas automações como ponto de partida**. Devem ser tratadas como legado estrangeiro/referência e permanecer isoladas até auditoria de dependências e eventual remoção segura.

### 8.4 Semântica atual não será o cérebro novo

Entidades como `sensor.sala_semantic_state_supervised` são úteis para UI/diagnóstico, mas as novas políticas devem preferir fatos subjacentes como:

- occupancy;
- presence;
- motion_recent;
- lux;
- temperatura;
- estado de mídia;
- estado de clima;
- health.

O objetivo é evitar que uma interpretação histórica controle outra interpretação nova.

---

## 9. Evidências confirmadas no repositório

### 9.1 Supervisão de presença

`config/packages/presence_supervision.yaml` já possui tratamento explícito para:

- valores MQTT restaurados no boot;
- `unknown`/`unavailable`;
- estados congelados;
- inconsistência entre presença e movimento;
- freshness/telemetria;
- estados de health por ambiente.

Esse pacote é considerado ativo importante da fundação.

### 9.2 Sala

O dashboard atual utiliza, entre outros:

- `cover.cortina_varanda_cortina_2`;
- `number.cortina_varanda_percent_control`;
- `binary_sensor.sala_motion_recent`;
- `binary_sensor.sala_occupancy`;
- `binary_sensor.sensor_4_in_1_sala_presence`;
- `sensor.sensor_4_in_1_sala_illuminance`;
- sensores de temperatura/umidade;
- `light.grupo_luzes_sala` e luzes individuais;
- `media_player.android_tv_192_168_3_17` como TV operacional;
- `media_player.atv` / `remote.atv` como controle remoto auxiliar;
- `media_player.echo_show`;
- `media_player.spotifyplus_bruno_helasio`;
- `climate.sl_ar_condicionado`;
- `camera.sl_camera_profile_1` e `camera.vr_camera_profile_1`.

A cortina possui calibração frontend para posições visuais 0/25/50/75/100%, com mapeamento físico próprio.

### 9.3 Sala — presença

`sala_presence.yaml` já separa:

- passagem/movimento recente;
- ocupação sustentada;
- estado semântico para UI.

A ocupação atual é baseada em presença sustentada com `delay_on` e `delay_off` e foi deliberadamente separada de TV/AC/Echo porque esses latches mantinham o ambiente falsamente ocupado.

Conclusão arquitetural consolidada: **atividade de dispositivo não prova ocupação humana**.

### 9.4 Office

`office_presence.yaml` já combina:

- presença/ocupação;
- estado de sessão do PC;
- atividade recente;
- janela ativa;
- Teams/Meet/Zoom;
- microfone;
- webcam;
- `office_working_active`;
- `office_meeting_active`.

A nova automação deve aproveitar especialmente esses sinais para **inibir intervenções durante trabalho/reuniões**, antes de tentar orquestração automática agressiva.

### 9.5 Cozinha / lava-louças

O dashboard atual usa:

- `switch.cz_tomada_maq_lav_louca_socket_1` como entidade física da tomada da lava-louças;
- `sensor.lava_loucas_operation_state` como estado semântico/derivado;
- `light.grupo_luzes_cozinha` e três circuitos individuais;
- sensores de presença/lux/temperatura/umidade;
- câmeras ONVIF da Cozinha e Área de Serviço.

A tomada física é a autoridade do dispositivo; o operation state é uma interpretação derivada.

### 9.6 Roborock

Autoridade atual:

- `vacuum.roborock_s7`.

O dashboard também possui estado de erro, cômodo, bateria, mop, DND, mapa, consumíveis e configurações. Isso torna o Roborock um candidato forte para automações contextuais de limpeza quando a ocupação da residência estiver suficientemente confiável.

### 9.7 Câmeras

Vídeo atual utiliza oito entidades ONVIF:

- `camera.sl_camera_profile_1`
- `camera.vr_camera_profile_1`
- `camera.cz_camera_profile_1`
- `camera.as_camera_profile_1`
- `camera.of_camera_profile_1`
- `camera.qc_camera_profile_1`
- `camera.qmi_camera_profile_1`
- `camera.qma_camera_profile_1`

Porém os eventos de movimento usados pelo dashboard e por `home_activity.yaml` ainda chegam pelas entidades `bruno_tuya_motion.*`.

Decisão: **ONVIF é válido como transporte atual de vídeo; suporte real a eventos de movimento/human detection em cada câmera ainda precisa ser confirmado no HA em execução.**

---

## 10. Integrações e migrações — decisões já tomadas

### 10.1 Tuya → Zigbee2MQTT

Não migrar agora os aproximadamente 30 circuitos de iluminação apenas para iniciar o projeto.

Motivos:

- ampliaria muito o escopo antes de validar a arquitetura;
- misturaria risco de pairing/mesh/entity IDs com risco das novas automações;
- dificultaria diagnosticar a origem de regressões;
- as novas políticas podem operar sobre entidades HA atuais independentemente da integração física inferior.

A migração deverá ocorrer posteriormente, de forma gradual.

### 10.2 Camada de abstração obrigatória

As políticas não devem espalhar entity IDs físicos por dezenas de automações.

Conceito futuro:

```text
ROOM CAPABILITY MAP

Sala:
  primary_light
  navigation_light
  occupancy
  lux
  climate
  media
  curtain
```

Assim, trocar Tuya por Zigbee2MQTT deverá exigir alteração de mapeamento/capability, não reconstrução de políticas.

### 10.3 Alexa / Nabu Casa

Não é pré-requisito para construir o core.

Direção pretendida:

```text
DISPOSITIVO
   ↓
HOME ASSISTANT
   ↓
NABU CASA
   ↓
ALEXA
```

Alexa deve ser tratada principalmente como interface de voz/controle e não como motor principal de automação.

A integração Alexa/Tuya existente pode permanecer temporariamente enquanto o core é construído e validado.

### 10.4 Assist

Home Assistant Assist/Assist Satellite é candidato futuro para automações assistidas por voz. Não é requisito da primeira implementação.

---

## 11. Linhas de automação já discutidas

Estas propostas são **direções**, não automações implementadas.

### Iluminação

- Não usar genericamente `presence → light on`.
- Durante Evening, entrada em cômodo escuro pode justificar uma luz de navegação quando o contexto de circulação é forte.
- Durante Quiet/Sleep, auto-on deve ser fortemente inibido.
- Como as luzes atuais são ON/OFF, escolher por ambiente o circuito menos agressivo quando existir.
- Corredor não deve receber auto-on simplesmente por movimento na primeira versão.
- Auto-off por vacância verificada é mais seguro do que auto-on indiscriminado.

### Clima

- Primeira geração deve preferir recomendação assistida para ligar AC por desconforto térmico.
- Exemplo: Sala ocupada + temperatura alta + AC off → sugerir, não ligar automaticamente.
- Auto-off por vacância prolongada pode ser adequado quando `EMPTY_CONFIRMED` for confiável.
- Evitar cycling e respostas a ruído de sensores.

### Cortina da Sala

A residência possui orientação norte-sul, com insolação diagonal, mais incisiva pela manhã.

Comportamento real informado: é comum fechar a cortina da Sala aproximadamente 75–80% pela manhã para reduzir incidência solar sobre móveis/equipamentos.

Direção: automação potencialmente automática/contextual baseada em geometria solar real (azimute/elevação/faixa temporal), não em simples horário fixo e não em premissa leste/oeste.

### TV / mídia

- TV ligada cria contexto, não autorização para orquestrar automaticamente a casa.
- Cena Cinema deve permanecer explícita inicialmente.
- Auto-off por vacância prolongada e confiável pode ser avaliado.

### Roborock

- Limpeza de fim de semana/ausência é candidata relevante.
- Ação automática deve depender de ausência confirmada ou ser apresentada como recomendação assistida.

### Áudio

- Alto potencial de intrusão.
- Evitar reprodução automática baseada apenas em presença ou horário.
- Priorizar cena explícita, atividade clara ou sugestão.
- Nunca iniciar áudio em contexto Sleep/Quiet sem razão crítica.

### Office

Primeiro objetivo não é “fazer coisas”, e sim **evitar fazer coisas erradas**:

- não desligar dispositivos durante trabalho/reunião;
- preservar clima em ausências breves;
- reduzir notificações durante meeting;
- não alterar iluminação sem necessidade enquanto houver contexto ativo de trabalho.

---

## 12. Shadow mode — requisito antes das ações físicas

A primeira implementação nova deverá preferencialmente produzir apenas contexto, políticas e decisões simuladas.

Exemplo:

```text
sensor.automation_policy_sala_lighting
state: would_turn_on
reason: evening_transition_dark_room
```

sem ligar fisicamente a luz.

Objetivos:

- validar o “cérebro” antes de dar acesso às “mãos”;
- comparar decisão esperada versus decisão inferida;
- produzir `reason codes`;
- facilitar trace/logbook/diagnóstico;
- permitir ajuste de thresholds com risco físico mínimo.

---

## 13. Estratégia de execução técnica

A maior parte do projeto pode ser desenvolvida remotamente no GitHub:

- packages;
- templates;
- helpers declarativos;
- scripts;
- automações;
- policy sensors;
- shadow mode;
- documentação;
- integração com dashboard;
- revisão estática.

O Home Assistant real é autoridade para comportamento/runtime e será necessário em pontos específicos para:

- verificar entidades realmente registradas;
- confirmar capabilities negociadas por integrações;
- conferir Device/Entity Registry;
- observar estados vivos;
- validar HA Context;
- executar config check/reload/restart quando necessário;
- revisar traces/logs;
- confirmar resposta física dos dispositivos.

IA local não é obrigatória para construir o core. Só será considerada quando acesso direto ao runtime, testes automatizados locais ou coleta extensa de logs/traces trouxer benefício suficiente para justificar o custo.

---

## 14. Checklist mestre do projeto

Regra de trabalho: **uma etapa por vez**. A próxima etapa só começa quando a atual estiver concluída e validada.

### Fase 0 — Fundação e verdade do sistema

- [x] **Item 1 — Curadoria do repositório e definição da base válida**
  - [x] separar base atual de legado estrangeiro;
  - [x] manter presença/supervisão como fundação;
  - [x] confirmar que luzes atuais podem permanecer Tuya na Fase 1;
  - [x] manter AC, cortina, TV, Roborock e sensores atuais como candidatos válidos;
  - [x] classificar ONVIF vídeo como existente e eventos ONVIF como ainda não confirmados;
  - [x] decidir que semânticos atuais não serão autoridade do novo policy engine;
  - [x] decidir por camada de abstração entre dispositivos e políticas;
  - [x] excluir as 31 automações antigas como fundação do novo projeto.

- [ ] **Próximo item** — NÃO INICIADO.
  - O conteúdo será definido e executado somente após validação explícita do Item 1 e deste documento.

### Fase 1 — Hardware atual

- [ ] Não iniciada.

### Fase 2 — Hardware futuro

- [ ] Não iniciada.

---

## 15. Registro de interferências, dúvidas e mudanças de premissa

Esta seção deve ser atualizada sempre que surgir um fato que altere uma decisão anterior.

### I-001 — automations.yaml não representa o apartamento

**Descoberta:** as 31 automações presentes em `automations.yaml` pertencem ao repositório legado de referência e não foram construídas para esta residência.

**Impacto:** abandonar plano de “sanitizar/refatorar as 31 automações”.

**Nova decisão:** arquitetura construída do zero; legado permanece isolado até auditoria de dependência.

### I-002 — iluminação atual é exclusivamente ON/OFF

**Descoberta:** não há dimming, RGB ou tunable white nos circuitos atuais.

**Impacto:** retirar propostas de brightness %, CCT/circadiano e iluminação noturna reduzida da Fase 1.

**Nova decisão:** luzes de navegação da Fase 1 devem selecionar o circuito binário menos invasivo disponível; dimmers/balizadores pertencem à Fase 2.

### I-003 — telefones não podem provar casa vazia

**Descoberta:** nem todos os ocupantes possíveis possuem rastreamento por telefone; funcionários/babá podem permanecer na residência.

**Impacto:** `all phones away` não pode acionar Away destrutivo.

**Nova decisão:** occupancy fusion assimétrica e estado `EMPTY_CONFIRMED` conservador.

### I-004 — orientação/insolação

**Descoberta:** apartamento com orientação norte-sul; insolação diagonal e manhã mais incisiva.

**Impacto:** descartar premissas simplistas leste/oeste para cortina.

**Nova decisão:** futura política solar baseada em azimute, elevação, faixa relevante e objetivo de proteção/conforto.

### I-005 — arquitetura precisa incluir interação humana

**Descoberta:** várias decisões de conforto não devem executar automaticamente.

**Impacto:** modelo binário automação/cena manual é insuficiente.

**Nova decisão:** introduzir formalmente AUTO / ASSIST / MANUAL / SILENT e recommendation engine.

### I-006 — migração Tuya não é pré-requisito

**Descoberta:** cerca de 30 circuitos poderiam migrar para Zigbee2MQTT, mas isso aumentaria risco e escopo antes da validação das políticas.

**Nova decisão:** construir Fase 1 sobre entidades atuais e migrar gradualmente depois, protegidos por uma camada de abstração.

### I-007 — câmeras já usam ONVIF para vídeo, mas motion ainda é Tuya

**Evidência no código:** subview de segurança aponta vídeo para `camera.*_profile_1`, enquanto `motion_entity` continua em `bruno_tuya_motion.*`. `home_activity.yaml` também usa a ponte Tuya para `ipc_motion` e traduz apenas o destino visual para ONVIF.

**Impacto:** não presumir que ONVIF atualmente fornece motion só porque vídeo está funcionando.

**Nova decisão:** capability de eventos deve ser verificada no runtime antes de remover a ponte Tuya.

---

## 16. Regras de manutenção deste documento

1. Não marcar uma etapa como concluída antes de validação explícita.
2. Cada descoberta que altere premissa deve gerar entrada em **Interferências, dúvidas e mudanças de premissa**.
3. Cada alteração real de código deve registrar:
   - arquivo(s);
   - objetivo;
   - efeito esperado;
   - risco;
   - rollback;
   - teste executado;
   - resultado.
4. Cada validação no HA real deve separar claramente:
   - fato observado;
   - interpretação;
   - decisão resultante.
5. Não apagar decisões antigas silenciosamente; quando uma decisão mudar, registrar motivo e substituição.
6. Não misturar o projeto de automação com regressões independentes de dashboard sem relação direta; apenas registrar interferências que possam afetar comportamento ou diagnóstico da automação.
7. O `main` do GitHub é autoridade para estado versionado; o Home Assistant em execução é autoridade para estado/runtime.

---

## 17. Estado de continuidade

Para qualquer IA que retome este projeto:

- Não começar implementando automações físicas.
- Não refatorar `automations.yaml` como se fosse automação atual do apartamento.
- Não exigir migração imediata Tuya → Zigbee2MQTT.
- Não assumir dimmers.
- Não tratar telefones como autoridade de casa vazia.
- Não tratar movimento isolado como autorização para luz.
- Não tratar TV/PC/AC como prova de ocupação.
- Respeitar manual override.
- Preservar Quiet/Sleep como inibidores fortes.
- Manter Alexa/Assist como interfaces; inteligência permanece no HA.
- Prosseguir **uma etapa por vez**, documentando a conclusão antes da próxima.

**Checkpoint atual:** Item 1 — Curadoria concluído. Próxima etapa ainda não iniciada.
