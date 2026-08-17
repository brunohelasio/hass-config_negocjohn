/**
 * Controles de dispositivo — os tipos registrados hoje.
 *
 * Cada tipo é um elemento próprio, com estado e ciclo de vida próprios, que
 * declara AO REGISTRY quais entidades observa. Isso é o que permite, na Fase
 * 6.1, redesenhar um controle sem tocar nos outros.
 *
 * Acrescentar um TIPO novo (persiana, aspirador, som) é acrescentar um bloco
 * aqui e registrá-lo no fim do arquivo. O popup não muda.
 */

import { LitElement, html, css, nothing } from 'lit';
import type { Hass } from '@/models/home-assistant';
import {
  deviceRegistry,
  resolverEntidade,
  type DeviceInstanceConfig,
} from '@/application/device-registry';

const CLIMATE_LIGADO = ['cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];
const TV_LIGADA = ['on', 'playing', 'paused', 'idle', 'buffering'];

/** Base comum: recebe a instância, guarda o hass, resolve a entidade principal. */
abstract class ControleBase extends LitElement {
  static override properties = { _hass: { state: true } };

  protected _instancia: DeviceInstanceConfig | undefined;
  protected _hass: Hass | undefined;

  set instancia(v: DeviceInstanceConfig) {
    this._instancia = v;
    this.requestUpdate();
  }

  set hass(v: Hass) {
    this._hass = v;
    this.requestUpdate();
  }

  protected get _entityId(): string | undefined {
    return resolverEntidade(this._instancia?.entity, this._hass);
  }

  protected _estado(id: string | undefined) {
    return id && this._hass ? this._hass.states[id] : undefined;
  }

  protected _servico(dominio: string, servico: string, dados: Record<string, unknown>): void {
    this._hass?.callService(dominio, servico, dados, dados as { entity_id?: string });
  }

  static estilosComuns = css`
    :host {
      display: block;
      min-width: 0;
    }
    .titulo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .titulo strong {
      font-size: 16px;
      font-weight: 700;
      color: var(--text-main, rgba(255, 255, 255, 0.94));
    }
    .titulo small {
      font-size: 12px;
      color: var(--text-soft, rgba(255, 255, 255, 0.58));
    }
    .linha {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 7px;
      min-height: 44px;
      padding: 0 14px;
      border-radius: var(--bruno-liquid-control-radius-compact, 10px);
      background: var(--bruno-liquid-control-background, rgba(255, 255, 255, 0.03));
      border: var(--bruno-liquid-control-border, 1px solid rgba(255, 255, 255, 0.07));
      box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.06));
    }
    button:disabled {
      opacity: 0.42;
      cursor: default;
    }
    button.is-on {
      color: rgba(150, 205, 255, 0.98);
      background: rgba(96, 165, 250, 0.075);
      box-shadow: 0 0 18px rgba(44, 175, 255, 0.22);
    }
    .valor {
      font-size: 28px;
      font-weight: 800;
      color: var(--text-main, rgba(255, 255, 255, 0.94));
      min-width: 76px;
      text-align: center;
    }
    .indisponivel {
      font-size: 13px;
      color: var(--text-soft, rgba(255, 255, 255, 0.58));
    }
  `;
}

// ── TV / media_player ────────────────────────────────────────────────────────

export class ControleTv extends ControleBase {
  static override styles = [ControleBase.estilosComuns];

  override render() {
    const id = this._entityId;
    const st = this._estado(id);
    if (!st) return html`<p class="indisponivel">Entidade indisponível: ${id ?? '—'}</p>`;

    const ligada = TV_LIGADA.includes(String(st.state));
    const fonte = String(st.attributes['source'] ?? st.attributes['app_name'] ?? '') || 'HDMI 1';
    const volume =
      st.attributes['volume_level'] != null ? Math.round(Number(st.attributes['volume_level']) * 100) : null;

    return html`
      <div class="titulo">
        <strong>${this._instancia?.name ?? 'TV'}</strong>
        <small>${ligada ? `Ligada · ${fonte}` : 'Desligada'}</small>
      </div>

      <div class="linha">
        <button
          class=${ligada ? 'is-on' : ''}
          @click=${() => this._servico('homeassistant', 'toggle', { entity_id: id })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${ligada ? 'Desligar' : 'Ligar'}
        </button>
        <button ?disabled=${!ligada} @click=${() => this._servico('media_player', 'media_play_pause', { entity_id: id })}>
          <bruno-icon icon="mdi:pause"></bruno-icon>Play / Pause
        </button>
      </div>

      ${ligada
        ? html`<div class="linha">
            <button @click=${() => this._servico('media_player', 'volume_down', { entity_id: id })}>
              <bruno-icon icon="mdi:volume-minus"></bruno-icon>
            </button>
            <span class="valor">${volume == null ? '—' : `${volume}%`}</span>
            <button @click=${() => this._servico('media_player', 'volume_up', { entity_id: id })}>
              <bruno-icon icon="mdi:volume-plus"></bruno-icon>
            </button>
            <button @click=${() => this._servico('media_player', 'volume_mute', { entity_id: id, is_volume_muted: !st.attributes['is_volume_muted'] })}>
              <bruno-icon icon="mdi:volume-mute"></bruno-icon>
            </button>
          </div>`
        : nothing}

      <div class="linha">
        <button @click=${() => this._maisInfo(id)}>
          <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>Mais detalhes
        </button>
      </div>
    `;
  }

  private _maisInfo(entityId: string | undefined): void {
    if (!entityId) return;
    this.dispatchEvent(
      new CustomEvent('hass-more-info', { detail: { entityId }, bubbles: true, composed: true }),
    );
  }
}

// ── Clima ────────────────────────────────────────────────────────────────────

export class ControleClima extends ControleBase {
  static override styles = [ControleBase.estilosComuns];

  override render() {
    const id = this._entityId;
    const st = this._estado(id);
    if (!st) return html`<p class="indisponivel">Entidade indisponível: ${id ?? '—'}</p>`;

    const ligado = CLIMATE_LIGADO.includes(String(st.state));
    const alvo = Number(st.attributes['temperature']);
    const atual = Number(st.attributes['current_temperature']);
    const min = Number.isFinite(Number(st.attributes['min_temp'])) ? Number(st.attributes['min_temp']) : 16;
    const max = Number.isFinite(Number(st.attributes['max_temp'])) ? Number(st.attributes['max_temp']) : 30;
    const passo = Number(st.attributes['target_temp_step']) || 1;
    const modos = Array.isArray(st.attributes['hvac_modes']) ? (st.attributes['hvac_modes'] as string[]) : [];

    const definir = (valor: number) =>
      this._servico('climate', 'set_temperature', {
        entity_id: id,
        temperature: Math.max(min, Math.min(max, valor)),
      });

    return html`
      <div class="titulo">
        <strong>${this._instancia?.name ?? 'Ar-condicionado'}</strong>
        <small>${ligado ? `${this._rotulo(st.state)} · ambiente ${Number.isFinite(atual) ? atual : '—'}°` : 'Desligado'}</small>
      </div>

      <div class="linha">
        <button
          class=${ligado ? 'is-on' : ''}
          @click=${() => this._servico('climate', ligado ? 'turn_off' : 'turn_on', { entity_id: id })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${ligado ? 'Desligar' : 'Ligar'}
        </button>
      </div>

      <div class="linha">
        <button ?disabled=${!ligado} @click=${() => definir((Number.isFinite(alvo) ? alvo : 22) - passo)}>
          <bruno-icon icon="mdi:minus"></bruno-icon>
        </button>
        <span class="valor">${Number.isFinite(alvo) ? `${alvo}°` : '—'}</span>
        <button ?disabled=${!ligado} @click=${() => definir((Number.isFinite(alvo) ? alvo : 22) + passo)}>
          <bruno-icon icon="mdi:plus"></bruno-icon>
        </button>
      </div>

      ${modos.length
        ? html`<div class="linha">
            ${modos.map(
              (m) => html`<button
                class=${String(st.state) === m ? 'is-on' : ''}
                @click=${() => this._servico('climate', 'set_hvac_mode', { entity_id: id, hvac_mode: m })}
              >
                ${this._rotulo(m)}
              </button>`,
            )}
          </div>`
        : nothing}
    `;
  }

  private _rotulo(modo: string): string {
    const nomes: Record<string, string> = {
      off: 'Desligado', cool: 'Frio', heat: 'Aquecimento', fan_only: 'Ventilar',
      dry: 'Secar', heat_cool: 'Auto', auto: 'Auto',
    };
    return nomes[String(modo).toLowerCase()] ?? modo;
  }
}

// ── Registro ─────────────────────────────────────────────────────────────────

if (!customElements.get('bruno-control-tv')) customElements.define('bruno-control-tv', ControleTv);
if (!customElements.get('bruno-control-climate')) customElements.define('bruno-control-climate', ControleClima);

function criar(tag: string) {
  return (instancia: DeviceInstanceConfig): HTMLElement => {
    const el = document.createElement(tag) as HTMLElement & { instancia?: DeviceInstanceConfig };
    el.instancia = instancia;
    return el;
  };
}

/** Idempotente: o módulo pode ser importado mais de uma vez no mesmo bundle. */
if (!deviceRegistry.conhece('media-tv')) {
  deviceRegistry.registrar({
    type: 'media-tv',
    label: 'TV',
    icon: 'mdi:television-classic',
    create: criar('bruno-control-tv'),
    entities: (i) => [typeof i.entity === 'string' ? i.entity : (i.entity?.[0] ?? '')].filter(Boolean),
    validate: (i) => ({
      ok: Boolean(i.entity),
      erros: i.entity ? [] : [`dispositivo "${i.id}": TV exige "entity"`],
    }),
  });
}

if (!deviceRegistry.conhece('climate')) {
  deviceRegistry.registrar({
    type: 'climate',
    label: 'Ar-condicionado',
    icon: 'mdi:air-conditioner',
    create: criar('bruno-control-climate'),
    entities: (i) => [typeof i.entity === 'string' ? i.entity : (i.entity?.[0] ?? '')].filter(Boolean),
    validate: (i) => ({
      ok: Boolean(i.entity),
      erros: i.entity ? [] : [`dispositivo "${i.id}": clima exige "entity"`],
    }),
  });
}
