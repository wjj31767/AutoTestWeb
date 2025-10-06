<template>
  <div class="task-detail-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>任务结果详情</span>
          <el-button-group class="header-actions">
            <el-button @click="handleRefresh">刷新</el-button>
            <el-button @click="handleReExecute">重新执行</el-button>
            <el-button @click="handleExport">导出结果</el-button>
          </el-button-group>
        </div>
      </template>

      <!-- 任务基础信息区 -->
      <div class="task-basic-info">
        <el-descriptions border column="3" :size="'small'" :title="'任务基本信息'">
          <el-descriptions-item label="任务ID">{{ taskInfo.id }}</el-descriptions-item>
          <el-descriptions-item label="任务名称">{{ taskInfo.name }}</el-descriptions-item>
          <el-descriptions-item label="执行状态">
            <el-tag :type="getStatusType(taskInfo.status)">{{ taskInfo.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="测试环境">{{ taskInfo.environment }}</el-descriptions-item>
          <el-descriptions-item label="测试用例集">{{ taskInfo.testSuite }}</el-descriptions-item>
          <el-descriptions-item label="执行模式">{{ taskInfo.executionMode }}</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ taskInfo.startTime }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ taskInfo.endTime || '-' }}</el-descriptions-item>
          <el-descriptions-item label="总耗时">{{ taskInfo.duration || '-' }}</el-descriptions-item>
          <el-descriptions-item label="执行人">{{ taskInfo.executor }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ taskInfo.createTime }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ taskInfo.updateTime }}</el-descriptions-item>
        </el-descriptions>

        <el-descriptions border column="1" :size="'small'" :title="'任务描述'" class="task-description">
          <el-descriptions-item>{{ taskInfo.description || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>

      <!-- 结果统计区 -->
      <div class="task-stats">
        <el-row :gutter="20">
          <el-col :span="6">
            <el-card class="stat-card total">
              <div class="stat-content">
                <div class="stat-number">{{ stats.total }}</div>
                <div class="stat-label">总用例数</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card success">
              <div class="stat-content">
                <div class="stat-number">{{ stats.success }}</div>
                <div class="stat-label">成功用例</div>
                <div class="stat-percent">{{ getPercent(stats.success) }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card failed">
              <div class="stat-content">
                <div class="stat-number">{{ stats.failed }}</div>
                <div class="stat-label">失败用例</div>
                <div class="stat-percent">{{ getPercent(stats.failed) }}%</div>
              </div>
            </el-card>
          </el-col>
          <el-col :span="6">
            <el-card class="stat-card skipped">
              <div class="stat-content">
                <div class="stat-number">{{ stats.skipped }}</div>
                <div class="stat-label">跳过用例</div>
                <div class="stat-percent">{{ getPercent(stats.skipped) }}%</div>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 图表展示区 -->
      <div class="chart-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>执行结果分布</span>
            </div>
          </template>
          <div class="chart-container">
            <!-- 这里应该是图表，由于没有引入echarts，暂时用模拟内容代替 -->
            <div class="chart-placeholder">
              <p>执行结果分布图</p>
              <div class="chart-mock">
                <div class="chart-bar success" style="width: 75%;"></div>
                <div class="chart-bar failed" style="width: 15%;"></div>
                <div class="chart-bar skipped" style="width: 10%;"></div>
              </div>
              <div class="chart-legend">
                <span><span class="legend-color success"></span>成功: 75%</span>
                <span><span class="legend-color failed"></span>失败: 15%</span>
                <span><span class="legend-color skipped"></span>跳过: 10%</span>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- 用例执行结果列表 -->
      <div class="test-cases-section">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>用例执行结果</span>
              <el-button-group class="header-actions">
                <el-select v-model="caseFilter" placeholder="筛选结果" size="small">
                  <el-option label="全部" value="all" />
                  <el-option label="成功" value="success" />
                  <el-option label="失败" value="failed" />
                  <el-option label="跳过" value="skipped" />
                </el-select>
                <el-input v-model="caseSearch" placeholder="搜索用例名称" size="small" style="width: 200px;" />
                <el-button @click="handleCaseSearch" size="small">搜索</el-button>
              </el-button-group>
            </div>
          </template>
          <el-table
            v-loading="loading"
            :data="filteredTestCases"
            style="width: 100%"
            @row-dblclick="handleCaseDblClick"
          >
            <el-table-column prop="id" label="用例ID" width="80" />
            <el-table-column prop="name" label="用例名称" />
            <el-table-column prop="module" label="所属模块" width="120" />
            <el-table-column prop="status" label="执行结果" width="80">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.status)">{{ scope.row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="duration" label="耗时(ms)" width="100" />
            <el-table-column prop="startTime" label="开始时间" width="180" />
            <el-table-column prop="endTime" label="结束时间" width="180" />
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="scope">
                <el-button
                  type="primary"
                  size="small"
                  @click="handleViewCaseDetail(scope.row)"
                >
                  详情
                </el-button>
                <el-button
                  type="text"
                  size="small"
                  @click="handleViewLogs(scope.row)"
                >
                  日志
                </el-button>
              </template>
            </el-table-column>
          </el-table>

          <div class="pagination">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="filteredTestCases.length"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </el-card>

    <!-- 用例详情对话框 -->
    <el-dialog
      v-model="caseDetailVisible"
      title="用例详情"
      width="700px"
      @close="handleCaseDetailClose"
    >
      <div v-if="currentCase" class="case-detail-content">
        <el-descriptions border column="2" :size="'small'">
          <el-descriptions-item label="用例ID">{{ currentCase.id }}</el-descriptions-item>
          <el-descriptions-item label="用例名称">{{ currentCase.name }}</el-descriptions-item>
          <el-descriptions-item label="所属模块">{{ currentCase.module }}</el-descriptions-item>
          <el-descriptions-item label="执行结果">
            <el-tag :type="getStatusType(currentCase.status)">{{ currentCase.status }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="耗时">{{ currentCase.duration }}ms</el-descriptions-item>
          <el-descriptions-item label="开始时间">{{ currentCase.startTime }}</el-descriptions-item>
          <el-descriptions-item label="结束时间">{{ currentCase.endTime }}</el-descriptions-item>
          <el-descriptions-item label="错误信息" v-if="currentCase.errorMessage">
            <pre class="error-message">{{ currentCase.errorMessage }}</pre>
          </el-descriptions-item>
        </el-descriptions>
        <div v-if="currentCase.screenshots && currentCase.screenshots.length > 0" class="case-screenshots">
          <p>截图：</p>
          <el-image
            v-for="(url, index) in currentCase.screenshots"
            :key="index"
            :src="url"
            :preview-src-list="currentCase.screenshots"
            fit="contain"
            style="width: 100%; height: 200px; margin-bottom: 10px;"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 日志对话框 -->
    <el-dialog
      v-model="logsVisible"
      title="执行日志"
      width="800px"
      height="600px"
      @close="handleLogsClose"
    >
      <div class="logs-content" v-if="currentLogs">
        <pre class="logs-text">{{ currentLogs }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRoute } from 'vue-router'

export default {
  name: 'TaskDetail',
  setup() {
    const route = useRoute()
    const taskId = ref(route.params.id || '1')
    
    // 任务信息
    const taskInfo = ref({
      id: taskId.value,
      name: '芯片功能测试',
      status: '成功',
      environment: '测试环境1',
      testSuite: '芯片功能测试集',
      executionMode: '并行执行',
      startTime: '2023-10-01 10:30:00',
      endTime: '2023-10-01 12:45:30',
      duration: '2h15m30s',
      executor: 'admin',
      createTime: '2023-10-01 10:25:00',
      updateTime: '2023-10-01 12:45:30',
      description: '对芯片进行全面的功能测试，包括基本功能、性能测试、边界条件测试等。'
    })
    
    // 统计数据
    const stats = ref({
      total: 100,
      success: 75,
      failed: 15,
      skipped: 10
    })
    
    // 测试用例数据
    const testCases = ref([])
    // 加载状态
    const loading = ref(false)
    // 分页数据
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 用例筛选
    const caseFilter = ref('all')
    const caseSearch = ref('')
    
    // 对话框相关
    const caseDetailVisible = ref(false)
    const logsVisible = ref(false)
    const currentCase = ref(null)
    const currentLogs = ref('')
    
    // 获取状态标签类型
    const getStatusType = (status) => {
      if (status === '成功') return 'success'
      if (status === '失败') return 'danger'
      if (status === '跳过') return 'warning'
      if (status === '运行中') return 'info'
      return 'default'
    }
    
    // 计算百分比
    const getPercent = (value) => {
      if (stats.value.total === 0) return 0
      return ((value / stats.value.total) * 100).toFixed(1)
    }
    
    // 筛选后的测试用例
    const filteredTestCases = computed(() => {
      let cases = [...testCases.value]
      
      // 筛选状态
      if (caseFilter.value !== 'all') {
        cases = cases.filter(item => {
          if (caseFilter.value === 'success') return item.status === '成功'
          if (caseFilter.value === 'failed') return item.status === '失败'
          if (caseFilter.value === 'skipped') return item.status === '跳过'
          return true
        })
      }
      
      // 搜索名称
      if (caseSearch.value) {
        const searchStr = caseSearch.value.toLowerCase()
        cases = cases.filter(item => 
          item.name.toLowerCase().includes(searchStr) ||
          item.module.toLowerCase().includes(searchStr)
        )
      }
      
      // 分页
      const start = (pagination.currentPage - 1) * pagination.pageSize
      const end = start + pagination.pageSize
      return cases.slice(start, end)
    })
    
    // 加载测试用例数据
    const loadTestCases = () => {
      loading.value = true
      
      // 模拟API请求
      setTimeout(() => {
        // 生成模拟数据
        const mockCases = []
        for (let i = 1; i <= 100; i++) {
          let status = '成功'
          let errorMessage = ''
          let screenshots = []
          
          // 75%成功，15%失败，10%跳过
          const rand = Math.random()
          if (rand < 0.15) {
            status = '失败'
            errorMessage = `断言失败: 期望值与实际值不匹配\nExpected: ${Math.floor(Math.random() * 100)}\nActual: ${Math.floor(Math.random() * 100)}`
            screenshots = ['https://picsum.photos/800/400?random=' + i]
          } else if (rand < 0.25) {
            status = '跳过'
          }
          
          mockCases.push({
            id: 'TC' + String(i).padStart(3, '0'),
            name: `测试用例${i}`,
            module: `模块${Math.floor((i - 1) / 20) + 1}`,
            status,
            duration: Math.floor(Math.random() * 1000) + 100,
            startTime: `2023-10-01 10:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            endTime: `2023-10-01 10:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`,
            errorMessage,
            screenshots
          })
        }
        
        testCases.value = mockCases
        pagination.total = mockCases.length
        loading.value = false
      }, 500)
    }
    
    // 刷新任务详情
    const handleRefresh = () => {
      ElMessage({ message: '刷新中...', type: 'info' })
      loadTestCases()
      // 实际项目中还应该重新加载任务基本信息
    }
    
    // 重新执行任务
    const handleReExecute = () => {
      ElMessageBox.confirm('确定要重新执行该任务吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        ElMessage({ message: '任务重新执行中，请稍候...', type: 'loading' })
        // 模拟重新执行请求
        setTimeout(() => {
          ElMessage({ message: '任务已重新执行', type: 'success' })
        }, 1500)
      }).catch(() => {
        ElMessage({ message: '已取消重新执行', type: 'info' })
      })
    }
    
    // 导出结果
    const handleExport = () => {
      ElMessage({ message: '结果导出中，请稍候...', type: 'info' })
      // 模拟导出请求
      setTimeout(() => {
        ElMessage({ message: '结果导出成功', type: 'success' })
      }, 1500)
    }
    
    // 分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
    }
    
    // 当前页变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
    }
    
    // 搜索用例
    const handleCaseSearch = () => {
      pagination.currentPage = 1
    }
    
    // 查看用例详情
    const handleViewCaseDetail = (caseItem) => {
      currentCase.value = { ...caseItem }
      caseDetailVisible.value = true
    }
    
    // 查看日志
    const handleViewLogs = (caseItem) => {
      // 模拟日志内容
      const mockLogs = `[${caseItem.startTime}] 开始执行用例: ${caseItem.name}\n` +
        `[${caseItem.startTime}] 初始化测试环境...\n` +
        `[${caseItem.startTime}] 准备测试数据...\n` +
        `[${caseItem.startTime}] 执行测试步骤...\n` +
        `[${caseItem.endTime}] 测试执行完成，结果: ${caseItem.status}\n` +
        `[${caseItem.endTime}] 清理测试环境...\n` +
        `[${caseItem.endTime}] 测试耗时: ${caseItem.duration}ms\n`
      
      currentLogs.value = mockLogs
      logsVisible.value = true
    }
    
    // 双击行查看详情
    const handleCaseDblClick = (row) => {
      handleViewCaseDetail(row)
    }
    
    // 关闭用例详情对话框
    const handleCaseDetailClose = () => {
      currentCase.value = null
    }
    
    // 关闭日志对话框
    const handleLogsClose = () => {
      currentLogs.value = ''
    }
    
    // 监听任务ID变化
    watch(
      () => route.params.id,
      (newId) => {
        if (newId) {
          taskId.value = newId
          // 加载新任务的详情
          loadTestCases()
        }
      }
    )
    
    // 组件挂载时的逻辑
    onMounted(() => {
      loadTestCases()
    })
    
    return {
      taskId,
      taskInfo,
      stats,
      testCases,
      loading,
      pagination,
      caseFilter,
      caseSearch,
      caseDetailVisible,
      logsVisible,
      currentCase,
      currentLogs,
      filteredTestCases,
      getStatusType,
      getPercent,
      handleRefresh,
      handleReExecute,
      handleExport,
      handleSizeChange,
      handleCurrentChange,
      handleCaseSearch,
      handleViewCaseDetail,
      handleViewLogs,
      handleCaseDblClick,
      handleCaseDetailClose,
      handleLogsClose
    }
  }
}
</script>

<style scoped>
.task-detail-container {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.task-basic-info {
  margin-bottom: 30px;
}

.task-description {
  margin-top: 20px;
}

.task-stats {
  margin-bottom: 30px;
}

.stat-card {
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-card.total {
  background-color: #f0f2f5;
}

.stat-card.success {
  background-color: #f0f9ff;
  border-color: #91d5ff;
}

.stat-card.failed {
  background-color: #fff2f0;
  border-color: #ffccc7;
}

.stat-card.skipped {
  background-color: #fdf6ec;
  border-color: #faad14;
}

.stat-content {
  text-align: center;
}

.stat-number {
  font-size: 36px;
  font-weight: bold;
  color: #303133;
}

.stat-label {
  font-size: 16px;
  color: #606266;
  margin-top: 5px;
}

.stat-percent {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.chart-section {
  margin-bottom: 30px;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.chart-placeholder {
  text-align: center;
}

.chart-placeholder p {
  margin-bottom: 20px;
  font-size: 16px;
  color: #666;
}

.chart-mock {
  display: flex;
  height: 40px;
  margin-bottom: 20px;
}

.chart-bar {
  height: 100%;
}

.chart-bar.success {
  background-color: #67c23a;
}

.chart-bar.failed {
  background-color: #f56c6c;
}

.chart-bar.skipped {
  background-color: #e6a23c;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 30px;
}

.chart-legend span {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.legend-color.success {
  background-color: #67c23a;
}

.legend-color.failed {
  background-color: #f56c6c;
}

.legend-color.skipped {
  background-color: #e6a23c;
}

.test-cases-section {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.case-detail-content {
  max-height: 500px;
  overflow-y: auto;
}

.error-message {
  background-color: #fff2f0;
  border: 1px solid #ffccc7;
  padding: 10px;
  border-radius: 4px;
  color: #f56c6c;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.case-screenshots {
  margin-top: 20px;
}

.case-screenshots p {
  margin-bottom: 10px;
  font-weight: 600;
}

.logs-content {
  height: 450px;
  overflow-y: auto;
}

.logs-text {
  background-color: #f0f2f5;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap;
  word-wrap: break-word;
  font-family: monospace;
}
</style>