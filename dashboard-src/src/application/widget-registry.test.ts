import { beforeEach, describe, expect, it } from 'vitest';
import {
  ajustarArea,
  areasColidem,
  criarWidget,
  entidadesDoWidget,
  validarWidgets,
  widgetRegistry,
  type WidgetDefinition,
  type WidgetInstance,
} from './widget-registry';
import { HostDeTeste } from './host-adapter';

// Os testes rodam em ambiente node: nao ha DOM. O registry so precisa que a
// definicao DEVOLVA um elemento — ele nunca o inspeciona. Um duplo com a
// forma minima evita arrastar jsdom para uma suite que nao renderiza nada.
function elementoFalso(tag = 'DIV'): HTMLElement {
  return { tagName: tag } as unknown as HTMLElement;
}

function definicao(parcial: Partial<WidgetDefinition> & { type: string }): WidgetDefinition {
  return {
    label: parcial.type,
    create: () => elementoFalso(),
    ...parcial,
  };
}

beforeEach(() => {
  widgetRegistry.limpar();
});

describe('registro', () => {
  it('registra e recupera pelo tipo', () => {
    widgetRegistry.registrar(definicao({ type: 'luz' }));
    expect(widgetRegistry.conhece('luz')).toBe(true);
    expect(widgetRegistry.obter('luz')?.label).toBe('luz');
    expect(widgetRegistry.tipos()).toEqual(['luz']);
  });

  it('registrar o mesmo tipo duas vezes e ERRO, nao aviso', () => {
    // Dois widgets disputando o mesmo nome renderizariam de forma imprevisivel.
    widgetRegistry.registrar(definicao({ type: 'luz' }));
    expect(() => widgetRegistry.registrar(definicao({ type: 'luz' }))).toThrow(/ja registrado/);
  });

  it('agrupa o catalogo por categoria, com Geral como padrao', () => {
    widgetRegistry.registrar(definicao({ type: 'luz', categoria: 'Ambiente' }));
    widgetRegistry.registrar(definicao({ type: 'ac', categoria: 'Ambiente' }));
    widgetRegistry.registrar(definicao({ type: 'nota' }));

    const cat = widgetRegistry.catalogo();
    expect(cat.map((c) => c.categoria)).toEqual(['Ambiente', 'Geral']);
    expect(cat[0]?.itens.map((i) => i.type)).toEqual(['luz', 'ac']);
  });
});

describe('criacao', () => {
  it('cria passando a instancia e o host', () => {
    const host = new HostDeTeste();
    let recebido: { inst?: WidgetInstance; mesmoHost?: boolean } = {};
    widgetRegistry.registrar(
      definicao({
        type: 'luz',
        create: (inst, h) => {
          recebido = { inst, mesmoHost: h === host };
          return elementoFalso('SPAN');
        },
      }),
    );

    const el = criarWidget({ id: 'a', type: 'luz' }, host);
    expect(el?.tagName).toBe('SPAN');
    expect(recebido.inst?.id).toBe('a');
    expect(recebido.mesmoHost).toBe(true);
  });

  it('tipo desconhecido devolve undefined em vez de quebrar', () => {
    expect(criarWidget({ id: 'a', type: 'fantasma' }, new HostDeTeste())).toBeUndefined();
  });

  it('entidades observadas vem da definicao; tipo desconhecido devolve vazio', () => {
    widgetRegistry.registrar(
      definicao({ type: 'luz', entities: (i) => [String(i.config?.['entity'] ?? '')] }),
    );
    expect(entidadesDoWidget({ id: 'a', type: 'luz', config: { entity: 'light.sala' } })).toEqual([
      'light.sala',
    ]);
    expect(entidadesDoWidget({ id: 'b', type: 'fantasma' })).toEqual([]);
  });
});

describe('area', () => {
  it('ajustarArea aplica minimos, maximos e arredonda', () => {
    const a = ajustarArea(
      { coluna: 1.6, linha: 2.4, colunas: 9, linhas: 0 },
      { minColunas: 2, maxColunas: 6, minLinhas: 1, maxLinhas: 4 },
    );
    expect(a).toEqual({ coluna: 2, linha: 2, colunas: 6, linhas: 1 });
  });

  it('coluna e linha nunca ficam abaixo de 1', () => {
    expect(ajustarArea({ coluna: -3, linha: 0, colunas: 1, linhas: 1 })).toEqual({
      coluna: 1,
      linha: 1,
      colunas: 1,
      linhas: 1,
    });
  });

  it('areas encostadas NAO colidem', () => {
    const a = { coluna: 1, linha: 1, colunas: 2, linhas: 1 };
    const b = { coluna: 3, linha: 1, colunas: 2, linhas: 1 };
    expect(areasColidem(a, b)).toBe(false);
  });

  it('areas sobrepostas colidem, em qualquer ordem', () => {
    const a = { coluna: 1, linha: 1, colunas: 3, linhas: 2 };
    const b = { coluna: 2, linha: 2, colunas: 2, linhas: 2 };
    expect(areasColidem(a, b)).toBe(true);
    expect(areasColidem(b, a)).toBe(true);
  });
});

describe('validacao', () => {
  beforeEach(() => {
    widgetRegistry.registrar(definicao({ type: 'luz' }));
  });

  it('aceita lista valida fora de grade', () => {
    const r = validarWidgets([
      { id: 'a', type: 'luz' },
      { id: 'b', type: 'luz' },
    ]);
    expect(r.ok).toBe(true);
  });

  it('acusa id faltando, id repetido e tipo nao registrado', () => {
    const r = validarWidgets([
      { id: '', type: 'luz' },
      { id: 'a', type: 'luz' },
      { id: 'a', type: 'luz' },
      { id: 'c', type: 'fantasma' },
    ]);
    expect(r.ok).toBe(false);
    expect(r.erros.some((e) => e.includes('falta "id"'))).toBe(true);
    expect(r.erros.some((e) => e.includes('id repetido'))).toBe(true);
    expect(r.erros.some((e) => e.includes('nao registrado'))).toBe(true);
  });

  it('devolve TODOS os erros, nao o primeiro', () => {
    // Quem edita configuracao a mao precisa da lista inteira numa passada.
    const r = validarWidgets([
      { id: '', type: '' },
      { id: 'x', type: 'fantasma' },
    ]);
    expect(r.erros.length).toBeGreaterThanOrEqual(3);
  });

  it('em grade, area passa a ser obrigatoria', () => {
    const r = validarWidgets([{ id: 'a', type: 'luz' }], { emGrade: true });
    expect(r.ok).toBe(false);
    expect(r.erros.some((e) => e.includes('falta "area"'))).toBe(true);
  });

  it('em grade, acusa sobreposicao entre widgets', () => {
    const r = validarWidgets(
      [
        { id: 'a', type: 'luz', area: { coluna: 1, linha: 1, colunas: 3, linhas: 2 } },
        { id: 'b', type: 'luz', area: { coluna: 2, linha: 1, colunas: 2, linhas: 1 } },
      ],
      { emGrade: true },
    );
    expect(r.ok).toBe(false);
    expect(r.erros.some((e) => e.includes('se sobrepoem'))).toBe(true);
  });

  it('em grade, acusa quem ultrapassa a borda direita', () => {
    const r = validarWidgets(
      [{ id: 'a', type: 'luz', area: { coluna: 10, linha: 1, colunas: 4, linhas: 1 } }],
      { emGrade: true, colunas: 12 },
    );
    expect(r.ok).toBe(false);
    expect(r.erros.some((e) => e.includes('borda direita'))).toBe(true);
  });

  it('fora de grade, area ausente e sobreposicao NAO sao erro', () => {
    const r = validarWidgets([
      { id: 'a', type: 'luz', area: { coluna: 1, linha: 1, colunas: 3, linhas: 2 } },
      { id: 'b', type: 'luz', area: { coluna: 1, linha: 1, colunas: 3, linhas: 2 } },
    ]);
    expect(r.ok).toBe(true);
  });

  it('delega a validacao especifica do tipo', () => {
    widgetRegistry.registrar(
      definicao({
        type: 'camera',
        validate: (i) =>
          i.config?.['entity']
            ? { ok: true, erros: [] }
            : { ok: false, erros: [`camera "${i.id}": falta entidade`] },
      }),
    );
    const r = validarWidgets([{ id: 'c1', type: 'camera' }]);
    expect(r.ok).toBe(false);
    expect(r.erros).toContain('camera "c1": falta entidade');
  });
});
