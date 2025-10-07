from rest_framework import routers
from .views import UserViewSet

# 创建路由器实例
router = routers.DefaultRouter()

# 注册用户视图集
router.register(r'user', UserViewSet, basename='user')

# 导出路由器，供主URL配置导入
__all__ = ['router']