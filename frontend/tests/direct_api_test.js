import axios from 'axios';

// 基本配置
const BASE_URL = 'http://127.0.0.1:8000/api';
const TEST_USER = {
  username: 'test',
  password: 'test'
};

// 发送请求的函数
async function sendRequest(options) {
  try {
    const response = await axios({
      url: options.url,
      method: options.method || 'GET',
      headers: options.headers || {},
      data: options.body || null,
      withCredentials: true // 重要：允许携带cookie
    });
    
    return {
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    console.error('请求错误:', error);
    if (error.response) {
      return {
        status: error.response.status,
        data: error.response.data,
        headers: error.response.headers
      };
    }
    throw error;
  }
}

// 提取Cookie和CSRF令牌
function extractCookiesAndCsrfToken(headers) {
  const cookies = {};
  let csrfToken = null;
  
  const setCookie = headers['set-cookie'];
  if (setCookie) {
    const cookieArray = Array.isArray(setCookie) ? setCookie : [setCookie];
    cookieArray.forEach(cookie => {
      const parts = cookie.split(';')[0].split('=');
      const name = parts[0];
      const value = parts.slice(1).join('=');
      cookies[name] = value;
    });
    
    csrfToken = cookies['csrftoken'] || null;
  }
  
  return { cookies, csrfToken };
}

// 直接测试API
async function directApiTest() {
  try {
    console.log('=== 直接API测试 - 测试用例创建 ===');
    
    // 1. 登录获取Cookie和Token
    console.log('\n1. 登录系统...');
    const loginResponse = await sendRequest({
      url: `${BASE_URL}/user/login/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify(TEST_USER)
    });
    
    if (loginResponse.status !== 200) {
      console.error('登录失败:', loginResponse.status, loginResponse.data);
      return;
    }
    
    console.log('登录成功:', loginResponse.data.message);
    
    // 提取Cookie和CSRF令牌
    const { cookies, csrfToken } = extractCookiesAndCsrfToken(loginResponse.headers);
    const cookieString = Object.entries(cookies).map(([key, value]) => `${key}=${value}`).join('; ');
    
    console.log('Cookie提取成功:', Object.keys(cookies).join(', '));
    console.log('CSRF令牌提取成功:', csrfToken ? csrfToken.substring(0, 8) + '...' : '无');
    
    // 2. 创建一个特性用于测试（如果需要）
    console.log('\n2. 创建测试特性...');
    const featureResponse = await sendRequest({
      url: `${BASE_URL}/features/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': csrfToken,
        'Cookie': cookieString
      },
      body: JSON.stringify({
        feature_name: 'DirectApiTestFeature',
        description: 'This is a test feature for direct API testing',
        module_id: 'module-feature-basic-1759929696954-1-951379-si9om6p7' // 使用已有模块ID
      })
    });
    
    if (featureResponse.status !== 201) {
      console.error('特性创建失败:', featureResponse.status, featureResponse.data);
      return;
    }
    
    const featureId = featureResponse.data.id;
    console.log('特性创建成功，特性ID:', featureId);
    
    // 3. 直接创建测试用例
    console.log('\n3. 直接创建测试用例...');
    const testCaseData = {
      case_id: `TC-DIRECT-${Date.now()}`,
      case_name: 'Direct API Test Case',
      feature_id: featureId,
      description: 'This is a test case created by direct API test',
      pre_condition: 'System should be running normally',
      steps: '1. Open the application\n2. Perform the action\n3. Verify the result',
      expected_result: 'The action should be successful',
      script_path: '/test_scripts/direct_test.py',
      status: 'active',
      priority: 50,
      test_type: 'manual',
      test_phase: 'system',
      creator: 'test'
    };
    
    console.log('发送的测试用例数据:', JSON.stringify(testCaseData, null, 2));
    
    const testCaseResponse = await sendRequest({
      url: `${BASE_URL}/testcases/`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRFToken': csrfToken,
        'Cookie': cookieString
      },
      body: JSON.stringify(testCaseData)
    });
    
    console.log('测试用例创建响应状态码:', testCaseResponse.status);
    
    if (testCaseResponse.status === 201) {
      console.log('✓ 测试用例创建成功！');
      console.log('创建的测试用例信息:', JSON.stringify(testCaseResponse.data, null, 2));
      console.log('\n=== 测试结果：成功 ===');
    } else {
      console.error('✗ 测试用例创建失败:', testCaseResponse.status, testCaseResponse.data);
      console.log('\n=== 测试结果：失败 ===');
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    console.log('\n=== 测试结果：异常 ===');
  }
}

// 执行测试
if (import.meta.url === import.meta.resolve(process.argv[1])) {
  directApiTest();
}