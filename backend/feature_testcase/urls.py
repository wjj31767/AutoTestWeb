from rest_framework import routers
from .views import FeatureViewSet, TestCaseViewSet, FeatureTestCaseRelationViewSet

# 创建路由器实例
router = routers.DefaultRouter()

# 注册特性视图集
router.register(
    r'features', 
    FeatureViewSet, 
    basename='feature'
)

# 注册测试用例视图集
router.register(
    r'testcases',
    TestCaseViewSet,
    basename='testcase'
)

# 注册特性测试用例关系视图集
router.register(
    r'feature-testcase-relations',
    FeatureTestCaseRelationViewSet,
    basename='feature-testcase-relation'
)

# 导出路由器，供主URL配置导入
__all__ = ['router']