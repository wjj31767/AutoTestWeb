module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\.vue$': '@vue/vue3-jest',
    '^.+\.jsx?$': 'babel-jest',
    '^.+\.tsx?$': 'ts-jest'
  },
  moduleFileExtensions: ['vue', 'js', 'jsx', 'ts', 'tsx', 'json', 'node'],
  modulePaths: ['<rootDir>/src'],
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  resolver: '<rootDir>/jest-resolver.cjs',
  snapshotSerializers: ['jest-serializer-vue'],
  collectCoverageFrom: [
    'src/**/*.{vue,js}',
    '!src/main.js',
    '!src/router/index.js',
    '!src/App.vue'
  ],
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['html', 'text-summary'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.cjs']
}