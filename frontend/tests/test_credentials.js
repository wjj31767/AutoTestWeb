import axios from 'axios';

// 设置axios基础配置
const API_BASE_URL = 'http://localhost:8000/api';

// 打印请求和响应的详细信息
const logRequestResponse = async (method, url, data = null, headers = {}) => {
  try {
    console.log(`\n发送请求: ${method.toUpperCase()} ${url}`);
    console.log('请求数据:', data);
    console.log('请求头:', headers);
    
    const config = {
      method,
      url: API_BASE_URL + url,
      data,
      headers,
      withCredentials: true // 启用cookie
    };
    
    const response = await axios(config);
    
    console.log(`响应状态码: ${response.status}`);
    console.log('响应数据:', response.data);
    return response;
  } catch (error) {
    console.error(`请求失败: ${error.message}`);
    if (error.response) {
      console.error(`响应状态码: ${error.response.status}`);
      console.error('响应数据:', error.response.data);
    }
    throw error;
  }
};

// 测试登录并检查认证方式
async function testLoginAndAuth() {
  try {
    console.log('开始测试登录和认证流程...');
    
    // 1. 清除所有cookies和localStorage（模拟新用户）
    // 注意：Node.js环境无法直接清除浏览器cookies，但我们可以通过axios配置模拟
    
    // 2. 测试登录
    const loginResponse = await logRequestResponse('post', '/user/login/', {
      username: 'hp',
      password: 'hp'
    });
    
    if (loginResponse.status === 200) {
      console.log('\n登录成功! 用户信息:', loginResponse.data);
      
      // 3. 检查是否有token或session cookie
      console.log('\n检查响应头中的Set-Cookie:', loginResponse.headers['set-cookie'] || '无');
      
      // 4. 尝试获取环境列表（使用相同的axios实例，自动携带cookie）
      try {
        console.log('\n尝试使用cookie认证获取环境列表...');
        const envResponse = await logRequestResponse('get', '/environments/');
        console.log('\n成功获取环境列表! 数据量:', Array.isArray(envResponse.data) ? envResponse.data.length : '未知');
        return {
          success: true,
          authType: 'cookie',
          message: '使用cookie认证成功获取环境列表'
        };
      } catch (envError) {
        console.error('使用cookie认证获取环境列表失败');
        
        // 5. 尝试使用不同的token认证方式
        const possibleTokenFields = ['token', 'key', 'access_token', 'auth_token'];
        let foundToken = null;
        
        for (const field of possibleTokenFields) {
          if (loginResponse.data[field]) {
            foundToken = loginResponse.data[field];
            console.log(`\n在登录响应中找到${field}: ${foundToken.substring(0, 10)}...`);
            break;
          }
        }
        
        if (foundToken) {
          console.log(`\n尝试使用${foundToken ? possibleTokenFields.find(f => loginResponse.data[f]) : '自定义token'}认证获取环境列表...`);
          try {
            const tokenResponse = await logRequestResponse('get', '/environments/', null, {
              'Authorization': `Bearer ${foundToken}`
            });
            console.log('\n成功获取环境列表! 数据量:', Array.isArray(tokenResponse.data) ? tokenResponse.data.length : '未知');
            return {
              success: true,
              authType: 'token',
              token: foundToken,
              message: '使用token认证成功获取环境列表'
            };
          } catch (tokenError) {
            console.error('使用token认证获取环境列表失败');
          }
        }
      }
    }
    
    return {
      success: false,
      message: '无法完成认证流程'
    };
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    return {
      success: false,
      message: `测试失败: ${error.message}`
    };
  }
}

// 检查API端点
async function checkApiEndpoints() {
  try {
    console.log('\n检查常见的API端点...');
    const endpoints = ['/user/', '/environments/'];
    
    for (const endpoint of endpoints) {
      try {
        const response = await axios.head(API_BASE_URL + endpoint);
        console.log(`${endpoint}: 可用 (状态码: ${response.status})`);
      } catch (error) {
        console.log(`${endpoint}: 不可用 ${error.response ? `(状态码: ${error.response.status})` : ''}`);
      }
    }
  } catch (error) {
    console.error('检查API端点时发生错误:', error);
  }
}

// 运行测试
async function runTests() {
  try {
    const authResult = await testLoginAndAuth();
    console.log('\n认证测试结果:', authResult);
    
    await checkApiEndpoints();
    
    console.log('\n测试完成!');
  } catch (error) {
    console.error('整体测试过程中发生错误:', error);
  }
}

runTests();