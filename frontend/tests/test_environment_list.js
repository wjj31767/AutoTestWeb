import axios from 'axios';
import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * 自动化测试脚本 - 验证登录和环境列表接口
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 调用环境列表接口并验证返回数据
 * 3. 打印测试结果和详细信息
 * 
 * 注意：在Node.js环境中，需要手动处理Cookie，
 * 浏览器环境会自动处理Cookie，因此建议在浏览器中进行最终验证
 */

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置参数
const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 10000;
const TEST_USER = {
  username: 'test',
  password: 'test@123'
};

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

// 保存测试结果到文件
async function saveTestResult(result) {
  try {
    const logFilePath = join(__dirname, 'environment_list_test.log');
    await appendFile(
      logFilePath,
      JSON.stringify(result) + '\n'
    );
    console.log(`测试结果已保存到: ${logFilePath}`);
  } catch (error) {
    console.error('保存测试结果失败:', error.message);
  }
}

// 手动处理Cookie
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

// 测试函数
async function runEnvironmentListTest() {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    environmentList: { success: false, message: '', status: null, data: null },
    cookies: null
  };

  try {
    console.log('\n=== 自动化测试：环境列表接口 ===');
    console.log('测试时间:', new Date().toLocaleString());
    console.log('测试用户:', TEST_USER.username);

    // 1. 登录测试
    console.log('\n1. 开始登录...');
    const loginResponse = await api.post('/api/user/login/', TEST_USER);
    
    testResults.login.status = loginResponse.status;
    testResults.login.data = loginResponse.data;
    
    if (loginResponse.status === 200) {
      testResults.login.success = true;
      testResults.login.message = '登录成功';
      console.log('✓ 登录成功！用户信息:', loginResponse.data.username);
      
      // 提取并保存Cookie
      testResults.cookies = extractCookies(loginResponse.headers);
      console.log('  - 登录响应头中的set-cookie:', Object.keys(loginResponse.headers).filter(h => h.toLowerCase().includes('cookie')));
      console.log('  - 提取到的Cookie:', testResults.cookies);
    } else {
      testResults.login.message = `登录失败，状态码: ${loginResponse.status}`;
      console.error('✗ 登录失败:', testResults.login.message);
    }

    // 2. 环境列表接口测试 - 手动设置Cookie
    if (testResults.login.success && testResults.cookies) {
      console.log('\n2. 调用环境列表接口（手动设置Cookie）...');
      
      // 手动创建Cookie字符串并设置到请求头
      const cookieString = createCookieString(testResults.cookies);
      console.log('  - 设置的Cookie:', cookieString);
      
      const envResponse = await api.get('/api/environments/?name=&type=&status=&ip=&page=1&pageSize=10', {
        headers: {
          'Cookie': cookieString
        }
      });
      
      testResults.environmentList.status = envResponse.status;
      
      if (envResponse.status === 200) {
        testResults.environmentList.success = true;
        testResults.environmentList.message = '环境列表接口调用成功';
        testResults.environmentList.data = envResponse.data;
        
        console.log('✓ 环境列表接口调用成功！');
        console.log('  - 总条数:', envResponse.data.count);
        console.log('  - 当前页数据量:', envResponse.data.results?.length || 0);
        if (envResponse.data.results?.length > 0) {
          console.log('  - 第一个环境:', envResponse.data.results[0].name);
        }
      } else {
        testResults.environmentList.message = `环境列表接口调用失败，状态码: ${envResponse.status}`;
        console.error('✗ 环境列表接口调用失败:', testResults.environmentList.message);
      }
    }

    // 3. 测试总结
    success = testResults.login.success && testResults.environmentList.success;
    console.log('\n=== 测试结果总结 ===');
    console.log('登录测试:', testResults.login.success ? '通过' : '失败');
    console.log('环境列表测试:', testResults.environmentList.success ? '通过' : '失败');
    console.log('整体测试:', success ? '通过' : '失败');
    console.log('\n重要提示：');
    console.log('1. 此测试在Node.js环境中需要手动处理Cookie');
    console.log('2. 浏览器环境会自动处理Cookie，建议在浏览器中进行最终验证');
    console.log('3. 数据库已修复，缺少的conn_type列已添加');

  } catch (error) {
    console.error('\n✗ 测试执行异常:', error.message);
    if (error.response) {
      console.error('  - 状态码:', error.response.status);
      console.error('  - 错误数据:', JSON.stringify(error.response.data));
      console.error('  - 响应头:', Object.keys(error.response.headers));
    }
  }

  return {
    success,
    results: testResults,
    timestamp: new Date().toISOString()
  };
}

// 导出默认函数，以便被test_all.js导入
export default async function() {
  const testResult = await runEnvironmentListTest();
  
  // 将结果写入日志文件
  await saveTestResult(testResult);

  // 设置进程退出码
  if (testResult.success) {
    console.log('✅ 环境列表测试通过！');
  } else {
    console.error('❌ 环境列表测试失败！');
    process.exit(1);
  }
}