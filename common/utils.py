from django.http import HttpRequest
from django.conf import settings
import logging
from common.models import AuditLog

logger = logging.getLogger('autotestweb')

def audit_log(
    operation_type: str,
    operation_desc: str = None,
    operated_by: str = None,
    request: HttpRequest = None,
    module_name: str = None,
    object_id: str = None,
    old_data: dict = None,
    new_data: dict = None
):
    """记录审计日志
    
    Args:
        operation_type: 操作类型
        operation_desc: 操作描述
        operated_by: 操作人
        request: 请求对象
        module_name: 模块名称
        object_id: 对象ID
        old_data: 旧数据
        new_data: 新数据
    """
    try:
        ip_address = None
        user_agent = None
        if request:
            # 获取 IP 地址
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip_address = x_forwarded_for.split(',')[0].strip()
            else:
                ip_address = request.META.get('REMOTE_ADDR')
            # 获取用户代理
            user_agent = request.META.get('HTTP_USER_AGENT', '')[:255] if request.META.get('HTTP_USER_AGENT') else None
            # 如果没有传入操作人，从请求中获取
            if not operated_by and hasattr(request, 'user') and request.user.is_authenticated:
                operated_by = str(request.user)
        
        # 创建审计日志
        AuditLog.objects.create(
            operation_type=operation_type[:50] if operation_type else None,
            operation_desc=operation_desc,
            operated_by=operated_by[:50] if operated_by else None,
            ip_address=ip_address,
            user_agent=user_agent,
            module_name=module_name[:50] if module_name else None,
            object_id=object_id[:100] if object_id else None,
            old_data=old_data,
            new_data=new_data
        )
    except Exception as e:
        logger.error(f'记录审计日志失败: {str(e)}')

def get_current_user(request: HttpRequest) -> str:
    """获取当前用户
    
    Args:
        request: 请求对象
        
    Returns:
        str: 当前用户名或 'system'
    """
    if hasattr(request, 'user') and request.user.is_authenticated:
        return str(request.user)
    return 'system'

def get_system_config(key: str, default=None, active_only: bool = True):
    """获取系统配置
    
    Args:
        key: 配置键
        default: 默认值
        active_only: 是否只获取生效的配置
        
    Returns:
        配置值
    """
    from common.models import SystemConfig
    
    try:
        query = SystemConfig.objects.filter(key=key)
        if active_only:
            query = query.filter(is_active=True)
        config = query.first()
        if config:
            if config.type == 'json':
                import json
                try:
                    return json.loads(config.value)
                except:
                    return config.value
            elif config.type == 'number':
                try:
                    if '.' in config.value:
                        return float(config.value)
                    return int(config.value)
                except:
                    return config.value
            elif config.type == 'boolean':
                return config.value.lower() in ('true', 'yes', '1', 'y', 't')
            return config.value
        return default
    except Exception as e:
        logger.error(f'获取系统配置失败: {str(e)}')
        return default

def set_system_config(key: str, value, description: str = None, config_type: str = 'string', operated_by: str = None):
    """设置系统配置
    
    Args:
        key: 配置键
        value: 配置值
        description: 描述
        config_type: 类型
        operated_by: 操作人
        
    Returns:
        bool: 是否设置成功
    """
    from common.models import SystemConfig
    
    try:
        if config_type == 'json':
            import json
            value = json.dumps(value)
        else:
            value = str(value)
        
        config, created = SystemConfig.objects.update_or_create(
            key=key,
            defaults={
                'value': value,
                'description': description,
                'type': config_type,
                'is_active': True,
                'created_by': operated_by,
                'updated_by': operated_by
            }
        )
        return True
    except Exception as e:
        logger.error(f'设置系统配置失败: {str(e)}')
        return False

def get_file_path(filename: str, subdir: str = None) -> str:
    """获取文件存储路径
    
    Args:
        filename: 文件名
        subdir: 子目录
        
    Returns:
        str: 文件路径
    """
    import os
    
    base_dir = settings.MEDIA_ROOT
    if subdir:
        dir_path = os.path.join(base_dir, subdir)
        if not os.path.exists(dir_path):
            os.makedirs(dir_path)
        return os.path.join(dir_path, filename)
    return os.path.join(base_dir, filename)

def get_docker_client():
    """获取 Docker 客户端
    
    Returns:
        docker.DockerClient: Docker 客户端对象
    """
    import docker
    
    try:
        # 连接到本地 Docker 引擎
        client = docker.from_env()
        # 测试连接是否成功
        client.ping()
        return client
    except Exception as e:
        logger.error(f'连接 Docker 失败: {str(e)}')
        return None

def generate_unique_id(prefix: str = '', length: int = 8) -> str:
    """生成唯一 ID
    
    Args:
        prefix: 前缀
        length: 随机部分长度
        
    Returns:
        str: 唯一 ID
    """
    import random
    import string
    import time
    
    timestamp = str(int(time.time()))
    random_str = ''.join(random.choices(string.ascii_lowercase + string.digits, k=length))
    if prefix:
        return f'{prefix}_{timestamp}_{random_str}'
    return f'{timestamp}_{random_str}'