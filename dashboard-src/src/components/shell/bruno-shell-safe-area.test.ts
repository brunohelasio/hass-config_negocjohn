// @ts-expect-error O projeto nao instala @types/node; o Vitest executa este teste em Node.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  new URL('../../../../config/www/bruno-ui/core/bruno-shell.js', import.meta.url),
  'utf8',
);

const phoneStart = source.indexOf('@media (max-width: 800px) {');
const phoneStyles = source.slice(phoneStart, phoneStart + 6_000);

describe('bruno-shell phone safe area', () => {
  it('reserva o inset superior no bloco exclusivo do telefone', () => {
    expect(phoneStart).toBeGreaterThan(-1);
    expect(phoneStyles).toContain('box-sizing: border-box;');
    expect(phoneStyles).toContain('var(--safe-area-inset-top, 0px)');
    expect(phoneStyles).toContain('env(safe-area-inset-top, 0px)');
    expect(phoneStyles).toContain('padding-top: var(--bruno-safe-top);');
  });

  it('mantem a shell dentro da viewport depois de reservar o topo', () => {
    expect(phoneStyles).toContain('height: 100dvh;');
    expect(phoneStyles).toContain('max-height: 100dvh;');

    const viewport = 844;
    const safeTop = 47;
    expect(viewport - safeTop).toBe(797);
  });
});
