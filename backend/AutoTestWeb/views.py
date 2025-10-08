"""Main application views for AutoTestWeb"""
from django.shortcuts import render
from django.http import HttpResponse


def root_view(request):
    """Root view that displays a welcome page with links to the admin panel and API documentation"""
    html_content = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>AutoTestWeb - Welcome</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                text-align: center;
                color: #333;
            }
            h1 {
                color: #2c3e50;
            }
            .container {
                background-color: #f8f9fa;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                margin-top: 50px;
            }
            .links {
                margin-top: 30px;
            }
            a {
                display: inline-block;
                margin: 10px;
                padding: 10px 20px;
                background-color: #3498db;
                color: white;
                text-decoration: none;
                border-radius: 5px;
                transition: background-color 0.3s;
            }
            a:hover {
                background-color: #2980b9;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Welcome to AutoTestWeb</h1>
            <p>A comprehensive test environment management system</p>
            <div class="links">
                <a href="/admin/">Admin Panel</a>
                <a href="/api/">API Documentation</a>
            </div>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html_content)