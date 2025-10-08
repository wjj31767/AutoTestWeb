import { appendFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/**
 * 自动化测试脚本 - 验证模块特性CRUD功能
 * 功能：
 * 1. 使用test/test@123登录系统
 * 2. 创建一个新的测试模块
 * 3. 为该模块添加特性
 * 4. 更新特性信息
 * 5. 删除特性
 * 6. 验证所有操作结果
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
    const logFilePath = join(__dirname, 'module_features_test.log');
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
    module_name: `FeatureTestModule_${timestamp}`,
    chip_model: 'TestChipModel',
    description: 'This is a test module for feature CRUD',
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

// 生成更新特性数据
function generateUpdateFeatureData(originalFeature) {
  const timestamp = Date.now();
  return {
    ...originalFeature,
    feature_name: `Updated_${originalFeature.feature_name}_${timestamp}`,
    description: 'This feature has been updated by automated test',
    enabled: !originalFeature.enabled
  };
}

// 测试函数
async function runModuleFeaturesTest(axiosInstance) {
  let success = false;
  let testResults = {
    login: { success: false, message: '', status: null, data: null },
    createTestModule: { success: false, message: '', status: null, data: null },
    createFeature: { success: false, message: '', status: null, data: null },
    updateFeature: { success: false, message: '', status: null, data: null },
    deleteFeature: { success: false, message: '', status: null, data: null },
    verifyFeatureList: { success: false, message: '', status: null, data: null },
    cookies: null,
    moduleId: null,
    featureId: null
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

    console.log('\n=== 自动化测试：模块特性CRUD功能 ===');
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
          
          console.log(`✓ 特性创建成功，特性ID: ${featureId}`);
          console.log(`   特性名称: ${testFeatureData.feature_name}`);
          
          // 4. 更新特性信息
          console.log('\n4. 更新特性信息...');
          const updateFeatureData = generateUpdateFeatureData(createFeatureResponse.data);
          
          const updateFeatureResponse = await api.put(`/api/features/${featureId}/`, updateFeatureData);
          
          testResults.updateFeature.status = updateFeatureResponse.status;
          testResults.updateFeature.data = updateFeatureResponse.data;
          
          if (updateFeatureResponse.status === 200) {
            testResults.updateFeature.success = true;
            testResults.updateFeature.message = '特性更新成功';
            console.log('✓ 特性更新成功！');
            console.log(`   新特性名称: ${updateFeatureData.feature_name}`);
            console.log(`   新启用状态: ${updateFeatureData.enabled}`);
            
            // 5. 获取模块的特性列表
            console.log('\n5. 获取模块的特性列表...');
            const featureListResponse = await api.get(`/api/modules/${moduleId}/features/`);
            
            testResults.verifyFeatureList.status = featureListResponse.status;
            testResults.verifyFeatureList.data = featureListResponse.data;
            
            if (featureListResponse.status === 200 && 
                featureListResponse.data && 
                Array.isArray(featureListResponse.data.results)) {
              testResults.verifyFeatureList.success = true;
              testResults.verifyFeatureList.message = '获取特性列表成功';
              console.log(`✓ 获取特性列表成功，共${featureListResponse.data.count}个特性`);
              
              // 6. 删除特性
              console.log('\n6. 删除特性...');
              const deleteFeatureResponse = await api.delete(`/api/features/${featureId}/`);
              
              testResults.deleteFeature.status = deleteFeatureResponse.status;
              
              if (deleteFeatureResponse.status === 204) {
                testResults.deleteFeature.success = true;
                testResults.deleteFeature.message = '特性删除成功';
                console.log('✓ 特性删除成功！');
                
                // 7. 清理：删除测试模块
                console.log('\n7. 清理：删除测试模块...');
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
              console.error('✗ 获取特性列表失败');
              console.error('  响应数据:', featureListResponse.data);
            }
          } else {
            console.error(`✗ 特性更新失败，状态码: ${updateFeatureResponse.status}`);
            console.error('  响应数据:', updateFeatureResponse.data);
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
    
    // 清理：如果模块已创建，则尝试删除
    if (testResults.moduleId) {
      try {
        const api = axiosInstance || require('axios').create({ baseURL: BASE_URL });
        api.defaults.headers.Cookie = createCookieString(testResults.cookies);
        await api.delete(`/api/modules/${testResults.moduleId}/`);
        console.log('✓ 清理：测试模块已删除');
      } catch (cleanupError) {
        console.error('✗ 清理测试模块失败:', cleanupError.message);
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
  console.log(`更新特性: ${testResults.updateFeature.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`获取特性列表: ${testResults.verifyFeatureList.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`删除特性: ${testResults.deleteFeature.success ? '✓ 成功' : '✗ 失败'}`);
  console.log(`整体测试: ${success ? '✓ 通过' : '✗ 失败'}`);
  
  return success;
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runModuleFeaturesTest().then(result => {
    process.exit(result ? 0 : 1);
  });
}

export default runModuleFeaturesTest;