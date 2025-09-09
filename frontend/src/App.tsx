import React, { useState, useCallback, useRef } from 'react';
import { Layout, Typography, message } from 'antd';
import DocumentUpload from './components/DocumentUpload';
import DocumentPreview from './components/DocumentPreview';
import AnalysisControl from './components/AnalysisControl';
import ProblemsPanel from './components/ProblemsPanel';
import { AnalysisService } from './services/AnalysisService';
import { DocumentData, Problem, AnalysisProgress } from './types';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const App: React.FC = () => {
  const [documentData, setDocumentData] = useState<DocumentData | null>(null);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [analysisProgress, setAnalysisProgress] = useState<AnalysisProgress | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedProblemId, setSelectedProblemId] = useState<number | null>(null);
  
  const documentPreviewRef = useRef<any>(null);
  const analysisService = new AnalysisService();

  // 处理文档上传
  const handleDocumentUpload = useCallback(async (file: File) => {
    try {
      message.loading('正在上传文档...', 0);
      const uploadResult = await analysisService.uploadDocument(file);
      
      // 获取文档预览
      const previewData = await analysisService.getDocumentPreview(uploadResult.task_id);
      
      setDocumentData({
        taskId: uploadResult.task_id,
        filename: uploadResult.filename,
        htmlContent: previewData.html_content,
        paragraphs: previewData.paragraphs
      });
      
      message.destroy();
      message.success('文档上传成功！');
    } catch (error) {
      message.destroy();
      message.error(`上传失败: ${error}`);
    }
  }, []);

  // 开始分析
  const handleStartAnalysis = useCallback(async (analysisMode: string) => {
    if (!documentData) {
      message.error('请先上传文档');
      return;
    }

    try {
      setIsAnalyzing(true);
      setAnalysisProgress({ processed: 0, total: 0, percentage: 0, status: 'running' });
      
      // 启动分析
      await analysisService.startAnalysis(documentData.taskId, analysisMode);
      message.success('分析已开始');
      
      // 轮询获取进度
      let pollCount = 0;
      const maxPollCount = 300; // 最多轮询10分钟 (300 * 2秒)
      
      const progressInterval = setInterval(async () => {
        pollCount++;
        
        // 超时检查
        if (pollCount >= maxPollCount) {
          clearInterval(progressInterval);
          setIsAnalyzing(false);
          message.error('分析超时，请重试或联系管理员');
          return;
        }
        
        try {
          const progress = await analysisService.getAnalysisProgress(documentData.taskId);
          setAnalysisProgress(progress);
          
          if (progress.status === 'completed') {
            clearInterval(progressInterval);
            
            // 获取问题列表
            const problemsData = await analysisService.getProblems(documentData.taskId);
            setProblems(problemsData.problems);
            
            setIsAnalyzing(false);
            message.success('分析完成！');
          } else if (progress.status === 'error') {
            clearInterval(progressInterval);
            setIsAnalyzing(false);
            message.error(`分析失败: ${progress.error}`);
          }
        } catch (error) {
          console.error('获取进度失败:', error);
          // 如果连续多次获取进度失败，停止轮询
          if (pollCount % 5 === 0) { // 每10秒检查一次
            message.warning('网络连接不稳定，请检查网络或刷新页面重试');
          }
        }
      }, 2000);
      
    } catch (error) {
      setIsAnalyzing(false);
      message.error(`启动分析失败: ${error}`);
    }
  }, [documentData]);

  // 处理问题点击
  const handleProblemClick = useCallback((problem: Problem) => {
    console.log('问题点击，problem:', problem);
    setSelectedProblemId(problem.id);
    
    // 滚动到对应位置
    if (documentPreviewRef.current) {
      documentPreviewRef.current.scrollToProblem(problem);
    }
  }, []);

  // 处理文档中问题标记点击
  const handleProblemMarkerClick = useCallback((problemId: number) => {
    console.log('文档中标记点击，problemId:', problemId);
    setSelectedProblemId(problemId);
  }, []);

  return (
    <Layout className="app-container">
      <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
        <Title level={3} style={{ margin: '16px 0', color: '#1890ff' }}>
          📚 PaperCheck - 文献引用合规性检查
        </Title>
      </Header>
      
      <Content className="main-content">
        {/* 左侧面板 - 文档上传和预览 */}
        <div className="left-panel">
          <div className="upload-area">
            <DocumentUpload 
              onUpload={handleDocumentUpload}
              disabled={isAnalyzing}
            />
          </div>
          
          <div className="document-preview">
            <DocumentPreview
              ref={documentPreviewRef}
              documentData={documentData}
              problems={problems}
              selectedProblemId={selectedProblemId}
              onProblemMarkerClick={handleProblemMarkerClick}
            />
          </div>
        </div>
        
        {/* 右侧面板 - 分析控制和结果 */}
        <div className="right-panel">
          <div className="control-panel">
            <AnalysisControl
              onStartAnalysis={handleStartAnalysis}
              isAnalyzing={isAnalyzing}
              analysisProgress={analysisProgress}
              disabled={!documentData}
            />
          </div>
          
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <ProblemsPanel
              problems={problems}
              selectedProblemId={selectedProblemId}
              onProblemClick={handleProblemClick}
              isAnalyzing={isAnalyzing}
              documentData={documentData}
            />
          </div>
        </div>
      </Content>
    </Layout>
  );
};

export default App;
