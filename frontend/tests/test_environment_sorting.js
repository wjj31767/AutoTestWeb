import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import axios from 'axios';

/**
 * 自动化测试脚本 - 验证环境列表排序功能
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 测试按创建时间、更新时间和环境名称的升序和降序排序
 * 3. 验证排序结果是否正确
 * 4. 打印测试结果和详细信息
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
    const logFilePath = join(__dirname, 'environment_sorting_test.log');
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

// 验证数组是否按指定字段排序
function validateSorting(arr, field, order) {
  if (!arr || arr.length <= 1) {
    return true; // 空数组或只有一个元素的数组总是有序的
  }
  
  for (let i = 0; i < arr.length - 1; i++) {
    const current = arr[i][field];
    const next = arr[i + 1][field];
    
    // 跳过null值的比较
    if (current === null || next === null) {
      continue;
    }
    
    // 根据排序方向检查顺序
    if (order === 'asc') {
      if (current > next) {
        console.log(`排序验证失败: ${current} > ${next} 应为升序`);
        return false;
      }
    } else {
      if (current < next) {
        console.log(`排序验证失败: ${current} < ${next} 应为降序`);
        return false;
      }
    }
  }
  
  return true;
}

// 测试函数
async function runEnvironmentSortingTest() {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    cookies: null,
    sortTests: []
  };

  try {
    console.log('\n=== 自动化测试：环境列表排序功能 ===');
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
      console.log('  - 提取到的Cookie:', testResults.cookies);
    } else {
      testResults.login.message = `登录失败，状态码: ${loginResponse.status}`;
      console.error('✗ 登录失败:', testResults.login.message);
    }

    // 2. 排序功能测试
    if (testResults.login.success && testResults.cookies) {
      console.log('\n2. 开始测试排序功能...');
      
      // 手动创建Cookie字符串并设置到请求头
      const cookieString = createCookieString(testResults.cookies);
      
      // 测试用例：按创建时间升序、按创建时间降序、按更新时间升序、按更新时间降序、按名称升序、按名称降序
      const sortTestCases = [
        { field: 'create_time', order: 'asc', description: '按创建时间升序' },
        { field: 'create_time', order: 'desc', description: '按创建时间降序' },
        { field: 'update_time', order: 'asc', description: '按更新时间升序' },
        { field: 'update_time', order: 'desc', description: '按更新时间降序' },
        { field: 'name', order: 'asc', description: '按环境名称升序' },
        { field: 'name', order: 'desc', description: '按环境名称降序' }
      ];
      
      // 运行所有排序测试用例
      for (const testCase of sortTestCases) {
        const testResult = {
          description: testCase.description,
          field: testCase.field,
          order: testCase.order,
          success: false,
          status: null,
          message: '',
          data: null,
          validation: false
        };
        
        try {
          const orderParam = testCase.order === 'desc' ? `-${testCase.field}` : testCase.field;
          const apiUrl = `/api/environments/?page=1&pageSize=10&ordering=${orderParam}`;
          
          console.log(`\n  测试: ${testCase.description}`);
          console.log(`  请求URL: ${apiUrl}`);
          
          const response = await api.get(apiUrl, {
            headers: {
              'Cookie': cookieString
            }
          });
          
          testResult.status = response.status;
          testResult.data = response.data;
          
          if (response.status === 200) {
            testResult.success = true;
            testResult.message = '接口调用成功';
            console.log(`  ✓ 接口调用成功！总条数: ${response.data.count}`);
            
            // 验证排序是否正确
            const isSorted = validateSorting(response.data.results, testCase.field, testCase.order);
            testResult.validation = isSorted;
            
            if (isSorted) {
              console.log(`  ✓ 排序验证通过！数据按${testCase.field}${testCase.order === 'asc' ? '升序' : '降序'}排列`);
            } else {
              console.error(`  ✗ 排序验证失败！数据未按预期排序`);
            }
          } else {
            testResult.message = `接口调用失败，状态码: ${response.status}`;
            console.error(`  ✗ 接口调用失败: ${testResult.message}`);
          }
        } catch (error) {
          testResult.message = `测试执行异常: ${error.message}`;
          console.error(`  ✗ 测试执行异常:`, error.message);
        }
        
        testResults.sortTests.push(testResult);
      }
    }

    // 3. 测试总结
    const allSortTestsPassed = testResults.sortTests.every(test => test.success && test.validation);
    success = testResults.login.success && allSortTestsPassed;
    
    console.log('\n=== 测试结果总结 ===');
    console.log('登录测试:', testResults.login.success ? '通过' : '失败');
    
    console.log('\n排序功能测试结果:');
    testResults.sortTests.forEach(test => {
      console.log(`  ${test.description}: ${test.success && test.validation ? '通过' : '失败'}`);
    });
    
    console.log('\n整体测试:', success ? '通过' : '失败');
    
  } catch (error) {
    console.error('\n✗ 测试执行异常:', error.message);
    if (error.response) {
      console.error('  - 状态码:', error.response.status);
      console.error('  - 错误数据:', JSON.stringify(error.response.data));
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
  const testResult = await runEnvironmentSortingTest();
  
  // 将结果写入日志文件
  await saveTestResult(testResult);

  // 设置进程退出码
  if (testResult.success) {
    console.log('✅ 环境列表排序测试通过！');
  } else {
    console.error('❌ 环境列表排序测试失败！');
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runEnvironmentSortingTest().then(testResult => {
    saveTestResult(testResult);
    process.exit(testResult.success ? 0 : 1);
  });
}