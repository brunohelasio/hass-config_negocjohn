// Aquecedor de imagens em segundo plano, compartilhado por todos os cards de
// cômodo (phone e tile). Resolve o item de performance: os pares ON/OFF de
// cada cômodo eram sempre os DOIS requisitados no load da Home, mesmo que só
// um esteja visível (o outro fica em opacity:0, esperando o próximo toggle).
//
// Esconder com CSS não evita o download — o browser já fez o fetch assim que
// viu o <img>/<source> conectado ao DOM. A única forma de adiar de verdade é
// não colocar a URL real no markup até depois do primeiro paint.
//
// Uso pelos cards:
//   BrunoAssetPreload.isReady(url)        -> true se já está em cache "quente"
//   BrunoAssetPreload.schedule(url, cb)   -> agenda o warm-up em idle; cb roda
//                                            (uma vez por chamada) quando a
//                                            URL fica pronta.
//
// warmed: URLs cujo fetch já terminou (sucesso ou erro — erro também "libera"
// para não tentar de novo a cada render).
// listeners: URLs ainda em voo, com a lista de callbacks a notificar.
(() => {
  if (globalThis.BrunoAssetPreload) return;

  const warmed = new Set();
  const listeners = new Map();

  const idle = (fn) => {
    if (typeof requestIdleCallback === 'function') {
      requestIdleCallback(fn, { timeout: 2000 });
    } else {
      setTimeout(fn, 200);
    }
  };

  function isReady(url) {
    return !url || warmed.has(url);
  }

  function schedule(url, onReady) {
    if (!url) return;
    if (warmed.has(url)) {
      if (typeof onReady === 'function') onReady(url);
      return;
    }
    if (listeners.has(url)) {
      if (typeof onReady === 'function') listeners.get(url).push(onReady);
      return;
    }
    listeners.set(url, typeof onReady === 'function' ? [onReady] : []);
    idle(() => {
      const img = new Image();
      img.decoding = 'async';
      const finish = () => {
        warmed.add(url);
        const cbs = listeners.get(url) || [];
        listeners.delete(url);
        for (const cb of cbs) cb(url);
      };
      img.onload = finish;
      img.onerror = finish;
      img.src = url;
    });
  }

  globalThis.BrunoAssetPreload = { isReady, schedule };
})();
