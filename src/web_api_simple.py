"""
简化的Web API接口层 - 专注核心功能
"""
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
import json
import uuid
import threading
from datetime import datetime
from werkzeug.utils import secure_filename
import re

# 导入现有的核心模块
from core.citation_checker import CitationChecker
from config.config_manager import ConfigManager
from utils.document_parser import DocumentParser

app = Flask(__name__)
CORS(app)

# 配置
UPLOAD_FOLDER = 'uploads'
ALLOWED_EXTENSIONS = {'docx'}
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# 全局存储
analysis_tasks = {}

class AnalysisTask:
    """分析任务类"""
    def __init__(self, task_id, doc_path):
        self.task_id = task_id
        self.doc_path = doc_path
        self.status = 'pending'  # pending, running, completed, error
        self.progress = {'processed': 0, 'total': 0, 'percentage': 0}
        self.result = None
        self.error = None
        self.created_at = datetime.now()

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/api/upload', methods=['POST'])
def upload_document():
    """上传文档"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': '没有文件'}), 400
        
        file = request.files['file']
        if file.filename == '' or not allowed_file(file.filename):
            return jsonify({'error': '请选择.docx格式的文件'}), 400
        
        # 生成任务ID并保存文件
        task_id = str(uuid.uuid4())
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{task_id}_{filename}")
        file.save(file_path)
        
        # 创建任务
        analysis_tasks[task_id] = AnalysisTask(task_id, file_path)
        
        return jsonify({
            'task_id': task_id,
            'filename': filename,
            'message': '文档上传成功'
        })
        
    except Exception as e:
        return jsonify({'error': f'上传失败: {str(e)}'}), 500

@app.route('/api/document/<task_id>/preview', methods=['GET'])
def get_document_preview(task_id):
    """获取文档预览"""
    try:
        if task_id not in analysis_tasks:
            return jsonify({'error': '任务不存在'}), 404
        
        task = analysis_tasks[task_id]
        parser = DocumentParser(task.doc_path)
        
        return jsonify({
            'task_id': task_id,
            'html_content': parser.to_html(),
            'paragraphs': parser.get_paragraphs_with_positions(),
            'total_paragraphs': len(parser.paragraphs_data)
        })
        
    except Exception as e:
        return jsonify({'error': f'获取预览失败: {str(e)}'}), 500

@app.route('/api/document/<task_id>/analyze', methods=['POST'])
def start_analysis(task_id):
    """开始分析"""
    try:
        if task_id not in analysis_tasks:
            return jsonify({'error': '任务不存在'}), 404
        
        task = analysis_tasks[task_id]
        if task.status == 'running':
            return jsonify({'error': '分析已在进行中'}), 400
        
        # 获取分析模式
        data = request.get_json() or {}
        analysis_mode = data.get('analysis_mode', 'subjective')
        
        # 启动分析线程
        analysis_thread = threading.Thread(target=run_analysis, args=(task, analysis_mode))
        analysis_thread.start()
        
        return jsonify({
            'task_id': task_id,
            'message': '分析已开始',
            'analysis_mode': analysis_mode
        })
        
    except Exception as e:
        return jsonify({'error': f'启动分析失败: {str(e)}'}), 500

def run_analysis(task, analysis_mode):
    """运行分析任务"""
    try:
        task.status = 'running'
        
        # 选择配置文件
        config_files = {
            'subjective': 'config_subjective.json',
            'quick': 'config_quick.json',
            'full': 'config_full.json'
        }
        config_file = config_files.get(analysis_mode, 'config_full.json')
        config_path = os.path.join(os.path.dirname(__file__), "config", config_file)
        
        # 创建分析器
        checker = CitationChecker(task.doc_path, config_path)
        
        # 监控进度
        def update_progress():
            if hasattr(checker, 'total_citations') and checker.total_citations > 0:
                task.progress = {
                    'processed': checker.processed_citations,
                    'total': checker.total_citations,
                    'percentage': int((checker.processed_citations / checker.total_citations) * 100)
                }
                print(f"进度更新: {checker.processed_citations}/{checker.total_citations} ({task.progress['percentage']}%)")
        
        # 重写进度更新方法
        original_update = checker._update_progress
        def combined_update():
            update_progress()
            original_update()
        checker._update_progress = combined_update
        
        # 生成报告
        print("开始生成报告...")
        report_html = checker.generate_report()
        print("报告生成完成")
        
        # 提取问题信息（简化版）
        print("开始提取问题...")
        problems = extract_problems_from_html(report_html, task.doc_path)
        print(f"问题提取完成，发现 {len(problems)} 个问题")
        
        # 确保进度为100%
        task.progress = {
            'processed': checker.total_citations if hasattr(checker, 'total_citations') else 0,
            'total': checker.total_citations if hasattr(checker, 'total_citations') else 0,
            'percentage': 100
        }
        
        # 保存结果
        task.result = {
            'report_html': report_html,
            'problems': problems,
            'analysis_mode': analysis_mode,
            'completed_at': datetime.now().isoformat()
        }
        task.status = 'completed'
        print(f"分析任务完成: {task.task_id}")
        
    except Exception as e:
        task.status = 'error'
        task.error = str(e)
        print(f"分析任务失败: {task.task_id}, 错误: {e}")
        import traceback
        traceback.print_exc()

def extract_problems_from_html(html_report, doc_path):
    """从HTML报告中提取所有问题信息"""
    problems = []
    problem_id = 1
    
    # 1. 提取缺失引用
    missing_pattern = r'<li>\[(\d+)\]</li>'
    missing_matches = re.findall(missing_pattern, html_report)
    for citation_num in missing_matches:
        problems.append({
            'id': problem_id,
            'type': 'missing_citation',
            'citation': f'[{citation_num}]',
            'description': f'缺失引用：[{citation_num}] 未在参考文献中找到',
            'color': '#ff4d4f',
            'severity': 'error'
        })
        problem_id += 1
    
    # 2. 提取未使用的参考文献
    unused_pattern = r'<li>\[(\d+)\]: (.+?)</li>'
    unused_matches = re.findall(unused_pattern, html_report)
    for citation_num, ref_text in unused_matches:
        problems.append({
            'id': problem_id,
            'type': 'unused_reference',
            'citation': f'[{citation_num}]',
            'description': f'未使用参考文献：[{citation_num}] 未被正文引用',
            'reference_text': ref_text,
            'color': '#faad14',
            'severity': 'warning'
        })
        problem_id += 1
    
    # 3. 提取不相关引用（详细分析）
    irrelevant_pattern = r'<h3>引用 \[(\d+)\] 相关性分析</h3>\s*<div class=\'context\'><strong>上下文</strong>: (.+?)</div>\s*<div class=\'analysis\'>(.+?)</div>'
    irrelevant_matches = re.findall(irrelevant_pattern, html_report, re.DOTALL)
    
    for citation_num, context, analysis in irrelevant_matches:
        # 检查是否标记为不相关
        if '不相关' in analysis or 'not relevant' in analysis.lower():
            problems.append({
                'id': problem_id,
                'type': 'irrelevant_citation',
                'citation': f'[{citation_num}]',
                'description': f'不相关引用：[{citation_num}] 与上下文不相关',
                'context': context,
                'analysis': analysis,
                'color': '#fa8c16',
                'severity': 'warning'
            })
            problem_id += 1
    
    return problems

@app.route('/api/document/<task_id>/progress', methods=['GET'])
def get_analysis_progress(task_id):
    """获取分析进度"""
    try:
        if task_id not in analysis_tasks:
            return jsonify({'error': '任务不存在'}), 404
        
        task = analysis_tasks[task_id]
        return jsonify({
            'task_id': task_id,
            'status': task.status,
            'progress': task.progress,
            'error': task.error
        })
        
    except Exception as e:
        return jsonify({'error': f'获取进度失败: {str(e)}'}), 500

@app.route('/api/document/<task_id>/result', methods=['GET'])
def get_analysis_result(task_id):
    """获取分析结果"""
    try:
        if task_id not in analysis_tasks:
            return jsonify({'error': '任务不存在'}), 404
        
        task = analysis_tasks[task_id]
        if task.status != 'completed':
            return jsonify({'error': '分析尚未完成'}), 400
        
        return jsonify({
            'task_id': task_id,
            'report_html': task.result['report_html'],
            'problems': task.result['problems'],
            'analysis_mode': task.result['analysis_mode'],
            'completed_at': task.result['completed_at']
        })
        
    except Exception as e:
        return jsonify({'error': f'获取结果失败: {str(e)}'}), 500

@app.route('/api/document/<task_id>/export', methods=['GET'])
def export_report(task_id):
    """导出报告文件"""
    try:
        if task_id not in analysis_tasks:
            return jsonify({'error': '任务不存在'}), 404
        
        task = analysis_tasks[task_id]
        if task.status != 'completed':
            return jsonify({'error': '分析尚未完成'}), 400
        
        # 生成导出文件名
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"citation_report_{task.result['analysis_mode']}_{timestamp}.html"
        
        # 创建完整的HTML文件
        html_content = f"""
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>文献引用合规性检查报告</title>
    <style>
        body {{ font-family: 'Microsoft YaHei', Arial, sans-serif; margin: 40px; line-height: 1.6; }}
        .report-header {{ text-align: center; margin-bottom: 30px; }}
        .report-meta {{ background: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px; }}
        h1 {{ color: #1890ff; }}
        h2 {{ color: #262626; background: #fafafa; padding: 8px 12px; border-radius: 4px; }}
        h3 {{ color: #595959; }}
        .context {{ background: #f0f9ff; border-left: 4px solid #1890ff; padding: 12px; margin: 8px 0; }}
        .analysis {{ background: #f6ffed; border-left: 4px solid #52c41a; padding: 12px; margin: 8px 0; }}
        ul li {{ margin: 4px 0; padding: 4px; background: #fff2f0; border-left: 3px solid #ff4d4f; }}
    </style>
</head>
<body>
    <div class="report-header">
        <h1>📚 文献引用合规性检查报告</h1>
    </div>
    <div class="report-meta">
        <p><strong>分析模式：</strong>{task.result['analysis_mode']}</p>
        <p><strong>生成时间：</strong>{task.result['completed_at']}</p>
        <p><strong>发现问题：</strong>{len(task.result['problems'])} 个</p>
    </div>
    {task.result['report_html']}
    <hr style="margin: 30px 0;">
    <p style="text-align: center; color: #999; font-size: 12px;">
        报告由 PaperCheck 文献引用合规性检查工具生成
    </p>
</body>
</html>
"""
        
        # 直接返回响应，不保存到文件
        from flask import Response
        return Response(
            html_content,
            mimetype='text/html',
            headers={
                'Content-Disposition': f'attachment; filename={filename}'
            }
        )
        
    except Exception as e:
        return jsonify({'error': f'导出失败: {str(e)}'}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """健康检查"""
    return jsonify({
        'status': 'ok',
        'message': '文献分析API服务正常',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    print("🚀 启动PaperCheck后端服务...")
    print("📍 API地址: http://localhost:5001")
    app.run(host='0.0.0.0', port=5001, debug=True, threaded=True)
