#!/usr/bin/env node

// 运行API测试脚本的工具

// 启用导入断言
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// 设置__filename和__dirname，使CommonJS的代码能在ES模块中运行
const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

global.__filename = __filename;
global.__dirname = __dirname;

console.log('正在准备运行API测试...');

// 由于我们在Node.js环境下运行，需要设置一些浏览器环境的全局变量
if (typeof window === 'undefined') {
  global.window = {
    localStorage: {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {}
    },
    document: {
      createElement: () => ({})
    }
  };
  
  // 不修改navigator，因为它是只读的
  
  // 模拟Element Plus的ElMessage组件
  global.ElMessage = {
    error: (msg) => console.error('ElMessage Error:', msg),
    success: (msg) => console.log('ElMessage Success:', msg)
  };
}

try {
  // 使用动态导入来加载测试模块
  const testModulePath = join(__dirname, 'testEnvApi.js');
  console.log(`尝试加载测试模块: ${testModulePath}`);
  
  // 由于Node.js的ES模块导入限制，我们需要通过CommonJS的方式来加载模块
  // 这是一个临时解决方案，主要用于测试
  const { testEnvironmentApi } = require('./testEnvApi.js');
  
  console.log('已加载测试模块，开始执行API测试...');
  testEnvironmentApi().then((result) => {
    console.log('\n===== 测试结果总结 =====');
    if (result.success) {
      console.log('✅ API测试成功!');
    } else {
      console.log('❌ API测试失败!');
      console.log('错误信息:', result.error);
      
      // 给出可能的解决方案
      console.log('\n可能的解决方案:');
      console.log('1. 确保后端服务器正在运行: python manage.py runserver');
      console.log('2. 检查Vite代理配置是否正确');
      console.log('3. 确认API是否需要认证token');
      console.log('4. 检查axios实例的配置');
    }
    console.log('=======================');
  }).catch((err) => {
    console.error('测试执行失败:', err);
  });
} catch (error) {
  console.error('测试运行时发生错误:', error);
}

// 为了防止Node进程立即退出
sleep(3000);

function sleep(ms) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // 空循环等待
  }
}