from django.shortcuts import render

from rest_framework import viewsets, permissions
from .models import Module
from .serializers import ModuleSerializer
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
