import axios from 'axios';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  
  // 配置axios实例
  const api = axios.create({
    baseURL: 'http://localhost:8000/api',
    timeout: 10000,
    withCredentials: true, // 允许携带cookie
    headers: {
      'Content-Type': 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  });

  // 测试结果对象
  const testResult = {
    timestamp: new Date().toISOString(),
    success: false,
    message: '',
    details: {},
  };

  try {
    console.log('开始测试登录功能...');
    console.log('测试用户: test/test@123');
    
    // 执行登录请求
    const loginResponse = await api.post('/user/login/', {
      username: 'test',
      password: 'test@123',
    });
    
    testResult.details.loginResponse = {
      status: loginResponse.status,
      data: loginResponse.data,
      headers: JSON.stringify(loginResponse.headers, null, 2),
    };
    
    if (loginResponse.status === 200) {
      testResult.success = true;
      testResult.message = '登录测试成功！没有CSRF错误。';
      console.log('✅ 登录测试成功！没有CSRF错误。');
      
      // 验证是否可以访问需要认证的接口
      try {
        const environmentsResponse = await api.get('/environments/?page=1&pageSize=10');
        testResult.details.environmentsResponse = {
          status: environmentsResponse.status,
          data: environmentsResponse.data,
        };
        console.log('✅ 环境列表接口访问成功，认证有效。');
      } catch (envError) {
        testResult.details.environmentsError = {
          message: envError.message,
          response: envError.response ? {
            status: envError.response.status,
            data: envError.response.data,
          } : null,
        };
        console.log('⚠️ 登录成功但访问环境列表接口失败:', envError.message);
      }
    } else {
      testResult.success = false;
      testResult.message = `登录失败，状态码: ${loginResponse.status}`;
      console.log(`❌ 登录失败，状态码: ${loginResponse.status}`);
    }
  } catch (error) {
    testResult.success = false;
    testResult.message = `登录请求失败: ${error.message}`;
    testResult.details.error = {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers ? JSON.stringify(error.response.headers, null, 2) : null,
      } : null,
    };
    console.log('❌ 登录请求失败:', error.message);
    if (error.response?.data) {
      console.log('错误详情:', error.response.data);
    }
  }
  
  // 保存测试结果到日志文件
  const logFilePath = join(__dirname, 'login_test.log');
  try {
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`\n测试结果已保存到: ${logFilePath}`);
  } catch (writeError) {
    console.error('保存测试结果失败:', writeError.message);
  }
  
  // 如果测试失败，以非零状态码退出
  if (!testResult.success) {
    process.exit(1);
  }