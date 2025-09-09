#!/usr/bin/env python3
"""
后端启动脚本
"""
import os
import sys

# 添加src目录到Python路径
current_dir = os.path.dirname(os.path.abspath(__file__))
src_dir = os.path.join(current_dir, 'src')
sys.path.insert(0, src_dir)

if __name__ == '__main__':
    try:
        from web_api import app
        print("🚀 启动PaperCheck后端服务...")
        print("📍 API地址: http://localhost:5001")
        print("📖 健康检查: http://localhost:5001/api/health")
        print("⚠️  请确保已安装所有依赖: pip install -r requirements.txt")
        print("-" * 50)
        
        app.run(
            host='0.0.0.0',
            port=5001,
            debug=True,
            threaded=True
        )
    except ImportError as e:
        print(f"❌ 导入错误: {e}")
        print("请确保已安装所有依赖包:")
        print("pip install -r requirements.txt")
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)
