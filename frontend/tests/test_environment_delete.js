import axios from 'axios';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 环境删除接口测试脚本
 * 功能：
 * 1. 验证登录功能
 * 2. 创建一个临时测试环境（避免影响现有数据）
 * 3. 测试删除环境接口
 * 4. 验证环境是否被成功删除
 * 5. 记录测试过程和结果
 */
async function runEnvironmentDeleteTest() {
  console.log('\n=== 环境删除接口测试 ===');
  
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
    // 创建axios实例
    const api = axios.create({
      baseURL: 'http://localhost:5173',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
    });

    // 手动处理Cookie和CSRF令牌
    let cookies = {};
    let csrfToken = '';
    
    // 提取Cookie和CSRF令牌的函数
    function extractCookiesAndCsrfToken(responseHeaders) {
      const cookieMap = {};
      const setCookieHeaders = responseHeaders['set-cookie'] || [];
      
      setCookieHeaders.forEach(cookieHeader => {
        const parts = cookieHeader.split(';');
        const cookiePart = parts[0];
        const [key, value] = cookiePart.split('=');
        cookieMap[key.trim()] = value.trim();
        
        // 提取CSRF令牌
        if (key.trim() === 'csrftoken') {
          csrfToken = value.trim();
        }
      });
      
      return cookieMap;
    }
    
    // 创建Cookie字符串的函数
    function createCookieString(cookieMap) {
      return Object.entries(cookieMap)
        .map(([key, value]) => `${key}=${value}`)
        .join('; ');
    }

    // 1. 管理员用户登录测试
    console.log('1. 正在登录系统...');
    const loginStep = {
      step: 'login',
      status: 'running',
    };
    testResult.details.testSteps.push(loginStep);

    const loginResponse = await api.post('/api/user/login/', {
      username: 'admin',
      password: 'admin123',
    });

    loginStep.status = 'completed';
    loginStep.response = {
      status: loginResponse.status,
      data: loginResponse.data,
    };

    if (loginResponse.status === 200) {
      console.log('✅ 登录成功！用户:', loginResponse.data.username);
      testResult.details.user = loginResponse.data.username;
      
      // 提取并保存Cookie和CSRF令牌
      cookies = extractCookiesAndCsrfToken(loginResponse.headers);
      console.log('  - 提取到的Cookie:', Object.keys(cookies));
      console.log('  - 提取到的CSRF令牌:', csrfToken);
    } else {
      throw new Error(`登录失败，状态码: ${loginResponse.status}`);
    }

    // 2. 创建临时测试环境（避免影响现有数据）
    console.log('\n2. 创建临时测试环境...');
    const createStep = {
      step: 'create_test_environment',
      status: 'running',
    };
    testResult.details.testSteps.push(createStep);

    const tempEnvData = {
      name: `temp_test_env_${Date.now()}`,
      type: 'FPGA',
      description: '临时测试环境，将在测试后删除',
      status: 'available',
      conn_type: 'Telnet',
      // owner字段已移除，由后端从请求头获取
      admin: 'admin',
      admin_password: 'admin123',
      cabinet_frame_slot: '0 60 0',
      port: '100',
      ip: '10.10.10.10'
    };

    // 设置Cookie和CSRF令牌并发起请求
    const createResponse = await api.post('/api/environments/', tempEnvData, {
      headers: {
        'Cookie': createCookieString(cookies),
        'X-CSRFToken': csrfToken
      }
    });
    
    createStep.status = 'completed';
    createStep.response = {
      status: createResponse.status,
      data: createResponse.data,
    };

    if (createResponse.status === 201) {
      const tempEnvId = createResponse.data.id;
      console.log(`✅ 临时测试环境创建成功！ID: ${tempEnvId}`);
      console.log(`  - 环境名称: ${createResponse.data.name}`);
      
      // 3. 删除临时测试环境
      console.log('\n3. 删除临时测试环境...');
      const deleteStep = {
        step: 'environment_delete',
        status: 'running',
        environmentId: tempEnvId,
      };
      testResult.details.testSteps.push(deleteStep);

      // 设置Cookie和CSRF令牌并发起请求
      const deleteResponse = await api.delete(`/api/environments/${tempEnvId}/`, {
        headers: {
          'Cookie': createCookieString(cookies),
          'X-CSRFToken': csrfToken
        }
      });
      
      deleteStep.status = 'completed';
      deleteStep.response = {
        status: deleteResponse.status,
        data: deleteResponse.data || 'No Content',
      };

      if (deleteResponse.status === 204 || deleteResponse.status === 200) {
        console.log('✅ 环境删除成功！');
        
        // 4. 验证环境是否被成功删除
        console.log('\n4. 验证环境是否被成功删除...');
        
        try {
          // 设置Cookie和CSRF令牌并发起请求
          const verifyResponse = await api.get(`/api/environments/${tempEnvId}/`, {
            headers: {
              'Cookie': createCookieString(cookies),
              'X-CSRFToken': csrfToken
            }
          });
          // 如果请求成功，说明环境没有被删除
          throw new Error('环境删除验证失败，环境依然存在');
        } catch (verifyError) {
          // 预期的错误，说明环境已被删除
          if (verifyError.response && verifyError.response.status === 404) {
            console.log('✅ 环境删除验证成功！环境已不存在');
            
            testResult.success = true;
            testResult.message = '环境删除接口测试通过！临时测试环境已成功创建并删除。';
          } else {
            throw new Error(`验证删除时发生意外错误: ${verifyError.message}`);
          }
        }
      } else {
        throw new Error(`环境删除接口返回非预期状态码: ${deleteResponse.status}`);
      }
    } else {
      throw new Error(`创建临时测试环境失败，状态码: ${createResponse.status}`);
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
    const logFilePath = join(__dirname, '../environment_delete_test.log');
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`\n测试结果已保存到: ${logFilePath}`);
  } catch (writeError) {
    console.error('保存测试结果失败:', writeError.message);
  }

  // 显示重要提示
  console.log('\n=== 重要提示 ===');
  console.log('1. 此测试会创建并自动删除一个临时测试环境');
  console.log('2. 删除操作已在测试流程中完成，不会残留测试数据');
  console.log('3. 如果测试失败，请检查是否有足够的权限执行环境创建和删除操作');

  return testResult.success;
}

// 导出默认函数，供test_runner.js导入
// 如果直接运行此脚本，则执行测试
if (process.argv[1] && process.argv[1].endsWith('test_environment_delete.js')) {
  runEnvironmentDeleteTest().catch(error => {
    console.error('测试执行过程中发生错误:', error);
    process.exit(1);
  });
}

export default runEnvironmentDeleteTest;