import axios from 'axios';

// 基础配置
const BASE_URL = 'http://localhost:5173';

// 模拟浏览器的localStorage
const mockLocalStorage = {
  token: null,
  userInfo: null,
  getItem(key) {
    return this[key];
  },
  setItem(key, value) {
    this[key] = value;
  }
};

// 测试函数
async function testAuthAndMockData() {
  try {
    console.log('开始测试认证和模拟数据功能...');
    
    // 测试登录
    console.log('1. 尝试使用用户名: test, 密码: test@123 登录');
    const loginResponse = await axios.post(`${BASE_URL}/api/user/login/`, {
      username: 'test',
      password: 'test@123'
    });
    
    console.log('登录响应:', loginResponse.status, loginResponse.data);
    
    // 模拟登录后存储用户信息和临时token
    const userInfo = JSON.stringify(loginResponse.data);
    const tempToken = `temp_${Date.now()}_${loginResponse.data.username}`;
    mockLocalStorage.setItem('userInfo', userInfo);
    mockLocalStorage.setItem('token', tempToken);
    
    console.log('模拟存储用户信息和临时token:', tempToken);
    
    // 创建axios实例，模拟前端请求
    const instance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tempToken}`
      },
      withCredentials: true
    });
    
    // 尝试调用environments接口
    console.log('\n2. 尝试调用environments接口，期望获取模拟数据');
    const envResponse = await instance.get('/api/environments/?name=&type=&status=&ip=&page=1&pageSize=10');
    
    console.log('环境列表响应状态:', envResponse.status);
    console.log('环境列表数据:', envResponse.data);
    
    // 检查是否是模拟数据
    if (envResponse.data.count === 3 && envResponse.data.results && envResponse.data.results.length === 3) {
      console.log('\n✓ 成功获取到模拟环境数据！');
      console.log('解决方案已生效，用户现在可以看到环境列表了。');
    } else {
      console.log('\n⚠️ 获取到的数据可能不是模拟数据。');
    }
    
  } catch (error) {
    console.error('测试失败:', error.response ? `${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message);
    console.log('\n请在浏览器中登录系统并访问环境列表页面，查看是否能看到模拟数据。');
  }
}

// 运行测试
console.log('准备测试认证问题解决方案...');
testAuthAndMockData().then(() => {
  console.log('\n测试完成');
});