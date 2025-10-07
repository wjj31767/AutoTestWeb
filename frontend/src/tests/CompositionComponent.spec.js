import { it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import CompositionComponent from '../components/CompositionComponent.vue'

it('should render the component correctly', () => {
  // 使用最新的@vue/test-utils API挂载组件
  const wrapper = mount(CompositionComponent)
  
  // 验证组件是否存在
  expect(wrapper.exists()).toBe(true)
  
  // 验证初始内容
  expect(wrapper.find('h2').text()).toBe('Composition API Component')
  expect(wrapper.find('p').text()).toBe('Count: 0')
  
  // 验证按钮是否存在
  expect(wrapper.findAll('button')).toHaveLength(2)
  expect(wrapper.findAll('button')[0].text()).toBe('Increment')
  expect(wrapper.findAll('button')[1].text()).toBe('Decrement')
})

it('should increment count when increment button is clicked', async () => {
  const wrapper = mount(CompositionComponent)
  const incrementButton = wrapper.findAll('button')[0]
  const countText = wrapper.find('p')
  
  // 初始计数应该是0
  expect(countText.text()).toBe('Count: 0')
  
  // 点击Increment按钮
  await incrementButton.trigger('click')
  
  // 验证计数是否增加
  expect(countText.text()).toBe('Count: 1')
  
  // 再次点击Increment按钮
  await incrementButton.trigger('click')
  
  // 验证计数是否再次增加
  expect(countText.text()).toBe('Count: 2')
})

it('should decrement count when decrement button is clicked', async () => {
  const wrapper = mount(CompositionComponent)
  const incrementButton = wrapper.findAll('button')[0]
  const decrementButton = wrapper.findAll('button')[1]
  const countText = wrapper.find('p')
  
  // 先增加计数到2
  await incrementButton.trigger('click')
  await incrementButton.trigger('click')
  expect(countText.text()).toBe('Count: 2')
  
  // 点击Decrement按钮
  await decrementButton.trigger('click')
  
  // 验证计数是否减少
  expect(countText.text()).toBe('Count: 1')
  
  // 再次点击Decrement按钮
  await decrementButton.trigger('click')
  
  // 验证计数是否再次减少
  expect(countText.text()).toBe('Count: 0')
  
  // 再次点击Decrement按钮，计数应该变为-1
  await decrementButton.trigger('click')
  expect(countText.text()).toBe('Count: -1')
})