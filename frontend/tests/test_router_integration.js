import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 导入路由导航测试模块
import runRouterNavigationTest from './test_router_navigation.js';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 路由导航整合测试运行器
 * 功能：
 * 1. 按顺序运行所有路由导航相关的测试
 * 2. 收集每个测试的结果
 * 3. 生成综合测试报告
 * 4. 提供清晰的测试结果统计
 */
async function runAllRouterTests() {
  console.log('\n=====================================================');
  console.log('                 路由导航综合测试                    ');
  console.log('=====================================================');
  
  // 记录开始时间
  const startTime = new Date();
  
  // 测试结果对象
  const overallResult = {
    timestamp: startTime.toISOString(),
    totalTests: 1,
    passedTests: 0,
    failedTests: 0,
    testResults: [],
    executionTime: 0,
  };

  // 测试配置
  const testConfig = [
    { name: '路由导航测试（环境管理到测试套管理）', testFunction: runRouterNavigationTest },
    // 后续可以添加其他路由相关测试
  ];

  try {
    // 1. 测试API连接性
    console.log('\n【测试前检查】验证系统是否正在运行...');
    const axiosModule = await import('axios');
    const axios = axiosModule.default;
    
    try {
      const api = axios.create({
        baseURL: 'http://localhost:5173',
        timeout: 5000
      });
      
      // 尝试访问首页，验证系统是否正常运行
      const testResponse = await api.get('/');
      console.log('✅ 系统运行正常！');
    } catch (testError) {
      console.warn('⚠️ 无法连接到系统，可能服务未启动');
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
        // 执行测试函数
        const result = await testFunction();
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
        console.log(`\n❌ ${name} - ${testMessage} (耗时: ${testExecutionTime.toFixed(2)}s)`);
      }
    }

    // 3. 计算总执行时间
    const endTime = new Date();
    overallResult.executionTime = (endTime - startTime) / 1000;

    // 4. 输出测试总结
    console.log('\n=====================================================');
    console.log('                    测试总结                         ');
    console.log('=====================================================');
    console.log(`总测试数: ${overallResult.totalTests}`);
    console.log(`通过测试数: ${overallResult.passedTests}`);
    console.log(`失败测试数: ${overallResult.failedTests}`);
    console.log(`总执行时间: ${overallResult.executionTime.toFixed(2)}s`);
    
    // 判断整体测试是否通过
    const allTestsPassed = overallResult.passedTests === overallResult.totalTests;
    if (allTestsPassed) {
      console.log('\n✅ 所有路由导航测试通过！');
    } else {
      console.log('\n❌ 部分路由导航测试失败，请检查问题！');
    }

    // 返回整体测试结果
    return allTestsPassed;

  } catch (error) {
    console.error('\n❌ 测试运行器执行异常:', error);
    return false;
  }
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runAllRouterTests().catch(error => {
    console.error('测试运行器执行失败:', error);
    process.exit(1);
  });
}

export default runAllRouterTests;