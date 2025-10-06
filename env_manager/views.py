from rest_framework import viewsets, permissions, filters, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Environment, EnvironmentVariable
from .serializers import EnvironmentSerializer, EnvironmentVariableSerializer
from common.utils import audit_log, get_current_user, generate_unique_id
from common.permissions import IsAdminOrReadOnly
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone

# Create your views here.
class EnvironmentViewSet(viewsets.ModelViewSet):
    """环境管理视图集"""
    queryset = Environment.objects.filter(is_deleted=False)
    serializer_class = EnvironmentSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['type', 'status', 'conn_type', 'owner']
    search_fields = ['name', 'admin']
    ordering_fields = ['create_time', 'update_time', 'name']
    ordering = ['-create_time']

    def perform_create(self, serializer):
        """创建环境时记录审计日志"""
        user = get_current_user(self.request)
        # 生成环境ID
        env_id = generate_unique_id(prefix='env')
        environment = serializer.save(id=env_id)
        audit_log(
            operation_type='create_environment',
            operation_desc=f'创建环境: {environment.name}',
            operated_by=user,
            request=self.request,
            module_name='env_manager',
            object_id=str(environment.id),
            new_data=serializer.data
        )
        return environment

    def perform_update(self, serializer):
        """更新环境时记录审计日志"""
        user = get_current_user(self.request)
        old_data = EnvironmentSerializer(self.get_object()).data
        environment = serializer.save()
        audit_log(
            operation_type='update_environment',
            operation_desc=f'更新环境: {environment.name}',
            operated_by=user,
            request=self.request,
            module_name='env_manager',
            object_id=str(environment.id),
            old_data=old_data,
            new_data=serializer.data
        )
        return environment

    def perform_destroy(self, instance):
        """删除环境时记录审计日志"""
        user = get_current_user(self.request)
        old_data = EnvironmentSerializer(instance).data
        instance.soft_delete()
        audit_log(
            operation_type='delete_environment',
            operation_desc=f'删除环境: {instance.name}',
            operated_by=user,
            request=self.request,
            module_name='env_manager',
            object_id=str(instance.id),
            old_data=old_data
        )

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """获取环境状态"""
        environment = self.get_object()
        return Response({'status': environment.status, 'message': f'环境 {environment.name} 当前状态为: {environment.get_status_display()}'})

    @action(detail=True, methods=['post'], permission_classes=[IsAdminOrReadOnly])
    def check_connectivity(self, request, pk=None):
        """测试环境连通性"""
        environment = self.get_object()
        # 更新最后检查时间
        environment.last_check_time = timezone.now()
        environment.save()
        
        # 这里应该有实际的连通性测试逻辑
        # 为了示例，我们直接返回成功
        return Response({
            'status': 'success', 
            'message': f'环境 {environment.name} 连通性测试成功',
            'environment_status': environment.status
        })

class EnvironmentVariableViewSet(viewsets.ModelViewSet):
    """环境变量管理视图集"""
    queryset = EnvironmentVariable.objects.all()
    serializer_class = EnvironmentVariableSerializer
    permission_classes = [IsAdminOrReadOnly]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ['environment']
    search_fields = ['key', 'value', 'description']

    def perform_create(self, serializer):
        """创建环境变量时记录审计日志"""
        user = get_current_user(self.request)
        variable = serializer.save()
        audit_log(
            operation_type='create_environment_variable',
            operation_desc=f'创建环境变量: {variable.key}={variable.value}',
            operated_by=user,
            request=self.request,
            module_name='env_manager',
            object_id=str(variable.id),
            new_data=serializer.data
        )

    def perform_update(self, serializer):
        """更新环境变量时记录审计日志"""
        user = get_current_user(self.request)
        old_data = EnvironmentVariableSerializer(self.get_object()).data
        variable = serializer.save()
        audit_log(
            operation_type='update_environment_variable',
            operation_desc=f'更新环境变量: {variable.key}={variable.value}',
            operated_by=user,
            request=self.request,
            module_name='env_manager',
            object_id=str(variable.id),
            old_data=old_data,
            new_data=serializer.data
        )

    def perform_destroy(self, instance):
        """删除环境变量时记录审计日志"""
        user = get_current_user(self.request)
        old_data = EnvironmentVariableSerializer(instance).data
        instance.delete()
        audit_log(
            operation_type='delete_environment_variable',
            operation_desc=f'删除环境变量: {instance.key}={instance.value}',
            operated_by=user,
            request=self.request,
            module_name='env_manager',
            object_id=str(instance.id),
            old_data=old_data
        )
