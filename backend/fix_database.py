import os
import sys

# 设置Django环境变量
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')

# 导入Django
import django
django.setup()

# 使用Django的数据库连接
from django.db import connection

print("连接到数据库...")

# 执行SQL语句修复表结构
try:
    with connection.cursor() as cursor:
        # 检查表结构
        cursor.execute("""
        PRAGMA table_info(tb_test_case);
        """)
        columns = [column[1] for column in cursor.fetchall()]
        
        # 1. 修复case_id字段
        if 'case_id' not in columns:
            print("向tb_test_case表添加case_id字段...")
            # SQLite不支持直接添加唯一约束，所以我们先添加字段，然后再添加索引
            cursor.execute("""
            ALTER TABLE tb_test_case 
            ADD COLUMN case_id VARCHAR(50) NOT NULL DEFAULT 'TC-placeholder';
            """)
            
            # 现在更新所有已存在的记录的case_id，确保唯一性
            cursor.execute("""
            UPDATE tb_test_case 
            SET case_id = 'TC-' || id;
            """)
            
            # 添加唯一索引
            cursor.execute("""
            CREATE UNIQUE INDEX idx_case_id ON tb_test_case (case_id);
            """)
            
            print("case_id字段添加成功！")
        else:
            print("case_id字段已存在，无需添加。")
        
        # 2. 修复feature_id字段（将module_id重命名为feature_id）
        if 'module_id' in columns and 'feature_id' not in columns:
            print("修复tb_test_case表中的feature_id字段...")
            # SQLite不支持直接重命名列，所以我们需要：
            # a. 添加新的feature_id列
            cursor.execute("""
            ALTER TABLE tb_test_case 
            ADD COLUMN feature_id VARCHAR(64) NOT NULL DEFAULT '';
            """)
            
            # b. 将module_id的值复制到feature_id
            cursor.execute("""
            UPDATE tb_test_case 
            SET feature_id = module_id;
            """)
            
            # c. 添加外键约束
            # 注意：SQLite在已有的表上添加外键约束比较复杂，这里暂时不做
            print("feature_id字段添加成功！")
        elif 'feature_id' in columns:
            print("feature_id字段已存在，无需添加。")
        
        # 3. 添加缺失的字段
        fields_to_add = {
            'pre_condition': 'TEXT NOT NULL DEFAULT ""',
            'sync_time': 'TIMESTAMP'
        }
        
        for field_name, field_def in fields_to_add.items():
            if field_name not in columns:
                print(f"向tb_test_case表添加{field_name}字段...")
                cursor.execute(f"""
                ALTER TABLE tb_test_case 
                ADD COLUMN {field_name} {field_def};
                """)
                print(f"{field_name}字段添加成功！")
            else:
                print(f"{field_name}字段已存在，无需添加。")
        
        # 4. 修改module_id字段为允许NULL
        # 注意：SQLite不支持直接修改列的NOT NULL约束，需要重新创建表
        # 这里采用一种变通方法：重命名原表，创建新表，复制数据
        print("检查并修改表结构中的NOT NULL约束...")
        
        # 检查表结构
        cursor.execute("""
        SELECT sql FROM sqlite_master WHERE type='table' AND name='tb_test_case';
        """)
        create_table_sql = cursor.fetchone()[0]
        
        # 检查是否需要修改任何字段的NOT NULL约束
        need_modification = False
        
        # 检查module_id字段
        if 'module_id' in create_table_sql and 'NOT NULL' in create_table_sql.split('module_id')[1].split(',')[0]:
            need_modification = True
        
        # 检查creator字段
        if 'creator' in create_table_sql and 'NOT NULL' in create_table_sql.split('creator')[1].split(',')[0]:
            need_modification = True
        
        if need_modification:
            print("需要修改表结构中的NOT NULL约束...")
            
            # 重命名原表
            cursor.execute("""
            ALTER TABLE tb_test_case RENAME TO tb_test_case_old;
            """)
            
            # 创建新表，将需要修改的字段设置为允许NULL
            new_create_sql = create_table_sql.replace('module_id VARCHAR(64) NOT NULL', 'module_id VARCHAR(64)')
            new_create_sql = new_create_sql.replace('creator VARCHAR(32) NOT NULL', 'creator VARCHAR(32) DEFAULT \'test\'')
            cursor.execute(new_create_sql)
            
            # 获取所有列名
            cursor.execute("""
            PRAGMA table_info(tb_test_case);
            """)
            new_columns = [column[1] for column in cursor.fetchall()]
            columns_str = ', '.join(new_columns)
            
            # 复制数据
            cursor.execute(f"""
            INSERT INTO tb_test_case ({columns_str}) 
            SELECT {columns_str} FROM tb_test_case_old;
            """)
            
            # 删除旧表
            cursor.execute("""
            DROP TABLE tb_test_case_old;
            """)
            
            print("表结构中的NOT NULL约束已修改完成！")
        else:
            print("表结构中的NOT NULL约束已满足要求，无需修改。")
            
    print("数据库操作完成！")
except Exception as e:
    print(f"发生错误: {e}")