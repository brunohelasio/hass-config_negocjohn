#!/usr/bin/env python3
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / 'dashboard-src/src/components/rooms/bruno-room-subview.ts'
ROLLBACK = ROOT / '_rollback/20260820-pre-premium-tv-remote'
MARKER = '// TV_REMOTE_PREMIUM_RUNTIME: round5'


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
if MARKER in source:
    print('premium TV remote round5 already materialized')
    raise SystemExit(0)

for item in [
    SOURCE,
    ROOT / 'config/configuration.yaml',
    ROOT / 'config/www/dashboard',
]:
    backup(item)

old_comment = """  /**
   * Popup do controle remoto.
   *
   * Mesmo evento e mesma carga das subviews atuais — `ll-custom` com a chamada
   * de `browser_mod.popup` e o `universal-remote-card`. Quem monta a janela é o
   * browser_mod, exatamente como hoje; só a Sala tem controle (`remote.atv`).
   */
"""
new_comment = """  /**
   * Popup premium do controle remoto da Sala.
   *
   * Mantém `browser_mod.popup` + `universal-remote-card` para preservar o caminho
   * funcional já validado em `remote.smart_tv_pro`, mas troca apenas a composição
   * visual. O material replica a mesma base VisionOS das bottom sheets do telefone:
   * gradientes translúcidos + blur moderado, sem animações contínuas ou filtros
   * caros por botão. Assim o popup ganha hierarquia visual sem reabrir a regressão
   * de performance remota já estabilizada nas rounds anteriores.
   */
"""
if old_comment in source:
    source = source.replace(old_comment, new_comment, 1)

method = r'''  private _abrirControleRemoto(): void {
    const remoto = this._idDe('tvRemote');
    if (!remoto) return;
    const mediaId = this._idDe('tvMedia') ?? this._idDe('tv');
    // TV_REMOTE_PREMIUM_RUNTIME: round5

    const comando = (command: string) => ({
      action: 'perform-action',
      perform_action: 'remote.send_command',
      target: { entity_id: remoto },
      data: { command },
    });
    const tecla = (
      nome: string,
      icone: string,
      command: string,
      label: string,
      repetir = false,
    ) => ({
      type: 'button',
      name: nome,
      icon: icone,
      label,
      tap_action: comando(command),
      ...(repetir ? { hold_action: { action: 'repeat' } } : {}),
    });

    const estilosVision = `
      :host {
        --remote-accent: rgba(244, 194, 96, 0.96);
        --remote-accent-soft: rgba(244, 194, 96, 0.16);
        --remote-text: rgba(248, 248, 250, 0.96);
        --remote-muted: rgba(235, 235, 242, 0.58);
        display: block;
        width: min(390px, calc(100vw - 28px));
        max-width: 100%;
        box-sizing: border-box;
        padding: 10px 10px 14px;
        border-radius: 30px;
        overflow: hidden;
        color: var(--remote-text);
        background:
          radial-gradient(360px 240px at 18% -10%, rgba(255, 255, 255, 0.105), transparent 64%),
          linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.060),
            rgba(255, 255, 255, 0.018) 48%,
            rgba(0, 0, 0, 0.035)
          ),
          rgba(0, 0, 0, 0.300);
        backdrop-filter: blur(20px) saturate(1.18) brightness(1.03);
        -webkit-backdrop-filter: blur(20px) saturate(1.18) brightness(1.03);
        border: 1px solid rgba(255, 255, 255, 0.075);
        box-shadow:
          0 24px 68px -24px rgba(0, 0, 0, 0.78),
          inset 0 1px 0 rgba(255, 255, 255, 0.11);
      }

      .row {
        width: 100%;
        box-sizing: border-box;
        justify-content: center;
        align-items: center;
        gap: 0;
        margin: 0 0 10px;
      }

      #row-1,
      #row-3,
      #row-4 {
        padding: 4px;
        border-radius: 20px;
        background:
          linear-gradient(180deg, rgba(255,255,255,0.055), rgba(255,255,255,0.016)),
          rgba(10, 12, 16, 0.24);
        border: 1px solid rgba(255, 255, 255, 0.055);
        box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.055);
      }

      #row-2 {
        margin: 2px 0 14px;
      }

      remote-button {
        flex: 1 1 0;
        min-width: 0;
        margin: 0;
        padding: 0;
        border-radius: 16px;
        background: transparent;
        --icon-size: 25px;
        --icon-color: var(--remote-text);
      }

      remote-button::part(button) {
        min-height: 60px;
        border-radius: 16px;
        background: transparent;
        transition: background 120ms ease, transform 120ms ease, box-shadow 120ms ease;
      }

      remote-button:active::part(button) {
        transform: scale(0.965);
        background: rgba(255, 255, 255, 0.075);
        box-shadow: inset 0 0 0 1px rgba(255,255,255,0.06);
      }

      remote-button::part(icon) {
        color: var(--remote-text);
        filter: drop-shadow(0 1px 5px rgba(0,0,0,0.25));
      }

      remote-button::part(label) {
        color: var(--remote-muted);
        font-size: 9.5px;
        line-height: 1.1;
        font-weight: 650;
        letter-spacing: 0.075em;
        text-transform: uppercase;
        margin-top: 5px;
      }

      #power::part(icon),
      #home::part(icon) {
        color: var(--remote-accent);
        filter: drop-shadow(0 0 7px rgba(244, 194, 96, 0.34));
      }

      #power::part(button),
      #home::part(button) {
        background: radial-gradient(circle at 50% 50%, var(--remote-accent-soft), transparent 68%);
      }

      #row-4 remote-button::part(button) {
        min-height: 54px;
      }

      #row-4 remote-button::part(label) {
        font-size: 8.5px;
        letter-spacing: 0.055em;
      }

      @media (max-width: 390px) {
        :host {
          width: calc(100vw - 20px);
          border-radius: 26px;
          padding: 8px 8px 12px;
        }
        remote-button::part(button) { min-height: 56px; }
        #row-4 remote-button::part(button) { min-height: 50px; }
      }
    `;

    const estiloNavegacao = `
      :host {
        width: min(72vw, 282px);
        max-width: 282px;
        margin: 2px auto;
        --icon-size: 29px;
        --icon-color: rgba(248, 248, 250, 0.90);
      }

      .circlepad {
        aspect-ratio: 1 / 1;
        border-radius: 50%;
        overflow: hidden;
        background:
          radial-gradient(circle at 42% 32%, rgba(255,255,255,0.075), transparent 43%),
          linear-gradient(145deg, rgba(36,39,45,0.84), rgba(10,12,16,0.82));
        border: 1px solid rgba(255,255,255,0.09);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.08),
          inset 0 -14px 30px rgba(0,0,0,0.18),
          0 18px 38px -26px rgba(0,0,0,0.95);
      }

      #up::part(button),
      #down::part(button),
      #left::part(button),
      #right::part(button) {
        background: transparent;
      }

      #up::part(icon),
      #down::part(icon),
      #left::part(icon),
      #right::part(icon) {
        color: rgba(248,248,250,0.88);
        filter: drop-shadow(0 2px 6px rgba(0,0,0,0.34));
      }

      #center::part(button) {
        background:
          radial-gradient(circle at 42% 30%, rgba(244,194,96,0.24), rgba(26,24,21,0.80) 58%, rgba(12,13,16,0.92));
        border: 1px solid rgba(244,194,96,0.40);
        box-shadow:
          inset 0 1px 0 rgba(255,255,255,0.11),
          0 0 0 5px rgba(244,194,96,0.045),
          0 0 22px rgba(244,194,96,0.13);
      }

      #center::part(icon) {
        color: rgba(255, 223, 158, 0.98);
        --icon-size: 31px;
        filter: drop-shadow(0 0 7px rgba(244,194,96,0.30));
      }
    `;

    this.dispatchEvent(
      new CustomEvent('ll-custom', {
        bubbles: true,
        composed: true,
        detail: {
          action: 'fire-dom-event',
          browser_mod: {
            service: 'browser_mod.popup',
            data: {
              title: 'Controle da TV',
              tag: 'tv_remote',
              style:
                '--popup-background-color: rgba(6,8,12,0.18); --popup-min-width: min(390px, 96vw); --popup-max-width: min(430px, 96vw); --popup-border-width: 0;',
              content: {
                type: 'custom:universal-remote-card',
                remote_id: remoto,
                media_player_id: mediaId,
                autofill: false,
                haptics: true,
                rows: [
                  ['power', 'input', 'menu'],
                  ['navigation'],
                  ['back', 'home', 'mute'],
                  ['volume_down', 'volume_up', 'channel_down', 'channel_up'],
                ],
                custom_actions: [
                  tecla('power', 'mdi:power', 'POWER', 'Power'),
                  tecla('input', 'mdi:import', 'TV', 'Entrada'),
                  tecla('menu', 'mdi:menu', 'MENU', 'Menu'),
                  {
                    type: 'circlepad',
                    name: 'navigation',
                    icon: 'mdi:check-bold',
                    label: 'OK',
                    tap_action: comando('DPAD_CENTER'),
                    up: { icon: 'mdi:chevron-up', tap_action: comando('DPAD_UP'), hold_action: { action: 'repeat' } },
                    down: { icon: 'mdi:chevron-down', tap_action: comando('DPAD_DOWN'), hold_action: { action: 'repeat' } },
                    left: { icon: 'mdi:chevron-left', tap_action: comando('DPAD_LEFT'), hold_action: { action: 'repeat' } },
                    right: { icon: 'mdi:chevron-right', tap_action: comando('DPAD_RIGHT'), hold_action: { action: 'repeat' } },
                    styles: estiloNavegacao,
                  },
                  tecla('back', 'mdi:keyboard-backspace', 'BACK', 'Voltar'),
                  tecla('home', 'mdi:home', 'HOME', 'Início'),
                  tecla('mute', 'mdi:volume-off', 'MUTE', 'Mudo'),
                  tecla('volume_down', 'mdi:volume-minus', 'VOLUME_DOWN', 'Vol −', true),
                  tecla('volume_up', 'mdi:volume-plus', 'VOLUME_UP', 'Vol +', true),
                  tecla('channel_down', 'mdi:chevron-down', 'CHANNEL_DOWN', 'Canal −', true),
                  tecla('channel_up', 'mdi:chevron-up', 'CHANNEL_UP', 'Canal +', true),
                ],
                styles: estilosVision,
              },
            },
          },
        },
      }),
    );
  }
'''

pattern = re.compile(
    r"  private _abrirControleRemoto\(\): void \{\n.*?\n  \}\n\n  private ",
    re.S,
)
source, count = pattern.subn(method + '\n  private ', source, count=1)
if count != 1:
    raise SystemExit('premium TV remote: method boundary not found')

SOURCE.write_text(source, encoding='utf-8')

DOC = ROOT / 'docs/36-controle-remoto-premium-visionos-20260820.md'
DOC.write_text(
    """# 36 — Controle remoto premium VisionOS\n\n"
    "Baseline preservado: round4 com 5G significativamente melhor, TV/Hub estáveis, card dinâmico funcional, artwork/volume corrigidos.\n\n"
    "## Decisão visual\n"
    "O popup continua usando `browser_mod.popup` + `universal-remote-card`; não foi criado um segundo motor de controle. A mudança é exclusivamente de composição visual.\n\n"
    "O material principal reutiliza a mesma receita das bottom sheets VisionOS do telefone: radial highlight, gradiente translúcido e `blur(20px) saturate(1.18) brightness(1.03)`. Os botões evitam blur individual e animações contínuas para não reabrir o custo de repaint no iPhone.\n\n"
    "## Hierarquia\n"
    "1. Power / Entrada / Menu.\n"
    "2. D-pad circular grande com centro OK.\n"
    "3. Voltar / Início / Mudo.\n"
    "4. Volume - / Volume + / Canal - / Canal +.\n\n"
    "## Funcionalidade\n"
    "Todos os comandos permanecem em `remote.smart_tv_pro` via `remote.send_command`. D-pad, volume e canais preservam repetição por hold.\n\n"
    "## Rollback\n"
    "Estado imediatamente anterior: `_rollback/20260820-pre-premium-tv-remote/`. O rollback inclui o source do room-subview, `configuration.yaml` e a pasta `config/www/dashboard/` da round4.\n"
    """,
    encoding='utf-8',
)

print('premium TV remote round5 materialized')
