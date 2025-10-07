import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fsPromises from 'node:fs/promises';
import axios from 'axios';

/**
 * 自动化测试脚本 - 验证环境列表分页功能
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 分别测试pageSize=10和pageSize=20的情况
 * 3. 验证返回的数据量是否符合预期
 * 4. 打印详细的测试结果和分析
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
    const logFilePath = join(__dirname, 'pagination_test.log');
    await fsPromises.appendFile(
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

// 测试分页功能
async function testPagination(pageSize, cookies) {
  try {
    console.log(`\n测试分页大小: ${pageSize}`);
    
    // 构建请求URL，包含分页参数
    const url = `/api/environments/?name=&type=&status=&ip=&page=1&pageSize=${pageSize}`;
    
    // 手动设置Cookie
    const cookieString = createCookieString(cookies);
    
    // 发送请求
    const response = await api.get(url, {
      headers: {
        'Cookie': cookieString
      }
    });
    
    // 验证响应
    if (response.status === 200) {
      const data = response.data;
      console.log(`  ✓ 状态码: ${response.status}`);
      console.log(`  ✓ 总条数: ${data.count || 0}`);
      console.log(`  ✓ 返回数据量: ${data.results?.length || 0}`);
      console.log(`  ✓ 预期数据量: ≤${pageSize}`);
      
      // 检查返回的数据量是否符合预期
      const dataMatches = data.results && 
                          Array.isArray(data.results) && 
                          data.results.length <= pageSize;
      
      return {
        success: dataMatches,
        status: response.status,
        data: data,
        expectedPageSize: pageSize,
        actualCount: data.results?.length || 0,
        totalCount: data.count || 0,
        message: dataMatches ? `分页测试成功，返回了${data.results.length}条数据` : 
                              `分页测试失败，返回了${data.results?.length || 0}条数据，预期≤${pageSize}条`
      };
    } else {
      console.error(`  ✗ 请求失败，状态码: ${response.status}`);
      return {
        success: false,
        status: response.status,
        message: `请求失败，状态码: ${response.status}`
      };
    }
  } catch (error) {
    console.error(`  ✗ 测试异常: ${error.message}`);
    if (error.response) {
      console.error(`    - 状态码: ${error.response.status}`);
    }
    return {
      success: false,
      message: `测试异常: ${error.message}`
    };
  }
}

// 主测试函数
async function runPaginationTest() {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    pagination10: null,  // pageSize=10的测试结果
    pagination20: null,  // pageSize=20的测试结果
    cookies: null
  };

  try {
    console.log('\n=== 自动化测试：环境列表分页功能 ===');
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

    // 2. 分页功能测试
    if (testResults.login.success && testResults.cookies) {
      console.log('\n2. 开始分页功能测试...');
      
      // 测试pageSize=10
      testResults.pagination10 = await testPagination(10, testResults.cookies);
      
      // 测试pageSize=20
      testResults.pagination20 = await testPagination(20, testResults.cookies);
      
      // 整体分页测试成功条件：两个分页测试都成功
      const paginationSuccess = testResults.pagination10.success && testResults.pagination20.success;
      
      // 3. 分析20/page问题
      if (testResults.pagination20.success) {
        const data20 = testResults.pagination20.data;
        const count20 = data20.results?.length || 0;
        
        console.log('\n3. 分页问题分析:');
        if (count20 === 20) {
          console.log('✓ 成功：选择20/page时返回了20条数据，分页功能正常工作');
        } else if (count20 < 20 && count20 > 0) {
          console.log('✓ 成功：选择20/page时返回了', count20, '条数据（总数可能不足20条）');
        } else if (count20 === 0) {
          console.log('⚠️ 警告：选择20/page时返回了0条数据，请检查数据库中是否有数据');
        }
      } else {
        console.error('✗ 失败：选择20/page时分页功能不正常');
      }
    }

    // 4. 测试总结
    success = testResults.login.success && 
              testResults.pagination10?.success && 
              testResults.pagination20?.success;
    
    console.log('\n=== 测试结果总结 ===');
    console.log('登录测试:', testResults.login.success ? '通过' : '失败');
    console.log('pageSize=10测试:', testResults.pagination10?.success ? '通过' : '失败');
    console.log('pageSize=20测试:', testResults.pagination20?.success ? '通过' : '失败');
    console.log('整体测试:', success ? '通过' : '失败');
    
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
  const testResult = await runPaginationTest();
  
  // 将结果写入日志文件
  await saveTestResult(testResult);

  // 设置进程退出码
  if (testResult.success) {
    console.log('✅ 分页功能测试通过！');
  } else {
    console.error('❌ 分页功能测试失败！');
    process.exit(1);
  }
}

// 如果直接运行此文件，则执行测试
if (process.argv[1] && process.argv[1].includes('test_environment_pagination.js')) {
  console.log('直接运行模式 - 开始执行分页测试...');
  runPaginationTest().then(result => {
    console.log('\n=== 直接运行模式 - 测试结果 ===');
    console.log('登录成功:', result.results.login.success);
    console.log('pageSize=10测试:', result.results.pagination10?.success ? '通过' : '失败');
    console.log('pageSize=20测试:', result.results.pagination20?.success ? '通过' : '失败');
    console.log('整体测试结果:', result.success ? '通过' : '失败');
  });
}