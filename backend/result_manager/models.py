from django.db import models
import uuid
from execution_manager.models import TaskExecution
from feature_testcase.models import TestCase


def generate_case_result_id():
    """生成用例结果唯一ID（格式：case-result-xxx）"""
    return f'case-result-{uuid.uuid4().hex[:8]}'


class CaseResult(models.Model):
    """用例结果表 - 对应设计文档中的tb_case_result"""
    # 结果唯一ID（格式：case-result-xxx）
    id = models.CharField(
        max_length=64,
        primary_key=True,
        default=generate_case_result_id,
        verbose_name='结果唯一ID'
    )
    
    # 关联任务ID（外键：tb_execution_task.id）
    task_id = models.ForeignKey(
        TaskExecution,
        on_delete=models.CASCADE,
        to_field='id',
        db_column='task_id',
        verbose_name='关联任务ID'
    )
    
    # 用例ID（关联tb_test_case.id）
    case_id = models.ForeignKey(
        TestCase,
        on_delete=models.CASCADE,
        to_field='id',
        db_column='case_id',
        verbose_name='用例ID'
    )
    
    # 用例状态（success/failed/skipped）
    STATUS_CHOICES = [
        ('success', '成功'),
        ('failed', '失败'),
        ('skipped', '跳过'),
    ]
    status = models.CharField(
        max_length=32,
        null=False,
        blank=False,
        choices=STATUS_CHOICES,
        verbose_name='用例状态'
    )
    
    # 标记状态（none/to_analyze/located/no_need）
    MARK_STATUS_CHOICES = [
        ('none', '无标记'),
        ('to_analyze', '待分析'),
        ('located', '已定位'),
        ('no_need', '无需处理'),
    ]
    mark_status = models.CharField(
        max_length=32,
        default='none',
        choices=MARK_STATUS_CHOICES,
        verbose_name='标记状态'
    )
    
    # 分析备注
    analysis_note = models.TextField(
        null=True,
        blank=True,
        verbose_name='分析备注'
    )
    
    # 执行时间
    execute_time = models.DateTimeField(
        null=False,
        blank=False,
        verbose_name='执行时间'
    )
    
    # 日志文件路径（Docker数据卷内路径）
    log_path = models.CharField(
        max_length=256,
        null=False,
        blank=False,
        verbose_name='日志文件路径'
    )
    
    class Meta:
        db_table = 'tb_case_result'
        verbose_name = '用例结果'
        verbose_name_plural = '用例结果'
        ordering = ['-execute_time']
        # 创建索引
        indexes = [
            models.Index(fields=['task_id'], name='result_idx_task'),
            models.Index(fields=['case_id'], name='result_idx_case'),
            models.Index(fields=['mark_status'], name='result_idx_mark'),
        ]
    
    def __str__(self):
        return f'{self.id} - 任务:{self.task_id.id} 用例:{self.case_id.id} 状态:{self.status}'
