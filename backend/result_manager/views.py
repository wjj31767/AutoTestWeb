from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import CaseResult
from .serializers import CaseResultSerializer, TestSuiteCaseResultsSerializer
from execution_manager.models import TaskExecution
from test_suite.models import TestSuite
from rest_framework.authentication import SessionAuthentication, BasicAuthentication
from common.auth import CustomTokenAuthentication


class CaseResultViewSet(viewsets.ModelViewSet):
    """用例结果视图集，提供标准的CRUD操作"""
    queryset = CaseResult.objects.all()
    serializer_class = CaseResultSerializer
    authentication_classes = [CustomTokenAuthentication, SessionAuthentication, BasicAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    filterset_fields = ['task_id', 'case_id', 'status', 'mark_status']
    ordering_fields = ['execute_time']
    ordering = ['-execute_time']
    
    @action(detail=False, methods=['get'], url_path='by-suite/(?P<suite_id>[^/]+)')
    def get_results_by_suite(self, request, suite_id=None):
        """
        通过测试套ID获取该测试套的所有测试用例结果
        后端result_manager使用6.2.3的表当基础项，通过点击详情可以看到测试套的每个测试用例的结果（对应6.2.4的表）
        
        URL路径: /api/results/by-suite/{suite_id}/
        """
        try:
            # 验证测试套是否存在
            test_suite = TestSuite.objects.get(id=suite_id)
            
            # 获取该测试套下的所有任务执行记录（6.2.3表）
            # 这里假设我们只获取最新的任务执行记录，可以根据实际需求调整
            task_executions = TaskExecution.objects.filter(suite_id=suite_id).order_by('-start_time')
            
            if not task_executions.exists():
                return Response({
                    'code': 404,
                    'message': '该测试套没有相关的任务执行记录'
                }, status=404)
            
            # 获取最新的任务执行记录
            latest_task = task_executions.first()
            
            # 获取该任务下的所有测试用例结果（6.2.4表）
            case_results = CaseResult.objects.filter(task_id=latest_task.id)
            
            # 统计结果
            total_cases = case_results.count()
            success_cases = case_results.filter(status='success').count()
            failed_cases = case_results.filter(status='failed').count()
            skipped_cases = case_results.filter(status='skipped').count()
            
            # 构造响应数据
            result_data = {
                'suite_id': test_suite.id,
                'suite_name': getattr(test_suite, 'name', f'测试套{suite_id}'),
                'task_id': latest_task.id,
                'task_status': latest_task.status,
                'start_time': latest_task.start_time,
                'end_time': latest_task.end_time,
                'total_cases': total_cases,
                'success_cases': success_cases,
                'failed_cases': failed_cases,
                'skipped_cases': skipped_cases,
                'case_results': CaseResultSerializer(case_results, many=True).data
            }
            
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': result_data
            })
            
        except TestSuite.DoesNotExist:
            return Response({
                'code': 404,
                'message': '测试套不存在'
            }, status=404)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取测试用例结果失败: {str(e)}'
            }, status=500)
    
    @action(detail=False, methods=['get'], url_path='by-task/(?P<task_id>[^/]+)')
    def get_results_by_task(self, request, task_id=None):
        """
        通过任务ID获取该任务的所有测试用例结果
        URL路径: /api/results/by-task/{task_id}/
        """
        try:
            # 验证任务是否存在
            task_execution = TaskExecution.objects.get(id=task_id)
            
            # 获取该任务下的所有测试用例结果
            case_results = CaseResult.objects.filter(task_id=task_id)
            
            # 统计结果
            total_cases = case_results.count()
            success_cases = case_results.filter(status='success').count()
            failed_cases = case_results.filter(status='failed').count()
            skipped_cases = case_results.filter(status='skipped').count()
            
            # 获取关联的测试套信息
            test_suite = task_execution.suite_id
            
            # 构造响应数据
            result_data = {
                'suite_id': test_suite.id,
                'suite_name': getattr(test_suite, 'name', f'测试套{test_suite.id}'),
                'task_id': task_execution.id,
                'task_status': task_execution.status,
                'start_time': task_execution.start_time,
                'end_time': task_execution.end_time,
                'total_cases': total_cases,
                'success_cases': success_cases,
                'failed_cases': failed_cases,
                'skipped_cases': skipped_cases,
                'case_results': CaseResultSerializer(case_results, many=True).data
            }
            
            return Response({
                'code': 200,
                'message': '获取成功',
                'data': result_data
            })
            
        except TaskExecution.DoesNotExist:
            return Response({
                'code': 404,
                'message': '任务不存在'
            }, status=404)
        except Exception as e:
            return Response({
                'code': 500,
                'message': f'获取测试用例结果失败: {str(e)}'
            }, status=500)
