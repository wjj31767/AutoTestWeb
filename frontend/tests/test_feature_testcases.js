import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import axios from 'axios';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 自动化测试脚本 - 验证特性测试用例管理功能
 * 功能：
 * 1. 登录系统
 * 2. 创建测试模块
 * 3. 创建特性
 * 4. 创建测试用例
 * 5. 关联测试用例与特性
 * 6. 更新测试用例
 * 7. 验证特性关联的测试用例列表
 * 8. 删除测试用例
 * 9. 删除特性
 * 10. 清理：删除测试模块
 */

// 配置参数
const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 30000; // 增加超时时间到30秒
const TEST_USER = {
  username: 'test',
  password: 'test@123'
};

// 保存测试结果到文件
async function saveTestResult(result) {
  try {
    const testResultsDir = path.join(process.cwd(), 'test_results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    const logFilePath = path.join(testResultsDir, 'feature_testcases_result.json');
    await fs.promises.writeFile(
      logFilePath,
      JSON.stringify(result, null, 2),
      'utf8'
    );
    console.log(`测试结果已保存至: ${logFilePath}`);
  } catch (error) {
    console.error('保存测试结果失败:', error.message);
  }
}

// 手动处理Cookie和CSRF令牌
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

// 从Cookie中提取CSRF令牌
function getCSRFToken(cookies) {
  return cookies['csrftoken'] || '';
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
    module_name: `TestCaseModule_${timestamp}`,
    chip_model: 'TestChipModel',
    description: 'This is a test module for feature test case management',
    visible_scope: 'all'
  };
}

// 生成测试特性数据
function generateTestFeatureData(moduleId) {
  const timestamp = Date.now();
  return {
    feature_name: `TestFeature_${timestamp}`,
    description: 'This is a test feature',
    module_id: moduleId,
    enabled: true
  };
}

// 生成测试用例数据
function generateTestCaseData() {
  const timestamp = Date.now();
  return {
    case_name: `TestCase_${timestamp}`,
    description: 'This is a test case',
    steps: '1. Open the page\n2. Click the button\n3. Verify the result',
    expected_result: 'The page should display correctly, the button should be clickable, and the result should meet expectations',
    enabled: true
  };
}

// 生成更新测试用例数据
function generateUpdateTestCaseData(originalTestCase) {
  const timestamp = Date.now();
  return {
    ...originalTestCase,
    case_name: `Updated_${originalTestCase.case_name}_${timestamp}`,
    description: 'This test case has been updated by automated test',
    steps: '1. Open the page\n2. Click the button\n3. Verify the result\n4. Clean up the environment',
    expected_result: 'All steps should execute successfully and the result should meet expectations',
    enabled: !originalTestCase.enabled
  };
}

// 测试函数
async function runFeatureTestcasesTest(axiosInstance) {
  let success = false;
  let testResults = {
    timestamp: new Date().toISOString(),
    login: { success: false, status: null, message: '', data: null },
    createTestModule: { success: false, status: null, message: '', data: null, moduleId: null },
    createFeature: { success: false, status: null, message: '', data: null, featureId: null },
    createTestCase: { success: false, status: null, message: '', data: null, testCaseId: null },
    associateTestCase: { success: false, status: null, message: '', data: null },
    updateTestCase: { success: false, status: null, message: '', data: null },
    verifyTestCaseList: { success: false, status: null, message: '', data: null },
    deleteTestCase: { success: false, status: null, message: '' },
    deleteFeature: { success: false, status: null, message: '' },
    cookies: null,
    csrfToken: null,
    moduleId: null,
    featureId: null,
    testCaseId: null,
    error: null
  };

  try {
    // 创建axios实例（如果没有传入）
    const api = axiosInstance || axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('\n=== 自动化测试：特性测试用例管理功能 ===');
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
      
      // 提取CSRF令牌
      testResults.csrfToken = getCSRFToken(testResults.cookies);
      console.log('✓ CSRF令牌提取成功');
      
      // 检查是否有token返回，如果有则使用token认证
      let authToken = null;
      if (loginResponse.data && loginResponse.data.token) {
        authToken = loginResponse.data.token;
        console.log('✓ 登录token获取成功');
      }
      
      // 使用双重认证方式（同时设置token和cookie）
      if (authToken) {
        api.defaults.headers['Authorization'] = `Token ${authToken}`;
        console.log('✓ 使用Token认证');
      }
      // 设置Cookie认证
      api.defaults.headers.Cookie = createCookieString(testResults.cookies);
      // 设置CSRF令牌到请求头中
      api.defaults.headers['X-CSRFToken'] = testResults.csrfToken;
      console.log('✓ 使用Cookie和CSRF令牌认证');
      
      // 2. 创建一个测试模块用于特性测试
      console.log('\n2. 创建一个测试模块用于特性测试...');
      const testModuleData = generateTestModuleData();
      
      const createModuleResponse = await api.post('/api/modules/', testModuleData);
      
      testResults.createTestModule.status = createModuleResponse.status;
      testResults.createTestModule.data = createModuleResponse.data;
      
      if (createModuleResponse.status === 201 && createModuleResponse.data && createModuleResponse.data.id) {
        testResults.createTestModule.success = true;
        testResults.createTestModule.message = '测试模块创建成功';
        
        const moduleId = createModuleResponse.data.id;
        testResults.moduleId = moduleId;
        testResults.createTestModule.moduleId = moduleId;
        
        console.log(`✓ 测试模块创建成功，模块ID: ${moduleId}`);
        console.log(`   模块名称: ${testModuleData.module_name}`);
        
        // 3. 为模块添加特性
        console.log('\n3. 为模块添加特性...');
        const testFeatureData = generateTestFeatureData(moduleId);
        
        const createFeatureResponse = await api.post('/api/features/', testFeatureData);
        
        testResults.createFeature.status = createFeatureResponse.status;
        testResults.createFeature.data = createFeatureResponse.data;
        
        if (createFeatureResponse.status === 201 && createFeatureResponse.data && createFeatureResponse.data.id) {
          testResults.createFeature.success = true;
          testResults.createFeature.message = '特性创建成功';
          
          const featureId = createFeatureResponse.data.id;
          testResults.featureId = featureId;
          testResults.createFeature.featureId = featureId;
          
          console.log(`✓ 特性创建成功，特性ID: ${featureId}`);
          console.log(`   特性名称: ${testFeatureData.feature_name}`);
          
          // 4. 创建测试用例
          console.log('\n4. 创建测试用例...');
          const testCaseData = generateTestCaseData();
          
          const createTestCaseResponse = await api.post('/api/testcases/', testCaseData);
          
          testResults.createTestCase.status = createTestCaseResponse.status;
          testResults.createTestCase.data = createTestCaseResponse.data;
          
          if (createTestCaseResponse.status === 201 && createTestCaseResponse.data && createTestCaseResponse.data.id) {
            testResults.createTestCase.success = true;
            testResults.createTestCase.message = '测试用例创建成功';
            
            const testCaseId = createTestCaseResponse.data.id;
            testResults.testCaseId = testCaseId;
            testResults.createTestCase.testCaseId = testCaseId;
            
            console.log(`✓ 测试用例创建成功，测试用例ID: ${testCaseId}`);
            console.log(`   测试用例名称: ${testCaseData.case_name}`);
            
            // 5. 关联测试用例与特性
            console.log('\n5. 关联测试用例与特性...');
            const associateResponse = await api.post('/api/feature-testcase-relations/', {
              feature_id: featureId,
              testcase_id: testCaseId
            });
            
            testResults.associateTestCase.status = associateResponse.status;
            testResults.associateTestCase.data = associateResponse.data;
            
            if (associateResponse.status === 201) {
              testResults.associateTestCase.success = true;
              testResults.associateTestCase.message = '测试用例与特性关联成功';
              console.log('✓ 测试用例与特性关联成功！');
              
              // 6. 更新测试用例
              console.log('\n6. 更新测试用例...');
              const updateTestCaseData = generateUpdateTestCaseData(createTestCaseResponse.data);
              
              const updateTestCaseResponse = await api.put(`/api/testcases/${testCaseId}/`, updateTestCaseData);
              
              testResults.updateTestCase.status = updateTestCaseResponse.status;
              testResults.updateTestCase.data = updateTestCaseResponse.data;
              
              if (updateTestCaseResponse.status === 200) {
                testResults.updateTestCase.success = true;
                testResults.updateTestCase.message = '测试用例更新成功';
                console.log('✓ 测试用例更新成功！');
                console.log(`   新测试用例名称: ${updateTestCaseData.case_name}`);
                console.log(`   新启用状态: ${updateTestCaseData.enabled}`);
                
                // 7. 获取特性关联的测试用例列表
                console.log('\n7. 获取特性关联的测试用例列表...');
                const testCaseListResponse = await api.get(`/api/features/${featureId}/feature-testcases/`);
                
                testResults.verifyTestCaseList.status = testCaseListResponse.status;
                testResults.verifyTestCaseList.data = testCaseListResponse.data;
                
                if (testCaseListResponse.status === 200 && 
                    testCaseListResponse.data && 
                    Array.isArray(testCaseListResponse.data.results)) {
                  testResults.verifyTestCaseList.success = true;
                  testResults.verifyTestCaseList.message = '获取特性列表成功';
                  console.log(`✓ 获取特性列表成功，共${testCaseListResponse.data.count}个特性`);
                  
                  // 8. 删除测试用例
                  console.log('\n8. 删除测试用例...');
                  
                  // 先删除关联关系
                  const relationsResponse = await api.get('/api/feature-testcase-relations/', {
                    params: {
                      feature_id: featureId,
                      testcase_id: testCaseId
                    }
                  });
                  
                  if (relationsResponse.status === 200) {
                    for (const relation of relationsResponse.data.results) {
                      await api.delete(`/api/feature-testcase-relations/${relation.id}/`);
                    }
                    console.log('   ✓ 测试用例与特性关联关系已删除');
                  }
                  
                  // 再删除测试用例
                  const deleteTestCaseResponse = await api.delete(`/api/testcases/${testCaseId}/`);
                  
                  testResults.deleteTestCase.status = deleteTestCaseResponse.status;
                  
                  if (deleteTestCaseResponse.status === 204) {
                    testResults.deleteTestCase.success = true;
                    testResults.deleteTestCase.message = '测试用例删除成功';
                    console.log('✓ 测试用例删除成功！');
                    
                    // 9. 删除特性
                    console.log('\n9. 删除特性...');
                    const deleteFeatureResponse = await api.delete(`/api/features/${featureId}/`);
                    
                    testResults.deleteFeature.status = deleteFeatureResponse.status;
                    
                    if (deleteFeatureResponse.status === 204) {
                      testResults.deleteFeature.success = true;
                      testResults.deleteFeature.message = '特性删除成功';
                      console.log('✓ 特性删除成功！');
                      
                      // 10. 清理：删除测试模块
                      console.log('\n10. 清理：删除测试模块...');
                      await api.delete(`/api/modules/${moduleId}/`);
                      console.log('✓ 测试模块删除成功！');
                      
                      success = true;
                    } else {
                      console.error(`✗ 特性删除失败，状态码: ${deleteFeatureResponse.status}`);
                      if (deleteFeatureResponse.data) {
                        console.error('  响应数据:', deleteFeatureResponse.data);
                      }
                    }
                  } else {
                    console.error(`✗ 测试用例删除失败，状态码: ${deleteTestCaseResponse.status}`);
                    if (deleteTestCaseResponse.data) {
                      console.error('  响应数据:', deleteTestCaseResponse.data);
                    }
                  }
                } else {
                  console.error('✗ 获取特性关联的测试用例列表失败');
                  console.error('  响应数据:', testCaseListResponse.data);
                }
              } else {
                console.error(`✗ 测试用例更新失败，状态码: ${updateTestCaseResponse.status}`);
                console.error('  响应数据:', updateTestCaseResponse.data);
              }
            } else {
              console.error(`✗ 测试用例与特性关联失败，状态码: ${associateResponse.status}`);
              if (associateResponse.data) {
                console.error('  响应数据:', associateResponse.data);
              }
            }
          } else {
            console.error('✗ 测试用例创建失败');
            console.error('  响应数据:', createTestCaseResponse.data);
          }
        } else {
          console.error('✗ 特性创建失败');
          console.error('  响应数据:', createFeatureResponse.data);
        }
      } else {
        console.error('✗ 测试模块创建失败');
        console.error('  响应数据:', createModuleResponse.data);
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
    
    // 清理：如果测试数据已创建，则尝试删除
    if (testResults.moduleId || testResults.featureId || testResults.testCaseId) {
      try {
        const api = axiosInstance || axios.create({ baseURL: BASE_URL });
        api.defaults.headers.Cookie = createCookieString(testResults.cookies);
        
        // 删除测试用例关联关系
        if (testResults.featureId && testResults.testCaseId) {
          try {
            const relationsResponse = await api.get('/api/feature-testcase-relations/', {
              params: {
                feature_id: testResults.featureId,
                testcase_id: testResults.testCaseId
              }
            });
            
            if (relationsResponse.status === 200) {
              for (const relation of relationsResponse.data.results) {
                await api.delete(`/api/feature-testcase-relations/${relation.id}/`);
              }
            }
          } catch (cleanupError) {
            console.error('✗ 清理测试用例关联关系失败:', cleanupError.message);
          }
        }
        
        // 删除测试用例
        if (testResults.testCaseId) {
          try {
            await api.delete(`/api/testcases/${testResults.testCaseId}/`);
            console.log('✓ 清理：测试用例已删除');
          } catch (cleanupError) {
            console.error('✗ 清理测试用例失败:', cleanupError.message);
          }
        }
        
        // 删除特性
        if (testResults.featureId) {
          try {
            await api.delete(`/api/features/${testResults.featureId}/`);
            console.log('✓ 清理：特性已删除');
          } catch (cleanupError) {
            console.error('✗ 清理特性失败:', cleanupError.message);
          }
        }
        
        // 删除测试模块
        if (testResults.moduleId) {
          try {
            await api.delete(`/api/modules/${testResults.moduleId}/`);
            console.log('✓ 清理：测试模块已删除');
          } catch (cleanupError) {
            console.error('✗ 清理测试模块失败:', cleanupError.message);
          }
        }
      } catch (cleanupError) {
        console.error('✗ 清理测试数据时发生错误:', cleanupError.message);
      }
    }
  }
  
  // 保存测试结果
  await saveTestResult(testResults);
  
  // 输出测试总结
  console.log('\n=== 测试总结 ===');
  console.log(`登录: ${testResults.login.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`创建测试模块: ${testResults.createTestModule.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`创建特性: ${testResults.createFeature.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`创建测试用例: ${testResults.createTestCase.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`关联测试用例与特性: ${testResults.associateTestCase.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`更新测试用例: ${testResults.updateTestCase.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`验证测试用例列表: ${testResults.verifyTestCaseList.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`删除测试用例: ${testResults.deleteTestCase.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`删除特性: ${testResults.deleteFeature.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`整体测试: ${success ? '✓ 通过' : '✗ 失败'}`);
  
  return success;
}

// 直接执行测试函数
console.log(`脚本路径: ${import.meta.url}`);
console.log(`进程参数: ${process.argv.join(', ')}`);
console.log('直接执行测试函数...');
runFeatureTestcasesTest().then(result => {
  console.log(`测试结果: ${result ? '通过' : '失败'}`);
  process.exit(result ? 0 : 1);
}).catch(error => {
  console.error('测试执行过程中发生未捕获的错误:', error);
  process.exit(1);
});

export default runFeatureTestcasesTest;