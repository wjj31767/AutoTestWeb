from rest_framework import serializers
from .models import TestSuite

class TestSuiteSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = TestSuite
        fields = [
            'id', 'name', 'description', 'visible_scope', 
            'creator', 'case_count', 'create_time', 'update_time'
        ]
        read_only_fields = ['id', 'creator', 'create_time', 'update_time']
    
    def validate_name(self, value):
        """验证测试套名称不为空"""
        if not value or value.strip() == '':
            raise serializers.ValidationError("测试套名称不能为空")
        return value
        
    def validate_case_count(self, value):
        """验证用例数量不能为负数"""
        if value < 0:
            raise serializers.ValidationError("用例数量不能为负数")
        return value