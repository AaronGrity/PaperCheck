import os
import hashlib
import json
import logging

logger = logging.getLogger(__name__)

class CacheManager:
    def __init__(self, cache_dir: str = "pdf_cache"):
        self.cache_dir = cache_dir
        if not os.path.exists(self.cache_dir):
            os.makedirs(self.cache_dir)
    
    def get_cache_path(self, key: str, extension: str = ".json") -> str:
        """获取缓存文件路径"""
        cache_key = hashlib.md5(key.encode('utf-8')).hexdigest()
        return os.path.join(self.cache_dir, f"{cache_key}{extension}")
    
    def get(self, key: str, extension: str = ".json"):
        """从缓存中获取数据"""
        cache_file = self.get_cache_path(key, extension)
        if os.path.exists(cache_file):
            try:
                logger.info(f"从缓存中读取: {cache_file}")
                if extension == ".json":
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        return json.load(f)
                else:
                    with open(cache_file, 'r', encoding='utf-8') as f:
                        return f.read()
            except Exception as e:
                logger.error(f"读取缓存文件时出错: {e}")
                return None
        return None
    
    def set(self, key: str, data, extension: str = ".json"):
        """将数据保存到缓存"""
        cache_file = self.get_cache_path(key, extension)
        try:
            if extension == ".json":
                with open(cache_file, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
            else:
                with open(cache_file, 'w', encoding='utf-8') as f:
                    f.write(data)
            logger.info(f"数据已缓存到: {cache_file}")
        except Exception as e:
            logger.error(f"保存缓存文件时出错: {e}")