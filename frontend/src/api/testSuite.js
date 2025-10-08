import service from './axios.js';

/**
 * 获取测试套列表
 * @param {Object} params - 查询参数
 * @param {string} params.name - 测试套名称模糊查询
 * @param {string} params.visible_scope - 可见范围
 * @param {number} params.page - 页码
 * @param {number} params.pageSize - 每页条数
 * @returns {Promise}
 */
export const getTestSuiteList = (params = {}) => {
  return service.get('/test_suites/', {
    params
  })
}

/**
 * 获取单个测试套详情
 * @param {string} id - 测试套ID
 * @returns {Promise}
 */
export const getTestSuiteDetail = (id) => {
  return service.get(`/test_suites/${id}/`)
}

/**
 * 创建测试套
 * @param {Object} data - 测试套数据
 * @param {string} data.name - 测试套名称
 * @param {string} data.description - 测试套描述
 * @param {string} data.visible_scope - 可见范围 (private/project)
 * @param {number} data.case_count - 用例数量
 * @returns {Promise}
 */
export const createTestSuite = (data) => {
  return service.post('/test_suites/', data)
}

/**
 * 更新测试套
 * @param {string} id - 测试套ID
 * @param {Object} data - 更新的测试套数据
 * @returns {Promise}
 */
export const updateTestSuite = (id, data) => {
  return service.put(`/test_suites/${id}/`, data)
}

/**
 * 删除测试套
 * @param {string} id - 测试套ID
 * @returns {Promise}
 */
export const deleteTestSuite = (id) => {
  return service.delete(`/test_suites/${id}/`)
}

/**
 * 批量删除测试套
 * @param {Array} ids - 测试套ID数组
 * @returns {Promise}
 */
export const batchDeleteTestSuite = (ids) => {
  return service.delete('/test_suites/batch/', {
    data: { ids }
  })
}