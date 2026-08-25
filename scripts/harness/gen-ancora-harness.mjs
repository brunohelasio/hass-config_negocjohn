// Banco de medicao da ANCORAGEM na viewport do telefone.
//
// O defeito real: no telefone algum ANCESTRAL da shell e mais alto que a area
// visivel e rola, arrastando o dashboard inteiro e expondo uma faixa preta.
// Em Chromium headless nao ha barra de endereco, entao 100vh == 100dvh e o
// delta original NAO se reproduz. O que este banco reproduz e a CLASSE do
// problema — um ancestral rolavel mais alto que a viewport — nas duas formas
// que importam:
//
//   A) o proprio documento rola;
//   B) um wrapper DENTRO de um shadow root rola (o caso do "#view" do
//      hui-root, que o encadeamento por parentNode pularia).
//
//   node scripts/harness/gen-ancora-harness.mjs
//   node scripts/harness/serve-harness.mjs scripts/harness/ancora.html 8202
import { writeFileSync } from 'node:fs';

const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #000; }
  bruno-shell { display: block; height: 100dvh; background: #123; }
</style>
</head>
<body>
<script src="/local/bruno-ui/core/bruno-shell.js"></script>
<script>
  // ---- Cenario A: o DOCUMENTO rola -------------------------------------
  // Um wrapper de luz mais alto que a viewport, como um ancestral em 100vh
  // seria num telefone com barra de endereco.
  function montarA() {
    const pagina = document.createElement('div');
    pagina.id = 'pagina';
    pagina.style.height = 'calc(100dvh + 60px)';
    document.body.appendChild(pagina);
    const shell = document.createElement('bruno-shell');
    pagina.appendChild(shell);
    return { shell, pagina };
  }

  // ---- Cenario B: um wrapper DENTRO de shadow root rola -----------------
  // Reproduz a topologia do Lovelace: host com shadow, wrapper rolavel la
  // dentro, e a shell DISTRIBUIDA num slot. O caminho por parentNode nao
  // enxerga o wrapper; o caminho pela arvore achatada enxerga.
  function montarB() {
    const host = document.createElement('div');
    host.id = 'host';
    host.style.display = 'block';
    host.style.height = '100dvh';
    document.body.appendChild(host);
    const raiz = host.attachShadow({ mode: 'open' });
    raiz.innerHTML = '<div id="view" style="height:100%;overflow-y:auto"><div id="interno" style="height:calc(100% + 60px)"><slot></slot></div></div>';
    const shell = document.createElement('bruno-shell');
    host.appendChild(shell);
    return { shell, host, view: raiz.getElementById('view') };
  }

  function podeRolar(el) {
    return el.scrollHeight > el.clientHeight + 1
      && getComputedStyle(el).overflow !== 'hidden'
      && getComputedStyle(el).overflowY !== 'hidden';
  }

  function tentarRolar(el) {
    const antes = el.scrollTop;
    el.scrollTop = 999;
    const depois = el.scrollTop;
    el.scrollTop = antes;
    return depois;
  }

  window.medirA = () => {
    document.body.innerHTML = '';
    const doc = document.documentElement;
    const { shell, pagina } = montarA();
    const preso = { rolou: tentarRolar(doc), overflowInline: doc.style.overflow };
    shell.remove();
    const solto = { rolou: tentarRolar(doc), overflowInline: doc.style.overflow };
    pagina.remove();
    return {
      cenario: 'A — documento rola',
      excedente: doc.scrollHeight - doc.clientHeight,
      comShell: preso,
      semShell: solto,
    };
  };

  window.medirB = () => {
    document.body.innerHTML = '';
    const { shell, host, view } = montarB();
    const preso = {
      rolou: tentarRolar(view),
      overflowInline: view.style.overflow,
      naCadeia: shell._ancestraisDaShell().includes(view),
    };
    shell.remove();
    const solto = { rolou: tentarRolar(view), overflowInline: view.style.overflow };
    host.remove();
    return {
      cenario: 'B — wrapper em shadow root rola',
      excedente: view.scrollHeight - view.clientHeight,
      comShell: preso,
      semShell: solto,
    };
  };

  window.medirTablet = () => {
    document.body.innerHTML = '';
    const doc = document.documentElement;
    const { shell, pagina } = montarA();
    const r = { rolou: tentarRolar(doc), overflowInline: doc.style.overflow };
    shell.remove(); pagina.remove();
    return { cenario: 'tablet — nao deve travar nada', comShell: r, largura: innerWidth };
  };

  window.pronto = true;
</script>
</body>
</html>`;

writeFileSync('scripts/harness/ancora.html', html);
console.log('gerado: scripts/harness/ancora.html');
