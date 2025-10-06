module.exports = {
  transform: {
    '^.+\.vue$': '@vue/vue3-jest',
    '^.+\.jsx?$': 'babel-jest',
    '^.+\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['vue', 'js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  snapshotSerializers: ['jest-serializer-vue'],
  collectCoverageFrom: [
    'src/**/*.{vue,js}',
    '!src/main.js',
    '!src/router/index.js',
    '!src/App.vue'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'text-summary']
}