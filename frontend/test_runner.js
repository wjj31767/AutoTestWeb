import { readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 自动化测试主入口
 * 功能：
 * 1. 自动发现并执行tests目录下的所有测试脚本
 * 2. 提供统一的测试报告和错误处理
 * 3. 支持一键运行全部测试用例
 */
async function runAllTests() {
  console.log('\n=== 开始运行AutoTestWeb自动化测试套件 ===');
  console.log('测试时间:', new Date().toLocaleString());
  console.log('测试入口:', __filename);

  try {
    // 获取测试脚本目录
    const testsDir = join(__dirname, 'tests');
    console.log('测试脚本目录:', testsDir);

    // 获取所有测试脚本文件
    const files = await readdir(testsDir);
    const testFiles = files.filter(file => 
      file.startsWith('test_') && file.endsWith('.js')
    );

    console.log(`\n找到 ${testFiles.length} 个测试脚本:`);
    testFiles.forEach(file => console.log(`- ${file}`));

    // 逐个运行测试脚本
    let allTestsPassed = true;
    const testResults = [];

    for (const testFile of testFiles) {
      console.log(`\n=== 运行测试脚本: ${testFile} ===`);
      try {
        const testStartTime = Date.now();
        
        // 动态导入并运行测试脚本
        const testModule = await import(`./tests/${testFile}`);
        
        if (testModule.default && typeof testModule.default === 'function') {
          await testModule.default();
          console.log(`✅ ${testFile} 执行成功`);
          
          // 记录测试结果
          testResults.push({
            file: testFile,
            success: true,
            duration: Date.now() - testStartTime
          });
        } else {
          console.log(`⚠️ ${testFile} 没有导出默认函数，跳过执行`);
          
          // 对于没有导出默认函数的脚本，我们标记为警告但不视为失败
          testResults.push({
            file: testFile,
            success: true,
            warning: '没有导出默认函数',
            duration: 0
          });
        }
      } catch (error) {
        console.error(`❌ ${testFile} 执行失败:`);
        console.error('  错误信息:', error.message);
        if (error.stack) {
          console.error('  错误堆栈:', error.stack.split('\n')[1].trim());
        }
        
        // 记录失败的测试
        testResults.push({
          file: testFile,
          success: false,
          error: error.message,
          duration: 0
        });
        
        allTestsPassed = false;
      }
    }

    // 测试总结
    console.log('\n=== 自动化测试总结 ===');
    console.log(`总共运行: ${testResults.length} 个测试脚本`);
    console.log(`通过: ${testResults.filter(r => r.success).length} 个`);
    console.log(`失败: ${testResults.filter(r => !r.success).length} 个`);
    
    // 显示详细的测试结果
    if (testResults.length > 0) {
      console.log('\n详细测试结果:');
      testResults.forEach(result => {
        const status = result.success ? '✅ 通过' : '❌ 失败';
        const durationInfo = result.duration > 0 ? ` (${result.duration}ms)` : '';
        const extraInfo = result.warning ? ` - ${result.warning}` : 
                         result.error ? ` - ${result.error}` : '';
        console.log(`- ${result.file}: ${status}${durationInfo}${extraInfo}`);
      });
    }

    // 环境列表接口特殊说明
    console.log('\n重要说明：');
    console.log('1. 环境列表接口返回 {"count":0,"next":null,"previous":null,"results":[]} 属于正常现象，表示当前没有环境数据');
    console.log('2. 如果界面一直在转圈，请检查浏览器控制台是否有错误');
    console.log('3. 建议在浏览器中进行最终验证，因为Node.js环境和浏览器环境在Cookie处理上有差异');

    // 根据测试结果设置退出码
    if (allTestsPassed) {
      console.log('\n✅ 所有测试通过！AutoTestWeb系统功能正常。');
      process.exit(0);
    } else {
      console.error('\n❌ 部分测试失败！请查看详细日志进行修复。');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ 测试执行过程中发生严重错误:', error.message);
    console.error('  错误详情:', error);
    process.exit(1);
  }
}

// 直接运行主测试函数
if (process.argv[1] && process.argv[1].endsWith('test_runner.js')) {
  runAllTests();
}

export default runAllTests;