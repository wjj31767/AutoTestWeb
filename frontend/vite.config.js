import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        // 添加credentials配置，确保cookies被正确传递
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // 确保cookies被传递
            if (req.headers.cookie) {
              proxyReq.setHeader('cookie', req.headers.cookie);
            }
          });
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: './vitest.setup.js',
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{vue,js}'],
      exclude: ['src/main.js', 'src/router/index.js', 'src/App.vue']
    }
  },
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})