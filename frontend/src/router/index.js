import { createRouter, createWebHistory } from 'vue-router'

// 懒加载路由组件
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/Login.vue')
const EnvList = () => import('../views/EnvList.vue')
const AddTask = () => import('../views/AddTask.vue')
const TaskDetail = () => import('../views/TaskDetail.vue')

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: Login,
    meta: {
      title: '登录',
      requiresAuth: false
    }
  },
  {
    path: '/',
    name: 'Home',
    component: Home,
    meta: {
      requiresAuth: true
    }
  },
  {
    path: '/env/list',
    name: 'EnvList',
    component: EnvList,
    meta: {
      title: '环境列表',
      requiresAuth: true
    }
  },
  {
    path: '/task/add',
    name: 'AddTask',
    component: AddTask,
    meta: {
      title: '新增执行任务',
      requiresAuth: true
    }
  },
  {
    path: '/task/detail/:id',
    name: 'TaskDetail',
    component: TaskDetail,
    meta: {
      title: '任务结果详情',
      requiresAuth: true
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，设置页面标题和身份验证
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title + ' - AutoTestWeb'
  } else {
    document.title = 'AutoTestWeb - 芯片验证防护网'
  }
  
  // 检查是否需要身份验证
  if (to.meta.requiresAuth !== false) {
    // 默认需要身份验证
    const token = localStorage.getItem('token')
    if (!token) {
      // 未登录，重定向到登录页面
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  
  next()
})

export default router