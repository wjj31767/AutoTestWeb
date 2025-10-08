// 简单的ES模块测试脚本
console.log('ES模块测试脚本开始执行');

// 导入一个简单的模块
import fs from 'fs';
import path from 'path';

console.log('成功导入Node.js内置模块');
console.log(`当前工作目录: ${process.cwd()}`);
console.log(`Node.js版本: ${process.version}`);

// 尝试写入一个简单的文件
const testDir = path.join(process.cwd(), 'test_verify');
const testFile = path.join(testDir, 'verify.txt');

try {
  // 确保目录存在
  if (!fs.existsSync(testDir)) {
    fs.mkdirSync(testDir, { recursive: true });
    console.log(`创建目录成功: ${testDir}`);
  }
  
  // 写入测试文件
  fs.writeFileSync(testFile, `测试成功! 时间: ${new Date().toISOString()}`);
  console.log(`写入测试文件成功: ${testFile}`);
  
  // 读取文件内容并验证
  const content = fs.readFileSync(testFile, 'utf8');
  console.log(`读取文件内容: ${content}`);
  
  console.log('ES模块测试脚本执行成功!');
} catch (error) {
  console.error('测试过程中发生错误:', error.message);
}

// 退出并返回成功状态
process.exit(0);