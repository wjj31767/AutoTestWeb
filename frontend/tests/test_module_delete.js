import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * 自动化测试脚本 - 验证模块删除功能
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 创建一个新的测试模块
 * 3. 删除该测试模块
 * 4. 验证模块是否被成功删除
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
    const logFilePath = join(__dirname, 'module_delete_test.log');
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

// 生成测试模块数据
function generateTestModuleData() {
  const timestamp = Date.now();
  return {
    module_name: `DeleteTestModule_${timestamp}`,
    chip_model: 'TestChipModel',
    description: 'This is a test module for deletion',
    visible_scope: 'all'
  };
}

// 测试函数
async function runModuleDeleteTest(axiosInstance) {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    createTestModule: { success: false, message: '', status: null, data: null },
    moduleDelete: { success: false, message: '', status: null, data: null },
    verifyDeletion: { success: false, message: '', status: null, data: null },
    cookies: null,
    testData: null,
    moduleId: null
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

    console.log('\n=== 自动化测试：模块删除功能 ===');
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
      
      // 2. 创建一个测试模块用于删除
      console.log('\n2. 创建一个测试模块用于删除...');
      const testModuleData = generateTestModuleData();
      testResults.testData = testModuleData;
      
      const createResponse = await api.post('/api/modules/', testModuleData);
      
      testResults.createTestModule.status = createResponse.status;
      testResults.createTestModule.data = createResponse.data;
      
      if (createResponse.status === 201 && createResponse.data && createResponse.data.id) {
        testResults.createTestModule.success = true;
        testResults.createTestModule.message = '测试模块创建成功';
        
        const moduleId = createResponse.data.id;
        testResults.moduleId = moduleId;
        
        console.log(`✓ 测试模块创建成功，模块ID: ${moduleId}`);
        console.log(`   模块名称: ${testModuleData.module_name}`);
        
        // 3. 执行模块删除操作
        console.log('\n3. 执行模块删除操作...');
        const deleteResponse = await api.delete(`/api/modules/${moduleId}/`);
        
        testResults.moduleDelete.status = deleteResponse.status;
        
        if (deleteResponse.status === 204) {
          testResults.moduleDelete.success = true;
          testResults.moduleDelete.message = '模块删除成功';
          console.log('✓ 模块删除成功！');
          
          // 4. 验证模块是否被成功删除
          console.log('\n4. 验证模块是否被成功删除...');
          try {
            // 尝试获取已删除的模块
            const verifyResponse = await api.get(`/api/modules/${moduleId}/`);
            testResults.verifyDeletion.status = verifyResponse.status;
            testResults.verifyDeletion.data = verifyResponse.data;
            
            console.error('✗ 验证删除失败：模块仍然存在');
            console.error('  响应数据:', verifyResponse.data);
          } catch (error) {
            // 期望的错误情况：404 Not Found
            if (error.response && error.response.status === 404) {
              testResults.verifyDeletion.success = true;
              testResults.verifyDeletion.message = '删除验证成功，模块不存在';
              testResults.verifyDeletion.status = 404;
              console.log('✓ 删除验证成功！模块已不存在');
              success = true;
            } else {
              console.error('✗ 验证删除时发生意外错误:', error.message);
              if (error.response) {
                console.error('  错误状态码:', error.response.status);
                console.error('  错误响应数据:', error.response.data);
              }
            }
          }
        } else {
          console.error(`✗ 模块删除失败，状态码: ${deleteResponse.status}`);
          if (deleteResponse.data) {
            console.error('  响应数据:', deleteResponse.data);
          }
        }
      } else {
        console.error('✗ 测试模块创建失败');
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
  console.log(`创建测试模块: ${testResults.createTestModule.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`删除模块: ${testResults.moduleDelete.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`验证删除结果: ${testResults.verifyDeletion.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`整体测试: ${success ? '✓ 通过' : '✗ 失败'}`);
  
  return success;
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runModuleDeleteTest().then(result => {
    process.exit(result ? 0 : 1);
  });
}

export default runModuleDeleteTest;