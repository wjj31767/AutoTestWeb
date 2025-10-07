import { it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import EnvList from '../views/EnvList.vue'

// 模拟全局的console.log，避免测试输出过多信息
console.log = vi.fn()

// 这个测试只验证组件能否被挂载，不进行任何API模拟
it('should be able to mount EnvList component without mocks', () => {
  // 使用简单的挂载配置，不包含任何复杂的stubs或mocks
  const wrapper = mount(EnvList, {
    global: {
      stubs: {
        // 只 stub 最基本的需要的组件
        'el-card': { template: '<div><slot name="header"></slot><slot></slot></div>' },
        'el-form': { template: '<div><slot></slot></div>' },
        'el-form-item': { props: ['label'], template: '<div><label>{{ label }}</label><slot></slot></div>' },
        'el-input': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />' },
        'el-select': { props: ['modelValue'], emits: ['update:modelValue'], template: '<select :value="modelValue" @change="$emit(\'update:modelValue\', $event.target.value)"><slot></slot></select>' },
        'el-option': { props: ['label', 'value'], template: '<option :value="value">{{ label }}</option>' },
        'el-button': { props: ['type'], template: '<button class="el-button" @click="$emit(\'click\')"><slot></slot></button>' },
        'el-table': { template: '<div><slot></slot></div>' },
        'el-table-column': { template: '<div></div>' },
        'el-tag': { props: ['type'], template: '<span class="el-tag"><slot></slot></span>' },
        'el-switch': { props: ['modelValue'], emits: ['update:modelValue'], template: '<input type="checkbox" :checked="modelValue" @change="$emit(\'update:modelValue\', $event.target.checked ? \'active\' : \'inactive\')" />' },
        'el-pagination': { template: '<div class="pagination"></div>' },
        'el-dialog': { template: '<div></div>' }
      }
    }
  })
  
  // 只进行最基本的验证，确保组件能够被挂载
  expect(wrapper.exists()).toBe(true)
  expect(typeof wrapper.vm.searchForm).toBe('object')
})