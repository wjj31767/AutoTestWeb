import { createRouter, createWebHistory } from 'vue-router'

// 懒加载路由组件
const Home = () => import('../views/Home.vue')
const Login = () => import('../views/Login.vue')
const EnvList = () => import('../views/EnvList.vue')
const AddTask = () => import('../views/AddTask.vue')
const TaskDetail = () => import('../views/TaskDetail.vue')
const TaskList = () => import('../views/TaskList.vue')
const TestSuiteList = () => import('../views/TestSuiteList.vue')
const ModuleList = () => import('../views/ModuleList.vue')
const FeatureTestCaseList = () => import('../views/FeatureTestCaseList.vue')

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
    path: '/task/list',
    name: 'TaskList',
    component: TaskList,
    meta: {
      title: '执行任务列表',
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
  },
  {
    path: '/test-suite/list',
    name: 'TestSuiteList',
    component: TestSuiteList,
    meta: {
      title: '测试套列表',
      requiresAuth: true
    }
  },
  {
    path: '/module/list',
    name: 'ModuleList',
    component: ModuleList,
    meta: {
      title: '模块管理',
      requiresAuth: true
    }
  },
  {
    path: '/feature-testcase/list',
    name: 'FeatureTestCaseList',
    component: FeatureTestCaseList,
    meta: {
      title: '特性测试用例管理',
      requiresAuth: true
    }
  },
  // 为了兼容App.vue中的菜单配置，添加index前缀的路由重定向
  {
    path: '/index/task/list',
    redirect: '/task/list'
  },
  // 如果有其他index前缀的路由也需要重定向，可以在这里添加
  {
    path: '/index/task/add',
    redirect: '/task/add'
  },
  {
    path: '/index/task/detail/:id',
    redirect: '/task/detail/:id'
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