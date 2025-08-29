import React from 'react';

interface CommentListDisplayProps {
  comments: string;
}

const CommentListDisplay: React.FC<CommentListDisplayProps> = ({ comments }) => {
  // Parse comment text to extract structured information
  const parseComment = (commentText: string) => {
    const lines = commentText.split('\n').filter(line => line.trim());
    const result: { type: string; content: string; details?: string[] }[] = [];
    
    let currentSection: { type: string; content: string; details?: string[] } | null = null;
    
    lines.forEach(line => {
      const trimmedLine = line.trim();
      
      // Check for main evaluation result
      if (trimmedLine.includes('Đánh giá thành công') || trimmedLine.includes('Successful evaluation')) {
        if (currentSection) {
          result.push(currentSection);
        }
        currentSection = { type: 'evaluation', content: trimmedLine };
      }
      // Check for criteria details
      else if (trimmedLine.includes('Chi tiết:') || trimmedLine.includes('Details:')) {
        if (currentSection) {
          currentSection.details = [];
        }
      }
      // Check for individual criteria
      else if (trimmedLine.includes(':') && (trimmedLine.includes('%') || trimmedLine.includes('mm'))) {
        if (currentSection?.details) {
          currentSection.details.push(trimmedLine);
        }
      }
      // Check for total score
      else if (trimmedLine.includes('Điểm tổng') || trimmedLine.includes('Total score')) {
        if (currentSection) {
          currentSection.content += ' | ' + trimmedLine;
        }
      }
      // Check for note section
      else if (trimmedLine.includes('Ghi chú:') || trimmedLine.includes('Note:')) {
        if (currentSection) {
          result.push(currentSection);
        }
        currentSection = { type: 'note', content: trimmedLine };
      }
      // Add other content to current section
      else if (currentSection && trimmedLine) {
        if (currentSection.details) {
          currentSection.details.push(trimmedLine);
        } else {
          currentSection.content += ' ' + trimmedLine;
        }
      }
    });
    
    if (currentSection) {
      result.push(currentSection);
    }
    
    return result;
  };

  const parsedComments = parseComment(comments);

  return (
    <div className="space-y-3">
      {parsedComments.map((section, index) => (
        <div key={index} className="border-l-4 border-green-500 pl-4">
          <div className="text-sm text-gray-700">
            <span className="font-medium text-gray-900">
              {section.type === 'evaluation' ? '📊 ' : '📝 '}
              {section.content}
            </span>
          </div>
          
          {section.details && section.details.length > 0 && (
            <div className="mt-2 ml-4 space-y-1">
              {section.details.map((detail, detailIndex) => (
                <div key={detailIndex} className="flex items-center gap-2 text-sm text-gray-600">
                  <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CommentListDisplay;
