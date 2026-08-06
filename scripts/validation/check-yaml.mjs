// Valida a SINTAXE dos YAML do Home Assistant com um parser de verdade.
//
// Existe porque em 2026-08-06 eu publiquei um `configuration.yaml` com OITO
// linhas indentadas com 3 espacos em vez de 4 — um script meu trocou um prefixo
// de 4 caracteres por 3. O `check-includes.pl` passou (os includes resolviam), a
// build passou (nao toca em YAML), e o Home Assistant NAO SUBIU:
//
//   Error loading /config/configuration.yaml: while parsing a block mapping in
//   line 13, column 3 expected <block end>, but found <block sequence start>
//   in line 259, column 4
//
// Nenhuma verificacao do projeto olhava a sintaxe do YAML. Esta olha.
//
//   node scripts/validation/check-yaml.mjs            # config/ inteiro
//   node scripts/validation/check-yaml.mjs <arquivo>  # um so
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const yaml = require('../../dashboard-src/node_modules/js-yaml');

// A raiz sai da posicao DESTE arquivo, nao do diretorio de trabalho: o gate
// (`npm run check`) roda de dentro de dashboard-src/.
const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// As tags proprias do Home Assistant nao existem no YAML padrao. Sem declara-las
// o parser rejeita arquivo valido — e um falso positivo aqui e pior que nada,
// porque ensina a ignorar o verificador.
const TAGS = [
  'include',
  'include_dir_list',
  'include_dir_merge_list',
  'include_dir_named',
  'include_dir_merge_named',
  'secret',
  'env_var',
  'input',
];

const SCHEMA = yaml.DEFAULT_SCHEMA.extend(
  TAGS.flatMap((nome) =>
    ['scalar', 'sequence', 'mapping'].map(
      (kind) => new yaml.Type(`!${nome}`, { kind, construct: () => null }),
    ),
  ),
);

const RAIZ = join(REPO, 'config');
const IGNORAR = [
  /[\\/]_archive[\\/]/,
  /[\\/]node_modules[\\/]/,
  /\.disabled$/,
  // Integracoes de terceiros nao sao nossas para validar, e algumas usam Jinja
  // dentro do YAML de um jeito que o parser padrao rejeita.
  /[\\/]custom_components[\\/]/,
];

function varrer(dir, saida = []) {
  for (const nome of readdirSync(dir)) {
    const caminho = join(dir, nome);
    if (IGNORAR.some((r) => r.test(caminho))) continue;
    const st = statSync(caminho);
    if (st.isDirectory()) varrer(caminho, saida);
    else if (/\.ya?ml$/.test(nome)) saida.push(caminho);
  }
  return saida;
}

const alvo = process.argv[2];
const arquivos = alvo ? [alvo] : varrer(RAIZ);

const falhas = [];
for (const arquivo of arquivos) {
  try {
    yaml.load(readFileSync(arquivo, 'utf8'), { schema: SCHEMA, filename: arquivo });
  } catch (erro) {
    falhas.push({ arquivo: relative(REPO, arquivo), motivo: String(erro.message).split('\n')[0] });
  }
}

console.log(`\n  ${arquivos.length} arquivo(s) YAML verificado(s).`);
if (!falhas.length) {
  console.log('  Nenhum erro de sintaxe.\n');
  process.exit(0);
}

console.log(`  ${falhas.length} com erro de SINTAXE:\n`);
for (const f of falhas) console.log(`    ${f.arquivo}\n      ${f.motivo}`);
console.log('');
process.exit(1);
