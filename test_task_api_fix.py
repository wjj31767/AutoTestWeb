import requests
import json

# 测试任务创建API
def test_task_creation():
    print('开始测试任务创建API...')
    
    # 准备测试数据
    test_data = {
        "name": "test",
        "env_id": "env_1759859404_cpkfqtkz",
        "suite_id": "suite-a2eaa976",
        "description": "",
        "branch_package": "testbranch",
        "execution_mode": "parallel",
        "max_concurrency": 5,
        "timeout": 60,
        "execution_params": "",
        "file_list": []
        # 注意：这里故意不提供package_info字段
    }
    
    print('提交的测试数据:')
    print(json.dumps(test_data, indent=2))
    
    try:
        # 先尝试直接访问API根节点，确认API服务正常
        api_root_url = 'http://localhost:8000/api/'
        print(f'测试API根节点: {api_root_url}')
        root_response = requests.get(api_root_url)
        print(f'API根节点响应状态码: {root_response.status_code}')
        
        # 直接发送请求到任务创建API（因为我们已经临时移除了认证要求）
        url = 'http://localhost:8000/api/tasks/'
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        print(f'直接发送请求到任务创建API: {url}')
        response = requests.post(
            url,
            headers=headers,
            data=json.dumps(test_data)
        )
        
        print(f'响应状态码: {response.status_code}')
        
        # 打印完整响应头信息
        print('响应头信息:')
        for key, value in response.headers.items():
            print(f'  {key}: {value}')
        
        # 尝试获取详细的错误信息
        if response.status_code != 201:
            print('请求失败！')
            try:
                # 尝试以JSON格式解析响应
                error_data = response.json()
                print('错误详情(JSON格式):')
                print(json.dumps(error_data, indent=2, ensure_ascii=False))
            except Exception as json_err:
                print(f'无法以JSON格式解析错误响应: {str(json_err)}')
                # 打印原始响应内容（限制长度）
                response_text = response.text[:1000]  # 只打印前1000个字符
                print(f'原始响应内容:')
                print(response_text)
                if len(response.text) > 1000:
                    print('... 响应内容太长，已截断')
        else:
            # 请求成功
            try:
                data = response.json()
                print('请求成功！响应数据:')
                print(json.dumps(data, indent=2, ensure_ascii=False))
                
                # 验证executor字段是否已自动填充
                if 'executor' in data and data['executor']:
                    print(f'✓ 验证成功：executor字段已自动填充为: {data["executor"]}')
                else:
                    print('✗ 验证失败：executor字段未自动填充')
                    
                # 验证package_info字段是否可选
                if 'package_info' in data:
                    print(f'package_info字段值: {data["package_info"]}')
            except Exception as json_err:
                print(f'无法解析成功响应: {str(json_err)}')
                print(f'原始响应内容: {response.text}')
                
    except Exception as e:
        print(f'测试过程中发生异常: {str(e)}')
        # 打印异常的详细堆栈信息
        import traceback
        traceback.print_exc()
        
if __name__ == '__main__':
    test_task_creation()