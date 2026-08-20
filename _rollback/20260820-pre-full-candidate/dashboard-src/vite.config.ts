import { defineConfig } from 'vite';
import { resolve } from 'node:path';

// Identificador de build visível no painel de diagnóstico.
//
// Só a DATA, de propósito. Como ele é embutido no bundle via `define`, ele entra
// no hash do conteúdo — se incluísse hora e minuto, todo build geraria um nome
// novo mesmo sem mudança de código, e a linha em configuration.yaml precisaria
// ser editada à toa. Com data, o hash só muda quando o código muda.
const BUILD_ID = new Date().toISOString().slice(0, 10).replace(/-/g, '');

export default defineConfig({
  resolve: {
    alias: { '@': resolve(import.meta.dirname, 'src') },
  },

  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },

  build: {
    // Publica direto na pasta que o Home Assistant serve como /local/dashboard/.
    outDir: resolve(import.meta.dirname, '../config/www/dashboard'),
    emptyOutDir: true,
    target: 'es2022', // WebView do tablet = Chrome 150; sem transpilar para trás
    sourcemap: true,
    lib: {
      entry: resolve(import.meta.dirname, 'src/main.ts'),
      formats: ['es'],
      // Hash no nome do arquivo: elimina o cache-bust manual por `?v=`.
      fileName: () => `bruno-dashboard.[hash].js`,
    },
    rollupOptions: {
      output: {
        // Um bundle só. O projeto atual faz 52 requisições separadas no cold
        // start do tablet — este é o principal ganho de carregamento.
        inlineDynamicImports: true,
        entryFileNames: 'bruno-dashboard.[hash].js',
      },
    },
  },

  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
