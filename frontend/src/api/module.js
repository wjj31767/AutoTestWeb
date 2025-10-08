import service from './axios.js'

/**
 * 获取模块列表
 * @param {Object} params - 查询参数
 * @param {string} params.module_name - 模块名称模糊查询
 * @param {string} params.chip_model - 芯片型号
 * @param {string} params.creator - 创建者
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export const getModuleList = (params = {}) => {
  return service.get('/modules/', {
    params
  })
}

/**
 * 获取单个模块详情
 * @param {string} id - 模块ID
 * @returns {Promise}
 */
export const getModuleDetail = (id) => {
  return service.get(`/modules/${id}/`)
}

/**
 * 创建模块
 * @param {Object} data - 模块数据
 * @param {string} data.module_name - 模块名称
 * @param {string} data.chip_model - 芯片型号
 * @param {string} data.description - 模块描述
 * @param {string} data.visible_scope - 可见范围 (private/project)
 * @returns {Promise}
 */
export const createModule = (data) => {
  return service.post('/modules/', data)
}

/**
 * 更新模块
 * @param {string} id - 模块ID
 * @param {Object} data - 更新的模块数据
 * @returns {Promise}
 */
export const updateModule = (id, data) => {
  return service.put(`/modules/${id}/`, data)
}

/**
 * 删除模块
 * @param {string} id - 模块ID
 * @returns {Promise}
 */
export const deleteModule = (id) => {
  return service.delete(`/modules/${id}/`)
}

/**
 * 批量删除模块
 * @param {Array} ids - 模块ID数组
 * @returns {Promise}
 */
export const batchDeleteModule = (ids) => {
  return service.delete('/modules/batch/', {
    data: { ids }
  })
}

/**
 * 获取特性列表
 * @param {Object} params - 查询参数
 * @param {string} params.feature_name - 特性名称模糊查询
 * @param {string} params.module_id - 模块ID
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export const getFeatureList = (params = {}) => {
  return service.get('/features/', {
    params
  })
}

/**
 * 获取单个特性详情
 * @param {string} id - 特性ID
 * @returns {Promise}
 */
export const getFeatureDetail = (id) => {
  return service.get(`/features/${id}/`)
}

/**
 * 创建特性
 * @param {Object} data - 特性数据
 * @param {string} data.feature_name - 特性名称
 * @param {string} data.module_id - 所属模块ID
 * @param {string} data.description - 特性描述
 * @returns {Promise}
 */
export const createFeature = (data) => {
  return service.post('/features/', data)
}

/**
 * 更新特性
 * @param {string} id - 特性ID
 * @param {Object} data - 更新的特性数据
 * @returns {Promise}
 */
export const updateFeature = (id, data) => {
  return service.put(`/features/${id}/`, data)
}

/**
 * 删除特性
 * @param {string} id - 特性ID
 * @returns {Promise}
 */
export const deleteFeature = (id) => {
  return service.delete(`/features/${id}/`)
}

/**
 * 批量删除特性
 * @param {Array} ids - 特性ID数组
 * @returns {Promise}
 */
export const batchDeleteFeature = (ids) => {
  return service.delete('/features/batch/', {
    data: { ids }
  })
}

export default {
  getModuleList,
  getModuleDetail,
  createModule,
  updateModule,
  deleteModule,
  batchDeleteModule,
  getFeatureList,
  getFeatureDetail,
  createFeature,
  updateFeature,
  deleteFeature,
  batchDeleteFeature
}