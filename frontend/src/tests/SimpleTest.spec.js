const { describe, it, expect } = require('@jest/globals')
const { mount } = require('@vue/test-utils')
const { h } = require('vue')

describe('SimpleTest', () => {
  it('should mount a simple component', () => {
    const SimpleComponent = {
      template: '<div>Hello World</div>'
    }
    
    const wrapper = mount(SimpleComponent)
    expect(wrapper.text()).toBe('Hello World')
  })
})