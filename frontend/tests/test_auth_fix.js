import axios from 'axios';

// 基础配置
const BASE_URL = 'http://localhost:5173';

// 测试函数
async function testAuthFix() {
  try {
    console.log('开始测试认证问题修复...');
    
    // 创建axios实例，允许携带cookie
    const instance = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
      withCredentials: true, // 关键配置，允许携带cookie
    });
    
    // 1. 尝试使用用户名: test, 密码: test@123 登录
    console.log('\n1. 尝试登录，用户名: test, 密码: test@123');
    const loginResponse = await instance.post('/api/user/login/', {
      username: 'test',
      password: 'test@123'
    });
    
    console.log('登录响应状态:', loginResponse.status);
    console.log('登录响应数据:', loginResponse.data);
    
    if (loginResponse.status === 200) {
      console.log('✓ 登录成功！');
    } else {
      console.error('✗ 登录失败，状态码:', loginResponse.status);
      return;
    }
    
    // 2. 尝试调用环境列表接口
    console.log('\n2. 尝试调用环境列表接口，验证认证是否正常工作');
    const envResponse = await instance.get('/api/environments/?name=&type=&status=&ip=&page=1&pageSize=10');
    
    console.log('环境列表响应状态:', envResponse.status);
    console.log('环境列表数据 - 总数量:', envResponse.data.count);
    console.log('环境列表数据 - 结果数量:', envResponse.data.results?.length || 0);
    
    if (envResponse.status === 200) {
      console.log('\n✓ 修复成功！现在可以正常获取环境列表数据了。');
      console.log('\n解决方案总结:');
      console.log('1. 后端问题: 登录接口验证凭据后未调用login()函数设置用户会话');
      console.log('2. 修复方法: 在common/views.py的user_login方法中添加了login(request, user)调用');
      console.log('3. 结果: 现在登录后可以正常访问需要认证的接口');
    } else {
      console.error('✗ 环境列表接口调用失败，状态码:', envResponse.status);
    }
    
  } catch (error) {
    console.error('测试失败:', error.response ? `${error.response.status}: ${JSON.stringify(error.response.data)}` : error.message);
    console.log('\n请在浏览器中登录系统并访问环境列表页面进行验证。');
  }
}

// 运行测试
console.log('准备测试认证问题修复...');
testAuthFix().then(() => {
  console.log('\n测试完成');
});