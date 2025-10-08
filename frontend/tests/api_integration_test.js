import axios from '../src/api/axios.js';
import process from 'process';

// 日志函数
function log(message) {
  console.log(message);
}

// 登录函数
async function login(username, password) {
  try {
    const response = await axios.post('/api/user/login/', {
      username,
      password
    });
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 创建模块函数
async function createModule(moduleData) {
  try {
    const response = await axios.post('/api/modules/', moduleData);
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status
    };
  }
}

// 获取模块列表函数
async function getModuleList() {
  try {
    const response = await axios.get('/api/modules/');
    return {
      success: true,
      data: response.data
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

// 测试函数
async function runApiTest() {
  log('\n=== 使用前端API封装的完整测试 ===');
  
  try {
    // 1. 登录
    log('\n1. 执行登录请求...');
    const loginResult = await login('test', 'test123');
    
    if (!loginResult || !loginResult.success) {
      log('登录失败: ' + JSON.stringify(loginResult));
      process.exit(1);
    }
    
    log('登录成功！用户信息: ' + JSON.stringify(loginResult.data));
    
    // 2. 创建测试模块
    log('\n2. 使用API封装创建测试模块...');
    const timestamp = Date.now();
    const moduleId = `module-api-${timestamp}`;
    const moduleName = `ApiTestModule_${timestamp}`;
    
    const moduleData = {
      id: moduleId,
      module_name: moduleName,
      chip_model: 'TestChip',
      description: 'Test module created via API封装'
    };
    
    log('发送的数据: ' + JSON.stringify(moduleData));
    
    const createResult = await createModule(moduleData);
    
    if (!createResult || !createResult.success) {
      log('创建模块失败: ' + JSON.stringify(createResult));
      process.exit(1);
    }
    
    log('创建模块成功！模块信息: ' + JSON.stringify(createResult.data));
    
    // 3. 验证模块是否存在于列表中
    log('\n3. 验证模块是否存在于列表中...');
    const moduleListResult = await getModuleList();
    
    if (!moduleListResult || !moduleListResult.success) {
      log('获取模块列表失败: ' + JSON.stringify(moduleListResult));
      process.exit(1);
    }
    
    const createdModule = moduleListResult.data.find(module => module.id === moduleId);
    if (createdModule) {
      log('验证成功！创建的模块存在于列表中: ' + createdModule.module_name);
    } else {
      log('验证失败！创建的模块不在列表中');
      process.exit(1);
    }
    
    log('\n=== API测试成功完成 ===');
    process.exit(0);
    
  } catch (error) {
    log('测试过程中发生错误:');
    console.error(error);
    process.exit(1);
  }
}

// 运行测试
runApiTest();