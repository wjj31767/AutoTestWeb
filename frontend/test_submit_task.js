import { createTaskExecution } from './src/api/taskExecution.js';

// 测试提交任务功能
async function testSubmitTask() {
  try {
    console.log('开始测试任务提交...');
    
    // 准备测试数据
    const testData = {
      name: '测试任务',
      env_id: '1', // 假设存在ID为1的环境
      suite_id: 'string-id-123', // 字符串类型的测试用例集ID
      description: '测试任务描述',
      branch_package: '/test/branch/path',
      execution_mode: 'parallel',
      max_concurrency: 5,
      timeout: 60,
      execution_params: '{"param1": "value1"}'
    };
    
    console.log('提交的测试数据:', testData);
    
    // 调用API
    const startTime = Date.now();
    const response = await createTaskExecution(testData);
    const endTime = Date.now();
    
    console.log(`API调用成功，耗时: ${endTime - startTime}ms`);
    console.log('响应数据:', response.data);
    console.log('任务创建成功，任务ID:', response.data.id);
    
    return response.data;
  } catch (error) {
    console.error('任务提交失败:', error);
    
    // 打印详细错误信息
    if (error.response) {
      console.error('HTTP状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
      console.error('响应头:', error.response.headers);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    } else {
      console.error('请求配置错误:', error.message);
    }
    
    console.error('请求配置:', error.config);
    
    return null;
  }
}

// 执行测试
console.log('测试环境信息:');
console.log('当前URL:', window.location.href);
console.log('API基础URL:', '/api');

// 检查localStorage中的token
try {
  const token = localStorage.getItem('token');
  console.log('存在登录token:', !!token);
} catch (e) {
  console.log('无法访问localStorage:', e.message);
}

testSubmitTask().then(result => {
  if (result) {
    console.log('测试成功完成!');
  } else {
    console.log('测试失败!');
  }
});