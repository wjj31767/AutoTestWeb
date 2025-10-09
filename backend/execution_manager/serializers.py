from rest_framework import serializers
from .models import TaskExecution


class TaskExecutionSerializer(serializers.ModelSerializer):
    """任务执行信息序列化器"""
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    suite_name = serializers.CharField(source='suite_id.name', read_only=True)
    env_name = serializers.CharField(source='env_id.name', read_only=True)
    
    # 为package_info和executor字段提供默认值，使其成为可选字段
    package_info = serializers.CharField(required=False, default='')
    executor = serializers.CharField(required=False, default='anonymous')

    class Meta:
        model = TaskExecution
        fields = [
            'id', 'suite_id', 'suite_name', 'env_id', 'env_name', 'package_info',
            'status', 'status_display', 'start_time', 'end_time', 'executor',
            'total_case', 'success_case', 'failed_case'
        ]
        read_only_fields = ['id', 'start_time', 'end_time']

    def validate_package_info(self, value):
        """验证包信息（可选字段）"""
        # 不再强制要求package_info为必填
        return value

    def validate_executor(self, value):
        """验证执行人"""
        # 允许空值，因为会在view层自动填充
        return value

    def validate(self, data):
        """验证数据的一致性"""
        # 验证用例数量的合理性
        total_case = data.get('total_case', 0)
        success_case = data.get('success_case', 0)
        failed_case = data.get('failed_case', 0)

        if total_case < 0:
            raise serializers.ValidationError({"total_case": "总用例数不能为负数"})
        if success_case < 0:
            raise serializers.ValidationError({"success_case": "成功用例数不能为负数"})
        if failed_case < 0:
            raise serializers.ValidationError({"failed_case": "失败用例数不能为负数"})
        if success_case + failed_case > total_case:
            raise serializers.ValidationError({"non_field_errors": "成功用例数和失败用例数之和不能大于总用例数"})

        return data