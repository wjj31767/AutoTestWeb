import { createRouter, createWebHistory } from 'vue-router'

// 懒加载路由组件
const Home = () => import('../views/Home.vue')
const EnvList = () => import('../views/EnvList.vue')
const AddTask = () => import('../views/AddTask.vue')
const TaskDetail = () => import('../views/TaskDetail.vue')

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/env/list',
    name: 'EnvList',
    component: EnvList,
    meta: {
      title: '环境列表'
    }
  },
  {
    path: '/task/add',
    name: 'AddTask',
    component: AddTask,
    meta: {
      title: '新增执行任务'
    }
  },
  {
    path: '/task/detail/:id',
    name: 'TaskDetail',
    component: TaskDetail,
    meta: {
      title: '任务结果详情'
    }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫，设置页面标题
router.beforeEach((to, from, next) => {
  if (to.meta.title) {
    document.title = to.meta.title + ' - AutoTestWeb'
  } else {
    document.title = 'AutoTestWeb - 芯片验证防护网'
  }
  next()
})

export default router