import sqlite3
import os

# 获取数据库路径
db_path = os.path.join(os.path.dirname(__file__), 'db.sqlite3')

# 连接到SQLite数据库
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

# 检查是否存在tb_execution_task表
print("检查tb_execution_task表是否存在：")
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_execution_task';")
table_exists = cursor.fetchone()

if table_exists:
    print("表已存在")
    # 检查表结构
    print("\ntb_execution_task表结构：")
    cursor.execute("PRAGMA table_info(tb_execution_task);")
    columns = cursor.fetchall()
    print("字段名\t字段类型\t约束条件")
    print("----\t----\t----")
    for column in columns:
        # column[1]是字段名，column[2]是字段类型，column[3]是NOT NULL约束，column[5]是默认值
        not_null = "NOT NULL" if column[3] else "NULL"
        default_value = f"DEFAULT {column[5]}" if column[5] else ""
        constraints = f"{not_null} {default_value}".strip()
        print(f"{column[1]}\t{column[2]}\t{constraints}")
else:
    print("表不存在")

# 检查是否存在测试套表
test_suite_tables = [
    'tb_test_suite', 'test_suite_testsuite', 'test_suite_testcases'
]
print("\n检查测试套相关表：")
for table_name in test_suite_tables:
    cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table_name}';")
    exists = cursor.fetchone()
    print(f"{table_name}: {'存在' if exists else '不存在'}")

# 检查环境表
env_table = 'tb_environment'
cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{env_table}';")
env_exists = cursor.fetchone()
print(f"\n{env_table}: {'存在' if env_exists else '不存在'}")

# 关闭连接
conn.close()