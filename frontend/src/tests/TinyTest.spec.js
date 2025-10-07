import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'

it('mount should be a function', () => {
  expect(typeof mount).toBe('function')
})

it('should mount a simple component', () => {
  const SimpleComponent = { template: '<div>Test</div>' }
  const wrapper = mount(SimpleComponent)
  expect(wrapper.text()).toBe('Test')
})