<template>
  <div class="task-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>执行任务列表</span>
          <el-button type="primary" @click="handleAddTask">新增任务</el-button>
        </div>
      </template>

      <!-- 搜索和筛选 -->
      <div class="search-filter">
        <el-form :inline="true" :model="searchForm" class="search-form">
          <el-form-item label="任务名称">
            <el-input v-model="searchForm.name" placeholder="请输入任务名称" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="执行状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 120px;">
              <el-option label="全部" value="" />
              <el-option label="等待执行" value="pending" />
              <el-option label="运行中" value="running" />
              <el-option label="已暂停" value="paused" />
              <el-option label="已终止" value="terminated" />
              <el-option label="执行成功" value="success" />
              <el-option label="执行失败" value="failed" />
            </el-select>
          </el-form-item>
          <el-form-item label="测试环境">
            <el-select v-model="searchForm.env_id" placeholder="请选择环境" style="width: 150px;">
              <el-option label="全部" value="" />
              <el-option v-for="env in environments" :key="env.id" :label="env.name" :value="env.id" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 任务列表 -->
      <div class="task-table">
        <el-table v-loading="loading" :data="taskList" style="width: 100%">
          <el-table-column prop="id" label="任务ID" width="120" />
          <el-table-column prop="name" label="任务名称" min-width="200">
            <template #default="scope">
              <el-link :underline="false" @click="handleViewTask(scope.row.id)">{{ scope.row.package_info || scope.row.id }}</el-link>
            </template>
          </el-table-column>
          <el-table-column label="测试环境" width="150">
            <template #default="scope">
              {{ getEnvironmentName(scope.row.env_id) }}
            </template>
          </el-table-column>
          <el-table-column label="执行状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">{{ getStatusText(scope.row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开始时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.start_time) }}
            </template>
          </el-table-column>
          <el-table-column label="结束时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.end_time) }}
            </template>
          </el-table-column>
          <el-table-column label="总用例数" width="100" prop="total_case" />
          <el-table-column label="操作" width="150" fixed="right">
            <template #default="scope">
              <el-button size="small" @click="handleViewTask(scope.row.id)">查看</el-button>
              <el-button size="small" type="danger" @click="handleDeleteTask(scope.row.id)" :disabled="scope.row.status === 'running'">{{ scope.row.status === 'running' ? '运行中' : '删除' }}</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="pagination.currentPage"
          v-model:page-size="pagination.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { getTaskExecutionList, deleteTaskExecution } from '../api/taskExecution.js'
import { getEnvironmentList } from '../api/env.js'
import router from '../router/index'

export default {
  name: 'TaskList',
  setup() {
    // 任务列表数据
    const taskList = ref([])
    // 环境列表
    const environments = ref([])
    // 加载状态
    const loading = ref(false)
    // 搜索表单
    const searchForm = reactive({
      name: '',
      status: '',
      env_id: ''
    })
    // 分页数据
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })

    // 获取任务列表
    const loadTaskList = async () => {
      loading.value = true
      try {
        const params = {
          ...searchForm,
          page: pagination.currentPage,
          pageSize: pagination.pageSize
        }
        const response = await getTaskExecutionList(params)
        
        // 适配后端返回的数据结构
        taskList.value = response.data.results || []
        pagination.total = response.data.count || 0
        
        // 如果没有数据，显示模拟数据用于演示
        if (taskList.value.length === 0) {
          taskList.value = getMockTaskData()
          pagination.total = taskList.value.length
        }
      } catch (error) {
        console.error('获取任务列表失败:', error)
        ElMessage.error('获取任务列表失败')
        
        // 出错时显示模拟数据
        taskList.value = getMockTaskData()
        pagination.total = taskList.value.length
      } finally {
        loading.value = false
      }
    }

    // 获取环境列表
    const loadEnvironments = async () => {
      try {
        const response = await getEnvironmentList({ page: 1, pageSize: 100 })
        environments.value = response.data.results || []
      } catch (error) {
        console.error('获取环境列表失败:', error)
        
        // 出错时显示模拟环境数据
        environments.value = [
          { id: 'env-1', name: '测试环境1' },
          { id: 'env-2', name: '测试环境2' },
          { id: 'env-3', name: '测试环境3' }
        ]
      }
    }

    // 获取环境名称
    const getEnvironmentName = (envId) => {
      const env = environments.value.find(item => item.id === envId)
      return env ? env.name : '未知环境'
    }

    // 根据状态获取标签类型
    const getStatusType = (status) => {
      switch (status) {
        case 'success':
          return 'success'
        case 'failed':
          return 'danger'
        case 'running':
          return 'warning'
        case 'pending':
        case 'paused':
        case 'terminated':
          return 'info'
        default:
          return 'default'
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'pending': '等待执行',
        'running': '运行中',
        'paused': '已暂停',
        'terminated': '已终止',
        'success': '执行成功',
        'failed': '执行失败'
      }
      return statusMap[status] || status
    }

    // 格式化日期时间
    const formatDateTime = (datetime) => {
      if (!datetime) return '-'
      // 假设datetime已经是格式化好的字符串或者Date对象
      if (typeof datetime === 'string') {
        return datetime
      }
      return new Date(datetime).toLocaleString('zh-CN')
    }

    // 生成模拟任务数据
    const getMockTaskData = () => {
      const statuses = ['success', 'failed', 'running', 'pending', 'terminated']
      const mockData = []
      
      for (let i = 1; i <= 5; i++) {
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
        const now = new Date()
        const startDate = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000)
        const endDate = randomStatus === 'success' || randomStatus === 'failed' ? 
          new Date(startDate.getTime() + Math.random() * 3 * 60 * 60 * 1000) : null
        
        mockData.push({
          id: `task-${1000 + i}`,
          suite_id: 'suite-1',
          env_id: `env-${(i % 3) + 1}`,
          package_info: `测试任务${i}`,
          status: randomStatus,
          start_time: startDate.toLocaleString('zh-CN'),
          end_time: endDate ? endDate.toLocaleString('zh-CN') : null,
          executor: 'admin',
          total_case: 100 + i * 10,
          success_case: randomStatus === 'success' ? 100 + i * 10 : randomStatus === 'failed' ? Math.floor((100 + i * 10) * 0.8) : 0,
          create_time: now.toLocaleString('zh-CN')
        })
      }
      
      return mockData
    }

    // 处理搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadTaskList()
    }

    // 重置搜索
    const resetSearch = () => {
      searchForm.name = ''
      searchForm.status = ''
      searchForm.env_id = ''
      pagination.currentPage = 1
      loadTaskList()
    }

    // 处理新增任务
    const handleAddTask = () => {
      router.push('/task/add')
    }

    // 处理查看任务
    const handleViewTask = (taskId) => {
      router.push(`/task/detail/${taskId}`)
    }

    // 处理删除任务
    const handleDeleteTask = async (taskId) => {
      try {
        await ElMessageBox.confirm('确定要删除这个任务吗？删除后将无法恢复。', '确认删除', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        })
        
        await deleteTaskExecution(taskId)
        ElMessage.success('任务删除成功')
        loadTaskList()
      } catch (error) {
        if (error !== 'cancel') {
          console.error('删除任务失败:', error)
          ElMessage.error('删除任务失败')
        }
      }
    }

    // 处理分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadTaskList()
    }

    // 处理当前页码变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadTaskList()
    }

    // 组件挂载时加载数据
    onMounted(() => {
      loadEnvironments()
      loadTaskList()
    })

    return {
      taskList,
      environments,
      loading,
      searchForm,
      pagination,
      loadTaskList,
      getEnvironmentName,
      getStatusType,
      getStatusText,
      formatDateTime,
      handleSearch,
      resetSearch,
      handleAddTask,
      handleViewTask,
      handleDeleteTask,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.task-list-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-filter {
  margin-bottom: 20px;
}

.task-table {
  margin-bottom: 20px;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}
</style>