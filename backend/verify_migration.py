import sqlite3

# 连接到SQLite数据库
db_path = "db.sqlite3"
conn = sqlite3.connect(db_path)
cursor = conn.cursor()

print("\n验证迁移结果：")

# 检查所有相关表
required_tables = ['tb_feature', 'tb_test_case', 'tb_feature_testcase_relation']

for table in required_tables:
    # 检查表是否存在
    cursor.execute("""
    SELECT name FROM sqlite_master WHERE type='table' AND name=?;
    """, (table,))
    exists = cursor.fetchone() is not None
    
    if exists:
        print(f"\n✅ {table}表已成功创建！")
        
        # 显示表结构
        print(f"  表结构：")
        cursor.execute(f"PRAGMA table_info({table});")
        columns = cursor.fetchall()
        for col in columns:
            print(f"    - {col[1]} ({col[2]}){', 主键' if col[5] else ''}{', 非空' if col[3] else ''}")
    else:
        print(f"\n❌ {table}表未创建！")

# 检查是否有外键约束
print("\n外键约束检查：")
for table in required_tables:
    if table == 'tb_feature_testcase_relation':
        cursor.execute("""
        SELECT sql FROM sqlite_master WHERE type='table' AND name=?;
        """, (table,))
        create_sql = cursor.fetchone()[0]
        
        if 'FOREIGN KEY' in create_sql:
            print(f"✅ {table}表包含外键约束")
        else:
            print(f"❌ {table}表缺少外键约束")

# 关闭连接
conn.close()
print("\n验证完成！")