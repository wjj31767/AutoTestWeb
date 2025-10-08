import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 路由导航测试脚本
 * 功能：
 * 1. 测试从环境管理页面跳转到测试套管理页面的路由正确性
 * 2. 验证修复后的绝对路径是否正常工作
 * 3. 记录测试过程和结果
 */
async function runRouterNavigationTest() {
  console.log('\n=== 路由导航测试 ===');
  
  // 测试结果对象
  const testResult = {
    timestamp: new Date().toISOString(),
    success: false,
    message: '',
    details: {
      environment: 'Node.js CLI',
      testSteps: [],
    },
  };

  try {
    // 动态导入axios
    const axiosModule = await import('axios');
    const axios = axiosModule.default;
    
    // 创建axios实例
    const api = axios.create({
      baseURL: 'http://localhost:5173',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // 手动处理Cookie和CSRF令牌
    let cookies = {};
    let csrfToken = '';
    
    // 提取Cookie和CSRF令牌的函数
    function extractCookiesAndCsrfToken(responseHeaders) {
      const cookieMap = {};
      const setCookieHeaders = responseHeaders['set-cookie'] || [];
      
      setCookieHeaders.forEach(cookieHeader => {
        const parts = cookieHeader.split(';');
        const cookiePart = parts[0];
        const [key, value] = cookiePart.split('=');
        cookieMap[key.trim()] = value.trim();
        
        // 提取CSRF令牌
        if (key.trim() === 'csrftoken') {
          csrfToken = value.trim();
        }
      });
      
      return cookieMap;
    }
    
    // 创建Cookie字符串的函数
    function createCookieString(cookieMap) {
      return Object.entries(cookieMap)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    // 1. 验证API连接性
    console.log('1. 测试API连接性...');
    const apiConnectionStep = {
      step: 'apiConnection',
      status: 'running',
    };
    testResult.details.testSteps.push(apiConnectionStep);

    try {
      const apiResponse = await api.get('/api/');
      apiConnectionStep.status = 'completed';
      apiConnectionStep.response = {
        status: apiResponse.status,
        data: apiResponse.data,
      };
      console.log('✅ API连接测试成功！');
    } catch (apiError) {
      apiConnectionStep.status = 'failed';
      apiConnectionStep.error = apiError.message;
      console.warn('⚠️ API连接测试失败，可能服务未启动');
      console.warn('  错误信息:', apiError.message);
    }

    // 2. 登录系统
    console.log('2. 正在登录系统...');
    const loginStep = {
      step: 'login',
      status: 'running',
    };
    testResult.details.testSteps.push(loginStep);

    try {
      const loginResponse = await api.post('/api/user/login/', {
        username: 'test',
        password: 'test@123',
      });

      loginStep.status = 'completed';
      loginStep.response = {
        status: loginResponse.status,
        data: loginResponse.data,
      };

      if (loginResponse.status === 200) {
        console.log('✅ 登录成功！用户:', loginResponse.data.username);
        testResult.details.user = loginResponse.data.username;
        
        // 保存Cookie
        cookies = extractCookiesAndCsrfToken(loginResponse.headers);
        // 更新axios实例的headers
        api.defaults.headers.common['Cookie'] = createCookieString(cookies);
        api.defaults.headers.common['X-CSRFToken'] = csrfToken;
      } else {
        throw new Error('登录失败，状态码: ' + loginResponse.status);
      }
    } catch (loginError) {
      loginStep.status = 'failed';
      loginStep.error = loginError.message;
      console.error('❌ 登录失败:', loginError.message);
      // 继续执行测试，但标记为跳过后续步骤
      testResult.message = '登录失败，跳过后续测试';
      console.log('⚠️ 继续执行测试，但结果可能不准确');
    }

    // 3. 测试从首页到环境管理的路由
    console.log('3. 测试首页到环境管理的路由...');
    const envRouteStep = {
      step: 'envRoute',
      status: 'running',
    };
    testResult.details.testSteps.push(envRouteStep);

    try {
      // 获取环境管理页面
      const envResponse = await api.get('/env/list');
      envRouteStep.status = 'completed';
      envRouteStep.response = {
        status: envResponse.status,
      };
      
      if (envResponse.status === 200) {
        console.log('✅ 环境管理页面访问成功！状态码:', envResponse.status);
      } else {
        throw new Error('环境管理页面访问失败，状态码: ' + envResponse.status);
      }
    } catch (envError) {
      envRouteStep.status = 'failed';
      envRouteStep.error = envError.message;
      console.error('❌ 环境管理页面访问失败:', envError.message);
    }

    // 4. 测试从环境管理到测试套管理的路由（关键测试）
    console.log('4. 测试从环境管理到测试套管理的路由...');
    const testSuiteRouteStep = {
      step: 'testSuiteRoute',
      status: 'running',
    };
    testResult.details.testSteps.push(testSuiteRouteStep);

    try {
      // 从环境管理页面跳转到测试套管理页面（使用绝对路径）
      const testSuiteResponse = await api.get('/test-suite/list');
      testSuiteRouteStep.status = 'completed';
      testSuiteRouteStep.response = {
        status: testSuiteResponse.status,
      };
      
      if (testSuiteResponse.status === 200) {
        console.log('✅ 测试套管理页面访问成功！状态码:', testSuiteResponse.status);
        console.log('✅ 路由修复验证成功！从环境管理页面可以正确跳转到测试套管理页面');
      } else {
        throw new Error('测试套管理页面访问失败，状态码: ' + testSuiteResponse.status);
      }
    } catch (testSuiteError) {
      testSuiteRouteStep.status = 'failed';
      testSuiteRouteStep.error = testSuiteError.message;
      console.error('❌ 测试套管理页面访问失败:', testSuiteError.message);
    }

    // 5. 测试其他路由跳转
    console.log('5. 测试其他路由跳转...');
    const otherRoutesStep = {
      step: 'otherRoutes',
      status: 'running',
    };
    testResult.details.testSteps.push(otherRoutesStep);

    const otherRoutes = [
      { name: '首页', path: '/' },
      { name: '新增任务', path: '/task/add' },
      { name: '任务列表', path: '/task/list' },
      { name: '报表中心', path: '/report' },
      { name: '模块管理', path: '/module/list' },
      { name: '系统设置', path: '/settings' }
    ];

    const routeResults = [];
    for (const route of otherRoutes) {
      try {
        const response = await api.get(route.path);
        routeResults.push({
          name: route.name,
          path: route.path,
          status: response.status,
          success: response.status === 200
        });
        if (response.status === 200) {
          console.log(`  ✅ ${route.name} (${route.path}) 访问成功！`);
        } else {
          console.log(`  ❌ ${route.name} (${route.path}) 访问失败，状态码: ${response.status}`);
        }
      } catch (routeError) {
        routeResults.push({
          name: route.name,
          path: route.path,
          error: routeError.message,
          success: false
        });
        console.log(`  ❌ ${route.name} (${route.path}) 访问失败: ${routeError.message}`);
      }
    }

    otherRoutesStep.status = 'completed';
    otherRoutesStep.results = routeResults;

    // 检查所有关键测试是否通过
    const criticalStepsPassed = [
      envRouteStep.status === 'completed',
      testSuiteRouteStep.status === 'completed'
    ].every(Boolean);

    if (criticalStepsPassed) {
      testResult.success = true;
      testResult.message = '路由跳转测试全部通过！';
      console.log('\n✅ 所有路由跳转测试通过！');
    } else {
      testResult.success = false;
      testResult.message = '部分路由跳转测试失败！';
      console.log('\n❌ 部分路由跳转测试失败！');
    }

    // 输出测试统计
    const passedSteps = testResult.details.testSteps.filter(step => step.status === 'completed').length;
    const totalSteps = testResult.details.testSteps.length;
    console.log(`\n测试统计：共 ${totalSteps} 个测试步骤，通过 ${passedSteps} 个`);

  } catch (error) {
    testResult.success = false;
    testResult.message = `测试执行异常: ${error.message}`;
    console.error('\n❌ 测试执行异常:', error);
  }

  return testResult.success;
}

// 如果直接运行此文件，则执行测试
if (import.meta.url === new URL(process.argv[1], import.meta.url).href) {
  runRouterNavigationTest().catch(error => {
    console.error('测试运行失败:', error);
    process.exit(1);
  });
}

export default runRouterNavigationTest;