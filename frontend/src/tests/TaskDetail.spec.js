import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { mount } from '@vue/test-utils'
import TaskDetail from '../views/TaskDetail.vue'
import { ElMessage } from 'element-plus'

// Mock Element Plus组件
vi.mock('element-plus', () => ({
  ElMessage: vi.fn()
}))

// Mock路由
const mockRouter = {
  push: vi.fn(),
  replace: vi.fn()
}

const mockRoute = {
  params: {
    id: '1'
  }
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute
}))

describe('TaskDetail.vue', () => {
  let wrapper
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    wrapper = mount(TaskDetail, {
      global: {
        stubs: {
          'el-card': { template: '<div><slot name="header"></slot><slot></slot></div>' },
          'el-tabs': { template: '<div><slot></slot></div>' },
          'el-tab-pane': { props: ['label'], template: '<div class="tab-pane"><slot></slot></div>' },
          'el-descriptions': { template: '<div><slot></slot></div>' },
          'el-descriptions-item': { props: ['label'], template: '<div><span>{{ label }}:</span> <slot></slot></div>' },
          'el-statistic': { props: ['value', 'suffix', 'label'], template: '<div class="stat-item">{{ value }}{{ suffix }} {{ label }}</div>' },
          'el-table': { template: '<div><slot></slot></div>' },
          'el-table-column': { template: '<div></div>' },
          'el-tag': { props: ['type'], template: '<span class="el-tag"><slot></slot></span>' },
          'el-button': { props: ['type', 'size'], template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>' },
          'el-pagination': { template: '<div class="pagination"></div>' },
          'el-empty': { template: '<div class="empty">暂无数据</div>' },
          'el-icon': { template: '<span class="el-icon"><slot></slot></span>' }
        }
      }
    })
  })
  
  describe('组件渲染', () => {
    it('应该正确渲染任务详情页面标题', () => {
      expect(wrapper.text()).toContain('任务结果详情')
    })
    
    it('应该正确渲染任务基本信息区', () => {
      expect(wrapper.find('.task-info').exists()).toBe(true)
      expect(wrapper.text()).toContain('任务名称')
      expect(wrapper.text()).toContain('执行环境')
      expect(wrapper.text()).toContain('开始时间')
      expect(wrapper.text()).toContain('结束时间')
    })
    
    it('应该正确渲染结果统计区', () => {
      expect(wrapper.find('.result-stats').exists()).toBe(true)
      expect(wrapper.text()).toContain('总用例数')
      expect(wrapper.text()).toContain('成功用例')
      expect(wrapper.text()).toContain('失败用例')
      expect(wrapper.text()).toContain('通过率')
    })
    
    it('应该正确渲染用例执行结果列表', () => {
      expect(wrapper.find('.test-cases').exists()).toBe(true)
    })
  })
  
  describe('任务数据加载', () => {
    it('应该正确加载任务详情数据', async () => {
      const vm = wrapper.vm
      
      // Mock全局fetch
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            id: '1',
            name: '测试任务',
            envName: '测试环境',
            status: 'success',
            startTime: '2023-01-01 10:00:00',
            endTime: '2023-01-01 10:30:00',
            totalCases: 100,
            successCases: 95,
            failedCases: 5,
            passRate: 95
          }
        })
      })
      
      await vm.loadTaskDetail()
      
      expect(vm.taskDetail.name).toBe('测试任务')
      expect(vm.loading).toBe(false)
    })
    
    it('加载测试用例数据应该正确', async () => {
      const vm = wrapper.vm
      
      // Mock全局fetch
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          success: true,
          data: {
            list: [
              { id: '1', name: '测试用例1', status: 'success', duration: '5s' },
              { id: '2', name: '测试用例2', status: 'failed', duration: '3s' }
            ],
            total: 2
          }
        })
      })
      
      await vm.loadTestCaseResults()
      
      expect(vm.testCases).toHaveLength(2)
      expect(vm.testCases[0].name).toBe('测试用例1')
      expect(vm.loadingTestCases).toBe(false)
    })
  })
  
  describe('状态显示', () => {
    it('任务状态标签应该正确显示', () => {
      const vm = wrapper.vm
      expect(vm.getStatusLabel('success')).toBe('成功')
      expect(vm.getStatusLabel('failed')).toBe('失败')
      expect(vm.getStatusLabel('running')).toBe('运行中')
    })
    
    it('任务状态标签类型应该正确', () => {
      const vm = wrapper.vm
      expect(vm.getStatusType('success')).toBe('success')
      expect(vm.getStatusType('failed')).toBe('danger')
      expect(vm.getStatusType('running')).toBe('warning')
    })
    
    it('用例状态标签应该正确显示', () => {
      const vm = wrapper.vm
      expect(vm.getCaseStatusLabel('pass')).toBe('通过')
      expect(vm.getCaseStatusLabel('fail')).toBe('失败')
      expect(vm.getCaseStatusLabel('skip')).toBe('跳过')
    })
    
    it('用例状态标签类型应该正确', () => {
      const vm = wrapper.vm
      expect(vm.getCaseStatusType('pass')).toBe('success')
      expect(vm.getCaseStatusType('fail')).toBe('danger')
      expect(vm.getCaseStatusType('skip')).toBe('info')
    })
  })
  
  describe('分页功能', () => {
    it('分页大小变化应该触发相应处理', () => {
      const vm = wrapper.vm
      const mockLoadTestCaseResults = vi.spyOn(vm, 'loadTestCaseResults')
      vm.loadTestCaseResults = mockLoadTestCaseResults
      
      vm.handleSizeChange(20)
      
      expect(vm.pagination.pageSize).toBe(20)
      expect(mockLoadTestCaseResults).toHaveBeenCalled()
    })
    
    it('当前页变化应该触发相应处理', () => {
      const vm = wrapper.vm
      const mockLoadTestCaseResults = vi.spyOn(vm, 'loadTestCaseResults')
      vm.loadTestCaseResults = mockLoadTestCaseResults
      
      vm.handleCurrentChange(2)
      
      expect(vm.pagination.currentPage).toBe(2)
      expect(mockLoadTestCaseResults).toHaveBeenCalled()
    })
  })
  
  describe('任务操作', () => {
    it('点击返回按钮应该返回上一页', async () => {
      const backButton = wrapper.find('.el-button:first-child')
      await backButton.trigger('click')
      
      expect(mockRouter.back).toHaveBeenCalled()
    })
    
    it('点击重新执行按钮应该跳转到新增任务页', async () => {
      const vm = wrapper.vm
      vm.taskDetail = { envId: '1', branchId: '2' }
      
      const retryButton = wrapper.find('.el-button:nth-child(2)')
      await retryButton.trigger('click')
      
      expect(mockRouter.push).toHaveBeenCalledWith({
        path: '/task/add',
        query: { envId: '1', branchId: '2' }
      })
    })
  })
  
  describe('边界情况', () => {
    it('加载任务详情失败应该处理', async () => {
      const vm = wrapper.vm
      
      // Mock全局fetch失败
      global.fetch = vi.fn().mockResolvedValue({
        json: vi.fn().mockResolvedValue({
          success: false,
          message: '获取任务详情失败'
        })
      })
      
      await vm.loadTaskDetail()
      
      expect(vm.loading).toBe(false)
      expect(ElMessage).toHaveBeenCalledWith({
        message: '获取任务详情失败',
        type: 'error'
      })
    })
    
    it('没有任务ID应该提示并返回', () => {
      // 修改route参数
      mockRoute.params.id = ''
      
      expect(() => mount(TaskDetail)).not.toThrow()
      expect(mockRouter.replace).toHaveBeenCalledWith('/')
    })
    
    it('用例列表为空时应该显示空状态', () => {
      const vm = wrapper.vm
      vm.testCases = []
      
      expect(wrapper.find('.empty').exists()).toBe(true)
    })
  })
  
  describe('数据格式化', () => {
    it('执行时间格式化应该正确', () => {
      const vm = wrapper.vm
      const startTime = '2023-01-01 10:00:00'
      const endTime = '2023-01-01 10:30:00'
      
      expect(vm.formatDuration(startTime, endTime)).toBe('30分钟')
    })
    
    it('没有结束时间时应该显示运行中', () => {
      const vm = wrapper.vm
      const startTime = '2023-01-01 10:00:00'
      
      expect(vm.formatDuration(startTime)).toBe('运行中')
    })
  })
})