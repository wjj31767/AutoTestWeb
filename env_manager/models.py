from django.db import models
from django.utils import timezone
from common.models import BaseModel

# Create your models here.
class Environment(BaseModel):
    """环境信息表 - Django ORM 模型实现"""
    id = models.CharField(max_length=64, primary_key=True, verbose_name='环境唯一ID', help_text='格式：env-xxx')
    name = models.CharField(max_length=128, verbose_name='环境名称', unique=True, help_text='如 FPGA-Test-01')
    type = models.CharField(
        max_length=32, 
        verbose_name='环境类型', 
        choices=[
            ('FPGA', 'FPGA'),
            ('Socket', 'Socket'),
            ('QEMU', 'QEMU'),
            ('Product', '产品版'),
        ],
        null=False
    )
    conn_type = models.CharField(
        max_length=32, 
        verbose_name='环境连接方式', 
        choices=[
            ('Telnet', 'Telnet'),
            ('Redirect', 'Redirect'),
        ],
        null=False
    )
    admin = models.CharField(max_length=32, verbose_name='mml账号名', null=True, blank=True, default='admin', help_text='不填默认为admin')
    admin_password = models.CharField(max_length=128, verbose_name='mml账号密码', null=False)
    cabinet_frame_slot = models.CharField(max_length=128, verbose_name='机柜槽位', null=False, help_text='Redirect连接方式下需要')
    port = models.CharField(max_length=128, verbose_name='端口', null=False, help_text='Telnet连接方式下需要')
    ftp_mask = models.CharField(max_length=128, verbose_name='加密后的FTP配置', null=True, blank=True, help_text='仅需FTP操作的环境有值')
    status = models.CharField(
        max_length=32, 
        verbose_name='环境状态', 
        choices=[
            ('pending', '待处理'),
            ('available', '可用'),
            ('unavailable', '不可用'),
            ('occupied', '占用中'),
        ],
        default='pending',
        null=False
    )
    owner = models.CharField(max_length=64, verbose_name='环境负责人', null=False, help_text='关联tb_user.id')
    last_check_time = models.DateTimeField(verbose_name='最后一次状态检查时间', null=True)
    create_time = models.DateTimeField(verbose_name='创建时间', auto_now_add=True, null=False)
    update_time = models.DateTimeField(verbose_name='更新时间', auto_now=True, null=False)

    class Meta:
        db_table = 'tb_environment'
        verbose_name = '环境信息'
        verbose_name_plural = '环境信息'
        ordering = ['-create_time']

    def __str__(self):
        return self.name

class EnvironmentVariable(models.Model):
    """环境变量表"""
    environment = models.ForeignKey(Environment, on_delete=models.CASCADE, related_name='variables', verbose_name='所属环境')
    key = models.CharField(max_length=100, verbose_name='变量名')
    value = models.TextField(verbose_name='变量值', blank=True, null=True)
    description = models.CharField(max_length=255, verbose_name='描述', blank=True, null=True)

    class Meta:
        db_table = 'tb_environment_variable'
        verbose_name = '环境变量'
        verbose_name_plural = '环境变量'
        unique_together = ('environment', 'key')

    def __str__(self):
        return f'{self.environment.name} - {self.key}'
