from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response

class CustomPageNumberPagination(PageNumberPagination):
    """自定义分页类，支持多种分页参数格式"""
    # 支持的分页参数名称列表
    page_size_query_param = 'page_size'  # Django REST Framework 默认参数名
    page_query_param = 'page'  # 页码参数名
    max_page_size = 100  # 最大页面大小限制
    
    def get_page_size(self, request):
        """
        从请求中获取页面大小参数，支持多种参数名格式
        优先级顺序: page_size > pageSize > limit > 默认值
        """
        # 尝试从多种参数名中获取页面大小
        page_size = request.query_params.get('page_size')
        if not page_size:
            page_size = request.query_params.get('pageSize')
        if not page_size:
            page_size = request.query_params.get('limit')
            
        # 如果获取到有效参数，则解析为整数并进行验证
        if page_size:
            try:
                page_size = int(page_size)
                # 确保不超过最大页面大小限制
                return min(page_size, self.max_page_size)
            except (ValueError, TypeError):
                pass
        
        # 如果没有有效参数或解析失败，使用默认页面大小
        return self.page_size

    def get_paginated_response(self, data):
        """自定义分页响应格式"""
        return Response({
            'count': self.page.paginator.count,
            'results': data,
            'page': self.page.number,
            'page_size': self.get_page_size(self.request),
            'total_pages': self.page.paginator.num_pages
        })