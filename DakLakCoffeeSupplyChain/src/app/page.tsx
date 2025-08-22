"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { authService } from "@/lib/auth/authService";

export default function HomePage() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const isLoggedIn = authService.isAuthenticated();
    setIsLoggedIn(isLoggedIn);
  }, []);

  return (
    <main className="min-h-screen bg-[#FEFAF4] text-gray-800">
      {/* Hero Section */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-[#6F4E37] leading-tight mb-4">
              <span className="block md:inline">Liên kết nông dân &</span>{" "}
              <span className="block md:inline">doanh nghiệp, nâng tầm cà phê Việt</span>
            </h1>
            <p className="text-lg text-gray-700 mb-8">
              Nền tảng B2B giúp số hóa chuỗi cung ứng cà phê Việt Nam, truy xuất nguồn gốc,
              nâng cao chất lượng và tăng giá trị bền vững.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link href="/marketplace">
                <Button className="bg-[#FD7622] text-white px-6 py-3 hover:bg-[#e55f12] rounded-full shadow">
                  Khám phá sàn thu mua cà phê
                </Button>
              </Link>
              {!isLoggedIn && (
                <Link href="/auth/login">
                  <Button
                    variant="outline"
                    className="px-6 py-3 rounded-full border-gray-300 hover:bg-gray-100"
                  >
                    Đăng nhập
                  </Button>
                </Link>
              )}
            </div>
          </div>
          <div className="flex justify-center">
            <img
              src="/images/Coffee.png"
              className="w-full max-w-sm md:max-w-md lg:max-w-lg"
              alt="Hero Coffee"
            />
          </div>
        </div>
      </section>

      {/* Role Section */}
      <section className="bg-white py-20 px-4">
        <h2 className="text-center text-3xl font-bold text-[#6F4E37] mb-12">Vai trò trên nền tảng</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          <RoleCard
            title="Nông dân"
            color="text-green-700"
            iconSrc="https://cdn.lordicon.com/nocovwne.json"
            description="Ghi nhận mùa vụ, cập nhật quá trình trồng trọt và sơ chế. Nhận tư vấn từ chuyên gia."
          />
          <RoleCard
            title="Doanh nghiệp"
            color="text-blue-700"
            iconSrc="https://cdn.lordicon.com/rjzlnunf.json"
            description="Quản lý kế hoạch thu mua, hợp đồng, tồn kho và đánh giá chất lượng lô hàng."
          />
          <RoleCard
            title="Thị trường"
            color="text-yellow-800"
            iconSrc="https://cdn.lordicon.com/slkvcfos.json"
            description="Truy xuất nguồn gốc lô hàng, phản hồi chất lượng và phân phối B2B minh bạch."
          />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-[#FFF8F0] py-20 px-6">
        <h2 className="text-center text-3xl font-bold text-[#FD7622] mb-12">Lợi ích vượt trội</h2>
        <div className="flex flex-col space-y-10 max-w-4xl mx-auto">
          <BenefitCard
            title="Truy xuất minh bạch"
            desc="Giúp thị trường biết chính xác nguồn gốc, chất lượng và lịch sử của từng lô hàng."
            iconSrc="https://cdn.lordicon.com/cnpvyndp.json"
          />
          <BenefitCard
            title="Kết nối bền vững"
            desc="Gia tăng niềm tin giữa nông dân và doanh nghiệp thông qua hệ thống minh bạch."
            iconSrc="https://cdn.lordicon.com/uvextprq.json"
          />
          <BenefitCard
            title="Quản lý hiệu quả"
            desc="Tiết kiệm chi phí vận hành, giám sát tiến độ mùa vụ, hợp đồng và tồn kho thông minh."
            iconSrc="https://cdn.lordicon.com/gqzfzudq.json"
          />
        </div>
      </section>

      {/* Video Section */}
      <section className="bg-white py-20 px-6 text-center">
        <h2 className="text-3xl font-bold text-orange-700 mb-4">Giới thiệu hệ thống</h2>
        <p className="text-gray-600 mb-6">Hiểu rõ cách chúng tôi cải thiện chuỗi cung ứng.</p>
        <div className="max-w-3xl mx-auto aspect-video rounded-xl overflow-hidden shadow">
          <iframe
            className="w-full h-full"
            src="https://www.youtube.com/embed/YOUTUBE_VIDEO_ID"
            title="Intro"
            allowFullScreen
          />
        </div>
      </section>
    </main>
  );
}

function RoleCard({
  title,
  color,
  iconSrc,
  description,
}: {
  title: string;
  color: string;
  iconSrc: string;
  description: string;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-md hover:shadow-lg transition-all flex flex-col items-center text-center">
      <div
        dangerouslySetInnerHTML={{
          __html: `<lord-icon src="${iconSrc}" trigger="hover" colors="primary:#FD7622,secondary:#6F4E37" style="width:80px;height:80px"></lord-icon>`,
        }}
      />
      <h3 className={`text-xl font-semibold mt-4 ${color}`}>{title}</h3>
      <p className="text-gray-600 text-sm mt-2">{description}</p>
    </div>
  );
}

function BenefitCard({
  title,
  desc,
  iconSrc,
}: {
  title: string;
  desc: string;
  iconSrc: string;
}) {
  return (
    <div className="flex gap-4 items-start p-4 bg-white rounded-xl shadow hover:shadow-md transition-all">
      <div
        dangerouslySetInnerHTML={{
          __html: `<lord-icon src="${iconSrc}" trigger="hover" colors="primary:#FD7622,secondary:#6F4E37" style="width:40px;height:40px"></lord-icon>`,
        }}
      />
      <div>
        <h3 className="text-lg font-semibold text-[#FD7622]">{title}</h3>
        <p className="text-gray-600 text-sm mt-1">{desc}</p>
      </div>
    </div>
  );
}
