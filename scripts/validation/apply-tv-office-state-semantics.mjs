import fs from 'node:fs';

const roomsPath = 'dashboard-src/src/config/rooms.config.ts';
const subviewPath = 'dashboard-src/src/components/rooms/bruno-room-subview.ts';

function replaceOnce(source, before, after, label) {
  const first = source.indexOf(before);
  if (first < 0) throw new Error(`${label}: trecho de origem não encontrado`);
  if (source.indexOf(before, first + before.length) >= 0) {
    throw new Error(`${label}: trecho de origem não é único`);
  }
  return source.slice(0, first) + after + source.slice(first + before.length);
}

function replaceBetween(source, start, end, replacement, label) {
  const first = source.indexOf(start);
  if (first < 0) throw new Error(`${label}: início não encontrado`);
  const last = source.indexOf(end, first + start.length);
  if (last < 0) throw new Error(`${label}: fim não encontrado`);
  return source.slice(0, first) + replacement + source.slice(last);
}

let rooms = fs.readFileSync(roomsPath, 'utf8');
rooms = replaceOnce(
  rooms,
  '/**\n * Configuração central dos cômodos.',
  "import { TV_POWER_ON_STATES } from '@/services/entities/media-state';\n\n/**\n * Configuração central dos cômodos.",
  'rooms/import',
);
rooms = replaceOnce(
  rooms,
  "        states: ['on', 'playing', 'paused', 'idle', 'buffering'] },",
  '        states: TV_POWER_ON_STATES },',
  'rooms/sala-tv-states',
);
rooms = replaceBetween(
  rooms,
  "      // ANTERIOR: entities: ['binary_sensor.office_pc_active', 'switch.macbook']",
  "      { icon: 'mdi:snowflake', label: 'Ar condicionado ativo', tone: 'cyan',",
  `      // O estado cru da sessão NÃO participa deste ponto. O HASS.Agent pode\n      // ficar congelado em "Unlocked" quando perde API/MQTT; usar esse valor\n      // diretamente contorna a proteção temporal já implementada no backend.\n      //\n      // binary_sensor.office_pc_active é a autoridade de "PC ativo": só fica\n      // on quando a sessão está destravada E houve atividade nos últimos 300 s.\n      // A sessão continua disponível na subview como telemetria, não como prova.\n      { icon: 'mdi:desktop-classic', label: 'PC ativo', tone: 'purple',\n        entities: ['binary_sensor.office_pc_active'], states: ['on'] },\n`,
  'rooms/office-pc-dot',
);
fs.writeFileSync(roomsPath, rooms);

let subview = fs.readFileSync(subviewPath, 'utf8');
subview = replaceOnce(
  subview,
  "import { spotifyTocandoEm } from '@/services/entities/spotify-device';",
  "import { spotifyTocandoEm } from '@/services/entities/spotify-device';\nimport { isMediaPlaying, isTvPowered } from '@/services/entities/media-state';",
  'subview/import',
);
subview = replaceOnce(
  subview,
  "/** Estados que contam como \"ligado\" em cada domínio — copiados dos originais. */\nconst ESTADOS_TV_LIGADA = ['on', 'playing', 'paused', 'idle'];\nconst ESTADOS_MIDIA_LIGADA = ['playing', 'paused', 'on', 'idle'];",
  "/** Estados que contam como \"ligado\" nos domínios ainda locais deste componente. */\nconst ESTADOS_MIDIA_LIGADA = ['playing', 'paused', 'on', 'idle'];",
  'subview/remove-local-tv-states',
);
subview = replaceBetween(
  subview,
  '  private _modeloTv() {',
  '  private _modeloSpotify() {',
  `  private _modeloTv() {\n    const id = this._idDe('tv');\n    const st = this._estado(id);\n    const a = st?.attributes ?? {};\n    const estado = st?.state ?? 'off';\n    // Energia e reprodução são conceitos diferentes. Idle/paused continuam\n    // significando TV ligada; apenas playing/buffering significam reprodução.\n    const ativo = isTvPowered(this._hass, id);\n    const reproduzindo = isMediaPlaying(this._hass, id);\n    const fonte = String(a['source'] ?? a['app_name'] ?? '') || 'HDMI 1';\n    const titulo = String(a['media_title'] ?? a['media_series_title'] ?? a['app_name'] ?? '');\n    return {\n      st,\n      estado,\n      ativo,\n      reproduzindo,\n      fonte,\n      titulo,\n      volume: a['volume_level'] != null ? Math.round(Number(a['volume_level']) * 100) : null,\n      poster: String(a['entity_picture'] ?? a['media_image_url'] ?? ''),\n    };\n  }\n\n`,
  'subview/modelo-tv',
);
subview = replaceOnce(
  subview,
  "      ? { chave: 'pc', rotulo: 'PC', icone: 'mdi:desktop-tower', ativo: Boolean(pc?.ativo),\n          resumo: pc?.ativo ? 'Ligado' : 'Desligado', atmosfera: '', corpo: () => this._corpoPc() }",
  "      ? { chave: 'pc', rotulo: 'PC', icone: 'mdi:desktop-tower', ativo: Boolean(pc?.ativo), tocando: Boolean(pc?.ativo),\n          resumo: pc?.ativo ? 'Ligado' : 'Desligado', atmosfera: '', corpo: () => this._corpoPc() }",
  'subview/hub-pc',
);
subview = replaceOnce(
  subview,
  "          ativo: Boolean(tv?.ativo), resumo: tv?.ativo ? `Ligada · ${tv.fonte}` : 'Desligada',\n          atmosfera: tv?.ativo ? tv.poster : '', corpo: () => this._corpoTv() };",
  "          ativo: Boolean(tv?.ativo), tocando: Boolean(tv?.reproduzindo),\n          resumo: tv?.ativo ? `Ligada · ${tv.fonte}` : 'Desligada',\n          atmosfera: tv?.ativo ? tv.poster : '', corpo: () => this._corpoTv() };",
  'subview/hub-tv',
);
subview = replaceOnce(
  subview,
  "      { chave: 'spotify', rotulo: 'Spotify', icone: 'mdi:spotify', ativo: sp.ativo,\n        resumo: sp.ativo ? sp.titulo : 'Nenhuma faixa', atmosfera: sp.ativo ? sp.capa : '',",
  "      { chave: 'spotify', rotulo: 'Spotify', icone: 'mdi:spotify', ativo: sp.ativo, tocando: sp.tocando,\n        resumo: sp.ativo ? sp.titulo : 'Nenhuma faixa', atmosfera: sp.ativo ? sp.capa : '',",
  'subview/hub-spotify',
);
subview = replaceOnce(
  subview,
  "    const tocando = fontes.find((f) => f.chave === aberta)?.ativo;",
  "    const tocando = fontes.find((f) => f.chave === aberta)?.tocando;",
  'subview/hub-playing',
);
fs.writeFileSync(subviewPath, subview);

console.log('TV/Office state semantics applied with guarded replacements.');
