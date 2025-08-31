"use client";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  getAllAvailableProcurementPlans,
  ProcurementPlan,
} from "@/lib/api/procurementPlans";
import Link from "next/dist/client/link";
import { useEffect, useState } from "react";
import { differenceInCalendarDays } from "date-fns";
import { usePathname } from "next/navigation";
import { getTargetRegionOptions } from "@/lib/constants/targetRegion";
import { useTranslation } from "react-i18next";

export default function MarketplacePage() {
  const { t } = useTranslation();
  const [plans, setPlans] = useState<ProcurementPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    coffeeType: "",
    region: "",
    minQuantity: "",
    maxQuantity: "",
    minPrice: "",
    maxPrice: "",
  });
  const pathname = usePathname();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const data = await getAllAvailableProcurementPlans().catch((error) => {
      //AppToast.error(getErrorMessage(error));
      console.error(error);
      return [];
    });
    setPlans(data);
    console.log(data);
    setLoading(false);
  };

  const filteredPlans = plans.filter((plan) => {
    // Kiểm tra ngày kết thúc
    if (differenceInCalendarDays(new Date(plan.endDate), new Date()) <= 0) {
      return false;
    }

    // Kiểm tra search
    if (search && !plan.title.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    // Kiểm tra filter loại cà phê
    if (filters.coffeeType && !plan.procurementPlansDetails.some(detail => 
      detail.coffeeType?.typeName === filters.coffeeType
    )) {
      return false;
    }

    // Kiểm tra filter khu vực
    if (filters.region && !plan.procurementPlansDetails.some(detail => 
      detail.targetRegion === filters.region
    )) {
      return false;
    }

    // Kiểm tra filter sản lượng
    if (filters.minQuantity && plan.totalQuantity < Number(filters.minQuantity)) {
      return false;
    }
    if (filters.maxQuantity && plan.totalQuantity > Number(filters.maxQuantity)) {
      return false;
    }

    // Kiểm tra filter giá
    if (filters.minPrice && !plan.procurementPlansDetails.some(detail => 
      detail.minPriceRange && detail.minPriceRange >= Number(filters.minPrice)
    )) {
      return false;
    }
    if (filters.maxPrice && !plan.procurementPlansDetails.some(detail => 
      detail.maxPriceRange && detail.maxPriceRange <= Number(filters.maxPrice)
    )) {
      return false;
    }

    return true;
  });

  // Hàm lấy danh sách các loại cà phê duy nhất
  const getUniqueCoffeeTypes = () => {
    const types = new Set<string>();
    plans.forEach(plan => {
      plan.procurementPlansDetails.forEach(detail => {
        if (detail.coffeeType?.typeName) {
          types.add(detail.coffeeType.typeName);
        }
      });
    });
    return Array.from(types).sort();
  };

  // Hàm reset filters
  const resetFilters = () => {
    setFilters({
      coffeeType: "",
      region: "",
      minQuantity: "",
      maxQuantity: "",
      minPrice: "",
      maxPrice: "",
    });
  };

  // Hàm tạo đường dẫn cho nút "Xem chi tiết"
  const getDetailLink = (planId: string) => {
    if (pathname.startsWith('/dashboard/farmer/market-place')) {
      return `/dashboard/farmer/market-place/${planId}`;
    }
    return `/marketplace/${planId}`;
  };

  if (loading) {
    return <p className='text-center py-20'>{t('marketplace.pages.loading')}</p>;
  }
  if (plans.length == 0 && !loading) {
    return (
      <div className='min-h-screen flex flex-col items-center justify-center py-20 bg-[#fefaf4]'>
        <p className='text-gray-600 text-lg mb-4'>
          {t('marketplace.pages.noPlans.title')}
        </p>
        <Button
          onClick={fetchData}
          className='bg-orange-600 hover:bg-orange-700 text-white px-6 py-2 rounded'
        >
          {t('marketplace.pages.noPlans.reloadButton')}
        </Button>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-[#fff7ed] py-8'>
      <div className='max-w-7xl mx-auto px-4 md:px-6 flex justify-center'>
        <div className='flex w-full max-w-[1200px] gap-8'>
          <aside className='w-64 flex flex-col space-y-4'>
            <div className='bg-white rounded-xl shadow-sm p-4 space-y-4'>
              <h2 className='text-sm font-medium text-gray-700'>
                {t('marketplace.components.searchSection.title')}
              </h2>
              <div className='relative'>
                <Input
                  placeholder={t('marketplace.components.searchSection.placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className='pr-10'
                />
              </div>
            </div>

            {/* Filter Card */}
            <div className='bg-white rounded-xl shadow-sm p-4 space-y-4'>
              <div className='flex items-center justify-between'>
                <h2 className='text-sm font-medium text-gray-700'>
                  {t('marketplace.components.filterSection.title')}
                </h2>
                <Button
                  onClick={resetFilters}
                  variant='secondaryGradient'
                  size='sm'
                  className='text-xs px-2 py-1 h-7'
                >
                  {t('marketplace.components.filterSection.resetButton')}
                </Button>
              </div>

              {/* Loại cà phê */}
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-2'>
                  {t('marketplace.components.filterSection.coffeeType.label')}
                </label>
                <select
                  value={filters.coffeeType}
                  onChange={(e) => setFilters({ ...filters, coffeeType: e.target.value })}
                  className='w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-orange-500 focus:ring-orange-500'
                >
                  <option value=''>{t('marketplace.components.filterSection.coffeeType.allTypes')}</option>
                  {getUniqueCoffeeTypes().map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {/* Khu vực */}
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-2'>
                  {t('marketplace.components.filterSection.region.label')}
                </label>
                <select
                  value={filters.region}
                  onChange={(e) => setFilters({ ...filters, region: e.target.value })}
                  className='w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:border-orange-500 focus:ring-orange-500'
                >
                  <option value=''>{t('marketplace.components.filterSection.region.allRegions')}</option>
                  {getTargetRegionOptions().map((region) => (
                    <option key={region.value} value={region.value}>
                      {region.label}
                    </option>
                  ))}
                </select>
              </div>

                             {/* Sản lượng */}
               <div>
                 <label className='block text-xs font-medium text-gray-600 mb-2'>
                   {t('marketplace.components.filterSection.quantity.label')}
                 </label>
                 <div className='space-y-3'>
                   <div className='flex justify-between text-xs text-gray-500'>
                     <span>{t('marketplace.components.filterSection.quantity.fromValue', { value: filters.minQuantity || '0' })}</span>
                     <span>{t('marketplace.components.filterSection.quantity.toValue', { value: filters.maxQuantity || '100,000' })}</span>
                   </div>
                   <div className='relative'>
                     <input
                       type='range'
                       min='0'
                       max='100000'
                       step='1000'
                       value={filters.minQuantity || '0'}
                       onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
                       className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
                     />
                     <input
                       type='range'
                       min='0'
                       max='100000'
                       step='1000'
                       value={filters.maxQuantity || '100000'}
                       onChange={(e) => setFilters({ ...filters, maxQuantity: e.target.value })}
                       className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mt-2'
                     />
                   </div>
                   <div className='flex gap-2'>
                     <Input
                       type='number'
                       placeholder={t('marketplace.components.filterSection.quantity.fromPlaceholder')}
                       value={filters.minQuantity}
                       onChange={(e) => setFilters({ ...filters, minQuantity: e.target.value })}
                       //className='flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:border-orange-500 focus:ring-orange-500'
                     />
                     <Input
                       type='number'
                       placeholder={t('marketplace.components.filterSection.quantity.toPlaceholder')}
                       value={filters.maxQuantity}
                       onChange={(e) => setFilters({ ...filters, maxQuantity: e.target.value })}
                       //className='flex-1 text-xs border border-gray-300 rounded px-2 py-1 focus:border-orange-500 focus:ring-orange-500'
                     />
                   </div>
                 </div>
               </div>

              {/* Giá thu mua */}
              <div>
                <label className='block text-xs font-medium text-gray-600 mb-2'>
                  {t('marketplace.components.filterSection.price.label')}
                </label>
                <div className='space-y-3'>
                  <div className='flex justify-between text-xs text-gray-500'>
                    <span>{t('marketplace.components.filterSection.price.fromValue', { value: filters.minPrice ? Number(filters.minPrice).toLocaleString() : '0' })}</span>
                    <span>{t('marketplace.components.filterSection.price.toValue', { value: filters.maxPrice ? Number(filters.maxPrice).toLocaleString() : '10,000,000,000' })}</span>
                  </div>
                  <div className='relative'>
                    <input
                      type='range'
                      min='0'
                      max='10000000000'
                      step='1000'
                      value={filters.minPrice || '0'}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                      className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider'
                    />
                    <input
                      type='range'
                      min='0'
                      max='10000000000'
                      step='1000'
                      value={filters.maxPrice || '10000000000'}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                      className='w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider mt-2'
                    />
                  </div>
                  <div className='flex gap-2'>
                    <Input
                      type='number'
                      placeholder={t('marketplace.components.filterSection.price.fromPlaceholder')}
                      value={filters.minPrice}
                      onChange={(e) => setFilters({ ...filters, minPrice: e.target.value })}
                    />
                    <Input
                      type='number'
                      placeholder={t('marketplace.components.filterSection.price.toPlaceholder')}
                      value={filters.maxPrice}
                      onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Hiển thị số kết quả */}
              <div className='pt-2 border-t border-gray-200'>
                <p className='text-xs text-gray-500 text-center'>
                  {t('marketplace.components.filterSection.resultsCount', { count: filteredPlans.length })}
                </p>
              </div>
            </div>
          </aside>
          <main className='flex-1'>
            {filteredPlans.length === 0 && <p>{t('marketplace.pages.noResults')}</p>}

            <div className='space-y-5'>
              {filteredPlans.map((plan) => (
                <Card
                  key={plan.planId}
                  className='max-w-4xl mx-auto bg-white p-6 shadow hover:shadow-md transition'
                >
                  <div className='flex justify-between mb-3'>
                    <div>
                      <h3 className='text-xl font-semibold text-orange-600'>
                        {plan.title}
                      </h3>
                      <p className='text-gray-600 mt-1 line-clamp-3 break-words'>
                        {plan.description}
                      </p>
                    </div>
                    <div className='w-48 flex flex-col space-y-2 text-right text-sm text-gray-700 flex-shrink-0'>
                      <p>
                        <span className='font-semibold'>{t('marketplace.components.planCard.quantity')}</span>{" "}
                        {plan.totalQuantity} kg
                      </p>
                      <p>
                        <span className='font-semibold'>
                          {t('marketplace.components.planCard.deadlineRemaining')}
                        </span>{" "}
                        {Math.max(
                          differenceInCalendarDays(
                            new Date(plan.endDate),
                            new Date()
                          ),
                          0
                        )}{" "}
                        {t('marketplace.components.planCard.days')}
                      </p>
                      {/* <p>
                        <span className='font-semibold'>Trạng thái:</span>{" "}
                        <span
                          className={
                            plan.status === "Open"
                              ? "text-green-600 font-semibold"
                              : "text-gray-500"
                          }
                        >
                          {plan.status}
                        </span>
                      </p> */}
                      <p>
                        <span className='font-semibold'>{t('marketplace.components.planCard.registered')}</span>{" "}
                        {plan.progressPercentage.toFixed(2)}%
                      </p>
                    </div>
                  </div>

                  {/* Thông tin doanh nghiệp */}
                  {/* <div className='mb-4 border-t border-gray-200 pt-4'>
                    <h4 className='font-semibold text-lg'>Doanh nghiệp</h4>
                    <p className='text-orange-700 font-medium'>
                      {plan.createdBy.companyName}
                    </p>
                    <p>{plan.createdBy.companyAddress}</p>
                    {plan.createdBy.website && (
                      <Link
                        href={plan.createdBy.website}
                        target='_blank'
                        className='text-blue-600 hover:underline'
                      >
                        Website
                      </Link>
                    )}
                  </div> */}

                  {/* Chi tiết kế hoạch theo loại cà phê */}
                  <div>
                    <h4 className='font-semibold text-lg mb-2'>
                      {t('marketplace.components.planCard.planDetails')}
                    </h4>
                    <table className='w-full text-left border-collapse'>
                      <thead className='bg-gray-100 text-gray-700 font-medium'>
                        <tr>
                          <th className='border-b border-gray-300 px-3 py-2'>
                            {t('marketplace.components.planTable.headers.coffeeType')}
                          </th>
                          <th className='border-b border-gray-300 px-3 py-2'>
                            {t('marketplace.components.planTable.headers.processingMethod')}
                          </th>
                          <th className='border-b border-gray-300 px-3 py-2'>
                            {t('marketplace.components.planTable.headers.quantity')}
                          </th>
                          <th className='border-b border-gray-300 px-3 py-2'>
                            {t('marketplace.components.planTable.headers.targetRegion')}
                          </th>
                          <th className='border-b border-gray-300 px-3 py-2'>
                            {t('marketplace.components.planTable.headers.price')}
                          </th>
                          <th className='border-b border-gray-300 px-3 py-2'>
                            {t('marketplace.components.planTable.headers.note')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {plan.procurementPlansDetails.map((detail) => (
                          <tr
                            key={detail.planDetailsId}
                            className='border-t hover:bg-gray-50'
                          >
                            <td className='px-3 py-2'>
                              {detail.coffeeType?.typeName}
                            </td>
                            <td className='px-3 py-2'>
                              {detail.processingMethodName ? (
                                <>{detail.processingMethodName}</>
                              ) : (
                                <>{t('marketplace.components.planTable.noProcessingMethod')}</>
                              )}
                            </td>
                            <td className='px-3 py-2'>
                              {detail.targetQuantity}
                            </td>
                            <td className='px-3 py-2'>{detail.targetRegion}</td>
                            <td className='px-3 py-2'>
                              {detail.minPriceRange?.toLocaleString()} -{" "}
                              {detail.maxPriceRange?.toLocaleString()}
                            </td>
                            <td className='px-3 py-2'>{detail.note}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Nút xem chi tiết (dẫn đến trang chi tiết kế hoạch) */}
                  <div className='mt-4 text-right'>
                    <Link
                      href={getDetailLink(plan.planId)}
                      className='inline-block bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-md transition'
                    >
                      {t('marketplace.components.planCard.viewDetails')}
                    </Link>
                  </div>
                </Card>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
