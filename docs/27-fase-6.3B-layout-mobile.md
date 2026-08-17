# Fase 6.3B — consolidação do layout mobile

**Data:** 2026-08-09 · **Entregável:** decisão de layout, tela por tela.
**Sem código.** A implementação é a 6.5B.

---

## 1. O princípio que governa tudo aqui

> "a ideia é poder executar certos comandos, como luzes e cortina, com
> visualização da câmera em tempo real" — usuário, 2026-08-09

No tablet de parede você **está no cômodo**: acende a luz e vê acontecer. A
câmera ali é vigilância.

No celular você está **longe**. Acende a luz e não vê nada — a menos que a câmera
esteja na tela. No mobile a câmera deixa de ser vigilância e vira **confirmação
da ação**.

Disso decorre a única regra estrutural desta fase:

> **No mobile, a câmera do cômodo não rola para fora da tela enquanto você
> comanda.**

E é essa regra que resolve a tensão do pedido original: a ordem sugerida —
hero → iluminação → câmera → hub → A/C — coloca a câmera em terceiro. Numa pilha
com rolagem, ela desaparece no instante em que você opera as luzes.

---

## 2. O que os sistemas de mercado fazem no mobile

Levantamento do que é padrão, para a proposta não ser invenção isolada:

| sistema | padrão de sala no celular |
|---|---|
| **Apple Home** | grade de ladrilhos; toque longo abre folha de detalhe em tela cheia |
| **Google Home** | lista de dispositivos; toque abre folha inferior, sem sair da tela |
| **SmartThings** | abas por grupo + cards; detalhe em folha |
| **Control4 / Savant** | área de contexto fixa no topo (câmera ou mídia) + linhas de controle abaixo |
| **Tuya / SmartLife** | câmera em destaque fixo, controles abaixo |

Três constantes:

1. **Folha secundária** em vez de navegar para outra tela — o contexto não se
   perde. É exatamente a "abertura secundária" que o usuário intuiu.
2. **Contexto fixo no topo**, conteúdo rolando embaixo.
3. **Ação na zona do polegar** — o terço inferior da tela.

A proposta abaixo adota as três, no vocabulário visual que este dashboard já tem.

---

## 3. Subview de cômodo — a proposta

### 3.1 Estrutura

```
┌──────────────────────────────────────┐
│ ● Ocupado  ·  24°  ·  61%  ·  3 luzes│  faixa de status  (44 px)
├──────────────────────────────────────┤
│                                      │
│            C Â M E R A               │  contexto FIXO
│         (16:9, ao vivo)              │  colapsa ao rolar
│                                      │
│  Sala                      ⛶  ⋯      │  nome + tela cheia + menu
├──────────────────────────────────────┤
│  ▤ Cortina    [ Abrir │ ▪ │ Fechar ] │  ← ação direta, sem abrir nada
├──────────────────────────────────────┤
│                                      │
│  ☀ Iluminação      3 de 7   [====○]  │  ← resumo + toque abre folha
│  ❄ Ar-condicionado 24°  Frio    ⏻    │
│  ♫ Mídia           Spotify · Pausado │
│  ⊞ Eletrodomésticos    2 ativos      │  (só onde existe)
│                                      │
│              (rola aqui)             │
├──────────────────────────────────────┤
│   ⌂     ▣     ▤     ⬡     ⋯          │  barra inferior  (64 px + safe area)
└──────────────────────────────────────┘
```

### 3.2 A câmera que colapsa

Ao rolar, a câmera encolhe de 16:9 para uma faixa de 72 px que **permanece
visível**, com o nome do cômodo ao lado. Rolando de volta ao topo, ela reabre.

É o padrão de cabeçalho colapsável que Android e iOS usam há anos, e resolve o
conflito sem escolher um lado: você tem a imagem grande quando está olhando, e a
confirmação sempre à vista quando está comandando.

**Se a câmera estiver indisponível ou o cômodo não tiver uma**, o lugar é ocupado
pelo hero compacto (relógio, clima do cômodo) — a estrutura não muda.

### 3.3 Por que a cortina fica inline e o resto não

A cortina tem **três botões e nenhum estado a explorar**: abrir, parar, fechar.
Abrir uma folha para três botões é atrito puro. Ela fica na faixa logo abaixo da
câmera — que é a posição de melhor alcance do polegar em uso a uma mão.

Iluminação, A/C e mídia têm profundidade: sete luzes individuais, modo e
ventilação, fila e dispositivos. Essas ganham **linha de resumo com ação rápida
embutida** e folha para o resto.

| módulo | na linha | na folha |
|---|---|---|
| Iluminação | "3 de 7" + interruptor geral | as luzes individuais, por zona |
| A/C | temperatura, modo, botão liga/desliga | alvo, modo, ventilação, swing |
| Mídia | o que toca, play/pause | dispositivos, fila, presets |
| Eletrodomésticos | quantos ativos | os aparelhos |

**Nas linhas de resumo, a ação mais usada de cada módulo está sempre a um toque**
— sem abrir nada. A folha é para o detalhe, não para o comando comum.

### 3.4 O que sai do mobile

| sai | por quê |
|---|---|
| Coluna de dois lados | não cabe em retrato |
| PIP de câmera | a segunda câmera entra no menu ⋯ da câmera |
| Anel do A/C em tamanho cheio | vai para a folha, reduzido |
| Faixa de tiles de cômodos | decisão do usuário: é peça da parede |

### 3.5 O defeito de cascata que isto corrige

Hoje algumas subviews empilham no celular e outras não, e a causa está medida
(ver `docs/26-fase-6.3A-mobile.md`, §3.1): as sobreposições de grid por cômodo
são mais específicas **e** vêm depois da regra de `@media (max-width: 760px)`,
então vencem em qualquer largura.

**A correção não é mexer na especificidade.** É o layout mobile deixar de depender
de vencer a cascata: no modo `mobile` a subview usa um grid próprio, declarado por
modo, e as sobreposições de cômodo ficam restritas ao modo `tablet`.

---

## 4. Home mobile — a proposta

### 4.1 O que ela é

**A Home no celular é um ponto de partida, não um painel.** Você a abre para ir a
algum lugar ou fazer uma coisa. Quem quer contemplar o estado da casa está diante
do tablet.

```
┌──────────────────────────────────────┐
│ ●3 luzes · 24° · 61% · rede ok       │  faixa de status
├──────────────────────────────────────┤
│  Boa noite, Bruno            22:14   │  hero compacto (96 px)
│  Sexta, 9 de agosto · 24° nublado    │
├──────────────────────────────────────┤
│  ┌────────────┐  ┌────────────┐      │
│  │ Sala       │  │ Office     │      │  cards de cômodo
│  │ 3 luzes ⏻  │  │ Ocupado ⏻  │      │  2 colunas
│  │ 24° · 61%  │  │ 26° · 58%  │      │
│  └────────────┘  └────────────┘      │
│  ┌────────────┐  ┌────────────┐      │
│  │ Cozinha    │  │ Q. Casal   │      │
│  └────────────┘  └────────────┘      │
│           ... (rola)                 │
├──────────────────────────────────────┤
│  ♫ Spotify · Echo Show        ⏸      │  contexto, só quando há
│  ◉ Movimento no Corredor      ver    │  o que está acontecendo agora
├──────────────────────────────────────┤
│   ⌂     ▣     ▤     ⬡     ⋯          │  barra inferior
└──────────────────────────────────────┘
```

### 4.2 As três decisões

**O card de cômodo é a unidade.** Decisão nº 3 do usuário, e ela é a certa: num
card só dá para ver o status, acionar a luz principal e entrar na subview. É
exatamente o que Apple e Google fazem.

**Duas colunas, não uma.** Sete cômodos numa coluna são sete rolagens. Em duas,
quatro cômodos aparecem sem rolar — e o card ainda tem largura para status e
interruptor. A escala fluida da 6.2 já garante que o card se acomode.

**O bloco de contexto é condicional.** Mídia tocando e movimento recente aparecem
*quando existem*. Numa casa parada, a Home é status + cômodos + barra, e cabe
inteira na tela.

### 4.3 O que sai da Home mobile

| sai | destino |
|---|---|
| Faixa de tiles | não existe no mobile (decisão do usuário) |
| Energia, Roborock, Calendário | menu ⋯ da barra inferior |
| Ações rápidas em faixa | as cenas vão para o menu ⋯; as demais já foram redistribuídas na 5e |

---

## 5. Câmeras — a proposta

Decisão nº 4 do usuário: **todas do mesmo tamanho**, sem câmera principal grande.

```
┌──────────────────────────────────────┐
│ Câmeras                     8 no ar  │
├──────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐          │
│  │ Sala     │  │ Varanda  │          │  grade 2 colunas
│  ├──────────┤  ├──────────┤          │  instantâneos
│  │ Cozinha  │  │ A. Serv. │          │
│  ├──────────┤  ├──────────┤          │
│  │ Office   │  │ Q. Casal │          │
│  └──────────┘  └──────────┘          │
├──────────────────────────────────────┤
│   ⌂     ▣     ▤     ⬡     ⋯          │
└──────────────────────────────────────┘
```

**Instantâneo na grade, vídeo sob demanda.** Tocar numa câmera abre tela cheia com
o ao vivo. Ao sair, o stream é encerrado.

Esta não é preferência estética — é regra medida. Na Fase 6.2B, duas câmeras
disputando a mesma fonte levaram uma a **100% de falha**. No celular, com rede
móvel, o custo é maior. **No mobile, no máximo um stream por vez.**

E a decisão nº 4 conversa perfeitamente com isso: se todas têm o mesmo tamanho,
nenhuma é "a principal" — então o instantâneo é o comportamento correto para
todas, sem exceção a justificar.

---

## 6. Os demais módulos

| módulo | proposta |
|---|---|
| **Mídia** | arte grande no topo, controles na zona do polegar, dispositivos em folha |
| **Planta 3D** | tela cheia, sem barra inferior, com botão de sair. Retrato reduz demais; o gesto natural é rotacionar, e a planta é o único módulo onde paisagem no celular faz sentido |
| **Roborock** | mapa em cima, ações em linha embaixo. Hoje é concebido em paisagem e não adapta |
| **Menu ⋯** | Energia, Calendário, Cenas, Sistema, Rede, Updates, Config, Atualizar |

---

## 7. A barra inferior

| visível | no menu ⋯ |
|---|---|
| Home · Câmeras · Aspirador · Planta 3D · Mais | Música, Sistema, Rede, Atualizar, Updates, Config, Power |

Cinco itens é o limite confortável em retrato. É a curadoria que já existe em
`rail.yaml` (9 itens `hide_on_phone`) e ela se mantém.

**Safe areas:** `env(safe-area-inset-bottom)` na barra. Hoje não existe — em
aparelho com gesto de navegação, a barra encosta na área do sistema.

---

## 8. Alvos de toque e densidade

| | mobile | tablet |
|---|---|---|
| Alvo mínimo | 44 × 44 px | 48 × 48 px |
| Zona preferencial de ação | terço inferior | qualquer |
| Tipografia base | não menor que 13 px | conforme a escala |

A escala fluida da 6.2 já dimensiona; o que esta fase define é a
**reorganização** — o que sai, o que vira folha, o que fica fixo.

---

## 9. O que fica para o usuário decidir

| # | decisão | recomendação |
|---|---|---|
| D1 | Câmera fixa que colapsa, ou câmera na pilha? | **Colapsável.** Serve o objetivo declarado sem custar espaço permanente. Se preferir simples, a alternativa é a câmera fixa em 16:9 sem colapso — custa ~220 px sempre |
| D2 | Duas colunas de cômodos na Home, ou uma? | **Duas.** Quatro cômodos sem rolar, contra dois |
| D3 | Planta 3D em paisagem forçada? | **Sim**, com botão de sair. É o único módulo onde retrato não funciona |
| D4 | Folha secundária ou navegar para outra tela? | **Folha.** Não perde contexto, e é o padrão do mercado |
| D5 | A ordem que você sugeriu (hero → luz → câmera → hub → A/C) | Proposta **inverte**: câmera antes das linhas de controle, pelo motivo do §1. A cortina sobe para logo abaixo da câmera, por ser ação sem profundidade |

---

## 10. O que a 6.5B implementa a partir daqui

Nada de desenho fica em aberto. A 6.5B recebe:

- a estrutura de cada tela, com o que é fixo e o que rola;
- quais módulos viram linha de resumo e o que cada folha contém;
- a regra de um stream por vez;
- alvos de toque e safe areas;
- o grid mobile declarado por modo, que corrige o defeito de cascata.

**Pré-requisito:** o contrato `DashboardMode = 'tablet' | 'mobile'` da 6.3A, e a
shell da 6.5.
