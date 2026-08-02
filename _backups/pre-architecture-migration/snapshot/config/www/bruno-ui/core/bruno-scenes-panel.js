(() => {
  const SCENES = [
    { key: 'bom-dia', title: 'Bom dia', subtitle: 'Abrir a cortina', entity: 'script.bruno_scene_bom_dia', image: '/local/bruno-ui/assets/scenes/bom-dia.webp' },
    { key: 'cheguei', title: 'Cheguei', subtitle: 'Corredor e sala', entity: 'script.bruno_scene_cheguei', image: '/local/bruno-ui/assets/scenes/cheguei.webp' },
    { key: 'sair-de-casa', title: 'Sair de casa', subtitle: 'Desligar e proteger', entity: 'script.bruno_scene_sair_de_casa', image: '/local/bruno-ui/assets/scenes/sair-de-casa.webp' },
    { key: 'boa-noite', title: 'Boa noite', subtitle: 'Casa segura para dormir', entity: 'script.bruno_scene_boa_noite', image: '/local/bruno-ui/assets/scenes/boa-noite.webp' },
    { key: 'cinema', title: 'Cinema', subtitle: 'Sala pronta para assistir', entity: 'script.bruno_scene_cinema', image: '/local/bruno-ui/assets/scenes/cinema.webp' },
    { key: 'relaxar', title: 'Relaxar', subtitle: 'Luz suave na varanda', entity: 'script.bruno_scene_relaxar', image: '/local/bruno-ui/assets/scenes/relaxar.webp' },
    { key: 'receber', title: 'Receber', subtitle: 'Iluminacao social', entity: 'script.bruno_scene_receber', image: '/local/bruno-ui/assets/scenes/receber.webp' },
    { key: 'trabalho', title: 'Trabalho', subtitle: 'Office pronto para usar', entity: 'script.bruno_scene_trabalho', image: '/local/bruno-ui/assets/scenes/trabalho.webp' },
  ];

  const escape = (value) => String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  const render = () => `
    <div class="config-scrim" data-scenes-action="close"></div>
    <section class="config-panel scenes-panel" role="dialog" aria-modal="true" aria-label="Cenas">
      <header class="config-header">
        <span class="config-icon scenes-panel-icon" aria-hidden="true">
          ${globalThis.BrunoIcons?.render('scenes') || ''}
        </span>
        <div class="config-title">
          <strong>Cenas</strong>
          <span>Atmosferas da residencia</span>
        </div>
        <button class="config-close" type="button" data-scenes-action="close" aria-label="Fechar">&times;</button>
      </header>
      <div class="scenes-scroll" role="list">
        ${SCENES.map((scene) => `
          <button
            class="scene-banner"
            type="button"
            role="listitem"
            data-scenes-action="activate"
            data-scene-entity="${escape(scene.entity)}"
            aria-label="Ativar cena ${escape(scene.title)}"
          >
            <img src="${escape(scene.image)}" alt="" decoding="async" loading="eager">
            <span class="scene-banner-shade" aria-hidden="true"></span>
            <span class="scene-banner-copy">
              <strong>${escape(scene.title)}</strong>
              <small>${escape(scene.subtitle)}</small>
            </span>
            <span class="scene-banner-state" aria-live="polite"></span>
          </button>
        `).join('')}
      </div>
    </section>
    <style>
      .scenes-panel {
        width: min(430px, calc(100vw - 124px));
        max-height: min(720px, calc(100vh - 104px));
        display: grid;
        grid-template-rows: auto minmax(0, 1fr);
      }
      .scenes-panel-icon svg { fill: none; stroke: currentColor; }
      .scenes-scroll {
        min-height: 0;
        display: grid;
        gap: 4px;
        padding: 0 10px 10px;
        overflow-y: auto;
        overscroll-behavior: contain;
        scrollbar-width: thin;
        scrollbar-color: rgba(255,255,255,0.25) transparent;
      }
      .scene-banner {
        appearance: none;
        -webkit-appearance: none;
        position: relative;
        width: 100%;
        height: 92px;
        min-height: 92px;
        margin: 0;
        padding: 0;
        overflow: hidden;
        border: var(--bruno-popup-banner-border, 1px solid rgba(255,255,255,0.10));
        border-radius: var(--bruno-popup-banner-radius, var(--bruno-liquid-card-radius-compact, 14px));
        background: rgba(10,12,16,0.34);
        box-shadow: var(--bruno-popup-banner-shadow, none);
        color: rgba(255,255,255,0.94);
        cursor: pointer;
        text-align: center;
        touch-action: manipulation;
        transform: translateZ(0);
        transition: transform 150ms ease, border-color 150ms ease, filter 150ms ease;
      }
      .scene-banner:active,
      .scene-banner.is-running { transform: scale(0.985); }
      .scene-banner:focus-visible { outline: 2px solid rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.72); outline-offset: 1px; }
      .scene-banner img {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        filter: saturate(0.88) brightness(0.74);
        transform: scale(1.015);
      }
      .scene-banner-shade {
        position: absolute;
        inset: 0;
        background: linear-gradient(90deg, rgba(5,7,10,0.36), rgba(5,7,10,0.14) 46%, rgba(5,7,10,0.34));
      }
      .scene-banner-copy {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        padding: 12px 18px;
        text-shadow: 0 2px 14px rgba(0,0,0,0.78);
      }
      .scene-banner-copy strong { font-size: 17px; line-height: 1.08; font-weight: 690; }
      .scene-banner-copy small { font-size: 10px; line-height: 1; font-weight: 620; color: rgba(255,255,255,0.67); }
      .scene-banner-state {
        position: absolute;
        right: 11px;
        bottom: 9px;
        font-size: 9px;
        font-weight: 760;
        color: rgba(var(--bruno-liquid-warm-accent, 255,214,10),0.92);
      }
      @media (max-width: 800px) {
        .scenes-panel {
          left: 12px;
          right: 12px;
          bottom: 64px;
          width: auto;
          max-height: calc(100vh - 88px);
        }
        .scene-banner { height: 84px; min-height: 84px; }
      }
    </style>
  `;

  const handleAction = async ({ target, hass, host }) => {
    const action = target?.dataset?.scenesAction;
    if (action === 'close') {
      host?._closeConfigPanel?.();
      return;
    }
    if (action !== 'activate' || !hass || target.disabled) return;
    const entityId = target.dataset.sceneEntity;
    if (!entityId) return;
    target.disabled = true;
    target.classList.add('is-running');
    const state = target.querySelector('.scene-banner-state');
    if (state) state.textContent = 'Ativando';
    try {
      await hass.callService('script', 'turn_on', {}, { entity_id: entityId });
      if (state) state.textContent = 'Ativada';
      globalThis.setTimeout?.(() => host?._closeConfigPanel?.(), 420);
    } catch (error) {
      if (state) state.textContent = 'Falha';
      target.disabled = false;
      target.classList.remove('is-running');
    }
  };

  globalThis.BrunoScenesPanel = Object.freeze({ scenes: SCENES, render, handleAction });
})();
