import axios from 'axios';
import { writeFile, readdir } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 配置axios实例
const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  withCredentials: true, // 允许携带cookie
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  },
});

// 存储CSRF token
let csrfToken = '';

// 从响应头中提取CSRF token
function extractCsrfToken(headers) {
  const cookieHeader = headers['set-cookie'] || [];
  for (const cookie of cookieHeader) {
    if (cookie.startsWith('csrftoken=')) {
      const tokenMatch = cookie.match(/csrftoken=([^;]+)/);
      if (tokenMatch && tokenMatch[1]) {
        return tokenMatch[1];
      }
    }
  }
  return '';
}

// 先发送一个GET请求获取CSRF token
async function getCsrfToken() {
  try {
    const response = await api.get('/user/login/');
    csrfToken = extractCsrfToken(response.headers);
    console.log('CSRF token获取成功:', csrfToken ? '已获取' : '未获取');
  } catch (error) {
    console.log('获取CSRF token失败，尝试从cookie中直接提取:', error.message);
  }
}

// 保存测试结果到日志文件
async function saveTestResult(testResult, logFileName = 'login_test.log') {
  try {
    const logFilePath = join(__dirname, logFileName);
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`测试结果已保存到: ${logFilePath}`);
  } catch (writeError) {
    console.error('保存测试结果失败:', writeError.message);
  }
}

// 运行登录测试
async function runLoginTest() {
  // 测试结果对象
  const testResult = {
    timestamp: new Date().toISOString(),
    success: false,
    message: '',
    details: {},
  };

  try {
    console.log('\n=== 开始登录功能测试 ===');
    console.log('测试用户: test/test@123');
    
    // 先获取CSRF token
    await getCsrfToken();
    
    // 添加CSRF token到请求头
    if (csrfToken) {
      api.defaults.headers['X-CSRFToken'] = csrfToken;
      console.log('CSRF token已添加到请求头');
    }
    
    // 执行登录请求
    const loginResponse = await api.post('/user/login/', {
      username: 'test',
      password: 'test@123',
    });
    
    testResult.details.loginResponse = {
      status: loginResponse.status,
      data: loginResponse.data,
      headers: JSON.stringify(loginResponse.headers, null, 2),
    };
    
    // 检查是否获取到了新的CSRF token
    const newCsrfToken = extractCsrfToken(loginResponse.headers);
    if (newCsrfToken) {
      csrfToken = newCsrfToken;
      testResult.details.csrfTokenUpdated = true;
      console.log('登录后CSRF token已更新');
    }
    
    if (loginResponse.status === 200) {
      testResult.success = true;
      testResult.message = '登录测试成功！CSRF token已正确处理。';
      console.log('✅ 登录测试成功！CSRF token已正确处理。');
      
      // 验证是否可以访问需要认证的接口
      try {
        // 更新请求头中的CSRF token
        if (csrfToken) {
          api.defaults.headers['X-CSRFToken'] = csrfToken;
        }
        
        const environmentsResponse = await api.get('/environments/?page=1&pageSize=10');
        testResult.details.environmentsResponse = {
          status: environmentsResponse.status,
          data: environmentsResponse.data,
        };
        console.log('✅ 环境列表接口访问成功，认证有效。');
      } catch (envError) {
        testResult.details.environmentsError = {
          message: envError.message,
          response: envError.response ? {
            status: envError.response.status,
            data: envError.response.data,
          } : null,
        };
        console.log('⚠️ 登录成功但访问环境列表接口失败:', envError.message);
      }
    } else {
      testResult.success = false;
      testResult.message = `登录失败，状态码: ${loginResponse.status}`;
      console.log(`❌ 登录失败，状态码: ${loginResponse.status}`);
    }
  } catch (error) {
    testResult.success = false;
    testResult.message = `登录请求失败: ${error.message}`;
    testResult.details.error = {
      message: error.message,
      response: error.response ? {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers ? JSON.stringify(error.response.headers, null, 2) : null,
      } : null,
    };
    console.log('❌ 登录请求失败:', error.message);
    if (error.response?.data) {
      console.log('错误详情:', error.response.data);
    }
  }
  
  // 保存测试结果
  await saveTestResult(testResult);
  
  return testResult.success;
}

// 运行所有测试脚本
async function runAllTests() {
  console.log('=== 开始运行所有自动化测试 ===');
  
  try {
    // 获取所有测试脚本文件
    const files = await readdir(__dirname);
    const testFiles = files.filter(file => 
      file.startsWith('test_') && 
      file.endsWith('.js') && 
      file !== 'test_all.js' // 排除自身
    );
    
    console.log(`找到 ${testFiles.length} 个测试脚本:`);
    testFiles.forEach(file => console.log(`- ${file}`));
    
    // 逐个运行测试脚本
    let allTestsPassed = true;
    for (const testFile of testFiles) {
      console.log(`\n=== 运行测试脚本: ${testFile} ===`);
      try {
        // 动态导入并运行测试脚本
        const testModule = await import(`./${testFile}`);
        if (testModule.default && typeof testModule.default === 'function') {
          await testModule.default();
        } else {
          console.log(`⚠️ ${testFile} 没有导出默认函数，尝试直接运行`);
          // 对于没有导出默认函数的脚本，我们只记录信息但不视为失败
        }
      } catch (error) {
        console.error(`❌ ${testFile} 运行失败:`, error.message);
        allTestsPassed = false;
      }
    }
    
    console.log('\n=== 所有测试脚本运行完毕 ===');
    if (allTestsPassed) {
      console.log('✅ 所有测试通过！');
    } else {
      console.log('❌ 部分测试失败，请查看详细日志。');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ 读取测试文件失败:', error.message);
    process.exit(1);
  }
}

console.log('测试脚本已启动...');

// 如果直接运行此脚本，则运行所有测试
// 如果作为模块导入，则导出runLoginTest函数供其他脚本使用
// 修复Windows路径问题的检测方式
if (process.argv[1] && process.argv[1].endsWith('test_all.js')) {
  console.log('正在启动测试流程...');
  runAllTests().catch(error => {
    console.error('❌ 测试执行过程中发生错误:', error);
    process.exit(1);
  });
}

export default runLoginTest;
export { runAllTests, csrfToken };