# Análise técnica e roteiro revisado — dashboard Home Assistant

**Projeto:** dashboard pessoal do Home Assistant de Bruno Helásio (`negocjohn`)  
**Documento-base:** `RELATORIO-CONSOLIDADO.md`  
**Data da análise:** 2026-08-05  
**Objetivo:** avaliar tecnicamente o trabalho já realizado, preservar integralmente os ganhos obtidos e revisar as fases restantes para aproximar o dashboard de uma aplicação frontend robusta, fluida, extensível e adequada ao tablet e ao modo mobile.

---

## 1. Conclusão executiva

O trabalho realizado até a Fase 5c **não deve ser descartado, refeito ou relativizado**. Ele resolveu problemas estruturais concretos:

- eliminou grande parte da duplicação;
- retirou 195 arquivos legados do caminho vivo;
- criou documentação autossuficiente;
- implantou TypeScript, Lit, Vite, Vitest, ESLint e Prettier;
- introduziu medição, baseline, validação e rollback;
- substituiu seis subviews de aproximadamente 8.900 linhas por um componente parametrizado;
- reduziu o bitmap decodificado de 64,3 MB para 9,6 MB;
- implantou bundle com hash de conteúdo;
- tornou vários erros anteriores impossíveis ou detectáveis antes da publicação.

Esse trabalho criou a **fundação correta**.

Entretanto, o roteiro atual ainda não comprova o objetivo original de transformar o dashboard em uma aplicação com comportamento próximo ao frontend oficial do Home Assistant. Ainda faltam:

- gerenciamento seletivo de estado;
- controle rigoroso do ciclo de vida;
- decomposição dos módulos pesados;
- streaming real de câmera;
- instrumentação de performance no tablet;
- retirada progressiva do CSS legado;
- arquitetura de widgets e layout extensível;
- tratamento específico do modo mobile;
- separação formal entre aplicação visual, automações e Alexa.

A correção de rumo não exige voltar ao início. Exige ampliar e redefinir as fases restantes.

---

## 2. O que já foi construído e deve ser preservado

### 2.1 Proteção e reversibilidade

A existência de checkpoint, tag, backup, árvore de arquivos, hashes, rollback por comentário e originais preservados permitiu uma migração incremental sem reescrita destrutiva.

**Avaliação técnica:** concluído e adequado.

### 2.2 Auditoria e documentação

Os documentos `docs/00` a `docs/16` formam uma base de conhecimento suficiente para novas sessões de IA compreenderem:

- arquitetura;
- entrypoints;
- componentes;
- integrações;
- dispositivos;
- tokens;
- falhas conhecidas;
- experimentos fracassados;
- decisões arquiteturais;
- regras de trabalho.

**Avaliação técnica:** concluído e valioso. A documentação agora deve acompanhar também a arquitetura de runtime, o mecanismo de câmera, o modo mobile e a futura arquitetura de widgets.

### 2.3 Isolamento do legado

Os 195 arquivos arquivados deixaram de permanecer no caminho vivo, mas continuam reversíveis e consultáveis.

**Avaliação técnica:** concluído. O arquivo legado deve continuar fora do build e do carregamento.

### 2.4 Fundação TypeScript, Lit e Vite

A implantação de TypeScript estrito, Lit, Vite, Vitest, ESLint e Prettier trouxe ganho real:

- erro sintático detectado antes da publicação;
- configuração gerada;
- CSS gerado;
- bundle versionado;
- componentes reutilizáveis;
- validação por comando único.

**Avaliação técnica:** concluído como fundação. Ainda falta transformar essa fundação numa arquitetura de runtime eficiente.

### 2.5 Migração dos tiles e das subviews

A transformação de:

- 8 tiles YAML em 1 componente;
- 6 subviews duplicadas em 1 componente parametrizado;

é o principal ganho estrutural do projeto até aqui.

O `bruno-room-subview` já funciona como primeiro protótipo de uma aplicação configurável: uma estrutura única recebe configuração e ativa capacidades específicas por cômodo.

**Avaliação técnica:** deve ser preservado. A próxima etapa não é descartá-lo, mas decompor sua renderização em módulos menores e independentes.

### 2.6 Harness, medição e geração

Os geradores de configuração e CSS, a baseline geométrica e a inspeção de conteúdo impediram que a migração dependesse de transcrição manual e comparação visual subjetiva.

**Avaliação técnica:** metodologia correta. Deve permanecer como padrão para as próximas migrações.

---

## 3. Avaliação técnica por dimensão

| Dimensão | Estado | Posicionamento |
|---|---|---|
| Segurança e rollback | Forte | Resolvido |
| Organização do repositório | Forte | Resolvido |
| Redução de duplicação | Forte | Resolvido |
| Build e prevenção de erros | Forte | Resolvido |
| Documentação para IA | Forte | Resolvido |
| Paridade visual e funcional | Forte | Bem encaminhada |
| Performance real no tablet | Inicial | Ainda não comprovada |
| Atualização seletiva de estado | Insuficiente | Precisa de fase própria |
| Ciclo de vida de componentes | Insuficiente | Precisa de instrumentação |
| Streaming real de câmera | Não atendido | Objetivo original pendente |
| Responsividade entre dispositivos | Planejada | Ainda não entregue |
| Modo mobile | Preservado como legado | Ainda não tratado arquiteturalmente |
| Arquitetura para widgets configuráveis | Ausente | Deve ser criada |
| Automações residenciais | Fora do escopo atual | Trilha própria |
| Alexa e voz | Fora do escopo atual | Trilha própria |

---

## 4. Diferença entre organização e robustez de aplicação

A reorganização atual reduz:

- duplicação;
- risco de alteração;
- custo de manutenção;
- erros de sintaxe;
- divergências entre cômodos;
- dificuldade de diagnóstico;
- dependência de histórico de conversa.

Ela não garante automaticamente:

- câmera ao vivo;
- renderização seletiva;
- estabilidade prolongada;
- ausência de vazamentos;
- fluidez no tablet;
- responsividade universal;
- editor de cards;
- drag-and-drop;
- redimensionamento;
- persistência de layout.

A robustez pretendida depende de uma segunda camada de trabalho: a **arquitetura de runtime**.

---

## 5. Por que o frontend oficial do Home Assistant roda melhor

A diferença principal não é uma linguagem isolada. O frontend oficial é tratado como aplicação completa, com:

- bootstrap;
- shell;
- roteamento;
- estado;
- subscriptions;
- WebSocket;
- componentes especializados;
- players de câmera;
- ciclo de vida;
- carregamento sob demanda;
- tratamento de visibilidade;
- integração direta com entidades e serviços.

O dashboard atual nasceu por composição progressiva de:

```text
Lovelace
└── YAML
    └── layout-card
        └── button-card
            └── templates
                └── card-mod
                    └── JavaScript personalizado
                        └── componentes posteriores
```

A nova arquitetura já começou a retirar essas camadas, mas ainda precisa controlar:

- quem renderiza;
- quando renderiza;
- quais entidades provocam atualização;
- quais módulos permanecem montados;
- quando streams e listeners são iniciados;
- quando recursos são encerrados;
- como módulos pesados são carregados.

---

## 6. Problema crítico: a câmera atual ainda não é streaming real

O relatório informa que as câmeras usam:

```text
/api/camera_proxy/
+ atualização em ciclo de 6,5 segundos
+ pré-carga da próxima imagem
```

Essa solução exibe snapshots periódicos. Ela não equivale a:

- WebRTC;
- HLS;
- sessão contínua de vídeo;
- player com negociação de capacidades;
- ciclo de vida semelhante ao frontend oficial.

A arquitetura futura deve seguir esta ordem:

```text
Snapshot imediato como placeholder
        ↓
Consulta das capacidades da câmera
        ↓
WebRTC, quando suportado
        ↓
HLS como fallback
        ↓
Snapshot periódico apenas como último fallback
```

O player deve:

- sobreviver a atualizações de entidades irrelevantes;
- não ser recriado quando temperatura, luz ou presença mudarem;
- pausar ou encerrar quando sair da área visível;
- restaurar a sessão quando voltar;
- trocar entre palco e PIP sem reconstruir toda a subview;
- registrar tempo até primeira imagem e tempo até vídeo;
- permitir comparação objetiva com o card oficial do Home Assistant.

---

## 7. Lit não resolve sozinho a atualização excessiva

Lit reconcilia o DOM, mas um componente ainda pode executar `render()` em excesso quando recebe o objeto `hass` inteiro.

O `bruno-room-subview.ts`, mesmo muito melhor que os seis arquivos antigos, ainda reúne:

- barra superior;
- hero;
- câmeras;
- mídia;
- ar-condicionado;
- iluminação;
- eletrodomésticos;
- relógio;
- controles;
- menus;
- popovers.

A decomposição recomendada é:

```text
bruno-room-subview
├── bruno-room-status
├── bruno-room-hero
├── bruno-camera-stage
├── bruno-media-hub
├── bruno-climate-card
├── bruno-lighting-dock
└── bruno-appliances
```

Cada componente filho deve receber apenas:

- sua configuração;
- os estados de entidades que utiliza;
- callbacks ou serviços estritamente necessários.

Exemplos:

- mudança de umidade não atualiza o player da câmera;
- progresso do Spotify não recalcula o gauge do ar-condicionado;
- relógio não renderiza toda a subview;
- luz de outro ambiente não atualiza o card atual.

---

## 8. Listeners, timers e ciclo de vida

A quantidade de 316 listeners é um sinal de investigação, mas não deve ser tratada isoladamente como meta.

O critério técnico deve ser:

> Após múltiplos ciclos de entrada e saída de uma subview, listeners, timers, subscriptions, streams e uso de memória retornam ao valor inicial.

Devem ser medidos:

- listeners criados;
- listeners removidos;
- timers ativos;
- subscriptions;
- streams;
- requests;
- memória;
- long tasks;
- renders por módulo.

A instrumentação precisa distinguir:

- recurso legítimo;
- duplicação;
- vazamento;
- handler global excessivo;
- recurso que permanece ativo quando o módulo está invisível.

---

## 9. CSS gerado: ponte correta, destino inadequado

O CSS gerado foi a solução correta para preservar a cascata e atingir paridade sem transcrição manual.

Entretanto, `subview-styles.generated.ts` ainda carrega:

- pixels fixos;
- media queries antigas;
- regras históricas;
- sobreposições;
- dependência do layout legado;
- calibragem para dispositivos específicos.

A Fase 6.2 não deve apenas acrescentar container queries sobre esse CSS. Deve substituí-lo progressivamente.

Exemplo de estratégia:

```text
CSS legado gerado inicial
├── status bar migrada → remove o trecho correspondente
├── camera stage migrado → remove o trecho correspondente
├── media hub migrado → remove o trecho correspondente
├── climate migrado → remove o trecho correspondente
├── lighting migrado → remove o trecho correspondente
└── CSS gerado aposentado
```

Cada módulo moderno deve nascer com:

- container queries;
- escala fluida;
- tokens;
- limites mínimos e máximos;
- sem breakpoint exclusivo por aparelho;
- sem dependência de ordem histórica de cascata.

---

## 10. Revisão das decisões arquiteturais

### 10.1 Zod

A decisão de não adotar Zod agora é defensável porque a configuração atual é interna, tipada e gerada.

Contudo, validar formato e verificar existência de entidade são problemas distintos.

Quando houver editor de cards e persistência de layout, será necessário validar em runtime:

- tipo de widget;
- versão do schema;
- posição;
- tamanho;
- configuração obrigatória;
- valores inválidos;
- migração de versões antigas.

**Decisão revisada:**

> Validação de schema em runtime fica adiada até a implementação do editor e da persistência. A biblioteca será escolhida nessa fase.

### 10.2 Playwright

Playwright no desktop não substitui o tablet, mas pode automatizar o harness e detectar:

- regressões geométricas;
- módulo vazio;
- erro de console;
- falha de interação;
- falha de carregamento;
- alteração inesperada em múltiplas larguras.

**Decisão revisada:**

> Introduzir Playwright como filtro automatizado após a fase de responsividade. O teste físico no tablet permanece como gate final.

### 10.3 Nunca apagar código

Durante a migração, rollback in-place é útil. Como regra permanente, incha o caminho vivo e mantém armadilhas sintáticas.

**Decisão revisada:**

> Antes da validação, manter rollback local. Depois da validação, retirar o código antigo do caminho vivo e preservá-lo em Git ou `_archive`.

---

## 11. Arquitetura-alvo revisada

```text
Home Assistant
├── entidades
├── serviços
├── eventos
├── automações
├── scripts
├── cenas
└── WebSocket
        │
        ▼
Dashboard Application
├── Bootstrap
├── App Shell
├── Host Adapter
├── Router
├── State Adapter
├── Entity Selectors
├── Component Registry
├── Widget Registry
├── Layout Engine
├── Camera Engine
├── Media Engine
├── Design System
├── Mobile Mode
├── Diagnostics
└── Persistence
```

### Host Adapter

A aplicação não deve depender permanentemente de como é hospedada.

```text
HostAdapter
├── LovelacePanelHost   ← atual
└── CustomPanelHost     ← possível futuro
```

Assim, a migração futura para custom panel não exige reescrever componentes, estado, layout ou registry.

---

## 12. Roteiro revisado

## Fase 5d — Fechamento da Fase 5c

### Objetivo

Consolidar a migração das seis subviews antes de iniciar novas mudanças estruturais.

### Ações

1. Validar visualmente as seis subviews no Redmi Pad.
2. Resolver A1, A2 e A6.
3. Executar todas as verificações atuais.
4. Consolidar o commit pendente.
5. Congelar baseline visual, funcional e de performance.
6. Manter os arquivos originais como rollback até a conclusão da Fase 6.1.

### Critérios de aceite

- seis subviews validadas;
- nenhuma regressão funcional;
- nenhuma diferença visual não documentada;
- rollback confirmado;
- documentação atualizada.

---

## Fase 6.0 — Baseline de runtime

### Objetivo

Medir o comportamento real antes de otimizar.

### Métricas

- tempo até primeira renderização;
- tempo de abertura de subview;
- tempo até primeiro snapshot;
- tempo até stream;
- quantidade de renders por módulo;
- long tasks acima de 50 ms;
- listeners;
- timers;
- subscriptions;
- requests;
- memória após 1, 10 e 50 navegações;
- FPS em transições, dock e acordeões;
- build efetivamente carregado;
- consumo de CPU da VM;
- tráfego das câmeras.

### Critério de aceite

Baseline reproduzível, armazenada e comparável entre versões.

---

## Fase 6.1 — Estado seletivo, decomposição e ciclo de vida

### Objetivo

Impedir que mudanças irrelevantes atualizem componentes pesados.

### Ações

- remover `triggers_update: all`;
- mapear entidades por módulo;
- decompor `bruno-room-subview`;
- usar propriedades estreitas;
- adicionar comparadores de mudança;
- instrumentar renders;
- centralizar timers;
- limpar listeners;
- suspender módulos invisíveis;
- adotar lazy mounting;
- testar 50 ciclos de navegação;
- registrar memória, listeners, timers e streams.

### Critérios de aceite

- câmera não reinicia por alteração de luz ou clima;
- relógio não renderiza a subview inteira;
- contadores retornam ao baseline após navegação;
- ausência de crescimento contínuo de memória;
- redução mensurável de renders.

---

## Fase 6.1B — Camera Engine

### Objetivo

Substituir snapshots periódicos por streaming real quando a integração permitir.

### Estrutura sugerida

```text
src/services/camera/
├── camera-capabilities.ts
├── camera-session.ts
├── camera-visibility.ts
└── camera-fallback.ts

src/components/camera/
├── bruno-camera-stage.ts
├── bruno-camera-player.ts
└── bruno-camera-placeholder.ts
```

### Estratégia

1. Snapshot rápido como placeholder.
2. Consulta de capacidades.
3. WebRTC preferencial.
4. HLS como fallback.
5. Snapshot periódico como último fallback.
6. Suspensão por invisibilidade.
7. Cleanup ao desconectar.
8. Reconexão controlada.
9. PIP sem desmontagem global.

### Critérios de aceite

- ausência de polling durante stream ativo;
- tempo de primeira imagem comparável ao card oficial;
- stream estável por período prolongado;
- stream não reiniciado por estado irrelevante;
- fallback funcional;
- recursos liberados ao sair da subview.

---

## Fase 6.2 — Responsividade e retirada progressiva do CSS legado

### Objetivo

Tornar cada módulo independente de resolução e reduzir o CSS gerado.

### Ações

- container queries;
- tokens de escala fluida;
- `clamp()`;
- limites mínimos e máximos;
- remoção de pixels fixos;
- substituição de media queries por comportamento do container;
- migração módulo por módulo;
- retirada do trecho correspondente do CSS gerado.

### Critérios de aceite

- funcionamento entre 600 e 2000 px;
- sem breakpoint por modelo de aparelho;
- nenhum módulo migrado depende do trecho legado correspondente;
- paridade nos tamanhos de referência;
- ausência de overflow inesperado.

---

## Fase 6.3 — Tratamento do modo mobile

### Objetivo

Transformar as views mobile preservadas em um modo mobile integrado à nova arquitetura, sem manter três gerações paralelas de interface.

### Princípio

Responsividade e modo mobile não são a mesma coisa.

- **Responsividade:** o mesmo módulo adapta seu tamanho ao espaço.
- **Modo mobile:** a aplicação altera navegação, densidade, prioridade, interação e carregamento para telas pequenas e uso por toque.

### Escopo

#### 1. Inventário das views mobile existentes

Mapear:

- mobile V1;
- mobile V2;
- mobile V3;
- arquivos ainda incluídos;
- elementos exclusivos;
- soluções reutilizáveis;
- componentes abandonados;
- dependências;
- diferenças de navegação;
- diferenças de conteúdo.

Nada deve ser eliminado antes desse inventário.

#### 2. Definição do contrato de mobile

Criar um estado de aplicação explícito:

```ts
type DashboardMode = "desktop" | "tablet" | "mobile";
```

O modo não deve depender apenas de `window.innerWidth`. Deve considerar:

- largura do container;
- orientação;
- densidade;
- ponteiro primário;
- capacidade de hover;
- safe areas;
- contexto de hospedagem;
- preferência configurável.

#### 3. Navegação mobile

Avaliar e implementar:

- rail reduzida ou substituída;
- navegação inferior;
- botão de retorno consistente;
- preservação de estado ao trocar de view;
- transições leves;
- acesso rápido a Home, cômodos, câmeras, ações e configurações;
- suporte à navegação por gesto somente quando não conflitar com controles.

#### 4. Densidade e prioridade

No mobile, nem todos os módulos devem ser montados simultaneamente.

Definir:

- módulos prioritários;
- módulos recolhidos;
- conteúdo sob demanda;
- cards em pilha;
- painéis modais;
- accordions;
- lazy loading;
- substituição de grids extensos por listas ou carrosséis controlados.

#### 5. Interação por toque

Garantir:

- alvos de toque adequados;
- ausência de dependência de hover;
- feedback de toque;
- prevenção de toques acidentais;
- rolagem sem conflito;
- sliders utilizáveis;
- popovers dentro da área visível;
- menus acessíveis com uma mão;
- tratamento de pressionamento prolongado.

#### 6. Safe areas e orientação

Tratar:

```css
env(safe-area-inset-top)
env(safe-area-inset-right)
env(safe-area-inset-bottom)
env(safe-area-inset-left)
```

Validar:

- retrato;
- paisagem;
- mudança de orientação;
- barra do navegador;
- teclado virtual;
- notch;
- recortes;
- áreas de gesto do sistema.

#### 7. Câmera no mobile

Definir estratégia específica:

- não iniciar múltiplos streams automaticamente;
- stream principal sob demanda;
- snapshot nas câmeras secundárias;
- suspensão ao trocar de aba;
- limite de sessões simultâneas;
- fallback conforme rede e capacidade;
- modo tela cheia;
- retorno sem recriar toda a aplicação.

#### 8. Performance mobile

Medir separadamente:

- tempo de abertura;
- memória;
- requests;
- streams;
- FPS;
- rolagem;
- teclado;
- orientação;
- permanência prolongada.

#### 9. Reaproveitamento das views antigas

As views V1/V2/V3 devem ser classificadas:

```text
REUTILIZAR
MIGRAR
ARQUIVAR
DESCARTAR APÓS VALIDAÇÃO
```

O resultado final deve ser um único modo mobile documentado e mantido pela mesma base de componentes.

### Critérios de aceite

- funcionamento em largura de telefone sem quebra;
- retrato e paisagem validados;
- navegação mobile única;
- ausência de dependência de hover;
- safe areas corretas;
- nenhum stream secundário desnecessário;
- módulos pesados carregados sob demanda;
- views V1/V2/V3 retiradas do caminho vivo após migração;
- paridade funcional com o modo tablet, respeitando prioridades de mobile;
- documentação em `docs/mobile-mode.md`.

---

## Fase 6.4 — Núcleo extensível da aplicação

### Objetivo

Preparar a arquitetura para criação, posicionamento e redimensionamento de cards no futuro.

### Contratos sugeridos

```ts
interface WidgetInstance {
  id: string;
  type: string;
  version: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  config: unknown;
}

interface WidgetDefinition {
  type: string;
  create(config: unknown): HTMLElement;
  validate(config: unknown): ValidationResult;
}

interface LayoutRepository {
  load(layoutId: string): Promise<DashboardLayout>;
  save(layout: DashboardLayout): Promise<void>;
}
```

### Estrutura

```text
application/
├── widget-registry
├── layout-model
├── layout-repository
├── navigation
├── feature-flags
└── host-adapter
```

### Critério de aceite

Os cards existentes podem ser registrados sem drag-and-drop. A futura edição de layout poderá ser adicionada sem reescrever os componentes.

---

## Fase 6.5 — Shell, rail e roteamento

### Objetivo

Migrar o esqueleto da aplicação somente depois de definir estado, host adapter, registry e lifecycle.

### Alvos

- `bruno-shell.js`;
- `bento-sidebar-card.js`;
- roteamento;
- navegação;
- preservação de estado;
- lazy loading;
- descarte de views invisíveis;
- integração com o modo mobile.

### Critérios de aceite

- shell não se torna novo monólito;
- desktop, tablet e mobile usam a mesma base;
- módulos pesados não permanecem ativos sem necessidade;
- navegação não recria toda a aplicação.

---

## Fase 6.6 — Home, popups e subviews especializadas

### Ordem recomendada

1. cards dinâmicos da Home;
2. mídia e câmera da Home;
3. popups;
4. Roborock;
5. câmeras de segurança;
6. planta 3D.

Cada migração mantém o padrão:

```text
medir
→ reproduzir
→ comparar
→ validar
→ substituir
→ remover legado do caminho vivo
```

---

## Fase 7 — Consolidação

### Ações

- aposentar originais das subviews;
- retirar tiles YAML antigos;
- retirar `views/main.yaml`;
- retirar `main-grid/`;
- retirar views mobile V1/V2/V3 após a Fase 6.3;
- revisar `_archive`;
- remover rollback in-place já consolidado;
- reduzir ou eliminar CSS gerado;
- consolidar Playwright;
- atualizar documentação;
- validar rollback por Git;
- congelar arquitetura final.

---

## 13. Deploy e cache

O hash do Vite melhora o cache, mas o relatório informa que a troca do bundle ainda exige reinício do Home Assistant.

Deve ser investigada uma camada de carregamento estável:

```text
bruno-dashboard-loader.js
        ↓
manifest.json
        ↓
bruno-dashboard.<hash>.js
```

Objetivo:

- registro estável no Home Assistant;
- bundle variável por hash;
- recarregamento de página sem reinício completo;
- identificação do build carregado;
- rollback por manifesto;
- limpeza de bundles órfãos.

Essa proposta deve ser testada isoladamente antes de substituir o fluxo atual.

---

## 14. Automações e Alexa como trilhas paralelas

A reestruturação atual exclui corretamente `packages`, sensores e automações do escopo de mudança. Isso protege a operação da casa.

Contudo, os objetivos de automação e Alexa precisam de trilhas próprias.

```text
Trilha A — Aplicação frontend
Dashboard, câmera, mídia, layout, mobile, performance

Trilha B — Automação residencial
Presença, iluminância, horários, cenas, prioridades, exceções

Trilha C — Voz e Alexa
Nomenclatura, aliases, áreas, exposição, rotinas, comandos
```

### Princípio

A automação deve funcionar mesmo quando:

- o tablet está desligado;
- o dashboard está fechado;
- o frontend falha;
- o aplicativo está em atualização.

O dashboard deve:

- visualizar;
- diagnosticar;
- permitir intervenção;
- mostrar contexto;
- configurar preferências quando apropriado.

Ele não deve ser o executor principal das automações.

---

## 15. Próximos documentos a criar

```text
docs/17-runtime-architecture.md
docs/18-camera-engine.md
docs/19-state-and-lifecycle.md
docs/20-responsive-architecture.md
docs/21-mobile-mode.md
docs/22-widget-registry.md
docs/23-host-adapter.md
docs/24-performance-baseline.md
docs/25-automation-voice-boundaries.md
```

---

## 16. Próxima ação recomendada

A sequência imediata deve ser:

```text
1. Fechar e validar a Fase 5c no tablet
2. Consolidar os arquivos ainda não commitados
3. Criar a baseline de runtime
4. Instrumentar renders, listeners, timers, streams e memória
5. Decompor um módulo da subview
6. Construir o piloto de câmera real
7. Comparar o piloto com o card oficial do Home Assistant
8. Iniciar a retirada progressiva do CSS legado
9. Tratar responsividade
10. Executar a fase específica do modo mobile
```

Não é recomendável migrar agora o shell inteiro, a planta 3D ou todas as câmeras de segurança.

---

## 17. Posicionamento final

O projeto já deixou de ser um conjunto descontrolado de YAML e JavaScript duplicado. Ele possui agora:

- fundação técnica;
- build;
- medição;
- documentação;
- rollback;
- componentes parametrizados;
- legado isolado;
- processo de migração confiável.

Ainda não é a aplicação completa pretendida porque faltam:

- runtime seletivo;
- câmera real;
- lifecycle;
- responsividade moderna;
- modo mobile integrado;
- registry de widgets;
- persistência;
- shell desacoplado;
- trilhas próprias para automação e Alexa.

Nenhuma das fases concluídas deve ser perdida.

A decisão técnica correta é:

```text
Preservar integralmente o que já foi construído
        +
Ampliar as fases restantes
        +
Passar da organização do código para a arquitetura de runtime
        +
Preparar a aplicação para tablet, mobile e evolução futura
```
