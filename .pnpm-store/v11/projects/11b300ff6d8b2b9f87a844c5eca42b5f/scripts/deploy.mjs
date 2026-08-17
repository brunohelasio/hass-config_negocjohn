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
// DESTINO DE PRODUCAO: Everex, desde 2026-08-15. A VM 192.168.3.102 foi
// ABANDONADA — publicar la nao chega a lugar nenhum.
// ANTERIOR (abandonado): const VM = '\\\\192.168.3.102\\config\\www\\dashboard';
const HA = '\\\\192.168.3.154\\config';
const HA_DIST = join(HA, 'www', 'dashboard');
const CONFIG_YAML = join(REPO, 'config', 'configuration.yaml');

// Arquivos que vivem FORA de www/dashboard e precisam ir junto.
//
// Sem esta lista o deploy copiava so o bundle. Em 2026-08-10 uma rodada inteira
// ficou no PC enquanto eu dizia ao usuario para recarregar e reiniciar — o
// bundle novo estava declarado no configuration.yaml, mas nem o YAML nem os
// cards classicos haviam saido daqui.
const EXTRAS = [
  'configuration.yaml',
  'www/bento-sidebar-card.js',
  'www/bruno-ui/core/bruno-shell.js',
  'www/bruno-ui/cards/bruno-top-badges-card.js',
  'www/bruno-ui/cards/bruno-activity-column.js',
  'www/bruno-ui/cards/bruno-hero-card.js',
  'dashboards/views/shell/rail.yaml',
  'dashboards/shared/grid-cards/bento_comodos_matriz.yaml',
];

// --everex publica; --vm continua aceito como apelido, com aviso.
const apelidoVm = process.argv.includes('--vm');
const publicar = apelidoVm || process.argv.includes('--everex');

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

if (publicar) {
  if (apelidoVm) console.log("nota: --vm virou apelido de --everex; a VM foi abandonada.");
  if (!existsSync(HA_DIST)) mkdirSync(HA_DIST, { recursive: true });
  // Remove bundles antigos: com hash no nome, sobrariam para sempre.
  for (const old of readdirSync(HA_DIST)) {
    if (old.startsWith('bruno-dashboard.')) rmSync(join(HA_DIST, old), { force: true });
  }
  let n = 0;
  for (const f of readdirSync(DIST)) {
    copyFileSync(join(DIST, f), join(HA_DIST, basename(f)));
    n++;
  }
  console.log(`✓ ${n} arquivo(s) do bundle publicados em ${HA_DIST}`);

  // Os extras sao COMPARADOS antes de escrever. Publicar as cegas foi o que
  // deixou repositorio e /config divergirem sem ninguem perceber.
  for (const rel of EXTRAS) {
    const origem = join(REPO, 'config', rel);
    const destino = join(HA, ...rel.split('/'));
    if (!existsSync(origem)) {
      console.log(`  · ausente no repositorio, ignorado: ${rel}`);
      continue;
    }
    if (existsSync(destino) && readFileSync(origem).equals(readFileSync(destino))) {
      console.log(`  = ja identico: ${rel}`);
      continue;
    }
    copyFileSync(origem, destino);
    console.log(`  → publicado: ${rel}`);
  }
} else {
  console.log(`✓ bundle em ${DIST} (use --everex para publicar no Home Assistant)`);
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
