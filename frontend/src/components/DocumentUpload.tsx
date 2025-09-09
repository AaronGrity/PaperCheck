import React, { useState } from 'react';
import { Upload, Button, Typography, Space, Alert } from 'antd';
import { UploadOutlined, FileTextOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';

const { Text, Paragraph } = Typography;

interface DocumentUploadProps {
  onUpload: (file: File) => Promise<void>;
  disabled?: boolean;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({ onUpload, disabled = false }) => {
  const [uploading, setUploading] = useState(false);

  const uploadProps: UploadProps = {
    name: 'file',
    accept: '.docx',
    showUploadList: false,
    beforeUpload: async (file) => {
      // 检查文件类型
      const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                     file.name.toLowerCase().endsWith('.docx');
      
      if (!isDocx) {
        alert('只能上传 .docx 格式的文件！');
        return false;
      }

      // 检查文件大小 (50MB)
      const isLt50M = file.size / 1024 / 1024 < 50;
      if (!isLt50M) {
        alert('文件大小不能超过 50MB！');
        return false;
      }

      setUploading(true);
      
      try {
        await onUpload(file);
      } catch (error) {
        console.error('上传失败:', error);
      } finally {
        setUploading(false);
      }
      
      return false; // 阻止默认上传行为
    },
  };

  return (
    <div>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileTextOutlined />
            文档上传
          </Text>
        </div>
        
        <Alert
          message="支持格式"
          description="仅支持 Microsoft Word (.docx) 格式的文档文件"
          type="info"
          showIcon
          style={{ fontSize: '12px' }}
        />
        
        <Upload {...uploadProps}>
          <Button 
            icon={<UploadOutlined />} 
            loading={uploading}
            disabled={disabled}
            size="large"
            type="primary"
            style={{ width: '100%' }}
          >
            {uploading ? '上传中...' : '选择文档文件'}
          </Button>
        </Upload>
        
        <div>
          <Paragraph style={{ fontSize: '12px', color: '#666', margin: 0 }}>
            • 文件大小限制：50MB<br/>
            • 支持中英文学术论文<br/>
            • 请确保文档包含引用标记（如 [1], [2] 等）和参考文献部分
          </Paragraph>
        </div>
      </Space>
    </div>
  );
};

export default DocumentUpload;
