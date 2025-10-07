// 自定义Jest解析器，用于处理ES模块和路径别名
const path = require('path')
const fs = require('fs')

module.exports = (request, options) => {
  // 处理@别名，将@/替换为src/
  if (request.startsWith('@/')) {
    const resolvedPath = path.resolve(options.rootDir, 'src', request.substring(2))
    
    // 检查文件是否存在，如果不存在尝试添加扩展名
    if (!fs.existsSync(resolvedPath)) {
      const extensions = ['.js', '.ts', '.vue', '.jsx', '.tsx']
      for (const ext of extensions) {
        const fileWithExt = resolvedPath + ext
        if (fs.existsSync(fileWithExt)) {
          return options.defaultResolver(fileWithExt, options)
        }
      }
    }
    
    return options.defaultResolver(resolvedPath, options)
  }
  
  // 其他请求使用默认解析器
  return options.defaultResolver(request, options)
}