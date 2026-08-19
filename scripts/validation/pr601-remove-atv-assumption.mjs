import fs from 'node:fs';

function replaceExactly(path, oldText, newText) {
  const text = fs.readFileSync(path, 'utf8');
  const count = text.split(oldText).length - 1;
  if (count !== 1) throw new Error(`${path}: expected exactly one match, found ${count}`);
  fs.writeFileSync(path, text.replace(oldText, newText), 'utf8');
}

const subview = 'dashboard-src/src/components/rooms/bruno-room-subview.ts';
replaceExactly(
  subview,
  "import { isEntityInStates, isMediaPlaying, isTvPoweredStable } from '@/services/entities/media-state';",
  "import { isMediaPlaying, isTvPoweredStable } from '@/services/entities/media-state';",
);

replaceExactly(
  subview,
`  private _modeloTv() {
    const id = this._idDe('tv');
    const primario = this._estado(id);
    const remotoId = this._idDe('tvRemotePlayer');
    const remoto = this._estado(remotoId);
    // O Android TV/ADB desta instalação oscila para off por poucos segundos
    // mesmo com a tela ligada. Mantemos a última prova positiva por 45 s.
    // A Apple TV NÃO vira autoridade de energia: só sustenta a sessão quando
    // publica reprodução/pausa/buffering, evitando o falso positivo de idle/on.
    const primarioLigado = isTvPoweredStable(this._hass, id, Date.now(), 45_000);
    const remotoComMidia = isEntityInStates(this._hass, remotoId, ['playing', 'paused', 'buffering']);
    const ativo = primarioLigado || remotoComMidia;
    const reproduzindo = isMediaPlaying(this._hass, id) || isMediaPlaying(this._hass, remotoId);
    const st = remotoComMidia && !primarioLigado ? remoto ?? primario : primario ?? remoto;
    const a = st?.attributes ?? {};
    const estado = st?.state ?? 'off';
`,
`  private _modeloTv() {
    const id = this._idDe('tv');
    const st = this._estado(id);
    // A entidade primária da TV é a única autoridade de estado no Hub.
    // O filtro de 45 s absorve apenas OFF transitório dessa própria entidade;
    // nenhuma entidade auxiliar/legada participa da decisão de energia ou mídia.
    const ativo = isTvPoweredStable(this._hass, id, Date.now(), 45_000);
    const reproduzindo = isMediaPlaying(this._hass, id);
    const a = st?.attributes ?? {};
    const estado = st?.state ?? 'off';
`,
);

const claude = 'CLAUDE.md';
const claudeText = fs.readFileSync(claude, 'utf8');
const oldLine = '- TV: OFF transitório do Android TV recebe histerese de 45 s; Apple TV só apoia o estado quando há mídia real (playing/paused/buffering), nunca por idle/on.';
const newLine = '- TV: OFF transitório da entidade primária recebe histerese de 45 s; nenhuma entidade auxiliar/legada participa como autoridade de energia ou reprodução.';
const count = claudeText.split(oldLine).length - 1;
if (count === 1) fs.writeFileSync(claude, claudeText.replace(oldLine, newLine), 'utf8');
else if (count !== 0) throw new Error(`CLAUDE.md: unexpected Apple TV note count ${count}`);

console.log('Removed unverified tvRemotePlayer/Apple TV assumption from PR601 state logic.');
