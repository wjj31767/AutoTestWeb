import axios from 'axios';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 导入所有环境管理相关的测试模块
import runEnvironmentListTest from './test_environment_list.js';
import runEnvironmentListEmptyTest from './test_environment_list_empty.js';
import runEnvironmentListEnhancedTest from './test_environment_list_enhanced.js';
import runEnvironmentPermissionTest from './test_environment_permissions.js';
import runNormalUserCreateEnvTest from './test_normal_user_create_env.js';
import runEnvironmentDetailTest from './test_environment_detail.js';
import runEnvironmentUpdateTest from './test_environment_update.js';
import runEnvironmentDeleteTest from './test_environment_delete.js';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 环境管理CRUD整合测试运行器
 * 功能：
 * 1. 按顺序运行所有环境管理相关的测试
 * 2. 收集每个测试的结果
 * 3. 生成综合测试报告
 * 4. 提供清晰的测试结果统计
 */
async function runAllEnvironmentTests() {
  // 动态导入axios
  const axiosModule = await import('axios');
  const axios = axiosModule.default;
  console.log('\n=====================================================');
  console.log('               环境管理CRUD综合测试                  ');
  console.log('=====================================================');
  
  // 记录开始时间
  const startTime = new Date();
  
  // 测试结果对象
  const overallResult = {
    timestamp: startTime.toISOString(),
    totalTests: 8,
    passedTests: 0,
    failedTests: 0,
    testResults: [],
    executionTime: 0,
  };

  // 测试配置
  const testConfig = [
    { name: '环境列表接口测试', testFunction: runEnvironmentListTest },
    { name: '环境列表空数据处理测试', testFunction: runEnvironmentListEmptyTest },
    { name: '环境列表增强功能测试', testFunction: runEnvironmentListEnhancedTest, withAxios: true },
    { name: '环境创建权限测试', testFunction: runEnvironmentPermissionTest, withAxios: true },
    { name: '普通用户创建环境测试', testFunction: runNormalUserCreateEnvTest },
    { name: '环境详情接口测试', testFunction: runEnvironmentDetailTest },
    { name: '环境更新接口测试', testFunction: runEnvironmentUpdateTest },
    { name: '环境删除接口测试', testFunction: runEnvironmentDeleteTest },
  ];

  try {
    // 1. 测试API连接性
    console.log('\n【测试前检查】API连接性测试...');
    const api = axios.create({
      baseURL: 'http://localhost:5173',
      timeout: 5000
    });
    
    try {
      const testResponse = await api.get('/api/');
      console.log('✅ API连接测试成功！');
    } catch (testError) {
      console.warn('⚠️ API连接测试失败，可能服务未启动');
      console.warn('  错误信息:', testError.message);
      console.warn('  继续执行测试，但结果可能不准确');
    }

    // 2. 按顺序运行每个测试
    for (let i = 0; i < testConfig.length; i++) {
      const config = testConfig[i];
      const { name, testFunction } = config;
      console.log(`\n\n【测试 ${i + 1}/${testConfig.length}】${name}`);
      console.log('---------------------------------------------');
      
      const testStartTime = Date.now();
      let testPassed = false;
      let testMessage = '';
      
      try {
        // 执行测试函数 - 根据配置决定是否传递axios
        const result = config.withAxios ? 
          await testFunction(axios) : 
          await testFunction();
        testPassed = result === true || result === undefined; // 处理可能的undefined返回值
        testMessage = testPassed ? '测试通过' : '测试失败';
        
      } catch (error) {
        testPassed = false;
        testMessage = `测试执行异常: ${error.message}`;
        console.error('❌ 测试执行异常:', error);
      }
      
      const testEndTime = Date.now();
      const testExecutionTime = (testEndTime - testStartTime) / 1000;
      
      // 记录测试结果
      overallResult.testResults.push({
        name: name,
        passed: testPassed,
        message: testMessage,
        executionTime: testExecutionTime,
      });
      
      if (testPassed) {
        overallResult.passedTests++;
        console.log(`\n✅ ${name} - 测试通过！(耗时: ${testExecutionTime.toFixed(2)}s)`);
      } else {
        overallResult.failedTests++;
        console.log(`\n❌ ${name} - 测试失败！(耗时: ${testExecutionTime.toFixed(2)}s)`);
      }
    }

    // 计算总执行时间
    const endTime = new Date();
    overallResult.executionTime = (endTime - startTime) / 1000;

    // 3. 生成测试总结
    console.log('\n\n=====================================================');
    console.log('                   测试结果总结                      ');
    console.log('=====================================================');
    console.log(`总测试数: ${overallResult.totalTests}`);
    console.log(`通过测试: ${overallResult.passedTests} ✅`);
    console.log(`失败测试: ${overallResult.failedTests} ❌`);
    console.log(`总执行时间: ${overallResult.executionTime.toFixed(2)}秒`);
    console.log('\n详细结果:');
    
    overallResult.testResults.forEach((test, index) => {
      const status = test.passed ? '✅ 通过' : '❌ 失败';
      console.log(`  ${index + 1}. ${test.name} - ${status} (${test.executionTime.toFixed(2)}s)`);
    });

    console.log('\n=====================================================');
    if (overallResult.failedTests === 0) {
      console.log('🎉 恭喜！所有环境管理CRUD测试全部通过！');
    } else {
      console.log('⚠️ 部分测试失败，请查看详细信息进行修复');
    }
    console.log('=====================================================');

    // 4. 保存综合测试报告
    try {
      const reportFilePath = join(__dirname, '../environment_crud_test_report.json');
      await writeFile(reportFilePath, JSON.stringify(overallResult, null, 2));
      console.log(`\n综合测试报告已保存到: ${reportFilePath}`);
    } catch (writeError) {
      console.error('保存测试报告失败:', writeError.message);
    }

    // 5. 显示使用说明
    console.log('\n\n【使用说明】');
    console.log('1. 可以单独运行每个测试文件: node tests/test_environment_xxx.js');
    console.log('2. 也可以使用此运行器一次运行所有测试: node tests/test_environment_crud.js');
    console.log('3. 测试报告保存在frontend/environment_crud_test_report.json');
    console.log('4. 单个测试的日志保存在各自的log文件中');

    return overallResult;

  } catch (error) {
    console.error('\n❌ 测试运行器执行过程中发生严重错误:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本，则执行所有测试
if (process.argv[1] && process.argv[1].endsWith('test_environment_crud.js')) {
  runAllEnvironmentTests().catch(error => {
    console.error('测试运行器执行失败:', error);
    process.exit(1);
  });
}

export default runAllEnvironmentTests;