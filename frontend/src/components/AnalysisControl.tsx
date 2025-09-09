import React, { useState } from 'react';
import { Button, Select, Typography, Space, Progress, Alert, Card } from 'antd';
import { PlayCircleOutlined, LoadingOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { AnalysisProgress } from '../types';

const { Text, Title } = Typography;
const { Option } = Select;

interface AnalysisControlProps {
  onStartAnalysis: (analysisMode: string) => Promise<void>;
  isAnalyzing: boolean;
  analysisProgress: AnalysisProgress | null;
  disabled?: boolean;
}

const AnalysisControl: React.FC<AnalysisControlProps> = ({
  onStartAnalysis,
  isAnalyzing,
  analysisProgress,
  disabled = false
}) => {
  const [selectedMode, setSelectedMode] = useState<string>('full');
  const [starting, setStarting] = useState(false);

  const handleStartAnalysis = async () => {
    setStarting(true);
    try {
      await onStartAnalysis(selectedMode);
    } finally {
      setStarting(false);
    }
  };

  const analysisOptions = [
    {
      value: 'full',
      label: '完整模式',
      description: '获取论文全文进行深度分析，准确性最高但耗时较长'
    },
    {
      value: 'quick',
      label: '快速模式',
      description: '仅使用标题和摘要分析，速度快但准确性适中'
    },
    {
      value: 'subjective',
      label: '主观模式',
      description: '完全依赖AI判断，不获取外部信息，速度最快'
    }
  ];

  const getProgressStatus = () => {
    if (!analysisProgress) return 'normal';
    if (analysisProgress.status === 'completed') return 'success';
    if (analysisProgress.status === 'error') return 'exception';
    return 'active';
  };

  const getStatusIcon = () => {
    if (analysisProgress?.status === 'completed') {
      return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
    }
    if (isAnalyzing) {
      return <LoadingOutlined />;
    }
    return <PlayCircleOutlined />;
  };

  return (
    <Card size="small" style={{ marginBottom: '16px' }}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Title level={5} style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {getStatusIcon()}
            分析控制
          </Title>
        </div>

        {/* 分析模式选择 */}
        <div>
          <Text strong style={{ display: 'block', marginBottom: '8px' }}>
            分析模式：
          </Text>
          <Select
            value={selectedMode}
            onChange={setSelectedMode}
            style={{ width: '100%' }}
            disabled={isAnalyzing || disabled}
            size="large"
          >
            {analysisOptions.map(option => (
              <Option key={option.value} value={option.value}>
                <div>
                  <div style={{ fontWeight: 'bold' }}>{option.label}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {option.description}
                  </div>
                </div>
              </Option>
            ))}
          </Select>
        </div>

        {/* 当前选择的模式说明 */}
        {selectedMode && (
          <Alert
            message={analysisOptions.find(opt => opt.value === selectedMode)?.label}
            description={analysisOptions.find(opt => opt.value === selectedMode)?.description}
            type="info"
            showIcon
            style={{ fontSize: '12px' }}
          />
        )}

        {/* 开始分析按钮 */}
        <Button
          type="primary"
          size="large"
          icon={starting ? <LoadingOutlined /> : <PlayCircleOutlined />}
          onClick={handleStartAnalysis}
          disabled={disabled || isAnalyzing}
          loading={starting}
          style={{ width: '100%' }}
        >
          {starting ? '启动中...' : isAnalyzing ? '分析中...' : '开始分析'}
        </Button>

        {/* 进度显示 */}
        {analysisProgress && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <Text strong>分析进度</Text>
              <Text type="secondary">
                {analysisProgress.processed} / {analysisProgress.total}
              </Text>
            </div>
            
            <Progress
              percent={analysisProgress.percentage}
              status={getProgressStatus()}
              strokeColor={{
                '0%': '#108ee9',
                '100%': '#87d068',
              }}
            />
            
            <div style={{ marginTop: '8px' }}>
              {analysisProgress.status === 'running' && (
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  正在分析引用相关性，请耐心等待...
                </Text>
              )}
              {analysisProgress.status === 'completed' && (
                <Text type="success" style={{ fontSize: '12px' }}>
                  ✅ 分析完成！请查看右侧问题报告
                </Text>
              )}
              {analysisProgress.status === 'error' && (
                <Text type="danger" style={{ fontSize: '12px' }}>
                  ❌ 分析失败：{analysisProgress.error}
                </Text>
              )}
            </div>
          </div>
        )}

        {/* 提示信息 */}
        {!disabled && !isAnalyzing && (
          <Alert
            message="分析说明"
            description={
              <div style={{ fontSize: '12px' }}>
                • 分析过程需要调用AI接口，请确保网络连接正常<br/>
                • 完整模式可能需要几分钟时间，请耐心等待<br/>
                • 分析过程中请勿关闭页面
              </div>
            }
            type="warning"
            showIcon
            style={{ fontSize: '12px' }}
          />
        )}
      </Space>
    </Card>
  );
};

export default AnalysisControl;
