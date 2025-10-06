<template>
  <div class="add-task-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>新增执行任务</span>
        </div>
      </template>

      <!-- 步骤条 -->
      <div class="steps-container">
        <el-steps :active="currentStep" finish-status="success" style="margin-bottom: 30px;">
          <el-step title="选择环境" description="选择测试环境" />
          <el-step title="配置参数" description="设置任务参数" />
          <el-step title="确认提交" description="确认任务信息" />
        </el-steps>
      </div>

      <!-- 步骤内容 -->
      <div class="steps-content">
        <!-- 步骤1: 选择环境 -->
        <div v-if="currentStep === 0" class="step-content">
          <el-form ref="step1FormRef" :model="taskForm" label-width="100px" :rules="step1Rules">
            <el-form-item label="任务名称" prop="name">
              <el-input v-model="taskForm.name" placeholder="请输入任务名称" />
            </el-form-item>
            <el-form-item label="选择环境" prop="environmentId">
              <el-select v-model="taskForm.environmentId" placeholder="请选择测试环境" style="width: 100%;">
                <el-option v-for="env in environments" :key="env.id" :label="env.name" :value="env.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="任务描述">
              <el-input v-model="taskForm.description" type="textarea" placeholder="请输入任务描述" />
            </el-form-item>
            <el-form-item label="分支包" prop="branchPackage">
              <el-input v-model="taskForm.branchPackage" placeholder="请输入分支包路径" @input="handleBranchPackageChange" />
              <div v-if="branchFiles.length > 0" class="branch-files">
                <p>已加载的文件：</p>
                <el-tag v-for="file in branchFiles" :key="file" closable @close="handleRemoveBranchFile(file)">{{ file }}</el-tag>
              </div>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤2: 配置参数 -->
        <div v-if="currentStep === 1" class="step-content">
          <el-form ref="step2FormRef" :model="taskForm" label-width="100px" :rules="step2Rules">
            <el-form-item label="测试用例集" prop="testSuite">
              <el-select v-model="taskForm.testSuite" placeholder="请选择测试用例集" style="width: 100%;">
                <el-option v-for="suite in testSuites" :key="suite.id" :label="suite.name" :value="suite.id" />
              </el-select>
            </el-form-item>
            <el-form-item label="执行模式" prop="executionMode">
              <el-radio-group v-model="taskForm.executionMode">
                <el-radio label="parallel">并行执行</el-radio>
                <el-radio label="sequential">顺序执行</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="最大并发数" prop="maxConcurrency" v-if="taskForm.executionMode === 'parallel'">
              <el-input-number v-model="taskForm.maxConcurrency" :min="1" :max="20" label="最大并发数" />
            </el-form-item>
            <el-form-item label="超时时间(分钟)" prop="timeout">
              <el-input-number v-model="taskForm.timeout" :min="1" :max="1440" label="超时时间" />
            </el-form-item>
            <el-form-item label="执行参数">
              <el-input v-model="taskForm.executionParams" type="textarea" placeholder="请输入执行参数(JSON格式)" />
            </el-form-item>
            <el-form-item label="上传文件">
              <el-upload
                class="upload-demo"
                drag
                :action="getUploadAction()"
                :on-change="handleFileChange"
                :on-remove="handleFileRemove"
                :file-list="fileList"
                multiple
                :limit="5"
                :on-exceed="handleExceed"
                :before-upload="beforeUpload"
              >
                <el-icon><upload-filled /></el-icon>
                <div class="el-upload__text">
                  点击或拖拽文件到此处上传
                </div>
                <template #tip>
                  <div class="el-upload__tip text-center">
                    支持扩展名：.zip, .tar.gz, .tgz，单个文件不超过100MB，最多上传5个文件
                  </div>
                </template>
              </el-upload>
            </el-form-item>
          </el-form>
        </div>

        <!-- 步骤3: 确认提交 -->
        <div v-if="currentStep === 2" class="step-content">
          <el-descriptions border column="1" class="task-confirm">
            <el-descriptions-item label="任务名称">{{ taskForm.name }}</el-descriptions-item>
            <el-descriptions-item label="选择环境">{{ getEnvironmentName(taskForm.environmentId) }}</el-descriptions-item>
            <el-descriptions-item label="任务描述">{{ taskForm.description || '-' }}</el-descriptions-item>
            <el-descriptions-item label="分支包">{{ taskForm.branchPackage || '-' }}</el-descriptions-item>
            <el-descriptions-item label="测试用例集">{{ getTestSuiteName(taskForm.testSuite) }}</el-descriptions-item>
            <el-descriptions-item label="执行模式">{{ taskForm.executionMode === 'parallel' ? '并行执行' : '顺序执行' }}</el-descriptions-item>
            <el-descriptions-item label="最大并发数" v-if="taskForm.executionMode === 'parallel'">
              {{ taskForm.maxConcurrency || '-' }}
            </el-descriptions-item>
            <el-descriptions-item label="超时时间">{{ taskForm.timeout || '-' }}分钟</el-descriptions-item>
            <el-descriptions-item label="执行参数">{{ taskForm.executionParams || '-' }}</el-descriptions-item>
            <el-descriptions-item label="上传文件" v-if="fileList.length > 0">
              <div>
                <el-tag v-for="file in fileList" :key="file.uid" closable @close="handleFileRemove(file)">
                  {{ file.name }}
                </el-tag>
              </div>
            </el-descriptions-item>
          </el-descriptions>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <el-button v-if="currentStep > 0" @click="prevStep">上一步</el-button>
        <el-button v-if="currentStep < 2" type="primary" @click="nextStep">下一步</el-button>
        <el-button v-if="currentStep === 2" type="primary" @click="submitTask">提交任务</el-button>
        <el-button @click="cancelTask">取消</el-button>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { UploadFilled } from '@element-plus/icons-vue'

export default {
  name: 'AddTask',
  components: {
    UploadFilled
  },
  setup() {
    // 当前步骤
    const currentStep = ref(0)
    
    // 表单引用
    const step1FormRef = ref(null)
    const step2FormRef = ref(null)
    
    // 任务表单数据
    const taskForm = reactive({
      name: '',
      environmentId: '',
      description: '',
      branchPackage: '',
      testSuite: '',
      executionMode: 'parallel',
      maxConcurrency: 5,
      timeout: 60,
      executionParams: ''
    })
    
    // 环境列表
    const environments = ref([
      { id: '1', name: '测试环境1' },
      { id: '2', name: '开发环境1' },
      { id: '3', name: '生产环境1' }
    ])
    
    // 测试用例集
    const testSuites = ref([
      { id: '1', name: '芯片功能测试集' },
      { id: '2', name: '性能压力测试集' },
      { id: '3', name: '兼容性测试集' },
      { id: '4', name: '安全漏洞测试集' }
    ])
    
    // 分支包文件列表
    const branchFiles = ref([])
    
    // 上传文件列表
    const fileList = ref([])
    
    // 步骤1验证规则
    const step1Rules = {
      name: [
        { required: true, message: '请输入任务名称', trigger: 'blur' },
        { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
      ],
      environmentId: [
        { required: true, message: '请选择测试环境', trigger: 'change' }
      ],
      branchPackage: [
        { required: true, message: '请输入分支包路径', trigger: 'blur' }
      ]
    }
    
    // 步骤2验证规则
    const step2Rules = {
      testSuite: [
        { required: true, message: '请选择测试用例集', trigger: 'change' }
      ],
      timeout: [
        { required: true, message: '请输入超时时间', trigger: 'change' }
      ]
    }
    
    // 分支包路径变化处理
    const handleBranchPackageChange = (value) => {
      // 模拟加载分支包文件
      if (value) {
        // 模拟延迟
        setTimeout(() => {
          branchFiles.value = [
            'main.js',
            'utils.js',
            'config.json',
            'test_module.py'
          ]
          ElMessage({ message: '分支包文件加载成功', type: 'success' })
        }, 500)
      } else {
        branchFiles.value = []
      }
    }
    
    // 移除分支包文件
    const handleRemoveBranchFile = (file) => {
      const index = branchFiles.value.indexOf(file)
      if (index > -1) {
        branchFiles.value.splice(index, 1)
      }
    }
    
    // 获取上传接口（实际项目中需要替换为真实接口）
    const getUploadAction = () => {
      // 这里返回模拟的上传接口地址
      return '/api/upload'
    }
    
    // 文件变化处理
    const handleFileChange = (file, fileList) => {
      // 模拟上传成功
      ElMessage({ message: `文件 ${file.name} 上传成功`, type: 'success' })
    }
    
    // 文件移除处理
    const handleFileRemove = (file) => {
      // 模拟文件移除
      ElMessage({ message: `文件 ${file.name} 已移除`, type: 'info' })
    }
    
    // 文件超出限制处理
    const handleExceed = (files, fileList) => {
      ElMessage({ message: `最多只能上传5个文件，已选择${files.length + fileList.length}个文件`, type: 'warning' })
    }
    
    // 上传前校验
    const beforeUpload = (file) => {
      const isLt100M = file.size / 1024 / 1024 < 100
      const isAllowedType = /\.(zip|tar\.gz|tgz)$/.test(file.name.toLowerCase())
      
      if (!isAllowedType) {
        ElMessage.error('只能上传 .zip, .tar.gz, .tgz 格式的文件')
        return false
      }
      
      if (!isLt100M) {
        ElMessage.error('文件大小不能超过100MB')
        return false
      }
      
      return true
    }
    
    // 根据环境ID获取环境名称
    const getEnvironmentName = (id) => {
      const env = environments.value.find(item => item.id === id)
      return env ? env.name : '-' 
    }
    
    // 根据测试用例集ID获取名称
    const getTestSuiteName = (id) => {
      const suite = testSuites.value.find(item => item.id === id)
      return suite ? suite.name : '-' 
    }
    
    // 下一步
    const nextStep = () => {
      if (currentStep.value === 0) {
        // 验证步骤1表单
        step1FormRef.value.validate((valid) => {
          if (valid) {
            currentStep.value++
          }
        })
      } else if (currentStep.value === 1) {
        // 验证步骤2表单
        step2FormRef.value.validate((valid) => {
          if (valid) {
            currentStep.value++
          }
        })
      }
    }
    
    // 上一步
    const prevStep = () => {
      currentStep.value--
    }
    
    // 提交任务
    const submitTask = () => {
      ElMessage.loading('任务提交中，请稍候...', { duration: 2000 })
      
      // 模拟提交请求
      setTimeout(() => {
        ElMessage({ message: '任务提交成功', type: 'success' })
        // 实际项目中这里应该跳转到任务列表或任务详情页
        cancelTask()
      }, 2000)
    }
    
    // 取消任务
    const cancelTask = () => {
      // 重置表单
      currentStep.value = 0
      Object.assign(taskForm, {
        name: '',
        environmentId: '',
        description: '',
        branchPackage: '',
        testSuite: '',
        executionMode: 'parallel',
        maxConcurrency: 5,
        timeout: 60,
        executionParams: ''
      })
      branchFiles.value = []
      fileList.value = []
      
      if (step1FormRef.value) {
        step1FormRef.value.resetFields()
      }
      if (step2FormRef.value) {
        step2FormRef.value.resetFields()
      }
      
      // 实际项目中这里应该返回上一页
    }
    
    // 组件挂载时的逻辑
    onMounted(() => {
      // 初始化数据
    })
    
    return {
      currentStep,
      step1FormRef,
      step2FormRef,
      taskForm,
      environments,
      testSuites,
      branchFiles,
      fileList,
      step1Rules,
      step2Rules,
      handleBranchPackageChange,
      handleRemoveBranchFile,
      getUploadAction,
      handleFileChange,
      handleFileRemove,
      handleExceed,
      beforeUpload,
      getEnvironmentName,
      getTestSuiteName,
      nextStep,
      prevStep,
      submitTask,
      cancelTask
    }
  }
}
</script>

<style scoped>
.add-task-container {
  width: 100%;
}

.steps-container {
  margin-bottom: 30px;
}

.step-content {
  padding: 20px;
  background-color: #fafafa;
  border-radius: 8px;
}

.branch-files {
  margin-top: 10px;
  padding: 10px;
  background-color: #f0f9ff;
  border-radius: 4px;
}

.branch-files p {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #666;
}

.branch-files .el-tag {
  margin-right: 10px;
  margin-bottom: 10px;
}

.task-confirm {
  background-color: #fafafa;
  padding: 20px;
}

.task-confirm .el-descriptions__label {
  font-weight: 600;
}

.action-buttons {
  margin-top: 30px;
  text-align: center;
}

.action-buttons .el-button {
  margin: 0 10px;
  min-width: 80px;
}
</style>