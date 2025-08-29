"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { FiInfo, FiCheckCircle} from "react-icons/fi";

export default function RegistrationGuideCard() {
  return (
    <Card className="w-full p-6 rounded-xl shadow-lg">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
            <FiInfo className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-blue-800">
              Hướng dẫn đăng ký
            </h3>
            <p className="text-sm text-blue-600">
              Tham gia kế hoạch thu mua cà phê
            </p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Bước 1 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">1</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Diện tích đăng ký</h4>
              <p className="text-sm text-blue-700">
                Đây là thông tin về diện tích đất trồng cho toàn bộ các chi tiết kế hoạch mà bạn đã đăng ký. Đơn vị tính bằng hecta(ha).
              </p>
            </div>
          </div>

          {/* Bước 2 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">2</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Chọn chi tiết kế hoạch</h4>
              <p className="text-sm text-blue-700">
                Chọn chi tiết kế hoạch mà bạn muốn đăng ký bán.
              </p>
            </div>
          </div>

          {/* Bước 3 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">3</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Nhập thông tin chi tiết</h4>
              <p className="text-sm text-blue-700">
                Điền đầy đủ thông tin về sản lượng, giá cả và thời gian thu hoạch
              </p>
            </div>
          </div>

          {/* Bước 4 */}
          <div className="flex items-start gap-3">
            <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-blue-700">4</span>
            </div>
            <div>
              <h4 className="font-medium text-blue-800 mb-1">Gửi đăng ký</h4>
              <p className="text-sm text-blue-700">
                Kiểm tra lại thông tin và gửi đăng ký để doanh nghiệp xem xét
              </p>
            </div>
          </div>
        </div>

        {/* Lưu ý quan trọng */}
        <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
          <h4 className="font-medium text-yellow-800 mb-2 flex items-center gap-2">
            <FiInfo className="h-4 w-4" />
            Lưu ý quan trọng
          </h4>
          <ul className="space-y-2 text-sm text-yellow-700">
            <li className="flex items-start gap-2">
              <FiCheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Chỉ nông dân mới có thể đăng ký tham gia</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Cần đăng nhập để thực hiện đăng ký</span>
            </li>
            <li className="flex items-start gap-2">
              <FiCheckCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <span>Thông tin đăng ký sẽ được doanh nghiệp xem xét</span>
            </li>
          </ul>
        </div>

        {/* Thông tin liên hệ */}
        <div className="mt-4 p-3 bg-blue-100 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            Cần hỗ trợ? Liên hệ với doanh nghiệp để được tư vấn chi tiết.
          </p>
        </div>
      </Card>
  );
}
