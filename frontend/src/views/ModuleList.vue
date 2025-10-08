<template>
  <div class="module-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>模块管理</span>
          <el-button type="primary" @click="handleAddModule" icon="Plus">添加模块</el-button>
        </div>
      </template>

      <!-- 搜索和筛选区域 -->
      <div class="search-filter-area">
        <el-form :inline="true" :model="searchForm" class="demo-form-inline">
          <el-form-item label="模块名称">
            <el-input
              v-model="searchForm.module_name"
              placeholder="请输入模块名称"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="芯片型号">
            <el-input
              v-model="searchForm.chip_model"
              placeholder="请输入芯片型号"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item label="创建者">
            <el-input
              v-model="searchForm.creator"
              placeholder="请输入创建者"
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 表格区域 -->
      <div class="table-area">
        <el-table
          v-loading="loading"
          :data="moduleList"
          border
          style="width: 100%"
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="module_name" label="模块名称" min-width="150" />
          <el-table-column prop="chip_model" label="芯片型号" min-width="120" />
          <el-table-column prop="feature_count" label="特性数量" width="100" />
          <el-table-column prop="visible_scope" label="可见范围" width="100">
            <template #default="scope">
              <el-tag
                :type="scope.row.visible_scope === 'private' ? 'warning' : 'success'"
                disable-transitions
              >
                {{ scope.row.visible_scope === 'private' ? '私有' : '项目' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="creator" label="创建者" width="120" />
          <el-table-column prop="create_time" label="创建时间" width="180" />
          <el-table-column prop="update_time" label="更新时间" width="180" />
          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleViewFeatures(scope.row)"
                icon="List"
              >
                特性管理
              </el-button>
              <el-button
                link
                type="primary"
                size="small"
                @click="handleEditModule(scope.row)"
                icon="Edit"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDeleteModule(scope.row.id)"
                icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 分页区域 -->
      <div class="pagination-area">
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

      <!-- 批量操作按钮 -->
      <div class="batch-operation-area" v-if="selectedModules.length > 0">
        <el-button type="danger" @click="handleBatchDelete">
          批量删除 ({{ selectedModules.length }})
        </el-button>
      </div>
    </el-card>

    <!-- 添加/编辑模块对话框 -->
    <el-dialog
      v-model="moduleDialogVisible"
      :title="isEditModule ? '编辑模块' : '添加模块'"
      width="500px"
    >
      <el-form
        ref="moduleFormRef"
        :model="moduleForm"
        :rules="moduleFormRules"
        label-width="100px"
      >
        <el-form-item label="模块名称" prop="module_name">
          <el-input v-model="moduleForm.module_name" placeholder="请输入模块名称" />
        </el-form-item>
        <el-form-item label="芯片型号" prop="chip_model">
          <el-input v-model="moduleForm.chip_model" placeholder="请输入芯片型号" />
        </el-form-item>
        <el-form-item label="可见范围" prop="visible_scope">
          <el-radio-group v-model="moduleForm.visible_scope">
            <el-radio label="private">私有</el-radio>
            <el-radio label="project">项目</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="模块描述">
          <el-input
            v-model="moduleForm.description"
            type="textarea"
            placeholder="请输入模块描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="moduleDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveModule">确定</el-button>
      </template>
    </el-dialog>

    <!-- 特性管理对话框 -->
    <el-dialog
      v-model="featureDialogVisible"
      title="特性管理 - {{ currentModule?.module_name || '' }}"
      width="700px"
    >
      <div class="feature-management">
        <div class="feature-header">
          <el-button type="primary" @click="handleAddFeature" icon="Plus">添加特性</el-button>
        </div>
        <el-table
          v-loading="featureLoading"
          :data="featureList"
          border
          style="width: 100%"
          @selection-change="handleFeatureSelectionChange"
        >
          <el-table-column type="selection" width="55" />
          <el-table-column prop="id" label="ID" width="80" />
          <el-table-column prop="feature_name" label="特性名称" min-width="180" />
          <el-table-column prop="description" label="特性描述" min-width="200" />
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                link
                type="primary"
                size="small"
                @click="handleEditFeature(scope.row)"
                icon="Edit"
              >
                编辑
              </el-button>
              <el-button
                link
                type="danger"
                size="small"
                @click="handleDeleteFeature(scope.row.id)"
                icon="Delete"
              >
                删除
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="featureDialogVisible = false">关闭</el-button>
        <el-button type="danger" @click="handleBatchDeleteFeature" v-if="selectedFeatures.length > 0">
          批量删除 ({{ selectedFeatures.length }})
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑特性对话框 -->
    <el-dialog
      v-model="featureFormDialogVisible"
      :title="isEditFeature ? '编辑特性' : '添加特性'"
      width="400px"
    >
      <el-form
        ref="featureFormRef"
        :model="featureForm"
        :rules="featureFormRules"
        label-width="80px"
      >
        <el-form-item label="特性名称" prop="feature_name">
          <el-input v-model="featureForm.feature_name" placeholder="请输入特性名称" />
        </el-form-item>
        <el-form-item label="特性描述">
          <el-input
            v-model="featureForm.description"
            type="textarea"
            placeholder="请输入特性描述"
            :rows="3"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="featureFormDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFeature">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getModuleList, createModule, updateModule, deleteModule, batchDeleteModule, getFeatureList, createFeature, updateFeature, deleteFeature, batchDeleteFeature } from '../api/module.js'
import { ElMessage } from 'element-plus'

export default {
  name: 'ModuleList',
  data() {
    return {
      // 模块相关数据
      moduleList: [],
      loading: false,
      selectedModules: [],
      searchForm: {
        module_name: '',
        chip_model: '',
        creator: ''
      },
      pagination: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      },
      // 模块对话框相关
      moduleDialogVisible: false,
      isEditModule: false,
      currentModuleId: null,
      moduleForm: {
        module_name: '',
        chip_model: '',
        description: '',
        visible_scope: 'project'
      },
      moduleFormRules: {
        module_name: [
          { required: true, message: '请输入模块名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        chip_model: [
          { required: true, message: '请输入芯片型号', trigger: 'blur' },
          { min: 2, max: 30, message: '长度在 2 到 30 个字符', trigger: 'blur' }
        ],
        visible_scope: [
          { required: true, message: '请选择可见范围', trigger: 'change' }
        ]
      },
      moduleFormRef: null,
      // 特性相关数据
      featureDialogVisible: false,
      currentModule: null,
      featureList: [],
      featureLoading: false,
      selectedFeatures: [],
      // 特性对话框相关
      featureFormDialogVisible: false,
      isEditFeature: false,
      currentFeatureId: null,
      featureForm: {
        feature_name: '',
        description: ''
      },
      featureFormRules: {
        feature_name: [
          { required: true, message: '请输入特性名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ]
      },
      featureFormRef: null
    }
  },
  methods: {
    // 加载模块列表
    loadModuleList() {
      this.loading = true
      const params = {
        ...this.searchForm,
        page: this.pagination.currentPage,
        pageSize: this.pagination.pageSize
      }
      getModuleList(params)
        .then(res => {
          this.moduleList = res.data.results || []
          this.pagination.total = res.data.count || 0
        })
        .catch(err => {
          ElMessage.error('获取模块列表失败')
          console.error('获取模块列表失败:', err)
        })
        .finally(() => {
          this.loading = false
        })
    },
    // 搜索
    handleSearch() {
      this.pagination.currentPage = 1
      this.loadModuleList()
    },
    // 重置搜索
    resetSearch() {
      this.searchForm = {
        module_name: '',
        chip_model: '',
        creator: ''
      }
      this.pagination.currentPage = 1
      this.loadModuleList()
    },
    // 分页大小改变
    handleSizeChange(size) {
      this.pagination.pageSize = size
      this.loadModuleList()
    },
    // 当前页码改变
    handleCurrentChange(current) {
      this.pagination.currentPage = current
      this.loadModuleList()
    },
    // 处理选择变化
    handleSelectionChange(selection) {
      this.selectedModules = selection
    },
    // 添加模块
    handleAddModule() {
      this.isEditModule = false
      this.currentModuleId = null
      this.moduleForm = {
        module_name: '',
        chip_model: '',
        description: '',
        visible_scope: 'project'
      }
      this.moduleDialogVisible = true
    },
    // 编辑模块
    handleEditModule(row) {
      this.isEditModule = true
      this.currentModuleId = row.id
      this.moduleForm = {
        module_name: row.module_name,
        chip_model: row.chip_model,
        description: row.description,
        visible_scope: row.visible_scope
      }
      this.moduleDialogVisible = true
    },
    // 保存模块
    handleSaveModule() {
      this.$refs.moduleFormRef.validate((valid) => {
        if (valid) {
          if (this.isEditModule) {
            // 编辑模块
            updateModule(this.currentModuleId, this.moduleForm)
              .then(() => {
                ElMessage.success('模块更新成功')
                this.moduleDialogVisible = false
                this.loadModuleList()
              })
              .catch(err => {
                ElMessage.error('模块更新失败')
                console.error('模块更新失败:', err)
              })
          } else {
            // 添加模块
            createModule(this.moduleForm)
              .then(() => {
                ElMessage.success('模块添加成功')
                this.moduleDialogVisible = false
                this.loadModuleList()
              })
              .catch(err => {
                ElMessage.error('模块添加失败')
                console.error('模块添加失败:', err)
              })
          }
        }
      })
    },
    // 删除模块
    handleDeleteModule(id) {
      this.$confirm('确定要删除这个模块吗？删除后相关特性也将被删除。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteModule(id)
            .then(() => {
              ElMessage.success('模块删除成功')
              this.loadModuleList()
            })
            .catch(err => {
              ElMessage.error('模块删除失败')
              console.error('模块删除失败:', err)
            })
        })
        .catch(() => {
          ElMessage.info('已取消删除')
        })
    },
    // 批量删除模块
    handleBatchDelete() {
      this.$confirm(`确定要批量删除这 ${this.selectedModules.length} 个模块吗？删除后相关特性也将被删除。`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          const ids = this.selectedModules.map(item => item.id)
          batchDeleteModule(ids)
            .then(() => {
              ElMessage.success('模块批量删除成功')
              this.selectedModules = []
              this.loadModuleList()
            })
            .catch(err => {
              ElMessage.error('模块批量删除失败')
              console.error('模块批量删除失败:', err)
            })
        })
        .catch(() => {
          ElMessage.info('已取消批量删除')
        })
    },
    // 查看特性管理
    handleViewFeatures(row) {
      this.currentModule = row
      this.featureDialogVisible = true
      this.loadFeatureList()
    },
    // 加载特性列表
    loadFeatureList() {
      if (!this.currentModule) return
      
      this.featureLoading = true
      const params = {
        module_id: this.currentModule.id
      }
      getFeatureList(params)
        .then(res => {
          this.featureList = res.data.results || []
        })
        .catch(err => {
          ElMessage.error('获取特性列表失败')
          console.error('获取特性列表失败:', err)
        })
        .finally(() => {
          this.featureLoading = false
        })
    },
    // 处理特性选择变化
    handleFeatureSelectionChange(selection) {
      this.selectedFeatures = selection
    },
    // 添加特性
    handleAddFeature() {
      this.isEditFeature = false
      this.currentFeatureId = null
      this.featureForm = {
        feature_name: '',
        description: ''
      }
      this.featureFormDialogVisible = true
    },
    // 编辑特性
    handleEditFeature(row) {
      this.isEditFeature = true
      this.currentFeatureId = row.id
      this.featureForm = {
        feature_name: row.feature_name,
        description: row.description
      }
      this.featureFormDialogVisible = true
    },
    // 保存特性
    handleSaveFeature() {
      this.$refs.featureFormRef.validate((valid) => {
        if (valid) {
          const data = {
            ...this.featureForm,
            module_id: this.currentModule.id
          }
          
          if (this.isEditFeature) {
            // 编辑特性
            updateFeature(this.currentFeatureId, data)
              .then(() => {
                ElMessage.success('特性更新成功')
                this.featureFormDialogVisible = false
                this.loadFeatureList()
                // 重新加载模块列表以更新特性数量
                this.loadModuleList()
              })
              .catch(err => {
                ElMessage.error('特性更新失败')
                console.error('特性更新失败:', err)
              })
          } else {
            // 添加特性
            createFeature(data)
              .then(() => {
                ElMessage.success('特性添加成功')
                this.featureFormDialogVisible = false
                this.loadFeatureList()
                // 重新加载模块列表以更新特性数量
                this.loadModuleList()
              })
              .catch(err => {
                ElMessage.error('特性添加失败')
                console.error('特性添加失败:', err)
              })
          }
        }
      })
    },
    // 删除特性
    handleDeleteFeature(id) {
      this.$confirm('确定要删除这个特性吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteFeature(id)
            .then(() => {
              ElMessage.success('特性删除成功')
              this.loadFeatureList()
              // 重新加载模块列表以更新特性数量
              this.loadModuleList()
            })
            .catch(err => {
              ElMessage.error('特性删除失败')
              console.error('特性删除失败:', err)
            })
        })
        .catch(() => {
          ElMessage.info('已取消删除')
        })
    },
    // 批量删除特性
    handleBatchDeleteFeature() {
      this.$confirm(`确定要批量删除这 ${this.selectedFeatures.length} 个特性吗？`, '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          const ids = this.selectedFeatures.map(item => item.id)
          batchDeleteFeature(ids)
            .then(() => {
              ElMessage.success('特性批量删除成功')
              this.selectedFeatures = []
              this.loadFeatureList()
              // 重新加载模块列表以更新特性数量
              this.loadModuleList()
            })
            .catch(err => {
              ElMessage.error('特性批量删除失败')
              console.error('特性批量删除失败:', err)
            })
        })
        .catch(() => {
          ElMessage.info('已取消批量删除')
        })
    }
  },
  mounted() {
    this.loadModuleList()
  }
}
</script>

<style scoped>
.module-list-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-filter-area {
  margin-bottom: 20px;
}

.pagination-area {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.batch-operation-area {
  margin-top: 10px;
}

.feature-management {
  margin-top: 10px;
}

.feature-header {
  margin-bottom: 15px;
  display: flex;
  justify-content: flex-end;
}
</style>