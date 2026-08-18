import fs from 'node:fs';

const mode = process.argv[2] ?? 'patch';
const tilePath = 'dashboard-src/src/components/rooms/bruno-room-tile.ts';
const configPath = 'config/configuration.yaml';

function replaceOnce(text, from, to, label) {
  const first = text.indexOf(from);
  if (first < 0) throw new Error(`${label}: trecho esperado nao encontrado`);
  if (text.indexOf(from, first + from.length) >= 0) {
    throw new Error(`${label}: trecho apareceu mais de uma vez`);
  }
  return text.slice(0, first) + to + text.slice(first + from.length);
}

if (mode === 'patch') {
  let tile = fs.readFileSync(tilePath, 'utf8');

  const transition = '      transition: opacity 420ms ease, filter 420ms ease;\n';
  const cssPatch = transition
    + '      /* Long-press iOS: impede o callout nativo da imagem sem interferir\n'
    + '         no hold customizado do botao do comodo. Importado da rodada\n'
    + '         Sonnet de 2026-08-17, unico ajuste validado fisicamente. */\n'
    + '      -webkit-touch-callout: none;\n'
    + '      -webkit-user-drag: none;\n'
    + '      -webkit-user-select: none;\n'
    + '      user-select: none;\n';
  tile = replaceOnce(tile, transition, cssPatch, 'CSS long-press');

  const tick = String.fromCharCode(96);
  const offOld = '? html' + tick + '<img class="room-asset room-asset-off" src=${off} alt="" decoding="async" />' + tick;
  const offNew = '? html' + tick + '<img class="room-asset room-asset-off" src=${off} alt="" decoding="async" draggable="false" />' + tick;
  const onOld = '? html' + tick + '<img class="room-asset room-asset-on" src=${onImg} alt="" decoding="async" />' + tick;
  const onNew = '? html' + tick + '<img class="room-asset room-asset-on" src=${onImg} alt="" decoding="async" draggable="false" />' + tick;

  tile = replaceOnce(tile, offOld, offNew, 'img off draggable');
  tile = replaceOnce(tile, onOld, onNew, 'img on draggable');
  fs.writeFileSync(tilePath, tile);
  console.log('Long-press validado importado em bruno-room-tile.ts');
  process.exit(0);
}

if (mode === 'bundle') {
  const manifestPath = 'config/www/dashboard/manifest.json';
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const bundle = String(manifest.bundle ?? '');
  if (!/^bruno-dashboard\.[A-Za-z0-9_-]+\.js$/.test(bundle)) {
    throw new Error(`bundle invalido no manifesto: ${bundle}`);
  }

  let config = fs.readFileSync(configPath, 'utf8');
  const activeRe = /^    - \/local\/dashboard\/bruno-dashboard\.[A-Za-z0-9_-]+\.js$/m;
  const active = config.match(activeRe)?.[0];
  if (!active) throw new Error('referencia ativa do dashboard nao encontrada');
  const next = `    - /local/dashboard/${bundle}`;
  if (active !== next) {
    const previous = active.trim();
    config = config.replace(
      activeRe,
      `    # ANTERIOR (rollback import long-press Sonnet): ${previous}\n${next}`,
    );
    fs.writeFileSync(configPath, config);
    console.log(`${previous} -> ${next.trim()}`);
  } else {
    console.log(`configuration.yaml ja aponta para ${bundle}`);
  }
  process.exit(0);
}

throw new Error(`modo desconhecido: ${mode}`);
