// 这个测试只验证Vitest的基本功能是否正常工作
// 不涉及任何Vue组件或其他外部依赖

import { it, expect, describe } from 'vitest'

describe('Vitest 基本功能测试', () => {
  it('应该能够执行简单的数学运算', () => {
    expect(1 + 1).toBe(2)
    expect(5 * 5).toBe(25)
    expect(10 - 5).toBe(5)
  })
  
  it('应该能够比较字符串', () => {
    expect('hello').toBe('hello')
    expect('hello').not.toBe('world')
    expect('hello').toContain('h')
  })
  
  it('应该能够测试布尔值', () => {
    expect(true).toBeTruthy()
    expect(false).toBeFalsy()
    expect(null).toBeFalsy()
    expect(undefined).toBeFalsy()
    expect(0).toBeFalsy()
    expect('').toBeFalsy()
  })
  
  it('应该能够测试对象', () => {
    const obj1 = { a: 1, b: 2 }
    const obj2 = { a: 1, b: 2 }
    
    expect(obj1).toEqual(obj2) // 深度比较
    expect(obj1).not.toBe(obj2) // 引用比较
  })
})