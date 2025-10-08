import { appendFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 导入各个测试模块
import runModuleListTest from './test_module_list.js';
import runModuleCreateTest from './test_module_create.js';
import runModuleUpdateTest from './test_module_update.js';
import runModuleDeleteTest from './test_module_delete.js';
import runModuleFeaturesTest from './test_module_features.js';

/**
 * 自动化测试脚本 - 模块管理CRUD整合测试
 * 功能：
 * 1. 按照顺序运行所有模块相关测试
 * 2. 收集测试结果并生成报告
 * 3. 保存详细的测试结果到JSON文件
 */

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置参数
const BASE_URL = 'http://localhost:5173';
const TIMEOUT = 10000;

// 保存测试结果到文件
async function saveTestResult(result) {
  try {
    const logFilePath = join(__dirname, 'module_crud_test_results.json');
    const formattedResult = JSON.stringify(result, null, 2);
    
    await writeFile(logFilePath, formattedResult);
    console.log(`测试结果已保存到: ${logFilePath}`);
    
    // 同时追加到日志文件
    const logAppendPath = join(__dirname, 'module_crud_test.log');
    await appendFile(
      logAppendPath,
      `\n=== 测试运行时间: ${new Date().toLocaleString()} ===\n` + 
      `${formattedResult}\n`
    );
  } catch (error) {
    console.error('保存测试结果失败:', error.message);
  }
}

// 创建通用的axios实例
function createAxiosInstance() {
  const axios = require('axios');
  return axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    }
  });
}

// 检查API连接性
async function checkApiConnectivity() {
  console.log('\n=== 检查API连接性 ===');
  
  try {
    const axios = createAxiosInstance();
    const response = await axios.get('/api');
    
    console.log('✓ API连接正常');
    return true;
  } catch (error) {
    console.error('✗ API连接失败:', error.message);
    if (error.response) {
      console.error('  状态码:', error.response.status);
    }
    return false;
  }
}

// 主测试运行器
async function runAllModuleTests() {
  let overallSuccess = true;
  const testResults = {
    startTime: new Date().toISOString(),
    tests: {},
    overallStatus: 'failed'
  };

  try {
    console.log('\n=====================================================================');
    console.log('                       模块管理系统CRUD自动化测试                      ');
    console.log('=====================================================================');
    console.log('测试时间:', new Date().toLocaleString());
    console.log('测试目标:', BASE_URL);

    // 1. 检查API连接性
    const isConnected = await checkApiConnectivity();
    if (!isConnected) {
      console.error('\n✗ 测试无法继续，API连接失败');
      testResults.overallStatus = 'failed';
      await saveTestResult(testResults);
      return false;
    }

    // 创建共享的axios实例
    const axiosInstance = createAxiosInstance();
    
    // 2. 按顺序执行测试
    const testsToRun = [
      { name: 'moduleList', testFunction: runModuleListTest, description: '模块列表测试' },
      { name: 'moduleCreate', testFunction: runModuleCreateTest, description: '模块创建测试' },
      { name: 'moduleUpdate', testFunction: runModuleUpdateTest, description: '模块更新测试' },
      { name: 'moduleDelete', testFunction: runModuleDeleteTest, description: '模块删除测试' },
      { name: 'moduleFeatures', testFunction: runModuleFeaturesTest, description: '模块特性CRUD测试' }
    ];

    for (const test of testsToRun) {
      console.log('\n' + '='.repeat(70));
      console.log(`正在执行: ${test.description}`);
      console.log('='.repeat(70));
      
      const testStartTime = Date.now();
      try {
        const success = await test.testFunction(axiosInstance);
        const testEndTime = Date.now();
        
        testResults.tests[test.name] = {
          success: success,
          description: test.description,
          duration: testEndTime - testStartTime + 'ms',
          timestamp: new Date().toISOString()
        };
        
        if (!success) {
          overallSuccess = false;
          console.log(`✗ ${test.description}失败`);
        } else {
          console.log(`✓ ${test.description}通过`);
        }
      } catch (error) {
        const testEndTime = Date.now();
        testResults.tests[test.name] = {
          success: false,
          description: test.description,
          duration: testEndTime - testStartTime + 'ms',
          timestamp: new Date().toISOString(),
          error: error.message
        };
        
        overallSuccess = false;
        console.error(`✗ ${test.description}执行异常:`, error.message);
      }
    }

  } catch (error) {
    console.error('✗ 测试运行器发生严重错误:', error.message);
    testResults.error = error.message;
    overallSuccess = false;
  } finally {
    // 记录测试结束时间和总体状态
    testResults.endTime = new Date().toISOString();
    testResults.overallStatus = overallSuccess ? 'passed' : 'failed';
    
    // 保存测试结果
    await saveTestResult(testResults);
    
    // 输出测试总结报告
    console.log('\n=====================================================================');
    console.log('                           测试总结报告                              ');
    console.log('=====================================================================');
    console.log(`总体状态: ${testResults.overallStatus.toUpperCase()}`);
    console.log(`测试开始: ${new Date(testResults.startTime).toLocaleString()}`);
    console.log(`测试结束: ${new Date(testResults.endTime).toLocaleString()}`);
    
    const totalTests = Object.keys(testResults.tests).length;
    const passedTests = Object.values(testResults.tests).filter(test => test.success).length;
    console.log(`测试总数: ${totalTests}, 通过: ${passedTests}, 失败: ${totalTests - passedTests}`);
    
    console.log('\n详细测试结果:');
    Object.entries(testResults.tests).forEach(([key, test]) => {
      console.log(`  ${test.description}: ${test.success ? '✓ 通过' : '✗ 失败'} (${test.duration})`);
      if (test.error) {
        console.log(`    错误信息: ${test.error}`);
      }
    });
    
    console.log('\n=====================================================================');
  }

  return overallSuccess;
}

// 如果直接运行此脚本，则执行测试
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllModuleTests().then(result => {
    process.exit(result ? 0 : 1);
  });
}

export default runAllModuleTests;