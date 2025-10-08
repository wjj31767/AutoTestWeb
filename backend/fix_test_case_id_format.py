import os
import sqlite3
from pathlib import Path
import uuid

# 获取当前脚本所在目录
current_dir = Path(__file__).resolve().parent

# 数据库文件路径
DB_PATH = os.path.join(current_dir, 'db.sqlite3')

def fix_test_case_id_format():
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
        
        print("\n开始修复tb_test_case表的id值格式...")
        
        # 步骤1: 检查并修复不符合格式的id值
        print("步骤1: 检查并修复不符合格式的id值...")
        
        # 查询所有不符合格式的id值（不以'case-'开头的）
        cursor.execute("SELECT id FROM tb_test_case WHERE id NOT LIKE 'case-%';")
        invalid_ids = cursor.fetchall()
        
        if len(invalid_ids) > 0:
            print(f"找到{len(invalid_ids)}个不符合格式的id值，开始修复...")
            
            # 为每个不符合格式的id生成新的符合格式的id
            for (old_id,) in invalid_ids:
                # 生成类似case-xxx格式的id
                new_id = f"case-{str(uuid.uuid4())[:8]}"
                
                # 更新id值
                cursor.execute(
                    "UPDATE tb_test_case SET id = ? WHERE id = ?;",
                    (new_id, old_id)
                )
                
                print(f"  将id '{old_id}' 更新为 '{new_id}'")
        else:
            print("没有发现不符合格式的id值")
        
        # 步骤2: 确保id列有默认值，以便在插入新记录时自动生成id
        print("\n步骤2: 确保id列有默认值...")
        
        # 检查当前表结构
        cursor.execute("PRAGMA table_info(tb_test_case);")
        columns = cursor.fetchall()
        
        id_column = None
        for col in columns:
            cid, name, type_, notnull, dflt_value, pk = col
            if name == 'id':
                id_column = {
                    'cid': cid,
                    'name': name,
                    'type': type_,
                    'notnull': notnull,
                    'dflt_value': dflt_value,
                    'pk': pk
                }
                break
        
        if id_column and id_column['dflt_value'] is None:
            print("  id列没有默认值，需要重新创建表来添加默认值...")
            
            # 创建新表，包含id列的默认值
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS tb_test_case_new (
                    id VARCHAR(64) PRIMARY KEY DEFAULT (LOWER(HEX(RANDOMBLOB(16)))),
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
            
            # 复制数据到新表
            cursor.execute("""
                INSERT INTO tb_test_case_new (
                    id, create_time, update_time, is_deleted, case_name, module_id, status,
                    priority, test_type, test_phase, description, steps, expected_result,
                    actual_result, script_path, executor, creator, case_id, feature_id,
                    pre_condition, sync_time
                )
                SELECT 
                    id, create_time, update_time, is_deleted, case_name, module_id, status,
                    priority, test_type, test_phase, description, steps, expected_result,
                    actual_result, script_path, executor, creator, case_id, feature_id,
                    pre_condition, sync_time
                FROM tb_test_case
            """)
            
            # 备份当前表并重命名新表
            cursor.execute("ALTER TABLE tb_test_case RENAME TO tb_test_case_old;")
            cursor.execute("ALTER TABLE tb_test_case_new RENAME TO tb_test_case;")
            
            print("  表已重新创建，id列现在有默认值")
        else:
            print("  id列已经有默认值")
        
        # 步骤3: 提交更改
        conn.commit()
        
        print("\n修复完成！所有id值现在都符合'case-'格式，并且id列有默认值。")
        
        # 验证修复结果
        print("\n验证修复结果:")
        cursor.execute("""
            SELECT id, case_id, case_name, feature_id, creator 
            FROM tb_test_case 
            ORDER BY create_time DESC 
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
    fix_test_case_id_format()