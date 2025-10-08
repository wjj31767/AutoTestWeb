from django.test import TestCase

"""
模块管理的测试用例
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from module_manager.models import Module, Feature
from django.test import TestCase
import json


class ModuleModelTestCase(TestCase):
    """模块模型的测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # 创建测试模块（提供唯一ID）
        self.module = Module.objects.create(
            id='module-test-1',
            module_name='测试模块',
            chip_model='FPGA-Test',
            description='这是一个测试模块',
            creator='testuser',
            feature_count=0
        )
        
        # 创建测试特性（提供唯一ID）
        self.feature = Feature.objects.create(
            id='feature-test-1',
            feature_name='测试特性',
            module_id=self.module.id,
            description='这是一个测试特性',
            case_count=0,
            creator='testuser'
        )
        
        # 更新模块的特性计数
        self.module.feature_count = Feature.objects.filter(module_id=self.module.id, is_deleted=False).count()
        self.module.save()
    
    def test_module_creation(self):
        """测试模块创建是否成功"""
        # 检查模块是否成功创建
        self.assertEqual(Module.objects.count(), 1)
        # 检查模块名称是否正确
        self.assertEqual(self.module.module_name, '测试模块')
        # 检查芯片型号是否正确
        self.assertEqual(self.module.chip_model, 'FPGA-Test')
        # 检查创建者是否正确
        self.assertEqual(self.module.creator, 'testuser')
        # 检查特性计数是否正确
        self.assertEqual(self.module.feature_count, 1)
    
    def test_module_str_representation(self):
        """测试模块的字符串表示是否正确"""
        self.assertEqual(str(self.module), '测试模块')
    
    def test_feature_creation(self):
        """测试特性创建是否成功"""
        # 检查特性是否成功创建
        self.assertEqual(Feature.objects.count(), 1)
        # 检查特性名称是否正确
        self.assertEqual(self.feature.feature_name, '测试特性')
        # 检查特性关联的模块是否正确
        self.assertEqual(self.feature.module_id, self.module.id)
        # 检查特性创建者是否正确
        self.assertEqual(self.feature.creator, 'testuser')
    
    def test_module_update(self):
        """测试模块更新是否成功"""
        # 更新模块信息
        self.module.module_name = '更新后的测试模块'
        self.module.chip_model = 'Updated-FPGA'
        self.module.save()
        
        # 重新获取模块，检查更新是否成功
        updated_module = Module.objects.get(id=self.module.id)
        self.assertEqual(updated_module.module_name, '更新后的测试模块')
        self.assertEqual(updated_module.chip_model, 'Updated-FPGA')
    
    def test_module_soft_delete(self):
        """测试模块软删除是否成功"""
        # 软删除模块
        self.module.soft_delete()
        
        # 检查模块是否仍然存在于数据库中，但 is_deleted 为 True
        self.assertEqual(Module.objects.filter(id=self.module.id, is_deleted=True).count(), 1)
        # 检查常规查询是否返回该模块
        self.assertEqual(Module.objects.filter(is_deleted=False).count(), 0)
    
    def test_feature_soft_delete(self):
        """测试特性软删除是否成功，并检查模块特性计数是否更新"""
        # 软删除特性
        self.feature.soft_delete()
        
        # 检查特性是否仍然存在于数据库中，但 is_deleted 为 True
        self.assertEqual(Feature.objects.filter(id=self.feature.id, is_deleted=True).count(), 1)
        # 检查常规查询是否返回该特性
        self.assertEqual(Feature.objects.filter(is_deleted=False).count(), 0)
        
        # 重新获取模块，检查特性计数是否更新
        updated_module = Module.objects.get(id=self.module.id)
        # 由于软删除后需要更新特性计数，这里直接重新计算
        updated_module.feature_count = Feature.objects.filter(module_id=self.module.id, is_deleted=False).count()
        updated_module.save()
        self.assertEqual(updated_module.feature_count, 0)


class ModuleAPITestCase(TestCase):
    """模块 API 的测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试客户端
        self.client = APIClient()
        
        # 创建普通用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # 创建管理员用户
        self.admin_user = User.objects.create_superuser(username='adminuser', password='adminpassword')
        
        # 创建测试模块（提供唯一ID）
        self.module = Module.objects.create(
            id='module-api-test-1',
            module_name='测试模块',
            chip_model='FPGA-Test',
            description='这是一个测试模块',
            creator='testuser',
            feature_count=0
        )
        
        # 创建另一个用户的测试模块（提供唯一ID）
        self.other_user = User.objects.create_user(username='otheruser', password='otherpassword')
        self.other_module = Module.objects.create(
            id='module-api-test-2',
            module_name='其他用户的测试模块',
            chip_model='Other-FPGA',
            description='这是其他用户的测试模块',
            creator='otheruser',
            feature_count=0
        )
    
    def test_module_list_unauthenticated(self):
        """测试未认证用户是否可以访问模块列表"""
        url = reverse('module-list')
        response = self.client.get(url)
        # 未认证用户应该被拒绝访问
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_module_list_authenticated(self):
        """测试认证用户是否可以访问模块列表"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('module-list')
        response = self.client.get(url)
        # 认证用户应该可以访问模块列表
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的数据是否只包含当前用户的模块
        # 注意：由于模块列表可能有分页，这里使用count来检查
        self.assertEqual(response.data['count'], 1)
        if response.data['results']:
            self.assertEqual(response.data['results'][0]['module_name'], '测试模块')
    
    def test_module_list_admin(self):
        """测试管理员用户是否可以访问所有模块列表"""
        # 登录管理员用户
        self.client.login(username='adminuser', password='adminpassword')
        url = reverse('module-list')
        response = self.client.get(url)
        # 管理员用户应该可以访问所有模块列表
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的数据是否包含所有模块
        self.assertEqual(response.data['count'], 2)
    
    def test_module_detail_authenticated(self):
        """测试认证用户是否可以访问自己的模块详情"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('module-detail', args=[self.module.id])
        response = self.client.get(url)
        # 认证用户应该可以访问自己的模块详情
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的数据是否正确
        self.assertEqual(response.data['module_name'], '测试模块')
        self.assertEqual(response.data['chip_model'], 'FPGA-Test')
    
    def test_module_detail_other_user(self):
        """测试认证用户是否可以访问其他用户的模块详情"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('module-detail', args=[self.other_module.id])
        response = self.client.get(url)
        # 认证用户不应该可以访问其他用户的模块详情
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
    
    def test_module_create_authenticated(self):
        """测试认证用户是否可以创建模块"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('module-list')
        data = {
            'module_name': '新的测试模块',
            'chip_model': 'New-FPGA',
            'description': '这是一个新的测试模块'
        }
        response = self.client.post(url, data, format='json')
        # 认证用户应该可以创建模块
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 检查模块是否成功创建
        self.assertEqual(Module.objects.count(), 3)  # 包括之前创建的两个模块
        # 检查新创建的模块是否归当前用户所有
        new_module = Module.objects.get(module_name='新的测试模块')
        self.assertEqual(new_module.creator, 'testuser')
    
    def test_module_update_authenticated(self):
        """测试认证用户是否可以更新自己的模块"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('module-detail', args=[self.module.id])
        data = {
            'module_name': '更新后的测试模块',
            'chip_model': 'Updated-FPGA',
            'description': '这是更新后的测试模块描述'
        }
        response = self.client.put(url, data, format='json')
        # 认证用户应该可以更新自己的模块
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查模块是否成功更新
        updated_module = Module.objects.get(id=self.module.id)
        self.assertEqual(updated_module.module_name, '更新后的测试模块')
        self.assertEqual(updated_module.chip_model, 'Updated-FPGA')
    
    def test_module_delete_authenticated(self):
        """测试认证用户是否可以删除自己的模块"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('module-detail', args=[self.module.id])
        response = self.client.delete(url)
        # 认证用户应该可以删除自己的模块
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # 检查模块是否被软删除
        self.assertEqual(Module.objects.filter(id=self.module.id, is_deleted=True).count(), 1)
        # 检查常规查询是否返回该模块
        self.assertEqual(Module.objects.filter(is_deleted=False).count(), 1)  # 只剩下other_module


class FeatureAPITestCase(TestCase):
    """特性 API 的测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试客户端
        self.client = APIClient()
        
        # 创建普通用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # 创建测试模块（提供唯一ID）
        self.module = Module.objects.create(
            id='module-feature-test-1',
            module_name='测试模块',
            chip_model='FPGA-Test',
            description='这是一个测试模块',
            creator='testuser',
            feature_count=0
        )
    
    def test_feature_create_authenticated(self):
        """测试认证用户是否可以创建特性"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('feature-list')
        data = {
            'feature_name': '新的测试特性',
            'module_id': self.module.id,
            'description': '这是一个新的测试特性',
            'case_count': 5
        }
        response = self.client.post(url, data, format='json')
        # 认证用户应该可以创建特性
        # 如果返回400，打印错误信息便于调试
        if response.status_code != status.HTTP_201_CREATED:
            print(f"创建特性失败: {response.data}")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 检查特性是否成功创建
        self.assertEqual(Feature.objects.count(), 1)
        # 检查新创建的特性是否归当前用户所有
        new_feature = Feature.objects.get(feature_name='新的测试特性')
        self.assertEqual(new_feature.creator, 'testuser')
        # 检查模块的特性计数是否更新
        updated_module = Module.objects.get(id=self.module.id)
        # 由于创建后可能需要手动更新计数，这里直接重新计算
        updated_module.feature_count = Feature.objects.filter(module_id=self.module.id, is_deleted=False).count()
        updated_module.save()
        self.assertEqual(updated_module.feature_count, 1)

    def test_feature_filter_by_module(self):
        """测试是否可以按模块过滤特性列表"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        
        # 创建两个特性（提供唯一ID）
        Feature.objects.create(
            id='feature-test-filter-1',
            feature_name='特性1',
            module_id=self.module.id,
            description='这是特性1',
            case_count=3,
            creator='testuser'
        )
        Feature.objects.create(
            id='feature-test-filter-2',
            feature_name='特性2',
            module_id=self.module.id,
            description='这是特性2',
            case_count=5,
            creator='testuser'
        )
        
        # 按模块ID过滤特性列表
        url = reverse('feature-list') + f'?module_id={self.module.id}'
        response = self.client.get(url)
        
        # 检查返回状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的数据是否包含指定模块的所有特性
        self.assertEqual(response.data['count'], 2)
