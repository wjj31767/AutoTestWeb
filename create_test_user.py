import os
import django
from django.contrib.auth import get_user_model

# 设置Django环境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')
django.setup()

# 获取用户模型
User = get_user_model()

# 创建普通用户
username = 'test'
email = 'test@example.com'
password = 'test@123'

if User.objects.filter(username=username).exists():
    print(f'普通用户 {username} 已存在')
else:
    user = User.objects.create_user(username=username, email=email, password=password)
    print(f'普通用户 {username} 创建成功')