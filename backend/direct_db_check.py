import sqlite3

# 直接连接到SQLite数据库文件
db_path = "db.sqlite3"

print(f"正在连接到数据库: {db_path}")

# 连接数据库
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n当前数据库中的表：")
# 查询所有表名
cursor.execute("""
SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';
""")
tables = cursor.fetchall()

for table in tables:
    print(f"- {table[0]}")

# 检查feature相关表
table_names = [table[0] for table in tables]

# 检查feature相关表
if 'tb_feature' in table_names:
    print("\ntb_feature表存在。查看其结构：")
    cursor.execute("PRAGMA table_info(tb_feature);")
    columns = cursor.fetchall()
    for col in columns:
        print(f"  - {col[1]} ({col[2]})")
else:
    print("\ntb_feature表不存在。")

# 检查test_case相关表
found = False
for test_table in ['tb_test_case', 'test_case', 'TestCase', 'testcase']:
    if test_table in table_names:
        print(f"\n{test_table}表存在。查看其结构：")
        cursor.execute(f"PRAGMA table_info({test_table});")
        columns = cursor.fetchall()
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")
        found = True
        break
if not found:
    print("\n没有找到测试用例相关的表。")

# 关闭连接
conn.close()
print("\n数据库检查完成。")