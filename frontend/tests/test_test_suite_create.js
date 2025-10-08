import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 测试套创建接口测试脚本
 * 功能：
 * 1. 验证登录功能
 * 2. 测试创建测试套接口，不包含creator字段
 * 3. 验证创建是否成功
 * 4. 记录测试过程和结果
 */
async function runTestSuiteCreateTest() {
  console.log('\n=== 测试套创建接口测试 ===');
  
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
    // 动态导入axios
    const axiosModule = await import('axios');
    const axios = axiosModule.default;
    
    // 创建axios实例
    const api = axios.create({
      baseURL: 'http://localhost:5173/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // 手动处理Cookie和CSRF令牌
    let cookies = {};
    let csrfToken = '';
    let testSuiteId = '';
    
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

    const loginResponse = await api.post('/user/login/', {
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
      console.log('  - 提取到的CSRF令牌:', csrfToken);
    } else {
      throw new Error(`登录失败，状态码: ${loginResponse.status}`);
    }

    // 2. 创建测试套（不包含creator字段）
    console.log('\n2. 创建测试套（不包含creator字段）...');
    const createStep = {
      step: 'create_test_suite',
      status: 'running',
    };
    testResult.details.testSteps.push(createStep);

    // 准备测试套数据，不包含creator字段
    const testSuiteData = {
      name: `testsuite_${Date.now()}`,
      description: '测试套创建接口自动化测试',
      visible_scope: 'private',
      case_count: 0
    };

    console.log('  - 提交的测试套数据:', testSuiteData);
    
    // 设置Cookie和CSRF令牌并发起请求
    const createResponse = await api.post('/test_suites/', testSuiteData, {
      headers: {
        'Cookie': createCookieString(cookies),
        'X-CSRFToken': csrfToken
      }
    });
    
    createStep.status = 'completed';
    createStep.response = {
      status: createResponse.status,
      data: createResponse.data,
    };

    if (createResponse.status === 201) {
      console.log('✅ 测试套创建成功！');
      testSuiteId = createResponse.data.id;
      console.log(`  - 创建的测试套ID: ${testSuiteId}`);
      console.log(`  - 返回的测试套数据:`, createResponse.data);
      
      // 验证返回的数据是否包含creator字段
      if ('creator' in createResponse.data && createResponse.data.creator) {
        console.log('✅ 验证通过：返回的数据包含creator字段，值为:', createResponse.data.creator);
      } else {
        throw new Error('创建成功但返回数据中缺少creator字段');
      }
      
      // 验证其他必需字段
      const hasValidStructure = 
        'id' in createResponse.data &&
        'name' in createResponse.data &&
        'description' in createResponse.data &&
        'visible_scope' in createResponse.data &&
        'case_count' in createResponse.data &&
        'create_time' in createResponse.data &&
        'update_time' in createResponse.data;

      if (hasValidStructure) {
        console.log('✅ 测试套数据结构验证通过');
        testResult.success = true;
        testResult.message = '测试套创建接口测试通过！不包含creator字段也能成功创建测试套。';
        testResult.details.createdTestSuite = createResponse.data;
      } else {
        throw new Error('测试套响应结构无效，缺少必要字段');
      }
    } else {
      throw new Error(`测试套创建接口返回非201状态码: ${createResponse.status}`);
    }

  } catch (error) {
    testResult.success = false;
    testResult.message = `测试失败: ${error.message}`;
    console.error('❌ 测试执行失败:', error);
  } finally {
    // 清理测试数据
    if (testSuiteId) {
      try {
        console.log('\n3. 清理测试数据，删除测试套...');
        const api = axios.create({
          baseURL: 'http://localhost:5173/api',
          timeout: 5000,
        });
        
        await api.delete(`/test_suites/${testSuiteId}/`, {
          headers: {
            'Cookie': createCookieString(cookies),
            'X-CSRFToken': csrfToken
          }
        });
        console.log(`✅ 测试套 ${testSuiteId} 已成功删除`);
      } catch (cleanupError) {
        console.error('⚠️ 清理测试数据失败:', cleanupError.message);
      }
    }
    
    // 保存测试报告
    try {
      const reportFilePath = join(__dirname, 'test_suite_create_test_report.json');
      await writeFile(reportFilePath, JSON.stringify(testResult, null, 2));
      console.log(`\n测试报告已保存到: ${reportFilePath}`);
    } catch (writeError) {
      console.error('保存测试报告失败:', writeError.message);
    }
    
    console.log('\n=== 测试套创建接口测试完成 ===');
    
    return testResult.success;
  }
}

// 如果直接运行此脚本，则执行测试
if (process.argv[1] && process.argv[1].endsWith('test_test_suite_create.js')) {
  runTestSuiteCreateTest().catch(error => {
    console.error('测试执行失败:', error);
    process.exit(1);
  });
}

export default runTestSuiteCreateTest;