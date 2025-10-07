import { writeFile, unlink } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 环境查找功能测试脚本
 * 功能：
 * 1. 验证登录功能
 * 2. 创建测试环境数据
 * 3. 测试不同搜索条件下的环境查找功能
 * 4. 验证搜索结果的正确性
 * 5. 清理测试数据
 */
async function runEnvironmentSearchTest(axios) {
  console.log('\n=== 环境查找功能测试 ===');
  
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

  // 存储测试环境ID的数组，用于最后清理
  const testEnvironmentIds = [];

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

    // 2. 创建测试环境数据
    console.log('\n2. 创建测试环境数据...');
    const createStep = {
      step: 'create_test_environments',
      status: 'running',
    };
    testResult.details.testSteps.push(createStep);

    // 手动设置Cookie和CSRF令牌
    const cookieString = createCookieString(cookies);
    
    // 创建3个用于测试的环境
    const testEnvironments = [
      {
        name: 'TestEnv_Search_001',
        type: 'FPGA',
        conn_type: 'SSH',
        status: 'available',
        ip: '192.168.100.101',
        owner: 'test',
        admin: 'admin',
        admin_password: 'password123',
        cabinet_frame_slot: '1-1-1',
        port: '22',
        description: '测试环境查找功能 - FPGA类型'
      },
      {
        name: 'TestEnv_Search_002',
        type: 'simulation',
        conn_type: 'Telnet',
        status: 'occupied',
        ip: '192.168.100.102',
        owner: 'test',
        admin: 'admin',
        admin_password: 'password123',
        cabinet_frame_slot: '1-1-2',
        port: '23',
        description: '测试环境查找功能 - 仿真类型'
      },
      {
        name: 'TestEnv_Search_003',
        type: 'testboard',
        conn_type: 'Serial',
        status: 'maintenance',
        ip: '192.168.100.103',
        owner: 'test',
        admin: 'admin',
        admin_password: 'password123',
        cabinet_frame_slot: '1-1-3',
        port: '9600',
        description: '测试环境查找功能 - 测试板类型'
      }
    ];

    // 存储创建的环境ID
    const createdEnvs = [];
    
    for (const env of testEnvironments) {
      const createResponse = await api.post('/api/environments/', env, {
        headers: {
          'Cookie': cookieString,
          'X-CSRFToken': csrfToken
        }
      });
      
      if (createResponse.status === 201) {
        console.log(`  ✓ 创建环境成功: ${env.name}`);
        createdEnvs.push(createResponse.data);
        testEnvironmentIds.push(createResponse.data.id);
      } else {
        throw new Error(`创建环境失败: ${env.name}, 状态码: ${createResponse.status}`);
      }
    }

    createStep.status = 'completed';
    createStep.creations = testEnvironmentIds.length;

    // 3. 测试环境查找功能
    console.log('\n3. 测试环境查找功能...');
    
    // 测试搜索条件
    const searchTests = [
      {
        name: '按环境名称搜索',
        params: { name: 'TestEnv_Search_001' },
        expectedCount: 1,
        expectedName: 'TestEnv_Search_001'
      },
      {
        name: '按环境类型搜索 (FPGA)',
        params: { type: 'FPGA' },
        expectedCount: 1,
        expectedType: 'FPGA'
      },
      {
        name: '按环境类型搜索 (simulation)',
        params: { type: 'simulation' },
        expectedCount: 1,
        expectedType: 'simulation'
      },
      {
        name: '按环境状态搜索 (available)',
        params: { status: 'available' },
        expectedCount: 1,
        expectedStatus: 'available'
      },
      {
        name: '按IP地址搜索',
        params: { ip: '192.168.100.101' },
        expectedCount: 1,
        expectedIp: '192.168.100.101'
      },
      {
        name: '按名称模糊搜索',
        params: { name: 'TestEnv_Search' },
        expectedCount: 3
      },
      {
        name: '组合条件搜索 (类型+状态)',
        params: { type: 'FPGA', status: 'available' },
        expectedCount: 1,
        expectedType: 'FPGA',
        expectedStatus: 'available'
      }
    ];

    const searchStep = {
      step: 'search_tests',
      status: 'running',
      tests: [],
    };
    testResult.details.testSteps.push(searchStep);

    let allSearchesPassed = true;

    for (const searchTest of searchTests) {
      console.log(`\n  3.${searchTests.indexOf(searchTest) + 1} ${searchTest.name}...`);
      
      // 构建查询参数
      const queryParams = new URLSearchParams({
        ...searchTest.params,
        page: 1,
        pageSize: 10
      }).toString();
      
      // 执行搜索请求
      const searchResponse = await api.get(`/api/environments/?${queryParams}`, {
        headers: {
          'Cookie': cookieString,
          'X-CSRFToken': csrfToken
        }
      });
      
      // 验证搜索结果
      const testPassed = verifySearchResults(searchResponse.data, searchTest);
      
      // 记录测试结果
      const testRecord = {
        name: searchTest.name,
        params: searchTest.params,
        passed: testPassed,
        actualCount: searchResponse.data.count,
        expectedCount: searchTest.expectedCount
      };
      
      searchStep.tests.push(testRecord);
      
      if (testPassed) {
        console.log(`  ✓ ${searchTest.name} 测试通过！找到 ${searchResponse.data.count} 条记录`);
      } else {
        console.log(`  ✗ ${searchTest.name} 测试失败！找到 ${searchResponse.data.count} 条记录，期望 ${searchTest.expectedCount} 条`);
        allSearchesPassed = false;
      }
    }

    searchStep.status = 'completed';
    searchStep.allPassed = allSearchesPassed;

    // 4. 清理测试数据
    console.log('\n4. 清理测试数据...');
    const cleanupStep = {
      step: 'cleanup',
      status: 'running',
      environmentsToDelete: testEnvironmentIds.length
    };
    testResult.details.testSteps.push(cleanupStep);

    for (const envId of testEnvironmentIds) {
      try {
        await api.delete(`/api/environments/${envId}/`, {
          headers: {
            'Cookie': cookieString,
            'X-CSRFToken': csrfToken
          }
        });
        console.log(`  ✓ 删除环境成功: ${envId}`);
      } catch (error) {
        console.error(`  ✗ 删除环境失败: ${envId}`, error.message);
      }
    }

    cleanupStep.status = 'completed';

    // 5. 测试总结
    testResult.success = allSearchesPassed;
    testResult.message = allSearchesPassed ? '环境查找功能测试全部通过！' : '环境查找功能测试部分失败，请查看详情';
    
    console.log('\n=== 测试结果总结 ===');
    console.log(`整体测试: ${allSearchesPassed ? '通过' : '失败'}`);
    console.log(`测试详情: ${testResult.message}`);
    
    // 保存测试结果到文件
    const logFilePath = join(__dirname, 'environment_search_test_report.json');
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`\n测试报告已保存到: ${logFilePath}`);
    
  } catch (error) {
    console.error('\n✗ 测试过程中发生错误:', error.message);
    testResult.success = false;
    testResult.message = `测试失败: ${error.message}`;
    
    // 保存错误结果
    const logFilePath = join(__dirname, 'environment_search_test_report.json');
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`\n测试报告已保存到: ${logFilePath}`);
    
  } finally {
    // 确保返回测试结果
    return testResult;
  }
}

/**
 * 验证搜索结果
 */
function verifySearchResults(data, searchTest) {
  // 验证结果数量
  if (data.count !== searchTest.expectedCount) {
    return false;
  }
  
  // 验证结果内容
  if (searchTest.expectedName) {
    return data.results.some(env => env.name === searchTest.expectedName);
  }
  
  if (searchTest.expectedType) {
    return data.results.every(env => env.type === searchTest.expectedType);
  }
  
  if (searchTest.expectedStatus) {
    return data.results.every(env => env.status === searchTest.expectedStatus);
  }
  
  if (searchTest.expectedIp) {
    return data.results.some(env => env.ip === searchTest.expectedIp);
  }
  
  // 如果没有特殊验证条件，仅验证数量
  return data.count === searchTest.expectedCount;
}

// 独立运行测试
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  import('axios').then(({ default: axios }) => {
    runEnvironmentSearchTest(axios).then(() => {
      console.log('\n环境查找功能测试完成');
    }).catch(error => {
      console.error('测试执行失败:', error);
    });
  });
}

export default runEnvironmentSearchTest;