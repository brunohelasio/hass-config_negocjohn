type LazyConfig = { type?: string; card?: LazyConfig; cards?: LazyConfig[] };

type BrunoLazyApi = { ensureForConfig: (config: LazyConfig | undefined) => Promise<void> };

const loaders: Record<string, () => Promise<unknown>> = {
  'custom:bruno-room-subview': () => import('./components/rooms/bruno-room-subview'),
  'custom:bruno-cameras-security-subview': () => import('../../config/www/bruno-ui/subviews/bruno-cameras-security-subview.js'),
  'custom:bruno-roborock-subview': () => import('../../config/www/bruno-ui/subviews/bruno-roborock-subview.js'),
  'custom:bruno-planta-3d-subview': () => import('../../config/www/bruno-ui/subviews/bruno-planta-3d-subview.js'),
  'custom:bruno-music-subview': () => import('../../config/www/bruno-ui/subviews/bruno-music-subview.js'),
};

const pending = new Map<string, Promise<unknown>>();

async function ensureType(type: string | undefined): Promise<void> {
  if (!type || !loaders[type]) return;
  let task = pending.get(type);
  if (!task) {
    task = loaders[type]();
    pending.set(type, task);
  }
  await task;
}

async function ensureForConfig(config: LazyConfig | undefined): Promise<void> {
  if (!config) return;
  await ensureType(config.type);
  if (config.card) await ensureForConfig(config.card);
  if (Array.isArray(config.cards)) await Promise.all(config.cards.map(ensureForConfig));
}

(globalThis as typeof globalThis & { BrunoLazyModules?: BrunoLazyApi }).BrunoLazyModules = { ensureForConfig };
