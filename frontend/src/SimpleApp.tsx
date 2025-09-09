import React, { useState, useCallback, useRef } from 'react';
import { Layout, Typography, message, Upload, Button, Select, Progress, Card, List, Badge } from 'antd';
import { UploadOutlined, PlayCircleOutlined, FileTextOutlined, DownloadOutlined } from '@ant-design/icons';
import { SimpleAnalysisService, UploadResult, DocumentPreview, AnalysisProgress, AnalysisResult, Problem } from './services/SimpleAnalysisService';
import './SimpleApp.css';

const { Header, Content } = Layout;
const { Title, Text } = Typography;
const { Option } = Select;

const SimpleApp: React.FC = () => {
  const [taskId, setTaskId] = useState<string | null>(null);
  const [filename, setFilename] = useState<string>('');
  const [documentPreview, setDocumentPreview] = useState<DocumentPreview | null>(null);
  const [analysisMode, setAnalysisMode] = useState<string>('subjective');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  
  const documentRef = useRef<HTMLDivElement>(null);
  const analysisService = new SimpleAnalysisService();

  // 文档上传
  const handleUpload = useCallback(async (file: File) => {
    try {
      message.loading('正在上传文档...', 0);
      
      const uploadResult: UploadResult = await analysisService.uploadDocument(file);
      setTaskId(uploadResult.task_id);
      setFilename(uploadResult.filename);
      
      // 获取文档预览
      const preview = await analysisService.getDocumentPreview(uploadResult.task_id);
      setDocumentPreview(preview);
      
      message.destroy();
      message.success('文档上传成功！');
      
    } catch (error) {
      message.destroy();
      message.error(`上传失败: ${error}`);
    }
  }, []);

  // 开始分析
  const handleStartAnalysis = useCallback(async () => {
    if (!taskId) return;

    try {
      setIsAnalyzing(true);
      setAnalysisProgress({ 
        task_id: taskId, 
        status: 'running', 
        progress: { processed: 0, total: 0, percentage: 0 }
      });
      
      await analysisService.startAnalysis(taskId, analysisMode);
      message.success('分析已开始');
      
      // 轮询进度
      const pollInterval = setInterval(async () => {
        try {
          const progress = await analysisService.getAnalysisProgress(taskId);
          setAnalysisProgress(progress);
          
          if (progress.status === 'completed') {
            clearInterval(pollInterval);
            
            // 等待一秒确保后端完全处理完成
            setTimeout(async () => {
              try {
                const result = await analysisService.getAnalysisResult(taskId);
                setAnalysisResult(result);
                setIsAnalyzing(false);
                message.success('分析完成！');
              } catch (error) {
                console.error('获取分析结果失败:', error);
                message.error('获取分析结果失败，请稍后重试');
                setIsAnalyzing(false);
              }
            }, 1000);
            
          } else if (progress.status === 'error') {
            clearInterval(pollInterval);
            setIsAnalyzing(false);
            message.error(`分析失败: ${progress.error}`);
          }
        } catch (error) {
          console.error('获取进度失败:', error);
        }
      }, 2000);
      
    } catch (error) {
      setIsAnalyzing(false);
      message.error(`启动分析失败: ${error}`);
    }
  }, [taskId, analysisMode]);

  // 导出报告
  const handleExportReport = useCallback(async () => {
    if (!taskId || !analysisResult) {
      message.error('没有可导出的报告');
      return;
    }

    try {
      message.loading('正在准备导出文件...', 0);
      
      const blob = await analysisService.exportReport(taskId);
      
      // 创建下载链接
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // 生成文件名
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      link.download = `citation_report_${analysisResult.analysis_mode}_${timestamp}.html`;
      
      // 触发下载
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      message.destroy();
      message.success('报告导出成功！');
      
    } catch (error) {
      message.destroy();
      message.error(`导出失败: ${error}`);
    }
  }, [taskId, analysisResult]);

  // 处理问题点击 - 基于原文定位
  const handleProblemClick = useCallback((problem: Problem) => {
    console.log('SimpleApp - 问题点击，problem:', problem);
    setSelectedProblemId(problem.id);
    
    // 滚动到左侧文档中的问题标记
    if (documentRef.current && problem.citation) {
      // 查找带有问题标记的元素
      const problemMarker = documentRef.current.querySelector(`[data-problem-id="${problem.id}"]`);
      console.log('SimpleApp - 查找问题标记:', problemMarker);
      if (problemMarker) {
        // 滚动到问题标记位置
        problemMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
        // 高亮效果
        const originalStyle = problemMarker.getAttribute('style') || '';
        problemMarker.setAttribute('style', originalStyle + '; box-shadow: 0 0 10px rgba(24, 144, 255, 0.8); transform: scale(1.1);');
        
        setTimeout(() => {
          problemMarker.setAttribute('style', originalStyle);
        }, 2000);
      }
    }
    
    // 滚动到右侧报告中的问题位置
    const reportElement = document.querySelector('.full-report');
    if (reportElement) {
      const reportProblemMarker = reportElement.querySelector(`[data-problem-id="${problem.id}"]`);
      if (reportProblemMarker) {
        reportProblemMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // 高亮效果
        const originalStyle = reportProblemMarker.getAttribute('style') || '';
        reportProblemMarker.setAttribute('style', originalStyle + '; box-shadow: 0 0 10px rgba(24, 144, 255, 0.8); transform: scale(1.1);');
        
        setTimeout(() => {
          reportProblemMarker.setAttribute('style', originalStyle);
        }, 2000);
      }
    }
  }, []);

  // 在文档中添加问题标记
  const addProblemMarkersToDocument = (htmlContent: string, problems: Problem[]): string => {
    if (!problems.length) return htmlContent;
    
    let modifiedHtml = htmlContent;
    
    // 按引用编号分组问题
    const problemsByCitation: { [key: string]: Problem[] } = {};
    problems.forEach(problem => {
      if (problem.citation) {
        if (!problemsByCitation[problem.citation]) {
          problemsByCitation[problem.citation] = [];
        }
        problemsByCitation[problem.citation].push(problem);
      }
    });
    
    // 为每个有问题的引用添加标记
    Object.entries(problemsByCitation).forEach(([citation, citationProblems]) => {
      // 创建问题标记HTML
      const markers = citationProblems.map(p => 
        `<span class="problem-marker" data-problem-id="${p.id}" style="background-color: ${p.color}; color: white; padding: 1px 4px; border-radius: 50%; font-size: 10px; margin-left: 2px; cursor: pointer;" title="${p.description}">●${p.id}</span>`
      ).join('');
      
      // 1. 首先尝试精确匹配单个引用
      const exactPattern = new RegExp(`(\\${citation})(?![\\d\\-\\]])`, 'g');
      if (exactPattern.test(modifiedHtml)) {
        modifiedHtml = modifiedHtml.replace(exactPattern, `$1${markers}`);
        return;
      }
      
      // 2. 查找包含该引用的范围引用
      const citationNum = parseInt(citation.match(/\[(\d+)\]/)?.[1] || '0');
      if (citationNum > 0) {
        const rangePattern = /\[(\d+)-(\d+)\]/g;
        modifiedHtml = modifiedHtml.replace(rangePattern, (match, start, end) => {
          const startNum = parseInt(start);
          const endNum = parseInt(end);
          if (citationNum >= startNum && citationNum <= endNum) {
            // 在范围引用后添加标记
            return match + markers;
          }
          return match;
        });
      }
    });
    
    return modifiedHtml;
  };

  // 在完整报告中添加问题标记
  const addProblemMarkersToReport = (htmlContent: string, problems: Problem[]): string => {
    if (!problems.length) return htmlContent;
    
    let modifiedHtml = htmlContent;
    
    // 为每个问题在报告中添加标记
    problems.forEach(problem => {
      if (problem.citation) {
        // 创建问题标记（不包含问题ID数字，只保留标记点）
        const marker = `<span class="report-problem-marker" data-problem-id="${problem.id}" style="background-color: ${problem.color}; color: white; padding: 1px 4px; border-radius: 50%; font-size: 10px; margin-left: 2px; cursor: pointer;" title="${problem.description}">●</span>`;
        
        // 替换引用文本，添加标记
        const exactPattern = new RegExp(`(\\${problem.citation})(?![\\d\\-\\]])`, 'g');
        // 只在H3标题中替换引用文本，添加标记
        const h3Pattern = new RegExp(`<h3[^>]*>(.*?)\\${problem.citation}(.*?)</h3>`, 'g');
        modifiedHtml = modifiedHtml.replace(h3Pattern, (match, prefix, suffix) => {
          return `<h3>${prefix}\\${problem.citation}${suffix}${marker}</h3>`;
        });
      }
    });
    
    return modifiedHtml;
  };

  return (
    <Layout className="simple-app">
      <Header className="app-header">
        <Title level={3} style={{ margin: '16px 0', color: '#1890ff' }}>
          📚 TaShan PaperCheck - 文献引用合规性检查
        </Title>
      </Header>
      
      <Content className="app-content">
        <div className="main-layout">
          
          {/* 左侧：文档上传和预览 */}
          <div className="left-panel">
            
            {/* 上传区域 */}
            <Card size="small" title="📄 文档上传" className="upload-card">
              <Upload
                accept=".docx"
                showUploadList={false}
                beforeUpload={(file) => {
                  handleUpload(file);
                  return false;
                }}
              >
                <Button icon={<UploadOutlined />} size="large" block>
                  选择Word文档 (.docx)
                </Button>
              </Upload>
              {filename && (
                <Text type="secondary" style={{ marginTop: '8px', display: 'block' }}>
                  已上传: {filename}
                </Text>
              )}
            </Card>

            {/* 文档预览 */}
            {documentPreview && (
              <Card size="small" title="📖 文档预览" className="preview-card">
                <div 
                  ref={documentRef}
                  className="document-content"
                  dangerouslySetInnerHTML={{ 
                    __html: analysisResult 
                      ? addProblemMarkersToDocument(documentPreview.html_content, analysisResult.problems)
                      : documentPreview.html_content 
                  }}
                  onClick={(e) => {
                    // 处理问题标记点击
                    const target = e.target as HTMLElement;
                    console.log('SimpleApp - 文档点击事件，目标:', target);
                    if (target.classList.contains('problem-marker')) {
                      const problemId = parseInt(target.getAttribute('data-problem-id') || '0');
                      console.log('SimpleApp - 点击了问题标记，problemId:', problemId);
                      if (problemId) {
                        // 选中对应的问题
                        setSelectedProblemId(problemId);
                        
                        // 滚动到右侧报告中的问题位置
                        const reportElement = document.querySelector('.full-report');
                        if (reportElement) {
                          const reportProblemMarker = reportElement.querySelector(`[data-problem-id="${problemId}"]`);
                          if (reportProblemMarker) {
                            reportProblemMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            // 高亮效果
                            const originalStyle = reportProblemMarker.getAttribute('style') || '';
                            reportProblemMarker.setAttribute('style', originalStyle + '; box-shadow: 0 0 10px rgba(24, 144, 255, 0.8); transform: scale(1.1);');
                            
                            setTimeout(() => {
                              reportProblemMarker.setAttribute('style', originalStyle);
                            }, 2000);
                          }
                        }
                      }
                    }
                  }}
                />
              </Card>
            )}
          </div>

          {/* 右侧：分析控制和结果 */}
          <div className="right-panel" style={{ overflow: 'auto' }}>
            
            {/* 分析控制 */}
            <Card size="small" title="⚙️ 分析设置" className="control-card">
              <div style={{ marginBottom: '16px' }}>
                <Text strong>分析模式：</Text>
                <Select
                  value={analysisMode}
                  onChange={setAnalysisMode}
                  style={{ width: '100%', marginTop: '8px' }}
                  disabled={isAnalyzing}
                >
                  <Option value="full">完整模式 - 获取论文全文分析</Option>
                  <Option value="quick">快速模式 - 仅使用标题摘要</Option>
                  <Option value="subjective">主观模式 - 纯AI判断</Option>
                </Select>
              </div>
              
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleStartAnalysis}
                disabled={!taskId || isAnalyzing}
                loading={isAnalyzing}
                size="large"
                block
              >
                {isAnalyzing ? '分析中...' : '开始分析'}
              </Button>
              
              {analysisProgress && (
                <div style={{ marginTop: '16px' }}>
                  <Text strong>分析进度：</Text>
                  <Progress
                    percent={analysisProgress.progress.percentage}
                    status={analysisProgress.status === 'completed' ? 'success' : 'active'}
                    style={{ marginTop: '8px' }}
                  />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {analysisProgress.progress.processed} / {analysisProgress.progress.total}
                  </Text>
                </div>
              )}
            </Card>

            {/* 问题列表和完整报告 */}
            {analysisResult && (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                {/* 问题列表 */}
                <Card 
                  size="small" 
                  title="📋 问题列表" 
                  className="problems-card"
                  style={{ marginBottom: '16px', flexShrink: 0 }}
                >
                  <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                    <List
                      dataSource={analysisResult.problems}
                      renderItem={(problem) => {
                        const isSelected = selectedProblemId === problem.id;
                        return (
                          <List.Item
                            key={problem.id}
                            style={{
                              padding: '12px',
                              border: `1px solid ${isSelected ? '#1890ff' : '#f0f0f0'}`,
                              borderRadius: '6px',
                              marginBottom: '8px',
                              cursor: 'pointer',
                              backgroundColor: isSelected ? '#f0f9ff' : '#fff',
                              transition: 'all 0.2s ease'
                            }}
                            onClick={() => handleProblemClick(problem)}
                          >
                            <div style={{ width: '100%' }}>
                              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                                <Badge
                                  count={problem.id}
                                  style={{ 
                                    backgroundColor: problem.color,
                                    marginRight: '8px',
                                    minWidth: '20px',
                                    height: '20px',
                                    lineHeight: '20px',
                                    fontSize: '12px'
                                  }}
                                />
                                <Text strong>{problem.description}</Text>
                              </div>
                              {problem.citation && (
                                <Text type="secondary" style={{ fontSize: '12px' }}>
                                  引用: {problem.citation}
                                </Text>
                              )}
                            </div>
                          </List.Item>
                        );
                      }}
                    />
                  </div>
                </Card>
                
                {/* 完整HTML报告 */}
                <Card 
                  size="small" 
                  title={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>📊 完整分析报告</span>
                      <Button 
                        type="primary" 
                        icon={<DownloadOutlined />} 
                        size="small"
                        onClick={handleExportReport}
                        disabled={!analysisResult}
                      >
                        导出报告
                      </Button>
                    </div>
                  }
                  className="result-card"
      
                  style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
                >
                  {analysisResult.problems.length > 0 && (
                    <div style={{ marginBottom: '16px', padding: '8px', background: '#fff3cd', borderRadius: '4px' }}>
                      <Text strong style={{ color: '#d48806' }}>
                        🔍 发现 {analysisResult.problems.length} 个问题，已在左侧文档中标记序号
                      </Text>
                    </div>
                  )}
                  
                  <div 
                    className="full-report"
                    dangerouslySetInnerHTML={{ __html: addProblemMarkersToReport(analysisResult.report_html, analysisResult.problems) }}
                    style={{ 
                      flex: 1,
                      overflow: 'auto',
                      fontSize: '14px',
                      lineHeight: '1.6'
                    }}
                    onClick={(e) => {
                      // 处理报告中的引用点击
                      const target = e.target as HTMLElement;
                      // 处理H3标题点击（原有逻辑）
                      if (target.tagName === 'H3' && target.textContent) {
                        const match = target.textContent.match(/引用 \[(\d+)\]/);
                        if (match) {
                          const citation = `[${match[1]}]`;
                          const problem = analysisResult.problems.find(p => p.citation === citation);
                          if (problem) {
                            handleProblemClick(problem);
                          }
                        }
                      }
                      // 处理问题标记点击（新增逻辑）
                      else if (target.classList.contains('report-problem-marker')) {
                        const problemId = parseInt(target.getAttribute('data-problem-id') || '0');
                        if (problemId) {
                          const problem = analysisResult.problems.find(p => p.id === problemId);
                          if (problem) {
                            setSelectedProblemId(problemId);
                            // 滚动到左侧文档中的对应位置
                            if (documentRef.current) {
                              const problemMarker = documentRef.current.querySelector(`[data-problem-id="${problemId}"]`);
                              if (problemMarker) {
                                problemMarker.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                // 高亮效果
                                const originalStyle = problemMarker.getAttribute('style') || '';
                                problemMarker.setAttribute('style', originalStyle + '; box-shadow: 0 0 10px rgba(24, 144, 255, 0.8); transform: scale(1.1);');
                                setTimeout(() => {
                                  problemMarker.setAttribute('style', originalStyle);
                                }, 2000);
                              }
                            }
                          }
                        }
                      }
                    }}
                  />
                </Card>
              </div>
            )}
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default SimpleApp;
