from django.shortcuts import render

from rest_framework import viewsets, permissions
from .models import Feature, TestCase, FeatureTestCaseRelation
from .serializers import FeatureSerializer, TestCaseSerializer, FeatureTestCaseRelationSerializer
from common.permissions import IsAdminOrOwner
from module_manager.models import Module

class FeatureViewSet(viewsets.ModelViewSet):
    """特性信息视图集，提供标准的CRUD操作"""
    queryset = Feature.objects.filter(is_deleted=False)
    serializer_class = FeatureSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]
    
    def get_queryset(self):
        """根据用户权限返回特性列表"""
        # 获取查询参数
        module_id = self.request.query_params.get('module_id', None)
        
        # 基础查询集
        if self.request.user.is_staff:
            queryset = Feature.objects.filter(is_deleted=False)
        else:
            queryset = Feature.objects.filter(creator=self.request.user.username, is_deleted=False)
        
        # 根据模块ID过滤
        if module_id:
            queryset = queryset.filter(module_id=module_id)
        
        return queryset
    
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

class TestCaseViewSet(viewsets.ModelViewSet):
    """测试用例视图集，提供标准的CRUD操作"""
    queryset = TestCase.objects.filter(is_deleted=False)
    serializer_class = TestCaseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """根据用户权限和查询参数返回测试用例列表"""
        # 获取查询参数
        feature_id = self.request.query_params.get('feature_id', None)
        status = self.request.query_params.get('status', None)
        
        # 基础查询集
        queryset = TestCase.objects.filter(is_deleted=False)
        
        # 根据特性ID过滤
        if feature_id:
            queryset = queryset.filter(feature_id=feature_id)
        
        # 根据状态过滤
        if status:
            queryset = queryset.filter(status=status)
        
        return queryset
    
    def perform_create(self, serializer):
        """创建测试用例"""
        # 保存测试用例数据
        serializer.save()
        
    def perform_update(self, serializer):
        """更新测试用例信息"""
        # 可以在这里添加更新前的验证逻辑
        serializer.save()
        
    def perform_destroy(self, instance):
        """软删除测试用例，并更新对应特性的用例计数"""
        # 记录特性ID
        feature_id = instance.feature_id
        
        # 软删除测试用例
        instance.soft_delete()
        
        # 更新特性的用例计数
        try:
            feature = Feature.objects.get(id=feature_id, is_deleted=False)
            feature.case_count = TestCase.objects.filter(feature_id=feature_id, is_deleted=False).count()
            feature.save()
        except Feature.DoesNotExist:
            pass

class FeatureTestCaseRelationViewSet(viewsets.ModelViewSet):
    """特性-测试用例关联视图集，提供标准的CRUD操作"""
    queryset = FeatureTestCaseRelation.objects.filter(is_deleted=False)
    serializer_class = FeatureTestCaseRelationSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwner]
    
    def get_queryset(self):
        """根据用户权限和查询参数返回关联关系列表"""
        # 获取查询参数
        feature_id = self.request.query_params.get('feature_id', None)
        test_case_id = self.request.query_params.get('test_case_id', None)
        is_primary = self.request.query_params.get('is_primary', None)
        
        # 基础查询集
        if self.request.user.is_staff:
            queryset = FeatureTestCaseRelation.objects.filter(is_deleted=False)
        else:
            queryset = FeatureTestCaseRelation.objects.filter(creator=self.request.user.username, is_deleted=False)
        
        # 根据特性ID过滤
        if feature_id:
            queryset = queryset.filter(feature_id=feature_id)
        
        # 根据测试用例ID过滤
        if test_case_id:
            queryset = queryset.filter(test_case_id=test_case_id)
        
        # 根据是否主用例过滤
        if is_primary is not None:
            queryset = queryset.filter(is_primary=is_primary.lower() == 'true')
        
        return queryset
    
    def perform_create(self, serializer):
        """创建关联关系时自动设置创建者信息"""
        # 从请求中获取当前用户信息
        user = self.request.user.username
        
        # 保存关联关系数据，并设置创建者
        serializer.save(creator=user)
        
    def perform_update(self, serializer):
        """更新关联关系信息"""
        # 可以在这里添加更新前的验证逻辑
        serializer.save()
        
    def perform_destroy(self, instance):
        """软删除关联关系，并更新对应特性的用例计数"""
        # 记录特性ID
        feature_id = instance.feature_id
        
        # 软删除关联关系
        instance.soft_delete()
        
        # 更新特性的用例计数
        try:
            feature = Feature.objects.get(id=feature_id, is_deleted=False)
            feature.case_count = TestCase.objects.filter(feature_id=feature_id, is_deleted=False).count()
            feature.save()
        except Feature.DoesNotExist:
            pass
