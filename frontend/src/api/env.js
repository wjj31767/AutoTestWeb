import service from './axios.js'

/**
 * 获取环境列表
 * @param {Object} params - 查询参数
 * @param {string} params.name - 环境名称模糊查询
 * @param {string} params.type - 环境类型
 * @param {string} params.status - 环境状态
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export const getEnvironmentList = (params = {}) => {
  return service.get('/environments/', {
    params
  })
}

/**
 * 获取单个环境详情
 * @param {string} id - 环境ID
 * @returns {Promise}
 */
export const getEnvironmentDetail = (id) => {
  return service.get(`/environments/${id}/`)
}

/**
 * 创建环境
 * @param {Object} data - 环境数据
 * @param {string} data.name - 环境名称
 * @param {string} data.type - 环境类型
 * @param {string} data.description - 环境描述
 * @param {string} data.status - 环境状态
 * @param {string} data.conn_type - 连接类型
 * @param {string} data.owner - 拥有者
 * @param {string} data.admin - 管理员
 * @param {string} data.admin_password - 管理员密码
 * @param {string} data.cabinet_frame_slot - 机柜位置
 * @param {string} data.port - 端口
 * @returns {Promise}
 */
export const createEnvironment = (data) => {
  return service.post('/environments/', data)
}

/**
 * 更新环境
 * @param {string} id - 环境ID
 * @param {Object} data - 更新的环境数据
 * @returns {Promise}
 */
export const updateEnvironment = (id, data) => {
  return service.put(`/environments/${id}/`, data)
}

/**
 * 删除环境
 * @param {string} id - 环境ID
 * @returns {Promise}
 */
export const deleteEnvironment = (id) => {
  return service.delete(`/environments/${id}/`)
}

/**
 * 批量删除环境
 * @param {Array} ids - 环境ID数组
 * @returns {Promise}
 */
export const batchDeleteEnvironment = (ids) => {
  return service.delete('/environments/batch/', {
    data: { ids }
  })
}

/**
 * 检查环境连通性
 * @param {string} id - 环境ID
 * @returns {Promise}
 */
export const checkEnvironmentConnectivity = (id) => {
  return service.post(`/environments/${id}/check_connectivity/`)
}

/**
 * 获取环境状态
 * @param {string} id - 环境ID
 * @returns {Promise}
 */
export const getEnvironmentStatus = (id) => {
  return service.get(`/environments/${id}/status/`)
}

/**
 * 更新环境状态
 * @param {string} id - 环境ID
 * @param {string} status - 新的状态值
 * @returns {Promise}
 */
export const updateEnvironmentStatus = (id, status) => {
  return service.patch(`/environments/${id}/`, { status })
}

export default {
  getEnvironmentList,
  getEnvironmentDetail,
  createEnvironment,
  updateEnvironment,
  deleteEnvironment,
  batchDeleteEnvironment,
  checkEnvironmentConnectivity,
  getEnvironmentStatus,
  updateEnvironmentStatus
}