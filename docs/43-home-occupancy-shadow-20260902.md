# Item 2 — Parte A: ocupação global em shadow mode

Data: 2026-09-02. **Implementada e publicada em disco; ativação e validação no
Home Assistant pendentes de sessão autenticada. Não é aceite do Item 2.**

## Escopo autorizado

Após a auditoria, o usuário adiou a migração Tuya → ONVIF e autorizou somente
a camada global de observação. Não reativar detecção/notificações no Smart
Life e não ligar sensores ONVIF aos consumidores enquanto não houver prova
real de `off → on → off`.

Foram criados `config/packages/home_occupancy_core.yaml`, o teste Python e
seu arquivo de dependências. Em `config/configuration.yaml` entraram apenas
o include do pacote e dois comentários. Este documento, o checkpoint e o
registro de decisões acompanham a implementação.

Permanecem intactos: `home_activity.yaml`, `presence_supervision.yaml`, todos
os packages de presença por cômodo, Tuya, ONVIF, seleção de câmera, dashboard,
notificações e automações de dispositivos. Não há `automation`, `script`,
`action`, serviço, timer persistente ou consumidor físico no pacote novo.
Não iniciar Item 3. O documento de fundação `docs/40-automacao-inteligente-fundacao.md`
não foi marcado como concluído: sua atualização final exige validação do usuário.

## Base e publicação

- A sincronização previamente autorizada levou `main` local e GitHub para
  `e0882b468e22fb3bbbaae61bbdcd922debe4fdc4`. Isso substitui as notas históricas
  que ainda descrevem `main` em `5e67467a` e alterações tablet sem commit.
- Esta implementação usa a candidata `codex/home-occupancy-shadow-20260902`,
  criada sobre `e0882b4`. **Não avançar main antes do aceite.**
- Antes de escrever, 11 arquivos pertinentes foram comparados por SHA-256
  entre checkout e Everex, todos iguais. O novo pacote não existia.
- Backup: `tmp/rollback-20260902-home-occupancy-core/`, com configuração
  local/Everex e os dois documentos preexistentes que seriam atualizados.
- Publicação no Everex: primeiro o pacote, depois a configuração. O hash
  anterior foi conferido novamente antes de cada cópia da configuração.
- Somente dois arquivos foram copiados para `/config`; **não houve reload
  nem reinício**. O processo em execução não foi considerado validado.
- O bundle em disco continua `bruno-dashboard.DuoAOL_I.js`, sem rebuild,
  cache-bust ou alteração de frontend nesta rodada. Bundle anunciado pelo
  processo/aceite físico do dashboard não foi revalidado nesta implementação.

| Arquivo | SHA-256 publicado e conferido no Everex |
| --- | --- |
| `packages/home_occupancy_core.yaml` | `271CBB790B1A51B458D716FE1B0AB8FC190C8028EC4A6C63DC301AF5979789FB` |
| `configuration.yaml` | `141ADE4BF430A137B5B76BBB8950FE6FF675A217A0F85D2FF3CC18E1A9E8CCC8` |

Configuração anterior: `B7E7E8C4F9C1F2E9C87414ADB20C59497A491B58F17D8EEC0D4B3C0EE247AE4E`.
Documentação e scripts não são arquivos de runtime e não vão para o Everex.

## Entidades e fontes

O registro de entidades do Everex foi consultado nesta rodada; os IDs abaixo
existiam e estavam habilitados. Isso verifica identidade, **não substitui
leitura de estados atuais nem prova de funcionamento físico**.

- Pessoa: `person.bruno_helasio`.
- Sete cômodos principais: `sala`, `office`, `cozinha`, `corredor`, `q_casal`,
  `q_marina`, `q_miguel`. De cada um são lidos `binary_sensor.<room>_occupancy`,
  `binary_sensor.<room>_motion_recent` e `sensor.<room>_presence_health`.
- Corredor: também `binary_sensor.pir_motion_sensor_corredor_movimento`, pois
  os fatos antigos podem converter fonte indisponível em `off`.
- Lavabo: `binary_sensor.lavabo_occupancy`, `binary_sensor.lavabo_motion_recent`
  e `binary_sensor.lv_sensor_presenca_movimento`. Não existe supervisor
  `sensor.lavabo_presence_health`; não se inventou essa dependência.
- Office: `binary_sensor.office_pc_active`, `binary_sensor.office_working_active`,
  `binary_sensor.office_meeting_active`,
  `sensor.desktop_melg9vv_office_pc_session_state` e
  `sensor.desktop_melg9vv_office_pc_idle_time`.

Oito entidades novas, com `unique_id` e `default_entity_id` explícitos:

| Entidade | Função |
| --- | --- |
| `sensor.home_occupancy_observation` | Snapshot estruturado das evidências no atributo `assessment` |
| `sensor.home_occupancy_coverage` | `healthy`, `degraded` ou `insufficient` |
| `sensor.home_occupancy_state` | Estado global e justificativa |
| `binary_sensor.home_strong_occupancy_evidence` | Evidência positiva forte |
| `binary_sensor.home_weak_occupancy_evidence` | Evidência complementar |
| `binary_sensor.home_occupancy_ready` | Observação inicial cumprida e cobertura mínima |
| `binary_sensor.home_empty_candidate` | Ausência candidata, ainda sem confirmação |
| `binary_sensor.home_empty_confirmed` | Ausência saudável contínua por 900 segundos |

## Regras e limites

1. Bruno `home` ou ocupação de cômodo com saúde `ok`: `occupied`.
2. Movimento recente válido, Lavabo ou atividade humana supervisionada do
   Office: `probably_occupied`. Lavabo sem supervisor é somente complementar.
3. Sem evidência positiva, durante a janela inicial, com pessoa desconhecida
   ou cobertura insuficiente: `unknown`.
4. Pessoa fora, sem evidência, observação inicial cumprida e cobertura mínima:
   `probably_empty`. Zona nomeada diferente de `home` conta como fora;
   `unknown`/`unavailable` não contam como ausência.
5. A mesma ausência com cobertura **healthy**, continuamente por 900 segundos:
   `empty_confirmed`. Qualquer evidência ou perda de cobertura cancela a
   contagem; a retomada exige a janela inteira, não o saldo anterior.

Saúde `ok` e fatos binários válidos qualificam um cômodo como utilizável.
São necessários pelo menos **5 dos 7** cômodos para observação mínima:
5–6 qualificam cobertura `degraded`; menos de 5, `insufficient`. Para
`healthy` são necessários 7/7, pessoa conhecida e fontes do Lavabo válidas.
Fonte bruta indisponível no Corredor também desqualifica esse cômodo.

Falha isolada não apaga evidência positiva saudável em outro ambiente,
mas sempre impede confirmar ausência. Atividade Office só é aceita com
sessão `Unlocked` e timestamp de atividade entre 0 e 300 segundos atrás;
timestamp futuro, congelado, inválido ou ausente não qualifica. PC offline
não derruba a cobertura espacial. Working/meeting também exigem saúde Office
`ok`. TV, luz, ar-condicionado, Alexa, tomada e eventos de câmera não entram.

A janela inicial é de **pelo menos 60 segundos por carga/reload**. Variáveis
state-based são resolvidas ao iniciar o acompanhamento de cada entidade;
não se usa timestamp restaurado nem igualdade de timestamps entre entidades.
O estado de confirmação renderiza `false` nessa janela, sem `availability`
que esconda esse reset, antes de começar o `delay_on`. A verificação por
`now()` é periódica: na prática a janela inicial pode ficar entre cerca de
60 e 120 segundos sem eventos adicionais, seguida dos 900 segundos.

Na versão instalada, HA Core **2026.8.3**, existe restauração de estado em
templates state-based. Por isso o teste físico deve verificar o comportamento
depois da inicialização dos templates, e não confiar em um valor restaurado
transitório durante o bootstrap. Nenhum consumidor é conectado nesta fase.
A leitura dos fontes oficiais sustentou a modelagem do teste, mas não é uma
execução do Home Assistant: [ciclo de templates](https://github.com/home-assistant/core/blob/2026.8.3/homeassistant/components/template/template_entity.py),
[variáveis](https://github.com/home-assistant/core/blob/2026.8.3/homeassistant/helpers/script_variables.py)
e [binary sensor/delay](https://github.com/home-assistant/core/blob/2026.8.3/homeassistant/components/template/binary_sensor.py).

## Validação executada

- **30 testes** de regressão aprovados, renderizando o Jinja do pacote real
  com contexto HA simulado, relógio virtual e sem serviços/rede/dispositivos.
- Casos: pessoa e cada cômodo; movimento; falhas isoladas/estruturais;
  indisponibilidade não tratada como silêncio; cancelamento/reinício dos 900 s;
  boot/reload com confirmação anterior; boot demorado; Lavabo/Corredor antes
  de cascatas; Office inválido/futuro; câmeras e dispositivos ignorados.
- **251 YAMLs** aprovados pelo validador do repositório.
- Configuração local alterada somente nas três linhas do include/comentários;
  os dois arquivos publicados tiveram hashes idênticos aos locais.
- Sem testes físicos simulados em estados reais e sem automações acionadas.

Reprodução local (Python 3.12+, dependências isoladas):

```powershell
python -m pip install --target tmp/home-occupancy-test-deps -r scripts/validation/home-occupancy-test-requirements.txt
python scripts/validation/test_home_occupancy_core.py --dependencies tmp/home-occupancy-test-deps
node scripts/validation/check-yaml.mjs
```

Nesta máquina foram usados Python/Node empacotados do Codex; dependências
PyYAML 6.0.3 e Jinja2 3.1.6 ficaram somente em `tmp`, fora do commit/runtime.

## Bloqueio externo e ativação pendente

A aba do Home Assistant disponível à ferramenta de navegador está na tela de
login. Foi solicitado que o usuário autentique nessa aba sem enviar senha no
chat. Não se leem credenciais, cookies ou perfis para contornar autenticação.

Após autenticação:

1. Revalidar os dois hashes e executar **Check Configuration** no HA.
2. Se falhar, não recarregar: comentar o include e diagnosticar.
3. Se passar, recarregar somente **Templates**. Essa operação recarrega o
   domínio inteiro e faz a supervisão existente reconstruir sua saúde;
   não existe reload seletivo somente deste package. Não reiniciar para
   resolver frontend nesta rodada.
4. Conferir as oito entidades, `assessment`, fontes/reason e logs de templates.
5. Observar condições reais, a janela completa de ausência saudável e o
   cancelamento. Fazer ensaio de reload; reinício completo só em janela
   adequada e com autorização operacional, sem acionar dispositivos.
6. Aguardar aceite do usuário antes de promover a candidata para main.

O Check Configuration, reload, estados vivos, ensaio de reinício e aceite
**não estão aprovados**. Os testes locais não os substituem. Parte B/ONVIF
continua adiada; portanto o Item 2 completo não pode ser declarado concluído.

## Rollback

Comentar somente `home_occupancy_core: !include packages/home_occupancy_core.yaml`
em `configuration.yaml`, executar Check Configuration e recarregar Templates
se o pacote já tiver sido ativado. Preservar o YAML novo como código inativo;
não apagar integração, registry ou histórico.

A configuração anterior está no backup indicado. Só restaurá-la integralmente
se nenhuma mudança posterior tiver ocorrido; se houver, comentar cirurgicamente
o include para preservar o trabalho posterior. Tuya, câmeras e dashboard não
precisam de rollback porque não foram modificados.
