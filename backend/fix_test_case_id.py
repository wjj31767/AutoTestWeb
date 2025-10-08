import os
import sqlite3
from pathlib import Path

# 获取当前脚本所在目录
current_dir = Path(__file__).resolve().parent

# 数据库文件路径
DB_PATH = os.path.join(current_dir, 'db.sqlite3')

def fix_test_case_id_column():
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
        
        print("\n开始修复tb_test_case表的id列...")
        
        # 步骤1: 创建临时表，保留所有数据但使用正确的id列定义
        print("步骤1: 创建临时表...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS tb_test_case_temp (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                create_time TIMESTAMP NOT NULL,
                update_time TIMESTAMP NOT NULL,
                is_deleted BOOLEAN NOT NULL,
                case_name VARCHAR(100) NOT NULL,
                module_id VARCHAR(64),
                status VARCHAR(20) NOT NULL,
                priority INTEGER NOT NULL,
                test_type VARCHAR(20) NOT NULL,
                test_phase VARCHAR(20) NOT NULL,
                description TEXT,
                steps TEXT,
                expected_result TEXT,
                actual_result TEXT,
                script_path TEXT,
                executor VARCHAR(64),
                creator VARCHAR(64) DEFAULT 'test',
                case_id VARCHAR(50) NOT NULL,
                feature_id VARCHAR(64) NOT NULL,
                pre_condition TEXT NOT NULL,
                sync_time TIMESTAMP
            )
        """)
        
        # 步骤2: 复制数据到临时表
        print("步骤2: 复制数据到临时表...")
        # 注意：这里不复制id列，让SQLite自动生成新的id值
        cursor.execute("""
            INSERT INTO tb_test_case_temp (
                create_time, update_time, is_deleted, case_name, module_id, status,
                priority, test_type, test_phase, description, steps, expected_result,
                actual_result, script_path, executor, creator, case_id, feature_id,
                pre_condition, sync_time
            )
            SELECT 
                create_time, update_time, is_deleted, case_name, module_id, status,
                priority, test_type, test_phase, description, steps, expected_result,
                actual_result, script_path, executor, creator, case_id, feature_id,
                pre_condition, sync_time
            FROM tb_test_case
        """)
        
        # 步骤3: 备份原表并重命名临时表为原表名
        print("步骤3: 替换原表...")
        cursor.execute("ALTER TABLE tb_test_case RENAME TO tb_test_case_backup;")
        cursor.execute("ALTER TABLE tb_test_case_temp RENAME TO tb_test_case;")
        
        # 步骤4: 提交更改
        conn.commit()
        
        print("\n修复完成！tb_test_case表的id列已修改为INTEGER PRIMARY KEY AUTOINCREMENT类型。")
        print("原表已备份为tb_test_case_backup。")
        
        # 验证修复结果
        print("\n验证修复结果:")
        cursor.execute("PRAGMA table_info(tb_test_case);")
        columns = cursor.fetchall()
        
        print("列名\t类型\t是否为主键\t是否可以为NULL")
        print("-" * 60)
        
        for col in columns:
            cid, name, type_, notnull, dflt_value, pk = col
            is_null = 'NO' if notnull else 'YES'
            is_pk = 'YES' if pk else 'NO'
            print(f"{name}\t{type_}\t{is_pk}\t{is_null}")
        
        # 检查最新的10条记录，确认id列有值
        print("\n修复后的最新10条测试用例记录:")
        cursor.execute("""
            SELECT id, case_id, case_name, feature_id, creator 
            FROM tb_test_case 
            ORDER BY id DESC 
            LIMIT 10;
        """)
        recent_records = cursor.fetchall()
        
        if recent_records:
            print("id\tcase_id\tcase_name\tfeature_id\tcreator")
            print("-" * 100)
            for record in recent_records:
                id_value, case_id, case_name, feature_id, creator = record
                case_name_truncated = (case_name[:20] + '...') if len(case_name) > 20 else case_name
                print(f"{id_value}\t{case_id}\t{case_name_truncated}\t{feature_id}\t{creator}")
        else:
            print("没有找到测试用例记录")
        
    except sqlite3.Error as e:
        print(f"数据库错误: {e}")
        # 发生错误时回滚
        conn.rollback()
    except Exception as e:
        print(f"发生错误: {e}")
        # 发生错误时回滚
        conn.rollback()
    finally:
        if conn:
            conn.close()
            print("\n数据库连接已关闭")

if __name__ == "__main__":
    fix_test_case_id_column()