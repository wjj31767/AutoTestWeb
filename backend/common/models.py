from django.db import models
from django.utils import timezone

class BaseModel(models.Model):
    """基础模型类，包含通用字段"""
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')
    is_deleted = models.BooleanField(default=False, verbose_name='是否删除')

    class Meta:
        abstract = True

    def soft_delete(self):
        """软删除"""
        self.is_deleted = True
        self.save()

class AuditLog(models.Model):
    """审计日志表"""
    operation_type = models.CharField(max_length=50, verbose_name='操作类型')
    operation_desc = models.TextField(verbose_name='操作描述', blank=True, null=True)
    operated_by = models.CharField(max_length=50, verbose_name='操作人', blank=True, null=True)
    operated_at = models.DateTimeField(auto_now_add=True, verbose_name='操作时间')
    ip_address = models.GenericIPAddressField(verbose_name='IP地址', blank=True, null=True)
    user_agent = models.TextField(verbose_name='用户代理', blank=True, null=True)
    module_name = models.CharField(max_length=50, verbose_name='模块名称', blank=True, null=True)
    object_id = models.CharField(max_length=100, verbose_name='对象ID', blank=True, null=True)
    old_data = models.JSONField(verbose_name='旧数据', blank=True, null=True)
    new_data = models.JSONField(verbose_name='新数据', blank=True, null=True)

    class Meta:
        db_table = 'tb_audit_log'
        verbose_name = '审计日志'
        verbose_name_plural = '审计日志'
        ordering = ['-operated_at']

    def __str__(self):
        return f'{self.operated_by} - {self.operation_type} - {self.operated_at}'

class SystemConfig(models.Model):
    """系统配置表"""
    key = models.CharField(max_length=100, verbose_name='配置键', unique=True)
    value = models.TextField(verbose_name='配置值')
    description = models.CharField(max_length=255, verbose_name='描述', blank=True, null=True)
    type = models.CharField(
        max_length=20, 
        verbose_name='类型', 
        choices=[
            ('string', '字符串'),
            ('number', '数字'),
            ('boolean', '布尔值'),
            ('json', 'JSON'),
        ],
        default='string'
    )
    is_active = models.BooleanField(default=True, verbose_name='是否生效')
    created_by = models.CharField(max_length=50, verbose_name='创建人', blank=True, null=True)
    updated_by = models.CharField(max_length=50, verbose_name='更新人', blank=True, null=True)
    create_time = models.DateTimeField(auto_now_add=True, verbose_name='创建时间')
    update_time = models.DateTimeField(auto_now=True, verbose_name='更新时间')

    class Meta:
        db_table = 'tb_system_config'
        verbose_name = '系统配置'
        verbose_name_plural = '系统配置'

    def __str__(self):
        return self.key
