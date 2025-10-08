import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * 自动化测试脚本 - 验证模块更新功能
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 获取模块列表并选择一个模块进行更新
 * 3. 更新模块信息并验证更新结果
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
    const logFilePath = join(__dirname, 'module_update_test.log');
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

// 生成更新测试数据
function generateUpdateData(originalModule) {
  const timestamp = Date.now();
  return {
    ...originalModule,
    module_name: `Updated_${originalModule.module_name}_${timestamp}`,
    description: 'This module has been updated by automated test'
  };
}

// 测试函数
async function runModuleUpdateTest(axiosInstance) {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    getModuleList: { success: false, message: '', status: null, data: null },
    moduleUpdate: { success: false, message: '', status: null, data: null },
    verifyUpdate: { success: false, message: '', status: null, data: null },
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

    console.log('\n=== 自动化测试：模块更新功能 ===');
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
      
      // 2. 获取模块列表
      console.log('\n2. 获取模块列表...');
      const moduleListResponse = await api.get('/api/modules/');
      
      testResults.getModuleList.status = moduleListResponse.status;
      testResults.getModuleList.data = moduleListResponse.data;
      
      if (moduleListResponse.status === 200 && 
          moduleListResponse.data && 
          Array.isArray(moduleListResponse.data.results) &&
          moduleListResponse.data.results.length > 0) {
        testResults.getModuleList.success = true;
        testResults.getModuleList.message = '获取模块列表成功';
        console.log(`✓ 获取模块列表成功，共${moduleListResponse.data.count}个模块`);
        
        // 选择第一个模块进行更新
        const moduleToUpdate = moduleListResponse.data.results[0];
        testResults.moduleId = moduleToUpdate.id;
        
        console.log(`\n3. 选择模块进行更新，模块ID: ${moduleToUpdate.id}`);
        console.log(`   更新前模块名称: ${moduleToUpdate.module_name}`);
        
        // 3. 生成更新数据并更新模块
        const updateData = generateUpdateData(moduleToUpdate);
        testResults.testData = updateData;
        
        console.log(`\n4. 调用模块更新接口，新名称: ${updateData.module_name}`);
        const updateResponse = await api.put(`/api/modules/${moduleToUpdate.id}/`, updateData);
        
        testResults.moduleUpdate.status = updateResponse.status;
        testResults.moduleUpdate.data = updateResponse.data;
        
        if (updateResponse.status === 200) {
          testResults.moduleUpdate.success = true;
          testResults.moduleUpdate.message = '模块更新成功';
          console.log('✓ 模块更新成功！');
          
          // 4. 验证更新结果
          console.log('\n5. 验证更新结果...');
          const verifyResponse = await api.get(`/api/modules/${moduleToUpdate.id}/`);
          
          testResults.verifyUpdate.status = verifyResponse.status;
          testResults.verifyUpdate.data = verifyResponse.data;
          
          if (verifyResponse.status === 200 && 
              verifyResponse.data && 
              verifyResponse.data.module_name === updateData.module_name &&
              verifyResponse.data.description === updateData.description) {
            testResults.verifyUpdate.success = true;
            testResults.verifyUpdate.message = '更新结果验证成功';
            console.log('✓ 更新结果验证成功！');
            console.log('\n更新后的模块详细信息:');
            console.log(`  ID: ${verifyResponse.data.id}`);
            console.log(`  模块名称: ${verifyResponse.data.module_name}`);
            console.log(`  描述: ${verifyResponse.data.description}`);
            console.log(`  更新时间: ${verifyResponse.data.update_time}`);
            
            success = true;
          } else {
            console.error('✗ 更新结果验证失败，数据不匹配');
            console.error('  期望名称:', updateData.module_name);
            console.error('  实际名称:', verifyResponse.data?.module_name);
          }
        } else {
          console.error(`✗ 模块更新失败，状态码: ${updateResponse.status}`);
          console.error('  响应数据:', updateResponse.data);
        }
      } else {
        console.error('✗ 获取模块列表失败或没有可用模块');
        console.error('  响应数据:', moduleListResponse.data);
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
  console.log(`获取模块列表: ${testResults.getModuleList.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`更新模块: ${testResults.moduleUpdate.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`验证更新结果: ${testResults.verifyUpdate.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`整体测试: ${success ? '✓ 通过' : '✗ 失败'}`);
  
  return success;
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runModuleUpdateTest().then(result => {
    process.exit(result ? 0 : 1);
  });
}

export default runModuleUpdateTest;