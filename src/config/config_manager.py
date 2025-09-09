import json

class ConfigManager:
    def __init__(self, config_path: str = "config.json"):
        self.config_path = config_path
        self.config = self._load_config()
    
    def _load_config(self):
        """加载配置文件"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"配置文件 {self.config_path} 未找到，使用默认配置")
            return self._get_default_config()
        except json.JSONDecodeError:
            print(f"配置文件 {self.config_path} 格式错误，使用默认配置")
            return self._get_default_config()
    
    def _get_default_config(self):
        """获取默认配置"""
        return {
            "model": "qwen",
            "model_name": "qwen-plus",
            "api_key": "your-api-key",
            "api_url": "https://www.dmxapi.cn/",
            "semantic_scholar_api_key": "",
            "crossref_api_key": "",
            "download_timeout": 60,
            "max_retries": 3,
            "retry_delay_min": 4,
            "retry_delay_max": 10,
            "analysis_mode": "full"
        }
    
    def get_config(self):
        """获取配置"""
        return self.config
    
    def get(self, key, default=None):
        """获取配置项"""
        return self.config.get(key, default)
    
    def set(self, key, value):
        """设置配置项"""
        self.config[key] = value
        self.save()
    
    def save(self):
        """保存配置到文件"""
        try:
            with open(self.config_path, 'w', encoding='utf-8') as f:
                json.dump(self.config, f, ensure_ascii=False, indent=2)
        except Exception as e:
            print(f"保存配置文件时出错: {e}")