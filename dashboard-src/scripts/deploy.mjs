#!/usr/bin/env node
/**
 * Publica o bundle compilado.
 *
 * Sem isto, a Fase 4 acrescentaria uma etapa de build E manteria a cópia manual
 * por Samba — a arquitetura nova deixaria o dia a dia pior do que era.
 *
 *   node scripts/deploy.mjs         → só para config/www/dashboard/ (repo local)
 *   node scripts/deploy.mjs --vm    → também para o /config do Home Assistant
 *
 * O nome do arquivo carrega o hash do conteúdo, então o navegador nunca serve
 * versão velha. Em troca, é preciso atualizar a linha em configuration.yaml
 * quando o hash muda — este script imprime a linha pronta e detecta o caso.
 */
import { readdirSync, existsSync, mkdirSync, copyFileSync, rmSync, readFileSync } from 'node:fs';
import { join, resolve, basename } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const REPO = resolve(ROOT, '..');
const DIST = join(REPO, 'config', 'www', 'dashboard');
const VM = '\\\\192.168.3.102\\config\\www\\dashboard';
const CONFIG_YAML = join(REPO, 'config', 'configuration.yaml');

const toVm = process.argv.includes('--vm');

if (!existsSync(DIST)) {
  console.error('✗ dist ausente. Rode `npm run build` antes.');
  process.exit(1);
}

const files = readdirSync(DIST).filter((f) => f.endsWith('.js'));
const bundle = files.find((f) => f.startsWith('bruno-dashboard.') && !f.endsWith('.map'));
if (!bundle) {
  console.error('✗ bundle nao encontrado em', DIST);
  process.exit(1);
}

const resourceLine = `    - /local/dashboard/${bundle}`;
console.log(`bundle: ${bundle}`);

// O recurso ja esta declarado com este nome?
let declared = false;
if (existsSync(CONFIG_YAML)) {
  const yaml = readFileSync(CONFIG_YAML, 'utf8');
  declared = yaml.split('\n').some((l) => !l.trimStart().startsWith('#') && l.includes(bundle));
}

if (toVm) {
  if (!existsSync(VM)) mkdirSync(VM, { recursive: true });
  // Remove bundles antigos: com hash no nome, sobrariam para sempre.
  for (const old of readdirSync(VM)) {
    if (old.startsWith('bruno-dashboard.')) rmSync(join(VM, old), { force: true });
  }
  let n = 0;
  for (const f of readdirSync(DIST)) {
    copyFileSync(join(DIST, f), join(VM, basename(f)));
    n++;
  }
  console.log(`✓ ${n} arquivo(s) publicado(s) na VM: ${VM}`);
} else {
  console.log(`✓ bundle em ${DIST} (use --vm para publicar no Home Assistant)`);
}

if (declared) {
  console.log('✓ recurso ja declarado em configuration.yaml com este hash');
} else {
  console.log('');
  console.log('⚠ ATUALIZE config/configuration.yaml — em frontend.extra_module_url:');
  console.log('');
  console.log(resourceLine);
  console.log('');
  console.log('  Comente a linha anterior ao lado (Regra de Ouro nº 1) e reinicie o HA.');
}
