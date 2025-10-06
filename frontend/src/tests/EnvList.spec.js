import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { mount } from '@vue/test-utils'
import EnvList from '../views/EnvList.vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// Mock Element Plus组件
vi.mock('element-plus', () => ({
  ElMessage: vi.fn(),
  ElMessageBox: {
    confirm: vi.fn()
  }
}))

// Mock路由
const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

describe('EnvList.vue', () => {
  let wrapper
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    wrapper = mount(EnvList, {
      global: {
        stubs: {
          'el-card': { template: '<div><slot name="header"></slot><slot></slot></div>' },
          'el-form': { template: '<div><slot></slot></div>' },
          'el-form-item': { props: ['label'], template: '<div><label>{{ label }}</label><slot></slot></div>' },
          'el-input': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
          'el-select': { props: ['modelValue'], emits: ['update:modelValue'], template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot></slot></select>' },
          'el-option': { props: ['label', 'value'], template: '<option :value="value">{{ label }}</option>' },
          'el-button': { props: ['type'], template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>' },
          'el-table': { template: '<div><slot></slot></div>' },
          'el-table-column': { template: '<div></div>' },
          'el-tag': { props: ['type'], template: '<span class="el-tag"><slot></slot></span>' },
          'el-switch': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked ? \'active\' : \'inactive\')" />' },
          'el-pagination': { template: '<div class="pagination"></div>' },
          'el-dialog': { template: '<div></div>' }
        }
      }
    })
  })
  
  describe('组件渲染', () => {
    it('应该正确渲染搜索表单', () => {
      expect(wrapper.find('.search-form').exists()).toBe(true)
      expect(wrapper.find('input[placeholder="请输入环境名称"]').exists()).toBe(true)
      expect(wrapper.find('select').exists()).toBe(true)
    })
    
    it('应该正确渲染操作按钮', () => {
      expect(wrapper.find('.action-bar').exists()).toBe(true)
      expect(wrapper.find('.el-button').text()).toContain('新增环境')
      expect(wrapper.find('.el-button').text()).toContain('批量删除')
      expect(wrapper.find('.el-button').text()).toContain('刷新')
    })
    
    it('应该正确渲染分页组件', () => {
      expect(wrapper.find('.pagination').exists()).toBe(true)
    })
  })
  
  describe('搜索功能', () => {
    it('输入搜索条件后点击搜索按钮应该触发搜索', async () => {
      const vm = wrapper.vm
      const searchInput = wrapper.find('input[placeholder="请输入环境名称"]')
      await searchInput.setValue('测试环境')
      
      const searchButton = wrapper.find('.el-button[type="primary"]')
      await searchButton.trigger('click')
      
      expect(vm.pagination.currentPage).toBe(1)
    })
    
    it('点击重置按钮应该清空搜索条件', async () => {
      const vm = wrapper.vm
      const searchInput = wrapper.find('input[placeholder="请输入环境名称"]')
      await searchInput.setValue('测试环境')
      
      const resetButton = wrapper.find('.el-button:nth-child(2)')
      await resetButton.trigger('click')
      
      expect(vm.searchForm.name).toBe('')
      expect(vm.searchForm.type).toBe('')
      expect(vm.searchForm.status).toBe('')
    })
  })
  
  describe('环境操作', () => {
    it('点击新增环境按钮应该打开对话框', async () => {
      const vm = wrapper.vm
      const addButton = wrapper.find('.el-button:first-child')
      await addButton.trigger('click')
      
      expect(vm.dialogVisible).toBe(true)
      expect(vm.dialogTitle).toBe('新增环境')
    })
    
    it('点击刷新按钮应该重新加载数据', async () => {
      const vm = wrapper.vm
      const refreshButton = wrapper.find('.el-button:nth-child(3)')
      
      // Mock loadEnvList方法
      const mockLoadEnvList = vi.spyOn(vm, 'loadEnvList')
      vm.loadEnvList = mockLoadEnvList
      
      await refreshButton.trigger('click')
      
      expect(mockLoadEnvList).toHaveBeenCalled()
    })
    
    it('删除环境应该弹出确认对话框', async () => {
      const vm = wrapper.vm
      
      // Mock ElMessageBox.confirm
      ElMessageBox.confirm.mockResolvedValue(true)
      
      await vm.handleDelete('1')
      
      expect(ElMessageBox.confirm).toHaveBeenCalled()
    })
    
    it('状态切换应该触发相应的处理函数', async () => {
      const vm = wrapper.vm
      const mockRow = { id: '1', name: '测试环境1', status: 'inactive' }
      
      await vm.handleStatusChange(mockRow)
      
      expect(mockRow.status).toBe('inactive')
    })
  })
  
  describe('表单验证', () => {
    it('环境类型标签应该正确显示', () => {
      const vm = wrapper.vm
      expect(vm.getTypeLabel('dev')).toBe('开发环境')
      expect(vm.getTypeLabel('test')).toBe('测试环境')
      expect(vm.getTypeLabel('prod')).toBe('生产环境')
    })
    
    it('环境类型标签类型应该正确', () => {
      const vm = wrapper.vm
      expect(vm.getTypeTag('dev')).toBe('primary')
      expect(vm.getTypeTag('test')).toBe('success')
      expect(vm.getTypeTag('prod')).toBe('warning')
    })
  })
  
  describe('分页功能', () => {
    it('分页大小变化应该触发相应处理', () => {
      const vm = wrapper.vm
      const mockLoadEnvList = vi.spyOn(vm, 'loadEnvList')
      vm.loadEnvList = mockLoadEnvList
      
      vm.handleSizeChange(20)
      
      expect(vm.pagination.pageSize).toBe(20)
      expect(mockLoadEnvList).toHaveBeenCalled()
    })
    
    it('当前页变化应该触发相应处理', () => {
      const vm = wrapper.vm
      const mockLoadEnvList = vi.spyOn(vm, 'loadEnvList')
      vm.loadEnvList = mockLoadEnvList
      
      vm.handleCurrentChange(2)
      
      expect(vm.pagination.currentPage).toBe(2)
      expect(mockLoadEnvList).toHaveBeenCalled()
    })
  })
  
  describe('边界情况', () => {
    it('批量删除时没有选择任何环境应该提示', async () => {
      const vm = wrapper.vm
      vm.selectedRows = []
      
      await vm.handleBatchDelete()
      
      expect(ElMessage).toHaveBeenCalledWith({
        message: '请选择要删除的环境',
        type: 'warning'
      })
    })
    
    it('取消删除应该提示', async () => {
      const vm = wrapper.vm
      
      // Mock ElMessageBox.confirm 拒绝
      ElMessageBox.confirm.mockRejectedValue(false)
      
      await vm.handleDelete('1')
      
      expect(ElMessage).toHaveBeenCalledWith({
        message: '已取消删除',
        type: 'info'
      })
    })
  })
})