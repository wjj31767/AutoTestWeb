import { describe, it, expect } from '@jest/globals'

// 假设这些是项目中可能用到的工具函数
// 在实际项目中，应该从实际的utils文件中导入

// 工具函数示例
const formatDate = (dateString) => {
  if (!dateString) return '-'
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN')
}

const formatDuration = (startTime, endTime) => {
  if (!startTime) return '-'
  if (!endTime) return '运行中'
  
  const start = new Date(startTime)
  const end = new Date(endTime)
  const durationMs = end - start
  
  // 计算分钟数
  const minutes = Math.floor(durationMs / (1000 * 60))
  
  if (minutes < 60) {
    return `${minutes}分钟`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}小时${remainingMinutes}分钟`
  }
}

const calculatePassRate = (successCount, totalCount) => {
  if (!totalCount || totalCount === 0) return 0
  return Math.round((successCount / totalCount) * 100)
}

const validateForm = (form, rules) => {
  const errors = []
  
  Object.keys(rules).forEach(key => {
    const value = form[key]
    const fieldRules = rules[key]
    
    if (fieldRules.required && (!value || (typeof value === 'string' && value.trim() === '')) && value !== 0 && value !== false) {
      errors.push(`${fieldRules.label || key}不能为空`)
    }
    
    if (fieldRules.min && value && typeof value === 'string' && value.length < fieldRules.min) {
      errors.push(`${fieldRules.label || key}长度不能少于${fieldRules.min}个字符`)
    }
    
    if (fieldRules.max && value && typeof value === 'string' && value.length > fieldRules.max) {
      errors.push(`${fieldRules.label || key}长度不能超过${fieldRules.max}个字符`)
    }
    
    if (fieldRules.pattern && value && !fieldRules.pattern.test(value)) {
      errors.push(fieldRules.message || `${fieldRules.label || key}格式不正确`)
    }
  })
  
  return {
    valid: errors.length === 0,
    errors
  }
}

describe('工具函数测试', () => {
  describe('formatDate', () => {
    it('应该正确格式化日期字符串', () => {
      const dateString = '2023-01-01T10:00:00'
      const result = formatDate(dateString)
      expect(result).toContain('2023')
      expect(result).toContain('10:00')
    })
    
    it('应该处理空日期字符串', () => {
      expect(formatDate('')).toBe('-')
      expect(formatDate(null)).toBe('-')
      expect(formatDate(undefined)).toBe('-')
    })
  })
  
  describe('formatDuration', () => {
    it('应该正确计算分钟级别的时长', () => {
      const startTime = '2023-01-01 10:00:00'
      const endTime = '2023-01-01 10:30:00'
      expect(formatDuration(startTime, endTime)).toBe('30分钟')
    })
    
    it('应该正确计算小时级别的时长', () => {
      const startTime = '2023-01-01 10:00:00'
      const endTime = '2023-01-01 12:15:00'
      expect(formatDuration(startTime, endTime)).toBe('2小时15分钟')
    })
    
    it('没有结束时间时应该显示运行中', () => {
      const startTime = '2023-01-01 10:00:00'
      expect(formatDuration(startTime)).toBe('运行中')
    })
    
    it('没有开始时间时应该显示-', () => {
      expect(formatDuration('')).toBe('-')
    })
  })
  
  describe('calculatePassRate', () => {
    it('应该正确计算通过率', () => {
      expect(calculatePassRate(95, 100)).toBe(95)
      expect(calculatePassRate(50, 100)).toBe(50)
      expect(calculatePassRate(0, 100)).toBe(0)
      expect(calculatePassRate(100, 100)).toBe(100)
    })
    
    it('应该处理总数为0的情况', () => {
      expect(calculatePassRate(0, 0)).toBe(0)
      expect(calculatePassRate(50, 0)).toBe(0)
    })
    
    it('应该处理小数情况并四舍五入', () => {
      expect(calculatePassRate(67, 100)).toBe(67)
      expect(calculatePassRate(66, 100)).toBe(66)
    })
  })
  
  describe('validateForm', () => {
    it('应该验证必填字段', () => {
      const form = {
        name: '',
        age: ''
      }
      
      const rules = {
        name: { required: true, label: '姓名' },
        age: { required: true, label: '年龄' }
      }
      
      const result = validateForm(form, rules)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('姓名不能为空')
      expect(result.errors).toContain('年龄不能为空')
    })
    
    it('应该验证字符串长度', () => {
      const form = {
        username: 'ab',
        password: 'abcdefghijklmnopqrstuvwxyz'
      }
      
      const rules = {
        username: { min: 3, max: 20, label: '用户名' },
        password: { min: 6, max: 20, label: '密码' }
      }
      
      const result = validateForm(form, rules)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('用户名长度不能少于3个字符')
      expect(result.errors).toContain('密码长度不能超过20个字符')
    })
    
    it('应该验证正则表达式', () => {
      const form = {
        email: 'invalid-email',
        phone: '123456'
      }
      
      const rules = {
        email: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: '请输入有效的邮箱地址'
        },
        phone: {
          pattern: /^1[3-9]\d{9}$/,
          label: '手机号'
        }
      }
      
      const result = validateForm(form, rules)
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('请输入有效的邮箱地址')
      expect(result.errors).toContain('手机号格式不正确')
    })
    
    it('验证通过的表单应该返回valid为true', () => {
      const form = {
        name: '测试用户',
        email: 'test@example.com',
        age: 25
      }
      
      const rules = {
        name: { required: true, min: 2, max: 20 },
        email: {
          required: true,
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        },
        age: { required: true }
      }
      
      const result = validateForm(form, rules)
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })
  })
  
  describe('边界情况测试', () => {
    it('工具函数应该处理极端值', () => {
      // 测试formatDuration的极端值
      const startTime = '2023-01-01 00:00:00'
      const endTime = '2023-01-02 01:01:01' // 25小时1分钟1秒
      expect(formatDuration(startTime, endTime)).toBe('25小时1分钟')
      
      // 测试calculatePassRate的极端值
      expect(calculatePassRate(9999, 10000)).toBe(100) // 四舍五入
    })
    
    it('工具函数应该处理特殊输入类型', () => {
      // 测试formatDate的特殊类型
      expect(formatDate(new Date())).toContain(new Date().getFullYear().toString())
      
      // 测试calculatePassRate的特殊类型
      expect(calculatePassRate('95', '100')).toBe(95) // 字符串转数字
    })
  })
})