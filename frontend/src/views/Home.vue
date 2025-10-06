<template>
  <div class="home-container">
    <el-card class="welcome-card">
      <template #header>
        <div class="card-header">
          <span>欢迎使用 AutoTestWeb - 芯片验证防护网</span>
        </div>
      </template>
      <div class="welcome-content">
        <p class="welcome-text">AutoTestWeb 是一款专业的芯片验证自动化平台，帮助您高效管理验证环境、执行验证任务并查看验证结果。</p>
        
        <!-- 快速访问卡片 -->
        <div class="quick-access">
          <h3>快速访问</h3>
          <div class="quick-access-cards">
            <el-card class="access-card" @click="handleNavigate('env/list')">
              <div class="card-icon"><el-icon><setting /></el-icon></div>
              <div class="card-title">环境管理</div>
              <div class="card-desc">管理和配置验证环境</div>
            </el-card>
            <el-card class="access-card" @click="handleNavigate('task/add')">
              <div class="card-icon"><el-icon><plus /></el-icon></div>
              <div class="card-title">新增任务</div>
              <div class="card-desc">创建新的验证任务</div>
            </el-card>
            <el-card class="access-card" @click="handleNavigate('task/list')">
              <div class="card-icon"><el-icon><list /></el-icon></div>
              <div class="card-title">任务列表</div>
              <div class="card-desc">查看和管理所有任务</div>
            </el-card>
            <el-card class="access-card" @click="handleNavigate('report')">
              <div class="card-icon"><el-icon><document /></el-icon></div>
              <div class="card-title">报表中心</div>
              <div class="card-desc">查看验证报表和统计</div>
            </el-card>
          </div>
        </div>
        
        <!-- 系统概览 -->
        <div class="system-overview">
          <h3>系统概览</h3>
          <div class="overview-stats">
            <el-statistic class="stat-item" :value="12" suffix="个" label="活跃环境" />
            <el-statistic class="stat-item" :value="86" suffix="个" label="已完成任务" />
            <el-statistic class="stat-item" :value="98.5" suffix="%" label="成功率" precision="1" />
            <el-statistic class="stat-item" :value="2.5" suffix="小时" label="平均执行时间" precision="1" />
          </div>
        </div>
        
        <!-- 最近活动 -->
        <div class="recent-activities">
          <h3>最近活动</h3>
          <el-table :data="recentTasks" style="width: 100%">
            <el-table-column prop="name" label="任务名称" width="200" />
            <el-table-column prop="env" label="环境" width="120" />
            <el-table-column prop="status" label="状态" width="80">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startTime" label="开始时间" width="180" />
            <el-table-column prop="endTime" label="结束时间" width="180" />
            <el-table-column prop="duration" label="耗时" width="80" />
            <el-table-column label="操作" width="100" fixed="right">
              <template #default="scope">
                <el-button
                  type="text"
                  size="small"
                  @click="handleViewTask(scope.row.id)"
                >
                  查看
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { Setting, Plus, List, Document } from '@element-plus/icons-vue'

export default {
  name: 'Home',
  components: {
    Setting,
    Plus,
    List,
    Document
  },
  setup() {
    const router = useRouter()
    
    // 最近任务数据（模拟）
    const recentTasks = ref([
      {
        id: '1',
        name: '芯片功能测试',
        env: '测试环境1',
        status: '成功',
        startTime: '2023-10-01 10:30:00',
        endTime: '2023-10-01 12:45:30',
        duration: '2h15m'
      },
      {
        id: '2',
        name: '性能压力测试',
        env: '测试环境2',
        status: '成功',
        startTime: '2023-09-30 14:20:00',
        endTime: '2023-09-30 16:10:25',
        duration: '1h50m'
      },
      {
        id: '3',
        name: '兼容性测试',
        env: '测试环境1',
        status: '失败',
        startTime: '2023-09-29 09:00:00',
        endTime: '2023-09-29 10:20:15',
        duration: '1h20m'
      },
      {
        id: '4',
        name: '安全漏洞扫描',
        env: '测试环境3',
        status: '成功',
        startTime: '2023-09-28 16:30:00',
        endTime: '2023-09-28 18:45:00',
        duration: '2h15m'
      }
    ])
    
    // 根据状态获取标签类型
    const getStatusType = (status) => {
      if (status === '成功') return 'success'
      if (status === '失败') return 'danger'
      if (status === '运行中') return 'warning'
      return 'info'
    }
    
    // 处理导航
    const handleNavigate = (path) => {
      router.push(path)
    }
    
    // 查看任务详情
    const handleViewTask = (taskId) => {
      router.push(`/task/detail/${taskId}`)
    }
    
    return {
      recentTasks,
      getStatusType,
      handleNavigate,
      handleViewTask
    }
  }
}
</script>

<style scoped>
.home-container {
  width: 100%;
}

.welcome-card {
  width: 100%;
}

.welcome-content {
  padding: 20px 0;
}

.welcome-text {
  font-size: 16px;
  color: #666;
  margin-bottom: 30px;
  line-height: 1.6;
}

.quick-access,
.system-overview,
.recent-activities {
  margin-bottom: 30px;
}

.quick-access h3,
.system-overview h3,
.recent-activities h3 {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 15px;
  color: #333;
}

.quick-access-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.access-card {
  cursor: pointer;
  transition: all 0.3s ease;
  height: 120px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.access-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.card-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 10px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 5px;
  color: #333;
}

.card-desc {
  font-size: 12px;
  color: #666;
}

.overview-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.recent-activities .el-table {
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}
</style>