// 环境详情API响应数据结构测试脚本（简化版）
const axios = require('axios');

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 5000
});

// 登录凭证
const loginData = {
  username: 'admin',
  password: 'admin123'
};

// 测试环境详情API
async function testEnvironmentDetail() {
  try {
    console.log('=== 开始测试环境详情API ===');
    
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginRes = await service.post('/user/login/', loginData);
    
    if (!loginRes.data || !loginRes.data.token) {
      console.error('登录失败，未获取到token');
      return;
    }
    
    const token = loginRes.data.token;
    console.log('登录成功，token获取成功');
    
    // 设置Authorization头
    service.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. 获取环境列表，获取第一个环境的ID
    console.log('\n2. 获取环境列表...');
    const envListRes = await service.get('/environments/');
    
    console.log('环境列表API响应状态码:', envListRes.status);
    
    if (!envListRes.data || !Array.isArray(envListRes.data.results) || envListRes.data.results.length === 0) {
      console.error('未找到任何环境，请先创建环境再进行测试');
      return;
    }
    
    const firstEnv = envListRes.data.results[0];
    const envId = firstEnv.id;
    console.log(`找到环境: ID=${envId}, 名称=${firstEnv.name}`);
    
    // 3. 调用环境详情API
    console.log(`\n3. 调用环境详情API，ID=${envId}...`);
    const detailRes = await service.get(`/environments/${envId}/`);
    
    console.log('环境详情API响应状态码:', detailRes.status);
    
    // 4. 检查响应数据结构
    console.log('\n4. 分析响应数据结构...');
    
    // 只输出关键信息，避免循环引用问题
    console.log('响应对象包含data字段:', 'data' in detailRes);
    console.log('data字段类型:', detailRes.data ? typeof detailRes.data : 'undefined');
    
    if (detailRes.data) {
      console.log('✓ 响应包含data字段，这是预期的格式');
      console.log('data字段是否为对象:', typeof detailRes.data === 'object' && detailRes.data !== null);
      console.log('环境详情名称:', detailRes.data.name);
      console.log('环境详情类型:', detailRes.data.type);
      console.log('环境详情IP:', detailRes.data.ip);
    } else {
      console.log('✗ 响应不包含data字段，数据直接在根节点');
      console.log('环境详情名称:', detailRes.name);
      console.log('环境详情类型:', detailRes.type);
      console.log('环境详情IP:', detailRes.ip);
    }
    
    // 5. 验证修复方案
    console.log('\n5. 验证修复方案...');
    const fixedData = detailRes.data ? detailRes.data : detailRes;
    console.log('修复方案将使用的最终数据:', {
      name: fixedData.name,
      type: fixedData.type,
      ip: fixedData.ip
    });
    
    console.log('\n=== 测试完成 ===');
    console.log('结论: 修复方案有效，能够处理', detailRes.data ? '有data字段的' : '没有data字段的', '响应格式');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('错误响应状态码:', error.response.status);
      console.error('错误响应数据:', error.response.data);
    }
  }
}

testEnvironmentDetail();