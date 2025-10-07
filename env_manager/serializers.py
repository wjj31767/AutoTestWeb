from rest_framework import serializers
from .models import Environment, EnvironmentVariable

class EnvironmentVariableSerializer(serializers.ModelSerializer):
    """环境变量序列化器"""
    class Meta:
        model = EnvironmentVariable
        fields = ['id', 'environment', 'key', 'value', 'description']
        read_only_fields = ['id']

class EnvironmentSerializer(serializers.ModelSerializer):
    """环境序列化器"""
    variables = EnvironmentVariableSerializer(many=True, read_only=True)
    status_display = serializers.CharField(source='get_status_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    conn_type_display = serializers.CharField(source='get_conn_type_display', read_only=True)

    class Meta:
        model = Environment
        fields = [
            'id', 'name', 'type', 'type_display', 'conn_type', 'conn_type_display',
            'ip', 'admin', 'admin_password', 'cabinet_frame_slot', 'port', 'ftp_mask',
            'status', 'status_display', 'owner', 'last_check_time',
            'create_time', 'update_time', 'variables'
        ]
        read_only_fields = ['id', 'create_time', 'update_time', 'variables', 'owner']

    def validate_name(self, value):
        """验证环境名称的唯一性"""
        if self.instance is None:
            if Environment.objects.filter(name=value, is_deleted=False).exists():
                raise serializers.ValidationError('环境名称已存在')
        else:
            if Environment.objects.filter(name=value, is_deleted=False).exclude(id=self.instance.id).exists():
                raise serializers.ValidationError('环境名称已存在')
        return value

    def validate(self, data):
        """验证数据的一致性"""
        # 根据连接方式验证必填字段
        conn_type = data.get('conn_type', self.instance.conn_type if self.instance else None)
        if conn_type == 'Redirect' and not data.get('cabinet_frame_slot'):
            raise serializers.ValidationError('Redirect连接方式下必须填写机柜槽位')
        if conn_type == 'Telnet' and not data.get('port'):
            raise serializers.ValidationError('Telnet连接方式下必须填写端口')
        return data

    def update(self, instance, validated_data):
        """更新环境时，自动从请求中获取当前用户的用户名作为owner"""
        # 从上下文中获取请求对象
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 设置owner为当前登录用户的用户名
            validated_data['owner'] = request.user.username
        
        # 调用父类的update方法完成其他字段的更新
        return super().update(instance, validated_data)
        
    def create(self, validated_data):
        """创建环境时，自动从请求中获取当前用户的用户名作为owner"""
        # 从上下文中获取请求对象
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            # 设置owner为当前登录用户的用户名
            validated_data['owner'] = request.user.username
        
        # 调用父类的create方法完成创建
        return super().create(validated_data)