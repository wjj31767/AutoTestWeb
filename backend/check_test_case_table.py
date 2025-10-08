import sqlite3
import os
from pathlib import Path

# 获取当前脚本所在目录
current_dir = Path(__file__).resolve().parent

# 数据库文件路径
DB_PATH = os.path.join(current_dir, 'db.sqlite3')

def check_test_case_table_structure():
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
        
        # 获取表结构信息
        print("\ntb_test_case表结构信息:")
        cursor.execute("PRAGMA table_info(tb_test_case);")
        columns = cursor.fetchall()
        
        print("cid\tname\ttype\tnotnull\tdflt_value\tpk")
        print("-" * 80)
        
        # 检查必要字段是否存在
        has_priority = False
        has_test_type = False
        has_test_phase = False
        has_creator = False
        for column in columns:
            cid, name, type_, notnull, dflt_value, pk = column
            print(f"{cid}\t{name}\t{type_}\t{notnull}\t{dflt_value}\t{pk}")
            if name == 'priority':
                has_priority = True
            elif name == 'test_type':
                has_test_type = True
            elif name == 'test_phase':
                has_test_phase = True
            elif name == 'creator':
                has_creator = True
        
        # 获取表索引信息
        print("\ntb_test_case表索引信息:")
        cursor.execute("PRAGMA index_list(tb_test_case);")
        indexes = cursor.fetchall()
        
        if indexes:
            print("seq\tname\tunique\torigin\tpartial")
            print("-" * 80)
            for index in indexes:
                seq, name, unique, origin, partial = index
                print(f"{seq}\t{name}\t{unique}\t{origin}\t{partial}")
        else:
            print("没有索引")
        
        # 验证所有必要字段是否存在
        print(f"\npriority字段是否存在: {has_priority}")
        print(f"test_type字段是否存在: {has_test_type}")
        print(f"test_phase字段是否存在: {has_test_phase}")
        print(f"creator字段是否存在: {has_creator}")
        
        # 查询今天创建的测试用例记录
        print("\n今天创建的测试用例记录:")
        cursor.execute("SELECT id, case_id, case_name, priority, test_type, test_phase, creator, create_time FROM tb_test_case WHERE DATE(create_time) = DATE('now') ORDER BY create_time DESC;")
        today_records = cursor.fetchall()
        
        if today_records:
            print("id\tcase_id\tcase_name\tpriority\ttest_type\ttest_phase\tcreator\tcreate_time")
            print("-" * 150)
            for record in today_records:
                print(f"{record[0]}\t{record[1]}\t{record[2][:20]}...\t{record[3]}\t{record[4]}\t{record[5]}\t{record[6]}\t{record[7]}")
        else:
            print("\n没有找到今天创建的测试用例记录")
        
    except sqlite3.Error as e:
        print(f"数据库错误: {e}")
    except Exception as e:
        print(f"发生错误: {e}")
    finally:
        if conn:
            conn.close()
            print("\n数据库连接已关闭")

if __name__ == "__main__":
    check_test_case_table_structure()