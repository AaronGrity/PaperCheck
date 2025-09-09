import React, { forwardRef, useImperativeHandle, useRef, useEffect } from 'react';
import { Typography, Empty, Spin } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { DocumentData, Problem } from '../types';

const { Text } = Typography;

interface DocumentPreviewProps {
  documentData: DocumentData | null;
  problems: Problem[];
  selectedProblemId: number | null;
  onProblemMarkerClick: (problemId: number) => void;
}

export interface DocumentPreviewRef {
  scrollToProblem: (problem: Problem) => void;
}

const DocumentPreview = forwardRef<DocumentPreviewRef, DocumentPreviewProps>(
  ({ documentData, problems, selectedProblemId, onProblemMarkerClick }, ref) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      scrollToProblem: (problem: Problem) => {
        console.log('scrollToProblem called, problem:', problem);
        if (!containerRef.current || !contentRef.current) return;
        
        // 查找对应的问题标记元素
        const problemMarker = contentRef.current.querySelector(
          `[data-problem-id="${problem.id}"]`
        ) as HTMLElement;
        
        console.log('查找问题标记元素:', problemMarker);
        
        if (problemMarker) {
          // 滚动到问题位置
          const containerRect = containerRef.current.getBoundingClientRect();
          const markerRect = problemMarker.getBoundingClientRect();
          const scrollTop = containerRef.current.scrollTop;
          
          const targetScrollTop = scrollTop + markerRect.top - containerRect.top - 100;
          
          console.log('滚动到位置:', targetScrollTop);
          
          containerRef.current.scrollTo({
            top: targetScrollTop,
            behavior: 'smooth'
          });
          
          // 高亮显示
          problemMarker.style.boxShadow = '0 0 10px rgba(24, 144, 255, 0.5)';
          problemMarker.style.transform = 'scale(1.2)';
          setTimeout(() => {
            problemMarker.style.boxShadow = '';
            problemMarker.style.transform = '';
          }, 2000);
        } else {
          console.log('未找到问题标记元素');
        }
      }
    }));

    // 处理HTML内容，添加问题标记
    const processHtmlWithProblems = (htmlContent: string, problems: Problem[]): string => {
      if (!problems.length) return htmlContent;

      // 创建一个临时DOM来处理HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(htmlContent, 'text/html');
      const paragraphs = doc.querySelectorAll('p[data-para-index]');

      // 按段落分组问题，避免重复处理同一段落
      const problemsByParagraph: { [key: number]: Problem[] } = {};
      problems.forEach(problem => {
        const paraIndex = problem.position.paragraph_index;
        if (!problemsByParagraph[paraIndex]) {
          problemsByParagraph[paraIndex] = [];
        }
        problemsByParagraph[paraIndex].push(problem);
      });

      // 为每个段落添加问题标记
      Object.entries(problemsByParagraph).forEach(([paraIndex, paraProblems]) => {
        const targetParagraph = Array.from(paragraphs).find(
          p => parseInt(p.getAttribute('data-para-index') || '-1') === parseInt(paraIndex)
        );
        
        if (targetParagraph) {
          // 按在段落中的位置排序问题（从后往前，避免位置偏移）
          const sortedProblems = [...paraProblems].sort((a, b) => 
            b.position.start_pos - a.position.start_pos
          );
          
          // 获取段落的HTML内容（保留原有HTML标签）
          let paragraphHtml = targetParagraph.innerHTML;
          
          // 为每个问题添加标记
          sortedProblems.forEach(problem => {
            const startPos = problem.position.start_pos;
            const endPos = problem.position.end_pos;
            
            // 确保位置有效
            if (startPos >= 0 && endPos <= paragraphHtml.length) {
              // 创建问题标记
              const beforeText = paragraphHtml.substring(0, startPos);
              const problemText = paragraphHtml.substring(startPos, endPos);
              const afterText = paragraphHtml.substring(endPos);
              
              // 构建新的HTML（只标记问题编号，不包含问题文本）
              const problemMarker = `<span class="problem-marker ${problem.type}" 
                data-problem-id="${problem.id}" 
                style="background-color: ${problem.color}; color: white; padding: 1px 3px; border-radius: 3px; cursor: pointer; font-weight: bold;"
                title="${problem.description}"
              >[${problem.id}]</span>`;
              
              // 更新段落HTML
              paragraphHtml = `${beforeText}${problemText}${problemMarker}${afterText}`;
            }
          });
          
          // 更新段落内容
          targetParagraph.innerHTML = paragraphHtml;
        }
      });

      return doc.documentElement.innerHTML;
    };

    // 处理问题标记点击事件
    useEffect(() => {
      if (!contentRef.current) return;
      
      const handleMarkerClick = (event: MouseEvent) => {
        const target = event.target as HTMLElement;
        console.log('点击事件触发，目标元素:', target);
        // 检查点击的元素或其父元素是否有problem-marker类
        let currentElement: HTMLElement | null = target;
        while (currentElement && currentElement !== contentRef.current) {
          if (currentElement.classList.contains('problem-marker')) {
            const problemId = parseInt(currentElement.getAttribute('data-problem-id') || '0');
            console.log('找到问题标记，问题ID:', problemId);
            if (problemId) {
              onProblemMarkerClick(problemId);
              break;
            }
          }
          currentElement = currentElement.parentElement;
        }
      };
      
      contentRef.current.addEventListener('click', handleMarkerClick);
      
      return () => {
        contentRef.current?.removeEventListener('click', handleMarkerClick);
      };
    }, [onProblemMarkerClick]);

    // 高亮选中的问题
    useEffect(() => {
      if (!contentRef.current) return;
      
      console.log('高亮选中的问题，selectedProblemId:', selectedProblemId);
      
      // 移除之前的高亮样式
      const allMarkers = contentRef.current.querySelectorAll('.problem-marker');
      allMarkers.forEach(el => {
        el.classList.remove('highlighted');
        (el as HTMLElement).style.boxShadow = '';
        (el as HTMLElement).style.transform = '';
      });
      
      // 如果有选中的问题ID，添加新的高亮
      if (selectedProblemId) {
        const currentMarker = contentRef.current.querySelector(
          `[data-problem-id="${selectedProblemId}"]`
        ) as HTMLElement;
        console.log('找到当前标记元素:', currentMarker);
        if (currentMarker) {
          currentMarker.classList.add('highlighted');
          currentMarker.style.boxShadow = '0 0 10px rgba(24, 144, 255, 0.5)';
          currentMarker.style.transform = 'scale(1.2)';
        }
      }
    }, [selectedProblemId]);

    if (!documentData) {
      return (
        <div style={{ 
          height: '100%', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: '#fafafa'
        }}>
          <Empty
            image={<FileTextOutlined style={{ fontSize: '48px', color: '#d9d9d9' }} />}
            description={
              <Text type="secondary">
                请先上传 Word 文档
              </Text>
            }
          />
        </div>
      );
    }

    const processedHtml = processHtmlWithProblems(documentData.htmlContent, problems);

    return (
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '8px 16px', borderBottom: '1px solid #f0f0f0', background: '#fff' }}>
          <Text strong style={{ fontSize: '14px' }}>
            📄 {documentData.filename}
          </Text>
          {problems.length > 0 && (
            <Text type="secondary" style={{ marginLeft: '12px', fontSize: '12px' }}>
              发现 {problems.length} 个问题
            </Text>
          )}
        </div>
        
        <div 
          ref={containerRef}
          style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '16px',
            background: '#fafafa'
          }}
        >
          <div 
            ref={contentRef}
            style={{
              background: 'white',
              padding: '24px',
              borderRadius: '8px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
              lineHeight: '1.6',
              fontSize: '14px'
            }}
            dangerouslySetInnerHTML={{ __html: processedHtml }}
          />
        </div>
      </div>
    );
  }
);

DocumentPreview.displayName = 'DocumentPreview';

export default DocumentPreview;
