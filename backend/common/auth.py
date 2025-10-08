from rest_framework.authentication import TokenAuthentication
from django.contrib.auth.models import User
from django.conf import settings
from rest_framework.authentication import TokenAuthentication
import base64
import hashlib
import time


class SimpleTokenAuthentication(TokenAuthentication):
    """简单的Token认证类"""
    
    def authenticate(self, request):
        # 从请求头中获取Authorization
        auth = request.headers.get('Authorization', None)
        
        # 如果没有Authorization头，尝试从cookie中获取
        if not auth:
            auth = request.COOKIES.get('auth_token', None)
            if not auth:
                return None
        
        # 检查Authorization格式
        if not auth.startswith('Bearer '):
            return None
        
        token = auth.split(' ')[1]
        
        try:
            # 简单的token验证逻辑
            # 注意：在生产环境中，应该使用更安全的token验证方法
            # 这里只是为了测试目的
            if self.verify_token(token):
                # 获取用户名（假设token中包含用户名信息）
                username = self.get_username_from_token(token)
                user = User.objects.get(username=username)
                return (user, token)
        except (User.DoesNotExist, Exception):
            return None
        
        return None
    
    def verify_token(self, token):
        """验证token的有效性"""
        # 简单的验证逻辑：检查token格式和长度
        # 在生产环境中，应该使用更安全的验证方法，如签名验证
        return token and isinstance(token, str) and len(token) > 10
    
    def get_username_from_token(self, token):
        """从token中提取用户名"""
        # 简单的提取逻辑：假设token格式为'token_用户名_时间戳'
        # 在生产环境中，应该使用更安全的方法
        parts = token.split('_')
        if len(parts) >= 3:
            # 尝试从token中提取用户名
            # 如果无法提取，默认返回'test'
            try:
                # 假设token中包含用户名信息
                # 这里只是一个示例实现
                username_part = parts[1] if len(parts) > 1 else 'test'
                # 尝试解码base64编码的部分（如果有的话）
                try:
                    # 检查是否包含base64编码的部分
                    if '.' in username_part:
                        encoded_part = username_part.split('.')[0]
                        # 尝试解码base64
                        decoded = base64.b64decode(encoded_part).decode('utf-8')
                        return decoded
                except:
                    pass
                return username_part
            except:
                return 'test'
        return 'test'


class CustomTokenAuthentication(SimpleTokenAuthentication):
    """自定义Token认证类，与项目中引用的名称保持一致"""
    pass