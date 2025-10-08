"""
Celery 主配置文件
"""
import os
from celery import Celery
from django.conf import settings

# 设置 Django 环境变量
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')

# 创建 Celery 应用实例
app = Celery('AutoTestWeb')

# 从 Django 设置中加载配置
# 配置项的名称需要以 'CELERY_' 为前缀
app.config_from_object('django.conf:settings', namespace='CELERY')

# 自动发现所有已注册应用中的任务
app.autodiscover_tasks(lambda: settings.INSTALLED_APPS)

@app.task(bind=True)
def debug_task(self):
    """用于调试的任务"""
    print(f'Request: {self.request!r}')

# 添加定时任务配置
from celery.schedules import crontab

app.conf.beat_schedule = {
    # 每天凌晨 2 点清理过期日志
    'cleanup_old_logs': {
        'task': 'common.tasks.cleanup_old_logs',
        'schedule': crontab(hour=2, minute=0),
        'args': (90,),  # 清理 90 天前的日志
    },
    
    # 每天凌晨 1 点备份数据库
    'backup_database': {
        'task': 'common.tasks.backup_database',
        'schedule': crontab(hour=1, minute=0),
    },
    
    # 每天清理临时文件
    'cleanup_temp_files': {
        'task': 'common.tasks.cleanup_temp_files',
        'schedule': crontab(hour=3, minute=0),
        'args': (24,),  # 清理 24 小时前的临时文件
    },
}

# 设置时区
app.conf.timezone = settings.TIME_ZONE