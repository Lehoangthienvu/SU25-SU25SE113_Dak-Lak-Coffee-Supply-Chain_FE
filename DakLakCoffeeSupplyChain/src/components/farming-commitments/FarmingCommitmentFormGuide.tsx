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

interface FarmingCommitmentFormGuideProps {
  className?: string;
}

export default function FarmingCommitmentFormGuide({
  className = "",
}: FarmingCommitmentFormGuideProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 space-y-6 ${className}`}>
      <div className='flex items-center gap-3 pb-4 border-b border-gray-200'>
        <Info className='w-5 h-5 text-green-600' />
        <h3 className='text-lg font-semibold text-gray-900'>
          Hướng dẫn điền form cam kết
        </h3>
      </div>

      <div className='space-y-5'>
        {/* Tên cam kết */}
        <div className='flex gap-3'>
          <div className='flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center'>
            <FileText className='w-4 h-4 text-green-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-1'>Tên cam kết</h4>
            <p className='text-sm text-gray-600'>
              Đặt tên rõ ràng cho cam kết thu mua. Ví dụ: &quot;Cam kết thu mua
              cà phê Robusta vụ 2025&quot;
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
              Các điều khoản chung
            </h4>
            <p className='text-sm text-gray-600'>
              Các điều khoản chung cho toàn bộ các chi tiết cam kết.
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
              Chi tiết đơn đăng ký
            </h4>
            <p className='text-sm text-gray-600'>
              Hệ thống sẽ tự động lấy các chi tiết đăng ký của nông dân đã được duyệt và tự điền vào đơn cam kết. Doanh
              nghiệp có thể trên đó để tùy chỉnh lại.
            </p>
          </div>
        </div>

        {/* Chi tiết cam kết */}
        <div className='flex gap-3'>
          <div className='flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center'>
            <Package className='w-4 h-4 text-orange-600' />
          </div>
          <div>
            <h4 className='font-medium text-gray-900 mb-1'>Chi tiết cam kết</h4>
            <p className='text-sm text-gray-600'>
              Xác nhận sản lượng, giá cả và thời gian giao hàng cho từng loại cà
              phê
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
              Giá cả thống nhất
            </h4>
            <p className='text-sm text-gray-600'>
              Giá thu mua thỏa thuận với nông hộ (VNĐ/kg). Có thể khác với giá
              trong kế hoạch.
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
              Số tiền tạm ứng cho nông dân
            </h4>
            <p className='text-sm text-gray-600'>
              Có thể trả trước cho nông dân để họ đầu tư vào các nguyên vật liệu
              cho mùa vụ. Mục này tùy chọn.
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
              Sản lượng mục tiêu thống nhất
            </h4>
            <p className='text-sm text-gray-600'>
              Số lượng cà phê mà nông hộ cam kết cung cấp (kg). Có thể điều
              chỉnh theo khả năng thực tế
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
            Thời gian giao hàng
          </h4>
          <p className='text-sm text-gray-600'>
            Khoảng thời gian dự kiến nông hộ sẽ giao hàng. Hệ thống sẽ tự điền
            cách 1 ngày dựa trên ngày dự kiến thu hoạch kết thúc từ chi tiết đơn
            đăng ký của nông hộ. Nên phù hợp với mùa vụ thu hoạch.
          </p>
        </div>
      </div>

      {/* Lưu ý quan trọng */}
      <div className='bg-amber-50 border border-amber-200 rounded-lg p-4'>
        <div className='flex gap-2 items-start'>
          <AlertCircle className='w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5' />
          <div>
            <h4 className='font-medium text-amber-800 mb-2'>
              Lưu ý quan trọng
            </h4>
            <ul className='text-sm text-amber-700 space-y-1'>
              <li>
                • Cam kết sau khi được duyệt sẽ trở thành hợp đồng ràng buộc
              </li>
              <li>
                • Đảm bảo thông tin chính xác về sản lượng và thời gian giao
                hàng
              </li>
              <li>
                • Giá cam kết phải phù hợp với thị trường và chất lượng cà phê
              </li>
              <li>• Thời gian giao hàng nên phù hợp với chu kỳ thu hoạch</li>
              <li>• Kiểm tra kỹ thông tin nông hộ và kế hoạch thu mua</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quy trình xử lý */}
      <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
        <h4 className='font-medium text-green-800 mb-3'>
          Quy trình xử lý cam kết
        </h4>
        <div className='space-y-2 text-sm text-green-700'>
          <div className='flex gap-2'>
            <span className='w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-medium'>
              1
            </span>
            <span>Tạo cam kết (Pending)</span>
          </div>
          <div className='flex gap-2'>
            <span className='w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-medium'>
              2
            </span>
            <span>Nông hộ xác nhận cam kết</span>
          </div>
          <div className='flex gap-2'>
            <span className='w-5 h-5 bg-green-200 rounded-full flex items-center justify-center text-xs font-medium'>
              3
            </span>
            <span>Nông hộ có thể bắt đầu quy trình tạo mùa vụ</span>
          </div>
        </div>
      </div>

      {/* Trạng thái cam kết */}
      <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
        <h4 className='font-medium text-blue-800 mb-3'>
          Các trạng thái cam kết
        </h4>
        <div className='space-y-2 text-sm text-blue-700'>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-blue-400 rounded-full'></div>
            <span>
              <strong>Pending:</strong> Đang chờ nông hộ xác nhận
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-green-400 rounded-full'></div>
            <span>
              <strong>Approved:</strong> Đã được duyệt và thực hiện
            </span>
          </div>
          <div className='flex items-center gap-2'>
            <div className='w-3 h-3 bg-red-400 rounded-full'></div>
            <span>
              <strong>Rejected:</strong> Bị từ chối hoặc hủy bỏ
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
