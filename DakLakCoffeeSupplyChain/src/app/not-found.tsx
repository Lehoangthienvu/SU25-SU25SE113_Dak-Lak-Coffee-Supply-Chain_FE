import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-[#6F4E37] mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Không tìm thấy trang</h2>
        <p className="text-gray-600 mb-8">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="space-x-4">
          <Link href="/">
            <Button className="bg-[#FD7622] text-white px-6 py-3 hover:bg-[#e55f12] rounded-full">
              Về trang chủ
            </Button>
          </Link>
          <Link href="/marketplace">
            <Button variant="outline" className="px-6 py-3 rounded-full border-gray-300 hover:bg-gray-100">
              Khám phá sàn thu mua
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
