<template>
  <div class="env-list-container">
    <el-card class="search-card">
      <div class="search-form">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="环境名称">
            <el-input v-model="searchForm.name" placeholder="请输入环境名称" style="width: 200px;" />
          </el-form-item>
          <el-form-item label="环境类型">
            <el-select v-model="searchForm.type" placeholder="请选择环境类型" style="width: 150px;">
              <el-option label="开发环境" value="dev" />
              <el-option label="测试环境" value="test" />
              <el-option label="生产环境" value="prod" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 120px;">
              <el-option label="启用" value="active" />
              <el-option label="禁用" value="inactive" />
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
      <el-button type="primary" @click="handleAddEnv">新增环境</el-button>
      <el-button @click="handleBatchDelete">批量删除</el-button>
      <el-button @click="handleRefresh">刷新</el-button>
    </div>

    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="envList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="环境ID" width="80" />
        <el-table-column prop="name" label="环境名称" width="180">
          <template #default="scope">
            <el-tag>{{ scope.row.name }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="环境类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">{{ getTypeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column prop="updateTime" label="更新时间" width="180" />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="active"
              inactive-value="inactive"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="handleEditEnv(scope.row)"
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

    <!-- 新增/编辑环境对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      @close="handleDialogClose"
    >
      <el-form ref="envFormRef" :model="envForm" label-width="100px" :rules="formRules">
        <el-form-item label="环境名称" prop="name">
          <el-input v-model="envForm.name" placeholder="请输入环境名称" />
        </el-form-item>
        <el-form-item label="环境类型" prop="type">
          <el-select v-model="envForm.type" placeholder="请选择环境类型">
            <el-option label="开发环境" value="dev" />
            <el-option label="测试环境" value="test" />
            <el-option label="生产环境" value="prod" />
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="envForm.description" type="textarea" placeholder="请输入环境描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'EnvList',
  setup() {
    // 搜索表单数据
    const searchForm = reactive({
      name: '',
      type: '',
      status: ''
    })

    // 环境列表数据
    const envList = ref([])
    // 加载状态
    const loading = ref(false)
    // 选中的行
    const selectedRows = ref([])
    // 分页数据
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })

    // 对话框相关
    const dialogVisible = ref(false)
    const envFormRef = ref(null)
    const envForm = reactive({
      id: '',
      name: '',
      type: '',
      description: '',
      status: 'active'
    })

    // 表单验证规则
    const formRules = {
      name: [
        { required: true, message: '请输入环境名称', trigger: 'blur' },
        { min: 2, max: 20, message: '长度在 2 到 20 个字符', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择环境类型', trigger: 'change' }
      ],
      description: [
        { max: 200, message: '描述不能超过 200 个字符', trigger: 'blur' }
      ]
    }

    // 对话框标题
    const dialogTitle = computed(() => {
      return envForm.id ? '编辑环境' : '新增环境'
    })

    // 根据环境类型获取标签类型
    const getTypeTag = (type) => {
      const tagMap = {
        dev: 'primary',
        test: 'success',
        prod: 'warning'
      }
      return tagMap[type] || 'info'
    }

    // 根据环境类型获取标签文本
    const getTypeLabel = (type) => {
      const labelMap = {
        dev: '开发环境',
        test: '测试环境',
        prod: '生产环境'
      }
      return labelMap[type] || type
    }

    // 加载环境列表
    const loadEnvList = () => {
      loading.value = true
      // 模拟API请求
      setTimeout(() => {
        // 模拟数据
        const mockData = [
          {
            id: '1',
            name: '测试环境1',
            type: 'test',
            description: '用于芯片功能测试的环境',
            createTime: '2023-10-01 10:30:00',
            updateTime: '2023-10-02 14:20:00',
            status: 'active'
          },
          {
            id: '2',
            name: '开发环境1',
            type: 'dev',
            description: '开发人员使用的测试环境',
            createTime: '2023-09-28 09:15:00',
            updateTime: '2023-09-30 16:45:00',
            status: 'active'
          },
          {
            id: '3',
            name: '生产环境1',
            type: 'prod',
            description: '正式芯片验证生产环境',
            createTime: '2023-09-20 11:00:00',
            updateTime: '2023-09-25 13:30:00',
            status: 'active'
          },
          {
            id: '4',
            name: '测试环境2',
            type: 'test',
            description: '备用测试环境',
            createTime: '2023-09-15 14:00:00',
            updateTime: '2023-09-18 10:15:00',
            status: 'inactive'
          }
        ]
        
        // 模拟搜索过滤
        let filteredData = [...mockData]
        if (searchForm.name) {
          filteredData = filteredData.filter(item => item.name.includes(searchForm.name))
        }
        if (searchForm.type) {
          filteredData = filteredData.filter(item => item.type === searchForm.type)
        }
        if (searchForm.status) {
          filteredData = filteredData.filter(item => item.status === searchForm.status)
        }
        
        // 模拟分页
        const start = (pagination.currentPage - 1) * pagination.pageSize
        const end = start + pagination.pageSize
        envList.value = filteredData.slice(start, end)
        pagination.total = filteredData.length
        loading.value = false
      }, 500)
    }

    // 搜索
    const handleSearch = () => {
      pagination.currentPage = 1
      loadEnvList()
    }

    // 重置搜索
    const handleReset = () => {
      searchForm.name = ''
      searchForm.type = ''
      searchForm.status = ''
      pagination.currentPage = 1
      loadEnvList()
    }

    // 分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      loadEnvList()
    }

    // 当前页变化
    const handleCurrentChange = (current) => {
      pagination.currentPage = current
      loadEnvList()
    }

    // 选择变化
    const handleSelectionChange = (selection) => {
      selectedRows.value = selection
    }

    // 行双击
    const handleRowDblClick = (row) => {
      handleViewDetail(row)
    }

    // 新增环境
    const handleAddEnv = () => {
      // 重置表单
      Object.assign(envForm, {
        id: '',
        name: '',
        type: '',
        description: '',
        status: 'active'
      })
      if (envFormRef.value) {
        envFormRef.value.resetFields()
      }
      dialogVisible.value = true
    }

    // 编辑环境
    const handleEditEnv = (row) => {
      Object.assign(envForm, row)
      dialogVisible.value = true
    }

    // 查看详情
    const handleViewDetail = (row) => {
      ElMessage({ message: `查看环境 ${row.name} 详情`, type: 'info' })
      // 实际项目中这里应该跳转到详情页
    }

    // 删除环境
    const handleDelete = (id) => {
      ElMessageBox.confirm('确定要删除该环境吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟删除操作
        ElMessage({ message: '删除成功', type: 'success' })
        loadEnvList()
      }).catch(() => {
        ElMessage({ message: '已取消删除', type: 'info' })
      })
    }

    // 批量删除
    const handleBatchDelete = () => {
      if (selectedRows.value.length === 0) {
        ElMessage({ message: '请选择要删除的环境', type: 'warning' })
        return
      }
      
      ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个环境吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 模拟批量删除操作
        ElMessage({ message: '批量删除成功', type: 'success' })
        loadEnvList()
      }).catch(() => {
        ElMessage({ message: '已取消删除', type: 'info' })
      })
    }

    // 刷新
    const handleRefresh = () => {
      loadEnvList()
    }

    // 状态变化
    const handleStatusChange = (row) => {
      // 模拟状态更新操作
      ElMessage({ 
        message: `${row.name} 状态已${row.status === 'active' ? '启用' : '禁用'}`, 
        type: 'success' 
      })
    }

    // 提交表单
    const handleSubmit = () => {
      envFormRef.value.validate((valid) => {
        if (valid) {
          // 模拟提交数据
          setTimeout(() => {
            ElMessage({ 
              message: envForm.id ? '环境更新成功' : '环境创建成功', 
              type: 'success' 
            })
            dialogVisible.value = false
            loadEnvList()
          }, 500)
        }
      })
    }

    // 对话框关闭
    const handleDialogClose = () => {
      if (envFormRef.value) {
        envFormRef.value.resetFields()
      }
    }

    // 初始化加载数据
    onMounted(() => {
      loadEnvList()
    })

    return {
      searchForm,
      envList,
      loading,
      selectedRows,
      pagination,
      dialogVisible,
      envFormRef,
      envForm,
      formRules,
      dialogTitle,
      getTypeTag,
      getTypeLabel,
      handleSearch,
      handleReset,
      handleSizeChange,
      handleCurrentChange,
      handleSelectionChange,
      handleRowDblClick,
      handleAddEnv,
      handleEditEnv,
      handleViewDetail,
      handleDelete,
      handleBatchDelete,
      handleRefresh,
      handleStatusChange,
      handleSubmit,
      handleDialogClose
    }
  }
}
</script>

<style scoped>
.env-list-container {
  width: 100%;
}

.search-card {
  margin-bottom: 20px;
}

.search-form {
  padding: 10px 0;
}

.action-bar {
  margin-bottom: 20px;
}

.action-bar .el-button {
  margin-right: 10px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
</style>