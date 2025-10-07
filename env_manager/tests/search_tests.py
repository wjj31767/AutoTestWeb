from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from env_manager.models import Environment


class EnvironmentSearchFunctionalityTest(TestCase):
    """环境搜索功能的全面测试用例"""

    def setUp(self):
        """测试前的准备工作"""
        # 创建测试客户端
        self.client = APIClient()

        # 创建测试用户
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.admin_user = User.objects.create_superuser(username='adminuser', password='adminpassword')

        # 创建测试环境数据
        self.create_test_environments()

        # 登录普通用户以进行测试
        self.client.login(username='testuser', password='testpassword')

    def create_test_environments(self):
        """创建测试环境数据"""
        # 创建多个不同类型和状态的环境用于搜索测试
        self.environments = [
            # FPGA类型的环境
            Environment.objects.create(
                id='env-fpga-001',
                name='FPGA测试环境1',
                type='FPGA',
                status='available',
                conn_type='SSH',
                owner='testuser',
                admin='admin1',
                admin_password='password123',
                ip='192.168.1.101',
                cabinet_frame_slot='cabinet1-frame1-slot1',
                port='22'
            ),
            Environment.objects.create(
                id='env-fpga-002',
                name='FPGA生产环境',
                type='FPGA',
                status='occupied',
                conn_type='SSH',
                owner='adminuser',
                admin='root',
                admin_password='prod123',
                ip='192.168.1.201',
                cabinet_frame_slot='cabinet2-frame1-slot1',
                port='22'
            ),
            
            # 仿真类型的环境
            Environment.objects.create(
                id='env-sim-001',
                name='仿真测试环境',
                type='simulation',
                status='available',
                conn_type='Telnet',
                owner='testuser',
                admin='admin2',
                admin_password='password456',
                ip='192.168.1.102',
                cabinet_frame_slot='cabinet1-frame1-slot2',
                port='23'
            ),
            Environment.objects.create(
                id='env-sim-002',
                name='大规模仿真环境',
                type='simulation',
                status='maintenance',
                conn_type='Telnet',
                owner='adminuser',
                admin='admin3',
                admin_password='password789',
                ip='192.168.1.202',
                cabinet_frame_slot='cabinet2-frame1-slot2',
                port='23'
            ),
            
            # 测试板类型的环境
            Environment.objects.create(
                id='env-board-001',
                name='测试板A',
                type='testboard',
                status='available',
                conn_type='Serial',
                owner='testuser',
                admin='admin4',
                admin_password='board123',
                ip='192.168.1.103',
                cabinet_frame_slot='cabinet1-frame1-slot3',
                port='9600'
            ),
            Environment.objects.create(
                id='env-board-002',
                name='测试板B',
                type='testboard',
                status='occupied',
                conn_type='Serial',
                owner='adminuser',
                admin='admin5',
                admin_password='board456',
                ip='192.168.1.203',
                cabinet_frame_slot='cabinet2-frame1-slot3',
                port='9600'
            )
        ]

    def test_search_by_name_exact_match(self):
        """测试按环境名称精确匹配搜索"""
        url = reverse('environment-list') + '?search=FPGA测试环境1'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 1)
        # 验证返回的环境名称是否正确
        self.assertEqual(response.data['results'][0]['name'], 'FPGA测试环境1')

    def test_search_by_name_partial_match(self):
        """测试按环境名称模糊匹配搜索"""
        url = reverse('environment-list') + '?search=FPGA'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 2)
        # 验证返回的环境名称是否包含搜索字符串
        for env in response.data['results']:
            self.assertIn('FPGA', env['name'])

    def test_search_by_type_exact_match(self):
        """测试按环境类型精确匹配搜索"""
        url = reverse('environment-list') + '?type=FPGA'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 2)
        # 验证返回的环境类型是否正确
        for env in response.data['results']:
            self.assertEqual(env['type'], 'FPGA')

    def test_search_by_status_exact_match(self):
        """测试按环境状态精确匹配搜索"""
        url = reverse('environment-list') + '?status=available'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 3)
        # 验证返回的环境状态是否正确
        for env in response.data['results']:
            self.assertEqual(env['status'], 'available')

    def test_search_by_ip_exact_match(self):
        """测试按IP地址精确匹配搜索"""
        url = reverse('environment-list') + '?ip=192.168.1.101'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 1)
        # 验证返回的IP地址是否正确
        self.assertEqual(response.data['results'][0]['ip'], '192.168.1.101')

    def test_search_by_admin_exact_match(self):
        """测试按管理员名称精确匹配搜索"""
        url = reverse('environment-list') + '?search=admin1'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 1)
        # 验证返回的管理员名称是否正确
        self.assertEqual(response.data['results'][0]['admin'], 'admin1')

    def test_combined_search_type_and_status(self):
        """测试按类型和状态组合搜索"""
        url = reverse('environment-list') + '?type=FPGA&status=available'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 1)
        # 验证返回的环境是否满足所有条件
        for env in response.data['results']:
            self.assertEqual(env['type'], 'FPGA')
            self.assertEqual(env['status'], 'available')

    def test_combined_search_name_and_type(self):
        """测试按名称和类型组合搜索"""
        url = reverse('environment-list') + '?search=测试&type=FPGA'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 1)
        # 验证返回的环境是否满足所有条件
        for env in response.data['results']:
            self.assertIn('测试', env['name'])
            self.assertEqual(env['type'], 'FPGA')

    def test_combined_search_all_filters(self):
        """测试多条件组合搜索"""
        url = reverse('environment-list') + '?search=测试&type=FPGA&status=available'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 1)
        # 验证返回的环境是否满足所有条件
        for env in response.data['results']:
            self.assertIn('测试', env['name'])
            self.assertEqual(env['type'], 'FPGA')
            self.assertEqual(env['status'], 'available')

    def test_search_case_insensitive(self):
        """测试搜索是否大小写不敏感"""
        url = reverse('environment-list') + '?search=fpga'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 2)
        # 验证返回的环境类型是否正确
        for env in response.data['results']:
            self.assertEqual(env['type'], 'FPGA')

    def test_search_no_results(self):
        """测试搜索没有结果的情况"""
        url = reverse('environment-list') + '?search=不存在的环境名称'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回的环境数量
        self.assertEqual(len(response.data['results']), 0)
        self.assertEqual(response.data['count'], 0)

    def test_search_pagination(self):
        """测试搜索结果的分页功能"""
        # 每页显示1条记录
        url = reverse('environment-list') + '?search=测试&page=1&page_size=1'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证第一页返回1条记录
        self.assertEqual(len(response.data['results']), 1)
        # 验证总记录数
        self.assertGreaterEqual(response.data['count'], 1)

    def test_search_invalid_parameters(self):
        """测试无效参数的处理"""
        # 使用无效的type参数
        url = reverse('environment-list') + '?type=invalid_type'
        response = self.client.get(url)

        # 验证响应状态码
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回空结果
        self.assertEqual(len(response.data['results']), 0)

    def test_search_unauthenticated_access(self):
        """测试未认证用户的搜索访问权限"""
        # 登出当前用户
        self.client.logout()
        
        url = reverse('environment-list') + '?search=测试'
        response = self.client.get(url)

        # 验证未认证用户被拒绝访问
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_search_admin_user_access(self):
        """测试管理员用户的搜索访问权限"""
        # 登出当前用户并登录管理员用户
        self.client.logout()
        self.client.login(username='adminuser', password='adminpassword')
        
        url = reverse('environment-list') + '?search=测试'
        response = self.client.get(url)

        # 验证管理员用户可以访问
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # 验证返回正常的搜索结果
        self.assertIn('count', response.data)
        self.assertIn('results', response.data)