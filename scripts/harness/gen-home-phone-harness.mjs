// Banco de medicao da HOME no TELEFONE.
//
// POR QUE ELE EXISTE
//
// Tres rodadas seguidas de ajuste de altura em Favoritos foram feitas por
// estimativa, e o usuario teve de corrigir as tres. Ou o bloco era cortado pela
// rail, ou sobrava folga e a secao "Em execucao" aparecia acima da dobra.
//
// Este banco reproduz a coluna do telefone com as MESMAS medidas da shell —
// altura de viewport, rail, padding do content-slot e o grid da
// section_home_v2.yaml — e mede onde cada bloco realmente termina.
//
//   node scripts/harness/gen-home-phone-harness.mjs
//   node scripts/harness/serve-harness.mjs scripts/harness/home-phone.html 8203
import { writeFileSync, readdirSync, statSync } from 'node:fs';

const SAIDA = 'scripts/harness/home-phone.html';

// O entry muda de hash a cada build; pega o mais recente do dist publicado.
const bundle = readdirSync('config/www/dashboard')
  .filter((f) => /^bruno-dashboard\..*\.js$/.test(f) && !f.endsWith('.map'))
  .sort(
    (a, b) =>
      statSync(`config/www/dashboard/${b}`).mtimeMs - statSync(`config/www/dashboard/${a}`).mtimeMs,
  )[0];

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Home phone — banco de medição</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #14171d; color: #eee;
               font: 12px/1.4 system-ui, -apple-system, sans-serif; }

  /* A shell no telefone: conteudo rolavel em cima, rail fixa na base. */
  /* Altura explicita: 100dvh nao resolve em painel embutido, e o banco
     precisa da MESMA altura util do aparelho. 926 = iPhone 13 Pro Max; o
     app do HA costuma entregar menos, e por isso ela e parametrizavel. */
  .shell { display: grid; grid-template-rows: minmax(0, 1fr) auto;
           height: var(--altura-util, 926px); }
  /* padding REAL da shell no phone (bruno-shell.js): 10px 10px 6px */
  .content-slot { overflow-y: auto; padding: 10px 10px 6px; min-height: 0; }
  .rail-slot { position: relative; height: 58.4px; background: rgba(0,0,0,.35); }
  .rail-slot::after { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                      background: rgba(255,255,255,.30); }

  /* O grid da section_home_v2.yaml no bloco (max-width: 800px). */
  .secao { display: grid; grid-gap: 5px; grid-template-columns: minmax(0, 1fr);
           grid-template-rows: minmax(44px, auto) minmax(0, auto) minmax(0, 1fr);
           min-height: 100%; }

  /* Substitutos com a altura real medida no aparelho. */
  .badges { height: 44px; background: rgba(255,255,255,.05); border-radius: 10px; }
  .hero   { background: rgba(255,255,255,.04); border-radius: 10px; padding: 2px 16px 7px; }
  .hero .data { font-size: 12px; opacity: .7; }
  .hero .saud { font-size: 19px; font-weight: 700; }
  .hero .rel  { font-size: 72px; line-height: .92; font-weight: 220; }

  #relatorio { position: fixed; top: 6px; right: 6px; z-index: 99; max-width: 300px;
               background: rgba(8,12,20,.92); border: 1px solid rgba(255,255,255,.2);
               border-radius: 8px; padding: 6px 8px; font: 11px/1.35 ui-monospace, monospace;
               white-space: pre-wrap; }
</style>
</head>
<body>
<div class="shell">
  <div class="content-slot" id="slot">
    <div class="secao">
      <div class="badges"></div>
      <div class="hero">
        <div class="data">SÁBADO, 22 AGO</div>
        <div class="saud">Boa tarde, Bruno</div>
        <div class="rel">17:05</div>
      </div>
      <div id="envelope"></div>
    </div>
  </div>
  <div class="rail-slot"></div>
</div>
<pre id="relatorio">carregando…</pre>

<script type="module" src="/local/dashboard/${bundle}"></script>
<script>
const S = (id, state, attributes = {}) => ({ entity_id: id, state, attributes,
  last_changed: new Date().toISOString(), last_updated: new Date().toISOString() });

// hass minimo: o suficiente para os cards montarem e o compositor medir.
const hass = { states: {}, themes: {}, language: 'pt', locale: { language: 'pt' },
  callService: () => Promise.resolve(), callWS: () => Promise.resolve([]),
  connection: { subscribeEvents: () => Promise.resolve(() => {}),
                subscribeMessage: () => Promise.resolve(() => {}) } };

const povoar = () => {
  for (const id of ['light.grupo_luzes_sala','light.grupo_luzes_cozinha','light.grupo_luzes_lavabo',
                    'light.grupo_luzes_office','light.grupo_luzes_quarto_casal',
                    'light.grupo_luzes_quarto_marina','light.grupo_luzes_quarto_miguel'])
    hass.states[id] = S(id, 'off');
  hass.states['calendar.brunohelasio_gmail_com'] =
    S('calendar.brunohelasio_gmail_com', 'on',
      { message: 'Flight to Brasília (LA 3777)', start_time: '2026-08-22 11:10:00' });
  hass.states['sensor.home_insights'] = S('sensor.home_insights', '1',
    { items: [{ text: 'Cozinha ocupada', detail: 'ha 4 min' }] });
  hass.states['sensor.iphone_ssid'] = S('sensor.iphone_ssid', 'Helasio_AP_5G');
  hass.states['sensor.hua_wei_lu_you_ax3_pro_download_speed'] =
    S('sensor.hua_wei_lu_you_ax3_pro_download_speed', '0.0');
  hass.states['sensor.hua_wei_lu_you_ax3_pro_upload_speed'] =
    S('sensor.hua_wei_lu_you_ax3_pro_upload_speed', '0.0');
  for (const id of ['binary_sensor.home_activity_camera','binary_sensor.home_activity_roborock',
                    'binary_sensor.home_activity_media'])
    hass.states[id] = S(id, 'off');
};
povoar();

globalThis.loadCardHelpers = async () => ({
  createCardElement: (config) => {
    const tag = String(config.type || '').replace('custom:', '');
    const el = document.createElement(tag);
    if (typeof el.setConfig === 'function') { try { el.setConfig(config); } catch (_) {} }
    return el;
  },
});

// PRODUCAO: a shell tem shadow root, o layout-card tem outro, e so entao vem o
// componente. O banco reproduz DOIS niveis: sem isso, closest() encontrava o
// content-slot aqui e falhava no aparelho — foi o que deixou o bloco 64px alto
// demais e cortado pela rail.
const envelope = document.getElementById('envelope');
const raiz1 = envelope.attachShadow({ mode: 'open' });
const nivel2 = document.createElement('div');
raiz1.appendChild(nivel2);
const raiz2 = nivel2.attachShadow({ mode: 'open' });
const alvoEl = document.createElement('bruno-home-phone');
raiz2.appendChild(alvoEl);

window.medir = async function medir({ rodando = false } = {}) {
  const alvo = alvoEl;
  alvo.setConfig({
    type: 'custom:bruno-home-phone',
    pages: [{ rooms: ['sala', 'cozinha', 'lavabo'] },
            { rooms: ['office', 'casal', 'marina', 'miguel'] }],
    favorites: {
      agenda: { calendarEntity: 'calendar.brunohelasio_gmail_com',
                insightsEntity: 'sensor.home_insights' },
      wifi: { ssidEntity: 'sensor.iphone_ssid',
              downloadEntity: 'sensor.hua_wei_lu_you_ax3_pro_download_speed',
              uploadEntity: 'sensor.hua_wei_lu_you_ax3_pro_upload_speed' },
    },
    scenes: [{ label: 'Apagar luzes', script: 's.a', icon: 'lights_off' },
             { label: 'Bom dia', script: 's.b', icon: 'mdi:weather-sunset-up' },
             { label: 'Boa noite', script: 's.c', icon: 'mdi:weather-night' },
             { label: 'Cinema', script: 's.d', icon: 'movies' }],
    running: { camera: 'binary_sensor.home_activity_camera',
               roborock: 'binary_sensor.home_activity_roborock',
               media: 'binary_sensor.home_activity_media' },
    dynamicCard: { type: 'custom:bruno-activity-column', slots: [] },
  });
  hass.states['binary_sensor.home_activity_media'] =
    S('binary_sensor.home_activity_media', rodando ? 'on' : 'off');
  alvo.hass = { ...hass, states: { ...hass.states } };
  await alvo.updateComplete;
  await new Promise((ok) => setTimeout(ok, 400));
  await alvo.updateComplete;

  const r = alvo.renderRoot;
  const cx = (el) => { if (!el) return null; const b = el.getBoundingClientRect();
    return { topo: +b.top.toFixed(1), base: +b.bottom.toFixed(1), alt: +b.height.toFixed(1) }; };
  const filete = document.querySelector('.rail-slot').getBoundingClientRect().top;
  const slot = document.getElementById('slot');

  return {
    viewport: document.querySelector(".shell").getBoundingClientRect().height,
    fileteDaRail: +filete.toFixed(1),
    slotRola: slot.scrollHeight > slot.clientHeight + 1,
    sobra: +(slot.scrollHeight - slot.clientHeight).toFixed(1),
    hero: cx(document.querySelector('.hero')),
    pager: cx(r.querySelector('.pager')),
    favoritos: cx(r.querySelector('.favoritos')),
    agenda: cx(r.querySelector('.agenda')),
    wifi: cx(r.querySelector('.wifi')),
    cenas: cx(r.querySelector('.cenas')),
    emExecucao: cx(r.querySelector('.titulo.is-rodando')),
    folgaAteFilete: +(filete - (r.querySelector('.favoritos')?.getBoundingClientRect().bottom ?? 0)).toFixed(1),
    agendaIgualWifi: Math.abs((cx(r.querySelector('.agenda'))?.alt ?? 0) -
                              (cx(r.querySelector('.wifi'))?.alt ?? 0)) < 0.6,
  };
};

(async () => {
  await customElements.whenDefined('bruno-home-phone');
  const normal = await window.medir({ rodando: false });
  document.getElementById('relatorio').textContent = JSON.stringify(normal, null, 1);
  window.RESULTADO = normal;
})();
</script>
</body>
</html>
`;

writeFileSync(SAIDA, html);
console.log(`gerado: ${SAIDA}  (bundle: ${bundle})`);
