from django.core.management.base import BaseCommand
from django.utils import timezone
import random
from datetime import datetime, timedelta
from result_manager.models import CaseResult
from execution_manager.models import TaskExecution
from test_suite.models import TestSuite
from env_manager.models import Environment
from feature_testcase.models import TestCase
from django.contrib.auth.models import User


class Command(BaseCommand):
    help = '创建测试结果数据'

    def handle(self, *args, **kwargs):
        """创建测试结果数据"""
        try:
            # 确保有用户存在
            if not User.objects.exists():
                self.stdout.write("正在创建测试用户...")
                User.objects.create_superuser(username='admin', email='admin@example.com', password='admin')
            user = User.objects.first()
            
            # 确保有测试套存在
            if not TestSuite.objects.exists():
                self.stdout.write("正在创建测试套...")
                suite = TestSuite.objects.create(
                    id=f"SUITE_{random.randint(1000, 9999)}",
                    name=f"测试套_{random.randint(1000, 9999)}",
                    description="用于测试结果展示的测试套",
                    creator=user
                )
            suite = TestSuite.objects.first()
            
            # 确保有环境存在
            if not Environment.objects.exists():
                self.stdout.write("正在创建测试环境...")
                env = Environment.objects.create(
                    id=f"ENV_{random.randint(100, 999)}",
                    name=f"测试环境_{random.randint(100, 999)}",
                    description="用于测试结果展示的环境",
                    creator=user
                )
            env = Environment.objects.first()
            
            # 确保有测试用例存在
            if not TestCase.objects.exists():
                self.stdout.write("正在创建测试用例...")
                # 创建10个测试用例
                for i in range(10):
                    TestCase.objects.create(
                        id=f"TC_{random.randint(1000, 9999)}",
                        case_id=f"case_{random.randint(1000, 9999)}",
                        case_name=f"测试用例_{i+1}",
                        description=f"测试用例描述_{i+1}",
                        feature_id="feature_test",
                        steps=f"执行步骤_{i+1}",
                        pre_condition="前置条件",
                        expected_result=f"预期结果_{i+1}",
                        script_path=f"/path/to/script_{i+1}.py",
                        creator=user.username
                    )
            
            # 如果没有任务执行记录，创建3个
            if TaskExecution.objects.count() < 3:
                self.stdout.write("正在创建任务执行记录...")
                for i in range(3):
                    TaskExecution.objects.create(
                        id=f"TASK_{random.randint(1000, 9999)}",
                        suite_id=suite,  # 传递TestSuite实例
                        env_id=env,      # 传递Environment实例
                        package_info=f"测试包_{i+1}.zip",
                        status=random.choice(['pending', 'running', 'success', 'failed']),
                        executor=user.username,
                        start_time=datetime.now() - timedelta(hours=i),
                        end_time=datetime.now() - timedelta(hours=i, minutes=random.randint(10, 50)) if i > 0 else None,
                        total_case=10,
                        success_case=random.randint(5, 9),
                        failed_case=random.randint(1, 5)
                    )
            
            # 为每个任务创建测试用例结果
            self.stdout.write("正在创建测试用例结果...")
            case_statuses = ['passed', 'failed', 'skipped']
            mark_statuses = ['none', 'blocked', 'bug', 'investigate']
            
            tasks = TaskExecution.objects.all()[:5]
            for task in tasks:
                # 检查是否已经为该任务创建了结果
                if not CaseResult.objects.filter(task_id=task.id).exists():
                    test_cases = TestCase.objects.all()[:10]
                    for case in test_cases:
                        status = random.choice(case_statuses)
                        mark_status = random.choice(mark_statuses) if status == 'failed' else 'none'
                        
                        CaseResult.objects.create(
                        id=f"RESULT_{random.randint(10000, 99999)}",
                        task_id=task,  # 传递TaskExecution实例
                        case_id=case,  # 传递TestCase实例
                        status=status,
                        mark_status=mark_status,
                        analysis_note=f"{case.case_name}的分析备注" if mark_status != 'none' else '',
                        execute_time=timezone.now(),  # 使用DateTimeField类型的值
                        log_path=f"/path/to/logs/{task.id}/{case.id}.log"
                    )
            
            self.stdout.write(self.style.SUCCESS("测试数据创建成功！"))
            self.stdout.write(f"CaseResult表记录数: {CaseResult.objects.count()}")
            self.stdout.write(f"TaskExecution表记录数: {TaskExecution.objects.count()}")
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"创建测试数据失败: {e}"))