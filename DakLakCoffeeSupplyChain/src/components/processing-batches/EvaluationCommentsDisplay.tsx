import React from 'react';
import { FiCheckCircle, FiXCircle, FiAlertCircle, FiInfo, FiTarget, FiTrendingUp } from 'react-icons/fi';
import { EVALUATION_RESULTS } from '@/lib/api/processingBatchEvaluations';

interface EvaluationCommentsDisplayProps {
  comments: string;
  evaluationResult: string | undefined;
}

export default function EvaluationCommentsDisplay({ comments, evaluationResult }: EvaluationCommentsDisplayProps) {
  if (!comments) {
    return (
      <div className="bg-gray-50 rounded-lg p-4 text-center">
        <FiInfo className="w-5 h-5 text-gray-400 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Không có nhận xét</p>
      </div>
    );
  }

  // Kiểm tra xem có phải format đánh giá có cấu trúc không
  const isStructuredEvaluation = comments.includes('EVALUATION_TYPE:') || 
                                 comments.includes('CRITERIA:') || 
                                 comments.includes('DISPLAY_NAME:') ||
                                 comments.includes('ACTUAL_VALUE:') ||
                                 comments.includes('SEVERITY:') ||
                                 comments.includes('RULE_GROUP:') ||
                                 comments.includes('OPERATOR:') ||
                                 comments.includes('MIN:') ||
                                 comments.includes('MAX:') ||
                                 comments.includes('COMMENT:') ||
                                 comments.includes('EVALUATED_AT:');
  
  if (isStructuredEvaluation) {
    return <StructuredEvaluationDisplay comments={comments} evaluationResult={evaluationResult} />;
  }

  // Hiển thị nhận xét thông thường
  return <PlainCommentsDisplay comments={comments} evaluationResult={evaluationResult} />;
}

function StructuredEvaluationDisplay({ comments, evaluationResult }: { comments: string; evaluationResult: string | undefined }) {
  // Debug: Log comments để xem format
  console.log('🔍 DEBUG: Structured comments:', comments);
  console.log('🔍 DEBUG: Comments length:', comments.length);
  console.log('🔍 DEBUG: First 200 chars:', comments.substring(0, 200));
  
  // Parse structured comments thành danh sách các tiêu chí
  const parseCriteriaList = (comments: string) => {
    const criteriaList: any[] = [];

    // Thử parse theo từng dòng trước
    const lines = comments.split('\n');
    console.log('🔍 DEBUG: Number of lines:', lines.length);
    
    lines.forEach((line, lineIndex) => {
      line = line.trim();
      if (!line) return;

      console.log(`🔍 DEBUG: Line ${lineIndex}:`, line.substring(0, 100));

      // Kiểm tra xem có phải là dòng tiêu chí không (bắt đầu bằng CRITERIA:)
      if (line.startsWith('CRITERIA:')) {
        // Parse dòng tiêu chí theo format: CRITERIA:value|DISPLAY_NAME:value|MIN:value|MAX:value|...
        const criteria: any = {};
        
        // Tách các field bằng dấu |
        const fields = line.split('|');
        console.log(`🔍 DEBUG: Line ${lineIndex} fields:`, fields.length);
        
        fields.forEach(field => {
          const firstColonIndex = field.indexOf(':');
          if (firstColonIndex !== -1) {
            const key = field.substring(0, firstColonIndex).trim();
            const value = field.substring(firstColonIndex + 1).trim();
            if (key && value) {
              criteria[key] = value;
            }
          }
        });

        console.log(`🔍 DEBUG: Line ${lineIndex} parsed criteria:`, criteria);

        // Chỉ thêm vào list nếu có ít nhất CRITERIA
        if (criteria.CRITERIA) {
          criteriaList.push(criteria);
        }
      }
    });

    // Nếu không tìm thấy tiêu chí nào theo dòng, thử parse toàn bộ text
    if (criteriaList.length === 0) {
      console.log('🔍 DEBUG: No criteria found in lines, trying to parse entire text');
      
      // Tìm tất cả các pattern CRITERIA:... trong text
      const criteriaMatches = comments.match(/CRITERIA:[^|]+(?:\|[^|]+)*/g);
      console.log('🔍 DEBUG: Criteria matches:', criteriaMatches);
      
      if (criteriaMatches) {
        criteriaMatches.forEach((match, index) => {
          const criteria: any = {};
          
          // Tách các field bằng dấu |
          const fields = match.split('|');
          
          fields.forEach(field => {
            const firstColonIndex = field.indexOf(':');
            if (firstColonIndex !== -1) {
              const key = field.substring(0, firstColonIndex).trim();
              const value = field.substring(firstColonIndex + 1).trim();
              if (key && value) {
                criteria[key] = value;
              }
            }
          });

          console.log(`🔍 DEBUG: Match ${index} parsed criteria:`, criteria);

          if (criteria.CRITERIA) {
            criteriaList.push(criteria);
          }
        });
      }
    }

    return criteriaList;
  };

  const criteriaList = parseCriteriaList(comments);
  console.log('🔍 DEBUG: Criteria list:', criteriaList);
  console.log('🔍 DEBUG: Number of criteria found:', criteriaList.length);
  if (criteriaList.length > 0) {
    console.log('🔍 DEBUG: First criteria:', criteriaList[0]);
  }
  const isPass = evaluationResult === EVALUATION_RESULTS.PASS;

  // Nếu không có tiêu chí nào, hiển thị comments thô
  if (criteriaList.length === 0) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FiAlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-yellow-800 mb-2">
              Nhận xét đánh giá (format thô):
            </p>
            <p className="text-sm text-yellow-700 whitespace-pre-wrap">
              {comments}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-lg">
        <div className="flex items-center gap-3">
          <FiTarget className="w-6 h-6" />
          <div className="flex-1">
            <h4 className="font-semibold text-lg">Danh sách tiêu chí đánh giá</h4>
            <p className="text-blue-100 text-sm">
              {criteriaList.length} tiêu chí được đánh giá
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-blue-100">
              {criteriaList.filter(c => c.RESULT === 'PASS').length} đạt / {criteriaList.length} tổng
            </div>
          </div>
        </div>
      </div>

      {/* Criteria List */}
      <div className="space-y-3">
        {criteriaList.map((criteria, index) => {
          const isCriteriaPass = criteria.RESULT === 'PASS';
          const isCriteriaFail = criteria.RESULT === 'FAIL';
          
          return (
            <div 
              key={index}
              className={`border rounded-lg p-4 transition-all duration-200 hover:shadow-md ${
                isCriteriaPass 
                  ? 'bg-green-50 border-green-200' 
                  : isCriteriaFail 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              {/* Criteria Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  {isCriteriaPass ? (
                    <FiCheckCircle className="w-5 h-5 text-green-600" />
                  ) : isCriteriaFail ? (
                    <FiXCircle className="w-5 h-5 text-red-600" />
                  ) : (
                    <FiAlertCircle className="w-5 h-5 text-yellow-600" />
                  )}
                  <div>
                    <h5 className={`font-semibold ${isCriteriaPass ? 'text-green-900' : isCriteriaFail ? 'text-red-900' : 'text-gray-900'}`}>
                      {criteria.DISPLAY_NAME || criteria.CRITERIA || 'Không có tên tiêu chí'}
                    </h5>
                    <p className="text-xs text-gray-600">
                      {criteria.CRITERIA}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    isCriteriaPass 
                      ? 'bg-green-200 text-green-800' 
                      : isCriteriaFail 
                      ? 'bg-red-200 text-red-800' 
                      : 'bg-yellow-200 text-yellow-800'
                  }`}>
                    {criteria.RESULT || 'UNKNOWN'}
                  </span>
                  {isCriteriaFail && criteria.SEVERITY && (
                    <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                      criteria.SEVERITY === 'Hard' 
                        ? 'bg-red-300 text-red-900' 
                        : 'bg-yellow-300 text-yellow-900'
                    }`}>
                      {criteria.SEVERITY}
                    </span>
                  )}
                </div>
              </div>

              {/* Criteria Details */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="bg-white rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FiTrendingUp className="w-3 h-3 text-blue-600" />
                    <span className="font-medium text-gray-700">Giá trị thực tế:</span>
                  </div>
                  <p className={`font-semibold ${isCriteriaFail ? 'text-red-700' : 'text-gray-900'}`}>
                    {criteria.ACTUAL || criteria.ACTUAL_VALUE || 'N/A'} {criteria.UNIT || ''}
                  </p>
                </div>

                <div className="bg-white rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FiTarget className="w-3 h-3 text-purple-600" />
                    <span className="font-medium text-gray-700">Phạm vi cho phép:</span>
                  </div>
                  <p className="text-gray-900">
                    {criteria.MIN === 'NULL' ? '≤' : '≥'} {criteria.MIN === 'NULL' ? criteria.MAX : criteria.MIN}
                    {criteria.MIN !== 'NULL' && criteria.MAX !== 'NULL' && ` - ${criteria.MAX}`} {criteria.UNIT || ''}
                  </p>
                </div>

                <div className="bg-white rounded p-2">
                  <div className="flex items-center gap-2 mb-1">
                    <FiInfo className="w-3 h-3 text-indigo-600" />
                    <span className="font-medium text-gray-700">Nhóm tiêu chí:</span>
                  </div>
                  <p className="text-gray-900">
                    {criteria.RULE_GROUP || 'N/A'}
                  </p>
                </div>
              </div>

              {/* Reason for Fail */}
              {isCriteriaFail && criteria.REASON && (
                <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded">
                  <div className="flex items-start gap-2">
                    <FiAlertCircle className="w-4 h-4 text-red-600 mt-0.5" />
                    <p className="text-sm text-red-800">
                      <span className="font-medium">Lý do không đạt:</span> {criteria.REASON}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FiCheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{criteriaList.filter(c => c.RESULT === 'PASS').length}</span> tiêu chí đạt
              </span>
            </div>
            <div className="flex items-center gap-2">
              <FiXCircle className="w-4 h-4 text-red-600" />
              <span className="text-sm text-gray-700">
                <span className="font-medium">{criteriaList.filter(c => c.RESULT === 'FAIL').length}</span> tiêu chí không đạt
              </span>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            Tổng cộng: {criteriaList.length} tiêu chí
          </div>
        </div>
      </div>
    </div>
  );
}

function PlainCommentsDisplay({ comments, evaluationResult }: { comments: string; evaluationResult: string | undefined }) {
  const isPass = evaluationResult === EVALUATION_RESULTS.PASS;

  return (
    <div className={`p-4 rounded-lg border ${
      isPass ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
    }`}>
      <div className="flex items-start gap-3">
        {isPass ? (
          <FiCheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
        ) : (
          <FiXCircle className="w-5 h-5 text-red-600 mt-0.5" />
        )}
        <div className="flex-1">
          <h4 className={`font-semibold mb-2 ${isPass ? 'text-green-900' : 'text-red-900'}`}>
            {isPass ? 'Nhận xét đánh giá thành công' : 'Nhận xét đánh giá'}
          </h4>
          <div className={`p-3 rounded-lg ${
            isPass ? 'bg-green-100' : 'bg-red-100'
          }`}>
            <p className={`text-sm leading-relaxed ${isPass ? 'text-green-800' : 'text-red-800'}`}>
              {comments}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
