// 简单的调试文件，用于验证@vue/test-utils的导入

// 尝试不同的导入方式

// 方式1：使用ES模块导入
import('@vue/test-utils').then((testUtils) => {
  console.log('ES模块导入@vue/test-utils:');
  console.log('typeof testUtils:', typeof testUtils);
  console.log('testUtils内容:', testUtils);
  console.log('testUtils.mount:', typeof testUtils.mount);
  
  // 方式2：检查default导出
  console.log('\ndefault导出:');
  console.log('typeof testUtils.default:', typeof testUtils.default);
  if (testUtils.default) {
    console.log('default.mount:', typeof testUtils.default.mount);
  }
}).catch((error) => {
  console.error('ES模块导入错误:', error);
});

// 方式3：使用CommonJS导入（如果支持）
try {
  const testUtils = require('@vue/test-utils');
  console.log('\nCommonJS导入@vue/test-utils:');
  console.log('typeof testUtils:', typeof testUtils);
  console.log('testUtils内容:', testUtils);
  console.log('testUtils.mount:', typeof testUtils.mount);
} catch (error) {
  console.error('\nCommonJS导入错误:', error);
}