import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react';

interface EvaluationCriteria {
  criteria: string;
  displayName: string;
  min: string;
  max: string;
  unit: string;
  operator: string;
  severity: string;
  ruleGroup: string;
  actual: string;
  result: string;
  reason: string;
}

interface EvaluationCriteriaDisplayProps {
  comment: string;
}

export default function EvaluationCriteriaDisplay({ comment }: EvaluationCriteriaDisplayProps) {
  const { t } = useTranslation();

  // Parse comment string để lấy thông tin đánh giá
  const parseEvaluationComment = (comment: string): {
    evaluationType: string;
    evaluatedAt: string;
    criteria: EvaluationCriteria[];
    expertNotes: string;
  } | null => {
    try {
      const lines = comment.split('|');
      const result: any = {
        evaluationType: '',
        evaluatedAt: '',
        criteria: [],
        expertNotes: ''
      };

      let currentCriteria: Partial<EvaluationCriteria> = {};
      
      for (const line of lines) {
        if (line.startsWith('EVALUATION_TYPE:')) {
          result.evaluationType = line.replace('EVALUATION_TYPE:', '');
        } else if (line.startsWith('EVALUATED_AT:')) {
          result.evaluatedAt = line.replace('EVALUATED_AT:', '');
        } else if (line.startsWith('CRITERIA:')) {
          // Nếu có criteria trước đó, lưu vào danh sách
          if (Object.keys(currentCriteria).length > 0) {
            result.criteria.push(currentCriteria as EvaluationCriteria);
          }
          // Bắt đầu criteria mới
          currentCriteria = { criteria: line.replace('CRITERIA:', '') };
        } else if (line.startsWith('DISPLAY_NAME:')) {
          currentCriteria.displayName = line.replace('DISPLAY_NAME:', '');
        } else if (line.startsWith('MIN:')) {
          currentCriteria.min = line.replace('MIN:', '');
        } else if (line.startsWith('MAX:')) {
          currentCriteria.max = line.replace('MAX:', '');
        } else if (line.startsWith('UNIT:')) {
          currentCriteria.unit = line.replace('UNIT:', '');
        } else if (line.startsWith('OPERATOR:')) {
          currentCriteria.operator = line.replace('OPERATOR:', '');
        } else if (line.startsWith('SEVERITY:')) {
          currentCriteria.severity = line.replace('SEVERITY:', '');
        } else if (line.startsWith('RULE_GROUP:')) {
          currentCriteria.ruleGroup = line.replace('RULE_GROUP:', '');
        } else if (line.startsWith('ACTUAL:')) {
          currentCriteria.actual = line.replace('ACTUAL:', '');
        } else if (line.startsWith('RESULT:')) {
          currentCriteria.result = line.replace('RESULT:', '');
        } else if (line.startsWith('REASON:')) {
          currentCriteria.reason = line.replace('REASON:', '');
        } else if (line.startsWith('EXPERT_NOTES:')) {
          result.expertNotes = line.replace('EXPERT_NOTES:', '');
        }
      }

      // Thêm criteria cuối cùng
      if (Object.keys(currentCriteria).length > 0) {
        result.criteria.push(currentCriteria as EvaluationCriteria);
      }

      return result;
    } catch (error) {
      console.error('Lỗi parse evaluation comment:', error);
      return null;
    }
  };

  const parsedData = parseEvaluationComment(comment);
  
  if (!parsedData || parsedData.criteria.length === 0) {
    return null;
  }

  const getResultIcon = (result: string) => {
    switch (result.toUpperCase()) {
      case 'PASS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAIL':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'HARD':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'SOFT':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const formatRange = (min: string, max: string, operator: string) => {
    if (min === 'NULL' && max === 'NULL') return t('evaluation.criteria.notApplicable', 'Không áp dụng');
    if (min === 'NULL') return `≤ ${max}`;
    if (max === 'NULL') return `≥ ${min}`;
    return `${min} - ${max}`;
  };

  const getOperatorSymbol = (operator: string) => {
    switch (operator) {
      case '<=': return '≤';
      case '>=': return '≥';
      case '<': return '<';
      case '>': return '>';
      case '=': return '=';
      default: return operator;
    }
  };

  return (
    <div className="space-y-4">
             {/* Header */}
       <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
         <Info className="w-5 h-5 text-blue-600" />
         <div>
           <h4 className="font-medium text-blue-900">
             {t('evaluation.criteria.title', 'Danh sách tiêu chí')}
           </h4>
           <p className="text-sm text-blue-700">
             {t('evaluation.criteria.subtitle', 'Chi tiết từng tiêu chí đánh giá')}
           </p>
         </div>
       </div>

      {/* Criteria List */}
      <div className="space-y-3">
        {parsedData.criteria.map((criteria, index) => (
          <div 
            key={index} 
            className={`p-4 rounded-lg border ${criteria.result === 'PASS' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                {getResultIcon(criteria.result)}
                <h5 className="font-medium text-gray-900">
                  {criteria.displayName}
                </h5>
              </div>
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${criteria.result === 'PASS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                {criteria.result}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              {/* Criteria Details */}
              <div className="space-y-2">
                                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('evaluation.criteria.range', 'Phạm vi:')}</span>
                   <span className="font-medium">
                     {formatRange(criteria.min, criteria.max, criteria.operator)} {criteria.unit}
                   </span>
                 </div>
                 
                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('evaluation.criteria.operator', 'Điều kiện:')}</span>
                   <span className="font-medium">
                     {getOperatorSymbol(criteria.operator)}
                   </span>
                 </div>

                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('evaluation.criteria.actual', 'Giá trị thực tế:')}</span>
                   <span className="font-medium">
                     {criteria.actual} {criteria.unit}
                   </span>
                 </div>
              </div>

              {/* Additional Info */}
              <div className="space-y-2">
                                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('evaluation.criteria.severity', 'Mức độ:')}</span>
                   <span className={`px-2 py-1 text-xs font-medium rounded ${getSeverityColor(criteria.severity)}`}>
                     {criteria.severity}
                   </span>
                 </div>

                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('evaluation.criteria.group', 'Nhóm:')}</span>
                   <span className="font-medium">
                     {criteria.ruleGroup}
                   </span>
                 </div>

                 <div className="flex justify-between">
                   <span className="text-gray-600">{t('evaluation.criteria.code', 'Mã:')}</span>
                   <span className="font-mono text-xs text-gray-500">
                     {criteria.criteria}
                   </span>
                 </div>
              </div>
            </div>

                         {/* Reason */}
             {criteria.reason && (
               <div className="mt-3 p-2 bg-gray-50 rounded border-l-4 border-gray-300">
                 <p className="text-sm text-gray-700">
                   <span className="font-medium">{t('evaluation.criteria.reason', 'Lý do:')}</span> {criteria.reason}
                 </p>
               </div>
             )}
          </div>
        ))}
      </div>

                           {/* Expert Notes */}
        {parsedData.expertNotes && (
          <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <h5 className="font-medium text-yellow-900 mb-2">
              {t('evaluation.expertNotes', 'Ghi chú của chuyên gia:')}
            </h5>
            <p className="text-sm text-yellow-800">
              {parsedData.expertNotes}
            </p>
          </div>
        )}

        {/* Summary */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <span className="text-sm text-gray-600">
            {t('evaluation.criteria.total', 'Tổng số tiêu chí:')} {parsedData.criteria.length}
          </span>
          <div className="flex items-center gap-4 text-sm">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-green-700">
                {parsedData.criteria.filter(c => c.result === 'PASS').length} {t('evaluation.criteria.passed', 'Đạt')}
              </span>
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-red-700">
                {parsedData.criteria.filter(c => c.result === 'FAIL').length} {t('evaluation.criteria.failed', 'Không đạt')}
              </span>
            </span>
          </div>
        </div>
    </div>
  );
}
