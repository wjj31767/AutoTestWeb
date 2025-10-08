from rest_framework import serializers
from .models import Module

class ModuleSerializer(serializers.ModelSerializer):
    """模块信息序列化器"""
    
    class Meta:
        model = Module
        fields = [
            'id', 'module_name', 'chip_model', 'description',
            'creator', 'feature_count', 'create_time', 'update_time'
        ]
        read_only_fields = ['creator', 'create_time', 'update_time']  # 移除id，因为id是自定义主键，需要客户端提供
    
    def validate_module_name(self, value):
        """验证模块名称不为空且唯一"""
        if not value or value.strip() == '':
            raise serializers.ValidationError("模块名称不能为空")
        
        # 检查名称唯一性
        if self.instance is None:
            if Module.objects.filter(module_name=value, is_deleted=False).exists():
                raise serializers.ValidationError('模块名称已存在')
        else:
            if Module.objects.filter(module_name=value, is_deleted=False).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError('模块名称已存在')
        return value
        
    def validate_feature_count(self, value):
        """验证特性数量不能为负数"""
        if value < 0:
            raise serializers.ValidationError("特性数量不能为负数")
        return value
        
    def create(self, validated_data):
        """创建模块时，自动从请求中获取当前用户的用户名作为creator"""
        # 从上下文中获取请求对象
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 设置creator为当前登录用户的用户名
            validated_data['creator'] = request.user.username
        
        # 调用父类的create方法完成创建
        return super().create(validated_data)