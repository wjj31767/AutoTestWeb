import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { mount } from '@vue/test-utils'
import AddTask from '../src/views/AddTask.vue'
import { ElMessage } from 'element-plus'
import { createTaskExecution, getEnvironmentList, getTestSuiteList } from '../src/api/taskExecution.js'

// Mock Element Plus组件和API调用
vi.mock('element-plus', () => ({
  ElMessage: vi.fn()
}))

vi.mock('../src/api/taskExecution.js', () => ({
  createTaskExecution: vi.fn(),
  getEnvironmentList: vi.fn(),
  getTestSuiteList: vi.fn()
}))

// Mock路由
const mockRouter = {
  push: vi.fn()
}

vi.mock('../src/router/index', () => ({
  default: mockRouter
}))

describe('AddTask.vue 回归测试 - 测试用例集字段映射', () => {
  let wrapper
  const mockEnvironments = [
    { id: 'env-1', name: '测试环境1' },
    { id: 'env-2', name: '测试环境2' }
  ]
  
  const mockTestSuites = [
    { id: 'suite-1', name: '测试套件1' }, // 注意这里的ID是字符串，与tb_test_suite表的VARCHAR(64)类型匹配
    { id: 'suite-2', name: '测试套件2' }
  ]
  
  const mockTaskResponse = {
    data: {
      id: 'task-123'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
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
    
    createTaskExecution.mockResolvedValue(mockTaskResponse)

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
          'el-upload': { props: ['before-upload'], template: '<div class="el-upload"><slot></slot></div>' },
          'el-button': { props: ['type'], template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>' },
          'el-icon': { template: '<span class="el-icon"><slot></slot></span>' }
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
      
      // 验证数据是否正确加载到组件中
      expect(wrapper.vm.environments).toEqual(mockEnvironments)
      expect(wrapper.vm.testSuites).toEqual(mockTestSuites)
    })
  })
  
  describe('任务提交 - 测试用例集字段映射', () => {
    it('提交任务时应该正确使用suite_id字段对应测试用例集ID', async () => {
      const vm = wrapper.vm
      
      // 设置表单数据
      vm.taskForm = {
        name: '测试任务',
        environmentId: 'env-1',
        description: '测试任务描述',
        branchPackage: '/path/to/branch',
        testSuite: 'suite-1', // 前端表单字段
        executionMode: 'parallel',
        maxConcurrency: 5,
        timeout: 60,
        executionParams: '{"param": "value"}'
      }
      
      // 直接调用submitTask方法
      await vm.submitTask()
      
      // 验证createTaskExecution被调用，并检查参数
      expect(createTaskExecution).toHaveBeenCalledTimes(1)
      const calledWithData = createTaskExecution.mock.calls[0][0]
      
      // 关键验证：确保提交的数据中使用了suite_id字段，并且值与testSuite表单字段对应
      expect(calledWithData).toHaveProperty('suite_id', 'suite-1')
      
      // 验证其他字段映射是否正确
      expect(calledWithData).toHaveProperty('env_id', 'env-1')
      expect(calledWithData).toHaveProperty('name', '测试任务')
      expect(calledWithData).toHaveProperty('branch_package', '/path/to/branch')
      expect(calledWithData).toHaveProperty('execution_mode', 'parallel')
      
      // 验证成功提示和路由跳转
      expect(ElMessage).toHaveBeenCalledWith({
        message: '任务创建成功，即将跳转到任务详情页',
        type: 'success'
      })
      
      // 验证路由跳转
      // 由于setTimeout是异步的，这里需要等待一下
      await new Promise(resolve => setTimeout(resolve, 1600))
      expect(mockRouter.push).toHaveBeenCalledWith({
        name: 'TaskDetail',
        params: { id: 'task-123' }
      })
    })
    
    it('提交任务失败时应该正确处理错误', async () => {
      const vm = wrapper.vm
      
      // 设置表单数据
      vm.taskForm = {
        name: '测试任务',
        environmentId: 'env-1',
        testSuite: 'suite-1',
        branchPackage: '/path/to/branch',
        executionMode: 'parallel',
        maxConcurrency: 5,
        timeout: 60
      }
      
      // Mock API失败
      const errorResponse = {
        response: {
          data: {
            detail: '创建任务失败'
          }
        }
      }
      createTaskExecution.mockRejectedValue(errorResponse)
      
      // 直接调用submitTask方法
      await vm.submitTask()
      
      // 验证错误处理
      expect(ElMessage).toHaveBeenCalledWith({
        message: '任务创建成功，即将跳转到任务详情页',
        type: 'success'
      })
      
      // 验证错误提示
      expect(ElMessage.error).toHaveBeenCalledWith('任务提交失败: 创建任务失败')
    })
  })
  
  describe('测试用例集字段类型验证', () => {
    it('应该正确处理字符串类型的测试用例集ID', async () => {
      // 确保测试用例集ID是字符串类型，与后端tb_test_suite表的VARCHAR(64)类型匹配
      const vm = wrapper.vm
      
      // 设置字符串类型的测试用例集ID
      vm.taskForm.testSuite = 'string-id-123'
      
      // 验证数据类型
      expect(typeof vm.taskForm.testSuite).toBe('string')
      
      // 模拟提交任务
      await vm.submitTask()
      
      // 验证createTaskExecution被调用时传递的suite_id字段是字符串类型
      const calledWithData = createTaskExecution.mock.calls[0][0]
      expect(typeof calledWithData.suite_id).toBe('string')
      expect(calledWithData.suite_id).toBe('string-id-123')
    })
  })
  
  describe('表单验证', () => {
    it('未选择测试用例集时应该无法进入下一步', async () => {
      const vm = wrapper.vm
      
      // 设置第一步表单数据但不选择测试用例集
      vm.taskForm = {
        name: '测试任务',
        environmentId: 'env-1',
        description: '测试描述',
        branchPackage: '/path/to/branch',
        testSuite: '', // 未选择测试用例集
        executionMode: 'parallel',
        timeout: 60
      }
      
      // 先进入第二步
      vm.currentStep = 1
      
      // 尝试进入第三步
      const nextButton = wrapper.find('.el-button[type="primary"]')
      await nextButton.trigger('click')
      
      // 验证无法进入第三步
      expect(vm.currentStep).toBe(1)
      
      // 选择测试用例集后再次尝试
      vm.taskForm.testSuite = 'suite-1'
      await nextButton.trigger('click')
      
      // 验证可以进入第三步
      expect(vm.currentStep).toBe(2)
    })
  })
})