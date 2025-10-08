import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 配置参数 - 直接连接Django服务器的8000端口
const BASE_URL = 'http://localhost:8000';
const TIMEOUT = 30000;
const TEST_USER = {
  username: 'test',
  password: 'test@123'
};

// 提取Cookie和CSRF令牌
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

function createCookieString(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

function getCSRFToken(cookies) {
  return cookies['csrftoken'] || '';
}

// 生成测试模块数据
function generateTestModuleData() {
  const timestamp = Date.now();
  return {
    module_name: `DirectModule_${timestamp}`,
    chip_model: 'TestChip',
    description: 'Direct test module - bypassing Vite proxy',
    visible_scope: 'all'
  };
}

// 直接连接Django服务器的测试函数
async function runDirectTest() {
  try {
    console.log('=== 直接连接Django服务器测试 ===');
    console.log('测试时间:', new Date().toLocaleString());
    console.log('直接连接到Django服务器端口:', BASE_URL);
    
    // 创建axios实例，直接连接Django服务器
    const api = axios.create({
      baseURL: BASE_URL,
      timeout: TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 关键配置，确保cookie能被正确携带
      validateStatus: (status) => {
        return status >= 200 && status < 500; // 仅拒绝服务器错误（5xx）
      }
    });
    
    // 1. 先发送GET请求到首页获取CSRF令牌（Django要求）
    console.log('\n1. 初始化会话并获取CSRF令牌...');
    const initialResponse = await api.get('/');
    console.log('首页请求状态码:', initialResponse.status);
    
    // 提取初始Cookie
    let cookies = extractCookies(initialResponse.headers);
    console.log('初始Cookie:', Object.keys(cookies).join(', '));
    
    // 2. 登录测试
    console.log('\n2. 登录系统...');
    const loginResponse = await api.post('/api/user/login/', TEST_USER);
    
    console.log('登录请求状态码:', loginResponse.status);
    console.log('登录响应数据:', loginResponse.data);
    
    if (loginResponse.status === 200) {
      console.log('✓ 登录成功！用户信息:', loginResponse.data.username);
      
      // 更新Cookie
      cookies = extractCookies(loginResponse.headers);
      console.log('登录后Cookie:', Object.keys(cookies).join(', '));
      
      // 提取CSRF令牌
      const csrfToken = getCSRFToken(cookies);
      console.log('CSRF令牌:', csrfToken);
      
      // 设置认证信息
      api.defaults.headers.Cookie = createCookieString(cookies);
      api.defaults.headers['X-CSRFToken'] = csrfToken;
      
      // 如果有token也使用token认证
      if (loginResponse.data && loginResponse.data.token) {
        api.defaults.headers['Authorization'] = `Token ${loginResponse.data.token}`;
        console.log('✓ 同时使用Token认证');
      }
      
      console.log('\n3. 创建测试模块...');
      const moduleData = generateTestModuleData();
      console.log('发送的数据:', JSON.stringify(moduleData, null, 2));
      
      try {
        const createModuleResponse = await api.post('/api/modules/', moduleData);
        console.log('创建模块请求状态码:', createModuleResponse.status);
        
        if (createModuleResponse.status === 201) {
          console.log('✓ 创建模块成功！');
          console.log('响应数据:', JSON.stringify(createModuleResponse.data, null, 2));
          
          // 保存测试结果
          const result = {
            success: true,
            timestamp: new Date().toISOString(),
            login: 'success',
            moduleCreation: 'success',
            moduleData: createModuleResponse.data
          };
          saveTestResult(result);
          
          // 清理：删除创建的模块
          if (createModuleResponse.data && createModuleResponse.data.id) {
            await api.delete(`/api/modules/${createModuleResponse.data.id}/`);
            console.log('✓ 测试模块已清理');
          }
          
          return true;
        } else {
          console.error('✗ 创建模块失败，状态码:', createModuleResponse.status);
          console.error('  响应数据:', createModuleResponse.data);
          
          // 保存测试结果
          const result = {
            success: false,
            timestamp: new Date().toISOString(),
            login: 'success',
            moduleCreation: 'failed',
            errorStatus: createModuleResponse.status,
            errorData: createModuleResponse.data
          };
          saveTestResult(result);
          
          return false;
        }
      } catch (createError) {
        console.error('✗ 创建模块请求异常:', createError.message);
        if (createError.response) {
          console.error('  状态码:', createError.response.status);
          console.error('  响应数据:', createError.response.data);
          console.error('  响应头:', createError.response.headers);
        }
        
        // 保存测试结果
        const result = {
          success: false,
          timestamp: new Date().toISOString(),
          login: 'success',
          moduleCreation: 'exception',
          error: createError.message,
          errorDetails: createError.response ? {
            status: createError.response.status,
            data: createError.response.data
          } : null
        };
        saveTestResult(result);
        
        return false;
      }
    } else {
      console.error('✗ 登录失败，状态码:', loginResponse.status);
      console.error('  响应数据:', loginResponse.data);
      
      // 保存测试结果
      const result = {
        success: false,
        timestamp: new Date().toISOString(),
        login: 'failed',
        errorStatus: loginResponse.status,
        errorData: loginResponse.data
      };
      saveTestResult(result);
      
      return false;
    }
  } catch (error) {
    console.error('✗ 测试执行过程中发生错误:', error.message);
    if (error.response) {
      console.error('  状态码:', error.response.status);
      console.error('  响应数据:', error.response.data);
    }
    
    // 保存测试结果
    const result = {
      success: false,
      timestamp: new Date().toISOString(),
      error: error.message,
      errorDetails: error.response ? {
        status: error.response.status,
        data: error.response.data
      } : null
    };
    saveTestResult(result);
    
    return false;
  }
}

// 保存测试结果到文件
async function saveTestResult(result) {
  try {
    const testResultsDir = path.join(process.cwd(), 'test_results');
    if (!fs.existsSync(testResultsDir)) {
      fs.mkdirSync(testResultsDir, { recursive: true });
    }
    
    const logFilePath = path.join(testResultsDir, 'direct_test_result.json');
    await fs.promises.writeFile(
      logFilePath,
      JSON.stringify(result, null, 2),
      'utf8'
    );
    console.log(`测试结果已保存至: ${logFilePath}`);
  } catch (error) {
    console.error('保存测试结果失败:', error.message);
  }
}

// 执行测试
runDirectTest().then(result => {
  console.log('\n测试结果:', result ? '通过' : '失败');
  process.exit(result ? 0 : 1);
});