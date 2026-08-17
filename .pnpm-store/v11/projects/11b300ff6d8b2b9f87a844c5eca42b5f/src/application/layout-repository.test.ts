import { beforeEach, describe, expect, it } from 'vitest';
import {
  ArmazenamentoEmMemoria,
  ArmazenamentoLocal,
  ErroDeLayout,
  LayoutRepository,
  VERSAO_DO_LAYOUT,
  layoutDaConfiguracao,
  limparMigracoes,
  registrarMigracao,
} from './layout-repository';

beforeEach(() => {
  limparMigracoes();
});

describe('ciclo de leitura e escrita', () => {
  it('salvar e ler devolve os mesmos widgets', async () => {
    const repo = new LayoutRepository(new ArmazenamentoEmMemoria());
    await repo.salvar({
      superficie: 'sala',
      versao: VERSAO_DO_LAYOUT,
      colunas: 12,
      widgets: [{ id: 'a', type: 'luz', area: { coluna: 1, linha: 1, colunas: 3, linhas: 2 } }],
    });

    const lido = await repo.ler('sala');
    expect(lido?.colunas).toBe(12);
    expect(lido?.widgets).toHaveLength(1);
    expect(lido?.widgets[0]?.id).toBe('a');
  });

  it('salvar carimba a versao desta build e a data', async () => {
    const loja = new ArmazenamentoEmMemoria();
    const repo = new LayoutRepository(loja);
    await repo.salvar({ superficie: 'home', versao: 0, widgets: [] });

    const doc = JSON.parse(loja.ler('home')!) as Record<string, unknown>;
    expect(doc['versao']).toBe(VERSAO_DO_LAYOUT);
    expect(typeof doc['salvoEm']).toBe('string');
  });

  it('superficie nunca salva devolve undefined', async () => {
    const repo = new LayoutRepository(new ArmazenamentoEmMemoria());
    expect(await repo.ler('nunca-tocada')).toBeUndefined();
  });

  it('salvo VAZIO e diferente de nunca salvo', async () => {
    // O primeiro caso e escolha do usuario e tem de ser respeitado; o segundo
    // manda usar o padrao da configuracao.
    const repo = new LayoutRepository(new ArmazenamentoEmMemoria());
    await repo.salvar({ superficie: 'sala', versao: VERSAO_DO_LAYOUT, widgets: [] });

    const lido = await repo.ler('sala');
    expect(lido).toBeDefined();
    expect(lido?.widgets).toEqual([]);
  });

  it('restaurarPadrao apaga, nao grava vazio', async () => {
    const repo = new LayoutRepository(new ArmazenamentoEmMemoria());
    await repo.salvar({ superficie: 'sala', versao: VERSAO_DO_LAYOUT, widgets: [] });
    await repo.restaurarPadrao('sala');
    expect(await repo.ler('sala')).toBeUndefined();
  });

  it('lista as superficies salvas', async () => {
    const repo = new LayoutRepository(new ArmazenamentoEmMemoria());
    await repo.salvar({ superficie: 'home', versao: VERSAO_DO_LAYOUT, widgets: [] });
    await repo.salvar({ superficie: 'sala', versao: VERSAO_DO_LAYOUT, widgets: [] });
    expect([...(await repo.superficies())].sort()).toEqual(['home', 'sala']);
  });
});

describe('versao e migracao', () => {
  it('documento ilegivel vira erro nomeado, nao SyntaxError cru', async () => {
    const loja = new ArmazenamentoEmMemoria();
    loja.escrever('sala', '{isto nao e json');
    const repo = new LayoutRepository(loja);
    await expect(repo.ler('sala')).rejects.toBeInstanceOf(ErroDeLayout);
  });

  it('documento sem versao valida e recusado', async () => {
    const loja = new ArmazenamentoEmMemoria();
    loja.escrever('sala', JSON.stringify({ widgets: [] }));
    const repo = new LayoutRepository(loja);
    await expect(repo.ler('sala')).rejects.toThrow(/sem versao valida/);
  });

  it('versao FUTURA e recusada em vez de aplicada pela metade', async () => {
    // Um layout escrito por build mais nova pode ter campos que esta nao
    // entende; abrir pela metade perderia trabalho do usuario.
    const loja = new ArmazenamentoEmMemoria();
    loja.escrever('sala', JSON.stringify({ versao: VERSAO_DO_LAYOUT + 5, widgets: [] }));
    const repo = new LayoutRepository(loja);
    await expect(repo.ler('sala')).rejects.toThrow(/esta build entende ate/);
  });

  it('versao abaixo de 1 e recusada', async () => {
    const loja = new ArmazenamentoEmMemoria();
    loja.escrever('sala', JSON.stringify({ versao: 0.5, widgets: [] }));
    const repo = new LayoutRepository(loja);
    await expect(repo.ler('sala')).rejects.toThrow(/sem versao valida/);
  });

  it('documento ja na versao atual passa sem migracao', async () => {
    // Com VERSAO_DO_LAYOUT = 1 nao existe formato anterior real para migrar.
    // O que da para afirmar hoje e que o laco de migracao nao interfere quando
    // o documento ja esta na versao corrente. O encadeamento propriamente dito
    // ganha teste quando houver a versao 2 — antes disso seria teste de mentira.
    const loja = new ArmazenamentoEmMemoria();
    loja.escrever(
      'sala',
      JSON.stringify({ versao: 1, widgets: [{ id: 'a', type: 'luz' }] }),
    );
    const repo = new LayoutRepository(loja);
    const lido = await repo.ler('sala');
    expect(lido?.versao).toBe(VERSAO_DO_LAYOUT);
    expect(lido?.widgets[0]?.id).toBe('a');
  });

  it('registrar duas migracoes para o mesmo salto e erro', () => {
    registrarMigracao(1, (d) => d);
    expect(() => registrarMigracao(1, (d) => d)).toThrow(/ja registrada/);
  });
});

describe('ArmazenamentoLocal', () => {
  // Ambiente node nao tem localStorage. O duplo abaixo tem so o que a classe
  // usa, e serve tambem para provar que o prefixo isola as chaves.
  beforeEach(() => {
    const dados = new Map<string, string>();
    (globalThis as { localStorage?: unknown }).localStorage = {
      getItem: (k: string) => dados.get(k) ?? null,
      setItem: (k: string, v: string) => void dados.set(k, v),
      removeItem: (k: string) => void dados.delete(k),
      key: (i: number) => [...dados.keys()][i] ?? null,
      get length() { return dados.size; },
    };
  });

  it('usa prefixo proprio e lista so as chaves dele', () => {
    const loja = new ArmazenamentoLocal('teste:');
    loja.escrever('sala', '{}');
    globalThis.localStorage?.setItem('outro:coisa', 'x');

    expect(loja.ler('sala')).toBe('{}');
    expect([...loja.chaves()]).toEqual(['sala']);

    loja.remover('sala');
    expect(loja.ler('sala')).toBeUndefined();
    globalThis.localStorage?.removeItem('outro:coisa');
  });
});

describe('layoutDaConfiguracao', () => {
  it('monta o padrao de quem nunca editou nada', () => {
    const l = layoutDaConfiguracao('home', [{ id: 'a', type: 'luz' }], 12);
    expect(l).toEqual({
      superficie: 'home',
      versao: VERSAO_DO_LAYOUT,
      colunas: 12,
      widgets: [{ id: 'a', type: 'luz' }],
    });
  });
});
