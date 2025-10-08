import os
import sys

# 设置Django环境
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')

# 导入Django模块
import django
django.setup()

# 导入User模型
from django.contrib.auth.models import User

# 查询所有超级用户
superusers = User.objects.filter(is_superuser=True)

# 打印超级用户信息
print("=== 超级用户账户列表 ===")
if superusers.exists():
    for user in superusers:
        print(f"用户名: {user.username}")
        print(f"邮箱: {user.email}")
        print(f"首次创建时间: {user.date_joined}")
        print(f"最后登录时间: {user.last_login}")
        print("------------------------")
else:
    print("未找到任何超级用户账户。")