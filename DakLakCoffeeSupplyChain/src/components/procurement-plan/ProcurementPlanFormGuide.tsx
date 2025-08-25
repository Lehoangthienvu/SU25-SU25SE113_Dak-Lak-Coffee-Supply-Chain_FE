import { Info, Package, Calendar, Target, Users, FileText, AlertCircle } from "lucide-react";
import { FaSeedling } from "react-icons/fa";

interface ProcurementPlanFormGuideProps {
  className?: string;
}

export default function ProcurementPlanFormGuide({ className = "" }: ProcurementPlanFormGuideProps) {
  return (
    <div className={`bg-white rounded-xl shadow-sm p-6 space-y-6 ${className}`}>
      <div className="flex items-center gap-3 pb-4 border-b border-gray-200">
        <Info className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-gray-900">
          Hướng dẫn điền form
        </h3>
      </div>

      <div className="space-y-5">
        {/* Tên kế hoạch */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Tên kế hoạch</h4>
            <p className="text-sm text-gray-600">
              Đặt tên rõ ràng, mô tả ngắn gọn về mục tiêu thu mua. Ví dụ: &quot;Thu mua cà phê Robusta vụ 2025&quot;.
            </p>
          </div>
        </div>

        {/* Thời gian */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
            <Calendar className="w-4 h-4 text-purple-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Thời gian mở đơn</h4>
            <p className="text-sm text-gray-600">
              Khoảng thời gian cho phép nông hộ đăng ký tham gia kế hoạch. Nên đặt đủ dài để nông hộ có thời gian chuẩn bị.
            </p>
          </div>
        </div>

        {/* Mô tả */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
            <FileText className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Mô tả</h4>
            <p className="text-sm text-gray-600">
              Mô tả đầy đủ về kế hoạch, bao gồm mục tiêu, phạm vi và các yêu cầu đặc biệt.
            </p>
          </div>
        </div>

        {/* Phương pháp sơ chế */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <FaSeedling className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Phương pháp sơ chế</h4>
            <p className="text-sm text-gray-600">
              Nền tảng không hỗ trợ thu mua cà phê tươi vì khó bảo quản khi nhập kho, do đó lựa chọn này là bắt buộc.
            </p>
          </div>
        </div> 
                
        {/* Sản lượng */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Sản lượng mục tiêu</h4>
            <p className="text-sm text-gray-600">
              Số lượng cà phê cần thu mua (tính bằng kg). Đây là mục tiêu tổng thể của kế hoạch.
            </p>
          </div>
        </div>

        {/* Sản lượng đăng ký tối thiểu*/}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
            <Package className="w-4 h-4 text-orange-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Sản lượng đăng ký tối thiểu</h4>
            <p className="text-sm text-gray-600">
              Đây là sản lượng mà nông dân bắt buộc phải đăng ký từ mức được đề ra này trở lên. Tuy nhiên khi kế hoạch đã gần đạt mục tiêu sản lượng thì nông dân được phép đăng ký ít hơn để đảm bảo kế hoạch có thể hoàn thành trọn vẹn.
            </p>
          </div>
        </div>                  

        {/* Đối tượng */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Khu vực ưu tiên</h4>
            <p className="text-sm text-gray-600">
              Xác định rõ nông hộ nào có thể tham gia (theo vùng, loại cà phê, tiêu chuẩn chất lượng).
            </p>
          </div>
        </div>

        {/* Tiêu chuẩn */}
        <div className="flex gap-3">
          <div className="flex-shrink-0 w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
            <Target className="w-4 h-4 text-yellow-600" />
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-1">Tiêu chuẩn chất lượng (Mô tả trong chi tiết)</h4>
            <p className="text-sm text-gray-600">
              Các yêu cầu về chất lượng cà phê (độ ẩm, kích thước hạt, màu sắc, mùi vị).
            </p>
          </div>
        </div>
      </div>

      {/* Lưu ý quan trọng */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <div className="flex gap-2 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800 mb-2">Lưu ý quan trọng</h4>
            <ul className="text-sm text-amber-700 space-y-1">
              <li>• Kế hoạch sau khi được lưu sẽ được lưu ở trạng thái nháp (Draft)</li>
              <li>• Kế hoạch sau khi được mở đăng ký sẽ không thể chỉnh sửa được nữa</li>
              <li>• Đảm bảo thông tin chính xác trước khi lưu</li>
              <li>• Thời gian mở đơn nên phù hợp với chu kỳ sản xuất của nông hộ</li>
              <li>• Sản lượng đặt ra phải thực tế và khả thi</li>
              <li>• Nếu đã vượt thời hạn đăng ký mà sản lượng mục tiêu vẫn chưa đạt thì hệ thống sẽ tự thống kê lại ở chi tiết kế hoạch, doanh nghiệp có thể dựa vào đó để tạo kế hoạch tiếp theo</li>
              <li>• Thành tiền ước tính sẽ không bao gồm thuế</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Quy trình */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-3">Quy trình sau khi tạo kế hoạch</h4>
        <div className="space-y-2 text-sm text-blue-700">
          <div className="flex gap-2">
            <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">1</span>
            <span>Tạo kế hoạch (Draft)</span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">2</span>
            <span>Mở đăng ký cho nông hộ</span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">3</span>
            <span>Nông hộ đăng ký và cam kết sản lượng</span>
          </div>
          <div className="flex gap-2">
            <span className="w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium">4</span>
            <span>Kết thúc đăng ký và thực hiện thu mua</span>
          </div>
        </div>
      </div>
    </div>
  );
}
