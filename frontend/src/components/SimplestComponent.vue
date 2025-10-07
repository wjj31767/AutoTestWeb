<template>
  <div class="simplest-component">
    <h1>{{ title }}</h1>
    <p>{{ message }}</p>
    <button @click="increment">{{ count }}</button>
  </div>
</template>

<script>
export default {
  name: 'SimplestComponent',
  data() {
    return {
      title: 'Hello Vitest',
      message: 'This is a very simple component for testing',
      count: 0
    }
  },
  methods: {
    increment() {
      this.count++
    }
  }
}
</script>

<style scoped>
.simplest-component {
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
}
</style>