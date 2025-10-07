from rest_framework import permissions


class IsAuthenticatedForEnvCreate(permissions.BasePermission):
    """已认证用户可以创建环境，管理员可以进行所有写操作"""
    
    def has_permission(self, request, view):
        # 允许所有已认证用户创建环境（POST请求）
        if request.method in ['POST', "PUT", "DELETE"]:
            return request.user and request.user.is_authenticated
        
        # 对认证用户允许 GET, HEAD 或 OPTIONS 请求
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # 只对管理员允许其他写操作（PUT, DELETE等）
        return request.user and request.user.is_staff


class IsAdminOrEnvOwner(permissions.BasePermission):
    """管理员或环境所有者可以进行所有操作"""
    
    def has_permission(self, request, view):
        # 对认证用户允许 GET, HEAD 或 OPTIONS 请求
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        
        # 允许所有已认证用户创建环境（POST请求）
        if request.method == 'POST':
            return request.user and request.user.is_authenticated
        
        # 其他写操作需要通过对象级别的权限检查
        return request.user and request.user.is_authenticated
    
    def has_object_permission(self, request, view, obj):
        # 对认证用户允许 GET, HEAD 或 OPTIONS 请求
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # 管理员始终可以写
        if request.user.is_staff:
            return True
        
        # 环境所有者可以写
        if hasattr(obj, 'owner'):
            # 注意：虽然模型定义中owner字段注明关联tb_user.id，但实际存储的是用户名
            return obj.owner == request.user.username
        elif hasattr(obj, 'created_by'):
            # 如果 created_by 是字符串类型，需要转换比较
            if isinstance(obj.created_by, str):
                return str(request.user) == obj.created_by
            return obj.created_by == request.user
        
        return False