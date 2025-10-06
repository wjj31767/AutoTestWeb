<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-navbar">
      <div class="navbar-content">
        <div class="logo">
          <span>AutoTestWeb - 芯片验证防护网</span>
        </div>
        <div class="user-info">
          <el-dropdown>
            <span class="el-dropdown-link">
              <el-avatar class="user-avatar">
                <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" alt="用户头像" />
              </el-avatar>
              <span class="user-name">管理员</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item>个人信息</el-dropdown-item>
                <el-dropdown-item>修改密码</el-dropdown-item>
                <el-dropdown-item divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </header>
    
    <!-- 主体内容区 -->
    <div class="main-content">
      <!-- 左侧侧边栏 -->
      <aside class="side-menu">
        <el-menu
          :default-active="activeMenu"
          class="el-menu-vertical-dark"
          background-color="#1f2937"
          text-color="#e5e7eb"
          active-text-color="#ffffff"
          @select="handleMenuSelect"
        >
          <el-menu-item index="home">
            <el-icon><house /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="env/list">
            <el-icon><setting /></el-icon>
            <span>环境管理</span>
          </el-menu-item>
          <el-menu-item index="task/add">
            <el-icon><plus /></el-icon>
            <span>新增任务</span>
          </el-menu-item>
          <el-menu-item index="task/list">
            <el-icon><list /></el-icon>
            <span>任务列表</span>
          </el-menu-item>
          <el-menu-item index="report">
            <el-icon><document /></el-icon>
            <span>报表中心</span>
          </el-menu-item>
          <el-menu-item index="settings">
            <el-icon><setting /></el-icon>
            <span>系统设置</span>
          </el-menu-item>
        </el-menu>
      </aside>
      
      <!-- 中间内容区 -->
      <div class="content-wrapper">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { 
  House, 
  Setting, 
  Plus, 
  List, 
  Document, 
  ArrowDown 
} from '@element-plus/icons-vue'

export default {
  name: 'App',
  components: {
    House,
    Setting,
    Plus,
    List,
    Document,
    ArrowDown
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    
    // 当前激活的菜单
    const activeMenu = computed(() => {
      return route.path === '/' ? 'home' : route.path
    })
    
    // 处理菜单选择
    const handleMenuSelect = (index) => {
      if (index === 'home') {
        router.push('/')
      } else {
        router.push(index)
      }
    }
    
    return {
      activeMenu,
      handleMenuSelect
    }
  }
}
</script>

<style>
/* 全局样式重置 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  color: #333;
  background-color: #f5f5f5;
}

/* 应用容器 */
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

/* 顶部导航栏 */
.top-navbar {
  height: 60px;
  background-color: #ffffff;
  border-bottom: 1px solid #e0e0e0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 1000;
}

.navbar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 100%;
  padding: 0 20px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo img {
  height: 32px;
}

.logo span {
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 10px;
}

.user-avatar {
  width: 36px;
  height: 36px;
}

.user-name {
  font-size: 14px;
  color: #666;
}

/* 主体内容区 */
.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

/* 左侧侧边栏 */
.side-menu {
  width: 200px;
  background-color: #1f2937;
  overflow-y: auto;
}

.side-menu .el-menu-vertical-dark {
  height: 100%;
  border-right: none;
}

/* 中间内容区 */
.content-wrapper {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
  background-color: #f9fafb;
}
</style>