from src.models.base_model import BaseModel
from langchain_community.llms import Tongyi
import dashscope

class QwenModel(BaseModel):
    """通义千问模型实现"""
    
    def __init__(self, config):
        self.config = config
        self.model = None
        self.model_name = None
        self.initialize()
    
    def initialize(self):
        """初始化通义千问模型"""
        # 检查API密钥是否存在
        if not self.config.get("api_key") or self.config.get("api_key") == "your-api-key":
            print("警告：未设置有效的QWEN_API_KEY，将跳过AI相关性分析")
            self.model = None
        else:
            # 设置dashscope的API密钥和基础URL
            dashscope.api_key = self.config.get("api_key")
            if self.config.get("api_url"):
                dashscope.base_url = self.config.get("api_url")
            
            # 使用通义千问API
            self.model = Tongyi(
                model_name=self.config.get("model_name", "qwen-plus"),
                dashscope_api_key=self.config.get("api_key"),
                temperature=0
            )
            self.model_name = self.config.get("model_name", "qwen-plus")
    
    def analyze(self, prompt: str) -> str:
        """使用通义千问分析文本"""
        if not self.model:
            return "无法进行AI分析：未配置有效的API密钥"
        
        try:
            from dashscope import Generation
            response = Generation.call(
                model=self.model_name,
                prompt=prompt,
                max_tokens=500,
                temperature=0
            )
            if response.status_code == 200:
                return response.output.text
            else:
                return f"通义千问分析时出错：{response.message}"
        except Exception as e:
            return f"通义千问分析时出错：{str(e)}"