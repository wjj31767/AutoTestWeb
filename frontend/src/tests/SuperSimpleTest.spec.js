import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

// 创建一个最简单的Vue组件
const SimpleComponent = {
  template: '<div>Hello World</div>',
  data() {
    return {
      message: 'Hello'
    }
  }
}

// 只测试mount函数是否可用，以及是否能成功挂载组件
it('should be able to mount a simple component', () => {
  expect(typeof mount).toBe('function')
  
  const wrapper = mount(SimpleComponent)
  expect(wrapper.text()).toContain('Hello World')
})