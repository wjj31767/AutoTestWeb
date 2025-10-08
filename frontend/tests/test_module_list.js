import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * 自动化测试脚本 - 验证登录和模块列表接口
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 调用模块列表接口并验证返回数据
 * 3. 打印测试结果和详细信息
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

// 保存测试结果到文件
async function saveTestResult(result) {
  try {
    const logFilePath = join(__dirname, 'module_list_test.log');
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
async function runModuleListTest(axiosInstance) {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    moduleList: { success: false, message: '', status: null, data: null },
    cookies: null
  };

  try {
    // 创建axios实例（如果没有传入）
    const api = axiosInstance || require('axios').create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('\n=== 自动化测试：模块列表接口 ===');
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
      console.log('✓ Cookie提取成功:', Object.keys(testResults.cookies).join(', '));
      
      // 设置后续请求的Cookie
      api.defaults.headers.Cookie = createCookieString(testResults.cookies);
      
      // 2. 调用模块列表接口
      console.log('\n2. 调用模块列表接口...');
      const moduleListResponse = await api.get('/api/modules/');
      
      testResults.moduleList.status = moduleListResponse.status;
      testResults.moduleList.data = moduleListResponse.data;
      
      if (moduleListResponse.status === 200) {
        testResults.moduleList.success = true;
        testResults.moduleList.message = '获取模块列表成功';
        console.log('✓ 获取模块列表成功！');
        
        // 验证返回数据结构
        if (moduleListResponse.data && 
            Array.isArray(moduleListResponse.data.results) &&
            typeof moduleListResponse.data.count === 'number') {
          console.log(`✓ 返回数据结构正确，模块总数: ${moduleListResponse.data.count}`);
          console.log(`✓ 返回模块列表数量: ${moduleListResponse.data.results.length}`);
          
          // 打印第一个模块的详细信息（如果有）
          if (moduleListResponse.data.results.length > 0) {
            console.log('\n第一个模块详细信息:');
            const firstModule = moduleListResponse.data.results[0];
            console.log(`  ID: ${firstModule.id}`);
            console.log(`  模块名称: ${firstModule.module_name}`);
            console.log(`  芯片型号: ${firstModule.chip_model}`);
            console.log(`  特性数量: ${firstModule.feature_count}`);
            console.log(`  可见范围: ${firstModule.visible_scope}`);
            console.log(`  创建者: ${firstModule.creator}`);
            console.log(`  创建时间: ${firstModule.create_time}`);
          }
          
          success = true;
        } else {
          console.error('✗ 返回数据结构不正确');
          console.error('  响应数据:', moduleListResponse.data);
        }
      } else {
        console.error(`✗ 获取模块列表失败，状态码: ${moduleListResponse.status}`);
      }
    } else {
      console.error(`✗ 登录失败，状态码: ${loginResponse.status}`);
      console.error('  响应数据:', loginResponse.data);
    }
  } catch (error) {
    console.error('✗ 测试执行过程中发生错误:', error.message);
    if (error.response) {
      console.error('  错误状态码:', error.response.status);
      console.error('  错误响应数据:', error.response.data);
    }
    testResults.error = error.message;
  }
  
  // 保存测试结果
  await saveTestResult(testResults);
  
  // 输出测试总结
  console.log('\n=== 测试总结 ===');
  console.log(`登录: ${testResults.login.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`获取模块列表: ${testResults.moduleList.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`整体测试: ${success ? '✓ 通过' : '✗ 失败'}`);
  
  return success;
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runModuleListTest().then(result => {
    process.exit(result ? 0 : 1);
  });
}

export default runModuleListTest;