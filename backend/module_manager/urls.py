from rest_framework import routers
from .views import ModuleViewSet, FeatureViewSet

# 创建路由器实例
router = routers.DefaultRouter()

# 注册模块视图集
router.register(
    r'modules',
    ModuleViewSet,
    basename='module'
)

# 注册特性视图集
router.register(
    r'features', 
    FeatureViewSet, 
    basename='feature'
)

# 导出路由器，供主URL配置导入
__all__ = ['router']