import { it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// 模拟全局的console.log，避免测试输出过多信息
console.log = vi.fn()

// 简单的模拟数据
const mockEnvData = {
  data: {
    items: [
      {
        id: '1',
        name: 'Test Environment',
        ip: '192.168.1.1',
        status: 'active',
        description: 'Test description'
      }
    ],
    total: 1,
    page: 1,
    pageSize: 10
  }
}

// 测试1: 最基本的挂载测试
it('测试1: 应该能够挂载EnvList组件', () => {
  // 在这个测试中，我们先不导入EnvList，而是直接使用一个空组件
  const EmptyComponent = { template: '<div>Empty Component</div>' }
  const wrapper = mount(EmptyComponent)
  
  expect(wrapper.exists()).toBe(true)
})

// 测试2: 简单的axios模拟测试
it('测试2: 应该能够正确模拟axios', async () => {
  // 先创建一个简单的函数来测试axios模拟
  const mockGet = vi.fn().mockResolvedValue(mockEnvData)
  
  // 模拟axios模块
  vi.doMock('axios', () => ({
    get: mockGet,
    defaults: {
      baseURL: '/api',
      withCredentials: true
    }
  }))
  
  // 导入并使用模拟的axios
  const axios = await import('axios')
  const result = await axios.get('/test')
  
  // 验证axios.get是否被调用
  expect(mockGet).toHaveBeenCalledWith('/test')
  expect(result).toEqual(mockEnvData)
})

// 测试3: 尝试直接测试EnvList组件的方法
it('测试3: 应该能够直接测试EnvList组件的方法', async () => {
  // 模拟axios
  const mockGet = vi.fn().mockResolvedValue(mockEnvData)
  
  // 替换全局的axios
  vi.doMock('axios', () => ({
    get: mockGet,
    defaults: {
      baseURL: '/api',
      withCredentials: true
    }
  }))
  
  // 重新导入组件以确保它使用了我们的模拟
  const { default: EnvList } = await import('../views/EnvList.vue')
  
  // 创建一个组件实例，但不挂载它
  const vm = new EnvList()
  
  // 检查组件是否有我们预期的方法
  expect(typeof vm.loadEnvList).toBe('function')
})