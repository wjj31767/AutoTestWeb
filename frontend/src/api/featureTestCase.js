import service from './axios.js'

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

/**
 * 获取测试用例列表
 * @param {Object} params - 查询参数
 * @param {string} params.case_name - 用例名称模糊查询
 * @param {string} params.feature_id - 特性ID
 * @param {string} params.status - 用例状态
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export const getTestCaseList = (params = {}) => {
  return service.get('/testcases/', {
    params
  })
}

/**
 * 获取单个测试用例详情
 * @param {string} id - 测试用例ID
 * @returns {Promise}
 */
export const getTestCaseDetail = (id) => {
  return service.get(`/testcases/${id}/`)
}

/**
 * 创建测试用例
 * @param {Object} data - 测试用例数据
 * @param {string} data.case_id - 用例ID
 * @param {string} data.case_name - 用例名称
 * @param {string} data.feature_id - 所属特性ID
 * @param {string} data.description - 用例描述
 * @param {string} data.pre_condition - 前置条件
 * @param {string} data.steps - 执行步骤
 * @param {string} data.expected_result - 预期结果
 * @param {string} data.script_path - 脚本路径
 * @param {string} data.status - 用例状态 (active/inactive/draft)
 * @returns {Promise}
 */
export const createTestCase = (data) => {
  return service.post('/testcases/', data)
}

/**
 * 更新测试用例
 * @param {string} id - 测试用例ID
 * @param {Object} data - 更新的测试用例数据
 * @returns {Promise}
 */
export const updateTestCase = (id, data) => {
  return service.put(`/testcases/${id}/`, data)
}

/**
 * 删除测试用例
 * @param {string} id - 测试用例ID
 * @returns {Promise}
 */
export const deleteTestCase = (id) => {
  return service.delete(`/testcases/${id}/`)
}

/**
 * 批量删除测试用例
 * @param {Array} ids - 测试用例ID数组
 * @returns {Promise}
 */
export const batchDeleteTestCase = (ids) => {
  return service.delete('/testcases/batch/', {
    data: { ids }
  })
}

export default {
  getFeatureList,
  getFeatureDetail,
  createFeature,
  updateFeature,
  deleteFeature,
  batchDeleteFeature,
  getTestCaseList,
  getTestCaseDetail,
  createTestCase,
  updateTestCase,
  deleteTestCase,
  batchDeleteTestCase
}