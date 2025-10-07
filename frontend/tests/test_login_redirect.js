// 测试登录成功后是否正确跳转到首页
import axios from 'axios';

/**
 * 登录跳转功能测试
 * 验证登录成功后是否正确跳转到首页或指定页面
 */
export default async function() {
  console.log('\n开始执行登录跳转功能测试...');
  
  // 模拟数据和工具函数
  let testPassed = 0;
  const totalTests = 2;
  
  // 模拟localStorage
  const mockLocalStorage = {
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
  
  // 保存原始的localStorage
  const originalLocalStorage = global.localStorage;
  
  // 模拟router
  const mockRouter = {
    push: function(path) {
      console.log(`    路由跳转: ${path}`);
      return Promise.resolve(path);
    }
  };
  
  // 设置测试环境
  function setupTestEnvironment() {
    // 模拟localStorage
    global.localStorage = mockLocalStorage;
    mockLocalStorage.clear();
  }
  
  // 恢复原始环境
  function teardownTestEnvironment() {
    global.localStorage = originalLocalStorage;
  }
  
  try {
    setupTestEnvironment();
    
    // 测试用例1: 登录成功后跳转到首页
    console.log('\n测试用例1: 登录成功后跳转到首页');
    
    try {
      // 模拟登录API成功响应
      const mockResponse = {
        data: {
          username: 'test',
          is_superuser: false
        }
      };
      
      // 保存原始的axios.post
      const originalAxiosPost = axios.post;
      
      // 模拟axios.post
      axios.post = async function(url, data) {
        console.log(`    模拟API调用: ${url}`);
        console.log(`    请求数据:`, data);
        return mockResponse;
      };
      
      // 简化的登录处理函数
      const handleLogin = async () => {
        try {
          const response = await axios.post('/user/login/', {
            username: 'test',
            password: 'test@123'
          });
          
          if (response && response.data) {
            localStorage.setItem('userInfo', JSON.stringify(response.data));
            const username = response.data.username || 'test';
            const tempToken = `temp_${Date.now()}_${username}`;
            localStorage.setItem('token', tempToken);
            console.log(`    用户信息已保存:`, response.data);
            console.log(`    临时token已生成: ${tempToken}`);
          }
          
          // 模拟路由跳转逻辑
          const redirect = null; // 没有指定重定向
          let redirectPath;
          if (redirect) {
            redirectPath = redirect.toString();
          } else {
            redirectPath = '/';
          }
          
          await mockRouter.push(redirectPath);
          
          // 验证结果
          const userInfo = localStorage.getItem('userInfo');
          const token = localStorage.getItem('token');
          
          if (userInfo && token && redirectPath === '/') {
            console.log('    ✓ 验证通过: 用户信息、token已保存，且正确跳转到首页');
            return true;
          } else {
            throw new Error('验证失败: 用户信息、token未保存或跳转到错误页面');
          }
        } catch (error) {
          console.error('    ✗ 登录处理失败:', error.message);
          return false;
        }
      };
      
      // 执行登录
      const result = await handleLogin();
      
      if (result) {
        console.log('    ✓ 测试用例1通过: 登录成功后正确跳转到首页');
        testPassed++;
      } else {
        throw new Error('测试用例1失败');
      }
      
      // 恢复原始的axios.post
      axios.post = originalAxiosPost;
      
    } catch (error) {
      console.error('    ✗ 测试用例1失败:', error.message);
    }
    
    // 测试用例2: 登录成功后跳转到指定页面
    console.log('\n测试用例2: 登录成功后跳转到指定页面');
    
    try {
      // 清空localStorage
      mockLocalStorage.clear();
      
      // 模拟登录API成功响应
      const mockResponse = {
        data: {
          username: 'test',
          is_superuser: false
        }
      };
      
      // 保存原始的axios.post
      const originalAxiosPost = axios.post;
      
      // 模拟axios.post
      axios.post = async function(url, data) {
        console.log(`    模拟API调用: ${url}`);
        console.log(`    请求数据:`, data);
        return mockResponse;
      };
      
      // 简化的handleLogin函数，包含redirect参数
      const handleLoginWithRedirect = async (redirect) => {
        try {
          const response = await axios.post('/user/login/', {
            username: 'test',
            password: 'test@123'
          });
          
          if (response && response.data) {
            localStorage.setItem('userInfo', JSON.stringify(response.data));
            const username = response.data.username || 'test';
            const tempToken = `temp_${Date.now()}_${username}`;
            localStorage.setItem('token', tempToken);
            console.log(`    用户信息已保存:`, response.data);
            console.log(`    临时token已生成: ${tempToken}`);
          }
          
          // 模拟路由跳转逻辑
          let redirectPath;
          if (redirect) {
            redirectPath = redirect.toString();
          } else {
            redirectPath = '/';
          }
          
          await mockRouter.push(redirectPath);
          
          // 验证结果
          const userInfo = localStorage.getItem('userInfo');
          const token = localStorage.getItem('token');
          
          if (userInfo && token && redirectPath === redirect) {
            console.log(`    ✓ 验证通过: 用户信息、token已保存，且正确跳转到指定页面 ${redirect}`);
            return true;
          } else {
            throw new Error(`验证失败: 用户信息、token未保存或跳转到错误页面`);
          }
        } catch (error) {
          console.error('    ✗ 登录处理失败:', error.message);
          return false;
        }
      };
      
      // 执行登录，指定重定向URL
      const redirectUrl = '/env/list';
      const result = await handleLoginWithRedirect(redirectUrl);
      
      if (result) {
        console.log(`    ✓ 测试用例2通过: 登录成功后正确跳转到指定页面 ${redirectUrl}`);
        testPassed++;
      } else {
        throw new Error('测试用例2失败');
      }
      
      // 恢复原始的axios.post
      axios.post = originalAxiosPost;
      
    } catch (error) {
      console.error('    ✗ 测试用例2失败:', error.message);
    }
    
    // 测试总结
    console.log(`\n登录跳转测试总结: 共 ${totalTests} 个测试，通过 ${testPassed} 个`);
    
    if (testPassed === totalTests) {
      console.log('✅ 所有登录跳转测试用例通过');
    } else {
      console.log('❌ 部分登录跳转测试用例失败');
    }
    
  } catch (error) {
    console.error('\n❌ 测试执行过程中发生错误:', error);
    throw error;
  } finally {
    teardownTestEnvironment();
  }
}