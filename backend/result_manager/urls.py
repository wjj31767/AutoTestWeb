from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CaseResultViewSet

# 创建路由器并注册视图集
router = DefaultRouter()
router.register(r'results', CaseResultViewSet, basename='caseresult')

# 定义URL模式
urlpatterns = [
    # 包含路由器生成的所有URL模式
    path('', include(router.urls)),
    # 自定义的URL模式已经通过视图集的@action装饰器定义
]

__all__ = ['urlpatterns']