import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

describe('SimpleVitest', () => {
  it('should mount a simple component', () => {
    const SimpleComponent = {
      template: '<div>Hello World</div>'
    }
    
    const wrapper = mount(SimpleComponent)
    expect(wrapper.text()).toBe('Hello World')
  })
})