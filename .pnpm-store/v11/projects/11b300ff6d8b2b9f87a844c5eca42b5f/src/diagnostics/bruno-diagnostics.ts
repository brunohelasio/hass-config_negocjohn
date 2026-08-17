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
import { instantaneo } from './runtime';
import { marcar } from './runtime/probe';
import { sondarCameras, sondarCamerasProfundo, type SondagemDeCameras } from './runtime/camera-probe';

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
        height: 100%;
        min-height: 0;
        font-family: ui-sans-serif, system-ui, sans-serif;
        color: var(--primary-text-color, #eee);
      }
      .card {
        box-sizing: border-box;
        height: 100%;
        max-height: 100%;
        overflow-y: auto;
        overscroll-behavior-y: contain;
        scrollbar-width: thin;
        scrollbar-color: rgba(255, 255, 255, 0.22) transparent;
        background: var(--ha-card-background, rgba(115, 115, 115, 0.2));
        border: var(--hairline) solid rgba(255, 255, 255, 0.105);
        border-radius: var(--r-lg);
        padding: var(--s-5);
        display: grid;
        gap: var(--s-4);
      }
      .card::-webkit-scrollbar {
        width: 6px;
      }
      .card::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.22);
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
      .acoes {
        display: flex;
        gap: var(--s-2);
        margin-top: var(--s-3);
      }
      .acoes button {
        font: inherit;
        color: inherit;
        cursor: pointer;
        padding: var(--s-2) var(--s-4);
        border-radius: var(--r-sm, 8px);
        border: var(--hairline) solid rgba(255, 255, 255, 0.16);
        background: rgba(255, 255, 255, 0.04);
      }
      .empty {
        font-size: var(--t-sm);
        opacity: 0.7;
      }
      /* Quem acordou o componente (Fase 6.1) — subordinado à linha do render. */
      .motivos {
        font-size: var(--t-sm);
        opacity: 0.62;
      }
    `,
  ];

  private _row(label: string, value: string, cls = '') {
    return html`<div class="row">
      <dt>${label}</dt>
      <dd class=${cls}>${value}</dd>
    </div>`;
  }

  /**
   * Fase 6.0 — a baseline de runtime, legível NO TABLET.
   *
   * Sem esta seção os números só existiriam em `window.brunoRuntime`, e a 6.0
   * exige coleta no aparelho — onde não há console à mão. O botão copia o JSON
   * inteiro para a área de transferência.
   */
  private _runtime() {
    const s = instantaneo();
    const mb = (b: number) => (b / 1048576).toFixed(1) + ' MB';
    const ms = (v: number) => v.toFixed(1) + ' ms';
    const vaza = s.vazamentos;
    // ANTERIOR (rollback 6.1): `vaza.instancias` entrava nesta soma, e por isso
    // o painel do tablet marcava "Aberto e não fechado: 8" com os 8 ladrilhos da
    // Home montados e visíveis. Componente na tela não é vazamento. Ver o
    // cabeçalho de runtime/collector.ts.
    const total = vaza.timers + vaza.listeners + vaza.assinaturas;
    const marca = s.desdeAMarca;
    const sobrouDaMarca = marca
      ? marca.instancias + marca.timers + marca.listeners + marca.assinaturas
      : 0;

    return html`
      <div>
        <h2>Runtime</h2>
        <dl>
          ${this._row('Build medido', s.build)}
          ${this._row('Desde o carregamento', (s.desdeOCarregamento / 1000).toFixed(0) + ' s')}
          ${this._row('Timers vivos', String(s.timersVivos))}
          ${this._row(
            'Memória usada',
            s.memoria.ultima ? mb(s.memoria.ultima.usado) : 'sem leitura',
            s.memoria.ultima ? '' : 'warn',
          )}
          ${this._row(
            'Piso da memória',
            s.memoria.amostras
              ? `${mb(s.memoria.piso)} · pico ${mb(s.memoria.pico)} · ${s.memoria.degraus} degrau(s)`
              : '—',
            s.memoria.degraus < 2 ? 'warn' : '',
          )}
          ${this._row(
            'Crescimento do piso',
            s.memoria.amostras > 1 ? mb(s.memoria.crescimentoDoPiso) : '—',
            s.memoria.crescimentoDoPiso > 10 * 1048576 ? 'warn' : 'ok',
          )}
          ${this._row(
            'Tarefas longas',
            `${s.tarefasLongas.naCarga} na carga · ${s.tarefasLongas.depoisDaCarga} depois ` +
              `(${s.tarefasLongas.porMinuto}/min) · pior ${s.tarefasLongas.pior} ms`,
            s.tarefasLongas.depoisDaCarga === 0 ? 'ok' : 'warn',
          )}
          ${this._row(
            'Vazando (timer/listener/assinatura)',
            String(total),
            total === 0 ? 'ok' : 'warn',
          )}
          ${this._row('Componentes montados', String(s.vivos))}
          ${marca
            ? this._row(
                'Sobrou desde a marca',
                `${marca.instancias} inst · ${marca.timers} timers · ` +
                  `${marca.listeners} listeners · ${marca.assinaturas} assin.`,
                sobrouDaMarca === 0 ? 'ok' : 'warn',
              )
            : nothing}
        </dl>

        <p class="empty">${s.memoria.veredito}</p>

        ${s.componentes.length
          ? html`<ul>
              ${s.componentes.map(
                (c) => html`<li>
                  <strong>${c.nome}</strong> — ${c.render.total} renders
                  (média ${c.render.total ? ms(c.render.duracaoTotal / c.render.total) : '0.0 ms'},
                  pior ${ms(c.render.pior)}) ·
                  vivos: ${c.vivos} ·
                  timers ${c.timers.criados - c.timers.encerrados} ·
                  listeners ${c.listeners.criados - c.listeners.encerrados}
                  ${c.requisicoes.total
                    ? html` · ${c.requisicoes.total} req (${c.requisicoes.falhas} falhas, pior ${ms(c.requisicoes.pior)})`
                    : nothing}
                  ${c.motivos.length
                    ? html`<br /><span class="motivos"
                        >acordado por:
                        ${c.motivos.map((m) => `${m.motivo} (${m.total})`).join(' · ')}</span
                      >`
                    : nothing}
                </li>`,
              )}
            </ul>`
          : html`<p class="empty">Nenhum componente instrumentado ainda.</p>`}

        <div class="acoes">
          <button type="button" @click=${() => this._copiarBaseline()}>Copiar baseline</button>
          <button type="button" @click=${() => this._marcar()}>Marcar ciclo</button>
          <button type="button" @click=${() => this.requestUpdate()}>Atualizar</button>
        </div>
        ${this._mensagem ? html`<p class="empty">${this._mensagem}</p>` : nothing}
      </div>
    `;
  }

  /**
   * Congela a contagem atual como referência do ciclo de navegação.
   *
   * O aceite da Fase 6.1: marcar aqui, percorrer as seções 50 vezes, voltar e
   * conferir que "Sobrou desde a marca" está zerado em tudo. Sem a marca só
   * restaria zerar o coletor, o que apagaria justamente a medição de render que
   * se quer comparar.
   */
  private _marcar(): void {
    const m = marcar();
    this._mensagem =
      `Marca posta: ${m.instancias} instâncias, ${m.timers} timers, ` +
      `${m.listeners} listeners. Navegue e volte aqui.`;
    this.requestUpdate();
  }

  /**
   * Fase 6.0.5 — capacidade real das câmeras.
   *
   * Responde, antes de escrever qualquer player, se este Home Assistant
   * consegue WebRTC ou se o único caminho é HLS transcodificado na VM.
   */
  /** Resultado da sondagem profunda, quando ja respondeu. */
  private _sondaProfunda: SondagemDeCameras | undefined;
  private _sondando = false;

  private _cameras() {
    // A leitura por atributo e imediata; a profunda pergunta ao HA pelo
    // WebSocket e chega depois. Dispara uma vez e redesenha ao responder.
    if (!this._sondaProfunda && !this._sondando && this._hass) {
      this._sondando = true;
      void sondarCamerasProfundo(this._hass).then((r) => {
        this._sondaProfunda = r;
        this._sondando = false;
        this.requestUpdate();
      });
    }
    const s = this._sondaProfunda ?? sondarCameras(this._hass);
    if (!s.cameras.length) return nothing;
    return html`
      <div>
        <h2>Câmeras — capacidade</h2>
        <dl>
          ${this._row('Total', String(s.cameras.length))}
          ${this._row('WebRTC', String(s.resumo.web_rtc), s.resumo.web_rtc ? 'ok' : '')}
          ${this._row('HLS (transcodifica na VM)', String(s.resumo.hls), s.resumo.hls ? 'warn' : '')}
          ${this._row('Só instantâneo', String(s.resumo.instantaneo))}
          ${this._row('Fora do ar', String(s.resumo.indisponivel), s.resumo.indisponivel ? 'bad' : 'ok')}
        </dl>
        <p class="empty">${s.veredito}</p>
        <ul>
          ${s.cameras.map((c) => html`<li>${c.entityId} → ${c.caminho}${c.suportaStream ? ' · stream' : ''}</li>`)}
        </ul>
      </div>
    `;
  }

  private _mensagem = '';

  /**
   * Copia a baseline para a área de transferência.
   *
   * `navigator.clipboard` exige contexto seguro; a WebView do tablet acessa o HA
   * por HTTP na rede local, onde ele nem sempre existe. Por isso o caminho
   * alternativo com `textarea` + `execCommand`, que continua funcionando ali.
   */
  private async _copiarBaseline(): Promise<void> {
    const texto = JSON.stringify(instantaneo(), null, 2);
    try {
      await navigator.clipboard.writeText(texto);
      this._mensagem = 'Baseline copiada.';
    } catch {
      const area = document.createElement('textarea');
      area.value = texto;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      this.shadowRoot?.appendChild(area);
      area.select();
      const ok = document.execCommand('copy');
      area.remove();
      this._mensagem = ok ? 'Baseline copiada.' : 'Não foi possível copiar — use brunoRuntime.texto().';
    }
    this.requestUpdate();
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
        ${this._runtime()}
        ${this._cameras()}
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
