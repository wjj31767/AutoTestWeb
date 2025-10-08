import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
import django
django.setup()
from django.db import connection

print("检查数据库中的表结构...")

# 获取所有表名
with connection.cursor() as cursor:
    cursor.execute("""
    SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
    """)
    tables = cursor.fetchall()
    
print("当前数据库中的表：")
for table in tables:
    print(f"- {table[0]}")

# 检查特定表是否存在
table_names = [table[0] for table in tables]

# 检查feature相关表
if 'tb_feature' in table_names:
    print("\ntb_feature表存在。查看其结构：")
    with connection.cursor() as cursor:
        cursor.execute("PRAGMA table_info(tb_feature);")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
else:
    print("\ntb_feature表不存在。")

# 检查test_case相关表
for test_table in ['tb_test_case', 'test_case', 'TestCase']:
    if test_table in table_names:
        print(f"\n{test_table}表存在。查看其结构：")
        with connection.cursor() as cursor:
            cursor.execute(f"PRAGMA table_info({test_table});")
            columns = cursor.fetchall()
            for col in columns:
                print(f"  - {col[1]} ({col[2]})")
        break
else:
    print("\n没有找到测试用例相关的表。")

print("\n检查完成。")