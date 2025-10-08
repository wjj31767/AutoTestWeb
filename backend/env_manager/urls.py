"""环境管理模块的 URL 配置
"""
from rest_framework import routers
from env_manager.views import EnvironmentViewSet, EnvironmentVariableViewSet

# 创建路由器实例
router = routers.DefaultRouter()

# 注册环境视图集
router.register(
    r'environments',
    EnvironmentViewSet,
    basename='environment'
)

# 注册环境变量视图集
router.register(
    r'environment_variables', 
    EnvironmentVariableViewSet, 
    basename='environment_variable'
)