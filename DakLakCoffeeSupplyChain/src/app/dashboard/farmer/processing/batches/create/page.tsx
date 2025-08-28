"use client";

import React from "react";
import { useTranslation } from "react-i18next";
import ProcessingBatchForm from "@/components/processing-batches/ProcessingBatchForm";

export default function CreateProcessingBatchPage() {
  const { t } = useTranslation();
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100">
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg border border-orange-200 p-6">
          <div className="border-b border-orange-200 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 mb-2">{t('processing.pages.farmerBatches.batchDetail.create.title')}</h1>
            <p className="text-gray-600">{t('processing.pages.farmerBatches.batchDetail.create.description')}</p>
          </div>

          <ProcessingBatchForm />
        </div>
      </div>
    </div>
  );
}
