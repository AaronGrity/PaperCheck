from src.models.base_model import BaseModel
from langchain_openai import ChatOpenAI
from langchain.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser

class GPTModel(BaseModel):
    """GPT模型实现"""
    
    def __init__(self, config):
        self.config = config
        self.model = None
        self.initialize()
    
    def initialize(self):
        """初始化GPT模型"""
        # 检查API密钥是否存在
        if not self.config.get("api_key") or self.config.get("api_key") == "your-api-key":
            print("警告：未设置有效的GPT_API_KEY，将跳过AI相关性分析")
            self.model = None
        else:
            # 使用自定义API端点和模型
            self.model = ChatOpenAI(
                model=self.config.get("model_name", "gpt-5-mini"),
                openai_api_key=self.config.get("api_key"),
                openai_api_base=self.config.get("api_url", "https://api.gptsapi.net/v1"),
                temperature=0
            )
    
    def analyze(self, prompt: str) -> str:
        """使用GPT分析文本"""
        if not self.model:
            return "无法进行AI分析：未配置有效的API密钥"
        
        try:
            prompt_template = PromptTemplate.from_template("{prompt_text}")
            chain = prompt_template | self.model | StrOutputParser()
            response = chain.invoke({"prompt_text": prompt})
            return response
        except Exception as e:
            return f"GPT分析时出错：{str(e)}"