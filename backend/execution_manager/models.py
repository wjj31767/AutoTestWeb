from django.db import models
from django.utils import timezone
import uuid
from test_suite.models import TestSuite
from env_manager.models import Environment


def generate_task_id():
    """生成任务唯一ID（格式：task-xxx）"""
    return f'task-{uuid.uuid4().hex[:8]}'


class TaskExecution(models.Model):
    """任务执行信息表 - 对应设计文档中的tb_execution_task"""
    # 任务唯一ID（格式：task-xxx）
    id = models.CharField(
        max_length=64,
        primary_key=True,
        default=generate_task_id,
        verbose_name='任务唯一ID'
    )
    
    # 关联测试套ID（外键：tb_test_suite.id）
    suite_id = models.ForeignKey(
        TestSuite,
        on_delete=models.CASCADE,
        to_field='id',
        db_column='suite_id',
        verbose_name='关联测试套ID'
    )
    
    # 关联环境ID（外键：tb_environment.id）
    env_id = models.ForeignKey(
        Environment,
        on_delete=models.CASCADE,
        to_field='id',
        db_column='env_id',
        verbose_name='关联环境ID'
    )
    
    # 包信息（存储JSON字符串，含包类型、版本、路径）
    package_info = models.TextField(
        null=False,
        blank=False,
        verbose_name='包信息'
    )
    
    # 任务状态（pending/running/paused/terminated/success/failed）
    STATUS_CHOICES = [
        ('pending', '等待执行'),
        ('running', '运行中'),
        ('paused', '已暂停'),
        ('terminated', '已终止'),
        ('success', '执行成功'),
        ('failed', '执行失败'),
    ]
    status = models.CharField(
        max_length=32,
        null=False,
        blank=False,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name='任务状态'
    )
    
    # 开始时间
    start_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='开始时间'
    )
    
    # 结束时间
    end_time = models.DateTimeField(
        null=True,
        blank=True,
        verbose_name='结束时间'
    )
    
    # 执行人（关联tb_user.id）
    executor = models.CharField(
        max_length=64,
        null=False,
        blank=False,
        verbose_name='执行人'
    )
    
    # 总用例数
    total_case = models.IntegerField(
        null=False,
        blank=False,
        default=0,
        verbose_name='总用例数'
    )
    
    # 成功用例数
    success_case = models.IntegerField(
        null=False,
        blank=False,
        default=0,
        verbose_name='成功用例数'
    )
    
    # 失败用例数
    failed_case = models.IntegerField(
        null=False,
        blank=False,
        default=0,
        verbose_name='失败用例数'
    )
    
    class Meta:
        db_table = 'tb_execution_task'
        verbose_name = '任务执行信息'
        verbose_name_plural = '任务执行信息'
        ordering = ['-start_time']
        # 创建索引
        indexes = [
            models.Index(fields=['suite_id'], name='execution_idx_suite'),
            models.Index(fields=['env_id'], name='execution_idx_env'),
            models.Index(fields=['status'], name='execution_idx_status'),
            models.Index(fields=['start_time', 'end_time'], name='execution_idx_time'),
        ]
    
    def __str__(self):
        return f'{self.id} - {self.status}'
