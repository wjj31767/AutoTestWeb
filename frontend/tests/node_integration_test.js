import http from 'http';
import process from 'process';

// 日志函数
function log(message) {
  console.log(message);
}

// 发送HTTP请求的函数
function sendRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    // 确保Content-Length被正确设置
    if (postData && !options.headers) {
      options.headers = {};
    }
    
    if (postData && options.headers && !options.headers['Content-Length']) {
      const postDataStr = JSON.stringify(postData);
      options.headers['Content-Length'] = Buffer.byteLength(postDataStr);
    }
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          // 尝试解析JSON响应
          const parsedData = JSON.parse(data);
          resolve({ statusCode: res.statusCode, headers: res.headers, data: parsedData });
        } catch (error) {
          resolve({ statusCode: res.statusCode, headers: res.headers, data });
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      const postDataStr = JSON.stringify(postData);
      req.write(postDataStr);
      console.log('发送的请求体:', postDataStr);
    }
    
    req.end();
  });
}

// 提取Cookie的函数
function extractCookies(headers) {
  const cookies = {};
  const cookieHeader = headers['set-cookie'] || [];
  
  cookieHeader.forEach(cookie => {
    const parts = cookie.split(';')[0].split('=');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const value = parts.slice(1).join('=').trim();
      cookies[key] = value;
    }
  });
  
  return cookies;
}

// 构建Cookie字符串的函数
function buildCookieString(cookies) {
  return Object.entries(cookies)
    .map(([key, value]) => `${key}=${value}`)
    .join('; ');
}

// 测试函数
async function runNodeTest() {
  log('\n=== Node.js 环境下的完整测试 ===');
  
  // 全局变量（在函数内）
  let cookies = {};
  let authToken = '';
  let csrfToken = '';
  
  try {
    // 1. 登录（Django会在POST请求中设置CSRF令牌）
    log('\n1. 执行登录请求...');
    const loginResponse = await sendRequest({
      hostname: 'localhost',
      port: 8000,
      path: '/api/user/login/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, {
      username: 'test',
      password: 'test@123'
    });
    
    // 打印请求的详细信息（用于调试）
    log(`发送的登录数据: {"username":"test","password":"test@123"}`);
    
    if (loginResponse.statusCode !== 200) {
      log(`登录失败，状态码: ${loginResponse.statusCode}`);
      log(`错误详情: ${JSON.stringify(loginResponse.data)}`);
      process.exit(1);
    }
    
    log('登录成功！用户信息: ' + JSON.stringify(loginResponse.data));
    
    // 更新Cookie和Token
    const newCookies = extractCookies(loginResponse.headers);
    cookies = { ...cookies, ...newCookies };
    authToken = loginResponse.data.token || '';
    
    // 提取CSRF token
      if (loginResponse.headers && loginResponse.headers['set-cookie']) {
        const csrfCookie = loginResponse.headers['set-cookie'].find(cookie => cookie.startsWith('csrftoken='));
        if (csrfCookie) {
          const tokenMatch = csrfCookie.match(/csrftoken=([^;]+)/);
          if (tokenMatch && tokenMatch[1]) {
            csrfToken = tokenMatch[1];
            log(`提取到CSRF Token: ${csrfToken.substring(0, 10)}...`);
          }
        }
      }
    
    log(`提取到认证Token: ${authToken ? '是' : '否'}`);
    log(`更新后的Cookie: ${buildCookieString(cookies)}`);
    
    // 3. 创建测试模块
    log('\n3. 创建测试模块...');
    const timestamp = Date.now();
    const moduleId = `module-node-${timestamp}`;
    const moduleName = `NodeTestModule_${timestamp}`;
    
    const moduleData = {
      id: moduleId,
      module_name: moduleName,
      chip_model: 'TestChip',
      description: 'Test module created via Node.js test'
    };
    
    log('发送的数据: ' + JSON.stringify(moduleData));
    
    const createResponse = await sendRequest({
      hostname: 'localhost',
      port: 8000,
      path: '/api/modules/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': buildCookieString(cookies),
        'Authorization': `Bearer ${authToken}`,
        'X-CSRFToken': csrfToken
      }
    }, moduleData);
    
    if (createResponse.statusCode !== 201) {
      log(`创建模块失败，状态码: ${createResponse.statusCode}`);
      log(`响应内容: ${JSON.stringify(createResponse.data)}`);
      process.exit(1);
    }
    
    log('创建模块成功！模块信息: ' + JSON.stringify(createResponse.data));
    
    // 4. 验证模块是否存在于列表中
    log('\n4. 验证模块是否存在于列表中...');
    const listResponse = await sendRequest({
      hostname: 'localhost',
      port: 8000,
      path: '/api/modules/',
      method: 'GET',
      headers: {
        'Cookie': buildCookieString(cookies),
        'Authorization': `Bearer ${authToken}`,
        'X-CSRFToken': csrfToken
      }
    });
    
    if (listResponse.statusCode !== 200) {
      log(`获取模块列表失败，状态码: ${listResponse.statusCode}`);
      log(`响应内容: ${JSON.stringify(listResponse.data)}`);
      process.exit(1);
    }
    
    // 打印模块列表的结构
    log(`模块列表获取成功，响应数据类型: ${typeof listResponse.data}`);
    log(`响应数据结构: ${JSON.stringify(listResponse.data)}`);
    
    // 检查数据结构并查找刚创建的模块
    let createdModule = null;
    if (Array.isArray(listResponse.data)) {
      createdModule = listResponse.data.find(module => module.id === moduleId);
    } else if (listResponse.data.results && Array.isArray(listResponse.data.results)) {
      createdModule = listResponse.data.results.find(module => module.id === moduleId);
    } else {
      log('警告：模块列表数据结构不符合预期');
    }
    
    if (createdModule) {
      log('验证成功！创建的模块存在于列表中: ' + createdModule.module_name);
    } else {
      log('验证失败！创建的模块不在列表中');
      process.exit(1);
    }
    
    log('\n=== Node.js 测试成功完成 ===');
    process.exit(0);
    
  } catch (error) {
    log('测试过程中发生错误:');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
runNodeTest();