import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * 自动化测试脚本 - 验证模块创建功能
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 创建一个新的测试模块
 * 3. 验证创建结果并打印详细信息
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

// 测试用模块数据
function generateTestModuleData() {
  const timestamp = Date.now();
  return {
    module_name: `TestModule_${timestamp}`,
    chip_model: 'TestChipModel',
    description: 'This is a test module created by automated test',
    visible_scope: 'all'
  };
}

// 保存测试结果到文件
async function saveTestResult(result) {
  try {
    const logFilePath = join(__dirname, 'module_create_test.log');
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
async function runModuleCreateTest(axiosInstance) {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    moduleCreate: { success: false, message: '', status: null, data: null },
    cookies: null,
    testData: null
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

    console.log('\n=== 自动化测试：模块创建功能 ===');
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
      
      // 2. 生成测试数据并创建模块
      console.log('\n2. 生成测试模块数据...');
      const testModuleData = generateTestModuleData();
      testResults.testData = testModuleData;
      
      console.log('  测试模块数据:', testModuleData);
      
      console.log('\n3. 调用模块创建接口...');
      const createResponse = await api.post('/api/modules/', testModuleData);
      
      testResults.moduleCreate.status = createResponse.status;
      testResults.moduleCreate.data = createResponse.data;
      
      if (createResponse.status === 201) {
        testResults.moduleCreate.success = true;
        testResults.moduleCreate.message = '模块创建成功';
        console.log('✓ 模块创建成功！');
        
        // 验证返回数据结构
        const createdModule = createResponse.data;
        if (createdModule && 
            createdModule.id &&
            createdModule.module_name === testModuleData.module_name) {
          console.log(`✓ 返回数据结构正确，模块ID: ${createdModule.id}`);
          console.log('\n创建的模块详细信息:');
          console.log(`  ID: ${createdModule.id}`);
          console.log(`  模块名称: ${createdModule.module_name}`);
          console.log(`  芯片型号: ${createdModule.chip_model}`);
          console.log(`  描述: ${createdModule.description}`);
          console.log(`  可见范围: ${createdModule.visible_scope}`);
          console.log(`  创建者: ${createdModule.creator}`);
          console.log(`  创建时间: ${createdModule.create_time}`);
          
          success = true;
        } else {
          console.error('✗ 返回数据结构不正确或数据不匹配');
          console.error('  响应数据:', createdModule);
        }
      } else {
        console.error(`✗ 获取模块列表失败，状态码: ${createResponse.status}`);
        console.error('  响应数据:', createResponse.data);
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
  console.log(`创建模块: ${testResults.moduleCreate.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`整体测试: ${success ? '✓ 通过' : '✗ 失败'}`);
  
  return success;
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runModuleCreateTest().then(result => {
    process.exit(result ? 0 : 1);
  });
}

export default runModuleCreateTest;