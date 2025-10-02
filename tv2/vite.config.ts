import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'https://ai.play.tv2.no',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/u, ''),
      },
    },
  },
})
