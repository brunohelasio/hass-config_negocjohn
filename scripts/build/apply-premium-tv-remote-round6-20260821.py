#!/usr/bin/env python3
from pathlib import Path
import shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'dashboard-src/src/components/rooms/bruno-room-subview.ts'
ROLLBACK = ROOT / '_rollback/20260821-pre-premium-tv-remote-round6'
MARKER_OLD = '// TV_REMOTE_PREMIUM_RUNTIME: round5'
MARKER_NEW = '// TV_REMOTE_PREMIUM_RUNTIME: round6'


def backup(path: Path) -> None:
    if not path.exists():
        return
    rel = path.relative_to(ROOT)
    dst = ROLLBACK / rel
    if dst.exists():
        if dst.is_dir():
            shutil.rmtree(dst)
        else:
            dst.unlink()
    dst.parent.mkdir(parents=True, exist_ok=True)
    if path.is_dir():
        shutil.copytree(path, dst)
    else:
        shutil.copy2(path, dst)


source = SOURCE.read_text(encoding='utf-8')
if MARKER_NEW in source:
    print('premium TV remote round6 already materialized')
    raise SystemExit(0)
if MARKER_OLD not in source:
    raise SystemExit('premium TV remote round6: round5 marker not found')

for item in [
    SOURCE,
    ROOT / 'config/configuration.yaml',
    ROOT / 'config/www/dashboard',
]:
    backup(item)

source = source.replace(MARKER_OLD, MARKER_NEW, 1)

old = """        --remote-muted: rgba(235, 235, 242, 0.58);\n        display: block;\n        width: min(390px, calc(100vw - 28px));\n"""
new = """        --remote-muted: rgba(235, 235, 242, 0.58);\n        --remote-divider: rgba(255, 255, 255, 0.105);\n        display: block;\n        width: min(390px, calc(100vw - 28px));\n"""
if old not in source:
    raise SystemExit('round6: host token marker not found')
source = source.replace(old, new, 1)

old = """        box-sizing: border-box;\n        padding: 10px 10px 14px;\n        border-radius: 30px;\n"""
new = """        box-sizing: border-box;\n        margin: clamp(12px, 3.2dvh, 34px) auto;\n        padding: 10px 10px 14px;\n        border-radius: 30px;\n"""
if old not in source:
    raise SystemExit('round6: host centering marker not found')
source = source.replace(old, new, 1)

old = """      #row-2 {\n        margin: 2px 0 14px;\n      }\n\n      remote-button {\n"""
new = """      #row-2 {\n        margin: 2px 0 14px;\n      }\n\n      /* Filetes curtos e translúcidos entre todos os botões das barras.\n         O gradiente evita a aparência de grade rígida e mantém a linguagem\n         VisionOS da composição de referência. */\n      #row-1 remote-button + remote-button,\n      #row-3 remote-button + remote-button,\n      #row-4 remote-button + remote-button {\n        background-image: linear-gradient(\n          180deg,\n          transparent 8%,\n          var(--remote-divider) 24%,\n          var(--remote-divider) 76%,\n          transparent 92%\n        );\n        background-size: 1px 78%;\n        background-position: left center;\n        background-repeat: no-repeat;\n      }\n\n      remote-button {\n"""
if old not in source:
    raise SystemExit('round6: row divider insertion marker not found')
source = source.replace(old, new, 1)

old = """        .circlepad {\n        aspect-ratio: 1 / 1;\n        border-radius: 50%;\n        overflow: hidden;\n        background:\n          radial-gradient(circle at 42% 32%, rgba(255,255,255,0.075), transparent 43%),\n          linear-gradient(145deg, rgba(36,39,45,0.84), rgba(10,12,16,0.82));\n"""
new = """      .circlepad {\n        aspect-ratio: 1 / 1;\n        border-radius: 50%;\n        overflow: hidden;\n        background:\n          /* quatro filetes diagonais delimitam UP / RIGHT / DOWN / LEFT sem\n             criar quatro botões visivelmente separados */\n          repeating-conic-gradient(\n            from 45deg at 50% 50%,\n            transparent 0deg 89.15deg,\n            rgba(255,255,255,0.115) 89.15deg 90deg\n          ),\n          radial-gradient(circle at 42% 32%, rgba(255,255,255,0.075), transparent 43%),\n          linear-gradient(145deg, rgba(36,39,45,0.84), rgba(10,12,16,0.82));\n"""
if old not in source:
    old = """      .circlepad {\n        aspect-ratio: 1 / 1;\n        border-radius: 50%;\n        overflow: hidden;\n        background:\n          radial-gradient(circle at 42% 32%, rgba(255,255,255,0.075), transparent 43%),\n          linear-gradient(145deg, rgba(36,39,45,0.84), rgba(10,12,16,0.82));\n"""
if old not in source:
    raise SystemExit('round6: circlepad background marker not found')
source = source.replace(old, new, 1)

old = """      #up::part(button),\n      #down::part(button),\n      #left::part(button),\n      #right::part(button) {\n        background: transparent;\n      }\n\n      #up::part(icon),\n"""
new = """      #up::part(button),\n      #down::part(button),\n      #left::part(button),\n      #right::part(button) {\n        background: transparent;\n      }\n\n      .center-row {\n        align-items: center;\n        justify-content: center;\n      }\n\n      #left,\n      #right {\n        flex: 1 1 0;\n        min-width: 0;\n        align-self: stretch;\n      }\n\n      /* O centro da round5 herdava a célula retangular do circlepad e o botão\n         virava oval. A round6 fixa host e part no mesmo quadrado. */\n      #center {\n        flex: 0 0 43%;\n        width: 43%;\n        max-width: 122px;\n        aspect-ratio: 1 / 1;\n        align-self: center;\n        border-radius: 50%;\n        overflow: hidden;\n      }\n\n      #up::part(icon),\n"""
if old not in source:
    raise SystemExit('round6: center geometry insertion marker not found')
source = source.replace(old, new, 1)

old = """      #center::part(button) {\n        background:\n          radial-gradient(circle at 42% 30%, rgba(244,194,96,0.24), rgba(26,24,21,0.80) 58%, rgba(12,13,16,0.92));\n        border: 1px solid rgba(244,194,96,0.40);\n"""
new = """      #center::part(button) {\n        width: 100%;\n        height: 100%;\n        min-width: 100%;\n        min-height: 100%;\n        aspect-ratio: 1 / 1;\n        border-radius: 50%;\n        background:\n          radial-gradient(circle at 42% 30%, rgba(244,194,96,0.24), rgba(26,24,21,0.80) 58%, rgba(12,13,16,0.92));\n        border: 1px solid rgba(244,194,96,0.40);\n"""
if old not in source:
    raise SystemExit('round6: center button marker not found')
source = source.replace(old, new, 1)

old = """              style:\n                '--popup-background-color: rgba(6,8,12,0.18); --popup-min-width: min(390px, 96vw); --popup-max-width: min(430px, 96vw); --popup-border-width: 0;',\n              content: {\n"""
new = """              style:\n                '--popup-background-color: rgba(6,8,12,0.18); --popup-min-width: min(390px, 96vw); --popup-max-width: min(430px, 96vw); --popup-border-width: 0;',\n              popup_styles: [\n                {\n                  style: 'all',\n                  styles: `\n                    ha-dialog {\n                      --dialog-surface-margin-top: auto !important;\n                    }\n                  `,\n                },\n              ],\n              content: {\n"""
if old not in source:
    raise SystemExit('round6: popup centering marker not found')
source = source.replace(old, new, 1)

old = """        remote-button::part(button) { min-height: 56px; }\n        #row-4 remote-button::part(button) { min-height: 50px; }\n"""
new = """        remote-button::part(button) { min-height: 56px; }\n        #row-4 remote-button::part(button) { min-height: 50px; }\n        #navigation { margin-inline: auto; }\n"""
if old in source:
    source = source.replace(old, new, 1)

required = [
    MARKER_NEW,
    '--remote-divider:',
    'repeating-conic-gradient(',
    '#center {',
    'aspect-ratio: 1 / 1;',
    '--dialog-surface-margin-top: auto !important;',
    '#row-1 remote-button + remote-button',
]
for token in required:
    if token not in source:
        raise SystemExit(f'round6 validation missing token: {token}')

SOURCE.write_text(source, encoding='utf-8')

DOC = ROOT / 'docs/37-controle-remoto-premium-round6-20260821.md'
DOC.write_text(
    "# 37 — Controle remoto premium round6\n\n"
    "Refinamento visual solicitado após validação física da round5. A funcionalidade permanece intacta.\n\n"
    "## Ajustes\n"
    "- centro do D-pad passa a ser círculo real, com host e botão em `aspect-ratio: 1 / 1`;\n"
    "- D-pad recebe quatro filetes diagonais translúcidos para separar UP/RIGHT/DOWN/LEFT;\n"
    "- barras Power/Entrada/Menu, Voltar/Início/Mudo e Volume/Canal recebem divisores translúcidos curtos;\n"
    "- popup usa `--dialog-surface-margin-top: auto` e margem horizontal automática para centralização no mobile;\n"
    "- material VisionOS, comandos, hold/repeat e arquitetura da TV permanecem inalterados.\n\n"
    "## Rollback\n"
    "Estado imediatamente anterior em `_rollback/20260821-pre-premium-tv-remote-round6/`.\n",
    encoding='utf-8',
)

print('premium TV remote round6 materialized')
