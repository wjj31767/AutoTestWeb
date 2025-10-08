<template>
  <div class="app-container">
    <!-- 顶部导航栏 -->
    <header class="top-navbar">
      <div class="navbar-content">
        <div class="logo">
          <span>AutoTestWeb - 芯片验证防护网</span>
        </div>
        <div class="user-info">
          <el-dropdown @command="handleUserCommand">
            <span class="el-dropdown-link">
              <el-avatar class="user-avatar">
                <img src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" alt="用户头像" />
              </el-avatar>
              <span class="user-name">{{ currentUserName }}</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人信息</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
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
          <el-menu-item index="/">
            <el-icon><house /></el-icon>
            <span>首页</span>
          </el-menu-item>
          <el-menu-item index="/env/list">
            <el-icon><setting /></el-icon>
            <span>环境管理</span>
          </el-menu-item>
          <el-menu-item index="/test-suite/list">
            <el-icon><collection /></el-icon>
            <span>测试套管理</span>
          </el-menu-item>
          <el-menu-item index="/task/add">
            <el-icon><plus /></el-icon>
            <span>新增执行任务</span>
          </el-menu-item>
          <el-menu-item index="/task/list">
            <el-icon><list /></el-icon>
            <span>任务列表</span>
          </el-menu-item>
          <el-menu-item index="/report">
            <el-icon><document /></el-icon>
            <span>报表中心</span>
          </el-menu-item>
          <el-menu-item index="/module/list">
            <el-icon><setting /></el-icon>
            <span>模块管理</span>
          </el-menu-item>
          <el-menu-item index="/feature-testcase/list">
            <el-icon><collection /></el-icon>
            <span>特性测试用例管理</span>
          </el-menu-item>
          <el-menu-item index="/settings">
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
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  House, 
  Setting, 
  Plus, 
  List, 
  Document, 
  ArrowDown, 
  Collection 
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from './api/axios'

export default {
  name: 'App',
  components: {
    House,
    Setting,
    Plus,
    List,
    Document,
    ArrowDown,
    Collection
  },
  setup() {
    const route = useRoute()
    const router = useRouter()
    const currentUserName = ref('管理员')
    const currentUserInfo = ref({})
    
    // 从本地存储获取用户信息
    const getUserInfoFromStorage = () => {
      const userInfoStr = localStorage.getItem('userInfo')
      if (userInfoStr) {
        try {
          const userInfo = JSON.parse(userInfoStr)
          currentUserInfo.value = userInfo
          currentUserName.value = userInfo.username || '管理员'
        } catch (e) {
          console.error('解析用户信息失败:', e)
        }
      }
    }
    
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
    
    // 处理用户下拉菜单命令
    const handleUserCommand = async (command) => {
      switch (command) {
        case 'profile':
          await getUserProfile()
          break
        case 'password':
          showChangePasswordDialog()
          break
        case 'logout':
          confirmLogout()
          break
      }
    }
    
    // 获取用户信息
    const getUserProfile = async () => {
      try {
        // 发送请求获取用户信息
        const response = await axios.get('/user/profile/')
        currentUserInfo.value = response.data
        currentUserName.value = response.data.username || '管理员'
        
        // 显示用户信息
        ElMessage.success('获取用户信息成功')
        // 这里可以根据需要显示用户信息对话框
        ElMessageBox.alert(
          `<div style="text-align: left;">
            <p><strong>用户名:</strong> ${currentUserInfo.value.username}</p>
            <p><strong>邮箱:</strong> ${currentUserInfo.value.email || '未设置'}</p>
            <p><strong>角色:</strong> ${currentUserInfo.value.is_superuser ? '超级管理员' : '普通用户'}</p>
          </div>`,
          '个人信息',
          {
            dangerouslyUseHTMLString: true,
            confirmButtonText: '确定'
          }
        )
      } catch (error) {
        console.error('获取用户信息失败:', error)
        ElMessage.error('获取用户信息失败，请重试')
      }
    }
    
    // 显示修改密码对话框
    const showChangePasswordDialog = () => {
      // 创建一个简单的修改密码表单
      const passwordForm = `
        <div>
          <el-input v-model="oldPassword" type="password" placeholder="当前密码" style="margin-bottom: 10px;"></el-input>
          <el-input v-model="newPassword" type="password" placeholder="新密码" style="margin-bottom: 10px;"></el-input>
          <el-input v-model="confirmPassword" type="password" placeholder="确认新密码"></el-input>
        </div>
      `
      
      ElMessageBox.alert(
        passwordForm,
        '修改密码',
        {
          dangerouslyUseHTMLString: true,
          showCancelButton: true,
          confirmButtonText: '保存',
          cancelButtonText: '取消',
          beforeClose: async (action, instance, done) => {
            if (action === 'confirm') {
              // 实际项目中应该在这里获取输入的密码并验证
              const oldPassword = instance.$el.querySelector('[v-model="oldPassword"]')?.value
              const newPassword = instance.$el.querySelector('[v-model="newPassword"]')?.value
              const confirmPassword = instance.$el.querySelector('[v-model="confirmPassword"]')?.value
              
              // 简单验证
              if (!oldPassword || !newPassword) {
                ElMessage.error('请填写所有密码字段')
                return
              }
              
              if (newPassword !== confirmPassword) {
                ElMessage.error('两次输入的新密码不一致')
                return
              }
              
              try {
                // 发送修改密码请求
                await axios.post('/user/change-password/', {
                  old_password: oldPassword,
                  new_password: newPassword,
                  confirm_password: confirmPassword
                })
                ElMessage.success('密码修改成功')
                done()
              } catch (error) {
                console.error('修改密码失败:', error)
                ElMessage.error('修改密码失败，请重试')
              }
            } else {
              done()
            }
          }
        }
      )
    }
    
    // 确认退出登录
    const confirmLogout = () => {
      ElMessageBox.confirm(
        '确定要退出登录吗？',
        '退出登录',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          // 发送退出登录请求
          await axios.post('/user/logout/')
          
          // 清除本地存储的token和用户信息
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          
          // 重置用户信息
          currentUserInfo.value = {}
          currentUserName.value = '管理员'
          
          // 重定向到登录页面
          router.push('/login')
          
          ElMessage.success('退出登录成功')
        } catch (error) {
          console.error('退出登录失败:', error)
          // 即使请求失败，也清除token和用户信息
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          currentUserInfo.value = {}
          currentUserName.value = '管理员'
          router.push('/login')
          ElMessage.success('已退出登录')
        }
      }).catch(() => {
        // 用户取消退出
      })
    }
    
    // 页面加载时获取用户信息
    onMounted(() => {
      // 从本地存储获取用户信息
      getUserInfoFromStorage()
      
      // 如果本地没有用户信息，尝试从服务器获取
      if (!currentUserInfo.value.username) {
        const token = localStorage.getItem('token')
        if (token) {
          getUserProfile()
        }
      }
    })
    
    return {
      activeMenu,
      handleMenuSelect,
      handleUserCommand,
      currentUserName
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