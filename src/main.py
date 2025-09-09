"""
引文合规检查工具主程序
"""
import sys
import os
import json

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from core.citation_checker import CitationChecker
from config.config_manager import ConfigManager

def main():
    # 从命令行参数获取文件路径，如果没有提供则使用默认路径
    doc_path = sys.argv[1] if len(sys.argv) > 1 else "../引文错版_为合规测试_基于智能感知的人体活动识别技术-智能感知工程-周凯月.docx"
    
    # 检查是否提供了分析模式参数
    analysis_mode = None
    if len(sys.argv) > 2:
        # 如果第二个参数是分析模式（full/quick/subjective）
        if sys.argv[2] in ["full", "quick", "subjective"]:
            analysis_mode = sys.argv[2]
            # 根据分析模式选择配置文件
            if analysis_mode == "subjective":
                config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "config_subjective.json")
            elif analysis_mode == "quick":
                config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "config_quick.json")
            else:
                config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "config.json")
        else:
            # 否则认为是配置文件路径
            config_path = sys.argv[2]
    else:
        # 使用相对于src目录的配置文件路径
        config_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "config", "config.json")
    
    print(f"当前工作目录: {os.getcwd()}")
    print(f"配置文件路径: {config_path}")
    print(f"配置文件是否存在: {os.path.exists(config_path)}")
    
    # 加载配置
    config_manager = ConfigManager(config_path)
    
    # 打印配置内容用于调试
    print(f"加载的配置: {config_manager.get_config()}")
    
    # 如果指定了分析模式，则更新配置
    if analysis_mode:
        config_manager.set("analysis_mode", analysis_mode)
    
    checker = CitationChecker(doc_path, config_path)
    report = checker.generate_report()
    
    # 根据分析模式确定输出文件名
    mode_suffix = config_manager.get("analysis_mode", "full")
    # 确保文件名与服务器端代码匹配
    if mode_suffix == "subjective":
        output_filename = "./citation_compliance_report_subjective.md"
    elif mode_suffix == "quick":
        output_filename = "./citation_compliance_report_quick.md"
    elif mode_suffix == "full":
        output_filename = "./citation_compliance_report_full.md"
    else:
        output_filename = f"./citation_compliance_report_{mode_suffix}.md"
    
    # 将报告保存到文件
    with open(output_filename, "w", encoding="utf-8") as f:
        f.write(report)
    
    print(f"引用合规性检查完成，报告已保存到 {output_filename}")

if __name__ == "__main__":
    main()