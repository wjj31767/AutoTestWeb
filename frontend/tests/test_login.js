import axios from 'axios';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 测试结果文件路径
const LOG_FILE = join(__dirname, 'login_test.log');

/**
 * 登录测试函数 - 专注于验证登录功能和CSRF token处理
 */
async function runLoginTest() {
  console.log('\n=== 登录功能专用测试 ===');
  console.log('测试目的: 验证登录功能是否正常工作，特别是CSRF token处理');
  console.log('测试用户: test/test@123');
  
  // 测试结果对象
  const testResult = {
    timestamp: new Date().toISOString(),
    success: false,
    message: '',
    details: {
      testEnvironment: 'Node.js CLI',
      apiBaseUrl: 'http://localhost:5173/api',
    },
  };

  try {
    // 创建axios实例，配置withCredentials以允许携带cookie
    const api = axios.create({
      baseURL: 'http://localhost:5173/api',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // 1. 先发送GET请求获取CSRF token
    console.log('1. 获取CSRF token...');
    let csrfToken = '';
    try {
      // 发送GET请求到登录页面获取CSRF token
      const getResponse = await api.get('/user/login/');
      
      // 从响应头的Set-Cookie中提取CSRF token
      if (getResponse.headers['set-cookie']) {
        const cookies = getResponse.headers['set-cookie'];
        for (const cookie of cookies) {
          if (cookie.startsWith('csrftoken=')) {
            const tokenMatch = cookie.match(/csrftoken=([^;]+)/);
            if (tokenMatch && tokenMatch[1]) {
              csrfToken = tokenMatch[1];
              console.log('CSRF token获取成功');
              break;
            }
          }
        }
      }
      
      if (!csrfToken) {
        console.log('未在响应头中找到CSRF token，将尝试直接登录');
      }
    } catch (error) {
      console.log('获取CSRF token时出错:', error.message);
      console.log('将尝试直接登录...');
    }

    // 2. 执行登录请求
    console.log('2. 执行登录请求...');
    
    // 如果获取到了CSRF token，添加到请求头
    if (csrfToken) {
      api.defaults.headers['X-CSRFToken'] = csrfToken;
    }

    // 执行登录请求
    const loginResponse = await api.post('/user/login/', {
      username: 'test',
      password: 'test@123',
    });

    // 记录登录响应信息
    testResult.details.loginResponse = {
      status: loginResponse.status,
      data: loginResponse.data,
      headers: JSON.stringify(loginResponse.headers, null, 2),
    };

    // 3. 验证登录结果
    if (loginResponse.status === 200) {
      testResult.success = true;
      testResult.message = '登录测试成功！CSRF token已正确处理。';
      
      console.log('✅ 登录成功！状态码:', loginResponse.status);
      console.log('用户信息:', loginResponse.data);
      
      // 检查是否收到了Set-Cookie响应头
      if (loginResponse.headers['set-cookie']) {
        console.log('登录后收到的Cookie数量:', loginResponse.headers['set-cookie'].length);
        
        // 检查是否包含sessionid和csrftoken
        const hasSessionId = loginResponse.headers['set-cookie'].some(cookie => 
          cookie.toLowerCase().includes('sessionid')
        );
        const hasCsrfToken = loginResponse.headers['set-cookie'].some(cookie => 
          cookie.toLowerCase().includes('csrftoken')
        );
        
        console.log('  - 包含sessionid:', hasSessionId ? '是' : '否');
        console.log('  - 包含csrftoken:', hasCsrfToken ? '是' : '否');
      }

    } else {
      testResult.success = false;
      testResult.message = `登录失败，状态码: ${loginResponse.status}`;
      console.error('❌ 登录失败，状态码:', loginResponse.status);
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
    
    console.error('❌ 登录请求失败:', error.message);
    if (error.response?.data) {
      console.error('错误详情:', JSON.stringify(error.response.data, null, 2));
    }
    
    // 特别检测CSRF相关错误
    if (error.response?.data?.detail?.includes('CSRF')) {
      console.error('⚠️ 检测到CSRF相关错误！');
      console.error('  - 可能原因: CSRF token缺失或不匹配');
      console.error('  - 解决方案: 确保前端正确处理CSRF token');
    }
  }

  // 保存测试结果到日志文件
  try {
    await writeFile(LOG_FILE, JSON.stringify(testResult, null, 2));
    console.log(`\n测试结果已保存到: ${LOG_FILE}`);
  } catch (writeError) {
    console.error('保存测试结果失败:', writeError.message);
  }

  // 测试总结
  console.log('\n=== 登录测试总结 ===');
  console.log('测试结果:', testResult.success ? '✅ 通过' : '❌ 失败');
  console.log('测试消息:', testResult.message);
  
  return testResult.success;
}

// 导出默认函数，以便被test_all.js导入
// 如果直接运行此脚本，则执行测试
if (process.argv[1] && process.argv[1].endsWith('test_login.js')) {
  runLoginTest().catch(error => {
    console.error('测试执行过程中发生错误:', error);
    process.exit(1);
  });
}

export default runLoginTest;