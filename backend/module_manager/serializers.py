from rest_framework import serializers
from .models import Module, Feature

class ModuleSerializer(serializers.ModelSerializer):
    """模块信息序列化器"""
    
    class Meta:
        model = Module
        fields = [
            'id', 'module_name', 'chip_model', 'description',
            'creator', 'feature_count', 'create_time', 'update_time'
        ]
        read_only_fields = ['id', 'creator', 'create_time', 'update_time']
    
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

class FeatureSerializer(serializers.ModelSerializer):
    """特性信息序列化器"""
    
    class Meta:
        model = Feature
        fields = [
            'id', 'feature_name', 'module_id', 'description',
            'case_count', 'creator', 'create_time', 'update_time'
        ]
        read_only_fields = ['id', 'creator', 'create_time', 'update_time']
    
    def validate_feature_name(self, value):
        """验证特性名称不为空"""
        if not value or value.strip() == '':
            raise serializers.ValidationError("特性名称不能为空")
        return value
        
    def validate_module_id(self, value):
        """验证模块ID存在"""
        if not Module.objects.filter(id=value, is_deleted=False).exists():
            raise serializers.ValidationError("关联的模块不存在")
        return value
        
    def validate_case_count(self, value):
        """验证用例数量不能为负数"""
        if value < 0:
            raise serializers.ValidationError("用例数量不能为负数")
        return value
        
    def create(self, validated_data):
        """创建特性时，自动从请求中获取当前用户的用户名作为creator，并更新模块的特性计数"""
        # 从上下文中获取请求对象
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 设置creator为当前登录用户的用户名
            validated_data['creator'] = request.user.username
        
        # 创建特性
        feature = super().create(validated_data)
        
        # 更新模块的特性计数
        try:
            module = Module.objects.get(id=feature.module_id, is_deleted=False)
            module.feature_count = Feature.objects.filter(module_id=feature.module_id, is_deleted=False).count()
            module.save()
        except Module.DoesNotExist:
            pass
        
        return feature
        
    def update(self, instance, validated_data):
        """更新特性时，如果模块ID发生变化，需要更新旧模块和新模块的特性计数"""
        old_module_id = instance.module_id
        new_module_id = validated_data.get('module_id', old_module_id)
        
        # 更新特性
        feature = super().update(instance, validated_data)
        
        # 如果模块ID发生变化，更新两个模块的特性计数
        if old_module_id != new_module_id:
            # 更新旧模块的特性计数
            try:
                old_module = Module.objects.get(id=old_module_id, is_deleted=False)
                old_module.feature_count = Module.objects.filter(module_id=old_module_id, is_deleted=False).count()
                old_module.save()
            except Module.DoesNotExist:
                pass
            
            # 更新新模块的特性计数
            try:
                new_module = Module.objects.get(id=new_module_id, is_deleted=False)
                new_module.feature_count = Module.objects.filter(module_id=new_module_id, is_deleted=False).count()
                new_module.save()
            except Module.DoesNotExist:
                pass
        
        return feature