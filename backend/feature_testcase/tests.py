from django.test import TestCase

from django.test import TestCase
from rest_framework.test import APIClient
from django.urls import reverse
from rest_framework import status
from module_manager.models import Module
from .models import Feature, TestCase
from django.contrib.auth.models import User
import json

class FeatureTestCase(TestCase):
    """特性管理API测试"""
    
    def setUp(self):
        """测试环境初始化"""
        # 创建测试用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.admin_user = User.objects.create_superuser(username='adminuser', email='admin@example.com', password='adminpassword')
        
        # 创建测试客户端
        self.client = APIClient()
        self.admin_client = APIClient()
        
        # 用户登录
        self.client.login(username='testuser', password='testpassword')
        self.admin_client.login(username='adminuser', password='adminpassword')
        
        # 创建测试模块
        self.module = Module.objects.create(
            id='module-test-001',
            module_name='Test Module',
            chip_model='Chip-A-1.0',
            description='Test module description',
            creator='testuser'
        )
        
        # 创建测试特性
        self.feature = Feature.objects.create(
            id='feature-test-001',
            feature_name='Test Feature',
            module_id=self.module.id,
            description='Test feature description',
            creator='testuser'
        )
    
    def test_create_feature(self):
        """测试创建特性API"""
        url = reverse('feature-list')
        data = {
            'feature_name': 'New Feature',
            'module_id': self.module.id,
            'description': 'New feature description'
        }
        
        # 测试普通用户创建特性
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Feature.objects.count(), 2)
        self.assertEqual(Feature.objects.latest('create_time').feature_name, 'New Feature')
        
        # 测试创建特性后，模块的特性计数是否更新
        module = Module.objects.get(id=self.module.id)
        self.assertEqual(module.feature_count, 2)
    
    def test_list_features(self):
        """测试列出特性API"""
        url = reverse('feature-list')
        
        # 测试普通用户只能看到自己创建的特性
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # 创建一个由admin创建的特性
        admin_feature = Feature.objects.create(
            id='feature-test-002',
            feature_name='Admin Feature',
            module_id=self.module.id,
            description='Admin feature description',
            creator='adminuser'
        )
        
        # 测试admin可以看到所有特性
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_feature(self):
        """测试获取单个特性API"""
        url = reverse('feature-detail', args=[self.feature.id])
        
        # 测试普通用户获取自己创建的特性
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['feature_name'], 'Test Feature')
        
        # 测试admin获取任意特性
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_feature(self):
        """测试更新特性API"""
        url = reverse('feature-detail', args=[self.feature.id])
        data = {
            'feature_name': 'Updated Feature',
            'module_id': self.module.id,
            'description': 'Updated feature description'
        }
        
        # 测试普通用户更新自己创建的特性
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['feature_name'], 'Updated Feature')
        
        # 测试admin更新任意特性
        data['feature_name'] = 'Admin Updated Feature'
        response = self.admin_client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['feature_name'], 'Admin Updated Feature')
    
    def test_delete_feature(self):
        """测试删除特性API"""
        url = reverse('feature-detail', args=[self.feature.id])
        
        # 测试普通用户删除自己创建的特性
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # 检查特性是否被软删除
        self.assertEqual(Feature.objects.filter(is_deleted=False).count(), 0)
        self.assertEqual(Feature.objects.filter(is_deleted=True).count(), 1)
        
        # 检查模块的特性计数是否更新
        module = Module.objects.get(id=self.module.id)
        self.assertEqual(module.feature_count, 0)

class TestCaseTestCase(TestCase):
    """测试用例管理API测试"""
    
    def setUp(self):
        """测试环境初始化"""
        # 创建测试用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.admin_user = User.objects.create_superuser(username='adminuser', email='admin@example.com', password='adminpassword')
        
        # 创建测试客户端
        self.client = APIClient()
        self.admin_client = APIClient()
        
        # 用户登录
        self.client.login(username='testuser', password='testpassword')
        self.admin_client.login(username='adminuser', password='adminpassword')
        
        # 创建测试模块
        self.module = Module.objects.create(
            id='module-test-001',
            module_name='Test Module',
            chip_model='Chip-A-1.0',
            description='Test module description',
            creator='testuser'
        )
        
        # 创建测试特性
        self.feature = Feature.objects.create(
            id='feature-test-001',
            feature_name='Test Feature',
            module_id=self.module.id,
            description='Test feature description',
            creator='testuser'
        )
        
        # 创建测试用例
        self.test_case = TestCase.objects.create(
            id='case-test-001',
            case_id='TC-001',
            case_name='Test Case',
            feature_id=self.feature.id,
            pre_condition='Test pre condition',
            execute_steps='Test execute steps',
            expected_result='Test expected result',
            script_file='/path/to/script.py',
            status='Available',
            creator='testuser'
        )
    
    def test_create_test_case(self):
        """测试创建测试用例API"""
        url = reverse('testcase-list')
        data = {
            'case_id': 'TC-002',
            'case_name': 'New Test Case',
            'feature_id': self.feature.id,
            'pre_condition': 'New pre condition',
            'execute_steps': 'New execute steps',
            'expected_result': 'New expected result',
            'script_file': '/path/to/new_script.py',
            'status': 'Available'
        }
        
        # 测试普通用户创建测试用例
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(TestCase.objects.count(), 2)
        self.assertEqual(TestCase.objects.latest('create_time').case_name, 'New Test Case')
        
        # 测试创建测试用例后，特性的用例计数是否更新
        feature = Feature.objects.get(id=self.feature.id)
        self.assertEqual(feature.case_count, 2)
    
    def test_list_test_cases(self):
        """测试列出测试用例API"""
        url = reverse('testcase-list')
        
        # 测试普通用户只能看到自己创建的测试用例
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        
        # 创建一个由admin创建的测试用例
        admin_test_case = TestCase.objects.create(
            id='case-test-002',
            case_id='TC-ADMIN-001',
            case_name='Admin Test Case',
            feature_id=self.feature.id,
            pre_condition='Admin pre condition',
            execute_steps='Admin execute steps',
            expected_result='Admin expected result',
            script_file='/path/to/admin_script.py',
            status='Available',
            creator='adminuser'
        )
        
        # 测试admin可以看到所有测试用例
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)
    
    def test_retrieve_test_case(self):
        """测试获取单个测试用例API"""
        url = reverse('testcase-detail', args=[self.test_case.id])
        
        # 测试普通用户获取自己创建的测试用例
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['case_name'], 'Test Case')
        
        # 测试admin获取任意测试用例
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
    
    def test_update_test_case(self):
        """测试更新测试用例API"""
        url = reverse('testcase-detail', args=[self.test_case.id])
        data = {
            'case_id': 'TC-001',
            'case_name': 'Updated Test Case',
            'feature_id': self.feature.id,
            'pre_condition': 'Updated pre condition',
            'execute_steps': 'Updated execute steps',
            'expected_result': 'Updated expected result',
            'script_file': '/path/to/updated_script.py',
            'status': 'Unavailable'
        }
        
        # 测试普通用户更新自己创建的测试用例
        response = self.client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['case_name'], 'Updated Test Case')
        self.assertEqual(response.data['status'], 'Unavailable')
        
        # 测试admin更新任意测试用例
        data['case_name'] = 'Admin Updated Test Case'
        response = self.admin_client.put(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['case_name'], 'Admin Updated Test Case')
    
    def test_delete_test_case(self):
        """测试删除测试用例API"""
        url = reverse('testcase-detail', args=[self.test_case.id])
        
        # 测试普通用户删除自己创建的测试用例
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        
        # 检查测试用例是否被软删除
        self.assertEqual(TestCase.objects.filter(is_deleted=False).count(), 0)
        self.assertEqual(TestCase.objects.filter(is_deleted=True).count(), 1)
        
        # 检查特性的用例计数是否更新
        feature = Feature.objects.get(id=self.feature.id)
        self.assertEqual(feature.case_count, 0)
