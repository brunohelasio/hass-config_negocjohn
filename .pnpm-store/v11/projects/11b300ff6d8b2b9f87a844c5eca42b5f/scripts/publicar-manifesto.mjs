// Escreve config/www/dashboard/manifest.json apontando para o bundle mais novo.
//
// Roda depois do build. A partir da Fase 6.0.4 e ISTO que publica uma versao:
// o `extra_module_url` aponta para o loader, de nome estavel, e o loader le
// este manifesto. Trocar de bundle deixa de exigir reinicio do Home Assistant.
import { readdirSync, statSync, writeFileSync, copyFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = join(REPO, 'config', 'www', 'dashboard');

const bundle = readdirSync(DIR)
  .filter((f) => /^bruno-dashboard\..+\.js$/.test(f))
  .sort((a, b) => statSync(join(DIR, b)).mtimeMs - statSync(join(DIR, a)).mtimeMs)[0];

if (!bundle) {
  console.error('  Nenhum bundle em config/www/dashboard — rode o build antes.');
  process.exit(1);
}

const manifesto = {
  // Formato do proprio manifesto, para o loader poder evoluir sem quebrar.
  formato: 1,
  bundle,
  publicadoEm: new Date().toISOString(),
};

writeFileSync(join(DIR, 'manifest.json'), JSON.stringify(manifesto, null, 2) + '\n');

// O `vite build` limpa o diretorio de saida, entao o loader e copiado da ORIGEM
// a cada publicacao. Editar a copia em config/www/dashboard/ seria perde-la no
// build seguinte — foi o que aconteceu na primeira tentativa.
copyFileSync(join(REPO, 'dashboard-src', 'loader', 'bruno-loader.js'), join(DIR, 'bruno-loader.js'));

console.log(`  manifest.json -> ${bundle}`);
console.log('  bruno-loader.js copiado da origem');
