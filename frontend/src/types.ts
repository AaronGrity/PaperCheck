// 类型定义文件

export interface DocumentData {
  taskId: string;
  filename: string;
  htmlContent: string;
  paragraphs: ParagraphData[];
}

export interface ParagraphData {
  index: number;
  text: string;
  length: number;
  style?: Record<string, any>;
}

export interface Problem {
  id: number;
  type: 'missing_citation' | 'unused_reference' | 'irrelevant_citation';
  severity: 'error' | 'warning';
  citation?: string;
  reference?: string;
  description: string;
  analysis?: string;
  context?: string;
  position: Position;
  color: string;
}

export interface Position {
  paragraph_index: number;
  start_pos: number;
  end_pos: number;
  context?: any;
  in_references?: boolean;
}

export interface AnalysisProgress {
  processed: number;
  total: number;
  percentage: number;
  status: 'pending' | 'running' | 'completed' | 'error';
  error?: string;
}

export interface UploadResult {
  task_id: string;
  filename: string;
  message: string;
}

export interface PreviewData {
  task_id: string;
  html_content: string;
  paragraphs: ParagraphData[];
  total_paragraphs: number;
}

export interface ProblemsData {
  task_id: string;
  problems: Problem[];
  total_problems: number;
  analysis_mode: string;
}

export interface ReportData {
  task_id: string;
  report: string;
  analysis_mode: string;
  completed_at: string;
}
