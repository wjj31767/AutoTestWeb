from rest_framework import serializers
from .models import CaseResult
from execution_manager.models import TaskExecution
from feature_testcase.models import TestCase


class CaseResultSerializer(serializers.ModelSerializer):
    """用例结果序列化器"""
    # 嵌套序列化关联的任务和测试用例信息
    task_id = serializers.SlugRelatedField(
        slug_field='id',
        queryset=TaskExecution.objects.all(),
        read_only=False
    )
    case_id = serializers.SlugRelatedField(
        slug_field='id',
        queryset=TestCase.objects.all(),
        read_only=False
    )
    
    # 添加额外的显示字段
    task_name = serializers.SerializerMethodField()
    case_name = serializers.SerializerMethodField()
    case_description = serializers.SerializerMethodField()
    
    class Meta:
        model = CaseResult
        fields = [
            'id', 'task_id', 'task_name', 'case_id', 'case_name', 'case_description',
            'status', 'mark_status', 'analysis_note', 'execute_time', 'log_path'
        ]
        read_only_fields = ['id']
    
    def get_task_name(self, obj):
        """获取任务名称"""
        try:
            # 假设TaskExecution有一个name字段或者可以通过其他方式获取名称
            # 如果没有name字段，可以返回任务ID作为名称
            return obj.task_id.id if obj.task_id else ''
        except:
            return ''
    
    def get_case_name(self, obj):
        """获取测试用例名称"""
        try:
            return obj.case_id.case_name if obj.case_id else ''
        except:
            return ''
    
    def get_case_description(self, obj):
        """获取测试用例描述"""
        try:
            return obj.case_id.description if obj.case_id else ''
        except:
            return ''


class TestSuiteCaseResultsSerializer(serializers.Serializer):
    """测试套用例结果汇总序列化器"""
    # 测试套信息
    suite_id = serializers.CharField()
    suite_name = serializers.CharField()
    
    # 任务执行信息
    task_id = serializers.CharField()
    task_status = serializers.CharField()
    start_time = serializers.DateTimeField()
    end_time = serializers.DateTimeField(allow_null=True)
    
    # 结果统计
    total_cases = serializers.IntegerField()
    success_cases = serializers.IntegerField()
    failed_cases = serializers.IntegerField()
    skipped_cases = serializers.IntegerField()
    
    # 用例结果列表
    case_results = CaseResultSerializer(many=True)