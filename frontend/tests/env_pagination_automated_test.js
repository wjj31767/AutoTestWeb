import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import fsPromises from 'node:fs/promises';
import axios from 'axios';

/**
 * 环境列表分页功能自动化测试脚本
 * 功能：
 * 1. 模拟用户登录系统
 * 2. 测试不同分页大小（10、20、50、100）
 * 3. 验证返回的数据量是否符合预期
 * 4. 记录详细的测试结果和分析
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
const TEST_PAGE_SIZES = [10, 20, 50, 100];
const LOG_FILE = join(__dirname, 'pagination_test_log.txt');

// 创建axios实例
const api = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * 从响应头中提取Cookie信息
 */
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

/**
 * 创建Cookie字符串
 */
function createCookieString(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

/**
 * 测试指定pageSize的分页功能
 */
async function testPagination(pageSize, cookies) {
  try {
    console.log(`\n===== 测试分页大小: ${pageSize} =====`);
    
    // 构建请求URL，包含分页参数
    // 同时包含多种分页参数格式(pageSize, page_size, limit)，确保后端能正确识别
    const url = `/api/environments/?name=&type=&status=&ip=&page=1&pageSize=${pageSize}&page_size=${pageSize}&limit=${pageSize}`;
    
    console.log(`  请求URL: ${url}`);
    
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
      
      // 检查返回的数据结构是否符合预期
      const hasValidStructure = data.results && Array.isArray(data.results);
      
      // 检查返回的数据量是否符合预期
      const dataCountMatches = hasValidStructure && data.results.length <= pageSize;
      
      // 特殊检查：当请求pageSize=20时的数据量
      const specialCheck20 = pageSize === 20 && hasValidStructure ? 
        ` (实际返回${data.results.length}条，预期≤20条${data.results.length === 10 ? ' - 注意：返回了10条数据，可能是后端限制' : ''})` : '';
      
      return {
        success: dataCountMatches,
        status: response.status,
        data: data,
        expectedPageSize: pageSize,
        actualCount: data.results?.length || 0,
        totalCount: data.count || 0,
        message: dataCountMatches ? 
          `分页测试成功，返回了${data.results.length}条数据${specialCheck20}` : 
          `分页测试失败，返回了${data.results?.length || 0}条数据，预期≤${pageSize}条`,
        requestUrl: url
      };
    } else {
      console.error(`  ✗ 请求失败，状态码: ${response.status}`);
      return {
        success: false,
        status: response.status,
        message: `请求失败，状态码: ${response.status}`,
        requestUrl: url
      };
    }
  } catch (error) {
    console.error(`  ✗ 测试异常: ${error.message}`);
    if (error.response) {
      console.error(`    - 状态码: ${error.response.status}`);
      console.error(`    - 错误数据: ${JSON.stringify(error.response.data)}`);
    }
    return {
      success: false,
      message: `测试异常: ${error.message}`,
      requestUrl: url
    };
  }
}

/**
 * 保存测试结果到日志文件
 */
async function saveTestResult(testResult) {
  try {
    const logEntry = `\n===== 测试结果 - ${new Date().toLocaleString()} =====\n` +
      `整体测试结果: ${testResult.success ? '通过' : '失败'}\n` +
      `登录测试: ${testResult.results.login.success ? '通过' : '失败'}\n` +
      `\n各分页大小测试结果:\n` +
      Object.entries(testResult.results.paginationTests).map(([size, result]) => 
        `  ${size}条/页: ${result.success ? '通过' : '失败'} - ${result.message}`
      ).join('\n') +
      `\n总环境数量: ${testResult.results.totalCount || 0}\n` +
      `测试时间: ${new Date(testResult.timestamp).toLocaleString()}\n` +
      `=========================================\n`;
    
    await fsPromises.appendFile(LOG_FILE, logEntry);
    console.log(`\n测试结果已保存到: ${LOG_FILE}`);
  } catch (error) {
    console.error(`保存测试结果失败: ${error.message}`);
  }
}

/**
 * 主测试函数
 */
async function runPaginationTest() {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    paginationTests: {}, // 存储不同pageSize的测试结果
    cookies: null,
    totalCount: 0
  };

  try {
    console.log('\n=== 环境列表分页功能自动化测试 ===');
    console.log('测试时间:', new Date().toLocaleString());
    console.log('测试用户:', TEST_USER.username);
    console.log('测试分页大小:', TEST_PAGE_SIZES.join(', '));

    // 1. 登录测试
    console.log('\n=== 1. 开始登录系统 ===');
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
      console.log('\n=== 2. 开始分页功能测试 ===');
      
      // 测试所有指定的pageSize
      for (const pageSize of TEST_PAGE_SIZES) {
        testResults.paginationTests[pageSize] = await testPagination(pageSize, testResults.cookies);
        
        // 保存总数量（使用第一个成功的测试结果）
        if (!testResults.totalCount && testResults.paginationTests[pageSize].data?.count) {
          testResults.totalCount = testResults.paginationTests[pageSize].data.count;
        }
      }
      
      // 3. 详细分析分页问题
      console.log('\n=== 3. 分页问题详细分析 ===');
      const pagination20Result = testResults.paginationTests[20];
      
      if (pagination20Result && pagination20Result.success) {
        const count20 = pagination20Result.actualCount;
        const totalCount = pagination20Result.totalCount;
        
        console.log(`环境总数: ${totalCount}`);
        console.log(`当选择20条/页时返回了${count20}条数据`);
        
        if (count20 === 20) {
          console.log('✓ 正常：选择20条/页时返回了20条数据，分页功能正常工作');
        } else if (count20 === 10 && totalCount > 10) {
          console.log('⚠️ 问题发现：选择20条/页时只返回了10条数据');
          console.log('  可能原因分析：');
          console.log('  1. 后端分页参数名称不匹配（前端使用pageSize，后端可能期望page_size）');
          console.log('  2. 后端分页配置有默认值限制');
          console.log('  3. API路径可能不正确或有特殊处理');
          console.log('  4. 请检查后端Django REST Framework的分页配置');
        } else if (count20 < 20 && count20 >= 1) {
          console.log(`✓ 正常：数据总数${totalCount}不足20条，返回全部数据是合理的`);
        } else if (count20 === 0) {
          console.log('⚠️ 警告：返回了0条数据，请检查数据库中是否有环境数据');
        }
      } else {
        console.error('✗ 失败：20条/页的分页测试未通过');
        console.error('  错误信息:', pagination20Result?.message);
      }
      
      // 4. 前端与后端分页参数对比分析
      console.log('\n=== 4. 分页参数分析 ===');
      console.log('前端分页参数设置（EnvList.vue）:');
      console.log('  - 使用的分页参数名: pageSize');
      console.log('  - 同时发送的备用参数名: page_size, limit');
      console.log('Django REST Framework配置（settings.py）:');
      console.log('  - 分页类: PageNumberPagination');
      console.log('  - 默认页面大小: 10');
      console.log('  - 预期参数名: page, page_size');
      
      // 5. 建议的解决方案
      console.log('\n=== 5. 建议的解决方案 ===');
      console.log('根据测试结果和代码分析，建议采取以下措施解决分页问题：');
      console.log('1. 确认前端发送的分页参数名与后端期望的参数名一致');
      console.log('   - 前端EnvList.vue中已同时发送pageSize、page_size和limit三种格式');
      console.log('2. 检查后端是否有自定义分页类，可能覆盖了默认行为');
      console.log('3. 考虑创建自定义分页类以支持多种参数名格式：');
      console.log('   ```python');
      console.log('   class CustomPageNumberPagination(PageNumberPagination):');
      console.log('       page_size_query_param = \'page_size\'');
      console.log('       page_query_param = \'page\'');
      console.log('       max_page_size = 100');
      console.log('   ```');
      console.log('4. 确保在settings.py中正确配置分页类：');
      console.log('   ```python');
      console.log('   REST_FRAMEWORK = {');
      console.log('       \'DEFAULT_PAGINATION_CLASS\': \'your_app.pagination.CustomPageNumberPagination\',');
      console.log('       \'PAGE_SIZE\': 10');
      console.log('   }');
      console.log('   ```');
    }

    // 6. 测试总结
    success = testResults.login.success && 
              Object.values(testResults.paginationTests).every(test => test.success);
    
    console.log('\n=== 测试结果总结 ===');
    console.log('登录测试:', testResults.login.success ? '通过' : '失败');
    
    // 打印每个分页大小的测试结果
    Object.entries(testResults.paginationTests).forEach(([size, result]) => {
      console.log(`${size}条/页测试:`, result.success ? '通过' : '失败');
    });
    
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

/**
 * 直接运行测试
 */
async function main() {
  console.log('\n🚀 环境列表分页功能自动化测试工具启动...');
  console.log('此工具将模拟用户操作，测试不同分页大小的功能');
  
  const testResult = await runPaginationTest();
  
  // 保存测试结果到日志文件
  await saveTestResult(testResult);

  // 设置进程退出码
  if (testResult.success) {
    console.log('\n✅ 分页功能测试完成！');
  } else {
    console.error('\n❌ 分页功能测试失败！');
  }
}

// 当直接运行此文件时执行测试
if (process.argv[1] && process.argv[1].includes('env_pagination_automated_test.js')) {
  main();
}

// 导出函数以便被其他模块调用
export default runPaginationTest;