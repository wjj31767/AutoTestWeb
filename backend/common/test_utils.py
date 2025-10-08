from unittest.mock import patch, MagicMock
import pytest

# Celery任务的mock装饰器
def mock_celery_task(func):
    """模拟Celery任务的装饰器"""
    def wrapper(self, *args, **kwargs):
        with patch('common.tasks.create_environment_task.delay') as mock_create_task, \
             patch('common.tasks.start_environment_task.delay') as mock_start_task, \
             patch('common.tasks.stop_environment_task.delay') as mock_stop_task:
            # 模拟任务延迟执行
            mock_create_task.return_value = MagicMock()
            mock_start_task.return_value = MagicMock()
            mock_stop_task.return_value = MagicMock()
            return func(self, *args, **kwargs)
    return wrapper

# 用于Django测试的工具函数
def setup_test_environment():
    """设置测试环境"""
    # 这里可以添加一些全局的测试设置
    pass

# Docker客户端的mock
class MockDockerClient:
    """模拟Docker客户端"""
    def __init__(self):
        self.containers = MockContainers()

class MockContainers:
    """模拟Docker容器操作"""
    def run(self, **kwargs):
        """模拟创建容器"""
        container = MagicMock()
        container.id = f"mock_container_{kwargs.get('name', 'test')}"
        container.attrs = {
            'NetworkSettings': {
                'IPAddress': '172.17.0.2'
            }
        }
        return container
    
    def get(self, container_id):
        """模拟获取容器"""
        container = MagicMock()
        container.id = container_id
        container.attrs = {
            'NetworkSettings': {
                'IPAddress': '172.17.0.2'
            }
        }
        return container