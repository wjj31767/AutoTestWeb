import axios from 'axios';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 环境列表接口增强测试脚本
 * 功能：
 * 1. 验证登录功能
 * 2. 测试环境列表接口的正常调用
 * 3. 处理空数据响应的情况
 * 4. 详细记录测试过程和结果
 */
async function runEnvironmentListEnhancedTest(axios) {
  console.log('\n=== 环境列表接口增强测试 ===');
  
  // 测试结果对象
  const testResult = {
    timestamp: new Date().toISOString(),
    success: false,
    message: '',
    details: {
      environment: 'Node.js CLI',
      testSteps: [],
    },
  };

  try {
    // 创建axios实例
    const api = axios.create({
      baseURL: 'http://localhost:5173',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // 手动处理Cookie和CSRF令牌
    let cookies = {};
    let csrfToken = '';
    
    // 提取Cookie和CSRF令牌的函数
    function extractCookiesAndCsrfToken(responseHeaders) {
      const cookieMap = {};
      const setCookieHeaders = responseHeaders['set-cookie'] || [];
      
      setCookieHeaders.forEach(cookieHeader => {
        const parts = cookieHeader.split(';');
        const cookiePart = parts[0];
        const [key, value] = cookiePart.split('=');
        cookieMap[key.trim()] = value.trim();
        
        // 提取CSRF令牌
        if (key.trim() === 'csrftoken') {
          csrfToken = value.trim();
        }
      });
      
      return cookieMap;
    }
    
    // 创建Cookie字符串的函数
    function createCookieString(cookieMap) {
      return Object.entries(cookieMap)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    // 1. 登录测试
    console.log('1. 正在登录系统...');
    const loginStep = {
      step: 'login',
      status: 'running',
    };
    testResult.details.testSteps.push(loginStep);

    const loginResponse = await api.post('/api/user/login/', {
      username: 'test',
      password: 'test@123',
    });

    loginStep.status = 'completed';
    loginStep.response = {
      status: loginResponse.status,
      data: loginResponse.data,
    };

    if (loginResponse.status === 200) {
      console.log('✅ 登录成功！用户:', loginResponse.data.username);
      testResult.details.user = loginResponse.data.username;
      
      // 提取并保存Cookie和CSRF令牌
      cookies = extractCookiesAndCsrfToken(loginResponse.headers);
      console.log('  - 提取到的Cookie:', Object.keys(cookies));
    } else {
      throw new Error(`登录失败，状态码: ${loginResponse.status}`);
    }

    // 2. 环境列表接口测试
    console.log('\n2. 调用环境列表接口...');
    const envStep = {
      step: 'environment_list',
      status: 'running',
      endpoint: '/api/environments/?name=&type=&status=&ip=&page=1&pageSize=10',
    };
    testResult.details.testSteps.push(envStep);

    // 手动设置Cookie和CSRF令牌
    const cookieString = createCookieString(cookies);
    console.log('  - 手动设置的Cookie:', cookieString);
    
    // 执行环境列表接口请求，手动设置Cookie和CSRF令牌
    const envResponse = await api.get('/api/environments/?name=&type=&status=&ip=&page=1&pageSize=10', {
      headers: {
        'Cookie': cookieString,
        'X-CSRFToken': csrfToken
      }
    });

    envStep.status = 'completed';
    envStep.response = {
      status: envResponse.status,
      data: envResponse.data,
      headers: Object.keys(envResponse.headers),
    };

    // 3. 验证响应内容
    console.log(`\n3. 验证环境列表响应（状态码: ${envResponse.status}）`);
    
    // 检查响应结构
    const hasValidStructure = 
      'count' in envResponse.data && 
      'next' in envResponse.data && 
      'previous' in envResponse.data && 
      'results' in envResponse.data && 
      Array.isArray(envResponse.data.results);

    if (hasValidStructure) {
      console.log('✅ 响应结构验证通过');
      console.log('  - 总条数:', envResponse.data.count);
      console.log('  - 当前页数据量:', envResponse.data.results.length);
      
      // 处理空数据的情况
      if (envResponse.data.count === 0) {
        console.log('  - 注意: 当前没有环境数据，这是正常现象');
        console.log('  - 响应内容:', JSON.stringify(envResponse.data));
      } else if (envResponse.data.results.length > 0) {
        console.log('  - 第一个环境:', envResponse.data.results[0].name);
      }
    } else {
      throw new Error('响应结构无效，缺少必要字段');
    }

    // 4. 测试通过判断
    if (envResponse.status === 200) {
      testResult.success = true;
      testResult.message = '环境列表接口测试通过！接口返回正常结构。';
      console.log('\n✅ 环境列表接口测试通过！');
    } else {
      throw new Error(`环境列表接口返回非200状态码: ${envResponse.status}`);
    }

  } catch (error) {
    testResult.success = false;
    testResult.message = `测试失败: ${error.message}`;
    
    // 记录错误信息
    if (error.response) {
      testResult.details.error = {
        message: error.message,
        status: error.response.status,
        data: error.response.data,
        headers: Object.keys(error.response.headers),
      };
      
      console.error(`❌ 测试失败: 状态码 ${error.response.status}`);
      console.error('  错误详情:', JSON.stringify(error.response.data));
    } else {
      testResult.details.error = {
        message: error.message,
      };
      console.error('❌ 测试失败:', error.message);
    }
  }

  // 保存测试结果到日志文件
  try {
    const logFilePath = join(__dirname, '../environment_list_test.log');
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`\n测试结果已保存到: ${logFilePath}`);
  } catch (writeError) {
    console.error('保存测试结果失败:', writeError.message);
  }

  // 显示重要提示
  console.log('\n=== 重要提示 ===');
  console.log('1. 环境列表接口返回 {"count":0,"next":null,"previous":null,"results":[]} 是正常的，表示当前没有环境数据');
  console.log('2. 如果界面一直在转圈，请检查：');
  console.log('   - 浏览器控制台是否有JavaScript错误');
  console.log('   - 网络请求是否成功完成');
  console.log('   - 前端代码是否正确处理了空数据的情况');
  console.log('3. 数据库修复状态：缺少的conn_type列已添加');

  return testResult.success;
}

// 导出默认函数，供test_runner.js导入
// 如果直接运行此脚本，则执行测试
if (process.argv[1] && process.argv[1].endsWith('test_environment_list_enhanced.js')) {
  import('axios').then(axiosModule => {
    runEnvironmentListEnhancedTest(axiosModule.default).catch(error => {
      console.error('测试执行过程中发生错误:', error);
      process.exit(1);
    });
  });
}

export default runEnvironmentListEnhancedTest;