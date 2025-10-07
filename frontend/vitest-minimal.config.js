import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    deps: {
      inline: ['@vue/test-utils']
    },
    resolveSnapshotPath: (testPath, extension) => {
      return testPath + extension
    }
  }
})