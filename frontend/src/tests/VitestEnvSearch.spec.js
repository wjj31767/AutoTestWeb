import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EnvList from '../views/EnvList.vue'
import { ElMessage } from 'element-plus'

// 创建一个mock的axios实例
const mockAxiosInstance = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
}

// 模拟axios
vi.mock('axios', () => ({
  __esModule: true,
  default: {
    create: vi.fn(() => mockAxiosInstance),
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn()
      },
      response: {
        use: vi.fn()
      }
    }
  }
}))

// 模拟vue-router模块，使用自包含的定义
vi.mock('vue-router', () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    beforeEach: vi.fn()
  })),
  createWebHistory: vi.fn(() => ({})),
  createRouter: vi.fn(() => ({
    push: vi.fn(),
    beforeEach: vi.fn()
  }))
}))

// 模拟element-plus的ElMessage
vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElMessage: vi.fn()
  }
})

// 模拟环境列表数据
const mockEnvData = {
  count: 6,
  next: null,
  previous: null,
  results: [
    {
      id: 'env-fpga-001',
      name: 'FPGA测试环境1',
      type: 'FPGA',
      status: 'available',
      ip: '192.168.1.101',
      admin: 'admin1'
    },
    {
      id: 'env-fpga-002',
      name: 'FPGA生产环境',
      type: 'FPGA',
      status: 'occupied',
      ip: '192.168.1.201',
      admin: 'root'
    },
    {
      id: 'env-sim-001',
      name: '仿真测试环境',
      type: 'simulation',
      status: 'available',
      ip: '192.168.1.102',
      admin: 'admin2'
    },
    {
      id: 'env-sim-002',
      name: '大规模仿真环境',
      type: 'simulation',
      status: 'maintenance',
      ip: '192.168.1.202',
      admin: 'admin3'
    },
    {
      id: 'env-board-001',
      name: '测试板A',
      type: 'testboard',
      status: 'available',
      ip: '192.168.1.103',
      admin: 'admin4'
    },
    {
      id: 'env-board-002',
      name: '测试板B',
      type: 'testboard',
      status: 'occupied',
      ip: '192.168.1.203',
      admin: 'admin5'
    }
  ]
};

describe('EnvList组件 - 环境搜索功能测试', () => {
  let wrapper

  beforeEach(() => {
    // 重置mock
    vi.clearAllMocks()
    
    // 确保在挂载组件之前，mockAxiosInstance.get已经设置了默认的mock实现
    // 这样可以响应组件在挂载时自动发起的请求
    mockAxiosInstance.get.mockResolvedValue(mockEnvData)
    
    // 挂载组件
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
        },
        mocks: {
          $router: {
            push: vi.fn(),
            beforeEach: vi.fn()
          },
          $route: {
            query: {}
          }
        }
      }
    })
  })

  it('组件加载时应正确初始化搜索表单', () => {
    // 验证搜索表单数据初始化为空
    const searchForm = wrapper.vm.searchForm;
    expect(searchForm.name).toBe('');
    expect(searchForm.type).toBe('');
    expect(searchForm.status).toBe('');
    expect(searchForm.ip).toBe('');
  });

  it('点击搜索按钮应触发搜索功能并正确传递参数', async () => {
    // 准备测试数据
    const searchParams = {
      name: 'FPGA',
      type: 'FPGA',
      status: 'available',
      ip: '192.168.1.101'
    }

    // 设置搜索表单数据
    wrapper.vm.searchForm = { ...searchParams }
    
    // 模拟API调用返回数据
    const mockResponse = {
      count: 1,
      results: [{ id: 'env-fpga-001', ...searchParams }]
    }
    mockAxiosInstance.get.mockResolvedValue(mockResponse)

    // 找到搜索按钮并点击
    const searchButton = wrapper.find('button:contains("搜索")')
    await searchButton.trigger('click')

    // 验证API调用参数
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          search: 'FPGA 192.168.1.101',
          type: 'FPGA',
          status: 'available',
          page: 1,
          page_size: 10
        }
      }
    )
  })

  it('搜索时应正确合并name和ip为search参数', async () => {
    // 准备测试数据
    const searchParams = {
      name: '测试环境',
      ip: '192.168.1.101',
      type: '',
      status: ''
    }

    // 设置搜索表单数据
    wrapper.vm.searchForm = { ...searchParams }
    
    // 模拟API调用返回数据
    mockAxiosInstance.get.mockResolvedValue(mockEnvData)

    // 调用搜索方法
    await wrapper.vm.handleSearch()

    // 验证API调用参数
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          search: '测试环境 192.168.1.101',
          page: 1,
          page_size: 10
        }
      }
    )
  })

  it('点击重置按钮应清空搜索表单并重新加载数据', async () => {
    // 先设置搜索表单数据
    const searchParams = {
      name: 'FPGA',
      type: 'FPGA',
      status: 'available',
      ip: '192.168.1.101'
    }
    wrapper.vm.searchForm = { ...searchParams }
    
    // 模拟API调用返回数据
    mockAxiosInstance.get.mockResolvedValue(mockEnvData)

    // 找到重置按钮并点击
    const resetButton = wrapper.find('button:contains("重置")')
    await resetButton.trigger('click')

    // 验证搜索表单数据被清空
    const searchForm = wrapper.vm.searchForm
    expect(searchForm.name).toBe('')
    expect(searchForm.type).toBe('')
    expect(searchForm.status).toBe('')
    expect(searchForm.ip).toBe('')

    // 验证重新加载数据
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          page: 1,
          page_size: 10
        }
      }
    )
  })

  it('仅设置type参数时应正确传递搜索参数', async () => {
    // 设置搜索表单数据
    wrapper.vm.searchForm = {
      name: '',
      type: 'simulation',
      status: '',
      ip: ''
    }
    
    // 模拟API调用返回数据
    const mockResponse = {
      count: 2,
      results: mockEnvData.results.filter(env => env.type === 'simulation')
    }
    mockAxiosInstance.get.mockResolvedValue(mockResponse)

    // 调用搜索方法
    await wrapper.vm.handleSearch()

    // 验证API调用参数
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          type: 'simulation',
          page: 1,
          page_size: 10
        }
      }
    )
  })

  it('仅设置status参数时应正确传递搜索参数', async () => {
    // 设置搜索表单数据
    wrapper.vm.searchForm = {
      name: '',
      type: '',
      status: 'occupied',
      ip: ''
    }
    
    // 模拟API调用返回数据
    const mockResponse = {
      count: 2,
      results: mockEnvData.results.filter(env => env.status === 'occupied')
    }
    mockAxiosInstance.get.mockResolvedValue(mockResponse)

    // 调用搜索方法
    await wrapper.vm.handleSearch()

    // 验证API调用参数
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          status: 'occupied',
          page: 1,
          page_size: 10
        }
      }
    )
  })

  it('搜索时应重置页码为1', async () => {
    // 先设置当前页码为2
    wrapper.vm.pageInfo.page = 2
    
    // 设置搜索表单数据
    wrapper.vm.searchForm = {
      name: '测试板',
      type: '',
      status: '',
      ip: ''
    }
    
    // 模拟API调用返回数据
    mockAxiosInstance.get.mockResolvedValue(mockEnvData)

    // 调用搜索方法
    await wrapper.vm.handleSearch()

    // 验证页码被重置为1
    expect(wrapper.vm.pageInfo.page).toBe(1)
    
    // 验证API调用参数中的页码
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          search: '测试板',
          page: 1,
          page_size: 10
        }
      }
    )
  })

  it('loadEnvList方法应正确处理API错误', async () => {
    // 模拟API调用失败
    const errorResponse = {
      response: {
        status: 500,
        data: { detail: '服务器错误' }
      }
    }
    mockAxiosInstance.get.mockRejectedValue(errorResponse)

    // 调用loadEnvList方法
    await wrapper.vm.loadEnvList()

    // 验证错误处理
    expect(ElMessage).toHaveBeenCalledWith('获取环境列表失败: 服务器错误')
  })

  it('分页组件变化时应重新加载数据并保持搜索条件', async () => {
    // 先设置搜索条件和页码
    wrapper.vm.searchForm = {
      name: 'FPGA',
      type: 'FPGA',
      status: '',
      ip: ''
    }
    
    // 模拟API调用返回数据
    mockAxiosInstance.get.mockResolvedValue(mockEnvData)

    // 模拟分页变化
    await wrapper.vm.handleCurrentChange(2)

    // 验证API调用参数包含搜索条件和新页码
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          search: 'FPGA',
          type: 'FPGA',
          page: 2,
          page_size: 10
        }
      }
    )
  })

  it('当name和ip都为空时不应传递search参数', async () => {
    // 设置搜索表单数据，name和ip都为空
    wrapper.vm.searchForm = {
      name: '',
      type: 'FPGA',
      status: 'available',
      ip: ''
    }
    
    // 模拟API调用返回数据
    mockAxiosInstance.get.mockResolvedValue(mockEnvData)

    // 调用搜索方法
    await wrapper.vm.handleSearch()

    // 验证API调用参数
    const calledParams = mockAxiosInstance.get.mock.calls[0][1].params
    expect(calledParams).not.toHaveProperty('search')
    expect(calledParams.type).toBe('FPGA')
    expect(calledParams.status).toBe('available')
    expect(calledParams.page).toBe(1)
  })

  it('应正确处理搜索参数中的特殊字符', async () => {
    // 设置包含特殊字符的搜索表单数据
    wrapper.vm.searchForm = {
      name: 'test@#$%^&*()',
      type: '',
      status: '',
      ip: ''
    }
    
    // 模拟API调用返回数据
    mockAxiosInstance.get.mockResolvedValue(mockEnvData)

    // 调用搜索方法
    await wrapper.vm.handleSearch()

    // 验证特殊字符被正确传递
    expect(mockAxiosInstance.get).toHaveBeenCalledWith(
      '/api/environments/',
      {
        params: {
          search: 'test@#$%^&*()',
          page: 1,
          page_size: 10
        }
      }
    )
  })
})