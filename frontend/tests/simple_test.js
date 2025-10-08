import fs from 'fs';
import path from 'path';
import axios from 'axios';

// 配置参数
const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 30000;
const TEST_USER = {
  username: 'test',
  password: 'test@123'
};

// 提取Cookie和CSRF令牌
function extractCookies(responseHeaders) {
  const cookies = {};
  const setCookieHeaders = responseHeaders['set-cookie'] || [];
  
  setCookieHeaders.forEach(cookieHeader => {
    const parts = cookieHeader.split(';');
    const cookiePart = parts[0];
    const [key, value] = cookiePart.split('=');
    cookies[key.trim()] = value.trim();
  });
  
  return cookies;
}

function createCookieString(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

function getCSRFToken(cookies) {
  return cookies['csrftoken'] || '';
}

// 生成测试模块数据
function generateTestModuleData() {
  const timestamp = Date.now();
  return {
    module_name: `SimpleModule_${timestamp}`,
    chip_model: 'TestChip',
    description: 'Simple test module',
    visible_scope: 'all'
  };
}

// 简单测试函数
async function runSimpleTest() {
  try {
    console.log('=== 简化版测试脚本 ===');
    console.log('测试时间:', new Date().toLocaleString());
    
    // 创建axios实例
    const api = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    // 1. 登录测试
    console.log('\n1. 登录系统...');
    const loginResponse = await api.post('/api/user/login/', TEST_USER);
    
    if (loginResponse.status === 200) {
      console.log('✓ 登录成功！用户信息:', loginResponse.data.username);
      
      // 提取Cookie
      const cookies = extractCookies(loginResponse.headers);
      console.log('✓ Cookie提取成功:', Object.keys(cookies).join(', '));
      
      // 提取CSRF令牌
      const csrfToken = getCSRFToken(cookies);
      console.log('✓ CSRF令牌提取成功');
      
      // 设置认证信息
      api.defaults.headers.Cookie = createCookieString(cookies);
      api.defaults.headers['X-CSRFToken'] = csrfToken;
      
      // 如果有token也使用token认证
      if (loginResponse.data && loginResponse.data.token) {
        api.defaults.headers['Authorization'] = `Token ${loginResponse.data.token}`;
        console.log('✓ 同时使用Token认证');
      }
      
      console.log('\n2. 创建测试模块...');
      const moduleData = generateTestModuleData();
      console.log('发送的数据:', JSON.stringify(moduleData, null, 2));
      
      try {
        const createModuleResponse = await api.post('/api/modules/', moduleData);
        console.log('✓ 创建模块成功！状态码:', createModuleResponse.status);
        console.log('响应数据:', JSON.stringify(createModuleResponse.data, null, 2));
        
        // 清理：删除创建的模块
        if (createModuleResponse.data && createModuleResponse.data.id) {
          await api.delete(`/api/modules/${createModuleResponse.data.id}/`);
          console.log('✓ 测试模块已清理');
        }
        
        return true;
      } catch (createError) {
        console.error('✗ 创建模块失败:', createError.message);
        if (createError.response) {
          console.error('  状态码:', createError.response.status);
          console.error('  响应数据:', JSON.stringify(createError.response.data, null, 2));
          console.error('  响应头:', JSON.stringify(createError.response.headers, null, 2));
        }
        return false;
      }
    } else {
      console.error('✗ 登录失败，状态码:', loginResponse.status);
      console.error('  响应数据:', loginResponse.data);
      return false;
    }
  } catch (error) {
    console.error('✗ 测试执行过程中发生错误:', error.message);
    if (error.response) {
      console.error('  状态码:', error.response.status);
      console.error('  响应数据:', error.response.data);
    }
    return false;
  }
}

// 执行测试
runSimpleTest().then(result => {
  console.log('\n测试结果:', result ? '通过' : '失败');
  process.exit(result ? 0 : 1);
});