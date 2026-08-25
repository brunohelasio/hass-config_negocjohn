// Banco de medicao da subview de CAMERAS no telefone.
//
// Reproduz a geometria real da shell em modo telefone:
//   grid de uma coluna, content-slot (1fr, overflow-y auto, padding 10/10/6)
//   e rail-slot na base. A secao ativa recebe height: 100% por
//   ".content-slot > *", exatamente como na shell.
//
// O criterio de aceite da rodada e ZERO SCROLL VERTICAL, entao o que este
// banco mede e: scrollHeight contra clientHeight do slot e do root, em cinco
// viewports, nos dois cenarios de selecao (Sala e Office).
//
//   node scripts/harness/gen-cameras-phone-harness.mjs
//   node scripts/harness/serve-harness.mjs scripts/harness/cameras-phone.html 8206
import { writeFileSync, readdirSync, statSync } from 'node:fs';

const bundle = readdirSync('config/www/dashboard')
  .filter((f) => /^bruno-dashboard\..*\.js$/.test(f))
  .sort((a, b) => statSync('config/www/dashboard/' + b).mtimeMs - statSync('config/www/dashboard/' + a).mtimeMs)[0];

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cameras phone — banco</title>
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; height: 100%; background: #0b0f16; }
  .shell {
    height: 100dvh; display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
  }
  .content-slot {
    grid-column: 1; grid-row: 1;
    position: relative; min-width: 0; min-height: 0;
    overflow-y: auto; overflow-anchor: none;
    padding: 10px 10px 6px;
  }
  .content-slot > * { display: block; height: 100%; min-width: 0; min-height: 0; }
  .rail-slot { height: 58.4px; background: rgba(255,255,255,0.06); border-top: 1px solid rgba(255,255,255,0.1); }
</style>
</head>
<body>
<div class="shell">
  <div class="content-slot" id="slot"></div>
  <div class="rail-slot"></div>
</div>
<script type="module" src="/local/dashboard/${bundle}"></script>
<script src="/local/bruno-ui/core/bruno-icons.js"></script>
<script src="/local/bruno-ui/core/bruno-liquid-glass.js"></script>
<script src="/local/bruno-ui/core/bruno-visionos.js"></script>
<script src="/local/bruno-ui/core/bruno-josh.js"></script>
<script src="/local/bruno-ui/subviews/bruno-cameras-security-subview.js"></script>
<script>
  const CAMS = [
    ['camera.sl_camera_profile_1','Sala','social','sl'],
    ['camera.vr_camera_profile_1','Varanda','social','vr'],
    ['camera.cz_camera_profile_1','Cozinha','social','cz'],
    ['camera.as_camera_profile_1','Área de Serviço','social','as'],
    ['camera.of_camera_profile_1','Office','intimate','of'],
    ['camera.camera_quarto_casal_profile_1','Quarto Casal','intimate','qc'],
    ['camera.qmi_camera_profile_1','Quarto Filho','intimate','qmi'],
    ['camera.qma_camera_profile_1','Quarto Filha','intimate','qma'],
  ];
  const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  function montarHass(ativo) {
    const states = {
      'input_select.bento_active_camera': { state: ativo, attributes: {} },
    };
    for (const [id, nome, , pref] of CAMS) {
      states[id] = { state: 'idle', attributes: { entity_picture: PIXEL, friendly_name: nome } };
      for (const s of ['deteccao_de_som', 'alarme_de_movimento', 'modo_de_privacidade']) {
        states['switch.' + pref + '_camera_' + s] = { state: 'off', attributes: {} };
      }
      states['bruno_tuya_motion.' + pref + '_camera_2'] = { state: 'idle', attributes: {} };
    }
    return { states, callService: () => {}, callWS: () => Promise.resolve({}) };
  }

  let el = null;
  window.montar = (ativo) => {
    const slot = document.getElementById('slot');
    slot.innerHTML = '';
    el = document.createElement('bruno-cameras-security-subview');
    el.setConfig({});
    slot.appendChild(el);
    el.hass = montarHass(ativo || 'camera.sl_camera_profile_1');
    return true;
  };

  window.medir = () => {
    const slot = document.getElementById('slot');
    const raiz = el.shadowRoot.querySelector('.security-subview');
    const q = (s) => el.shadowRoot.querySelector(s);
    const grade = (k) => [...el.shadowRoot.querySelectorAll('[data-camera-group-grid="' + k + '"] .camera-tile')];
    const cx = (n) => (n ? Math.round(n.getBoundingClientRect().height) : null);
    const nomes = (k) => grade(k).map((t) => t.getAttribute('aria-label'));
    const tam = (k) => grade(k).map((t) => {
      const r = t.getBoundingClientRect();
      return Math.round(r.width) + 'x' + Math.round(r.height);
    });
    return {
      viewport: innerWidth + 'x' + innerHeight,
      slot: { client: slot.clientHeight, scroll: slot.scrollHeight, rola: slot.scrollHeight > slot.clientHeight + 1 },
      root: { client: raiz.clientHeight, scroll: raiz.scrollHeight, rola: raiz.scrollHeight > raiz.clientHeight + 1 },
      pagina: { rola: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1 },
      alturas: {
        head: cx(q('.cameras-phone-head')),
        hero: cx(q('.main-feed')),
        social: cx(q('[data-camera-group="social"]')),
        intima: cx(q('[data-camera-group="intimate"]')),
      },
      principal: q('[data-feed-title]')?.textContent?.trim(),
      social: { nomes: nomes('social'), tam: tam('social') },
      intima: { nomes: nomes('intimate'), tam: tam('intimate') },
      contagens: {
        social: el.shadowRoot.querySelector('[data-camera-group-count="social"]')?.textContent,
        intima: el.shadowRoot.querySelector('[data-camera-group-count="intimate"]')?.textContent,
      },
    };
  };

  window.trocar = (id) => { el._selectCamera(id); return true; };
  window.pronto = true;
</script>
</body>
</html>`;

writeFileSync('scripts/harness/cameras-phone.html', html);
console.log('gerado: scripts/harness/cameras-phone.html  (bundle: ' + bundle + ')');
