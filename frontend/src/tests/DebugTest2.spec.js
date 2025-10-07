const { describe, it } = require('@jest/globals')

// 调试文件，尝试不同的导入方式
describe('DebugTest2', () => {
  it('should try different import methods for @vue/test-utils', () => {
    try {
      // 尝试从默认导出中获取mount
      const testUtils = require('@vue/test-utils')
      console.log('Import as require:', testUtils)
      console.log('Default export:', testUtils.default)
      if (testUtils.default) {
        console.log('Default export has mount:', typeof testUtils.default.mount)
      }
      
      // 尝试解构导入
      const { mount } = testUtils
      console.log('Destructured mount:', typeof mount)
      
    } catch (error) {
      console.error('Error in DebugTest2:', error)
    }
  })
})