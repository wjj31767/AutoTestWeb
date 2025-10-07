<template>
  <div class="composition-component">
    <h2>{{ title }}</h2>
    <p>Count: {{ count }}</p>
    <button @click="increment">Increment</button>
    <button @click="decrement">Decrement</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// 使用Composition API定义组件状态和方法
const title = 'Composition API Component'
const count = ref(0)

function increment() {
  count.value++
}

function decrement() {
  count.value--
}
</script>

<style scoped>
.composition-component {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>