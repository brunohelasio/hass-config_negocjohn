// Detector da armadilha que já quebrou o dashboard cinco vezes: uma crase
// NÃO ESCAPADA dentro de um comentário que vive dentro de um template literal.
//
// A crase fecha a string, o módulo para de compilar e o sintoma aparece longe
// da causa — em 2026-07-29 as seis subviews voltaram ao tema errado por causa
// de uma dessas. Ver docs/11 e CLAUDE.md.
//
// Paridade de crases NÃO detecta: a espúria vem em par e o total continua par.
// Escapada (\`) é legítima e NÃO é acusada — foi o falso positivo que fez a
// primeira versão deste detector gritar à toa.
//
//   node scripts/validation/check-backtick.mjs <arquivo...>
//   node scripts/validation/check-backtick.mjs --tudo
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const CRASE = String.fromCharCode(96);

// A raiz sai da localização DESTE arquivo, não do diretório de onde se chama.
// Assim `--tudo` varre o repositório inteiro tanto da raiz quanto de
// dashboard-src — que é de onde o gate roda.
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

function varrer(dir, saida = []) {
  for (const nome of readdirSync(dir)) {
    if (nome === 'node_modules' || nome === '_archive' || nome.startsWith('.')) continue;
    const caminho = join(dir, nome);
    const st = statSync(caminho);
    if (st.isDirectory()) varrer(caminho, saida);
    else if (/\.(js|mjs|ts)$/.test(nome)) saida.push(caminho);
  }
  return saida;
}

const explicitos = process.argv.slice(2).filter((a) => !a.startsWith('--'));

// SEM argumento agora significa `--tudo`. Antes significava "nenhum arquivo", e
// o detector imprimia "0 arquivo(s) varrido(s): nenhuma crase perigosa" — que
// lê como aprovação. Foi assim que a ocorrência de 2026-08-10 passou: eu rodei
// sem argumento, li o verde e segui. Um detector que aprova sem olhar nada é
// pior que nenhum, porque cria confiança falsa.
const alvos = explicitos.length
  ? explicitos
  : [
      ...varrer(join(RAIZ, 'config/www')),
      ...varrer(join(RAIZ, 'scripts')),
      ...varrer(join(RAIZ, 'dashboard-src/src')),
    ];

let achados = 0;
let arquivos = 0;

for (const arquivo of alvos) {
  const texto = readFileSync(arquivo, 'utf8');
  const linhas = texto.split(/\r?\n/);

  // Percorre caractere a caractere mantendo o estado: dentro de template
  // literal? dentro de comentário? Só a combinação dos dois interessa.
  let emTemplate = false;
  let emComentario = null;
  // Aspas simples e duplas precisam ser rastreadas: sem isso, o próprio código
  // deste detector — que contém os caracteres de barra e asterisco DENTRO de
  // strings, ao testar por comentários — era lido como se abrisse um comentário,
  // e o arquivo se acusava sozinho.
  let emAspas = null;
  let linha = 1;
  const problemas = [];

  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    const anterior = texto[i - 1];
    const prox = texto[i + 1];
    if (c === '\n') linha++;

    if (emComentario) {
      if (emComentario === '//' && c === '\n') emComentario = null;
      else if (emComentario === '/*' && c === '*' && prox === '/') {
        emComentario = null;
        i++;
      } else if (emComentario === '<!--' && c === '-' && prox === '-' && texto[i + 2] === '>') {
        emComentario = null;
        i += 2;
      } else if (c === CRASE && anterior !== '\\' && emTemplate) {
        problemas.push({ linha, trecho: linhas[linha - 1]?.trim().slice(0, 90) ?? '' });
      }
      continue;
    }

    if (emAspas) {
      if (c === '\\') i++;
      else if (c === emAspas) emAspas = null;
      continue;
    }
    if (!emTemplate && (c === "'" || c === '"')) {
      emAspas = c;
      continue;
    }

    // Dentro de template literal, `//` é texto — pode ser uma URL. Tratá-lo
    // como comentário fazia o detector acusar a linha de log do servidor do
    // harness, que contém http://127.0.0.1. O caso perigoso de verdade é o
    // comentário CSS `/* */` dentro do template, que é onde a crase entra.
    if (c === '/' && prox === '/' && !emTemplate) {
      emComentario = '//';
      i++;
      continue;
    }
    if (c === '/' && prox === '*') {
      emComentario = '/*';
      i++;
      continue;
    }
    // Comentário HTML dentro de template de markup. Foi a 6ª ocorrência da
    // armadilha e a primeira que este detector deixou passar: eu só rastreava
    // comentário de JS e de CSS.
    if (emTemplate && c === '<' && texto.slice(i, i + 4) === '<!--') {
      emComentario = '<!--';
      i += 3;
      continue;
    }
    if (c === CRASE && anterior !== '\\') emTemplate = !emTemplate;
  }

  if (problemas.length) {
    arquivos++;
    console.log(`\n  ${arquivo}`);
    for (const p of problemas) console.log(`    linha ${p.linha}: ${p.trecho}`);
    achados += problemas.length;
  }
}

console.log(
  achados
    ? `\n  ${achados} crase(s) não escapada(s) em comentário dentro de template literal, em ${arquivos} arquivo(s).\n  Trocar por aspas retas ou descrever sem citar código.\n`
    : `\n  ${alvos.length} arquivo(s) varrido(s): nenhuma crase perigosa.\n`,
);
process.exit(achados ? 1 : 0);
