import {
  Info,
  FileText,
  Calendar,
  Package,
  DollarSign,
  Users,
  Target,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";

interface FarmingCommitmentFormGuideProps {
  className?: string;
}

export default function FarmingCommitmentFormGuide({
  className = "",
}: FarmingCommitmentFormGuideProps) {
  const { t } = useTranslation();
  
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 space-y-6 ${className}`}>
      <div className='flex items-center gap-3 pb-4 border-b border-gray-200'>
        <Info className='w-5 h-5 text-green-600' />
        <h3 className='text-lg font-semibold text-gray-900'>
          {t('farmingCommitment.components.farmingCommitmentForm.formGuide.title')}
        </h3>
      </div>

      <div className='space-y-5'>
        {/* Tên cam kết */}
        <div className='flex gap-3'>
          <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
            <FileText className='w-4 h-4 text-green-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-1'>{t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.commitmentName.title')}</h4>
            <p className='text-sm text-gray-600'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.commitmentName.description')}
            </p>
          </div>
        </div>

        {/* Thông tin nông hộ */}
        <div className='flex gap-3'>
          <div className='flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center'>
            <Users className='w-4 h-4 text-blue-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-1'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.generalTerms.title')}
            </h4>
            <p className='text-sm text-gray-600'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.generalTerms.description')}
            </p>
          </div>
        </div>

        {/* Kế hoạch thu mua */}
        <div className='flex gap-3'>
          <div className='flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center'>
            <FileText className='w-4 h-4 text-purple-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-1'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.registrationDetails.title')}
            </h4>
            <p className='text-sm text-gray-600'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.registrationDetails.description')}
            </p>
          </div>
        </div>

        {/* Chi tiết cam kết */}
        <div className='flex gap-3'>
          <div className='flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
            <Package className='w-4 h-4 text-orange-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-1'>{t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.commitmentDetails.title')}</h4>
            <p className='text-sm text-gray-600'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.commitmentDetails.description')}
            </p>
          </div>
        </div>

        {/* Giá cam kết */}
        <div className='flex gap-3'>
          <div className='flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
            <DollarSign className='w-4 h-4 text-yellow-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-1'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.confirmedPrice.title')}
            </h4>
            <p className='text-sm text-gray-600'>
              {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.confirmedPrice.description')}
            </p>
          </div>
        </div>

                 {/* Số tiền tạm ứng cho nông dân */}
         <div className='flex gap-3'>
           <div className='flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center'>
             <DollarSign className='w-4 h-4 text-yellow-600' />
           </div>
           <div>
             <h4 className='font-medium text-gray-900 mb-1'>
               {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.advancePayment.title')}
             </h4>
             <p className='text-sm text-gray-600'>
               {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.advancePayment.description')}
             </p>
           </div>
         </div>

                 {/* Sản lượng cam kết */}
         <div className='flex gap-3'>
           <div className='flex-shrink-0 w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center'>
             <Target className='w-4 h-4 text-teal-600' />
           </div>
           <div>
             <h4 className='font-medium text-gray-900 mb-1'>
               {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.committedQuantity.title')}
             </h4>
             <p className='text-sm text-gray-600'>
               {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.committedQuantity.description')}
             </p>
           </div>
         </div>
      </div>

             {/* Thời gian giao hàng */}
       <div className='flex gap-3'>
         <div className='flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center'>
           <Calendar className='w-4 h-4 text-indigo-600' />
         </div>
         <div>
           <h4 className='font-medium text-gray-900 mb-1'>
             {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.deliveryTime.title')}
           </h4>
           <p className='text-sm text-gray-600'>
             {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.deliveryTime.description')}
           </p>
         </div>
       </div>

             {/* Lưu ý quan trọng */}
       <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
         <div className='flex gap-2 items-start'>
           <AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
           <div>
             <h4 className='font-medium text-amber-800 mb-2'>
               {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.importantNotes.title')}
             </h4>
             <ul className='text-sm text-amber-700 space-y-1'>
               {(t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.importantNotes.items', { returnObjects: true }) as string[]).map((item, index) => (
                 <li key={index}>• {item}</li>
               ))}
             </ul>
           </div>
         </div>
       </div>

             {/* Quy trình xử lý */}
       <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
         <h4 className='font-medium text-green-800 mb-3'>
           {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.workflow.title')}
         </h4>
         <div className='space-y-2 text-sm text-green-700'>
           {(t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.workflow.steps', { returnObjects: true }) as string[]).map((step, index) => (
             <div key={index} className='flex gap-2'>
               <span className='w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-medium'>
                 {index + 1}
               </span>
               <span>{step}</span>
             </div>
           ))}
         </div>
       </div>

             {/* Trạng thái cam kết */}
       <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
         <h4 className='font-medium text-blue-800 mb-3'>
           {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.statuses.title')}
         </h4>
         <div className='space-y-2 text-sm text-blue-700'>
           <div className='flex items-center gap-2'>
             <div className='w-3 h-3 bg-blue-400 rounded-full'></div>
             <span>
               <strong>Pending:</strong> {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.statuses.pending')}
             </span>
           </div>
           <div className='flex items-center gap-2'>
             <div className='w-3 h-3 bg-green-400 rounded-full'></div>
             <span>
               <strong>Approved:</strong> {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.statuses.approved')}
             </span>
           </div>
           <div className='flex items-center gap-2'>
             <div className='w-3 h-3 bg-red-400 rounded-full'></div>
             <span>
               <strong>Rejected:</strong> {t('farmingCommitment.components.farmingCommitmentForm.formGuide.sections.statuses.rejected')}
             </span>
           </div>
         </div>
       </div>
    </div>
  );
}
