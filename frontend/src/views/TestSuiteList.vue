<template>
  <div class="test-suite-container">
    <el-card class="search-card">
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="测试套名称">
            <el-input v-model="searchForm.name" placeholder="请输入测试套名称" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="可见范围">
            <el-select v-model="searchForm.visible_scope" placeholder="请选择可见范围" style="width: 150px;">
              <el-option label="私有" value="private" />
              <el-option label="项目可见" value="project" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
    </el-card>

    <div class="action-bar">
      <el-button type="primary" @click="handleAddTestSuite">新增测试套</el-button>
      <el-button @click="handleBatchDelete">批量删除</el-button>
      <el-button @click="handleRefresh">刷新</el-button>
    </div>

    <el-card class="table-card">
      <!-- 使用计算属性确保表格数据正确响应分页变化 -->
      <el-table
        v-loading="loading"
        :data="displayedTestSuiteList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="测试套ID" width="180" />
        <el-table-column prop="name" label="测试套名称" width="180">
          <template #default="scope">
            <el-tag>{{ scope.row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" width="250" />
        <el-table-column prop="visible_scope" label="可见范围" width="120">
          <template #default="scope">
            <el-tag :type="getVisibleScopeTag(scope.row.visible_scope)">
              {{ getVisibleScopeLabel(scope.row.visible_scope) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="creator" label="创建人" width="120" />
        <el-table-column prop="case_count" label="用例数量" width="100" />
        <el-table-column prop="create_time" label="创建时间" width="180" />
        <el-table-column prop="update_time" label="更新时间" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleEditTestSuite(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              size="small"
              @click="handleViewDetail(scope.row)"
            >
              详情
            </el-button>
            <el-button
              type="danger"
              size="small"
              @click="handleDelete(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="totalCount"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
    </el-card>

    <!-- 新增/编辑测试套对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form ref="testSuiteFormRef" :model="testSuiteForm" label-width="100px" :rules="formRules">
        <el-form-item label="测试套名称" prop="name">
          <el-input v-model="testSuiteForm.name" placeholder="请输入测试套名称" />
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="testSuiteForm.description" type="textarea" placeholder="请输入测试套描述" :rows="3" />
        </el-form-item>
        <el-form-item label="可见范围" prop="visible_scope">
          <el-select v-model="testSuiteForm.visible_scope" placeholder="请选择可见范围">
            <el-option label="私有" value="private" />
            <el-option label="项目可见" value="project" />
          </el-select>
        </el-form-item>
        <el-form-item label="用例数量" prop="case_count">
          <el-input v-model.number="testSuiteForm.case_count" placeholder="请输入用例数量" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="handleDialogClose">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="测试套详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="测试套ID">{{ selectedTestSuite.id }}</el-descriptions-item>
        <el-descriptions-item label="测试套名称">{{ selectedTestSuite.name }}</el-descriptions-item>
        <el-descriptions-item label="描述">{{ selectedTestSuite.description || '-' }}</el-descriptions-item>
        <el-descriptions-item label="可见范围">{{ getVisibleScopeLabel(selectedTestSuite.visible_scope) }}</el-descriptions-item>
        <el-descriptions-item label="创建人">{{ selectedTestSuite.creator }}</el-descriptions-item>
        <el-descriptions-item label="用例数量">{{ selectedTestSuite.case_count }}</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDate(selectedTestSuite.create_time) }}</el-descriptions-item>
        <el-descriptions-item label="更新时间" :span="2">{{ formatDate(selectedTestSuite.update_time) }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  getTestSuiteList, 
  createTestSuite, 
  updateTestSuite, 
  deleteTestSuite, 
  batchDeleteTestSuite 
} from '../api/testSuite.js'

export default {
  name: 'TestSuiteList',
  setup() {
    const loading = ref(false)
    const dialogVisible = ref(false)
    const detailDialogVisible = ref(false)
    const dialogTitle = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalCount = ref(0)
    const selectedRowKeys = ref([])
    const selectedRows = ref([])
    const selectedTestSuite = ref({})
    
    // 搜索表单
    const searchForm = reactive({
      name: '',
      visible_scope: ''
    })
    
    // 测试套表单数据
    const testSuiteForm = reactive({
      id: '',
      name: '',
      description: '',
      visible_scope: 'private',
      case_count: 0
    })
    
    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入测试套名称', trigger: 'blur' },
        { max: 128, message: '测试套名称不能超过128个字符', trigger: 'blur' }
      ],
      case_count: [
        { type: 'number', required: true, message: '请输入用例数量', trigger: 'blur' },
        { validator: (rule, value, callback) => {
            if (value < 0) {
              callback(new Error('用例数量不能为负数'))
            } else {
              callback()
            }
          }, trigger: 'blur'
        }
      ],
      visible_scope: [
        { required: true, message: '请选择可见范围', trigger: 'change' }
      ]
    }
    
    // 测试套数据
    const testSuiteList = ref([])
    
    // 计算当前页显示的测试套列表
    const displayedTestSuiteList = computed(() => {
      return testSuiteList.value
    })
    
    // 获取测试套列表
    const fetchTestSuiteList = async () => {
      loading.value = true
      try {
        const params = {
          ...searchForm,
          page: currentPage.value,
          pageSize: pageSize.value
        }
        
        const response = await getTestSuiteList(params)
        testSuiteList.value = response.data.results || response.data
        totalCount.value = response.data.count || response.data.length
      } catch (error) {
        ElMessage.error('获取测试套列表失败')
        console.error('获取测试套列表失败:', error)
      } finally {
        loading.value = false
      }
    }
    
    // 处理搜索
    const handleSearch = () => {
      currentPage.value = 1
      fetchTestSuiteList()
    }
    
    // 处理重置
    const handleReset = () => {
      searchForm.name = ''
      searchForm.visible_scope = ''
      currentPage.value = 1
      fetchTestSuiteList()
    }
    
    // 处理刷新
    const handleRefresh = () => {
      fetchTestSuiteList()
    }
    
    // 处理分页大小变化
    const handleSizeChange = (size) => {
      pageSize.value = size
      fetchTestSuiteList()
    }
    
    // 处理页码变化
    const handleCurrentChange = (current) => {
      currentPage.value = current
      fetchTestSuiteList()
    }
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }
    
    // 处理行双击事件
    const handleRowDblClick = (row) => {
      handleViewDetail(row)
    }
    
    // 打开新增测试套对话框
    const handleAddTestSuite = () => {
      dialogTitle.value = '新增测试套'
      Object.assign(testSuiteForm, {
        id: '',
        name: '',
        description: '',
        visible_scope: 'private',
        case_count: 0
      })
      dialogVisible.value = true
    }
    
    // 打开编辑测试套对话框
    const handleEditTestSuite = (row) => {
      dialogTitle.value = '编辑测试套'
      Object.assign(testSuiteForm, row)
      dialogVisible.value = true
    }
    
    // 查看详情
    const handleViewDetail = (row) => {
      selectedTestSuite.value = { ...row }
      detailDialogVisible.value = true
    }
    
    // 保存测试套
    const handleSave = async () => {
      try {
        if (testSuiteForm.id) {
          // 更新测试套
          await updateTestSuite(testSuiteForm.id, testSuiteForm)
          ElMessage.success('测试套更新成功')
        } else {
          // 新增测试套
          await createTestSuite(testSuiteForm)
          ElMessage.success('测试套创建成功')
        }
        dialogVisible.value = false
        fetchTestSuiteList()
      } catch (error) {
        const errorMsg = error.response?.data?.name?.[0] || error.response?.data?.detail || '操作失败'
        ElMessage.error(errorMsg)
        console.error('保存测试套失败:', error)
      }
    }
    
    // 删除测试套
    const handleDelete = async (id) => {
      try {
        await deleteTestSuite(id)
        ElMessage.success('测试套删除成功')
        fetchTestSuiteList()
      } catch (error) {
        ElMessage.error('测试套删除失败')
        console.error('删除测试套失败:', error)
      }
    }
    
    // 批量删除测试套
    const handleBatchDelete = async () => {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请选择要删除的测试套')
        return
      }
      
      try {
        const ids = selectedRows.value.map(row => row.id)
        await batchDeleteTestSuite(ids)
        ElMessage.success('测试套批量删除成功')
        fetchTestSuiteList()
      } catch (error) {
        ElMessage.error('测试套批量删除失败')
        console.error('批量删除测试套失败:', error)
      }
    }
    
    // 关闭对话框
    const handleDialogClose = () => {
      dialogVisible.value = false
    }
    
    // 获取可见范围标签类型
    const getVisibleScopeTag = (scope) => {
      const tagMap = {
        private: 'info',
        project: 'success'
      }
      return tagMap[scope] || 'default'
    }
    
    // 获取可见范围标签
    const getVisibleScopeLabel = (scope) => {
      const labelMap = {
        private: '私有',
        project: '项目可见'
      }
      return labelMap[scope] || scope
    }
    
    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return ''
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })
    }
    
    // 初始化
    onMounted(() => {
      fetchTestSuiteList()
    })
    
    return {
      loading,
      dialogVisible,
      detailDialogVisible,
      dialogTitle,
      currentPage,
      pageSize,
      totalCount,
      searchForm,
      testSuiteForm,
      formRules,
      testSuiteList,
      displayedTestSuiteList,
      selectedRows,
      selectedTestSuite,
      handleSearch,
      handleReset,
      handleRefresh,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      handleRowDblClick,
      handleAddTestSuite,
      handleEditTestSuite,
      handleViewDetail,
      handleSave,
      handleDelete,
      handleBatchDelete,
      handleDialogClose,
      getVisibleScopeTag,
      getVisibleScopeLabel,
      formatDate
    }
  }
}
</script>

<style scoped>
.test-suite-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 16px;
}

.action-bar {
  margin-bottom: 16px;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
</style>