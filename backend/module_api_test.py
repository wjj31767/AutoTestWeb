import unittest
import requests
import json
import sys
import os

# 添加项目根目录到Python路径
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')
import django
django.setup()

from django.contrib.auth.models import User

BASE_URL = "http://localhost:8000/api"

class ModuleAPIAutomationTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # 创建测试用户（如果不存在）
        cls.username = "testuser"
        cls.password = "testpassword"
        
        try:
            # 尝试在Django ORM中创建用户
            user, created = User.objects.get_or_create(username=cls.username)
            if created:
                user.set_password(cls.password)
                user.save()
                print(f"创建测试用户: {cls.username}")
            else:
                print(f"测试用户已存在: {cls.username}")
        except Exception as e:
            print(f"无法通过Django ORM创建用户: {e}")
        
        # 尝试通过API登录获取令牌
        try:
            login_response = requests.post(
                f"{BASE_URL}/user/login/",
                data={"username": cls.username, "password": cls.password}
            )
            if login_response.status_code == 200:
                cls.token = login_response.json().get("token")
                cls.headers = {"Authorization": f"Token {cls.token}"}
                print(f"登录成功，获取到令牌")
                return
        except Exception as e:
            print(f"API登录失败: {e}")
        
        # 如果所有方法都失败，使用空headers
        cls.headers = {}
        print("无法获取身份验证，将使用匿名访问")
    
    def test_module_endpoint_not_404(self):
        """测试模块API端点是否存在（不是404）"""
        response = requests.get(f"{BASE_URL}/modules/")
        self.assertNotEqual(
            response.status_code, 
            404, 
            f"模块列表端点返回404，实际返回: {response.status_code}"
        )
        print(f"模块端点状态码: {response.status_code}")
        
        # 打印响应内容以便调试
        try:
            data = response.json()
            print(f"响应内容: {json.dumps(data, ensure_ascii=False, indent=2)}")
        except:
            print(f"响应内容: {response.text}")
    
    def test_modules_with_params(self):
        """测试带查询参数的模块列表请求"""
        # 构造查询参数
        params = {
            "module_name": "",
            "chip_model": "",
            "creator": "",
            "page": 1,
            "pageSize": 10
        }
        
        # 如果有令牌，使用身份验证
        if hasattr(self.__class__, 'token'):
            response = requests.get(
                f"{BASE_URL}/modules/", 
                headers=self.__class__.headers,
                params=params
            )
        else:
            # 否则匿名访问
            response = requests.get(f"{BASE_URL}/modules/", params=params)
        
        self.assertNotEqual(
            response.status_code, 
            404, 
            f"带参数的模块列表请求返回404，实际返回: {response.status_code}"
        )
        print(f"带参数的模块列表请求状态码: {response.status_code}")
    
    def test_features_endpoint(self):
        """测试特性API端点是否存在"""
        response = requests.get(f"{BASE_URL}/features/")
        self.assertNotEqual(
            response.status_code, 
            404, 
            f"特性列表端点返回404，实际返回: {response.status_code}"
        )
        print(f"特性端点状态码: {response.status_code}")

if __name__ == '__main__':
    unittest.main()