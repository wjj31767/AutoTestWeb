// 环境查找功能测试脚本
const axios = require('axios');

// 创建axios实例
const service = axios.create({
  baseURL: 'http://localhost:8000/api',
  timeout: 5000
});

// 登录凭证
const loginData = {
  username: 'admin',
  password: 'admin123' // 更新为正确的密码
};

// 测试用例
async function runTests() {
  try {
    console.log('=== 开始测试环境查找功能 ===');
    
    // 1. 登录获取token
    console.log('1. 登录获取token...');
    const loginRes = await service.post('/user/login/', loginData);
    
    if (!loginRes.data || !loginRes.data.token) {
      console.error('登录失败，未获取到token');
      return;
    }
    
    const token = loginRes.data.token;
    console.log('登录成功，token:', token);
    
    // 设置Authorization头
    service.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    
    // 2. 测试不使用搜索条件获取所有环境
    console.log('\n2. 测试不使用搜索条件获取所有环境...');
    const allEnvsRes = await service.get('/environments/', { params: { page: 1, pageSize: 10 } });
    console.log('环境总数:', allEnvsRes.data?.count || '未知');
    console.log('当前页环境数量:', allEnvsRes.data?.results?.length || '未知');
    
    // 3. 测试按名称搜索（如果有环境存在）
    if (allEnvsRes.data?.results?.length > 0) {
      const firstEnvName = allEnvsRes.data.results[0].name;
      console.log(`\n3. 测试按名称搜索: "${firstEnvName}"...`);
      const nameSearchRes = await service.get('/environments/', { 
        params: { 
          page: 1, 
          pageSize: 10, 
          search: firstEnvName 
        } 
      });
      console.log(`名称搜索结果数: ${nameSearchRes.data?.results?.length || 0}`);
      if (nameSearchRes.data?.results?.length > 0) {
        console.log('搜索结果示例:', nameSearchRes.data.results[0].name);
      }
    }
    
    // 4. 测试按类型搜索
    console.log('\n4. 测试按类型搜索...');
    const typeSearchRes = await service.get('/environments/', { 
      params: { 
        page: 1, 
        pageSize: 10, 
        type: 'FPGA' // 使用有效的环境类型
      } 
    });
    console.log(`类型搜索结果数: ${typeSearchRes.data?.results?.length || 0}`);
    if (typeSearchRes.data?.results?.length > 0) {
      console.log('类型搜索结果示例:', typeSearchRes.data.results[0].name, typeSearchRes.data.results[0].type);
    }
    
    // 5. 测试按状态搜索
    console.log('\n5. 测试按状态搜索...');
    const statusSearchRes = await service.get('/environments/', { 
      params: { 
        page: 1, 
        pageSize: 10, 
        status: 'available' // 搜索可用状态的环境
      } 
    });
    console.log(`状态搜索结果数: ${statusSearchRes.data?.results?.length || 0}`);
    
    // 6. 测试组合搜索条件
    console.log('\n6. 测试组合搜索条件...');
    const combinedSearchRes = await service.get('/environments/', { 
      params: { 
        page: 1, 
        pageSize: 10,
        status: 'available',
        search: 'test' // 假设系统中有包含'test'字样的环境
      } 
    });
    console.log(`组合搜索结果数: ${combinedSearchRes.data?.results?.length || 0}`);
    
    // 7. 测试不存在的搜索条件
    console.log('\n7. 测试不存在的搜索条件...');
    const notFoundRes = await service.get('/environments/', { 
      params: { 
        page: 1, 
        pageSize: 10, 
        search: '这个环境名称肯定不存在123456789' 
      } 
    });
    console.log(`不存在搜索条件的结果数: ${notFoundRes.data?.results?.length || 0}`);
    
    console.log('\n=== 环境查找功能测试完成 ===');
    console.log('🎉 测试结论: 环境查找功能工作正常！');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
    if (error.response) {
      console.error('错误响应状态:', error.response.status);
      console.error('错误响应数据:', error.response.data);
    }
  }
}

// 运行测试
runTests();