import axios from 'axios';
import { getEnvironmentList } from '../api/env.js';

// 测试获取环境列表的API请求
export const testEnvironmentApi = async () => {
  try {
    console.log('开始测试环境列表API请求...');
    
    // 检查是否需要认证
    console.log('检查API是否需要认证...');
    
    // 尝试获取认证token（如果有的话）
    let authToken = null;
    try {
      // 尝试从localStorage获取token（如果在浏览器环境）
      if (typeof window !== 'undefined' && window.localStorage) {
        authToken = window.localStorage.getItem('token') || window.localStorage.getItem('authToken');
      }
      
      if (!authToken) {
        console.log('未找到本地token，尝试直接访问API...');
      } else {
        console.log('已找到认证token，将用于API请求');
      }
    } catch (error) {
      console.log('获取本地token失败:', error.message);
    }
    
    // 准备测试参数
    const params = {
      name: '',
      type: '',
      status: '',
      ip: '',
      page: 1,
      pageSize: 10
    };
    
    console.log('请求参数:', params);
    
    // 发送请求
    const response = await getEnvironmentList(params);
    
    // 打印响应结果
    console.log('API请求成功!');
    console.log('响应状态码:', response.status);
    console.log('响应数据:', response.data);
    
    // 验证响应数据结构
    if (response.data && response.data.results) {
      console.log('环境列表数据:', response.data.results);
      console.log('总条数:', response.data.count);
    } else if (response.data && Array.isArray(response.data)) {
      console.log('环境列表数据:', response.data);
      console.log('环境总数:', response.data.length);
    }
    
    console.log('测试完成!');
    return { success: true, data: response.data };
  } catch (error) {
    console.error('API请求失败:', error);
    
    // 详细打印错误信息
    if (error.response) {
      console.error('错误状态码:', error.response.status);
      console.error('错误数据:', error.response.data);
      
      // 特别处理认证错误
      if (error.response.status === 401) {
        console.error('认证失败: API需要有效的认证凭证');
        console.log('\n解决方案建议:');
        console.log('1. 先通过前端界面登录获取认证token');
        console.log('2. 或者修改API测试脚本，手动添加有效的认证token');
        console.log('3. 检查axios拦截器中的token处理逻辑');
      }
      // 处理404错误
      else if (error.response.status === 404) {
        console.error('资源未找到: 确认API路径是否正确');
        console.log('\n解决方案建议:');
        console.log('1. 检查后端是否正确注册了/environments/ API');
        console.log('2. 确认Vite代理配置是否正确转发了请求');
        console.log('3. 验证后端服务器是否正在运行');
      }
    } else if (error.request) {
      console.error('请求已发送但未收到响应:', error.request);
      console.log('\n解决方案建议:');
      console.log('1. 确认后端服务器是否正在运行');
      console.log('2. 检查网络连接是否正常');
      console.log('3. 验证防火墙设置是否阻止了连接');
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    console.log('测试失败!');
    return { success: false, error: error.message };
  }
};

// 如果直接运行此脚本，则执行测试
if (import.meta.url === new URL(import.meta.url, import.meta.url).href) {
  testEnvironmentApi();
}