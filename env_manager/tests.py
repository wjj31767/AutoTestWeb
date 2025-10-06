from django.test import TestCase

"""
环境管理模块的测试用例
"""
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from env_manager.models import Environment, EnvironmentVariable
from common.models import BaseModel
import json
import datetime

class EnvironmentModelTestCase(TestCase):
    """环境模型的测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # 创建测试环境
        self.environment = Environment.objects.create(
            id='env-test-1',  # 显式设置id值
            name='测试环境',
            type='FPGA',
            status='available',
            conn_type='Telnet',
            owner='testuser',
            admin='admin',
            admin_password='password123',
            cabinet_frame_slot='cabinet1-frame1-slot1',
            port='22'
        )
        
        # 创建测试环境变量
        self.env_var = EnvironmentVariable.objects.create(
            environment=self.environment,
            key='TEST_VAR',
            value='test_value'
        )
    
    def test_environment_creation(self):
        """测试环境创建是否成功"""
        # 检查环境是否成功创建
        self.assertEqual(Environment.objects.count(), 1)
        # 检查环境名称是否正确
        self.assertEqual(self.environment.name, '测试环境')
        # 检查环境类型是否正确
        self.assertEqual(self.environment.type, 'FPGA')
        # 检查环境状态是否正确
        self.assertEqual(self.environment.status, 'available')
        # 检查环境连接类型是否正确
        self.assertEqual(self.environment.conn_type, 'Telnet')
        # 检查环境所有者是否正确
        self.assertEqual(self.environment.owner, 'testuser')
        # 检查环境是否是 BaseModel 的子类
        self.assertTrue(issubclass(Environment, BaseModel))
    
    def test_environment_str_representation(self):
        """测试环境的字符串表示是否正确"""
        self.assertEqual(str(self.environment), '测试环境')
    
    def test_environment_variable_creation(self):
        """测试环境变量创建是否成功"""
        # 检查环境变量是否成功创建
        self.assertEqual(EnvironmentVariable.objects.count(), 1)
        # 检查环境变量名称是否正确
        self.assertEqual(self.env_var.key, 'TEST_VAR')
        # 检查环境变量值是否正确
        self.assertEqual(self.env_var.value, 'test_value')
        # 检查环境变量关联的环境是否正确
        self.assertEqual(self.env_var.environment, self.environment)
        # EnvironmentVariable is not a subclass of BaseModel based on the model definition
        self.assertTrue(hasattr(EnvironmentVariable, 'id'))  # Verify it's a Django model
    
    def test_environment_variable_str_representation(self):
        """测试环境变量的字符串表示是否正确"""
        self.assertEqual(str(self.env_var), '测试环境 - TEST_VAR')
    
    def test_environment_variable_unique_constraint(self):
        """测试环境变量的唯一约束是否生效"""
        # 尝试创建同名的环境变量，应该失败
        with self.assertRaises(Exception):
            EnvironmentVariable.objects.create(
                environment=self.environment,
                key='TEST_VAR',
                value='another_value'
            )
    
    def test_environment_update(self):
        """测试环境更新是否成功"""
        # 更新环境信息
        self.environment.name = '更新后的测试环境'
        self.environment.status = 'occupied'  # 使用有效的状态值
        self.environment.save()
        
        # 重新获取环境，检查更新是否成功
        updated_environment = Environment.objects.get(id=self.environment.id)
        self.assertEqual(updated_environment.name, '更新后的测试环境')
        self.assertEqual(updated_environment.status, 'occupied')
    
    def test_environment_soft_delete(self):
        """测试环境软删除是否成功"""
        # 软删除环境
        self.environment.soft_delete()
        
        # 检查环境是否仍然存在于数据库中，但 is_deleted 为 True
        self.assertEqual(Environment.objects.filter(id=self.environment.id, is_deleted=True).count(), 1)
        # 检查常规查询是否返回该环境
        self.assertEqual(Environment.objects.filter(is_deleted=False).count(), 0)

class EnvironmentAPITestCase(TestCase):
    """环境 API 的测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试客户端
        self.client = APIClient()
        
        # 创建普通用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        
        # 创建管理员用户
        self.admin_user = User.objects.create_superuser(username='adminuser', password='adminpassword')
        
        # 创建测试环境
        self.environment = Environment.objects.create(
            id='env-test-1',  # 显式设置id值
            name='测试环境',
            type='FPGA',
            status='available',
            conn_type='Telnet',
            owner='testuser',
            admin='admin',
            admin_password='password123',
            cabinet_frame_slot='cabinet1-frame1-slot1',
            port='22'
        )
        
        # 创建测试环境变量
        self.env_var = EnvironmentVariable.objects.create(
            environment=self.environment,
            key='TEST_VAR',
            value='test_value'
        )
    
    def test_environment_list_unauthenticated(self):
        """测试未认证用户是否可以访问环境列表"""
        url = reverse('environment-list')
        response = self.client.get(url)
        # 未认证用户应该被拒绝访问
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_environment_list_authenticated(self):
        """测试认证用户是否可以访问环境列表"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('environment-list')
        response = self.client.get(url)
        # 认证用户应该可以访问环境列表
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的数据是否包含测试环境
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], '测试环境')
    
    def test_environment_detail_authenticated(self):
        """测试认证用户是否可以访问环境详情"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('environment-detail', args=[self.environment.id])
        response = self.client.get(url)
        # 认证用户应该可以访问环境详情
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的数据是否正确
        self.assertEqual(response.data['name'], '测试环境')
        self.assertEqual(response.data['type'], 'FPGA')
    
    def test_environment_create_admin(self):
        """测试管理员是否可以创建环境"""
        # 登录管理员用户
        self.client.login(username='adminuser', password='adminpassword')
        url = reverse('environment-list')
        data = {
            'name': '新的测试环境',
            'type': 'FPGA',
            'status': 'available',
            'conn_type': 'Telnet',
            'owner': 'testuser',
            'admin': 'admin',
            'admin_password': 'password123',
            'cabinet_frame_slot': 'cabinet2-frame2-slot2',
            'port': '23'
        }
        response = self.client.post(url, data, format='json')
        # 管理员用户应该可以创建环境
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 检查环境是否成功创建
        self.assertEqual(Environment.objects.count(), 2)
        self.assertEqual(Environment.objects.get(id=response.data['id']).name, '新的测试环境')
    
    def test_environment_create_normal_user(self):
        """测试普通用户是否可以创建环境"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('environment-list')
        data = {
            'name': '新的测试环境',
            'type': 'FPGA',
            'status': 'available',
            'conn_type': 'Telnet',
            'owner': 'testuser',
            'admin': 'admin',
            'admin_password': 'password123',
            'cabinet_frame_slot': 'cabinet2-frame2-slot2',
            'port': '23'
        }
        response = self.client.post(url, data, format='json')
        # 普通用户不应该可以创建环境
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_environment_update_admin(self):
        """测试管理员是否可以更新环境"""
        # 登录管理员用户
        self.client.login(username='adminuser', password='adminpassword')
        url = reverse('environment-detail', args=[self.environment.id])
        data = {
            'name': '更新后的测试环境',
            'type': 'FPGA',
            'status': 'occupied',  # 使用有效的状态值
            'conn_type': 'Telnet',
            'owner': 'testuser',
            'admin': 'admin',
            'admin_password': 'password123',
            'cabinet_frame_slot': 'cabinet1-frame1-slot1',
            'port': '22'
        }
        response = self.client.put(url, data, format='json')
        # 管理员用户应该可以更新环境
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查环境是否成功更新
        updated_environment = Environment.objects.get(id=self.environment.id)
        self.assertEqual(updated_environment.name, '更新后的测试环境')
        self.assertEqual(updated_environment.type, 'FPGA')
    
    def test_environment_delete_admin(self):
        """测试管理员是否可以删除环境"""
        # 登录管理员用户
        self.client.login(username='adminuser', password='adminpassword')
        url = reverse('environment-detail', args=[self.environment.id])
        response = self.client.delete(url)
        # 管理员用户应该可以删除环境
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        # 检查环境是否成功删除（软删除）
        self.assertEqual(Environment.objects.filter(id=self.environment.id, is_deleted=True).count(), 1)
        self.assertEqual(Environment.objects.filter(is_deleted=False).count(), 0)
    
    def test_environment_variable_list(self):
        """测试环境变量列表 API"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('environment_variable-list')
        response = self.client.get(url)
        # 认证用户应该可以访问环境变量列表
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的数据是否包含测试环境变量
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['key'], 'TEST_VAR')
        self.assertEqual(response.data['results'][0]['value'], 'test_value')
    
    def test_environment_variable_create(self):
        """测试创建环境变量"""
        # 登录管理员用户
        self.client.login(username='adminuser', password='adminpassword')
        url = reverse('environment_variable-list')
        data = {
            'environment': self.environment.id,
            'key': 'NEW_VAR',
            'value': 'new_value'
        }
        response = self.client.post(url, data, format='json')
        # 管理员用户应该可以创建环境变量
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        # 检查环境变量是否成功创建
        self.assertEqual(EnvironmentVariable.objects.count(), 2)
        self.assertEqual(EnvironmentVariable.objects.get(id=response.data['id']).key, 'NEW_VAR')
    
    def test_environment_action_check_connectivity(self):
        """测试环境连通性检查操作"""
        # 登录管理员用户
        self.client.login(username='adminuser', password='adminpassword')
        
        # 尝试使用不同的URL格式
        try:
            # 尝试直接使用URL路径
            url = f'/api/environments/{self.environment.id}/check_connectivity/'
            response = self.client.post(url)
            print(f"Using direct URL path: {url}")
        except Exception as e:
            print(f"Error with direct URL: {e}")
            # 如果直接URL失败，尝试另一种方法
            url = f'/environments/{self.environment.id}/check_connectivity/'
            response = self.client.post(url)
            print(f"Using alternative URL path: {url}")
        
        # 检查操作是否成功
        print(f"Response status: {response.status_code}")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回数据
        self.assertIn('status', response.data)
        self.assertIn('message', response.data)
    
    def test_environment_action_status(self):
        """测试环境状态查询操作"""
        # 登录普通用户
        self.client.login(username='testuser', password='testpassword')
        url = reverse('environment-status', args=[self.environment.id])
        response = self.client.get(url)
        # 检查操作是否成功
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 检查返回的状态是否正确
        self.assertEqual(response.data['status'], self.environment.status)

class EnvironmentIntegrationTestCase(TestCase):
    """环境管理的集成测试用例"""
    
    def setUp(self):
        """测试前的准备工作"""
        # 创建测试客户端
        self.client = APIClient()
        
        # 创建管理员用户
        self.admin_user = User.objects.create_superuser(username='adminuser', password='adminpassword')
        
        # 登录管理员用户
        self.client.login(username='adminuser', password='adminpassword')
    
    def test_environment_full_lifecycle(self):
        """测试环境的完整生命周期：创建 -> 更新 -> 查看 -> 删除"""
        # 1. 创建环境
        create_url = reverse('environment-list')
        create_data = {
            'name': '生命周期测试环境',
            'type': 'FPGA',
            'status': 'available',
            'conn_type': 'Telnet',
            'owner': 'adminuser',
            'admin': 'admin',
            'admin_password': 'password123',
            'cabinet_frame_slot': 'cabinet3-frame3-slot3',
            'port': '24'
        }
        create_response = self.client.post(create_url, create_data, format='json')
        self.assertEqual(create_response.status_code, status.HTTP_201_CREATED)
        environment_id = create_response.data['id']
        
        # 2. 更新环境
        update_url = reverse('environment-detail', args=[environment_id])
        update_data = {
            'name': '更新后的生命周期测试环境',
            'status': 'occupied',  # 使用有效的状态值
            'type': 'FPGA',
            'conn_type': 'Telnet',
            'owner': 'adminuser',
            'admin': 'admin',
            'admin_password': 'password123',
            'cabinet_frame_slot': 'cabinet3-frame3-slot3',
            'port': '24'
        }
        update_response = self.client.put(update_url, update_data, format='json')
        self.assertEqual(update_response.status_code, status.HTTP_200_OK)
        self.assertEqual(update_response.data['name'], '更新后的生命周期测试环境')
        
        # 3. 查看环境详情
        detail_url = reverse('environment-detail', args=[environment_id])
        detail_response = self.client.get(detail_url)
        self.assertEqual(detail_response.status_code, status.HTTP_200_OK)
        self.assertEqual(detail_response.data['name'], '更新后的生命周期测试环境')
        self.assertEqual(detail_response.data['status'], 'occupied')
        
        # 4. 删除环境
        delete_url = reverse('environment-detail', args=[environment_id])
        delete_response = self.client.delete(delete_url)
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        
        # 5. 验证环境是否已删除
        list_url = reverse('environment-list')
        list_response = self.client.get(list_url)
        self.assertEqual(list_response.status_code, status.HTTP_200_OK)
        # 检查是否还有该环境（应该没有了）
        found = False
        for env in list_response.data['results']:
            if env['id'] == environment_id:
                found = True
                break
        self.assertFalse(found)
    
    def test_environment_with_variables(self):
        """测试环境及其变量的联合操作"""
        # 1. 创建环境
        create_env_url = reverse('environment-list')
        create_env_data = {
            'name': '带变量测试环境',
            'type': 'FPGA',
            'status': 'available',
            'conn_type': 'Telnet',
            'owner': 'adminuser',
            'admin': 'admin',
            'admin_password': 'password123',
            'cabinet_frame_slot': 'cabinet4-frame4-slot4',
            'port': '25'
        }
        create_env_response = self.client.post(create_env_url, create_env_data, format='json')
        self.assertEqual(create_env_response.status_code, status.HTTP_201_CREATED)
        environment_id = create_env_response.data['id']
        
        # 2. 为环境创建多个变量
        variables = [
            {'key': 'VAR1', 'value': 'value1'},
            {'key': 'VAR2', 'value': 'value2'},
            {'key': 'VAR3', 'value': 'value3'}
        ]
        
        for var in variables:
            create_var_url = reverse('environment_variable-list')
            create_var_data = {
                'environment': environment_id,
                'key': var['key'],
                'value': var['value']
            }
            create_var_response = self.client.post(create_var_url, create_var_data, format='json')
            self.assertEqual(create_var_response.status_code, status.HTTP_201_CREATED)
        
        # 3. 检查环境变量是否全部创建成功
        var_list_url = reverse('environment_variable-list')
        var_list_response = self.client.get(var_list_url)
        self.assertEqual(var_list_response.status_code, status.HTTP_200_OK)
        
        # 收集所有创建的变量名
        created_vars = {var['key']: var['value'] for var in var_list_response.data['results']}
        
        # 验证所有变量都已创建
        for var in variables:
            self.assertIn(var['key'], created_vars)
            self.assertEqual(created_vars[var['key']], var['value'])
