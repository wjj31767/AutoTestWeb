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
              <el-option label="FPGA" value="FPGA" />
              <el-option label="仿真环境" value="simulation" />
              <el-option label="测试板" value="testboard" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" style="width: 120px;">
            <el-option label="可用" value="available" />
            <el-option label="占用中" value="occupied" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="故障" value="faulty" />
          </el-select>
        </el-form-item>
        <el-form-item label="IP地址">
          <el-input v-model="searchForm.ip" placeholder="请输入IP地址" style="width: 150px;" />
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
      <!-- 使用计算属性确保表格数据正确响应分页变化 -->
      <el-table
        v-loading="loading"
        :data="displayedEnvList"
        style="width: 100%"
        @selection-change="handleSelectionChange"
        @row-dblclick="handleRowDblClick"
        @sort-change="handleSortChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="id" label="环境ID" width="80" />
        <el-table-column prop="name" label="环境名称" width="180" sortable="custom">
          <template #default="scope">
            <el-tag>{{ scope.row.name }}</el-tag>
          </template>
          <template #header-cell="scope">
            <div @click="handleSort('name', scope)">
              <span>{{ scope.column.label }}</span>
              <span v-if="sortInfo.sortField === 'name'">
                <i v-if="sortInfo.sortOrder === 'asc'" class="caret-top" />
                <i v-else class="caret-bottom" />
              </span>
              <span v-else>
                <i class="caret-top inactive-sort-icon" />
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="环境类型" width="120">
          <template #default="scope">
            <el-tag :type="getTypeTag(scope.row.type)">{{ getTypeLabel(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="create_time" label="创建时间" width="180" sortable="custom">
          <template #header-cell="scope">
            <div @click="handleSort('create_time', scope)">
              <span>{{ scope.column.label }}</span>
              <span v-if="sortInfo.sortField === 'create_time'">
                <i v-if="sortInfo.sortOrder === 'asc'" class="caret-top" />
                <i v-else class="caret-bottom" />
              </span>
              <span v-else>
                <i class="caret-top inactive-sort-icon" />
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="update_time" label="更新时间" width="180" sortable="custom">
          <template #header-cell="scope">
            <div @click="handleSort('update_time', scope)">
              <span>{{ scope.column.label }}</span>
              <span v-if="sortInfo.sortField === 'update_time'">
                <i v-if="sortInfo.sortOrder === 'asc'" class="caret-top" />
                <i v-else class="caret-bottom" />
              </span>
              <span v-else>
                <i class="caret-top inactive-sort-icon" />
              </span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">{{ getStatusLabel(scope.row.status) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
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
              size="small"
              @click="handleCheckConnectivity(scope.row.id, scope.row.name)"
            >
              连通性检查
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
            <el-option label="FPGA" value="FPGA" />
            <el-option label="仿真环境" value="simulation" />
            <el-option label="测试板" value="testboard" />
          </el-select>
        </el-form-item>
        <el-form-item label="连接类型" prop="conn_type">
          <el-select v-model="envForm.conn_type" placeholder="请选择连接类型">
            <el-option label="SSH" value="SSH" />
            <el-option label="Telnet" value="Telnet" />
            <el-option label="串口" value="Serial" />
            <el-option label="Redirect" value="Redirect" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="envForm.status" placeholder="请选择状态">
            <el-option label="可用" value="available" />
            <el-option label="占用中" value="occupied" />
            <el-option label="维护中" value="maintenance" />
            <el-option label="故障" value="faulty" />
          </el-select>
        </el-form-item>
          <el-form-item label="管理员" prop="admin">
          <el-input v-model="envForm.admin" placeholder="请输入管理员" />
        </el-form-item>
        <el-form-item label="管理员密码" prop="admin_password">
          <el-input v-model="envForm.admin_password" type="password" placeholder="请输入管理员密码" />
        </el-form-item>
        <el-form-item label="机柜位置" prop="cabinet_frame_slot">
          <el-input v-model="envForm.cabinet_frame_slot" placeholder="请输入机柜位置" />
        </el-form-item>
        <el-form-item label="端口" prop="port">
          <el-input v-model="envForm.port" placeholder="请输入端口" />
        </el-form-item>
        <el-form-item label="IP地址" prop="ip">
          <el-input v-model="envForm.ip" placeholder="请输入IP地址" />
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

    <!-- 环境详情弹窗 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="环境详情"
      width="600px"
      @close="handleDetailDialogClose"
    >
      <div class="detail-container">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="环境名称">{{ envDetail.name }}</el-descriptions-item>
          <el-descriptions-item label="环境类型">{{ getTypeLabel(envDetail.type) }}</el-descriptions-item>
          <el-descriptions-item label="连接类型">{{ envDetail.conn_type }}</el-descriptions-item>
          <el-descriptions-item label="状态">{{ getStatusLabel(envDetail.status) }}</el-descriptions-item>
          <el-descriptions-item label="管理员">{{ envDetail.admin || '-' }}</el-descriptions-item>
          <el-descriptions-item label="机柜位置">{{ envDetail.cabinet_frame_slot || '-' }}</el-descriptions-item>
          <el-descriptions-item label="端口">{{ envDetail.port || '-' }}</el-descriptions-item>
          <el-descriptions-item label="IP地址">{{ envDetail.ip || '-' }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDate(envDetail.create_time) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDate(envDetail.update_time) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as envApi from '../api/env.js'

export default {
  name: 'EnvList',
  setup() {
    // 搜索表单数据
    const searchForm = reactive({
      name: '',
      type: '',
      status: '',
      ip: ''
    })

    // 环境列表数据
    const envList = ref([])
    // 加载状态
    const loading = ref(false)
    // 选中的行
    const selectedRows = ref([])
    
    // 分页数据 - 使用单独的ref变量来确保响应式更新
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalCount = ref(0)
    
    // 显示在表格中的数据
    const displayedEnvList = computed(() => {
      console.log('计算显示数据，当前envList长度:', envList.value.length);
      console.log('当前分页大小:', pageSize.value);
      console.log('当前页码:', currentPage.value);
      
      // 直接返回后端返回的数据，不再进行前端分页
      // 后端已经根据page和pageSize返回了对应页的数据
      console.log('直接返回后端分页数据，长度:', envList.value.length);
      console.log('displayedEnvList返回的数据:', envList.value);
      
      return envList.value;
    })

    // 排序相关数据
    const sortInfo = reactive({
      sortField: '', // 当前排序字段
      sortOrder: ''  // 当前排序方向：'asc'升序，'desc'降序
    })

    // 对话框相关
    const dialogVisible = ref(false)
    const envFormRef = ref(null)
    const envForm = reactive({
      id: '',
      name: '',
      type: '',
      description: '',
      status: 'available',
      conn_type: '',

      admin: '',
      admin_password: '',
      cabinet_frame_slot: '',
      port: '',
      ip: ''
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
      conn_type: [
        { required: true, message: '请选择连接类型', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ],
      admin: [
        { required: true, message: '请输入管理员', trigger: 'blur' }
      ],
      admin_password: [
        { required: true, message: '请输入管理员密码', trigger: 'blur' }
      ],
      ip: [
        { required: true, message: '请输入IP地址', trigger: 'blur' },
        { 
          pattern: /^((25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/, 
          message: '请输入有效的IPv4地址', 
          trigger: 'blur' 
        }
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
        FPGA: 'primary',
        simulation: 'success',
        testboard: 'warning'
      }
      return tagMap[type] || 'info'
    }

    // 根据环境类型获取标签文本
    const getTypeLabel = (type) => {
      const labelMap = {
        FPGA: 'FPGA',
        simulation: '仿真环境',
        testboard: '测试板'
      }
      return labelMap[type] || type
    }

    // 根据环境状态获取标签类型
    const getStatusTag = (status) => {
      const tagMap = {
        available: 'success',
        occupied: 'warning',
        maintenance: 'info',
        faulty: 'danger'
      }
      return tagMap[status] || 'info'
    }

    // 根据环境状态获取标签文本
    const getStatusLabel = (status) => {
      const labelMap = {
        available: '可用',
        occupied: '占用中',
        maintenance: '维护中',
        faulty: '故障'
      }
      return labelMap[status] || status
    }

    // 手动触发强制更新的标记
    const forceUpdate = ref(0)
    
    // 加载环境列表
    const loadEnvList = async () => {
      // 强制增加一个随机参数，确保每次请求都是新的，防止缓存问题
      forceUpdate.value++;
      console.log('加载环境列表，当前pageSize:', pageSize.value, '强制更新标记:', forceUpdate.value);
      loading.value = true
      try {
        // 构建请求参数，确保使用最新的pageSize值
        const params = {
          page: currentPage.value,
          // 明确使用pageSize值，并添加备用参数名，以防后端期望不同的参数名
          pageSize: parseInt(pageSize.value) || 10,
          page_size: parseInt(pageSize.value) || 10,
          limit: parseInt(pageSize.value) || 10,
          // 添加时间戳，确保请求不被缓存
          _t: Date.now()
        }
        
        console.log('构建的请求参数:', params);
          // 对于type和status字段，直接作为参数传递
          if (searchForm.type) {
            params.type = searchForm.type
          }
          if (searchForm.status) {
            params.status = searchForm.status
          }
          
          // 对于name和ip字段，合并到search参数中
          const searchValues = []
          if (searchForm.name) {
            searchValues.push(searchForm.name)
          }
          if (searchForm.ip) {
            searchValues.push(searchForm.ip)
          }
          if (searchValues.length > 0) {
            params.search = searchValues.join(' ')
          }
          
          // 添加排序参数
          if (sortInfo.sortField && sortInfo.sortOrder) {
            const orderPrefix = sortInfo.sortOrder === 'desc' ? '-' : ''
            params.ordering = orderPrefix + sortInfo.sortField
          }
          
          // 打印完整的请求信息进行调试
          console.log('发送到API的完整请求参数:', JSON.stringify(params));
          
          const res = await envApi.getEnvironmentList(params)
          console.log('API响应状态码:', res.status);
          
          // 确保res是对象
          if (typeof res !== 'object' || res === null) {
            console.warn('响应数据格式不正确，设置为空数据');
            envList.value = [];
            totalCount.value = 0;
            return;
          }
          
          // 确保有正确的数据结构并处理
          let responseData = res.data || res;
          
          console.log('响应数据结构:', JSON.stringify(responseData));
          
          // 检查多种可能的数据结构
          if (responseData.results && Array.isArray(responseData.results)) {
            // 标准分页结构：{ results: [], count: number }
            envList.value = responseData.results;
            totalCount.value = typeof responseData.count === 'number' ? responseData.count : responseData.results.length;
          } else if (Array.isArray(responseData)) {
            // 直接返回数组的情况
            envList.value = responseData;
            totalCount.value = responseData.length;
          } else {
            // 其他情况
            envList.value = [];
            totalCount.value = 0;
          }
          
          // 打印加载结果信息
          console.log('加载结果 - 请求pageSize:', pageSize.value, '返回数据量:', envList.value.length);
          console.log('总数据量:', totalCount.value);
          
          // 检查是否获取了正确数量的数据
          if (envList.value.length !== parseInt(pageSize.value) && totalCount.value > envList.value.length) {
            console.warn('警告: 返回的数据量与请求的pageSize不匹配');
          }
        } catch (error) {
          ElMessage({ message: '获取环境列表失败', type: 'error' })
          console.error('获取环境列表失败:', error);
          envList.value = [];
          totalCount.value = 0;
        } finally {
          // 确保无论成功失败都会停止加载
          loading.value = false;
        }
      }

    // 搜索
    const handleSearch = () => {
      currentPage.value = 1
      loadEnvList()
    }

    // 处理自定义排序
    const handleSort = (field, scope) => {
      // 如果点击的是当前排序字段，则切换排序方向
      if (sortInfo.sortField === field) {
        sortInfo.sortOrder = sortInfo.sortOrder === 'asc' ? 'desc' : 'asc'
      } else {
        // 否则设置新的排序字段，并默认为升序
        sortInfo.sortField = field
        sortInfo.sortOrder = 'asc'
      }
      // 重新加载数据
      loadEnvList()
    }

    // 处理表格排序变化事件
    const handleSortChange = ({ prop, order }) => {
      if (order) {
        sortInfo.sortField = prop
        sortInfo.sortOrder = order === 'ascending' ? 'asc' : 'desc'
        loadEnvList()
      } else {
        // 清除排序
        sortInfo.sortField = ''
        sortInfo.sortOrder = ''
      }
    }

    // 重置搜索
    const handleReset = () => {
      searchForm.name = ''
      searchForm.type = ''
      searchForm.status = ''
      searchForm.ip = ''
      currentPage.value = 1
      // 重置排序信息
      sortInfo.sortField = ''
      sortInfo.sortOrder = ''
      loadEnvList()
    }

    // 分页大小变化
    const handleSizeChange = (size) => {
      console.log('分页大小变化，新的pageSize:', size);
      // 确保size是有效的数值
      const newPageSize = parseInt(size) || 10;
      
      // 显式设置分页大小并使用$nextTick确保DOM更新后再加载数据
      pageSize.value = newPageSize;
      
      // 重置到第一页
      currentPage.value = 1;
      
      // 使用setTimeout强制异步执行，确保值已更新
      setTimeout(() => {
        console.log('强制重新加载数据，pageSize:', pageSize.value);
        loadEnvList();
      }, 100);
    }

    // 当前页变化
    const handleCurrentChange = (current) => {
      console.log('当前页码变化，新的页码:', current);
      currentPage.value = current;
      console.log('currentPage设置后的值:', currentPage.value);
      loadEnvList();
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
        status: 'available',
        conn_type: '',

        admin: '',
        admin_password: '',
        cabinet_frame_slot: '',
        port: '',
        ip: ''
      })
      if (envFormRef.value) {
        envFormRef.value.resetFields()
      }
      dialogVisible.value = true
    }

    // 编辑环境
    const handleEditEnv = async (row) => {
      try {
        const res = await envApi.getEnvironmentDetail(row.id)
        console.log('环境详情响应:', res);
        
        // 处理不同的响应数据结构
        if (res.data && typeof res.data === 'object') {
          // 有data字段的情况
          Object.assign(envForm, res.data)
        } else {
          // 没有data字段的情况
          Object.assign(envForm, res)
        }
        
        dialogVisible.value = true
      } catch (error) {
        console.error('获取环境详情失败:', error);
        ElMessage({ message: '获取环境详情失败', type: 'error' })
      }
    }

    // 环境详情弹窗状态
    const detailDialogVisible = ref(false)
    // 环境详情数据
    const envDetail = ref({})

    // 环境详情
    const handleViewDetail = async (row) => {
      try {
        const res = await envApi.getEnvironmentDetail(row.id)
        console.log('环境详情:', res)
        
        // 处理不同的响应数据结构
        let envDetailData = null
        if (res.data && typeof res.data === 'object') {
          // 有data字段的情况
          envDetailData = res.data
        } else {
          // 没有data字段的情况
          envDetailData = res
        }
        
        // 设置详情数据并显示弹窗
        envDetail.value = envDetailData
        detailDialogVisible.value = true
      } catch (error) {
        console.error('获取环境详情失败:', error);
        ElMessage({ message: '获取环境详情失败', type: 'error' })
      }
    }

    // 格式化日期
    const formatDate = (dateString) => {
      if (!dateString) return '-' 
      try {
        const date = new Date(dateString)
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      } catch (error) {
        console.error('日期格式化失败:', error)
        return dateString
      }
    }

    // 处理详情弹窗关闭
    const handleDetailDialogClose = () => {
      envDetail.value = {}
    }

    // 删除环境
    const handleDelete = (id) => {
      ElMessageBox.confirm('确定要删除该环境吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await envApi.deleteEnvironment(id)
          ElMessage({ message: '删除成功', type: 'success' })
          loadEnvList()
        } catch (error) {
          ElMessage({ message: '删除失败', type: 'error' })
        }
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
      
      const ids = selectedRows.value.map(row => row.id)
      
      ElMessageBox.confirm(`确定要删除选中的 ${selectedRows.value.length} 个环境吗？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await envApi.batchDeleteEnvironment(ids)
          ElMessage({ message: '批量删除成功', type: 'success' })
          loadEnvList()
        } catch (error) {
          ElMessage({ message: '批量删除失败', type: 'error' })
        }
      }).catch(() => {
        ElMessage({ message: '已取消删除', type: 'info' })
      })
    }

    // 刷新
    const handleRefresh = () => {
      loadEnvList()
    }

    // 检查连通性
    const handleCheckConnectivity = async (id, name) => {
      try {
        ElMessage({ message: `开始检查环境 ${name} 的连通性`, type: 'info' })
        const res = await envApi.checkEnvironmentConnectivity(id)
        ElMessage({ message: res.message || '连通性检查成功', type: 'success' })
        loadEnvList() // 刷新列表，更新最后检查时间
      } catch (error) {
        ElMessage({ message: '连通性检查失败', type: 'error' })
      }
    }

    // 提交表单
    const handleSubmit = async () => {
      envFormRef.value.validate(async (valid) => {
        if (valid) {
          try {
            if (envForm.id) {
              // 更新环境
              await envApi.updateEnvironment(envForm.id, envForm)
              ElMessage({ message: '环境更新成功', type: 'success' })
            } else {
              // 新增环境
              await envApi.createEnvironment(envForm)
              ElMessage({ message: '环境创建成功', type: 'success' })
            }
            dialogVisible.value = false
            loadEnvList()
          } catch (error) {
            console.error('环境操作失败:', error);
            // 处理权限错误
            if (error.response && error.response.status === 403) {
              ElMessage({
                message: '您没有权限执行此操作，请联系管理员',
                type: 'error',
                duration: 5000
              })
            } else {
              ElMessage({
                message: envForm.id ? '环境更新失败' : '环境创建失败',
                type: 'error'
              })
            }
          }
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
      displayedEnvList,
      loading,
      selectedRows,
      currentPage,
      pageSize,
      totalCount,
      dialogVisible,
      envFormRef,
      envForm,
      formRules,
      dialogTitle,
      getTypeTag,
      getTypeLabel,
      getStatusTag,
      getStatusLabel,
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
      handleCheckConnectivity,
      handleSubmit,
      handleDialogClose,
      sortInfo,
      handleSort,
      handleSortChange,
      detailDialogVisible,
      envDetail,
      formatDate,
      handleDetailDialogClose
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

/* 未激活的排序图标样式 */
.inactive-sort-icon {
  opacity: 1; /* 完全不透明 */
  font-size: 18px; /* 进一步增大图标尺寸 */
  color: #409eff !important; /* 直接使用激活的蓝色 */
  margin-left: 5px;
}

/* 激活的排序图标样式 */
.el-table .el-table__header-wrapper .el-table__header th .cell > div i.caret-top,
.el-table .el-table__header-wrapper .el-table__header th .cell > div i.caret-bottom {
  font-size: 18px; /* 进一步增大激活图标的尺寸 */
  color: #409eff; /* 设置醒目的蓝色 */
  font-weight: bold;
  margin-left: 5px;
}

/* 表头点击区域样式 */
.el-table .el-table__header-wrapper .el-table__header th .cell > div {
  cursor: pointer;
  display: flex;
  align-items: center;
  padding: 8px 0; /* 增加点击区域 */
  user-select: none;
}

.el-table .el-table__header-wrapper .el-table__header th .cell > div > span {
  margin-right: 5px;
}

/* 鼠标悬停时的样式 */
.el-table .el-table__header-wrapper .el-table__header th .cell > div:hover i.caret-top,
.el-table .el-table__header-wrapper .el-table__header th .cell > div:hover i.caret-bottom {
  color: #409eff !important; /* 悬停时统一变为蓝色 */
  opacity: 1 !important; /* 悬停时完全不透明 */
  transform: scale(1.1); /* 悬停时略微放大 */
  transition: all 0.2s ease; /* 添加过渡效果 */
}

/* 详情弹窗样式 */
.detail-container {
  padding: 10px 0;
}

.el-descriptions {
  margin-top: 10px;
}

.el-descriptions-item {
  font-size: 14px;
  line-height: 1.8;
}

.el-descriptions-item__label {
  font-weight: 600;
  color: #606266;
}

.el-descriptions-item__content {
  color: #303133;
}
</style>