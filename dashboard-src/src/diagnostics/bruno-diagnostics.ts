import { LitElement, html, css, nothing } from 'lit';
import { scaleTokens } from '@/styles/tokens/scale';
import type { Hass } from '@/models/home-assistant';
import {
  checkConfiguredEntities,
  checarDependencias,
  readEnvironment,
  type EntityCheckResult,
  type EnvironmentInfo,
} from './entity-check';

/**
 * Painel de diagnóstico — primeiro componente da arquitetura nova.
 *
 * Escolhido como piloto por ser somente-leitura (não aciona nada na casa), por
 * provar a cadeia inteira — TypeScript, Lit, build, deploy, registro do custom
 * element — e por entregar duas medidas que faltavam: o viewport CSS e quais
 * entidades configuradas não existem mais no Home Assistant.
 *
 * Uso no Lovelace:
 *     type: custom:bruno-diagnostics
 */
export class BrunoDiagnostics extends LitElement {
  static override properties = {
    _hass: { state: true },
  };

  private _hass?: Hass;
  private _env: EnvironmentInfo = readEnvironment();

  /** O HA injeta `hass` por setter em todo custom card. */
  set hass(hass: Hass) {
    this._hass = hass;
  }

  setConfig(_config: unknown): void {
    // Sem opções por enquanto; o HA exige que o método exista.
  }

  getCardSize(): number {
    return 4;
  }

  static override styles = [
    scaleTokens,
    css`
      :host {
        display: block;
        font-family: ui-sans-serif, system-ui, sans-serif;
        color: var(--primary-text-color, #eee);
      }
      .card {
        background: var(--ha-card-background, rgba(115, 115, 115, 0.2));
        border: var(--hairline) solid rgba(255, 255, 255, 0.105);
        border-radius: var(--r-lg);
        padding: var(--s-5);
        display: grid;
        gap: var(--s-4);
      }
      h2 {
        margin: 0;
        font-size: var(--t-lg);
        font-weight: 600;
        letter-spacing: -0.01em;
      }
      .build {
        font-size: var(--t-xs);
        opacity: 0.6;
        font-variant-numeric: tabular-nums;
      }
      dl {
        margin: 0;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr));
        gap: var(--s-2) var(--s-5);
      }
      .row {
        display: flex;
        justify-content: space-between;
        gap: var(--s-3);
        padding-block: var(--s-1);
        border-bottom: var(--hairline) solid rgba(255, 255, 255, 0.06);
      }
      dt {
        font-size: var(--t-sm);
        opacity: 0.7;
      }
      dd {
        margin: 0;
        font-size: var(--t-sm);
        font-weight: 600;
        font-variant-numeric: tabular-nums;
        text-align: right;
      }
      .ok {
        color: #4ade80;
      }
      .warn {
        color: #fbbf24;
      }
      .bad {
        color: #f87171;
      }
      ul {
        margin: 0;
        padding-left: var(--s-5);
        display: grid;
        gap: var(--s-1);
      }
      li {
        font-size: var(--t-xs);
        font-family: ui-monospace, monospace;
      }
      .empty {
        font-size: var(--t-sm);
        opacity: 0.7;
      }
    `,
  ];

  private _row(label: string, value: string, cls = '') {
    return html`<div class="row">
      <dt>${label}</dt>
      <dd class=${cls}>${value}</dd>
    </div>`;
  }

  override render() {
    const env = this._env;
    const check: EntityCheckResult = checkConfiguredEntities(this._hass);
    const missing = check.issues.filter((i) => i.problem === 'missing');
    const unavailable = check.issues.filter((i) => i.problem === 'unavailable');
    // Gate da Fase 5e.3: o que o dashboard espera do HA e nao pode criar.
    const dependencias = checarDependencias(this._hass);

    return html`
      <div class="card">
        <div>
          <h2>Diagnóstico</h2>
          <div class="build">build ${env.buildId}</div>
        </div>

        <dl>
          ${this._row('Viewport CSS', env.viewportCss)}
          ${this._row('Tela física', env.screenPhysical)}
          ${this._row('Densidade de pixels', `${env.devicePixelRatio}×`)}
          ${this._row(
            'Container queries',
            env.containerQueries ? 'suportado' : 'AUSENTE',
            env.containerQueries ? 'ok' : 'bad',
          )}
          ${this._row('Movimento reduzido', env.reducedMotion ? 'ativo' : 'não')}
          ${this._row(
            'Entidades configuradas',
            `${check.ok} / ${check.total}`,
            check.issues.length === 0 ? 'ok' : 'warn',
          )}
          ${this._row(
            'Não existem no HA',
            String(missing.length),
            missing.length === 0 ? 'ok' : 'bad',
          )}
          ${this._row(
            'Indisponíveis agora',
            String(unavailable.length),
            unavailable.length === 0 ? 'ok' : 'warn',
          )}
          ${this._row(
            'Dependências do HA ausentes',
            String(dependencias.length),
            dependencias.length === 0 ? 'ok' : 'warn',
          )}
        </dl>

        ${dependencias.length > 0
          ? html`
              <div>
                <h2>Dependências que o dashboard não cria</h2>
                <p>
                  Criar estes itens é configuração do Home Assistant. O dashboard
                  registra a falta e não atua fora do frontend.
                </p>
                <ul>
                  ${dependencias.map(
                    (d) => html`<li class="warn">
                      ${d.tipo} · ${d.nome} → ${d.entityId}<br /><small>${d.comoResolver}</small>
                    </li>`,
                  )}
                </ul>
              </div>
            `
          : nothing}

        ${missing.length > 0
          ? html`
              <div>
                <h2>Entidades inexistentes</h2>
                <ul>
                  ${missing.map(
                    (i) => html`<li class="bad">${i.roomId} · ${i.field} → ${i.entityId}</li>`,
                  )}
                </ul>
              </div>
            `
          : nothing}
        ${unavailable.length > 0
          ? html`
              <div>
                <h2>Indisponíveis</h2>
                <ul>
                  ${unavailable.map(
                    (i) => html`<li class="warn">${i.roomId} · ${i.field} → ${i.entityId}</li>`,
                  )}
                </ul>
              </div>
            `
          : nothing}
        ${!this._hass ? html`<p class="empty">Aguardando o objeto hass…</p>` : nothing}
      </div>
    `;
  }
}

if (!customElements.get('bruno-diagnostics')) {
  customElements.define('bruno-diagnostics', BrunoDiagnostics);
}

// Registro no seletor de cards do Lovelace.
interface CustomCardEntry {
  type: string;
  name: string;
  description: string;
}
const w = window as unknown as { customCards?: CustomCardEntry[] };
w.customCards = w.customCards ?? [];
if (!w.customCards.some((c) => c.type === 'bruno-diagnostics')) {
  w.customCards.push({
    type: 'bruno-diagnostics',
    name: 'Bruno · Diagnóstico',
    description: 'Build, viewport, capacidades e validação das entidades configuradas.',
  });
}
