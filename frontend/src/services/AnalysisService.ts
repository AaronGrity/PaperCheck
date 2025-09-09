// API服务类 - 与后端API通信

import axios from 'axios';
import { UploadResult, PreviewData, AnalysisProgress, ProblemsData, ReportData } from '../types';

const API_BASE_URL = 'http://localhost:5001/api';

// 创建axios实例
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 300000, // 5分钟超时，因为分析可能需要较长时间
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
apiClient.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
apiClient.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(`API Error: ${error.response?.status} ${error.config?.url}`, error.response?.data);
    
    // 统一错误处理
    const errorMessage = error.response?.data?.error || error.message || '请求失败';
    return Promise.reject(errorMessage);
  }
);

export class AnalysisService {
  
  /**
   * 上传文档
   */
  async uploadDocument(file: File): Promise<UploadResult> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  }
  
  /**
   * 获取文档预览
   */
  async getDocumentPreview(taskId: string): Promise<PreviewData> {
    const response = await apiClient.get(`/document/${taskId}/preview`);
    return response.data;
  }
  
  /**
   * 开始分析
   */
  async startAnalysis(taskId: string, analysisMode: string): Promise<void> {
    await apiClient.post(`/document/${taskId}/analyze`, {
      analysis_mode: analysisMode
    });
  }
  
  /**
   * 获取分析进度
   */
  async getAnalysisProgress(taskId: string): Promise<AnalysisProgress> {
    const response = await apiClient.get(`/document/${taskId}/progress`);
    return response.data;
  }
  
  /**
   * 获取问题列表
   */
  async getProblems(taskId: string): Promise<ProblemsData> {
    const response = await apiClient.get(`/document/${taskId}/problems`);
    return response.data;
  }
  
  /**
   * 获取完整报告
   */
  async getFullReport(taskId: string): Promise<ReportData> {
    const response = await apiClient.get(`/document/${taskId}/report`);
    return response.data;
  }
  
  /**
   * 健康检查
   */
  async healthCheck(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  }
  
  /**
   * 导出PDF格式报告
   */
  async exportReportPDF(taskId: string): Promise<Blob> {
    const response = await apiClient.get(`/document/${taskId}/export/pdf`, {
      responseType: 'blob'
    });
    return response.data;
  }
  
  /**
   * 导出Word格式报告
   */
  async exportReportWord(taskId: string): Promise<Blob> {
    const response = await apiClient.get(`/document/${taskId}/export/word`, {
      responseType: 'blob'
    });
    return response.data;
  }
}
