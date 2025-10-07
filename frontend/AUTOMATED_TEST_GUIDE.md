# 自动化测试指南

## 概述

此文档提供了关于AutoTestWeb项目自动化测试脚本的使用说明，旨在保障每次代码修改后，关键功能（特别是登录功能）能够正常工作。

## 修复的问题

1. **CSRF token处理问题**：在`frontend/src/api/axios.js`中添加了CSRF token自动处理逻辑，确保所有非GET请求都携带CSRF token

2. **自动化测试框架**：创建了统一的测试入口脚本`test_all.js`，实现一键运行所有测试脚本

## 测试脚本列表

- **`test_all.js`**：主测试入口，可运行所有测试脚本
- **`test_environment_list.js`**：测试环境列表接口的访问功能
- **其他`test_*.js`文件**：各种功能的专项测试

## 如何运行测试

### 前提条件

1. 确保后端Django服务器正在运行（默认端口8000）
2. 确保前端开发服务器正在运行（默认端口5173）
3. 确保测试用户`test/test@123`存在于系统中

### 运行所有测试

使用以下命令一键运行所有测试脚本：

```bash
cd frontend
npm run test:all
```

或直接使用Node.js运行：

```bash
cd frontend
node test_all.js
```

### 运行特定测试

如果只想运行登录测试：

```bash
npm run test:login
```

## 测试内容

### 1. 登录功能测试

- 自动获取并处理CSRF token
- 使用`test/test@123`用户进行登录
- 验证登录响应是否成功
- 检查是否能访问需要认证的接口
- 保存详细测试结果到`login_test.log`

### 2. 环境列表接口测试

- 先登录系统获取认证
- 调用环境列表接口验证功能
- 手动处理Cookie确保Node.js环境下的正确认证
- 保存测试结果到`environment_list_test.log`

## 测试结果解读

- **✅** 表示测试通过
- **❌** 表示测试失败
- **⚠️** 表示警告信息

详细的测试结果会保存到对应的日志文件中，包含：
- 测试时间戳
- HTTP响应状态码
- 响应数据
- 请求和响应头信息
- Cookie信息

## 常见问题及解决方案

### 1. CSRF token缺失错误

**错误信息**：`CSRF Failed: CSRF token missing.`

**解决方案**：
- 确保`axios.js`中的CSRF token处理逻辑正确
- 检查后端`CSRF_TRUSTED_ORIGINS`配置是否包含前端域名
- 尝试清除浏览器缓存和Cookie后重新登录

### 2. 认证凭证未提供错误

**错误信息**：`Authentication credentials were not provided.`

**解决方案**：
- 确保登录成功后获取到了sessionid Cookie
- 检查请求头中是否正确携带了Cookie
- 验证后端会话配置是否正确

### 3. Node.js环境与浏览器环境差异

**注意事项**：
- Node.js环境中需要手动处理Cookie，而浏览器会自动处理
- 建议在自动化测试通过后，在浏览器中进行最终验证

## 自动化集成

可以将测试脚本集成到CI/CD流程中，确保每次代码变更后都自动运行测试：

1. 在GitHub Actions或Jenkins中添加测试步骤
2. 运行`npm run test:all`命令
3. 根据测试结果决定是否继续部署流程

## 开发建议

1. 在修改涉及认证或安全的代码后，务必运行测试脚本
2. 新增功能时，建议同时添加对应的自动化测试
3. 定期运行测试脚本，确保系统功能正常

通过这些测试脚本，可以有效地保障系统的稳定性和可靠性，特别是在进行代码修改后能够快速发现潜在问题。