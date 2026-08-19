import fs from 'node:fs';

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

function write(path, content) {
  fs.writeFileSync(path, content, 'utf8');
}

function replaceOnce(content, before, after, label) {
  const count = content.split(before).length - 1;
  if (count !== 1) throw new Error(`${label}: esperado 1 trecho, encontrado ${count}`);
  return content.replace(before, after);
}

function replaceRegexOnce(content, regex, after, label) {
  const matches = content.match(regex);
  if (!matches || matches.length !== 1) throw new Error(`${label}: regex nao encontrou exatamente 1 trecho`);
  return content.replace(regex, after);
}

// 1) Entrypoint: instala somente o guard de long-press validado no iPhone.
{
  const path = 'dashboard-src/src/main.ts';
  let s = read(path);
  s = replaceOnce(
    s,
    "import './components/rooms/bruno-room-subview';\n",
    "import './components/rooms/bruno-room-subview';\nimport { installRoomTileIosLongPressGuard } from './services/ui/ios-longpress-guard';\ninstallRoomTileIosLongPressGuard();\n",
    'main: ios longpress guard',
  );
  s = s.replace('Enquanto a migraÃ§Ã£o acontece, este bundle CONVIVE com os 52 mÃ³dulos clÃ¡ssicos', 'Enquanto a migraÃ§Ã£o acontece, este bundle convive apenas com os mÃ³dulos clÃ¡ssicos ainda ativos');
  write(path, s);
}

// 2) Subview unificada: TV com energia/reproducao separadas, metadados estaveis,
// Spotify/HA service data correto e cortina sem conclusao prematura.
{
  const path = 'dashboard-src/src/components/rooms/bruno-room-subview.ts';
  let s = read(path);

  s = replaceOnce(
    s,
    "import { spotifyTocandoEm } from '@/services/entities/spotify-device';\n",
    "import { spotifyTocandoEm } from '@/services/entities/spotify-device';\nimport { isMediaPlaying, isTvPowered, isTvPoweredStable } from '@/services/entities/media-state';\nimport { callHaService } from '@/services/home-assistant/service-call';\n",
    'subview: imports media/service',
  );

  s = s.replace("const ESTADOS_TV_LIGADA = ['on', 'playing', 'paused', 'idle'];\n", '');
  s = s.replace('const CORTINA_GRAÇA_CONFIRMACAO_MS = 1_800;\n', '');

  s = replaceOnce(
    s,
    "  private _menuMidiaAberto = false;\n  private _spotifyFerramentas = false;\n",
    "  private _menuMidiaAberto = false;\n  /** Ultimos metadados validos da TV, preservados somente durante OFF transitorio. */\n  private _tvMemoria: { fonte: string; titulo: string; volume: number | null; poster: string } | undefined;\n  private _spotifyFerramentas = false;\n",
    'subview: memoria tv',
  );

  s = replaceOnce(
    s,
    `  private _servico(dominio: string, servico: string, dados: Record<string, unknown>): void {\n    if (!this._hass) return;\n    // ANTERIOR (rollback): o objeto inteiro também era enviado como target.\n    // Assim volume_level/delay/force_activate_device viravam chaves inválidas\n    // de target. O target recebe só entity_id; o restante permanece service data.\n    const { entity_id: entityId, ...serviceData } = dados;\n    const alvo = typeof entityId === 'string' && entityId ? { entity_id: entityId } : undefined;\n    this._hass.callService(dominio, servico, serviceData, alvo);\n  }\n`,
    `  private _servico(dominio: string, servico: string, dados: Record<string, unknown>): void {\n    if (!this._hass) return;\n    // O frontend oficial e as integracoes validam entity_id dentro do serviceData.\n    // Separar entity_id em target quebrou play/pause/volume do SpotifyPlus.\n    void callHaService(this._hass, dominio, servico, dados);\n  }\n`,
    'subview: service data',
  );

  s = replaceRegexOnce(
    s,
    /  private _modeloTv\(\) \{[\s\S]*?\n  \}\n\n  private _modeloSpotify\(\) \{/,
    `  private _modeloTv() {\n    const id = this._idDe('tv');\n    const st = this._estado(id);\n    const a = st?.attributes ?? {};\n    const estado = String(st?.state ?? 'off').toLowerCase();\n    const ativoBruto = isTvPowered(this._hass, id);\n    const ativo = isTvPoweredStable(this._hass, id, Date.now(), 45_000);\n    const reproduzindo = isMediaPlaying(this._hass, id);\n\n    const atual = {\n      fonte: String(a['source'] ?? a['app_name'] ?? '') || 'HDMI 1',\n      titulo: String(a['media_title'] ?? a['media_series_title'] ?? a['app_name'] ?? ''),\n      volume: a['volume_level'] != null ? Math.round(Number(a['volume_level']) * 100) : null,\n      poster: String(a['entity_picture'] ?? a['media_image_url'] ?? ''),\n    };\n\n    if (ativoBruto) this._tvMemoria = atual;\n    else if (!ativo) this._tvMemoria = undefined;\n\n    // Durante o OFF espurio, a energia continua ligada pela histerese e os\n    // metadados nao somem do Hub. Fora da janela, a memoria e descartada.\n    const visual = ativo && !ativoBruto && this._tvMemoria ? this._tvMemoria : atual;\n    return {\n      st,\n      estado,\n      ativo,\n      reproduzindo,\n      ...visual,\n    };\n  }\n\n  private _modeloSpotify() {`,
    'subview: modelo tv',
  );

  s = replaceOnce(
    s,
    "      ? { chave: 'pc', rotulo: 'PC', icone: 'mdi:desktop-tower', ativo: Boolean(pc?.ativo),\n          resumo: pc?.ativo ? 'Ligado' : 'Desligado', atmosfera: '', corpo: () => this._corpoPc() }\n",
    "      ? { chave: 'pc', rotulo: 'PC', icone: 'mdi:desktop-tower', ativo: Boolean(pc?.ativo), tocando: Boolean(pc?.ativo),\n          resumo: pc?.ativo ? 'Ligado' : 'Desligado', atmosfera: '', corpo: () => this._corpoPc() }\n",
    'subview: pc tocando',
  );
  s = replaceOnce(
    s,
    "      : { chave: 'tv', rotulo: this._room?.id === 'sala' ? 'TV da sala' : 'TV', icone: 'mdi:television-classic',\n          ativo: Boolean(tv?.ativo), resumo: tv?.ativo ? `Ligada · ${tv.fonte}` : 'Desligada',\n          atmosfera: tv?.ativo ? tv.poster : '', corpo: () => this._corpoTv() };\n",
    "      : { chave: 'tv', rotulo: this._room?.id === 'sala' ? 'TV da sala' : 'TV', icone: 'mdi:television-classic',\n          ativo: Boolean(tv?.ativo), tocando: Boolean(tv?.reproduzindo),\n          resumo: tv?.ativo ? `Ligada · ${tv.fonte}` : 'Desligada',\n          atmosfera: tv?.ativo ? tv.poster : '', corpo: () => this._corpoTv() };\n",
    'subview: tv tocando',
  );
  s = replaceOnce(
    s,
    "      { chave: 'spotify', rotulo: 'Spotify', icone: 'mdi:spotify', ativo: sp.ativo,\n        resumo: sp.ativo ? sp.titulo : 'Nenhuma faixa', atmosfera: sp.ativo ? sp.capa : '',\n",
    "      { chave: 'spotify', rotulo: 'Spotify', icone: 'mdi:spotify', ativo: sp.ativo, tocando: sp.tocando,\n        resumo: sp.ativo ? sp.titulo : 'Nenhuma faixa', atmosfera: sp.ativo ? sp.capa : '',\n",
    'subview: spotify tocando',
  );
  s = replaceOnce(
    s,
    "    const tocando = fontes.find((f) => f.chave === aberta)?.ativo;\n",
    "    const tocando = fontes.find((f) => f.chave === aberta)?.tocando;\n",
    'subview: classe playing',
  );

  s = replaceRegexOnce(
    s,
    /\n    \/\/ Um extremo publicado enquanto o cover ainda declara opening\/closing[\s\S]*?\n    \}\n\n    const fisicoIntermediario/,
    `\n    // Nao conclui o movimento apenas porque o helper/cover saltou cedo para o\n    // alvo. O alvo visual so pode ser aceito quando a duracao fisica estimada\n    // daquele percurso terminou; ate la a UI continua interpolando.\n\n    const fisicoIntermediario`,
    'subview: remove curtain early finish',
  );

  write(path, s);
}

// 3) Tile unificado: dot da TV usa a mesma histerese; Office nao usa sessao HASS.Agent congelada.
{
  const cfgPath = 'dashboard-src/src/config/rooms.config.ts';
  let c = read(cfgPath);
  c = replaceOnce(
    c,
    "  spotifyDevice?: string;\n}\n",
    "  spotifyDevice?: string;\n  /** Usa a semantica central de energia da TV com histerese de OFF transitorio. */\n  stableTvPower?: boolean;\n}\n",
    'rooms: stableTvPower interface',
  );
  c = replaceOnce(
    c,
    "        entities: ['media_player.android_tv_192_168_3_17'],\n        states: ['on', 'playing', 'paused', 'idle', 'buffering'] },\n",
    "        entities: ['media_player.android_tv_192_168_3_17'],\n        states: ['on', 'playing', 'paused', 'idle', 'buffering'], stableTvPower: true },\n",
    'rooms: sala tv stable flag',
  );
  c = replaceRegexOnce(
    c,
    /      \/\/ ANTERIOR: entities: \['binary_sensor\.office_pc_active', 'switch\.macbook'\][\s\S]*?      \{ icon: 'mdi:desktop-classic', label: 'PC ativo', tone: 'purple',\n        entities: \[\n          'binary_sensor\.office_pc_active',\n          'sensor\.desktop_melg9vv_office_pc_session_state',\n        \],\n        states: \['on', 'unlocked'\] \},/,
    `      // A sessao do HASS.Agent pode congelar em "unlocked" quando o agente\n      // perde API/MQTT. O dot usa somente o sensor supervisionado do Office.\n      { icon: 'mdi:desktop-classic', label: 'PC ativo', tone: 'purple',\n        entities: ['binary_sensor.office_pc_active'], states: ['on'] },`,
    'rooms: office pc dot',
  );
  write(cfgPath, c);

  const tilePath = 'dashboard-src/src/components/rooms/bruno-room-tile.ts';
  let t = read(tilePath);
  t = replaceOnce(
    t,
    "import { spotifyTocandoEm } from '@/services/entities/spotify-device';\n",
    "import { spotifyTocandoEm } from '@/services/entities/spotify-device';\nimport { isTvPoweredStable } from '@/services/entities/media-state';\n",
    'tile: import tv state',
  );
  t = replaceOnce(
    t,
    `      const porEntidade = (d.entities ?? []).some((id) => {\n        const e = hass.states[id];\n        return Boolean(e) && estados.includes(String(e?.state ?? '').toLowerCase());\n      });\n`,
    `      const porEntidade = (d.entities ?? []).some((id) => {\n        if (d.stableTvPower) return isTvPoweredStable(hass, id, Date.now(), 45_000);\n        const e = hass.states[id];\n        return Boolean(e) && estados.includes(String(e?.state ?? '').toLowerCase());\n      });\n`,
    'tile: stable tv dot',
  );
  write(tilePath, t);
}

// 4) Remove a referencia morta media_player.atv do contrato da Sala.
{
  const path = 'dashboard-src/src/config/subviews.config.ts';
  let s = read(path);
  s = replaceOnce(s, "      tvRemotePlayer: 'media_player.atv',\n", '', 'subviews: remove tvRemotePlayer');
  write(path, s);
}

// 5) Sala especial do telefone: a TV nao pisca OFF durante a mesma janela de 45 s.
{
  const path = 'config/www/bruno-ui/cards/bruno-sala-card.js';
  let s = read(path);
  s = replaceOnce(
    s,
    "const BRUNO_SALA_TV_ANIMATION_MS = 950;\n",
    "const BRUNO_SALA_TV_ANIMATION_MS = 950;\nconst BRUNO_SALA_TV_OFF_GRACE_MS = 45_000;\n",
    'sala-card: grace constant',
  );
  s = replaceOnce(
    s,
    "    this._hybridTransitionToken = 0;\n",
    "    this._hybridTransitionToken = 0;\n    this._tvLastPoweredAt = 0;\n",
    'sala-card: last powered field',
  );
  s = replaceOnce(
    s,
    `  _isAnyState(entityId, states) {\n    return states.includes(this._state(entityId)?.state || '');\n  }\n`,
    `  _isAnyState(entityId, states) {\n    return states.includes(this._state(entityId)?.state || '');\n  }\n\n  _tvPoweredStable(entityId) {\n    const state = String(this._state(entityId)?.state || '').toLowerCase();\n    if (BRUNO_SALA_TV_ON_STATES.includes(state)) {\n      this._tvLastPoweredAt = Date.now();\n      return true;\n    }\n    if (state !== 'off') return false;\n    return this._tvLastPoweredAt > 0 && Date.now() - this._tvLastPoweredAt <= BRUNO_SALA_TV_OFF_GRACE_MS;\n  }\n`,
    'sala-card: tv stable helper',
  );
  s = replaceOnce(
    s,
    "    const tvOn = BRUNO_SALA_TV_ON_STATES.includes(tv?.state || '');\n",
    "    const tvOn = this._tvPoweredStable(entities.tv);\n",
    'sala-card: stable tv use',
  );
  write(path, s);
}

// 6) Phone: os seis cards comuns passam para o mesmo bruno-room-tile do desktop.
{
  const path = 'config/dashboards/shared/grid-cards/bento_comodos_matriz.yaml';
  let s = read(path);
  const old = `cards:\n  - !include ../../views/main-grid/bento_office.yaml\n  - !include ../../views/main-grid/bento_cozinha.yaml\n  - !include ../../views/main-grid/bento_lavabo.yaml\n  - !include ../../views/main-grid/bento_quarto_casal.yaml\n`;
  const neu = `cards:\n  # 2026-08-19: telefone e desktop usam o MESMO componente de comodo.\n  # Os wrappers JS classicos ficam apenas no historico Git e deixam de carregar.\n  - type: custom:bruno-room-tile\n    room: office\n  - type: custom:bruno-room-tile\n    room: cozinha\n  - type: custom:bruno-room-tile\n    room: lavabo\n  - type: custom:bruno-room-tile\n    room: casal\n`;
  s = replaceOnce(s, old, neu, 'phone matrix: first four room tiles');
  s = replaceOnce(
    s,
    "  - !include ../../views/main-grid/bento_quarto_marina.yaml\n  - !include ../../views/main-grid/bento_quarto_miguel.yaml\n",
    "  - type: custom:bruno-room-tile\n    room: marina\n  - type: custom:bruno-room-tile\n    room: miguel\n",
    'phone matrix: last room tiles',
  );
  write(path, s);
}

// 7) Runtime: para de baixar modulos que nao possuem mais nenhum entrypoint ativo.
{
  const path = 'config/configuration.yaml';
  let s = read(path);
  const obsolete = [
    'bruno-mobile-card-frame.js',
    'bruno-mobile-nav-card.js',
    'bruno-mobile-rooms-card.js',
    'bruno-mobile-sala-card.js',
    'bruno-mobile-cameras-list-card.js',
    'bruno-sala-room-card.js',
    'bruno-office-card.js',
    'bruno-cozinha-card.js',
    'bruno-lavabo-card.js',
    'bruno-corredor-card.js',
    'bruno-quarto-casal-card.js',
    'bruno-quarto-marina-card.js',
    'bruno-quarto-miguel-card.js',
  ];
  for (const file of obsolete) {
    const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const re = new RegExp(`^(\\s*)- (/local/bruno-ui/cards/${escaped}[^\\n]*)$`, 'm');
    const match = s.match(re);
    if (!match) throw new Error(`configuration: linha ativa nao encontrada para ${file}`);
    s = s.replace(re, `$1# RETIRADO runtime 2026-08-19: - $2`);
  }
  write(path, s);
}

// 8) Testes novos para os contratos que causaram as regressões.
{
  const mediaTest = `import { beforeEach, describe, expect, it } from 'vitest';\nimport type { Hass } from '@/models/home-assistant';\nimport {\n  isMediaPlaying,\n  isTvPowered,\n  isTvPoweredStable,\n  resetTvPowerStabilityForTests,\n} from './media-state';\n\nfunction hass(state: string): Hass {\n  return { states: { 'media_player.tv': { state, attributes: {} } } } as unknown as Hass;\n}\n\ndescribe('media-state', () => {\n  beforeEach(() => resetTvPowerStabilityForTests());\n\n  it('separa energia de reproducao', () => {\n    expect(isTvPowered(hass('idle'), 'media_player.tv')).toBe(true);\n    expect(isMediaPlaying(hass('idle'), 'media_player.tv')).toBe(false);\n    expect(isMediaPlaying(hass('playing'), 'media_player.tv')).toBe(true);\n  });\n\n  it('segura somente off transitorio da entidade primaria', () => {\n    expect(isTvPoweredStable(hass('playing'), 'media_player.tv', 1_000, 45_000)).toBe(true);\n    expect(isTvPoweredStable(hass('off'), 'media_player.tv', 20_000, 45_000)).toBe(true);\n    expect(isTvPoweredStable(hass('off'), 'media_player.tv', 47_000, 45_000)).toBe(false);\n  });\n\n  it('nao mascara unknown ou unavailable', () => {\n    expect(isTvPoweredStable(hass('on'), 'media_player.tv', 1_000, 45_000)).toBe(true);\n    expect(isTvPoweredStable(hass('unavailable'), 'media_player.tv', 2_000, 45_000)).toBe(false);\n    expect(isTvPoweredStable(hass('unknown'), 'media_player.tv', 2_000, 45_000)).toBe(false);\n  });\n});\n`;
  write('dashboard-src/src/services/entities/media-state.test.ts', mediaTest);

  const serviceTest = `import { describe, expect, it, vi } from 'vitest';\nimport type { Hass } from '@/models/home-assistant';\nimport { callHaService } from './service-call';\n\ndescribe('callHaService', () => {\n  it('mantem entity_id e payload juntos no serviceData', async () => {\n    const callService = vi.fn().mockResolvedValue(undefined);\n    const hass = { callService } as unknown as Hass;\n    await callHaService(hass, 'media_player', 'volume_set', {\n      entity_id: 'media_player.spotifyplus_bruno_helasio',\n      volume_level: 0.42,\n    });\n    expect(callService).toHaveBeenCalledTimes(1);\n    expect(callService).toHaveBeenCalledWith('media_player', 'volume_set', {\n      entity_id: 'media_player.spotifyplus_bruno_helasio',\n      volume_level: 0.42,\n    });\n  });\n});\n`;
  write('dashboard-src/src/services/home-assistant/service-call.test.ts', serviceTest);
}

console.log('finalize-runtime-cleanup-20260819: source transforms OK');
