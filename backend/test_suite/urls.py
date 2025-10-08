from rest_framework import routers
from test_suite.views import TestSuiteViewSet

# 创建路由器实例
router = routers.DefaultRouter()

# 注册测试套视图集
router.register(
    r'test_suites',
    TestSuiteViewSet,
    basename='test_suite'
)