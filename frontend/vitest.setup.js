// Vitest setup文件，在测试运行之前执行
import { config } from '@vue/test-utils'

// 配置全局可用的属性或方法
globalThis.Vue = {
  version: '3.5.22'
}

// 如果需要，可以在这里添加其他全局设置
// 例如：挂载全局插件、设置全局组件等