function ie() {
  return { criados: 0, encerrados: 0 };
}
function St(r) {
  return {
    nome: r,
    instancias: ie(),
    render: { total: 0, duracaoTotal: 0, ultima: 0, pior: 0 },
    motivos: /* @__PURE__ */ new Map(),
    timers: ie(),
    listeners: ie(),
    assinaturas: ie(),
    requisicoes: { total: 0, falhas: 0, duracaoTotal: 0, pior: 0 }
  };
}
const At = 720, Ct = 200, Mt = 24, Et = 4, Le = 3e4, Tt = 12, he = 10 * 1024 * 1024, It = 64;
function ge(r) {
  let e = Number.POSITIVE_INFINITY;
  for (const t of r) t.usado < e && (e = t.usado);
  return Number.isFinite(e) ? e : 0;
}
class Dt {
  constructor() {
    this.componentes = /* @__PURE__ */ new Map(), this.memoria = [], this.tarefas = [], this.inicio = 0, this.buildId = "desconhecido", this.tarefasTotal = 0, this.tarefasDuracao = 0, this.tarefasPior = 0, this.tarefasNaCarga = 0, this.pisoGlobal = Number.POSITIVE_INFINITY, this.picoGlobal = 0, this.valoresDeMemoria = /* @__PURE__ */ new Set();
  }
  /** Marca zero do relógio. Chamado uma vez, por quem inicia os observadores. */
  iniciar(e, t) {
    this.inicio = e, this.buildId = t;
  }
  de(e) {
    let t = this.componentes.get(e);
    return t || (t = St(e), this.componentes.set(e, t)), t;
  }
  // ── Pontos de coleta ──────────────────────────────────────────────────────
  conectou(e) {
    this.de(e).instancias.criados++;
  }
  desconectou(e) {
    this.de(e).instancias.encerrados++;
  }
  /**
   * Um render aconteceu.
   *
   * `motivo` é opcional porque nem todo componente sabe dizer o que o acordou —
   * mas os que sabem transformam "renderizou 3.328 vezes" em "renderizou 3.328
   * vezes por causa de `sensor.X`", que é acionável.
   */
  renderizou(e, t, i) {
    const a = this.de(e), o = a.render;
    if (o.total++, o.duracaoTotal += t, o.ultima = t, t > o.pior && (o.pior = t), !i) return;
    const n = a.motivos.has(i) || a.motivos.size < Mt ? i : "outros";
    a.motivos.set(n, (a.motivos.get(n) ?? 0) + 1);
  }
  timerCriado(e) {
    this.de(e).timers.criados++;
  }
  timerEncerrado(e) {
    this.de(e).timers.encerrados++;
  }
  listenerCriado(e) {
    this.de(e).listeners.criados++;
  }
  listenerEncerrado(e) {
    this.de(e).listeners.encerrados++;
  }
  assinou(e) {
    this.de(e).assinaturas.criados++;
  }
  desassinou(e) {
    this.de(e).assinaturas.encerrados++;
  }
  requisicao(e, t, i) {
    const a = this.de(e).requisicoes;
    a.total++, i || a.falhas++, a.duracaoTotal += t, t > a.pior && (a.pior = t);
  }
  memoriaAmostrada(e) {
    this.memoria.push(e), this.memoria.length > At && this.memoria.shift(), e.usado < this.pisoGlobal && (this.pisoGlobal = e.usado), e.usado > this.picoGlobal && (this.picoGlobal = e.usado), this.valoresDeMemoria.size < It && this.valoresDeMemoria.add(e.usado);
  }
  tarefaLonga(e) {
    this.tarefas.push(e), this.tarefas.length > Ct && this.tarefas.shift(), this.tarefasTotal++, this.tarefasDuracao += e.duracao, e.duracao > this.tarefasPior && (this.tarefasPior = e.duracao), e.em < Le && this.tarefasNaCarga++;
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
  marcar(e) {
    return this.marca = this.contagem(), this.marca;
  }
  limparMarca() {
    this.marca = void 0;
  }
  contagem() {
    const e = (t) => {
      let i = 0;
      for (const a of this.componentes.values()) i += t(a).criados - t(a).encerrados;
      return i;
    };
    return {
      instancias: e((t) => t.instancias),
      timers: e((t) => t.timers),
      listeners: e((t) => t.listeners),
      assinaturas: e((t) => t.assinaturas)
    };
  }
  // ── Leitura ───────────────────────────────────────────────────────────────
  leituraDeMemoria() {
    const e = this.memoria, t = e[0], i = e[e.length - 1], a = e.length, o = Math.max(1, Math.floor(a / 3)), n = a ? ge(e.slice(0, o)) : 0, l = a ? ge(e.slice(a - o)) : 0, s = l - n, d = this.valoresDeMemoria.size, m = a ? ge(e.slice(o, a - o)) : 0, p = l - m;
    let h;
    return a < Tt ? h = `Só ${a} amostra(s) — o piso ainda não significa nada.` : d < 2 ? h = `${a} amostras, mas um único valor de heap: o navegador ainda não atualizou a leitura. Sem informação — precisa de sessão longa.` : s > he && p > he ? h = `Piso subiu ${(s / 1048576).toFixed(1)} MB e AINDA sobe (${(p / 1048576).toFixed(1)} MB no último terço) — isto é retenção.` : s > he ? h = `Subiu ${(s / 1048576).toFixed(1)} MB desde a carga e estabilizou em ${(l / 1048576).toFixed(0)} MB — é custo de partida, não vazamento.` : h = `Piso estável em ${d} degraus — a variação do heap é coleta de lixo, não vazamento.`, {
      amostras: a,
      ...t ? { primeira: t } : {},
      ...i ? { ultima: i } : {},
      crescimento: t && i ? i.usado - t.usado : 0,
      piso: Number.isFinite(this.pisoGlobal) ? this.pisoGlobal : 0,
      pico: this.picoGlobal,
      pisoInicial: n,
      pisoFinal: l,
      crescimentoDoPiso: s,
      degraus: d,
      veredito: h
    };
  }
  leituraDeTarefas(e) {
    const t = this.tarefasTotal - this.tarefasNaCarga, i = Math.max(0, e - Le) / 6e4;
    return {
      total: this.tarefasTotal,
      duracaoTotal: Math.round(this.tarefasDuracao),
      pior: Math.round(this.tarefasPior),
      naCarga: this.tarefasNaCarga,
      depoisDaCarga: t,
      porMinuto: i > 0 ? Number((t / i).toFixed(1)) : 0
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
  instantaneo(e) {
    const i = [...this.componentes.values()].sort(
      (l, s) => l.nome.localeCompare(s.nome)
    ).map((l) => ({
      nome: l.nome,
      instancias: { ...l.instancias },
      vivos: l.instancias.criados - l.instancias.encerrados,
      render: { ...l.render },
      motivos: [...l.motivos.entries()].map(([s, d]) => ({ motivo: s, total: d })).sort((s, d) => d.total - s.total).slice(0, Et),
      timers: { ...l.timers },
      listeners: { ...l.listeners },
      assinaturas: { ...l.assinaturas },
      requisicoes: { ...l.requisicoes }
    })), a = this.contagem(), o = Math.round(e - this.inicio), n = this.marca;
    return {
      formato: 2,
      build: this.buildId,
      capturadoEm: (/* @__PURE__ */ new Date()).toISOString(),
      desdeOCarregamento: o,
      componentes: i,
      memoria: this.leituraDeMemoria(),
      tarefasLongas: this.leituraDeTarefas(o),
      vazamentos: {
        timers: a.timers,
        listeners: a.listeners,
        assinaturas: a.assinaturas
      },
      vivos: a.instancias,
      ...n ? {
        desdeAMarca: {
          instancias: a.instancias - n.instancias,
          timers: a.timers - n.timers,
          listeners: a.listeners - n.listeners,
          assinaturas: a.assinaturas - n.assinaturas
        }
      } : {}
    };
  }
  /** Zera tudo. Usado antes de um ciclo de medição. */
  zerar() {
    this.componentes.clear(), this.memoria.length = 0, this.tarefas.length = 0, this.marca = void 0, this.tarefasTotal = 0, this.tarefasDuracao = 0, this.tarefasPior = 0, this.tarefasNaCarga = 0, this.pisoGlobal = Number.POSITIVE_INFINITY, this.picoGlobal = 0, this.valoresDeMemoria.clear();
  }
}
const w = new Dt(), Ot = 5e3, Y = { timerMemoria: void 0, observador: void 0 };
function Pt() {
  const r = performance;
  if (r.memory)
    return { usado: r.memory.usedJSHeapSize, limite: r.memory.jsHeapSizeLimit };
}
function Lt(r) {
  if (Y.timerMemoria !== void 0 || Y.observador !== void 0) return;
  w.iniciar(performance.now(), r);
  const e = () => {
    const t = Pt();
    t && w.memoriaAmostrada({ em: Math.round(performance.now()), ...t });
  };
  if (e(), Y.timerMemoria = window.setInterval(e, Ot), "PerformanceObserver" in window)
    try {
      const t = new PerformanceObserver((i) => {
        for (const a of i.getEntries())
          w.tarefaLonga({
            em: Math.round(a.startTime),
            duracao: Math.round(a.duration)
          });
      });
      t.observe({ entryTypes: ["longtask"] }), Y.observador = t;
    } catch {
    }
}
function Nt() {
  return Y.timerMemoria !== void 0;
}
const W = /* @__PURE__ */ new Map();
function U(r, e, t) {
  const i = window.setTimeout(() => {
    W.delete(i), w.timerEncerrado(r), e();
  }, t);
  return W.set(i, "espera"), w.timerCriado(r), i;
}
function be(r, e) {
  if (e === void 0) return;
  const t = W.get(e);
  t !== void 0 && (t === "intervalo" ? window.clearInterval(e) : window.clearTimeout(e), W.delete(e), w.timerEncerrado(r));
}
function jt() {
  return W.size;
}
function Rt(r, e, t, i, a) {
  e.addEventListener(t, i, a), w.listenerCriado(r);
}
function Bt(r, e, t, i, a) {
  e.removeEventListener(t, i, a), w.listenerEncerrado(r);
}
function ae(r, e, t) {
  w.requisicao(r, e, t);
}
function ze(r) {
  w.conectou(r);
}
function qe(r) {
  w.desconectou(r);
}
function Se(r, e, t) {
  const i = performance.now();
  try {
    return e();
  } finally {
    w.renderizou(r, performance.now() - i, t);
  }
}
function rt() {
  return w.marcar(performance.now());
}
function Vt() {
  w.limparMarca();
}
function Ut() {
  try {
    const r = import.meta.url;
    return r.slice(r.lastIndexOf("/") + 1) || "desconhecido";
  } catch {
    return "desconhecido";
  }
}
function ne() {
  return { ...w.instantaneo(performance.now()), timersVivos: jt() };
}
function Ft() {
  if (Nt()) return;
  Lt(Ut());
  const r = {
    instantaneo: ne,
    texto: () => JSON.stringify(ne(), null, 2),
    zerar: () => w.zerar(),
    marcar: rt,
    limparMarca: Vt
  };
  globalThis.brunoRuntime = r;
}
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const re = globalThis, Ae = re.ShadowRoot && (re.ShadyCSS === void 0 || re.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Ce = Symbol(), Ne = /* @__PURE__ */ new WeakMap();
let nt = class {
  constructor(e, t, i) {
    if (this._$cssResult$ = !0, i !== Ce) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if (Ae && e === void 0) {
      const i = t !== void 0 && t.length === 1;
      i && (e = Ne.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), i && Ne.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const Gt = (r) => new nt(typeof r == "string" ? r : r + "", void 0, Ce), x = (r, ...e) => {
  const t = r.length === 1 ? r[0] : e.reduce((i, a, o) => i + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(a) + r[o + 1], r[0]);
  return new nt(t, r, Ce);
}, Ht = (r, e) => {
  if (Ae) r.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const i = document.createElement("style"), a = re.litNonce;
    a !== void 0 && i.setAttribute("nonce", a), i.textContent = t.cssText, r.appendChild(i);
  }
}, je = Ae ? (r) => r : (r) => r instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const i of e.cssRules) t += i.cssText;
  return Gt(t);
})(r) : r;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: Yt, defineProperty: Zt, getOwnPropertyDescriptor: Wt, getOwnPropertyNames: Xt, getOwnPropertySymbols: Qt, getPrototypeOf: Jt } = Object, me = globalThis, Re = me.trustedTypes, Kt = Re ? Re.emptyScript : "", ei = me.reactiveElementPolyfillSupport, Z = (r, e) => r, $e = { toAttribute(r, e) {
  switch (e) {
    case Boolean:
      r = r ? Kt : null;
      break;
    case Object:
    case Array:
      r = r == null ? r : JSON.stringify(r);
  }
  return r;
}, fromAttribute(r, e) {
  let t = r;
  switch (e) {
    case Boolean:
      t = r !== null;
      break;
    case Number:
      t = r === null ? null : Number(r);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(r);
      } catch {
        t = null;
      }
  }
  return t;
} }, st = (r, e) => !Yt(r, e), Be = { attribute: !0, type: String, converter: $e, reflect: !1, useDefault: !1, hasChanged: st };
Symbol.metadata ??= Symbol("metadata"), me.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let L = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Be) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const i = Symbol(), a = this.getPropertyDescriptor(e, i, t);
      a !== void 0 && Zt(this.prototype, e, a);
    }
  }
  static getPropertyDescriptor(e, t, i) {
    const { get: a, set: o } = Wt(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: a, set(n) {
      const l = a?.call(this);
      o?.call(this, n), this.requestUpdate(e, l, i);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Be;
  }
  static _$Ei() {
    if (this.hasOwnProperty(Z("elementProperties"))) return;
    const e = Jt(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(Z("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(Z("properties"))) {
      const t = this.properties, i = [...Xt(t), ...Qt(t)];
      for (const a of i) this.createProperty(a, t[a]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [i, a] of t) this.elementProperties.set(i, a);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, i] of this.elementProperties) {
      const a = this._$Eu(t, i);
      a !== void 0 && this._$Eh.set(a, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const i = new Set(e.flat(1 / 0).reverse());
      for (const a of i) t.unshift(je(a));
    } else e !== void 0 && t.push(je(e));
    return t;
  }
  static _$Eu(e, t) {
    const i = t.attribute;
    return i === !1 ? void 0 : typeof i == "string" ? i : typeof e == "string" ? e.toLowerCase() : void 0;
  }
  constructor() {
    super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
  }
  _$Ev() {
    this._$ES = new Promise((e) => this.enableUpdating = e), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((e) => e(this));
  }
  addController(e) {
    (this._$EO ??= /* @__PURE__ */ new Set()).add(e), this.renderRoot !== void 0 && this.isConnected && e.hostConnected?.();
  }
  removeController(e) {
    this._$EO?.delete(e);
  }
  _$E_() {
    const e = /* @__PURE__ */ new Map(), t = this.constructor.elementProperties;
    for (const i of t.keys()) this.hasOwnProperty(i) && (e.set(i, this[i]), delete this[i]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return Ht(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, i) {
    this._$AK(e, i);
  }
  _$ET(e, t) {
    const i = this.constructor.elementProperties.get(e), a = this.constructor._$Eu(e, i);
    if (a !== void 0 && i.reflect === !0) {
      const o = (i.converter?.toAttribute !== void 0 ? i.converter : $e).toAttribute(t, i.type);
      this._$Em = e, o == null ? this.removeAttribute(a) : this.setAttribute(a, o), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const i = this.constructor, a = i._$Eh.get(e);
    if (a !== void 0 && this._$Em !== a) {
      const o = i.getPropertyOptions(a), n = typeof o.converter == "function" ? { fromAttribute: o.converter } : o.converter?.fromAttribute !== void 0 ? o.converter : $e;
      this._$Em = a;
      const l = n.fromAttribute(t, o.type);
      this[a] = l ?? this._$Ej?.get(a) ?? l, this._$Em = null;
    }
  }
  requestUpdate(e, t, i, a = !1, o) {
    if (e !== void 0) {
      const n = this.constructor;
      if (a === !1 && (o = this[e]), i ??= n.getPropertyOptions(e), !((i.hasChanged ?? st)(o, t) || i.useDefault && i.reflect && o === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, i)))) return;
      this.C(e, t, i);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: i, reflect: a, wrapped: o }, n) {
    i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), o !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || i || (t = void 0), this._$AL.set(e, t)), a === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
  }
  async _$EP() {
    this.isUpdatePending = !0;
    try {
      await this._$ES;
    } catch (t) {
      Promise.reject(t);
    }
    const e = this.scheduleUpdate();
    return e != null && await e, !this.isUpdatePending;
  }
  scheduleUpdate() {
    return this.performUpdate();
  }
  performUpdate() {
    if (!this.isUpdatePending) return;
    if (!this.hasUpdated) {
      if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
        for (const [a, o] of this._$Ep) this[a] = o;
        this._$Ep = void 0;
      }
      const i = this.constructor.elementProperties;
      if (i.size > 0) for (const [a, o] of i) {
        const { wrapped: n } = o, l = this[a];
        n !== !0 || this._$AL.has(a) || l === void 0 || this.C(a, void 0, o, l);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((i) => i.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (i) {
      throw e = !1, this._$EM(), i;
    }
    e && this._$AE(t);
  }
  willUpdate(e) {
  }
  _$AE(e) {
    this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(e)), this.updated(e);
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
  shouldUpdate(e) {
    return !0;
  }
  update(e) {
    this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
  }
  updated(e) {
  }
  firstUpdated(e) {
  }
};
L.elementStyles = [], L.shadowRootOptions = { mode: "open" }, L[Z("elementProperties")] = /* @__PURE__ */ new Map(), L[Z("finalized")] = /* @__PURE__ */ new Map(), ei?.({ ReactiveElement: L }), (me.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Me = globalThis, Ve = (r) => r, se = Me.trustedTypes, Ue = se ? se.createPolicy("lit-html", { createHTML: (r) => r }) : void 0, lt = "$lit$", E = `lit$${Math.random().toFixed(9).slice(2)}$`, ct = "?" + E, ti = `<${ct}>`, P = document, X = () => P.createComment(""), Q = (r) => r === null || typeof r != "object" && typeof r != "function", Ee = Array.isArray, ii = (r) => Ee(r) || typeof r?.[Symbol.iterator] == "function", fe = `[ 	
\f\r]`, F = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Fe = /-->/g, Ge = />/g, T = RegExp(`>|${fe}(?:([^\\s"'>=/]+)(${fe}*=${fe}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), He = /'/g, Ye = /"/g, dt = /^(?:script|style|textarea|title)$/i, pt = (r) => (e, ...t) => ({ _$litType$: r, strings: e, values: t }), c = pt(1), ve = pt(2), j = Symbol.for("lit-noChange"), u = Symbol.for("lit-nothing"), Ze = /* @__PURE__ */ new WeakMap(), D = P.createTreeWalker(P, 129);
function mt(r, e) {
  if (!Ee(r) || !r.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ue !== void 0 ? Ue.createHTML(e) : e;
}
const ai = (r, e) => {
  const t = r.length - 1, i = [];
  let a, o = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = F;
  for (let l = 0; l < t; l++) {
    const s = r[l];
    let d, m, p = -1, h = 0;
    for (; h < s.length && (n.lastIndex = h, m = n.exec(s), m !== null); ) h = n.lastIndex, n === F ? m[1] === "!--" ? n = Fe : m[1] !== void 0 ? n = Ge : m[2] !== void 0 ? (dt.test(m[2]) && (a = RegExp("</" + m[2], "g")), n = T) : m[3] !== void 0 && (n = T) : n === T ? m[0] === ">" ? (n = a ?? F, p = -1) : m[1] === void 0 ? p = -2 : (p = n.lastIndex - m[2].length, d = m[1], n = m[3] === void 0 ? T : m[3] === '"' ? Ye : He) : n === Ye || n === He ? n = T : n === Fe || n === Ge ? n = F : (n = T, a = void 0);
    const b = n === T && r[l + 1].startsWith("/>") ? " " : "";
    o += n === F ? s + ti : p >= 0 ? (i.push(d), s.slice(0, p) + lt + s.slice(p) + E + b) : s + E + (p === -2 ? l : b);
  }
  return [mt(r, o + (r[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), i];
};
class J {
  constructor({ strings: e, _$litType$: t }, i) {
    let a;
    this.parts = [];
    let o = 0, n = 0;
    const l = e.length - 1, s = this.parts, [d, m] = ai(e, t);
    if (this.el = J.createElement(d, i), D.currentNode = this.el.content, t === 2 || t === 3) {
      const p = this.el.content.firstChild;
      p.replaceWith(...p.childNodes);
    }
    for (; (a = D.nextNode()) !== null && s.length < l; ) {
      if (a.nodeType === 1) {
        if (a.hasAttributes()) for (const p of a.getAttributeNames()) if (p.endsWith(lt)) {
          const h = m[n++], b = a.getAttribute(p).split(E), f = /([.?@])?(.*)/.exec(h);
          s.push({ type: 1, index: o, name: f[2], strings: b, ctor: f[1] === "." ? ri : f[1] === "?" ? ni : f[1] === "@" ? si : ue }), a.removeAttribute(p);
        } else p.startsWith(E) && (s.push({ type: 6, index: o }), a.removeAttribute(p));
        if (dt.test(a.tagName)) {
          const p = a.textContent.split(E), h = p.length - 1;
          if (h > 0) {
            a.textContent = se ? se.emptyScript : "";
            for (let b = 0; b < h; b++) a.append(p[b], X()), D.nextNode(), s.push({ type: 2, index: ++o });
            a.append(p[h], X());
          }
        }
      } else if (a.nodeType === 8) if (a.data === ct) s.push({ type: 2, index: o });
      else {
        let p = -1;
        for (; (p = a.data.indexOf(E, p + 1)) !== -1; ) s.push({ type: 7, index: o }), p += E.length - 1;
      }
      o++;
    }
  }
  static createElement(e, t) {
    const i = P.createElement("template");
    return i.innerHTML = e, i;
  }
}
function R(r, e, t = r, i) {
  if (e === j) return e;
  let a = i !== void 0 ? t._$Co?.[i] : t._$Cl;
  const o = Q(e) ? void 0 : e._$litDirective$;
  return a?.constructor !== o && (a?._$AO?.(!1), o === void 0 ? a = void 0 : (a = new o(r), a._$AT(r, t, i)), i !== void 0 ? (t._$Co ??= [])[i] = a : t._$Cl = a), a !== void 0 && (e = R(r, a._$AS(r, e.values), a, i)), e;
}
class oi {
  constructor(e, t) {
    this._$AV = [], this._$AN = void 0, this._$AD = e, this._$AM = t;
  }
  get parentNode() {
    return this._$AM.parentNode;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  u(e) {
    const { el: { content: t }, parts: i } = this._$AD, a = (e?.creationScope ?? P).importNode(t, !0);
    D.currentNode = a;
    let o = D.nextNode(), n = 0, l = 0, s = i[0];
    for (; s !== void 0; ) {
      if (n === s.index) {
        let d;
        s.type === 2 ? d = new K(o, o.nextSibling, this, e) : s.type === 1 ? d = new s.ctor(o, s.name, s.strings, this, e) : s.type === 6 && (d = new li(o, this, e)), this._$AV.push(d), s = i[++l];
      }
      n !== s?.index && (o = D.nextNode(), n++);
    }
    return D.currentNode = P, a;
  }
  p(e) {
    let t = 0;
    for (const i of this._$AV) i !== void 0 && (i.strings !== void 0 ? (i._$AI(e, i, t), t += i.strings.length - 2) : i._$AI(e[t])), t++;
  }
}
class K {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, i, a) {
    this.type = 2, this._$AH = u, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = i, this.options = a, this._$Cv = a?.isConnected ?? !0;
  }
  get parentNode() {
    let e = this._$AA.parentNode;
    const t = this._$AM;
    return t !== void 0 && e?.nodeType === 11 && (e = t.parentNode), e;
  }
  get startNode() {
    return this._$AA;
  }
  get endNode() {
    return this._$AB;
  }
  _$AI(e, t = this) {
    e = R(this, e, t), Q(e) ? e === u || e == null || e === "" ? (this._$AH !== u && this._$AR(), this._$AH = u) : e !== this._$AH && e !== j && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : ii(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== u && Q(this._$AH) ? this._$AA.nextSibling.data = e : this.T(P.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: i } = e, a = typeof i == "number" ? this._$AC(e) : (i.el === void 0 && (i.el = J.createElement(mt(i.h, i.h[0]), this.options)), i);
    if (this._$AH?._$AD === a) this._$AH.p(t);
    else {
      const o = new oi(a, this), n = o.u(this.options);
      o.p(t), this.T(n), this._$AH = o;
    }
  }
  _$AC(e) {
    let t = Ze.get(e.strings);
    return t === void 0 && Ze.set(e.strings, t = new J(e)), t;
  }
  k(e) {
    Ee(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let i, a = 0;
    for (const o of e) a === t.length ? t.push(i = new K(this.O(X()), this.O(X()), this, this.options)) : i = t[a], i._$AI(o), a++;
    a < t.length && (this._$AR(i && i._$AB.nextSibling, a), t.length = a);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const i = Ve(e).nextSibling;
      Ve(e).remove(), e = i;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class ue {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, i, a, o) {
    this.type = 1, this._$AH = u, this._$AN = void 0, this.element = e, this.name = t, this._$AM = a, this.options = o, i.length > 2 || i[0] !== "" || i[1] !== "" ? (this._$AH = Array(i.length - 1).fill(new String()), this.strings = i) : this._$AH = u;
  }
  _$AI(e, t = this, i, a) {
    const o = this.strings;
    let n = !1;
    if (o === void 0) e = R(this, e, t, 0), n = !Q(e) || e !== this._$AH && e !== j, n && (this._$AH = e);
    else {
      const l = e;
      let s, d;
      for (e = o[0], s = 0; s < o.length - 1; s++) d = R(this, l[i + s], t, s), d === j && (d = this._$AH[s]), n ||= !Q(d) || d !== this._$AH[s], d === u ? e = u : e !== u && (e += (d ?? "") + o[s + 1]), this._$AH[s] = d;
    }
    n && !a && this.j(e);
  }
  j(e) {
    e === u ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class ri extends ue {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === u ? void 0 : e;
  }
}
class ni extends ue {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== u);
  }
}
class si extends ue {
  constructor(e, t, i, a, o) {
    super(e, t, i, a, o), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = R(this, e, t, 0) ?? u) === j) return;
    const i = this._$AH, a = e === u && i !== u || e.capture !== i.capture || e.once !== i.once || e.passive !== i.passive, o = e !== u && (i === u || a);
    a && this.element.removeEventListener(this.name, this, i), o && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class li {
  constructor(e, t, i) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = i;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    R(this, e);
  }
}
const ci = Me.litHtmlPolyfillSupport;
ci?.(J, K), (Me.litHtmlVersions ??= []).push("3.3.3");
const di = (r, e, t) => {
  const i = t?.renderBefore ?? e;
  let a = i._$litPart$;
  if (a === void 0) {
    const o = t?.renderBefore ?? null;
    i._$litPart$ = a = new K(e.insertBefore(X(), o), o, void 0, t ?? {});
  }
  return a._$AI(r), a;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Te = globalThis;
class A extends L {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = di(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return j;
  }
}
A._$litElement$ = !0, A.finalized = !0, Te.litElementHydrateSupport?.({ LitElement: A });
const pi = Te.litElementPolyfillSupport;
pi?.({ LitElement: A });
(Te.litElementVersions ??= []).push("4.2.2");
const ut = x`
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
`, mi = "media_player.spotifyplus_bruno_helasio", G = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], oe = ["playing", "paused", "on"], Ie = [
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
        states: G
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Echo Show ativo",
        tone: "amber",
        entities: ["media_player.echo_show"],
        states: oe,
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
      cameras: ["camera.sl_camera_2", "camera.vr_camera_2"],
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
        states: G
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Echo Pop ativo",
        tone: "amber",
        entities: ["media_player.echo_pop_office"],
        states: oe,
        spotifyDevice: "Echo Pop Office"
      }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_office",
      lights: ["light.office_switch_1", "light.office_switch_2", "light.office_switch_3"],
      climate: "climate.ac_office",
      mediaPlayers: ["media_player.echo_pop_office"],
      cameras: ["camera.of_camera_2"],
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
      cameras: ["camera.cz_camera_2", "camera.as_camera_2"],
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
        states: G
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Midia",
        tone: "purple",
        entities: ["media_player.echo_pop_quarto_casal"],
        states: oe,
        spotifyDevice: "Echo Pop Quarto Casal"
      }
    ],
    entities: {
      lightGroup: "light.grupo_quarto_casal",
      lights: ["light.qc_luz_principal"],
      mediaPlayers: ["media_player.echo_pop_quarto_casal"],
      cameras: ["camera.camera_quarto_casal_2"],
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
        states: G
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Midia",
        tone: "purple",
        entities: ["media_player.echo_pop_marina"],
        states: oe,
        spotifyDevice: "Echo Pop Marina"
      }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_quarto_marina",
      lights: ["light.quarto_marina_switch_4"],
      climate: "climate.ac_quarto_marina",
      mediaPlayers: ["media_player.echo_pop_marina"],
      cameras: ["camera.qma_camera_2"],
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
        states: G
      },
      { icon: "mdi:speaker-wireless", label: "Midia", tone: "purple" }
    ],
    entities: {
      lightGroup: "light.grupo_luzes_quarto_miguel",
      lights: ["light.quarto_miguel_switch_2"],
      climate: "climate.ac_quarto_miguel",
      cameras: ["camera.qmi_camera_2"],
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
function ui() {
  const r = [];
  for (const e of Ie)
    for (const [t, i] of Object.entries(e.entities))
      if (typeof i == "string")
        r.push({ entityId: i, roomId: e.id, field: t });
      else if (Array.isArray(i))
        for (const a of i) r.push({ entityId: a, roomId: e.id, field: t });
  return r;
}
const hi = [
  {
    entity: "script.bruno_scene_apagar_todas_as_luzes",
    name: "Apagar todas as luzes",
    substitui: "homeassistant.turn_off sobre light.todas_as_luzes",
    comoCriar: "CRIADA em 2026-08-06 (Fase 5e.3), com autorizacao do usuario, em config/packages/bruno_scenes.yaml — mesmo padrao dos demais: script bruno_scene_*, nao entidade scene. O painel de Cenas lista scripts."
  }
];
function gi(r) {
  const e = [], t = [];
  for (const i of hi)
    r?.states?.[i.entity] ? e.push(i) : t.push(i);
  return { disponiveis: e, ausentes: t };
}
function bi(r) {
  const e = ui();
  if (!r) return { total: e.length, ok: 0, issues: [] };
  const t = [];
  let i = 0;
  for (const { entityId: a, roomId: o, field: n } of e) {
    const l = r.states[a];
    l ? l.state === "unavailable" ? t.push({ entityId: a, roomId: o, field: n, problem: "unavailable" }) : i++ : t.push({ entityId: a, roomId: o, field: n, problem: "missing" });
  }
  return { total: e.length, ok: i, issues: t };
}
function fi(r) {
  return gi(r).ausentes.map((e) => ({
    tipo: "scene",
    entityId: e.entity,
    nome: e.name,
    comoResolver: e.comoCriar
  }));
}
function vi() {
  const r = window.devicePixelRatio || 1;
  return {
    buildId: "20260809",
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
const xi = 2;
function _i(r, e) {
  if (["unavailable", "unknown"].includes(e)) return "indisponivel";
  const t = String(r.frontend_stream_type ?? "");
  return t === "web_rtc" ? "web_rtc" : t === "hls" ? "hls" : "instantaneo";
}
async function wi(r) {
  const e = ht(r), t = r?.callWS;
  if (!t || !e.cameras.length) return e;
  const i = await Promise.all(
    e.cameras.map(async (o) => {
      if (o.caminho === "indisponivel") return o;
      try {
        const l = (await t({
          type: "camera/capabilities",
          entity_id: o.entityId
        }))?.frontend_stream_types ?? [];
        return l.includes("web_rtc") ? { ...o, caminho: "web_rtc" } : l.includes("hls") ? { ...o, caminho: "hls" } : o;
      } catch {
        return o;
      }
    })
  ), a = {
    web_rtc: 0,
    hls: 0,
    instantaneo: 0,
    indisponivel: 0
  };
  for (const o of i) a[o.caminho]++;
  return {
    streamCarregado: e.streamCarregado,
    cameras: i,
    resumo: a,
    veredito: gt(a, i.length, e.streamCarregado)
  };
}
function ht(r) {
  const e = {
    streamCarregado: !1,
    cameras: [],
    resumo: { web_rtc: 0, hls: 0, instantaneo: 0, indisponivel: 0 },
    veredito: "Sem hass — nada a sondar."
  };
  if (!r) return e;
  const t = [];
  for (const [o, n] of Object.entries(r.states)) {
    if (!o.startsWith("camera.") || !n) continue;
    const l = n.attributes ?? {}, s = Number(l.supported_features ?? 0);
    t.push({
      entityId: o,
      nome: String(l.friendly_name ?? o),
      estado: String(n.state),
      caminho: _i(l, String(n.state)),
      suportaStream: (s & xi) !== 0
    });
  }
  t.sort((o, n) => o.entityId.localeCompare(n.entityId));
  const i = {
    web_rtc: 0,
    hls: 0,
    instantaneo: 0,
    indisponivel: 0
  };
  for (const o of t) i[o.caminho]++;
  const a = t.some((o) => o.suportaStream);
  return {
    streamCarregado: a,
    cameras: t,
    resumo: i,
    veredito: gt(i, t.length, a)
  };
}
function gt(r, e, t) {
  return e === 0 ? "Nenhuma câmera encontrada." : r.web_rtc > 0 ? `${r.web_rtc} de ${e} com WebRTC — vale medir stream nessas.` : r.hls > 0 ? `${r.hls} de ${e} só com HLS. A transcodificação roda na VM: stream só se a medição provar que compensa, e uma câmera por vez.` : t ? "Câmeras com stream declarado, mas sem tipo publicado — sondar de novo com o painel aberto." : "Nenhuma câmera declara suporte a stream — o instantâneo é o único caminho.";
}
class yi extends A {
  constructor() {
    super(...arguments), this._env = vi(), this._sondando = !1, this._mensagem = "";
  }
  static {
    this.properties = {
      _hass: { state: !0 }
    };
  }
  /** O HA injeta `hass` por setter em todo custom card. */
  set hass(e) {
    this._hass = e;
  }
  setConfig(e) {
  }
  getCardSize() {
    return 4;
  }
  static {
    this.styles = [
      ut,
      x`
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
  _row(e, t, i = "") {
    return c`<div class="row">
      <dt>${e}</dt>
      <dd class=${i}>${t}</dd>
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
    const e = ne(), t = (s) => (s / 1048576).toFixed(1) + " MB", i = (s) => s.toFixed(1) + " ms", a = e.vazamentos, o = a.timers + a.listeners + a.assinaturas, n = e.desdeAMarca, l = n ? n.instancias + n.timers + n.listeners + n.assinaturas : 0;
    return c`
      <div>
        <h2>Runtime</h2>
        <dl>
          ${this._row("Build medido", e.build)}
          ${this._row("Desde o carregamento", (e.desdeOCarregamento / 1e3).toFixed(0) + " s")}
          ${this._row("Timers vivos", String(e.timersVivos))}
          ${this._row(
      "Memória usada",
      e.memoria.ultima ? t(e.memoria.ultima.usado) : "sem leitura",
      e.memoria.ultima ? "" : "warn"
    )}
          ${this._row(
      "Piso da memória",
      e.memoria.amostras ? `${t(e.memoria.piso)} · pico ${t(e.memoria.pico)} · ${e.memoria.degraus} degrau(s)` : "—",
      e.memoria.degraus < 2 ? "warn" : ""
    )}
          ${this._row(
      "Crescimento do piso",
      e.memoria.amostras > 1 ? t(e.memoria.crescimentoDoPiso) : "—",
      e.memoria.crescimentoDoPiso > 10 * 1048576 ? "warn" : "ok"
    )}
          ${this._row(
      "Tarefas longas",
      `${e.tarefasLongas.naCarga} na carga · ${e.tarefasLongas.depoisDaCarga} depois (${e.tarefasLongas.porMinuto}/min) · pior ${e.tarefasLongas.pior} ms`,
      e.tarefasLongas.depoisDaCarga === 0 ? "ok" : "warn"
    )}
          ${this._row(
      "Vazando (timer/listener/assinatura)",
      String(o),
      o === 0 ? "ok" : "warn"
    )}
          ${this._row("Componentes montados", String(e.vivos))}
          ${n ? this._row(
      "Sobrou desde a marca",
      `${n.instancias} inst · ${n.timers} timers · ${n.listeners} listeners · ${n.assinaturas} assin.`,
      l === 0 ? "ok" : "warn"
    ) : u}
        </dl>

        <p class="empty">${e.memoria.veredito}</p>

        ${e.componentes.length ? c`<ul>
              ${e.componentes.map(
      (s) => c`<li>
                  <strong>${s.nome}</strong> — ${s.render.total} renders
                  (média ${s.render.total ? i(s.render.duracaoTotal / s.render.total) : "0.0 ms"},
                  pior ${i(s.render.pior)}) ·
                  vivos: ${s.vivos} ·
                  timers ${s.timers.criados - s.timers.encerrados} ·
                  listeners ${s.listeners.criados - s.listeners.encerrados}
                  ${s.requisicoes.total ? c` · ${s.requisicoes.total} req (${s.requisicoes.falhas} falhas, pior ${i(s.requisicoes.pior)})` : u}
                  ${s.motivos.length ? c`<br /><span class="motivos"
                        >acordado por:
                        ${s.motivos.map((d) => `${d.motivo} (${d.total})`).join(" · ")}</span
                      >` : u}
                </li>`
    )}
            </ul>` : c`<p class="empty">Nenhum componente instrumentado ainda.</p>`}

        <div class="acoes">
          <button type="button" @click=${() => this._copiarBaseline()}>Copiar baseline</button>
          <button type="button" @click=${() => this._marcar()}>Marcar ciclo</button>
          <button type="button" @click=${() => this.requestUpdate()}>Atualizar</button>
        </div>
        ${this._mensagem ? c`<p class="empty">${this._mensagem}</p>` : u}
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
    const e = rt();
    this._mensagem = `Marca posta: ${e.instancias} instâncias, ${e.timers} timers, ${e.listeners} listeners. Navegue e volte aqui.`, this.requestUpdate();
  }
  _cameras() {
    !this._sondaProfunda && !this._sondando && this._hass && (this._sondando = !0, wi(this._hass).then((t) => {
      this._sondaProfunda = t, this._sondando = !1, this.requestUpdate();
    }));
    const e = this._sondaProfunda ?? ht(this._hass);
    return e.cameras.length ? c`
      <div>
        <h2>Câmeras — capacidade</h2>
        <dl>
          ${this._row("Total", String(e.cameras.length))}
          ${this._row("WebRTC", String(e.resumo.web_rtc), e.resumo.web_rtc ? "ok" : "")}
          ${this._row("HLS (transcodifica na VM)", String(e.resumo.hls), e.resumo.hls ? "warn" : "")}
          ${this._row("Só instantâneo", String(e.resumo.instantaneo))}
          ${this._row("Fora do ar", String(e.resumo.indisponivel), e.resumo.indisponivel ? "bad" : "ok")}
        </dl>
        <p class="empty">${e.veredito}</p>
        <ul>
          ${e.cameras.map((t) => c`<li>${t.entityId} → ${t.caminho}${t.suportaStream ? " · stream" : ""}</li>`)}
        </ul>
      </div>
    ` : u;
  }
  /**
   * Copia a baseline para a área de transferência.
   *
   * `navigator.clipboard` exige contexto seguro; a WebView do tablet acessa o HA
   * por HTTP na rede local, onde ele nem sempre existe. Por isso o caminho
   * alternativo com `textarea` + `execCommand`, que continua funcionando ali.
   */
  async _copiarBaseline() {
    const e = JSON.stringify(ne(), null, 2);
    try {
      await navigator.clipboard.writeText(e), this._mensagem = "Baseline copiada.";
    } catch {
      const t = document.createElement("textarea");
      t.value = e, t.style.position = "fixed", t.style.opacity = "0", this.shadowRoot?.appendChild(t), t.select();
      const i = document.execCommand("copy");
      t.remove(), this._mensagem = i ? "Baseline copiada." : "Não foi possível copiar — use brunoRuntime.texto().";
    }
    this.requestUpdate();
  }
  render() {
    const e = this._env, t = bi(this._hass), i = t.issues.filter((n) => n.problem === "missing"), a = t.issues.filter((n) => n.problem === "unavailable"), o = fi(this._hass);
    return c`
      <div class="card">
        <div>
          <h2>Diagnóstico</h2>
          <div class="build">build ${e.buildId}</div>
        </div>

        <dl>
          ${this._row("Viewport CSS", e.viewportCss)}
          ${this._row("Tela física", e.screenPhysical)}
          ${this._row("Densidade de pixels", `${e.devicePixelRatio}×`)}
          ${this._row(
      "Container queries",
      e.containerQueries ? "suportado" : "AUSENTE",
      e.containerQueries ? "ok" : "bad"
    )}
          ${this._row("Movimento reduzido", e.reducedMotion ? "ativo" : "não")}
          ${this._row(
      "Entidades configuradas",
      `${t.ok} / ${t.total}`,
      t.issues.length === 0 ? "ok" : "warn"
    )}
          ${this._row(
      "Não existem no HA",
      String(i.length),
      i.length === 0 ? "ok" : "bad"
    )}
          ${this._row(
      "Indisponíveis agora",
      String(a.length),
      a.length === 0 ? "ok" : "warn"
    )}
          ${this._row(
      "Dependências do HA ausentes",
      String(o.length),
      o.length === 0 ? "ok" : "warn"
    )}
        </dl>

        ${o.length > 0 ? c`
              <div>
                <h2>Dependências que o dashboard não cria</h2>
                <p>
                  Criar estes itens é configuração do Home Assistant. O dashboard
                  registra a falta e não atua fora do frontend.
                </p>
                <ul>
                  ${o.map(
      (n) => c`<li class="warn">
                      ${n.tipo} · ${n.nome} → ${n.entityId}<br /><small>${n.comoResolver}</small>
                    </li>`
    )}
                </ul>
              </div>
            ` : u}

        ${i.length > 0 ? c`
              <div>
                <h2>Entidades inexistentes</h2>
                <ul>
                  ${i.map(
      (n) => c`<li class="bad">${n.roomId} · ${n.field} → ${n.entityId}</li>`
    )}
                </ul>
              </div>
            ` : u}
        ${a.length > 0 ? c`
              <div>
                <h2>Indisponíveis</h2>
                <ul>
                  ${a.map(
      (n) => c`<li class="warn">${n.roomId} · ${n.field} → ${n.entityId}</li>`
    )}
                </ul>
              </div>
            ` : u}
        ${this._runtime()}
        ${this._cameras()}
        ${this._hass ? u : c`<p class="empty">Aguardando o objeto hass…</p>`}
      </div>
    `;
  }
}
customElements.get("bruno-diagnostics") || customElements.define("bruno-diagnostics", yi);
const le = window;
le.customCards = le.customCards ?? [];
le.customCards.some((r) => r.type === "bruno-diagnostics") || le.customCards.push({
  type: "bruno-diagnostics",
  name: "Bruno · Diagnóstico",
  description: "Build, viewport, capacidades e validação das entidades configuradas."
});
function ki(r) {
  const e = r / 6e4, t = r / 36e5, i = r / 864e5;
  return e < 1 ? "<1m" : e < 60 ? `${Math.trunc(e)}m` : t < 24 ? `${Math.trunc(t)}h` : `${Math.trunc(i)}d`;
}
function $i(r) {
  const { hass: e, groupEntityId: t, activeSensorId: i, fallbackLightIds: a = [] } = r, o = r.now ?? Date.now(), n = t ? e.states[t] : void 0, l = i ? e.states[i] : void 0;
  let s = null;
  const d = l?.attributes.lights_on_count;
  if (d != null && d !== "" && !Number.isNaN(Number(d)))
    s = Math.trunc(Number(d));
  else {
    const b = l?.attributes.lights_on;
    if (Array.isArray(b))
      s = b.length;
    else if (typeof b == "string" && b.startsWith("[")) {
      const f = b.match(/'/g);
      f && (s = f.length / 2);
    }
  }
  const m = zi(n);
  s === null && m.length > 0 && (s = m.filter((b) => e.states[b]?.state === "on").length), s === null && a.length > 0 && (s = a.filter((b) => e.states[b]?.state === "on").length), s === null && (s = n?.state === "on" ? 1 : 0);
  let p = String(l?.attributes.lights_elapsed ?? "");
  if (!p) {
    const b = m.length > 0 ? m : a;
    let f = null;
    for (const v of b) {
      const q = e.states[v];
      if (q?.state !== "on" || !q.last_changed) continue;
      const g = Date.parse(q.last_changed);
      !Number.isNaN(g) && (f === null || g < f) && (f = g);
    }
    if (f === null && n?.state === "on" && n.last_changed) {
      const v = Date.parse(n.last_changed);
      Number.isNaN(v) || (f = v);
    }
    p = f === null ? "" : ki(o - f);
  }
  const h = s === 1 ? "1 light" : `${s} lights`;
  return {
    count: s,
    elapsed: p,
    label: s > 0 ? `${h}${p ? ` / ${p}` : ""}` : ""
  };
}
function zi(r) {
  const e = r?.attributes.entity_id;
  return Array.isArray(e) ? e.filter((t) => typeof t == "string") : [];
}
function qi(r) {
  const { hass: e, semanticSensorId: t, motionRecentId: i, occupancyId: a } = r, o = t ? e.states[t] : void 0, n = String(o?.state ?? "").toLowerCase(), l = o?.attributes.display;
  if (l && !["none", "unknown", "unavailable", ""].includes(n))
    return String(l).trim();
  const s = i ? e.states[i] : void 0;
  return s && s.state !== "on" ? "" : (a ? e.states[a] : void 0)?.state === "on" ? "Ocupado" : "";
}
function We(r, e, t = ["on", "home", "active", "yes"]) {
  if (!e) return !1;
  const i = r.states[e];
  return i ? t.includes(String(i.state).toLowerCase()) : !1;
}
function Xe(r, e, t = "") {
  const i = typeof e == "string" ? [e] : e ?? [];
  for (const a of i) {
    const o = r.states[a], n = String(o?.state ?? "").toLowerCase();
    if (!(!o || ["unknown", "unavailable", "none", ""].includes(n)))
      return `${o.state}${t}`;
  }
  return "--";
}
function I(r) {
  return String(r ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const Si = [
  "source",
  "source_name",
  "device_name",
  "active_device_name",
  "spotify_device_name",
  "media_player",
  "media_player_name"
];
function Ai(r, e) {
  const t = I(e);
  if (!t) return !0;
  const i = r ?? {};
  return Si.some((a) => {
    const o = I(i[a]);
    return !!(o && (o === t || o.includes(t) || o.length >= 10 && t.includes(o)));
  });
}
const bt = ["playing", "paused"];
function ft(r, e, t) {
  return !r || !bt.includes(String(r.state).toLowerCase()) ? !1 : Ai(r.attributes, e) ? !0 : Ci(r.attributes, t);
}
function Ci(r, e) {
  if (!e || !bt.includes(String(e.state).toLowerCase())) return !1;
  const t = e.attributes ?? {};
  if (I(
    [t.app_name, t.source, t.media_content_type, t.media_channel].join(" ")
  ).includes("spotify")) return !0;
  const a = r ?? {}, o = I(t.media_title), n = I(a.media_title);
  if (o && n && o === n) return !0;
  const l = I(t.media_artist), s = I(a.media_artist);
  return !!(o && n && o.includes(n) && l && s && l === s);
}
const Mi = "∅", Ei = (r) => r ? `${r.state}@${r.last_changed}` : Mi;
class De {
  constructor(e = [], t = {}) {
    this.ids = [], this.ultimo = /* @__PURE__ */ new Map(), this.virgem = !0, this.projecoes = t.projecoes ?? {}, this.observar(e);
  }
  /**
   * Troca a lista observada.
   *
   * Necessário porque a lista de um cômodo só existe depois do `setConfig`, que
   * chega DEPOIS do primeiro `hass`. Trocar a lista volta o observador ao estado
   * virgem — senão o componente ficaria preso à leitura feita com a lista velha.
   */
  observar(e) {
    const t = [], i = /* @__PURE__ */ new Set();
    for (const a of e)
      typeof a != "string" || !a || i.has(a) || (i.add(a), t.push(a));
    this.ids = t, this.ultimo.clear(), this.virgem = !0;
  }
  get observadas() {
    return this.ids;
  }
  projetar(e, t) {
    return (this.projecoes[t] ?? Ei)(e.states[t]);
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
  mudancas(e) {
    if (!e) return [];
    if (this.virgem) {
      this.virgem = !1;
      for (const i of this.ids) this.ultimo.set(i, this.projetar(e, i));
      return this.ids;
    }
    let t;
    for (const i of this.ids) {
      const a = this.projetar(e, i);
      a !== this.ultimo.get(i) && (this.ultimo.set(i, a), (t ??= []).push(i));
    }
    return t ?? [];
  }
  /** Mudou alguma coisa? Atalho para quem não precisa saber qual. */
  mudou(e) {
    return this.mudancas(e).length > 0;
  }
  /** Esquece o que leu, sem trocar a lista. A próxima pergunta pinta tudo. */
  esquecer() {
    this.ultimo.clear(), this.virgem = !0;
  }
}
function Oe(r, e = 2) {
  return r.length === 0 ? "" : r.length <= e ? r.join(" ") : `${r.slice(0, e).join(" ")} +${r.length - e}`;
}
const Ti = /^[a-z_]+\.[a-z0-9_]+$/, Ii = 8;
function Qe(r, e = 0) {
  const t = [], i = /* @__PURE__ */ new Set(), a = (o, n) => {
    if (!(n > Ii || o == null)) {
      if (typeof o == "string") {
        Ti.test(o) && !i.has(o) && (i.add(o), t.push(o));
        return;
      }
      if (Array.isArray(o)) {
        for (const l of o) a(l, n + 1);
        return;
      }
      if (typeof o == "object")
        for (const l of Object.values(o)) a(l, n + 1);
    }
  };
  return a(r, e), t;
}
const xe = "bruno-room-tile", Di = 1200, Oi = 560, Je = 10;
function Ke() {
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
function _e(r) {
  globalThis.BrunoLiquidGlass?.feedback?.(r);
}
function et(r) {
  return r === !0 ? !0 : typeof r == "number" ? r > 0 : ["true", "on", "yes", "1"].includes(String(r ?? "").toLowerCase());
}
class Pi extends A {
  constructor() {
    super(...arguments), this._lastAction = 0, this._observador = new De(), this._motivo = "", this._gestures = {
      room: Ke(),
      nav: Ke()
    }, this._timers = /* @__PURE__ */ new Set(), this._onThemeChanged = () => {
      this._tileModeCache = void 0, this.requestUpdate();
    }, this._fecharPainel = () => {
      this.shadowRoot?.querySelector("dialog.room-popup")?.close();
    };
  }
  static {
    this.properties = {};
  }
  setConfig(e) {
    if (!e?.room) throw new Error("bruno-room-tile: informe `room`");
    const t = Ie.find((i) => i.id === e.room);
    if (!t) throw new Error(`bruno-room-tile: cômodo desconhecido "${e.room}"`);
    this._config = e, this._room = t, this._observador.observar(this._watched());
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
  update(e) {
    const t = this._motivo;
    this._motivo = "", Se(
      xe,
      () => super.update(e),
      t || (this.hasUpdated ? "interação" : "montagem")
    );
  }
  /**
   * O objeto hass muda a cada alteração de estado de QUALQUER entidade da casa.
   * Só re-renderiza quando muda algo que este tile realmente lê — é o contrato
   * que substitui o re-render total dos cards atuais (A2 em docs/09).
   */
  set hass(e) {
    this._hass = e;
    const t = this._observador.mudancas(e);
    t.length !== 0 && (this._motivo = Oe(t), this.requestUpdate());
  }
  _watched() {
    const e = this._room, t = e?.entities;
    if (!t) return [];
    const i = (e?.statusDots ?? []).flatMap((o) => o.entities ?? []);
    return [
      ...(e?.popup?.lights ?? []).map((o) => o.entity),
      e?.applianceLine?.entity,
      t.lightGroup,
      ...t.lights ?? [],
      e?.toggleTarget,
      e?.activeSensor,
      t.motionRecent,
      t.occupancy,
      t.semanticState,
      t.temperature,
      t.humidity,
      ...i
    ].filter((o) => typeof o == "string");
  }
  connectedCallback() {
    super.connectedCallback(), ze(xe), this._tileModeCache = void 0, globalThis.addEventListener?.("bruno-theme-changed", this._onThemeChanged);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), qe(xe), globalThis.removeEventListener?.("bruno-theme-changed", this._onThemeChanged);
    for (const e of this._timers) window.clearTimeout(e);
    this._timers.clear();
    for (const e of ["room", "nav"]) this._resetGesture(e);
  }
  get _tileMode() {
    if (this._config?.variant !== "tile") return !1;
    if (this._tileModeCache !== void 0) return this._tileModeCache;
    let e = "";
    try {
      e = getComputedStyle(this).getPropertyValue("--bruno-tile-mode").trim();
    } catch {
      e = "";
    }
    return this._tileModeCache = e === "on", this._tileModeCache;
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
  _classe(e, t, i) {
    const a = this.shadowRoot?.querySelector(e);
    a && a.classList.toggle(t, i);
  }
  _alvoSeletor(e) {
    return e === "room" ? ".room-action" : ".room-nav-zone";
  }
  _later(e, t) {
    const i = window.setTimeout(() => {
      this._timers.delete(i), e();
    }, t);
    return this._timers.add(i), i;
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
  _resetGesture(e) {
    const t = this._gestures[e];
    t.holdTimer !== null && (window.clearTimeout(t.holdTimer), this._timers.delete(t.holdTimer), t.holdTimer = null), t.down = !1, t.moved = !1, t.pointerId = null, this._classe(this._alvoSeletor(e), "is-pressed", !1);
  }
  _onDown(e, t) {
    if (t.button != null && t.button !== 0) return;
    const i = this._gestures[e];
    if (i.pointerId !== null) {
      t.stopPropagation();
      return;
    }
    t.stopPropagation(), i.down = !0, i.moved = !1, i.holdFired = !1, i.pointerId = t.pointerId, i.startX = t.clientX, i.startY = t.clientY, this._classe(this._alvoSeletor(e), "is-pressed", !0), i.holdTimer = this._later(() => {
      i.holdTimer = null, !(!i.down || i.moved) && (i.holdFired = !0, this._classe(this._alvoSeletor(e), "is-hold-fired", !0), this._later(() => this._classe(this._alvoSeletor(e), "is-hold-fired", !1), 260), this._runAction("hold"));
    }, Oi);
  }
  _onMove(e, t) {
    const i = this._gestures[e];
    if (!i.down || t.pointerId !== i.pointerId) return;
    const a = Math.abs(t.clientX - i.startX), o = Math.abs(t.clientY - i.startY);
    a <= Je && o <= Je || (i.moved = !0, i.holdTimer !== null && (window.clearTimeout(i.holdTimer), this._timers.delete(i.holdTimer), i.holdTimer = null), this._classe(this._alvoSeletor(e), "is-pressed", !1));
  }
  _onUp(e, t) {
    const i = this._gestures[e];
    if (t.pointerId !== i.pointerId) {
      t.stopPropagation();
      return;
    }
    t.preventDefault(), t.stopPropagation();
    const a = i.down, o = i.moved, n = i.holdFired;
    if (this._resetGesture(e), !(!a || o || n)) {
      if (e === "room") {
        this._runAction("tap");
        return;
      }
      this._classe(".room-nav-zone", "is-navigating", !0), this._later(() => this._classe(".room-nav-zone", "is-navigating", !1), 420), this._later(() => this._openSubview(), 90);
    }
  }
  _onCancel(e, t) {
    t.pointerId === this._gestures[e].pointerId && this._resetGesture(e);
  }
  _onKey(e, t) {
    if (!(t.key !== "Enter" && t.key !== " ")) {
      if (t.preventDefault(), e === "room") {
        this._runAction("tap");
        return;
      }
      t.stopPropagation(), this._classe(".room-nav-zone", "is-navigating", !0), this._later(() => this._classe(".room-nav-zone", "is-navigating", !1), 420), this._later(() => this._openSubview(), 90);
    }
  }
  /** Toque curto alterna a luz principal; pressão longa apaga o cômodo inteiro. */
  _runAction(e) {
    const t = this._room, i = this._hass;
    if (!t || !i) return;
    if (_e(e), e === "hold") {
      const n = t.entities.lightGroup;
      if (!n) return;
      i.callService("light", "turn_off", { entity_id: n }, { entity_id: n });
      return;
    }
    const a = Date.now();
    if (a - this._lastAction < Di) return;
    this._lastAction = a;
    const o = t.toggleTarget ?? t.entities.lightGroup ?? t.entities.lights?.[0];
    o && i.callService("light", "toggle", { entity_id: o }, { entity_id: o });
  }
  /**
   * Destino do chevron: a subview do cômodo ou, onde não há, o painel próprio.
   *
   * A shell escuta `ll-custom` e troca a seção; não há mudança de URL.
   */
  _openSubview() {
    const e = this._room;
    if (e) {
      if (_e("tap"), e.section) {
        this.dispatchEvent(
          new CustomEvent("ll-custom", {
            detail: { action: "fire-dom-event", bruno_section: e.section },
            bubbles: !0,
            composed: !0
          })
        );
        return;
      }
      e.popup && this._abrirPainel();
    }
  }
  _abrirPainel() {
    const e = this.shadowRoot?.querySelector("dialog.room-popup");
    if (e) {
      try {
        e.showModal();
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
    const e = this.shadowRoot?.querySelector(".room-popup-panel");
    if (!e) return;
    const t = this.getBoundingClientRect();
    if (!t.width && !t.height) return;
    const i = 10, a = window.innerWidth || document.documentElement.clientWidth, o = window.innerHeight || document.documentElement.clientHeight, n = e.offsetWidth || 520, l = e.offsetHeight || 240;
    let s = t.right - n;
    s = Math.min(Math.max(s, i), Math.max(i, a - n - i));
    let d = t.bottom + i;
    d + l > o - i && (d = t.top - l - i), d = Math.min(Math.max(d, i), Math.max(i, o - l - i)), e.style.left = `${Math.round(s)}px`, e.style.top = `${Math.round(d)}px`;
  }
  _alternarLuzDoPainel(e) {
    this._hass && (_e("tap"), this._hass.callService("light", "toggle", { entity_id: e }, { entity_id: e }));
  }
  // ── Modelo ───────────────────────────────────────────────────────────────
  _dots() {
    const e = this._hass, t = this._room;
    if (!e || !t) return [];
    const i = t.activeSensor ? e.states[t.activeSensor] : void 0, a = (o) => {
      const n = (o.states ?? []).map((m) => m.toLowerCase()), l = (o.entities ?? []).some((m) => {
        const p = e.states[m];
        return !!p && n.includes(String(p?.state ?? "").toLowerCase());
      }), s = o.activeAttr ? et(i?.attributes[o.activeAttr]) : !1, d = o.spotifyDevice ? ft(e.states[mi], o.spotifyDevice) : !1;
      return l || s || d;
    };
    return (t.statusDots ?? []).filter(a).map((o) => ({ icon: o.icon, label: o.label, tone: o.tone }));
  }
  _statusLines() {
    const e = this._hass, t = this._room;
    if (!e || !t) return [];
    const i = $i({
      hass: e,
      groupEntityId: t.entities.lightGroup,
      activeSensorId: t.activeSensor,
      fallbackLightIds: t.entities.lights
    }), a = t.entities.semanticState ? qi({
      hass: e,
      semanticSensorId: t.entities.semanticState,
      motionRecentId: t.entities.motionRecent,
      occupancyId: t.entities.occupancy
    }) : "", o = [];
    i.label ? o.push(i.label) : We(e, t.entities.lightGroup) && o.push("On");
    const n = this._applianceLine();
    return n && o.push(n), a && o.push(a), o;
  }
  /** Linha do eletrodoméstico, no formato "Lavando / 12m". */
  _applianceLine() {
    const e = this._hass, t = this._room, i = t?.applianceLine;
    if (!e || !t || !i) return "";
    const a = t.activeSensor ? e.states[t.activeSensor] : void 0, o = (i.states ?? []).map((d) => d.toLowerCase()), n = i.entity ? e.states[i.entity] : void 0;
    if (!(!!n && o.includes(String(n?.state ?? "").toLowerCase()) || (i.activeAttr ? et(a?.attributes[i.activeAttr]) : !1))) return "";
    const s = i.elapsedAttr ? String(a?.attributes[i.elapsedAttr] ?? "") : "";
    return s ? `${i.label} / ${s}` : i.label;
  }
  static {
    this.styles = x`
    :host {
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
      inset: auto 16px 8px 16px;
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
      grid-template-columns: minmax(0, 122px) minmax(0, 1fr) 40px;
      grid-template-rows: auto minmax(0, 1fr) auto auto;
      grid-template-areas:
        'icon space right'
        'icon space right'
        'title title right'
        'state state right';
      column-gap: 6px;
      row-gap: 0;
      align-items: start;
      padding: 14px 11px 13px 11px;
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
      max-width: 122px;
      height: 82px;
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
      min-height: 56px;
      /* ANTERIOR: padding: 2px 24px 2px 0
         Os 24px eram respiro, não alvo de toque — a zona já ocupa duas colunas
         inteiras. Numa célula de 152px (a largura real no tablet) sobravam 44px
         para o título, e SEIS dos oito cômodos saíam cortados. 8px devolvem 16px
         ao texto sem encostar na coluna dos pontos, que é a terceira. */
      padding: 2px 8px 2px 0;
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
      gap: 4px;
      min-width: 0;
    }

    .title {
      display: block;
      min-width: 0;
      margin: 0 0 2px 0;
      font-size: 15px;
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
      font-size: 23px;
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
      font-size: 11px;
      line-height: 1.16;
      font-weight: 500;
      color: var(--text-soft);
      white-space: normal;
      overflow: hidden;
    }

    .status-lines span {
      display: block;
      max-width: 136px;
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
      gap: 7px;
      transform: translate(5px, -3px);
    }

    /* Medido no bruno-office-card, que É um card COM temperatura.
       36px de largura com texto centralizado deixa o dot de 26px centrado,
       sobrando 5px de cada lado — e o que alinha a metrica com os dots.

       NAO copiar do bruno-corredor-card: aquele comodo nao tem sensor de
       temperatura, a metrica nunca renderiza, e os valores de la (48px,
       text-align: left, margin-left 6px) sao codigo morto. */
    .metric {
      min-width: 36px;
      text-align: center;
      line-height: 1.1;
    }
    .metric-value {
      display: block;
      font-size: 13px;
      line-height: 1;
      font-weight: 760;
      color: var(--text-main);
    }
    .metric-sub {
      display: block;
      margin-top: 4px;
      font-size: 11px;
      line-height: 1;
      font-weight: 600;
      color: var(--text-muted);
    }

    .status-stack {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
    }

    /* Receita VIGENTE dos cards: círculo com fundo tonal em gradiente, borda
       clara e glifo branco. Existem três recitas anteriores comentadas dentro
       do card real, todas rejeitadas — não copiar de lá. */
    .status-dot {
      width: 26px;
      height: 26px;
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
      width: 14px;
      height: 14px;
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
      inset: auto 14px 0 14px;
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
      left: 8px;
      right: 8px;
      bottom: 0;
      height: 46px;
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
      top: 8px;
      bottom: 8px;
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
        padding: 12px 11px 12px 11px;
      }
      .room-icon {
        width: 100%;
        max-width: 108px;
        height: 72px;
      }
    }

    @media (max-width: 800px) {
      .room-action {
        padding: 11px 12px 10px 10px;
      }
      .room-icon {
        max-width: 100px;
        height: 62px;
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
      width: min(520px, calc(100vw - 52px));
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
      height: 52px;
      padding: 10px 12px 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .room-popup-icon {
      width: 30px;
      height: 30px;
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
      font-size: 14px;
      line-height: 1;
      font-weight: 800;
    }

    .room-popup-title span {
      font-size: 10px;
      line-height: 1;
      font-weight: 650;
      color: rgba(255, 255, 255, 0.52);
    }

    .room-popup-close {
      appearance: none;
      width: 30px;
      height: 30px;
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
      height: 128px;
      margin: 0 12px 12px;
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
      padding: 0 12px 14px;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
    }

    .room-popup-light {
      appearance: none;
      min-width: 0;
      min-height: 74px;
      padding: 10px 9px;
      display: grid;
      grid-template-columns: auto minmax(0, 1fr);
      align-items: center;
      gap: 9px;
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
      width: 30px;
      height: 30px;
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
      gap: 4px;
    }

    .room-popup-light-copy strong,
    .room-popup-light-copy span {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .room-popup-light-copy strong {
      font-size: 12px;
      line-height: 1;
      font-weight: 800;
    }

    .room-popup-light-copy span {
      font-size: 10px;
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
    const e = this._room, t = this._hass;
    if (!e) return u;
    const i = t ? We(t, e.entities.lightGroup ?? e.entities.lights?.[0]) : !1, a = t ? Xe(t, e.entities.temperature, "°") : "--", o = t ? Xe(t, e.entities.humidity, "%") : "--", n = !!(e.entities.temperature ?? e.entities.humidity), l = this._statusLines(), s = this._dots(), d = "20260808-maquetes-premium-1", m = e.assetOff ? `/local/bruno-ui/assets/${e.assetOff}.png?v=${d}` : "", p = e.assetOn ? `/local/bruno-ui/assets/${e.assetOn}.png?v=${d}` : "", h = [
      "room-card",
      i ? "is-room-on" : "",
      this._tileMode ? "is-tile" : "",
      this._tileMode && this._config?.divider_left ? "has-divider" : ""
    ].filter(Boolean).join(" "), b = this._config?.name ?? e.name, f = !!(e.section ?? e.popup), v = e.popup, q = globalThis.BrunoThemeManager?.current?.() === "josh" ? "josh" : "default";
    return c`
      <div class=${h}>
        ${this._tileMode && this._config?.divider_left ? c`<span class="tile-divider" aria-hidden="true"></span>` : u}
        <button
          class="room-action"
          type="button"
          aria-label=${b}
          @pointerdown=${(g) => this._onDown("room", g)}
          @pointermove=${(g) => this._onMove("room", g)}
          @pointerup=${(g) => this._onUp("room", g)}
          @pointercancel=${(g) => this._onCancel("room", g)}
          @pointerleave=${() => this._resetGesture("room")}
          @keydown=${(g) => this._onKey("room", g)}
          @click=${(g) => {
      g.preventDefault(), g.stopPropagation();
    }}
          @dblclick=${(g) => {
      g.preventDefault(), g.stopPropagation();
    }}
        >
          <div class="room-icon" aria-hidden="true">
            <span class="room-asset-wrap">
              ${m ? c`<img class="room-asset room-asset-off" src=${m} alt="" decoding="async" />` : u}
              ${p ? c`<img class="room-asset room-asset-on" src=${p} alt="" decoding="async" />` : u}
            </span>
          </div>

          <span
            class="room-nav-zone"
            role=${f ? "button" : "presentation"}
            tabindex=${f ? 0 : -1}
            aria-label=${f ? `Abrir ${b}` : b}
            @pointerdown=${(g) => f && this._onDown("nav", g)}
            @pointermove=${(g) => f && this._onMove("nav", g)}
            @pointerup=${(g) => f && this._onUp("nav", g)}
            @pointercancel=${(g) => f && this._onCancel("nav", g)}
            @pointerleave=${() => f && this._resetGesture("nav")}
            @keydown=${(g) => f && this._onKey("nav", g)}
          >
            <span class="room-title-row">
              <span class="title">${b}</span>
              ${f ? c`<span class="room-chevron" aria-hidden="true">›</span>` : u}
            </span>
            <span class="status-lines">${l.map((g) => c`<span>${g}</span>`)}</span>
          </span>

          <div class="right-rail" aria-label="Status do ambiente">
            ${n ? c`<div class="metric" aria-label="Temperatura e umidade">
                  <span class="metric-value">${a}</span>
                  <span class="metric-sub">${o}</span>
                </div>` : u}
            <div class="status-stack">
              ${s.map(
      (g) => c`<span class="status-dot tone-${g.tone}" title=${g.label} aria-label=${g.label}>
                  <bruno-icon icon=${g.icon}></bruno-icon>
                </span>`
    )}
            </div>
          </div>
        </button>
        ${v ? c`<dialog
              class="room-popup"
              data-bruno-popup-theme=${q}
              aria-label=${v.title}
              @click=${(g) => {
      g.target === g.currentTarget && this._fecharPainel();
    }}
            >
              <section class="room-popup-panel" role="document" @click=${(g) => g.stopPropagation()}>
                <header class="room-popup-header">
                  <span class="room-popup-icon" aria-hidden="true">
                    <bruno-icon icon=${v.icon}></bruno-icon>
                  </span>
                  <div class="room-popup-title">
                    <strong>${v.title}</strong>
                    ${v.subtitle ? c`<span>${v.subtitle}</span>` : u}
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
                ${v.banner || v.bannerOn ? c`<div class="room-popup-banner">
                      <img
                        src=${(i ? v.bannerOn ?? v.banner : v.banner ?? v.bannerOn) ?? ""}
                        alt=""
                        loading="eager"
                        decoding="async"
                      />
                      <div class="room-popup-banner-shade" aria-hidden="true"></div>
                    </div>` : u}
                <div class="room-popup-lights">
                  ${v.lights.map((g) => {
      const S = t?.states[g.entity], B = String(S?.state ?? "").toLowerCase(), V = B === "on", ee = !S || ["unavailable", "unknown", "none", ""].includes(B), _ = [
        "room-popup-light",
        V ? "is-on" : "",
        ee ? "is-unavailable" : ""
      ].filter(Boolean).join(" ");
      return c`<button
                      class=${_}
                      type="button"
                      aria-label=${g.name}
                      @click=${() => this._alternarLuzDoPainel(g.entity)}
                    >
                      <span class="room-popup-light-icon" aria-hidden="true">
                        <bruno-icon icon=${g.icon ?? "mdi:lightbulb-outline"}></bruno-icon>
                      </span>
                      <span class="room-popup-light-copy">
                        <strong>${g.name}</strong>
                        <span>${ee ? "Indisponivel" : V ? "Ligada" : "Desligada"}</span>
                      </span>
                    </button>`;
    })}
                </div>
              </section>
            </dialog>` : u}
      </div>
    `;
  }
}
customElements.get("bruno-room-tile") || customElements.define("bruno-room-tile", Pi);
const ce = window;
ce.customCards = ce.customCards ?? [];
ce.customCards.some((r) => r.type === "bruno-room-tile") || ce.customCards.push({
  type: "bruno-room-tile",
  name: "Bruno · Tile de cômodo",
  description: "Tile parametrizado por cômodo (arquitetura nova)."
});
const Li = {
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
      humidity: ["sensor.sensor_4_in_1_sala_humidity", "sensor.sl_sensor_temp_humid_umidade"],
      roomGroup: "light.grupo_luzes_sala",
      cameraMain: "camera.sl_camera_2",
      cameraSecondary: "camera.vr_camera_2",
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
          entity: "camera.sl_camera_2",
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
          entity: "camera.vr_camera_2",
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
      temperature: ["sensor.sensor_4_in_1_office_temperature"],
      humidity: ["sensor.sensor_4_in_1_office_humidity"],
      roomGroup: "light.grupo_luzes_office",
      cameraMain: "camera.of_camera_2",
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
          // ANTERIOR (rollback): 'camera.of_camera_2' — entidade da xtend_tuya,
          // que passa pela nuvem da Tuya e so entrega instantaneo/HLS.
          //
          // Agora aponta para a entidade ONVIF, criada em 2026-08-09 depois de
          // ativar a "Chave ONVIF" no app SmartLife: a camera fala RTSP na rede
          // local, sem nuvem no caminho. PROFILE_1 e o perfil principal.
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
      cameraMain: "camera.cz_camera_2",
      cameraSecondary: "camera.as_camera_2",
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
          activeStates: ["on", "run"],
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
          entity: "camera.cz_camera_2",
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
          entity: "camera.as_camera_2",
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
      temperature: ["sensor.sensor_4_in_1_q_casal_temperature"],
      humidity: ["sensor.sensor_4_in_1_q_casal_humidity"],
      roomGroup: "light.grupo_quarto_casal",
      cameraMain: "camera.camera_quarto_casal_2",
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
          entity: "camera.camera_quarto_casal_2",
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
      cameraMain: "camera.qma_camera_2",
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
          entity: "camera.qma_camera_2",
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
      cameraMain: "camera.qmi_camera_2",
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
          entity: "camera.qmi_camera_2",
          name: "Quarto Miguel",
          shortName: "Miguel"
        }
      ]
    }
  }
}, N = /* @__PURE__ */ new Set(), O = { timer: void 0, ouvindoVisibilidade: !1 }, Ni = 1e3;
function vt() {
  for (const r of [...N])
    try {
      r();
    } catch {
    }
}
function xt() {
  return typeof document < "u" && document.visibilityState === "hidden";
}
function _t() {
  O.timer !== void 0 || N.size === 0 || xt() || (O.timer = globalThis.setInterval(vt, Ni));
}
function wt() {
  O.timer !== void 0 && (globalThis.clearInterval(O.timer), O.timer = void 0);
}
function ji() {
  if (xt()) {
    wt();
    return;
  }
  N.size > 0 && (vt(), _t());
}
function Ri() {
  O.ouvindoVisibilidade || typeof document > "u" || (document.addEventListener("visibilitychange", ji), O.ouvindoVisibilidade = !0);
}
function Bi(r) {
  N.add(r), Ri(), _t();
  let e = !1;
  return () => {
    e || (e = !0, N.delete(r), N.size === 0 && wt());
  };
}
const yt = {
  principal: 6500,
  secundaria: 15e3
}, Vi = {
  principal: 1500,
  secundaria: 3e3
}, Ui = 25e3, Fi = 300, Gi = 6e4, Hi = 12e3, tt = { comImagem: 2, semImagem: 4 };
function Yi(r, e) {
  return r ? `${r}${r.includes("?") ? "&" : "?"}bruno_t=${e}` : "";
}
const Zi = (r, e) => {
  const t = new Image();
  let i = !0;
  const a = (o) => {
    i && (i = !1, e(o));
  };
  return t.onload = () => a(!0), t.onerror = () => a(!1), t.src = r, () => {
    i = !1, t.onload = null, t.onerror = null, t.src = "";
  };
}, Wi = {
  agendar: (r, e) => globalThis.setTimeout(r, e),
  cancelar: (r) => globalThis.clearTimeout(r),
  agora: () => typeof performance < "u" ? performance.now() : Date.now()
};
class kt {
  constructor(e = {}) {
    this.cameras = /* @__PURE__ */ new Map(), this.ligado = !1, this.carregador = e.carregador ?? Zi, this.agenda = e.agenda ?? Wi, this.aoCarregar = e.aoCarregar ?? (() => {
    }), this.aoMedir = e.aoMedir ?? (() => {
    }), this.atrasoInicial = e.atrasoInicial ?? 0;
  }
  /**
   * Declara quais câmeras existem agora e com que prioridade.
   *
   * Chamável a cada render: câmera que continua **mantém o estado** — inclusive
   * o recuo e a contagem do primeiro quadro. Trocar o PIP pelo principal muda a
   * cadência sem reiniciar o ciclo, que é o requisito "troca palco↔PIP sem
   * remontar" do roteiro.
   */
  definirAlvos(e) {
    const t = /* @__PURE__ */ new Set();
    for (const i of e) {
      if (!i.entityId || !i.base) continue;
      t.add(i.entityId);
      const a = this.cameras.get(i.entityId);
      if (a) {
        a.alvo = i;
        continue;
      }
      this.cameras.set(i.entityId, {
        alvo: i,
        emVoo: !1,
        inicio: 0,
        quadros: 0,
        falhas: 0,
        falhasSeguidas: 0,
        ultimaDuracao: 0,
        pior: 0
      }), this.ligado && this.agendarPrimeiro(i.entityId, t.size - 1);
    }
    for (const [i, a] of [...this.cameras])
      t.has(i) || (this.desmontar(a), this.cameras.delete(i));
  }
  /** Liga o ciclo. Idempotente. As câmeras partem escalonadas. */
  iniciar() {
    if (this.ligado) return;
    this.ligado = !0;
    let e = 0;
    for (const t of this.cameras.keys()) this.agendarPrimeiro(t, e++);
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
    for (const e of this.cameras.values()) this.desmontar(e);
  }
  /**
   * Busca um quadro de todas agora, sem esperar a cadência.
   *
   * Usado quando a tela volta a acender: a imagem na tela é de quando ela
   * apagou. Câmera com pedido em voo é pulada — a regra 1 vale sempre.
   */
  atualizarAgora() {
    if (this.ligado)
      for (const e of this.cameras.values())
        e.emVoo || (e.timer !== void 0 && (this.agenda.cancelar(e.timer), e.timer = void 0), this.buscar(e));
  }
  /** Retrato das métricas, por câmera. */
  metricas() {
    return [...this.cameras.values()].map((e) => ({
      entityId: e.alvo.entityId,
      prioridade: e.alvo.prioridade,
      quadros: e.quadros,
      falhas: e.falhas,
      falhasSeguidas: e.falhasSeguidas,
      ...e.primeiroQuadro !== void 0 ? { primeiroQuadro: e.primeiroQuadro } : {},
      ultimaDuracao: e.ultimaDuracao,
      pior: e.pior,
      emVoo: e.emVoo,
      ...e.ultimoDesfecho ? { ultimoDesfecho: e.ultimoDesfecho } : {}
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
  buscarAgora(e) {
    if (!this.ligado) return;
    const t = this.cameras.get(e);
    !t || t.emVoo || (t.timer !== void 0 && (this.agenda.cancelar(t.timer), t.timer = void 0), this.buscar(t));
  }
  /** Quantas requisições estão em voo agora. Zero é o esperado em repouso. */
  emVoo() {
    let e = 0;
    for (const t of this.cameras.values()) t.emVoo && e++;
    return e;
  }
  // ── interno ───────────────────────────────────────────────────────────────
  agendarPrimeiro(e, t) {
    const i = this.cameras.get(e);
    !i || i.timer !== void 0 || i.emVoo || (i.timer = this.agenda.agendar(
      () => this.buscar(i),
      this.atrasoInicial + t * Fi
    ));
  }
  desmontar(e) {
    e.timer !== void 0 && (this.agenda.cancelar(e.timer), e.timer = void 0), e.prazo !== void 0 && (this.agenda.cancelar(e.prazo), e.prazo = void 0), e.abortar?.(), e.abortar = void 0, e.emVoo = !1;
  }
  buscar(e) {
    if (e.timer = void 0, !this.ligado || e.emVoo) return;
    e.emVoo = !0, e.inicio = this.agenda.agora();
    const t = Yi(e.alvo.base, Math.round(e.inicio) || 1);
    e.prazo = this.agenda.agendar(() => this.encerrar(e, "prazo", t), Ui), e.abortar = this.carregador(t, (i) => this.encerrar(e, i ? "ok" : "erro", t));
  }
  encerrar(e, t, i) {
    if (!e.emVoo) return;
    e.emVoo = !1, e.prazo !== void 0 && (this.agenda.cancelar(e.prazo), e.prazo = void 0), e.abortar?.(), e.abortar = void 0;
    const a = this.agenda.agora() - e.inicio;
    e.ultimaDuracao = a, a > e.pior && (e.pior = a), e.ultimoDesfecho = t;
    const o = t === "ok" && e.quadros === 0;
    t === "ok" ? (e.quadros++, e.falhasSeguidas = 0, o && (e.primeiroQuadro = a), this.aoCarregar({ entityId: e.alvo.entityId, url: i, duracao: a, primeiro: o })) : (e.falhas++, e.falhasSeguidas++), this.aoMedir(e.alvo.entityId, a, t, o), this.ligado && this.agendarProximo(e, a);
  }
  agendarProximo(e, t) {
    const i = e.alvo.prioridade;
    let a = Math.max(Vi[i], yt[i] - t);
    const o = e.quadros === 0, n = o ? tt.semImagem : tt.comImagem, l = o ? Hi : Gi;
    if (e.falhasSeguidas >= n) {
      const s = 2 ** Math.min(e.falhasSeguidas - n + 1, 5);
      a = Math.min(l, a * s);
    }
    e.timer = this.agenda.agendar(() => this.buscar(e), a);
  }
}
const Xi = ["camera.of_camera_profile_1"];
function we(r) {
  return !!r && Xi.includes(r);
}
const Qi = x`
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
  grid-template-rows: 72px minmax(0, 1fr);
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
  gap: 10px;
  padding: 0 10px;
  background: transparent;
}
.subview-room {
  grid-column: 2;
  text-align: center;
  font-size: 14px;
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
  font-size: 12px;
  line-height: 1;
}
.subview-clock small {
  color: rgba(226,232,240,0.55);
  font-size: 10px;
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
  margin-bottom: 8px;
}
.room-nav-label {
  display: block;
  font-size: 9.5px;
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
  width: 19px;
  height: 19px;
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
  top: -18px;
  bottom: -20px;
  left: -16px;
  right: -86px;
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
  gap: 10px;
}
.back-button, .control-button {
  width: 40px;
  height: 40px;
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
  font-size: 13px;
  line-height: 1.05;
  font-weight: 800;
  color: var(--text-main);
  white-space: nowrap;
}
.hero-subtitle, .module-subtitle {
  margin-top: 4px;
  font-size: 11px;
  line-height: 1;
  font-weight: 600;
  color: var(--text-soft);
}
.chip-button, .online-chip, .state-chip {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  font-size: 11px;
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
  grid-template-columns: minmax(94px, auto) minmax(96px, 1fr) auto;
  align-items: center;
  gap: 18px;
  min-width: 0;
}
.curtain-identity, .title-with-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}
.curtain-icon-shell {
  width: 28px;
  height: 28px;
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
  font-size: 13px;
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
  gap: 5px;
  min-width: 0;
  font-size: 13px;
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
  gap: 7px;
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
  height: 8px;
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
  width: 12px;
  height: 12px;
  margin-top: -4.5px;
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
  width: 12px;
  height: 12px;
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
  margin-top: 7px;
}
.curtain-mark {
  position: relative;
  min-width: 0;
  height: 22px;
  padding: 8px 0 0;
  border: 0;
  background: transparent;
  color: rgba(255,255,255,0.42);
  font-size: 10px;
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
  height: 4px;
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
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(255,255,255,0.09);
  border: 1px solid rgba(255,255,255,0.13);
  color: rgba(210,225,240,0.82);
}
.module-icon bruno-icon, .micro-icon bruno-icon {
  --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
}
.soft-button, .primary-button {
  min-height: 36px;
  padding: 0 14px;
  border-radius: var(--bruno-liquid-control-radius, 14px);
  background: var(--bruno-liquid-control-background, rgba(255,255,255,0.075));
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.12));
  color: rgba(255,255,255,0.88);
  font-size: 12px;
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
  font-size: 13px;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.status-item span:not(.micro-icon) {
  display: block;
  margin-top: 4px;
  font-size: 10px;
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
  padding: 14px;
}
.module-head {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 34px;
  margin-bottom: 8px;
}
.head-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}
.all-label {
  color: rgb(255,154,18);
  font-size: 11px;
  font-weight: 900;
}
.chip-button {
  min-width: 52px;
}
.lights-groups {
  position: relative;
  z-index: 1;
  grid-template-columns: minmax(0, 1fr) 1px minmax(0, 1fr);
  align-items: stretch;
  min-height: 0;
  height: 100%;
  gap: 12px;
}
.light-group {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 6px;
}
.light-group-label {
  color: rgba(255,255,255,0.54);
  font-size: 10px;
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
  gap: 10px;
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
  font-size: 10px;
  line-height: 1;
  font-weight: 900;
  color: rgba(255,231,176,0.68);
  text-shadow: 0 1px 2px rgba(0,0,0,0.34);
}
.rail-state {
  min-width: 36px;
  min-height: 21px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  color: rgba(255,205,95,0.95);
  font-size: 11px;
  font-weight: 900;
  background: rgba(255,183,77,0.10);
  border: 1px solid rgba(255,183,77,0.20);
  box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 0 calc(14px * var(--rail-glow, 0)) rgba(255,183,77,0.18);
}
.rail-state strong {
  font-size: 11px;
  color: rgba(255,235,177,0.98);
}
.rail-track {
  position: relative;
  width: 42px;
  height: 100%;
  min-height: 124px;
  overflow: hidden;
  border-radius: 999px;
  background: linear-gradient(180deg, rgba(255,245,210,0.10), rgba(255,196,83,0.035)), radial-gradient(circle at 50% 8%, rgba(255,255,255,0.16), transparent 30%), rgba(8,15,28,0.72);
  border: 1px solid rgba(255,222,152,0.30);
  box-shadow: inset 0 0 16px rgba(255,228,170,0.10), inset 6px 0 14px rgba(255,255,255,0.035), inset -8px 0 16px rgba(0,0,0,0.28), 0 0 calc(18px * var(--rail-glow, 0)) rgba(255,187,67,0.18), 0 0 calc(42px * var(--rail-glow, 0)) rgba(255,158,35,0.12);
}
.rail-track::before {
  content: "";
  position: absolute;
  inset: 4px;
  border-radius: inherit;
  border: 1px solid rgba(255,255,255,0.08);
  pointer-events: none;
  z-index: 4;
}
.rail-track::after {
  content: "";
  position: absolute;
  top: 11px;
  left: 10px;
  width: 13px;
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
  left: 5px;
  right: 5px;
  bottom: 5px;
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
  left: 6px;
  right: 6px;
  height: 14px;
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
  bottom: 20px;
  width: 86px;
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
  inset: 7px;
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
  font-size: 12px;
  font-weight: 800;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.cameras-card {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
}
.online-chip span, .state-chip span, .live-dot {
  width: 6px;
  height: 6px;
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
  gap: 6px;
  font-size: 11px;
  font-weight: 800;
}
.camera-chevron {
  right: 14px;
  top: 14px;
  --mdc-icon-size: 19px;
  color: rgba(255,255,255,0.82);
}
.camera-thumb-overlay {
  position: absolute;
  z-index: 3;
  right: 12px;
  bottom: 12px;
  width: min(44%, 158px);
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
  left: 10px;
  bottom: 7px;
  max-width: calc(100% - 20px);
  color: rgba(255,255,255,0.92);
  font-size: 10px;
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
  height: calc(100% - 46px);
  display: grid;
  grid-template-columns: 1fr;
  gap: 14px;
  align-items: stretch;
}
.tv-main, .spotify-copy, .ac-main, .ps5-copy {
  min-width: 0;
}
.media-title {
  margin-top: 8px;
  color: white;
  font-size: 15px;
  line-height: 1.1;
  font-weight: 800;
}
.media-subtitle {
  margin-top: 5px;
  color: var(--text-soft);
  font-size: 12px;
  font-weight: 600;
}
.control-row {
  display: flex;
  align-items: center;
  gap: 8px;
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
  grid-template-columns: auto minmax(0, 1fr) 38px;
  align-items: center;
  gap: 9px;
  margin-top: 0;
  color: rgba(255,255,255,0.66);
}
.volume-row bruno-icon {
  --mdc-icon-size: 15px;
}
.volume-row strong {
  color: rgba(255,255,255,0.88);
  font-size: 13px;
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
  font-size: 12px;
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
  height: calc(100% - 46px);
  display: grid;
  grid-template-columns: 1fr;
  grid-template-rows: minmax(116px, 1fr) auto;
  gap: 10px;
  align-items: stretch;
}
.ps5-minimal {
  gap: 8px;
}
.ps5-copy {
  grid-row: 2;
  display: grid;
  align-content: end;
  gap: 9px;
  height: 100%;
}
.ps5-copy > strong {
  align-self: end;
  color: rgb(45,225,118);
  font-size: 15px;
  font-weight: 800;
}
.ps5-meta {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
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
  gap: 9px;
}
.device-state {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  color: rgba(255,255,255,0.82);
  font-size: 11px;
  font-weight: 800;
}
.ps5-actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 40px;
  gap: 8px;
}
.ps5-meta span, .ac-meta span {
  display: grid;
  gap: 4px;
  min-width: 0;
  padding: 10px 11px;
  border-radius: 12px;
  color: var(--text-soft);
  font-size: 11px;
  background: rgba(255,255,255,0.052);
  border: 1px solid rgba(255,255,255,0.10);
}
.ps5-meta strong, .ac-meta strong {
  color: white;
  min-width: 0;
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.spotify-card {
  grid-area: spotify;
  padding: 14px;
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
  gap: 8px;
}
.tv-card .control-button, .spotify-controls .control-button {
  width: 36px;
  height: 36px;
  border-radius: 13px;
}
.temperature-pill {
  align-self: start;
  min-width: 58px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 7px 12px;
  border-radius: 999px;
  color: rgba(255,255,255,0.92);
  font-size: 14px;
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
  gap: 8px;
}
.climate-mode, .fan-mode, .climate-stepper {
  min-height: 38px;
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
  height: 38px;
  background: transparent;
  color: rgba(255,255,255,0.82);
  font-size: 17px;
}
.climate-stepper span {
  text-align: center;
  color: rgba(255,255,255,0.88);
  font-size: 13px;
  font-weight: 800;
}
.fan-label {
  display: block;
  color: rgba(255,255,255,0.90);
  font-weight: 800;
  margin-top: 3px;
  font-size: 12px;
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
  height: 104px;
  margin: -8px -14px -14px;
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
  gap: 8px;
  overflow: hidden;
}
.tv-body, .spotify-body {
  height: auto;
  min-height: 0;
  grid-template-columns: 1fr;
  grid-template-rows: var(--media-screen-height, 154px) auto;
  gap: 8px;
  align-items: stretch;
}
.tv-main, .spotify-copy {
  display: grid;
  grid-template-rows: 36px 24px;
  align-content: start;
  gap: 8px;
  padding-top: 12px;
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
  font-size: 14px;
}
.spotify-card .media-title, .spotify-title {
  max-width: 100%;
  min-width: 0;
  font-size: 13px;
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
  min-height: 28px;
  max-width: 76px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
@media (max-width: 1180px) {
.side-panel {
  grid-template-rows: auto minmax(0, 1fr);
}
.status-item {
  padding: 0 10px;
}
}
@media (max-width: 760px) {
:host {
  height: auto;
  overflow: visible;
}
.hero-stage {
  min-height: 430px;
}
.hero-content {
  grid-template-columns: 1fr;
}
.hero-clock {
  font-size: 70px;
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
  grid-auto-rows: minmax(94px, auto);
}
.cameras-card {
  min-height: 390px;
}
.tv-card, .ps5-card, .spotify-card, .ac-card {
  min-height: 260px;
}
.spotify-card {
  min-height: 360px;
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
  grid-template-columns: minmax(0, 1fr) minmax(292px, 0.55fr);
  grid-template-rows: minmax(264px, 1fr) minmax(292px, 1fr);
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
  gap: 12px;
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
  height: 46px;
  display: grid;
  grid-template-columns: 22px auto;
  align-items: center;
  column-gap: 9px;
  padding: 0 16px;
  color: rgba(255,255,255,0.92);
}
.tb-badge + .tb-badge {
  border-left: 1px solid rgba(255,255,255,0.10);
}
.tb-badge-icon {
  width: 22px;
  height: 22px;
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
  font-size: 10px;
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.60);
}
.tb-badge-sub {
  font-size: 11px;
  line-height: 1;
  font-weight: 600;
  color: rgba(255,255,255,0.42);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 170px;
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
  font-size: 12px;
  font-weight: 800;
  color: rgba(248,251,255,0.96);
}
.topband-clock small {
  display: block;
  font-size: 10px;
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
  padding: 0 12px;
  grid-area: bottomband;
  position: relative;
  min-width: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: transparent;
}
.subview-footer::before {
  content: "";
  position: absolute;
  top: 0;
  left: 8px;
  right: 8px;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent);
}
.subview-presence {
  letter-spacing: 0.02em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
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
  grid-template-columns: 34px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 11px;
  padding: 12px 14px;
  cursor: pointer;
}
.zone-icon {
  width: 34px;
  height: 34px;
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
  font-size: 14px;
  font-weight: 700;
  color: var(--text-main);
}
.zone-id small {
  font-size: 11px;
  font-weight: 600;
  color: var(--text-soft);
}
.zone-off {
  font-size: 11px;
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
  padding: 0 14px 12px;
  font-size: 11px;
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
  padding: 12px 14px;
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
  column-gap: 10px;
}
.zl-tile.is-wide .zl-icon {
  width: 28px;
}
.zl-icon {
  grid-area: icon;
  width: 40px;
  height: 40px;
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
  width: 27px;
  height: 27px;
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
  font-size: 15px;
  font-weight: 700;
  color: var(--text-main);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.zl-switch {
  grid-area: sw;
  position: relative;
  width: 38px;
  height: 22px;
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
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 3px rgba(0,0,0,0.35);
  transition: left 0.2s ease;
}
.zl-tile.is-on .zl-knob {
  left: calc(100% - 18px);
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
  grid-template-rows: 44px minmax(0, 1fr) 64px;
  gap: 0;
  min-height: 0;
  padding: 0;
  overflow: hidden;
}
.ac-lean-head {
  position: relative;
  z-index: 3;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 14px;
}
.ac-head-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.ac-top-stack {
  position: absolute;
  top: 5px;
  right: 10px;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}
.ac-more-button {
  flex: 0 0 auto;
}
.ac-power-floating {
  width: 46px;
  height: 46px;
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
  padding: 0 6px 2px;
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
  width: min(94%, 334px);
  transform: translateY(3px);
}
.ac-lean-foot {
  position: relative;
  z-index: 5;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 0 10px 10px;
  align-items: end;
}
.ac-control-wrap {
  position: relative;
  min-width: 0;
}
.ac-action {
  width: 100%;
  min-width: 0;
  min-height: 50px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  padding: 7px 10px;
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
  width: 32px;
  height: 34px;
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
  font-size: 10px;
  line-height: 1;
  font-weight: 650;
  color: rgba(255,255,255,0.58);
}
.ac-action-text strong {
  min-width: 0;
  font-size: 13px;
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
  bottom: calc(100% + 8px);
  z-index: 12;
  display: grid;
  gap: 4px;
  padding: 6px;
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660)) );
  border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
  box-shadow: var(--bruno-liquid-popup-shadow, inset 0 1px 0 rgba(255,255,255,0.100), 0 18px 36px rgba(0,0,0,0.300) );
  backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
  -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
}
.ac-popover-option {
  min-width: 0;
  min-height: 32px;
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 7px;
  padding: 0 8px;
  border-radius: 9px;
  border: 0;
  background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
  color: rgba(255,255,255,0.82);
  font-size: 11px;
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
  width: 58px;
  height: auto;
  max-height: calc(100% - 6px);
  grid-auto-rows: 40px;
  gap: 7px;
  padding: 12px 8px;
}
.room-nav-button {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 8px 2px 7px;
  border-radius: 13px;
  color: rgba(255,255,255,0.60);
  background: transparent;
  -webkit-tap-highlight-color: transparent;
  transition: background 160ms ease, color 160ms ease;
  width: 40px;
  height: 40px;
  min-width: 40px;
  min-height: 40px;
  max-width: 40px;
  max-height: 40px;
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
  padding: 15px 18px 14px;
  gap: 8px;
}
.hero-headline {
  grid-column: 1;
  grid-row: 2;
  align-self: start;
  justify-self: start;
  margin-top: 12px;
}
.hero-date-line {
  margin: 0 0 11px;
  color: rgba(255,255,255,0.54);
  font-size: 11px;
  line-height: 1;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 6px;
}
.hero-clock {
  line-height: 0.96;
  font-weight: 220;
  font-variant-numeric: tabular-nums;
  color: rgba(255,255,255,0.95);
  text-shadow: 0 10px 32px rgba(0,0,0,0.28);
  margin-top: 8px;
  font-size: clamp(54px, 7.1vh, 74px);
}
.scene-pill {
  width: fit-content;
  max-width: min(250px, 100%);
  min-height: 30px;
  margin-top: 12px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 0 12px;
  border-radius: 999px;
  color: rgba(255,255,255,0.88);
  font-size: 11px;
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
  width: min(520px, 100%);
  gap: 12px;
}
.curtain-action-button {
  width: 76px;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 5px;
  padding: 0 9px;
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.15));
  background: var(--bruno-liquid-control-background, linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)), rgba(255,255,255,0.030) );
  box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
  backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  -webkit-backdrop-filter: var(--bruno-liquid-control-filter, blur(12px) saturate(0.96) brightness(1.04));
  color: rgba(255,255,255,0.88);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0;
  white-space: nowrap;
  min-width: 78px;
}
.status-rail {
  display: grid;
  gap: 0;
  padding: 0;
  min-height: 64px;
  grid-template-columns: repeat(5, minmax(0, 1fr));
}
.status-item {
  display: grid;
  align-items: center;
  min-width: 0;
  gap: 8px;
  border-right: 1px solid rgba(255,255,255,0.08);
  grid-template-columns: auto minmax(0, 1fr);
  padding: 0 12px;
}
.status-chevron {
  --mdc-icon-size: 17px;
  color: rgba(255,255,255,0.58);
  display: none;
}
.lights-card .module-head {
  margin-bottom: 0;
  align-items: start;
  min-height: 40px;
}
.lights-title-row {
  display: flex;
  align-items: center;
  gap: 12px;
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
  min-height: 30px;
  padding: 0 12px;
  border-radius: 999px;
  color: rgba(255,255,255,0.62);
  background: transparent;
  font-size: 10px;
  font-weight: 900;
}
.head-actions .chip-button {
  min-height: 34px;
  padding: 0 14px;
}
.chip-button-icon {
  display: inline-flex;
  align-items: center;
  gap: 6px;
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
  gap: 14px 10px;
}
.lights-zone-rail {
  position: relative;
  min-height: 0;
  grid-template-rows: auto minmax(0, 1fr) auto;
  justify-items: center;
  gap: 10px;
  padding: 9px 7px;
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
  grid-template-columns: 60px minmax(0, 1fr);
  column-gap: 11px;
  padding: 11px 12px;
}
.light-icon {
  grid-area: icon;
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  --light-color: var(--state-icon-color, #9da0a2);
  color: rgba(255,255,255,0.74);
  width: 60px;
  height: 60px;
}
.light-tile strong {
  grid-area: title;
  min-width: 0;
  align-self: end;
  line-height: 1.12;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14.8px;
}
.cameras-card.cameras-card-controls {
  padding: 0;
  display: grid;
  grid-template-rows: 44px minmax(0, 1fr);
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
  padding: 0 10px 10px;
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
  right: 20px;
  bottom: 22px;
  width: min(36%, 150px);
  height: 86px;
  border-radius: 13px;
  box-shadow: 0 12px 30px rgba(0,0,0,0.34), 0 0 0 1px rgba(255,255,255,0.10);
}
.camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: 76px;
}
.camera-pip-feed .camera-row-copy {
  left: 9px;
  right: 9px;
  bottom: 8px;
  gap: 0;
}
.camera-pip-feed .camera-row-copy strong {
  max-width: 100%;
  font-size: 11px;
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
  gap: 8px;
  padding: 16px;
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
  font-size: 12px;
  font-weight: 760;
  line-height: 1.1;
}
.camera-pip-feed .camera-state-surface {
  gap: 4px;
  padding: 8px;
}
.camera-pip-feed .camera-state-surface bruno-icon {
  --mdc-icon-size: 22px;
}
.camera-pip-feed .camera-state-surface span {
  font-size: 9px;
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
  left: 10px;
  right: 10px;
  bottom: 10px;
  z-index: 7;
  min-height: 58px;
  display: grid;
  align-items: stretch;
  padding: 4px 0;
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
  min-height: 50px;
  display: grid;
  grid-template-columns: 18px auto 28px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  padding: 0 8px;
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
  top: 11px;
  bottom: 11px;
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
  font-size: 11px;
  font-weight: 760;
  line-height: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.camera-control-switch {
  position: relative;
  justify-self: start;
  width: 26px;
  height: 14px;
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
  width: 8px;
  height: 8px;
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
  gap: 4px;
  left: 14px;
  right: 14px;
  bottom: 14px;
  transition: bottom 220ms ease;
}
.camera-pip-stage.is-controls-open .camera-primary-feed .camera-row-copy {
  bottom: 76px;
}
.camera-row-copy strong {
  font-size: 15px;
  line-height: 1.08;
}
.media-hub-card {
  padding: 14px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 10px;
}
.media-hub-head {
  align-items: start;
  min-height: 38px;
  margin-bottom: 0;
}
.media-tabs {
  gap: 2px;
  max-width: 62%;
}
.media-tabs button {
  min-width: 0;
  min-height: 30px;
  display: grid;
  grid-template-columns: auto auto;
  grid-template-rows: auto auto;
  align-items: center;
  column-gap: 5px;
  padding: 3px 9px;
  border-radius: 999px;
  color: rgba(255,255,255,0.58);
  background: transparent;
  font-size: 10px;
  font-weight: 900;
}
.media-tabs button.is-selected {
  color: rgba(255,255,255,0.96);
  background: rgba(255,255,255,0.12);
}
.media-tabs small {
  grid-column: 2;
  max-width: 66px;
  color: rgba(255,255,255,0.46);
  font-size: 8px;
  line-height: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.source-dot {
  grid-row: 1 / 3;
  width: 6px;
  height: 6px;
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
  grid-template-columns: minmax(186px, 0.86fr) minmax(0, 1fr);
  grid-template-rows: minmax(206px, 1fr);
  grid-template-areas: "visual content";
  align-items: stretch;
  gap: 12px;
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
  grid-template-rows: 40px minmax(122px, 1fr) auto;
  align-content: stretch;
  gap: 11px;
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
  min-height: 40px;
  display: grid;
  grid-template-rows: 20px 16px;
  align-content: start;
  gap: 4px;
  padding-top: 1px;
}
.media-details strong {
  min-width: 0;
  color: white;
  font-size: 17px;
  line-height: 1.08;
  font-weight: 850;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details small, .media-details em {
  min-width: 0;
  color: var(--text-soft);
  font-size: 12px;
  line-height: 1.25;
  font-style: normal;
  font-weight: 650;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.media-details em {
  color: rgba(255,255,255,0.48);
  font-size: 11px;
}
.media-action-stack {
  grid-area: auto;
  --media-action-size: 55px;
  display: grid;
  align-content: center;
  align-self: center;
  gap: 12px;
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
  gap: 9px;
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
  width: 44px;
  height: 44px;
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
  min-height: 34px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 0 12px;
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
  grid-template-rows: 44px minmax(0, 1fr);
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
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 10px 0 14px;
}
.mh-head-title {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}
.mh-menu {
  width: 30px;
  height: 30px;
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
  top: 42px;
  right: 10px;
  width: min(280px, calc(100% - 20px));
  padding: 7px;
  border-radius: var(--bruno-liquid-cell-radius, 13px);
  background: linear-gradient(180deg, rgba(34,31,30,0.72), rgba(12,13,16,0.66));
  border: 1px solid rgba(255,255,255,0.115);
  box-shadow: 0 18px 36px rgba(0,0,0,0.30), inset 0 1px 0 rgba(255,255,255,0.10);
  backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
  -webkit-backdrop-filter: blur(22px) saturate(1.04) brightness(0.96);
}
.mh-overflow-item {
  min-height: 52px;
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 34px 34px;
  align-items: center;
  gap: 8px;
  padding: 4px 5px;
}
.mh-overflow-icon {
  width: 30px;
  height: 30px;
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
  font-size: 12.5px;
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.92);
}
.mh-overflow-copy small {
  min-width: 0;
  font-size: 10.5px;
  line-height: 1.1;
  font-weight: 650;
  color: rgba(255,255,255,0.54);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-overflow-action {
  width: 32px;
  height: 32px;
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
  gap: 8px;
  padding: 0 10px 10px;
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
  height: 42px;
  display: grid;
  grid-template-columns: 20px minmax(0, auto) minmax(0, 1fr) 16px;
  align-items: center;
  gap: 6px;
  padding: 0 12px 0 14px;
  background: transparent;
  text-align: left;
  transition: flex-basis 220ms ease, height 220ms ease;
}
.mh-source.is-open .mh-source-head {
  flex: 0 0 48px;
  height: 48px;
  align-items: center;
}
.mh-src-icon {
  width: 20px;
  height: 20px;
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
  font-size: 14px;
  font-weight: 800;
  line-height: 1;
  color: rgba(255,255,255,0.92);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-source.is-open .mh-src-name {
  font-size: 15px;
}
.mh-src-summary {
  min-width: 0;
  justify-self: end;
  max-width: 100%;
  font-size: 11.5px;
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
  grid-template-columns: minmax(0, 1fr) clamp(168px, 40%, 260px);
  gap: 14px;
  padding: 2px 16px 14px;
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
  gap: 10px;
}
.mh-source.is-switching .mh-left {
  animation: mh-source-content-in 220ms cubic-bezier(0.2, 0.8, 0.2, 1) 75ms both;
}
.mh-info {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: 26px;
}
.mh-info small {
  display: block;
  font-size: 13.5px;
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
  font-size: 11.5px;
  font-weight: 600;
  line-height: 1.2;
  color: rgba(255,255,255,0.5);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.mh-progress-wrap {
  width: min(100%, 94%);
  margin-top: 5px;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: 7px;
}
.mh-progress-time {
  font-size: 9.5px;
  line-height: 1;
  font-weight: 700;
  color: rgba(255,255,255,0.48);
  font-variant-numeric: tabular-nums;
}
.mh-progress {
  height: 4px;
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
  gap: 6px;
}
.mh-vol {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  align-items: center;
  gap: 9px;
  min-height: 32px;
  padding: 0 12px;
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
  font-size: 11.5px;
  font-weight: 700;
  white-space: nowrap;
  color: rgba(255,255,255,0.7);
}
.mh-vol input[type="range"] {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 4px;
  border-radius: 999px;
  background: rgba(255,255,255,0.18);
  accent-color: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
  box-shadow: 0 0 8px rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.5);
  cursor: pointer;
}
.mh-vol input[type="range"]::-moz-range-thumb {
  width: 14px;
  height: 14px;
  border: 0;
  border-radius: 50%;
  background: rgb(var(--bruno-liquid-warm-accent, 242,194,102));
}
.mh-vol.is-disabled {
  opacity: 0.4;
}
.mh-btn-row {
  display: grid;
  gap: 8px;
}
.mh-btn-row-3 {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}
.mh-btn-row-4 {
  grid-template-columns: repeat(3, minmax(0, 1fr)) 42px;
}
.mh-btn {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 0 8px;
  border-radius: var(--bruno-liquid-control-radius-compact, 9px);
  color: rgba(255,255,255,0.88);
  font-size: 11.5px;
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
  min-width: 140px;
  min-height: 40px;
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
  inset: 6px 0;
  width: 100%;
  height: calc(100% - 12px);
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
  height: calc(100% - 10px);
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
  flex-basis: 42px;
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
  padding: 14px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  gap: 8px;
}
.ac-head {
  margin-bottom: 0;
}
.power-button {
  width: 40px;
  height: 40px;
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
  gap: 12px;
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
  grid-template-columns: 42px minmax(0, 1fr) 42px;
  align-items: center;
  overflow: hidden;
  margin-bottom: 4px;
}
.ac-visual {
  position: relative;
  min-height: 300px;
  display: grid;
  grid-template-rows: auto auto;
  align-content: center;
  justify-items: center;
  gap: 16px;
  padding: 0 0 2px;
}
.ac-image-shell {
  position: relative;
  width: 100%;
  height: 116px;
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
  width: min(100%, 820px);
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
  font-size: 18px;
  font-weight: 500;
  letter-spacing: 1.4px;
  fill: rgba(224, 235, 248, 0.74);
}
.icg-label.edge {
  font-size: 22px;
  fill: rgba(230, 240, 252, 0.82);
}
.icg-label.top {
  font-size: 19px;
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
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 9px;
  fill: rgba(38, 190, 255, 0.96);
  text-transform: uppercase;
}
.icg-center-temp {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 96px;
  font-weight: 300;
  letter-spacing: -8px;
  fill: rgba(246, 250, 255, 0.98);
  filter: url(#icgTextGlow);
}
.icg-center-sub {
  font-family: Inter, "SF Pro Display", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  font-size: 15px;
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
  font-size: 14px;
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
  font-size: 11px;
  font-weight: 800;
  aspect-ratio: 1;
  min-height: 0;
  height: auto;
  padding: 0 4px;
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
  gap: 8px;
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
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid rgba(255,255,255,0.10);
}
.section-head .zone-id {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}
.section-head .zone-id strong {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.1;
}
.section-head .zone-id small {
  font-size: 11.5px;
  font-weight: 600;
  color: rgba(255,255,255,0.46);
}
.section-head .zone-off {
  padding: 0 2px;
  border: 0;
  background: none;
  font: inherit;
  font-size: 12px;
  font-weight: 700;
  color: rgba(255,196,90,0.92);
  cursor: pointer;
}
.lights-substatus {
  padding: 0 2px 8px;
  font-size: 11.5px;
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
  min-height: 44px;
  padding: 0;
  border: 0;
  background: none;
  color: inherit;
  font: inherit;
  cursor: pointer;
  gap: 9px;
}
.lights-dock-chevron {
  display: grid;
  place-items: center;
  padding: 0;
  border: 0;
  background: none;
  cursor: pointer;
  transition: transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: 22px;
  height: 22px;
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
  gap: 12px;
  padding: 0 10px;
  min-height: 52px;
}
.lights-scroll {
  max-height: 100%;
  overflow-y: auto;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
  padding: 10px 10px 10px;
}
.section-head {
  display: grid;
  align-items: center;
  grid-template-columns: 34px minmax(0, 1fr) auto;
  gap: 8px;
  padding: 0 10px 8px;
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
  grid-template-columns: 20px minmax(0, 1fr) auto;
  gap: 7px;
  padding: 0 8px;
  min-height: 60px;
  border: 1px solid var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
  border-radius: 0;
}
.lc-icon {
  display: grid;
  place-items: center start;
  --light-color: #9da0a2;
  color: var(--light-color);
  width: 20px;
}
.lc-name {
  min-width: 0;
  font-weight: 600;
  color: rgba(255,255,255,0.90);
  text-overflow: ellipsis;
  font-size: 13.5px;
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
  width: 32px;
  height: 19px;
}
.lc-knob {
  border-radius: 50%;
  background: rgba(255,255,255,0.92);
  transform: translateX(0);
  transition: transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
  width: 14px;
  height: 14px;
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
  width: calc(100% - 20px);
  margin-inline: 10px;
  gap: 4px;
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
  padding: 10px;
}
.room-sidebar {
  display: none;
}
.subview-topbar, .subview-footer {
  display: none;
}
.left-column {
  height: auto;
  grid-template-rows: minmax(340px, 42vh) minmax(270px, 34vh);
}
.right-column {
  height: auto;
  grid-template-rows: auto auto;
}
.right-control-grid {
  grid-template-columns: minmax(0, 1fr) minmax(280px, 0.72fr);
  grid-template-rows: minmax(236px, auto) minmax(300px, auto);
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
  min-height: 68px;
}
}
@media (max-width: 760px) {
.room-subview {
  grid-template-rows: auto;
  grid-template-columns: 1fr;
  grid-template-areas: "left" "right";
  padding: 8px;
}
.left-column {
  grid-template-rows: minmax(430px, auto) minmax(390px, auto);
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
  min-height: 58px;
}
.media-tabs {
  max-width: 100%;
  width: 100%;
  justify-content: space-between;
}
.media-hub-head {
  display: grid;
  gap: 10px;
}
.media-hub-body {
  grid-template-columns: 1fr;
  grid-template-rows: minmax(176px, auto) auto;
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
  gap: 10px;
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
  min-height: 238px;
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
`, Ji = x`
:host([data-appliances]) .appliances-card {
  grid-area: appliances;
  min-width: 0;
  min-height: 0;
  padding: 14px;
  display: grid;
  grid-template-rows: 44px minmax(0, 1fr);
  gap: 10px;
  overflow: hidden;
}
:host([data-appliances]) .appliances-head {
  min-height: 38px;
  margin-bottom: 0;
}
:host([data-appliances]) .appliances-grid {
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 10px;
}
:host([data-appliances]) .appliance-tile {
  position: relative;
  min-width: 0;
  min-height: 0;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 8px;
  padding: 12px 10px 10px;
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
  top: 7px;
  right: 7px;
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
  padding: 10px 10px 2px;
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
  font-size: 14px;
  line-height: 1.05;
  font-weight: 800;
  color: rgba(255,255,255,0.94);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-appliances]) .appliance-copy small {
  min-width: 0;
  font-size: 11px;
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
`, Ki = x`
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
  height: 44px;
  grid-template-columns: 20px minmax(0, 1fr);
  column-gap: 6px;
  padding: 0 8px;
}
:host([data-tvhub]) .tb-badge-icon {
  width: 20px;
  height: 20px;
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
  gap: 10px;
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
  min-height: 44px;
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
  gap: 10px;
}
:host([data-tvhub]) .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-tvhub]) .head-actions .chip-button, :host([data-tvhub]) .zone-header {
  min-height: 44px;
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
  min-height: 360px;
  grid-template-rows: 44px minmax(220px, auto) auto;
  overflow: visible;
}
:host([data-tvhub]) .ac-lean-foot {
  align-items: stretch;
}
:host([data-tvhub]) .ac-action {
  min-height: 52px;
}
:host([data-tvhub]) .media-hub-card.mh-accordion {
  order: 40;
  height: auto;
  min-height: 330px;
  grid-template-rows: 44px minmax(278px, 1fr);
}
:host([data-tvhub]) .media-hub-card.is-unconfigured {
  display: none;
}
:host([data-tvhub]) .mh-source {
  flex-basis: 44px;
}
:host([data-tvhub]) .mh-source-head {
  flex-basis: 44px;
  height: 44px;
}
:host([data-tvhub]) .mh-source-body {
  grid-template-columns: minmax(0, 1fr) clamp(104px, 30vw, 148px);
  gap: 8px;
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
  min-height: 44px;
}
:host([data-tvhub]) .mh-menu {
  width: 44px;
  height: 44px;
}
:host([data-tvhub]) .cameras-card.cameras-card-controls {
  order: 50;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: 44px clamp(220px, 58vw, 360px);
}
:host([data-tvhub]) .camera-pip-stage, :host([data-tvhub]) .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-tvhub]) .camera-control {
  min-height: 44px;
}
:host([data-tvhub]) .subview-footer {
  display: none;
}
}
`, ea = x`
@media (max-width: 800px) {
:host([data-ps5]) .camera-pip-feed {
  right: 16px;
  bottom: 16px;
  width: clamp(88px, 25%, 112px);
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-ps5]) .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: 70px;
}
}
`;
x`

`;
const ta = x`
:host([data-room='sala']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: 34px;
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
  grid-template-columns: minmax(0, 1.62fr) minmax(360px, 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr);
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
  gap: 10px;
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
  padding: 0 6px 6px;
}
:host([data-room='sala']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='sala']) .light-row {
  display: grid;
  grid-template-columns: 38px 120px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='sala']) .light-row-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='sala']) .light-row-name {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='sala']) .light-bar {
  height: 11px;
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
`, ia = x`
:host([data-room='office']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: 34px;
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
  grid-template-columns: minmax(0, 1.62fr) minmax(360px, 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr);
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
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='office']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 6px 6px;
}
:host([data-room='office']) .light-row {
  display: grid;
  grid-template-columns: 38px 120px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='office']) .light-row-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='office']) .light-row-name {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='office']) .light-bar {
  height: 11px;
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
  gap: 10px;
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, aa = x`
:host([data-room='cozinha']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: 34px;
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
  gap: 10px;
  min-height: 0;
  overflow-y: auto;
  padding: 0 2px 0 0;
}
:host([data-room='cozinha']) .zone-lights {
  display: flex;
  flex-direction: column;
  padding: 0 6px 6px;
}
:host([data-room='cozinha']) .light-row {
  display: grid;
  grid-template-columns: 38px 120px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='cozinha']) .light-row-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='cozinha']) .light-row-name {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='cozinha']) .light-bar {
  height: 11px;
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
  grid-template-columns: minmax(0, 0.81fr) minmax(0, 0.81fr) minmax(360px, 0.66fr);
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
  gap: 8px;
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
  gap: 10px;
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
  height: 44px;
  grid-template-columns: 20px minmax(0, 1fr);
  column-gap: 6px;
  padding: 0 8px;
}
:host([data-room='cozinha']) .room-subview .tb-badge-icon {
  width: 20px;
  height: 20px;
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
  gap: 10px;
}
:host([data-room='cozinha']) .room-subview .head-actions {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}
:host([data-room='cozinha']) .room-subview .head-actions .chip-button, :host([data-room='cozinha']) .room-subview .zone-header {
  min-height: 44px;
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
  grid-auto-rows: minmax(154px, auto);
  align-items: stretch;
}
:host([data-room='cozinha']) .room-subview .appliance-tile:last-child:nth-child(odd) {
  grid-column: 1 / -1;
}
:host([data-room='cozinha']) .room-subview .appliance-main {
  min-height: 44px;
}
:host([data-room='cozinha']) .room-subview .mh-menu {
  width: 44px;
  height: 44px;
  min-height: 44px;
}
:host([data-room='cozinha']) .room-subview .cameras-card.cameras-card-controls {
  order: 40;
  width: 100%;
  height: auto;
  min-height: 0;
  grid-template-rows: 44px clamp(220px, 58vw, 360px);
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage, :host([data-room='cozinha']) .room-subview .camera-feed {
  min-height: 0;
  height: 100%;
}
:host([data-room='cozinha']) .room-subview .camera-pip-feed {
  right: 16px;
  bottom: 16px;
  width: clamp(88px, 25%, 112px);
  height: auto;
  aspect-ratio: 4 / 3;
  border-radius: 11px;
}
:host([data-room='cozinha']) .room-subview .camera-pip-stage.is-controls-open .camera-pip-feed {
  bottom: 70px;
}
:host([data-room='cozinha']) .room-subview .camera-control {
  min-height: 44px;
}
:host([data-room='cozinha']) .room-subview .subview-footer {
  display: none;
}
}
`, oa = x`
:host([data-room='casal']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: 34px;
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
  grid-template-columns: minmax(0, 1.62fr) minmax(360px, 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr);
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
  gap: 10px;
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
  padding: 0 6px 6px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='casal']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='casal']) .light-row {
  display: grid;
  grid-template-columns: 32px 112px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 5px 8px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='casal']) .light-row-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='casal']) .light-row-name {
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='casal']) .light-bar {
  height: 9px;
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
  gap: 10px;
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, ra = x`
:host([data-room='marina']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: 34px;
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
  grid-template-columns: minmax(0, 1.62fr) minmax(360px, 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr);
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
  gap: 10px;
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
  padding: 0 6px 6px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='marina']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='marina']) .light-row {
  display: grid;
  grid-template-columns: 38px 120px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='marina']) .light-row-icon {
  width: 36px;
  height: 36px;
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='marina']) .light-row-name {
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='marina']) .light-bar {
  height: 11px;
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
  gap: 10px;
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, na = x`
:host([data-room='miguel']) .spotify-title.is-marquee span {
  max-width: none;
  min-width: 100%;
  padding-right: 34px;
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
  grid-template-columns: minmax(0, 1.62fr) minmax(360px, 0.66fr);
  grid-template-rows: 48px minmax(0, 1fr);
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
  gap: 10px;
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
  padding: 0 6px 6px;
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}
:host([data-room='miguel']) .zone-lights::-webkit-scrollbar {
  width: 0;
}
:host([data-room='miguel']) .light-row {
  display: grid;
  grid-template-columns: 32px 112px minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  min-height: 44px;
  padding: 5px 8px;
  background: transparent;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  color: var(--text-main);
  text-align: left;
}
:host([data-room='miguel']) .light-row-icon {
  width: 32px;
  height: 32px;
  display: grid;
  place-items: center;
  --light-color: #9da0a2;
  color: var(--light-color);
}
:host([data-room='miguel']) .light-row-name {
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
:host([data-room='miguel']) .light-bar {
  height: 9px;
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
  gap: 10px;
  padding: 0;
  background: transparent;
  overflow: visible;
}
}
`, sa = {
  sala: ta,
  office: ia,
  cozinha: aa,
  casal: oa,
  marina: ra,
  miguel: na
}, k = "bruno-room-subview";
function la(r) {
  return r === !0 ? !0 : typeof r == "number" ? r > 0 : ["true", "on", "yes", "1"].includes(String(r ?? "").toLowerCase());
}
const ca = ["on", "playing", "paused", "idle"], da = ["playing", "paused", "on", "idle"], pa = ["streaming", "recording", "idle", "on"], ma = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], ua = ["cooling", "heating", "drying", "fan", "preheating"], ha = ["off", "idle"], ga = 4e3, ba = 6e3, fa = "/local/bruno-ui/assets/tcl-qled-mini-led-75.png?v=20260802-assets-resize-1", va = "/local/images/echo_pop.png?v=20260702-all-images-1", xa = "/local/images/office_pc.png?v=20260702-all-images-1";
function H(r, e = 0) {
  const t = Number(r);
  return Number.isFinite(t) ? t.toFixed(e).replace(/\.0+$/, "") : "--";
}
function it(r) {
  const e = Math.max(0, Math.floor(Number(r) || 0)), t = Math.floor(e / 3600), i = Math.floor(e % 3600 / 60), a = e % 60;
  return t > 0 ? `${t}:${String(i).padStart(2, "0")}:${String(a).padStart(2, "0")}` : `${i}:${String(a).padStart(2, "0")}`;
}
function ye(r) {
  const e = String(r ?? "").replace(/_/g, " ").trim();
  return e ? e.charAt(0).toUpperCase() + e.slice(1) : "—";
}
class _a extends A {
  constructor() {
    super(...arguments), this._lightsOpen = !1, this._fonteMidia = "", this._midiaAtivasAntes = [], this._menuMidiaAberto = !1, this._spotifyFerramentas = !1, this._painelClima = "", this._controlesCameraAbertos = !1, this._cameraAtiva = "", this._urlsCarregadas = {}, this._ultimaImagem = {}, this._motorCameras = new kt({
      // O primeiro quadro é do elemento de imagem, que nasce com `src` e baixa
      // sozinho. O motor entra só na primeira atualização — sem isto eram DUAS
      // requisições lentas por câmera na montagem, competindo entre si.
      atrasoInicial: yt.principal,
      agenda: {
        agendar: (e, t) => U(k, e, t),
        cancelar: (e) => be(k, e),
        agora: () => performance.now()
      },
      aoCarregar: (e) => this._quadroPronto(e.entityId, e.url),
      aoMedir: (e, t, i, a) => {
        const o = e.split(".")[1] ?? e;
        ae(`câmera ${o}`, t, i === "ok"), a && ae(`câmera ${o} · 1º quadro`, t, !0);
      }
    }), this._observador = new De(), this._motivo = "", this._ultimoMinuto = "", this._ouvindoVisibilidade = !1, this._aoMudarVisibilidade = () => {
      if (this.isConnected) {
        if (document.visibilityState === "hidden") {
          this._pararTimerCameras(), this._pararAoVivo();
          return;
        }
        this._atualizarCameras(), this._iniciarTimerCameras();
      }
    }, this._modoPlayer = "nenhum", this._montadoEm = 0, this._quadrosNaTela = /* @__PURE__ */ new Set(), this._socorros = /* @__PURE__ */ new Set(), this._materialInjetado = !1, this._luzesAssentadas = !1, this._appsTvAbertos = !1;
  }
  static {
    this.properties = {};
  }
  setConfig(e) {
    if (!e?.room) throw new Error("bruno-room-subview: informe `room`");
    const t = Ie.find((i) => i.id === e.room);
    if (!t) throw new Error(`bruno-room-subview: cômodo desconhecido "${e.room}"`);
    this._config = e, this._room = t, this._sub = Li[e.room], this._config, this._hass, this._observador.observar([
      ...Qe(t),
      ...Qe(this._sub)
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
  set hass(e) {
    this._hass = e;
    const t = this._observador.mudancas(e);
    t.length !== 0 && (this._motivo = Oe(t), this.requestUpdate());
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
  update(e) {
    const t = this._motivo;
    this._motivo = "", Se(k, () => super.update(e), t || this._motivoPadrao());
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
  updated(e) {
    super.updated(e), this._hass && this._sincronizarCameras();
  }
  connectedCallback() {
    super.connectedCallback(), ze(k), this._montadoEm = performance.now(), this._quadrosNaTela.clear(), this._socorros.clear(), this._aplicarAtributos();
    const e = globalThis;
    e.BrunoLiquidGlass?.apply?.(), e.BrunoSurfaceMaterial?.connect?.(this), this._injetarMaterial(), this._iniciarTimerCameras(), this._armarVigiaDeCameras(), this._iniciarTimerRelogio(), !this._ouvindoVisibilidade && typeof document < "u" && (Rt(k, document, "visibilitychange", this._aoMudarVisibilidade), this._ouvindoVisibilidade = !0);
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
    this._cancelarRelogio || (this._cancelarRelogio = Bi(() => {
      const e = this._hora();
      e !== this._ultimoMinuto && (this._ultimoMinuto = e, this._motivo = "relógio", this.requestUpdate());
    }));
  }
  _pararTimerRelogio() {
    this._cancelarRelogio?.(), this._cancelarRelogio = void 0;
  }
  disconnectedCallback() {
    super.disconnectedCallback(), qe(k), globalThis.BrunoSurfaceMaterial?.disconnect?.(this), this._pararTimerCameras(), this._pararAoVivo(), this._timerLuzes && (be(k, this._timerLuzes), this._timerLuzes = void 0), this._pararTimerRelogio(), this._ouvindoVisibilidade && (Bt(k, document, "visibilitychange", this._aoMudarVisibilidade), this._ouvindoVisibilidade = !1);
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
    const e = this._camerasConfiguradas().map((o) => this._cameraViva(o));
    if (!e.length) {
      this._motorCameras.definirAlvos([]), this._pararAoVivo();
      return;
    }
    const t = e.find((o) => o.entity === this._cameraAtiva) ?? e[0], i = e.find((o) => o.online), a = t?.online || !i ? t : i;
    this._motorCameras.definirAlvos(
      e.filter((o) => !(this._liveEl?.isConnected && we(o.entity))).map((o) => ({
        entityId: o.entity,
        base: o.base,
        prioridade: o.entity === a?.entity ? "principal" : "secundaria"
      }))
    ), this._cuidarDoAoVivo(a?.entity);
  }
  /**
   * Aponta o player nativo do HA para a câmera do palco.
   *
   * `hui-image` com `cameraView = 'live'` é o mesmo elemento que a subview de
   * câmeras usa, e que mostra esta câmera em tempo real hoje. Ele escolhe entre
   * WebRTC e HLS, e cai para instantâneo sozinho quando nenhum dos dois fecha.
   *
   * O elemento é criado UMA vez e reaproveitado: trocar de câmera é trocar a
   * propriedade, não remontar. Remontar reiniciaria a negociação a cada render.
   */
  _cuidarDoAoVivo(e) {
    const t = e && we(e) ? e : "";
    if (!t) {
      this._pararAoVivo();
      return;
    }
    const i = this.shadowRoot?.querySelector(
      `.camera-live-slot[data-camera-live="${t}"]`
    );
    if (!i) return;
    if (!this._liveEl) {
      const o = this._criarPlayer(t);
      if (!o) return;
      this._liveEl = o, this._marcarModoAoVivo(t, o);
    }
    const a = this._liveEl;
    a.hass = this._hass, "entityid" in a && a.entityid !== t && (a.entityid = t), "cameraImage" in a && a.cameraImage !== t && (a.cameraImage = t), a.parentElement !== i && i.appendChild(a);
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
   * ── O FALLBACK, E POR QUE ELE EXISTE ────────────────────────────────────
   *
   * `ha-web-rtc-player` é carregado sob demanda pelo próprio `ha-camera-stream`.
   * Numa página recém-carregada, onde nenhuma câmera foi aberta ainda, ele pode
   * não estar registrado. Nesse caso cai no `hui-image`, que é o comportamento
   * de antes — nunca pior do que já era.
   */
  _criarPlayer(e) {
    if (customElements.get("ha-web-rtc-player")) {
      const t = document.createElement("ha-web-rtc-player");
      t.classList.add("camera-live-el"), t.setAttribute("muted", ""), t.setAttribute("playsinline", ""), t.setAttribute("autoplay", ""), t.entityid = e;
      try {
        t.fitMode = "cover";
      } catch {
      }
      return this._modoPlayer = "webrtc", t;
    }
    if (customElements.get("hui-image")) {
      const t = document.createElement("hui-image");
      t.classList.add("camera-live-el"), t.cameraView = "live";
      try {
        t.fitMode = "cover";
      } catch {
      }
      return this._modoPlayer = "hui-image", t;
    }
    this._modoPlayer = "nenhum";
  }
  /**
   * Registra QUAL player foi montado, e se ele produziu vídeo.
   *
   * ── POR QUE ESTA MEDIÇÃO MUDOU ──────────────────────────────────────────
   *
   * A versão anterior media a PRESENÇA de um "ha-camera-stream" no shadow root
   * e registrava isso como sucesso. Não provava nada sobre o protocolo: aquele
   * elemento é um seletor que começa em HLS. Eu li "stream 264px" como "está em
   * WebRTC" e estava errado.
   *
   * E ela chamava "requisicaoManual" com o tempo desde a montagem do
   * componente. O painel mostra isso na coluna de REQUISIÇÕES, ao lado de
   * chamadas de rede reais — um "pior: 122.348 ms" ali parece uma requisição
   * pendurada por dois minutos, que nunca existiu. Métrica sintética vestida de
   * medição de rede. Diagnóstico do Codex, e ele está certo nos dois pontos.
   *
   * Agora: o prefixo "marco:" diz que é tempo desde a montagem, e o sucesso
   * depende de "video.readyState >= 2" — ou seja, há quadro decodificado. É a
   * única evidência de que o player está EXIBINDO, e não apenas montado.
   */
  _marcarModoAoVivo(e, t) {
    const i = e.split(".")[1] ?? e;
    U(k, () => {
      if (!this.isConnected || !t.isConnected) return;
      const o = t.shadowRoot?.querySelector("video"), n = !!(o && o.readyState >= 2), l = Math.round(t.getBoundingClientRect().height);
      ae(
        `marco: ${i} · player ${this._modoPlayer} · ${n ? "exibindo" : "sem quadro"} ${l}px`,
        performance.now() - this._montadoEm,
        n
      );
    }, ba);
  }
  _pararAoVivo() {
    this._liveEl?.remove(), this._liveEl = void 0;
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
  _marcarQuadroNaTela(e) {
    if (this._quadrosNaTela.has(e)) return;
    this._quadrosNaTela.add(e);
    const t = e.split(".")[1] ?? e;
    ae(`câmera ${t} · até aparecer`, performance.now() - this._montadoEm, !0);
  }
  /**
   * O elemento não conseguiu baixar o primeiro quadro sozinho.
   *
   * Sem isto a tela ficaria vazia até o motor entrar, uma cadência inteira
   * depois. Uma vez por câmera por montagem: se a segunda também falhar, quem
   * cuida é o ciclo normal, com o recuo dele.
   */
  _socorrerCamera(e) {
    this._socorros.has(e) || (this._socorros.add(e), this._motorCameras.buscarAgora(e));
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
    for (const e of this._camerasConfiguradas())
      U(k, () => {
        !this.isConnected || this._quadrosNaTela.has(e.entity) || this._socorrerCamera(e.entity);
      }, ga);
  }
  /** Põe na tela o quadro que o motor acabou de baixar. */
  _quadroPronto(e, t) {
    this._urlsCarregadas[e] = t;
    const i = this.shadowRoot?.querySelector(
      `img[data-camera-entity="${e}"]`
    );
    i && (i.src = t, i.classList.add("is-loaded"), i.closest(".camera-main")?.classList.add("has-loaded-image"));
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
  _injetarMaterial(e = 0) {
    const t = this.shadowRoot;
    if (!t || this._materialInjetado || !this.isConnected) return;
    const a = globalThis.BrunoSurfaceMaterial?.subviewStyles?.();
    if (!a) {
      e < 20 && U(k, () => this._injetarMaterial(e + 1), 60);
      return;
    }
    try {
      const o = new CSSStyleSheet();
      o.replaceSync(a), t.adoptedStyleSheets = [...t.adoptedStyleSheets, o], this._materialInjetado = !0;
    } catch {
      const o = document.createElement("style");
      o.textContent = a, t.appendChild(o), this._materialInjetado = !0;
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
    const e = this._room;
    if (!e) return;
    this.setAttribute("data-room", e.id);
    const t = this._sub?.entities, i = (a, o) => {
      o ? this.setAttribute(a, "") : this.removeAttribute(a);
    };
    i("data-appliances", !!(t?.appliances ?? t?.dishwasher)), i("data-tvhub", !!t?.tv), i("data-ps5", !!t?.ps5);
  }
  /** O Office troca o hub de midia pela Estacao de Trabalho, com o PC. */
  get _temPc() {
    const e = this._sub?.entities;
    return !!(e?.pcSession ?? e?.pcActive ?? e?.pcPower);
  }
  /** O cômodo tem eletrodomésticos? Só a Cozinha, e ela usa um grid próprio. */
  get _temEletrodomesticos() {
    const e = this._sub?.entities;
    return !!(e?.appliances ?? e?.dishwasher);
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
      ut,
      x`
      :host {
        container-type: inline-size;
        container-name: subview;
      }
    `,
      Qi,
      Ki,
      Ji,
      ea,
      ...Object.values(sa),
      x`
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
    `
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
    const e = this._room?.entities, t = this._hass, i = (l) => l && t ? t.states[l] : void 0, a = this._contarLuzes(), o = i(e?.motionRecent)?.state === "on", n = [
      {
        icon: "mdi:motion-sensor",
        titulo: "Presença",
        sub: this._linhaPresenca(),
        tone: "96,165,250",
        ativo: o,
        ocultarNoTelefone: !0
      },
      {
        icon: "mdi:lightbulb",
        titulo: "Luzes",
        sub: this._linhaLuzes(),
        tone: "247,198,0",
        ativo: a > 0,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:thermometer",
        titulo: "Temperatura",
        sub: this._valorSensor(this._idDe("temperature") ?? e?.temperature, "°", 1),
        tone: "247,170,90",
        ativo: !1,
        ocultarNoTelefone: !1
      },
      {
        icon: "mdi:water-percent",
        titulo: "Umidade",
        sub: this._valorSensor(this._idDe("humidity") ?? e?.humidity, "%", 0),
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
    return c`
      <header class="subview-topband">
        <div class="topband-badges">
          ${n.map(
      (l) => c`
              <div
                class="tb-badge ${l.ativo ? "is-active" : ""}"
                data-phone-hide=${l.ocultarNoTelefone ? "" : u}
                style="--tone: ${l.tone};"
              >
                <span class="tb-badge-icon"><bruno-icon icon=${l.icon}></bruno-icon></span>
                <span class="tb-badge-text">
                  <span class="tb-badge-title">${l.titulo}</span>
                  <span class="tb-badge-sub">${l.sub}</span>
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
    const e = this._hass, t = this._room?.entities;
    return !e || !t?.lights ? 0 : t.lights.filter((i) => e.states[i]?.state === "on").length;
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
    const e = this._luzesDaConfiguracao();
    if (!e.length) return `${this._contarLuzes()} acesas`;
    const t = /* @__PURE__ */ new Map();
    for (const i of e) {
      const a = i.zone || "sala", o = this._hass?.states[i.entity]?.state === "on" ? 1 : 0;
      t.set(a, (t.get(a) ?? 0) + o);
    }
    return [...t.entries()].map(([i, a]) => `${i.charAt(0).toUpperCase()}${i.slice(1)} ${a}`).join(" · ");
  }
  _linhaPresenca() {
    const e = this._hass, t = this._room?.entities;
    if (!e || !t?.semanticState) return "Sensor indisponível";
    const a = e.states[t.semanticState]?.attributes.display;
    return a ? String(a) : e.states[t.motionRecent ?? ""]?.state === "on" ? "Presença" : "Sem presença";
  }
  /**
   * Leitura de um sensor da barra superior.
   *
   * Casas decimais e o traço de indisponível vêm dos originais: temperatura com
   * uma casa, umidade inteira, e `--` quando não há leitura. O grau é o SINAL DE
   * GRAU (U+00B0), não o ordinal masculino — este último desenha um traço sob o
   * círculo e destoa do resto do painel.
   */
  _valorSensor(e, t, i = 0) {
    const a = e && this._hass ? this._hass.states[e] : void 0, o = String(a?.state ?? "").toLowerCase();
    return !a || ["unknown", "unavailable", "none", ""].includes(o) ? "--" : `${H(a.state, i)}${t}`;
  }
  /** Roteador e hub Zigbee: "Online" quando conectado, senão o próprio estado. */
  _linhaRede(e) {
    if (!e) return "Online";
    const t = String(this._hass?.states[e]?.state ?? "Online");
    return ["on", "home", "connected", "online"].includes(t.toLowerCase()) ? "Online" : t;
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
    const e = ["DOMINGO", "SEGUNDA-FEIRA", "TERÇA-FEIRA", "QUARTA-FEIRA", "QUINTA-FEIRA", "SEXTA-FEIRA", "SÁBADO"], t = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"], i = /* @__PURE__ */ new Date();
    return `${e[i.getDay()]}, ${i.getDate()} ${t[i.getMonth()]}`;
  }
  /**
   * Abre e fecha o dock de iluminação.
   *
   * A transição do corpo é de 200 ms; a folga de 40 ms cobre o quadro em que o
   * navegador ainda está compondo. Só depois disso o corpo passa a rolar.
   */
  _alternarDock() {
    this._lightsOpen = !this._lightsOpen, this._luzesAssentadas = !1, be(k, this._timerLuzes), this._timerLuzes = U(k, () => {
      this._luzesAssentadas = this._lightsOpen, this._timerLuzes = void 0, this.requestUpdate();
    }, 240), this.requestUpdate();
  }
  _renderLightsDock() {
    const e = this._lightsOpen, t = [
      "glass-card",
      "lights-card",
      e ? "is-open" : "",
      // Só depois que a animação termina o corpo pode rolar. Ver a nota em
      // `static styles`: rolar durante a abertura é o que fazia a barra piscar
      // e as células encolherem.
      this._luzesAssentadas ? "is-settled" : ""
    ].filter(Boolean).join(" ");
    return c`
      <div class=${t}>
        <div class="lights-dock">
          <button
            type="button"
            class="lights-dock-id"
            aria-expanded=${e ? "true" : "false"}
            @click=${() => this._alternarDock()}
          >
            <span class="micro-icon tone-amber"><bruno-icon icon="mdi:lightbulb-group"></bruno-icon></span>
            <span class="module-title">Iluminação</span>
            <span class="lights-dock-chevron" aria-hidden="true">
              <bruno-icon icon="mdi:chevron-up"></bruno-icon>
            </span>
          </button>
          <div class="lights-dock-actions">
            <button type="button" class="chip-button is-active" @click=${() => this._todasAsLuzes("turn_on")}>
              Todas acesas
            </button>
            <button type="button" class="chip-button" @click=${() => this._todasAsLuzes("turn_off")}>
              Apagar todas
            </button>
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
    const e = this._luzesDaConfiguracao();
    if (!e.length) return u;
    const t = this._sub?.lightZoneLabels ?? {}, i = this._sub?.lightZoneIcons ?? {}, a = { sala: "Sala", varanda: "Varanda" }, o = { sala: "mdi:sofa-outline", varanda: "bruno:balcony" }, n = [];
    for (const d of e) n.includes(d.zone) || n.push(d.zone);
    const l = n.map((d) => {
      const m = e.filter((p) => p.zone === d);
      return {
        chave: d,
        // Sem rotulo mapeado, a chave vira o nome com inicial maiuscula: no
        // Office e na Cozinha a zona unica saia como "office" e "cozinha".
        nome: t[d] ?? a[d] ?? d.charAt(0).toUpperCase() + d.slice(1),
        icone: i[d] ?? o[d] ?? "mdi:lightbulb-group",
        luzes: m,
        acesas: m.filter((p) => this._hass?.states[p.entity]?.state === "on").length
      };
    }).filter((d) => d.luzes.length > 0), s = l.length > 1;
    return l.map((d) => {
      const m = d.luzes.length % 2 === 1;
      return c`
        <section class="light-section">
          <div class="section-head">
            <span class="zone-icon"><bruno-icon icon=${d.icone}></bruno-icon></span>
            <span class="zone-id">
              <strong>${d.nome}</strong>
              <small>${d.acesas}/${d.luzes.length} acesas</small>
            </span>
            ${s ? c`<button
                  type="button"
                  class="zone-off"
                  @click=${() => this._apagarZona(d.luzes)}
                >
                  Apagar ${d.nome.toLowerCase()}
                </button>` : u}
          </div>
          <div class="light-grid">
            ${d.luzes.map((p, h) => this._renderCelulaDeLuz(p, h, m))}
          </div>
        </section>
      `;
    });
  }
  _luzesDaConfiguracao() {
    const e = this._sub?.entities?.lights;
    return Array.isArray(e) ? e.filter((t) => !!t && typeof t == "object").filter((t) => typeof t.entity == "string" && !t.placeholder).map((t) => ({
      entity: String(t.entity),
      name: String(t.name ?? "Luz"),
      zone: String(t.zone ?? "sala"),
      icon: typeof t.iconType == "string" ? t.iconType : void 0
    })) : [];
  }
  _renderCelulaDeLuz(e, t, i) {
    const a = this._hass?.states[e.entity]?.state === "on", o = i && t === 0, n = i ? t - 1 : t, l = o ? 0 : Math.floor(n / 2) + (i ? 1 : 0), s = [
      "light-cell",
      a ? "is-on" : "",
      o ? "is-wide" : "",
      !o && l > 0 ? "has-rule-top" : "",
      !o && n % 2 === 1 ? "has-rule-left" : ""
    ].filter(Boolean).join(" ");
    return c`
      <button
        type="button"
        class=${s}
        role="switch"
        aria-checked=${a ? "true" : "false"}
        aria-label=${e.name}
        @click=${() => this._alternarLuz(e.entity)}
      >
        <span class="lc-icon">${this._iconeDaLuz(e.icon, a)}</span>
        <span class="lc-name">${e.name}</span>
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
  _iconeDaLuz(e, t) {
    const a = String(e ?? "light_flush").replace(/^mdi:/, "").replace(/[^a-z0-9_-]/gi, "") || "light_flush";
    return c`<span class="tpl-light-icon icon-${a} ${t ? "is-on" : ""}">
      <bruno-icon icon=${a}></bruno-icon>
    </span>`;
  }
  _alternarLuz(e) {
    this._hass && this._hass.callService("light", "toggle", { entity_id: e }, { entity_id: e });
  }
  _apagarZona(e) {
    if (!this._hass || !e.length) return;
    const t = e.map((i) => i.entity);
    this._hass.callService("light", "turn_off", { entity_id: t }, { entity_id: t });
  }
  _todasAsLuzes(e) {
    const t = this._room?.entities.lightGroup;
    !t || !this._hass || this._hass.callService("light", e, { entity_id: t }, { entity_id: t });
  }
  render() {
    return this._room ? c`
      <main class="room-subview">
        ${this._renderTopBand()}
        ${this._temEletrodomesticos ? this._corpoCozinha() : this._corpoPadrao()}
      </main>
    ` : u;
  }
  /**
   * Cinco cômodos: coluna esquerda (hero + linha de câmeras/hub) e coluna
   * direita (dock de luzes + A/C), dentro de `content-left` e `right-column`.
   */
  _corpoPadrao() {
    return c`
      <div class="content-left">
        ${this._renderHero()}
        <div class="cams-media-row">${this._renderCameras()} ${this._renderMediaHub()}</div>
      </div>
      <div class="right-column">${this._renderLightsDock()} ${this._renderAC()}</div>
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
    return c`
      <div class="hero-panel">
        <div class="hero-stage hero-atmosphere">
          <div class="hero-content">
            <!-- O dock de cortina aparece nos CINCO cômodos com corpo padrão,
                 mesmo onde não há entidade: nos quatro sem cortina ele renderiza
                 inerte, mostrando "Indisponível". Só a Cozinha não o tem, e ela
                 usa outro corpo. Condicioná-lo à entidade tirava o dock de
                 Office, Casal, Marina e Miguel, que o exibem hoje. -->
            <div class="curtain-dock curtain-overlay">
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
      ["cover-open", "Abrir"],
      ["cover-stop", "Parar"],
      ["cover-close", "Fechar"]
    ].map(
      ([e, t]) => c`
                      <button type="button" class="curtain-action-button" data-action=${e}>
                        <bruno-icon icon="hugeicons:curtains"></bruno-icon>
                        <span>${t}</span>
                      </button>
                    `
    )}
                </div>
              </div>
              <div class="curtain-slider-zone">
                <div class="curtain-slider-glow"></div>
                <input class="curtain-range" type="range" min="0" max="100" .value=${String(this._posicaoCortina())} />
                <!-- As marcas sao BOTOES, nao rotulos: cada uma leva a cortina
                     para aquela posicao. Como span elas mediam 17px em vez de
                     22px, e eram os 5px que faltavam na altura do dock. -->
                <div class="curtain-marks">
                  ${[0, 25, 50, 75, 100].map(
      (e) => c`
                      <button
                        type="button"
                        class="curtain-mark"
                        data-action="cover-position"
                        data-position=${100 - e}
                        data-closed=${e}
                        aria-label="${e}% fechada"
                        @click=${() => this._posicionarCortina(100 - e)}
                      >
                        ${e}%
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
    const e = this._sub?.entities?.curtain;
    return typeof e == "string" ? e : void 0;
  }
  _posicaoCortina() {
    const e = this._entidadeCortina(), i = (e && this._hass ? this._hass.states[e] : void 0)?.attributes.current_position;
    return typeof i == "number" ? i : 100;
  }
  _estadoCortina() {
    const e = this._entidadeCortina();
    if (!e) return "Indisponível";
    const t = this._hass?.states[e];
    return t ? t.state === "open" ? "Aberta" : t.state === "closed" ? "Fechada" : "Indisponível" : "Indisponível";
  }
  _percentualCortina() {
    return `- ${this._posicaoCortina()}%`;
  }
  _posicionarCortina(e) {
    const t = this._entidadeCortina();
    !t || !this._hass || this._hass.callService("cover", "set_cover_position", { entity_id: t, position: e }, { entity_id: t });
  }
  _estado(e) {
    return e && this._hass ? this._hass.states[e] : void 0;
  }
  _indisponivel(e) {
    return !e || ["unavailable", "unknown", ""].includes(String(e.state).toLowerCase());
  }
  _servico(e, t, i) {
    this._hass && this._hass.callService(e, t, i, i);
  }
  /**
   * A lista de câmeras vem da configuração gerada — `entities.cameras` —, com
   * nome, nome curto e os três interruptores de cada uma (som, movimento,
   * privacidade). Eu vinha lendo só `cameraMain`/`cameraSecondary`, que são
   * ids soltos: sem nome, sem controles, e sem a segunda câmera onde a chave
   * não existia.
   */
  _camerasConfiguradas() {
    const e = this._sub?.entities?.cameras;
    return Array.isArray(e) ? e.filter((t) => !!t && typeof t.entity == "string") : [];
  }
  /**
   * Estado vivo de uma câmera.
   *
   * A imagem sai de `entity_picture` quando o HA a publica, e cai para
   * `/api/camera_proxy/<entidade>` quando não. O último quadro conhecido fica
   * guardado: numa reconexão a imagem antiga continua na tela em vez de sumir.
   */
  _cameraViva(e) {
    const t = this._estado(e.entity), i = this._indisponivel(t), a = !i && pa.includes(String(t?.state ?? "")), o = String(t?.attributes.entity_picture ?? "");
    o && (this._ultimaImagem[e.entity] = o);
    const n = o || this._ultimaImagem[e.entity] || `/api/camera_proxy/${e.entity}`;
    return {
      ...e,
      online: a,
      indisponivel: i,
      base: n,
      // ANTERIOR (rollback 6.2B rev.2):
      //   url: this._urlsCarregadas[cam.entity] ?? comSelo(base, this._seloCameras)
      //
      // O selo aqui tornava a URL inicial ÚNICA a cada montagem — nunca reusava
      // o cache do navegador, e ainda por cima duplicava a requisição, porque o
      // motor disparava outra no mesmo instante. Sem o selo, voltar a um cômodo
      // visitado mostra o último quadro imediatamente, e o motor cuida da
      // atualização a partir daí.
      url: this._urlsCarregadas[e.entity] ?? n
    };
  }
  /** Um dos três interruptores da câmera (som, movimento, privacidade). */
  _controleCamera(e, t) {
    const i = (e?.controls ?? []).find((n) => String(n.key ?? "").toLowerCase() === t);
    if (!i?.entity) return;
    const a = this._estado(i.entity), o = this._indisponivel(a);
    return {
      ...i,
      entity: i.entity,
      ativo: !o && String(a?.state ?? "").toLowerCase() === "on",
      indisponivel: o
    };
  }
  /**
   * Um feed de câmera.
   *
   * A estrutura — moldura, imagem, placeholder e legenda — é a que o CSS gerado
   * espera. O PIP é um botão: tocá-lo promove aquela câmera ao feed principal.
   */
  _renderFeed(e, t) {
    const i = e?.shortName || e?.name || "Câmera", o = !!this._controleCamera(e, "privacy")?.ativo, n = !e || e.indisponivel, l = [
      "camera-main",
      "camera-feed",
      t ? "camera-pip-feed" : "camera-primary-feed",
      o ? "is-private" : "",
      n ? "is-unavailable" : ""
    ].filter(Boolean).join(" "), s = n ? c`<div class="camera-state-surface">
          <bruno-icon icon="mdi:video-off-outline"></bruno-icon><span>Indisponível</span>
        </div>` : o ? c`<div class="camera-state-surface">
            <bruno-icon icon="mdi:eye-off-outline"></bruno-icon><span>Modo privacidade ativo</span>
          </div>` : u, d = !!(e && !t && we(e.entity)), m = c`
      <div class="camera-row-image">
        ${d ? c`<div class="camera-live-slot" data-camera-live=${e.entity}></div>` : u}
        ${e ? c`<img
              src=${e.url}
              data-camera-src-base=${e.base}
              data-camera-entity=${e.entity}
              alt=""
              @load=${(p) => {
      const h = p.currentTarget;
      h.classList.add("is-loaded"), h.closest(".camera-main")?.classList.add("has-loaded-image"), this._marcarQuadroNaTela(e.entity);
    }}
              @error=${(p) => {
      const h = p.currentTarget;
      h.classList.remove("is-loaded"), h.closest(".camera-main")?.classList.remove("has-loaded-image"), this._socorrerCamera(e.entity);
    }}
            />` : u}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
      ${s}
      <div class="camera-row-copy"><strong>${i}</strong></div>
    `;
    return t && e ? c`<button
        type="button"
        class=${l}
        aria-label=${`Mostrar câmera ${i}`}
        @click=${() => {
      this._cameraAtiva = e.entity, this.requestUpdate();
    }}
      >
        ${m}
      </button>` : e ? c`<button
      type="button"
      class=${l}
      aria-label=${`Abrir câmera ${i} em tela cheia`}
      @click=${() => this._maisInfo(e.entity)}
    >
      ${m}
    </button>` : c`<div class=${l} aria-label=${`Câmera ${i}`}>${m}</div>`;
  }
  /** Câmeras: cabeçalho com o menu de três pontos + palco com feed e PIP. */
  _renderCameras() {
    const e = this._camerasConfiguradas().map((l) => this._cameraViva(l));
    if (!e.length)
      return c`
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
    const t = e.find((l) => l.entity === this._cameraAtiva) ?? e[0], i = e.find((l) => l.online), a = t?.online || !i ? t : i, o = e.find((l) => l.entity !== a?.entity), n = this._controlesCameraAbertos;
    return c`
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
          ${this._renderFeed(a, !1)}
          ${o ? this._renderFeed(o, !0) : u}
          ${n ? this._renderControlesCamera(a) : u}
        </div>
      </div>
    `;
  }
  _renderControlesCamera(e) {
    const t = ["sound", "motion", "privacy"].map((a) => this._controleCamera(e, a)).filter((a) => !!a);
    if (!t.length) return u;
    const i = e?.shortName || e?.name || "Câmera";
    return c`
      <div class="camera-control-strip" aria-label=${`Controles da câmera ${i}`}>
        <div class="camera-controls">
          ${t.map((a) => {
      const o = a.description || a.label || "Controle";
      return c`
              <button
                type="button"
                class="camera-control ${a.ativo ? "is-on" : ""} ${a.indisponivel ? "is-unavailable" : ""}"
                ?disabled=${a.indisponivel}
                aria-pressed=${a.ativo ? "true" : "false"}
                title=${`${o} — câmera ${i}`}
                @click=${() => this._servico("homeassistant", "toggle", { entity_id: a.entity })}
              >
                <bruno-icon icon=${a.icon ?? "mdi:toggle-switch-outline"}></bruno-icon>
                <span class="camera-control-label">${a.label || o}</span>
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
  _resolverId(e) {
    if (typeof e == "string") return e || void 0;
    if (!Array.isArray(e)) return;
    const t = e.filter((a) => typeof a == "string" && !!a);
    return t.find((a) => !this._indisponivel(this._hass?.states[a])) ?? t[0];
  }
  _idDe(e) {
    return this._resolverId(this._sub?.entities?.[e]);
  }
  _modeloTv() {
    const e = this._estado(this._idDe("tv")), t = e?.attributes ?? {}, i = e?.state ?? "off", a = ca.includes(i), o = String(t.source ?? t.app_name ?? "") || "HDMI 1", n = String(t.media_title ?? t.media_series_title ?? t.app_name ?? "");
    return {
      st: e,
      estado: i,
      ativo: a,
      fonte: o,
      titulo: n,
      volume: t.volume_level != null ? Math.round(Number(t.volume_level) * 100) : null,
      poster: String(t.entity_picture ?? t.media_image_url ?? "")
    };
  }
  _modeloSpotify() {
    const e = this._estado(this._idDe("spotify")), t = e?.attributes ?? {}, i = e?.state ?? "off", o = da.includes(i) && ft(
      e,
      this._sub?.spotifyDeviceName,
      this._estado(this._idDe("speaker"))
    ), n = String(t.media_title ?? "") || "SpotifyPlus", l = Number(t.media_duration) || 0, s = Number(t.media_position) || 0, d = Date.parse(String(t.media_position_updated_at ?? "")), m = o && i === "playing", p = m && Number.isFinite(d) ? s + (Date.now() - d) / 1e3 : s, h = l > 0 ? Math.max(0, Math.min(l, p)) : Math.max(0, p);
    return {
      st: e,
      ativo: o,
      tocando: m,
      titulo: o ? /^SpotifyPlus\s+Bruno/i.test(n) ? "SpotifyPlus" : n : "SpotifyPlus",
      artista: o ? String(t.media_artist ?? t.media_album_name ?? "") : "",
      capa: o ? String(t.entity_picture ?? t.media_image_url ?? "") : "",
      volume: t.volume_level != null ? Math.round(Number(t.volume_level) * 100) : null,
      dispositivo: this._sub?.spotifyDeviceName || String(t.source ?? "") || "SpotifyPlus",
      progresso: l > 0 ? Math.max(0, Math.min(100, h / l * 100)) : 0,
      decorrido: it(h),
      total: l > 0 ? it(l) : "--:--"
    };
  }
  _modeloPc() {
    const e = this._estado(this._idDe("pcActive"))?.state === "on", t = this._estado(this._idDe("pcSession"))?.state ?? "", i = this._estado(this._idDe("pcWindow"))?.state ?? "";
    return { ativo: e, sessao: t, janela: i };
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
  _fonteAberta(e, t) {
    const i = e.filter((o) => t[o]), a = this._midiaAtivasAntes;
    return this._midiaAtivasAntes = i, this._temPc ? (t.spotify && !a.includes("spotify") && (this._fonteMidia = "spotify"), !t.pc && this._fonteMidia === "pc" && t.spotify && (this._fonteMidia = "spotify"), e.includes(this._fonteMidia) ? this._fonteMidia : t.spotify ? "spotify" : "pc") : (i.some((o) => !a.includes(o)) && (this._fonteMidia = ""), e.includes(this._fonteMidia) ? this._fonteMidia : i[0] ?? e[0] ?? "");
  }
  /** Linha de volume — o mesmo controle nas duas fontes. */
  _linhaVolume(e, t) {
    return c`
      <div class=${e ? "mh-vol" : "mh-vol is-disabled"}>
        <bruno-icon icon="mdi:volume-medium"></bruno-icon>
        <span class="mh-vol-label">Volume ${t}%</span>
        <input
          type="range"
          min="0"
          max="100"
          value=${String(t)}
          .value=${String(t)}
          aria-label="Volume"
          ?disabled=${!e}
          @change=${(i) => {
      const a = i.currentTarget;
      e && this._servico("media_player", "volume_set", {
        entity_id: e,
        volume_level: Number(a.value) / 100
      });
    }}
        />
      </div>
    `;
  }
  /** Botão do corpo do hub. `soIcone` evita o truncamento nas fileiras de 4-5. */
  _botaoMidia(e, t, i, a = {}) {
    const o = !!(a.soIcone ?? a.mais), n = [
      "mh-btn",
      a.principal ? "is-main" : "",
      a.mais ? "is-plus" : "",
      o ? "is-icon" : ""
    ].filter(Boolean).join(" ");
    return c`
      <button
        type="button"
        class=${n}
        title=${e}
        aria-label=${e}
        ?disabled=${a.desabilitado}
        @click=${i}
      >
        <bruno-icon icon=${t}></bruno-icon>${o ? u : c`<span>${e}</span>`}
      </button>
    `;
  }
  /**
   * A arte da direita.
   *
   * Só o PNG, sobreposto — posicionado de forma absoluta pelo CSS, para nunca
   * ditar a altura da linha e empurrar os botões para fora do cartão.
   */
  _arteMidia(e, t, i, a) {
    return c`
      <div class="mh-art mh-art-${t} ${a ? "is-cover" : "is-standby"}">
        ${e ? c`<img src=${e} alt="" loading="lazy" />` : c`<bruno-icon icon=${i}></bruno-icon>`}
      </div>
    `;
  }
  _corpoTv() {
    const e = this._modeloTv(), t = this._idDe("tv"), i = this._sub?.tvStandbyImage ?? fa, o = (!(!e.titulo || /^TV (ligada|desligada)$/i.test(e.titulo) || e.titulo === e.fonte) && e.estado === "playing" ? e.titulo : "") || e.fonte;
    if (!e.ativo)
      return c`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>HDMI 1 disponível</em></div>
          <div class="mh-controls">
            ${this._botaoMidia(
        "Ligar TV",
        "mdi:power",
        () => this._servico("homeassistant", "toggle", { entity_id: t }),
        { principal: !0, desabilitado: !t }
      )}
          </div>
        </div>
        ${this._arteMidia(i, "wide", "mdi:television-classic", !1)}
      `;
    const n = Array.isArray(this._sub?.tvApps) ? this._sub.tvApps : [], l = this._appsTvAbertos && n.length ? c`<div class="mh-btn-row mh-btn-row-5">
          ${n.map(
      (s) => this._botaoMidia(s.label, "mdi:play-box-outline", () => {
        s.script && this._servico("script", "turn_on", { entity_id: s.script });
      }, { soIcone: !0, desabilitado: !s.script })
    )}
          ${this._botaoMidia("Voltar", "mdi:chevron-left", () => {
      this._appsTvAbertos = !1, this.requestUpdate();
    }, { mais: !0 })}
        </div>` : c`<div class="mh-btn-row mh-btn-row-3">
          ${this._botaoMidia("Pausar", "mdi:pause", () => this._servico("media_player", "media_play_pause", { entity_id: t }), { soIcone: !0 })}
          ${this._botaoMidia("Controle remoto", "mdi:remote-tv", () => this._abrirControleRemoto(), {
      soIcone: !0,
      desabilitado: !this._idDe("tvRemote")
    })}
          ${this._botaoMidia("Apps", "mdi:apps", () => {
      this._appsTvAbertos = !0, this.requestUpdate();
    }, { soIcone: !0, desabilitado: !n.length })}
        </div>`;
    return c`
      <div class="mh-left">
        <div class="mh-info">
          <small>Ligada</small>${o ? c`<em>${o}</em>` : u}
        </div>
        <div class="mh-controls">${this._linhaVolume(t, e.volume ?? 60)} ${l}</div>
      </div>
      ${this._arteMidia(e.poster || i, "wide", "mdi:television-classic", !!e.poster)}
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
    const e = this._idDe("tvRemote");
    if (!e) return;
    const t = (a) => ({
      action: "perform-action",
      perform_action: "button.press",
      target: { entity_id: a }
    }), i = (a, o, n) => ({
      type: "button",
      name: a,
      icon: o,
      tap_action: t(n)
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
                remote_id: e,
                media_player_id: this._idDe("tv"),
                rows: [
                  ["power", "input", "menu"],
                  ["navigation"],
                  ["back", "home", "mute"],
                  ["volume_down", "volume_up", "channel_down", "channel_up"]
                ],
                custom_actions: [
                  i("power", "mdi:power", "button.tv_sala_power"),
                  i("input", "mdi:import", "button.tv_sala_input"),
                  i("menu", "mdi:menu", "button.tv_sala_menu"),
                  {
                    type: "circlepad",
                    name: "navigation",
                    icon: "mdi:checkbox-blank-circle",
                    tap_action: t("button.tv_sala_ok"),
                    up: { icon: "mdi:chevron-up", tap_action: t("button.tv_sala_navigate_up"), hold_action: { action: "repeat" } },
                    down: { icon: "mdi:chevron-down", tap_action: t("button.tv_sala_navigate_down"), hold_action: { action: "repeat" } },
                    left: { icon: "mdi:chevron-left", tap_action: t("button.tv_sala_navigate_left"), hold_action: { action: "repeat" } },
                    right: { icon: "mdi:chevron-right", tap_action: t("button.tv_sala_navigate_right"), hold_action: { action: "repeat" } }
                  },
                  i("back", "mdi:keyboard-backspace", "button.tv_sala_back"),
                  i("home", "mdi:home", "button.tv_sala_homepage"),
                  i("mute", "mdi:volume-mute", "button.tv_sala_mute"),
                  i("volume_down", "mdi:volume-minus", "button.tv_sala_volume_down"),
                  i("volume_up", "mdi:volume-plus", "button.tv_sala_volume_up"),
                  i("channel_down", "mdi:chevron-down", "button.tv_sala_channel_down"),
                  i("channel_up", "mdi:chevron-up", "button.tv_sala_channel_up")
                ]
              }
            }
          }
        }
      })
    );
  }
  _corpoPc() {
    const e = this._modeloPc(), t = this._sub?.pcImage ?? xa, i = e.ativo ? [e.sessao, e.janela].filter((o) => o && o !== "--")[0] || "Sessão ativa" : "Pronto para ligar", a = (o) => () => {
      const n = this._idDe(o);
      n && this._servico("button", "press", { entity_id: n });
    };
    return c`
      <div class="mh-left">
        <div class="mh-info"><small>${e.ativo ? "Ligado" : "Desligado"}</small><em>${i}</em></div>
        <div class="mh-controls">
          ${e.ativo ? c`<div class="mh-btn-row mh-btn-row-5 office-pc-actions">
                ${this._botaoMidia("Sleep", "mdi:weather-night", a("pcSleep"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcSleep")
    })}
                ${this._botaoMidia("Reiniciar", "mdi:restart", a("pcRestart"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcRestart")
    })}
                ${this._botaoMidia("Desligar", "mdi:power-standby", a("pcShutdown"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcShutdown")
    })}
                ${this._botaoMidia("Bloquear", "mdi:lock-outline", a("pcLock"), {
      soIcone: !0,
      desabilitado: !this._idDe("pcLock")
    })}
                ${this._botaoMidia(
      e.sessao && e.sessao !== "--" ? e.sessao : "Sessão",
      "mdi:account-clock-outline",
      () => this._maisInfo(this._idDe("pcSession")),
      { soIcone: !0 }
    )}
              </div>` : c`<div class="mh-btn-row mh-btn-row-3">
                ${this._botaoMidia("Ligar PC", "mdi:power", a("pcPower"), {
      principal: !0,
      desabilitado: !this._idDe("pcPower")
    })}
              </div>`}
        </div>
      </div>
      ${this._arteMidia(t, "wide", "mdi:desktop-tower", !1)}
    `;
  }
  _corpoSpotify() {
    const e = this._modeloSpotify(), t = this._idDe("spotify"), i = this._sub?.spotifyStandbyImage ?? va;
    if (!e.ativo)
      return c`
        <div class="mh-left">
          <div class="mh-info"><small>Desligada</small><em>${e.dispositivo}</em></div>
          <div class="mh-controls">
            ${this._botaoMidia("Dispositivos", "mdi:speaker-wireless", () => this._abrirSpotifyPlus("devices"), {
        principal: !0,
        desabilitado: !t
      })}
          </div>
        </div>
        ${this._arteMidia(i, "square", "mdi:music-note", !1)}
      `;
    const a = this._spotifyFerramentas ? c`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia("Dispositivos", "mdi:speaker-wireless", () => this._abrirSpotifyPlus("devices"), { soIcone: !0 })}
          ${this._botaoMidia("Presets", "mdi:bookmark-music-outline", () => this._abrirSpotifyPlus("presets"), { soIcone: !0 })}
          ${this._botaoMidia("Fila", "mdi:playlist-play", () => this._abrirSpotifyPlus("queue"), { soIcone: !0 })}
          ${this._botaoMidia("Voltar", "mdi:chevron-left", () => {
      this._spotifyFerramentas = !1, this.requestUpdate();
    }, { mais: !0 })}
        </div>` : c`<div class="mh-btn-row mh-btn-row-4">
          ${this._botaoMidia("Anterior", "mdi:skip-previous", () => this._servico("media_player", "media_previous_track", { entity_id: t }), { soIcone: !0 })}
          ${this._botaoMidia(e.tocando ? "Pausar" : "Tocar", e.tocando ? "mdi:pause" : "mdi:play", () => {
      e.tocando ? this._servico("media_player", "media_pause", { entity_id: t }) : this._tocarSpotify();
    }, { soIcone: !0 })}
          ${this._botaoMidia("Próxima", "mdi:skip-next", () => this._servico("media_player", "media_next_track", { entity_id: t }), { soIcone: !0 })}
          ${this._botaoMidia("Mais", "mdi:plus", () => {
      this._spotifyFerramentas = !0, this.requestUpdate();
    }, { mais: !0 })}
        </div>`;
    return c`
      <div class="mh-left">
        <div class="mh-info">
          <small>${e.titulo}</small>${e.artista ? c`<em>${e.artista}</em>` : u}
          <div class="mh-progress-wrap" aria-label="Progresso da faixa">
            <span class="mh-progress-time">${e.decorrido}</span>
            <div class="mh-progress" aria-hidden="true"><span style=${`width:${e.progresso}%`}></span></div>
            <span class="mh-progress-time">${e.total}</span>
          </div>
        </div>
        <div class="mh-controls">${this._linhaVolume(t, e.volume ?? 66)} ${a}</div>
      </div>
      ${this._arteMidia(e.capa || i, "square", "mdi:music-note", !!e.capa)}
    `;
  }
  /**
   * Abre o SpotifyPlus Card na aba pedida.
   *
   * Mesmo evento e mesma carga da origem: `ll-custom` com `bruno_action:
   * 'spotify'` e a configuração do card. Quem monta a janela é a shell.
   */
  _abrirSpotifyPlus(e) {
    const t = this._idDe("spotify");
    t && this.dispatchEvent(
      new CustomEvent("ll-custom", {
        bubbles: !0,
        composed: !0,
        detail: {
          action: "fire-dom-event",
          bruno_action: "spotify",
          bruno_spotify_config: {
            entity: t,
            deviceDefaultId: this._sub?.spotifyDeviceName,
            mode: e
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
    const e = this._idDe("spotify");
    if (!e) return;
    const t = this._sub?.spotifyDeviceName || String(this._estado(e)?.attributes.source ?? "");
    if (t) {
      this._servico("spotifyplus", "player_transfer_playback", {
        entity_id: e,
        device_id: t,
        play: !0,
        delay: 0.75,
        force_activate_device: !0
      });
      return;
    }
    this._servico("media_player", "media_play", { entity_id: e });
  }
  _maisInfo(e) {
    e && this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId: e },
        bubbles: !0,
        composed: !0
      })
    );
  }
  /**
   * Hub de mídia: acordeão de duas fontes — TV (ou PC, no Office) e Spotify.
   *
   * Só uma fica aberta por vez, no próprio lugar da lista: a fonte nunca é
   * promovida ao topo. A entrada do PS5 vive no menu de três pontos, e só onde
   * há entidade — hoje, apenas a Sala.
   */
  _renderMediaHub() {
    const e = this._temPc, t = e ? void 0 : this._modeloTv(), i = e ? this._modeloPc() : void 0, a = this._modeloSpotify(), n = [
      e ? {
        chave: "pc",
        rotulo: "PC",
        icone: "mdi:desktop-tower",
        ativo: !!i?.ativo,
        resumo: i?.ativo ? "Ligado" : "Desligado",
        corpo: () => this._corpoPc()
      } : {
        chave: "tv",
        rotulo: this._room?.id === "sala" ? "TV da sala" : "TV",
        icone: "mdi:television-classic",
        ativo: !!t?.ativo,
        resumo: t?.ativo ? `Ligada · ${t.fonte}` : "Desligada",
        corpo: () => this._corpoTv()
      },
      {
        chave: "spotify",
        rotulo: "Spotify",
        icone: "mdi:spotify",
        ativo: a.ativo,
        resumo: a.ativo ? a.titulo : "Nenhuma faixa",
        corpo: () => this._corpoSpotify()
      }
    ], l = Object.fromEntries(n.map((p) => [p.chave, p.ativo])), s = this._fonteAberta(n.map((p) => p.chave), l), d = n.find((p) => p.chave === s)?.ativo, m = [
      "glass-card",
      "media-hub-card",
      e ? "workspace-hub-card" : "",
      "mh-accordion",
      d ? "is-playing" : "",
      this._menuMidiaAberto ? "is-menu-open" : ""
    ].filter(Boolean).join(" ");
    return c`
      <div class=${m}>
        <div class="mh-head">
          <div class="mh-head-title">
            <span class="micro-icon ${e ? "" : "tone-amber"}">
              <bruno-icon icon=${e ? "mdi:desk" : "mdi:multimedia"}></bruno-icon>
            </span>
            <div class="module-title">${e ? "Estação de Trabalho" : "Hub de Mídia"}</div>
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
        </div>
        ${this._menuMidiaAberto ? this._renderMenuMidia() : u}
        <div class="mh-sources">
          ${n.map((p) => {
      const h = p.chave === s, b = ["mh-source", h ? "is-open" : "", p.ativo ? "is-active" : ""].filter(Boolean).join(" ");
      return c`
              <div class=${b}>
                <button
                  type="button"
                  class="mh-source-head"
                  aria-expanded=${h ? "true" : "false"}
                  @click=${() => {
        this._fonteMidia = p.chave, this._menuMidiaAberto = !1, this.requestUpdate();
      }}
                >
                  <bruno-icon
                    class="mh-src-icon ${p.chave === "spotify" ? "mh-icon-spotify" : ""}"
                    icon=${p.icone}
                  ></bruno-icon>
                  <span class="mh-src-name">${p.rotulo}</span>
                  <span class="mh-src-summary">${p.resumo}</span>
                  ${h ? u : c`<bruno-icon class="mh-src-chevron" icon="mdi:chevron-right"></bruno-icon>`}
                </button>
                ${h ? c`<div class="mh-source-body">${p.corpo()}</div>` : u}
              </div>
            `;
    })}
        </div>
      </div>
    `;
  }
  /** O menu de três pontos. Só a Sala tem PS5; nos demais fica o more-info. */
  _renderMenuMidia() {
    const e = this._idDe("ps5"), i = this._estado(e)?.state === "on", a = e ? [{ icone: "mdi:sony-playstation", titulo: "PS5", sub: i ? "Online" : "Offline", entidade: e, ativo: i }] : [];
    return a.length ? c`
      <div class="mh-overflow-panel" role="menu" aria-label="Opções de mídia">
        ${a.map(
      (o) => c`
            <div class="mh-overflow-item">
              <span class="mh-overflow-icon"><bruno-icon icon=${o.icone}></bruno-icon></span>
              <span class="mh-overflow-copy"><strong>${o.titulo}</strong><small>${o.sub}</small></span>
              <button
                type="button"
                class="mh-overflow-action ${o.ativo ? "is-active" : ""}"
                title=${o.ativo ? "Desligar PS5" : "Ligar PS5"}
                aria-label=${o.ativo ? "Desligar PS5" : "Ligar PS5"}
                @click=${() => this._servico("homeassistant", "toggle", { entity_id: o.entidade })}
              >
                <bruno-icon icon="mdi:power"></bruno-icon>
              </button>
              <button
                type="button"
                class="mh-overflow-action"
                title="Detalhes"
                aria-label="Detalhes do PS5"
                @click=${() => this._maisInfo(o.entidade)}
              >
                <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>
              </button>
            </div>
          `
    )}
      </div>
    ` : u;
  }
  /**
   * Os cinco eletrodomésticos da Cozinha.
   *
   * Cada tile tem imagem, nome e o estado em texto. Só a lava-louças tem
   * entidade hoje; os demais são placeholders com `is-muted`, como no original —
   * aparecem, mas não prometem controle que não existe.
   */
  _renderEletrodomesticos() {
    const e = this._sub?.entities?.appliances;
    return Array.isArray(e) ? e.filter((t) => !!t && typeof t == "object").map((t) => {
      const i = String(t.key ?? "item").replace(/[^a-z0-9_-]/gi, "-").toLowerCase(), a = String(t.name ?? "Eletrodoméstico"), o = typeof t.image == "string" ? t.image : "", n = typeof t.entity == "string" ? t.entity : "", l = typeof t.stateEntity == "string" ? t.stateEntity : n, s = l && this._hass ? this._hass.states[l] : void 0, d = Array.isArray(t.activeStates) ? t.activeStates.map((q) => String(q).toLowerCase()) : ["on"], m = typeof t.activeAttr == "string" ? t.activeAttr : "", p = this._room?.activeSensor ? this._hass?.states[this._room.activeSensor] : void 0, h = d.includes(String(s?.state ?? "").toLowerCase()) || (m ? la(p?.attributes[m]) : !1), b = !!t.placeholder || !n, f = typeof t.moreInfoEntity == "string" ? t.moreInfoEntity : n, v = ["appliance-tile", `is-${i}`, h ? "is-on" : "", b ? "is-muted" : ""].filter(Boolean).join(" ");
      return c`
          <article class=${v}>
            <button
              type="button"
              class="appliance-main"
              aria-label=${a}
              ?disabled=${b}
              @click=${() => !b && this._alternarAparelho(n)}
            >
              <div class="appliance-visual" data-image-wrapper>
                ${o ? c`<img src=${o} alt="" loading="lazy" decoding="async" />` : u}
              </div>
              <div class="appliance-copy">
                <strong>${a}</strong>
                <small>${this._rotuloDoAparelho(t, s, h, b)}</small>
              </div>
            </button>
            <button
              type="button"
              class="mh-menu appliance-more"
              title="Mais detalhes"
              aria-label=${`Mais detalhes de ${a}`}
              ?disabled=${!f}
              @click=${() => this._maisInfo(f)}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </article>
        `;
    }) : u;
  }
  /** Rótulo de estado: os textos vêm da configuração, como no original. */
  _rotuloDoAparelho(e, t, i, a) {
    const o = (l, s) => typeof e[l] == "string" ? e[l] : s;
    if (a) return o("placeholderLabel", "Sem tomada");
    if (!t) return "Indisponível";
    if (i) return o("activeLabel", "Ligada");
    const n = String(t.state).toLowerCase();
    return n === "off" || n === "unavailable" ? o("offLabel", "Desligada") : o("idleLabel", "Ligada");
  }
  _alternarAparelho(e) {
    if (!this._hass) return;
    const t = e.split(".")[0] ?? "switch";
    this._hass.callService(t, "toggle", { entity_id: e }, { entity_id: e });
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
    const e = this._estadoClimate(), t = e?.attributes ?? {}, i = String(t.hvac_action ?? "").toLowerCase(), a = this._indisponivel(e), o = a || e?.state === "off" ? !1 : ua.includes(i) ? !0 : ha.includes(i) ? !1 : ma.includes(String(e?.state ?? "")), n = (l, s) => Number.isFinite(Number(l)) ? Number(l) : s;
    return {
      st: e,
      indisponivel: a,
      ativo: o,
      alvo: n(t.temperature, null),
      atual: n(t.current_temperature, null),
      minima: n(t.min_temp, 16),
      maxima: n(t.max_temp, 30),
      modo: e?.state ?? "off",
      ventilacao: String(t.fan_mode ?? "auto"),
      swing: String(t.swing_mode ?? ""),
      modos: Array.isArray(t.hvac_modes) ? t.hvac_modes : [],
      ventilacoes: Array.isArray(t.fan_modes) ? t.fan_modes : [],
      swings: Array.isArray(t.swing_modes) ? t.swing_modes : []
    };
  }
  _rotuloModo(e) {
    return {
      off: "Desligado",
      cool: "Frio",
      heat: "Aquecimento",
      fan_only: "Ventilar",
      dry: "Secar",
      heat_cool: "Auto",
      auto: "Auto"
    }[String(e).toLowerCase()] ?? ye(e);
  }
  _iconeModo(e) {
    return {
      off: "mdi:power",
      cool: "mdi:snowflake",
      heat: "mdi:fire",
      fan_only: "mdi:fan",
      dry: "mdi:water-percent",
      auto: "mdi:autorenew",
      heat_cool: "mdi:autorenew"
    }[String(e).toLowerCase()] ?? "mdi:thermostat";
  }
  _rotuloVentilacao(e) {
    const t = String(e).toLowerCase();
    return t === "auto" ? "Auto" : t.includes("low") || t.includes("baixo") ? "Baixa" : t.includes("med") ? "Média" : t.includes("high") || t.includes("alto") ? "Alta" : t.includes("fort") ? "Forte" : ye(e);
  }
  _iconeVentilacao(e) {
    const t = String(e).toLowerCase();
    return t.includes("auto") ? "mdi:fan-auto" : t.includes("low") || t.includes("baixo") ? "mdi:fan-speed-1" : t.includes("med") ? "mdi:fan-speed-2" : t.includes("high") || t.includes("alto") || t.includes("fort") ? "mdi:fan-speed-3" : "mdi:fan";
  }
  _rotuloSwing(e) {
    const t = String(e).toLowerCase();
    return t ? ["off", "desativado", "desativada", "disabled"].includes(t) ? "Desligado" : ["on", "ativo", "ativada", "enabled"].includes(t) ? "Ativo" : ye(e) : "Indisponível";
  }
  /**
   * O anel — gauge semicircular de 180°, do mínimo à esquerda ao máximo à
   * direita, com o alvo no arco aceso e a temperatura ambiente sob a linha.
   *
   * A geometria é a do original: centro em (360, 410), raio 285, viewBox
   * 720×460. As duas coroas de marcas (90 externas, 72 internas) e as cinco
   * legendas são calculadas, não desenhadas à mão.
   */
  _renderAnelClimate(e) {
    const s = Number.isFinite(e.minima) ? e.minima : 12, d = Number.isFinite(e.maxima) ? e.maxima : 30, m = Number.isFinite(Number(e.alvo)) ? Math.max(s, Math.min(d, Number(e.alvo))) : s + (d - s) / 2, h = -180 + 180 * Math.max(0, Math.min(1, (m - s) / Math.max(1, d - s))), b = (_, y) => {
      const $ = y * Math.PI / 180;
      return { x: 360 + _ * Math.cos($), y: 410 + _ * Math.sin($) };
    }, f = (_, y, $) => {
      const C = b(_, y), M = b(_, $), te = Math.abs($ - y) <= 180 ? "0" : "1";
      return `M ${C.x.toFixed(3)} ${C.y.toFixed(3)} A ${_} ${_} 0 ${te} 1 ${M.x.toFixed(3)} ${M.y.toFixed(3)}`;
    }, v = Array.from({ length: 91 }, (_, y) => {
      const $ = -180 + 180 * (y / 90), C = y % 15 === 0, M = y % 5 === 0, te = b(319, $), Pe = b(C ? 293 : M ? 299 : 306, $), qt = C ? "icg-tick major" : M ? "icg-tick medium" : "icg-tick minor";
      return ve`<line x1=${te.x.toFixed(3)} y1=${te.y.toFixed(3)} x2=${Pe.x.toFixed(3)} y2=${Pe.y.toFixed(3)} class=${qt}></line>`;
    }), q = Array.from({ length: 73 }, (_, y) => {
      const $ = -180 + 180 * (y / 72), C = b(267, $), M = b(251, $);
      return ve`<line x1=${C.x.toFixed(3)} y1=${C.y.toFixed(3)} x2=${M.x.toFixed(3)} y2=${M.y.toFixed(3)} class="icg-inner-tick"></line>`;
    }), g = [
      { texto: `${H(s, 0)}°`, ang: -180, r: 337, cls: "edge" },
      { texto: "10", ang: -148, r: 343, cls: "" },
      { texto: "20", ang: -90, r: 337, cls: "top" },
      { texto: "25", ang: -32, r: 343, cls: "" },
      { texto: `${H(d, 0)}°`, ang: 0, r: 337, cls: "edge" }
    ].map((_) => {
      const y = b(_.r, _.ang);
      return ve`<text x=${y.x.toFixed(3)} y=${y.y.toFixed(3)} text-anchor="middle" dominant-baseline="middle" class=${`icg-label ${_.cls}`}>${_.texto}</text>`;
    }), S = b(285, h), B = e.alvo == null ? "--" : H(e.alvo, 0), V = e.atual == null ? "--" : H(e.atual, 1), ee = (e.modo === "cool" ? "Resfriamento" : e.modo === "heat" ? "Aquecimento" : e.modo === "fan_only" ? "Ventilacao" : "Temperatura").toUpperCase();
    return c`
      <div class="icg-root">
        <div class="icg-shell">
          <svg
            class="icg-svg"
            viewBox="0 0 720 460"
            role="img"
            aria-label=${`Temperatura alvo ${B}°. Ambiente ${V}°.`}
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
            <path d=${f(285, h, 0)} class="icg-track-muted"></path>
            <path d=${f(285, -180, h)} class="icg-active-glow"></path>
            <path d=${f(285, -180, h)} class="icg-active-arc"></path>
            ${g}
            <circle cx=${S.x.toFixed(3)} cy=${S.y.toFixed(3)} r="21" class="icg-marker-glow"></circle>
            <circle cx=${S.x.toFixed(3)} cy=${S.y.toFixed(3)} r="13" class="icg-marker-ring"></circle>
            <circle
              cx=${(S.x - 4).toFixed(3)}
              cy=${(S.y - 5).toFixed(3)}
              r="4"
              class="icg-marker-highlight"
            ></circle>
            <text x=${360} y="260" text-anchor="middle" dominant-baseline="middle" class="icg-center-mode">
              ${ee}
            </text>
            <text x=${360} y="328" text-anchor="middle" dominant-baseline="middle" class="icg-center-temp">
              ${B}°
            </text>
            <text x=${360} y="382" text-anchor="middle" dominant-baseline="middle" class="icg-center-sub">
              SET TEMPERATURE
            </text>
            <line x1=${332} y1="408" x2=${388} y2="408" class="icg-center-line"></line>
            <text x=${360} y="432" text-anchor="middle" dominant-baseline="middle" class="icg-ambient">
              Ambient ${V}°
            </text>
          </svg>
        </div>
      </div>
    `;
  }
  /** A/C: cabeçalho com power, anel de temperatura e três controles na base. */
  _renderAC() {
    const e = this._entidadeClimate(), t = this._modeloClimate(), i = t.swing.toLowerCase(), a = ["on", "ativo", "ativada", "enabled"].includes(i) || i.includes("ativ") && !i.includes("desativ"), o = (m) => [...new Set(m.filter(Boolean))], n = this._painelClima, l = {
      mode: o(t.modos).map((m) => ({
        modo: m,
        rotulo: this._rotuloModo(m),
        icone: this._iconeModo(m),
        ativo: m.toLowerCase() === String(t.modo).toLowerCase(),
        servico: "set_hvac_mode",
        campo: "hvac_mode"
      })),
      fan: o(t.ventilacoes).map((m) => ({
        modo: m,
        rotulo: this._rotuloVentilacao(m),
        icone: this._iconeVentilacao(m),
        ativo: m.toLowerCase() === t.ventilacao.toLowerCase(),
        servico: "set_fan_mode",
        campo: "fan_mode"
      })),
      swing: o(t.swings).map((m) => ({
        modo: m,
        rotulo: this._rotuloSwing(m),
        icone: m.toLowerCase() === "off" ? "mdi:air-conditioner" : "mdi:swap-vertical",
        ativo: m.toLowerCase() === i,
        servico: "set_swing_mode",
        campo: "swing_mode"
      }))
    }, s = (m) => {
      if (n !== m) return u;
      const p = l[m];
      return p.length ? c`<div class="ac-popover" role="menu">
        ${p.map(
        (h) => c`
            <button
              type="button"
              class="ac-popover-option ${h.ativo ? "is-active" : ""}"
              role="menuitem"
              @click=${() => {
          this._painelClima = "", e && this._servico("climate", h.servico, { entity_id: e, [h.campo]: h.modo }), this.requestUpdate();
        }}
            >
              <bruno-icon icon=${h.icone}></bruno-icon><span>${h.rotulo}</span>
            </button>
          `
      )}
      </div>` : c`<div class="ac-popover" role="menu">
          <button type="button" class="ac-popover-option" disabled>
            <bruno-icon icon="mdi:alert-circle-outline"></bruno-icon><span>Indisponível</span>
          </button>
        </div>`;
    }, d = (m, p, h, b) => c`
      <div class="ac-control-wrap">
        <button
          type="button"
          class="ac-action ${n === m ? "is-open" : ""}"
          aria-expanded=${n === m ? "true" : "false"}
          ?disabled=${t.indisponivel || !e}
          @click=${() => {
      this._painelClima = this._painelClima === m ? "" : m, this.requestUpdate();
    }}
        >
          <span class="ac-action-icon"><bruno-icon icon=${p}></bruno-icon></span>
          <span class="ac-action-text"><small>${h}</small><strong>${b}</strong></span>
        </button>
        ${s(m)}
      </div>
    `;
    return c`
      <div class="glass-card ac-card ac-card-lean">
        <div class="ac-lean-head">
          <div class="mh-head-title ac-head-title">
            <span class="micro-icon tone-cyan"><bruno-icon icon="mdi:air-conditioner"></bruno-icon></span>
            <div class="module-title">Ar-condicionado</div>
          </div>
          <div class="ac-top-stack">
            <button
              type="button"
              class="mh-menu ac-more-button"
              title="Mais detalhes"
              aria-label="Mais detalhes"
              @click=${() => {
      this._painelClima = "", this._maisInfo(e);
    }}
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
            <button
              type="button"
              class="ac-power-floating ${t.ativo ? "is-active" : ""}"
              aria-label=${t.ativo ? "Desligar ar condicionado" : "Ligar ar condicionado"}
              ?disabled=${t.indisponivel || !e}
              @click=${() => {
      e && (this._painelClima = "", this._servico("climate", t.ativo ? "turn_off" : "turn_on", { entity_id: e }));
    }}
            >
              <bruno-icon icon="mdi:power"></bruno-icon>
            </button>
          </div>
        </div>
        <div class="ac-lean-mid">
          <div class="ac-ring">${this._renderAnelClimate(t)}</div>
        </div>
        <div class="ac-lean-foot">
          ${d(
      "mode",
      "mdi:thermostat-auto",
      "Modo",
      !t.ativo || t.modo === "off" ? "Desligado" : this._rotuloModo(t.modo)
    )}
          ${d("fan", "mdi:fan", "Ventilação", this._rotuloVentilacao(t.ventilacao))}
          ${d(
      "swing",
      "mdi:air-conditioner",
      "Swing",
      t.swing ? this._rotuloSwing(t.swing) : a ? "Ativo" : "Desligado"
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
    return c`
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
          </div>
        </div>
        <div class="appliances-grid">${this._renderEletrodomesticos()}</div>
      </div>
    `;
  }
}
customElements.get("bruno-room-subview") || customElements.define("bruno-room-subview", _a);
const de = window;
de.customCards = de.customCards ?? [];
de.customCards.some((r) => r.type === "bruno-room-subview") || de.customCards.push({
  type: "bruno-room-subview",
  name: "Bruno · Subview de cômodo",
  description: "Subview parametrizada por cômodo (arquitetura nova)."
});
class wa {
  constructor() {
    this.definicoes = /* @__PURE__ */ new Map();
  }
  registrar(e) {
    if (this.definicoes.has(e.type))
      throw new Error(`device-registry: tipo já registrado — "${e.type}"`);
    this.definicoes.set(e.type, e);
  }
  obter(e) {
    return this.definicoes.get(e);
  }
  tipos() {
    return [...this.definicoes.keys()];
  }
  /** Um tipo desconhecido não derruba o painel — vira uma entrada inerte. */
  conhece(e) {
    return this.definicoes.has(e);
  }
}
const z = new wa();
function ya(r) {
  const e = z.obter(r.type);
  if (e)
    return e.create(r);
}
function at(r) {
  return z.obter(r.type)?.entities(r) ?? [];
}
function ka(r) {
  const e = [], t = /* @__PURE__ */ new Set();
  for (const [i, a] of r.entries()) {
    const o = a.id || `posição ${i}`;
    a.id ? t.has(a.id) ? e.push(`id repetido — "${a.id}"`) : t.add(a.id) : e.push(`dispositivo em ${o}: falta "id"`), a.type ? z.conhece(a.type) || e.push(`dispositivo "${o}": tipo não registrado — "${a.type}"`) : e.push(`dispositivo "${o}": falta "type"`), a.name || e.push(`dispositivo "${o}": falta "name"`);
    const n = z.obter(a.type)?.validate?.(a);
    n && !n.ok && e.push(...n.erros);
  }
  return { ok: e.length === 0, erros: e };
}
function $t(r, e) {
  if (typeof r == "string") return r || void 0;
  if (!Array.isArray(r)) return;
  const t = r.filter((a) => typeof a == "string" && !!a);
  return t.find((a) => {
    const o = e?.states[a];
    return o && !["unavailable", "unknown", ""].includes(String(o.state).toLowerCase());
  }) ?? t[0];
}
function $a(r) {
  const e = /* @__PURE__ */ new Map();
  for (const t of r) {
    const i = t.group ?? "Casa", a = e.get(i);
    a ? a.push(t) : e.set(i, [t]);
  }
  return [...e.entries()].map(([t, i]) => ({ grupo: t, itens: i }));
}
const ot = [
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
], za = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], qa = ["on", "playing", "paused", "idle", "buffering"];
class pe extends A {
  static {
    this.properties = { _hass: { state: !0 } };
  }
  set instancia(e) {
    this._instancia = e, this.requestUpdate();
  }
  set hass(e) {
    this._hass = e, this.requestUpdate();
  }
  get _entityId() {
    return $t(this._instancia?.entity, this._hass);
  }
  _estado(e) {
    return e && this._hass ? this._hass.states[e] : void 0;
  }
  _servico(e, t, i) {
    this._hass?.callService(e, t, i, i);
  }
  static {
    this.estilosComuns = x`
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
class Sa extends pe {
  static {
    this.styles = [pe.estilosComuns];
  }
  render() {
    const e = this._entityId, t = this._estado(e);
    if (!t) return c`<p class="indisponivel">Entidade indisponível: ${e ?? "—"}</p>`;
    const i = qa.includes(String(t.state)), a = String(t.attributes.source ?? t.attributes.app_name ?? "") || "HDMI 1", o = t.attributes.volume_level != null ? Math.round(Number(t.attributes.volume_level) * 100) : null;
    return c`
      <div class="titulo">
        <strong>${this._instancia?.name ?? "TV"}</strong>
        <small>${i ? `Ligada · ${a}` : "Desligada"}</small>
      </div>

      <div class="linha">
        <button
          class=${i ? "is-on" : ""}
          @click=${() => this._servico("homeassistant", "toggle", { entity_id: e })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${i ? "Desligar" : "Ligar"}
        </button>
        <button ?disabled=${!i} @click=${() => this._servico("media_player", "media_play_pause", { entity_id: e })}>
          <bruno-icon icon="mdi:pause"></bruno-icon>Play / Pause
        </button>
      </div>

      ${i ? c`<div class="linha">
            <button @click=${() => this._servico("media_player", "volume_down", { entity_id: e })}>
              <bruno-icon icon="mdi:volume-minus"></bruno-icon>
            </button>
            <span class="valor">${o == null ? "—" : `${o}%`}</span>
            <button @click=${() => this._servico("media_player", "volume_up", { entity_id: e })}>
              <bruno-icon icon="mdi:volume-plus"></bruno-icon>
            </button>
            <button @click=${() => this._servico("media_player", "volume_mute", { entity_id: e, is_volume_muted: !t.attributes.is_volume_muted })}>
              <bruno-icon icon="mdi:volume-mute"></bruno-icon>
            </button>
          </div>` : u}

      <div class="linha">
        <button @click=${() => this._maisInfo(e)}>
          <bruno-icon icon="mdi:dots-horizontal"></bruno-icon>Mais detalhes
        </button>
      </div>
    `;
  }
  _maisInfo(e) {
    e && this.dispatchEvent(
      new CustomEvent("hass-more-info", { detail: { entityId: e }, bubbles: !0, composed: !0 })
    );
  }
}
class Aa extends pe {
  static {
    this.styles = [pe.estilosComuns];
  }
  render() {
    const e = this._entityId, t = this._estado(e);
    if (!t) return c`<p class="indisponivel">Entidade indisponível: ${e ?? "—"}</p>`;
    const i = za.includes(String(t.state)), a = Number(t.attributes.temperature), o = Number(t.attributes.current_temperature), n = Number.isFinite(Number(t.attributes.min_temp)) ? Number(t.attributes.min_temp) : 16, l = Number.isFinite(Number(t.attributes.max_temp)) ? Number(t.attributes.max_temp) : 30, s = Number(t.attributes.target_temp_step) || 1, d = Array.isArray(t.attributes.hvac_modes) ? t.attributes.hvac_modes : [], m = (p) => this._servico("climate", "set_temperature", {
      entity_id: e,
      temperature: Math.max(n, Math.min(l, p))
    });
    return c`
      <div class="titulo">
        <strong>${this._instancia?.name ?? "Ar-condicionado"}</strong>
        <small>${i ? `${this._rotulo(t.state)} · ambiente ${Number.isFinite(o) ? o : "—"}°` : "Desligado"}</small>
      </div>

      <div class="linha">
        <button
          class=${i ? "is-on" : ""}
          @click=${() => this._servico("climate", i ? "turn_off" : "turn_on", { entity_id: e })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${i ? "Desligar" : "Ligar"}
        </button>
      </div>

      <div class="linha">
        <button ?disabled=${!i} @click=${() => m((Number.isFinite(a) ? a : 22) - s)}>
          <bruno-icon icon="mdi:minus"></bruno-icon>
        </button>
        <span class="valor">${Number.isFinite(a) ? `${a}°` : "—"}</span>
        <button ?disabled=${!i} @click=${() => m((Number.isFinite(a) ? a : 22) + s)}>
          <bruno-icon icon="mdi:plus"></bruno-icon>
        </button>
      </div>

      ${d.length ? c`<div class="linha">
            ${d.map(
      (p) => c`<button
                class=${String(t.state) === p ? "is-on" : ""}
                @click=${() => this._servico("climate", "set_hvac_mode", { entity_id: e, hvac_mode: p })}
              >
                ${this._rotulo(p)}
              </button>`
    )}
          </div>` : u}
    `;
  }
  _rotulo(e) {
    return {
      off: "Desligado",
      cool: "Frio",
      heat: "Aquecimento",
      fan_only: "Ventilar",
      dry: "Secar",
      heat_cool: "Auto",
      auto: "Auto"
    }[String(e).toLowerCase()] ?? e;
  }
}
customElements.get("bruno-control-tv") || customElements.define("bruno-control-tv", Sa);
customElements.get("bruno-control-climate") || customElements.define("bruno-control-climate", Aa);
function zt(r) {
  return (e) => {
    const t = document.createElement(r);
    return t.instancia = e, t;
  };
}
z.conhece("media-tv") || z.registrar({
  type: "media-tv",
  label: "TV",
  icon: "mdi:television-classic",
  create: zt("bruno-control-tv"),
  entities: (r) => [typeof r.entity == "string" ? r.entity : r.entity?.[0] ?? ""].filter(Boolean),
  validate: (r) => ({
    ok: !!r.entity,
    erros: r.entity ? [] : [`dispositivo "${r.id}": TV exige "entity"`]
  })
});
z.conhece("climate") || z.registrar({
  type: "climate",
  label: "Ar-condicionado",
  icon: "mdi:air-conditioner",
  create: zt("bruno-control-climate"),
  entities: (r) => [typeof r.entity == "string" ? r.entity : r.entity?.[0] ?? ""].filter(Boolean),
  validate: (r) => ({
    ok: !!r.entity,
    erros: r.entity ? [] : [`dispositivo "${r.id}": clima exige "entity"`]
  })
});
const ke = "bruno-devices-panel", Ca = ["on", "playing", "paused", "idle", "buffering", "cool", "heat", "fan_only", "dry", "heat_cool", "auto"];
class Ma extends A {
  constructor() {
    super(...arguments), this._selecionado = "", this._controles = /* @__PURE__ */ new Map(), this._observador = new De(
      ot.flatMap((e) => at(e))
    ), this._motivo = "";
  }
  static {
    this.properties = {
      _selecionado: { state: !0 }
    };
  }
  set hass(e) {
    this._hass = e;
    for (const i of this._controles.values()) i.hass = e;
    const t = this._observador.mudancas(e);
    t.length !== 0 && (this._motivo = Oe(t), this.requestUpdate());
  }
  get _dispositivos() {
    return ot;
  }
  _instancia(e) {
    return this._dispositivos.find((t) => t.id === e);
  }
  /** O primeiro ativo abre por padrão; sem nenhum, o primeiro da lista. */
  get _idAberto() {
    return this._selecionado && this._instancia(this._selecionado) ? this._selecionado : this._dispositivos.find((t) => this._estaAtivo(t))?.id ?? this._dispositivos[0]?.id ?? "";
  }
  _estaAtivo(e) {
    const t = $t(e.entity, this._hass), i = t && this._hass ? this._hass.states[t] : void 0;
    return !!i && Ca.includes(String(i?.state ?? "").toLowerCase());
  }
  /**
   * O controle do dispositivo aberto.
   *
   * Criado uma vez por instância e guardado. Tipo desconhecido não some nem
   * derruba a lista: vira uma entrada inválida, com o motivo à vista.
   */
  _controleDe(e) {
    const t = this._instancia(e);
    if (!t) return u;
    if (!z.conhece(t.type))
      return c`<p class="aviso">
        Tipo de dispositivo não registrado: <code>${t.type}</code>.
        Registre o controle em <code>components/devices/controls.ts</code>.
      </p>`;
    let i = this._controles.get(e);
    if (!i) {
      const a = ya(t);
      if (!a) return u;
      i = a, this._controles.set(e, i);
    }
    return this._hass && (i.hass = this._hass), i;
  }
  connectedCallback() {
    super.connectedCallback(), ze(ke);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), qe(ke);
  }
  /** Mede o custo de cada atualizacao (Fase 6.0.1). */
  update(e) {
    const t = this._motivo;
    this._motivo = "", Se(ke, () => super.update(e), t || "outro");
  }
  render() {
    const e = ka(this._dispositivos), t = this._idAberto;
    return c`
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

        ${e.ok ? u : c`<p class="aviso">
              Configuração de dispositivos com problema:
              ${e.erros.map((i) => c`<span>${i}</span>`)}
            </p>`}

        <div class="corpo">
          <nav class="lista" aria-label="Lista de dispositivos">
            ${$a(this._dispositivos).map(
      (i) => c`
                <div class="grupo">
                  <h3>${i.grupo}</h3>
                  ${i.itens.map((a) => {
        const o = this._estaAtivo(a), n = a.id === t;
        return c`<button
                      type="button"
                      class="item ${n ? "is-selected" : ""} ${o ? "is-active" : ""}"
                      aria-pressed=${n ? "true" : "false"}
                      @click=${() => {
          this._selecionado = a.id, this.requestUpdate();
        }}
                    >
                      <span class="item-icone">
                        <bruno-icon icon=${a.icon ?? z.obter(a.type)?.icon ?? "mdi:remote"}></bruno-icon>
                      </span>
                      <span class="item-nome">${a.name}</span>
                      <span class="ponto" aria-hidden="true"></span>
                    </button>`;
      })}
                </div>
              `
    )}
          </nav>

          <section class="controle">${this._controleDe(t)}</section>
        </div>
      </div>
    `;
  }
  /** Diagnóstico: quais entidades este painel observa. Usado na Fase 6.1. */
  entidadesObservadas() {
    return [...new Set(this._dispositivos.flatMap((e) => at(e)))];
  }
  static {
    this.styles = x`
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
customElements.get("bruno-devices-panel") || customElements.define("bruno-devices-panel", Ma);
Ft();
console.info("[bruno-dashboard] build 20260809");
globalThis.BrunoCameraEngine = kt;
//# sourceMappingURL=bruno-dashboard.BEmgTkWB.js.map
