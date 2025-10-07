import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    vue()
  ],
  test: {
    // 使用jsdom作为测试环境
    environment: 'jsdom',
    // 启用TypeScript支持
    typecheck: {
      enabled: true,
      tsconfig: 'tsconfig.json'
    },
    // 模块解析配置
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    // 依赖处理
    deps: {
      // 内联@vue/test-utils以避免版本冲突
      inline: ['@vue/test-utils'],
      // 排除Jest相关的依赖，避免冲突
      external: [
        '@vue/vue3-jest',
        'babel-jest',
        'jest',
        'jest-environment-jsdom',
        'jest-serializer-vue',
        'ts-jest'
      ]
    },
    // 测试覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov']
    },
    // 测试文件匹配模式
    include: ['src/**/*.spec.js', 'src/**/*.test.js'],
    // 快照路径配置
    resolveSnapshotPath: (testPath, extension) => {
      return testPath + extension
    },
    // 输出配置，确保能看到详细的错误信息
    outputFile: {
      junit: './test-results/junit.xml'
    },
    // 确保测试在遇到第一个错误时不会立即退出
    failFast: false
  }
})