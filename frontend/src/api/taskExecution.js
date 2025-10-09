import service from './axios.js';

/**
 * 创建执行任务
 * @param {Object} data - 任务数据
 * @param {string} data.name - 任务名称
 * @param {string} data.env_id - 环境ID
 * @param {string} data.description - 任务描述
 * @param {string} data.branch_package - 分支包路径
 * @param {string} data.suite_id - 测试用例集ID (对应tb_test_suite表的suite_id字段)
 * @param {string} data.execution_mode - 执行模式 (parallel/sequential)
 * @param {number} data.max_concurrency - 最大并发数
 * @param {number} data.timeout - 超时时间(分钟)
 * @param {string} data.execution_params - 执行参数(JSON格式)
 * @returns {Promise}
 */
export const createTaskExecution = (data) => {
  return service.post('/tasks/', data)
}

/**
 * 获取任务列表
 * @param {Object} params - 查询参数
 * @param {string} params.name - 任务名称模糊查询
 * @param {string} params.status - 任务状态
 * @param {string} params.env_id - 环境ID
 * @param {string} params.suite_id - 测试用例集ID (对应tb_test_suite表的suite_id字段)
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export const getTaskExecutionList = (params = {}) => {
  return service.get('/tasks/', {
    params
  })
}

/**
 * 获取单个任务详情
 * @param {string} id - 任务ID
 * @returns {Promise}
 */
export const getTaskExecutionDetail = (id) => {
  return service.get(`/tasks/${id}/`)
}

/**
 * 更新任务
 * @param {string} id - 任务ID
 * @param {Object} data - 更新的任务数据
 * @returns {Promise}
 */
export const updateTaskExecution = (id, data) => {
  return service.put(`/tasks/${id}/`, data)
}

/**
 * 删除任务
 * @param {string} id - 任务ID
 * @returns {Promise}
 */
export const deleteTaskExecution = (id) => {
  return service.delete(`/tasks/${id}/`)
}

/**
 * 批量删除任务
 * @param {Array} ids - 任务ID数组
 * @returns {Promise}
 */
export const batchDeleteTaskExecution = (ids) => {
  return service.delete('/tasks/batch/', {
    data: { ids }
  })
}

/**
 * 获取任务状态
 * @param {string} id - 任务ID
 * @returns {Promise}
 */
export const getTaskExecutionStatus = (id) => {
  return service.get(`/tasks/${id}/status/`)
}

/**
 * 启动任务
 * @param {string} id - 任务ID
 * @returns {Promise}
 */
export const startTaskExecution = (id) => {
  return service.post(`/tasks/${id}/start/`)
}

/**
 * 暂停任务
 * @param {string} id - 任务ID
 * @returns {Promise}
 */
export const pauseTaskExecution = (id) => {
  return service.post(`/tasks/${id}/pause/`)
}

/**
 * 恢复任务
 * @param {string} id - 任务ID
 * @returns {Promise}
 */
export const resumeTaskExecution = (id) => {
  return service.post(`/tasks/${id}/resume/`)
}

/**
 * 终止任务
 * @param {string} id - 任务ID
 * @returns {Promise}
 */
export const terminateTaskExecution = (id) => {
  return service.post(`/tasks/${id}/terminate/`)
}

/**
 * 获取任务统计信息
 * @returns {Promise}
 */
export const getTaskExecutionStatistics = () => {
  return service.get('/tasks/statistics/')
}