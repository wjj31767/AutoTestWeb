from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework import status, viewsets
from rest_framework import permissions as drf_permissions
from django.contrib.auth.models import User
from django.contrib.auth import logout, authenticate, login
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from common.permissions import IsAdminOrReadOnly, IsOwnerOrReadOnly, IsAdminOrOwner
from rest_framework.authtoken.models import Token


class UserViewSet(viewsets.ViewSet):
    """用户相关API视图集"""
    permission_classes = [drf_permissions.IsAuthenticated]

    @action(detail=False, methods=['post'], url_path='login', permission_classes=[drf_permissions.AllowAny])
    def user_login(self, request):
        """用户登录"""
        username = request.data.get('username')
        password = request.data.get('password')

        # 验证参数
        if not username or not password:
            return Response(
                {'error': '请提供用户名和密码'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 验证用户凭据
        user = authenticate(username=username, password=password)
        if user is None:
            return Response(
                {'error': '用户名或密码错误'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # 登录用户，设置会话
        login(request, user)
        
        # 为用户创建或获取token
        token, created = Token.objects.get_or_create(user=user)
        
        # 登录成功，返回用户信息和token
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'token': token.key,  # 返回token
            'message': '登录成功'
        }

        return Response(user_data, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='profile')
    def get_user_profile(self, request):
        """获取当前登录用户的信息"""
        user = request.user
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'is_superuser': user.is_superuser,
            'is_staff': user.is_staff,
            'date_joined': user.date_joined.strftime('%Y-%m-%d %H:%M:%S'),
            'last_login': user.last_login.strftime('%Y-%m-%d %H:%M:%S') if user.last_login else None
        }
        return Response(user_data)

    @action(detail=False, methods=['post'], url_path='change-password')
    def change_password(self, request):
        """修改当前登录用户的密码"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')

        # 验证参数
        if not old_password or not new_password or not confirm_password:
            return Response(
                {'error': '请提供所有密码字段'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 验证旧密码是否正确
        if not user.check_password(old_password):
            return Response(
                {'error': '当前密码不正确'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 验证两次新密码是否一致
        if new_password != confirm_password:
            return Response(
                {'error': '两次输入的新密码不一致'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 验证新密码是否符合密码规则
        try:
            validate_password(new_password, user)
        except ValidationError as e:
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # 更新密码
        user.set_password(new_password)
        user.save()

        return Response(
            {'message': '密码修改成功'}, 
            status=status.HTTP_200_OK
        )

    @action(detail=False, methods=['post'], url_path='logout')
    def user_logout(self, request):
        """退出登录"""
        logout(request)
        return Response(
            {'message': '退出登录成功'}, 
            status=status.HTTP_200_OK
        )
