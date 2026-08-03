import type { Hass } from '@/models/home-assistant';
import { collectConfiguredEntities } from '@/config/rooms.config';

/**
 * Verificação de existência de entidades.
 *
 * Ocupa o lugar que a proposta original reservava ao Zod. Zod valida o FORMATO
 * da configuração — se `entities.lights` é uma lista de textos. Só que a
 * configuração aqui é estática e autoral, e o TypeScript já cobre isso em tempo
 * de build.
 *
 * O que quebra de verdade é outra coisa: `light.sala_switch_2` está escrito
 * certo, no formato certo, e simplesmente NÃO EXISTE MAIS porque a entidade foi
 * renomeada no Home Assistant. Zod aprova esse arquivo sem piscar. Isto aqui não.
 */

export interface EntityIssue {
  entityId: string;
  roomId: string;
  field: string;
  problem: 'missing' | 'unavailable';
}

export interface EntityCheckResult {
  total: number;
  ok: number;
  issues: EntityIssue[];
}

export function checkConfiguredEntities(hass: Hass | undefined): EntityCheckResult {
  const configured = collectConfiguredEntities();
  if (!hass) return { total: configured.length, ok: 0, issues: [] };

  const issues: EntityIssue[] = [];
  let ok = 0;

  for (const { entityId, roomId, field } of configured) {
    const entity = hass.states[entityId];
    if (!entity) {
      issues.push({ entityId, roomId, field, problem: 'missing' });
    } else if (entity.state === 'unavailable') {
      issues.push({ entityId, roomId, field, problem: 'unavailable' });
    } else {
      ok++;
    }
  }

  return { total: configured.length, ok, issues };
}

/**
 * Capacidades do ambiente.
 *
 * O viewport CSS é a medida que faltava: é ele que o CSS enxerga, não a
 * resolução anunciada do aparelho. Dois tablets "2560x1600" podem entregar
 * viewports diferentes conforme a densidade — foi o que desorganizou o layout
 * na troca de aparelho. Ver docs/07-design-system.md.
 */
export interface EnvironmentInfo {
  buildId: string;
  viewportCss: string;
  screenPhysical: string;
  devicePixelRatio: number;
  containerQueries: boolean;
  reducedMotion: boolean;
  userAgent: string;
}

export function readEnvironment(): EnvironmentInfo {
  const dpr = window.devicePixelRatio || 1;
  return {
    buildId: typeof __BUILD_ID__ === 'string' ? __BUILD_ID__ : 'dev',
    viewportCss: `${window.innerWidth} x ${window.innerHeight}`,
    screenPhysical: `${Math.round(window.screen.width * dpr)} x ${Math.round(
      window.screen.height * dpr,
    )}`,
    devicePixelRatio: dpr,
    containerQueries:
      typeof CSS !== 'undefined' && CSS.supports?.('container-type', 'inline-size') === true,
    reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    userAgent: navigator.userAgent,
  };
}

declare const __BUILD_ID__: string;
