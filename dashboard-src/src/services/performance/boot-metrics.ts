type BootMark = {
  at: number;
  sinceNavigation: number;
};

type BootMetrics = {
  version: 1;
  navigationStart: number;
  moduleStart: BootMark;
  shellDefined?: BootMark;
  shellConnected?: BootMark;
  homeVisible?: BootMark;
  windowLoad?: BootMark;
  resources?: {
    count: number;
    totalDuration: number;
    transferSize: number;
  };
};

const NAV_START = performance.timeOrigin || Date.now() - performance.now();
const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
const relative = (): number => Math.round(performance.now());
const mark = (): BootMark => ({
  at: Date.now(),
  sinceNavigation: relative(),
});

const metrics: BootMetrics = {
  version: 1,
  navigationStart: Math.round(NAV_START),
  moduleStart: mark(),
};

function summarizeResources(): void {
  const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  metrics.resources = {
    count: resources.length,
    totalDuration: Math.round(resources.reduce((sum, item) => sum + item.duration, 0)),
    transferSize: resources.reduce((sum, item) => sum + (item.transferSize || 0), 0),
  };
}

function persist(): void {
  summarizeResources();
  try {
    globalThis.localStorage?.setItem('bruno-ui:last-boot-metrics', JSON.stringify(metrics));
  } catch {
    // WebViews privados podem recusar storage; a copia em memoria continua disponivel.
  }
  (globalThis as typeof globalThis & { brunoBootMetrics?: BootMetrics }).brunoBootMetrics = metrics;
}

customElements.whenDefined('bruno-shell').then(() => {
  metrics.shellDefined = mark();
  persist();
});

const probeHome = (): void => {
  const shell = document.querySelector('bruno-shell') as HTMLElement | null;
  if (shell && !metrics.shellConnected) metrics.shellConnected = mark();
  const root = shell?.shadowRoot;
  const content = root?.querySelector<HTMLElement>('#content');
  if (content?.dataset.section === 'home' && content.children.length > 0) {
    metrics.homeVisible = mark();
    persist();
    return;
  }
  if (performance.now() < 120_000) window.setTimeout(probeHome, 100);
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', probeHome, { once: true });
} else {
  probeHome();
}

globalThis.addEventListener('load', () => {
  metrics.windowLoad = mark();
  persist();
}, { once: true });

persist();
