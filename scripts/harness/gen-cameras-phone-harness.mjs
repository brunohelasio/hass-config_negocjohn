// Banco de medicao da subview de CAMERAS no telefone — DENTRO DA SHELL REAL.
//
// ANTERIOR (2026-08-25, insuficiente): este banco reproduzia o content-slot a
// mao, com "height: 100%" escrito por mim no filho. Aprovou um layout que no
// aparelho colapsou: a composicao ficou com altura de conteudo e as faixas
// fracionarias foram a zero. A cadeia que decide se "height: 100%" resolve e a
// que a SHELL cria, e ela nao estava aqui.
//
// Agora a shell e a de verdade: bruno-shell com setConfig, secao criada por
// helpers.createCardElement, rail real na base.
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
<title>Cameras phone — shell real</title>
<style>
  html, body { margin: 0; padding: 0; height: 100%; background: #0d0f14; }
  bruno-shell { display: block; height: 100%; }
</style>
</head>
<body>
<script type="module" src="/local/dashboard/${bundle}"></script>
<script src="/local/bruno-ui/core/bruno-icons.js"></script>
<script src="/local/bruno-ui/core/bruno-liquid-glass.js"></script>
<script src="/local/bruno-ui/core/bruno-visionos.js"></script>
<script src="/local/bruno-ui/core/bruno-josh.js"></script>
<script src="/local/bento-sidebar-card.js"></script>
<script src="/local/bruno-ui/subviews/bruno-cameras-security-subview.js"></script>
<script src="/local/bruno-ui/core/bruno-shell.js"></script>
<script>
  const CAMS = [
    ['camera.sl_camera_profile_1','Sala','sl'],
    ['camera.vr_camera_profile_1','Varanda','vr'],
    ['camera.cz_camera_profile_1','Cozinha','cz'],
    ['camera.as_camera_profile_1','Área de Serviço','as'],
    ['camera.of_camera_profile_1','Office','of'],
    ['camera.camera_quarto_casal_profile_1','Quarto Casal','qc'],
    ['camera.qmi_camera_profile_1','Quarto Filho','qmi'],
    ['camera.qma_camera_profile_1','Quarto Filha','qma'],
  ];
  const PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  function montarHass(ativo) {
    const states = { 'input_select.bento_active_camera': { state: ativo, attributes: {} } };
    for (const [id, nome, pref] of CAMS) {
      states[id] = { state: 'idle', attributes: { entity_picture: PIXEL, friendly_name: nome } };
      for (const s of ['deteccao_de_som', 'alarme_de_movimento', 'modo_de_privacidade']) {
        states['switch.' + pref + '_camera_' + s] = { state: 'off', attributes: {} };
      }
      states['bruno_tuya_motion.' + pref + '_camera_2'] = { state: 'idle', attributes: {} };
    }
    return { states, callService: () => {}, callWS: () => Promise.resolve({}), themes: {} };
  }

  // Mesmo caminho que a shell usa: createCardElement + setConfig.
  globalThis.loadCardHelpers = async () => ({
    createCardElement: (config) => {
      const tag = String(config.type || '').replace(/^custom:/, '');
      const el = document.createElement(tag);
      if (typeof el.setConfig === 'function') el.setConfig(config);
      return el;
    },
  });

  window.montar = async (ativo) => {
    document.querySelectorAll('bruno-shell').forEach((n) => n.remove());
    location.hash = 'cameras';
    const shell = document.createElement('bruno-shell');
    shell.setConfig({
      default_section: 'cameras',
      rails: { main: { type: 'custom:bento-sidebar-liquid-card', top_items: [
        { key: 'home', icon: 'home', label: 'Home' },
        { key: 'cameras', icon: 'cameras', label: 'Câmeras' },
      ], bottom_items: [] } },
      default_rail: 'main',
      sections: { cameras: { type: 'custom:bruno-cameras-security-subview' } },
    });
    document.body.appendChild(shell);
    shell.hass = montarHass(ativo || 'camera.sl_camera_profile_1');
    await new Promise((ok) => setTimeout(ok, 800));
    window._shell = shell;
    const sub = shell.shadowRoot.querySelector('bruno-cameras-security-subview');
    if (sub) { sub.hass = montarHass(ativo || 'camera.sl_camera_profile_1'); }
    window._sub = sub;
    await new Promise((ok) => setTimeout(ok, 250));
    return Boolean(sub);
  };

  window.medir = () => {
    const shell = window._shell, el = window._sub;
    if (!el) return { erro: 'subview nao montada' };
    const slot = shell.shadowRoot.querySelector('.content-slot');
    const raiz = el.shadowRoot.querySelector('.security-subview');
    const q = (s) => el.shadowRoot.querySelector(s);
    const grade = (k) => [...el.shadowRoot.querySelectorAll('[data-camera-group-grid="' + k + '"] .camera-tile')];
    const cx = (n) => (n ? Math.round(n.getBoundingClientRect().height) : null);
    const tam = (k) => grade(k).map((t) => { const r = t.getBoundingClientRect(); return Math.round(r.width) + 'x' + Math.round(r.height); });
    return {
      viewport: innerWidth + 'x' + innerHeight,
      host: { h: Math.round(el.getBoundingClientRect().height), css: getComputedStyle(el).height },
      slot: { client: slot.clientHeight, scroll: slot.scrollHeight, rola: slot.scrollHeight > slot.clientHeight + 1 },
      root: { client: raiz.clientHeight, scroll: raiz.scrollHeight, rola: raiz.scrollHeight > raiz.clientHeight + 1, css: getComputedStyle(raiz).height, rows: getComputedStyle(raiz).gridTemplateRows },
      pagina: { rola: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1 },
      alturas: { head: cx(q('.cameras-phone-head')), hero: cx(q('.main-feed')), social: cx(q('[data-camera-group="social"]')), intima: cx(q('[data-camera-group="intimate"]')) },
      principal: q('[data-feed-title]')?.textContent?.trim(),
      social: { nomes: grade('social').map((t) => t.getAttribute('aria-label')), tam: tam('social') },
      intima: { nomes: grade('intimate').map((t) => t.getAttribute('aria-label')), tam: tam('intimate') },
      contagens: {
        social: el.shadowRoot.querySelector('[data-camera-group-count="social"]')?.textContent,
        intima: el.shadowRoot.querySelector('[data-camera-group-count="intimate"]')?.textContent,
      },
    };
  };

  window.pronto = true;
</script>
</body>
</html>`;

writeFileSync('scripts/harness/cameras-phone.html', html);
console.log('gerado: scripts/harness/cameras-phone.html  (bundle: ' + bundle + ')');
