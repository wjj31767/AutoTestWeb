import http from 'http';
import process from 'process';
import { appendFile } from 'fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// 添加调试模式
const DEBUG_MODE = true;

// 调试日志函数
function debug(message) {
  if (DEBUG_MODE) {
    console.log(`[DEBUG] ${message}`);
  }
}

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

debug(`当前文件路径: ${__filename}`);
debug(`当前目录: ${__dirname}`);

// 配置参数
const BASE_URL = 'http://localhost:8000';
const TIMEOUT = 10000;
const TEST_USER = {
  username: 'test',
  password: 'test@123'
};

// 日志函数
function log(message) {
  console.log(message);
}

// 保存测试结果到文件
async function saveTestResult(result) {
  try {
    const logFilePath = join(__dirname, 'feature_testcase_basic_test.log');
    debug(`保存测试结果到: ${logFilePath}`);
    await appendFile(
      logFilePath,
      JSON.stringify(result) + '\n'
    );
    log(`测试结果已保存到: ${logFilePath}`);
  } catch (error) {
    log('保存测试结果失败:', error.message);
    debug(`保存测试结果详细错误: ${error.stack}`);
  }
}

// 发送HTTP请求的函数
function sendRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    // 确保Content-Length被正确设置
    if (postData && !options.headers) {
      options.headers = {};
    }
    
    if (postData && options.headers && !options.headers['Content-Length']) {
      const postDataStr = JSON.stringify(postData);
      options.headers['Content-Length'] = Buffer.byteLength(postDataStr);
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // 尝试解析JSON响应
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsedData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      const postDataStr = JSON.stringify(postData);
      req.write(postDataStr);
    }
    
    req.end();
  });
}

// 提取Cookie的函数
function extractCookies(headers) {
  const cookies = {};
  const cookieHeader = headers['set-cookie'] || [];
  
  cookieHeader.forEach(cookie => {
    const parts = cookie.split(';')[0].split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[key] = value;
    }
  });
  
  return cookies;
}

// 构建Cookie字符串的函数
function buildCookieString(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

// 从Cookie中提取CSRF令牌
function getCSRFToken(cookies) {
  return cookies['csrftoken'] || '';
}

// 全局计数器，用于确保ID唯一性
let globalCounter = 0;

// 生成唯一ID的辅助函数
function generateUniqueId(prefix) {
  const timestamp = Date.now();
  const counter = ++globalCounter; // 递增计数器
  const random = Math.floor(Math.random() * 1000000); // 更大范围的随机数
  const randomChars = Math.random().toString(36).substring(2, 10); // 更多的随机字符
  
  // 确保特性ID格式正确
  if (prefix === 'feature-basic') {
    return `feature-${timestamp}-${counter}-${random}-${randomChars}`;
  } 
  // 确保测试用例ID格式正确
  else if (prefix === 'case-basic') {
    return `case-${timestamp}-${counter}-${random}-${randomChars}`;
  } 
  // 其他类型的ID保持原有格式
  else {
    return `${prefix}-${timestamp}-${counter}-${random}-${randomChars}`;
  }
}

// 生成测试模块数据 - 为模块创建提供ID（因为后端需要客户端提供自定义主键）
function generateTestModuleData() {
  const moduleId = generateUniqueId('module-feature-basic');
  return {
    id: moduleId,
    module_name: `FeatureBasicModule_${generateUniqueId('')}`,
    chip_model: 'TestChip',
    description: 'This is a test module for feature test case basic operations',
    visible_scope: 'all'
  };
}

// 生成测试特性数据 - 不提供ID，让后端自动生成（我们已经在后端添加了自动生成ID的逻辑）
function generateTestFeatureData(moduleId) {
  return {
    feature_name: `BasicFeature_${generateUniqueId('')}`,
    description: 'This is a basic test feature',
    module_id: moduleId
  };
}

// 直接创建特性的函数 - 绕过序列化器限制
async function createFeature(featureData) {
  try {
    const response = await fetch(`${baseUrl}/api/features/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(featureData)
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('特性创建成功:', data);
    return data;
  } catch (error) {
    console.error('特性创建失败:', error);
    throw error;
  }
}

// 生成测试用例数据 - 不提供ID，让后端自动生成
function generateTestCaseData(featureId) {
  const systemTestCaseId = generateUniqueId('TC');
  return {
    case_id: systemTestCaseId,
    case_name: `BasicTestCase_${generateUniqueId('')}`,
    feature_id: featureId,
    description: 'This is a basic test case',
    pre_condition: 'The system should be running normally',
    steps: '1. Open the application\n2. Navigate to the feature\n3. Perform the action\n4. Verify the result',
    expected_result: 'The action should be performed successfully and the result should be as expected',
    script_path: '/test_scripts/basic_test.py',
    status: 'active',
    // 添加必填字段
    priority: 50, // 设置为中等优先级
    test_type: 'manual', // 手动测试
    test_phase: 'system', // 系统测试阶段
    creator: 'test' // 设置创建者
  };
}

// 测试函数
async function runFeatureTestCaseBasicTest() {
  debug('开始执行测试函数...');
  log('\n=== 特性测试用例基本操作测试 ===');
  log('测试时间:', new Date().toLocaleString());
  log('测试用户:', TEST_USER.username);
  
  // 测试结果对象
  let testResults = {
    timestamp: new Date().toISOString(),
    login: { success: false, status: null, message: '', data: null },
    createTestModule: { success: false, status: null, message: '', data: null, moduleId: null },
    selectModule: { success: false, status: null, message: '', data: null },
    createFeature: { success: false, status: null, message: '', data: null, featureId: null },
    createTestCase: { success: false, status: null, message: '', data: null, testCaseId: null },
    cookies: {},
    authToken: '',
    csrfToken: '',
    error: null
  };
  
  try {
    // 1. 登录系统
    log('\n1. 执行登录请求...');
    const loginResponse = await sendRequest({
      hostname: 'localhost',
      port: 8000,
      path: '/api/user/login/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, TEST_USER);
    
    testResults.login.status = loginResponse.statusCode;
    testResults.login.data = loginResponse.data;
    
    if (loginResponse.statusCode === 200) {
      testResults.login.success = true;
      testResults.login.message = '登录成功';
      log('✓ 登录成功！用户信息: ' + JSON.stringify(loginResponse.data));
      
      // 提取并保存Cookie和Token
      const newCookies = extractCookies(loginResponse.headers);
      testResults.cookies = newCookies;
      testResults.authToken = loginResponse.data.token || '';
      testResults.csrfToken = getCSRFToken(newCookies);
      
      log(`✓ Cookie提取成功: ${Object.keys(newCookies).join(', ')}`);
      log(`✓ CSRF令牌提取成功: ${testResults.csrfToken.substring(0, 10)}...`);
      log(`✓ 登录token获取成功: ${testResults.authToken ? '是' : '否'}`);
      
      // 2. 创建测试模块
      log('\n2. 创建测试模块...');
      const testModuleData = generateTestModuleData();
      
      const createModuleResponse = await sendRequest({
              hostname: 'localhost',
              port: 8000,
              path: '/api/modules/',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': buildCookieString(testResults.cookies),
                'Authorization': testResults.authToken ? `Bearer ${testResults.authToken}` : undefined,
                'X-CSRFToken': testResults.csrfToken
              }
            }, testModuleData);
      
      testResults.createTestModule.status = createModuleResponse.statusCode;
      testResults.createTestModule.data = createModuleResponse.data;
      
      if (createModuleResponse.statusCode === 201 && createModuleResponse.data && createModuleResponse.data.id) {
        testResults.createTestModule.success = true;
        testResults.createTestModule.message = '测试模块创建成功';
        testResults.createTestModule.moduleId = createModuleResponse.data.id;
        
        log(`✓ 测试模块创建成功，模块ID: ${createModuleResponse.data.id}`);
        log(`   模块名称: ${testModuleData.module_name}`);
        
        // 3. 模块选择（通过获取模块列表并选择刚创建的模块）
        log('\n3. 模块选择...');
        const moduleListResponse = await sendRequest({
              hostname: 'localhost',
              port: 8000,
              path: '/api/modules/',
              method: 'GET',
              headers: {
                'Cookie': buildCookieString(testResults.cookies),
                'Authorization': testResults.authToken ? `Bearer ${testResults.authToken}` : undefined,
                'X-CSRFToken': testResults.csrfToken
              }
            });
        
        testResults.selectModule.status = moduleListResponse.statusCode;
        
        if (moduleListResponse.statusCode === 200) {
          let modules = [];
          if (Array.isArray(moduleListResponse.data)) {
            modules = moduleListResponse.data;
          } else if (moduleListResponse.data.results && Array.isArray(moduleListResponse.data.results)) {
            modules = moduleListResponse.data.results;
          }
          
          const selectedModule = modules.find(module => module.id === createModuleResponse.data.id);
          
          if (selectedModule) {
            testResults.selectModule.success = true;
            testResults.selectModule.message = '模块选择成功';
            testResults.selectModule.data = selectedModule;
            log(`✓ 模块选择成功: ${selectedModule.module_name}`);
            
            // 4. 特性新建
            log('\n4. 特性新建...');
            const moduleId = createModuleResponse.data.id;
            const testFeatureData = generateTestFeatureData(moduleId);
            
            debug(`发送的特性数据: ${JSON.stringify(testFeatureData)}`);
            
            const createFeatureResponse = await sendRequest({
              hostname: 'localhost',
              port: 8000,
              path: '/api/features/',
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Cookie': buildCookieString(testResults.cookies),
                'Authorization': testResults.authToken ? `Bearer ${testResults.authToken}` : undefined,
                'X-CSRFToken': testResults.csrfToken
              }
            }, testFeatureData);
            
            testResults.createFeature.status = createFeatureResponse.statusCode;
            testResults.createFeature.data = createFeatureResponse.data;
            
            debug(`特性创建响应状态码: ${createFeatureResponse.statusCode}`);
            debug(`特性创建响应体: ${JSON.stringify(createFeatureResponse.data)}`);
            
            if (createFeatureResponse.statusCode === 201 && createFeatureResponse.data) {
              testResults.createFeature.success = true;
              testResults.createFeature.message = '特性创建成功';
              testResults.createFeature.featureId = createFeatureResponse.data.id || testFeatureData.id;
              
              log(`✓ 特性创建成功，特性ID: ${createFeatureResponse.data.id}`);
              log(`   特性名称: ${testFeatureData.feature_name}`);
              
              // 5. 测试用例新建
              log('\n5. 测试用例新建...');
              const featureId = createFeatureResponse.data.id;
              const testCaseData = generateTestCaseData(featureId);
              
              const createTestCaseResponse = await sendRequest({
                hostname: 'localhost',
                port: 8000,
                path: '/api/testcases/',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Cookie': buildCookieString(testResults.cookies),
                  'Authorization': testResults.authToken ? `Bearer ${testResults.authToken}` : undefined,
                  'X-CSRFToken': testResults.csrfToken
                }
              }, testCaseData);
              
              testResults.createTestCase.status = createTestCaseResponse.statusCode;
              testResults.createTestCase.data = createTestCaseResponse.data;
              
              if (createTestCaseResponse.statusCode === 201 && createTestCaseResponse.data && createTestCaseResponse.data.id) {
                testResults.createTestCase.success = true;
                testResults.createTestCase.message = '测试用例创建成功';
                testResults.createTestCase.testCaseId = createTestCaseResponse.data.id;
                
                log(`✓ 测试用例创建成功，测试用例ID: ${createTestCaseResponse.data.id}`);
                log(`   测试用例名称: ${testCaseData.case_name}`);
                
                // 6. 关联测试用例与特性
                log('\n6. 关联测试用例与特性...');
                const associateResponse = await sendRequest({
                  hostname: 'localhost',
                  port: 8000,
                  path: '/api/feature-testcase-relations/',
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Cookie': buildCookieString(testResults.cookies),
                    'Authorization': testResults.authToken ? `Bearer ${testResults.authToken}` : undefined,
                    'X-CSRFToken': testResults.csrfToken
                  }
                }, {
                  feature_id: featureId,
                  test_case_id: createTestCaseResponse.data.id
                });
                
                if (associateResponse.statusCode === 201) {
                  log('✓ 测试用例与特性关联成功！');
                } else {
                  log(`✗ 测试用例与特性关联失败，状态码: ${associateResponse.statusCode}`);
                  log(`  响应数据: ${JSON.stringify(associateResponse.data)}`);
                }
              } else {
                log('✗ 测试用例创建失败');
                log('  响应数据:', createTestCaseResponse.data);
              }
            } else {
              log('✗ 特性创建失败');
              log('  响应数据:', createFeatureResponse.data);
            }
          } else {
            log('✗ 未找到刚创建的模块，模块选择失败');
          }
        } else {
          log(`✗ 获取模块列表失败，状态码: ${moduleListResponse.statusCode}`);
          log(`  响应数据: ${JSON.stringify(moduleListResponse.data)}`);
        }
      } else {
        log('✗ 测试模块创建失败');
        log('  响应数据:', createModuleResponse.data);
      }
    } else {
      log(`✗ 登录失败，状态码: ${loginResponse.statusCode}`);
      log(`  响应数据: ${JSON.stringify(loginResponse.data)}`);
    }
  } catch (error) {
    log('✗ 测试执行过程中发生错误:', error.message);
    if (error.response) {
      log('  错误状态码:', error.response.status);
      log('  错误响应数据:', error.response.data);
    }
    testResults.error = error.message;
  }
  
  // 保存测试结果
  await saveTestResult(testResults);
  
  // 输出测试总结
  log('\n=== 测试总结 ===');
  log(`登录: ${testResults.login.success ? '✓ 成功' : '✗ 失败'}`);
  log(`创建测试模块: ${testResults.createTestModule.success ? '✓ 成功' : '✗ 失败'}`);
  log(`模块选择: ${testResults.selectModule.success ? '✓ 成功' : '✗ 失败'}`);
  log(`特性新建: ${testResults.createFeature.success ? '✓ 成功' : '✗ 失败'}`);
  log(`测试用例新建: ${testResults.createTestCase.success ? '✓ 成功' : '✗ 失败'}`);
  
  const overallSuccess = testResults.login.success && 
                        testResults.createTestModule.success && 
                        testResults.selectModule.success && 
                        testResults.createFeature.success && 
                        testResults.createTestCase.success;
  
  log(`整体测试: ${overallSuccess ? '✓ 通过' : '✗ 失败'}`);
  
  if (overallSuccess) {
    log('\n=== 特性测试用例基本操作测试成功完成 ===');
  } else {
    log('\n=== 特性测试用例基本操作测试失败 ===');
  }
  
  return overallSuccess;
}

// 执行测试函数
// 直接调用测试函数，不进行条件判断
debug('直接执行测试函数...');
runFeatureTestCaseBasicTest().then(result => {
  log(`测试结果: ${result ? '通过' : '失败'}`);
  process.exit(result ? 0 : 1);
}).catch(error => {
  log('测试执行过程中发生未捕获的错误:', error);
  process.exit(1);
});

export default runFeatureTestCaseBasicTest;