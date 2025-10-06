from celery import shared_task
from django.db import transaction
import logging
from common.utils import get_docker_client, logger

logger = logging.getLogger('autotestweb')

@shared_task(name='create_environment_task')
def create_environment_task(environment_id):
    """异步创建环境任务"""
    from env_manager.models import Environment
    
    try:
        environment = Environment.objects.get(id=environment_id)
        logger.info(f'开始创建环境: {environment.name}')
        
        # 调用 Docker 客户端创建容器
        client = get_docker_client()
        if not client:
            environment.status = 'failed'
            environment.save()
            logger.error(f'创建环境失败: 无法连接 Docker 引擎')
            return
        
        # 设置容器配置
        container_config = {
            'image': environment.docker_image or 'ubuntu:latest',
            'name': f'autotest_{environment.name.lower().replace(" ", "_")}_{environment_id}',
            'detach': True,
            'ports': {},
            'environment': {},
            'volumes': {},
        }
        
        # 加载环境的配置信息
        if environment.configuration:
            if 'ports' in environment.configuration:
                # 配置端口映射
                for host_port, container_port in environment.configuration['ports'].items():
                    container_config['ports'][f'{container_port}/tcp'] = host_port
            
            if 'environment' in environment.configuration:
                # 配置环境变量
                container_config['environment'].update(environment.configuration['environment'])
            
            if 'volumes' in environment.configuration:
                # 配置数据卷
                for host_path, container_path in environment.configuration['volumes'].items():
                    container_config['volumes'][host_path] = {'bind': container_path, 'mode': 'rw'}
        
        # 创建容器
        container = client.containers.run(**container_config)
        
        # 更新环境信息
        with transaction.atomic():
            environment.container_id = container.id
            environment.status = 'running'
            # 获取容器的 IP 地址（Docker 内部网络）
            container_info = container.attrs
            if 'NetworkSettings' in container_info and 'IPAddress' in container_info['NetworkSettings']:
                environment.ip_address = container_info['NetworkSettings']['IPAddress']
            environment.save()
        
        logger.info(f'环境创建成功: {environment.name}, 容器ID: {container.id}')
        
    except Environment.DoesNotExist:
        logger.error(f'环境不存在: {environment_id}')
    except Exception as e:
        # 更新环境状态为失败
        try:
            environment = Environment.objects.get(id=environment_id)
            environment.status = 'failed'
            environment.save()
        except:
            pass
        logger.error(f'创建环境失败: {str(e)}')

@shared_task(name='start_environment_task')
def start_environment_task(environment_id):
    """异步启动环境任务"""
    from env_manager.models import Environment
    
    try:
        environment = Environment.objects.get(id=environment_id)
        logger.info(f'开始启动环境: {environment.name}')
        
        # 调用 Docker 客户端启动容器
        client = get_docker_client()
        if not client:
            logger.error(f'启动环境失败: 无法连接 Docker 引擎')
            return
        
        # 启动容器
        container = client.containers.get(environment.container_id)
        container.start()
        
        # 更新环境状态
        with transaction.atomic():
            environment.status = 'running'
            # 获取容器的 IP 地址
            container.reload()
            container_info = container.attrs
            if 'NetworkSettings' in container_info and 'IPAddress' in container_info['NetworkSettings']:
                environment.ip_address = container_info['NetworkSettings']['IPAddress']
            environment.save()
        
        logger.info(f'环境启动成功: {environment.name}')
        
    except Environment.DoesNotExist:
        logger.error(f'环境不存在: {environment_id}')
    except Exception as e:
        logger.error(f'启动环境失败: {str(e)}')

@shared_task(name='stop_environment_task')
def stop_environment_task(environment_id):
    """异步停止环境任务"""
    from env_manager.models import Environment
    
    try:
        environment = Environment.objects.get(id=environment_id)
        logger.info(f'开始停止环境: {environment.name}')
        
        # 调用 Docker 客户端停止容器
        client = get_docker_client()
        if not client:
            logger.error(f'停止环境失败: 无法连接 Docker 引擎')
            return
        
        # 停止容器
        container = client.containers.get(environment.container_id)
        container.stop()
        
        # 更新环境状态
        with transaction.atomic():
            environment.status = 'stopped'
            environment.save()
        
        logger.info(f'环境停止成功: {environment.name}')
        
    except Environment.DoesNotExist:
        logger.error(f'环境不存在: {environment_id}')
    except Exception as e:
        logger.error(f'停止环境失败: {str(e)}')

@shared_task(name='cleanup_old_logs')
def cleanup_old_logs(days: int = 90):
    """清理过期日志任务"""
    import os
    import time
    from datetime import datetime, timedelta
    
    try:
        # 获取日志目录
        from django.conf import settings
        log_dir = os.path.join(settings.BASE_DIR, 'logs')
        if not os.path.exists(log_dir):
            logger.warning(f'日志目录不存在: {log_dir}')
            return
        
        # 计算过期时间
        expire_time = datetime.now() - timedelta(days=days)
        
        # 遍历日志文件
        for filename in os.listdir(log_dir):
            file_path = os.path.join(log_dir, filename)
            if os.path.isfile(file_path):
                # 获取文件的创建时间
                file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                # 如果文件过期，删除它
                if file_time < expire_time:
                    os.remove(file_path)
                    logger.info(f'删除过期日志文件: {file_path}')
        
        logger.info(f'过期日志清理完成，清理了 {days} 天前的日志')
        
    except Exception as e:
        logger.error(f'清理过期日志失败: {str(e)}')

@shared_task(name='backup_database')
def backup_database():
    """数据库备份任务"""
    import os
    import subprocess
    import time
    from datetime import datetime
    
    try:
        # 获取数据库配置
        from django.conf import settings
        db_config = settings.DATABASES['default']
        
        # 创建备份目录
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
        if not os.path.exists(backup_dir):
            os.makedirs(backup_dir)
        
        # 生成备份文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        backup_file = os.path.join(backup_dir, f'db_backup_{timestamp}.sql')
        
        # 根据数据库类型执行备份命令
        if db_config['ENGINE'] == 'django.db.backends.sqlite3':
            # SQLite 备份
            import shutil
            shutil.copy2(db_config['NAME'], backup_file)
        elif db_config['ENGINE'] == 'django.db.backends.mysql':
            # MySQL 备份
            cmd = [
                'mysqldump',
                '-u', db_config['USER'],
                f'-p{db_config["PASSWORD"]}',
                '-h', db_config['HOST'],
                '-P', str(db_config['PORT']),
                db_config['NAME'],
                '>', backup_file
            ]
            subprocess.run(' '.join(cmd), shell=True, check=True)
        
        logger.info(f'数据库备份完成: {backup_file}')
        
    except Exception as e:
        logger.error(f'数据库备份失败: {str(e)}')

@shared_task(name='cleanup_temp_files')
def cleanup_temp_files(hours: int = 24):
    """清理临时文件任务"""
    import os
    import time
    from datetime import datetime, timedelta
    
    try:
        # 获取临时目录
        from django.conf import settings
        temp_dir = os.path.join(settings.MEDIA_ROOT, 'temp')
        if not os.path.exists(temp_dir):
            logger.warning(f'临时目录不存在: {temp_dir}')
            return
        
        # 计算过期时间
        expire_time = datetime.now() - timedelta(hours=hours)
        
        # 遍历临时文件
        for root, dirs, files in os.walk(temp_dir):
            for filename in files:
                file_path = os.path.join(root, filename)
                # 获取文件的创建时间
                file_time = datetime.fromtimestamp(os.path.getctime(file_path))
                # 如果文件过期，删除它
                if file_time < expire_time:
                    os.remove(file_path)
                    logger.info(f'删除过期临时文件: {file_path}')
        
        logger.info(f'临时文件清理完成，清理了 {hours} 小时前的文件')
        
    except Exception as e:
        logger.error(f'清理临时文件失败: {str(e)}')