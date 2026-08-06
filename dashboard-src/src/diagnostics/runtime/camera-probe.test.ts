import { describe, it, expect } from 'vitest';
import { sondarCameras } from './camera-probe';
import type { Hass } from '@/models/home-assistant';

function hassCom(estados: Record<string, { state: string; attributes?: Record<string, unknown> }>): Hass {
  const states: Record<string, unknown> = {};
  for (const [id, e] of Object.entries(estados)) {
    states[id] = { entity_id: id, state: e.state, attributes: e.attributes ?? {} };
  }
  return { states } as unknown as Hass;
}

describe('sondarCameras', () => {
  it('sem hass, não inventa nada', () => {
    const s = sondarCameras(undefined);
    expect(s.cameras).toEqual([]);
    expect(s.streamCarregado).toBe(false);
  });

  it('ignora entidades que não são câmera', () => {
    const s = sondarCameras(hassCom({ 'light.sala': { state: 'on' } }));
    expect(s.cameras).toHaveLength(0);
    expect(s.veredito).toMatch(/Nenhuma câmera/);
  });

  it('reconhece WebRTC pelo frontend_stream_type', () => {
    const s = sondarCameras(
      hassCom({
        'camera.a': { state: 'idle', attributes: { frontend_stream_type: 'web_rtc', supported_features: 2 } },
      }),
    );
    expect(s.cameras[0]?.caminho).toBe('web_rtc');
    expect(s.resumo.web_rtc).toBe(1);
    expect(s.veredito).toMatch(/WebRTC/);
  });

  it('reconhece HLS e avisa que a transcodificação é na VM', () => {
    const s = sondarCameras(
      hassCom({
        'camera.a': { state: 'idle', attributes: { frontend_stream_type: 'hls', supported_features: 2 } },
      }),
    );
    expect(s.cameras[0]?.caminho).toBe('hls');
    expect(s.veredito).toMatch(/transcodificação roda na VM/);
  });

  it('sem tipo publicado, é instantâneo', () => {
    const s = sondarCameras(hassCom({ 'camera.a': { state: 'idle' } }));
    expect(s.cameras[0]?.caminho).toBe('instantaneo');
    expect(s.cameras[0]?.suportaStream).toBe(false);
    expect(s.veredito).toMatch(/instantâneo é o único caminho/);
  });

  it('câmera fora do ar não conta como capacidade', () => {
    const s = sondarCameras(
      hassCom({
        'camera.a': { state: 'unavailable', attributes: { frontend_stream_type: 'hls' } },
      }),
    );
    expect(s.cameras[0]?.caminho).toBe('indisponivel');
    expect(s.resumo.hls).toBe(0);
  });

  it('lê o bit de stream em supported_features', () => {
    const s = sondarCameras(
      hassCom({
        'camera.com': { state: 'idle', attributes: { supported_features: 2 } },
        'camera.sem': { state: 'idle', attributes: { supported_features: 0 } },
      }),
    );
    expect(s.cameras.find((c) => c.entityId === 'camera.com')?.suportaStream).toBe(true);
    expect(s.cameras.find((c) => c.entityId === 'camera.sem')?.suportaStream).toBe(false);
    expect(s.streamCarregado).toBe(true);
  });

  it('ordena por id, para duas sondagens serem comparáveis', () => {
    const s = sondarCameras(
      hassCom({ 'camera.z': { state: 'idle' }, 'camera.a': { state: 'idle' } }),
    );
    expect(s.cameras.map((c) => c.entityId)).toEqual(['camera.a', 'camera.z']);
  });
});
