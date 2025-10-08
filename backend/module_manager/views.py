from django.shortcuts import render

from rest_framework import viewsets, permissions
from .models import Module, Feature
from .serializers import ModuleSerializer, FeatureSerializer
from common.permissions import IsAdminOrOwner

class ModuleViewSet(viewsets.ModelViewSet):
    """模块信息视图集，提供标准的CRUD操作"""
    queryset = Module.objects.filter(is_deleted=False)
    serializer_class = ModuleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]
    
    def get_queryset(self):
        """根据用户权限返回模块列表"""
        # 管理员可以查看所有模块
        if self.request.user.is_staff:
            return Module.objects.filter(is_deleted=False)
        # 普通用户只能查看自己创建的模块
        return Module.objects.filter(creator=self.request.user.username, is_deleted=False)
    
    def perform_create(self, serializer):
        """创建模块时自动设置创建者信息"""
        # 从请求中获取当前用户信息
        user = self.request.user.username
        
        # 保存模块数据，并设置创建者
        serializer.save(creator=user)
        
    def perform_update(self, serializer):
        """更新模块信息"""
        # 可以在这里添加更新前的验证逻辑
        serializer.save()
        
    def perform_destroy(self, instance):
        """软删除模块"""
        instance.soft_delete()

class FeatureViewSet(viewsets.ModelViewSet):
    """特性信息视图集，提供标准的CRUD操作"""
    queryset = Feature.objects.filter(is_deleted=False)
    serializer_class = FeatureSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]
    
    def get_queryset(self):
        """根据用户权限返回特性列表"""
        # 管理员可以查看所有特性
        if self.request.user.is_staff:
            return Feature.objects.filter(is_deleted=False)
        # 普通用户只能查看自己创建的特性
        return Feature.objects.filter(creator=self.request.user.username, is_deleted=False)
    
    def perform_create(self, serializer):
        """创建特性时自动设置创建者信息"""
        # 从请求中获取当前用户信息
        user = self.request.user.username
        
        # 保存特性数据，并设置创建者
        serializer.save(creator=user)
        
    def perform_update(self, serializer):
        """更新特性信息"""
        # 可以在这里添加更新前的验证逻辑
        serializer.save()
        
    def perform_destroy(self, instance):
        """软删除特性，并更新对应模块的特性计数"""
        # 记录模块ID
        module_id = instance.module_id
        
        # 软删除特性
        instance.soft_delete()
        
        # 更新模块的特性计数
        try:
            module = Module.objects.get(id=module_id, is_deleted=False)
            module.feature_count = Feature.objects.filter(module_id=module_id, is_deleted=False).count()
            module.save()
        except Module.DoesNotExist:
            pass
