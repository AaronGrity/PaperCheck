from abc import ABC, abstractmethod

class BaseModel(ABC):
    """模型抽象基类"""
    
    @abstractmethod
    def initialize(self):
        """初始化模型"""
        pass
    
    @abstractmethod
    def analyze(self, prompt: str) -> str:
        """分析文本"""
        pass