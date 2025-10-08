from django.db import models

from django.db import models
from common.models import BaseModel
from django.utils import timezone

class Feature(BaseModel):
    """特性信息表 - Django ORM 模型实现"""
    id = models.CharField(max_length=64, primary_key=True, verbose_name='特性唯一ID', help_text='格式：feature-xxx')
    feature_name = models.CharField(max_length=100, verbose_name='特性名称', null=False)
    module_id = models.CharField(max_length=64, verbose_name='所属模块ID', null=False, help_text='外键：tb_module.id')
    description = models.TextField(verbose_name='特性描述', null=True, blank=True)
    case_count = models.IntegerField(verbose_name='关联用例数', default=0, null=False)
    creator = models.CharField(max_length=64, verbose_name='创建人', null=False, help_text='关联tb_user.id')

    class Meta:
        db_table = 'tb_feature'
        verbose_name = '特性信息'
        verbose_name_plural = '特性信息'
        ordering = ['-create_time']
        indexes = [
            models.Index(fields=['module_id'], name='idx_module'),
            models.Index(fields=['creator'], name='feature_idx_creator'),
        ]

    def __str__(self):
        return f'{self.feature_name} (模块ID: {self.module_id})'

class TestCase(BaseModel):
    """测试用例表 - Django ORM 模型实现"""
    # 状态选项
    CASE_STATUS_CHOICES = (
        ('active', '活跃'),
        ('inactive', '非活跃'),
        ('draft', '草稿'),
    )
    
    id = models.CharField(max_length=64, primary_key=True, verbose_name='用例唯一ID', help_text='格式：case-xxx')
    case_id = models.CharField(max_length=50, verbose_name='用例ID（系统内部标识）', null=False, unique=True)
    case_name = models.CharField(max_length=100, verbose_name='用例名称', null=False)
    feature_id = models.CharField(max_length=64, verbose_name='所属特性ID', null=False, help_text='外键：tb_feature.id')
    description = models.TextField(verbose_name='用例描述', null=True, blank=True)
    pre_condition = models.TextField(verbose_name='前置条件', null=False)
    steps = models.TextField(verbose_name='执行步骤', null=False)
    expected_result = models.TextField(verbose_name='预期结果', null=False)
    script_path = models.CharField(max_length=200, verbose_name='用例脚本路径', null=False, help_text='Docker 数据卷内路径')
    status = models.CharField(max_length=20, verbose_name='用例状态', null=False, default='active', choices=CASE_STATUS_CHOICES)
    priority = models.IntegerField(verbose_name='优先级', null=False, default=50, help_text='1-100，数字越小优先级越高')
    test_type = models.CharField(max_length=20, verbose_name='测试类型', null=False, default='manual', choices=(
        ('manual', '手动测试'),
        ('automated', '自动化测试'),
        ('semi_automated', '半自动化测试')
    ))
    test_phase = models.CharField(max_length=20, verbose_name='测试阶段', null=False, default='system', choices=(
        ('unit', '单元测试'),
        ('integration', '集成测试'),
        ('system', '系统测试'),
        ('acceptance', '验收测试')
    ))
    creator = models.CharField(max_length=64, verbose_name='创建人', null=False, default='test', help_text='关联tb_user.id')
    sync_time = models.DateTimeField(verbose_name='最后同步时间', null=True)

    class Meta:
        db_table = 'tb_test_case'
        verbose_name = '测试用例'
        verbose_name_plural = '测试用例'
        ordering = ['-create_time']
        indexes = [
            models.Index(fields=['feature_id'], name='idx_feature'),
            models.Index(fields=['status'], name='idx_status'),
        ]

    def __str__(self):
        return f'{self.case_name} (特性ID: {self.feature_id})'

class FeatureTestCaseRelation(BaseModel):
    """特性-测试用例关联表 - 6.2.7表"""
    id = models.CharField(max_length=64, primary_key=True, verbose_name='关联ID', help_text='格式：relation-xxx')
    feature_id = models.CharField(max_length=64, verbose_name='特性ID', null=False, help_text='外键：tb_feature.id')
    test_case_id = models.CharField(max_length=64, verbose_name='测试用例ID', null=False, help_text='外键：tb_test_case.id')
    order_index = models.IntegerField(verbose_name='排序索引', default=0, null=False)
    is_primary = models.BooleanField(verbose_name='是否主用例', default=False, null=False)
    creator = models.CharField(max_length=64, verbose_name='创建人', null=False, help_text='关联tb_user.id')

    class Meta:
        db_table = 'tb_feature_testcase_relation'
        verbose_name = '特性-测试用例关联'
        verbose_name_plural = '特性-测试用例关联'
        unique_together = ('feature_id', 'test_case_id')
        indexes = [
            models.Index(fields=['feature_id'], name='idx_feature_relation'),
            models.Index(fields=['test_case_id'], name='idx_testcase_relation'),
            models.Index(fields=['is_primary'], name='idx_is_primary'),
        ]

    def __str__(self):
        return f'特性-{self.feature_id} 关联 测试用例-{self.test_case_id}'
