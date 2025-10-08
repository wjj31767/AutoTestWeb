from django.db import models

from django.db import models
from common.models import BaseModel
from django.utils import timezone

class Module(BaseModel):
    """模块信息表 - Django ORM 模型实现"""
    id = models.CharField(max_length=64, primary_key=True, verbose_name='模块唯一ID', help_text='格式：module-xxx')
    module_name = models.CharField(max_length=100, verbose_name='模块名称', unique=True, help_text='模块名称')
    chip_model = models.CharField(max_length=64, verbose_name='所属芯片型号', null=False, help_text='如 Chip-A-1.0')
    description = models.TextField(verbose_name='模块描述', null=True, blank=True)
    creator = models.CharField(max_length=64, verbose_name='创建人', null=False, help_text='关联tb_user.id')
    feature_count = models.IntegerField(verbose_name='关联特性总数', default=0, null=False)
    create_time = models.DateTimeField(verbose_name='创建时间', auto_now_add=True, null=False)
    update_time = models.DateTimeField(verbose_name='更新时间', auto_now=True, null=False)

    class Meta:
        db_table = 'tb_module'
        verbose_name = '模块信息'
        verbose_name_plural = '模块信息'
        ordering = ['-create_time']
        indexes = [
            models.Index(fields=['creator'], name='module_idx_creator'),
            models.Index(fields=['chip_model'], name='idx_chip'),
        ]

    def __str__(self):
        return self.module_name
