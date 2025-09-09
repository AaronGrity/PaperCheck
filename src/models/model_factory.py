from src.models.gpt_model import GPTModel
from src.models.qwen_model import QwenModel

class ModelFactory:
    """模型工厂类"""
    
    @staticmethod
    def create_model(model_type: str, config):
        """创建模型实例"""
        if model_type == "gpt":
            return GPTModel(config)
        elif model_type == "qwen":
            return QwenModel(config)
        else:
            raise ValueError(f"不支持的模型类型: {model_type}")