import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  assinantesDoRelogio,
  assinarRelogio,
  pararRelogio,
  relogioAtivo,
} from './clock';

/**
 * `document` mínimo.
 *
 * Os testes rodam em Node, sem DOM — e o projeto não carrega jsdom. O relógio
 * só precisa de duas coisas do documento: `visibilityState` e o evento
 * `visibilitychange`. O `EventTarget` do próprio Node entrega a segunda; a
 * primeira é um campo. Um DOM inteiro para testar isto seria peso sem retorno.
 */
class DocumentoFalso extends EventTarget {
  visibilityState: 'visible' | 'hidden' = 'visible';
}

let doc: DocumentoFalso;

function instalarDocumento(): void {
  doc = new DocumentoFalso();
  (globalThis as { document?: unknown }).document = doc;
}

function removerDocumento(): void {
  delete (globalThis as { document?: unknown }).document;
}

/** Finge a aba oculta/visível e dispara o evento, como o navegador faria. */
function visibilidade(valor: 'visible' | 'hidden'): void {
  doc.visibilityState = valor;
  doc.dispatchEvent(new Event('visibilitychange'));
}

describe('relógio central', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    instalarDocumento();
  });

  afterEach(() => {
    pararRelogio();
    removerDocumento();
    vi.useRealTimers();
  });

  it('sem assinante não existe timer', () => {
    expect(relogioAtivo()).toBe(false);
  });

  it('o primeiro assinante liga o timer', () => {
    assinarRelogio(() => {});
    expect(relogioAtivo()).toBe(true);
    expect(assinantesDoRelogio()).toBe(1);
  });

  it('dez assinantes, um timer só', () => {
    const cancelar = Array.from({ length: 10 }, () => assinarRelogio(() => {}));
    expect(assinantesDoRelogio()).toBe(10);
    expect(relogioAtivo()).toBe(true);
    for (const c of cancelar) c();
  });

  it('bate em todos os assinantes a cada segundo', () => {
    const a = vi.fn();
    const b = vi.fn();
    assinarRelogio(a);
    assinarRelogio(b);

    vi.advanceTimersByTime(3000);
    expect(a).toHaveBeenCalledTimes(3);
    expect(b).toHaveBeenCalledTimes(3);
  });

  it('o último cancelamento destrói o timer', () => {
    const cancelarA = assinarRelogio(() => {});
    const cancelarB = assinarRelogio(() => {});
    cancelarA();
    expect(relogioAtivo()).toBe(true);
    cancelarB();
    expect(relogioAtivo()).toBe(false);
    expect(assinantesDoRelogio()).toBe(0);
  });

  it('cancelar duas vezes não derruba a contagem de outro assinante', () => {
    const cancelar = assinarRelogio(() => {});
    assinarRelogio(() => {});
    cancelar();
    cancelar();
    expect(assinantesDoRelogio()).toBe(1);
    expect(relogioAtivo()).toBe(true);
  });

  it('assinante que lança não impede a batida dos outros', () => {
    const bom = vi.fn();
    assinarRelogio(() => {
      throw new Error('quebrou');
    });
    assinarRelogio(bom);

    vi.advanceTimersByTime(1000);
    expect(bom).toHaveBeenCalledTimes(1);
  });

  it('cancelar durante a própria batida não quebra a iteração', () => {
    const depois = vi.fn();
    const cancelar = assinarRelogio(() => cancelar());
    assinarRelogio(depois);

    vi.advanceTimersByTime(1000);
    expect(depois).toHaveBeenCalledTimes(1);
    expect(assinantesDoRelogio()).toBe(1);
  });

  it('aba oculta desliga o timer', () => {
    const fn = vi.fn();
    assinarRelogio(fn);
    visibilidade('hidden');

    expect(relogioAtivo()).toBe(false);
    vi.advanceTimersByTime(5000);
    expect(fn).not.toHaveBeenCalled();
  });

  it('voltar à tona atualiza na hora e retoma', () => {
    const fn = vi.fn();
    assinarRelogio(fn);
    visibilidade('hidden');
    vi.advanceTimersByTime(60_000);

    visibilidade('visible');
    expect(fn).toHaveBeenCalledTimes(1); // a batida imediata, sem esperar 1s
    expect(relogioAtivo()).toBe(true);

    vi.advanceTimersByTime(1000);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('assinar com a aba oculta não cria timer', () => {
    visibilidade('hidden');
    assinarRelogio(() => {});
    expect(relogioAtivo()).toBe(false);
  });

  it('voltar à tona sem assinante não liga nada', () => {
    visibilidade('hidden');
    visibilidade('visible');
    expect(relogioAtivo()).toBe(false);
  });
});
