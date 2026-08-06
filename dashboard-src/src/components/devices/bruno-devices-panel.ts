/**
 * Popup Dispositivos — ponto central de acesso rápido aos equipamentos da casa.
 *
 * Substitui o popup "Sistema", que renderizava literalmente "Módulo
 * indisponível". Organização inspirada em Savant, Control4 e Crestron: lista de
 * dispositivos agrupada à esquerda, controle do selecionado à direita.
 *
 * O ponto que define este componente: **ele não sabe o que é uma TV.** A lista
 * vem de `config/devices.config.ts` e cada controle vem do registry. Acrescentar
 * um aparelho é acrescentar uma entrada de configuração; acrescentar um TIPO de
 * aparelho é registrar um controle. Nos dois casos, este arquivo não muda.
 */

import { LitElement, html, css, nothing } from 'lit';
import type { Hass } from '@/models/home-assistant';
import {
  criarControle,
  entidadesDaInstancia,
  validarInstancias,
  resolverEntidade,
  agrupar,
  deviceRegistry,
  type DeviceInstanceConfig,
} from '@/application/device-registry';
import { DEVICES } from '@/config/devices.config';
import '@/components/devices/controls';
import { conectou, desconectou, medirRender } from '@/diagnostics/runtime/probe';

/** Nome deste componente no coletor de runtime (Fase 6.0). */
const SONDA = 'bruno-devices-panel';

/** Estados que fazem o dispositivo aparecer como ativo na lista. */
const ATIVO = ['on', 'playing', 'paused', 'idle', 'buffering', 'cool', 'heat', 'fan_only', 'dry', 'heat_cool', 'auto'];

export class BrunoDevicesPanel extends LitElement {
  static override properties = {
    _hass: { state: true },
    _selecionado: { state: true },
  };

  private _hass: Hass | undefined;
  private _selecionado = '';
  /** Elementos de controle reaproveitados: recriar perderia o estado interno. */
  private _controles = new Map<string, HTMLElement & { hass?: Hass }>();

  set hass(v: Hass) {
    this._hass = v;
    // Repassa o hass só aos controles já criados. Na Fase 6.1 isto passa a
    // comparar as entidades declaradas por cada um — a lista já vem do registry.
    for (const el of this._controles.values()) el.hass = v;
    this.requestUpdate();
  }

  private get _dispositivos(): readonly DeviceInstanceConfig[] {
    return DEVICES;
  }

  private _instancia(id: string): DeviceInstanceConfig | undefined {
    return this._dispositivos.find((d) => d.id === id);
  }

  /** O primeiro ativo abre por padrão; sem nenhum, o primeiro da lista. */
  private get _idAberto(): string {
    if (this._selecionado && this._instancia(this._selecionado)) return this._selecionado;
    const ativo = this._dispositivos.find((d) => this._estaAtivo(d));
    return ativo?.id ?? this._dispositivos[0]?.id ?? '';
  }

  private _estaAtivo(d: DeviceInstanceConfig): boolean {
    const id = resolverEntidade(d.entity, this._hass);
    const st = id && this._hass ? this._hass.states[id] : undefined;
    return Boolean(st) && ATIVO.includes(String(st?.state ?? '').toLowerCase());
  }

  /**
   * O controle do dispositivo aberto.
   *
   * Criado uma vez por instância e guardado. Tipo desconhecido não some nem
   * derruba a lista: vira uma entrada inválida, com o motivo à vista.
   */
  private _controleDe(id: string) {
    const inst = this._instancia(id);
    if (!inst) return nothing;

    if (!deviceRegistry.conhece(inst.type)) {
      return html`<p class="aviso">
        Tipo de dispositivo não registrado: <code>${inst.type}</code>.
        Registre o controle em <code>components/devices/controls.ts</code>.
      </p>`;
    }

    let el = this._controles.get(id);
    if (!el) {
      const criado = criarControle(inst) as (HTMLElement & { hass?: Hass }) | undefined;
      if (!criado) return nothing;
      el = criado;
      this._controles.set(id, el);
    }
    if (this._hass) el.hass = this._hass;
    return el;
  }

  override connectedCallback(): void {
    super.connectedCallback();
    conectou(SONDA);
  }

  override disconnectedCallback(): void {
    super.disconnectedCallback();
    desconectou(SONDA);
  }

  /** Mede o custo de cada atualizacao (Fase 6.0.1). */
  override update(mudancas: Map<string, unknown>): void {
    medirRender(SONDA, () => super.update(mudancas));
  }

  override render() {
    const validacao = validarInstancias(this._dispositivos);
    const aberto = this._idAberto;

    return html`
      <div class="painel" role="dialog" aria-modal="true" aria-label="Dispositivos">
        <header class="cabecalho">
          <span class="micro-icon tone-blue"><bruno-icon icon="mdi:remote"></bruno-icon></span>
          <div class="titulo"><strong>Dispositivos</strong><span>Controle rápido dos equipamentos</span></div>
          <button
            class="fechar"
            type="button"
            aria-label="Fechar"
            @click=${() => this.dispatchEvent(new CustomEvent('fechar', { bubbles: true, composed: true }))}
          >
            &times;
          </button>
        </header>

        ${validacao.ok
          ? nothing
          : html`<p class="aviso">
              Configuração de dispositivos com problema:
              ${validacao.erros.map((e) => html`<span>${e}</span>`)}
            </p>`}

        <div class="corpo">
          <nav class="lista" aria-label="Lista de dispositivos">
            ${agrupar(this._dispositivos).map(
              (g) => html`
                <div class="grupo">
                  <h3>${g.grupo}</h3>
                  ${g.itens.map((d) => {
                    const ativo = this._estaAtivo(d);
                    const selecionado = d.id === aberto;
                    return html`<button
                      type="button"
                      class="item ${selecionado ? 'is-selected' : ''} ${ativo ? 'is-active' : ''}"
                      aria-pressed=${selecionado ? 'true' : 'false'}
                      @click=${() => {
                        this._selecionado = d.id;
                        this.requestUpdate();
                      }}
                    >
                      <span class="item-icone">
                        <bruno-icon icon=${d.icon ?? deviceRegistry.obter(d.type)?.icon ?? 'mdi:remote'}></bruno-icon>
                      </span>
                      <span class="item-nome">${d.name}</span>
                      <span class="ponto" aria-hidden="true"></span>
                    </button>`;
                  })}
                </div>
              `,
            )}
          </nav>

          <section class="controle">${this._controleDe(aberto)}</section>
        </div>
      </div>
    `;
  }

  /** Diagnóstico: quais entidades este painel observa. Usado na Fase 6.1. */
  entidadesObservadas(): readonly string[] {
    return [...new Set(this._dispositivos.flatMap((d) => entidadesDaInstancia(d)))];
  }

  static override styles = css`
    /* Posicionamento IGUAL ao dos demais popups da rail.
       O overlay da shell é fixo cobrindo a tela, e a regra "config-panel" dela
       ancora os painéis 94px à esquerda e 74px acima da base — logo à direita
       da rail e acima do botão Power. Este componente entrou sem posicionamento
       nenhum e ficou colado no canto superior esquerdo.
       Não uso a classe "config-panel" de propósito: ela traz também largura de
       360px, fundo e blur próprios, que duplicariam a pele deste painel. */
    :host {
      display: block;
      position: absolute;
      left: 94px;
      bottom: 74px;
      width: min(760px, calc(100vw - 124px));
      max-height: 86vh;
    }
    @media (max-width: 800px) {
      /* No telefone a rail vira dock na base: o painel sobe e centraliza. */
      :host {
        left: 3vw;
        right: 3vw;
        bottom: 92px;
        width: auto;
      }
    }
    .painel {
      display: grid;
      grid-template-rows: auto auto minmax(0, 1fr);
      max-height: 86vh;
      border-radius: var(--bruno-liquid-card-radius, 20px);
      background: var(--bruno-josh-popup-background, var(--bruno-liquid-surface-off-background, rgba(20, 22, 28, 0.92)));
      border: var(--bruno-josh-popup-border, var(--bruno-liquid-surface-off-border, 1px solid rgba(255, 255, 255, 0.105)));
      box-shadow: var(--bruno-josh-popup-shadow, 0 24px 60px rgba(0, 0, 0, 0.42));
      backdrop-filter: var(--bruno-josh-popup-filter, blur(2px));
      -webkit-backdrop-filter: var(--bruno-josh-popup-filter, blur(2px));
      color: var(--text-main, rgba(255, 255, 255, 0.94));
      overflow: hidden;
    }
    .cabecalho {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .micro-icon {
      width: 34px;
      height: 34px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: rgba(96, 165, 250, 0.12);
      color: rgba(150, 205, 255, 0.96);
    }
    .micro-icon bruno-icon {
      --mdc-icon-size: 20px;
    }
    .titulo {
      flex: 1 1 auto;
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .titulo strong {
      font-size: 15px;
      font-weight: 700;
    }
    .titulo span {
      font-size: 11px;
      color: var(--text-soft, rgba(255, 255, 255, 0.58));
    }
    .fechar {
      font: inherit;
      color: inherit;
      cursor: pointer;
      width: 34px;
      height: 34px;
      border: 0;
      border-radius: 50%;
      background: transparent;
      font-size: 22px;
      line-height: 1;
    }
    .fechar:hover {
      background: rgba(255, 255, 255, 0.06);
    }
    .aviso {
      margin: 0;
      padding: 10px 16px;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      color: rgba(255, 196, 120, 0.95);
      background: rgba(255, 170, 60, 0.08);
    }
    .aviso code {
      font-family: inherit;
      font-weight: 700;
    }
    .corpo {
      display: grid;
      grid-template-columns: minmax(0, 240px) minmax(0, 1fr);
      min-height: 0;
    }
    .lista {
      min-height: 0;
      overflow-y: auto;
      padding: 12px 10px;
      border-right: 1px solid rgba(255, 255, 255, 0.07);
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .grupo h3 {
      margin: 0 0 6px 8px;
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--text-soft, rgba(255, 255, 255, 0.5));
    }
    .item {
      font: inherit;
      color: inherit;
      cursor: pointer;
      width: 100%;
      display: grid;
      grid-template-columns: 30px minmax(0, 1fr) 10px;
      align-items: center;
      gap: 10px;
      min-height: 46px;
      padding: 0 10px;
      border: 1px solid transparent;
      border-radius: var(--bruno-liquid-cell-radius, 12px);
      background: transparent;
      text-align: left;
    }
    .item:hover {
      background: rgba(255, 255, 255, 0.04);
    }
    .item.is-selected {
      background: var(--bruno-liquid-control-background, rgba(255, 255, 255, 0.05));
      border-color: rgba(255, 255, 255, 0.12);
    }
    .item-icone {
      display: grid;
      place-items: center;
      color: rgba(255, 255, 255, 0.7);
    }
    .item-icone bruno-icon {
      --mdc-icon-size: 22px;
    }
    .item.is-active .item-icone {
      color: rgba(150, 205, 255, 0.98);
    }
    .item-nome {
      min-width: 0;
      font-size: 14px;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ponto {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: transparent;
    }
    .item.is-active .ponto {
      background: rgba(96, 165, 250, 0.95);
      box-shadow: 0 0 10px rgba(96, 165, 250, 0.5);
    }
    .controle {
      min-height: 0;
      overflow-y: auto;
      padding: 16px;
    }

    /* Telefone: a lista vira uma faixa horizontal acima do controle. */
    @media (max-width: 800px) {
      /* A largura do telefone ja e definida no bloco :host do topo. */
      .corpo {
        grid-template-columns: minmax(0, 1fr);
      }
      .lista {
        flex-direction: row;
        overflow-x: auto;
        border-right: 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.07);
      }
      .grupo {
        display: flex;
        flex-direction: column;
      }
      .item {
        width: auto;
        grid-template-columns: 30px auto;
      }
      .ponto {
        display: none;
      }
    }
  `;
}

if (!customElements.get('bruno-devices-panel')) {
  customElements.define('bruno-devices-panel', BrunoDevicesPanel);
}
