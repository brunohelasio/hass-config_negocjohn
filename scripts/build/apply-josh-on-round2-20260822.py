from __future__ import annotations

import os
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
TILE = ROOT / 'dashboard-src/src/components/rooms/bruno-room-tile.ts'
JOSH = ROOT / 'config/www/bruno-ui/core/bruno-josh.js'
BRIDGE = ROOT / 'dashboard-src/src/themes/josh-phone-on-bridge.ts'


def replace_once(text: str, old: str, new: str, label: str) -> tuple[str, bool]:
    if new in text:
        return text, False
    if old not in text:
        raise SystemExit(f'marker not found: {label}')
    return text.replace(old, new, 1), True


def patch_tile() -> bool:
    text = TILE.read_text(encoding='utf-8')
    changed = False

    old_tablet = '''    /* Josh ON: reforco sem reintroduzir uma cartela. A leitura vem de luz,
       nao de moldura: wash leitoso discreto, filete quente e glow de base. */
    .room-card.is-tile.is-room-on {
      --text-main: rgba(255, 252, 245, 0.99);
      --text-soft: rgba(255, 245, 226, 0.72);
      --text-muted: rgba(255, 247, 232, 0.76);
      --bruno-tile-on-line: linear-gradient(
        90deg,
        rgba(255, 194, 104, 0) 0%,
        rgba(255, 202, 122, 0.78) 50%,
        rgba(255, 194, 104, 0) 100%
      );
      --bruno-tile-on-glow: radial-gradient(
        82px 38px at 50% 100%,
        rgba(255, 194, 102, 0.22),
        rgba(255, 216, 156, 0.07) 48%,
        transparent 76%
      );
    }

    .room-card.is-tile.is-room-on::before {
      inset: 1px 2px 1px;
      border-radius: 0;
      background:
        radial-gradient(92% 78% at 50% 100%, rgba(255, 204, 126, 0.12), transparent 72%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.070), rgba(255, 247, 232, 0.025) 62%, transparent);
      opacity: 1;
    }
'''
    new_tablet = '''    /* Josh ON tablet/desktop: continua TILE, sem cartela e sem veil.
       O wash foi reprovado na validacao fisica de 2026-08-22 porque ainda
       desenhava um retangulo perceptivel. O feedback ON fica no PNG, texto,
       filete quente e glow inferior. */
    .room-card.is-tile.is-room-on {
      --text-main: rgba(255, 252, 245, 0.99);
      --text-soft: rgba(255, 245, 226, 0.72);
      --text-muted: rgba(255, 247, 232, 0.76);
      --bruno-tile-on-line: linear-gradient(
        90deg,
        rgba(255, 194, 104, 0) 0%,
        rgba(255, 202, 122, 0.92) 50%,
        rgba(255, 194, 104, 0) 100%
      );
      --bruno-tile-on-glow: radial-gradient(
        82px 38px at 50% 100%,
        rgba(255, 194, 102, 0.22),
        rgba(255, 216, 156, 0.07) 48%,
        transparent 76%
      );
    }

    .room-card.is-tile.is-room-on::before {
      inset: 0;
      border-radius: 0;
      background: none;
      opacity: 0;
    }
'''
    text, did = replace_once(text, old_tablet, new_tablet, 'tablet Josh ON')
    changed |= did

    old_line = '      box-shadow: 0 -2px 11px rgba(255, 194, 102, 0.17);'
    new_line = '      box-shadow: 0 -2px 14px rgba(255, 194, 102, 0.24);'
    text, did = replace_once(text, old_line, new_line, 'tablet bottom line')
    changed |= did

    old_mobile = '''      .room-card.is-josh-phone-card.is-room-on {
        --text-main: rgba(255, 253, 248, 0.99);
        --text-soft: rgba(255, 246, 230, 0.72);
        --text-muted: rgba(255, 248, 236, 0.76);
        background:
          radial-gradient(175px 138px at 16% -10%, rgba(255, 252, 245, 0.30), transparent 72%),
          radial-gradient(155px 120px at 92% 100%, rgba(255, 207, 135, 0.13), transparent 72%),
          linear-gradient(180deg, rgba(255, 250, 240, 0.18), rgba(255, 242, 222, 0.075) 48%, rgba(44, 31, 22, 0.10)),
          rgba(30, 27, 24, 0.42);
        border-color: rgba(255, 244, 225, 0.275);
        box-shadow:
          inset 0 1px 0 rgba(255, 255, 255, 0.27),
          inset 0 -1px 0 rgba(255, 213, 151, 0.07),
          0 0 24px rgba(255, 205, 132, 0.09),
          0 12px 28px rgba(0, 0, 0, 0.21);
        backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.13) brightness(1.035);
        -webkit-backdrop-filter: var(--bruno-josh-microblur, blur(2px)) saturate(1.13) brightness(1.035);
      }
      .room-card.is-josh-phone-card.is-room-on::before {
        background:
          radial-gradient(120px 86px at 18% 0%, rgba(255, 255, 255, 0.22), transparent 74%),
          linear-gradient(180deg, rgba(255, 255, 255, 0.12), transparent 42%);
        opacity: 0.88;
      }
'''
    new_mobile = '''      .room-card.is-josh-phone-card.is-room-on {
        --text-main: rgba(248, 251, 255, 0.96);
        --text-soft: rgba(255, 255, 255, 0.52);
        --text-muted: rgba(255, 255, 255, 0.62);
        background: var(--bruno-josh-room-on-background);
        border-color: var(--bruno-josh-room-on-border-color);
        box-shadow: var(--bruno-josh-room-on-shadow);
        backdrop-filter: var(--bruno-josh-room-on-filter);
        -webkit-backdrop-filter: var(--bruno-josh-room-on-filter);
      }
      .room-card.is-josh-phone-card.is-room-on::before {
        background: var(--bruno-josh-room-on-sheen);
        opacity: var(--bruno-josh-room-on-sheen-opacity);
      }
'''
    text, did = replace_once(text, old_mobile, new_mobile, 'phone Josh ON')
    changed |= did

    if changed:
        TILE.write_text(text, encoding='utf-8')
    return changed


def patch_josh() -> bool:
    text = JOSH.read_text(encoding='utf-8')
    changed = False

    old_version = "const BRUNO_JOSH_VERSION = '20260802-josh-popup-material-1';"
    new_version = "const BRUNO_JOSH_VERSION = '20260822-josh-liquid-on-reference-1';"
    text, did = replace_once(text, old_version, new_version, 'Josh version')
    changed |= did

    old_resolver = '''function brunoJoshTokens() {
  const base = brunoJoshVisionOSBase();
  return Object.assign({}, base?.tokens || {}, BRUNO_JOSH_OVERRIDES);
}
'''
    new_resolver = '''function brunoJoshLiquidGlassOnReference() {
  const liquid = globalThis.BrunoLiquidGlassOriginal
    || (globalThis.BrunoLiquidGlass?.__brunoThemeProxy ? null : globalThis.BrunoLiquidGlass);
  const tokens = liquid?.tokens || {};
  return {
    'bruno-josh-room-on-background': tokens['bruno-liquid-surface-on-background'] || 'radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.30), rgba(255,255,255,0.06) 46%, transparent 73%), linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07)), linear-gradient(155deg, rgba(255,255,255,0.11), rgba(255,255,255,0.055))',
    'bruno-josh-room-on-filter': tokens['bruno-liquid-surface-on-filter'] || 'blur(14px) saturate(1.28) brightness(1.04)',
    'bruno-josh-room-on-border-color': tokens['bruno-liquid-surface-on-border-color'] || 'rgba(255,255,255,0.16)',
    'bruno-josh-room-on-shadow': tokens['bruno-liquid-surface-on-shadow'] || 'inset 0 1px 0 rgba(255,255,255,0.36), inset 1px 0 0 rgba(255,255,255,0.12), inset -1px 0 0 rgba(255,255,255,0.07), inset 0 -1px 0 rgba(255,255,255,0.04), 0 8px 24px rgba(0,0,0,0.32)',
    'bruno-josh-room-on-sheen': tokens['bruno-liquid-surface-on-sheen'] || 'radial-gradient(112px 72px at 16% 0%, rgba(255,255,255,0.40), transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.00) 38%), linear-gradient(90deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 48%)',
    'bruno-josh-room-on-sheen-opacity': tokens['bruno-liquid-surface-on-sheen-opacity'] || '0.85',
  };
}

function brunoJoshTokens() {
  const base = brunoJoshVisionOSBase();
  return Object.assign({}, base?.tokens || {}, BRUNO_JOSH_OVERRIDES, brunoJoshLiquidGlassOnReference());
}
'''
    text, did = replace_once(text, old_resolver, new_resolver, 'Josh token resolver')
    changed |= did

    if changed:
        JOSH.write_text(text, encoding='utf-8')
    return changed


def patch_bridge() -> bool:
    target = '''/**
 * OBSOLETO desde 2026-08-22 (Josh ON round2).
 * A primeira candidata empilhava CSS no Shadow DOM. A implementacao vigente
 * vive em bruno-room-tile.ts e consome tokens de bruno-josh.js.
 * Mantido somente como registro/rollback; nao injeta estilos.
 */
export {};
'''
    current = BRIDGE.read_text(encoding='utf-8')
    if current == target:
        return False
    BRIDGE.write_text(target, encoding='utf-8')
    return True


def validate() -> None:
    tile = TILE.read_text(encoding='utf-8')
    josh = JOSH.read_text(encoding='utf-8')
    bridge = BRIDGE.read_text(encoding='utf-8')

    required_tile = (
        'background: none;',
        'background: var(--bruno-josh-room-on-background);',
        'backdrop-filter: var(--bruno-josh-room-on-filter);',
        'background: var(--bruno-josh-room-on-sheen);',
        'height: 120%;',
        'height: 127.5%;',
    )
    missing = [item for item in required_tile if item not in tile]
    if missing:
        raise SystemExit(f'Josh tile contract missing: {missing}')
    if 'wash leitoso discreto' in tile:
        raise SystemExit('old tablet wash still present')
    if 'rgba(255, 252, 245, 0.30)' in tile:
        raise SystemExit('old phone ON material still present')

    required_josh = (
        'brunoJoshLiquidGlassOnReference',
        "tokens['bruno-liquid-surface-on-background']",
        "tokens['bruno-liquid-surface-on-filter']",
        "tokens['bruno-liquid-surface-on-border-color']",
        "tokens['bruno-liquid-surface-on-shadow']",
        "tokens['bruno-liquid-surface-on-sheen']",
        "tokens['bruno-liquid-surface-on-sheen-opacity']",
    )
    missing = [item for item in required_josh if item not in josh]
    if missing:
        raise SystemExit(f'Liquid Glass ON references missing: {missing}')
    if 'MutationObserver' in bridge or 'connectedCallback' in bridge:
        raise SystemExit('old bridge injection is still active')

    subprocess.run(['node', '--check', str(JOSH)], cwd=ROOT, check=True)


def commit_in_actions(paths: list[Path]) -> None:
    if os.environ.get('GITHUB_ACTIONS') != 'true':
        return
    rel = [str(path.relative_to(ROOT)) for path in paths]
    status = subprocess.check_output(['git', 'status', '--porcelain=v1', '--', *rel], cwd=ROOT, text=True)
    if not status.strip():
        return
    subprocess.run(['git', 'config', 'user.name', 'github-actions[bot]'], cwd=ROOT, check=True)
    subprocess.run(
        ['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'],
        cwd=ROOT,
        check=True,
    )
    subprocess.run(['git', 'add', '--', *rel], cwd=ROOT, check=True)
    subprocess.run(['git', 'commit', '-m', 'fix: consolidar Josh ON round2 na fonte'], cwd=ROOT, check=True)


def main() -> None:
    changed_paths: list[Path] = []
    if patch_tile():
        changed_paths.append(TILE)
    if patch_josh():
        changed_paths.append(JOSH)
    if patch_bridge():
        changed_paths.append(BRIDGE)
    validate()
    commit_in_actions(changed_paths)
    print('Josh ON round2 canonical sources OK')


if __name__ == '__main__':
    main()
