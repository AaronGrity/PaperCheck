// 简化的API服务类
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5001/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000,
});

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorMessage = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(errorMessage);
  }
);

export interface UploadResult {
  task_id: string;
  filename: string;
  message: string;
}

export interface DocumentPreview {
  task_id: string;
  html_content: string;
  paragraphs: Array<{
    index: number;
    text: string;
    length: number;
  }>;
  total_paragraphs: number;
}

export interface AnalysisProgress {
  task_id: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  progress: {
    processed: number;
    total: number;
    percentage: number;
  };
  error?: string;
}

export interface Problem {
  id: number;
  type: string;
  citation?: string;
  description: string;
  color: string;
}

export interface AnalysisResult {
  task_id: string;
  report_html: string;
  problems: Problem[];
  analysis_mode: string;
  completed_at: string;
}

export class SimpleAnalysisService {
  
  async uploadDocument(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    
    return response.data;
  }
  
  async getDocumentPreview(taskId: string): Promise<DocumentPreview> {
    const response = await apiClient.get(`/document/${taskId}/preview`);
    return response.data;
  }
  
  async startAnalysis(taskId: string, analysisMode: string): Promise<void> {
    await apiClient.post(`/document/${taskId}/analyze`, {
      analysis_mode: analysisMode
    });
  }
  
  async getAnalysisProgress(taskId: string): Promise<AnalysisProgress> {
    const response = await apiClient.get(`/document/${taskId}/progress`);
    return response.data;
  }
  
  async getAnalysisResult(taskId: string): Promise<AnalysisResult> {
    const response = await apiClient.get(`/document/${taskId}/result`);
    return response.data;
  }
  
  async exportReport(taskId: string, format: string = 'html'): Promise<Blob> {
    const response = await apiClient.get(`/document/${taskId}/export?format=${format}`, {
      responseType: 'blob'
    });
    return response.data;
  }

  async healthCheck(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  }
}
