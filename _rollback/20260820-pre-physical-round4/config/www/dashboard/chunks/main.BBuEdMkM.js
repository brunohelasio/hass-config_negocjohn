const Ai = performance.timeOrigin || Date.now() - performance.now(), Oi = () => Math.round(performance.now()), ge = () => ({
  at: Date.now(),
  sinceNavigation: Oi()
}), W = {
  version: 1,
  navigationStart: Math.round(Ai),
  moduleStart: ge()
};
function Ei() {
  const o = performance.getEntriesByType("resource");
  W.resources = {
    count: o.length,
    totalDuration: Math.round(o.reduce((e, t) => e + t.duration, 0)),
    transferSize: o.reduce((e, t) => e + (t.transferSize || 0), 0)
  };
}
function je() {
  Ei();
  try {
    globalThis.localStorage?.setItem("bruno-ui:last-boot-metrics", JSON.stringify(W));
  } catch {
  }
  globalThis.brunoBootMetrics = W;
}
customElements.whenDefined("bruno-shell").then(() => {
  W.shellDefined = ge(), je();
});
const lt = () => {
  const o = document.querySelector("bruno-shell");
  o && !W.shellConnected && (W.shellConnected = ge());
  const t = o?.shadowRoot?.querySelector("#content");
  if (t?.dataset.section === "home" && t.children.length > 0) {
    W.homeVisible = ge(), je();
    return;
  }
  performance.now() < 12e4 && window.setTimeout(lt, 100);
};
document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", lt, { once: !0 }) : lt();
globalThis.addEventListener("load", () => {
  W.windowLoad = ge(), je();
}, { once: !0 });
je();
function Ae() {
  return { criados: 0, encerrados: 0 };
}
function Ci(o) {
  return {
    nome: o,
    instancias: Ae(),
    render: { total: 0, duracaoTotal: 0, ultima: 0, pior: 0 },
    motivos: /* @__PURE__ */ new Map(),
    timers: Ae(),
    listeners: Ae(),
    assinaturas: Ae(),
    requisicoes: { total: 0, falhas: 0, duracaoTotal: 0, pior: 0 }
  };
}
const Ti = 720, $i = 200, Mi = 24, Ii = 4, Vt = 3e4, Li = 12, Ke = 10 * 1024 * 1024, Ri = 64;
function Ye(o) {
  let e = Number.POSITIVE_INFINITY;
  for (const t of o) t.usado < e && (e = t.usado);
  return Number.isFinite(e) ? e : 0;
}
class Ni {
  constructor() {
    this.componentes = /* @__PURE__ */ new Map(), this.memoria = [], this.tarefas = [], this.inicio = 0, this.buildId = "desconhecido", this.tarefasTotal = 0, this.tarefasDuracao = 0, this.tarefasPior = 0, this.tarefasNaCarga = 0, this.pisoGlobal = Number.POSITIVE_INFINITY, this.picoGlobal = 0, this.valoresDeMemoria = /* @__PURE__ */ new Set();
  }
  /** Marca zero do relógio. Chamado uma vez, por quem inicia os observadores. */
  iniciar(e, t) {
    this.inicio = e, this.buildId = t;
  }
  de(e) {
    let t = this.componentes.get(e);
    return t || (t = Ci(e), this.componentes.set(e, t)), t;
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
  renderizou(e, t, a) {
    const i = this.de(e), r = i.render;
    if (r.total++, r.duracaoTotal += t, r.ultima = t, t > r.pior && (r.pior = t), !a) return;
    const n = i.motivos.has(a) || i.motivos.size < Mi ? a : "outros";
    i.motivos.set(n, (i.motivos.get(n) ?? 0) + 1);
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
  requisicao(e, t, a) {
    const i = this.de(e).requisicoes;
    i.total++, a || i.falhas++, i.duracaoTotal += t, t > i.pior && (i.pior = t);
  }
  memoriaAmostrada(e) {
    this.memoria.push(e), this.memoria.length > Ti && this.memoria.shift(), e.usado < this.pisoGlobal && (this.pisoGlobal = e.usado), e.usado > this.picoGlobal && (this.picoGlobal = e.usado), this.valoresDeMemoria.size < Ri && this.valoresDeMemoria.add(e.usado);
  }
  tarefaLonga(e) {
    this.tarefas.push(e), this.tarefas.length > $i && this.tarefas.shift(), this.tarefasTotal++, this.tarefasDuracao += e.duracao, e.duracao > this.tarefasPior && (this.tarefasPior = e.duracao), e.em < Vt && this.tarefasNaCarga++;
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
      let a = 0;
      for (const i of this.componentes.values()) a += t(i).criados - t(i).encerrados;
      return a;
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
    const e = this.memoria, t = e[0], a = e[e.length - 1], i = e.length, r = Math.max(1, Math.floor(i / 3)), n = i ? Ye(e.slice(0, r)) : 0, s = i ? Ye(e.slice(i - r)) : 0, l = s - n, c = this.valoresDeMemoria.size, p = i ? Ye(e.slice(r, i - r)) : 0, d = s - p;
    let h;
    return i < Li ? h = `Só ${i} amostra(s) — o piso ainda não significa nada.` : c < 2 ? h = `${i} amostras, mas um único valor de heap: o navegador ainda não atualizou a leitura. Sem informação — precisa de sessão longa.` : l > Ke && d > Ke ? h = `Piso subiu ${(l / 1048576).toFixed(1)} MB e AINDA sobe (${(d / 1048576).toFixed(1)} MB no último terço) — isto é retenção.` : l > Ke ? h = `Subiu ${(l / 1048576).toFixed(1)} MB desde a carga e estabilizou em ${(s / 1048576).toFixed(0)} MB — é custo de partida, não vazamento.` : h = `Piso estável em ${c} degraus — a variação do heap é coleta de lixo, não vazamento.`, {
      amostras: i,
      ...t ? { primeira: t } : {},
      ...a ? { ultima: a } : {},
      crescimento: t && a ? a.usado - t.usado : 0,
      piso: Number.isFinite(this.pisoGlobal) ? this.pisoGlobal : 0,
      pico: this.picoGlobal,
      pisoInicial: n,
      pisoFinal: s,
      crescimentoDoPiso: l,
      degraus: c,
      veredito: h
    };
  }
  leituraDeTarefas(e) {
    const t = this.tarefasTotal - this.tarefasNaCarga, a = Math.max(0, e - Vt) / 6e4;
    return {
      total: this.tarefasTotal,
      duracaoTotal: Math.round(this.tarefasDuracao),
      pior: Math.round(this.tarefasPior),
      naCarga: this.tarefasNaCarga,
      depoisDaCarga: t,
      porMinuto: a > 0 ? Number((t / a).toFixed(1)) : 0
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
    const a = [...this.componentes.values()].sort(
      (s, l) => s.nome.localeCompare(l.nome)
    ).map((s) => ({
      nome: s.nome,
      instancias: { ...s.instancias },
      vivos: s.instancias.criados - s.instancias.encerrados,
      render: { ...s.render },
      motivos: [...s.motivos.entries()].map(([l, c]) => ({ motivo: l, total: c })).sort((l, c) => c.total - l.total).slice(0, Ii),
      timers: { ...s.timers },
      listeners: { ...s.listeners },
      assinaturas: { ...s.assinaturas },
      requisicoes: { ...s.requisicoes }
    })), i = this.contagem(), r = Math.round(e - this.inicio), n = this.marca;
    return {
      formato: 2,
      build: this.buildId,
      capturadoEm: (/* @__PURE__ */ new Date()).toISOString(),
      desdeOCarregamento: r,
      componentes: a,
      memoria: this.leituraDeMemoria(),
      tarefasLongas: this.leituraDeTarefas(r),
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
const T = new Ni(), zi = 5e3, le = { timerMemoria: void 0, observador: void 0 };
function Hi() {
  const o = performance;
  if (o.memory)
    return { usado: o.memory.usedJSHeapSize, limite: o.memory.jsHeapSizeLimit };
}
function Di(o) {
  if (le.timerMemoria !== void 0 || le.observador !== void 0) return;
  T.iniciar(performance.now(), o);
  const e = () => {
    const t = Hi();
    t && T.memoriaAmostrada({ em: Math.round(performance.now()), ...t });
  };
  if (e(), le.timerMemoria = window.setInterval(e, zi), "PerformanceObserver" in window)
    try {
      const t = new PerformanceObserver((a) => {
        for (const i of a.getEntries())
          T.tarefaLonga({
            em: Math.round(i.startTime),
            duracao: Math.round(i.duration)
          });
      });
      t.observe({ entryTypes: ["longtask"] }), le.observador = t;
    } catch {
    }
}
function Pi() {
  return le.timerMemoria !== void 0;
}
const ie = /* @__PURE__ */ new Map();
function Jn(o, e, t) {
  const a = window.setInterval(e, t);
  return ie.set(a, "intervalo"), T.timerCriado(o), a;
}
function es(o, e, t) {
  const a = window.setTimeout(() => {
    ie.delete(a), T.timerEncerrado(o), e();
  }, t);
  return ie.set(a, "espera"), T.timerCriado(o), a;
}
function ts(o, e) {
  if (e === void 0) return;
  const t = ie.get(e);
  t !== void 0 && (t === "intervalo" ? window.clearInterval(e) : window.clearTimeout(e), ie.delete(e), T.timerEncerrado(o));
}
function ji() {
  return ie.size;
}
function as(o, e, t, a, i) {
  e.addEventListener(t, a, i), T.listenerCriado(o);
}
function is(o, e, t, a, i) {
  e.removeEventListener(t, a, i), T.listenerEncerrado(o);
}
function Vi(o, e, t) {
  T.requisicao(o, e, t);
}
function Za(o) {
  T.conectou(o);
}
function Ka(o) {
  T.desconectou(o);
}
function Ya(o, e, t) {
  const a = performance.now();
  try {
    return e();
  } finally {
    T.renderizou(o, performance.now() - a, t);
  }
}
function Qa() {
  return T.marcar(performance.now());
}
function Bi() {
  T.limparMarca();
}
function Ui() {
  try {
    const o = import.meta.url;
    return o.slice(o.lastIndexOf("/") + 1) || "desconhecido";
  } catch {
    return "desconhecido";
  }
}
function Le() {
  return { ...T.instantaneo(performance.now()), timersVivos: ji() };
}
function Fi() {
  if (Pi()) return;
  Di(Ui());
  const o = {
    instantaneo: Le,
    texto: () => JSON.stringify(Le(), null, 2),
    zerar: () => T.zerar(),
    marcar: Qa,
    limparMarca: Bi
  };
  globalThis.brunoRuntime = o;
}
(() => {
  const o = Object.freeze({ "candelier-02": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2 3h20M12 3v13m7.5-13v8m-15-8v8m0 0c-1.715 0-2.705 2.512-2.464 3.99c.207 1.267 4.696 1.424 4.928 0C7.205 13.512 6.215 11 4.5 11m7.5 5c-1.715 0-2.705 2.512-2.464 3.99c.207 1.267 4.696 1.424 4.928 0C14.705 18.512 13.715 16 12 16m7.5-5c-1.715 0-2.705 2.512-2.464 3.99c.207 1.267 4.696 1.424 4.928 0c.241-1.478-.749-3.99-2.464-3.99"/>', width: 24, height: 24 }, "lamp-wall-up": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 7h10M8.66 12h10.68a1.66 1.66 0 0 0 1.526-2.313l-1.827-4.263c-.504-1.175-.756-1.763-1.257-2.094S16.642 3 15.362 3h-2.724c-1.28 0-1.92 0-2.42.33c-.501.33-.753.919-1.257 2.094L7.134 9.687A1.66 1.66 0 0 0 8.66 12M3 19.667v-3.334c0-.31 0-.465.034-.592a1 1 0 0 1 .707-.707C3.868 15 4.023 15 4.333 15c.62 0 .93 0 1.185.068a2 2 0 0 1 1.414 1.414c.068.255.068.565.068 1.185v.666c0 .62 0 .93-.068 1.185a2 2 0 0 1-1.414 1.414C5.263 21 4.953 21 4.333 21c-.31 0-.465 0-.592-.034a1 1 0 0 1-.707-.707C3 20.132 3 19.977 3 19.667M7 18h1c2.829 0 4.243 0 5.121-.879C14 16.243 14 14.828 14 12"/>', width: 24, height: 24 }, "shower-head": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.132 16.654a1.544 1.544 0 0 0 1.96-.954l1.172-3.393a1.03 1.03 0 0 1 1.308-.635l.972.333c.537.185 1.122-.1 1.307-.635l2.343-6.786a1.025 1.025 0 0 0-.637-1.303a5.145 5.145 0 0 0-6.535 3.178l-2.846 8.24c-.277.803.15 1.678.956 1.955m0 0l-.735 2.13A3.46 3.46 0 0 1 3 21M18.083 5.92l2.917 1m-3.921 1.907l2.917 1.002m-3.921 1.907l2.916 1.001"/>', width: 24, height: 24 }, "alert-circle": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 8v4m.125 3.75H12m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, "arrow-data-transfer-vertical": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 19V6.659c0-1.006 0-1.51.309-1.634c.308-.125.672.23 1.398.941L19 8.211M9 5v12.341c0 1.006 0 1.51-.309 1.634c-.308.125-.672-.23-1.398-.941L5 15.789"/>', width: 24, height: 24 }, "arrow-down-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 9s-4.419 6-6 6s-6-6-6-6"/>', width: 24, height: 24 }, "arrow-left-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M15 6s-6 4.419-6 6s6 6 6 6"/>', width: 24, height: 24 }, "arrow-left-02": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M5.5 12.002H19m-8 6s-6-4.419-6-6s6-6 6-6"/>', width: 24, height: 24 }, "arrow-right-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 6s6 4.419 6 6s-6 6-6 6"/>', width: 24, height: 24 }, "arrow-up-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18 15s-4.42-6-6-6s-6 6-6 6"/>', width: 24, height: 24 }, "baby-bed-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 7v8M8 7v8m8-8v8m4 5V6a2 2 0 0 1 2-2M4 20V6a2 2 0 0 0-2-2m2 3h16M4 15h16M4 18h16"/>', width: 24, height: 24 }, "bed-double": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M22 17.5H2M22 21v-5c0-1.886 0-2.828-.586-3.414S19.886 12 18 12H6c-1.886 0-2.828 0-3.414.586S2 14.114 2 16v5"/><path d="M11 12v-1.787c0-.38-.057-.508-.35-.658C10.04 9.243 9.299 9 8.5 9s-1.54.243-2.15.555c-.293.15-.35.278-.35.658V12m12 0v-1.787c0-.38-.057-.508-.35-.658C17.04 9.243 16.299 9 15.5 9s-1.54.243-2.15.555c-.293.15-.35.278-.35.658V12"/><path d="M21 12V7.36c0-.691 0-1.037-.192-1.363s-.466-.496-1.014-.834C17.587 3.8 14.9 3 12 3s-5.587.8-7.794 2.163c-.548.338-.822.507-1.014.834S3 6.669 3 7.36V12"/></g>', width: 24, height: 24 }, "bed-single-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M22 17.5H2M22 21v-5c0-1.886 0-2.828-.586-3.414S19.886 12 18 12H6c-1.886 0-2.828 0-3.414.586S2 14.114 2 16v5"/><path d="M16 12v-1.382c0-.508-.091-.677-.56-.877C14.463 9.324 13.278 9 12 9s-2.463.324-3.44.74c-.468.2-.56.37-.56.878V12"/><path d="M20 12V7.36c0-.691 0-1.037-.17-1.363c-.172-.327-.415-.496-.902-.834A12.1 12.1 0 0 0 12 3c-2.577 0-4.966.8-6.928 2.163c-.487.338-.73.507-.901.834S4 6.669 4 7.36V12"/></g>', width: 24, height: 24 }, "bookmark-02": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 17.98V9.709c0-3.634 0-5.45 1.172-6.58S8.229 2 12 2s5.657 0 6.828 1.129C20 4.257 20 6.074 20 9.708v8.273c0 2.306 0 3.459-.773 3.871c-1.497.8-4.304-1.867-5.637-2.67c-.773-.465-1.16-.698-1.59-.698s-.817.233-1.59.698c-1.333.803-4.14 3.47-5.637 2.67C4 21.44 4 20.287 4 17.981"/>', width: 24, height: 24 }, bulb: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M5.143 14A7.8 7.8 0 0 1 4 9.919C4 5.545 7.582 2 12 2s8 3.545 8 7.919A7.8 7.8 0 0 1 18.857 14"/><path stroke-linecap="round" d="M14 10c-.613.643-1.289 1-2 1s-1.387-.357-2-1"/><path d="M7.383 17.098c-.092-.276-.138-.415-.133-.527a.6.6 0 0 1 .382-.53c.104-.041.25-.041.54-.041h7.656c.291 0 .436 0 .54.04a.6.6 0 0 1 .382.531c.005.112-.041.25-.133.527c-.17.511-.255.767-.386.974a2 2 0 0 1-1.2.869c-.238.059-.506.059-1.043.059h-3.976c-.537 0-.806 0-1.043-.06a2 2 0 0 1-1.2-.868c-.131-.207-.216-.463-.386-.974ZM15 19l-.13.647c-.14.707-.211 1.06-.37 1.34a2 2 0 0 1-1.113.912C13.082 22 12.72 22 12 22s-1.082 0-1.387-.1a2 2 0 0 1-1.113-.913c-.159-.28-.23-.633-.37-1.34L9 19"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 15.5V11"/></g>', width: 24, height: 24 }, "calendar-03": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M16 2v4M8 2v4m5-2h-2C7.229 4 5.343 4 4.172 5.172S3 8.229 3 12v2c0 3.771 0 5.657 1.172 6.828S7.229 22 11 22h2c3.771 0 5.657 0 6.828-1.172S21 17.771 21 14v-2c0-3.771 0-5.657-1.172-6.828S16.771 4 13 4M3 10h18"/><path d="M12.126 14H12m.125 4H12m-4.376-4H7.5m.125 4H7.5m9.125-4H16.5m-4.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m0 4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m-4.5-4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m0 4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m9-4a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, "camera-video": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 21.5l4-4m2 0l4 4m-5-4v5"/><path d="M2 11.875c0-2.062 0-3.094 1.025-3.734S5.7 7.5 9 7.5h1c3.3 0 4.95 0 5.975.64C17 8.782 17 9.814 17 11.876v1.25c0 2.062 0 3.094-1.025 3.734S13.3 17.5 10 17.5H9c-3.3 0-4.95 0-5.975-.64C2 16.218 2 15.186 2 13.124z"/><path stroke-linecap="round" d="m17 10.25l.126-.076c2.116-1.27 3.174-1.904 4.024-1.598c.85.307.85 1.323.85 3.355v1.138c0 2.032 0 3.048-.85 3.355s-1.908-.329-4.024-1.598L17 14.75"/><circle cx="12.5" cy="5" r="2.5"/><circle cx="7" cy="4.5" r="3"/></g>', width: 24, height: 24 }, "cctv-camera": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m8 14l-.357 1.784c-.308 1.54-.462 2.31-1.015 2.763S5.291 19 3.721 19H2m0-2v4m14.951-9.492l4.252.033a.8.8 0 0 1 .358.089a.82.82 0 0 1 .351 1.096l-2.426 4.829a.798.798 0 0 1-1.363.114L15.599 14.2m-2.581-3.735l-.056.112m2.187 4.52l2.254-4.486a2.03 2.03 0 0 0-.868-2.709L7.685 3.33a2.96 2.96 0 0 0-4.007 1.32L2.325 7.342c-.747 1.487-.164 3.306 1.302 4.064l8.849 4.572c.977.505 2.173.11 2.672-.88m-2.075-4.744a.253.253 0 0 1 .109.338a.247.247 0 0 1-.334.11a.254.254 0 0 1-.109-.338a.247.247 0 0 1 .334-.11"/>', width: 24, height: 24 }, chip: { body: '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path d="M4 12c0-3.771 0-5.657 1.172-6.828S8.229 4 12 4s5.657 0 6.828 1.172S20 8.229 20 12s0 5.657-1.172 6.828S15.771 20 12 20s-5.657 0-6.828-1.172S4 15.771 4 12Z"/><path d="M7.732 16.268C8.464 17 9.643 17 12 17c.79 0 1.447 0 2-.028L16.972 14c.028-.553.028-1.21.028-2c0-2.357 0-3.536-.732-4.268S14.357 7 12 7s-3.536 0-4.268.732S7 9.643 7 12s0 3.536.732 4.268Z"/><path stroke-linecap="round" d="M8 2v2m8-2v2m-4-2v2M8 20v2m4-2v2m4-2v2m6-6h-2M4 8H2m2 8H2m2-4H2m20-4h-2m2 4h-2"/></g>', width: 24, height: 24 }, circle: { body: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"/>', width: 24, height: 24 }, "circle-small": { body: '<circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"/>', width: 24, height: 24 }, "clock-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l2 2"/></g>', width: 24, height: 24 }, computer: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14 21h2m-2 0a1.5 1.5 0 0 1-1.5-1.5V17H12m2 4h-4m0 0H8m2 0a1.5 1.5 0 0 0 1.5-1.5V17h.5m0 0v4m4-18H8c-2.828 0-4.243 0-5.121.879C2 4.757 2 6.172 2 9v2c0 2.828 0 4.243.879 5.121C3.757 17 5.172 17 8 17h8c2.828 0 4.243 0 5.121-.879C22 15.243 22 13.828 22 11V9c0-2.828 0-4.243-.879-5.121C20.243 3 18.828 3 16 3"/>', width: 24, height: 24 }, "computer-desk-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M22 12H2m18 5h-4c-1.886 0-2.828 0-3.414-.586S12 14.886 12 13v-1m-8 0v10m16-10v10M7 6V5c0-1.414 0-2.121.44-2.56C7.878 2 8.585 2 10 2h4c1.414 0 2.121 0 2.56.44C17 2.878 17 3.585 17 5v1c0 1.414 0 2.121-.44 2.56C16.122 9 15.415 9 14 9h-4c-1.414 0-2.121 0-2.56-.44C7 8.122 7 7.415 7 6m6.5 3l.5 3m-3.5-3l-.5 3"/>', width: 24, height: 24 }, cpu: { body: '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path d="M4 12c0-3.771 0-5.657 1.172-6.828S8.229 4 12 4s5.657 0 6.828 1.172S20 8.229 20 12s0 5.657-1.172 6.828S15.771 20 12 20s-5.657 0-6.828-1.172S4 15.771 4 12Z"/><path stroke-linecap="round" d="M9.5 2v2m5-2v2m-5 16v2m5-2v2M13 9l-4 4m6 0l-2 2m9-.5h-2m-16-5H2m2 5H2m20-5h-2"/></g>', width: 24, height: 24 }, cube: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2.793 21.207c.293.293.764.293 1.707.293h10c.943 0 1.414 0 1.707-.293m-13.414 0C2.5 20.914 2.5 20.443 2.5 19.5v-10c0-.943 0-1.414.293-1.707m0 13.414l6-6m7.414 6c.293-.293.293-.764.293-1.707v-10c0-.943 0-1.414-.293-1.707m0 13.414l5-5c.293-.293.293-.764.293-1.707v-10c0-.943 0-1.414-.293-1.707m-5 5C15.914 7.5 15.443 7.5 14.5 7.5h-10c-.943 0-1.414 0-1.707.293m13.414 0l5-5m-18.414 5l5-5C8.086 2.5 8.557 2.5 9.5 2.5h10c.943 0 1.414 0 1.707.293M8.793 15.207c.293.293.764.293 1.707.293H14m-5.207-.293C8.5 14.914 8.5 14.443 8.5 13.5v-3"/>', width: 24, height: 24 }, curtains: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M22 3H2m3 11c.598-.707 1.767-2.606 2-5m12 5c-.599-.707-1.767-2.606-2-5M3 3v11.625m0 0v2.125c0 2.003 0 3.005.586 3.628C4.172 21 5.114 21 7 21h1c0-1.469-.4-4.922-2-6.985m-3 .61c1.148-.077 2.141-.29 3-.61m0 0c3.88-1.44 6-6.8 6-11.015m9 0v11.625m0 0v2.125c0 2.003 0 3.005-.586 3.628C19.828 21 18.886 21 17 21h-1c0-1.469.4-4.922 2-6.985m3 .61c-1.148-.077-2.141-.29-3-.61m0 0c-3.88-1.44-6-6.8-6-11.015"/>', width: 24, height: 24 }, database: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><ellipse cx="12" cy="5" rx="8" ry="3"/><path stroke-linecap="round" d="M7 10.842c.602.18 1.274.33 2 .44"/><path d="M20 12c0 1.657-3.582 3-8 3s-8-1.343-8-3"/><path stroke-linecap="round" d="M7 17.842c.602.18 1.274.33 2 .44"/><path d="M20 5v14c0 1.657-3.582 3-8 3s-8-1.343-8-3V5"/></g>', width: 24, height: 24 }, desk: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5" d="M3 8h18v4c0 2.357 0 3.536-.732 4.268C19.535 17 18.357 17 16 17H8c-2.357 0-3.536 0-4.268-.732S3 14.357 3 12zm4-2c0-1.886 0-2.828.586-3.414S9.114 2 11 2h2c1.886 0 2.828 0 3.414.586S17 4.114 17 6v2H7zM5 17v5m14-5v5M8 17v3m8-3v3M2 8h1.818m16.364 0H22"/>', width: 24, height: 24 }, "dish-washer": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M14.5 2.5h-5c-3.3 0-4.95 0-5.975 1.025S2.5 6.2 2.5 9.5v5c0 3.3 0 4.95 1.025 5.975S6.2 21.5 9.5 21.5h5c3.3 0 4.95 0 5.975-1.025S21.5 17.8 21.5 14.5v-5c0-3.3 0-4.95-1.025-5.975S17.8 2.5 14.5 2.5m-12 6h19M6 5.5h4"/><path d="M14.5 18.5a3.5 3.5 0 1 0 0-7a3.5 3.5 0 0 0 0 7"/><path d="M12 12.55a3.5 3.5 0 1 0 0 4.899M18.125 5.5H18m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, "electric-home-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M20 8.585v4.916c0 3.77 0 5.656-1.172 6.828c-.808.808-1.956 1.059-3.828 1.136M4 8.585v4.916c0 3.77 0 5.656 1.172 6.828c1.063 1.063 2.714 1.162 5.828 1.17a1 1 0 0 0 1-.998v-3"/><path d="m22 10.5l-4.343-4.164C14.99 3.779 13.657 2.5 12 2.5S9.01 3.78 6.343 6.336L2 10.5M14.001 9v2.5m-4 0V9m-1.495 3.38c-.04-.475.37-.88.89-.88h5.214c.52 0 .93.405.89.88l-.107 1.298a5.16 5.16 0 0 1-.98 2.61l-.35.483c-.331.455-.889.73-1.486.73h-1.148c-.597 0-1.155-.275-1.486-.73l-.35-.483a5.16 5.16 0 0 1-.98-2.61z"/></g>', width: 24, height: 24 }, eye: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M2 8s4.477-5 10-5s10 5 10 5"/><path d="M21.544 13.045c.304.426.456.64.456.955c0 .316-.152.529-.456.955C20.178 16.871 16.689 21 12 21c-4.69 0-8.178-4.13-9.544-6.045C2.152 14.529 2 14.315 2 14c0-.316.152-.529.456-.955C3.822 11.129 7.311 7 12 7c4.69 0 8.178 4.13 9.544 6.045Z"/><path d="M15 14a3 3 0 1 0-6 0a3 3 0 0 0 6 0Z"/></g>', width: 24, height: 24 }, "fan-01": { body: '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path d="M9.263 12.246c-2.07-.191-4.623-.123-6.027.688l-.148.086c-.46.265-.8.703-.83 1.233c-.043.795.05 2.073.813 3.395c1.354 2.345 3.704 3.423 4.699 3.791c.296.11.62.066.893-.091c.503-.29.717-.902.584-1.468c-.37-1.58-.454-3.85.732-5.615a2.5 2.5 0 0 1-.716-2.02Zm4.898.918a2.5 2.5 0 0 1-1.29 1.572c.868 1.904 2.219 4.123 3.64 4.943l.148.086c.46.265 1.01.34 1.483.1a6.13 6.13 0 0 0 2.534-2.4c1.354-2.345 1.113-4.92.934-5.965a1.05 1.05 0 0 0-.526-.727c-.503-.291-1.139-.17-1.563.227c-1.208 1.134-3.187 2.368-5.36 2.164Zm-2.989-3.096a2.5 2.5 0 0 1 2.16.497C14.532 8.867 15.75 6.622 15.75 5v-.17c0-.53-.21-1.044-.654-1.334A6.13 6.13 0 0 0 11.75 2.5c-2.708 0-4.817 1.497-5.633 2.174a1.05 1.05 0 0 0-.367.82c0 .58.422 1.07.979 1.239c1.525.46 3.486 1.492 4.443 3.335Z"/><path d="M14.25 12.5a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z"/></g>', width: 24, height: 24 }, "fan-02": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linejoin="round" d="M9.58 12.629A5.05 5.05 0 0 0 7 17.042a5.04 5.04 0 0 0 3.053 4.645c.701.3 1.052.45 1.5.15s.447-.79.447-1.77V14.5a2.5 2.5 0 0 1-2.42-1.871ZM9.5 12H3.933c-.98 0-1.47 0-1.77-.448c-.3-.447-.15-.798.15-1.5A5.04 5.04 0 0 1 6.958 7c1.9 0 3.553 1.041 4.413 2.58A2.5 2.5 0 0 0 9.5 12ZM12 9.5V3.933c0-.98 0-1.47.448-1.77c.447-.3.798-.15 1.5.15A5.04 5.04 0 0 1 17 6.958c0 1.9-1.041 3.553-2.58 4.413A2.5 2.5 0 0 0 12 9.5Zm.629 4.92A2.5 2.5 0 0 0 14.5 12h5.567c.98 0 1.47 0 1.77.448c.3.447.15.798-.15 1.5A5.04 5.04 0 0 1 17.042 17a5.05 5.05 0 0 1-4.413-2.58Z"/><path d="M14.5 12a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z"/></g>', width: 24, height: 24 }, "fast-wind": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M2 5.941c3.5 3.432 8.576 1.961 9.732 0c.17-.288.268-.623.268-.98C12 3.878 11.105 3 10 3s-2 .878-2 1.961m9 3.967C17 7.311 18.12 6 19.5 6S22 7.311 22 8.928a3.23 3.23 0 0 1-.585 1.883C19.346 14.191 9.276 12.916 4 11.856m9.085 8.031c.206.649.762 1.113 1.415 1.113c.828 0 1.5-.747 1.5-1.669c0-.313-.078-.607-.213-.857C14.5 15.992 8 14.324 2 18.774"/><path stroke-linejoin="round" d="M19 15.5h2"/></g>', width: 24, height: 24 }, favourite: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M10.41 19.968C7.59 17.858 2 13.035 2 8.694C2 5.826 4.105 3.5 7 3.5c1.5 0 3 .5 5 2.5c2-2 3.5-2.5 5-2.5c2.895 0 5 2.326 5 5.194c0 4.34-5.59 9.164-8.41 11.274c-.95.71-2.23.71-3.18 0"/>', width: 24, height: 24 }, "file-import": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M20 15.006V10.66c0-.818 0-1.227-.152-1.595s-.441-.657-1.02-1.235l-4.736-4.739c-.499-.499-.748-.748-1.058-.896a2 2 0 0 0-.197-.082C12.514 2 12.161 2 11.456 2c-3.245 0-4.868 0-5.967.886a4 4 0 0 0-.603.604C4 4.59 4 6.213 4 9.46v4.545c0 3.773 0 5.66 1.172 6.832C6.115 21.78 7.52 21.964 10 22m3-19.5V3c0 2.83 0 4.245.879 5.124c.878.879 2.293.879 5.121.879h.5"/><path d="M15 22c-.607-.59-3-2.16-3-3s2.393-2.41 3-3m-2 3h7"/></g>', width: 24, height: 24 }, "film-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12Z"/><path stroke-linejoin="round" d="M2.5 7h19m-19 10h19"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 17V7M8 7V3m8 4V3M8 21v-4m8 4v-4"/></g>', width: 24, height: 24 }, fire: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M13.856 22c12.222-3 5.378-15-2.933-20c-.978 3.5-2.445 4.5-5.378 8c-3.884 4.634-1.955 10 3.422 12c-.815-1-2.917-3.1-1.467-6c.5-1 1.5-2 1-4c.978.5 3 1 3.5 3.5c.815-1 1.66-3.1.878-5.5c6.122 4.5 3.622 9 .978 12"/>', width: 24, height: 24 }, flash: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5.226 11.33l6.998-8.983c.547-.703 1.573-.266 1.573.67V9.97c0 .56.402 1.015.899 1.015H18.1c.773 0 1.185 1.03.674 1.686l-6.998 8.983c-.547.702-1.573.265-1.573-.671V14.03c0-.56-.403-1.015-.899-1.015H5.9c-.773 0-1.185-1.03-.674-1.686"/>', width: 24, height: 24 }, "game-controller-03": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round"><path stroke-linejoin="round" stroke-width="1.5" d="M2.008 15.81c.223-3.494.88-6.05 1.435-7.535c.281-.75.885-1.308 1.658-1.495c4.3-1.04 9.498-1.04 13.798 0c.773.187 1.377.745 1.658 1.495c.556 1.485 1.212 4.041 1.435 7.534c.133 2.09-1.377 3.241-3.05 4.083c-1.064.537-1.883-1.046-2.427-2.272a1.82 1.82 0 0 0-1.687-1.084H9.172c-.739 0-1.39.415-1.687 1.084c-.544 1.226-1.363 2.809-2.428 2.272c-1.655-.833-3.183-1.976-3.049-4.083M5 4.5L6.963 4M19 4.5L17 4"/><path stroke-width="1.5" d="m9 13l-1.5-1.5m0 0L6 10m1.5 1.5L6 13m1.5-1.5L9 10"/><path stroke-linejoin="round" stroke-width="2" d="M15.988 10h.01m1.99 3h.01"/></g>', width: 24, height: 24 }, "grid-view": { body: '<path fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5" d="M3.889 9.663C4.393 10 5.096 10 6.5 10s2.107 0 2.611-.337a2 2 0 0 0 .552-.552C10 8.607 10 7.904 10 6.5s0-2.107-.337-2.611a2 2 0 0 0-.552-.552C8.607 3 7.904 3 6.5 3s-2.107 0-2.611.337a2 2 0 0 0-.552.552C3 4.393 3 5.096 3 6.5s0 2.107.337 2.611a2 2 0 0 0 .552.552Zm11 0C15.393 10 16.096 10 17.5 10s2.107 0 2.611-.337a2 2 0 0 0 .552-.552C21 8.607 21 7.904 21 6.5s0-2.107-.337-2.611a2 2 0 0 0-.552-.552C19.607 3 18.904 3 17.5 3s-2.107 0-2.611.337a2 2 0 0 0-.552.552C14 4.393 14 5.096 14 6.5s0 2.107.337 2.611a2 2 0 0 0 .552.552Zm-11 11C4.393 21 5.096 21 6.5 21s2.107 0 2.611-.337a2 2 0 0 0 .552-.552C10 19.607 10 18.904 10 17.5s0-2.107-.337-2.611a2 2 0 0 0-.552-.552C8.607 14 7.904 14 6.5 14s-2.107 0-2.611.337a2 2 0 0 0-.552.552C3 15.393 3 16.096 3 17.5s0 2.107.337 2.611a2 2 0 0 0 .552.552Zm11 0C15.393 21 16.096 21 17.5 21s2.107 0 2.611-.337c.218-.146.406-.334.552-.552C21 19.607 21 18.904 21 17.5s0-2.107-.337-2.611a2 2 0 0 0-.552-.552C19.607 14 18.904 14 17.5 14s-2.107 0-2.611.337a2 2 0 0 0-.552.552C14 15.393 14 16.096 14 17.5s0 2.107.337 2.611c.146.218.334.406.552.552Z"/>', width: 24, height: 24 }, "home-03": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 11.99v2.51c0 3.3 0 4.95 1.025 5.975S6.7 21.5 10 21.5h4c3.3 0 4.95 0 5.975-1.025S21 17.8 21 14.5v-2.51c0-1.682 0-2.522-.356-3.25s-1.02-1.244-2.346-2.276l-2-1.555C14.233 3.303 13.2 2.5 12 2.5s-2.233.803-4.298 2.409l-2 1.555C4.375 7.496 3.712 8.012 3.356 8.74S3 10.308 3 11.99"/><path d="M15 21.5v-5c0-1.414 0-2.121-.44-2.56c-.439-.44-1.146-.44-2.56-.44s-2.121 0-2.56.44C9 14.378 9 15.085 9 16.5v5"/></g>', width: 24, height: 24 }, humidity: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 13.678c0-4.184 3.58-8.319 6.094-10.706a3.463 3.463 0 0 1 4.812 0C16.919 5.36 20.5 9.494 20.5 13.678C20.5 17.78 17.281 22 12 22s-8.5-4.22-8.5-8.322Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M4 12.284c1.465-.454 4.392-.6 7.984 1.418c3.586 2.014 6.532 1.296 8.016.433"/></g>', width: 24, height: 24 }, "image-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="7.5" cy="7.5" r="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M2.5 12c0-4.478 0-6.718 1.391-8.109S7.521 2.5 12 2.5c4.478 0 6.718 0 8.109 1.391S21.5 7.521 21.5 12c0 4.478 0 6.718-1.391 8.109S16.479 21.5 12 21.5c-4.478 0-6.718 0-8.109-1.391S2.5 16.479 2.5 12Z"/><path d="M5 21c4.372-5.225 9.274-12.116 16.498-7.458"/></g>', width: 24, height: 24 }, internet: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4" ry="10"/><path stroke-linecap="round" stroke-linejoin="round" d="M2 12h20"/></g>', width: 24, height: 24 }, "kitchen-utensils": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M11.983 14V3m0 11c-1.658 0-3.003 1.435-3.003 2.625c0 1.75 1.345 4.375 3.003 4.375s3.003-2.625 3.003-4.375c0-1.19-1.345-2.625-3.003-2.625Zm-7.005-3.972V21M3.686 3.13l-.783.078a1 1 0 0 0-.89 1.148l.67 4.315c.113.731.743 1.34 1.483 1.34H5.79c.74 0 1.37-.609 1.484-1.34l.669-4.315a1 1 0 0 0-.89-1.148l-.78-.078a13 13 0 0 0-2.587 0Z"/><path stroke-linejoin="round" d="M17.996 13.818V3.026c1.159.32 3.085 1.527 3.405 4.502l.573 4.514c.1.793-.101 1.584-.89 1.72c-.66.113-1.661.15-3.088.056m0 0V21"/></g>', width: 24, height: 24 }, "lamp-01": { body: '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path d="M12 7a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6Zm-3 6a3 3 0 1 0 6 0"/><path stroke-linecap="round" d="M5 13h14m-7-6V2m0 18v2m3-3l2 1.5M9 19l-2 1.5"/></g>', width: 24, height: 24 }, "lamp-04": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 19a1.5 1.5 0 1 0 0-3a1.5 1.5 0 0 0 0 3Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M12 16v-4m0 10v-3m-4 3h8m-.974-10H8.974c-2.212 0-3.318 0-3.787-.685c-.469-.686-.015-1.64.893-3.546l1.623-3.41c.546-1.145.818-1.718 1.342-2.038C9.57 2 10.234 2 11.562 2h.876c1.328 0 1.992 0 2.516.32c.525.321.797.894 1.343 2.039l1.623 3.41c.908 1.907 1.362 2.86.893 3.546S17.238 12 15.026 12"/></g>', width: 24, height: 24 }, laptop: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.5 16.5v-8c0-2.357 0-3.536-.732-4.268C19.035 3.5 17.857 3.5 15.5 3.5h-7c-2.357 0-3.536 0-4.268.732S3.5 6.143 3.5 8.5v8m18.484 4H2.016c-.383 0-.632-.391-.461-.724L3.5 16.5h17l1.945 3.276a.5.5 0 0 1-.46.724"/>', width: 24, height: 24 }, "lightbulb-off": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M5.143 14A7.8 7.8 0 0 1 4 9.919c0-1.672.524-3.223 1.417-4.502m2.62-2.38A8 8 0 0 1 12 2c4.418 0 8 3.545 8 7.919c0 1.456-.397 2.82-1.09 3.992M16 16H7l.544 1.633A2 2 0 0 0 9.442 19h5.117a2 2 0 0 0 1.897-1.367l.294-.883"/><path d="m15 19l-.544 1.633A2 2 0 0 1 12.559 22h-1.117a2 2 0 0 1-1.898-1.367L9 19m3-3.5V12M2 2l20 20"/></g>', width: 24, height: 24 }, "list-restart": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M3 4.5h18m-18 7h5m-5 7h5m4.758-1a4.5 4.5 0 1 0-.193-4.685M12 9.5v1c0 1.414 0 2.121.44 2.56c.439.44 1.146.44 2.56.44h1"/>', width: 24, height: 24 }, "location-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13.618 21.367A2.37 2.37 0 0 1 12 22a2.37 2.37 0 0 1-1.617-.633C6.412 17.626 1.09 13.447 3.685 7.38C5.09 4.1 8.458 2 12.001 2s6.912 2.1 8.315 5.38c2.592 6.06-2.717 10.259-6.698 13.987Z"/><path d="M15.5 11a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z"/></g>', width: 24, height: 24 }, "location-03": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.5 9a2.5 2.5 0 1 1-5 0a2.5 2.5 0 0 1 5 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M18.222 17c1.395 1.988 2.062 3.047 1.665 3.9q-.06.128-.14.247c-.575.853-2.06.853-5.03.853H9.283c-2.97 0-4.454 0-5.029-.853a2 2 0 0 1-.14-.247c-.397-.852.27-1.912 1.665-3.9"/><path d="M13.257 17.494a1.813 1.813 0 0 1-2.514 0c-3.089-2.993-7.228-6.336-5.21-11.19C6.626 3.679 9.246 2 12 2s5.375 1.68 6.467 4.304c2.016 4.847-2.113 8.207-5.21 11.19Z"/></g>', width: 24, height: 24 }, lock: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12c0 5.523-4.477 10-10 10S2 17.523 2 12S6.477 2 12 2s10 4.477 10 10Z"/><path stroke-linecap="round" d="M12 13a2 2 0 1 0 0-4a2 2 0 0 0 0 4Zm0 0v3"/></g>', width: 24, height: 24 }, maps: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5.253 4.196l-1.227.712c-.989.573-1.483.86-1.754 1.337C2 6.722 2 7.302 2 8.464v8.164c0 1.526 0 2.29.342 2.714c.228.282.547.472.9.535c.53.095 1.18-.282 2.478-1.035c.882-.511 1.73-1.043 2.785-.898c.48.065.937.293 1.853.748l3.813 1.896c.825.41.833.412 1.75.412H18c1.886 0 2.828 0 3.414-.599c.586-.598.586-1.562.586-3.49v-6.74c0-1.927 0-2.89-.586-3.49c-.586-.598-1.528-.598-3.414-.598h-2.079c-.917 0-.925-.002-1.75-.412L10.84 4.015C9.449 3.323 8.753 2.977 8.012 3S6.6 3.415 5.253 4.196M8 3v14.5m7-11v14"/>', width: 24, height: 24 }, "maps-location-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" stroke-linejoin="round" d="M22 10v-.783c0-1.94 0-2.909-.586-3.512c-.586-.602-1.528-.602-3.414-.602h-2.079c-.917 0-.925-.002-1.75-.415L10.84 3.021c-1.391-.696-2.087-1.044-2.828-1.02S6.6 2.418 5.253 3.204l-1.227.716c-.989.577-1.483.866-1.754 1.346C2 5.746 2 6.33 2 7.499v8.217c0 1.535 0 2.303.342 2.73c.228.285.547.476.9.54c.53.095 1.18-.284 2.478-1.042c.882-.515 1.73-1.05 2.785-.905c.884.122 1.705.68 2.495 1.075"/><path stroke-linejoin="round" d="M8 2v15"/><path stroke-linecap="round" stroke-linejoin="round" d="M15 5v4.5"/><path d="M18.308 21.684A1.18 1.18 0 0 1 17.5 22c-.302 0-.591-.113-.808-.317c-1.986-1.87-4.646-3.96-3.349-6.993C14.045 13.05 15.73 12 17.5 12s3.456 1.05 4.157 2.69c1.296 3.03-1.358 5.13-3.349 6.993Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M17.625 16.5H17.5m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, "menu-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 5h16M4 12h16M4 19h16"/>', width: 24, height: 24 }, "mic-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 7v4a5 5 0 0 1-10 0V7a5 5 0 0 1 10 0Z"/><path stroke-linecap="round" d="M17 7h-3m3 4h-3m6 0a8 8 0 0 1-8 8m0 0a8 8 0 0 1-8-8m8 8v3m0 0h3m-3 0H9"/></g>', width: 24, height: 24 }, "moon-02": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M21.5 14.078A8.557 8.557 0 0 1 9.922 2.5C5.668 3.497 2.5 7.315 2.5 11.873a9.627 9.627 0 0 0 9.627 9.627c4.558 0 8.376-3.168 9.373-7.422"/>', width: 24, height: 24 }, "more-horizontal": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M6.004 12.5V12m12 .5V12m-6 .5V12m-5 .5a1 1 0 1 0-2 0a1 1 0 0 0 2 0m12 0a1 1 0 1 0-2 0a1 1 0 0 0 2 0m-6 0a1 1 0 1 0-2 0a1 1 0 0 0 2 0"/>', width: 24, height: 24 }, "more-horizontal-circle-01": { body: '<path fill="none" stroke="currentColor" stroke-width="1.5" d="M21 12a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0Zm-7.5 0a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0ZM6 12a1.5 1.5 0 1 0-3 0a1.5 1.5 0 0 0 3 0Z"/>', width: 24, height: 24 }, "more-vertical": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M11.997 12.5V12m0-5.5V6m0 12.5V18m1-5.5a1 1 0 1 0-2 0a1 1 0 0 0 2 0m0-6a1 1 0 1 0-2 0a1 1 0 0 0 2 0m0 12a1 1 0 1 0-2 0a1 1 0 0 0 2 0"/>', width: 24, height: 24 }, "motion-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M4.513 12c-.401-.058-.72-.156-1-.317a3 3 0 0 1-1.108-1.108C2 9.873 2 8.93 2 7.044s0-2.829.405-3.53c.266-.46.648-.843 1.108-1.109C4.215 2 5.158 2 7.044 2s2.829 0 3.53.405c.46.266.843.648 1.109 1.108c.161.28.259.599.317 1"/><path stroke-linecap="round" d="M9.522 17c-.406-.058-.727-.156-1.009-.319a3 3 0 0 1-1.108-1.107C7 14.87 7 13.929 7 12.044c0-1.886 0-2.829.405-3.531c.266-.46.648-.842 1.108-1.108C9.215 7 10.158 7 12.043 7c1.886 0 2.829 0 3.53.405c.46.266.843.648 1.108 1.108c.163.282.26.603.319 1.009"/><path d="M12 17c0-1.87 0-2.804.402-3.5a3 3 0 0 1 1.098-1.098C14.196 12 15.13 12 17 12s2.804 0 3.5.402a3 3 0 0 1 1.098 1.098C22 14.196 22 15.13 22 17s0 2.804-.402 3.5a3 3 0 0 1-1.098 1.098C19.804 22 18.87 22 17 22s-2.804 0-3.5-.402a3 3 0 0 1-1.098-1.098C12 19.804 12 18.87 12 17Z"/></g>', width: 24, height: 24 }, "music-note-03": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="6.5" cy="18.5" r="3.5"/><circle cx="18" cy="16" r="3"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 18.5V7c0-.923 0-1.385.264-1.672c.263-.287.754-.329 1.735-.413c4.023-.343 6.91-1.655 8.356-2.505c.296-.174.444-.26.544-.203s.101.225.101.559V16"/><path stroke-linecap="round" stroke-linejoin="round" d="M10 10c5.867 0 9.778-2.333 11-3"/></g>', width: 24, height: 24 }, next: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linejoin="round" d="M15.935 12.626c-.254 1.211-1.608 2.082-4.315 3.822c-2.945 1.893-4.417 2.84-5.61 2.475a2.8 2.8 0 0 1-1.088-.635C4 17.418 4 15.612 4 12s0-5.418.922-6.288a2.8 2.8 0 0 1 1.089-.635c1.192-.365 2.664.582 5.609 2.475c2.707 1.74 4.06 2.61 4.315 3.822c.087.412.087.84 0 1.252Z"/><path stroke-linecap="round" d="M20 5v14"/></g>', width: 24, height: 24 }, noodles: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M18 12a2.5 2.5 0 0 0-5 0"/><path stroke-linecap="round" stroke-linejoin="round" d="M6 3v9m2.5-9.5v5M11 2v5.5m-7-3l2-.312M20 2l-6.5 1.016M4 7l2-.125M20 6l-6.5.406"/><path stroke-linejoin="round" d="M4.911 12H19.09c1.602 0 2.19.37 1.79 1.982c-.706 2.843-2.703 3.549-4.549 5.404c-.448.45.25 1.117.25 1.613c0 .934-.887 1.001-1.595 1.001h-5.97c-.708 0-1.596-.067-1.595-1c0-.486.677-1.184.25-1.614c-1.846-1.855-3.843-2.561-4.549-5.404c-.4-1.611.188-1.982 1.79-1.982Z"/></g>', width: 24, height: 24 }, oven: { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 16V8c0-2.828 0-4.243.879-5.121C4.757 2 6.172 2 9 2h6c2.828 0 4.243 0 5.121.879C21 3.757 21 5.172 21 8v8c0 2.828 0 4.243-.879 5.121C19.243 22 17.828 22 15 22H9c-2.828 0-4.243 0-5.121-.879C3 20.243 3 18.828 3 16"/><path d="M6 16v-5c0-1.414 0-2.121.44-2.56C6.878 8 7.585 8 9 8h6c1.414 0 2.121 0 2.56.44c.44.439.44 1.146.44 2.56v5c0 1.414 0 2.121-.44 2.56c-.439.44-1.146.44-2.56.44H9c-1.414 0-2.121 0-2.56-.44C6 18.122 6 17.415 6 16m3-5h6m-2.95-5.998H12m.1 0a.1.1 0 1 1-.2 0a.1.1 0 0 1 .2 0m3.95 0H16m.1 0a.1.1 0 1 1-.2 0a.1.1 0 0 1 .2 0m-8.05 0H8m.1 0a.1.1 0 1 1-.2 0a.1.1 0 0 1 .2 0"/></g>', width: 24, height: 24 }, "paint-board": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12s4.477 10 10 10c.842 0 2 .116 2-1c0-.609-.317-1.079-.631-1.546c-.46-.683-.917-1.359-.369-2.454c.667-1.333 1.778-1.333 3.482-1.333c.851 0 1.851 0 3.018-.167c2.101-.3 2.5-1.592 2.5-3.5Z"/><circle cx="9.5" cy="8.5" r="1.5"/><circle cx="16.5" cy="9.5" r="1.5"/><path stroke-linecap="round" stroke-linejoin="round" d="M7.125 15H7m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, "playlist-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 15c0-2.809 0-4.213.674-5.222a4 4 0 0 1 1.104-1.104C5.787 8 7.19 8 10 8h4c2.809 0 4.213 0 5.222.674a4 4 0 0 1 1.104 1.104C21 10.787 21 12.19 21 15s0 4.213-.674 5.222a4 4 0 0 1-1.104 1.104C18.213 22 16.81 22 14 22h-4c-2.809 0-4.213 0-5.222-.674a4 4 0 0 1-1.104-1.104C3 19.213 3 17.81 3 15"/><path d="M12.5 16.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0m0 0v-5s.4 1.733 2 2M19 8c-.018-1.24-.11-1.943-.582-2.414C17.832 5 16.888 5 15.002 5H8.998c-1.887 0-2.83 0-3.416.586C5.11 6.057 5.018 6.76 5 8m12-3c0-.932 0-1.398-.152-1.765a2 2 0 0 0-1.083-1.083C15.398 2 14.932 2 14 2h-4c-.932 0-1.398 0-1.765.152a2 2 0 0 0-1.083 1.083C7 3.602 7 4.068 7 5"/></g>', width: 24, height: 24 }, "plus-sign": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4v16m8-8H4"/>', width: 24, height: 24 }, power: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M18.708 6A9 9 0 1 1 3 12c0-2.305.867-4.408 2.292-6M12 3v9"/>', width: 24, height: 24 }, "power-socket-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M2.5 12c0-4.23 0-6.345 1.198-7.747q.256-.3.555-.555C5.655 2.5 7.77 2.5 12 2.5s6.345 0 7.747 1.198q.3.256.555.555C21.5 5.655 21.5 7.77 21.5 12s0 6.345-1.198 7.747q-.256.3-.555.555C18.345 21.5 16.23 21.5 12 21.5s-6.345 0-7.747-1.198q-.3-.256-.555-.555C2.5 18.345 2.5 16.23 2.5 12Z"/><circle cx="12" cy="12" r="6"/><path stroke-linecap="round" stroke-linejoin="round" d="M9.875 12H9.75m4.625.001h-.125M10 12a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m4.5.001a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, previous: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linejoin="round" d="M8.065 12.626c.254 1.211 1.608 2.082 4.315 3.822c2.945 1.893 4.417 2.84 5.61 2.475c.403-.124.775-.34 1.088-.635C20 17.418 20 15.612 20 12s0-5.418-.922-6.288a2.8 2.8 0 0 0-1.088-.635c-1.193-.365-2.665.582-5.61 2.475c-2.707 1.74-4.06 2.61-4.315 3.822c-.087.412-.087.84 0 1.252Z"/><path stroke-linecap="round" d="M4 4v16"/></g>', width: 24, height: 24 }, "pulse-01": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M2 12h4l1.5-4l2 7L13 6l2.5 12l2.5-6h4"/>', width: 24, height: 24 }, refresh: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M20.01 2v3.132a.314.314 0 0 1-.556.201A9.98 9.98 0 0 0 12 2C6.477 2 2 6.477 2 12s4.477 10 10 10s10-4.477 10-10"/>', width: 24, height: 24 }, "remote-control": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="M12.5 2c3.3 0 4.95 0 5.975 1.025S19.5 5.7 19.5 9v6c0 3.3 0 4.95-1.025 5.975S15.8 22 12.5 22h-1c-3.3 0-4.95 0-5.975-1.025S4.5 18.3 4.5 15V9c0-3.3 0-4.95 1.025-5.975S8.2 2 11.5 2zM8 15h2m-2 3h2m4-3h2m-2 3h2"/><path d="M15 8a3 3 0 1 1-6 0a3 3 0 0 1 6 0Z"/></g>', width: 24, height: 24 }, "router-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M18 20.5H6c-1.886 0-2.828 0-3.414-.586S2 18.386 2 16.5s0-2.828.586-3.414S4.114 12.5 6 12.5h12c1.886 0 2.828 0 3.414.586S22 14.614 22 16.5s0 2.828-.586 3.414s-1.528.586-3.414.586m-6-8v-2m-6 6h4m-.5-9.135a4 4 0 0 1 5 .01M7 4.255a8 8 0 0 1 10 0"/><path d="M18.125 16.5H18m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0m-4.125 0H14m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, "security-lock": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M18.709 3.495C16.817 2.554 14.5 2 12 2s-4.816.554-6.709 1.495c-.928.462-1.392.693-1.841 1.419S3 6.342 3 7.748v3.49c0 5.683 4.542 8.842 7.173 10.196c.734.377 1.1.566 1.827.566s1.093-.189 1.827-.566C16.457 20.08 21 16.92 21 11.237V7.748c0-1.406 0-2.108-.45-2.834s-.913-.957-1.841-1.419"/><path d="M10 10V8.5a2 2 0 1 1 4 0V10m0 0h-4a1.5 1.5 0 0 0-1.5 1.5V13a1.5 1.5 0 0 0 1.5 1.5h4a1.5 1.5 0 0 0 1.5-1.5v-1.5A1.5 1.5 0 0 0 14 10"/></g>', width: 24, height: 24 }, "settings-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path stroke-linecap="round" d="m21.318 7.141l-.494-.856c-.373-.648-.56-.972-.878-1.101c-.317-.13-.676-.027-1.395.176l-1.22.344c-.459.106-.94.046-1.358-.17l-.337-.194a2 2 0 0 1-.788-.967l-.334-.998c-.22-.66-.33-.99-.591-1.178c-.261-.19-.609-.19-1.303-.19h-1.115c-.694 0-1.041 0-1.303.19c-.261.188-.37.518-.59 1.178l-.334.998a2 2 0 0 1-.789.967l-.337.195c-.418.215-.9.275-1.358.17l-1.22-.345c-.719-.203-1.078-.305-1.395-.176c-.318.129-.505.453-.878 1.1l-.493.857c-.35.608-.525.911-.491 1.234c.034.324.268.584.736 1.105l1.031 1.153c.252.319.431.875.431 1.375s-.179 1.056-.43 1.375l-1.032 1.152c-.468.521-.702.782-.736 1.105s.14.627.49 1.234l.494.857c.373.647.56.971.878 1.1s.676.028 1.395-.176l1.22-.344a2 2 0 0 1 1.359.17l.336.194c.36.23.636.57.788.968l.334.997c.22.66.33.99.591 1.18c.262.188.609.188 1.303.188h1.115c.694 0 1.042 0 1.303-.189s.371-.519.59-1.179l.335-.997c.152-.399.428-.738.788-.968l.336-.194c.42-.215.9-.276 1.36-.17l1.22.344c.718.204 1.077.306 1.394.177c.318-.13.505-.454.878-1.101l.493-.857c.35-.607.525-.91.491-1.234s-.268-.584-.736-1.105l-1.031-1.152c-.252-.32-.431-.875-.431-1.375s.179-1.056.43-1.375l1.032-1.153c.468-.52.702-.781.736-1.105s-.14-.626-.49-1.234Z"/><path d="M15.52 12a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0Z"/></g>', width: 24, height: 24 }, "smart-ac": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M16 3c2.339 0 3.508 0 4.362.536a3.5 3.5 0 0 1 1.102 1.102C22 5.492 22 6.66 22 9s0 3.508-.537 4.362a3.5 3.5 0 0 1-1.1 1.101C19.507 15 18.338 15 16 15H8c-2.339 0-3.508 0-4.362-.537a3.5 3.5 0 0 1-1.102-1.1C2 12.507 2 11.338 2 9s0-3.508.536-4.362a3.5 3.5 0 0 1 1.102-1.102C4.492 3 5.66 3 8 3zm-9 9h10"/><path stroke-linejoin="round" d="M6 21a2 2 0 0 0 2-2v-1m10 3a2 2 0 0 1-2-2v-1m-4 0v3m6.125-14H18m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, snow: { body: '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="round" d="m21 14.25l-.831-.659c-.946-.75-1.419-1.125-1.419-1.591s.473-.841 1.419-1.591L21 9.75m-18 0l.831.659c.946.75 1.419 1.125 1.419 1.591s-.473.841-1.419 1.591L3 14.25M14.572 21l.156-1.059c.178-1.205.267-1.807.674-2.042c.407-.236.972-.011 2.104.437l.994.394M9.428 3l-.156 1.059c-.178 1.205-.267 1.807-.674 2.042c-.407.236-.972.011-2.104-.437L5.5 5.27M5 18.732l1.07-.395c1.218-.448 1.827-.672 2.265-.438s.533.838.724 2.042L9.227 21M19 5.268l-1.07.394c-1.218.45-1.828.673-2.265.439s-.533-.838-.724-2.042L14.773 3"/><path d="M19 12H5m10.5 6l-7-12m7 0l-7 12"/></g>', width: 24, height: 24 }, "sofa-01": { body: '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="round" d="M6 17v3m12-3v3m2-11c0-1.87 0-2.804-.402-3.5A3 3 0 0 0 18.5 4.402C17.804 4 16.87 4 15 4H9c-1.87 0-2.804 0-3.5.402A3 3 0 0 0 4.402 5.5C4 6.196 4 7.13 4 9"/><path d="M20 9a2 2 0 0 0-2 2v2c0 .827-.173 1-1 1H7c-.827 0-1-.173-1-1v-2a2 2 0 1 0-3 1.732V13c0 1.886 0 2.828.586 3.414S5.114 17 7 17h10c1.886 0 2.828 0 3.414-.586S21 14.886 21 13v-.268A2 2 0 0 0 20 9Z"/></g>', width: 24, height: 24 }, "speaker-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3.5 10c0-3.771 0-5.657 1.245-6.828S7.993 2 12 2s6.01 0 7.255 1.172S20.5 6.229 20.5 10v4c0 3.771 0 5.657-1.245 6.828S16.007 22 12 22s-6.01 0-7.255-1.172S3.5 17.771 3.5 14z"/><circle cx="12" cy="14.5" r="3.5"/><path stroke-linecap="round" d="M10 6h4"/></g>', width: 24, height: 24 }, spotify: { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path stroke-linecap="round" d="M7.5 12.069c1.1-.37 2.276-.569 3.5-.569c2.024 0 3.92.547 5.549 1.5M18 10c-1.85-1.262-4.088-2-6.5-2c-1.597 0-3.118.324-4.5.908M15.129 16a9.04 9.04 0 0 0-6.497-.685"/></g>', width: 24, height: 24 }, spotlight: { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8 2v7m0 5l5-5l-4.116-4.116a3.02 3.02 0 0 0-4.268 0l-.732.732a3.02 3.02 0 0 0 0 4.268z"/><path d="m13 9l-5 5l.762 3.05a1.255 1.255 0 0 0 2.106.582l5.764-5.764a1.255 1.255 0 0 0-.583-2.106zm5 10l2 2m-1-6h2m-7 5v2"/></g>', width: 24, height: 24 }, "square-unlock-01": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4.268 18.845c.225 1.67 1.608 2.979 3.292 3.056c1.416.065 2.855.099 4.44.099s3.024-.034 4.44-.1c1.684-.076 3.067-1.385 3.292-3.055c.147-1.09.268-2.207.268-3.345s-.121-2.255-.268-3.345c-.225-1.67-1.608-2.979-3.292-3.056A95 95 0 0 0 12 9c-1.585 0-3.024.034-4.44.1c-1.684.076-3.067 1.385-3.292 3.055C4.12 13.245 4 14.362 4 15.5s.121 2.255.268 3.345Z"/><path stroke-linecap="round" stroke-linejoin="round" d="M7.5 9V6.5A4.5 4.5 0 0 1 12 2c1.96 0 3.5 1.5 4 3"/><path stroke-linecap="round" d="M12.125 15.5H12m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0Z"/></g>', width: 24, height: 24 }, stop: { body: '<path fill="none" stroke="currentColor" stroke-width="1.5" d="M4 12c0-3.28 0-4.919.814-6.081a4.5 4.5 0 0 1 1.105-1.105C7.08 4 8.72 4 12 4s4.919 0 6.081.814a4.5 4.5 0 0 1 1.105 1.105C20 7.08 20 8.72 20 12s0 4.919-.814 6.081a4.5 4.5 0 0 1-1.105 1.105C16.92 20 15.28 20 12 20s-4.919 0-6.081-.814a4.5 4.5 0 0 1-1.105-1.105C4 16.92 4 15.28 4 12Z"/>', width: 24, height: 24 }, sunset: { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path stroke-linejoin="round" d="M9.5 7.5c.492.506 1.8 2.5 2.5 2.5m2.5-2.5c-.492.506-1.8 2.5-2.5 2.5m0 0V4"/><path d="M18.363 10.636L16.95 12.05M3 17h2m.637-6.364L7.05 12.05M21 17h-2m2 3H3m13-3a4 4 0 0 0-8 0"/></g>', width: 24, height: 24 }, "system-update-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="m21.255 7.134l-.494-.857c-.373-.648-.56-.972-.877-1.1c-.318-.13-.677-.028-1.395.176l-1.22.343c-.459.106-.94.046-1.359-.169l-.337-.194a2 2 0 0 1-.788-.968l-.334-.997c-.22-.66-.33-.99-.59-1.18C13.598 2 13.25 2 12.556 2h-1.114c-.695 0-1.042 0-1.303.189c-.262.189-.371.519-.591 1.179l-.334.997a2 2 0 0 1-.788.968l-.337.194a2 2 0 0 1-1.359.17l-1.22-.344c-.718-.204-1.077-.306-1.395-.177c-.317.13-.504.453-.877 1.101l-.494.857c-.35.607-.525.91-.49 1.234c.033.323.267.583.736 1.104l1.03 1.153c.253.319.432.875.432 1.375s-.18 1.056-.431 1.375L2.99 14.528c-.469.52-.703.781-.737 1.104s.141.627.491 1.234l.494.857c.373.648.56.972.877 1.1c.318.13.677.028 1.395-.176l1.22-.343c.46-.106.94-.046 1.36.169l.336.194c.359.23.635.57.788.968l.334.997c.22.66.33.99.59 1.18c.262.188.61.188 1.304.188h1.114c.695 0 1.042 0 1.303-.189c.262-.189.372-.518.591-1.178l.334-.998c.153-.399.429-.738.788-.968l.337-.194a2 2 0 0 1 1.359-.17l1.22.344c.718.204 1.077.306 1.395.177c.317-.13.504-.453.877-1.101l.494-.857c.35-.607.525-.91.49-1.234c-.033-.323-.267-.583-.736-1.104l-1.03-1.153c-.253-.32-.432-.875-.432-1.375s.18-1.056.431-1.375l1.031-1.153c.469-.52.703-.781.737-1.104s-.141-.627-.491-1.234Z"/><path stroke-linejoin="round" d="m14.062 11.5l.5-.5c.441-.441.662-.662.951-.57c.29.091.336.353.427.877q.06.338.06.693a4 4 0 0 1-5.5 3.71m-.5-3.175l-.544.544c-.434.434-.652.652-.938.565c-.287-.087-.338-.344-.44-.857A4 4 0 0 1 13.5 8.291"/></g>', width: 24, height: 24 }, thermometer: { body: '<g fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="1.5"><path stroke-linecap="round" d="m13.88 15.937l6.794-7.764c.748-.855 1.122-1.282 1.251-1.76a2.14 2.14 0 0 0-.042-1.258c-.16-.468-.562-.87-1.365-1.673s-1.205-1.204-1.673-1.365a2.14 2.14 0 0 0-1.258-.042c-.477.13-.905.503-1.76 1.251L8.063 10.12c-.956.836-1.433 1.254-1.715 1.806c-.28.551-.338 1.184-.453 2.448l-.023.258c-.061.668-.092 1.002-.22 1.307c-.127.304-.343.56-.777 1.072l-2.6 3.073a1.164 1.164 0 0 0 1.64 1.64l3.074-2.6c.512-.433.768-.65 1.072-.777s.639-.158 1.307-.219l.258-.023c1.264-.115 1.897-.172 2.448-.454c.552-.28.97-.758 1.806-1.714"/><path d="m7.79 9.895l1.58.948a.787.787 0 0 1 .27 1.08l-.292.486a1.634 1.634 0 0 0 2.242 2.243l.487-.292a.787.787 0 0 1 1.08.27l.948 1.58"/><path stroke-linecap="round" d="m17.263 6.737l-3.158 3.158"/></g>', width: 24, height: 24 }, "tick-02": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m5 14l3.5 3.5L19 6.5"/>', width: 24, height: 24 }, "timer-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M11.08 13.152L8 7l5.42 4.28c.77.608.774 1.767.008 2.38a1.547 1.547 0 0 1-2.347-.508"/><path d="M5 4.82a10 10 0 0 0-3 7.158C2 17.513 6.477 22 12 22s10-4.487 10-10.022a10.02 10.02 0 0 0-8.013-9.825c-.836-.17-1.254-.254-1.62.047S12 2.987 12 3.96v1.002"/></g>', width: 24, height: 24 }, "toilet-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8 11h9.135c1.465 0 2.198 0 2.64.735c.442.736.182 1.204-.34 2.142A6.1 6.1 0 0 1 14.09 17a6.12 6.12 0 0 1-4.028-1.5M8 11V4c0-.943 0-1.414-.293-1.707S6.943 2 6 2s-1.414 0-1.707.293S4 3.057 4 4v7c0 .943 0 1.414.293 1.707S5.057 13 6 13s1.414 0 1.707-.293S8 11.943 8 11M7 7h3"/><path d="M16 17c-1 1 0 4 2 5H4c1-1 2.7-4.2 1.5-9"/></g>', width: 24, height: 24 }, "tv-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M2 14c0-3.771 0-5.657 1.172-6.828S6.229 6 10 6h4c3.771 0 5.657 0 6.828 1.172S22 10.229 22 14s0 5.657-1.172 6.828S17.771 22 14 22h-4c-3.771 0-5.657 0-6.828-1.172S2 17.771 2 14Z"/><path stroke-linejoin="round" d="m9 3l3 3l4-4"/></g>', width: 24, height: 24 }, user: { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M17 8.5a5 5 0 1 0-10 0a5 5 0 0 0 10 0"/><path d="M19 20.5a7 7 0 1 0-14 0"/></g>', width: 24, height: 24 }, "user-group": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M15.5 11a3.5 3.5 0 1 0-7 0a3.5 3.5 0 0 0 7 0"/><path d="M15.483 11.35q.484.149 1.017.15a3.5 3.5 0 1 0-3.483-3.85m-2.034 0a3.5 3.5 0 1 0-2.466 3.7M22 16.5c0-2.761-2.462-5-5.5-5m1 8c0-2.761-2.462-5-5.5-5s-5.5 2.239-5.5 5"/><path d="M7.5 11.5c-3.038 0-5.5 2.239-5.5 5"/></g>', width: 24, height: 24 }, "user-multiple": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M13 11a4 4 0 1 0-8 0a4 4 0 0 0 8 0"/><path d="M11.039 7.558a4 4 0 1 1 1.923 2.885M15 21a6 6 0 0 0-12 0"/><path d="M21 17a6 6 0 0 0-6-6"/></g>', width: 24, height: 24 }, "user-time-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M14.5 8a5 5 0 1 0-10 0a5 5 0 0 0 10 0"/><path d="M2.5 20a7 7 0 0 1 10-6.326M19 18l-1-.5V16m3.5 1.5a3.5 3.5 0 1 1-7 0a3.5 3.5 0 0 1 7 0"/></g>', width: 24, height: 24 }, "vacuum-cleaner": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M6 21a2 2 0 1 1 0-4a2 2 0 0 1 0 4"/><path d="M10 21h1.974c.64 0 1.124-.565 1.01-1.179l-.914-4.9C11.538 12.07 8.994 10 6.024 10C5.458 10 5 10.447 5 10.999V14.5"/><path d="M19.5 21L12.858 6.934A6.87 6.87 0 0 0 6.649 3A4.65 4.65 0 0 0 2 7.65v.188A4.39 4.39 0 0 0 5 12m17 9h-5.5"/></g>', width: 24, height: 24 }, "video-off": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="m2.002 2l19.975 20m-5.125-5.132c-.13.938-.386 1.599-.893 2.106C14.937 20 13.289 20 9.993 20h-.999c-3.296 0-4.943 0-5.967-1.026C2.002 17.95 2.002 16.3 2.002 13v-2c0-3.3 0-4.95 1.024-5.975c.342-.343.755-.571 1.275-.723"/><path stroke-linejoin="round" d="M8.236 4h1.755c3.296 0 4.944 0 5.967 1.025C16.982 6.05 16.982 7.7 16.982 11v1.757m0-3.526l2.32-1.702c1.47-.988 2.147-.357 2.365.12c.452 1.279.31 3.744.31 6.893c-.107 2.013-.382 2.23-.663 2.452l-.003.002"/></g>', width: 24, height: 24 }, "view-off": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-width="1.5"><path d="M22 8s-4 6-10 6S2 8 2 8"/><path stroke-linejoin="round" d="m15 13.5l1.5 2.5m3.5-5l2 2M2 13l2-2m5 2.5L7.5 16"/></g>', width: 24, height: 24 }, "washing-machine": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M3 14v-4c0-3.771 0-5.657 1.172-6.828S7.229 2 11 2h2c3.771 0 5.657 0 6.828 1.172S21 6.229 21 10v4c0 3.771 0 5.657-1.172 6.828S16.771 22 13 22h-2c-3.771 0-5.657 0-6.828-1.172S3 17.771 3 14"/><path d="M17 13a5 5 0 1 1-10 0a5 5 0 0 1 10 0"/><path d="M7 13q2.5-2 5 0t5 0M7.125 6H7m.25 0a.25.25 0 1 1-.5 0a.25.25 0 0 1 .5 0"/></g>', width: 24, height: 24 }, "wifi-01": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"><path d="M8.25 14.5c2-2 5.5-2 7.5 0m2.75-3c-3.768-3.333-9-3.333-13 0"/><path d="M2 8.5c6.316-5.333 13.684-5.333 20 0"/><circle cx="12" cy="18" r="1.5"/></g>', width: 24, height: 24 }, wireless: { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M14.5 11h-5c-1.866 0-2.799 0-3.519.347a3.5 3.5 0 0 0-1.634 1.634C4 13.701 4 14.634 4 16.5s0 2.799.347 3.519a3.5 3.5 0 0 0 1.634 1.634C6.701 22 7.634 22 9.5 22h5c1.866 0 2.799 0 3.519-.347a3.5 3.5 0 0 0 1.634-1.634C20 19.299 20 18.366 20 16.5s0-2.799-.347-3.519a3.5 3.5 0 0 0-1.634-1.634C17.299 11 16.366 11 14.5 11M13 15h3M9.5 6.99a4.005 4.005 0 0 1 5 .01M7 3.752a8.01 8.01 0 0 1 10 0"/>', width: 24, height: 24 }, "wireless-cloud-access": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17.478 8.398h.022c2.485 0 4.5 1.98 4.5 4.423a4.4 4.4 0 0 1-2 3.679m-2.522-8.102q.021-.243.022-.492C17.5 4.921 15.038 2.5 12 2.5c-2.877 0-5.238 2.171-5.48 4.937m10.958.961a5.33 5.33 0 0 1-1.235 2.949M10 8.398a5.04 5.04 0 0 0-3.48-.96C3.983 7.674 2 9.773 2 12.33c0 1.759.94 3.302 2.352 4.17M8 15.978c1.149-.935 2.52-1.478 3.995-1.478c1.478 0 2.854.547 4.005 1.487M14.174 18.5a4.1 4.1 0 0 0-2.18-.64a4.1 4.1 0 0 0-2.17.634M12 21.5h.006"/>', width: 24, height: 24 }, "workout-run": { body: '<g fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 4.5a1.5 1.5 0 1 1-3 0a1.5 1.5 0 0 1 3 0Z"/><path stroke-linecap="round" stroke-linejoin="round" d="m15 21l-.664-2.615a4.9 4.9 0 0 0-1.315-2.288L11.5 14.6M6 11.153c1-1.97 2.538-3.11 6-3.152m0 0c.219-.002.544-.003.87-.003c.505 0 .757 0 .958.094s.408.34.82.833c.118.142.24.268.352.352m-3-1.276L10.73 9.96c-.697 1.076-1.046 1.614-1.06 2.18a2 2 0 0 0 .123.738c.195.531.7.928 1.707 1.722M15 9.277c1.155.866 2.963 1.215 5-1.078m-5 1.078L11.5 14.6M4 17.73l.678.162C6.407 18.302 8.203 17.516 9 16"/></g>', width: 24, height: 24 }, "zoom-in-area": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="m18.502 19.122l2.498 2.5m-1-6.5a5.5 5.5 0 1 0-11 0a5.5 5.5 0 0 0 11 0m-5.5-2v4m2-2h-4M10 3.622h4m-11 7v4m3.5 7a3.5 3.5 0 0 1-3.5-3.5m14.5-14.5a3.5 3.5 0 0 1 3.5 3.5m-18 0a3.5 3.5 0 0 1 3.5-3.5"/>', width: 24, height: 24 } }), e = Object.freeze({ "close-to-menu-transition": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5l7 0l7 0M5 12h14M5 19l7 0l7 0"><animate fill="freeze" attributeName="d" dur="0.4s" values="M5 5l7 7l7 -7M12 12h0M5 19l7 -7l7 7;M5 5l7 0l7 0M5 12h14M5 19l7 0l7 0"/></path>', width: 24, height: 24 }, "cog-loop": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="22" d="M12 9c1.66 0 3 1.34 3 3c0 1.66 -1.34 3 -3 3c-1.66 0 -3 -1.34 -3 -3c0 -1.66 1.34 -3 3 -3Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.3s" values="22;0"/></path><path stroke-dasharray="44" stroke-dashoffset="44" d="M12 5.5c3.59 0 6.5 2.91 6.5 6.5c0 3.59 -2.91 6.5 -6.5 6.5c-3.59 0 -6.5 -2.91 -6.5 -6.5c0 -3.59 2.91 -6.5 6.5 -6.5Z"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.3s" dur="0.5s" to="0"/><set fill="freeze" attributeName="opacity" begin="0.8s" to="0"/></path><path d="M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83c0 0 2.62 -1.08 2.63 -1.06c0 0 1.56 2.7 1.56 2.7c0.01 0.03 -2.22 1.75 -2.22 1.75c0.1 0.45 0.15 0.93 0.15 1.41" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.8s" to="1"/><animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83c0.22 0.2 0.42 0.41 0.61 0.63c0.47 0.57 0.86 1.22 1.12 1.94c0.09 0.26 0.17 0.54 0.24 0.82c0.1 0.45 0.15 0.93 0.15 1.41;M15.24 6.37c0.41 0.23 0.8 0.51 1.14 0.83c0 0 2.62 -1.08 2.63 -1.06c0 0 1.56 2.7 1.56 2.7c0.01 0.03 -2.22 1.75 -2.22 1.75c0.1 0.45 0.15 0.93 0.15 1.41"/></path><path d="M18.5 11.99c0.01 0.47 -0.04 0.95 -0.15 1.4c0 0 2.25 1.73 2.23 1.75c0 0 -1.56 2.7 -1.56 2.7c-0.02 0.02 -2.63 -1.05 -2.63 -1.05c-0.34 0.31 -0.73 0.59 -1.15 0.83" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.8s" to="1"/><animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M18.5 11.99c0.01 0.47 -0.04 0.95 -0.15 1.4c-0.06 0.29 -0.15 0.57 -0.24 0.84c-0.26 0.69 -0.63 1.35 -1.12 1.94c-0.18 0.21 -0.38 0.42 -0.59 0.62c-0.34 0.31 -0.73 0.59 -1.15 0.83;M18.5 11.99c0.01 0.47 -0.04 0.95 -0.15 1.4c0 0 2.25 1.73 2.23 1.75c0 0 -1.56 2.7 -1.56 2.7c-0.02 0.02 -2.63 -1.05 -2.63 -1.05c-0.34 0.31 -0.73 0.59 -1.15 0.83"/></path><path d="M15.26 17.62c-0.4 0.24 -0.84 0.44 -1.29 0.57c0 0 -0.37 2.81 -0.4 2.81c0 0 -3.12 0 -3.12 0c-0.03 -0.01 -0.41 -2.8 -0.41 -2.8c-0.44 -0.14 -0.88 -0.34 -1.3 -0.58" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.8s" to="1"/><animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M15.26 17.62c-0.4 0.24 -0.84 0.44 -1.29 0.57c-0.28 0.09 -0.57 0.16 -0.85 0.21c-0.73 0.12 -1.49 0.13 -2.24 0c-0.27 -0.05 -0.55 -0.12 -0.83 -0.2c-0.44 -0.14 -0.88 -0.34 -1.3 -0.58;M15.26 17.62c-0.4 0.24 -0.84 0.44 -1.29 0.57c0 0 -0.37 2.81 -0.4 2.81c0 0 -3.12 0 -3.12 0c-0.03 -0.01 -0.41 -2.8 -0.41 -2.8c-0.44 -0.14 -0.88 -0.34 -1.3 -0.58"/></path><path d="M8.76 17.63c-0.41 -0.23 -0.8 -0.51 -1.14 -0.83c0 0 -2.62 1.08 -2.63 1.06c0 0 -1.56 -2.7 -1.56 -2.7c-0.01 -0.03 2.22 -1.75 2.22 -1.75c-0.1 -0.45 -0.15 -0.93 -0.15 -1.41" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.8s" to="1"/><animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M8.76 17.63c-0.41 -0.23 -0.8 -0.51 -1.14 -0.83c-0.22 -0.2 -0.42 -0.41 -0.61 -0.63c-0.47 -0.57 -0.86 -1.22 -1.12 -1.94c-0.09 -0.26 -0.17 -0.54 -0.24 -0.82c-0.1 -0.45 -0.15 -0.93 -0.15 -1.41;M8.76 17.63c-0.41 -0.23 -0.8 -0.51 -1.14 -0.83c0 0 -2.62 1.08 -2.63 1.06c0 0 -1.56 -2.7 -1.56 -2.7c-0.01 -0.03 2.22 -1.75 2.22 -1.75c-0.1 -0.45 -0.15 -0.93 -0.15 -1.41"/></path><path d="M5.5 12.01c-0.01 -0.47 0.04 -0.95 0.15 -1.4c0 0 -2.25 -1.73 -2.23 -1.75c0 0 1.56 -2.7 1.56 -2.7c0.02 -0.02 2.63 1.05 2.63 1.05c0.34 -0.31 0.73 -0.59 1.15 -0.83" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.8s" to="1"/><animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M5.5 12.01c-0.01 -0.47 0.04 -0.95 0.15 -1.4c0.06 -0.29 0.15 -0.57 0.24 -0.84c0.26 -0.69 0.63 -1.35 1.12 -1.94c0.18 -0.21 0.38 -0.42 0.59 -0.62c0.34 -0.31 0.73 -0.59 1.15 -0.83;M5.5 12.01c-0.01 -0.47 0.04 -0.95 0.15 -1.4c0 0 -2.25 -1.73 -2.23 -1.75c0 0 1.56 -2.7 1.56 -2.7c0.02 -0.02 2.63 1.05 2.63 1.05c0.34 -0.31 0.73 -0.59 1.15 -0.83"/></path><path d="M8.74 6.38c0.4 -0.24 0.84 -0.44 1.29 -0.57c0 0 0.37 -2.81 0.4 -2.81c0 0 3.12 0 3.12 0c0.03 0.01 0.41 2.8 0.41 2.8c0.44 0.14 0.88 0.34 1.3 0.58" opacity="0"><animateTransform attributeName="transform" dur="30s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/><set fill="freeze" attributeName="opacity" begin="0.8s" to="1"/><animate fill="freeze" attributeName="d" begin="0.8s" dur="0.2s" values="M8.74 6.38c0.4 -0.24 0.84 -0.44 1.29 -0.57c0.28 -0.09 0.57 -0.16 0.85 -0.21c0.73 -0.12 1.49 -0.13 2.24 0c0.27 0.05 0.55 0.12 0.83 0.2c0.44 0.14 0.88 0.34 1.3 0.58;M8.74 6.38c0.4 -0.24 0.84 -0.44 1.29 -0.57c0 0 0.37 -2.81 0.4 -2.81c0 0 3.12 0 3.12 0c0.03 0.01 0.41 2.8 0.41 2.8c0.44 0.14 0.88 0.34 1.3 0.58"/></path></g>', width: 24, height: 24 }, "download-loop": { body: '<g stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path fill="currentColor" fill-opacity="0" stroke-dasharray="20" d="M12 4h2v6h2.5l-4.5 4.5M12 4h-2v6h-2.5l4.5 4.5"><animate attributeName="d" dur="1.5s" keyTimes="0;0.5;1" repeatCount="indefinite" values="M12 4h2v6h2.5l-4.5 4.5M12 4h-2v6h-2.5l4.5 4.5;M12 4h2v3h2.5l-4.5 4.5M12 4h-2v3h-2.5l4.5 4.5;M12 4h2v6h2.5l-4.5 4.5M12 4h-2v6h-2.5l4.5 4.5"/><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="20;0"/><animate fill="freeze" attributeName="fill-opacity" begin="0.7s" dur="0.4s" to="1"/></path><path fill="none" stroke-dasharray="14" stroke-dashoffset="14" d="M6 19h12"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" to="0"/></path></g>', width: 24, height: 24 }, "lightbulb-off-loop": { body: '<defs><mask id="SVGoMLV5cXg"><g fill="none" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><g stroke="#fff"><path stroke-dasharray="46" d="M12 17h-3v-2.8c-1.79 -1.04 -3 -2.98 -3 -5.2c0 -3.31 2.69 -6 6 -6c3.31 0 6 2.69 6 6c0 2.22 -1.21 4.16 -3 5.2v2.8Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="46;0"/></path><path stroke-dasharray="6" stroke-dashoffset="6" d="M10 21h4"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.5s" dur="0.2s" to="0"/></path></g><path stroke="#000" stroke-dasharray="24" stroke-dashoffset="24" d="M1 11h22" transform="rotate(45 13 12)"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.3s" to="0"/></path></g></mask></defs><path fill="currentColor" d="M0 0h24v24H0z" mask="url(#SVGoMLV5cXg)"/><path fill="none" stroke="currentColor" stroke-dasharray="24" stroke-dashoffset="24" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M0 13h22" transform="rotate(45 13 12)"><animate attributeName="d" dur="6s" keyTimes="0;0.5;1" repeatCount="indefinite" values="M0 13h22;M2 13h22;M0 13h22"/><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.7s" dur="0.3s" to="0"/></path>', width: 24, height: 24 }, "loading-loop": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3c4.97 0 9 4.03 9 9"><animateTransform attributeName="transform" dur="1.5s" repeatCount="indefinite" type="rotate" values="0 12 12;360 12 12"/></path>', width: 24, height: 24 }, "menu-to-close-transition": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5l7 7l7 -7M12 12h0M5 19l7 -7l7 7"><animate fill="freeze" attributeName="d" dur="0.4s" values="M5 5l7 0l7 0M5 12h14M5 19l7 0l7 0;M5 5l7 7l7 -7M12 12h0M5 19l7 -7l7 7"/></path>', width: 24, height: 24 }, pause: { body: '<g fill="none" stroke="currentColor" stroke-dasharray="30" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M7 6h2v12h-2Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="30;0"/></path><path stroke-dashoffset="30" d="M15 6h2v12h-2Z"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.4s" to="0"/></path></g>', width: 24, height: 24 }, "pause-to-play-transition": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 15l-5 3l0 -12l5 3l0 0M13 9l5 3l0 0l-5 3l0 0"><animate fill="freeze" attributeName="d" dur="0.6s" keyTimes="0;0.33;1" values="M9 18l-2 0l0 -12l2 0l0 12M15 6l2 0l0 12l-2 0l0 -12;M13 15l-5 3l0 -12l5 3l0 6M13 9l5 3l0 0l-5 3l0 -6;M13 15l-5 3l0 -12l5 3l0 0M13 9l5 3l0 0l-5 3l0 0"/></path>', width: 24, height: 24 }, play: { body: '<path fill="none" stroke="currentColor" stroke-dasharray="38" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 6l10 6l-10 6Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.5s" values="38;0"/></path>', width: 24, height: 24 }, "play-to-pause-transition": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 18l-2 0l0 -12l2 0l0 12M15 6l2 0l0 12l-2 0l0 -12"><animate fill="freeze" attributeName="d" dur="0.6s" keyTimes="0;0.33;1" values="M13 15l-5 3l0 -12l5 3l0 0M13 9l5 3l0 0l-5 3l0 0;M13 15l-5 3l0 -12l5 3l0 6M13 9l5 3l0 0l-5 3l0 -6;M9 18l-2 0l0 -12l2 0l0 12M15 6l2 0l0 12l-2 0l0 -12"/></path>', width: 24, height: 24 }, switch: { body: '<path fill="none" stroke="currentColor" stroke-dasharray="54" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7h5c2.76 0 5 2.24 5 5c0 2.76 -2.24 5 -5 5h-10c-2.76 0 -5 -2.24 -5 -5c0 -2.76 2.24 -5 5 -5Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="54;0"/></path><circle cx="17" cy="12" r="3" fill="currentColor" opacity="0"><animate fill="freeze" attributeName="opacity" begin="0.6s" dur="0.2s" to="1"/></circle>', width: 24, height: 24 }, "switch-off": { body: '<path fill="none" stroke="currentColor" stroke-dasharray="54" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7h5c2.76 0 5 2.24 5 5c0 2.76 -2.24 5 -5 5h-10c-2.76 0 -5 -2.24 -5 -5c0 -2.76 2.24 -5 5 -5Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.6s" values="54;0"/></path><circle cx="7" cy="12" r="3" fill="currentColor" opacity="0"><animate fill="freeze" attributeName="opacity" begin="0.6s" dur="0.2s" to="1"/></circle>', width: 24, height: 24 }, "switch-off-to-switch-transition": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7h5c2.76 0 5 2.24 5 5c0 2.76 -2.24 5 -5 5h-10c-2.76 0 -5 -2.24 -5 -5c0 -2.76 2.24 -5 5 -5Z"/><circle cx="17" cy="12" r="3" fill="currentColor"><animate fill="freeze" attributeName="cx" dur="0.2s" values="7;17"/></circle>', width: 24, height: 24 }, "switch-to-switch-off-transition": { body: '<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 7h5c2.76 0 5 2.24 5 5c0 2.76 -2.24 5 -5 5h-10c-2.76 0 -5 -2.24 -5 -5c0 -2.76 2.24 -5 5 -5Z"/><circle cx="7" cy="12" r="3" fill="currentColor"><animate fill="freeze" attributeName="cx" dur="0.2s" values="17;7"/></circle>', width: 24, height: 24 }, "volume-high-off": { body: '<defs><mask id="SVGZcWklbpN"><path fill="none" stroke="#fff" stroke-dasharray="34" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 10h3.5l3.5 -3.5v10.5l-3.5 -3.5h-3.5Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0"/></path><g fill="#fff"><path d="M14 12c0 0 0 0 0 0c0 0 0 0 0 0Z"><animate fill="freeze" attributeName="d" begin="0.4s" dur="0.2s" to="M14 16c1.5 -0.71 2.5 -2.24 2.5 -4c0 -1.77 -1 -3.26 -2.5 -4Z"/></path><path d="M14 12c0 0 0 0 0 0c0 0 0 0 0 0v0c0 0 0 0 0 0c0 0 0 0 0 0Z"><animate fill="freeze" attributeName="d" begin="0.4s" dur="0.4s" to="M14 3.23c4 0.91 7 4.49 7 8.77c0 4.28 -3 7.86 -7 8.77v-2.07c2.89 -0.86 5 -3.53 5 -6.7c0 -3.17 -2.11 -5.85 -5 -6.71Z"/></path></g><path fill="none" stroke="#000" stroke-dasharray="28" stroke-dashoffset="28" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M-1 11h26" transform="rotate(45 12 12)"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.8s" dur="0.4s" to="0"/></path></mask></defs><path fill="currentColor" d="M0 0h24v24H0z" mask="url(#SVGZcWklbpN)"/><path fill="none" stroke="currentColor" stroke-dasharray="28" stroke-dashoffset="28" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M-1 13h26" transform="rotate(45 12 12)"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.8s" dur="0.4s" to="0"/></path>', width: 24, height: 24 }, "volume-medium": { body: '<path fill="none" stroke="currentColor" stroke-dasharray="34" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 10h3.5l3.5 -3.5v10.5l-3.5 -3.5h-3.5Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0"/></path><path fill="currentColor" d="M16 12c0 0 0 0 0 0c0 0 0 0 0 0Z"><animate fill="freeze" attributeName="d" begin="0.4s" dur="0.2s" to="M16 16c1.5 -0.71 2.5 -2.24 2.5 -4c0 -1.77 -1 -3.26 -2.5 -4Z"/></path>', width: 24, height: 24 }, "volume-minus": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="34" d="M4 10h3.5l3.5 -3.5v10.5l-3.5 -3.5h-3.5Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0"/></path><path stroke-dasharray="8" stroke-dashoffset="8" d="M15 12h6"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.2s" to="0"/></path></g>', width: 24, height: 24 }, "volume-plus": { body: '<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path stroke-dasharray="34" d="M4 10h3.5l3.5 -3.5v10.5l-3.5 -3.5h-3.5Z"><animate fill="freeze" attributeName="stroke-dashoffset" dur="0.4s" values="34;0"/></path><g stroke-dasharray="8" stroke-dashoffset="8"><path d="M15 12h6"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.4s" dur="0.2s" to="0"/></path><path d="M18 9v6"><animate fill="freeze" attributeName="stroke-dashoffset" begin="0.6s" dur="0.2s" to="0"/></path></g></g>', width: 24, height: 24 } }), t = Object.freeze({ "led-strip": '<g transform="scale(0.75)"><path fill="currentColor" d="M6.75,8.75h20.25c.4140625,0,.75-.3359375.75-.75v-.75h3.25c.4140625,0,.75-.3359375.75-.75s-.3359375-.75-.75-.75h-3.25v-2.5h3.25c.4140625,0,.75-.3359375.75-.75s-.3359375-.75-.75-.75h-3.25v-.75c0-.4140625-.3359375-.75-.75-.75H6.75C3.1660156.25.25,3.1660156.25,6.75v7c0,3.5839844,2.9160156,6.5,6.5,6.5h18.5c1.3605957,0,2.6092529.5638428,3.545166,1.5205078-.90625.9125977-2.1600342,1.4794922-3.545166,1.4794922H5c-.4140625,0-.75.3359375-.75.75v.75H1c-.4140625,0-.75.3359375-.75.75s.3359375.75.75.75h3.25v2.5H1c-.4140625,0-.75.3359375-.75.75s.3359375.75.75.75h3.25v.75c0,.4140625.3359375.75.75.75h20.25c3.5839844,0,6.5-2.9160156,6.5-6.5v-7c0-3.5839844-2.9160156-6.5-6.5-6.5H6.75c-1.3851318,0-2.638916-.5668945-3.545166-1.4794922.9359131-.956665,2.1845703-1.5205078,3.545166-1.5205078ZM30.25,25.25c0,2.7568359-2.2421875,5-5,5H5.75v-5.5h19.5c2.0209961,0,3.8068848-.9466553,5-2.3979492v2.8979492ZM6.75,13.25h18.5c2.7578125,0,5,2.2431641,5,5,0,.826416-.2207031,1.5949707-.5771484,2.2824707-1.1959229-1.1253662-2.7446289-1.7824707-4.4228516-1.7824707H6.75c-2.7578125,0-5-2.2431641-5-5v-2.8979492c1.1931152,1.4512939,2.9790039,2.3979492,5,2.3979492ZM1.75,6.75C1.75,3.9931641,3.9921875,1.75,6.75,1.75h19.5v5.5H6.75c-1.6782227,0-3.2269287.6571045-4.4228516,1.7824707-.3564453-.6875-.5771484-1.4560547-.5771484-2.2824707ZM6.25,4.5c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM10.25,4.5c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM14.25,4.5c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM18.25,4.5c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM22.25,4.5c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM7.25,16c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM11.25,16c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM15.25,16c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM19.25,16c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM23.25,16c0-.4141846.3358154-.75.75-.75s.75.3358154.75.75-.3358154.75-.75.75-.75-.3358154-.75-.75ZM9.75,27.5c0,.4141846-.3358154.75-.75.75s-.75-.3358154-.75-.75.3358154-.75.75-.75.75.3358154.75.75ZM13.75,27.5c0,.4141846-.3358154.75-.75.75s-.75-.3358154-.75-.75.3358154-.75.75-.75.75.3358154.75.75ZM17.75,27.5c0,.4141846-.3358154.75-.75.75s-.75-.3358154-.75-.75.3358154-.75.75-.75.75.3358154.75.75ZM21.75,27.5c0,.4141846-.3358154.75-.75.75s-.75-.3358154-.75-.75.3358154-.75.75-.75.75.3358154.75.75ZM25.75,27.5c0,.4141846-.3358154.75-.75.75s-.75-.3358154-.75-.75.3358154-.75.75-.75.75.3358154.75.75Z"/></g>', balcony: '<g transform="scale(0.75)"><path fill="currentColor" d="M7,15.75c.4140625,0,.75-.3359375.75-.75v-3.25h7.5v3.25c0,.4140625.3359375.75.75.75s.75-.3359375.75-.75v-3.25h7.5v3.25c0,.4140625.3359375.75.75.75s.75-.3359375.75-.75v-5C25.75,4.6230469,21.3759766.25,16,.25S6.25,4.6230469,6.25,10v5c0,.4140625.3359375.75.75.75ZM16.75,1.8258057c4.1931152.3857422,7.5,3.8822021,7.5,8.1741943v.25h-7.5V1.8258057ZM7.75,10c0-4.2919922,3.3068848-7.7884521,7.5-8.1741943v8.4241943h-7.5v-.25ZM29,18.25H3c-1.5166016,0-2.75,1.234375-2.75,2.75,0,.4140625.3359375.75.75.75s.75-.3359375.75-.75c0-.6894531.5605469-1.25,1.25-1.25h2.25v10.5h-.25c-.4140625,0-.75.3359375-.75.75s.3359375.75.75.75h22c.4140625,0,.75-.3359375.75-.75s-.3359375-.75-.75-.75h-.25v-10.5h2.25c.6894531,0,1.25.5605469,1.25,1.25,0,.4140625.3359375.75.75.75s.75-.3359375.75-.75c0-1.515625-1.2333984-2.75-2.75-2.75ZM10.25,30.25h-3.5v-10.5h3.5v10.5ZM15.25,30.25h-3.5v-10.5h3.5v10.5ZM20.25,30.25h-3.5v-10.5h3.5v10.5ZM25.25,30.25h-3.5v-10.5h3.5v10.5Z"/></g>' }), a = Object.freeze({ "mdi:access-point": "hugeicons:wireless-cloud-access", "mdi:account": "hugeicons:user", "mdi:account-clock-outline": "hugeicons:user-time-01", "mdi:account-group": "hugeicons:user-group", "mdi:account-multiple-outline": "hugeicons:user-multiple", "mdi:air-conditioner": "hugeicons:smart-ac", "mdi:air-fryer": "hugeicons:oven", "mdi:alert-circle-outline": "hugeicons:alert-circle", "mdi:apps": "hugeicons:grid-view", "mdi:arrow-left": "hugeicons:arrow-left-02", "mdi:autorenew": "hugeicons:refresh", "mdi:bed-king": "hugeicons:bed-double", "mdi:bed-king-outline": "hugeicons:bed-double", "mdi:bed-single": "hugeicons:bed-single-01", "mdi:bed-single-outline": "hugeicons:bed-single-01", "mdi:bookmark-music-outline": "hugeicons:bookmark-02", "mdi:calendar-month-outline": "hugeicons:calendar-03", "mdi:cctv": "hugeicons:cctv-camera", "mdi:ceiling-light-outline": "hugeicons:spotlight", "mdi:check": "hugeicons:tick-02", "mdi:checkbox-blank-circle": "hugeicons:circle", "mdi:chevron-down": "hugeicons:arrow-down-01", "mdi:chevron-left": "hugeicons:arrow-left-01", "mdi:chevron-right": "hugeicons:arrow-right-01", "mdi:chevron-up": "hugeicons:arrow-up-01", "mdi:chip": "hugeicons:chip", "mdi:circle-small": "hugeicons:circle-small", "mdi:clock-outline": "hugeicons:clock-01", "mdi:countertop": "hugeicons:kitchen-utensils", "mdi:cube-outline": "hugeicons:cube", "mdi:curtains": "hugeicons:curtains", "mdi:curtains-closed": "hugeicons:curtains", "mdi:database": "hugeicons:database", "mdi:desk": "hugeicons:desk", "mdi:desktop-classic": "hugeicons:computer", "mdi:desktop-tower": "hugeicons:computer", "mdi:dishwasher": "hugeicons:dish-washer", "mdi:dots-horizontal": "hugeicons:more-horizontal", "mdi:dots-horizontal-circle": "hugeicons:more-horizontal-circle-01", "mdi:dots-vertical": "hugeicons:more-vertical", "mdi:eye": "hugeicons:eye", "mdi:eye-off-outline": "hugeicons:view-off", "mdi:fan": "hugeicons:fan-01", "mdi:fan-auto": "hugeicons:fan-02", "mdi:fan-speed-1": "hugeicons:fan-01", "mdi:fan-speed-2": "hugeicons:fan-02", "mdi:fan-speed-3": "hugeicons:fan-02", "mdi:fire": "hugeicons:fire", "mdi:heart-outline": "hugeicons:favourite", "mdi:home": "hugeicons:home-03", "mdi:home-assistant": "hugeicons:home-03", "mdi:home-lightning-bolt-outline": "hugeicons:electric-home-01", "mdi:home-map-marker": "hugeicons:maps-location-01", "mdi:home-outline": "hugeicons:home-03", "mdi:home-variant": "hugeicons:home-03", "mdi:import": "hugeicons:file-import", "mdi:keyboard-backspace": "hugeicons:arrow-left-02", "mdi:led-strip-variant": "bruno:led-strip", "mdi:lightbulb": "hugeicons:bulb", "mdi:lightbulb-group": "hugeicons:bulb", "mdi:lightbulb-group-outline": "hugeicons:bulb", "mdi:lightbulb-off-outline": "hugeicons:lightbulb-off", "mdi:lightbulb-on": "hugeicons:bulb", "mdi:lightbulb-on-outline": "hugeicons:bulb", "mdi:lightbulb-outline": "hugeicons:bulb", "mdi:lightning-bolt": "hugeicons:flash", "mdi:lock": "hugeicons:lock", "mdi:lock-open-variant": "hugeicons:square-unlock-01", "mdi:lock-outline": "hugeicons:lock", "mdi:magnify-plus-outline": "hugeicons:zoom-in-area", "mdi:map-marker": "hugeicons:location-01", "mdi:map-marker-radius-outline": "hugeicons:location-03", "mdi:menu": "hugeicons:menu-01", "mdi:microphone-outline": "hugeicons:mic-01", "mdi:motion-sensor": "hugeicons:motion-01", "mdi:multimedia": "hugeicons:music-note-03", "mdi:music": "hugeicons:music-note-03", "mdi:music-note": "hugeicons:music-note-03", "mdi:noodles": "hugeicons:noodles", "mdi:pause": "line-md:pause", "mdi:play": "line-md:play", "mdi:play-pause": "line-md:play-to-pause-transition", "mdi:playlist-music": "hugeicons:playlist-01", "mdi:playlist-play": "hugeicons:playlist-01", "mdi:plus": "hugeicons:plus-sign", "mdi:power": "hugeicons:power", "mdi:power-plug-outline": "hugeicons:power-socket-01", "mdi:power-standby": "hugeicons:power", "mdi:pulse": "hugeicons:pulse-01", "mdi:radiobox-marked": "hugeicons:circle", "mdi:raspberry-pi": "hugeicons:cpu", "mdi:refresh": "hugeicons:refresh", "mdi:remote-tv": "hugeicons:remote-control", "mdi:restart": "hugeicons:list-restart", "mdi:robot-vacuum": "hugeicons:vacuum-cleaner", "mdi:router-wireless": "hugeicons:router-01", "mdi:run-fast": "hugeicons:workout-run", "mdi:shield-lock": "hugeicons:security-lock", "mdi:shield-lock-outline": "hugeicons:security-lock", "mdi:skip-next": "hugeicons:next", "mdi:skip-previous": "hugeicons:previous", "mdi:snowflake": "hugeicons:snow", "mdi:sofa": "hugeicons:sofa-01", "mdi:sofa-outline": "hugeicons:sofa-01", "mdi:sony-playstation": "hugeicons:game-controller-03", "mdi:speaker": "hugeicons:speaker-01", "mdi:speaker-wireless": "hugeicons:speaker-01", "mdi:spotify": "hugeicons:spotify", "mdi:stop": "hugeicons:stop", "mdi:string-lights": "hugeicons:lamp-04", "mdi:swap-vertical": "hugeicons:arrow-data-transfer-vertical", "mdi:television-classic": "hugeicons:tv-01", "mdi:thermometer": "hugeicons:thermometer", "mdi:thermostat": "hugeicons:thermometer", "mdi:thermostat-auto": "hugeicons:smart-ac", "mdi:timer-outline": "hugeicons:timer-01", "mdi:toggle-switch-outline": "line-md:switch", "mdi:toilet": "hugeicons:toilet-01", "mdi:update": "hugeicons:system-update-01", "mdi:video-off-outline": "hugeicons:video-off", "mdi:video-outline": "hugeicons:camera-video", "mdi:volume-medium": "line-md:volume-medium", "mdi:volume-minus": "line-md:volume-minus", "mdi:volume-mute": "line-md:volume-high-off", "mdi:volume-plus": "line-md:volume-plus", "mdi:wan": "hugeicons:internet", "mdi:washing-machine": "hugeicons:washing-machine", "mdi:water-percent": "hugeicons:humidity", "mdi:weather-night": "hugeicons:moon-02", "mdi:weather-sunset-down": "hugeicons:sunset", "mdi:weather-sunset-up": "hugeicons:sunset", "mdi:weather-windy": "hugeicons:fast-wind", "mdi:wifi": "hugeicons:wifi-01", "mdi:zigbee": "hugeicons:wireless", home: "hugeicons:home-03", music: "hugeicons:music-note-03", cameras: "hugeicons:cctv-camera", camera: "hugeicons:camera-video", system: "hugeicons:chip", vacuum: "hugeicons:vacuum-cleaner", network: "hugeicons:wifi-01", refresh: "hugeicons:refresh", scenes: "hugeicons:grid-view", updates: "hugeicons:system-update-01", floorplan: "hugeicons:maps", settings: "hugeicons:settings-01", monitor: "hugeicons:computer", power: "hugeicons:power", more: "hugeicons:more-horizontal-circle-01", sala: "hugeicons:sofa-01", office: "hugeicons:computer-desk-01", cozinha: "hugeicons:kitchen-utensils", lavabo: "hugeicons:toilet-01", casal: "hugeicons:bed-double", marina: "hugeicons:bed-single-01", miguel: "hugeicons:baby-bed-01", circle: "hugeicons:circle", lights_off: "hugeicons:lightbulb-off", wifi: "hugeicons:wifi-01", movies: "hugeicons:film-01", laptop: "hugeicons:laptop", sofa: "hugeicons:sofa-01", palette: "hugeicons:paint-board", wallpaper: "hugeicons:image-01", spotify: "hugeicons:spotify", tv: "hugeicons:tv-01", climate: "hugeicons:smart-ac", motion: "hugeicons:motion-01", homepod: "hugeicons:speaker-01", living_sofa: "hugeicons:sofa-01", ledstrip: "bruno:led-strip", pendant: "hugeicons:candelier-02", sconce: "hugeicons:lamp-wall-up", light_flush: "hugeicons:bulb", curtain: "hugeicons:curtains", "curtain-open": "hugeicons:curtains", "curtain-close": "hugeicons:curtains", "curtain-stop": "hugeicons:stop", "meeting-off": "hugeicons:video-off" }), i = Object.freeze({
    "close-to-menu-transition": "menu",
    "menu-to-close-transition": "close",
    "pause-to-play-transition": "play",
    "play-to-pause-transition": "pause",
    "switch-off-to-switch-transition": "switch",
    "switch-to-switch-off-transition": "switch-off"
  }), r = (c) => String(c ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;"), n = (c, p = {}) => {
    const d = String(c || "circle").trim().toLowerCase(), h = a[d] || d;
    let [b, u] = h.includes(":") ? h.split(":", 2) : ["hugeicons", h];
    return b === "line-md" && !p.animate && i[u] && (u = i[u]), b === "bruno" && t[u] ? { family: b, name: u, body: t[u], width: 24, height: 24 } : b === "line-md" && e[u] ? { family: b, name: u, ...e[u] } : o[u] ? { family: "hugeicons", name: u, ...o[u] } : { family: "hugeicons", name: "circle", ...o.circle };
  }, s = (c, p = {}) => {
    const d = n(c, p), h = p.className ? ` class="${r(p.className)}"` : "", b = Number(p.size), u = Number.isFinite(b) && b > 0 ? ` width="${b}" height="${b}"` : "", g = p.title ? `<title>${r(p.title)}</title>` : "", f = p.title ? "false" : "true";
    return `<svg${h}${u} viewBox="0 0 ${d.width} ${d.height}" aria-hidden="${f}" focusable="false" data-bruno-icon="${d.family}:${d.name}">${g}${d.body}</svg>`;
  };
  class l extends HTMLElement {
    static get observedAttributes() {
      return ["icon", "animate", "label"];
    }
    connectedCallback() {
      this._render();
    }
    attributeChangedCallback() {
      this.isConnected && this._render();
    }
    _render() {
      this.shadowRoot || this.attachShadow({ mode: "open" });
      const p = this.getAttribute("label") || "";
      this.shadowRoot.innerHTML = `
        <style>
          :host {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: var(--mdc-icon-size, 1em);
            height: var(--mdc-icon-size, 1em);
            min-width: 0;
            min-height: 0;
            color: inherit;
            line-height: 0;
            flex: 0 0 auto;
            vertical-align: middle;
          }
          svg { width: 100%; height: 100%; display: block; overflow: visible; }
        </style>
        ${s(this.getAttribute("icon"), {
        animate: this.hasAttribute("animate"),
        title: p
      })}
      `;
    }
  }
  globalThis.BrunoIcons = Object.freeze({
    aliases: a,
    render: s,
    resolve: n,
    hugeicons: o,
    lineMd: e
  }), customElements.get("bruno-icon") || customElements.define("bruno-icon", l);
})();
const ct = "bento-sidebar-liquid-card";
class q extends HTMLElement {
  // Estados que NAO contam como atividade, para o microindicador da rail.
  static estadosInativos = /* @__PURE__ */ new Set([
    "",
    "off",
    "idle",
    "standby",
    "closed",
    "not_home",
    "unknown",
    "unavailable",
    "none"
  ]);
  static getStubConfig() {
    return {
      top_items: q.defaultTopItems,
      bottom_items: q.defaultBottomItems
    };
  }
  setConfig(e) {
    this._config = {
      top_items: q.defaultTopItems,
      bottom_items: q.defaultBottomItems,
      ...e
    }, this._render();
  }
  set hass(e) {
    this._hass = e, this._syncIndicators(), this._syncOverflowHint();
  }
  // ── MICROINDICADOR DE ATIVIDADE ABAIXO DA DOBRA (2026-08-16) ─────────────
  //
  // Substitui a linha textual que ocupava uma faixa do grid de comodos. Ali ela
  // somava 30px de vao entre a 2a e a 3a faixa contra 8px das demais, e o vao
  // permanecia durante a rolagem, quando o indicador ja estava oculto.
  //
  // Aqui ele e ABSOLUTO sobre a rail: aparecer e sumir nao altera dimensao,
  // gap ou posicao de nada — nem do grid, nem dos botoes.
  //
  // O contador e de AMBIENTES com atividade, nao de eventos.
  //
  // ROLLBACK: remover este metodo, _contarAmbientesAtivos, _entidadeRelevante,
  // _ligarRolagemDaHome, _acharContainerDeRolagem, o markup .overflow-hint e o
  // bloco de CSS correspondente.
  _entidadeRelevante(e) {
    const t = e ? this._hass?.states?.[e] : void 0;
    if (!t) return !1;
    const a = String(t.state || "").toLowerCase(), i = String(e).split(".")[0];
    return ["binary_sensor", "light", "switch"].includes(i) ? a === "on" : i === "media_player" ? ["playing", "paused", "buffering", "on"].includes(a) : !q.estadosInativos.has(a);
  }
  _contarAmbientesAtivos() {
    const e = this._config?.overflow_hint?.rooms;
    return Array.isArray(e) ? e.filter((t) => (Array.isArray(t?.entities) ? t.entities : []).some((i) => this._entidadeRelevante(i))).length : 0;
  }
  _syncOverflowHint() {
    if (!Array.isArray(this._config?.overflow_hint?.rooms)) return;
    const e = this.shadowRoot?.querySelector(".overflow-hint");
    if (!e) return;
    const t = this._contarAmbientesAtivos();
    e.hidden = t === 0;
    const a = e.querySelector(".overflow-hint-count");
    a && a.textContent !== String(t) && (a.textContent = String(t)), this._ligarRolagemDaHome();
  }
  /**
   * Some ao rolar, volta no topo.
   *
   * A rail vive no rail-slot da shell; quem rola e o content-slot, que e irmao
   * dela. Subir por parentNode para no primeiro shadow root, dai o salto pelo
   * host. Sem requestAnimationFrame: com a aba em segundo plano ele nao dispara
   * e o vinculo nunca seria feito.
   */
  _acharContainerDeRolagem() {
    let e = this.parentNode;
    for (; e; ) {
      if (e instanceof ShadowRoot) {
        const t = e.querySelector?.(".content-slot");
        if (t) return t;
        e = e.host;
        continue;
      }
      if (e instanceof HTMLElement) {
        e = e.parentNode;
        continue;
      }
      break;
    }
    return null;
  }
  _ligarRolagemDaHome() {
    if (this._alvoDeRolagem) return;
    this._aoRolarHome || (this._aoRolarHome = () => {
      const t = (this._alvoDeRolagem?.scrollTop ?? 0) > 6;
      if (t === this._rolouHome) return;
      this._rolouHome = t;
      const a = this.shadowRoot?.querySelector(".overflow-hint");
      a && a.classList.toggle("is-scrolled", t);
    });
    const e = this._acharContainerDeRolagem();
    e && (this._alvoDeRolagem = e, e.addEventListener("scroll", this._aoRolarHome, { passive: !0 }), this._aoRolarHome());
  }
  getCardSize() {
    return 4;
  }
  _items(e) {
    const t = this._config?.[e];
    return Array.isArray(t) ? t : [];
  }
  _handleAction(e) {
    const t = e?.tap_action || e?.action || { action: "none" };
    switch (t.action) {
      case void 0:
      case "none":
        return;
      case "navigate":
        this._navigate(t.navigation_path || t.path);
        return;
      case "url":
        this._openUrl(t.url_path || t.url);
        return;
      case "call-service":
        this._callService(t);
        return;
      case "more-info":
        this._moreInfo(t.entity || e.entity);
        return;
      case "fire-dom-event":
        this._fireDomEvent(t);
        return;
      default:
        console.warn("bento-sidebar-card: unsupported action", t);
    }
  }
  // --- CÓDIGO ORIGINAL COMENTADO (so disparava hass-navigate; nao roteava no HA) ---
  // _navigate(path) {
  //   if (!path) return;
  //   this.dispatchEvent(new CustomEvent('hass-navigate', {
  //     detail: { path },
  //     bubbles: true,
  //     composed: true,
  //   }));
  // }
  // --- FIM CÓDIGO ORIGINAL ---
  // NOVO: mesmo mecanismo das subviews (bruno-*-subview.js). Alem do evento
  // hass-navigate, faz history.pushState + location-changed (que o roteador do
  // HA realmente reconhece) e resolve paths relativos contra o dashboard atual.
  _navigate(e) {
    if (!e) return;
    const t = this._resolveNavigationPath(e);
    this.dispatchEvent(new CustomEvent("hass-navigate", {
      detail: { path: t },
      bubbles: !0,
      composed: !0
    })), globalThis.setTimeout?.(() => {
      !t || globalThis.location?.pathname === t || (globalThis.history?.pushState?.(null, "", t), globalThis.dispatchEvent?.(new CustomEvent("location-changed", { detail: { replace: !1 } })));
    }, 80);
  }
  _resolveNavigationPath(e) {
    return e ? e.startsWith("/") ? e : `/${(globalThis.location?.pathname || "").split("/").filter(Boolean)[0] || "ngocjohn-main"}/${e}` : "/";
  }
  _openUrl(e) {
    e && window.open(e, "_blank", "noopener,noreferrer");
  }
  _callService(e) {
    if (!this._hass || !e.service) return;
    const [t, a] = e.service.split(".");
    !t || !a || this._hass.callService(
      t,
      a,
      e.service_data || e.data || {},
      e.target || {}
    );
  }
  _moreInfo(e) {
    e && this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  _fireDomEvent(e) {
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: e,
      bubbles: !0,
      composed: !0
    }));
  }
  _render() {
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = [
      ...this._items("top_items").map((l, c) => ({ item: l, section: "top", index: c })),
      ...this._items("bottom_items").map((l, c) => ({ item: l, section: "bottom", index: c }))
    ].filter((l) => l.item?.hide_on_phone), t = this._config?.phone_more || {}, a = Array.isArray(t.keys) ? t.keys.map(String) : null, i = a ? e.filter((l) => a.indexOf(String(l.item?.key)) !== -1) : e, r = q._escape(t.label || "Mais"), n = q.icons[t.icon || "more"] || q.icons.more, s = q._escape(
      i.map((l) => l.item?.key).filter(Boolean).join(" ")
    );
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --rail-width: 56px;
          --rail-radius: 999px;
          --rail-padding-top: 13px;
          --rail-padding-bottom: 14px;
          --button-size: 39px;
          --button-radius: 999px;
          --icon-size: 19px;
          --group-gap: 8px;
          --glass-line: rgba(255,255,255,0.14);
          --glass-line-soft: rgba(255,255,255,0.07);
          --icon-neutral: rgba(255,255,255,0.74);
          --icon-active: rgba(245,250,255,0.96);
          --accent: 150, 190, 255;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          margin: 0;
          padding: 0;
          contain: layout style;
        }

        .rail {
          width: var(--rail-width);
          height: auto;
          min-height: 0;
          max-height: calc(100% - 6px);
          box-sizing: border-box;
          position: relative;
          isolation: isolate;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: var(--rail-padding-top) 0 var(--rail-padding-bottom);
          background: var(--bruno-liquid-rail-background,
            radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
            radial-gradient(38px 110px at 92% 86%, rgba(var(--accent),0.10), transparent 68%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
            linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
          );
          backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
          -webkit-backdrop-filter: var(--bruno-liquid-rail-filter, blur(30px) saturate(1.58) contrast(1.05));
          border: var(--bruno-liquid-rail-border, 1px solid rgba(255,255,255,0.11));
          border-radius: var(--rail-radius);
          box-shadow: var(--bruno-liquid-rail-shadow,
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 1px 0 0 rgba(255,255,255,0.12),
            inset -1px -1px 0 rgba(255,255,255,0.030),
            0 18px 44px rgba(0,0,0,0.24),
            0 0 24px rgba(110,150,210,0.08)
          );
          overflow: hidden;
        }

        .rail::before {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .rail::before {
          inset: 1px;
          border-radius: calc(var(--rail-radius) - 1px);
          background: var(--bruno-liquid-rail-sheen,
            radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
            radial-gradient(42px 70px at 94% 18%, rgba(var(--accent),0.16), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
            linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-rail-sheen-opacity, 0.78);
        }

        .group {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: var(--group-gap);
          flex: 0 0 auto;
          position: relative;
          z-index: 1;
        }

        .spacer {
          display: none;
        }

        .divider {
          position: relative;
          z-index: 1;
          width: 30px;
          height: 1px;
          margin: 8px 0;
          flex: 0 0 auto;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.20), transparent);
          box-shadow: 0 1px 0 rgba(0,0,0,0.18);
          opacity: 0.72;
        }

        .nav-button {
          width: var(--button-size);
          height: var(--button-size);
          min-width: var(--button-size);
          min-height: var(--button-size);
          max-width: var(--button-size);
          max-height: var(--button-size);
          box-sizing: border-box;
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          color: var(--icon-neutral);
          background: transparent;
          border: 1px solid transparent;
          border-radius: var(--button-radius);
          box-shadow: none;
          outline: none;
          cursor: pointer;
          appearance: none;
          -webkit-appearance: none;
          line-height: 0;
          overflow: hidden;
          transition:
            background 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease,
            color 160ms ease,
            transform 160ms ease;
        }

        .nav-button::before,
        .nav-button::after {
          content: "";
          position: absolute;
          pointer-events: none;
          opacity: 0;
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .nav-button::before {
          inset: 1px;
          border-radius: calc(var(--button-radius) - 1px);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 58%),
            linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00));
          transform: translateY(-3px);
        }

        .nav-button::after {
          left: 50%;
          bottom: 4px;
          width: 12px;
          height: 2px;
          border-radius: 999px;
          background: rgba(var(--accent), 0.92);
          box-shadow: 0 0 12px rgba(var(--accent), 0.70);
          transform: translateX(-50%) scaleX(0.62);
        }

        .nav-button:hover {
          color: rgba(255,255,255,0.90);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.040));
          border-color: rgba(255,255,255,0.13);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.11),
            0 6px 14px rgba(0,0,0,0.16);
        }

        .nav-button:hover::before {
          opacity: 0.72;
          transform: translateY(0);
        }

        .nav-button:active {
          transform: translateY(1px) scale(0.98);
        }

        .nav-button.is-pressed {
          transform: scale(0.96);
        }

        .nav-button:focus-visible {
          border-color: rgba(var(--accent), 0.52);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.12),
            0 0 0 3px rgba(var(--accent), 0.16);
        }

        .nav-button[aria-disabled="true"] {
          cursor: default;
        }

        .nav-button[aria-disabled="true"]:active {
          transform: none;
        }

        .nav-button.selected {
          color: white;
          background: var(--bruno-liquid-selected-blue-background,
            radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 62%),
            linear-gradient(180deg, rgba(105,150,230,0.68), rgba(59,92,178,0.54))
          );
          border-color: var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.38));
          box-shadow: var(--bruno-liquid-selected-blue-shadow,
            inset 0 1px 0 rgba(255,255,255,0.32),
            0 0 20px rgba(96,165,250,0.32)
          );
          animation: selected-breathe 4.8s ease-in-out infinite;
        }

        .nav-button.selected::before {
          opacity: 0;
        }

        .nav-button.selected::after {
          opacity: 0;
        }

        .nav-button.selected:hover {
          background:
            radial-gradient(circle at 50% 18%, rgba(168,202,255,0.58), transparent 62%),
            linear-gradient(180deg, rgba(118,164,242,0.72), rgba(66,100,190,0.58));
        }

        .nav-button svg {
          width: var(--icon-size);
          height: var(--icon-size);
          display: block;
          flex: 0 0 var(--icon-size);
          fill: none;
          stroke: currentColor;
          stroke-width: 1.55;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
          position: relative;
          z-index: 1;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));
        }

        @keyframes selected-breathe {
          0%, 100% {
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.22),
              inset 0 -1px 0 rgba(255,255,255,0.06),
              0 8px 18px rgba(0,0,0,0.24),
              0 0 18px rgba(var(--accent),0.16);
          }
          50% {
            box-shadow:
              inset 0 1px 0 rgba(255,255,255,0.25),
              inset 0 -1px 0 rgba(255,255,255,0.08),
              0 10px 22px rgba(0,0,0,0.26),
              0 0 28px rgba(var(--accent),0.28);
          }
        }

        @media (max-height: 760px) {
          :host {
          --rail-padding-top: 8px;
          --rail-padding-bottom: 9px;
          --group-gap: 5px;
          }
        }

        @media (max-height: 690px), (max-width: 900px) {
          :host {
            --rail-width: 50px;
            --button-size: 35px;
            --icon-size: 17px;
            --group-gap: 6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .nav-button,
          .nav-button::before,
          .nav-button::after,
          .nav-button.selected {
            animation: none !important;
            transition: none !important;
          }
        }

        /* ============================================================
           NOVO — CAMINHO 2 (rail rente, integrado, com rótulos e
           seleção discreta). Bloco ADITIVO (regra de ouro): fica ABAIXO
           e sobrepõe o visual de pílula flutuante definido acima, sem
           apagar nada. ROLLBACK: remover este bloco + o <span class="nav-label">
           em _button() => volta à pílula só-ícone original.
           ============================================================ */
        :host {
          --rail-width: 86px;
          --button-radius: 13px;
          /* NOVO (2026-08-04) — feedback do usuario: os icones ficam pequenos no
             tablet. O ALVO DE TOQUE nunca foi o problema (medido: 70x51px, acima
             dos 48dp do Android e dos 44pt do iOS) — pequeno era o GLIFO.
             19 -> 24px cresce o botao para 70x56 e a rail passa a precisar de
             666px numa coluna de 720: folga de 54px, sem transbordar.
             NAO mexe na largura da coluna (86px), entao a area de conteudo e as
             seis subviews ficam intocadas.
             Abaixo de 690px de altura a media query no fim deste arquivo reduz
             para 18px, e isso continua valendo.
             ANTERIOR (rollback): esta linha nao existia — herdava os 19px do
             bloco base. Medicao: scripts/harness/rail-size.src.html */
          --icon-size: 24px;
          --icon-neutral: rgba(255,255,255,0.60);
          /* NOVO: espaçamento uniforme um pouco maior (era 8px) agora que os
             separadores foram removidos. */
          --group-gap: 10px;
          align-items: stretch;
          justify-content: stretch;
        }
        .rail {
          width: 100%;
          height: 100%;
          max-height: none;
          justify-content: flex-start;
          padding: 14px 8px 12px;
          /* TRANSPARENTE: a legibilidade do rail sobre a foto é garantida pela
             BORDA ATMOSFÉRICA escurecida do backdrop (vinheta na shell), não por
             faixa/blur aqui. Rail funde com a imagem. */
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          border: none;
          border-radius: 0;               /* sem pílula */
          box-shadow: none;
        }
        .rail::before { display: none; }  /* remove o brilho/sheen da cápsula */
        .group { align-items: stretch; }
        .spacer { display: block; flex: 1 1 auto; }  /* empurra o grupo inferior p/ baixo */
        .divider { width: 64%; margin: 8px auto; }
        .nav-button {
          width: 100%;
          height: auto;
          min-width: 0; min-height: 0; max-width: none; max-height: none;
          flex-direction: column;
          gap: 4px;
          padding: 8px 2px 7px;
          border-radius: var(--button-radius);
          line-height: 0;
          -webkit-tap-highlight-color: transparent;  /* sem flash de toque no tablet */
        }
        .nav-button::before,
        .nav-button::after { display: none; }   /* sem brilho/sublinhado */
        /* hover/foco/toque DISCRETOS e IGUAIS em PC e tablet. */
        .nav-button:hover,
        .nav-button:focus,
        .nav-button:focus-visible {
          background: rgba(255,255,255,0.05);
          border-color: transparent;
          box-shadow: none;
          outline: none;
        }
        /* seleção DISCRETA. IMPORTANTE incluir :hover/:focus do selecionado —
           no tablet o toque dispara :hover "grudado" (sticky hover) e sem isto o
           azul ANTIGO de .selected:hover reaparecia (so no toque). */
        .nav-button.selected,
        .nav-button.selected:hover,
        .nav-button.selected:focus,
        .nav-button.selected:focus-visible {
          background: rgba(255,255,255,0.085);
          border-color: transparent;
          box-shadow: none;
          animation: none;
        }
        .nav-button.selected svg,
        .nav-button.selected:hover svg { stroke: rgb(var(--accent)); }
        .nav-label {
          display: block;
          margin-top: 1px;
          font-size: 9.5px;
          line-height: 1.05;
          font-weight: 600;
          color: inherit;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-align: center;
        }

        .nav-indicator {
          position: absolute;
          top: 5px;
          right: 7px;
          z-index: 3;
          display: grid;
          place-items: center;
          pointer-events: none;
          color: rgba(255,255,255,0.96);
          background: rgba(var(--accent),0.92);
          box-shadow: 0 0 9px rgba(var(--accent),0.36);
        }

        .nav-indicator[hidden] {
          display: none;
        }

        .nav-indicator[data-kind="dot"] {
          width: 7px;
          height: 7px;
          border-radius: 50%;
        }

        .nav-indicator[data-kind="count"] {
          min-width: 16px;
          height: 16px;
          padding: 0 4px;
          border-radius: 999px;
          font-size: 8px;
          line-height: 1;
          font-weight: 900;
        }
        /* UNIFORMIDADE GLOBAL DOS STATUS (2026-08-15).
           Mantem as dimensoes aprovadas dos botoes da rail. Somente o inicio
           do grupo superior sobe 6px para que o centro do Home coincida com o
           centro da primeira tile de 46px da Home e das subviews. */
        @media (min-width: 801px) {
          .rail { padding-top: 8px; }
        }
        /* sobrepõe a media query que estreitava o rail (50px) p/ manter rótulo */
        @media (max-height: 690px), (max-width: 900px) {
          :host { --rail-width: 86px; --button-size: 36px; --icon-size: 18px; }
        }

        /* ============================================================
           NOVO (2026-07-09) — MODO DOCK (phone <=800px, Opcao A mobile).
           A MESMA rail "deita" na horizontal e vira o dock inferior da
           bruno-shell (que no phone move o .rail-slot para a base).
           Bloco ADITIVO (regra de ouro): nada acima foi alterado; este
           @media apenas sobrepoe o layout vertical em telas estreitas.
           Itens com hide_on_phone: true no YAML somem do dock (ficam
           acessiveis so no tablet/desktop).
           ROLLBACK: remover este bloco @media (e, se desejar, os
           hide_on_phone do rail.yaml) => rail volta a ser vertical
           em qualquer largura.
           ============================================================ */
        /* Botao/menu "Mais" sao um recurso EXCLUSIVO do dock phone:
           fora do breakpoint ficam ocultos (a rail vertical mostra tudo). */
        .more-button,
        .more-sheet {
          display: none;
        }

        /* Fora do telefone o microindicador nao existe: a nocao de ambientes
           ocultos abaixo da dobra e exclusiva do dock. */
        .overflow-hint { display: none; }

        @media (max-width: 800px) {
          :host {
            --button-radius: 12px;
            /* NOVO (2026-08-13): +2px no icone sem alterar a altura da rail.
               ROLLBACK: remover esta linha restaura os 18px herdados da media
               query anterior. O padding do botao abaixo compensa exatamente
               esses 2px e preserva o filete e a geometria do dock. */
            --icon-size: 20px;
            position: relative;
          }
          /* ── MICROINDICADOR DE ATIVIDADE (2026-08-16) ─────────────────
             Absoluto sobre a rail: aparecer e sumir nao muda dimensao, gap
             nem posicao de nada. Fica ACIMA e a direita do botao Mais, com
             folga suficiente para nao ler como badge dele.
             So no telefone: fora deste media query o elemento nem existe. */
          /* Ancorado no canto superior direito da rail e projetado para CIMA:
             bottom: 100% poe a base do conjunto exatamente sobre o filete, e a
             margem abre a folga pedida. Fica acima e a direita do botao Mais,
             em diagonal — nao encosta nele e nao le como badge dele.

             Nada aqui participa do fluxo: aparecer e sumir nao desloca botao,
             nao muda a altura da rail e nao toca no filete nem na safe area. */
          .overflow-hint {
            position: absolute;
            bottom: 100%;
            margin-bottom: 3px;
            right: 10px;
            z-index: 3;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 1px;
            pointer-events: none;
            transition: opacity 140ms ease;
          }
          /* Some ao rolar por OPACIDADE: com display/visibility haveria troca
             de caixa, e o pedido e sumir sem reflow. */
          .overflow-hint[hidden] { display: none; }
          .overflow-hint.is-scrolled { opacity: 0; }

          .overflow-hint-dot {
            width: 17px;
            height: 17px;
            border-radius: 50%;
            display: grid;
            place-items: center;
            background: var(--bruno-accent-amber, #f7c600);
            box-shadow: 0 0 9px rgba(247, 198, 0, 0.42);
          }

          .overflow-hint-count {
            font: 700 11px/1 system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
            color: rgba(12, 14, 20, 0.92);
          }

          .overflow-hint-chevron {
            width: 11px;
            height: 11px;
            color: rgba(247, 198, 0, 0.8);
          }

          .rail {
            flex-direction: row;
            align-items: center;
            /* flex-start (nao space-evenly): com overflow horizontal,
               distribuicoes centradas deixam os itens da ESQUERDA fora do
               alcance do scroll. A distribuicao uniforme fica no .group.top. */
            justify-content: flex-start;
            width: 100%;
            height: auto;
            max-height: none;
            padding: 6px 8px calc(7px + env(safe-area-inset-bottom, 0px));
            overflow-x: auto;
            overflow-y: hidden;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: none;
          }
          .rail::-webkit-scrollbar { display: none; }

          /* ============================================================
             NOVO (2026-08-12) — RAIL PHONE SEM CONTAINER EXTERNO.
             O bloco "Caminho 2" acima ja deixa a superficie transparente,
             mas aqui a regra fica explicita e confinada ao breakpoint phone:
             nem variaveis de tema nem o estado de bottom sheet podem
             reintroduzir fundo, blur, borda, sombra ou raio de capsula.
             ANTERIOR (rollback): o dock herdava somente o visual de .rail do
             bloco "Caminho 2"; remover este trecho restaura essa heranca.
             ============================================================ */
          :host,
          .rail {
            background: transparent;
            border: 0;
            border-radius: 0;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
          }
          .rail::before {
            display: none;
          }

          .group {
            width: auto;
            flex-direction: row;
            align-items: center;
            gap: 2px;
          }
          /* grupo superior espalha os itens pela largura toda quando cabem;
             grupo inferior (Power, oculto no phone) nao rouba espaco. */
          .group.top {
            flex: 1 1 auto;
            justify-content: space-evenly;
          }
          .group.bottom { flex: 0 0 auto; }
          .spacer { display: none; }
          .divider { width: 1px; height: 24px; margin: 0 6px; }
          .nav-button {
            width: auto;
            min-width: 50px;
            flex: 0 0 auto;
            /* ANTERIOR (rollback): padding: 6px 6px 5px. A soma vertical
               permanece identica; o conjunto icone+rotulo desce 2px. */
            padding: 8px 6px 1px;
          }
          .nav-button[data-hide-phone] { display: none; }
          .nav-label { font-size: 9px; }

          .more-button {
            display: inline-flex;
          }

          /* ============================================================
             NOVO (rev. faixa-de-tiles) — ITEM ATIVO SEM MOLDURA (item 17).
             O roteiro e explicito: a rail nao pode parecer pill/dock/card, e
             o item ativo nao pode virar um card em torno de si. No dock o
             fundo de .selected era justamente esse retangulo. Ele sai e o
             ativo passa a ser marcado por COR DE ACENTO + um indicador
             pequeno acima do icone.
             So no telefone: a rail vertical do tablet mantem o fundo.
             ROLLBACK: remover este trecho ate o fim do comentario de fecho.
             ============================================================ */
          .nav-button.selected,
          .nav-button.selected:hover,
          .nav-button.selected:focus,
          .nav-button.selected:focus-visible,
          .nav-button.more-button.is-open {
            background: transparent;
            border-color: transparent;
            box-shadow: none;
          }
          .nav-button.selected .nav-label {
            color: rgb(var(--accent));
          }
          .nav-button.selected::after {
            content: "";
            display: block;
            position: absolute;
            top: 1px;
            left: 50%;
            width: 14px;
            height: 2px;
            border-radius: 999px;
            transform: translateX(-50%);
            background: rgb(var(--accent));
            box-shadow: 0 0 8px rgba(var(--accent), 0.55);
          }
          /* O menu aberto e ESTADO, nao selecao: acende so o glifo. */
          .nav-button.more-button.is-open svg {
            stroke: rgb(var(--accent));
          }
          /* ===== fim do trecho "item ativo sem moldura" ===== */

          /* Menu suspenso acima do dock com os itens hide_on_phone.
             :not([hidden]) preserva o toggle via atributo hidden. */
          .more-sheet:not([hidden]) {
            display: flex;
          }

          .more-sheet {
            position: absolute;
            right: 10px;
            bottom: calc(100% + 10px);
            z-index: 30;
            min-width: 216px;
            flex-direction: column;
            gap: 2px;
            padding: 8px;
            border-radius: 18px;
            border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
            background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.86), rgba(12,13,16,0.82)));
            box-shadow: var(--bruno-liquid-popup-shadow, 0 18px 36px rgba(0,0,0,0.38));
            -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
            backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
          }

          .more-item {
            appearance: none;
            -webkit-appearance: none;
            display: grid;
            grid-template-columns: 22px minmax(0, 1fr) auto;
            align-items: center;
            column-gap: 10px;
            padding: 10px 10px;
            margin: 0;
            text-align: left;
            color: rgba(255,255,255,0.86);
            font-size: 12.5px;
            font-weight: 600;
            background: transparent;
            border: 0;
            border-radius: 12px;
            cursor: pointer;
            -webkit-tap-highlight-color: transparent;
          }

          .more-item:active {
            background: rgba(255,255,255,0.08);
          }

          .more-item svg {
            width: 18px;
            height: 18px;
            fill: none;
            stroke: currentColor;
            stroke-width: 1.55;
            stroke-linecap: round;
            stroke-linejoin: round;
          }

          .more-item .nav-indicator {
            position: static;
          }
        }
      </style>
      <div class="rail" role="navigation" aria-label="Bento sidebar">
        <div class="group top">
          ${this._items("top_items").map((l, c) => this._button(l, "top", c)).join("")}
          ${i.length ? `
            <button class="nav-button more-button" type="button" title="${r}" aria-label="${r}" data-more-toggle data-group-keys="${s}">
              ${n}
              <span class="nav-label">${r}</span>
            </button>
          ` : ""}
        </div>
        <div class="spacer" aria-hidden="true"></div>
        <div class="group bottom">
          ${this._items("bottom_items").map((l, c) => this._button(l, "bottom", c)).join("")}
        </div>
      </div>
      <!-- Microindicador: irmao da .rail, nao filho — a .rail tem
           overflow-x: auto e recortaria um filho absoluto. -->
      <div class="overflow-hint" role="status" aria-label="Ambientes com atividade abaixo" hidden>
        <span class="overflow-hint-dot"><span class="overflow-hint-count">0</span></span>
        <svg class="overflow-hint-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      ${i.length ? `
        <div class="more-sheet" id="moreSheet" hidden>
          ${i.map(({ item: l, section: c, index: p }) => `
            <button class="more-item" type="button" data-section="${c}_items" data-index="${p}">
              ${q.icons[l?.icon] || q.icons.circle}
              <span>${q._escape(l?.label || l?.key || "Item")}</span>
              ${this._indicatorMarkup(l)}
            </button>
          `).join("")}
        </div>
      ` : ""}
    `, this.shadowRoot.querySelectorAll(".nav-button").forEach((l) => {
      l.addEventListener("click", () => {
        l.classList.add("is-pressed"), window.setTimeout(() => l.classList.remove("is-pressed"), 180), l.hasAttribute("data-more-toggle") || this._closeMoreSheet();
        const c = l.dataset.section, p = Number(l.dataset.index), d = this._items(c)[p];
        this._handleAction(d);
      });
    }), this._moreSheetEl = this.shadowRoot.getElementById("moreSheet"), this._moreToggleEl = this.shadowRoot.querySelector("[data-more-toggle]"), this._moreToggleEl && this._moreSheetEl && (this._moreToggleEl.addEventListener("click", () => {
      const l = this._moreSheetEl.hidden;
      this._moreSheetEl.hidden = !l, this._moreToggleEl.classList.toggle("is-open", l);
    }), this._moreSheetEl.querySelectorAll(".more-item").forEach((l) => {
      l.addEventListener("click", () => {
        const c = this._items(l.dataset.section)[Number(l.dataset.index)];
        this._closeMoreSheet(), this._handleAction(c);
      });
    })), this._syncIndicators();
  }
  // NOVO (2026-07-09) — Fase 2 mobile: fecha o menu "Mais" do dock.
  _closeMoreSheet() {
    this._moreSheetEl && !this._moreSheetEl.hidden && (this._moreSheetEl.hidden = !0), this._moreToggleEl?.classList.remove("is-open");
  }
  _button(e, t, a) {
    const i = e?.selected ? " selected" : "", r = q._escape(e?.label || e?.key || e?.icon || "Item"), n = q.icons[e?.icon] || q.icons.circle, c = (e?.tap_action || e?.action || {}).action === "none" ? ' aria-disabled="true" tabindex="-1"' : "";
    return `
      <button
        class="nav-button${i}"
        type="button"
        title="${r}"
        aria-label="${r}"
        data-section="${t}_items"
        data-index="${a}"
        data-key="${q._escape(e?.key || "")}"
        ${e?.hide_on_phone ? 'data-hide-phone=""' : ""}
        ${c}
      >
        ${n}
        <!-- NOVO (Caminho 2): rótulo sob o ícone. Rollback: remover este span
             e o bloco de estilo "Caminho 2" no <style>. -->
        <span class="nav-label">${r}</span>
        ${this._indicatorMarkup(e)}
      </button>
      ${e?.divider_after ? '<span class="divider" aria-hidden="true"></span>' : ""}
    `;
  }
  _indicatorMarkup(e) {
    if (!e?.indicator) return "";
    const t = this._indicatorModel(e);
    return `<span class="nav-indicator" data-kind="${t.kind}" ${t.active ? "" : "hidden"}>${t.text}</span>`;
  }
  _indicatorModel(e) {
    const t = e?.indicator || {};
    if (t.type === "updates") {
      const s = this._hass?.states || {}, l = Object.entries(s).filter(([d, h]) => d.startsWith("update.") && h?.state === "on").length, c = Number(s["sensor.hassio_updates_available"]?.state) || 0, p = Math.max(l, c);
      return {
        active: p > 0,
        kind: "count",
        text: p > 99 ? "99+" : String(p)
      };
    }
    const a = this._hass?.states?.[t.entity], i = t.attribute ? a?.attributes?.[t.attribute] : a?.state;
    if (t.type === "count") {
      const s = Math.max(0, Number.parseInt(i, 10) || 0);
      return {
        active: s > 0,
        kind: "count",
        text: s > 99 ? "99+" : String(s)
      };
    }
    return { active: (Array.isArray(t.active_states) ? t.active_states : ["on"]).includes(String(i ?? "").toLowerCase()), kind: "dot", text: "" };
  }
  _syncIndicators() {
    const e = this.shadowRoot;
    e && e.querySelectorAll("[data-section][data-index]").forEach((t) => {
      const a = this._items(t.dataset.section)[Number(t.dataset.index)];
      if (!a?.indicator) return;
      const i = t.querySelector(".nav-indicator");
      if (!i) return;
      const r = this._indicatorModel(a);
      i.dataset.kind = r.kind, i.textContent = r.text, i.hidden = !r.active;
    });
  }
  static _escape(e) {
    return String(e).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
q.defaultTopItems = [
  { key: "home", icon: "home", label: "Home", selected: !0, tap_action: { action: "none" } },
  { key: "music", icon: "music", label: "Musica", tap_action: { action: "navigate", navigation_path: "/lovelace/mass-media" } }
];
q.defaultBottomItems = [
  { key: "power", icon: "power", label: "Power", tap_action: { action: "navigate", navigation_path: "/" } }
];
q.icons = new Proxy({}, {
  get(o, e) {
    return globalThis.BrunoIcons?.render(String(e || "circle")) || globalThis.BrunoIcons?.render("circle") || "";
  }
});
customElements.get(ct) || customElements.define(ct, q);
window.customCards = window.customCards || [];
window.customCards.push({
  type: ct,
  name: "Bento Sidebar Card",
  preview: !1,
  description: "Isolated Bento sidebar rail with fixed Home highlight and anchored bottom actions."
});
const Gi = "20260718-wallpaper-upload-1", Oe = "input_number.bruno_wallpaper_revision", Qe = Object.freeze([
  { key: "home", label: "Painel principal", entity: "input_text.bruno_wallpaper_home" },
  { key: "sala", label: "Sala", entity: "input_text.bruno_wallpaper_sala" },
  { key: "office", label: "Office", entity: "input_text.bruno_wallpaper_office" },
  { key: "cozinha", label: "Cozinha", entity: "input_text.bruno_wallpaper_cozinha" },
  { key: "casal", label: "Quarto Casal", entity: "input_text.bruno_wallpaper_casal" },
  { key: "marina", label: "Quarto Marina", entity: "input_text.bruno_wallpaper_marina" },
  { key: "miguel", label: "Quarto Miguel", entity: "input_text.bruno_wallpaper_miguel" },
  { key: "cameras", label: "Cameras", entity: "input_text.bruno_wallpaper_cameras" },
  { key: "roborock", label: "Aspirador", entity: "input_text.bruno_wallpaper_roborock" },
  { key: "floorplan", label: "Planta 3D", entity: "input_text.bruno_wallpaper_floorplan" }
]), Wi = {
  version: Gi,
  sections: Qe,
  _pending: /* @__PURE__ */ new Map(),
  _revision: 0,
  section(o) {
    return Qe.find((e) => e.key === o) || Qe[0];
  },
  value(o, e) {
    const t = this.section(e);
    if (this._pending.has(t.key)) return this._pending.get(t.key);
    const a = o?.states?.[t.entity]?.state || "";
    return this._isUsableUrl(a) ? String(a).trim() : "";
  },
  resolve(o, e, t = "") {
    const a = this.value(o, e) || t || "";
    if (!a) return "";
    const i = Number(o?.states?.[Oe]?.state) || 0, r = Math.max(i, this._revision);
    return this._withRevision(a, r);
  },
  async save({ hass: o, key: e, url: t } = {}) {
    const a = this.section(e), i = String(t || "").trim();
    if (i && !this._isUsableUrl(i))
      throw new Error("Use um caminho /local/, /api/ ou uma URL http(s).");
    this._pending.set(a.key, i);
    const r = Number(o?.states?.[Oe]?.state) || 0;
    return this._revision = Math.max(this._revision, r) + 1, o?.states?.[a.entity] && await o.callService("input_text", "set_value", {
      entity_id: a.entity,
      value: i
    }), o?.states?.[Oe] && await o.callService("input_number", "set_value", {
      entity_id: Oe,
      value: this._revision
    }), globalThis.dispatchEvent?.(new CustomEvent("bruno-wallpaper-changed", {
      detail: { key: a.key, url: i, revision: this._revision }
    })), i;
  },
  async upload({ hass: o, key: e, file: t } = {}) {
    if (!t) throw new Error("Selecione uma imagem.");
    if (!/^image\/(?:jpeg|png|gif)$/i.test(String(t.type || "")))
      throw new Error("Use uma imagem JPG, PNG ou GIF.");
    if (Number(t.size) > 10 * 1024 * 1024)
      throw new Error("A imagem deve ter no maximo 10 MB.");
    if (!o?.fetchWithAuth)
      throw new Error("Upload de imagem indisponivel nesta sessao.");
    const a = new FormData();
    a.append("file", t);
    const i = await o.fetchWithAuth("/api/image/upload", {
      method: "POST",
      body: a
    });
    if (!i.ok)
      throw new Error(i.status === 413 ? "A imagem excede o limite de 10 MB." : "Nao foi possivel enviar a imagem.");
    const r = await i.json();
    if (!r?.id) throw new Error("O Home Assistant nao retornou o identificador da imagem.");
    const n = `/api/image/serve/${encodeURIComponent(r.id)}/original`;
    return await this.save({ hass: o, key: e, url: n }), n;
  },
  clearPending(o, e) {
    const t = this.section(e), a = o?.states?.[t.entity]?.state || "";
    this._pending.get(t.key) === a && this._pending.delete(t.key);
  },
  _isUsableUrl(o) {
    const e = String(o || "").trim();
    return !e || ["unknown", "unavailable", "none"].includes(e.toLowerCase()) ? !1 : /^(?:\/local\/|\/api\/|https?:\/\/)/i.test(e);
  },
  _withRevision(o, e) {
    const t = String(o || "").replace(/([?&])bruno_wallpaper=\d+(&?)/, (a, i, r) => r ? i : "");
    return e ? `${t}${t.includes("?") ? "&" : "?"}bruno_wallpaper=${encodeURIComponent(e)}` : t;
  }
};
globalThis.BrunoWallpaperManager = Wi;
(() => {
  const o = [
    { key: "bom-dia", title: "Bom dia", subtitle: "Abrir a cortina", entity: "script.bruno_scene_bom_dia", image: "/local/bruno-ui/assets/scenes/bom-dia.webp" },
    { key: "cheguei", title: "Cheguei", subtitle: "Corredor e sala", entity: "script.bruno_scene_cheguei", image: "/local/bruno-ui/assets/scenes/cheguei.webp" },
    { key: "sair-de-casa", title: "Sair de casa", subtitle: "Desligar e proteger", entity: "script.bruno_scene_sair_de_casa", image: "/local/bruno-ui/assets/scenes/sair-de-casa.webp" },
    { key: "boa-noite", title: "Boa noite", subtitle: "Casa segura para dormir", entity: "script.bruno_scene_boa_noite", image: "/local/bruno-ui/assets/scenes/boa-noite.webp" },
    { key: "cinema", title: "Cinema", subtitle: "Sala pronta para assistir", entity: "script.bruno_scene_cinema", image: "/local/bruno-ui/assets/scenes/cinema.webp" },
    { key: "relaxar", title: "Relaxar", subtitle: "Luz suave na varanda", entity: "script.bruno_scene_relaxar", image: "/local/bruno-ui/assets/scenes/relaxar.webp" },
    { key: "receber", title: "Receber", subtitle: "Iluminacao social", entity: "script.bruno_scene_receber", image: "/local/bruno-ui/assets/scenes/receber.webp" },
    { key: "trabalho", title: "Trabalho", subtitle: "Office pronto para usar", entity: "script.bruno_scene_trabalho", image: "/local/bruno-ui/assets/scenes/trabalho.webp" },
    // NOVO (Fase 5e.3): vem da faixa de acoes rapidas da Home, removida na 5e.2.
    // Sem arte propria ainda — o painel cai no fundo padrao quando a imagem falta.
    { key: "apagar-luzes", title: "Apagar todas as luzes", subtitle: "A casa inteira", entity: "script.bruno_scene_apagar_todas_as_luzes", image: "/local/bruno-ui/assets/scenes/boa-noite.webp" }
  ], e = (i) => String(i ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"), t = () => `
    <div class="config-scrim" data-scenes-action="close"></div>
    <section class="config-panel scenes-panel" role="dialog" aria-modal="true" aria-label="Cenas">
      <header class="config-header">
        <span class="config-icon scenes-panel-icon" aria-hidden="true">
          ${globalThis.BrunoIcons?.render("scenes") || ""}
        </span>
        <div class="config-title">
          <strong>Cenas</strong>
          <span>Atmosferas da residencia</span>
        </div>
        <button class="config-close" type="button" data-scenes-action="close" aria-label="Fechar">&times;</button>
      </header>
      <div class="scenes-scroll" role="list">
        ${o.map((i) => `
          <button
            class="scene-banner"
            type="button"
            role="listitem"
            data-scenes-action="activate"
            data-scene-entity="${e(i.entity)}"
            aria-label="Ativar cena ${e(i.title)}"
          >
            <img src="${e(i.image)}" alt="" decoding="async" loading="eager">
            <span class="scene-banner-shade" aria-hidden="true"></span>
            <span class="scene-banner-copy">
              <strong>${e(i.title)}</strong>
              <small>${e(i.subtitle)}</small>
            </span>
            <span class="scene-banner-state" aria-live="polite"></span>
          </button>
        `).join("")}
      </div>
    </section>
    <style>
      .scenes-panel {
        width: min(430px, calc(100vw - 124px));
        max-height: min(720px, calc(100vh - 104px));
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }
      .scenes-panel-icon svg { fill: none; stroke: currentColor; }
      .scenes-scroll {
        min-height: 0;
        display: grid;
        gap: 4px;
        padding: 0 10px 10px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.25) transparent;
      }
      .scene-banner {
        appearance: none;
        -webkit-appearance: none;
        position: relative;
        width: 100%;
        height: 92px;
        min-height: 92px;
        margin: 0;
        padding: 0;
        overflow: hidden;
        border: var(--bruno-popup-banner-border, 1px solid rgba(255,255,255,0.10));
        border-radius: var(--bruno-popup-banner-radius, var(--bruno-liquid-card-radius-compact, 14px));
        background: rgba(10,12,16,0.34);
        box-shadow: var(--bruno-popup-banner-shadow, none);
        color: rgba(255,255,255,0.94);
        cursor: pointer;
        text-align: center;
        touch-action: manipulation;
        transform: translateZ(0);
        transition: transform 150ms ease, border-color 150ms ease, filter 150ms ease;
      }
      .scene-banner:active,
      .scene-banner.is-running { transform: scale(0.985); }
      .scene-banner:focus-visible { outline: 2px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.72); outline-offset: 1px; }
      .scene-banner img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: saturate(0.88) brightness(0.74);
        transform: scale(1.015);
      }
      .scene-banner-shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, rgba(5,7,10,0.36), rgba(5,7,10,0.14) 46%, rgba(5,7,10,0.34));
      }
      .scene-banner-copy {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 12px 18px;
        text-shadow: 0 2px 14px rgba(0,0,0,0.78);
      }
      .scene-banner-copy strong { font-size: 17px; line-height: 1.08; font-weight: 690; }
      .scene-banner-copy small { font-size: 10px; line-height: 1; font-weight: 620; color: rgba(255,255,255,0.67); }
      .scene-banner-state {
        position: absolute;
        right: 11px;
        bottom: 9px;
        font-size: 9px;
        font-weight: 760;
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.92);
      }
      @media (max-width: 800px) {
        .scenes-panel {
          left: 12px;
          right: 12px;
          bottom: 64px;
          width: auto;
          max-height: calc(100vh - 88px);
        }
        .scene-banner { height: 84px; min-height: 84px; }
      }
    </style>
  `, a = async ({ target: i, hass: r, host: n }) => {
    const s = i?.dataset?.scenesAction;
    if (s === "close") {
      n?._closeConfigPanel?.();
      return;
    }
    if (s !== "activate" || !r || i.disabled) return;
    const l = i.dataset.sceneEntity;
    if (!l) return;
    i.disabled = !0, i.classList.add("is-running");
    const c = i.querySelector(".scene-banner-state");
    c && (c.textContent = "Ativando");
    try {
      await r.callService("script", "turn_on", {}, { entity_id: l }), c && (c.textContent = "Ativada"), globalThis.setTimeout?.(() => n?._closeConfigPanel?.(), 420);
    } catch {
      c && (c.textContent = "Falha"), i.disabled = !1, i.classList.remove("is-running");
    }
  };
  globalThis.BrunoScenesPanel = Object.freeze({ scenes: o, render: t, handleAction: a });
})();
const dt = "bruno-shell";
class O extends HTMLElement {
  constructor() {
    super(), this._activeKey = null, this._railEl = null, this._onFolha = this._onFolha.bind(this), this._sectionEl = null, this._helpers = null, this._built = !1, this._requestedKey = null, this._sectionCache = /* @__PURE__ */ new Map(), this._sectionPromises = /* @__PURE__ */ new Map(), this._sectionScroll = /* @__PURE__ */ new Map(), this._sectionGeneration = 0, this._sectionRequestId = 0, this._buildRequestId = 0, this._configSignature = null, this._sectionErrorEl = null, this._configSection = "", this._wallpaperSection = "home", this._wallpaperMessage = "", this._onHashChange = () => this._syncFromHash(), this._onSectionNavigationClick = (e) => this._handleSectionNavigationClick(e), this._onHassNavigate = (e) => this._handleHassNavigate(e), this._onConfigClick = (e) => this._handleConfigClick(e), this._onConfigChange = (e) => this._handleConfigChange(e), this._onThemeChanged = (e) => {
      this._syncConfigOverlayTheme(e?.detail?.key), this._configOverlayEl?.dataset.panel === "config" && this._renderConfigPanel();
    }, this._onWallpaperChanged = (e) => {
      const t = e?.detail?.key;
      (!t || t === this._activeKey) && this._applyBackdrop(this._activeKey), this._configOverlayEl?.dataset.panel === "config" && this._configSection === "wallpaper" && this._renderConfigPanel();
    }, this._onLlCustom = (e) => {
      const t = e && e.detail || {};
      if (t.bruno_config === "open" || t.bruno_action === "config") {
        e.stopPropagation(), this._openConfigPanel();
        return;
      }
      if (t.bruno_action === "refresh") {
        e.stopPropagation(), globalThis.location?.reload?.();
        return;
      }
      if (t.bruno_action === "scenes") {
        e.stopPropagation(), this._openScenesPanel();
        return;
      }
      if (t.bruno_action === "devices" || t.bruno_action === "system") {
        e.stopPropagation(), this._openDevicesPanel();
        return;
      }
      if (t.bruno_action === "network") {
        e.stopPropagation(), this._openNetworkPanel();
        return;
      }
      if (t.bruno_updates === "open" || t.bruno_action === "updates") {
        e.stopPropagation(), this._openUpdatesPanel();
        return;
      }
      if (t.bruno_action === "spotify") {
        e.stopPropagation(), this._openSpotifyPanel(t.bruno_spotify_config || {});
        return;
      }
      const a = t.bruno_section;
      a && (e.stopPropagation(), this._goToSection(a));
    };
  }
  // --- Lovelace card API -----------------------------------------------------
  setConfig(e) {
    if (!e) throw new Error("bruno-shell: config ausente");
    const t = this._configFingerprint(e), a = t === this._configSignature;
    if (this._config = e, this._sections = e.sections || {}, this._defaultSection = e.default_section || Object.keys(this._sections)[0] || "home", this._rails = e.rails || null, this._sectionRails = e.section_rails || {}, this._defaultRailName = e.default_rail || "default", this._backdrops = e.backdrops || null, this._backdropEffects = e.backdrop_effects || null, this._preloadBackdropFor(this._defaultSection), this._railConfig = e.rail || (this._rails ? this._rails[this._defaultRailName] : null), a) {
      this._built && this._syncFromHash();
      return;
    }
    this._configSignature = t, this._sectionGeneration += 1, this._sectionRequestId += 1, this._sectionCache.clear(), this._sectionPromises.clear(), this._sectionScroll.clear(), this._activeKey = null, this._requestedKey = null, this._sectionEl = null, this._sectionErrorEl = null, this._currentRailName = null, this._built = !1, this._build();
  }
  set hass(e) {
    this._hass = e, globalThis.BrunoWallpaperManager?.sections?.forEach?.((a) => {
      globalThis.BrunoWallpaperManager.clearPending?.(e, a.key);
    }), this._preloadResolvedBackdropFor(this._activeKey || this._defaultSection), this._railEl && (this._railEl.hass = e), this._sectionEl && (this._sectionEl.hass = e);
    const t = this._sectionCache.get(this._homeSectionKey());
    t && t !== this._sectionEl && (t.hass = e), this._activeKey && this._applyBackdrop(this._activeKey), this._configOverlayEl?.dataset.panel === "config" && this._configSection === "updates" && !this._configOverlayEl.hidden && this._renderConfigPanel({ preserveScroll: !0 }), this._configOverlayEl?.dataset.panel === "updates" && !this._configOverlayEl.hidden && this._renderUpdatesPanel({ preserveScroll: !0 }), this._configOverlayEl?.dataset.panel === "system" && !this._configOverlayEl.hidden && this._renderSystemPanel({ preserveScroll: !0 }), this._configOverlayEl?.dataset.panel === "devices" && this._devicesPanelEl && (this._devicesPanelEl.hass = e), this._configOverlayEl?.dataset.panel === "network" && !this._configOverlayEl.hidden && this._renderNetworkPanel({ preserveScroll: !0 }), this._configOverlayEl?.dataset.panel === "spotify" && this._spotifyPanelCard && (this._spotifyPanelCard.hass = e);
  }
  getCardSize() {
    return 100;
  }
  // --- Ciclo de vida ---------------------------------------------------------
  connectedCallback() {
    globalThis.BrunoLiquidGlass && globalThis.BrunoLiquidGlass.apply && globalThis.BrunoLiquidGlass.apply(), globalThis.addEventListener("hashchange", this._onHashChange), globalThis.addEventListener("location-changed", this._onHashChange), globalThis.addEventListener("bruno-theme-changed", this._onThemeChanged), globalThis.addEventListener("bruno-wallpaper-changed", this._onWallpaperChanged), this.addEventListener("ll-custom", this._onLlCustom), this.addEventListener("click", this._onSectionNavigationClick, !0), this.addEventListener("hass-navigate", this._onHassNavigate, !0), this.addEventListener("bruno-folha", this._onFolha), this._built && this._syncFromHash(), this._observarDock();
  }
  /**
   * Publica a altura REAL do dock em --bruno-dock-h.
   *
   * Quem esta DENTRO do content-slot precisa desse numero e nao tem como
   * medi-lo: a bottom sheet das subviews tem de parar acima do dock, porque o
   * rail-slot tem z-index 2 e o content-slot 1 — nenhum z-index de dentro do
   * conteudo pinta sobre ele.
   *
   * Medido, nao estimado: a primeira versao usava 58px + safe-area, valor que
   * saiu do meu banco em Chromium. No iPhone o dock e mais alto e a folha
   * continuou passando por baixo. Propriedade customizada atravessa shadow DOM
   * por heranca, entao a subview le isto sem conhecer a shell.
   */
  /**
   * Marca na shell quando ha bottom sheet aberta no telefone.
   *
   * ANTERIOR (rollback rev. faixa-de-tiles): a classe elevava o content-slot
   * acima da rail. Agora a mesma classe eleva a rail, mantendo-a fixa, visivel
   * e clicavel enquanto a folha sobe da borda inferior.
   *
   * So o telefone e afetado: no tablet a regra que le a classe vive dentro de
   * @media (max-width: 800px).
   */
  _onFolha(e) {
    const t = this.shadowRoot && this.shadowRoot.querySelector(".shell");
    t && t.classList.toggle("tem-folha", !!(e && e.detail && e.detail.aberta));
  }
  _observarDock() {
    const e = this.shadowRoot && this.shadowRoot.querySelector(".rail-slot");
    if (!e) return;
    const t = () => {
      const a = Math.round(e.getBoundingClientRect().height);
      a > 0 && this.style.setProperty("--bruno-dock-h", a + "px");
    };
    t(), this._dockObserver && this._dockObserver.disconnect(), typeof ResizeObserver == "function" && (this._dockObserver = new ResizeObserver(t), this._dockObserver.observe(e));
  }
  disconnectedCallback() {
    globalThis.removeEventListener("hashchange", this._onHashChange), globalThis.removeEventListener("location-changed", this._onHashChange), globalThis.removeEventListener("bruno-theme-changed", this._onThemeChanged), globalThis.removeEventListener("bruno-wallpaper-changed", this._onWallpaperChanged), this.removeEventListener("ll-custom", this._onLlCustom), this.removeEventListener("click", this._onSectionNavigationClick, !0), this.removeEventListener("hass-navigate", this._onHassNavigate, !0), this.removeEventListener("bruno-folha", this._onFolha), this._dockObserver && (this._dockObserver.disconnect(), this._dockObserver = null);
  }
  // --- Helpers ---------------------------------------------------------------
  _configFingerprint(e) {
    try {
      return JSON.stringify(e);
    } catch {
      return e;
    }
  }
  async _ensureHelpers() {
    return !this._helpers && globalThis.loadCardHelpers && (this._helpers = await globalThis.loadCardHelpers()), this._helpers;
  }
  async _createCard(e) {
    await globalThis.BrunoLazyModules?.ensureForConfig?.(e);
    const t = await this._ensureHelpers();
    if (!t) throw new Error("loadCardHelpers indisponivel");
    const a = t.createCardElement(e);
    return this._hass && (a.hass = this._hass), a.addEventListener("ll-rebuild", () => {
      this._hass && (a.hass = this._hass);
    }), a;
  }
  // --- Construcao da moldura -------------------------------------------------
  async _build() {
    const e = ++this._buildRequestId;
    this.shadowRoot || this.attachShadow({ mode: "open" }), this.shadowRoot.innerHTML = `
      <style>${O._styles()}</style>
      <div class="shell">
        <div class="backdrop" id="backdrop">
          <div class="backdrop-layer" data-layer="0"></div>
          <div class="backdrop-layer" data-layer="1"></div>
        </div>
        <div class="rail-slot" id="rail"></div>
        <div class="content-slot" id="content"></div>
        <div class="config-overlay" id="configOverlay" hidden></div>
      </div>
    `, this._backdropEl = this.shadowRoot.getElementById("backdrop"), this._configOverlayEl = this.shadowRoot.getElementById("configOverlay"), this._syncConfigOverlayTheme(), this._configOverlayEl?.removeEventListener("click", this._onConfigClick), this._configOverlayEl?.addEventListener("click", this._onConfigClick), this._configOverlayEl?.removeEventListener("change", this._onConfigChange), this._configOverlayEl?.addEventListener("change", this._onConfigChange), this._bdLayers = Array.from(this.shadowRoot.querySelectorAll(".backdrop-layer")), this._bdActive = -1;
    try {
      if (this._railConfig) {
        const t = await this._createCard(this._railConfig);
        if (e !== this._buildRequestId) return;
        this._railEl = t, this._currentRailName = this._rails ? this._defaultRailName : null, queueMicrotask(() => this._observarDock());
        const a = this.shadowRoot.getElementById("rail");
        a && a.replaceChildren(this._railEl);
      }
    } catch (t) {
      if (e !== this._buildRequestId) return;
      this._renderRailError(t);
    }
    e === this._buildRequestId && (this._built = !0, this._syncFromHash());
  }
  // --- Secoes ----------------------------------------------------------------
  _currentHashKey() {
    const t = (globalThis.location && globalThis.location.hash || "").replace(/^#/, "");
    return this._sections && this._sections[t] ? t : this._defaultSection;
  }
  _homeSectionKey() {
    return this._sections?.home ? "home" : this._defaultSection;
  }
  _navigationSectionKey(e) {
    if (typeof e != "string" || !e.trim() || !this._sections) return null;
    const t = e.trim();
    if (t.startsWith("#")) {
      const c = t.replace(/^#/, "").split(/[?&]/, 1)[0];
      return this._sections[c] ? c : null;
    }
    const i = t.split(/[?#]/, 1)[0].replace(/\/+$/, "").split("/").filter(Boolean);
    if (!i.length) return null;
    const r = (globalThis.location?.pathname || "").split("/").filter(Boolean);
    if (i.length > 1 && r.length && i[0] !== r[0]) return null;
    let n = i[i.length - 1];
    try {
      n = decodeURIComponent(n);
    } catch {
    }
    const l = {
      "bento-lab": this._homeSectionKey(),
      "subview-sala": "sala",
      "subview-office": "office",
      "subview-cozinha": "cozinha",
      "subview-quarto-casal": "casal",
      "subview-quarto-marina": "marina",
      "subview-quarto-miguel": "miguel",
      "cameras-security": "cameras",
      "floor-plan": "floorplan"
    }[n] || (this._sections[n] ? n : null);
    return l && this._sections[l] ? l : null;
  }
  _handleSectionNavigationClick(e) {
    const t = typeof e.composedPath == "function" ? e.composedPath() : [];
    let a = null;
    for (const i of t)
      if (!(!i || !i.dataset)) {
        if (i.dataset.action === "navigate-home") {
          a = this._homeSectionKey();
          break;
        }
        if (i.dataset.action === "navigate" && i.dataset.path && (a = this._navigationSectionKey(i.dataset.path), a))
          break;
        if (i.classList?.contains("nav-button") && i.dataset.key && this._sections?.[i.dataset.key]) {
          a = i.dataset.key;
          break;
        }
      }
    a && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.(), this._goToSection(a));
  }
  _handleHassNavigate(e) {
    const t = e?.detail || {}, a = this._navigationSectionKey(t.path || t.navigate || t.navigation_path);
    a && (e.preventDefault(), e.stopPropagation(), e.stopImmediatePropagation?.(), this._goToSection(a));
  }
  _syncFromHash() {
    if (!this._built) return;
    const e = this._currentHashKey();
    if (e === this._activeKey && !this._requestedKey) {
      this._updateRailSelection(e);
      return;
    }
    e !== this._requestedKey && this._setSection(e);
  }
  _goToSection(e) {
    if (!this._sections || !this._sections[e]) return;
    if (typeof globalThis.matchMedia == "function" && globalThis.matchMedia("(max-width: 800px)").matches) {
      if (e === this._activeKey && !this._requestedKey) {
        this._updateRailSelection(e);
        return;
      }
      if (e === this._requestedKey) return;
      const i = globalThis.location, r = globalThis.history;
      if (i && r?.replaceState) {
        const n = `${i.pathname}${i.search}#${encodeURIComponent(e)}`;
        r.replaceState(r.state, "", n);
      }
      this._setSection(e);
      return;
    }
    (globalThis.location && globalThis.location.hash || "").replace(/^#/, "") !== e ? globalThis.location.hash = e : this._setSection(e);
  }
  // ORIGINAL (rollback): recriava o card e removia a Home com replaceChildren.
  async _setSectionOriginalRollback(e) {
    const t = this._sections && this._sections[e];
    if (!t) return;
    this._activeKey = e;
    const a = this.shadowRoot && this.shadowRoot.getElementById("content");
    if (a) {
      a.dataset.section = e, this._applyBackdrop(e), this._applyRailForSection(e);
      try {
        const i = await this._createCard(t);
        if (this._activeKey !== e) return;
        this._sectionEl = i, a.replaceChildren(i);
      } catch (i) {
        this._renderSectionError(a, i);
      }
      this._updateRailSelection(e);
    }
  }
  // NOVO (full-bleed): PRÉ-CARREGA todas as imagens de backdrop no setConfig para
  // a troca de seção ser instantânea (sem o atraso de buscar a imagem na hora).
  _sectionElement(e, t, a) {
    const i = this._sectionCache.get(e);
    if (i) return Promise.resolve(i);
    const r = this._sectionPromises.get(e);
    if (r) return r;
    const n = this._createCard(t).then((s) => (a === this._sectionGeneration && (s.dataset.brunoSection = e, this._sectionCache.set(e, s)), s)).finally(() => {
      this._sectionPromises.get(e) === n && this._sectionPromises.delete(e);
    });
    return this._sectionPromises.set(e, n), n;
  }
  _setSectionVisibility(e, t) {
    e && (e.hidden = !t, t ? (e.removeAttribute("aria-hidden"), e.removeAttribute("inert"), "inert" in e && (e.inert = !1)) : (e.setAttribute("aria-hidden", "true"), "inert" in e ? e.inert = !0 : e.setAttribute("inert", "")));
  }
  _activateSection({ key: e, el: t, homeKey: a, homeEl: i, content: r, requestId: n }) {
    this._activeKey && this._sectionScroll.set(this._activeKey, r.scrollTop || 0), this._clearSectionError();
    const s = this._sectionEl;
    s && s !== i && s !== t && s.parentNode === r && (this._setSectionVisibility(s, !1), r.removeChild(s)), i.parentNode !== r && r.appendChild(i), this._setSectionVisibility(i, e === a), t !== i && (t.parentNode !== r && r.appendChild(t), this._setSectionVisibility(t, !0)), this._activeKey = e, this._requestedKey = null, this._sectionEl = t, r.dataset.section = e, this._hass && (t.hass = this._hass), this._applyBackdrop(e), this._applyRailForSection(e), this._updateRailSelection(e);
    const l = this._sectionScroll.get(e) || 0;
    r.scrollTop = l, globalThis.requestAnimationFrame?.(() => {
      n === this._sectionRequestId && this._activeKey === e && (r.scrollTop = l);
    }), e === a && this._scheduleBackdropWarmup();
  }
  async _setSection(e) {
    const t = this._sections && this._sections[e];
    if (!t) return;
    const a = this.shadowRoot && this.shadowRoot.getElementById("content");
    if (!a) return;
    const i = ++this._sectionRequestId, r = this._sectionGeneration;
    this._requestedKey = e;
    const n = this._homeSectionKey(), s = this._sections[n];
    try {
      const l = this._sectionElement(n, s, r), c = e === n ? l : this._sectionElement(e, t, r), p = this._preloadResolvedBackdropFor(e, "high"), [d, h] = await Promise.all([l, c, p]);
      if (i !== this._sectionRequestId || r !== this._sectionGeneration || this._requestedKey !== e) return;
      this._activateSection({ key: e, el: h, homeKey: n, homeEl: d, content: a, requestId: i });
    } catch (l) {
      if (i !== this._sectionRequestId || r !== this._sectionGeneration) return;
      this._requestedKey = null, this._renderSectionError(a, l), this._updateRailSelection(this._activeKey || e);
    }
  }
  _scheduleBackdropWarmup() {
    if (this._backdropWarmupScheduled || !this._backdrops) return;
    this._backdropWarmupScheduled = !0;
    const e = async () => {
      const t = this._activeKey || this._defaultSection, a = Object.keys(this._backdrops).filter((i) => i !== "default" && i !== t);
      for (const i of a)
        await this._preloadResolvedBackdropFor(i, "low");
    };
    typeof globalThis.requestIdleCallback == "function" ? globalThis.requestIdleCallback(() => {
      e();
    }, { timeout: 4e3 }) : globalThis.setTimeout(() => {
      e();
    }, 1200);
  }
  _preloadBackdropFor(e) {
    if (!this._backdrops || !e) return;
    const t = this._backdrops[e] || this._backdrops.default;
    t && this._loadBackdrop(t);
  }
  _preloadResolvedBackdropFor(e, t = "auto") {
    if (!this._backdrops || !e) return Promise.resolve(null);
    const a = this._backdrops[e] || this._backdrops.default, i = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, e, a) || a;
    return i ? this._loadBackdrop(i, t) : Promise.resolve(null);
  }
  _loadBackdrop(e, t = "auto") {
    if (!e) return Promise.resolve(null);
    this._backdropCache instanceof Map || (this._backdropCache = /* @__PURE__ */ new Map());
    const a = this._backdropCache.get(e);
    if (a) return a.promise;
    const i = new Image();
    i.decoding = "async", "fetchPriority" in i && (i.fetchPriority = t);
    const r = new Promise((n) => {
      let s = !1;
      const l = async (c) => {
        if (!s) {
          if (s = !0, c && typeof i.decode == "function")
            try {
              await i.decode();
            } catch {
            }
          n(c ? e : null);
        }
      };
      i.addEventListener("load", () => l(!0), { once: !0 }), i.addEventListener("error", () => l(!1), { once: !0 }), i.src = e, i.complete && l(i.naturalWidth > 0);
    });
    return this._backdropCache.set(e, { image: i, promise: r }), r;
  }
  // NOVO (full-bleed): aplica a imagem da seção com CROSSFADE real entre duas
  // camadas (opacity é animável; background-image não é). Sem `backdrops` =>
  // ambas as camadas transparentes (grafite do :host aparece).
  _applyBackdropEffect(e) {
    if (!this._backdropEl) return;
    const t = this._backdropEffects && (this._backdropEffects[e] || this._backdropEffects.default) || {}, a = (i, r, n) => {
      const s = r == null || r === "" ? n : String(r);
      this._backdropEl.style.setProperty(i, s);
    };
    a("--bruno-backdrop-blur", t.blur, "var(--bruno-theme-backdrop-blur, 0px)"), a("--bruno-backdrop-scale", t.scale, "var(--bruno-theme-backdrop-scale, 1)"), a("--bruno-backdrop-saturate", t.saturate, "var(--bruno-theme-backdrop-saturate, 1)"), a("--bruno-backdrop-brightness", t.brightness, "var(--bruno-theme-backdrop-brightness, 1)"), a("--bruno-backdrop-dim", t.dim, "var(--bruno-theme-backdrop-dim, 0.10)");
  }
  _applyBackdrop(e) {
    if (!this._backdropEl || !this._bdLayers || this._bdLayers.length < 2) return;
    this._applyBackdropEffect(e);
    const t = this._backdrops && (this._backdrops[e] || this._backdrops.default), a = globalThis.BrunoWallpaperManager?.resolve?.(this._hass, e, t) || t;
    if (!a) {
      this._backdropRequestId = (this._backdropRequestId || 0) + 1, this._backdropTargetUrl = "", this._bdLayers.forEach((n) => {
        n.style.opacity = "0";
      }), delete this._backdropEl.dataset.active, this._bdActive = -1;
      return;
    }
    const i = this._bdActive >= 0 ? this._bdLayers[this._bdActive] : null;
    if (i && i.dataset.url === a) {
      this._backdropTargetUrl = "", this._backdropEl.dataset.active = "1";
      return;
    }
    if (this._backdropTargetUrl === a) return;
    const r = (this._backdropRequestId || 0) + 1;
    this._backdropRequestId = r, this._backdropTargetUrl = a, this._loadBackdrop(a).then((n) => {
      if (!n || r !== this._backdropRequestId || this._activeKey !== e || this._backdropTargetUrl !== a) return;
      const s = this._bdActive >= 0 ? this._bdLayers[this._bdActive] : null, l = this._bdActive === 0 ? 1 : 0, c = this._bdLayers[l];
      c.style.opacity = "0", c.dataset.url = a, c.style.backgroundImage = `url("${a}")`, globalThis.requestAnimationFrame?.(() => {
        r !== this._backdropRequestId || this._activeKey !== e || (c.style.opacity = "1", s && s !== c && (s.style.opacity = "0"), this._backdropEl.dataset.active = "1", this._bdActive = l, this._backdropTargetUrl = "");
      });
    });
  }
  // NOVO (Etapa A): troca os ITENS do rail conforme a seção, SEM recriar o
  // elemento — a moldura/posição não se move; só os botões internos mudam
  // (ex.: app-nav nas seções gerais; Home + cômodos nas seções de cômodo).
  // O Home permanece ancorado no topo (item 0 das duas listas).
  _applyRailForSection(e) {
    if (!this._rails || !this._railEl) return;
    const t = this._sectionRails[e] || this._defaultRailName;
    if (t === this._currentRailName) return;
    const a = this._rails[t] || this._rails[this._defaultRailName];
    if (a) {
      this._currentRailName = t;
      try {
        this._railEl.setConfig(a), this._hass && (this._railEl.hass = this._hass);
      } catch (i) {
        console.warn("bruno-shell: falha ao trocar rail da secao", e, i);
      }
    }
  }
  // Atualiza o item ativo da rail SEM reconstrui-la (so alterna a classe .selected
  // pelos data-key dos botoes — aditivo no bento-sidebar-card.js).
  _updateRailSelection(e) {
    const t = this._railEl && this._railEl.shadowRoot;
    if (!t) return;
    const a = (n) => {
      const s = n.dataset.groupKeys, l = s ? s.split(" ").filter(Boolean).indexOf(e) !== -1 : n.dataset.key === e;
      n.classList.toggle("selected", l);
    }, i = ".nav-button[data-key], .nav-button[data-group-keys]", r = t.querySelectorAll(i);
    if (!r.length) {
      globalThis.requestAnimationFrame && globalThis.requestAnimationFrame(() => {
        const n = this._railEl && this._railEl.shadowRoot;
        n && n.querySelectorAll(i).forEach(a);
      });
      return;
    }
    r.forEach(a);
  }
  // --- Erros (nao derrubam a shell) ------------------------------------------
  _renderRailError(e) {
    const t = this.shadowRoot && this.shadowRoot.getElementById("rail");
    t && (t.innerHTML = `<div class="err">rail: ${O._escape(e && e.message)}</div>`);
  }
  _renderSectionError(e, t) {
    this._clearSectionError();
    const a = document.createElement("div");
    a.className = "err section-error", a.textContent = `secao: ${t && t.message || t}`, e.appendChild(a), this._sectionErrorEl = a;
  }
  _clearSectionError() {
    this._sectionErrorEl?.parentNode && this._sectionErrorEl.parentNode.removeChild(this._sectionErrorEl), this._sectionErrorEl = null;
  }
  // --- Configuracoes ---------------------------------------------------------
  _syncConfigOverlayTheme(e = "") {
    if (!this._configOverlayEl) return;
    const t = e || globalThis.BrunoThemeManager?.current?.() || "";
    this._configOverlayEl.dataset.brunoPopupTheme = t === "josh" ? "josh" : "default";
  }
  _openConfigPanel() {
    this._configOverlayEl && (this._syncConfigOverlayTheme(), this._configSection = "", this._wallpaperMessage = "", this._configOverlayEl.hidden = !1, this._configOverlayEl.dataset.open = "1", this._configOverlayEl.dataset.panel = "config", this._renderConfigPanel());
  }
  _closeConfigPanel() {
    this._configOverlayEl && (this._spotifyPanelCard = null, this._spotifyPanelConfig = null, this._configSection = "", this._wallpaperMessage = "", delete this._configOverlayEl.dataset.open, delete this._configOverlayEl.dataset.panel, this._configOverlayEl.hidden = !0, this._configOverlayEl.replaceChildren());
  }
  _renderConfigPanel({ preserveScroll: e = !1 } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden) return;
    const t = e && this._configOverlayEl.querySelector(".updates-scroll")?.scrollTop || 0, a = globalThis.BrunoThemeManager, i = globalThis.BrunoWallpaperManager, r = this._pendingUpdatesCount(), n = this._renderConfigChild();
    if (this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-config-action="close"></div>
      <section class="config-panel config-root-panel${n ? " has-child" : ""}" role="dialog" aria-modal="true" aria-label="Configuracoes">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render("settings") || ""}
          </span>
          <div class="config-title">
            <strong>Config</strong>
            <span>Preferencias do painel</span>
          </div>
          <button class="config-close" type="button" data-config-action="close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section config-menu-section">
          <div class="config-menu-list">
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="themes">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render("palette") || ""}
              </span>
              <span class="config-menu-copy"><strong>Themes</strong><small>${O._escape(a?.activeLabel?.() || "VisionOS")}</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="wallpaper">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render("wallpaper") || ""}
              </span>
              <span class="config-menu-copy"><strong>Wallpaper</strong><small>${i ? "Shell e subviews" : "Modulo indisponivel"}</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="updates">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render("updates") || ""}
              </span>
              <span class="config-menu-copy"><strong>Updates</strong><small>${r ? `${r} ${r === 1 ? "pendente" : "pendentes"}` : "Abrir central"}</small></span>
              ${r ? `<span class="config-menu-count">${r > 99 ? "99+" : r}</span>` : '<span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>'}
            </button>
            <!-- NOVO (Fase 6.0) — DIAGNOSTICO.
                 Ate aqui o painel <bruno-diagnostics> existia no bundle e nao
                 estava em view nenhuma: nao havia como chegar nele. E a unica
                 superficie que le a baseline de runtime NO TABLET, onde nao ha
                 console. Sem esta entrada, a Fase 6.0 nao teria como ser colhida. -->
            <button class="config-menu-item" type="button" data-config-action="open-section" data-section="diagnostico">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render("system") || ""}
              </span>
              <span class="config-menu-copy"><strong>Diagnostico</strong><small>Runtime, entidades e cameras</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
            <!-- NOVO (Fase 5e.5) — ATUALIZAR vem da faixa de acoes rapidas.
                 Recarrega a pagina; era o unico efeito util do botao antigo
                 (o shell_command do repositorio de origem nao existe aqui).
                 ROLLBACK: remover este botao e descomentar o item "refresh"
                 em views/main-grid/v2/bento_bottom_block.yaml. -->
            <button class="config-menu-item" type="button" data-config-action="refresh">
              <span class="config-menu-icon" aria-hidden="true">
                ${globalThis.BrunoIcons?.render("refresh") || ""}
              </span>
              <span class="config-menu-copy"><strong>Atualizar</strong><small>Recarregar o painel</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
          </div>
        </div>
      </section>
      ${n}
    `, this._configSection === "diagnostico") {
      const s = this._configOverlayEl.querySelector("#diagnosticoHost"), l = this._montarDiagnostico();
      s && l ? s.replaceChildren(l) : s && (s.textContent = "Bundle nao carregado.");
    }
    if (e && t) {
      const s = this._configOverlayEl.querySelector(".updates-scroll");
      s && (s.scrollTop = t);
    }
  }
  /**
   * Fase 6.0 — o painel de diagnostico dentro de Configuracoes.
   *
   * <bruno-diagnostics> e um componente Lit do bundle novo: recebe `hass` por
   * PROPRIEDADE, entao nao da para monta-lo por innerHTML como os demais
   * paineis desta shell. O elemento e criado uma vez e reaproveitado — recria-lo
   * zeraria a rolagem e a mensagem de "baseline copiada".
   */
  _montarDiagnostico() {
    if (!this._diagnosticoEl) {
      if (!customElements.get("bruno-diagnostics")) return null;
      this._diagnosticoEl = document.createElement("bruno-diagnostics"), this._diagnosticoEl.setConfig?.({});
    }
    return this._hass && (this._diagnosticoEl.hass = this._hass), this._diagnosticoEl;
  }
  _renderDiagnosticoChild() {
    return `
      <section class="config-panel config-child-panel" role="dialog" aria-modal="true" aria-label="Diagnostico">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">${globalThis.BrunoIcons?.render("system") || ""}</span>
          <div class="config-title"><strong>Diagnostico</strong><span>Runtime, entidades e cameras</span></div>
          <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section" id="diagnosticoHost"></div>
      </section>
    `;
  }
  _renderConfigChild() {
    return this._configSection ? this._configSection === "themes" ? this._renderThemesChild() : this._configSection === "wallpaper" ? this._renderWallpaperChild() : this._configSection === "diagnostico" ? this._renderDiagnosticoChild() : this._configSection === "updates" ? globalThis.BrunoUpdatesPanel?.render ? globalThis.BrunoUpdatesPanel.render({ hass: this._hass, embedded: !0 }) : `
        <section class="config-panel config-child-panel" role="dialog" aria-modal="true" aria-label="Updates">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Updates</strong><span>Modulo indisponivel</span></div>
            <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      ` : "" : "";
  }
  _renderThemesChild() {
    const e = globalThis.BrunoThemeManager, t = e?.list?.() || [], a = e?.current?.() || "visionos";
    return `
      <section class="config-panel config-child-panel" role="dialog" aria-modal="true" aria-label="Themes">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render("palette") || ""}
          </span>
          <div class="config-title"><strong>Themes</strong><span>${O._escape(e?.activeLabel?.() || a)}</span></div>
          <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section">
          <div class="theme-list">
            ${t.map((i) => `
              <button class="theme-option${i.key === a ? " is-selected" : ""}" type="button"
                data-config-action="theme" data-theme="${O._escapeAttr(i.key)}" ${i.available ? "" : "disabled"}>
                <span>${O._escape(i.label)}</span>
                <small>${i.key === a ? "Atual" : i.available ? "Disponivel" : "Indisponivel"}</small>
              </button>
            `).join("")}
          </div>
        </div>
        <footer class="config-footer"><button class="config-refresh" type="button" data-config-action="reload">Atualizar</button></footer>
      </section>
    `;
  }
  _renderWallpaperChild() {
    const e = globalThis.BrunoWallpaperManager, t = e?.sections || [], a = e?.section?.(this._wallpaperSection) || t[0] || { key: "home" };
    this._wallpaperSection = a.key;
    const i = e?.value?.(this._hass, a.key) || "", r = this._backdrops && (this._backdrops[a.key] || this._backdrops.default) || "", n = e?.resolve?.(this._hass, a.key, r) || r, s = !!this._hass?.states?.[a.entity];
    return `
      <section class="config-panel config-child-panel wallpaper-panel" role="dialog" aria-modal="true" aria-label="Wallpaper">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render("wallpaper") || ""}
          </span>
          <div class="config-title"><strong>Wallpaper</strong><span>Shell e subviews</span></div>
          <button class="config-close" type="button" data-config-action="child-close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section wallpaper-content">
          <div class="wallpaper-field">
            <span>Area</span>
            <div class="wallpaper-area-list" role="listbox" aria-label="Area do wallpaper">
              ${t.map((l) => `
                <button class="wallpaper-area-option${l.key === a.key ? " is-selected" : ""}" type="button"
                  data-config-action="wallpaper-area" data-wallpaper-key="${O._escapeAttr(l.key)}"
                  role="option" aria-selected="${l.key === a.key ? "true" : "false"}">
                  ${O._escape(l.label)}
                </button>
              `).join("")}
            </div>
          </div>
          <div class="wallpaper-preview${n ? " has-image" : ""}" style="${n ? `--wallpaper-preview:url('${O._escapeAttr(O._cssUrl(n))}')` : ""}" aria-hidden="true"></div>
          <input id="wallpaperFile" class="wallpaper-file-input" type="file" accept="image/jpeg,image/png,image/gif" data-config-action="wallpaper-file">
          <button class="wallpaper-file-button" type="button" data-config-action="wallpaper-pick">Selecionar imagem</button>
          <label class="wallpaper-field">
            <span>URL opcional</span>
            <input id="wallpaperUrl" type="text" spellcheck="false" value="${O._escapeAttr(i)}" placeholder="${O._escapeAttr(r)}">
          </label>
          <small class="wallpaper-help">A imagem selecionada e armazenada pelo Home Assistant e aplicada sem editar codigo nem fazer cache buster.</small>
          ${s ? "" : '<small class="wallpaper-message is-warning">Helpers serao ativados apos reiniciar o Home Assistant.</small>'}
          ${this._wallpaperMessage ? `<small class="wallpaper-message">${O._escape(this._wallpaperMessage)}</small>` : ""}
        </div>
        <footer class="config-footer wallpaper-footer">
          <button class="config-secondary" type="button" data-config-action="wallpaper-default">Usar padrao</button>
          <button class="config-refresh" type="button" data-config-action="wallpaper-save">Aplicar</button>
        </footer>
      </section>
    `;
  }
  _pendingUpdatesCount() {
    const e = this._hass?.states || {}, t = Object.entries(e).filter(([i, r]) => i.startsWith("update.") && r?.state === "on").length, a = Number(e["sensor.hassio_updates_available"]?.state) || 0;
    return Math.max(t, a);
  }
  _refreshUpdatesPanel({ preserveScroll: e = !0 } = {}) {
    if (this._configOverlayEl?.dataset.panel === "config" && this._configSection === "updates") {
      this._renderConfigPanel({ preserveScroll: e });
      return;
    }
    this._renderUpdatesPanel({ preserveScroll: e });
  }
  _openUpdatesPanel() {
    this._configOverlayEl && (this._configOverlayEl.hidden = !1, this._configOverlayEl.dataset.open = "1", this._configOverlayEl.dataset.panel = "updates", this._renderUpdatesPanel());
  }
  _renderUpdatesPanel({ preserveScroll: e = !1 } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== "updates") return;
    const t = e && this._configOverlayEl.querySelector(".updates-scroll")?.scrollTop || 0;
    if (!globalThis.BrunoUpdatesPanel?.render) {
      this._configOverlayEl.innerHTML = `
        <div class="config-scrim" data-updates-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Updates">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title">
              <strong>Updates</strong>
              <span>Modulo de updates indisponivel</span>
            </div>
            <button class="config-close" type="button" data-updates-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
      return;
    }
    if (this._configOverlayEl.innerHTML = globalThis.BrunoUpdatesPanel.render({ hass: this._hass }), e && t) {
      const a = this._configOverlayEl.querySelector(".updates-scroll");
      a && (a.scrollTop = t);
    }
  }
  _openSystemPanel() {
    this._configOverlayEl && (this._syncConfigOverlayTheme(), this._configOverlayEl.hidden = !1, this._configOverlayEl.dataset.open = "1", this._configOverlayEl.dataset.panel = "system", this._renderSystemPanel());
  }
  /**
   * NOVO (Fase 5e.6) — painel Dispositivos.
   *
   * Diferente dos demais paineis desta shell, o conteudo NAO vem de innerHTML:
   * <bruno-devices-panel> e um componente Lit do bundle novo, e precisa receber
   * `hass` por PROPRIEDADE. Por isso o elemento e criado e reaproveitado — cada
   * recriacao perderia o dispositivo selecionado e o estado dos controles.
   *
   * O componente nao sabe o que e uma TV: a lista sai de devices.config.ts e
   * cada controle vem do registry (application/device-registry.ts).
   */
  _openDevicesPanel() {
    this._configOverlayEl && (this._syncConfigOverlayTheme(), this._configOverlayEl.hidden = !1, this._configOverlayEl.dataset.open = "1", this._configOverlayEl.dataset.panel = "devices", this._renderDevicesPanel());
  }
  _renderDevicesPanel() {
    const e = this._configOverlayEl;
    if (!(!e || e.hidden || e.dataset.panel !== "devices")) {
      if (!customElements.get("bruno-devices-panel")) {
        e.innerHTML = `
        <div class="config-scrim" data-system-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Dispositivos">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Dispositivos</strong><span>Bundle nao carregado</span></div>
            <button class="config-close" type="button" data-system-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
        return;
      }
      this._devicesPanelEl || (this._devicesPanelEl = document.createElement("bruno-devices-panel"), this._devicesPanelEl.addEventListener("fechar", () => this._closeConfigPanel())), this._devicesPanelEl.hass = this._hass, this._devicesPanelEl.parentNode !== e && (e.innerHTML = '<div class="config-scrim" data-system-action="close"></div>', e.appendChild(this._devicesPanelEl));
    }
  }
  _renderSystemPanel({ preserveScroll: e = !1 } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== "system") return;
    const t = e && this._configOverlayEl.querySelector(".system-scroll")?.scrollTop || 0;
    if (!globalThis.BrunoSystemPanel?.render) {
      this._configOverlayEl.innerHTML = `
        <div class="config-scrim" data-system-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Sistema">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Sistema</strong><span>Modulo indisponivel</span></div>
            <button class="config-close" type="button" data-system-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
      return;
    }
    if (this._configOverlayEl.innerHTML = globalThis.BrunoSystemPanel.render({ hass: this._hass }), e && t) {
      const a = this._configOverlayEl.querySelector(".system-scroll");
      a && (a.scrollTop = t);
    }
  }
  _openNetworkPanel() {
    this._configOverlayEl && (this._syncConfigOverlayTheme(), this._configOverlayEl.hidden = !1, this._configOverlayEl.dataset.open = "1", this._configOverlayEl.dataset.panel = "network", this._networkStep = "qr", this._renderNetworkPanel());
  }
  _openScenesPanel() {
    if (this._configOverlayEl) {
      if (this._syncConfigOverlayTheme(), this._configOverlayEl.hidden = !1, this._configOverlayEl.dataset.open = "1", this._configOverlayEl.dataset.panel = "scenes", globalThis.BrunoScenesPanel?.render) {
        this._configOverlayEl.innerHTML = globalThis.BrunoScenesPanel.render({ hass: this._hass });
        return;
      }
      this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-scenes-action="close"></div>
      <section class="config-panel" role="dialog" aria-modal="true" aria-label="Cenas">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">!</span>
          <div class="config-title"><strong>Cenas</strong><span>Modulo indisponivel</span></div>
          <button class="config-close" type="button" data-scenes-action="close" aria-label="Fechar">&times;</button>
        </header>
      </section>
    `;
    }
  }
  async _openSpotifyPanel(e = {}) {
    if (this._configOverlayEl) {
      this._spotifyPanelConfig = {
        entity: e.entity || "media_player.spotifyplus_bruno_helasio",
        deviceDefaultId: e.deviceDefaultId || "Echo Show"
      }, this._configOverlayEl.hidden = !1, this._configOverlayEl.dataset.open = "1", this._configOverlayEl.dataset.panel = "spotify", this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-spotify-action="close"></div>
      <section class="config-panel spotify-panel" role="dialog" aria-modal="true" aria-label="Escolher midia">
        <header class="config-header">
          <span class="config-icon spotify-panel-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render("spotify") || ""}
          </span>
          <div class="config-title">
            <strong>Spotify</strong>
            <span>Escolher midia</span>
          </div>
          <button class="config-close" type="button" data-spotify-action="close" aria-label="Fechar">&times;</button>
        </header>
        <div class="spotify-panel-body">
          <div class="spotify-card-host" id="spotifyCardHost">
            <span class="spotify-panel-loading">Carregando biblioteca...</span>
          </div>
        </div>
      </section>
    `;
      try {
        const t = await this._createCard({
          type: "custom:spotifyplus-card",
          cardUniqueId: "bruno-shell-spotify-panel",
          entity: this._spotifyPanelConfig.entity,
          deviceDefaultId: this._spotifyPanelConfig.deviceDefaultId,
          deviceControlByName: !0,
          width: "fill",
          playerBackgroundImageSize: "cover",
          sections: ["player", "devices", "userpresets", "playlistfavorites", "searchmedia"],
          sectionDefault: "player"
        });
        if (this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== "spotify") return;
        this._spotifyPanelCard = t, this._hass && (t.hass = this._hass), this._configOverlayEl.querySelector("#spotifyCardHost")?.replaceChildren(t);
      } catch (t) {
        const a = this._configOverlayEl.querySelector("#spotifyCardHost");
        a && (a.innerHTML = `<span class="spotify-panel-loading">${O._escape(t?.message || "Spotify indisponivel")}</span>`);
      }
    }
  }
  /**
   * NOVO (Fase 5e.4) — WI-FI ABSORVIDO PELO BOTAO REDE, EM CADEIA.
   *
   * O Wi-Fi era um botao da faixa de acoes rapidas que abria um browser_mod
   * popup com o QR da rede de visitantes. Com a faixa removida, a funcao passa
   * para o botao Rede da rail, como PRIMEIRO passo: o simples primeiro, o
   * avancado a um toque. E a mesma navegacao em cadeia que o dashboard ja usa.
   *
   * `_networkStep` guarda em que passo a cadeia esta:
   *   'qr'       -> QR de visitantes (padrao ao abrir)
   *   'avancado' -> painel de rede que ja existia (BrunoNetworkPanel)
   *
   * ROLLBACK: apagar este metodo e o campo `_networkStep`, e voltar
   * `_openNetworkPanel` a chamar `_renderNetworkPanel` direto.
   */
  _renderNetworkQrStep() {
    const e = this._config?.wifi_qr_image || "/local/images/wifi_main_scanme.png";
    this._configOverlayEl.innerHTML = `
      <div class="config-scrim" data-network-action="close"></div>
      <section class="config-panel" role="dialog" aria-modal="true" aria-label="Rede">
        <header class="config-header">
          <span class="config-icon" aria-hidden="true">${globalThis.BrunoIcons?.render("network") || ""}</span>
          <div class="config-title"><strong>Wi-Fi</strong><span>Rede de visitantes</span></div>
          <button class="config-close" type="button" data-network-action="close" aria-label="Fechar">&times;</button>
        </header>
        <div class="config-section">
          <img class="network-qr" src="${O._escape(e)}" alt="QR Code da rede de visitantes">
          <p class="network-qr-dica">Aponte a camera para conectar.</p>
          <div class="config-menu-list">
            <button class="config-menu-item" type="button" data-network-action="avancado">
              <span class="config-menu-icon" aria-hidden="true">${globalThis.BrunoIcons?.render("system") || ""}</span>
              <span class="config-menu-copy"><strong>Configuracoes de rede</strong><small>Detalhes e diagnostico</small></span>
              <span class="config-menu-chevron" aria-hidden="true">&rsaquo;</span>
            </button>
          </div>
        </div>
      </section>
    `;
  }
  _renderNetworkPanel({ preserveScroll: e = !1 } = {}) {
    if (!this._configOverlayEl || this._configOverlayEl.hidden || this._configOverlayEl.dataset.panel !== "network") return;
    if (this._networkStep !== "avancado") {
      this._renderNetworkQrStep();
      return;
    }
    const t = e && this._configOverlayEl.querySelector(".network-scroll")?.scrollTop || 0;
    if (!globalThis.BrunoNetworkPanel?.render) {
      this._configOverlayEl.innerHTML = `
        <div class="config-scrim" data-network-action="close"></div>
        <section class="config-panel" role="dialog" aria-modal="true" aria-label="Rede">
          <header class="config-header">
            <span class="config-icon" aria-hidden="true">!</span>
            <div class="config-title"><strong>Rede</strong><span>Modulo indisponivel</span></div>
            <button class="config-close" type="button" data-network-action="close" aria-label="Fechar">&times;</button>
          </header>
        </section>
      `;
      return;
    }
    if (this._configOverlayEl.innerHTML = globalThis.BrunoNetworkPanel.render({ hass: this._hass }), e && t) {
      const a = this._configOverlayEl.querySelector(".network-scroll");
      a && (a.scrollTop = t);
    }
  }
  _handleConfigClick(e) {
    const t = e.target?.closest?.("[data-scenes-action]");
    if (t) {
      e.preventDefault(), e.stopPropagation(), globalThis.BrunoScenesPanel?.handleAction?.({
        target: t,
        hass: this._hass,
        host: this
      }), t.dataset.scenesAction === "close" && !globalThis.BrunoScenesPanel?.handleAction && this._closeConfigPanel();
      return;
    }
    const a = e.target?.closest?.("[data-spotify-action]");
    if (a) {
      if (e.preventDefault(), e.stopPropagation(), a.dataset.spotifyAction === "close") {
        this._closeConfigPanel();
        return;
      }
      return;
    }
    const i = e.target?.closest?.("[data-system-action]");
    if (i) {
      if (e.preventDefault(), e.stopPropagation(), i.dataset.systemAction === "close") {
        this._closeConfigPanel();
        return;
      }
      globalThis.BrunoSystemPanel?.handleAction?.({ target: i, hass: this._hass, host: this });
      return;
    }
    const r = e.target?.closest?.("[data-network-action]");
    if (r) {
      if (e.preventDefault(), e.stopPropagation(), r.dataset.networkAction === "close") {
        this._closeConfigPanel();
        return;
      }
      if (r.dataset.networkAction === "avancado") {
        this._networkStep = "avancado", this._renderNetworkPanel();
        return;
      }
      globalThis.BrunoNetworkPanel?.handleAction?.({ target: r, hass: this._hass, host: this });
      return;
    }
    const n = e.target?.closest?.("[data-updates-action]");
    if (n) {
      if (e.preventDefault(), e.stopPropagation(), n.dataset.updatesAction === "close") {
        this._closeConfigPanel();
        return;
      }
      globalThis.BrunoUpdatesPanel?.handleAction?.({
        target: n,
        hass: this._hass,
        host: this
      });
      return;
    }
    const s = e.target?.closest?.("[data-config-action]");
    if (!s) return;
    const l = s.dataset.configAction;
    if (l === "close") {
      this._closeConfigPanel();
      return;
    }
    if (l === "open-section") {
      this._configSection = s.dataset.section || "", this._wallpaperMessage = "", this._renderConfigPanel();
      return;
    }
    if (l === "child-close") {
      this._configSection = "", this._wallpaperMessage = "", this._renderConfigPanel();
      return;
    }
    if (l === "refresh") {
      this._closeConfigPanel(), globalThis.location?.reload?.();
      return;
    }
    if (l === "theme") {
      const c = s.dataset.theme;
      globalThis.BrunoThemeManager?.apply?.(c), this._renderConfigPanel();
      return;
    }
    if (l === "wallpaper-save") {
      this._saveWallpaper();
      return;
    }
    if (l === "wallpaper-area") {
      this._wallpaperSection = s.dataset.wallpaperKey || "home", this._wallpaperMessage = "", this._renderConfigPanel();
      return;
    }
    if (l === "wallpaper-pick") {
      this._configOverlayEl?.querySelector("#wallpaperFile")?.click?.();
      return;
    }
    if (l === "wallpaper-default") {
      this._saveWallpaper("");
      return;
    }
    l === "reload" && globalThis.location?.reload?.();
  }
  _handleConfigChange(e) {
    const t = e.target?.closest?.("[data-config-action]");
    if (t && t.dataset.configAction === "wallpaper-file") {
      const a = t.files?.[0];
      t.value = "", a && this._uploadWallpaper(a);
    }
  }
  async _uploadWallpaper(e) {
    const t = globalThis.BrunoWallpaperManager;
    if (t?.upload) {
      this._wallpaperMessage = "Enviando imagem...", this._renderConfigPanel();
      try {
        await t.upload({ hass: this._hass, key: this._wallpaperSection, file: e }), this._wallpaperMessage = "Wallpaper aplicado.";
      } catch (a) {
        this._wallpaperMessage = a?.message || "Nao foi possivel enviar a imagem.";
      }
      this._renderConfigPanel();
    }
  }
  async _saveWallpaper(e) {
    const t = globalThis.BrunoWallpaperManager;
    if (!t?.save) return;
    const a = this._configOverlayEl?.querySelector("#wallpaperUrl"), i = e === void 0 ? a?.value || "" : e;
    this._wallpaperMessage = "Salvando...", this._renderConfigPanel();
    try {
      await t.save({ hass: this._hass, key: this._wallpaperSection, url: i }), this._wallpaperMessage = i ? "Wallpaper aplicado." : "Wallpaper padrao restaurado.";
    } catch (r) {
      this._wallpaperMessage = r?.message || "Nao foi possivel salvar o wallpaper.";
    }
    this._renderConfigPanel();
  }
  // --- Estilo da moldura -----------------------------------------------------
  static _styles() {
    return `
      :host {
        display: block;
        width: 100%;
        height: 100vh;
        overflow: hidden;
        /* ORIGINAL (rollback): gradiente 140deg deixava a BORDA ESQUERDA (onde
           fica o rail) mais escura que o miolo -> rail parecia uma faixa marcada.
           background: linear-gradient(140deg, #07090d 0%, #111722 55%, #07090d 100%); */
        /* NOVO: gradiente VERTICAL (uniforme no eixo X) -> a coluna do rail tem o
           MESMO tom do fundo ao lado, ajudando o rail a fundir com o painel. */
        background: linear-gradient(180deg, #0a0e15 0%, #11161f 100%);
        color: rgba(246,250,255,0.94);
        font-family: var(--primary-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif);
      }

      * { box-sizing: border-box; }

      /* ORIGINAL (rollback): rail flutuante 64px, gap 10px, padding 12px na shell.
        .shell { grid-template-columns: 64px minmax(0,1fr); gap:10px; padding:12px; }
        .rail-slot { grid-column:1; }
        .content-slot { grid-column:2; }
      */
      /* NOVO (Caminho 2): rail RENTE — coluna 86px colada na borda (gap 0, sem
         padding na shell). O respiro migra para o .content-slot (padding 12px).
         Uma fina divisoria vertical (mais forte no centro) separa rail/conteudo. */
      .shell {
        height: 100%;
        display: grid;
        grid-template-columns: 86px minmax(0, 1fr);
        grid-template-rows: minmax(0, 1fr);
        gap: 0;
        padding: 0;
        position: relative;
      }

      /* NOVO (full-bleed): imagem da seção sangrando por TODA a shell (sob rail,
         faixas e blocos). z-index 0 -> tudo o resto fica acima (z-index 1).
         O ::after dá um leve escurecimento global para legibilidade — o blur
         "pesado" fica nas faixas fixas (top/dock), não aqui. */
      .backdrop {
        --bruno-backdrop-blur: 0px;
        --bruno-backdrop-scale: 1;
        --bruno-backdrop-saturate: 1;
        --bruno-backdrop-brightness: 1;
        --bruno-backdrop-dim: 0.10;
        position: absolute;
        inset: 0;
        z-index: 0;
        overflow: hidden;
      }
      /* Duas camadas para CROSSFADE por opacidade (background-image não anima). */
      .backdrop-layer {
        position: absolute;
        inset: 0;
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
        opacity: 0;
        transform: scale(var(--bruno-backdrop-scale, 1));
        filter: blur(var(--bruno-backdrop-blur, 0px)) saturate(var(--bruno-backdrop-saturate, 1)) brightness(var(--bruno-backdrop-brightness, 1));
        transition: opacity 0.28s ease-out, filter 0.22s ease-out, transform 0.22s ease-out;
        will-change: opacity;
      }
      /* NOVO: BORDA ATMOSFÉRICA escurecida no PERÍMETRO da imagem. É ela que dá
         legibilidade às regiões fixas (rail à esquerda, status no topo, dock na
         base) — por isso essas regiões voltam a ser transparentes. As bordas
         esquerda/topo/base são mais fortes (onde ficam as faixas fixas); a
         direita é mais suave. Um leve escurecimento geral fecha o contraste. */
      .backdrop::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        /* As 4 bordas com a MESMA intensidade (peak 0.70) e a MESMA proporção
           (mesmos stops 0% / 6% / 14%). Esquerda, direita, topo e base idênticas.
           Um véu uniforme leve (flat, não-direcional) fecha o contraste sem
           privilegiar nenhuma borda. */
        background:
          linear-gradient(90deg,  rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          linear-gradient(270deg, rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          linear-gradient(180deg, rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          linear-gradient(0deg,   rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
          rgba(6,9,14,var(--bruno-backdrop-dim, 0.10));
      }
      /* Sem imagem (seção sem backdrop): camada some e o :host (grafite) aparece. */
      .backdrop:not([data-active])::after { background: none; }

      .rail-slot {
        grid-column: 1;
        position: relative;
        z-index: 1;
        min-width: 0;
        min-height: 0;
      }

      /* Filete divisor do rail (vertical, mais claro no centro, sumindo nas pontas)
         — mesma linguagem do filete acima do dock. Reforçado (0.16 -> 0.30) porque
         o rail agora é transparente sobre a foto e a linha sumia. */
      .rail-slot::after {
        content: "";
        position: absolute;
        top: 0;
        right: 0;
        width: 1px;
        height: 100%;
        pointer-events: none;
        background: linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%);
        /* NOVO (2026-07-24) — feedback Home V2: rail SEM filete divisor.
           ROLLBACK: remover a linha abaixo (o gradiente acima volta a valer). */
        display: none;
      }

      .content-slot {
        grid-column: 2;
        position: relative;
        z-index: 1;
        min-width: 0;
        min-height: 0;
        overflow: hidden;
        /* ANTERIOR (rollback 2026-08-05): padding: 12px;
           O respiro da shell inteira vive aqui — a coluna da rail é colada na
           borda (gap 0, padding 0 no .shell). Os 12px da ESQUERDA eram a
           distancia entre a rail e o conteudo, e o usuario pediu para reduzi-la.
           Os outros tres lados ficam em 12px: eles sustentam o alinhamento
           atual do topo, da direita e da base. O ganho de 6px se distribui
           pelas colunas da secao — na Home a faixa de tiles e fracionaria; nas
           subviews as duas colunas sao fracionarias na resolucao do tablet. */
        /* ANTERIOR (rollback 2026-08-06): padding: 12px 12px 12px 6px;
           2a reducao a pedido do usuario — o respiro da rail continuava
           incomodando. De 12 -> 6 -> 2px. Abaixo de 2px a coluna da rail
           encosta no primeiro cartao e a divisoria some. */
        padding: 12px 12px 12px 2px;
        /* Fundo CENTRAL das secoes (padrao unico, nao por arquivo): por padrao
           TRANSPARENTE -> mostra o grafite do :host (o "escuro atras do hero").
           Para trocar o fundo de TODAS as secoes de uma vez, basta definir
           --bruno-section-backdrop no core (bruno-liquid-glass.js). */
        background: var(--bruno-section-backdrop, transparent);
      }

      /* A secao ativa preenche a regiao de conteudo. */
      .content-slot > * {
        display: block;
        height: 100%;
        min-width: 0;
        min-height: 0;
      }

      /* display:block acima tem a mesma origem autoral do atributo hidden e
         pode vence-lo no cascade. Esta regra garante que a Home persistente
         fique realmente invisivel e sem ocupar layout fora da secao Home. */
      .content-slot > [hidden] {
        display: none !important;
      }

      .content-slot > .section-error {
        position: absolute;
        inset: 12px;
        z-index: 3;
        height: auto;
        pointer-events: none;
      }

      .config-overlay[hidden] {
        display: none;
      }

      .config-overlay {
        position: fixed;
        inset: 0;
        z-index: 40;
        pointer-events: auto;
      }

      /* ANTERIOR (rollback 2026-08-06): background rgba(0,0,0,0.08) + blur(2px).
         O tema Josh deixa os popups TRANSLUCIDOS de proposito — a foto de fundo
         atravessa. Com um scrim de 8% e blur de 2px o conteudo do painel
         competia com o cenario e ficava dificil de ler. O scrim e o blur sobem;
         a translucidez do painel fica intacta, so o que esta ATRAS e que recua. */
      .config-scrim {
        position: absolute;
        inset: 0;
        background: rgba(0,0,0,0.42);
        -webkit-backdrop-filter: blur(14px) saturate(0.92) brightness(0.82);
        backdrop-filter: blur(14px) saturate(0.92) brightness(0.82);
      }

      /* NOVO (5e.4) — passo do QR de visitantes no painel Rede. */
      .network-qr {
        display: block;
        width: min(260px, 100%);
        margin: 4px auto 10px;
        border-radius: 14px;
        background: #fff;
        padding: 8px;
        box-sizing: border-box;
      }
      .network-qr-dica {
        margin: 0 0 12px;
        text-align: center;
        font-size: 12px;
        color: rgba(255,255,255,0.62);
      }

      .config-panel {
        position: absolute;
        left: 94px;
        bottom: 74px;
        width: min(360px, calc(100vw - 124px));
        border-radius: var(--bruno-liquid-card-radius-compact, 24px);
        border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
        background: var(--bruno-liquid-popup-background, linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660)));
        box-shadow: var(--bruno-liquid-popup-shadow, 0 18px 36px rgba(0,0,0,0.30));
        -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
        backdrop-filter: var(--bruno-liquid-popup-filter, blur(20px) saturate(1.16) brightness(0.94));
        color: rgba(255,255,255,0.92);
        overflow: hidden;
      }

      /* REV. 2026-08-14 — Diagnostico sempre dentro do viewport.
         ANTERIOR (rollback): o painel crescia com todo o conteudo e ultrapassava
         a tela. O invólucro agora fica entre as margens uteis e somente o card
         interno rola; os demais popups conservam a geometria existente. */
      .config-child-panel[aria-label="Diagnostico"] {
        top: 12px;
        bottom: 74px;
        max-height: none;
        display: flex;
        flex-direction: column;
      }
      .config-child-panel[aria-label="Diagnostico"] > #diagnosticoHost {
        min-height: 0;
        flex: 1 1 auto;
        overflow: hidden;
      }
      .config-child-panel[aria-label="Diagnostico"] bruno-diagnostics {
        display: block;
        height: 100%;
        min-height: 0;
      }

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel {
        --bruno-popup-inner-background: var(--bruno-liquid-control-background);
        --bruno-popup-inner-filter: var(--bruno-liquid-control-filter);
        --bruno-popup-inner-border: var(--bruno-liquid-control-border);
        --bruno-popup-inner-shadow: var(--bruno-liquid-control-shadow);
        --bruno-popup-inner-radius: var(--bruno-liquid-control-radius-compact, 12px);
        --bruno-popup-inner-warm-background: var(--bruno-liquid-control-warm-background, var(--bruno-liquid-control-background));
        --bruno-popup-inner-warm-border: var(--bruno-liquid-control-warm-border, var(--bruno-liquid-control-border));
        --bruno-popup-inner-warm-shadow: var(--bruno-liquid-control-warm-shadow, var(--bruno-liquid-control-shadow));
        --bruno-popup-action-radius: var(--bruno-liquid-control-radius-compact, 12px);
        --bruno-popup-banner-border: var(--bruno-liquid-control-border);
        --bruno-popup-banner-radius: var(--bruno-liquid-control-radius-compact, 12px);
        --bruno-popup-banner-shadow: var(--bruno-liquid-control-shadow);
        border: var(--bruno-josh-popup-border, var(--bruno-liquid-popup-border));
        background: var(--bruno-josh-popup-background, var(--bruno-liquid-popup-background));
        box-shadow: var(--bruno-josh-popup-shadow, var(--bruno-liquid-popup-shadow));
        -webkit-backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
        backdrop-filter: var(--bruno-josh-popup-filter, var(--bruno-liquid-popup-filter));
        isolation: isolate;
      }

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel::before,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel::before,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel::before,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel::before {
        content: "";
        position: absolute;
        inset: 1px;
        z-index: 0;
        border-radius: inherit;
        background: var(--bruno-josh-popup-sheen, none);
        opacity: var(--bruno-josh-popup-sheen-opacity, 0.13);
        pointer-events: none;
      }

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel::after,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel::after,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel::after,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel::after {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 2;
        padding: 1px;
        border-radius: inherit;
        background: var(--bruno-josh-popup-edge-glow, none);
        opacity: var(--bruno-josh-popup-edge-opacity, 0.70);
        pointer-events: none;
        -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
      }

      .config-overlay[data-bruno-popup-theme="josh"][data-panel="config"] > .config-panel > *,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="system"] > .config-panel > *,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="network"] > .config-panel > *,
      .config-overlay[data-bruno-popup-theme="josh"][data-panel="scenes"] > .config-panel > * {
        position: relative;
        z-index: 1;
      }

      .config-child-panel {
        left: 466px;
        width: min(430px, calc(100vw - 496px));
      }

      .config-child-panel.updates-panel {
        width: min(520px, calc(100vw - 496px));
      }

      .config-header {
        display: grid;
        grid-template-columns: 34px minmax(0, 1fr) 32px;
        align-items: center;
        gap: 10px;
        padding: 14px 14px 12px;
      }

      .config-icon {
        width: 34px;
        height: 34px;
        display: grid;
        place-items: center;
        border-radius: 50%;
        border: 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.30);
        background: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.08);
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.92);
      }

      .config-icon svg,
      .config-close svg {
        width: 18px;
        height: 18px;
      }

      .config-icon svg {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .config-title {
        min-width: 0;
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .config-title strong {
        font-size: 13px;
        line-height: 1.1;
        font-weight: 800;
      }

      .config-title span,
      .config-section-title small,
      .theme-option small {
        font-size: 10px;
        line-height: 1.1;
        color: rgba(255,255,255,0.58);
      }

      .config-close {
        width: 32px;
        height: 32px;
        display: grid;
        place-items: center;
        border: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.045);
        color: rgba(255,255,255,0.66);
        font-size: 21px;
        line-height: 1;
        cursor: pointer;
      }

      .config-section {
        padding: 0 14px 14px;
      }

      .config-menu-section {
        padding-top: 2px;
      }

      .config-menu-list {
        display: grid;
      }

      .config-menu-item {
        min-height: 54px;
        display: grid;
        grid-template-columns: 30px minmax(0, 1fr) auto;
        align-items: center;
        gap: 10px;
        padding: 8px 3px;
        border: 0;
        border-top: 1px solid rgba(255,255,255,0.060);
        background: transparent;
        color: rgba(255,255,255,0.88);
        text-align: left;
        cursor: pointer;
      }

      .config-menu-item:first-child {
        border-top: 0;
      }

      .config-menu-item:hover,
      .config-menu-item:focus-visible {
        background: rgba(255,255,255,0.035);
      }

      .config-menu-icon {
        width: 30px;
        height: 30px;
        display: grid;
        place-items: center;
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.88);
      }

      .config-menu-icon svg {
        width: 19px;
        height: 19px;
        fill: none;
        stroke: currentColor;
        stroke-width: 1.65;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .config-menu-copy {
        min-width: 0;
        display: grid;
        gap: 3px;
      }

      .config-menu-copy strong {
        font-size: 12px;
        line-height: 1.1;
        font-weight: 800;
      }

      .config-menu-copy small {
        min-width: 0;
        font-size: 9px;
        line-height: 1.1;
        color: rgba(255,255,255,0.54);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .config-menu-chevron {
        color: rgba(255,255,255,0.44);
        font-size: 22px;
        line-height: 1;
      }

      .config-menu-count {
        min-width: 21px;
        height: 21px;
        display: grid;
        place-items: center;
        padding: 0 6px;
        border-radius: 999px;
        background: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.16);
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.96);
        font-size: 9px;
        font-weight: 900;
      }

      .config-section-title {
        display: flex;
        align-items: baseline;
        justify-content: space-between;
        gap: 12px;
        padding: 0 2px 8px;
      }

      .config-section-title span {
        font-size: 11px;
        font-weight: 800;
        color: rgba(255,255,255,0.82);
      }

      .theme-list {
        display: grid;
        gap: 8px;
      }

      .theme-option {
        min-height: 46px;
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 12px;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
        color: rgba(255,255,255,0.86);
        padding: 9px 11px;
        text-align: left;
        cursor: pointer;
      }

      .theme-option span {
        font-size: 12px;
        font-weight: 800;
      }

      .theme-option.is-selected {
        background: var(--bruno-liquid-selected-blue-background, rgba(96,165,250,0.34));
        border-color: var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.30));
        box-shadow: var(--bruno-liquid-selected-blue-shadow, inset 0 1px 0 rgba(255,255,255,0.10));
      }

      .theme-option:disabled {
        opacity: 0.44;
        cursor: default;
      }

      .config-footer {
        display: flex;
        justify-content: flex-end;
        padding: 0 14px 14px;
      }

      .config-refresh {
        min-height: 34px;
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.18));
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: var(--bruno-liquid-control-warm-background, rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.038));
        box-shadow: var(--bruno-liquid-control-warm-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
        color: rgba(255,255,255,0.86);
        padding: 0 14px;
        font-size: 11px;
        font-weight: 800;
        cursor: pointer;
      }

      .config-secondary {
        min-height: 34px;
        border: 1px solid rgba(255,255,255,0.070);
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: rgba(255,255,255,0.026);
        color: rgba(255,255,255,0.64);
        padding: 0 12px;
        font-size: 10px;
        font-weight: 800;
        cursor: pointer;
      }

      .wallpaper-content {
        display: grid;
        gap: 12px;
      }

      .wallpaper-field {
        display: grid;
        gap: 6px;
      }

      .wallpaper-field > span {
        font-size: 10px;
        font-weight: 800;
        color: rgba(255,255,255,0.72);
      }

      .wallpaper-field select,
      .wallpaper-field input {
        width: 100%;
        min-height: 40px;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        border-radius: var(--bruno-liquid-control-radius-compact, 14px);
        background: rgba(10,12,16,0.22);
        color: rgba(255,255,255,0.86);
        padding: 0 11px;
        font: inherit;
        font-size: 11px;
        outline: none;
      }

      .wallpaper-area-list {
        max-height: 162px;
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px;
        overflow-y: auto;
        padding-right: 2px;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.20) transparent;
      }

      .wallpaper-area-option,
      .wallpaper-file-button {
        min-height: 34px;
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        border-radius: var(--bruno-liquid-control-radius-compact, 12px);
        background: var(--bruno-liquid-control-background, rgba(255,255,255,0.030));
        color: rgba(255,255,255,0.76);
        padding: 0 9px;
        font: inherit;
        font-size: 10px;
        font-weight: 760;
        text-align: left;
        cursor: pointer;
      }

      .wallpaper-area-option.is-selected {
        color: rgba(255,255,255,0.96);
        border-color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.28);
        background: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.08);
      }

      .wallpaper-preview {
        height: 92px;
        border-radius: var(--bruno-liquid-cell-radius, 13px);
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        background: rgba(255,255,255,0.025);
        overflow: hidden;
      }

      .wallpaper-preview.has-image {
        background: var(--wallpaper-preview) center / cover no-repeat;
      }

      .wallpaper-file-input {
        display: none;
      }

      .wallpaper-file-button {
        width: 100%;
        min-height: 38px;
        color: rgba(255,255,255,0.88);
        text-align: center;
      }

      .wallpaper-field input:focus,
      .wallpaper-field select:focus {
        border-color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.32);
      }

      .wallpaper-help,
      .wallpaper-message {
        font-size: 9px;
        line-height: 1.35;
        color: rgba(255,255,255,0.50);
      }

      .wallpaper-message {
        color: rgba(124,236,169,0.82);
      }

      .wallpaper-message.is-warning {
        color: rgba(255,210,122,0.78);
      }

      .wallpaper-footer {
        justify-content: space-between;
        gap: 10px;
      }

      .config-panel.spotify-panel {
        left: 50%;
        top: 50%;
        bottom: auto;
        width: min(590px, calc(100vw - 132px));
        max-height: min(680px, calc(100vh - 64px));
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
        transform: translate(-50%, -50%);
      }

      .spotify-panel-icon {
        color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.94);
      }

      .spotify-panel-body {
        min-height: 0;
        overflow: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.24) transparent;
        -webkit-overflow-scrolling: touch;
        padding: 0 12px 14px;
      }

      .spotify-panel-body::-webkit-scrollbar {
        width: 5px;
      }

      .spotify-panel-body::-webkit-scrollbar-track {
        background: transparent;
      }

      .spotify-panel-body::-webkit-scrollbar-thumb {
        border-radius: 999px;
        background: rgba(255,255,255,0.24);
      }

      .spotify-card-host {
        min-height: 260px;
        overflow: hidden;
        border-radius: var(--bruno-liquid-cell-radius, 14px);
        background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.025));
        border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.070));
        --ha-card-background: transparent;
        --card-background-color: transparent;
        --ha-card-border-width: 0;
        --ha-card-border-color: transparent;
        --ha-card-box-shadow: none;
        --ha-card-border-radius: 0;
        --primary-background-color: transparent;
        --secondary-background-color: transparent;
      }

      .spotify-card-host > * {
        display: block;
        width: 100%;
      }

      .spotify-panel-loading {
        min-height: 260px;
        display: grid;
        place-items: center;
        padding: 20px;
        color: rgba(255,255,255,0.58);
        font-size: 11px;
        font-weight: 700;
      }

      .err {
        padding: 16px;
        color: #ffd9df;
        font: 600 13px/1.4 var(--primary-font-family, inherit);
      }

      /* ============================================================
         NOVO (2026-07-09) — MODO PHONE (<=800px, Opcao A mobile).
         A MESMA shell se reorganiza em telas estreitas:
           - grid vira 1 COLUNA com 2 linhas: conteudo em cima + rail
             embaixo (o bento-sidebar-card "deita" e vira dock via
             media query propria — ver bento-sidebar-card.js);
           - .content-slot passa a ROLAR verticalmente (no tablet ele
             e fixo, overflow hidden);
           - as secoes deixam de ser esticadas a 100% da altura
             (height auto + min-height 100%) para empilhar em coluna;
           - o painel de Config ancora acima do dock (no tablet ele
             ancora ao lado da rail esquerda).
         Bloco ADITIVO (regra de ouro): nada acima foi alterado.
         ROLLBACK: remover este bloco @media => shell volta a ser
         tablet-only (rail lateral em qualquer largura).
         ============================================================ */
      @media (max-width: 800px) {
        :host {
          height: 100vh;
          height: 100dvh;

          /* NOVO (2026-08-10) — ALTURA DO DOCK, publicada para quem esta DENTRO
             do content-slot. Propriedade customizada atravessa shadow DOM por
             heranca, entao a subview le este valor sem conhecer a shell.
             Serve para a bottom sheet reservar os controles ACIMA do dock,
             embora a superficie da folha continue por tras da rail. O
             rail-slot fica acima do content-slot e preserva os toques do dock.
             Se a altura do dock mudar em bento-sidebar-card.js, mudar AQUI. */
          /* Rede de seguranca. O valor bom vem de _observarDock(), que MEDE. */
          --bruno-dock-h: calc(74px + env(safe-area-inset-bottom, 0px));
          /* Material VisionOS da folha. Quando aberta, ela mesma continua por
             tras da rail transparente. Escopo exclusivo do telefone. */
          --bruno-mobile-sheet-background:
            radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%),
            linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)),
            rgba(0,0,0,0.300);
          --bruno-mobile-sheet-filter: blur(20px) saturate(1.18) brightness(1.03);
        }
        /* A rail fechada e transparente: no telefone a borda atmosferica nao
           pinta um rodape proprio. Permanecem as laterais, o topo e o veu geral
           que garantem contraste ao restante da composicao. */
        .backdrop::after {
          background:
            linear-gradient(90deg,  rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
            linear-gradient(270deg, rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
            linear-gradient(180deg, rgba(4,7,11,0.86) 0%, rgba(4,7,11,0.40) 6%, rgba(4,7,11,0.00) 16%),
            rgba(6,9,14,var(--bruno-backdrop-dim, 0.10));
        }
        .shell {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: minmax(0, 1fr) auto;
        }
        .rail-slot {
          grid-column: 1;
          grid-row: 2;
          /* Fase 2: acima do content-slot (z 1) para o menu "Mais" do dock
             abrir SOBRE o conteudo, nao por baixo. */
          z-index: 2;
        }
        .rail-slot::after {
          display: block;
          top: 0;
          left: 0;
          right: auto;
          width: 100%;
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.30) 50%, transparent 100%);
        }
        /* ANTERIOR (rollback rev. faixa-de-tiles): a folha elevava o
           content-slot acima do dock. Isso fazia a bottom sheet cobrir a rail:
           .shell.tem-folha .content-slot { z-index: 3; }

           NOVO (2026-08-12): a rail permanece fixa e a frente da folha. A
           classe tem-folha continua sendo publicada por _onFolha(), mas agora
           eleva apenas o rail-slot. As regras vivem exclusivamente no phone;
           a rail vertical do tablet conserva a pilha original. */
        .shell.tem-folha .content-slot {
          z-index: 1;
        }
        .shell.tem-folha .rail-slot {
          z-index: 4;
          /* A folha agora segue ate a borda inferior, por tras deste slot. A
             rail permanece genuinamente transparente nos dois estados; quando
             a folha abre, o mesmo material aparece por baixo dela sem emenda. */
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }

        .content-slot {
          grid-column: 1;
          grid-row: 1;
          overflow-y: auto;
          /* ANTERIOR (rollback 2026-08-15): somente a subview desativava
             scroll anchoring. O elemento que realmente rola e decide a ancora
             e este slot da shell; por isso Office e Quartos ainda deslocavam
             ao montar/desmontar a folha. Exclusivo do breakpoint phone. */
          overflow-anchor: none;
          -webkit-overflow-scrolling: touch;
          padding: 10px 10px 6px;
        }
        .content-slot > * {
          height: auto;
          min-height: 100%;
        }
        .config-panel {
          left: 12px;
          right: 12px;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          width: auto;
        }

        .config-root-panel.has-child {
          display: none;
        }

        .config-child-panel,
        .config-child-panel.updates-panel {
          left: 12px;
          right: 12px;
          width: auto;
        }

        .config-child-panel[aria-label="Diagnostico"] {
          top: 12px;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
        }

        .config-panel.spotify-panel {
          left: 12px;
          right: 12px;
          top: 12px;
          bottom: calc(84px + env(safe-area-inset-bottom, 0px));
          width: auto;
          height: auto;
          max-height: none;
          transform: none;
        }
      }
    `;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return O._escape(e).replace(/"/g, "&quot;");
  }
  static _cssUrl(e) {
    return String(e ?? "").replace(/\\/g, "\\\\").replace(/'/g, "\\'");
  }
}
customElements.get(dt) || customElements.define(dt, O);
window.customCards = window.customCards || [];
window.customCards.push({
  type: dt,
  name: "Bruno Shell",
  description: "App-shell com barra fixa e conteudo que troca por secao."
});
const Zi = "20260723-liquid-performance-1", Bt = "bruno-liquid-glass-tokens", At = {
  "bruno-liquid-accent": "255, 159, 10",
  "bruno-liquid-warm-accent": "255, 214, 10",
  "bruno-liquid-green-accent": "50, 215, 75",
  // Home Assistant theme values mirrored from Liquid Glass.yaml.
  "background-image": "center / cover no-repeat fixed url('https://raw.githubusercontent.com/Nezz/homeassistant-visionos-theme/refs/heads/static/macOS_26_Dark.webp')",
  "primary-background-color": "rgb(18, 11, 25)",
  "secondary-background-color": "rgb(18, 11, 25)",
  "app-header-background-color": "rgba(18, 11, 25, 0.3)",
  "ha-card-background": "rgba(0, 0, 0, 0.38)",
  "app-theme-color": "rgb(0, 0, 0)",
  "primary-text-color": "rgba(255, 255, 255, 0.96)",
  "secondary-text-color": "rgba(222, 222, 222, 0.96)",
  "divider-color": "rgba(152, 152, 157, 0.3)",
  "ha-card-border-radius": "34px",
  "ha-card-features-border-radius": "var(--ha-card-border-radius)",
  "ha-card-border-width": "0",
  "ha-card-backdrop-filter": "blur(5px)",
  "ha-card-box-shadow": `
    3px 3px 0.5px -3.5px rgba(255,255,255,0.30) inset,
    -2px -2px 0.5px -2px rgba(255,255,255,0.30) inset,
    0 0 8px 1px rgba(255,255,255,0.10) inset,
    0 0 2px 0 rgba(0,0,0,0.10)
  `,
  "red-color": "#FF453A",
  "pink-color": "#FF375F",
  "purple-color": "#BF5AF2",
  "indigo-color": "#5E5CE6",
  "blue-color": "#0A84FF",
  "cyan-color": "#5AC8F5",
  "green-color": "#32D74B",
  "yellow-color": "#FFD60A",
  "orange-color": "#FF9F0A",
  "brown-color": "#AC8E68",
  "primary-color": "var(--orange-color)",
  "bruno-liquid-card-radius": "34px",
  "bruno-liquid-card-radius-compact": "24px",
  "bruno-liquid-room-radius": "24px",
  "bruno-liquid-cell-radius": "18px",
  "bruno-liquid-control-radius": "18px",
  "bruno-liquid-control-radius-compact": "14px",
  "bruno-liquid-dock-radius": "999px",
  "bruno-liquid-rail-radius": "999px",
  "bruno-liquid-motion-fast": "160ms ease",
  "bruno-liquid-motion-medium": "220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  "bruno-liquid-icon-title": "16px",
  "bruno-liquid-icon-section": "20px",
  "bruno-liquid-icon-control": "23px",
  "bruno-liquid-icon-status": "15px",
  "bruno-liquid-icon-overflow": "19px",
  // Shared premium block skin: neutral real glass, thin borders and low-fill
  // surfaces so the photo reads through without turning the cards brown.
  "bruno-liquid-card-background": `
    linear-gradient(180deg, rgba(255,255,255,0.045), rgba(255,255,255,0.012) 48%, rgba(0,0,0,0.045)),
    var(--ha-card-background, rgba(0,0,0,0.380))
  `,
  "bruno-liquid-card-filter": "var(--ha-card-backdrop-filter, blur(5px)) saturate(1.06) brightness(1.02)",
  "bruno-liquid-card-border-color": "rgba(255,255,255,0.120)",
  "bruno-liquid-card-border": "1px solid var(--bruno-liquid-card-border-color)",
  "bruno-liquid-card-shadow": "var(--ha-card-box-shadow)",
  "bruno-liquid-card-sheen": `
    linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 38%)
  `,
  "bruno-liquid-card-sheen-opacity": "0.08",
  "bruno-liquid-card-edge-glow": "none",
  "bruno-liquid-dock-background": `
    radial-gradient(86px 70px at 18% 0%, rgba(255,255,255,0.19), transparent 72%),
    radial-gradient(98px 82px at 92% 100%, rgba(var(--accent, var(--bruno-liquid-accent)),0.08), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.106), rgba(255,255,255,0.030) 42%, rgba(255,255,255,0.048)),
    linear-gradient(155deg, rgba(18,24,36,0.70), rgba(10,13,20,0.60) 52%, rgba(18,16,17,0.42))
  `,
  "bruno-liquid-dock-filter": "blur(28px) saturate(1.56) contrast(1.05)",
  "bruno-liquid-dock-border": "1px solid rgba(255,255,255,0.17)",
  "bruno-liquid-dock-shadow": `
    inset 0 0 0 1px rgba(255,255,255,0.060),
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 1px 0 0 rgba(255,255,255,0.10),
    inset 0 -1px 0 rgba(255,255,255,0.045),
    0 14px 34px rgba(0,0,0,0.30),
    0 0 22px rgba(110,150,210,0.060)
  `,
  "bruno-liquid-dock-sheen": `
    radial-gradient(58px 42px at 18% 2%, rgba(255,255,255,0.20), transparent 72%),
    radial-gradient(64px 72px at 92% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.10), transparent 74%),
    linear-gradient(180deg, rgba(255,255,255,0.115), rgba(255,255,255,0.00) 38%)
  `,
  "bruno-liquid-dock-sheen-opacity": "0.70",
  "bruno-liquid-dock-edge-glow": `
    linear-gradient(125deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08) 34%, rgba(255,255,255,0.026) 62%, rgba(255,190,120,0.17) 100%)
  `,
  "bruno-liquid-rail-background": `
    radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
    radial-gradient(38px 110px at 92% 86%, rgba(var(--accent, var(--bruno-liquid-accent)),0.10), transparent 68%),
    linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
    linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
  `,
  "bruno-liquid-rail-filter": "blur(30px) saturate(1.58) contrast(1.05)",
  "bruno-liquid-rail-border": "1px solid rgba(255,255,255,0.16)",
  "bruno-liquid-rail-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.23),
    inset 1px 0 0 rgba(255,255,255,0.11),
    inset -1px -1px 0 rgba(255,255,255,0.026),
    0 18px 44px rgba(0,0,0,0.31),
    0 0 24px rgba(110,150,210,0.075)
  `,
  "bruno-liquid-rail-sheen": `
    radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
    radial-gradient(42px 70px at 94% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.16), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
    linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
  `,
  "bruno-liquid-rail-sheen-opacity": "0.78",
  "bruno-liquid-cell-background": `
    linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006)),
    rgba(9,11,15,0.030)
  `,
  "bruno-liquid-cell-border-color": "rgba(255,255,255,0.050)",
  "bruno-liquid-cell-border": "1px solid var(--bruno-liquid-cell-border-color)",
  "bruno-liquid-cell-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.040)
  `,
  "bruno-liquid-cell-active-warm-background": `
    linear-gradient(180deg, rgba(255,255,255,0.042), rgba(255,255,255,0.012)),
    rgba(var(--bruno-liquid-warm-accent),0.030)
  `,
  "bruno-liquid-cell-active-warm-border": "rgba(var(--bruno-liquid-warm-accent),0.180)",
  "bruno-liquid-cell-active-warm-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.060),
    0 0 12px rgba(var(--bruno-liquid-warm-accent),0.060)
  `,
  "bruno-liquid-chip-background": `
    linear-gradient(180deg, rgba(255,255,255,0.036), rgba(255,255,255,0.012)),
    rgba(9,11,15,0.060)
  `,
  "bruno-liquid-chip-border": "1px solid rgba(255,255,255,0.070)",
  "bruno-liquid-chip-shadow": "inset 0 1px 0 rgba(255,255,255,0.060)",
  "bruno-liquid-chip-filter": "blur(12px) saturate(0.96) brightness(1.04)",
  "bruno-liquid-control-background": `
    linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)),
    rgba(255,255,255,0.030)
  `,
  "bruno-liquid-control-border-color": "rgba(255,255,255,0.070)",
  "bruno-liquid-control-border": "1px solid var(--bruno-liquid-control-border-color)",
  "bruno-liquid-control-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.060)
  `,
  "bruno-liquid-control-filter": "blur(12px) saturate(0.96) brightness(1.04)",
  "bruno-liquid-control-warm-background": "rgba(var(--bruno-liquid-warm-accent),0.038)",
  "bruno-liquid-control-warm-border": "1px solid rgba(var(--bruno-liquid-warm-accent),0.180)",
  "bruno-liquid-control-warm-shadow": "inset 0 1px 0 rgba(255,255,255,0.060)",
  "bruno-liquid-control-blue-background": `
    linear-gradient(180deg, rgba(96,165,250,0.42), rgba(38,92,138,0.24)),
    rgba(255,255,255,0.030)
  `,
  "bruno-liquid-control-blue-border": "rgba(10,132,255,0.320)",
  "bruno-liquid-control-blue-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.100),
    0 0 14px rgba(10,132,255,0.120)
  `,
  "bruno-liquid-control-green-background": `
    linear-gradient(180deg, rgba(46,231,122,0.160), rgba(19,76,54,0.080)),
    rgba(255,255,255,0.030)
  `,
  "bruno-liquid-control-green-border": "rgba(46,231,122,0.220)",
  "bruno-liquid-control-green-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.080),
    0 0 12px rgba(46,231,122,0.080)
  `,
  "bruno-liquid-selected-blue-background": `
    linear-gradient(180deg, rgba(105,150,230,0.440), rgba(59,92,178,0.300)),
    rgba(255,255,255,0.028)
  `,
  "bruno-liquid-selected-blue-border": "rgba(210,228,255,0.300)",
  "bruno-liquid-selected-blue-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.110),
    0 0 14px rgba(10,132,255,0.140)
  `,
  // Dedicated transient surface: used by compact selectors/popovers that need
  // markedly stronger contrast than the shared translucent card skin.
  "bruno-liquid-popup-background": `
    linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
  `,
  "bruno-liquid-popup-border": "1px solid rgba(255,255,255,0.115)",
  "bruno-liquid-popup-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.100),
    0 18px 36px rgba(0,0,0,0.300)
  `,
  "bruno-liquid-popup-filter": "blur(20px) saturate(1.16) brightness(0.94)",
  "bruno-liquid-popup-option-background": "rgba(255,255,255,0.045)",
  "bruno-liquid-popup-option-hover-background": "rgba(var(--bruno-liquid-warm-accent),0.115)",
  "bruno-liquid-surface-bottom-line": "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
  "bruno-liquid-surface-bottom-line-opacity": "0",
  /* NOVO (2026-07-23): estado "aceso" deixou de ser quase igual ao "apagado"
     (ambos eram preto translucido, diferenca imperceptivel). Por pedido do
     usuario, o aceso agora usa o MESMO tratamento do estado apagado do tema
     "Liquid Glass - iOS" (vidro claro/frosted) — o apagado deste tema
     continua intocado, so o aceso foi trocado. Fonte: bruno-liquid-glass-ios.js,
     bloco 'bruno-liquid-surface-off-*'. */
  /* ANTERIOR (rollback):
  'bruno-liquid-surface-on-background': `
    linear-gradient(180deg, rgba(255,255,255,0.048), rgba(255,255,255,0.014) 54%, rgba(255,255,255,0.020)),
    rgba(9,11,15,0.260)
  `,
  'bruno-liquid-surface-on-filter': 'blur(6px) saturate(1.02) brightness(1.03) contrast(1.01)',
  'bruno-liquid-surface-on-border-color': 'rgba(255,255,255,0.092)',
  'bruno-liquid-surface-on-shadow': `
    inset 0 1px 0 rgba(255,255,255,0.066),
    0 6px 16px rgba(0,0,0,0.105)
  `,
  'bruno-liquid-surface-on-sheen': `
    linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.00) 38%)
  `,
  'bruno-liquid-surface-on-sheen-opacity': '0.08',
  --- FIM ANTERIOR --- */
  "bruno-liquid-surface-on-background": `
    radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.30), rgba(255,255,255,0.06) 46%, transparent 73%),
    linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07)),
    linear-gradient(155deg, rgba(255,255,255,0.11), rgba(255,255,255,0.055))
  `,
  "bruno-liquid-surface-on-filter": "blur(14px) saturate(1.28) brightness(1.04)",
  "bruno-liquid-surface-on-border-color": "rgba(255,255,255,0.16)",
  "bruno-liquid-surface-on-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.36),
    inset 1px 0 0 rgba(255,255,255,0.12),
    inset -1px 0 0 rgba(255,255,255,0.07),
    inset 0 -1px 0 rgba(255,255,255,0.04),
    0 8px 24px rgba(0,0,0,0.32)
  `,
  "bruno-liquid-surface-on-sheen": `
    radial-gradient(112px 72px at 16% 0%, rgba(255,255,255,0.40), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.00) 38%),
    linear-gradient(90deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 48%)
  `,
  "bruno-liquid-surface-on-sheen-opacity": "0.85",
  "bruno-liquid-band-background": "rgba(255,255,255,0.010)",
  "bruno-liquid-band-border-color": "rgba(255,255,255,0.035)",
  "bruno-liquid-band-border": "1px solid var(--bruno-liquid-band-border-color)",
  "bruno-liquid-band-shadow": "none",
  /* ANTERIOR (rollback): band-open apontava para --bruno-liquid-surface-on-*,
     que agora e o vidro claro emprestado do tema iOS (luz acesa). Como
     "band-open" e sobre secao/aba EXPANDIDA (sem relacao com luz), isso
     fazia o acordeao das subviews herdar o vidro claro por engano.
     Desacoplado com valor proprio — o mesmo visual escuro sutil que
     --bruno-liquid-surface-on-* tinha antes desta sessao.
  'bruno-liquid-band-open-background': 'var(--bruno-liquid-surface-on-background)',
  'bruno-liquid-band-open-border-color': 'var(--bruno-liquid-surface-on-border-color)',
  'bruno-liquid-band-open-shadow': 'var(--bruno-liquid-surface-on-shadow)',
  --- FIM ANTERIOR --- */
  "bruno-liquid-band-open-background": `
    linear-gradient(180deg, rgba(255,255,255,0.048), rgba(255,255,255,0.014) 54%, rgba(255,255,255,0.020)),
    rgba(9,11,15,0.260)
  `,
  "bruno-liquid-band-open-border-color": "rgba(255,255,255,0.092)",
  "bruno-liquid-band-open-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.066),
    0 6px 16px rgba(0,0,0,0.105)
  `
};
Object.assign(At, {
  // Compatibility aliases used by already migrated components.
  "bruno-liquid-surface-off-background": "var(--bruno-liquid-card-background)",
  "bruno-liquid-surface-off-filter": "var(--bruno-liquid-card-filter)",
  "bruno-liquid-surface-off-border": "var(--bruno-liquid-card-border)",
  "bruno-liquid-surface-off-shadow": "var(--bruno-liquid-card-shadow)",
  "bruno-liquid-surface-off-sheen": "var(--bruno-liquid-card-sheen)",
  "bruno-liquid-surface-off-sheen-opacity": "var(--bruno-liquid-card-sheen-opacity)",
  "bruno-liquid-surface-edge-glow": "var(--bruno-liquid-card-edge-glow)",
  "bruno-liquid-active-warm-background": "var(--bruno-liquid-surface-on-background)",
  "bruno-liquid-active-warm-border-color": "var(--bruno-liquid-surface-on-border-color)",
  "bruno-liquid-active-warm-shadow": "var(--bruno-liquid-surface-on-shadow)",
  "bruno-liquid-active-warm-sheen": "var(--bruno-liquid-surface-on-sheen)"
});
const Ki = {
  card: {
    background: "var(--bruno-liquid-card-background)",
    filter: "var(--bruno-liquid-card-filter)",
    border: "var(--bruno-liquid-card-border)",
    shadow: "var(--bruno-liquid-card-shadow)",
    sheen: "var(--bruno-liquid-card-sheen)",
    edgeGlow: "var(--bruno-liquid-card-edge-glow)"
  },
  dock: {
    background: "var(--bruno-liquid-dock-background)",
    filter: "var(--bruno-liquid-dock-filter)",
    border: "var(--bruno-liquid-dock-border)",
    shadow: "var(--bruno-liquid-dock-shadow)",
    sheen: "var(--bruno-liquid-dock-sheen)",
    edgeGlow: "var(--bruno-liquid-dock-edge-glow)"
  },
  rail: {
    background: "var(--bruno-liquid-rail-background)",
    filter: "var(--bruno-liquid-rail-filter)",
    border: "var(--bruno-liquid-rail-border)",
    shadow: "var(--bruno-liquid-rail-shadow)",
    sheen: "var(--bruno-liquid-rail-sheen)"
  },
  cell: {
    background: "var(--bruno-liquid-cell-background)",
    border: "var(--bruno-liquid-cell-border)",
    shadow: "var(--bruno-liquid-cell-shadow)"
  },
  control: {
    background: "var(--bruno-liquid-control-background)",
    border: "var(--bruno-liquid-control-border)",
    shadow: "var(--bruno-liquid-control-shadow)",
    filter: "var(--bruno-liquid-control-filter)"
  },
  chip: {
    background: "var(--bruno-liquid-chip-background)",
    border: "var(--bruno-liquid-chip-border)",
    shadow: "var(--bruno-liquid-chip-shadow)",
    filter: "var(--bruno-liquid-chip-filter)"
  }
}, Yi = {
  activeWarm: {
    background: "var(--bruno-liquid-active-warm-background)",
    borderColor: "var(--bruno-liquid-active-warm-border-color)",
    shadow: "var(--bruno-liquid-active-warm-shadow)",
    sheen: "var(--bruno-liquid-active-warm-sheen)"
  },
  selectedBlue: {
    background: "var(--bruno-liquid-selected-blue-background)",
    borderColor: "var(--bruno-liquid-selected-blue-border)",
    shadow: "var(--bruno-liquid-selected-blue-shadow)"
  }
}, Qi = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background:
    radial-gradient(420px 300px at 50% 36%, rgba(255,255,255,0.055), transparent 68%),
    rgba(4,7,12,0.10);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}

@keyframes bruno-liquid-route-fade {
  0% {
    opacity: 0;
  }
  36% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes bruno-liquid-route-fade-reduced {
  0% {
    opacity: 0.16;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    animation: bruno-liquid-route-fade-reduced 180ms ease-out both;
  }
}
`;
function Xi(o) {
  return Object.entries(o).map(([e, t]) => `  --${e}: ${String(t).trim().replace(/\s+/g, " ")};`).join(`
`);
}
function Xa(o = globalThis.document) {
  if (!o?.head) return null;
  let e = o.getElementById(Bt);
  return e || (e = o.createElement("style"), e.id = Bt, o.head.appendChild(e)), e.textContent = `:root {
${Xi(At)}
}
${Qi}`, e;
}
function Ji(o = "tap") {
  const e = globalThis.navigator?.vibrate;
  if (typeof e != "function") return !1;
  const t = o === "hold" ? [12, 24, 12] : 10;
  try {
    return e.call(globalThis.navigator, t), !0;
  } catch {
    return !1;
  }
}
function er(o = 280) {
  const e = globalThis.document?.documentElement;
  e && (e.classList.remove("bruno-liquid-route-transition"), e.offsetWidth, e.classList.add("bruno-liquid-route-transition"), globalThis.setTimeout?.(() => {
    e.classList.remove("bruno-liquid-route-transition");
  }, o));
}
const Ut = {
  version: Zi,
  tokens: At,
  surfaces: Ki,
  states: Yi,
  apply: Xa,
  feedback: Ji,
  routeTransition: er
};
globalThis.BrunoThemeManager ? globalThis.BrunoLiquidGlassOriginal = Ut : (globalThis.BrunoLiquidGlass = Ut, Xa());
const tr = "20260723-liquid-glass-ios-3", Ft = "bruno-liquid-glass-tokens", ce = globalThis.BrunoLiquidGlass, Ja = Object.assign(
  {},
  ce?.tokens || {},
  {
    // Additive glass for dark, warm wallpapers.
    "ha-card-background": "rgba(255,255,255,0.12)",
    "ha-card-backdrop-filter": "blur(16px) saturate(1.30) brightness(1.08)",
    "ha-card-box-shadow": `
      inset 0 1px 0 rgba(255,255,255,0.40),
      inset 1px 0 0 rgba(255,255,255,0.14),
      inset -1px 0 0 rgba(255,255,255,0.07),
      inset 0 -1px 0 rgba(255,255,255,0.05),
      0 8px 24px rgba(0,0,0,0.35)
    `,
    // Preserve the standard Liquid Glass wallpaper treatment.
    "bruno-theme-backdrop-blur": "0px",
    "bruno-theme-backdrop-scale": "1",
    "bruno-theme-backdrop-saturate": "1",
    "bruno-theme-backdrop-brightness": "1",
    "bruno-theme-backdrop-dim": "0.10",
    "bruno-liquid-card-background": "rgba(255,255,255,0.12)",
    "bruno-liquid-card-filter": "blur(16px) saturate(1.30) brightness(1.08)",
    "bruno-liquid-card-border-color": "rgba(255,255,255,0.20)",
    "bruno-liquid-card-border": "1px solid var(--bruno-liquid-card-border-color)",
    "bruno-liquid-card-shadow": `
      inset 0 1px 0 rgba(255,255,255,0.40),
      inset 1px 0 0 rgba(255,255,255,0.14),
      inset -1px 0 0 rgba(255,255,255,0.09),
      inset 0 -1px 0 rgba(255,255,255,0.05),
      0 8px 24px rgba(0,0,0,0.35)
    `,
    "bruno-liquid-card-sheen": `
      radial-gradient(120px 78px at 16% 0%, rgba(255,255,255,0.44), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0.00) 38%),
      linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
    `,
    "bruno-liquid-card-sheen-opacity": "0.85",
    "bruno-liquid-card-edge-glow": `
      linear-gradient(125deg, rgba(255,255,255,0.22), rgba(255,255,255,0.055) 38%, rgba(255,255,255,0.012) 100%)
    `,
    /* NOVO (2026-07-23): o branco do "desligado" estava forte demais. Por
       pedido do usuario, o valor forte que ANTES era do "desligado" virou o
       do "ligado" (mesmo espirito do ajuste ja feito no tema Liquid Glass
       principal), e o "desligado" ganhou uma versao com a opacidade do
       branco reduzida (~35-40%) — blur/saturate/posicoes dos gradientes
       inalterados, so a intensidade do branco caiu. */
    // Off: mesma estrutura do bloco anterior, branco reduzido.
    "bruno-liquid-surface-off-background": `
      radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.04) 46%, transparent 73%),
      linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.025) 40%, rgba(255,255,255,0.045)),
      linear-gradient(155deg, rgba(255,255,255,0.065), rgba(255,255,255,0.035))
    `,
    "bruno-liquid-surface-off-filter": "blur(14px) saturate(1.28) brightness(1.04)",
    "bruno-liquid-surface-off-border": "1px solid rgba(255,255,255,0.10)",
    "bruno-liquid-surface-off-shadow": `
      inset 0 1px 0 rgba(255,255,255,0.22),
      inset 1px 0 0 rgba(255,255,255,0.07),
      inset -1px 0 0 rgba(255,255,255,0.045),
      inset 0 -1px 0 rgba(255,255,255,0.025),
      0 8px 24px rgba(0,0,0,0.32)
    `,
    "bruno-liquid-surface-off-sheen": `
      radial-gradient(112px 72px at 16% 0%, rgba(255,255,255,0.24), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 38%),
      linear-gradient(90deg, rgba(255,255,255,0.065), rgba(255,255,255,0.00) 48%)
    `,
    "bruno-liquid-surface-off-sheen-opacity": "0.85",
    "bruno-liquid-surface-edge-glow": "var(--bruno-liquid-card-edge-glow)",
    // On/focus: o branco "forte" que antes era do desligado (pedido do usuario).
    "bruno-liquid-surface-on-background": `
      radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.30), rgba(255,255,255,0.06) 46%, transparent 73%),
      linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.04) 40%, rgba(255,255,255,0.07)),
      linear-gradient(155deg, rgba(255,255,255,0.11), rgba(255,255,255,0.055))
    `,
    "bruno-liquid-surface-on-filter": "blur(14px) saturate(1.28) brightness(1.04)",
    "bruno-liquid-surface-on-border-color": "rgba(255,255,255,0.16)",
    "bruno-liquid-surface-on-shadow": `
      inset 0 1px 0 rgba(255,255,255,0.36),
      inset 1px 0 0 rgba(255,255,255,0.12),
      inset -1px 0 0 rgba(255,255,255,0.07),
      inset 0 -1px 0 rgba(255,255,255,0.04),
      0 8px 24px rgba(0,0,0,0.32)
    `,
    "bruno-liquid-surface-on-sheen": `
      radial-gradient(112px 72px at 16% 0%, rgba(255,255,255,0.40), transparent 72%),
      linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0.00) 38%),
      linear-gradient(90deg, rgba(255,255,255,0.11), rgba(255,255,255,0.00) 48%)
    `,
    "bruno-liquid-surface-on-sheen-opacity": "0.85",
    "bruno-liquid-active-warm-background": "var(--bruno-liquid-surface-on-background)",
    "bruno-liquid-active-warm-border-color": "var(--bruno-liquid-surface-on-border-color)",
    "bruno-liquid-active-warm-shadow": "var(--bruno-liquid-surface-on-shadow)",
    "bruno-liquid-active-warm-sheen": "var(--bruno-liquid-surface-on-sheen)",
    /* ANTERIOR (rollback): band-open apontava para --bruno-liquid-surface-on-*.
       Desacoplado pelo mesmo motivo do tema Liquid Glass principal — "band-open"
       e sobre secao/aba expandida, sem relacao com luz acesa. Mesmo valor do
       tema principal, para o acordeao ficar identico entre os 2 temas.
    'bruno-liquid-band-open-background': 'var(--bruno-liquid-surface-on-background)',
    'bruno-liquid-band-open-border-color': 'var(--bruno-liquid-surface-on-border-color)',
    'bruno-liquid-band-open-shadow': 'var(--bruno-liquid-surface-on-shadow)',
    --- FIM ANTERIOR --- */
    "bruno-liquid-band-open-background": `
      linear-gradient(180deg, rgba(255,255,255,0.048), rgba(255,255,255,0.014) 54%, rgba(255,255,255,0.020)),
      rgba(9,11,15,0.260)
    `,
    "bruno-liquid-band-open-border-color": "rgba(255,255,255,0.092)",
    "bruno-liquid-band-open-shadow": `
      inset 0 1px 0 rgba(255,255,255,0.066),
      0 6px 16px rgba(0,0,0,0.105)
    `,
    // NOVO: raio das bordas explicitamente igual ao tema Liquid Glass principal
    // (evita depender so da heranca implicita de BRUNO_LIQUID_GLASS_IOS_BASE).
    "bruno-liquid-card-radius": "34px",
    "bruno-liquid-card-radius-compact": "24px",
    "bruno-liquid-room-radius": "24px",
    "bruno-liquid-cell-radius": "18px",
    "bruno-liquid-control-radius": "18px",
    "bruno-liquid-control-radius-compact": "14px",
    "bruno-liquid-dock-radius": "999px",
    "bruno-liquid-rail-radius": "999px",
    "ha-card-border-radius": "34px"
  }
), ar = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background:
    radial-gradient(420px 300px at 50% 36%, rgba(255,255,255,0.055), transparent 68%),
    rgba(4,7,12,0.10);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}

@keyframes bruno-liquid-route-fade {
  0% { opacity: 0; }
  36% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes bruno-liquid-route-fade-reduced {
  0% { opacity: 0.16; }
  100% { opacity: 0; }
}

@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    animation: bruno-liquid-route-fade-reduced 180ms ease-out both;
  }
}
`;
function ir(o) {
  return Object.entries(o).map(([e, t]) => `  --${e}: ${String(t).trim().replace(/\s+/g, " ")};`).join(`
`);
}
function rr(o = globalThis.document) {
  if (!o?.head) return null;
  let e = o.getElementById(Ft);
  return e || (e = o.createElement("style"), e.id = Ft, o.head.appendChild(e)), e.textContent = `:root {
${ir(Ja)}
}
${ar}`, e;
}
globalThis.BrunoLiquidGlassIOS = {
  version: tr,
  tokens: Ja,
  surfaces: ce?.surfaces || {},
  states: ce?.states || {},
  apply: rr,
  feedback: (...o) => ce?.feedback?.(...o) || !1,
  routeTransition: (...o) => ce?.routeTransition?.(...o)
};
const or = "20260702-visionos-yaml-2", Gt = "bruno-liquid-glass-tokens", Ot = {
  "bruno-liquid-accent": "255, 159, 10",
  "bruno-liquid-warm-accent": "255, 214, 10",
  "bruno-liquid-green-accent": "50, 215, 75",
  // Home Assistant theme values mirrored from visionos.yaml.
  "background-image": "center / cover no-repeat fixed url('https://raw.githubusercontent.com/Nezz/homeassistant-visionos-theme/1.1/themes/night.jpg')",
  "primary-background-color": "rgb(25, 24, 22)",
  "secondary-background-color": "rgb(25, 24, 22)",
  "app-header-background-color": "rgba(25, 24, 22, 0.3)",
  "ha-card-background": "rgba(0, 0, 0, 0.3)",
  "app-theme-color": "rgb(0, 0, 0)",
  "primary-text-color": "rgba(255, 255, 255, 0.96)",
  "secondary-text-color": "#d3d3d3",
  "divider-color": "rgba(152, 152, 157, 0.3)",
  "ha-card-border-radius": "20px",
  "ha-card-features-border-radius": "var(--ha-card-border-radius)",
  "ha-card-border-width": "0",
  "ha-card-backdrop-filter": "blur(20px)",
  "ha-card-box-shadow": `
    0.5px 0.5px 1px 0 rgba(255,255,255,0.40) inset,
    -0.5px -0.5px 1px 0 rgba(255,255,255,0.10) inset,
    0 1px 2px 0 rgba(0,0,0,0.10)
  `,
  "red-color": "#FF453A",
  "pink-color": "#FF375F",
  "purple-color": "#BF5AF2",
  "indigo-color": "#5E5CE6",
  "blue-color": "#0A84FF",
  "cyan-color": "#5AC8F5",
  "green-color": "#32D74B",
  "yellow-color": "#FFD60A",
  "orange-color": "#FF9F0A",
  "brown-color": "#AC8E68",
  "primary-color": "var(--orange-color)",
  "bruno-liquid-card-radius": "20px",
  "bruno-liquid-card-radius-compact": "16px",
  "bruno-liquid-room-radius": "20px",
  "bruno-liquid-cell-radius": "16px",
  "bruno-liquid-control-radius": "16px",
  "bruno-liquid-control-radius-compact": "12px",
  "bruno-liquid-dock-radius": "999px",
  "bruno-liquid-rail-radius": "999px",
  "bruno-liquid-motion-fast": "160ms ease",
  "bruno-liquid-motion-medium": "220ms cubic-bezier(0.2, 0.8, 0.2, 1)",
  "bruno-liquid-icon-title": "16px",
  "bruno-liquid-icon-section": "20px",
  "bruno-liquid-icon-control": "23px",
  "bruno-liquid-icon-status": "15px",
  "bruno-liquid-icon-overflow": "19px",
  // Shared premium block skin: neutral real glass, thin borders and low-fill
  // surfaces so the photo reads through without turning the cards brown.
  "bruno-liquid-card-background": `
    radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)),
    var(--ha-card-background, rgba(0,0,0,0.300))
  `,
  "bruno-liquid-card-filter": "var(--ha-card-backdrop-filter, blur(20px)) saturate(1.18) brightness(1.03)",
  "bruno-liquid-card-border-color": "rgba(255,255,255,0.105)",
  "bruno-liquid-card-border": "1px solid var(--bruno-liquid-card-border-color)",
  "bruno-liquid-card-shadow": "var(--ha-card-box-shadow)",
  "bruno-liquid-card-sheen": `
    linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 42%)
  `,
  "bruno-liquid-card-sheen-opacity": "0.13",
  "bruno-liquid-card-edge-glow": `
    linear-gradient(125deg, rgba(255,255,255,0.16), rgba(255,255,255,0.048) 38%, rgba(255,159,10,0.050) 100%)
  `,
  "bruno-liquid-dock-background": `
    radial-gradient(86px 70px at 18% 0%, rgba(255,255,255,0.19), transparent 72%),
    radial-gradient(98px 82px at 92% 100%, rgba(var(--accent, var(--bruno-liquid-accent)),0.08), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.106), rgba(255,255,255,0.030) 42%, rgba(255,255,255,0.048)),
    linear-gradient(155deg, rgba(18,24,36,0.70), rgba(10,13,20,0.60) 52%, rgba(18,16,17,0.42))
  `,
  "bruno-liquid-dock-filter": "blur(28px) saturate(1.56) contrast(1.05)",
  "bruno-liquid-dock-border": "1px solid rgba(255,255,255,0.17)",
  "bruno-liquid-dock-shadow": `
    inset 0 0 0 1px rgba(255,255,255,0.060),
    inset 0 1px 0 rgba(255,255,255,0.25),
    inset 1px 0 0 rgba(255,255,255,0.10),
    inset 0 -1px 0 rgba(255,255,255,0.045),
    0 14px 34px rgba(0,0,0,0.30),
    0 0 22px rgba(110,150,210,0.060)
  `,
  "bruno-liquid-dock-sheen": `
    radial-gradient(58px 42px at 18% 2%, rgba(255,255,255,0.20), transparent 72%),
    radial-gradient(64px 72px at 92% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.10), transparent 74%),
    linear-gradient(180deg, rgba(255,255,255,0.115), rgba(255,255,255,0.00) 38%)
  `,
  "bruno-liquid-dock-sheen-opacity": "0.70",
  "bruno-liquid-dock-edge-glow": `
    linear-gradient(125deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08) 34%, rgba(255,255,255,0.026) 62%, rgba(255,190,120,0.17) 100%)
  `,
  "bruno-liquid-rail-background": `
    radial-gradient(38px 94px at 26% -3%, rgba(255,255,255,0.22), rgba(255,255,255,0.05) 42%, transparent 70%),
    radial-gradient(38px 110px at 92% 86%, rgba(var(--accent, var(--bruno-liquid-accent)),0.10), transparent 68%),
    linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.038) 34%, rgba(255,255,255,0.065)),
    linear-gradient(155deg, rgba(22,27,38,0.84), rgba(10,12,18,0.72) 48%, rgba(18,16,17,0.46))
  `,
  "bruno-liquid-rail-filter": "blur(30px) saturate(1.58) contrast(1.05)",
  "bruno-liquid-rail-border": "1px solid rgba(255,255,255,0.16)",
  "bruno-liquid-rail-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.23),
    inset 1px 0 0 rgba(255,255,255,0.11),
    inset -1px -1px 0 rgba(255,255,255,0.026),
    0 18px 44px rgba(0,0,0,0.31),
    0 0 24px rgba(110,150,210,0.075)
  `,
  "bruno-liquid-rail-sheen": `
    radial-gradient(34px 42px at 24% 3%, rgba(255,255,255,0.26), transparent 70%),
    radial-gradient(42px 70px at 94% 18%, rgba(var(--accent, var(--bruno-liquid-accent)),0.16), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.19), rgba(255,255,255,0.00) 34%),
    linear-gradient(90deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 48%)
  `,
  "bruno-liquid-rail-sheen-opacity": "0.78",
  "bruno-liquid-cell-background": `
    linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006)),
    rgba(9,11,15,0.030)
  `,
  "bruno-liquid-cell-border-color": "rgba(255,255,255,0.050)",
  "bruno-liquid-cell-border": "1px solid var(--bruno-liquid-cell-border-color)",
  "bruno-liquid-cell-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.040)
  `,
  "bruno-liquid-cell-active-warm-background": `
    linear-gradient(180deg, rgba(255,255,255,0.042), rgba(255,255,255,0.012)),
    rgba(var(--bruno-liquid-warm-accent),0.030)
  `,
  "bruno-liquid-cell-active-warm-border": "rgba(var(--bruno-liquid-warm-accent),0.180)",
  "bruno-liquid-cell-active-warm-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.060),
    0 0 12px rgba(var(--bruno-liquid-warm-accent),0.060)
  `,
  "bruno-liquid-chip-background": `
    linear-gradient(180deg, rgba(255,255,255,0.036), rgba(255,255,255,0.012)),
    rgba(9,11,15,0.060)
  `,
  "bruno-liquid-chip-border": "1px solid rgba(255,255,255,0.070)",
  "bruno-liquid-chip-shadow": "inset 0 1px 0 rgba(255,255,255,0.060)",
  "bruno-liquid-chip-filter": "blur(12px) saturate(0.96) brightness(1.04)",
  "bruno-liquid-control-background": `
    linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018)),
    rgba(255,255,255,0.030)
  `,
  "bruno-liquid-control-border-color": "rgba(255,255,255,0.070)",
  "bruno-liquid-control-border": "1px solid var(--bruno-liquid-control-border-color)",
  "bruno-liquid-control-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.060)
  `,
  "bruno-liquid-control-filter": "blur(12px) saturate(0.96) brightness(1.04)",
  "bruno-liquid-control-warm-background": "rgba(var(--bruno-liquid-warm-accent),0.038)",
  "bruno-liquid-control-warm-border": "1px solid rgba(var(--bruno-liquid-warm-accent),0.180)",
  "bruno-liquid-control-warm-shadow": "inset 0 1px 0 rgba(255,255,255,0.060)",
  "bruno-liquid-control-blue-background": `
    linear-gradient(180deg, rgba(96,165,250,0.42), rgba(38,92,138,0.24)),
    rgba(255,255,255,0.030)
  `,
  "bruno-liquid-control-blue-border": "rgba(10,132,255,0.320)",
  "bruno-liquid-control-blue-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.100),
    0 0 14px rgba(10,132,255,0.120)
  `,
  "bruno-liquid-control-green-background": `
    linear-gradient(180deg, rgba(46,231,122,0.160), rgba(19,76,54,0.080)),
    rgba(255,255,255,0.030)
  `,
  "bruno-liquid-control-green-border": "rgba(46,231,122,0.220)",
  "bruno-liquid-control-green-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.080),
    0 0 12px rgba(46,231,122,0.080)
  `,
  "bruno-liquid-selected-blue-background": `
    linear-gradient(180deg, rgba(105,150,230,0.440), rgba(59,92,178,0.300)),
    rgba(255,255,255,0.028)
  `,
  "bruno-liquid-selected-blue-border": "rgba(210,228,255,0.300)",
  "bruno-liquid-selected-blue-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.110),
    0 0 14px rgba(10,132,255,0.140)
  `,
  // Dedicated transient surface: used by compact selectors/popovers that need
  // markedly stronger contrast than the shared translucent card skin.
  "bruno-liquid-popup-background": `
    linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
  `,
  "bruno-liquid-popup-border": "1px solid rgba(255,255,255,0.115)",
  "bruno-liquid-popup-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.100),
    0 18px 36px rgba(0,0,0,0.300)
  `,
  "bruno-liquid-popup-filter": "blur(20px) saturate(1.16) brightness(0.94)",
  "bruno-liquid-popup-option-background": "rgba(255,255,255,0.045)",
  "bruno-liquid-popup-option-hover-background": "rgba(var(--bruno-liquid-warm-accent),0.115)",
  "bruno-liquid-surface-bottom-line": "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
  "bruno-liquid-surface-bottom-line-opacity": "0",
  "bruno-liquid-surface-on-background": `
    linear-gradient(180deg, rgba(255,255,255,0.044), rgba(255,255,255,0.012) 54%, rgba(255,255,255,0.018)),
    rgba(9,11,15,0.052)
  `,
  "bruno-liquid-surface-on-filter": "blur(18px) saturate(0.92) brightness(1.05) contrast(1.02)",
  "bruno-liquid-surface-on-border-color": "rgba(255,255,255,0.092)",
  "bruno-liquid-surface-on-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.066),
    0 6px 16px rgba(0,0,0,0.105)
  `,
  "bruno-liquid-surface-on-sheen": `
    linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 42%)
  `,
  "bruno-liquid-surface-on-sheen-opacity": "0.12",
  "bruno-liquid-band-background": "rgba(255,255,255,0.010)",
  "bruno-liquid-band-border-color": "rgba(255,255,255,0.035)",
  "bruno-liquid-band-border": "1px solid var(--bruno-liquid-band-border-color)",
  "bruno-liquid-band-shadow": "none",
  "bruno-liquid-band-open-background": "var(--bruno-liquid-surface-on-background)",
  "bruno-liquid-band-open-border-color": "var(--bruno-liquid-surface-on-border-color)",
  "bruno-liquid-band-open-shadow": "var(--bruno-liquid-surface-on-shadow)"
};
Object.assign(Ot, {
  // Compatibility aliases used by already migrated components.
  "bruno-liquid-surface-off-background": "var(--bruno-liquid-card-background)",
  "bruno-liquid-surface-off-filter": "var(--bruno-liquid-card-filter)",
  "bruno-liquid-surface-off-border": "var(--bruno-liquid-card-border)",
  "bruno-liquid-surface-off-shadow": "var(--bruno-liquid-card-shadow)",
  "bruno-liquid-surface-off-sheen": "var(--bruno-liquid-card-sheen)",
  "bruno-liquid-surface-off-sheen-opacity": "var(--bruno-liquid-card-sheen-opacity)",
  "bruno-liquid-surface-edge-glow": "var(--bruno-liquid-card-edge-glow)",
  "bruno-liquid-active-warm-background": "var(--bruno-liquid-surface-on-background)",
  "bruno-liquid-active-warm-border-color": "var(--bruno-liquid-surface-on-border-color)",
  "bruno-liquid-active-warm-shadow": "var(--bruno-liquid-surface-on-shadow)",
  "bruno-liquid-active-warm-sheen": "var(--bruno-liquid-surface-on-sheen)"
});
const nr = {
  card: {
    background: "var(--bruno-liquid-card-background)",
    filter: "var(--bruno-liquid-card-filter)",
    border: "var(--bruno-liquid-card-border)",
    shadow: "var(--bruno-liquid-card-shadow)",
    sheen: "var(--bruno-liquid-card-sheen)",
    edgeGlow: "var(--bruno-liquid-card-edge-glow)"
  },
  dock: {
    background: "var(--bruno-liquid-dock-background)",
    filter: "var(--bruno-liquid-dock-filter)",
    border: "var(--bruno-liquid-dock-border)",
    shadow: "var(--bruno-liquid-dock-shadow)",
    sheen: "var(--bruno-liquid-dock-sheen)",
    edgeGlow: "var(--bruno-liquid-dock-edge-glow)"
  },
  rail: {
    background: "var(--bruno-liquid-rail-background)",
    filter: "var(--bruno-liquid-rail-filter)",
    border: "var(--bruno-liquid-rail-border)",
    shadow: "var(--bruno-liquid-rail-shadow)",
    sheen: "var(--bruno-liquid-rail-sheen)"
  },
  cell: {
    background: "var(--bruno-liquid-cell-background)",
    border: "var(--bruno-liquid-cell-border)",
    shadow: "var(--bruno-liquid-cell-shadow)"
  },
  control: {
    background: "var(--bruno-liquid-control-background)",
    border: "var(--bruno-liquid-control-border)",
    shadow: "var(--bruno-liquid-control-shadow)",
    filter: "var(--bruno-liquid-control-filter)"
  },
  chip: {
    background: "var(--bruno-liquid-chip-background)",
    border: "var(--bruno-liquid-chip-border)",
    shadow: "var(--bruno-liquid-chip-shadow)",
    filter: "var(--bruno-liquid-chip-filter)"
  }
}, sr = {
  activeWarm: {
    background: "var(--bruno-liquid-active-warm-background)",
    borderColor: "var(--bruno-liquid-active-warm-border-color)",
    shadow: "var(--bruno-liquid-active-warm-shadow)",
    sheen: "var(--bruno-liquid-active-warm-sheen)"
  },
  selectedBlue: {
    background: "var(--bruno-liquid-selected-blue-background)",
    borderColor: "var(--bruno-liquid-selected-blue-border)",
    shadow: "var(--bruno-liquid-selected-blue-shadow)"
  }
}, lr = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background:
    radial-gradient(420px 300px at 50% 36%, rgba(255,255,255,0.055), transparent 68%),
    rgba(4,7,12,0.10);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}

@keyframes bruno-liquid-route-fade {
  0% {
    opacity: 0;
  }
  36% {
    opacity: 1;
  }
  100% {
    opacity: 0;
  }
}

@keyframes bruno-liquid-route-fade-reduced {
  0% {
    opacity: 0.16;
  }
  100% {
    opacity: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    animation: bruno-liquid-route-fade-reduced 180ms ease-out both;
  }
}
`;
function cr(o) {
  return Object.entries(o).map(([e, t]) => `  --${e}: ${String(t).trim().replace(/\s+/g, " ")};`).join(`
`);
}
function dr(o = globalThis.document) {
  if (!o?.head) return null;
  let e = o.getElementById(Gt);
  return e || (e = o.createElement("style"), e.id = Gt, o.head.appendChild(e)), e.textContent = `:root {
${cr(Ot)}
}
${lr}`, e;
}
function pr(o = "tap") {
  const e = globalThis.navigator?.vibrate;
  if (typeof e != "function") return !1;
  const t = o === "hold" ? [12, 24, 12] : 10;
  try {
    return e.call(globalThis.navigator, t), !0;
  } catch {
    return !1;
  }
}
function ur(o = 280) {
  const e = globalThis.document?.documentElement;
  e && (e.classList.remove("bruno-liquid-route-transition"), e.offsetWidth, e.classList.add("bruno-liquid-route-transition"), globalThis.setTimeout?.(() => {
    e.classList.remove("bruno-liquid-route-transition");
  }, o));
}
const ei = {
  version: or,
  tokens: Ot,
  surfaces: nr,
  states: sr,
  apply: dr,
  feedback: pr,
  routeTransition: ur
};
globalThis.BrunoVisionOS = ei;
globalThis.BrunoLiquidGlass || (globalThis.BrunoLiquidGlass = ei);
const hr = "20260716-ios-light-1", Wt = "bruno-liquid-glass-tokens", de = globalThis.BrunoVisionOS || globalThis.BrunoLiquidGlass, Et = Object.assign({}, de?.tokens || {}, {
  // Palette extracted from ios-themes.yaml. Background artwork remains owned
  // by the Bruno shell and is deliberately not replaced by the theme.
  "background-image": "none",
  "primary-background-color": "#e5e5ea",
  "secondary-background-color": "rgba(255,255,255,0.90)",
  "app-header-background-color": "rgba(245,245,247,0.72)",
  "ha-card-background": "rgba(245,245,245,0.40)",
  "app-theme-color": "#f2f2f7",
  "primary-text-color": "#464a47",
  "secondary-text-color": "rgba(0,0,0,0.66)",
  "divider-color": "rgba(142,142,147,0.30)",
  "accent-color": "rgba(255,159,9,1)",
  "primary-color": "#ff9f09",
  "blue-color": "#007aff",
  "green-color": "#34c759",
  "yellow-color": "#ffd60a",
  "orange-color": "#ff9f09",
  "red-color": "#ff3b30",
  "state-icon-active-color": "#007aff",
  "slider-color": "#007aff",
  "slider-secondary-color": "rgba(120,120,128,0.24)",
  "bruno-liquid-accent": "255, 159, 9",
  "bruno-liquid-warm-accent": "255, 159, 9",
  "bruno-liquid-green-accent": "52, 199, 89",
  "bruno-liquid-text-primary": "#464a47",
  "bruno-liquid-text-secondary": "rgba(0,0,0,0.66)",
  "bruno-liquid-text-muted": "rgba(60,60,67,0.54)",
  "bruno-liquid-text-inverse": "rgba(255,255,255,0.96)",
  "bruno-liquid-divider": "rgba(142,142,147,0.30)",
  "bruno-liquid-card-background": `
    radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.62), transparent 64%),
    linear-gradient(180deg, rgba(255,255,255,0.36), rgba(255,255,255,0.16) 52%, rgba(229,229,234,0.18)),
    rgba(245,245,245,0.40)
  `,
  "bruno-liquid-card-filter": "blur(22px) saturate(1.15) brightness(1.04)",
  "bruno-liquid-card-border-color": "rgba(255,255,255,0.52)",
  "bruno-liquid-card-border": "1px solid var(--bruno-liquid-card-border-color)",
  "bruno-liquid-card-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.66),
    inset 0 -1px 0 rgba(142,142,147,0.16),
    0 10px 28px rgba(44,44,46,0.13)
  `,
  "bruno-liquid-card-sheen": "linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,255,255,0.00) 44%)",
  "bruno-liquid-card-sheen-opacity": "0.34",
  "bruno-liquid-card-edge-glow": "linear-gradient(125deg, rgba(255,255,255,0.68), rgba(255,255,255,0.16) 46%, rgba(0,122,255,0.06))",
  "bruno-liquid-dock-background": `
    radial-gradient(90px 72px at 18% 0%, rgba(255,255,255,0.72), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.54), rgba(242,242,247,0.42)),
    rgba(229,229,234,0.46)
  `,
  "bruno-liquid-dock-filter": "blur(28px) saturate(1.30) brightness(1.04)",
  "bruno-liquid-dock-border": "1px solid rgba(255,255,255,0.58)",
  "bruno-liquid-dock-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.72),
    inset 0 -1px 0 rgba(142,142,147,0.18),
    0 14px 32px rgba(44,44,46,0.16)
  `,
  "bruno-liquid-dock-sheen": "linear-gradient(180deg, rgba(255,255,255,0.62), rgba(255,255,255,0.00) 42%)",
  "bruno-liquid-dock-sheen-opacity": "0.58",
  "bruno-liquid-dock-edge-glow": "linear-gradient(125deg, rgba(255,255,255,0.74), rgba(255,255,255,0.18) 52%, rgba(0,122,255,0.08))",
  "bruno-liquid-rail-background": `
    radial-gradient(46px 98px at 24% 0%, rgba(255,255,255,0.74), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.56), rgba(242,242,247,0.40)),
    rgba(229,229,234,0.48)
  `,
  "bruno-liquid-rail-filter": "blur(30px) saturate(1.30) brightness(1.04)",
  "bruno-liquid-rail-border": "1px solid rgba(255,255,255,0.58)",
  "bruno-liquid-rail-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.74),
    inset -1px 0 0 rgba(142,142,147,0.14),
    0 18px 40px rgba(44,44,46,0.16)
  `,
  "bruno-liquid-rail-sheen": "linear-gradient(180deg, rgba(255,255,255,0.66), rgba(255,255,255,0.00) 38%)",
  "bruno-liquid-rail-sheen-opacity": "0.62",
  "bruno-liquid-cell-background": "linear-gradient(180deg, rgba(255,255,255,0.30), rgba(255,255,255,0.14)), rgba(242,242,247,0.22)",
  "bruno-liquid-cell-border-color": "rgba(142,142,147,0.20)",
  "bruno-liquid-cell-border": "1px solid var(--bruno-liquid-cell-border-color)",
  "bruno-liquid-cell-shadow": "inset 0 1px 0 rgba(255,255,255,0.48)",
  "bruno-liquid-chip-background": "linear-gradient(180deg, rgba(255,255,255,0.38), rgba(242,242,247,0.20)), rgba(255,255,255,0.16)",
  "bruno-liquid-chip-border": "1px solid rgba(142,142,147,0.22)",
  "bruno-liquid-chip-shadow": "inset 0 1px 0 rgba(255,255,255,0.50)",
  "bruno-liquid-chip-filter": "blur(14px) saturate(1.08) brightness(1.03)",
  "bruno-liquid-control-background": "linear-gradient(180deg, rgba(255,255,255,0.44), rgba(242,242,247,0.24)), rgba(255,255,255,0.18)",
  "bruno-liquid-control-border-color": "rgba(142,142,147,0.24)",
  "bruno-liquid-control-border": "1px solid var(--bruno-liquid-control-border-color)",
  "bruno-liquid-control-shadow": "inset 0 1px 0 rgba(255,255,255,0.54)",
  "bruno-liquid-control-filter": "blur(14px) saturate(1.08) brightness(1.03)",
  "bruno-liquid-control-warm-background": "rgba(255,159,9,0.12)",
  "bruno-liquid-control-warm-border": "1px solid rgba(255,159,9,0.28)",
  "bruno-liquid-control-warm-shadow": "inset 0 1px 0 rgba(255,255,255,0.48)",
  "bruno-liquid-control-blue-background": "linear-gradient(180deg, rgba(0,122,255,0.28), rgba(0,122,255,0.14)), rgba(255,255,255,0.18)",
  "bruno-liquid-control-blue-border": "rgba(0,122,255,0.34)",
  "bruno-liquid-control-blue-shadow": "inset 0 1px 0 rgba(255,255,255,0.42), 0 0 12px rgba(0,122,255,0.10)",
  "bruno-liquid-control-green-background": "linear-gradient(180deg, rgba(52,199,89,0.22), rgba(52,199,89,0.10)), rgba(255,255,255,0.18)",
  "bruno-liquid-control-green-border": "rgba(52,199,89,0.30)",
  "bruno-liquid-control-green-shadow": "inset 0 1px 0 rgba(255,255,255,0.42), 0 0 12px rgba(52,199,89,0.08)",
  "bruno-liquid-selected-blue-background": "linear-gradient(180deg, rgba(0,122,255,0.28), rgba(0,122,255,0.16)), rgba(255,255,255,0.20)",
  "bruno-liquid-selected-blue-border": "rgba(0,122,255,0.36)",
  "bruno-liquid-selected-blue-shadow": "inset 0 1px 0 rgba(255,255,255,0.44), 0 0 14px rgba(0,122,255,0.12)",
  "bruno-liquid-popup-background": "linear-gradient(180deg, rgba(248,248,250,0.92), rgba(229,229,234,0.88))",
  "bruno-liquid-popup-border": "1px solid rgba(255,255,255,0.62)",
  "bruno-liquid-popup-shadow": "inset 0 1px 0 rgba(255,255,255,0.74), 0 18px 38px rgba(44,44,46,0.20)",
  "bruno-liquid-popup-filter": "blur(24px) saturate(1.18) brightness(1.02)",
  "bruno-liquid-popup-option-background": "rgba(255,255,255,0.34)",
  "bruno-liquid-popup-option-hover-background": "rgba(0,122,255,0.14)",
  "bruno-liquid-surface-on-background": "linear-gradient(180deg, rgba(255,255,255,0.46), rgba(242,242,247,0.24)), rgba(255,255,255,0.20)",
  "bruno-liquid-surface-on-filter": "blur(20px) saturate(1.12) brightness(1.05)",
  "bruno-liquid-surface-on-border-color": "rgba(255,255,255,0.58)",
  "bruno-liquid-surface-on-shadow": "inset 0 1px 0 rgba(255,255,255,0.64), 0 8px 20px rgba(44,44,46,0.12)",
  "bruno-liquid-surface-on-sheen": "linear-gradient(180deg, rgba(255,255,255,0.56), rgba(255,255,255,0.00) 42%)",
  "bruno-liquid-surface-on-sheen-opacity": "0.30",
  "bruno-liquid-band-background": "rgba(255,255,255,0.12)",
  "bruno-liquid-band-border-color": "rgba(142,142,147,0.18)",
  "bruno-liquid-band-border": "1px solid var(--bruno-liquid-band-border-color)"
});
Object.assign(Et, {
  "bruno-liquid-surface-off-background": "var(--bruno-liquid-card-background)",
  "bruno-liquid-surface-off-filter": "var(--bruno-liquid-card-filter)",
  "bruno-liquid-surface-off-border": "var(--bruno-liquid-card-border)",
  "bruno-liquid-surface-off-shadow": "var(--bruno-liquid-card-shadow)",
  "bruno-liquid-surface-off-sheen": "var(--bruno-liquid-card-sheen)",
  "bruno-liquid-surface-off-sheen-opacity": "var(--bruno-liquid-card-sheen-opacity)",
  "bruno-liquid-surface-edge-glow": "var(--bruno-liquid-card-edge-glow)",
  "bruno-liquid-active-warm-background": "var(--bruno-liquid-surface-on-background)",
  "bruno-liquid-active-warm-border-color": "var(--bruno-liquid-surface-on-border-color)",
  "bruno-liquid-active-warm-shadow": "var(--bruno-liquid-surface-on-shadow)",
  "bruno-liquid-active-warm-sheen": "var(--bruno-liquid-surface-on-sheen)"
});
const br = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: rgba(242,242,247,0.10);
  -webkit-backdrop-filter: blur(7px) saturate(1.08);
  backdrop-filter: blur(7px) saturate(1.08);
  animation: bruno-liquid-route-fade 260ms ease both;
}
@keyframes bruno-liquid-route-fade { 0% { opacity: 0; } 36% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after { -webkit-backdrop-filter: none; backdrop-filter: none; animation-duration: 180ms; }
}
`;
function gr(o) {
  return Object.entries(o).map(([e, t]) => `  --${e}: ${String(t).trim().replace(/\s+/g, " ")};`).join(`
`);
}
function mr(o = globalThis.document) {
  if (!o?.head) return null;
  let e = o.getElementById(Wt);
  return e || (e = o.createElement("style"), e.id = Wt, o.head.appendChild(e)), e.textContent = `:root {
${gr(Et)}
}
${br}`, e;
}
globalThis.BrunoIOSLight = {
  version: hr,
  tokens: Et,
  surfaces: de?.surfaces || {},
  states: de?.states || {},
  apply: mr,
  feedback: (...o) => de?.feedback?.(...o) || !1,
  routeTransition: (...o) => de?.routeTransition?.(...o)
};
const fr = "20260716-ios-dark-1", Zt = "bruno-liquid-glass-tokens", pe = globalThis.BrunoVisionOS || globalThis.BrunoLiquidGlass, Ct = Object.assign({}, pe?.tokens || {}, {
  // Dark palette from ios-themes.yaml. Shell backdrops remain untouched.
  "background-image": "none",
  "primary-background-color": "#2c2c2e",
  "secondary-background-color": "rgba(25,25,25,0.90)",
  "app-header-background-color": "rgba(25,25,25,0.72)",
  "ha-card-background": "rgba(10,10,10,0.40)",
  "app-theme-color": "#000000",
  "primary-text-color": "rgba(255,255,255,0.96)",
  "secondary-text-color": "#d3d3d3",
  "divider-color": "rgba(152,152,157,0.30)",
  "accent-color": "rgba(255,159,9,1)",
  "primary-color": "#ff9f09",
  "blue-color": "#0984ff",
  "green-color": "#30d158",
  "yellow-color": "#ffd60a",
  "orange-color": "#ff9f09",
  "red-color": "#ff453a",
  "state-icon-active-color": "#0984ff",
  "slider-color": "#0984ff",
  "slider-secondary-color": "rgba(120,120,128,0.36)",
  "bruno-liquid-accent": "255, 159, 9",
  "bruno-liquid-warm-accent": "255, 214, 10",
  "bruno-liquid-green-accent": "48, 209, 88",
  "bruno-liquid-text-primary": "rgba(255,255,255,0.96)",
  "bruno-liquid-text-secondary": "#d3d3d3",
  "bruno-liquid-text-muted": "rgba(235,235,245,0.54)",
  "bruno-liquid-text-inverse": "#1c1c1e",
  "bruno-liquid-divider": "rgba(152,152,157,0.30)",
  "bruno-liquid-card-background": `
    radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.10), transparent 64%),
    linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.050)),
    rgba(10,10,10,0.40)
  `,
  "bruno-liquid-card-filter": "blur(22px) saturate(1.18) brightness(1.02)",
  "bruno-liquid-card-border-color": "rgba(255,255,255,0.105)",
  "bruno-liquid-card-border": "1px solid var(--bruno-liquid-card-border-color)",
  "bruno-liquid-card-shadow": `
    inset 0 1px 0 rgba(255,255,255,0.11),
    inset 0 -1px 0 rgba(255,255,255,0.025),
    0 12px 30px rgba(0,0,0,0.30)
  `,
  "bruno-liquid-card-sheen": "linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 42%)",
  "bruno-liquid-card-sheen-opacity": "0.13",
  "bruno-liquid-card-edge-glow": "linear-gradient(125deg, rgba(255,255,255,0.16), rgba(255,255,255,0.048) 40%, rgba(9,132,255,0.05))",
  "bruno-liquid-dock-background": `
    radial-gradient(88px 70px at 18% 0%, rgba(255,255,255,0.18), transparent 72%),
    linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.03) 46%, rgba(255,255,255,0.045)),
    rgba(10,10,10,0.58)
  `,
  "bruno-liquid-dock-filter": "blur(28px) saturate(1.48) contrast(1.04)",
  "bruno-liquid-dock-border": "1px solid rgba(255,255,255,0.16)",
  "bruno-liquid-dock-shadow": "inset 0 1px 0 rgba(255,255,255,0.22), 0 14px 34px rgba(0,0,0,0.32)",
  "bruno-liquid-dock-sheen": "linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.00) 40%)",
  "bruno-liquid-dock-sheen-opacity": "0.66",
  "bruno-liquid-dock-edge-glow": "linear-gradient(125deg, rgba(255,255,255,0.32), rgba(255,255,255,0.07) 44%, rgba(9,132,255,0.08))",
  "bruno-liquid-rail-background": `
    radial-gradient(40px 96px at 26% 0%, rgba(255,255,255,0.20), transparent 70%),
    linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.038) 36%, rgba(255,255,255,0.06)),
    rgba(10,10,10,0.66)
  `,
  "bruno-liquid-rail-filter": "blur(30px) saturate(1.50) contrast(1.04)",
  "bruno-liquid-rail-border": "1px solid rgba(255,255,255,0.16)",
  "bruno-liquid-rail-shadow": "inset 0 1px 0 rgba(255,255,255,0.22), 0 18px 42px rgba(0,0,0,0.34)",
  "bruno-liquid-rail-sheen": "linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 36%)",
  "bruno-liquid-rail-sheen-opacity": "0.74",
  "bruno-liquid-cell-background": "linear-gradient(180deg, rgba(255,255,255,0.026), rgba(255,255,255,0.008)), rgba(10,10,10,0.08)",
  "bruno-liquid-cell-border-color": "rgba(255,255,255,0.055)",
  "bruno-liquid-cell-border": "1px solid var(--bruno-liquid-cell-border-color)",
  "bruno-liquid-cell-shadow": "inset 0 1px 0 rgba(255,255,255,0.045)",
  "bruno-liquid-chip-background": "linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.012)), rgba(10,10,10,0.10)",
  "bruno-liquid-chip-border": "1px solid rgba(255,255,255,0.075)",
  "bruno-liquid-chip-shadow": "inset 0 1px 0 rgba(255,255,255,0.065)",
  "bruno-liquid-chip-filter": "blur(14px) saturate(1.02) brightness(1.03)",
  "bruno-liquid-control-background": "linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.018)), rgba(255,255,255,0.030)",
  "bruno-liquid-control-border-color": "rgba(255,255,255,0.075)",
  "bruno-liquid-control-border": "1px solid var(--bruno-liquid-control-border-color)",
  "bruno-liquid-control-shadow": "inset 0 1px 0 rgba(255,255,255,0.065)",
  "bruno-liquid-control-filter": "blur(14px) saturate(1.02) brightness(1.03)",
  "bruno-liquid-control-blue-background": "linear-gradient(180deg, rgba(9,132,255,0.40), rgba(9,82,150,0.24)), rgba(255,255,255,0.03)",
  "bruno-liquid-control-blue-border": "rgba(9,132,255,0.34)",
  "bruno-liquid-control-blue-shadow": "inset 0 1px 0 rgba(255,255,255,0.10), 0 0 14px rgba(9,132,255,0.12)",
  "bruno-liquid-control-green-background": "linear-gradient(180deg, rgba(48,209,88,0.18), rgba(20,78,48,0.08)), rgba(255,255,255,0.03)",
  "bruno-liquid-control-green-border": "rgba(48,209,88,0.24)",
  "bruno-liquid-control-green-shadow": "inset 0 1px 0 rgba(255,255,255,0.08), 0 0 12px rgba(48,209,88,0.08)",
  "bruno-liquid-selected-blue-background": "linear-gradient(180deg, rgba(9,132,255,0.40), rgba(58,92,178,0.28)), rgba(255,255,255,0.03)",
  "bruno-liquid-selected-blue-border": "rgba(174,214,255,0.30)",
  "bruno-liquid-selected-blue-shadow": "inset 0 1px 0 rgba(255,255,255,0.11), 0 0 14px rgba(9,132,255,0.14)",
  "bruno-liquid-popup-background": "linear-gradient(180deg, rgba(44,44,46,0.90), rgba(18,18,20,0.88))",
  "bruno-liquid-popup-border": "1px solid rgba(255,255,255,0.12)",
  "bruno-liquid-popup-shadow": "inset 0 1px 0 rgba(255,255,255,0.10), 0 18px 38px rgba(0,0,0,0.34)",
  "bruno-liquid-popup-filter": "blur(24px) saturate(1.18) brightness(0.96)",
  "bruno-liquid-popup-option-background": "rgba(255,255,255,0.05)",
  "bruno-liquid-popup-option-hover-background": "rgba(9,132,255,0.15)"
});
Object.assign(Ct, {
  "bruno-liquid-surface-off-background": "var(--bruno-liquid-card-background)",
  "bruno-liquid-surface-off-filter": "var(--bruno-liquid-card-filter)",
  "bruno-liquid-surface-off-border": "var(--bruno-liquid-card-border)",
  "bruno-liquid-surface-off-shadow": "var(--bruno-liquid-card-shadow)",
  "bruno-liquid-surface-off-sheen": "var(--bruno-liquid-card-sheen)",
  "bruno-liquid-surface-off-sheen-opacity": "var(--bruno-liquid-card-sheen-opacity)",
  "bruno-liquid-surface-edge-glow": "var(--bruno-liquid-card-edge-glow)"
});
const vr = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: rgba(0,0,0,0.12);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}
@keyframes bruno-liquid-route-fade { 0% { opacity: 0; } 36% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after { -webkit-backdrop-filter: none; backdrop-filter: none; animation-duration: 180ms; }
}
`;
function _r(o) {
  return Object.entries(o).map(([e, t]) => `  --${e}: ${String(t).trim().replace(/\s+/g, " ")};`).join(`
`);
}
function xr(o = globalThis.document) {
  if (!o?.head) return null;
  let e = o.getElementById(Zt);
  return e || (e = o.createElement("style"), e.id = Zt, o.head.appendChild(e)), e.textContent = `:root {
${_r(Ct)}
}
${vr}`, e;
}
globalThis.BrunoIOSDark = {
  version: fr,
  tokens: Ct,
  surfaces: pe?.surfaces || {},
  states: pe?.states || {},
  apply: xr,
  feedback: (...o) => pe?.feedback?.(...o) || !1,
  routeTransition: (...o) => pe?.routeTransition?.(...o)
};
const yr = "20260802-josh-popup-material-1", Kt = "bruno-liquid-glass-tokens";
function ae() {
  return globalThis.BrunoVisionOSOriginal || globalThis.BrunoVisionOS || null;
}
const wr = {
  // Microblur Josh controlado: uma unica amostragem por superficie principal.
  // Fills, scrims, bordas, filetes, sheen e edge-glow permanecem inalterados.
  "bruno-josh-microblur": "blur(2px)",
  "bruno-liquid-card-filter": "var(--bruno-josh-microblur, blur(2px)) saturate(1.18) brightness(1.03)",
  "bruno-liquid-surface-off-filter": "var(--bruno-liquid-card-filter)",
  "bruno-liquid-surface-on-filter": "var(--bruno-josh-microblur, blur(2px)) saturate(0.92) brightness(1.05) contrast(1.02)",
  // --- ANTERIOR (rollback / base da futura identidade Josh.ai global) ------
  // Superfície de card cinza quente, sólida e flat. DESATIVADA na rev.2
  // porque valia para TODOS os cards do painel, não só para a faixa.
  // 'bruno-liquid-card-background': 'linear-gradient(172deg, rgb(104,100,96), rgb(86,83,79) 62%, rgb(92,88,83))',
  // 'bruno-liquid-card-filter': 'none',
  // 'bruno-liquid-card-border': '1px solid rgba(255,255,255,0.14)',
  // 'bruno-liquid-card-shadow': '0 10px 24px rgba(0,0,0,0.24)',
  // 'bruno-liquid-card-sheen': 'none',
  // 'bruno-liquid-card-sheen-opacity': '0',
  // 'bruno-liquid-card-edge-glow': 'none',
  // 'ha-card-background': 'rgba(96,92,88,0.94)',
  // ------------------------------------------------------------------------
  // Room-subview cards already consume the same VisionOS `surface-off-*`
  // material as the dynamic cards. These Josh-only geometry tokens complete
  // that material by turning the old bottom-line pseudo-element into the same
  // masked perimeter edge glow used by the dynamic Media card.
  "bruno-subview-card-edge-display": "block",
  "bruno-subview-card-edge-inset": "0",
  "bruno-subview-card-edge-z": "4",
  "bruno-subview-card-edge-height": "auto",
  "bruno-subview-card-edge-padding": "1px",
  "bruno-subview-card-edge-radius": "inherit",
  "bruno-subview-card-edge-background": "var(--bruno-liquid-surface-edge-glow)",
  "bruno-subview-card-edge-opacity": "0.70",
  "bruno-subview-card-edge-mask": "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
  "bruno-subview-card-edge-webkit-composite": "xor",
  "bruno-subview-card-edge-composite": "exclude",
  // ======================================================================
  // SUBVIEWS EM MODO TILE (2026-07-27) — mesma linguagem da faixa da Home.
  // Consumidos por core/bruno-surface-material.js, que escopa tudo em
  // :host([data-bruno-subview-surface-theme="josh"]) — nenhum outro tema é
  // afetado. Os valores abaixo são LITERALMENTE os da faixa de cômodos:
  // mesmo véu, mesmos dois filetes, mesmo divisor vertical.
  // INVARIANTE: nada de backdrop-filter no tile (superfície estática).
  // ======================================================================
  // ---- MOLDURA da faixa inferior (main::before nas subviews) -------------
  // ANTERIOR (rev.1 — o erro): o fill era só `linear-gradient(rgba(255,255,255,
  // 0.030) -> 0.012)`, um véu de 3% de branco SEM base escura. Sobre foto isso
  // é praticamente invisível — daí a queixa de "completamente transparente",
  // evidente na Cozinha, cuja imagem de fundo é mais clara.
  // AGORA: receita IDÊNTICA à da faixa de cômodos da Home, cuja última camada
  // é um scrim preto de 30% — é ele que cria o contraste tonal com o fundo.
  "bruno-subview-band-fill": "radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%), linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)",
  "bruno-subview-band-filter": "var(--bruno-josh-microblur, blur(2px))",
  // Filetes com realce no centro, como os da Home (antes: chapados 0.20/0.12).
  "bruno-subview-band-top-line": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)",
  "bruno-subview-band-bottom-line": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)",
  // ANTERIOR (rev.3): 24px por ponta, copiado da Home ao pé da letra. Lá a
  // faixa tem ~1245px e as pontas caem sobre a base já escura do hero; aqui
  // a faixa tem ~1310px e as pontas caem sobre lambri claro e sobre a borda
  // atmosférica da shell — 24px é 1,8% da largura, proporcionalmente
  // invisível, e a ponta terminava em corte reto.
  // 'bruno-subview-band-fade': 'linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)',
  "bruno-subview-band-fade": "linear-gradient(90deg, transparent 0, #000 110px, #000 calc(100% - 110px), transparent 100%)",
  // Sangra até a borda do viewport (content-slot da shell tem padding 12px).
  "bruno-subview-band-bleed": "12px",
  "bruno-subview-tile-divider": "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.19) 22%, rgba(255,255,255,0.19) 78%, rgba(255,255,255,0) 100%)",
  "bruno-subview-tile-radius": "0",
  // ANTERIOR (rev.3): 'bruno-subview-tile-bleed': '12px' — sangrava só a
  // Iluminação, que por ser o único bloco a sangrar desalinhava da coluna
  // abaixo. A Iluminação voltou a ser cartela e não sangra mais.
  // ---- Nível 2 DENTRO da faixa (plano chapado) ---------------------------
  // Correção de FORMA, não de opacidade: sobre plano chapado o alfa sozinho
  // não cria hierarquia. Borda e raio devolvem a leitura de bloco contido.
  "bruno-subview-tile-inner-background": "linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))",
  "bruno-subview-tile-inner-border": "1px solid rgba(255,255,255,0.16)",
  "bruno-subview-tile-inner-radius": "14px",
  "bruno-subview-tile-inner-shadow": "inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 16px rgba(0,0,0,0.16)",
  // REV.15: o microblur externo continua em 2px, mas os agrupadores internos
  // recuperam o filtro forte anterior para restabelecer a hierarquia do Hub,
  // cameras e eletrodomesticos. Nao ampliar este filtro para a faixa externa.
  "bruno-subview-tile-inner-filter": "blur(14px) saturate(1.10)",
  // ---- CARTELA da Iluminacao = MESMOS TOKENS dos cards dinamicos ---------
  // REV.9 (2026-07-29). As revisoes 6/7/8 calibraram esta cartela no olho, com
  // valores proprios, e o resultado divergia do card dinamico em CINCO pontos:
  //   1. faltava o radial de topo  -> era o "esbranquicado" que o card tem;
  //   2. sobrava um scrim de 30%   -> o card dinamico NAO tem base escura,
  //      porque o tema tablet zera --ha-card-background;
  //   3. backdrop-filter: none     -> o card tem blur(20px) sat(1.18) bri(1.03);
  //   4. borda 0.10                -> o card usa 0.105;
  //   5. edge-glow a 0.70          -> no card a opacidade e 1.
  //
  // A CADEIA REAL do card dinamico (ex.: .media-card em bruno-media-card.js):
  //   --bruno-liquid-surface-off-*  (o Josh NAO sobrescreve — ver bloco abaixo)
  //   -> --bruno-liquid-card-*      (bruno-visionos.js, a base do Josh)
  //   -> --ha-card-background: none / --ha-card-box-shadow: none (tablet.yaml)
  //
  // Em vez de copiar valores, a cartela agora APONTA para os mesmos tokens.
  // Nao ha duplicacao: se o card dinamico mudar, a Iluminacao acompanha, e a
  // divergencia deixa de ser possivel por construcao.
  //
  // O radial volta junto com o blur, e isso NAO e opcional: sem filtro o radial
  // pousa sobre a foto nitida e le como uma bolha de borda dura (foi o "efeito
  // circular" da rev.8). Com blur(20px) ele dissolve, exatamente como no card
  // dinamico. Os dois andam juntos — nao remover um sem o outro.
  //
  // ANTERIOR (rollback rev.8):
  //   'bruno-subview-cartela-background': 'linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)',
  //   'bruno-subview-cartela-border': '1px solid rgba(255,255,255,0.10)',
  //   'bruno-subview-cartela-shadow': 'none',
  // REV.11 (2026-07-29) — O RADIAL SAI, e SO ele.
  // Eu argumentei que a "linha circular" nao podia ser o radial porque ele faz
  // parte da receita do card dinamico. Estava errado: no print do bloco aberto
  // o arco atravessa o painel inteiro, inconfundivel.
  // POR QUE aparece aqui e nao no card dinamico: o radial de 360x240 com alfa
  // 0.105 caindo para transparent em 64% e uma rampa longa e de alfa
  // baixissimo. Sobre a superficie do card dinamico ela se dissolve; aqui
  // ela pousa sobre um backdrop BORRADO (blur 20px), que e liso e sem textura,
  // e a rampa passa a exibir banding — os degraus viram arcos concentricos.
  // Textura mascara banding; superficie lisa denuncia.
  // Todas as OUTRAS camadas seguem token-identicas ao card dinamico: mesmo
  // linear-gradient e mesma ultima camada var(--ha-card-background), que o tema
  // tablet zera (sem base escura). Filtro, borda, sombra, raio, sheen e
  // edge-glow continuam vindo de --bruno-liquid-surface-off-*.
  // ANTERIOR (rollback): 'var(--bruno-liquid-surface-off-background)'
  // REV.12 (2026-07-29) — O BLUR VOLTA A SAIR. A REV.7 ESTAVA CERTA.
  // A rev.9 leu o mapa de tokens do card dinamico e aplicou TODOS ao pe da
  // letra, blur incluso, declarando que a nota da REV.7 estava errada. Nao
  // estava. O registro no CLAUDE.md termina com "NAO reintroduzir
  // backdrop-filter aqui" e o motivo continua valendo:
  //   a Iluminacao le como TRANSLUCIDA porque NAO filtra — a foto atras aparece
  //   NITIDA, so escurecida pelo scrim. blur(20px) destroi a textura, e sem
  //   textura qualquer superficie vira painel chapado, por mais translucida que
  //   seja a cor.
  // LICAO: o mapa de tokens do card dinamico e a referencia de COR e CONTORNO,
  // nao de FILTRO. O filtro depende do que esta atras: na Home o card dinamico
  // fica sobre o wallpaper da shell; aqui a cartela fica sobre a foto do comodo,
  // e o resultado do mesmo valor e oposto.
  // O radial tambem nao volta (rev.11): sem filtro ele vira arco por banding.
  // O que FICA do mapa: borda 0.105, edge-glow 1.0, sheen 0.13, raio 20px,
  // sombra none — tudo confirmado igual ao card dinamico.
  // ANTERIOR (rollback rev.9/rev.11):
  //   background sem scrim (var(--ha-card-background) = none pelo tablet.yaml)
  //   filter: 'var(--bruno-liquid-surface-off-filter)'
  "bruno-subview-cartela-background": "linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)",
  // REV.14: excecao controlada e aprovada para blur de apenas 2px. Os filhos
  // ficam sem filtro; isto nao reintroduz a receita destrutiva de 20px.
  "bruno-subview-cartela-filter": "var(--bruno-josh-microblur, blur(2px))",
  "bruno-subview-cartela-border": "var(--bruno-liquid-surface-off-border)",
  "bruno-subview-cartela-shadow": "var(--bruno-liquid-surface-off-shadow)",
  "bruno-subview-cartela-radius": "var(--bruno-liquid-card-radius, 20px)",
  "bruno-subview-cartela-sheen-opacity": "var(--bruno-liquid-surface-off-sheen-opacity, 0.13)",
  // O ::after da cartela e o mesmo edge-glow dos cards dinamicos, mas o token
  // global das subviews o entrega a 0.70. No card dinamico a opacidade e 1 —
  // era essa a "borda que nao bate". Override so para a cartela; os demais
  // cards da subview seguem em 0.70.
  "bruno-subview-cartela-edge-opacity": "1",
  // Zona do acordeao: agrupador transparente, para a Iluminacao com acordeao
  // (Sala, quartos) nao ficar mais pesada que a sem acordeao (Office, Cozinha).
  // REV.8: borda discreta em vez de transparente — as secoes do acordeao
  // tinham perdido qualquer demarcacao. Blur aqui nao e possivel: a zona e
  // ancestral dos tiles, que ja tem blur proprio (ver a nota no modulo).
  "bruno-subview-cartela-group-background": "none",
  "bruno-subview-cartela-group-border": "1px solid rgba(255,255,255,0.10)",
  "bruno-subview-cartela-group-shadow": "none",
  // ---- Nível 2 DENTRO da cartela da Iluminação ---------------------------
  // REV.15: excecao localizada. A cartela externa conserva apenas 2px; as
  // celulas pequenas recuperam o filtro anterior para devolver a hierarquia
  // sem alterar o material nem a geometria do bloco principal.
  // REV.16: as celulas de luz usam exatamente o mesmo pacote material dos
  // controles do A/C. O escopo continua restrito aos seletores de luz do
  // bruno-surface-material.js; geometria, gaps e card externo nao mudam.
  "bruno-subview-cartela-inner-background": "var(--bruno-liquid-control-background)",
  "bruno-subview-cartela-inner-filter": "var(--bruno-liquid-control-filter)",
  "bruno-subview-cartela-inner-border": "var(--bruno-liquid-control-border)",
  "bruno-subview-cartela-inner-border-color": "var(--bruno-liquid-control-border-color, rgba(255,255,255,0.070))",
  "bruno-subview-cartela-inner-radius": "var(--bruno-liquid-control-radius-compact, 12px)",
  "bruno-subview-cartela-inner-shadow": "var(--bruno-liquid-control-shadow)",
  // ---- Popups Josh.ai ----------------------------------------------------
  // REV.18: aliases, sem copiar RGBA. O plano externo dos popups aponta para
  // o mesmo pacote surface-off ja aprovado nos cards Josh; controles internos
  // continuam usando o pacote control. Nenhum outro tema consome estes nomes.
  "bruno-josh-popup-background": "var(--bruno-liquid-surface-off-background)",
  "bruno-josh-popup-filter": "var(--bruno-liquid-surface-off-filter)",
  "bruno-josh-popup-border": "var(--bruno-liquid-surface-off-border)",
  "bruno-josh-popup-shadow": "var(--bruno-liquid-surface-off-shadow)",
  "bruno-josh-popup-sheen": "var(--bruno-liquid-surface-off-sheen)",
  "bruno-josh-popup-sheen-opacity": "var(--bruno-liquid-surface-off-sheen-opacity, 0.13)",
  "bruno-josh-popup-edge-glow": "var(--bruno-liquid-surface-edge-glow)",
  "bruno-josh-popup-edge-opacity": "0.70",
  // ---- Ritmo comum dos cabeçalhos da faixa -------------------------------
  "bruno-subview-band-head-height": "34px",
  "bruno-subview-band-head-gap": "8px",
  // Josh-only room-subview material. Values are the concrete fallback recipe
  // declared by BrunoMediaCard itself, not aliases of the VisionOS surface.
  // Only bruno-surface-material.js consumes these namespaced tokens.
  "bruno-josh-subview-surface-background": "linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)), rgba(9,11,15,0.105)",
  "bruno-josh-subview-surface-filter": "blur(18px) saturate(0.92) brightness(1.05) contrast(1.02)",
  "bruno-josh-subview-surface-border": "1px solid rgba(255,255,255,0.070)",
  "bruno-josh-subview-surface-shadow": "inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145)",
  "bruno-josh-subview-surface-sheen": "linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%)",
  "bruno-josh-subview-surface-sheen-opacity": "0.10",
  "bruno-josh-subview-surface-edge-glow": "linear-gradient(125deg, rgba(255,255,255,0.11), rgba(255,255,255,0.026) 38%, rgba(255,255,255,0.010) 100%)",
  "bruno-josh-subview-surface-edge-opacity": "0.70",
  // --- Moldura da faixa de cômodos (Home V2) ---
  // ANTERIOR (rev.4/rev.7 — moldura em CARTELA, mantido para rollback):
  // 'bruno-strip-frame-background': 'linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))',
  // 'bruno-strip-frame-border': '1px solid rgba(255,255,255,0.11)',
  // 'bruno-strip-frame-filter': 'none',   // obrigatorio enquanto os tiles filtravam
  // 'bruno-strip-frame-shadow': 'inset 0 1px 0 rgba(255,255,255,0.10)',
  // ======================================================================
  // HOME V3 (2026-07-26) - TILES + BANDA AUTONOMA, exclusivos DESTE tema.
  //
  // Interruptor: `bruno-tile-mode: on`. Os 7 cards de comodo leem este
  // token (getComputedStyle) e so entram em modo tile quando ele vale 'on'
  // E o YAML passa `variant: tile` (faixa do desktop V2). Como nenhum outro
  // tema declara o token, iOS / visionOS / Liquid Glass continuam com o
  // visual de cartela EXATAMENTE como hoje, no desktop e no phone.
  //
  // A banda nao herda a superficie completa dos cards dinamicos. Ela usa
  // uma receita estatica propria, sem blur, borda ou sombra de cartela. Isso
  // evita backdrop roots e elimina divergencias de composicao entre PC e
  // tablet. Os filetes superior e inferior sao camadas independentes.
  // ======================================================================
  "bruno-tile-mode": "on",
  // Gap entre tiles: 0 (o filete vertical substitui o antigo gap de 10px).
  "bruno-tile-gap": "0px",
  // ---- Insets laterais: recuperados para acomodar o 8o tile --------------
  // ANTERIOR (7 tiles): 22px/38px = 60px reservados apenas para LIMITAR a
  // largura individual dos tiles. Sem funcao estrutural — era espaco morto.
  // 'bruno-tile-grid-inline-inset': '30px',
  // 'bruno-tile-grid-inset-start': '22px',
  // 'bruno-tile-grid-inset-end': '38px',
  //
  // NOVO (8 tiles, com o Corredor): 8px/12px = 20px. Os 40px liberados vao
  // direto para as tracks, o que absorve boa parte do custo da coluna extra.
  // A assimetria menor (start < end) preserva o mesmo vies otico de antes,
  // mantendo a faixa centrada no conteudo util ao lado da rail.
  // MEDIDAS REAIS (largura util = W - 86 de rail - 24 de padding do ha-card
  // - 20 de inset): tile = (W - 130) / 8.
  //   W=1382 (janela de teste): 156px  ·  W=1920 (tablet): 224px
  // No tablet a coluna de icone fica em ~154px, acima do max-width de 120px
  // do PNG — ou seja, os assets NAO encolhem no dispositivo-alvo.
  "bruno-tile-grid-inline-inset": "10px",
  "bruno-tile-grid-inset-start": "8px",
  "bruno-tile-grid-inset-end": "12px",
  "bruno-tile-background": "none",
  "bruno-tile-border": "0",
  "bruno-tile-radius": "0",
  "bruno-tile-shadow": "none",
  "bruno-tile-filter": "none",
  "bruno-tile-sheen-opacity": "0",
  // Status dots da faixa: mesma linguagem flat da rail, calibrada para o
  // diametro maior de 26px. Sem borda, gradiente ou brilho interno; apenas
  // preenchimento semantico e um halo curto para separar do wallpaper.
  "bruno-tile-status-dot-fill-alpha": "0.78",
  "bruno-tile-status-dot-border": "0",
  "bruno-tile-status-dot-halo-size": "8px",
  "bruno-tile-status-dot-halo-alpha": "0.18",
  "bruno-tile-divider": "linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.19) 22%, rgba(255,255,255,0.19) 78%, rgba(255,255,255,0) 100%)",
  // Afordancia de ACESO sem vidro: filete quente na base + brilho difuso.
  // (O asset `-on` do PNG e o clareamento de texto do .is-room-on continuam
  // valendo — sao hardcoded nos cards.)
  "bruno-tile-on-line": "linear-gradient(90deg, rgba(255,187,72,0) 0%, rgba(255,187,72,0.42) 50%, rgba(255,187,72,0) 100%)",
  "bruno-tile-on-glow": "radial-gradient(60px 30px at 50% 100%, rgba(255,187,72,0.10), transparent 72%)",
  // --- Banda (faixa de comodos + acoes rapidas) ---
  // A tinta replica o material INTERNO resolvido dos cards dinamicos no
  // VisionOS: tres camadas luminosas sobre base preta 0.30. Borda, sombra,
  // sheen perimetral e blur(20px) permanecem de fora para evitar cartela e
  // backdrop root na superficie grande. Os valores sao literais para nao
  // depender da ordem de carga dos temas.
  "bruno-strip-frame-radius": "0px",
  "bruno-strip-frame-border": "0",
  "bruno-strip-frame-shadow": "none",
  "bruno-strip-frame-background": "transparent",
  "bruno-strip-frame-filter": "var(--bruno-josh-microblur, blur(2px))",
  "bruno-strip-frame-fill": "radial-gradient(360px 240px at 18% -10%, rgba(255,255,255,0.105), transparent 64%), linear-gradient(180deg, rgba(255,255,255,0.060), rgba(255,255,255,0.018) 48%, rgba(0,0,0,0.035)), rgba(0,0,0,0.300)",
  "bruno-strip-frame-fill-opacity": "1",
  // Dissolve somente a tinta nos 24px laterais. O container, os tiles e os
  // filetes continuam sem mask, evitando a antiga moldura perimetral.
  "bruno-strip-frame-fill-fade": "linear-gradient(90deg, transparent 0, #000 24px, #000 calc(100% - 24px), transparent 100%)",
  // Filetes reais, sem mask perimetral: nao existem segmentos laterais nem
  // cantos capazes de formar uma moldura fechada.
  "bruno-strip-frame-top-line": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)",
  "bruno-strip-frame-bottom-line": "linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.16) 20%, rgba(255,255,255,0.34) 50%, rgba(255,255,255,0.16) 80%, rgba(255,255,255,0) 100%)",
  "bruno-strip-frame-lines-opacity": "1",
  // Neutraliza os tokens antigos para permitir fallback imediato sem deixar
  // camadas residuais se um navegador conservar CSS de uma revisao anterior.
  "bruno-strip-frame-sheen": "none",
  "bruno-strip-frame-sheen-opacity": "0",
  "bruno-strip-frame-edge-glow": "none",
  "bruno-strip-frame-edge-glow-opacity": "0",
  "bruno-strip-bleed": "0px",
  // ---- Sangramento assimetrico (recuperacao de espaco morto) -------------
  // O grid da secao reserva uma coluna `sidebar` de 0px + um gap de 10px
  // entre a rail e a faixa: espaco sem funcao. O start de 10px recupera esse
  // gap sem encostar na rail (a faixa passa a comecar na borda da caixa de
  // conteudo, a 12px da rail). O end de 12px leva a faixa ate a borda do
  // viewport, absorvendo o padding do content-slot.
  // Ganho liquido: 22px de largura util, que vao para as tracks.
  "bruno-strip-bleed-start": "10px",
  "bruno-strip-bleed-end": "12px",
  "bruno-strip-mask": "none"
};
function ti() {
  const o = ae();
  return Object.assign({}, o?.tokens || {}, wr);
}
const kr = `
html.bruno-liquid-route-transition::after {
  content: "";
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: none;
  background: rgba(0,0,0,0.12);
  -webkit-backdrop-filter: blur(7px) saturate(1.10);
  backdrop-filter: blur(7px) saturate(1.10);
  animation: bruno-liquid-route-fade 260ms ease both;
}
@keyframes bruno-liquid-route-fade { 0% { opacity: 0; } 36% { opacity: 1; } 100% { opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  html.bruno-liquid-route-transition::after { -webkit-backdrop-filter: none; backdrop-filter: none; animation-duration: 180ms; }
}
`;
function qr(o) {
  return Object.entries(o).map(([e, t]) => `  --${e}: ${String(t).trim().replace(/\s+/g, " ")};`).join(`
`);
}
function Sr(o = globalThis.document) {
  if (!o?.head) return null;
  if (!ae()?.tokens)
    return console.error("[BrunoJosh] VisionOS base unavailable; Josh was not applied."), null;
  let t = o.getElementById(Kt);
  return t || (t = o.createElement("style"), t.id = Kt, o.head.appendChild(t)), t.textContent = `:root {
${qr(ti())}
}
${kr}`, t;
}
globalThis.BrunoJosh = {
  version: yr,
  get tokens() {
    return ti();
  },
  get surfaces() {
    return ae()?.surfaces || {};
  },
  get states() {
    return ae()?.states || {};
  },
  apply: Sr,
  feedback: (...o) => ae()?.feedback?.(...o) || !1,
  routeTransition: (...o) => ae()?.routeTransition?.(...o)
};
const Yt = "20260723-liquid-glass-ios-1", Ee = "bruno-ui-theme", Xe = "bruno-ui-theme-storage-version", Je = "2", B = "visionos";
function Ar() {
  const o = globalThis.BrunoLiquidGlassOriginal || (globalThis.BrunoLiquidGlass?.__brunoThemeProxy ? null : globalThis.BrunoLiquidGlass), e = globalThis.BrunoLiquidGlassIOS, t = globalThis.BrunoVisionOSOriginal || globalThis.BrunoVisionOS, a = globalThis.BrunoIOSLight, i = globalThis.BrunoIOSDark, r = globalThis.BrunoJosh;
  o && (globalThis.BrunoLiquidGlassOriginal = o), t && (globalThis.BrunoVisionOSOriginal = t);
  const n = {
    "liquid-glass": {
      key: "liquid-glass",
      label: "Liquid Glass",
      get api() {
        return globalThis.BrunoLiquidGlassOriginal || o || null;
      }
    },
    "liquid-glass-ios": {
      key: "liquid-glass-ios",
      label: "Liquid Glass - iOS",
      get api() {
        return globalThis.BrunoLiquidGlassIOS || e || null;
      }
    },
    visionos: {
      key: "visionos",
      label: "VisionOS",
      get api() {
        return globalThis.BrunoVisionOSOriginal || globalThis.BrunoVisionOS || t || null;
      }
    },
    "ios-light": {
      key: "ios-light",
      label: "iOS Light",
      get api() {
        return globalThis.BrunoIOSLight || a || null;
      }
    },
    "ios-dark": {
      key: "ios-dark",
      label: "iOS Dark",
      get api() {
        return globalThis.BrunoIOSDark || i || null;
      }
    },
    // NOVO (2026-07-24) — HOME V2: tema Josh.ai (core/bruno-josh.js).
    // FALLBACK: remover esta entrada (e o resource) — nada mais depende dela.
    josh: {
      key: "josh",
      label: "Josh.ai",
      get api() {
        return globalThis.BrunoJosh || r || null;
      }
    }
  }, s = () => n[B]?.api ? B : n["liquid-glass"]?.api ? "liquid-glass" : B, l = (f) => n[f]?.api ? f : s(), c = {
    current: s()
  }, p = () => {
    try {
      return (globalThis.localStorage?.getItem(Xe) || "") !== Je ? (globalThis.localStorage?.setItem(Xe, Je), globalThis.localStorage?.setItem(Ee, B), B) : globalThis.localStorage?.getItem(Ee) || "";
    } catch {
      return "";
    }
  }, d = (f) => {
    try {
      globalThis.localStorage?.setItem(Xe, Je), globalThis.localStorage?.setItem(Ee, f);
    } catch {
    }
  }, h = () => n[c.current]?.api || n[s()]?.api || null, b = {
    __brunoThemeProxy: !0,
    get version() {
      return h()?.version || Yt;
    },
    apply(f) {
      return h()?.apply?.(f) || null;
    },
    injectGlobalStyle(f) {
      return h()?.injectGlobalStyle?.(f) || null;
    },
    tokens(f) {
      return h()?.tokens?.(f) || "";
    },
    cssVars(f) {
      return h()?.cssVars?.(f) || "";
    },
    cardVars(f) {
      return h()?.cardVars?.(f) || "";
    },
    controlVars(f) {
      return h()?.controlVars?.(f) || "";
    },
    popupVars(f) {
      return h()?.popupVars?.(f) || "";
    },
    iconVars(f) {
      return h()?.iconVars?.(f) || "";
    },
    styles(f) {
      return h()?.styles?.(f) || "";
    },
    buildStyles(f) {
      return h()?.buildStyles?.(f) || "";
    }
  }, u = {
    version: Yt,
    storageKey: Ee,
    defaultTheme: B,
    themes: n,
    list() {
      return Object.values(n).map((f) => ({
        key: f.key,
        label: f.label,
        available: !!f.api?.apply
      }));
    },
    current() {
      return c.current;
    },
    activeLabel() {
      return n[c.current]?.label || n[s()]?.label || "VisionOS";
    },
    apply(f, m = {}) {
      const x = l(f || B), S = n[x]?.api || n[s()]?.api;
      if (!S?.apply) return null;
      const $ = S.apply(m.styleOptions || void 0);
      return c.current = x, m.persist !== !1 && d(x), globalThis.BrunoLiquidGlass = b, globalThis.dispatchEvent?.(new CustomEvent("bruno-theme-changed", {
        detail: { key: x, label: n[x]?.label || x }
      })), $;
    },
    get activeApi() {
      return h();
    },
    compatApi: b
  }, g = l(p() || B);
  return c.current = g, globalThis.BrunoThemeManager = u, u.apply(g, { persist: !1 }), u;
}
globalThis.BrunoThemeManager = Ar();
const Or = "20260801-light-control-backdrop-root-1", Tt = "data-bruno-subview-surface-theme", Re = /* @__PURE__ */ new WeakMap();
function Er() {
  return globalThis.BrunoThemeManager?.current?.() || "";
}
function ai(o) {
  o?.setAttribute && o.setAttribute(
    Tt,
    Er() === "josh" ? "josh" : "default"
  );
}
function Cr(o) {
  if (!o) return;
  const e = Re.get(o);
  e && globalThis.removeEventListener?.("bruno-theme-changed", e);
  const t = () => ai(o);
  Re.set(o, t), globalThis.addEventListener?.("bruno-theme-changed", t), t();
}
function Tr(o) {
  const e = Re.get(o);
  e && globalThis.removeEventListener?.("bruno-theme-changed", e), Re.delete(o);
}
const G = [
  ".glass-card.cameras-card",
  ".glass-card.media-hub-card",
  ".glass-card.ac-card",
  ".glass-card.appliances-card"
], $r = G, Mr = [
  ".glass-card.media-hub-card",
  ".glass-card.ac-card"
], Ir = [
  // Hub de mídia / estação de trabalho
  // `.mh-source` e o container de CADA secao do hub (PC, Spotify) — e ele que
  // aparece como "card dentro do card". Ficou de fora das listas anteriores,
  // e era por isso que o hub continuava sem hierarquia interna por mais que
  // os tokens fossem calibrados: a regra nunca chegava nele.
  ".mh-source",
  ".media-tabs",
  ".media-image-button",
  ".media-extra-info",
  // Câmeras
  ".camera-main",
  ".camera-control",
  ".camera-thumb-overlay",
  // Eletrodomésticos
  ".appliance-tile"
], Ce = [
  ".glass-card.lights-card"
], Lr = [
  ".zl-tile",
  ".light-row",
  // REV.10 (2026-07-29): a celula da grade nova. A rev.9 renomeou `.zl-tile`
  // para `.light-cell` e NAO atualizou esta lista — as celulas ficaram orfas da
  // regra e o card virou uma lamina borrada uniforme, sem nivel interno. Era
  // isso que lia como "fosco", nao a receita externa (que e token-identica ao
  // card dinamico desde a rev.9). Na REV.16 estes seletores passaram a consumir
  // o pacote material completo dos controles do A/C; a geometria da grade
  // continua pertencendo a cada subview.
  ".light-cell"
], Rr = [
  ".light-zone"
], Nr = [
  ".cameras-head",
  ".media-hub-card .module-head",
  ".ac-card .module-head"
];
function C(o, e = "") {
  const t = `:host([${Tt}="josh"])`;
  return o.map((a) => `${t} ${a}${e}`).join(`,
`);
}
function zr() {
  const o = `:host([${Tt}="josh"])`, e = C(G), t = C(G, "::before"), a = C(G, "::after"), i = C(G.map((h) => `${h}.is-active`)), r = C($r), n = C(Ce), s = C(Mr), l = C(Ir), c = C(Lr), p = C(Rr), d = C(Nr);
  return `
    /* ---- 1. Cards viram tile: perdem cartela, blur, borda e cantos. ------- */
    ${e},
    ${i} {
      background: none;
      /* INVARIANTE: superfície estática, sem backdrop-filter. */
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: 0;
      border-radius: var(--bruno-subview-tile-radius, 0);
      box-shadow: none;
      isolation: isolate;
      overflow: hidden;
      position: relative;
      z-index: 1;
    }

    /* Sheen e edge-glow da cartela não existem no tile. */
    ${t},
    ${a} {
      display: none;
    }

    /* ---- 2. MOLDURA da faixa inferior (main::before). --------------------
       Pseudo-elemento de um container grid participa como ITEM do grid, então
       a moldura é posicionada por grid-column/grid-row sem nenhum markup novo.
       Ela atravessa os gaps entre os cards e devolve a continuidade que a
       faixa da Home tem. A borda inferior dela cai exatamente sobre o
       separador que já existe acima de "Presença".
       A RECEITA é a mesma da faixa da Home, scrim preto incluso — era isso que
       faltava e fazia tudo parecer transparente. */
    ${o} main::before {
      content: "";
      grid-column: 1 / -1;
      /* REV.4 — a moldura vai da linha dos cards até a última linha do grid,
         ancorada na base (align-self: end). Assim ela ASSENTA em vez de flutuar.
         REV.9 (2026-07-29) — o rodapé de presença de 54px SAIU do grid das
         subviews (a presença virou badge da barra superior), então a faixa
         encosta na base do painel e a altura volta a ser exatamente a linha dos
         cards. A regra "grid-row: 2 / -1" continua correta: com uma linha a
         menos, -1 passou a ser o fim da própria linha dos cards.
         ATENCAO: NUNCA usar crase neste comentario. Ele vive DENTRO do template
         literal que comeca no "return" desta funcao — uma crase fecha a string,
         o modulo para de compilar, globalThis.BrunoSurfaceMaterial nunca e
         definido e TODAS as subviews perdem o material Josh de uma vez (a Home
         nao usa este modulo e fica intacta, o que disfarca a causa). Foi
         exatamente o que aconteceu em 2026-07-29.
         ANTERIOR (rollback): altura = linha dos cards + gap + rodapé (54px)
           calc(var(--ac-h, 320px) + var(--sala-gap, 10px) + 54px) */
      grid-row: var(--bruno-subview-band-row, 2) / -1;
      align-self: end;
      height: var(--bruno-subview-band-height, var(--ac-h, 320px));
      z-index: 0;
      pointer-events: none;
      margin: 0 calc(-1 * var(--bruno-subview-band-bleed, 0px));
      background:
        var(--bruno-subview-band-top-line, linear-gradient(transparent, transparent)) top center / 100% 1px no-repeat,
        var(--bruno-subview-band-bottom-line, linear-gradient(transparent, transparent)) bottom center / 100% 1px no-repeat,
        var(--bruno-subview-band-fill, none);
      backdrop-filter: var(--bruno-subview-band-filter, none);
      -webkit-backdrop-filter: var(--bruno-subview-band-filter, none);
      -webkit-mask-image: var(--bruno-subview-band-fade, none);
      mask-image: var(--bruno-subview-band-fade, none);
      -webkit-mask-repeat: no-repeat;
      mask-repeat: no-repeat;
      -webkit-mask-size: 100% 100%;
      mask-size: 100% 100%;
    }

    /* Cozinha: a faixa começa na linha própria dela (appliances) e segue até
       o fim do grid, mesma regra de altura das outras cinco. */
    ${o} main.cozinha-subview::before {
      grid-row: var(--bruno-subview-band-row-cozinha, 3) / -1;
    }

    /* Vestígio de rollback: desde a REV.9 o rodapé não é mais renderizado, então
       esta regra não tem alvo. Ela fica para o caso de o rodapé voltar — sem ela
       nasceriam duas réguas paralelas a 10px (o filete do rodapé e o da moldura). */
    ${o} .subview-footer::before {
      display: none;
    }

    /* Cards dentro da faixa não pintam nada — quem pinta é a moldura. */
    ${r} {
      background: none;
    }

    /* Filete vertical entre tiles da mesma faixa. border-image para herdar o
       fade nas pontas sem pseudo-elemento (que o overflow:hidden recortaria). */
    ${s} {
      border-left: 1px solid transparent;
      border-image: var(--bruno-subview-tile-divider,
        linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.19) 22%, rgba(255,255,255,0.19) 78%, rgba(255,255,255,0) 100%)
      ) 1;
    }

    /* ---- 3. Nível 2 dentro da faixa: CONTENÇÃO, não só opacidade. --------
       Sobre plano chapado, alfa sozinho não cria hierarquia. Superfície mais
       marcada + borda + raio devolvem a leitura de bloco contido. */
    ${l} {
      background: var(--bruno-subview-tile-inner-background,
        linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))
      );
      /* BLUR PRÓPRIO — seguro AQUI, e só aqui. O tile da faixa é estático
         (sem backdrop-filter), então estes blocos amostram o papel de parede
         e o fill da moldura diretamente: não há aninhamento, não há borrão
         sobre borrão. É esta segunda camada que cria a hierarquia entre o
         contêiner e seus componentes.
         CUIDADO: cada blur é uma camada de composição por frame. Aplicado no
         nível de AGRUPAMENTO (abas, moldura de câmera, tile de
         eletrodoméstico), não em cada elemento folha — mesma hierarquia, uma
         fração do custo no tablet. */
      backdrop-filter: var(--bruno-subview-tile-inner-filter, none);
      -webkit-backdrop-filter: var(--bruno-subview-tile-inner-filter, none);
      border: var(--bruno-subview-tile-inner-border, 1px solid rgba(255,255,255,0.16));
      border-radius: var(--bruno-subview-tile-inner-radius, 14px);
      box-shadow: var(--bruno-subview-tile-inner-shadow,
        inset 0 1px 0 rgba(255,255,255,0.10), 0 6px 16px rgba(0,0,0,0.16)
      );
    }

    /* ---- 4. CARTELA da Iluminação = mesma composição dos cards dinâmicos.
       O container já lê a mesma cadeia de tokens dos cards dinâmicos da Home
       (surface-off-*, que sob VisionOS resolve para card-*). A ÚNICA
       divergência era geométrica: o radial daquela receita tem tamanho
       ABSOLUTO (360x240px). No card de Mídia (~430x248) ele cobre quase tudo
       e lê como lavagem uniforme; na Iluminação (~376x386) cobre só o topo e
       lê como bolha circular — o "efeito circular do VisionOS" relatado.
       Aqui o mesmo desenho é redeclarado em PORCENTAGEM, então acompanha a
       proporção do contêiner. A última camada continua sendo
       --ha-card-background (que o tema tablet zera): é justamente a ausência
       dessa base escura que produz a translucidez que virou identidade do
       painel. NÃO reintroduzir base preta nem sombra — seria voltar ao vidro
       fosco do VisionOS. */
    /* REV.7 — A CAUSA ERA O BLUR, NÃO A COR.
       Rodadas anteriores tentaram igualar a Iluminação aos cards dinâmicos
       mexendo em gradiente, alfa e scrim. Errado: a faixa parece transparente
       porque ela NÃO filtra — você vê a imagem NÍTIDA atrás, só escurecida
       pelo scrim. A Iluminação tinha backdrop-filter: blur(20px), e blur
       destrói a textura da foto; sem textura, qualquer superfície lê como
       painel chapado, por mais translúcida que seja a cor.
       Agora a Iluminação usa exatamente a MESMA receita da faixa: superfície
       estática, sem filtro, com o mesmo fill. É o material que o usuário
       aponta como correto, e passa a ser um só em toda a subview.
       NÃO reintroduzir backdrop-filter aqui. */
    /* REV.12 (2026-07-29) — A REV.7 ACIMA CONTINUA VALENDO COMO REGRA.
       A rev.9 declarou aqui que a REV.7 estava errada e reintroduziu o blur,
       porque o mapa de tokens do card dinamico traz backdrop-filter. Foi
       regressao: a Iluminacao virou uma lamina fosca e perdeu a translucidez
       que o usuario tinha aprovado.
       A distincao que faltava: o mapa do card dinamico e referencia de COR e
       CONTORNO (borda 0.105, edge-glow 1.0, sheen 0.13, raio 20px, sombra none
       — todos adotados), mas NAO de FILTRO. O mesmo valor de blur da resultados
       opostos porque o que fica ATRAS e diferente: na Home o card dinamico esta
       sobre o wallpaper da shell; aqui a cartela esta sobre a foto do comodo.
       Sem filtro a foto aparece nitida e a superficie le como vidro; com filtro
       a textura morre e tudo vira painel chapado.
       NAO reintroduzir backdrop-filter aqui — terceira vez que isso se decide. */
    /* REV.17: o microblur visual continua em 2px, mas deixa de viver no
       ancestral dos botoes. backdrop-filter no ancestral cria um backdrop
       root; por isso o blur forte das celulas nao conseguia amostrar a foto,
       embora consumisse exatamente os mesmos tokens do A/C. A amostragem de
       2px passa para um plano atras do conteudo, definido no pseudo-elemento
       abaixo. Fill, borda, raio, sombra e transparencia nao mudam. */
    ${n} {
      background: var(--bruno-subview-cartela-background,
        var(--bruno-liquid-surface-off-background, var(--bruno-subview-band-fill, none))
      );
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
      border: var(--bruno-subview-cartela-border, var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.105)));
      box-shadow: var(--bruno-subview-cartela-shadow, var(--bruno-liquid-surface-off-shadow, none));
      border-radius: var(--bruno-subview-cartela-radius, var(--bruno-liquid-card-radius, 20px));
    }

    /* O antigo edge-glow mascarado continuaria produzindo o arco interno.
       O pseudo-elemento e reutilizado como plano retangular transparente do
       microblur, sem mascara, glow, cor ou contorno. Assim o aspecto externo
       permanece, mas o plano nao se torna ancestral dos controles internos. */
    ${C(Ce, "::after")} {
      display: block;
      inset: 0;
      z-index: 0;
      width: auto;
      height: auto;
      padding: 0;
      border-radius: inherit;
      background: rgba(255,255,255,0.001);
      backdrop-filter: var(--bruno-subview-cartela-filter,
        var(--bruno-liquid-surface-off-filter, none));
      -webkit-backdrop-filter: var(--bruno-subview-cartela-filter,
        var(--bruno-liquid-surface-off-filter, none));
      -webkit-mask: none;
      mask: none;
      opacity: 1;
    }

    /* O sheen do container segue o mesmo valor dos cards dinamicos (0.13),
       e nao o fallback de 0.74 da cartela de subview — era mais um ponto em
       que os dois divergiam. */
    ${C(Ce, "::before")} {
      z-index: 1;
      opacity: var(--bruno-subview-cartela-sheen-opacity, 0.13);
    }

    ${C(Ce, " > *")} {
      z-index: 2;
    }

    /* REV.16: somente os controles internos de luz recebem o mesmo pacote
       material dos controles do A/C. O microblur externo de 2px permanece
       intocado; esta amostragem localizada restaura a hierarquia interna. */
    ${c} {
      background: var(--bruno-subview-cartela-inner-background,
        linear-gradient(180deg, rgba(255,255,255,0.085), rgba(255,255,255,0.035))
      );
      /* Fallback rapido: restaurar os tokens da REV.15 remove apenas este
         material interno, sem tocar na superficie externa da subview. */
      backdrop-filter: var(--bruno-subview-cartela-inner-filter, none);
      -webkit-backdrop-filter: var(--bruno-subview-cartela-inner-filter, none);
      border: var(--bruno-subview-cartela-inner-border, 1px solid rgba(255,255,255,0.16));
      border-color: var(--bruno-subview-cartela-inner-border-color, rgba(255,255,255,0.16));
      border-radius: var(--bruno-subview-cartela-inner-radius, var(--bruno-liquid-control-radius-compact, 12px));
      box-shadow: var(--bruno-subview-cartela-inner-shadow, inset 0 1px 0 rgba(255,255,255,0.07));
    }

    /* Zona do acordeão: agrupador com DEMARCAÇÃO DISCRETA, sem blur.
       REV.8 — na rev.7 ela ficou totalmente transparente e as seções (Sala,
       Varanda) perderam qualquer delimitação, ficando "soltas".
       POR QUE NÃO BLUR AQUI: a zona é ANCESTRAL dos tiles de luz, e os tiles
       já têm blur próprio (que ficou correto). Blur na zona faria os tiles
       borrarem um backdrop já borrado — o mesmo aninhamento que arruinou a
       moldura da Home nas rev.5/6. Como a hierarquia já vem do blur dos
       tiles, aqui basta a borda: é a alternativa que o próprio usuário
       autorizou, e a única compatível com a invariante.
       O contorno é o mesmo idioma dos filetes: fino e translúcido. */
    ${p} {
      background: var(--bruno-subview-cartela-group-background, none);
      border: var(--bruno-subview-cartela-group-border, 1px solid rgba(255,255,255,0.10));
      box-shadow: var(--bruno-subview-cartela-group-shadow, none);
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    /* ---- 5. Ritmo comum dos cabeçalhos da faixa. -------------------------
       Vídeo, acordeão e gauge têm paddings e escalas distintos. Uma altura e
       um respiro comuns dão o mínimo de série que a continuidade de fundo
       sozinha não entrega. Não toca no conteúdo interno dos blocos. */
    ${d} {
      min-height: var(--bruno-subview-band-head-height, 34px);
      padding-bottom: var(--bruno-subview-band-head-gap, 8px);
      display: flex;
      align-items: center;
    }
  `;
}
function Hr() {
  const o = C(G), e = C(G, "::before"), t = C(G, "::after");
  return `
    ${o} {
      background: var(--bruno-josh-subview-surface-background);
      -webkit-backdrop-filter: var(--bruno-josh-subview-surface-filter);
      backdrop-filter: var(--bruno-josh-subview-surface-filter);
      border: var(--bruno-josh-subview-surface-border);
      box-shadow: var(--bruno-josh-subview-surface-shadow);
      isolation: isolate;
      overflow: hidden;
    }

    ${e} {
      content: "";
      position: absolute;
      inset: 1px;
      z-index: 0;
      pointer-events: none;
      border-radius: inherit;
      background: var(--bruno-josh-subview-surface-sheen);
      opacity: var(--bruno-josh-subview-surface-sheen-opacity);
    }

    ${t} {
      content: "";
      display: block;
      position: absolute;
      inset: 0;
      z-index: 4;
      width: auto;
      height: auto;
      padding: 1px;
      pointer-events: none;
      border-radius: inherit;
      background: var(--bruno-josh-subview-surface-edge-glow);
      -webkit-mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      -webkit-mask-composite: xor;
      mask:
        linear-gradient(#000 0 0) content-box,
        linear-gradient(#000 0 0);
      mask-composite: exclude;
      opacity: var(--bruno-josh-subview-surface-edge-opacity);
    }
  `;
}
globalThis.BrunoSurfaceMaterial = {
  version: Or,
  connect: Cr,
  disconnect: Tr,
  sync: ai,
  // ANTERIOR (rollback): subviewStyles: brunoSubviewMaterialStyles,
  subviewStyles: zr,
  materialStyles: Hr
};
const Dr = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7", Pr = {
  _installingEntities: /* @__PURE__ */ new Set(),
  render({ hass: o, embedded: e = !1 } = {}) {
    const t = this._model(o), a = e ? 'data-config-action="child-close"' : 'data-updates-action="close"';
    return `
      <style>${this._styles()}</style>
      ${e ? "" : '<div class="config-scrim" data-updates-action="close"></div>'}
      <section class="config-panel updates-panel${e ? " config-child-panel" : ""}" role="dialog" aria-modal="true" aria-label="Updates">
        <header class="config-header">
          <span class="config-icon updates-icon" aria-hidden="true">
            ${globalThis.BrunoIcons?.render("updates") || ""}
          </span>
          <div class="config-title">
            <strong>Updates</strong>
            <span>Atualizacoes do sistema</span>
          </div>
          <button class="config-close" type="button" ${a} aria-label="Fechar">&times;</button>
        </header>

        <div class="updates-scroll">
          <div class="config-section">
            <div class="config-section-title">
              <span>Home Assistant</span>
              <small>${this._escape(t.homeStatus)}</small>
            </div>
            ${this._updatesList(t.systemUpdates, {
      emptyTitle: "Sem updates do sistema",
      emptyText: "Core, OS e Supervisor nao possuem atualizacoes pendentes."
    })}
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Integracoes</span>
              <small>${this._escape(t.integrationStatus)}</small>
            </div>
            ${this._updatesList(t.integrationUpdates, {
      emptyTitle: "Nada pendente",
      emptyText: "Integracoes e componentes estao sem atualizacoes."
    })}
          </div>
        </div>

        <footer class="config-footer updates-footer">
          <button class="config-refresh" type="button" data-updates-action="open-updates-page">Central de updates</button>
        </footer>
      </section>
    `;
  },
  handleAction({ target: o, hass: e, host: t } = {}) {
    const a = o?.dataset?.updatesAction;
    if (!a) return !1;
    const i = o.dataset.entity;
    if (a === "more-info" && i)
      return t?.dispatchEvent?.(new CustomEvent("hass-more-info", {
        detail: { entityId: i },
        bubbles: !0,
        composed: !0
      })), !0;
    if (a === "install" && i) {
      const r = e?.states?.[i];
      return this._installingEntities.has(i) || this._isInstalling(r?.attributes?.in_progress) || (this._installingEntities.add(i), Promise.resolve(e?.callService?.("update", "install", { entity_id: i })).catch(() => this._installingEntities.delete(i)), globalThis.setTimeout?.(() => this._installingEntities.delete(i), 6e4), this._scheduleRender(t)), !0;
    }
    if (a === "skip" && i)
      return e?.callService?.("update", "skip", { entity_id: i }), this._scheduleRender(t), !0;
    if (a === "release-notes") {
      const r = o.dataset.url;
      return r && globalThis.open?.(r, "_blank", "noopener,noreferrer"), !0;
    }
    if (a === "open-updates-page") {
      const r = e?.panels?.config?.url_path || "config";
      return globalThis.location.href = `/${r}/updates`, !0;
    }
    return !1;
  },
  _scheduleRender(o) {
    globalThis.setTimeout?.(() => o?._refreshUpdatesPanel?.({ preserveScroll: !0 }), 900);
  },
  _model(o) {
    const e = o?.states || {}, t = this._updateEntities(e), a = t.filter((l) => l.group === "system"), i = t.filter((l) => l.group !== "system"), r = a.length, n = Number(this._attr(e, "sensor.hassio_updates_available", "home_assistant")) || 0, s = Math.max(r, n);
    return {
      homeStatus: s > 0 ? `${s} ${s === 1 ? "pendente" : "pendentes"}` : "Sem updates do sistema",
      systemUpdates: a,
      integrationUpdates: i,
      integrationStatus: i.length === 0 ? "Nenhuma pendente" : `${i.length} ${i.length === 1 ? "pendente" : "pendentes"}`
    };
  },
  _updatesList(o, e = {}) {
    return o.length ? `
      <div class="updates-list">
        ${o.map((t) => `
          <article class="updates-item">
            <button class="updates-info" type="button" data-updates-action="more-info" data-entity="${this._escapeAttr(t.entityId)}">
              <span class="updates-thumb" aria-hidden="true">
                <img src="${this._escapeAttr(t.picture)}" alt="">
              </span>
              <span class="updates-copy">
                <strong>${this._escape(t.name)}</strong>
                <small>${this._escape(t.versionLine)}</small>
              </span>
            </button>
            <div class="updates-actions">
              <button class="updates-mini${t.installing ? " is-installing" : ""}" type="button"
                data-updates-action="install" data-entity="${this._escapeAttr(t.entityId)}"
                ${t.installing ? 'disabled aria-busy="true"' : ""}>${t.installing ? "Instalando" : "Instalar"}</button>
              <button class="updates-mini is-muted" type="button" data-updates-action="skip" data-entity="${this._escapeAttr(t.entityId)}">Ignorar</button>
            </div>
          </article>
        `).join("")}
      </div>
    ` : `
        <div class="updates-empty">
          <span class="updates-empty-dot" aria-hidden="true"></span>
          <div>
            <strong>${this._escape(e.emptyTitle || "Nada pendente")}</strong>
            <small>${this._escape(e.emptyText || "Nao ha atualizacoes pendentes.")}</small>
          </div>
        </div>
      `;
  },
  _updateEntities(o) {
    return Object.entries(o || {}).filter(([e, t]) => e.startsWith("update.") && t?.state === "on").map(([e, t]) => {
      const a = t.attributes || {}, i = a.friendly_name || e, r = this._cleanName(i), n = a.installed_version || a.installed || "--", s = a.latest_version || a.latest || "--";
      return {
        entityId: e,
        name: r,
        group: this._updateGroup(e, i),
        picture: a.entity_picture || Dr,
        versionLine: `${n} -> ${s}`,
        installing: this._installingEntities.has(e) || this._isInstalling(a.in_progress)
      };
    }).sort((e, t) => e.name.localeCompare(t.name, "pt-BR"));
  },
  _isInstalling(o) {
    if (o === !0) return !0;
    const e = Number(o);
    return Number.isFinite(e) && e > 0 ? !0 : ["true", "installing", "in_progress"].includes(String(o || "").toLowerCase());
  },
  _updateGroup(o, e) {
    const t = `${o} ${e}`.toLowerCase();
    return [
      "home_assistant_core",
      "home assistant core",
      "home assistant operating system",
      "home_assistant_operating_system",
      "operating system",
      "hassos",
      "supervisor",
      "home_assistant_supervisor"
    ].some((a) => t.includes(a)) ? "system" : "integration";
  },
  _state(o, e) {
    const t = o?.[e]?.state;
    return t && !["unknown", "unavailable"].includes(String(t).toLowerCase()) ? t : "";
  },
  _attr(o, e, t) {
    return o?.[e]?.attributes?.[t];
  },
  _cleanName(o) {
    return String(o || "").replace(/_/g, " ").replace(/\s+update$/i, "").replace(/^update\./i, "").trim();
  },
  _escape(o) {
    return String(o ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  },
  _escapeAttr(o) {
    return this._escape(o).replace(/`/g, "&#96;");
  },
  _styles() {
    return `
      .updates-panel {
        width: min(520px, calc(100vw - 124px));
        max-height: min(74vh, 690px);
        display: flex;
        flex-direction: column;
      }

      .updates-icon svg {
        fill: none;
        stroke: currentColor;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .updates-scroll {
        min-height: 0;
        overflow-y: auto;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.24) transparent;
      }

      .updates-scroll::-webkit-scrollbar {
        width: 6px;
      }

      .updates-scroll::-webkit-scrollbar-thumb {
        background: rgba(255,255,255,0.22);
        border-radius: 999px;
      }

      .updates-thumb,
      .updates-empty-dot {
        display: grid;
        place-items: center;
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.92);
        font-weight: 900;
      }

      .updates-list {
        display: grid;
      }

      .updates-item {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: center;
        gap: 8px;
        padding: 8px 0;
        background: transparent;
      }

      .updates-item + .updates-item {
        border-top: 1px solid rgba(255,255,255,0.060);
      }

      .updates-info {
        min-width: 0;
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        border: 0;
        padding: 0;
        background: transparent;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      .updates-thumb {
        width: 28px;
        height: 28px;
        overflow: hidden;
        border-radius: 0;
        background: transparent;
      }

      .updates-thumb img {
        width: 20px;
        height: 20px;
        object-fit: contain;
        display: block;
      }

      .updates-copy strong,
      .updates-empty strong {
        display: block;
        min-width: 0;
        font-size: 11px;
        line-height: 1.12;
        font-weight: 850;
        color: rgba(255,255,255,0.90);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .updates-copy small,
      .updates-empty small {
        display: block;
        margin-top: 2px;
        min-width: 0;
        font-size: 9px;
        line-height: 1.15;
        font-weight: 650;
        color: rgba(255,255,255,0.56);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .updates-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        gap: 6px;
      }

      .updates-mini {
        min-height: 25px;
        border: var(--bruno-liquid-control-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.18));
        border-radius: var(--bruno-liquid-control-radius-compact, 10px);
        background: var(--bruno-liquid-control-warm-background, rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.038));
        color: rgba(255,255,255,0.82);
        padding: 0 8px;
        font-size: 9px;
        font-weight: 850;
        cursor: pointer;
      }

      .updates-mini.is-muted {
        border-color: rgba(255,255,255,0.070);
        background: rgba(255,255,255,0.026);
        color: rgba(255,255,255,0.54);
      }

      .updates-empty {
        display: grid;
        grid-template-columns: 28px minmax(0, 1fr);
        align-items: center;
        gap: 9px;
        padding: 8px 0;
      }

      .updates-empty-dot {
        width: 28px;
        height: 28px;
        border-radius: 0;
      }

      .updates-empty-dot::before {
        content: "";
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: rgba(112,255,166,0.92);
        box-shadow: 0 0 14px rgba(112,255,166,0.35);
      }

      .updates-footer {
        flex: 0 0 auto;
      }
    `;
  }
};
globalThis.BrunoUpdatesPanel = Pr;
const jr = {
  render({ hass: o } = {}) {
    const e = this._model(o);
    return `
      <style>${this._styles()}</style>
      <div class="config-scrim" data-system-action="close"></div>
      <section class="config-panel system-panel" role="dialog" aria-modal="true" aria-label="Sistema">
        <header class="config-header">
          <span class="config-icon system-icon" aria-hidden="true"><bruno-icon icon="mdi:chip"></bruno-icon></span>
          <div class="config-title">
            <strong>Sistema</strong>
            <span>Estado e manutencao</span>
          </div>
          <button class="config-close" type="button" data-system-action="close" aria-label="Fechar">&times;</button>
        </header>

        <div class="system-scroll">
          <div class="config-section">
            <div class="config-section-title">
              <span>Home Assistant</span>
              <small>${this._escape(e.haStatus)}</small>
            </div>
            <div class="panel-lines">
              ${this._metricLine("mdi:home-assistant", "Atual", e.currentVersion)}
              ${this._metricLine("mdi:update", "Proxima versao", e.nextRelease)}
              ${this._metricLine("mdi:database", "Banco de dados", e.database)}
            </div>
            <div class="panel-bars">
              ${this._bar("CPU", e.haCpu, "%")}
              ${this._bar("Temperatura", e.haTemp, "C")}
              ${this._bar("Memoria", e.haMemory, "%")}
              ${this._bar("Disco", e.haDisk, "%")}
            </div>
            <div class="panel-actions">
              <button type="button" data-system-action="reload-yaml">Recarregar YAML</button>
              <button type="button" data-system-action="restart-ha">Reiniciar HA</button>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Servidor</span>
              <small>${this._escape(e.serverStatus)}</small>
            </div>
            <div class="panel-lines">
              ${this._metricLine("mdi:raspberry-pi", "Raspberry Docker", e.dockerState)}
              ${this._metricLine("mdi:clock-outline", "Uptime", e.dockerUptime)}
            </div>
            <div class="panel-bars">
              ${this._bar("CPU", e.rpiCpu, "%")}
              ${this._bar("Temperatura", e.rpiTemp, "C")}
              ${this._bar("Memoria", e.rpiMemory, "%")}
              ${this._bar("Disco livre", e.rpiDiskFree, "%")}
            </div>
            <div class="panel-actions">
              <button type="button" data-system-action="restart-pi">Reiniciar PI</button>
              <button type="button" data-system-action="purge-dockerlog">Limpar logs</button>
            </div>
          </div>
        </div>
      </section>
    `;
  },
  handleAction({ target: o, hass: e, host: t } = {}) {
    const a = o?.dataset?.systemAction;
    if (!a || a === "close") return !1;
    if (a === "reload-yaml")
      return e?.callService?.("homeassistant", "reload_all", {}), !0;
    if (a === "restart-ha")
      return e?.callService?.("homeassistant", "restart", {}), !0;
    if (a === "restart-pi")
      return e?.callService?.("script", "restart_pi_docker", {}), !0;
    if (a === "purge-dockerlog")
      return e?.callService?.("script", "purge_dockerlog", {}), !0;
    if (a === "more-info") {
      const i = o.dataset.entity;
      return i && t?.dispatchEvent?.(new CustomEvent("hass-more-info", { detail: { entityId: i }, bubbles: !0, composed: !0 })), !0;
    }
    return !1;
  },
  _model(o) {
    const e = o?.states || {}, t = this._state(e, "binary_sensor.192_168_0_146", "off") === "on";
    return {
      haStatus: this._state(e, "sensor.current_version") || "Disponivel",
      currentVersion: this._state(e, "sensor.current_version"),
      nextRelease: this._state(e, "sensor.template_hass_next_release"),
      database: this._state(e, "sensor.ha_db"),
      haCpu: this._num(e, "sensor.ha_system_cpu_usage"),
      haTemp: this._num(e, "sensor.ha_system_cpu_thermal_0_temperature"),
      haMemory: this._num(e, "sensor.ha_system_memory_usage"),
      haDisk: this._num(e, "sensor.ha_system_data_disk_usage"),
      serverStatus: t ? "Online" : "Offline",
      dockerState: t ? "Online" : "Offline",
      dockerUptime: this._attr(e, "sensor.rpi_monitor_docker", "up_time") || this._state(e, "sensor.rpi_monitor_docker"),
      rpiCpu: this._num(e, "sensor.rpi_monitor_docker_rpi_cpu_use_pidocker"),
      rpiTemp: this._num(e, "sensor.rpi_monitor_docker_rpi_temp_pidocker"),
      rpiMemory: this._num(e, "sensor.rpi_monitor_docker_rpi_used_pidocker"),
      rpiDiskFree: this._num(e, "sensor.rpi_monitor_docker", "fs_free_prcnt")
    };
  },
  _metricLine(o, e, t) {
    return `
      <div class="panel-line">
        <bruno-icon icon="${this._escapeAttr(o)}"></bruno-icon>
        <span>${this._escape(e)}</span>
        <strong>${this._escape(t || "--")}</strong>
      </div>
    `;
  },
  _bar(o, e, t) {
    const a = Number(e), i = Number.isFinite(a), r = i ? Math.max(0, Math.min(100, a)) : 0, n = i ? `${a.toFixed(a >= 10 ? 0 : 1)}${t || ""}` : "--";
    return `
      <div class="panel-bar">
        <div><span>${this._escape(o)}</span><strong>${this._escape(n)}</strong></div>
        <i style="--value:${r}%"><b></b></i>
      </div>
    `;
  },
  _state(o, e, t = "--") {
    const a = o?.[e]?.state;
    return a && !["unknown", "unavailable", "none"].includes(String(a).toLowerCase()) ? a : t;
  },
  _num(o, e, t) {
    const a = t ? o?.[e]?.attributes?.[t] : o?.[e]?.state, i = Number(a);
    return Number.isFinite(i) ? i : null;
  },
  _attr(o, e, t) {
    const a = o?.[e]?.attributes?.[t];
    return a == null || ["unknown", "unavailable", "none"].includes(String(a).toLowerCase()) ? "--" : a;
  },
  _escape(o) {
    return String(o ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  },
  _escapeAttr(o) {
    return this._escape(o).replace(/`/g, "&#96;");
  },
  _styles() {
    return `
      .system-panel { width: min(520px, calc(100vw - 124px)); max-height: min(74vh, 690px); display: flex; flex-direction: column; }
      .system-icon bruno-icon { --mdc-icon-size: 17px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.92); }
      .system-scroll { min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) transparent; }
      .system-scroll::-webkit-scrollbar { width: 6px; }
      .system-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 999px; }
      .panel-lines { display: grid; gap: 0; border-top: 1px solid rgba(255,255,255,0.08); }
      .panel-line { min-height: 38px; display: grid; grid-template-columns: 22px minmax(0,1fr) auto; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.78); }
      .panel-line bruno-icon { --mdc-icon-size: 15px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.75); }
      .panel-line span { min-width: 0; font-size: 11px; font-weight: 720; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .panel-line strong { font-size: 11px; font-weight: 760; color: rgba(255,255,255,0.90); }
      .panel-bars { display: grid; gap: 10px; margin-top: 12px; }
      .panel-bar { display: grid; gap: 6px; }
      .panel-bar div { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 10px; color: rgba(255,255,255,0.62); font-weight: 720; }
      .panel-bar strong { color: rgba(255,255,255,0.86); }
      .panel-bar i { display: block; height: 5px; border-radius: 999px; background: rgba(255,255,255,0.10); overflow: hidden; }
      .panel-bar b { display: block; width: var(--value,0%); height: 100%; border-radius: inherit; background: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.76); box-shadow: 0 0 12px rgba(var(--bruno-liquid-warm-accent,255,214,10),0.24); }
      .panel-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      .panel-actions button { min-height: 30px; padding: 0 12px; border-radius: var(--bruno-popup-action-radius, 999px); border: var(--bruno-popup-inner-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent,255,214,10),0.28)); background: var(--bruno-popup-inner-warm-background, rgba(255,255,255,0.045)); box-shadow: var(--bruno-popup-inner-warm-shadow, none); -webkit-backdrop-filter: var(--bruno-popup-inner-filter, none); backdrop-filter: var(--bruno-popup-inner-filter, none); color: rgba(255,255,255,0.86); font: inherit; font-size: 10px; font-weight: 800; cursor: pointer; }
      .panel-actions button:hover { background: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.14); }
    `;
  }
};
globalThis.BrunoSystemPanel = jr;
const Vr = {
  render({ hass: o } = {}) {
    const e = this._model(o);
    return `
      <style>${this._styles()}</style>
      <div class="config-scrim" data-network-action="close"></div>
      <section class="config-panel network-panel" role="dialog" aria-modal="true" aria-label="Rede">
        <header class="config-header">
          <span class="config-icon network-icon" aria-hidden="true"><bruno-icon icon="mdi:wifi"></bruno-icon></span>
          <div class="config-title">
            <strong>Rede</strong>
            <span>Conectividade e pontos de acesso</span>
          </div>
          <button class="config-close" type="button" data-network-action="close" aria-label="Fechar">&times;</button>
        </header>

        <div class="network-scroll">
          <div class="config-section">
            <div class="config-section-title">
              <span>Access Points</span>
              <small>${this._escape(e.apStatus)}</small>
            </div>
            <div class="network-list">
              ${e.aps.map((t) => this._apLine(t)).join("")}
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Router</span>
              <small>${this._escape(e.routerState)}</small>
            </div>
            <div class="network-list">
              ${this._metricLine("mdi:wan", "WAN", e.routerState)}
              ${this._metricLine("mdi:account-group", "Clientes ativos", e.clients)}
              ${this._metricLine("mdi:account-multiple-outline", "Clientes totais", e.allClients)}
              ${this._metricLine("mdi:alert-circle-outline", "Alertas Unifi", e.alertState)}
            </div>
            <div class="panel-actions">
              <button type="button" data-network-action="archive-alerts">Arquivar alertas</button>
              <button type="button" data-network-action="zigbee-map">Mapa Zigbee</button>
            </div>
          </div>

          <div class="config-section">
            <div class="config-section-title">
              <span>Speedtest</span>
              <small>${this._escape(e.speedStatus)}</small>
            </div>
            <div class="network-speed">
              ${this._speedItem("Download", e.download, "Mbps")}
              ${this._speedItem("Upload", e.upload, "Mbps")}
            </div>
            <div class="panel-actions">
              <button type="button" data-network-action="refresh-speedtest">Atualizar</button>
            </div>
          </div>
        </div>
      </section>
    `;
  },
  handleAction({ target: o, hass: e } = {}) {
    const t = o?.dataset?.networkAction;
    return !t || t === "close" ? !1 : t === "archive-alerts" ? (e?.callService?.("input_button", "press", { entity_id: "input_button.unifi_archive_alerts" }), !0) : t === "refresh-speedtest" ? (e?.callService?.("homeassistant", "update_entity", { entity_id: ["sensor.speedtest_download", "sensor.speedtest_upload"] }), !0) : t === "zigbee-map" ? (globalThis.location.href = "/api/hassio_ingress/Ew2YSafnnerR2_NXuuOG-3KWDZvnNgFBSfdzoUmcR_Y/#/map", !0) : !1;
  },
  _model(o) {
    const e = o?.states || {}, t = [
      { entity: "sensor.unifi_office_ap", name: "Office" },
      { entity: "sensor.unifi_wall_ap", name: "Living Room" },
      { entity: "sensor.unifi_bedroom_ap", name: "Bedroom" }
    ].map((i) => ({
      ...i,
      state: this._state(e, i.entity),
      score: this._attr(e, i.entity, "score") || this._attr(e, i.entity, "Score") || "--"
    })), a = t.filter((i) => !["--", "off", "unavailable"].includes(String(i.state).toLowerCase())).length;
    return {
      aps: t,
      apStatus: `${a}/${t.length} online`,
      routerState: this._state(e, "binary_sensor.arris_tg3442de_wan_status"),
      clients: this._state(e, "sensor.unifi_controller_clients"),
      allClients: this._state(e, "sensor.unifi_controller_all_clients"),
      alertState: this._state(e, "binary_sensor.unifi_controller_alert"),
      download: this._state(e, "sensor.speedtest_download"),
      upload: this._state(e, "sensor.speedtest_upload"),
      speedStatus: `${this._state(e, "sensor.speedtest_download")} / ${this._state(e, "sensor.speedtest_upload")}`
    };
  },
  _apLine(o) {
    return `
      <div class="network-line">
        <bruno-icon icon="mdi:access-point"></bruno-icon>
        <span><strong>${this._escape(o.name)}</strong><small>${this._escape(o.entity)}</small></span>
        <em>${this._escape(o.score)}</em>
      </div>
    `;
  },
  _metricLine(o, e, t) {
    return `
      <div class="network-line">
        <bruno-icon icon="${this._escapeAttr(o)}"></bruno-icon>
        <span><strong>${this._escape(e)}</strong></span>
        <em>${this._escape(t || "--")}</em>
      </div>
    `;
  },
  _speedItem(o, e, t) {
    return `
      <div class="speed-item">
        <span>${this._escape(o)}</span>
        <strong>${this._escape(e || "--")}</strong>
        <small>${this._escape(t)}</small>
      </div>
    `;
  },
  _state(o, e, t = "--") {
    const a = o?.[e]?.state;
    return a && !["unknown", "unavailable", "none"].includes(String(a).toLowerCase()) ? a : t;
  },
  _attr(o, e, t) {
    const a = o?.[e]?.attributes?.[t];
    return a == null || ["unknown", "unavailable", "none"].includes(String(a).toLowerCase()) ? "" : a;
  },
  _escape(o) {
    return String(o ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  },
  _escapeAttr(o) {
    return this._escape(o).replace(/`/g, "&#96;");
  },
  _styles() {
    return `
      .network-panel { width: min(500px, calc(100vw - 124px)); max-height: min(74vh, 690px); display: flex; flex-direction: column; }
      /* No telefone o QR da shell usa 12px por lado. ANTERIOR (rollback): a
         largura global acima deixava a etapa de configurações mais estreita. */
      @media (max-width: 800px) {
        .network-panel { width: auto; max-width: none; }
      }
      .network-icon bruno-icon { --mdc-icon-size: 17px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.92); }
      .network-scroll { min-height: 0; overflow-y: auto; scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.22) transparent; }
      .network-scroll::-webkit-scrollbar { width: 6px; }
      .network-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.22); border-radius: 999px; }
      .network-list { display: grid; gap: 0; border-top: 1px solid rgba(255,255,255,0.08); }
      .network-line { min-height: 42px; display: grid; grid-template-columns: 24px minmax(0,1fr) auto; align-items: center; gap: 10px; border-bottom: 1px solid rgba(255,255,255,0.07); color: rgba(255,255,255,0.80); }
      .network-line bruno-icon { --mdc-icon-size: 16px; color: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.75); }
      .network-line span { min-width: 0; display: grid; gap: 3px; }
      .network-line strong { min-width: 0; font-size: 11px; font-weight: 780; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .network-line small { min-width: 0; font-size: 9px; color: rgba(255,255,255,0.44); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .network-line em { font-style: normal; font-size: 10px; font-weight: 800; color: rgba(255,255,255,0.86); }
      .network-speed { display: grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap: 10px; }
      .speed-item { min-height: 72px; display: grid; align-content: center; gap: 4px; padding: 12px; border-radius: var(--bruno-popup-inner-radius, 14px); background: var(--bruno-popup-inner-background, rgba(255,255,255,0.045)); border: var(--bruno-popup-inner-border, 1px solid rgba(255,255,255,0.08)); box-shadow: var(--bruno-popup-inner-shadow, none); -webkit-backdrop-filter: var(--bruno-popup-inner-filter, none); backdrop-filter: var(--bruno-popup-inner-filter, none); }
      .speed-item span { font-size: 10px; color: rgba(255,255,255,0.54); font-weight: 740; }
      .speed-item strong { font-size: 19px; line-height: 1; color: rgba(255,255,255,0.92); }
      .speed-item small { font-size: 9px; color: rgba(255,255,255,0.46); }
      .panel-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
      .panel-actions button { min-height: 30px; padding: 0 12px; border-radius: var(--bruno-popup-action-radius, 999px); border: var(--bruno-popup-inner-warm-border, 1px solid rgba(var(--bruno-liquid-warm-accent,255,214,10),0.28)); background: var(--bruno-popup-inner-warm-background, rgba(255,255,255,0.045)); box-shadow: var(--bruno-popup-inner-warm-shadow, none); -webkit-backdrop-filter: var(--bruno-popup-inner-filter, none); backdrop-filter: var(--bruno-popup-inner-filter, none); color: rgba(255,255,255,0.86); font: inherit; font-size: 10px; font-weight: 800; cursor: pointer; }
      .panel-actions button:hover { background: rgba(var(--bruno-liquid-warm-accent,255,214,10),0.14); }
    `;
  }
};
globalThis.BrunoNetworkPanel = Vr;
(() => {
  const o = "20260719-hybrid-light-icons-1", e = "/local/bruno-ui/assets/hybrid-icons/led-strip", t = "/local/bruno-ui/assets/hybrid-icons/pendant/v7", a = "M175 113 H74 C47 113 29 101 29 82 C29 63 45 47 74 47 H306", i = "M175 113 H280 C303 113 317 130 317 151 C317 170 303 184 280 184 H29", r = (p, d) => `${p}/${d}?v=${o}`, n = (p, d) => `<path class="${p}" pathLength="1" d="${d}"></path>`;
  function s({ active: p = !1 } = {}) {
    return `
      <span class="tpl-light-icon brunoHybridLight brunoHybridLed ${p ? "is-on" : "is-off"}" aria-hidden="true">
        <span class="brunoHybridLed__canvas">
          <img class="brunoHybridLed__layer brunoHybridLed__glow" src="${r(e, "led-strip-glow.png")}" alt="">
          <img class="brunoHybridLed__layer brunoHybridLed__frameOff" src="${r(e, "led-strip-frame-off.png")}" alt="">
          <img class="brunoHybridLed__layer brunoHybridLed__frameOn" src="${r(e, "led-strip-frame-on.png")}" alt="">
          <svg class="brunoHybridLed__rail" viewBox="0 0 360 210">
            ${n("brunoHybridLed__railBase", a)}
            ${n("brunoHybridLed__railBase", i)}
            ${n("brunoHybridLed__railRim", a)}
            ${n("brunoHybridLed__railRim", i)}
            ${n("brunoHybridLed__railDiffuser", a)}
            ${n("brunoHybridLed__railDiffuser", i)}
          </svg>
          <svg class="brunoHybridLed__trace" viewBox="0 0 360 210">
            ${n("brunoHybridLed__tracePath", a)}
            ${n("brunoHybridLed__tracePath", i)}
          </svg>
        </span>
      </span>
    `;
  }
  function l({ active: p = !1 } = {}) {
    return `
      <span class="tpl-light-icon brunoHybridLight brunoHybridPendant ${p ? "is-on" : "is-off"}" aria-hidden="true">
        <span class="brunoHybridPendant__canvas">
          <img class="brunoHybridPendant__layer brunoHybridPendant__off" src="${r(t, "pendant-off.png")}" alt="">
          <img class="brunoHybridPendant__layer brunoHybridPendant__on" src="${r(t, "pendant-on.png")}" alt="">
        </span>
      </span>
    `;
  }
  function c() {
    return `
      .brunoHybridLight {
        position: relative;
        display: block;
        width: 100%;
        height: 100%;
        overflow: visible;
        pointer-events: none;
        filter: none !important;
      }

      .light-tile.is-on .light-icon:has(.brunoHybridLight),
      .light-row.is-on .light-row-icon:has(.brunoHybridLight),
      .zl-tile.is-on .zl-icon:has(.brunoHybridLight) {
        filter: none;
      }

      .brunoHybridLed__canvas,
      .brunoHybridPendant__canvas {
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%) scale(var(--bruno-hybrid-light-scale));
        transform-origin: center;
        pointer-events: none;
      }

      .brunoHybridLed {
        --bruno-hybrid-light-scale: 0.105;
      }

      .light-icon .brunoHybridLed {
        --bruno-hybrid-light-scale: 0.16;
      }

      .light-row-icon .brunoHybridLed {
        --bruno-hybrid-light-scale: 0.095;
      }

      .brunoHybridLed__canvas {
        width: 280px;
        aspect-ratio: 360 / 210;
        isolation: isolate;
      }

      .brunoHybridLed__layer,
      .brunoHybridLed__rail,
      .brunoHybridLed__trace {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      }

      .brunoHybridLed__layer {
        object-fit: contain;
      }

      .brunoHybridLed__frameOff { z-index: 2; opacity: 1; }
      .brunoHybridLed__frameOn { z-index: 3; opacity: 0; }
      .brunoHybridLed__glow { z-index: 1; opacity: 0; }
      .brunoHybridLed__rail { z-index: 4; overflow: visible; }
      .brunoHybridLed__trace { z-index: 5; overflow: visible; opacity: 0; }

      .brunoHybridLed__rail path,
      .brunoHybridLed__trace path {
        fill: none;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      .brunoHybridLed__railBase {
        stroke: rgba(45,49,52,0.99);
        stroke-width: 18;
        filter:
          drop-shadow(0 5px 7px rgba(0,0,0,0.66))
          drop-shadow(0 0 1px rgba(255,245,226,0.34));
      }

      .brunoHybridLed__railRim {
        stroke: rgba(226,218,203,0.94);
        stroke-width: 13.2;
        filter:
          drop-shadow(0 1px 1px rgba(0,0,0,0.94))
          drop-shadow(0 0 1px rgba(255,246,229,0.66));
      }

      .brunoHybridLed__railDiffuser {
        stroke: rgba(184,175,160,0.96);
        stroke-width: 7.4;
        stroke-dasharray: 0.10 0.065;
        opacity: 0.96;
        filter:
          drop-shadow(0 1px 1px rgba(0,0,0,0.82))
          drop-shadow(0 0 1px rgba(245,230,205,0.38));
      }

      .brunoHybridLed.is-on .brunoHybridLed__frameOff { opacity: 0; }
      .brunoHybridLed.is-on .brunoHybridLed__frameOn { opacity: 1; }
      .brunoHybridLed.is-on .brunoHybridLed__glow { opacity: 0.76; }
      .brunoHybridLed.is-on .brunoHybridLed__trace { opacity: 1; }

      .brunoHybridLed.is-on .brunoHybridLed__railBase {
        stroke: rgba(67,53,36,0.96);
      }

      .brunoHybridLed.is-on .brunoHybridLed__railRim {
        stroke: rgba(235,218,190,0.72);
        filter:
          drop-shadow(0 1px 1px rgba(0,0,0,0.82))
          drop-shadow(0 0 2px rgba(255,219,158,0.44));
      }

      .brunoHybridLed.is-on .brunoHybridLed__railDiffuser {
        stroke: rgba(255,205,122,0.52);
        opacity: 0.72;
        filter: drop-shadow(0 0 2px rgba(255,199,105,0.64));
      }

      .brunoHybridLed__tracePath {
        stroke: #fff0c3;
        stroke-width: 5.2;
        filter:
          drop-shadow(0 0 3px rgba(255,240,195,0.98))
          drop-shadow(0 0 9px rgba(255,210,125,0.82))
          drop-shadow(0 0 16px rgba(255,208,116,0.32));
      }

      .brunoHybridPendant {
        --bruno-hybrid-light-scale: 0.12;
      }

      .light-icon .brunoHybridPendant {
        --bruno-hybrid-light-scale: 0.185;
      }

      .light-row-icon .brunoHybridPendant {
        --bruno-hybrid-light-scale: 0.105;
      }

      .brunoHybridPendant__canvas {
        width: 170px;
        height: 260px;
        overflow: hidden;
      }

      .brunoHybridPendant__layer {
        position: absolute;
        left: 0;
        top: 0;
        width: 230px;
        height: 260px;
        max-width: none;
        object-fit: fill;
        mix-blend-mode: screen;
        pointer-events: none;
        user-select: none;
        transition: opacity 320ms ease, filter 320ms ease;
      }

      .brunoHybridPendant__off { opacity: 0.9; }
      .brunoHybridPendant__on { opacity: 0; filter: brightness(0.96); }

      .brunoHybridPendant.is-on .brunoHybridPendant__off { opacity: 0.28; }
      .brunoHybridPendant.is-on .brunoHybridPendant__on {
        opacity: 1;
        filter: brightness(1);
      }
    `;
  }
  globalThis.BrunoHybridLightIcons = Object.freeze({
    renderLedStrip: s,
    renderPendant: l,
    styles: c
  });
})();
const pt = "bruno-sala-card", Qt = {
  room_group: "light.grupo_luzes_sala",
  room_toggle: "light.sala_switch_2",
  room_fallback_lights: ["light.sala_switch_1", "light.sala_switch_2"],
  active_sensor: "sensor.living_room_active",
  // ANTERIOR (rollback): semantic_sensor: 'sensor.sala_semantic_state',
  semantic_sensor: "sensor.sala_semantic_state_supervised",
  motion_recent: "binary_sensor.sala_motion_recent",
  occupancy: "binary_sensor.sala_occupancy",
  temperature: "sensor.sensor_4_in_1_sala_temperature",
  humidity: "sensor.sensor_4_in_1_sala_humidity",
  presence: "binary_sensor.sensor_4_in_1_sala_presence",
  illuminance: "sensor.sensor_4_in_1_sala_illuminance",
  tv: "media_player.smart_tv_pro_2",
  tv_media: "media_player.android_tv_192_168_3_17",
  climate: "climate.sl_ar_condicionado",
  speaker: "media_player.echo_show",
  spotify: "media_player.spotifyplus_bruno_helasio",
  corridor: "light.corredor_switch_1",
  corridor_motion_recent: "binary_sensor.corredor_motion_recent",
  corridor_occupancy: "binary_sensor.corredor_occupancy"
}, Xt = ["on", "playing", "paused", "idle", "buffering"], Br = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], Ur = ["cooling", "heating", "drying", "fan", "preheating"], Fr = ["off", "idle"], Jt = ["playing", "on", "paused"], Gr = 1200, Wr = 2500, et = Object.freeze({
  corridor: Object.freeze({ on: 880, off: 720, fade: 300 }),
  tv: Object.freeze({ on: 1120, off: 1020, fade: 0 }),
  climate: Object.freeze({ on: 780, off: 720, fade: 300 })
}), Zr = Object.freeze({
  corridor: Object.freeze({ glow: 6800 }),
  tv: Object.freeze({ glow: 5500 }),
  climate: Object.freeze({ glow: 4800, airflow: 2200 })
});
class L extends HTMLElement {
  constructor() {
    super(), this._hybridTransitions = /* @__PURE__ */ new Map(), this._hybridTimers = /* @__PURE__ */ new Map(), this._hybridTransitionToken = 0;
  }
  connectedCallback() {
    this._onBrunoThemeChanged || (this._onBrunoThemeChanged = () => {
      this._joshModeCache = void 0, this._render();
    }), globalThis.addEventListener?.("bruno-theme-changed", this._onBrunoThemeChanged), this._joshModeCache = void 0, this._config && this._render();
  }
  disconnectedCallback() {
    this._hybridTimers.forEach((e) => window.clearTimeout(e)), this._hybridTimers.clear(), globalThis.removeEventListener?.("bruno-theme-changed", this._onBrunoThemeChanged);
  }
  _themeJoshMode() {
    if (this._joshModeCache !== void 0) return this._joshModeCache;
    let e = "";
    try {
      e = getComputedStyle(this).getPropertyValue("--bruno-tile-mode").trim();
    } catch {
      e = "";
    }
    return this._joshModeCache = e === "on", this._joshModeCache;
  }
  _homeThemeClass() {
    return this._themeJoshMode() ? " is-josh-theme" : "";
  }
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    const t = {
      ...Qt,
      ...e?.entities || {}
    };
    this._config = {
      name: "Sala",
      navigation_path: "subview-sala",
      // NOVO (Etapa B): a Sala é SEÇÃO da shell. O chevron abre a seção #sala (sem
      // trocar de view). Se `section` for removido, volta a navegar p/ navigation_path.
      section: "sala",
      ...e,
      entities: t
    }, this._render();
  }
  set hass(e) {
    this._hass = e, this._render();
  }
  getCardSize() {
    return 4;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isUnavailable(e) {
    return !e || ["unknown", "unavailable", ""].includes(e.state);
  }
  _isAnyState(e, t) {
    return t.includes(this._state(e)?.state || "");
  }
  _roomEntityIds(e) {
    const t = e?.attributes?.entity_id;
    return Array.isArray(t) ? t : [];
  }
  _lightsSummary(e) {
    const t = this._config.entities, a = this._state(t.active_sensor), i = a?.attributes?.lights_on_count, r = a?.attributes?.lights_on;
    let n = null;
    if (i != null && i !== "" && !Number.isNaN(Number(i)))
      n = parseInt(i, 10);
    else if (Array.isArray(r))
      n = r.length;
    else if (typeof r == "string" && r.startsWith("[")) {
      const d = r.match(/'/g);
      d && (n = d.length / 2);
    }
    const s = this._roomEntityIds(e);
    n === null && s.length && (n = s.filter((d) => this._state(d)?.state === "on").length), n === null && (n = (Array.isArray(t.room_fallback_lights) ? t.room_fallback_lights : Qt.room_fallback_lights).filter((h) => this._state(h)?.state === "on").length);
    let l = null;
    if (s.forEach((d) => {
      const h = this._state(d);
      if (h?.state === "on" && h.last_changed) {
        const b = Date.parse(h.last_changed);
        !Number.isNaN(b) && (l === null || b < l) && (l = b);
      }
    }), l === null && e?.last_changed) {
      const d = Date.parse(e.last_changed);
      Number.isNaN(d) || (l = d);
    }
    const c = l !== null ? this._elapsed(Date.now() - l) : "", p = n === 1 ? "1 light" : `${n} lights`;
    return {
      count: n,
      elapsed: c,
      label: n > 0 ? `${p}${c ? ` / ${c}` : ""}` : ""
    };
  }
  _elapsed(e) {
    const t = e / 6e4, a = e / 36e5, i = e / 864e5;
    return t < 1 ? "<1m" : t < 60 ? `${parseInt(t, 10)}m` : a < 24 ? `${parseInt(a, 10)}h` : `${parseInt(i, 10)}d`;
  }
  _sensorValue(e, t = "") {
    const a = this._state(e);
    return this._isUnavailable(a) ? "&mdash;" : `${L._escape(a.state)}${t}`;
  }
  _presenceRecent() {
    return this._state(this._config.entities.motion_recent)?.state === "on";
  }
  _semanticLine() {
    const e = this._state(this._config.entities.semantic_sensor), t = String(e?.state || "").toLowerCase(), a = e?.attributes?.display;
    if (a && !["none", "unknown", "unavailable"].includes(t))
      return String(a).trim();
    const i = this._state(this._config.entities.motion_recent);
    return i && i.state !== "on" ? "" : this._state(this._config.entities.occupancy)?.state === "on" ? "Ocupada" : "";
  }
  _tvLabel(e) {
    return e ? e.state === "playing" ? "Reproduzindo" : e.state === "paused" ? "Pausado" : ["on", "idle"].includes(e.state) ? "Ligada" : "Desligada" : "Desligada";
  }
  _climateAction(e) {
    return String(e?.attributes?.hvac_action || "").toLowerCase();
  }
  _climateIsActive(e) {
    if (this._isUnavailable(e) || e.state === "off") return !1;
    const t = this._climateAction(e);
    return Ur.includes(t) ? !0 : Fr.includes(t) ? !1 : Br.includes(e?.state || "");
  }
  // A linha inferior representa se o climate esta habilitado, mesmo quando a
  // acao HVAC esta idle. O dot superior continua usando _climateIsActive().
  _climateIsEnabled(e) {
    return !this._isUnavailable(e) && e.state !== "off";
  }
  _getCorridorSemanticStatus() {
    const e = this._config.entities;
    return this._state(e.corridor_motion_recent)?.state === "on" ? "Presença detectada" : this._state(e.corridor_occupancy)?.state === "on" ? "Movimento recente" : null;
  }
  _semanticMediaValue(e) {
    if (typeof e != "string") return null;
    const t = e.trim();
    if (!t) return null;
    const a = t.toLowerCase();
    return ["unknown", "unavailable", "none", "null", "off", "idle"].includes(a) || /^(?:[a-z][a-z0-9+.-]*:\/\/|\/)/i.test(t) || /^[a-z][a-z0-9_-]*(?:\.[a-z0-9_-]+)+$/.test(t) || /^(media_player|sensor|switch|remote|input_[a-z_]+)\.[a-z0-9_]+$/i.test(t) ? null : t;
  }
  _getTvSemanticStatus(e, t) {
    if (!t) return null;
    const a = e?.attributes || {}, i = String(e?.state || "").toLowerCase(), n = [
      ...["playing", "paused", "buffering"].includes(i) ? [a.media_title, a.media_series_title] : [],
      a.app_name,
      a.source
    ];
    for (const s of n) {
      const l = this._semanticMediaValue(s);
      if (l) return l;
    }
    return "Em reprodução";
  }
  _translateHvacAction(e) {
    const t = String(e || "").toLowerCase();
    return {
      cooling: "Resfriando",
      heating: "Aquecendo",
      preheating: "Aquecendo",
      drying: "Desumidificando",
      fan: "Ventilando"
    }[t] || null;
  }
  _formatTargetTemperature(e) {
    if (e == null || e === "") return null;
    const t = Number(e);
    return Number.isFinite(t) ? String(t).replace(".", ",") : null;
  }
  _getAcSemanticStatus(e, t) {
    if (!t) return null;
    const a = this._formatTargetTemperature(e?.attributes?.temperature), i = this._translateHvacAction(this._climateAction(e));
    return a && i ? `${a}° · ${i}` : a ? `Ajustado em ${a}°` : i || "Climatização ativa";
  }
  _climateLabel(e) {
    if (this._climateAction(e) === "idle") return "Em espera";
    if (!this._climateIsActive(e)) return "Desligado";
    const a = e?.attributes?.temperature;
    return Number.isFinite(Number(a)) ? `${Number(a)}&deg;` : "Ligado";
  }
  _normalizeMediaDevice(e) {
    return String(e || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  _spotifyOnDevice(e) {
    const t = this._state(this._config.entities.spotify);
    if (!Jt.includes(t?.state || "")) return !1;
    const a = t?.attributes || {}, i = this._normalizeMediaDevice(e);
    return i ? [
      a.source,
      a.source_name,
      a.device_name,
      a.active_device_name,
      a.spotify_device_name,
      a.media_player,
      a.media_player_name
    ].some((r) => {
      const n = this._normalizeMediaDevice(r);
      return n && (n.includes(i) || i.includes(n));
    }) : !1;
  }
  _model() {
    const e = this._config.entities, t = this._state(e.room_group), a = this._state(e.tv), i = this._state(e.tv_media) || a, r = this._state(e.climate), n = this._state(e.corridor), s = t?.state === "on", l = String(a?.state || "").toLowerCase(), c = Xt.includes(l), p = this._climateIsActive(r), d = this._climateIsEnabled(r), h = Jt.includes(this._state(e.speaker)?.state || "") || this._spotifyOnDevice("Echo Show"), b = n?.state === "on", u = this._lightsSummary(t), g = [], f = this._semanticLine();
    return u.label && g.push(u.label), f && g.push(f), {
      roomOn: s,
      tvOn: c,
      climateOn: p,
      climateEnabled: d,
      speakerOn: h,
      corridorOn: b,
      presenceOn: this._presenceRecent(),
      temperature: this._sensorValue(e.temperature, "&deg;"),
      humidity: this._sensorValue(e.humidity, "%"),
      lights: u,
      statusLines: g,
      corridorSemanticStatus: this._getCorridorSemanticStatus(),
      tvSemanticStatus: this._getTvSemanticStatus(i, c),
      acSemanticStatus: this._getAcSemanticStatus(r, d),
      // ORIGINAL labels (rollback): mantidos para aria-label/tooltip futuro
      tvLabel: this._tvLabel(a),
      climateLabel: this._climateLabel(r),
      corridorLabel: b ? "Ligado" : "Desligado",
      // NOVO: labels compactos ON/OFF para command-state (mockup react)
      tvStateLabel: c ? "ON" : "OFF",
      // ANTERIOR (rollback): climateStateLabel: climateOn ? 'ON' : 'OFF',
      climateStateLabel: d ? "ON" : "OFF",
      corridorStateLabel: b ? "ON" : "OFF"
    };
  }
  _runAction(e, t) {
    const a = this._config.entities;
    if (e === "room") {
      if (t === "hold") {
        this._callService("light.turn_off", {}, { entity_id: a.room_group });
        return;
      }
      this._callService("light.toggle", {}, { entity_id: a.room_toggle });
      return;
    }
    if (e === "corridor") {
      if (t === "tap" && this._isActionCoolingDown(e)) return;
      if (t === "hold") {
        this._moreInfo(a.corridor);
        return;
      }
      this._toggleEntity(a.corridor);
      return;
    }
    if (e === "tv") {
      if (t === "tap" && this._isActionCoolingDown(e)) return;
      if (t === "hold") {
        this._moreInfo(a.tv);
        return;
      }
      const i = Xt.includes(String(this._state(a.tv)?.state || "").toLowerCase()) ? "media_player.turn_off" : "media_player.turn_on";
      this._callService(i, {}, { entity_id: a.tv });
      return;
    }
    if (e === "climate") {
      if (t === "tap" && this._isActionCoolingDown(e)) return;
      if (t === "hold") {
        this._moreInfo(a.climate);
        return;
      }
      const i = this._climateIsEnabled(this._state(a.climate)) ? "climate.turn_off" : "climate.turn_on";
      this._callService(i, {}, { entity_id: a.climate });
    }
  }
  _runRoomSubview() {
    globalThis.BrunoLiquidGlass?.feedback?.("tap");
    const e = this._config?.section;
    if (e) {
      this.dispatchEvent(new CustomEvent("ll-custom", {
        detail: { action: "fire-dom-event", bruno_section: e },
        bubbles: !0,
        composed: !0
      }));
      return;
    }
    this._navigate(this._config.navigation_path);
  }
  _isActionCoolingDown(e) {
    this._lastActionAt = this._lastActionAt || {};
    const t = Date.now(), a = this._lastActionAt[e] || 0, i = e === "climate" ? Wr : Gr;
    return t - a < i ? !0 : (this._lastActionAt[e] = t, !1);
  }
  _callService(e, t = {}, a = {}) {
    if (!this._hass || !e) return;
    const [i, r] = e.split(".");
    if (!i || !r) return;
    const n = { ...t };
    a?.entity_id != null && n.entity_id == null && (n.entity_id = a.entity_id), a?.area_id != null && n.area_id == null && (n.area_id = a.area_id), a?.device_id != null && n.device_id == null && (n.device_id = a.device_id), this._hass.callService(i, r, n, a);
  }
  _toggleEntity(e) {
    e && this._callService("homeassistant.toggle", {}, { entity_id: e });
  }
  _navigate(e) {
    if (!e) return;
    const t = this._resolveNavigationPath(e), a = e.startsWith("/") ? t : e;
    globalThis.BrunoLiquidGlass?.routeTransition?.(), this.dispatchEvent(new CustomEvent("hass-navigate", {
      detail: { path: a },
      bubbles: !0,
      composed: !0
    })), window.setTimeout(() => {
      !t || window.location?.pathname === t || (window.history?.pushState && window.history.pushState(null, "", t), window.dispatchEvent?.(new CustomEvent("location-changed", { detail: { replace: !1 } })));
    }, 80);
  }
  _resolveNavigationPath(e) {
    return e ? e.startsWith("/") ? e : `/${(window.location?.pathname || "").split("/").filter(Boolean)[0] || "ngocjohn-main"}/${e}` : "";
  }
  _moreInfo(e) {
    e && this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  _wireAction(e) {
    const t = e.dataset.actionKey;
    if (!t) return;
    let a = null, i = !1, r = !1;
    const n = 10;
    let s = null, l = 0, c = 0, p = !1;
    const d = () => {
      a && (window.clearTimeout(a), a = null);
    }, h = () => {
      d(), r = !1, p = !1, s = null, e.classList.remove("is-pressed");
    };
    e.addEventListener("pointerdown", (b) => {
      if (!(b.button != null && b.button !== 0)) {
        if (s !== null) {
          b.stopPropagation();
          return;
        }
        b.stopPropagation(), r = !0, i = !1, s = b.pointerId, l = b.clientX, c = b.clientY, p = !1, e.classList.add("is-pressed"), a = window.setTimeout(() => {
          !r || p || (i = !0, e.classList.add("is-hold-fired"), window.setTimeout(() => e.classList.remove("is-hold-fired"), 260), globalThis.BrunoLiquidGlass?.feedback?.("hold"), this._runAction(t, "hold"));
        }, 560);
      }
    }), e.addEventListener("pointermove", (b) => {
      if (!r || b.pointerId !== s) return;
      const u = Math.abs(b.clientX - l), g = Math.abs(b.clientY - c);
      u <= n && g <= n || (p = !0, d(), e.classList.remove("is-pressed"));
    }), e.addEventListener("pointerup", (b) => {
      if (b.pointerId !== s) {
        b.stopPropagation();
        return;
      }
      b.preventDefault(), b.stopPropagation();
      const u = r, g = p;
      h(), !(!u || g || i) && (globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._runAction(t, "tap"));
    }), e.addEventListener("click", (b) => {
      b.preventDefault(), b.stopPropagation();
    }), e.addEventListener("dblclick", (b) => {
      b.preventDefault(), b.stopPropagation();
    }), e.addEventListener("pointerleave", h), e.addEventListener("pointercancel", (b) => {
      b.pointerId === s && h();
    }), e.addEventListener("keydown", (b) => {
      b.key !== "Enter" && b.key !== " " || (b.preventDefault(), globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._runAction(t, "tap"));
    });
  }
  _wireRoomNavZone(e) {
    if (!e) return;
    let t = null, a = !1, i = !1;
    const r = 10;
    let n = null, s = 0, l = 0, c = !1;
    const p = () => {
      t && (window.clearTimeout(t), t = null);
    }, d = () => {
      p(), i = !1, c = !1, n = null, e.classList.remove("is-pressed");
    };
    e.addEventListener("pointerdown", (h) => {
      if (!(h.button != null && h.button !== 0)) {
        if (n !== null) {
          h.stopPropagation();
          return;
        }
        h.stopPropagation(), i = !0, a = !1, n = h.pointerId, s = h.clientX, l = h.clientY, c = !1, e.classList.add("is-pressed"), t = window.setTimeout(() => {
          !i || c || (a = !0, e.classList.add("is-hold-fired"), window.setTimeout(() => e.classList.remove("is-hold-fired"), 260), globalThis.BrunoLiquidGlass?.feedback?.("hold"), this._runAction("room", "hold"));
        }, 560);
      }
    }), e.addEventListener("pointermove", (h) => {
      if (!i || h.pointerId !== n) return;
      const b = Math.abs(h.clientX - s), u = Math.abs(h.clientY - l);
      b <= r && u <= r || (c = !0, p(), e.classList.remove("is-pressed"));
    }), e.addEventListener("pointerup", (h) => {
      if (h.pointerId !== n) {
        h.stopPropagation();
        return;
      }
      h.preventDefault(), h.stopPropagation();
      const b = i, u = c;
      d(), !(!b || u || a) && (e.classList.add("is-navigating"), window.setTimeout(() => e.classList.remove("is-navigating"), 420), window.setTimeout(() => this._runRoomSubview(), 90));
    }), e.addEventListener("click", (h) => {
      h.preventDefault(), h.stopPropagation();
    }), e.addEventListener("dblclick", (h) => {
      h.preventDefault(), h.stopPropagation();
    }), e.addEventListener("pointerleave", d), e.addEventListener("pointercancel", (h) => {
      h.pointerId === n && d();
    }), e.addEventListener("keydown", (h) => {
      h.key !== "Enter" && h.key !== " " || (h.preventDefault(), h.stopPropagation(), e.classList.add("is-navigating"), window.setTimeout(() => e.classList.remove("is-navigating"), 420), window.setTimeout(() => this._runRoomSubview(), 90));
    });
  }
  _statusDot(e, t, a, i) {
    return `
      <span class="status-dot tone-${i}${t ? " is-active" : ""}" title="${L._escape(a)}" aria-label="${L._escape(a)}">
        <bruno-icon icon="${e}"></bruno-icon>
      </span>
    `;
  }
  _statusLines(e) {
    return e.length ? e.map((t) => `<span>${L._escape(t)}</span>`).join("") : "";
  }
  _clearHybridTimer(e) {
    const t = this._hybridTimers.get(e);
    t !== void 0 && window.clearTimeout(t), this._hybridTimers.delete(e);
  }
  _scheduleHybridTransition(e, t) {
    if (this._clearHybridTimer(e), !t.phase || !t.until) return;
    const a = t.token, i = Math.max(0, t.until - Date.now()), r = window.setTimeout(() => this._advanceHybridTransition(e, a), i);
    this._hybridTimers.set(e, r);
  }
  _applyHybridDomState(e, t) {
    const a = this.shadowRoot?.querySelector(`[data-hybrid-key="${e}"]`);
    if (!a) return;
    const i = t.phase === "turning-off" ? !0 : t.active;
    a.classList.remove(
      "hybridIcon--on",
      "hybridIcon--off",
      "hybridIcon--turning-on",
      "hybridIcon--turning-off",
      "hybridIcon--settling-off"
    ), a.classList.add(i ? "hybridIcon--on" : "hybridIcon--off"), t.phase && a.classList.add(`hybridIcon--${t.phase}`), a.style.setProperty("--hybrid-transition-delay", "0ms");
  }
  _advanceHybridTransition(e, t) {
    const a = this._hybridTransitions.get(e);
    if (!a || a.token !== t) return;
    this._hybridTimers.delete(e);
    const i = et[e], r = Date.now();
    if (a.phase === "turning-off") {
      a.phase = "settling-off", a.startedAt = r, a.until = r + i.fade, a.token = ++this._hybridTransitionToken, this._applyHybridDomState(e, a), this._scheduleHybridTransition(e, a);
      return;
    }
    a.phase === "turning-on" && (e === "corridor" && (a.glowStartedAt = r), e === "climate" && (a.airflowStartedAt = r)), a.phase = "", a.startedAt = 0, a.until = 0, a.token = ++this._hybridTransitionToken, this._applyHybridDomState(e, a);
  }
  _normalizeHybridTransition(e, t, a) {
    if (!t.phase || a < t.until) return;
    const i = et[e];
    if (t.phase === "turning-off") {
      const r = t.until, n = r + i.fade;
      if (a < n) {
        t.phase = "settling-off", t.startedAt = r, t.until = n, t.token = ++this._hybridTransitionToken, this._scheduleHybridTransition(e, t);
        return;
      }
    }
    t.phase === "turning-on" && (e === "corridor" && (t.glowStartedAt = a), e === "climate" && (t.airflowStartedAt = a)), t.phase = "", t.startedAt = 0, t.until = 0, t.token = ++this._hybridTransitionToken, this._clearHybridTimer(e);
  }
  _hybridTransitionFor(e, t, a) {
    if (!this._hass)
      return { active: t, transition: "", elapsed: 0 };
    let i = this._hybridTransitions.get(e);
    i ? this._normalizeHybridTransition(e, i, a) : (i = {
      active: t,
      phase: "",
      startedAt: 0,
      until: 0,
      glowStartedAt: t ? a : 0,
      airflowStartedAt: t && e === "climate" ? a : 0,
      token: ++this._hybridTransitionToken
    }, this._hybridTransitions.set(e, i)), i.active !== t && (this._clearHybridTimer(e), i.active = t, i.phase = t ? "turning-on" : "turning-off", i.startedAt = a, i.until = a + et[e][t ? "on" : "off"], t && (i.glowStartedAt = e === "corridor" ? 0 : a, i.airflowStartedAt = e === "climate" ? 0 : i.airflowStartedAt), i.token = ++this._hybridTransitionToken, this._scheduleHybridTransition(e, i)), i.phase && !this._hybridTimers.has(e) && this._scheduleHybridTransition(e, i);
    const r = Zr[e], n = (s, l) => s && l ? Math.max(0, a - s) % l : 0;
    return {
      // ANTERIOR (rollback): active: visualOn,
      // `active` permanece sempre igual ao estado real da entidade; a classe
      // visual ON durante turning-off e derivada apenas da fase de transicao.
      active: i.active,
      transition: i.phase,
      elapsed: i.phase ? Math.max(0, a - i.startedAt) : 0,
      glowPhase: n(i.glowStartedAt, r.glow),
      airflowPhase: n(i.airflowStartedAt, r.airflow)
    };
  }
  // NOTA (2026-07-20): uso intencional do renderer plano (BrunoIcons.render),
  // mesma biblioteca de icones do resto do dashboard — HybridTvIcon/HybridAcIcon/
  // HybridLedStripIcon (linhas 87-179) ficam preservados sem uso, decisao do
  // usuario de nao usar os icones hibridos em PNG neste bloco.
  _hybridIcon(e, t) {
    const a = t === "ledstrip" ? "ledstrip" : t === "climate" ? "climate" : t === "light_flush" ? "light_flush" : "tv", i = globalThis.BrunoIcons?.render(a) || "";
    return `<span class="tpl-icon bruno-command-icon" data-bruno-device-icon="${a}">${i}</span>`;
  }
  _screenReaderStatus(e) {
    return String(e || "").replace(/°/g, " graus").replace(/\s*·\s*/g, ", ").trim();
  }
  /* ANTERIOR (rollback): icones SVG inline + subtitulo generico sempre renderizado.
    _actionButton(key, iconName, name, label, active, tone, options = {}) {
      const activeClass = active ? ' is-active' : '';
      const category = options.category || '';
  
      return `
        <button class="command-row icon-${iconName} tone-${tone}${activeClass}" type="button" data-action-key="${key}" aria-label="${BrunoSalaCard._escape(name)}">
          <span class="command-icon" aria-hidden="true">${BrunoSalaCard._tplIcon(iconName, { active, ...options })}</span>
          <span class="command-copy">
            <span class="command-name">${BrunoSalaCard._escape(name)}</span>
            <span class="command-category">${BrunoSalaCard._escape(category)}</span>
          </span>
          <span class="command-state">${label}</span>
        </button>
      `;
    }
    */
  _actionButton(e, t, a, i, r, n, s = {}) {
    const l = r ? " is-active" : "", c = s.semanticStatus || null, p = c ? " has-semantic-status" : "", d = s.ariaName || a, h = s.ariaState || (r ? "ligado" : "desligado"), b = [d, h];
    c && b.push(this._screenReaderStatus(c));
    const u = b.join(", "), g = this._hybridIcon(e, t, s.hybridTransition, s.now);
    return `
      <button class="command-row icon-${t} tone-${n}${l}" type="button" data-action-key="${e}" aria-label="${L._escape(u)}" aria-pressed="${r ? "true" : "false"}">
        <!-- ANTERIOR (rollback): class="command-icon is-hybrid" — a classe is-hybrid
             forcava color:inherit/filter:none (regra .command-icon.is-hybrid, ~linha
             1960), pensada para os icones PNG em camadas. Como o icone aqui e o
             vetor plano da BrunoIcons (nao mais o hibrido), essa regra cancelava a
             cor por tom de .command-row.icon-X.is-active .command-icon (~linha 1842),
             e o icone nunca mudava de cor entre ligado/desligado. -->
        <span class="command-icon" aria-hidden="true">${g}</span>
        <span class="command-copy${p}">
          <span class="command-name">${L._escape(a)}</span>
          ${c ? `<span class="command-category">${L._escape(c)}</span>` : ""}
        </span>
        <span class="command-state">${L._escape(i)}</span>
      </button>
    `;
  }
  _wireAssetFallback() {
    this.shadowRoot?.querySelectorAll(".room-asset").forEach((e) => {
      e.addEventListener("error", () => {
        e.closest(".room-icon")?.classList.add("has-image-error");
      }, { once: !0 });
    });
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._model(), t = e.roomOn ? " is-room-on" : "", a = e.statusLines.length > 1 ? " has-status-stack" : "", i = Date.now(), r = {
      corridor: this._hybridTransitionFor("corridor", e.corridorOn, i),
      tv: this._hybridTransitionFor("tv", e.tvOn, i),
      climate: this._hybridTransitionFor("climate", e.climateEnabled, i)
    };
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --button-radius: 14px;
          --accent: 150, 190, 255;
          --accent-blue: 96, 165, 250;
          --accent-purple: 167, 139, 250;
          --accent-cyan: 79, 172, 254;
          --accent-amber: 255, 153, 0;
          --text-main: rgba(245,250,255,0.96);
          --text-soft: rgba(255,255,255,0.40);
          --text-muted: rgba(255,255,255,0.52);
          --action-off-bg: var(--bruno-liquid-control-background, linear-gradient(180deg, rgba(255,255,255,0.12), rgba(255,255,255,0.045)));
          --action-off-border: rgba(255,255,255,0.18);
          --action-off-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.18), 0 10px 22px rgba(0,0,0,0.18));
          --action-name: rgba(255,255,255,0.82);
          --action-label: rgba(255,255,255,0.42);
          --dot-off-bg: rgba(255,255,255,0.075);
          --dot-off-border: rgba(255,255,255,0.14);
          --dot-off-icon: rgba(255,255,255,0.48);
          display: block;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 0;
          contain: layout style;
        }

        * {
          box-sizing: border-box;
          letter-spacing: 0;
        }

        .sala-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 0;
          padding: 12px 14px;
          color: var(--text-main);
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
            radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%),
            linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
            linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.27),
            0 0 24px rgba(110,150,210,0.055)
          );
          overflow: hidden;
        }

        .sala-card::before,
        .sala-card::after {
          content: "";
          position: absolute;
          pointer-events: none;
          z-index: 0;
        }

        .sala-card::before {
          inset: 1px;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .sala-card::after {
          inset: auto 16px 8px 16px;
          height: 1px;
          border-radius: 999px;
          background: var(--bruno-liquid-surface-bottom-line, linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent));
          opacity: var(--bruno-liquid-surface-bottom-line-opacity, 0);
        }

        .sala-card.is-room-on {
          --text-main: rgba(248,251,255,0.96);
          --text-soft: rgba(255,255,255,0.52);
          --text-muted: rgba(255,255,255,0.62);
          --action-off-bg:
            linear-gradient(180deg, rgba(255,255,255,0.16), rgba(255,255,255,0.055)),
            linear-gradient(155deg, rgba(30,38,50,0.42), rgba(12,15,22,0.24));
          --action-off-border: rgba(255,255,255,0.14);
          --action-off-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 0 -1px 0 rgba(0,0,0,0.12);
          --action-name: rgba(248,251,255,0.86);
          --action-label: rgba(255,255,255,0.46);
          --dot-off-bg: rgba(8,12,20,0.22);
          --dot-off-border: rgba(255,255,255,0.20);
          --dot-off-icon: rgba(255,255,255,0.66);
          background: var(--bruno-liquid-surface-on-background,
            radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.38), rgba(255,255,255,0.105) 52%, transparent 75%),
            radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.24), transparent 68%),
            radial-gradient(122px 96px at 27% 18%, rgba(255,232,126,0.105), transparent 71%),
            linear-gradient(180deg, rgba(255,255,255,0.225), rgba(255,255,255,0.073) 43%, rgba(255,255,255,0.108)),
            linear-gradient(155deg, rgba(42,51,65,0.72), rgba(23,28,38,0.58) 52%, rgba(13,16,24,0.44))
          );
          backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-on-filter, blur(34px) saturate(1.72) contrast(1.05));
          border-color: var(--bruno-liquid-surface-on-border-color, rgba(255,255,255,0.24));
          box-shadow: var(--bruno-liquid-surface-on-shadow,
            inset 0 1px 0 rgba(255,255,255,0.32),
            inset 1px 0 0 rgba(255,255,255,0.13),
            inset 0 -1px 0 rgba(0,0,0,0.18),
            0 0 22px rgba(255,255,255,0.09),
            0 0 34px rgba(120,170,235,0.10),
            0 18px 42px rgba(0,0,0,0.28)
          );
        }

        .sala-card.is-room-on::before {
          background: var(--bruno-liquid-surface-on-sheen,
            radial-gradient(92px 74px at 17% 0%, rgba(255,255,255,0.34), transparent 72%),
            radial-gradient(118px 110px at 96% 96%, rgba(120,178,245,0.22), transparent 74%),
            radial-gradient(80px 58px at 27% 18%, rgba(255,232,126,0.095), transparent 72%),
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 38%),
            linear-gradient(90deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 50%)
          );
          opacity: var(--bruno-liquid-surface-on-sheen-opacity, 0.78);
        }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .hero-action,
        .command-row {
          appearance: none;
          -webkit-appearance: none;
          outline: none;
          position: relative;
          z-index: 1;
        }

        /* --- ORIGINAL .hero-action (rollback rapido) ---
        .hero-action {
          flex: 1 1 auto;
          min-height: 142px;
          width: 100%;
          display: grid;
          grid-template-columns: 118px minmax(0, 1fr) 38px;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
          grid-template-areas:
            "icon space right"
            "icon space right"
            "title title right"
            "lights lights right";
          column-gap: 4px;
          row-gap: 0;
          align-items: start;
          padding: 0 0 16px;
          ...
        }
        --- FIM ORIGINAL --- */

        .hero-action {
          flex: 1 1 auto;
          min-height: 130px;
          width: 100%;
          display: grid;
          grid-template-columns: 124px minmax(0, 1fr) 40px;
          grid-template-rows: auto minmax(0, 1fr) auto auto;
          grid-template-areas:
            "icon space right"
            "icon space right"
            "title title right"
            "lights lights right";
          column-gap: 6px;
          row-gap: 0;
          align-items: start;
          padding: 0 0 8px;
          text-align: left;
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;
          transition:
            transform var(--bruno-liquid-motion-fast, 160ms ease),
            filter var(--bruno-liquid-motion-fast, 160ms ease);
        }

        .hero-action:hover {
          filter: brightness(1.05);
        }

        .hero-action.is-pressed,
        .command-row.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .hero-action.is-hold-fired,
        .command-row.is-hold-fired {
          filter: drop-shadow(0 0 18px rgba(var(--accent),0.28));
        }

        /* --- ORIGINAL .room-icon (rollback rapido) ---
        .room-icon {
          grid-area: icon;
          width: 116px;
          height: 116px;
          margin-left: -4px;
          margin-top: -3px;
        }
        --- FIM ORIGINAL --- */

        .room-icon {
          grid-area: icon;
          justify-self: start;
          align-self: start;
          width: 120px;
          height: 80px;
          margin-left: 0;
          margin-top: 1px;
          position: relative;
        }

        .room-asset-wrap,
        .room-asset-fallback,
        .room-asset {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
        }

        .room-asset-wrap {
          overflow: visible;
        }

        .room-asset {
          width: 94%;
          height: 94%;
          object-fit: contain;
          opacity: 0;
          transform: translateZ(0);
          filter: drop-shadow(0 6px 8px rgba(0,0,0,0.22));
          transition: opacity 420ms ease, filter 420ms ease, transform 420ms ease;
        }

        .room-asset-off {
          opacity: 1;
        }

        .sala-card.is-room-on .room-asset-off {
          opacity: 0;
        }

        .sala-card.is-room-on .room-asset-on {
          opacity: 1;
          filter: drop-shadow(0 6px 9px rgba(0,0,0,0.20)) drop-shadow(0 0 12px rgba(255,187,72,0.16));
          transform: translateY(-1px) scale(1.01);
        }

        .room-asset-fallback {
          opacity: 0;
          pointer-events: none;
        }

        .room-icon.has-image-error .room-asset {
          display: none;
        }

        .room-icon.has-image-error .room-asset-fallback {
          opacity: 1;
        }

        .metric {
          min-width: 36px;
          text-align: center;
          line-height: 1.1;
        }

        /* --- ORIGINAL .metric-value/.metric-sub 13.5/11.2px (rollback rapido) ---
        .metric-value {
          display: block;
          font-size: 13.5px;
          line-height: 1;
          font-weight: 760;
          color: var(--text-main);
        }

        .metric-sub {
          display: block;
          margin-top: 4px;
          font-size: 11.2px;
          line-height: 1;
          font-weight: 600;
          color: var(--text-muted);
        }
        --- FIM ORIGINAL --- */

        /* NOVO: paridade com Office (13px/11px) */
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

        .room-nav-zone {
          grid-column: 1 / 3;
          grid-row: 3 / 5;
          justify-self: start;
          align-self: end;
          position: relative;
          z-index: 4;
          min-width: 0;
          width: 100%;
          min-height: 48px;
          padding: 1px 24px 2px 0;
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
          gap: 7px;
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

        .room-chevron {
          flex: 0 0 auto;
          font-size: 22px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.56);
          transform: translateY(-1px);
          transition:
            color var(--bruno-liquid-motion-fast, 140ms ease),
            transform var(--bruno-liquid-motion-fast, 140ms ease),
            filter var(--bruno-liquid-motion-fast, 140ms ease);
        }

        .room-nav-zone.is-pressed .title,
        .room-nav-zone.is-pressed .lights-line {
          filter: brightness(1.13);
        }

        .room-nav-zone.is-pressed .room-chevron {
          color: rgba(255,255,255,0.96);
          transform: translate(2px, -1px);
          filter: drop-shadow(0 0 8px rgba(255,255,255,0.26));
        }

        .room-nav-zone.is-hold-fired .room-chevron {
          color: rgba(255,214,150,0.98);
          filter: drop-shadow(0 0 10px rgba(255,190,90,0.34));
        }

        .room-nav-zone.is-navigating .room-chevron {
          animation: brunoRoomChevronNavigate 360ms ease both;
        }

        @keyframes brunoRoomChevronNavigate {
          0% { transform: translate(0, -1px); }
          52% { transform: translate(5px, -1px); }
          100% { transform: translate(2px, -1px); }
        }

        .lights-line {
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
          max-height: 28px;
          padding-right: 4px;
        }

        /* --- ORIGINAL .lights-line span max-width (rollback) ---
        .lights-line span { max-width: 142px; }
        --- FIM ORIGINAL --- */

        .lights-line span {
          display: block;
          max-width: 158px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* --- ORIGINAL .right-rail translateX(2px) (rollback rapido) ---
        .right-rail {
          grid-area: right;
          justify-self: center;
          align-self: start;
          margin-right: 0;
          padding-top: 1px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 7px;
          transform: translateX(2px);
        }
        --- FIM ORIGINAL --- */

        /* NOVO: paridade de posicionamento com Office (translate(5px, -3px)) */
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

        .status-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        /* --- ORIGINAL .status-dot vidro fosco (rollback rapido) ---
        .status-dot {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          position: relative;
          color: var(--dot-off-icon);
          background: var(--dot-off-bg);
          border: 1px solid var(--dot-off-border);
          box-shadow: none;
          transition:
            background var(--bruno-liquid-motion-fast, 160ms ease),
            border-color var(--bruno-liquid-motion-fast, 160ms ease),
            color var(--bruno-liquid-motion-fast, 160ms ease),
            box-shadow var(--bruno-liquid-motion-fast, 160ms ease),
            transform var(--bruno-liquid-motion-fast, 160ms ease);
        }

        .status-dot.is-active {
          color: rgb(var(--tone));
          background:
            radial-gradient(17px 15px at 50% 44%, rgba(var(--tone),0.24), transparent 72%),
            rgba(6,10,18,0.28);
          border-color: rgba(var(--tone),0.60);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 8px rgba(var(--tone),0.34),
            0 0 18px rgba(var(--tone),0.24),
            0 0 30px rgba(var(--tone),0.12);
          transform: translateZ(0) scale(1.04);
        }

        .status-dot.is-active bruno-icon {
          filter: drop-shadow(0 0 5px rgba(var(--tone),0.56));
        }
        --- FIM ORIGINAL --- */

        /* --- ORIGINAL .status-dot flat colorido solido (rollback rapido) ---
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
            linear-gradient(135deg, rgba(255,255,255,0.20), rgba(0,0,0,0.16)),
            rgb(var(--tone));
          border: none;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.28),
            0 2px 6px rgba(0,0,0,0.25),
            0 0 12px rgba(var(--tone),0.35);
        }
        --- FIM ORIGINAL --- */

        /* NOVO: paridade com Office — padrao .nav-button.selected da barra fixa
           (fundo tonal translucido em gradiente, borda clara, icone branco, glow suave) */
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
            radial-gradient(circle at 50% 18%, rgba(255,255,255,0.30), transparent 62%),
            linear-gradient(180deg, rgba(var(--tone),0.68), rgba(var(--tone),0.40));
          border: 1px solid rgba(255,255,255,0.38);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.32),
            0 0 12px rgba(var(--tone),0.32);
          /* animation: brunoSalaDotIn 240ms ease; — removido: replay no hass() causava piscar */
        }

        @keyframes brunoSalaDotIn {
          from { opacity: 0; transform: scale(0.55); }
          to { opacity: 1; transform: scale(1); }
        }

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
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.28));
        }

        .sala-card.has-status-stack .lights-line {
          max-height: 25px;
          font-size: 10.6px;
          line-height: 1.08;
        }

        .tone-blue { --tone: var(--accent-blue); }
        .tone-purple { --tone: var(--accent-purple); }
        .tone-cyan { --tone: var(--accent-cyan); }
        .tone-amber { --tone: var(--accent-amber); }

        /* --- ORIGINAL .action-strip + .command-row (rollback rapido) ---
        .action-strip { padding: 0 1px 1px; }
        .command-row {
          height: 43px;
          grid-template-columns: 36px minmax(0,1fr) minmax(62px, auto);
          column-gap: 9px;
          padding: 0 8px 0 9px;
          border-radius: 12px;
          background: linear-gradient(...), rgba(5,8,13,0.03);
        }
        .command-row:not(:last-child)::after { background: linear-gradient(90deg, ...); }
        .command-row::before { top: 9px; bottom: 9px; }
        .command-row.is-active { background: radial-gradient(...) + ... }
        .command-row.is-active::before { box-shadow: 0 0 10px rgba(var(--tone),0.44), 0 0 20px rgba(var(--tone),0.18); }
        --- FIM ORIGINAL --- */

        .action-strip {
          position: relative;
          z-index: 1;
          flex: 0 0 auto;
          display: grid;
          grid-template-columns: 1fr;
          gap: 0;
          padding: 0;
        }

        /* --- ORIGINAL .command-row v1 (rollback rapido) ---
        grid-template-columns: 44px minmax(0,1fr) minmax(58px, auto);
        column-gap: 14px;
        padding: 0 6px 0 12px;
        --- FIM ORIGINAL --- */
        /* --- ORIGINAL .command-row v2 (rollback) ---
        column-gap: 10px;
        padding: 0 4px 0 8px;
        --- FIM ORIGINAL --- */

        .command-row {
          --command-accent: rgb(var(--tone));
          height: 60px;
          width: 100%;
          display: grid;
          grid-template-columns: 40px minmax(0, 1fr) 44px;
          grid-template-rows: 1fr;
          align-items: center;
          column-gap: 6px;
          padding: 0 4px 0 4px;
          margin: 0;
          text-align: left;
          color: var(--action-name);
          background: transparent;
          border: 0;
          border-radius: 0;
          box-shadow: none;
          overflow: visible;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          transition:
            background var(--bruno-liquid-motion-fast, 160ms ease),
            color var(--bruno-liquid-motion-fast, 160ms ease),
            transform var(--bruno-liquid-motion-fast, 160ms ease),
            filter var(--bruno-liquid-motion-fast, 160ms ease);
        }

        .command-row + .command-row {
          border-top: 1px solid rgba(255,255,255,0.105);
        }

        .command-row::before {
          content: "";
          position: absolute;
          left: -2px;
          top: 14px;
          bottom: 14px;
          width: 2px;
          border-radius: 999px;
          background: rgb(var(--tone));
          box-shadow: 0 0 0 rgba(var(--tone),0);
          opacity: 0;
          transform: scaleY(0.74);
          transition:
            opacity var(--bruno-liquid-motion-fast, 160ms ease),
            transform var(--bruno-liquid-motion-fast, 160ms ease);
        }

        /* NOVO: glow line inferior quando ativo (estilo mockup react .rail-line) */
        /* offsets ajustados v2: icone termina em 44px (padding 4 + col 40), state comeca em 48px (padding 4 + col 44) */
        .command-row::after {
          content: "";
          position: absolute;
          left: 46px;
          right: 46px;
          bottom: 0;
          height: 1px;
          background: linear-gradient(
            90deg,
            rgba(var(--tone), 0),
            rgba(var(--tone), 0.62),
            rgba(var(--tone), 0)
          );
          box-shadow: 0 0 10px rgba(var(--tone), 0.28);
          opacity: 0;
          transform: scaleX(0.72);
          transform-origin: left;
          transition:
            opacity 350ms ease,
            transform 350ms ease;
          pointer-events: none;
          z-index: 0;
        }

        .command-row.is-active::after {
          opacity: 1;
          transform: scaleX(1);
        }

        .command-row:hover {
          background: linear-gradient(90deg, rgba(255,255,255,0.045), rgba(255,255,255,0.014));
        }

        .command-row.is-active {
          background: transparent;
        }

        .command-row.is-active::before {
          opacity: 1;
          transform: scaleY(1);
          animation: brunoSalaRailPulse 2.4s ease-in-out infinite;
        }

        @keyframes brunoSalaRailPulse {
          0%, 100% {
            opacity: 0.78;
            box-shadow:
              0 0 10px rgba(var(--tone),0.62),
              0 0 24px rgba(var(--tone),0.26);
          }
          50% {
            opacity: 1;
            box-shadow:
              0 0 12px rgba(var(--tone),0.95),
              0 0 32px rgba(var(--tone),0.48);
          }
        }

        /* --- ORIGINAL .command-icon (rollback) --- width/height 30px --- */
        .command-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(245,240,232,0.58);
          filter: drop-shadow(0 3px 8px rgba(0,0,0,0.24));
          transform: scale(0.96);
          transition:
            color 320ms ease,
            filter 320ms ease,
            transform 320ms ease,
            opacity 320ms ease;
        }

        .command-row.is-active .command-icon {
          transform: scale(1.04);
        }

        .command-copy {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 4px;
          line-height: 1;
        }

        /* ANTERIOR (rollback): color: var(--state-icon-active-color, #f0c040);
           --state-icon-active-color e uma custom property herdada do DOM externo
           (fora do shadow root deste card) — no card da Sala (view principal,
           dentro do grid/stack-in-card) ela resolve para um azul vindo de um
           ancestral; nas subviews (componente isolado) essa herança nao existe e
           o fallback #f0c040 e usado, por isso so aqui aparecia azul. Corrigido
           para usar --tone local (mesmo padrao ja usado por icon-tv/icon-climate
           abaixo), que nao depende de heranca externa. */
        .command-row.icon-light_flush.is-active .command-icon {
          color: rgb(var(--tone));
        }

        .command-row.icon-tv.is-active .command-icon {
          color: rgb(var(--tone));
        }

        .command-row.icon-climate.is-active .command-icon {
          color: rgb(var(--tone));
        }

        .command-row.is-active .command-icon {
          filter:
            drop-shadow(0 1px 2px rgba(0,0,0,0.18))
            drop-shadow(0 0 8px rgba(var(--tone),0.32));
        }

        /* NOVO: espessura optica — mesma espessura VISUAL (em px de tela) dos
           icones da rail (bento-sidebar-card.js: 19px de exibicao, stroke-width
           1.55 => ~1.227px na tela). Como o icone aqui e exibido bem maior
           (40px), o stroke-width em unidades de viewBox precisa ser BEM menor
           para que o traco pareca do mesmo peso fino: 1.227 * 24/40 ≈ 0.74.
           Repetido dentro dos 2 media queries abaixo (34px e 30px) com o valor
           recalculado para cada tamanho — sem isso o traco engrossa visualmente
           conforme o icone cresce. CSS sempre vence o atributo de apresentacao
           stroke-width="1.5" embutido no corpo do svg da Hugeicons, entao isso
           e seguro e fica restrito a este card. O icone led-strip usa
           <g transform="scale(0.75)"> internamente, entao recebe o valor ja
           dividido por 0.75 para compensar. */
        .command-icon svg g,
        .command-icon svg path {
          stroke-width: 0.74;
        }

        /* ANTERIOR (obsoleto, 2026-07-20): compensacao so fazia sentido para o
           icone customizado led-strip, que tinha <g transform="scale(0.75)">
           interno. O icone foi trocado para hugeicons:bulb (sem transform),
           entao a regra geral acima ja se aplica corretamente sem compensacao.
        .command-icon [data-bruno-device-icon="ledstrip"] svg path {
          stroke-width: 0.98;
        }
        --- FIM ANTERIOR --- */

        /* --- ORIGINAL .command-name / .command-category / .command-state (rollback) ---
        font-size 12 / 10.4 / 10; weight 680/560/720; state max-width 68px sem border-left
        --- FIM ORIGINAL --- */

        .command-name {
          min-width: 0;
          font-size: 14px;
          line-height: 1.05;
          font-weight: 500;
          letter-spacing: -0.2px;
          color: rgba(255,255,255,0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s ease, text-shadow 0.3s ease;
        }

        .command-row.is-active .command-name {
          color: rgba(255,255,255,0.96);
          text-shadow: 0 0 10px rgba(255,255,255,0.08);
        }

        /* --- ORIGINAL .command-category v1 (rollback): font-size 11px --- */
        .command-category {
          min-width: 0;
          text-align: left;
          font-size: 10.5px;
          line-height: 1;
          font-weight: 400;
          color: rgba(255,255,255,0.45);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition: color 0.3s ease;
        }

        .command-row.is-active .command-category {
          color: rgba(210,236,255,0.60);
        }

        /* --- ORIGINAL .command-state v1 (rollback) ---
        justify-self: end; max-width: 56px; padding-left: 12px;
        Problema: largura variavel ON/OFF deslocava border-left.
        --- FIM ORIGINAL --- */

        .command-state {
          width: 100%;
          padding-left: 10px;
          border-left: 1px solid rgba(255,255,255,0.11);
          text-align: right;
          font-size: 11px;
          line-height: 1;
          font-weight: 600;
          letter-spacing: 1.1px;
          color: rgba(255,255,255,0.36);
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          transition:
            color 0.3s ease,
            text-shadow 0.3s ease,
            border-color 0.3s ease;
        }

        .command-row.is-active .command-state {
          color: rgba(92,194,255,0.98);
          text-shadow:
            0 0 10px rgba(45,170,255,0.42),
            0 0 22px rgba(45,170,255,0.16);
          border-left-color: rgba(120,205,255,0.20);
        }

        /* --- ORIGINAL is-active overrides (rollback) ---
        .command-row.is-active .command-name { color: var(--action-name); }
        .command-row.is-active .command-category { color: rgba(255,255,255,0.58); }
        .command-row.is-active .command-state {
          color: rgba(var(--tone),0.98);
          filter: drop-shadow(0 0 7px rgba(var(--tone),0.25));
        }
        --- FIM ORIGINAL --- */

        .tpl-icon,
        .tpl-icon svg {
          display: block;
          width: 100%;
          height: 100%;
        }

        .tpl-icon svg {
          overflow: visible;
        }

        /* Icones hibridos premium — port visual literal dos pacotes aprovados.
           O canvas canonico inteiro e escalado como unidade para preservar
           strokes, sombras, glows e proporcoes internas no tamanho compacto. */
        .command-icon.is-hybrid,
        .command-row.is-active .command-icon.is-hybrid {
          color: inherit;
          filter: none;
          transform: none;
          overflow: visible;
          pointer-events: none;
        }

        .command-copy:not(.has-semantic-status) {
          justify-content: center;
          gap: 0;
        }

        .command-row.icon-light_flush.is-active .command-state,
        .command-row.icon-tv.is-active .command-state {
          color: rgba(238,201,139,0.98);
          text-shadow:
            0 0 10px rgba(238,201,139,0.42),
            0 0 22px rgba(238,201,139,0.16);
          border-left-color: rgba(238,201,139,0.20);
        }

        .command-row.icon-climate.is-active .command-state {
          color: rgba(111,224,241,0.98);
          text-shadow:
            0 0 10px rgba(111,224,241,0.42),
            0 0 22px rgba(111,224,241,0.16);
          border-left-color: rgba(111,224,241,0.20);
        }

        .hybridIcon {
          position: relative;
          display: block;
          width: var(--hybrid-size, 42px);
          height: var(--hybrid-size, 42px);
          flex: 0 0 auto;
          isolation: isolate;
          overflow: visible;
          border: 0;
          background: none;
          pointer-events: none;
        }

        .tvHybrid__canvas,
        .acHybrid__canvas,
        .ledHybrid__canvas {
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%) scale(var(--hybrid-scale));
          transform-origin: center;
          isolation: isolate;
          pointer-events: none;
        }

        /* TV v3 — glow -> screen -> clip/wash/OLED -> frame OFF -> frame ON. */
        .tvHybrid__canvas {
          width: 250px;
          aspect-ratio: 475 / 300;
        }

        .tvHybrid__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 320ms ease;
        }

        .tvHybrid__frameOff { opacity: 1; z-index: 4; }
        .tvHybrid__frameOn { opacity: 0; z-index: 5; }
        .tvHybrid__screenOn { opacity: 0; z-index: 1; }
        .tvHybrid__screenGlow { opacity: 0; z-index: 0; }

        .tvHybrid.hybridIcon--on .tvHybrid__frameOff { opacity: 0; }
        .tvHybrid.hybridIcon--on .tvHybrid__frameOn { opacity: 1; }
        .tvHybrid.hybridIcon--on .tvHybrid__screenOn { opacity: 1; }

        .tvHybrid.hybridIcon--on .tvHybrid__screenGlow {
          opacity: 0.65;
          animation: tvHybridGlowBreath 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvHybrid__screenClip {
          position: absolute;
          left: 7.37%;
          top: 11.33%;
          width: 85.47%;
          height: 70.33%;
          overflow: hidden;
          z-index: 3;
          pointer-events: none;
        }

        .tvHybrid__oledLine {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 1px;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(255,255,255,0.85) 18%,
            #fff 50%,
            rgba(255,255,255,0.85) 82%,
            transparent 100%
          );
          box-shadow:
            0 0 5px rgba(255,255,255,0.88),
            0 0 12px rgba(238,201,139,0.52);
          opacity: 0;
        }

        .tvHybrid__screenWash {
          position: absolute;
          inset: 0;
          opacity: 0;
          background:
            radial-gradient(circle at 50% 22%, rgba(239,198,128,0.18), transparent 54%),
            linear-gradient(180deg, rgba(90,69,43,0.12), rgba(35,29,21,0.03));
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__frameOff {
          animation: tvHybridFrameOffWake 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__frameOn,
        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenOn {
          animation: tvHybridLayerOnWake 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__oledLine {
          animation: tvHybridOledOpen 900ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenWash {
          animation: tvHybridScreenWake 900ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__oledLine {
          animation: tvHybridOledClose 820ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenWash {
          animation: tvHybridScreenSleep 820ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--settling-off .tvHybrid__frameOff {
          animation: tvHybridFrameOffSettle 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--settling-off .tvHybrid__frameOn,
        .tvHybrid.hybridIcon--settling-off .tvHybrid__screenOn {
          animation: tvHybridLayerOnSettle 320ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes tvHybridOledOpen {
          0% {
            width: 0;
            opacity: 0;
            transform: translate(-50%, -50%) scaleY(0.7);
          }
          16% { width: 2%; opacity: 1; }
          62% { width: 100%; opacity: 1; }
          82% { width: 100%; opacity: 0.5; }
          100% { width: 100%; opacity: 0; }
        }

        @keyframes tvHybridFrameOffWake {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvHybridLayerOnWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvHybridScreenWake {
          0%, 45% { opacity: 0; }
          72% { opacity: 0.45; }
          100% { opacity: 1; }
        }

        @keyframes tvHybridOledClose {
          0% { width: 100%; opacity: 0; }
          18% { width: 100%; opacity: 1; }
          70% { width: 3%; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }

        @keyframes tvHybridScreenSleep {
          0% { opacity: 1; }
          52% { opacity: 0.24; }
          100% { opacity: 0; }
        }

        @keyframes tvHybridGlowBreath {
          0%, 100% { opacity: 0.42; transform: scale(1); }
          50% { opacity: 0.68; transform: scale(1.012); }
        }

        @keyframes tvHybridFrameOffSettle {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvHybridLayerOnSettle {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* A/C v5 — glow -> airflow (cinco curvas) -> frames -> calha. */
        .acHybrid__canvas {
          width: 250px;
          aspect-ratio: 439 / 318;
        }

        .acHybrid__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 300ms ease;
        }

        .acHybrid__frameOff { opacity: 1; z-index: 4; }
        .acHybrid__frameOn { opacity: 0; z-index: 5; }
        .acHybrid__glow { opacity: 0; z-index: 0; }
        .acHybrid__airflow { opacity: 0; z-index: 2; transform: translateY(-10px); }

        .acHybrid.hybridIcon--on .acHybrid__frameOff { opacity: 0; }
        .acHybrid.hybridIcon--on .acHybrid__frameOn { opacity: 1; }

        .acHybrid.hybridIcon--on .acHybrid__glow {
          opacity: 0.62;
          animation: acHybridGlowBreath 4.8s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .acHybrid.hybridIcon--on .acHybrid__airflow {
          opacity: 1;
          animation: acHybridAirflowLoop 2.2s ease-in-out infinite;
          animation-delay: var(--hybrid-airflow-delay);
        }

        .acHybrid__outletLine {
          position: absolute;
          left: 16%;
          top: 50.5%;
          width: 68%;
          height: 2px;
          border-radius: 999px;
          background: linear-gradient(90deg, transparent, rgba(111,224,241,0.95), transparent);
          box-shadow: 0 0 8px rgba(111,224,241,0.58);
          opacity: 0;
          transform: scaleX(0.15);
          transform-origin: center;
          z-index: 6;
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__frameOff {
          animation: acHybridFrameOffWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__frameOn {
          animation: acHybridLayerOnWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__outletLine {
          animation: acHybridOutletOn 760ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-on .acHybrid__airflow {
          animation: acHybridAirflowWake 760ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-off .acHybrid__outletLine {
          animation: acHybridOutletOff 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--turning-off .acHybrid__airflow {
          animation: acHybridAirflowSleep 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--on:not(.hybridIcon--turning-on) .acHybrid__outletLine {
          opacity: 1;
          transform: scaleX(1);
        }

        .acHybrid.hybridIcon--settling-off .acHybrid__frameOff {
          animation: acHybridFrameOffSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .acHybrid.hybridIcon--settling-off .acHybrid__frameOn {
          animation: acHybridLayerOnSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes acHybridOutletOn {
          0%, 28% { opacity: 0; transform: scaleX(0.12); }
          62% { opacity: 1; transform: scaleX(1); }
          100% { opacity: 1; transform: scaleX(1); }
        }

        @keyframes acHybridFrameOffWake {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes acHybridLayerOnWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes acHybridAirflowWake {
          0%, 42% { opacity: 0; transform: translateY(-16px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        @keyframes acHybridOutletOff {
          0% { opacity: 1; transform: scaleX(1); }
          54% { opacity: 0.4; transform: scaleX(0.55); }
          100% { opacity: 0; transform: scaleX(0.12); }
        }

        @keyframes acHybridAirflowSleep {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(12px); }
        }

        @keyframes acHybridAirflowLoop {
          0%, 100% { opacity: 0.48; transform: translateY(-2px); }
          50% { opacity: 0.95; transform: translateY(5px); }
        }

        @keyframes acHybridGlowBreath {
          0%, 100% { opacity: 0.38; transform: scale(1); }
          50% { opacity: 0.64; transform: scale(1.01); }
        }

        @keyframes acHybridFrameOffSettle {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes acHybridLayerOnSettle {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* LED Strip v7 — mesmo SVG na transicao e no estado ON final. */
        .ledHybrid {
          --led-hybrid-hot: #fff0c3;
        }

        .ledHybrid__canvas {
          width: 280px;
          aspect-ratio: 360 / 210;
        }

        .ledHybrid__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 300ms ease;
        }

        .ledHybrid__frameOff { opacity: 1; z-index: 4; }
        .ledHybrid__frameOn { opacity: 0; z-index: 5; }
        .ledHybrid__glow { opacity: 0; z-index: 1; }
        .ledHybrid__lightFinal { opacity: 0; z-index: 6; }

        .ledHybrid.hybridIcon--on .ledHybrid__frameOff { opacity: 0; }
        .ledHybrid.hybridIcon--on .ledHybrid__frameOn { opacity: 1; }

        .ledHybrid.hybridIcon--on .ledHybrid__glow {
          opacity: 0.76;
          animation: ledHybridGlowBreath 6.8s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .ledHybrid__trace {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          z-index: 7;
          overflow: visible;
          pointer-events: none;
          opacity: 0;
        }

        .ledHybrid__trace path {
          fill: none;
          stroke: var(--led-hybrid-hot);
          stroke-width: 4.2;
          stroke-linecap: round;
          stroke-linejoin: round;
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          filter:
            drop-shadow(0 0 3px rgba(255,240,195,0.98))
            drop-shadow(0 0 9px rgba(255,210,125,0.82))
            drop-shadow(0 0 16px rgba(255,208,116,0.32));
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__frameOff {
          animation: ledHybridFrameOffWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__frameOn {
          animation: ledHybridLayerOnWake 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__trace {
          opacity: 1;
        }

        .ledHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .ledHybrid__trace path {
          stroke-dashoffset: 0;
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__traceA,
        .ledHybrid.hybridIcon--turning-on .ledHybrid__traceB {
          animation: ledHybridTraceOn 860ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-off .ledHybrid__traceA,
        .ledHybrid.hybridIcon--turning-off .ledHybrid__traceB {
          stroke-dashoffset: 0;
          animation: ledHybridTraceOff 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-on .ledHybrid__glow {
          animation: ledHybridGlowOn 860ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--turning-off .ledHybrid__glow {
          animation: ledHybridGlowOff 700ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--settling-off .ledHybrid__frameOff {
          animation: ledHybridFrameOffSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .ledHybrid.hybridIcon--settling-off .ledHybrid__frameOn {
          animation: ledHybridLayerOnSettle 300ms ease forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes ledHybridTraceOn {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }

        @keyframes ledHybridFrameOffWake {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes ledHybridLayerOnWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ledHybridTraceOff {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: 1; }
        }

        @keyframes ledHybridGlowOn {
          0%, 36% { opacity: 0; }
          72% { opacity: 0.48; }
          100% { opacity: 0.76; }
        }

        @keyframes ledHybridGlowOff {
          0% { opacity: 0.76; }
          100% { opacity: 0; }
        }

        @keyframes ledHybridGlowBreath {
          0%, 100% { opacity: 0.58; transform: scale(1); }
          50% { opacity: 0.80; transform: scale(1.006); }
        }

        @keyframes ledHybridFrameOffSettle {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes ledHybridLayerOnSettle {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        /* DASHBOARD EDITION PREMIUM ---------------------------------------
           O master aprovado continua intacto. Esta camada faz a correcao
           optica necessaria em 32-46px: silhueta primeiro, material depois e
           emissao apenas no ON. Nao cria fundo, mini-card ou segundo botao. */
        .ledHybrid { --premium-halo: 255, 204, 125; }
        .tvHybrid { --premium-halo: 238, 201, 139; }
        .acHybrid { --premium-halo: 111, 224, 241; }

        /* A assinatura cromatica da linha acompanha o proprio objeto premium,
           eliminando o rail azul/roxo herdado dos glifos vetoriais antigos. */
        .command-row.icon-light_flush { --tone: 255, 204, 125; }
        .command-row.icon-tv { --tone: 238, 201, 139; }
        .command-row.icon-climate { --tone: 111, 224, 241; }

        .hybridIcon::before {
          content: "";
          position: absolute;
          left: 50%;
          top: 53%;
          width: 94%;
          height: 58%;
          transform: translate(-50%, -50%);
          border-radius: 50%;
          background: radial-gradient(ellipse, rgba(4,6,10,0.72), rgba(4,6,10,0.30) 43%, transparent 74%);
          filter: blur(2.4px);
          opacity: 0.58;
          z-index: 0;
          pointer-events: none;
          transition: opacity 300ms ease, filter 300ms ease, background 300ms ease;
        }

        .sala-card.is-room-on .hybridIcon--off::before {
          opacity: 0.82;
          filter: blur(2px);
        }

        .hybridIcon--on::before {
          width: 112%;
          height: 82%;
          background: radial-gradient(ellipse, rgba(var(--premium-halo),0.42), rgba(var(--premium-halo),0.15) 42%, transparent 73%);
          filter: blur(4px);
          opacity: 0.88;
        }

        .tvHybrid__canvas,
        .acHybrid__canvas,
        .ledHybrid__canvas {
          z-index: 1;
        }

        /* TV: vidro fumê com aro champagne. A massa escura ancora a silhueta
           em fundos claros; o aro e o specular preservam leitura em fundos escuros. */
        .tvHybrid__screenClip {
          border-radius: 3px;
          background:
            radial-gradient(circle at 32% 18%, rgba(255,255,255,0.14), transparent 28%),
            linear-gradient(155deg, rgba(47,52,57,0.96), rgba(13,15,19,0.98) 54%, rgba(4,5,8,0.99));
          box-shadow:
            inset 0 0 0 1px rgba(242,229,207,0.48),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -2px 6px rgba(0,0,0,0.58),
            0 1px 2px rgba(0,0,0,0.72);
          transition: background 320ms ease, box-shadow 320ms ease;
        }

        .sala-card.is-room-on .tvHybrid.hybridIcon--off .tvHybrid__screenClip {
          background:
            radial-gradient(circle at 30% 16%, rgba(255,255,255,0.12), transparent 25%),
            linear-gradient(155deg, rgba(40,43,47,0.99), rgba(8,10,13,0.99) 58%, #020305);
          box-shadow:
            inset 0 0 0 1px rgba(255,232,191,0.68),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -2px 6px rgba(0,0,0,0.68),
            0 1px 3px rgba(0,0,0,0.84);
        }

        .tvHybrid__frameOff {
          filter:
            brightness(1.22)
            contrast(1.16)
            drop-shadow(0 1px 1px rgba(0,0,0,0.88))
            drop-shadow(0 0 1px rgba(255,238,207,0.48));
        }

        .tvHybrid__frameOn {
          filter:
            contrast(1.08)
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 4px rgba(238,201,139,0.74));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          background:
            radial-gradient(circle at 46% 20%, rgba(255,224,170,0.38), transparent 48%),
            linear-gradient(180deg, rgba(72,50,25,0.62), rgba(16,13,11,0.76));
          box-shadow:
            inset 0 0 0 1px rgba(255,222,167,0.88),
            inset 0 1px 0 rgba(255,255,255,0.34),
            inset 0 -3px 8px rgba(26,13,3,0.42),
            0 0 8px rgba(238,201,139,0.56),
            0 2px 3px rgba(0,0,0,0.78);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background:
            radial-gradient(circle at 42% 18%, rgba(255,223,169,0.42), transparent 52%),
            linear-gradient(180deg, rgba(126,81,31,0.28), rgba(35,22,10,0.08));
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenWash {
          opacity: 0.86;
        }

        /* A/C: corpo grafite sob o frame original. O frame continua sendo a
           fonte de geometria/indicador; o corpo adiciona densidade de produto. */
        .acHybrid__canvas::before {
          content: "";
          position: absolute;
          left: 9.4%;
          top: 14.2%;
          width: 81.2%;
          height: 38.8%;
          border-radius: 17px 17px 9px 9px;
          background:
            radial-gradient(circle at 28% 8%, rgba(255,255,255,0.18), transparent 30%),
            linear-gradient(180deg, rgba(58,63,68,0.98), rgba(19,22,27,0.99) 58%, rgba(6,8,11,0.99));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.20),
            inset 0 -5px 12px rgba(0,0,0,0.48),
            0 5px 10px rgba(0,0,0,0.54);
          z-index: 1;
          transition: background 300ms ease, box-shadow 300ms ease;
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--off .acHybrid__canvas::before {
          background:
            radial-gradient(circle at 28% 8%, rgba(255,255,255,0.15), transparent 28%),
            linear-gradient(180deg, rgba(47,51,56,0.99), rgba(12,15,19,0.99) 60%, rgba(3,5,8,0.99));
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -5px 12px rgba(0,0,0,0.58),
            0 5px 12px rgba(0,0,0,0.68);
        }

        .acHybrid__frameOff {
          filter:
            brightness(1.12)
            contrast(1.16)
            drop-shadow(0 1px 1px rgba(0,0,0,0.88))
            drop-shadow(0 0 1px rgba(244,234,217,0.46));
        }

        .acHybrid__frameOn {
          filter:
            contrast(1.10)
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 5px rgba(111,224,241,0.76));
        }

        .acHybrid.hybridIcon--on .acHybrid__canvas::before {
          background:
            radial-gradient(circle at 28% 8%, rgba(210,252,255,0.20), transparent 30%),
            linear-gradient(180deg, rgba(23,51,57,0.99), rgba(6,23,28,0.99) 58%, rgba(2,8,11,0.99));
          box-shadow:
            inset 0 1px 0 rgba(206,251,255,0.25),
            inset 0 -5px 12px rgba(0,10,13,0.62),
            0 0 10px rgba(111,224,241,0.34),
            0 5px 10px rgba(0,0,0,0.58);
        }

        /* LED: trilho grafite + filete metálico no OFF. O trace aprovado
           permanece acima e transforma o mesmo objeto em luz no ON. */
        .ledHybrid__rail {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
          z-index: 6;
          pointer-events: none;
        }

        .ledHybrid__rail path {
          fill: none;
          stroke-linecap: round;
          stroke-linejoin: round;
          transition: stroke 300ms ease, filter 300ms ease, opacity 300ms ease;
        }

        .ledHybrid__railBase {
          stroke: rgba(11,14,19,0.96);
          stroke-width: 11;
          filter: drop-shadow(0 5px 7px rgba(0,0,0,0.62));
        }

        .ledHybrid__railRim {
          stroke: rgba(219,210,194,0.82);
          stroke-width: 4.4;
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.92))
            drop-shadow(0 0 1px rgba(255,244,225,0.50));
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railBase {
          stroke: rgba(6,8,12,0.99);
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railRim {
          stroke: rgba(245,220,181,0.90);
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.96))
            drop-shadow(0 0 2px rgba(255,230,188,0.48));
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railBase {
          stroke: rgba(35,24,13,0.92);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railRim {
          stroke: rgba(255,213,139,0.48);
          filter: drop-shadow(0 0 3px rgba(255,205,121,0.55));
        }

        .ledHybrid.hybridIcon--on .ledHybrid__trace path {
          stroke-width: 5.2;
        }

        /* DASHBOARD EDITION PREMIUM V3 ------------------------------------
           Revisao optica tablet-first. A camada V2 acima permanece intacta
           para rollback; estes overrides separam materia fisica permanente
           de emissao, que continua restrita ao estado ON. */
        .hybridIcon {
          --premium-metal-hi: rgba(247,238,221,0.96);
          --premium-metal-mid: rgba(148,146,140,0.98);
          --premium-metal-low: rgba(42,46,50,0.99);
        }

        /* TV V3: o painel deixa de carregar sozinho a silhueta. O suporte
           possui contraste, espessura e sombra proprios, inclusive no ON. */
        .tvHybrid__bezel,
        .tvHybrid__neck,
        .tvHybrid__foot {
          position: absolute;
          pointer-events: none;
          transition: filter 320ms ease, box-shadow 320ms ease;
        }

        .tvHybrid__bezel {
          left: 5.55%;
          top: 9.2%;
          width: 88.9%;
          height: 74.7%;
          box-sizing: border-box;
          border: 5px solid transparent;
          border-radius: 7px;
          background:
            linear-gradient(160deg, var(--premium-metal-hi), var(--premium-metal-mid) 42%, var(--premium-metal-low) 82%) border-box;
          -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter:
            drop-shadow(0 4px 4px rgba(0,0,0,0.74))
            drop-shadow(0 0 1px rgba(255,245,226,0.64));
          z-index: 6;
        }

        .tvHybrid__neck {
          left: 50%;
          top: 81.4%;
          width: 10.8%;
          height: 11.4%;
          transform: translateX(-50%);
          border-radius: 0 0 5px 5px;
          background: linear-gradient(90deg, #393d41 0%, #d8d1c5 38%, #817f7b 63%, #292d31 100%);
          box-shadow:
            inset 1px 0 rgba(255,255,255,0.28),
            inset -2px 0 rgba(0,0,0,0.42),
            0 3px 4px rgba(0,0,0,0.72);
          z-index: 7;
        }

        .tvHybrid__foot {
          left: 50%;
          top: 91.1%;
          width: 38%;
          height: 8.4%;
          transform: translateX(-50%);
          border-radius: 48% 48% 32% 32% / 62% 62% 38% 38%;
          background:
            linear-gradient(180deg, rgba(247,238,221,0.98), rgba(126,126,124,0.98) 38%, rgba(34,38,42,0.99) 82%);
          box-shadow:
            inset 0 2px rgba(255,255,255,0.42),
            inset 0 -3px rgba(0,0,0,0.42),
            0 4px 5px rgba(0,0,0,0.78),
            0 0 1px rgba(255,245,226,0.68);
          z-index: 8;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__bezel,
        .tvHybrid.hybridIcon--on .tvHybrid__neck,
        .tvHybrid.hybridIcon--on .tvHybrid__foot {
          filter:
            drop-shadow(0 3px 3px rgba(0,0,0,0.76))
            drop-shadow(0 0 2px rgba(255,222,166,0.44));
        }

        /* A/C V3: o chassi ganha altura propria e centraliza no eixo da linha.
           O frame mantem a geometria original, mas perde a coloracao ciano; a
           assinatura ativa fica apenas no indicador, na calha e no airflow. */
        .acHybrid__canvas::before,
        .acHybrid__chassisRim {
          left: 5%;
          top: 10%;
          width: 90%;
          height: 51%;
          transform: translateY(26px);
          border-radius: 24px 24px 12px 12px;
        }

        .acHybrid__canvas::before {
          background:
            linear-gradient(105deg, transparent 0 17%, rgba(255,255,255,0.18) 23%, transparent 30%),
            linear-gradient(180deg, rgba(192,190,184,0.99), rgba(105,108,110,0.99) 28%, rgba(48,53,57,0.99) 67%, rgba(22,27,31,0.99));
          box-shadow:
            inset 0 3px 0 rgba(255,255,255,0.34),
            inset 0 -9px 13px rgba(0,0,0,0.38),
            0 7px 10px rgba(0,0,0,0.58);
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--off .acHybrid__canvas::before,
        .acHybrid.hybridIcon--on .acHybrid__canvas::before {
          background:
            linear-gradient(105deg, transparent 0 17%, rgba(255,255,255,0.16) 23%, transparent 30%),
            linear-gradient(180deg, rgba(184,183,178,0.99), rgba(94,99,102,0.99) 29%, rgba(40,46,50,0.99) 68%, rgba(16,21,25,0.99));
          box-shadow:
            inset 0 3px 0 rgba(255,255,255,0.32),
            inset 0 -9px 13px rgba(0,0,0,0.44),
            0 7px 11px rgba(0,0,0,0.68);
        }

        .acHybrid__frameOff,
        .acHybrid__frameOn {
          transform: translateY(26px) scale(1.11, 1.30);
          transform-origin: 50% 34%;
        }

        .acHybrid__frameOn {
          filter:
            saturate(0)
            brightness(1.08)
            contrast(1.13)
            drop-shadow(0 1px 1px rgba(0,0,0,0.86))
            drop-shadow(0 0 1px rgba(247,238,221,0.52));
        }

        .acHybrid__chassisRim {
          position: absolute;
          box-sizing: border-box;
          border: 5px solid transparent;
          background:
            linear-gradient(158deg, var(--premium-metal-hi), rgba(139,140,137,0.98) 44%, var(--premium-metal-low) 86%) border-box;
          -webkit-mask: linear-gradient(#000 0 0) padding-box, linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          filter:
            drop-shadow(0 4px 4px rgba(0,0,0,0.68))
            drop-shadow(0 0 1px rgba(255,246,229,0.64));
          z-index: 7;
          pointer-events: none;
        }

        .acHybrid__airflowViewport {
          position: absolute;
          inset: 0;
          transform: translateY(25px) scaleY(0.58);
          transform-origin: 50% 50%;
          z-index: 2;
          pointer-events: none;
        }

        .acHybrid__airflowViewport .acHybrid__airflow {
          inset: 0;
        }

        .acHybrid__outletLine {
          left: 14%;
          top: 67.2%;
          width: 72%;
          height: 3px;
          z-index: 9;
        }

        .acHybrid__statusLed {
          position: absolute;
          right: 22%;
          top: 40.5%;
          width: 8.5%;
          height: 4px;
          border-radius: 999px;
          background: rgba(27,32,35,0.92);
          box-shadow:
            inset 0 1px rgba(255,255,255,0.24),
            0 1px 1px rgba(0,0,0,0.72);
          opacity: 0.72;
          z-index: 9;
          transition: background 280ms ease, box-shadow 280ms ease, opacity 280ms ease;
          pointer-events: none;
        }

        .acHybrid.hybridIcon--on .acHybrid__statusLed {
          background: rgba(154,246,255,0.98);
          box-shadow:
            0 0 5px rgba(111,224,241,0.92),
            0 0 12px rgba(111,224,241,0.42);
          opacity: 1;
        }

        .acHybrid.hybridIcon--on::before {
          top: 67%;
          width: 94%;
          height: 38%;
          background: radial-gradient(ellipse, rgba(111,224,241,0.36), rgba(111,224,241,0.11) 42%, transparent 74%);
          filter: blur(3px);
          opacity: 0.78;
        }

        .acHybrid.hybridIcon--on .acHybrid__glow {
          opacity: 0.28;
          transform: translateY(24px) scaleY(0.58);
          transform-origin: 50% 50%;
          filter: blur(1px);
          animation: acHybridOutletGlowBreath 4.8s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        @keyframes acHybridOutletGlowBreath {
          0%, 100% {
            opacity: 0.18;
            transform: translateY(24px) scale(1, 0.54);
          }
          50% {
            opacity: 0.31;
            transform: translateY(24px) scale(1.018, 0.62);
          }
        }

        /* LED V3: a borda nao engrossa sozinha. O volume adicional pertence ao
           corpo do tubo; dentro dele surge um difusor segmentado reconhecivel. */
        .ledHybrid__railBase {
          stroke: rgba(45,49,52,0.99);
          stroke-width: 18;
          filter:
            drop-shadow(0 5px 7px rgba(0,0,0,0.66))
            drop-shadow(0 0 1px rgba(255,245,226,0.34));
        }

        .ledHybrid__railRim {
          stroke: rgba(226,218,203,0.94);
          stroke-width: 13.2;
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.94))
            drop-shadow(0 0 1px rgba(255,246,229,0.66));
        }

        .ledHybrid__railDiffuser {
          stroke: rgba(184,175,160,0.96);
          stroke-width: 7.4;
          stroke-dasharray: 0.10 0.065;
          opacity: 0.96;
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 1px rgba(245,230,205,0.38));
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railBase {
          stroke: rgba(35,39,42,0.99);
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railRim {
          stroke: rgba(238,222,197,0.96);
        }

        .sala-card.is-room-on .ledHybrid.hybridIcon--off .ledHybrid__railDiffuser {
          stroke: rgba(154,144,128,0.98);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railBase {
          stroke: rgba(67,53,36,0.96);
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railRim {
          stroke: rgba(235,218,190,0.72);
          filter:
            drop-shadow(0 1px 1px rgba(0,0,0,0.82))
            drop-shadow(0 0 2px rgba(255,219,158,0.44));
        }

        .ledHybrid.hybridIcon--on .ledHybrid__railDiffuser {
          stroke: rgba(255,205,122,0.52);
          opacity: 0.72;
          filter: drop-shadow(0 0 2px rgba(255,199,105,0.64));
        }

        /* DASHBOARD EDITION PREMIUM V4 ------------------------------------
           Correcao cirurgica posterior ao QA real. A V3 permanece acima para
           rollback. O LED strip aprovado nao recebe qualquer override aqui. */

        /* TV V4: uma unica estrutura fisica permanente. Os frames raster
           OFF/ON anteriores ficam preservados no markup, mas deixam de disputar
           contorno com bezel, pescoco e base construidos na V3. */
        .tvHybrid__frameOff,
        .tvHybrid__frameOn {
          opacity: 0 !important;
          animation: none !important;
          filter: none !important;
        }

        .tvHybrid__bezel {
          top: 8.6%;
          height: 76%;
          border-width: 5px 5px 6px;
        }

        .tvHybrid__neck {
          top: 84.7%;
          height: 9.4%;
        }

        .tvHybrid__foot {
          top: 92.8%;
          height: 7%;
        }

        /* ANTERIOR V3: bezel, pescoco e base recebiam um filtro champagne
           adicional no ON. Agora o material fisico e identico nos dois estados. */
        .tvHybrid.hybridIcon--on .tvHybrid__bezel {
          filter:
            drop-shadow(0 4px 4px rgba(0,0,0,0.74))
            drop-shadow(0 0 1px rgba(255,245,226,0.64));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__neck,
        .tvHybrid.hybridIcon--on .tvHybrid__foot {
          filter: none;
        }

        /* Todo conteudo emissivo fica limitado ao retangulo interno da tela.
           O clip usa exatamente a geometria canonica do screenClip. */
        .tvHybrid__screenOn,
        .tvHybrid__screenGlow {
          clip-path: inset(11.33% 7.16% 18.34% 7.37% round 3px);
          transform-origin: 50% 46%;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          /* ANTERIOR V4 QA: linear-gradient(180deg, rgba(76,58,36,0.78), rgba(24,18,12,0.88)); */
          background: linear-gradient(180deg, rgba(92,70,42,0.82), rgba(35,24,14,0.90));
          box-shadow:
            inset 0 0 0 1px rgba(226,213,192,0.58),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -3px 7px rgba(20,12,5,0.46),
            0 1px 2px rgba(0,0,0,0.76);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background: linear-gradient(180deg, rgba(255,222,168,0.24), rgba(151,102,47,0.14) 48%, rgba(44,27,12,0.06));
        }

        /* ANTERIOR V3: o halo geral mudava tamanho, cor e centro optico no ON.
           A TV volta a conservar apenas a mesma sombra neutra do produto OFF. */
        .tvHybrid.hybridIcon--on::before {
          top: 53%;
          width: 94%;
          height: 58%;
          background: radial-gradient(ellipse, rgba(4,6,10,0.72), rgba(4,6,10,0.30) 43%, transparent 74%);
          filter: blur(2.4px);
          opacity: 0.58;
        }

        .sala-card.is-room-on .tvHybrid.hybridIcon--on::before {
          opacity: 0.82;
          filter: blur(2px);
        }

        /* Sequencia OLED: primeiro a linha abre; somente depois de atingir a
           largura maxima a tela recebe preenchimento e glow uniformes. */
        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenOn {
          animation: tvHybridScreenFillAfterLine 900ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowAfterLine 900ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenWash {
          animation: tvHybridScreenWashAfterLine 900ms ease-out forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenOn {
          opacity: 0.92;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          /* ANTERIOR V4 QA: opacity: 0.34; */
          opacity: 0.42;
          animation: tvHybridScreenBreath 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenOn {
          animation: tvHybridScreenFillSleep 820ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowSleep 820ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        @keyframes tvHybridScreenFillAfterLine {
          0%, 62% { opacity: 0; }
          70% { opacity: 0.14; }
          100% { opacity: 0.92; }
        }

        @keyframes tvHybridScreenGlowAfterLine {
          0%, 64% { opacity: 0; }
          74% { opacity: 0.10; }
          /* ANTERIOR V4 QA: 100% { opacity: 0.34; } */
          100% { opacity: 0.42; }
        }

        @keyframes tvHybridScreenWashAfterLine {
          0%, 62% { opacity: 0; }
          74% { opacity: 0.18; }
          100% { opacity: 0.78; }
        }

        @keyframes tvHybridScreenBreath {
          /* ANTERIOR V4 QA: 0%,100% 0.28; 50% 0.38. */
          0%, 100% { opacity: 0.35; }
          50% { opacity: 0.46; }
        }

        @keyframes tvHybridScreenFillSleep {
          0% { opacity: 0.92; }
          58%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenGlowSleep {
          /* ANTERIOR V4 QA: 0% { opacity: 0.34; } */
          0% { opacity: 0.42; }
          52%, 100% { opacity: 0; }
        }

        /* A/C V4: corpo e chassisRim compartilham a mesma geometria e passam
           a ser a unica silhueta fisica. Os frames PNG concorrentes continuam
           preservados no markup apenas para rollback. */
        .acHybrid__frameOff,
        .acHybrid__frameOn {
          opacity: 0 !important;
          animation: none !important;
          filter: none !important;
        }

        /* AJUSTE V4 POS-RENDER: ocultar ambos os frames removeu detalhe demais.
           O frame OFF neutro passa a ser o unico contorno autoritativo e fica
           permanente; a moldura CSS V3 e o frame ON continuam preservados,
           porem visualmente desativados para nao produzir linhas duplas. */
        .acHybrid__frameOff {
          opacity: 1 !important;
          transform: translateY(31px) scale(1.04, 1.30);
          transform-origin: 50% 34%;
          filter:
            brightness(1.10)
            contrast(1.14)
            drop-shadow(0 1px 1px rgba(0,0,0,0.86))
            drop-shadow(0 0 1px rgba(247,238,221,0.50)) !important;
        }

        .acHybrid__frameOn {
          opacity: 0 !important;
        }

        .acHybrid__chassisRim {
          opacity: 0;
        }

        /* O halo de estado nao altera mais o envelope optico do aparelho.
           Ciano permanece apenas no indicador, calha, glow interno e airflow. */
        .acHybrid.hybridIcon--on::before {
          top: 53%;
          width: 94%;
          height: 58%;
          background: radial-gradient(ellipse, rgba(4,6,10,0.72), rgba(4,6,10,0.30) 43%, transparent 74%);
          filter: blur(2.4px);
          opacity: 0.58;
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--on::before {
          opacity: 0.82;
          filter: blur(2px);
        }

        .acHybrid__glow {
          clip-path: inset(44% 10% 8% 10% round 0 0 20px 20px);
        }

        /* --- ORIGINAL @media (max-height: 760px) (rollback) ---
        hero-action min-height 134, col 106; room-icon 104x104 margin -4/-3;
        command-row 40px / 32px col / 8gap; icon 27px; fonts 11.6/9.8/9.8
        --- FIM ORIGINAL --- */

        @media (max-height: 760px) {
          :host {
            --card-radius: var(--bruno-liquid-card-radius, 22px);
            --button-radius: 14px;
          }

          .sala-card {
            padding: 10px 12px;
          }

          .hero-action {
            min-height: 120px;
            grid-template-columns: 112px minmax(0, 1fr) 38px;
            padding-bottom: 6px;
          }

          .room-icon {
            width: 108px;
            height: 72px;
            margin-left: 0;
            margin-top: 1px;
          }

          .command-row {
            height: 52px;
            grid-template-columns: 36px minmax(0, 1fr) 40px;
            column-gap: 5px;
            padding: 0 3px 0 4px;
          }

          .command-row::after {
            left: 40px;
            right: 40px;
          }

          .command-icon {
            width: 34px;
            height: 34px;
          }

          /* NOVO: espessura optica recalculada para 34px (ver comentario na
             regra base): 1.227 * 24/34 ≈ 0.87. */
          .command-icon svg g,
          .command-icon svg path {
            stroke-width: 0.87;
          }

          /* ANTERIOR (obsoleto, 2026-07-20): ver comentario na regra base (40px).
          .command-icon [data-bruno-device-icon="ledstrip"] svg path {
            stroke-width: 1.16;
          }
          --- FIM ANTERIOR --- */

          /* ANTERIOR (rollback):
          .hybridIcon { --hybrid-size: 36px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.144 !important; }
          .ledHybrid { --hybrid-scale: 0.1285714286 !important; }
          */
          .hybridIcon { --hybrid-size: 40px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.16 !important; }
          .ledHybrid { --hybrid-scale: 0.1428571429 !important; }

          .command-name {
            font-size: 13px;
          }

          .command-category {
            font-size: 10.4px;
          }

          .command-state {
            font-size: 10px;
            padding-left: 8px;
            width: 100%;
          }
        }

        /* --- ANTERIOR (rollback) — bloco herdado do embed mobile V3.5:
           inflava o card no phone (min-height 300px), causando a altura
           excessiva apontada pelo usuario na Fase 2 mobile.
        @media (max-width: 800px) {
          :host {
            min-height: 300px;
          }

          .sala-card {
            min-height: 300px;
          }
        }
        --- FIM ANTERIOR --- */

        /* ANTERIOR (rollback) — Fase 2 mobile de 2026-07-09: SALA COMPACTA
           vertical no phone. Permanece ativa como fallback antes da camada
           final de consolidacao mobile de 2026-07-22.
           PNG menor, hero mais baixo e linhas de comando mais densas.
           ROLLBACK: remover este bloco e descomentar o ANTERIOR acima. */
        @media (max-width: 800px) {
          :host {
            min-height: 0;
          }

          .sala-card {
            min-height: 0;
            padding: 10px 12px;
          }

          .hero-action {
            min-height: 96px;
            grid-template-columns: 96px minmax(0, 1fr) 36px;
            padding: 0 0 6px;
          }

          .room-icon {
            width: 92px;
            height: 62px;
          }

          .command-row {
            height: 46px;
            grid-template-columns: 34px minmax(0, 1fr) 42px;
            column-gap: 5px;
          }

          .command-icon {
            width: 30px;
            height: 30px;
          }

          /* NOVO: espessura optica recalculada para 30px (ver comentario na
             regra base): 1.227 * 24/30 ≈ 0.98. */
          .command-icon svg g,
          .command-icon svg path {
            stroke-width: 0.98;
          }

          /* ANTERIOR (obsoleto, 2026-07-20): ver comentario na regra base (40px).
          .command-icon [data-bruno-device-icon="ledstrip"] svg path {
            stroke-width: 1.31;
          }
          --- FIM ANTERIOR --- */

          /* ANTERIOR (rollback):
          .hybridIcon { --hybrid-size: 32px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.128 !important; }
          .ledHybrid { --hybrid-scale: 0.1142857143 !important; }
          */
          .hybridIcon { --hybrid-size: 36px !important; }
          .tvHybrid, .acHybrid { --hybrid-scale: 0.144 !important; }
          .ledHybrid { --hybrid-scale: 0.1285714286 !important; }

          .command-name {
            font-size: 12.6px;
          }

          .command-category {
            font-size: 10px;
          }

          .command-state {
            font-size: 9.6px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .hero-action,
          .command-row,
          .status-dot,
          .command-icon {
            transition: none !important;
          }

          .tvHybrid__oledLine,
          .tvHybrid__screenWash,
          .tvHybrid__screenGlow {
            animation: none !important;
          }
        }

        /* DASHBOARD EDITION PREMIUM V5 ------------------------------------
           Microajuste de largura posterior ao fechamento dos icones. As
           estruturas e animacoes premium permanecem intocadas: esta camada
           redistribui apenas as tres colunas internas de cada command-row. */
        .command-row {
          /* ANTERIOR V4: 40px minmax(0,1fr) 44px. */
          grid-template-columns: 40px minmax(0, 1fr) 36px;
        }

        .command-state {
          /* ANTERIOR V4: padding-left 10px; border-left 1px solid. */
          padding-left: 4px;
          border-left: 0;
          letter-spacing: 0.7px;
        }

        /* O A/C e o unico produto que ocupa quase toda a coluna de icone.
           O respiro adicional nao altera Corredor, TV ou a geometria do A/C. */
        .command-row.icon-climate .command-copy {
          padding-left: 3px;
        }

        @media (max-height: 760px) {
          .command-row {
            /* ANTERIOR V4: 36px minmax(0,1fr) 40px. */
            grid-template-columns: 36px minmax(0, 1fr) 33px;
          }

          .command-state {
            /* ANTERIOR V4: padding-left 8px. */
            padding-left: 3px;
            letter-spacing: 0.65px;
          }
        }

        @media (max-width: 800px) {
          .command-row {
            /* ANTERIOR V4: 34px minmax(0,1fr) 42px. */
            grid-template-columns: 34px minmax(0, 1fr) 34px;
          }

          .command-state {
            padding-left: 3px;
            letter-spacing: 0.6px;
          }
        }

        /* DASHBOARD EDITION PREMIUM V6 ------------------------------------
           Ajuste exclusivamente cosmetico dos produtos TV e A/C. A V4/V5
           permanece acima como fallback: nenhuma geometria, timing ou acao e
           alterada por esta camada. */

        /* A moldura continua fisicamente identica, mas o material deixa de
           usar um gradiente diagonal que sugeria laterais inclinadas em 40px. */
        .tvHybrid__bezel {
          background:
            linear-gradient(180deg, var(--premium-metal-hi), var(--premium-metal-mid) 48%, var(--premium-metal-low) 100%) border-box;
        }

        /* A assinatura ligada volta ao azul frio do template SVG anterior.
           Toda emissao permanece recortada no interior da tela. */
        .tvHybrid {
          --premium-halo: 100, 172, 183;
        }

        .command-row.icon-tv {
          --tone: 100, 172, 183;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          background: linear-gradient(180deg, rgba(127,219,233,0.84), rgba(100,172,183,0.72) 48%, rgba(24,66,78,0.92));
          box-shadow:
            inset 0 0 0 1px rgba(180,236,244,0.70),
            inset 0 1px 0 rgba(255,255,255,0.34),
            inset 0 -3px 8px rgba(9,34,43,0.54),
            0 1px 2px rgba(0,0,0,0.76);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background: linear-gradient(180deg, rgba(210,247,252,0.34), rgba(127,219,233,0.22) 46%, rgba(38,111,128,0.10));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenOn,
        .tvHybrid.hybridIcon--on .tvHybrid__screenGlow {
          filter: grayscale(1) sepia(1) saturate(4.6) hue-rotate(142deg) brightness(1.18);
          mix-blend-mode: screen;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          opacity: 0.56;
          animation: tvHybridScreenBreathBlue 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        @keyframes tvHybridScreenBreathBlue {
          0%, 100% { opacity: 0.48; }
          50% { opacity: 0.62; }
        }

        /* Remove somente a faixa diagonal especular esquerda do A/C. O
           gradiente vertical, o frame, o LED e o airflow ficam intactos. */
        .acHybrid__canvas::before {
          background:
            linear-gradient(180deg, rgba(192,190,184,0.99), rgba(105,108,110,0.99) 28%, rgba(48,53,57,0.99) 67%, rgba(22,27,31,0.99));
        }

        .sala-card.is-room-on .acHybrid.hybridIcon--off .acHybrid__canvas::before,
        .acHybrid.hybridIcon--on .acHybrid__canvas::before {
          background:
            linear-gradient(180deg, rgba(184,183,178,0.99), rgba(94,99,102,0.99) 29%, rgba(40,46,50,0.99) 68%, rgba(16,21,25,0.99));
        }

        /* DASHBOARD EDITION PREMIUM V7 ------------------------------------
           Fechamento optico da TV: bezel uniforme, material fisico neutro e
           uma unica assinatura azul no estado ligado. A sequencia OLED
           centro-para-fora permanece a mesma no ligar e no desligar. */
        .tvHybrid__bezel {
          border-width: 5px;
        }

        .tvHybrid__neck {
          background: linear-gradient(90deg, #34393e 0%, #c9c7c2 38%, #777a7c 63%, #252a2f 100%);
        }

        .tvHybrid__foot {
          background: linear-gradient(180deg, rgba(226,226,222,0.98), rgba(116,120,122,0.98) 40%, rgba(31,36,41,0.99) 84%);
          box-shadow:
            inset 0 2px rgba(255,255,255,0.34),
            inset 0 -3px rgba(0,0,0,0.46),
            0 4px 5px rgba(0,0,0,0.76),
            0 0 1px rgba(224,235,238,0.54);
        }

        .command-row.icon-tv.is-active .command-state {
          color: rgba(156,226,238,0.98);
          text-shadow:
            0 0 9px rgba(100,172,183,0.34),
            0 0 18px rgba(100,172,183,0.12);
          border-left-color: rgba(100,172,183,0.20);
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          opacity: 0.24;
          animation: tvHybridScreenBreathBlue 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        @keyframes tvHybridScreenGlowAfterLine {
          0%, 64% { opacity: 0; }
          74% { opacity: 0.07; }
          100% { opacity: 0.24; }
        }

        @keyframes tvHybridScreenGlowSleep {
          0% { opacity: 0.24; }
          52%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenBreathBlue {
          0%, 100% { opacity: 0.20; }
          50% { opacity: 0.27; }
        }

        /* DASHBOARD EDITION PREMIUM V8 ------------------------------------
           Fechamento final da TV: aro opticamente uniforme, tela fria sem
           contaminacao champagne e sequencia OLED visivel nos dois sentidos. */
        .tvHybrid__bezel {
          left: 5.55%;
          top: 8.6%;
          width: 88.9%;
          height: 76%;
          border-width: 5px;
          border-style: solid;
          border-color: transparent;
          border-radius: 7px;
          background: linear-gradient(180deg, #d3d5d4 0%, #85898b 46%, #262b2f 100%) border-box;
          filter:
            drop-shadow(0 3px 3px rgba(0,0,0,0.70))
            drop-shadow(0 0 1px rgba(229,238,240,0.50));
        }

        .tvHybrid__screenClip {
          left: 7.55%;
          top: 11.76%;
          width: 84.9%;
          height: 69.68%;
          border-radius: 3px;
          background:
            radial-gradient(circle at 32% 18%, rgba(255,255,255,0.10), transparent 28%),
            linear-gradient(160deg, rgba(38,44,49,0.98), rgba(10,13,17,0.99) 56%, rgba(3,5,8,1));
          box-shadow:
            inset 0 0 0 1px rgba(214,224,226,0.42),
            inset 0 1px 0 rgba(255,255,255,0.16),
            inset 0 -2px 5px rgba(0,0,0,0.62),
            0 1px 2px rgba(0,0,0,0.74);
        }

        .tvHybrid__screenOn,
        .tvHybrid__screenGlow {
          clip-path: inset(11.76% 7.55% 18.56% 7.55% round 3px);
          transform-origin: 50% 46.6%;
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenClip {
          background:
            radial-gradient(circle at 38% 18%, rgba(220,250,255,0.20), transparent 34%),
            linear-gradient(180deg, rgba(120,196,213,0.70), rgba(64,132,148,0.56) 48%, rgba(15,45,55,0.88));
          box-shadow:
            inset 0 0 0 1px rgba(182,232,240,0.60),
            inset 0 1px 0 rgba(255,255,255,0.28),
            inset 0 -3px 7px rgba(7,28,36,0.48),
            0 1px 2px rgba(0,0,0,0.76);
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenWash {
          background: linear-gradient(180deg, rgba(221,249,253,0.20), rgba(112,190,206,0.12) 46%, rgba(34,91,104,0.05));
        }

        .tvHybrid.hybridIcon--on .tvHybrid__screenOn,
        .tvHybrid.hybridIcon--on .tvHybrid__screenGlow {
          filter: saturate(0.82) brightness(1.02);
          mix-blend-mode: screen;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenOn {
          opacity: 0.48;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvHybrid__screenGlow {
          opacity: 0.11;
          animation: tvHybridScreenBreathV8 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvHybrid__oledLine {
          height: 1px;
          background: linear-gradient(90deg, transparent 0%, rgba(174,234,244,0.82) 18%, #f6fdff 50%, rgba(174,234,244,0.82) 82%, transparent 100%);
          box-shadow: 0 0 4px rgba(234,252,255,0.92), 0 0 9px rgba(100,172,183,0.54);
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__oledLine {
          animation: tvHybridOledOpenV8 900ms cubic-bezier(0.2,0.72,0.2,1) forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenOn {
          animation: tvHybridScreenFillAfterLineV8 900ms cubic-bezier(0.2,0.72,0.2,1) forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-on .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowAfterLineV8 900ms ease-out forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__oledLine {
          animation: tvHybridOledCloseV8 820ms cubic-bezier(0.2,0.72,0.2,1) forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenOn {
          animation: tvHybridScreenFillSleepV8 820ms ease-in forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        .tvHybrid.hybridIcon--turning-off .tvHybrid__screenGlow {
          animation: tvHybridScreenGlowSleepV8 820ms ease-in forwards !important;
          animation-delay: var(--hybrid-transition-delay) !important;
        }

        @keyframes tvHybridOledOpenV8 {
          0% { width: 0; opacity: 0; transform: translate(-50%, -50%) scaleY(0.7); }
          15% { width: 3%; opacity: 1; }
          60% { width: 100%; opacity: 1; }
          82% { width: 100%; opacity: 0.48; }
          100% { width: 100%; opacity: 0; }
        }

        @keyframes tvHybridOledCloseV8 {
          0% { width: 100%; opacity: 0; }
          16% { width: 100%; opacity: 1; }
          70% { width: 3%; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }

        @keyframes tvHybridScreenFillAfterLineV8 {
          0%, 60% { opacity: 0; }
          72% { opacity: 0.12; }
          100% { opacity: 0.48; }
        }

        @keyframes tvHybridScreenGlowAfterLineV8 {
          0%, 64% { opacity: 0; }
          76% { opacity: 0.04; }
          100% { opacity: 0.11; }
        }

        @keyframes tvHybridScreenFillSleepV8 {
          0% { opacity: 0.48; }
          52%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenGlowSleepV8 {
          0% { opacity: 0.11; }
          48%, 100% { opacity: 0; }
        }

        @keyframes tvHybridScreenBreathV8 {
          0%, 100% { opacity: 0.09; }
          50% { opacity: 0.13; }
        }

        /* TV HYBRID V5 PACKAGE -------------------------------------------
           Namespace isolado: nenhuma regra das edicoes V3-V8 interfere nas
           quatro camadas e na sequencia OLED entregues pelo pacote V5. */
        .tvHybrid::before {
          content: none !important;
        }

        .tvV5__canvas {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 250px;
          aspect-ratio: 475 / 300;
          transform: translate(-50%, -50%) scale(var(--hybrid-scale));
          transform-origin: center;
          isolation: isolate;
          z-index: 1;
          pointer-events: none;
        }

        .tvV5__layer {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: contain;
          pointer-events: none;
          transition: opacity 320ms ease;
        }

        .tvV5__frameOff { z-index: 4; opacity: 1; }
        .tvV5__frameOn { z-index: 5; opacity: 0; }
        .tvV5__screenOn { z-index: 2; opacity: 0; }
        .tvV5__screenGlow { z-index: 2; opacity: 0; }

        .tvV5__screenOn,
        .tvV5__screenGlow {
          clip-path: inset(14.50% 8.96% 21.50% 9.37% round 2px);
        }

        .tvV5__screenBase {
          position: absolute;
          left: 7.37%;
          top: 11.33%;
          width: 85.47%;
          height: 70.33%;
          box-sizing: border-box;
          border-radius: 3px;
          background:
            radial-gradient(circle at 34% 18%, rgba(73,80,86,0.20), transparent 32%),
            linear-gradient(158deg, rgba(29,33,37,0.99), rgba(8,10,13,1) 58%, rgba(2,3,5,1));
          box-shadow:
            inset 0 0 0 1px rgba(211,218,219,0.16),
            inset 0 1px 0 rgba(255,255,255,0.08),
            inset 0 -3px 7px rgba(0,0,0,0.72);
          z-index: 1;
          pointer-events: none;
        }

        .tvV5__screenBase::after {
          content: "";
          position: absolute;
          inset: 5px 4.5px;
          border-radius: 2px;
          opacity: 0;
          background:
            radial-gradient(circle at 38% 18%, rgba(214,246,252,0.18), transparent 35%),
            linear-gradient(180deg, rgba(104,190,209,0.84), rgba(54,126,145,0.78) 50%, rgba(13,45,55,0.96));
          box-shadow:
            inset 0 0 0 1px rgba(193,235,242,0.38),
            inset 0 1px 0 rgba(255,255,255,0.22),
            inset 0 -3px 7px rgba(5,27,34,0.58);
          pointer-events: none;
        }

        .tvV5__metalFrame {
          position: absolute;
          left: 5.95%;
          top: 9.37%;
          width: 88.32%;
          height: 74.26%;
          box-sizing: border-box;
          border: 7px solid rgba(142,147,149,0.98);
          border-radius: 7px;
          box-shadow:
            inset 0 0 0 1px rgba(232,235,234,0.34),
            0 0 0 1px rgba(31,35,38,0.84),
            0 3px 4px rgba(0,0,0,0.68),
            0 0 2px rgba(224,230,230,0.42);
          z-index: 6;
          pointer-events: none;
        }

        .tvHybrid.hybridIcon--on .tvV5__frameOff { opacity: 0; }
        .tvHybrid.hybridIcon--on .tvV5__frameOn { opacity: 1; }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvV5__screenOn {
          opacity: 1;
          filter: saturate(1.16) brightness(1.12);
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvV5__screenBase::after {
          opacity: 1;
        }

        .tvHybrid.hybridIcon--on:not(.hybridIcon--turning-on):not(.hybridIcon--turning-off) .tvV5__screenGlow {
          opacity: 0.34;
          filter: saturate(1.14) brightness(1.10);
          animation: tvV5GlowBreath 5.5s ease-in-out infinite;
          animation-delay: var(--hybrid-glow-delay);
        }

        .tvV5__screenClip {
          position: absolute;
          left: 9.37%;
          top: 14.50%;
          z-index: 3;
          width: 81.67%;
          height: 64%;
          overflow: hidden;
          pointer-events: none;
        }

        .tvV5__oledLine {
          position: absolute;
          left: 50%;
          top: 50%;
          width: 0;
          height: 1px;
          opacity: 0;
          transform: translate(-50%, -50%);
          border-radius: 999px;
          background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.85) 18%, #fff 50%, rgba(255,255,255,0.85) 82%, transparent 100%);
          box-shadow: 0 0 5px rgba(255,255,255,0.88), 0 0 12px rgba(84,164,255,0.55);
        }

        .tvV5__screenWash {
          position: absolute;
          inset: 0;
          opacity: 0;
          background:
            radial-gradient(circle at 50% 22%, rgba(84,164,255,0.18), transparent 54%),
            linear-gradient(180deg, rgba(35,67,104,0.12), rgba(18,29,43,0.03));
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__oledLine {
          animation: tvV5OledOpen 700ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__screenWash {
          animation: tvV5ScreenWake 420ms ease-out forwards;
          animation-delay: calc(650ms + var(--hybrid-transition-delay));
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__screenOn {
          animation: tvV5ScreenLayerIn 420ms ease-out forwards;
          animation-delay: calc(650ms + var(--hybrid-transition-delay));
        }

        .tvHybrid.hybridIcon--turning-on .tvV5__screenGlow {
          animation: tvV5GlowLayerIn 420ms ease-out forwards;
          animation-delay: calc(650ms + var(--hybrid-transition-delay));
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenGlow {
          opacity: 0.34;
          animation: tvV5GlowLayerOut 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenBase::after {
          opacity: 1;
          animation: tvV5ScreenBaseOut 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenOn {
          opacity: 1;
          animation: tvV5ScreenLayerOut 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__screenWash {
          opacity: 1;
          animation: tvV5ScreenSleep 300ms ease-in forwards;
          animation-delay: var(--hybrid-transition-delay);
        }

        .tvHybrid.hybridIcon--turning-off .tvV5__oledLine {
          animation: tvV5OledClose 700ms cubic-bezier(0.2,0.72,0.2,1) forwards;
          animation-delay: calc(300ms + var(--hybrid-transition-delay));
        }

        @keyframes tvV5OledOpen {
          0% { width: 0; opacity: 0; transform: translate(-50%, -50%) scaleY(0.7); }
          14% { width: 2%; opacity: 1; }
          78% { width: 100%; opacity: 1; }
          100% { width: 100%; opacity: 0; }
        }

        @keyframes tvV5ScreenWake {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvV5ScreenLayerIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes tvV5GlowLayerIn {
          from { opacity: 0; }
          to { opacity: 0.34; }
        }

        @keyframes tvV5GlowLayerOut {
          from { opacity: 0.34; }
          to { opacity: 0; }
        }

        @keyframes tvV5ScreenBaseOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvV5ScreenLayerOut {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvV5ScreenSleep {
          from { opacity: 1; }
          to { opacity: 0; }
        }

        @keyframes tvV5OledClose {
          0% { width: 100%; opacity: 0; }
          14% { width: 100%; opacity: 1; }
          82% { width: 3%; opacity: 1; }
          100% { width: 0; opacity: 0; }
        }

        @keyframes tvV5GlowBreath {
          0%, 100% { opacity: 0.26; }
          50% { opacity: 0.36; }
        }

        /* NOVO (2026-07-22) — consolidacao mobile -------------------------
           A Sala conserva a hierarquia pela largura integral, mas passa a
           compartilhar a altura de 176px dos demais comodos. Identidade e
           navegacao ficam a esquerda; Corredor, TV e A/C formam tres alvos
           independentes empilhados a direita. Esta camada final e aditiva e
           sobrescreve somente a geometria em <=800px.

           ANTERIOR (rollback): composicao vertical definida nos blocos
           @media (max-width: 800px) acima (hero 96px + tres comandos 46px). */
        @media (max-width: 800px) {
          :host {
            height: 100%;
            min-height: 0;
          }

          .sala-card {
            height: 100%;
            min-height: 0;
            display: grid;
            /* ANTERIOR (rollback):
               grid-template-columns: minmax(0, 1fr) minmax(138px, 44%); */
            /* NOVO (2026-07-22) — a divisoria da action-strip coincide com o
               eixo geometrico do card e com a separacao da grade abaixo. */
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: minmax(0, 1fr);
            /* ANTERIOR (rollback): column-gap: 9px; */
            column-gap: 0;
            padding: 10px 10px 10px 12px;
          }

          .hero-action {
            min-width: 0;
            width: 100%;
            height: 100%;
            min-height: 0;
            /* ANTERIOR (rollback):
               grid-template-columns: 82px minmax(0, 1fr) 32px; */
            /* NOVO (2026-07-22) — a trilha final reserva 8px de respiro
               entre temperatura/status e a divisoria central. */
            grid-template-columns: 82px minmax(0, 1fr) 40px;
            grid-template-rows: auto minmax(0, 1fr) auto auto;
            column-gap: 4px;
            padding: 0;
          }

          .room-icon {
            width: 80px;
            height: 54px;
            margin: 0;
          }

          /* Micromaquete V2 apenas no phone. A caixa do icone permanece
             80x54; a escala/offset reproduzem, proporcionalmente, o encaixe
             alfa medido e aprovado no bruno-room-tile do tablet. */
          .room-asset-wrap picture {
            display: contents;
          }

          .room-asset,
          .sala-card.is-room-on .room-asset-on {
            inset: auto;
            top: 0;
            left: 0;
            width: auto;
            /* ANTERIOR (rollback microajustes remanescentes): height: 111%; */
            /* Sala partia de uma caixa 80x54; 135% iguala a altura visual das
               micromaquetes dos demais comodos sem alterar o tablet. */
            height: 135%;
            aspect-ratio: 1 / 1;
            object-fit: contain;
            object-position: left top;
            transform: translate(-8.66%, -7.81%);
          }

          .sala-card.is-josh-theme .status-dot.is-active {
            background: rgba(var(--tone), var(--bruno-tile-status-dot-fill-alpha, 0.78));
            border: var(--bruno-tile-status-dot-border, 0);
            box-shadow: 0 0 var(--bruno-tile-status-dot-halo-size, 8px)
              rgba(var(--tone), var(--bruno-tile-status-dot-halo-alpha, 0.18));
          }

          .right-rail {
            width: 32px;
            /* ANTERIOR (rollback): herdava transform: translate(5px, -3px)
               do contrato desktop, aproximando a metrica da divisoria. */
            justify-self: start;
            transform: translate(0, -3px);
          }

          .room-nav-zone {
            min-height: 48px;
            padding-right: 8px;
          }

          .title {
            font-size: 14px;
          }

          .lights-line,
          .sala-card.has-status-stack .lights-line {
            max-height: 25px;
            font-size: 10.2px;
          }

          .action-strip {
            align-self: stretch;
            height: 100%;
            min-height: 0;
            grid-template-columns: minmax(0, 1fr);
            grid-template-rows: repeat(3, minmax(0, 1fr));
            border-left: 1px solid rgba(255,255,255,0.105);
            padding-left: 7px;
          }

          .command-row {
            height: auto;
            min-height: 44px;
            grid-template-columns: 30px minmax(0, 1fr) 32px;
            column-gap: 4px;
            padding: 0 0 0 2px;
          }

          .command-row::before {
            left: -1px;
            top: 10px;
            bottom: 10px;
          }

          .command-row::after {
            left: 34px;
            right: 34px;
          }

          .command-icon {
            width: 30px;
            height: 30px;
          }

          .command-copy {
            gap: 3px;
          }

          .command-name {
            font-size: 11.8px;
          }

          .command-category {
            font-size: 9.4px;
          }

          .command-state {
            width: 100%;
            padding-left: 2px;
            font-size: 9px;
            letter-spacing: 0.45px;
          }

          .command-row.icon-climate .command-copy {
            padding-left: 0;
          }
        }
      </style>

      <div class="sala-card${t}${a}${this._homeThemeClass()}">
        <button class="hero-action" type="button" data-action-key="room" aria-label="Sala">
          <div class="room-icon" aria-hidden="true">
            ${L._roomVisual(e.roomOn)}
          </div>

          <span class="room-nav-zone" data-room-nav role="button" tabindex="0" aria-label="Abrir ${L._escape(this._config.name)}">
            <span class="room-title-row">
              <span class="title">${L._escape(this._config.name)}</span>
              <span class="room-chevron" aria-hidden="true">&rsaquo;</span>
            </span>
            <span class="lights-line">${this._statusLines(e.statusLines)}</span>
          </span>

          <div class="right-rail" aria-label="Status da sala">
            <div class="metric" aria-label="Temperatura e umidade">
              <span class="metric-value">${e.temperature}</span>
              <span class="metric-sub">${e.humidity}</span>
            </div>
            <!-- ORIGINAL dots fixos (rollback rapido):
            \${this._statusDot('mdi:account', model.presenceOn, 'Presenca na Sala', 'blue')}
            \${this._statusDot('mdi:television-classic', model.tvOn, 'TV ativa', 'purple')}
            \${this._statusDot('mdi:snowflake', model.climateOn, 'Ar condicionado ativo', 'cyan')}
            \${this._statusDot('mdi:speaker-wireless', model.speakerOn, 'Echo Show ativo', 'amber')}
            FIM ORIGINAL -->
            <div class="status-stack">
              ${[
      { icon: "mdi:account", active: e.presenceOn, label: "Presenca na Sala", tone: "blue" },
      { icon: "mdi:television-classic", active: e.tvOn, label: "TV ativa", tone: "purple" },
      { icon: "mdi:snowflake", active: e.climateOn, label: "Ar condicionado ativo", tone: "cyan" },
      { icon: "mdi:speaker-wireless", active: e.speakerOn, label: "Echo Show ativo", tone: "amber" }
    ].filter((n) => n.active).map((n) => this._statusDot(n.icon, n.active, n.label, n.tone)).join("")}
            </div>
          </div>
        </button>

        <!-- ANTERIOR (rollback): icones SVG inline e categorias genericas.
        <div class="action-strip">
          \${this._actionButton('corridor', 'ledstrip', 'Corredor', model.corridorStateLabel, model.corridorOn, 'blue', { category: 'Iluminação' })}
          \${this._actionButton('tv', 'tv', 'TV', model.tvStateLabel, model.tvOn, 'purple', { animate: animateTv, category: 'Entretenimento' })}
          \${this._actionButton('climate', 'climate', 'A/C', model.climateStateLabel, model.climateOn, 'cyan', { category: 'Climatização' })}
        </div>
        -->
        <div class="action-strip">
          ${this._actionButton("corridor", "light_flush", "Corredor", e.corridorStateLabel, e.corridorOn, "blue", {
      semanticStatus: e.corridorSemanticStatus,
      ariaState: e.corridorOn ? "luz ligada" : "luz desligada",
      hybridTransition: r.corridor,
      now: i
    })}
          ${this._actionButton("tv", "tv", "TV", e.tvStateLabel, e.tvOn, "purple", {
      semanticStatus: e.tvSemanticStatus,
      ariaState: e.tvOn ? "ligada" : "desligada",
      hybridTransition: r.tv,
      now: i
    })}
          ${this._actionButton("climate", "climate", "A/C", e.climateStateLabel, e.climateEnabled, "cyan", {
      semanticStatus: e.acSemanticStatus,
      ariaName: "Ar-condicionado",
      ariaState: e.climateEnabled ? "ligado" : "desligado",
      hybridTransition: r.climate,
      now: i
    })}
        </div>
      </div>
    `, this.shadowRoot.querySelectorAll("[data-action-key]").forEach((n) => this._wireAction(n)), this._wireRoomNavZone(this.shadowRoot.querySelector("[data-room-nav]")), this._wireAssetFallback();
  }
  /* --- ORIGINAL _roomVisual (rollback rapido — assets nao-trimados) ---
  static _roomVisualOriginal(active) {
    return `
      <span class="room-asset-wrap">
        <span class="room-asset-fallback">${BrunoSalaCard._roomIcon(active)}</span>
        <img class="room-asset room-asset-off" src="/local/bruno-ui/assets/living-room-off.png?v=20260802-assets-resize-1" alt="" loading="eager" decoding="async">
        <img class="room-asset room-asset-on" src="/local/bruno-ui/assets/living-room-on.png?v=20260802-assets-resize-1" alt="" loading="eager" decoding="async">
      </span>
    `;
  }
  */
  // NOVO: assets tight (trim de borda transparente) — sofa ocupa ~100% do conteiner
  static _roomVisual(e) {
    return `
      <span class="room-asset-wrap">
        <span class="room-asset-fallback">${L._roomIcon(e)}</span>
        <picture>
          <!-- O source V2 e exclusivo do phone; o img preserva integralmente
               o asset anterior em tablet/desktop e funciona como rollback. -->
          <source media="(max-width: 800px)" srcset="/local/bruno-ui/assets/v2/sala-off.png?v=20260808-maquetes-premium-1">
          <img class="room-asset room-asset-off" src="/local/bruno-ui/assets/living-room-off-tight.png?v=20260802-assets-resize-1" alt="" loading="eager" decoding="async">
        </picture>
        <picture>
          <source media="(max-width: 800px)" srcset="/local/bruno-ui/assets/v2/sala-on.png?v=20260808-maquetes-premium-1">
          <img class="room-asset room-asset-on" src="/local/bruno-ui/assets/living-room-on-tight.png?v=20260802-assets-resize-1" alt="" loading="eager" decoding="async">
        </picture>
      </span>
    `;
  }
  static _roomIcon(e) {
    return `
      <svg viewBox="0 0 4.8 4.8" xmlns="http://www.w3.org/2000/svg" style="width:65px;height:65px;filter:${e ? "none" : "grayscale(1) contrast(0.4) brightness(0.8)"};display:block;">
        <path d="M.78 2.565H.69V.87C.69.75.75.51.975.51v.098C.78.608.78.855.78.871v1.695" fill="#666"/>
        <path d="M1.62.525a.81.81 0 0 0-.188-.09L1.313.052C1.298 0 1.171-.008 1.021.037s-.255.128-.24.18l.128.397S.811.786.804.846c-.022.12.045.472.045.472l1.05-.315c-.007-.007-.172-.39-.278-.48" fill="#94989b"/>
        <path d="M1.89.998c.03.105-.188.263-.472.345-.292.09-.547.075-.57-.03-.03-.105.188-.263.472-.345.285-.09.547-.075.57.03" fill="#ffe62e"/>
        <path d="M4.447 3.053a.15.15 0 0 1-.15.15H.502a.15.15 0 0 1-.15-.15v-.975a.15.15 0 0 1 .15-.15h3.803a.15.15 0 0 1 .15.15v.975z" fill="#42ade2"/>
        <path d="M4.447 3.053a.15.15 0 0 1-.15.15H.502a.15.15 0 0 1-.15-.15v-.975a.15.15 0 0 1 .15-.15h3.803a.15.15 0 0 1 .15.15v.975z" fill="#428bc1" opacity=".5"/>
        <path d="M3.375 3.203H.352V2.047s.6.69 3.022 1.155" fill="#428bc1"/>
        <path d="M4.672 2.288c0-.135-.098-.24-.225-.24-.12 0-.217.105-.217.24v.93c0 .135.098.24.217.24.12 0 .225-.105.225-.24v-.93" fill="#42ade2"/>
        <path fill="#8a8e92" d="M.457 4.485H.75V4.8H.457z"/>
        <path d="M3.375 4.485H.3c-.165 0-.3-.142-.3-.322s.135-.322.3-.322h3.075v.645m0-.646H.3c-.165 0-.3-.142-.3-.322s.135-.322.3-.322h3.075v.645" fill="#428bc1"/>
        <path fill="#8a8e92" d="M4.05 4.485h.292V4.8H4.05z"/>
        <path d="M1.425 3.84H4.5c.165 0 .3.142.3.322s-.135.322-.3.322H1.425v-.645" fill="#428bc1"/>
        <path d="M1.425 3.203H4.5c.165 0 .3.142.3.322s-.135.322-.3.322H1.425v-.645" fill="#428bc1"/>
        <path d="M.57 2.288c0-.135-.098-.24-.217-.24-.12 0-.217.105-.217.24v.93c0 .135.098.24.217.24.12 0 .217-.105.217-.24v-.93" fill="#42ade2"/>
        <path d="M4.53 1.965s-.217.187-.255.285c-.075.21-.022.667 0 .892.007.037.037.142.037.142s-.255-.068-.345-.083c-.172-.022-.51.015-.682 0-.075-.007-.3-.06-.3-.06s.195-.09.232-.15c.12-.186.143-.666.158-.891v-.128s.165.052.225.06c.165.015.51-.015.675-.03.06 0 .255-.037.255-.037" fill="#c7e755"/>
      </svg>
    `;
  }
  static _tplIcon(e) {
    const t = {
      living_sofa: "living_sofa",
      ledstrip: "ledstrip",
      tv: "tv",
      climate: "climate",
      motion: "motion",
      homepod: "homepod"
    }[e] || "living_sofa";
    return `<span class="tpl-icon">${globalThis.BrunoIcons?.render(t) || ""}</span>`;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
customElements.get(pt) || customElements.define(pt, L);
window.customCards = window.customCards || [];
window.customCards.push({
  type: pt,
  name: "Bruno Sala Card",
  preview: !1,
  description: "Isolated Bento Sala card with preserved Home Assistant actions and premium liquid glass visuals."
});
const ut = "bruno-activity-column", ea = {
  // Espelha a linha do hero em shell/section_home_v2.yaml. Se a régua do grid
  // mudar lá, mudar AQUI também (referência cruzada anotada nos dois arquivos).
  available_height: "calc(77vh - 154px)",
  max_per_column: 2,
  gap: 12,
  // REV.7 (2026-07-25) — TRAVA DE LARGURA REMOVIDA (0 = sem trava).
  // Era a ÚNICA coisa capaz de impedir a 2ª coluna, e dependia de medir o
  // host em tempo de execução — medida que falha silenciosamente quando o
  // elemento é avaliado antes do layout ou com a seção oculta (a shell
  // esconde seções com `hidden`). Como a área `dynamic` é uma coluna
  // PRÓPRIA do grid da seção (8 de 12 colunas), a coluna esquerda nunca
  // invade o hero — a trava protegia contra um risco que não existe.
  // Agora o comportamento é determinístico: a 2ª coluna sempre existe.
  // (Config mantida por compatibilidade; > 0 volta a travar.)
  second_column_min_width: 0,
  // Overlay de diagnóstico (largura/altura medidas + plano). Ligar com
  // `debug: true` no YAML quando algo não posicionar como esperado.
  debug: !1,
  slots: [
    {
      key: "camera",
      entity: "binary_sensor.home_activity_camera",
      height: 296,
      card: { type: "custom:bruno-home-camera-card" }
    },
    {
      key: "roborock",
      entity: "binary_sensor.home_activity_roborock",
      height: 176,
      card: { type: "custom:bruno-roborock-card", variant: "compact" }
    },
    {
      key: "media",
      entity: "binary_sensor.home_activity_media",
      height: 248,
      // ÚNICO card que aceita compressão (decisão do usuário 2026-07-25).
      min_height: 196,
      card: { type: "custom:bruno-media-card", variant: "wide" }
    }
  ]
}, ta = 260, aa = 220;
class Ve extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      ...ea,
      ...e || {},
      slots: Array.isArray(e?.slots) && e.slots.length ? e.slots : ea.slots
    }, this._cards = this._cards || /* @__PURE__ */ new Map(), this._wrappers = this._wrappers || /* @__PURE__ */ new Map(), this._activeSince = this._activeSince || /* @__PURE__ */ new Map(), this._visible = this._visible || /* @__PURE__ */ new Set(), this._enterTimers = this._enterTimers || /* @__PURE__ */ new Map(), this._exitTimers = this._exitTimers || /* @__PURE__ */ new Map(), this._renderShell(), this._ensureCards();
  }
  set hass(e) {
    this._hass = e, this._cards.forEach((t) => {
      try {
        t.hass = e;
      } catch {
      }
    }), this._update();
  }
  connectedCallback() {
    !this._resizeObserver && typeof ResizeObserver == "function" && (this._resizeObserver = new ResizeObserver(() => this._update()), this._resizeObserver.observe(this)), this._update(), globalThis.requestAnimationFrame?.(() => this._update());
  }
  disconnectedCallback() {
    this._resizeObserver?.disconnect(), this._resizeObserver = null, this._enterTimers.forEach((e) => window.clearTimeout(e)), this._enterTimers.clear(), this._exitTimers.forEach((e) => window.clearTimeout(e)), this._exitTimers.clear();
  }
  getCardSize() {
    return 8;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  async _ensureCards() {
    if (!this._creating) {
      this._creating = !0;
      try {
        const e = await globalThis.loadCardHelpers?.();
        if (!e?.createCardElement) throw new Error("loadCardHelpers indisponivel");
        this._config.slots.forEach((t) => {
          if (this._cards.has(t.key)) return;
          const a = this._wrappers.get(t.key);
          if (!a || !t.card) return;
          const i = e.createCardElement(t.card);
          this._hass && (i.hass = this._hass), a.appendChild(i), this._cards.set(t.key, i);
        });
      } catch (e) {
        console.warn("[bruno-activity-column] falha ao criar cards:", e);
      } finally {
        this._creating = !1, this._update();
      }
    }
  }
  // Lista de chaves ativas em ORDEM DE ATIVAÇÃO (mais antiga primeiro).
  _activeKeys() {
    const e = Date.now(), t = [];
    return this._config.slots.forEach((a) => {
      String(this._state(a.entity)?.state || "").toLowerCase() === "on" ? (this._activeSince.has(a.key) || this._activeSince.set(a.key, e), t.push(a.key)) : this._activeSince.delete(a.key);
    }), t.sort((a, i) => (this._activeSince.get(a) || 0) - (this._activeSince.get(i) || 0));
  }
  _slotConfig(e) {
    return this._config.slots.find((t) => t.key === e);
  }
  _slotEntry(e) {
    const t = this._slotConfig(e) || {}, a = Number(t.height) || 200, i = Math.min(Number(t.min_height) || a, a);
    return { key: e, height: a, minHeight: i };
  }
  // Altura mínima que uma coluna precisa para acomodar este conjunto.
  _columnMinHeight(e, t) {
    return e.length ? e.reduce((a, i) => a + this._slotEntry(i).minHeight, 0) + t * (e.length - 1) : 0;
  }
  // Distribui as chaves ativas em colunas. Map(key -> {column, row, height});
  // column 2 = coluna direita (principal), column 1 = coluna esquerda.
  //
  // REV.6 (2026-07-25) — CORREÇÃO: antes as colunas eram fatiadas por
  // CONTAGEM (2 primeiras à direita) e o que não coubesse em ALTURA era
  // DESCARTADO ali mesmo, sem nunca chegar à coluna esquerda. Numa janela
  // mais baixa que o tablet a coluna direita só comporta um card, então o
  // 3º card "substituía" o de cima em vez de abrir a 2ª coluna.
  // Agora é preenchimento sequencial: cada card entra na coluna atual
  // enquanto couber (contagem E altura); quando não cabe, TRANSBORDA para a
  // coluna seguinte. Descarte só se não houver mais coluna disponível.
  _plan(e, t) {
    const a = Number(this._config.gap) || 12, i = Math.max(1, Number(this._config.max_per_column) || 2), r = Number(this._config.second_column_min_width) || 0, s = r <= 0 || this.getBoundingClientRect().width >= r ? [2, 1] : [2], l = e.slice(), c = /* @__PURE__ */ new Map();
    return s.forEach((p) => {
      const d = [];
      for (; l.length && d.length < i; ) {
        const h = d.concat(l[0]);
        if (this._columnMinHeight(h, a) > t) break;
        d.push(l.shift());
      }
      !d.length && l.length && p === s[0] && d.push(l.shift()), this._fitColumn(d, t, a).forEach((h, b) => {
        c.set(h.key, {
          column: p,
          row: Math.max(1, i - b),
          height: h.height
        });
      });
    }), c;
  }
  // Ajusta as alturas de uma coluna ao espaço disponível. Só os slots com
  // min_height (hoje: mídia) encolhem; câmera e Roborock mantêm a altura.
  // A seleção de quem entra na coluna já foi feita em _plan.
  _fitColumn(e, t, a) {
    if (!e.length) return [];
    const i = e.map((p) => this._slotEntry(p)), r = a * Math.max(0, i.length - 1), n = i.reduce((p, d) => p + d.height, 0) + r;
    if (n <= t)
      return i.map(({ key: p, height: d }) => ({ key: p, height: d }));
    let s = n - t;
    const l = i.reduce((p, d) => p + (d.height - d.minHeight), 0), c = i.map((p) => {
      const d = p.height - p.minHeight;
      if (!d || !l) return { key: p.key, height: p.height };
      const h = Math.min(d, Math.round(d / l * s));
      return s -= h, { key: p.key, height: p.height - h };
    });
    return c.length === 1 && c[0].height > t && (c[0].height = Math.max(120, Math.floor(t))), c;
  }
  // REV.7: uma medição ruim (seção oculta pela shell, layout ainda não
  // resolvido) devolvia altura ~0 e derrubava cards do plano. Agora medidas
  // implausíveis são ignoradas e vale a última boa.
  _availableHeight(e = !1) {
    const t = Math.max(0, this.getBoundingClientRect().height);
    if (t >= 120)
      return this._lastGoodHeight = t, t;
    if (globalThis.matchMedia?.("(max-width: 800px)")?.matches === !0 && e) {
      const i = Number.parseFloat(String(this._config?.available_height || ""));
      return this._lastGoodHeight || (Number.isFinite(i) ? i : 300);
    }
    return this._lastGoodHeight || 0;
  }
  _update() {
    if (!this._config || !this.shadowRoot) return;
    const e = this._hass ? this._activeKeys() : [], t = this._availableHeight(e.length > 0), a = t > 0 ? this._plan(e, t) : /* @__PURE__ */ new Map();
    this._renderDebug(t, e, a), this._config.slots.forEach((r) => {
      const n = this._wrappers.get(r.key);
      if (!n) return;
      const s = a.get(r.key), l = this._visible.has(r.key);
      if (s) {
        const d = this._exitTimers.get(r.key);
        if (d && (window.clearTimeout(d), this._exitTimers.delete(r.key)), n.style.gridColumn = String(s.column), n.style.gridRow = String(s.row), n.style.height = `${s.height}px`, n.classList.remove("is-hidden", "is-leaving"), !l) {
          const h = this._enterTimers.get(r.key);
          h && window.clearTimeout(h), n.classList.remove("is-entering"), n.offsetWidth, n.classList.add("is-entering");
          const b = window.setTimeout(() => {
            n.classList.remove("is-entering"), this._enterTimers.delete(r.key);
          }, ta + 40);
          this._enterTimers.set(r.key, b);
        }
        this._visible.add(r.key);
        return;
      }
      if (!l) {
        n.classList.add("is-hidden");
        return;
      }
      this._visible.delete(r.key);
      const c = this._enterTimers.get(r.key);
      c && (window.clearTimeout(c), this._enterTimers.delete(r.key)), n.classList.remove("is-entering"), n.classList.add("is-leaving");
      const p = window.setTimeout(() => {
        n.classList.remove("is-leaving"), n.classList.add("is-hidden"), this._exitTimers.delete(r.key);
      }, aa);
      this._exitTimers.set(r.key, p);
    });
    const i = globalThis.matchMedia?.("(max-width: 800px)")?.matches === !0;
    this.classList.toggle("is-empty", i ? e.length === 0 : this._visible.size === 0);
  }
  // Overlay de diagnóstico (config `debug: true`). Mostra exatamente o que o
  // algoritmo mediu e decidiu — evita novo ciclo de tentativa e erro caso
  // algum card não apareça onde deveria.
  _renderDebug(e, t, a) {
    if (!this.shadowRoot) return;
    const i = this.shadowRoot.querySelector(".debug");
    if (!i) return;
    if (!this._config.debug) {
      i.textContent = "";
      return;
    }
    const r = Math.round(this.getBoundingClientRect().width), n = [...a.entries()].map(([l, c]) => `${l}:c${c.column}r${c.row}/${c.height}px`).join("  "), s = t.filter((l) => !a.has(l));
    i.textContent = [
      `host ${r}x${Math.round(e)}px`,
      `ativos: ${t.join(",") || "-"}`,
      `plano: ${n || "-"}`,
      s.length ? `DESCARTADOS: ${s.join(",")}` : ""
    ].filter(Boolean).join(" | ");
  }
  _renderShell() {
    if (this.shadowRoot || this.attachShadow({ mode: "open" }), this._shellReady) return;
    const e = Number(this._config.gap) || 12, t = Math.max(1, Number(this._config.max_per_column) || 2);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          position: relative;
          height: ${this._config.available_height};
          min-height: 0;
          /* O host cobre também a faixa da 2ª coluna (vazia na maior parte do
             tempo). pointer-events: none deixa o hero clicável por baixo; só
             os cards voltam a capturar o toque. */
          pointer-events: none;
        }

        * { box-sizing: border-box; }

        .columns {
          height: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(${t}, auto);
          /* Ancora a pilha na BASE (logo acima do bloco inferior). */
          align-content: end;
          align-items: end;
          gap: ${e}px;
        }

        .slot {
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          pointer-events: auto;
        }

        .slot.is-hidden {
          display: none;
        }

        .slot.is-entering {
          animation: brunoActivityIn ${ta}ms ease both;
        }

        .slot.is-leaving {
          animation: brunoActivityOut ${aa}ms ease both;
        }

        /* Os cards internos preenchem o slot (altura vem do wrapper). */
        .slot > * {
          display: block;
          height: 100%;
          min-height: 0;
        }

        @keyframes brunoActivityIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes brunoActivityOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(6px); }
        }

        @media (prefers-reduced-motion: reduce) {
          .slot.is-entering,
          .slot.is-leaving {
            animation: none !important;
          }
        }

        /* NOVO (2026-08-10) — MODO TELEFONE.
           No telefone a coluna vira uma FAIXA do empilhamento: uma coluna só,
           ancorada no topo, e colapsada quando não há nada ativo. A colocação
           calculada em _plan vem por estilo inline (grid-column/grid-row), daí
           o !important — é o único jeito de a media query vencer o inline.
           ROLLBACK: remover este bloco. O tablet não é tocado por ele. */
        @media (max-width: 800px) {
          :host(.is-empty) {
            height: 0;
          }
          .columns {
            grid-template-columns: minmax(0, 1fr);
            grid-auto-rows: auto;
            align-content: start;
            align-items: start;
          }
          .slot {
            grid-column: 1 / -1 !important;
            grid-row: auto !important;
          }
        }

        /* Overlay de diagnóstico (só com debug: true). */
        .debug {
          position: absolute;
          left: 0;
          right: 0;
          top: 0;
          z-index: 9;
          padding: 4px 8px;
          font: 600 10px/1.3 ui-monospace, monospace;
          color: rgba(255,255,255,0.92);
          background: rgba(0,0,0,0.62);
          border-radius: 8px;
          pointer-events: none;
          white-space: pre-wrap;
        }

        .debug:empty {
          display: none;
        }
      </style>

      <div class="columns" role="region" aria-label="Atividades da casa">
        ${this._config.slots.map((a) => `
          <div class="slot is-hidden" data-slot-key="${Ve._escapeAttr(a.key)}"></div>
        `).join("")}
      </div>
      <div class="debug" aria-hidden="true"></div>
    `, this._wrappers.clear(), this.shadowRoot.querySelectorAll("[data-slot-key]").forEach((a) => {
      this._wrappers.set(a.dataset.slotKey, a);
    }), this._shellReady = !0;
  }
  static _escapeAttr(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
customElements.get(ut) || customElements.define(ut, Ve);
const ht = "bruno-home-overflow-indicator", ia = /* @__PURE__ */ new Set([
  "",
  "off",
  "idle",
  "standby",
  "closed",
  "not_home",
  "unknown",
  "unavailable",
  "none"
]);
class Kr extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._overflowConfig = {
      rooms: Array.isArray(e?.rooms) ? e.rooms : [],
      dynamic_entities: Array.isArray(e?.dynamic_entities) ? e.dynamic_entities : []
    }, this.shadowRoot || this.attachShadow({ mode: "open" }), this._renderOverflow();
  }
  set hass(e) {
    this._overflowHass = e, this._renderOverflow(), this._alvoDeRolagem || this._ligarObservadorDeRolagem();
  }
  getCardSize() {
    return 1;
  }
  // ── NOVO (2026-08-16) — VISIBILIDADE CONTEXTUAL ─────────────────────────
  //
  // O indicador diz "ha mais coisa abaixo". Depois que o usuario rola e a
  // faixa aparece, a frase deixa de ser verdadeira e o elemento vira um
  // divisor no meio do grid. Entao ele so existe visualmente enquanto o
  // conteudo esta no topo.
  //
  // Por que ESCONDER e nao COLAPSAR: a linha de 14px e do grid, definida em
  // bento_comodos_matriz.yaml. Colapsa-la durante a rolagem faria a terceira
  // faixa saltar 22px para cima com o dedo na tela. Fica a linha vazia, que
  // le como respiro, e nao como divisor.
  //
  // ROLLBACK: remover connectedCallback, disconnectedCallback,
  // _ligarObservadorDeRolagem, _acharContainerDeRolagem, _aoRolar e a classe
  // is-scrolled do CSS.
  connectedCallback() {
    this._ligarObservadorDeRolagem();
  }
  disconnectedCallback() {
    this._alvoDeRolagem && (this._alvoDeRolagem.removeEventListener("scroll", this._aoRolar), this._alvoDeRolagem = null);
  }
  /**
   * Acha quem rola de verdade.
   *
   * O indicador vive dentro do shadow DOM de um custom element, dentro dos
   * wrappers do layout-card, dentro do shadow DOM da shell. Subir so por
   * parentElement para no primeiro shadow root — por isso o salto pelo host.
   */
  _acharContainerDeRolagem() {
    let e = this.parentNode;
    for (; e; ) {
      if (e instanceof ShadowRoot) {
        e = e.host;
        continue;
      }
      if (e instanceof HTMLElement) {
        const t = getComputedStyle(e);
        if (["auto", "scroll", "overlay"].includes(t.overflowY) && e.scrollHeight > e.clientHeight + 1) return e;
        e = e.parentNode;
        continue;
      }
      break;
    }
    return null;
  }
  /**
   * Liga o observador, e continua tentando ate achar quem rola.
   *
   * NAO usa requestAnimationFrame: com a aba em segundo plano ele nao dispara,
   * e o vinculo ficaria sem ser feito ate a aba voltar — o indicador
   * permaneceria aceso durante a rolagem. Como `set hass` e chamado a cada
   * atualizacao de estado, ele serve de nova tentativa, e o container aparece
   * assim que a secao monta.
   */
  _ligarObservadorDeRolagem() {
    if (!this.isConnected) return;
    this._aoRolar || (this._aoRolar = () => this._avaliarRolagem());
    const e = this._acharContainerDeRolagem();
    !e || this._alvoDeRolagem === e || (this._alvoDeRolagem && this._alvoDeRolagem.removeEventListener("scroll", this._aoRolar), this._alvoDeRolagem = e, e.addEventListener("scroll", this._aoRolar, { passive: !0 }), this._avaliarRolagem());
  }
  /**
   * Limiar de 6px: um toque que desloca a lista em um ou dois pixels nao e
   * "comecar a rolar", e piscar o indicador nesse caso seria pior que mante-lo.
   */
  _avaliarRolagem() {
    const e = (this._alvoDeRolagem?.scrollTop ?? 0) > 6;
    if (e === this._rolou) return;
    this._rolou = e;
    const t = this.shadowRoot?.querySelector(".indicator");
    t && (t.classList.toggle("is-scrolled", e), t.setAttribute("aria-hidden", e ? "true" : "false"));
  }
  _entityIsRelevant(e) {
    const t = e ? this._overflowHass?.states?.[e] : void 0;
    if (!t) return !1;
    const a = String(t.state || "").toLowerCase(), i = String(e).split(".")[0];
    return i === "binary_sensor" || i === "light" || i === "switch" ? a === "on" : i === "media_player" ? ["playing", "paused", "buffering", "on"].includes(a) : !ia.has(a);
  }
  _overflowModel() {
    const e = this._overflowConfig || { rooms: [], dynamic_entities: [] }, t = e.rooms.filter((i) => (Array.isArray(i?.entities) ? i.entities : []).some((n) => this._entityIsRelevant(n))).length, a = e.dynamic_entities.some((i) => this._entityIsRelevant(i));
    return t > 0 ? {
      active: !0,
      text: `atividade em ${t} ambiente${t === 1 ? "" : "s"} abaixo`
    } : a ? { active: !0, text: "atividade adicional abaixo" } : { active: !1, text: "mais ambientes abaixo" };
  }
  _renderOverflow() {
    if (!this.shadowRoot || !this._overflowConfig) return;
    const e = this._overflowModel();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: none;
          min-width: 0;
          background: transparent;
        }

        @media (max-width: 800px) {
          :host {
            width: 100%;
            height: 14px;
            min-height: 14px;
            display: block;
            pointer-events: none;
          }

          .indicator {
            width: 100%;
            height: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 9px;
            color: rgba(255,255,255,0.58);
            background: transparent;
            border: 0;
            box-shadow: none;
            font: 620 10.5px/14px system-ui, -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif;
            letter-spacing: 0.01em;
            white-space: nowrap;
          }

          .dot {
            width: 5px;
            height: 5px;
            flex: 0 0 5px;
            border-radius: 50%;
            background: rgba(255,255,255,0.34);
          }

          /* Rolou: some sem colapsar a linha do grid (ver comentario acima).
             A transicao curta evita o piscar quando o dedo vai e volta. */
          .indicator.is-scrolled {
            opacity: 0;
            visibility: hidden;
            transition: opacity 140ms ease, visibility 0s linear 140ms;
          }

          .indicator {
            transition: opacity 140ms ease;
          }

          .indicator.is-active .dot {
            background: #f7c600;
            box-shadow: 0 0 8px rgba(247,198,0,0.52);
          }

          ha-icon {
            width: 15px;
            height: 15px;
            flex: 0 0 15px;
            color: rgba(255,255,255,0.68);
          }
        }
      </style>
      <div class="indicator${e.active ? " is-active" : ""}${this._rolou ? " is-scrolled" : ""}" role="status" aria-live="polite" aria-hidden="${this._rolou ? "true" : "false"}">
        <span class="dot" aria-hidden="true"></span>
        <span>${Ve._escapeAttr(e.text)}</span>
        <ha-icon icon="mdi:chevron-down" aria-hidden="true"></ha-icon>
      </div>
    `;
  }
}
customElements.get(ht) || customElements.define(ht, Kr);
window.customCards = window.customCards || [];
window.customCards.push({
  type: ut,
  name: "Bruno Activity Column",
  preview: !1,
  description: "Home V2 dynamic activity area: bottom-anchored stack, max 2 per column, overflow to a second column."
});
window.customCards.push({
  type: ht,
  name: "Bruno Home Overflow Indicator",
  preview: !1,
  description: "Mobile-only semantic continuation line between visible and scroll-only room rows."
});
const bt = "bruno-cameras-card", ra = {
  name: "Cameras",
  active_entity: "input_select.bento_active_camera",
  cameras: [
    { entity: "camera.sl_camera_2", name: "Sala", short_name: "Sala" },
    { entity: "camera.vr_camera_2", name: "Varanda", short_name: "Varanda" },
    { entity: "camera.cz_camera_2", name: "Cozinha", short_name: "Cozinha" },
    { entity: "camera.as_camera_2", name: "Area de Servico", short_name: "Area" },
    { entity: "camera.of_camera_2", name: "Office", short_name: "Office" },
    { entity: "camera.camera_quarto_casal_2", name: "Quarto Casal", short_name: "QCasal" },
    { entity: "camera.qmi_camera_2", name: "Quarto Miguel", short_name: "QMiguel" },
    { entity: "camera.qma_camera_2", name: "Quarto Marina", short_name: "QMarina" }
  ]
}, Yr = ["streaming", "recording", "idle", "on"], Qr = ["unavailable", "unknown", ""], oa = 6500;
class y extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = this._normalizeConfig(e), this._refreshSeed = this._refreshSeed || Date.now(), this._safeRender(), this._startRefreshTimer();
  }
  set hass(e) {
    this._hass = e;
    const t = this._state(this._config?.active_entity)?.state;
    this._localActiveCamera && t === this._localActiveCamera && (this._localActiveCamera = null), this.shadowRoot?.querySelector(".cameras-card") && this._renderedWithHass ? this._updateStateOnly() : this._safeRender(), this._startRefreshTimer();
  }
  connectedCallback() {
    this._startRefreshTimer();
  }
  disconnectedCallback() {
    this._stopRefreshTimer();
  }
  getCardSize() {
    return 6;
  }
  _normalizeConfig(e) {
    return {
      ...ra,
      ...e || {},
      refresh_interval: Number(e?.refresh_interval) > 0 ? Number(e.refresh_interval) : oa,
      cameras: Array.isArray(e?.cameras) && e.cameras.length ? e.cameras : ra.cameras
    };
  }
  _safeRender() {
    try {
      this._render();
    } catch (e) {
      this._renderError(e);
    }
  }
  _updateStateOnly() {
    try {
      const e = this._model();
      if (e.activeId !== this._lastActiveId) {
        this._safeRender();
        return;
      }
      const t = e.activeCamera, a = this.shadowRoot.querySelector(".live-count");
      a && (a.innerHTML = `
          <span class="live-dot${e.onlineCount ? " is-online" : ""}"></span>
          ${e.onlineCount}/${e.totalCount} online
        `);
      const i = this.shadowRoot.querySelector(".title-sub");
      i && (i.textContent = t?.name || "");
      const r = this.shadowRoot.querySelector(".active-name");
      r && (r.textContent = t?.name || "Camera");
      const n = this.shadowRoot.querySelector(".active-status");
      n && (n.innerHTML = `
          <span class="status-dot${t?.online ? " is-online" : ""}" data-camera-status="${y._escapeAttr(t?.entity || "")}"></span>
          ${y._escape(t?.status || "Indisponivel")}
        `), e.cameras.forEach((s) => {
        const l = s.entity === e.activeId;
        this.shadowRoot.querySelectorAll(`.thumb-button[data-camera-id="${y._escapeAttr(s.entity)}"]`).forEach((c) => c.classList.toggle("is-active", l)), this.shadowRoot.querySelectorAll(`.camera-menu-option[data-camera-id="${y._escapeAttr(s.entity)}"]`).forEach((c) => c.classList.toggle("is-active", l)), this.shadowRoot.querySelectorAll(`img[data-camera-entity="${y._escapeAttr(s.entity)}"]`).forEach((c) => {
          s.image && (c.dataset.cameraSrcBase = s.image);
        }), this.shadowRoot.querySelectorAll(`.status-dot[data-camera-status="${y._escapeAttr(s.entity)}"]`).forEach((c) => c.classList.toggle("is-online", s.online));
      });
    } catch (e) {
      this._renderError(e);
    }
  }
  _startRefreshTimer() {
    if (this._refreshTimer || !this._config || !this.isConnected) return;
    const e = Math.max(4e3, Number(this._config.refresh_interval) || oa);
    this._refreshTimer = globalThis.setInterval(() => this._refreshCameraImages(), e);
  }
  _stopRefreshTimer() {
    this._refreshTimer && (globalThis.clearInterval(this._refreshTimer), this._refreshTimer = null);
  }
  _refreshCameraImages() {
    if (!this.shadowRoot || !this._hass || !globalThis.Image) return;
    const e = Date.now();
    this._refreshSeed = e, this.shadowRoot.querySelectorAll("img[data-camera-src-base]").forEach((t) => {
      const a = t.dataset.cameraSrcBase;
      if (!a) return;
      const i = y._withCacheBust(a, e), r = new globalThis.Image();
      r.onload = () => {
        t.src = i, t.dataset.hasLoaded = "true", t.classList.remove("is-hidden");
      }, r.src = i;
    });
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _cameraState(e) {
    const t = this._state(e.entity), a = t?.state || "", i = !t || Qr.includes(a), r = !i && Yr.includes(a);
    this._lastCameraImages = this._lastCameraImages || {};
    const n = t?.attributes?.entity_picture || "";
    n && (this._lastCameraImages[e.entity] = n);
    const s = n || this._lastCameraImages[e.entity] || "";
    return {
      ...e,
      entityObj: t,
      state: a,
      image: s,
      imageUrl: y._withCacheBust(s, this._refreshSeed || Date.now()),
      unavailable: i,
      online: r,
      status: y._statusLabel(a, i)
    };
  }
  _model() {
    const e = this._config.cameras.map((s) => this._cameraState(s)), t = this._state(this._config.active_entity)?.state, a = e[0]?.entity || "", i = this._localActiveCamera || (e.some((s) => s.entity === t) ? t : a), r = e.find((s) => s.entity === i) || e[0], n = e.filter((s) => s.online).length;
    return {
      cameras: e,
      activeCamera: r,
      activeId: i,
      onlineCount: n,
      totalCount: e.length
    };
  }
  _selectCamera(e) {
    !e || e === this._model().activeId || (this._localActiveCamera = e, this._cameraMenuOpen = !1, this._refreshSeed = Date.now(), this._safeRender(), this._callService("input_select", "select_option", {
      entity_id: this._config.active_entity,
      option: e
    }));
  }
  _openMoreInfo(e) {
    e && this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  _callService(e, t, a = {}) {
    !this._hass || !e || !t || this._hass.callService(e, t, a);
  }
  _openCamerasSection() {
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: { bruno_section: "cameras" },
      bubbles: !0,
      composed: !0
    }));
  }
  _wireActions(e) {
    const t = this.shadowRoot, a = t.querySelector(".preview-action");
    a?.addEventListener("click", (i) => {
      i.preventDefault(), i.stopPropagation(), this._openCamerasSection();
    }), a?.addEventListener("dblclick", (i) => {
      i.preventDefault(), i.stopPropagation(), this._openCamerasSection();
    }), a?.addEventListener("keydown", (i) => {
      i.key !== "Enter" && i.key !== " " || (i.preventDefault(), this._openCamerasSection());
    }), t.querySelectorAll(".thumb-button").forEach((i) => {
      const r = i.dataset.cameraId;
      i.addEventListener("click", (n) => {
        n.preventDefault(), n.stopPropagation(), this._selectCamera(r);
      }), i.addEventListener("keydown", (n) => {
        n.key !== "Enter" && n.key !== " " || (n.preventDefault(), this._selectCamera(r));
      });
    }), t.querySelector('[data-action="camera-menu"]')?.addEventListener("click", (i) => {
      i.preventDefault(), i.stopPropagation(), this._cameraMenuOpen = !this._cameraMenuOpen, this._safeRender();
    }), t.querySelectorAll(".camera-menu-option").forEach((i) => {
      const r = i.dataset.cameraId;
      i.addEventListener("click", (n) => {
        n.preventDefault(), n.stopPropagation(), this._selectCamera(r);
      }), i.addEventListener("keydown", (n) => {
        n.key !== "Enter" && n.key !== " " || (n.preventDefault(), this._selectCamera(r));
      });
    }), t.querySelectorAll("img").forEach((i) => {
      i.addEventListener("load", () => {
        i.dataset.hasLoaded = "true", i.classList.remove("is-hidden");
      }), i.addEventListener("error", () => {
        i.dataset.hasLoaded !== "true" && i.classList.add("is-hidden");
      });
    });
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._model(), t = e.activeCamera, a = this._config.variant === "single", i = a ? " is-single" : "", r = this._cameraMenuOpen ? " is-menu-open" : "", n = a && this._cameraMenuOpen ? `
        <div class="camera-menu" role="menu" aria-label="Selecionar camera">
          ${e.cameras.map((s) => y._menuOption(s, s.entity === e.activeId)).join("")}
        </div>
      ` : "";
    this._lastActiveId = e.activeId, this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 96, 165, 250;
          --accent-live: 34, 197, 94;
          --accent-idle: 148, 163, 184;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.64);
          --text-muted: rgba(226,232,240,0.44);
          display: block;
          height: 100%;
          min-height: 0;
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

        .cameras-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr) minmax(74px, 0.32fr);
          gap: 8px;
          padding: 12px;
          color: var(--text-main);
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
            radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%),
            linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
            linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.27),
            0 0 24px rgba(110,150,210,0.055)
          );
          overflow: hidden;
        }

        .cameras-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .card-header,
        .preview-action,
        .thumb-shell,
        .camera-menu {
          position: relative;
          z-index: 1;
        }

        .card-header {
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 2px;
        }

        .header-copy {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 24px;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: rgba(191,219,254,0.86);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .header-icon bruno-icon {
          --mdc-icon-size: 14px;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .title-main {
          font-size: 12px;
          line-height: 1;
          font-weight: 780;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
        }

        .title-sub {
          font-size: 10px;
          line-height: 1;
          font-weight: 620;
          color: var(--text-muted);
          white-space: nowrap;
        }

        .live-count {
          flex: 0 0 auto;
          height: 24px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border-radius: 999px;
          color: rgba(220,252,231,0.94);
          background: rgba(var(--accent-live),0.11);
          border: 1px solid rgba(var(--accent-live),0.22);
          box-shadow: 0 0 18px rgba(var(--accent-live),0.08), inset 0 1px 0 rgba(255,255,255,0.08);
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
        }

        .header-actions {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          flex: 0 0 auto;
        }

        .card-menu {
          appearance: none;
          -webkit-appearance: none;
          width: 28px;
          height: 28px;
          display: grid;
          place-items: center;
          padding: 0;
          border: 0;
          border-radius: 999px;
          color: rgba(255,255,255,0.62);
          background: transparent;
          outline: none;
        }

        .card-menu:hover,
        .card-menu.is-open {
          color: rgba(255,255,255,0.90);
          background: rgba(255,255,255,0.055);
        }

        .card-menu bruno-icon {
          --mdc-icon-size: 19px;
        }

        .live-dot,
        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgba(var(--accent-idle),0.85);
          box-shadow: 0 0 0 1px rgba(255,255,255,0.08);
        }

        .live-dot.is-online,
        .status-dot.is-online {
          background: rgb(var(--accent-live));
          box-shadow: 0 0 10px rgba(var(--accent-live),0.58);
        }

        .preview-action {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          height: 100%;
          min-height: 0;
          padding: 0;
          border: 0;
          outline: none;
          border-radius: 15px;
          overflow: hidden;
          background: transparent;
          text-align: left;
        }

        .media-frame {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 15px;
          background:
            radial-gradient(140px 120px at 20% 12%, rgba(255,255,255,0.09), transparent 70%),
            linear-gradient(145deg, rgba(15,23,42,0.88), rgba(2,6,23,0.78));
          border: 1px solid rgba(255,255,255,0.10);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.13),
            inset 0 -1px 0 rgba(0,0,0,0.26),
            0 12px 26px rgba(0,0,0,0.18);
          transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease, filter 180ms ease;
        }

        .preview-action:hover .media-frame,
        .preview-action:focus-visible .media-frame {
          border-color: rgba(var(--accent),0.40);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.15),
            inset 0 -1px 0 rgba(0,0,0,0.25),
            0 14px 30px rgba(0,0,0,0.22),
            0 0 24px rgba(var(--accent),0.13);
        }

        .preview-action:active .media-frame {
          transform: translateY(1px) scale(0.996);
        }

        .camera-image {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(1.03) contrast(1.02);
          transform: scale(1.002);
        }

        .media-frame.is-image-error .camera-image,
        .camera-image.is-hidden,
        .media-frame:not(.has-image) .camera-image {
          display: none;
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(226,232,240,0.28);
        }

        .camera-placeholder bruno-icon {
          --mdc-icon-size: 42px;
          filter: drop-shadow(0 12px 18px rgba(0,0,0,0.35));
        }

        .preview-scrim {
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(2,6,23,0.10), transparent 38%),
            linear-gradient(0deg, rgba(2,6,23,0.82), rgba(2,6,23,0.28) 36%, transparent 68%);
        }

        .preview-meta {
          position: absolute;
          left: 11px;
          right: 11px;
          bottom: 10px;
          display: flex;
          align-items: end;
          justify-content: space-between;
          gap: 12px;
          pointer-events: none;
        }

        .active-name {
          display: block;
          font-size: 17px;
          line-height: 1;
          font-weight: 780;
          color: rgba(255,255,255,0.96);
          text-shadow: 0 2px 12px rgba(0,0,0,0.54);
        }

        .active-status {
          margin-top: 5px;
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          line-height: 1;
          font-weight: 640;
          color: rgba(226,232,240,0.74);
          text-shadow: 0 2px 10px rgba(0,0,0,0.55);
        }

        .preview-badge {
          flex: 0 0 auto;
          min-width: 0;
          height: 27px;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 0 10px;
          border-radius: 999px;
          color: rgba(239,246,255,0.9);
          background: rgba(15,23,42,0.48);
          border: 1px solid rgba(255,255,255,0.14);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.12), 0 8px 16px rgba(0,0,0,0.20);
          backdrop-filter: blur(14px) saturate(1.25);
          -webkit-backdrop-filter: blur(14px) saturate(1.25);
          font-size: 10px;
          line-height: 1;
          font-weight: 720;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .preview-badge bruno-icon {
          --mdc-icon-size: 13px;
        }

        .thumb-shell {
          min-height: 0;
          border-radius: 14px;
          padding: 5px;
          background:
            radial-gradient(86px 58px at 14% 8%, rgba(255,255,255,0.10), transparent 72%),
            linear-gradient(170deg, rgba(255,255,255,0.08), rgba(255,255,255,0.034));
          border: 1px solid rgba(255,255,255,0.105);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.11), 0 9px 18px rgba(2,6,23,0.18);
          overflow: hidden;
        }

        .thumb-strip {
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-auto-flow: column;
          grid-auto-columns: calc((100% - 18px) / 4);
          gap: 6px;
          overflow-x: auto;
          overflow-y: hidden;
          scroll-snap-type: x mandatory;
          overscroll-behavior-x: contain;
          scrollbar-width: none;
        }

        .thumb-strip::-webkit-scrollbar {
          display: none;
        }

        .thumb-button {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          display: block;
          min-width: 0;
          height: 100%;
          padding: 0;
          border: 0;
          outline: none;
          background: transparent;
          scroll-snap-align: start;
        }

        .thumb-media {
          position: relative;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          border-radius: 10px;
          background:
            radial-gradient(54px 40px at 20% 10%, rgba(255,255,255,0.08), transparent 76%),
            rgba(16,22,32,0.78);
          border: 1px solid rgba(148,163,184,0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          transition: border-color 160ms ease, box-shadow 160ms ease, transform 160ms ease, filter 160ms ease;
        }

        .thumb-button:hover .thumb-media,
        .thumb-button:focus-visible .thumb-media {
          filter: brightness(1.06);
        }

        .thumb-button:active .thumb-media {
          transform: translateY(1px) scale(0.985);
        }

        .thumb-button.is-active .thumb-media {
          border-color: rgba(var(--accent),0.94);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.15),
            0 0 0 1px rgba(var(--accent),0.35),
            0 0 14px rgba(var(--accent),0.25);
        }

        .thumb-media img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          filter: saturate(0.98) contrast(1.02);
        }

        .thumb-media.is-image-error img,
        .thumb-media img.is-hidden,
        .thumb-media:not(.has-image) img {
          display: none;
        }

        .thumb-placeholder {
          position: absolute;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(226,232,240,0.25);
        }

        .thumb-placeholder bruno-icon {
          --mdc-icon-size: 22px;
        }

        .thumb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(0deg, rgba(2,6,23,0.78), rgba(2,6,23,0.16) 58%, transparent 100%);
          pointer-events: none;
        }

        .thumb-label {
          position: absolute;
          left: 5px;
          right: 5px;
          bottom: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          min-width: 0;
          pointer-events: none;
        }

        .thumb-name {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 720;
          color: rgba(255,255,255,0.92);
          text-shadow: 0 2px 8px rgba(0,0,0,0.58);
        }

        .thumb-label .status-dot {
          width: 6px;
          height: 6px;
          flex: 0 0 auto;
        }

        .cameras-card.is-single {
          grid-template-rows: auto minmax(0, 1fr);
          gap: 8px;
          padding: 12px;
        }

        .cameras-card.is-single .card-header {
          min-height: 28px;
        }

        .cameras-card.is-single .title-sub {
          display: none;
        }

        .cameras-card.is-single .preview-action {
          border-radius: 16px;
        }

        .cameras-card.is-single .media-frame {
          border-radius: 16px;
        }

        .cameras-card.is-single .preview-badge {
          display: none;
        }

        .cameras-card.is-single .active-status {
          color: rgba(226,232,240,0.82);
        }

        .camera-menu {
          position: absolute;
          top: 44px;
          right: 11px;
          z-index: 6;
          width: min(190px, calc(100% - 22px));
          max-height: calc(100% - 58px);
          display: grid;
          gap: 4px;
          padding: 6px;
          overflow: auto;
          border-radius: var(--bruno-liquid-cell-radius, 13px);
          background: var(--bruno-liquid-popup-background,
            linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
          );
          border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
          box-shadow: var(--bruno-liquid-popup-shadow,
            inset 0 1px 0 rgba(255,255,255,0.100),
            0 18px 36px rgba(0,0,0,0.300)
          );
          backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
          -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
        }

        .camera-menu-option {
          min-width: 0;
          min-height: 32px;
          display: grid;
          grid-template-columns: 16px minmax(0, 1fr) auto;
          align-items: center;
          gap: 7px;
          padding: 0 8px;
          border: 0;
          border-radius: 9px;
          background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
          color: rgba(255,255,255,0.82);
          text-align: left;
        }

        .camera-menu-option:hover,
        .camera-menu-option.is-active {
          color: rgba(255,255,255,0.98);
          background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
        }

        .camera-menu-option bruno-icon {
          --mdc-icon-size: 16px;
          color: rgba(255,255,255,0.68);
        }

        .camera-menu-option span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          line-height: 1;
          font-weight: 760;
        }

        @media (max-height: 760px) {
          .cameras-card {
            gap: 7px;
            padding: 10px;
            grid-template-rows: auto minmax(0, 1fr) minmax(68px, 0.30fr);
          }

          .active-name {
            font-size: 15px;
          }
        }

        @media (max-width: 800px) {
          :host {
            min-height: 320px;
          }

          .cameras-card {
            min-height: 320px;
            grid-template-rows: auto minmax(0, 1fr) 82px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .media-frame,
          .thumb-media {
            transition: none !important;
          }
        }
      </style>

      <div class="cameras-card${i}${r}">
        <div class="card-header">
          <div class="header-copy">
            <span class="header-icon" aria-hidden="true"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
            <span class="title">
              <span class="title-main">${y._escape(this._config.name)}</span>
              <span class="title-sub">${y._escape(t?.name || "")}</span>
            </span>
          </div>
          <span class="header-actions">
            <span class="live-count" title="${e.onlineCount} cameras online">
              <span class="live-dot${e.onlineCount ? " is-online" : ""}"></span>
              ${e.onlineCount}/${e.totalCount} online
            </span>
            ${a ? `
              <button class="card-menu${this._cameraMenuOpen ? " is-open" : ""}" type="button" data-action="camera-menu" aria-label="Selecionar camera" aria-expanded="${this._cameraMenuOpen ? "true" : "false"}">
                <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
              </button>
            ` : ""}
          </span>
        </div>

        <button class="preview-action" type="button" aria-label="${y._escape(t?.name || "Camera")}" tabindex="0">
          ${y._preview(t)}
        </button>

        ${a ? n : `
          <div class="thumb-shell" aria-label="Selecionar camera">
            <div class="thumb-strip">
              ${e.cameras.map((s) => y._thumbnail(s, s.entity === e.activeId)).join("")}
            </div>
          </div>
        `}
      </div>
    `, this._wireActions(e.activeId), this._renderedWithHass = !!this._hass;
  }
  _renderError(e) {
    this.shadowRoot || this.attachShadow({ mode: "open" }), console.error("[bruno-cameras-card]", e), this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          height: 100%;
          min-height: 0;
        }
        .error-card {
          height: 100%;
          min-height: 0;
          padding: 14px;
          border-radius: 18px;
          color: rgba(255,255,255,0.92);
          background: linear-gradient(160deg, rgba(60,20,28,0.70), rgba(20,20,30,0.58));
          border: 1px solid rgba(255,120,145,0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.14), 0 18px 44px rgba(0,0,0,0.24);
          overflow: hidden;
        }
        .error-title {
          display: block;
          font-size: 12px;
          line-height: 1.2;
          font-weight: 760;
        }
        .error-detail {
          display: block;
          margin-top: 8px;
          font-size: 11px;
          line-height: 1.35;
          color: rgba(255,255,255,0.62);
          word-break: break-word;
        }
      </style>
      <div class="error-card">
        <span class="error-title">Bruno Cameras Card</span>
        <span class="error-detail">${y._escape(e?.message || e || "Render error")}</span>
      </div>
    `;
  }
  static _preview(e) {
    const t = !!e?.image, a = e?.online ? " is-online" : "";
    return `
      <div class="media-frame${t ? " has-image" : ""}">
        ${t ? `<img class="camera-image" src="${y._escapeAttr(e.imageUrl || e.image)}" data-camera-src-base="${y._escapeAttr(e.image)}" data-camera-entity="${y._escapeAttr(e.entity)}" alt="">` : ""}
        <div class="camera-placeholder" aria-hidden="true"></div>
        <div class="preview-scrim"></div>
        <div class="preview-meta">
          <span>
            <span class="active-name">${y._escape(e?.name || "Camera")}</span>
            <span class="active-status">
              <span class="status-dot${a}" data-camera-status="${y._escapeAttr(e?.entity || "")}"></span>
              ${y._escape(e?.status || "Indisponivel")}
            </span>
          </span>

        </div>
      </div>
    `;
  }
  static _thumbnail(e, t) {
    const a = !!e.image, i = t ? " is-active" : "", r = e.online ? " is-online" : "";
    return `
      <button class="thumb-button${i}" type="button" data-camera-id="${y._escapeAttr(e.entity)}" aria-label="${y._escapeAttr(e.name)}">
        <span class="thumb-media${a ? " has-image" : ""}">
          ${a ? `<img src="${y._escapeAttr(e.imageUrl || e.image)}" data-camera-src-base="${y._escapeAttr(e.image)}" data-camera-entity="${y._escapeAttr(e.entity)}" alt="">` : ""}
          <span class="thumb-placeholder" aria-hidden="true"></span>
          <span class="thumb-overlay"></span>
          <span class="thumb-label">
            <span class="status-dot${r}" data-camera-status="${y._escapeAttr(e.entity)}"></span>
            <span class="thumb-name">${y._escape(e.short_name || e.name)}</span>
          </span>
        </span>
      </button>
    `;
  }
  static _menuOption(e, t) {
    const a = t ? " is-active" : "", i = e.online ? " is-online" : "";
    return `
      <button class="camera-menu-option${a}" type="button" role="menuitem" data-camera-id="${y._escapeAttr(e.entity)}" aria-label="${y._escapeAttr(e.name)}">
        <bruno-icon icon="mdi:cctv"></bruno-icon>
        <span>${y._escape(e.name || e.short_name || "Camera")}</span>
        <span class="status-dot${i}" data-camera-status="${y._escapeAttr(e.entity)}"></span>
      </button>
    `;
  }
  static _statusLabel(e, t) {
    return t ? "Indisponivel" : e === "streaming" ? "Ao vivo" : e === "recording" ? "Gravando" : e === "idle" || e === "on" ? "Online" : e === "off" || e === "standby" ? "Em espera" : e || "Online";
  }
  static _withCacheBust(e, t) {
    if (!e) return "";
    const a = e.includes("?") ? "&" : "?";
    return `${e}${a}bruno_refresh=${encodeURIComponent(t)}`;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return y._escape(e).replace(/'/g, "&#39;");
  }
}
customElements.get(bt) || customElements.define(bt, y);
window.customCards = window.customCards || [];
window.customCards.push({
  type: bt,
  name: "Bruno Cameras Card",
  preview: !1,
  description: "Isolated Bento cameras card with Home Assistant camera snapshots and Bruno liquid glass visuals."
});
const gt = "bruno-roborock-card", Xr = "20260606-main-view-4", Jr = {
  vacuum: "vacuum.roborock_s7",
  room: "sensor.roborock_s7_comodo_atual",
  battery: ["sensor.roborock_s7_bateria", "sensor.roborock_s7_battery"],
  area: ["sensor.roborock_s7_area_limpa", "sensor.roborock_s7_cleaning_area"],
  cleaning_time: ["sensor.roborock_s7_tempo_de_limpeza", "sensor.roborock_s7_cleaning_time"]
}, eo = ["cleaning", "moving", "returning", "segment_cleaning"], to = ["unknown", "unavailable", "none", ""];
class R extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    const t = {
      ...Jr,
      ...e?.entities || {}
    };
    this._config = {
      name: "Roborock",
      title: "Roborock S7",
      image: "/local/images/roborock_S7.png?v=20260702-all-images-1",
      ...e,
      entities: t
    }, this._render();
  }
  set hass(e) {
    this._hass = e, this._render();
  }
  getCardSize() {
    return 3;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isInvalid(e) {
    return e == null || to.includes(String(e).toLowerCase());
  }
  _entityList(e) {
    return Array.isArray(e) ? e : e ? [e] : [];
  }
  _firstValid(e) {
    for (const t of this._entityList(e)) {
      const a = this._state(t);
      if (a && !this._isInvalid(a.state)) return a.state;
    }
    return null;
  }
  _number(e, t = "--") {
    if (this._isInvalid(e)) return t;
    const a = Number(e);
    return Number.isFinite(a) ? a : t;
  }
  _model() {
    const e = this._config.entities, t = this._state(e.vacuum), a = t?.state || "unknown", i = eo.includes(a), r = {
      cleaning: "Limpando",
      returning: "Retornando",
      docked: "Na base",
      idle: "Parado",
      paused: "Parado",
      moving: "Em movimento",
      segment_cleaning: "Limpando"
    }, n = {
      cleaning: "Limpeza em andamento",
      returning: "Voltando para a base",
      docked: "Pronto para limpar",
      idle: "Aguardando comando",
      paused: "Pausado",
      moving: "Reposicionando",
      segment_cleaning: "Limpeza por comodo"
    }, s = this._state(e.room)?.state, l = this._isInvalid(s) ? "--" : s;
    let c = t?.attributes?.battery_level;
    this._isInvalid(c) && (c = this._firstValid(e.battery)), c = this._number(c);
    let p = t?.attributes?.cleaning_area;
    this._isInvalid(p) && (p = this._firstValid(e.area)), p = this._number(p);
    let d = t?.attributes?.cleaning_time;
    return this._isInvalid(d) && (d = this._firstValid(e.cleaning_time)), d = this._number(d), typeof d == "number" && d > 300 && (d /= 60), {
      active: i,
      cleaning: ["cleaning", "segment_cleaning"].includes(a),
      state: a,
      status: r[a] || a || "Indisponivel",
      detail: n[a] || "Aguardando status",
      room: l,
      battery: typeof c == "number" ? `${Math.round(c)}%` : "--",
      area: typeof p == "number" ? `${Number(p).toFixed(1).replace(".0", "")}m²` : "--m²",
      time: typeof d == "number" ? `${Number(d).toFixed(1).replace(".0", "")} min` : "-- min",
      stateMetric: a === "docked" ? "Idle" : this._isInvalid(a) ? "Indisp." : r[a] || a || "--"
    };
  }
  _callService(e, t = {}, a = {}) {
    if (!this._hass || !e) return;
    const [i, r] = e.split(".");
    if (!i || !r) return;
    const n = { ...t };
    a?.entity_id != null && n.entity_id == null && (n.entity_id = a.entity_id), this._hass.callService(i, r, n, a);
  }
  _runVacuumAction(e) {
    const t = e?.dataset?.service;
    if (!t) return;
    const a = Date.now(), i = Number(e.dataset.lastRunAt || 0);
    a - i < 650 || (e.dataset.lastRunAt = String(a), globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._callService(t, {}, { entity_id: this._config.entities.vacuum }));
  }
  _openPopup() {
    const e = this._config.entities;
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: {
        action: "fire-dom-event",
        browser_mod: {
          service: "browser_mod.popup",
          data: {
            title: this._config.title,
            size: "wide",
            content: {
              type: "entities",
              entities: [
                e.vacuum,
                e.room
              ]
            }
          }
        }
      },
      bubbles: !0,
      composed: !0
    }));
  }
  _wireActions() {
    const e = this.shadowRoot.querySelector(".roborock-card");
    e?.addEventListener("click", (a) => {
      a.target?.closest?.("[data-service]") || this._openPopup();
    }), e?.addEventListener("keydown", (a) => {
      a.key !== "Enter" && a.key !== " " || (a.preventDefault(), this._openPopup());
    }), this.shadowRoot.querySelectorAll("[data-service]").forEach((a) => {
      let i = 0;
      const r = (n) => {
        n.preventDefault(), n.stopPropagation();
      };
      a.addEventListener("pointerdown", (n) => {
        r(n), a.classList.add("is-pressed"), a.setPointerCapture?.(n.pointerId);
      }), a.addEventListener("pointerup", (n) => {
        r(n), a.classList.remove("is-pressed"), a.releasePointerCapture?.(n.pointerId), i = Date.now(), this._runVacuumAction(a);
      }), a.addEventListener("pointercancel", () => {
        a.classList.remove("is-pressed");
      }), a.addEventListener("pointerleave", () => {
        a.classList.remove("is-pressed");
      }), a.addEventListener("click", (n) => {
        r(n), !(Date.now() - i < 420) && this._runVacuumAction(a);
      }), a.addEventListener("keydown", (n) => {
        n.key !== "Enter" && n.key !== " " || (r(n), this._runVacuumAction(a));
      });
    });
    const t = this.shadowRoot.querySelector(".robot img");
    t?.addEventListener("error", () => {
      t.closest(".robot")?.classList.add("is-fallback"), t.setAttribute("hidden", "");
    }, { once: !0 });
  }
  _assetUrl(e) {
    return e ? `${e}${String(e).includes("?") ? "&" : "?"}v=${Xr}` : "";
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._model(), t = e.active ? " is-active" : "", a = e.cleaning ? " is-cleaning" : "", i = this._config.variant === "compact" ? " is-compact" : "";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 150, 190, 255;
          --accent-purple: 167, 139, 250;
          --accent-warm: 255, 166, 72;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.66);
          --text-muted: rgba(226,232,240,0.46);
          display: block;
          height: 100%;
          min-height: 0;
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

        .roborock-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: 138px minmax(0, 1fr);
          grid-template-rows: 44px minmax(0, 1fr) 46px;
          grid-template-areas:
            "header stats"
            "icon status"
            "icon actions";
          gap: 8px 5px;
          padding: 13px 14px 13px 12px;
          color: var(--text-main);
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
            radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%),
            linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
            linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.27),
            0 0 24px rgba(110,150,210,0.055)
          );
          overflow: hidden;
        }

        .roborock-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .roborock-card::after {
          content: "";
          position: absolute;
          inset: 30px 44px 16px 122px;
          z-index: 0;
          pointer-events: none;
          opacity: 0.48;
          background:
            radial-gradient(circle at 58% 48%, rgba(96,165,250,0.95) 0 3px, rgba(96,165,250,0.32) 4px, transparent 13px),
            radial-gradient(circle at 58% 48%, rgba(96,165,250,0.18), transparent 30px),
            linear-gradient(90deg, transparent 0 19%, rgba(255,255,255,0.085) 19.4% 19.9%, transparent 20.4% 100%),
            linear-gradient(90deg, transparent 0 53%, rgba(255,255,255,0.070) 53.4% 53.9%, transparent 54.4% 100%),
            linear-gradient(90deg, transparent 0 78%, rgba(255,255,255,0.060) 78.4% 78.9%, transparent 79.4% 100%),
            linear-gradient(0deg, transparent 0 31%, rgba(255,255,255,0.075) 31.4% 31.9%, transparent 32.4% 100%),
            linear-gradient(0deg, transparent 0 67%, rgba(255,255,255,0.064) 67.4% 67.9%, transparent 68.4% 100%),
            linear-gradient(135deg, transparent 0 43%, rgba(96,165,250,0.115) 43.4% 44%, transparent 44.6% 100%);
          filter: blur(0.05px);
          -webkit-mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
          mask-image: linear-gradient(90deg, transparent, black 12%, black 88%, transparent);
        }

        .roborock-card.is-cleaning {
          background: var(--bruno-liquid-surface-on-background,
            radial-gradient(170px 134px at 12% -10%, rgba(255,255,255,0.30), rgba(255,255,255,0.082) 52%, transparent 75%),
            radial-gradient(165px 148px at 98% 94%, rgba(135,185,245,0.16), transparent 68%),
            linear-gradient(180deg, rgba(255,255,255,0.165), rgba(255,255,255,0.052) 43%, rgba(255,255,255,0.078)),
            linear-gradient(155deg, rgba(18,24,36,0.68), rgba(11,14,22,0.56) 49%, rgba(33,27,25,0.30))
          );
        }

        .roborock-card.is-cleaning::before {
          opacity: 0.86;
        }

        .roborock-card.is-compact {
          grid-template-columns: minmax(98px, 0.48fr) minmax(0, 1fr) minmax(82px, 0.42fr);
          grid-template-rows: 28px minmax(0, 1fr) 42px;
          grid-template-areas:
            "header header header"
            "icon status stats"
            "icon actions actions";
          gap: 7px 12px;
          padding: 12px 13px 12px 12px;
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(150px 105px at 14% 0%, rgba(255,255,255,0.13), transparent 72%),
            linear-gradient(155deg, rgba(18,24,36,0.56), rgba(11,14,22,0.50) 50%, rgba(33,27,25,0.26))
          );
        }

        .roborock-card.is-compact::after {
          display: none;
        }

        .roborock-card.is-compact .header {
          height: 28px;
        }

        .roborock-card.is-compact .robot {
          width: min(110px, 100%);
          height: min(110px, 100%);
          justify-self: center;
          align-self: center;
          transform: none;
        }

        .roborock-card.is-compact .robot img {
          width: min(106px, 100%);
          height: min(106px, 100%);
        }

        .roborock-card.is-compact .robot-fallback {
          --mdc-icon-size: 72px;
        }

        .roborock-card.is-compact .status {
          align-self: center;
          justify-content: center;
          gap: 5px;
          padding: 0 12px 0 0;
          transform: none;
        }

        .roborock-card.is-compact .status-main {
          font-size: 17px;
        }

        .roborock-card.is-compact .status-detail {
          display: none;
        }

        .roborock-card.is-compact .location {
          font-size: 11px;
        }

        .roborock-card.is-compact .stats {
          align-self: stretch;
          display: flex;
          justify-content: center;
          align-items: center;
          padding-left: 14px;
          border-left: 1px solid rgba(255,255,255,0.090);
          transform: none;
        }

        .roborock-card.is-compact .stats .stat:nth-child(n+2) {
          display: none;
        }

        .roborock-card.is-compact .stat {
          height: auto;
          justify-content: center;
        }

        .roborock-card.is-compact .stat bruno-icon {
          --mdc-icon-size: 28px;
        }

        .roborock-card.is-compact .stat-value {
          font-size: 17px;
        }

        .roborock-card.is-compact .stat-label {
          font-size: 10px;
        }

        .roborock-card.is-compact .actions {
          align-self: stretch;
          gap: 10px;
          padding-top: 10px;
          border-top: 1px solid rgba(255,255,255,0.085);
          transform: none;
        }

        .roborock-card.is-compact .action {
          height: 36px;
          border-radius: var(--bruno-liquid-control-radius, 14px);
        }

        .roborock-card.is-compact .action bruno-icon {
          --mdc-icon-size: 20px;
        }

        .header,
        .robot,
        .status,
        .stats,
        .actions {
          position: relative;
          z-index: 1;
        }

        .header {
          grid-area: header;
          align-self: start;
          display: flex;
          align-items: center;
          justify-content: flex-start;
          gap: 10px;
          min-width: 0;
          height: 26px;
        }

        .header-copy {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: rgba(191,219,254,0.86);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .header-icon bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title-main {
          font-size: 13px;
          line-height: 1.05;
          font-weight: 800;
          color: rgba(255,255,255,0.93);
        }

        .state-pill {
          height: 25px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border-radius: 999px;
          color: rgba(255,222,178,0.94);
          background:
            radial-gradient(28px 18px at 20% 20%, rgba(255,255,255,0.17), transparent 72%),
            rgba(var(--accent-warm),0.090);
          border: 1px solid rgba(var(--accent-warm),0.22);
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          white-space: nowrap;
        }

        .state-dot {
          width: 7px;
          height: 7px;
          border-radius: 999px;
          background: rgb(var(--accent-warm));
          box-shadow: 0 0 12px rgba(var(--accent-warm),0.48);
        }

        .robot {
          grid-area: icon;
          align-self: center;
          justify-self: start;
          width: 150px;
          height: 150px;
          display: grid;
          place-items: center;
          transform: translate(-7px, -5px);
        }

        .robot img {
          width: 146px;
          height: 146px;
          display: block;
          object-fit: contain;
          filter: none !important;
          box-shadow: none !important;
        }

        .robot-fallback {
          display: none;
          --mdc-icon-size: 110px;
          color: rgba(226,232,240,0.68);
        }

        .robot.is-fallback .robot-fallback {
          display: block;
        }

        .is-active .robot img,
        .is-active .robot-fallback {
          animation: bruno-roborock-drift 5s ease-in-out infinite;
        }

        .status {
          grid-area: status;
          align-self: center;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding-left: 0;
          transform: translateX(-5px);
        }

        .status-main {
          min-width: 0;
          font-size: 19px;
          line-height: 1.08;
          font-weight: 760;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .status-detail {
          min-width: 0;
          font-size: 12px;
          line-height: 1;
          font-weight: 650;
          color: rgba(255,205,132,0.88);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          line-height: 1;
          font-weight: 620;
          color: var(--text-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .location bruno-icon {
          --mdc-icon-size: 15px;
          flex: 0 0 auto;
        }

        .stats {
          grid-area: stats;
          align-self: start;
          justify-self: stretch;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          align-items: start;
          gap: 4px;
          transform: translateX(-5px);
        }

        .stat {
          min-width: 0;
          height: 44px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          gap: 1px;
          padding: 0;
          color: rgba(255,255,255,0.88);
          background: transparent;
          border: 0;
          box-shadow: none;
          overflow: visible;
          text-shadow: 0 1px 8px rgba(0,0,0,0.34);
        }

        .stat bruno-icon {
          --mdc-icon-size: 18px;
          color: rgba(255,222,178,0.92);
          filter: drop-shadow(0 0 8px rgba(255,171,72,0.22));
        }

        .stat-value {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12.6px;
          line-height: 1.03;
          font-weight: 760;
        }

        .stat-label {
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 9px;
          line-height: 1.05;
          font-weight: 680;
          color: rgba(226,232,240,0.68);
        }

        .actions {
          grid-area: actions;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 6px;
          align-self: end;
          justify-content: stretch;
          min-width: 0;
          transform: translateX(-5px);
        }

        .action {
          width: 100%;
          height: 46px;
          min-width: 0;
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          gap: 0;
          padding: 0;
          border-radius: 15px;
          border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.14));
          background: var(--bruno-liquid-control-background, rgba(255,255,255,0.06));
          box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.10));
          color: rgba(255,255,255,0.72);
          outline: none;
          transition: transform 160ms ease, filter 160ms ease, background 160ms ease, border-color 160ms ease;
        }

        .action.primary {
          color: rgba(245,250,255,0.98);
          background: var(--bruno-liquid-selected-blue-background,
            radial-gradient(circle at 50% 18%, rgba(155,190,255,0.54), transparent 62%),
            linear-gradient(180deg, rgba(105,150,230,0.68), rgba(59,92,178,0.54))
          );
          border-color: var(--bruno-liquid-selected-blue-border, rgba(210,228,255,0.38));
          box-shadow: var(--bruno-liquid-selected-blue-shadow,
            inset 0 1px 0 rgba(255,255,255,0.32),
            0 0 20px rgba(96,165,250,0.32)
          );
        }

        .action:hover {
          filter: brightness(1.08);
        }

        .action:active {
          transform: translateY(1px) scale(0.985);
        }

        .action.is-pressed {
          transform: translateY(1px) scale(0.985);
        }

        .action bruno-icon {
          --mdc-icon-size: 23px;
        }

        .action span {
          display: none;
        }

        @keyframes bruno-roborock-drift {
          0%, 100% { transform: rotate(-4deg) translateX(-1px); }
          50% { transform: rotate(4deg) translateX(1px); }
        }

        @media (max-height: 760px) {
          .roborock-card {
            padding: 12px 12px 12px 10px;
            grid-template-columns: 128px minmax(0, 1fr);
            grid-template-rows: 42px minmax(0, 1fr) 42px;
            grid-template-areas:
              "header stats"
              "icon status"
              "icon actions";
            gap: 7px 5px;
          }

          .robot {
            width: 138px;
            height: 138px;
            transform: translate(-7px, -4px);
          }

          .robot img {
            width: 132px;
            height: 132px;
          }

          .stat {
            height: 42px;
          }

          .stat bruno-icon {
            --mdc-icon-size: 17px;
          }

          .stat-value {
            font-size: 12px;
          }

          .stat-label {
            font-size: 8.7px;
          }

          .action {
            height: 44px;
          }

          .roborock-card.is-compact {
            grid-template-columns: minmax(86px, 0.42fr) minmax(0, 1fr) minmax(74px, 0.38fr);
            grid-template-rows: 26px minmax(0, 1fr) 36px;
            grid-template-areas:
              "header header header"
              "icon status stats"
              "icon actions actions";
            gap: 6px 9px;
            padding: 10px 11px;
          }

          .roborock-card.is-compact .robot {
            width: min(92px, 100%);
            height: min(92px, 100%);
            transform: none;
          }

          .roborock-card.is-compact .robot img {
            width: min(88px, 100%);
            height: min(88px, 100%);
          }

          .roborock-card.is-compact .status-main {
            font-size: 15px;
          }

          .roborock-card.is-compact .action {
            height: 32px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .robot img,
          .robot-fallback,
          .action {
            animation: none !important;
            transition: none !important;
          }
        }
      </style>

      <div class="roborock-card${t}${a}${i}" role="button" tabindex="0" aria-label="${R._escape(this._config.title)}">
        <div class="header">
          <span class="header-copy">
            <span class="header-icon" aria-hidden="true"><bruno-icon icon="mdi:robot-vacuum"></bruno-icon></span>
            <span class="title-main">${R._escape(this._config.name)}</span>
          </span>
        </div>

        <div class="robot" aria-hidden="true">
          <img src="${R._escapeAttr(this._assetUrl(this._config.image))}" alt="">
          <bruno-icon class="robot-fallback" icon="mdi:robot-vacuum"></bruno-icon>
        </div>

        <div class="status">
          <div class="status-main">${R._escape(e.status)}</div>
          <div class="status-detail">${R._escape(e.detail)}</div>
          <div class="location">
            <bruno-icon icon="mdi:map-marker-radius-outline"></bruno-icon>
            <span>${R._escape(e.room)}</span>
          </div>
        </div>

        <div class="stats">
          ${this._stat("mdi:lightning-bolt", e.battery, "Bateria")}
          ${this._stat("mdi:cube-outline", e.area, "Area limpa")}
          ${this._stat("mdi:timer-outline", e.time, "Tempo")}
          ${this._stat("mdi:pulse", e.stateMetric, "Status")}
        </div>

        <div class="actions">
          ${this._action("vacuum.start", "mdi:play", "Iniciar", !0)}
          ${this._action("vacuum.stop", "mdi:stop", "Parar")}
          ${this._action("vacuum.return_to_base", "mdi:home-map-marker", "Base")}
        </div>
      </div>
    `, this._wireActions();
  }
  _stat(e, t, a) {
    return `
      <div class="stat">
        <bruno-icon icon="${e}"></bruno-icon>
        <span class="stat-value">${R._escape(t)}</span>
        <span class="stat-label">${R._escape(a)}</span>
      </div>
    `;
  }
  _action(e, t, a, i = !1) {
    return `
      <button class="action${i ? " primary" : ""}" type="button" data-service="${e}" aria-label="${R._escapeAttr(a)}">
        <bruno-icon icon="${t}"></bruno-icon>
        <span>${R._escape(a)}</span>
      </button>
    `;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return R._escape(e).replace(/'/g, "&#39;");
  }
}
customElements.get(gt) || customElements.define(gt, R);
window.customCards = window.customCards || [];
window.customCards.push({
  type: gt,
  name: "Bruno Roborock Card",
  preview: !1,
  description: "Isolated Bento Roborock card with preserved vacuum actions and Bruno liquid glass visuals."
});
const mt = "bruno-home-camera-card", tt = {
  name: "Monitoramento",
  active_entity: "input_select.bento_active_camera",
  refresh_interval: 6500,
  // ANTERIOR (rollback ONVIF geral): cameras usavam os oito IDs Tuya *_2.
  // O inventario completo permanece no rollback desta rodada.
  cameras: [
    { entity: "camera.sl_camera_profile_1", name: "Sala", short_name: "Sala" },
    { entity: "camera.vr_camera_profile_1", name: "Varanda", short_name: "Varanda" },
    { entity: "camera.cz_camera_profile_1", name: "Cozinha", short_name: "Cozinha" },
    { entity: "camera.as_camera_profile_1", name: "Area de Servico", short_name: "Area" },
    { entity: "camera.of_camera_profile_1", name: "Office", short_name: "Office" },
    { entity: "camera.qc_camera_profile_1", name: "Quarto Casal", short_name: "Q. Casal" },
    { entity: "camera.qmi_camera_profile_1", name: "Quarto Miguel", short_name: "Q. Miguel" },
    { entity: "camera.qma_camera_profile_1", name: "Quarto Marina", short_name: "Q. Marina" }
  ]
}, ao = ["streaming", "recording", "idle", "on"], io = ["unavailable", "unknown", ""], ro = 3e4;
class E extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      ...tt,
      ...e || {},
      cameras: Array.isArray(e?.cameras) && e.cameras.length ? e.cameras : tt.cameras,
      refresh_interval: Number(e?.refresh_interval) > 0 ? Number(e.refresh_interval) : tt.refresh_interval
    }, this._refreshSeed = this._refreshSeed || Date.now(), this._lastCameraImages = this._lastCameraImages || {}, this._cameraBaseUrls = this._cameraBaseUrls || {}, this._loadedCameraUrls = this._loadedCameraUrls || {}, this._cameraLoads = this._cameraLoads || {}, this._liveState = this._liveState || "idle", this._liveBlockedEntity = this._liveBlockedEntity || "", this._liveLoadToken = this._liveLoadToken || 0, this._boundDialogClosed = this._boundDialogClosed || ((t) => this._handleDialogClosed(t)), this._menuOpen = !1, this._render(), this._startRefreshTimer();
  }
  set hass(e) {
    this._hass = e;
    const t = this._state(this._config?.active_entity)?.state;
    this._localActiveCamera && t === this._localActiveCamera && (this._localActiveCamera = "");
    const a = this._model(), i = this._renderSignature(a);
    !this.shadowRoot || this._lastRenderSignature !== i ? this._render() : this._syncDynamic(a), this._startRefreshTimer();
  }
  connectedCallback() {
    this._liveState = "idle", this._liveBlockedEntity = "", this._listeningDialogClosed || (globalThis.addEventListener?.("dialog-closed", this._boundDialogClosed, !0), this._listeningDialogClosed = !0), this._startRefreshTimer(), this._mountLiveFeed(this._model().activeCamera);
  }
  disconnectedCallback() {
    this._liveLoadToken++, this._stopRefreshTimer(), this._stopLiveFeed(), this._listeningDialogClosed && (globalThis.removeEventListener?.("dialog-closed", this._boundDialogClosed, !0), this._listeningDialogClosed = !1), this._liveResumeTimer && globalThis.clearTimeout(this._liveResumeTimer), this._liveResumeTimer = null;
  }
  getCardSize() {
    return 3;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isUnavailable(e) {
    return !e || io.includes(String(e.state || "").toLowerCase());
  }
  _cameraState(e) {
    const t = this._state(e.entity), a = String(t?.state || "").toLowerCase(), i = this._isUnavailable(t), r = !i && ao.includes(a), n = t?.attributes?.entity_picture || "";
    n && (this._lastCameraImages[e.entity] = n);
    const s = n || this._lastCameraImages[e.entity] || `/api/camera_proxy/${e.entity}`;
    return this._cameraBaseUrls[e.entity] !== s && (this._cameraBaseUrls[e.entity] = s, delete this._loadedCameraUrls[e.entity]), {
      ...e,
      entityObj: t,
      state: a,
      unavailable: i,
      online: r,
      image: s,
      imageUrl: this._loadedCameraUrls[e.entity] || E._withCacheBust(s, this._refreshSeed || Date.now()),
      status: r ? "Ao vivo" : i ? "Indisponivel" : "Online"
    };
  }
  _model() {
    const e = (this._config.cameras || []).map((s) => this._cameraState(s)), t = this._state(this._config.active_entity)?.state, a = e[0]?.entity || "", i = this._localActiveCamera || (e.some((s) => s.entity === t) ? t : a), r = e.find((s) => s.entity === i) || e[0], n = e.filter((s) => s.online).length;
    return {
      cameras: e,
      activeCamera: r,
      activeId: i,
      onlineCount: n,
      totalCount: e.length
    };
  }
  _renderSignature(e) {
    const t = (e?.cameras || []).map((a) => `${a.unavailable ? "u" : "a"}${a.online ? "1" : "0"}`).join("");
    return `${e?.activeId || ""}|${t}`;
  }
  _selectCamera(e) {
    e && (this._liveLoadToken++, this._liveState = "idle", this._liveBlockedEntity = "", this._localActiveCamera = e, this._menuOpen = !1, this._refreshSeed = Date.now(), this._render(), this._config.active_entity && this._hass?.callService("input_select", "select_option", {
      entity_id: this._config.active_entity,
      option: e
    }));
  }
  _openMoreInfo(e) {
    e && (this._liveLoadToken++, this._liveState = "handed-off", globalThis.BrunoCameraLive?.marcar?.(e, "entregue ao more-info"), this._stopLiveFeed(), this._refreshCameraImages(), this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: e },
      bubbles: !0,
      composed: !0
    })));
  }
  _handleDialogClosed(e) {
    if (e?.detail?.dialog !== "ha-more-info-dialog" || this._liveState !== "handed-off") return;
    const t = this._model()?.activeCamera?.entity || "";
    this._liveState = "resuming", globalThis.BrunoCameraLive?.marcar?.(t, "more-info fechado; retomando"), this._liveResumeTimer && globalThis.clearTimeout(this._liveResumeTimer), this._liveResumeTimer = globalThis.setTimeout(() => {
      this._liveResumeTimer = null, !(!this.isConnected || this._liveState !== "resuming") && (this._liveState = "idle", this._liveBlockedEntity = "", this._mountLiveFeed(this._model().activeCamera));
    }, 700);
  }
  /**
   * Monta o player WebRTC final do HA sem passar pelo seletor hui-image.
   * A ordem e deliberada: conecta ao DOM, espera o primeiro update Lit consumir
   * os contextos do HA e so depois atribui entityid.
   */
  _mountLiveFeed(e) {
    const t = e?.entity || "", a = t ? this.shadowRoot?.querySelector(`[data-camera-live="${t}"]`) : null;
    if (this._liveState === "fallback" && this._liveBlockedEntity !== t && (this._liveState = "idle", this._liveBlockedEntity = ""), !this.isConnected || !a || e?.unavailable || ["loading-player", "handed-off", "resuming", "fallback"].includes(this._liveState)) {
      this._stopLiveFeed();
      return;
    }
    if (!this._liveEl || this._liveEntity !== t) {
      if (this._stopLiveFeed(), !globalThis.customElements?.get("ha-web-rtc-player")) {
        this._liveState = "loading-player";
        const r = ++this._liveLoadToken, n = globalThis.BrunoCameraLive?.garantirPlayer;
        if (typeof n != "function") {
          this._liveState = "fallback", this._liveBlockedEntity = t;
          return;
        }
        Promise.resolve(n(t, this._hass)).then((s) => {
          !this.isConnected || r !== this._liveLoadToken || (this._liveState = s ? "idle" : "fallback", this._liveBlockedEntity = s ? "" : t, this._mountLiveFeed(this._model().activeCamera));
        });
        return;
      }
      const i = globalThis.BrunoCameraLive?.criarPlayer?.() || document.createElement("ha-web-rtc-player");
      this._liveState = "negotiating", i.classList.add("camera-live-el"), i.setAttribute("muted", ""), i.setAttribute("playsinline", ""), i.setAttribute("autoplay", "");
      try {
        i.fitMode = "cover";
      } catch {
      }
      this._liveLoadHandler = () => this._markLiveReady(), this._liveStreamsHandler = (r) => {
        r?.detail?.hasVideo === !1 && this._failLiveFeed(t, "sem video");
      }, i.addEventListener("load", this._liveLoadHandler), i.addEventListener("streams", this._liveStreamsHandler), this._liveEl = i, this._liveEntity = t, a.appendChild(i), this._startLivePlayerAfterContext(i, t);
      return;
    }
    this._liveEl.parentElement !== a && a.appendChild(this._liveEl), this._liveEl.entityid !== t && (this._liveEl.entityid = t);
  }
  _startLivePlayerAfterContext(e, t) {
    Promise.resolve(e.updateComplete).then(() => {
      this._liveEl !== e || this._liveEntity !== t || !e.isConnected || (this._liveStartedAt = globalThis.performance?.now?.() || Date.now(), e.entityid = t, globalThis.BrunoCameraLive?.marcar?.(t, "entityid atribuido"), this._liveTimer = globalThis.setTimeout(() => {
        this._liveEl === e && this._liveEntity === t && this._liveReady !== t && this._failLiveFeed(t, "prazo");
      }, ro));
    }).catch(() => {
      this._liveEl === e && this._liveEntity === t && this._failLiveFeed(t, "contexto");
    });
  }
  _markLiveReady() {
    const e = this._liveEl, t = this._liveEntity, a = e?.shadowRoot?.querySelector("video");
    if (!(!e || !t || !a || a.readyState < 2 || this._liveReady === t)) {
      if (globalThis.BrunoCameraLive?.pareceQuadroVerde?.(a)) {
        if (this._liveGreenMarked !== t) {
          this._liveGreenMarked = t;
          const i = globalThis.performance?.now?.() || Date.now();
          globalThis.BrunoCameraLive?.marcar?.(
            t,
            "quadro verde rejeitado",
            i - (this._liveStartedAt || i),
            !1
          );
        }
        this._liveGreenTimer && globalThis.clearTimeout(this._liveGreenTimer), this._liveGreenTimer = globalThis.setTimeout(() => {
          this._liveGreenTimer = null, this._markLiveReady();
        }, 700);
        return;
      }
      this._liveReady = t, this._liveState = "live", this._liveGreenTimer && globalThis.clearTimeout(this._liveGreenTimer), this._liveGreenTimer = null, e.classList.add("is-ready"), this._liveTimer && globalThis.clearTimeout(this._liveTimer), this._liveTimer = null;
    }
  }
  _failLiveFeed(e, t = "falha") {
    if (!e || e !== this._liveEntity) return;
    const a = globalThis.performance?.now?.() || Date.now();
    globalThis.BrunoCameraLive?.marcar?.(
      e,
      t,
      a - (this._liveStartedAt || a),
      !1
    ), this._liveState = "fallback", this._liveBlockedEntity = e, this._stopLiveFeed(), this._refreshCameraImages();
  }
  _stopLiveFeed() {
    this._liveTimer && globalThis.clearTimeout(this._liveTimer), this._liveTimer = null, this._liveGreenTimer && globalThis.clearTimeout(this._liveGreenTimer), this._liveGreenTimer = null;
    const e = this._liveEl;
    e && (this._liveLoadHandler && e.removeEventListener("load", this._liveLoadHandler), this._liveStreamsHandler && e.removeEventListener("streams", this._liveStreamsHandler), e.remove()), this._liveEl = null, this._liveEntity = "", this._liveReady = "", this._liveGreenMarked = "", this._liveLoadHandler = null, this._liveStreamsHandler = null;
  }
  _startRefreshTimer() {
    if (this._refreshTimer || !this._config || !this.isConnected) return;
    const e = Math.max(4e3, Number(this._config.refresh_interval) || 6500);
    this._refreshTimer = globalThis.setInterval(() => this._refreshCameraImages(), e);
  }
  _stopRefreshTimer() {
    this._refreshTimer && (globalThis.clearInterval(this._refreshTimer), this._refreshTimer = null);
  }
  _refreshCameraImages() {
    if (!this.shadowRoot || !this._hass || !globalThis.Image) return;
    const e = Date.now();
    this._refreshSeed = e, this.shadowRoot.querySelectorAll("img[data-camera-src-base]").forEach((t) => {
      const a = t.dataset.cameraSrcBase, i = t.dataset.cameraEntity;
      if (!a || !i || this._liveReady === i || this._cameraLoads[i]) return;
      const r = E._withCacheBust(a, e), n = new globalThis.Image();
      this._cameraLoads[i] = n, n.onload = () => {
        if (delete this._cameraLoads[i], globalThis.BrunoCameraLive?.pareceQuadroVerde?.(n)) {
          globalThis.BrunoCameraLive?.marcar?.(i, "snapshot verde rejeitado", 0, !1);
          return;
        }
        this._loadedCameraUrls[i] = r, !(!t.isConnected || t.dataset.cameraEntity !== i) && (t.src = r, t.dataset.hasLoaded = "true", t.classList.remove("is-hidden"));
      }, n.onerror = () => {
        delete this._cameraLoads[i];
      }, n.src = r;
    });
  }
  _syncDynamic(e = this._model()) {
    if (!this.shadowRoot || !e?.activeCamera) return;
    const t = this.shadowRoot.querySelector(".online-chip");
    if (t) {
      t.classList.toggle("is-online", e.onlineCount > 0);
      const r = t.querySelector(".online-count");
      r && (r.textContent = `${e.onlineCount}/${e.totalCount || 0} online`);
    }
    const a = this.shadowRoot.querySelector(".camera-row-copy span");
    a && (a.lastChild.textContent = e.activeCamera.status || "Online", a.querySelector(".live-dot")?.classList.toggle("is-muted", !e.activeCamera.online));
    const i = this.shadowRoot.querySelector("img[data-camera-entity]");
    i && e.activeCamera.image && i.dataset.cameraSrcBase !== e.activeCamera.image && (i.dataset.cameraSrcBase = e.activeCamera.image, this._refreshCameraImages()), this._mountLiveFeed(e.activeCamera);
  }
  _wireActions(e) {
    const t = this.shadowRoot;
    t.querySelector(".camera-main")?.addEventListener("click", (a) => {
      a.preventDefault(), a.stopPropagation(), this._openMoreInfo(e);
    }), t.querySelector('[data-action="camera-menu"]')?.addEventListener("click", (a) => {
      a.preventDefault(), a.stopPropagation(), this._menuOpen = !this._menuOpen, this._render();
    }), t.querySelectorAll("[data-camera-id]").forEach((a) => {
      a.addEventListener("click", (i) => {
        i.preventDefault(), i.stopPropagation(), this._selectCamera(a.dataset.cameraId);
      });
    }), t.querySelectorAll("img[data-camera-src-base]").forEach((a) => {
      a.addEventListener("load", () => {
        a.dataset.hasLoaded = "true", a.classList.remove("is-hidden");
      }), a.addEventListener("error", () => {
        a.dataset.hasLoaded !== "true" && a.classList.add("is-hidden");
      });
    });
  }
  _cameraFrame(e) {
    if (!e)
      return `
        <div class="camera-row-image">
          <div class="camera-placeholder" aria-hidden="true"></div>
        </div>
      `;
    const t = e?.imageUrl || "", a = e?.image || "";
    return `
      <div class="camera-row-image">
        <div class="camera-live-slot" data-camera-live="${E._escapeAttr(e.entity)}" aria-hidden="true"></div>
        ${t ? `<img src="${E._escapeAttr(t)}" data-camera-src-base="${E._escapeAttr(a)}" data-camera-entity="${E._escapeAttr(e.entity)}" alt="">` : ""}
        <div class="camera-placeholder" aria-hidden="true"></div>
      </div>
    `;
  }
  _renderCameraFeed(e) {
    const t = e?.short_name || e?.name || "Camera", a = !e || e.unavailable, i = e?.online ? "" : " is-muted", r = e?.status || "Online";
    return `
      <button class="${[
      "camera-main",
      "camera-feed",
      a ? "is-unavailable" : ""
    ].filter(Boolean).join(" ")}" type="button" aria-label="Abrir camera ${E._escapeAttr(t)}">
        ${a ? `
          <div class="camera-state-surface">
            <bruno-icon icon="mdi:video-off-outline"></bruno-icon>
            <span>Imagem indisponivel</span>
          </div>
        ` : ""}
        ${this._cameraFrame(e)}
        <div class="camera-row-copy">
          <strong>${E._escape(t)}</strong>
          <span><i class="live-dot${i}" aria-hidden="true"></i>${E._escape(r)}</span>
        </div>

      </button>
    `;
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._model();
    this._lastRenderedActiveId = e.activeId, this._lastRenderSignature = this._renderSignature(e);
    const t = e.activeCamera || {}, a = `${e.onlineCount}/${e.totalCount || 0} online`, i = e.onlineCount > 0 ? " is-online" : "", r = this._menuOpen ? `
      <div class="mh-overflow-panel" role="menu" aria-label="Selecionar camera">
        ${e.cameras.map((n) => E._menuOption(n, n.entity === e.activeId)).join("")}
      </div>
    ` : "";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 18px);
          /* ANTERIOR: --accent: var(--bruno-liquid-warm-accent, 242,194,102); (ambar — cameras deve ser azul, padronizacao) */
          --accent: 180, 215, 255;
          --accent-live: var(--bruno-liquid-green-accent, 46,231,122);
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        button {
          appearance: none;
          -webkit-appearance: none;
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .glass-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: 44px minmax(0, 1fr);
          gap: 0;
          padding: 0;
          color: rgba(255,255,255,0.92);
          overflow: hidden;
          border-radius: var(--card-radius);
          background: var(--bruno-liquid-surface-off-background,
            linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)),
            rgba(9,11,15,0.105)
          );
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
          box-shadow: var(--bruno-liquid-surface-off-shadow, inset 0 1px 0 rgba(255,255,255,0.090), 0 10px 28px rgba(0,0,0,0.145));
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
        }

        .glass-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            linear-gradient(180deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00) 42%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10);
        }

        .mh-head,
        .camera-stage,
        .mh-overflow-panel {
          position: relative;
          z-index: 1;
        }

        .mh-head {
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 10px 0 14px;
        }

        .mh-head-title {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .micro-icon {
          width: 28px;
          height: 28px;
          flex: 0 0 28px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(var(--accent),0.92);
          background: rgba(var(--accent),0.10);
          border: 1px solid rgba(var(--accent),0.28);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .micro-icon bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
        }

        .module-title {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,0.93);
          font-size: 13px;
          line-height: 1.05;
          font-weight: 800;
          text-shadow: 0 1px 2px rgba(0,0,0,0.34);
        }

        .head-right {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .online-chip {
          flex: 0 0 auto;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: rgba(255,255,255,0.62);
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          white-space: nowrap;
        }

        .online-chip.is-online {
          color: rgba(201,255,221,0.92);
        }

        .live-dot {
          width: 7px;
          height: 7px;
          flex: 0 0 7px;
          border-radius: 999px;
          background: rgb(var(--accent-live));
          box-shadow: 0 0 9px rgba(var(--accent-live),0.64);
        }

        .live-dot.is-muted {
          background: rgba(255,255,255,0.34);
          box-shadow: none;
        }

        .mh-menu {
          width: 30px;
          height: 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          border: 0;
          border-radius: 9px;
          color: rgba(255,255,255,0.52);
          background: transparent;
        }

        .mh-menu bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
        }

        .mh-menu:hover,
        .mh-menu.is-active {
          color: rgba(255,255,255,0.86);
          background: rgba(255,255,255,0.072);
        }

        .camera-stage {
          min-height: 0;
          height: 100%;
          padding: 0 10px 10px;
        }

        .camera-feed {
          position: relative;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: block;
          padding: 0;
          border: 0;
          border-radius: calc(var(--card-radius) - 7px);
          background: transparent;
          color: inherit;
          overflow: hidden;
          outline: none;
        }

        .camera-feed:focus-visible {
          box-shadow: inset 0 0 0 1px rgba(138,196,255,0.42);
        }

        .camera-row-image {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
          background:
            radial-gradient(160px 120px at 18% 12%, rgba(255,255,255,0.045), transparent 70%),
            rgba(255,255,255,0.018);
        }

        .camera-live-slot {
          position: absolute;
          inset: 0;
          z-index: 2;
          overflow: hidden;
          pointer-events: none;
        }

        .camera-live-slot:empty { display: none; }

        .camera-live-slot > *,
        .camera-live-el {
          display: block;
          width: 100% !important;
          height: 100% !important;
        }

        .camera-live-el {
          opacity: 0;
          transition: opacity 160ms ease;
        }

        .camera-live-el.is-ready { opacity: 1; }

        .camera-row-image img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
          filter: saturate(1.02) contrast(1.02);
          transform: scale(1.002);
          z-index: 1;
        }

        .camera-row-image img.is-hidden,
        .camera-feed.is-unavailable .camera-row-image img {
          opacity: 0;
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: rgba(226,232,240,0.30);
        }

        .camera-placeholder bruno-icon {
          --mdc-icon-size: 42px;
        }

        .camera-feed::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, rgba(4,8,16,0.06), transparent 35%),
            linear-gradient(0deg, rgba(4,8,16,0.58), transparent 46%);
        }

        .camera-row-copy {
          position: absolute;
          z-index: 3;
          left: 14px;
          right: 14px;
          bottom: 13px;
          min-width: 0;
          display: grid;
          gap: 3px;
          color: rgba(255,255,255,0.92);
          text-align: left;
        }

        .camera-row-copy strong,
        .camera-row-copy span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.58);
        }

        .camera-row-copy strong {
          font-size: 15px;
          line-height: 1.08;
          font-weight: 800;
        }

        .camera-row-copy span {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          color: rgba(255,255,255,0.74);
        }


        .camera-state-surface {
          position: absolute;
          inset: 0;
          z-index: 5;
          display: grid;
          place-items: center;
          align-content: center;
          gap: 8px;
          padding: 16px;
          color: rgba(255,255,255,0.78);
          text-align: center;
          background: rgba(255,255,255,0.025);
          backdrop-filter: blur(8px) saturate(0.9);
          -webkit-backdrop-filter: blur(8px) saturate(0.9);
        }

        .camera-state-surface bruno-icon {
          --mdc-icon-size: 32px;
          color: rgba(255,255,255,0.64);
        }

        .camera-state-surface span {
          font-size: 12px;
          font-weight: 760;
          line-height: 1.1;
        }

        .mh-overflow-panel {
          position: absolute;
          top: 42px;
          right: 10px;
          width: min(250px, calc(100% - 20px));
          max-height: calc(100% - 52px);
          display: grid;
          gap: 4px;
          padding: 7px;
          overflow: auto;
          border-radius: var(--bruno-liquid-cell-radius, 13px);
          background: var(--bruno-liquid-popup-background,
            linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
          );
          border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
          box-shadow: var(--bruno-liquid-popup-shadow,
            inset 0 1px 0 rgba(255,255,255,0.100),
            0 18px 36px rgba(0,0,0,0.300)
          );
          backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
          -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
        }

        .camera-option {
          min-width: 0;
          min-height: 34px;
          display: grid;
          grid-template-columns: 18px minmax(0, 1fr) auto;
          align-items: center;
          gap: 8px;
          padding: 0 9px;
          border: 0;
          border-radius: 9px;
          background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
          color: rgba(255,255,255,0.82);
          text-align: left;
        }

        .camera-option:hover,
        .camera-option.is-active {
          color: rgba(255,255,255,0.98);
          background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
        }

        .camera-option bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-status, 15px);
        }

        .camera-option span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          line-height: 1;
          font-weight: 760;
        }

        @media (max-height: 760px) {
          .module-title {
            font-size: 13px;
          }

          .camera-row-copy strong {
            font-size: 13px;
          }

          .online-chip {
            font-size: 9px;
          }
        }
      </style>

      <section class="glass-card cameras-card">
        <div class="mh-head cameras-head">
          <div class="mh-head-title">
            <span class="micro-icon"><bruno-icon icon="mdi:cctv"></bruno-icon></span>
            <div class="module-title">${E._escape(this._config.name || "Monitoramento")}</div>
          </div>
          <div class="head-right">
            <span class="online-chip${i}"><span class="online-count">${E._escape(a)}</span><i class="live-dot${i ? "" : " is-muted"}" aria-hidden="true"></i></span>
            <button
              type="button"
              class="mh-menu${this._menuOpen ? " is-active" : ""}"
              data-action="camera-menu"
              title="Selecionar camera"
              aria-label="Selecionar camera"
              aria-expanded="${this._menuOpen ? "true" : "false"}"
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </div>
        </div>

        <div class="camera-stage">
          ${this._renderCameraFeed(t)}
        </div>
        ${r}
      </section>
    `, this._wireActions(e.activeId), this._mountLiveFeed(e.activeCamera);
  }
  static _menuOption(e, t) {
    const a = t ? " is-active" : "", i = e.online ? "" : " is-muted";
    return `
      <button class="camera-option${a}" type="button" role="menuitem" data-camera-id="${E._escapeAttr(e.entity)}">
        <bruno-icon icon="mdi:cctv"></bruno-icon>
        <span>${E._escape(e.name || e.short_name || "Camera")}</span>
        <i class="live-dot${i}" aria-hidden="true"></i>
      </button>
    `;
  }
  static _withCacheBust(e, t) {
    if (!e) return "";
    const a = String(e).includes("?") ? "&" : "?";
    return `${e}${a}bruno_refresh=${encodeURIComponent(t)}`;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return E._escape(e).replace(/'/g, "&#39;");
  }
}
customElements.get(mt) || customElements.define(mt, E);
window.customCards = window.customCards || [];
window.customCards.push({
  type: mt,
  name: "Bruno Home Camera Card",
  preview: !1,
  description: "Single camera card for the Bruno home bento grid."
});
const ft = "bruno-energy-card", oo = {
  period: "input_select.periodo_energia_dashboard",
  total: "sensor.energia_total_casa_periodo_atual",
  daily: "sensor.potencia_total_casa",
  weekly: "sensor.energia_total_casa_semanal",
  monthly: "sensor.energia_total_casa_mensal",
  daily_total: "sensor.energia_total_casa_diaria",
  weekly_total: "sensor.energia_total_casa_semanal",
  monthly_total: "sensor.energia_total_casa_mensal"
}, at = [
  {
    option: "Diário",
    button: "Dia",
    label: "Diário",
    entityKey: "daily",
    unit: "W",
    hours: 24,
    lowerBound: -150,
    aggregate: "raw",
    totalEntityKey: "daily_total",
    comparisonLabel: "ontem"
  },
  {
    option: "Semanal",
    button: "Semana",
    label: "Semanal",
    entityKey: "weekly",
    unit: "kWh",
    hours: 168,
    lowerBound: -0.05,
    aggregate: "day-max",
    totalEntityKey: "weekly_total",
    comparisonLabel: "semana anterior"
  },
  {
    option: "Mensal",
    button: "Mês",
    label: "Mensal",
    entityKey: "monthly",
    unit: "kWh",
    hours: 720,
    lowerBound: -0.05,
    aggregate: "day-max",
    totalEntityKey: "monthly_total",
    comparisonLabel: "mês anterior"
  }
], no = ["unknown", "unavailable", "none", ""], so = 60 * 1e3;
class D extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  connectedCallback() {
    this._render();
  }
  setConfig(e) {
    const t = {
      ...oo,
      ...e?.entities || {}
    };
    this._config = {
      name: "Energia",
      ...e,
      entities: t
    }, this._historyCache = this._historyCache || {}, this._render();
  }
  set hass(e) {
    this._hass = e, this._render();
  }
  getCardSize() {
    return 3;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isInvalid(e) {
    return e == null || no.includes(String(e).toLowerCase());
  }
  _activePeriod() {
    const e = this._state(this._config.entities.period)?.state;
    return at.find((t) => t.option === e) || at[0];
  }
  _model() {
    const e = this._activePeriod(), t = this._state(this._config.entities.total)?.state, a = this._isInvalid(t) ? 0 : Number(t), i = this._config.entities[e.entityKey], r = this._state(i)?.state, n = this._isInvalid(r) ? null : Number(r), l = this._state(this._config.entities[e.totalEntityKey])?.attributes?.last_period, c = this._isInvalid(l) ? null : Number(l), p = this._historyKey(e, i), d = this._historyCache?.[p]?.points || [];
    return {
      period: e,
      graphEntity: i,
      cacheKey: p,
      total: Number.isFinite(a) ? a : 0,
      graphCurrent: Number.isFinite(n) ? n : null,
      previousTotal: Number.isFinite(c) ? c : null,
      points: d
    };
  }
  _historyKey(e, t) {
    return `${e.option}:${t || ""}`;
  }
  _selectPeriod(e) {
    !this._hass || !e || this._hass.callService("input_select", "select_option", {
      entity_id: this._config.entities.period,
      option: e
    });
  }
  _wireActions() {
    this.shadowRoot.querySelectorAll("[data-energy-option]").forEach((e) => {
      e.addEventListener("click", (t) => {
        t.preventDefault(), t.stopPropagation(), this._selectPeriod(e.dataset.energyOption);
      });
    });
  }
  _ensureHistory(e) {
    if (!this._hass || !e.graphEntity) return;
    const t = this._historyCache?.[e.cacheKey], a = Date.now();
    t?.loading || t?.fetchedAt && a - t.fetchedAt < so || (this._historyCache[e.cacheKey] = {
      ...t || {},
      loading: !0
    }, this._fetchHistory(e.period, e.graphEntity).then((i) => {
      this._historyCache[e.cacheKey] = {
        fetchedAt: Date.now(),
        loading: !1,
        points: i
      }, this._render();
    }).catch(() => {
      this._historyCache[e.cacheKey] = {
        fetchedAt: Date.now(),
        loading: !1,
        points: t?.points || []
      }, this._render();
    }));
  }
  async _fetchHistory(e, t) {
    if (!this._hass?.callApi || !t) return [];
    const a = /* @__PURE__ */ new Date(), i = new Date(a.getTime() - e.hours * 60 * 60 * 1e3), r = [
      `filter_entity_id=${encodeURIComponent(t)}`,
      `end_time=${encodeURIComponent(a.toISOString())}`,
      "minimal_response",
      "no_attributes"
    ], n = `history/period/${encodeURIComponent(i.toISOString())}?${r.join("&")}`, s = await this._hass.callApi("GET", n);
    return this._normalizeHistory(s, e);
  }
  _normalizeHistory(e, t) {
    const i = (Array.isArray(e?.[0]) ? e[0] : Array.isArray(e) ? e : []).map((n) => {
      const s = Number(n?.state ?? n?.s ?? n?.[1]), l = n?.last_changed ?? n?.last_updated ?? n?.lu ?? n?.[0], c = this._dateFromHistory(l);
      return !Number.isFinite(s) || !c ? null : { value: s, time: c.getTime() };
    }).filter(Boolean);
    if (t.aggregate !== "day-max") return this._downsample(i, 96);
    const r = /* @__PURE__ */ new Map();
    return i.forEach((n) => {
      const s = new Date(n.time), l = `${s.getFullYear()}-${s.getMonth()}-${s.getDate()}`, c = r.get(l);
      (!c || n.value > c.value) && r.set(l, n);
    }), Array.from(r.values()).sort((n, s) => n.time - s.time);
  }
  _dateFromHistory(e) {
    if (e == null) return null;
    if (typeof e == "number") {
      const a = e > 1e11 ? e : e * 1e3, i = new Date(a);
      return Number.isNaN(i.getTime()) ? null : i;
    }
    const t = new Date(e);
    return Number.isNaN(t.getTime()) ? null : t;
  }
  _downsample(e, t) {
    if (e.length <= t) return e;
    const a = Math.ceil(e.length / t);
    return e.filter((i, r) => r % a === 0);
  }
  _formatEnergy(e) {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(Number(e) || 0);
  }
  _comparison(e) {
    const t = Number(e.total), a = Number(e.previousTotal);
    if (!Number.isFinite(t) || !Number.isFinite(a) || a <= 0) return "Sem comparativo";
    const i = (t - a) / a * 100, r = Math.round(Math.abs(i));
    return `${i < 0 ? "−" : i > 0 ? "+" : ""}${r}% vs. ${e.period.comparisonLabel}`;
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._model();
    this._ensureHistory(e), this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 96, 165, 250;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.62);
          --text-muted: rgba(226,232,240,0.42);
          display: block;
          height: 100%;
          min-height: 0;
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

        .energy-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 6px;
          padding: 13px 14px 10px;
          color: var(--text-main);
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
            radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%),
            linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
            linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.27),
            0 0 24px rgba(110,150,210,0.055)
          );
          overflow: hidden;
        }

        .energy-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .header,
        .chart {
          position: relative;
          z-index: 1;
        }

        .header {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          grid-template-rows: auto;
          gap: 5px 10px;
          align-items: start;
        }

        .header-copy {
          grid-column: 1;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          /* ANTERIOR: color: rgba(191,219,254,0.86); (azul, herdado sem intencao) */
          color: rgba(134,224,152,0.86);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .header-icon bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 3px;
        }

        .title-main {
          font-size: 13px;
          line-height: 1.05;
          font-weight: 800;
          color: rgba(255,255,255,0.93);
        }

        .value {
          min-width: 0;
          font-size: 11px;
          line-height: 1.16;
          font-weight: 500;
          color: var(--text-soft);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .selector {
          grid-column: 2;
          grid-row: 1;
          align-self: start;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          height: 30px;
          padding: 3px;
          border-radius: 999px;
          background: rgba(0,0,0,0.28);
          border: 1px solid rgba(255,255,255,0.16);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
          backdrop-filter: blur(14px) saturate(1.15);
          -webkit-backdrop-filter: blur(14px) saturate(1.15);
        }

        .segment {
          appearance: none;
          -webkit-appearance: none;
          height: 24px;
          min-width: 42px;
          padding: 0 9px;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255,255,255,0.78);
          font-size: 10px;
          line-height: 24px;
          font-weight: 740;
          outline: none;
          transition: background 160ms ease, color 160ms ease, box-shadow 160ms ease;
        }

        .segment.is-active {
          color: rgba(0,0,0,0.84);
          background: rgba(255,255,255,0.92);
          box-shadow:
            0 2px 9px rgba(0,0,0,0.22),
            inset 0 1px 0 rgba(255,255,255,0.55);
        }

        .chart {
          min-height: 0;
          align-self: stretch;
          display: flex;
          align-items: stretch;
          margin: -7px -15px -9px -15px;
        }

        .chart svg {
          width: 100%;
          height: 100%;
          min-height: 86px;
          display: block;
          overflow: visible;
        }

        .axis-label {
          font-size: 10px;
          font-weight: 680;
          fill: rgba(226,232,240,0.46);
        }

        .comparison-label {
          font-size: 10px;
          font-weight: 680;
          fill: rgba(226,232,240,0.56);
        }

        @media (prefers-reduced-motion: reduce) {
          .segment {
            transition: none !important;
          }
        }
      </style>

      <div class="energy-card">
        <div class="header">
          <div class="header-copy">
            <span class="header-icon" aria-hidden="true"><bruno-icon icon="mdi:lightning-bolt"></bruno-icon></span>
            <span class="title">
              <span class="title-main">${D._escape(this._config.name)}</span>
              <span class="value">Consumo parcial &middot; ${D._escape(this._formatEnergy(e.total))} kWh</span>
            </span>
          </div>
          <div class="selector" aria-label="Periodo de energia">
            ${at.map((t) => this._segment(t, t.option === e.period.option)).join("")}
          </div>
        </div>
        <div class="chart" aria-label="Grafico de energia">
          ${this._chart(e)}
        </div>
      </div>
    `, this._wireActions();
  }
  _segment(e, t) {
    return `
      <button class="segment${t ? " is-active" : ""}" type="button" data-energy-option="${D._escapeAttr(e.option)}">
        ${D._escape(e.button)}
      </button>
    `;
  }
  _chart(e) {
    const t = [{ value: e.graphCurrent ?? 0, time: Date.now() - 1 }, { value: e.graphCurrent ?? 0, time: Date.now() }], a = e.points.length >= 2 ? e.points : t, i = 360, r = 100, n = 0, s = 10, l = 20, c = a.map((M) => M.value), p = Math.min(e.period.lowerBound, ...c), d = Math.max(1, ...c), h = Math.max(1, d - p), b = (M) => a.length <= 1 ? n : n + M / (a.length - 1) * (i - n * 2), u = (M) => s + (d - M) / h * (r - s - l), g = a.map((M, H) => {
      const we = b(H).toFixed(2), ke = u(M.value).toFixed(2);
      return `${H ? "L" : "M"} ${we} ${ke}`;
    }).join(" "), f = b(0).toFixed(2), m = b(a.length - 1).toFixed(2), x = (r - l).toFixed(2), S = `${g} L ${m} ${x} L ${f} ${x} Z`, $ = e.graphCurrent == null ? "--" : `${Number(e.graphCurrent).toFixed(e.period.unit === "W" ? 0 : 2).replace(".00", "")} ${e.period.unit}`, z = this._comparison(e);
    return `
      <svg viewBox="0 0 ${i} ${r}" preserveAspectRatio="none" role="img" aria-label="${D._escapeAttr($)}">
        <defs>
          <linearGradient id="bruno-energy-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(111,184,255,0.42)"/>
            <stop offset="70%" stop-color="rgba(111,184,255,0.12)"/>
            <stop offset="100%" stop-color="rgba(111,184,255,0)"/>
          </linearGradient>
          <filter id="bruno-energy-glow" x="-30%" y="-80%" width="160%" height="260%">
            <feGaussianBlur stdDeviation="2.15" result="glow"/>
            <feMerge>
              <feMergeNode in="glow"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        <path d="${S}" fill="url(#bruno-energy-area)"></path>
        <path d="${g}" fill="none" stroke="#6FB8FF" stroke-width="2.35" stroke-linecap="round" stroke-linejoin="round" filter="url(#bruno-energy-glow)"></path>
        <text x="18" y="94" class="axis-label">${D._escape($)}</text>
        <text x="342" y="94" text-anchor="end" class="comparison-label">${D._escape(z)}</text>
      </svg>
    `;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return D._escape(e).replace(/'/g, "&#39;");
  }
}
customElements.get(ft) || customElements.define(ft, D);
window.customCards = window.customCards || [];
window.customCards.push({
  type: ft,
  name: "Bruno Energy Card",
  preview: !1,
  description: "Isolated Bento energy card with period selector, Home Assistant history, and Bruno liquid glass visuals."
});
const vt = "bruno-agenda-card", lo = [
  { entity: "calendar.brunohelasio_gmail_com", name: "Bruno", color: "#7fdbe9" },
  { entity: "calendar.familia", name: "Familia", color: "#fdd835" },
  { entity: "calendar.birthdays", name: "Aniversarios", color: "#ff6c92" },
  { entity: "calendar.feriados_no_brasil", name: "Feriados", color: "#1DB954" }
], na = [
  "calendar.brunohelasio_gmail_com",
  "calendar.familia",
  "calendar.feriados_no_brasil"
], sa = 5 * 1e3, co = ["unknown", "unavailable", "none", ""];
class V extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      name: "Agenda",
      title: "Agenda Mensal",
      days_to_show: 3,
      compact_events_to_show: 3,
      refresh_interval: sa,
      calendars: lo,
      popup_calendars: na,
      ...e || {}
    }, this._events = this._events || [], this._render(), this._scheduleRefresh(!0);
  }
  set hass(e) {
    const t = !this._hass;
    this._hass = e, this._render(), this._scheduleRefresh(t);
  }
  connectedCallback() {
    this._scheduleRefresh(!0);
  }
  disconnectedCallback() {
    this._refreshTimer && (clearInterval(this._refreshTimer), this._refreshTimer = null);
  }
  getCardSize() {
    return 3;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isInvalid(e) {
    return e == null || co.includes(String(e).toLowerCase());
  }
  _scheduleRefresh(e = !1) {
    if (!(!this._config || !this.isConnected)) {
      if (!this._refreshTimer) {
        const t = Math.max(5e3, Number(this._config.refresh_interval) || sa);
        this._refreshTimer = setInterval(() => this._loadEvents(), t);
      }
      e && this._loadEvents();
    }
  }
  async _loadEvents() {
    if (!this._hass || this._loading) return;
    this._loading = !0;
    const e = /* @__PURE__ */ new Date();
    e.setHours(0, 0, 0, 0);
    const t = new Date(e.getTime() + Number(this._config.days_to_show || 3) * 24 * 60 * 60 * 1e3);
    try {
      const a = await Promise.all(
        this._config.calendars.map((i) => this._fetchCalendarEvents(i, e, t))
      );
      this._events = a.flat().sort((i, r) => i.startMs - r.startMs), this._lastFetchAt = Date.now();
    } catch (a) {
      this._lastError = a;
    } finally {
      this._loading = !1, this._render();
    }
  }
  async _fetchCalendarEvents(e, t, a) {
    const i = e.entity;
    if (!i) return [];
    let r = null;
    if (this._hass?.callWS)
      try {
        r = await this._hass.callWS({
          type: "calendar/list_events",
          entity_id: i,
          start: t.toISOString(),
          end: a.toISOString()
        });
      } catch {
        r = null;
      }
    if (!r && this._hass?.callApi) {
      const s = `calendars/${encodeURIComponent(i)}?start=${encodeURIComponent(t.toISOString())}&end=${encodeURIComponent(a.toISOString())}`;
      r = await this._hass.callApi("GET", s);
    }
    return (Array.isArray(r?.events) ? r.events : Array.isArray(r) ? r : []).map((s) => this._normalizeEvent(s, e)).filter(Boolean);
  }
  _normalizeEvent(e, t) {
    const a = this._eventDate(e?.start), i = this._eventDate(e?.end);
    return a ? {
      calendar: t.entity,
      calendarName: t.name || t.entity,
      color: t.color || "#7fdbe9",
      summary: e?.summary || e?.message || e?.title || "Evento",
      location: e?.location || "",
      start: a,
      end: i,
      startMs: a.getTime(),
      allDay: !!(e?.start?.date && !e?.start?.dateTime)
    } : null;
  }
  _eventDate(e) {
    const t = e?.dateTime || e?.date || e;
    if (!t) return null;
    if (typeof t == "string" && /^\d{4}-\d{2}-\d{2}$/.test(t)) {
      const [i, r, n] = t.split("-").map(Number);
      return new Date(i, r - 1, n);
    }
    const a = new Date(t);
    return Number.isNaN(a.getTime()) ? null : a;
  }
  _openPopup() {
    const e = Array.isArray(this._config.popup_calendars) ? this._config.popup_calendars : na;
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: {
        action: "fire-dom-event",
        browser_mod: {
          service: "browser_mod.popup",
          data: {
            title: this._config.title,
            size: "wide",
            content: {
              type: "calendar",
              entities: e,
              initial_view: "dayGridMonth"
            }
          }
        }
      },
      bubbles: !0,
      composed: !0
    }));
  }
  _wireActions() {
    const e = this.shadowRoot.querySelector(".agenda-card");
    e?.addEventListener("click", () => this._openPopup()), e?.addEventListener("keydown", (t) => {
      t.key !== "Enter" && t.key !== " " || (t.preventDefault(), this._openPopup());
    });
  }
  _visibleEvents() {
    const e = Math.max(1, Number(this._config.compact_events_to_show) || 3);
    return this._events.slice(0, e);
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._visibleEvents();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 150, 190, 255;
          --text-main: rgba(246,250,255,0.95);
          --text-soft: rgba(226,232,240,0.62);
          --text-muted: rgba(226,232,240,0.42);
          display: block;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * {
          box-sizing: border-box;
          letter-spacing: 0;
        }

        .agenda-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-rows: auto minmax(0, 1fr);
          gap: 10px;
          padding: 14px 16px 14px 14px;
          color: var(--text-main);
          cursor: pointer;
          background: var(--bruno-liquid-surface-off-background,
            radial-gradient(165px 150px at 15% -9%, rgba(255,255,255,0.18), rgba(255,255,255,0.042) 44%, transparent 73%),
            radial-gradient(150px 150px at 96% 92%, rgba(var(--accent),0.09), transparent 69%),
            linear-gradient(180deg, rgba(255,255,255,0.118), rgba(255,255,255,0.034) 36%, rgba(255,255,255,0.056)),
            linear-gradient(155deg, rgba(18,24,36,0.74), rgba(11,14,22,0.61) 49%, rgba(33,27,25,0.32))
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(32px) saturate(1.68) contrast(1.06));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.13));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.18),
            inset 1px 0 0 rgba(255,255,255,0.10),
            inset -1px -1px 0 rgba(255,255,255,0.026),
            0 18px 44px rgba(0,0,0,0.27),
            0 0 24px rgba(110,150,210,0.055)
          );
          overflow: hidden;
        }

        .agenda-card::before {
          content: "";
          position: absolute;
          inset: 1px;
          z-index: 0;
          pointer-events: none;
          border-radius: calc(var(--card-radius) - 1px);
          background: var(--bruno-liquid-surface-off-sheen,
            radial-gradient(78px 62px at 19% 2%, rgba(255,255,255,0.20), transparent 72%),
            radial-gradient(82px 92px at 94% 18%, rgba(var(--accent),0.12), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.13), rgba(255,255,255,0.00) 35%),
            linear-gradient(90deg, rgba(255,255,255,0.085), rgba(255,255,255,0.00) 48%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.74);
        }

        .card-header,
        .events {
          position: relative;
          z-index: 1;
        }

        .card-header {
          min-height: 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 0 2px;
        }

        .header-copy {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 24px;
          width: 24px;
          height: 24px;
          border-radius: 999px;
          display: grid;
          place-items: center;
          color: rgba(191,219,254,0.86);
          background: rgba(255,255,255,0.075);
          border: 1px solid rgba(255,255,255,0.11);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        .header-icon bruno-icon {
          --mdc-icon-size: 14px;
          position: absolute;
          left: 50%;
          top: 50%;
          width: 14px;
          height: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title {
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .title-main {
          font-size: 12px;
          line-height: 1;
          font-weight: 780;
          text-transform: uppercase;
          color: rgba(255,255,255,0.78);
        }

        .events {
          min-height: 0;
          display: grid;
          align-content: start;
          gap: 7px;
          margin-left: -4px;
        }

        .event-row {
          min-width: 0;
          display: grid;
          grid-template-columns: 38px minmax(0, 1fr);
          gap: 8px;
          align-items: center;
        }

        .date {
          min-width: 0;
          text-align: center;
          color: rgba(255,255,255,0.84);
        }

        .weekday {
          display: block;
          font-size: 9px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.48);
          text-transform: uppercase;
        }

        .day {
          display: block;
          margin-top: 3px;
          font-size: 18px;
          line-height: 1;
          font-weight: 780;
        }

        .event {
          min-width: 0;
          position: relative;
          padding-left: 10px;
          color: rgba(255,255,255,0.92);
        }

        .event::before {
          content: "";
          position: absolute;
          left: 0;
          top: 5px;
          width: 5px;
          height: 5px;
          border-radius: 999px;
          background: var(--event-color);
          box-shadow: 0 0 10px var(--event-color);
        }

        .summary {
          display: block;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 12px;
          line-height: 1.15;
          font-weight: 720;
        }

        .time {
          display: block;
          margin-top: 3px;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 11px;
          line-height: 1;
          font-weight: 620;
          color: rgba(255,255,255,0.56);
        }

        .empty {
          display: flex;
          align-items: center;
          gap: 8px;
          min-height: 42px;
          color: rgba(255,255,255,0.56);
          font-size: 12px;
          font-weight: 650;
        }

        .empty bruno-icon {
          --mdc-icon-size: 16px;
          color: rgba(255,255,255,0.46);
        }
      </style>

      <div class="agenda-card" role="button" tabindex="0" aria-label="${V._escapeAttr(this._config.title)}">
        <div class="card-header">
          <div class="header-copy">
            <span class="header-icon" aria-hidden="true"><bruno-icon icon="mdi:calendar-month-outline"></bruno-icon></span>
            <span class="title">
              <span class="title-main">${V._escape(this._config.name)}</span>
            </span>
          </div>
        </div>
        <div class="events">
          ${e.length ? e.map((t) => this._eventRow(t)).join("") : this._emptyState()}
        </div>
      </div>
    `, this._wireActions();
  }
  _eventRow(e) {
    const t = e.start;
    return `
      <div class="event-row">
        <div class="date">
          <span class="weekday">${V._escape(this._weekday(t))}</span>
          <span class="day">${t.getDate()}</span>
        </div>
        <div class="event" style="--event-color:${V._escapeAttr(e.color)}">
          <span class="summary">${V._escape(e.summary)}</span>
          <span class="time">${V._escape(this._timeLabel(e))}</span>
        </div>
      </div>
    `;
  }
  _emptyState() {
    return `
      <div class="empty">
        <bruno-icon icon="mdi:check"></bruno-icon>
        <span>Nenhum evento nos proximos dias</span>
      </div>
    `;
  }
  _weekday(e) {
    return ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"][e.getDay()] || "";
  }
  _timeLabel(e) {
    return e.allDay ? e.calendarName : `${e.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} · ${e.calendarName}`;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return V._escape(e).replace(/'/g, "&#39;");
  }
}
customElements.get(vt) || customElements.define(vt, V);
window.customCards = window.customCards || [];
window.customCards.push({
  type: vt,
  name: "Bruno Agenda Card",
  preview: !1,
  description: "Isolated Bento agenda card with Home Assistant calendar events and Bruno liquid glass visuals."
});
const _t = "bruno-hero-stage-card";
class Ne extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      background: "/local/images/home_color.jpg?v=20260702-all-images-1",
      fallback_background: "/local/images/home.jpg?v=20260702-all-images-1",
      ...e
    }, this._render();
  }
  getCardSize() {
    return 1;
  }
  getGridOptions() {
    return {
      columns: 12,
      rows: 8,
      min_columns: 12,
      min_rows: 8
    };
  }
  connectedCallback() {
    this._config && this._render();
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = Ne._cssUrl(this._config.background), t = Ne._cssUrl(this._config.fallback_background || this._config.background);
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          margin: 0;
          padding: 0;
          position: relative;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          contain: layout paint style;
        }

        * {
          box-sizing: border-box;
        }

        .stage {
          position: relative;
          width: 100%;
          height: 100%;
          min-width: 0;
          min-height: 0;
          overflow: hidden;
          isolation: isolate;
        }

        .hero-bg {
          position: absolute;
          pointer-events: none;
          z-index: 0;
          top: -18px;
          bottom: -20px;
          left: -16px;
          right: -86px;
          background:
            url("${e}") left center / auto 100% no-repeat,
            url("${t}") left center / auto 100% no-repeat,
            #020406;
          opacity: 1;
          filter: saturate(1.12) brightness(1.02) contrast(1.04);
          mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.42) 3%,
              rgba(0,0,0,0.84) 8%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 82%,
              rgba(0,0,0,0.78) 91%,
              rgba(0,0,0,0.34) 96%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.38) 4%,
              rgba(0,0,0,0.84) 10%,
              rgba(0,0,0,1) 17%,
              rgba(0,0,0,1) 76%,
              rgba(0,0,0,0.76) 87%,
              rgba(0,0,0,0.28) 95%,
              transparent 100%
            );
          -webkit-mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.42) 3%,
              rgba(0,0,0,0.84) 8%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 82%,
              rgba(0,0,0,0.78) 91%,
              rgba(0,0,0,0.34) 96%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.38) 4%,
              rgba(0,0,0,0.84) 10%,
              rgba(0,0,0,1) 17%,
              rgba(0,0,0,1) 76%,
              rgba(0,0,0,0.76) 87%,
              rgba(0,0,0,0.28) 95%,
              transparent 100%
            );
          mask-composite: intersect;
          -webkit-mask-composite: source-in;
        }

        .hero-bg::before,
        .hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .hero-bg::before {
          background:
            linear-gradient(90deg,
              rgba(2,6,11,0.96) 0,
              rgba(2,6,11,0.90) 82px,
              rgba(3,8,14,0.74) 160px,
              rgba(4,9,15,0.46) 250px,
              rgba(5,10,18,0.18) 340px,
              rgba(5,10,18,0.04) 410px,
              rgba(5,10,18,0.00) 470px
            );
        }

        .hero-bg::after {
          background:
            linear-gradient(90deg,
              rgba(2,6,11,0.28) 0,
              rgba(2,6,11,0.08) 92px,
              rgba(2,6,11,0.00) 210px,
              rgba(2,6,11,0.00) 78%,
              rgba(2,6,11,0.22) 90%,
              rgba(2,6,11,0.72) 100%
            ),
            linear-gradient(180deg,
              rgba(2,6,11,0.84) 0%,
              rgba(2,6,11,0.50) 7%,
              rgba(2,6,11,0.18) 16%,
              rgba(2,6,11,0.00) 28%,
              rgba(2,6,11,0.00) 66%,
              rgba(2,6,11,0.20) 79%,
              rgba(2,6,11,0.58) 91%,
              rgba(2,6,11,0.90) 100%
            );
        }
      </style>

      <div class="stage" aria-hidden="true">
        <div class="hero-bg"></div>
      </div>
    `;
  }
  static _cssUrl(e) {
    return String(e || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\)/g, "\\)");
  }
}
customElements.get(_t) || customElements.define(_t, Ne);
window.customCards = window.customCards || [];
window.customCards.push({
  type: _t,
  name: "Bruno Hero Stage Card",
  preview: !1,
  description: "Non-interactive atmospheric background stage for the Bento dashboard."
});
const xt = "bruno-hero-card", po = {
  time: "sensor.time",
  weather: "weather.forecast_casa",
  sun: "sun.sun",
  // NOVO (2026-07-25) — HOME V2 item 4: mensagens inteligentes.
  // Toda a REGRA vive no backend (package home_insights.yaml); aqui só se
  // exibe a lista pronta do atributo `items`. Sem o package, o hero mostra
  // apenas a agenda (comportamento anterior).
  insights: "sensor.home_insights"
}, la = {
  amber: "#f7c600",
  red: "#ff453a",
  blue: "#7fdbe9",
  green: "#30d158"
}, ca = {
  sunny: { day: "clear-day", night: "clear-night" },
  "clear-night": { day: "clear-night", night: "clear-night" },
  partlycloudy: { day: "partly-cloudy-day", night: "partly-cloudy-night" },
  cloudy: { day: "cloudy", night: "cloudy" },
  rainy: { day: "rain", night: "rain" },
  pouring: { day: "rain", night: "rain" },
  lightning: { day: "rain", night: "rain" },
  "lightning-rainy": { day: "rain", night: "rain" },
  snowy: { day: "snow", night: "snow" },
  "snowy-rainy": { day: "sleet", night: "sleet" },
  fog: { day: "fog", night: "fog" },
  windy: { day: "wind", night: "wind" },
  "windy-variant": { day: "wind", night: "wind" }
}, da = [
  { entity: "calendar.brunohelasio_gmail_com", name: "Bruno", color: "#7fdbe9" },
  { entity: "calendar.familia", name: "Familia", color: "#fdd835" },
  { entity: "calendar.birthdays", name: "Aniversarios", color: "#ff6c92" },
  { entity: "calendar.feriados_no_brasil", name: "Feriados", color: "#1DB954" }
], pa = [
  "calendar.brunohelasio_gmail_com",
  "calendar.familia",
  "calendar.feriados_no_brasil"
], ua = [
  { entity: "camera.sl_camera_2", name: "Sala", short_name: "Sala" },
  { entity: "camera.vr_camera_2", name: "Varanda", short_name: "Varanda" },
  { entity: "camera.cz_camera_2", name: "Cozinha", short_name: "Cozinha" },
  { entity: "camera.as_camera_2", name: "Area de Servico", short_name: "Area" }
], ha = 300 * 1e3, uo = ["unknown", "unavailable", "idle", "off", "none", ""];
class w extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    const t = {
      ...po,
      ...e?.entities || {}
    }, a = e?.calendar || {}, i = e?.cameras || {};
    this._config = {
      name: "Bruno",
      background: "/local/images/home_color.jpg?v=20260702-all-images-1",
      fallback_background: "/local/images/home.jpg?v=20260702-all-images-1",
      ...e,
      calendar: {
        days_to_show: 3,
        compact_events_to_show: 1,
        refresh_interval: ha,
        calendars: da,
        popup_calendars: pa,
        ...a
      },
      cameras: {
        active_entity: "input_select.bento_active_camera",
        limit: 4,
        items: ua,
        ...i
      },
      entities: t
    }, this._events = this._events || [], this._lastCameraImages = this._lastCameraImages || {}, this._loadedCameraUrls = this._loadedCameraUrls || {}, this._cameraBaseUrls = this._cameraBaseUrls || {}, this._refreshSeed = this._refreshSeed || Date.now(), this._render(), this._scheduleRefresh(!0);
  }
  set hass(e) {
    const t = !this._hass;
    this._hass = e, this._render(), this._scheduleRefresh(t);
  }
  connectedCallback() {
    this._scheduleRefresh(!0);
  }
  disconnectedCallback() {
    this._refreshTimer && (clearInterval(this._refreshTimer), this._refreshTimer = null);
  }
  getCardSize() {
    return 5;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isUnavailable(e) {
    return !e || ["unknown", "unavailable", ""].includes(e.state);
  }
  _scheduleRefresh(e = !1) {
    if (!(!this._config || this._config.variant === "mobile" || !this.isConnected)) {
      if (!this._refreshTimer) {
        const t = Math.max(5e3, Number(this._config.calendar?.refresh_interval) || ha);
        this._refreshTimer = setInterval(() => this._loadEvents(), t);
      }
      e && this._loadEvents();
    }
  }
  async _loadEvents() {
    if (!this._hass || this._loadingEvents) return;
    this._loadingEvents = !0;
    const e = this._config.calendar || {}, t = /* @__PURE__ */ new Date();
    t.setHours(0, 0, 0, 0);
    const a = Math.max(1, Number(e.days_to_show || 3)), i = new Date(t.getTime() + a * 24 * 60 * 60 * 1e3);
    try {
      const r = Array.isArray(e.calendars) && e.calendars.length ? e.calendars : da, n = await Promise.all(
        r.map((s) => this._fetchCalendarEvents(s, t, i))
      );
      this._events = n.flat().filter((s) => s.startMs >= Date.now() - 3600 * 1e3 || s.allDay).sort((s, l) => s.startMs - l.startMs), this._lastFetchAt = Date.now();
    } catch (r) {
      this._lastEventError = r;
    } finally {
      this._loadingEvents = !1, this._render();
    }
  }
  async _fetchCalendarEvents(e, t, a) {
    const i = e?.entity;
    if (!i) return [];
    let r = null;
    if (this._hass?.callWS)
      try {
        r = await this._hass.callWS({
          type: "calendar/list_events",
          entity_id: i,
          start: t.toISOString(),
          end: a.toISOString()
        });
      } catch {
        r = null;
      }
    if (!r && this._hass?.callApi) {
      const s = `calendars/${encodeURIComponent(i)}?start=${encodeURIComponent(t.toISOString())}&end=${encodeURIComponent(a.toISOString())}`;
      r = await this._hass.callApi("GET", s);
    }
    return (Array.isArray(r?.events) ? r.events : Array.isArray(r) ? r : []).map((s) => this._normalizeEvent(s, e)).filter(Boolean);
  }
  _normalizeEvent(e, t) {
    const a = this._eventDate(e?.start), i = this._eventDate(e?.end);
    return a ? {
      calendar: t.entity,
      calendarName: t.name || t.entity,
      color: t.color || "#7fdbe9",
      summary: e?.summary || e?.message || e?.title || "Evento",
      location: e?.location || "",
      start: a,
      end: i,
      startMs: a.getTime(),
      allDay: !!(e?.start?.date && !e?.start?.dateTime)
    } : null;
  }
  _eventDate(e) {
    const t = e?.dateTime || e?.date || e;
    if (!t) return null;
    if (typeof t == "string" && /^\d{4}-\d{2}-\d{2}$/.test(t)) {
      const [i, r, n] = t.split("-").map(Number);
      return new Date(i, r - 1, n);
    }
    const a = new Date(t);
    return Number.isNaN(a.getTime()) ? null : a;
  }
  _nextEventModel() {
    const e = Array.isArray(this._events) ? this._events[0] : null;
    return e ? {
      empty: !1,
      label: "Próximo evento",
      summary: e.summary,
      time: this._eventTimeLabel(e),
      color: e.color || "#7fdbe9"
    } : {
      empty: !0,
      label: "Próximo evento",
      summary: "Nenhum compromisso hoje",
      time: this._loadingEvents ? "Atualizando agenda" : "Agenda livre",
      color: "#7fdbe9"
    };
  }
  _eventModels(e = 1) {
    const t = Math.max(1, Math.min(3, Number(e) || 1)), a = Array.isArray(this._events) ? this._events.slice(0, t) : [];
    return a.length ? a.map((i, r) => ({
      empty: !1,
      label: r === 0 ? "Proximo evento" : i.calendarName || "Agenda",
      summary: i.summary,
      time: this._eventTimeLabel(i),
      color: i.color || "#7fdbe9"
    })) : [this._nextEventModel()];
  }
  // NOVO (2026-07-25) — HOME V2 item 4: linhas de informação inteligente.
  // Lê a lista JÁ PRONTA do sensor (ordenada por severidade no backend).
  _insightModels(e = 2) {
    const a = this._state(this._config.entities.insights)?.attributes?.items;
    return !Array.isArray(a) || !a.length ? [] : a.slice(0, Math.max(0, e)).map((i) => ({
      empty: !1,
      insight: !0,
      label: "Agora",
      summary: String(i?.text || "").trim(),
      time: String(i?.detail || "").trim(),
      color: la[i?.tone] || la.amber
    })).filter((i) => i.summary);
  }
  _renderEventLine(e) {
    const t = e.insight ? " is-insight" : "", a = e.empty ? " is-empty" : "", i = e.insight ? "Informacao da casa" : "Abrir agenda";
    return `
      <button class="event-line${t}${a}" type="button" aria-label="${w._escapeAttr(i)}" style="--event-color:${w._escapeAttr(e.color)}">
        <span>${w._escape(e.label)}</span>
        <strong>${w._escape(e.summary)}</strong>
        ${e.time ? `<small>${w._escape(e.time)}</small>` : ""}
      </button>
    `;
  }
  _eventTimeLabel(e) {
    if (!e?.start) return e?.calendarName || "Agenda";
    if (e.allDay) return e.calendarName || "Dia todo";
    const t = /* @__PURE__ */ new Date(), a = e.start.toDateString() === t.toDateString(), i = e.start.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    return a ? `${i} · ${e.calendarName || "Agenda"}` : `${e.start.toLocaleDateString([], { day: "2-digit", month: "short" })} · ${i}`;
  }
  _cameraState(e) {
    const t = this._state(e.entity), a = t?.state || "", i = !t || uo.includes(String(a).toLowerCase()), r = t?.attributes?.entity_picture || "";
    r && (this._lastCameraImages[e.entity] = r);
    const n = r || this._lastCameraImages[e.entity] || (e.entity ? `/api/camera_proxy/${e.entity}` : "");
    return this._cameraBaseUrls[e.entity] !== n && (this._cameraBaseUrls[e.entity] = n, delete this._loadedCameraUrls[e.entity]), {
      ...e,
      online: !i,
      status: i ? "Indisponivel" : "Online",
      image: n,
      imageUrl: this._loadedCameraUrls[e.entity] || w._withCacheBust(n, this._refreshSeed)
    };
  }
  _cameraModel() {
    const e = this._config.cameras || {}, t = Array.isArray(e.items) && e.items.length ? e.items : ua, a = Math.max(1, Number(e.limit) || 4);
    return t.slice(0, a).map((i) => this._cameraState(i));
  }
  _updateCameraImages() {
    if (!this.shadowRoot) return;
    const e = Date.now();
    this.shadowRoot.querySelectorAll("img[data-camera-src-base]").forEach((t) => {
      const a = t.dataset.cameraSrcBase;
      if (!a) return;
      const i = w._withCacheBust(a, e);
      if (t.dataset.loadedSrc === i || t.src === i) return;
      const r = new Image();
      r.onload = () => {
        t.dataset.loadedSrc = i, t.src = i, t.classList.remove("is-hidden"), t.closest(".camera-thumb")?.classList.remove("is-image-error");
      }, r.onerror = () => {
        t.classList.add("is-hidden"), t.closest(".camera-thumb")?.classList.add("is-image-error");
      }, r.src = i;
    });
  }
  _clock() {
    const e = this._state(this._config.entities.time)?.state;
    if (/^\d{1,2}:\d{2}/.test(e || ""))
      return e.slice(0, 5);
    const t = /* @__PURE__ */ new Date();
    return `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }
  _dateLine() {
    const e = [
      "Domingo",
      "Segunda-feira",
      "Terça-feira",
      "Quarta-feira",
      "Quinta-feira",
      "Sexta-feira",
      "Sábado"
    ], t = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"], a = /* @__PURE__ */ new Date();
    return `${e[a.getDay()]}, ${a.getDate()} ${t[a.getMonth()]}`;
  }
  _greeting() {
    const e = (/* @__PURE__ */ new Date()).getHours();
    return `${e < 12 ? "Bom dia" : e < 18 ? "Boa tarde" : "Boa noite"}, ${this._config.name}`;
  }
  _weatherIcon(e, t) {
    const a = ca[e] || ca.cloudy;
    return `/local/svg/weather/${t ? a.day : a.night}.svg`;
  }
  _formatSunTime(e) {
    if (!e) return "--:--";
    const t = new Date(e);
    return Number.isNaN(t.getTime()) ? "--:--" : `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`;
  }
  _roundedAttribute(e, t, a, i = "") {
    const r = e?.attributes?.[t], n = Number.parseFloat(r);
    return Number.isFinite(n) ? `${Math.round(n)}${i}` : a;
  }
  _weatherModel() {
    const e = this._state(this._config.entities.weather), t = this._state(this._config.entities.sun), a = t?.state === "above_horizon", i = e?.state || "cloudy", r = this._roundedAttribute(e, "temperature", "--", "°C"), n = this._roundedAttribute(e, "apparent_temperature", "--°C", "°C"), s = this._roundedAttribute(e, "humidity", "--%", "%"), l = this._roundedAttribute(e, "wind_speed", "-- km/h", " km/h");
    return {
      state: i,
      available: !this._isUnavailable(e),
      icon: this._weatherIcon(i, a),
      temperature: r,
      apparent: n,
      humidity: s,
      wind: l,
      rising: this._formatSunTime(t?.attributes?.next_rising),
      setting: this._formatSunTime(t?.attributes?.next_setting)
    };
  }
  _fireDomEvent(e) {
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: e,
      bubbles: !0,
      composed: !0
    }));
  }
  _openWeatherPopup() {
    this._fireDomEvent({
      action: "fire-dom-event",
      browser_mod: {
        service: "browser_mod.popup",
        data: {
          title: "Weather",
          style: "--max-popup-column: 2;",
          card_mod: {
            style: {
              "ha-dialog$": `
                .mdc-dialog__container {
                  align-items: center !important;
                  justify-content: center !important;
                }
              `
            }
          },
          content: {
            type: "custom:mod-card",
            card_mod: {
              style: {
                "layout-card$": {
                  "grid-layout$": {
                    ".": `
                      #root > * {
                        margin: 0px !important;
                      }
                      @media (max-width: 800px) {
                        #root {
                          display: block !important;
                        }
                      }
                    `,
                    "hui-entities-card$": {
                      ".": `
                        ha-card {
                          border-right: 0.1vw solid rgba(58, 69, 73, 0.2);
                          border-radius: 0;
                          transition: none;
                          margin-bottom: 0 !important;
                        }
                        ha-card.header .card-header {
                          letter-spacing: 0.005em;
                          font-size: 1.6em;
                          line-height: initial;
                        }
                        @media screen and (max-width: 800px) {
                          ha-card {
                            border-right: none;
                            border-bottom: 0.1vw solid rgba(58, 69, 73, 0.2);
                          }
                        }
                      `,
                      "hui-horizontal-stack-card": {
                        $: `
                          #root {
                            justify-content: space-evenly;
                            margin-block: 1em;
                            height: unset !important;
                          }
                        `
                      }
                    },
                    "hui-entities-card:last-child": {
                      $: `
                        ha-card {
                          border: none;
                        }
                      `
                    }
                  }
                }
              }
            },
            card: {
              type: "custom:layout-card",
              layout_type: "custom:grid-layout",
              layout: {
                "grid-template-columns": "1fr",
                "grid-template-rows": "auto",
                margin: 0,
                padding: 0,
                mediaquery: {
                  "(min-width: 1441.99px)": {
                    "grid-template-columns": "repeat(var(--max-popup-column), var(--max-popup-column-width, 550px))",
                    "grid-template-rows": "auto"
                  },
                  "(min-width: 800px)": {
                    "grid-template-columns": "550px",
                    "grid-template-rows": "auto",
                    margin: 0,
                    padding: 0
                  }
                }
              },
              cards: [
                {
                  type: "entities",
                  title: "Salvador",
                  entities: [
                    {
                      type: "custom:layout-card",
                      layout_type: "custom:vertical-layout",
                      cards: [
                        {
                          type: "weather-forecast",
                          show_current: !0,
                          show_forecast: !0,
                          entity: this._config.entities.weather,
                          name: " ",
                          forecast_type: "hourly"
                        }
                      ]
                    },
                    { type: "divider" },
                    {
                      type: "custom:weather-chart-card",
                      entity: this._config.entities.weather,
                      show_main: !1,
                      show_attributes: !1,
                      forecast: {
                        condition_icons: !1,
                        show_wind_forecast: !1
                      }
                    }
                  ]
                },
                {
                  type: "entities",
                  title: "Radar",
                  card_mod: { class: "header nopadding" },
                  entities: [
                    {
                      type: "custom:weather-radar-card",
                      static_map: !1,
                      map_style: "Dark",
                      data_source: "RainViewer-DarkSky",
                      show_scale: !1,
                      show_range: !1,
                      extra_labels: !1,
                      center_longitude: -38.5108,
                      show_marker: !1,
                      show_zoom: !1,
                      center_latitude: -12.9714,
                      marker_latitude: -12.9714,
                      marker_longitude: -38.5108,
                      zoom_level: 5,
                      square_map: !1,
                      show_recenter: !0,
                      show_playback: !1
                    }
                  ]
                }
              ]
            }
          }
        }
      }
    });
  }
  _openAgendaPopup() {
    const e = this._config.calendar || {}, t = Array.isArray(e.popup_calendars) && e.popup_calendars.length ? e.popup_calendars : pa;
    this._fireDomEvent({
      action: "fire-dom-event",
      browser_mod: {
        service: "browser_mod.popup",
        data: {
          title: "Agenda",
          size: "wide",
          content: {
            type: "calendar",
            entities: t
          }
        }
      }
    });
  }
  _openMoreInfo(e) {
    e && this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  _selectCamera(e) {
    if (!e) return;
    const t = this._config.cameras?.active_entity;
    t && this._hass?.callService && this._hass.callService("input_select", "select_option", {
      entity_id: t,
      option: e
    }), this._openMoreInfo(e);
  }
  _weatherLabel(e) {
    return {
      sunny: "Ensolarado",
      "clear-night": "Céu limpo",
      partlycloudy: "Parcialmente nublado",
      cloudy: "Nublado",
      rainy: "Chuva",
      pouring: "Chuva forte",
      lightning: "Raios",
      "lightning-rainy": "Temporal",
      snowy: "Neve",
      "snowy-rainy": "Chuva e neve",
      fog: "Nevoeiro",
      windy: "Vento",
      "windy-variant": "Ventando"
    }[e] || String(e || "Clima").replace(/_/g, " ");
  }
  _weatherMetric(e, t, a, i) {
    return `
      <span class="weather-metric">
        <bruno-icon icon="${e}" style="color:${t}"></bruno-icon>
        <span class="metric-label">${w._escape(a)}</span>
        <span class="metric-value">${w._escape(i)}</span>
      </span>
    `;
  }
  _renderDesktop() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._weatherModel(), t = this._eventModels(this._config.calendar?.compact_events_to_show), a = this._config.cameras?.show !== !1 && this._config.cameras?.enabled !== !1, i = a ? this._cameraModel() : [], r = this._config.hero_layout === "v2", n = r ? this._nextEventModel() : null, s = r ? this._insightModels(2) : [], l = r ? n.empty && s.length ? [...s, n] : [n, ...s] : t;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --hero-text: rgba(248,251,255,0.96);
          --hero-muted: rgba(248,251,255,0.56);
          --hero-soft: rgba(248,251,255,0.74);
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 0;
          overflow: hidden;
          position: relative;
          z-index: 0;
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

        .hero-stage {
          width: 100%;
          height: 100%;
          min-height: 0;
          color: var(--hero-text);
          position: relative;
          isolation: isolate;
          overflow: hidden;
        }

        .content {
          position: relative;
          z-index: 2;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 18px;
          padding: 20px 20px 0;
          overflow: hidden;
        }

        .headline {
          min-width: 0;
          padding-top: 1px;
        }

        .date-line {
          margin: 0 0 12px;
          color: var(--hero-muted);
          font-size: 10px;
          line-height: 1;
          font-weight: 820;
          text-transform: uppercase;
        }

        .greeting {
          margin: 0;
          max-width: 460px;
          color: var(--hero-text);
          font-size: 25px;
          line-height: 1.08;
          font-weight: 790;
          text-shadow: 0 2px 20px rgba(0,0,0,0.28);
        }

        .clock {
          margin-top: 14px;
          color: rgba(255,255,255,0.96);
          font-size: clamp(66px, 8.6vh, 88px);
          line-height: 0.88;
          font-weight: 250;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 12px 34px rgba(0,0,0,0.34);
        }

        .inline-weather {
          appearance: none;
          -webkit-appearance: none;
          width: fit-content;
          max-width: 100%;
          min-height: 0;
          margin-top: 15px;
          padding: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          text-align: left;
          border: 0;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          text-shadow: 0 3px 14px rgba(0,0,0,0.38);
          transition: filter 160ms ease, transform 160ms ease;
        }

        .inline-weather:hover {
          filter: brightness(1.07);
        }

        .inline-weather:active {
          transform: translateY(1px) scale(0.996);
        }

        .inline-weather img {
          width: 19px;
          height: 19px;
          flex: 0 0 19px;
          filter: drop-shadow(0 4px 8px rgba(0,0,0,0.24));
        }

        .inline-weather strong {
          color: rgba(255,255,255,0.95);
          font-size: 14px;
          line-height: 1;
          font-weight: 820;
          white-space: nowrap;
        }

        .inline-weather small {
          min-width: 0;
          color: rgba(255,255,255,0.66);
          font-size: 11px;
          line-height: 1;
          font-weight: 620;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .hero-bottom {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-height: 0;
          padding-bottom: 54px;
        }

        .hero-bottom.has-cameras {
          padding-bottom: 0;
        }

        .event-stack {
          display: grid;
          gap: 7px;
          min-width: 0;
        }

        .event-line {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          min-width: 0;
          padding: 0 2px;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 4px;
          text-align: left;
          border: 0;
          background: transparent;
          text-shadow: 0 3px 14px rgba(0,0,0,0.32);
        }

        .event-line span {
          color: rgba(255,255,255,0.54);
          font-size: 11px;
          line-height: 1;
          font-weight: 720;
        }

        .event-line strong {
          max-width: 100%;
          color: rgba(255,255,255,0.93);
          font-size: 14px;
          line-height: 1.12;
          font-weight: 820;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .event-line small {
          color: rgba(255,255,255,0.60);
          font-size: 10px;
          line-height: 1;
          font-weight: 620;
        }

        .camera-strip {
          width: calc(100% + 16px);
          height: 96px;
          min-height: 96px;
          margin-right: -16px;
          padding: 8px;
          display: grid;
          grid-template-columns: minmax(78px, 0.78fr) repeat(${Math.max(1, i.length)}, minmax(0, 1fr));
          align-items: stretch;
          gap: 8px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.15);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.115), rgba(255,255,255,0.046)),
            rgba(9,13,20,0.24);
          backdrop-filter: blur(26px) saturate(1.48);
          -webkit-backdrop-filter: blur(26px) saturate(1.48);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.14),
            0 20px 54px rgba(0,0,0,0.25);
        }

        .camera-strip-asset {
          position: relative;
          min-width: 0;
          height: 100%;
          display: grid;
          place-items: center;
          overflow: hidden;
          background:
            url('/local/images/camera_seg_strip.png?v=20260702-all-images-1') center center / contain no-repeat;
          filter:
            drop-shadow(0 11px 18px rgba(0,0,0,0.36))
            saturate(1.04)
            contrast(1.04);
        }

        .camera-thumb {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          min-width: 0;
          height: 100%;
          overflow: hidden;
          border-radius: 14px;
          border: 1px solid rgba(255,255,255,0.11);
          background: rgba(4,8,14,0.32);
          padding: 0;
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.09);
          transition: transform 160ms ease, border-color 160ms ease, filter 160ms ease;
        }

        .camera-thumb:hover {
          filter: brightness(1.07);
          border-color: rgba(255,255,255,0.20);
        }

        .camera-thumb:active {
          transform: translateY(1px) scale(0.986);
        }

        .camera-thumb img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          opacity: 0.82;
          filter: saturate(0.94) contrast(1.05);
        }

        .camera-thumb img.is-hidden,
        .camera-thumb.is-image-error img {
          display: none;
        }

        .camera-placeholder {
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
          color: rgba(255,255,255,0.38);
          background:
            radial-gradient(circle at 50% 20%, rgba(255,255,255,0.12), transparent 54%),
            rgba(4,8,14,0.34);
        }

        .camera-placeholder bruno-icon {
          --mdc-icon-size: 22px;
        }

        .camera-thumb:not(.is-image-error) img + .camera-placeholder {
          opacity: 0;
        }

        .camera-thumb::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            linear-gradient(180deg, transparent 34%, rgba(0,0,0,0.70) 100%);
        }

        .camera-label {
          position: absolute;
          left: 8px;
          right: 8px;
          bottom: 7px;
          z-index: 2;
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 5px;
        }

        .camera-dot {
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.38);
        }

        .camera-dot.is-online {
          background: rgb(46,232,109);
          box-shadow: 0 0 10px rgba(46,232,109,0.70);
        }

        .camera-label strong {
          min-width: 0;
          color: rgba(255,255,255,0.95);
          font-size: 10px;
          line-height: 1;
          font-weight: 820;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 2px 8px rgba(0,0,0,0.55);
        }

        @media (max-height: 760px) {
          .content {
            padding: 17px 18px 0;
          }

          .clock {
            font-size: clamp(58px, 8vh, 78px);
          }

          .camera-strip {
            height: 86px;
            min-height: 86px;
          }
        }

        /* ============================================================
           NOVO (2026-07-09) — Fase 2 mobile: HERO COMPACTO no phone.
           Feedback do usuario: saudacao + status + proximo evento
           ocupavam espaco excessivo na tela vertical. Reducao agressiva
           de tipografia/margens + remocao da regua de 54px do tablet
           (reservava espaco para o dock de acoes rapidas, que no phone
           nao existe). Bloco ADITIVO. ROLLBACK: remover este @media.
           ============================================================ */
        @media (max-width: 800px) {
          .hero-stage {
            min-height: 196px;
          }

          .content {
            padding: 12px 14px 0;
            gap: 10px;
          }

          .date-line {
            margin: 0 0 6px;
          }

          .greeting {
            font-size: 19px;
          }

          .clock {
            margin-top: 6px;
            font-size: 42px;
            line-height: 1;
          }

          .inline-weather {
            margin-top: 8px;
          }

          .hero-bottom {
            padding-bottom: 12px;
            gap: 6px;
          }

          .event-stack {
            gap: 5px;
          }
        }

        /* ============================================================
           NOVO (2026-07-24) — HOME V2 (hero_layout: 'v2').
           Protagonismo moderado de data/saudacao/relogio/clima e agenda
           INTEGRADA na coluna do headline (abaixo do clima), deixando de
           ficar isolada no canto inferior. Bloco ADITIVO: sem o flag no
           wrapper, nenhuma destas regras se aplica (Home V1 intacta).
           ROLLBACK: remover hero_layout: 'v2' do wrapper v2.
           ============================================================ */
        .hero-stage.is-v2 .date-line {
          font-size: 12px;
          margin-bottom: 14px;
        }

        .hero-stage.is-v2 .greeting {
          font-size: 31px;
        }

        .hero-stage.is-v2 .clock {
          margin-top: 16px;
          font-size: clamp(78px, 10.4vh, 108px);
        }

        .hero-stage.is-v2 .inline-weather {
          margin-top: 20px;
        }

        .hero-stage.is-v2 .inline-weather img {
          width: 23px;
          height: 23px;
          flex: 0 0 23px;
        }

        .hero-stage.is-v2 .inline-weather strong {
          font-size: 16px;
        }

        .hero-stage.is-v2 .inline-weather small {
          font-size: 12.5px;
        }

        .hero-stage.is-v2 .headline .event-stack {
          margin-top: 26px;
          max-width: 440px;
          gap: 9px;
        }

        /* NOVO (2026-07-25) — item 4: linhas de informação inteligente.
           Marcador de cor à esquerda (tom vindo do backend) diferencia a
           mensagem do compromisso da agenda, sem criar card opaco. */
        .hero-stage.is-v2 .event-line.is-insight {
          position: relative;
          padding-left: 12px;
          cursor: default;
        }

        .hero-stage.is-v2 .event-line.is-insight::before {
          content: "";
          position: absolute;
          left: 2px;
          top: 3px;
          bottom: 3px;
          width: 2px;
          border-radius: 999px;
          background: var(--event-color, #f7c600);
          box-shadow: 0 0 10px var(--event-color, #f7c600);
          opacity: 0.9;
        }

        .hero-stage.is-v2 .event-line.is-insight span {
          color: var(--event-color, #f7c600);
          opacity: 0.92;
        }

        .hero-stage.is-v2 .event-line strong {
          font-size: 15.5px;
        }

        .hero-stage.is-v2 .event-line span {
          font-size: 11.5px;
        }

        .hero-stage.is-v2 .event-line small {
          font-size: 11px;
        }

        @media (max-height: 760px) {
          .hero-stage.is-v2 .clock {
            font-size: clamp(66px, 9.2vh, 92px);
          }

          .hero-stage.is-v2 .headline .event-stack {
            margin-top: 18px;
          }
        }

        @media (max-width: 800px) {
          .hero-stage.is-v2 .greeting {
            font-size: 19px;
          }

          .hero-stage.is-v2 .clock {
            margin-top: 6px;
            font-size: 42px;
          }

          .hero-stage.is-v2 .inline-weather {
            margin-top: 8px;
          }

          .hero-stage.is-v2 .headline .event-stack {
            margin-top: 10px;
            gap: 5px;
          }

          /* NOVO (2026-08-10) — HERO CONDENSADO NO TELEFONE.
             Medido: 328px de altura, dos quais 144 eram TRÊS faixas de 48 —
             44% do hero para informação que cabe em uma. O usuário pediu uma
             faixa só. As outras duas continuam no DOM porque o TABLET as usa;
             o que muda aqui é só a visibilidade. A ordem por relevância (ver
             _render) garante que a faixa que sobra é a que importa: num dia
             sem compromisso, a única visível seria "Nenhum compromisso hoje".

             O resto do corte vem do relógio e dos respiros, para fechar os
             ~210px do orçamento da Home no telefone (docs/28 §2.3).

             ATENÇÃO: este arquivo tem DOIS templates. Este bloco é o do
             template que a Home V2 usa. O outro atende "variant: mobile", das
             views V3 — que o usuário pediu para não mexer.

             ROLLBACK: remover deste comentário até o fim do bloco.

             ATUALIZADO (2026-08-16): a faixa recuperada do grid de cômodos
             devolveu altura ao hero, e uma faixa só voltou a ser aperto e não
             economia. Passam a caber DUAS. A linha de preenchimento continua
             fora (.is-empty logo abaixo), então "duas" significa duas linhas
             com conteúdo real — nunca uma informação e um aviso de vazio.
             ANTERIOR (rollback): nth-child(n + 2). */
          .hero-stage.is-v2 .headline .event-stack > .event-line:nth-child(n + 3) {
            display: none;
          }

          /* A ordem em _render já é por relevância: com compromisso ele vem
             primeiro; sem compromisso os insights sobem e o placeholder cai
             para o fim. Ocultá-lo aqui nunca engole uma linha útil. */
          .hero-stage.is-v2 .headline .event-stack > .event-line.is-empty {
            display: none;
          }

          .hero-stage.is-v2 .clock {
            margin-top: 0;
            font-size: 35px;
          }

          .hero-stage.is-v2 .content {
            padding: 10px 16px 10px;
          }

          .hero-stage.is-v2 .inline-weather {
            margin-top: 5px;
          }

          .hero-stage.is-v2 .headline .event-stack {
            margin-top: 6px;
          }

          /* NOVO (2026-08-16) — HOME MOBILE COMPACTA, SEM TOCAR NOS TILES.
             A previsao deixa de consumir uma linha propria e divide a mesma
             faixa do relogio. Data, saudacao e insight conservam conteudo e
             hierarquia; somente os respiros externos cedem os 54px medidos.

             ANTERIOR (rollback): o bloco phone acima entregava hero intrinseco
             de aproximadamente 214px, com clima abaixo do relogio. Remover
             apenas este bloco restaura exatamente essa composicao.

             ATUALIZADO (2026-08-16): 160 -> 182px. Nao e escolha estetica, e
             aritmetica do orcamento vertical. A faixa de 14px que hospedava o
             indicador textual saiu do grid de comodos, e com ela o gap de 8px
             que a acompanhava: a 3a dupla (Marina/Miguel) subiu exatamente
             22px e passou a espiar acima do filete. Devolvendo esses 22px ao
             hero, Lavabo/Q. Casal voltam a terminar rente ao filete e
             Marina/Miguel voltam a comecar abaixo dele.
             ANTERIOR (rollback): 160px. */
          .hero-stage.is-v2 {
            height: 182px;
            min-height: 182px;
          }

          /* ANTERIOR (rollback): padding: 4px 16px 5px — calibrado para os
             160px, onde nao havia respiro para ceder. */
          .hero-stage.is-v2 .content {
            padding: 7px 16px 8px;
            gap: 0;
          }

          /* Com cameras.show: false (a config real da Home V2) a faixa de
             baixo fica sem nenhum filho e mesmo assim reservava 12px de
             padding. Esse vazio empurrava a composicao contra o teto no caso
             de duas linhas.

             O seletor e :not(.has-cameras), nao :empty — na V2 a faixa fica
             com espaco em branco do template mesmo sem filho nenhum, e :empty
             nao casa com no de texto. Se a tira de cameras voltar a ser
             exibida, a classe reaparece e a regra deixa de valer sozinha:
             nada precisa ser desfeito aqui. */
          .hero-stage.is-v2 .hero-bottom:not(.has-cameras) {
            display: none;
          }

          .hero-stage.is-v2 .headline {
            min-width: 0;
            display: grid;
            grid-template-columns: max-content minmax(0, 1fr);
            grid-template-areas:
              "date date"
              "greeting greeting"
              "clock weather"
              "events events";
            column-gap: 14px;
            align-items: center;
          }

          /* ANTERIOR (rollback): margin: 0 0 4px. */
          .hero-stage.is-v2 .date-line {
            grid-area: date;
            margin: 0 0 5px;
          }

          .hero-stage.is-v2 .greeting {
            grid-area: greeting;
            line-height: 1.04;
          }

          .hero-stage.is-v2 .clock {
            grid-area: clock;
            margin-top: 1px;
            font-size: 35px;
            line-height: 1;
          }

          .hero-stage.is-v2 .inline-weather {
            grid-area: weather;
            width: auto;
            max-width: 100%;
            min-width: 0;
            margin-top: 1px;
            justify-self: end;
            gap: 6px;
          }

          .hero-stage.is-v2 .inline-weather img {
            width: 20px;
            height: 20px;
            flex-basis: 20px;
          }

          .hero-stage.is-v2 .inline-weather strong {
            font-size: 15px;
          }

          .hero-stage.is-v2 .inline-weather small {
            max-width: min(42vw, 176px);
            font-size: 11.5px;
          }

          /* ANTERIOR (rollback): margin-top: 4px; gap: 2px. Os respiros abaixo
             consomem a folga que sobrou depois da segunda linha — e o unico
             lugar onde a altura recuperada ainda cabia sem apertar nada. */
          .hero-stage.is-v2 .headline .event-stack {
            grid-area: events;
            margin-top: 5px;
            gap: 3px;
          }

          .hero-stage.is-v2 .event-line {
            gap: 2px;
          }

          .hero-stage.is-v2 .event-line strong {
            font-size: 14.5px;
            line-height: 1.08;
          }

          .hero-stage.is-v2 .event-line span,
          .hero-stage.is-v2 .event-line small {
            font-size: 10.5px;
          }
        }

        @media (max-width: 360px) {
          .hero-stage.is-v2 .headline {
            column-gap: 8px;
          }

          .hero-stage.is-v2 .inline-weather {
            gap: 4px;
          }

          .hero-stage.is-v2 .inline-weather small {
            max-width: 116px;
            font-size: 10.5px;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .inline-weather,
          .camera-thumb {
            transition: none !important;
          }
        }
      </style>

      <section class="hero-stage${r ? " is-v2" : ""}" aria-label="Hero do dashboard">
        <div class="content">
          <div class="headline">
            <p class="date-line">${w._escape(this._dateLine())}</p>
            <h2 class="greeting">${w._escape(this._greeting())}</h2>
            <div class="clock">${w._escape(this._clock())}</div>
            <button class="inline-weather" type="button" aria-label="Abrir clima">
              <img src="${w._escape(e.icon)}" alt="${w._escape(this._weatherLabel(e.state))}">
              <strong>${w._escape(e.temperature)}</strong>
              <small>${w._escape(this._weatherLabel(e.state))}</small>
            </button>
            ${r ? `
              <div class="event-stack">
                ${l.map((c) => this._renderEventLine(c)).join("")}
              </div>
            ` : ""}
          </div>

          <div class="hero-bottom${a ? " has-cameras" : ""}">
            ${r ? "" : `
              <div class="event-stack">
                ${l.map((c) => this._renderEventLine(c)).join("")}
              </div>
            `}

            ${a ? `
              <div class="camera-strip" aria-label="Mini cameras">
                <span class="camera-strip-asset" aria-hidden="true"></span>
                ${i.map((c) => w._miniCamera(c)).join("")}
              </div>
            ` : ""}
          </div>
        </div>
      </section>
    `, this.shadowRoot.querySelector(".inline-weather")?.addEventListener("click", (c) => {
      c.preventDefault(), c.stopPropagation(), this._openWeatherPopup();
    }), this.shadowRoot.querySelectorAll(".event-line:not(.is-insight)").forEach((c) => c.addEventListener("click", (p) => {
      p.preventDefault(), p.stopPropagation(), this._openAgendaPopup();
    })), this.shadowRoot.querySelectorAll(".camera-thumb").forEach((c) => {
      c.addEventListener("click", (p) => {
        p.preventDefault(), p.stopPropagation(), this._selectCamera(c.dataset.cameraId);
      });
    }), a && this._updateCameraImages();
  }
  _render() {
    if (!this._config) return;
    if (this._config.variant !== "mobile") {
      this._renderDesktop();
      return;
    }
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._weatherModel(), t = w._cssUrl(this._config.background), a = w._cssUrl(this._config.fallback_background), i = this._config.variant === "mobile" ? " is-mobile" : "", r = this._config.variant === "mobile" ? "0" : "300px";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --hero-radius-left: var(--bruno-liquid-card-radius, 22px);
          --hero-radius-right: var(--bruno-liquid-card-radius, 22px);
          --hero-accent: 150, 190, 255;
          --hero-text: rgba(248,251,255,0.96);
          --hero-muted: rgba(248,251,255,0.54);
          --hero-soft: rgba(248,251,255,0.72);
          display: block;
          height: 100%;
          min-height: 0;
          margin: 0;
          padding: 0;
          overflow: visible;
          position: relative;
          z-index: 0;
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

        .hero-stage {
          width: 100%;
          height: 100%;
          min-height: 0;
          position: relative;
          isolation: isolate;
          overflow: visible;
          color: var(--hero-text);
          border-radius: 0;
          z-index: 0;
        }

        /*
         * FALLBACK RÁPIDO:
         * A implementação anterior usava .hero-clip com:
         * - border
         * - box-shadow
         * - background glass
         * - leitura de card fechado
         *
         * Se precisar restaurar rapidamente o visual anterior,
         * reintroduzir a camada .hero-clip e remover .hero-bg expandida.
         */

        .hero-bg {
          position: absolute;
          pointer-events: none;
          z-index: 0;
          top: -18px;
          bottom: -20px;
          left: -16px;
          right: -112px;
          background:
            linear-gradient(90deg,
              rgba(4,10,18,0.82) 0%,
              rgba(5,10,18,0.66) 12%,
              rgba(6,12,20,0.42) 24%,
              rgba(7,13,22,0.22) 38%,
              rgba(7,13,22,0.10) 50%,
              rgba(7,13,22,0.14) 60%,
              rgba(7,13,22,0.30) 70%,
              rgba(7,13,22,0.54) 82%,
              rgba(7,13,22,0.80) 92%,
              rgba(7,13,22,0.94) 100%
            ),
            linear-gradient(180deg,
              rgba(4,8,14,0.78) 0%,
              rgba(4,8,14,0.46) 10%,
              rgba(4,8,14,0.18) 22%,
              rgba(4,8,14,0.04) 34%,
              rgba(4,8,14,0.00) 46%,
              rgba(4,8,14,0.00) 58%,
              rgba(4,8,14,0.10) 72%,
              rgba(4,8,14,0.28) 84%,
              rgba(4,8,14,0.56) 94%,
              rgba(4,8,14,0.78) 100%
            ),
            radial-gradient(680px 220px at 12% 4%, rgba(255,255,255,0.07), transparent 56%),
            radial-gradient(900px 320px at 74% 52%, rgba(255,255,255,0.03), transparent 66%),
            url(${t}) left center / auto 100% no-repeat,
            url(${a}) left center / auto 100% no-repeat;
          opacity: 1;
          filter: saturate(1.01) brightness(0.90);
          mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.84) 4%,
              rgba(0,0,0,1) 10%,
              rgba(0,0,0,1) 78%,
              rgba(0,0,0,0.84) 88%,
              rgba(0,0,0,0.46) 94%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.84) 6%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 80%,
              rgba(0,0,0,0.82) 89%,
              rgba(0,0,0,0.42) 95%,
              transparent 100%
            );
          -webkit-mask-image:
            linear-gradient(to right,
              transparent 0%,
              rgba(0,0,0,0.84) 4%,
              rgba(0,0,0,1) 10%,
              rgba(0,0,0,1) 78%,
              rgba(0,0,0,0.84) 88%,
              rgba(0,0,0,0.46) 94%,
              transparent 100%
            ),
            linear-gradient(to bottom,
              transparent 0%,
              rgba(0,0,0,0.84) 6%,
              rgba(0,0,0,1) 14%,
              rgba(0,0,0,1) 80%,
              rgba(0,0,0,0.82) 89%,
              rgba(0,0,0,0.42) 95%,
              transparent 100%
            );
          mask-composite: intersect;
          -webkit-mask-composite: source-in;
        }

        .hero-bg::before,
        .hero-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
        }

        .hero-bg::before {
          background:
            linear-gradient(90deg,
              rgba(4,10,18,0.72) 0%,
              rgba(4,10,18,0.56) 12%,
              rgba(5,10,18,0.34) 24%,
              rgba(5,10,18,0.14) 38%,
              rgba(5,10,18,0.02) 50%,
              rgba(5,10,18,0.08) 60%,
              rgba(5,10,18,0.22) 72%,
              rgba(5,10,18,0.46) 84%,
              rgba(5,10,18,0.74) 100%
            ),
            linear-gradient(180deg,
              rgba(3,8,14,0.62) 0%,
              rgba(3,8,14,0.34) 12%,
              rgba(3,8,14,0.08) 26%,
              rgba(3,8,14,0.00) 40%,
              rgba(3,8,14,0.00) 62%,
              rgba(3,8,14,0.10) 76%,
              rgba(3,8,14,0.30) 90%,
              rgba(3,8,14,0.60) 100%
            );
        }

        .hero-bg::after {
          background:
            radial-gradient(720px 220px at 8% 2%, rgba(255,255,255,0.08), transparent 58%),
            linear-gradient(180deg, rgba(255,255,255,0.03), transparent 20%),
            linear-gradient(0deg, rgba(0,0,0,0.22), rgba(0,0,0,0.00) 34%);
          opacity: 0.58;
        }

        .content {
          position: relative;
          z-index: 2;
          height: 100%;
          min-height: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 18px 20px 18px;
          overflow: hidden;
        }

        .headline {
          min-width: 0;
        }

        .date-line {
          margin: 0 0 11px;
          color: var(--hero-muted);
          font-size: 11px;
          line-height: 1;
          font-weight: 700;
          text-transform: uppercase;
        }

        .greeting {
          margin: 0;
          max-width: 560px;
          color: var(--hero-text);
          font-size: 23px;
          line-height: 1.15;
          font-weight: 760;
          text-shadow: 0 2px 18px rgba(0,0,0,0.26);
        }

        .clock {
          margin-top: 14px;
          color: rgba(255,255,255,0.95);
          font-size: clamp(56px, 7.4vh, 78px);
          line-height: 0.96;
          font-weight: 220;
          font-variant-numeric: tabular-nums;
          text-shadow: 0 10px 32px rgba(0,0,0,0.28);
        }

        .weather-dock {
          appearance: none;
          -webkit-appearance: none;
          width: 100%;
          min-height: 88px;
          display: grid;
          grid-template-columns: minmax(190px, 1.05fr) minmax(130px, 0.9fr) minmax(138px, 0.92fr);
          align-items: center;
          gap: 18px;
          padding: 0;
          margin: 0;
          text-align: left;
          background: transparent;
          border: 0;
          outline: none;
          position: relative;
          transition: filter 180ms ease, transform 180ms ease;
          z-index: 2;
        }

        .weather-dock::before {
          display: none;
        }

        .weather-dock:hover {
          filter: brightness(1.06);
        }

        .weather-dock:active {
          transform: translateY(1px) scale(0.995);
        }

        .weather-primary {
          display: flex;
          align-items: center;
          gap: 14px;
          min-width: 0;
        }

        .weather-primary img {
          width: 64px;
          height: 64px;
          flex: 0 0 64px;
          display: block;
          filter: drop-shadow(0 12px 18px rgba(0,0,0,0.30));
        }

        .weather-temp {
          display: block;
          color: var(--hero-text);
          font-size: 30px;
          line-height: 1;
          font-weight: 320;
          white-space: nowrap;
        }

        .weather-feels {
          display: block;
          margin-top: 6px;
          color: var(--hero-muted);
          font-size: 11px;
          line-height: 1.1;
          font-weight: 520;
          white-space: nowrap;
        }

        .metric-group {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
          min-width: 0;
        }

        .metric-group.sun {
          padding-left: 16px;
          border-left: 1px solid rgba(255,255,255,0.11);
        }

        .weather-metric {
          min-width: 0;
          display: grid;
          grid-template-columns: 20px minmax(42px, auto) 1fr;
          align-items: center;
          column-gap: 8px;
        }

        .weather-metric bruno-icon {
          --mdc-icon-size: 16px;
          width: 16px;
          height: 16px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        .metric-label {
          color: rgba(255,255,255,0.62);
          font-size: 10px;
          line-height: 1;
          font-weight: 720;
          text-transform: uppercase;
          white-space: nowrap;
        }

        .metric-value {
          justify-self: end;
          color: rgba(255,255,255,0.88);
          font-size: 11px;
          line-height: 1;
          font-weight: 650;
          white-space: nowrap;
        }

        @media (max-width: 1100px) {
          .content {
            padding: 16px 18px 16px;
          }

          .hero-bg {
            right: -82px;
            top: -14px;
            bottom: -18px;
          }

          .weather-dock {
            grid-template-columns: minmax(180px, 1fr) minmax(120px, 0.86fr) minmax(122px, 0.86fr);
            gap: 13px;
          }

          .weather-primary img {
            width: 56px;
            height: 56px;
            flex-basis: 56px;
          }
        }

        @media (max-width: 800px) {
          :host {
            min-height: ${r};
            overflow: hidden;
          }

          .hero-stage {
            overflow: hidden;
          }

          .hero-bg {
            top: -10px;
            bottom: -12px;
            left: -10px;
            right: -16px;
            background:
              linear-gradient(90deg,
                rgba(4,10,18,0.84) 0%,
                rgba(5,10,18,0.66) 18%,
                rgba(6,12,20,0.34) 36%,
                rgba(6,12,20,0.14) 54%,
                rgba(6,12,20,0.22) 70%,
                rgba(6,12,20,0.52) 86%,
                rgba(6,12,20,0.82) 100%
              ),
              linear-gradient(180deg,
                rgba(4,8,14,0.76) 0%,
                rgba(4,8,14,0.38) 14%,
                rgba(4,8,14,0.10) 28%,
                rgba(4,8,14,0.00) 42%,
                rgba(4,8,14,0.00) 60%,
                rgba(4,8,14,0.14) 76%,
                rgba(4,8,14,0.42) 90%,
                rgba(4,8,14,0.76) 100%
              ),
              url(${t}) left center / auto 100% no-repeat,
              url(${a}) left center / auto 100% no-repeat;
          }

          .content {
            padding: 16px;
          }

          .greeting {
            font-size: 21px;
          }

          .clock {
            font-size: 60px;
          }

          .weather-dock {
            grid-template-columns: 1fr;
            gap: 12px;
            min-height: 0;
            padding-top: 14px;
          }

          .metric-group.sun {
            padding-left: 0;
            border-left: 0;
          }

        }

        .hero-stage.is-mobile .content {
          padding: 14px 16px 14px;
        }

        .hero-stage.is-mobile .date-line {
          margin-bottom: 9px;
          font-size: 10px;
        }

        .hero-stage.is-mobile .greeting {
          font-size: 20px;
          max-width: 300px;
        }

        .hero-stage.is-mobile .clock {
          margin-top: 10px;
          font-size: 58px;
        }

        .hero-stage.is-mobile .weather-dock {
          grid-template-columns: minmax(154px, 1fr) minmax(102px, 0.76fr) minmax(102px, 0.76fr);
          gap: 10px;
          min-height: 62px;
        }

        .hero-stage.is-mobile .weather-primary {
          gap: 10px;
        }

        .hero-stage.is-mobile .weather-primary img {
          width: 50px;
          height: 50px;
          flex-basis: 50px;
        }

        .hero-stage.is-mobile .weather-temp {
          font-size: 26px;
        }

        .hero-stage.is-mobile .metric-group {
          gap: 7px;
        }

        .hero-stage.is-mobile .metric-group.sun {
          padding-left: 10px;
        }

        .hero-stage.is-mobile .metric-label {
          font-size: 9px;
        }

        .hero-stage.is-mobile .metric-value {
          font-size: 10px;
        }

        @media (max-width: 430px) {
          .hero-stage.is-mobile .weather-dock {
            grid-template-columns: minmax(150px, 1fr) minmax(92px, 0.7fr);
          }

          .hero-stage.is-mobile .metric-group.sun {
            display: none;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .weather-dock {
            transition: none !important;
          }
        }
      </style>

      <section class="hero-stage${i}" aria-label="Hero do dashboard">
        <div class="hero-bg" aria-hidden="true"></div>

        <div class="content">
          <div class="headline">
            <p class="date-line">${w._escape(this._dateLine())}</p>
            <h2 class="greeting">${w._escape(this._greeting())}</h2>
            <div class="clock">${w._escape(this._clock())}</div>
          </div>

          <button class="weather-dock" type="button" aria-label="Abrir clima">
            <span class="weather-primary">
              <img src="${w._escape(e.icon)}" alt="${w._escape(e.state)}">
              <span>
                <span class="weather-temp">${w._escape(e.temperature)}</span>
                <span class="weather-feels">Sensação ${w._escape(e.apparent)}</span>
              </span>
            </span>

            <span class="metric-group">
              ${this._weatherMetric("mdi:water-percent", "#60a5fa", "Umid", e.humidity)}
              ${this._weatherMetric("mdi:weather-windy", "#7dd3fc", "Vento", e.wind)}
            </span>

            <span class="metric-group sun">
              ${this._weatherMetric("mdi:weather-sunset-up", "#fb923c", "Nascer", e.rising)}
              ${this._weatherMetric("mdi:weather-sunset-down", "#f97316", "Pôr", e.setting)}
            </span>
          </button>
        </div>
      </section>
    `, this.shadowRoot.querySelector(".weather-dock")?.addEventListener("click", (n) => {
      n.preventDefault(), n.stopPropagation(), this._openWeatherPopup();
    });
  }
  static _cssUrl(e) {
    return String(e || "").replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\)/g, "\\)");
  }
  static _withCacheBust(e, t) {
    if (!e) return "";
    const a = String(e).includes("?") ? "&" : "?";
    return `${e}${a}v=${t || Date.now()}`;
  }
  static _miniCamera(e) {
    const t = !!(e?.imageUrl || e?.image), a = e?.online ? " is-online" : "";
    return `
      <button class="camera-thumb${t ? "" : " is-image-error"}" type="button" data-camera-id="${w._escapeAttr(e?.entity || "")}" aria-label="${w._escapeAttr(e?.name || "Camera")}">
        ${t ? `<img src="${w._escapeAttr(e.imageUrl || e.image)}" data-camera-src-base="${w._escapeAttr(e.image || e.imageUrl)}" data-camera-entity="${w._escapeAttr(e.entity || "")}" alt="">` : ""}
        <span class="camera-placeholder" aria-hidden="true"><bruno-icon icon="mdi:video-outline"></bruno-icon></span>
        <span class="camera-label">
          <span class="camera-dot${a}" aria-hidden="true"></span>
          <strong>${w._escape(e?.short_name || e?.name || "Camera")}</strong>
        </span>
      </button>
    `;
  }
  static _escapeAttr(e) {
    return w._escape(e).replace(/'/g, "&#39;");
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
}
customElements.get(xt) || customElements.define(xt, w);
window.customCards = window.customCards || [];
window.customCards.push({
  type: xt,
  name: "Bruno Hero Card",
  preview: !1,
  description: "Atmospheric Bento Hero with blended background layer and preserved weather popup."
});
const ii = "(max-width: 800px)", ba = "bruno-hero-card", ga = "bento-sidebar-liquid-card", ho = 6e3, ma = () => !!globalThis.matchMedia?.(ii).matches;
function Q(o) {
  o?.__brunoChatHeroTimer && (clearInterval(o.__brunoChatHeroTimer), o.__brunoChatHeroTimer = null);
}
function fa(o, e) {
  if (!o?.shadowRoot || !Array.isArray(e) || !e.length) return;
  const t = e.length, a = Math.max(0, Number(o.__brunoChatHeroIndex) || 0) % t;
  o.__brunoChatHeroIndex = a, e.forEach((i, r) => {
    const n = r === a;
    i.classList.toggle("bruno-chat-active", n), i.setAttribute("aria-hidden", n ? "false" : "true"), i.tabIndex = n && !i.classList.contains("is-insight") ? 0 : -1;
  }), o.shadowRoot.querySelectorAll("[data-bruno-chat-dot]").forEach((i, r) => {
    i.classList.toggle("is-active", r === a);
  });
}
function bo(o) {
  if (!o || o.querySelector("style[data-bruno-chat-hero-patch]")) return;
  const e = document.createElement("style");
  e.dataset.brunoChatHeroPatch = "1", e.textContent = `
    @media (max-width: 800px) {
      .hero-stage.is-v2 {
        height: 178px !important;
        min-height: 178px !important;
      }

      .hero-stage.is-v2 .content {
        padding: 6px 16px 7px !important;
        gap: 0 !important;
      }

      .hero-stage.is-v2 .headline {
        column-gap: 12px !important;
      }

      .hero-stage.is-v2 .clock {
        margin-top: 0 !important;
        font-size: clamp(66px, 17vw, 72px) !important;
        line-height: 0.92 !important;
        font-weight: 220 !important;
      }

      .hero-stage.is-v2 .inline-weather {
        display: grid !important;
        grid-template-columns: 24px minmax(0, auto) !important;
        grid-template-rows: auto auto !important;
        grid-template-areas: "weather-icon weather-temp" "weather-icon weather-label" !important;
        align-items: center !important;
        justify-items: start !important;
        column-gap: 7px !important;
        row-gap: 3px !important;
        width: auto !important;
        min-width: 0 !important;
        max-width: 100% !important;
        margin-top: 0 !important;
        justify-self: end !important;
      }

      .hero-stage.is-v2 .inline-weather img {
        grid-area: weather-icon !important;
        width: 24px !important;
        height: 24px !important;
        align-self: center !important;
      }

      .hero-stage.is-v2 .inline-weather strong {
        grid-area: weather-temp !important;
        font-size: 16px !important;
        line-height: 1 !important;
      }

      .hero-stage.is-v2 .inline-weather small {
        grid-area: weather-label !important;
        max-width: min(35vw, 142px) !important;
        font-size: 11.5px !important;
        line-height: 1.08 !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel {
        position: relative !important;
        display: block !important;
        min-height: 48px !important;
        margin-top: 4px !important;
        padding-top: 9px !important;
        padding-right: 46px !important;
        overflow: hidden !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel::before {
        content: "";
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 1px;
        background: linear-gradient(90deg, transparent, rgba(255,255,255,0.17) 20%, rgba(255,255,255,0.29) 50%, rgba(255,255,255,0.17) 80%, transparent);
        pointer-events: none;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel > .event-line.bruno-chat-page {
        display: flex !important;
        position: absolute !important;
        top: 9px !important;
        left: 0 !important;
        right: 46px !important;
        width: auto !important;
        opacity: 0 !important;
        transform: translateY(2px) !important;
        pointer-events: none !important;
        transition: opacity 170ms ease, transform 170ms ease !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel
      > .event-line.bruno-chat-page:not(.is-insight) {
        padding-left: 11px !important;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel
      > .event-line.bruno-chat-page:not(.is-insight)::before {
        content: "";
        position: absolute;
        left: 0;
        top: 2px;
        bottom: 2px;
        width: 2px;
        border-radius: 999px;
        background: linear-gradient(
          180deg,
          rgba(255, 205, 70, 0.96),
          rgba(255, 171, 0, 0.78)
        );
        box-shadow: 0 0 8px rgba(255, 186, 32, 0.22);
        pointer-events: none;
      }

      .hero-stage.is-v2 .headline .event-stack.bruno-chat-carousel > .event-line.bruno-chat-page.bruno-chat-active {
        opacity: 1 !important;
        transform: translateY(0) !important;
        pointer-events: auto !important;
      }

      .hero-stage.is-v2 .headline .event-stack > .event-line.is-empty {
        display: none !important;
      }

      .bruno-chat-event-dots {
        position: absolute;
        right: 2px;
        top: 28px;
        display: flex;
        align-items: center;
        gap: 5px;
        pointer-events: none;
      }

      .bruno-chat-event-dot {
        width: 5px;
        height: 5px;
        border-radius: 50%;
        background: rgba(255,255,255,0.32);
        transition: background 170ms ease, box-shadow 170ms ease;
      }

      .bruno-chat-event-dot.is-active {
        background: rgba(255,255,255,0.92);
        box-shadow: 0 0 7px rgba(255,255,255,0.35);
      }
    }

    @media (max-width: 360px) {
      .hero-stage.is-v2 .clock {
        font-size: 66px !important;
      }

      .hero-stage.is-v2 .headline {
        column-gap: 8px !important;
      }

      .hero-stage.is-v2 .inline-weather {
        column-gap: 5px !important;
      }

      .hero-stage.is-v2 .inline-weather small {
        max-width: 112px !important;
        font-size: 10.5px !important;
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .event-line.bruno-chat-page,
      .bruno-chat-event-dot {
        transition: none !important;
      }
    }
  `, o.appendChild(e);
}
function va(o) {
  if (!o?.shadowRoot || o?._config?.hero_layout !== "v2" || !ma()) {
    Q(o);
    return;
  }
  const e = o.shadowRoot, t = e.querySelector(".hero-stage.is-v2"), a = e.querySelector(".headline .event-stack");
  if (!t || !a) return;
  bo(e);
  const i = [...a.querySelectorAll(":scope > .event-line")], r = i.filter((s) => !s.classList.contains("is-empty"));
  if (i.filter((s) => s.classList.contains("is-empty")).forEach((s) => {
    s.style.display = "none", s.setAttribute("aria-hidden", "true"), s.tabIndex = -1;
  }), a.querySelector(".bruno-chat-event-dots")?.remove(), !r.length) {
    a.classList.remove("bruno-chat-carousel"), a.style.display = "none", Q(o), o.__brunoChatHeroIndex = 0;
    return;
  }
  if (a.style.removeProperty("display"), a.classList.add("bruno-chat-carousel"), r.forEach((s) => s.classList.add("bruno-chat-page")), o.__brunoChatHeroIndex = Math.max(0, Number(o.__brunoChatHeroIndex) || 0) % r.length, r.length > 1) {
    const s = document.createElement("span");
    s.className = "bruno-chat-event-dots", s.setAttribute("aria-hidden", "true"), r.forEach((l, c) => {
      const p = document.createElement("i");
      p.className = "bruno-chat-event-dot", p.dataset.brunoChatDot = String(c), s.appendChild(p);
    }), a.appendChild(s);
  }
  if (fa(o, r), r.length <= 1) {
    Q(o);
    return;
  }
  o.__brunoChatHeroTimer || (o.__brunoChatHeroTimer = setInterval(() => {
    if (!o.isConnected || !ma()) {
      Q(o);
      return;
    }
    const s = [...o.shadowRoot?.querySelectorAll(".event-stack.bruno-chat-carousel > .event-line.bruno-chat-page") || []];
    if (s.length <= 1) {
      Q(o);
      return;
    }
    o.__brunoChatHeroIndex = (Math.max(0, Number(o.__brunoChatHeroIndex) || 0) + 1) % s.length, fa(o, s);
  }, ho));
}
function go(o) {
  if (!o || o.prototype.__brunoChatHomePatch) return;
  const e = o.prototype;
  e.__brunoChatHomePatch = !0;
  const t = e._renderDesktop;
  e._renderDesktop = function(...n) {
    const s = t.apply(this, n);
    return va(this), s;
  };
  const a = e.connectedCallback;
  e.connectedCallback = function(...n) {
    const s = a?.apply(this, n);
    return !this.__brunoChatViewportQuery && globalThis.matchMedia && (this.__brunoChatViewportQuery = globalThis.matchMedia(ii), this.__brunoChatViewportListener = () => {
      Q(this), this._render?.();
    }, this.__brunoChatViewportQuery.addEventListener?.("change", this.__brunoChatViewportListener)), va(this), s;
  };
  const i = e.disconnectedCallback;
  e.disconnectedCallback = function(...n) {
    return Q(this), this.__brunoChatViewportQuery && this.__brunoChatViewportListener && this.__brunoChatViewportQuery.removeEventListener?.("change", this.__brunoChatViewportListener), this.__brunoChatViewportQuery = null, this.__brunoChatViewportListener = null, i?.apply(this, n);
  };
}
function mo(o) {
  if (!o || o.querySelector("style[data-bruno-chat-rail-patch]")) return;
  const e = document.createElement("style");
  e.dataset.brunoChatRailPatch = "1", e.textContent = `
    @media (max-width: 800px) {
      .overflow-hint {
        top: 2px !important;
        bottom: auto !important;
        margin-bottom: 0 !important;
        right: 10px !important;
      }
    }
  `, o.appendChild(e);
}
function fo(o) {
  if (!o || o.prototype.__brunoChatRailPatch) return;
  const e = o.prototype;
  e.__brunoChatRailPatch = !0;
  const t = e._render;
  e._render = function(...i) {
    const r = t.apply(this, i);
    return mo(this.shadowRoot), r;
  };
}
Promise.all([
  customElements.whenDefined(ba),
  customElements.whenDefined(ga)
]).then(() => {
  go(customElements.get(ba)), fo(customElements.get(ga));
});
const yt = "bruno-top-badges-card", vo = [
  { visual: 0, position: 0 },
  { visual: 25, position: 33 },
  { visual: 50, position: 47 },
  { visual: 75, position: 70 },
  { visual: 100, position: 100 }
], _o = {
  expanded: "input_select.hemma_expanded_row",
  person: "person.bruno_helasio",
  locks: ["lock.porta_sala", "lock.porta_servico"],
  door: "binary_sensor.entrada_porta_aberta",
  motion: "binary_sensor.entrada_movimento",
  lights_group: "light.todas_as_luzes",
  lights: [
    "light.sala_switch_1",
    "light.sala_switch_2",
    "light.sala_switch_3",
    "light.sala_2_switch_2",
    "light.sala_2_switch_3",
    "light.varanda_switch_1",
    "light.varanda_switch_2",
    "light.cozinha_switch_1",
    "light.cozinha_switch_2",
    "light.cozinha_switch_3",
    "light.cz_luz_principal",
    "light.quarto_casal_switch_1",
    "light.quarto_casal_switch_2",
    "light.quarto_casal_2_switch_2",
    "light.quarto_casal_2_switch_3",
    "light.qc_luz_principal",
    "light.suite_casal_switch_1",
    "light.suite_casal_switch_2",
    "light.quarto_marina_switch_1",
    "light.quarto_marina_switch_2",
    "light.quarto_marina_switch_3",
    "light.quarto_marina_switch_4",
    "light.suite_marina_switch_1",
    "light.suite_marina_switch_2",
    "light.office_switch_1",
    "light.office_switch_2",
    "light.office_switch_3",
    "light.lavabo_switch_1",
    "light.lavabo_switch_2",
    "light.lavabo_switch_3",
    "light.corredor_switch_1",
    "light.quarto_miguel_switch_1",
    "light.quarto_miguel_switch_2",
    "light.quarto_miguel_switch_3",
    "light.quarto_miguel_2_switch_1",
    "light.quarto_miguel_2_switch_2",
    "light.quarto_miguel_2_switch_3"
  ],
  media: [
    "media_player.android_tv_192_168_3_17",
    "media_player.smart_tv_pro_2",
    "media_player.spotifyplus_bruno_helasio",
    "media_player.echo_show",
    "media_player.echo_pop_office",
    "media_player.echo_pop_quarto_casal",
    "media_player.echo_pop_marina"
  ],
  climate: [
    "climate.sl_ar_condicionado",
    "climate.ac_office",
    "climate.ac_quarto_miguel",
    "climate.ac_quarto_marina"
  ],
  curtains: [
    {
      title: "Sala",
      entity: "cover.cortina_varanda_cortina_2",
      percent_control: "number.cortina_varanda_percent_control"
    }
  ]
}, _a = ["playing", "paused", "on"], xa = ["off", "unavailable", "unknown", ""];
class N extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      entities: {
        ..._o,
        ...e?.entities || {}
      },
      ...e
    }, this._render();
  }
  set hass(e) {
    this._hass = e, this._render();
  }
  getCardSize() {
    return 1;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _isUnavailable(e) {
    return !e || xa.includes(String(e.state || "").toLowerCase());
  }
  _expanded() {
    return this._localExpanded && this._localExpanded !== "none" ? this._localExpanded : this._state(this._config.entities.expanded)?.state || "none";
  }
  _entityName(e) {
    return this._state(e)?.attributes?.friendly_name || e;
  }
  _toPercent(e) {
    const t = Number(e);
    return Number.isFinite(t) ? Math.max(0, Math.min(100, Math.round(t))) : null;
  }
  _interpolateCurtainPercent(e, t, a) {
    const i = this._toPercent(e) ?? 0, r = vo;
    if (i <= r[0][t]) return r[0][a];
    for (let n = 1; n < r.length; n += 1) {
      const s = r[n - 1], l = r[n];
      if (i <= l[t]) {
        const c = l[t] - s[t];
        if (c === 0) return l[a];
        const p = (i - s[t]) / c;
        return this._toPercent(s[a] + (l[a] - s[a]) * p) ?? l[a];
      }
    }
    return r[r.length - 1][a];
  }
  _curtainDisplayOpenPosition(e) {
    return this._interpolateCurtainPercent(e, "position", "visual");
  }
  _setExpanded(e) {
    const t = this._config.entities.expanded;
    if (!t || !this._hass) {
      this._localExpanded = this._localExpanded === e ? "none" : e, this._render();
      return;
    }
    const i = this._expanded() === e ? "none" : e;
    if (!(this._state(t)?.attributes?.options || []).includes(i)) {
      this._localExpanded = i, this._render();
      return;
    }
    this._localExpanded = "none", this._hass.callService("input_select", "select_option", {
      entity_id: t,
      option: i
    });
  }
  _securityModel() {
    const e = this._config.entities, t = e.locks || [], a = t.some((s) => this._state(s)?.state === "unlocked"), i = this._state(e.door)?.state === "on", r = this._state(e.motion)?.state === "on";
    let n = "Locked";
    return a && (n = "Unlocked"), i && (n = "Door Open"), r && (n = "Motion"), {
      key: "security",
      title: "Security",
      sub: n,
      icon: "mdi:shield-lock",
      tone: "blue",
      active: a || i || r,
      chips: t.map((s) => {
        const l = this._state(s)?.state || "unknown";
        return {
          icon: l === "locked" ? "mdi:lock" : "mdi:lock-open-variant",
          title: this._entityName(s),
          sub: l.replace("_", " "),
          entityId: s,
          action: l === "unlocked" ? "lock" : ""
        };
      })
    };
  }
  _expandLights(e, t = /* @__PURE__ */ new Set()) {
    return e.flatMap((a) => {
      if (!a || t.has(a)) return [];
      t.add(a);
      const i = this._state(a);
      if (!i) return [];
      const r = i.attributes?.entity_id;
      return Array.isArray(r) && r.length ? this._expandLights(r, t) : a.startsWith("light.") ? [a] : [];
    });
  }
  _lightsModel() {
    const e = this._config.entities, t = this._state(e.lights_group)?.attributes?.entity_id, a = [.../* @__PURE__ */ new Set([
      ...Array.isArray(t) ? t : [],
      ...e.lights || []
    ])], i = [...new Set(this._expandLights(a))], r = i.filter((s) => this._state(s)?.state === "on");
    return {
      key: "lights",
      title: "Lights",
      sub: r.length === 0 ? "All Off" : r.length === i.length ? "All On" : `${r.length} On`,
      icon: "mdi:lightbulb",
      tone: "amber",
      active: r.length > 0,
      chips: r.map((s) => {
        const l = this._state(s)?.attributes?.brightness;
        return {
          icon: "mdi:lightbulb-on",
          title: this._entityName(s),
          sub: l != null ? `${Math.round(Number(l) / 255 * 100)}%` : "On",
          entityId: s,
          action: "toggle-light"
        };
      })
    };
  }
  _mediaModel() {
    const e = (this._config.entities.media || []).filter((t) => _a.includes(this._state(t)?.state || ""));
    return {
      key: "media",
      title: "Media",
      sub: e.length ? `${e.length} On` : "All Off",
      icon: "mdi:speaker-wireless",
      tone: "gray",
      active: e.length > 0,
      chips: e.map((t) => ({
        icon: "mdi:music-note",
        title: this._entityName(t),
        sub: (this._state(t)?.state || "on").replace("_", " "),
        entityId: t,
        action: "play-pause-media"
      }))
    };
  }
  _climateModel() {
    const e = (this._config.entities.climate || []).filter((t) => !xa.includes(this._state(t)?.state || "unknown"));
    return {
      key: "climate",
      title: "Climate",
      sub: e.length ? `${e.length} On` : "Off",
      icon: "mdi:fan",
      tone: "green",
      active: e.length > 0,
      chips: e.map((t) => {
        const a = this._state(t)?.attributes?.temperature;
        return {
          icon: "mdi:air-conditioner",
          title: this._entityName(t),
          sub: a != null ? `${a}°` : (this._state(t)?.state || "on").replace("_", " "),
          entityId: t,
          action: "toggle-climate"
        };
      })
    };
  }
  _curtainOpenPosition(e) {
    const t = e.entity || e.cover, a = this._state(t), i = String(a?.state || "").toLowerCase(), r = this._state(e.percent_control || e.percentControl), n = this._isUnavailable(r) ? null : this._toPercent(r?.state);
    if (n != null) return 100 - n;
    const s = this._toPercent(a?.attributes?.current_position);
    return s != null ? i === "open" && s <= 1 ? 100 : i === "closed" && s >= 99 ? 0 : s : i === "open" ? 100 : 0;
  }
  _curtainsModel() {
    return {
      key: "curtains",
      title: "Cortinas",
      sub: "",
      icon: "mdi:curtains",
      tone: "amber",
      active: !1,
      chips: (this._config.entities.curtains || []).map((a) => typeof a == "string" ? { entity: a } : a).filter((a) => a?.entity || a?.cover).map((a) => {
        const i = a.entity || a.cover, r = this._state(i), n = String(r?.state || "").toLowerCase(), s = !this._isUnavailable(r), l = s ? this._curtainOpenPosition(a) : null, c = l == null ? null : this._curtainDisplayOpenPosition(l), p = c == null ? null : 100 - c;
        return {
          icon: p != null && p >= 97 ? "mdi:curtains-closed" : "mdi:curtains",
          title: a.title || this._entityName(i),
          sub: p == null ? "indisponivel" : `${p}% fechada`,
          active: s && (n === "opening" || n === "closing"),
          entityId: i,
          action: s ? "toggle-curtain" : "",
          value: p
        };
      })
    };
  }
  // Prioridade exclusiva do telefone. O tablet conserva a ordem historica.
  // Nivel 0: anomalia/atencao; nivel 1: atividade; nivel 2: estado normal.
  // O indice original desempata, impedindo trocas arbitrarias a cada update.
  _mobilePriority(e) {
    const t = `${e?.title || ""} ${e?.sub || ""}`.toLowerCase(), a = e?.key === "security" && e?.active, i = /unlocked|door open|error|offline|unavailable/.test(t);
    if (a || i) return 0;
    const r = e?.key === "curtains" && (e.chips || []).some((n) => n.active || Number.isFinite(n.value) && n.value < 97);
    return e?.active || r ? 1 : 2;
  }
  _models() {
    const e = [
      this._securityModel(),
      this._curtainsModel(),
      this._lightsModel(),
      this._mediaModel(),
      this._climateModel(),
      // NOVO (2026-07-25) — HOME V2 item 3: o card de energia saiu da Home,
      // então o resumo de consumo passou a viver aqui. Se o package
      // home_insights nao estiver carregado, o badge se omite (ver
      // _energyModel -> retorno null filtrado abaixo).
      this._energyModel()
    ].filter(Boolean);
    return globalThis.matchMedia?.("(max-width: 800px)")?.matches === !0 ? e.map((a, i) => ({ model: a, index: i, priority: this._mobilePriority(a) })).sort((a, i) => a.priority - i.priority || a.index - i.index).map((a) => a.model) : e;
  }
  // NOVO (2026-07-25) — Badge de Energia.
  // TODA a matemática (kW + desvio %) vem do backend, em
  // sensor.home_energy_status (package home_insights.yaml) — fonte única
  // compartilhada com as linhas inteligentes do hero. Aqui só se exibe.
  _energyModel() {
    const e = this._state(this._config.entities.energy_status || "sensor.home_energy_status");
    if (!e || ["unknown", "unavailable"].includes(String(e.state).toLowerCase()))
      return null;
    const t = e.attributes || {}, a = t.delta_pct, i = Number.parseInt(a, 10), r = Number.isFinite(i), n = [], s = (l, c, p) => {
      const d = this._state(l);
      if (!d || this._isUnavailable(d)) return;
      const h = Number.parseFloat(d.state);
      n.push({
        icon: p,
        title: c,
        sub: Number.isFinite(h) ? `${h.toFixed(1).replace(".", ",")} kWh` : d.state,
        entityId: l
      });
    };
    return s("sensor.energia_total_casa_diaria", "Hoje", "mdi:calendar-today"), s("sensor.energia_total_casa_semanal", "Semana", "mdi:calendar-week"), s("sensor.energia_total_casa_mensal", "Mes", "mdi:calendar-month"), s("sensor.energia_luzes_diaria", "Luzes", "mdi:lightbulb"), s("sensor.energia_clima_diaria", "Clima", "mdi:air-conditioner"), {
      key: "energy",
      title: "Energy",
      sub: t.badge_sub || `${e.state} kW`,
      icon: "mdi:flash",
      tone: "amber",
      // Aceso apenas quando o consumo está acima do esperado para o horário.
      active: r && i > 15,
      chips: n
    };
  }
  _visibleModels(e, t) {
    if (!t || t === "none") return e;
    const a = e.findIndex((i) => i.key === t);
    return a < 0 ? e : e.slice(0, a + 1);
  }
  _openSecurityPopup() {
    const e = this._config.entities.locks || [];
    this._fireDomEvent({
      action: "fire-dom-event",
      browser_mod: {
        service: "browser_mod.popup",
        data: {
          title: "Security",
          size: "wide",
          content: {
            type: "entities",
            entities: e.map((t) => ({ entity: t, name: this._entityName(t) }))
          }
        }
      }
    });
  }
  _toggleMainLock() {
    const e = (this._config.entities.locks || [])[0];
    !e || !this._hass || this._hass.callService("lock", "toggle", { entity_id: e }, { entity_id: e });
  }
  _callService(e, t = {}) {
    if (!this._hass || !e) return;
    const [a, i] = String(e).split(".");
    !a || !i || this._hass.callService(a, i, t);
  }
  _runChipAction(e, t, a) {
    if (!(!e || !t)) {
      if (globalThis.BrunoLiquidGlass?.feedback?.("tap"), e === "toggle-light") {
        this._callService("light.toggle", { entity_id: t });
        return;
      }
      if (e === "play-pause-media") {
        const i = String(this._state(t)?.state || "").toLowerCase();
        if (!_a.includes(i)) return;
        this._callService("media_player.media_play_pause", { entity_id: t });
        return;
      }
      if (e === "toggle-climate") {
        const i = this._state(t), r = String(i?.state || "").toLowerCase();
        if (!i || ["unavailable", "unknown", "", "none"].includes(r)) return;
        const n = r === "off" ? "climate.turn_on" : "climate.turn_off";
        this._callService(n, { entity_id: t });
        return;
      }
      if (e === "toggle-curtain") {
        const i = String(this._state(t)?.state || "").toLowerCase(), r = Number(a), n = i === "closed" ? "cover.open_cover" : i === "open" ? "cover.close_cover" : Number.isFinite(r) && r >= 50 ? "cover.open_cover" : "cover.close_cover";
        this._callService(n, { entity_id: t });
        return;
      }
      if (e === "lock") {
        if (this._state(t)?.state !== "unlocked") return;
        this._callService("lock.lock", { entity_id: t });
      }
    }
  }
  _runAction(e, t) {
    if (!(t === "hold" && e !== "security")) {
      if (e === "security" && t === "hold") {
        this._openSecurityPopup();
        return;
      }
      if (e === "security" && t === "double") {
        this._toggleMainLock();
        return;
      }
      this._setExpanded(e);
    }
  }
  _fireDomEvent(e) {
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: e,
      bubbles: !0,
      composed: !0
    }));
  }
  _wireActions() {
    this.shadowRoot.querySelectorAll("[data-badge-key]").forEach((e) => {
      const t = e.dataset.badgeKey;
      let a = null, i = null, r = !1;
      const n = () => {
        a && window.clearTimeout(a), a = null;
      }, s = () => {
        i && window.clearTimeout(i), i = null;
      };
      e.addEventListener("pointerdown", (l) => {
        l.button != null && l.button !== 0 || (l.preventDefault(), r = !1, e.classList.add("is-pressed"), e.setPointerCapture?.(l.pointerId), a = window.setTimeout(() => {
          r = !0, this._runAction(t, "hold");
        }, 560));
      }), e.addEventListener("pointerup", (l) => {
        if (l.preventDefault(), e.releasePointerCapture?.(l.pointerId), n(), e.classList.remove("is-pressed"), !r) {
          if (t === "security") {
            if (i) {
              s(), this._runAction(t, "double");
              return;
            }
            i = window.setTimeout(() => {
              i = null, this._runAction(t, "tap");
            }, 300);
            return;
          }
          this._runAction(t, "tap");
        }
      }), e.addEventListener("dblclick", (l) => {
        l.preventDefault(), n(), s(), this._runAction(t, "double");
      }), e.addEventListener("pointerleave", () => {
        n(), e.classList.remove("is-pressed");
      });
    });
  }
  _wireChipActions() {
    this.shadowRoot.querySelectorAll("button[data-chip-action][data-chip-entity]").forEach((e) => {
      const t = () => e.classList.remove("is-pressed");
      e.addEventListener("pointerdown", (a) => {
        a.button != null && a.button !== 0 || (a.stopPropagation(), e.classList.add("is-pressed"));
      }), e.addEventListener("pointerup", t), e.addEventListener("pointerleave", t), e.addEventListener("pointercancel", t), e.addEventListener("click", (a) => {
        a.preventDefault(), a.stopPropagation(), t(), this._runChipAction(e.dataset.chipAction, e.dataset.chipEntity, e.dataset.chipValue);
      });
    });
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._expanded(), t = this._models(), a = this._visibleModels(t, e), i = t.find((s) => s.key === e), n = this._state(this._config.entities.person)?.attributes?.entity_picture || "";
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          height: 48px;
          min-height: 0;
          contain: layout style;
          /* TRANSPARENTE: legibilidade vem da BORDA ATMOSFÉRICA escurecida do
             backdrop (vinheta no topo), não de faixa/blur aqui. */
        }

        /* NOVO (2026-08-06) — ALINHAMENTO COM AS SUBVIEWS.
           A faixa da Home ficava 10px abaixo da faixa das subviews. A causa
           esta no grid da Home (views/shell/section_home_v2.yaml) e o proprio
           autor a registrou:

             "Movida para o TOPO: o gap volta a ser um so (10px).
              Efeito colateral aceito: a faixa de badges desce 10px."

           A primeira linha do grid e uma linha-fantasma de 0px (safety net
           Sagaland, para as areas usadas so no phone). Ao move-la para o topo,
           o grid-gap de 10px passou a ficar ACIMA da faixa. Nas subviews a
           barra e a primeira linha real, sem gap acima.

           Correcao aqui, e nao no grid, de proposito: a aritmetica das linhas
           esta calibrada para somar 100vh e a constante do hero e espelhada em
           v2/bento_dynamic.yaml (available_height). Puxar o card 10px para
           cima cancela exatamente o gap, sem tocar em nenhuma das duas.

           A linha do grid continua com 48px, entao o hero nao se move.
           So no desktop/tablet: no phone a faixa ja e a primeira linha real.
           ROLLBACK: remover este bloco. */
        /* REMOVIDO (2026-08-06, rev.6) — TENTATIVA FRUSTRADA.
           margin-top: -10px no :host NAO move a faixa na Home: o layout-card
           envolve cada card num wrapper, e o item do grid e o WRAPPER. A margem
           deslocava o card DENTRO do wrapper, sem efeito na posicao da linha.
           A correcao real foi remover a linha-fantasma de 0px do grid da Home
           (views/shell/section_home_v2.yaml, rev.6). */

        /* NOVO (2026-08-06, 2a passada) — O DEGRAU NAO ERA POSICAO.
           Depois do ajuste acima, a geometria da Home e a da subview passaram a
           coincidir. Medido, com os dois cards montados na mesma pagina:

             Home    badge topo 13px · altura 46px · icone 18px
             Subview badge topo 13px · altura 46px · icone 18px

           O que sobrava era a PELE. As badges da Home eram PILULAS (borda,
           fundo, sombra e blur); as das subviews sao FLAT — so icone e texto.
           Uma pilula de 46px pinta um bloco de 13 a 59; a versao flat pinta so
           a tinta do conteudo. O olho le isso como degrau na transicao, mesmo
           com as caixas alinhadas ao pixel.

           Igualar a pele resolve de verdade e ainda atende o pedido anterior de
           "revisar o tamanho dos indicadores superiores": sem a pilula, a faixa
           fica mais leve.

           ROLLBACK: remover este bloco — as regras originais da pilula seguem
           logo abaixo, intactas. */
        @media (min-width: 901px) {
          .badge {
            border: 1px solid transparent;
            background: transparent;
            box-shadow: none;
            backdrop-filter: none;
            -webkit-backdrop-filter: none;
            padding: 0 16px;
            column-gap: 9px;
          }
          .badge:hover {
            background: rgba(255, 255, 255, 0.04);
          }
          /* Aceso: a subview acende pelo TOM do grupo, sem pilula branca. */
          .badge.is-active {
            background: transparent;
            border-color: transparent;
            color: rgba(255, 255, 255, 0.96);
            box-shadow: none;
          }
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        .badges-card {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: center;
          gap: 10px;
          padding: 0 4px;
          color: rgba(248,251,255,0.96);
        }

        .left {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
          overflow: visible;
        }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .badge {
          appearance: none;
          -webkit-appearance: none;
          height: 46px;
          min-width: 0;
          display: grid;
          grid-template-columns: 22px auto;
          align-items: center;
          column-gap: 8px;
          padding: 0 13px;
          border-radius: 999px;
          border: var(--bruno-liquid-chip-border, 1px solid rgba(255,255,255,0.14));
          background: var(--bruno-liquid-chip-background,
            linear-gradient(180deg, rgba(255,255,255,0.105), rgba(255,255,255,0.040)),
            rgba(16,18,24,0.46)
          );
          box-shadow: var(--bruno-liquid-chip-shadow,
            inset 0 1px 0 rgba(255,255,255,0.13),
            0 8px 20px rgba(0,0,0,0.14)
          );
          backdrop-filter: var(--bruno-liquid-chip-filter, blur(18px) saturate(1.28));
          -webkit-backdrop-filter: var(--bruno-liquid-chip-filter, blur(18px) saturate(1.28));
          transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .badge.is-active {
          background:
            radial-gradient(30px 24px at 22% 16%, rgba(255,255,255,0.62), transparent 74%),
            linear-gradient(180deg, rgba(255,255,255,0.92), rgba(246,248,252,0.78));
          border-color: rgba(255,255,255,0.42);
          color: rgba(14,18,24,0.88);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.48),
            0 10px 22px rgba(0,0,0,0.16),
            0 0 20px rgba(var(--tone),0.18);
        }

        .badge.is-expanded {
          border-color: rgba(var(--tone),0.50);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.34),
            0 8px 22px rgba(0,0,0,0.18),
            0 0 24px rgba(var(--tone),0.22);
        }

        .badge.is-pressed {
          transform: scale(0.98);
        }

        .badge-icon {
          position: relative;
          width: 22px;
          height: 22px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(var(--tone),0.98);
        }

        .badge-icon bruno-icon {
          --mdc-icon-size: 18px;
          position: absolute;
          left: 50%;
          top: 50%;
          transform: translate(-50%, -50%);
        }

        .badge-text {
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 2px;
          line-height: 1.02;
        }

        .badge-title {
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          color: currentColor;
        }

        .badge-sub {
          font-size: 11px;
          line-height: 1;
          font-weight: 650;
          color: var(--sub-color, rgba(255,255,255,0.66));
        }

        .badge.is-active .badge-sub {
          color: rgba(16,20,26,0.54);
        }

        .rail {
          min-width: 0;
          flex: 1 1 auto;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          overflow-x: auto;
          scrollbar-width: none;
          max-width: min(64vw, 720px);
        }

        .rail::-webkit-scrollbar { display: none; }

        .chip {
          flex: 0 0 auto;
          height: 42px;
          display: grid;
          grid-template-columns: 20px auto;
          align-items: center;
          column-gap: 8px;
          padding: 0 12px;
          border-radius: 999px;
          background: rgba(16,18,24,0.52);
          border: 1px solid rgba(255,255,255,0.13);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.10);
        }

        button.chip {
          appearance: none;
          -webkit-appearance: none;
          font: inherit;
          color: inherit;
          text-align: left;
          cursor: pointer;
        }

        button.chip:focus {
          outline: none;
        }

        .chip bruno-icon {
          --mdc-icon-size: 18px;
          color: rgba(var(--tone),0.95);
        }

        .chip-text {
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }

        .chip-title {
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.90);
        }

        .chip-sub {
          font-size: 10px;
          line-height: 1;
          font-weight: 640;
          color: rgba(255,255,255,0.54);
          text-transform: capitalize;
        }

        .empty-chip {
          color: rgba(255,255,255,0.52);
          font-size: 11px;
          font-weight: 650;
        }

        .avatars {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          min-width: max-content;
        }

        .avatar {
          width: 44px;
          height: 44px;
          flex: 0 0 44px;
          display: grid;
          place-items: center;
          overflow: hidden;
          border-radius: 50%;
          background: rgba(255,255,255,0.12);
          border: 1px solid rgba(255,255,255,0.22);
          color: rgba(255,255,255,0.82);
          font-size: 14px;
          font-weight: 800;
          box-shadow: 0 7px 16px rgba(0,0,0,0.18);
        }

        .avatar + .avatar {
          margin-left: -12px;
        }

        .avatar img {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .tone-blue { --tone: 126, 200, 255; }
        .tone-amber { --tone: 247, 198, 0; }
        .tone-gray { --tone: 154, 160, 166; }
        .tone-green { --tone: 86, 216, 155; }

        @media (max-width: 900px) {
          :host { height: auto; min-height: 48px; }
          .badges-card {
            grid-template-columns: 1fr;
            gap: 8px;
            min-width: 0;
            overflow: hidden;
            padding: 0;
          }
          .avatars { display: none; }
          .left {
            width: 100%;
            max-width: 100%;
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
            overscroll-behavior-x: contain;
            touch-action: pan-x;
            padding: 0 1px 2px;
          }
          .left::-webkit-scrollbar { display: none; }
          .badge {
            flex: 0 0 auto;
            touch-action: pan-x;
          }
          .rail {
            flex: 0 0 auto;
            max-width: none;
            touch-action: pan-x;
          }
        }

        /* NOVO (2026-08-15) — microajuste EXCLUSIVO do phone.
           A faixa visual da Home comecava em y=10px, enquanto o plano visual
           equivalente das subviews comecava em y=4,16px. O fluxo ja estava
           correto e nao podia ceder altura do hero; por isso o ajuste e apenas
           de pintura. A caixa continua reservando os mesmos 48px e somente seu
           conteudo sobe os 5,84px medidos no harness.

           ANTERIOR (rollback desta rodada): o transform foi colocado dentro do
           media de 900px. Isso tambem alcançaria a faixa 801–900px, que pertence
           ao tablet. O breakpoint correto e o contrato phone da shell: 800px. */
        @media (max-width: 800px) {
          :host { transform: translateY(-5.84px); }
        }

        /* ============================================================
           NOVO — FAIXA DE STATUS (re-skin savant). Bloco ADITIVO/CSS-only:
           a LÓGICA (modelos, contagem, .is-active aceso/apagado, expandir/
           colapsar via input_select, gestos) NÃO é tocada — só restilizo as
           classes vindas do JS. ROLLBACK: remover este bloco => volta às pílulas.
           Estado "aceso" no estilo mais premium/savant: SEM pill branco; o grupo
           ACENDE na sua cor de acento (--tone), com leve glow no ícone e a
           contagem na cor do grupo. "Apagado" = cinza sóbrio. Separação por
           filete fino entre badges (linguagem do rail/dock).
           ============================================================ */
        .left { gap: 0; }
        .left .badge + .badge {
          border-left: 1px solid rgba(255,255,255,0.10);   /* filete entre badges */
        }
        .badge {
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          padding: 0 16px;
          column-gap: 9px;
          color: rgba(255,255,255,0.92);
        }
        /* APAGADO (sóbrio) */
        .badge .badge-icon { color: rgba(255,255,255,0.44); }
        .badge .badge-title { color: rgba(255,255,255,0.60); font-weight: 600; }
        .badge .badge-sub { color: rgba(255,255,255,0.42); font-weight: 600; }
        /* ACESO (premium/savant): acende na cor do grupo, sem pill branco */
        .badge.is-active {
          background: transparent;
          border: none;
          box-shadow: none;
          color: inherit;
        }
        .badge.is-active .badge-icon {
          color: rgb(var(--tone));
          filter: drop-shadow(0 0 8px rgba(var(--tone),0.45));
        }
        .badge.is-active .badge-title { color: rgba(255,255,255,0.94); }
        .badge.is-active .badge-sub { color: rgb(var(--tone)); }
        /* EXPANDIDO: aba ativa discreta (sublinhado de acento + leve tinte) */
        .badge.is-expanded {
          background: linear-gradient(180deg, rgba(var(--tone),0.10), rgba(var(--tone),0.03));
          border: none;
          box-shadow: inset 0 -2px 0 rgba(var(--tone),0.55);
        }
        .badge.is-pressed { transform: scale(0.99); }
        /* lista expandida: RESPIRO + filete separando a badge ativa dos itens
           (antes a lista colava na badge e a borda do 1º chip encostava no
           acento/glow). */
        .left .rail {
          gap: 0;
          margin-left: 14px;
          padding-left: 14px;
          border-left: 1px solid rgba(255,255,255,0.12);
        }
        /* chips FLAT (mesmo idioma da faixa): SEM caixa/pílula, só ícone + nome,
           separados por filete fino — continuação natural da ribbon. */
        .chip {
          height: 40px;
          padding: 0 12px;
          border: none;
          border-radius: 0;
          background: transparent;
          box-shadow: none;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .rail .chip + .chip {
          border-left: 1px solid rgba(255,255,255,0.10);
        }

        /* ============================================================
           NOVO (2026-08-16) — LARGURA UNIFORME DAS TILES DE STATUS.

           POR ULTIMO de proposito. O bloco de re-skin acima redefine
           ".badge { padding: 0 16px }" sem media query; media query nao
           acrescenta especificidade, entao quem decide e a POSICAO. Colocado
           antes, o padding daqui era ignorado — medido.

           O DEFEITO: o bloco de 900px deixa ".badge { flex: 0 0 auto }", ou
           seja, largura ditada pelo CONTEUDO. Medido a 428px: 99,3 · 101,8 ·
           96,1 · 96,1 · 98,4 — desiguais. As quatro primeiras somavam 394,2 de
           408 uteis, entao bastava um rotulo mais longo (Energia) ser
           priorizado para a quarta ser cortada.

           25% da caixa de conteudo do trilho => quatro tiles ocupam a largura
           util EXATA, com qualquer combinacao que a prioridade escolher. O
           filete entre badges e "border-left" e o box-sizing e border-box,
           entao ele nao acrescenta largura.

           A LOGICA de prioridade (nivel 0 atencao, 1 atividade, 2 normal) NAO e
           tocada — so a geometria.

           BREAKPOINT: 800px, o contrato de telefone da shell. O bloco de 900px
           alcanca 801-900, que e faixa de tablet.

           ROLLBACK: remover este bloco; volta a largura por conteudo.
           ============================================================ */
        @media (max-width: 800px) {
          .badge {
            flex: 0 0 25%;
            min-width: 0;
            /* 16px de cada lado custavam 31% de uma tile de 101,5px. 10px
               devolve 12px ao texto sem encostar no filete. */
            padding: 0 10px;
            column-gap: 7px;
          }

          /* Sem isto um rotulo longo transborda a tile em vez de truncar, e a
             largura fixa nao adiantaria nada: o texto invadiria a vizinha. */
          .badge .badge-text { min-width: 0; max-width: 100%; }
          .badge .badge-title,
          .badge .badge-sub {
            display: block;
            max-width: 100%;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      </style>

      <div class="badges-card">
        <div class="left">
          ${a.map((s) => this._badge(s, e)).join("")}
          ${this._expandedRail(i)}
        </div>
        <div class="avatars" aria-label="Moradores">
          <span class="avatar">${n ? `<img src="${N._escapeAttr(n)}" alt="Bruno">` : "B"}</span>
          <span class="avatar">D</span>
          <span class="avatar">M</span>
        </div>
      </div>
    `, this._wireActions(), this._wireChipActions();
  }
  _badge(e, t) {
    const a = e.active ? " is-active" : "", i = t === e.key ? " is-expanded" : "";
    return `
      <button class="badge tone-${e.tone}${a}${i}" type="button" data-badge-key="${e.key}" aria-label="${N._escapeAttr(e.title)}">
        <span class="badge-icon" aria-hidden="true"><bruno-icon icon="${e.icon}"></bruno-icon></span>
        <span class="badge-text">
          <span class="badge-title">${N._escape(e.title)}</span>
          ${e.sub ? `<span class="badge-sub">${N._escape(e.sub)}</span>` : ""}
        </span>
      </button>
    `;
  }
  _expandedRail(e) {
    if (!e) return "";
    if (!e.chips?.length)
      return `<div class="rail tone-${e.tone}"><span class="chip empty-chip">Nada ativo</span></div>`;
    const t = (a) => {
      const i = `
        <bruno-icon icon="${a.icon}"></bruno-icon>
        <span class="chip-text">
          <span class="chip-title">${N._escape(a.title)}</span>
          <span class="chip-sub">${N._escape(a.sub)}</span>
        </span>
      `;
      if (!a.action || !a.entityId)
        return `<span class="chip">${i}</span>`;
      const r = a.value == null ? "" : ` data-chip-value="${N._escapeAttr(a.value)}"`, n = [a.title, a.sub].filter(Boolean).join(" - ");
      return `
        <button class="chip" type="button" data-chip-action="${N._escapeAttr(a.action)}" data-chip-entity="${N._escapeAttr(a.entityId)}"${r} aria-label="${N._escapeAttr(n)}">
          ${i}
        </button>
      `;
    };
    return `
      <div class="rail tone-${e.tone}">
        ${e.chips.map((a) => t(a)).join("")}
      </div>
    `;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return N._escape(e).replace(/'/g, "&#39;");
  }
}
customElements.get(yt) || customElements.define(yt, N);
window.customCards = window.customCards || [];
window.customCards.push({
  type: yt,
  name: "Bruno Top Badges Card",
  preview: !1,
  description: "Isolated Bento top badges card with preserved status expansion semantics."
});
const wt = "bruno-quick-actions-card", ya = [
  {
    key: "lights_off",
    icon: "mdi:lightbulb-off-outline",
    label: "Luzes",
    group: "actions",
    tap_action: {
      action: "call-service",
      service: "homeassistant.turn_off",
      data: { entity_id: "light.todas_as_luzes" }
    }
  },
  {
    key: "wifi",
    icon: "mdi:wifi",
    label: "Wi-Fi",
    group: "actions",
    tap_action: {
      action: "fire-dom-event",
      browser_mod: {
        service: "browser_mod.popup",
        data: {
          title: "Wi-Fi",
          tag: "wifi_qr",
          style: `
            --popup-width: 450px;
            --popup-max-width: min(450px, calc(100vw - 32px));
            --popup-background-color: rgba(15, 20, 35, 0.75);
            --mdc-theme-surface: rgba(20, 24, 33, 0.88);
            --mdc-dialog-scrim-color: rgba(0, 0, 0, 0.56);
          `,
          content: {
            type: "picture",
            image: "/local/images/wifi_main_scanme.png"
          }
        }
      }
    }
  },
  {
    key: "refresh",
    icon: "mdi:refresh",
    label: "Atualizar",
    group: "actions",
    tap_action: {
      action: "fire-dom-event",
      bruno_action: "refresh"
    }
  }
], wa = new Proxy({}, {
  get(o, e) {
    return globalThis.BrunoIcons?.render(String(e || "circle")) || globalThis.BrunoIcons?.render("circle") || "";
  }
});
class P extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      items: ya,
      ...e || {}
    }, this._render();
  }
  set hass(e) {
    this._hass = e;
  }
  getCardSize() {
    return 1;
  }
  _items() {
    return Array.isArray(this._config?.items) ? this._config.items : ya;
  }
  _groupForItem(e) {
    return e?.group ? e.group : ["movies", "laptop", "sofa", "scene", "scenes"].includes(e?.key) ? "scenes" : "actions";
  }
  _groups() {
    return this._items().reduce((e, t, a) => {
      const i = this._groupForItem(t);
      let r = e[e.length - 1];
      return (!r || r.key !== i) && (r = { key: i, items: [] }, e.push(r)), r.items.push({ item: t, index: a }), e;
    }, []);
  }
  _runAction(e = {}) {
    if (!(!e || e.action === "none")) {
      if (e.action === "call-service") {
        const [t, a] = String(e.service || "").split(".");
        if (!t || !a || !this._hass) return;
        this._hass.callService(t, a, e.data || e.service_data || {}, e.target || {});
        return;
      }
      if (e.action === "fire-dom-event") {
        this.dispatchEvent(new CustomEvent("ll-custom", {
          detail: e,
          bubbles: !0,
          composed: !0
        }));
        return;
      }
      e.action === "navigate" && this.dispatchEvent(new CustomEvent("hass-navigate", {
        detail: { path: e.navigation_path || e.path },
        bubbles: !0,
        composed: !0
      }));
    }
  }
  _wireActions() {
    this.shadowRoot.querySelectorAll("[data-action-index]").forEach((e) => {
      let t = 0;
      const a = () => {
        if (e.getAttribute("aria-disabled") === "true") return;
        const r = this._items()[Number(e.dataset.actionIndex)];
        globalThis.BrunoLiquidGlass?.feedback?.("tap"), this._runAction(r?.tap_action || r?.action);
      }, i = (r) => {
        r.preventDefault(), r.stopPropagation();
      };
      e.addEventListener("pointerdown", (r) => {
        i(r), e.getAttribute("aria-disabled") !== "true" && (e.classList.add("is-pressed"), e.setPointerCapture?.(r.pointerId));
      }), e.addEventListener("pointerup", (r) => {
        i(r), e.getAttribute("aria-disabled") !== "true" && (e.classList.remove("is-pressed"), e.releasePointerCapture?.(r.pointerId), t = Date.now(), a());
      }), e.addEventListener("pointercancel", () => {
        e.classList.remove("is-pressed");
      }), e.addEventListener("pointerleave", () => {
        e.classList.remove("is-pressed");
      }), e.addEventListener("click", (r) => {
        i(r), !(Date.now() - t < 420) && (e.classList.add("is-pressed"), window.setTimeout(() => e.classList.remove("is-pressed"), 180), a());
      }), e.addEventListener("keydown", (r) => {
        r.key !== "Enter" && r.key !== " " || (i(r), e.classList.add("is-pressed"), window.setTimeout(() => e.classList.remove("is-pressed"), 180), a());
      });
    });
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._groups();
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          /* PADRONIZAÇÃO: dock = 54px, igual à linha da faixa inferior da régua da
             shell (topo 48 / base 54) e à faixa inferior das subviews. ANTERIOR:
             56px (estourava 2px a linha de 54px e desalinhava o filete). */
          --rail-size: 54px;
          --button-size: 39px;
          --button-radius: 999px;
          --icon-size: 19px;
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        .quick-card {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 10px;
          overflow-x: auto;
          scrollbar-width: none;
        }

        .quick-card::-webkit-scrollbar { display: none; }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        /* ORIGINAL (rollback — dock em PÍLULA flutuante):
        .quick-dock {
          width: max-content;  border-radius: 999px;
          border: var(--bruno-liquid-rail-border, ...);
          background: var(--bruno-liquid-rail-background, ...glass...);
          box-shadow: var(--bruno-liquid-rail-shadow, ...);
          backdrop-filter: var(--bruno-liquid-rail-filter, ...);
          overflow: hidden;
        }
        (valores completos preservados no histórico git; rollback: restaurar este bloco
         e reverter ::before/::after abaixo) */
        /* NOVO (Caminho 2): dock RENTE — faixa cheia, sem pílula, integrada ao
           painel, com filete superior (mais forte no centro). */
        .quick-dock {
          position: relative;
          isolation: isolate;
          width: 100%;
          max-width: 100%;
          height: var(--rail-size);
          min-height: var(--rail-size);
          display: inline-flex;
          /* NOVO: conteúdo ancorado na BASE (era center) p/ alinhar com o botão
             Power, que fica no fundo do rail. ANTERIOR (rollback): align-items: center; */
          align-items: flex-end;
          justify-content: center;
          gap: 8px;
          padding: 0 8px 3px;
          color: rgba(255,255,255,0.86);
          border: none;
          /* TRANSPARENTE: dock funde com a imagem; legibilidade pela BORDA
             ATMOSFÉRICA escurecida do backdrop (vinheta inferior). */
          border-radius: 0;
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          box-shadow: none;
          overflow: visible;
        }

        .quick-dock::before,
        .quick-dock::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
        }

        /* NOVO (Caminho 2): em vez do sheen da pílula, o ::before vira o filete
           superior do dock (mais forte no centro). ROLLBACK: restaurar o sheen. */
        .quick-dock::before {
          inset: auto;
          left: 0;
          right: 0;
          top: 0;
          height: 1px;
          z-index: 0;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.16) 50%, transparent);
          opacity: 1;
        }

        .quick-dock::after {
          inset: 0;
          padding: 1px;
          z-index: 1;
          background: var(--bruno-liquid-dock-edge-glow,
            linear-gradient(125deg, rgba(255,255,255,0.34), rgba(255,255,255,0.08) 34%, rgba(255,255,255,0.026) 62%, rgba(255,190,120,0.17) 100%)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          /* NOVO (Caminho 2): sem edge-glow de pílula. ROLLBACK: voltar a 0.64. */
          opacity: 0;
        }

        .quick-group {
          position: relative;
          z-index: 2;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          flex: 0 0 auto;
        }

        .quick-section-label {
          position: relative;
          z-index: 2;
          flex: 0 0 auto;
          height: var(--button-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px 0 6px;
          color: rgba(248,251,255,0.56);
          font-size: 10px;
          line-height: 1;
          font-weight: 820;
          text-transform: uppercase;
          white-space: nowrap;
          text-shadow: 0 2px 10px rgba(0,0,0,0.24);
        }

        .quick-separator {
          position: relative;
          z-index: 2;
          width: 1px;
          height: 28px;
          margin: 0 3px;
          flex: 0 0 1px;
          border-radius: 999px;
          background: linear-gradient(180deg, transparent, rgba(255,255,255,0.22), transparent);
          box-shadow: 1px 0 0 rgba(0,0,0,0.18);
          opacity: 0.76;
        }

        .quick-button {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          flex: 0 0 var(--button-size);
          width: var(--button-size);
          height: var(--button-size);
          min-width: var(--button-size);
          min-height: var(--button-size);
          max-width: var(--button-size);
          max-height: var(--button-size);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          color: rgba(255,255,255,0.86);
          border: 1px solid transparent;
          border-radius: var(--button-radius);
          background: transparent;
          box-shadow: none;
          overflow: hidden;
          outline: none;
          transition:
            transform 160ms ease,
            background 160ms ease,
            color 160ms ease,
            border-color 160ms ease,
            box-shadow 160ms ease;
        }

        .quick-button::before,
        .quick-button::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
        }

        .quick-button::before {
          inset: 1px;
          z-index: 0;
          background:
            linear-gradient(180deg, rgba(255,255,255,0.18), rgba(255,255,255,0.00) 58%),
            linear-gradient(135deg, rgba(255,255,255,0.10), rgba(255,255,255,0.00));
          opacity: 0;
          transform: translateY(-3px);
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .quick-button::after {
          left: 50%;
          bottom: 5px;
          width: 11px;
          height: 2px;
          border-radius: 999px;
          background: rgba(var(--accent),0.92);
          box-shadow: 0 0 12px rgba(var(--accent),0.70);
          opacity: 0;
          transform: translateX(-50%) scaleX(0.62);
          transition: opacity 160ms ease, transform 160ms ease;
        }

        .quick-button:hover {
          color: rgba(255,255,255,0.94);
          background:
            linear-gradient(180deg, rgba(255,255,255,0.11), rgba(255,255,255,0.04));
          border-color: rgba(255,255,255,0.13);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.11),
            0 6px 14px rgba(0,0,0,0.16);
        }

        .quick-button:hover::before {
          opacity: 0.72;
          transform: translateY(0);
        }

        .quick-button.is-pressed,
        .quick-button:active {
          transform: scale(0.96);
        }

        .quick-button[aria-disabled="true"] {
          cursor: default;
        }

        .quick-button[aria-disabled="true"]:active {
          transform: none;
        }

        .quick-button[aria-disabled="true"]:hover::after {
          opacity: 0;
        }

        .quick-button svg {
          width: var(--icon-size);
          height: var(--icon-size);
          flex: 0 0 var(--icon-size);
          display: block;
          fill: none;
          stroke: currentColor;
          stroke-width: 1.55;
          stroke-linecap: round;
          stroke-linejoin: round;
          pointer-events: none;
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 2px 5px rgba(0,0,0,0.24));
        }

        .quick-label,
        .quick-kind {
          display: none;
          position: relative;
          z-index: 2;
          min-width: 0;
          text-align: left;
        }

        .quick-label {
          grid-area: label;
          align-self: end;
          font-size: 9.6px;
          line-height: 1.06;
          font-weight: 800;
          color: rgba(255,255,255,0.92);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .quick-kind {
          grid-area: meta;
          align-self: start;
          margin-top: 1px;
          font-size: 8.6px;
          line-height: 1;
          font-weight: 700;
          color: rgba(255,255,255,0.48);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        @media (max-width: 800px) {
          .quick-card {
            justify-content: center;
            padding: 0 8px;
          }

          .quick-dock {
            --rail-size: 50px;
            --button-size: 35px;
            --icon-size: 17px;
            padding: 0 6px;
            gap: 6px;
          }

          .quick-section-label {
            font-size: 9px;
            padding: 0 2px 0 4px;
          }
        }

        /* ============================================================
           NOVO — PADRONIZAÇÃO COM O RAIL (bloco ADITIVO, regra de ouro).
           ROLLBACK: remover este bloco => volta aos botões em pílula.
           - ícones com a MESMA cor/peso/tratamento do rail (sóbrio 0.60, flat);
           - estrutura ÍCONE em cima + RÓTULO curto embaixo (labels já curtos);
           - dock ocupa a faixa INTEIRA e CENTRALIZA o conteúdo no eixo vertical
             (corrige o viés p/ cima: antes o dock de 56px ficava centrado nos
             74px e a divisória no topo dele -> sobrava mais espaço embaixo);
           - títulos de seção pequenos mantidos + separador discreto mantido.
           ============================================================ */
        .quick-dock {
          height: 100%;          /* ocupa os 74px da faixa */
          min-height: 0;
          align-items: center;   /* centraliza o conteúdo verticalmente */
          gap: 14px;             /* respiro entre seções/separador */
        }
        .quick-group { gap: 12px; }   /* respiro lateral entre botões (corrige "Notebook" cortado) */
        .quick-button {
          width: auto;
          min-width: var(--button-size);
          max-width: none;
          height: auto;
          max-height: none;
          flex-direction: column;     /* ícone em cima, rótulo embaixo */
          gap: 4px;
          padding: 7px 10px 6px;
          min-width: 54px;            /* garante espaço p/ o rótulo (ex.: Notebook) */
          border-radius: 13px;        /* = rail (flat, sem pílula) */
          color: rgba(255,255,255,0.60);  /* = --icon-neutral do rail */
          -webkit-tap-highlight-color: transparent;
        }
        .quick-button::before,
        .quick-button::after { display: none; }   /* sem sheen/sublinhado (= rail) */
        .quick-button:hover,
        .quick-button:focus,
        .quick-button:focus-visible {
          background: rgba(255,255,255,0.05);
          border-color: transparent;
          box-shadow: none;
          color: rgba(255,255,255,0.92);
          outline: none;
        }
        .quick-button svg {
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.24));  /* = rail */
        }
        .quick-button .quick-label {
          display: block;
          position: static;
          align-self: center;
          grid-area: auto;
          margin: 0;
          max-width: 88px;
          font-size: 9.5px;
          line-height: 1.05;
          font-weight: 600;
          color: inherit;
          text-align: center;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .quick-button .quick-kind { display: none; }   /* só um rótulo curto */
        /* título de seção pequeno, alinhado ao centro vertical do conteúdo */
        .quick-section-label {
          height: auto;
          align-self: center;
          color: rgba(248,251,255,0.46);
        }
        .quick-separator { align-self: center; }  /* separador discreto mantido */
        /* NOVO (2026-07-24) — feedback Home V2: dock SEM linhas divisórias
           (filete superior + separador vertical entre grupos removidos).
           ROLLBACK: remover estas duas regras. */
        .quick-dock::before { display: none; }
        .quick-separator { display: none; }
      </style>

      <div class="quick-card">
        <div class="quick-dock" aria-label="Acoes rapidas">
          ${e.map((t, a) => `
            ${a > 0 ? '<span class="quick-separator" aria-hidden="true"></span>' : ""}
            <span class="quick-section-label">${P._escape(this._groupTitle(t.key))}</span>
            <span class="quick-group group-${P._escapeAttr(t.key)}">
              ${t.items.map(({ item: i, index: r }) => this._button(i, r)).join("")}
            </span>
          `).join("")}
        </div>
      </div>
    `, this._wireActions();
  }
  _button(e, t) {
    const a = !e?.tap_action || e.tap_action.action === "none";
    return `
      <button
        class="quick-button"
        type="button"
        title="${P._escapeAttr(e?.label || e?.key || "Acao")}"
        aria-label="${P._escapeAttr(e?.label || e?.key || "Acao")}"
        ${a ? 'aria-disabled="true"' : ""}
        data-action-index="${t}"
      >
        ${P._icon(e)}
        <span class="quick-label">${P._escape(e?.label || e?.key || "Acao")}</span>
        <span class="quick-kind">${P._escape(this._kindLabel(e))}</span>
      </button>
    `;
  }
  _kindLabel(e) {
    return e?.kind_label ? e.kind_label : e?.group === "scenes" ? "Cena" : "Ação";
  }
  _groupTitle(e) {
    return e === "scenes" ? "Cenas" : e === "sala" ? "Sala" : "Ações rápidas";
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return P._escape(e).replace(/'/g, "&#39;");
  }
  static _icon(e) {
    const t = e?.icon_key || e?.key || String(e?.icon || "").replace(/^mdi:/, "");
    return wa[t] || wa.circle;
  }
}
customElements.get(wt) || customElements.define(wt, P);
window.customCards = window.customCards || [];
window.customCards.push({
  type: wt,
  name: "Bruno Quick Actions Card",
  preview: !1,
  description: "Isolated Bento quick actions card with preserved service and Wi-Fi popup behavior."
});
const kt = "bruno-media-card", ka = "bruno-ui:media-history:v3", Te = {
  focus_sensor: "sensor.media_focus_visuals",
  focus_select: "input_select.media_focus_player",
  spotify_entity: "media_player.spotifyplus_bruno_helasio",
  spotify_device_name: "Echo Show",
  slots: [
    "input_select.media_slot_1",
    "input_select.media_slot_2",
    "input_select.media_slot_3",
    "input_select.media_slot_4"
  ],
  scripts: {
    play_pause: "script.media_focus_play_pause",
    volume_down: "script.media_focus_volume_down",
    volume_up: "script.media_focus_volume_up",
    previous: "script.media_focus_previous_track",
    next: "script.media_focus_next_track",
    mute: "script.media_focus_volume_mute"
  },
  players: [
    { entity: "media_player.android_tv_192_168_3_17", name: "TV", icon: "mdi:television-classic", section: "sala", path: "subview-sala" },
    { entity: "media_player.echo_show", name: "Echo Show", icon: "mdi:speaker-wireless", section: "sala", path: "subview-sala" },
    { entity: "media_player.spotifyplus_bruno_helasio", name: "Spotify", icon: "mdi:spotify", section: "sala", path: "subview-sala" },
    { entity: "media_player.echo_pop_office", name: "Office", icon: "mdi:speaker", section: "office", path: "subview-office" }
  ]
}, xo = ["playing", "paused"], U = "media_player.android_tv_192_168_3_17", yo = "media_player.smart_tv_pro_2", wo = /* @__PURE__ */ new Set(["on", "playing", "paused", "idle", "buffering"]);
class k extends HTMLElement {
  static getStubConfig() {
    return {};
  }
  setConfig(e) {
    this._config = {
      ...Te,
      ...e || {},
      scripts: {
        ...Te.scripts,
        ...e?.scripts || {}
      },
      slots: Array.isArray(e?.slots) ? e.slots : Te.slots,
      players: Array.isArray(e?.players) ? e.players : Te.players
    }, this._slideIndex = this._slideIndex || 0, this._mediaMenuOpen = this._mediaMenuOpen || !1, this._mediaHistory === void 0 && (this._mediaHistory = this._readMediaHistory()), this._lastArtworkByPlayer = this._lastArtworkByPlayer || {};
    const t = this._mediaHistory?.[U];
    !this._lastArtworkByPlayer[U] && t?.image && (this._lastArtworkByPlayer[U] = t.image), this._lastValidMedia = this._latestMediaSnapshot(), this._safeRender();
  }
  set hass(e) {
    this._hass = e;
    const t = this._state(this._config?.focus_select)?.state;
    this._localFocusEntity && t === this._localFocusEntity && (this._localFocusEntity = "", this._localFocusAt = 0), this._capturePlayerHistory(), this._safeRender();
  }
  getCardSize() {
    return 4;
  }
  _state(e) {
    return e ? this._hass?.states?.[e] : void 0;
  }
  _safeRender() {
    try {
      this._render();
    } catch (e) {
      this._renderError(e);
    }
  }
  _renderError(e) {
    this.shadowRoot || this.attachShadow({ mode: "open" }), console.error("[bruno-media-card]", e), this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .error-card {
          width: 100%;
          height: 100%;
          min-height: 160px;
          display: grid;
          place-items: center;
          padding: 18px;
          border-radius: var(--bruno-liquid-card-radius, 22px);
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.18));
          color: rgba(255,255,255,0.78);
          background: var(--bruno-liquid-surface-off-background, rgba(12,16,26,0.72));
          box-shadow: var(--bruno-liquid-surface-off-shadow, 0 18px 46px rgba(0,0,0,0.31));
          box-sizing: border-box;
          text-align: center;
        }

        .title {
          display: block;
          color: rgba(255,255,255,0.92);
          font-size: 13px;
          font-weight: 780;
          text-transform: uppercase;
        }

        .message {
          display: block;
          margin-top: 6px;
          font-size: 11px;
          font-weight: 620;
          color: rgba(255,255,255,0.54);
        }
      </style>
      <div class="error-card">
        <span>
          <span class="title">Media</span>
          <span class="message">Aguardando dados dos players</span>
        </span>
      </div>
    `;
  }
  _tvPowered() {
    const e = String(this._state(yo)?.state || "").toLowerCase();
    return wo.has(e);
  }
  _isActive(e) {
    const t = String(this._state(e)?.state || "").toLowerCase();
    return e === U ? this._tvPowered() : xo.includes(t);
  }
  _isStandbyImage(e) {
    return String(e || "").includes("standby_art");
  }
  _readMediaHistory() {
    try {
      const e = globalThis.localStorage?.getItem(ka), t = e ? JSON.parse(e) : null;
      return t && typeof t == "object" ? t : {};
    } catch {
      return {};
    }
  }
  _storeLastValidMedia(e) {
    if (!e?.entity || !e.image && !e.title) return;
    this._mediaHistory = this._mediaHistory || {};
    const t = this._mediaHistory[e.entity], a = (i) => JSON.stringify({
      ...i || {},
      savedAt: 0
    });
    if (a(t) !== a(e)) {
      this._mediaHistory[e.entity] = e, this._lastValidMedia = this._latestMediaSnapshot();
      try {
        globalThis.localStorage?.setItem(ka, JSON.stringify(this._mediaHistory));
      } catch {
      }
    }
  }
  _latestMediaSnapshot() {
    return Object.values(this._mediaHistory || {}).filter((e) => e?.entity && (e.image || e.title)).sort((e, t) => Number(t.savedAt || 0) - Number(e.savedAt || 0))[0] || null;
  }
  _capturePlayerHistory() {
    !this._config || !this._hass || this._allPlayerIds().forEach((e) => {
      const t = this._state(e), a = t?.attributes || {}, i = String(t?.state || "").toLowerCase(), r = this._playerConfig(e), n = this._cleanText(a.media_title), s = a.media_image_url || a.entity_picture || "", l = this._isStandbyImage(s) ? "" : s, c = this._cleanText(a.app_name), p = this._cleanText(a.source), d = String(a.media_content_type || c || "").toLowerCase(), h = this._mediaHistory?.[e];
      if (h && l && l !== h.image && !["unknown", "unavailable"].includes(i) && this._storeLastValidMedia({ ...h, image: l, savedAt: h.savedAt || Date.now() }), !this._hasPlayback(i, n, l, c, p, e, r, d, a)) return;
      const b = this._mediaServiceName(e, r, d, c, p), u = b === "Spotify" ? this._spotifyRoomTarget(a) : null, g = u ? { ...r, ...u } : r, f = this._mediaRoomName(g), m = this._cleanText(a.media_artist), x = this._cleanText(a.media_album_name), S = this._cleanText(a.media_series_title), $ = this._cleanText(a.media_channel), z = this._fallbackMediaTitle(b, f, e), M = this._firstText([n, z, this._playerName(e)]), H = this._firstText([m, x, S, $], [M]);
      this._storeLastValidMedia({
        entity: e,
        image: l,
        title: M,
        artist: m && m !== "Pronto para tocar" ? m : "",
        secondary: H,
        context: [b, f].filter(Boolean).join(" "),
        serviceName: b,
        serviceIcon: r.icon || this._playerIcon(e),
        path: g.path || g.navigation_path || "",
        section: g.section || "",
        savedAt: Date.now()
      });
    });
  }
  _visualBelongsToFocus(e, t) {
    const a = e?.attributes || {}, i = [
      a.entity_id,
      a.entity,
      a.player,
      a.media_player,
      a.source_entity
    ].filter(Boolean);
    return i.length ? i.includes(t) : !1;
  }
  _playerConfig(e) {
    return this._config.players.find((t) => t.entity === e) || {};
  }
  _focusEntityId() {
    if (this._localFocusEntity && this._state(this._localFocusEntity)) {
      if (Date.now() - (this._localFocusAt || 0) < 5e3) return this._localFocusEntity;
      this._localFocusEntity = "", this._localFocusAt = 0;
    }
    const e = this._allPlayerIds().map((a) => ({
      entity: a,
      score: this._playbackPriority(a),
      updatedAt: Date.parse(this._state(a)?.last_updated || "") || 0
    })).filter((a) => a.score > 0).sort((a, i) => i.score - a.score || i.updatedAt - a.updatedAt)[0];
    if (e?.entity) return e.entity;
    const t = this._state(this._config.focus_select)?.state;
    return t && this._state(t) ? t : this._config.players[0]?.entity;
  }
  _playbackPriority(e) {
    const t = this._state(e), a = String(t?.state || "").toLowerCase(), i = this._playerConfig(e), r = t?.attributes || {}, n = String(r.media_content_type || r.app_name || "").toLowerCase(), s = r.media_image_url || r.entity_picture || "", l = this._isStandbyImage(s) ? "" : s;
    return e === U ? this._tvPowered() ? a === "playing" ? 4 : a === "buffering" ? 3 : a === "paused" ? 2 : this._hasPlayback(a, this._cleanText(r.media_title), l, r.app_name, r.source, e, i, n, r) ? 3 : 1 : 0 : a === "playing" ? 4 : a === "paused" ? 2 : this._hasPlayback(a, this._cleanText(r.media_title), l, r.app_name, r.source, e, i, n, r) ? 3 : 0;
  }
  _focusModel() {
    const e = this._focusEntityId(), t = this._state(e), a = this._state(this._config.focus_sensor), i = this._visualBelongsToFocus(a, e), r = this._playerConfig(e), n = (i ? a?.state : "") || t?.state || "off", s = (i ? a?.attributes?.media_image_url || a?.attributes?.entity_picture : "") || t?.attributes?.media_image_url || t?.attributes?.entity_picture || "";
    this._lastArtworkByPlayer = this._lastArtworkByPlayer || {}, s && !this._isStandbyImage(s) && (this._lastArtworkByPlayer[e] = s);
    const l = (["paused", "idle"].includes(n) || e === U && this._tvPowered()) && this._lastArtworkByPlayer[e];
    let c = s;
    l && (!s || this._isStandbyImage(s)) ? c = this._lastArtworkByPlayer[e] : this._isStandbyImage(s) && (c = "");
    const p = this._cleanText((i ? a?.attributes?.media_title : "") || t?.attributes?.media_title), d = this._cleanText((i ? a?.attributes?.media_artist : "") || t?.attributes?.media_artist), h = this._cleanText((i ? a?.attributes?.media_album_name : "") || t?.attributes?.media_album_name), b = this._cleanText((i ? a?.attributes?.app_name : "") || t?.attributes?.app_name), u = this._cleanText((i ? a?.attributes?.source : "") || t?.attributes?.source), g = this._cleanText((i ? a?.attributes?.media_series_title : "") || t?.attributes?.media_series_title), f = this._cleanText((i ? a?.attributes?.media_channel : "") || t?.attributes?.media_channel), m = Number((i ? a?.attributes?.media_duration : void 0) ?? t?.attributes?.media_duration ?? 0);
    let x = Number((i ? a?.attributes?.media_position : void 0) ?? t?.attributes?.media_position ?? 0);
    const S = Number(t?.attributes?.volume_level ?? (i ? a?.attributes?.volume_level : void 0) ?? 0), $ = String(
      (i ? a?.attributes?.media_content_type : "") || t?.attributes?.media_content_type || t?.attributes?.app_name || ""
    ).toLowerCase(), z = ["video", "movie", "tvshow", "episode", "channel"].some((Si) => $.includes(Si)), M = Date.parse((i ? a?.attributes?.media_position_updated_at : "") || t?.attributes?.media_position_updated_at || "");
    n === "playing" && Number.isFinite(M) && Number.isFinite(x) && (x += Math.max(0, (Date.now() - M) / 1e3)), Number.isFinite(m) && m > 0 && (x = Math.min(x, m));
    const H = this._mediaServiceName(e, r, $, b, u), we = {
      ...t?.attributes || {},
      ...i ? a?.attributes || {} : {}
    }, ke = H === "Spotify" ? this._spotifyRoomTarget(we) : null, qe = ke ? { ...r, ...ke } : r, Ht = this._mediaRoomName(qe), A = this._hasPlayback(n, p, s, b, u, e, r, $, we), yi = this._fallbackMediaTitle(H, Ht, e), Fe = A ? this._firstText([p, b, u, yi, this._playerName(e)]) : "", Dt = A ? this._firstText([d, h, g, f, b, u, this._stateLabel(n)], [Fe]) : "", Pt = A ? [H, Ht].filter(Boolean).join(" ") : "", Ge = r.icon || this._playerIcon(e), We = qe.path || qe.navigation_path || "", Ze = qe.section || "";
    A && ["playing", "paused"].includes(String(n).toLowerCase()) && this._storeLastValidMedia({
      entity: e,
      image: c,
      title: Fe,
      artist: d && d !== "Pronto para tocar" ? d : "",
      secondary: Dt,
      context: Pt,
      serviceName: H,
      serviceIcon: Ge,
      path: We,
      section: Ze,
      savedAt: Date.now()
    });
    const Se = e === U && this._isActive(e), I = A ? null : Se ? this._mediaHistory?.[e] || null : this._mediaHistory?.[e] || this._latestMediaSnapshot(), jt = A ? c : c || I?.image || this._lastArtworkByPlayer?.[e] || "", wi = A ? Fe : I?.title || (Se ? "TV ligada" : ""), ki = A ? Dt : I?.secondary || I?.artist || (Se ? this._firstText([b, u, "Sala"]) : ""), qi = A ? Pt : I?.context || (Se ? "TV Sala" : "");
    return {
      entity: A ? e : I?.entity || e,
      image: jt,
      title: wi,
      artist: A ? d && d !== "Pronto para tocar" ? d : "" : I?.artist || "",
      secondary: ki,
      context: qi,
      statusLabel: A ? n === "paused" ? "Pausado" : n === "on" ? this._stateLabel(n) : "Reproduzindo agora" : "Nenhuma mídia ativa",
      state: n,
      serviceName: A ? H : I?.serviceName || H,
      serviceIcon: A ? Ge : I?.serviceIcon || Ge,
      path: A ? We : I?.path || We,
      section: A ? Ze : I?.section || Ze,
      duration: Number.isFinite(m) ? m : 0,
      position: Number.isFinite(x) ? Math.max(0, x) : 0,
      volumePercent: Number.isFinite(S) ? Math.max(0, Math.min(100, Math.round(S * 100))) : 0,
      isVideo: z,
      isPlaying: n === "playing",
      isActive: A,
      hasPlayback: A,
      hasLastMedia: !!(I && (I.image || I.title)),
      isSoftArtwork: (n === "paused" || !A) && !!jt
    };
  }
  _slotPlayerIds(e = "", t = 4) {
    const a = [], i = (n) => {
      !n || n === e || a.includes(n) || !this._state(n) || a.push(n);
    };
    return Object.values(this._mediaHistory || {}).sort((n, s) => Number(s.savedAt || 0) - Number(n.savedAt || 0)).forEach((n) => i(n?.entity)), this._allPlayerIds().filter((n) => this._playbackPriority(n) > 0).forEach(i), a.length || (this._config.slots || []).forEach((n) => {
      const s = this._state(n)?.state;
      (this._mediaHistory?.[s] || this._playbackPriority(s) > 0) && i(s);
    }), a.slice(0, t);
  }
  _allPlayerIds() {
    const e = [], t = (i) => {
      !i || e.includes(i) || e.push(i);
    }, a = this._state(this._config.focus_select)?.attributes?.options;
    return Array.isArray(a) && a.forEach(t), (this._config.players || []).forEach((i) => t(i.entity)), (this._config.slots || []).forEach((i) => t(this._state(i)?.state)), e;
  }
  _callService(e, t = {}, a = {}) {
    if (!this._hass || !e) return;
    const [i, r] = e.split(".");
    !i || !r || this._hass.callService(i, r, t, a);
  }
  _runScript(e) {
    const t = this._config.scripts?.[e];
    this._callService(t);
  }
  _selectPlayer(e) {
    e && (this._localFocusEntity = e, this._localFocusAt = Date.now(), this._callService("input_select.select_option", {
      entity_id: this._config.focus_select,
      option: e
    }), this._setSlide(0));
  }
  _setSlide(e) {
    const t = Math.max(0, Math.min(1, Number(e) || 0));
    this._slideIndex !== t && (this._slideIndex = t, this._render());
  }
  _moreInfo(e) {
    e && this.dispatchEvent(new CustomEvent("hass-more-info", {
      detail: { entityId: e },
      bubbles: !0,
      composed: !0
    }));
  }
  _navigate(e) {
    if (!e) {
      this._moreInfo(this._config.focus_sensor);
      return;
    }
    const t = this._resolveNavigationPath(e), a = e.startsWith("/") ? t : e;
    globalThis.BrunoLiquidGlass?.routeTransition?.(), this.dispatchEvent(new CustomEvent("hass-navigate", {
      detail: { path: a },
      bubbles: !0,
      composed: !0
    })), globalThis.setTimeout(() => {
      !t || globalThis.location?.pathname === t || (globalThis.history?.pushState?.(null, "", t), globalThis.dispatchEvent?.(new CustomEvent("location-changed", { detail: { replace: !1 } })));
    }, 80);
  }
  _resolveNavigationPath(e) {
    return e ? e.startsWith("/") ? e : `/${(globalThis.location?.pathname || "").split("/").filter(Boolean)[0] || "ngocjohn-main"}/${e}` : "";
  }
  _openShellSection(e) {
    return e ? (globalThis.BrunoLiquidGlass?.routeTransition?.(), this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: { action: "fire-dom-event", bruno_section: e },
      bubbles: !0,
      composed: !0
    })), !0) : !1;
  }
  _openMediaTarget(e, t) {
    t && this._openShellSection(t) || e && this._navigate(e);
  }
  _openPlayersPopup() {
    const e = this._allPlayerIds().map((t) => ({
      entity: t,
      name: this._playerName(t)
    }));
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: {
        action: "fire-dom-event",
        browser_mod: {
          service: "browser_mod.popup",
          data: {
            title: "Media",
            size: "wide",
            content: {
              type: "entities",
              entities: e
            }
          }
        }
      },
      bubbles: !0,
      composed: !0
    }));
  }
  _openSpotifyPlusPopup() {
    this.dispatchEvent(new CustomEvent("ll-custom", {
      detail: {
        action: "fire-dom-event",
        bruno_action: "spotify",
        bruno_spotify_config: {
          entity: this._config.spotify_entity,
          deviceDefaultId: this._config.spotify_device_name
        }
      },
      bubbles: !0,
      composed: !0
    }));
  }
  _playerName(e) {
    const t = this._state(e);
    return this._playerConfig(e).name || t?.attributes?.friendly_name || e;
  }
  _playerIcon(e) {
    return this._playerConfig(e).icon || "mdi:speaker-wireless";
  }
  _cleanText(e) {
    const t = String(e ?? "").trim();
    if (!t) return "";
    const a = t.toLowerCase();
    return ["unknown", "unavailable", "none", "null", "undefined"].includes(a) || ["sistema de áudio", "sistema de audio", "pronto para tocar"].includes(a) ? "" : t;
  }
  _normalizeMediaDevice(e) {
    return String(e || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  }
  _spotifyRoomTarget(e = {}) {
    const t = [
      e.source,
      e.source_name,
      e.device_name,
      e.active_device_name,
      e.spotify_device_name,
      e.media_player,
      e.media_player_name
    ].map((i) => this._normalizeMediaDevice(i)).filter(Boolean);
    return t.length && [
      { section: "office", path: "subview-office", room: "office", aliases: ["echo pop office", "office"] },
      { section: "casal", path: "subview-quarto-casal", room: "q. casal", aliases: ["echo pop quarto casal", "quarto casal"] },
      { section: "marina", path: "subview-quarto-marina", room: "q. marina", aliases: ["echo pop marina", "quarto marina"] },
      { section: "sala", path: "subview-sala", room: "sala", aliases: ["echo show", "sala"] }
    ].find((i) => t.some((r) => i.aliases.some((n) => r === n || r.includes(n) || r.length >= 8 && n.includes(r)))) || null;
  }
  _firstText(e, t = []) {
    const a = t.map((i) => this._cleanText(i).toLowerCase()).filter(Boolean);
    for (const i of e) {
      const r = this._cleanText(i);
      if (r && !a.includes(r.toLowerCase()))
        return r;
    }
    return "";
  }
  _hasPlayback(e, t, a, i, r, n = "", s = {}, l = "", c = {}) {
    const p = String(e || "").toLowerCase(), d = `${t || ""} ${i || ""} ${r || ""}`.toLowerCase();
    if (["google tv launcher", "android tv launcher", "launcher", "ambient mode", "backdrop", "home screen", "android settings"].some((f) => d.includes(f))) return !1;
    if (n === U) {
      if (!this._tvPowered()) return !1;
      const f = !!(a && !this._isStandbyImage(a)), m = Number(c?.media_duration) > 0 || Number(c?.media_position) > 0, x = [t, i, r].map((S) => this._cleanText(S)).filter(Boolean).some((S) => !/^(?:tv|android tv|smart tv pro|hdmi\s*\d+)$/i.test(S));
      return f || m || x ? ["playing", "paused", "buffering"].includes(p) ? !0 : this._isVideoPlayer(n, s, l, i, r) : !1;
    }
    if (["playing", "paused"].includes(p)) return !!(this._cleanText(t) || a || this._cleanText(i));
    if (p !== "on") return !1;
    const b = !!this._cleanText(t), u = Number(c?.media_duration) > 0 || Number(c?.media_position) > 0, g = !!(a && !this._isStandbyImage(a));
    return b && (g || u || ["video", "movie", "episode", "tvshow"].some((f) => String(l).includes(f))) && this._isVideoPlayer(n, s, l, i, r);
  }
  _isVideoPlayer(e = "", t = {}, a = "", i = "", r = "") {
    const n = `${e || ""} ${t.name || ""} ${t.icon || ""} ${a || ""} ${i || ""} ${r || ""}`.toLowerCase();
    return ["tv", "television", "android_tv", "video", "movie", "episode", "netflix", "youtube", "prime"].some((s) => n.includes(s));
  }
  _fallbackMediaTitle(e = "", t = "", a = "") {
    const i = this._cleanText(e), r = this._cleanText(t);
    return i.toLowerCase() === "tv" && r.toLowerCase() === "sala" ? "TV da sala" : i.toLowerCase() === "tv" && r ? `TV ${r}` : i && r ? `${i} ${r}` : this._playerName(a);
  }
  _mediaRoomName(e = {}) {
    const a = this._cleanText(e.room || e.area || e.path || e.navigation_path).toLowerCase();
    return a.includes("sala") ? "sala" : a.includes("office") ? "office" : a.includes("cozinha") ? "cozinha" : a.includes("casal") ? "q. casal" : a.includes("marina") ? "q. marina" : a.includes("miguel") ? "q. miguel" : "";
  }
  _mediaServiceName(e, t = {}, a = "", i = "", r = "") {
    const n = `${e || ""} ${t.name || ""} ${t.icon || ""} ${a || ""} ${i || ""} ${r || ""}`.toLowerCase();
    return n.includes("spotify") || n.includes("music") ? "Spotify" : n.includes("ps5") || n.includes("playstation") ? "PS5" : n.includes("tv") || n.includes("television") || n.includes("video") || n.includes("movie") || n.includes("episode") || n.includes("netflix") || n.includes("youtube") || n.includes("prime") ? "TV" : this._cleanText(t.name) || "Mídia";
  }
  _stateLabel(e) {
    const t = String(e || "").toLowerCase();
    return t === "playing" ? "Reproduzindo" : t === "paused" ? "Pausado" : t === "on" ? "Ligada" : t === "idle" ? "Ociosa" : t === "off" ? "Desligada" : e ? e.replace("_", " ") : "";
  }
  _playerModel(e, t) {
    const a = this._state(e), i = String(a?.state || "off").toLowerCase(), r = a?.attributes || {}, n = this._playerConfig(e), s = r.media_image_url || r.entity_picture || "", l = this._isStandbyImage(s) ? "" : s, c = String(r.media_content_type || r.app_name || "").toLowerCase(), p = this._hasPlayback(i, r.media_title, l, r.app_name, r.source, e, n, c, r), d = this._mediaHistory?.[e], h = p ? this._cleanText(r.media_title) || this._playerName(e) : d?.title || this._playerName(e), b = p ? this._cleanText(r.media_artist) || this._stateLabel(i) : d?.secondary || d?.context || "Ultima reproducao";
    return {
      entity: e,
      image: p ? l : d?.image || "",
      name: this._playerName(e),
      title: h,
      subtitle: b,
      state: i,
      icon: this._playerIcon(e),
      active: p,
      selected: e === t
    };
  }
  _wireActions() {
    this.shadowRoot.querySelectorAll("[data-script-key]").forEach((u) => {
      u.addEventListener("click", (g) => {
        g.preventDefault(), g.stopPropagation(), this._runScript(u.dataset.scriptKey);
      });
    }), this.shadowRoot.querySelectorAll("[data-slide-index]").forEach((u) => {
      u.addEventListener("click", (g) => {
        g.preventDefault(), g.stopPropagation(), this._setSlide(u.dataset.slideIndex);
      });
    }), this.shadowRoot.querySelectorAll("[data-player-id]").forEach((u) => {
      let g = null, f = !1;
      const m = () => {
        g && window.clearTimeout(g), g = null;
      };
      u.addEventListener("pointerdown", (x) => {
        x.button != null && x.button !== 0 || (x.preventDefault(), x.stopPropagation(), f = !1, u.classList.add("is-pressed"), u.setPointerCapture?.(x.pointerId), g = window.setTimeout(() => {
          f = !0, u.classList.remove("is-pressed"), this._openPlayersPopup();
        }, 560));
      }), u.addEventListener("pointerup", (x) => {
        x.preventDefault(), x.stopPropagation(), u.releasePointerCapture?.(x.pointerId), m(), u.classList.remove("is-pressed"), !f && this._selectPlayer(u.dataset.playerId);
      }), u.addEventListener("pointerleave", () => {
        m(), u.classList.remove("is-pressed");
      }), u.addEventListener("pointercancel", () => {
        m(), u.classList.remove("is-pressed");
      }), u.addEventListener("contextmenu", (x) => {
        x.preventDefault(), this._openPlayersPopup();
      });
    }), this.shadowRoot.querySelectorAll("[data-navigate-path]").forEach((u) => {
      u.addEventListener("click", (g) => {
        g.preventDefault(), g.stopPropagation(), this._navigate(u.dataset.navigatePath);
      });
    }), this.shadowRoot.querySelector('[data-action="media-route-menu"]')?.addEventListener("click", (u) => {
      u.preventDefault(), u.stopPropagation(), this._mediaMenuOpen = !this._mediaMenuOpen, this._render();
    }), this.shadowRoot.querySelector('[data-action="open-media-subview"]')?.addEventListener("click", (u) => {
      u.preventDefault(), u.stopPropagation(), this._mediaMenuOpen = !1, this._openMediaTarget(
        u.currentTarget.dataset.mediaPath || u.currentTarget.dataset.navigatePath || "",
        u.currentTarget.dataset.mediaSection || ""
      );
    }), this.shadowRoot.querySelector('[data-action="choose-media"]')?.addEventListener("click", (u) => {
      u.preventDefault(), u.stopPropagation(), this._openSpotifyPlusPopup();
    }), this.shadowRoot.querySelector(".wide-art img")?.addEventListener("error", (u) => {
      u.currentTarget.remove(), this.shadowRoot.querySelector(".wide-art")?.classList.remove("has-art");
    }, { once: !0 });
    const e = this.shadowRoot.querySelector(".media-shell"), t = this.shadowRoot.querySelector(".focus-surface");
    if (!e) return;
    const a = (u) => !!u?.closest?.("button");
    let i = 0, r = 0, n = null, s = !1, l = !1;
    const c = () => {
      n && window.clearTimeout(n), n = null;
    }, p = () => {
      l = !1, c(), e.classList.remove("is-pressed");
    };
    e.addEventListener("pointerdown", (u) => {
      u.button != null && u.button !== 0 || a(u.target) || (l = !0, s = !1, i = u.clientX, r = u.clientY, e.classList.add("is-pressed"), e.setPointerCapture?.(u.pointerId), this._config.variant !== "wide" && this._slideIndex === 0 && (n = window.setTimeout(() => {
        s = !0, this._moreInfo(this._config.focus_sensor);
      }, 620)));
    }), e.addEventListener("pointermove", (u) => {
      if (!l) return;
      const g = u.clientX - i, f = u.clientY - r;
      (Math.abs(g) > 12 || Math.abs(f) > 12) && c();
    }), e.addEventListener("pointerup", (u) => {
      if (!l) return;
      u.preventDefault(), e.releasePointerCapture?.(u.pointerId);
      const g = u.clientX - i, f = u.clientY - r;
      if (p(), !s) {
        if (Math.abs(g) > 42 && Math.abs(g) > Math.abs(f)) {
          this._setSlide(this._slideIndex + (g < 0 ? 1 : -1));
          return;
        }
        this._config.variant !== "wide" && this._slideIndex === 0 && this._runScript("play_pause");
      }
    }), e.addEventListener("pointercancel", p), e.addEventListener("pointerleave", () => {
      l && c(), e.classList.remove("is-pressed");
    });
    let d = 0, h = 0, b = !1;
    e.addEventListener("touchstart", (u) => {
      if (a(u.target)) return;
      const g = u.touches?.[0];
      g && (d = g.clientX, h = g.clientY, b = !1);
    }, { passive: !0 }), e.addEventListener("touchmove", (u) => {
      if (a(u.target)) return;
      const g = u.touches?.[0];
      if (!g) return;
      const f = g.clientX - d, m = g.clientY - h;
      Math.abs(f) > 10 && Math.abs(f) > Math.abs(m) && (b = !0, u.preventDefault());
    }, { passive: !1 }), e.addEventListener("touchend", (u) => {
      if (a(u.target)) return;
      const g = u.changedTouches?.[0];
      if (!g) return;
      const f = g.clientX - d, m = g.clientY - h;
      !b && (Math.abs(f) <= 34 || Math.abs(f) <= Math.abs(m)) || (u.preventDefault(), this._setSlide(this._slideIndex + (f < 0 ? 1 : -1)));
    }, { passive: !1 }), t?.addEventListener("keydown", (u) => {
      u.key !== "Enter" && u.key !== " " || (u.preventDefault(), this._config.variant !== "wide" && this._runScript("play_pause"));
    }), t?.addEventListener("contextmenu", (u) => {
      u.preventDefault(), this._config.variant !== "wide" && this._moreInfo(this._config.focus_sensor);
    });
  }
  _render() {
    if (!this._config) return;
    this.shadowRoot || this.attachShadow({ mode: "open" });
    const e = this._focusModel(), t = e.image ? `--focus-art: url('${k._escapeAttr(k._cssUrl(e.image))}');` : "", a = e.isSoftArtwork ? " is-soft-artwork" : "", i = e.image ? "" : " is-empty-artwork", r = e.state === "paused" ? " is-paused-media" : "", n = e.hasPlayback ? "" : " is-inactive-media", s = this._config.variant === "wide", l = this._slotPlayerIds(e.entity, s ? 2 : 4).map((m) => this._playerModel(m, e.entity)), c = l.length && this._slideIndex || 0;
    !l.length && this._slideIndex && (this._slideIndex = 0);
    const p = s ? " is-wide" : "", d = s ? 'aria-label="Resumo de mídia"' : 'role="button" tabindex="0" aria-label="Reproduzir ou pausar midia"', h = e.hasPlayback && e.duration > 0 ? Math.max(0, Math.min(100, e.position / e.duration * 100)) : 0, b = e.image ? k._escapeAttr(e.image) : "", u = e.hasPlayback && !!(e.section || e.path), g = s && this._mediaMenuOpen ? `
      <div class="mh-overflow-panel media-action-panel" role="menu" aria-label="Opções de mídia">
        <button
          class="media-action-option${u ? "" : " is-disabled"}"
          type="button"
          role="menuitem"
          ${u ? 'data-action="open-media-subview"' : ""}
          data-media-path="${k._escapeAttr(e.path || "")}"
          data-media-section="${k._escapeAttr(e.section || "")}"
          ${u ? "" : "disabled"}
        >
          ${u ? "Abrir" : "Offline"}
        </button>
      </div>
    ` : "", f = s ? `
        <div class="wide-focus">
          <div class="media-headline">
            <span class="headline-left">
              <span class="header-icon" aria-hidden="true"><bruno-icon icon="mdi:music-note"></bruno-icon></span>
              <span class="title">
                <span class="title-main">Mídia</span>
              </span>
            </span>
            <button
              class="mh-menu${this._mediaMenuOpen ? " is-active" : ""}"
              type="button"
              data-action="media-route-menu"
              aria-label="Abrir mídia"
              aria-expanded="${this._mediaMenuOpen ? "true" : "false"}"
            >
              <bruno-icon icon="mdi:dots-vertical"></bruno-icon>
            </button>
          </div>
          <div class="wide-copy">
            ${e.hasPlayback || e.hasLastMedia ? `
              <strong class="wide-primary">${k._escape(e.title)}</strong>
              <span class="wide-secondary">${k._escape(e.secondary)}</span>
              <span class="wide-context">${k._escape(e.context)}</span>
            ` : ""}
          </div>
          <div
            class="wide-art${b ? " has-art" : ""}"
            aria-hidden="true"
          >
            ${b ? `<img src="${b}" alt="">` : `<bruno-icon icon="${k._escapeAttr(e.serviceIcon || "mdi:music-note")}"></bruno-icon>`}
          </div>
          ${e.hasPlayback ? `
            <div class="wide-progress" style="--media-progress:${h.toFixed(2)}%;">
              <span class="status-label"><i aria-hidden="true"></i>${k._escape(e.statusLabel)}</span>
              <span class="progress-track"><span></span></span>
            </div>
          ` : `
            <div class="wide-progress is-inactive">
              <span class="status-label is-muted"><i aria-hidden="true"></i>${k._escape(e.statusLabel)}</span>
              <button class="choose-media" type="button" data-action="choose-media">Escolher mídia</button>
            </div>
          `}
          ${g}
        </div>
      ` : `
        <span class="play-glyph" aria-hidden="true"><bruno-icon icon="${e.isPlaying ? "mdi:pause" : "mdi:play"}"></bruno-icon></span>
        <div class="focus-bottom">
          <div class="focus-title">
            <span class="media-copy">
              <span class="media-title">${k._escape(e.title)}</span>
              <span class="media-sub">${k._escape(e.artist || this._playerName(e.entity) || e.state)}</span>
            </span>
            <span class="focus-state">${k._escape(e.state.replace("_", " "))}</span>
          </div>
          <div class="controls" aria-label="Controles de midia">
            ${this._control("volume_down", "mdi:volume-minus", "Diminuir volume")}
            ${this._control("previous", "mdi:skip-previous", "Anterior")}
            ${this._control("play_pause", e.isPlaying ? "mdi:pause" : "mdi:play", "Play/Pause", "play")}
            ${this._control("next", "mdi:skip-next", "Proxima")}
            ${this._control("volume_up", "mdi:volume-plus", "Aumentar volume")}
            ${this._control("mute", "mdi:volume-mute", "Mudo")}
          </div>
        </div>
      `;
    this.shadowRoot.innerHTML = `
      <style>
        :host {
          --card-radius: var(--bruno-liquid-card-radius, 22px);
          --accent: 150, 190, 255;
          display: block;
          width: 100%;
          height: 100%;
          min-height: 0;
          contain: layout style;
        }

        * { box-sizing: border-box; letter-spacing: 0; }

        button {
          font: inherit;
          color: inherit;
          cursor: pointer;
          user-select: none;
          -webkit-user-select: none;
          touch-action: manipulation;
        }

        .media-card {
          position: relative;
          isolation: isolate;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          place-items: center;
          padding: 12px;
          color: rgba(248,251,255,0.96);
          background: var(--bruno-liquid-surface-off-background,
            linear-gradient(180deg, rgba(255,255,255,0.040), rgba(255,255,255,0.010) 46%, rgba(0,0,0,0.030)),
            rgba(9,11,15,0.105)
          );
          backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
          -webkit-backdrop-filter: var(--bruno-liquid-surface-off-filter, blur(18px) saturate(0.92) brightness(1.05) contrast(1.02));
          border: var(--bruno-liquid-surface-off-border, 1px solid rgba(255,255,255,0.070));
          border-radius: var(--card-radius);
          box-shadow: var(--bruno-liquid-surface-off-shadow,
            inset 0 1px 0 rgba(255,255,255,0.090),
            0 10px 28px rgba(0,0,0,0.145)
          );
          overflow: hidden;
        }

        .media-card::before,
        .media-card::after {
          content: "";
          position: absolute;
          pointer-events: none;
          border-radius: inherit;
        }

        .media-card::before {
          inset: 1px;
          z-index: 0;
          background: var(--bruno-liquid-surface-off-sheen,
            linear-gradient(180deg, rgba(255,255,255,0.10), transparent 42%)
          );
          opacity: var(--bruno-liquid-surface-off-sheen-opacity, 0.10);
        }

        .media-card::after {
          inset: 0;
          z-index: 4;
          padding: 1px;
          background: var(--bruno-liquid-surface-edge-glow,
            linear-gradient(125deg, rgba(255,255,255,0.11), rgba(255,255,255,0.026) 38%, rgba(255,255,255,0.010) 100%)
          );
          -webkit-mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          -webkit-mask-composite: xor;
          mask:
            linear-gradient(#000 0 0) content-box,
            linear-gradient(#000 0 0);
          mask-composite: exclude;
          opacity: 0.70;
        }

        .media-shell {
          position: relative;
          z-index: 1;
          height: 100%;
          width: auto;
          max-width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: calc(var(--card-radius) - 7px);
          overflow: hidden;
          touch-action: pan-y;
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 10px 24px rgba(0,0,0,0.18);
          transition: transform 160ms ease;
        }

        .media-shell.is-pressed {
          transform: scale(0.992);
        }

        .viewport,
        .slides,
        .slide {
          width: 100%;
          height: 100%;
          min-height: 0;
        }

        .viewport {
          overflow: hidden;
          border-radius: inherit;
          border: 1px solid rgba(255,255,255,0.12);
          background:
            radial-gradient(circle at 50% 44%, rgba(var(--accent),0.16), transparent 42%),
            linear-gradient(160deg, rgba(12,17,28,0.76), rgba(5,8,15,0.88));
        }

        .slides {
          display: flex;
          transform: translateX(calc(${c} * -100%));
          transition: transform 360ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        .slide {
          flex: 0 0 100%;
          position: relative;
        }

        .focus-surface {
          position: relative;
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-rows: 1fr auto;
          overflow: hidden;
          outline: none;
          cursor: pointer;
          touch-action: pan-y;
          background:
            radial-gradient(circle at 50% 44%, rgba(var(--accent),0.16), transparent 42%),
            linear-gradient(160deg, rgba(12,17,28,0.76), rgba(5,8,15,0.88));
        }

        .focus-surface::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background: var(--focus-art, none) center / cover no-repeat;
          filter: var(--focus-art-filter, none);
          transform: var(--focus-art-transform, scale(1));
          pointer-events: none;
        }

        .focus-surface.is-soft-artwork {
          --focus-art-filter: blur(4px) brightness(0.62) saturate(0.92);
          --focus-art-transform: scale(1.035);
        }

        .focus-surface.is-empty-artwork {
          grid-template-rows: 1fr;
        }

        .focus-surface::after {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 1;
          background:
            linear-gradient(180deg, rgba(3,7,16,0.04), rgba(3,7,16,0.62)),
            radial-gradient(circle at 50% 50%, rgba(var(--accent),0.16), transparent 30%),
            repeating-radial-gradient(circle at 50% 50%, rgba(180,225,255,0.16) 0 1px, transparent 1px 18px);
          opacity: ${e.image ? "0.10" : "0.52"};
          pointer-events: none;
        }

        .play-glyph {
          position: relative;
          z-index: 2;
          align-self: center;
          justify-self: center;
          width: 74px;
          height: 74px;
          display: grid;
          place-items: center;
          border-radius: 50%;
          color: rgba(220,245,255,0.92);
          border: 1px solid rgba(220,245,255,0.28);
          background: rgba(10,16,26,0.18);
          backdrop-filter: blur(12px) saturate(1.2);
          -webkit-backdrop-filter: blur(12px) saturate(1.2);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.16),
            0 0 32px rgba(var(--accent),0.18);
          opacity: ${e.isActive && e.image ? "0" : "1"};
          transition: opacity 180ms ease, transform 180ms ease;
        }

        .focus-surface:hover .play-glyph,
        .focus-surface:focus-visible .play-glyph,
        .focus-surface.is-empty-artwork .play-glyph {
          opacity: 1;
          transform: scale(1.03);
        }

        .play-glyph bruno-icon {
          --mdc-icon-size: 34px;
        }

        .focus-bottom {
          position: relative;
          z-index: 3;
          min-width: 0;
          display: grid;
          grid-template-rows: auto auto;
          gap: 6px;
          padding: 18px 11px 14px;
          background:
            linear-gradient(180deg, rgba(7,10,18,0), rgba(7,10,18,0.50) 30%, rgba(7,10,18,0.64));
          backdrop-filter: blur(8px) saturate(1.14);
          -webkit-backdrop-filter: blur(8px) saturate(1.14);
        }

        .focus-surface.is-empty-artwork .focus-bottom {
          display: none;
        }

        .focus-title {
          min-width: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: end;
          gap: 10px;
        }

        .media-copy {
          min-width: 0;
        }

        .media-title,
        .media-sub {
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.62);
        }

        .media-title {
          font-size: 14px;
          line-height: 1.08;
          font-weight: 780;
        }

        .media-sub {
          margin-top: 4px;
          font-size: 11px;
          line-height: 1;
          font-weight: 620;
          color: rgba(255,255,255,0.68);
        }

        .focus-state {
          flex: 0 0 auto;
          height: 23px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 0 9px;
          border-radius: 999px;
          color: rgba(255,255,255,0.78);
          background: rgba(13,18,28,0.48);
          border: 1px solid rgba(255,255,255,0.12);
          font-size: 10px;
          line-height: 1;
          font-weight: 700;
          text-transform: capitalize;
        }

        .focus-state::before {
          content: "";
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: ${e.isActive ? "rgb(52,211,153)" : "rgba(255,255,255,0.34)"};
          box-shadow: ${e.isActive ? "0 0 10px rgba(52,211,153,0.70)" : "none"};
        }

        .controls {
          min-width: 0;
          display: grid;
          grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 4px;
          padding: 4px;
          border-radius: 999px;
          background: rgba(15,20,30,0.48);
          border: 1px solid rgba(255,255,255,0.11);
        }

        .control {
          appearance: none;
          -webkit-appearance: none;
          height: 27px;
          min-width: 0;
          display: grid;
          place-items: center;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 999px;
          background: transparent;
          color: rgba(255,255,255,0.84);
          outline: none;
        }

        .control:hover {
          background: rgba(255,255,255,0.10);
          color: rgba(255,255,255,0.98);
        }

        .control:active,
        .player-card.is-pressed {
          transform: scale(0.97);
        }

        .control bruno-icon {
          --mdc-icon-size: 17px;
        }

        .control.play bruno-icon {
          --mdc-icon-size: 20px;
        }

        .player-grid {
          width: 100%;
          height: 100%;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: repeat(2, minmax(0, 1fr));
          gap: 9px;
          padding: 9px;
          background:
            radial-gradient(120px 90px at 20% 4%, rgba(255,255,255,0.12), transparent 70%),
            linear-gradient(160deg, rgba(7,10,18,0.36), rgba(7,10,18,0.70));
        }

        .player-card {
          appearance: none;
          -webkit-appearance: none;
          position: relative;
          min-width: 0;
          min-height: 0;
          display: grid;
          grid-template-rows: 1fr auto;
          align-items: end;
          padding: 8px;
          text-align: left;
          border-radius: 17px;
          border: 1px solid rgba(255,255,255,0.13);
          background:
            radial-gradient(38px 30px at 18% 12%, rgba(255,255,255,0.16), transparent 72%),
            linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
          color: rgba(255,255,255,0.82);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.10),
            0 8px 20px rgba(0,0,0,0.15);
          overflow: hidden;
          outline: none;
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }

        .player-card.has-art {
          background:
            linear-gradient(180deg, rgba(7,10,18,0.08), rgba(7,10,18,0.76)),
            var(--player-art) center / cover no-repeat,
            linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.035));
        }

        .player-card.is-selected {
          border-color: rgba(var(--accent),0.60);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.18),
            0 0 0 1px rgba(var(--accent),0.18),
            0 0 22px rgba(var(--accent),0.22);
        }

        .player-icon {
          position: absolute;
          left: 8px;
          top: 8px;
          width: 29px;
          height: 29px;
          display: grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(255,255,255,0.82);
          background: rgba(8,12,20,0.36);
          border: 1px solid rgba(255,255,255,0.12);
          backdrop-filter: blur(10px) saturate(1.18);
          -webkit-backdrop-filter: blur(10px) saturate(1.18);
        }

        .player-icon bruno-icon {
          --mdc-icon-size: 17px;
        }

        .player-meta {
          position: relative;
          z-index: 1;
          min-width: 0;
          display: grid;
          gap: 4px;
        }

        .player-name,
        .player-sub {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 1px 3px rgba(0,0,0,0.62);
        }

        .player-name {
          font-size: 11px;
          line-height: 1;
          font-weight: 780;
        }

        .player-sub {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 9px;
          line-height: 1;
          font-weight: 680;
          color: rgba(255,255,255,0.70);
        }

        .player-sub::before {
          content: "";
          width: 6px;
          height: 6px;
          flex: 0 0 6px;
          border-radius: 50%;
          background: var(--player-dot, rgba(255,255,255,0.36));
          box-shadow: var(--player-dot-glow, none);
        }

        .player-card.is-active {
          --player-dot: rgb(52,211,153);
          --player-dot-glow: 0 0 10px rgba(52,211,153,0.70);
        }

        .pagination {
          position: absolute;
          z-index: 3;
          left: 50%;
          bottom: 6px;
          display: inline-flex;
          gap: 6px;
          transform: translateX(-50%);
          padding: 4px 7px;
          border-radius: 999px;
          background: rgba(8,12,18,0.32);
          backdrop-filter: blur(10px) saturate(1.16);
          -webkit-backdrop-filter: blur(10px) saturate(1.16);
        }

        .dot {
          appearance: none;
          -webkit-appearance: none;
          width: 7px;
          height: 7px;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 50%;
          background: rgba(255,255,255,0.34);
          outline: none;
        }

        .dot.is-active {
          background: rgba(255,255,255,0.82);
          box-shadow: 0 0 12px rgba(var(--accent),0.44);
        }

        .media-card.is-wide {
          place-items: stretch;
          padding: 0;
        }

        .media-card.is-wide .media-shell {
          width: 100%;
          height: 100%;
          aspect-ratio: auto;
          border-radius: calc(var(--card-radius) - 6px);
          box-shadow: none;
        }

        .media-card.is-wide .viewport {
          border: 0;
          background: transparent;
        }

        .media-card.is-wide .focus-surface {
          grid-template-rows: minmax(0, 1fr);
          background: transparent;
        }

        .media-card.is-wide .focus-surface::before {
          opacity: 0;
        }

        .media-card.is-wide .focus-surface::after {
          opacity: 0;
        }

        .wide-focus {
          position: relative;
          z-index: 3;
          width: 100%;
          height: 100%;
          min-height: 0;
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(148px, 44%);
          grid-template-rows: 44px minmax(0, 1fr) auto;
          grid-template-areas:
            "head head"
            "copy art"
            "progress art";
          gap: 4px 18px;
          padding: 0 10px 10px 14px;
        }

        .wide-copy {
          grid-area: copy;
          min-width: 0;
          align-self: center;
          display: grid;
          gap: 5px;
        }

        .media-headline {
          grid-area: head;
          height: 44px;
          min-width: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          align-self: start;
          gap: 8px;
        }

        .headline-left {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 10px;
        }

        .header-icon {
          position: relative;
          flex: 0 0 28px;
          width: 28px;
          height: 28px;
          display: inline-grid;
          place-items: center;
          border-radius: 999px;
          color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.92);
          background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.10);
          border: 1px solid rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.26);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08);
        }

        .header-icon bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-title, 16px);
          position: absolute;
          left: 50%;
          top: 50%;
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          line-height: 0;
          transform: translate(-50%, -50%);
        }

        .title {
          min-width: 0;
          display: grid;
          gap: 2px;
        }

        .title-main {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          color: rgba(255,255,255,0.92);
          font-size: 13px;
          line-height: 1.05;
          font-weight: 800;
        }

        .mh-menu {
          appearance: none;
          -webkit-appearance: none;
          width: 30px;
          height: 30px;
          flex: 0 0 30px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          margin: 0;
          padding: 0;
          border: 0;
          border-radius: 9px;
          color: rgba(255,255,255,0.54);
          background: transparent;
          outline: none;
        }

        .mh-menu bruno-icon {
          --mdc-icon-size: var(--bruno-liquid-icon-overflow, 19px);
        }

        .mh-menu:hover,
        .mh-menu.is-active {
          color: rgba(255,255,255,0.88);
          background: rgba(255,255,255,0.072);
        }

        .mh-overflow-panel {
          position: absolute;
          top: 42px;
          right: 10px;
          z-index: 8;
          width: min(142px, calc(100% - 20px));
          display: grid;
          gap: 4px;
          padding: 7px;
          border-radius: var(--bruno-liquid-cell-radius, 13px);
          background: var(--bruno-liquid-popup-background,
            linear-gradient(180deg, rgba(34,31,30,0.720), rgba(12,13,16,0.660))
          );
          border: var(--bruno-liquid-popup-border, 1px solid rgba(255,255,255,0.115));
          box-shadow: var(--bruno-liquid-popup-shadow,
            inset 0 1px 0 rgba(255,255,255,0.100),
            0 18px 36px rgba(0,0,0,0.300)
          );
          backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
          -webkit-backdrop-filter: var(--bruno-liquid-popup-filter, blur(22px) saturate(1.04) brightness(0.96));
        }

        .media-action-option {
          appearance: none;
          -webkit-appearance: none;
          min-height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 12px;
          border: 0;
          border-radius: 9px;
          color: rgba(255,255,255,0.86);
          background: var(--bruno-liquid-popup-option-background, rgba(255,255,255,0.035));
          font-size: 11px;
          line-height: 1;
          font-weight: 780;
          text-align: center;
        }

        .media-action-option:hover {
          color: rgba(255,255,255,0.98);
          background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
        }

        .media-action-option:disabled {
          pointer-events: none;
          color: rgba(255,255,255,0.34);
        }

        .wide-primary,
        .wide-secondary,
        .wide-context {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          text-shadow: 0 2px 10px rgba(0,0,0,0.36);
        }

        .wide-primary {
          color: rgba(255,255,255,0.96);
          font-size: clamp(15px, 2.05vh, 19px);
          line-height: 1.05;
          font-weight: 760;
        }

        .wide-secondary {
          color: rgba(255,255,255,0.68);
          font-size: 12px;
          line-height: 1.1;
          font-weight: 620;
        }

        .wide-context {
          color: rgba(255,255,255,0.56);
          font-size: 11px;
          line-height: 1.1;
          font-weight: 680;
        }

        .wide-art {
          grid-area: art;
          align-self: end;
          justify-self: end;
          position: relative;
          width: min(100%, 180px);
          aspect-ratio: 1 / 1;
          display: grid;
          place-items: center;
          margin: 0 0 4px;
          padding: 0;
          overflow: hidden;
          border-radius: 18px;
          color: rgba(255,255,255,0.50);
          background:
            linear-gradient(145deg, rgba(255,255,255,0.052), rgba(255,255,255,0.016) 46%, rgba(0,0,0,0.110)),
            rgba(12,13,15,0.135);
          border: 1px solid rgba(255,255,255,0.12);
          box-shadow: inset 0 1px 0 rgba(255,255,255,0.08), 0 12px 24px rgba(0,0,0,0.18);
        }

        .wide-art:not(.has-art) {
          background:
            radial-gradient(90% 72% at 68% 24%, rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.150), transparent 62%),
            radial-gradient(78% 72% at 20% 82%, rgba(160,178,190,0.080), transparent 64%),
            linear-gradient(145deg, rgba(255,255,255,0.070), rgba(255,255,255,0.018) 45%, rgba(0,0,0,0.155)),
            rgba(14,13,13,0.185);
          box-shadow:
            inset 0 1px 0 rgba(255,255,255,0.105),
            inset 0 -22px 48px rgba(0,0,0,0.105),
            0 12px 24px rgba(0,0,0,0.16);
        }

        .wide-art::before {
          content: "";
          position: absolute;
          inset: 0;
          z-index: 0;
          background:
            linear-gradient(135deg, rgba(255,255,255,0.120), transparent 34%),
            linear-gradient(315deg, transparent 58%, rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.055));
          opacity: 0;
          pointer-events: none;
        }

        .wide-art:not(.has-art)::before {
          opacity: 0.44;
        }

        .wide-art img {
          position: relative;
          z-index: 1;
          width: 100%;
          height: 100%;
          display: block;
          object-fit: cover;
        }

        .focus-surface.is-paused-media .wide-art.has-art img {
          filter: blur(2.8px) brightness(0.78) saturate(0.90);
          transform: scale(1.035);
        }

        .focus-surface.is-inactive-media .wide-art.has-art img {
          filter: blur(3.2px) brightness(0.72) saturate(0.46);
          transform: scale(1.04);
        }

        .wide-art bruno-icon {
          position: relative;
          z-index: 1;
          --mdc-icon-size: 44px;
          color: rgba(255,255,255,0.46);
          filter: drop-shadow(0 6px 18px rgba(0,0,0,0.32));
        }

        .wide-art:not(.has-art) bruno-icon {
          display: none;
        }

        .wide-progress {
          grid-area: progress;
          display: grid;
          gap: 8px;
          align-self: end;
        }

        .wide-progress.is-inactive {
          grid-template-columns: minmax(0, 1fr);
          grid-template-rows: auto auto;
          justify-items: start;
          align-items: end;
          gap: 5px;
        }

        .wide-progress.is-inactive .status-label {
          width: 100%;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .choose-media {
          appearance: none;
          -webkit-appearance: none;
          min-height: 28px;
          padding: 0 10px;
          border-radius: var(--bruno-liquid-control-radius, 10px);
          color: rgba(255,255,255,0.82);
          background: var(--bruno-liquid-control-background, rgba(255,255,255,0.040));
          border: var(--bruno-liquid-control-border, 1px solid rgba(255,255,255,0.090));
          box-shadow: var(--bruno-liquid-control-shadow, inset 0 1px 0 rgba(255,255,255,0.060));
          font-size: 10px;
          line-height: 1;
          font-weight: 760;
          white-space: nowrap;
        }

        .choose-media:hover,
        .choose-media:focus-visible {
          color: rgba(255,255,255,0.96);
          background: var(--bruno-liquid-popup-option-hover-background, rgba(242,194,102,0.115));
          outline: none;
        }

        .status-label {
          min-width: 0;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.94);
          font-size: 12px;
          line-height: 1;
          font-weight: 680;
          white-space: nowrap;
        }

        .status-label i {
          width: 8px;
          height: 8px;
          flex: 0 0 8px;
          border-radius: 999px;
          background: rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.96);
          box-shadow: 0 0 12px rgba(var(--bruno-liquid-warm-accent, 242,194,102),0.28);
        }

        .status-label.is-muted {
          color: rgba(255,255,255,0.46);
        }

        .status-label.is-muted i {
          background: rgba(255,255,255,0.28);
          box-shadow: none;
        }

        .progress-track {
          position: relative;
          height: 3px;
          overflow: hidden;
          border-radius: 999px;
          background: rgba(255,255,255,0.13);
        }

        .progress-track span {
          position: absolute;
          inset: 0 auto 0 0;
          border-radius: inherit;
          background: rgba(246,190,92,0.96);
          box-shadow: 0 0 18px rgba(246,190,92,0.26);
        }

        .progress-track span {
          width: var(--media-progress, 0%);
        }

        .media-card.is-wide .player-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-template-rows: minmax(0, 1fr);
          gap: 10px;
          padding: 9px;
          background: transparent;
        }

        .media-card.is-wide .player-card {
          grid-template-rows: minmax(0, 1fr) auto;
          border-radius: var(--bruno-liquid-card-radius-compact, 16px);
          background: var(--bruno-liquid-cell-background,
            linear-gradient(180deg, rgba(255,255,255,0.022), rgba(255,255,255,0.006)),
            rgba(9,11,15,0.030)
          );
          border: var(--bruno-liquid-cell-border, 1px solid rgba(255,255,255,0.050));
          box-shadow: var(--bruno-liquid-cell-shadow, inset 0 1px 0 rgba(255,255,255,0.040));
        }

        .media-card.is-wide .player-card.has-art {
          background:
            linear-gradient(180deg, rgba(7,10,18,0.02), rgba(7,10,18,0.48)),
            var(--player-art) center / cover no-repeat,
            var(--bruno-liquid-cell-background, rgba(255,255,255,0.010));
        }

        .media-card.is-wide .pagination {
          bottom: 7px;
        }

        @media (max-height: 760px) {
          .media-card { padding: 10px; }
          .focus-bottom { padding: 15px 10px 13px; gap: 5px; }
          .control { height: 25px; }
          .player-grid { gap: 7px; padding: 7px; }

          .media-card.is-wide .focus-bottom {
            gap: 10px;
            padding: 28px 12px 11px;
          }

          .media-card.is-wide .wide-focus {
            gap: 7px 14px;
            padding: 2px 0;
          }

          .media-card.is-wide .wide-art {
            width: min(100%, 148px);
            border-radius: 16px;
          }

          .media-card.is-wide .wide-primary {
            font-size: clamp(14px, 2vh, 18px);
          }

          .media-card.is-wide .player-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr));
            grid-template-rows: minmax(0, 1fr);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .slides,
          .media-shell,
          .control,
          .player-card {
            transition: none !important;
          }
        }
      </style>

      <div class="media-card${p}">
        <div class="media-shell" style="--slide-index:${c};">
          <div class="viewport">
            <div class="slides">
              <section class="slide focus-slide">
                <div class="focus-surface${a}${i}${r}${n}" ${d} style="${t}">
                  ${f}
                </div>
              </section>

              ${l.length ? `
                <section class="slide players-slide">
                  <div class="player-grid" aria-label="Players recentes">
                    ${l.map((m) => this._playerButton(m)).join("")}
                  </div>
                </section>
              ` : ""}
            </div>
          </div>

          <div class="pagination" aria-label="Slides de midia">
            <button class="dot${c === 0 ? " is-active" : ""}" type="button" data-slide-index="0" aria-label="Slide principal"></button>
            ${l.length ? `<button class="dot${c === 1 ? " is-active" : ""}" type="button" data-slide-index="1" aria-label="Players recentes"></button>` : ""}
          </div>
        </div>
      </div>
    `, this._wireActions();
  }
  _control(e, t, a, i = "") {
    return `
      <button class="control ${i}" type="button" data-script-key="${e}" aria-label="${k._escapeAttr(a)}">
        <bruno-icon icon="${t}"></bruno-icon>
      </button>
    `;
  }
  _playerButton(e) {
    const t = e.selected ? " is-selected" : "", a = e.active ? " is-active" : "", i = e.image ? " has-art" : "", r = e.image ? ` style="--player-art: url('${k._escapeAttr(k._cssUrl(e.image))}');"` : "";
    return `
      <button class="player-card${t}${a}${i}" type="button" data-player-id="${k._escapeAttr(e.entity)}"${r} aria-label="${k._escapeAttr(e.name)}">
        <span class="player-icon" aria-hidden="true"><bruno-icon icon="${k._escapeAttr(e.icon)}"></bruno-icon></span>
        <span class="player-meta">
          <span class="player-name">${k._escape(e.name)}</span>
          <span class="player-sub">${k._escape(e.subtitle)}</span>
        </span>
      </button>
    `;
  }
  static _escape(e) {
    return String(e ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }
  static _escapeAttr(e) {
    return k._escape(e).replace(/'/g, "&#39;");
  }
  static _cssUrl(e) {
    return String(e || "").replace(/\\/g, "\\\\").replace(/'/g, "\\'").replace(/\)/g, "\\)").replace(/[\r\n]/g, "");
  }
}
customElements.get(kt) || customElements.define(kt, k);
window.customCards = window.customCards || [];
window.customCards.push({
  type: kt,
  name: "Bruno Media Card",
  preview: !1,
  description: "Isolated Bento media card with preserved media focus, FIFO slots and square swipe behavior."
});
/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Ie = globalThis, $t = Ie.ShadowRoot && (Ie.ShadyCSS === void 0 || Ie.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype, Mt = Symbol(), qa = /* @__PURE__ */ new WeakMap();
let ri = class {
  constructor(e, t, a) {
    if (this._$cssResult$ = !0, a !== Mt) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
    this.cssText = e, this.t = t;
  }
  get styleSheet() {
    let e = this.o;
    const t = this.t;
    if ($t && e === void 0) {
      const a = t !== void 0 && t.length === 1;
      a && (e = qa.get(t)), e === void 0 && ((this.o = e = new CSSStyleSheet()).replaceSync(this.cssText), a && qa.set(t, e));
    }
    return e;
  }
  toString() {
    return this.cssText;
  }
};
const ko = (o) => new ri(typeof o == "string" ? o : o + "", void 0, Mt), xe = (o, ...e) => {
  const t = o.length === 1 ? o[0] : e.reduce((a, i, r) => a + ((n) => {
    if (n._$cssResult$ === !0) return n.cssText;
    if (typeof n == "number") return n;
    throw Error("Value passed to 'css' function must be a 'css' function result: " + n + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
  })(i) + o[r + 1], o[0]);
  return new ri(t, o, Mt);
}, qo = (o, e) => {
  if ($t) o.adoptedStyleSheets = e.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
  else for (const t of e) {
    const a = document.createElement("style"), i = Ie.litNonce;
    i !== void 0 && a.setAttribute("nonce", i), a.textContent = t.cssText, o.appendChild(a);
  }
}, Sa = $t ? (o) => o : (o) => o instanceof CSSStyleSheet ? ((e) => {
  let t = "";
  for (const a of e.cssRules) t += a.cssText;
  return ko(t);
})(o) : o;
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const { is: So, defineProperty: Ao, getOwnPropertyDescriptor: Oo, getOwnPropertyNames: Eo, getOwnPropertySymbols: Co, getPrototypeOf: To } = Object, Be = globalThis, Aa = Be.trustedTypes, $o = Aa ? Aa.emptyScript : "", Mo = Be.reactiveElementPolyfillSupport, ue = (o, e) => o, qt = { toAttribute(o, e) {
  switch (e) {
    case Boolean:
      o = o ? $o : null;
      break;
    case Object:
    case Array:
      o = o == null ? o : JSON.stringify(o);
  }
  return o;
}, fromAttribute(o, e) {
  let t = o;
  switch (e) {
    case Boolean:
      t = o !== null;
      break;
    case Number:
      t = o === null ? null : Number(o);
      break;
    case Object:
    case Array:
      try {
        t = JSON.parse(o);
      } catch {
        t = null;
      }
  }
  return t;
} }, oi = (o, e) => !So(o, e), Oa = { attribute: !0, type: String, converter: qt, reflect: !1, useDefault: !1, hasChanged: oi };
Symbol.metadata ??= Symbol("metadata"), Be.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
let te = class extends HTMLElement {
  static addInitializer(e) {
    this._$Ei(), (this.l ??= []).push(e);
  }
  static get observedAttributes() {
    return this.finalize(), this._$Eh && [...this._$Eh.keys()];
  }
  static createProperty(e, t = Oa) {
    if (t.state && (t.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(e) && ((t = Object.create(t)).wrapped = !0), this.elementProperties.set(e, t), !t.noAccessor) {
      const a = Symbol(), i = this.getPropertyDescriptor(e, a, t);
      i !== void 0 && Ao(this.prototype, e, i);
    }
  }
  static getPropertyDescriptor(e, t, a) {
    const { get: i, set: r } = Oo(this.prototype, e) ?? { get() {
      return this[t];
    }, set(n) {
      this[t] = n;
    } };
    return { get: i, set(n) {
      const s = i?.call(this);
      r?.call(this, n), this.requestUpdate(e, s, a);
    }, configurable: !0, enumerable: !0 };
  }
  static getPropertyOptions(e) {
    return this.elementProperties.get(e) ?? Oa;
  }
  static _$Ei() {
    if (this.hasOwnProperty(ue("elementProperties"))) return;
    const e = To(this);
    e.finalize(), e.l !== void 0 && (this.l = [...e.l]), this.elementProperties = new Map(e.elementProperties);
  }
  static finalize() {
    if (this.hasOwnProperty(ue("finalized"))) return;
    if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(ue("properties"))) {
      const t = this.properties, a = [...Eo(t), ...Co(t)];
      for (const i of a) this.createProperty(i, t[i]);
    }
    const e = this[Symbol.metadata];
    if (e !== null) {
      const t = litPropertyMetadata.get(e);
      if (t !== void 0) for (const [a, i] of t) this.elementProperties.set(a, i);
    }
    this._$Eh = /* @__PURE__ */ new Map();
    for (const [t, a] of this.elementProperties) {
      const i = this._$Eu(t, a);
      i !== void 0 && this._$Eh.set(i, t);
    }
    this.elementStyles = this.finalizeStyles(this.styles);
  }
  static finalizeStyles(e) {
    const t = [];
    if (Array.isArray(e)) {
      const a = new Set(e.flat(1 / 0).reverse());
      for (const i of a) t.unshift(Sa(i));
    } else e !== void 0 && t.push(Sa(e));
    return t;
  }
  static _$Eu(e, t) {
    const a = t.attribute;
    return a === !1 ? void 0 : typeof a == "string" ? a : typeof e == "string" ? e.toLowerCase() : void 0;
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
    for (const a of t.keys()) this.hasOwnProperty(a) && (e.set(a, this[a]), delete this[a]);
    e.size > 0 && (this._$Ep = e);
  }
  createRenderRoot() {
    const e = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
    return qo(e, this.constructor.elementStyles), e;
  }
  connectedCallback() {
    this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((e) => e.hostConnected?.());
  }
  enableUpdating(e) {
  }
  disconnectedCallback() {
    this._$EO?.forEach((e) => e.hostDisconnected?.());
  }
  attributeChangedCallback(e, t, a) {
    this._$AK(e, a);
  }
  _$ET(e, t) {
    const a = this.constructor.elementProperties.get(e), i = this.constructor._$Eu(e, a);
    if (i !== void 0 && a.reflect === !0) {
      const r = (a.converter?.toAttribute !== void 0 ? a.converter : qt).toAttribute(t, a.type);
      this._$Em = e, r == null ? this.removeAttribute(i) : this.setAttribute(i, r), this._$Em = null;
    }
  }
  _$AK(e, t) {
    const a = this.constructor, i = a._$Eh.get(e);
    if (i !== void 0 && this._$Em !== i) {
      const r = a.getPropertyOptions(i), n = typeof r.converter == "function" ? { fromAttribute: r.converter } : r.converter?.fromAttribute !== void 0 ? r.converter : qt;
      this._$Em = i;
      const s = n.fromAttribute(t, r.type);
      this[i] = s ?? this._$Ej?.get(i) ?? s, this._$Em = null;
    }
  }
  requestUpdate(e, t, a, i = !1, r) {
    if (e !== void 0) {
      const n = this.constructor;
      if (i === !1 && (r = this[e]), a ??= n.getPropertyOptions(e), !((a.hasChanged ?? oi)(r, t) || a.useDefault && a.reflect && r === this._$Ej?.get(e) && !this.hasAttribute(n._$Eu(e, a)))) return;
      this.C(e, t, a);
    }
    this.isUpdatePending === !1 && (this._$ES = this._$EP());
  }
  C(e, t, { useDefault: a, reflect: i, wrapped: r }, n) {
    a && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(e) && (this._$Ej.set(e, n ?? t ?? this[e]), r !== !0 || n !== void 0) || (this._$AL.has(e) || (this.hasUpdated || a || (t = void 0), this._$AL.set(e, t)), i === !0 && this._$Em !== e && (this._$Eq ??= /* @__PURE__ */ new Set()).add(e));
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
        for (const [i, r] of this._$Ep) this[i] = r;
        this._$Ep = void 0;
      }
      const a = this.constructor.elementProperties;
      if (a.size > 0) for (const [i, r] of a) {
        const { wrapped: n } = r, s = this[i];
        n !== !0 || this._$AL.has(i) || s === void 0 || this.C(i, void 0, r, s);
      }
    }
    let e = !1;
    const t = this._$AL;
    try {
      e = this.shouldUpdate(t), e ? (this.willUpdate(t), this._$EO?.forEach((a) => a.hostUpdate?.()), this.update(t)) : this._$EM();
    } catch (a) {
      throw e = !1, this._$EM(), a;
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
te.elementStyles = [], te.shadowRootOptions = { mode: "open" }, te[ue("elementProperties")] = /* @__PURE__ */ new Map(), te[ue("finalized")] = /* @__PURE__ */ new Map(), Mo?.({ ReactiveElement: te }), (Be.reactiveElementVersions ??= []).push("2.1.2");
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const It = globalThis, Ea = (o) => o, ze = It.trustedTypes, Ca = ze ? ze.createPolicy("lit-html", { createHTML: (o) => o }) : void 0, ni = "$lit$", F = `lit$${Math.random().toFixed(9).slice(2)}$`, si = "?" + F, Io = `<${si}>`, ee = document, me = () => ee.createComment(""), fe = (o) => o === null || typeof o != "object" && typeof o != "function", Lt = Array.isArray, Lo = (o) => Lt(o) || typeof o?.[Symbol.iterator] == "function", it = `[ 	
\f\r]`, ne = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g, Ta = /-->/g, $a = />/g, Y = RegExp(`>|${it}(?:([^\\s"'>=/]+)(${it}*=${it}*(?:[^ 	
\f\r"'\`<>=]|("|')|))|$)`, "g"), Ma = /'/g, Ia = /"/g, li = /^(?:script|style|textarea|title)$/i, ci = (o) => (e, ...t) => ({ _$litType$: o, strings: e, values: t }), v = ci(1), ns = ci(2), re = Symbol.for("lit-noChange"), _ = Symbol.for("lit-nothing"), La = /* @__PURE__ */ new WeakMap(), J = ee.createTreeWalker(ee, 129);
function di(o, e) {
  if (!Lt(o) || !o.hasOwnProperty("raw")) throw Error("invalid template strings array");
  return Ca !== void 0 ? Ca.createHTML(e) : e;
}
const Ro = (o, e) => {
  const t = o.length - 1, a = [];
  let i, r = e === 2 ? "<svg>" : e === 3 ? "<math>" : "", n = ne;
  for (let s = 0; s < t; s++) {
    const l = o[s];
    let c, p, d = -1, h = 0;
    for (; h < l.length && (n.lastIndex = h, p = n.exec(l), p !== null); ) h = n.lastIndex, n === ne ? p[1] === "!--" ? n = Ta : p[1] !== void 0 ? n = $a : p[2] !== void 0 ? (li.test(p[2]) && (i = RegExp("</" + p[2], "g")), n = Y) : p[3] !== void 0 && (n = Y) : n === Y ? p[0] === ">" ? (n = i ?? ne, d = -1) : p[1] === void 0 ? d = -2 : (d = n.lastIndex - p[2].length, c = p[1], n = p[3] === void 0 ? Y : p[3] === '"' ? Ia : Ma) : n === Ia || n === Ma ? n = Y : n === Ta || n === $a ? n = ne : (n = Y, i = void 0);
    const b = n === Y && o[s + 1].startsWith("/>") ? " " : "";
    r += n === ne ? l + Io : d >= 0 ? (a.push(c), l.slice(0, d) + ni + l.slice(d) + F + b) : l + F + (d === -2 ? s : b);
  }
  return [di(o, r + (o[t] || "<?>") + (e === 2 ? "</svg>" : e === 3 ? "</math>" : "")), a];
};
class ve {
  constructor({ strings: e, _$litType$: t }, a) {
    let i;
    this.parts = [];
    let r = 0, n = 0;
    const s = e.length - 1, l = this.parts, [c, p] = Ro(e, t);
    if (this.el = ve.createElement(c, a), J.currentNode = this.el.content, t === 2 || t === 3) {
      const d = this.el.content.firstChild;
      d.replaceWith(...d.childNodes);
    }
    for (; (i = J.nextNode()) !== null && l.length < s; ) {
      if (i.nodeType === 1) {
        if (i.hasAttributes()) for (const d of i.getAttributeNames()) if (d.endsWith(ni)) {
          const h = p[n++], b = i.getAttribute(d).split(F), u = /([.?@])?(.*)/.exec(h);
          l.push({ type: 1, index: r, name: u[2], strings: b, ctor: u[1] === "." ? zo : u[1] === "?" ? Ho : u[1] === "@" ? Do : Ue }), i.removeAttribute(d);
        } else d.startsWith(F) && (l.push({ type: 6, index: r }), i.removeAttribute(d));
        if (li.test(i.tagName)) {
          const d = i.textContent.split(F), h = d.length - 1;
          if (h > 0) {
            i.textContent = ze ? ze.emptyScript : "";
            for (let b = 0; b < h; b++) i.append(d[b], me()), J.nextNode(), l.push({ type: 2, index: ++r });
            i.append(d[h], me());
          }
        }
      } else if (i.nodeType === 8) if (i.data === si) l.push({ type: 2, index: r });
      else {
        let d = -1;
        for (; (d = i.data.indexOf(F, d + 1)) !== -1; ) l.push({ type: 7, index: r }), d += F.length - 1;
      }
      r++;
    }
  }
  static createElement(e, t) {
    const a = ee.createElement("template");
    return a.innerHTML = e, a;
  }
}
function oe(o, e, t = o, a) {
  if (e === re) return e;
  let i = a !== void 0 ? t._$Co?.[a] : t._$Cl;
  const r = fe(e) ? void 0 : e._$litDirective$;
  return i?.constructor !== r && (i?._$AO?.(!1), r === void 0 ? i = void 0 : (i = new r(o), i._$AT(o, t, a)), a !== void 0 ? (t._$Co ??= [])[a] = i : t._$Cl = i), i !== void 0 && (e = oe(o, i._$AS(o, e.values), i, a)), e;
}
class No {
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
    const { el: { content: t }, parts: a } = this._$AD, i = (e?.creationScope ?? ee).importNode(t, !0);
    J.currentNode = i;
    let r = J.nextNode(), n = 0, s = 0, l = a[0];
    for (; l !== void 0; ) {
      if (n === l.index) {
        let c;
        l.type === 2 ? c = new ye(r, r.nextSibling, this, e) : l.type === 1 ? c = new l.ctor(r, l.name, l.strings, this, e) : l.type === 6 && (c = new Po(r, this, e)), this._$AV.push(c), l = a[++s];
      }
      n !== l?.index && (r = J.nextNode(), n++);
    }
    return J.currentNode = ee, i;
  }
  p(e) {
    let t = 0;
    for (const a of this._$AV) a !== void 0 && (a.strings !== void 0 ? (a._$AI(e, a, t), t += a.strings.length - 2) : a._$AI(e[t])), t++;
  }
}
class ye {
  get _$AU() {
    return this._$AM?._$AU ?? this._$Cv;
  }
  constructor(e, t, a, i) {
    this.type = 2, this._$AH = _, this._$AN = void 0, this._$AA = e, this._$AB = t, this._$AM = a, this.options = i, this._$Cv = i?.isConnected ?? !0;
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
    e = oe(this, e, t), fe(e) ? e === _ || e == null || e === "" ? (this._$AH !== _ && this._$AR(), this._$AH = _) : e !== this._$AH && e !== re && this._(e) : e._$litType$ !== void 0 ? this.$(e) : e.nodeType !== void 0 ? this.T(e) : Lo(e) ? this.k(e) : this._(e);
  }
  O(e) {
    return this._$AA.parentNode.insertBefore(e, this._$AB);
  }
  T(e) {
    this._$AH !== e && (this._$AR(), this._$AH = this.O(e));
  }
  _(e) {
    this._$AH !== _ && fe(this._$AH) ? this._$AA.nextSibling.data = e : this.T(ee.createTextNode(e)), this._$AH = e;
  }
  $(e) {
    const { values: t, _$litType$: a } = e, i = typeof a == "number" ? this._$AC(e) : (a.el === void 0 && (a.el = ve.createElement(di(a.h, a.h[0]), this.options)), a);
    if (this._$AH?._$AD === i) this._$AH.p(t);
    else {
      const r = new No(i, this), n = r.u(this.options);
      r.p(t), this.T(n), this._$AH = r;
    }
  }
  _$AC(e) {
    let t = La.get(e.strings);
    return t === void 0 && La.set(e.strings, t = new ve(e)), t;
  }
  k(e) {
    Lt(this._$AH) || (this._$AH = [], this._$AR());
    const t = this._$AH;
    let a, i = 0;
    for (const r of e) i === t.length ? t.push(a = new ye(this.O(me()), this.O(me()), this, this.options)) : a = t[i], a._$AI(r), i++;
    i < t.length && (this._$AR(a && a._$AB.nextSibling, i), t.length = i);
  }
  _$AR(e = this._$AA.nextSibling, t) {
    for (this._$AP?.(!1, !0, t); e !== this._$AB; ) {
      const a = Ea(e).nextSibling;
      Ea(e).remove(), e = a;
    }
  }
  setConnected(e) {
    this._$AM === void 0 && (this._$Cv = e, this._$AP?.(e));
  }
}
class Ue {
  get tagName() {
    return this.element.tagName;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  constructor(e, t, a, i, r) {
    this.type = 1, this._$AH = _, this._$AN = void 0, this.element = e, this.name = t, this._$AM = i, this.options = r, a.length > 2 || a[0] !== "" || a[1] !== "" ? (this._$AH = Array(a.length - 1).fill(new String()), this.strings = a) : this._$AH = _;
  }
  _$AI(e, t = this, a, i) {
    const r = this.strings;
    let n = !1;
    if (r === void 0) e = oe(this, e, t, 0), n = !fe(e) || e !== this._$AH && e !== re, n && (this._$AH = e);
    else {
      const s = e;
      let l, c;
      for (e = r[0], l = 0; l < r.length - 1; l++) c = oe(this, s[a + l], t, l), c === re && (c = this._$AH[l]), n ||= !fe(c) || c !== this._$AH[l], c === _ ? e = _ : e !== _ && (e += (c ?? "") + r[l + 1]), this._$AH[l] = c;
    }
    n && !i && this.j(e);
  }
  j(e) {
    e === _ ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, e ?? "");
  }
}
class zo extends Ue {
  constructor() {
    super(...arguments), this.type = 3;
  }
  j(e) {
    this.element[this.name] = e === _ ? void 0 : e;
  }
}
class Ho extends Ue {
  constructor() {
    super(...arguments), this.type = 4;
  }
  j(e) {
    this.element.toggleAttribute(this.name, !!e && e !== _);
  }
}
class Do extends Ue {
  constructor(e, t, a, i, r) {
    super(e, t, a, i, r), this.type = 5;
  }
  _$AI(e, t = this) {
    if ((e = oe(this, e, t, 0) ?? _) === re) return;
    const a = this._$AH, i = e === _ && a !== _ || e.capture !== a.capture || e.once !== a.once || e.passive !== a.passive, r = e !== _ && (a === _ || i);
    i && this.element.removeEventListener(this.name, this, a), r && this.element.addEventListener(this.name, this, e), this._$AH = e;
  }
  handleEvent(e) {
    typeof this._$AH == "function" ? this._$AH.call(this.options?.host ?? this.element, e) : this._$AH.handleEvent(e);
  }
}
class Po {
  constructor(e, t, a) {
    this.element = e, this.type = 6, this._$AN = void 0, this._$AM = t, this.options = a;
  }
  get _$AU() {
    return this._$AM._$AU;
  }
  _$AI(e) {
    oe(this, e);
  }
}
const jo = It.litHtmlPolyfillSupport;
jo?.(ve, ye), (It.litHtmlVersions ??= []).push("3.3.3");
const Vo = (o, e, t) => {
  const a = t?.renderBefore ?? e;
  let i = a._$litPart$;
  if (i === void 0) {
    const r = t?.renderBefore ?? null;
    a._$litPart$ = i = new ye(e.insertBefore(me(), r), r, void 0, t ?? {});
  }
  return i._$AI(o), i;
};
/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: BSD-3-Clause
 */
const Rt = globalThis;
class Z extends te {
  constructor() {
    super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
  }
  createRenderRoot() {
    const e = super.createRenderRoot();
    return this.renderOptions.renderBefore ??= e.firstChild, e;
  }
  update(e) {
    const t = this.render();
    this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(e), this._$Do = Vo(t, this.renderRoot, this.renderOptions);
  }
  connectedCallback() {
    super.connectedCallback(), this._$Do?.setConnected(!0);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), this._$Do?.setConnected(!1);
  }
  render() {
    return re;
  }
}
Z._$litElement$ = !0, Z.finalized = !0, Rt.litElementHydrateSupport?.({ LitElement: Z });
const Bo = Rt.litElementPolyfillSupport;
Bo?.({ LitElement: Z });
(Rt.litElementVersions ??= []).push("4.2.2");
const Uo = xe`
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
`, Nt = ["on", "playing", "paused", "idle", "buffering"], Fo = ["playing", "buffering"];
function pi(o, e, t) {
  if (!o || !e) return !1;
  const a = o.states[e]?.state;
  if (!a) return !1;
  const i = String(a).toLowerCase();
  return t.some((r) => r.toLowerCase() === i);
}
function ss(o, e) {
  return pi(o, e, Nt);
}
const Ra = /* @__PURE__ */ new Map();
function Go(o, e, t = Date.now(), a = 45e3) {
  if (!o || !e) return !1;
  const i = String(o.states[e]?.state ?? "").toLowerCase();
  if (Nt.includes(i))
    return Ra.set(e, t), !0;
  if (i !== "off") return !1;
  const r = Ra.get(e);
  return r !== void 0 && t - r <= a;
}
function ls(o, e) {
  return pi(o, e, Fo);
}
const Wo = "media_player.spotifyplus_bruno_helasio", se = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], $e = ["playing", "paused", "on"], ui = [
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
        entities: ["media_player.smart_tv_pro_2"],
        states: Nt
      },
      {
        icon: "mdi:snowflake",
        label: "Ar condicionado ativo",
        tone: "cyan",
        entities: ["climate.sl_ar_condicionado"],
        states: se
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Echo Show ativo",
        tone: "amber",
        entities: ["media_player.echo_show"],
        states: $e,
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
      // O estado cru da sessão NÃO participa deste ponto. O HASS.Agent pode
      // ficar congelado em "Unlocked" quando perde API/MQTT; usar esse valor
      // diretamente contorna a proteção temporal já implementada no backend.
      //
      // binary_sensor.office_pc_active é a autoridade de "PC ativo": só fica
      // on quando a sessão está destravada E houve atividade nos últimos 300 s.
      // A sessão continua disponível na subview como telemetria, não como prova.
      {
        icon: "mdi:desktop-classic",
        label: "PC ativo",
        tone: "purple",
        entities: ["binary_sensor.office_pc_active"],
        states: ["on"]
      },
      {
        icon: "mdi:snowflake",
        label: "Ar condicionado ativo",
        tone: "cyan",
        entities: ["climate.ac_office"],
        states: se
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Echo Pop ativo",
        tone: "amber",
        entities: ["media_player.echo_pop_office"],
        states: $e,
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
        states: se
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Midia",
        tone: "purple",
        entities: ["media_player.echo_pop_quarto_casal"],
        states: $e,
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
        states: se
      },
      {
        icon: "mdi:speaker-wireless",
        label: "Midia",
        tone: "purple",
        entities: ["media_player.echo_pop_marina"],
        states: $e,
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
        states: se
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
function Zo() {
  const o = [];
  for (const e of ui)
    for (const [t, a] of Object.entries(e.entities))
      if (typeof a == "string")
        o.push({ entityId: a, roomId: e.id, field: t });
      else if (Array.isArray(a))
        for (const i of a) o.push({ entityId: i, roomId: e.id, field: t });
  return o;
}
const Ko = [
  {
    entity: "script.bruno_scene_apagar_todas_as_luzes",
    name: "Apagar todas as luzes",
    substitui: "homeassistant.turn_off sobre light.todas_as_luzes",
    comoCriar: "CRIADA em 2026-08-06 (Fase 5e.3), com autorizacao do usuario, em config/packages/bruno_scenes.yaml — mesmo padrao dos demais: script bruno_scene_*, nao entidade scene. O painel de Cenas lista scripts."
  }
];
function Yo(o) {
  const e = [], t = [];
  for (const a of Ko)
    o?.states?.[a.entity] ? e.push(a) : t.push(a);
  return { disponiveis: e, ausentes: t };
}
function Qo(o) {
  const e = Zo();
  if (!o) return { total: e.length, ok: 0, issues: [] };
  const t = [];
  let a = 0;
  for (const { entityId: i, roomId: r, field: n } of e) {
    const s = o.states[i];
    s ? s.state === "unavailable" ? t.push({ entityId: i, roomId: r, field: n, problem: "unavailable" }) : a++ : t.push({ entityId: i, roomId: r, field: n, problem: "missing" });
  }
  return { total: e.length, ok: a, issues: t };
}
function Xo(o) {
  return Yo(o).ausentes.map((e) => ({
    tipo: "scene",
    entityId: e.entity,
    nome: e.name,
    comoResolver: e.comoCriar
  }));
}
function Jo() {
  const o = window.devicePixelRatio || 1;
  return {
    buildId: "20260821",
    viewportCss: `${window.innerWidth} x ${window.innerHeight}`,
    screenPhysical: `${Math.round(window.screen.width * o)} x ${Math.round(
      window.screen.height * o
    )}`,
    devicePixelRatio: o,
    containerQueries: typeof CSS < "u" && CSS.supports?.("container-type", "inline-size") === !0,
    reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    userAgent: navigator.userAgent
  };
}
const en = 2;
function tn(o, e) {
  if (["unavailable", "unknown"].includes(e)) return "indisponivel";
  const t = String(o.frontend_stream_type ?? "");
  return t === "web_rtc" ? "web_rtc" : t === "hls" ? "hls" : "instantaneo";
}
async function an(o) {
  const e = hi(o), t = o?.callWS;
  if (!t || !e.cameras.length) return e;
  const a = await Promise.all(
    e.cameras.map(async (r) => {
      if (r.caminho === "indisponivel") return r;
      try {
        const s = (await t({
          type: "camera/capabilities",
          entity_id: r.entityId
        }))?.frontend_stream_types ?? [];
        return s.includes("web_rtc") ? { ...r, caminho: "web_rtc" } : s.includes("hls") ? { ...r, caminho: "hls" } : r;
      } catch {
        return r;
      }
    })
  ), i = {
    web_rtc: 0,
    hls: 0,
    instantaneo: 0,
    indisponivel: 0
  };
  for (const r of a) i[r.caminho]++;
  return {
    streamCarregado: e.streamCarregado,
    cameras: a,
    resumo: i,
    veredito: bi(i, a.length, e.streamCarregado)
  };
}
function hi(o) {
  const e = {
    streamCarregado: !1,
    cameras: [],
    resumo: { web_rtc: 0, hls: 0, instantaneo: 0, indisponivel: 0 },
    veredito: "Sem hass — nada a sondar."
  };
  if (!o) return e;
  const t = [];
  for (const [r, n] of Object.entries(o.states)) {
    if (!r.startsWith("camera.") || !n) continue;
    const s = n.attributes ?? {}, l = Number(s.supported_features ?? 0);
    t.push({
      entityId: r,
      nome: String(s.friendly_name ?? r),
      estado: String(n.state),
      caminho: tn(s, String(n.state)),
      suportaStream: (l & en) !== 0
    });
  }
  t.sort((r, n) => r.entityId.localeCompare(n.entityId));
  const a = {
    web_rtc: 0,
    hls: 0,
    instantaneo: 0,
    indisponivel: 0
  };
  for (const r of t) a[r.caminho]++;
  const i = t.some((r) => r.suportaStream);
  return {
    streamCarregado: i,
    cameras: t,
    resumo: a,
    veredito: bi(a, t.length, i)
  };
}
function bi(o, e, t) {
  return e === 0 ? "Nenhuma câmera encontrada." : o.web_rtc > 0 ? `${o.web_rtc} de ${e} com WebRTC — vale medir stream nessas.` : o.hls > 0 ? `${o.hls} de ${e} só com HLS. A transcodificação roda na VM: stream só se a medição provar que compensa, e uma câmera por vez.` : t ? "Câmeras com stream declarado, mas sem tipo publicado — sondar de novo com o painel aberto." : "Nenhuma câmera declara suporte a stream — o instantâneo é o único caminho.";
}
class rn extends Z {
  constructor() {
    super(...arguments), this._env = Jo(), this._sondando = !1, this._mensagem = "";
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
      Uo,
      xe`
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
  _row(e, t, a = "") {
    return v`<div class="row">
      <dt>${e}</dt>
      <dd class=${a}>${t}</dd>
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
    const e = Le(), t = (l) => (l / 1048576).toFixed(1) + " MB", a = (l) => l.toFixed(1) + " ms", i = e.vazamentos, r = i.timers + i.listeners + i.assinaturas, n = e.desdeAMarca, s = n ? n.instancias + n.timers + n.listeners + n.assinaturas : 0;
    return v`
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
      String(r),
      r === 0 ? "ok" : "warn"
    )}
          ${this._row("Componentes montados", String(e.vivos))}
          ${n ? this._row(
      "Sobrou desde a marca",
      `${n.instancias} inst · ${n.timers} timers · ${n.listeners} listeners · ${n.assinaturas} assin.`,
      s === 0 ? "ok" : "warn"
    ) : _}
        </dl>

        <p class="empty">${e.memoria.veredito}</p>

        ${e.componentes.length ? v`<ul>
              ${e.componentes.map(
      (l) => v`<li>
                  <strong>${l.nome}</strong> — ${l.render.total} renders
                  (média ${l.render.total ? a(l.render.duracaoTotal / l.render.total) : "0.0 ms"},
                  pior ${a(l.render.pior)}) ·
                  vivos: ${l.vivos} ·
                  timers ${l.timers.criados - l.timers.encerrados} ·
                  listeners ${l.listeners.criados - l.listeners.encerrados}
                  ${l.requisicoes.total ? v` · ${l.requisicoes.total} req (${l.requisicoes.falhas} falhas, pior ${a(l.requisicoes.pior)})` : _}
                  ${l.motivos.length ? v`<br /><span class="motivos"
                        >acordado por:
                        ${l.motivos.map((c) => `${c.motivo} (${c.total})`).join(" · ")}</span
                      >` : _}
                </li>`
    )}
            </ul>` : v`<p class="empty">Nenhum componente instrumentado ainda.</p>`}

        <div class="acoes">
          <button type="button" @click=${() => this._copiarBaseline()}>Copiar baseline</button>
          <button type="button" @click=${() => this._marcar()}>Marcar ciclo</button>
          <button type="button" @click=${() => this.requestUpdate()}>Atualizar</button>
        </div>
        ${this._mensagem ? v`<p class="empty">${this._mensagem}</p>` : _}
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
    const e = Qa();
    this._mensagem = `Marca posta: ${e.instancias} instâncias, ${e.timers} timers, ${e.listeners} listeners. Navegue e volte aqui.`, this.requestUpdate();
  }
  _cameras() {
    !this._sondaProfunda && !this._sondando && this._hass && (this._sondando = !0, an(this._hass).then((t) => {
      this._sondaProfunda = t, this._sondando = !1, this.requestUpdate();
    }));
    const e = this._sondaProfunda ?? hi(this._hass);
    return e.cameras.length ? v`
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
          ${e.cameras.map((t) => v`<li>${t.entityId} → ${t.caminho}${t.suportaStream ? " · stream" : ""}</li>`)}
        </ul>
      </div>
    ` : _;
  }
  /**
   * Copia a baseline para a área de transferência.
   *
   * `navigator.clipboard` exige contexto seguro; a WebView do tablet acessa o HA
   * por HTTP na rede local, onde ele nem sempre existe. Por isso o caminho
   * alternativo com `textarea` + `execCommand`, que continua funcionando ali.
   */
  async _copiarBaseline() {
    const e = JSON.stringify(Le(), null, 2);
    try {
      await navigator.clipboard.writeText(e), this._mensagem = "Baseline copiada.";
    } catch {
      const t = document.createElement("textarea");
      t.value = e, t.style.position = "fixed", t.style.opacity = "0", this.shadowRoot?.appendChild(t), t.select();
      const a = document.execCommand("copy");
      t.remove(), this._mensagem = a ? "Baseline copiada." : "Não foi possível copiar — use brunoRuntime.texto().";
    }
    this.requestUpdate();
  }
  render() {
    const e = this._env, t = Qo(this._hass), a = t.issues.filter((n) => n.problem === "missing"), i = t.issues.filter((n) => n.problem === "unavailable"), r = Xo(this._hass);
    return v`
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
      String(a.length),
      a.length === 0 ? "ok" : "bad"
    )}
          ${this._row(
      "Indisponíveis agora",
      String(i.length),
      i.length === 0 ? "ok" : "warn"
    )}
          ${this._row(
      "Dependências do HA ausentes",
      String(r.length),
      r.length === 0 ? "ok" : "warn"
    )}
        </dl>

        ${r.length > 0 ? v`
              <div>
                <h2>Dependências que o dashboard não cria</h2>
                <p>
                  Criar estes itens é configuração do Home Assistant. O dashboard
                  registra a falta e não atua fora do frontend.
                </p>
                <ul>
                  ${r.map(
      (n) => v`<li class="warn">
                      ${n.tipo} · ${n.nome} → ${n.entityId}<br /><small>${n.comoResolver}</small>
                    </li>`
    )}
                </ul>
              </div>
            ` : _}

        ${a.length > 0 ? v`
              <div>
                <h2>Entidades inexistentes</h2>
                <ul>
                  ${a.map(
      (n) => v`<li class="bad">${n.roomId} · ${n.field} → ${n.entityId}</li>`
    )}
                </ul>
              </div>
            ` : _}
        ${i.length > 0 ? v`
              <div>
                <h2>Indisponíveis</h2>
                <ul>
                  ${i.map(
      (n) => v`<li class="warn">${n.roomId} · ${n.field} → ${n.entityId}</li>`
    )}
                </ul>
              </div>
            ` : _}
        ${this._runtime()}
        ${this._cameras()}
        ${this._hass ? _ : v`<p class="empty">Aguardando o objeto hass…</p>`}
      </div>
    `;
  }
}
customElements.get("bruno-diagnostics") || customElements.define("bruno-diagnostics", rn);
const He = window;
He.customCards = He.customCards ?? [];
He.customCards.some((o) => o.type === "bruno-diagnostics") || He.customCards.push({
  type: "bruno-diagnostics",
  name: "Bruno · Diagnóstico",
  description: "Build, viewport, capacidades e validação das entidades configuradas."
});
const Na = {
  "custom:bruno-room-subview": () => import("./bruno-room-subview.C4se6kVu.js"),
  "custom:bruno-cameras-security-subview": () => import("./bruno-cameras-security-subview.CBHmR7Dy.js"),
  "custom:bruno-roborock-subview": () => import("./bruno-roborock-subview.DTdmnZ9N.js"),
  "custom:bruno-planta-3d-subview": () => import("./bruno-planta-3d-subview.BuWQZlf2.js"),
  "custom:bruno-music-subview": () => import("./bruno-music-subview.XuZ319ir.js")
}, za = /* @__PURE__ */ new Map();
async function on(o) {
  if (!o || !Na[o]) return;
  let e = za.get(o);
  e || (e = Na[o](), za.set(o, e)), await e;
}
async function St(o) {
  o && (await on(o.type), o.card && await St(o.card), Array.isArray(o.cards) && await Promise.all(o.cards.map(St)));
}
globalThis.BrunoLazyModules = { ensureForConfig: St };
function nn(o) {
  const e = o / 6e4, t = o / 36e5, a = o / 864e5;
  return e < 1 ? "<1m" : e < 60 ? `${Math.trunc(e)}m` : t < 24 ? `${Math.trunc(t)}h` : `${Math.trunc(a)}d`;
}
function sn(o) {
  const { hass: e, groupEntityId: t, activeSensorId: a, fallbackLightIds: i = [] } = o, r = o.now ?? Date.now(), n = t ? e.states[t] : void 0, s = a ? e.states[a] : void 0;
  let l = null;
  const c = s?.attributes.lights_on_count;
  if (c != null && c !== "" && !Number.isNaN(Number(c)))
    l = Math.trunc(Number(c));
  else {
    const b = s?.attributes.lights_on;
    if (Array.isArray(b))
      l = b.length;
    else if (typeof b == "string" && b.startsWith("[")) {
      const u = b.match(/'/g);
      u && (l = u.length / 2);
    }
  }
  const p = ln(n);
  l === null && p.length > 0 && (l = p.filter((b) => e.states[b]?.state === "on").length), l === null && i.length > 0 && (l = i.filter((b) => e.states[b]?.state === "on").length), l === null && (l = n?.state === "on" ? 1 : 0);
  let d = String(s?.attributes.lights_elapsed ?? "");
  if (!d) {
    const b = p.length > 0 ? p : i;
    let u = null;
    for (const g of b) {
      const f = e.states[g];
      if (f?.state !== "on" || !f.last_changed) continue;
      const m = Date.parse(f.last_changed);
      !Number.isNaN(m) && (u === null || m < u) && (u = m);
    }
    if (u === null && n?.state === "on" && n.last_changed) {
      const g = Date.parse(n.last_changed);
      Number.isNaN(g) || (u = g);
    }
    d = u === null ? "" : nn(r - u);
  }
  const h = l === 1 ? "1 light" : `${l} lights`;
  return {
    count: l,
    elapsed: d,
    label: l > 0 ? `${h}${d ? ` / ${d}` : ""}` : ""
  };
}
function ln(o) {
  const e = o?.attributes.entity_id;
  return Array.isArray(e) ? e.filter((t) => typeof t == "string") : [];
}
function cn(o) {
  const { hass: e, semanticSensorId: t, motionRecentId: a, occupancyId: i } = o, r = t ? e.states[t] : void 0, n = String(r?.state ?? "").toLowerCase(), s = r?.attributes.display;
  if (s && !["none", "unknown", "unavailable", ""].includes(n))
    return String(s).trim();
  const l = a ? e.states[a] : void 0;
  return l && l.state !== "on" ? "" : (i ? e.states[i] : void 0)?.state === "on" ? "Ocupado" : "";
}
function Ha(o, e, t = ["on", "home", "active", "yes"]) {
  if (!e) return !1;
  const a = o.states[e];
  return a ? t.includes(String(a.state).toLowerCase()) : !1;
}
function Da(o, e, t = "") {
  const a = typeof e == "string" ? [e] : e ?? [];
  for (const i of a) {
    const r = o.states[i], n = String(r?.state ?? "").toLowerCase();
    if (!(!r || ["unknown", "unavailable", "none", ""].includes(n)))
      return `${r.state}${t}`;
  }
  return "--";
}
function X(o) {
  return String(o ?? "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
const dn = [
  "source",
  "source_name",
  "device_name",
  "active_device_name",
  "spotify_device_name",
  "media_player",
  "media_player_name"
];
function pn(o, e) {
  const t = X(e);
  if (!t) return !0;
  const a = o ?? {};
  return dn.some((i) => {
    const r = X(a[i]);
    return !!(r && (r === t || r.includes(t) || r.length >= 10 && t.includes(r)));
  });
}
const gi = ["playing", "paused"];
function un(o, e, t) {
  return !o || !gi.includes(String(o.state).toLowerCase()) ? !1 : pn(o.attributes, e) ? !0 : hn(o.attributes, t);
}
function hn(o, e) {
  if (!e || !gi.includes(String(e.state).toLowerCase())) return !1;
  const t = e.attributes ?? {};
  if (X(
    [t.app_name, t.source, t.media_content_type, t.media_channel].join(" ")
  ).includes("spotify")) return !0;
  const i = o ?? {}, r = X(t.media_title), n = X(i.media_title);
  if (r && n && r === n) return !0;
  const s = X(t.media_artist), l = X(i.media_artist);
  return !!(r && n && r.includes(n) && s && l && s === l);
}
const bn = "∅", gn = (o) => o ? `${o.state}@${o.last_changed}` : bn;
class mi {
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
    const t = [], a = /* @__PURE__ */ new Set();
    for (const i of e)
      typeof i != "string" || !i || a.has(i) || (a.add(i), t.push(i));
    this.ids = t, this.ultimo.clear(), this.virgem = !0;
  }
  get observadas() {
    return this.ids;
  }
  projetar(e, t) {
    return (this.projecoes[t] ?? gn)(e.states[t]);
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
      for (const a of this.ids) this.ultimo.set(a, this.projetar(e, a));
      return this.ids;
    }
    let t;
    for (const a of this.ids) {
      const i = this.projetar(e, a);
      i !== this.ultimo.get(a) && (this.ultimo.set(a, i), (t ??= []).push(a));
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
function fi(o, e = 2) {
  return o.length === 0 ? "" : o.length <= e ? o.join(" ") : `${o.slice(0, e).join(" ")} +${o.length - e}`;
}
const mn = /^[a-z_]+\.[a-z0-9_]+$/, fn = 8;
function cs(o, e = 0) {
  const t = [], a = /* @__PURE__ */ new Set(), i = (r, n) => {
    if (!(n > fn || r == null)) {
      if (typeof r == "string") {
        mn.test(r) && !a.has(r) && (a.add(r), t.push(r));
        return;
      }
      if (Array.isArray(r)) {
        for (const s of r) i(s, n + 1);
        return;
      }
      if (typeof r == "object")
        for (const s of Object.values(r)) i(s, n + 1);
    }
  };
  return i(o, e), t;
}
const rt = "bruno-room-tile", vn = 1200, _n = 560, Pa = 10;
function ja() {
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
function ot(o) {
  globalThis.BrunoLiquidGlass?.feedback?.(o);
}
function Va(o) {
  return o === !0 ? !0 : typeof o == "number" ? o > 0 : ["true", "on", "yes", "1"].includes(String(o ?? "").toLowerCase());
}
class xn extends Z {
  constructor() {
    super(...arguments), this._lastAction = 0, this._observador = new mi(), this._motivo = "", this._gestures = {
      room: ja(),
      nav: ja()
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
    const t = ui.find((a) => a.id === e.room);
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
    this._motivo = "", Ya(
      rt,
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
    t.length !== 0 && (this._motivo = fi(t), this.requestUpdate());
  }
  _watched() {
    const e = this._room, t = e?.entities;
    if (!t) return [];
    const a = (e?.statusDots ?? []).flatMap((r) => r.entities ?? []);
    return [
      ...(e?.popup?.lights ?? []).map((r) => r.entity),
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
      ...a
    ].filter((r) => typeof r == "string");
  }
  connectedCallback() {
    super.connectedCallback(), Za(rt), this._tileModeCache = void 0, globalThis.addEventListener?.("bruno-theme-changed", this._onThemeChanged);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), Ka(rt), globalThis.removeEventListener?.("bruno-theme-changed", this._onThemeChanged);
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
  _classe(e, t, a) {
    const i = this.shadowRoot?.querySelector(e);
    i && i.classList.toggle(t, a);
  }
  _alvoSeletor(e) {
    return e === "room" ? ".room-action" : ".room-nav-zone";
  }
  _later(e, t) {
    const a = window.setTimeout(() => {
      this._timers.delete(a), e();
    }, t);
    return this._timers.add(a), a;
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
    const a = this._gestures[e];
    if (a.pointerId !== null) {
      t.stopPropagation();
      return;
    }
    t.stopPropagation(), a.down = !0, a.moved = !1, a.holdFired = !1, a.pointerId = t.pointerId, a.startX = t.clientX, a.startY = t.clientY, this._classe(this._alvoSeletor(e), "is-pressed", !0), a.holdTimer = this._later(() => {
      a.holdTimer = null, !(!a.down || a.moved) && (a.holdFired = !0, this._classe(this._alvoSeletor(e), "is-hold-fired", !0), this._later(() => this._classe(this._alvoSeletor(e), "is-hold-fired", !1), 260), this._runAction("hold"));
    }, _n);
  }
  _onMove(e, t) {
    const a = this._gestures[e];
    if (!a.down || t.pointerId !== a.pointerId) return;
    const i = Math.abs(t.clientX - a.startX), r = Math.abs(t.clientY - a.startY);
    i <= Pa && r <= Pa || (a.moved = !0, a.holdTimer !== null && (window.clearTimeout(a.holdTimer), this._timers.delete(a.holdTimer), a.holdTimer = null), this._classe(this._alvoSeletor(e), "is-pressed", !1));
  }
  _onUp(e, t) {
    const a = this._gestures[e];
    if (t.pointerId !== a.pointerId) {
      t.stopPropagation();
      return;
    }
    t.preventDefault(), t.stopPropagation();
    const i = a.down, r = a.moved, n = a.holdFired;
    if (this._resetGesture(e), !(!i || r || n)) {
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
    const t = this._room, a = this._hass;
    if (!t || !a) return;
    if (ot(e), e === "hold") {
      const n = t.entities.lightGroup;
      if (!n) return;
      a.callService("light", "turn_off", { entity_id: n }, { entity_id: n });
      return;
    }
    const i = Date.now();
    if (i - this._lastAction < vn) return;
    this._lastAction = i;
    const r = t.toggleTarget ?? t.entities.lightGroup ?? t.entities.lights?.[0];
    r && a.callService("light", "toggle", { entity_id: r }, { entity_id: r });
  }
  /**
   * Destino do chevron: a subview do cômodo ou, onde não há, o painel próprio.
   *
   * A shell escuta `ll-custom` e troca a seção; não há mudança de URL.
   */
  _openSubview() {
    const e = this._room;
    if (e) {
      if (ot("tap"), e.section) {
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
    const a = 10, i = window.innerWidth || document.documentElement.clientWidth, r = window.innerHeight || document.documentElement.clientHeight, n = e.offsetWidth || 520, s = e.offsetHeight || 240;
    let l = t.right - n;
    l = Math.min(Math.max(l, a), Math.max(a, i - n - a));
    let c = t.bottom + a;
    c + s > r - a && (c = t.top - s - a), c = Math.min(Math.max(c, a), Math.max(a, r - s - a)), e.style.left = `${Math.round(l)}px`, e.style.top = `${Math.round(c)}px`;
  }
  _alternarLuzDoPainel(e) {
    this._hass && (ot("tap"), this._hass.callService("light", "toggle", { entity_id: e }, { entity_id: e }));
  }
  // ── Modelo ───────────────────────────────────────────────────────────────
  _dots() {
    const e = this._hass, t = this._room;
    if (!e || !t) return [];
    const a = t.activeSensor ? e.states[t.activeSensor] : void 0, i = (r) => {
      const n = (r.states ?? []).map((p) => p.toLowerCase()), s = (r.entities ?? []).some((p) => {
        if (r.offDelayMs && p.startsWith("media_player."))
          return Go(e, p, Date.now(), r.offDelayMs);
        const d = e.states[p];
        return !!d && n.includes(String(d?.state ?? "").toLowerCase());
      }), l = r.activeAttr ? Va(a?.attributes[r.activeAttr]) : !1, c = r.spotifyDevice ? un(e.states[Wo], r.spotifyDevice) : !1;
      return s || l || c;
    };
    return (t.statusDots ?? []).filter(i).map((r) => ({ icon: r.icon, label: r.label, tone: r.tone }));
  }
  _statusLines() {
    const e = this._hass, t = this._room;
    if (!e || !t) return [];
    const a = sn({
      hass: e,
      groupEntityId: t.entities.lightGroup,
      activeSensorId: t.activeSensor,
      fallbackLightIds: t.entities.lights
    }), i = t.entities.semanticState ? cn({
      hass: e,
      semanticSensorId: t.entities.semanticState,
      motionRecentId: t.entities.motionRecent,
      occupancyId: t.entities.occupancy
    }) : "", r = [];
    a.label ? r.push(a.label) : Ha(e, t.entities.lightGroup) && r.push("On");
    const n = this._applianceLine();
    return n && r.push(n), i && r.push(i), r;
  }
  /** Linha do eletrodoméstico, no formato "Lavando / 12m". */
  _applianceLine() {
    const e = this._hass, t = this._room, a = t?.applianceLine;
    if (!e || !t || !a) return "";
    const i = t.activeSensor ? e.states[t.activeSensor] : void 0, r = (a.states ?? []).map((c) => c.toLowerCase()), n = a.entity ? e.states[a.entity] : void 0;
    if (!(!!n && r.includes(String(n?.state ?? "").toLowerCase()) || (a.activeAttr ? Va(i?.attributes[a.activeAttr]) : !1))) return "";
    const l = a.elapsedAttr ? String(i?.attributes[a.elapsedAttr] ?? "") : "";
    return l ? `${a.label} / ${l}` : a.label;
  }
  static {
    this.styles = xe`
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

    /* Tablet somente: mantém os mesmos clamps e a mesma resposta ao container,
       elevando em ~6% a escala-base que ficou pequena depois da fluidização. */
    @media (min-width: 801px) {
      .room-icon {
        max-width: clamp(100.87px, 59.12cqi, 168.12px);
        height: clamp(67.8px, 39.74cqi, 113px);
      }
      .metric-value {
        font-size: clamp(10.75px, 6.3cqi, 17.91px);
      }
      .metric-sub {
        font-size: clamp(9.09px, 5.33cqi, 15.16px);
      }
      .status-dot {
        width: clamp(21.5px, 12.6cqi, 35.83px);
        height: clamp(21.5px, 12.6cqi, 35.83px);
      }
      .status-dot bruno-icon {
        width: clamp(11.58px, 6.78cqi, 19.29px);
        height: clamp(11.58px, 6.78cqi, 19.29px);
      }
    }

    @media (min-width: 801px) and (max-height: 760px) {
      .room-icon {
        max-width: clamp(89.29px, 52.33cqi, 148.82px);
        height: clamp(59.53px, 34.88cqi, 99.22px);
      }
    }

    @media (max-width: 800px) {
      .room-action {
        padding: clamp(8.58px, 5.03cqi, 14.3px) clamp(9.36px, 5.49cqi, 15.6px) clamp(7.8px, 4.57cqi, 13px) clamp(7.8px, 4.57cqi, 13px);
      }
      .room-icon {
        max-width: 100px;
        height: 62px;
      }
      .room-asset {
        height: 118%;
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
    const e = this._room, t = this._hass;
    if (!e) return _;
    const a = t ? Ha(t, e.entities.lightGroup ?? e.entities.lights?.[0]) : !1, i = t ? Da(t, e.entities.temperature, "°") : "--", r = t ? Da(t, e.entities.humidity, "%") : "--", n = !!(e.entities.temperature ?? e.entities.humidity), s = this._statusLines(), l = this._dots(), c = "20260820-webp-runtime-2", p = e.assetOff ? `/local/bruno-ui/assets/${e.assetOff}.webp?v=${c}` : "", d = e.assetOn ? `/local/bruno-ui/assets/${e.assetOn}.webp?v=${c}` : "", h = [
      "room-card",
      a ? "is-room-on" : "",
      this._tileMode ? "is-tile" : "",
      this._tileMode && this._config?.divider_left ? "has-divider" : ""
    ].filter(Boolean).join(" "), b = this._config?.name ?? e.name, u = !!(e.section ?? e.popup), g = e.popup, f = globalThis.BrunoThemeManager?.current?.() === "josh" ? "josh" : "default";
    return v`
      <div class=${h}>
        ${this._tileMode && this._config?.divider_left ? v`<span class="tile-divider" aria-hidden="true"></span>` : _}
        <button
          class="room-action"
          type="button"
          aria-label=${b}
          @pointerdown=${(m) => this._onDown("room", m)}
          @pointermove=${(m) => this._onMove("room", m)}
          @pointerup=${(m) => this._onUp("room", m)}
          @pointercancel=${(m) => this._onCancel("room", m)}
          @pointerleave=${() => this._resetGesture("room")}
          @keydown=${(m) => this._onKey("room", m)}
          @click=${(m) => {
      m.preventDefault(), m.stopPropagation();
    }}
          @dblclick=${(m) => {
      m.preventDefault(), m.stopPropagation();
    }}
        >
          <div class="room-icon" aria-hidden="true">
            <span class="room-asset-wrap">
              ${p ? v`<img class="room-asset room-asset-off" src=${p} alt="" decoding="async" />` : _}
              ${d ? v`<img class="room-asset room-asset-on" src=${d} alt="" decoding="async" />` : _}
            </span>
          </div>

          <span
            class="room-nav-zone"
            role=${u ? "button" : "presentation"}
            tabindex=${u ? 0 : -1}
            aria-label=${u ? `Abrir ${b}` : b}
            @pointerdown=${(m) => u && this._onDown("nav", m)}
            @pointermove=${(m) => u && this._onMove("nav", m)}
            @pointerup=${(m) => u && this._onUp("nav", m)}
            @pointercancel=${(m) => u && this._onCancel("nav", m)}
            @pointerleave=${() => u && this._resetGesture("nav")}
            @keydown=${(m) => u && this._onKey("nav", m)}
          >
            <span class="room-title-row">
              <span class="title">${b}</span>
              ${u ? v`<span class="room-chevron" aria-hidden="true">›</span>` : _}
            </span>
            <span class="status-lines">${s.map((m) => v`<span>${m}</span>`)}</span>
          </span>

          <div class="right-rail" aria-label="Status do ambiente">
            ${n ? v`<div class="metric" aria-label="Temperatura e umidade">
                  <span class="metric-value">${i}</span>
                  <span class="metric-sub">${r}</span>
                </div>` : _}
            <div class="status-stack">
              ${l.map(
      (m) => v`<span class="status-dot tone-${m.tone}" title=${m.label} aria-label=${m.label}>
                  <bruno-icon icon=${m.icon}></bruno-icon>
                </span>`
    )}
            </div>
          </div>
        </button>
        ${g ? v`<dialog
              class="room-popup"
              data-bruno-popup-theme=${f}
              aria-label=${g.title}
              @click=${(m) => {
      m.target === m.currentTarget && this._fecharPainel();
    }}
            >
              <section class="room-popup-panel" role="document" @click=${(m) => m.stopPropagation()}>
                <header class="room-popup-header">
                  <span class="room-popup-icon" aria-hidden="true">
                    <bruno-icon icon=${g.icon}></bruno-icon>
                  </span>
                  <div class="room-popup-title">
                    <strong>${g.title}</strong>
                    ${g.subtitle ? v`<span>${g.subtitle}</span>` : _}
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
                ${g.banner || g.bannerOn ? v`<div class="room-popup-banner">
                      <img
                        src=${(a ? g.bannerOn ?? g.banner : g.banner ?? g.bannerOn) ?? ""}
                        alt=""
                        loading="eager"
                        decoding="async"
                      />
                      <div class="room-popup-banner-shade" aria-hidden="true"></div>
                    </div>` : _}
                <div class="room-popup-lights">
                  ${g.lights.map((m) => {
      const x = t?.states[m.entity], S = String(x?.state ?? "").toLowerCase(), $ = S === "on", z = !x || ["unavailable", "unknown", "none", ""].includes(S), M = [
        "room-popup-light",
        $ ? "is-on" : "",
        z ? "is-unavailable" : ""
      ].filter(Boolean).join(" ");
      return v`<button
                      class=${M}
                      type="button"
                      aria-label=${m.name}
                      @click=${() => this._alternarLuzDoPainel(m.entity)}
                    >
                      <span class="room-popup-light-icon" aria-hidden="true">
                        <bruno-icon icon=${m.icon ?? "mdi:lightbulb-outline"}></bruno-icon>
                      </span>
                      <span class="room-popup-light-copy">
                        <strong>${m.name}</strong>
                        <span>${z ? "Indisponivel" : $ ? "Ligada" : "Desligada"}</span>
                      </span>
                    </button>`;
    })}
                </div>
              </section>
            </dialog>` : _}
      </div>
    `;
  }
}
customElements.get("bruno-room-tile") || customElements.define("bruno-room-tile", xn);
const De = window;
De.customCards = De.customCards ?? [];
De.customCards.some((o) => o.type === "bruno-room-tile") || De.customCards.push({
  type: "bruno-room-tile",
  name: "Bruno · Tile de cômodo",
  description: "Tile parametrizado por cômodo (arquitetura nova)."
});
const Ba = /* @__PURE__ */ new WeakSet();
function yn(o) {
  const e = o.shadowRoot;
  e && e.querySelectorAll("img.room-asset").forEach((t) => {
    t.draggable = !1, t.setAttribute("draggable", "false"), t.style.setProperty("-webkit-touch-callout", "none"), t.style.setProperty("-webkit-user-drag", "none"), t.style.setProperty("-webkit-user-select", "none"), t.style.setProperty("user-select", "none");
  });
}
function wn() {
  customElements.whenDefined("bruno-room-tile").then(() => {
    const o = customElements.get("bruno-room-tile");
    if (!o) return;
    const e = o.prototype;
    if (Ba.has(e)) return;
    Ba.add(e);
    const t = e.updated;
    e.updated = function(...a) {
      t?.apply(this, a), yn(this);
    };
  });
}
class kn {
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
const j = new kn();
function qn(o) {
  const e = j.obter(o.type);
  if (e)
    return e.create(o);
}
function Ua(o) {
  return j.obter(o.type)?.entities(o) ?? [];
}
function Sn(o) {
  const e = [], t = /* @__PURE__ */ new Set();
  for (const [a, i] of o.entries()) {
    const r = i.id || `posição ${a}`;
    i.id ? t.has(i.id) ? e.push(`id repetido — "${i.id}"`) : t.add(i.id) : e.push(`dispositivo em ${r}: falta "id"`), i.type ? j.conhece(i.type) || e.push(`dispositivo "${r}": tipo não registrado — "${i.type}"`) : e.push(`dispositivo "${r}": falta "type"`), i.name || e.push(`dispositivo "${r}": falta "name"`);
    const n = j.obter(i.type)?.validate?.(i);
    n && !n.ok && e.push(...n.erros);
  }
  return { ok: e.length === 0, erros: e };
}
function vi(o, e) {
  if (typeof o == "string") return o || void 0;
  if (!Array.isArray(o)) return;
  const t = o.filter((i) => typeof i == "string" && !!i);
  return t.find((i) => {
    const r = e?.states[i];
    return r && !["unavailable", "unknown", ""].includes(String(r.state).toLowerCase());
  }) ?? t[0];
}
function An(o) {
  const e = /* @__PURE__ */ new Map();
  for (const t of o) {
    const a = t.group ?? "Casa", i = e.get(a);
    i ? i.push(t) : e.set(a, [t]);
  }
  return [...e.entries()].map(([t, a]) => ({ grupo: t, itens: a }));
}
const Fa = [
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
], On = ["cool", "heat", "fan_only", "dry", "heat_cool", "auto"], En = ["on", "playing", "paused", "idle", "buffering"];
class Pe extends Z {
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
    return vi(this._instancia?.entity, this._hass);
  }
  _estado(e) {
    return e && this._hass ? this._hass.states[e] : void 0;
  }
  _servico(e, t, a) {
    this._hass?.callService(e, t, a, a);
  }
  static {
    this.estilosComuns = xe`
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
class Cn extends Pe {
  static {
    this.styles = [Pe.estilosComuns];
  }
  render() {
    const e = this._entityId, t = this._estado(e);
    if (!t) return v`<p class="indisponivel">Entidade indisponível: ${e ?? "—"}</p>`;
    const a = En.includes(String(t.state)), i = String(t.attributes.source ?? t.attributes.app_name ?? "") || "HDMI 1", r = t.attributes.volume_level != null ? Math.round(Number(t.attributes.volume_level) * 100) : null;
    return v`
      <div class="titulo">
        <strong>${this._instancia?.name ?? "TV"}</strong>
        <small>${a ? `Ligada · ${i}` : "Desligada"}</small>
      </div>

      <div class="linha">
        <button
          class=${a ? "is-on" : ""}
          @click=${() => this._servico("homeassistant", "toggle", { entity_id: e })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${a ? "Desligar" : "Ligar"}
        </button>
        <button ?disabled=${!a} @click=${() => this._servico("media_player", "media_play_pause", { entity_id: e })}>
          <bruno-icon icon="mdi:pause"></bruno-icon>Play / Pause
        </button>
      </div>

      ${a ? v`<div class="linha">
            <button @click=${() => this._servico("media_player", "volume_down", { entity_id: e })}>
              <bruno-icon icon="mdi:volume-minus"></bruno-icon>
            </button>
            <span class="valor">${r == null ? "—" : `${r}%`}</span>
            <button @click=${() => this._servico("media_player", "volume_up", { entity_id: e })}>
              <bruno-icon icon="mdi:volume-plus"></bruno-icon>
            </button>
            <button @click=${() => this._servico("media_player", "volume_mute", { entity_id: e, is_volume_muted: !t.attributes.is_volume_muted })}>
              <bruno-icon icon="mdi:volume-mute"></bruno-icon>
            </button>
          </div>` : _}

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
class Tn extends Pe {
  static {
    this.styles = [Pe.estilosComuns];
  }
  render() {
    const e = this._entityId, t = this._estado(e);
    if (!t) return v`<p class="indisponivel">Entidade indisponível: ${e ?? "—"}</p>`;
    const a = On.includes(String(t.state)), i = Number(t.attributes.temperature), r = Number(t.attributes.current_temperature), n = Number.isFinite(Number(t.attributes.min_temp)) ? Number(t.attributes.min_temp) : 16, s = Number.isFinite(Number(t.attributes.max_temp)) ? Number(t.attributes.max_temp) : 30, l = Number(t.attributes.target_temp_step) || 1, c = Array.isArray(t.attributes.hvac_modes) ? t.attributes.hvac_modes : [], p = (d) => this._servico("climate", "set_temperature", {
      entity_id: e,
      temperature: Math.max(n, Math.min(s, d))
    });
    return v`
      <div class="titulo">
        <strong>${this._instancia?.name ?? "Ar-condicionado"}</strong>
        <small>${a ? `${this._rotulo(t.state)} · ambiente ${Number.isFinite(r) ? r : "—"}°` : "Desligado"}</small>
      </div>

      <div class="linha">
        <button
          class=${a ? "is-on" : ""}
          @click=${() => this._servico("climate", a ? "turn_off" : "turn_on", { entity_id: e })}
        >
          <bruno-icon icon="mdi:power"></bruno-icon>${a ? "Desligar" : "Ligar"}
        </button>
      </div>

      <div class="linha">
        <button ?disabled=${!a} @click=${() => p((Number.isFinite(i) ? i : 22) - l)}>
          <bruno-icon icon="mdi:minus"></bruno-icon>
        </button>
        <span class="valor">${Number.isFinite(i) ? `${i}°` : "—"}</span>
        <button ?disabled=${!a} @click=${() => p((Number.isFinite(i) ? i : 22) + l)}>
          <bruno-icon icon="mdi:plus"></bruno-icon>
        </button>
      </div>

      ${c.length ? v`<div class="linha">
            ${c.map(
      (d) => v`<button
                class=${String(t.state) === d ? "is-on" : ""}
                @click=${() => this._servico("climate", "set_hvac_mode", { entity_id: e, hvac_mode: d })}
              >
                ${this._rotulo(d)}
              </button>`
    )}
          </div>` : _}
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
customElements.get("bruno-control-tv") || customElements.define("bruno-control-tv", Cn);
customElements.get("bruno-control-climate") || customElements.define("bruno-control-climate", Tn);
function _i(o) {
  return (e) => {
    const t = document.createElement(o);
    return t.instancia = e, t;
  };
}
j.conhece("media-tv") || j.registrar({
  type: "media-tv",
  label: "TV",
  icon: "mdi:television-classic",
  create: _i("bruno-control-tv"),
  entities: (o) => [typeof o.entity == "string" ? o.entity : o.entity?.[0] ?? ""].filter(Boolean),
  validate: (o) => ({
    ok: !!o.entity,
    erros: o.entity ? [] : [`dispositivo "${o.id}": TV exige "entity"`]
  })
});
j.conhece("climate") || j.registrar({
  type: "climate",
  label: "Ar-condicionado",
  icon: "mdi:air-conditioner",
  create: _i("bruno-control-climate"),
  entities: (o) => [typeof o.entity == "string" ? o.entity : o.entity?.[0] ?? ""].filter(Boolean),
  validate: (o) => ({
    ok: !!o.entity,
    erros: o.entity ? [] : [`dispositivo "${o.id}": clima exige "entity"`]
  })
});
const nt = "bruno-devices-panel", $n = ["on", "playing", "paused", "idle", "buffering", "cool", "heat", "fan_only", "dry", "heat_cool", "auto"];
class Mn extends Z {
  constructor() {
    super(...arguments), this._selecionado = "", this._controles = /* @__PURE__ */ new Map(), this._observador = new mi(
      Fa.flatMap((e) => Ua(e))
    ), this._motivo = "";
  }
  static {
    this.properties = {
      _selecionado: { state: !0 }
    };
  }
  set hass(e) {
    this._hass = e;
    for (const a of this._controles.values()) a.hass = e;
    const t = this._observador.mudancas(e);
    t.length !== 0 && (this._motivo = fi(t), this.requestUpdate());
  }
  get _dispositivos() {
    return Fa;
  }
  _instancia(e) {
    return this._dispositivos.find((t) => t.id === e);
  }
  /** O primeiro ativo abre por padrão; sem nenhum, o primeiro da lista. */
  get _idAberto() {
    return this._selecionado && this._instancia(this._selecionado) ? this._selecionado : this._dispositivos.find((t) => this._estaAtivo(t))?.id ?? this._dispositivos[0]?.id ?? "";
  }
  _estaAtivo(e) {
    const t = vi(e.entity, this._hass), a = t && this._hass ? this._hass.states[t] : void 0;
    return !!a && $n.includes(String(a?.state ?? "").toLowerCase());
  }
  /**
   * O controle do dispositivo aberto.
   *
   * Criado uma vez por instância e guardado. Tipo desconhecido não some nem
   * derruba a lista: vira uma entrada inválida, com o motivo à vista.
   */
  _controleDe(e) {
    const t = this._instancia(e);
    if (!t) return _;
    if (!j.conhece(t.type))
      return v`<p class="aviso">
        Tipo de dispositivo não registrado: <code>${t.type}</code>.
        Registre o controle em <code>components/devices/controls.ts</code>.
      </p>`;
    let a = this._controles.get(e);
    if (!a) {
      const i = qn(t);
      if (!i) return _;
      a = i, this._controles.set(e, a);
    }
    return this._hass && (a.hass = this._hass), a;
  }
  connectedCallback() {
    super.connectedCallback(), Za(nt);
  }
  disconnectedCallback() {
    super.disconnectedCallback(), Ka(nt);
  }
  /** Mede o custo de cada atualizacao (Fase 6.0.1). */
  update(e) {
    const t = this._motivo;
    this._motivo = "", Ya(nt, () => super.update(e), t || "outro");
  }
  render() {
    const e = Sn(this._dispositivos), t = this._idAberto;
    return v`
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

        ${e.ok ? _ : v`<p class="aviso">
              Configuração de dispositivos com problema:
              ${e.erros.map((a) => v`<span>${a}</span>`)}
            </p>`}

        <div class="corpo">
          <nav class="lista" aria-label="Lista de dispositivos">
            ${An(this._dispositivos).map(
      (a) => v`
                <div class="grupo">
                  <h3>${a.grupo}</h3>
                  ${a.itens.map((i) => {
        const r = this._estaAtivo(i), n = i.id === t;
        return v`<button
                      type="button"
                      class="item ${n ? "is-selected" : ""} ${r ? "is-active" : ""}"
                      aria-pressed=${n ? "true" : "false"}
                      @click=${() => {
          this._selecionado = i.id, this.requestUpdate();
        }}
                    >
                      <span class="item-icone">
                        <bruno-icon icon=${i.icon ?? j.obter(i.type)?.icon ?? "mdi:remote"}></bruno-icon>
                      </span>
                      <span class="item-nome">${i.name}</span>
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
    return [...new Set(this._dispositivos.flatMap((e) => Ua(e)))];
  }
  static {
    this.styles = xe`
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
customElements.get("bruno-devices-panel") || customElements.define("bruno-devices-panel", Mn);
const K = "ha-web-rtc-player", In = 6e3, he = 48, be = 27, Ga = 500;
let st;
const Me = /* @__PURE__ */ new WeakMap();
function Ln(o) {
  return o.split(".")[1] ?? o;
}
function _e(o, e, t = 0, a = !0) {
  Vi(`marco: ${Ln(o)} · player webrtc · ${e}`, t, a);
}
function Rn() {
  return typeof customElements > "u" ? Promise.resolve(!1) : customElements.get(K) ? Promise.resolve(!0) : new Promise((o) => {
    let e = !1;
    const t = (i) => {
      e || (e = !0, globalThis.clearTimeout(a), o(i));
    }, a = globalThis.setTimeout(() => t(!!customElements.get(K)), In);
    customElements.whenDefined(K).then(() => t(!0));
  });
}
async function Nn(o, e) {
  if (typeof customElements > "u") return !1;
  if (customElements.get(K)) return !0;
  const t = globalThis.loadCardHelpers;
  if (typeof t != "function") return !1;
  try {
    const a = await t();
    if (customElements.get(K)) return !0;
    const i = a.createCardElement?.({
      type: "picture-entity",
      entity: o,
      camera_view: "live",
      show_name: !1,
      show_state: !1
    });
    return i && e && (i.hass = e), await Rn();
  } catch {
    return !1;
  }
}
async function zn(o, e) {
  if (typeof customElements < "u" && customElements.get(K)) return !0;
  const t = typeof performance < "u" ? performance.now() : Date.now();
  _e(o, "ausente; carregando modulo", 0, !1), st ??= Nn(o, e).finally(() => {
    st = void 0;
  });
  const a = await st, i = typeof performance < "u" ? performance.now() : Date.now();
  return _e(o, a ? "definido sob demanda" : "definicao indisponivel", i - t, a), a;
}
function Hn() {
  if (typeof customElements > "u" || !customElements.get(K)) return;
  const o = document.createElement(K);
  o.classList.add("camera-live-el"), o.setAttribute("muted", ""), o.setAttribute("playsinline", ""), o.setAttribute("autoplay", "");
  try {
    o.fitMode = "cover";
  } catch {
  }
  return jn(o), o;
}
function xi(o, e, t) {
  return e >= 80 && e - o >= 48 && e - t >= 48;
}
function Dn(o, e, t) {
  if (e !== he || t !== be || o.length !== e * t * 4) return !1;
  const a = 6, i = 3, r = e / a, n = t / i, s = Array.from({ length: i }, () => Array(a).fill(!1));
  for (let l = 0; l < i; l++)
    for (let c = 0; c < a; c++) {
      const p = /* @__PURE__ */ new Map();
      let d = 0, h = 0, b = 0;
      for (let u = l * n; u < (l + 1) * n; u++)
        for (let g = c * r; g < (c + 1) * r; g++) {
          const f = (u * e + g) * 4;
          if ((o[f + 3] ?? 0) < 128) continue;
          const m = o[f] ?? 0, x = o[f + 1] ?? 0, S = o[f + 2] ?? 0;
          if (d++, !xi(m, x, S)) continue;
          h++;
          const $ = m >> 4 | x >> 4 << 4 | S >> 4 << 8, z = (p.get($) ?? 0) + 1;
          p.set($, z), b = Math.max(b, z);
        }
      s[l][c] = d >= 48 && h / d >= 0.82 && b / d >= 0.55;
    }
  for (let l = 0; l < i; l++)
    for (let c = 0; c < a; c++)
      if (s[l][c] && (s[l][c + 1] || s[l + 1]?.[c]))
        return !0;
  return !1;
}
function Pn(o, e = he, t = be) {
  const a = /* @__PURE__ */ new Map();
  let i = 0;
  for (let d = 0; d + 3 < o.length; d += 4) {
    if ((o[d + 3] ?? 0) < 128) continue;
    const h = o[d] ?? 0, b = o[d + 1] ?? 0, u = o[d + 2] ?? 0, g = h >> 4 | b >> 4 << 4 | u >> 4 << 8;
    a.set(g, (a.get(g) ?? 0) + 1), i++;
  }
  if (i < 32) return !1;
  let r = 0, n = 0;
  for (const [d, h] of a)
    h <= r || (r = h, n = d);
  const s = (n & 15) * 16 + 8, l = (n >> 4 & 15) * 16 + 8, c = (n >> 8 & 15) * 16 + 8;
  return r / i >= 0.45 && xi(s, l, c) || Dn(o, e, t);
}
function jn(o) {
  if (Me.has(o)) return;
  let e = 0;
  const t = () => {
    if (o.isConnected) {
      e = 0;
      const r = o.shadowRoot?.querySelector("video");
      if (r && r.readyState >= 2) {
        const n = zt(r), s = o.hasAttribute("data-bruno-quadro-verde");
        n && o.classList.contains("is-ready") ? (o.classList.remove("is-ready"), o.setAttribute("data-bruno-quadro-verde", ""), _e(o.entityid ?? "camera.desconhecida", "quadro verde eventual rejeitado", 0, !1)) : !n && s && (o.removeAttribute("data-bruno-quadro-verde"), o.classList.add("is-ready"), _e(o.entityid ?? "camera.desconhecida", "stream recuperado apos quadro verde"));
      }
    } else if (e += 1, e >= 20) {
      Me.delete(o);
      return;
    }
    const i = globalThis.setTimeout(t, Ga);
    Me.set(o, i);
  }, a = globalThis.setTimeout(t, Ga);
  Me.set(o, a);
}
function zt(o) {
  if (typeof document > "u") return !1;
  try {
    const e = document.createElement("canvas");
    e.width = he, e.height = be;
    const t = e.getContext("2d", { willReadFrequently: !0 });
    return t ? (t.drawImage(o, 0, 0, he, be), Pn(
      t.getImageData(0, 0, he, be).data
    )) : !1;
  } catch {
    return !1;
  }
}
const Vn = {
  garantirPlayer: zn,
  criarPlayer: Hn,
  marcar: _e,
  pareceQuadroVerde: zt
}, Bn = {
  principal: 6500,
  secundaria: 15e3
}, Un = {
  principal: 1500,
  secundaria: 3e3
}, Fn = 25e3, Gn = 300, Wn = 6e4, Zn = 12e3, Wa = { comImagem: 2, semImagem: 4 };
function Kn(o, e) {
  return o ? `${o}${o.includes("?") ? "&" : "?"}bruno_t=${e}` : "";
}
const Yn = (o, e) => {
  const t = new Image();
  let a = !0;
  const i = (r) => {
    a && (a = !1, e(r));
  };
  return t.onload = () => i(zt(t) ? "quadro-verde" : !0), t.onerror = () => i(!1), t.src = o, () => {
    a = !1, t.onload = null, t.onerror = null, t.src = "";
  };
}, Qn = {
  agendar: (o, e) => globalThis.setTimeout(o, e),
  cancelar: (o) => globalThis.clearTimeout(o),
  agora: () => typeof performance < "u" ? performance.now() : Date.now()
};
class Xn {
  constructor(e = {}) {
    this.cameras = /* @__PURE__ */ new Map(), this.ligado = !1, this.carregador = e.carregador ?? Yn, this.agenda = e.agenda ?? Qn, this.aoCarregar = e.aoCarregar ?? (() => {
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
    for (const a of e) {
      if (!a.entityId || !a.base) continue;
      t.add(a.entityId);
      const i = this.cameras.get(a.entityId);
      if (i) {
        i.alvo = a;
        continue;
      }
      this.cameras.set(a.entityId, {
        alvo: a,
        emVoo: !1,
        inicio: 0,
        quadros: 0,
        falhas: 0,
        falhasSeguidas: 0,
        ultimaDuracao: 0,
        pior: 0
      }), this.ligado && this.agendarPrimeiro(a.entityId, t.size - 1);
    }
    for (const [a, i] of [...this.cameras])
      t.has(a) || (this.desmontar(i), this.cameras.delete(a));
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
    const a = this.cameras.get(e);
    !a || a.timer !== void 0 || a.emVoo || (a.timer = this.agenda.agendar(
      () => this.buscar(a),
      this.atrasoInicial + t * Gn
    ));
  }
  desmontar(e) {
    e.timer !== void 0 && (this.agenda.cancelar(e.timer), e.timer = void 0), e.prazo !== void 0 && (this.agenda.cancelar(e.prazo), e.prazo = void 0), e.abortar?.(), e.abortar = void 0, e.emVoo = !1;
  }
  buscar(e) {
    if (e.timer = void 0, !this.ligado || e.emVoo) return;
    e.emVoo = !0, e.inicio = this.agenda.agora();
    const t = Kn(e.alvo.base, Math.round(e.inicio) || 1);
    e.prazo = this.agenda.agendar(() => this.encerrar(e, "prazo", t), Fn), e.abortar = this.carregador(
      t,
      (a) => this.encerrar(
        e,
        a === "quadro-verde" ? "quadro-verde" : a ? "ok" : "erro",
        t
      )
    );
  }
  encerrar(e, t, a) {
    if (!e.emVoo) return;
    e.emVoo = !1, e.prazo !== void 0 && (this.agenda.cancelar(e.prazo), e.prazo = void 0), e.abortar?.(), e.abortar = void 0;
    const i = this.agenda.agora() - e.inicio;
    e.ultimaDuracao = i, i > e.pior && (e.pior = i), e.ultimoDesfecho = t;
    const r = t === "ok" && e.quadros === 0;
    t === "ok" ? (e.quadros++, e.falhasSeguidas = 0, r && (e.primeiroQuadro = i), this.aoCarregar({ entityId: e.alvo.entityId, url: a, duracao: i, primeiro: r })) : (e.falhas++, e.falhasSeguidas++), this.aoMedir(e.alvo.entityId, i, t, r), this.ligado && this.agendarProximo(e, i);
  }
  agendarProximo(e, t) {
    const a = e.alvo.prioridade;
    let i = Math.max(Un[a], Bn[a] - t);
    const r = e.quadros === 0, n = r ? Wa.semImagem : Wa.comImagem, s = r ? Zn : Wn;
    if (e.falhasSeguidas >= n) {
      const l = 2 ** Math.min(e.falhasSeguidas - n + 1, 5);
      i = Math.min(s, i * l);
    }
    e.timer = this.agenda.agendar(() => this.buscar(e), i);
  }
}
Fi();
wn();
console.info("[bruno-dashboard] build 20260821");
globalThis.BrunoCameraEngine = Xn;
globalThis.BrunoCameraLive = Vn;
export {
  _ as A,
  Bn as C,
  Xn as M,
  mi as O,
  ui as R,
  Z as a,
  es as b,
  cs as c,
  fi as d,
  ts as e,
  Ya as f,
  Za as g,
  Ka as h,
  xe as i,
  is as j,
  zn as k,
  Hn as l,
  _e as m,
  v as n,
  as as o,
  zt as p,
  Jn as q,
  Vi as r,
  Uo as s,
  ss as t,
  ls as u,
  un as v,
  ns as w
};
//# sourceMappingURL=main.BBuEdMkM.js.map
