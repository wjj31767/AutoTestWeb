const { describe, it } = require('@jest/globals')

// 调试文件，用于打印@vue/test-utils的结构
describe('DebugTest', () => {
  it('should print @vue/test-utils structure', () => {
    try {
      const testUtils = require('@vue/test-utils')
      console.log('@vue/test-utils content:', testUtils)
      console.log('typeof testUtils:', typeof testUtils)
      console.log('typeof testUtils.mount:', typeof testUtils.mount)
    } catch (error) {
      console.error('Error importing @vue/test-utils:', error)
    }
  })
})