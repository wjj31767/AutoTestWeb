import axios from 'axios';
import { writeFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// 获取当前文件路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * 环境详情接口测试脚本
 * 功能：
 * 1. 验证登录功能
 * 2. 测试获取单个环境详情接口
 * 3. 验证环境详情数据结构正确性
 * 4. 记录测试过程和结果
 */
async function runEnvironmentDetailTest() {
  console.log('\n=== 环境详情接口测试 ===');
  
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

    // 1. 登录测试
    console.log('1. 正在登录系统...');
    const loginStep = {
      step: 'login',
      status: 'running',
    };
    testResult.details.testSteps.push(loginStep);

    const loginResponse = await api.post('/api/user/login/', {
      username: 'test',
      password: 'test@123',
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

    // 2. 获取环境列表，找到第一个环境的ID用于详情查询
    console.log('\n2. 获取环境列表以找到测试用的环境ID...');
    const listStep = {
      step: 'environment_list',
      status: 'running',
    };
    testResult.details.testSteps.push(listStep);

    // 设置Cookie并发起请求
    const listResponse = await api.get('/api/environments/?name=&type=&status=&ip=&page=1&pageSize=10', {
      headers: {
        'Cookie': createCookieString(cookies),
        'X-CSRFToken': csrfToken
      }
    });
    
    listStep.status = 'completed';
    listStep.response = {
      status: listResponse.status,
      data: listResponse.data,
    };

    if (listResponse.status === 200) {
      console.log('✅ 环境列表获取成功！');
      console.log('  - 总条数:', listResponse.data.count);
      
      if (listResponse.data.count > 0 && listResponse.data.results && listResponse.data.results.length > 0) {
        const testEnvId = listResponse.data.results[0].id;
        console.log(`  - 找到测试环境ID: ${testEnvId}`);
        
        // 3. 获取单个环境详情
        console.log('\n3. 获取环境详情...');
        const detailStep = {
          step: 'environment_detail',
          status: 'running',
          environmentId: testEnvId,
        };
        testResult.details.testSteps.push(detailStep);

        // 设置Cookie和CSRF令牌并发起请求
        const detailResponse = await api.get(`/api/environments/${testEnvId}/`, {
          headers: {
            'Cookie': createCookieString(cookies),
            'X-CSRFToken': csrfToken
          }
        });
        
        detailStep.status = 'completed';
        detailStep.response = {
          status: detailResponse.status,
          data: detailResponse.data,
        };

        if (detailResponse.status === 200) {
          console.log('✅ 环境详情获取成功！');
          
          // 验证环境详情数据结构
          const hasValidStructure = 
            'id' in detailResponse.data &&
            'name' in detailResponse.data &&
            'type' in detailResponse.data &&
            'status' in detailResponse.data &&
            'conn_type' in detailResponse.data &&
            'owner' in detailResponse.data &&
            'admin' in detailResponse.data &&
            'cabinet_frame_slot' in detailResponse.data &&
            'port' in detailResponse.data &&
            'ip' in detailResponse.data;

          if (hasValidStructure) {
            console.log('✅ 环境详情数据结构验证通过');
            console.log(`  - 环境名称: ${detailResponse.data.name}`);
            console.log(`  - 环境类型: ${detailResponse.data.type}`);
            console.log(`  - 环境状态: ${detailResponse.data.status}`);
            console.log(`  - 环境IP: ${detailResponse.data.ip}`);
            
            testResult.success = true;
            testResult.message = '环境详情接口测试通过！接口返回正常结构和数据。';
          } else {
            throw new Error('环境详情响应结构无效，缺少必要字段');
          }
        } else {
          throw new Error(`环境详情接口返回非200状态码: ${detailResponse.status}`);
        }
      } else {
        console.log('⚠️ 当前没有环境数据，无法测试详情接口');
        testResult.success = true; // 无数据时测试通过，但给出提示
        testResult.message = '当前没有环境数据，环境详情接口测试跳过';
      }
    } else {
      throw new Error(`环境列表接口返回非200状态码: ${listResponse.status}`);
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
    const logFilePath = join(__dirname, '../environment_detail_test.log');
    await writeFile(logFilePath, JSON.stringify(testResult, null, 2));
    console.log(`\n测试结果已保存到: ${logFilePath}`);
  } catch (writeError) {
    console.error('保存测试结果失败:', writeError.message);
  }

  // 显示重要提示
  console.log('\n=== 重要提示 ===');
  console.log('1. 环境详情接口需要有效的环境ID');
  console.log('2. 如果当前没有环境数据，测试会自动跳过详情获取');
  console.log('3. 建议先创建环境数据再运行此测试');

  return testResult.success;
}

// 导出默认函数，供test_runner.js导入
// 如果直接运行此脚本，则执行测试
if (process.argv[1] && process.argv[1].endsWith('test_environment_detail.js')) {
  runEnvironmentDetailTest().catch(error => {
    console.error('测试执行过程中发生错误:', error);
    process.exit(1);
  });
}

export default runEnvironmentDetailTest;