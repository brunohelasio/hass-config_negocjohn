function ca() {
  return { criados: 0, encerrados: 0 };
}
function Ve(r) {
  return {
    nome: r,
    instancias: ca(),
    render: { total: 0, duracaoTotal: 0, ultima: 0, pior: 0 },
    motivos: /* @__PURE__ */ new Map(),
    timers: ca(),
    listeners: ca(),
    assinaturas: ca(),
    requisicoes: { total: 0, falhas: 0, duracaoTotal: 0, pior: 0 }
  };
}
const je = 720, Fe = 200, Be = 24, Ue = 4, Ha = 3e4, Ge = 12, qa = 10 * 1024 * 1024, He = 64;
function ka(r) {
  let a = Number.POSITIVE_INFINITY;
  for (const e of r) e.usado < a && (a = e.usado);
  return Number.isFinite(a) ? a : 0;
}
class Ye {
  constructor() {
    this.componentes = /* @__PURE__ */ new Map(), this.memoria = [], this.tarefas = [], this.inicio = 0, this.buildId = "desconhecido", this.tarefasTotal = 0, this.tarefasDuracao = 0, this.tarefasPior = 0, this.tarefasNaCarga = 0, this.pisoGlobal = Number.POSITIVE_INFINITY, this.picoGlobal = 0, this.valoresDeMemoria = /* @__PURE__ */ new Set();
  }
  /** Marca zero do relógio. Chamado uma vez, por quem inicia os observadores. */
  iniciar(a, e) {
    this.inicio = a, this.buildId = e;
  }
  de(a) {
    let e = this.componentes.get(a);
    return e || (e = Ve(a), this.componentes.set(a, e)), e;
  }
  // ── Pontos de coleta ──────────────────────────────────────────────────────
  conectou(a) {
    this.de(a).instancias.criados++;
  }
  desconectou(a) {
    this.de(a).instancias.encerrados++;
  }
  /**
   * Um render aconteceu.
   *
   * `motivo` é opcional porque nem todo componente sabe dizer o que o acordou —
   * mas os que sabem transformam "renderizou 3.328 vezes" em "renderizou 3.328
   * vezes por causa de `sensor.X`", que é acionável.
   */
  renderizou(a, e, o) {
    const i = this.de(a), t = i.render;
    if (t.total++, t.duracaoTotal += e, t.ultima = e, e > t.pior && (t.pior = e), !o) return;
    const n = i.motivos.has(o) || i.motivos.size < Be ? o : "outros";
    i.motivos.set(n, (i.motivos.get(n) ?? 0) + 1);
  }
  timerCriado(a) {
    this.de(a).timers.criados++;
  }
  timerEncerrado(a) {
    this.de(a).timers.encerrados++;
  }
  listenerCriado(a) {
    this.de(a).listeners.criados++;
  }
  listenerEncerrado(a) {
    this.de(a).listeners.encerrados++;
  }
  assinou(a) {
    this.de(a).assinaturas.criados++;
  }
  desassinou(a) {
    this.de(a).assinaturas.encerrados++;
  }
  requisicao(a, e, o) {
    const i = this.de(a).requisicoes;
    i.total++, o || i.falhas++, i.duracaoTotal += e, e > i.pior && (i.pior = e);
  }
  memoriaAmostrada(a) {
    this.memoria.push(a), this.memoria.length > je && this.memoria.shift(), a.usado < this.pisoGlobal && (this.pisoGlobal = a.usado), a.usado > this.picoGlobal && (this.picoGlobal = a.usado), this.valoresDeMemoria.size < He && this.valoresDeMemoria.add(a.usado);
  }
  tarefaLonga(a) {
    this.tarefas.push(a), this.tarefas.length > Fe && this.tarefas.shift(), this.tarefasTotal++, this.tarefasDuracao += a.duracao, a.duracao > this.tarefasPior && (this.tarefasPior = a.duracao), a.em < Ha && this.tarefasNaCarga++;
  }
  // ── Ciclo de navegação ────────────────────────────────────────────────────
  /**
   * Congela a contagem atual como referência.
   *
   * O teste da 6.1 é: marcar, navegar 50 vezes por todas as seções, voltar ao
   * ponto de partida e conferir que `desdeAMarca` é zero em tudo. Sem a marca, a
   * única alternativa seria zerar o coletor — o que apagaria a medição de render
   * que se quer justamente comparar.
   */
  marcar(a) {
    return this.marca = this.contagem(), this.marca;
  }
  limparMarca() {
    this.marca = void 0;
  }
  contagem() {
    const a = (e) => {
      let o = 0;
      for (const i of this.componentes.values()) o += e(i).criados - e(i).encerrados;
      return o;
    };
    return {
      instancias: a((e) => e.instancias),
      timers: a((e) => e.timers),
      listeners: a((e) => e.listeners),
      assinaturas: a((e) => e.assinaturas)
    };
  }
  // ── Leitura ───────────────────────────────────────────────────────────────
  leituraDeMemoria() {
    const a = this.memoria, e = a[0], o = a[a.length - 1], i = a.length, t = Math.max(1, Math.floor(i / 3)), n = i ? ka(a.slice(0, t)) : 0, c = i ? ka(a.slice(i - t)) : 0, s = c - n, l = this.valoresDeMemoria.size, m = i ? ka(a.slice(t, i - t)) : 0, d = c - m;
    let u;
    return i < Ge ? u = `Só ${i} amostra(s) — o piso ainda não significa nada.` : l < 2 ? u = `${i} amostras, mas um único valor de heap: o navegador ainda não atualizou a leitura. Sem informação — precisa de sessão longa.` : s > qa && d > qa ? u = `Piso subiu ${(s / 1048576).toFixed(1)} MB e AINDA sobe (${(d / 1048576).toFixed(1)} MB no último terço) — isto é retenção.` : s > qa ? u = `Subiu ${(s / 1048576).toFixed(1)} MB desde a carga e estabilizou em ${(c / 1048576).toFixed(0)} MB — é custo de partida, não vazamento.` : u = `Piso estável em ${l} degraus — a variação do heap é coleta de lixo, não vazamento.`, {
      amostras: i,
      ...e ? { primeira: e } : {},
      ...o ? { ultima: o } : {},
      crescimento: e && o ? o.usado - e.usado : 0,
      piso: Number.isFinite(this.pisoGlobal) ? this.pisoGlobal : 0,
      pico: this.picoGlobal,
      pisoInicial: n,
      pisoFinal: c,
      crescimentoDoPiso: s,
      degraus: l,
      veredito: u
    };
  }
  leituraDeTarefas(a) {
    const e = this.tarefasTotal - this.tarefasNaCarga, o = Math.max(0, a - Ha) / 6e4;
    return {
      total: this.tarefasTotal,
      duracaoTotal: Math.round(this.tarefasDuracao),
      pior: Math.round(this.tarefasPior),
      naCarga: this.tarefasNaCarga,
      depoisDaCarga: e,
      porMinuto: o > 0 ? Number((e / o).toFixed(1)) : 0
    };
  }
  /**
   * Fotografia do estado atual.
   *
   * `vazamentos` é a leitura de alarme: timer, listener ou assinatura que
   * sobrou. Zero é o alvo sempre. `vivos` e `desdeAMarca` são as leituras de
   * contexto — a primeira diz o que está montado, a segunda diz se navegar
   * deixou lixo.
   */
  instantaneo(a) {
    const o = [...this.componentes.values()].sort(
      (c, s) => c.nome.localeCompare(s.nome)
    ).map((c) => ({
      nome: c.nome,
      instancias: { ...c.instancias },
      vivos: c.instancias.criados - c.instancias.encerrados,
      render: { ...c.render },
      motivos: [...c.motivos.entries()].map(([s, l]) => ({ motivo: s, total: l })).sort((s, l) => l.total - s.total).slice(0, Ue),
      timers: { ...c.timers },
      listeners: { ...c.listeners },
      assinaturas: { ...c.assinaturas },
      requisicoes: { ...c.requisicoes }
    })), i = this.contagem(), t = Math.round(a - this.inicio), n = this.marca;
    return {
      formato: 2,
      build: this.buildId,
      capturadoEm: (/* @__PURE__ */ new Date()).toISOString(),
      desdeOCarregamento: t,
      componentes: o,
      memoria: this.leituraDeMemoria(),
      tarefasLongas: this.leituraDeTarefas(t),
      vazamentos: {
        timers: i.timers,
        listeners: i.listeners,
        assinaturas: i.assinaturas
      },
      vivos: i.instancias,
      ...n ? {
        desdeAMarca: {
          instancias: i.instancias - n.instancias,
          timers: i.timers - n.timers,
          listeners: i.listeners - n.listeners,
          assinaturas: i.assinaturas - n.assinaturas
        }
      } : {}
    };
  }
  /** Zera tudo. Usado antes de um ciclo de medição. */
  zerar() {
    this.componentes.clear(), this.memoria.length = 0, this.tarefas.length = 0, this.marca = void 0, this.tarefasTotal = 0, this.tarefasDuracao = 0, this.tarefasPior = 0, this.tarefasNaCarga = 0, this.pisoGlobal = Number.POSITIVE_INFINITY, this.picoGlobal = 0, this.valoresDeMemoria.clear();
  }
}
const y = new Ye(), Xe = 5e3, J = { timerMemoria: void 0, observador: void 0 };
function Qe() {
  const r = performance;
  if (r.memory)
    return { usado: r.memory.usedJSHeapSize, limite: r.memory.jsHeapSizeLimit };
}
function We(r) {
  if (J.timerMemoria !== void 0 || J.observador !== void 0) return;
  y.iniciar(performance.now(), r);
  const a = () => {
    const e = Qe();
    e && y.memoriaAmostrada({ em: Math.round(performance.now()), ...e });
  };
  if (a(), J.timerMemoria = window.setInterval(a, Xe), "PerformanceObserver" in window)
    try {
      const e = new PerformanceObserver((o) => {
        for (const i of o.getEntries())
          y.tarefaLonga({
            em: Math.round(i.startTime),
            duracao: Math.round(i.duration)
          });
      });
      e.observe({ entryTypes: ["longtask"] }), J.observador = e;
    } catch {
    }
}
function Ze() {
  return J.timerMemoria !== void 0;
}
const oa = /* @__PURE__ */ new Map();
function D(r, a, e) {
  const o = window.setTimeout(() => {
    oa.delete(o), y.timerEncerrado(r), a();
  }, e);
  return oa.set(o, "espera"), y.timerCriado(r), o;
}
function z(r, a) {
  if (a === void 0) return;
  const e = oa.get(a);
  e !== void 0 && (e === "intervalo" ? window.clearInterval(a) : window.clearTimeout(a), oa.delete(a), y.timerEncerrado(r));
}
function Je() {
  return oa.size;
}
function la(r, a, e, o, i) {
  a.addEventListener(e, o, i), y.listenerCriado(r);
}
function da(r, a, e, o, i) {
  a.removeEventListener(e, o, i), y.listenerEncerrado(r);
}
function G(r, a, e) {
  y.requisicao(r, a, e);
}
function Ia(r) {
  y.conectou(r);
}
function Da(r) {
  y.desconectou(r);
}
function Ra(r, a, e) {
  const o = performance.now();
  try {
    return a();
  } finally {
    y.renderizou(r, performance.now() - o, e);
  }
}
function ge() {
  return y.marcar(performance.now());
}
function Ke() {
  y.limparMarca();
}
function ao() {
  try {
    const r = import.meta.url;
    return r.slice(r.lastIndexOf("/") + 1) || "desconhecido";
  } catch {
    return "desconhecido";
  }
}
function ha() {
  return { ...y.instantaneo(performance.now()), timersVivos: Je() };
}
function eo() {
  if (Ze()) return;
  We(ao());
  const r = {
    instantaneo: ha,
    texto: () => JSON.stringify(ha(), null, 2),
    zerar: () => y.zerar(),
    marcar: ge,
    limparMarca: Ke
  };
  globalThis.brunoRuntime = r;
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ua = globalThis, Na = ua.ShadowRoot && (ua.ShadyCSS === void 0 || ua.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Pa = Symbol(), Ya = /* @__PURE__ */ new WeakMap();
let be = class {
  constructor(a, e, o) {
    if (this._$cssResult$ = !0, o !== Pa) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = a, this.t = e;
  }
  get styleSheet() {
    let a = this.o;
    const e = this.t;
    if (Na && a === void 0) {
      const o = e !== void 0 && e.length === 1;
      o && (a = Ya.get(e)), a === void 0 && ((this.o = a = new CSSStyleSheet()).replaceSync(this.cssText), o && Ya.set(e, a));
    }
    return a;
  }
  toString() {
    return this.cssText;
  }
};
const oo = (r) => new be(typeof r == "string" ? r : r + "", void 0, Pa), _ = (r, ...a) => {
  const e = r.length === 1 ? r[0] : a.reduce((o, i, t) => o + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + r[t + 1], r[0]);
  return new be(e, r, Pa);
}, io = (r, a) => {
  if (Na) r.adoptedStyleSheets = a.map((e) => e instanceof CSSStyleSheet ? e : e.styleSheet);
  else for (const e of a) {
    const o = document.createElement("style"), i = ua.litNonce;
    i !== void 0 && o.setAttribute("nonce", i), o.textContent = e.cssText, r.appendChild(o);
  }
}, Xa = Na ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((a) => {
  let e = "";
  for (const o of a.cssRules) e += o.cssText;
  return oo(e);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: to, defineProperty: ro, getOwnPropertyDescriptor: no, getOwnPropertyNames: so, getOwnPropertySymbols: co, getPrototypeOf: lo } = Object, _a = globalThis, Qa = _a.trustedTypes, po = Qa ? Qa.emptyScript : "", mo = _a.reactiveElementPolyfillSupport, K = (r, a) => r, Ta = { toAttribute(r, a) {
  switch (a) {
    case Boolean:
      r = r ? po : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, a) {
  let e = r;
  switch (a) {
    case Boolean:
      e = r !== null;
      break;
    case Number:
      e = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        e = JSON.parse(r);
      } catch {
        e = null;
      }
  }
  return e;
} }, fe = (r, a) => !to(r, a), Wa = { attribute: !0, type: String, converter: Ta, reflect: !1, useDefault: !1, hasChanged: fe };
Symbol.metadata ??= Symbol("metadata"), _a.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let H = class extends HTMLElement {
  static addInitializer(a) {
    this._$Ei(), (this.l ??= []).push(a);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(a, e = Wa) {
    if (e.state && (e.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(a) && ((e = Object.create(e)).wrapped = !0), this.elementProperties.set(a, e), !e.noAccessor) {
      const o = Symbol(), i = this.getPropertyDescriptor(a, o, e);
      i !== void 0 && ro(this.prototype, a, i);
    }
  }
  static getPropertyDescriptor(a, e, o) {
    const { get: i, set: t } = no(this.prototype, a) ?? { get() {
      return this[e];
    }, set(n) {
      this[e] = n;
    } };
    return { get: i, set(n) {
      const c = i?.call(this);
      t?.call(this, n), this.requestUpdate(a, c, o);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(a) {
    return this.elementProperties.get(a) ?? Wa;
  }
  static _$Ei() {
    if (this.hasOwnProperty(K("elementProperties"))) return;
    const a = lo(this);
    a.finalize(), a.l !== void 0 && (this.l = [...a.l]), this.elementProperties = new Map(a.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(K("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(K("properties"))) {
      const e = this.properties, o = [...so(e), ...co(e)];
      for (const i of o) this.createProperty(i, e[i]);
    }
    const a = this[Symbol.metadata];
    if (a !== null) {
      const e = litPropertyMetadata.get(a);
      if (e !== void 0) for (const [o, i] of e) this.elementProperties.set(o, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [e, o] of this.elementProperties) {
      const i = this._$Eu(e, o);
      i !== void 0 && this._$Eh.set(i, e);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(a) {
    const e = [];
    if (Array.isArray(a)) {
      const o = new Set(a.flat(1 / 0).reverse());
      for (const i of o) e.unshift(Xa(i));
    } else a !== void 0 && e.push(Xa(a));
    return e;
  }
  static _$Eu(a, e) {
    const o = e.attribute;
    return o === !1 ? void 0 : typeof o == "string" ? o : typeof a == "string" ? a.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((a) => this.enableUpdating = a), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((a) => a(this));
  }
  addController(a) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(a), this.renderRoot !== void 0 && this.isConnected && a.hostConnected?.();
  }
  removeController(a) {
    this._$EO?.delete(a);
  }
  _$E_() {
    const a = /* @__PURE__ */ new Map(), e = this.constructor.elementProperties;
    for (const o of e.keys()) this.hasOwnProperty(o) && (a.set(o, this[o]), delete this[o]);
    a.size > 0 && (this._$Ep = a);
  }
  createRenderRoot() {
    const a = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return io(a, this.constructor.elementStyles), a;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((a) => a.hostConnected?.());
  }
  enableUpdating(a) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((a) => a.hostDisconnected?.());
  }
  attributeChangedCallback(a, e, o) {
    this._$AK(a, o);
  }
  _$ET(a, e) {
    const o = this.constructor.elementProperties.get(a), i = this.constructor._$Eu(a, o);
    if (i !== void 0 && o.reflect === !0) {
      const t = (o.converter?.toAttribute !== void 0 ? o.converter : Ta).toAttribute(e, o.type);
      this._$Em = a, t == null ? this.removeAttribute(i) : this.setAttribute(i, t), this._$Em = null;
    }
  }
  _$AK(a, e) {
    const o = this.constructor, i = o._$Eh.get(a);
    if (i !== void 0 && this._$Em !== i) {
      const t = o.getPropertyOptions(i), n = typeof t.converter == "function" ? { fromAttribute: t.converter } : t.converter?.fromAttribute !== void 0 ? t.converter : Ta;
      this._$Em = i;
      const c = n.fromAttribute(e, t.type);
      this[i] = c ?? this._$Ej?.get(i) ?? c, this._$Em = null;
    }
  }
  requestUpdate(a, e, o, i = !1, t) {
    if (a !== void 0) {
      const n = this.constructor;
      if (i === !1 && (t = this[a]), o ??= n.getPropertyOptions(a), !((o.hasChanged ?? fe)(t, e) || o.useDefault && o.reflect && t === this._$Ej?.get(a) && !this.hasAttribute(n._$Eu(a, o)))) return;
      this.C(a, e, o);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(a, e, { useDefault: o, reflect: i, wrapped: t }, n) {
    o && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(a) && (this._$Ej.set(a, n ?? e ?? this[a]), t !== !0 || n !== void 0) || (this._$AL.has(a) || (this.hasUpdated || o || (e = void 0), this._$AL.set(a, e)), i === !0 && this._$Em !== a && (this._$Eq ??= /* @__PURE__ */ new Set()).add(a));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (e) {
      Promise.reject(e);
    }
    const a = this.scheduleUpdate();
    return a != null && await a, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [i, t] of this._$Ep) this[i] = t;
        this._$Ep = void 0;
      }
      const o = this.constructor.elementProperties;
      if (o.size > 0) for (const [i, t] of o) {
        const { wrapped: n } = t, c = this[i];
        n !== !0 || this._$AL.has(i) || c === void 0 || this.C(i, void 0, t, c);
      }
    }
    let a = !1;
    const e = this._$AL;
    try {
      a = this.shouldUpdate(e), a ? (this.willUpdate(e), this._$EO?.forEach((o) => o.hostUpdate?.()), this.update(e)) : this._$EM();
    } catch (o) {
      throw a = !1, this._$EM(), o;
    }
    a && this._$AE(e);
  }
  willUpdate(a) {
  }
  _$AE(a) {
    this._$EO?.forEach((e) => e.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(a)), this.updated(a);
  }
  _$EM() {
    this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
  }
  get updateComplete() {
    return this.getUpdateComplete();
  }
  getUpdateComplete() {
    return this._$ES;
  }
  shouldUpdate(a) {
    return !0;
  }
  update(a) {
    this._$Eq &&= this._$Eq.forEach((e) => this._$ET(e, this[e])), this._$EM();
  }
  updated(a) {
  }
  firstUpdated(a) {
  }
};
H.elementStyles = [], H.shadowRootOptions = { mode: "open" }, H[K("elementProperties")] = /* @__PURE__ */ new Map(), H[K("finalized")] = /* @__PURE__ */ new Map(), mo?.({ ReactiveElement: H }), (_a.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const La = globalThis, Za = (r) => r, ga = La.trustedTypes, Ja = ga ? ga.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, xe = "$lit$", R = `lit$${Math.random().toFixed(9).slice(2)}$`, ve = "?" + R, uo = `<${ve}>`, B = document, ia = () => B.createComment(""), ta = (r) => r === null || typeof r != "object" && typeof r != "function", Va = Array.isArray, ho = (r) => Va(r) || typeof r?.[Symbol.iterator] == "function", za = `[ 	
\f\r]`, W = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ka = /-->/g, ae = />/g, L = RegExp(`>|${za}(?:([^\\s"'>=/]+)(${za}*=${za}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), ee = /'/g, oe = /"/g, _e = /^(?:script|style|textarea|title)$/i, we = (r) => (a, ...e) => ({ _$litType$: r, strings: a, values: e }), p = we(1), $a = we(2), X = Symbol.for("lit-noChange"), h = Symbol.for("lit-nothing"), ie = /* @__PURE__ */ new WeakMap(), j = B.createTreeWalker(B, 129);
function ye(r, a) {
  if (!Va(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ja !== void 0 ? Ja.createHTML(a) : a;
}
const go = (r, a) => {
  const e = r.length - 1, o = [];
  let i, t = a === 2 ? "<svg>" : a === 3 ? "<math>" : "", n = W;
  for (let c = 0; c < e; c++) {
    const s = r[c];
    let l, m, d = -1, u = 0;
    for (; u < s.length && (n.lastIndex = u, m = n.exec(s), m !== null); ) u = n.lastIndex, n === W ? m[1] === "!--" ? n = Ka : m[1] !== void 0 ? n = ae : m[2] !== void 0 ? (_e.test(m[2]) && (i = RegExp("</" + m[2], "g")), n = L) : m[3] !== void 0 && (n = L) : n === L ? m[0] === ">" ? (n = i ?? W, d = -1) : m[1] === void 0 ? d = -2 : (d = n.lastIndex - m[2].length, l = m[1], n = m[3] === void 0 ? L : m[3] === '"' ? oe : ee) : n === oe || n === ee ? n = L : n === Ka || n === ae ? n = W : (n = L, i = void 0);
    const g = n === L && r[c + 1].startsWith("/>") ? " " : "";
    t += n === W ? s + uo : d >= 0 ? (o.push(l), s.slice(0, d) + xe + s.slice(d) + R + g) : s + R + (d === -2 ? c : g);
  }
  return [ye(r, t + (r[e] || "<?>") + (a === 2 ? "</svg>" : a === 3 ? "</math>" : "")), o];
};
class ra {
  constructor({ strings: a, _$litType$: e }, o) {
    let i;
    this.parts = [];
    let t = 0, n = 0;
    const c = a.length - 1, s = this.parts, [l, m] = go(a, e);
    if (this.el = ra.createElement(l, o), j.currentNode = this.el.content, e === 2 || e === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (i = j.nextNode()) !== null && s.length < c; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const d of i.getAttributeNames()) if (d.endsWith(xe)) {
          const u = m[n++], g = i.getAttribute(d).split(R), f = /([.?@])?(.*)/.exec(u);
          s.push({ type: 1, index: t, name: f[2], strings: g, ctor: f[1] === "." ? fo : f[1] === "?" ? xo : f[1] === "@" ? vo : wa }), i.removeAttribute(d);
        } else d.startsWith(R) && (s.push({ type: 6, index: t }), i.removeAttribute(d));
        if (_e.test(i.tagName)) {
          const d = i.textContent.split(R), u = d.length - 1;
          if (u > 0) {
            i.textContent = ga ? ga.emptyScript : "";
            for (let g = 0; g < u; g++) i.append(d[g], ia()), j.nextNode(), s.push({ type: 2, index: ++t });
            i.append(d[u], ia());
          }
        }
      } else if (i.nodeType === 8) if (i.data === ve) s.push({ type: 2, index: t });
      else {
        let d = -1;
        for (; (d = i.data.indexOf(R, d + 1)) !== -1; ) s.push({ type: 7, index: t }), d += R.length - 1;
      }
      t++;
    }
  }
  static createElement(a, e) {
    const o = B.createElement("template");
    return o.innerHTML = a, o;
  }
}
function Q(r, a, e = r, o) {
  if (a === X) return a;
  let i = o !== void 0 ? e._$Co?.[o] : e._$Cl;
  const t = ta(a) ? void 0 : a._$litDirective$;
  return i?.constructor !== t && (i?._$AO?.(!1), t === void 0 ? i = void 0 : (i = new t(r), i._$AT(r, e, o)), o !== void 0 ? (e._$Co ??= [])[o] = i : e._$Cl = i), i !== void 0 && (a = Q(r, i._$AS(r, a.values), i, o)), a;
}
class bo {
  constructor(a, e) {
    this._$AV = [], this._$AN = void 0, this._$AD = a, this._$AM = e;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(a) {
    const { el: { content: e }, parts: o } = this._$AD, i = (a?.creationScope ?? B).importNode(e, !0);
    j.currentNode = i;
    let t = j.nextNode(), n = 0, c = 0, s = o[0];
    for (; s !== void 0; ) {
      if (n === s.index) {
        let l;
        s.type === 2 ? l = new na(t, t.nextSibling, this, a) : s.type === 1 ? l = new s.ctor(t, s.name, s.strings, this, a) : s.type === 6 && (l = new _o(t, this, a)), this._$AV.push(l), s = o[++c];
      }
      n !== s?.index && (t = j.nextNode(), n++);
    }
    return j.currentNode = B, i;
  }
  p(a) {
    let e = 0;
    for (const o of this._$AV) o !== void 0 && (o.strings !== void 0 ? (o._$AI(a, o, e), e += o.strings.length - 2) : o._$AI(a[e])), e++;
  }
}
class na {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(a, e, o, i) {
    this.type = 2, this._$AH = h, this._$AN = void 0, this._$AA = a, this._$AB = e, this._$AM = o, this.options = i, this._$Cv = i?.isConnected ?? !0;
  }
  get parentNode() {
    let a = this._$AA.parentNode;
    const e = this._$AM;
    return e !== void 0 && a?.nodeType === 11 && (a = e.parentNode), a;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(a, e = this) {
    a = Q(this, a, e), ta(a) ? a === h || a == null || a === "" ? (this._$AH !== h && this._$AR(), this._$AH = h) : a !== this._$AH && a !== X && this._(a) : a._$litType$ !== void 0 ? this.$(a) : a.nodeType !== void 0 ? this.T(a) : ho(a) ? this.k(a) : this._(a);
  }
  O(a) {
    return this._$AA.parentNode.insertBefore(a, this._$AB);
  }
  T(a) {
    this._$AH !== a && (this._$AR(), this._$AH = this.O(a));
  }
  _(a) {
    this._$AH !== h && ta(this._$AH) ? this._$AA.nextSibling.data = a : this.T(B.createTextNode(a)), this._$AH = a;
  }
  $(a) {
    const { values: e, _$litType$: o } = a, i = typeof o == "number" ? this._$AC(a) : (o.el === void 0 && (o.el = ra.createElement(ye(o.h, o.h[0]), this.options)), o);
    if (this._$AH?._$AD === i) this._$AH.p(e);
    else {
      const t = new bo(i, this), n = t.u(this.options);
      t.p(e), this.T(n), this._$AH = t;
    }
  }
  _$AC(a) {
    let e = ie.get(a.strings);
    return e === void 0 && ie.set(a.strings, e = new ra(a)), e;
  }
  k(a) {
    Va(this._$AH) || (this._$AH = [], this._$AR());
    const e = this._$AH;
    let o, i = 0;
    for (const t of a) i === e.length ? e.push(o = new na(this.O(ia()), this.O(ia()), this, this.options)) : o = e[i], o._$AI(t), i++;
    i < e.length && (this._$AR(o && o._$AB.nextSibling, i), e.length = i);
  }
  _$AR(a = this._$AA.nextSibling, e) {
    for (this._$AP?.(!1, !0, e); a !== this._$AB; ) {
      const o = Za(a).nextSibling;
      Za(a).remove(), a = o;
    }
  }
  setConnected(a) {
    this._$AM === void 0 && (this._$Cv = a, this._$AP?.(a));
  }
}
class wa {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(a, e, o, i, t) {
    this.type = 1, this._$AH = h, this._$AN = void 0, this.element = a, this.name = e, this._$AM = i, this.options = t, o.length > 2 || o[0] !== "" || o[1] !== "" ? (this._$AH = Array(o.length - 1).fill(new String()), this.strings = o) : this._$AH = h;
  }
  _$AI(a, e = this, o, i) {
    const t = this.strings;
    let n = !1;
    if (t === void 0) a = Q(this, a, e, 0), n = !ta(a) || a !== this._$AH && a !== X, n && (this._$AH = a);
    else {
      const c = a;
      let s, l;
      for (a = t[0], s = 0; s < t.length - 1; s++) l = Q(this, c[o + s], e, s), l === X && (l = this._$AH[s]), n ||= !ta(l) || l !== this._$AH[s], l === h ? a = h : a !== h && (a += (l ?? "") + t[s + 1]), this._$AH[s] = l;
    }
    n && !i && this.j(a);
  }
  j(a) {
    a === h ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, a ?? "");
  }
}
class fo extends wa {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(a) {
    this.element[this.name] = a === h ? void 0 : a;
  }
}
class xo extends wa {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(a) {
    this.element.toggleAttribute(this.name, !!a && a !== h);
  }
}
class vo extends wa {
  constructor(a, e, o, i, t) {
    super(a, e, o, i, t), this.type = 5;
  }
  _$AI(a, e = this) {
    if ((a = Q(this, a, e, 0) ?? h) === X) return;
    const o = this._$AH, i = a === h && o !== h || a.capture !== o.capture || a.once !== o.once || a.passive !== o.passive, t = a !== h && (o === h || i);
    i && this.element.removeEventListener(this.name, this, o), t && this.element.addEventListener(this.name, this, a), this._$AH = a;
  }
  handleEvent(a) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, a) : this._$AH.handleEvent(a);
  }
}
class _o {
  constructor(a, e, o) {
    this.element = a, this.type = 6, this._$AN = void 0, this._$AM = e, this.options = o;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(a) {
    Q(this, a);
  }
}
const wo = La.litHtmlPolyfillSupport;
wo?.(ra, na), (La.litHtmlVersions ??= []).push("3.3.3");
const yo = (r, a, e) => {
  const o = e?.renderBefore ?? a;
  let i = o._$litPart$;
  if (i === void 0) {
    const t = e?.renderBefore ?? null;
    o._$litPart$ = i = new na(a.insertBefore(ia(), t), t, void 0, e ?? {});
  }
  return i._$AI(r), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const ja = globalThis;
class E extends H {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const a = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= a.firstChild, a;
  }
  update(a) {
    const e = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(a), this._$Do = yo(e, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return X;
  }
}
E._$litElement$ = !0, E.finalized = !0, ja.litElementHydrateSupport?.({ LitElement: E });
const qo = ja.litElementPolyfillSupport;
qo?.({ LitElement: E });
(ja.litElementVersions ??= []).push("4.2.2");
const qe = _`
  :host {
    /* Tipografia — piso, fluido, teto. Interpola em vez de saltar. */
    --t-xs: clamp(9px, 2.6cqi, 11px);
    --t-sm: clamp(10px, 3cqi, 13px);
    --t-md: clamp(12px, 3.6cqi, 15px);
    --t-lg: clamp(14px, 4.4cqi, 18px);
    --t-xl: clamp(17px, 5.6cqi, 24px);
    --t-2xl: clamp(22px, 8cqi, 38px);
    --t-clock: clamp(34px, 16cqi, 78px);

    /* Espaçamento */
    --s-1: clamp(2px, 0.7cqi, 4px);
    --s-2: clamp(4px, 1.4cqi, 7px);
    --s-3: clamp(6px, 2.2cqi, 11px);
    --s-4: clamp(9px, 3cqi, 15px);
    --s-5: clamp(12px, 4.2cqi, 21px);
    --s-6: clamp(16px, 5.6cqi, 28px);

    /* Elementos de toque. O mínimo de 44px é acessibilidade, não estética:
       abaixo disso o dedo erra o alvo. Nunca reduzir o piso. */
    --hit-min: 44px;
    --control-h: clamp(var(--hit-min), 13cqi, 56px);

    /* Imagem de cômodo. O PNG é servido a 384px; nunca exibir acima disso. */
    --room-img-max: clamp(72px, 30cqi, 132px);

    /* Raios e filetes: NÃO escalam. Um filete de 1px é 1px em qualquer tela. */
    --r-sm: 10px;
    --r-md: 16px;
    --r-lg: 20px;
    --r-full: 999px;
    --hairline: 1px;
  }

  /* Todo componente precisa declarar isto para as unidades cqi funcionarem.
     Sem container-type, a unidade cqi cai para o viewport e o problema volta.
     (Nunca use crase em comentario dentro de template literal — ver
     docs/11-failed-experiments.md.) */
  :host {
    container-type: inline-size;
  }

  @media (prefers-reduced-motion: reduce) {
    :host {
      --motion-fast: 0ms;
      --motion-base: 0ms;
    }
  }

  :host {
    --motion-fast: 120ms;
    --motion-base: 220ms;
    --ease: cubic-bezier(0.2, 0, 0, 1);
  }
`, ko = "media_player.spotifyplus_bruno_helasio", Z = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], pa = ["playing", "paused", "on"], Fa = [
  {
    id: "sala",
    name: "Sala",
    section: "sala",
    assetOff: "v2/sala-off",
    assetOn: "v2/sala-on",
    grammaticalGender: "f",
    toggleTarget: "light.sala_switch_2",
    activeSensor: "sensor.living_room_active",
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca na Sala",
        tone: "blue",
        entities: ["binary_sensor.sala_motion_recent"],
        states: ["on"]
      },
      {
        icon: "mdi:television-classic",
        label: "TV ativa",
        tone: "purple",
        entities: ["media_player.android_tv_192_168_3_17"],
        states: ["on", "playing", "paused", "idle", "buffering"]
      },
      {
        icon: "mdi:snowflake",
        label: "Ar condicionado ativo",
        tone: "cyan",
        entities: ["climate.sl_ar_condicionado"],
        states: Z
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Echo Show ativo",
        tone: "amber",
        entities: ["media_player.echo_show"],
        states: pa,
        spotifyDevice: "Echo Show"
      }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_sala",
      lights: ["light.sala_switch_1", "light.sala_switch_2"],
      climate: "climate.sl_ar_condicionado",
      mediaPlayers: [
        "media_player.android_tv_192_168_3_17",
        "media_player.echo_show",
        "media_player.spotifyplus_bruno_helasio"
      ],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.sl_camera_2', 'camera.vr_camera_2'],
      cameras: ["camera.sl_camera_profile_1", "camera.vr_camera_profile_1"],
      covers: ["cover.cortina_varanda_cortina_2"],
      motionRecent: "binary_sensor.sala_motion_recent",
      occupancy: "binary_sensor.sala_occupancy",
      semanticState: "sensor.sala_semantic_state_supervised",
      temperature: "sensor.sensor_4_in_1_sala_temperature",
      humidity: "sensor.sensor_4_in_1_sala_humidity",
      illuminance: "sensor.sensor_4_in_1_sala_illuminance"
    }
  },
  {
    id: "office",
    name: "Office",
    section: "office",
    assetOff: "v2/office-off",
    assetOn: "v2/office-on",
    grammaticalGender: "m",
    toggleTarget: "light.office_switch_3",
    activeSensor: "sensor.office_active",
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca no Office",
        tone: "blue",
        entities: ["binary_sensor.office_motion_recent"],
        states: ["on"]
      },
      // ANTERIOR: entities: ['binary_sensor.office_pc_active', 'switch.macbook']
      //
      // Duas fontes, e nenhuma acendia o ponto com o PC em uso:
      //
      //   `switch.macbook` NAO EXISTE no sistema — nao aparece no recorder.
      //   Referencia morta, herdada do card antigo; segue viva em cinco outros
      //   pontos da configuracao do HA (energy_estimated, office_presence,
      //   template_sensors, templates/switch, honeycomb/office_mode).
      //
      //   `binary_sensor.office_pc_active` significa "destravado E com input nos
      //   ultimos 300s" (ver packages/office_presence.yaml). Apaga enquanto se
      //   lê a tela, o que nao e o que o ponto promete.
      //
      // O terceiro id abaixo e a leitura direta da sessao do PC: acende com o
      // PC ligado e destravado, que e a semantica dos demais pontos da faixa
      // ("está acontecendo agora"). Os dois anteriores continuam na lista — o
      // ponto acende com QUALQUER um deles.
      {
        icon: "mdi:desktop-classic",
        label: "PC ativo",
        tone: "purple",
        entities: [
          "binary_sensor.office_pc_active",
          "sensor.desktop_melg9vv_office_pc_session_state"
        ],
        states: ["on", "unlocked"]
      },
      {
        icon: "mdi:snowflake",
        label: "Ar condicionado ativo",
        tone: "cyan",
        entities: ["climate.ac_office"],
        states: Z
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Echo Pop ativo",
        tone: "amber",
        entities: ["media_player.echo_pop_office"],
        states: pa,
        spotifyDevice: "Echo Pop Office"
      }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_office",
      lights: ["light.office_switch_1", "light.office_switch_2", "light.office_switch_3"],
      climate: "climate.ac_office",
      mediaPlayers: ["media_player.echo_pop_office"],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.of_camera_2'],
      cameras: ["camera.of_camera_profile_1"],
      motionRecent: "binary_sensor.office_motion_recent",
      occupancy: "binary_sensor.office_occupancy",
      semanticState: "sensor.office_semantic_state_supervised",
      temperature: "sensor.sensor_4_in_1_office_temperature",
      humidity: "sensor.sensor_4_in_1_office_humidity",
      illuminance: "sensor.sensor_4_in_1_office_illuminance"
    }
  },
  {
    id: "cozinha",
    name: "Cozinha",
    section: "cozinha",
    assetOff: "v2/cozinha-off",
    assetOn: "v2/cozinha-on",
    grammaticalGender: "f",
    toggleTarget: "light.cz_luz_principal",
    activeSensor: "sensor.cozinha_active",
    applianceLine: {
      entity: "sensor.lava_loucas_operation_state",
      states: ["run"],
      label: "Lavando",
      activeAttr: "dishwasher_running",
      elapsedAttr: "dishwasher_elapsed"
    },
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca",
        tone: "blue",
        entities: ["binary_sensor.cozinha_motion_recent"],
        states: ["on"]
      },
      {
        icon: "mdi:dishwasher",
        label: "Lava-loucas",
        tone: "purple",
        entities: ["sensor.lava_loucas_operation_state"],
        states: ["run"],
        activeAttr: "dishwasher_running"
      },
      // Sem entidade ainda — declarados para manter a ordem quando existirem.
      { icon: "mdi:washing-machine", label: "Maquina de lavar", tone: "cyan" },
      { icon: "mdi:air-fryer", label: "Air fryer", tone: "amber" }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_cozinha",
      lights: ["light.cz_luz_principal"],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.cz_camera_2', 'camera.as_camera_2'],
      cameras: ["camera.cz_camera_profile_1", "camera.as_camera_profile_1"],
      motionRecent: "binary_sensor.cozinha_motion_recent",
      occupancy: "binary_sensor.cozinha_occupancy",
      semanticState: "sensor.cozinha_semantic_state_supervised",
      temperature: "sensor.sensor_4_in_1_cozinha_temperature",
      humidity: "sensor.sensor_4_in_1_cozinha_humidity",
      illuminance: "sensor.sensor_4_in_1_cozinha_illuminance"
    }
  },
  {
    id: "lavabo",
    name: "Lavabo",
    assetOff: "v2/lavabo-off",
    assetOn: "v2/lavabo-on",
    grammaticalGender: "m",
    toggleTarget: "light.grupo_luzes_lavabo",
    activeSensor: "sensor.lavabo_active",
    popup: {
      title: "Lavabo",
      subtitle: "Controle rapido de luzes",
      icon: "mdi:toilet",
      banner: "/local/images/lavabo.jpg?v=20260705-lavabo-jpg-1",
      lights: [
        { entity: "light.lavabo_switch_2", name: "Luz principal", icon: "ledstrip" },
        { entity: "light.lavabo_switch_1", name: "Luz parede", icon: "sconce" },
        { entity: "light.lavabo_switch_3", name: "Luz espelho", icon: "light_flush" }
      ]
    },
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca",
        tone: "blue",
        entities: ["binary_sensor.lavabo_motion_recent"],
        states: ["on"]
      }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_lavabo",
      lights: ["light.lavabo_switch_1", "light.lavabo_switch_2", "light.lavabo_switch_3"],
      motionRecent: "binary_sensor.lavabo_motion_recent",
      occupancy: "binary_sensor.lavabo_occupancy",
      illuminance: "sensor.lv_sensor_presenca_iluminancia"
    }
  },
  {
    id: "casal",
    name: "Casal",
    section: "casal",
    assetOff: "v2/quarto-casal-off",
    assetOn: "v2/quarto-casal-on",
    grammaticalGender: "m",
    toggleTarget: "light.qc_luz_principal",
    activeSensor: "sensor.quarto_casal_active",
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca",
        tone: "blue",
        entities: ["binary_sensor.q_casal_motion_recent"],
        states: ["on"]
      },
      // O Q. Casal não tem TV. O ponto existe desde o card original e nunca
      // acendeu — sem entidade não há o que ler.
      { icon: "mdi:television-classic", label: "TV", tone: "purple" },
      // ANTERIOR: { icon: 'mdi:snowflake', label: 'Clima', tone: 'cyan' },
      // O ponto de clima estava sem entidade no card original — buraco, não
      // decisão: `climate.qc_ar_condicionado` existe e é o A/C do cômodo,
      // usado pela subview. Agora o ponto acende como nos demais quartos.
      {
        icon: "mdi:snowflake",
        label: "Clima",
        tone: "cyan",
        entities: ["climate.qc_ar_condicionado"],
        states: Z
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Midia",
        tone: "purple",
        entities: ["media_player.echo_pop_quarto_casal"],
        states: pa,
        spotifyDevice: "Echo Pop Quarto Casal"
      }
    ],
    entities: {
      lightGroup: "light.grupo_quarto_casal",
      lights: ["light.qc_luz_principal"],
      mediaPlayers: ["media_player.echo_pop_quarto_casal"],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.camera_quarto_casal_2'],
      cameras: ["camera.qc_camera_profile_1"],
      motionRecent: "binary_sensor.q_casal_motion_recent",
      occupancy: "binary_sensor.q_casal_occupancy",
      semanticState: "sensor.q_casal_semantic_state_supervised",
      temperature: "sensor.sensor_4_in_1_q_casal_temperature",
      humidity: "sensor.sensor_4_in_1_q_casal_humidity",
      illuminance: "sensor.sensor_4_in_1_q_casal_illuminance"
    }
  },
  {
    id: "marina",
    name: "Marina",
    section: "marina",
    assetOff: "v2/quarto-menina-off",
    assetOn: "v2/quarto-menina-on",
    grammaticalGender: "m",
    toggleTarget: "light.quarto_marina_switch_4",
    activeSensor: "sensor.quarto_marina_active",
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca",
        tone: "blue",
        entities: ["binary_sensor.q_marina_motion_recent"],
        states: ["on"]
      },
      { icon: "mdi:television-classic", label: "TV", tone: "purple" },
      {
        icon: "mdi:snowflake",
        label: "Clima",
        tone: "cyan",
        entities: ["climate.ac_quarto_marina"],
        states: Z
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Midia",
        tone: "purple",
        entities: ["media_player.echo_pop_marina"],
        states: pa,
        spotifyDevice: "Echo Pop Marina"
      }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_quarto_marina",
      lights: ["light.quarto_marina_switch_4"],
      climate: "climate.ac_quarto_marina",
      mediaPlayers: ["media_player.echo_pop_marina"],
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.qma_camera_2'],
      cameras: ["camera.qma_camera_profile_1"],
      motionRecent: "binary_sensor.q_marina_motion_recent",
      occupancy: "binary_sensor.q_marina_occupancy",
      semanticState: "sensor.q_marina_semantic_state_supervised",
      temperature: "sensor.sensor_4_in_1_q_marina_temperature",
      humidity: "sensor.sensor_4_in_1_q_marina_humidity",
      illuminance: "sensor.sensor_4_in_1_q_marina_illuminance"
    }
  },
  {
    id: "miguel",
    name: "Miguel",
    section: "miguel",
    assetOff: "v2/quarto-bebe-off",
    assetOn: "v2/quarto-bebe-on",
    grammaticalGender: "m",
    toggleTarget: "light.quarto_miguel_switch_2",
    activeSensor: "sensor.quarto_miguel_active",
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca",
        tone: "blue",
        entities: ["binary_sensor.q_miguel_motion_recent"],
        states: ["on"]
      },
      { icon: "mdi:television-classic", label: "TV", tone: "purple" },
      {
        icon: "mdi:snowflake",
        label: "Clima",
        tone: "cyan",
        entities: ["climate.ac_quarto_miguel"],
        states: Z
      },
      { icon: "mdi:speaker-wireless", label: "Midia", tone: "purple" }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_quarto_miguel",
      lights: ["light.quarto_miguel_switch_2"],
      climate: "climate.ac_quarto_miguel",
      // ANTERIOR (rollback ONVIF geral): cameras: ['camera.qmi_camera_2'],
      cameras: ["camera.qmi_camera_profile_1"],
      motionRecent: "binary_sensor.q_miguel_motion_recent",
      occupancy: "binary_sensor.q_miguel_occupancy",
      semanticState: "sensor.q_miguel_semantic_state_supervised",
      temperature: "sensor.sensor_4_in_1_q_miguel_temperature",
      humidity: "sensor.sensor_4_in_1_q_miguel_humidity",
      illuminance: "sensor.sensor_4_in_1_q_miguel_illuminance"
    }
  },
  {
    id: "corredor",
    name: "Corredor",
    assetOff: "v2/corredor-off",
    assetOn: "v2/corredor-on",
    grammaticalGender: "m",
    toggleTarget: "light.corredor_switch_1",
    statusDots: [
      {
        icon: "mdi:account",
        label: "Presenca",
        tone: "blue",
        entities: ["binary_sensor.corredor_motion_recent"],
        states: ["on"]
      }
    ],
    entities: {
      lights: ["light.corredor_switch_1"],
      motionRecent: "binary_sensor.corredor_motion_recent",
      occupancy: "binary_sensor.corredor_occupancy",
      semanticState: "sensor.corredor_semantic_state"
    }
  }
];
function zo() {
  const r = [];
  for (const a of Fa)
    for (const [e, o] of Object.entries(a.entities))
      if (typeof o == "string")
        r.push({ entityId: o, roomId: a.id, field: e });
      else if (Array.isArray(o))
        for (const i of o) r.push({ entityId: i, roomId: a.id, field: e });
  return r;
}
const $o = [
  {
    entity: "script.bruno_scene_apagar_todas_as_luzes",
    name: "Apagar todas as luzes",
    substitui: "homeassistant.turn_off sobre light.todas_as_luzes",
    comoCriar: "CRIADA em 2026-08-06 (Fase 5e.3), com autorizacao do usuario, em config/packages/bruno_scenes.yaml — mesmo padrao dos demais: script bruno_scene_*, nao entidade scene. O painel de Cenas lista scripts."
  }
];
function Ao(r) {
  const a = [], e = [];
  for (const o of $o)
    r?.states?.[o.entity] ? a.push(o) : e.push(o);
  return { disponiveis: a, ausentes: e };
}
function So(r) {
  const a = zo();
  if (!r) return { total: a.length, ok: 0, issues: [] };
  const e = [];
  let o = 0;
  for (const { entityId: i, roomId: t, field: n } of a) {
    const c = r.states[i];
    c ? c.state === "unavailable" ? e.push({ entityId: i, roomId: t, field: n, problem: "unavailable" }) : o++ : e.push({ entityId: i, roomId: t, field: n, problem: "missing" });
  }
  return { total: a.length, ok: o, issues: e };
}
function Co(r) {
  return Ao(r).ausentes.map((a) => ({
    tipo: "scene",
    entityId: a.entity,
    nome: a.name,
    comoResolver: a.comoCriar
  }));
}
function Eo() {
  const r = window.devicePixelRatio || 1;
  return {
    buildId: "20260814",
    viewportCss: `${window.innerWidth} x ${window.innerHeight}`,
    screenPhysical: `${Math.round(window.screen.width * r)} x ${Math.round(
      window.screen.height * r
    )}`,
    devicePixelRatio: r,
    containerQueries: typeof CSS < "u" && CSS.supports?.("container-type", "inline-size") === !0,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    userAgent: navigator.userAgent
  };
}
const Mo = 2;
function Oo(r, a) {
  if (["unavailable", "unknown"].includes(a)) return "indisponivel";
  const e = String(r.frontend_stream_type ?? "");
  return e === "web_rtc" ? "web_rtc" : e === "hls" ? "hls" : "instantaneo";
}
async function To(r) {
  const a = ke(r), e = r?.callWS;
  if (!e || !a.cameras.length) return a;
  const o = await Promise.all(
    a.cameras.map(async (t) => {
      if (t.caminho === "indisponivel") return t;
      try {
        const c = (await e({
          type: "camera/capabilities",
          entity_id: t.entityId
        }))?.frontend_stream_types ?? [];
        return c.includes("web_rtc") ? { ...t, caminho: "web_rtc" } : c.includes("hls") ? { ...t, caminho: "hls" } : t;
      } catch {
        return t;
      }
    })
  ), i = {
    web_rtc: 0,
    hls: 0,
    instantaneo: 0,
    indisponivel: 0
  };
  for (const t of o) i[t.caminho]++;
  return {
    streamCarregado: a.streamCarregado,
    cameras: o,
    resumo: i,
    veredito: ze(i, o.length, a.streamCarregado)
  };
}
function ke(r) {
  const a = {
    streamCarregado: !1,
    cameras: [],
    resumo: { web_rtc: 0, hls: 0, instantaneo: 0, indisponivel: 0 },
    veredito: "Sem hass — nada a sondar."
  };
  if (!r) return a;
  const e = [];
  for (const [t, n] of Object.entries(r.states)) {
    if (!t.startsWith("camera.") || !n) continue;
    const c = n.attributes ?? {}, s = Number(c.supported_features ?? 0);
    e.push({
      entityId: t,
      nome: String(c.friendly_name ?? t),
      estado: String(n.state),
      caminho: Oo(c, String(n.state)),
      suportaStream: (s & Mo) !== 0
    });
  }
  e.sort((t, n) => t.entityId.localeCompare(n.entityId));
  const o = {
    web_rtc: 0,
    hls: 0,
    instantaneo: 0,
    indisponivel: 0
  };
  for (const t of e) o[t.caminho]++;
  const i = e.some((t) => t.suportaStream);
  return {
    streamCarregado: i,
    cameras: e,
    resumo: o,
    veredito: ze(o, e.length, i)
  };
}
function ze(r, a, e) {
  return a === 0 ? "Nenhuma câmera encontrada." : r.web_rtc > 0 ? `${r.web_rtc} de ${a} com WebRTC — vale medir stream nessas.` : r.hls > 0 ? `${r.hls} de ${a} só com HLS. A transcodificação roda na VM: stream só se a medição provar que compensa, e uma câmera por vez.` : e ? "Câmeras com stream declarado, mas sem tipo publicado — sondar de novo com o painel aberto." : "Nenhuma câmera declara suporte a stream — o instantâneo é o único caminho.";
}
class Io extends E {
  constructor() {
    super(...arguments), this._env = Eo(), this._sondando = !1, this._mensagem = "";
  }
  static {
    this.properties = {
      _hass: { state: !0 }
    };
  }
  /** O HA injeta `hass` por setter em todo custom card. */
  set hass(a) {
    this._hass = a;
  }
  setConfig(a) {
  }
  getCardSize() {
    return 4;
  }
  static {
    this.styles = [
      qe,
      _`
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
    `
    ];
  }
  _row(a, e, o = "") {
    return p`<div class="row">
      <dt>${a}</dt>
      <dd class=${o}>${e}</dd>
    </div>`;
  }
  /**
   * Fase 6.0 — a baseline de runtime, legível NO TABLET.
   *
   * Sem esta seção os números só existiriam em `window.brunoRuntime`, e a 6.0
   * exige coleta no aparelho — onde não há console à mão. O botão copia o JSON
   * inteiro para a área de transferência.
   */
  _runtime() {
    const a = ha(), e = (s) => (s / 1048576).toFixed(1) + " MB", o = (s) => s.toFixed(1) + " ms", i = a.vazamentos, t = i.timers + i.listeners + i.assinaturas, n = a.desdeAMarca, c = n ? n.instancias + n.timers + n.listeners + n.assinaturas : 0;
    return p`
      <div>
        <h2>Runtime</h2>
        <dl>
          ${this._row("Build medido", a.build)}
          ${this._row("Desde o carregamento", (a.desdeOCarregamento / 1e3).toFixed(0) + " s")}
          ${this._row("Timers vivos", String(a.timersVivos))}
          ${this._row(
      "Memória usada",
      a.memoria.ultima ? e(a.memoria.ultima.usado) : "sem leitura",
      a.memoria.ultima ? "" : "warn"
    )}
          ${this._row(
      "Piso da memória",
      a.memoria.amostras ? `${e(a.memoria.piso)} · pico ${e(a.memoria.pico)} · ${a.memoria.degraus} degrau(s)` : "—",
      a.memoria.degraus < 2 ? "warn" : ""
    )}
          ${this._row(
      "Crescimento do piso",
      a.memoria.amostras > 1 ? e(a.memoria.crescimentoDoPiso) : "—",
      a.memoria.crescimentoDoPiso > 10 * 1048576 ? "warn" : "ok"
    )}
          ${this._row(
      "Tarefas longas",
      `${a.tarefasLongas.naCarga} na carga · ${a.tarefasLongas.depoisDaCarga} depois (${a.tarefasLongas.porMinuto}/min) · pior ${a.tarefasLongas.pior} ms`,
      a.tarefasLongas.depoisDaCarga === 0 ? "ok" : "warn"
    )}
          ${this._row(
      "Vazando (timer/listener/assinatura)",
      String(t),
      t === 0 ? "ok" : "warn"
    )}
          ${this._row("Componentes montados", String(a.vivos))}
          ${n ? this._row(
      "Sobrou desde a marca",
      `${n.instancias} inst · ${n.timers} timers · ${n.listeners} listeners · ${n.assinaturas} assin.`,
      c === 0 ? "ok" : "warn"
    ) : h}
        </dl>

        <p class="empty">${a.memoria.veredito}</p>

        ${a.componentes.length ? p`<ul>
              ${a.componentes.map(
      (s) => p`<li>
                  <strong>${s.nome}</strong> — ${s.render.total} renders
                  (média ${s.render.total ? o(s.render.duracaoTotal / s.render.total) : "0.0 ms"},
                  pior ${o(s.render.pior)}) ·
                  vivos: ${s.vivos} ·
                  timers ${s.timers.criados - s.timers.encerrados} ·
                  listeners ${s.listeners.criados - s.listeners.encerrados}
                  ${s.requisicoes.total ? p` · ${s.requisicoes.total} req (${s.requisicoes.falhas} falhas, pior ${o(s.requisicoes.pior)})` : h}
                  ${s.motivos.length ? p`<br /><span class="motivos"
                        >acordado por:
                        ${s.motivos.map((l) => `${l.motivo} (${l.total})`).join(" · ")}</span
                      >` : h}
                </li>`
    )}
            </ul>` : p`<p class="empty">Nenhum componente instrumentado ainda.</p>`}

        <div class="acoes">
          <button type="button" @click=${() => this._copiarBaseline()}>Copiar baseline</button>
          <button type="button" @click=${() => this._marcar()}>Marcar ciclo</button>
          <button type="button" @click=${() => this.requestUpdate()}>Atualizar</button>
        </div>
        ${this._mensagem ? p`<p class="empty">${this._mensagem}</p>` : h}
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
  _marcar() {
    const a = ge();
    this._mensagem = `Marca posta: ${a.instancias} instâncias, ${a.timers} timers, ${a.listeners} listeners. Navegue e volte aqui.`, this.requestUpdate();
  }
  _cameras() {
    !this._sondaProfunda && !this._sondando && this._hass && (this._sondando = !0, To(this._hass).then((e) => {
      this._sondaProfunda = e, this._sondando = !1, this.requestUpdate();
    }));
    const a = this._sondaProfunda ?? ke(this._hass);
    return a.cameras.length ? p`
      <div>
        <h2>Câmeras — capacidade</h2>
        <dl>
          ${this._row("Total", String(a.cameras.length))}
          ${this._row("WebRTC", String(a.resumo.web_rtc), a.resumo.web_rtc ? "ok" : "")}
          ${this._row("HLS (transcodifica na VM)", String(a.resumo.hls), a.resumo.hls ? "warn" : "")}
          ${this._row("Só instantâneo", String(a.resumo.instantaneo))}
          ${this._row("Fora do ar", String(a.resumo.indisponivel), a.resumo.indisponivel ? "bad" : "ok")}
        </dl>
        <p class="empty">${a.veredito}</p>
        <ul>
          ${a.cameras.map((e) => p`<li>${e.entityId} → ${e.caminho}${e.suportaStream ? " · stream" : ""}</li>`)}
        </ul>
      </div>
    ` : h;
  }
  /**
   * Copia a baseline para a área de transferência.
   *
   * `navigator.clipboard` exige contexto seguro; a WebView do tablet acessa o HA
   * por HTTP na rede local, onde ele nem sempre existe. Por isso o caminho
   * alternativo com `textarea` + `execCommand`, que continua funcionando ali.
   */
  async _copiarBaseline() {
    const a = JSON.stringify(ha(), null, 2);
    try {
      await navigator.clipboard.writeText(a), this._mensagem = "Baseline copiada.";
    } catch {
      const e = document.createElement("textarea");
      e.value = a, e.style.position = "fixed", e.style.opacity = "0", this.shadowRoot?.appendChild(e), e.select();
      const o = document.execCommand("copy");
      e.remove(), this._mensagem = o ? "Baseline copiada." : "Não foi possível copiar — use brunoRuntime.texto().";
    }
    this.requestUpdate();
  }
  render() {
    const a = this._env, e = So(this._hass), o = e.issues.filter((n) => n.problem === "missing"), i = e.issues.filter((n) => n.problem === "unavailable"), t = Co(this._hass);
    return p`
      <div class="card">
        <div>
          <h2>Diagnóstico</h2>
          <div class="build">build ${a.buildId}</div>
        </div>

        <dl>
          ${this._row("Viewport CSS", a.viewportCss)}
          ${this._row("Tela física", a.screenPhysical)}
          ${this._row("Densidade de pixels", `${a.devicePixelRatio}×`)}
          ${this._row(
      "Container queries",
      a.containerQueries ? "suportado" : "AUSENTE",
      a.containerQueries ? "ok" : "bad"
    )}
          ${this._row("Movimento reduzido", a.reducedMotion ? "ativo" : "não")}
          ${this._row(
      "Entidades configuradas",
      `${e.ok} / ${e.total}`,
      e.issues.length === 0 ? "ok" : "warn"
    )}
          ${this._row(
      "Não existem no HA",
      String(o.length),
      o.length === 0 ? "ok" : "bad"
    )}
          ${this._row(
      "Indisponíveis agora",
      String(i.length),
      i.length === 0 ? "ok" : "warn"
    )}
          ${this._row(
      "Dependências do HA ausentes",
      String(t.length),
      t.length === 0 ? "ok" : "warn"
    )}
        </dl>

        ${t.length > 0 ? p`
              <div>
                <h2>Dependências que o dashboard não cria</h2>
                <p>
                  Criar estes itens é configuração do Home Assistant. O dashboard
                  registra a falta e não atua fora do frontend.
                </p>
                <ul>
                  ${t.map(
      (n) => p`<li class="warn">
                      ${n.tipo} · ${n.nome} → ${n.entityId}<br /><small>${n.comoResolver}</small>
                    </li>`
    )}
                </ul>
              </div>
            ` : h}

        ${o.length > 0 ? p`
              <div>
                <h2>Entidades inexistentes</h2>
                <ul>
                  ${o.map(
      (n) => p`<li class="bad">${n.roomId} · ${n.field} → ${n.entityId}</li>`
    )}
                </ul>
              </div>
            ` : h}
        ${i.length > 0 ? p`
              <div>
                <h2>Indisponíveis</h2>
                <ul>
                  ${i.map(
      (n) => p`<li class="warn">${n.roomId} · ${n.field} → ${n.entityId}</li>`
    )}
                </ul>
              </div>
            ` : h}
        ${this._runtime()}
        ${this._cameras()}
        ${this._hass ? h : p`<p class="empty">Aguardando o objeto hass…</p>`}
      </div>
    `;
  }
}
customElements.get("bruno-diagnostics") || customElements.define("bruno-diagnostics", Io);
const ba = window;
ba.customCards = ba.customCards ?? [];
ba.customCards.some((r) => r.type === "bruno-diagnostics") || ba.customCards.push({
  type: "bruno-diagnostics",
  name: "Bruno · Diagnóstico",
  description: "Build, viewport, capacidades e validação das entidades configuradas."
});
function Do(r) {
  const a = r / 6e4, e = r / 36e5, o = r / 864e5;
  return a < 1 ? "<1m" : a < 60 ? `${Math.trunc(a)}m` : e < 24 ? `${Math.trunc(e)}h` : `${Math.trunc(o)}d`;
}
function Ro(r) {
  const { hass: a, groupEntityId: e, activeSensorId: o, fallbackLightIds: i = [] } = r, t = r.now ?? Date.now(), n = e ? a.states[e] : void 0, c = o ? a.states[o] : void 0;
  let s = null;
  const l = c?.attributes.lights_on_count;
  if (l != null && l !== "" && !Number.isNaN(Number(l)))
    s = Math.trunc(Number(l));
  else {
    const g = c?.attributes.lights_on;
    if (Array.isArray(g))
      s = g.length;
    else if (typeof g == "string" && g.startsWith("[")) {
      const f = g.match(/'/g);
      f && (s = f.length / 2);
    }
  }
  const m = No(n);
  s === null && m.length > 0 && (s = m.filter((g) => a.states[g]?.state === "on").length), s === null && i.length > 0 && (s = i.filter((g) => a.states[g]?.state === "on").length), s === null && (s = n?.state === "on" ? 1 : 0);
  let d = String(c?.attributes.lights_elapsed ?? "");
  if (!d) {
    const g = m.length > 0 ? m : i;
    let f = null;
    for (const v of g) {
      const q = a.states[v];
      if (q?.state !== "on" || !q.last_changed) continue;
      const b = Date.parse(q.last_changed);
      !Number.isNaN(b) && (f === null || b < f) && (f = b);
    }
    if (f === null && n?.state === "on" && n.last_changed) {
      const v = Date.parse(n.last_changed);
      Number.isNaN(v) || (f = v);
    }
    d = f === null ? "" : Do(t - f);
  }
  const u = s === 1 ? "1 light" : `${s} lights`;
  return {
    count: s,
    elapsed: d,
    label: s > 0 ? `${u}${d ? ` / ${d}` : ""}` : ""
  };
}
function No(r) {
  const a = r?.attributes.entity_id;
  return Array.isArray(a) ? a.filter((e) => typeof e == "string") : [];
}
function Po(r) {
  const { hass: a, semanticSensorId: e, motionRecentId: o, occupancyId: i } = r, t = e ? a.states[e] : void 0, n = String(t?.state ?? "").toLowerCase(), c = t?.attributes.display;
  if (c && !["none", "unknown", "unavailable", ""].includes(n))
    return String(c).trim();
  const s = o ? a.states[o] : void 0;
  return s && s.state !== "on" ? "" : (i ? a.states[i] : void 0)?.state === "on" ? "Ocupado" : "";
}
function te(r, a, e = ["on", "home", "active", "yes"]) {
  if (!a) return !1;
  const o = r.states[a];
  return o ? e.includes(String(o.state).toLowerCase()) : !1;
}
function re(r, a, e = "") {
  const o = typeof a == "string" ? [a] : a ?? [];
  for (const i of o) {
    const t = r.states[i], n = String(t?.state ?? "").toLowerCase();
    if (!(!t || ["unknown", "unavailable", "none", ""].includes(n)))
      return `${t.state}${e}`;
  }
  return "--";
}
function V(r) {
  return String(r ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const Lo = [
  "source",
  "source_name",
  "device_name",
  "active_device_name",
  "spotify_device_name",
  "media_player",
  "media_player_name"
];
function Vo(r, a) {
  const e = V(a);
  if (!e) return !0;
  const o = r ?? {};
  return Lo.some((i) => {
    const t = V(o[i]);
    return !!(t && (t === e || t.includes(e) || t.length >= 10 && e.includes(t)));
  });
}
const $e = ["playing", "paused"];
function Ae(r, a, e) {
  return !r || !$e.includes(String(r.state).toLowerCase()) ? !1 : Vo(r.attributes, a) ? !0 : jo(r.attributes, e);
}
function jo(r, a) {
  if (!a || !$e.includes(String(a.state).toLowerCase())) return !1;
  const e = a.attributes ?? {};
  if (V(
    [e.app_name, e.source, e.media_content_type, e.media_channel].join(" ")
  ).includes("spotify")) return !0;
  const i = r ?? {}, t = V(e.media_title), n = V(i.media_title);
  if (t && n && t === n) return !0;
  const c = V(e.media_artist), s = V(i.media_artist);
  return !!(t && n && t.includes(n) && c && s && c === s);
}
const Fo = "∅", Bo = (r) => r ? `${r.state}@${r.last_changed}` : Fo;
class Ba {
  constructor(a = [], e = {}) {
    this.ids = [], this.ultimo = /* @__PURE__ */ new Map(), this.virgem = !0, this.projecoes = e.projecoes ?? {}, this.observar(a);
  }
  /**
   * Troca a lista observada.
   *
   * Necessário porque a lista de um cômodo só existe depois do `setConfig`, que
   * chega DEPOIS do primeiro `hass`. Trocar a lista volta o observador ao estado
   * virgem — senão o componente ficaria preso à leitura feita com a lista velha.
   */
  observar(a) {
    const e = [], o = /* @__PURE__ */ new Set();
    for (const i of a)
      typeof i != "string" || !i || o.has(i) || (o.add(i), e.push(i));
    this.ids = e, this.ultimo.clear(), this.virgem = !0;
  }
  get observadas() {
    return this.ids;
  }
  projetar(a, e) {
    return (this.projecoes[e] ?? Bo)(a.states[e]);
  }
  /**
   * O que mudou desde a última pergunta.
   *
   * Efeito colateral deliberado: memoriza a leitura. Chamar duas vezes seguidas
   * devolve a lista cheia e depois vazia — é assim que o setter de `hass` a usa.
   *
   * A primeira chamada devolve todas as observadas: é a pintura inicial, e ela
   * tem de acontecer.
   */
  mudancas(a) {
    if (!a) return [];
    if (this.virgem) {
      this.virgem = !1;
      for (const o of this.ids) this.ultimo.set(o, this.projetar(a, o));
      return this.ids;
    }
    let e;
    for (const o of this.ids) {
      const i = this.projetar(a, o);
      i !== this.ultimo.get(o) && (this.ultimo.set(o, i), (e ??= []).push(o));
    }
    return e ?? [];
  }
  /** Mudou alguma coisa? Atalho para quem não precisa saber qual. */
  mudou(a) {
    return this.mudancas(a).length > 0;
  }
  /** Esquece o que leu, sem trocar a lista. A próxima pergunta pinta tudo. */
  esquecer() {
    this.ultimo.clear(), this.virgem = !0;
  }
}
function Ua(r, a = 2) {
  return r.length === 0 ? "" : r.length <= a ? r.join(" ") : `${r.slice(0, a).join(" ")} +${r.length - a}`;
}
const Uo = /^[a-z_]+\.[a-z0-9_]+$/, Go = 8;
function ne(r, a = 0) {
  const e = [], o = /* @__PURE__ */ new Set(), i = (t, n) => {
    if (!(n > Go || t == null)) {
      if (typeof t == "string") {
        Uo.test(t) && !o.has(t) && (o.add(t), e.push(t));
        return;
      }
      if (Array.isArray(t)) {
        for (const c of t) i(c, n + 1);
        return;
      }
      if (typeof t == "object")
        for (const c of Object.values(t)) i(c, n + 1);
    }
  };
  return i(r, a), e;
}
const Aa = "bruno-room-tile", Ho = 1200, Yo = 560, se = 10;
function ce() {
  return {
    pointerId: null,
    down: !1,
    moved: !1,
    holdFired: !1,
    startX: 0,
    startY: 0,
    holdTimer: null
  };
}
function Sa(r) {
  globalThis.BrunoLiquidGlass?.feedback?.(r);
}
function le(r) {
  return r === !0 ? !0 : typeof r == "number" ? r > 0 : ["true", "on", "yes", "1"].includes(String(r ?? "").toLowerCase());
}
class Xo extends E {
  constructor() {
    super(...arguments), this._lastAction = 0, this._observador = new Ba(), this._motivo = "", this._gestures = {
      room: ce(),
      nav: ce()
    }, this._timers = /* @__PURE__ */ new Set(), this._onThemeChanged = () => {
      this._tileModeCache = void 0, this.requestUpdate();
    }, this._fecharPainel = () => {
      this.shadowRoot?.querySelector("dialog.room-popup")?.close();
    };
  }
  static {
    this.properties = {};
  }
  setConfig(a) {
    if (!a?.room) throw new Error("bruno-room-tile: informe `room`");
    const e = Fa.find((o) => o.id === a.room);
    if (!e) throw new Error(`bruno-room-tile: cômodo desconhecido "${a.room}"`);
    this._config = a, this._room = e, this._observador.observar(this._watched());
  }
  getCardSize() {
    return 3;
  }
  /**
   * Mede o custo de cada atualizacao (Fase 6.0.1) e registra o MOTIVO (6.1).
   *
   * O motivo é consumido aqui: se o mesmo render for pedido de novo por outro
   * caminho (troca de tema, por exemplo), ele não pode herdar a causa anterior.
   */
  update(a) {
    const e = this._motivo;
    this._motivo = "", Ra(
      Aa,
      () => super.update(a),
      e || (this.hasUpdated ? "interação" : "montagem")
    );
  }
  /**
   * O objeto hass muda a cada alteração de estado de QUALQUER entidade da casa.
   * Só re-renderiza quando muda algo que este tile realmente lê — é o contrato
   * que substitui o re-render total dos cards atuais (A2 em docs/09).
   */
  set hass(a) {
    this._hass = a;
    const e = this._observador.mudancas(a);
    e.length !== 0 && (this._motivo = Ua(e), this.requestUpdate());
  }
  _watched() {
    const a = this._room, e = a?.entities;
    if (!e) return [];
    const o = (a?.statusDots ?? []).flatMap((t) => t.entities ?? []);
    return [
      ...(a?.popup?.lights ?? []).map((t) => t.entity),
      a?.applianceLine?.entity,
      e.lightGroup,
      ...e.lights ?? [],
      a?.toggleTarget,
      a?.activeSensor,
      e.motionRecent,
      e.occupancy,
      e.semanticState,
      e.temperature,
      e.humidity,
      ...o
    ].filter((t) => typeof t == "string");
  }
  connectedCallback() {
    super.connectedCallback(), Ia(Aa), this._tileModeCache = void 0, globalThis.addEventListener?.("bruno-theme-changed", this._onThemeChanged);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), Da(Aa), globalThis.removeEventListener?.("bruno-theme-changed", this._onThemeChanged);
    for (const a of this._timers) window.clearTimeout(a);
    this._timers.clear();
    for (const a of ["room", "nav"]) this._resetGesture(a);
  }
  get _tileMode() {
    if (this._config?.variant !== "tile") return !1;
    if (this._tileModeCache !== void 0) return this._tileModeCache;
    let a = "";
    try {
      a = getComputedStyle(this).getPropertyValue("--bruno-tile-mode").trim();
    } catch {
      a = "";
    }
    return this._tileModeCache = a === "on", this._tileModeCache;
  }
  /**
   * Liga/desliga uma classe de interação DIRETO no elemento.
   *
   * Não passa por estado reativo de propósito. Pelo Lit a classe só chegaria ao
   * DOM no próximo microtask, e um botão que responde ao toque não pode depender
   * de agendamento — além de disparar um render inteiro a cada dedo na tela,
   * durante a rolagem da faixa. Os atributos `class` destes dois elementos são
   * estáticos no template, então o Lit não os sobrescreve.
   */
  _classe(a, e, o) {
    const i = this.shadowRoot?.querySelector(a);
    i && i.classList.toggle(e, o);
  }
  _alvoSeletor(a) {
    return a === "room" ? ".room-action" : ".room-nav-zone";
  }
  _later(a, e) {
    const o = window.setTimeout(() => {
      this._timers.delete(o), a();
    }, e);
    return this._timers.add(o), o;
  }
  // ── Gestos ───────────────────────────────────────────────────────────────
  //
  // Transcrito de `_wireAction` / `_wireRoomNavZone` dos cards atuais. Três
  // detalhes NÃO são cosméticos e não podem ser simplificados:
  //
  //   1. a classe de pressão é aplicada por JS, não por `:active`. No WebView do
  //      tablet o `:active` fica preso quando o gesto vira rolagem da faixa;
  //   2. o deslocamento acima de 10px cancela o toque SEM `preventDefault`, para
  //      que a faixa continue rolando com o dedo;
  //   3. a zona de navegação vive DENTRO do botão do cômodo. É o
  //      `stopPropagation` dela que impede o toque no título de acender a luz.
  _resetGesture(a) {
    const e = this._gestures[a];
    e.holdTimer !== null && (window.clearTimeout(e.holdTimer), this._timers.delete(e.holdTimer), e.holdTimer = null), e.down = !1, e.moved = !1, e.pointerId = null, this._classe(this._alvoSeletor(a), "is-pressed", !1);
  }
  _onDown(a, e) {
    if (e.button != null && e.button !== 0) return;
    const o = this._gestures[a];
    if (o.pointerId !== null) {
      e.stopPropagation();
      return;
    }
    e.stopPropagation(), o.down = !0, o.moved = !1, o.holdFired = !1, o.pointerId = e.pointerId, o.startX = e.clientX, o.startY = e.clientY, this._classe(this._alvoSeletor(a), "is-pressed", !0), o.holdTimer = this._later(() => {
      o.holdTimer = null, !(!o.down || o.moved) && (o.holdFired = !0, this._classe(this._alvoSeletor(a), "is-hold-fired", !0), this._later(() => this._classe(this._alvoSeletor(a), "is-hold-fired", !1), 260), this._runAction("hold"));
    }, Yo);
  }
  _onMove(a, e) {
    const o = this._gestures[a];
    if (!o.down || e.pointerId !== o.pointerId) return;
    const i = Math.abs(e.clientX - o.startX), t = Math.abs(e.clientY - o.startY);
    i <= se && t <= se || (o.moved = !0, o.holdTimer !== null && (window.clearTimeout(o.holdTimer), this._timers.delete(o.holdTimer), o.holdTimer = null), this._classe(this._alvoSeletor(a), "is-pressed", !1));
  }
  _onUp(a, e) {
    const o = this._gestures[a];
    if (e.pointerId !== o.pointerId) {
      e.stopPropagation();
      return;
    }
    e.preventDefault(), e.stopPropagation();
    const i = o.down, t = o.moved, n = o.holdFired;
    if (this._resetGesture(a), !(!i || t || n)) {
      if (a === "room") {
        this._runAction("tap");
        return;
      }
      this._classe(".room-nav-zone", "is-navigating", !0), this._later(() => this._classe(".room-nav-zone", "is-navigating", !1), 420), this._later(() => this._openSubview(), 90);
    }
  }
  _onCancel(a, e) {
    e.pointerId === this._gestures[a].pointerId && this._resetGesture(a);
  }
  _onKey(a, e) {
    if (!(e.key !== "Enter" && e.key !== " ")) {
      if (e.preventDefault(), a === "room") {
        this._runAction("tap");
        return;
      }
      e.stopPropagation(), this._classe(".room-nav-zone", "is-navigating", !0), this._later(() => this._classe(".room-nav-zone", "is-navigating", !1), 420), this._later(() => this._openSubview(), 90);
    }
  }
  /** Toque curto alterna a luz principal; pressão longa apaga o cômodo inteiro. */
  _runAction(a) {
    const e = this._room, o = this._hass;
    if (!e || !o) return;
    if (Sa(a), a === "hold") {
      const n = e.entities.lightGroup;
      if (!n) return;
      o.callService("light", "turn_off", { entity_id: n }, { entity_id: n });
      return;
    }
    const i = Date.now();
    if (i - this._lastAction < Ho) return;
    this._lastAction = i;
    const t = e.toggleTarget ?? e.entities.lightGroup ?? e.entities.lights?.[0];
    t && o.callService("light", "toggle", { entity_id: t }, { entity_id: t });
  }
  /**
   * Destino do chevron: a subview do cômodo ou, onde não há, o painel próprio.
   *
   * A shell escuta `ll-custom` e troca a seção; não há mudança de URL.
   */
  _openSubview() {
    const a = this._room;
    if (a) {
      if (Sa("tap"), a.section) {
        this.dispatchEvent(
          new CustomEvent("ll-custom", {
            detail: { action: "fire-dom-event", bruno_section: a.section },
            bubbles: !0,
            composed: !0
          })
        );
        return;
      }
      a.popup && this._abrirPainel();
    }
  }
  _abrirPainel() {
    const a = this.shadowRoot?.querySelector("dialog.room-popup");
    if (a) {
      try {
        a.showModal();
      } catch {
        return;
      }
      this._posicionarPainel();
    }
  }
  /**
   * Ancora o painel ao próprio tile.
   *
   * O `<dialog>` está na top layer, então `getBoundingClientRect()` já devolve
   * coordenadas de viewport. Abre abaixo do tile; se não couber, acima. O
   * alinhamento é pela borda direita porque o cômodo com painel fica na metade
   * direita da faixa — alinhar pela esquerda jogaria o painel para fora.
   */
  _posicionarPainel() {
    const a = this.shadowRoot?.querySelector(".room-popup-panel");
    if (!a) return;
    const e = this.getBoundingClientRect();
    if (!e.width && !e.height) return;
    const o = 10, i = window.innerWidth || document.documentElement.clientWidth, t = window.innerHeight || document.documentElement.clientHeight, n = a.offsetWidth || 520, c = a.offsetHeight || 240;
    let s = e.right - n;
    s = Math.min(Math.max(s, o), Math.max(o, i - n - o));
    let l = e.bottom + o;
    l + c > t - o && (l = e.top - c - o), l = Math.min(Math.max(l, o), Math.max(o, t - c - o)), a.style.left = `${Math.round(s)}px`, a.style.top = `${Math.round(l)}px`;
  }
  _alternarLuzDoPainel(a) {
    this._hass && (Sa("tap"), this._hass.callService("light", "toggle", { entity_id: a }, { entity_id: a }));
  }
  // ── Modelo ───────────────────────────────────────────────────────────────
  _dots() {
    const a = this._hass, e = this._room;
    if (!a || !e) return [];
    const o = e.activeSensor ? a.states[e.activeSensor] : void 0, i = (t) => {
      const n = (t.states ?? []).map((m) => m.toLowerCase()), c = (t.entities ?? []).some((m) => {
        const d = a.states[m];
        return !!d && n.includes(String(d?.state ?? "").toLowerCase());
      }), s = t.activeAttr ? le(o?.attributes[t.activeAttr]) : !1, l = t.spotifyDevice ? Ae(a.states[ko], t.spotifyDevice) : !1;
      return c || s || l;
    };
    return (e.statusDots ?? []).filter(i).map((t) => ({ icon: t.icon, label: t.label, tone: t.tone }));
  }
  _statusLines() {
    const a = this._hass, e = this._room;
    if (!a || !e) return [];
    const o = Ro({
      hass: a,
      groupEntityId: e.entities.lightGroup,
      activeSensorId: e.activeSensor,
      fallbackLightIds: e.entities.lights
    }), i = e.entities.semanticState ? Po({
      hass: a,
      semanticSensorId: e.entities.semanticState,
      motionRecentId: e.entities.motionRecent,
      occupancyId: e.entities.occupancy
    }) : "", t = [];
    o.label ? t.push(o.label) : te(a, e.entities.lightGroup) && t.push("On");
    const n = this._applianceLine();
    return n && t.push(n), i && t.push(i), t;
  }
  /** Linha do eletrodoméstico, no formato "Lavando / 12m". */
  _applianceLine() {
    const a = this._hass, e = this._room, o = e?.applianceLine;
    if (!a || !e || !o) return "";
    const i = e.activeSensor ? a.states[e.activeSensor] : void 0, t = (o.states ?? []).map((l) => l.toLowerCase()), n = o.entity ? a.states[o.entity] : void 0;
    if (!(!!n && t.includes(String(n?.state ?? "").toLowerCase()) || (o.activeAttr ? le(i?.attributes[o.activeAttr]) : !1))) return "";
    const s = o.elapsedAttr ? String(i?.attributes[o.elapsedAttr] ?? "") : "";
    return s ? `${o.label} / ${s}` : o.label;
  }
  static {
    this.styles = _`
    :host {
      /*
       * CONTAINER DA ESCALA FLUIDA (Fase 6.2, correção de 2026-08-09).
       *
       * Sem isto, "cqi" não resolve neste componente e todo valor fluido vira
       * zero. A primeira passada da 6.2 alcançou só o CSS GERADO da subview;
       * este arquivo tem CSS escrito à mão e ficou de fora — os cartões
       * escalavam e os PNGs não, causando sobreposição.
       *
       * Referência da conversão: 218,75 px — a largura de UMA célula da faixa
       * de oito na calibragem: (1820 − 7 × 10 de gap) / 8.
       */
      container-type: inline-size;
      container-name: ladrilho;

      /* Raio e tokens locais — cópia dos cards atuais (docs/07). */
      --card-radius: var(--bruno-liquid-room-radius, var(--bruno-liquid-card-radius-compact, 16px));
      --accent: 150, 190, 255;
      --accent-blue: 96, 165, 250;
      --accent-purple: 167, 139, 250;
      --accent-cyan: 79, 172, 254;
      --accent-amber: 255, 153, 0;
      --text-main: rgba(245, 250, 255, 0.96);
      --text-soft: rgba(255, 255, 255, 0.4);
      --text-muted: rgba(255, 255, 255, 0.52);
      --dot-off-bg: rgba(255, 255, 255, 0.08);
      --dot-off-border: rgba(255, 255, 255, 0.12);
      --dot-off-icon: rgba(255, 255, 255, 0.35);

      display: block;
      width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      margin: 0;
      padding: 0;
      contain: layout style;
    }

    * {
      box-sizing: border-box;
      letter-spacing: 0;
    }

    button {
      font: inherit;
      color: inherit;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
    }

    /* Cartão de vidro — estado padrão, fora do modo tile.
       Os literais sao FALLBACK: valem so se o tema nao tiver carregado.
       Nunca substituir os tokens por valores fixos (docs/07). */
    .room-card {
      position: relative;
      isolation: isolate;
      width: 100%;
      max-width: 100%;
      height: 100%;
      min-width: 0;
      min-height: 0;
      color: var(--text-main);
      background: var(
        --bruno-liquid-surface-off-background,
        radial-gradient(165px 150px at 15% -9%, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0.042) 44%, transparent 73%),
        radial-gradient(150px 150px at 96% 92%, rgba(var(--accent), 0.09), transparent 69%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.118), rgba(255, 255, 255, 0.034) 36%, rgba(255, 255, 255, 0.056)),
        linear-gradient(155deg, rgba(18, 24, 36, 0.74), rgba(11, 14, 22, 0.61) 49%, rgba(33, 27, 25, 0.32))
      );
      backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
      -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
      border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255, 255, 255, 0.13));
      border-radius: var(--card-radius);
      box-shadow: var(
        --bruno-liquid-surface-off-shadow,
        inset 0 1px 0 rgba(255, 255, 255, 0.18),
        inset 1px 0 0 rgba(255, 255, 255, 0.1),
        inset -1px -1px 0 rgba(255, 255, 255, 0.026),
        0 18px 44px rgba(0, 0, 0, 0.27),
        0 0 24px rgba(110, 150, 210, 0.055)
      );
      overflow: hidden;
    }

    .room-card::before,
    .room-card::after {
      content: '';
      position: absolute;
      pointer-events: none;
      z-index: 0;
    }

    .room-card::before {
      inset: 1px;
      border-radius: calc(var(--card-radius) - 1px);
      background: var(
        --bruno-liquid-surface-off-sheen,
        radial-gradient(78px 62px at 19% 2%, rgba(255, 255, 255, 0.2), transparent 72%),
        radial-gradient(82px 92px at 94% 18%, rgba(var(--accent), 0.12), transparent 74%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.13), rgba(255, 255, 255, 0) 35%),
        linear-gradient(90deg, rgba(255, 255, 255, 0.085), rgba(255, 255, 255, 0) 48%)
      );
      opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
    }

    /* Filete inferior: nasce invisível e é o modo tile que o acende em âmbar
       quando o cômodo está aceso. Sem ele o tile ON perde a única marcação de
       estado que o Josh admite. */
    .room-card::after {
      inset: auto clamp(12.48px, 7.31cqi, 20.8px) clamp(6.24px, 3.66cqi, 10.4px) clamp(12.48px, 7.31cqi, 20.8px);
      height: 1px;
      border-radius: 999px;
      background: var(
        --bruno-liquid-surface-bottom-line,
        linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.16), transparent)
      );
      opacity: var(--bruno-liquid-surface-bottom-line-opacity, 0);
    }

    .room-card.is-room-on {
      --text-main: rgba(248, 251, 255, 0.96);
      --text-soft: rgba(255, 255, 255, 0.52);
      --text-muted: rgba(255, 255, 255, 0.62);
      --dot-off-bg: rgba(8, 12, 20, 0.22);
      --dot-off-border: rgba(255, 255, 255, 0.2);
      --dot-off-icon: rgba(255, 255, 255, 0.66);
      background: var(
        --bruno-liquid-surface-on-background,
        radial-gradient(170px 134px at 12% -10%, rgba(255, 255, 255, 0.38), rgba(255, 255, 255, 0.105) 52%, transparent 75%),
        radial-gradient(165px 148px at 98% 94%, rgba(135, 185, 245, 0.24), transparent 68%),
        radial-gradient(122px 96px at 27% 18%, rgba(255, 232, 126, 0.105), transparent 71%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.225), rgba(255, 255, 255, 0.073) 43%, rgba(255, 255, 255, 0.108)),
        linear-gradient(155deg, rgba(42, 51, 65, 0.72), rgba(23, 28, 38, 0.58) 52%, rgba(13, 16, 24, 0.44))
      );
      backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
      -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
      border-color: var(--bruno-liquid-surface-on-border-color, rgba(255, 255, 255, 0.24));
      box-shadow: var(
        --bruno-liquid-surface-on-shadow,
        inset 0 1px 0 rgba(255, 255, 255, 0.32),
        inset 1px 0 0 rgba(255, 255, 255, 0.13),
        inset 0 -1px 0 rgba(0, 0, 0, 0.18),
        0 0 22px rgba(255, 255, 255, 0.09),
        0 0 34px rgba(120, 170, 235, 0.1),
        0 18px 42px rgba(0, 0, 0, 0.28)
      );
    }

    .room-card.is-room-on::before {
      background: var(
        --bruno-liquid-surface-on-sheen,
        radial-gradient(92px 74px at 17% 0%, rgba(255, 255, 255, 0.34), transparent 72%),
        radial-gradient(118px 110px at 96% 96%, rgba(120, 178, 245, 0.22), transparent 74%),
        radial-gradient(80px 58px at 27% 18%, rgba(255, 232, 126, 0.095), transparent 72%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.18), rgba(255, 255, 255, 0) 38%),
        linear-gradient(90deg, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 50%)
      );
      opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
    }

    .room-action {
      appearance: none;
      -webkit-appearance: none;
      outline: none;
      position: relative;
      z-index: 1;
      width: 100%;
      height: 100%;
      display: grid;
      /* A coluna do ícone é minmax(0, 122px), não 122px fixos: a largura real do
         tile é ~183px e a coluna fixa estourava, clipando a coluna direita. */
      grid-template-columns: minmax(0, clamp(95.16px, 55.77cqi, 158.6px)) minmax(0, 1fr) clamp(31.2px, 18.29cqi, 52px);
      grid-template-rows: auto minmax(0, 1fr) auto auto;
      grid-template-areas:
        'icon space right'
        'icon space right'
        'title title right'
        'state state right';
      column-gap: clamp(4.68px, 2.74cqi, 7.8px);
      row-gap: 0;
      align-items: start;
      padding: clamp(10.92px, 6.4cqi, 18.2px) clamp(8.58px, 5.03cqi, 14.3px) clamp(10.14px, 5.94cqi, 16.9px) clamp(8.58px, 5.03cqi, 14.3px);
      margin: 0;
      text-align: left;
      background: transparent;
      border: 0;
      border-radius: var(--card-radius);
      box-shadow: none;
      overflow: hidden;
      transition:
        transform var(--bruno-liquid-motion-fast, 160ms ease),
        filter var(--bruno-liquid-motion-fast, 160ms ease);
    }

    .room-action:hover {
      filter: brightness(1.05);
    }

    .room-action.is-pressed {
      transform: translateY(1px) scale(0.985);
    }

    .room-action.is-hold-fired {
      filter: drop-shadow(0 0 18px rgba(var(--accent), 0.28));
    }

    /* Medido no bruno-office-card renderizado, nao lido do config.
       A caixa do icone NAO e quadrada: largura fluida com teto de 122px e
       ALTURA FIXA de 82px. O valor "icon_size: 94" que aparece no config dos
       cards e fallback — o CSS o sobrescreve. Sem margens negativas. */
    .room-icon {
      grid-area: icon;
      justify-self: start;
      align-self: start;
      position: relative;
      width: 100%;
      max-width: clamp(95.16px, 55.77cqi, 158.6px);
      height: clamp(63.96px, 37.49cqi, 106.6px);
      margin-left: 0;
      margin-top: 1px;
    }

    .room-asset-wrap {
      position: absolute;
      inset: 0;
      display: block;
    }

    /* Assets V2: maquetes numa tela QUADRADA de 512x512 com cerca de 5% de
       margem transparente em volta. Os cards atuais usam PNGs "tight", em que o
       desenho encosta na borda do arquivo — por isso a mesma regra de CSS
       produz alturas diferentes nos dois.

       Estes tres valores existem para o CONTEUDO OPACO cair onde cai o do card
       real: altura de 81,7px e topo 2,3px acima da caixa do icone, que e o que
       alinha o desenho com a temperatura na coluna da direita. Medido com a
       caixa alfa de cada arquivo, nao calibrado no olho. A margem varia de 24 a
       32px entre os oito arquivos, o que deixa 1,2px de dispersao residual. */
    .room-asset {
      position: absolute;
      top: 0;
      left: 0;
      height: 111%;
      width: auto;
      aspect-ratio: 1 / 1;
      object-fit: contain;
      object-position: left top;
      transform: translate(-8.66%, -7.81%);
      filter: drop-shadow(0 6px 8px rgba(0, 0, 0, 0.22));
      transition: opacity 420ms ease, filter 420ms ease;
    }

    .room-asset-on {
      opacity: 0;
    }
    .room-card.is-room-on .room-asset-off {
      opacity: 0;
    }
    .room-card.is-room-on .room-asset-on {
      opacity: 1;
      filter: drop-shadow(0 6px 9px rgba(0, 0, 0, 0.2)) drop-shadow(0 0 12px rgba(255, 187, 72, 0.14));
    }

    /* Zona de navegação: ocupa as duas primeiras colunas nas duas últimas
       linhas. O min-height de 56px NÃO é decorativo — é ele que fixa a altura
       das linhas do grid; sem ele o bloco de título assenta alguns pixels mais
       baixo que o dos cards vizinhos. */
    .room-nav-zone {
      grid-column: 1 / 3;
      grid-row: 3 / 5;
      justify-self: start;
      align-self: end;
      position: relative;
      z-index: 4;
      min-width: 0;
      width: 100%;
      min-height: clamp(43.68px, 25.6cqi, 72.8px);
      /* ANTERIOR: padding: 2px 24px 2px 0
         Os 24px eram respiro, não alvo de toque — a zona já ocupa duas colunas
         inteiras. Numa célula de 152px (a largura real no tablet) sobravam 44px
         para o título, e SEIS dos oito cômodos saíam cortados. 8px devolvem 16px
         ao texto sem encostar na coluna dos pontos, que é a terceira. */
      padding: 2px clamp(6.24px, 3.66cqi, 10.4px) 2px 0;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      outline: none;
      cursor: pointer;
      user-select: none;
      -webkit-user-select: none;
      touch-action: manipulation;
      -webkit-tap-highlight-color: transparent;
    }

    .room-title-row {
      display: flex;
      align-items: center;
      /* ANTERIOR: gap: 8px — mais 4px para o título, pela mesma razão do padding
         da zona de navegação acima. O chevron continua legível colado. */
      gap: clamp(3.12px, 1.83cqi, 5.2px);
      min-width: 0;
    }

    .title {
      display: block;
      min-width: 0;
      margin: 0 0 2px 0;
      font-size: clamp(11.7px, 6.86cqi, 19.5px);
      line-height: 1.18;
      font-weight: 700;
      color: var(--text-main);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* Só em cômodo COM subview. Onde não há, o chevron seria promessa falsa. */
    .room-chevron {
      flex: 0 0 auto;
      font-size: clamp(17.94px, 10.51cqi, 29.9px);
      line-height: 1;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.56);
      transform: translateY(-1px);
      transition:
        color var(--bruno-liquid-motion-fast, 140ms ease),
        transform var(--bruno-liquid-motion-fast, 140ms ease),
        filter var(--bruno-liquid-motion-fast, 140ms ease);
    }

    .room-nav-zone.is-pressed .title,
    .room-nav-zone.is-pressed .status-lines {
      filter: brightness(1.13);
    }

    .room-nav-zone.is-pressed .room-chevron {
      color: rgba(255, 255, 255, 0.96);
      transform: translate(2px, -1px);
      filter: drop-shadow(0 0 8px rgba(255, 255, 255, 0.26));
    }

    .room-nav-zone.is-hold-fired .room-chevron {
      color: rgba(255, 214, 150, 0.98);
      filter: drop-shadow(0 0 10px rgba(255, 190, 90, 0.34));
    }

    .room-nav-zone.is-navigating .room-chevron {
      animation: brunoRoomChevronNavigate 360ms ease both;
    }

    @keyframes brunoRoomChevronNavigate {
      0% {
        transform: translate(0, -1px);
      }
      52% {
        transform: translate(5px, -1px);
      }
      100% {
        transform: translate(2px, -1px);
      }
    }

    .status-lines {
      min-width: 0;
      display: flex;
      flex-direction: column;
      gap: 1px;
      font-size: clamp(8.58px, 5.03cqi, 14.3px);
      line-height: 1.16;
      font-weight: 500;
      color: var(--text-soft);
      white-space: normal;
      overflow: hidden;
    }

    .status-lines span {
      display: block;
      max-width: clamp(106.08px, 62.17cqi, 176.8px);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .right-rail {
      grid-area: right;
      justify-self: center;
      align-self: start;
      margin: 0;
      padding-top: 1px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(5.46px, 3.2cqi, 9.1px);
      transform: translate(5px, -3px);
    }

    /* Medido no bruno-office-card, que É um card COM temperatura.
       36px de largura com texto centralizado deixa o dot de 26px centrado,
       sobrando 5px de cada lado — e o que alinha a metrica com os dots.

       NAO copiar do bruno-corredor-card: aquele comodo nao tem sensor de
       temperatura, a metrica nunca renderiza, e os valores de la (48px,
       text-align: left, margin-left 6px) sao codigo morto. */
    .metric {
      min-width: clamp(28.08px, 16.46cqi, 46.8px);
      text-align: center;
      line-height: 1.1;
    }
    .metric-value {
      display: block;
      font-size: clamp(10.14px, 5.94cqi, 16.9px);
      line-height: 1;
      font-weight: 760;
      color: var(--text-main);
    }
    .metric-sub {
      display: block;
      margin-top: clamp(3.12px, 1.83cqi, 5.2px);
      font-size: clamp(8.58px, 5.03cqi, 14.3px);
      line-height: 1;
      font-weight: 600;
      color: var(--text-muted);
    }

    .status-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: clamp(3.12px, 1.83cqi, 5.2px);
    }

    /* Receita VIGENTE dos cards: círculo com fundo tonal em gradiente, borda
       clara e glifo branco. Existem três recitas anteriores comentadas dentro
       do card real, todas rejeitadas — não copiar de lá. */
    .status-dot {
      width: clamp(20.28px, 11.89cqi, 33.8px);
      height: clamp(20.28px, 11.89cqi, 33.8px);
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      position: relative;
      color: #ffffff;
      background:
        radial-gradient(circle at 50% 18%, rgba(255, 255, 255, 0.3), transparent 62%),
        linear-gradient(180deg, rgba(var(--tone), 0.68), rgba(var(--tone), 0.4));
      border: 1px solid rgba(255, 255, 255, 0.38);
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.32),
        0 0 12px rgba(var(--tone), 0.32);
    }

    .tone-blue {
      --tone: var(--accent-blue);
    }
    .tone-purple {
      --tone: var(--accent-purple);
    }
    .tone-cyan {
      --tone: var(--accent-cyan);
    }
    .tone-amber {
      --tone: var(--accent-amber);
    }

    /* O bruno-icon nao tem tamanho proprio: sem estas regras ele renderiza
       colapsado e o dot fica com um glifo ilegivel. */
    .status-dot bruno-icon {
      --mdc-icon-size: 14px;
      width: clamp(10.92px, 6.4cqi, 18.2px);
      height: clamp(10.92px, 6.4cqi, 18.2px);
      display: flex;
      align-items: center;
      justify-content: center;
      line-height: 0;
      position: absolute;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      color: #ffffff;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.28));
    }

    /* ==== MODO TILE (tema Josh + variant: tile) =========================
       O tile não tem moldura própria: quem desenha o fundo é a faixa que o
       hospeda. ON e OFF compartilham a MESMA regra de superfície — não existe
       fundo esbranquiçado no estado aceso; o estado aparece no filete âmbar da
       base e no brilho difuso sob o título.
       INVARIANTE: o tile perde o backdrop-filter aqui, e é isso que autoriza a
       FAIXA a ter blur. Se o tile voltar a filtrar, o blur da faixa sai no mesmo
       commit — senão volta borrão sobre borrão.
       ==================================================================== */
    .room-card.is-tile,
    .room-card.is-tile.is-room-on {
      background: var(--bruno-tile-background, none);
      border: var(--bruno-tile-border, 0);
      border-radius: var(--bruno-tile-radius, 0);
      box-shadow: var(--bruno-tile-shadow, none);
      backdrop-filter: var(--bruno-tile-filter, none);
      -webkit-backdrop-filter: var(--bruno-tile-filter, none);
    }

    .room-card.is-tile::before,
    .room-card.is-tile.is-room-on::before {
      opacity: var(--bruno-tile-sheen-opacity, 0);
    }

    .room-card.is-tile.is-room-on::after {
      inset: auto clamp(10.92px, 6.4cqi, 18.2px) 0 clamp(10.92px, 6.4cqi, 18.2px);
      opacity: 1;
      background: var(
        --bruno-tile-on-line,
        linear-gradient(90deg, rgba(255, 187, 72, 0) 0%, rgba(255, 187, 72, 0.42) 50%, rgba(255, 187, 72, 0) 100%)
      );
    }

    .room-card.is-tile .room-action {
      position: relative;
    }

    .room-card.is-tile.is-room-on .room-action::after {
      content: '';
      position: absolute;
      left: clamp(6.24px, 3.66cqi, 10.4px);
      right: clamp(6.24px, 3.66cqi, 10.4px);
      bottom: 0;
      height: clamp(35.88px, 21.03cqi, 59.8px);
      z-index: 0;
      pointer-events: none;
      background: var(
        --bruno-tile-on-glow,
        radial-gradient(60px 30px at 50% 100%, rgba(255, 187, 72, 0.1), transparent 72%)
      );
    }

    /* Filete vertical no lugar do gap (o gap vira 0 via --bruno-tile-gap). */
    .room-card.is-tile.has-divider .tile-divider {
      position: absolute;
      left: 0;
      top: clamp(6.24px, 3.66cqi, 10.4px);
      bottom: clamp(6.24px, 3.66cqi, 10.4px);
      width: 1px;
      z-index: 2;
      pointer-events: none;
      background: var(
        --bruno-tile-divider,
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.19) 22%,
          rgba(255, 255, 255, 0.19) 78%,
          rgba(255, 255, 255, 0) 100%
        )
      );
    }

    /* Josh: material flat dos dots, restrito aos tiles da Home. */
    .room-card.is-tile .status-dot {
      background: rgba(var(--tone), var(--bruno-tile-status-dot-fill-alpha, 0.78));
      border: var(--bruno-tile-status-dot-border, 0);
      box-shadow: 0 0 var(--bruno-tile-status-dot-halo-size, 8px)
        rgba(var(--tone), var(--bruno-tile-status-dot-halo-alpha, 0.18));
    }

    /* ==== BREAKPOINTS DOS CARDS ATUAIS ==================================
       Não são enfeite: sem eles o tile fica com o ícone 10px mais alto e 2px
       mais de padding que os vizinhos em telas baixas — e foi assim que a
       primeira comparação lado a lado saiu desalinhada. A compensação da
       maquete V2 é proporcional (111% da altura da caixa), então acompanha os
       três tamanhos sozinha.
       ==================================================================== */
    @media (max-height: 760px) {
      .room-action {
        padding: clamp(9.36px, 5.49cqi, 15.6px) clamp(8.58px, 5.03cqi, 14.3px) clamp(9.36px, 5.49cqi, 15.6px) clamp(8.58px, 5.03cqi, 14.3px);
      }
      .room-icon {
        width: 100%;
        max-width: clamp(84.24px, 49.37cqi, 140.4px);
        height: clamp(56.16px, 32.91cqi, 93.6px);
      }
    }

    @media (max-width: 800px) {
      .room-action {
        padding: clamp(8.58px, 5.03cqi, 14.3px) clamp(9.36px, 5.49cqi, 15.6px) clamp(7.8px, 4.57cqi, 13px) clamp(7.8px, 4.57cqi, 13px);
      }
      .room-icon {
        max-width: clamp(78px, 45.71cqi, 130px);
        height: clamp(48.36px, 28.34cqi, 80.6px);
      }
    }

    /* ==== PAINEL PRÓPRIO (cômodo sem subview) ==========================
       Transcrito do dialog do bruno-lavabo-card. O elemento é <dialog> com
       showModal(): renderiza na top layer do navegador, acima de tudo e imune ao
       overflow hidden e aos transform dos ancestrais — que era o motivo de o
       painel antigo, com position fixed, sair cortado dentro da shell.
       ==================================================================== */
    .room-popup {
      margin: 0;
      padding: 0;
      border: 0;
      inset: 0;
      width: 100vw;
      max-width: 100vw;
      height: 100vh;
      max-height: 100vh;
      background: transparent;
      color: inherit;
      overflow: visible;
    }

    .room-popup[open] {
      display: block;
    }
    .room-popup:not([open]) {
      display: none;
    }

    .room-popup::backdrop {
      background: rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(3px) saturate(1.04);
      -webkit-backdrop-filter: blur(3px) saturate(1.04);
    }

    /* O painel é fixed e recebe top/left inline: quem o ancora ao tile é o JS. */
    .room-popup-panel {
      position: fixed;
      top: 0;
      left: 0;
      z-index: 1;
      width: min(clamp(405.6px, 237.71cqi, 676px), calc(100vw - clamp(40.56px, 23.77cqi, 67.6px)));
      border-radius: var(--bruno-liquid-panel-radius, 18px);
      border: var(--bruno-liquid-popup-border, 1px solid rgba(255, 255, 255, 0.16));
      color: rgba(255, 255, 255, 0.94);
      background: var(
        --bruno-liquid-popup-background,
        linear-gradient(180deg, rgba(44, 33, 26, 0.8), rgba(16, 14, 14, 0.82)),
        rgba(20, 18, 18, 0.8)
      );
      box-shadow:
        inset 0 1px 0 rgba(255, 255, 255, 0.16),
        0 24px 64px rgba(0, 0, 0, 0.42);
      backdrop-filter: var(--bruno-liquid-popup-filter, blur(28px) saturate(1.42));
      -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(28px) saturate(1.42));
      overflow: hidden;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel {
      border: var(--bruno-josh-popup-border, var(--bruno-liquid-popup-border));
      background: var(--bruno-josh-popup-background, var(--bruno-liquid-popup-background));
      box-shadow: var(--bruno-josh-popup-shadow, var(--bruno-liquid-popup-shadow));
      backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
      -webkit-backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
      isolation: isolate;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel::before {
      content: '';
      position: absolute;
      inset: 1px;
      z-index: 0;
      border-radius: inherit;
      background: var(--bruno-josh-popup-sheen, none);
      opacity: var(--bruno-josh-popup-sheen-opacity, 0.13);
      pointer-events: none;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel::after {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 2;
      padding: 1px;
      border-radius: inherit;
      background: var(--bruno-josh-popup-edge-glow, none);
      opacity: var(--bruno-josh-popup-edge-opacity, 0.7);
      pointer-events: none;
      -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask-composite: exclude;
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-panel > * {
      position: relative;
      z-index: 1;
    }

    .room-popup-header {
      height: clamp(40.56px, 23.77cqi, 67.6px);
      padding: clamp(7.8px, 4.57cqi, 13px) clamp(9.36px, 5.49cqi, 15.6px) clamp(6.24px, 3.66cqi, 10.4px) clamp(10.92px, 6.4cqi, 18.2px);
      display: flex;
      align-items: center;
      gap: clamp(7.8px, 4.57cqi, 13px);
    }

    .room-popup-icon {
      width: clamp(23.4px, 13.71cqi, 39px);
      height: clamp(23.4px, 13.71cqi, 39px);
      display: grid;
      place-items: center;
      border-radius: 50%;
      color: rgb(255, 195, 83);
      background: rgba(255, 185, 70, 0.13);
      border: 1px solid rgba(255, 190, 80, 0.35);
    }

    .room-popup-icon bruno-icon {
      --mdc-icon-size: 16px;
    }

    .room-popup-title {
      flex: 1 1 auto;
      min-width: 0;
      display: grid;
      gap: 2px;
    }

    .room-popup-title strong {
      font-size: clamp(10.92px, 6.4cqi, 18.2px);
      line-height: 1;
      font-weight: 800;
    }

    .room-popup-title span {
      font-size: clamp(7.8px, 4.57cqi, 13px);
      line-height: 1;
      font-weight: 650;
      color: rgba(255, 255, 255, 0.52);
    }

    .room-popup-close {
      appearance: none;
      width: clamp(23.4px, 13.71cqi, 39px);
      height: clamp(23.4px, 13.71cqi, 39px);
      display: grid;
      place-items: center;
      border-radius: 50%;
      border: 1px solid rgba(255, 255, 255, 0.14);
      color: rgba(255, 255, 255, 0.72);
      background: rgba(255, 255, 255, 0.08);
    }

    .room-popup[data-bruno-popup-theme='josh'] .room-popup-close {
      border: var(--bruno-liquid-control-border, 1px solid rgba(255, 255, 255, 0.14));
      background: var(--bruno-liquid-control-background, rgba(255, 255, 255, 0.08));
      box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.12));
      backdrop-filter: var(--bruno-liquid-control-filter, none);
      -webkit-backdrop-filter: var(--bruno-liquid-control-filter, none);
    }

    .room-popup-banner {
      position: relative;
      height: clamp(99.84px, 58.51cqi, 166.4px);
      margin: 0 clamp(9.36px, 5.49cqi, 15.6px) clamp(9.36px, 5.49cqi, 15.6px);
      border-radius: 14px;
      border: 1px solid rgba(255, 255, 255, 0.12);
      overflow: hidden;
      background:
        radial-gradient(140px 80px at 20% 14%, rgba(255, 219, 155, 0.2), transparent 70%),
        linear-gradient(135deg, rgba(86, 62, 44, 0.7), rgba(20, 17, 16, 0.86));
    }

    .room-popup-banner img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
      filter: brightness(0.86) saturate(1.04);
    }

    /* Escurece o perímetro da foto para fundir com o painel. */
    .room-popup-banner-shade {
      position: absolute;
      inset: 0;
      pointer-events: none;
      background:
        linear-gradient(90deg, rgba(12, 9, 7, 0.72) 0%, rgba(12, 9, 7, 0.28) 7%, transparent 18%),
        linear-gradient(270deg, rgba(12, 9, 7, 0.72) 0%, rgba(12, 9, 7, 0.28) 7%, transparent 18%),
        linear-gradient(0deg, rgba(12, 9, 7, 0.78) 0%, rgba(12, 9, 7, 0.3) 8%, transparent 22%),
        linear-gradient(180deg, rgba(255, 255, 255, 0.1) 0%, rgba(12, 9, 7, 0.34) 6%, transparent 20%);
    }

    .room-popup-lights {
      padding: 0 clamp(9.36px, 5.49cqi, 15.6px) clamp(10.92px, 6.4cqi, 18.2px);
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: clamp(6.24px, 3.66cqi, 10.4px);
    }

    .room-popup-light {
      appearance: none;
      min-width: 0;
      min-height: clamp(57.72px, 33.83cqi, 96.2px);
      padding: clamp(7.8px, 4.57cqi, 13px) clamp(7.02px, 4.11cqi, 11.7px);
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: clamp(7.02px, 4.11cqi, 11.7px);
      text-align: left;
      border-radius: var(--bruno-liquid-control-radius, 11px);
      border: var(--bruno-liquid-control-border, 1px solid rgba(255, 255, 255, 0.14));
      color: rgba(255, 255, 255, 0.88);
      background: var(--bruno-liquid-control-background, rgba(255, 255, 255, 0.075));
      box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255, 255, 255, 0.12));
      backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(1.08));
      -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(1.08));
    }

    .room-popup-light.is-on {
      color: rgba(255, 246, 225, 0.98);
      border-color: rgba(255, 195, 80, 0.38);
      background:
        radial-gradient(80px 48px at 18% 12%, rgba(255, 203, 95, 0.22), transparent 70%),
        rgba(255, 255, 255, 0.09);
    }

    .room-popup-light.is-unavailable {
      opacity: 0.58;
    }

    .room-popup-light-icon {
      width: clamp(23.4px, 13.71cqi, 39px);
      height: clamp(23.4px, 13.71cqi, 39px);
      display: grid;
      place-items: center;
      color: rgb(255, 197, 92);
    }

    .room-popup-light-icon bruno-icon {
      --mdc-icon-size: 24px;
    }

    .room-popup-light-copy {
      min-width: 0;
      display: grid;
      gap: clamp(3.12px, 1.83cqi, 5.2px);
    }

    .room-popup-light-copy strong,
    .room-popup-light-copy span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .room-popup-light-copy strong {
      font-size: clamp(9.36px, 5.49cqi, 15.6px);
      line-height: 1;
      font-weight: 800;
    }

    .room-popup-light-copy span {
      font-size: clamp(7.8px, 4.57cqi, 13px);
      line-height: 1;
      font-weight: 650;
      color: rgba(255, 255, 255, 0.56);
    }

    @media (prefers-reduced-motion: reduce) {
      .room-action,
      .room-asset,
      .room-chevron {
        transition: none;
      }
      .room-nav-zone.is-navigating .room-chevron {
        animation: none;
      }
    }
  `;
  }
  render() {
    const a = this._room, e = this._hass;
    if (!a) return h;
    const o = e ? te(e, a.entities.lightGroup ?? a.entities.lights?.[0]) : !1, i = e ? re(e, a.entities.temperature, "°") : "--", t = e ? re(e, a.entities.humidity, "%") : "--", n = !!(a.entities.temperature ?? a.entities.humidity), c = this._statusLines(), s = this._dots(), l = "20260808-maquetes-premium-1", m = a.assetOff ? `/local/bruno-ui/assets/${a.assetOff}.png?v=${l}` : "", d = a.assetOn ? `/local/bruno-ui/assets/${a.assetOn}.png?v=${l}` : "", u = [
      "room-card",
      o ? "is-room-on" : "",
      this._tileMode ? "is-tile" : "",
      this._tileMode && this._config?.divider_left ? "has-divider" : ""
    ].filter(Boolean).join(" "), g = this._config?.name ?? a.name, f = !!(a.section ?? a.popup), v = a.popup, q = globalThis.BrunoThemeManager?.current?.() === "josh" ? "josh" : "default";
    return p`
      <div class=${u}>
        ${this._tileMode && this._config?.divider_left ? p`<span class="tile-divider" aria-hidden="true"></span>` : h}
        <button
          class="room-action"
          type="button"
          aria-label=${g}
          @pointerdown=${(b) => this._onDown("room", b)}
          @pointermove=${(b) => this._onMove("room", b)}
          @pointerup=${(b) => this._onUp("room", b)}
          @pointercancel=${(b) => this._onCancel("room", b)}
          @pointerleave=${() => this._resetGesture("room")}
          @keydown=${(b) => this._onKey("room", b)}
          @click=${(b) => {
      b.preventDefault(), b.stopPropagation();
    }}
          @dblclick=${(b) => {
      b.preventDefault(), b.stopPropagation();
    }}
        >
          <div class="room-icon" aria-hidden="true">
            <span class="room-asset-wrap">
              ${m ? p`<img class="room-asset room-asset-off" src=${m} alt="" decoding="async" />` : h}
              ${d ? p`<img class="room-asset room-asset-on" src=${d} alt="" decoding="async" />` : h}
            </span>
          </div>

          <span
            class="room-nav-zone"
            role=${f ? "button" : "presentation"}
            tabindex=${f ? 0 : -1}
            aria-label=${f ? `Abrir ${g}` : g}
            @pointerdown=${(b) => f && this._onDown("nav", b)}
            @pointermove=${(b) => f && this._onMove("nav", b)}
            @pointerup=${(b) => f && this._onUp("nav", b)}
            @pointercancel=${(b) => f && this._onCancel("nav", b)}
            @pointerleave=${() => f && this._resetGesture("nav")}
            @keydown=${(b) => f && this._onKey("nav", b)}
          >
            <span class="room-title-row">
              <span class="title">${g}</span>
              ${f ? p`<span class="room-chevron" aria-hidden="true">›</span>` : h}
            </span>
            <span class="status-lines">${c.map((b) => p`<span>${b}</span>`)}</span>
          </span>

          <div class="right-rail" aria-label="Status do ambiente">
            ${n ? p`<div class="metric" aria-label="Temperatura e umidade">
                  <span class="metric-value">${i}</span>
                  <span class="metric-sub">${t}</span>
                </div>` : h}
            <div class="status-stack">
              ${s.map(
      (b) => p`<span class="status-dot tone-${b.tone}" title=${b.label} aria-label=${b.label}>
                  <bruno-icon icon=${b.icon}></bruno-icon>
                </span>`
    )}
            </div>
          </div>
        </button>
        ${v ? p`<dialog
              class="room-popup"
              data-bruno-popup-theme=${q}
              aria-label=${v.title}
              @click=${(b) => {
      b.target === b.currentTarget && this._fecharPainel();
    }}
            >
              <section class="room-popup-panel" role="document" @click=${(b) => b.stopPropagation()}>
                <header class="room-popup-header">
                  <span class="room-popup-icon" aria-hidden="true">
                    <bruno-icon icon=${v.icon}></bruno-icon>
                  </span>
                  <div class="room-popup-title">
                    <strong>${v.title}</strong>
                    ${v.subtitle ? p`<span>${v.subtitle}</span>` : h}
                  </div>
                  <button
                    class="room-popup-close"
                    type="button"
                    aria-label="Fechar"
                    @click=${this._fecharPainel}
                  >
                    ×
                  </button>
                </header>
                ${v.banner || v.bannerOn ? p`<div class="room-popup-banner">
                      <img
                        src=${(o ? v.bannerOn ?? v.banner : v.banner ?? v.bannerOn) ?? ""}
                        alt=""
                        loading="eager"
                        decoding="async"
                      />
                      <div class="room-popup-banner-shade" aria-hidden="true"></div>
                    </div>` : h}
                <div class="room-popup-lights">
                  ${v.lights.map((b) => {
      const $ = e?.states[b.entity], M = String($?.state ?? "").toLowerCase(), O = M === "on", P = !$ || ["unavailable", "unknown", "none", ""].includes(M), w = [
        "room-popup-light",
        O ? "is-on" : "",
        P ? "is-unavailable" : ""
      ].filter(Boolean).join(" ");
      return p`<button
                      class=${w}
                      type="button"
                      aria-label=${b.name}
                      @click=${() => this._alternarLuzDoPainel(b.entity)}
                    >
                      <span class="room-popup-light-icon" aria-hidden="true">
                        <bruno-icon icon=${b.icon ?? "mdi:lightbulb-outline"}></bruno-icon>
                      </span>
                      <span class="room-popup-light-copy">
                        <strong>${b.name}</strong>
                        <span>${P ? "Indisponivel" : O ? "Ligada" : "Desligada"}</span>
                      </span>
                    </button>`;
    })}
                </div>
              </section>
            </dialog>` : h}
      </div>
    `;
  }
}
customElements.get("bruno-room-tile") || customElements.define("bruno-room-tile", Xo);
const fa = window;
fa.customCards = fa.customCards ?? [];
fa.customCards.some((r) => r.type === "bruno-room-tile") || fa.customCards.push({
  type: "bruno-room-tile",
  name: "Bruno · Tile de cômodo",
  description: "Tile parametrizado por cômodo (arquitetura nova)."
});
const Qo = {
  sala: {
    title: "Sala",
    background: "/local/images/sala_estar.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/sala_estar.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Show",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1",
        script: "script.sala_tv_open_netflix"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1",
        script: "script.sala_tv_open_prime"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1",
        script: "script.sala_tv_open_disney"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1",
        script: "script.sala_tv_open_hbo"
      }
    ],
    entities: {
      curtain: "cover.cortina_varanda_cortina_2",
      curtainPercentControl: "number.cortina_varanda_percent_control",
      activeSensor: "sensor.living_room_active",
      semanticSensor: "sensor.sala_semantic_state_supervised",
      motionRecent: "binary_sensor.sala_motion_recent",
      occupancy: "binary_sensor.sala_occupancy",
      presence: "binary_sensor.sensor_4_in_1_sala_presence",
      illuminance: "sensor.sensor_4_in_1_sala_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_sala_temperature",
        "sensor.sl_sensor_temp_humid_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_sala_humidity",
        "sensor.sl_sensor_temp_humid_umidade"
      ],
      roomGroup: "light.grupo_luzes_sala",
      cameraMain: "camera.sl_camera_profile_1",
      cameraSecondary: "camera.vr_camera_profile_1",
      activeCameraSelect: "input_select.bento_active_camera",
      tv: "media_player.android_tv_192_168_3_17",
      tvRemotePlayer: "media_player.atv",
      tvRemote: "remote.atv",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_show",
      climate: "climate.sl_ar_condicionado",
      ps5: "switch.ps5_power",
      ps5Image: "/local/images/ps5.png?v=20260702-all-images-1",
      lights: [
        {
          entity: "light.sala_switch_2",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.sala_switch_1",
          name: "Led esquerdo",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.sala_switch_3",
          name: "Led direito",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.sala_2_switch_2",
          name: "Luz principal",
          iconType: "ledstrip",
          zone: "varanda"
        },
        {
          entity: "light.varanda_switch_2",
          name: "Pendente",
          iconType: "pendant",
          zone: "varanda"
        },
        {
          entity: "light.varanda_switch_1",
          name: "Area gourmet",
          iconType: "ledstrip",
          zone: "varanda"
        },
        {
          entity: "light.sala_2_switch_3",
          name: "Cristaleira",
          iconType: "ledstrip",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.sl_camera_profile_1",
          name: "Sala Principal",
          shortName: "Sala",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.sl_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.sl_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.sl_camera_modo_de_privacidade"
            }
          ]
        },
        {
          entity: "camera.vr_camera_profile_1",
          name: "Sala Lateral",
          shortName: "Varanda",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.vr_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.vr_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.vr_camera_modo_de_privacidade"
            }
          ]
        }
      ]
    }
  },
  office: {
    title: "Office",
    background: "/local/images/office.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/office.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Pop Office",
    climateDeviceName: "Gree",
    pcImage: "/local/images/office_pc.png?v=20260702-all-images-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    entities: {
      activeSensor: "sensor.office_active",
      semanticSensor: "sensor.office_semantic_state_supervised",
      motionRecent: "binary_sensor.office_motion_recent",
      occupancy: "binary_sensor.office_occupancy",
      meeting: "binary_sensor.office_meeting_active",
      working: "binary_sensor.office_working_active",
      presence: "binary_sensor.sensor_4_in_1_office_presence",
      illuminance: "sensor.sensor_4_in_1_office_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_office_temperature"
      ],
      humidity: [
        "sensor.sensor_4_in_1_office_humidity"
      ],
      roomGroup: "light.grupo_luzes_office",
      cameraMain: "camera.of_camera_profile_1",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_pop_office",
      climate: "climate.ac_office",
      pcActive: "binary_sensor.office_pc_active",
      pcPower: "button.desktop_melg9vv_pc_office_switch",
      pcShutdown: "button.desktop_melg9vv_pc_office_desliga",
      pcSleep: "button.desktop_melg9vv_pc_office_sleep",
      pcRestart: "button.desktop_melg9vv_pc_office_reiniciar",
      pcLock: "button.desktop_melg9vv_pc_office_bloquear",
      pcSession: "sensor.desktop_melg9vv_office_pc_session_state",
      pcIdle: "sensor.desktop_melg9vv_office_pc_idle_time",
      pcWindow: "sensor.desktop_melg9vv_office_pc_active_window",
      lights: [
        {
          entity: "light.office_switch_3",
          name: "Luz central",
          iconType: "light_flush",
          zone: "office"
        },
        {
          entity: "light.office_switch_2",
          name: "Luz ambiente",
          iconType: "light_flush",
          zone: "office"
        },
        {
          entity: "light.office_switch_1",
          name: "Luz estante",
          iconType: "ledstrip",
          zone: "office"
        }
      ],
      cameras: [
        {
          entity: "camera.of_camera_profile_1",
          name: "Office",
          shortName: "Office",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.of_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.of_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.of_camera_modo_de_privacidade"
            }
          ]
        }
      ]
    }
  },
  cozinha: {
    title: "Cozinha",
    background: "/local/images/cozinha.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/cozinha.jpg?v=20260702-all-images-1",
    entities: {
      activeSensor: "sensor.cozinha_active",
      semanticSensor: "sensor.cozinha_semantic_state_supervised",
      motionRecent: "binary_sensor.cozinha_motion_recent",
      occupancy: "binary_sensor.cozinha_occupancy",
      presence: "binary_sensor.sensor_4_in_1_cozinha_presence",
      illuminance: "sensor.sensor_4_in_1_cozinha_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_cozinha_temperature",
        "sensor.temperatura_cozinha",
        "sensor.cozinha_temperature",
        "sensor.cozinha_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_cozinha_humidity",
        "sensor.umidade_cozinha",
        "sensor.cozinha_humidity",
        "sensor.cozinha_umidade"
      ],
      roomGroup: "light.grupo_luzes_cozinha",
      cameraMain: "camera.cz_camera_profile_1",
      cameraSecondary: "camera.as_camera_profile_1",
      dishwasher: "sensor.lava_loucas_operation_state",
      dishwasherPower: "switch.cz_tomada_maq_lav_louca_socket_1",
      lights: [
        {
          entity: "light.cozinha_switch_2",
          name: "Luz principal 1",
          iconType: "ledstrip",
          zone: "cozinha"
        },
        {
          entity: "light.cozinha_switch_3",
          name: "Luz principal 2",
          iconType: "ledstrip",
          zone: "cozinha"
        },
        {
          entity: "light.cozinha_switch_1",
          name: "Lavanderia",
          iconType: "light_flush",
          zone: "cozinha"
        }
      ],
      appliances: [
        {
          key: "dishwasher",
          name: "Lava-louças",
          entity: "switch.cz_tomada_maq_lav_louca_socket_1",
          stateEntity: "sensor.lava_loucas_operation_state",
          moreInfoEntity: "switch.cz_tomada_maq_lav_louca_socket_1",
          image: "/local/images/lava_louca.png?v=20260702-all-images-1",
          activeStates: [
            "on",
            "run"
          ],
          activeAttr: "dishwasher_running",
          activeLabel: "Lavando",
          onLabel: "Ligada",
          idleLabel: "Ligada",
          offLabel: "Desligada"
        },
        {
          key: "airfryer",
          name: "Air fryer",
          image: "/local/images/air_fry.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Sem tomada"
        },
        {
          key: "fridge",
          name: "Geladeira",
          image: "/local/images/geladeira.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Sem tomada"
        },
        {
          key: "microwave",
          name: "Micro-ondas",
          image: "/local/images/microondas.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Sem tomada"
        },
        {
          key: "washer",
          name: "Lavadora",
          image: "/local/images/lava_roupa.png?v=20260702-all-images-1",
          placeholder: !0,
          placeholderLabel: "Wi-Fi pendente"
        }
      ],
      cameras: [
        {
          entity: "camera.cz_camera_profile_1",
          name: "Cozinha",
          shortName: "Cozinha",
          controls: [
            {
              key: "sound",
              label: "Som",
              description: "Detecção de som",
              icon: "mdi:microphone-outline",
              entity: "switch.cz_camera_deteccao_de_som"
            },
            {
              key: "motion",
              label: "Mov.",
              description: "Alarme de movimento",
              icon: "mdi:run-fast",
              entity: "switch.cz_camera_alarme_de_movimento"
            },
            {
              key: "privacy",
              label: "Priv.",
              description: "Modo de privacidade",
              icon: "mdi:eye-off-outline",
              entity: "switch.cz_camera_modo_de_privacidade"
            }
          ]
        },
        {
          entity: "camera.as_camera_profile_1",
          name: "Area de Servico",
          shortName: "Area"
        }
      ]
    }
  },
  casal: {
    title: "Q. Casal",
    background: "/local/images/quarto_casal.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/quarto_casal.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Pop Quarto Casal",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1"
      }
    ],
    lightZoneLabels: {
      sala: "Quarto",
      varanda: "Suíte"
    },
    lightZoneIcons: {
      varanda: "hugeicons:shower-head"
    },
    entities: {
      activeSensor: "sensor.quarto_casal_active",
      semanticSensor: "sensor.q_casal_semantic_state_supervised",
      motionRecent: "binary_sensor.q_casal_motion_recent",
      occupancy: "binary_sensor.q_casal_occupancy",
      presence: "binary_sensor.sensor_4_in_1_q_casal_presence",
      illuminance: "sensor.sensor_4_in_1_q_casal_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_q_casal_temperature"
      ],
      humidity: [
        "sensor.sensor_4_in_1_q_casal_humidity"
      ],
      roomGroup: "light.grupo_quarto_casal",
      cameraMain: "camera.qc_camera_profile_1",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_pop_quarto_casal",
      climate: "climate.qc_ar_condicionado",
      lights: [
        {
          entity: "light.qc_luz_principal",
          name: "Luz principal",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.quarto_casal_switch_1",
          name: "Luzes quadros",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_casal_2_switch_2",
          name: "Luz sanca",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_casal_switch_2",
          name: "Luzes closet",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.suite_casal_switch_1",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "varanda"
        },
        {
          entity: "light.suite_casal_switch_2",
          name: "Luz azul",
          iconType: "light_flush",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.qc_camera_profile_1",
          name: "Quarto Casal",
          shortName: "Casal"
        }
      ]
    }
  },
  marina: {
    title: "Q. Marina",
    background: "/local/images/quarto_marina.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/quarto_marina.jpg?v=20260702-all-images-1",
    spotifyDeviceName: "Echo Pop Marina",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1"
      }
    ],
    lightZoneLabels: {
      sala: "Quarto",
      varanda: "Suíte"
    },
    lightZoneIcons: {
      varanda: "hugeicons:shower-head"
    },
    entities: {
      activeSensor: "sensor.quarto_marina_active",
      motionRecent: "binary_sensor.q_marina_motion_recent",
      occupancy: "binary_sensor.q_marina_occupancy",
      semanticSensor: "sensor.q_marina_semantic_state_supervised",
      presence: "binary_sensor.sensor_4_in_1_q_marina_presence",
      illuminance: "sensor.sensor_4_in_1_q_marina_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_q_marina_temperature",
        "sensor.temperatura_quarto_marina",
        "sensor.qma_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_q_marina_humidity",
        "sensor.umidade_quarto_marina",
        "sensor.qma_umidade"
      ],
      roomGroup: "light.grupo_luzes_quarto_marina",
      cameraMain: "camera.qma_camera_profile_1",
      spotify: "media_player.spotifyplus_bruno_helasio",
      speaker: "media_player.echo_pop_marina",
      climate: [
        "climate.ac_quarto_marina",
        "climate.q_marina_ar_condicionado",
        "climate.q_marina_ac",
        "climate.qma_ar_condicionado",
        "climate.qma_ac",
        "climate.quarto_marina_ar_condicionado",
        "climate.quarto_marina_ac",
        "climate.ar_condicionado_quarto_marina",
        "climate.ar_condicionado_marina",
        "climate.marina_ar_condicionado",
        "climate.marina_ac"
      ],
      lights: [
        {
          entity: "light.quarto_marina_switch_4",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_marina_switch_1",
          name: "Arandela",
          iconType: "sconce",
          zone: "sala"
        },
        {
          entity: "light.quarto_marina_switch_2",
          name: "Estante",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_marina_switch_3",
          name: "Luz cortineiro",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.suite_marina_switch_2",
          name: "Luz principal",
          iconType: "light_flush",
          zone: "varanda"
        },
        {
          entity: "light.suite_marina_switch_1",
          name: "Luz azul",
          iconType: "light_flush",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.qma_camera_profile_1",
          name: "Quarto Marina",
          shortName: "Marina"
        }
      ]
    }
  },
  miguel: {
    title: "Q. Miguel",
    background: "/local/images/quarto_miguel.jpg?v=20260702-all-images-1",
    fallbackBackground: "/local/images/quarto_miguel.jpg?v=20260702-all-images-1",
    climateDeviceName: "Gree",
    tvStandbyImage: "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1",
    spotifyStandbyImage: "/local/images/echo_pop.png?v=20260702-all-images-1",
    tvApps: [
      {
        key: "netflix",
        label: "Netflix",
        image: "/local/images/netflix_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "prime",
        label: "Prime Video",
        image: "/local/images/prime_video_tile.png?v=20260702-all-images-1"
      },
      {
        key: "disney",
        label: "Disney+",
        image: "/local/images/dp_bg.jpg?v=20260702-all-images-1"
      },
      {
        key: "max",
        label: "Max",
        image: "/local/images/HBOMax_bg.jpg?v=20260702-all-images-1"
      }
    ],
    lightZoneLabels: {
      sala: "Quarto",
      varanda: "Suíte"
    },
    lightZoneIcons: {
      varanda: "hugeicons:shower-head"
    },
    entities: {
      activeSensor: "sensor.quarto_miguel_active",
      semanticSensor: "sensor.q_miguel_semantic_state_supervised",
      motionRecent: "binary_sensor.q_miguel_motion_recent",
      occupancy: "binary_sensor.q_miguel_occupancy",
      presence: "binary_sensor.sensor_4_in_1_q_miguel_presence",
      illuminance: "sensor.sensor_4_in_1_q_miguel_illuminance",
      temperature: [
        "sensor.sensor_4_in_1_q_miguel_temperature",
        "sensor.temperatura_quarto_miguel",
        "sensor.qmi_temperatura"
      ],
      humidity: [
        "sensor.sensor_4_in_1_q_miguel_humidity",
        "sensor.umidade_quarto_miguel",
        "sensor.qmi_umidade"
      ],
      roomGroup: "light.grupo_luzes_quarto_miguel",
      cameraMain: "camera.qmi_camera_profile_1",
      climate: "climate.ac_quarto_miguel",
      lights: [
        {
          entity: "light.quarto_miguel_switch_2",
          name: "Luz principal",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_2_switch_1",
          name: "Luzes armario",
          iconType: "light_flush",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_2_switch_2",
          name: "Arandela poltrona",
          iconType: "sconce",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_2_switch_3",
          name: "Arandela berco",
          iconType: "sconce",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_switch_1",
          name: "Luz prateleiras",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.quarto_miguel_switch_3",
          name: "Luz cortineiro",
          iconType: "ledstrip",
          zone: "sala"
        },
        {
          entity: "light.suite_miguel_switch_1",
          name: "Luz suite",
          iconType: "light_flush",
          zone: "varanda"
        },
        {
          entity: "light.suite_miguel_switch_2",
          name: "Luz azul suite",
          iconType: "light_flush",
          zone: "varanda"
        }
      ],
      cameras: [
        {
          entity: "camera.qmi_camera_profile_1",
          name: "Quarto Miguel",
          shortName: "Miguel"
        }
      ]
    }
  }
}, Y = /* @__PURE__ */ new Set(), F = { timer: void 0, ouvindoVisibilidade: !1 }, Wo = 1e3;
function Se() {
  for (const r of [...Y])
    try {
      r();
    } catch {
    }
}
function Ce() {
  return typeof document < "u" && document.visibilityState === "hidden";
}
function Ee() {
  F.timer !== void 0 || Y.size === 0 || Ce() || (F.timer = globalThis.setInterval(Se, Wo));
}
function Me() {
  F.timer !== void 0 && (globalThis.clearInterval(F.timer), F.timer = void 0);
}
function Zo() {
  if (Ce()) {
    Me();
    return;
  }
  Y.size > 0 && (Se(), Ee());
}
function Jo() {
  F.ouvindoVisibilidade || typeof document > "u" || (document.addEventListener("visibilitychange", Zo), F.ouvindoVisibilidade = !0);
}
function Ko(r) {
  Y.add(r), Jo(), Ee();
  let a = !1;
  return () => {
    a || (a = !0, Y.delete(r), Y.size === 0 && Me());
  };
}
const N = "ha-web-rtc-player", ai = 6e3, aa = 48, ea = 27, de = 500;
let Ca;
const ma = /* @__PURE__ */ new WeakMap();
function ei(r) {
  return r.split(".")[1] ?? r;
}
function C(r, a, e = 0, o = !0) {
  G(`marco: ${ei(r)} · player webrtc · ${a}`, e, o);
}
function oi() {
  return typeof customElements > "u" ? Promise.resolve(!1) : customElements.get(N) ? Promise.resolve(!0) : new Promise((r) => {
    let a = !1;
    const e = (i) => {
      a || (a = !0, globalThis.clearTimeout(o), r(i));
    }, o = globalThis.setTimeout(() => e(!!customElements.get(N)), ai);
    customElements.whenDefined(N).then(() => e(!0));
  });
}
async function ii(r, a) {
  if (typeof customElements > "u") return !1;
  if (customElements.get(N)) return !0;
  const e = globalThis.loadCardHelpers;
  if (typeof e != "function") return !1;
  try {
    const o = await e();
    if (customElements.get(N)) return !0;
    const i = o.createCardElement?.({
      type: "picture-entity",
      entity: r,
      camera_view: "live",
      show_name: !1,
      show_state: !1
    });
    return i && a && (i.hass = a), await oi();
  } catch {
    return !1;
  }
}
async function Oe(r, a) {
  if (typeof customElements < "u" && customElements.get(N)) return !0;
  const e = typeof performance < "u" ? performance.now() : Date.now();
  C(r, "ausente; carregando modulo", 0, !1), Ca ??= ii(r, a).finally(() => {
    Ca = void 0;
  });
  const o = await Ca, i = typeof performance < "u" ? performance.now() : Date.now();
  return C(r, o ? "definido sob demanda" : "definicao indisponivel", i - e, o), o;
}
function Te() {
  if (typeof customElements > "u" || !customElements.get(N)) return;
  const r = document.createElement(N);
  r.classList.add("camera-live-el"), r.setAttribute("muted", ""), r.setAttribute("playsinline", ""), r.setAttribute("autoplay", "");
  try {
    r.fitMode = "cover";
  } catch {
  }
  return ni(r), r;
}
function Ie(r, a, e) {
  return a >= 80 && a - r >= 48 && a - e >= 48;
}
function ti(r, a, e) {
  if (a !== aa || e !== ea || r.length !== a * e * 4) return !1;
  const o = 6, i = 3, t = a / o, n = e / i, c = Array.from({ length: i }, () => Array(o).fill(!1));
  for (let s = 0; s < i; s++)
    for (let l = 0; l < o; l++) {
      const m = /* @__PURE__ */ new Map();
      let d = 0, u = 0, g = 0;
      for (let f = s * n; f < (s + 1) * n; f++)
        for (let v = l * t; v < (l + 1) * t; v++) {
          const q = (f * a + v) * 4;
          if ((r[q + 3] ?? 0) < 128) continue;
          const b = r[q] ?? 0, $ = r[q + 1] ?? 0, M = r[q + 2] ?? 0;
          if (d++, !Ie(b, $, M)) continue;
          u++;
          const O = b >> 4 | $ >> 4 << 4 | M >> 4 << 8, P = (m.get(O) ?? 0) + 1;
          m.set(O, P), g = Math.max(g, P);
        }
      c[s][l] = d >= 48 && u / d >= 0.82 && g / d >= 0.55;
    }
  for (let s = 0; s < i; s++)
    for (let l = 0; l < o; l++)
      if (c[s][l] && (c[s][l + 1] || c[s + 1]?.[l]))
        return !0;
  return !1;
}
function ri(r, a = aa, e = ea) {
  const o = /* @__PURE__ */ new Map();
  let i = 0;
  for (let d = 0; d + 3 < r.length; d += 4) {
    if ((r[d + 3] ?? 0) < 128) continue;
    const u = r[d] ?? 0, g = r[d + 1] ?? 0, f = r[d + 2] ?? 0, v = u >> 4 | g >> 4 << 4 | f >> 4 << 8;
    o.set(v, (o.get(v) ?? 0) + 1), i++;
  }
  if (i < 32) return !1;
  let t = 0, n = 0;
  for (const [d, u] of o)
    u <= t || (t = u, n = d);
  const c = (n & 15) * 16 + 8, s = (n >> 4 & 15) * 16 + 8, l = (n >> 8 & 15) * 16 + 8;
  return t / i >= 0.45 && Ie(c, s, l) || ti(r, a, e);
}
function ni(r) {
  if (ma.has(r)) return;
  let a = !1, e = 0;
  const o = () => {
    if (r.isConnected) {
      a = !0;
      const n = r.shadowRoot?.querySelector("video");
      if (n && n.readyState >= 2) {
        const c = ya(n), s = r.hasAttribute("data-bruno-quadro-verde");
        c && r.classList.contains("is-ready") ? (r.classList.remove("is-ready"), r.setAttribute("data-bruno-quadro-verde", ""), C(r.entityid ?? "camera.desconhecida", "quadro verde eventual rejeitado", 0, !1)) : !c && s && (r.removeAttribute("data-bruno-quadro-verde"), r.classList.add("is-ready"), C(r.entityid ?? "camera.desconhecida", "stream recuperado apos quadro verde"));
      }
    } else if (a || e++ >= 20) {
      ma.delete(r);
      return;
    }
    const t = globalThis.setTimeout(o, de);
    ma.set(r, t);
  }, i = globalThis.setTimeout(o, de);
  ma.set(r, i);
}
function ya(r) {
  if (typeof document > "u") return !1;
  try {
    const a = document.createElement("canvas");
    a.width = aa, a.height = ea;
    const e = a.getContext("2d", { willReadFrequently: !0 });
    return e ? (e.drawImage(r, 0, 0, aa, ea), ri(
      e.getImageData(0, 0, aa, ea).data
    )) : !1;
  } catch {
    return !1;
  }
}
const si = {
  garantirPlayer: Oe,
  criarPlayer: Te,
  marcar: C,
  pareceQuadroVerde: ya
}, De = {
  principal: 6500,
  secundaria: 15e3
}, ci = {
  principal: 1500,
  secundaria: 3e3
}, li = 25e3, di = 300, pi = 6e4, mi = 12e3, pe = { comImagem: 2, semImagem: 4 };
function ui(r, a) {
  return r ? `${r}${r.includes("?") ? "&" : "?"}bruno_t=${a}` : "";
}
const hi = (r, a) => {
  const e = new Image();
  let o = !0;
  const i = (t) => {
    o && (o = !1, a(t));
  };
  return e.onload = () => i(ya(e) ? "quadro-verde" : !0), e.onerror = () => i(!1), e.src = r, () => {
    o = !1, e.onload = null, e.onerror = null, e.src = "";
  };
}, gi = {
  agendar: (r, a) => globalThis.setTimeout(r, a),
  cancelar: (r) => globalThis.clearTimeout(r),
  agora: () => typeof performance < "u" ? performance.now() : Date.now()
};
class Re {
  constructor(a = {}) {
    this.cameras = /* @__PURE__ */ new Map(), this.ligado = !1, this.carregador = a.carregador ?? hi, this.agenda = a.agenda ?? gi, this.aoCarregar = a.aoCarregar ?? (() => {
    }), this.aoMedir = a.aoMedir ?? (() => {
    }), this.atrasoInicial = a.atrasoInicial ?? 0;
  }
  /**
   * Declara quais câmeras existem agora e com que prioridade.
   *
   * Chamável a cada render: câmera que continua **mantém o estado** — inclusive
   * o recuo e a contagem do primeiro quadro. Trocar o PIP pelo principal muda a
   * cadência sem reiniciar o ciclo, que é o requisito "troca palco↔PIP sem
   * remontar" do roteiro.
   */
  definirAlvos(a) {
    const e = /* @__PURE__ */ new Set();
    for (const o of a) {
      if (!o.entityId || !o.base) continue;
      e.add(o.entityId);
      const i = this.cameras.get(o.entityId);
      if (i) {
        i.alvo = o;
        continue;
      }
      this.cameras.set(o.entityId, {
        alvo: o,
        emVoo: !1,
        inicio: 0,
        quadros: 0,
        falhas: 0,
        falhasSeguidas: 0,
        ultimaDuracao: 0,
        pior: 0
      }), this.ligado && this.agendarPrimeiro(o.entityId, e.size - 1);
    }
    for (const [o, i] of [...this.cameras])
      e.has(o) || (this.desmontar(i), this.cameras.delete(o));
  }
  /** Liga o ciclo. Idempotente. As câmeras partem escalonadas. */
  iniciar() {
    if (this.ligado) return;
    this.ligado = !0;
    let a = 0;
    for (const e of this.cameras.keys()) this.agendarPrimeiro(e, a++);
  }
  /**
   * Para tudo: cancela os agendamentos E aborta o que está em voo.
   *
   * Abortar importa tanto quanto cancelar. Sem isso, sair de um cômodo deixaria
   * as requisições daquele cômodo terminando de baixar em segundo plano,
   * competindo com as do cômodo novo — que é exatamente a sensação de "demora ao
   * navegar".
   */
  parar() {
    this.ligado = !1;
    for (const a of this.cameras.values()) this.desmontar(a);
  }
  /**
   * Busca um quadro de todas agora, sem esperar a cadência.
   *
   * Usado quando a tela volta a acender: a imagem na tela é de quando ela
   * apagou. Câmera com pedido em voo é pulada — a regra 1 vale sempre.
   */
  atualizarAgora() {
    if (this.ligado)
      for (const a of this.cameras.values())
        a.emVoo || (a.timer !== void 0 && (this.agenda.cancelar(a.timer), a.timer = void 0), this.buscar(a));
  }
  /** Retrato das métricas, por câmera. */
  metricas() {
    return [...this.cameras.values()].map((a) => ({
      entityId: a.alvo.entityId,
      prioridade: a.alvo.prioridade,
      quadros: a.quadros,
      falhas: a.falhas,
      falhasSeguidas: a.falhasSeguidas,
      ...a.primeiroQuadro !== void 0 ? { primeiroQuadro: a.primeiroQuadro } : {},
      ultimaDuracao: a.ultimaDuracao,
      pior: a.pior,
      emVoo: a.emVoo,
      ...a.ultimoDesfecho ? { ultimoDesfecho: a.ultimoDesfecho } : {}
    }));
  }
  /**
   * Busca UMA câmera agora, sem esperar o atraso inicial nem a cadência.
   *
   * Existe para o caso em que o elemento de imagem falha ao baixar o primeiro
   * quadro sozinho: sem isto, a tela ficaria vazia até o motor entrar, uma
   * cadência inteira depois. Ignora câmera com pedido em voo — a regra 1 vale
   * sempre.
   */
  buscarAgora(a) {
    if (!this.ligado) return;
    const e = this.cameras.get(a);
    !e || e.emVoo || (e.timer !== void 0 && (this.agenda.cancelar(e.timer), e.timer = void 0), this.buscar(e));
  }
  /** Quantas requisições estão em voo agora. Zero é o esperado em repouso. */
  emVoo() {
    let a = 0;
    for (const e of this.cameras.values()) e.emVoo && a++;
    return a;
  }
  // ── interno ───────────────────────────────────────────────────────────────
  agendarPrimeiro(a, e) {
    const o = this.cameras.get(a);
    !o || o.timer !== void 0 || o.emVoo || (o.timer = this.agenda.agendar(
      () => this.buscar(o),
      this.atrasoInicial + e * di
    ));
  }
  desmontar(a) {
    a.timer !== void 0 && (this.agenda.cancelar(a.timer), a.timer = void 0), a.prazo !== void 0 && (this.agenda.cancelar(a.prazo), a.prazo = void 0), a.abortar?.(), a.abortar = void 0, a.emVoo = !1;
  }
  buscar(a) {
    if (a.timer = void 0, !this.ligado || a.emVoo) return;
    a.emVoo = !0, a.inicio = this.agenda.agora();
    const e = ui(a.alvo.base, Math.round(a.inicio) || 1);
    a.prazo = this.agenda.agendar(() => this.encerrar(a, "prazo", e), li), a.abortar = this.carregador(
      e,
      (o) => this.encerrar(
        a,
        o === "quadro-verde" ? "quadro-verde" : o ? "ok" : "erro",
        e
      )
    );
  }
  encerrar(a, e, o) {
    if (!a.emVoo) return;
    a.emVoo = !1, a.prazo !== void 0 && (this.agenda.cancelar(a.prazo), a.prazo = void 0), a.abortar?.(), a.abortar = void 0;
    const i = this.agenda.agora() - a.inicio;
    a.ultimaDuracao = i, i > a.pior && (a.pior = i), a.ultimoDesfecho = e;
    const t = e === "ok" && a.quadros === 0;
    e === "ok" ? (a.quadros++, a.falhasSeguidas = 0, t && (a.primeiroQuadro = i), this.aoCarregar({ entityId: a.alvo.entityId, url: o, duracao: i, primeiro: t })) : (a.falhas++, a.falhasSeguidas++), this.aoMedir(a.alvo.entityId, i, e, t), this.ligado && this.agendarProximo(a, i);
  }
  agendarProximo(a, e) {
    const o = a.alvo.prioridade;
    let i = Math.max(ci[o], De[o] - e);
    const t = a.quadros === 0, n = t ? pe.semImagem : pe.comImagem, c = t ? mi : pi;
    if (a.falhasSeguidas >= n) {
      const s = 2 ** Math.min(a.falhasSeguidas - n + 1, 5);
      i = Math.min(c, i * s);
    }
    a.timer = this.agenda.agendar(() => this.buscar(a), i);
  }
}
const bi = [
  "camera.sl_camera_profile_1",
  "camera.vr_camera_profile_1",
  "camera.cz_camera_profile_1",
  "camera.as_camera_profile_1",
  "camera.of_camera_profile_1",
  "camera.qc_camera_profile_1",
  "camera.qmi_camera_profile_1",
  "camera.qma_camera_profile_1"
];
function Ea(r) {
  return !!r && bi.includes(r);
}
const fi = _`
:host {
  --room-gap: 10px;
  --room-radius: var(--bruno-liquid-card-radius, 18px);
  --room-radius-small: var(--bruno-liquid-card-radius-compact, 16px);
  --room-cell-radius: var(--bruno-liquid-cell-radius, 16px);
  --accent: var(--bruno-liquid-accent, 150, 190, 255);
  --accent-blue: 96, 165, 250;
  --accent-cyan: 79, 172, 254;
  --accent-amber: 255, 183, 77;
  --media-screen-height: 150px;
  --ac-h: 320px;
  --text-main: rgba(245,250,255,0.96);
  --text-soft: rgba(255,255,255,0.62);
  --text-dim: rgba(255,255,255,0.42);
  display: block;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-main);
  font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
  overflow: hidden;
}
* {
  box-sizing: border-box;
  letter-spacing: 0;
}
button {
  font: inherit;
  color: inherit;
  border: 0;
  outline: 0;
  cursor: pointer;
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}
.hero-panel {
}
.side-panel {
  grid-area: side;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: clamp(56.16px, 3.96cqi, 93.6px) minmax(0, 1fr);
  gap: var(--room-gap);
}
.tv-card {
  grid-area: tv;
}
.ps5-card {
  grid-area: ps5;
}
.room-rail-mount {
  grid-area: frame-left;
  min-width: 0;
  min-height: 0;
  position: relative;
  z-index: 3;
}
.room-rail-mount > * {
  height: 100%;
}
.subview-topbar {
  grid-area: frame-top;
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
}
.subview-room {
  grid-column: 2;
  text-align: center;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 600;
  letter-spacing: 0.04em;
  color: rgba(226,232,240,0.82);
  white-space: nowrap;
}
.subview-clock {
  grid-column: 3;
  justify-self: end;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.86);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  line-height: 1;
}
.subview-clock small {
  color: rgba(226,232,240,0.55);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
}
.room-sidebar::before {
  display: none;
}
.room-nav-button::after {
  display: none;
}
.room-nav-button:hover, .room-nav-button:focus, .room-nav-button:focus-visible {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.05);
  outline: none;
}
.room-nav-button.is-active {
  color: #fff;
  background: rgba(255,255,255,0.085);
  border: none;
  box-shadow: none;
}
.room-nav-button.is-active svg {
  stroke: rgb(var(--accent));
}
.room-nav-home {
  margin-bottom: clamp(6.24px, 0.44cqi, 10.4px);
}
.room-nav-label {
  display: block;
  font-size: clamp(7.41px, 0.52cqi, 12.35px);
  line-height: 1.05;
  font-weight: 600;
  color: inherit;
  text-align: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.room-nav-button svg {
  width: clamp(14.82px, 1.04cqi, 24.7px);
  height: clamp(14.82px, 1.04cqi, 24.7px);
  display: block;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.55;
  stroke-linecap: round;
  stroke-linejoin: round;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
  pointer-events: none;
}
.glass-card {
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 0;
  border-radius: var(--room-radius);
  overflow: hidden;
  color: var(--text-main);
  background: var(--bruno-liquid-surface-off-background, radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%), radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%), linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)), linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32)) );
  backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
  border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
  box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.18), inset 1px 0 0 rgba(255,255,255,0.10), inset -1px -1px 0 rgba(255,255,255,0.026), 0 18px 44px rgba(0,0,0,0.27), 0 0 24px rgba(110,150,210,0.055) );
  transition: background var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1)), border-color var(--bruno-liquid-motion-fast, 160ms ease), box-shadow var(--bruno-liquid-motion-medium, 220ms cubic-bezier(0.2, 0.8, 0.2, 1));
}
.glass-card::before {
  content: "";
  position: absolute;
  inset: 1px;
  z-index: 0;
  pointer-events: none;
  border-radius: calc(var(--room-radius) - 1px);
  background: var(--bruno-liquid-surface-off-sheen, radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%), radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%), linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%), linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%) );
  opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
}
.glass-card::after {
  content: "";
  position: absolute;
  inset: var(--bruno-subview-card-edge-inset, auto 16px 8px 16px);
  z-index: var(--bruno-subview-card-edge-z, 0);
  height: var(--bruno-subview-card-edge-height, 1px);
  padding: var(--bruno-subview-card-edge-padding, 0);
  box-sizing: border-box;
  pointer-events: none;
  border-radius: var(--bruno-subview-card-edge-radius, 999px);
  background: var(--bruno-subview-card-edge-background, var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)));
  -webkit-mask: var(--bruno-subview-card-edge-mask, none);
  -webkit-mask-composite: var(--bruno-subview-card-edge-webkit-composite, source-over);
  mask: var(--bruno-subview-card-edge-mask, none);
  mask-composite: var(--bruno-subview-card-edge-composite, add);
  opacity: var(--bruno-subview-card-edge-opacity, var(--bruno-liquid-surface-bottom-line-opacity, 0));
}
.glass-card > * {
  position: relative;
  z-index: 1;
}
.glass-card.is-active {
  --text-main: rgba(248,251,255,0.96);
  --text-soft: rgba(255,255,255,0.52);
  background: var(--bruno-liquid-surface-on-background, radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.38), rgba(255,255,255,0.105) 52%, transparent 75%), radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.24), transparent 68%), radial-gradient(122px 96px at 27% 18%, rgba(255,232,126,0.105), transparent 71%), linear-gradient(180deg, rgba(255,255,255,0.225), rgba(255,255,255,0.073) 43%, rgba(255,255,255,0.108)), linear-gradient(155deg, rgba(42,51,65,0.72), rgba(23,28,38,0.58) 52%, rgba(13,16,24,0.44)) );
  backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
  border-color: var(--bruno-liquid-surface-on-border-color, rgba(255,255,255,0.24));
  box-shadow: var(--bruno-liquid-surface-on-shadow, inset 0 1px 0 rgba(255,255,255,0.32), inset 1px 0 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(0,0,0,0.18), 0 0 22px rgba(255,255,255,0.09), 0 0 34px rgba(120,170,235,0.10), 0 18px 42px rgba(0,0,0,0.28) );
}
.glass-card.is-active::before {
  background: var(--bruno-liquid-surface-on-sheen, radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%), radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%), radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%), linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%) );
  opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
}
.hero-bg {
  position: absolute;
  pointer-events: none;
  z-index: 0;
  top: clamp(-23.4px, -0.99cqi, -14.04px);
  bottom: clamp(-26px, -1.1cqi, -15.6px);
  left: clamp(-20.8px, -0.88cqi, -12.48px);
  right: clamp(-111.8px, -4.73cqi, -67.08px);
  background: linear-gradient(90deg, rgba(4,10,18,0.82) 0%, rgba(5,10,18,0.66) 12%, rgba(6,12,20,0.42) 24%, rgba(7,13,22,0.22) 38%, rgba(7,13,22,0.10) 50%, rgba(7,13,22,0.14) 60%, rgba(7,13,22,0.30) 70%, rgba(7,13,22,0.54) 82%, rgba(7,13,22,0.80) 92%, rgba(7,13,22,0.94) 100% ), linear-gradient(180deg, rgba(4,8,14,0.78) 0%, rgba(4,8,14,0.46) 10%, rgba(4,8,14,0.18) 22%, rgba(4,8,14,0.04) 34%, rgba(4,8,14,0.00) 46%, rgba(4,8,14,0.00) 58%, rgba(4,8,14,0.10) 72%, rgba(4,8,14,0.28) 84%, rgba(4,8,14,0.56) 94%, rgba(4,8,14,0.78) 100% ), radial-gradient(680px 220px at 12% 4%, rgba(255,255,255,0.07), transparent 56%), radial-gradient(900px 320px at 74% 52%, rgba(255,255,255,0.03), transparent 66%), var(--hero-image) left center / auto 100% no-repeat, var(--hero-fallback-image) left center / auto 100% no-repeat;
  opacity: 1;
  filter: saturate(1.01) brightness(0.90);
  mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
  -webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0,0,0,0.84) 4%, rgba(0,0,0,1) 10%, rgba(0,0,0,1) 78%, rgba(0,0,0,0.84) 88%, rgba(0,0,0,0.46) 94%, transparent 100%), linear-gradient(to bottom, transparent 0%, rgba(0,0,0,0.84) 6%, rgba(0,0,0,1) 14%, rgba(0,0,0,1) 80%, rgba(0,0,0,0.82) 89%, rgba(0,0,0,0.42) 95%, transparent 100%);
  mask-composite: intersect;
  -webkit-mask-composite: source-in;
}
.hero-bg::before, .hero-bg::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
}
.hero-bg::before {
  background: linear-gradient(90deg, rgba(4,10,18,0.72) 0%, rgba(4,10,18,0.56) 12%, rgba(5,10,18,0.34) 24%, rgba(5,10,18,0.14) 38%, rgba(5,10,18,0.02) 50%, rgba(5,10,18,0.08) 60%, rgba(5,10,18,0.22) 72%, rgba(5,10,18,0.46) 84%, rgba(5,10,18,0.74) 100% ), linear-gradient(180deg, rgba(3,8,14,0.62) 0%, rgba(3,8,14,0.34) 12%, rgba(3,8,14,0.08) 26%, rgba(3,8,14,0.00) 40%, rgba(3,8,14,0.00) 62%, rgba(3,8,14,0.10) 76%, rgba(3,8,14,0.30) 90%, rgba(3,8,14,0.60) 100% );
}
.hero-bg::after {
  background: radial-gradient(720px 220px at 8% 2%, rgba(255,255,255,0.08), transparent 58%), linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%), linear-gradient(0deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00) 34%);
  opacity: 0.58;
}
.hero-top {
  display: flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.back-button, .control-button {
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.back-button bruno-icon, .control-button bruno-icon {
  --mdc-icon-size: 18px;
}
.hero-title, .module-title {
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
}
.hero-subtitle, .module-subtitle {
  margin-top: clamp(3.12px, 0.22cqi, 5.2px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 600;
  color: var(--text-soft);
}
.chip-button, .online-chip, .state-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  min-height: clamp(23.4px, 1.65cqi, 39px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  color: rgba(255,255,255,0.86);
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  white-space: nowrap;
}
.chip-button.is-active, .online-chip {
  background: rgba(24,134,190,0.36);
  border-color: rgba(96,190,255,0.46);
}
.curtain-control-row {
  display: grid;
  grid-template-columns: minmax(clamp(73.32px, 5.16cqi, 122.2px), auto) minmax(clamp(74.88px, 5.27cqi, 124.8px), 1fr) auto;
  align-items: center;
  gap: clamp(14.04px, 0.99cqi, 23.4px);
  min-width: 0;
}
.curtain-identity, .title-with-chip {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  min-width: 0;
}
.curtain-icon-shell {
  width: clamp(21.84px, 1.54cqi, 36.4px);
  height: clamp(21.84px, 1.54cqi, 36.4px);
  display: grid;
  place-items: center;
  flex: 0 0 auto;
  border-radius: 50%;
  background: radial-gradient(circle at 50% 0%, rgba(255,255,255,0.17), rgba(255,255,255,0.04) 56%, rgba(0,0,0,0.18)), rgba(18,20,21,0.52);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(12px) saturate(1.18);
  -webkit-backdrop-filter: blur(12px) saturate(1.18);
}
.curtain-title {
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  letter-spacing: 0;
  color: rgba(255,255,255,0.96);
  white-space: nowrap;
}
.curtain-status {
  justify-self: center;
  display: flex;
  align-items: center;
  gap: clamp(3.9px, 0.27cqi, 6.5px);
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  white-space: nowrap;
}
.curtain-status-text {
  color: var(--curtain-gold);
}
.curtain-status-percent {
  color: rgba(255,255,255,0.78);
  font-weight: 800;
}
.curtain-main-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  min-width: 0;
}
.curtain-action-button.is-muted {
  color: rgba(255,255,255,0.88);
}
.curtain-action-button.is-active {
  color: var(--curtain-gold);
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
  background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
  box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
}
.curtain-action-button:active {
  transform: translateY(1px);
  color: var(--curtain-gold);
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--curtain-gold-rgb),0.180));
  background: var(--bruno-liquid-control-warm-background, rgba(var(--curtain-gold-rgb),0.038));
}
.curtain-action-button:disabled, .curtain-mark:disabled, .curtain-range:disabled {
  opacity: 0.46;
  cursor: not-allowed;
}
.curtain-svg {
  display: block;
  fill: rgba(255,255,255,0.70);
  stroke: rgba(255,255,255,0.58);
  stroke-width: 1.78;
  stroke-linecap: round;
  stroke-linejoin: round;
  flex: 0 0 auto;
}
.curtain-svg.is-main {
  fill: rgba(255,255,255,0.78);
  stroke: rgba(255,255,255,0.54);
}
.curtain-svg.is-stop {
  fill: rgba(255,255,255,0.64);
  stroke: rgba(255,255,255,0.54);
}
.curtain-slider-zone {
  position: relative;
  display: grid;
  gap: 0;
  min-width: 0;
}
.curtain-slider-glow {
  position: absolute;
  left: 0;
  top: -3px;
  width: var(--curtain-position);
  height: clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.11), rgba(var(--curtain-gold-rgb),0.020));
  filter: blur(8px);
  pointer-events: none;
}
.curtain-range {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 3px;
  margin: 0;
  appearance: none;
  -webkit-appearance: none;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.055);
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62) 0 var(--curtain-position), rgba(var(--curtain-gold-rgb),0.24) var(--curtain-position), rgba(255,255,255,0.11) var(--curtain-position) 100%);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.24);
  cursor: pointer;
  accent-color: var(--curtain-gold);
}
.curtain-range::-webkit-slider-runnable-track {
  height: 3px;
  border-radius: 999px;
  background: transparent;
}
.curtain-range::-webkit-slider-thumb {
  width: clamp(9.36px, 0.66cqi, 15.6px);
  height: clamp(9.36px, 0.66cqi, 15.6px);
  margin-top: clamp(-5.85px, -0.25cqi, -3.51px);
  -webkit-appearance: none;
  appearance: none;
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.30);
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
  box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
}
.curtain-range::-moz-range-track {
  height: 3px;
  border-radius: 999px;
  background: transparent;
}
.curtain-range::-moz-range-progress {
  height: 3px;
  border-radius: 999px;
  background: linear-gradient(90deg, rgba(var(--curtain-gold-rgb),0.62), rgba(var(--curtain-gold-rgb),0.24));
}
.curtain-range::-moz-range-thumb {
  width: clamp(9.36px, 0.66cqi, 15.6px);
  height: clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.30);
  background: radial-gradient(circle at 40% 30%, rgba(255,255,255,0.86), rgba(var(--curtain-gold-rgb),0.74) 58%, rgba(20,20,20,0.78));
  box-shadow: 0 0 7px rgba(var(--curtain-gold-rgb),0.22), 0 2px 6px rgba(0,0,0,0.34);
}
.curtain-marks {
  position: relative;
  z-index: 2;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  margin-top: clamp(5.46px, 0.38cqi, 9.1px);
}
.curtain-mark {
  position: relative;
  min-width: 0;
  height: clamp(17.16px, 1.21cqi, 28.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) 0 0;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.42);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 700;
  letter-spacing: 0;
  cursor: pointer;
}
.curtain-mark::before {
  content: "";
  position: absolute;
  top: 1px;
  left: 50%;
  width: 1px;
  height: clamp(3.12px, 0.22cqi, 5.2px);
  transform: translateX(-50%);
  border-radius: 999px;
  background: rgba(255,255,255,0.28);
}
.curtain-mark.is-active {
  color: var(--curtain-gold);
}
.curtain-mark.is-active::before {
  background: rgba(var(--curtain-gold-rgb),0.72);
}
.module-icon, .micro-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex: 0 0 auto;
  width: clamp(21.84px, 1.54cqi, 36.4px);
  height: clamp(21.84px, 1.54cqi, 36.4px);
  border-radius: 50%;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.13);
  color: rgba(210,225,240,0.82);
}
.module-icon bruno-icon, .micro-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
}
.soft-button, .primary-button {
  min-height: clamp(28.08px, 1.98cqi, 46.8px);
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: var(--bruno-liquid-control-radius, 14px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  color: rgba(255,255,255,0.88);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
}
.soft-button.is-primary, .primary-button {
  background: var(--bruno-liquid-control-blue-background, rgba(24,134,190,0.42));
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,190,255,0.50));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.18));
}
.status-item:last-child {
  border-right: 0;
}
.status-item strong {
  display: block;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-item span:not(.micro-icon) {
  display: block;
  margin-top: clamp(3.12px, 0.22cqi, 5.2px);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  color: var(--text-soft);
}
.micro-icon.tone-amber {
  color: rgb(255,183,77);
  background: rgba(255,183,77,0.10);
  border-color: rgba(255,183,77,0.22);
}
.micro-icon.tone-blue {
  color: rgb(180,215,255);
  background: rgba(96,165,250,0.10);
  border-color: rgba(96,165,250,0.20);
}
.micro-icon.tone-cyan {
  color: rgb(111,224,241);
  background: rgba(111,224,241,0.10);
  border-color: rgba(111,224,241,0.20);
}
.micro-icon.tone-green {
  color: rgb(134,224,152);
  background: rgba(134,224,152,0.10);
  border-color: rgba(134,224,152,0.20);
}
.lights-card, .cameras-card, .tv-card, .ps5-card, .spotify-card, .ac-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
}
.module-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  margin-bottom: clamp(6.24px, 0.44cqi, 10.4px);
}
.head-actions {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.all-label {
  color: rgb(255,154,18);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 900;
}
.chip-button {
  min-width: clamp(40.56px, 2.86cqi, 67.6px);
}
.lights-groups {
  position: relative;
  z-index: 1;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  align-items: stretch;
  min-height: 0;
  height: 100%;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.light-group {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.light-group-label {
  color: rgba(255,255,255,0.54);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 900;
  text-transform: uppercase;
}
.lights-divider {
  align-self: stretch;
  width: 1px;
  border-radius: 999px;
  background: linear-gradient(180deg, transparent, rgba(255,255,255,0.16), rgba(255,183,77,0.26), rgba(255,255,255,0.12), transparent);
  box-shadow: 0 0 14px rgba(255,183,77,0.10);
}
.light-group-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.light-tile.is-on {
  color: rgba(255,255,255,0.98);
  background: var(--bruno-liquid-cell-active-warm-background, radial-gradient(76px 48px at 18% 12%, rgba(255,255,255,0.28), transparent 72%), radial-gradient(96px 58px at 94% 82%, rgba(255,183,77,0.24), transparent 72%), linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.074)), linear-gradient(180deg, rgba(255,183,77,0.10), rgba(255,183,77,0.03)) );
  border-color: var(--bruno-liquid-cell-active-warm-border, rgba(255,205,95,0.44));
  box-shadow: var(--bruno-liquid-cell-active-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.22), inset 1px 0 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.08), 0 0 20px rgba(255,183,77,0.17) );
}
.lights-zone-rail::before {
  content: "";
  position: absolute;
  inset: 1px;
  pointer-events: none;
  border-radius: calc(var(--room-cell-radius) - 1px);
  background: radial-gradient(52px 78px at 50% 20%, rgba(255,191,74,0.10), transparent 66%), linear-gradient(135deg, rgba(255,255,255,0.11), transparent 34%, transparent 70%, rgba(255,188,65,0.05));
  opacity: 0.88;
}
.rail-zone, .rail-state, .rail-track {
  position: relative;
  z-index: 1;
}
.rail-zone {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 900;
  color: rgba(255,231,176,0.68);
  text-shadow: 0 1px 2px rgba(0,0,0,0.34);
}
.rail-state {
  min-width: clamp(28.08px, 1.98cqi, 46.8px);
  min-height: clamp(16.38px, 1.15cqi, 27.3px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: rgba(255,205,95,0.95);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 900;
  background: rgba(255,183,77,0.10);
  border: 1px solid rgba(255,183,77,0.20);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 calc(14px * var(--rail-glow, 0)) rgba(255,183,77,0.18);
}
.rail-state strong {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  color: rgba(255,235,177,0.98);
}
.rail-track {
  position: relative;
  width: clamp(32.76px, 2.31cqi, 54.6px);
  height: 100%;
  min-height: clamp(96.72px, 6.81cqi, 161.2px);
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,245,210,0.10), rgba(255,196,83,0.035)), radial-gradient(circle at 50% 8%, rgba(255,255,255,0.16), transparent 30%), rgba(8,15,28,0.72);
  border: 1px solid rgba(255,222,152,0.30);
  box-shadow: inset 0 0 16px rgba(255,228,170,0.10), inset 6px 0 14px rgba(255,255,255,0.035), inset -8px 0 16px rgba(0,0,0,0.28), 0 0 calc(18px * var(--rail-glow, 0)) rgba(255,187,67,0.18), 0 0 calc(42px * var(--rail-glow, 0)) rgba(255,158,35,0.12);
}
.rail-track::before {
  content: "";
  position: absolute;
  inset: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,0.08);
  pointer-events: none;
  z-index: 4;
}
.rail-track::after {
  content: "";
  position: absolute;
  top: clamp(8.58px, 0.6cqi, 14.3px);
  left: clamp(7.8px, 0.55cqi, 13px);
  width: clamp(10.14px, 0.71cqi, 16.9px);
  height: 72%;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,255,255,0.20), rgba(255,255,255,0.034), transparent);
  opacity: 0.42;
  pointer-events: none;
  z-index: 5;
  filter: blur(0.2px);
}
.rail-fill {
  position: absolute;
  left: clamp(3.9px, 0.27cqi, 6.5px);
  right: clamp(3.9px, 0.27cqi, 6.5px);
  bottom: clamp(3.9px, 0.27cqi, 6.5px);
  height: calc((100% - 10px) * var(--rail-fill-ratio, 0));
  min-height: calc(24px * var(--rail-glow, 0));
  border-radius: 999px;
  background: radial-gradient(circle at 40% 12%, rgba(255,255,255,0.95), transparent 20%), linear-gradient(180deg, #fff6c9 0%, #ffe18a 24%, #ffc247 58%, #ff9f1f 100%);
  box-shadow: 0 0 calc(16px * var(--rail-glow, 0)) rgba(255,226,138,0.70), 0 0 calc(34px * var(--rail-glow, 0)) rgba(255,184,61,0.44), 0 0 calc(64px * var(--rail-glow, 0)) rgba(255,145,31,0.25);
  opacity: var(--rail-glow, 0);
  transition: height 550ms cubic-bezier(.22,.9,.32,1), min-height 350ms ease, opacity 350ms ease, box-shadow 450ms ease;
}
.rail-fill::before {
  content: "";
  position: absolute;
  top: 0;
  left: clamp(4.68px, 0.33cqi, 7.8px);
  right: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.82);
  filter: blur(3px);
  opacity: 0.90;
}
.rail-fill::after {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(90deg, rgba(255,255,255,0.25), transparent 38%, rgba(255,255,255,0.18));
  opacity: 0.70;
  mix-blend-mode: screen;
}
.rail-ambient-glow {
  position: absolute;
  left: 50%;
  bottom: clamp(15.6px, 1.1cqi, 26px);
  width: clamp(67.08px, 4.73cqi, 111.8px);
  height: var(--rail-ambient-height, 22px);
  transform: translateX(-50%);
  border-radius: 999px;
  background: radial-gradient(ellipse at center, rgba(255,183,55,0.30), rgba(255,139,22,0.12), transparent 72%);
  filter: blur(16px);
  opacity: var(--rail-glow, 0);
  pointer-events: none;
  transition: height 550ms cubic-bezier(.22,.9,.32,1), opacity 350ms ease;
}
.rail-dimmer-ghost {
  position: absolute;
  inset: clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: inherit;
  border: 1px dashed rgba(255,255,255,0.12);
  opacity: 0;
  pointer-events: none;
}
.light-tile.is-placeholder {
  opacity: 0.55;
}
.light-tile:hover, .camera-thumb-overlay:hover, .soft-button:hover, .control-button:hover {
  transform: translateY(-1px);
}
.light-tile.is-on .light-icon {
  --light-color: var(--state-icon-active-color, #f0c040);
  color: rgb(255,210,86);
  filter: drop-shadow(0 0 10px rgba(255,183,77,0.34));
}
.tpl-light-icon {
  position: relative;
  width: 100%;
  height: 100%;
  display: block;
  color: var(--light-color);
}
.tpl-light-icon svg {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
.tpl-light-icon .light-color {
  fill: var(--light-color);
}
.tpl-light-icon .flush-beam {
  transform-origin: -100% 46%;
  animation: bruno-light-flush-on 2s ease forwards;
}
.tpl-light-icon .pendant-swing {
  transform-box: fill-box;
  transform-origin: top center;
  animation: bruno-light-pendant-on 1.7s ease-in-out;
}
.tpl-light-glow {
  position: absolute;
  inset: 3px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(255,214,99,0.45), transparent 68%);
  filter: blur(7px);
  opacity: 0.95;
}
@keyframes bruno-light-flush-on {
from {
  transform: scaleY(0);
}
to {
  transform: scaleY(1);
}
}
@keyframes bruno-light-pendant-on {
0% {
  transform: rotateZ(0deg);
}
23% {
  transform: rotateZ(-10deg);
}
56% {
  transform: rotateZ(10deg);
}
70% {
  transform: rotateZ(-2deg);
}
85% {
  transform: rotateZ(2deg);
}
100% {
  transform: rotateZ(0deg);
}
}
.light-tile small {
  grid-area: status;
  min-width: 0;
  color: rgba(255,205,95,0.92);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cameras-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.online-chip span, .state-chip span, .live-dot {
  width: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: 50%;
  background: #2ee77a;
  box-shadow: 0 0 10px rgba(46,231,122,0.5);
}
.camera-stage {
  position: relative;
  z-index: 1;
  min-height: 0;
  height: 100%;
}
.camera-main {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: block;
  width: 100%;
  height: 100%;
  padding: 0;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.11);
  text-align: left;
}
.camera-row-image {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.018);
}
.camera-row-image img, .poster-card img, .spotify-art img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.camera-row-image img {
  z-index: 1;
  opacity: 0;
  filter: brightness(0.86) saturate(0.94);
}
.camera-row-image img.is-loaded {
  opacity: 1;
}
.camera-placeholder {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.18);
}
.camera-placeholder bruno-icon {
  display: none;
  --mdc-icon-size: 36px;
}
.camera-main::after, .camera-thumb-overlay::after {
  content: "";
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
  background: transparent;
}
.camera-main.has-loaded-image::after, .camera-thumb-overlay.has-loaded-image::after {
  background: linear-gradient(90deg, rgba(4,8,16,0.52), rgba(4,8,16,0.10) 68%, rgba(4,8,16,0.42));
}
.camera-row-copy, .camera-chevron {
  position: absolute;
  z-index: 2;
}
.camera-row-copy span, .camera-thumb-name {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
}
.camera-chevron {
  right: clamp(10.92px, 0.77cqi, 18.2px);
  top: clamp(10.92px, 0.77cqi, 18.2px);
  --mdc-icon-size: 19px;
  color: rgba(255,255,255,0.82);
}
.camera-thumb-overlay {
  position: absolute;
  z-index: 3;
  right: clamp(9.36px, 0.66cqi, 15.6px);
  bottom: clamp(9.36px, 0.66cqi, 15.6px);
  width: min(44%, clamp(123.24px, 8.68cqi, 205.4px));
  aspect-ratio: 16 / 10;
  overflow: hidden;
  border-radius: 14px;
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 26px rgba(0,0,0,0.36);
  text-align: left;
}
.camera-thumb-overlay .camera-row-image {
  border-radius: 14px;
}
.camera-thumb-overlay::after {
  background: linear-gradient(180deg, rgba(3,8,15,0.06), rgba(3,8,15,0.74));
}
.camera-thumb-overlay span {
  position: absolute;
  z-index: 4;
  left: clamp(7.8px, 0.55cqi, 13px);
  bottom: clamp(5.46px, 0.38cqi, 9.1px);
  max-width: calc(100% - clamp(15.6px, 1.1cqi, 26px));
  color: rgba(255,255,255,0.92);
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tv-card, .ps5-card, .spotify-card, .ac-card {
  min-height: 0;
}
.tv-body, .ac-body {
  position: relative;
  z-index: 1;
  height: calc(100% - clamp(35.88px, 2.53cqi, 59.8px));
  display: grid;
  grid-template-columns: 1fr;
  gap: clamp(10.92px, 0.77cqi, 18.2px);
  align-items: stretch;
}
.tv-main, .spotify-copy, .ac-main, .ps5-copy {
  min-width: 0;
}
.media-title {
  margin-top: clamp(6.24px, 0.44cqi, 10.4px);
  color: white;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  line-height: 1.1;
  font-weight: 800;
}
.media-subtitle {
  margin-top: clamp(3.9px, 0.27cqi, 6.5px);
  color: var(--text-soft);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 600;
}
.control-row {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  margin-top: 0;
}
.control-button.is-main {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%), linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58)) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.22), 0 0 22px rgba(96,165,250,0.24) );
}
.control-button.is-tool {
  color: rgba(210,245,230,0.96);
  background: var(--bruno-liquid-control-green-background, radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%), rgba(255,255,255,0.075) );
  border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
  box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.volume-row {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) clamp(29.64px, 2.09cqi, 49.4px);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  margin-top: 0;
  color: rgba(255,255,255,0.66);
}
.volume-row bruno-icon {
  --mdc-icon-size: 15px;
}
.volume-row strong {
  color: rgba(255,255,255,0.88);
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 800;
}
.volume-row input {
  width: 100%;
  min-width: 0;
  accent-color: rgb(28,214,104);
}
.poster-card {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.12);
  color: var(--text-dim);
  overflow: hidden;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
}
.tv-card .poster-card, .spotify-art {
  aspect-ratio: 1 / 1;
  height: var(--media-screen-height, 150px);
  min-height: var(--media-screen-height, 150px);
  max-height: var(--media-screen-height, 150px);
  width: auto;
  max-width: 100%;
  justify-self: center;
}
.tv-card .tv-body {
  grid-template-rows: var(--media-screen-height, 154px) auto;
}
.tv-card .poster-card {
  grid-row: 1;
  min-height: 0;
}
.tv-card .tv-main {
  grid-row: 2;
}
.tv-card .control-row {
}
.ps5-body {
  position: relative;
  z-index: 1;
  height: calc(100% - clamp(35.88px, 2.53cqi, 59.8px));
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(clamp(90.48px, 6.37cqi, 150.8px), 1fr) auto;
  gap: clamp(7.8px, 0.55cqi, 13px);
  align-items: stretch;
}
.ps5-minimal {
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-copy {
  grid-row: 2;
  display: grid;
  align-content: end;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  height: 100%;
}
.ps5-copy > strong {
  align-self: end;
  color: rgb(45,225,118);
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 800;
}
.ps5-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-image {
  grid-row: 1;
  justify-self: center;
  align-self: center;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
  transform: scale(1.08);
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
}
.ps5-footer {
  min-height: 0;
  display: grid;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.device-state {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  width: fit-content;
  color: rgba(255,255,255,0.82);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
}
.ps5-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(31.2px, 2.2cqi, 52px);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ps5-meta span, .ac-meta span {
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  min-width: 0;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 12px;
  color: var(--text-soft);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  background: rgba(255,255,255,0.052);
  border: 1px solid rgba(255,255,255,0.10);
}
.ps5-meta strong, .ac-meta strong {
  color: white;
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spotify-card {
  grid-area: spotify;
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  min-height: 0;
}
.spotify-body {
  position: relative;
  z-index: 1;
  display: grid;
}
.spotify-art {
  position: relative;
  inset: auto;
  aspect-ratio: 1 / 1;
  height: var(--media-screen-height, 168px);
  min-height: var(--media-screen-height, 168px);
  max-height: var(--media-screen-height, 168px);
  width: auto;
  max-width: 100%;
  justify-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--room-radius-small);
  background: radial-gradient(circle at 50% 45%, rgba(96,165,250,0.14), transparent 42%), rgba(5,10,20,0.72);
  overflow: hidden;
  color: rgba(255,255,255,0.22);
}
.spotify-art.has-art::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, transparent 64%, rgba(2,8,18,0.46));
}
.spotify-art bruno-icon {
  --mdc-icon-size: 70px;
}
.spotify-copy {
}
.spotify-card .media-title {
  margin-top: 0;
}
.spotify-controls {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.tv-card .control-button, .spotify-controls .control-button {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  border-radius: 13px;
}
.temperature-pill {
  align-self: start;
  min-width: clamp(45.24px, 3.19cqi, 75.4px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: clamp(5.46px, 0.38cqi, 9.1px) clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.92);
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  line-height: 1;
  font-weight: 800;
  background: rgba(255,255,255,0.070);
  border: 1px solid rgba(255,255,255,0.12);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
}
.temperature-slider input {
  width: 100%;
  min-width: 0;
  accent-color: rgb(96,165,250);
}
.climate-mode-row, .fan-mode-row {
  display: grid;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.climate-mode, .fan-mode, .climate-stepper {
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  border-radius: var(--bruno-liquid-control-radius, 14px);
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.09));
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.050));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.06));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.climate-mode:disabled, .fan-mode:disabled {
  opacity: 0.42;
  cursor: default;
}
.climate-mode {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  color: rgba(255,255,255,0.66);
}
.climate-mode bruno-icon {
  --mdc-icon-size: 17px;
}
.climate-mode.is-active {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,183,255,0.34), transparent 72%), rgba(38,92,154,0.42) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.34));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14), 0 0 14px rgba(96,165,250,0.16) );
}
.climate-mode.is-power-on {
  color: rgba(255,255,255,0.96);
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%), rgba(38,92,138,0.38) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.12), 0 0 14px rgba(96,165,250,0.16) );
}
.climate-stepper button {
  height: clamp(29.64px, 2.09cqi, 49.4px);
  background: transparent;
  color: rgba(255,255,255,0.82);
  font-size: clamp(13.26px, 0.93cqi, 22.1px);
}
.climate-stepper span {
  text-align: center;
  color: rgba(255,255,255,0.88);
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 800;
}
.fan-label {
  display: block;
  color: rgba(255,255,255,0.90);
  font-weight: 800;
  margin-top: 3px;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
}
.fan-mode.is-active {
  color: rgba(255,255,255,0.94);
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,183,255,0.24), transparent 72%), rgba(38,92,154,0.32) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,183,255,0.28));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.14));
}
.climate-mode:active, .fan-mode:active, .climate-stepper button:active {
  transform: translateY(1px);
  border-color: rgba(96,183,255,0.42);
}
.climate-trend {
  min-height: 0;
  height: clamp(81.12px, 5.71cqi, 135.2px);
  margin: clamp(-10.4px, -0.44cqi, -6.24px) clamp(-18.2px, -0.77cqi, -10.92px) clamp(-18.2px, -0.77cqi, -10.92px);
  border-radius: 0 0 calc(var(--room-radius) - 1px) calc(var(--room-radius) - 1px);
  overflow: hidden;
  background: transparent;
}
.climate-trend svg {
  display: block;
  width: 100%;
  height: 100%;
}
.trend-area {
  fill: rgba(96,165,250,0.16);
}
.trend-line {
  fill: none;
  stroke: rgba(96,165,250,0.76);
  stroke-width: 2.35;
  stroke-linecap: round;
  filter: drop-shadow(0 0 8px rgba(96,165,250,0.32));
}
.spotify-volume {
}
.tv-card, .spotify-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  overflow: hidden;
}
.tv-body, .spotify-body {
  height: auto;
  min-height: 0;
  grid-template-columns: 1fr;
  grid-template-rows: var(--media-screen-height, 154px) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  align-items: stretch;
}
.tv-main, .spotify-copy {
  display: grid;
  grid-template-rows: clamp(28.08px, 1.98cqi, 46.8px) clamp(18.72px, 1.32cqi, 31.2px);
  align-content: start;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding-top: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
  overflow: hidden;
}
.tv-card .control-row, .spotify-controls {
  margin-top: 2px;
}
.tv-card .volume-row, .spotify-volume {
  margin-top: 2px;
}
.media-source {
  margin-top: 2px;
  color: white;
  font-weight: 800;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
}
.spotify-card .media-title, .spotify-title {
  max-width: 100%;
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  white-space: nowrap;
  overflow: hidden;
}
.spotify-title span {
  display: inline-block;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: top;
}
.spotify-card .media-subtitle {
  margin-top: -2px;
  max-width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.state-chip {
  align-self: start;
  min-height: clamp(21.84px, 1.54cqi, 36.4px);
  max-width: clamp(59.28px, 4.18cqi, 98.8px);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 1180px) {
.side-panel {
  grid-template-rows: auto minmax(0, 1fr);
}
.status-item {
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
}
}
@media (max-width: 760px) {
:host {
  height: auto;
  overflow: visible;
}
.hero-stage {
  min-height: clamp(335.4px, 23.63cqi, 559px);
}
.hero-content {
  grid-template-columns: 1fr;
}
.hero-clock {
  font-size: clamp(54.6px, 3.85cqi, 91px);
}
.status-item:nth-child(even) {
  border-right: 0;
}
.curtain-dock {
  grid-template-columns: 1fr;
}
.side-panel {
  grid-template-rows: auto;
}
.lights-groups {
  height: auto;
  grid-template-columns: 1fr;
}
.lights-divider {
  display: none;
}
.light-group-grid {
  grid-template-rows: none;
  grid-auto-rows: minmax(clamp(73.32px, 5.16cqi, 122.2px), auto);
}
.cameras-card {
  min-height: clamp(304.2px, 21.43cqi, 507px);
}
.tv-card, .ps5-card, .spotify-card, .ac-card {
  min-height: clamp(202.8px, 14.29cqi, 338px);
}
.spotify-card {
  min-height: clamp(280.8px, 19.78cqi, 468px);
}
.tv-body, .ac-body {
  grid-template-columns: 1fr;
}
}
.content-left, .right-column {
  min-width: 0;
  min-height: 0;
  height: 100%;
}
.content-left {
  grid-area: content;
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(0, 1fr) var(--ac-h, 320px);
  gap: var(--room-gap);
}
.cams-media-row {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--room-gap);
}
.right-control-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(clamp(227.76px, 16.04cqi, 379.6px), 0.55fr);
  grid-template-rows: minmax(clamp(205.92px, 14.51cqi, 343.2px), 1fr) minmax(clamp(227.76px, 16.04cqi, 379.6px), 1fr);
  grid-template-areas: "lights ac" "media ac";
  gap: var(--room-gap);
}
.hero-panel, .cameras-card, .lights-card, .media-hub-card, .ac-card {
  min-width: 0;
  min-height: 0;
}
.hero-panel, .cameras-card, .lights-card, .media-hub-card, .ac-card, .curtain-card {
  grid-area: auto;
}
.subview-topband {
  grid-area: topband;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.topband-badges {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0;
  overflow: hidden;
}
.tb-badge {
  --tone: 154,160,166;
  height: clamp(35.88px, 2.53cqi, 59.8px);
  display: grid;
  grid-template-columns: clamp(17.16px, 1.21cqi, 28.6px) auto;
  align-items: center;
  column-gap: clamp(7.02px, 0.49cqi, 11.7px);
  padding: 0 clamp(12.48px, 0.88cqi, 20.8px);
  color: rgba(255,255,255,0.92);
}
.tb-badge + .tb-badge {
  border-left: 1px solid rgba(255,255,255,0.10);
}
.tb-badge-icon {
  width: clamp(17.16px, 1.21cqi, 28.6px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.44);
}
.tb-badge-icon bruno-icon {
  --mdc-icon-size: 18px;
}
.tb-badge-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  line-height: 1.02;
}
.tb-badge-title {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.60);
}
.tb-badge-sub {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.42);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: clamp(132.6px, 9.34cqi, 221px);
}
.tb-badge.is-active .tb-badge-icon {
  color: rgb(var(--tone));
  filter: drop-shadow(0 0 8px rgba(var(--tone),0.45));
}
.tb-badge.is-active .tb-badge-title {
  color: rgba(255,255,255,0.94);
}
.tb-badge.is-active .tb-badge-sub {
  color: rgb(var(--tone));
}
.topband-clock {
  text-align: right;
  line-height: 1.05;
  white-space: nowrap;
}
.topband-clock span[data-clock] {
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 800;
  color: rgba(248,251,255,0.96);
}
.topband-clock small {
  display: block;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--text-soft);
}
.hero-atmosphere {
  height: 100%;
}
.hero-atmosphere .hero-content {
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: flex-start;
  padding: 0;
}
.curtain-overlay {
  align-self: stretch;
  width: 100% !important;
  max-width: 100% !important;
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  padding: 0;
}
.subview-footer {
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  grid-area: bottomband;
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
}
.subview-footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: clamp(6.24px, 0.44cqi, 10.4px);
  right: clamp(6.24px, 0.44cqi, 10.4px);
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent);
}
.subview-presence {
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 600;
  color: rgba(255,255,255,0.52);
}
.subview-presence bruno-icon {
  flex: 0 0 auto;
  --mdc-icon-size: 16px;
  color: rgba(255,255,255,0.42);
}
.lights-head {
  flex: 0 0 auto;
}
.lights-zones::-webkit-scrollbar {
  width: 0;
}
.light-zone {
  border-radius: 16px;
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  overflow: hidden;
}
.light-zone.is-expanded {
  background: rgba(255,255,255,0.055);
}
.zone-header {
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) auto auto;
  align-items: center;
  gap: clamp(8.58px, 0.6cqi, 14.3px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(10.92px, 0.77cqi, 18.2px);
  cursor: pointer;
}
.zone-icon {
  width: clamp(26.52px, 1.87cqi, 44.2px);
  height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 1px solid rgba(255,196,90,0.30);
  background: rgba(255,196,90,0.08);
  color: rgba(255,196,90,0.92);
}
.zone-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
}
.zone-id {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.zone-id strong {
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 700;
  color: var(--text-main);
}
.zone-id small {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 600;
  color: var(--text-soft);
}
.zone-off {
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 700;
  color: rgba(255,196,90,0.92);
  white-space: nowrap;
  cursor: pointer;
}
.zone-chevron {
  --mdc-icon-size: 20px;
  color: var(--text-soft);
}
.zone-preview {
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px) clamp(9.36px, 0.66cqi, 15.6px);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 600;
  color: var(--text-soft);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zl-tile {
  position: relative;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto 1fr auto;
  grid-template-areas: "icon sw" ". ." "name name";
  align-items: center;
  text-align: left;
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 16px;
  color: var(--text-main);
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  cursor: pointer;
  transition: background 0.2s ease, border-color 0.2s ease;
}
.zl-tile:hover {
  background: rgba(255,255,255,0.06);
}
.zl-tile.is-on {
  background: rgba(255,183,77,0.10);
  border-color: rgba(255,205,95,0.42);
}
.zl-tile.is-wide {
  grid-column: 1 / -1;
  grid-template-columns: auto 1fr auto;
  grid-template-rows: auto;
  grid-template-areas: "icon name sw";
  align-items: center;
  align-content: center;
  column-gap: clamp(7.8px, 0.55cqi, 13px);
}
.zl-tile.is-wide .zl-icon {
  width: clamp(21.84px, 1.54cqi, 36.4px);
}
.zl-icon {
  grid-area: icon;
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: grid;
  place-items: center start;
  --light-color: #9da0a2;
  color: var(--light-color);
}
.zl-tile.is-on .zl-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.zl-icon .tpl-light-icon {
  width: clamp(21.06px, 1.48cqi, 35.1px);
  height: clamp(21.06px, 1.48cqi, 35.1px);
}
.zl-icon svg {
  width: 100%;
  height: 100%;
}
.zl-icon .tpl-light-icon svg g, .zl-icon .tpl-light-icon svg path {
  stroke-width: 1.09;
}
.zl-icon .tpl-light-icon.icon-ledstrip svg path {
  stroke-width: 1.45;
}
.zl-name {
  grid-area: name;
  min-width: 0;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zl-switch {
  grid-area: sw;
  position: relative;
  width: clamp(29.64px, 2.09cqi, 49.4px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  border: 1px solid rgba(255,255,255,0.14);
  transition: background 0.2s ease, border-color 0.2s ease;
}
.zl-tile.is-on .zl-switch {
  background: linear-gradient(90deg, rgba(255,176,54,0.95), rgba(255,206,120,0.95));
  border-color: rgba(255,196,90,0.55);
}
.zl-knob {
  position: absolute;
  top: 50%;
  left: 2px;
  transform: translateY(-50%);
  width: clamp(12.48px, 0.88cqi, 20.8px);
  height: clamp(12.48px, 0.88cqi, 20.8px);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  transition: left 0.2s ease;
}
.zl-tile.is-on .zl-knob {
  left: calc(100% - clamp(14.04px, 0.99cqi, 23.4px));
}
.light-row:hover {
  background: rgba(255,255,255,0.04);
}
.light-row.is-on .light-row-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.light-row-icon .tpl-light-icon {
  width: var(--bruno-liquid-icon-control, 23px);
  height: var(--bruno-liquid-icon-control, 23px);
}
.light-row-icon svg {
  width: 100%;
  height: 100%;
}
.light-row.is-on .light-bar {
  background: linear-gradient(90deg, rgba(255,176,54,0.96), rgba(255,206,120,0.96));
  border-color: rgba(255,196,90,0.55);
  box-shadow: 0 0 12px rgba(255,176,54,0.55), 0 0 4px rgba(255,176,54,0.6), inset 0 1px 0 rgba(255,255,255,0.45);
}
.ac-card.ac-card-lean {
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr) clamp(49.92px, 3.52cqi, 83.2px);
  gap: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.ac-lean-head {
  position: relative;
  z-index: 3;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.ac-head-title {
  display: inline-flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-width: 0;
}
.ac-top-stack {
  position: absolute;
  top: clamp(3.9px, 0.27cqi, 6.5px);
  right: clamp(7.8px, 0.55cqi, 13px);
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: clamp(11.7px, 0.82cqi, 19.5px);
}
.ac-more-button {
  flex: 0 0 auto;
}
.ac-power-floating {
  width: clamp(35.88px, 2.53cqi, 59.8px);
  height: clamp(35.88px, 2.53cqi, 59.8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.66);
  cursor: pointer;
  transition: color 160ms ease, background 160ms ease, box-shadow 160ms ease, transform 160ms ease;
}
.ac-power-floating bruno-icon {
  --mdc-icon-size: 34px;
}
.ac-power-floating:hover, .ac-power-floating:focus-visible {
  color: rgba(255,255,255,0.92);
  background: rgba(255,255,255,0.045);
}
.ac-power-floating.is-active {
  color: rgba(150,205,255,0.98);
  background: rgba(96,165,250,0.075);
  box-shadow: 0 0 18px rgba(44,175,255,0.22);
}
.ac-power-floating:active {
  transform: translateY(1px);
}
.ac-power-floating:disabled {
  opacity: 0.42;
  cursor: default;
}
.ac-lean-mid {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) 2px;
}
.ac-ring {
  width: 100%;
  min-width: 0;
  min-height: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: visible;
}
.ac-ring .icg-shell {
  width: min(94%, clamp(260.52px, 18.35cqi, 434.2px));
  /* ANTERIOR (rollback): transform: translateY(3px). O anel preserva a mesma
     proporção e ganha 6% nos dois eixos, no tablet e no telefone. */
  transform: translateY(3px) scale(1.06);
  transform-origin: center;
}
.ac-lean-foot {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
  align-items: end;
}
.ac-control-wrap {
  position: relative;
  min-width: 0;
}
.ac-action {
  width: 100%;
  min-width: 0;
  min-height: clamp(39px, 2.75cqi, 65px);
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  padding: clamp(5.46px, 0.38cqi, 9.1px) clamp(7.8px, 0.55cqi, 13px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
.ac-action:hover, .ac-action.is-open {
  background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
}
.ac-action:disabled {
  opacity: 0.42;
  cursor: default;
}
.ac-action-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.82);
  flex: 0 0 auto;
}
.ac-action:hover .ac-action-icon, .ac-action.is-open .ac-action-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
}
.ac-action-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-control, 23px);
}
.ac-action-text {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.ac-action-text small {
  font-size: clamp(7.8px, 0.55cqi, 13px);
  line-height: 1;
  font-weight: 650;
  color: rgba(255,255,255,0.58);
}
.ac-action-text strong {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.ac-popover {
  position: absolute;
  left: 0;
  right: 0;
  bottom: calc(100% + clamp(6.24px, 0.44cqi, 10.4px));
  z-index: 12;
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660)) );
  border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
  box-shadow: var(--bruno-liquid-popup-shadow, inset 0 1px 0 rgba(255,255,255,0.100), 0 18px 36px rgba(0,0,0,0.300) );
  backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
  -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
}
.ac-popover-option {
  min-width: 0;
  min-height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  grid-template-columns: clamp(14.04px, 0.99cqi, 23.4px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 9px;
  border: 0;
  background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
  color: rgba(255,255,255,0.82);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 750;
  text-align: left;
  cursor: pointer;
}
.ac-popover-option bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
  color: rgba(255,255,255,0.72);
}
.ac-popover-option span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.ac-popover-option:hover, .ac-popover-option.is-active {
  color: rgba(255,255,255,0.98);
  background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
}
.ac-popover-option:hover bruno-icon, .ac-popover-option.is-active bruno-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
}
.ac-popover-option:disabled {
  opacity: 0.48;
  cursor: default;
}
.room-sidebar {
  grid-area: frame-left;
  position: relative;
  z-index: 3;
  isolation: isolate;
  align-self: center;
  justify-self: center;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  overflow: visible;
  width: clamp(45.24px, 3.19cqi, 75.4px);
  height: auto;
  max-height: calc(100% - clamp(4.68px, 0.33cqi, 7.8px));
  grid-auto-rows: clamp(31.2px, 2.2cqi, 52px);
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(6.24px, 0.44cqi, 10.4px);
}
.room-nav-button {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) 2px clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: 13px;
  color: rgba(255,255,255,0.60);
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  transition: background 160ms ease, color 160ms ease;
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  min-width: clamp(31.2px, 2.2cqi, 52px);
  min-height: clamp(31.2px, 2.2cqi, 52px);
  max-width: clamp(31.2px, 2.2cqi, 52px);
  max-height: clamp(31.2px, 2.2cqi, 52px);
}
.hero-stage {
  position: relative;
  isolation: isolate;
  width: 100%;
  height: 100%;
  min-height: 0;
  color: var(--text-main);
  border-radius: 0;
  overflow: visible;
}
.hero-content {
  flex-direction: column;
  justify-content: flex-end;
  position: relative;
  z-index: 1;
  height: 100%;
  display: grid;
  grid-template-columns: 1fr auto;
  grid-template-rows: auto minmax(0, 1fr) auto;
  padding: clamp(11.7px, 0.82cqi, 19.5px) clamp(14.04px, 0.99cqi, 23.4px) clamp(10.92px, 0.77cqi, 18.2px);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.hero-headline {
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  justify-self: start;
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
}
.hero-date-line {
  margin: 0 0 clamp(8.58px, 0.6cqi, 14.3px);
  color: rgba(255,255,255,0.54);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: clamp(4.68px, 0.33cqi, 7.8px);
}
.hero-clock {
  line-height: 0.96;
  font-weight: 220;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 10px 32px rgba(0,0,0,0.28);
  margin-top: clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(clamp(42.12px, 2.97cqi, 70.2px), 7.1vh, clamp(57.72px, 4.07cqi, 96.2px));
}
.scene-pill {
  width: fit-content;
  max-width: min(clamp(195px, 13.74cqi, 325px), 100%);
  min-height: clamp(23.4px, 1.65cqi, 39px);
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
  display: inline-flex;
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.10), 0 10px 24px rgba(0,0,0,0.20);
}
.scene-pill bruno-icon {
  --mdc-icon-size: 15px;
  color: rgb(255,205,95);
}
.curtain-dock {
  --curtain-gold-rgb: var(--bruno-liquid-warm-accent, 242,194,102);
  --curtain-gold: rgb(var(--curtain-gold-rgb));
  grid-row: 3;
  grid-column: 1 / -1;
  align-self: end;
  display: grid;
  grid-template-columns: 1fr;
  padding: 0;
  border-radius: 0;
  background: transparent;
  border: 0;
  box-shadow: none;
  backdrop-filter: none;
  -webkit-backdrop-filter: none;
  width: min(clamp(405.6px, 28.57cqi, 676px), 100%);
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.curtain-action-button {
  width: clamp(59.28px, 4.18cqi, 98.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(3.9px, 0.27cqi, 6.5px);
  padding: 0 clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.15));
  background: var(--bruno-liquid-control-background, linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)), rgba(255,255,255,0.030) );
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
  min-width: clamp(60.84px, 4.29cqi, 101.4px);
}
.status-rail {
  display: grid;
  gap: 0;
  padding: 0;
  min-height: clamp(49.92px, 3.52cqi, 83.2px);
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.status-item {
  display: grid;
  align-items: center;
  min-width: 0;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  border-right: 1px solid rgba(255,255,255,0.08);
  grid-template-columns: auto minmax(0, 1fr);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
}
.status-chevron {
  --mdc-icon-size: 17px;
  color: rgba(255,255,255,0.58);
  display: none;
}
.lights-card .module-head {
  margin-bottom: 0;
  align-items: start;
  min-height: clamp(31.2px, 2.2cqi, 52px);
}
.lights-title-row {
  display: flex;
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
}
.zone-toggle, .media-tabs {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 3px;
  background: rgba(255,255,255,0.065);
  border: 1px solid rgba(255,255,255,0.11);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
}
.zone-toggle button {
  min-height: clamp(23.4px, 1.65cqi, 39px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 999px;
  color: rgba(255,255,255,0.62);
  background: transparent;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 900;
}
.head-actions .chip-button {
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.chip-button-icon {
  display: inline-flex;
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.chip-button-icon bruno-icon {
  --mdc-icon-size: 15px;
}
.zone-toggle button.is-active {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.12);
}
.lights-single-grid {
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-template-rows: repeat(2, minmax(0, 1fr));
  gap: clamp(10.92px, 0.77cqi, 18.2px) clamp(7.8px, 0.55cqi, 13px);
}
.lights-zone-rail {
  position: relative;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  justify-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: clamp(7.02px, 0.49cqi, 11.7px) clamp(5.46px, 0.38cqi, 9.1px);
  overflow: hidden;
  border-radius: var(--room-cell-radius);
  color: rgba(255,255,255,0.74);
  background: linear-gradient(145deg, rgba(255,255,255,0.072), rgba(255,255,255,0.026)), rgba(8,14,26,0.50);
  border: 1px solid rgba(255,224,160,0.13);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.13), inset 0 -1px 0 rgba(255,200,100,0.045), 0 12px 26px rgba(0,0,0,0.20);
  backdrop-filter: blur(22px) saturate(1.34);
  -webkit-backdrop-filter: blur(22px) saturate(1.34);
  display: grid;
}
.lights-groups, .lights-divider, .light-group-label {
  display: none;
}
.light-tile {
  position: relative;
  display: grid;
  grid-template-rows: auto auto;
  grid-template-areas: "icon title" "icon status";
  align-items: center;
  align-content: center;
  text-align: left;
  border-radius: var(--room-cell-radius);
  color: rgba(255,255,255,0.86);
  background: var(--bruno-liquid-cell-background, rgba(255,255,255,0.055));
  border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.11));
  box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.08));
  transition: transform 160ms ease, border-color 160ms ease, background 160ms ease;
  min-height: 0;
  grid-template-columns: clamp(46.8px, 3.3cqi, 78px) minmax(0, 1fr);
  column-gap: clamp(8.58px, 0.6cqi, 14.3px);
  padding: clamp(8.58px, 0.6cqi, 14.3px) clamp(9.36px, 0.66cqi, 15.6px);
}
.light-icon {
  grid-area: icon;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  --light-color: var(--state-icon-color, #9da0a2);
  color: rgba(255,255,255,0.74);
  width: clamp(46.8px, 3.3cqi, 78px);
  height: clamp(46.8px, 3.3cqi, 78px);
}
.light-tile strong {
  grid-area: title;
  min-width: 0;
  align-self: end;
  line-height: 1.12;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: clamp(11.54px, 0.81cqi, 19.24px);
}
.cameras-card.cameras-card-controls {
  padding: 0;
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
}
.cameras-head {
  flex: 0 0 auto;
}
.camera-settings-button.is-active {
  color: rgba(255,255,255,0.86);
  background: rgba(255,255,255,0.055);
}
.camera-pip-stage {
  box-sizing: border-box;
  position: relative;
  z-index: 1;
  min-height: 0;
  height: 100%;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.camera-feed {
  height: 100%;
  transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
}
.camera-primary-feed {
  width: 100%;
}
.camera-pip-feed {
  position: absolute;
  z-index: 5;
  right: clamp(15.6px, 1.1cqi, 26px);
  bottom: clamp(17.16px, 1.21cqi, 28.6px);
  width: min(36%, clamp(117px, 8.24cqi, 195px));
  height: clamp(67.08px, 4.73cqi, 111.8px);
  border-radius: 13px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.10);
}
.camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(59.28px, 4.18cqi, 98.8px);
}
.camera-pip-feed .camera-row-copy {
  left: clamp(7.02px, 0.49cqi, 11.7px);
  right: clamp(7.02px, 0.49cqi, 11.7px);
  bottom: clamp(6.24px, 0.44cqi, 10.4px);
  gap: 0;
}
.camera-pip-feed .camera-row-copy strong {
  max-width: 100%;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.camera-pip-feed .camera-row-copy span {
  display: none;
}
.camera-pip-feed::after {
  background: linear-gradient(180deg, rgba(4,8,16,0.04), rgba(4,8,16,0.52));
}
.camera-state-surface {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  align-content: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(12.48px, 0.88cqi, 20.8px);
  color: rgba(255,255,255,0.78);
  text-align: center;
  background: radial-gradient(circle at 50% 42%, rgba(96,165,250,0.12), transparent 58%), rgba(5,8,14,0.76);
  backdrop-filter: blur(8px) saturate(0.9);
  -webkit-backdrop-filter: blur(8px) saturate(0.9);
}
.camera-state-surface bruno-icon {
  display: none;
  --mdc-icon-size: 32px;
  color: rgba(255,255,255,0.64);
}
.camera-state-surface span {
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 760;
  line-height: 1.1;
}
.camera-pip-feed .camera-state-surface {
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding: clamp(6.24px, 0.44cqi, 10.4px);
}
.camera-pip-feed .camera-state-surface bruno-icon {
  --mdc-icon-size: 22px;
}
.camera-pip-feed .camera-state-surface span {
  font-size: clamp(7.02px, 0.49cqi, 11.7px);
}
.camera-feed.is-private .camera-row-image img, .camera-feed.is-unavailable .camera-row-image img {
  opacity: 0;
}
.live-dot.is-muted {
  background: rgba(255,255,255,0.34);
  box-shadow: none;
}
.camera-control-strip {
  position: absolute;
  left: clamp(7.8px, 0.55cqi, 13px);
  right: clamp(7.8px, 0.55cqi, 13px);
  bottom: clamp(7.8px, 0.55cqi, 13px);
  z-index: 7;
  min-height: clamp(45.24px, 3.19cqi, 75.4px);
  display: grid;
  align-items: stretch;
  padding: clamp(3.12px, 0.22cqi, 5.2px) 0;
  border: 0;
  border-radius: 0;
  background: linear-gradient(180deg, rgba(3,7,13,0.08), rgba(3,7,13,0.40)), rgba(6,8,12,0.18);
  backdrop-filter: blur(10px) saturate(0.95);
  -webkit-backdrop-filter: blur(10px) saturate(0.95);
}
.camera-controls {
  min-width: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  align-items: stretch;
}
.camera-control {
  position: relative;
  min-width: 0;
  min-height: clamp(39px, 2.75cqi, 65px);
  display: grid;
  grid-template-columns: clamp(14.04px, 0.99cqi, 23.4px) auto clamp(21.84px, 1.54cqi, 36.4px);
  align-items: center;
  justify-content: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border: 0;
  border-radius: 0;
  background: transparent;
  color: rgba(255,255,255,0.62);
  cursor: pointer;
  text-align: left;
  transition: color 160ms ease, background 160ms ease, opacity 160ms ease;
}
.camera-control + .camera-control::before {
  content: "";
  position: absolute;
  left: 0;
  top: clamp(8.58px, 0.6cqi, 14.3px);
  bottom: clamp(8.58px, 0.6cqi, 14.3px);
  width: 1px;
  background: rgba(255,255,255,0.105);
}
.camera-control:hover, .camera-control:focus-visible {
  color: rgba(255,255,255,0.90);
  background: rgba(255,255,255,0.036);
  outline: none;
}
.camera-control:focus-visible {
  box-shadow: inset 0 0 0 1px rgba(138,196,255,0.42);
}
.camera-control bruno-icon {
  --mdc-icon-size: 17px;
}
.camera-control-label {
  min-width: 0;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 760;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.camera-control-switch {
  position: relative;
  justify-self: start;
  width: clamp(20.28px, 1.43cqi, 33.8px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.16);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.30);
  transition: background 160ms ease, box-shadow 160ms ease;
}
.camera-control-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: clamp(6.24px, 0.44cqi, 10.4px);
  height: clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: 50%;
  background: rgba(255,255,255,0.74);
  box-shadow: 0 1px 3px rgba(0,0,0,0.30);
  transition: transform 160ms ease, background 160ms ease;
}
.camera-control.is-on {
  color: rgba(218,248,230,0.94);
}
.camera-control.is-on .camera-control-switch {
  background: rgba(46,231,122,0.58);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.18), 0 0 8px rgba(46,231,122,0.18);
}
.camera-control.is-on .camera-control-switch::after {
  transform: translateX(12px);
  background: rgba(255,255,255,0.96);
}
.camera-control.is-unavailable, .camera-control:disabled {
  opacity: 0.34;
  cursor: not-allowed;
}
.camera-row-copy {
  display: grid;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  left: clamp(10.92px, 0.77cqi, 18.2px);
  right: clamp(10.92px, 0.77cqi, 18.2px);
  bottom: clamp(10.92px, 0.77cqi, 18.2px);
  transition: bottom 220ms ease;
}
.camera-pip-stage.is-controls-open .camera-primary-feed .camera-row-copy {
  bottom: clamp(59.28px, 4.18cqi, 98.8px);
}
.camera-row-copy strong {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  line-height: 1.08;
}
.media-hub-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.media-hub-head {
  align-items: start;
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  margin-bottom: 0;
}
.media-tabs {
  gap: 2px;
  max-width: 62%;
}
.media-tabs button {
  min-width: 0;
  min-height: clamp(23.4px, 1.65cqi, 39px);
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: clamp(3.9px, 0.27cqi, 6.5px);
  padding: 3px clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  color: rgba(255,255,255,0.58);
  background: transparent;
  font-size: clamp(7.8px, 0.55cqi, 13px);
  font-weight: 900;
}
.media-tabs button.is-selected {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.12);
}
.media-tabs small {
  grid-column: 2;
  max-width: clamp(51.48px, 3.63cqi, 85.8px);
  color: rgba(255,255,255,0.46);
  font-size: clamp(6.24px, 0.44cqi, 10.4px);
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.source-dot {
  grid-row: 1 / 3;
  width: clamp(4.68px, 0.33cqi, 7.8px);
  height: clamp(4.68px, 0.33cqi, 7.8px);
  border-radius: 50%;
  background: rgba(255,255,255,0.24);
}
.media-tabs button.is-source-active .source-dot {
  background: #2ee77a;
  box-shadow: 0 0 10px rgba(46,231,122,0.52);
}
.media-hub-body {
  min-height: 0;
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(clamp(145.08px, 10.22cqi, 241.8px), 0.86fr) minmax(0, 1fr);
  grid-template-rows: minmax(clamp(160.68px, 11.32cqi, 267.8px), 1fr);
  grid-template-areas: "visual content";
  align-items: stretch;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
}
.media-visual {
  grid-area: visual;
  position: relative;
  min-height: 0;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--room-radius-small);
  color: rgba(255,255,255,0.22);
  background: radial-gradient(circle at 52% 34%, rgba(96,165,250,0.15), transparent 54%), rgba(5,10,20,0.74);
  border: 1px solid rgba(255,255,255,0.10);
}
.media-visual img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.media-standby-image {
  position: static !important;
  inset: auto !important;
  width: 92% !important;
  height: 92% !important;
  object-fit: contain !important;
  opacity: 0.96;
  filter: drop-shadow(0 18px 28px rgba(0,0,0,0.42));
}
.media-tv-standby {
  width: 96% !important;
  height: 86% !important;
}
.media-spotify-standby {
  width: 72% !important;
  height: 78% !important;
}
.media-visual bruno-icon {
  --mdc-icon-size: 64px;
}
.media-hub-content {
  grid-area: content;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: clamp(31.2px, 2.2cqi, 52px) minmax(clamp(95.16px, 6.7cqi, 158.6px), 1fr) auto;
  align-content: stretch;
  gap: clamp(8.58px, 0.6cqi, 14.3px);
}
.media-ps5-image {
  position: static !important;
  width: 108% !important;
  height: 100% !important;
  object-fit: contain !important;
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.42));
}
.media-details {
  grid-area: auto;
  min-width: 0;
  min-height: clamp(31.2px, 2.2cqi, 52px);
  display: grid;
  grid-template-rows: clamp(15.6px, 1.1cqi, 26px) clamp(12.48px, 0.88cqi, 20.8px);
  align-content: start;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
  padding-top: 1px;
}
.media-details strong {
  min-width: 0;
  color: white;
  font-size: clamp(13.26px, 0.93cqi, 22.1px);
  line-height: 1.08;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details small, .media-details em {
  min-width: 0;
  color: var(--text-soft);
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  line-height: 1.25;
  font-style: normal;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details em {
  color: rgba(255,255,255,0.48);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
}
.media-action-stack {
  grid-area: auto;
  --media-action-size: 55px;
  display: grid;
  align-content: center;
  align-self: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  min-width: 0;
}
.media-primary-actions, .media-secondary-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(4, var(--media-action-size));
  align-items: center;
  justify-content: space-between;
  min-width: 0;
}
.media-primary-actions.is-wide {
  grid-template-columns: minmax(0, 1fr) var(--media-action-size);
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.media-primary-actions.is-wide .primary-button {
  min-height: var(--media-action-size);
  border-radius: var(--bruno-liquid-control-radius, 14px);
}
.media-action-button, .media-action-spacer, .media-identity-cell {
  width: var(--media-action-size);
  height: var(--media-action-size);
}
.media-action-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  overflow: hidden;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  color: rgba(255,255,255,0.82);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.08));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.media-action-button bruno-icon {
  --mdc-icon-size: 20px;
}
.media-action-button.is-main {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 72%), linear-gradient(180deg, rgba(80,145,230,0.74), rgba(37,86,154,0.58)) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(150,198,255,0.44));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.22), 0 0 22px rgba(96,165,250,0.24) );
}
.media-action-button.is-tool {
  color: rgba(210,245,230,0.96);
  background: var(--bruno-liquid-control-green-background, radial-gradient(circle at 50% 16%, rgba(46,231,122,0.22), transparent 72%), rgba(255,255,255,0.075) );
  border-color: var(--bruno-liquid-control-green-border, rgba(46,231,122,0.22));
  box-shadow: var(--bruno-liquid-control-green-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.media-action-button:disabled {
  opacity: 0.42;
  cursor: default;
}
.media-action-spacer {
  display: block;
  pointer-events: none;
  visibility: hidden;
}
.media-identity-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  color: rgba(210,222,236,0.58);
}
.media-identity-cell.is-active {
  color: rgba(255,255,255,0.96);
}
.tpl-media-icon {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: block;
  filter: drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.media-identity-cell.is-active .tpl-media-icon {
  filter: drop-shadow(0 0 12px rgba(96,190,255,0.34)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.tpl-media-icon svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
.tpl-media-icon svg g, .tpl-media-icon svg path {
  stroke-width: 0.67;
}
.tpl-media-icon.icon-spotify.is-active {
  color: #1ed760;
  filter: drop-shadow(0 0 12px rgba(46,231,122,0.36)) drop-shadow(0 8px 14px rgba(0,0,0,0.30));
}
.media-image-button {
  background: rgba(255,255,255,0.07);
}
.media-button-art {
  position: absolute;
  inset: 0;
  background-image: var(--media-app-image);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.media-image-button::after {
  content: '';
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%);
  box-shadow: inset 0 0 0 1px rgba(255,255,255,0.08);
}
.media-hub-extra {
  grid-area: auto;
  min-width: 0;
  align-self: end;
}
.media-extra-info {
  min-height: clamp(26.52px, 1.87cqi, 44.2px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: 12px;
  color: var(--text-soft);
  background: rgba(255,255,255,0.052);
  border: 1px solid rgba(255,255,255,0.10);
}
.media-extra-info strong {
  color: rgba(255,255,255,0.88);
  text-align: right;
}
.media-hub-card.mh-accordion {
  position: relative;
  padding: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: 0;
  overflow: hidden;
  border-radius: var(--bruno-liquid-card-radius, 18px);
  background: var(--bruno-liquid-surface-off-background, linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)), rgba(9,11,15,0.105) );
  border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145));
  backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
  -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
}
.media-hub-card.mh-accordion::before {
  opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10);
}
.media-hub-card.mh-accordion::after {
  display: var(--bruno-subview-card-edge-display, none);
}
.mh-head {
  position: relative;
  z-index: 1;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
}
.mh-head-title {
  display: inline-flex;
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-width: 0;
}
.mh-menu {
  width: clamp(23.4px, 1.65cqi, 39px);
  height: clamp(23.4px, 1.65cqi, 39px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 9px;
  color: rgba(255,255,255,0.52);
  background: transparent;
}
.mh-menu bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
}
.media-hub-card .mh-menu.is-active {
  color: rgba(255,255,255,0.82);
  background: rgba(255,255,255,0.072);
}
.mh-menu:active {
  background: rgba(255,255,255,0.08);
}
.mh-overflow-panel {
  position: absolute;
  z-index: 5;
  top: clamp(32.76px, 2.31cqi, 54.6px);
  right: clamp(7.8px, 0.55cqi, 13px);
  width: min(clamp(218.4px, 15.38cqi, 364px), calc(100% - clamp(15.6px, 1.1cqi, 26px)));
  padding: clamp(5.46px, 0.38cqi, 9.1px);
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: linear-gradient(180deg, rgba(34,31,30,0.72), rgba(12,13,16,0.66));
  border: 1px solid rgba(255,255,255,0.115);
  box-shadow: 0 18px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
  -webkit-backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
}
.mh-overflow-item {
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
  display: grid;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) clamp(26.52px, 1.87cqi, 44.2px) clamp(26.52px, 1.87cqi, 44.2px);
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(3.12px, 0.22cqi, 5.2px) clamp(3.9px, 0.27cqi, 6.5px);
}
.mh-overflow-icon {
  width: clamp(23.4px, 1.65cqi, 39px);
  height: clamp(23.4px, 1.65cqi, 39px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.86);
  background: rgba(255,255,255,0.055);
  border: 1px solid rgba(255,255,255,0.075);
}
.mh-overflow-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
}
.mh-overflow-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.mh-overflow-copy strong {
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.92);
}
.mh-overflow-copy small {
  min-width: 0;
  font-size: clamp(8.19px, 0.58cqi, 13.65px);
  line-height: 1.1;
  font-weight: 650;
  color: rgba(255,255,255,0.54);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-overflow-action {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 10px;
  color: rgba(255,255,255,0.72);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.075);
}
.mh-overflow-action bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
}
.mh-overflow-action.is-active {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
  border-color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.24);
  background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.075);
}
.mh-overflow-action:disabled {
  opacity: 0.42;
  cursor: default;
}
.mh-sources {
  position: relative;
  z-index: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.mh-source {
  position: relative;
  flex: 0 0 42px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: var(--bruno-liquid-band-background, rgba(255,255,255,0.010));
  border: var(--bruno-liquid-band-border, 1px solid rgba(255,255,255,0.035));
  box-shadow: var(--bruno-liquid-band-shadow, none);
  transition: flex-basis 260ms cubic-bezier(0.2, 0.8, 0.2, 1), flex-grow 260ms cubic-bezier(0.2, 0.8, 0.2, 1), background 220ms ease, border-color 220ms ease, box-shadow 220ms ease;
  will-change: flex-basis, flex-grow, background, border-color;
}
.mh-source.is-open {
  flex: 1 1 0;
  background: var(--bruno-liquid-band-open-background, linear-gradient(180deg, rgba(255,255,255,0.044), rgba(255,255,255,0.012) 54%, rgba(255,255,255,0.018)), rgba(9,11,15,0.052) );
  border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
  box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
}
.mh-source.is-switching {
  animation: mh-source-open 260ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
}
.mh-source-head {
  --mh-indent: 26px;
  flex: 0 0 42px;
  height: clamp(32.76px, 2.31cqi, 54.6px);
  display: grid;
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, auto) minmax(0, 1fr) clamp(12.48px, 0.88cqi, 20.8px);
  align-items: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px) 0 clamp(10.92px, 0.77cqi, 18.2px);
  background: transparent;
  text-align: left;
  transition: flex-basis 220ms ease, height 220ms ease;
}
.mh-source.is-open .mh-source-head {
  flex: 0 0 48px;
  height: clamp(37.44px, 2.64cqi, 62.4px);
  align-items: center;
}
.mh-src-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  --mdc-icon-size: var(--bruno-liquid-icon-section, 20px);
  color: rgba(255,255,255,0.6);
  background: transparent;
  border: 0;
}
.mh-icon-spotify {
  color: rgba(255,255,255,0.66);
}
.mh-source.is-active .mh-src-icon, .mh-source.is-active .mh-icon-spotify {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-src-name {
  min-width: 0;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 800;
  line-height: 1;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-source.is-open .mh-src-name {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
}
.mh-src-summary {
  min-width: 0;
  justify-self: end;
  max-width: 100%;
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 650;
  color: rgba(255,255,255,0.50);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-source.is-open .mh-src-summary {
  display: none;
}
.mh-src-chevron {
  --mdc-icon-size: 18px;
  color: rgba(255,255,255,0.4);
}
.mh-source.is-open .mh-src-chevron {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-source-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(clamp(131.04px, 9.23cqi, 218.4px), 40%, clamp(202.8px, 14.29cqi, 338px));
  gap: clamp(10.92px, 0.77cqi, 18.2px);
  padding: 2px clamp(12.48px, 0.88cqi, 20.8px) clamp(10.92px, 0.77cqi, 18.2px);
}
.mh-source.is-switching .mh-source-body {
  opacity: 0;
  transform: translateY(5px);
  animation: mh-source-body-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 55ms both;
}
.mh-left {
  min-width: 0;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.mh-source.is-switching .mh-left {
  animation: mh-source-content-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 75ms both;
}
.mh-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: clamp(20.28px, 1.43cqi, 33.8px);
}
.mh-info small {
  display: block;
  font-size: clamp(10.53px, 0.74cqi, 17.55px);
  font-weight: 750;
  line-height: 1.15;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-info em {
  display: block;
  font-style: normal;
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-progress-wrap {
  width: min(100%, 94%);
  margin-top: clamp(3.9px, 0.27cqi, 6.5px);
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
}
.mh-progress-time {
  font-size: clamp(7.41px, 0.52cqi, 12.35px);
  line-height: 1;
  font-weight: 700;
  color: rgba(255,255,255,0.48);
  font-variant-numeric: tabular-nums;
}
.mh-progress {
  height: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.14);
  overflow: hidden;
}
.mh-progress span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(var(--bruno-liquid-warm-accent, 242,194,102)), rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.88));
}
.mh-controls {
  min-width: 0;
  margin-top: auto;
  display: flex;
  flex-direction: column;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
}
.mh-vol {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
  min-height: clamp(24.96px, 1.76cqi, 41.6px);
  padding: 0 clamp(9.36px, 0.66cqi, 15.6px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  color: var(--text-soft);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, none);
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
}
.mh-vol bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-status, 15px);
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol-label {
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  white-space: nowrap;
  color: rgba(255,255,255,0.7);
}
.mh-vol input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: clamp(3.12px, 0.22cqi, 5.2px);
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  accent-color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
  box-shadow: 0 0 8px rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.5);
  cursor: pointer;
}
.mh-vol input[type="range"]::-moz-range-thumb {
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
  border: 0;
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol.is-disabled {
  opacity: 0.4;
}
.mh-btn-row {
  display: grid;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.mh-btn-row-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.mh-btn-row-4 {
  grid-template-columns: repeat(3, minmax(0, 1fr)) clamp(32.76px, 2.31cqi, 54.6px);
}
.mh-btn {
  min-height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  color: rgba(255,255,255,0.88);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 700;
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
  box-shadow: var(--bruno-liquid-control-shadow, none);
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  white-space: nowrap;
  overflow: hidden;
}
.mh-btn.is-icon {
  padding: 0;
  gap: 0;
}
.mh-btn bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-control, 23px);
  flex: 0 0 auto;
  color: rgba(255,255,255,0.9);
}
.mh-btn:hover {
  background: rgba(255,255,255,0.052);
}
.mh-btn span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-btn:active {
  transform: translateY(1px);
}
.mh-btn:disabled {
  opacity: 0.42;
  cursor: default;
}
.mh-controls > .mh-btn.is-main {
  align-self: flex-start;
  width: 50%;
  min-width: clamp(109.2px, 7.69cqi, 182px);
  min-height: clamp(31.2px, 2.2cqi, 52px);
}
.mh-btn.is-main {
  color: rgba(255,255,255,0.94);
  background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
  border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
}
.mh-btn.is-main bruno-icon {
  color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.82);
}
.mh-btn.is-plus {
  padding: 0;
  color: rgba(255,255,255,0.72);
}
.mh-art {
  position: relative;
  min-width: 0;
  align-self: stretch;
  height: 100%;
  overflow: hidden;
  background: transparent;
  border: 0;
}
.mh-source.is-switching .mh-art {
  animation: mh-source-art-in 240ms cubic-bezier(0.2, 0.8, 0.2, 1) 85ms both;
}
.mh-art img {
  position: absolute;
  inset: clamp(4.68px, 0.33cqi, 7.8px) 0;
  width: 100%;
  height: calc(100% - clamp(9.36px, 0.66cqi, 15.6px));
  object-fit: contain;
}
.mh-art bruno-icon {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  --mdc-icon-size: 56px;
  color: rgba(255,255,255,0.22);
}
.mh-art.is-standby img {
  filter: none;
}
.mh-art.is-cover img {
  object-fit: cover;
}
.mh-art-square.is-cover img {
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: auto;
  height: calc(100% - clamp(7.8px, 0.55cqi, 13px));
  aspect-ratio: 1 / 1;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: none;
}
.mh-art-wide.is-cover img {
  inset: auto;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 100%;
  height: auto;
  aspect-ratio: 16 / 9;
  object-fit: cover;
  border-radius: 11px;
  box-shadow: none;
}
@keyframes mh-source-open {
from {
  flex-grow: 0;
  flex-basis: clamp(32.76px, 2.31cqi, 54.6px);
  border-color: var(--bruno-liquid-band-border-color, rgba(255,255,255,0.040));
  box-shadow: var(--bruno-liquid-band-shadow, none);
}
to {
  flex-grow: 1;
  flex-basis: 0;
  border-color: var(--bruno-liquid-band-open-border-color, rgba(255,255,255,0.092));
  box-shadow: var(--bruno-liquid-band-open-shadow, inset 0 1px 0 rgba(255,255,255,0.066), 0 6px 16px rgba(0,0,0,0.105));
}
}
@keyframes mh-source-body-in {
from {
  opacity: 0;
  transform: translateY(5px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
}
@keyframes mh-source-content-in {
from {
  opacity: 0;
  transform: translateY(4px);
}
to {
  opacity: 1;
  transform: translateY(0);
}
}
@keyframes mh-source-art-in {
from {
  opacity: 0;
  transform: translateY(4px) scale(0.985);
}
to {
  opacity: 1;
  transform: translateY(0) scale(1);
}
}
@media (prefers-reduced-motion: reduce) {
.mh-source, .mh-source-head, .mh-source-body, .mh-left, .mh-art, .mh-btn {
  transition: none !important;
  animation: none !important;
}
.mh-source-body {
  opacity: 1;
  transform: none;
}
}
.ac-card {
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.ac-head {
  margin-bottom: 0;
}
.power-button {
  width: clamp(31.2px, 2.2cqi, 52px);
  height: clamp(31.2px, 2.2cqi, 52px);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  color: rgba(255,255,255,0.74);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.13));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.09));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(18px) saturate(1.28));
}
.power-button.is-active {
  color: white;
  background: var(--bruno-liquid-control-blue-background, radial-gradient(circle at 50% 14%, rgba(96,165,250,0.34), transparent 72%), rgba(38,92,138,0.38) );
  border-color: var(--bruno-liquid-control-blue-border, rgba(96,165,250,0.32));
  box-shadow: var(--bruno-liquid-control-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
}
.power-button bruno-icon {
  --mdc-icon-size: 18px;
}
.ac-body {
  height: 100%;
  min-height: 0;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto auto auto auto;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  align-content: space-between;
}
.temperature-slider {
  min-width: 0;
  width: 100%;
  display: block;
  align-items: center;
  padding: 0;
  background: transparent;
  border: 0;
  margin-bottom: 3px;
}
.climate-stepper {
  display: grid;
  grid-template-columns: clamp(32.76px, 2.31cqi, 54.6px) minmax(0, 1fr) clamp(32.76px, 2.31cqi, 54.6px);
  align-items: center;
  overflow: hidden;
  margin-bottom: clamp(3.12px, 0.22cqi, 5.2px);
}
.ac-visual {
  position: relative;
  min-height: clamp(234px, 16.48cqi, 390px);
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  gap: clamp(12.48px, 0.88cqi, 20.8px);
  padding: 0 0 2px;
}
.ac-image-shell {
  position: relative;
  width: 100%;
  height: clamp(90.48px, 6.37cqi, 150.8px);
  margin: -2px 0 0;
  display: grid;
  place-items: start center;
  overflow: visible;
}
.ac-unit-image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center top;
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.38));
  opacity: 1;
  transform: translateY(0);
  transition: opacity 260ms ease, transform 320ms ease, filter 260ms ease;
}
.ac-unit-image-on {
  opacity: 0;
  transform: translateY(2px);
  filter: drop-shadow(0 18px 26px rgba(0,0,0,0.38)) drop-shadow(0 0 18px rgba(110,200,255,0.12));
}
.ac-image-shell.is-on .ac-unit-image-off {
  opacity: 0;
  transform: translateY(-1px);
}
.ac-image-shell.is-on .ac-unit-image-on {
  opacity: 1;
  transform: translateY(0);
}
.ac-image-fallback {
  display: none;
  --mdc-icon-size: 84px;
  place-self: center;
  color: rgba(226,232,240,0.46);
  filter: drop-shadow(0 14px 22px rgba(0,0,0,0.32));
}
.ac-image-shell.is-fallback .ac-unit-image {
  display: none;
}
.ac-image-shell.is-fallback .ac-image-fallback {
  display: block;
}
.icg-root {
  width: 100%;
  background: transparent;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: visible;
}
.icg-shell {
  width: min(100%, clamp(639.6px, 45.05cqi, 1066px));
  aspect-ratio: 16 / 10;
  position: relative;
  background: transparent;
}
.icg-svg {
  width: 100%;
  height: 100%;
  overflow: visible;
  display: block;
  background: transparent;
}
.icg-track-shadow {
  fill: none;
  stroke: rgba(0, 0, 0, 0.34);
  stroke-width: 16;
  stroke-linecap: round;
}
.icg-track-muted {
  fill: none;
  stroke: rgba(112, 136, 164, 0.38);
  stroke-width: 8;
  stroke-linecap: round;
}
.icg-active-glow {
  fill: none;
  stroke: url(#icgActiveBlue);
  stroke-width: 18;
  stroke-linecap: round;
  opacity: 0.74;
  filter: url(#icgBlueGlow);
}
.icg-active-arc {
  fill: none;
  stroke: url(#icgActiveBlue);
  stroke-width: 8;
  stroke-linecap: round;
}
.icg-tick {
  stroke-linecap: round;
}
.icg-tick.minor {
  stroke: rgba(145, 176, 214, 0.34);
  stroke-width: 1.2;
}
.icg-tick.medium {
  stroke: rgba(190, 214, 240, 0.50);
  stroke-width: 1.6;
}
.icg-tick.major {
  stroke: rgba(238, 247, 255, 0.88);
  stroke-width: 2.5;
}
.icg-inner-tick {
  stroke: rgba(40, 145, 255, 0.24);
  stroke-width: 1;
  stroke-linecap: round;
}
.icg-label {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(14.04px, 0.99cqi, 23.4px);
  font-weight: 500;
  letter-spacing: 1.4px;
  fill: rgba(224, 235, 248, 0.74);
}
.icg-label.edge {
  font-size: clamp(17.16px, 1.21cqi, 28.6px);
  fill: rgba(230, 240, 252, 0.82);
}
.icg-label.top {
  font-size: clamp(14.82px, 1.04cqi, 24.7px);
  fill: rgba(235, 245, 255, 0.90);
}
.icg-marker-glow {
  fill: rgba(40, 175, 255, 0.28);
  filter: url(#icgBlueGlow);
}
.icg-marker-ring {
  fill: rgba(5, 10, 18, 0.94);
  stroke: rgba(92, 210, 255, 0.98);
  stroke-width: 4;
  filter: url(#icgBlueGlow);
}
.icg-marker-highlight {
  fill: rgba(255, 255, 255, 0.62);
  opacity: 0.62;
}
.icg-center-mode {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 500;
  letter-spacing: 9px;
  fill: rgba(38, 190, 255, 0.96);
  text-transform: uppercase;
}
.icg-center-temp {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(74.88px, 5.27cqi, 124.8px);
  font-weight: 300;
  letter-spacing: -8px;
  fill: rgba(246, 250, 255, 0.98);
  filter: url(#icgTextGlow);
}
.icg-center-sub {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 500;
  letter-spacing: 9px;
  fill: rgba(190, 204, 220, 0.72);
  text-transform: uppercase;
}
.icg-center-line {
  stroke: rgba(36, 195, 255, 0.95);
  stroke-width: 2;
  stroke-linecap: round;
  filter: url(#icgBlueGlow);
}
.icg-ambient {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  font-weight: 500;
  letter-spacing: 1.8px;
  fill: rgba(176, 196, 220, 0.60);
}
.climate-mode-row {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.fan-mode-row {
  grid-template-columns: repeat(4, minmax(0, 1fr));
  align-items: start;
}
.fan-mode {
  color: rgba(255,255,255,0.74);
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  font-weight: 800;
  aspect-ratio: 1;
  min-height: 0;
  height: auto;
  padding: 0 clamp(3.12px, 0.22cqi, 5.2px);
}
@media (min-width: 761px) {
.lights-card {
  position: absolute;
  left: 0;
  right: 0;
  bottom: var(--lights-dock-bottom, calc(var(--ac-h, 320px) + 7px));
  z-index: 6;
  max-height: calc(100% - var(--lights-dock-bottom, calc(var(--ac-h, 320px) + 7px)));
}
.right-column > .ac-card {
  grid-row: 2;
}
}
.lights-dock-actions {
  display: flex;
  align-items: center;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
}
.lights-card.is-open .lights-dock-chevron {
  transform: rotate(180deg);
}
.lights-card.is-open .lights-body {
  grid-template-rows: 1fr;
}
.lights-body-clip {
  min-height: 0;
  overflow: hidden;
}
.lights-scroll::-webkit-scrollbar {
  width: 0;
}
.light-section + .light-section {
  margin-top: clamp(9.36px, 0.66cqi, 15.6px);
  padding-top: clamp(9.36px, 0.66cqi, 15.6px);
  border-top: 1px solid rgba(255,255,255,0.10);
}
.section-head .zone-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.section-head .zone-id strong {
  font-size: clamp(11.7px, 0.82cqi, 19.5px);
  font-weight: 700;
  line-height: 1.1;
}
.section-head .zone-id small {
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  color: rgba(255,255,255,0.46);
}
.section-head .zone-off {
  padding: 0 2px;
  border: 0;
  background: none;
  font: inherit;
  font-size: clamp(9.36px, 0.66cqi, 15.6px);
  font-weight: 700;
  color: rgba(255,196,90,0.92);
  cursor: pointer;
}
.lights-substatus {
  padding: 0 2px clamp(6.24px, 0.44cqi, 10.4px);
  font-size: clamp(8.97px, 0.63cqi, 14.95px);
  font-weight: 600;
  color: rgba(255,255,255,0.46);
}
.light-cell.is-wide {
  grid-column: 1 / -1;
}
.light-cell.is-on .lc-icon {
  --light-color: #f0c040;
  color: var(--light-color);
  filter: drop-shadow(0 0 7px rgba(240,192,64,0.28));
}
.light-cell.is-on .lc-switch {
  background: rgba(255,196,90,0.55);
  border-color: rgba(255,196,90,0.65);
}
@media (prefers-reduced-motion: reduce) {
.lights-body, .lights-dock-chevron, .lc-switch, .lc-knob {
  transition: none;
}
}
.lights-dock-id {
  display: flex;
  align-items: center;
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  gap: clamp(7.02px, 0.49cqi, 11.7px);
}
.lights-dock-chevron {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: clamp(17.16px, 1.21cqi, 28.6px);
  height: clamp(17.16px, 1.21cqi, 28.6px);
  color: rgba(255,255,255,0.55);
}
.lights-dock-chevron bruno-icon {
  --mdc-icon-size: 20px;
}
.lights-dock {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
}
.lights-scroll {
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
}
.section-head {
  display: grid;
  align-items: center;
  grid-template-columns: clamp(26.52px, 1.87cqi, 44.2px) minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(6.24px, 0.44cqi, 10.4px);
}
.lights-card.is-open .lights-dock {
  border-bottom: 1px solid rgba(255,255,255,0.10);
}
.light-cell {
  display: grid;
  align-items: center;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr) auto;
  gap: clamp(5.46px, 0.38cqi, 9.1px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
  min-height: clamp(46.8px, 3.3cqi, 78px);
  border: 1px solid var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
  border-radius: 0;
}
.lc-icon {
  display: grid;
  place-items: center start;
  --light-color: #9da0a2;
  color: var(--light-color);
  width: clamp(15.6px, 1.1cqi, 26px);
}
.lc-name {
  min-width: 0;
  font-weight: 600;
  color: rgba(255,255,255,0.90);
  text-overflow: ellipsis;
  font-size: clamp(10.53px, 0.74cqi, 17.55px);
  line-height: 1.15;
  white-space: normal;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}
.lc-switch {
  box-sizing: border-box;
  padding: 0 2px;
  border-radius: 999px;
  border: 1px solid rgba(255,255,255,0.16);
  background: rgba(255,255,255,0.13);
  display: grid;
  align-items: center;
  transition: background 180ms ease, border-color 180ms ease;
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(14.82px, 1.04cqi, 24.7px);
}
.lc-knob {
  border-radius: 50%;
  background: rgba(255,255,255,0.92);
  transform: translateX(0);
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: clamp(10.92px, 0.77cqi, 18.2px);
  height: clamp(10.92px, 0.77cqi, 18.2px);
}
.light-cell.is-on .lc-knob {
  transform: translateX(12px);
}
.lights-card {
  grid-template-rows: auto minmax(0, 1fr);
  display: flex;
  flex-direction: column;
  gap: 0;
  min-height: 0;
  overflow: hidden;
  padding: 0;
}
.lights-body {
  flex: 1 1 auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: 0fr;
  gap: 0;
  transition: grid-template-rows 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  justify-items: stretch;
}
.lights-body-clip, .lights-scroll, .light-section, .light-grid {
  width: 100%;
  box-sizing: border-box;
}
.light-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  width: calc(100% - clamp(15.6px, 1.1cqi, 26px));
  margin-inline: 10px;
  gap: clamp(3.12px, 0.22cqi, 5.2px);
}
.light-cell.has-rule-top {
  border-top: 1px solid rgba(255,255,255,0.075);
  border-top-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
}
.light-cell.has-rule-left {
  border-left: 1px solid rgba(255,255,255,0.075);
  border-left-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
}
@media (max-width: 1180px) {
:host {
  height: auto;
  min-height: 100vh;
  overflow: visible;
}
.room-subview {
  height: auto;
  min-height: 100vh;
  overflow: auto;
  grid-template-columns: 1fr;
  grid-template-rows: auto auto;
  grid-template-areas: "left" "right";
  padding: clamp(7.8px, 0.55cqi, 13px);
}
.room-sidebar {
  display: none;
}
.subview-topbar, .subview-footer {
  display: none;
}
.left-column {
  height: auto;
  grid-template-rows: minmax(clamp(265.2px, 18.68cqi, 442px), 42vh) minmax(clamp(210.6px, 14.84cqi, 351px), 34vh);
}
.right-column {
  height: auto;
  grid-template-rows: auto auto;
}
.right-control-grid {
  grid-template-columns: minmax(0, 1fr) minmax(clamp(218.4px, 15.38cqi, 364px), 0.72fr);
  grid-template-rows: minmax(clamp(184.08px, 12.97cqi, 306.8px), auto) minmax(clamp(234px, 16.48cqi, 390px), auto);
  grid-template-areas: "lights ac" "media ac";
}
.lights-body {
  grid-template-columns: minmax(0, 1fr);
}
.lights-zone-rail {
  display: none;
}
.status-rail {
  grid-template-columns: repeat(5, minmax(0, 1fr));
  min-height: clamp(53.04px, 3.74cqi, 88.4px);
}
}
@media (max-width: 760px) {
.room-subview {
  grid-template-rows: auto;
  grid-template-columns: 1fr;
  grid-template-areas: "left" "right";
  padding: clamp(6.24px, 0.44cqi, 10.4px);
}
.left-column {
  grid-template-rows: minmax(clamp(335.4px, 23.63cqi, 559px), auto) minmax(clamp(304.2px, 21.43cqi, 507px), auto);
}
.right-control-grid {
  grid-template-columns: 1fr;
  grid-template-rows: auto auto auto;
  grid-template-areas: "lights" "media" "ac";
}
.status-rail {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  min-height: auto;
}
.status-item {
  min-height: clamp(45.24px, 3.19cqi, 75.4px);
}
.media-tabs {
  max-width: 100%;
  width: 100%;
  justify-content: space-between;
}
.media-hub-head {
  display: grid;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.media-hub-body {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(clamp(137.28px, 9.67cqi, 228.8px), auto) auto;
  grid-template-areas: "visual" "content";
}
.media-hub-content {
  grid-template-rows: auto auto auto;
}
.camera-list {
  grid-template-columns: 1fr;
}
.lights-title-row, .module-head {
  flex-wrap: wrap;
}
.head-actions {
  width: 100%;
}
.head-actions .chip-button {
  flex: 1 1 0;
}
.curtain-control-row {
  align-items: stretch;
  grid-template-columns: 1fr;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
.curtain-status {
  justify-self: start;
}
.curtain-main-actions {
  justify-content: stretch;
}
.curtain-action-button {
  flex: 1 1 0;
  min-width: 0;
}
.ac-visual {
  min-height: clamp(185.64px, 13.08cqi, 309.4px);
}
}
@media (max-width: 800px) {
:host {
  height: auto;
  min-height: 0;
  overflow: visible;
}
}
$ {
  globalThis.BrunoSurfaceMaterial?.subviewStyles?.() || '';
}
`, xi = _`
:host([data-appliances]) .appliances-card {
  grid-area: appliances;
  min-width: 0;
  min-height: 0;
  padding: clamp(10.92px, 0.77cqi, 18.2px);
  display: grid;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
  overflow: hidden;
}
:host([data-appliances]) .appliances-head {
  min-height: clamp(29.64px, 2.09cqi, 49.4px);
  margin-bottom: 0;
}
:host([data-appliances]) .appliances-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-appliances]) .appliance-tile {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: clamp(9.36px, 0.66cqi, 15.6px) clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
  border-radius: var(--room-radius-small);
  background: rgba(255,255,255,0.045);
  border: 1px solid rgba(255,255,255,0.085);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.055);
  overflow: hidden;
}
:host([data-appliances]) .appliance-tile.is-on {
  border-color: rgba(255,196,90,0.30);
  background: linear-gradient(180deg, rgba(255,196,90,0.10), rgba(255,255,255,0.040));
}
:host([data-appliances]) .appliance-tile.is-muted {
  color: rgba(255,255,255,0.74);
}
:host([data-appliances]) .appliance-more {
  position: absolute;
  top: clamp(5.46px, 0.38cqi, 9.1px);
  right: clamp(5.46px, 0.38cqi, 9.1px);
  z-index: 3;
}
:host([data-appliances]) .appliance-more:disabled {
  opacity: 0.28;
  cursor: default;
}
:host([data-appliances]) .appliance-visual {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  place-items: center;
  padding: clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px) 2px;
}
:host([data-appliances]) .appliance-visual img {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
  filter: drop-shadow(0 14px 22px rgba(0,0,0,0.42));
}
:host([data-appliances]) .appliance-visual bruno-icon {
  --mdc-icon-size: 44px;
  color: rgba(255,255,255,0.24);
}
:host([data-appliances]) .appliance-visual img + bruno-icon {
  display: none;
}
:host([data-appliances]) .appliance-visual.is-image-missing img {
  display: none;
}
:host([data-appliances]) .appliance-visual.is-image-missing bruno-icon {
  display: block;
}
:host([data-appliances]) .appliance-copy {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}
:host([data-appliances]) .appliance-copy strong {
  min-width: 0;
  font-size: clamp(10.92px, 0.77cqi, 18.2px);
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-appliances]) .appliance-copy small {
  min-width: 0;
  font-size: clamp(8.58px, 0.6cqi, 14.3px);
  line-height: 1.05;
  font-weight: 700;
  color: rgba(255,255,255,0.52);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-appliances]) .appliance-tile.is-on .appliance-copy small {
  color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
`, vi = _`
@media (max-width: 800px) {
:host([data-tvhub]) .content-left, :host([data-tvhub]) .right-column, :host([data-tvhub]) .cams-media-row {
  display: contents;
}
:host([data-tvhub]) .subview-topband {
  order: 0;
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
}
:host([data-tvhub]) .topband-badges {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: visible;
}
:host([data-tvhub]) .topband-badges .tb-badge[data-phone-hide], :host([data-tvhub]) .topband-clock {
  display: none;
}
:host([data-tvhub]) .tb-badge {
  min-width: 0;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr);
  column-gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
}
:host([data-tvhub]) .tb-badge-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
}
:host([data-tvhub]) .tb-badge-sub {
  max-width: 100%;
}
:host([data-tvhub]) .hero-panel {
  order: 10;
  height: auto;
  min-height: 0;
}
:host([data-tvhub]) .hero-panel.is-unconfigured {
  display: none;
}
:host([data-tvhub]) .hero-atmosphere, :host([data-tvhub]) .hero-atmosphere .hero-content {
  height: auto;
  min-height: 0;
}
:host([data-tvhub]) .curtain-control-row {
  grid-template-columns: minmax(0, 1fr);
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-tvhub]) .curtain-status {
  justify-self: start;
}
:host([data-tvhub]) .curtain-main-actions {
  width: 100%;
  justify-content: stretch;
}
:host([data-tvhub]) .curtain-action-button {
  flex: 1 1 0;
  min-width: 0;
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .lights-card {
  order: 20;
  height: auto;
  min-height: 0;
  overflow: visible;
}
:host([data-tvhub]) .lights-card .module-head {
  min-height: 0;
  flex-wrap: wrap;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-tvhub]) .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-tvhub]) .head-actions .chip-button, :host([data-tvhub]) .zone-header {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .lights-zones, :host([data-tvhub]) .zone-lights, :host([data-tvhub]) .office-light-list {
  flex: 0 0 auto;
  max-height: none !important;
  overflow-y: visible !important;
  overscroll-behavior: auto;
}
:host([data-tvhub]) .ac-card.ac-card-lean {
  order: 30;
  height: auto;
  min-height: clamp(280.8px, 19.78cqi, 468px);
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(clamp(171.6px, 12.09cqi, 286px), auto) auto;
  overflow: visible;
}
:host([data-tvhub]) .ac-lean-foot {
  align-items: stretch;
}
:host([data-tvhub]) .ac-action {
  min-height: clamp(40.56px, 2.86cqi, 67.6px);
}
:host([data-tvhub]) .media-hub-card.mh-accordion {
  order: 40;
  height: auto;
  min-height: clamp(257.4px, 18.13cqi, 429px);
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) minmax(clamp(216.84px, 15.27cqi, 361.4px), 1fr);
}
:host([data-tvhub]) .media-hub-card.is-unconfigured {
  display: none;
}
:host([data-tvhub]) .mh-source {
  flex-basis: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-source-head {
  flex-basis: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-source-body {
  grid-template-columns: minmax(0, 1fr) clamp(clamp(81.12px, 5.71cqi, 135.2px), 30vw, clamp(115.44px, 8.13cqi, 192.4px));
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding-inline: 12px;
}
:host([data-tvhub]) .mh-info {
  padding-left: 0;
}
:host([data-tvhub]) .mh-controls > .mh-btn.is-main {
  width: 100%;
  min-width: 0;
}
:host([data-tvhub]) .mh-menu, :host([data-tvhub]) .mh-btn {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .mh-menu {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .cameras-card.cameras-card-controls {
  order: 50;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px));
}
:host([data-tvhub]) .camera-pip-stage, :host([data-tvhub]) .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-tvhub]) .camera-control {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-tvhub]) .subview-footer {
  display: none;
}
}
`, _i = _`
@media (max-width: 800px) {
:host([data-ps5]) .camera-pip-feed {
  right: clamp(12.48px, 0.88cqi, 20.8px);
  bottom: clamp(12.48px, 0.88cqi, 20.8px);
  width: clamp(clamp(68.64px, 4.84cqi, 114.4px), 25%, clamp(87.36px, 6.15cqi, 145.6px));
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-ps5]) .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(54.6px, 3.85cqi, 91px);
}
}
`;
_`

`;
const wi = _`
:host([data-room='sala']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='sala']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='sala']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='sala']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='sala']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='sala']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='sala']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='sala']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='sala']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='sala']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='sala']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, yi = _`
:host([data-room='office']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='office']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='office']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='office']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='office']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='office']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='office']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='office']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='office']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
:host([data-room='office']) .mh-btn-row-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
:host([data-room='office']) .office-light-list {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  min-height: 0;
  padding: 0 2px 0 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='office']) .office-light-list::-webkit-scrollbar {
  width: 0;
}
:host([data-room='office']) .office-pc-actions .mh-btn {
  min-width: 0;
}
@media (max-width: 800px) {
:host([data-room='office']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, qi = _`
:host([data-room='cozinha']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-sala-marquee 10s linear infinite;
}
@keyframes bruno-sala-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='cozinha']) .room-subview .content-left {
  grid-template-rows: minmax(0, 1fr);
}
:host([data-room='cozinha']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(7px - var(--room-gap, 10px));
}
:host([data-room='cozinha']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='cozinha']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
}
:host([data-room='cozinha']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='cozinha']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='cozinha']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='cozinha']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
:host([data-room='cozinha']) .mh-btn-row-5 {
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
:host([data-room='cozinha']) .office-light-list {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  min-height: 0;
  padding: 0 2px 0 0;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='cozinha']) .office-light-list::-webkit-scrollbar {
  width: 0;
}
:host([data-room='cozinha']) .office-pc-actions .mh-btn {
  min-width: 0;
}
:host([data-room='cozinha']) .room-subview {
  width: 100%;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 0.81fr) minmax(0, 0.81fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr) var(--ac-h, 320px);
  grid-template-areas: "topband topband topband" "hero hero right" "cams appliances appliances";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
  overflow: hidden;
}
:host([data-room='cozinha']) .room-subview .subview-topband {
  grid-area: topband;
}
:host([data-room='cozinha']) .room-subview .hero-panel {
  grid-area: hero;
  min-width: 0;
  min-height: 0;
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .right-column {
  grid-area: right;
  min-width: 0;
  min-height: 0;
  height: 100%;
  display: grid;
  grid-template-rows: max-content;
  align-content: start;
}
:host([data-room='cozinha']) .room-subview .lights-card {
  width: 100%;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .cameras-card {
  grid-area: cams;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .appliances-card {
  grid-area: appliances;
  min-width: 0;
  min-height: 0;
}
:host([data-room='cozinha']) .room-subview .subview-footer {
  grid-area: bottomband;
}
:host([data-room='cozinha']) .room-subview .hero-atmosphere, :host([data-room='cozinha']) .room-subview .hero-atmosphere .hero-content {
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .hero-atmosphere .hero-content {
  display: block;
  padding: 0;
}
:host([data-room='cozinha']) .room-subview .curtain-dock {
  display: none !important;
}
:host([data-room='cozinha']) .room-subview .appliance-tile {
  display: block;
}
:host([data-room='cozinha']) .room-subview .appliance-main {
  width: 100%;
  height: 100%;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: clamp(6.24px, 0.44cqi, 10.4px);
  padding: 0;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;
}
:host([data-room='cozinha']) .room-subview .appliance-main:disabled {
  cursor: default;
}
:host([data-room='cozinha']) .room-subview .appliance-main:focus-visible {
  outline: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.58);
  outline-offset: -4px;
  border-radius: calc(var(--room-radius-small) - 3px);
}
:host([data-room='cozinha']) .room-subview .appliance-tile.is-airfryer .appliance-visual img {
  transform: scale(0.92);
}
@media (max-width: 800px) {
:host([data-room='cozinha']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .right-column {
  display: contents;
}
:host([data-room='cozinha']) .room-subview .subview-topband {
  order: 0;
  width: 100%;
  height: auto;
  min-height: 0;
  display: block;
}
:host([data-room='cozinha']) .room-subview .topband-badges {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .topband-badges .tb-badge[data-phone-hide], :host([data-room='cozinha']) .room-subview .topband-clock {
  display: none;
}
:host([data-room='cozinha']) .room-subview .tb-badge {
  min-width: 0;
  height: clamp(34.32px, 2.42cqi, 57.2px);
  grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr);
  column-gap: clamp(4.68px, 0.33cqi, 7.8px);
  padding: 0 clamp(6.24px, 0.44cqi, 10.4px);
}
:host([data-room='cozinha']) .room-subview .tb-badge-icon {
  width: clamp(15.6px, 1.1cqi, 26px);
  height: clamp(15.6px, 1.1cqi, 26px);
}
:host([data-room='cozinha']) .room-subview .tb-badge-sub {
  max-width: 100%;
}
:host([data-room='cozinha']) .room-subview .hero-panel.is-unconfigured {
  display: none;
}
:host([data-room='cozinha']) .room-subview .lights-card {
  order: 20;
  width: 100%;
  height: auto;
  min-height: 0;
  overflow: visible;
}
:host([data-room='cozinha']) .room-subview .lights-card .module-head {
  min-height: 0;
  flex-wrap: wrap;
  gap: clamp(7.8px, 0.55cqi, 13px);
}
:host([data-room='cozinha']) .room-subview .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-room='cozinha']) .room-subview .head-actions .chip-button, :host([data-room='cozinha']) .room-subview .zone-header {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .lights-zones, :host([data-room='cozinha']) .room-subview .zone-lights, :host([data-room='cozinha']) .room-subview .office-light-list {
  flex: 0 0 auto;
  max-height: none !important;
  overflow-y: visible !important;
  overscroll-behavior: auto;
}
:host([data-room='cozinha']) .room-subview .appliances-card {
  order: 30;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: auto auto;
  overflow: hidden;
}
:host([data-room='cozinha']) .room-subview .appliances-grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: minmax(clamp(120.12px, 8.46cqi, 200.2px), auto);
  align-items: stretch;
}
:host([data-room='cozinha']) .room-subview .appliance-tile:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}
:host([data-room='cozinha']) .room-subview .appliance-main {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .mh-menu {
  width: clamp(34.32px, 2.42cqi, 57.2px);
  height: clamp(34.32px, 2.42cqi, 57.2px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .cameras-card.cameras-card-controls {
  order: 40;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: clamp(34.32px, 2.42cqi, 57.2px) clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px));
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage, :host([data-room='cozinha']) .room-subview .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .camera-pip-feed {
  right: clamp(12.48px, 0.88cqi, 20.8px);
  bottom: clamp(12.48px, 0.88cqi, 20.8px);
  width: clamp(clamp(68.64px, 4.84cqi, 114.4px), 25%, clamp(87.36px, 6.15cqi, 145.6px));
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: clamp(54.6px, 3.85cqi, 91px);
}
:host([data-room='cozinha']) .room-subview .camera-control {
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
}
:host([data-room='cozinha']) .room-subview .subview-footer {
  display: none;
}
}
`, ki = _`
:host([data-room='casal']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qcasal-marquee 10s linear infinite;
}
@keyframes bruno-qcasal-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='casal']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='casal']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='casal']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 2px 0 0;
}
:host([data-room='casal']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='casal']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='casal']) .light-row {
  display: grid;
  grid-template-columns: clamp(24.96px, 1.76cqi, 41.6px) clamp(87.36px, 6.15cqi, 145.6px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: clamp(3.9px, 0.27cqi, 6.5px) clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='casal']) .light-row-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='casal']) .light-row-name {
  min-width: 0;
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='casal']) .light-bar {
  height: clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='casal']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, zi = _`
:host([data-room='marina']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qmarina-marquee 10s linear infinite;
}
@keyframes bruno-qmarina-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='marina']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='marina']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='marina']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='marina']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='marina']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='marina']) .light-row {
  display: grid;
  grid-template-columns: clamp(29.64px, 2.09cqi, 49.4px) clamp(93.6px, 6.59cqi, 156px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(9.36px, 0.66cqi, 15.6px);
  padding: clamp(6.24px, 0.44cqi, 10.4px) clamp(7.8px, 0.55cqi, 13px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='marina']) .light-row-icon {
  width: clamp(28.08px, 1.98cqi, 46.8px);
  height: clamp(28.08px, 1.98cqi, 46.8px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='marina']) .light-row-name {
  min-width: 0;
  font-size: clamp(10.14px, 0.71cqi, 16.9px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='marina']) .light-bar {
  height: clamp(8.58px, 0.6cqi, 14.3px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='marina']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, $i = _`
:host([data-room='miguel']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: clamp(26.52px, 1.87cqi, 44.2px);
  animation: bruno-qmiguel-marquee 10s linear infinite;
}
@keyframes bruno-qmiguel-marquee {
0%, 18% {
  transform: translateX(0);
}
82%, 100% {
  transform: translateX(calc(-100% + 100px));
}
}
:host([data-room='miguel']) .room-subview {
  width: 100%;
  overflow: hidden;
  --room-gap: 10px;
  display: grid;
  height: 100%;
  min-height: 0;
  grid-template-columns: minmax(0, 1.62fr) minmax(clamp(280.8px, 19.78cqi, 468px), 0.66fr);
  grid-template-rows: clamp(37.44px, 2.64cqi, 62.4px) minmax(0, 1fr);
  grid-template-areas: "topband topband" "content right";
  align-items: stretch;
  gap: var(--room-gap);
  padding: 0;
  background: transparent;
}
:host([data-room='miguel']) .right-column {
  grid-area: right;
  position: relative;
  display: grid;
  grid-template-rows: auto var(--ac-h, 290px);
  align-content: space-between;
  --lights-dock-bottom: calc(var(--ac-h, 320px) + 7px);
}
:host([data-room='miguel']) .lights-zones {
  flex: 1 1 auto;
  display: flex;
  flex-direction: column;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: 0;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 0 2px 0 0;
}
:host([data-room='miguel']) .zone-lights {
  --zl-tile-h: 92px;
  --zl-gap: 12px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  grid-auto-rows: var(--zl-tile-h);
  gap: var(--zl-gap);
  padding: 0 clamp(4.68px, 0.33cqi, 7.8px) clamp(4.68px, 0.33cqi, 7.8px);
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='miguel']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='miguel']) .light-row {
  display: grid;
  grid-template-columns: clamp(24.96px, 1.76cqi, 41.6px) clamp(87.36px, 6.15cqi, 145.6px) minmax(0, 1fr);
  align-items: center;
  gap: clamp(7.8px, 0.55cqi, 13px);
  min-height: clamp(34.32px, 2.42cqi, 57.2px);
  padding: clamp(3.9px, 0.27cqi, 6.5px) clamp(6.24px, 0.44cqi, 10.4px);
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='miguel']) .light-row-icon {
  width: clamp(24.96px, 1.76cqi, 41.6px);
  height: clamp(24.96px, 1.76cqi, 41.6px);
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='miguel']) .light-row-name {
  min-width: 0;
  font-size: clamp(9.75px, 0.69cqi, 16.25px);
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='miguel']) .light-bar {
  height: clamp(7.02px, 0.49cqi, 11.7px);
  border-radius: 999px;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.09);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.25);
  pointer-events: none;
  transition: background 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}
@media (max-width: 800px) {
:host([data-room='miguel']) .room-subview {
  width: 100%;
  height: auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: clamp(7.8px, 0.55cqi, 13px);
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, Ai = {
  sala: wi,
  office: yi,
  cozinha: qi,
  casal: ki,
  marina: zi,
  miguel: $i
}, Si = _`
  @media (max-width: 800px) {
    /* ══ 1. A MOLDURA ═══════════════════════════════════════════════════════ */

    :host([data-room]) {
      height: auto;
      /* A folha é ancorada na base da subview; sem esta linha a subview teria
         a altura do conteúdo (671px) e a folha subiria no lugar errado. */
      min-height: 100%;
      overflow: visible;
      /* ANTERIOR (rollback): o WebView podia escolher a subview como âncora ao
         montar uma folha fixed e deslocar Office/Quartos alguns pixels. */
      overflow-anchor: none;
    }

    :host([data-room]) .room-subview {
      overflow-anchor: none;
      /* Reserva acima da folha: o que fica entre o topo e o fim da câmera.
         Medido a 428px; a folha nunca ultrapassa este limite, então a câmera
         é preservada por construção e não por sorte de aritmética. */
      /* ── A CÂMERA É O ELEMENTO DOMINANTE (itens 3 e 23) ───────────────────
         ANTERIOR (rollback rev. faixa-de-tiles): --fone-reserva: 372px e palco
         em 58vw (248px a 428 de largura). Medido a 428x926: a composicao
         terminava em y=654 e sobravam 214px mortos acima do dock — um quarto da
         tela vazio. Na Cozinha, que nao tem cortina, sobravam 403px.

         Essa tentativa foi substituida depois do aceite no aparelho: o palco
         volta a 16:9 e a area restante e espaco negativo intencional. A camera
         permanece a ancora visual sem virar um bloco quase quadrado.

         O teto da folha nao segue mais o palco: com palco variavel isso o
         tornaria variavel tambem. Ele passa a garantir uma FAIXA DE CAMERA
         sempre visivel — que e exatamente o que o item 3 pede ("a parte
         superior da camera devera continuar visivel") e o item 9 reforca
         ("a camera deve continuar reconhecivel"). 98px e o topo do palco
         (10 do slot + 44 da barra + 10 de respiro + 34 do cabecalho). */
      --fone-camera-cab: clamp(34.32px, 2.42cqi, 57.2px);
      --fone-camera-min: 200px;
      /* O teto quase nunca morde: o palco cresce apenas ate ocupar a sobra, e
         em cinco comodos a faixa ja consome tudo. Ele existe para a Cozinha,
         que nao tem cortina — com 62dvh sobravam 77px mortos ali. Em 72dvh a
         Cozinha fecha tambem, e o teto so voltaria a valer numa tela muito
         alta, onde uma camera sem limite ficaria desproporcional. */
      /* ANTERIOR (rollback pos-device): a camera crescia ate 72dvh e a folha
         reservava 298px. No aparelho isso transformou o palco 16:9 em um bloco
         quase quadrado. A camera volta a ter proporcao propria; esta reserva
         serve apenas para manter uma faixa reconhecivel dela quando a folha
         precisa subir. */
      --fone-camera-max: none;
      --fone-camera-visivel: clamp(160px, 26dvh, 220px);
      --fone-reserva: calc(78px + var(--fone-camera-visivel));
      --fone-gap: 10px;
      --fone-hit-min: 44px;
      --fone-raio: var(--bruno-liquid-card-radius, 20px);
      /* A folha do telefone usa os tokens visuais exatos do VisionOS inclusive
         quando o tema Josh esta ativo. O escopo termina neste media query; os
         materiais globais e o tablet continuam intocados. */
      --fone-folha-vision-background:
        radial-gradient(360px 240px at 18% -10%, rgba(255, 255, 255, 0.105), transparent 64%),
        linear-gradient(
          180deg,
          rgba(255, 255, 255, 0.060),
          rgba(255, 255, 255, 0.018) 48%,
          rgba(0, 0, 0, 0.035)
        ),
        rgba(0, 0, 0, 0.300);
      --fone-folha-vision-filter: blur(20px) saturate(1.18) brightness(1.03);
      /* ANTERIOR (rollback rev. faixa-de-tiles): --fone-fechar-h: 54px;
         Era a altura da barra "Concluir". A barra saiu (item 12 do roteiro:
         fechar deixou de ser etapa de formulario) e o valor passou a ser so o
         respiro inferior da folha. */
      --fone-fechar-h: 18px;

      /* ── A FAIXA DE CONTROLES (rev. faixa-de-tiles) ────────────────────────
         Cortina, Iluminacao, Hub e A/C deixam de ser quatro cards e passam a
         ser um PLANO CONTINUO, na mesma linguagem da faixa de tiles da Home.
         Cortina e launchers usam o mesmo gradiente HORIZONTAL: as vinhetas
         laterais se repetem sem criar emenda vertical entre os dois elementos
         irmaos. Os filetes leem os tokens da faixa da Home. */
      --fone-faixa-scrim:
        radial-gradient(105% 120px at 7% 50%, rgba(132, 88, 52, 0.09), transparent 62%),
        radial-gradient(105% 120px at 93% 50%, rgba(65, 104, 132, 0.075), transparent 62%),
        linear-gradient(
          90deg,
          rgba(8, 11, 17, 0) 0%,
          rgba(8, 11, 17, 0.15) 7%,
          rgba(8, 11, 17, 0.24) 18%,
          rgba(8, 11, 17, 0.24) 82%,
          rgba(8, 11, 17, 0.15) 93%,
          rgba(8, 11, 17, 0) 100%
        );
      --fone-faixa-filete: rgba(255, 255, 255, 0.085);
      --fone-faixa-divisor: linear-gradient(
        90deg,
        rgba(255, 255, 255, 0) 0%,
        rgba(255, 255, 255, 0.055) 9%,
        rgba(255, 255, 255, 0.105) 50%,
        rgba(255, 255, 255, 0.055) 91%,
        rgba(255, 255, 255, 0) 100%
      );
      --fone-faixa-borda: var(
        --bruno-strip-frame-top-line,
        linear-gradient(
          90deg,
          rgba(255, 255, 255, 0) 0%,
          rgba(255, 255, 255, 0.16) 20%,
          rgba(255, 255, 255, 0.34) 50%,
          rgba(255, 255, 255, 0.16) 80%,
          rgba(255, 255, 255, 0) 100%
        )
      );
      /* Blur no elemento inteiro sempre revela uma caixa retangular. O fade
         lateral vem apenas da pintura, que chega a alpha zero sem apagar o
         conteudo ou reduzir a area de toque. */
      --fone-faixa-blur: none;

      position: relative;
      display: flex;
      flex-direction: column;
      align-items: stretch;
      width: 100%;
      height: auto;
      /* ANTERIOR (rollback rev. faixa-de-tiles): min-height: 100%;
         A porcentagem NAO resolvia. A cadeia e host (height:auto) -> main, e
         min-height percentual so resolve contra pai de altura DEFINIDA — entao
         computava como "auto" e o main ficava do tamanho do conteudo. Enquanto
         tudo tinha tamanho fixo isso nao aparecia; ao pedir que a camera
         crescesse para ocupar a sobra, nao havia sobra nenhuma para distribuir
         e ela caiu no piso (medido: 234px, o minimo).
         O valor abaixo e explicito: a altura da tela menos o dock (a shell
         publica --bruno-dock-h, que ela MEDE) menos o padding do slot (10 em
         cima, 6 embaixo). */
      min-height: calc(100dvh - var(--bruno-dock-h, 74px) - 16px);
      /* ANTERIOR (rollback rev. faixa-de-tiles): gap: var(--fone-gap);
         O gap uniforme separava TODOS os modulos, inclusive os que agora
         precisam encostar para formar um plano so. O respiro passa a ser
         declarado por modulo, em margin — ver a secao 2. */
      gap: 0;
      padding: 0;
      background: transparent;
      overflow: visible;
    }

    /* A FAIXA DO TEMA NÃO EXISTE NO TELEFONE.
       O material do Josh desenha a faixa inferior como "main::before" e a
       posiciona pelo GRID (grid-row: 2 / -1), atrás da linha de tiles. Aqui o
       main é FLEX — grid-row não significa nada e o pseudo-elemento vira o
       PRIMEIRO item do flex, com os 320px de --ac-h. Foi exatamente isso que
       empurrou a barra de status de 10px para 340px no aparelho.
       O "::after" acompanha por precaução: a composição do telefone não tem
       faixa nenhuma para desenhar. */
    :host([data-room]) .room-subview::before,
    :host([data-room]) .room-subview::after {
      content: none;
      display: none;
    }

    /* Os containers do tablet somem do FLUXO, não da tela: "contents" faz os
       filhos virarem itens diretos do flex, que é onde "order" atua. Era esta
       declaração que faltava para ".right-column" no bloco "[data-tvhub]", e
       por isso as luzes e o A/C subiam para o topo na Sala. */
    :host([data-room]) .room-subview .content-left,
    :host([data-room]) .room-subview .cams-media-row,
    :host([data-room]) .room-subview .right-column,
    :host([data-room]) .room-subview .hero-panel,
    :host([data-room]) .room-subview .hero-stage,
    :host([data-room]) .room-subview .hero-content {
      display: contents;
    }

    /* A foto do cômodo não existe no telefone: quem manda é a câmera ao vivo.
       "contents" acima já apaga a foto (o elemento deixa de gerar caixa, e com
       ela o background) e preserva a cortina, que morava dentro. */
    :host([data-room]) .room-subview .hero-panel.is-unconfigured,
    :host([data-room]) .room-subview .subview-footer,
    :host([data-room]) .room-subview .subview-topbar,
    :host([data-room]) .room-subview .room-sidebar,
    :host([data-room]) .room-subview .lights-zone-rail {
      display: none;
    }

    /* ══ 2. ORDEM ═══════════════════════════════════════════════════════════ */

    :host([data-room]) .room-subview .subview-topband { order: 0; }
    :host([data-room]) .room-subview .curtain-dock    { order: 20; }
    :host([data-room]) .room-subview .resumo-telefone { order: 30; }

    /* O respiro que o gap dava, agora declarado onde ele deve existir: DEPOIS
       da barra de status e DEPOIS da camera. Entre a cortina e as linhas nao
       ha respiro nenhum — e ali que a faixa continua se forma. */
    :host([data-room]) .room-subview .subview-topband { margin-bottom: var(--fone-gap); }
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      margin-bottom: var(--fone-gap);
    }

    /* A câmera precisa da classe composta: a sobreposição da Cozinha escreve
       ".cameras-card.cameras-card-controls" com order 40, e (0,5,0) venceria os
       (0,4,0) daqui — foi o que colocou o resumo antes da câmera na primeira
       medição. Com a mesma composta, empata em especificidade e vence por
       posição, como todo o resto deste arquivo. */
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      order: 10;
    }

    /* ══ 3. BARRA DE STATUS ═════════════════════════════════════════════════ */
    /* Rolagem horizontal real, no mesmo padrão do bruno-top-badges-card da
       Home. As badges que o bloco antigo escondia (Presença, Roteador, Zigbee)
       voltam: agora são alcançáveis arrastando. */

    :host([data-room]) .room-subview .subview-topband {
      width: 100%;
      height: auto;
      min-height: 0;
      display: block;
    }
    :host([data-room]) .room-subview .topband-badges {
      width: 100%;
      max-width: 100%;
      display: flex;
      align-items: center;
      /* ANTERIOR (rollback rev. faixa-de-tiles): gap: 6px;
         Com gap, o filete divisor de cada badge (border-left, herdado do
         tablet) descolava do conteudo e a barra lia como uma fileira de
         cartoezinhos. Em zero, as badges encostam e os filetes viram o
         divisor vertical de um plano continuo — que e o que o item 2 do
         roteiro pede e o que a barra do tablet ja faz. */
      gap: 0;
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -webkit-overflow-scrolling: touch;
      overscroll-behavior-x: contain;
      touch-action: pan-x;
      padding: 0 1px 2px;
    }
    :host([data-room]) .room-subview .topband-badges::-webkit-scrollbar {
      display: none;
    }
    :host([data-room]) .room-subview .tb-badge,
    :host([data-room]) .room-subview .tb-badge[data-phone-hide] {
      /* NOVO (2026-08-13) — quatro tiles completos por pagina, como na Home.
         ANTERIOR (rollback): flex: 0 0 auto; e padding horizontal de 9.36px.
         A largura por conteudo exibia parte do quinto status. Cada tile passa
         a ocupar exatamente um quarto da faixa; os demais seguem acessiveis
         pelo mesmo scroll horizontal. Restrito ao breakpoint phone. */
      flex: 0 0 25%;
      width: 25%;
      max-width: 25%;
      box-sizing: border-box;
      min-width: 0;
      height: clamp(34.32px, 2.42cqi, 57.2px);
      display: grid;
      grid-template-columns: clamp(15.6px, 1.1cqi, 26px) minmax(0, 1fr);
      column-gap: clamp(4px, 1.2vw, 6px);
      padding: 0 clamp(6px, 1.8vw, 9px);
      touch-action: pan-x;
    }
    :host([data-room]) .room-subview .tb-badge-icon {
      width: clamp(15.6px, 1.1cqi, 26px);
      height: clamp(15.6px, 1.1cqi, 26px);
    }
    :host([data-room]) .room-subview .tb-badge-sub { max-width: 100%; }
    :host([data-room]) .room-subview .topband-clock { display: none; }

    /* ══ 4. CÂMERA ══════════════════════════════════════════════════════════ */
    /* Mesmos valores do bloco [data-tvhub], que já estavam calibrados — muda
       só a ordem e o fato de valerem nos SEIS cômodos. */

    /* ANTERIOR (rollback rev. faixa-de-tiles): o palco era
         clamp(clamp(171.6px, 12.09cqi, 286px), 58vw, clamp(280.8px, 19.78cqi, 468px))
       — 248px a 428 de largura, sem flex. A camera ocupava 30% da tela.

       "flex: 1 0 auto" e deliberado: cresce para tomar a sobra, mas NAO encolhe.
       Com shrink ligado, um comodo de faixa alta espremeria justamente o
       elemento que o item 3 manda preservar; sem shrink, quem cede e a rolagem
       do proprio conteudo, que ja existe. */
    :host([data-room]) .room-subview .cameras-card,
    :host([data-room]) .room-subview .cameras-card.cameras-card-controls {
      --fone-camera-card-gap: clamp(10px, 2.8cqi, 14px);
      --fone-camera-pip-inset: clamp(8px, 2.4cqi, 12px);
      width: 100%;
      height: auto;
      min-height: 0;
      /* ANTERIOR (rollback pos-device): flex: 1 0 auto distribuia toda a
         sobra vertical para a camera e a deixava quase quadrada. */
      flex: 0 0 auto;
      max-height: none;
      grid-template-rows: auto auto;
      /* ANTERIOR (rollback pos-device): z-index 8 so era aplicado com a folha
         aberta. A troca de camada alterava a composicao aparente do topo da
         camera no WebView. A camada agora e estavel nos dois estados. */
      position: relative;
      z-index: 8;
      isolation: isolate;
    }
    /* No tablet o material Josh usa a cartela compartilhada de main::before.
       Esse plano e deliberadamente desligado no telefone; portanto a camera
       recupera a propria cartela SOMENTE aqui. A especificidade e os
       !important vencem a folha de material injetada depois deste CSS. */
    :host([data-bruno-subview-surface-theme='josh'][data-room])
      .room-subview .glass-card.cameras-card.cameras-card-controls {
      background: var(--bruno-josh-subview-surface-background,
        var(--bruno-liquid-surface-off-background, rgba(22, 18, 16, 0.42))) !important;
      backdrop-filter: var(--bruno-josh-subview-surface-filter,
        blur(20px) saturate(1.08)) !important;
      -webkit-backdrop-filter: var(--bruno-josh-subview-surface-filter,
        blur(20px) saturate(1.08)) !important;
      border: var(--bruno-josh-subview-surface-border,
        var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13))) !important;
      border-radius: var(--bruno-liquid-card-radius, 20px) !important;
      box-shadow: var(--bruno-josh-subview-surface-shadow,
        var(--bruno-liquid-surface-off-shadow, 0 14px 32px rgba(0,0,0,0.24))) !important;
      overflow: hidden;
    }
    :host([data-room]) .room-subview .cameras-head {
      position: relative;
      z-index: 2;
      /* O material Josh e injetado depois e fixa o cabecalho em 34px. Estes
         importantes sao locais ao breakpoint e preservam a zona segura entre
         a borda superior do card e icone/titulo quando a folha esta aberta. */
      height: auto !important;
      min-height: 44px !important;
      padding: 8px 12px 6px !important;
      box-sizing: border-box;
    }
    /* O ":not(.camera-pip-feed)" é obrigatório: o PIP da Varanda carrega
       "camera-feed camera-pip-feed". Sem a exclusão, o "height: 100%" daqui
       (0,4,0) vencia o tamanho do PIP (0,1,0) e ele virava uma tira estreita
       da altura inteira do palco — foi o "PIP com muita altura" do aparelho. */
    :host([data-room]) .room-subview .camera-pip-stage {
      min-height: 0;
      height: auto;
      /* O feed conserva 16:9; o palco acrescenta o respiro inferior. Assim o
      frame cresce alguns pixels sem reduzir a imagem. */
      aspect-ratio: auto;
      padding: 0 var(--fone-camera-card-gap) var(--fone-camera-card-gap);
    }
    :host([data-room]) .room-subview .camera-feed:not(.camera-pip-feed) {
      min-height: 0;
      height: auto;
      aspect-ratio: 16 / 9;
    }
    /* Miniatura com proporção de câmera, ancorada no canto. */
    :host([data-room]) .room-subview .camera-pip-feed {
      width: min(34%, 124px);
      height: auto;
      /* ANTERIOR (rollback pos-device): 4 / 3. No aparelho a miniatura ficou
         visualmente quadrada; 3 / 2 reduz apenas a altura, sem perder largura. */
      aspect-ratio: 3 / 2;
      right: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
      bottom: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
    }
    /* Sala e Cozinha sao as composicoes com PIP. Esta regra vence as
       sobreposicoes legadas sem tocar no breakpoint de tablet. */
    :host([data-room='sala']) .room-subview .camera-pip-feed,
    :host([data-room='cozinha']) .room-subview .camera-pip-feed {
      right: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
      bottom: calc(var(--fone-camera-card-gap) + var(--fone-camera-pip-inset));
    }
    :host([data-room]) .room-subview .camera-control {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    :host([data-room]) .room-subview .camera-list { grid-template-columns: 1fr; }

    /* ══ 5. CORTINA ═════════════════════════════════════════════════════════ */
    /* Era um overlay sobre a foto — ".curtain-overlay" zera fundo e borda com
       !important, então recuperá-los aqui também exige !important. É o único
       lugar deste arquivo que precisa disso, e o motivo está registrado.

       rev. faixa-de-tiles: a cortina deixou de ser CARD e virou o primeiro
       trecho da faixa continua. Ela mantem todos os controles diretos (titulo,
       estado, percentual, Abrir/Parar/Fechar, slider e marcacoes) — o que saiu
       foi a moldura externa: raio, borda e sombra.

       ANTERIOR (rollback rev. faixa-de-tiles) — a versao em card:
         border-radius: var(--fone-raio) !important;
         background: var(--bruno-liquid-surface-off-background,
                          rgba(255,255,255,0.062)) !important;
         border: var(--bruno-liquid-surface-off-border,
                     1px solid rgba(255,255,255,0.105)) !important;
         box-shadow: var(--bruno-liquid-surface-off-shadow, none) !important;
         backdrop-filter: var(--bruno-liquid-surface-off-filter, none) !important;
         .curtain-control-row -> grid-template-columns: minmax(0, 1fr)
                                 (identidade, estado e botoes em tres linhas)
         .curtain-status       -> justify-self: start                            */

    :host([data-room]) .room-subview .curtain-dock {
      grid-row: auto;
      grid-column: auto;
      align-self: stretch;
      width: 100% !important;
      max-width: 100% !important;
      display: grid;
      grid-template-columns: 1fr;
      gap: clamp(9px, 0.63cqi, 15px);
      padding: 14px clamp(10.92px, 0.77cqi, 18.2px) 16px !important;
      /* O plano: sem raio, sem borda, sem sombra. So o scrim e o filete que
         abre a faixa. */
      border-radius: 0 !important;
      background: var(--fone-faixa-scrim) !important;
      border: 0 !important;
      box-shadow: none !important;
      backdrop-filter: var(--fone-faixa-blur) !important;
      -webkit-backdrop-filter: var(--fone-faixa-blur) !important;
      position: relative;
    }
    /* Filete SUPERIOR da faixa. Pseudo-elemento, e nao border-top, porque o
       token do tema e um gradiente horizontal (some nas pontas) e border nao
       aceita gradiente. */
    :host([data-room]) .room-subview .curtain-dock::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: var(--fone-faixa-borda);
      pointer-events: none;
    }

    /* Linha 1: titulo a esquerda, estado a direita. Linha 2: os tres botoes,
       ocupando a largura toda. O slider fica fora desta grade, na linha 3 do
       proprio dock. E o desenho do item 5 do roteiro. */
    :host([data-room]) .room-subview .curtain-control-row {
      align-items: center;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 10px clamp(7.8px, 0.55cqi, 13px);
    }
    :host([data-room]) .room-subview .curtain-status {
      justify-self: end;
      grid-column: 2;
      grid-row: 1;
    }
    :host([data-room]) .room-subview .curtain-main-actions {
      grid-column: 1 / -1;
      width: 100%;
      justify-content: stretch;
    }
    :host([data-room]) .room-subview .curtain-action-button {
      flex: 1 1 0;
      min-width: 0;
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }
    /* Iconografia fina: o anel do icone da cortina era mais uma moldura dentro
       da faixa. Vira glifo. */
    :host([data-room]) .room-subview .curtain-icon-shell {
      width: 22px;
      height: 22px;
      background: none;
      border: 0;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      color: rgba(255, 255, 255, 0.62);
    }

    /* ══ 6. LINHAS-RESUMO ═══════════════════════════════════════════════════ */

    /* ANTERIOR (rollback rev. faixa-de-tiles) — cada linha era um CARD:
         .resumo-telefone -> gap: var(--fone-gap)
         .resumo-linha    -> border-radius: var(--fone-raio);
                             background: --bruno-liquid-surface-off-background;
                             border: --bruno-liquid-surface-off-border;
                             box-shadow / backdrop-filter do mesmo pacote.
       Agora sao trechos do mesmo plano da cortina: fundo unico, sem raio, sem
       borda; o que separa um modulo do outro e um filete horizontal. */
    :host([data-room]) .room-subview .resumo-telefone {
      display: flex;
      flex-direction: column;
      gap: 0;
      width: 100%;
      position: relative;
      background: var(--fone-faixa-scrim);
      backdrop-filter: var(--fone-faixa-blur);
      -webkit-backdrop-filter: var(--fone-faixa-blur);
    }
    /* Filete INFERIOR: fecha a faixa. Mesmo motivo do ::before da cortina. */
    :host([data-room]) .room-subview .resumo-telefone::after {
      content: '';
      position: absolute;
      inset: auto 0 0 0;
      height: 1px;
      background: var(--fone-faixa-borda);
      pointer-events: none;
    }
    :host([data-room]) .room-subview .resumo-linha {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) auto;
      align-items: center;
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      width: 100%;
      min-height: 58px;
      padding: 0 clamp(10.92px, 0.77cqi, 18.2px);
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      color: var(--text-main, rgba(248, 251, 255, 0.94));
      font: inherit;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
      transition: background 150ms ease;
      position: relative;
    }
    /* Divisor atmosferico: desaparece nas extremidades em vez de recortar a
       faixa com uma linha rigida. A primeira linha separa a cortina dos
       launchers; as demais mantem o mesmo ritmo vertical. */
    :host([data-room]) .room-subview .resumo-linha::before {
      content: '';
      position: absolute;
      inset: 0 0 auto 0;
      height: 1px;
      background: var(--fone-faixa-divisor);
      pointer-events: none;
    }
    /* Feedback de toque curto (item 7 do roteiro: 120-180ms), com o acento do
       proprio modulo — a cor vem do --tone que o tom do icone ja carrega. */
    :host([data-room]) .room-subview .resumo-linha:active {
      background: rgba(255, 255, 255, 0.06);
      transition-duration: 120ms;
    }
    :host([data-room]) .room-subview .resumo-linha:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: -2px;
    }
    /* Iconografia fina: sem anel, so o glifo — igual a cortina. */
    :host([data-room]) .room-subview .resumo-linha .micro-icon {
      width: 24px;
      height: 24px;
      background: none;
      border: 0;
      box-shadow: none;
    }
    :host([data-room]) .room-subview .resumo-linha .micro-icon bruno-icon {
      --mdc-icon-size: 21px;
    }
    :host([data-room]) .room-subview .resumo-texto {
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }
    :host([data-room]) .room-subview .resumo-titulo {
      font-size: 14.8px;
      font-weight: 700;
      line-height: 1.12;
    }
    :host([data-room]) .room-subview .resumo-estado {
      font-size: 12px;
      font-weight: 500;
      line-height: 1.15;
      color: var(--text-soft, rgba(255, 255, 255, 0.52));
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    /* ANTERIOR (rollback rev. faixa-de-tiles): o chevron era "mdi:chevron-up"
       girado 180deg (apontando para baixo) e desgirava quando ativo. Virou o
       chevron DISCRETO apontando para a direita do item 6 do roteiro — ele
       indica "abre um segundo nivel", nao "expande aqui". */
    :host([data-room]) .room-subview .resumo-chevron {
      width: 20px;
      height: 20px;
      display: grid;
      place-items: center;
      color: rgba(255, 255, 255, 0.34);
      transform: none;
      transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1), color 180ms ease;
    }
    :host([data-room]) .room-subview .resumo-chevron bruno-icon {
      --mdc-icon-size: 19px;
    }
    :host([data-room]) .room-subview .resumo-linha.is-active .resumo-chevron {
      transform: rotate(90deg);
      color: rgba(255, 255, 255, 0.62);
    }

    /* ══ 7. A FOLHA ═════════════════════════════════════════════════════════ */
    /* Fora do telefone estes quatro módulos ficam no fluxo, como sempre. Aqui
       eles só existem quando a linha correspondente é tocada. */

    :host([data-room]) .room-subview .glass-card.lights-card,
    :host([data-room]) .room-subview .glass-card.ac-card,
    :host([data-room]) .room-subview .glass-card.media-hub-card,
    :host([data-room]) .room-subview .glass-card.appliances-card {
      display: none;
    }

    /* Cada módulo volta com o display que ELE usa — "flex" para todos quebraria
       o grid interno do A/C e do hub. */
    :host([data-folha='luzes']) .room-subview .glass-card.lights-card { display: flex; }
    :host([data-folha='ac']) .room-subview .glass-card.ac-card { display: grid; }
    :host([data-folha='midia']) .room-subview .glass-card.media-hub-card { display: grid; }
    :host([data-folha='eletro']) .room-subview .glass-card.appliances-card { display: block; }

    /* O ".glass-card" no seletor NÃO é decorativo: é especificidade.
       O material do Josh declara
         :host([data-bruno-subview-surface-theme="josh"]) .glass-card.ac-card
       com position: relative — (0,4,0), o mesmo peso que este bloco tinha, e
       injetado DEPOIS em adoptedStyleSheets. Empate resolvido por posição: o
       material vencia e só a folha de luzes (que não está naquela lista)
       chegava a ser fixed. Medido: A/C, mídia e eletrodomésticos ficavam
       relative e apareciam no meio do fluxo. Com a classe composta são
       (0,5,0). */
    :host([data-folha]) .room-subview .glass-card.lights-card,
    :host([data-folha]) .room-subview .glass-card.ac-card,
    :host([data-folha]) .room-subview .glass-card.media-hub-card,
    :host([data-folha]) .room-subview .glass-card.appliances-card {
      position: fixed;
      left: 0;
      right: 0;
      /* A folha PARA em cima do dock, não por baixo dele.
         No telefone a shell dá z-index 2 ao rail-slot e 1 ao content-slot. A
         folha vive dentro do content-slot, então nenhum z-index daqui a coloca
         sobre o dock — a pilha é decidida um nível acima. Tentar cobrir o dock
         dá o que apareceu no aparelho: as últimas linhas da folha escondidas
         atrás dele. Parando acima, o dock continua aceso e utilizável.
         A altura vem da shell ("--bruno-dock-h"), que é quem a conhece. */
      /* ANTERIOR (rollback antes da rail persistente): a folha subia da borda
         inferior e cobria o dock. A shell elevava o slot de conteudo para isso.
         A decisao atual prioriza rail sempre visivel e controles sem sobreposicao. */
      /* ANTERIOR (rollback rail persistente): bottom: 0. A folha cobria a rail e
         os ultimos controles ficavam na mesma regiao de toque. A rail agora
         permanece visivel, e a folha termina imediatamente acima dela. */
      /* REV. mobile final: a folha pinta ate a borda inferior e passa por tras
         da rail. O padding inferior reserva a area de toque do dock, mantendo
         os controles acima dele sem criar uma segunda superficie. */
      bottom: 0;
      z-index: 9;
      width: auto;
      height: max-content;
      margin: 0;
      /* ANTERIOR (rollback rev. faixa-de-tiles):
           min-height: min(52dvh, 420px);
           border-radius: 26px 26px 0 0;
           padding-top: 22px;
           box-shadow: 0 -28px 56px -18px rgba(0,0,0,0.85);
         O piso equalizava ARTIFICIALMENTE a altura das tres folhas — o item 10
         do roteiro proibe isso: a altura tem de sair do conteudo. O raio de
         26px e a sombra de 56px eram o que fazia a folha ler como card grande
         flutuando por cima, e nao como extensao inferior da subview (item 8).
         Sem o piso, o teto passa a ser o unico limite. */
      min-height: 0;
      max-height: calc(100vh - var(--fone-folha-top, var(--fone-reserva)));
      max-height: calc(100dvh - var(--fone-folha-top, var(--fone-reserva)));
      overflow-y: auto;
      overscroll-behavior: contain;
      border-radius: 18px 18px 0 0;
      padding: 18px clamp(10.92px, 0.77cqi, 18.2px)
        calc(10px + var(--bruno-dock-h, 74px));
      /* ANTERIOR (rollback pos-device): o padding inferior somava novamente
         env(safe-area-inset-bottom). A altura medida do dock ja inclui essa
         area no iPhone, portanto a soma duplicada criava o vazio que nao
         aparecia no navegador de PC. */
      background: var(--fone-folha-vision-background) !important;
      backdrop-filter: var(--fone-folha-vision-filter) !important;
      -webkit-backdrop-filter: var(--fone-folha-vision-filter) !important;
      /* Sombra so o suficiente para descolar da faixa; sem borda e sem glow. */
      box-shadow: 0 -14px 30px -20px rgba(0, 0, 0, 0.7);
      border: 0;
      /* A transicao da abertura. "translateY" e barato e nao remede layout.
         O fill-mode e "backwards", NAO "both": com "both" o valor final da
         animacao (translateY(0)) continua aplicado depois que ela termina e
         VENCE o transform inline — e o arrasto para fechar escreve exatamente
         em transform inline. Com "backwards" a animacao solta a propriedade ao
         terminar e o arrasto funciona. */
      align-content: start;
      animation: fone-folha-sobe 280ms cubic-bezier(0.18, 0.86, 0.24, 1) backwards;
      touch-action: pan-y;
    }

    @keyframes fone-folha-sobe {
      from { transform: translateY(100%); opacity: 0.82; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    /* ANTERIOR (rollback refinamento mobile): zerar o estado escondia a folha
       sem transicao. O host agora conserva data-folha por 280ms e acrescenta
       data-folha-saindo, exclusivamente abaixo do breakpoint de telefone. */
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.lights-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.ac-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.media-hub-card,
    :host([data-folha][data-folha-saindo]) .room-subview .glass-card.appliances-card {
      animation: fone-folha-desce 280ms cubic-bezier(0.42, 0, 0.78, 0.18) forwards;
      pointer-events: none;
    }

    @keyframes fone-folha-desce {
      from { transform: translateY(0); opacity: 1; }
      to   { transform: translateY(100%); opacity: 0.82; }
    }

    /* A alça: dica visual de que a folha se fecha arrastando ou tocando fora. */
    :host([data-folha]) .room-subview .glass-card.lights-card::after,
    :host([data-folha]) .room-subview .glass-card.ac-card::after,
    :host([data-folha]) .room-subview .glass-card.media-hub-card::after,
    :host([data-folha]) .room-subview .glass-card.appliances-card::after {
      content: '';
      position: absolute;
      inset: 7px auto auto 50%;
      transform: translateX(-50%);
      /* Menor e mais discreta que a anterior (42x4 / 0.28): o item 11 pede que
         a alca nao chame atencao. */
      width: 34px;
      height: 3px;
      padding: 0;
      border-radius: 2px;
      background: rgba(255, 255, 255, 0.20);
      z-index: 2;
      pointer-events: none;
    }

    /* Dentro da folha o corpo das luzes rola sozinho, sem teto herdado. */
    :host([data-folha='luzes']) .room-subview .lights-zones,
    :host([data-folha='luzes']) .room-subview .zone-lights,
    :host([data-folha='luzes']) .room-subview .office-light-list {
      flex: 0 0 auto;
      max-height: none !important;
      overflow-y: visible !important;
      overscroll-behavior: auto;
    }
    :host([data-folha='luzes']) .room-subview .lights-body { grid-template-rows: 1fr; }

    /* ── 7a. CABEÇALHO DAS FOLHAS (item 11) ───────────────────────────────────
       Compacto e numa linha so: icone + titulo a esquerda, acoes globais a
       direita. O respiro de cima ja e do padding da folha (16px), que abriga a
       alca — o cabecalho nao precisa de altura propria para decoracao.

       ANTERIOR (rollback rev. faixa-de-tiles): as regras deste trecho miravam
       ".lights-card .module-head", ".head-actions" e ".zone-header". NENHUMA
       dessas classes existe no markup atual (o dock usa ".lights-dock",
       ".lights-dock-actions" e ".section-head"), entao as regras eram letra
       morta e o cabecalho da folha de luzes seguia com a geometria do tablet.
       Os nomes abaixo saem do markup renderizado. */
    :host([data-folha]) .room-subview .lights-dock,
    :host([data-folha]) .room-subview .mh-head,
    :host([data-folha]) .room-subview .ac-lean-head {
      min-height: 0;
      height: auto;
      padding: 0 2px 12px;
      gap: 10px;
    }
    /* Filete abaixo do cabecalho — mesmo divisor da faixa, para o segundo nivel
       falar a mesma lingua do primeiro. */
    :host([data-folha]) .room-subview .lights-card.is-open .lights-dock,
    :host([data-folha]) .room-subview .mh-head,
    :host([data-folha]) .room-subview .ac-lean-head {
      border-bottom: 1px solid var(--fone-faixa-filete);
    }
    /* Dentro da folha o titulo NAO alterna nada: a folha ja esta aberta. O
       chevron do dock de luzes so confundiria. */
    :host([data-folha='luzes']) .room-subview .lights-dock-chevron { display: none; }
    :host([data-folha]) .room-subview .lights-dock .micro-icon,
    :host([data-folha]) .room-subview .mh-head .micro-icon,
    :host([data-folha]) .room-subview .ac-lean-head .micro-icon {
      width: 24px;
      height: 24px;
      background: none;
      border: 0;
      box-shadow: none;
    }
    /* O titulo empurra: com o X entrando como TERCEIRO filho, o
       "justify-content: space-between" herdado do tablet jogaria o botao do
       meio para o centro. Com o titulo crescendo, os dois botoes ficam colados
       na direita, separados pelo gap do cabecalho. */
    :host([data-folha]) .room-subview .mh-head > .mh-head-title,
    :host([data-folha]) .room-subview .ac-lean-head > .ac-head-title,
    :host([data-folha]) .room-subview .appliances-head > .mh-head-title {
      flex: 1 1 auto;
      min-width: 0;
    }
    :host([data-folha]) .room-subview .lights-dock-actions {
      flex: 0 0 auto;
      gap: 6px;
    }
    :host([data-folha]) .room-subview .lights-dock-actions .chip-button {
      min-height: 32px;
      min-width: 0;
    }

    /* ── 7b. FOLHA DE ILUMINAÇÃO (item 13) ────────────────────────────────── */
    /* Quem rola e a GRADE, nao a folha: o cabecalho fica parado, que e o que o
       item 10 pede quando o conteudo passa do limite.

       ANTERIOR (rollback rev. faixa-de-tiles) — eu havia escrito aqui
         max-height: none; overflow: visible;
       para "soltar" a lista. Isso quebrou a rolagem: ".lights-body-clip"
       recorta o excedente, entao o conteudo nao aumentava o scrollHeight da
       folha e as ultimas luzes sumiam sem que nada rolasse. Medido no banco:
       a 7a celula da Sala terminava 12,5px abaixo da base da folha, com
       scrollHeight == clientHeight. A base ja fazia certo (max-height: 100% +
       overflow-y: auto) — o override era o defeito. */
    :host([data-folha='luzes']) .room-subview .lights-scroll {
      padding: 12px 0 0;
    }
    :host([data-folha='luzes']) .room-subview .light-grid {
      width: 100%;
      margin-inline: 0;
      gap: 0;
    }
    /* Cada luz deixa de ser um cartao com contorno completo: fica so o filete
       que separa as celulas, como no plano da faixa. */
    :host([data-folha='luzes']) .room-subview .light-cell {
      border: 0;
      border-radius: 0;
      background: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: none;
      min-height: 56px;
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-left {
      border-left: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='luzes']) .room-subview .section-head {
      padding: 12px 2px 6px;
    }
    :host([data-folha='luzes']) .room-subview .section-head .zone-off {
      min-height: 30px;
    }

    /* ── 7c. FOLHA DO AR-CONDICIONADO (item 15) ───────────────────────────── */
    /* O anel continua sendo o elemento dominante; Modo/Ventilacao/Swing mantem
       area tatil propria, sem um card externo envolvendo o conjunto. */
    :host([data-folha='ac']) .room-subview .ac-card.ac-card-lean {
      grid-template-rows: auto minmax(clamp(171.6px, 12.09cqi, 286px), auto) auto;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-mid { padding: 10px 0 12px; }
    :host([data-folha='ac']) .room-subview .ac-lean-foot {
      align-items: stretch;
      padding: 0;
      gap: 8px;
    }
    :host([data-folha='ac']) .room-subview .ac-action {
      min-height: clamp(40.56px, 2.86cqi, 67.6px);
    }

    /* ── 7d. FOLHA DO HUB DE MÍDIA (item 14) ──────────────────────────────── */
    /* O conteudo integra a superficie da folha em vez de parecer um card dentro
       dela: as fontes viram trechos separados por filete, sem moldura propria. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      grid-template-rows: auto minmax(0, 1fr);
    }
    :host([data-folha='midia']) .room-subview .mh-sources { gap: 0; }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      border-radius: 0;
      background: none;
      border: 0;
      border-top: 1px solid var(--fone-faixa-filete);
      min-height: 54px;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      grid-template-columns: minmax(0, 1fr)
        clamp(clamp(81.12px, 5.71cqi, 135.2px), 30vw, clamp(115.44px, 8.13cqi, 192.4px));
      gap: clamp(6.24px, 0.44cqi, 10.4px);
      padding-inline: 2px;
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='midia']) .room-subview .mh-info { padding-left: 0; }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-menu,
    :host([data-folha='midia']) .room-subview .mh-btn {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
    }

    /* ── 7e. FOLHA DE ELETRODOMÉSTICOS (Cozinha) ──────────────────────────── */
    :host([data-folha='eletro']) .room-subview .appliances-grid {
      padding-top: 12px;
    }

    /* -- 7f. CORRECAO POS-DISPOSITIVO: INTERIOR ORIGINAL -------------------
       ANTERIOR (rollback faixa-de-tiles): o primeiro desenho da folha zerava
       raio, fundo, borda e espacos das celulas internas para prolongar a faixa
       fechada para dentro do segundo nivel. O aparelho confirmou que isso
       redesenhava componentes ja consolidados no tablet. As regras abaixo
       restauram a mesma hierarquia interna; somente a caixa externa continua
       sendo adaptada para folha no telefone. */

    :host([data-folha='luzes']) .room-subview .lights-dock {
      min-height: clamp(40.56px, 2.86cqi, 67.6px);
      height: auto;
      padding: 0 clamp(7.8px, 0.55cqi, 13px);
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      border-bottom: 1px solid rgba(255, 255, 255, 0.10);
    }
    :host([data-folha='midia']) .room-subview .mh-head,
    :host([data-folha='ac']) .room-subview .ac-lean-head {
      min-height: clamp(34.32px, 2.42cqi, 57.2px);
      height: clamp(34.32px, 2.42cqi, 57.2px);
      padding: 0 clamp(7.8px, 0.55cqi, 13px) 0 clamp(10.92px, 0.77cqi, 18.2px);
      gap: clamp(9.36px, 0.66cqi, 15.6px);
      border-bottom: 0;
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-chevron {
      display: grid;
      transform: none;
    }

    :host([data-folha]) .room-subview .lights-dock .micro-icon,
    :host([data-folha]) .room-subview .mh-head .micro-icon,
    :host([data-folha]) .room-subview .ac-lean-head .micro-icon {
      width: clamp(21.84px, 1.54cqi, 36.4px);
      height: clamp(21.84px, 1.54cqi, 36.4px);
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.09);
      border: 1px solid rgba(255, 255, 255, 0.13);
      box-shadow: none;
    }
    :host([data-folha]) .room-subview .micro-icon.tone-amber {
      color: rgb(255, 183, 77);
      background: rgba(255, 183, 77, 0.10);
      border-color: rgba(255, 183, 77, 0.22);
    }
    :host([data-folha]) .room-subview .micro-icon.tone-cyan {
      color: rgb(111, 224, 241);
      background: rgba(111, 224, 241, 0.10);
      border-color: rgba(111, 224, 241, 0.20);
    }

    :host([data-folha='luzes']) .room-subview .glass-card.lights-card {
      padding-left: clamp(20px, 5.6vw, 24px);
      padding-right: clamp(20px, 5.6vw, 24px);
    }
    :host([data-folha='luzes']) .room-subview .lights-dock {
      padding-inline: 0;
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-actions {
      gap: clamp(7px, 2vw, 10px);
      /* Afasta as pills apenas do filete inferior; a altura da folha não muda. */
      transform: translateY(-3px);
    }
    :host([data-folha='luzes']) .room-subview .lights-dock-actions .chip-button {
      min-height: 36px;
    }
    :host([data-folha='luzes']) .room-subview .lights-scroll {
      padding: 12px 0 0;
    }
    :host([data-folha='luzes']) .room-subview .light-grid {
      width: 100%;
      margin-inline: 0;
      gap: clamp(8px, 2vw, 9px);
    }
    :host([data-folha='luzes']) .room-subview .light-cell {
      height: var(--fone-luz-cell-h, clamp(58px, 6.45dvh, 60px));
      min-height: var(--fone-luz-cell-h, clamp(58px, 6.45dvh, 60px));
      padding-inline: clamp(10px, 2.8vw, 12px);
      border: 1px solid rgba(255, 255, 255, 0.105);
      border-color: rgba(255, 255, 255, 0.105);
      border-radius: var(--bruno-subview-cartela-inner-radius, var(--bruno-liquid-control-radius-compact, 12px));
      background: linear-gradient(180deg, rgba(255, 255, 255, 0.060), rgba(255, 255, 255, 0.022));
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.045);
    }
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-left,
    :host([data-folha='luzes']) .room-subview .light-cell.has-rule-top {
      border-color: rgba(255, 255, 255, 0.105);
    }
    :host([data-folha='luzes']) .room-subview .section-head {
      padding: 0 0 10px;
    }
    :host([data-folha='luzes']) .room-subview .section-head .zone-off {
      min-height: 32px;
    }
    :host([data-folha='luzes']) .room-subview .light-section + .light-section {
      margin-top: 14px;
      padding-top: 14px;
      border-top-color: rgba(255, 255, 255, 0.085);
    }
    :host([data-folha='luzes']) .room-subview .lc-switch {
      width: 34px;
      height: 20px;
      padding-inline: 2px;
    }
    :host([data-folha='luzes']) .room-subview .lc-knob {
      width: 14px;
      height: 14px;
    }
    :host([data-folha='luzes']) .room-subview .light-cell.is-on .lc-knob {
      transform: translateX(14px);
    }

    /* O acordeao conserva uma fonte aberta e outra recolhida, como no tablet.
       No telefone, TV/PC e Spotify compartilham a mesma altura de corpo para a
       folha nao saltar durante a alternancia; o conteudo continua responsivo. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      grid-template-rows: auto auto;
      align-content: start;
      --fone-midia-arte: clamp(100px, 29cqi, 110px);
      /* NOVO (2026-08-13) — altura derivada dos elementos, nao de dvh.
         92px = paddings 8 + gap de camadas 4 + transportes/volume 80.
         ANTERIOR (rollback): clamp(226px, 27dvh, 232px). */
      --fone-midia-corpo-altura: calc(var(--fone-midia-arte) + 92px);
      --fone-midia-gap: clamp(10px, 2.8cqi, 12px);
      --fone-midia-padding-x: clamp(12px, 3.4cqi, 16px);
      /* O material da folha continua por tras da rail, mas a reserva extra
         acima do filete cai de 10 para 4px. A altura medida do dock permanece
         intacta. Restrito a folha de midia no telefone. */
      padding-bottom: calc(4px + var(--bruno-dock-h, 74px));
    }
    :host([data-folha='midia']) .room-subview .mh-sources {
      gap: 0;
      /* ANTERIOR (rollback): padding inferior de 10px, que se somava ao
         padding da folha e afastava o ultimo controle do filete da rail. */
      padding: 0 clamp(10px, 2.8vw, 13px);
    }
    :host([data-folha='midia']) .room-subview .mh-source {
      flex: 0 0 44px;
      overflow: visible;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open {
      flex: 0 0 auto;
      position: relative;
    }
    :host([data-folha='midia']) .room-subview .mh-source + .mh-source.is-open::before {
      content: '';
      position: absolute;
      z-index: 2;
      top: 0;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--fone-faixa-filete);
      pointer-events: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      min-height: 44px;
      height: 44px;
      align-items: center;
      padding-block: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
    }
    :host([data-folha='midia']) .room-subview .mh-source + .mh-source .mh-source-head {
      border-top: 1px solid var(--fone-faixa-filete);
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open .mh-source-head {
      /* NOVO (2026-08-13) — o titulo da fonte aberta pertence ao Now Playing.
         ANTERIOR (rollback): ocupava uma linha propria de 40px antes do corpo.
         Sobreposto apenas a coluna textual, alinha Spotify, TV ou PC ao topo
         da arte e reduz a folha sem comprimir nenhuma area tatil. */
      position: absolute;
      z-index: 3;
      top: 8px;
      left: var(--fone-midia-padding-x);
      right: calc(var(--fone-midia-padding-x) + var(--fone-midia-arte) + var(--fone-midia-gap));
      width: auto;
      height: 30px;
      min-height: 30px;
      padding: 0;
      border-top: 0;
      grid-template-columns: 18px minmax(0, auto);
      justify-content: start;
      gap: 6px;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      /* Now Playing compacto: metadata e arte dividem a primeira camada;
         transportes e volume ocupam a largura toda abaixo dela. */
      height: var(--fone-midia-corpo-altura);
      min-height: var(--fone-midia-corpo-altura);
      box-sizing: border-box;
      position: relative;
      isolation: isolate;
      overflow: hidden;
      grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
      grid-template-rows: minmax(var(--fone-midia-arte), 1fr) auto;
      grid-template-areas:
        'info art'
        'controls controls';
      align-items: start;
      align-content: start;
      gap: 4px var(--fone-midia-gap);
      padding: 4px var(--fone-midia-padding-x);
      border-top: 0;
      background: transparent;
      box-shadow: none;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body.has-atmosphere::after {
      /* ANTERIOR (rollback): um gradiente escuro cobria todo o retangulo do
         corpo e o destacava da folha. A atmosfera agora vem somente da arte
         desfocada abaixo, com mascara que desaparece nas quatro extremidades. */
      display: none;
    }
    :host([data-folha='midia']) .room-subview .mh-now-atmosphere {
      /* O elemento ampliado era maior que o corpo; o fade ficava fora do
         recorte e o WebView mostrava exatamente a borda retangular do
         overflow. No telefone o corpo passa a revelar somente o material
         VisionOS da propria folha. A capa nitida continua na coluna de arte.
         ANTERIOR (rollback): imagem 160%, opacity .12, blur 30px e mascara. */
      display: none;
    }
    :host([data-folha='midia']) .room-subview .mh-left {
      display: contents;
    }
    :host([data-folha='midia']) .room-subview .mh-info {
      grid-area: info;
      position: relative;
      z-index: 1;
      padding-left: 0;
      padding-top: 36px;
    }
    :host([data-folha='midia']) .room-subview .mh-progress-wrap {
      width: 100%;
    }
    :host([data-folha='midia']) .room-subview .mh-controls {
      grid-area: controls;
      position: relative;
      z-index: 1;
      width: 100%;
      margin-top: 0;
      gap: 2px;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-art {
      grid-area: art;
      position: relative;
      z-index: 1;
      width: 100%;
      height: auto;
      aspect-ratio: 1 / 1;
      align-self: start;
      border-radius: 12px;
    }
    :host([data-folha='midia']) .room-subview .mh-art-wide {
      aspect-ratio: 16 / 9;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art-wide {
      aspect-ratio: 1 / 1;
    }
    :host([data-folha='midia']) .room-subview .mh-art img,
    :host([data-folha='midia']) .room-subview .mh-art-square.is-cover img,
    :host([data-folha='midia']) .room-subview .mh-art-wide.is-cover img {
      inset: 0;
      top: auto;
      left: auto;
      transform: none;
      width: 100%;
      height: 100%;
      aspect-ratio: auto;
      object-fit: contain;
      border-radius: inherit;
    }
    :host([data-folha='midia']) .room-subview .mh-art.is-cover img {
      object-fit: cover;
    }
    /* Standby usa contain sem escala: o PNG inteiro permanece dentro da caixa
       de 100 a 110 px e nunca volta a ser recortado pelo overflow da arte. */
    :host([data-folha='midia']) .room-subview .mh-art.is-standby img {
      object-fit: contain;
      transform: none;
    }
    /* ANTERIOR (rollback): TV e PC usavam a mesma caixa nominal do Echo, mas
       seus PNGs têm mais transparência interna e pareciam menores. Compensação
       exclusivamente óptica e exclusiva do telefone. */
    :host([data-folha='midia']) .room-subview .mh-source-body-tv .mh-art.is-standby img,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art.is-standby img {
      transform: scale(1.1);
      transform-origin: center;
    }
    :host([data-folha='midia']) .room-subview .mh-vol {
      order: 2;
      min-height: 34px;
      padding-inline: 2px;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row {
      order: 1;
      gap: 0;
      min-height: 44px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-4,
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(4, minmax(0, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(5, minmax(0, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn {
      min-height: 44px;
      padding: 0;
      border: 0;
      border-radius: 0;
      background: transparent;
      box-shadow: none;
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn:nth-child(2) bruno-icon {
      --mdc-icon-size: 28px;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      order: 1;
      min-height: 46px;
    }
    /* PC desligado usava a grade de tres colunas dos transportes, deixando o
       CTA estreito. TV, PC e Spotify passam a compartilhar a mesma linguagem
       de acao principal em largura total. */
    :host([data-folha='midia']) .room-subview .mh-source-body-pc.is-source-idle .mh-btn-row-3 {
      grid-template-columns: minmax(0, 1fr);
      gap: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body-pc.is-source-idle .mh-btn-row-3 .mh-btn.is-main {
      width: 100%;
      min-width: 0;
      min-height: 46px;
      padding-inline: 12px;
      border: var(--bruno-liquid-control-warm-border, 1px solid rgba(242,194,102,0.180));
      border-radius: var(--bruno-liquid-control-radius-compact, 9px);
      background: var(--bruno-liquid-control-warm-background, rgba(242,194,102,0.038));
      box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
    }

    /* REV. 2026-08-14 — composicao final do Hub no telefone.
       O corpo anterior somava padding da lista e padding proprio: o icone da
       fonte comecava 13,7px depois do icone do cabecalho, e a arte terminava
       na mesma distancia antes do menu. A lista passa a ocupar o eixo inteiro
       da folha e cada secao usa os mesmos 12px do cabecalho nas duas bordas.

       A estrutura anterior tambem empilhava transportes e volume em toda a
       largura. Ela permanece acima como rollback; as regras abaixo apenas
       recompõem o mesmo DOM em tres zonas no breakpoint de telefone:
       informacao, controles na coluna textual e volume na base. */
    :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
      --fone-midia-eixo-x: 12px;
      --fone-midia-corpo-altura: calc(var(--fone-midia-arte) + 62px);
      --fone-midia-gap: clamp(8px, 2.4cqi, 10px);
    }
    :host([data-folha='midia']) .room-subview .mh-sources {
      padding-inline: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-source,
    :host([data-folha='midia']) .room-subview .mh-source.is-open,
    :host([data-folha='midia']) .room-subview .mh-source-body {
      background: transparent !important;
      backdrop-filter: none !important;
      -webkit-backdrop-filter: none !important;
      border: 0;
      border-radius: 0;
      box-shadow: none !important;
    }
    :host([data-folha='midia']) .room-subview .mh-source-body {
      isolation: auto;
      overflow: visible;
      grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
      grid-template-rows: minmax(0, 1fr) 44px 34px;
      grid-template-areas:
        'info art'
        'buttons art'
        'volume volume';
      gap: 4px var(--fone-midia-gap);
      padding: 4px var(--fone-midia-eixo-x);
    }
    :host([data-folha='midia']) .room-subview .mh-source-body::before,
    :host([data-folha='midia']) .room-subview .mh-source-body::after {
      content: none !important;
      display: none !important;
    }
    :host([data-folha='midia']) .room-subview .mh-source-head {
      padding-inline: var(--fone-midia-eixo-x);
    }
    :host([data-folha='midia']) .room-subview .mh-source.is-open .mh-source-head {
      top: 8px;
      left: var(--fone-midia-eixo-x);
      right: calc(var(--fone-midia-eixo-x) + var(--fone-midia-arte) + var(--fone-midia-gap));
      padding: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-info {
      grid-area: info;
      align-self: start;
      padding-top: 34px;
    }
    :host([data-folha='midia']) .room-subview .mh-progress-wrap {
      width: 100%;
    }
    :host([data-folha='midia']) .room-subview .mh-controls {
      display: contents;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row {
      grid-area: buttons;
      align-self: center;
      width: 100%;
      min-width: 0;
      min-height: 44px;
    }
    :host([data-folha='midia']) .room-subview .mh-vol {
      grid-area: volume;
      align-self: end;
      width: 100%;
      min-width: 0;
      min-height: 34px;
      padding-inline: 0;
    }
    :host([data-folha='midia']) .room-subview .mh-art {
      grid-area: art;
      align-self: center;
      justify-self: end;
    }

    /* Sem volume, TV/PC/Spotify conservam a mesma altura externa. A arte usa
       toda a altura disponivel e o CTA ocupa a metade inferior da coluna de
       texto, em vez de deixar uma faixa vazia na base. */
    :host([data-folha='midia']) .room-subview .mh-source-body.is-source-idle .mh-art,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-art {
      grid-column: 2;
      grid-row: 1 / 4;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main,
    :host([data-folha='midia']) .room-subview .mh-source-body-pc .mh-btn-row {
      grid-column: 1;
      grid-row: 2 / 4;
      align-self: center;
    }
    :host([data-folha='midia']) .room-subview .mh-controls > .mh-btn.is-main {
      width: 100%;
      min-width: 0;
      min-height: 46px;
    }

    /* Os quatro transportes mantem caixas tateis invisiveis de pelo menos
       44px. So Play/Pause e Mais desenham circulos: o primeiro e o foco optico;
       o segundo recebe um acento menor. */
    :host([data-folha='midia']) .room-subview .mh-btn-row-4 {
      grid-template-columns: repeat(4, minmax(44px, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
      grid-template-columns: repeat(5, minmax(44px, 1fr));
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn {
      position: relative;
      isolation: isolate;
      min-width: 44px;
      min-height: 44px;
      overflow: visible;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn::before {
      content: '';
      position: absolute;
      z-index: -1;
      left: 50%;
      top: 50%;
      width: 0;
      height: 0;
      transform: translate(-50%, -50%);
      border-radius: 50%;
      pointer-events: none;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Tocar']::before,
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Pausar']::before {
      width: 42px;
      height: 42px;
      background: rgba(255, 255, 255, 0.085);
      border: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.34);
      box-shadow: 0 5px 14px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.10);
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn.is-plus::before {
      width: 30px;
      height: 30px;
      background: rgba(255, 255, 255, 0.045);
      border: 1px solid rgba(255,255,255,0.13);
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn bruno-icon {
      position: relative;
      z-index: 1;
      --mdc-icon-size: 23px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Tocar'] bruno-icon,
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn[aria-label='Pausar'] bruno-icon {
      --mdc-icon-size: 25px;
    }
    :host([data-folha='midia']) .room-subview .mh-btn-row .mh-btn.is-plus bruno-icon {
      --mdc-icon-size: 18px;
    }

    @container subview (max-width: 350px) {
      :host([data-folha='midia']) .room-subview .media-hub-card.mh-accordion {
        --fone-midia-arte: 96px;
        --fone-midia-gap: 8px;
      }
      :host([data-folha='midia']) .room-subview .mh-source-body {
        grid-template-columns: minmax(0, 1fr) var(--fone-midia-arte);
        gap: 8px var(--fone-midia-gap);
      }
      :host([data-folha='midia']) .room-subview .mh-vol-label {
        display: none;
      }
      /* Em 320px a coluna textual nao comporta fisicamente as cinco acoes do
         PC com alvos Apple de 44px. Mantemos os cinco alvos integrais e
         limitamos a faixa a sua propria coluna; somente esse conjunto pode ser
         percorrido horizontalmente, sem invadir a arte nem aumentar a folha. */
      :host([data-folha='midia']) .room-subview .mh-btn-row-5 {
        grid-template-columns: repeat(5, 44px);
        max-width: 100%;
        overflow-x: auto;
        overflow-y: hidden;
        overscroll-behavior-inline: contain;
        scrollbar-width: none;
        -webkit-overflow-scrolling: touch;
      }
      :host([data-folha='midia']) .room-subview .mh-btn-row-5::-webkit-scrollbar {
        display: none;
      }
    }

    :host([data-folha='ac']) .room-subview .ac-card.ac-card-lean {
      grid-template-rows: auto auto auto;
      align-content: start;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-mid {
      min-height: clamp(178px, 48vw, 210px);
      padding: 0 clamp(4.68px, 0.33cqi, 7.8px) 2px;
    }
    :host([data-folha='ac']) .room-subview .ac-lean-foot {
      padding: 0 clamp(7.8px, 0.55cqi, 13px) clamp(7.8px, 0.55cqi, 13px);
      gap: clamp(6.24px, 0.44cqi, 10.4px);
    }

    /* ANTERIOR (rollback pos-device): Josh usava um gradiente quase opaco e
       blur(28px) brightness(.78). No telefone ele agora recebe exatamente o
       mesmo material VisionOS da regra-base da folha. */
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.lights-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.ac-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.media-hub-card,
    :host([data-bruno-subview-surface-theme='josh'][data-folha])
      .room-subview .glass-card.appliances-card {
      background: var(--fone-folha-vision-background) !important;
      backdrop-filter: var(--fone-folha-vision-filter) !important;
      -webkit-backdrop-filter: var(--fone-folha-vision-filter) !important;
    }

    /* ══ 8. ESCURECIMENTO ═══════════════════════════════════════════════════ */
    /* A câmera fica ACIMA dele: acesa, transmitindo e clicável com a folha
       aberta. Todo o resto escurece, e tocar no escuro fecha. */

    /* ── FECHAR (item 12) ──────────────────────────────────────────────────
       A barra "Concluir" SAIU. Ela transformava o fechamento em etapa de
       formulario, ocupava 54px na base e competia com o dock logo abaixo.
       Agora o fechamento e o de uma folha nativa: arrastar para baixo (ver
       "_arrastarFolha" no componente), tocar fora, ou o botao discreto no
       cabecalho.

       ANTERIOR (rollback rev. faixa-de-tiles) — a barra:
         :host([data-folha]) .folha-fechar {
           display: flex; position: fixed; left: 0; right: 0; bottom: 0;
           z-index: 10;
           height: calc(var(--fone-fechar-h) + env(safe-area-inset-bottom,0px));
           border-top: 1px solid rgba(255,255,255,0.09);
           background: var(--bruno-liquid-surface-off-background,
                            rgba(20,24,33,0.92));
           backdrop-filter: blur(18px) saturate(1.12);
           font-size: 15px; font-weight: 640;
         }
       ANTERIOR: o elemento continuava no DOM, apenas escondido. Agora ele saiu
       tambem da marcacao; para voltar, restaurar o bloco acima, o button no
       componente e devolver --fone-fechar-h a 54px. */
    :host([data-room]) .room-subview .folha-fechar { display: none; }
    :host([data-folha]) .room-subview .folha-fechar { display: none; }

    /* O chevron fica imediatamente depois do titulo e recolhe a folha. Ele nao
       tem disco, moldura ou fundo: e o mesmo vocabulario do chevron da faixa. */
    :host([data-room]) .room-subview .folha-recolher { display: none; }
    :host([data-folha]) .room-subview .folha-recolher {
      display: grid;
      place-items: center;
      width: 28px;
      height: 28px;
      flex: 0 0 28px;
      padding: 0;
      margin: 0 0 0 -4px;
      border: 0;
      border-radius: 0;
      background: transparent;
      color: rgba(255, 255, 255, 0.58);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-folha]) .room-subview .folha-recolher bruno-icon {
      --mdc-icon-size: 20px;
    }
    :host([data-folha]) .room-subview .folha-recolher:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: 2px;
    }

    /* ANTERIOR (rollback pos-device): o X era um glifo MDI e depois um caractere
       em circulo. O markup fica preservado, mas sem ocupar layout; o chevron ao
       lado do titulo assumiu o fechamento. */
    :host([data-room]) .room-subview .folha-x { display: none; }
    :host([data-folha]) .room-subview .folha-x {
      display: none;
      place-items: center;
      width: 34px;
      height: 34px;
      flex: 0 0 auto;
      padding: 0;
      margin: 0;
      border: 1px solid rgba(255, 255, 255, 0.22);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.14);
      color: rgba(255, 255, 255, 0.96);
      box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.12);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host([data-folha]) .room-subview .folha-x bruno-icon {
      --mdc-icon-size: 18px;
    }
    :host([data-folha]) .room-subview .folha-x-glyph {
      display: block;
      font-size: 26px;
      font-weight: 420;
      line-height: 1;
      transform: translateY(-1px);
    }
    :host([data-folha]) .room-subview .folha-x:focus-visible {
      outline: 2px solid rgba(120, 178, 245, 0.85);
      outline-offset: 2px;
    }

    /* ── O OVERLAY (item 9) ────────────────────────────────────────────────
       ANTERIOR (rollback rev. faixa-de-tiles): rgba(4, 7, 12, 0.62).
       0.62 apagava o comodo — e a razao de ser deste cenario e VER o ambiente
       enquanto se comanda. Em 0.34 a subview apenas REBAIXA: a faixa e a barra
       de status continuam reconheciveis atras da folha. Sem blur, de proposito
       (o item 9 proibe blur excessivo, e qualquer blur aqui criaria um backdrop
       root que quebraria o microblur da faixa — mesma armadilha da REV.17). */
    :host([data-room]) .room-subview .folha-scrim { display: none; }
    :host([data-folha]) .room-subview .folha-scrim {
      display: block;
      position: fixed;
      inset: 0;
      z-index: 7;
      background: rgba(4, 7, 12, 0.34);
      animation: fone-scrim-entra 180ms ease both;
    }
    :host([data-folha][data-folha-saindo]) .room-subview .folha-scrim {
      animation: fone-scrim-sai 180ms ease forwards;
      pointer-events: none;
    }
    /* A camera fica ACIMA do escurecimento: acesa, transmitindo e clicavel. */
    :host([data-folha]) .room-subview .cameras-card { z-index: 8; }

    @keyframes fone-scrim-entra {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes fone-scrim-sai {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  }

  /* Fora do telefone nada disto existe: as linhas e o escurecimento estão no
     DOM mas não aparecem, e nenhum caminho de interação as alcança. */
  @media (min-width: 801px) {
    .resumo-telefone,
    .folha-scrim,
    /* O X de fechar mora no cabecalho dos modulos, que sao os MESMOS do
       tablet. Sem esta linha ele apareceria la — a regra que o esconde vive
       dentro do bloco de telefone e nao alcança larguras maiores. */
    .folha-x,
    .folha-recolher,
    .folha-fechar {
      display: none !important;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .folha-scrim,
    .resumo-chevron,
    .glass-card.lights-card,
    .glass-card.ac-card,
    .glass-card.media-hub-card,
    .glass-card.appliances-card {
      animation: none !important;
      transition: none !important;
    }
  }
`, x = "bruno-room-subview";
function Ci(r) {
  return r === !0 ? !0 : typeof r == "number" ? r > 0 : ["true", "on", "yes", "1"].includes(String(r ?? "").toLowerCase());
}
const Ei = ["on", "playing", "paused", "idle"], Mi = ["playing", "paused", "on", "idle"], Oi = ["streaming", "recording", "idle", "on"], Ti = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], Ii = ["cooling", "heating", "drying", "fan", "preheating"], Di = ["off", "idle"], Ri = [
  { visual: 0, position: 0 },
  { visual: 25, position: 33 },
  { visual: 50, position: 47 },
  { visual: 75, position: 70 },
  { visual: 100, position: 100 }
], Ni = 4e3, Pi = 3e4, Li = 700, Vi = "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1", ji = "/local/images/echo_pop.png?v=20260702-all-images-1", Fi = "/local/images/office_pc.png?v=20260702-all-images-1";
function U(r, a = 0) {
  const e = Number(r);
  return Number.isFinite(e) ? e.toFixed(a).replace(/\.0+$/, "") : "--";
}
function me(r) {
  const a = Math.max(0, Math.floor(Number(r) || 0)), e = Math.floor(a / 3600), o = Math.floor(a % 3600 / 60), i = a % 60;
  return e > 0 ? `${e}:${String(o).padStart(2, "0")}:${String(i).padStart(2, "0")}` : `${o}:${String(i).padStart(2, "0")}`;
}
function Ma(r) {
  const a = String(r ?? "").replace(/_/g, " ").trim();
  return a ? a.charAt(0).toUpperCase() + a.slice(1) : "—";
}
class Bi extends E {
  constructor() {
    super(...arguments), this._lightsOpen = !1, this._folha = null, this._folhaSaindo = !1, this._fonteMidia = "", this._fonteMidiaManual = !1, this._midiaAtivasAntes = [], this._menuMidiaAberto = !1, this._spotifyFerramentas = !1, this._painelClima = "", this._controlesCameraAbertos = !1, this._cameraAtiva = "", this._urlsCarregadas = {}, this._ultimaImagem = {}, this._motorCameras = new Re({
      // O primeiro quadro é do elemento de imagem, que nasce com `src` e baixa
      // sozinho. O motor entra só na primeira atualização — sem isto eram DUAS
      // requisições lentas por câmera na montagem, competindo entre si.
      atrasoInicial: De.principal,
      agenda: {
        agendar: (a, e) => D(x, a, e),
        cancelar: (a) => z(x, a),
        agora: () => performance.now()
      },
      aoCarregar: (a) => this._quadroPronto(a.entityId, a.url),
      aoMedir: (a, e, o, i) => {
        const t = a.split(".")[1] ?? a;
        G(`câmera ${t}`, e, o === "ok"), i && G(`câmera ${t} · 1º quadro`, e, !0);
      }
    }), this._liveEntity = "", this._livePronto = "", this._liveIniciadoEm = 0, this._estadoAoVivo = "ocioso", this._tokenDefinicaoPlayer = 0, this._quadroVerdeRegistrado = "", this._fallbackAoVivo = "", this._ouvindoFechamentoDialogo = !1, this._observador = new Ba(), this._motivo = "", this._ultimoMinuto = "", this._ouvindoVisibilidade = !1, this._aoMudarVisibilidade = () => {
      if (this.isConnected) {
        if (document.visibilityState === "hidden") {
          this._pararTimerCameras(), this._tokenDefinicaoPlayer++, this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._pararAoVivo();
          return;
        }
        this._atualizarCameras(), this._iniciarTimerCameras(), this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._sincronizarCameras();
      }
    }, this._modoPlayer = "nenhum", this._aoCarregarAoVivo = () => {
      const a = this._liveEl, e = this._liveEntity;
      if (!a || !e || !this.isConnected) return;
      const o = a.shadowRoot?.querySelector("video");
      if (!o || o.readyState < 2 || this._livePronto === e) return;
      if (ya(o)) {
        this._quadroVerdeRegistrado !== e && (this._quadroVerdeRegistrado = e, C(
          e,
          "quadro verde rejeitado",
          performance.now() - this._liveIniciadoEm,
          !1
        )), z(x, this._timerQuadroVerde), this._timerQuadroVerde = D(x, () => {
          this._timerQuadroVerde = void 0, this._aoCarregarAoVivo();
        }, 700);
        return;
      }
      this._livePronto = e, this._estadoAoVivo = "ao-vivo", z(x, this._timerQuadroVerde), this._timerQuadroVerde = void 0, a.classList.add("is-ready"), z(x, this._timerAoVivo), this._timerAoVivo = void 0;
      const i = e.split(".")[1] ?? e;
      G(
        `marco: ${i} · player ${this._modoPlayer} · primeiro quadro`,
        performance.now() - this._liveIniciadoEm,
        !0
      ), this._sincronizarCameras();
    }, this._aoInformarStreams = (a) => {
      a.detail?.hasVideo === !1 && this._falharAoVivo("sem video");
    }, this._aoFecharDialogo = (a) => {
      a.detail?.dialog === "ha-more-info-dialog" && this._estadoAoVivo === "entregue-more-info" && (this._estadoAoVivo = "retomando", C(this._cameraAtiva, "more-info fechado; retomando"), z(x, this._timerRetomadaAoVivo), this._timerRetomadaAoVivo = D(x, () => {
        this._timerRetomadaAoVivo = void 0, !(!this.isConnected || this._estadoAoVivo !== "retomando") && (this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._sincronizarCameras());
      }, Li));
    }, this._montadoEm = 0, this._quadrosNaTela = /* @__PURE__ */ new Set(), this._socorros = /* @__PURE__ */ new Set(), this._materialInjetado = !1, this._luzesAssentadas = !1, this._aoMudarModoTelefone = (a) => {
      a.matches || this._limparFolhaImediatamente();
    }, this._arrastoY = null, this._arrastoAlvo = null, this._iniciarArrasto = (a) => {
      if (!this._folha || a.button !== 0) return;
      const e = this._folhaEl();
      !e || !a.composedPath().includes(e) || e.scrollTop > 0 || (this._arrastoY = a.clientY, this._arrastoAlvo = e, globalThis.addEventListener("pointermove", this._moverArrasto, { passive: !0 }), globalThis.addEventListener("pointerup", this._soltarArrasto), globalThis.addEventListener("pointercancel", this._cancelarArrasto));
    }, this._moverArrasto = (a) => {
      if (this._arrastoY == null || !this._arrastoAlvo) return;
      const e = a.clientY - this._arrastoY;
      if (e <= 0) {
        this._arrastoAlvo.style.transform = "";
        return;
      }
      this._arrastoAlvo.style.transform = `translateY(${(e * 0.72).toFixed(1)}px)`;
    }, this._soltarArrasto = (a) => {
      const e = this._arrastoY, o = this._arrastoAlvo;
      this._encerrarArrasto(), !(e == null || !o) && a.clientY - e > 90 && this._fecharFolha();
    }, this._cancelarArrasto = () => {
      this._encerrarArrasto();
    }, this._appsTvAbertos = !1;
  }
  static {
    this.properties = {};
  }
  setConfig(a) {
    if (!a?.room) throw new Error("bruno-room-subview: informe `room`");
    const e = Fa.find((o) => o.id === a.room);
    if (!e) throw new Error(`bruno-room-subview: cômodo desconhecido "${a.room}"`);
    this._config = a, this._room = e, this._sub = Qo[a.room], this._config, this._hass, this._observador.observar([
      ...ne(e),
      ...ne(this._sub)
    ]), this._aplicarAtributos();
  }
  /**
   * ANTERIOR (rollback 6.1) — sem guarda nenhuma:
   *
   *   set hass(hass: Hass) {
   *     this._hass = hass;
   *     this.requestUpdate();
   *   }
   *
   * O Home Assistant troca o objeto `hass` a cada mudança de estado de qualquer
   * entidade da casa. Este componente é o mais pesado do dashboard (média de
   * 3 ms por render na baseline do tablet, pior caso 34,9 ms) e repintava a cada
   * uma delas — inclusive quando o que mudou foi o aspirador em outro cômodo.
   */
  set hass(a) {
    this._hass = a;
    const e = this._observador.mudancas(a);
    e.length !== 0 && (this._motivo = Ua(e), this.requestUpdate());
  }
  getCardSize() {
    return 12;
  }
  /**
   * Mede o custo de cada atualização (Fase 6.0.1).
   *
   * No `update()`, e não no `render()`: é aqui que o Lit constrói E aplica o
   * DOM. Medir só o `render()` mediria a montagem do template, que é a parte
   * barata — e o número enganaria.
   */
  update(a) {
    const e = this._motivo;
    this._motivo = "", Ra(x, () => super.update(a), e || this._motivoPadrao());
  }
  _motivoPadrao() {
    return this.hasUpdated ? "interação" : "montagem";
  }
  /**
   * Depois de cada render, o motor recebe a lista de câmeras da tela.
   *
   * Aqui, e não no render: o motor só deve descobrir a promoção do PIP quando os
   * elementos correspondentes já existem — é neles que o quadro pronto entra.
   */
  updated(a) {
    super.updated(a), this._hass && (this._sincronizarCameras(), this._sincronizarLimiteFolhaTelefone(), this._sincronizarAlturaLuzesTelefone());
  }
  connectedCallback() {
    super.connectedCallback(), Ia(x), this._estadoAoVivo = "ocioso", this._fallbackAoVivo = "", this._montadoEm = performance.now(), this._quadrosNaTela.clear(), this._socorros.clear(), this._aplicarAtributos();
    const a = globalThis;
    a.BrunoLiquidGlass?.apply?.(), a.BrunoSurfaceMaterial?.connect?.(this), this._injetarMaterial(), this._iniciarVigiaTelefone(), this._iniciarTimerCameras(), this._armarVigiaDeCameras(), this._iniciarTimerRelogio(), !this._ouvindoVisibilidade && typeof document < "u" && (la(x, document, "visibilitychange", this._aoMudarVisibilidade), this._ouvindoVisibilidade = !0), !this._ouvindoFechamentoDialogo && typeof window < "u" && (la(x, window, "dialog-closed", this._aoFecharDialogo), this._ouvindoFechamentoDialogo = !0);
  }
  /**
   * O relógio da barra superior.
   *
   * Nada no hass muda de minuto em minuto, então sem uma batida externa a hora
   * congela no momento em que a subview abriu. A comparação com o último minuto
   * continua: batida não é render, só vira render quando o minuto realmente
   * vira.
   *
   * ANTERIOR (rollback 6.1) — intervalo próprio de 15s por instância:
   *
   *   private _iniciarTimerRelogio(): void {
   *     if (this._timerRelogio) return;
   *     this._timerRelogio = intervalo(SONDA, () => { ... }, 15000);
   *   }
   *
   * Cada módulo que mostrasse hora criaria o seu, todos desalinhados entre si e
   * nenhum parando com a tela apagada. O relógio central é um só, e some quando
   * o último assinante sai.
   */
  _iniciarTimerRelogio() {
    this._cancelarRelogio || (this._cancelarRelogio = Ko(() => {
      const a = this._hora();
      a !== this._ultimoMinuto && (this._ultimoMinuto = a, this._motivo = "relógio", this.requestUpdate());
    }));
  }
  _pararTimerRelogio() {
    this._cancelarRelogio?.(), this._cancelarRelogio = void 0;
  }
  disconnectedCallback() {
    super.disconnectedCallback(), Da(x), globalThis.BrunoSurfaceMaterial?.disconnect?.(this), this._limparFolhaImediatamente(), this._pararVigiaTelefone(), this._encerrarArrasto(), this._pararTimerCameras(), this._tokenDefinicaoPlayer++, this._estadoAoVivo = "ocioso", this._pararAoVivo(), z(x, this._timerRetomadaAoVivo), this._timerRetomadaAoVivo = void 0, this._timerLuzes && (z(x, this._timerLuzes), this._timerLuzes = void 0), this._pararTimerRelogio(), this._ouvindoVisibilidade && (da(x, document, "visibilitychange", this._aoMudarVisibilidade), this._ouvindoVisibilidade = !1), this._ouvindoFechamentoDialogo && (da(x, window, "dialog-closed", this._aoFecharDialogo), this._ouvindoFechamentoDialogo = !1);
  }
  /**
   * ANTERIOR (rollback 6.2B) — o ciclo de intervalo fixo que o motor substituiu:
   *
   *   private _iniciarTimerCameras(): void {
   *     if (this._timerCameras) return;
   *     this._timerCameras = intervalo(SONDA, () => this._atualizarCameras(), 6500);
   *   }
   *
   *   private _atualizarCameras(): void {
   *     for (const img of raiz.querySelectorAll("img[data-camera-src-base]")) {
   *       const carregador = new Image();
   *       carregador.onload = () => { ...troca o src... };
   *       carregador.onerror = () => requisicaoManual(SONDA, ..., false);
   *       carregador.src = proxima;
   *     }
   *   }
   *
   * Ele pedia um quadro de cada câmera a cada 6.500 ms **sem olhar se o anterior
   * tinha terminado**, sem prazo e sem cancelamento. Com a carga medida em
   * 6.200 ms de média, cada câmera ficava com uma requisição em voo quase o tempo
   * todo — e um pedido travado ficava pendurado para sempre enquanto outro
   * nascia por cima. A política nova está em `services/camera/snapshot-engine.ts`,
   * com o raciocínio completo no cabeçalho de lá.
   */
  _iniciarTimerCameras() {
    typeof document < "u" && document.visibilityState === "hidden" || this._motorCameras.iniciar();
  }
  _pararTimerCameras() {
    this._motorCameras.parar();
  }
  _atualizarCameras() {
    this._motorCameras.atualizarAgora();
  }
  /**
   * Declara ao motor quais câmeras estão na tela e com que prioridade.
   *
   * Chamado a cada render: promover o PIP a palco muda só a cadência, sem
   * reiniciar o ciclo nem perder a métrica do primeiro quadro.
   */
  _sincronizarCameras() {
    const a = this._camerasConfiguradas().map((t) => this._cameraViva(t));
    if (!a.length) {
      this._motorCameras.definirAlvos([]), this._pararAoVivo();
      return;
    }
    const e = a.find((t) => t.entity === this._cameraAtiva) ?? a[0], o = a.find((t) => t.online), i = e?.online || !o ? e : o;
    this._motorCameras.definirAlvos(
      a.filter((t) => !(this._liveEl?.isConnected && this._livePronto === t.entity)).map((t) => ({
        entityId: t.entity,
        base: t.base,
        prioridade: t.entity === i?.entity ? "principal" : "secundaria"
      }))
    ), this._cuidarDoAoVivo(i?.entity);
  }
  /**
   * Aponta o player WebRTC nativo do HA para a câmera do palco.
   *
   * A foto continua por baixo até o evento real de primeiro quadro. Se a
   * negociação não fechar, o player é removido e a foto permanece ativa.
   */
  _cuidarDoAoVivo(a) {
    const e = a && Ea(a) ? a : "";
    if (!e) {
      this._estadoAoVivo = "ocioso", this._pararAoVivo();
      return;
    }
    if (this._estadoAoVivo === "fallback" && this._fallbackAoVivo !== e && (this._estadoAoVivo = "ocioso", this._fallbackAoVivo = ""), this._estadoAoVivo === "entregue-more-info" || this._estadoAoVivo === "retomando" || this._estadoAoVivo === "fallback" || this._estadoAoVivo === "carregando-player") {
      this._pararAoVivo();
      return;
    }
    const o = this.shadowRoot?.querySelector(
      `.camera-live-slot[data-camera-live="${e}"]`
    );
    if (!o) return;
    if (!this._liveEl || this._liveEntity !== e) {
      this._pararAoVivo();
      const t = this._criarPlayer();
      if (!t) {
        this._estadoAoVivo = "carregando-player";
        const n = ++this._tokenDefinicaoPlayer;
        Oe(e, this._hass).then((c) => {
          !this.isConnected || n !== this._tokenDefinicaoPlayer || (this._estadoAoVivo = c ? "ocioso" : "fallback", this._fallbackAoVivo = c ? "" : e, this._sincronizarCameras());
        });
        return;
      }
      this._estadoAoVivo = "negociando", this._liveEl = t, this._liveEntity = e, la(x, t, "load", this._aoCarregarAoVivo), la(x, t, "streams", this._aoInformarStreams), o.appendChild(t), this._iniciarPlayerAposContexto(t, e);
      return;
    }
    const i = this._liveEl;
    i.parentElement !== o && o.appendChild(i), i.entityid !== e && (i.entityid = e);
  }
  /**
   * Cria o player ao vivo, preferindo WebRTC DIRETO.
   *
   * ── POR QUE NAO USAR MAIS `hui-image cameraView="live"` ──────────────────
   *
   * Aquele caminho monta um `ha-camera-stream`, que é um SELETOR: ele começa
   * exibindo HLS e só migra para WebRTC depois que a negociação fecha e o vídeo
   * fica válido. Medido em 2026-08-09 pelos dois relógios na mesma tela —
   * more-info 10:46:45, tile 10:46:33 — ele **ficou no HLS**, com os ~12 s de
   * buffer de segmentos.
   *
   * E a métrica `stream 264px` que eu havia usado como prova de sucesso só
   * confirmava a PRESENÇA do `ha-camera-stream`, nunca o protocolo. Diagnóstico
   * do Codex, e ele está certo.
   *
   * `ha-web-rtc-player` é o player final, sem o seletor na frente: negocia
   * WebRTC e ponto. Sem fase HLS, sem tentativa paralela dos dois — que era
   * também o que competia com o more-info.
   *
   * ── O FALLBACK ANTERIOR, E POR QUE SAIU ─────────────────────────────────
   *
   * O fallback para `hui-image` reabria HLS e devolvia os 12 s de atraso. Se o
   * player direto não estiver registrado, o fallback correto é a foto já
   * renderizada, sem iniciar outro protocolo.
   */
  _criarPlayer() {
    const a = Te();
    if (a) {
      a.classList.add("camera-live-el"), a.setAttribute("muted", ""), a.setAttribute("playsinline", ""), a.setAttribute("autoplay", "");
      try {
        a.fitMode = "cover";
      } catch {
      }
      return this._modoPlayer = "webrtc", a;
    }
    this._modoPlayer = "nenhum";
  }
  /**
   * Espera o player oficial consumir os contextos Lit antes de lhe dar a
   * entidade. O componente do HA so reinicia WebRTC quando `entityid` muda; se
   * essa mudanca acontece antes de apiContext/connectionContext, ele retorna e
   * fica inerte ate ser removido.
   */
  _iniciarPlayerAposContexto(a, e) {
    Promise.resolve(a.updateComplete).then(() => {
      this._liveEl !== a || this._liveEntity !== e || !a.isConnected || (this._liveIniciadoEm = performance.now(), a.entityid = e, C(e, "entityid atribuido"), this._armarPrazoAoVivo(a, e));
    }).catch(() => {
      this._liveEl === a && this._liveEntity === e && this._falharAoVivo("contexto");
    });
  }
  _armarPrazoAoVivo(a, e) {
    z(x, this._timerAoVivo), this._timerAoVivo = D(x, () => {
      this._timerAoVivo = void 0, !(this._liveEl !== a || this._liveEntity !== e || this._livePronto === e) && this._falharAoVivo("prazo");
    }, Pi);
  }
  _falharAoVivo(a) {
    const e = this._liveEntity;
    if (!e) return;
    const o = e.split(".")[1] ?? e;
    G(
      `marco: ${o} · player ${this._modoPlayer} · ${a}`,
      performance.now() - this._liveIniciadoEm,
      !1
    ), this._estadoAoVivo = "fallback", this._fallbackAoVivo = e, this._pararAoVivo(), this._sincronizarCameras();
  }
  _pararAoVivo() {
    z(x, this._timerAoVivo), this._timerAoVivo = void 0, z(x, this._timerQuadroVerde), this._timerQuadroVerde = void 0;
    const a = this._liveEl;
    a && (da(x, a, "load", this._aoCarregarAoVivo), da(x, a, "streams", this._aoInformarStreams), a.remove()), this._liveEl = void 0, this._liveEntity = "", this._livePronto = "", this._quadroVerdeRegistrado = "", this._modoPlayer = "nenhum";
  }
  /**
   * A métrica que o usuário de fato sente: **quanto tempo desde abrir o cômodo
   * até a imagem aparecer**.
   *
   * Não é a duração da requisição. Quem busca o primeiro quadro é o próprio
   * elemento de imagem, e o relógio que importa começa quando a subview monta —
   * é isso que ele chama de "demora para renderizar". Só o primeiro por
   * montagem: os seguintes são atualização, não espera.
   */
  _marcarQuadroNaTela(a) {
    if (this._quadrosNaTela.has(a)) return;
    this._quadrosNaTela.add(a);
    const e = a.split(".")[1] ?? a;
    G(`câmera ${e} · até aparecer`, performance.now() - this._montadoEm, !0);
  }
  /**
   * O elemento não conseguiu baixar o primeiro quadro sozinho.
   *
   * Sem isto a tela ficaria vazia até o motor entrar, uma cadência inteira
   * depois. Uma vez por câmera por montagem: se a segunda também falhar, quem
   * cuida é o ciclo normal, com o recuo dele.
   */
  _socorrerCamera(a) {
    this._socorros.has(a) || (this._socorros.add(a), this._motorCameras.buscarAgora(a));
  }
  /**
   * Vigia do primeiro quadro.
   *
   * O `@error` do elemento cobre a falha declarada. Não cobre o caso do
   * Q. Miguel, medido em 2026-08-07: o pedido do elemento **trava** — não
   * carrega e não dá erro — e a tela fica vazia até o motor entrar, uma cadência
   * inteira depois.
   *
   * O prazo é 4 s porque seis das oito câmeras mostram o primeiro quadro em
   * menos de 5 s: para elas o vigia não custa nada, porque a imagem já chegou.
   * Só as travadas pagam uma requisição a mais, e para elas vale.
   */
  _armarVigiaDeCameras() {
    for (const a of this._camerasConfiguradas())
      D(x, () => {
        !this.isConnected || this._quadrosNaTela.has(a.entity) || this._socorrerCamera(a.entity);
      }, Ni);
  }
  /** Põe na tela o quadro que o motor acabou de baixar. */
  _quadroPronto(a, e) {
    this._urlsCarregadas[a] = e;
    const o = this.shadowRoot?.querySelector(
      `img[data-camera-entity="${a}"]`
    );
    o && (o.src = e, o.classList.add("is-loaded"), o.closest(".camera-main")?.classList.add("has-loaded-image"));
  }
  /**
   * Injeta a folha de material do tema no shadow root.
   *
   * `subviewStyles()` devolve o CSS da pele das tiles (câmeras, hub, A/C,
   * cartela de iluminação). As subviews atuais o interpolam dentro do próprio
   * `<style>`; aqui ele entra como folha adotada, depois das folhas estáticas,
   * para manter a mesma ordem de cascata.
   *
   * O módulo pode ainda não ter carregado quando o componente conecta — daí a
   * segunda tentativa no próximo quadro.
   */
  _injetarMaterial(a = 0) {
    const e = this.shadowRoot;
    if (!e || this._materialInjetado || !this.isConnected) return;
    const i = globalThis.BrunoSurfaceMaterial?.subviewStyles?.();
    if (!i) {
      a < 20 && D(x, () => this._injetarMaterial(a + 1), 60);
      return;
    }
    try {
      const t = new CSSStyleSheet();
      t.replaceSync(i), e.adoptedStyleSheets = [...e.adoptedStyleSheets, t], this._materialInjetado = !0;
    } catch {
      const t = document.createElement("style");
      t.textContent = i, e.appendChild(t), this._materialInjetado = !0;
    }
  }
  /**
   * Os atributos do host são o interruptor de cada bloco de CSS.
   *
   * Ficam no HOST, não numa classe interna, porque o CSS gerado usa
   * `:host([data-…])` — é o que permite base e blocos conviverem na mesma folha
   * sem o grid da Cozinha valer para todos.
   */
  _aplicarAtributos() {
    const a = this._room;
    if (!a) return;
    this.setAttribute("data-room", a.id);
    const e = this._sub?.entities, o = (i, t) => {
      t ? this.setAttribute(i, "") : this.removeAttribute(i);
    };
    o("data-appliances", !!(e?.appliances ?? e?.dishwasher)), o("data-tvhub", !!e?.tv), this._folha ? this.setAttribute("data-folha", this._folha) : this.removeAttribute("data-folha"), this._folhaSaindo ? this.setAttribute("data-folha-saindo", "") : this.removeAttribute("data-folha-saindo"), o("data-ps5", !!e?.ps5);
  }
  /** O Office troca o hub de midia pela Estacao de Trabalho, com o PC. */
  get _temPc() {
    const a = this._sub?.entities;
    return !!(a?.pcSession ?? a?.pcActive ?? a?.pcPower);
  }
  /** O cômodo tem eletrodomésticos? Só a Cozinha, e ela usa um grid próprio. */
  get _temEletrodomesticos() {
    const a = this._sub?.entities;
    return !!(a?.appliances ?? a?.dishwasher);
  }
  static {
    this.styles = [
      /*
       * BASE DA FASE 6.2 — escala fluida + container query.
       *
       * Hoje o CSS gerado tem 1.257 valores em px fixos, calibrados num único
       * tablet. A saída não é somar breakpoints (eles se multiplicam por
       * aparelho): é medir relativo ao CONTAINER, com piso e teto.
       *
       * Estas duas linhas NÃO mudam nada por si: enquanto as regras continuarem
       * em px, o layout é idêntico. Elas apenas tornam `cqi` disponível, que é o
       * pré-requisito de cada módulo extraído daqui em diante — sem
       * `container-type`, `cqi` não resolve e todo valor fluido vira zero.
       *
       * Verificado: geometria dos módulos idêntica antes e depois, em 1920x1200 e
       * 1280x720. Ver docs/24-performance-baseline.md.
       */
      qe,
      _`
      :host {
        container-type: inline-size;
        container-name: subview;
      }
    `,
      fi,
      vi,
      xi,
      _i,
      ...Object.values(Ai),
      _`
      /*
       * Vídeo ao vivo (Fase 6.2B parte 2).
       *
       * Mesma caixa da imagem, uma camada ACIMA dela, e com o mesmo tratamento
       * de cor — a troca entre instantâneo e vídeo não pode aparecer como um
       * salto de brilho. Nasce invisível: só aparece quando o stream toca de
       * fato. Enquanto isso o instantâneo está embaixo, e é o que se vê.
       */
      .camera-live-slot {
        position: absolute;
        inset: 0;
        z-index: 2;
        pointer-events: none;
      }
      .camera-live-slot:empty {
        display: none;
      }
      /*
       * O player nativo cobre a caixa inteira e recebe o mesmo tratamento de cor
       * do instantâneo — a troca entre os dois não pode aparecer como salto de
       * brilho. O instantâneo continua embaixo, como rede de segurança.
       */
      /*
       * As regras abaixo são cópia literal das que a subview de câmeras usa e
       * que estão provadas nesta instalação. O "!important" não é exagero: o
       * "hui-image" dimensiona a si próprio por proporção, e sem forçar ele não
       * preenche o palco.
       */
      .camera-live-slot > *,
      .camera-live-slot hui-image,
      .camera-live-el {
        display: block;
        width: 100% !important;
        height: 100% !important;
      }
      .camera-live-slot video,
      .camera-live-slot img {
        width: 100% !important;
        height: 100% !important;
        object-fit: cover !important;
      }
      .camera-live-el {
        filter: brightness(0.86) saturate(0.94);
        opacity: 0;
        transition: opacity 160ms ease;
      }
      .camera-live-el.is-ready {
        opacity: 1;
      }

      :host {
        display: block;
        width: 100%;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }

      /* Na subview atual o elemento interno do anel e uma DIV, e o anel mede 203,27px. Com um
         SVG no lugar dela media 203,00 exatos, e esse quarto de pixel movia o
         anel 1px para baixo no arredondamento — 424 contra os 423 da
         referencia. Com height 100% o anel mede 203,00 e o real 203,27: fica 1px acima no
         arredondamento. Um quarto de pixel num elemento interno, invisivel, e
         perseguir isso custaria mais do que vale — os seis modulos da linha de
         base batem exatos. */
      .icg-root {
        width: 100%;
        height: 100%;
        display: flex;
      }
      .icg-root > svg {
        display: block;
        width: 100%;
        height: 100%;
      }

      /* Ajuste PEDIDO, não paridade: na origem o valor final é 20px de ícone e
         4px de gap — os 28px/11px que aparecem antes no arquivo são de uma
         definição sobrescrita depois. O usuário pediu um pouco maior e mais
         respiro, então a mudança fica aqui, no componente, e o CSS gerado segue
         cópia fiel do original. */
      /* ÍCONE DA CÉLULA DE LUZ — a causa raiz, depois de três tentativas minhas
         que não surtiram efeito nenhum.

         O elemento bruno-icon se dimensiona assim, no próprio shadow root:

             width:  var(--mdc-icon-size, 1em);
             height: var(--mdc-icon-size, 1em);

         Nada na cadeia da célula define --mdc-icon-size. O glifo caía no
         fallback 1em, isto é, o tamanho da FONTE herdada — cerca de 13px — e
         ficava minúsculo dentro de uma caixa muito maior.

         TENTATIVAS QUE FALHARAM, e por quê (mantidas aqui para não repetir):

           1. aumentar só .lc-icon         -> mexe na CAIXA, não no glifo;
           2. aumentar .tpl-light-icon     -> idem, é só o invólucro;
           3. regra .tpl-light-icon svg    -> NÃO CASA NADA. O <svg> vive dentro
                                              do shadow root do bruno-icon, e um
                                              seletor descendente comum não
                                              atravessa shadow root.

         O que funciona é a propriedade customizada: ela ATRAVESSA o shadow root
         por herança — é exatamente o mecanismo para o qual o bruno-icon foi
         escrito. Por isso o tamanho vai em --mdc-icon-size, e não em width.

         Medição: contar SVG por seletor descendente devolve zero mesmo com o
         ícone desenhado, pela mesma razão. Para medir, alcançar o shadow root
         do bruno-icon. */
      .lc-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon .tpl-light-icon {
        width: 32px;
        height: 32px;
      }
      .lc-icon bruno-icon {
        --mdc-icon-size: 30px;
        width: 30px;
        height: 30px;
      }
      .light-cell {
        grid-template-columns: 32px minmax(0, 1fr) auto;
        gap: 10px;
      }
      .light-grid {
        gap: 8px;
      }

      /* O dock nasce estável — sem barra de rolagem piscando nem célula que
         encolhe e alarga.

         O corpo abre animando a linha do grid de 0fr para 1fr. Enquanto ela
         cresce, o teto de altura do contêiner de rolagem vale quase zero, o
         conteúdo transborda e o navegador mostra a barra — que rouba largura,
         encolhe as duas colunas e, ao terminar a animação, devolve tudo. Duas
         medidas, ambas necessárias:

           1. reservar a calha da barra, para que a largura útil não dependa de
              ela estar presente ou não;
           2. rolagem só DEPOIS de assentar — durante a abertura o transbordo é
              apenas recortado. */
      .lights-scroll {
        scrollbar-gutter: stable;
      }
      .lights-card:not(.is-settled) .lights-scroll {
        overflow-y: hidden;
      }
    `,
      // ÚLTIMO de propósito: o layout de telefone sombreia os oito blocos
      // `@media (max-width: 800px)` que vieram dos arquivos originais. Ver o
      // cabeçalho de subview-phone.styles.ts.
      Si
    ];
  }
  /**
   * Barra superior — seis badges e o relógio.
   *
   * Transcrito de `_renderTopBand`. A ordem importa: a Presença é a PRIMEIRA
   * desde 2026-07-29, quando o rodapé saiu e ela subiu para cá. As três marcadas
   * com `data-phone-hide` somem no telefone — a regra era posicional
   * (`nth-child(n+4)`) e virou explícita justamente porque a Presença mudou as
   * posições.
   *
   * O azul da Presença é o mesmo dot dos cards de cômodo (96,165,250) e lê a
   * mesma fonte — `motion_recent` —, para painel e subview nunca discordarem.
   */
  _renderTopBand() {
    const a = this._room?.entities, e = this._hass, o = (c) => c && e ? e.states[c] : void 0, i = this._contarLuzes(), t = o(a?.motionRecent)?.state === "on", n = [
      {
        icon: "mdi:motion-sensor",
        titulo: "Presença",
        sub: this._linhaPresenca(),
        tone: "96,165,250",
        ativo: t,
        ocultarNoTelefone: !0
      },
      {
        icon: "mdi:lightbulb",
        titulo: "Luzes",
        sub: this._linhaLuzes(),
        tone: "247,198,0",
        ativo: i > 0,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:thermometer",
        titulo: "Temperatura",
        sub: this._valorSensor(this._idDe("temperature") ?? a?.temperature, "°", 1),
        tone: "247,170,90",
        ativo: !1,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:water-percent",
        titulo: "Umidade",
        sub: this._valorSensor(this._idDe("humidity") ?? a?.humidity, "%", 0),
        tone: "127,200,233",
        ativo: !1,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:router-wireless",
        titulo: "Roteador",
        sub: this._linhaRede(this._idDe("router")),
        tone: "154,160,166",
        ativo: !1,
        ocultarNoTelefone: !0
      },
      {
        icon: "mdi:zigbee",
        titulo: "Hub Zigbee",
        sub: this._linhaRede(this._idDe("zigbeeHub")),
        tone: "154,160,166",
        ativo: !1,
        ocultarNoTelefone: !0
      }
    ];
    return p`
      <header class="subview-topband">
        <div class="topband-badges">
          ${n.map(
      (c) => p`
              <div
                class="tb-badge ${c.ativo ? "is-active" : ""}"
                data-phone-hide=${c.ocultarNoTelefone ? "" : h}
                style="--tone: ${c.tone};"
              >
                <span class="tb-badge-icon"><bruno-icon icon=${c.icon}></bruno-icon></span>
                <span class="tb-badge-text">
                  <span class="tb-badge-title">${c.titulo}</span>
                  <span class="tb-badge-sub">${c.sub}</span>
                </span>
              </div>
            `
    )}
        </div>
        <div class="topband-clock" aria-label="Data e hora">
          <span data-clock>${this._hora()}</span>
          <small>${this._data()}</small>
        </div>
      </header>
    `;
  }
  _contarLuzes() {
    const a = this._hass, e = this._room?.entities;
    return !a || !e?.lights ? 0 : e.lights.filter((o) => a.states[o]?.state === "on").length;
  }
  /**
   * Legenda da badge de luzes — acesas POR ZONA.
   *
   * As subviews atuais escrevem "Sala 3 · Varanda 4" nos quatro cômodos com duas
   * zonas, e "Office 2" / "Cozinha 1" nos dois de zona única. Em todos os seis o
   * texto é a chave da zona com inicial maiúscula, então a linha sai da própria
   * lista de luzes em vez de uma tabela paralela. Eu vinha escrevendo
   * "2 acesas", que perdia a divisão por zona.
   */
  _linhaLuzes() {
    const a = this._luzesDaConfiguracao();
    if (!a.length) return `${this._contarLuzes()} acesas`;
    const e = /* @__PURE__ */ new Map();
    for (const o of a) {
      const i = o.zone || "sala", t = this._hass?.states[o.entity]?.state === "on" ? 1 : 0;
      e.set(i, (e.get(i) ?? 0) + t);
    }
    return [...e.entries()].map(([o, i]) => `${o.charAt(0).toUpperCase()}${o.slice(1)} ${i}`).join(" · ");
  }
  _linhaPresenca() {
    const a = this._hass, e = this._room?.entities;
    if (!a || !e?.semanticState) return "Sensor indisponível";
    const i = a.states[e.semanticState]?.attributes.display;
    return i ? String(i) : a.states[e.motionRecent ?? ""]?.state === "on" ? "Presença" : "Sem presença";
  }
  /**
   * Leitura de um sensor da barra superior.
   *
   * Casas decimais e o traço de indisponível vêm dos originais: temperatura com
   * uma casa, umidade inteira, e `--` quando não há leitura. O grau é o SINAL DE
   * GRAU (U+00B0), não o ordinal masculino — este último desenha um traço sob o
   * círculo e destoa do resto do painel.
   */
  _valorSensor(a, e, o = 0) {
    const i = a && this._hass ? this._hass.states[a] : void 0, t = String(i?.state ?? "").toLowerCase();
    return !i || ["unknown", "unavailable", "none", ""].includes(t) ? "--" : `${U(i.state, o)}${e}`;
  }
  /** Roteador e hub Zigbee: "Online" quando conectado, senão o próprio estado. */
  _linhaRede(a) {
    if (!a) return "Online";
    const e = String(this._hass?.states[a]?.state ?? "Online");
    return ["on", "home", "connected", "online"].includes(e.toLowerCase()) ? "Online" : e;
  }
  _hora() {
    return (/* @__PURE__ */ new Date()).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  }
  /**
   * Data da barra superior.
   *
   * As tabelas são fixas de propósito: `toLocaleDateString` em pt-BR devolve
   * "segunda-feira, 5 de ago." — o " de " e o ponto final deixavam a linha 30px
   * mais larga que a das subviews atuais e empurravam o relógio para a esquerda.
   */
  _data() {
    const a = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"], e = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"], o = /* @__PURE__ */ new Date();
    return `${a[o.getDay()]}, ${o.getDate()} ${e[o.getMonth()]}`;
  }
  /**
   * Abre e fecha o dock de iluminação.
   *
   * A transição do corpo é de 200 ms; a folga de 40 ms cobre o quadro em que o
   * navegador ainda está compondo. Só depois disso o corpo passa a rolar.
   */
  _alternarDock() {
    this._lightsOpen = !this._lightsOpen, this._luzesAssentadas = !1, z(x, this._timerLuzes), this._timerLuzes = D(x, () => {
      this._luzesAssentadas = this._lightsOpen, this._timerLuzes = void 0, this.requestUpdate();
    }, 240), this.requestUpdate();
  }
  /**
   * No tablet o titulo conserva o comportamento historico de expandir/recolher
   * o dock. Na folha do telefone ele passa a ser o controle de retorno pedido
   * no ajuste pos-dispositivo: o chevron ao lado do titulo fecha a folha.
   */
  _acionarCabecalhoLuzes() {
    if (this._estaNoTelefone() && this._folha === "luzes") {
      this._fecharFolha();
      return;
    }
    this._alternarDock();
  }
  /**
   * Troca a fonte do acordeao sem depender de uma atualizacao do HA.
   *
   * Esses campos nao usam decorador reativo. Informar ao Lit o valor anterior
   * garante a reconciliacao imediata no WebView; um `requestUpdate()` generico
   * podia ser absorvido durante outro update e manter TV/PC visualmente presos
   * mesmo depois de um toque explicito no Spotify.
   */
  _selecionarFonteMidia(a) {
    const e = this._fonteMidia;
    this._fonteMidia = a, this._fonteMidiaManual = this._estaNoTelefone(), this._menuMidiaAberto = !1, this.requestUpdate("_fonteMidia", e);
  }
  _iniciarVigiaTelefone() {
    typeof globalThis.matchMedia == "function" && (this._pararVigiaTelefone(), this._mediaTelefone = globalThis.matchMedia("(max-width: 800px)"), this._mediaTelefone.addEventListener("change", this._aoMudarModoTelefone), this._mediaTelefone.matches || this._limparFolhaImediatamente());
  }
  _pararVigiaTelefone() {
    this._mediaTelefone?.removeEventListener("change", this._aoMudarModoTelefone), this._mediaTelefone = void 0;
  }
  _estaNoTelefone() {
    return this._mediaTelefone ? this._mediaTelefone.matches : typeof globalThis.matchMedia != "function" ? !0 : globalThis.matchMedia("(max-width: 800px)").matches;
  }
  /**
   * Mantém câmera e faixa de tiles no mesmo pixel ao montar/desmontar uma folha.
   * Safari/WebView pode aplicar scroll anchoring ao conteúdo da subview quando
   * um descendente fixed muda de display. A Sala não evidenciava o efeito, mas
   * Office e Quartos, com corpos de mídia diferentes, sim.
   */
  _preservarBaseDuranteFolha() {
    if (!this._estaNoTelefone()) return;
    let a = this.parentNode, e;
    for (; a; ) {
      if (a instanceof HTMLElement) {
        const n = globalThis.getComputedStyle?.(a);
        if (n && /(auto|scroll)/.test(n.overflowY)) {
          e = a;
          break;
        }
      }
      if (a.parentNode) {
        a = a.parentNode;
        continue;
      }
      const t = a.getRootNode();
      a = t instanceof ShadowRoot && t.host !== a ? t.host : null;
    }
    if (!e) return;
    const o = this.getBoundingClientRect().top, i = e.scrollTop;
    this.updateComplete.then(() => {
      globalThis.requestAnimationFrame(() => {
        if (!e?.isConnected) return;
        const t = this.getBoundingClientRect().top - o;
        e.scrollTop = Math.max(0, i + t);
      });
    });
  }
  /**
   * Ancora a altura máxima da folha no topo REAL da Cortina.
   *
   * O cálculo anterior usava apenas dvh e uma reserva estimada. Safe-area,
   * escala do WebView e altura efetiva da câmera podem divergir no iPhone. A
   * medição ocorre somente no telefone e publica um token CSS; não redesenha o
   * tablet nem muda a geometria da câmera.
   */
  _sincronizarLimiteFolhaTelefone() {
    if (!this._estaNoTelefone()) {
      this.style.removeProperty("--fone-folha-top");
      return;
    }
    const a = this.renderRoot.querySelector(".curtain-dock"), e = this.renderRoot.querySelector(".cameras-card"), o = a?.getBoundingClientRect().top ?? (e?.getBoundingClientRect().bottom ?? 0) + 8;
    if (!Number.isFinite(o) || o <= 0) return;
    const i = `${Math.round(o)}px`;
    this.style.getPropertyValue("--fone-folha-top") !== i && this.style.setProperty("--fone-folha-top", i);
  }
  /**
   * Faz as quatro linhas visuais de Sala e Q. Miguel caberem exatamente na
   * área útil da folha, sem depender da altura nominal do aparelho.
   *
   * O WebView do iPhone perde pixels para barras e safe-area. Por isso um
   * valor que cabia no banco 428 x 926 ainda rolava no aparelho. Aqui se mede
   * o espaço não ocupado por cabeçalhos, separadores e gaps e se divide apenas
   * o restante pelas linhas reais de cada grid. O resultado fica limitado à
   * faixa ergonômica de 56 a 60 px; telas menores continuam com scroll como
   * proteção, em vez de comprimir o alvo indefinidamente.
   */
  _sincronizarAlturaLuzesTelefone() {
    const a = "--fone-luz-cell-h";
    if (!this._estaNoTelefone() || this._folha !== "luzes") {
      this.style.removeProperty(a);
      return;
    }
    const e = this.renderRoot.querySelector(".lights-scroll"), o = [...this.renderRoot.querySelectorAll(".light-grid")];
    if (!e || !o.length || e.clientHeight <= 0) return;
    let i = 0, t = 0, n = 0;
    for (const d of o) {
      const u = d.querySelectorAll(".light-cell").length, g = Math.ceil(u / 2);
      if (!g) continue;
      const f = Number.parseFloat(getComputedStyle(d).rowGap) || 0;
      i += g, t += d.getBoundingClientRect().height, n += Math.max(0, g - 1) * f;
    }
    if (!i) return;
    const c = Math.max(0, e.scrollHeight - t), s = (e.clientHeight - c - n - 2) / i, l = Math.floor(Math.max(56, Math.min(60, s)) * 10) / 10;
    if (!Number.isFinite(l)) return;
    const m = `${l}px`;
    this.style.getPropertyValue(a) !== m && this.style.setProperty(a, m);
  }
  // ── Cenário B: linhas-resumo e folha (SÓ no telefone) ─────────────────────
  //
  // O DOM é o mesmo nos dois modos. O que muda é o CSS: acima de 800px as
  // linhas e o escurecimento ficam `display: none` e os módulos completos
  // seguem no fluxo, exatamente como hoje. Abaixo de 800px é o inverso.
  //
  // Isso evita o contrato de modo em JS: nada aqui pergunta "é telefone?".
  // O único estado é qual folha está aberta, e no tablet ele nunca sai de null
  // porque as linhas que o mudam não são clicáveis lá.
  /** Abre a folha do módulo, ou fecha se já for a que está aberta. */
  _abrirFolha(a) {
    if (this._estaNoTelefone()) {
      if (this._folha === a && !this._folhaSaindo) {
        this._fecharFolha();
        return;
      }
      z(x, this._timerFecharFolha), this._timerFecharFolha = void 0, this._folhaSaindo = !1, this._folha = a, this._folha === "luzes" && (this._lightsOpen = !0, this._luzesAssentadas = !0), this._aplicarAtributos(), this._avisarFolha(), this.requestUpdate(), this._preservarBaseDuranteFolha();
    }
  }
  _fecharFolha() {
    if (!this._folha || this._folhaSaindo) return;
    if (this._encerrarArrasto(), this._folhaSaindo = !0, this._aplicarAtributos(), this.requestUpdate(), this._preservarBaseDuranteFolha(), typeof globalThis.matchMedia == "function" && globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      this._limparFolhaImediatamente();
      return;
    }
    this._timerFecharFolha = D(x, () => {
      this._timerFecharFolha = void 0, this._limparFolhaImediatamente();
    }, 280);
  }
  _limparFolhaImediatamente(a = !0) {
    const e = !!this._folha;
    z(x, this._timerFecharFolha), this._timerFecharFolha = void 0, this._folhaSaindo = !1, this._folha = null, this._encerrarArrasto(), this._aplicarAtributos(), e && a && this._avisarFolha(), this.requestUpdate(), this._preservarBaseDuranteFolha();
  }
  /**
   * O botão discreto de fechar, no cabeçalho de cada folha.
   *
   * Ele vive dentro dos módulos, que são os MESMOS do tablet — no tablet o CSS
   * o esconde (ver o bloco `min-width: 801px` em `subview-phone.styles.ts`).
   * É o terceiro caminho de fechamento do item 12 do roteiro; os outros dois
   * (arrastar para baixo e tocar fora) não têm marcação visível.
   */
  _botaoFecharFolha() {
    return p`
      <button
        type="button"
        class="folha-x"
        aria-label="Fechar"
        @click=${() => this._fecharFolha()}
      >
        <!-- ANTERIOR (rollback pos-device): bruno-icon mdi:close. No WebView
             real o glifo nao foi resolvido e restou apenas um circulo vazio. -->
        <span class="folha-x-glyph" aria-hidden="true">&times;</span>
      </button>
    `;
  }
  /**
   * Chevron discreto ao lado do titulo das folhas de telefone.
   *
   * O X anterior continua montado e escondido pelo CSS como caminho de rollback.
   * Acima de 800px este botao tambem fica oculto, preservando o cabecalho tablet.
   */
  _botaoRecolherFolha() {
    return p`
      <button
        type="button"
        class="folha-recolher"
        aria-label="Recolher painel"
        @click=${() => this._fecharFolha()}
      >
        <bruno-icon icon="mdi:chevron-down"></bruno-icon>
      </button>
    `;
  }
  /** O elemento que ESTÁ servindo de folha agora, ou null. */
  _folhaEl() {
    const a = {
      luzes: ".glass-card.lights-card",
      ac: ".glass-card.ac-card",
      midia: ".glass-card.media-hub-card",
      eletro: ".glass-card.appliances-card"
    }, e = this._folha;
    return e ? this.renderRoot.querySelector(a[e]) : null;
  }
  _encerrarArrasto() {
    this._arrastoAlvo && (this._arrastoAlvo.style.transform = ""), this._arrastoY = null, this._arrastoAlvo = null, globalThis.removeEventListener("pointermove", this._moverArrasto), globalThis.removeEventListener("pointerup", this._soltarArrasto), globalThis.removeEventListener("pointercancel", this._cancelarArrasto);
  }
  /**
   * Avisa a shell que há folha aberta.
   *
   * No telefone a shell dá `z-index: 2` ao dock e `1` ao conteúdo. Uma bottom
   * sheet que sobe da borda inferior precisa cobrir o dock — e nenhum z-index
   * daqui de dentro alcança isso, porque a pilha é decidida um nível acima.
   * Então a shell ergue o slot de conteúdo enquanto a folha existe, e o baixa
   * quando ela fecha. É o mínimo de contrato para a folha ser folha.
   */
  _avisarFolha() {
    this.dispatchEvent(
      new CustomEvent("bruno-folha", {
        detail: { aberta: !!this._folha },
        bubbles: !0,
        composed: !0
      })
    );
  }
  /**
   * As linhas-resumo do telefone.
   *
   * A lista sai do que o cômodo TEM: a Cozinha não tem A/C nem hub de mídia e
   * tem eletrodomésticos; o Office troca o hub pela Estação de Trabalho, que
   * mora no mesmo `.media-hub-card`. Nenhuma linha aparece sem o módulo
   * correspondente existir, senão a folha subiria vazia.
   */
  _linhasResumo() {
    const a = [
      {
        chave: "luzes",
        icone: "mdi:lightbulb-group",
        tom: "tone-amber",
        titulo: "Iluminação",
        resumo: this._linhaLuzes()
      }
    ];
    return this._temEletrodomesticos ? a.push({
      chave: "eletro",
      icone: "mdi:home-lightning-bolt-outline",
      tom: "tone-amber",
      titulo: "Eletrodomésticos",
      resumo: this._resumoEletrodomesticos()
    }) : a.push({
      chave: "midia",
      // ANTERIOR (rollback): no Office o launcher usava
      // mdi:desktop-tower-monitor, diferente do mdi:desk do cabeçalho.
      icone: this._temPc ? "mdi:desk" : "mdi:music",
      tom: "tone-blue",
      // ANTERIOR (rollback refinamento mobile): o launcher dizia apenas
      // "Mídia", embora a folha e o roteiro usem o nome completo do módulo.
      titulo: this._temPc ? "Estação de trabalho" : "Hub de Mídia",
      resumo: this._resumoMidia()
    }), this._estadoClimate() && a.push({
      chave: "ac",
      icone: "mdi:snowflake",
      tom: "tone-blue",
      titulo: "Ar-condicionado",
      resumo: this._resumoClimate()
    }), a;
  }
  /** "Frio · 23°" — mesmo vocabulário do card completo, via `_rotuloModo`. */
  _resumoClimate() {
    const a = this._modeloClimate();
    if (a.indisponivel) return "Indisponível";
    if (!a.ativo) return "Desligado";
    const e = this._rotuloModo(String(a.modo));
    return a.alvo == null ? e : `${e} · ${U(a.alvo)}°`;
  }
  /**
   * O mesmo resumo que a fonte ativa mostra dentro do hub.
   *
   * A ordem de prioridade é a do próprio hub (PC ou TV primeiro, Spotify
   * depois) — se divergisse, a linha diria uma coisa e a folha outra.
   */
  _resumoMidia() {
    if (this._temPc) return this._modeloPc().ativo ? "Ligado" : "Desligado";
    const a = this._modeloTv();
    if (a.ativo) return `Ligada · ${a.fonte}`;
    const e = this._modeloSpotify();
    return e.ativo ? e.titulo : "Nada tocando";
  }
  /**
   * "1 de 5 ligados" — conta só o que tem tomada.
   *
   * Os `placeholder: true` da configuração da Cozinha (air fryer, geladeira)
   * não têm entidade e nunca contariam como ligados; incluí-los no total faria
   * a linha parecer sempre incompleta.
   */
  _resumoEletrodomesticos() {
    const a = this._sub?.entities?.appliances;
    if (!Array.isArray(a) || !a.length) return "Sem aparelhos";
    const e = a.filter((i) => !i.placeholder && i.entity);
    return e.length ? `${e.filter((i) => {
      const t = this._hass?.states[String(i.stateEntity ?? i.entity)]?.state, n = Array.isArray(i.activeStates) ? i.activeStates : ["on"];
      return t != null && n.includes(String(t));
    }).length} de ${e.length} ligados` : `${a.length} sem tomada`;
  }
  /**
   * As linhas + o escurecimento.
   *
   * O escurecimento fica ABAIXO da câmera na pilha de camadas (o CSS dá
   * `z-index` maior ao módulo de câmeras), então ela continua acesa e clicável
   * com a folha aberta — que é a razão de o usuário ter escolhido este cenário.
   * Tocar no escurecimento fecha.
   */
  /*
   * ANTERIOR (rollback rev. faixa-de-tiles): depois do scrim era renderizado
   * um button com classe folha-fechar e texto "Concluir". Ele foi retirado do
   * DOM porque fechamento nao e etapa de formulario. Permanecem os tres gestos
   * previstos: X no cabecalho, toque fora e arrasto para baixo.
   */
  _renderResumoTelefone() {
    const a = this._linhasResumo();
    return p`
      <div
        class="folha-scrim"
        aria-hidden="true"
        @click=${() => this._fecharFolha()}
      ></div>
      <div class="resumo-telefone">
        ${a.map(
      (e) => p`
            <button
              type="button"
              class="resumo-linha ${this._folha === e.chave ? "is-active" : ""}"
              aria-expanded=${this._folha === e.chave ? "true" : "false"}
              @click=${() => this._abrirFolha(e.chave)}
            >
              <span class="micro-icon ${e.tom}"><bruno-icon icon=${e.icone}></bruno-icon></span>
              <span class="resumo-texto">
                <span class="resumo-titulo">${e.titulo}</span>
                <span class="resumo-estado">${e.resumo}</span>
              </span>
              <!-- ANTERIOR (rollback rev. faixa-de-tiles): mdi:chevron-up,
                   girado 180deg pelo CSS. O roteiro pede chevron discreto
                   apontando para a direita: a linha abre um SEGUNDO NIVEL
                   (bottom sheet), nao expande no lugar. -->
              <span class="resumo-chevron" aria-hidden="true">
                <bruno-icon icon="mdi:chevron-right"></bruno-icon>
              </span>
            </button>
          `
    )}
      </div>
    `;
  }
  _renderLightsDock() {
    const a = this._lightsOpen, e = [
      "glass-card",
      "lights-card",
      a ? "is-open" : "",
      // Só depois que a animação termina o corpo pode rolar. Ver a nota em
      // `static styles`: rolar durante a abertura é o que fazia a barra piscar
      // e as células encolherem.
      this._luzesAssentadas ? "is-settled" : ""
    ].filter(Boolean).join(" ");
    return p`
      <div class=${e}>
        <div class="lights-dock">
          <button
            type="button"
            class="lights-dock-id"
            aria-expanded=${a ? "true" : "false"}
            @click=${() => this._acionarCabecalhoLuzes()}
          >
            <span class="micro-icon tone-amber"><bruno-icon icon="mdi:lightbulb-group"></bruno-icon></span>
            <span class="module-title">Iluminação</span>
            <span class="lights-dock-chevron" aria-hidden="true">
              <bruno-icon
                icon=${this._estaNoTelefone() && this._folha === "luzes" ? "mdi:chevron-down" : "mdi:chevron-up"}
              ></bruno-icon>
            </span>
          </button>
          <div class="lights-dock-actions">
            <button type="button" class="chip-button is-active" @click=${() => this._todasAsLuzes("turn_on")}>
              Todas acesas
            </button>
            <button type="button" class="chip-button" @click=${() => this._todasAsLuzes("turn_off")}>
              Apagar todas
            </button>
            ${this._botaoFecharFolha()}
          </div>
        </div>
        <div class="lights-body">
          <div class="lights-body-clip">
            <div class="lights-scroll">${this._renderSecoesDeLuz()}</div>
          </div>
        </div>
      </div>
    `;
  }
  /**
   * Seções de zona dentro do dock, com a grade de células de luz.
   *
   * As luzes vêm da configuração gerada (`entities.lights`), cada uma com
   * `zone`, `name` e `icon_type`. A ordem das zonas é a de aparição na lista, e
   * não uma lista fixa: é assim que a Sala tem "Sala" e "Varanda" e os demais
   * têm só uma.
   *
   * Célula larga na primeira posição quando a contagem é ÍMPAR — a luz principal
   * ocupa a linha inteira. Os filetes são por célula, não por gap: com gap o
   * fundo vazaria por baixo.
   */
  _renderSecoesDeLuz() {
    const a = this._luzesDaConfiguracao();
    if (!a.length) return h;
    const e = this._sub?.lightZoneLabels ?? {}, o = this._sub?.lightZoneIcons ?? {}, i = { sala: "Sala", varanda: "Varanda" }, t = { sala: "mdi:sofa-outline", varanda: "bruno:balcony" }, n = [];
    for (const l of a) n.includes(l.zone) || n.push(l.zone);
    const c = n.map((l) => {
      const m = a.filter((d) => d.zone === l);
      return {
        chave: l,
        // Sem rotulo mapeado, a chave vira o nome com inicial maiuscula: no
        // Office e na Cozinha a zona unica saia como "office" e "cozinha".
        nome: e[l] ?? i[l] ?? l.charAt(0).toUpperCase() + l.slice(1),
        icone: o[l] ?? t[l] ?? "mdi:lightbulb-group",
        luzes: m,
        acesas: m.filter((d) => this._hass?.states[d.entity]?.state === "on").length
      };
    }).filter((l) => l.luzes.length > 0), s = c.length > 1;
    return c.map((l) => {
      const m = l.luzes.length % 2 === 1;
      return p`
        <section class="light-section">
          <div class="section-head">
            <span class="zone-icon"><bruno-icon icon=${l.icone}></bruno-icon></span>
            <span class="zone-id">
              <strong>${l.nome}</strong>
              <small>${l.acesas}/${l.luzes.length} acesas</small>
            </span>
            ${s ? p`<button
                  type="button"
                  class="zone-off"
                  @click=${() => this._apagarZona(l.luzes)}
                >
                  Apagar ${l.nome.toLowerCase()}
                </button>` : h}
          </div>
          <div class="light-grid">
            ${l.luzes.map((d, u) => this._renderCelulaDeLuz(d, u, m))}
          </div>
        </section>
      `;
    });
  }
  _luzesDaConfiguracao() {
    const a = this._sub?.entities?.lights;
    return Array.isArray(a) ? a.filter((e) => !!e && typeof e == "object").filter((e) => typeof e.entity == "string" && !e.placeholder).map((e) => ({
      entity: String(e.entity),
      name: String(e.name ?? "Luz"),
      zone: String(e.zone ?? "sala"),
      icon: typeof e.iconType == "string" ? e.iconType : void 0
    })) : [];
  }
  _renderCelulaDeLuz(a, e, o) {
    const i = this._hass?.states[a.entity]?.state === "on", t = o && e === 0, n = o ? e - 1 : e, c = t ? 0 : Math.floor(n / 2) + (o ? 1 : 0), s = [
      "light-cell",
      i ? "is-on" : "",
      t ? "is-wide" : "",
      !t && c > 0 ? "has-rule-top" : "",
      !t && n % 2 === 1 ? "has-rule-left" : ""
    ].filter(Boolean).join(" ");
    return p`
      <button
        type="button"
        class=${s}
        role="switch"
        aria-checked=${i ? "true" : "false"}
        aria-label=${a.name}
        @click=${() => this._alternarLuz(a.entity)}
      >
        <span class="lc-icon">${this._iconeDaLuz(a.icon, i)}</span>
        <span class="lc-name">${a.name}</span>
        <span class="lc-switch" aria-hidden="true"><span class="lc-knob"></span></span>
      </button>
    `;
  }
  /**
   * Ícone da luz — SVG do conjunto próprio, não um `mdi:`.
   *
   * As subviews atuais chamam `BrunoIcons.render()` com nomes do conjunto do
   * projeto: `ledstrip`, `pendant`, `light_flush`. Eu havia mapeado esses nomes
   * para equivalentes `mdi:`, e o resultado era um ícone minúsculo ou um círculo
   * — o `mdi:` correspondente não existe, e o `bruno-icon` cai no genérico.
   *
   * A marcação de fora (`tpl-light-icon`, `icon-<nome>`, `is-on`) é o que o CSS
   * usa para dimensionar e colorir; sem ela o glifo fica sem tamanho.
   */
  _iconeDaLuz(a, e) {
    const i = String(a ?? "light_flush").replace(/^mdi:/, "").replace(/[^a-z0-9_-]/gi, "") || "light_flush";
    return p`<span class="tpl-light-icon icon-${i} ${e ? "is-on" : ""}">
      <bruno-icon icon=${i}></bruno-icon>
    </span>`;
  }
  _alternarLuz(a) {
    this._hass && this._hass.callService("light", "toggle", { entity_id: a }, { entity_id: a });
  }
  _apagarZona(a) {
    if (!this._hass || !a.length) return;
    const e = a.map((o) => o.entity);
    this._hass.callService("light", "turn_off", { entity_id: e }, { entity_id: e });
  }
  _todasAsLuzes(a) {
    const e = this._room?.entities.lightGroup;
    !e || !this._hass || this._hass.callService("light", a, { entity_id: e }, { entity_id: e });
  }
  render() {
    return this._room ? p`
      <main class="room-subview" @pointerdown=${this._iniciarArrasto}>
        ${this._renderTopBand()}
        ${this._temEletrodomesticos ? this._corpoCozinha() : this._corpoPadrao()}
      </main>
    ` : h;
  }
  /**
   * Cinco cômodos: coluna esquerda (hero + linha de câmeras/hub) e coluna
   * direita (dock de luzes + A/C), dentro de `content-left` e `right-column`.
   */
  _corpoPadrao() {
    return p`
      <div class="content-left">
        ${this._renderHero()}
        <div class="cams-media-row">${this._renderCameras()} ${this._renderMediaHub()}</div>
      </div>
      <div class="right-column">${this._renderLightsDock()} ${this._renderAC()}</div>
      ${this._renderResumoTelefone()}
    `;
  }
  /**
   * Hero — a foto do cômodo com o dock de cortina sobreposto na base.
   *
   * A hierarquia de três níveis (`hero-stage` > `hero-content` > `curtain-dock`)
   * não é decorativa: é ela que faz a cortina flutuar sobre a foto sem entrar no
   * fluxo. Lida do DOM renderizado.
   */
  _renderHero() {
    const a = this._entidadeCortina(), e = this._estado(a), o = this._indisponivel(e), i = ["opening", "closing"].includes(String(e?.state));
    return p`
      <div class="hero-panel">
        <div class="hero-stage hero-atmosphere">
          <div class="hero-content">
            <!-- O dock de cortina aparece nos CINCO cômodos com corpo padrão,
                 mesmo onde não há entidade: nos quatro sem cortina ele renderiza
                 inerte, mostrando "Indisponível". Só a Cozinha não o tem, e ela
                 usa outro corpo. Condicioná-lo à entidade tirava o dock de
                 Office, Casal, Marina e Miguel, que o exibem hoje. -->
            <div
              class="curtain-dock curtain-overlay"
              style=${`--curtain-position:${this._fechamentoCortina()}%`}
            >
              <div class="curtain-control-row">
                <div class="curtain-identity">
                  <span class="curtain-icon-shell">
                    <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                  </span>
                  <span class="curtain-title">Cortina</span>
                </div>
                <div class="curtain-status" aria-live="polite">
                  <span class="curtain-status-text">${this._estadoCortina()}</span>
                  <span class="curtain-status-percent">${this._percentualCortina()}</span>
                </div>
                <div class="curtain-main-actions">
                  ${[
      ["cover-open", "open_cover", "Abrir"],
      ["cover-stop", "stop_cover", "Parar"],
      ["cover-close", "close_cover", "Fechar"]
    ].map(
      ([t, n, c]) => p`
                      <button
                        type="button"
                        class="curtain-action-button ${t === "cover-stop" ? "is-muted" : ""} ${t === "cover-stop" && i ? "is-active" : ""}"
                        data-action=${t}
                        ?disabled=${o}
                        @click=${() => this._acionarCortina(n)}
                      >
                        <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                        <span>${c}</span>
                      </button>
                    `
    )}
                </div>
              </div>
              <div class="curtain-slider-zone">
                <div class="curtain-slider-glow"></div>
                <!-- ANTERIOR (rollback funcional da cortina): o range nao tinha
                     evento algum; arrastar o polegar mudava apenas o DOM local. -->
                <input
                  class="curtain-range"
                  type="range"
                  min="0"
                  max="100"
                  step="1"
                  .value=${String(this._fechamentoCortina())}
                  aria-label="Percentual de fechamento da cortina"
                  ?disabled=${o}
                  @input=${(t) => this._previsualizarFechamentoCortina(t)}
                  @change=${(t) => this._posicionarCortinaPorFechamento(Number(t.currentTarget.value))}
                />
                <!-- As marcas sao BOTOES, nao rotulos: cada uma leva a cortina
                     para aquela posicao. Como span elas mediam 17px em vez de
                     22px, e eram os 5px que faltavam na altura do dock. -->
                <div class="curtain-marks">
                  ${[0, 25, 50, 75, 100].map(
      (t) => p`
                      <button
                        type="button"
                        class="curtain-mark"
                        data-action="cover-position"
                        data-position=${this._posicaoBrutaPorFechamento(t)}
                        data-closed=${t}
                        aria-label="${t}% fechada"
                        ?disabled=${o}
                        @click=${() => this._posicionarCortinaPorFechamento(t)}
                      >
                        ${t}%
                      </button>
                    `
    )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  _entidadeCortina() {
    const a = this._sub?.entities?.curtain;
    return typeof a == "string" ? a : void 0;
  }
  _posicaoCortina() {
    const a = this._entidadeCortina(), o = (a && this._hass ? this._hass.states[a] : void 0)?.attributes.current_position;
    return typeof o == "number" ? o : 100;
  }
  _percentualCortinaValido(a) {
    const e = Number(a);
    if (Number.isFinite(e))
      return Math.max(0, Math.min(100, Math.round(e)));
  }
  _interpolarCortina(a, e, o) {
    const i = this._percentualCortinaValido(a) ?? 0, t = Ri, n = t[0];
    if (i <= n[e]) return n[o];
    for (let c = 1; c < t.length; c += 1) {
      const s = t[c - 1], l = t[c];
      if (i <= l[e]) {
        const m = l[e] - s[e];
        if (m === 0) return l[o];
        const d = (i - s[e]) / m;
        return this._percentualCortinaValido(
          s[o] + (l[o] - s[o]) * d
        ) ?? l[o];
      }
    }
    return t[t.length - 1][o];
  }
  /** Percentual visual fechado: 0 = aberta; 100 = fechada. */
  _fechamentoCortina() {
    const a = this._sub?.entities?.curtainPercentControl, e = typeof a == "string" ? this._estado(a) : void 0, o = this._indisponivel(e) ? void 0 : this._percentualCortinaValido(e?.state);
    if (o != null) return o;
    const i = this._posicaoCortina();
    return 100 - this._interpolarCortina(i, "position", "visual");
  }
  _posicaoBrutaPorFechamento(a) {
    const e = 100 - (this._percentualCortinaValido(a) ?? 0);
    return this._interpolarCortina(e, "visual", "position");
  }
  _estadoCortina() {
    const a = this._entidadeCortina();
    if (!a || !this._hass?.states[a]) return "Indisponível";
    const o = this._fechamentoCortina();
    return o <= 1 ? "Aberta" : o >= 99 ? "Fechada" : `Fechada ${o}%`;
  }
  _percentualCortina() {
    return "";
  }
  _previsualizarFechamentoCortina(a) {
    const e = a.currentTarget, o = this._percentualCortinaValido(e.value) ?? 0, i = e.closest(".curtain-dock");
    i?.style.setProperty("--curtain-position", `${o}%`), i?.querySelector(".curtain-status-text")?.replaceChildren(
      document.createTextNode(
        o <= 1 ? "Aberta" : o >= 99 ? "Fechada" : `Fechada ${o}%`
      )
    );
  }
  _posicionarCortinaPorFechamento(a) {
    this._posicionarCortina(this._posicaoBrutaPorFechamento(a));
  }
  _posicionarCortina(a) {
    const e = this._entidadeCortina();
    !e || !this._hass || this._hass.callService("cover", "set_cover_position", { entity_id: e, position: a }, { entity_id: e });
  }
  _acionarCortina(a) {
    const e = this._entidadeCortina();
    !e || !this._hass || this._indisponivel(this._estado(e)) || this._hass.callService("cover", a, { entity_id: e }, { entity_id: e });
  }
  _estado(a) {
    return a && this._hass ? this._hass.states[a] : void 0;
  }
  _indisponivel(a) {
    return !a || ["unavailable", "unknown", ""].includes(String(a.state).toLowerCase());
  }
  _servico(a, e, o) {
    this._hass && this._hass.callService(a, e, o, o);
  }
  /**
   * A lista de câmeras vem da configuração gerada — `entities.cameras` —, com
   * nome, nome curto e os três interruptores de cada uma (som, movimento,
   * privacidade). Eu vinha lendo só `cameraMain`/`cameraSecondary`, que são
   * ids soltos: sem nome, sem controles, e sem a segunda câmera onde a chave
   * não existia.
   */
  _camerasConfiguradas() {
    const a = this._sub?.entities?.cameras;
    return Array.isArray(a) ? a.filter((e) => !!e && typeof e.entity == "string") : [];
  }
  /**
   * Estado vivo de uma câmera.
   *
   * A imagem sai de `entity_picture` quando o HA a publica, e cai para
   * `/api/camera_proxy/<entidade>` quando não. O último quadro conhecido fica
   * guardado: numa reconexão a imagem antiga continua na tela em vez de sumir.
   */
  _cameraViva(a) {
    const e = this._estado(a.entity), o = this._indisponivel(e), i = !o && Oi.includes(String(e?.state ?? "")), t = String(e?.attributes.entity_picture ?? "");
    t && (this._ultimaImagem[a.entity] = t);
    const n = t || this._ultimaImagem[a.entity] || `/api/camera_proxy/${a.entity}`;
    return {
      ...a,
      online: i,
      indisponivel: o,
      base: n,
      // ANTERIOR (rollback 6.2B rev.2):
      //   url: this._urlsCarregadas[cam.entity] ?? comSelo(base, this._seloCameras)
      //
      // O selo aqui tornava a URL inicial ÚNICA a cada montagem — nunca reusava
      // o cache do navegador, e ainda por cima duplicava a requisição, porque o
      // motor disparava outra no mesmo instante. Sem o selo, voltar a um cômodo
      // visitado mostra o último quadro imediatamente, e o motor cuida da
      // atualização a partir daí.
      url: this._urlsCarregadas[a.entity] ?? n
    };
  }
  /** Um dos três interruptores da câmera (som, movimento, privacidade). */
  _controleCamera(a, e) {
    const o = (a?.controls ?? []).find((n) => String(n.key ?? "").toLowerCase() === e);
    if (!o?.entity) return;
    const i = this._estado(o.entity), t = this._indisponivel(i);
    return {
      ...o,
      entity: o.entity,
      ativo: !t && String(i?.state ?? "").toLowerCase() === "on",
      indisponivel: t
    };
  }
  /**
   * Um feed de câmera.
   *
   * A estrutura — moldura, imagem, placeholder e legenda — é a que o CSS gerado
   * espera. O PIP é um botão: tocá-lo promove aquela câmera ao feed principal.
   */
  _renderFeed(a, e) {
    const o = a?.shortName || a?.name || "Câmera", t = !!this._controleCamera(a, "privacy")?.ativo, n = !a || a.indisponivel, c = [
      "camera-main",
      "camera-feed",
      e ? "camera-pip-feed" : "camera-primary-feed",
      t ? "is-private" : "",
      n ? "is-unavailable" : ""
    ].filter(Boolean).join(" "), s = n ? p`<div class="camera-state-surface">
          <bruno-icon icon="mdi:video-off-outline"></bruno-icon><span>Indisponível</span>
        </div>` : t ? p`<div class="camera-state-surface">
            <bruno-icon icon="mdi:eye-off-outline"></bruno-icon><span>Modo privacidade ativo</span>
          </div>` : h, l = !!(a && !e && Ea(a.entity)), m = p`
      <div class="camera-row-image">
        ${l ? p`<div class="camera-live-slot" data-camera-live=${a.entity}></div>` : h}
        ${a ? p`<img
              src=${a.url}
              data-camera-src-base=${a.base}
              data-camera-entity=${a.entity}
              alt=""
              @load=${(d) => {
      const u = d.currentTarget;
      u.classList.add("is-loaded"), u.closest(".camera-main")?.classList.add("has-loaded-image"), this._marcarQuadroNaTela(a.entity);
    }}
              @error=${(d) => {
      const u = d.currentTarget;
      u.classList.remove("is-loaded"), u.closest(".camera-main")?.classList.remove("has-loaded-image"), this._socorrerCamera(a.entity);
    }}
            />` : h}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
      ${s}
      <div class="camera-row-copy"><strong>${o}</strong></div>
    `;
    return e && a ? p`<button
        type="button"
        class=${c}
        aria-label=${`Mostrar câmera ${o}`}
        @click=${() => {
      this._cameraAtiva = a.entity, this.requestUpdate();
    }}
      >
        ${m}
      </button>` : a ? p`<button
      type="button"
      class=${c}
      aria-label=${`Abrir câmera ${o} em tela cheia`}
      @click=${() => this._maisInfo(a.entity)}
    >
      ${m}
    </button>` : p`<div class=${c} aria-label=${`Câmera ${o}`}>${m}</div>`;
  }
  /** Câmeras: cabeçalho com o menu de três pontos + palco com feed e PIP. */
  _renderCameras() {
    const a = this._camerasConfiguradas().map((c) => this._cameraViva(c));
    if (!a.length)
      return p`
        <div class="glass-card cameras-card cameras-card-controls">
          <div class="mh-head cameras-head">
            <div class="mh-head-title">
              <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
              <div class="module-title">Câmeras</div>
            </div>
          </div>
          <div class="camera-stage camera-pip-stage">${this._renderFeed(void 0, !1)}</div>
        </div>
      `;
    const e = a.find((c) => c.entity === this._cameraAtiva) ?? a[0], o = a.find((c) => c.online), i = e?.online || !o ? e : o, t = a.find((c) => c.entity !== i?.entity), n = this._controlesCameraAbertos;
    return p`
      <div class="glass-card cameras-card cameras-card-controls">
        <div class="mh-head cameras-head">
          <div class="mh-head-title">
            <span class="micro-icon tone-blue"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
            <div class="module-title">Câmeras</div>
          </div>
          <button
            type="button"
            class="mh-menu camera-settings-button ${n ? "is-active" : ""}"
            title="Controles"
            aria-expanded=${n ? "true" : "false"}
            aria-label=${n ? "Fechar controles das câmeras" : "Abrir controles das câmeras"}
            @click=${() => {
      this._controlesCameraAbertos = !this._controlesCameraAbertos, this.requestUpdate();
    }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
        </div>
        <div class="camera-stage camera-pip-stage ${n ? "is-controls-open" : ""}">
          ${this._renderFeed(i, !1)}
          ${t ? this._renderFeed(t, !0) : h}
          ${n ? this._renderControlesCamera(i) : h}
        </div>
      </div>
    `;
  }
  _renderControlesCamera(a) {
    const e = ["sound", "motion", "privacy"].map((i) => this._controleCamera(a, i)).filter((i) => !!i);
    if (!e.length) return h;
    const o = a?.shortName || a?.name || "Câmera";
    return p`
      <div class="camera-control-strip" aria-label=${`Controles da câmera ${o}`}>
        <div class="camera-controls">
          ${e.map((i) => {
      const t = i.description || i.label || "Controle";
      return p`
              <button
                type="button"
                class="camera-control ${i.ativo ? "is-on" : ""} ${i.indisponivel ? "is-unavailable" : ""}"
                ?disabled=${i.indisponivel}
                aria-pressed=${i.ativo ? "true" : "false"}
                title=${`${t} — câmera ${o}`}
                @click=${() => this._servico("homeassistant", "toggle", { entity_id: i.entity })}
              >
                <bruno-icon icon=${i.icon ?? "mdi:toggle-switch-outline"}></bruno-icon>
                <span class="camera-control-label">${i.label || t}</span>
                <span class="camera-control-switch" aria-hidden="true"></span>
              </button>
            `;
    })}
        </div>
      </div>
    `;
  }
  // ── Modelos das fontes de mídia ────────────────────────────────────────────
  /**
   * Uma chave de entidade pode ser um id ou uma LISTA de candidatos.
   *
   * O A/C do Q. Marina, por exemplo, traz onze nomes possíveis — a instalação
   * mudou de nome mais de uma vez e a configuração guarda todos. Vale o primeiro
   * que existir e estiver disponível; sem nenhum, o primeiro da lista, para que
   * o cartão ainda mostre a que ele se refere.
   */
  _resolverId(a) {
    if (typeof a == "string") return a || void 0;
    if (!Array.isArray(a)) return;
    const e = a.filter((i) => typeof i == "string" && !!i);
    return e.find((i) => !this._indisponivel(this._hass?.states[i])) ?? e[0];
  }
  _idDe(a) {
    return this._resolverId(this._sub?.entities?.[a]);
  }
  _modeloTv() {
    const a = this._estado(this._idDe("tv")), e = a?.attributes ?? {}, o = a?.state ?? "off", i = Ei.includes(o), t = String(e.source ?? e.app_name ?? "") || "HDMI 1", n = String(e.media_title ?? e.media_series_title ?? e.app_name ?? "");
    return {
      st: a,
      estado: o,
      ativo: i,
      fonte: t,
      titulo: n,
      volume: e.volume_level != null ? Math.round(Number(e.volume_level) * 100) : null,
      poster: String(e.entity_picture ?? e.media_image_url ?? "")
    };
  }
  _modeloSpotify() {
    const a = this._estado(this._idDe("spotify")), e = a?.attributes ?? {}, o = a?.state ?? "off", t = Mi.includes(o) && Ae(
      a,
      this._sub?.spotifyDeviceName,
      this._estado(this._idDe("speaker"))
    ), n = String(e.media_title ?? "") || "SpotifyPlus", c = Number(e.media_duration) || 0, s = Number(e.media_position) || 0, l = Date.parse(String(e.media_position_updated_at ?? "")), m = t && o === "playing", d = m && Number.isFinite(l) ? s + (Date.now() - l) / 1e3 : s, u = c > 0 ? Math.max(0, Math.min(c, d)) : Math.max(0, d);
    return {
      st: a,
      ativo: t,
      tocando: m,
      titulo: t ? /^SpotifyPlus\s+Bruno/i.test(n) ? "SpotifyPlus" : n : "SpotifyPlus",
      artista: t ? String(e.media_artist ?? e.media_album_name ?? "") : "",
      capa: t ? String(e.entity_picture ?? e.media_image_url ?? "") : "",
      volume: e.volume_level != null ? Math.round(Number(e.volume_level) * 100) : null,
      dispositivo: this._sub?.spotifyDeviceName || String(e.source ?? "") || "SpotifyPlus",
      progresso: c > 0 ? Math.max(0, Math.min(100, u / c * 100)) : 0,
      decorrido: me(u),
      total: c > 0 ? me(c) : "--:--"
    };
  }
  _modeloPc() {
    const a = this._estado(this._idDe("pcActive"))?.state === "on", e = this._estado(this._idDe("pcSession"))?.state ?? "", o = this._estado(this._idDe("pcWindow"))?.state ?? "";
    return { ativo: a, sessao: e, janela: o };
  }
  /**
   * Qual fonte fica aberta.
   *
   * As duas regras do original, e elas DIFEREM entre os cômodos:
   *
   * - TV + Spotify (cinco cômodos): a escolha manual persiste, mas quando
   *   qualquer fonte ACABA de ficar ativa ela é descartada e a prioridade
   *   automática volta a valer — é o que faz a TV subir sozinha ao ser ligada.
   * - PC + Spotify (Office): o Spotify TEM precedência. Ele toma a vaga ao
   *   começar a tocar, e assume também quando o PC se desliga com o painel do
   *   PC aberto. Sem seleção, Spotify ativo vence o PC ativo.
   *
   * Eu tratava os seis pela primeira regra, e o Office abria o PC quando devia
   * abrir o Spotify.
   */
  _fonteAberta(a, e) {
    const o = a.filter((t) => e[t]), i = this._midiaAtivasAntes;
    return this._midiaAtivasAntes = o, this._estaNoTelefone() && this._fonteMidiaManual && a.includes(this._fonteMidia) ? this._fonteMidia : this._temPc ? (e.spotify && !i.includes("spotify") && (this._fonteMidia = "spotify"), !e.pc && this._fonteMidia === "pc" && e.spotify && (this._fonteMidia = "spotify"), a.includes(this._fonteMidia) ? this._fonteMidia : e.spotify ? "spotify" : "pc") : (o.some((t) => !i.includes(t)) && (this._fonteMidia = ""), a.includes(this._fonteMidia) ? this._fonteMidia : o[0] ?? a[0] ?? "");
  }
  /** Linha de volume — o mesmo controle nas duas fontes. */
  _linhaVolume(a, e) {
    return p`
      <div class=${a ? "mh-vol" : "mh-vol is-disabled"}>
        <bruno-icon icon="mdi:volume-medium"></bruno-icon>
        <span class="mh-vol-label">Volume ${e}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value=${String(e)}
          .value=${String(e)}
          aria-label="Volume"
          ?disabled=${!a}
          @change=${(o) => {
      const i = o.currentTarget;
      a && this._servico("media_player", "volume_set", {
        entity_id: a,
        volume_level: Number(i.value) / 100
      });
    }}
        />
      </div>
    `;
  }
  /** Botão do corpo do hub. `soIcone` evita o truncamento nas fileiras de 4-5. */
  _botaoMidia(a, e, o, i = {}) {
    const t = !!(i.soIcone ?? i.mais), n = [
      "mh-btn",
      i.principal ? "is-main" : "",
      i.mais ? "is-plus" : "",
      t ? "is-icon" : ""
    ].filter(Boolean).join(" ");
    return p`
      <button
        type="button"
        class=${n}
        title=${a}
        aria-label=${a}
        ?disabled=${i.desabilitado}
        @click=${o}
      >
        <bruno-icon icon=${e}></bruno-icon>${t ? h : p`<span>${a}</span>`}
      </button>
    `;
  }
  /**
   * A arte da direita.
   *
   * Só o PNG, sobreposto — posicionado de forma absoluta pelo CSS, para nunca
   * ditar a altura da linha e empurrar os botões para fora do cartão.
   */
  _arteMidia(a, e, o, i) {
    return p`
      <div class="mh-art mh-art-${e} ${i ? "is-cover" : "is-standby"}">
        ${a ? p`<img src=${a} alt="" loading="lazy" />` : p`<bruno-icon icon=${o}></bruno-icon>`}
      </div>
    `;
  }
  _corpoTv() {
    const a = this._modeloTv(), e = this._idDe("tv"), o = this._sub?.tvStandbyImage ?? Vi, t = (!(!a.titulo || /^TV (ligada|desligada)$/i.test(a.titulo) || a.titulo === a.fonte) && a.estado === "playing" ? a.titulo : "") || a.fonte;
    if (!a.ativo)
      return p`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>HDMI 1 disponível</em></div>
          <div class="mh-controls">
            ${this._botaoMidia(
        "Ligar TV",
        "mdi:power",
        () => this._servico("homeassistant", "toggle", { entity_id: e }),
        { principal: !0, desabilitado: !e }
      )}
          </div>
        </div>
        ${this._arteMidia(o, "wide", "mdi:television-classic", !1)}
      `;
    const n = Array.isArray(this._sub?.tvApps) ? this._sub.tvApps : [], c = this._appsTvAbertos && n.length ? p`<div class="mh-btn-row mh-btn-row-5">
          ${n.map(
      (s) => this._botaoMidia(s.label, "mdi:play-box-outline", () => {
        s.script && this._servico("script", "turn_on", { entity_id: s.script });
      }, { soIcone: !0, desabilitado: !s.script })
    )}
          ${this._botaoMidia("Voltar", "mdi:chevron-left", () => {
      this._appsTvAbertos = !1, this.requestUpdate();
    }, { mais: !0 })}
        </div>` : p`<div class="mh-btn-row mh-btn-row-3">
          ${this._botaoMidia("Pausar", "mdi:pause", () => this._servico("media_player", "media_play_pause", { entity_id: e }), { soIcone: !0 })}
          ${this._botaoMidia("Controle remoto", "mdi:remote-tv", () => this._abrirControleRemoto(), {
      soIcone: !0,
      desabilitado: !this._idDe("tvRemote")
    })}
          ${this._botaoMidia("Apps", "mdi:apps", () => {
      this._appsTvAbertos = !0, this.requestUpdate();
    }, { soIcone: !0, desabilitado: !n.length })}
        </div>`;
    return p`
      <div class="mh-left">
        <div class="mh-info">
          <small>Ligada</small>${t ? p`<em>${t}</em>` : h}
        </div>
        <div class="mh-controls">${this._linhaVolume(e, a.volume ?? 60)} ${c}</div>
      </div>
      ${this._arteMidia(a.poster || o, "wide", "mdi:television-classic", !!a.poster)}
    `;
  }
  /**
   * Popup do controle remoto.
   *
   * Mesmo evento e mesma carga das subviews atuais — `ll-custom` com a chamada
   * de `browser_mod.popup` e o `universal-remote-card`. Quem monta a janela é o
   * browser_mod, exatamente como hoje; só a Sala tem controle (`remote.atv`).
   */
  _abrirControleRemoto() {
    const a = this._idDe("tvRemote");
    if (!a) return;
    const e = (i) => ({
      action: "perform-action",
      perform_action: "button.press",
      target: { entity_id: i }
    }), o = (i, t, n) => ({
      type: "button",
      name: i,
      icon: t,
      tap_action: e(n)
    });
    this.dispatchEvent(
      new CustomEvent("ll-custom", {
        bubbles: !0,
        composed: !0,
        detail: {
          action: "fire-dom-event",
          browser_mod: {
            service: "browser_mod.popup",
            data: {
              title: "Smart TV Remote",
              tag: "tv_remote",
              style: "--popup-background-color: rgba(21,25,35,0.92); --popup-min-width: min(380px, 95vw); --popup-max-width: min(430px, 95vw); --popup-border-width: 0;",
              content: {
                type: "custom:universal-remote-card",
                remote_id: a,
                media_player_id: this._idDe("tv"),
                rows: [
                  ["power", "input", "menu"],
                  ["navigation"],
                  ["back", "home", "mute"],
                  ["volume_down", "volume_up", "channel_down", "channel_up"]
                ],
                custom_actions: [
                  o("power", "mdi:power", "button.tv_sala_power"),
                  o("input", "mdi:import", "button.tv_sala_input"),
                  o("menu", "mdi:menu", "button.tv_sala_menu"),
                  {
                    type: "circlepad",
                    name: "navigation",
                    icon: "mdi:checkbox-blank-circle",
                    tap_action: e("button.tv_sala_ok"),
                    up: { icon: "mdi:chevron-up", tap_action: e("button.tv_sala_navigate_up"), hold_action: { action: "repeat" } },
                    down: { icon: "mdi:chevron-down", tap_action: e("button.tv_sala_navigate_down"), hold_action: { action: "repeat" } },
                    left: { icon: "mdi:chevron-left", tap_action: e("button.tv_sala_navigate_left"), hold_action: { action: "repeat" } },
                    right: { icon: "mdi:chevron-right", tap_action: e("button.tv_sala_navigate_right"), hold_action: { action: "repeat" } }
                  },
                  o("back", "mdi:keyboard-backspace", "button.tv_sala_back"),
                  o("home", "mdi:home", "button.tv_sala_homepage"),
                  o("mute", "mdi:volume-mute", "button.tv_sala_mute"),
                  o("volume_down", "mdi:volume-minus", "button.tv_sala_volume_down"),
                  o("volume_up", "mdi:volume-plus", "button.tv_sala_volume_up"),
                  o("channel_down", "mdi:chevron-down", "button.tv_sala_channel_down"),
                  o("channel_up", "mdi:chevron-up", "button.tv_sala_channel_up")
                ]
              }
            }
          }
        }
      })
    );
  }
  _corpoPc() {
    const a = this._modeloPc(), e = this._sub?.pcImage ?? Fi, o = a.ativo ? [a.sessao, a.janela].filter((t) => t && t !== "--")[0] || "Sessão ativa" : "Pronto para ligar", i = (t) => () => {
      const n = this._idDe(t);
      n && this._servico("button", "press", { entity_id: n });
    };
    return p`
      <div class="mh-left">
        <div class="mh-info"><small>${a.ativo ? "Ligado" : "Desligado"}</small><em>${o}</em></div>
        <div class="mh-controls">
          ${a.ativo ? p`<div class="mh-btn-row mh-btn-row-5 office-pc-actions">
                ${this._botaoMidia("Sleep", "mdi:weather-night", i("pcSleep"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcSleep")
    })}
                ${this._botaoMidia("Reiniciar", "mdi:restart", i("pcRestart"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcRestart")
    })}
                ${this._botaoMidia("Desligar", "mdi:power-standby", i("pcShutdown"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcShutdown")
    })}
                ${this._botaoMidia("Bloquear", "mdi:lock-outline", i("pcLock"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcLock")
    })}
                ${this._botaoMidia(
      a.sessao && a.sessao !== "--" ? a.sessao : "Sessão",
      "mdi:account-clock-outline",
      () => this._maisInfo(this._idDe("pcSession")),
      { soIcone: !0 }
    )}
              </div>` : p`<div class="mh-btn-row mh-btn-row-3">
                ${this._botaoMidia("Ligar PC", "mdi:power", i("pcPower"), {
      principal: !0,
      desabilitado: !this._idDe("pcPower")
    })}
              </div>`}
        </div>
      </div>
      ${this._arteMidia(e, "wide", "mdi:desktop-tower", !1)}
    `;
  }
  _corpoSpotify() {
    const a = this._modeloSpotify(), e = this._idDe("spotify"), o = this._sub?.spotifyStandbyImage ?? ji;
    if (!a.ativo)
      return p`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>${a.dispositivo}</em></div>
          <div class="mh-controls">
            ${this._botaoMidia("Dispositivos", "mdi:speaker-wireless", () => this._abrirSpotifyPlus("devices"), {
        principal: !0,
        desabilitado: !e
      })}
          </div>
        </div>
        ${this._arteMidia(o, "square", "mdi:music-note", !1)}
      `;
    const i = this._spotifyFerramentas ? p`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia("Dispositivos", "mdi:speaker-wireless", () => this._abrirSpotifyPlus("devices"), { soIcone: !0 })}
          ${this._botaoMidia("Presets", "mdi:bookmark-music-outline", () => this._abrirSpotifyPlus("presets"), { soIcone: !0 })}
          ${this._botaoMidia("Fila", "mdi:playlist-play", () => this._abrirSpotifyPlus("queue"), { soIcone: !0 })}
          ${this._botaoMidia("Voltar", "mdi:chevron-left", () => {
      this._spotifyFerramentas = !1, this.requestUpdate();
    }, { mais: !0 })}
        </div>` : p`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia("Anterior", "mdi:skip-previous", () => this._servico("media_player", "media_previous_track", { entity_id: e }), { soIcone: !0 })}
          ${this._botaoMidia(a.tocando ? "Pausar" : "Tocar", a.tocando ? "mdi:pause" : "mdi:play", () => {
      a.tocando ? this._servico("media_player", "media_pause", { entity_id: e }) : this._tocarSpotify();
    }, { soIcone: !0 })}
          ${this._botaoMidia("Próxima", "mdi:skip-next", () => this._servico("media_player", "media_next_track", { entity_id: e }), { soIcone: !0 })}
          ${this._botaoMidia("Mais", "mdi:plus", () => {
      this._spotifyFerramentas = !0, this.requestUpdate();
    }, { mais: !0 })}
        </div>`;
    return p`
      <div class="mh-left">
        <div class="mh-info">
          <small>${a.titulo}</small>${a.artista ? p`<em>${a.artista}</em>` : h}
          <div class="mh-progress-wrap" aria-label="Progresso da faixa">
            <span class="mh-progress-time">${a.decorrido}</span>
            <div class="mh-progress" aria-hidden="true"><span style=${`width:${a.progresso}%`}></span></div>
            <span class="mh-progress-time">${a.total}</span>
          </div>
        </div>
        <div class="mh-controls">${this._linhaVolume(e, a.volume ?? 66)} ${i}</div>
      </div>
      ${this._arteMidia(a.capa || o, "square", "mdi:music-note", !!a.capa)}
    `;
  }
  /**
   * Abre o SpotifyPlus Card na aba pedida.
   *
   * Mesmo evento e mesma carga da origem: `ll-custom` com `bruno_action:
   * 'spotify'` e a configuração do card. Quem monta a janela é a shell.
   */
  _abrirSpotifyPlus(a) {
    const e = this._idDe("spotify");
    e && this.dispatchEvent(
      new CustomEvent("ll-custom", {
        bubbles: !0,
        composed: !0,
        detail: {
          action: "fire-dom-event",
          bruno_action: "spotify",
          bruno_spotify_config: {
            entity: e,
            deviceDefaultId: this._sub?.spotifyDeviceName,
            mode: a
          }
        }
      })
    );
  }
  /**
   * Retomar o Spotify no dispositivo do cômodo.
   *
   * `media_player.media_play` sem dispositivo ativo dá erro. A origem transfere
   * a reprodução com `spotifyplus.player_transfer_playback`, ativando o
   * dispositivo pelo nome; só cai no serviço genérico quando o cômodo não
   * declara dispositivo.
   */
  _tocarSpotify() {
    const a = this._idDe("spotify");
    if (!a) return;
    const e = this._sub?.spotifyDeviceName || String(this._estado(a)?.attributes.source ?? "");
    if (e) {
      this._servico("spotifyplus", "player_transfer_playback", {
        entity_id: a,
        device_id: e,
        play: !0,
        delay: 0.75,
        force_activate_device: !0
      });
      return;
    }
    this._servico("media_player", "media_play", { entity_id: a });
  }
  _maisInfo(a) {
    a && (Ea(a) && (this._tokenDefinicaoPlayer++, this._estadoAoVivo = "entregue-more-info", C(a, "entregue ao more-info"), this._pararAoVivo(), this._sincronizarCameras()), this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: a },
        bubbles: !0,
        composed: !0
      })
    ));
  }
  /**
   * Hub de mídia: acordeão de duas fontes — TV (ou PC, no Office) e Spotify.
   *
   * Só uma fica aberta por vez, no próprio lugar da lista: a fonte nunca é
   * promovida ao topo. A entrada do PS5 vive no menu de três pontos, e só onde
   * há entidade — hoje, apenas a Sala.
   */
  _renderMediaHub() {
    const a = this._temPc, e = a ? void 0 : this._modeloTv(), o = a ? this._modeloPc() : void 0, i = this._modeloSpotify(), n = [
      a ? {
        chave: "pc",
        rotulo: "PC",
        icone: "mdi:desktop-tower",
        ativo: !!o?.ativo,
        resumo: o?.ativo ? "Ligado" : "Desligado",
        atmosfera: "",
        corpo: () => this._corpoPc()
      } : {
        chave: "tv",
        rotulo: this._room?.id === "sala" ? "TV da sala" : "TV",
        icone: "mdi:television-classic",
        ativo: !!e?.ativo,
        resumo: e?.ativo ? `Ligada · ${e.fonte}` : "Desligada",
        atmosfera: e?.ativo ? e.poster : "",
        corpo: () => this._corpoTv()
      },
      {
        chave: "spotify",
        rotulo: "Spotify",
        icone: "mdi:spotify",
        ativo: i.ativo,
        resumo: i.ativo ? i.titulo : "Nenhuma faixa",
        atmosfera: i.ativo ? i.capa : "",
        corpo: () => this._corpoSpotify()
      }
    ], c = Object.fromEntries(n.map((d) => [d.chave, d.ativo])), s = this._fonteAberta(n.map((d) => d.chave), c), l = n.find((d) => d.chave === s)?.ativo, m = [
      "glass-card",
      "media-hub-card",
      a ? "workspace-hub-card" : "",
      "mh-accordion",
      l ? "is-playing" : "",
      this._menuMidiaAberto ? "is-menu-open" : ""
    ].filter(Boolean).join(" ");
    return p`
      <div class=${m}>
        <div class="mh-head">
          <div class="mh-head-title">
            <span class="micro-icon ${a ? "" : "tone-amber"}">
              <bruno-icon icon=${a ? "mdi:desk" : "mdi:multimedia"}></bruno-icon>
            </span>
            <div class="module-title">${a ? "Estação de Trabalho" : "Hub de Mídia"}</div>
            ${this._botaoRecolherFolha()}
          </div>
          <button
            type="button"
            class="mh-menu ${this._menuMidiaAberto ? "is-active" : ""}"
            title="Opções"
            aria-label="Opções"
            aria-expanded=${this._menuMidiaAberto ? "true" : "false"}
            @click=${() => {
      this._menuMidiaAberto = !this._menuMidiaAberto, this.requestUpdate();
    }}
          >
            <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
          </button>
          ${this._botaoFecharFolha()}
        </div>
        ${this._menuMidiaAberto ? this._renderMenuMidia() : h}
        <div class="mh-sources">
          ${n.map((d) => {
      const u = d.chave === s, g = ["mh-source", u ? "is-open" : "", d.ativo ? "is-active" : ""].filter(Boolean).join(" "), f = [
        "mh-source-body",
        `mh-source-body-${d.chave}`,
        d.ativo ? "is-source-active" : "is-source-idle",
        d.atmosfera ? "has-atmosphere" : ""
      ].filter(Boolean).join(" ");
      return p`
              <div class=${g}>
                <button
                  type="button"
                  class="mh-source-head"
                  aria-expanded=${u ? "true" : "false"}
                  @click=${() => this._selecionarFonteMidia(d.chave)}
                >
                  <bruno-icon
                    class="mh-src-icon ${d.chave === "spotify" ? "mh-icon-spotify" : ""}"
                    icon=${d.icone}
                  ></bruno-icon>
                  <span class="mh-src-name">${d.rotulo}</span>
                  <span class="mh-src-summary">${d.resumo}</span>
                  ${u ? h : p`<bruno-icon class="mh-src-chevron" icon="mdi:chevron-right"></bruno-icon>`}
                </button>
                ${u ? p`<div class=${f}>
                      ${this._estaNoTelefone() && d.atmosfera ? p`<img class="mh-now-atmosphere" src=${d.atmosfera} alt="" aria-hidden="true" />` : h}
                      ${d.corpo()}
                    </div>` : h}
              </div>
            `;
    })}
        </div>
      </div>
    `;
  }
  /** O menu de três pontos. Só a Sala tem PS5; nos demais fica o more-info. */
  _renderMenuMidia() {
    const a = this._idDe("ps5"), o = this._estado(a)?.state === "on", i = a ? [{ icone: "mdi:sony-playstation", titulo: "PS5", sub: o ? "Online" : "Offline", entidade: a, ativo: o }] : [];
    return i.length ? p`
      <div class="mh-overflow-panel" role="menu" aria-label="Opções de mídia">
        ${i.map(
      (t) => p`
            <div class="mh-overflow-item">
              <span class="mh-overflow-icon"><bruno-icon icon=${t.icone}></bruno-icon></span>
              <span class="mh-overflow-copy"><strong>${t.titulo}</strong><small>${t.sub}</small></span>
              <button
                type="button"
                class="mh-overflow-action ${t.ativo ? "is-active" : ""}"
                title=${t.ativo ? "Desligar PS5" : "Ligar PS5"}
                aria-label=${t.ativo ? "Desligar PS5" : "Ligar PS5"}
                @click=${() => this._servico("homeassistant", "toggle", { entity_id: t.entidade })}
              >
                <bruno-icon icon="mdi:power"></bruno-icon>
              </button>
              <button
                type="button"
                class="mh-overflow-action"
                title="Detalhes"
                aria-label="Detalhes do PS5"
                @click=${() => this._maisInfo(t.entidade)}
              >
                <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>
              </button>
            </div>
          `
    )}
      </div>
    ` : h;
  }
  /**
   * Os cinco eletrodomésticos da Cozinha.
   *
   * Cada tile tem imagem, nome e o estado em texto. Só a lava-louças tem
   * entidade hoje; os demais são placeholders com `is-muted`, como no original —
   * aparecem, mas não prometem controle que não existe.
   */
  _renderEletrodomesticos() {
    const a = this._sub?.entities?.appliances;
    return Array.isArray(a) ? a.filter((e) => !!e && typeof e == "object").map((e) => {
      const o = String(e.key ?? "item").replace(/[^a-z0-9_-]/gi, "-").toLowerCase(), i = String(e.name ?? "Eletrodoméstico"), t = typeof e.image == "string" ? e.image : "", n = typeof e.entity == "string" ? e.entity : "", c = typeof e.stateEntity == "string" ? e.stateEntity : n, s = c && this._hass ? this._hass.states[c] : void 0, l = Array.isArray(e.activeStates) ? e.activeStates.map((q) => String(q).toLowerCase()) : ["on"], m = typeof e.activeAttr == "string" ? e.activeAttr : "", d = this._room?.activeSensor ? this._hass?.states[this._room.activeSensor] : void 0, u = l.includes(String(s?.state ?? "").toLowerCase()) || (m ? Ci(d?.attributes[m]) : !1), g = !!e.placeholder || !n, f = typeof e.moreInfoEntity == "string" ? e.moreInfoEntity : n, v = ["appliance-tile", `is-${o}`, u ? "is-on" : "", g ? "is-muted" : ""].filter(Boolean).join(" ");
      return p`
          <article class=${v}>
            <button
              type="button"
              class="appliance-main"
              aria-label=${i}
              ?disabled=${g}
              @click=${() => !g && this._alternarAparelho(n)}
            >
              <div class="appliance-visual" data-image-wrapper>
                ${t ? p`<img src=${t} alt="" loading="lazy" decoding="async" />` : h}
              </div>
              <div class="appliance-copy">
                <strong>${i}</strong>
                <small>${this._rotuloDoAparelho(e, s, u, g)}</small>
              </div>
            </button>
            <button
              type="button"
              class="mh-menu appliance-more"
              title="Mais detalhes"
              aria-label=${`Mais detalhes de ${i}`}
              ?disabled=${!f}
              @click=${() => this._maisInfo(f)}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </article>
        `;
    }) : h;
  }
  /** Rótulo de estado: os textos vêm da configuração, como no original. */
  _rotuloDoAparelho(a, e, o, i) {
    const t = (c, s) => typeof a[c] == "string" ? a[c] : s;
    if (i) return t("placeholderLabel", "Sem tomada");
    if (!e) return "Indisponível";
    if (o) return t("activeLabel", "Ligada");
    const n = String(e.state).toLowerCase();
    return n === "off" || n === "unavailable" ? t("offLabel", "Desligada") : t("idleLabel", "Ligada");
  }
  _alternarAparelho(a) {
    if (!this._hass) return;
    const e = a.split(".")[0] ?? "switch";
    this._hass.callService(e, "toggle", { entity_id: a }, { entity_id: a });
  }
  _entidadeClimate() {
    return this._idDe("climate");
  }
  _estadoClimate() {
    return this._estado(this._entidadeClimate());
  }
  /**
   * O A/C está trabalhando?
   *
   * `hvac_action` manda quando existe: um aparelho em `cool` mas com a ação
   * `idle` não está resfriando. Sem ela, vale o estado.
   */
  _modeloClimate() {
    const a = this._estadoClimate(), e = a?.attributes ?? {}, o = String(e.hvac_action ?? "").toLowerCase(), i = this._indisponivel(a), t = i || a?.state === "off" ? !1 : Ii.includes(o) ? !0 : Di.includes(o) ? !1 : Ti.includes(String(a?.state ?? "")), n = (c, s) => Number.isFinite(Number(c)) ? Number(c) : s;
    return {
      st: a,
      indisponivel: i,
      ativo: t,
      alvo: n(e.temperature, null),
      atual: n(e.current_temperature, null),
      minima: n(e.min_temp, 16),
      maxima: n(e.max_temp, 30),
      modo: a?.state ?? "off",
      ventilacao: String(e.fan_mode ?? "auto"),
      swing: String(e.swing_mode ?? ""),
      modos: Array.isArray(e.hvac_modes) ? e.hvac_modes : [],
      ventilacoes: Array.isArray(e.fan_modes) ? e.fan_modes : [],
      swings: Array.isArray(e.swing_modes) ? e.swing_modes : []
    };
  }
  _rotuloModo(a) {
    return {
      off: "Desligado",
      cool: "Frio",
      heat: "Aquecimento",
      fan_only: "Ventilar",
      dry: "Secar",
      heat_cool: "Auto",
      auto: "Auto"
    }[String(a).toLowerCase()] ?? Ma(a);
  }
  _iconeModo(a) {
    return {
      off: "mdi:power",
      cool: "mdi:snowflake",
      heat: "mdi:fire",
      fan_only: "mdi:fan",
      dry: "mdi:water-percent",
      auto: "mdi:autorenew",
      heat_cool: "mdi:autorenew"
    }[String(a).toLowerCase()] ?? "mdi:thermostat";
  }
  _rotuloVentilacao(a) {
    const e = String(a).toLowerCase();
    return e === "auto" ? "Auto" : e.includes("low") || e.includes("baixo") ? "Baixa" : e.includes("med") ? "Média" : e.includes("high") || e.includes("alto") ? "Alta" : e.includes("fort") ? "Forte" : Ma(a);
  }
  _iconeVentilacao(a) {
    const e = String(a).toLowerCase();
    return e.includes("auto") ? "mdi:fan-auto" : e.includes("low") || e.includes("baixo") ? "mdi:fan-speed-1" : e.includes("med") ? "mdi:fan-speed-2" : e.includes("high") || e.includes("alto") || e.includes("fort") ? "mdi:fan-speed-3" : "mdi:fan";
  }
  _rotuloSwing(a) {
    const e = String(a).toLowerCase();
    return e ? ["off", "desativado", "desativada", "disabled"].includes(e) ? "Desligado" : ["on", "ativo", "ativada", "enabled"].includes(e) ? "Ativo" : Ma(a) : "Indisponível";
  }
  /**
   * O anel — gauge semicircular de 180°, do mínimo à esquerda ao máximo à
   * direita, com o alvo no arco aceso e a temperatura ambiente sob a linha.
   *
   * A geometria é a do original: centro em (360, 410), raio 285, viewBox
   * 720×460. As duas coroas de marcas (90 externas, 72 internas) e as cinco
   * legendas são calculadas, não desenhadas à mão.
   */
  _renderAnelClimate(a) {
    const s = Number.isFinite(a.minima) ? a.minima : 12, l = Number.isFinite(a.maxima) ? a.maxima : 30, m = Number.isFinite(Number(a.alvo)) ? Math.max(s, Math.min(l, Number(a.alvo))) : s + (l - s) / 2, u = -180 + 180 * Math.max(0, Math.min(1, (m - s) / Math.max(1, l - s))), g = (w, k) => {
      const A = k * Math.PI / 180;
      return { x: 360 + w * Math.cos(A), y: 410 + w * Math.sin(A) };
    }, f = (w, k, A) => {
      const T = g(w, k), I = g(w, A), sa = Math.abs(A - k) <= 180 ? "0" : "1";
      return `M ${T.x.toFixed(3)} ${T.y.toFixed(3)} A ${w} ${w} 0 ${sa} 1 ${I.x.toFixed(3)} ${I.y.toFixed(3)}`;
    }, v = Array.from({ length: 91 }, (w, k) => {
      const A = -180 + 180 * (k / 90), T = k % 15 === 0, I = k % 5 === 0, sa = g(319, A), Ga = g(T ? 293 : I ? 299 : 306, A), Le = T ? "icg-tick major" : I ? "icg-tick medium" : "icg-tick minor";
      return $a`<line x1=${sa.x.toFixed(3)} y1=${sa.y.toFixed(3)} x2=${Ga.x.toFixed(3)} y2=${Ga.y.toFixed(3)} class=${Le}></line>`;
    }), q = Array.from({ length: 73 }, (w, k) => {
      const A = -180 + 180 * (k / 72), T = g(267, A), I = g(251, A);
      return $a`<line x1=${T.x.toFixed(3)} y1=${T.y.toFixed(3)} x2=${I.x.toFixed(3)} y2=${I.y.toFixed(3)} class="icg-inner-tick"></line>`;
    }), b = [
      { texto: `${U(s, 0)}°`, ang: -180, r: 337, cls: "edge" },
      { texto: "10", ang: -148, r: 343, cls: "" },
      { texto: "20", ang: -90, r: 337, cls: "top" },
      { texto: "25", ang: -32, r: 343, cls: "" },
      { texto: `${U(l, 0)}°`, ang: 0, r: 337, cls: "edge" }
    ].map((w) => {
      const k = g(w.r, w.ang);
      return $a`<text x=${k.x.toFixed(3)} y=${k.y.toFixed(3)} text-anchor="middle" dominant-baseline="middle" class=${`icg-label ${w.cls}`}>${w.texto}</text>`;
    }), $ = g(285, u), M = a.alvo == null ? "--" : U(a.alvo, 0), O = a.atual == null ? "--" : U(a.atual, 1), P = (a.modo === "cool" ? "Resfriamento" : a.modo === "heat" ? "Aquecimento" : a.modo === "fan_only" ? "Ventilacao" : "Temperatura").toUpperCase();
    return p`
      <div class="icg-root">
        <div class="icg-shell">
          <svg
            class="icg-svg"
            viewBox="0 0 720 460"
            role="img"
            aria-label=${`Temperatura alvo ${M}°. Ambiente ${O}°.`}
          >
            <defs>
              <linearGradient id="icgActiveBlue" x1="90" y1="340" x2="560" y2="90">
                <stop offset="0%" stop-color="#0078ff"></stop>
                <stop offset="38%" stop-color="#1fb7ff"></stop>
                <stop offset="72%" stop-color="#3ed6ff"></stop>
                <stop offset="100%" stop-color="#96f0ff"></stop>
              </linearGradient>
              <filter id="icgBlueGlow" x="-80%" y="-80%" width="260%" height="260%">
                <feGaussianBlur stdDeviation="7" result="blur"></feGaussianBlur>
                <feColorMatrix
                  in="blur"
                  type="matrix"
                  values="0 0 0 0 0.02  0 0 0 0 0.42  0 0 0 0 1  0 0 0 0.95 0"
                ></feColorMatrix>
                <feMerge><feMergeNode></feMergeNode><feMergeNode in="SourceGraphic"></feMergeNode></feMerge>
              </filter>
              <filter id="icgTextGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feDropShadow dx="0" dy="0" stdDeviation="3" flood-color="#dcecff" flood-opacity="0.24"></feDropShadow>
              </filter>
            </defs>
            <g>${v}</g>
            <g>${q}</g>
            <path d=${f(285, -180, 0)} class="icg-track-shadow"></path>
            <path d=${f(285, u, 0)} class="icg-track-muted"></path>
            <path d=${f(285, -180, u)} class="icg-active-glow"></path>
            <path d=${f(285, -180, u)} class="icg-active-arc"></path>
            ${b}
            <circle cx=${$.x.toFixed(3)} cy=${$.y.toFixed(3)} r="21" class="icg-marker-glow"></circle>
            <circle cx=${$.x.toFixed(3)} cy=${$.y.toFixed(3)} r="13" class="icg-marker-ring"></circle>
            <circle
              cx=${($.x - 4).toFixed(3)}
              cy=${($.y - 5).toFixed(3)}
              r="4"
              class="icg-marker-highlight"
            ></circle>
            <text x=${360} y="260" text-anchor="middle" dominant-baseline="middle" class="icg-center-mode">
              ${P}
            </text>
            <text x=${360} y="328" text-anchor="middle" dominant-baseline="middle" class="icg-center-temp">
              ${M}°
            </text>
            <text x=${360} y="382" text-anchor="middle" dominant-baseline="middle" class="icg-center-sub">
              SET TEMPERATURE
            </text>
            <line x1=${332} y1="408" x2=${388} y2="408" class="icg-center-line"></line>
            <text x=${360} y="432" text-anchor="middle" dominant-baseline="middle" class="icg-ambient">
              Ambient ${O}°
            </text>
          </svg>
        </div>
      </div>
    `;
  }
  /** A/C: cabeçalho com power, anel de temperatura e três controles na base. */
  _renderAC() {
    const a = this._entidadeClimate(), e = this._modeloClimate(), o = e.swing.toLowerCase(), i = ["on", "ativo", "ativada", "enabled"].includes(o) || o.includes("ativ") && !o.includes("desativ"), t = (m) => [...new Set(m.filter(Boolean))], n = this._painelClima, c = {
      mode: t(e.modos).map((m) => ({
        modo: m,
        rotulo: this._rotuloModo(m),
        icone: this._iconeModo(m),
        ativo: m.toLowerCase() === String(e.modo).toLowerCase(),
        servico: "set_hvac_mode",
        campo: "hvac_mode"
      })),
      fan: t(e.ventilacoes).map((m) => ({
        modo: m,
        rotulo: this._rotuloVentilacao(m),
        icone: this._iconeVentilacao(m),
        ativo: m.toLowerCase() === e.ventilacao.toLowerCase(),
        servico: "set_fan_mode",
        campo: "fan_mode"
      })),
      swing: t(e.swings).map((m) => ({
        modo: m,
        rotulo: this._rotuloSwing(m),
        icone: m.toLowerCase() === "off" ? "mdi:air-conditioner" : "mdi:swap-vertical",
        ativo: m.toLowerCase() === o,
        servico: "set_swing_mode",
        campo: "swing_mode"
      }))
    }, s = (m) => {
      if (n !== m) return h;
      const d = c[m];
      return d.length ? p`<div class="ac-popover" role="menu">
        ${d.map(
        (u) => p`
            <button
              type="button"
              class="ac-popover-option ${u.ativo ? "is-active" : ""}"
              role="menuitem"
              @click=${() => {
          this._painelClima = "", a && this._servico("climate", u.servico, { entity_id: a, [u.campo]: u.modo }), this.requestUpdate();
        }}
            >
              <bruno-icon icon=${u.icone}></bruno-icon><span>${u.rotulo}</span>
            </button>
          `
      )}
      </div>` : p`<div class="ac-popover" role="menu">
          <button type="button" class="ac-popover-option" disabled>
            <bruno-icon icon="mdi:alert-circle-outline"></bruno-icon><span>Indisponível</span>
          </button>
        </div>`;
    }, l = (m, d, u, g) => p`
      <div class="ac-control-wrap">
        <button
          type="button"
          class="ac-action ${n === m ? "is-open" : ""}"
          aria-expanded=${n === m ? "true" : "false"}
          ?disabled=${e.indisponivel || !a}
          @click=${() => {
      this._painelClima = this._painelClima === m ? "" : m, this.requestUpdate();
    }}
        >
          <span class="ac-action-icon"><bruno-icon icon=${d}></bruno-icon></span>
          <span class="ac-action-text"><small>${u}</small><strong>${g}</strong></span>
        </button>
        ${s(m)}
      </div>
    `;
    return p`
      <div class="glass-card ac-card ac-card-lean">
        <div class="ac-lean-head">
          <div class="mh-head-title ac-head-title">
            <span class="micro-icon tone-cyan"><bruno-icon icon="mdi:air-conditioner"></bruno-icon></span>
            <div class="module-title">Ar-condicionado</div>
            ${this._botaoRecolherFolha()}
          </div>
          <div class="ac-top-stack">
            <button
              type="button"
              class="mh-menu ac-more-button"
              title="Mais detalhes"
              aria-label="Mais detalhes"
              @click=${() => {
      this._painelClima = "", this._maisInfo(a);
    }}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
            <button
              type="button"
              class="ac-power-floating ${e.ativo ? "is-active" : ""}"
              aria-label=${e.ativo ? "Desligar ar condicionado" : "Ligar ar condicionado"}
              ?disabled=${e.indisponivel || !a}
              @click=${() => {
      a && (this._painelClima = "", this._servico("climate", e.ativo ? "turn_off" : "turn_on", { entity_id: a }));
    }}
            >
              <bruno-icon icon="mdi:power"></bruno-icon>
            </button>
            ${this._botaoFecharFolha()}
          </div>
        </div>
        <div class="ac-lean-mid">
          <div class="ac-ring">${this._renderAnelClimate(e)}</div>
        </div>
        <div class="ac-lean-foot">
          ${l(
      "mode",
      "mdi:thermostat-auto",
      "Modo",
      !e.ativo || e.modo === "off" ? "Desligado" : this._rotuloModo(e.modo)
    )}
          ${l("fan", "mdi:fan", "Ventilação", this._rotuloVentilacao(e.ventilacao))}
          ${l(
      "swing",
      "mdi:air-conditioner",
      "Swing",
      e.swing ? this._rotuloSwing(e.swing) : i ? "Ativo" : "Desligado"
    )}
        </div>
      </div>
    `;
  }
  /**
   * Cozinha: grid próprio de três colunas.
   *
   *   "topband topband topband"
   *   "hero    hero    right"
   *   "cams    appliances appliances"
   *
   * Não há `content-left` nem A/C, e o hero, as câmeras e os eletrodomésticos
   * são filhos DIRETOS da raiz — cada um ocupando sua área. Lido do DOM da
   * subview atual; deduzir do CSS teria dado o grid errado, porque o arquivo
   * guarda definições antigas empilhadas.
   */
  _corpoCozinha() {
    return p`
      <div class="hero-panel is-unconfigured">
        <div class="hero-stage hero-atmosphere"><div class="hero-content"></div></div>
      </div>
      <div class="right-column">${this._renderLightsDock()}</div>
      ${this._renderCameras()}
      <div class="glass-card appliances-card kitchen-appliances-card">
        <div class="mh-head appliances-head">
          <div class="mh-head-title">
            <!-- O nome tem de ser um dos apelidos da tabela de Hugeicons.
                 "silverware-fork-knife" não está lá e caía no genérico — o
                 círculo que aparecia no lugar do ícone. O original usa este,
                 que resolve para "hugeicons:electric-home-01". -->
            <span class="micro-icon tone-amber">
              <bruno-icon icon="mdi:home-lightning-bolt-outline"></bruno-icon>
            </span>
            <div class="module-title">Eletrodomésticos</div>
            ${this._botaoRecolherFolha()}
          </div>
          ${this._botaoFecharFolha()}
        </div>
        <div class="appliances-grid">${this._renderEletrodomesticos()}</div>
      </div>
      ${this._renderResumoTelefone()}
    `;
  }
}
customElements.get("bruno-room-subview") || customElements.define("bruno-room-subview", Bi);
const xa = window;
xa.customCards = xa.customCards ?? [];
xa.customCards.some((r) => r.type === "bruno-room-subview") || xa.customCards.push({
  type: "bruno-room-subview",
  name: "Bruno · Subview de cômodo",
  description: "Subview parametrizada por cômodo (arquitetura nova)."
});
class Ui {
  constructor() {
    this.definicoes = /* @__PURE__ */ new Map();
  }
  registrar(a) {
    if (this.definicoes.has(a.type))
      throw new Error(`device-registry: tipo já registrado — "${a.type}"`);
    this.definicoes.set(a.type, a);
  }
  obter(a) {
    return this.definicoes.get(a);
  }
  tipos() {
    return [...this.definicoes.keys()];
  }
  /** Um tipo desconhecido não derruba o painel — vira uma entrada inerte. */
  conhece(a) {
    return this.definicoes.has(a);
  }
}
const S = new Ui();
function Gi(r) {
  const a = S.obter(r.type);
  if (a)
    return a.create(r);
}
function ue(r) {
  return S.obter(r.type)?.entities(r) ?? [];
}
function Hi(r) {
  const a = [], e = /* @__PURE__ */ new Set();
  for (const [o, i] of r.entries()) {
    const t = i.id || `posição ${o}`;
    i.id ? e.has(i.id) ? a.push(`id repetido — "${i.id}"`) : e.add(i.id) : a.push(`dispositivo em ${t}: falta "id"`), i.type ? S.conhece(i.type) || a.push(`dispositivo "${t}": tipo não registrado — "${i.type}"`) : a.push(`dispositivo "${t}": falta "type"`), i.name || a.push(`dispositivo "${t}": falta "name"`);
    const n = S.obter(i.type)?.validate?.(i);
    n && !n.ok && a.push(...n.erros);
  }
  return { ok: a.length === 0, erros: a };
}
function Ne(r, a) {
  if (typeof r == "string") return r || void 0;
  if (!Array.isArray(r)) return;
  const e = r.filter((i) => typeof i == "string" && !!i);
  return e.find((i) => {
    const t = a?.states[i];
    return t && !["unavailable", "unknown", ""].includes(String(t.state).toLowerCase());
  }) ?? e[0];
}
function Yi(r) {
  const a = /* @__PURE__ */ new Map();
  for (const e of r) {
    const o = e.group ?? "Casa", i = a.get(o);
    i ? i.push(e) : a.set(o, [e]);
  }
  return [...a.entries()].map(([e, o]) => ({ grupo: e, itens: o }));
}
const he = [
  {
    id: "sala-tv",
    type: "media-tv",
    name: "TV da Sala",
    group: "Sala",
    icon: "mdi:television-classic",
    entity: "media_player.android_tv_192_168_3_17",
    version: 1,
    config: {
      // O controle remoto reaproveita o mesmo caminho da subview da Sala.
      remote: "remote.atv"
    }
  },
  {
    id: "sala-ac",
    type: "climate",
    name: "Ar-condicionado da Sala",
    group: "Sala",
    icon: "mdi:air-conditioner",
    entity: "climate.sl_ar_condicionado",
    version: 1
  }
], Xi = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], Qi = ["on", "playing", "paused", "idle", "buffering"];
class va extends E {
  static {
    this.properties = { _hass: { state: !0 } };
  }
  set instancia(a) {
    this._instancia = a, this.requestUpdate();
  }
  set hass(a) {
    this._hass = a, this.requestUpdate();
  }
  get _entityId() {
    return Ne(this._instancia?.entity, this._hass);
  }
  _estado(a) {
    return a && this._hass ? this._hass.states[a] : void 0;
  }
  _servico(a, e, o) {
    this._hass?.callService(a, e, o, o);
  }
  static {
    this.estilosComuns = _`
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
}
class Wi extends va {
  static {
    this.styles = [va.estilosComuns];
  }
  render() {
    const a = this._entityId, e = this._estado(a);
    if (!e) return p`<p class="indisponivel">Entidade indisponível: ${a ?? "—"}</p>`;
    const o = Qi.includes(String(e.state)), i = String(e.attributes.source ?? e.attributes.app_name ?? "") || "HDMI 1", t = e.attributes.volume_level != null ? Math.round(Number(e.attributes.volume_level) * 100) : null;
    return p`
      <div class="titulo">
        <strong>${this._instancia?.name ?? "TV"}</strong>
        <small>${o ? `Ligada · ${i}` : "Desligada"}</small>
      </div>

      <div class="linha">
        <button
          class=${o ? "is-on" : ""}
          @click=${() => this._servico("homeassistant", "toggle", { entity_id: a })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${o ? "Desligar" : "Ligar"}
        </button>
        <button ?disabled=${!o} @click=${() => this._servico("media_player", "media_play_pause", { entity_id: a })}>
          <bruno-icon icon="mdi:pause"></bruno-icon>Play / Pause
        </button>
      </div>

      ${o ? p`<div class="linha">
            <button @click=${() => this._servico("media_player", "volume_down", { entity_id: a })}>
              <bruno-icon icon="mdi:volume-minus"></bruno-icon>
            </button>
            <span class="valor">${t == null ? "—" : `${t}%`}</span>
            <button @click=${() => this._servico("media_player", "volume_up", { entity_id: a })}>
              <bruno-icon icon="mdi:volume-plus"></bruno-icon>
            </button>
            <button @click=${() => this._servico("media_player", "volume_mute", { entity_id: a, is_volume_muted: !e.attributes.is_volume_muted })}>
              <bruno-icon icon="mdi:volume-mute"></bruno-icon>
            </button>
          </div>` : h}

      <div class="linha">
        <button @click=${() => this._maisInfo(a)}>
          <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>Mais detalhes
        </button>
      </div>
    `;
  }
  _maisInfo(a) {
    a && this.dispatchEvent(
      new CustomEvent("hass-more-info", { detail: { entityId: a }, bubbles: !0, composed: !0 })
    );
  }
}
class Zi extends va {
  static {
    this.styles = [va.estilosComuns];
  }
  render() {
    const a = this._entityId, e = this._estado(a);
    if (!e) return p`<p class="indisponivel">Entidade indisponível: ${a ?? "—"}</p>`;
    const o = Xi.includes(String(e.state)), i = Number(e.attributes.temperature), t = Number(e.attributes.current_temperature), n = Number.isFinite(Number(e.attributes.min_temp)) ? Number(e.attributes.min_temp) : 16, c = Number.isFinite(Number(e.attributes.max_temp)) ? Number(e.attributes.max_temp) : 30, s = Number(e.attributes.target_temp_step) || 1, l = Array.isArray(e.attributes.hvac_modes) ? e.attributes.hvac_modes : [], m = (d) => this._servico("climate", "set_temperature", {
      entity_id: a,
      temperature: Math.max(n, Math.min(c, d))
    });
    return p`
      <div class="titulo">
        <strong>${this._instancia?.name ?? "Ar-condicionado"}</strong>
        <small>${o ? `${this._rotulo(e.state)} · ambiente ${Number.isFinite(t) ? t : "—"}°` : "Desligado"}</small>
      </div>

      <div class="linha">
        <button
          class=${o ? "is-on" : ""}
          @click=${() => this._servico("climate", o ? "turn_off" : "turn_on", { entity_id: a })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${o ? "Desligar" : "Ligar"}
        </button>
      </div>

      <div class="linha">
        <button ?disabled=${!o} @click=${() => m((Number.isFinite(i) ? i : 22) - s)}>
          <bruno-icon icon="mdi:minus"></bruno-icon>
        </button>
        <span class="valor">${Number.isFinite(i) ? `${i}°` : "—"}</span>
        <button ?disabled=${!o} @click=${() => m((Number.isFinite(i) ? i : 22) + s)}>
          <bruno-icon icon="mdi:plus"></bruno-icon>
        </button>
      </div>

      ${l.length ? p`<div class="linha">
            ${l.map(
      (d) => p`<button
                class=${String(e.state) === d ? "is-on" : ""}
                @click=${() => this._servico("climate", "set_hvac_mode", { entity_id: a, hvac_mode: d })}
              >
                ${this._rotulo(d)}
              </button>`
    )}
          </div>` : h}
    `;
  }
  _rotulo(a) {
    return {
      off: "Desligado",
      cool: "Frio",
      heat: "Aquecimento",
      fan_only: "Ventilar",
      dry: "Secar",
      heat_cool: "Auto",
      auto: "Auto"
    }[String(a).toLowerCase()] ?? a;
  }
}
customElements.get("bruno-control-tv") || customElements.define("bruno-control-tv", Wi);
customElements.get("bruno-control-climate") || customElements.define("bruno-control-climate", Zi);
function Pe(r) {
  return (a) => {
    const e = document.createElement(r);
    return e.instancia = a, e;
  };
}
S.conhece("media-tv") || S.registrar({
  type: "media-tv",
  label: "TV",
  icon: "mdi:television-classic",
  create: Pe("bruno-control-tv"),
  entities: (r) => [typeof r.entity == "string" ? r.entity : r.entity?.[0] ?? ""].filter(Boolean),
  validate: (r) => ({
    ok: !!r.entity,
    erros: r.entity ? [] : [`dispositivo "${r.id}": TV exige "entity"`]
  })
});
S.conhece("climate") || S.registrar({
  type: "climate",
  label: "Ar-condicionado",
  icon: "mdi:air-conditioner",
  create: Pe("bruno-control-climate"),
  entities: (r) => [typeof r.entity == "string" ? r.entity : r.entity?.[0] ?? ""].filter(Boolean),
  validate: (r) => ({
    ok: !!r.entity,
    erros: r.entity ? [] : [`dispositivo "${r.id}": clima exige "entity"`]
  })
});
const Oa = "bruno-devices-panel", Ji = ["on", "playing", "paused", "idle", "buffering", "cool", "heat", "fan_only", "dry", "heat_cool", "auto"];
class Ki extends E {
  constructor() {
    super(...arguments), this._selecionado = "", this._controles = /* @__PURE__ */ new Map(), this._observador = new Ba(
      he.flatMap((a) => ue(a))
    ), this._motivo = "";
  }
  static {
    this.properties = {
      _selecionado: { state: !0 }
    };
  }
  set hass(a) {
    this._hass = a;
    for (const o of this._controles.values()) o.hass = a;
    const e = this._observador.mudancas(a);
    e.length !== 0 && (this._motivo = Ua(e), this.requestUpdate());
  }
  get _dispositivos() {
    return he;
  }
  _instancia(a) {
    return this._dispositivos.find((e) => e.id === a);
  }
  /** O primeiro ativo abre por padrão; sem nenhum, o primeiro da lista. */
  get _idAberto() {
    return this._selecionado && this._instancia(this._selecionado) ? this._selecionado : this._dispositivos.find((e) => this._estaAtivo(e))?.id ?? this._dispositivos[0]?.id ?? "";
  }
  _estaAtivo(a) {
    const e = Ne(a.entity, this._hass), o = e && this._hass ? this._hass.states[e] : void 0;
    return !!o && Ji.includes(String(o?.state ?? "").toLowerCase());
  }
  /**
   * O controle do dispositivo aberto.
   *
   * Criado uma vez por instância e guardado. Tipo desconhecido não some nem
   * derruba a lista: vira uma entrada inválida, com o motivo à vista.
   */
  _controleDe(a) {
    const e = this._instancia(a);
    if (!e) return h;
    if (!S.conhece(e.type))
      return p`<p class="aviso">
        Tipo de dispositivo não registrado: <code>${e.type}</code>.
        Registre o controle em <code>components/devices/controls.ts</code>.
      </p>`;
    let o = this._controles.get(a);
    if (!o) {
      const i = Gi(e);
      if (!i) return h;
      o = i, this._controles.set(a, o);
    }
    return this._hass && (o.hass = this._hass), o;
  }
  connectedCallback() {
    super.connectedCallback(), Ia(Oa);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), Da(Oa);
  }
  /** Mede o custo de cada atualizacao (Fase 6.0.1). */
  update(a) {
    const e = this._motivo;
    this._motivo = "", Ra(Oa, () => super.update(a), e || "outro");
  }
  render() {
    const a = Hi(this._dispositivos), e = this._idAberto;
    return p`
      <div class="painel" role="dialog" aria-modal="true" aria-label="Dispositivos">
        <header class="cabecalho">
          <span class="micro-icon tone-blue"><bruno-icon icon="mdi:remote"></bruno-icon></span>
          <div class="titulo"><strong>Dispositivos</strong><span>Controle rápido dos equipamentos</span></div>
          <button
            class="fechar"
            type="button"
            aria-label="Fechar"
            @click=${() => this.dispatchEvent(new CustomEvent("fechar", { bubbles: !0, composed: !0 }))}
          >
            &times;
          </button>
        </header>

        ${a.ok ? h : p`<p class="aviso">
              Configuração de dispositivos com problema:
              ${a.erros.map((o) => p`<span>${o}</span>`)}
            </p>`}

        <div class="corpo">
          <nav class="lista" aria-label="Lista de dispositivos">
            ${Yi(this._dispositivos).map(
      (o) => p`
                <div class="grupo">
                  <h3>${o.grupo}</h3>
                  ${o.itens.map((i) => {
        const t = this._estaAtivo(i), n = i.id === e;
        return p`<button
                      type="button"
                      class="item ${n ? "is-selected" : ""} ${t ? "is-active" : ""}"
                      aria-pressed=${n ? "true" : "false"}
                      @click=${() => {
          this._selecionado = i.id, this.requestUpdate();
        }}
                    >
                      <span class="item-icone">
                        <bruno-icon icon=${i.icon ?? S.obter(i.type)?.icon ?? "mdi:remote"}></bruno-icon>
                      </span>
                      <span class="item-nome">${i.name}</span>
                      <span class="ponto" aria-hidden="true"></span>
                    </button>`;
      })}
                </div>
              `
    )}
          </nav>

          <section class="controle">${this._controleDe(e)}</section>
        </div>
      </div>
    `;
  }
  /** Diagnóstico: quais entidades este painel observa. Usado na Fase 6.1. */
  entidadesObservadas() {
    return [...new Set(this._dispositivos.flatMap((a) => ue(a)))];
  }
  static {
    this.styles = _`
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
}
customElements.get("bruno-devices-panel") || customElements.define("bruno-devices-panel", Ki);
eo();
console.info("[bruno-dashboard] build 20260814");
globalThis.BrunoCameraEngine = Re;
globalThis.BrunoCameraLive = si;
//# sourceMappingURL=bruno-dashboard.CHkp3iY_.js.map
