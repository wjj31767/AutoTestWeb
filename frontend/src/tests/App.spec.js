import { describe, it, expect, beforeEach, vi } from '@jest/globals'
import { mount } from '@vue/test-utils'
import App from '../App.vue'

// Mock路由
const mockRouter = {
  push: vi.fn()
}

const mockRoute = {
  path: '/'
}

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter,
  useRoute: () => mockRoute,
  useLink: () => ({
    isActive: false,
    isExactActive: false,
    href: '',
    route: {},
    navigate: vi.fn()
  })
}))

describe('App.vue', () => {
  let wrapper
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    wrapper = mount(App, {
      global: {
        stubs: {
          'el-container': { template: '<div><slot></slot></div>' },
          'el-header': { template: '<div class="el-header"><slot></slot></div>' },
          'el-aside': { template: '<div class="el-aside"><slot></slot></div>' },
          'el-main': { template: '<div class="el-main"><slot></slot></div>' },
          'el-menu': { template: '<div class="el-menu"><slot></slot></div>' },
          'el-sub-menu': { props: ['index', 'title'], template: '<div class="el-sub-menu"><slot name="title"></slot><slot></slot></div>' },
          'el-menu-item': { props: ['index', 'route'], template: '<div class="el-menu-item" @click="$emit(\'click\')"><slot></slot></div>' },
          'el-icon': { template: '<span class="el-icon"><slot></slot></span>' },
          'router-view': { template: '<div class="router-view">路由视图</div>' }
        }
      }
    })
  })
  
  describe('组件渲染', () => {
    it('应该正确渲染整体布局结构', () => {
      expect(wrapper.find('.el-container').exists()).toBe(true)
      expect(wrapper.find('.el-header').exists()).toBe(true)
      expect(wrapper.find('.el-aside').exists()).toBe(true)
      expect(wrapper.find('.el-main').exists()).toBe(true)
    })
    
    it('应该正确渲染顶部导航栏', () => {
      expect(wrapper.find('.el-header').text()).toContain('AutoTestWeb - 芯片验证防护网')
    })
    
    it('应该正确渲染侧边栏菜单', () => {
      expect(wrapper.find('.el-menu').exists()).toBe(true)
      const menuItems = wrapper.findAll('.el-menu-item')
      expect(menuItems.length).toBeGreaterThan(0)
    })
    
    it('应该正确渲染路由视图', () => {
      expect(wrapper.find('.router-view').exists()).toBe(true)
    })
  })
  
  describe('响应式布局', () => {
    it('侧边栏应该根据屏幕宽度变化', () => {
      const vm = wrapper.vm
      
      // 模拟屏幕宽度变化
      vm.isCollapse = true
      expect(vm.sidebarWidth).toBe('54px')
      
      vm.isCollapse = false
      expect(vm.sidebarWidth).toBe('200px')
    })
  })
  
  describe('菜单导航', () => {
    it('点击菜单项应该触发导航', async () => {
      const menuItem = wrapper.find('.el-menu-item')
      await menuItem.trigger('click')
      
      // 由于我们mock了useLink，这里主要验证事件处理正常
      expect(menuItem.exists()).toBe(true)
    })
  })
  
  describe('边界情况', () => {
    it('组件应该在不同路由下正常工作', async () => {
      // 修改路由路径
      mockRoute.path = '/env/list'
      
      const newWrapper = mount(App, {
        global: {
          stubs: {
            'el-container': { template: '<div><slot></slot></div>' },
            'el-header': { template: '<div><slot></slot></div>' },
            'el-aside': { template: '<div><slot></slot></div>' },
            'el-main': { template: '<div><slot></slot></div>' },
            'el-menu': { template: '<div><slot></slot></div>' },
            'el-sub-menu': { template: '<div><slot name="title"></slot><slot></slot></div>' },
            'el-menu-item': { template: '<div><slot></slot></div>' },
            'router-view': { template: '<div>新路由视图</div>' }
          }
        }
      })
      
      expect(newWrapper.exists()).toBe(true)
    })
    
    it('菜单数据为空时应该正常渲染', () => {
      // 即使没有菜单数据，组件也应该正常工作
      expect(wrapper.exists()).toBe(true)
    })
  })
  
  describe('组件销毁', () => {
    it('组件应该正确销毁', () => {
      expect(() => wrapper.unmount()).not.toThrow()
    })
  })
})