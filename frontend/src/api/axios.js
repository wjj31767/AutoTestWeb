import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '../router'

// 创建axios实例
const service = axios.create({
  baseURL: '/api',
  timeout: 10000,
  withCredentials: true, // 允许携带cookie
});

// 从cookie中获取CSRF token的函数
function getCSRFToken() {
  const cookieValue = document.cookie
    .split('; ') 
    .find(row => row.startsWith('csrftoken='))
    ?.split('=')[1];
  return cookieValue || '';
}

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    // 从localStorage获取token
    const token = localStorage.getItem('token');
    
    if (token) {
      // 如果有token，添加到请求头
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 添加CSRF token到请求头（仅对非GET请求）
    if (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase())) {
      const csrfToken = getCSRFToken();
      if (csrfToken) {
        config.headers['X-CSRFToken'] = csrfToken;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
service.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // 处理错误
    if (error.response?.status === 401) {
      ElMessage.error('登录状态已过期，请重新登录');
      localStorage.removeItem('token');
      localStorage.removeItem('userInfo');
      window.location.href = '/login';
    } else {
      ElMessage.error(`请求失败: ${error.response?.data?.detail || error.message || '未知错误'}`);
    }
    
    return Promise.reject(error);
  }
);

export default service