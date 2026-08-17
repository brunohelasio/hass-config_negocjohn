/**
 * Banco de medição de RENDERS (Fase 6.1).
 *
 * O banco existente (`gen-subview-harness.mjs`) mede GEOMETRIA e CONTEÚDO: se o
 * componente novo desenha o mesmo que o antigo. Ele não diz nada sobre custo.
 *
 * Este mede a outra pergunta, que é a da Fase 6.1: **quantas vezes o componente
 * repinta, e por causa de quê.** A baseline do tablet contou 3.328 renders de
 * ladrilho em 14 minutos sem conseguir apontar a causa; o critério de aceite da
 * fase é a redução medida, então precisa de banco próprio.
 *
 * COMO ELE IMITA A CASA. O Home Assistant substitui o objeto `hass` a cada
 * mudança de estado de qualquer entidade. Aqui isso é reproduzido literalmente:
 * uma sequência de objetos `hass`, cada um com UMA entidade diferente do
 * anterior. A proporção entre entidades que o componente lê e entidades que ele
 * ignora é o parâmetro — na casa real a maioria esmagadora das mudanças é de
 * coisas que o cômodo da vez não mostra.
 *
 * O QUE ELE PROVA. Sem estado seletivo, N atualizações do hass viram N renders
 * por componente montado. Com estado seletivo, viram apenas as que tocam o que
 * aquele componente lê. O banco conta os dois e devolve a diferença.
 *
 * Uso:
 *   node scripts/harness/gen-render-harness.mjs
 *   node scripts/harness/serve-harness.mjs scripts/harness/render-cost.html 8127
 */

import { readdirSync, writeFileSync } from 'node:fs';

const SAIDA = 'scripts/harness/render-cost.html';

// O bundle sai do Vite com hash de conteúdo — o nome muda a cada build. Ler o
// diretório é o que impede a medição de rodar contra a versão anterior sem
// ninguém perceber (já aconteceu).
const bundle = readdirSync('config/www/dashboard')
  .filter((f) => f.startsWith('bruno-dashboard.') && f.endsWith('.js'))
  .sort()
  .pop();

if (!bundle) throw new Error('bundle não encontrado em config/www/dashboard');

const html = `<meta charset="utf-8" />
<title>Custo de render — Fase 6.1</title>
<style>
  html, body { margin: 0; background: #14161c; color: #e8eaf0;
    font: 14px/1.5 ui-sans-serif, system-ui, sans-serif; }
  #palco { position: absolute; left: -10000px; top: 0; width: 1920px; height: 1200px; }
  pre { padding: 16px; white-space: pre-wrap; }
</style>

<div id="palco"></div>
<pre id="saida">Carregando o bundle…</pre>

<script type="module" src="/local/dashboard/${bundle}"></script>
<script type="module">
  const palco = document.getElementById('palco');
  const saida = document.getElementById('saida');

  /**
   * Os cômodos da Home, como a faixa os monta.
   *
   * Os ids saem do próprio bundle e não desta lista: a primeira tentativa deste
   * banco os escreveu à mão, errou quatro dos sete e quebrou na montagem. Uma
   * lista escrita aqui mede a minha suposição, não o sistema.
   */
  let comodosCache;
  function comodos() {
    if (comodosCache) return comodosCache;
    const candidatos = ['sala', 'office', 'cozinha', 'lavabo', 'casal', 'marina', 'miguel',
      'quarto_casal', 'quarto_marina', 'quarto_miguel'];
    const validos = [];
    for (const id of candidatos) {
      const el = document.createElement('bruno-room-tile');
      if (typeof el.setConfig !== 'function') {
        throw new Error('bruno-room-tile não registrado — o bundle não carregou');
      }
      try {
        el.setConfig({ room: id, variant: 'tile' });
        validos.push(id);
      } catch {
        // Id que não existe na configuração: fora.
      }
    }
    if (validos.length === 0) throw new Error('nenhum cômodo reconhecido');
    comodosCache = validos;
    return validos;
  }

  /**
   * Um estado de entidade no formato do HA.
   *
   * O \`last_changed\` importa: é o que distingue uma mudança real de uma
   * reemissão do mesmo valor.
   */
  function estado(id, valor, quando) {
    return {
      entity_id: id,
      state: String(valor),
      attributes: {},
      last_changed: new Date(quando).toISOString(),
      last_updated: new Date(quando).toISOString(),
    };
  }

  /**
   * Um \`hass\` completo.
   *
   * Inclui as entidades que os cômodos declaram (lidas da configuração do
   * próprio bundle) mais uma multidão de entidades que ninguém na tela lê — que
   * é o caso comum na casa: aspirador, energia, sensores de rede, atualizações.
   */
  /** Imagem que existe de verdade neste servidor, para o caminho feliz da câmera. */
  const IMAGEM_REAL = '/local/images/sala_estar.jpg';

  function montarHass(observadas, ruidoN, agora, camerasVivas = false) {
    const states = {};
    for (const id of observadas) {
      const e = estado(id, 'off', agora);
      if (camerasVivas && id.startsWith('camera.')) {
        // Com entity_picture apontando para uma imagem que existe, o motor
        // percorre o caminho de sucesso inteiro: baixa, avisa a subview, e ela
        // troca o src do elemento. Sem isso só dá para observar o caminho de erro.
        e.state = 'idle';
        e.attributes = { entity_picture: IMAGEM_REAL };
      }
      states[id] = e;
    }
    for (let i = 0; i < ruidoN; i++) states['sensor.ruido_' + i] = estado('sensor.ruido_' + i, i, agora);
    return { states, callService: async () => {}, themes: { darkMode: true } };
  }

  /** Cópia rasa com UMA entidade trocada — é o que o HA entrega a cada mudança. */
  function comMudanca(hass, id, valor, quando) {
    return { ...hass, states: { ...hass.states, [id]: estado(id, valor, quando) } };
  }

  /**
   * Espera o Lit terminar de aplicar o DOM.
   *
   * NÃO usa requestAnimationFrame: o navegador o suspende quando a aba está em
   * segundo plano, e a medição roda com a aba oculta. Um timeout curto sempre
   * dispara, e o Lit agenda seus updates num microtask — dois turnos bastam.
   */
  function esperarQuadro() {
    return new Promise((r) => setTimeout(() => setTimeout(r, 0), 16));
  }

  /**
   * A medição.
   *
   * \`fracaoRelevante\` é quanto das mudanças toca entidades que os componentes
   * montados leem. Na casa real esse número é baixo — daí o desperdício.
   */
  window.medirRenders = async function medirRenders(passos = 400, fracaoRelevante = 0.1) {
    const runtime = globalThis.brunoRuntime;
    if (!runtime) throw new Error('brunoRuntime ausente — o bundle não carregou');
    runtime.zerar();

    palco.innerHTML = '';
    const ladrilhos = [];
    for (const comodo of comodos()) {
      const el = document.createElement('bruno-room-tile');
      el.setConfig({ room: comodo, variant: 'tile' });
      palco.appendChild(el);
      ladrilhos.push(el);
    }
    await esperarQuadro();

    // As entidades que os ladrilhos montados de fato observam. Sai do próprio
    // componente, não de uma lista escrita aqui — uma lista à mão mediria a
    // minha suposição, não o comportamento.
    const observadas = [
      ...new Set(ladrilhos.flatMap((el) => el._observador?.observadas ?? [])),
    ];
    if (observadas.length === 0) throw new Error('nenhuma entidade observada — o observador não subiu');

    let hass = montarHass(observadas, 300, Date.now());
    for (const el of ladrilhos) el.hass = hass;
    await esperarQuadro();

    const antes = runtime.instantaneo();
    const rendersDaMontagem = antes.componentes.find((c) => c.nome === 'bruno-room-tile')?.render.total ?? 0;

    // A rajada: cada passo troca UMA entidade e reentrega o hass a todos os
    // componentes montados, exatamente como o Lovelace faz.
    //
    // O \`await updateComplete\` a cada passo NÃO é detalhe: o Lit agrupa os
    // \`requestUpdate\` pendentes num único ciclo. Sem esvaziar, um laço síncrono
    // de 400 passos vira UM render por componente, e a medição diria 99,8% de
    // redução — estaria medindo o agrupamento do Lit, não o estado seletivo. Na
    // casa real as mudanças chegam espalhadas no tempo, cada uma com seu ciclo.
    let relevantes = 0;
    for (let i = 0; i < passos; i++) {
      const relevante = i % Math.round(1 / fracaoRelevante) === 0;
      const alvo = relevante
        ? observadas[i % observadas.length]
        : 'sensor.ruido_' + (i % 300);
      if (relevante) relevantes++;
      hass = comMudanca(hass, alvo, 'v' + i, Date.now() + i * 1000);
      for (const el of ladrilhos) el.hass = hass;
      await Promise.all(ladrilhos.map((el) => el.updateComplete));
    }
    await esperarQuadro();

    const depois = runtime.instantaneo();
    const c = depois.componentes.find((x) => x.nome === 'bruno-room-tile');
    const rendersTotais = c?.render.total ?? 0;
    const rendersDaRajada = rendersTotais - rendersDaMontagem;

    // Sem estado seletivo cada atualização do hass repinta CADA componente
    // montado — é o que o setter fazia antes desta fase.
    const semEstadoSeletivo = passos * ladrilhos.length;

    const r = {
      build: depois.build,
      componentesMontados: ladrilhos.length,
      entidadesObservadas: observadas.length,
      atualizacoesDoHass: passos,
      mudancasRelevantes: relevantes,
      rendersDaMontagem,
      rendersDaRajada,
      semEstadoSeletivo,
      reducao: (100 * (1 - rendersDaRajada / semEstadoSeletivo)).toFixed(1) + '%',
      motivos: c?.motivos ?? [],
      vazamentos: depois.vazamentos,
      vivos: depois.vivos,
    };
    saida.textContent = JSON.stringify(r, null, 2);
    return r;
  };

  /**
   * O mesmo, para a subview — o componente pesado.
   *
   * Ele merece medição própria porque antes da Fase 6.1 não tinha guarda
   * NENHUMA: repintava a cada atualização do hass, a 3 ms de média e 34,9 ms no
   * pior caso, medidos no tablet. Uma subview por vez fica montada, então o
   * multiplicador aqui é 1 — mas o custo unitário é trinta vezes o do ladrilho.
   */
  window.medirSubview = async function medirSubview(passos = 200, fracaoRelevante = 0.1) {
    const runtime = globalThis.brunoRuntime;
    if (!runtime) throw new Error('brunoRuntime ausente');
    runtime.zerar();

    palco.innerHTML = '';
    const el = document.createElement('bruno-room-subview');
    if (typeof el.setConfig !== 'function') throw new Error('bruno-room-subview não registrado');
    el.setConfig({ room: 'sala' });
    palco.appendChild(el);
    await esperarQuadro();

    const observadas = el._observador?.observadas ?? [];
    if (observadas.length === 0) throw new Error('subview sem entidades observadas');

    let hass = montarHass(observadas, 300, Date.now());
    el.hass = hass;
    await esperarQuadro();

    const rendersDaMontagem =
      runtime.instantaneo().componentes.find((c) => c.nome === 'bruno-room-subview')?.render.total ?? 0;

    let relevantes = 0;
    for (let i = 0; i < passos; i++) {
      const relevante = i % Math.round(1 / fracaoRelevante) === 0;
      const alvo = relevante ? observadas[i % observadas.length] : 'sensor.ruido_' + (i % 300);
      if (relevante) relevantes++;
      hass = comMudanca(hass, alvo, 'v' + i, Date.now() + i * 1000);
      el.hass = hass;
      await el.updateComplete;
    }
    await esperarQuadro();

    const s = runtime.instantaneo();
    const c = s.componentes.find((x) => x.nome === 'bruno-room-subview');
    const rendersDaRajada = (c?.render.total ?? 0) - rendersDaMontagem;
    const medio = c && c.render.total ? c.render.duracaoTotal / c.render.total : 0;

    el.remove();
    await esperarQuadro();

    const r = {
      build: s.build,
      entidadesObservadas: observadas.length,
      atualizacoesDoHass: passos,
      mudancasRelevantes: relevantes,
      rendersDaMontagem,
      rendersDaRajada,
      semEstadoSeletivo: passos,
      reducao: (100 * (1 - rendersDaRajada / passos)).toFixed(1) + '%',
      msPorRender: medio.toFixed(2),
      msEconomizados: ((passos - rendersDaRajada) * medio).toFixed(0),
      motivos: c?.motivos ?? [],
      aposDesmontar: runtime.instantaneo().vazamentos,
    };
    saida.textContent = JSON.stringify(r, null, 2);
    return r;
  };

  /**
   * Verificação de integração do motor de instantâneos (Fase 6.2B).
   *
   * Os testes de unidade provam a POLÍTICA com agenda falsa. Isto prova a
   * LIGAÇÃO: que a subview declara os alvos ao motor, que ele agenda de verdade,
   * e — o mais importante — que ele **não martela** quando as requisições falham.
   *
   * Aqui elas falham todas, e de propósito: não há Home Assistant, então o
   * caminho do proxy de câmera devolve 404. É o cenário de câmera fora do ar,
   * que é exatamente o caso que o motor veio proteger.
   */
  window.medirCameras = async function medirCameras(segundos = 30, vivas = false) {
    // A aba do banco roda em segundo plano, e a suspensão de módulo invisível
    // (Fase 6.1) desliga o ciclo de câmera exatamente nessa condição. Correto no
    // produto, mas aqui é artefato do laboratório: sem isto a medição dá zero
    // tentativa e parece defeito do motor. Neutralizar o artefato é legítimo;
    // forjar o resultado não seria.
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });

    palco.innerHTML = '';
    const el = document.createElement('bruno-room-subview');
    if (typeof el.setConfig !== 'function') throw new Error('bruno-room-subview não registrado');
    el.setConfig({ room: 'cozinha' }); // a Cozinha tem duas câmeras
    palco.appendChild(el);

    const observadas = el._observador?.observadas ?? [];
    el.hass = montarHass(observadas, 20, Date.now(), vivas);
    await el.updateComplete;
    await esperarQuadro();

    const motor = el._motorCameras;
    if (!motor) throw new Error('motor de câmeras ausente na subview');

    const alvosIniciais = motor.metricas().map((m) => m.entityId + ':' + m.prioridade);
    const picoEmVoo = { valor: 0 };
    const vigia = setInterval(() => {
      const v = motor.emVoo();
      if (v > picoEmVoo.valor) picoEmVoo.valor = v;
    }, 50);

    await new Promise((r) => setTimeout(r, segundos * 1000));
    clearInterval(vigia);

    const metricas = motor.metricas();
    const tentativas = metricas.reduce((t, m) => t + m.quadros + m.falhas, 0);

    // O caminho feliz completo: o quadro que o motor baixou chegou ao elemento
    // da tela? É a única prova de que a ligação motor -> subview fecha.
    const naTela = [...el.shadowRoot.querySelectorAll('img[data-camera-entity]')].map((img) => ({
      entidade: img.dataset.cameraEntity,
      temSelo: img.getAttribute('src').includes('bruno_t='),
      marcadaCarregada: img.classList.contains('is-loaded'),
    }));

    // Sem o motor, o ciclo antigo dispararia uma requisição por câmera a cada
    // 6,5 s, sem olhar o resultado — e continuaria assim para sempre.
    const semMotor = Math.floor((segundos * 1000) / 6500) * metricas.length;

    el.remove();
    await esperarQuadro();

    const r = {
      comodo: 'cozinha',
      segundos,
      alvos: alvosIniciais,
      tentativas,
      semMotor,
      picoDeRequisicoesEmVoo: picoEmVoo.valor,
      camerasSimultaneas: metricas.length,
      naTela,
      metricas,
      aposDesmontar: { emVoo: motor.emVoo(), vazamentos: globalThis.brunoRuntime?.instantaneo().vazamentos },
    };
    saida.textContent = JSON.stringify(r, null, 2);
    return r;
  };

  /**
   * A memória, medida onde ela realmente pode ser medida (Fase 6.2B).
   *
   * ── A HIPÓTESE QUE CAIU ─────────────────────────────────────────────────
   *
   * A baseline do PC acusou o piso do heap subindo ~100 MB em poucos minutos, e
   * eu supus quadros de câmera decodificados: cada quadro tem URL única por
   * causa do selo, e um instantâneo 1920x1080 ocupa 8,29 MB decodificado —
   * 11 carregamentos dariam 91 MB, quase o valor medido.
   *
   * A aritmética batia e a conclusão estava errada. **"usedJSHeapSize" mede só o
   * heap JavaScript.** Bitmap decodificado vive no cache de imagens do
   * renderizador, FORA desse heap. Baixar 40 imagens com URL única moveu
   * 0,1 MB — ou seja, imagem nenhuma aparece nessa métrica, por construção.
   *
   * (A primeira versão deste experimento chegou a imprimir "hipótese
   * CONFIRMADA": comparava 0,1 MB com 0,0 MB por RAZÃO. Razão sobre ruído dá
   * qualquer coisa. Lição repetida: comparar proporções sem antes exigir
   * magnitude mínima é fabricar conclusão.)
   *
   * ── O QUE ESTE EXPERIMENTO MEDE ─────────────────────────────────────────
   *
   * Se o crescimento do heap JS vem dos MEUS componentes. Monta e desmonta a
   * subview N vezes, alimentando cada instância com hass, e lê o heap ao longo
   * do caminho. Aqui não há frontend do Home Assistant na página: o que crescer
   * é meu.
   */
  window.medirMemoriaSubview = async function medirMemoriaSubview(voltas = 40) {
    const ler = () => (performance.memory ? performance.memory.usedJSHeapSize : null);
    if (ler() === null) return { erro: 'performance.memory indisponível neste navegador' };

    palco.innerHTML = '';
    await esperarQuadro();

    const lista = comodos();
    const amostras = [];
    const registrar = () => amostras.push(ler());

    registrar();
    for (let i = 0; i < voltas; i++) {
      const el = document.createElement('bruno-room-subview');
      el.setConfig({ room: lista[i % lista.length] });
      palco.appendChild(el);
      const observadas = el._observador?.observadas ?? [];
      el.hass = montarHass(observadas, 40, Date.now(), false);
      await el.updateComplete;
      el.remove();
      if (i % 5 === 4) registrar();
    }

    // Um respiro para a coleta de lixo acontecer antes da leitura final.
    await new Promise((r) => setTimeout(r, 3000));
    registrar();

    const mb = (b) => (b / 1048576).toFixed(1) + ' MB';
    const inicio = amostras[0];
    const fim = amostras[amostras.length - 1];
    const piso = Math.min(...amostras);
    const pico = Math.max(...amostras);
    const porVolta = (fim - inicio) / voltas;

    const r = {
      voltas,
      inicio: mb(inicio),
      fim: mb(fim),
      piso: mb(piso),
      pico: mb(pico),
      crescimento: mb(fim - inicio),
      porVolta: (porVolta / 1024).toFixed(0) + ' KB',
      amostras: amostras.map(mb),
      vazamentos: globalThis.brunoRuntime?.instantaneo().vazamentos,
      // 100 MB em ~28 montagens seria ~3,6 MB por montagem. Bem abaixo disso, o
      // crescimento medido na baseline não vem daqui.
      leitura:
        porVolta > 1_000_000
          ? 'mais de 1 MB por montagem — a subview retém'
          : 'crescimento por montagem irrelevante — a retenção da baseline NÃO vem da subview',
    };
    saida.textContent = JSON.stringify(r, null, 2);
    return r;
  };

  /**
   * Geometria dos módulos da subview, para provar que uma mudança NÃO move nada.
   *
   * A Fase 6.2 começa ligando a escala fluida e o container query. Nenhum dos
   * dois deve alterar o layout enquanto o CSS gerado ainda estiver em px — mas
   * "não deve" precisa virar número, porque container query estabelece
   * contenção e isso mexe em como o elemento calcula tamanho.
   */
  window.geometria = async function geometria(comodo = 'sala', largura = 1920, altura = 1200) {
    palco.style.width = largura + 'px';
    palco.style.height = altura + 'px';
    palco.innerHTML = '';
    const el = document.createElement('bruno-room-subview');
    el.setConfig({ room: comodo });
    palco.appendChild(el);
    const obs = el._observador?.observadas ?? [];
    el.hass = montarHass(obs, 30, Date.now(), false);
    await el.updateComplete;
    await esperarQuadro();

    const alvos = ['.hero-panel', '.lights-card', '.ac-card', '.cameras-card',
      '.media-hub', '.top-bar', 'main'];
    const r = { comodo, largura, altura, modulos: {} };
    for (const sel of alvos) {
      const n = el.shadowRoot.querySelector(sel);
      if (!n) continue;
      const b = n.getBoundingClientRect();
      r.modulos[sel] = [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)];
    }
    el.remove();
    saida.textContent = JSON.stringify(r, null, 2);
    return r;
  };

  /**
   * Geometria de UM ladrilho, na largura de uma celula da faixa.
   *
   * A faixa da Home e "repeat(8, minmax(0,1fr))" com gap 10 dentro de 1820 px,
   * o que da 218,75 px por celula. E essa a referencia da fluidizacao do
   * ladrilho — nao os 1820 da subview.
   */
  window.geometriaTile = async function geometriaTile(comodo = 'sala', largura = 218.75) {
    palco.style.width = largura + 'px';
    palco.style.height = '260px';
    palco.innerHTML = '';
    const el = document.createElement('bruno-room-tile');
    el.setConfig({ room: comodo, variant: 'tile' });
    palco.appendChild(el);
    const obs = el._observador?.observadas ?? [];
    el.hass = montarHass(obs, 20, Date.now(), false);
    await el.updateComplete;
    await esperarQuadro();

    const alvos = ['.room-icon', '.room-asset-wrap', '.room-name', '.room-action', '.room-card'];
    const r = { comodo, largura, alvos: {} };
    for (const sel of alvos) {
      const n = el.shadowRoot.querySelector(sel);
      if (!n) continue;
      const b = n.getBoundingClientRect();
      r.alvos[sel] = [Math.round(b.width), Math.round(b.height)];
    }
    el.remove();
    saida.textContent = JSON.stringify(r, null, 2);
    return r;
  };

  /**
   * Ciclo de navegação: monta e desmonta N vezes e confere que nada sobrou.
   *
   * É o aceite literal da fase — "contadores voltam ao inicial após 50
   * navegações". Usa a marca do coletor, para não perder a medição de render.
   */
  window.medirCiclos = async function medirCiclos(voltas = 50) {
    const runtime = globalThis.brunoRuntime;
    if (!runtime) throw new Error('brunoRuntime ausente');

    palco.innerHTML = '';
    await esperarQuadro();
    const marca = runtime.marcar();

    const observadas = [];
    let hass = montarHass(observadas, 50, Date.now());

    for (let i = 0; i < voltas; i++) {
      const el = document.createElement('bruno-room-tile');
      const lista = comodos();
      el.setConfig({ room: lista[i % lista.length], variant: 'tile' });
      palco.appendChild(el);
      el.hass = hass;
      await esperarQuadro();
      el.remove();
    }
    await esperarQuadro();

    const s = runtime.instantaneo();
    const r = { voltas, marca, sobrou: s.desdeAMarca, vazamentos: s.vazamentos, vivos: s.vivos };
    saida.textContent = JSON.stringify(r, null, 2);
    return r;
  };

  saida.textContent = 'Pronto. window.medirRenders() e window.medirCiclos().';
  window.__pronto = true;
</script>
`;

writeFileSync(SAIDA, html, 'utf8');
console.log(`  ${SAIDA} -> ${bundle}`);
