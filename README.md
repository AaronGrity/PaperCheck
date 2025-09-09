# PaperCheck - 文献引用合规性检查工具

## 📖 项目简介

PaperCheck 是一个基于AI的学术论文引用合规性检查工具，能够：

- ✅ 检查文中引用是否在参考文献中存在
- ✅ 检查参考文献是否被正文引用  
- ✅ 使用AI分析引用与上下文的相关性
- ✅ 提供直观的Web界面和实时分析进度
- ✅ 支持Word文档格式，保留原文格式

## 🏗️ 项目架构

```
PaperCheck/
├── src/                    # 后端核心代码
│   ├── core/              # 核心分析逻辑（原有代码，未修改）
│   ├── config/            # 配置管理（原有代码，未修改）
│   ├── models/            # AI模型集成（原有代码，未修改）
│   ├── utils/             # 工具类
│   │   ├── document_parser.py     # 文档格式转换（新增）
│   │   ├── position_tracker.py    # 位置跟踪（新增）
│   │   └── cache_manager.py       # 缓存管理（原有）
│   ├── web_api.py         # Web API接口层（新增）
│   └── main.py            # 命令行入口（原有代码，未修改）
├── frontend/              # 前端界面（全新开发）
│   ├── src/
│   │   ├── components/    # React组件
│   │   ├── services/      # API服务
│   │   └── types.ts       # TypeScript类型定义
│   └── package.json
├── start_backend.py       # 后端启动脚本（新增）
└── requirements.txt       # Python依赖（更新）
```

## 🚀 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 1. 安装后端依赖

```bash
pip install -r requirements.txt
```

### 2. 配置API密钥

编辑 `src/config/config_full.json`、`src/config/config_quick.json`、`src/config/config_subjective.json` 文件，配置您的AI API密钥：

```json
{
  "model": "qwen",
  "model_name": "qwen-plus", 
  "api_key": "your-api-key-here",
  "api_url": "https://dashscope.aliyuncs.com/compatible-mode/v1",
  "analysis_mode": "full"
}
```

### 3. 启动后端服务

```bash
python start_backend.py
```

后端服务将在 `http://localhost:5001` 启动。

### 4. 安装前端依赖

```bash
cd frontend
npm install
```

### 5. 启动前端开发服务器

```bash
npm start
```

前端界面将在 `http://localhost:3000` 启动。

## 🎯 使用方法

### Web界面使用

1. **上传文档**：在左侧面板上传 `.docx` 格式的Word文档
2. **选择分析模式**：
   - **完整模式**：获取论文全文进行深度分析（推荐）
   - **快速模式**：仅使用标题和摘要分析
   - **主观模式**：完全依赖AI判断，不获取外部信息
3. **开始分析**：点击"开始分析"按钮，等待分析完成
4. **查看结果**：右侧面板显示问题列表，点击问题可在左侧文档中高亮显示

### 命令行使用（保持原有功能）

```bash
# 基本使用
python src/main.py document.docx

# 指定分析模式
python src/main.py document.docx full     # 完整模式
python src/main.py document.docx quick    # 快速模式  
python src/main.py document.docx subjective # 主观模式
```

## 📊 功能特性

### 问题检测类型

1. **缺失引用** (红色标记)
   - 文中引用未在参考文献中找到
   - 例如：文中有[15]但参考文献只有[1-14]

2. **未使用参考文献** (黄色标记)  
   - 参考文献未被正文引用
   - 例如：参考文献有[20]但正文中未出现

3. **不相关引用** (橙色标记)
   - AI分析发现引用与上下文内容不匹配
   - 基于论文标题、摘要或全文内容判断

### 界面特性

- 📄 **文档预览**：保留Word文档原有格式
- 🎯 **精确定位**：问题标记精确到字符位置
- 🔄 **实时进度**：显示分析进度和状态
- 📊 **分类展示**：按问题类型分组显示
- 🔗 **双向联动**：文档和问题列表互相关联

## ⚙️ API接口

### 主要接口

- `POST /api/upload` - 上传文档
- `GET /api/document/{id}/preview` - 获取文档预览
- `POST /api/document/{id}/analyze` - 开始分析
- `GET /api/document/{id}/progress` - 获取分析进度
- `GET /api/document/{id}/problems` - 获取问题列表
- `GET /api/document/{id}/report` - 获取完整报告
- `GET /api/health` - 健康检查

### 响应格式

所有API返回JSON格式，错误时包含 `error` 字段。

## 🔧 配置说明

### 分析模式配置

- `config_full.json` - 完整模式配置
- `config_quick.json` - 快速模式配置  
- `config_subjective.json` - 主观模式配置

### 支持的AI模型

- **通义千问 (Qwen)**：阿里云DashScope API
- **GPT**：OpenAI API或兼容接口

## 📝 开发说明

### 设计原则

1. **不修改原有代码**：所有新功能通过新增文件实现
2. **前后端分离**：清晰的API接口设计
3. **保持兼容性**：原有命令行功能完全保留
4. **代码解耦**：各模块职责清晰，易于维护

### 扩展开发

- 后端扩展：在 `src/web_api.py` 中添加新的API接口
- 前端扩展：在 `frontend/src/components/` 中添加新组件
- 新功能：通过新增工具类实现，不修改核心逻辑

## 🐛 故障排除

### 常见问题

1. **导入错误**
   ```bash
   pip install -r requirements.txt
   ```

2. **API连接失败**
   - 检查配置文件中的API密钥
   - 确认网络连接正常

3. **文档上传失败**
   - 确认文件格式为 `.docx`
   - 检查文件大小是否超过50MB

4. **前端无法连接后端**
   - 确认后端服务已启动（http://localhost:5001）
   - 检查防火墙设置

## 📄 许可证

本项目基于原有PaperCheck项目扩展开发，保持原有许可证。

## 🤝 贡献

欢迎提交Issue和Pull Request！

---

**注意**：首次使用需要配置有效的AI API密钥，分析功能依赖网络连接。
