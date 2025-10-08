import os
import sqlite3
from pathlib import Path

# 获取当前脚本所在目录
current_dir = Path(__file__).resolve().parent

# 数据库文件路径 - 假设在当前目录下的db.sqlite3
# 请根据实际情况调整路径
DB_PATH = os.path.join(current_dir, 'db.sqlite3')

def check_database_structure():
    try:
        # 连接到SQLite数据库
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        
        print(f"连接数据库成功: {DB_PATH}")
        
        # 检查tb_test_case表是否存在
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='tb_test_case';")
        table_exists = cursor.fetchone() is not None
        
        if not table_exists:
            print("错误: tb_test_case表不存在")
            return
        
        # 检查表结构
        print("\ntb_test_case表结构:")
        cursor.execute("PRAGMA table_info(tb_test_case);")
        columns = cursor.fetchall()
        
        print("列名\t类型\t是否为主键\t是否可以为NULL")
        print("-" * 60)
        
        id_column_info = None
        for col in columns:
            cid, name, type_, notnull, dflt_value, pk = col
            is_null = 'NO' if notnull else 'YES'
            is_pk = 'YES' if pk else 'NO'
            
            # 记录id列的信息
            if name.lower() == 'id':
                id_column_info = {
                    'name': name,
                    'type': type_,
                    'is_pk': is_pk,
                    'is_null': is_null,
                    'dflt_value': dflt_value
                }
            
            print(f"{name}\t{type_}\t{is_pk}\t{is_null}")
        
        # 检查是否有重复的id
        print("\n检查是否有重复的id值:")
        cursor.execute("""SELECT id, COUNT(*) as count 
                          FROM tb_test_case 
                          GROUP BY id 
                          HAVING COUNT(*) > 1;""")
        duplicates = cursor.fetchall()
        
        if duplicates:
            print(f"发现{len(duplicates)}个重复的id值:")
            for id_value, count in duplicates:
                print(f"id: {id_value}, 出现次数: {count}")
        else:
            print("没有发现重复的id值")
        
        # 检查最新的10条记录
        print("\n最新的10条测试用例记录:")
        cursor.execute("""SELECT id, case_id, case_name, feature_id, creator 
                          FROM tb_test_case 
                          ORDER BY id DESC 
                          LIMIT 10;""")
        recent_records = cursor.fetchall()
        
        if recent_records:
            print("id\tcase_id\tcase_name\tfeature_id\tcreator")
            print("-" * 100)
            for record in recent_records:
                id_value, case_id, case_name, feature_id, creator = record
                # 截断过长的字符串以便显示
                case_name_truncated = (case_name[:20] + '...') if len(case_name) > 20 else case_name
                print(f"{id_value}\t{case_id}\t{case_name_truncated}\t{feature_id}\t{creator}")
        else:
            print("没有找到测试用例记录")
        
        # 检查id列是否设置了自动递增
        if id_column_info:
            print("\nid列信息:")
            print(f"- 名称: {id_column_info['name']}")
            print(f"- 类型: {id_column_info['type']}")
            print(f"- 主键: {id_column_info['is_pk']}")
            print(f"- 允许NULL: {id_column_info['is_null']}")
            print(f"- 默认值: {id_column_info['dflt_value']}")
            
            # 检查是否有AUTOINCREMENT
            cursor.execute("SELECT sql FROM sqlite_master WHERE type='table' AND name='tb_test_case';")
            create_table_sql = cursor.fetchone()[0]
            has_autoincrement = 'AUTOINCREMENT' in create_table_sql.upper()
            print(f"- 包含AUTOINCREMENT: {'YES' if has_autoincrement else 'NO'}")
        
    except sqlite3.Error as e:
        print(f"数据库错误: {e}")
    except Exception as e:
        print(f"发生错误: {e}")
    finally:
        if conn:
            conn.close()
            print("\n数据库连接已关闭")

if __name__ == "__main__":
    check_database_structure()