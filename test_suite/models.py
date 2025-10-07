from django.db import models
from django.utils import timezone
import uuid


def generate_suite_id():
    return f'suite-{uuid.uuid4().hex[:8]}'


class TestSuite(models.Model):
    # 测试套唯一 ID（格式：suite-xxx）
    id = models.CharField(
        max_length=64,
        primary_key=True,
        default=generate_suite_id
    )
    
    # 测试套名称
    name = models.CharField(
        max_length=128,
        null=False,
        blank=False
    )
    
    # 测试套描述
    description = models.TextField(
        null=True,
        blank=True
    )
    
    # 可见范围（private/project）
    VISIBLE_SCOPE_CHOICES = [
        ('private', '私有'),
        ('project', '项目可见')
    ]
    visible_scope = models.CharField(
        max_length=32,
        null=False,
        blank=False,
        default='private',
        choices=VISIBLE_SCOPE_CHOICES
    )
    
    # 创建人（关联 tb_user.id）
    creator = models.CharField(
        max_length=64,
        null=False,
        blank=False
    )
    
    # 关联用例总数
    case_count = models.IntegerField(
        null=False,
        blank=False,
        default=0
    )
    
    # 创建时间
    create_time = models.DateTimeField(
        null=False,
        blank=False,
        default=timezone.now
    )
    
    # 更新时间
    update_time = models.DateTimeField(
        null=False,
        blank=False,
        auto_now=True
    )
    
    class Meta:
        # 按创建人查询索引
        indexes = [
            models.Index(fields=['creator'], name='idx_creator'),
            models.Index(fields=['visible_scope'], name='idx_scope'),
        ]
        
    def __str__(self):
        return self.name
