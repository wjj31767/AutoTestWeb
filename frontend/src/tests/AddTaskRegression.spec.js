import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'

// 使用内联mock，避免提升问题
vi.mock('../router/index', () => ({
  default: {
    push: vi.fn()
  }
}))

vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    loading: vi.fn(() => ({ close: vi.fn() })),
    warning: vi.fn(),
    info: vi.fn(),
    closeAll: vi.fn()
  }
}))

vi.mock('../api/taskExecution.js', () => ({
  createTaskExecution: vi.fn()
}))

vi.mock('../api/env.js', () => ({
  getEnvironmentList: vi.fn()
}))

vi.mock('../api/testSuite.js', () => ({
  getTestSuiteList: vi.fn()
}))

// 导入被测试的组件和依赖
import AddTask from '../views/AddTask.vue'
import { createTaskExecution } from '../api/taskExecution.js'
import { getEnvironmentList } from '../api/env.js'
import { getTestSuiteList } from '../api/testSuite.js'

// 模拟createTaskExecution函数，直接记录调用参数
let submittedData = null
vi.mocked(createTaskExecution).mockImplementation(async (data) => {
  submittedData = data
  return {
    data: {
      id: 'task-123'
    }
  }
})

describe('AddTask.vue 回归测试 - 测试用例集字段映射', () => {
  let wrapper
  const mockEnvironments = [
    { id: 'env-1', name: '测试环境1' },
    { id: 'env-2', name: '测试环境2' }
  ]
  
  const mockTestSuites = [
    { id: 'suite-1', name: '测试套件1' },
    { id: 'suite-2', name: '测试套件2' }
  ]
  
  beforeEach(() => {
    vi.clearAllMocks()
    submittedData = null
    
    // Mock API响应
    getEnvironmentList.mockResolvedValue({
      data: {
        results: mockEnvironments
      }
    })
    
    getTestSuiteList.mockResolvedValue({
      data: {
        results: mockTestSuites
      }
    })

    wrapper = mount(AddTask, {
      global: {
        stubs: {
          'el-card': { template: '<div><slot name="header"></slot><slot></slot></div>' },
          'el-steps': { template: '<div><slot></slot></div>' },
          'el-step': { props: ['title', 'description'], template: '<div class="el-step">{{ title }}</div>' },
          'el-form': { template: '<div><slot></slot></div>' },
          'el-form-item': { props: ['label'], template: '<div><label>{{ label }}</label><slot></slot></div>' },
          'el-select': { props: ['modelValue'], emits: ['update:modelValue'], template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot></slot></select>' },
          'el-option': { props: ['label', 'value'], template: '<option :value="value">{{ label }}</option>' },
          'el-input': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
          'el-input-number': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="number" :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
          'el-upload': { props: ['before-upload'], template: '<div class="el-upload"><slot></slot></div>' },
          'el-button': { props: ['type'], template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>' },
          'el-icon': { template: '<span class="el-icon"><slot></slot></span>' },
          'el-tag': { props: ['closable'], template: '<span><slot></slot></span>' },
          'el-radio-group': { props: ['modelValue'], emits: ['update:modelValue'], template: '<div><slot></slot></div>' },
          'el-radio': { props: ['label'], template: '<input type="radio" :value="label" /><span><slot></slot></span>' },
          'el-descriptions': { template: '<div><slot></slot></div>' },
          'el-descriptions-item': { props: ['label'], template: '<div><span>{{ label }}:</span><slot></slot></div>' }
        }
      }
    })
  })
  
  describe('数据初始化', () => {
    it('应该正确加载环境列表和测试用例集列表', async () => {
      // 等待组件挂载和数据加载
      await wrapper.vm.$nextTick()
      
      // 验证API调用
      expect(getEnvironmentList).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
      expect(getTestSuiteList).toHaveBeenCalledWith({ page: 1, pageSize: 100 })
    })
  })
  
  describe('任务提交 - 测试用例集字段映射', () => {
    it('验证提交数据中包含正确的suite_id字段', async () => {
      // 直接设置组件的taskForm响应式对象的各个属性
      const vm = wrapper.vm
      vm.currentStep = 2
      vm.taskForm.name = '测试任务'
      vm.taskForm.environmentId = 'env-1'
      vm.taskForm.testSuite = 'suite-1'
      vm.taskForm.branchPackage = '/path/to/branch'
      
      // 直接调用submitTask方法
      await vm.submitTask()
      
      // 验证submittedData包含正确的字段
      expect(submittedData).toHaveProperty('suite_id', 'suite-1')
      expect(submittedData).toHaveProperty('env_id', 'env-1')
    })
    
    it('验证测试用例集ID是字符串类型，与后端tb_test_suite表的VARCHAR(64)类型匹配', async () => {
      // 直接设置组件的taskForm响应式对象的各个属性
      const vm = wrapper.vm
      vm.currentStep = 2
      vm.taskForm.name = '测试任务'
      vm.taskForm.environmentId = 'env-1'
      vm.taskForm.testSuite = 'string-id-123'
      vm.taskForm.branchPackage = '/path/to/branch'
      
      // 直接调用submitTask方法
      await vm.submitTask()
      
      // 验证suite_id字段是字符串类型
      expect(typeof submittedData.suite_id).toBe('string')
      expect(submittedData.suite_id).toBe('string-id-123')
    })
    
    it('验证所有驼峰字段到下划线字段的转换逻辑', async () => {
      // 直接设置组件的taskForm响应式对象的各个属性
      const vm = wrapper.vm
      vm.currentStep = 2
      vm.taskForm.name = '测试任务'
      vm.taskForm.environmentId = 'env-1'
      vm.taskForm.testSuite = 'suite-1'
      vm.taskForm.branchPackage = '/path/to/branch'
      vm.taskForm.executionMode = 'sequential'
      vm.taskForm.maxConcurrency = 1
      vm.taskForm.timeout = 30
      vm.taskForm.executionParams = '{"test": "params"}'
      
      // 直接调用submitTask方法
      await vm.submitTask()
      
      // 验证转换后的字段是否符合预期
      expect(submittedData.env_id).toBe('env-1')
      expect(submittedData.suite_id).toBe('suite-1')
      expect(submittedData.branch_package).toBe('/path/to/branch')
      expect(submittedData.execution_mode).toBe('sequential')
      expect(submittedData.max_concurrency).toBe(1)
      expect(submittedData.execution_params).toBe('{"test": "params"}')
    })
  })
})