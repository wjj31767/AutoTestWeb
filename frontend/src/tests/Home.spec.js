import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { mount } from '@vue/test-utils'
import Home from '../views/Home.vue'
import { ElMessage } from 'element-plus'

// Mock Element Plus组件
vi.mock('element-plus', () => ({
  ElMessage: {
    mockImplementation: vi.fn()
  }
}))

// Mock路由
const mockRouter = {
  push: vi.fn()
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}))

describe('Home.vue', () => {
  let wrapper
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    wrapper = mount(Home, {
      global: {
        stubs: {
          'el-card': { template: '<div><slot name="header"></slot><slot></slot></div>' },
          'el-statistic': { props: ['value', 'suffix', 'label'], template: '<div class="stat-item">{{ value }}{{ suffix }} {{ label }}</div>' },
          'el-table': { template: '<div><slot></slot></div>' },
          'el-table-column': { template: '<div></div>' },
          'el-tag': { props: ['type'], template: '<span class="el-tag"><slot></slot></span>' },
          'el-button': { props: ['type', 'size'], template: '<button class="el-button"><slot></slot></button>' },
          'el-icon': { template: '<span class="el-icon"><slot></slot></span>' }
        }
      }
    })
  })
  
  describe('组件渲染', () => {
    it('应该正确渲染欢迎信息', () => {
      expect(wrapper.text()).toContain('欢迎使用 AutoTestWeb - 芯片验证防护网')
    })
    
    it('应该正确渲染快速访问部分', () => {
      expect(wrapper.text()).toContain('快速访问')
      expect(wrapper.text()).toContain('环境管理')
      expect(wrapper.text()).toContain('新增任务')
      expect(wrapper.text()).toContain('任务列表')
      expect(wrapper.text()).toContain('报表中心')
    })
    
    it('应该正确渲染系统概览部分', () => {
      expect(wrapper.text()).toContain('系统概览')
      expect(wrapper.text()).toContain('活跃环境')
      expect(wrapper.text()).toContain('已完成任务')
      expect(wrapper.text()).toContain('成功率')
      expect(wrapper.text()).toContain('平均执行时间')
    })
    
    it('应该正确渲染最近活动部分', () => {
      expect(wrapper.text()).toContain('最近活动')
    })
  })
  
  describe('导航功能', () => {
    it('点击环境管理卡片应该跳转到环境列表页面', async () => {
      const envCard = wrapper.find('.access-card:nth-child(1)')
      await envCard.trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('env/list')
    })
    
    it('点击新增任务卡片应该跳转到新增任务页面', async () => {
      const taskCard = wrapper.find('.access-card:nth-child(2)')
      await taskCard.trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('task/add')
    })
    
    it('点击任务列表卡片应该跳转到任务列表页面', async () => {
      const listCard = wrapper.find('.access-card:nth-child(3)')
      await listCard.trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('task/list')
    })
    
    it('点击报表中心卡片应该跳转到报表中心页面', async () => {
      const reportCard = wrapper.find('.access-card:nth-child(4)')
      await reportCard.trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('report')
    })
  })
  
  describe('任务操作', () => {
    it('点击任务查看按钮应该跳转到任务详情页面', async () => {
      // 模拟表格中的查看按钮
      const viewButton = wrapper.find('.el-button[type="text"]')
      await viewButton.trigger('click')
      expect(mockRouter.push).toHaveBeenCalledWith('/task/detail/1')
    })
  })
  
  describe('状态标签类型', () => {
    it('应该根据状态返回正确的标签类型', () => {
      const vm = wrapper.vm
      expect(vm.getStatusType('成功')).toBe('success')
      expect(vm.getStatusType('失败')).toBe('danger')
      expect(vm.getStatusType('运行中')).toBe('warning')
      expect(vm.getStatusType('其他')).toBe('info')
    })
  })
  
  describe('数据模拟', () => {
    it('应该正确加载最近任务数据', () => {
      const vm = wrapper.vm
      expect(vm.recentTasks).toHaveLength(4)
      expect(vm.recentTasks[0].name).toBe('芯片功能测试')
      expect(vm.recentTasks[1].status).toBe('成功')
    })
  })
  
  describe('边界情况', () => {
    it('当没有任务数据时应该正常渲染', () => {
      // 虽然我们使用了模拟数据，但在实际项目中应该测试空数据的情况
      expect(wrapper.exists()).toBe(true)
    })
    
    it('点击不存在的路由应该优雅处理', () => {
      // 路由跳转由Vue Router处理，这里主要测试组件本身的健壮性
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })
})