import React, { useState, useMemo } from 'react';
import { Typography, List, Badge, Empty, Card, Tabs, Space, Tag, Tooltip, Button, Dropdown, message } from 'antd';
import type { TabsProps } from 'antd';
import { 
  ExclamationCircleOutlined, 
  WarningOutlined, 
  InfoCircleOutlined,
  FilterOutlined,
  EyeOutlined,
  DownloadOutlined
} from '@ant-design/icons';
import { Problem, DocumentData } from '../types';
import { AnalysisService } from '../services/AnalysisService';

const { Text, Title, Paragraph } = Typography;

interface ProblemsPanelProps {
  problems: Problem[];
  selectedProblemId: number | null;
  onProblemClick: (problem: Problem) => void;
  isAnalyzing: boolean;
  documentData: DocumentData | null;
}

const ProblemsPanel: React.FC<ProblemsPanelProps> = ({
  problems,
  selectedProblemId,
  onProblemClick,
  isAnalyzing,
  documentData
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showDetails, setShowDetails] = useState<boolean>(true);
  const analysisService = new AnalysisService();

  // 按类型分组问题
  const problemGroups = useMemo(() => {
    const groups = {
      all: problems,
      missing_citation: problems.filter(p => p.type === 'missing_citation'),
      unused_reference: problems.filter(p => p.type === 'unused_reference'),
      irrelevant_citation: problems.filter(p => p.type === 'irrelevant_citation')
    };
    return groups;
  }, [problems]);

  // 获取问题类型的显示信息
  const getProblemTypeInfo = (type: string) => {
    const typeMap = {
      missing_citation: {
        label: '缺失引用',
        icon: <ExclamationCircleOutlined />,
        color: '#ff4d4f',
        description: '文中引用未在参考文献中找到'
      },
      unused_reference: {
        label: '未使用参考文献',
        icon: <WarningOutlined />,
        color: '#faad14',
        description: '参考文献未被正文引用'
      },
      irrelevant_citation: {
        label: '不相关引用',
        icon: <InfoCircleOutlined />,
        color: '#fa8c16',
        description: '引用与上下文内容不相关'
      }
    };
    return typeMap[type as keyof typeof typeMap] || typeMap.missing_citation;
  };

  // 渲染问题项
  const renderProblemItem = (problem: Problem) => {
    const typeInfo = getProblemTypeInfo(problem.type);
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
        onClick={() => onProblemClick(problem)}
      >
        <div style={{ width: '100%' }}>
          {/* 问题头部 */}
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
            <Tag color={problem.severity === 'error' ? 'red' : 'orange'} icon={typeInfo.icon}>
              {typeInfo.label}
            </Tag>
            {problem.citation && (
              <Tag color="blue">{problem.citation}</Tag>
            )}
          </div>
          
          {/* 问题描述 */}
          <div style={{ marginBottom: '8px' }}>
            <Text strong style={{ fontSize: '13px' }}>
              {problem.description}
            </Text>
          </div>
          
          {/* 详细信息 */}
          {showDetails && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {problem.context && (
                <div style={{ marginBottom: '4px' }}>
                  <Text type="secondary">上下文：</Text>
                  <Text ellipsis style={{ maxWidth: '100%' }}>
                    {problem.context.length > 100 
                      ? `${problem.context.substring(0, 100)}...` 
                      : problem.context
                    }
                  </Text>
                </div>
              )}
              
              {problem.analysis && problem.analysis.includes('不相关') && (
                <div>
                  <Text type="secondary">AI分析：</Text>
                  <Text type="warning">发现相关性问题</Text>
                </div>
              )}
              
              <div>
                <Text type="secondary">
                  位置：第 {problem.position.paragraph_index + 1} 段
                  {problem.position.in_references ? ' (参考文献区域)' : ' (正文区域)'}
                </Text>
              </div>
            </div>
          )}
        </div>
      </List.Item>
    );
  };

  // 导出PDF报告
  const handleExportPDF = async () => {
    if (!documentData) {
      message.error('没有可导出的报告');
      return;
    }
    
    try {
      message.loading('正在生成PDF报告...', 0);
      const blob = await analysisService.exportReportPDF(documentData.taskId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${documentData.taskId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.destroy();
      message.success('PDF报告导出成功！');
    } catch (error) {
      message.destroy();
      message.error('导出PDF失败: ' + error);
    }
  };
  
  // 导出Word报告
  const handleExportWord = async () => {
    if (!documentData) {
      message.error('没有可导出的报告');
      return;
    }
    
    try {
      message.loading('正在生成Word报告...', 0);
      const blob = await analysisService.exportReportWord(documentData.taskId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `report_${documentData.taskId}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      message.destroy();
      message.success('Word报告导出成功！');
    } catch (error) {
      message.destroy();
      message.error('导出Word失败: ' + error);
    }
  };

  // 渲染空状态
  const renderEmpty = (message: string) => (
    <div style={{ 
      height: '200px', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center' 
    }}>
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={<Text type="secondary">{message}</Text>}
      />
    </div>
  );

  if (isAnalyzing) {
    return (
      <Card size="small">
        <div style={{ 
          height: '300px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="loading-spinner" style={{ fontSize: '24px' }}>⏳</div>
          <Text type="secondary">正在分析中，请稍候...</Text>
        </div>
      </Card>
    );
  }

  // 导出菜单项
  const exportMenuItems = [
    {
      key: 'pdf',
      icon: <DownloadOutlined />,
      label: '导出PDF',
      onClick: handleExportPDF
    },
    {
      key: 'word',
      icon: <DownloadOutlined />,
      label: '导出Word',
      onClick: handleExportWord
    }
  ];

  return (
    <Card 
      size="small" 
      title={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            <span>问题报告</span>
            {problems.length > 0 && (
              <Badge count={problems.length} style={{ backgroundColor: '#52c41a' }} />
            )}
          </Space>
          <Space>
            {problems.length > 0 && (
              <Dropdown menu={{ items: exportMenuItems }} placement="bottomRight">
                <Button type="text" size="small" icon={<DownloadOutlined />} />
              </Dropdown>
            )}
            <Tooltip title={showDetails ? '隐藏详情' : '显示详情'}>
              <Button 
                type="text" 
                size="small" 
                icon={<EyeOutlined />}
                onClick={() => setShowDetails(!showDetails)}
              />
            </Tooltip>
            <Tooltip title="筛选">
              <Button type="text" size="small" icon={<FilterOutlined />} />
            </Tooltip>
          </Space>
        </div>
      }
      style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
      bodyStyle={{ flex: 1, overflow: 'hidden', padding: '8px' }}
    >
      {problems.length === 0 ? (
        renderEmpty('暂无问题，文档引用规范！')
      ) : (
        <Tabs 
          activeKey={activeTab} 
          onChange={setActiveTab}
          size="small"
          style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
          items={[
            {
              key: 'all',
              label: `全部 (${problemGroups.all.length})`,
              children: (
                <div style={{ height: '100%', overflowY: 'auto', padding: '8px 0' }}>
                  <List
                    dataSource={problemGroups.all}
                    renderItem={renderProblemItem}
                    style={{ height: '100%' }}
                  />
                </div>
              )
            },
            {
              key: 'missing_citation',
              label: (
                <Space>
                  <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                  缺失引用 ({problemGroups.missing_citation.length})
                </Space>
              ),
              children: (
                <div style={{ height: '100%', overflowY: 'auto', padding: '8px 0' }}>
                  {problemGroups.missing_citation.length === 0 ? (
                    renderEmpty('无缺失引用问题')
                  ) : (
                    <List
                      dataSource={problemGroups.missing_citation}
                      renderItem={renderProblemItem}
                    />
                  )}
                </div>
              )
            },
            {
              key: 'unused_reference',
              label: (
                <Space>
                  <WarningOutlined style={{ color: '#faad14' }} />
                  未使用文献 ({problemGroups.unused_reference.length})
                </Space>
              ),
              children: (
                <div style={{ height: '100%', overflowY: 'auto', padding: '8px 0' }}>
                  {problemGroups.unused_reference.length === 0 ? (
                    renderEmpty('无未使用参考文献')
                  ) : (
                    <List
                      dataSource={problemGroups.unused_reference}
                      renderItem={renderProblemItem}
                    />
                  )}
                </div>
              )
            },
            {
              key: 'irrelevant_citation',
              label: (
                <Space>
                  <InfoCircleOutlined style={{ color: '#fa8c16' }} />
                  不相关引用 ({problemGroups.irrelevant_citation.length})
                </Space>
              ),
              children: (
                <div style={{ height: '100%', overflowY: 'auto', padding: '8px 0' }}>
                  {problemGroups.irrelevant_citation.length === 0 ? (
                    renderEmpty('无不相关引用问题')
                  ) : (
                    <List
                      dataSource={problemGroups.irrelevant_citation}
                      renderItem={renderProblemItem}
                    />
                  )}
                </div>
              )
            }
          ]}
        />
      )}
    </Card>
  );
};

export default ProblemsPanel;
