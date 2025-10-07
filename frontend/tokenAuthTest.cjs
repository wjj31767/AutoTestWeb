const axios = require('axios');

// 测试Token认证系统是否正常工作
console.log('===== Django API Token认证测试工具 =====');
console.log('此工具将测试登录获取Token并使用Token访问受保护的API');
console.log('\n请确保后端Django服务器已启动!\n');

// 配置axios实例
const apiClient = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  },
  withCredentials: true
});

async function runTest() {
  try {
    // 1. 登录获取Token
    console.log('1. 发送登录请求获取Token...');
    const loginResponse = await apiClient.post('/user/login/', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('登录成功! 状态码:', loginResponse.status);
    console.log('登录响应数据:', JSON.stringify(loginResponse.data, null, 2));
    
    // 提取Token
    const token = loginResponse.data.token;
    if (!token) {
      console.error('错误: 登录成功但未返回Token!');
      return;
    }
    
    console.log('成功获取Token:', token.substring(0, 10) + '...');
    
    // 2. 使用Token访问受保护的API
    console.log('\n2. 使用获取的Token访问受保护的API...');
    
    // 为不同端点创建不同的认证客户端
    // 1. 针对/user/profile/端点使用标准Token认证
    const tokenAuthClient = axios.create({
      baseURL: 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${token}` // 使用标准Token认证
      },
      withCredentials: true
    });
    
    // 2. 针对/environments/端点使用Bearer认证
    const bearerAuthClient = axios.create({
      baseURL: 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}` // 使用Bearer类型的Token认证
      },
      withCredentials: true
    });
    
    // 测试获取用户信息
    console.log('测试访问/user/profile/端点...');
    const profileResponse = await tokenAuthClient.get('/user/profile/');
    console.log('获取用户信息成功! 状态码:', profileResponse.status);
    console.log('用户信息:', JSON.stringify(profileResponse.data, null, 2));
    
    // 测试访问环境列表API
    console.log('\n测试访问/environments/端点...');
    const envResponse = await bearerAuthClient.get('/environments/', {
      params: {
        page: 1,
        pageSize: 10
      }
    });
    console.log('获取环境列表成功! 状态码:', envResponse.status);
    console.log('环境列表数据:', JSON.stringify(envResponse.data, null, 2));
    
    console.log('\n🎉 测试成功! Token认证系统工作正常。');
    console.log('\n===== 测试完成 =====');
    
  } catch (error) {
    console.error('测试失败!');
    if (error.response) {
      console.error(`状态码: ${error.response.status}`);
      console.error('错误信息:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.log('\n诊断结果:');
        console.log('认证失败。可能的原因:');
        console.log('1. Token生成或返回有问题');
        console.log('2. Token认证类配置不正确');
        console.log('3. Token未正确添加到请求头');
      } else if (error.response.status === 403) {
        console.log('\n诊断结果:');
        console.log('权限不足。请确认用户是否有足够权限访问这些API。');
      }
    } else if (error.request) {
      console.error('网络错误: 无法连接到服务器');
      console.log('请确保Django服务器正在运行在8000端口');
    } else {
      console.error('请求错误:', error.message);
    }
  }
}

// 运行测试
setTimeout(() => {
  runTest();
}, 1000);