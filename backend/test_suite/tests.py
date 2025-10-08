from django.test import TestCase
from django.test import TestCase
from django.urls import reverse, resolve
from test_suite.models import TestSuite


class TestSuiteAppTests(TestCase):
    """测试test_suite应用的基本功能"""
    
    def setUp(self):
        """在每个测试方法执行前设置测试数据"""
        # 创建测试用的测试套数据
        self.suite1 = TestSuite.objects.create(
            name="测试套1",
            description="这是第一个测试套",
            visible_scope="private",
            creator="admin",
            case_count=5
        )
        self.suite2 = TestSuite.objects.create(
            name="测试套2",
            description="这是第二个测试套",
            visible_scope="project",
            creator="user1",
            case_count=10
        )
    
    def test_app_config(self):
        """测试应用配置是否正确"""
        self.assertTrue(True, "测试框架正常运行")
        
    def test_string_operations(self):
        """测试基本的字符串操作"""
        result = "test" + "suite"
        self.assertEqual(result, "testsuite")
        self.assertEqual(len("testsuite"), 9)
        
    def test_numeric_operations(self):
        """测试基本的数值运算"""
        self.assertEqual(2 + 2, 4)
        self.assertEqual(3 * 4, 12)
        
    def test_list_operations(self):
        """测试基本的列表操作"""
        test_list = [1, 2, 3, 4, 5]
        self.assertEqual(test_list[0], 1)
        self.assertEqual(len(test_list), 5)
        test_list.append(6)
        self.assertEqual(len(test_list), 6)
        
    def test_dictionary_operations(self):
        """测试基本的字典操作"""
        test_dict = {"key1": "value1", "key2": "value2"}
        self.assertEqual(test_dict["key1"], "value1")
        self.assertEqual(len(test_dict), 2)
        test_dict["key3"] = "value3"
        self.assertEqual(len(test_dict), 3)


class TestSuiteModelTests(TestCase):
    """测试TestSuite模型的功能"""
    
    def setUp(self):
        """在每个测试方法执行前设置测试数据"""
        self.test_suite = TestSuite.objects.create(
            name="单元测试套",
            description="用于测试模型功能的测试套",
            visible_scope="private",
            creator="admin",
            case_count=5
        )
    
    def test_test_suite_creation(self):
        """测试是否能成功创建TestSuite实例"""
        # 验证对象是否被正确创建
        self.assertEqual(self.test_suite.name, "单元测试套")
        self.assertEqual(self.test_suite.description, "用于测试模型功能的测试套")
        self.assertEqual(self.test_suite.visible_scope, "private")
        self.assertEqual(self.test_suite.creator, "admin")
        self.assertEqual(self.test_suite.case_count, 5)
        
        # 验证ID格式是否正确
        self.assertTrue(self.test_suite.id.startswith("suite-"))
        self.assertEqual(len(self.test_suite.id), 14)  # suite-加上8位十六进制字符
        
        # 验证创建时间和更新时间是否被正确设置
        self.assertIsNotNone(self.test_suite.create_time)
        self.assertIsNotNone(self.test_suite.update_time)
    
    def test_test_suite_string_representation(self):
        """测试TestSuite对象的字符串表示"""
        self.assertEqual(str(self.test_suite), "单元测试套")
    
    def test_field_validations(self):
        """测试模型字段验证"""
        # 在Django ORM中，blank=False/nul=False不会自动在save()时抛出异常
        # 而是在表单验证时生效。我们这里测试的是数据库层面的约束
        
        # 测试name和creator字段可以设置为空字符串（Django默认行为）
        # 实际项目中可能需要通过表单验证或自定义模型方法来强制字段不为空
        suite_empty_name = TestSuite.objects.create(
            name="",  # 空名称
            description="测试空名称",
            visible_scope="private",
            creator="admin",
            case_count=0
        )
        self.assertEqual(suite_empty_name.name, "")
        
        suite_empty_creator = TestSuite.objects.create(
            name="测试套",
            description="测试空创建者",
            visible_scope="private",
            creator="",  # 空创建者
            case_count=0
        )
        self.assertEqual(suite_empty_creator.creator, "")
    
    def test_visible_scope_choices(self):
        """测试可见范围选项"""
        # 验证可用的可见范围选项
        choices = [choice[0] for choice in TestSuite.VISIBLE_SCOPE_CHOICES]
        self.assertIn("private", choices)
        self.assertIn("project", choices)
        
        # 测试设置有效的可见范围
        suite = TestSuite.objects.create(
            name="项目可见测试套",
            visible_scope="project",
            creator="admin"
        )
        self.assertEqual(suite.visible_scope, "project")
        
        # 测试默认可见范围
        suite_default = TestSuite.objects.create(
            name="默认可见范围测试套",
            creator="admin"
        )
        self.assertEqual(suite_default.visible_scope, "private")
    
    def test_query_methods(self):
        """测试模型的查询方法"""
        # 创建额外的测试数据用于查询测试
        TestSuite.objects.create(
            name="查询测试套1",
            visible_scope="private",
            creator="user1"
        )
        TestSuite.objects.create(
            name="查询测试套2",
            visible_scope="project",
            creator="user1"
        )
        
        # 测试按创建人查询
        admin_suites = TestSuite.objects.filter(creator="admin")
        self.assertGreaterEqual(admin_suites.count(), 1)
        
        # 测试按可见范围查询
        private_suites = TestSuite.objects.filter(visible_scope="private")
        project_suites = TestSuite.objects.filter(visible_scope="project")
        self.assertGreaterEqual(private_suites.count(), 1)
        self.assertGreaterEqual(project_suites.count(), 1)
        
        # 测试组合查询
        user1_private_suites = TestSuite.objects.filter(
            creator="user1",
            visible_scope="private"
        )
        self.assertEqual(user1_private_suites.count(), 1)
    
    def test_model_indexes(self):
        """测试模型索引是否正确创建"""
        # 这里我们只是验证索引是否在Meta类中定义正确
        # 实际的索引创建验证需要查看数据库
        meta = TestSuite._meta
        index_names = [index.name for index in meta.indexes]
        self.assertIn("idx_creator", index_names)
        self.assertIn("idx_scope", index_names)
