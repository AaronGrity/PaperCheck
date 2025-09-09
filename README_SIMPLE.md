# PaperCheck 简化版

## 🎯 设计理念

**专注核心功能，保持代码干净**

- ✅ **保留原有分析逻辑** - 不修改`CitationChecker`核心代码
- ✅ **简化前后端交互** - 直接使用HTML报告
- ✅ **专注用户体验** - 文档预览 + 问题定位

## 📁 简化版文件结构

```
PaperCheck-main/
├── src/
│   ├── web_api_simple.py          # 简化的Web API (258行)
│   ├── utils/
│   │   ├── simple_position_tracker.py  # 简化位置跟踪 (76行)
│   │   └── document_parser.py     # 保留原有文档解析
│   └── [原有核心代码保持不变]
├── frontend/src/
│   ├── SimpleApp.tsx              # 简化主应用 (单文件组件)
│   ├── SimpleApp.css              # 简化样式
│   ├── services/SimpleAnalysisService.ts  # 简化API服务
│   └── index_simple.tsx           # 简化入口
├── start_simple.py                # 简化启动脚本
└── README_SIMPLE.md              # 本文件
```

## 🚀 快速启动

### 后端
```bash
python start_simple.py
```

### 前端
```bash
cd frontend
# 修改 package.json 中的启动脚本指向 index_simple.tsx
npm start
```

## 📊 核心功能

### 1. 文档上传与预览
- 上传`.docx`文件
- 保留Word格式的HTML预览
- 实时显示文档内容

### 2. 智能分析
- **完整模式**: 获取论文全文分析
- **快速模式**: 仅使用标题摘要
- **主观模式**: 纯AI判断
- 实时进度显示

### 3. 问题定位与展示
- 自动提取问题列表
- 点击问题跳转到文档位置
- 不同颜色标识问题类型
- 完整分析报告展示

## 🔧 API接口

### 核心接口（5个）
```
POST /api/upload              # 上传文档
GET  /api/document/{id}/preview   # 文档预览
POST /api/document/{id}/analyze   # 开始分析
GET  /api/document/{id}/progress  # 分析进度
GET  /api/document/{id}/result    # 分析结果
```

## 💡 代码亮点

### 后端简化
- **单一职责**: 每个接口只做一件事
- **直接复用**: 完全使用原有`CitationChecker`
- **简化提取**: 用正则表达式从HTML报告提取问题
- **去除冗余**: 删除复杂的问题分析逻辑

### 前端简化
- **单文件组件**: 主要逻辑集中在`SimpleApp.tsx`
- **直接渲染**: 直接渲染HTML报告内容
- **简单定位**: 用DOM API查找和定位引用
- **最小依赖**: 只使用必要的Ant Design组件

## 📈 性能对比

| 功能 | 原版本 | 简化版 | 改进 |
|------|--------|--------|------|
| 后端代码 | 377行 | 258行 | ↓31% |
| API接口 | 8个 | 5个 | ↓37% |
| 前端组件 | 4个文件 | 1个文件 | ↓75% |
| 核心逻辑 | 复杂解析 | 直接复用 | 保持不变 |

## 🎯 核心原则

1. **不重复造轮子** - 直接使用已有的分析报告
2. **专注用户价值** - 文档预览 + 问题定位
3. **保持代码整洁** - 删除不必要的抽象层
4. **维护原有质量** - 分析准确性完全不变

## 🔄 升级路径

如需要更多功能，可以：
1. 在简化版基础上逐步添加
2. 回到完整版本继续开发
3. 两个版本并行维护

---

**简化版本专注核心价值，代码更清晰，维护更容易！** ✨
