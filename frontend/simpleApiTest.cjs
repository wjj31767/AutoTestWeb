// 简单的API测试脚本，直接使用axios测试后端API连接
const axios = require('axios');

// 重写后的测试脚本：专注于认证问题的核心测试
console.log('===== Django API 认证问题诊断工具 =====');
console.log('此工具将直接连接后端API进行认证测试');
console.log('当前测试配置:');
console.log('- 后端API地址: http://localhost:8000');
console.log('- 测试用户: admin/admin123');
console.log('\n请确保后端Django服务器已启动并运行在8000端口!\n');

// 等待1秒后开始测试
setTimeout(async () => {
  // 创建一个新的axios实例，专门用于本次测试
  const testClient = axios.create({
    baseURL: 'http://localhost:8000',
    timeout: 10000,
    withCredentials: true,  // 允许携带cookies
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  });

  // 存储cookie信息的变量
  let cookies = '';
  let sessionId = '';
  let csrfToken = '';
  
  try {
    console.log('1. 阶段一: 初始化Session并获取CSRF Token');
    console.log('发送GET请求到首页获取基本cookie...');
    
    // 发送GET请求到首页，触发Django的session创建
    const initialResponse = await testClient.get('/');
    
    // 打印响应状态和头部信息
    console.log(`响应状态码: ${initialResponse.status}`);
    
    // 提取并打印所有cookie信息
    if (initialResponse.headers['set-cookie']) {
      cookies = initialResponse.headers['set-cookie'];
      console.log('从首页响应获取的cookies:');
      
      cookies.forEach(cookie => {
        console.log(`  - ${cookie}`);
        // 提取CSRF token
        if (cookie.startsWith('csrftoken=')) {
          const match = cookie.match(/csrftoken=([^;]+)/);
          if (match && match[1]) {
            csrfToken = match[1];
            console.log(`  成功提取CSRF Token: ${csrfToken.substring(0, 10)}...`);
          }
        }
        // 检查是否已有sessionid
        if (cookie.startsWith('sessionid=')) {
          const match = cookie.match(/sessionid=([^;]+)/);
          if (match && match[1]) {
            sessionId = match[1];
            console.log(`  发现sessionid: ${sessionId.substring(0, 10)}...`);
          }
        }
      });
    } else {
      console.warn('警告: 首页响应没有包含set-cookie头部');
    }

    console.log('\n2. 阶段二: 尝试登录获取认证Session');
    console.log('使用admin/admin123尝试登录...');
    
    // 确保CSRF token被设置
    if (csrfToken) {
      testClient.defaults.headers['X-CSRFToken'] = csrfToken;
      console.log(`已设置CSRF Token头部`);
    } else {
      console.warn('警告: 未找到CSRF Token，尝试无Token登录');
    }
    
    // 发送登录请求到正确的端点
    const loginResponse = await testClient.post('/api/user/login/', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log(`登录响应状态码: ${loginResponse.status}`);
    console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
    
    // 检查并更新登录后的cookie信息
    if (loginResponse.headers['set-cookie']) {
      console.log('登录后获取的新cookies:');
      const newCookies = loginResponse.headers['set-cookie'];
      newCookies.forEach(cookie => {
        console.log(`  - ${cookie}`);
        // 提取更新后的sessionid
        if (cookie.startsWith('sessionid=')) {
          const match = cookie.match(/sessionid=([^;]+)/);
          if (match && match[1]) {
            sessionId = match[1];
            console.log(`  登录后获取到sessionid: ${sessionId.substring(0, 10)}...`);
          }
        }
        // 更新CSRF token
        if (cookie.startsWith('csrftoken=')) {
          const match = cookie.match(/csrftoken=([^;]+)/);
          if (match && match[1]) {
            csrfToken = match[1];
            testClient.defaults.headers['X-CSRFToken'] = csrfToken;
            console.log(`  更新CSRF Token: ${csrfToken.substring(0, 10)}...`);
          }
        }
      });
    } else {
      console.warn('警告: 登录响应没有包含新的cookie');
    }
    
    // 如果没有获取到sessionid，停止测试
    if (!sessionId) {
      console.error('错误: 登录成功但没有获取到sessionid!');
      console.log('\n诊断结果:');
      console.log('Django认证系统可能没有正确配置session存储或cookie设置。');
      console.log('建议检查:');
      console.log('1. settings.py中的SESSION_ENGINE和相关session配置');
      console.log('2. 确保INSTALLED_APPS包含\'django.contrib.sessions\'');
      console.log('3. 确保MIDDLEWARE包含\'django.contrib.sessions.middleware.SessionMiddleware\'');
      return;
    }

    console.log('\n3. 阶段三: 验证认证状态 - 获取用户信息');
    console.log('尝试访问/api/user/profile/端点...');
    
    // 发送请求获取用户信息
    try {
      const profileResponse = await testClient.get('/api/user/profile/');
      console.log(`获取用户信息成功! 状态码: ${profileResponse.status}`);
      console.log('用户信息:', JSON.stringify(profileResponse.data, null, 2));
      
      // 检查用户权限
      if (profileResponse.data.is_superuser) {
        console.log('🎉 确认: 当前用户是超级管理员!');
      } else {
        console.log('注意: 当前用户不是超级管理员');
      }
    } catch (profileError) {
      console.error('获取用户信息失败!');
      if (profileError.response) {
        console.error(`状态码: ${profileError.response.status}`);
        console.error('错误信息:', JSON.stringify(profileError.response.data, null, 2));
        
        if (profileError.response.status === 401) {
          console.log('\n诊断结果:');
          console.log('虽然登录成功，但后续请求未被认证。这通常是由以下原因导致的:');
          console.log('1. Cookie路径或域设置不正确');
          console.log('2. Django CSRF保护配置问题');
          console.log('3. 认证中间件顺序问题');
          console.log('4. 前端axios配置问题（尽管我们已经设置了withCredentials: true）');
        } else if (profileError.response.status === 403) {
          console.log('\n诊断结果:');
          console.log('用户已认证但权限不足。请确认:');
          console.log('1. admin用户是否是超级管理员');
          console.log('2. 用户权限设置是否正确');
        }
      } else {
        console.error('网络错误:', profileError.message);
      }
    }

    console.log('\n4. 阶段四: 测试目标API - 访问环境列表');
    console.log('尝试访问/api/environments/端点...');
    
    // 测试目标API端点
    try {
      const apiResponse = await testClient.get('/api/environments/', {
        params: {
          page: 1,
          pageSize: 10
        }
      });
      console.log(`API请求成功! 状态码: ${apiResponse.status}`);
      console.log('API响应数据:', JSON.stringify(apiResponse.data, null, 2));
      
      console.log('\n🎉 测试成功!');
      console.log('您的API认证机制工作正常。');
    } catch (apiError) {
      console.error('API请求失败!');
      if (apiError.response) {
        console.error(`状态码: ${apiError.response.status}`);
        console.error('错误信息:', JSON.stringify(apiError.response.data, null, 2));
        
        if (apiError.response.status === 401) {
          console.log('\n最终诊断结果:');
          console.log('这是一个典型的Django认证问题，尽管登录成功获取了sessionid，但后续API请求未被正确认证。');
          console.log('最可能的解决方案:');
          console.log('1. 检查Django settings.py中的CSRF_COOKIE_NAME和SESSION_COOKIE_NAME设置');
          console.log('2. 确保CSRF_COOKIE_SECURE和SESSION_COOKIE_SECURE设置正确（开发环境应为False）');
          console.log('3. 验证CSRF_COOKIE_PATH和SESSION_COOKIE_PATH是否设置为\'/\'');
          console.log('4. 检查您的API视图是否正确使用了认证装饰器（如@login_required, @api_view等）');
          console.log('5. 确认Django REST framework的认证类配置正确');
          console.log('6. 尝试重启Django开发服务器和清除浏览器缓存');
        } else if (apiError.response.status === 403) {
          console.log('\n最终诊断结果:');
          console.log('权限问题 - 用户已认证但无足够权限访问此API。');
          console.log('建议:');
          console.log('1. 确认admin用户是超级管理员');
          console.log('2. 检查API视图的权限设置');
        } else if (apiError.response.status === 404) {
          console.log('\n最终诊断结果:');
          console.log('API端点不存在，请确认路径是否正确。');
          console.log('建议:');
          console.log('1. 检查Django URL配置');
          console.log('2. 确认API端点路径是否正确');
        }
      } else {
        console.error('网络错误:', apiError.message);
        console.log('\n建议检查:');
        console.log('1. 后端服务器是否正常运行在8000端口');
        console.log('2. 防火墙设置是否阻止了连接');
      }
    }

    console.log('\n===== 测试完成 =====');
    
  } catch (error) {
    console.error('测试过程中发生未捕获的错误:', error);
  }
}, 1000);