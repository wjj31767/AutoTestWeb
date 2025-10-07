import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import axios from 'axios';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 普通用户创建环境权限测试脚本
 * 功能：
 * 1. 验证普通用户是否可以创建环境
 * 2. 记录测试过程和结果
 */
async function runNormalUserCreateEnvTest() {
  console.log('\n=== 普通用户创建环境权限测试 ===');
  
  // 测试结果对象
  const testResult = {
    timestamp: new Date().toISOString(),
    success: false,
    message: '',
    details: {
      environment: 'Node.js CLI',
      testSteps: [],
    },
  };

  try {
    // 创建axios实例，包含withCredentials配置以支持session认证
    const api = axios.create({
      baseURL: 'http://localhost:5173',
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // 在创建实例时就包含这个配置
    });

    // 添加请求拦截器用于调试
    api.interceptors.request.use(
      config => {
        console.log('请求配置:', {
          url: config.url,
          method: config.method,
          headers: config.headers,
          withCredentials: config.withCredentials
        });
        return config;
      },
      error => {
        console.error('请求配置错误:', error);
        return Promise.reject(error);
      }
    );

    // 添加响应拦截器用于调试
    api.interceptors.response.use(
      response => {
        console.log('响应状态:', response.status);
        console.log('响应头:', response.headers);
        return response;
      },
      error => {
        console.error('响应错误:', error);
        return Promise.reject(error);
      }
    );

    // 测试数据
    const testEnvData = {
      id: '',
      name: 'normalusertestenv' + Date.now(),
      type: 'FPGA',
      description: '普通用户测试环境',
      status: 'available',
      conn_type: 'Telnet',
      // owner字段已移除，由后端从请求头获取
      admin: 'admin',
      admin_password: 'admin1233',
      cabinet_frame_slot: '0 60 0',
      port: '100',
      ip: '10.10.10.10'
    };

    // 模拟localStorage
    global.localStorage = {
      data: {},
      getItem: function(key) {
        return this.data[key] || null;
      },
      setItem: function(key, value) {
        this.data[key] = value;
      },
      removeItem: function(key) {
        delete this.data[key];
      },
      clear: function() {
        this.data = {};
      }
    };

    // 1. 普通用户登录测试
    console.log('1. 普通用户登录...');
    const normalUserLoginStep = {
      step: 'normal_user_login',
      status: 'running',
    };
    testResult.details.testSteps.push(normalUserLoginStep);

    // 尝试多种可能的登录URL路径
    let normalLoginResponse;
    let loginUrl = '/api/user/login/'; // 第一种可能的URL
    try {
      console.log(`尝试登录URL: ${loginUrl}`);
      normalLoginResponse = await api.post(loginUrl, {
        username: 'test',
        password: 'test@123'
      });
    } catch (error1) {
      console.log(`URL1失败，尝试URL2...`);
      loginUrl = '/api/user/'; // 第二种可能的URL（标准ViewSet路由）
      try {
        normalLoginResponse = await api.post(loginUrl, {
          username: 'test',
          password: 'test@123'
        });
      } catch (error2) {
        console.log(`URL2失败，尝试URL3...`);
        loginUrl = '/api/user/login'; // 第三种可能的URL（无尾斜杠）
        normalLoginResponse = await api.post(loginUrl, {
          username: 'test',
          password: 'test@123'
        });
      }
    }

    normalUserLoginStep.status = 'completed';
    normalUserLoginStep.response = {
      status: normalLoginResponse.status,
      data: normalLoginResponse.data,
    };

    if (normalLoginResponse.status === 200) {
      console.log('✅ 普通用户登录成功！');
      console.log('  登录响应:', JSON.stringify(normalLoginResponse.data));
      
      // 模拟保存token到localStorage（与前端行为一致）
      const mockToken = 'test-user-token-' + Date.now();
      global.localStorage.setItem('token', mockToken);
      global.localStorage.setItem('userInfo', JSON.stringify(normalLoginResponse.data));
      console.log('  已模拟保存认证token到localStorage');
    } else {
      throw new Error(`普通用户登录失败，状态码: ${normalLoginResponse.status}`);
    }

    // 2. 普通用户尝试创建环境
    console.log('\n2. 普通用户尝试创建环境...');
    const normalCreateStep = {
      step: 'normal_user_create_env',
      status: 'running',
      endpoint: '/api/environments/',
      testData: testEnvData
    };
    testResult.details.testSteps.push(normalCreateStep);

    try {
      // 重要：从localStorage获取token并添加到请求头
      const token = global.localStorage.getItem('token');
      const headers = token ? {
        'Authorization': `Bearer ${token}`
      } : {};
      
      console.log('  使用认证头:', headers);
      console.log('  使用session认证（已启用withCredentials）');
      const normalCreateResponse = await api.post('/api/environments/', testEnvData, {
        headers: headers
      });
      
      normalCreateStep.status = 'completed';
      normalCreateStep.response = {
        status: normalCreateResponse.status,
        data: normalCreateResponse.data,
      };
      
      if (normalCreateResponse.status === 201) {
        console.log('✅ 普通用户创建环境成功！');
        console.log('  创建结果:', JSON.stringify(normalCreateResponse.data));
        testResult.success = true;
        testResult.message = '普通用户创建环境权限测试通过！';
      } else {
        throw new Error(`普通用户创建环境失败，状态码: ${normalCreateResponse.status}`);
      }
    } catch (error) {
      if (error.response) {
        normalCreateStep.status = 'failed';
        normalCreateStep.response = {
          status: error.response.status,
          data: error.response.data,
        };
        
        console.error(`❌ 普通用户创建环境失败: 状态码 ${error.response.status}`);
        console.error('  错误信息:', JSON.stringify(error.response.data));
        throw new Error(`普通用户创建环境失败，状态码: ${error.response.status}`);
      } else {
        throw error;
      }
    }

  } catch (error) {
    testResult.success = false;
    testResult.message = `测试失败: ${error.message}`;
    
    // 记录错误信息
    if (error.response) {
      testResult.details.error = {
        message: error.message,
        status: error.response.status,
        data: error.response.data,
        headers: Object.keys(error.response.headers),
      };
      
      console.error(`❌ 测试失败: 状态码 ${error.response.status}`);
      console.error('  错误详情:', JSON.stringify(error.response.data));
    } else {
      testResult.details.error = {
        message: error.message,
      };
      console.error('❌ 测试失败:', error.message);
    }
  }

  // 保存测试结果到日志文件
  try {
    const logFilePath = join(__dirname, '../normal_user_create_env_test.log');
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`\n测试结果已保存到: ${logFilePath}`);
  } catch (writeError) {
    console.error('保存测试结果失败:', writeError.message);
  }

  // 显示重要提示
  console.log('\n=== 重要提示 ===');
  if (testResult.success) {
    console.log('1. 普通用户可以创建环境，权限控制已按要求修改');
  } else {
    console.log('1. 普通用户无法创建环境，请检查后端权限配置');
    console.log('2. 如需允许普通用户创建环境，请修改后端权限类');
  }

  return testResult.success;
}

// 如果直接运行此脚本，则执行测试
if (process.argv[1] && process.argv[1].endsWith('test_normal_user_create_env.js')) {
  runNormalUserCreateEnvTest().catch(error => {
    console.error('测试执行过程中发生错误:', error);
    process.exit(1);
  });
}

export default runNormalUserCreateEnvTest;