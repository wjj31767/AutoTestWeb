# 任务提交问题诊断与解决方案

## 问题描述
点击"提交任务"按钮后没有反应，任务无法成功提交。

## 诊断方法

### 1. 查看浏览器控制台日志

1. 打开浏览器并访问前端开发服务器地址：[http://localhost:5174/](http://localhost:5174/)
2. 按下 `F12` 键或右键选择"检查"打开开发者工具
3. 切换到"控制台"(Console)选项卡
4. 导航到添加任务页面，填写所有必要字段后点击"提交任务"按钮
5. 查看控制台输出的日志信息

### 2. 关键日志信息解释

我已经在代码中添加了以下关键日志点：
- `提交任务按钮被点击` - 确认按钮点击事件已触发
- `提交数据: { ... }` - 显示准备提交给后端的完整数据
- `当前环境信息: { ... }` - 显示当前登录状态和CSRF token信息
- `API调用成功，响应: { ... }` - 确认API调用成功及返回数据
- `任务提交失败: { ... }` - 显示详细的错误信息

## 常见问题及解决方案

### 1. 按钮点击事件未触发

如果控制台没有显示 `提交任务按钮被点击` 日志，可能的原因：

- **问题**: 按钮被其他元素遮挡或CSS样式问题
  **解决**: 检查页面布局，确保按钮可点击

- **问题**: 按钮绑定的事件处理器未正确注册
  **解决**: 检查 `@click="submitTask"` 绑定是否正确

### 2. 提交数据不完整

查看 `提交数据: { ... }` 日志，如果关键字段为空：

- **问题**: 表单验证通过但某些必填字段未填写
  **解决**: 确保所有必填字段都有有效值

### 3. 认证或CSRF问题

查看 `当前环境信息: { ... }` 日志：

- **问题**: token为null，表示未登录或登录已过期
  **解决**: 重新登录系统获取有效token

- **问题**: csrfToken为空
  **解决**: 确保Django后端正确设置了CSRF cookie

### 4. API调用失败

查看 `任务提交失败: { ... }` 日志：

- **问题**: 网络错误或跨域问题
  **解决**: 检查后端服务器是否正常运行，确认CORS配置正确

- **问题**: HTTP 400 Bad Request - 提交的数据格式不正确
  **解决**: 检查提交数据的字段类型和格式是否符合后端要求

- **问题**: HTTP 401 Unauthorized - 认证失败
  **解决**: 确保登录状态有效，token正确

- **问题**: HTTP 403 Forbidden - 权限不足
  **解决**: 确认当前用户有创建任务的权限

- **问题**: HTTP 500 Internal Server Error - 后端错误
  **解决**: 检查后端服务器日志，查看具体错误原因

## 特别注意事项

1. **测试用例集ID(suite_id)格式**: 确保`suite_id`字段是字符串类型，与后端`tb_test_suite`表的`VARCHAR(64)`类型匹配

2. **字段映射关系**: 前端表单字段到后端API参数的映射关系
   - `taskForm.environmentId` -> `env_id`
   - `taskForm.testSuite` -> `suite_id`
   - `taskForm.branchPackage` -> `branch_package`
   - `taskForm.executionMode` -> `execution_mode`
   - `taskForm.maxConcurrency` -> `max_concurrency`
   - `taskForm.executionParams` -> `execution_params`

3. **网络请求超时**: 默认超时时间为10秒，如果网络较慢可能导致请求超时

## 进一步排查建议

1. 使用浏览器的"网络"(Network)选项卡，查看具体的HTTP请求和响应
2. 检查后端服务器日志，查看是否收到请求及处理情况
3. 尝试使用Postman等工具直接调用API接口，验证后端是否正常工作

## 临时解决方案

如果紧急需要提交任务，可以使用以下Python脚本直接调用API：

```python
import requests
import json

# 填写你的登录信息和任务数据
token = "你的token"
csrftoken = "你的csrftoken"

# 准备任务数据
task_data = {
    "name": "测试任务",
    "env_id": "1",
    "suite_id": "string-id-123",
    "description": "测试任务描述",
    "branch_package": "/test/branch/path",
    "execution_mode": "parallel",
    "max_concurrency": 5,
    "timeout": 60,
    "execution_params": "{\"param1\": \"value1\"}"
}

# 发送请求
response = requests.post(
    "http://localhost:8000/api/tasks/",
    headers={
        "Authorization": f"Bearer {token}",
        "X-CSRFToken": csrftoken,
        "Content-Type": "application/json"
    },
    cookies={"csrftoken": csrftoken},
    json=task_data
)

# 打印响应
print(f"状态码: {response.status_code}")
print(f"响应内容: {response.text}")
```

请根据控制台输出的日志信息，对照以上解决方案进行问题排查。如果问题依然存在，请提供详细的控制台日志，以便进一步分析。