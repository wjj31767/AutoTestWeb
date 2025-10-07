import axios from 'axios';

// 测试登录API获取token
async function login() {
  try {
    const response = await axios.post('http://localhost:8000/api/user/login/', {
      username: 'hp',
      password: '123456'
    });
    console.log('登录成功:', response.data);
    return response.data.token || response.data.key; // 根据实际返回格式调整
  } catch (error) {
    console.error('登录失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 测试获取环境列表API
async function testEnvironmentList(token) {
  try {
    const response = await axios.get('http://localhost:8000/api/environments/', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('获取环境列表成功:', response.data);
    return response.data;
  } catch (error) {
    console.error('获取环境列表失败:', error.response ? error.response.data : error.message);
    throw error;
  }
}

// 运行测试
async function runTests() {
  try {
    console.log('开始测试API...');
    // 先登录获取token
    const token = await login();
    // 使用token测试环境列表API
    await testEnvironmentList(token);
    console.log('测试完成');
  } catch (error) {
    console.error('测试失败:', error);
  }
}

runTests();