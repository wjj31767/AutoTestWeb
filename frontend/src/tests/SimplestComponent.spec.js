import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import SimplestComponent from '../components/SimplestComponent.vue'

it('should render the component correctly', () => {
  const wrapper = mount(SimplestComponent)
  
  // 验证组件是否存在
  expect(wrapper.exists()).toBe(true)
  
  // 验证初始内容
  expect(wrapper.find('h1').text()).toBe('Hello Vitest')
  expect(wrapper.find('p').text()).toBe('This is a very simple component for testing')
  expect(wrapper.find('button').text()).toBe('0')
})

it('should increment count when button is clicked', async () => {
  const wrapper = mount(SimplestComponent)
  const button = wrapper.find('button')
  
  // 初始计数应该是0
  expect(button.text()).toBe('0')
  
  // 点击按钮
  await button.trigger('click')
  
  // 验证计数是否增加
  expect(button.text()).toBe('1')
  
  // 再次点击按钮
  await button.trigger('click')
  
  // 验证计数是否再次增加
  expect(button.text()).toBe('2')
})