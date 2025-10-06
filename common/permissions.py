from rest_framework import permissions

class IsAdminOrReadOnly(permissions.BasePermission):
    """管理员可写，认证用户只读"""
    
    def has_permission(self, request, view):
        # 对认证用户允许 GET, HEAD 或 OPTIONS 请求
        if request.method in permissions.SAFE_METHODS:
            return request.user and request.user.is_authenticated
        # 只对管理员允许其他请求方法
        return request.user and request.user.is_staff

class IsOwnerOrReadOnly(permissions.BasePermission):
    """对象所有者可写，其他用户只读"""
    
    def has_object_permission(self, request, view, obj):
        # 对所有人允许 GET, HEAD 或 OPTIONS 请求
        if request.method in permissions.SAFE_METHODS:
            return True
        # 只对对象所有者允许其他请求方法
        # 这里假设模型有 owner 字段或者 created_by 字段
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'created_by'):
            # 如果 created_by 是字符串类型，需要转换比较
            if isinstance(obj.created_by, str):
                return str(request.user) == obj.created_by
            return obj.created_by == request.user
        return False

class IsAdminOrOwner(permissions.BasePermission):
    """管理员或对象所有者可写，其他用户只读"""
    
    def has_permission(self, request, view):
        # 对所有人允许 GET, HEAD 或 OPTIONS 请求
        if request.method in permissions.SAFE_METHODS:
            return True
        # 管理员始终可以写
        if request.user and request.user.is_staff:
            return True
        # 非管理员需要通过对象级别的权限检查
        return True
    
    def has_object_permission(self, request, view, obj):
        # 对所有人允许 GET, HEAD 或 OPTIONS 请求
        if request.method in permissions.SAFE_METHODS:
            return True
        # 管理员始终可以写
        if request.user and request.user.is_staff:
            return True
        # 检查是否是对象所有者
        if hasattr(obj, 'owner'):
            return obj.owner == request.user
        elif hasattr(obj, 'created_by'):
            # 如果 created_by 是字符串类型，需要转换比较
            if isinstance(obj.created_by, str):
                return str(request.user) == obj.created_by
            return obj.created_by == request.user
        return False

class CustomPermission(permissions.BasePermission):
    """自定义权限基类，可通过配置文件动态设置权限"""
    permission_name = None
    
    def has_permission(self, request, view):
        from common.utils import get_system_config
        
        if not self.permission_name:
            return True
        
        # 从系统配置中获取权限设置
        permission_config = get_system_config(f'permission_{self.permission_name}', {})
        
        # 检查是否允许当前用户访问
        if request.user and request.user.is_superuser:
            return True
        
        # 检查用户组权限
        if hasattr(request.user, 'groups'):
            user_groups = [group.name for group in request.user.groups.all()]
            allowed_groups = permission_config.get('allowed_groups', [])
            if any(group in allowed_groups for group in user_groups):
                return True
        
        # 检查用户权限
        if hasattr(request.user, 'has_perm'):
            perm_code = permission_config.get('perm_code', '')
            if perm_code and request.user.has_perm(perm_code):
                return True
        
        # 检查是否允许匿名访问
        allow_anonymous = permission_config.get('allow_anonymous', False)
        if allow_anonymous and not request.user.is_authenticated:
            return True
        
        return False