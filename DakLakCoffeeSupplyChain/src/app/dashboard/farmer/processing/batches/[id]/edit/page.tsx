"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AppToast } from "@/components/ui/AppToast";
import {
  getProcessingBatchById,
  updateProcessingBatch,
  ProcessingBatch,
} from "@/lib/api/processingBatches";
import {
  getCropSeasonsForCurrentUser,
  CropSeasonListItem,
} from "@/lib/api/cropSeasons";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Package, Coffee, Calendar, Info, Loader2, CheckCircle, Save, AlertTriangle } from "lucide-react";

// Import các component chung
import ProcessingHeader from "@/components/processing/ProcessingHeader";
import { ProcessingErrorDisplay } from "@/components/shared/ProcessingErrorDisplay";

export default function EditProcessingBatchPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const params = useParams();
  const batchId = params.id as string;

  const [form, setForm] = useState({
    coffeeTypeId: "",
    cropSeasonId: "",
    batchCode: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingCoffeeTypes, setLoadingCoffeeTypes] = useState(false);
  const [error, setError] = useState<any>(null);

  const [batch, setBatch] = useState<ProcessingBatch | null>(null);
  const [coffeeTypes, setCoffeeTypes] = useState<any[]>([]);
  const [cropSeasons, setCropSeasons] = useState<CropSeasonListItem[]>([]);

  // Load dữ liệu lô sơ chế
  useEffect(() => {
    async function fetchBatch() {
      try {
        setLoading(true);
        const batchData = await getProcessingBatchById(batchId);
        if (batchData) {
          setBatch(batchData);
          setForm({
            coffeeTypeId: batchData.coffeeTypeId,
            cropSeasonId: batchData.cropSeasonId,
            batchCode: batchData.batchCode,
          });
        } else {
          AppToast.error(t('processing.pages.farmerBatches.batchDetail.edit.error.notFound'));
          router.push("/dashboard/farmer/processing/batches");
        }
      } catch (err) {
        console.error("Lỗi tải dữ liệu lô:", err);
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    if (batchId) {
      fetchBatch();
    }
  }, [batchId, router]);

  // Load danh sách mùa vụ
  useEffect(() => {
    async function fetchCropSeasons() {
      try {
        const cropSeasonsData = await getCropSeasonsForCurrentUser({ page: 1, pageSize: 100 });
        setCropSeasons(cropSeasonsData);
      } catch (err) {
        console.error("Lỗi tải mùa vụ:", err);
      }
    }

    fetchCropSeasons();
  }, []);

  const handleChange = (name: string, value: string | number) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);

    const { coffeeTypeId, cropSeasonId, batchCode } = form;

    const missingFields: string[] = [];
    if (!coffeeTypeId) missingFields.push(t('processing.pages.farmerBatches.batchDetail.edit.form.coffeeType.label'));
    if (!cropSeasonId) missingFields.push(t('processing.pages.farmerBatches.batchDetail.edit.form.cropSeason.label'));
    if (!batchCode.trim()) missingFields.push(t('processing.pages.farmerBatches.batchDetail.edit.form.batchCode.label'));

    if (missingFields.length > 0) {
      AppToast.error(t('processing.pages.farmerBatches.batchDetail.edit.form.validation.missingFields', { fields: missingFields.join(", ") }));
      setIsSubmitting(false);
      return;
    }

    try {
      await updateProcessingBatch(batchId, {
        coffeeTypeId,
        cropSeasonId,
        batchCode: batchCode.trim(),
        methodId: batch?.methodId || 1,
      });

      AppToast.success(t('processing.pages.farmerBatches.batchDetail.edit.success'));
      router.push(`/dashboard/farmer/processing/batches/${batchId}`);
    } catch (err: any) {
      console.error("Lỗi cập nhật batch:", err);
      setError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-4xl mx-auto">
          {/* Header Skeleton */}
          <div className="flex items-center gap-4 mb-8">
            <div className="h-10 w-10 bg-gray-200 rounded-lg animate-pulse"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 rounded-lg w-64 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
            </div>
          </div>

          {/* Form Skeleton */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6">
              <div className="h-6 bg-white/20 rounded w-48 animate-pulse"></div>
            </div>
            <div className="p-6 space-y-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-lg animate-pulse"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Loading Indicator */}
          <div className="text-center space-y-4 mt-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="text-lg text-gray-600 font-medium">{t('processing.pages.farmerBatches.batchDetail.edit.loading.title')}</p>
            <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.edit.loading.subtitle')}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!batch) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
        <div className="p-6 max-w-4xl mx-auto">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-16 h-16 text-red-600" />
            <h1 className="text-2xl font-bold text-gray-900">{t('processing.pages.farmerBatches.batchDetail.edit.error.notFoundTitle')}</h1>
            <p className="text-gray-600">{t('processing.pages.farmerBatches.batchDetail.edit.error.notFoundMessage')}</p>
            <Button onClick={() => router.push("/dashboard/farmer/processing/batches")}>
              {t('processing.pages.farmerBatches.batchDetail.edit.error.backToList')}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="p-6 max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <ProcessingHeader
          title={t('processing.pages.farmerBatches.batchDetail.edit.title')}
          description={t('processing.pages.farmerBatches.batchDetail.edit.description')}
          showCreateButton={false}
        />

        {/* Error Display */}
        {error && <ProcessingErrorDisplay error={error} />}

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => router.back()}
            className="flex items-center gap-2 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('processing.pages.farmerBatches.batchDetail.edit.back')}
          </Button>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-blue-900">{t('processing.pages.farmerBatches.batchDetail.edit.guidance.title')}</h3>
              <p className="text-sm text-blue-700">
                {t('processing.pages.farmerBatches.batchDetail.edit.guidance.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="bg-gradient-to-r from-green-500 to-blue-500 p-6 text-white">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Package className="w-5 h-5" />
              {t('processing.pages.farmerBatches.batchDetail.edit.form.title')}
            </h2>
          </div>

          <div className="p-6 space-y-6">
            {/* Mã lô (Read-only) */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Package className="w-4 h-4 text-purple-600" />
                {t('processing.pages.farmerBatches.batchDetail.edit.form.batchCode.label')}
              </label>
              <Input
                value={batch.batchCode}
                disabled
                className="h-12 border-gray-200 bg-gray-50 text-gray-500"
              />
              <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.edit.form.batchCode.help')}</p>
            </div>

            {/* Mùa vụ */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-green-600" />
                {t('processing.pages.farmerBatches.batchDetail.edit.form.cropSeason.label')}
              </label>
              <Select
                value={form.cropSeasonId}
                onValueChange={(v) => handleChange("cropSeasonId", v)}
              >
                <SelectTrigger className="w-full h-12 border-gray-200 hover:border-green-300 focus:border-green-500 transition-colors">
                  <SelectValue placeholder={t('processing.pages.farmerBatches.batchDetail.edit.form.cropSeason.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {cropSeasons.map((cs) => (
                    <SelectItem key={cs.cropSeasonId} value={cs.cropSeasonId || ""}>
                      {cs.seasonName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Loại cà phê */}
            <div className="space-y-2">
                             <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                 <Coffee className="w-4 h-4 text-orange-600" />
                 {t('processing.pages.farmerBatches.batchDetail.edit.form.coffeeType.label')}
               </label>
               <Input
                 value={batch.typeName || t('processing.pages.farmerBatches.batchDetail.edit.form.coffeeType.unknown')}
                 disabled
                 className="h-12 border-gray-200 bg-gray-50 text-gray-500"
               />
               <p className="text-sm text-gray-500">{t('processing.pages.farmerBatches.batchDetail.edit.form.coffeeType.help')}</p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8 py-3 rounded-lg flex items-center gap-2 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                                 {isSubmitting ? (
                   <>
                     <Loader2 className="w-5 h-5 animate-spin" />
                     {t('processing.pages.farmerBatches.batchDetail.edit.form.submit.updating')}
                   </>
                 ) : (
                   <>
                     <Save className="w-5 h-5" />
                     {t('processing.pages.farmerBatches.batchDetail.edit.form.submit.update')}
                   </>
                 )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
