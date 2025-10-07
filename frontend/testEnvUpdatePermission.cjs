const axios = require('axios');
const http = require('http');
const https = require('https');

// 创建axios实例，禁用HTTPS证书验证（用于测试环境）
const baseClient = axios.create({
  baseURL: 'http://localhost:8000',
  timeout: 10000,
  withCredentials: true,
  httpAgent: new http.Agent({ keepAlive: true }),
  httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false })
});

// 帮助函数：创建Cookie字符串
function createCookieString(cookies) {
  return cookies.map(cookie => cookie.split(';')[0]).join('; ');
}

// 测试函数
async function testEnvironmentUpdatePermission() {
  const testResult = {
    success: false,
    details: {
      testSteps: []
    }
  };

  try {
    // 1. 普通用户登录
    console.log('1. 普通用户登录...');
    const loginStep = {
      step: 'user_login',
      status: 'running'
    };
    testResult.details.testSteps.push(loginStep);

    const loginResponse = await baseClient.post('/api/user/login/', {
        username: 'test',
        password: 'test@123'
      });

    loginStep.status = 'completed';
    loginStep.response = {
      status: loginResponse.status,
      data: loginResponse.data
    };

    if (loginResponse.status !== 200) {
      throw new Error(`登录失败，状态码: ${loginResponse.status}`);
    }

    console.log('✅ 普通用户登录成功！');
    console.log(`  - 登录响应结构:`, JSON.stringify(loginResponse.data, null, 2));
    console.log(`  - 用户名: ${loginResponse.data.username || loginResponse.data.user?.username}`);

    // 提取Cookie和CSRF令牌
    const cookies = loginResponse.headers['set-cookie'] || [];
    const csrfToken = cookies.find(cookie => cookie.includes('csrftoken='))?.split('=')[1]?.split(';')[0];

    if (!csrfToken) {
      throw new Error('无法获取CSRF令牌');
    }

    console.log(`  - CSRF令牌: ${csrfToken}`);
    console.log(`  - Token: ${loginResponse.data.token}`);
    
    // 创建带token的API客户端
    const api = axios.create({
      baseURL: 'http://localhost:8000/api',
      timeout: 10000,
      headers: {
        'Authorization': `Bearer ${loginResponse.data.token}`,
        'X-CSRFToken': csrfToken
      },
      withCredentials: true,
      httpAgent: new http.Agent({ keepAlive: true }),
      httpsAgent: new https.Agent({ keepAlive: true, rejectUnauthorized: false })
    });

    // 2. 获取用户拥有的环境列表
    console.log('\n2. 获取用户拥有的环境列表...');
    const listStep = {
      step: 'get_env_list',
      status: 'running'
    };
    testResult.details.testSteps.push(listStep);

    const listResponse = await api.get('/environments/');

    listStep.status = 'completed';
    listStep.response = {
      status: listResponse.status,
      data: listResponse.data
    };

    if (listStep.response.status !== 200) {
      throw new Error(`获取环境列表失败，状态码: ${listStep.response.status}`);
    }

    console.log(`✅ 获取环境列表成功！`);
    console.log(`  - 响应结构:`, JSON.stringify(listResponse.data, null, 2));
    
    // 处理环境列表数据
    let envList = [];
    if (Array.isArray(listResponse.data)) {
      envList = listResponse.data;
    } else if (listResponse.data && Array.isArray(listResponse.data.results)) {
      envList = listResponse.data.results;
    }
    
    console.log(`  - 环境总数: ${envList.length} 个环境`);

    // 查找用户拥有的第一个环境
    const userEnvironments = envList.filter(env => env.owner === 'test');
    if (userEnvironments.length === 0) {
      console.log('⚠️ 没有找到用户拥有的环境，将尝试创建一个新环境...');
      // 3. 创建测试环境
      const createStep = {
        step: 'create_test_env',
        status: 'running'
      };
      testResult.details.testSteps.push(createStep);

      const createData = {
        name: `normalusertestenv${Date.now()}`,
        type: 'FPGA',
        status: 'available',
        conn_type: 'Telnet',
        owner: 'test',
        admin: 'admin',
        admin_password: 'password123',
        cabinet_frame_slot: 'cabinet1-frame1-slot1',
        port: '22',
        ip: '10.10.10.10',
        description: '测试环境 - 用于验证权限修改'
      };

      const createResponse = await api.post('/environments/', createData);

      createStep.status = 'completed';
      createStep.response = {
        status: createResponse.status,
        data: createResponse.data
      };

      if (createResponse.status !== 201) {
        throw new Error(`创建环境失败，状态码: ${createResponse.status}`);
      }

      console.log('✅ 测试环境创建成功！');
      console.log(`  - 环境ID: ${createResponse.data.id}`);
      console.log(`  - 环境名称: ${createResponse.data.name}`);
      
      // 重新获取环境列表，找到刚刚创建的环境
      const updatedListResponse = await api.get('/environments/');
      
      const createdEnv = updatedListResponse.data.find(env => env.id === createResponse.data.id);
      if (!createdEnv) {
        throw new Error('无法找到刚刚创建的环境');
      }
      
      testEnvId = createdEnv.id;
    } else {
      console.log(`✅ 找到 ${userEnvironments.length} 个用户拥有的环境`);
      console.log(`  - 使用环境: ${userEnvironments[0].name} (ID: ${userEnvironments[0].id})`);
      testEnvId = userEnvironments[0].id;
    }

    // 4. 尝试更新环境
    console.log('\n4. 尝试更新环境...');
    const updateStep = {
      step: 'update_environment',
      status: 'running',
      environmentId: testEnvId
    };
    testResult.details.testSteps.push(updateStep);

    const updateData = {
      name: `normalusertestenv${Date.now()}`,
      type: 'FPGA',
      status: 'available',
      conn_type: 'Telnet',
      owner: 'test',
      admin: 'admin',
      admin_password: 'password123',
      cabinet_frame_slot: 'cabinet1-frame1-slot1',
      port: '22',
      ip: '10.10.10.10',
      description: `测试更新的环境描述 - ${new Date().toLocaleString()}`
    };

    const updateResponse = await api.put(`/environments/${testEnvId}/`, updateData);

    updateStep.status = 'completed';
    updateStep.response = {
      status: updateResponse.status,
      data: updateResponse.data
    };

    if (updateResponse.status === 200) {
      console.log('✅ 环境更新成功！权限修改生效！');
      console.log(`  - 更新后的名称: ${updateResponse.data.name}`);
      console.log(`  - 更新后的描述: ${updateResponse.data.description}`);
      testResult.success = true;
    } else {
      throw new Error(`环境更新失败，状态码: ${updateResponse.status}`);
    }

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error(`  - 状态码: ${error.response.status}`);
      console.error(`  - 错误详情: ${JSON.stringify(error.response.data)}`);
      
      // 更新最后一步的状态
      if (testResult.details.testSteps.length > 0) {
        const lastStep = testResult.details.testSteps[testResult.details.testSteps.length - 1];
        if (lastStep.status === 'running') {
          lastStep.status = 'failed';
          lastStep.error = {
            status: error.response.status,
            data: error.response.data,
            message: error.message
          };
        }
      }
    } else {
      // 更新最后一步的状态
      if (testResult.details.testSteps.length > 0) {
        const lastStep = testResult.details.testSteps[testResult.details.testSteps.length - 1];
        if (lastStep.status === 'running') {
          lastStep.status = 'failed';
          lastStep.error = {
            message: error.message
          };
        }
      }
    }
  }

  console.log('\n5. 测试结果总结:');
  console.log(`   成功状态: ${testResult.success ? '✓ 成功' : '✗ 失败'}`);
  console.log('   详细步骤:');
  testResult.details.testSteps.forEach((step, index) => {
    console.log(`     ${index + 1}. ${step.step}: ${step.status}`);
    if (step.status === 'failed' && step.error) {
      console.log(`       错误: ${step.error.message}`);
      if (step.error.data) {
        console.log(`       详情: ${JSON.stringify(step.error.data)}`);
      }
    }
  });

  return testResult;
}

// 执行测试
console.log('开始测试环境更新权限...');
console.log('='.repeat(50));
testEnvironmentUpdatePermission().then(result => {
  console.log('='.repeat(50));
  console.log('测试完成');
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('测试过程中出现未捕获的错误:', err);
  process.exit(1);
});