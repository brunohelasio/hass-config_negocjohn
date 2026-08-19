import fs from 'node:fs';

function patch(path, from, to, label) {
  const s = fs.readFileSync(path, 'utf8');
  if (!s.includes(from)) throw new Error(`${label}: trecho esperado não encontrado em ${path}`);
  fs.writeFileSync(path, s.replace(from, to), 'utf8');
}

const subview = 'dashboard-src/src/components/rooms/bruno-room-subview.ts';
const roomTile = 'dashboard-src/src/components/rooms/bruno-room-tile.ts';
const rooms = 'dashboard-src/src/config/rooms.config.ts';
const subviews = 'dashboard-src/src/config/subviews.config.ts';
const mediaState = 'dashboard-src/src/services/entities/media-state.ts';
const mediaTest = 'dashboard-src/src/services/entities/media-state.test.ts';

// 1) Serviços: restaura o contrato usado pelo frontend oficial e pela subview legada.
patch(
  subview,
  "import { isMediaPlaying, isTvPowered } from '@/services/entities/media-state';",
  "import { isEntityInStates, isMediaPlaying, isTvPoweredStable } from '@/services/entities/media-state';\nimport { callHaService } from '@/services/home-assistant/service-call';",
  'imports de mídia/serviço',
);
patch(
  subview,
  `  private _servico(dominio: string, servico: string, dados: Record<string, unknown>): void {\n    if (!this._hass) return;\n    // ANTERIOR (rollback): o objeto inteiro também era enviado como target.\n    // Assim volume_level/delay/force_activate_device viravam chaves inválidas\n    // de target. O target recebe só entity_id; o restante permanece service data.\n    const { entity_id: entityId, ...serviceData } = dados;\n    const alvo = typeof entityId === 'string' && entityId ? { entity_id: entityId } : undefined;\n    this._hass.callService(dominio, servico, serviceData, alvo);\n  }`,
  `  private _servico(dominio: string, servico: string, dados: Record<string, unknown>): void {\n    if (!this._hass) return;\n    // O frontend oficial do HA e a subview legada enviam entity_id dentro de\n    // serviceData. A migração para target quebrou serviços de integrações que\n    // validam o schema dos dados (SpotifyPlus em especial).\n    void callHaService(this._hass, dominio, servico, dados);\n  }`,
  'contrato de callService',
);

// 2) TV: histerese curta para OFF espúrio + Apple TV só como evidência de mídia real.
patch(
  subview,
  `    const st = this._estado(id);\n    const a = st?.attributes ?? {};\n    const estado = st?.state ?? 'off';\n    // Energia e reprodução são conceitos diferentes. Idle/paused continuam\n    // significando TV ligada; apenas playing/buffering significam reprodução.\n    const ativo = isTvPowered(this._hass, id);\n    const reproduzindo = isMediaPlaying(this._hass, id);\n    const fonte = String(a['source'] ?? a['app_name'] ?? '') || 'HDMI 1';\n    const titulo = String(a['media_title'] ?? a['media_series_title'] ?? a['app_name'] ?? '');`,
  `    const primario = this._estado(id);\n    const remotoId = this._idDe('tvRemotePlayer');\n    const remoto = this._estado(remotoId);\n    // O Android TV/ADB desta instalação oscila para off por poucos segundos\n    // mesmo com a tela ligada. Mantemos a última prova positiva por 45 s.\n    // A Apple TV NÃO vira autoridade de energia: só sustenta a sessão quando\n    // publica reprodução/pausa/buffering, evitando o falso positivo de idle/on.\n    const primarioLigado = isTvPoweredStable(this._hass, id, Date.now(), 45_000);\n    const remotoComMidia = isEntityInStates(this._hass, remotoId, ['playing', 'paused', 'buffering']);\n    const ativo = primarioLigado || remotoComMidia;\n    const reproduzindo = isMediaPlaying(this._hass, id) || isMediaPlaying(this._hass, remotoId);\n    const st = remotoComMidia && !primarioLigado ? remoto ?? primario : primario ?? remoto;\n    const a = st?.attributes ?? {};\n    const estado = st?.state ?? 'off';\n    const fonte = String(a['source'] ?? a['app_name'] ?? '') || 'HDMI 1';\n    const titulo = String(a['media_title'] ?? a['media_series_title'] ?? a['app_name'] ?? '');`,
  'modelo de TV estável',
);

// 3) Câmeras: ONVIF continua primário; Varanda/Office podem cair para Tuya quando o profile fica unavailable.
patch(
  subview,
  `interface CameraCfg {\n  entity: string;\n  name?: string;`,
  `interface CameraCfg {\n  entity: string;\n  fallbackEntity?: string;\n  name?: string;`,
  'tipo fallback de câmera',
);
patch(
  subview,
  `  private _cameraViva(cam: CameraCfg): CameraViva {\n    const st = this._estado(cam.entity);\n    const indisponivel = this._indisponivel(st);\n    const online = !indisponivel && ESTADOS_CAMERA_ONLINE.includes(String(st?.state ?? ''));\n\n    const publicada = String(st?.attributes['entity_picture'] ?? '');\n    if (publicada) this._ultimaImagem[cam.entity] = publicada;\n    const base = publicada || this._ultimaImagem[cam.entity] || \`/api/camera_proxy/\${cam.entity}\`;\n\n    return {\n      ...cam,`,
  `  private _cameraViva(cam: CameraCfg): CameraViva {\n    const principal = this._estado(cam.entity);\n    const fallback = cam.fallbackEntity ? this._estado(cam.fallbackEntity) : undefined;\n    const usarFallback = this._indisponivel(principal) && Boolean(cam.fallbackEntity) && !this._indisponivel(fallback);\n    const entity = usarFallback ? String(cam.fallbackEntity) : cam.entity;\n    const st = usarFallback ? fallback : principal;\n    const indisponivel = this._indisponivel(st);\n    const online = !indisponivel && ESTADOS_CAMERA_ONLINE.includes(String(st?.state ?? ''));\n\n    const publicada = String(st?.attributes['entity_picture'] ?? '');\n    if (publicada) this._ultimaImagem[entity] = publicada;\n    const base = publicada || this._ultimaImagem[entity] || \`/api/camera_proxy/\${entity}\`;\n\n    return {\n      ...cam,\n      entity,`,
  'fallback runtime de câmera',
);
patch(subview, `      url: this._urlsCarregadas[cam.entity] ?? base,`, `      url: this._urlsCarregadas[entity] ?? base,`, 'cache da câmera efetiva');
patch(
  subviews,
  `          entity: 'camera.vr_camera_profile_1',\n          name: 'Sala Lateral',`,
  `          entity: 'camera.vr_camera_profile_1',\n          fallbackEntity: 'camera.vr_camera_2',\n          name: 'Sala Lateral',`,
  'fallback Varanda',
);
patch(
  subviews,
  `          entity: 'camera.of_camera_profile_1',\n          name: 'Office',`,
  `          entity: 'camera.of_camera_profile_1',\n          fallbackEntity: 'camera.of_camera_2',\n          name: 'Office',`,
  'fallback Office',
);

// 4) O dot/atalho visual da Sala usa a mesma histerese da subview.
patch(
  rooms,
  `  spotifyDevice?: string;\n}`,
  `  spotifyDevice?: string;\n  /** Mantém o estado ativo por alguns ms após um off transitório da entidade. */\n  offDelayMs?: number;\n}`,
  'RoomDot offDelayMs',
);
patch(
  rooms,
  `        entities: ['media_player.android_tv_192_168_3_17'],\n        states: TV_POWER_ON_STATES },`,
  `        entities: ['media_player.android_tv_192_168_3_17'],\n        states: TV_POWER_ON_STATES, offDelayMs: 45_000 },`,
  'delay do dot da TV',
);
patch(
  roomTile,
  `import { spotifyTocandoEm } from '@/services/entities/spotify-device';`,
  `import { spotifyTocandoEm } from '@/services/entities/spotify-device';\nimport { isTvPoweredStable } from '@/services/entities/media-state';`,
  'import de histerese no tile',
);
patch(
  roomTile,
  `      const porEntidade = (d.entities ?? []).some((id) => {\n        const e = hass.states[id];\n        return Boolean(e) && estados.includes(String(e?.state ?? '').toLowerCase());\n      });`,
  `      const porEntidade = (d.entities ?? []).some((id) => {\n        if (d.offDelayMs && id.startsWith('media_player.')) {\n          return isTvPoweredStable(hass, id, Date.now(), d.offDelayMs);\n        }\n        const e = hass.states[id];\n        return Boolean(e) && estados.includes(String(e?.state ?? '').toLowerCase());\n      });`,
  'histerese do dot',
);

// 5) Semântica de mídia: acrescenta filtro temporal compartilhado.
patch(
  mediaState,
  `/** Reprodução, deliberadamente separada do estado de energia. */\nexport function isMediaPlaying`,
  `const ultimoTvLigado = new Map<string, number>();\n\n/**\n * Filtra OFF transitório da entidade de TV sem transformar outra integração em\n * autoridade de energia. Um estado positivo renova a janela; unknown e\n * unavailable continuam falsos.\n */\nexport function isTvPoweredStable(\n  hass: Hass | undefined,\n  entityId: string | undefined,\n  now = Date.now(),\n  graceMs = 45_000,\n): boolean {\n  if (!hass || !entityId) return false;\n  const raw = String(hass.states[entityId]?.state ?? '').toLowerCase();\n  if (TV_POWER_ON_STATES.includes(raw as (typeof TV_POWER_ON_STATES)[number])) {\n    ultimoTvLigado.set(entityId, now);\n    return true;\n  }\n  if (raw !== 'off') return false;\n  const ultimo = ultimoTvLigado.get(entityId);\n  return ultimo !== undefined && now - ultimo <= graceMs;\n}\n\nexport function resetTvPowerStabilityForTests(): void {\n  ultimoTvLigado.clear();\n}\n\n/** Reprodução, deliberadamente separada do estado de energia. */\nexport function isMediaPlaying`,
  'isTvPoweredStable',
);

patch(
  mediaTest,
  `import { describe, expect, it } from 'vitest';`,
  `import { beforeEach, describe, expect, it } from 'vitest';`,
  'beforeEach no teste de mídia',
);
patch(
  mediaTest,
  `  isMediaPlaying,\n  isTvPowered,`,
  `  isMediaPlaying,\n  isTvPowered,\n  isTvPoweredStable,\n  resetTvPowerStabilityForTests,`,
  'imports do teste de histerese',
);
patch(
  mediaTest,
  `describe('semântica de estado de mídia', () => {`,
  `describe('semântica de estado de mídia', () => {\n  beforeEach(() => resetTvPowerStabilityForTests());`,
  'reset do teste de histerese',
);
patch(
  mediaTest,
  `  it('não inventa estado quando a entidade não existe', () => {`,
  `  it('segura um off transitório depois de prova positiva e expira a janela', () => {\n    const on = hassComEstado('on');\n    const off = hassComEstado('off');\n    expect(isTvPoweredStable(on, 'media_player.tv', 1_000, 45_000)).toBe(true);\n    expect(isTvPoweredStable(off, 'media_player.tv', 20_000, 45_000)).toBe(true);\n    expect(isTvPoweredStable(off, 'media_player.tv', 47_000, 45_000)).toBe(false);\n  });\n\n  it('não segura unavailable/unknown como energia', () => {\n    expect(isTvPoweredStable(hassComEstado('on'), 'media_player.tv', 1_000, 45_000)).toBe(true);\n    expect(isTvPoweredStable(hassComEstado('unavailable'), 'media_player.tv', 2_000, 45_000)).toBe(false);\n  });\n\n  it('não inventa estado quando a entidade não existe', () => {`,
  'casos de histerese',
);

fs.mkdirSync('dashboard-src/src/services/home-assistant', { recursive: true });
fs.writeFileSync('dashboard-src/src/services/home-assistant/service-call.ts', `import type { Hass } from '@/models/home-assistant';\n\n/** Chama serviço mantendo entity_id e payload no serviceData, como o frontend oficial do HA. */\nexport function callHaService(\n  hass: Hass,\n  domain: string,\n  service: string,\n  data: Record<string, unknown> = {},\n): Promise<unknown> {\n  return hass.callService(domain, service, data);\n}\n`, 'utf8');
fs.writeFileSync('dashboard-src/src/services/home-assistant/service-call.test.ts', `import { describe, expect, it, vi } from 'vitest';\nimport type { Hass } from '@/models/home-assistant';\nimport { callHaService } from './service-call';\n\ndescribe('callHaService', () => {\n  it('mantém entity_id e dados no terceiro argumento', async () => {\n    const callService = vi.fn(async () => undefined);\n    const hass: Hass = { states: {}, callService };\n    await callHaService(hass, 'media_player', 'volume_set', {\n      entity_id: 'media_player.spotify',\n      volume_level: 0.42,\n    });\n    expect(callService).toHaveBeenCalledWith('media_player', 'volume_set', {\n      entity_id: 'media_player.spotify',\n      volume_level: 0.42,\n    });\n  });\n});\n`, 'utf8');

// Registro curto e factual da rodada.
const claude = 'CLAUDE.md';
let c = fs.readFileSync(claude, 'utf8');
if (!c.includes('## Registro PR #601 — segunda tentativa de mídia/câmeras')) {
  c += `\n\n## Registro PR #601 — segunda tentativa de mídia/câmeras (2026-08-19)\n\n- Spotify: restaurado o contrato de chamadas de serviço da subview legada / frontend oficial: entity_id permanece em serviceData.\n- TV: OFF transitório do Android TV recebe histerese de 45 s; Apple TV só apoia o estado quando há mídia real (playing/paused/buffering), nunca por idle/on.\n- Câmeras: ONVIF PROFILE_1 segue primário; Varanda e Office caem para as entidades Tuya anteriores apenas quando o perfil ONVIF está indisponível.\n- Instalação desta rodada deve ser entregue em pacote copy-only para o Everex; usuário não executa build/terminal.\n`;
  fs.writeFileSync(claude, c, 'utf8');
}

console.log('PR601 media/camera repair applied.');
