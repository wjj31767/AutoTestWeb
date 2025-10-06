from django.contrib import admin

"""
环境管理模块的 Django 管理后台配置
"""
from django.contrib import admin
from django.http import HttpRequest
from env_manager.models import Environment, EnvironmentVariable

@admin.register(Environment)
class EnvironmentAdmin(admin.ModelAdmin):
    """环境模型的管理配置"""
    # 列表显示的字段
    list_display = (
        'id', 'name', 'type', 'conn_type', 'status', 'admin', 
        'owner', 'create_time', 'update_time'
    )
    
    # 可搜索的字段
    search_fields = ('name', 'admin', 'owner', 'type')
    
    # 过滤字段
    list_filter = (
        'status', 'type', 'conn_type', ('create_time', admin.DateFieldListFilter),
        ('update_time', admin.DateFieldListFilter)
    )
    
    # 详细页面的字段布局
    fieldsets = (
        ('基本信息', {
            'fields': ('id', 'name', 'type', 'conn_type', 'status', 'owner', 'admin')
        }),
        ('连接信息', {
            'fields': ('admin_password', 'cabinet_frame_slot', 'port', 'ftp_mask'),
            'classes': ('collapse',)
        }),
        ('系统信息', {
            'fields': ('last_check_time', 'create_time', 'update_time'),
            'classes': ('collapse',),
            'description': '系统自动生成的信息，不可编辑。'
        })
    )
    
    # 只读字段
    readonly_fields = ('id', 'create_time', 'update_time', 'last_check_time')
    
    # 列表页的排序方式
    ordering = ('-create_time', 'name')
    
    # 每页显示的记录数
    list_per_page = 20
    
    # 操作选项
    actions = ['start_environment', 'stop_environment', 'delete_selected']
    
    def has_delete_permission(self, request: HttpRequest, obj=None) -> bool:
        """控制删除权限"""
        # 只有超级用户可以删除环境
        return request.user.is_superuser
    
    @admin.action(description='启动选中的环境')
    def start_environment(self, request, queryset):
        """启动选中的环境"""
        from common.utils import get_docker_client
        client = get_docker_client()
        if not client:
            self.message_user(request, '无法连接到 Docker 引擎', level='error')
            return
        
        success_count = 0
        error_count = 0
        for environment in queryset:
            try:
                if environment.container_id:
                    container = client.containers.get(environment.container_id)
                    container.start()
                    environment.status = 'running'
                    environment.save()
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                error_count += 1
                self.message_user(request, f'启动环境 {environment.name} 失败: {str(e)}', level='error')
        
        if success_count > 0:
            self.message_user(request, f'成功启动 {success_count} 个环境')
        if error_count > 0:
            self.message_user(request, f'有 {error_count} 个环境启动失败，请查看详情', level='error')
    
    @admin.action(description='停止选中的环境')
    def stop_environment(self, request, queryset):
        """停止选中的环境"""
        from common.utils import get_docker_client
        client = get_docker_client()
        if not client:
            self.message_user(request, '无法连接到 Docker 引擎', level='error')
            return
        
        success_count = 0
        error_count = 0
        for environment in queryset:
            try:
                if environment.container_id:
                    container = client.containers.get(environment.container_id)
                    container.stop()
                    environment.status = 'stopped'
                    environment.save()
                    success_count += 1
                else:
                    error_count += 1
            except Exception as e:
                error_count += 1
                self.message_user(request, f'停止环境 {environment.name} 失败: {str(e)}', level='error')
        
        if success_count > 0:
            self.message_user(request, f'成功停止 {success_count} 个环境')
        if error_count > 0:
            self.message_user(request, f'有 {error_count} 个环境停止失败，请查看详情', level='error')

@admin.register(EnvironmentVariable)
class EnvironmentVariableAdmin(admin.ModelAdmin):
    """环境变量模型的管理配置"""
    list_display = ('id', 'environment', 'key', 'value', 'description')
    search_fields = ('environment__name', 'key', 'value')
    list_filter = ('environment',)
    fieldsets = ((
        '环境变量信息', {
            'fields': ('environment', 'key', 'value', 'description')
        }),
    )
    ordering = ('environment', 'key')
    list_per_page = 20
