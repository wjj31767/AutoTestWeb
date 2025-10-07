// Jest setup文件，在测试运行之前执行
const Vue = require('vue')

// 在全局作用域中设置Vue对象和所有必要的组件
globalThis.Vue = Vue

// 尝试导入并设置VueCompilerDOM（Vue 3编译器DOM）
try {
  const compilerDOM = require('@vue/compiler-dom')
  // 在Vue 3中，VueCompilerDOM不是一个导出的命名变量，而是整个编译器对象
  globalThis.VueCompilerDOM = compilerDOM
} catch (error) {
  console.warn('Failed to load @vue/compiler-dom:', error)
}

// 尝试导入并设置VueServerRenderer
try {
  const serverRenderer = require('@vue/server-renderer')
  globalThis.VueServerRenderer = serverRenderer
} catch (error) {
  console.warn('Failed to load @vue/server-renderer:', error)
}