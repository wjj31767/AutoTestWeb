from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from .models import CaseResult
from execution_manager.models import TaskExecution
from test_suite.models import TestSuite
from feature_testcase.models import TestCase
from env_manager.models import Environment
import datetime


class CaseResultModelTestCase(TestCase):
    """CaseResult模型的测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # 创建测试环境
        self.environment = Environment.objects.create(
            id='env-test-1',
            name='测试环境',
            type='FPGA',
            status='available',
            owner='testuser'
        )
        
        # 创建测试套
        self.test_suite = TestSuite.objects.create(
            name='测试测试套',
            description='用于测试的测试套',
            visible_scope='private',
            creator='testuser'
        )
        
        # 创建任务执行
        self.task_execution = TaskExecution.objects.create(
            id='task-test-1',
            suite_id=self.test_suite,
            env_id=self.environment,
            package_info='测试包信息',
            status='success',
            start_time=datetime.datetime.now(),
            end_time=datetime.datetime.now() + datetime.timedelta(minutes=30),
            executor='testuser',
            total_case=5,
            success_case=3,
            failed_case=2
        )
        
        # 创建测试用例
        self.test_case = TestCase.objects.create(
            id='testcase-test-1',
            case_id='CASE-001',
            case_name='测试用例1',
            feature_id='feature-1',
            pre_condition='测试前置条件',
            steps='测试步骤',
            expected_result='预期结果',
            creator='testuser'
        )
        
        # 创建测试用例结果
        self.case_result = CaseResult.objects.create(
            id='case-result-test-1',
            task_id=self.task_execution,
            case_id=self.test_case,
            status='success',
            mark_status='none',
            analysis_note='',
            execute_time=datetime.datetime.now(),
            log_path='/path/to/logs/test.log'
        )
    
    def test_case_result_creation(self):
        """测试CaseResult对象的创建"""
        # 检查对象是否成功创建
        self.assertEqual(CaseResult.objects.count(), 1)
        # 检查字段值是否正确
        self.assertEqual(self.case_result.status, 'success')
        self.assertEqual(self.case_result.task_id.id, self.task_execution.id)
        self.assertEqual(self.case_result.case_id.id, self.test_case.id)
    
    def test_case_result_str_representation(self):
        """测试CaseResult对象的字符串表示"""
        # 由于没有定义__str__方法，这里简单检查对象是否存在
        self.assertIsNotNone(str(self.case_result))


class CaseResultAPITestCase(TestCase):
    """CaseResult API的测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试客户端
        self.client = APIClient()
        
        # 创建测试用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # 创建测试环境
        self.environment = Environment.objects.create(
            id='env-test-1',
            name='测试环境',
            type='FPGA',
            status='available',
            owner='testuser'
        )
        
        # 创建测试套1
        self.test_suite1 = TestSuite.objects.create(
            name='测试测试套1',
            description='用于测试的测试套1',
            visible_scope='private',
            creator='testuser'
        )
        
        # 创建测试套2
        self.test_suite2 = TestSuite.objects.create(
            name='测试测试套2',
            description='用于测试的测试套2',
            visible_scope='private',
            creator='testuser'
        )
        
        # 创建任务执行1
        self.task_execution1 = TaskExecution.objects.create(
            id='task-test-1',
            suite_id=self.test_suite1,
            env_id=self.environment,
            package_info='测试包信息1',
            status='success',
            start_time=datetime.datetime.now(),
            end_time=datetime.datetime.now() + datetime.timedelta(minutes=30),
            executor='testuser',
            total_case=5,
            success_case=3,
            failed_case=2
        )
        
        # 创建任务执行2（用于测试按任务ID查询）
        self.task_execution2 = TaskExecution.objects.create(
            id='task-test-2',
            suite_id=self.test_suite1,
            env_id=self.environment,
            package_info='测试包信息2',
            status='pending',
            start_time=datetime.datetime.now() + datetime.timedelta(hours=1),
            executor='testuser',
            total_case=3,
            success_case=0,
            failed_case=0
        )
        
        # 创建测试用例
        self.test_case1 = TestCase.objects.create(
            id='testcase-test-1',
            case_id='CASE-001',
            case_name='测试用例1',
            feature_id='feature-1',
            pre_condition='测试前置条件',
            steps='测试步骤',
            expected_result='预期结果',
            creator='testuser'
        )
        
        self.test_case2 = TestCase.objects.create(
            id='testcase-test-2',
            case_id='CASE-002',
            case_name='测试用例2',
            feature_id='feature-1',
            pre_condition='测试前置条件',
            steps='测试步骤',
            expected_result='预期结果',
            creator='testuser'
        )
        
        # 创建测试用例结果
        self.case_result1 = CaseResult.objects.create(
            id='case-result-test-1',
            task_id=self.task_execution1,
            case_id=self.test_case1,
            status='success',
            mark_status='none',
            analysis_note='',
            execute_time=datetime.datetime.now(),
            log_path='/path/to/logs/test1.log'
        )
        
        self.case_result2 = CaseResult.objects.create(
            id='case-result-test-2',
            task_id=self.task_execution1,
            case_id=self.test_case2,
            status='failed',
            mark_status='to_analyze',
            analysis_note='测试失败分析',
            execute_time=datetime.datetime.now(),
            log_path='/path/to/logs/test2.log'
        )
        
        # 登录测试用户
        self.client.login(username='testuser', password='testpassword')
    
    def test_get_case_results(self):
        """测试获取所有测试用例结果列表"""
        url = reverse('caseresult-list')
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 确保返回了所有的测试用例结果
        self.assertEqual(len(response.data['results']), 2)
    
    def test_get_case_result_detail(self):
        """测试获取单个测试用例结果详情"""
        url = reverse('caseresult-detail', args=[self.case_result1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的数据是否正确
        self.assertEqual(response.data['id'], self.case_result1.id)
        self.assertEqual(response.data['status'], 'success')
    
    def test_get_results_by_suite(self):
        """测试通过测试套ID获取测试用例结果"""
        url = reverse('caseresult-get-results-by-suite', args=[self.test_suite1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的数据结构和内容
        self.assertEqual(response.data['code'], 200)
        self.assertEqual(response.data['data']['suite_id'], self.test_suite1.id)
        self.assertEqual(response.data['data']['task_id'], self.task_execution1.id)  # 应该返回最新的任务
        self.assertEqual(len(response.data['data']['case_results']), 2)
    
    def test_get_results_by_suite_not_exist(self):
        """测试获取不存在的测试套的测试用例结果"""
        url = reverse('caseresult-get-results-by-suite', args=['non-existent-suite'])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['code'], 404)
    
    def test_get_results_by_task(self):
        """测试通过任务ID获取测试用例结果"""
        url = reverse('caseresult-get-results-by-task', args=[self.task_execution1.id])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的数据结构和内容
        self.assertEqual(response.data['code'], 200)
        self.assertEqual(response.data['data']['task_id'], self.task_execution1.id)
        self.assertEqual(len(response.data['data']['case_results']), 2)
    
    def test_get_results_by_task_not_exist(self):
        """测试获取不存在的任务的测试用例结果"""
        url = reverse('caseresult-get-results-by-task', args=['non-existent-task'])
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(response.data['code'], 404)
    
    def test_filter_case_results_by_status(self):
        """测试通过状态过滤测试用例结果"""
        url = reverse('caseresult-list') + '?status=success'
        response = self.client.get(url)
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 应该只返回状态为success的测试用例结果
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['status'], 'success')
    
    def test_unauthenticated_access(self):
        """测试未认证用户的访问权限"""
        # 登出当前用户
        self.client.logout()
        
        url = reverse('caseresult-list')
        response = self.client.get(url)
        
        # 应该返回401未授权状态码
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
