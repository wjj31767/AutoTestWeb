import { describe, it, expect, beforeEach, afterEach, vi } from '@jest/globals';
import { mount } from '@vue/test-utils';
import EnvList from '../views/EnvList.vue';
import { ElMessage } from 'element-plus';
import * as envApi from '../api/env';

// Mock Element Plus组件
vi.mock('element-plus', () => ({
  ElMessage: {
    error: vi.fn(),
    success: vi.fn(),
    warning: vi.fn()
  }
}));

// Mock路由
const mockRouter = {
  push: vi.fn()
};

vi.mock('vue-router', () => ({
  useRouter: () => mockRouter
}));

// Mock API调用
vi.mock('../api/env', () => ({
  getEnvironmentList: vi.fn()
}));

describe('环境查找功能测试', () => {
  let wrapper;
  let mockGetEnvironmentList;

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetEnvironmentList = vi.spyOn(envApi, 'getEnvironmentList');
    
    // 模拟API响应
    mockGetEnvironmentList.mockResolvedValue({
      data: {
        results: [],
        count: 0
      }
    });

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
          'el-pagination': { template: '<div class="pagination"></div>' }
        }
      }
    });
  });

  afterEach(() => {
    wrapper.unmount();
  });

  describe('环境查找功能测试', () => {
    it('按名称模糊搜索 - 应正确构建搜索参数并调用API', async () => {
      const vm = wrapper.vm;
      const searchInput = wrapper.find('input[placeholder="请输入环境名称"]');
      await searchInput.setValue('测试环境');
      
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 验证参数构建和API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '测试环境',
        type: '',
        status: '',
        page: 1,
        pageSize: vm.pagination.pageSize
      });
      
      // 验证页码重置
      expect(vm.pagination.currentPage).toBe(1);
    });

    it('按环境类型搜索 - 应正确构建搜索参数并调用API', async () => {
      const vm = wrapper.vm;
      vm.searchForm.type = 'FPGA';
      
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 验证参数构建和API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '',
        type: 'FPGA',
        status: '',
        page: 1,
        pageSize: vm.pagination.pageSize
      });
    });

    it('按环境状态搜索 - 应正确构建搜索参数并调用API', async () => {
      const vm = wrapper.vm;
      vm.searchForm.status = 'available';
      
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 验证参数构建和API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '',
        type: '',
        status: 'available',
        page: 1,
        pageSize: vm.pagination.pageSize
      });
    });

    it('组合条件搜索 - 名称+类型 - 应正确构建搜索参数并调用API', async () => {
      const vm = wrapper.vm;
      const searchInput = wrapper.find('input[placeholder="请输入环境名称"]');
      await searchInput.setValue('测试');
      vm.searchForm.type = 'FPGA';
      
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 验证参数构建和API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '测试',
        type: 'FPGA',
        status: '',
        page: 1,
        pageSize: vm.pagination.pageSize
      });
    });

    it('组合条件搜索 - 类型+状态 - 应正确构建搜索参数并调用API', async () => {
      const vm = wrapper.vm;
      vm.searchForm.type = 'FPGA';
      vm.searchForm.status = 'available';
      
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 验证参数构建和API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '',
        type: 'FPGA',
        status: 'available',
        page: 1,
        pageSize: vm.pagination.pageSize
      });
    });

    it('重置搜索条件 - 应清空所有搜索表单数据', async () => {
      const vm = wrapper.vm;
      const searchInput = wrapper.find('input[placeholder="请输入环境名称"]');
      await searchInput.setValue('测试环境');
      vm.searchForm.type = 'FPGA';
      vm.searchForm.status = 'available';
      
      const resetButton = wrapper.find('.el-button').filter(node => {
        return node.text().includes('重置');
      });
      await resetButton.trigger('click');
      
      // 验证搜索条件被清空
      expect(vm.searchForm.name).toBe('');
      expect(vm.searchForm.type).toBe('');
      expect(vm.searchForm.status).toBe('');
      expect(vm.searchForm.ip).toBe('');
    });

    it('搜索结果为空 - 应正确处理空结果情况', async () => {
      // 模拟空结果响应
      mockGetEnvironmentList.mockResolvedValue({
        data: {
          results: [],
          count: 0
        }
      });
      
      const vm = wrapper.vm;
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 验证API调用
      expect(mockGetEnvironmentList).toHaveBeenCalled();
    });

    it('搜索结果包含数据 - 应正确设置环境列表数据', async () => {
      // 模拟有结果的响应
      const mockResults = [
        {
          id: 'env-1',
          name: '测试环境1',
          type: 'FPGA',
          status: 'available',
          ip: '192.168.1.101'
        },
        {
          id: 'env-2',
          name: '测试环境2',
          type: 'simulation',
          status: 'occupied',
          ip: '192.168.1.102'
        }
      ];
      
      mockGetEnvironmentList.mockResolvedValue({
        data: {
          results: mockResults,
          count: 2
        }
      });
      
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 等待nextTick确保数据已更新
      await wrapper.vm.$nextTick();
      
      // 验证环境列表数据被正确设置
      expect(wrapper.vm.envList).toEqual(mockResults);
      expect(wrapper.vm.totalCount).toBe(2);
    });

    it('分页功能 - 切换页码应重新加载数据', async () => {
      const vm = wrapper.vm;
      
      // 测试页码变化
      vm.handleCurrentChange(2);
      
      // 验证API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '',
        type: '',
        status: '',
        page: 2,
        pageSize: vm.pagination.pageSize
      });
    });

    it('分页功能 - 切换每页条数应重新加载数据并重置页码', async () => {
      const vm = wrapper.vm;
      
      // 测试每页条数变化
      vm.handleSizeChange(20);
      
      // 验证API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '',
        type: '',
        status: '',
        page: 1,  // 页码应该重置为1
        pageSize: 20
      });
    });

    it('刷新功能 - 应重新加载当前搜索条件的数据', async () => {
      const vm = wrapper.vm;
      const searchInput = wrapper.find('input[placeholder="请输入环境名称"]');
      await searchInput.setValue('刷新测试');
      
      // 先执行一次搜索
      const searchButton = wrapper.find('.el-button[type="primary"]');
      await searchButton.trigger('click');
      
      // 清空mock调用记录
      mockGetEnvironmentList.mockClear();
      
      // 执行刷新
      const refreshButton = wrapper.find('.el-button').filter(node => {
        return node.text().includes('刷新');
      });
      await refreshButton.trigger('click');
      
      // 验证API调用
      expect(mockGetEnvironmentList).toHaveBeenCalledWith({
        search: '刷新测试',
        type: '',
        status: '',
        page: 1,
        pageSize: vm.pagination.pageSize
      });
    });
  });
});