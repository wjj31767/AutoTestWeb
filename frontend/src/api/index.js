// 创建API服务基础目录和axios配置文件
// 导入所有API服务
import envApi from './env.js'
import moduleApi from './module.js'
import * as testSuiteApi from './testSuite.js'
import * as featureTestCaseApi from './featureTestCase.js'

// 导出所有API服务
export default {
  env: envApi,
  module: moduleApi,
  testSuite: testSuiteApi,
  featureTestCase: featureTestCaseApi
}

export const initApiService = () => {
  console.log('API服务初始化完成')
}