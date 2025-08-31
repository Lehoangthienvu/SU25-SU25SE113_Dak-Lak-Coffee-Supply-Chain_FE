import { Info, Package, Calendar, Target, Users, FileText, AlertCircle } from "lucide-react";
import { FaSeedling } from "react-icons/fa";
import { useTranslation } from "react-i18next";

interface ProcurementPlanFormGuideProps {
  className?: string;
}

export default function ProcurementPlanFormGuide({ className = "" }: ProcurementPlanFormGuideProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 space-y-6 ${className}`}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          {t('procurementPlan.components.procurementPlanFormGuide.title')}
        </h3>
      </div>

      <div className="space-y-5">
        {/* Tên kế hoạch */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.planTitle.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.planTitle.description')}
            </p>
          </div>
        </div>

        {/* Thời gian */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.time.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.time.description')}
            </p>
          </div>
        </div>

        {/* Mô tả */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.description.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.description.description')}
            </p>
          </div>
        </div>

        {/* Phương pháp sơ chế */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <FaSeedling className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.processingMethod.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.processingMethod.description')}
            </p>
          </div>
        </div> 
                
        {/* Sản lượng */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.targetQuantity.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.targetQuantity.description')}
            </p>
          </div>
        </div>

        {/* Sản lượng đăng ký tối thiểu*/}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.minRegistrationQuantity.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.minRegistrationQuantity.description')}
            </p>
          </div>
        </div>                  

        {/* Đối tượng */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.targetRegion.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.targetRegion.description')}
            </p>
          </div>
        </div>

        {/* Tiêu chuẩn */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.qualityStandards.title')}
            </h4>
            <p className="text-sm text-gray-600">
              {t('procurementPlan.components.procurementPlanFormGuide.sections.qualityStandards.description')}
            </p>
          </div>
        </div>
      </div>

      {/* Lưu ý quan trọng */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">
              {t('procurementPlan.components.procurementPlanFormGuide.importantNotes.title')}
            </h4>
            <ul className="text-sm text-amber-700 space-y-1">
              {(t('procurementPlan.components.procurementPlanFormGuide.importantNotes.items', { returnObjects: true }) as string[]).map((note: string, index: number) => (
                <li key={index}>• {note}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Quy trình */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">
          {t('procurementPlan.components.procurementPlanFormGuide.workflow.title')}
        </h4>
                  <div className="space-y-2 text-sm text-blue-700">
            {(t('procurementPlan.components.procurementPlanFormGuide.workflow.steps', { returnObjects: true }) as string[]).map((step: string, index: number) => (
              <div key={index} className="flex gap-2">
                <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">
                  {index + 1}
                </span>
                <span>{step}</span>
              </div>
            ))}
          </div>
      </div>
    </div>
  );
}

