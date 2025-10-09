// 使用fetch API直接测试任务提交功能
async function testTaskApi() {
  console.log('开始测试任务提交API...');
  
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
  
  try {
    // 直接使用fetch调用API
    const startTime = Date.now();
    const response = await fetch('http://localhost:8000/api/tasks/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 尝试从document.cookie获取CSRF token
        'X-CSRFToken': getCSRFToken()
      },
      credentials: 'include', // 包含cookie
      body: JSON.stringify(testData)
    });
    const endTime = Date.now();
    
    console.log(`请求完成，状态码: ${response.status}，耗时: ${endTime - startTime}ms`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('响应数据:', data);
      console.log('任务创建成功，任务ID:', data.id);
      return data;
    } else {
      const errorData = await response.json().catch(() => ({}));
      console.error('请求失败:', { status: response.status, data: errorData });
      return null;
    }
  } catch (error) {
    console.error('网络请求异常:', error.message);
    return null;
  }
}

// 从cookie获取CSRF token的函数
function getCSRFToken() {
  try {
    const cookieValue = document.cookie
      ?.split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  } catch (e) {
    console.log('无法访问document.cookie:', e.message);
    return '';
  }
}

// 执行测试
testTaskApi().then(result => {
  if (result) {
    console.log('测试成功完成!');
  } else {
    console.log('测试失败!');
  }
});