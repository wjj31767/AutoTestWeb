from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import TaskExecution
from .serializers import TaskExecutionSerializer
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from common.auth import CustomTokenAuthentication
from common.utils import audit_log, get_current_user
from django_filters.rest_framework import DjangoFilterBackend
from django.utils import timezone


class TaskExecutionViewSet(viewsets.ModelViewSet):
    """任务执行信息视图集，提供标准的CRUD操作"""
    queryset = TaskExecution.objects.all()
    serializer_class = TaskExecutionSerializer
    authentication_classes = [CustomTokenAuthentication, SessionAuthentication, BasicAuthentication]
    # 恢复认证要求
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['suite_id', 'env_id', 'status', 'executor']
    search_fields = ['id', 'package_info']
    ordering_fields = ['start_time', 'end_time', 'create_time']
    ordering = ['-start_time']

    def perform_create(self, serializer):
        """创建任务执行记录时自动设置相关信息"""
        user = get_current_user(self.request)
        
        # 自动填充执行人为当前登录用户的用户名或默认值
        if hasattr(user, 'username'):
            username = user.username
        elif hasattr(user, 'user'):
            # 如果是通过token认证的用户，可能需要从user.user获取信息
            username = user.user.username
        else:
            # 提供默认用户名
            username = 'anonymous'
        
        # 准备要保存的数据，确保只传递一次executor参数
        validated_data = serializer.validated_data.copy()
        
        # 确保package_info字段有值（即使请求中没有提供）
        if 'package_info' not in validated_data or not validated_data['package_info']:
            validated_data['package_info'] = ''  # 为package_info设置默认值
        
        # 设置executor字段（如果validated_data中已有executor，这里会覆盖它）
        validated_data['executor'] = username
        
        # 使用单一的字典参数调用save方法，避免参数重复
        task = serializer.save(**validated_data)
        
        # 记录审计日志
        audit_log(
            operation_type='create_execution_task',
            operation_desc=f'创建执行任务: {task.id}',
            operated_by=user,
            request=self.request,
            module_name='execution_manager',
            object_id=str(task.id),
            new_data=serializer.data
        )
        return task

    def perform_update(self, serializer):
        """更新任务执行记录时的处理"""
        user = get_current_user(self.request)
        old_data = TaskExecutionSerializer(self.get_object()).data
        task = serializer.save()
        
        # 记录审计日志
        audit_log(
            operation_type='update_execution_task',
            operation_desc=f'更新执行任务: {task.id}',
            operated_by=user,
            request=self.request,
            module_name='execution_manager',
            object_id=str(task.id),
            old_data=old_data,
            new_data=serializer.data
        )
        return task

    def perform_destroy(self, instance):
        """删除任务执行记录时的处理"""
        user = get_current_user(self.request)
        old_data = TaskExecutionSerializer(instance).data
        instance.delete()
        
        # 记录审计日志
        audit_log(
            operation_type='delete_execution_task',
            operation_desc=f'删除执行任务: {instance.id}',
            operated_by=user,
            request=self.request,
            module_name='execution_manager',
            object_id=str(instance.id),
            old_data=old_data
        )

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """获取任务执行状态"""
        task = self.get_object()
        return Response({
            'task_id': task.id,
            'status': task.status,
            'status_display': task.get_status_display(),
            'progress': {
                'total': task.total_case,
                'success': task.success_case,
                'failed': task.failed_case,
                'pending': task.total_case - task.success_case - task.failed_case
            }
        })

    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        """启动任务执行"""
        task = self.get_object()
        if task.status != 'pending':
            return Response(
                {'error': f'任务当前状态为{task.get_status_display()}，无法启动'},
                status=400
            )
        
        # 更新任务状态和开始时间
        task.status = 'running'
        task.start_time = timezone.now()
        task.save()
        
        # 记录审计日志
        user = get_current_user(self.request)
        audit_log(
            operation_type='start_execution_task',
            operation_desc=f'启动执行任务: {task.id}',
            operated_by=user,
            request=self.request,
            module_name='execution_manager',
            object_id=str(task.id)
        )
        
        return Response({
            'task_id': task.id,
            'status': task.status,
            'start_time': task.start_time,
            'message': '任务已成功启动'
        })

    @action(detail=True, methods=['post'])
    def pause(self, request, pk=None):
        """暂停任务执行"""
        task = self.get_object()
        if task.status != 'running':
            return Response(
                {'error': f'任务当前状态为{task.get_status_display()}，无法暂停'},
                status=400
            )
        
        # 更新任务状态
        task.status = 'paused'
        task.save()
        
        # 记录审计日志
        user = get_current_user(self.request)
        audit_log(
            operation_type='pause_execution_task',
            operation_desc=f'暂停执行任务: {task.id}',
            operated_by=user,
            request=self.request,
            module_name='execution_manager',
            object_id=str(task.id)
        )
        
        return Response({
            'task_id': task.id,
            'status': task.status,
            'message': '任务已成功暂停'
        })

    @action(detail=True, methods=['post'])
    def resume(self, request, pk=None):
        """恢复任务执行"""
        task = self.get_object()
        if task.status != 'paused':
            return Response(
                {'error': f'任务当前状态为{task.get_status_display()}，无法恢复'},
                status=400
            )
        
        # 更新任务状态
        task.status = 'running'
        task.save()
        
        # 记录审计日志
        user = get_current_user(self.request)
        audit_log(
            operation_type='resume_execution_task',
            operation_desc=f'恢复执行任务: {task.id}',
            operated_by=user,
            request=self.request,
            module_name='execution_manager',
            object_id=str(task.id)
        )
        
        return Response({
            'task_id': task.id,
            'status': task.status,
            'message': '任务已成功恢复'
        })

    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        """终止任务执行"""
        task = self.get_object()
        if task.status not in ['running', 'paused']:
            return Response(
                {'error': f'任务当前状态为{task.get_status_display()}，无法终止'},
                status=400
            )
        
        # 更新任务状态和结束时间
        task.status = 'terminated'
        task.end_time = timezone.now()
        task.save()
        
        # 记录审计日志
        user = get_current_user(self.request)
        audit_log(
            operation_type='terminate_execution_task',
            operation_desc=f'终止执行任务: {task.id}',
            operated_by=user,
            request=self.request,
            module_name='execution_manager',
            object_id=str(task.id)
        )
        
        return Response({
            'task_id': task.id,
            'status': task.status,
            'end_time': task.end_time,
            'message': '任务已成功终止'
        })

    @action(detail=True, methods=['get'])
    def statistics(self, request, pk=None):
        """获取任务执行统计信息"""
        task = self.get_object()
        
        # 计算执行时长
        duration = None
        if task.start_time:
            end_time = task.end_time if task.end_time else timezone.now()
            duration_seconds = (end_time - task.start_time).total_seconds()
            duration = {
                'seconds': int(duration_seconds),
                'formatted': f'{int(duration_seconds // 3600)}h {int((duration_seconds % 3600) // 60)}m {int(duration_seconds % 60)}s'
            }
        
        # 计算成功率
        success_rate = 0
        if task.total_case > 0:
            success_rate = (task.success_case / task.total_case) * 100
        
        return Response({
            'task_id': task.id,
            'statistics': {
                'total_case': task.total_case,
                'success_case': task.success_case,
                'failed_case': task.failed_case,
                'pending_case': task.total_case - task.success_case - task.failed_case,
                'success_rate': round(success_rate, 2),
                'duration': duration,
                'status': task.status,
                'status_display': task.get_status_display()
            }
        })
