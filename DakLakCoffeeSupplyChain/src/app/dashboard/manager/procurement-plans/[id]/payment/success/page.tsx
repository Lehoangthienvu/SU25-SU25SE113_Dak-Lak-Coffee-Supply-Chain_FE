"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, ArrowLeft, ExternalLink } from 'lucide-react';
import { AppToast } from '@/components/ui/AppToast';

export default function PaymentSuccessPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    // Đếm ngược 5 giây rồi chuyển về trang danh sách
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          router.push('/dashboard/manager/procurement-plans');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [router]);

  const handleGoToPlans = () => {
    router.push('/dashboard/manager/procurement-plans');
  };

  const handleViewPlan = () => {
    router.push(`/dashboard/manager/procurement-plans/${id}`);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <Card className="text-center">
        <CardHeader className="pb-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <CheckCircle className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl text-green-600">
            Thanh toán thành công!
          </CardTitle>
          <CardDescription className="text-lg">
            Kế hoạch đã được mở đăng ký thành công
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-semibold text-green-800 mb-2">Kế hoạch đã được kích hoạt</h3>
            <p className="text-sm text-green-700">
              Kế hoạch của bạn đã được chuyển sang trạng thái "Mở" và nông dân có thể bắt đầu đăng ký tham gia.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Những gì xảy ra tiếp theo:</h4>
            <ul className="text-sm text-gray-600 space-y-1 text-left">
              <li>• Kế hoạch sẽ hiển thị trên sàn thu mua cà phê</li>
              <li>• Nông dân có thể đăng ký tham gia kế hoạch</li>
              <li>• Bạn có thể theo dõi tiến độ đăng ký trong trang chi tiết</li>
              <li>• Kế hoạch sẽ tự động đóng khi đủ số lượng đăng ký</li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              onClick={handleViewPlan}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Xem kế hoạch
            </Button>
            <Button
              onClick={handleGoToPlans}
              variant="outline"
              className="flex-1"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Danh sách kế hoạch
            </Button>
          </div>

          <p className="text-xs text-gray-500">
            Tự động chuyển về danh sách kế hoạch sau {countdown} giây...
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
