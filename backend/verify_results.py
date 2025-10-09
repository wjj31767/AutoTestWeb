import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')
django.setup()

from result_manager.models import CaseResult
from execution_manager.models import TaskExecution

# 打印一些数据来验证模型
print("\n--- 任务执行数据 ---\n")
tasks = TaskExecution.objects.all()[:5]
for task in tasks:
    print(f"任务ID: {task.id}, 测试套ID: {task.suite_id}, 状态: {task.status}")

print("\n--- 测试用例结果数据 ---\n")
results = CaseResult.objects.all()[:5]
for result in results:
    print(f"结果ID: {result.id}, 任务ID: {result.task_id}, 用例ID: {result.case_id}, 状态: {result.status}")

print("\n--- 数据库表验证 ---\n")
print(f"CaseResult表记录数: {CaseResult.objects.count()}")
print(f"TaskExecution表记录数: {TaskExecution.objects.count()}")

print("\n验证完成！")