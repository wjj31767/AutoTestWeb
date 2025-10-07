import os
import django
from django.contrib.auth import get_user_model

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')
django.setup()

# 获取用户模型
User = get_user_model()

# 创建管理员用户
username = 'admin'
email = 'admin@example.com'
password = 'admin123'

if User.objects.filter(username=username).exists():
    print(f'用户 {username} 已存在')
else:
    User.objects.create_superuser(username=username, email=email, password=password)
    print(f'管理员用户 {username} 创建成功')