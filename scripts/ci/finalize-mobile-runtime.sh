#!/usr/bin/env bash
set -euo pipefail

BRANCH="fix/mobile-runtime-tv-curtain-20260819"

# Partimos dos dois arquivos grandes exatamente como estão no main validado.
# As mudanças funcionais são reaplicadas abaixo de forma determinística.
git checkout origin/main -- config/configuration.yaml
git checkout origin/main -- config/www/bruno-ui/patches/home-mobile-hero-rail.js

python3 <<'PY'
from pathlib import Path
import re

root = Path('.')


def replace_once(text: str, old: str, new: str, label: str) -> str:
    count = text.count(old)
    if count != 1:
        raise SystemExit(f'{label}: esperado 1 trecho, encontrado {count}')
    return text.replace(old, new, 1)


# ---------------------------------------------------------------------------
# 1. Runtime: concluir a migração que ficou pela metade.
#    Os módulos clássicos ainda necessários entram no MESMO bundle Vite.
#    Os aposentados continuam no repositório, mas saem do bootstrap.
# ---------------------------------------------------------------------------
cfg_path = root / 'config/configuration.yaml'
cfg = cfg_path.read_text(encoding='utf-8-sig')

retired = {
    'bruno-ui/cards/bruno-mobile-card-frame.js',
    'bruno-ui/cards/bruno-mobile-nav-card.js',
    'bruno-ui/cards/bruno-mobile-rooms-card.js',
    'bruno-ui/cards/bruno-mobile-sala-card.js',
    'bruno-ui/cards/bruno-mobile-cameras-list-card.js',
    'bruno-ui/cards/bruno-sala-room-card.js',
    'bruno-ui/cards/bruno-office-card.js',
    'bruno-ui/cards/bruno-cozinha-card.js',
    'bruno-ui/cards/bruno-lavabo-card.js',
    'bruno-ui/cards/bruno-corredor-card.js',
    'bruno-ui/cards/bruno-quarto-casal-card.js',
    'bruno-ui/cards/bruno-quarto-marina-card.js',
    'bruno-ui/cards/bruno-quarto-miguel-card.js',
}

active_classic: list[str] = []
out: list[str] = []
in_extra = False
line_re = re.compile(r'^(\s*)-\s+(/local/[^\s]+\.js(?:\?[^\s]+)?)\s*$')
for line in cfg.splitlines():
    stripped = line.strip()
    if stripped == 'extra_module_url:':
        in_extra = True
        out.append(line)
        continue
    if in_extra and stripped and not line.startswith(' ') and not stripped.startswith('#'):
        in_extra = False

    if in_extra:
        match = line_re.match(line)
        if match:
            indent, url = match.groups()
            clean = url.split('?', 1)[0]
            if clean.startswith('/local/dashboard/bruno-dashboard.'):
                out.append(line)
                continue
            rel = clean.removeprefix('/local/')
            if rel in retired:
                out.append(f'{indent}# RETIRADO DO RUNTIME 2026-08-19: {url}')
                continue
            source = root / 'config/www' / rel
            if not source.is_file():
                raise SystemExit(f'Módulo ativo não encontrado: {source}')
            active_classic.append(rel)
            out.append(f'{indent}# CONSOLIDADO NO BUNDLE 2026-08-19: {url}')
            continue
    out.append(line)

if len(active_classic) < 20:
    raise SystemExit(f'Inventário clássico inesperado: {len(active_classic)} módulos')
if len(active_classic) != len(set(active_classic)):
    raise SystemExit('Há módulo clássico ativo duplicado em extra_module_url')

cfg_path.write_text('\n'.join(out) + '\n', encoding='utf-8')

generated = root / 'dashboard-src/src/legacy-runtime.generated.ts'
lines = [
    '/**',
    ' * Runtime clássico ainda necessário, consolidado pelo Vite.',
    ' * GERADO das entradas ativas de frontend.extra_module_url.',
    ' * Os fontes clássicos permanecem em config/www para consulta/rollback.',
    ' */',
]
lines += [f"import '../../config/www/{rel}';" for rel in active_classic]
lines += ['', f'export const LEGACY_RUNTIME_MODULE_COUNT = {len(active_classic)};', '']
generated.write_text('\n'.join(lines), encoding='utf-8')
(root / 'dashboard-src/src/legacy-runtime.d.ts').write_text("declare module '*.js';\n", encoding='utf-8')

main_path = root / 'dashboard-src/src/main.ts'
main = main_path.read_text(encoding='utf-8-sig')
if "import './legacy-runtime.generated';" not in main:
    main = replace_once(
        main,
        'iniciarRuntime();\n',
        "iniciarRuntime();\n\n// Um único request carrega também o runtime clássico ainda necessário.\nimport './legacy-runtime.generated';\n",
        'main.ts: import runtime clássico',
    )
main_path.write_text(main, encoding='utf-8')

# ---------------------------------------------------------------------------
# 2. TV / Hub / Spotify: contrato único e retenção de metadados válidos.
# ---------------------------------------------------------------------------
room_path = root / 'dashboard-src/src/components/rooms/bruno-room-subview.ts'
room = room_path.read_text(encoding='utf-8')

field_old = "  private _midiaAtivasAntes: string[] = [];\n  private _menuMidiaAberto = false;"
field_new = """  private _midiaAtivasAntes: string[] = [];
  /** Últimos atributos válidos: ADB pode omiti-los por um frame sem power-off. */
  private _tvUltimoVolume: number | null = null;
  private _tvUltimoPoster = '';
  private _tvUltimaFonte = 'HDMI 1';
  private _tvUltimoTitulo = '';
  private _menuMidiaAberto = false;"""
if '_tvUltimoVolume' not in room:
    room = replace_once(room, field_old, field_new, 'campos de estabilidade da TV')

pattern = re.compile(r"  private _modeloTv\(\) \{.*?\n  \}\n\n  private _modeloSpotify\(\)", re.S)
match = pattern.search(room)
if not match:
    raise SystemExit('_modeloTv não encontrado')
model = """  private _modeloTv() {
    const id = this._idDe('tv');
    const st = this._estado(id);
    const a = st?.attributes ?? {};
    const estadoBruto = String(st?.state ?? 'off').toLowerCase();
    const ativo = isTvPoweredStable(this._hass, id, Date.now(), 45_000);
    const reproduzindo = isMediaPlaying(this._hass, id);

    const fonteAtual = String(a['source'] ?? a['app_name'] ?? '').trim();
    const tituloAtual = String(a['media_title'] ?? a['media_series_title'] ?? a['app_name'] ?? '').trim();
    const posterAtual = String(a['entity_picture'] ?? a['media_image_url'] ?? '').trim();
    const volumeNumero = a['volume_level'] == null ? Number.NaN : Number(a['volume_level']);
    const volumeAtual = Number.isFinite(volumeNumero) ? Math.round(volumeNumero * 100) : null;

    if (ativo) {
      if (fonteAtual) this._tvUltimaFonte = fonteAtual;
      if (tituloAtual) this._tvUltimoTitulo = tituloAtual;
      if (posterAtual) this._tvUltimoPoster = posterAtual;
      if (volumeAtual != null) this._tvUltimoVolume = volumeAtual;
    } else {
      this._tvUltimoPoster = '';
      this._tvUltimoTitulo = '';
      this._tvUltimoVolume = null;
    }

    return {
      st,
      estado: ativo && estadoBruto === 'off' ? 'idle' : estadoBruto,
      ativo,
      reproduzindo,
      fonte: fonteAtual || (ativo ? this._tvUltimaFonte : 'HDMI 1') || 'HDMI 1',
      titulo: tituloAtual || (ativo ? this._tvUltimoTitulo : ''),
      volume: volumeAtual ?? (ativo ? this._tvUltimoVolume : null),
      poster: posterAtual || (ativo ? this._tvUltimoPoster : ''),
    };
  }

  private _modeloSpotify()"""
room = room[:match.start()] + model + room[match.end():]

priority_old = """    const ativas = Object.fromEntries(fontes.map((f) => [f.chave, f.ativo]));
    const aberta = this._fonteAberta(fontes.map((f) => f.chave), ativas);
    const tocando = fontes.find((f) => f.chave === aberta)?.tocando;"""
priority_new = """    const ativas = Object.fromEntries(fontes.map((f) => [f.chave, f.ativo]));
    const prioridade = !temPc && fontes.some((f) => f.tocando)
      ? Object.fromEntries(fontes.map((f) => [f.chave, Boolean(f.tocando)]))
      : ativas;
    const aberta = this._fonteAberta(fontes.map((f) => f.chave), prioridade);
    const tocando = Boolean(fontes.find((f) => f.chave === aberta)?.tocando);"""
if priority_old in room:
    room = replace_once(room, priority_old, priority_new, 'prioridade de reprodução do Hub')
elif 'const prioridade = !temPc' not in room:
    raise SystemExit('prioridade de reprodução do Hub não reconhecida')

# Serviço do HA deve receber entity_id no serviceData.
if 'callHaService(this._hass, dominio, servico, dados)' not in room:
    raise SystemExit('contrato callHaService não está aplicado na subview')

# ---------------------------------------------------------------------------
# 3. Cortina: o alvo publicado cedo não pode concluir o movimento visual.
# ---------------------------------------------------------------------------
room = room.replace('const CORTINA_GRAÇA_CONFIRMACAO_MS = 1_800;\n', '')

early = re.compile(
    r"\n    // Um extremo publicado enquanto o cover ainda declara opening/closing é o\n"
    r"    // salto prematuro observado no dispositivo\. Só conclui depois que o estado\n"
    r"    // físico assenta e passa a janela de confirmação do comando\.\n"
    r"    if \(\n"
    r"      !estaMovendo\n"
    r"      && decorrido >= CORTINA_GRAÇA_CONFIRMACAO_MS\n"
    r"      && \(fisicoNoAlvo \|\| estadoNoAlvo\)\n"
    r"    \) \{\n"
    r"      this\._movimentoCortina = undefined;\n"
    r"      this\._pararTimerMovimentoCortina\(\);\n"
    r"      return movimento\.alvoFechado;\n"
    r"    \}\n"
)
room, n = early.subn('\n', room, count=1)
if n != 1 and 'CORTINA_GRAÇA_CONFIRMACAO_MS' in room:
    raise SystemExit(f'falha ao remover conclusão precoce da cortina: {n}')

state_target = re.compile(
    r"\n    const estadoNoAlvo =\n"
    r"      \(estado === 'closed' && movimento\.alvoFechado >= 100 - CORTINA_TOLERANCIA_ALVO\)\n"
    r"      \|\| \(estado === 'open' && movimento\.alvoFechado <= CORTINA_TOLERANCIA_ALVO\);\n"
)
room, n_state = state_target.subn('\n', room, count=1)
if n_state not in (0, 1):
    raise SystemExit('estadoNoAlvo duplicado')

completion_old = """    const estimado = this._fechamentoMovimentoCortina(movimento, agora) ?? relatado;
    const terminou = decorrido >= movimento.duracao;
    if (terminou && !estaMovendo) {
      this._movimentoCortina = undefined;
      this._pararTimerMovimentoCortina();
      // Se houve uma parada externa antes do alvo, a telemetria física vence.
      const comandado = this._fechamentoCortinaComandado();
      const comandoNoAlvo = comandado != null
        && Math.abs(comandado - movimento.alvoFechado) <= CORTINA_TOLERANCIA_ALVO;
      return fisico != null && !fisicoNoAlvo && !comandoNoAlvo ? fisico : movimento.alvoFechado;
    }"""
completion_new = """    const estimado = this._fechamentoMovimentoCortina(movimento, agora) ?? relatado;
    const terminou = decorrido >= movimento.duracao;
    if (terminou && !estaMovendo) {
      this._movimentoCortina = undefined;
      this._pararTimerMovimentoCortina();
      const estadoConfirmaAlvo =
        (estado === 'closed' && movimento.alvoFechado >= 100 - CORTINA_TOLERANCIA_ALVO)
        || (estado === 'open' && movimento.alvoFechado <= CORTINA_TOLERANCIA_ALVO);
      if (fisicoNoAlvo || estadoConfirmaAlvo) return movimento.alvoFechado;
      return fisico ?? movimento.alvoFechado;
    }"""
if completion_old in room:
    room = replace_once(room, completion_old, completion_new, 'conclusão final da cortina')
elif 'estadoConfirmaAlvo' not in room:
    raise SystemExit('conclusão final da cortina não reconhecida')

room_path.write_text(room, encoding='utf-8')

# Referência morta que não existe no HA.
sub_path = root / 'dashboard-src/src/config/subviews.config.ts'
sub = sub_path.read_text(encoding='utf-8')
sub = sub.replace("      tvRemotePlayer: 'media_player.atv',\n", '')
sub_path.write_text(sub, encoding='utf-8')

# ---------------------------------------------------------------------------
# 4. Card dinâmico: TV ligada é uma sessão visual mesmo em on/idle.
# ---------------------------------------------------------------------------
media_path = root / 'config/www/bruno-ui/cards/bruno-media-card.js'
media = media_path.read_text(encoding='utf-8')
media = replace_once(
    media,
    "const BRUNO_MEDIA_ACTIVE_STATES = ['playing', 'paused'];",
    "const BRUNO_MEDIA_ACTIVE_STATES = ['playing', 'paused'];\nconst BRUNO_MEDIA_TV_ENTITY = 'media_player.android_tv_192_168_3_17';\nconst BRUNO_MEDIA_TV_POWER_STATES = new Set(['on', 'playing', 'paused', 'idle', 'buffering']);\nconst BRUNO_MEDIA_TV_OFF_GRACE_MS = 45_000;",
    'bruno-media-card: constantes TV',
)
media = replace_once(
    media,
    """  _isActive(entityId) {
    return BRUNO_MEDIA_ACTIVE_STATES.includes(this._state(entityId)?.state || '');
  }""",
    """  _isActive(entityId) {
    const state = String(this._state(entityId)?.state || '').toLowerCase();
    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      if (BRUNO_MEDIA_TV_POWER_STATES.has(state)) {
        this._lastTvPoweredAt = Date.now();
        return true;
      }
      return state === 'off'
        && Number.isFinite(this._lastTvPoweredAt)
        && Date.now() - this._lastTvPoweredAt <= BRUNO_MEDIA_TV_OFF_GRACE_MS;
    }
    return BRUNO_MEDIA_ACTIVE_STATES.includes(state);
  }""",
    'bruno-media-card: _isActive',
)
media = replace_once(
    media,
    """  _playbackPriority(entityId) {
    const entity = this._state(entityId);
    const state = String(entity?.state || '').toLowerCase();
    if (state === 'playing') return 4;
    if (state === 'paused') return 2;
    const config = this._playerConfig(entityId);""",
    """  _playbackPriority(entityId) {
    const entity = this._state(entityId);
    const state = String(entity?.state || '').toLowerCase();
    if (entityId === BRUNO_MEDIA_TV_ENTITY) {
      if (BRUNO_MEDIA_TV_POWER_STATES.has(state)) this._lastTvPoweredAt = Date.now();
      if (state === 'playing') return 4;
      if (state === 'buffering') return 3;
      if (state === 'paused') return 2;
      if (state === 'on' || state === 'idle') return 1;
      if (state === 'off' && Number.isFinite(this._lastTvPoweredAt)
          && Date.now() - this._lastTvPoweredAt <= BRUNO_MEDIA_TV_OFF_GRACE_MS) return 1;
    } else {
      if (state === 'playing') return 4;
      if (state === 'paused') return 2;
    }
    const config = this._playerConfig(entityId);""",
    'bruno-media-card: prioridade',
)
media = replace_once(
    media,
    """    const persisted = hasPlayback
      ? null
      : (this._mediaHistory?.[focusId] || this._latestMediaSnapshot());
    const displayImage = hasPlayback ? image : (persisted?.image || '');
    const displayTitle = hasPlayback ? liveTitle : (persisted?.title || '');
    const displaySecondary = hasPlayback ? liveSecondary : (persisted?.secondary || persisted?.artist || '');
    const displayContext = hasPlayback ? liveContext : (persisted?.context || '');""",
    """    const tvPowered = focusId === BRUNO_MEDIA_TV_ENTITY && this._isActive(focusId);
    const persisted = hasPlayback
      ? null
      : (tvPowered ? (this._mediaHistory?.[focusId] || null) : (this._mediaHistory?.[focusId] || this._latestMediaSnapshot()));
    const displayImage = hasPlayback ? image : (image || persisted?.image || this._lastArtworkByPlayer?.[focusId] || '');
    const displayTitle = hasPlayback ? liveTitle : (persisted?.title || (tvPowered ? 'TV ligada' : ''));
    const displaySecondary = hasPlayback
      ? liveSecondary
      : (persisted?.secondary || persisted?.artist || (tvPowered ? this._firstText([appName, source, 'Sala']) : ''));
    const displayContext = hasPlayback ? liveContext : (persisted?.context || (tvPowered ? 'TV Sala' : ''));""",
    'bruno-media-card: visual persistido',
)
media_path.write_text(media, encoding='utf-8')

# Sala especial da Home no telefone: mesma janela de estabilidade.
sala_path = root / 'config/www/bruno-ui/cards/bruno-sala-card.js'
sala = sala_path.read_text(encoding='utf-8')
sala = replace_once(
    sala,
    "const BRUNO_SALA_TV_ON_STATES = ['on', 'playing', 'paused', 'idle', 'buffering'];",
    "const BRUNO_SALA_TV_ON_STATES = ['on', 'playing', 'paused', 'idle', 'buffering'];\nconst BRUNO_SALA_TV_OFF_GRACE_MS = 45_000;",
    'bruno-sala-card: constante graça',
)
sala = replace_once(
    sala,
    "    const tvOn = BRUNO_SALA_TV_ON_STATES.includes(tv?.state || '');",
    """    const tvState = String(tv?.state || '').toLowerCase();
    if (BRUNO_SALA_TV_ON_STATES.includes(tvState)) this._lastTvPoweredAt = Date.now();
    const tvOn = BRUNO_SALA_TV_ON_STATES.includes(tvState)
      || (tvState === 'off' && Number.isFinite(this._lastTvPoweredAt)
        && Date.now() - this._lastTvPoweredAt <= BRUNO_SALA_TV_OFF_GRACE_MS);""",
    'bruno-sala-card: tvOn',
)
sala_path.write_text(sala, encoding='utf-8')

# Backend que decide se o card dinâmico deve existir.
activity_path = root / 'config/packages/home_activity.yaml'
activity = activity_path.read_text(encoding='utf-8')
activity = replace_once(
    activity,
    """          {{ ['media_player.android_tv_192_168_3_17',
              'media_player.echo_show',
              'media_player.spotifyplus_bruno_helasio',
              'media_player.echo_pop_office']
             | select('is_state', ['playing', 'buffering'])
             | list | count > 0 }}""",
    """          {{ states('media_player.android_tv_192_168_3_17') in
             ['on', 'playing', 'paused', 'idle', 'buffering']
             or ['media_player.echo_show',
                 'media_player.spotifyplus_bruno_helasio',
                 'media_player.echo_pop_office']
                | select('is_state', ['playing', 'buffering'])
                | list | count > 0 }}""",
    'home_activity: mídia',
)
activity = activity.replace(
    '# MÍDIA — relevante quando algum player acompanhado está tocando.\n',
    '# MÍDIA — relevante quando a TV está ligada ou outro player está tocando.\n',
    1,
)
activity_path.write_text(activity, encoding='utf-8')

# Guardas antes do build.
if 'CORTINA_GRAÇA_CONFIRMACAO_MS' in room:
    raise SystemExit('cortina ainda contém conclusão precoce')
if 'media_player.atv' in sub:
    raise SystemExit('config gerada ainda contém media_player.atv')
if 'binary_sensor.office_pc_active' not in (root / 'dashboard-src/src/config/rooms.config.ts').read_text(encoding='utf-8'):
    raise SystemExit('autoridade do Office ausente')
if "import './legacy-runtime.generated';" not in main:
    raise SystemExit('bundle não importa runtime clássico')

print(f'Runtime clássico consolidado: {len(active_classic)} módulos -> 1 bundle')
PY

# Artefatos intermediários não pertencem ao resultado final.
git rm -r --ignore-unmatch _deploy/runtime-cleanup-20260819 || true
git rm --ignore-unmatch config/www/bruno-ui/patches/runtime-media-priority.js || true

cd dashboard-src
npm ci
npm run typecheck
npm test -- --run
npm run lint
npm run check:yaml
npm run build
cd ..

# Pré-compressão somente do NOVO hash. Os .br/.gz antigos do Everex não são
# tocados; como a URL muda, não podem mascarar este bundle.
node <<'NODE'
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const dir = 'config/www/dashboard';
const bundles = fs.readdirSync(dir).filter((name) => /^bruno-dashboard\..+\.js$/.test(name));
if (bundles.length !== 1) throw new Error(`Esperado 1 bundle JS, encontrados: ${bundles.join(', ')}`);
const file = path.join(dir, bundles[0]);
const data = fs.readFileSync(file);
fs.writeFileSync(file + '.br', zlib.brotliCompressSync(data, {
  params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 },
}));
fs.writeFileSync(file + '.gz', zlib.gzipSync(data, { level: 9 }));
console.log(JSON.stringify({
  bundle: bundles[0],
  bytes: data.length,
  br: fs.statSync(file + '.br').size,
  gz: fs.statSync(file + '.gz').size,
}));
NODE

python3 <<'PY'
from pathlib import Path
import re

dashboard = Path('config/www/dashboard')
bundles = sorted(p.name for p in dashboard.glob('bruno-dashboard.*.js'))
if len(bundles) != 1:
    raise SystemExit(f'Esperado um bundle: {bundles}')
bundle = bundles[0]

cfg_path = Path('config/configuration.yaml')
cfg = cfg_path.read_text(encoding='utf-8')
cfg, count = re.subn(
    r'(?m)^(\s*-\s+/local/dashboard/)bruno-dashboard\.[^\s]+\.js\s*$',
    rf'\1{bundle}',
    cfg,
    count=1,
)
if count != 1:
    raise SystemExit(f'Referência do bundle não atualizada: {count}')
cfg_path.write_text(cfg, encoding='utf-8')

active = []
in_extra = False
for line in cfg.splitlines():
    if line.strip() == 'extra_module_url:':
        in_extra = True
        continue
    if in_extra and line.strip() and not line.startswith(' ') and not line.lstrip().startswith('#'):
        in_extra = False
    if in_extra and re.match(r'^\s*-\s+/(?:local|hacsfiles)/.*\.js', line):
        active.append(line.strip())
if active != [f'- /local/dashboard/{bundle}']:
    raise SystemExit(f'Entradas JS ainda ativas no bootstrap: {active}')

# Os cinco Mobile V3 não podem voltar ao runtime.
lovelace = Path('config/dashboards/ui-lovelace-main.yaml').read_text(encoding='utf-8-sig')
for path in [
    'views/mobile/mobile-casa.yaml',
    'views/mobile/mobile-comodos.yaml',
    'views/mobile/mobile-midia.yaml',
    'views/mobile/mobile-cameras.yaml',
    'views/mobile/mobile-mais.yaml',
]:
    if re.search(rf'^\s*-\s*!include\s+{re.escape(path)}\s*$', lovelace, re.M):
        raise SystemExit(f'Mobile V3 ainda ativo: {path}')

print(f'Bundle final: {bundle}')
PY

# Validação de sintaxe dos clássicos alterados antes do commit.
node --check config/www/bruno-ui/cards/bruno-media-card.js
node --check config/www/bruno-ui/cards/bruno-sala-card.js
node --check config/www/bruno-ui/patches/home-mobile-hero-rail.js

# Os arquivos de CI eram scaffolding desta própria rodada; não ficam no PR final.
git rm --ignore-unmatch .github/workflows/finalize-mobile-runtime.yml || true
git rm --ignore-unmatch .github/workflows/finalize-mobile-runtime-pr.yml || true
git rm --ignore-unmatch scripts/ci/finalize-mobile-runtime.sh || true

# O build usa emptyOutDir; registramos o novo bundle e a remoção do hash antigo.
git add -A \
  config/configuration.yaml \
  config/dashboards/ui-lovelace-main.yaml \
  config/dashboards/shared/grid-cards/bento_comodos_matriz.yaml \
  config/packages/home_activity.yaml \
  config/www/dashboard \
  config/www/bruno-ui/cards/bruno-media-card.js \
  config/www/bruno-ui/cards/bruno-sala-card.js \
  config/www/bruno-ui/patches/home-mobile-hero-rail.js \
  dashboard-src/src

git add -f config/www/dashboard/*.br config/www/dashboard/*.gz

git config user.name 'github-actions[bot]'
git config user.email '41898282+github-actions[bot]@users.noreply.github.com'

git status --short
if git diff --cached --quiet; then
  echo 'Nada para commitar.'
  exit 0
fi

git commit -m 'fix: finalize mobile runtime and media state [runtime-finalized]'
git push origin HEAD:"$BRANCH"
