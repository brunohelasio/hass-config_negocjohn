// Gera `dashboard-src/src/config/subviews.config.ts` a partir das seis
// DEFAULT_CONFIG das subviews atuais.
//
// Gerado, não transcrito: são 58 chaves por cômodo, e transcrever à mão é como
// o Q. Casal acabou apontando para um arquivo órfão na Fase 5a.
//
//   node scripts/validation/gen-subview-config.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const SAIDA = 'dashboard-src/src/config/subviews.config.ts';
const MAPA = {
  sala: 'sala',
  office: 'office',
  cozinha: 'cozinha',
  casal: 'quarto-casal',
  marina: 'quarto-marina',
  miguel: 'quarto-miguel',
};

const cfgs = JSON.parse(
  execFileSync('node', ['scripts/validation/extract-subview-config.mjs', '--json'], {
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  }),
);

// Chaves idênticas nos seis viram padrão do componente e saem do por-cômodo.
const PADRAO = new Set([
  'climate_active_image',
  'climate_image',
  'greeting_name',
  'navigation_path',
  'refresh_interval',
  'room_nav',
  'subtitle',
]);

const camel = (s) => s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

function limpar(valor) {
  if (valor === '' || valor === null || valor === undefined) return undefined;
  if (Array.isArray(valor)) {
    const itens = valor.map(limpar).filter((v) => v !== undefined);
    return itens.length ? itens : undefined;
  }
  if (typeof valor === 'object') {
    const saida = {};
    for (const [k, v] of Object.entries(valor)) {
      const limpo = limpar(v);
      if (limpo !== undefined) saida[camel(k)] = limpo;
    }
    return Object.keys(saida).length ? saida : undefined;
  }
  return valor;
}

function ts(valor, recuo = 4) {
  const pad = ' '.repeat(recuo);
  if (Array.isArray(valor)) {
    if (!valor.length) return '[]';
    return `[\n${valor.map((v) => `${pad}  ${ts(v, recuo + 2)}`).join(',\n')},\n${pad}]`;
  }
  if (valor && typeof valor === 'object') {
    const linhas = Object.entries(valor).map(([k, v]) => `${pad}  ${k}: ${ts(v, recuo + 2)}`);
    return `{\n${linhas.join(',\n')},\n${pad}}`;
  }
  if (typeof valor === 'string') return `'${valor.replace(/'/g, "\\'")}'`;
  return String(valor);
}

const blocos = [];
for (const [id, arquivo] of Object.entries(MAPA)) {
  const bruto = cfgs[arquivo];
  if (!bruto) continue;
  const util = {};
  for (const [k, v] of Object.entries(bruto)) {
    if (PADRAO.has(k)) continue;
    const limpo = limpar(v);
    if (limpo !== undefined) util[camel(k)] = limpo;
  }
  blocos.push(`  ${id}: ${ts(util, 2)},`);
}

const cabecalho = `/**
 * Configuração das subviews de cômodo — GERADO, não editado à mão.
 *
 * Fonte: as seis \`BRUNO_*_SUBVIEW_DEFAULT_CONFIG\` dos arquivos atuais em
 * \`config/www/bruno-ui/subviews/\`. São 67 chaves por cômodo, das quais 58
 * variam — transcrever isso à mão foi como o Q. Casal acabou apontando para um
 * arquivo órfão na Fase 5a.
 *
 * Regenerar:  node scripts/validation/gen-subview-config.mjs
 *
 * As nove chaves idênticas nos seis (\`room_nav\`, \`refresh_interval\`,
 * \`greeting_name\`, imagens do climate…) NÃO entram aqui: viram padrão do
 * componente. Chaves vazias também saem — string vazia era "não configurado".
 *
 * Complementa \`rooms.config.ts\`, que descreve o TILE. Mesma chave de cômodo.
 */

export interface SubviewConfig {
  title?: string;
  background?: string;
  fallbackBackground?: string;
  spotifyDeviceName?: string;
  climateDeviceName?: string;
  tvStandbyImage?: string;
  spotifyStandbyImage?: string;
  pcImage?: string;
  /** O script de abertura é opcional: nem todo app declara um. */
  tvApps?: readonly { key: string; label: string; image: string; script?: string }[];
  lightZoneLabels?: Record<string, string>;
  lightZoneIcons?: Record<string, string>;
  entities?: Record<string, unknown>;
  [chave: string]: unknown;
}

export const SUBVIEWS: Record<string, SubviewConfig> = {
`;

writeFileSync(SAIDA, cabecalho + blocos.join('\n') + '\n};\n', 'utf8');
console.log(`  gerado: ${SAIDA}`);
console.log(`  cômodos: ${blocos.length}`);
console.log(`  linhas: ${readFileSync(SAIDA, 'utf8').split('\n').length}`);
