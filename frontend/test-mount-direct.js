// 这个脚本直接测试@vue/test-utils的mount函数是否正常工作
// 不通过Vitest，而是直接使用Node.js运行

// 首先，我们需要设置jsdom来模拟浏览器环境
import { JSDOM } from 'jsdom'

// 创建一个jsdom实例
const dom = new JSDOM('<html><body></body></html>', {
  url: 'http://localhost/',
  referrer: 'http://localhost/',
  contentType: 'text/html',
  includeNodeLocations: true,
  storageQuota: 10000000
})

// 将jsdom的全局对象设置到Node.js的全局对象中
// 我们需要使用Object.defineProperties来设置多个属性
Object.defineProperties(global, {
  document: {
    value: dom.window.document,
    writable: true
  },
  window: {
    value: dom.window,
    writable: true
  },
  navigator: {
    value: dom.window.navigator,
    writable: true
  },
  location: {
    value: dom.window.location,
    writable: true
  },
  // 添加Vue需要的浏览器API
  SVGElement: {
    value: function SVGElement() {},
    writable: true
  },
  // 添加一些可能需要的其他DOM API
  HTMLElement: {
    value: dom.window.HTMLElement,
    writable: true
  },
  Node: {
    value: dom.window.Node,
    writable: true
  },
  Event: {
    value: dom.window.Event,
    writable: true
  },
  MouseEvent: {
    value: dom.window.MouseEvent,
    writable: true
  },
  KeyboardEvent: {
    value: dom.window.KeyboardEvent,
    writable: true
  }
})

// 现在可以导入和使用@vue/test-utils了
import { mount } from '@vue/test-utils'
import { createApp } from 'vue/dist/vue.esm-bundler.js'

// 创建一个简单的Vue组件
const SimpleComponent = {
  template: '<div>{{ message }}</div>',
  data() {
    return {
      message: 'Hello World'
    }
  }
}

console.log('正在尝试挂载组件...')

try {
  // 使用@vue/test-utils的mount函数挂载组件
  const wrapper = mount(SimpleComponent)
  
  console.log('组件挂载成功!')
  console.log('组件文本内容:', wrapper.text())
  console.log('wrapper.exists():', wrapper.exists())
  console.log('wrapper.vm.message:', wrapper.vm.message)
  
  console.log('\n所有测试通过!')
} catch (error) {
  console.error('组件挂载失败:', error)
  process.exit(1)
}