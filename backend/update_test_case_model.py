import os
import sys
from pathlib import Path

# 获取当前脚本所在目录
current_dir = Path(__file__).resolve().parent

# 添加Django项目根目录到Python路径
sys.path.append(str(current_dir))

# 设置Django设置模块
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')

# 导入Django
import django
django.setup()

# 导入必要的模型
from feature_testcase.models import TestCase
from django.db import models
from django.core.management import call_command


def update_test_case_model():
    try:
        print("开始更新TestCase模型定义...")
        
        # 检查当前模型字段
        print("\n当前TestCase模型字段:")
        for field in TestCase._meta.fields:
            print(f"- {field.name}: {field.get_internal_type()}, null={field.null}, default={field.default}")
        
        # 获取模型文件路径
        model_file_path = os.path.join(current_dir, 'feature_testcase', 'models.py')
        
        # 读取当前模型文件内容
        with open(model_file_path, 'r', encoding='utf-8') as f:
            model_content = f.read()
        
        # 检查是否需要添加priority字段
        if 'priority = models.IntegerField' not in model_content:
            print("\n需要添加priority字段...")
            
            # 在status字段后面添加priority字段
            new_model_content = model_content.replace(
                'status = models.CharField(max_length=20, verbose_name="用例状态", null=False, default="active", choices=CASE_STATUS_CHOICES)',
                'status = models.CharField(max_length=20, verbose_name="用例状态", null=False, default="active", choices=CASE_STATUS_CHOICES)\n    priority = models.IntegerField(verbose_name="优先级", null=False, default=50, help_text="1-100，数字越小优先级越高")'
            )
            
            # 检查并添加test_type字段
            if 'test_type' not in new_model_content:
                new_model_content = new_model_content.replace(
                    'priority = models.IntegerField(verbose_name="优先级", null=False, default=50, help_text="1-100，数字越小优先级越高")',
                    'priority = models.IntegerField(verbose_name="优先级", null=False, default=50, help_text="1-100，数字越小优先级越高")\n    test_type = models.CharField(max_length=20, verbose_name="测试类型", null=False, default="manual", choices=(\n        ("manual", "手动测试"),\n        ("automated", "自动化测试"),\n        ("semi_automated", "半自动化测试")\n    ))'
                )
            
            # 检查并添加test_phase字段
            if 'test_phase' not in new_model_content:
                new_model_content = new_model_content.replace(
                    'test_type = models.CharField(max_length=20, verbose_name="测试类型", null=False, default="manual", choices=(("manual", "手动测试"),("automated", "自动化测试"),("semi_automated", "半自动化测试")))',
                    'test_type = models.CharField(max_length=20, verbose_name="测试类型", null=False, default="manual", choices=(("manual", "手动测试"),("automated", "自动化测试"),("semi_automated", "半自动化测试")))\n    test_phase = models.CharField(max_length=20, verbose_name="测试阶段", null=False, default="system", choices=(\n        ("unit", "单元测试"),\n        ("integration", "集成测试"),\n        ("system", "系统测试"),\n        ("acceptance", "验收测试")\n    ))'
                )
            
            # 检查并添加creator字段
            if 'creator' not in new_model_content:
                new_model_content = new_model_content.replace(
                    'test_phase = models.CharField(max_length=20, verbose_name="测试阶段", null=False, default="system", choices=(("unit", "单元测试"),("integration", "集成测试"),("system", "系统测试"),("acceptance", "验收测试")))',
                    'test_phase = models.CharField(max_length=20, verbose_name="测试阶段", null=False, default="system", choices=(("unit", "单元测试"),("integration", "集成测试"),("system", "系统测试"),("acceptance", "验收测试")))\n    creator = models.CharField(max_length=64, verbose_name="创建人", null=False, default="test", help_text="关联tb_user.id")'
                )
            
            # 保存更新后的模型文件
            with open(model_file_path, 'w', encoding='utf-8') as f:
                f.write(new_model_content)
            
            print("模型文件已更新，添加了priority、test_type、test_phase和creator字段")
        else:
            print("\n模型已经包含所需字段，无需更新")
        
        # 更新序列化器以包含新字段
        serializer_file_path = os.path.join(current_dir, 'feature_testcase', 'serializers.py')
        
        # 读取序列化器文件
        with open(serializer_file_path, 'r', encoding='utf-8') as f:
            serializer_content = f.read()
        
        # 检查并更新TestCaseSerializer的fields
        if 'priority' not in serializer_content:
            print("\n需要更新TestCaseSerializer以包含新字段...")
            
            new_serializer_content = serializer_content.replace(
                '        fields = [\n            \'id\', \'case_id\', \'case_name\', \'feature_id\', \'description\', \'pre_condition\', \
            \'steps\', \'expected_result\', \'script_path\', \'status\', \
            \'sync_time\', \'create_time\', \'update_time\', \'is_deleted\'\n        ]',
                '        fields = [\n            \'id\', \'case_id\', \'case_name\', \'feature_id\', \'description\', \'pre_condition\', \
            \'steps\', \'expected_result\', \'script_path\', \'status\', \'priority\', \
            \'test_type\', \'test_phase\', \'creator\', \'sync_time\', \'create_time\', \'update_time\', \'is_deleted\'\n        ]'
            )
            
            # 保存更新后的序列化器文件
            with open(serializer_file_path, 'w', encoding='utf-8') as f:
                f.write(new_serializer_content)
            
            print("序列化器文件已更新，添加了新字段")
        else:
            print("\n序列化器已经包含所需字段，无需更新")
        
        print("\nTestCase模型更新完成！")
        
    except Exception as e:
        print(f"发生错误: {e}")

if __name__ == "__main__":
    update_test_case_model()