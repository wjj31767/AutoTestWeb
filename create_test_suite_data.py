import os
import django

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')
django.setup()

from test_suite.models import TestSuite


def create_test_suite_data():
    """创建测试套测试数据"""
    # 删除已有的测试数据（可选）
    print("删除已有的测试套数据...")
    TestSuite.objects.all().delete()
    
    # 创建测试套数据
    test_suites = [
        {
            'name': '基础功能测试套',
            'description': '系统基础功能的测试用例集合',
            'visible_scope': 'private',
            'creator': 'admin',
            'case_count': 10
        },
        {
            'name': '性能测试套',
            'description': '系统性能相关的测试用例集合',
            'visible_scope': 'project',
            'creator': 'admin',
            'case_count': 5
        },
        {
            'name': '安全测试套',
            'description': '系统安全相关的测试用例集合',
            'visible_scope': 'private',
            'creator': 'user1',
            'case_count': 8
        }
    ]
    
    # 批量创建测试套
    print("创建新的测试套数据...")
    for suite_data in test_suites:
        suite = TestSuite.objects.create(**suite_data)
        print(f"创建测试套: {suite.id} - {suite.name}")
    
    print(f"共创建 {TestSuite.objects.count()} 条测试套数据")


if __name__ == '__main__':
    create_test_suite_data()