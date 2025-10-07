// 最简单的测试文件，只导入和打印mount函数

import { mount } from '@vue/test-utils';

console.log('mount函数类型:', typeof mount);
console.log('mount函数:', mount);

// 如果mount是函数，尝试创建一个简单的组件
if (typeof mount === 'function') {
  console.log('mount是一个函数，可以使用');
  try {
    const SimpleComponent = { template: '<div>Test</div>' };
    console.log('创建简单组件成功');
  } catch (error) {
    console.error('创建组件错误:', error);
  }
} else {
  console.log('mount不是一个函数，无法使用');
}