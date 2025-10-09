import os
import django
import random
from datetime import datetime, timedelta

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')
django.setup()

from result_manager.models import CaseResult
from execution_manager.models import TaskExecution
from test_suite.models import TestSuite
from feature_testcase.models import TestCase
from django.contrib.auth.models import User


def create_test_results():
    """创建测试结果数据"""
    try:
        # 确保有用户存在
        if not User.objects.exists():
            print("正在创建测试用户...")
            User.objects.create_superuser(username='admin', email='admin@example.com', password='admin')
        user = User.objects.first()
        
        # 确保有测试套存在
        if not TestSuite.objects.exists():
            print("正在创建测试套...")
            suite = TestSuite.objects.create(
                id=f"SUITE_{random.randint(1000, 9999)}",
                name=f"测试套_{random.randint(1000, 9999)}",
                description="用于测试结果展示的测试套",
                creator=user
            )
        suite = TestSuite.objects.first()
        
        # 确保有测试用例存在
        if not TestCase.objects.exists():
            print("正在创建测试用例...")
            # 创建10个测试用例
            for i in range(10):
                TestCase.objects.create(
                    id=f"TC_{random.randint(1000, 9999)}",
                    name=f"测试用例_{i+1}",
                    description=f"测试用例描述_{i+1}",
                    execution_steps=f"执行步骤_{i+1}",
                    expected_result=f"预期结果_{i+1}",
                    script_path=f"/path/to/script_{i+1}.py",
                    creator=user
                )
        
        # 创建任务执行记录
        tasks = []
        for i in range(3):
            task = TaskExecution.objects.create(
                id=f"TASK_{random.randint(1000, 9999)}",
                suite_id=suite.id,
                env_id=f"ENV_{random.randint(100, 999)}",
                package_info=f"测试包_{i+1}.zip",
                status=random.choice(['pending', 'running', 'completed', 'failed']),
                creator=user,
                start_time=datetime.now() - timedelta(hours=i),
                end_time=datetime.now() - timedelta(hours=i, minutes=random.randint(10, 50)) if i > 0 else None,
                total_cases=10,
                passed_cases=random.randint(5, 9),
                failed_cases=random.randint(1, 5),
                skipped_cases=0
            )
            tasks.append(task)
        
        # 为每个任务创建测试用例结果
        case_statuses = ['passed', 'failed', 'skipped']
        mark_statuses = ['none', 'blocked', 'bug', 'investigate']
        
        for task in tasks:
            test_cases = TestCase.objects.all()[:10]
            for case in test_cases:
                status = random.choice(case_statuses)
                mark_status = random.choice(mark_statuses) if status == 'failed' else 'none'
                
                CaseResult.objects.create(
                    id=f"RESULT_{random.randint(10000, 99999)}",
                    task_id=task.id,
                    case_id=case.id,
                    status=status,
                    mark_status=mark_status,
                    analysis_note=f"{case.name}的分析备注" if mark_status != 'none' else '',
                    execution_time=random.randint(1, 60),
                    log_path=f"/path/to/logs/{task.id}/{case.id}.log"
                )
        
        print("测试数据创建成功！")
        print(f"创建了{len(tasks)}个任务执行记录")
        print(f"创建了{CaseResult.objects.count()}个测试用例结果记录")
        
    except Exception as e:
        print(f"创建测试数据失败: {e}")


if __name__ == "__main__":
    create_test_results()