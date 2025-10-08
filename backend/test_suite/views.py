from django.shortcuts import render

from rest_framework import viewsets
from .models import TestSuite
from .serializers import TestSuiteSerializer

class TestSuiteViewSet(viewsets.ModelViewSet):
    """测试套视图集，提供标准的CRUD操作"""
    queryset = TestSuite.objects.all()
    serializer_class = TestSuiteSerializer
    
    def get_queryset(self):
        """根据用户权限返回测试套列表"""
        # 后续可以在这里添加权限控制逻辑
        # 例如：只返回用户有权限查看的测试套
        return super().get_queryset()
    
    def perform_create(self, serializer):
        """创建测试套时自动设置创建者信息"""
        # 从请求中获取当前用户信息
        # 在实际场景中，这里应该从认证的用户信息中获取
        # 这里只是一个示例，实际项目中需要根据认证方式调整
        user = self.request.user.username if self.request.user.is_authenticated else "unknown"
        
        # 保存测试套数据，并设置创建者
        serializer.save(creator=user)
        
    def perform_update(self, serializer):
        """更新测试套信息"""
        # 可以在这里添加更新前的验证逻辑
        serializer.save()
