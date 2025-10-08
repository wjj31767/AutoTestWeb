<template>
  <div class="feature-testcase-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>特性测试用例管理</span>
        </div>
      </template>

      <!-- 模块选择区域 -->
      <div class="module-selection-area">
        <el-form :inline="true" class="demo-form-inline">
          <el-form-item label="选择模块">
            <el-select 
              v-model="selectedModuleId" 
              placeholder="请选择模块" 
              style="width: 300px"
              @change="handleModuleChange"
            >
              <el-option 
                v-for="module in moduleList" 
                :key="module.id" 
                :label="module.module_name + ' (' + module.chip_model + ')'"
                :value="String(module.id)"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </div>

      <!-- 特性列表和测试用例列表 -->
      <div v-if="selectedModuleId" class="feature-testcase-content">
        <!-- 左侧特性列表 -->
        <div class="feature-list-section">
          <div class="section-header">
            <span>特性列表</span>
            <el-button type="primary" @click="handleAddFeature" size="small" icon="Plus">
              添加特性
            </el-button>
          </div>
          <el-table
            v-loading="featureLoading"
            :data="featureList"
            border
            style="width: 100%"
            @row-click="handleFeatureClick"
            :row-class-name="getRowClassName"
          >
            <el-table-column prop="feature_name" label="特性名称" min-width="150" />
            <el-table-column prop="description" label="特性描述" min-width="200" />
            <el-table-column prop="case_count" label="用例数" width="80" />
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

        <!-- 右侧测试用例列表 -->
        <div class="testcase-list-section">
          <div class="section-header">
            <span>测试用例列表</span>
            <el-button 
              v-if="selectedFeatureId" 
              type="primary" 
              @click="handleAddTestCase" 
              size="small" 
              icon="Plus"
            >
              添加用例
            </el-button>
          </div>
          <div v-if="selectedFeatureId">
            <el-table
              v-loading="testcaseLoading"
              :data="testcaseList"
              border
              style="width: 100%"
            >
              <el-table-column prop="case_id" label="用例ID" min-width="120" />
              <el-table-column prop="case_name" label="用例名称" min-width="180" />
              <el-table-column prop="description" label="用例描述" min-width="200" />
              <el-table-column prop="status" label="状态" width="100">
                <template #default="scope">
                  <el-tag
                    :type="getStatusTagType(scope.row.status)"
                    disable-transitions
                  >
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="scope">
                  <el-button
                    link
                    type="primary"
                    size="small"
                    @click="handleEditTestCase(scope.row)"
                    icon="Edit"
                  >
                    编辑
                  </el-button>
                  <el-button
                    link
                    type="danger"
                    size="small"
                    @click="handleDeleteTestCase(scope.row.id)"
                    icon="Delete"
                  >
                    删除
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <div v-else class="no-selection-tip">
            请从左侧选择一个特性查看测试用例
          </div>
        </div>
      </div>
      <div v-else class="no-selection-tip">
        请先选择一个模块
      </div>
    </el-card>

    <!-- 添加/编辑特性对话框 -->
    <el-dialog
      v-model="featureDialogVisible"
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
        <el-button @click="featureDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveFeature">确定</el-button>
      </template>
    </el-dialog>

    <!-- 添加/编辑测试用例对话框 -->
    <el-dialog
      v-model="testcaseDialogVisible"
      :title="isEditTestCase ? '编辑测试用例' : '添加测试用例'"
      width="600px"
    >
      <el-form
        ref="testcaseFormRef"
        :model="testcaseForm"
        :rules="testcaseFormRules"
        label-width="100px"
      >
        <el-form-item label="用例ID" prop="case_id">
          <el-input v-model="testcaseForm.case_id" placeholder="请输入用例ID" />
        </el-form-item>
        <el-form-item label="用例名称" prop="case_name">
          <el-input v-model="testcaseForm.case_name" placeholder="请输入用例名称" />
        </el-form-item>
        <el-form-item label="用例描述">
          <el-input
            v-model="testcaseForm.description"
            type="textarea"
            placeholder="请输入用例描述"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="前置条件" prop="pre_condition">
          <el-input
            v-model="testcaseForm.pre_condition"
            type="textarea"
            placeholder="请输入前置条件"
            :rows="2"
          />
        </el-form-item>
        <el-form-item label="执行步骤" prop="steps">
          <el-input
            v-model="testcaseForm.steps"
            type="textarea"
            placeholder="请输入执行步骤"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="预期结果" prop="expected_result">
          <el-input
            v-model="testcaseForm.expected_result"
            type="textarea"
            placeholder="请输入预期结果"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="脚本路径">
          <el-input v-model="testcaseForm.script_path" placeholder="请输入脚本路径" />
        </el-form-item>
        <el-form-item label="用例状态" prop="status">
          <el-select v-model="testcaseForm.status" placeholder="请选择用例状态">
            <el-option label="活跃" value="active" />
            <el-option label="非活跃" value="inactive" />
            <el-option label="草稿" value="draft" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="testcaseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveTestCase">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { getModuleList } from '../api/module.js'
import { getFeatureList, createFeature, updateFeature, deleteFeature, getTestCaseList, createTestCase, updateTestCase, deleteTestCase } from '../api/featureTestCase.js'
import { ElMessage } from 'element-plus'

export default {
  name: 'FeatureTestCaseList',
  data() {
    return {
      // 模块相关数据
      moduleList: [],
      selectedModuleId: '',
      // 特性相关数据
      featureList: [],
      featureLoading: false,
      selectedFeatureId: '',
      // 测试用例相关数据
      testcaseList: [],
      testcaseLoading: false,
      // 特性对话框相关
      featureDialogVisible: false,
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
      featureFormRef: null,
      // 测试用例对话框相关
      testcaseDialogVisible: false,
      isEditTestCase: false,
      currentTestCaseId: null,
      testcaseForm: {
        case_id: '',
        case_name: '',
        description: '',
        pre_condition: '',
        steps: '',
        expected_result: '',
        script_path: '',
        status: 'active'
      },
      testcaseFormRules: {
        case_id: [
          { required: true, message: '请输入用例ID', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        case_name: [
          { required: true, message: '请输入用例名称', trigger: 'blur' },
          { min: 2, max: 100, message: '长度在 2 到 100 个字符', trigger: 'blur' }
        ],
        pre_condition: [
          { required: true, message: '请输入前置条件', trigger: 'blur' }
        ],
        steps: [
          { required: true, message: '请输入执行步骤', trigger: 'blur' }
        ],
        expected_result: [
          { required: true, message: '请输入预期结果', trigger: 'blur' }
        ],
        status: [
          { required: true, message: '请选择用例状态', trigger: 'change' }
        ]
      },
      testcaseFormRef: null
    }
  },
  
  watch: {
    // 监听模块选择变化，确保特性列表正确加载
    selectedModuleId: {
      handler(newVal) {
        console.log('watch监听到selectedModuleId变化:', newVal)
        if (newVal) {
          // 重置选择的特性和测试用例列表
          this.selectedFeatureId = ''
          this.testcaseList = []
          this.loadFeatureList()
        }
      },
      immediate: false
    }
  },
  
  created() {
    this.loadModuleList()
  },
  
  methods: {
    // 加载模块列表
    loadModuleList() {
      const params = {
        page: 1,
        pageSize: 100 // 获取足够多的模块以显示在下拉框中
      }
      getModuleList(params)
        .then(res => {
          this.moduleList = res.data.results || []
        })
        .catch(err => {
          ElMessage.error('获取模块列表失败')
          console.error('获取模块列表失败:', err)
        })
    },
    
    // 处理模块选择变化
    handleModuleChange(value) {
      console.log('选择的模块ID值:', value, '类型:', typeof value)
      // v-model已经自动更新了selectedModuleId
      console.log('v-model更新后的selectedModuleId:', this.selectedModuleId, '类型:', typeof this.selectedModuleId)
      // 不需要再次赋值，因为v-model已经处理了
      // 剩余逻辑由watch监听器处理
    },
    
    // 加载特性列表
    loadFeatureList() {
      this.featureLoading = true
      // 确保传递给API的module_id是正确的类型
      const params = {
        module_id: this.selectedModuleId
      }
      console.log('传递给getFeatureList的参数:', params)
      getFeatureList(params)
        .then(res => {
          this.featureList = res.data.results || []
          console.log('获取到的特性列表:', this.featureList)
        })
        .catch(err => {
          ElMessage.error('获取特性列表失败')
          console.error('获取特性列表失败:', err)
        })
        .finally(() => {
          this.featureLoading = false
        })
    },
    
    // 处理特性点击
    handleFeatureClick(row) {
      this.selectedFeatureId = row.id
      this.loadTestCaseList()
    },
    
    // 获取行样式类名
    getRowClassName({ row }) {
      return row.id === this.selectedFeatureId ? 'selected-row' : ''
    },
    
    // 加载测试用例列表
    loadTestCaseList() {
      if (!this.selectedFeatureId) return
      
      this.testcaseLoading = true
      const params = {
        feature_id: this.selectedFeatureId
      }
      getTestCaseList(params)
        .then(res => {
          this.testcaseList = res.data.results || []
        })
        .catch(err => {
          ElMessage.error('获取测试用例列表失败')
          console.error('获取测试用例列表失败:', err)
        })
        .finally(() => {
          this.testcaseLoading = false
        })
    },
    
    // 获取状态标签类型
    getStatusTagType(status) {
      switch (status) {
        case 'active':
          return 'success'
        case 'inactive':
          return 'warning'
        case 'draft':
          return 'info'
        default:
          return 'default'
      }
    },
    
    // 获取状态文本
    getStatusText(status) {
      switch (status) {
        case 'active':
          return '活跃'
        case 'inactive':
          return '非活跃'
        case 'draft':
          return '草稿'
        default:
          return status
      }
    },
    
    // 添加特性
    handleAddFeature() {
      this.isEditFeature = false
      this.currentFeatureId = null
      this.featureForm = {
        feature_name: '',
        description: ''
      }
      this.featureDialogVisible = true
    },
    
    // 编辑特性
    handleEditFeature(row) {
      this.isEditFeature = true
      this.currentFeatureId = row.id
      this.featureForm = {
        feature_name: row.feature_name,
        description: row.description
      }
      this.featureDialogVisible = true
    },
    
    // 保存特性
    handleSaveFeature() {
      this.$refs.featureFormRef.validate((valid) => {
        if (valid) {
          const data = {
            ...this.featureForm,
            module_id: this.selectedModuleId
          }
          
          if (this.isEditFeature) {
            // 编辑特性
            updateFeature(this.currentFeatureId, data)
              .then(() => {
                ElMessage.success('特性更新成功')
                this.featureDialogVisible = false
                this.loadFeatureList()
                // 如果当前编辑的是选中的特性，重新加载测试用例
                if (this.currentFeatureId === this.selectedFeatureId) {
                  this.loadTestCaseList()
                }
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
                this.featureDialogVisible = false
                this.loadFeatureList()
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
      this.$confirm('确定要删除这个特性吗？删除后相关测试用例也将被删除。', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteFeature(id)
            .then(() => {
              ElMessage.success('特性删除成功')
              // 如果删除的是当前选中的特性，清空选中状态和测试用例列表
              if (id === this.selectedFeatureId) {
                this.selectedFeatureId = ''
                this.testcaseList = []
              }
              this.loadFeatureList()
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
    
    // 添加测试用例
    handleAddTestCase() {
      this.isEditTestCase = false
      this.currentTestCaseId = null
      this.testcaseForm = {
        case_id: '',
        case_name: '',
        description: '',
        pre_condition: '',
        steps: '',
        expected_result: '',
        script_path: '',
        status: 'active'
      }
      this.testcaseDialogVisible = true
    },
    
    // 编辑测试用例
    handleEditTestCase(row) {
      this.isEditTestCase = true
      this.currentTestCaseId = row.id
      this.testcaseForm = {
        case_id: row.case_id,
        case_name: row.case_name,
        description: row.description,
        pre_condition: row.pre_condition,
        steps: row.steps,
        expected_result: row.expected_result,
        script_path: row.script_path,
        status: row.status
      }
      this.testcaseDialogVisible = true
    },
    
    // 保存测试用例
    handleSaveTestCase() {
      this.$refs.testcaseFormRef.validate((valid) => {
        if (valid) {
          const data = {
            ...this.testcaseForm,
            feature_id: this.selectedFeatureId
          }
          
          if (this.isEditTestCase) {
            // 编辑测试用例
            updateTestCase(this.currentTestCaseId, data)
              .then(() => {
                ElMessage.success('测试用例更新成功')
                this.testcaseDialogVisible = false
                this.loadTestCaseList()
              })
              .catch(err => {
                ElMessage.error('测试用例更新失败')
                console.error('测试用例更新失败:', err)
              })
          } else {
            // 添加测试用例
            createTestCase(data)
              .then(() => {
                ElMessage.success('测试用例添加成功')
                this.testcaseDialogVisible = false
                this.loadTestCaseList()
                // 重新加载特性列表以更新用例数量
                this.loadFeatureList()
              })
              .catch(err => {
                ElMessage.error('测试用例添加失败')
                console.error('测试用例添加失败:', err)
              })
          }
        }
      })
    },
    
    // 删除测试用例
    handleDeleteTestCase(id) {
      this.$confirm('确定要删除这个测试用例吗？', '警告', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(() => {
          deleteTestCase(id)
            .then(() => {
              ElMessage.success('测试用例删除成功')
              this.loadTestCaseList()
              // 重新加载特性列表以更新用例数量
              this.loadFeatureList()
            })
            .catch(err => {
              ElMessage.error('测试用例删除失败')
              console.error('测试用例删除失败:', err)
            })
        })
        .catch(() => {
          ElMessage.info('已取消删除')
        })
    }
  }
}
</script>

<style scoped>
.feature-testcase-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.module-selection-area {
  margin-bottom: 20px;
  padding: 10px;
  background-color: #f5f5f5;
  border-radius: 4px;
}

.feature-testcase-content {
  display: flex;
  gap: 20px;
}

.feature-list-section,
.testcase-list-section {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.section-header span {
  font-size: 16px;
  font-weight: bold;
}

.no-selection-tip {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 200px;
  background-color: #f5f5f5;
  border-radius: 4px;
  color: #999;
}

.selected-row {
  background-color: #e6f7ff;
}

.el-table {
  flex: 1;
}
</style>