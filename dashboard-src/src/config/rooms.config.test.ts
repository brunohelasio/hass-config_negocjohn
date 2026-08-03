import { describe, it, expect } from 'vitest';
import { ROOMS, collectConfiguredEntities } from './rooms.config';

describe('rooms.config', () => {
  it('nao tem id de comodo repetido', () => {
    const ids = ROOMS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('todo entity_id tem a forma dominio.objeto', () => {
    for (const { entityId, roomId, field } of collectConfiguredEntities()) {
      expect(entityId, `${roomId}.${field}`).toMatch(/^[a-z_]+\.[a-z0-9_]+$/);
    }
  });

  it('coleta entidades de todos os comodos', () => {
    const all = collectConfiguredEntities();
    expect(all.length).toBeGreaterThan(50);
    expect(new Set(all.map((e) => e.roomId)).size).toBe(ROOMS.length);
  });

  it('todo comodo com subview declara a secao da shell', () => {
    for (const r of ROOMS) {
      if (r.section) expect(r.section).toMatch(/^[a-z]+$/);
    }
  });
});
