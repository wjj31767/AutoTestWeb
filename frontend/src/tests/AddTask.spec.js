import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { mount } from '@vue/test-utils'
import AddTask from '../views/AddTask.vue'
import { ElMessage } from 'element-plus'

// Mock Element Plus组件
vi.mock('element-plus', () => ({
  ElMessage: vi.fn()
}))

// Mock路由
const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

describe('AddTask.vue', () => {
  let wrapper
  
  beforeEach(() => {
    vi.clearAllMocks()
    
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
          'el-checkbox-group': { props: ['modelValue'], emits: ['update:modelValue'], template: '<div @click="$emit(\'update:modelValue\', [])"><slot></slot></div>' },
          'el-checkbox': { props: ['label'], template: '<label><input type="checkbox">{{ label }}</label>' },
          'el-switch': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked)" />' },
          'el-upload': { props: ['before-upload'], template: '<div class="el-upload"><slot></slot></div>' },
          'el-button': { props: ['type'], template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>' },
          'el-icon': { template: '<span class="el-icon"><slot></slot></span>' }
        }
      }
    })
  })
  
  describe('组件渲染', () => {
    it('应该正确渲染步骤条', () => {
      expect(wrapper.find('.el-steps').exists()).toBe(true)
      const steps = wrapper.findAll('.el-step')
      expect(steps).toHaveLength(3)
      expect(steps[0].text()).toContain('选择环境')
      expect(steps[1].text()).toContain('配置参数')
      expect(steps[2].text()).toContain('确认提交')
    })
    
    it('初始应该显示第一步内容', () => {
      const vm = wrapper.vm
      expect(vm.currentStep).toBe(0)
    })
  })
  
  describe('步骤导航', () => {
    it('点击下一步应该进入第二步', async () => {
      const vm = wrapper.vm
      const nextButton = wrapper.find('.el-button[type="primary"]')
      
      // 设置一个环境
      vm.envId = '1'
      
      await nextButton.trigger('click')
      
      expect(vm.currentStep).toBe(1)
    })
    
    it('没有选择环境点击下一步应该提示', async () => {
      const vm = wrapper.vm
      const nextButton = wrapper.find('.el-button[type="primary"]')
      
      await nextButton.trigger('click')
      
      expect(ElMessage).toHaveBeenCalledWith({
        message: '请选择环境',
        type: 'warning'
      })
      expect(vm.currentStep).toBe(0)
    })
    
    it('在第二步点击上一步应该返回第一步', async () => {
      const vm = wrapper.vm
      vm.currentStep = 1
      
      const prevButton = wrapper.find('.el-button:not([type="primary"])')
      await prevButton.trigger('click')
      
      expect(vm.currentStep).toBe(0)
    })
    
    it('在第三步点击上一步应该返回第二步', async () => {
      const vm = wrapper.vm
      vm.currentStep = 2
      
      const prevButton = wrapper.find('.el-button:not([type="primary"])')
      await prevButton.trigger('click')
      
      expect(vm.currentStep).toBe(1)
    })
  })
  
  describe('表单验证', () => {
    it('环境选择变化应该更新分支包列表', async () => {
      const vm = wrapper.vm
      
      // Mock loadBranchPackages方法
      const mockLoadBranchPackages = vi.spyOn(vm, 'loadBranchPackages')
      vm.loadBranchPackages = mockLoadBranchPackages
      
      vm.envId = '1'
      
      await vm.$nextTick()
      
      expect(mockLoadBranchPackages).toHaveBeenCalledWith('1')
    })
    
    it('文件上传前验证应该正确', () => {
      const vm = wrapper.vm
      
      // 测试小于10MB的文件
      const mockFile1 = { size: 5 * 1024 * 1024, name: 'test.txt' }
      expect(vm.beforeUpload(mockFile1)).toBe(true)
      
      // 测试大于10MB的文件
      const mockFile2 = { size: 11 * 1024 * 1024, name: 'large.txt' }
      expect(vm.beforeUpload(mockFile2)).toBe(false)
      expect(ElMessage).toHaveBeenCalledWith({
        message: '文件大小不能超过 10MB!',
        type: 'error'
      })
    })
  })
  
  describe('任务提交', () => {
    it('提交任务应该重置表单并跳转', async () => {
      const vm = wrapper.vm
      vm.currentStep = 2
      vm.taskForm = {
        name: '测试任务',
        description: '测试描述',
        timeout: 120
      }
      
      // Mock submitTask方法
      const mockSubmitTask = vi.spyOn(vm, 'submitTask').mockResolvedValue({ success: true, taskId: '123' })
      vm.submitTask = mockSubmitTask
      
      const submitButton = wrapper.find('.el-button[type="primary"]')
      await submitButton.trigger('click')
      
      expect(mockSubmitTask).toHaveBeenCalled()
      expect(mockRouter.push).toHaveBeenCalledWith('/task/detail/123')
    })
  })
  
  describe('分支包加载', () => {
    it('加载分支包列表应该正确处理数据', async () => {
      const vm = wrapper.vm
      
      // Mock的API返回数据
      const mockResponse = {
        success: true,
        data: [
          { id: '1', name: 'branch-1' },
          { id: '2', name: 'branch-2' }
        ]
      }
      
      // Mock全局fetch
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue(mockResponse)
      })
      
      await vm.loadBranchPackages('1')
      
      expect(vm.branchPackages).toEqual(mockResponse.data)
      expect(vm.loadingBranchPackages).toBe(false)
    })
  })
  
  describe('边界情况', () => {
    it('表单验证失败应该提示', async () => {
      const vm = wrapper.vm
      vm.currentStep = 1
      vm.taskForm.name = ''
      
      const nextButton = wrapper.find('.el-button[type="primary"]')
      await nextButton.trigger('click')
      
      expect(ElMessage).toHaveBeenCalledWith({
        message: '任务名称不能为空',
        type: 'warning'
      })
      expect(vm.currentStep).toBe(1)
    })
    
    it('分支包加载失败应该处理', async () => {
      const vm = wrapper.vm
      
      // Mock全局fetch失败
      global.fetch = vi.fn().mockRejectedValue(new Error('API错误'))
      
      await vm.loadBranchPackages('1')
      
      expect(vm.loadingBranchPackages).toBe(false)
      expect(ElMessage).toHaveBeenCalledWith({
        message: '加载分支包失败',
        type: 'error'
      })
    })
  })
})