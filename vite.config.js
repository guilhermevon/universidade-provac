import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Torna o servidor acessível a partir de outros dispositivos na rede local
    port: 4000, // Define a porta do servidor Vite
    strictPort: true, // Garante que o Vite use exatamente a porta definida
    open: true, // Abre o navegador automaticamente ao iniciar o servidor
    hmr: {
      overlay: true, // Mostra uma sobreposição de erro se algo der errado com o Hot Module Replacement
    },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist', // Define o diretório de saída para os arquivos de build
    sourcemap: true, // Gera mapas de origem para facilitar a depuração
    minify: 'esbuild', // Minifica o código usando esbuild
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log em produção
      },
    },
  },
});
