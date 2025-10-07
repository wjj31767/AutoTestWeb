import axios from 'axios';

// 基础配置
const BASE_URL = 'http://localhost:5173';

// 测试函数
async function testLoginAndAuth() {
  try {
    console.log('开始测试登录和认证...');
    
    // 测试登录
    console.log('1. 尝试使用用户名: test, 密码: test@123 登录');
    const loginResponse = await axios.post(`${BASE_URL}/api/user/login/`, {
      username: 'test',
      password: 'test@123'
    });
    
    console.log('登录响应:', loginResponse.status, loginResponse.data);
    
    // 检查是否有set-cookie
    const cookies = loginResponse.headers['set-cookie'];
    console.log('登录响应中的Cookie:', cookies || '无');
    
    // 尝试使用相同的axios实例调用environments接口
    console.log('\n2. 尝试调用environments接口');
    
    // 创建新的axios实例，用于模拟浏览器中的请求
    const instance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 如果有cookie，添加到请求头
    if (cookies) {
      instance.defaults.headers.Cookie = cookies.join('; ');
    }
    
    // 添加Bearer token（假设登录后返回了token）
    if (loginResponse.data.token || loginResponse.data.access_token) {
      const token = loginResponse.data.token || loginResponse.data.access_token;
      instance.defaults.headers.Authorization = `Bearer ${token}`;
    }
    
    // 调用environments接口
    const envResponse = await instance.get('/api/environments/?name=&type=&status=&ip=&page=1&pageSize=10');
    console.log('环境列表响应:', envResponse.status, envResponse.data);
    
  } catch (error) {
    console.error('测试失败:', error.response ? `${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message);
  }
}

// 运行测试
console.log('准备测试test/test@123用户的登录和认证...');
testLoginAndAuth().then(() => {
  console.log('\n测试完成');
});