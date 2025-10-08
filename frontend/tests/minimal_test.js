import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 配置参数
const BASE_URL = 'http://localhost:8000';
const TEST_USER = {
  username: 'test',
  password: 'test@123'
};

// 日志文件路径
const LOG_FILE = path.join(process.cwd(), 'test_results', 'minimal_test_log.txt');

// 确保日志目录存在
const testResultsDir = path.join(process.cwd(), 'test_results');
if (!fs.existsSync(testResultsDir)) {
  fs.mkdirSync(testResultsDir, { recursive: true });
}

// 日志函数 - 同时输出到控制台和文件
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(message);
  fs.appendFileSync(LOG_FILE, logMessage);
}

// 提取Cookie
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

// 主测试函数
async function runMinimalTest() {
  try {
    log('=== 最小化测试脚本启动 ===');
    log(`直接连接到Django服务器: ${BASE_URL}`);
    
    // 创建axios实例
    const api = axios.create({
      baseURL: BASE_URL,
      timeout: 30000,
      withCredentials: true // 允许携带cookies
    });
    
    // 1. 登录
    log('\n1. 执行登录请求...');
    const loginResponse = await api.post('/api/user/login/', TEST_USER);
    log(`登录状态码: ${loginResponse.status}`);
    log(`登录响应: ${JSON.stringify(loginResponse.data)}`);
    
    // 提取Cookie
    const cookies = extractCookies(loginResponse.headers);
    log(`提取到的Cookie: ${JSON.stringify(cookies)}`);
    
    // 设置认证头
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ');
    
    api.defaults.headers.Cookie = cookieString;
    log(`设置Cookie: ${cookieString}`);
    
    // 检查是否有CSRF令牌
    const csrfToken = cookies['csrftoken'] || '';
    if (csrfToken) {
      api.defaults.headers['X-CSRFToken'] = csrfToken;
      log(`设置CSRF令牌: ${csrfToken}`);
    }
    
    // 检查是否有token
    if (loginResponse.data && loginResponse.data.token) {
      api.defaults.headers['Authorization'] = `Token ${loginResponse.data.token}`;
      log(`设置Token认证: ${loginResponse.data.token.substring(0, 10)}...`);
    }
    
    // 2. 创建测试模块
    log('\n2. 创建测试模块...');
    const timestamp = Date.now();
    const moduleId = `module-${timestamp}`;  // 生成符合格式要求的唯一模块ID (module-xxx)
    const moduleName = `MinimalModule_${timestamp}`;  // 生成唯一的模块名称

    const moduleData = {
      id: moduleId,  // 必须提供符合module-xxx格式的ID，因为这是自定义主键
      module_name: moduleName,
      chip_model: 'TestChip',
      description: 'Minimal test module'
    };
    
    log(`发送的数据: ${JSON.stringify(moduleData)}`);
    
    try {
      const createResponse = await api.post('/api/modules/', moduleData);
      log(`创建模块状态码: ${createResponse.status}`);
      log(`创建模块响应: ${JSON.stringify(createResponse.data)}`);
      
      log('\n=== 测试成功完成 ===');
      process.exit(0);
    } catch (createError) {
      log('创建模块失败: ' + createError.message);
      if (createError.response) {
        log(`状态码: ${createError.response.status}`);
        log(`响应数据: ${JSON.stringify(createError.response.data)}`);
        log(`响应头: ${JSON.stringify(createError.response.headers)}`);
      }
      log('\n=== 测试失败 ===');
      process.exit(1);
    }
  } catch (error) {
    log('测试过程中发生未捕获错误: ' + error.message);
    if (error.response) {
      log(`状态码: ${error.response.status}`);
      log(`响应数据: ${JSON.stringify(error.response.data)}`);
    }
    log('\n=== 测试失败 ===');
    process.exit(1);
  }
}

// 执行测试
runMinimalTest().catch(err => {
  log('全局错误捕获: ' + err.message);
  process.exit(1);
});