/**
 * Carregador estável do bundle (Fase 6.0.4).
 *
 * ORIGEM: este arquivo. É copiado para `config/www/dashboard/` pelo passo
 * `npm run manifesto`, que roda depois do build. Não editar a cópia — o
 * `vite build` limpa aquele diretório e a apagaria.
 *
 * O PROBLEMA que ele resolve: o bundle sai do Vite com hash de conteúdo no
 * nome, e o `frontend.extra_module_url` apontava para esse nome. Toda troca de
 * bundle exigia editar o `configuration.yaml` e **reiniciar o Home Assistant** —
 * e o reinício do HA é o evento que se correlacionou três vezes com o Corredor
 * quebrando.
 *
 * A SOLUÇÃO: o `extra_module_url` passa a apontar para este arquivo, cujo nome
 * nunca muda. Ele lê `manifest.json` e importa o bundle com hash. Publicar uma
 * versão nova passa a ser: copiar o `.js` novo e o manifesto.
 * **Recarregar a página basta.**
 *
 *   extra_module_url  ->  bruno-loader.js   (nome estável, o HA pode cachear)
 *                              |
 *                              v
 *                         manifest.json     (sempre da rede)
 *                              |
 *                              v
 *                   bruno-dashboard.<hash>.js
 *
 * O manifesto é buscado com `cache: 'no-store'`: ele é pequeno e precisa ser
 * sempre o da rede, senão o carregador ficaria preso na versão antiga — que é
 * exatamente o problema que ele veio resolver. O bundle, esse sim, pode ficar
 * em cache: o hash no nome garante que cache velho nunca é o errado.
 *
 * ROLLBACK: no `configuration.yaml`, comentar a linha do loader e descomentar a
 * linha direta do bundle com hash. Nada mais depende dele.
 */

(() => {
  const BASE = '/local/dashboard/';
  const MANIFESTO = BASE + 'manifest.json';

  /** Última leitura e último erro, para o painel de diagnóstico poder mostrar. */
  const estado = { manifesto: null, bundle: null, erro: null };
  globalThis.brunoLoader = estado;

  const carregar = async () => {
    let dados;
    try {
      const resposta = await fetch(MANIFESTO, { cache: 'no-store' });
      if (!resposta.ok) throw new Error('manifest.json: HTTP ' + resposta.status);
      dados = await resposta.json();
    } catch (erro) {
      estado.erro = 'Nao foi possivel ler o manifesto: ' + (erro && erro.message);
      console.error('[bruno-loader]', estado.erro);
      return;
    }

    const arquivo = dados && dados.bundle;
    if (typeof arquivo !== 'string' || !arquivo) {
      estado.erro = 'manifest.json sem a chave "bundle"';
      console.error('[bruno-loader]', estado.erro);
      return;
    }

    estado.manifesto = dados;
    estado.bundle = arquivo;

    try {
      // Import dinâmico: o navegador resolve, busca e executa o módulo — o mesmo
      // caminho que o `extra_module_url` usaria, sem depender do nome fixo.
      await import(BASE + arquivo);
      console.info('[bruno-loader] bundle carregado: ' + arquivo);
    } catch (erro) {
      estado.erro = 'Falha ao importar ' + arquivo + ': ' + (erro && erro.message);
      console.error('[bruno-loader]', estado.erro);
    }
  };

  carregar();
})();
