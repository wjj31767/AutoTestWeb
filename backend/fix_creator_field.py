#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
脚本用途：专门修复tb_test_case表中的creator字段，确保它允许NULL值或有默认值
"""

import os
import sys

# 设置Django环境
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'AutoTestWeb.settings')

# 导入Django模块
import django
django.setup()

# 导入Django的数据库连接
from django.db import connection


def fix_creator_field():
    """修复tb_test_case表中的creator字段"""
    print("连接到数据库...")
    
    try:
        with connection.cursor() as cursor:
            # 先查看当前表结构
            print("查看当前表结构...")
            cursor.execute("""
            SELECT sql FROM sqlite_master WHERE type='table' AND name='tb_test_case';
            """)
            create_table_sql = cursor.fetchone()[0]
            print(f"当前表结构SQL: {create_table_sql}")
            
            # 检查creator字段是否有NOT NULL约束
            if 'creator' in create_table_sql and 'NOT NULL' in create_table_sql.split('creator')[1].split(',')[0]:
                print("发现creator字段有NOT NULL约束，需要修复...")
                
                # 重命名原表
                print("重命名原表为tb_test_case_old...")
                cursor.execute("""
                ALTER TABLE tb_test_case RENAME TO tb_test_case_old;
                """)
                
                # 创建新表，修改creator字段为允许NULL并设置默认值
                # 注意：从表结构看，实际是VARCHAR(64)而不是VARCHAR(32)
                new_create_sql = create_table_sql.replace(
                    'creator VARCHAR(64) NOT NULL', 
                    'creator VARCHAR(64) DEFAULT \'test\''
                )
                print("创建新表，修改creator字段定义...")
                print(f"新的表结构SQL: {new_create_sql}")
                cursor.execute(new_create_sql)
                
                # 获取所有列名
                cursor.execute("""
                PRAGMA table_info(tb_test_case);
                """)
                new_columns = [column[1] for column in cursor.fetchall()]
                columns_str = ', '.join(new_columns)
                
                # 复制数据
                print("复制数据到新表...")
                cursor.execute(f"""
                INSERT INTO tb_test_case ({columns_str}) 
                SELECT {columns_str} FROM tb_test_case_old;
                """)
                
                # 删除旧表
                print("删除旧表...")
                cursor.execute("""
                DROP TABLE tb_test_case_old;
                """)
                
                print("creator字段修复成功！现在creator字段允许NULL并有默认值'test'。")
            else:
                print("creator字段已经允许NULL或有默认值，无需修复。")
                
            # 再次检查表结构，确认修复是否成功
            cursor.execute("""
            SELECT sql FROM sqlite_master WHERE type='table' AND name='tb_test_case';
            """)
            updated_sql = cursor.fetchone()[0]
            print(f"更新后的表结构SQL: {updated_sql}")
            
    except Exception as e:
        print(f"修复过程中发生错误: {str(e)}")
        raise
    finally:
        print("数据库操作完成！")


if __name__ == "__main__":
    fix_creator_field()